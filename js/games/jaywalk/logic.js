// JAYWALK — THE MATCH's RULES (H1 + H4 — docs/jaywalk.md "THE MATCH"): one run each on the SAME course, ONE LIFE; the results are REPLAYED
// The long notes: docs/games/jaywalk-notes.md
import { DEFAULT_SETTINGS, cleanSettings, chatLocked } from './meta.js';
import { MODES, TICK_HZ, CLOCK } from './tuning.js';
import { hashString } from '../../core/rng.js';
import { CALL_MS, callBonus } from '../../core/playlist.js';
import { judgeRun, logFromChunks, chunkTimes } from './replay.js';
import { firstGo, onTime, goOf, inMatch, fullDraw, overChunkCeiling } from '../../core/proof.js';
/** THE FIX PASS — S3 a: the most chunks a second this game's writer can send (a match: each move within CLOCK.flushMatchMs, stop-and-wait) */
export const CHUNKS_PER_SEC = Math.ceil(1000 / CLOCK.flushMatchMs);
import { versionAt, runVersion } from './versions.js';

export { DEFAULT_SETTINGS, cleanSettings, chatLocked, CALL_MS };

export const COUNT_MS = 3000;             // (3 · 2 · 1 before GO)
/** H4 — a MATCH's tick 0 = THE FIRST GO + this (every phone writes its GO in the count's last 2 s — the rules' window) */
export const GO_LEAD_MS = 2000;
/** no GO at all this long after the count's end (no signal anywhere, the rules not published) → the match plays UNPROVEN, never counted */
export const NO_GO_MS = 3000;
export const END_GRACE_MS = 4000;
/** THE DROPPED SIGNAL in a match: a player whose proven log says OUT but whose own end never arrived is waited for this long (their … */
export const DROP_WAIT_MS = CLOCK.drop;
/** Call the Winner: a call counts when it was made within this of the caller's own end (the hit is seen first, then the kit's window) */
export const CALL_WINDOW_MS = CALL_MS + 6000;
/** one player = SOLO ENDLESS; a room = the MATCH */
export const modeOf = participants => (Object.keys(participants || {}).length === 1 ? 'solo' : 'match');
/** a tick ↔ the server clock: tick 0 is GO (game.playAt) */
export const tickAt = (game, now) => Math.floor((now - game.playAt) * TICK_HZ / 1000);
/** the moment THE MOTHERSHIP comes (ms) — null in solo endless */
export const capAt = game => { const c = MODES[game.mode] ? MODES[game.mode].cap : 0; return c ? game.playAt + Math.ceil(c * 1000 / TICK_HZ) : null; };

/** … */
export const seedOf = (code, matchId, go) => `g${hashString(`${code}:${matchId}:${go}`).toString(36)}${hashString(`jw:${go}:${matchId}:${code}`).toString(36)}`;
/** a SOLO run's tick at a server time: tick 0 = its own GO */
export const soloTick = (go, now) => Math.floor((now - go) * TICK_HZ / 1000);
/** … */
export { firstGo };
/** the match's clock + course from its proof nodes (null = no GO yet) — PURE: the phones, the host's director and the server agree */
export const matchStart = (code, matchId, runs) => { const g0 = firstGo(runs); return g0 ? { g0, playAt: g0 + GO_LEAD_MS, seed: seedOf(code, matchId, g0) } : null; };
/** … */
export function startOf(game, runs, code) {
  const m = game && game.mode !== 'solo' && runs ? matchStart(code, game.matchId, runs) : null;
  if (m && (!game.unproven || goBeforeGiveUp(game, m))) return m;
  return game && game.phase !== 'count' && game.seed ? { g0: game.g0 || 0, playAt: game.playAt, seed: game.seed } : null;
}
/** THE PROOF PASS — A HOST HICCUP AT GO (HIGH RISE's REVIEW FIX A, SHOULD 1 — js/games/highrise/match.js#goBeforeGiveUp, ported): the … */
export const goBeforeGiveUp = (game, S) => !!(S && game && game.phaseStartAt && S.g0 <= game.phaseStartAt);
/** J2 — COURSE RULES v2 (versions.js): the version a MATCH is played on = the one in force at THE FIRST GO (`g0`; a stand-in course with no … */
export const matchVersion = S => versionAt(S && S.g0 > 0 ? S.g0 : S ? S.playAt - GO_LEAD_MS : 0);
/** the version ONE run replays on, from its proof node: its own `cv` checked against the version in force at its GO (a solo run: its own … */
export const nodeVersion = (node, E) => runVersion(node && node.cv != null ? node.cv : null, E, goOf(node));
/** the seed one player's run is played on: SOLO = from their own GO (null before it) · a MATCH = the game's (the director's GO patch) */
export const runSeed = (game, node, code) => (game.mode === 'solo' ? (node && node.go > 0 ? seedOf(code, game.matchId, node.go) : null) : game.seed || null);

