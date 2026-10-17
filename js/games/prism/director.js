// PRISM DROP — authority state machine (PURE; see cipher/director.js for the pattern).
// count (title card, song starts, 3-2-1 on the beat) -> play -> end (last KO / finale) -> final.
// Every phone simulates its own board; the director only reads what players publish (prism/{m}/{uid}):
// who topped out (and who sent the junk that did it), stats for the results, and Call the Winner picks.
import {
  cleanSettings, aliveOf, applyKo, callBonus, songsUsed, OFFLINE_OUT_MS, END_MS,
} from './logic.js';

/**
 * opts: { matchId, settings, participants, now, seed, songs: [ids], sd: [ms], pl0, songStartAt, playStartAt, endAt? }
 */
export function createGame({ matchId, settings, participants, now, seed, songs, sd, pl0, songStartAt, playStartAt, endAt = null }) {
  const s = cleanSettings(settings);
  return {
    id: 'prism',
    matchId,
    settings: s,
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
    endAt: s.mode === 'rush' ? endAt : null,
    n0: Object.keys(participants).length,
  };
}

const validBy = (game, by, uid) => (by && by !== uid && game.participants && game.participants[by] ? by : null);

/**
 * ctx: { now, online: { uid: bool }, presence: { uid: { online, lastSeen } }, live: { boards: { uid: node }, calls: { uid: { w } } } }
 */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'prism') return null;
  const { now } = ctx;
  const boards = (ctx.live && ctx.live.boards) || {};
  switch (game.phase) {
    case 'count':
      if (now < game.playStartAt) return null;
      return { phase: 'play', phaseStartAt: game.playStartAt, phaseEndsAt: game.endAt || null };

    case 'play': {
      if (game.settings.mode === 'rush') {
        if (now < game.endAt) return null;
        return { phase: 'end', phaseStartAt: now, phaseEndsAt: now + END_MS };
      }
      // battle: who is out (topped out, or gone too long)
      const out = { ...(game.out || {}) };
      let alive = aliveOf(game);
      const fresh = [];
      for (const uid of alive) {
        const b = boards[uid];
        const pres = ctx.presence && ctx.presence[uid];
        const gone = !(ctx.online && ctx.online[uid]) && (!pres || !pres.lastSeen || now - pres.lastSeen >= OFFLINE_OUT_MS)
          && now - game.playStartAt >= OFFLINE_OUT_MS;
        if (b && b.st === 'out') fresh.push({ uid, at: b.at || now, by: validBy(game, b.by, uid) });
        else if (gone) fresh.push({ uid, at: now, by: null, gone: true });
      }
      if (!fresh.length) return null;
      fresh.sort((a, b) => a.at - b.at || (a.uid < b.uid ? -1 : 1));
      let bd = { ...(game.bd || {}) };
      const ko = { ...(game.ko || {}) };
      const patch = {};
      for (const f of fresh) {
        const place = alive.length;
        alive = alive.filter(u => u !== f.uid);
        out[f.uid] = { at: f.at, place, rem: alive.length, by: f.by || null, gone: !!f.gone };
        if (f.by) { bd = applyKo(bd, f.by, f.uid); ko[f.by] = (ko[f.by] || 0) + 1; }
        patch[`out/${f.uid}`] = out[f.uid];
      }
      patch.bd = bd;
      patch.ko = ko;
      if (alive.length === 2 && (game.n0 || 0) >= 3 && !game.duelAt) patch.duelAt = now;
      if (alive.length <= 1) {
        patch.phase = 'end';
        patch.phaseStartAt = now;
        patch.phaseEndsAt = now + END_MS;
        patch.winner = alive[0] || null;
      }
      return patch;
    }

    case 'end': {
      if (now < game.phaseEndsAt) return null;
      const results = {};
      for (const uid of Object.keys(game.participants || {})) {
        const b = boards[uid] || {};
        results[uid] = {
          sc: b.sc || 0, ln: b.ln || 0, lv: b.lv || 1, mc: Math.max(0, b.mc || 0), se: b.se || 0, best: b.best || '',
          ko: (game.ko && game.ko[uid]) || 0, bd: (game.bd && game.bd[uid]) || 0,
        };
      }
      const calls = {};
      if (game.settings.mode === 'battle') {
        const winner = game.winner || aliveOf(game)[0] || null;
        for (const [uid, c] of Object.entries((ctx.live && ctx.live.calls) || {})) {
          if (!c || !c.w || !game.out || !game.out[uid]) continue;
          const ok = !!winner && c.w === winner;
          calls[uid] = { w: c.w, ok, bonus: ok ? callBonus(game.out[uid].rem) : 0 };
        }
      }
      return {
        phase: 'final', phaseStartAt: now, phaseEndsAt: null, results, calls,
        $room: { 'meta/prism/n': (game.pl0 || 0) + songsUsed(game, game.phaseStartAt) },
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
