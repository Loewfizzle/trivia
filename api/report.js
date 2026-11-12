// POST /api/report { code, matchId, snap? } — a finished match, reported by every phone in it (the host first; any
// participant can, so a host whose phone died doesn't lose the match for everyone). The server never trusts the
// numbers in the request: it reads the match from the room itself (rooms/{code}/game). Only when the room has
// already moved on (a rematch started) does it accept the reporter's snapshot, and then only if its placings agree
// with the room's game-night record (night/{matchId}). First valid report wins; every later one (retries, the other
// phones) just gets its own outcome back. → { ok, outcome | null, status }
// APP FIXES (Grok 2.2 — NO INVENTED MATCHES ON THE BOARD): a host writes rooms/{code}/game + night/{matchId} itself, so the room is
// only as honest as its host. Now: the night record must carry its `at` (the server's clock, the rules) and is always age-capped;
// only uids with a seat in the room (players/{uid}) are credited — never a name from night.n; a snapshot (the room moved on) gives
// PLACINGS ONLY, from the night record (never a client's game blob — no records, no scores); CIPHER's results must agree with the
// players' own signed boards (re-graded from their guesses); and a uid with no profile is never given one here (each phone makes
// its own when it joins — js/profile/me.js).
import { withShow } from './_lib/catalog.js';   // (THE VAULT 1B: registers the server-only catalog + names only to owners)
import { readFileSync } from 'node:fs';
import { route, send, readBody, requireUser, ApiError } from './_lib/http.js';
import { ref, val, emulated } from './_lib/fb.js';
import { pidOf } from './_lib/profiles.js';
import { dedupePids } from '../js/core/progress.js';
import { applyMatch } from './_lib/stats.js';
import { bumpPlayed } from './_lib/activity.js';
import { extractMatch, unreportable, REPORT_GAMES, DEALER_GAMES } from '../js/core/match-report.js';
import { GAMES } from '../js/config.js';
import { regradeBoards, computeRoundResults } from '../js/games/cipher/logic.js';
import { holdemAction, clockNow } from './_lib/holdem-store.js';
import { timing } from './_lib/timing.js';

import { nightPoints, isAllTied, placingsOnly } from '../js/core/night.js';   // (B4: what a placing is worth on the game-night board — the ONE rule the host writes with)
const MAX_AGE_MS = 6 * 3600_000;

let pulseCounts = null;
function loadPulseCounts() {
  if (pulseCounts) return pulseCounts;
  try {
    const m = JSON.parse(readFileSync(new URL('../data/pulse/manifest.json', import.meta.url), 'utf8'));
    pulseCounts = Object.fromEntries((m.songs || []).map(s => [s.id, s.counts || {}]));
  } catch (e) { console.warn('pulse manifest', e.message); pulseCounts = {}; }
  return pulseCounts;
}

// the night record's placings → a match with no numbers (the snapshot path) — PURE in core/night.js (B4: the unit tests reach it there)
export { placingsOnly };

// CIPHER: every round's results must agree with the boards the players signed (solved + rows, re-graded from the guesses)
export function cipherAgrees(game, boardsByRound, code) {
  for (const [r, res] of Object.entries(game.results || {})) {
    const boards = (boardsByRound && boardsByRound[r]) || {};
    const secret = game.sx && game.sx[r];
    if (!secret) return false;   // every round's word is kept (game.sx): a final without it can't be checked
    const g = { ...game, round: Number(r), secret };
    const want = computeRoundResults(g, regradeBoards(g, boards, code));
    for (const [uid, x] of Object.entries(res || {})) {
      const w = want[uid];
      if (!w || !!w.solved !== !!x.solved || (w.n || 0) !== (x.n || 0)) return false;
    }
  }
  return true;
}

/**
 * HE10 (Fable review A2 / B1 — THE RESULTS HOLE): which games this path may credit at all. NEVER a game THE SERVER DEALS ITSELF (HOLD'EM: its
 * result exists only from the dealer's own record — src 'dealer', api/_lib/holdem-store.js#reportMatch) and never a game that isn't
 * playable (a host could otherwise mint a win for a game nobody can start). On the LOCAL EMULATORS the frozen games' report checks keep
 * running behind the test switch `testReportAll` (server.test / progression.test / e2e-profiles set it — never honoured in production).
 */
