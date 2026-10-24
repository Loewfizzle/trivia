// CITY 2.0 — THE HARBOR, PART 8a: THE PROMENADE'S TREES, PURE (no DOM; tested in tests/harbor.test.mjs; drawn by
// screens/harbor/trees.js). What a tree IS — its branching skeleton, its leaf clusters, its colours through the year, what lies
// on the grate under it — not how it is lit.
//
// Every tree is seeded by where it stands (its x / z / kind), so the SAME skeleton carries the summer's crown, the autumn's
// blaze and the winter's bare branches: the season only picks how deep the skeleton shows, which clusters are on it and their
// colours. Units: world units (a person ≈ 2.1), u = sideways from the trunk, v = up from the paving.
import { rngFrom } from './rng.js';

const TAU = Math.PI * 2;

// ------------------------------------------------------------------ THE COLOURS
// (each list: [rgb, weight]; base colours before the light — trees.js multiplies them by the sun / the sky / the lamps)
const MAPLE_AUTUMN = [
  // 0 — SCARLET-CRIMSON (the curb maple on a phone)
  [[[198, 30, 28], 0.4], [[164, 18, 40], 0.26], [[224, 64, 30], 0.22], [[236, 128, 36], 0.08], [[120, 18, 34], 0.04]],
  // 1 — BLAZING ORANGE (the big one on the front walk: orange with flames of gold and red)
  [[[234, 102, 24], 0.38], [[246, 146, 34], 0.24], [[214, 56, 26], 0.18], [[250, 192, 56], 0.14], [[180, 40, 30], 0.06]],
  // 2 — GOLD-AMBER
  [[[240, 168, 36], 0.4], [[218, 128, 28], 0.28], [[252, 206, 76], 0.18], [[204, 86, 28], 0.1], [[170, 150, 50], 0.04]],
];
const MIX = {
  maple: {
    spring: [[[150, 200, 84], 0.4], [[176, 214, 104], 0.3], [[124, 176, 72], 0.22], [[196, 210, 110], 0.08]],
    summer: [[[58, 112, 46], 0.4], [[76, 132, 56], 0.3], [[46, 94, 44], 0.2], [[96, 146, 62], 0.1]],
    autumn: MAPLE_AUTUMN,
  },
  crab: {
    // the BLOSSOM (its big moment): white-pink petals, pink, the deep-pink buds (FP2 — the owner: "fluffier / whiter": more of the
    // open white-blush petals, the pink a softer share, the deep buds a sprinkle)
    spring: [[[255, 240, 244], 0.36], [[255, 252, 250], 0.24], [[252, 196, 216], 0.24], [[236, 120, 166], 0.13], [[150, 196, 96], 0.02]],
    summer: [[[64, 106, 56], 0.42], [[82, 124, 62], 0.32], [[52, 90, 50], 0.18], [[104, 132, 66], 0.08]],
    // a crabapple turns yellow-bronze (its red fruit carry the colour)
    autumn: [[[214, 160, 52], 0.36], [[190, 118, 40], 0.28], [[164, 132, 54], 0.18], [[228, 190, 80], 0.12], [[126, 120, 52], 0.06]],
  },
};
/** a leaf dab's half-length (world units): a maple's leaves, a crabapple's smaller ones */
export const LEAF = { maple: 0.115, crab: 0.09 };
export const BARK ={ maple: [104, 94, 88], crab: [92, 70, 62] };
export const FRUIT = [196, 28, 42];
const GREEN = [84, 128, 56];

