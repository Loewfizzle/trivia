// PRISM DROP — authority state machine (PURE; see cipher/director.js for the pattern).
// count (title card, song starts, 3-2-1 on the beat) -> play -> end (last KO / finale) -> final.
// Every phone simulates its own board; the director only reads what players publish (prism/{m}/{uid}):
// who topped out (and who sent the junk that did it), stats for the results, and Call the Winner picks.
// PD-2: SURVIVAL eliminates like BATTLE (topped out / gone) with no KO credit; a SOLO match (one player — SCORE RUSH or SURVIVAL) ends when
// the song does / you top out. The results carry what PD-5's cards need: KOs (ko), perfect clears (pc), the danger-zone flag (dz — BATTLE:
// your stack reached the top 5 rows) + SURVIVAL's time survived (t, ms).
import {
  cleanSettings, aliveOf, applyKo, callBonus, songsUsed, OFFLINE_OUT_MS, END_MS, DANGER_ZONE_ROWS, dayKey, creditedBy, isSoloGame,
} from './logic.js';

/**
 * opts: { matchId, settings, participants, now, seed, songs: [ids], sd: [ms], pl0, songStartAt, playStartAt, endAt?, set?, cu? }
 *   (PD-5A) set: the room's song set this match — 'day' | 'night' (the HOST's look at the start; absent = night) · cu: each song's cue-in (ms)
 *   · ff: each song file's first audio frame (byte — the quick start's range stream; kept only beside a cue-in)
 */
export function createGame({ matchId, settings, participants, now, seed, songs, sd, pl0, songStartAt, playStartAt, endAt = null, set = 'night', cu = null, ff = null }) {
  const s = cleanSettings(settings, Object.keys(participants || {}).length);
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
    set: set === 'day' ? 'day' : 'night',
    ...(cu && cu.some(x => x > 0) ? { cu, ...(ff && ff.some(x => x > 0) ? { ff } : {}) } : {}),
  };
}

// (FABLE REVIEW optional 19: a KO may be credited to a player who is already out themselves — fair: the rows they sent before they fell
//  still landed. PFIX-B: and only when one of those rows really is in the victim's queue — logic.js#creditedBy)
const validBy = (game, by, uid, queue, outAt) => (by && by !== uid && game.participants && game.participants[by] && creditedBy(queue, by, outAt) ? by : null);

/**
 * The order boards went out in — and so who wins when the last ones go in ONE tick (PFIX-A — question B): the earlier server stamp `at`
 * goes first; an exact tie → the one who SENT FEWER rows goes first, then the LATER joiner, then the uid. The last of the list went out last.
 */
export function outOrder(fresh, boards = {}, players = {}) {
  const se = u => Number((boards[u] || {}).se) || 0;
  const jo = u => Number((players[u] || {}).joinedAt) || 0;
  return [...fresh].sort((a, b) => a.at - b.at || se(a.uid) - se(b.uid) || jo(b.uid) - jo(a.uid) || (a.uid < b.uid ? 1 : a.uid > b.uid ? -1 : 0));
}

/**
 * ctx: { now, online: { uid: bool }, presence: { uid: { online, lastSeen } }, players?: { uid: { joinedAt } },
 *        live: { boards: { uid: node }, calls: { uid: { w } } } }
 */
