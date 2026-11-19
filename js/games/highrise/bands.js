// HIGH RISE — THE HEIGHT AREAS (S2 — docs/highrise.md "THE HEIGHT AREAS"): PURE, VIEW-ONLY (the rules never read it; the one import is
// the engine's own palette walk). The climb passes five BANDS — each its painted plate, its name under the floor number, its own slab
// colour set. The plates CROSS-FADE over ~8 floors round a seam (~12 at the skyline → clouds seam) and DRIFT slower than the tower.
import { PALETTE_N } from './tuning.js';
import { paletteFor } from './engine.js';

/** the bands, from the ground up: `from` = its first floor (the owner's plan: 0–25 · 25–60 · 60–110 · 110–170 · 170 on — THE MOTHERSHIP waits at 200, solo climbs on into deep space) */
export const BANDS = Object.freeze([
  Object.freeze({ id: 'rooftops', name: 'THE ROOFTOPS', from: 0 }),
  Object.freeze({ id: 'skyline', name: 'THE SKYLINE', from: 25 }),
  Object.freeze({ id: 'clouds', name: 'THE CLOUDS', from: 60 }),
  Object.freeze({ id: 'stars', name: 'THE STARS', from: 110 }),
  Object.freeze({ id: 'space', name: 'DEEP SPACE', from: 170 }),
]);
/** the cross-fade's length in floors at each seam (seam i = band i → band i + 1), centred on the upper band's first floor */
export const FADES = Object.freeze([8, 12, 8, 8]);
/** how much taller than the screen a plate is drawn (its slack is the drift's travel) */
export const SLACK = 0.2;
/** the last band has no end: its plate drifts on, ever slower, over about this many floors */
const LAST_SPAN = 90;

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = v => { const t = clamp01(v); return t * t * (3 - 2 * t); };

/** the band a floor stands in (its name shows under the floor number) */
export function bandAt(floor) {
  let i = 0;
  while (i + 1 < BANDS.length && floor >= BANDS[i + 1].from) i++;
  return i;
}
/** the plates at a height `f` (floors, a fraction): { a, b, m } — plate `a` under plate `b` at weight `m` (0 = only a; a === b outside a fade) */
export function plateMix(f) { return plateMixInto(f, { a: 0, b: 0, m: 0 }); }
/** … the same, written INTO `out` (S4A FIX — ZERO GARBAGE: the view's frame keeps ONE record and asks every frame) → out */
export function plateMixInto(f, out) {
  for (let s = 0; s < FADES.length; s++) {
    const at = BANDS[s + 1].from, w = FADES[s], lo = at - w / 2, hi = at + w / 2;
    if (f < lo) { out.a = s; out.b = s; out.m = 0; return out; }
    if (f < hi) { out.a = s; out.b = s + 1; out.m = smooth((f - lo) / w); return out; }
  }
  const last = BANDS.length - 1;
  out.a = last; out.b = last; out.m = 0;
  return out;
}
/** a plate's DRIFT at height `f`: 0 (its foot — as its band fades in) → 1 (its top — as the next band takes over); the last band's never ends */
export function plateDrift(band, f) {
  const lo = band === 0 ? 0 : BANDS[band].from - FADES[band - 1] / 2;
  if (band === BANDS.length - 1) return f <= lo ? 0 : 1 - Math.exp(-(f - lo) / LAST_SPAN);
  const hi = BANDS[band + 1].from + FADES[band] / 2;
  return clamp01((f - lo) / (hi - lo));
}

