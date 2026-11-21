// JAYWALK — THE SERVER HALF (H1 — docs/jaywalk.md "THE REPLAY + THE PROOF"). NOT a function (the 8 stay 8) and PURE: it never imports
// fb.js (THE UNIT JOB INSTALLS NOTHING — tests/jaywalk-server.test.mjs runs it in Node). verifyRun = THE JUDGE (js/games/jaywalk/replay.js
// #judgeRun: THE HOP LOG's bounds + THE SPEED CHECK both ways + THE DROPPED SIGNAL + THE REPLAY — the SAME engine the phone ran) → the
// server's own result; a phone's claimed lanes are never read.
// WIRED: /api/report counts a SOLO run only from jaywalkSolo (H3) and a MATCH only from jaywalkMatch (H4) — the proof nodes
// rooms/{CODE}/jw/{matchId}/{uid} read by the server (GO's server time → the course; the chunks → the log + its clock).
import { judgeRun, seedProblem, logFromChunks, chunkTimes } from '../../js/games/jaywalk/replay.js';
import { MODES } from '../../js/games/jaywalk/tuning.js';
import { seedOf, matchStart, scoreNode, scoreCalls, featsOf, matchVersion, nodeVersion } from '../../js/games/jaywalk/logic.js';
import { versionAt, setCvSwitch } from '../../js/games/jaywalk/versions.js';
import { onTime, goOf } from '../../js/core/proof.js';

export { logFromChunks, seedOf };

// J2 — COURSE RULES v2: the local emulator's E2E may move the switch (JW_CV_SWITCH_MS) — honoured OFF Vercel only (the deployed site never
// moves it: api/_lib/dailies.js#testingEnv's rule). The page does the same from `?emu&jwcv=` (view.js) so the two agree.
export function cvFromEnv(env = process.env) {
  if (env.VERCEL || env.VERCEL_ENV || env.JW_CV_SWITCH_MS == null || env.JW_CV_SWITCH_MS === '') return false;
  const ms = Number(env.JW_CV_SWITCH_MS);
  if (!Number.isFinite(ms)) return false;
  setCvSwitch(ms);
  return true;
}
cvFromEnv();

/**
 * → { ok: true, result: { lanes, tick, end, cause, taken, hits, y, x, feats: { boom, ufo, airfield, mothership } }, cut? } | { ok: false, why }
 * (H6A — THE FOUR CARDS: the feats ride each result row as `f` — 'boom ufo airfield mothership'; core/match-report.js#jaywalkExtra reads them
 *  ONLY from a match the server built itself, `sv`)
 * Refused: a bad seed / mode · a log past its length cap · ticks not rising · inputs closer than a hand can tap · a hop past THE
 * MOTHERSHIP's tick · a hop logged after the run had ended (the replay never played it) · a run that never ended · (with `go` + `times` —
 * the chunks' clock) a log AHEAD of the real clock, or one whose clock is broken. A log that falls BEHIND the clock with no silence to
 * explain it (a slowed game) is CUT, never thrown away: the run counts up to its last on-time hop (`cut: { why: 'behind', tick }`). A
 * DROPPED SIGNAL (a silence, then the queued chunks arriving together) is never held against the run (replay.js#clockProblem).
 */
export function verifyRun({ seed, mode = 'solo', log, go = null, times = null, from = null, cv = 1, end = null } = {}) {
  if (!MODES[mode]) return { ok: false, why: 'mode' };
  if (seedProblem(seed)) return { ok: false, why: 'seed' };
  const j = judgeRun({ seed, mode, log, go, times, from, cv, end });   // (J2 FIX — `end`: THE END CHECK, v2 only)
  if (!j.ok) return j;
  if (!j.cut && !j.over) return { ok: false, why: 'never ended' };
  return j.cut ? { ok: true, result: j.result, cut: j.cut } : { ok: true, result: j.result };
}

/**
 * H3 — ONE player's PROOF NODE ({ go, c: { i: { s, at } }, e? } — rooms/{CODE}/jw/{matchId}/{uid}, read by the SERVER) → verifyRun's answer
 * for a SOLO run: the seed = seedOf(code, matchId, go) — the course picked after GO; tick 0 = that GO. No GO = no run.
 */
export function verifyNode({ code, matchId, node } = {}) {
  if (!node || typeof node !== 'object' || !(Number(node.go) > 0)) return { ok: false, why: 'no go' };
  const log = logFromChunks(node.c), times = chunkTimes(node.c);
  if (!log || !times) return { ok: false, why: 'chunks' };
  // (J2: the course version in force at its GO, checked against the node's own `cv` — none = an old-code phone: v1 until THE GRACE ends)
  const cv = nodeVersion(node, versionAt(node.go));
  const v = verifyRun({ seed: seedOf(String(code), String(matchId), node.go), mode: 'solo', log, go: node.go, times, cv, end: node.e || null });
  return v.ok && cv === 2 ? { ...v, cv } : v;
}

/** the result row the match report reads (logic.js#scoreNode's shape) from the server's own verify — a refused run = a kid who never hopped */
// (J1 — SPLIT TIMES: + `sp` — the ticks each 50 lanes was first reached in THE SERVER's replay; core/match-report.js#jaywalkExtra passes them on)
export const serverRow = v => (v && v.ok ? { l: v.result.lanes, t: v.result.tick, w: v.result.cause || '', e: v.result.end, ...(v.result.taken ? { x: 1 } : {}), ...(featsOf(v.result) ? { f: featsOf(v.result) } : {}), ...(v.result.splits && v.result.splits.length ? { sp: v.result.splits } : {}), ...(v.cut ? { cut: 1 } : {}), ...(v.cv === 2 ? { cv: 2 } : {}) } : { l: 0, t: 0, w: '', e: -1, bad: String((v && v.why) || 'refused').slice(0, 24) });