export function nextStep(game, ctx) {
  if (!game || game.id !== 'prism') return null;
  const { now } = ctx;
  const boards = (ctx.live && ctx.live.boards) || {};
  const queues = (ctx.live && ctx.live.queues) || {};   // (PFIX-B: prismq/{m} — who really attacked whom, for the KO credit)
  switch (game.phase) {
    case 'count':
      if (game.pz != null) return null;   // (THE DROP B add-on: a solo run paused while hidden — its clocks shift when it comes back)
      if (now < game.playStartAt) return null;
      return { phase: 'play', phaseStartAt: game.playStartAt, phaseEndsAt: game.endAt || null };

    case 'play': {
      // THE DROP B add-on — A SOLO RUN PAUSES WHILE HIDDEN (logic.js#soloPause / soloResume): nothing happens while it is paused (no end, no out)
      if (game.pz != null) return null;
      if (game.settings.mode === 'rush') {
        if (now < game.endAt) return null;
        return { phase: 'end', phaseStartAt: now, phaseEndsAt: now + END_MS };
      }
      // battle + SURVIVAL: who is out (topped out, or gone too long)
      const surv = game.settings.mode === 'survival';
      const out = { ...(game.out || {}) };
      let alive = aliveOf(game);
      const fresh = [];
      // (THE DROP B add-on: a SOLO run back from a pause gets OFFLINE_OUT_MS after its 3-2-1 before AWAY / SIGNAL LOST can apply — its last save
      //  is from before it hid; with 2+ players nothing changes)
      const fresh0 = isSoloGame(game) && Number.isFinite(game.rz) && now < game.rz + OFFLINE_OUT_MS;
      for (const uid of alive) {
        const b = boards[uid];
        const pres = ctx.presence && ctx.presence[uid];
        const late = now - game.playStartAt >= OFFLINE_OUT_MS && !fresh0;
        const gone = !(ctx.online && ctx.online[uid]) && (!pres || !pres.lastSeen || now - pres.lastSeen >= OFFLINE_OUT_MS) && late;
        // PFIX-A (FABLE REVIEW finding 2 + question E — AWAY): a board that has said nothing for OFFLINE_OUT_MS during play is OUT, credited to
        // nobody, whatever presence says — a hidden tab keeps its socket (online) but runs no frames: its board froze, no row could land on it.
        // The view's save is the heartbeat (≤ 3 s apart while its frames run); a board never written counts from GO.
        const away = !gone && late && now - (Number(b && b.at) || game.playStartAt) >= OFFLINE_OUT_MS;
        if (b && b.st === 'out') fresh.push({ uid, at: b.at || now, by: surv ? null : validBy(game, b.by, uid, queues[uid], b.at || now) });
        else if (gone) fresh.push({ uid, at: now, by: null, gone: true });
        else if (away) fresh.push({ uid, at: now, by: null, gone: true, away: true });
      }
      if (!fresh.length) return null;
      const order = outOrder(fresh, boards, ctx.players);
      fresh.length = 0;
      fresh.push(...order);
      // PFIX-A (FABLE REVIEW finding 4 + question B): the last boards out in ONE tick — the one that went out LAST wins (never "no survivors"
      // in a match of 2+): it stays in (no out entry — place 1), its own top-out is not a KO.
      let lastOut = null;
      if ((game.n0 || 0) >= 2 && fresh.length >= alive.length) lastOut = fresh.pop().uid;
      let bd = { ...(game.bd || {}) };
      const ko = { ...(game.ko || {}) };
      const patch = {};
      for (const f of fresh) {
        const place = alive.length;
        alive = alive.filter(u => u !== f.uid);
        out[f.uid] = { at: f.at, place, rem: alive.length, by: f.by || null, gone: !!f.gone, ...(f.away ? { away: true } : {}) };
        if (f.by) { bd = applyKo(bd, f.by, f.uid); ko[f.by] = (ko[f.by] || 0) + 1; }
        patch[`out/${f.uid}`] = out[f.uid];
      }
      patch.bd = bd;
      patch.ko = ko;
      if (alive.length === 2 && (game.n0 || 0) >= 3 && !game.duelAt) patch.duelAt = now;
      // the end: one left (a solo match: none — you play until you top out)
      if (alive.length <= ((game.n0 || 0) >= 2 ? 1 : 0)) {
        patch.phase = 'end';
        patch.phaseStartAt = now;
        patch.phaseEndsAt = now + END_MS;
        patch.winner = alive[0] || lastOut || null;
      }
      return patch;
    }

    case 'end': {
      if (now < game.phaseEndsAt) return null;
      const results = {};
      const mode = game.settings.mode;
      for (const uid of Object.keys(game.participants || {})) {
        const b = boards[uid] || {};
        const sv = b.sv || {};
        const pc = Math.max(0, Math.min(99, Number((sv.st || [])[3]) || 0));
        // (PFIX-B: pn = the pieces placed — match-report.js#prismExtra checks the award flags against it)
        const pn = Math.max(0, Math.min(100_000, Number((sv.st || [])[0]) || 0));
        const r = results[uid] = {
          sc: b.sc || 0, ln: b.ln || 0, lv: b.lv || 1, mc: Math.max(0, b.mc || 0), se: b.se || 0, best: b.best || '',
          ko: (game.ko && game.ko[uid]) || 0, bd: (game.bd && game.bd[uid]) || 0, pc, pn,
        };
        if (mode === 'battle' && (Number(sv.pk) || 0) >= DANGER_ZONE_ROWS) r.dz = 1;
        if (mode === 'survival') {
          const o = game.out && game.out[uid];
          r.t = Math.max(0, (o ? o.at : game.phaseStartAt) - game.playStartAt);   // (THE DROP B add-on: playStartAt shifted by every solo pause — time PLAYED)
          r.sd = Math.max(0, Math.min(100_000, Number(b.sv && b.sv.sd) || 0));      // (the rising rows the engine really took — match-report.js checks t against them)
        }
      }
      const calls = {};
      if (mode !== 'rush') {
        const winner = game.winner || aliveOf(game)[0] || null;
        for (const [uid, c] of Object.entries((ctx.live && ctx.live.calls) || {})) {
          if (!c || !c.w || !game.out || !game.out[uid]) continue;
          const ok = !!winner && c.w === winner;
          calls[uid] = { w: c.w, ok, bonus: ok ? callBonus(game.out[uid].rem) : 0 };
        }
      }
      return {
        phase: 'final', phaseStartAt: now, phaseEndsAt: null, results, calls,
        // (PD-5A: each set its own playlist — NIGHT on meta/prism/n, DAY in the night's memory)
        $room: game.set === 'day'
          ? { [`meta/used/prism/${dayKey((game.pl0 || 0) + songsUsed(game, game.phaseStartAt))}`]: true }
          : { 'meta/prism/n': (game.pl0 || 0) + songsUsed(game, game.phaseStartAt) },
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
