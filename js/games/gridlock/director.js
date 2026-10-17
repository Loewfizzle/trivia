// GRIDLOCK — authority state machine (PURE; see cipher/director.js for the pattern).
//
//   place ─► (volley) ─► resolve ─► show ─► (volley) … ─► end ─► final
//   a volley is Classic `turn` (one player, one shot) or Battle Royale `aim` (everyone locks a shot, all resolve together)
//
// The host never sees anyone's unhit ships: shots are resolved by the target's own client (or the host from its
// private copy as a fallback — index.js#prepare) and arrive as glres/{m}/{rk}/{target}; this director only folds those
// public results into the boards. Every transition is a pure function of (game, live, now) so a replay is harmless.
import {
  cleanSettings, boardSize, fleetFor, aliveOf, boardOf, isShot, randomShot, decodeAim, shotKey, applyResolution,
  bountyHolder, pointsFor, showMs, callBonus, SKIP_OFFLINE_MS, RESOLVE_CAP_MS, END_MS, ROYALE_ROUND_CAP, CLASSIC_VOLLEY_CAP,
} from './logic.js';
import { rngFrom, shuffle } from '../../core/rng.js';

export function createGame({ matchId, settings, participants, names, now }) {
  const s = cleanSettings(settings);
  const uids = Object.keys(participants);
  const size = boardSize(uids.length);
  return {
    id: 'gridlock',
    matchId,
    settings: s,
    mode: s.mode,
    participants,
    names: names || {},
    size,
    fleet: fleetFor(size),
    n0: uids.length,
    order: shuffle(rngFrom(`${matchId}:order`), uids.slice().sort()),
    phase: 'place',
    phaseStartAt: now,
    phaseEndsAt: now + s.placeSec * 1000,
    v: 0,
    rk: '0',
    round: 0,
    ti: -1,
    cur: null,
  };
}

const validShot = (game, shooter, sh) => !!sh && typeof sh.t === 'string' && sh.t !== shooter && game.participants[sh.t] && !(game.out && game.out[sh.t])
  && Number.isInteger(sh.r) && Number.isInteger(sh.c) && sh.r >= 0 && sh.c >= 0 && sh.r < game.size && sh.c < game.size && !isShot(boardOf(game, sh.t), sh.r, sh.c);

