// SLIPSTREAM — authority state machine (PURE; see cipher/director.js for the pattern).
// count (title card, the course builds from the seed, a 3-2-1 on server time) -> play -> end -> final.
// Every phone simulates its own rider; the director only reads what riders publish (slip/{m}/{uid}): who is out
// (lives gone) and when, how far they got, and their stats for the results; plus Call the Winner picks.
import {
  cleanSettings, aliveOf, outOrder, callBonus, songsUsed, OFFLINE_OUT_MS, END_MS, TIME_LIMIT_S,
} from './logic.js';

export function createGame({ matchId, settings, participants, now, seed, songs, sd, pl0, songStartAt, playStartAt }) {
  return {
    id: 'slip',
    matchId,
    settings: cleanSettings(settings),
    participants,
    seed,
    songs,
    sd,
    pl0,
    phase: 'count',
    phaseStartAt: now,
    phaseEndsAt: playStartAt,
    songStartAt,
    playStartAt,
    n0: Object.keys(participants).length,
  };
}

/** ctx: { now, online: { uid: bool }, presence: { uid: { online, lastSeen } }, live: { riders: { uid: node }, calls } } */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'slip') return null;
  const { now } = ctx;
  const riders = (ctx.live && ctx.live.riders) || {};
  switch (game.phase) {
    case 'count':
      if (now < game.playStartAt) return null;
      return { phase: 'play', phaseStartAt: game.playStartAt, phaseEndsAt: game.playStartAt + TIME_LIMIT_S * 1000 };

    case 'play': {
      let alive = aliveOf(game);
      const fresh = [];
      for (const uid of alive) {
        const n = riders[uid];
        const pres = ctx.presence && ctx.presence[uid];
        const gone = !(ctx.online && ctx.online[uid]) && (!pres || !pres.lastSeen || now - pres.lastSeen >= OFFLINE_OUT_MS)
          && now - game.playStartAt >= OFFLINE_OUT_MS;
        if (n && n.st === 'out') fresh.push({ uid, at: n.at || now, d: n.d || 0 });
        else if (gone) fresh.push({ uid, at: now, d: (n && n.d) || 0, gone: true });
      }
      const timeUp = now >= game.phaseEndsAt;
      if (!fresh.length && !timeUp) return null;
      const patch = {};
      for (const f of outOrder(fresh)) {
        // the last rider(s): if everyone left is going out in this batch, the farthest of them wins
        if (alive.length === 1 && alive[0] === f.uid) break;
        const place = alive.length;
        alive = alive.filter(u => u !== f.uid);
        patch[`out/${f.uid}`] = { at: f.at, place, rem: alive.length, d: Math.round(f.d), gone: !!f.gone };
      }
      if (alive.length === 2 && (game.n0 || 0) >= 3 && !game.lastAt) patch.lastAt = now;
      if (alive.length <= 1 || timeUp) {
        // time up: the remaining riders place by distance
        if (timeUp && alive.length > 1) {
          const byD = alive.map(u => ({ uid: u, d: (riders[u] && riders[u].d) || 0 })).sort((a, b) => b.d - a.d || (a.uid < b.uid ? -1 : 1));
          byD.slice(1).forEach((r, i) => { patch[`out/${r.uid}`] = { at: now, place: i + 2, rem: 1, d: Math.round(r.d), time: true }; });
          alive = [byD[0].uid];
        }
        patch.phase = 'end';
        patch.phaseStartAt = now;
        patch.phaseEndsAt = now + END_MS;
        patch.winner = alive[0] || null;
        patch.timeUp = !!timeUp;
      }
      return Object.keys(patch).length ? patch : null;
    }

    case 'end': {
      if (now < game.phaseEndsAt) return null;
      const results = {};
      for (const uid of Object.keys(game.participants || {})) {
        const n = riders[uid] || {};
        results[uid] = {
          d: Math.round(n.d || (game.out && game.out[uid] && game.out[uid].d) || 0),
          bc: n.bc || 0, fl: n.fl || 0, ln: n.ln || 0, cl: n.cl || 0, bi: n.bi || 1, rg: n.rg || 0,
        };
      }
      const calls = {};
      const winner = game.winner || aliveOf(game)[0] || null;
      for (const [uid, c] of Object.entries((ctx.live && ctx.live.calls) || {})) {
        if (!c || !c.w || !game.out || !game.out[uid]) continue;
        const ok = !!winner && c.w === winner;
        calls[uid] = { w: c.w, ok, bonus: ok ? callBonus(game.out[uid].rem) : 0 };
      }
      return {
        phase: 'final', phaseStartAt: now, phaseEndsAt: null, results, calls,
        $room: { 'meta/slip/n': (game.pl0 || 0) + songsUsed(game, game.phaseStartAt) },
      };
    }

    default:
      return null;
  }
}

/** Game-night bonus points (Call the Winner): { uid: points }. */
export function nightBonus(game) {
  const out = {};
  for (const [uid, c] of Object.entries(game.calls || {})) if (c && c.ok && c.bonus > 0) out[uid] = c.bonus;
  return out;
}
