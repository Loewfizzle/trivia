// POST /api/report { code, matchId, snap? } — a finished match, reported by every phone in it (the host first; any
// participant can, so a host whose phone died doesn't lose the match for everyone). The server never trusts the
// numbers in the request: it reads the match from the room itself (rooms/{code}/game). Only when the room has
// already moved on (a rematch started) does it accept the reporter's snapshot, and then only if its placings agree
// with the room's game-night record (night/{matchId}). First valid report wins; every later one (retries, the other
// phones) just gets its own outcome back. → { ok, outcome | null, status }
import { readFileSync } from 'node:fs';
import { route, send, readBody, requireUser, ApiError } from './_lib/http.js';
import { ref, val } from './_lib/fb.js';
import { ensureProfile, pidOf } from './_lib/profiles.js';
import { applyMatch } from './_lib/stats.js';
import { bumpPlayed } from './_lib/activity.js';
import { extractMatch, unreportable } from '../js/core/match-report.js';

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

const ranksAgree = (ex, night) => Object.entries(ex.rows).every(([uid, r]) => (NIGHT_POINTS[r.rank] || 0) === ((night.p || {})[uid] || 0))
  && Object.keys(night.p || {}).every(uid => ex.rows[uid]);

export async function processReport(uid, body, now = Date.now()) {
  const code = String(body.code || '');
  const matchId = String(body.matchId || '');
  if (!/^[A-HJ-NP-Z]{4}$/.test(code) || !/^[a-z0-9]{3,16}$/.test(matchId)) throw new ApiError(400, 'bad_match');
  const key = `${code}_${matchId}`;
  const myPid = await pidOf(uid);
  const done = await val(`results/${key}`);
  if (done && done.st === 'done') return { ok: true, status: 'done', outcome: myPid ? (done.o && done.o[myPid]) || null : null };

  const [game, night, players] = await Promise.all([val(`rooms/${code}/game`), val(`rooms/${code}/night/${matchId}`), val(`rooms/${code}/players`)]);
  let match = null, src = 'room';
  if (game && game.matchId === matchId) {
    if (game.phase !== 'final') throw new ApiError(425, 'not_final', 'The match is still running.');
    match = game;
  } else if (night && body.snap && typeof body.snap === 'object' && body.snap.matchId === matchId && body.snap.id === night.g && !unreportable(body.snap)) {
    match = body.snap; src = 'snap';
  }
  if (!match) throw new ApiError(409, 'unverifiable', 'This match can’t be checked against its room any more.');
  if (night && night.at && now - night.at > MAX_AGE_MS) throw new ApiError(409, 'too_old');
  if (!match.participants || !match.participants[uid]) throw new ApiError(403, 'not_in_match');
  let ex;
  try { ex = extractMatch(match, { pulseCounts: loadPulseCounts() }); } catch (e) { throw new ApiError(409, 'unverifiable', e.message); }
  if (src === 'snap' && !ranksAgree(ex, night)) throw new ApiError(409, 'mismatch', 'The placings don’t match the room.');
  // every participant must still be (or have been) a player of this room
  for (const u of Object.keys(ex.rows)) if (!(players && players[u]) && !(night && night.n && night.n[u])) delete ex.rows[u];

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

  const pids = {};
  await Promise.all(Object.keys(ex.rows).map(async u => {
    let pid = await pidOf(u);
    if (!pid) {
      const p = (players && players[u]) || { name: night && night.n && night.n[u] };
      if (!p || !p.name) return;
      pid = (await ensureProfile(u, { name: p.name, avatar: p.avatar, color: p.color }, now)).pid;
    }
    pids[u] = pid;
  }));
  const outcomes = await applyMatch(key, ex, pids, now);
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
