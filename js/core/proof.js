// THE PROOF TREE — what JAYWALK's `jw` + HIGH RISE's `hr` SHARE (THE PROOF PASS, Nov 20 — docs/match-kit.md "THE PROOF TREE"). PURE (no
// The long notes: docs/games/jaywalk-notes.md

/** a GO is on time within this of the tree's stamp (the rules) = of THE FIRST GO (the server's guard, the host's podium): 5 s —
 *  database.rules.json's `jw` / `hr` `go` rule carries the same number (pinned by tests/proof-pass.test.mjs) */
export const GO_WINDOW_MS = 5000;
/** the tree's own key (never a uid: a Firebase uid is 28 characters) */
export const T0_KEY = 't0';
/** a leaf (a chunk, the end, the rule set, a call) is taken this long after its player's own GO (the rules) */
export const LEAF_MS = 3 * 3600_000;
/** … HIGH RISE's `rs` (the run's rule set) only this long after its player's GO (THE FRESH-EYES REVIEW: a match's rule set is THE FIRST GO's
 *  player's — with 3 h to write it, a first-GO seat that never taps could switch the set after the fact the day a second set ships) */
export const RS_MS = 10_000;
/** a Call the Winner pick names a uid: letters + digits, at most this long (the rules' bound — it had none: megabytes fitted in `k/w`) */
export const CALL_UID_MAX = 64;
/** THE SWITCH-OVER (the rules' `go`): until this server time a GO is still taken in a tree WITHOUT a stamp — a phone that has not
 *  refreshed since the deploy never stamps one, and its run must still count. After it every GO needs the stamp. Nov 27 2026, 09:00 UTC
 *  (4 am New York — the streak day's line). Pinned equal to the rules' number by tests/proof-pass.test.mjs. */
export const T0_SUNSET_MS = Date.UTC(2026, 10, 27, 9, 0, 0);

/** THE PROOF GAMES: the games whose runs THE SERVER REPLAYS ITSELF from the player's proof node (api/report.js#PROOF_GAMES — pinned equal
 *  by tests/proof-solo.test.mjs). A VERIFIED SOLO RUN IS A COUNTED PLAY: core/match-report.js marks their rows `sv`, core/board-fill.js
 *  re-counts their solo records. */
export const VERIFIED_SOLO = Object.freeze(['jaywalk', 'highrise', 'freefall']);   // (FREEFALL F4A: + FREEFALL — hidden, its counting OFF: api/_lib/freefall.js#FREEFALL_COUNTS)

/** a player's node → its GO (the server's time), 0 = none (a number child — the stamp — is not a node) */
export const goOf = node => { const v = node && typeof node === 'object' ? Number(node.go) : 0; return v > 0 ? v : 0; };
/** the tree's stamp (0 = none: a tree from before the re-publish, or an old phone's) */
export const stampOf = tree => { const v = tree ? Number(tree[T0_KEY]) : 0; return v > 0 && typeof tree[T0_KEY] === 'number' ? v : 0; };
/**
 * THE FIRST GO: the EARLIEST `go` among a match's proof nodes (0 = none yet). Every phone writes its own GO in the count's last 2 s; the
 * server stamps each on arrival, and a later arrival always carries a later time — so the first GO is FINAL the moment it lands, the
 * same on every phone and on the server, whoever the host is.
 */
export function firstGo(tree) {
  let g = 0;
  if (tree && typeof tree === 'object') for (const k in tree) { const v = goOf(tree[k]); if (v > 0 && (!g || v < g)) g = v; }
  return g;
}
/** is this node's GO in the match? (within GO_WINDOW_MS of THE FIRST GO `g0`) — a later one is no run: the rules refuse it once the
 *  tree is stamped; the server + the host's podium drop it whatever the rules were */
export const onTime = (node, g0) => { const v = goOf(node); return v > 0 && g0 > 0 && v <= g0 + GO_WINDOW_MS; };
/** the uids of a tree that are PLAYERS' NODES with a GO (THE SERVER's guard 1: "a node counts only with a GO" — never a node of chunks
 *  alone, never the stamp) */
