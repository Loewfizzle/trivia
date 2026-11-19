// HIGH RISE — THE RUN's WORDS, SEEDS + SCORING (S1 — docs/highrise.md): PURE (no DOM, no clock). The match / the solo run node / the daily
// arrive in S2–S5; what every one of them will share lives here: the end's words, the seed a run is played on, THE RANKING, the feats.
import { hashString } from '../../core/rng.js';
import { TICK_HZ } from './tuning.js';
// (THE THIN META — S4A: the console's values live in meta.js, PURE + no imports — one source)
import { DEFAULT_SETTINGS, cleanSettings, chatLocked } from './meta.js';
export { DEFAULT_SETTINGS, cleanSettings, chatLocked };

/** THE END's WORDS — one table (the lab, the end screen, the share card all read it) */
export const END_WORDS = Object.freeze({
  miss: 'MISSED THE STACK',
  thin: 'SLIPPED OFF',
  slow: 'TOO SLOW',
  made: 'MADE IT TO THE MOTHERSHIP',
  cap: 'TIME’S UP',
});
/** a result → its words ('' = the run is still going) */
export const endWords = result => END_WORDS[result && result.cause] || '';

/**
 * THE SEED IS PICKED AFTER GO (JAYWALK's way — docs/jaywalk.md): hash(room code + matchId + a SERVER time the rules enforce). PURE — the
 * phone and the server derive the same seed. (S2 wires the run node; nothing calls this yet but the tests.)
 */
export const seedOf = (code, matchId, go) => `h${hashString(`${code}:${matchId}:${go}`).toString(36)}${hashString(`hi:${go}:${matchId}:${code}`).toString(36)}`;
/** a tick ↔ a clock: tick 0 = `t0` (ms) — the ONE mapping (FAIR TAPS: a touch's event.timeStamp → the nearest tick) */
export const tickOf = (ms, t0) => Math.round((ms - t0) * TICK_HZ / 1000);

/** a result's feats as a row carries them: 'reachedClouds reachedTop' ('' = none) */
export const featsOf = r => Object.keys((r && r.feats) || {}).filter(k => r.feats[k]).join(' ');

/**
 * THE RANKING (S2 — the owner, Nov 18): THE FLOOR first; at the SAME floor (above all: the Mothership's finishers, who all stand on
 * floor 200 within a second of each other — the curve sets the pace) → THE MOST PERFECTS → then the EARLIER tick. Match + daily alike.
 * (a < 0 = a is ahead; a row without `perfects` counts 0.)
 */
export const rankCompare = (a, b) => (b.floor - a.floor) || ((b.perfects || 0) - (a.perfects || 0)) || (a.tick - b.tick);
/** rows { uid, floor, perfects, tick } → [{ uid, rank, floor, perfects, tick }] — the same height, perfects and tick share the place */
export function standings(rows) {
  const n = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
  const list = (rows || []).map(r => ({ uid: r.uid, floor: n(r.floor), perfects: n(r.perfects), tick: n(r.tick) }));
  list.sort((a, b) => rankCompare(a, b) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  let rank = 0;
  return list.map((r, i) => {
    if (!i || rankCompare(list[i - 1], r) !== 0) rank = i + 1;
    return { uid: r.uid, rank, floor: r.floor, perfects: r.perfects, tick: r.tick };
  });
}
/**
 * S4A — THE MATCH's RESULTS → THE RANKING the console + the report read: game.results[uid] = the judge's row { f: floor, p: perfects, t: the
 * tick the last floor landed, w: the cause, e: the end's tick, s: the best streak, ft?: the feats, cut?, bad? } → [{ uid, rank, score (the
 * floor), floor, perfects, tick }] for every participant (no row = no tower)
 */
export function gameStandings(game) {
  const res = (game && game.results) || {};
  return standings(Object.keys((game && game.participants) || {}).map(uid => { const r = res[uid] || {}; return { uid, floor: r.f, perfects: r.p, tick: r.t }; }))
    .map(r => ({ ...r, score: r.floor }));
}
/** one player = SOLO ENDLESS; a room = THE MATCH (S4B) */
export const modeOf = participants => (Object.keys(participants || {}).length === 1 ? 'solo' : 'match');
/** S4B's shape, ready (JAYWALK's — docs/jaywalk.md "THE MATCH"): a MATCH's tick 0 = THE FIRST GO among its proof nodes + this */
export const GO_LEAD_MS = 2000;
/** THE FIRST GO: the EARLIEST `go` among a match's proof nodes (0 = none yet) — final the moment it lands (the server stamps on arrival) */
export function firstGo(runs) {
  let g = 0;
  for (const n of Object.values(runs || {})) { const v = n && Number(n.go); if (v > 0 && (!g || v < g)) g = v; }
  return g;
}
/** a match's clock + seed from its proof nodes (null = no GO yet) — PURE: the phones, the host's director and the server agree */
export const matchStart = (code, matchId, runs) => { const g0 = firstGo(runs); return g0 ? { g0, playAt: g0 + GO_LEAD_MS, seed: seedOf(code, matchId, g0) } : null; };
/**
 * S4A — A TOWER AS ONE NUMBER (the board highrise-solo — core/boards.js fmt 'floor'): THE RANKING in one sort value — the FLOOR first,
 * then THE MOST PERFECTS, then the EARLIER tick; higher is always better. floorOf / perfectsOf read it back (a plain floor — a value
 * under TOWER_SPAN — reads as itself).
 */
export const TOWER_SPAN = 1e11, TOWER_P = 1e7;
const whole = (v, hi) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n > 0 ? (n > hi ? hi : n) : 0; };
export const towerScore = (floor, perfects = 0, tick = 0) => whole(floor, 89999) * TOWER_SPAN + whole(perfects, 9999) * TOWER_P + (TOWER_P - 1 - whole(tick, TOWER_P - 1));
export const floorOf = v => { const n = Number(v); return Number.isFinite(n) && n > 0 ? (n >= TOWER_SPAN ? Math.floor(n / TOWER_SPAN) : Math.floor(n)) : 0; };
export const perfectsOf = v => { const n = Number(v); return Number.isFinite(n) && n >= TOWER_SPAN ? Math.floor((n % TOWER_SPAN) / TOWER_P) : 0; };
/** the podium's line under a name: "182 PERFECTS" (1 PERFECT) */
export const perfectsLine = n => `${Number(n) || 0} PERFECT${Number(n) === 1 ? '' : 'S'}`;
