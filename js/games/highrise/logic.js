// HIGH RISE — THE RUN's WORDS, SEEDS + SCORING (S1 — docs/highrise.md): PURE (no DOM, no clock). The match / the solo run node / the daily
// arrive in S2–S5; what every one of them will share lives here: the end's words, the seed a run is played on, THE RANKING, the feats.
import { hashString } from '../../core/rng.js';
import { TICK_HZ } from './tuning.js';

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
/** the podium's line under a name: "182 PERFECTS" (1 PERFECT) */
export const perfectsLine = n => `${Number(n) || 0} PERFECT${Number(n) === 1 ? '' : 'S'}`;