/**
 * H3 — THE SERVER'S OWN RESULT (PURE): a SOLO run is counted ONLY from the server's replay of the player's proof node (GO's server time →
 * the course's seed; the timestamped chunks → the hop log + its clock) — never from the room's game.results (the host — the player — wrote
 * those), never from a phone's claim. → { game: the match as the server saw it (`sv` marks it: only such a match earns a record —
 * core/match-report.js#jaywalkExtra), v: verifyNode's answer }. The room's game may be GONE (PLAY AGAIN starts the next run at once): the
 * proof node + the night record are enough (api/report.js).
 */
export function jaywalkSolo({ code, matchId, uid, node }) {
  const v = verifyNode({ code, matchId, node });
  return { game: { id: 'jaywalk', matchId, phase: 'final', mode: 'solo', sv: 1, participants: { [uid]: true }, settings: {}, results: { [uid]: serverRow(v) } }, v };
}

/**
 * H4 — A MATCH, THE SERVER'S OWN (PURE): every named player's run REPLAYED from their own proof node — the SAME judge the host's podium
 * ran (logic.js#scoreNode). The course + tick 0 come from THE FIRST GO among the match's nodes (logic.js#matchStart) — nothing the host
 * wrote is read: not game.seed, not game.playAt, not game.results. A named player with no node has no run (A SEAT IS NOT A PLAY — the
 * report drops them). The room's game may be GONE (a rematch): the proof nodes + the night record are enough.
 * THE PROOF PASS (Nov 20 — the review's MUST 2 step 1 + MUST 3, for JAYWALK): THE SERVER's TWO GUARDS + "a GO alone is not a player" —
 *   · a node counts only with a GO (a node of chunks alone — its GO deleted with the tree, a host's trick — is no run: 'no go')
 *   · a GO later than GO_WINDOW_MS after THE FIRST GO is no run ('late go' — the host who GOes alone early and adds the rivals later
 *     wins nothing: their runs are dropped, he is left a solo run)
 *   · `played` = the uids whose run THE JUDGE counted at least ONE HOP of (JW_PLAYED_HOPS) — a seat that only wrote GO is not a player: the
 *     report counts + credits only these (api/report.js — HIGH RISE's hrPlayed, the same rule)
 * → { game (`sv` 1), played } | { game: null, why } (no GO at all, or nobody ever hopped — nothing to count)
 */
/** a JAYWALK match player = at least this many hops in THE SERVER's own replay of their node */
export const JW_PLAYED_HOPS = 1;
/**
 * THE FRESH-EYES REVIEW (finding 3 — THE SORE LOSER): the leaves hang on the player's own GO for 3 h now, so a player who LOST could break
 * his own log after the podium (one junk chunk behind a hole, a hop after his own end) before the first report sealed the match: his whole
 * log was refused → 0 hops → "not a player" → the winner of a 2-player match was paid as a solo run (no win, no record). A refused log
 * still PLAYED when its FIRST CHUNK (written once, in real time, long before any sabotage) replays with a hop: he is a player who lost
 * — his row stays the refused one (0 lanes), the count + the winner's win stand. A seat that never made a valid hop is still nobody.
 */
function firstChunkHops(S, node) {
  const c0 = node && node.c != null ? node.c[0] : null, o = { hops: 0 };
  if (c0 == null) return 0;
  const r = scoreNode({ seed: S.seed, mode: 'match', node: { ...node, c: { 0: c0 }, e: null }, t0: S.playAt, from: S.g0, out: o, cv: nodeVersion(node, matchVersion(S)) });
  return r.bad ? 0 : o.hops;
}
export function jaywalkMatch({ code, matchId, uids, nodes }) {
  const S = matchStart(String(code), String(matchId), nodes), ids = (uids || []).filter(u => typeof u === 'string');
  if (!S || ids.length < 2) return { game: null, why: S ? 'players' : 'no go' };
  if (!ids.some(u => onTime(nodes[u], S.g0) && nodes[u].c != null)) return { game: null, why: 'no hops' };
  const results = {}, participants = {}, played = [];
  for (const u of ids) {
    participants[u] = true;
    const node = nodes && nodes[u], o = { hops: 0 };
    // (J2: every node on the MATCH's version — the one in force at THE FIRST GO — checked against its own `cv`)
    results[u] = onTime(node, S.g0) ? scoreNode({ seed: S.seed, mode: 'match', node, t0: S.playAt, from: S.g0, out: o, cv: nodeVersion(node, matchVersion(S)) }) : { l: 0, t: 0, w: '', e: -1, bad: goOf(node) ? 'late go' : 'no go' };
    if (o.hops >= JW_PLAYED_HOPS || (results[u].bad && onTime(node, S.g0) && firstChunkHops(S, node) >= JW_PLAYED_HOPS)) played.push(u);
  }
  const game = { id: 'jaywalk', matchId, phase: 'final', mode: 'match', sv: 1, seed: S.seed, playAt: S.playAt, g0: S.g0, participants, settings: {}, results };
  const calls = scoreCalls(game, nodes, results);
  if (Object.keys(calls).length) game.calls = calls;
  return { game, played };
}
