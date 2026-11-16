// JAYWALK — THE SERVER HALF (H1 — docs/jaywalk.md "THE REPLAY + THE PROOF"). NOT a function (the 8 stay 8) and PURE: it never imports
// fb.js (THE UNIT JOB INSTALLS NOTHING — tests/jaywalk-server.test.mjs runs it in Node). verifyRun = THE HOP LOG's bounds + THE SPEED CHECK
// (H3 — both ways, from the chunks' own server timestamps) + THE REPLAY — the SAME engine the phone ran (js/games/jaywalk/) → the server's
// own result; a phone's claimed lanes are never read.
// WIRED (H3): /api/report counts a SOLO run only from verifyNode — the proof node rooms/{CODE}/jw/{matchId}/{uid} read by the server
// (GO's server time → the seed; the chunks → the log + its clock). H4 — the match: every player's node the same way.
import { replay, logProblem, seedProblem, logFromChunks, chunkTimes, clockProblem } from '../../js/games/jaywalk/replay.js';
import { MODES, ONE_UP } from '../../js/games/jaywalk/tuning.js';
import { seedOf } from '../../js/games/jaywalk/logic.js';

export { logFromChunks, seedOf };

/**
 * → { ok: true, result: { lanes, tick, end, cause, lives, taken, hits, y, x, feats: { boom, ufo, airfield } }, cut? } | { ok: false, why }
 * Refused: a bad seed / mode / lives · a log past its length cap · ticks not rising · inputs closer than a hand can tap · a hop past THE
 * MOTHERSHIP's tick · a hop logged after the run had ended (the replay never played it) · (with `go` + `times` — the chunks' clock) a log
 * AHEAD of the real clock, or one whose clock is broken. A log that falls far BEHIND the clock (a slowed game) is CUT, never thrown away:
 * the run counts up to its last on-time hop (`cut: { why: 'behind', tick }` — THE DROP's rescue: a dropped signal never costs the whole run).
 */
export function verifyRun({ seed, mode = 'solo', log, lives, oneUp = ONE_UP, go = null, times = null } = {}) {
  const M = MODES[mode];
  if (!M) return { ok: false, why: 'mode' };
  if (seedProblem(seed)) return { ok: false, why: 'seed' };
  if (lives != null && !M.livesOpt.includes(lives)) return { ok: false, why: 'lives' };
  const bad = logProblem(log, mode);
  if (bad) return { ok: false, why: bad };
  let cut = null;
  if (go != null || times != null) {
    const c = clockProblem(go, times);
    if (c && c.why !== 'behind') return { ok: false, why: c.why === 'ahead' ? 'ahead of the clock' : c.why === 'clock' ? 'the chunks\' clock' : c.why };
    if (c) cut = { why: 'behind', tick: c.tick, hops: c.hops };
  }
  if (cut) {
    const r = replay({ seed, mode, log: log.slice(0, cut.hops), lives, oneUp: !!oneUp, until: cut.tick });
    const { used, over, ...result } = r; void used; void over;
    return { ok: true, result, cut: { why: cut.why, tick: cut.tick } };
  }
  const r = replay({ seed, mode, log, lives, oneUp: !!oneUp });
  if (r.used < log.length) return { ok: false, why: 'past the end' };
  if (!r.over) return { ok: false, why: 'never ended' };
  const { used, over, ...result } = r; void used; void over;
  return { ok: true, result };
}

/**
 * H3 — ONE player's PROOF NODE ({ go, c: { i: { s, at } }, e? } — rooms/{CODE}/jw/{matchId}/{uid}, read by the SERVER) → verifyRun's answer.
 * SOLO: the seed = seedOf(code, matchId, go) — the course picked after GO; a MATCH (H4) passes the game's seed. No GO = no run.
 */
export function verifyNode({ code, matchId, node, mode = 'solo', seed = null, lives } = {}) {
  if (!node || typeof node !== 'object' || !(Number(node.go) > 0)) return { ok: false, why: 'no go' };
  const log = logFromChunks(node.c), times = chunkTimes(node.c);
  if (!log || !times) return { ok: false, why: 'chunks' };
  return verifyRun({ seed: mode === 'solo' ? seedOf(String(code), String(matchId), node.go) : seed, mode, log, lives, go: node.go, times });
}

/** the result row the match report reads (logic.js#scoreRun's shape) from the server's own verify — a refused run = a kid who never hopped */
export const serverRow = v => (v && v.ok ? { l: v.result.lanes, t: v.result.tick, w: v.result.cause || '', lv: v.result.lives, e: v.result.end, ...(v.cut ? { cut: 1 } : {}) } : { l: 0, t: 0, w: '', lv: 0, e: -1, bad: String((v && v.why) || 'refused').slice(0, 24) });

/**
 * H3 — THE SERVER'S OWN RESULT (PURE): a SOLO run is counted ONLY from the server's replay of the player's proof node (GO's server time →
 * the course's seed; the timestamped chunks → the hop log + its clock) — never from the room's game.results (the host — the player — wrote
 * those), never from a phone's claim. → { game: the match as the server saw it (`sv` marks it: only such a match earns a record —
 * core/match-report.js#jaywalkExtra), v: verifyNode's answer }. The room's game may be GONE (HOP AGAIN starts the next run at once): the
 * proof node + the night record are enough (api/report.js).
 */
export function jaywalkSolo({ code, matchId, uid, node }) {
  const v = verifyNode({ code, matchId, node, mode: 'solo', lives: 1 });
  return { game: { id: 'jaywalk', matchId, phase: 'final', mode: 'solo', sv: 1, participants: { [uid]: true }, settings: { lives: 1 }, results: { [uid]: serverRow(v) } }, v };
}