// ---- THE SLAB COLOURS: each band its own set — four neons a look, walked round in PALETTE_N steps (engine.js#paletteFor: one step a floor)
const hex = h => [(h >> 16 & 255) / 255, (h >> 8 & 255) / 255, (h & 255) / 255];
export const SLAB_SETS = Object.freeze({
  night: Object.freeze([
    [0xff2bd6, 0x9a4dff, 0x3d5bff, 0x19d3ff],   // the rooftops: pink → violet → blue → cyan
    [0x19d3ff, 0x3d7bff, 0x7a4dff, 0x2bffd0],   // the skyline: cyan → blue → violet → teal
    [0xff5fa8, 0xffa14d, 0xff2bd6, 0xb06bff],   // the clouds: rose → amber → magenta → lilac
    [0x9fe8ff, 0x4d7dff, 0x8a5bff, 0xe6f2ff],   // the stars: ice → blue → violet → starlight
    [0xffd166, 0xff7a9a, 0x9a4dff, 0x2bffb0],   // deep space: gold → coral → violet → aurora green
  ].map(set => Object.freeze(set.map(hex)))),
  // THE DAY LOOK (S3 — the owner's pairs; frosted glass shows them as PASTELS: the shader mixes them into a milky body)
  day: Object.freeze([
    [0x12b8a6, 0xe6fbf6, 0x2fd0c8, 0xbdf3e8],   // the rooftops: warm teal / white
    [0x2f93ff, 0xdfe8f4, 0x5a7dff, 0xc4d4e8],   // the skyline: sky blue / silver
    [0xffa978, 0xff6f9c, 0xffc79a, 0xf58fbe],   // the clouds: peach / rose
    [0x2a55ff, 0xc8ecff, 0x4a7dff, 0xe6f6ff],   // the stars: deep blue / ice
    [0x9a55ff, 0x38f5b8, 0xc27bff, 0x49dcff],   // deep space: violet / aurora
  ].map(set => Object.freeze(set.map(hex)))),
});
/** THE DAY LOOK's SLIDING SLAB (the owner: "a stronger saturated colour so it never washes out"): each band's ACCENT — the floor's own
 *  pastel pulled most of the way to it (a silver / white step would vanish against a sunlit sky) */
export const DAY_ACCENT = Object.freeze([0x00a890, 0x1466ff, 0xff3d7a, 0x1a3dff, 0x8a3dff].map(hex).map(c => Object.freeze(c)));
export const ACCENT_PULL = 0.7;
/** the SLIDING slab's colour on `floor` → [r, g, b] (sRGB): by night the floor's own neon; by day pulled to its band's accent */
export function sliderColor(look, seed, floor) {
  const c = slabColor(look, seed, floor);
  if (look !== 'day') return c;
  const m = plateMix(floor), a = DAY_ACCENT[m.a], b = DAY_ACCENT[m.b], k = ACCENT_PULL;
  return [0, 1, 2].map(i => c[i] + (a[i] + (b[i] - a[i]) * m.m - c[i]) * k);
}
/** THE DAY LOOK's HEIGHT HAZE: what the tower fades into as it falls away under the top slab — each band's own air (sRGB) */
export const DAY_HAZE = Object.freeze([0xa9d3f2, 0xb9dcf6, 0xdde8f6, 0x24449c, 0x161a4a].map(hex).map(c => Object.freeze(c)));
/** the haze at a height `f` (floors): the band's, blended round a seam as the plates are → [r, g, b] (sRGB) */
export function hazeAt(f) { return hazeInto(f, [0, 0, 0]); }
const HZ_MIX = { a: 0, b: 0, m: 0 };
/** … the same, written INTO `out` ([r, g, b] — the view keeps one) → out */
export function hazeInto(f, out) {
  const m = plateMixInto(f, HZ_MIX), a = DAY_HAZE[m.a], b = DAY_HAZE[m.b];
  out[0] = a[0] + (b[0] - a[0]) * m.m; out[1] = a[1] + (b[1] - a[1]) * m.m; out[2] = a[2] + (b[2] - a[2]) * m.m;
  return out;
}
/** THE WORDS ON THE SKY (S3): by DAY the three low bands are BRIGHT (dark navy words, a light halo); from THE STARS up the day plates
 *  are dark like the night's — the words go back to light. `f` = the camera's height in floors → 'bright' | 'dark' */
export const skyTone = (look, f) => (look === 'day' && f < BANDS[3].from - 2 ? 'bright' : 'dark');
/** the colour of step `p` (0 … PALETTE_N − 1) of a band's set → [r, g, b] (sRGB, 0 … 1) */
export function setColor(look, band, p) {
  const set = (SLAB_SETS[look] || SLAB_SETS.night)[band], n = set.length, t = (((p % PALETTE_N) + PALETTE_N) % PALETTE_N) / PALETTE_N * n;
  const i = Math.floor(t) % n, j = (i + 1) % n, k = t - Math.floor(t), a = set[i], b = set[j];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}
/** the colour of `floor`'s slab on `seed`'s tower → [r, g, b] (sRGB): its band's set, blended into the next band's round a seam */
export function slabColor(look, seed, floor) {
  const p = paletteFor(seed, floor), mix = plateMix(floor), a = setColor(look, mix.a, p);
  if (!mix.m) return a;
  const b = setColor(look, mix.b, p);
  return [a[0] + (b[0] - a[0]) * mix.m, a[1] + (b[1] - a[1]) * mix.m, a[2] + (b[2] - a[2]) * mix.m];
}
