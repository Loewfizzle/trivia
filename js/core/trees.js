// THE STREET — the trees through the year, PURE (no DOM; docs/title.md "THE STREET"). district/furniture.js draws them.
// treeState(local, { south, i, cherry, seed }) → the state of one street tree on a local date:
//   { leaf 0..1 (how full the canopy is), mix { green, gold, orange, red } (sums to 1), young 0..1 (fresh spring green),
//     bud 0..1, blossom 0..1 (the cherry), shed 0..1 (how fast it drops leaves / petals now), ground 0..1 (fallen leaves at its
//     feet), bare (no leaves), lights (warm string lights: Thanksgiving → early January), halloween (a few orange / purple bulbs) }
// The calendar is the northern one, shifted half a year south of the equator (seasonOf's rule). Each tree has its own few days'
// offset (seeded) and its own autumn: some stop at gold, some reach orange, some red. Autumn sheds most in Thanksgiving week; the
// cherry blossoms for about two weeks, fullest around Easter, then leafs out green.
import { easter, thanksgiving } from './sky.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
const doyOf = (y, m, d) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);

/** PURE: where on the autumn ramp (0 green → 0.4 gold → 0.7 orange → 1 red) → the four weights. */
export function hueMix(u) {
  const v = clamp01(u);
  const stops = [['green', 0], ['gold', 0.4], ['orange', 0.7], ['red', 1]];
  const out = { green: 0, gold: 0, orange: 0, red: 0 };
  for (let i = 1; i < stops.length; i++) {
    const [a, pa] = stops[i - 1], [b, pb] = stops[i];
    if (v <= pb) { const k = (v - pa) / (pb - pa); out[a] = 1 - k; out[b] = k; return out; }
  }
  out.red = 1;
  return out;
}

/** PURE: one tree's state on a local date ({ y, m, d } and optionally doy). */
export function treeState(local, { south = false, i = 0, cherry = false, seed = '' } = {}) {
  const { y, m, d } = local;
  const doyReal = local.doy || doyOf(y, m, d);
  const shift = south ? 182 : 0;
  const doy = ((doyReal - 1 + 365 - shift) % 365) + 1;           // the day on the northern calendar
  const r1 = hash(`${seed}|tree|${i}`), r2 = hash(`${seed}|hue|${i}`);
  const o = Math.round((r1 - 0.5) * 12);                          // its own few days early or late
  const tgD = doyOf(y, 11, thanksgiving(y).d);
  const e = easter(y), eD = doyOf(y, e.m, e.d);
  // spring: buds, then the leaf-out (fresh light green, deepening into summer)
  const bud = smooth(86 + o, 104 + o, doy) * (1 - smooth(112 + o, 124 + o, doy));
  const leafIn = smooth(100 + o, 134 + o, doy);
  // autumn: the turn (some trees stop at gold, some go orange, some red), then the shedding — heaviest in Thanksgiving week
  // each tree its own autumn, mixed along the street: the end colours take turns (gold, orange, red) from a seeded start
  const hueMax = [0.45, 0.72, 1][(i + Math.floor(r2 * 3)) % 3];
  const turn = smooth(262 + o, 304 + o, doy) * hueMax;
  const tg = tgD + Math.round(o / 3);
  const dropA = smooth(286 + o, tg - 7, doy), dropB = smooth(tg - 7, tg + 4, doy);
  const leafOut = 1 - 0.62 * dropA - 0.38 * dropB;
  let leaf = doy < 200 ? leafIn : leafOut;
  // the shed rate: how fast it's losing leaves now (per day), normalised so Thanksgiving week is ~1
  const per = (a, b, w) => { const t = clamp01((doy - a) / (b - a)); return t > 0 && t < 1 ? w * 6 * t * (1 - t) / (b - a) : 0; };
  let shed = doy < 200 ? 0 : clamp01((per(286 + o, tg - 7, 0.62) + per(tg - 7, tg + 4, 0.38)) / 0.052);
  const ground = smooth(288 + o, tg - 1, doy) * (1 - smooth(tg + 10, tg + 22, doy));
  // the cherry: about two weeks of blossom, fullest around Easter; its petals fall as it fades; then green leaves
  let blossom = 0;
  if (cherry) {
    const eN = south ? ((eD - 1 + 365 - 182) % 365) + 1 : eD;   // (south: half a year on, like everything else)
    const c = eN + Math.round(o / 4);
    blossom = smooth(c - 9, c - 3, doy) * (1 - smooth(c + 4, c + 10, doy));
    if (doy > c - 10 && doy < c + 12) {
      shed = Math.max(shed, clamp01((doy - (c + 2)) / 6) * (1 - smooth(c + 9, c + 12, doy)));
      leaf = Math.min(leaf, smooth(c + 5, c + 20, doy));       // the leaves come after the flowers
    }
  }
  const young = leaf > 0 ? clamp01(1 - (doy - (110 + o)) / 40) * (doy < 200 ? 1 : 0) : 0;
  // the lights: real dates everywhere (Thanksgiving week → early January); Halloween week: a few bulbs on one tree
  const lights = (m === 11 && d >= thanksgiving(y).d) || m === 12 || (m === 1 && d <= 6);
  const halloween = m === 10 && d >= 25 && i === 0;
  return { leaf: clamp01(leaf), mix: hueMix(doy > 200 ? turn : 0), young, bud, blossom, shed, ground, bare: leaf < 0.04 && blossom < 0.04, lights, halloween, cherry };
}

/** PURE: a key for the canopy's look (re-bake only when it changes). */
export function treeKey(s) {
  const q = v => Math.round(v * 10);
  return [q(s.leaf), q(s.mix.green), q(s.mix.gold), q(s.mix.orange), q(s.mix.red), q(s.young), q(s.bud), q(s.blossom), s.cherry ? 1 : 0].join('');
}
