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
// FR7-A's C1 (Nov 12 — THE REAL PLAYER COUNT): the XP a win / a 2nd place pays grows with the PLAYER COUNT, and that count came from
// host-written data (the night record's names on the snapshot path, game.participants on the room path) with no cap — one anonymous
// user wrote a 5,001-name record and took 30,089 XP (LEVEL 1 → 77) in ONE call. Now, on BOTH paths: a record naming more than
// MAX_REPORT_NAMES is refused before any work; the count paid on = the match's names that are REAL PLAYERS — a seat in the room
// (players/{uid}, which only that uid can write) or, for a player who left after the match, an account this server knows (uids/{uid} —
// server-written) — never above MAX_PLAYERS; a record with ONE real player is a SOLO run (the solo lane's small capped XP, never a
// win — and only for a game that plays solo). HOLD'EM (the dealer's own record), the dailies (a fixed XP a daily) and the solo lane
// (a fixed XP, 4 a day) never took a count from a phone.
import { withShow } from './_lib/catalog.js';   // (THE VAULT 1B: registers the server-only catalog + names only to owners)
import { readFileSync } from 'node:fs';
import { route, send, readBody, requireUser, clientIp, ApiError } from './_lib/http.js';
import { callBudget } from './_lib/budget.js';   // (THE FIX PASS — S3 b)
import { noteSeen } from './_lib/seen.js';
import { ref, val, emulated, adminPids } from './_lib/fb.js';
import { jaywalkSolo, jaywalkMatch } from './_lib/jaywalk.js';
import { highriseSolo, highriseMatch, HIGHRISE_COUNTS } from './_lib/highrise.js';
import { goUids, firstGo, onTime, liveRetryMs } from '../js/core/proof.js';
import { liveOf as jaywalkLive } from '../js/games/jaywalk/director.js';   // (THE CONSOLE FIX: the live runs — PURE, the host's own rule)
import { liveOf as highriseLive } from '../js/games/highrise/match.js';
import { isOnline } from '../js/core/room-logic.js';
import { pidOf } from './_lib/profiles.js';
import { dedupePids } from '../js/core/progress.js';
import { applyMatch, wouldApply, needsRetry, mergeOutcomes, MIN_MATCH_GAP_MS } from './_lib/stats.js';
import { bumpPlayed } from './_lib/activity.js';
import { extractMatch, unreportable, REPORT_GAMES, DEALER_GAMES, SOLO_OK, prismVerify } from '../js/core/match-report.js';
import { ocRegrade } from '../js/games/overclock/regrade.js';
import { ocBank } from './_lib/oc-banks.js';
import { GAMES, MAX_PLAYERS } from '../js/config.js';
import { regradeBoards, computeRoundResults } from '../js/games/cipher/logic.js';
import { holdemAction, clockNow } from './_lib/holdem-store.js';
import { timing } from './_lib/timing.js';

import { nightPoints, isAllTied, placingsOnly } from '../js/core/night.js';   // (B4: what a placing is worth on the game-night board — the ONE rule the host writes with)
const MAX_AGE_MS = 6 * 3600_000;
export const REPORT_MAX_AGE_MS = MAX_AGE_MS;   // (the phone's queue keeps an item at least this long — js/profile/queue.js)
const RESET_AT = 'progress/resetAt';   // (THE RESET EPOCH — api/_lib/reset.js stamps it)

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
export async function reportableGame(id, uid = null, at = null) {
  if (typeof id !== 'string' || DEALER_GAMES.includes(id) || !REPORT_GAMES.includes(id)) return false;
  if (GAMES.some(g => g.id === id && g.playable)) return true;
  // JAYWALK H3 — THE OWNER'S LIVE TEST (HE8's rule, as the dealer's start — api/_lib/holdem-store.js#startOpen): a game BEING BUILT (`preview`)
  // is counted for THE OWNER alone (the reporter's uid → their profile id → ADMIN_PIDS; on the emulators also `testAdmins/{pid}`) — nobody
  // else can start it (config.js#isPlayable), and nobody else's report of it is ever counted
  if (uid && GAMES.some(g => g.id === id && g.preview && !g.playable)) {
    const owner = async u => { const pid = await pidOf(u); return !!pid && (adminPids().includes(pid) || (emulated() && !!(await val(`testAdmins/${pid}`)))); };
    if (await owner(uid)) return true;
    // JAYWALK H4 — HIS GUESTS (HE8: "guests in his room play normally"): a match THE OWNER PLAYED IN counts for everyone in it — his own
    // proof node of THAT match in THAT room (only his phone can write it: the rules) is the yes; `at` = { code, matchId }
    if (at && PROOF_TREES[id]) {
      const trees = await Promise.all(PROOF_TREES[id](at.matchId).room.map(p => val(`rooms/${at.code}/${p}`)));
      for (const u of provenUids(id, trees)) if (u !== uid && (await owner(u))) return true;
    }
  }
  return emulated() && !!(await val('testReportAll'));
}

