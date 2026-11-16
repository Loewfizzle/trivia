// JAYWALK — THE MATCH's RULES (H1 — docs/jaywalk.md "THE MATCH"): one run each on the SAME seed; the results are REPLAYED from each
// player's own hop log (the proof node rooms/{CODE}/jw/{matchId}/{uid}) — never a number a phone claims. PURE (no DOM, no clock).
// (THE THIN META: the console's values live in meta.js — one source)
import { DEFAULT_SETTINGS, cleanSettings, chatLocked, LIVES } from './meta.js';
import { MODES, TICK_HZ, CLOCK } from './tuning.js';
import { hashString } from '../../core/rng.js';
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
 * THE COURSE IS PICKED AFTER GO (H3 — the owner, Nov 16): a SOLO run's seed = hash(room code + matchId + the SERVER's time of the player's
 * GO — rooms/{CODE}/jw/{matchId}/{uid}/go, the rules: === now, written once). Nobody knows the course before the run is on the clock: no
 * one can shop for an easy one. PURE — the phone and the server derive the same seed. (A MATCH keeps the host's game.seed until H4.)
 */
export const seedOf = (code, matchId, go) => `g${hashString(`${code}:${matchId}:${go}`).toString(36)}${hashString(`jw:${go}:${matchId}:${code}`).toString(36)}`;
/** a SOLO run's tick at a server time: tick 0 = its own GO */
export const soloTick = (go, now) => Math.floor((now - go) * TICK_HZ / 1000);
/** the seed one player's run is played on: SOLO = from their own GO (null before it) · a MATCH = the game's */
export const runSeed = (game, node, code) => (game.mode === 'solo' ? (node && node.go > 0 ? seedOf(code, game.matchId, node.go) : null) : game.seed);

/**
 * ONE player's result from their own node ({ go, c: packed chunks, e? }) — THE REPLAY's, to the server time `now` (a run still going is
 * scored as it stands): { l: lanes, t: the tick they got there, w: the cause, lv: lives left, x: taken (1), e: the tick it ended (−1 = not
 * yet), y · px: where the kid went out (the end screen names what hit them), go: their GO (a solo run's seed comes from it) }. No node / a
 * log that breaks the bounds → the run of a kid who never hopped (an empty log: the wall takes them); a solo run with no GO → nothing.
 */
export function scoreRun(game, node, now = null, code = '') {
  const seed = runSeed(game, node, code);
  if (!seed) return { l: 0, t: 0, w: '', lv: 0, e: -1 };
  let log = node && node.c != null ? logFromChunks(node.c) : [];
  if (!log || logProblem(log, game.mode)) log = [];
  const until = now == null ? null : game.mode === 'solo' ? Math.max(0, soloTick(node.go, now)) + CLOCK.ahead : Math.max(0, tickAt(game, now));
  const r = replay({ seed, mode: game.mode, lives: game.settings && game.settings.lives, log, until });
  return { l: r.lanes, t: r.tick, w: r.cause || '', lv: r.lives, e: r.end, y: r.y, px: r.x, ...(r.taken ? { x: 1 } : {}), ...(game.mode === 'solo' ? { go: node.go } : {}) };
}
/** every participant's result (a silent-but-present player still has a run) */
export function scoreRuns(game, runs, now = null, code = '') {
  const out = {};
  for (const uid of Object.keys(game.participants || {})) out[uid] = scoreRun(game, runs && runs[uid], now, code);
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