/** a tree's leaf colours for a season: [[rgb, weight], …] (winter: the autumn's, browned — what lies on the paving) */
export function treeMix(kind, season, i = 0) {
  const k = MIX[kind] || MIX.maple, s = season === 'winter' ? 'autumn' : season;
  const m = k[s] || k.summer;
  const list = Array.isArray(m[0][0][0]) ? m[i % m.length] : m;
  return season === 'winter' ? list.map(([c, w]) => [mixc(c, [118, 84, 58], 0.55), w]) : list;
}
/** a back cluster's richer colour (FP2): saturated + a step darker, warm toward red in autumn */
function deepen(c, season, crab) {
  const k = season === 'autumn' ? (crab ? [1, 0.82, 0.62] : [1, 0.7, 0.52]) : season === 'spring' && crab ? [1, 0.88, 0.92] : [0.84, 0.92, 0.82];
  return [Math.round(c[0] * k[0]), Math.round(c[1] * k[1]), Math.round(c[2] * k[2])];
}
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const pickW = (R, list) => { let r = R() * list.reduce((s, [, w]) => s + w, 0); for (const it of list) { r -= it[1]; if (r <= 0) return it[0]; } return list[0][0]; };

/** how full the crown is (0 = bare … 1 = full) */
export function densityOf(kind, season, phase = 0.5) {
  if (season === 'winter') return 0;
  if (season === 'summer') return 1;
  if (season === 'spring') return kind === 'crab' ? 1 : 0.3 + 0.7 * Math.min(1, phase * 2.2);
  // autumn: full through the turn, then the shedding (late autumn: thin crowns, the branches showing)
  return phase <= 0.7 ? 1 : Math.max(0.22, 1 - (phase - 0.7) / 0.3 * 0.78);
}

// ------------------------------------------------------------------ THE SHAPE
/** the crown's envelope: centre height cv, half-width a, half-height b (+ the shape test) */
export function envelopeOf(t) {
  const crab = t.kind === 'crab';
  const cv = t.trunk + t.h * (crab ? 0.47 : 0.5), a = t.w / 2, b = t.h / 2;
  // a maple: a rounded oval, a touch narrower at its foot; a crabapple: a low wide vase, a flatter top
  const inside = (u, v, m = 1) => {
    const dv = (v - cv) / b, kx = crab ? (dv > 0 ? 1 : 0.72 + 0.28 * (1 + dv)) : (dv < 0 ? 0.9 + 0.1 * (1 + dv) : 1);
    const ex = u / (a * kx), ey = crab && dv > 0 ? dv * 1.12 : dv;
    return ex * ex + ey * ey <= m * m;
  };
  return { cv, a, b, inside };
}

/**
 * A tree's plan: { kind, env, segs, clusters, fallen, fruit, density, mix, depth }.
 * segs: [{ x0, y0, x1, y1, w0, w1, d }] (d: 0 = the trunk … 6 = the finest twigs; a leafy season shows d ≤ 3, late autumn ≤ 4,
 * winter all); clusters: [{ u, v, r, back, nz, col, blooms, blobs, dabs }] (the crown's leaf clusters, back ones first, then the
 * front by depth); fallen: [{ u, dz, c, rot, k }] (leaves / petals on the grate + the paving); fruit: [{ u, v }] (a crabapple's).
 */
