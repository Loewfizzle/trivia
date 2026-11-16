// JAYWALK — THE MATCH's RULES (H1 + H4 — docs/jaywalk.md "THE MATCH"): one run each on the SAME course, ONE LIFE; the results are REPLAYED
// from each player's own hop log (the proof node rooms/{CODE}/jw/{matchId}/{uid}) — never a number a phone claims. PURE (no DOM, no clock).
// (THE THIN META: the console's values live in meta.js — one source)
import { DEFAULT_SETTINGS, cleanSettings, chatLocked } from './meta.js';
import { MODES, TICK_HZ, CLOCK } from './tuning.js';
import { hashString } from '../../core/rng.js';
import { CALL_MS, callBonus } from '../../core/playlist.js';
import { judgeRun, logFromChunks, chunkTimes } from './replay.js';

export { DEFAULT_SETTINGS, cleanSettings, chatLocked, CALL_MS };

export const COUNT_MS = 3000;             // (3 · 2 · 1 before GO)
/** H4 — a MATCH's tick 0 = THE FIRST GO + this (every phone writes its GO in the count's last 2 s — the rules' window) */
export const GO_LEAD_MS = 2000;
/** no GO at all this long after the count's end (no signal anywhere, the rules not published) → the match plays UNPROVEN, never counted */
export const NO_GO_MS = 3000;
export const END_GRACE_MS = 4000;         // (after THE MOTHERSHIP's tick: the last chunks land)
/** THE DROPPED SIGNAL in a match: a player whose proven log says OUT but whose own end never arrived is waited for this long (their
 *  phone may be offline with hops still queued) before the match ends without it */
export const DROP_WAIT_MS = CLOCK.drop;
/** Call the Winner: a call counts when it was made within this of the caller's own end (the hit is seen first, then the kit's window) */
export const CALL_WINDOW_MS = CALL_MS + 6000;
/** one player = SOLO ENDLESS; a room = the MATCH */
export const modeOf = participants => (Object.keys(participants || {}).length === 1 ? 'solo' : 'match');
/** a tick ↔ the server clock: tick 0 is GO (game.playAt) */
export const tickAt = (game, now) => Math.floor((now - game.playAt) * TICK_HZ / 1000);
/** the moment THE MOTHERSHIP comes (ms) — null in solo endless */
export const capAt = game => { const c = MODES[game.mode] ? MODES[game.mode].cap : 0; return c ? game.playAt + Math.ceil(c * 1000 / TICK_HZ) : null; };

/**
 * THE COURSE IS PICKED AFTER GO (H3 — the owner, Nov 16): the seed = hash(room code + matchId + a SERVER time the rules enforce — a proof
 * node's `go`: === now, written once). Nobody knows the course before the run is on the clock: no one can shop for an easy one. PURE —
 * the phone and the server derive the same seed. SOLO: the player's own GO. A MATCH (H4): THE FIRST GO (below).
 */
export const seedOf = (code, matchId, go) => `g${hashString(`${code}:${matchId}:${go}`).toString(36)}${hashString(`jw:${go}:${matchId}:${code}`).toString(36)}`;
/** a SOLO run's tick at a server time: tick 0 = its own GO */
export const soloTick = (go, now) => Math.floor((now - go) * TICK_HZ / 1000);
/**
 * H4 — THE FIRST GO: the EARLIEST `go` among a match's proof nodes (0 = none yet). Every phone writes its own GO in the count's last 2 s;
 * the server stamps each on arrival, and a later arrival always carries a later time — so the first GO is FINAL the moment it lands, the
 * same on every phone and on the server, whoever the host is (in practice the host's phone is as likely as any — nobody chooses the
 * millisecond). The match's course = seedOf(code, matchId, that time); its tick 0 = that time + GO_LEAD_MS.
 */
export function firstGo(runs) {
  let g = 0;
  for (const n of Object.values(runs || {})) { const v = n && Number(n.go); if (v > 0 && (!g || v < g)) g = v; }
  return g;
}
/** the match's clock + course from its proof nodes (null = no GO yet) — PURE: the phones, the host's director and the server agree */
export const matchStart = (code, matchId, runs) => { const g0 = firstGo(runs); return g0 ? { g0, playAt: g0 + GO_LEAD_MS, seed: seedOf(code, matchId, g0) } : null; };
/**
 * H4B — THE NODES ARE THE TRUTH: the course + tick 0 a phone PLAYS (and the host scores) = THE FIRST GO among the proof nodes it has
 * from the SERVER — exactly what the server's own count derives — whatever the game says; the game's own (the director's GO patch — or
 * an UNPROVEN match's stand-in) only when there is no node to read (the mirror not there yet, no GO anywhere). `runs` must hold
 * CONFIRMED values only: a phone writes its GO as a transaction that is never applied locally (view.js#askGoMatch), so its own estimate
 * of the server's time can never pick a course. null = not known yet (the count holds).
 */
