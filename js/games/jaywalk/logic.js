// JAYWALK — THE MATCH's RULES (H1 — docs/jaywalk.md "THE MATCH"): one run each on the SAME seed; the results are REPLAYED from each
// player's own hop log (the proof node rooms/{CODE}/jw/{matchId}/{uid}) — never a number a phone claims. PURE (no DOM, no clock).
// (THE THIN META: the console's values live in meta.js — one source)
import { DEFAULT_SETTINGS, cleanSettings, chatLocked, LIVES } from './meta.js';
import { MODES, TICK_HZ } from './tuning.js';
import { replay, logProblem, logFromChunks } from './replay.js';

export { DEFAULT_SETTINGS, cleanSettings, chatLocked, LIVES };

export const COUNT_MS = 3000;             // (3 · 2 · 1 before GO)
export const END_GRACE_MS = 4000;         // (after THE MOTHERSHIP's tick: the last chunks land)
/** one player = SOLO ENDLESS; a room = the MATCH */
export const modeOf = participants => (Object.keys(participants || {}).length === 1 ? 'solo' : 'match');
/** a tick ↔ the server clock: tick 0 is GO (game.playAt) */
export const tickAt = (game, now) => Math.floor((now - game.playAt) * TICK_HZ / 1000);
/** the moment THE MOTHERSHIP comes (ms) — null in solo endless */
export const capAt = game => { const c = MODES[game.mode] ? MODES[game.mode].cap : 0; return c ? game.playAt + Math.ceil(c * 1000 / TICK_HZ) : null; };

/**
 * ONE player's result from their own node ({ go, c: packed chunks, e? }) — THE REPLAY's, to the tick `until` (a run still going is scored
 * as it stands): { l: lanes, t: the tick they got there, w: the cause, lv: lives left, x: taken (1) }. No node / a log that breaks the
 * bounds → the run of a kid who never hopped from where the log was last sound (an empty log: the wall takes them).
 */
export function scoreRun(game, node, until = null) {
  let log = node && node.c != null ? logFromChunks(node.c) : [];
  if (!log || logProblem(log, game.mode)) log = [];
  const r = replay({ seed: game.seed, mode: game.mode, lives: game.settings && game.settings.lives, log, until });
  return { l: r.lanes, t: r.tick, w: r.cause || '', lv: r.lives, ...(r.taken ? { x: 1 } : {}) };
}
/** every participant's result (a silent-but-present player still has a run) */
export function scoreRuns(game, runs, until = null) {
  const out = {};
  for (const uid of Object.keys(game.participants || {})) out[uid] = scoreRun(game, runs && runs[uid], until);
  return out;
}

/** THE RANKING: lanes reached, the EARLIER tick wins a tie (the same lanes at the same tick share the place) → [{ uid, rank, score, lanes, tick }] */
export function standings(game) {
  const res = (game && game.results) || {};
  const rows = Object.keys((game && game.participants) || {}).map(uid => { const r = res[uid] || {}; return { uid, lanes: Number(r.l) || 0, tick: Number(r.t) || 0 }; });
  rows.sort((a, b) => b.lanes - a.lanes || a.tick - b.tick || (a.uid < b.uid ? -1 : 1));
  let rank = 0;
  return rows.map((r, i) => {
    if (!i || r.lanes !== rows[i - 1].lanes || r.tick !== rows[i - 1].tick) rank = i + 1;
    return { uid: r.uid, rank, score: r.lanes, lanes: r.lanes, tick: r.tick };
  });
}