/** ctx: { code, now, online: { uid: bool }, live: { shots, res, ready, calls } } */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'gridlock') return null;
  const { now } = ctx;
  const live = ctx.live || {};
  const online = ctx.online || {};
  switch (game.phase) {
    case 'place': {
      const ready = live.ready || {};
      const all = Object.keys(game.participants).every(u => ready[u]);
      if (now < game.phaseEndsAt && !all) return null;
      return startVolley(game, now, {});
    }

    case 'turn': {
      const cur = game.cur;
      const sh = (live.shots || {})[cur];
      if (sh && validShot(game, cur, sh)) return toResolve(game, now, { [cur]: [{ t: sh.t, r: sh.r, c: sh.c }] });
      if (!online[cur] && now - game.phaseStartAt >= SKIP_OFFLINE_MS) return startVolley(game, now, {});   // gone: skipped
      if (now < game.phaseEndsAt) return null;
      const rs = randomShot(game, cur, rngFrom(`${game.matchId}:${game.rk}:auto`));                      // slow: fired for them
      return rs ? toResolve(game, now, { [cur]: [rs] }) : startVolley(game, now, {});
    }

    case 'aim': {
      const alive = aliveOf(game);
      const shots = live.shots || {};
      const fire = {};
      for (const u of alive) {
        const n = shots[u];
        if (!n || !n.t) continue;
        const cell = n.x ? decodeAim(n.x, shotKey(ctx.code, game.matchId, game.rk, u)) : { r: n.r, c: n.c };
        const sh = cell && { t: n.t, r: cell.r, c: cell.c };
        if (validShot(game, u, sh)) fire[u] = [sh];
      }
      const waiting = alive.filter(u => online[u] && !shots[u]);
      if (now < game.phaseEndsAt && waiting.length) return null;
      return Object.keys(fire).length ? toResolve(game, now, fire) : startVolley(game, now, {});
    }

    case 'resolve': {
      const fire = game.fire || {};
      const targets = [...new Set(Object.values(fire).flat().map(s => s.t))];
      const res = live.res || {};
      const have = targets.filter(t => res[t]);
      if (have.length < targets.length && now < game.phaseEndsAt) return null;
      return applyVolley(game, now, fire, res, targets);
    }

    case 'show': {
      if (now < game.phaseEndsAt) return null;
      if (game.done) return { phase: 'end', phaseStartAt: now, phaseEndsAt: now + END_MS, fire: null };
      return startVolley(game, now, {});
    }

    case 'end': {
      if (now < game.phaseEndsAt) return null;
      const results = {};
      for (const uid of Object.keys(game.participants)) {
        const s = (game.stats && game.stats[uid]) || {};
        results[uid] = { pts: (game.pts && game.pts[uid]) || 0, sh: s.sh || 0, hi: s.hi || 0, sk: s.sk || 0, el: s.el || 0, acc: s.sh ? Math.round(100 * (s.hi || 0) / s.sh) : 0 };
      }
      const calls = {};
      const winner = game.winner || aliveOf(game)[0] || null;
      for (const [uid, c] of Object.entries(live.calls || {})) {
        if (!c || !c.w || !game.out || !game.out[uid]) continue;
        const ok = !!winner && c.w === winner;
        calls[uid] = { w: c.w, ok, bonus: ok ? callBonus(game.out[uid].rem) : 0 };
      }
      return { phase: 'final', phaseStartAt: now, phaseEndsAt: null, results, calls };
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------- transitions
function startVolley(game, now, patch) {
  const alive = aliveOf(game);
  const v = (game.v || 0) + 1;
  patch.v = v;
  patch.rk = String(v);
  patch.fire = null;
  patch.phaseStartAt = now;
  patch.phaseEndsAt = now + game.settings.turnSec * 1000;
  if (game.mode === 'royale') {
    patch.round = (game.round || 0) + 1;
    patch.phase = 'aim';
    patch.cur = null;
  } else {
    // the next alive player in the seeded order
    const order = game.order;
    let ti = game.ti == null ? -1 : game.ti;
    for (let k = 0; k < order.length; k++) {
      ti = (ti + 1) % order.length;
      if (alive.includes(order[ti])) break;
    }
    patch.ti = ti;
    patch.cur = order[ti];
    patch.phase = 'turn';
  }
  return patch;
}

function toResolve(game, now, fire) {
  return { phase: 'resolve', phaseStartAt: now, phaseEndsAt: now + RESOLVE_CAP_MS, fire };
}

function applyVolley(game, now, fire, res, targets) {
  const patch = {};
  const pts = { ...(game.pts || {}) };
  const stats = JSON.parse(JSON.stringify(game.stats || {}));
  const st = u => (stats[u] ||= { sh: 0, hi: 0, sk: 0, el: 0 });
  const events = [];
  const eliminated = [];
  const bounty = game.bounty || null;
  // shots fired
  for (const [by, list] of Object.entries(fire)) st(by).sh += list.length;
  for (const t of targets) {
    const { board, events: ev, credit, eliminated: dead } = applyResolution(game, t, fire, res[t] || { r: {}, k: {} });
    patch[`boards/${t}`] = board;
    events.push(...ev);
    for (const [by, c] of Object.entries(credit)) {
      const p = pointsFor(c, t === bounty);
      pts[by] = (pts[by] || 0) + p;
      st(by).hi += c.hits; st(by).sk += c.sunk; st(by).el += c.elim;
      if (p) events.push({ k: 'pts', by, p, t, bounty: t === bounty });
    }
    if (dead) eliminated.push(t);
  }
  // eliminations: the weaker (fewer points) goes out first when several fall in one volley
  const out = { ...(game.out || {}) };
  let alive = aliveOf(game).length;
  eliminated.sort((a, b) => (pts[a] || 0) - (pts[b] || 0) || (a < b ? -1 : 1));
  for (const t of eliminated) {
    const by = (events.find(e => e.k === 'elim' && e.t === t) || {}).by || [];
    out[t] = { at: now, place: alive, rem: alive - 1, by };
    patch[`out/${t}`] = out[t];
    alive--;
  }
  const next = { ...game, pts, out };
  let done = false, winner = null, capped = false;
  const left = aliveOf(next);
  if (left.length <= 1) { done = true; winner = left[0] || null; }
  else if ((game.mode === 'royale' && game.round >= ROYALE_ROUND_CAP) || (game.mode !== 'royale' && game.v >= Math.min(CLASSIC_VOLLEY_CAP, game.size * game.size) * game.n0)) {
    // the safety cap: most ship cells left wins, points break ties
    const boards = { ...(game.boards || {}) };
    for (const t of targets) boards[t] = patch[`boards/${t}`];
    const rank = left.slice().sort((a, b) => (boardOf({ ...next, boards }, b).left - boardOf({ ...next, boards }, a).left) || ((pts[b] || 0) - (pts[a] || 0)) || (a < b ? -1 : 1));
    let place = rank.length;
    for (let i = rank.length - 1; i >= 1; i--) { patch[`out/${rank[i]}`] = { at: now, place, rem: place - 1, by: [], cap: true }; next.out[rank[i]] = patch[`out/${rank[i]}`]; place--; }
    done = true; capped = true; winner = rank[0];
  }
  patch.pts = pts;
  patch.stats = stats;
  patch.ev = events;
  patch.bounty = bountyHolder(next) || null;
  patch.phase = 'show';
  patch.phaseStartAt = now;
  patch.phaseEndsAt = now + showMs(events) + (done ? 1200 : 0);
  patch.done = done;
  if (done) { patch.winner = winner; patch.capped = capped; }
  return patch;
}

/** Game-night bonus points (Call the Winner): { uid: points }. */
export function nightBonus(game) {
  const out = {};
  for (const [uid, c] of Object.entries(game.calls || {})) if (c && c.ok && c.bonus > 0) out[uid] = c.bonus;
  return out;
}