export function startOf(game, runs, code) {
  const m = game && !game.unproven && game.mode !== 'solo' && runs ? matchStart(code, game.matchId, runs) : null;
  if (m) return m;
  return game && game.phase !== 'count' && game.seed ? { g0: game.g0 || 0, playAt: game.playAt, seed: game.seed } : null;
}
/** the seed one player's run is played on: SOLO = from their own GO (null before it) · a MATCH = the game's (the director's GO patch) */
export const runSeed = (game, node, code) => (game.mode === 'solo' ? (node && node.go > 0 ? seedOf(code, game.matchId, node.go) : null) : game.seed || null);

const NONE = Object.freeze({ l: 0, t: 0, w: '', e: -1 });
/**
 * ONE proof node ({ go, c: { i: { s, at } }, e?, k? }) → its result row — THE JUDGE's (replay.js#judgeRun: the bounds, THE SPEED CHECK +
 * THE DROPPED SIGNAL, the replay). { l: lanes, t: the tick they got there, w: the cause, e: the tick it ended (−1 = not yet), y · px:
 * where the kid went out (the end screen names what hit them), x: taken (1), cut (1 — a slowed log: counted to its last on-time hop),
 * bad (why — a refused log: the run of a kid who never hopped) }. `t0` = tick 0 (a server time), `from` = the earliest a chunk may arrive,
 * `until` = score it as it stands at that tick. The host's podium and the server's count both come through here.
 */
export function scoreNode({ seed, mode, node, t0, from = null, until = null }) {
  const log = node && node.c != null ? logFromChunks(node.c) : [], times = node && node.c != null ? chunkTimes(node.c) : [];
  let j = log && times ? judgeRun({ seed, mode, log, go: t0, times, from, until }) : { ok: false, why: 'chunks' }, bad = '';
  if (!j.ok) { bad = String(j.why || 'refused').slice(0, 24); j = judgeRun({ seed, mode, log: [], until }); }
  const r = j.result;
  return { l: r.lanes, t: r.tick, w: r.cause || '', e: r.end, y: r.y, px: r.x, ...(r.taken ? { x: 1 } : {}), ...(j.cut ? { cut: 1 } : {}), ...(bad ? { bad } : {}) };
}
/**
 * ONE player's result from their own node, to the server time `now` (a run still going is scored as it stands). No node / a refused log
 * → the run of a kid who never hopped (the wall takes them); a solo run with no GO, a match with no course yet → nothing.
 */
export function scoreRun(game, node, now = null, code = '') {
  const seed = runSeed(game, node, code), solo = game.mode === 'solo';
  if (!seed) return { ...NONE };
  const t0 = solo ? node.go : game.playAt;
  const until = now == null ? null : solo ? Math.max(0, soloTick(t0, now)) + CLOCK.ahead : Math.max(0, tickAt(game, now));
  return { ...scoreNode({ seed, mode: game.mode, node, t0, from: solo ? null : game.g0 || null, until }), ...(solo ? { go: node.go } : {}) };
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

/**
 * H4 — CALL THE WINNER (the match kit's piece; the call = the caller's own proof node's `k: { w, at }` — the rules: only once they are
 * out, a player still in, once, the server's time). At the end: a call counts when the caller was OUT (never taken), named a player who
 * was still in at that moment, and made it within CALL_WINDOW_MS of their own end; right = that player won (alone or tied for first).
 * → { uid: { w, ok, bonus } } — the bonus = core/playlist.js#callBonus(the players still in when they went out), game-night points.
 */
export function scoreCalls(game, runs, results) {
  const out = {}, ids = Object.keys(game.participants || {}), first = standings({ participants: game.participants, results }).filter(r => r.rank === 1).map(r => r.uid);
  const endOf = u => { const r = results[u] || {}; return r.x || !(r.e >= 0) ? Infinity : r.e; };
  for (const uid of ids) {
    const k = runs && runs[uid] && runs[uid].k, mine = endOf(uid);
    if (!k || typeof k.w !== 'string' || k.w === uid || !game.participants[k.w] || mine === Infinity) continue;
    const outAt = game.playAt + mine * 1000 / TICK_HZ;
    if (!(endOf(k.w) > mine) || !(Number(k.at) <= outAt + CALL_WINDOW_MS)) continue;
    const rem = ids.filter(u => u !== uid && endOf(u) > mine).length, ok = first.includes(k.w);
    out[uid] = { w: k.w, ok, bonus: ok ? callBonus(rem) : 0 };
  }
  return out;
}
