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
import { readFileSync } from 'node:fs';
import { route, send, readBody, requireUser, ApiError } from './_lib/http.js';
import { ref, val } from './_lib/fb.js';
import { pidOf } from './_lib/profiles.js';
import { applyMatch } from './_lib/stats.js';
import { bumpPlayed } from './_lib/activity.js';
import { extractMatch, unreportable } from '../js/core/match-report.js';
import { regradeBoards, computeRoundResults } from '../js/games/cipher/logic.js';

const NIGHT_POINTS = { 1: 3, 2: 2, 3: 1 };   // host.js — what a placing is worth on the game-night board
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

// the night record's placings → a match with no numbers (the snapshot path): 3/2/1 points = 1st/2nd/3rd, 0 = after the podium
export function placingsOnly(night) {
  const p = night.p || {}, uids = Object.keys(p);
  const rankOf = pts => (pts === 3 ? 1 : pts === 2 ? 2 : pts === 1 ? 3 : uids.filter(u => p[u] > 0).length + 1);
  const n = uids.length, firsts = uids.filter(u => p[u] === 3).length;
  const rows = {};
  for (const u of uids) { const rank = rankOf(p[u]); const win = rank === 1 && firsts < n; rows[u] = { rank, win, c: { p: 1, ...(win ? { w: 1 } : {}) }, rec: {} }; }
  return { gid: night.g, n, mode: null, rows, rejected: [] };
}

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
    const agree = Object.entries(ex.rows).every(([u, r]) => (NIGHT_POINTS[r.rank] || 0) === ((night.p || {})[u] || 0)) && Object.keys(night.p || {}).every(u => ex.rows[u]);
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
  const outcomes = await applyMatch(key, ex, pids, now, { code, meta });
  await bumpPlayed(ex.gid, now).catch(e => console.warn('activity', e && e.message));
  await ref(`results/${key}`).set({ st: 'done', at: now, g: ex.gid, mode: ex.mode || null, n: ex.n, src, by: uid, rej: ex.rejected.length || null, o: outcomes });
  if (ex.rejected.length) console.warn('rejected records', key, JSON.stringify(ex.rejected));
  return { ok: true, status: 'counted', outcome: outcomes[pids[uid]] || null, rejected: ex.rejected.filter(r => r.uid === uid).map(r => r.board) };
}

// Expected answers (still running, being counted, can't be verified, not yours) come back as 200 { ok: false, code, retry }:
// they're part of the normal flow for every phone at the podium, not errors (browsers log every 4xx as one).
export default route(['POST'], async (req, res) => {
  const uid = await requireUser(req);
  const body = await readBody(req);
  try {
    send(res, 200, await processReport(uid, body));
  } catch (e) {
    if (!(e instanceof ApiError) || e.status >= 500 || e.status === 401) throw e;
    send(res, 200, { ok: false, code: e.code, retry: e.status === 425 || e.status === 429, message: e.message });
  }
});