export function goUids(tree) {
  const out = [];
  if (tree && typeof tree === 'object') for (const k of Object.keys(tree)) if (goOf(tree[k]) > 0) out.push(k);
  return out;
}
/**
 * CALL THE WINNER's two shared guards (both games' scoreCalls — the inbox, Nov 20 ~12:49 am (3) + the review's NICE): a player with NO
 * RUN (no GO on time) is never "still in" — they can not be named, and they are not counted among the players a call was made against;
 * and a FULL DRAW (everyone first) pays nobody (there was no winner to call).
 */
export const inMatch = (runs, uid, g0) => onTime(runs && runs[uid], g0);
export const fullDraw = (first, ids) => ids.length > 1 && first.length >= ids.length;

// THE CONSOLE FIX (Nov 20 — docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"): a MODIFIED host wrote `final` (or moved …
/** when a player's proof last moved (ms, a server time): their newest chunk's arrival, else their GO, else the match's tick 0 */
export function lastSeenAt(node, playAt) {
  let at = playAt || 0;
  if (node && node.go > at) at = node.go;
  const c = node && node.c;
  if (c && typeof c === 'object') { let hi = -1; for (const k in c) { const i = Number(k); if (i > hi) hi = i; } const v = hi >= 0 ? c[hi] : null; if (v && v.at > at) at = v.at; }
  return at;
}
/** the soonest a report waits again (ms) · the longest (a live run sends a chunk at least every few seconds — the wait is re-asked) */
export const LIVE_RETRY_MIN_MS = 2000, LIVE_RETRY_MAX_MS = 20_000;
/**
 * THE LIVE RUNS of a proof match — the on-time GOs whose run has NOT ended as far as the database can tell: no `e`, its proof moved within
 * `idleMs` (+ `dropMs` while its player is offline — THE DROPPED SIGNAL) and the cap (+ `graceMs`) not yet passed. EXACTLY the host's own
 * "has it ended?" rule (director.js#endedFor — both games): an honest host writes `final` only once this is empty, so an honest match never
 * waits for it. NEVER FOREVER: past `capAt + graceMs` nothing is live (a modified rival who keeps writing can stall a report to the cap,
 * never past it); a dead phone idles out like it always did.
 * `tree` = { uid: node, t0 } · `online` = { uid: bool } (null = everyone online) · → { uids, until } (`until`: when the soonest of them
 * would end with no new chunk — the server's retryAfter)
 */
export function liveGoers(tree, { now, online = null, playAt, capAt, idleMs, dropMs = 0, graceMs = 0 }) {
  const uids = [];
  let until = 0;
  const g0 = firstGo(tree);
  if (!g0 || !(now < capAt + graceMs)) return { uids, until };
  for (const u in tree) {
    const node = tree[u];
    if (!onTime(node, g0) || node.e != null) continue;
    const end = Math.min(capAt + graceMs, lastSeenAt(node, playAt) + idleMs + (online && !online[u] ? dropMs : 0));
    if (now < end) { uids.push(u); if (!until || end < until) until = end; }
  }
  return { uids, until };
}
/** the server's "count it in a moment" for a match with live runs: soon, never past the soonest end, re-asked */
export const liveRetryMs = (until, now) => Math.max(LIVE_RETRY_MIN_MS, Math.min(LIVE_RETRY_MAX_MS, Math.ceil(until - now) + 500));

// THE FIX PASS — S3 (a), THE CHUNK CEILING (THE FABLE REVIEW: a node took 10,000 chunks in any order — 2,000 went up in ONE 0.3 s write, …
export const CHUNK_SLACK = 10;
/** → the most chunks a node may hold, or Infinity (no GO / no chunks: nothing to bound) */
export function chunkCeiling(node, perSec) {
  const c = node && node.c, go = Number(node && node.go) || 0;
  if (!c || typeof c !== 'object' || !(go > 0)) return Infinity;
  let hi = go;
  for (const k in c) { const v = c[k], at = v && typeof v === 'object' ? Number(v.at) || 0 : 0; if (at > hi) hi = at; }
  return Math.floor((hi - go) / 1000) * perSec + CHUNK_SLACK;
}
/** → true when a node holds more chunks than its own clock allows (one key count + one stamp read a chunk — no string touched) */
export function overChunkCeiling(node, perSec) {
  const c = node && node.c;
  if (!c || typeof c !== 'object') return false;
  const cap = chunkCeiling(node, perSec);
  let n = 0;
  for (const k in c) { void k; if (++n > cap) return true; }
  return false;
}
