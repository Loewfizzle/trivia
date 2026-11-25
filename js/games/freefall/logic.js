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
