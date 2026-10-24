// CITY 2.0 — THE HARBOR, 8P: THE LAMPPOSTS GET A LITTLE LIFE (PURE — tested in tests/harbor-people.test.mjs; drawn by stage.js +
// scene.js). The owner (Oct 24): YES, but RARELY. (1) At dusk the promenade's lamps switch on ONE BY ONE as the lamps' ramp rises,
// each with a short warm-up STUTTER (an old filament / a gas mantle catching). (2) Very rarely ONE lamp gives a brief 2–3 flicker
// stutter and settles (an old wire) — never two at once, never a strobe, never the two lamps framing the crossing while an event
// stands on the inlay. (3) A rarer moment: one lamp goes OUT for a few seconds, then catches again. Every phone sees the same lamp
// do the same thing at the same moment (seeded by the city's clock).
import { rngFrom } from './rng.js';

/** the switch-on: the lamps' ramp (0..1) at which each lamp catches, spread over [from, to] in a seeded order (not left → right) */
export const LAMP_LIFE = Object.freeze({ from: 0.08, to: 0.55, warm: 1.3, slot: 420, chance: 0.5, out: 0.22, outS: [3, 6] });

/** each lamp's switch-on threshold (PURE): n lamps → [th…] in a shuffled order, seeded */
export function lampThresholds(n, seed = 1924) {
  const r = rngFrom(seed), idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const th = new Array(n);
  idx.forEach((lamp, k) => { th[lamp] = LAMP_LIFE.from + (LAMP_LIFE.to - LAMP_LIFE.from) * (n > 1 ? k / (n - 1) : 0); });
  return th;
}

/** a lamp WARMING UP (PURE): u = s since it caught → 0..1 — a flash, dark, a flash, dark, then a warm climb to full by LAMP_LIFE.warm */
export function warmUp(u) {
  if (u < 0) return 0;
  if (u >= LAMP_LIFE.warm) return 1;
  if (u < 0.06) return 0.7;
  if (u < 0.16) return 0.05;
  if (u < 0.24) return 0.55;
  if (u < 0.36) return 0.1;
  const v = (u - 0.36) / (LAMP_LIFE.warm - 0.36);
  return 0.35 + 0.65 * v * v * (3 - 2 * v);
}

/**
 * The rare lamp moment at ms (PURE): one per LAMP_LIFE.slot seconds at most (a seeded chance), on one seeded lamp, at a seeded
 * moment → { i, kind: 'stutter' | 'out', at (ms it starts), len (s), level(ms) } | null. skip: lamp indices that must stay steady
 * (the crossing's pair while an event stands on the inlay).
 */
export function lampMoment(ms, n, { seed = 1924, skip = [] } = {}) {
  if (n < 1) return null;
  const S = LAMP_LIFE.slot, k = Math.floor(ms / 1000 / S), r = rngFrom((seed * 7919 + k * 104729) >>> 0);
  if (r() > LAMP_LIFE.chance) return null;
  const pool = [...Array(n).keys()].filter(i => !skip.includes(i));
  if (!pool.length) return null;
  const i = pool[Math.floor(r() * pool.length)], out = r() < LAMP_LIFE.out;
  const len = out ? LAMP_LIFE.outS[0] + r() * (LAMP_LIFE.outS[1] - LAMP_LIFE.outS[0]) + LAMP_LIFE.warm : 0.9;
  const at = (k * S + 20 + r() * (S - 40 - len)) * 1000, blinks = 2 + (r() < 0.5 ? 1 : 0);
  const level = t => {
    const u = (t - at) / 1000;
    if (u < 0 || u >= len) return 1;
    if (out) { const dark = len - LAMP_LIFE.warm; return u < 0.12 ? 0.4 : u < dark ? 0 : warmUp(u - dark); }
    // the stutter: `blinks` quick dips over 0.9 s, the last one shallow
    const ph = u / 0.9 * blinks, j = Math.floor(ph), f = ph - j;
    return f < 0.45 ? (j === blinks - 1 ? 0.45 : 0.08) : 1;
  };
  return { i, kind: out ? 'out' : 'stutter', at, len, level };
}