export function treePlan(t, { season = 'autumn', phase = 0.5, i = 0 } = {}) {
  const crab = t.kind === 'crab', env = envelopeOf(t), { cv, a, b } = env;
  const key = `${Math.round(t.x * 10)}|${Math.round(t.z * 10)}|${t.kind}`;
  // --- THE SKELETON (always to the finest twig; the season picks how deep it shows)
  const R = rngFrom(`tree-sk|${key}`), segs = [];
  // (FP2: the big framing maple's trunk sturdier — the owner: "a lopsided crown on a thin trunk" — and it forks a little lower, so
  // the limbs visibly branch up into the crown)
  const big = !!t.big, trunkW = crab ? 0.27 : big ? 0.54 : 0.4, fork = t.trunk * (crab ? 0.74 : big ? 0.8 : 0.86), lean = (R() - 0.5) * (big ? 0.08 : 0.16);
  segs.push({ x0: 0, y0: 0, x1: lean, y1: fork, w0: trunkW, w1: trunkW * 0.84, d: 0 });
  const grow = (x, y, ang, len, wid, d) => {
    // a gently bent limb (two pieces), fitted into the crown's envelope (a twig that would poke out is shortened, then dropped)
    const bend = (R() - 0.5) * (crab ? 0.5 : 0.28);
    let a1 = ang + bend, a2 = ang - bend * 0.7, L = len, ok = false;
    for (let k = 0; k < 4; k++) {
      const ex = x + Math.sin(a1) * L / 2 + Math.sin(a2) * L / 2, ey = y + Math.cos(a1) * L / 2 + Math.cos(a2) * L / 2;
      if (d <= 1 || env.inside(ex, ey, 0.97)) { ok = true; break; }
      L *= 0.68;
    }
    if (!ok) return;
    const mx = x + Math.sin(a1) * L / 2, my = y + Math.cos(a1) * L / 2, ex = mx + Math.sin(a2) * L / 2, ey = my + Math.cos(a2) * L / 2;
    const wm = wid * 0.86, we = wid * 0.72;
    segs.push({ x0: x, y0: y, x1: mx, y1: my, w0: wid, w1: wm, d }, { x0: mx, y0: my, x1: ex, y1: ey, w0: wm, w1: we, d });
    if (d >= 6) return;
    const kids = d <= 2 && R() < 0.4 ? 3 : 2, spread = (crab ? 0.6 : 0.46) + (R() - 0.5) * 0.12;
    for (let k = 0; k < kids; k++) {
      // (a maple reaches up — its children lean back toward the sky; a crabapple spreads)
      let ca = a2 + (k - (kids - 1) / 2) * spread + (R() - 0.5) * 0.22;
      ca *= crab ? 0.96 : 0.88;
      const at = k === 0 && kids > 2 ? 0.6 : 1, sx = x + (ex - x) * at, sy = y + (ey - y) * at;
      grow(sx, sy, ca, L * (0.66 + R() * 0.14), we * (0.64 + R() * 0.06), d + 1);
    }
  };
  // (FP2: the big maple's five limbs spread evenly either side — a full, round, balanced crown)
  const limbs = crab ? [-0.98, -0.52, -0.06, 0.4, 0.86] : big ? [-0.78, -0.38, 0, 0.38, 0.78] : [-0.66, -0.24, 0.2, 0.6];
  limbs.forEach((ang, k) => {
    const a0 = ang + (R() - 0.5) * 0.18, at = fork - (crab ? 0 : (k % 2) * 0.25);
    grow(lean * at / fork, at, a0, t.h * (crab ? 0.4 : big ? 0.4 : 0.36) * (0.9 + R() * 0.2), trunkW * (crab ? 0.5 : 0.56), 1);
  });
  if (!crab) grow(lean, fork, lean * 0.5, t.h * 0.42, trunkW * 0.6, 1);   // the maple's leader

  // --- THE CROWN: leaf clusters (none in winter); the thinning drops clusters by a fixed rank, so the same tree thins the same way
  const C = rngFrom(`tree-cl|${key}`), clusters = [];
  const density = densityOf(t.kind, season, phase);
  const mix = treeMix(t.kind, season, i), H = rngFrom(`tree-hue|${key}|${season}|${i}`);
  // (FP2: the big maple fuller — more clusters, fewer of them hung on the limbs' tips: a round, even crown, no bald side)
  const want = crab ? 24 : big ? 46 : 34, r0 = crab ? 0.13 * t.w : 0.15 * t.w, r1 = crab ? 0.2 * t.w : 0.21 * t.w, onTips = big ? 0.35 : 0.55;
  const tips = segs.filter(s => s.d >= 3 && s.d <= 4).map(s => [s.x1, s.y1]);
  for (let n = 0, tries = 0; n < want && tries < want * 12; tries++) {
    const r = r0 + C() * (r1 - r0);
    let u, v;
    if (tips.length && C() < onTips) { const p = tips[Math.floor(C() * tips.length)]; u = p[0] + (C() - 0.5) * r; v = p[1] + (C() - 0.5) * r; }
    else { const th = C() * TAU, rr = Math.sqrt(0.12 + C() * 0.88); u = Math.cos(th) * rr * a; v = cv + Math.sin(th) * rr * b; }
    if (!env.inside(u, v, 1 - r / Math.min(a, b) * 0.9)) continue;
    // (the leaves' reach stays inside the crown's box: never past t.w / 2 sideways — the layout keeps that inside the screen — or
    // above trunk + h; a cluster at the rim is nudged in)
    const reach = r * 1.04 + (LEAF[t.kind] || LEAF.maple) * 1.6;
    if (Math.abs(u) + reach > a) u = Math.sign(u) * (a - reach);
    if (v + reach > t.trunk + t.h) v = t.trunk + t.h - reach;
    const nr = Math.hypot(u / a, (v - cv) / b);
    let back = nr < 0.42 || C() < 0.36;
    // the window into the crown: the fork and the lower limbs show (front clusters stay off the lower middle)
    // (FP2: the big maple's window smaller — just the fork, the limbs showing as they rise into the crown)
    if (!back && Math.abs(u) < a * (crab ? 0.42 : big ? 0.24 : 0.34) && v < cv - b * (crab ? 0.05 : big ? 0.4 : 0.18)) back = true;
    const nz = Math.sqrt(Math.max(0, 1 - nr * nr)) * (back ? -0.5 : 0.35 + C() * 0.65);
    const young = season === 'spring' && !crab ? 0.66 + 0.34 * Math.min(1, phase * 2.5) : 1;
    clusters.push({ u, v, r: r * young, back, nz, rank: C(), seed: C() });
    n++;
  }
  // the colours: a cluster's own hue from the tree's mix (the top + the outside turn first: a maple's top clusters lean to its
  // first colour, the inside keeps a touch of green early in autumn)
  for (const cl of clusters) {
    const top = (cl.v - cv) / b, nr = Math.hypot(cl.u / a, top);
    let col = top > 0.35 && H() < 0.35 ? mix[0][0] : pickW(H, mix);
    if (season === 'autumn' && phase < 0.35 && !crab) col = mixc(col, GREEN, (0.35 - phase) / 0.35 * 0.55 * (1 - nr));
    if (season === 'spring' && crab && phase > 0.78) col = H() < (phase - 0.78) / 0.22 ? mixc(GREEN, [150, 196, 96], H()) : col;
    cl.col = col.map(Math.round);
    // (a second colour from the mix for some of its leaves: neighbouring clusters blend, never a ball of one colour)
    cl.col2 = (season === 'autumn' && phase < 0.35 && !crab ? mixc(pickW(H, mix), GREEN, 0.3) : pickW(H, mix)).map(Math.round);
    cl.blooms = crab && season === 'spring' && cl.col[0] > 200;
    // FP2 — THE INSIDE OF THE CROWN (the owner: "a dark brown-black blob inside the big maple"): the back clusters (the crown's core,
    // in shade) take a DEEPER, richer version of their own colour — an autumn maple's inside a deep orange-red / crimson, a summer's
    // a deep green, a blossom's a deeper pink — never the same colour darkened to brown (trees.js lifts their light too)
    if (cl.back) { cl.col = deepen(cl.col, season, crab); cl.col2 = deepen(cl.col2, season, crab); }
  }
  // the clusters' own shapes: a few overlapping discs (the body) + leaf dabs round the edge and over the lit cap (unit = r)
  for (const cl of clusters) {
    const S = rngFrom(Math.floor(cl.seed * 1e9));
    const nb = 4 + Math.floor(S() * 3);
    cl.blobs = [{ dx: 0, dy: 0, r: 0.62 }];
    for (let k = 1; k < nb; k++) { const th = S() * TAU, d = 0.3 + S() * 0.32; cl.blobs.push({ dx: Math.cos(th) * d, dy: Math.sin(th) * d, r: 0.36 + S() * 0.22 }); }
    // (the leaves' count follows the cluster's size in leaves: the same density of texture on a small tree and a big one)
    const leaf = LEAF[t.kind] || LEAF.maple, ne = Math.round(TAU * 0.9 * cl.r / (leaf * 1.45)), ni = Math.round(ne * 0.42), np = 4 + Math.floor(S() * 3);
    cl.dabs = [];
    // the shadow pockets between the leaves (drawn first, darker), the ring that breaks the edge, the leaves over the cap
    for (let k = 0; k < np; k++) { const th = S() * TAU, d = 0.2 + S() * 0.5; cl.dabs.push({ dx: Math.cos(th) * d, dy: Math.sin(th) * d, rot: S() * Math.PI, k: 0.9 + S() * 0.5, dark: true }); }
    for (let k = 0; k < ne; k++) { const th = (k + S() * 0.8) / ne * TAU, d = 0.8 + S() * 0.24; cl.dabs.push({ dx: Math.cos(th) * d, dy: Math.sin(th) * d, rot: th + (S() - 0.5) * 0.8, k: 0.75 + S() * 0.55, alt: S() < 0.3 }); }
    for (let k = 0; k < ni; k++) { const th = S() * TAU, d = Math.sqrt(S()) * 0.72; cl.dabs.push({ dx: Math.cos(th) * d, dy: Math.sin(th) * d - 0.12, rot: S() * Math.PI, k: 0.7 + S() * 0.55, alt: S() < 0.35 }); }
  }
  const kept = clusters.filter(cl => cl.rank < density);
  kept.sort((p, q) => (p.back === q.back ? p.nz - q.nz : p.back ? -1 : 1));

  // --- WHAT LIES UNDER IT: autumn leaves (more as the season goes on), the blossom's petals, a winter's few brown leaves
  const F = rngFrom(`tree-gr|${key}|${season}`), fallen = [];
  const nf = season === 'autumn' ? Math.round((crab ? 6 : 10) + (crab ? 10 : 30) * phase)
    : season === 'spring' && crab ? Math.round(6 + 22 * Math.max(0, Math.min(1, (phase - 0.2) / 0.6)))
      : season === 'winter' ? 4 : 0;
  for (let k = 0; k < nf; k++) {
    const th = F() * TAU, rr = 0.25 + Math.pow(F(), 0.7) * (crab ? 1.5 : 2.1);
    const c = mixc(pickW(F, mix), [118, 84, 58], season === 'spring' ? 0 : 0.12 + F() * 0.18);
    fallen.push({ u: Math.cos(th) * rr * 1.25, dz: Math.sin(th) * rr * 0.6, c: c.map(Math.round), rot: F() * Math.PI, k: 0.7 + F() * 0.6 });
  }
  // a crabapple's fruit: small red apples on the twigs through autumn and winter
  const fruit = [];
  if (crab && (season === 'autumn' || season === 'winter')) {
    const P = rngFrom(`tree-fr|${key}`), twigs = segs.filter(s => s.d >= 4);
    const nfr = season === 'autumn' ? Math.round(14 + 10 * phase) : 12;
    for (let k = 0; k < nfr && twigs.length; k++) { const s = twigs[Math.floor(P() * twigs.length)]; fruit.push({ u: s.x1 + (P() - 0.5) * 0.12, v: s.y1 - 0.06 - P() * 0.08 }); }
  }
  const depth = season === 'winter' ? 6 : season === 'autumn' && phase > 0.7 ? 4 : season === 'spring' && !crab && phase < 0.3 ? 5 : 3;
  return { kind: t.kind, env, segs, clusters: kept, fallen, fruit, density, mix, depth };
}
