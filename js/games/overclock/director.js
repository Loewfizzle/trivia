// OVERCLOCK — authority state machine (pure).
// Phases: ready (rules card the first time a type appears) -> play (30 s) -> standings -> ready … -> final
import { READY_MS, BRIEF_MS, CHALLENGE_MS, FINAL_MS, PLAY_GRACE_MS, SKIP_MIN_MS, MODES, buildOrder, computeResults, standingsMs, comboFold, marksFor, roundWin, packRoundWin, comboReachAt, levelOf } from './logic.js';
import { partsFor } from './challenges.js';
import { keysAt } from './deal.js';
import { markUsed } from '../kit/night.js';
import { readyState } from '../kit/ready.js';
import { LUCK, DL_MS, DL_PICK_MS, DL_RACE_MS, DL_FINISH_MS, dlLock, dlOf } from './luck.js';

/**
 * order: the match's challenges (default: buildOrder from the seed + `played`, the types this room played tonight);
 * deal / dk: THE ROOM's NIGHT MEMORY's deal (deal.js#dealMatch — the items each challenge shows + their keys).
 * OC7 — TRIVIA LIGHTNING deals from OVERCLOCK's OWN bank (data/oc/trivia.json) like every other pool: its three question IDS are in the deal —
 * no question bank in the room, no live Trivia API, no top-up, nothing to wait for (a `bank` / `trivia` argument is ignored).
 */
export function createGame({ matchId, settings, participants, now, seed, order = null, played = [], deal = null, dk = null }) {
  const total = MODES[settings.mode] || MODES.quick;
  // (DUMB LUCK only with 2+ players — never in SOLO: logic.js#buildOrder)
  const ord = Array.isArray(order) && order.length === total ? order : buildOrder(seed, total, played, { luck: Object.keys(participants || {}).length >= 2 });
  const first = ord[0];
  const game = {
    id: 'overclock',
    matchId,
    settings,
    seed,
    total,
    order: ord,
    participants,
    ci: 0,
    ck: '0',
    phase: 'ready',
    brief: true,
    phaseStartAt: now,
    phaseEndsAt: now + BRIEF_MS,
    seen: { [first]: true },
  };
  if (deal && Object.keys(deal).length) game.deal = deal;
  if (dk && Object.keys(dk).length) game.dk = dk;
  return game;
}

/** the combo after challenge ci closes, for every participant ({ uid: { c, m } }) */
export function comboAfter(game, ctx) {
  const type = game.order[game.ci];
  const parts = partsFor(type, game.total <= 1 ? 0 : game.ci / (game.total - 1));
  const out = {};
  for (const uid of Object.keys(game.participants || {})) {
    const prev = (game.combo && game.combo[uid]) || { c: 0, m: 0 };
    out[uid] = comboFold(prev, marksFor(type, ctx.marks && ctx.marks[uid], ctx.boards && ctx.boards[uid], parts));
  }
  return out;
}

/** each participant's time on challenge ci (ms from playStartAt to their doneAt, 0 … CHALLENGE_MS; not finished = CHALLENGE_MS) — PURE */
export function timesOf(game, boards) {
  const out = {};
  for (const uid of Object.keys(game.participants || {})) {
    const b = boards && boards[uid];
    const t = b && b.done && typeof b.doneAt === 'number' ? b.doneAt - (game.playStartAt || 0) : CHALLENGE_MS;
    out[uid] = Math.round(Math.max(0, Math.min(CHALLENGE_MS, t)));
  }
  return out;
}

/** ctx: { now, boards, online, marks?, next? } — marks = this challenge's combo marks, next = the after-challenge taps */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'overclock') return null;
  const { now } = ctx;
  const ends = game.phaseEndsAt || 0;
  const type = game.order[game.ci];

  switch (game.phase) {
    case 'ready': {
      if (now < ends) return null;
      // THE ROOM's NIGHT MEMORY: the challenge going live marks its type + its dealt items for the rest of the night (kit/night.js)
      // (DUMB LUCK's slot: the odds board + the race + the finish — DL_MS, inside CHALLENGE_MS; it never ends early)
      return { phase: 'play', phaseStartAt: now, playStartAt: now, phaseEndsAt: now + (type === LUCK ? DL_MS : CHALLENGE_MS), $room: markUsed('overclock', keysAt(game, game.ci)) };
    }
    case 'play': {
      const uids = Object.keys(game.participants || {});
      if (type === LUCK) {
        // DUMB LUCK: the odds board closes → THE LOCK + THE DRAW (once — a new host reads the stored race, never re-draws); the race + the
        // finish play out from the lock; then the shared flow (the results below)
        const dl = dlOf(game, game.ci);
        if (!dl) return now >= (game.playStartAt || 0) + DL_PICK_MS ? { [`dl/${game.ci}`]: dlLock(game, game.ci, ctx.boards || {}, now) } : null;
        if (now < dl.lk + DL_RACE_MS + DL_FINISH_MS) return null;
      } else {
        const active = uids.filter(u => ctx.online[u]);
        const allDone = active.length > 0 && active.every(u => ctx.boards && ctx.boards[u] && ctx.boards[u].done);
        if (!allDone && now < ends + PLAY_GRACE_MS) return null;
      }
      const last = game.ci >= game.total - 1;
      const res = computeResults(game, ctx.boards || {});
      const patch = {
        phase: last ? 'final' : 'standings',
        phaseStartAt: now,
        phaseEndsAt: now + (last ? FINAL_MS : standingsMs(type)),
        [`results/${game.ci}`]: res,
        // OC2 — THE ROUND WIN (logic.js#roundWin — the server's REDLINE rule) stored once, so every phone + a new host read the same
        [`rw/${game.ci}`]: packRoundWin(roundWin(res, uids)),
        // OC2 — FASTEST's clock: each player's ms from the challenge's start to their finish (the whole 30 s when they never finished)
        [`tm/${game.ci}`]: timesOf(game, ctx.boards || {}),
      };
      for (const [uid, v] of Object.entries(comboAfter(game, ctx))) {
        patch[`combo/${uid}`] = v;
        // BEST STREAK's tie-break: when this best was reached (ci × 100 + the mark's index) — game.combo itself keeps its { c, m }
        const prev = (game.combo && game.combo[uid]) || { c: 0, m: 0 };
        if (v.m > (prev.m || 0)) {
          const at = comboReachAt(prev, marksFor(type, ctx.marks && ctx.marks[uid], ctx.boards && ctx.boards[uid], partsFor(type, levelOf(game.ci, game.total))));
          patch[`cr/${uid}`] = game.ci * 100 + Math.max(0, at);
        }
      }
      return patch;
    }
    case 'standings': {
      // THE AFTER-CHALLENGE SKIP: the full time, or — once SKIP_MIN_MS has shown the answer — every CONNECTED participant has tapped
      if (now < ends) {
        const r = readyState({ taps: ctx.next || {}, players: game.participants || {}, online: ctx.online || {}, since: game.phaseStartAt || 0, now, minMs: SKIP_MIN_MS });
        if (!(r.ready && r.why === 'all')) return null;
      }
      const ci = game.ci + 1;
      const next = game.order[ci];
      const brief = !(game.seen && game.seen[next]);
      const patch = {
        phase: 'ready', ci, ck: String(ci), brief,
        phaseStartAt: now, phaseEndsAt: now + (brief ? BRIEF_MS : READY_MS),
        [`seen/${next}`]: true,
      };
      return patch;
    }
    case 'final':
      return now >= ends ? { lobby: true } : null;
    default:
      return null;
  }
}