export { DEALER_GAMES };
export async function reportableGame(id) {
  if (typeof id !== 'string' || DEALER_GAMES.includes(id) || !REPORT_GAMES.includes(id)) return false;
  if (GAMES.some(g => g.id === id && g.playable)) return true;
  return emulated() && !!(await val('testReportAll'));
}

export async function processReport(uid, body, now = Date.now()) {
  const code = String(body.code || '');
  const matchId = String(body.matchId || '');
  // (APP FIXES: any A–Z — a HUSH WORD uses every letter; the old random codes' alphabet (no I / O) refused rooms like MOON or COIN)
  if (!/^[A-Z]{4}$/.test(code) || !/^[a-z0-9]{3,16}$/.test(matchId)) throw new ApiError(400, 'bad_match');
  const key = `${code}_${matchId}`;
  const myPid = await pidOf(uid);
  const done = await val(`results/${key}`);
  if (done && done.st === 'done') return { ok: true, status: 'done', outcome: myPid ? (done.o && done.o[myPid]) || null : null };

  const [game, night, players, meta] = await Promise.all([val(`rooms/${code}/game`), val(`rooms/${code}/night/${matchId}`), val(`rooms/${code}/players`), val(`rooms/${code}/meta`)]);
  // HE10 (A2 / B1): a dealer's game or a game nobody can start is never credited here — on either path (the room's game, the snapshot's night)
  for (const gid of [game && game.matchId === matchId ? game.id : null, night && night.g].filter(v => v != null)) {
    if (!(await reportableGame(gid))) throw new ApiError(409, 'not_reportable', DEALER_GAMES.includes(gid) ? 'The dealer reports this game itself.' : 'This game can’t be counted.');
  }
  // the night record is required, with its time (the server's clock): no record, no match; too old (or from the future), no match
  if (!night || typeof night.at !== 'number') throw new ApiError(409, 'unverifiable', 'This match has no record in its room.');
  if (now - night.at > MAX_AGE_MS) throw new ApiError(409, 'too_old');
  if (night.at > now + 60_000) throw new ApiError(409, 'unverifiable', 'The match record is from the future.');
  let ex, src = 'room';
  if (game && game.matchId === matchId) {
    if (game.phase !== 'final') throw new ApiError(425, 'not_final', 'The match is still running.');
    if (!game.participants || !game.participants[uid]) throw new ApiError(403, 'not_in_match');
    if (game.id !== night.g) throw new ApiError(409, 'mismatch', 'The match doesn’t match its record.');
    try { ex = extractMatch(game, { pulseCounts: loadPulseCounts() }); } catch (e) { throw new ApiError(409, 'unverifiable', e.message); }
    // the placings the host computed must be the night record's
    // (SHELL 2.0 B1 — THE SOLO LANE: a room of one earns no night points — the host writes 0)
    // (HOLD'EM IN THE CITY — B4: a FULL TIE is a draw — 2 each (core/night.js#nightPoints); a phone still on the code before B4 wrote 3 each —
    //  accepted too, so no result is lost while the room updates)
    const ranks = Object.entries(ex.rows).map(([u, r]) => ({ uid: u, rank: r.rank })), want = nightPoints(ranks, { solo: ex.solo });
    const old = !ex.solo && isAllTied(ranks) ? Object.fromEntries(ranks.map(r => [r.uid, 3])) : null;
    const same = w => ranks.every(r => (w[r.uid] || 0) === ((night.p || {})[r.uid] || 0));
    const agree = (same(want) || (old && same(old))) && Object.keys(night.p || {}).every(u => ex.rows[u]);
    if (!agree) throw new ApiError(409, 'mismatch', 'The placings don’t match the room.');
    if (game.id === 'cipher' && !cipherAgrees(game, await val(`rooms/${code}/boards/${matchId}`), code)) throw new ApiError(409, 'mismatch', 'The results don’t match the players’ boards.');
  } else if (body.snap && typeof body.snap === 'object' && body.snap.matchId === matchId) {
    // the room moved on (a rematch): the PLACINGS from the night record only — never a client's game blob
    if (!(night.p && Object.prototype.hasOwnProperty.call(night.p, uid))) throw new ApiError(403, 'not_in_match');
    ex = placingsOnly(night); src = 'snap';
  } else {
    throw new ApiError(409, 'unverifiable', 'This match can’t be checked against its room any more.');
  }
  // credit only uids with a SEAT in the room (players/{uid}) — a name in night.n is not a player
  for (const u of Object.keys(ex.rows)) if (!(players && players[u])) delete ex.rows[u];
  if (!ex.rows[uid]) throw new ApiError(403, 'not_in_match');

  // one processor at a time (a stuck claim expires); pstats/m keeps it exactly-once even if two overlap
  const claim = await ref(`results/${key}`).transaction(cur => {
    if (cur && cur.st === 'done') return undefined;
    if (cur && cur.st === 'busy' && now - (cur.at || 0) < 30_000) return undefined;
    return { st: 'busy', at: now, by: uid };
  });
  if (!claim.committed) {
    const cur = claim.snapshot.val();
    if (cur && cur.st === 'done') return { ok: true, status: 'done', outcome: myPid ? (cur.o && cur.o[myPid]) || null : null };
    throw new ApiError(425, 'busy', 'Already being counted.');
  }

  // (a uid with no profile is never given one here — it isn't counted: each phone makes its own profile when it joins)
  const pids = {};
  await Promise.all(Object.keys(ex.rows).map(async u => { const pid = await pidOf(u); if (pid) pids[u] = pid; }));
  // (LOBBY FIXES — ONE PROFILE, ONE SEAT: two seats of one profile in a match are credited ONCE — the WORSE placing, so a second
  //  device never farms a better one; the match's window goes with it — ONE ACCOUNT, ONE ROOM: progress.js#overlaps)
  dedupePids(ex.rows, pids);
  const win = { c: code, s: (game && game.matchId === matchId && Number(game.go)) || night.at, e: night.at };
  const outcomes = await applyMatch(key, ex, pids, now, { code, meta, win });
  await bumpPlayed(ex.gid, now).catch(e => console.warn('activity', e && e.message));
  await ref(`results/${key}`).set({ st: 'done', at: now, g: ex.gid, mode: ex.mode || null, n: ex.n, src, by: uid, rej: ex.rejected.length || null, o: outcomes });
  if (ex.rejected.length) console.warn('rejected records', key, JSON.stringify(ex.rejected));
  return { ok: true, status: 'counted', outcome: outcomes[pids[uid]] || null, rejected: ex.rejected.filter(r => r.uid === uid).map(r => r.board) };
}

// Expected answers (still running, being counted, can't be verified, not yours) come back as 200 { ok: false, code, retry }:
// they're part of the normal flow for every phone at the podium, not errors (browsers log every 4xx as one).
// HE2 — THE HOLD'EM DEALER rides this function (STILL 8): POST /api/report { holdem: <op>, room, … } → _lib/holdem-store.js. Real HTTP
// statuses (a stale tap is a 409 the phone reads, a flood a 429) + Server-Timing on every answer.
export default route(['POST'], async (req, res) => {
  const T = timing();
  const uid = await requireUser(req);
  T.mark('auth');
  const body = await readBody(req);
  if (body && body.holdem) {
    try {
      send(res, 200, await holdemAction(uid, body, clockNow(), T), { 'Server-Timing': T.header() });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      send(res, e.status, { error: e.code, message: e.message, ...(e.extra || {}) }, { 'Server-Timing': T.header() });
    }
    return;
  }
  try {
    send(res, 200, withShow(await processReport(uid, body)));
  } catch (e) {
    if (!(e instanceof ApiError) || e.status >= 500 || e.status === 401) throw e;
    send(res, 200, { ok: false, code: e.code, retry: e.status === 425 || e.status === 429, message: e.message });
  }
});
