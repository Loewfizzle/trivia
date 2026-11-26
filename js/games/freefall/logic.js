// FREEFALL — THE RUN's WORDS, SEEDS, AREAS + SCORING (F1 — docs/freefall.md): PURE (no DOM, no clock). The solo run node, the match and
// the daily arrive in F2–F5; what every one of them will share lives here: the end's words, the seed a run is played on, the tick of a
// touch, THE AREAS, THE RANKING, the feats.
import { hashString } from '../../core/rng.js';
import { TICK_HZ, AREAS, GEN } from './tuning.js';

/** THE END's WORDS — one table (the lab, the end screen, the share card all read it) */
export const END_WORDS = Object.freeze({
  red: 'HIT THE RED',
  dark: 'THE LIGHTS WENT OUT',
  made: 'MADE IT TO THE BOTTOM',
  cap: 'TIME’S UP',
});
/** a result → its words ('' = the run is still going) */
export const endWords = result => { const c = result && result.cause; return typeof c === 'string' && Object.prototype.hasOwnProperty.call(END_WORDS, c) ? END_WORDS[c] : ''; };   // (the table's own words only: never 'constructor')

/**
 * THE SEED IS PICKED AFTER GO (JAYWALK's + HIGH RISE's way): hash(room code + matchId + a SERVER time the rules enforce). PURE — the phone
 * and the server derive the same seed. (F4 wires the run node; nothing calls this yet but the tests. THE DAILY's seed will come from the
 * daily module's server-sealed day set — never from the date.)
 */
export const seedOf = (code, matchId, go) => `f${hashString(`${code}:${matchId}:${go}`).toString(36)}${hashString(`ff:${go}:${matchId}:${code}`).toString(36)}`;
/** a tick ↔ a clock: tick 0 = `t0` (ms) — the ONE mapping (FAIR INPUT: a move's event.timeStamp → the nearest tick; 60 Hz and 120 Hz phones are equal) */
export const tickOf = (ms, t0) => Math.round((ms - t0) * TICK_HZ / 1000) + 0;   // (+ 0: never a negative zero)

/**
 * THE AREAS — by floor (pure, for the views): 0 THE ROOFTOP · 40 THE OFFICES · 80 THE SPEAKEASY · 120 UNDER THE HARBOR · 160 THE DEEP ·
 * 200 THE BOTTOM · past it (solo) THE TRENCH — the deep's palettes cycled, harder each LAP (1 = floors 201 … 240, 2 = 241 … 280, …).
 */
export function areaIndex(floor) {
  let k = 0;
  for (let i = 1; i < AREAS.length; i++) if (floor >= AREAS[i].from) k = i;
  return k;
}
export function areaOf(floor) {
  const k = areaIndex(floor), A = AREAS[k];
  return { id: A.id, name: A.name, from: A.from, index: k, lap: A.id === 'trench' ? Math.floor((floor - A.from) / GEN.lap.every) + 1 : 0 };
}

/** THE ARRIVALS (F3 — the banners): the floor the NEXT area begins at after `floor` — the areas' own starts (40 · 80 · 120 · 160 · 200 · 201), then THE TRENCH's laps (241 · 281 · …) */
export function nextArrival(floor) {
  for (let i = 0; i < AREAS.length; i++) if (AREAS[i].from > floor) return AREAS[i].from;
  const T = AREAS[AREAS.length - 1].from, L = GEN.lap.every;
  return T + (Math.floor((floor - T) / L) + 1) * L;
}
/** is `floor` an arrival — an area's first floor, a trench lap's first floor? */
export const isArrival = floor => Number.isSafeInteger(floor) && floor > 0 && nextArrival(floor - 1) === floor;
/** an arrival's words: { name: 'THE SPEAKEASY', sub: 'FLOOR 80' } — THE TRENCH's later laps: 'LAP 2 · FLOOR 241' */
export function arrivalWords(floor) { const a = areaOf(floor); return { name: a.name, sub: a.lap > 1 ? `LAP ${a.lap} · FLOOR ${floor}` : `FLOOR ${floor}` }; }

/** THE FEATS' names (F3's cards) */
export const FEAT_NAMES = Object.freeze({ reachedHarbor: 'SPLASHDOWN', terminal: 'TERMINAL VELOCITY', reachedBottom: 'ROCK BOTTOM' });
/** a result's feats as a row carries them: 'reachedHarbor terminal' ('' = none) */
export const featsOf = r => Object.keys((r && r.feats) || {}).filter(k => r.feats[k]).join(' ');

/** THE RANKING: THE FLOORS first; at the same floor → the EARLIER tick that floor was reached. Match + daily alike. (a < 0 = a is ahead) */
export const rankCompare = (a, b) => (b.floor - a.floor) || (a.tick - b.tick);
/** rows { uid, floor, tick } → [{ uid, rank, floor, tick }] — the same floor at the same tick shares the place */
export function standings(rows) {
  const n = v => { const x = Number(v); return Number.isFinite(x) ? x : 0; };
  const list = (rows || []).map(r => ({ uid: r.uid, floor: n(r.floor), tick: n(r.tick) }));
  list.sort((a, b) => rankCompare(a, b) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  let rank = 0;
  return list.map((r, i) => {
    if (!i || rankCompare(list[i - 1], r) !== 0) rank = i + 1;
    return { uid: r.uid, rank, floor: r.floor, tick: r.tick };
  });
}

/** F4A — a GAME's standings (the console's podium + the server's report: core/match-report.js): its results { uid: { f: floors, t: tick } }
 *  → [{ uid, rank, score (= the floors), floor, tick }] for every participant (no row = no run) */
export function gameStandings(game) {
  const res = (game && game.results) || {};
  return standings(Object.keys((game && game.participants) || {}).map(uid => { const r = res[uid] || {}; return { uid, floor: r.f, tick: r.t }; })).map(r => ({ ...r, score: r.floor }));
}
/** one player = SOLO (endless) · a room = THE MATCH (F4B) */
export const modeOf = participants => (Object.keys(participants || {}).length === 1 ? 'solo' : 'match');