// (JAYWALK H3 + H4 — THE SERVER'S OWN RESULT: a SOLO run and a MATCH are counted ONLY from the server's replay of the players' proof nodes — api/_lib/jaywalk.js)
export { jaywalkSolo, jaywalkMatch };
// HIGH RISE S4A — the SAME two paths (api/_lib/highrise.js: its own node `hr`, its own judge). THE PROOF GAMES: the games a result of which
// exists ONLY from the server's replay of the players' proof nodes — { node (under rooms/{CODE}), solo, match }
export { highriseSolo, highriseMatch };
/** THE CONSOLE FIX — Group 2: the host-graded games whose result must name every player their own boards prove (THE DROPPED LEADER) */
export const DROP_GUARD = Object.freeze(['prism', 'overclock']);
/** THE BEFORE-LAUNCH PASS — HOST TRUST (docs/match-kit.md "HOST TRUST"): a host-graded match (DROP_GUARD) the server refuses is a 409
 *  'mismatch' + the quiet count logstats/wreck — and (the fresh-eyes review, H1) such a match of 2+ is NEVER paid from the snapshot path: its
 *  checks need its final game, and the night record's placings are the host's own */
export const PROOF_GAMES = Object.freeze({
  jaywalk: Object.freeze({ node: 'jw', solo: jaywalkSolo, match: jaywalkMatch, live: jaywalkLive }),
  highrise: Object.freeze({ node: 'hr', solo: highriseSolo, match: highriseMatch, live: highriseLive }),
});
/**
 * HIGH RISE S4A — THE SWITCH (api/_lib/highrise.js#HIGHRISE_COUNTS — ON since THE GO-LIVE, Nov 20; false = the one-line KILL SWITCH). OFF: a
 * run is JUDGED and NOTHING is awarded (processReport returns WOULD COUNT before any claim / credit). On the LOCAL EMULATORS a test sets
 * `testHighriseCounts` true OR false — either way, over the code's value (THE GO-LIVE: false keeps the kill switch's OFF path tested) —
 * never honoured in production (`emulated()`).
 */
export const highriseCounts = async () => { if (emulated()) { const t = await val('testHighriseCounts'); if (t === true || t === false) return t; } return HIGHRISE_COUNTS; };
/** PURE — the WOULD-AWARD the phone is told while counting is OFF: the server's own judged row + what the counted path would have done.
 *  `row` = the server's result row { f, p, t, w, s, ft?, cut?, bad? } · `w` = stats.js#wouldApply's answer · `rec` = the board value */
export function wouldAward(row, w, rec) {
  const r = row || {}, out = { floor: Math.max(0, Math.floor(Number(r.f) || 0)), perfects: Math.max(0, Math.floor(Number(r.p) || 0)), cause: String(r.w || ''), ...(r.cut ? { cut: 1 } : {}) };
  if (r.bad) return { ...out, skip: `refused (${r.bad})` };
  if (!w || w.skip) return { ...out, skip: (w && w.skip) || 'not counted' };
  const pb = (w.pbs || []).find(p => p.b === 'highrise-solo');
  // (the cards by their FEAT — never an item's name: ITEM NAMES ONLY TO OWNERS)
  const cards = [['above-the-clouds', 'clouds'], ['top-of-the-world', 'top']].filter(([a]) => (w.ach || []).some(x => (x && x.id ? x.id : x) === a)).map(([, f]) => f);
  // (S4B — "+0 XP" SAYS WHY: the day's XP is done — a solo run past THE SOLO LANE's SOLO_DAY_XP paid runs of the streak day (every solo
  //  game counts toward them: four JAYWALK runs use them up), or a room match past THE DAILY CEILING. `cap` → the line's "DAILY CAP")
  const cap = !(w.xp > 0) && (!!w.capped || !!(w.solo && w.solo.n > w.solo.max));
  return { ...out, xp: w.xp, streak: w.streak, best: !!pb, table: rec != null ? rec : null, cards, ...(w.solo ? { so: w.solo } : {}), ...(cap ? { cap: 1 } : {}) };
}

/**
 * FR7-A's C1 — THE REAL PLAYER COUNT (PURE). A match record may NAME at most MAX_REPORT_NAMES players (twice a full room — the join
 * cap is the client's, so a racing 9th seat still reports; a forged list is refused before the server does any work on it).
 * realPlayers: the names that count — seated in the room, or an account the server knows (a player who left after the match).
 * asSoloRow: what one real player alone is paid as — the solo lane's row (no win, no placing, no records, no award flags).
 */
export const MAX_REPORT_NAMES = MAX_PLAYERS * 2;
export const realPlayers = (names, seated, known) => names.filter(u => !!((seated && seated[u]) || (known && known[u])));
/**
 * FR7 FIXES A — the owner's decision 6: a player who LEFT counts only with proof they sat in THAT room for THAT match — never just an
 * account that exists. The proof = a node of that match only THAT uid could write in that room (the rules: their own uid, phase-gated, during
 * the match — PRISM's board, OVERCLOCK's first challenge's board / its combo marks). A game with no such node here (the dealer's HOLD'EM
 * reports itself) → a leaver is not counted. PURE: → the room-relative paths to look for.
 */