const NONE = Object.freeze({ l: 0, t: 0, w: '', e: -1 });
/** H6A — a result's feats as the row carries them: 'boom ufo airfield mothership' ('' = none) */
export const featsOf = r => Object.keys(r.feats || {}).filter(k => r.feats[k]).join(' ');
/** … */
export function scoreNode({ seed, mode, node, t0, from = null, until = null, out = null, cv = 1 }) {
  // (THE FIX PASS — S3 a: THE CHUNK CEILING before anything is unpacked — a node fatter than its own clock allows is a refused log)
  if (overChunkCeiling(node, CHUNKS_PER_SEC)) { if (out) out.hops = 0; return { ...scoreNode({ seed, mode, node: null, t0, until, cv: cv === 2 ? 2 : 1 }), bad: 'too many chunks' }; }
  const log = node && node.c != null ? logFromChunks(node.c) : [], times = node && node.c != null ? chunkTimes(node.c) : [];
  let j = log && times ? judgeRun({ seed, mode, log, go: t0, times, from, until, cv, end: (node && node.e) || null }) : { ok: false, why: 'chunks' }, bad = '';
  if (!j.ok) { bad = String(j.why || 'refused').slice(0, 24); j = judgeRun({ seed, mode, log: [], until, cv: cv === 2 ? 2 : 1 }); }
  const r = j.result, f = bad ? '' : featsOf(r);
  if (out) out.hops = bad ? 0 : j.hops;
  // (J1 — SPLIT TIMES: `sp` = the ticks each 50 lanes was first reached, from THE JUDGE's own replay — none for a refused log)
  const sp = !bad && r.splits && r.splits.length ? r.splits : null;
  // (J2: + `cv` 2 — the course version the row was judged on, so its end line can rebuild the lane that hit them; a v1 row is unchanged)
  return { l: r.lanes, t: r.tick, w: r.cause || '', e: r.end, y: r.y, px: r.x, ...(r.taken ? { x: 1 } : {}), ...(f ? { f } : {}), ...(sp ? { sp } : {}), ...(j.cut ? { cut: 1 } : {}), ...(bad ? { bad } : {}), ...(cv === 2 ? { cv: 2 } : {}) };
}
/** … */
export function scoreRun(game, node, now = null, code = '') {
  const seed = runSeed(game, node, code), solo = game.mode === 'solo';
  if (!seed) return { ...NONE };
  const t0 = solo ? node.go : game.playAt;
  const until = now == null ? null : solo ? Math.max(0, soloTick(t0, now)) + CLOCK.ahead : Math.max(0, tickAt(game, now));
  // (THE PROOF PASS — the server's guard, on the host's podium too: in a proven match a node with NO GO, or a GO later than the window …
  const late = !solo && game.g0 > 0 && node && !onTime(node, game.g0) ? (goOf(node) ? 'late go' : 'no go') : '';
  // (J2: the version — a solo run's at its own GO, a match's at THE FIRST GO — checked against the node's own `cv`)
  const E = solo ? versionAt(node.go) : matchVersion(game), cv = nodeVersion(node, E);
  if (late) return { ...scoreNode({ seed, mode: game.mode, node: null, t0, from: game.g0, until, cv: E }), bad: late };
  return { ...scoreNode({ seed, mode: game.mode, node, t0, from: solo ? null : game.g0 || null, until, cv }), ...(solo ? { go: node.go } : {}) };
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

/** … */
export function scoreCalls(game, runs, results) {
  const out = {}, ids = Object.keys(game.participants || {}), first = standings({ participants: game.participants, results }).filter(r => r.rank === 1).map(r => r.uid);
  // (THE PROOF PASS — core/proof.js: a player with NO RUN (no GO on time) is never "still in" (they ended before anyone: −1); a FULL DRAW pays nobody)
  const g0 = firstGo(runs), endOf = u => { const r = results[u] || {}; return !inMatch(runs, u, g0) ? -1 : r.x || !(r.e >= 0) ? Infinity : r.e; };
  if (fullDraw(first, ids)) return out;
  for (const uid of ids) {
    const k = runs && runs[uid] && runs[uid].k, mine = endOf(uid);
    if (!k || typeof k.w !== 'string' || k.w === uid || !game.participants[k.w] || mine === Infinity || mine < 0) continue;
    const outAt = game.playAt + mine * 1000 / TICK_HZ;
    if (!(endOf(k.w) > mine) || !(Number(k.at) <= outAt + CALL_WINDOW_MS)) continue;
    const rem = ids.filter(u => u !== uid && endOf(u) > mine).length, ok = first.includes(k.w);
    out[uid] = { w: k.w, ok, bonus: ok ? callBonus(rem) : 0 };
  }
  return out;
}
