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

/** THE RANKING: height, then the EARLIER tick (a < 0 = a is ahead) */
export const rankCompare = (a, b) => (b.floor - a.floor) || (a.tick - b.tick);
/** rows { uid, floor, tick } → [{ uid, rank, floor, tick }] — the same height at the same tick share the place */
export function standings(rows) {
  const list = (rows || []).map(r => ({ uid: r.uid, floor: Number(r.floor) || 0, tick: Number(r.tick) || 0 }));
  list.sort((a, b) => rankCompare(a, b) || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  let rank = 0;
  return list.map((r, i) => {
    if (!i || rankCompare(list[i - 1], r) !== 0) rank = i + 1;
    return { uid: r.uid, rank, floor: r.floor, tick: r.tick };
  });
}