export const PROOF_PATHS = Object.freeze({
  prism: (m, u) => [`prism/${m}/${u}`],
  overclock: (m, u) => [`oc/${m}/0/${u}`, `ocm/${m}/0/${u}`],
});
export const proofPaths = (gid, matchId, uid) => (PROOF_PATHS[gid] ? PROOF_PATHS[gid](matchId, uid) : []);
/**
 * FR7 FIXES B — A SEAT IS NOT A PLAY (the owner's add-on, Grok's second opinion): EVERY credited uid — seated or not — needs its OWN node of
 * THIS match in THIS room. ANY own node counts: PRISM DROP's board (prism/{m}/{u}); OVERCLOCK's board of ANY challenge (oc/{m}/{ci}/{u}), its
 * combo marks (ocm/{m}/{ci}/{u}) or its sealed picks (seal/{CODE}/oc/{m}/{key}/{u}) — a player who sat out challenge 0 but played the rest
 * still counts. The rooms where they live (PURE) → { room: [room-relative trees], seal: [seal-relative trees] }; a game with none here (the
 * dealer's HOLD'EM reports itself; the frozen games) → null = the seat rule as before.
 */
export const PROOF_TREES = Object.freeze({
  prism: m => ({ room: [`prism/${m}`], seal: [] }),
  overclock: m => ({ room: [`oc/${m}`, `ocm/${m}`], seal: [`oc/${m}`] }),
  jaywalk: m => ({ room: [`jw/${m}`], seal: [] }),   // (JAYWALK H1: written AT GO. THE PROOF PASS: a node counts only WITH its GO (provenUids), and in a MATCH only with a hop the server replayed — `played`)
  highrise: m => ({ room: [`hr/${m}`], seal: [] }),   // (HIGH RISE S4A: the same — its own node)
});
/** the games whose proof tree is FLAT — { uid: node } (PRISM's boards, JAYWALK's runs); the others' = { ci | key: { uid: … } } (OVERCLOCK) */
const FLAT_PROOF = new Set(['prism', 'jaywalk', 'highrise']);
/** … of which the proof-node games: a node = { go, c, e } — it counts only with its GO (core/proof.js#goUids) */
const GO_TREES = new Set(['jaywalk', 'highrise']);
/** PURE: the uids a match's trees prove */
export function provenUids(gid, trees) {
  const out = new Set();
  for (const t of trees || []) {
    if (!t || typeof t !== 'object') continue;
    // (THE PROOF PASS — THE SERVER's GUARD 1: in a GO tree (jw · hr) a node counts only WITH its GO — never a node of chunks alone (its
    //  GO gone with a deleted tree), never the tree's own stamp `t0`)
    if (GO_TREES.has(gid)) { for (const u of goUids(t)) out.add(u); continue; }
    if (FLAT_PROOF.has(gid)) { for (const u of Object.keys(t)) out.add(u); continue; }
    for (const per of Object.values(t)) if (per && typeof per === 'object') for (const u of Object.keys(per)) out.add(u);
  }
  return out;
}
export const asSoloRow = row => ({ rank: (row && row.rank) || 1, win: false, solo: true, c: { p: 1 }, rec: {}, ...(row && row.sv === 1 ? { sv: 1 } : {}) });   // (THE PROOF PASS: + `sv` — a proof game's match with ONE real player: its run was the server's own replay → a verified solo run)

