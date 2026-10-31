// CITY 2.0 — ATM-A: THE WIND AS ONE SYSTEM (the owner since 9a, Oct 26: "&force=windy only sends the clouds flying; the trees don't react";
// Oct 27: "heavy snow + windy just makes the clouds go crazy fast and nothing really happens in the foreground"). ONE state, computed once a
// frame, that EVERYTHING reads in step: the tree crowns + the maple, the falling leaves, the smoke, the rain + snow slant + their gusting
// sheets, coats + hats (people lean into a strong wind), the water's chop + its wind lines, the flags, the banner, the balloons. The clouds
// do NOT race with it (core/harbor-clouds.js: the wind at THEIR height, slowed for the camera).
//   · THE INPUT: the live weather's wind + gusts + direction (the weather's own 20-s ease: core/harbor-weather.js), `&wind=<m/s>`,
//     `&force=windy` (14 m/s, gusts 21) / `&force=gale` (20, gusts 30) — and a CALM fallback (2.5 m/s) when there's none.
//   · GUSTS ARE WAVES: each a seeded event (the city clock — every phone the same gust), rising, holding, falling, ROLLING ACROSS THE SCENE
//     FROM UPWIND with a real delay (a gust front crosses the screen in ~3–5 s); LULLS between them (the wind a little under its mean).
//   · THE LEVELS read on the phone: a BREEZE (≈ 3–6 m/s: the leaves stir, the crowns rock gently), a WINDY DAY (≈ 10–14: the crowns lean +
//     the gusts roll through them, the water chopped, coats + scarves streaming), a GALE (≈ 18+: the trees bent hard, people leaning in +
//     holding their hats, the rain / snow driven sideways in sheets, white horses on the water).
// Pure: no DOM, no Date.now — the city clock in, plain numbers out (tests/harbor-wind.test.mjs).

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const k = clamp01((v - a) / (b - a)); return k * k * (3 - 2 * k); };

export const WIND = Object.freeze({
  calm: 2.5,        // m/s — no live answer: a calm, plausible air
  breeze: 4, windy: 12, gale: 20,     // the three looks' centres (m/s)
  bucket: 3.5,      // s — one gust can start in each bucket (seeded)
  rise: 1.1, fall: 2.6,               // s — a gust's swell + its dying away (its hold is seeded, 0.6–2.2 s)
  crossSlow: 5.5, crossFast: 2.8,     // s — a gust front crossing the screen: a breeze's slow roll … a gale's quick one
  lull: 0.82,       // between gusts the wind sits at this share of its mean
});

/** the input → { speed (m/s, mean), gust (m/s, the gusts' peak), dir (° FROM, meteorological), src: 'live' | 'flag' | 'calm' } */
export function windInput(o = {}) {
  const ok = v => typeof v === 'number' && Number.isFinite(v);
  if (!ok(o.wind)) return { speed: WIND.calm, gust: WIND.calm * 1.5, dir: 250, src: 'calm' };
  const speed = Math.max(0, o.wind), gust = Math.max(speed, ok(o.gust) ? o.gust : speed * 1.4);
  return { speed, gust, dir: ok(o.dir) ? o.dir : 250, src: o.src || 'live' };
}

/** which way it blows ON SCREEN: +1 toward screen right, −1 toward the left. We face SOUTH over the harbor, so the east is on the left:
 *  a west wind (FROM 270°) blows toward the east = the LEFT (sin < 0); an east wind blows right — the sign the falling leaves + the smoke
 *  always used (scene.js: sin(windDir) ≥ 0 → +1). */
export const windSide = dir => (Math.sin(((dir == null ? 250 : dir) * Math.PI) / 180) >= 0 ? 1 : -1);

// (a tiny integer hash → 0..1: the gusts' dice — the same on every phone)
function h01(a, b) {
  let h = (Math.imul(a | 0, 2654435761) ^ Math.imul((b | 0) + 0x9e37, 40503)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0; h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** the gusts that may touch time t (s on the city clock): [{ t0 (s: it enters the upwind edge), s (0..1 its strength), hold (s) }] */
export function gustsNear(t, level, gustiness, seed = 1924) {
  const B = WIND.bucket, out = [];
  // (how often: a breeze ~1 gust in 3 buckets, a gusty gale nearly every bucket)
  const p = clamp01(0.18 + 0.5 * level + 0.35 * gustiness);
  const life = WIND.rise + 2.2 + WIND.fall + WIND.crossSlow;
  for (let k = Math.floor((t - life) / B); k <= Math.floor(t / B); k++) {
    if (h01(seed, k * 3) >= p) continue;
    const t0 = k * B + h01(seed, k * 3 + 1) * B;
    out.push({ t0, s: 0.45 + 0.55 * h01(seed, k * 3 + 2), hold: 0.6 + 1.6 * h01(seed + 7, k) });
  }
  return out;
}
/** a gust's envelope τ s after it reached a point (0..1: the swell, the hold, the dying away) */
export function gustEnv(tau, g) {
  if (tau <= 0) return 0;
  if (tau < WIND.rise) { const k = tau / WIND.rise; return g.s * k * k * (3 - 2 * k); }
  if (tau < WIND.rise + g.hold) return g.s;
  const k = (tau - WIND.rise - g.hold) / WIND.fall;
  return k >= 1 ? 0 : g.s * (1 - k * k * (3 - 2 * k));
}

/**
 * THE WIND THIS FRAME (once a frame — every reader shares it): inp = windInput(…), t = the city clock (s) → {
 *   speed, gust, dir, src, side (+1 toward screen right), level (0 calm … ~0.3 breeze … ~0.65 windy … 1 gale), gusty (0..1 how gusty),
 *   lean (0..1 the steady push: a crown's lean, a body's lean), cross (s: a gust front's crossing),
 *   at(u) → 0..1 the gust at u (0..1 across the screen, left → right) NOW — the wave rolling from the upwind edge,
 *   v(u) → m/s the wind there now (signed: + toward the right) — the lulls under the mean, the gusts up to the gust speed,
 *   look: 'calm' | 'breeze' | 'windy' | 'gale' }
 */
export function windFrame(inp, t, seed = 1924) {
  const speed = inp.speed, gust = Math.max(speed, inp.gust), side = windSide(inp.dir);
  const level = clamp01((speed - 1) / 19) ** 0.8, gusty = clamp01((gust / Math.max(0.5, speed) - 1) / 0.9) * smooth(2, 8, speed);
  const lean = smooth(3, 22, speed);
  const cross = WIND.crossSlow + (WIND.crossFast - WIND.crossSlow) * smooth(4, 20, speed);
  const list = level > 0.04 ? gustsNear(t, level, gusty, seed) : [];
  const at = u => {
    if (!list.length) return 0;
    const d = (side > 0 ? u : 1 - u) * cross;        // (upwind edge first)
    let a = 0; for (const g of list) { const e = gustEnv(t - g.t0 - d, g); if (e > a) a = e; }
    return a;
  };
  const base = speed * WIND.lull;
  const v = u => side * (base + (gust - base) * at(u));
  const look = speed < 2 ? 'calm' : speed < 8 ? 'breeze' : speed < 17 ? 'windy' : 'gale';
  return { speed, gust, dir: inp.dir, src: inp.src, side, level, gusty, lean, cross, at, v, look, gusts: list.length };
}