export async function processReport(uid, body, now = Date.now(), ip = '') {
  const code = String(body.code || '');
  const matchId = String(body.matchId || '');
  // (APP FIXES: any A–Z — a HUSH WORD uses every letter; the old random codes' alphabet (no I / O) refused rooms like MOON or COIN)
  if (!/^[A-Z]{4}$/.test(code) || !/^[a-z0-9]{3,16}$/.test(matchId)) throw new ApiError(400, 'bad_match');
  const key = `${code}_${matchId}`;
  const myPid = await pidOf(uid);
  if (myPid && ip) await noteSeen(myPid, ip, now);   // (CITY I — SECOND ACCOUNTS: the hashed address noted at a report — api/_lib/seen.js; never throws)
  const done = await val(`results/${key}`);
  if (done && done.st === 'done') return { ok: true, status: done.pre ? 'before_reset' : 'done', outcome: myPid ? (done.o && done.o[myPid]) || null : null };
  // THE DROP A Group 0 (c) — THE LOST RUN: a match the server already VERIFIED and held for a resend (M4's 'retry') carries its checked extract
  // (`xs` — the server's own, server-only node): the resend credits from it, never from the room — a solo room closed by BACK TO THE CITY (or
  // any room gone in the meantime) can no longer lose that run
  if (done && done.st === 'retry' && typeof done.xs === 'string') {
    let x = null;
    try { x = JSON.parse(done.xs); } catch { x = null; }
    if (x && x.ex && x.ex.rows) {
      if (!x.ex.rows[uid]) throw new ApiError(403, 'not_in_match');
      return credit({ key, uid, myPid, ex: x.ex, pids: x.pids || {}, now, room: { code, meta: { hostId: x.mh || null, createdAt: x.mc || 0 }, win: x.win || null }, at: x.at, src: x.src || 'room' });
    }
  }

  const [game, night, players, meta, resetAt] = await Promise.all([val(`rooms/${code}/game`), val(`rooms/${code}/night/${matchId}`), val(`rooms/${code}/players`), val(`rooms/${code}/meta`), val(RESET_AT)]);
  // HE10 (A2 / B1): a dealer's game or a game nobody can start is never credited here — on either path (the room's game, the snapshot's night)
  for (const gid of [game && game.matchId === matchId ? game.id : null, night && night.g].filter(v => v != null)) {
    if (!(await reportableGame(gid, uid, { code, matchId }))) throw new ApiError(409, 'not_reportable', DEALER_GAMES.includes(gid) ? 'The dealer reports this game itself.' : 'This game can’t be counted.');
  }
  // the night record is required, with its time (the server's clock): no record, no match; too old (or from the future), no match
  // (PD-6 — found by the solo XP line's e2e: a phone reports the moment its match ends; the host's `final` step writes the night record a beat
  //  later — a report that came first was refused for good (409), and that run was NEVER credited (SURVIVAL's solo top-outs every time). While
  //  the room's game IS this match, a missing record = still settling: 425, the queue retries (2, 4, 8 … s))
  if (!night && game && game.matchId === matchId) throw new ApiError(425, 'not_final', 'The match record is still being written.');
  if (!night || typeof night.at !== 'number') throw new ApiError(409, 'unverifiable', 'This match has no record in its room.');
  if (now - night.at > MAX_AGE_MS) throw new ApiError(409, 'too_old');
  if (night.at > now + 60_000) throw new ApiError(409, 'unverifiable', 'The match record is from the future.');
  // THE ONE DAY LINE (FR7 FIXES C — M1): a match is credited by its MATCH TIME — the server-stamped finish (night.at — the rules: === now),
  // clamped to ≤ now — and one that FINISHED BEFORE THE PROGRESS RESET is never paid in the new epoch: sealed done (never retried), the phone
  // told quietly ('before_reset' — no outcome, no message)
  const at = Math.min(night.at, now);
  // HIGH RISE S4A — THE SWITCH, asked ONCE (the fresh-eyes review: before the one earlier write a HIGH RISE match could reach)
  const hrOff = night.g === 'highrise' && !(await highriseCounts());
  if (Number(resetAt) > 0 && at < Number(resetAt)) {
    if (hrOff) return { ok: true, status: 'before_reset', outcome: null };   // (counting OFF: not even the sealed record)
    await ref(`results/${key}`).transaction(cur => (cur && cur.st === 'done' ? undefined : { st: 'done', at: now, pre: 1, by: uid, o: {} }));
    return { ok: true, status: 'before_reset', outcome: null };
  }
  // (FR7-A's C1: a record naming more players than a room can ever hold is refused BEFORE anything is extracted from it)
  const inRoom = !!(game && game.matchId === matchId);
  let named = inRoom ? Object.keys(game.participants || {}) : Object.keys(night.p || {});
  if (named.length > MAX_REPORT_NAMES || Object.keys(night.p || {}).length > MAX_REPORT_NAMES) throw new ApiError(409, 'unverifiable', 'Too many players for one match.');
  let ex, src = 'room';
  // JAYWALK H3: a SOLO run (one name on the record, the reporter's) is counted from the SERVER's replay of their proof node — on both paths
  const PG = PROOF_GAMES[night.g] || null;   // (HIGH RISE S4A: + HIGH RISE — the same two paths, its own node + judge)
  // THE PROOF PASS — THE FRESH-EYES REVIEW (finding 2 — THE DROPPED LEADER): the HOST names the players (game.participants · night.p), and
  // at his `final` step he left the leader out — the leader's complete, on-time node sat in the tree and was never read; the host won. The
  // TREE says who played: every uid with an ON-TIME GO (the rules took that GO only from a seated, un-kicked player the game named AT GO —
  // nothing written later takes it back) is a player of this match, named at the end or not. And a SOLO run is one only when the tree
  // holds no other player's GO (naming himself alone, the host turned a match into "his solo run" and sealed everyone else out).
  const proofTree = PG ? (await val(`rooms/${code}/${PG.node}/${matchId}`)) || {} : null;
  const goers = PG ? (g0 => goUids(proofTree).filter(u => onTime(proofTree[u], g0)))(firstGo(proofTree)) : [];
  const jwSolo = !!PG && named.length === 1 && named[0] === uid && Object.keys(night.p || {}).length <= 1 && goers.every(u => u === uid);
  let jwGo = 0, judged = null, matchPlayed = null;   // (judged: the SERVER's own row of the reporter — THE SWITCH's answer reads it · matchPlayed: the uids the server's replay saw PLAY — a hop / a landed slab)
  const jwGame = async () => {
    const node = await val(`rooms/${code}/${PG.node}/${matchId}/${uid}`);
    const J = PG.solo({ code, matchId, uid, node });
    jwGo = (node && Number(node.go)) || 0;
    judged = J.game.results[uid];
    if (!J.v.ok) console.warn(`${night.g} run refused`, `${code}_${matchId}`, J.v.why);
    else if (J.v.cut) console.warn(`${night.g} run cut`, `${code}_${matchId}`, J.v.cut.why, J.v.cut.tick);
    return J.game;
  };
  // JAYWALK H4: a MATCH is counted the same way — every named player's run replayed from their own proof node (the course + tick 0 from
  // THE FIRST GO): nothing the host wrote is read, so the placings need no second opinion — on both paths
  const jwMatch = !!PG && !jwSolo;
  const jwMatchGame = async uids => {
    const all = [...new Set([...uids, ...goers])];   // (… the named + everyone the tree proves started on time)
    if (all.length > MAX_REPORT_NAMES) throw new ApiError(409, 'unverifiable', 'Too many players for one match.');
    named = all;
    const M = PG.match({ code, matchId, uids: all, nodes: proofTree });
    if (!M.game) throw new ApiError(409, 'unverifiable', `This match has no proof (${M.why}).`);
    jwGo = M.game.playAt;
    judged = M.game.results[uid] || null; matchPlayed = new Set(M.played || []);
    for (const [u, r] of Object.entries(M.game.results)) if (r.bad || r.cut) console.warn(`${night.g} match run`, `${code}_${matchId}`, u, r.bad || 'cut');
    return M.game;
  };
  // THE CONSOLE FIX (Nov 20 — docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"): a modified host wrote `final` (or
  // moved the room on) while a rival's run was still LIVE, then reported — the replay cut that run where its phone had been stopped. Now
  // no proof match is counted while any on-time run in it is still live (no `e`, its proof moved within the idle-out, the cap not passed —
  // core/proof.js#liveGoers, the honest host's own rule; read from the players' own nodes + presence, nothing the host writes): 425 +
  // retryAfter, the queue asks again (profile/queue.js — 'still_live' never runs out of tries); the cap ends every wait.
  const holdLive = async () => {
    if (!PG || !PG.live || !goers.length) return;
    const pres = await val(`rooms/${code}/presence`);
    const online = Object.fromEntries(goers.map(u => [u, isOnline(pres, u)]));
    const L = PG.live({ code, matchId, tree: proofTree, now, online });
    if (L.uids.length) throw new ApiError(425, 'still_live', 'A run of this match is still going — it counts the moment it ends.', { retryAfter: liveRetryMs(L.until, now) });
  };
  if (game && game.matchId === matchId) {
    if (game.phase !== 'final') throw new ApiError(425, 'not_final', 'The match is still running.');
    if (jwMatch) await holdLive();
    if (!(jwMatch && goers.includes(uid)) && (!game.participants || !game.participants[uid])) throw new ApiError(403, 'not_in_match');   // (a proof match: a player the tree proves may report, named or not)
    if (game.id !== night.g) { if (DROP_GUARD.includes(night.g)) await wreck(key, uid, now, 'the game'); throw new ApiError(409, 'mismatch', 'The match doesn’t match its record.'); }
    if (jwMatch && game.unproven) throw new ApiError(409, 'unverifiable', 'This match was played without its proof.');
    try { ex = extractMatch(jwSolo ? await jwGame() : jwMatch ? await jwMatchGame(Object.keys(game.participants)) : game, { pulseCounts: loadPulseCounts() }); } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError(409, 'unverifiable', e.message); }
    // the placings the host computed must be the night record's
    // (SHELL 2.0 B1 — THE SOLO LANE: a room of one earns no night points — the host writes 0)
    // (HOLD'EM IN THE CITY — B4: a FULL TIE is a draw — 2 each (core/night.js#nightPoints); a phone still on the code before B4 wrote 3 each —
    //  accepted too, so no result is lost while the room updates)
    const ranks = Object.entries(ex.rows).map(([u, r]) => ({ uid: u, rank: r.rank })), want = nightPoints(ranks, { solo: ex.solo });
    const old = !ex.solo && isAllTied(ranks) ? Object.fromEntries(ranks.map(r => [r.uid, 3])) : null;
    const same = w => ranks.every(r => (w[r.uid] || 0) === ((night.p || {})[r.uid] || 0));
    const agree = jwMatch || ((same(want) || (old && same(old))) && Object.keys(night.p || {}).every(u => ex.rows[u]));
    if (!agree) { if (DROP_GUARD.includes(game.id)) await wreck(key, uid, now, 'placings'); throw new ApiError(409, 'mismatch', 'The placings don’t match the room.'); }
    if (game.id === 'cipher' && !cipherAgrees(game, await val(`rooms/${code}/boards/${matchId}`), code)) throw new ApiError(409, 'mismatch', 'The results don’t match the players’ boards.');
    // THE BEFORE-LAUNCH PASS — HOST TRUST: the host-graded games' results against the players' OWN signed data (a refusal = a sealed wreck)
    // (a scripted UI E2E's hand-made finals — e2e-profiles' podiums — on the LOCAL EMULATORS only: never honoured in production)
    const trustOff = emulated() && (await val('testHostTrustOff')) === true;
    if (game.id === 'prism' && !trustOff) {
      // (the boards: only each player writes theirs, bounded by the play clock — SCORE RUSH capped at them + past THE RUSH BOUND loses its
      //  place; BATTLE / SURVIVAL: a live board put out refuses the match — match-report.js#prismVerify)
      const P = prismVerify(game, await val(`rooms/${code}/prism/${matchId}`));
      if (P.bad) await wreck(key, uid, now, `prism: ${P.bad}`);
      if (P.capped.length || P.voided.length) console.warn('prism rush corrected', key, 'capped', P.capped.join(','), 'past the bound', P.voided.join(','));
      if (P.game !== game) { try { ex = extractMatch(P.game, { pulseCounts: loadPulseCounts() }); } catch (e) { throw new ApiError(409, 'unverifiable', e.message); } }
    }
    if (game.id === 'overclock' && !trustOff) {
      // (THE SERVER's RE-GRADE — js/games/overclock/regrade.js: every challenge rebuilt from the seed + the deal + the sealed picks + the boards)
      const [ocTree, sealTree] = await Promise.all([val(`rooms/${code}/oc/${matchId}`), val(`seal/${code}/oc/${matchId}`)]);
      const R = ocRegrade(game, { oc: ocTree || {}, seal: sealTree || {}, bank: ocBank });
      if (!R.ok) await wreck(key, uid, now, `overclock: ${R.why}${R.ci != null ? ` (challenge ${R.ci + 1})` : ''}`);
    }
  } else if (jwSolo) {
    // (the room moved on — HOP AGAIN started the next run: this run's proof node is still there (the next start keeps it) → the same replay)
    try { ex = extractMatch(await jwGame(), {}); } catch (e) { throw new ApiError(409, 'unverifiable', e.message); }
    src = 'proof';
  } else if (jwMatch) {
    // (the room moved on — a rematch: the finished match's proof nodes are still there (a start keeps the last match's) → the same replay
    //  for EVERYONE the night record names; a report landing after the rematch still credits them all)
    if (!goers.includes(uid) && !(night.p && Object.prototype.hasOwnProperty.call(night.p, uid))) throw new ApiError(403, 'not_in_match');
    await holdLive();   // (THE CONSOLE FIX: the room moved on mid-match — a held phone is still playing its run out)
    try { ex = extractMatch(await jwMatchGame(Object.keys(night.p || {})), {}); } catch (e) { if (e instanceof ApiError) throw e; throw new ApiError(409, 'unverifiable', e.message); }
    src = 'proof';
  } else if (body.snap && typeof body.snap === 'object' && body.snap.matchId === matchId) {
    // the room moved on (a rematch): the PLACINGS from the night record only — never a client's game blob
    if (!(night.p && Object.prototype.hasOwnProperty.call(night.p, uid))) throw new ApiError(403, 'not_in_match');
    // THE BEFORE-LAUNCH PASS — HOST TRUST (the fresh-eyes review, H1): a host-graded match of 2+ is never paid from the placings alone —
    // the checks above need its final game (the honest phones report the moment it ends; the honest host's move-on waits for its own
    // report — host.js#settleFinal). A solo run is its own host.
    if (DROP_GUARD.includes(night.g) && Object.keys(night.p || {}).length >= 2) await wreck(key, uid, now, 'the snapshot (moved on before any report)');
    ex = placingsOnly(night); src = 'snap';
  } else {
    throw new ApiError(409, 'unverifiable', 'This match can’t be checked against its room any more.');
  }
  // FR7 FIXES B — A SEAT IS NOT A PLAY: the uids this match's own nodes prove (null = a game with no proof here: the seat rule as before)
  let proven = null;
  if (PROOF_TREES[ex.gid]) {
    const T = PROOF_TREES[ex.gid](matchId);
    const trees = await Promise.all([...T.room.map(p => val(`rooms/${code}/${p}`)), ...T.seal.map(p => val(`seal/${code}/${p}`))]);
    proven = provenUids(ex.gid, trees);
    // (REVIEW FIX A — MUST 3 + THE PROOF PASS: a MATCH of a proof game counts a player only with a MOVE in the server's own replay — a
    //  landed slab (HIGH RISE), a hop (JAYWALK): a GO alone is not a play)
    if (matchPlayed) proven = new Set([...proven].filter(u => matchPlayed.has(u)));
    // (THE CONSOLE FIX — Group 2, THE DROPPED LEADER for the HOST-GRADED games (the proof pass closed it for JAYWALK + HIGH RISE): the
    //  host names the players at the start (host.js — never changed in a match) and the rules take a board only from one of them; at his
    //  `final` he left the leader out of the list + the night record → the leader's own board proves he played: never counted that way)
    if (DROP_GUARD.includes(ex.gid)) { const names = new Set(named); for (const u of proven) if (!names.has(u)) { await wreck(key, uid, now, 'a dropped player').catch(() => {}); throw new ApiError(409, 'mismatch', 'A player of this match is missing from its result.'); } }   // (THE FRESH-EYES REVIEW: seated or not — deleting the leader's seat too slipped past)
  }
  const playedIt = u => !proven || proven.has(u);
  // credit only uids with a SEAT in the room (players/{uid}) — a name in night.n is not a player — AND (FR7 FIXES B) their own proof
  // (THE CONSOLE FIX — THE TREE SAYS WHO PLAYED, the seat too: in a PROOF match a player the server's own replay saw PLAY is credited
  //  seated or not — the host KICKED the leader mid-run (his phone plays the run out now: room.js#runHoldDone) and the seat check took
  //  the win away all the same. A seat alone still never makes a player.)
  const seatOk = u => !!(players && players[u]) || (jwMatch && !!matchPlayed && matchPlayed.has(u));
  for (const u of Object.keys(ex.rows)) if (!seatOk(u) || !playedIt(u)) delete ex.rows[u];
  if (!ex.rows[uid]) throw new ApiError(403, 'not_in_match');
  // FR7-A's C1 — THE REAL PLAYER COUNT: what a win / a place pays grows with the player count, so the count is the match's REAL players
  // (never the length of a host-written list): seated in the room, or — a player who left after the match — an account the server
  // knows; never above a full room. ONE real player = a solo run: the solo lane's row (no win), only for a game that plays solo.
  // (decision 6: a leaver = an account the server knows AND their own node of THIS match in THIS room — report.js#PROOF_PATHS)
  const known = {};
  await Promise.all(named.filter(u => !(players && players[u])).map(async u => {
    if (!(await pidOf(u))) return;
    if (proven) { if (proven.has(u)) known[u] = true; return; }
    for (const p of proofPaths(ex.gid, matchId, u)) if ((await val(`rooms/${code}/${p}`)) != null) { known[u] = true; return; }
  }));
  // (FR7 FIXES B: a name without its own proof is dropped BEFORE the count — one real player left = the solo rule, as before)
  const real = realPlayers(named.filter(playedIt), players, known).length;
  if (real < 2 && !ex.solo) {
    if (!SOLO_OK[ex.gid]) throw new ApiError(409, 'unverifiable', 'This match had no second player.');
    ex.rows = { [uid]: asSoloRow(ex.rows[uid]) };
    ex.solo = true;
  }
  ex.n = ex.solo ? 1 : Math.min(MAX_PLAYERS, real);

  // (a uid with no profile is never given one here — it isn't counted: each phone makes its own profile when it joins)
  const pids = {};
  await Promise.all(Object.keys(ex.rows).map(async u => { const pid = await pidOf(u); if (pid) pids[u] = pid; }));
  // (LOBBY FIXES — ONE PROFILE, ONE SEAT: two seats of one profile in a match are credited ONCE — the WORSE placing, so a second
  //  device never farms a better one; the match's window goes with it — ONE ACCOUNT, ONE ROOM: progress.js#overlaps)
  dedupePids(ex.rows, pids);
  const win = { c: code, s: Math.min(jwGo || Infinity, (game && game.matchId === matchId && Number(game.go)) || night.at), e: night.at };   // (a JAYWALK run began at its GO)
  // HIGH RISE S4A — THE SWITCH, OFF (until go-live): the run was JUDGED — the proof node replayed, every check above passed — and NOTHING
  // is awarded: no claim on results/, no pstats, no profile, no board row, no card, no streak day (credit() is never reached). The answer
  // says what the counted path WOULD have done — the SAME pure step on a copy (stats.js#wouldApply, reads only).
  if (hrOff && ex.gid === 'highrise') {
    const w = await wouldApply(key, ex, pids, uid, now, { code, meta, win }, at).catch(e => ({ skip: `error (${(e && e.message) || e})` }));
    const rec = ex.rows[uid] && ex.rows[uid].rec ? ex.rows[uid].rec['highrise-solo'] : null;
    return { ok: true, status: 'would_count', outcome: { none: true, would: wouldAward(judged, w, rec) } };
  }
  return credit({ key, uid, myPid, ex, pids, now, room: { code, meta, win }, at, src });
}

/** (THE BEFORE-LAUNCH PASS — HOST TRUST) a refused host-graded match: the quiet count logstats/wreck, then 409 — never sealed (the fresh-eyes
 *  review, M3: a refusal a modified RIVAL can cause must stay a plain answer, never final for everyone) */
async function wreck(key, uid, now, why) {
  console.warn('host-graded match refused', key, why);
  await ref('logstats/wreck').transaction(cur => ({ n: ((cur && cur.n) || 0) + 1, last: now })).catch(() => {});
  throw new ApiError(409, 'mismatch', 'The results don’t match the players’ own boards.');
}
/** the verified match → the players' stats (one processor at a time; M4's resend keeps the checked extract — THE DROP A Group 0 (c)) */
async function credit({ key, uid, myPid, ex, pids, now, room, at, src }) {
  const { code, meta, win } = room;
  // one processor at a time (a stuck claim expires); pstats/m keeps it exactly-once even if two overlap
  const claim = await ref(`results/${key}`).transaction(cur => {
    if (cur && cur.st === 'done') return undefined;
    if (cur && cur.st === 'busy' && now - (cur.at || 0) < 30_000) return undefined;
    return { st: 'busy', at: now, by: uid, ...(cur && cur.o ? { o: cur.o } : {}), ...(cur && cur.xs ? { xs: cur.xs } : {}) };   // (M4: the outcomes of an earlier try are kept — + its checked extract)
  });
  if (!claim.committed) {
    const cur = claim.snapshot.val();
    if (cur && cur.st === 'done') return { ok: true, status: 'done', outcome: myPid ? (cur.o && cur.o[myPid]) || null : null };
    throw new ApiError(425, 'busy', 'Already being counted.');
  }

  const tried = claim.snapshot.val() || {};
  const outcomes = mergeOutcomes(tried.o, await applyMatch(key, ex, pids, now, { code, meta, win }, at));
  // THE ONE DAY LINE (FR7 FIXES C — M4): a player skipped by the 45 s gap (two queued matches flushed seconds apart) or a transaction that didn't
  // commit is NOT sealed done — the result waits ('retry', the outcomes so far kept) and the phone is told 425 + retryAfter; the next try credits
  // the rest (the credited ones skip as 'counted' — exactly once by pstats m/{key})
  if (needsRetry(outcomes)) {
    // (THE DROP A Group 0 (c): + the checked extract — the resend needs no room)
    const xs = tried.xs || JSON.stringify({ ex, pids, at, win: win || null, mh: (meta && meta.hostId) || null, mc: (meta && meta.createdAt) || 0, src });
    await ref(`results/${key}`).set({ st: 'retry', at: now, g: ex.gid, by: uid, o: outcomes, xs });
    throw new ApiError(425, 'too_soon', 'Counting it in a moment.', { retryAfter: MIN_MATCH_GAP_MS + 2000 });
  }
  if (!tried.o) await bumpPlayed(ex.gid, now).catch(e => console.warn('activity', e && e.message));
  await ref(`results/${key}`).set({ st: 'done', at: now, g: ex.gid, mode: ex.mode || null, n: ex.n, src, by: uid, rej: ex.rejected.length || null, o: outcomes });
  if (ex.rejected.length) console.warn('rejected records', key, JSON.stringify(ex.rejected));
  return { ok: true, status: 'counted', outcome: outcomes[pids[uid]] || null, rejected: ex.rejected.filter(r => r.uid === uid).map(r => r.board) };
}

// Expected answers (still running, being counted, can't be verified, not yours) come back as 200 { ok: false, code, retry }:
// they're part of the normal flow for every phone at the podium, not errors (browsers log every 4xx as one).
// HE2 — THE HOLD'EM DEALER rides this function (STILL 8): POST /api/report { holdem: <op>, room, … } → _lib/holdem-store.js. Real HTTP
// statuses (a stale tap is a 409 the phone reads, a flood a 429) + Server-Timing on every answer.
/** THE FIX PASS — S3 b: /api/report's CALL BUDGET (api/daily.js's, the one helper — rl/rp_{uid}) */
export const REPORT_CALLS = { max: 240, windowMs: 10 * 60_000 };
const reportBudget = callBudget('rp', REPORT_CALLS);
export const forgetReportBudget = () => reportBudget.forget();
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
    // (THE FIX PASS — S3 b: THE CALL BUDGET — every report call is several database reads; an honest phone's podium retries ≤ every 2 s
    //  while a run is live (≤ ~180 in a 6-minute hold) + its queue — a script's flood is refused before anything is read)
    if (!reportBudget(uid, Date.now())) throw new ApiError(429, 'slow_down', 'Too many reports — wait a minute.', { retryAfter: 60_000 });
    send(res, 200, withShow(await processReport(uid, body, Date.now(), clientIp(req))));
  } catch (e) {
    if (!(e instanceof ApiError) || e.status >= 500 || e.status === 401) throw e;
    send(res, 200, { ok: false, code: e.code, retry: e.status === 425 || e.status === 429, message: e.message, ...(e.extra && e.extra.retryAfter ? { retryAfter: e.extra.retryAfter } : {}) });
  }
});
