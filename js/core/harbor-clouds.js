// CITY 2.0 — THE HARBOR: THE CLOUDS, PURE (DT2 — the day look; docs/harbor.md#dt2). No DOM: what the sky holds, where, and in
// what light. The renderer (screens/harbor/clouds.js) bakes each cloud from this into a shaded sprite and moves it by offset.
//   cloudMix(L, seed)        the real weather → the kinds in the sky now (shares 0..1): CUMULUS (fair-weather heaps: humilis →
//                            mediocris → congestus), STRATOCUMULUS patches (a greyer day), ALTOCUMULUS (a mid layer of small
//                            cells), CIRRUS (high wispy streaks), the OVERCAST deck, SCUD (low dark fragments under it).
//                            With the live weather's cover by height (L.cloudLayers { lo, mid, hi }) the kinds follow it; without
//                            it they come from the total cover + the day's seed.
//   cloudPlan(box, mix, seed) where each cloud sits: PERSPECTIVE on a cloud field (a ground plan seen from below) — the near
//                            (high) ones big, those near the horizon smaller, flatter and closer together, in clusters with gaps,
//                            a few big ones and many small; never in rows.
//   skyLight(L, o)            the light for the hour: the sun (or the moon) as the key light, the sky above + the ground below as
//                            the ambient, the city's glow under them at night (the party's colours on a party night).
//   cloudLit(G, d, x, box)    one cloud's light from where it is: the key light's side, backlit near the sun (the silver rim),
//                            lit from below after sunset, the haze of distance — and the key its bake follows.
// PART 9 PLUGS IN: cloudMix's result is the whole recipe (set more deck / scud, a darker base: `extra` in skyLight greys + darkens
// everything); new kinds are new entries in the renderer's KINDS.
import { rngFrom } from './rng.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rad = d => d * Math.PI / 180;

// ------------------------------------------------------------------ THE KINDS (the real weather)
/**
 * The sky's recipe now: { cover, cumulus, strato, alto, cirrus, veil (cirrostratus), deck, scud (shares 0..1), tall (0 humilis …
 * 1 congestus),
 * layers (true = from the live weather's heights) }.
 */
export function cloudMix(L, seed = '') {
  const c = clamp01((L && L.cloud) || 0), lay = L && L.cloudLayers, R = rngFrom(`cmix|${seed}`);
  const wet = !!(L && (L.rain > 0.05 || L.snow > 0.3 || L.storm));
  let lo, mid, hi;
  if (lay) { lo = clamp01(lay.lo); mid = clamp01(lay.mid); hi = clamp01(lay.hi); }
  else {
    // (no heights: a fair day is low cumulus with, some days, high cirrus; a cloudy day adds patches + a mid layer; overcast is low)
    const r1 = R(), r2 = R(), r3 = R();
    hi = c < 0.8 && r1 < 0.62 ? 0.12 + r2 * 0.4 : 0;
    mid = c > 0.4 ? (c - 0.4) * (0.4 + r3 * 0.6) : 0;
    lo = c;
  }
  const deck = wet ? 1 : smooth(0.74, 0.96, Math.max(lo, mid * 0.9));
  // (SP — the owner's overcast at 1 pm showed separate puffy clouds: under a full deck nothing puffy floats in front of it — only
  // the scud's dark ragged fragments; the heaps fade out as the deck closes)
  const shut = 1 - smooth(0.45, 0.85, deck);
  const strato = smooth(0.4, 0.78, lo) * (1 - 0.75 * deck) * shut;
  const cumulus = lo < 0.035 ? 0 : clamp01(Math.min(lo, 0.6) * 1.05) * (1 - 0.85 * deck) * (1 - 0.35 * strato) * shut;
  const alto = smooth(0.12, 0.6, mid) * (1 - deck);
  const cirrus = smooth(0.04, 0.45, hi) * (1 - 0.9 * deck);
  // (SP: a lot of high cover is CIRROSTRATUS — a thin milky veil over the blue, the wisps through it; the moon's 22° halo lives here)
  const veil = smooth(0.5, 0.85, hi) * (1 - deck);
  const scud = deck > 0.2 ? smooth(0.2, 1, deck) * (wet ? 1 : 0.6) : 0;
  // the cumulus's character: a thin fair day = humilis (small, flat); more cover = mediocris; some days congestus towers
  const r4 = R();
  const tall = clamp01(smooth(0.08, 0.5, lo) * (0.35 + 0.65 * r4) + (r4 > 0.82 && lo > 0.2 ? 0.3 : 0));
  return { cover: c, cumulus, strato, alto, cirrus, veil, deck, scud, tall, layers: !!lay };
}

// ------------------------------------------------------------------ M3 — THE SMALL CLOUDS
/** below this a cumulus isn't drawn at all (pt wide: the old "little puff" class) */
export const SMALL_DROP = 50;
/** at most this many small ones in a sky (a phone's width; more on a wider screen): fewer and better */
export const SMALL_MAX = 4;
/** up to this a cumulus is never a heap: a FRAGMENT (frag) or a soft WISP — irregular, partly see-through, no flat base */
export const SMALL_FRAG = 130;     // (a heap's sprite is wider than the cloud you see: under ~130 pt it read as a little puff)
/** decide a small cumulus's form (sets d.form + d.k, its opacity): 'drop' | 'frag' | 'wisp' | null (a full heap, as before) */
export function smallForm(d, R, room = Infinity) {
  // (a NEAR one is never small — it grows to a full heap: the small slots are the middle distance's + the far ones')
  if (d.s > 0.5 && d.w < SMALL_FRAG && d.kind === 'cumulus') { const k = SMALL_FRAG / d.w; d.w = SMALL_FRAG; d.h *= k; return null; }
  if (d.w < SMALL_DROP) return 'drop';
  if (d.w >= SMALL_FRAG) return null;
  if (room <= 0) return 'drop';
  const wisp = R() < 0.6;
  d.form = wisp ? 'wisp' : 'frag';
  d.h = Math.max(10, Math.min(d.h, d.w * (wisp ? 0.26 : 0.4)));      // (flatter: a piece, never a little dome)
  d.k = wisp ? 0.56 + R() * 0.14 : 0.72 + R() * 0.14;                 // (partly see-through)
  d.tall = 0;
  return d.form;
}

// ------------------------------------------------------------------ THE LAYOUT (perspective on a cloud field)
/** how near a screen height is on the cloud field: 1 overhead (the top of the sky) … → 0 at the horizon */
export const nearAt = (y, box) => clamp((box.hz - y) / Math.max(1, box.hz - box.top), 0.03, 1);
const lognorm = (R, s) => { const u = Math.max(1e-6, R()), v = R(); return Math.exp(s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)); };

/**
 * Where each cloud sits. box: { W, top (the safe top), roof (the skyline's median roof), hz (the horizon: the far waterline),
 * avoid ({ y0, y1 } | null: the tagline's band — SPEAKEASY to the tagline — the cirrus keep above it where they can) }.
 * Returns [{ kind, seed, x0 (pt, its left edge at t = 0), y (its base on screen), w, h, s (near 0..1), v (drift per unit wind
 * speed: nearer = faster), z (draw order: far first) }].
 */
export function cloudPlan(box, M, seed = '') {
  const { W, top, roof, hz } = box, R = rngFrom(`cplan|${seed}`), out = [];
  if (!M || M.cover < 0.03) return out;
  const wide = clamp(W / 430, 1, 3), phoneW = Math.min(W, 520), sky = Math.max(60, roof - top) * W;
  const K = 1, yNear = top + 34, yFar = roof + 12;
  const dN = K / Math.max(8, hz - yNear), dF = K / Math.max(8, hz - yFar);
  // (the depth, sampled by screen height: a few more of them low in the sky than high — closer together toward the horizon —
  // but not so many that they all hide behind the skyline: pdf(t) ∝ 1 + B·t down the band, t = 0 the top)
  const B = 1.1, depthAt = u => { const t = (Math.sqrt(1 + B * (B + 2) * u) - 1) / B; return K / Math.max(8, hz - (yNear + t * (yFar - yNear))); }, depth = () => depthAt(R());
  const yOf = d => hz - K / d;
  const seedOf = () => Math.floor(R() * 1e9);
  const area = d => d.w * d.h * (d.kind === 'cirrus' ? 0.25 : d.kind === 'cumulus' || d.kind === 'scud' ? 0.5 : 0.45);
  const fits = d => {
    // (NEVER IN ROWS: two others of about its size already at about its height, anywhere across → it goes elsewhere)
    if (out.filter(o => o.kind === d.kind && Math.abs(o.y - d.y) < 0.45 * (o.h + d.h) / 2 && Math.abs(o.w - d.w) < 0.38 * Math.max(o.w, d.w)).length >= 2) return false;
    // (no clone stacked on another of about the same nearness: a cluster is neighbours, never one cloud drawn twice)
    for (const o of out) {
      if (o.kind !== d.kind || Math.abs(o.s - d.s) > 0.16) continue;
      const ix = Math.min(o.x0 + o.w, d.x0 + d.w) - Math.max(o.x0, d.x0), iy = Math.min(o.y, d.y) - Math.max(o.y - o.h, d.y - d.h);
      if (ix > 0 && iy > 0 && ix * iy > 0.42 * Math.min(o.w * o.h, d.w * d.h)) return false;
    }
    return true;
  };
  // ---- CUMULUS, in clusters: a few centres on the field, most clouds near one, some alone
  if (M.cumulus > 0.01) {
    const target = M.cumulus * 0.7 * sky, nMax = Math.round(clamp(7 + M.cumulus * 26, 6, 22) * Math.pow(wide, 0.45)), nMin = Math.round((3 + M.cumulus * 16) * Math.pow(wide, 0.45));
    // (the clusters' centres spread through the depth — one near, one in the middle, one far …: the sky has every distance)
    const nP = 2 + Math.floor(R() * 2 * Math.sqrt(wide)), parents = Array.from({ length: nP }, (_, i) => ({ x: R() * W, d: depthAt((i + R()) / nP) }));
    let got = 0, tries = 0;
    let nCu = 0;
    const smallMax = Math.round(SMALL_MAX * Math.sqrt(wide));
    while ((got < target || nCu < nMin) && nCu < nMax && tries++ < nMax * 8) {
      let d, x;
      if (R() < 0.72) { const p = parents[Math.floor(R() * parents.length)]; d = clamp(p.d * (1 + (R() - 0.5) * 0.6), dN, dF); x = p.x; }
      else { d = depth(); x = R() * W; }
      const y = yOf(d), s = nearAt(y, box);
      // (the size: lognormal — many small, a few big; the near ones big by perspective; far ones flatter)
      const size = clamp(lognorm(R, 0.32) * (0.3 + 0.24 * M.tall) * (0.85 + 0.3 * M.cover), 0.16, 0.95);
      // (the glance test: never a sliver — a far one still ~30 × 10 pt)
      const w = Math.max(30, size * phoneW * (0.06 + 0.94 * s));
      // (far ones flatter + wider — humilis on the horizon; the near ones show their towers)
      const asp = (0.34 + 0.3 * M.tall + R() * 0.12) * (0.62 + 0.38 * s);
      // (a near one sits low enough that its towers show under the top of the screen)
      const hh = Math.max(10, w * asp);
      const c = { kind: 'cumulus', seed: seedOf(), w, h: hh, s, y: Math.max(y, top + hh * 0.72), x0: 0, v: 0.25 + 0.95 * s, tall: clamp01(M.tall + (R() - 0.5) * 0.4) * (0.4 + 0.6 * s) };
      // (SP — more shape variety, never one cloud repeated: most are heaps; some a TOWER (narrower + taller — a congestus turret,
      // more often on a taller day), a few broken + ragged FRACTUS; the small far ones stay simple puffs)
      const fr = R();
      if (s > 0.25 && fr < 0.08 + 0.22 * M.tall) { c.form = 'tower'; c.w = Math.max(30, c.w * 0.72); c.h = Math.min(c.w * 1.25, c.h * 1.55); c.tall = Math.max(c.tall, 0.7); c.y = Math.max(c.y, top + c.h * 0.8); }
      else if (fr > 0.86) { c.form = 'fractus'; c.h = Math.max(10, c.h * 0.7); }
      c.x0 = x + (R() - 0.5) * w * 1.6 - w / 2;
      // (far ones: their heights spread a little — never a line of puffs along the horizon)
      if (s < 0.4) c.y = Math.min(roof + 12, c.y + (R() - 0.5) * 26 * (1 - s));
      // M3 — THE SMALL ONES (the owner: "they still look cheap and fake" — little puffs with a flat bottom + three bumps, clip art):
      // the smallest class is gone (it still counts toward the sky's share: fewer clouds, never replaced by more); a small one that
      // stays is a FRAGMENT (a broken ragged piece) or a soft WISP — never a little heap (smallForm)
      const sf = smallForm(c, R, smallMax - out.filter(o => o.form === 'frag' || o.form === 'wisp').length);
      if (sf === 'drop') { got += area(c); nCu++; continue; }
      c.y = Math.max(c.y, top + c.h * 0.72);              // (a near one grown to a heap: its top still under the safe top)
      if (!fits(c)) continue;
      out.push(c); got += area(c); nCu++;
      // (and a far one often has a neighbour half-merged into it: clusters, not a string of single puffs)
      if (s < 0.45 && nCu < nMax && R() < 0.45) {
        const k2 = 0.55 + R() * 0.35, w2 = Math.max(30, w * k2), h2 = Math.max(10, c.h * (k2 + 0.1)), sg = R() < 0.5 ? -1 : 1;
        const c2 = { ...c, seed: seedOf(), w: w2, h: h2, y: Math.min(roof + 12, c.y + (R() - 0.3) * 8), x0: c.x0 + (sg > 0 ? w * (0.45 + R() * 0.3) : -w2 * (0.45 + R() * 0.3)) };
        delete c2.form; delete c2.k;
        if (smallForm(c2, R, smallMax - out.filter(o => o.form === 'frag' || o.form === 'wisp').length) !== 'drop') { out.push(c2); got += area(c2); nCu++; }
      }
    }
  }
  // ---- STRATOCUMULUS + ALTOCUMULUS patches (wide, flat, cells), CIRRUS (high streaks)
  const patches = (kind, share, nBase, wMul, hMul, yBias) => {
    const n = Math.round(share * nBase * wide + (share > 0.15 ? 0.5 : 0));
    for (let i = 0; i < n; i++) {
      let d = depth();
      if (yBias) d = Math.min(d, dN + (dF - dN) * R() * yBias);
      const y = yOf(d), s = nearAt(y, box), w = Math.min(W * 1.25, (0.55 + R() * 0.7) * phoneW * wMul * (0.25 + 0.75 * s) + 30);
      out.push({ kind, seed: seedOf(), w, h: w * hMul * (0.55 + 0.45 * s), s, y: y + (kind === 'cirrus' ? 0 : w * hMul * 0.2), x0: R() * (W + w) - w, v: (kind === 'cirrus' ? 0.18 : kind === 'alto' ? 0.32 : 0.5) * (0.4 + 0.6 * s) });
    }
  };
  patches('strato', M.strato, 4, 1.15, 0.22, 0);
  patches('alto', M.alto, 3, 1.1, 0.34, 0.55);
  // ---- CIRRUS (SP — the owner: "hard, straight, parallel speed lines"): a FEW GRACEFUL GROUPS high in the sky (the renderer draws
  // two to five wisps in each — fibres, mares' tails, a tuft — never a pattern), kept ABOVE the tagline's band (box.avoid) where the
  // sky allows; on a hazy high day one wide CIRROSTRATUS veil behind them
  if (M.cirrus > 0.04) {
    const yMax = Math.max(top + 60, (box.avoid ? box.avoid.y0 - 6 : roof - 30)), n = Math.round(clamp(1 + M.cirrus * 2.2 * Math.sqrt(wide) + R() * 0.8, 1, 4));
    const placed = [];
    for (let i = 0, tries = 0; i < n && tries < 40; tries++) {
      // (6b — CIRRUS SOFTER + LONGER, the owner: "he LOVES the wispy look — stretch them longer": ~1.5× longer, flatter)
      const w = Math.min(W * 1.45, (0.75 + R() * 0.95) * phoneW * (0.8 + 0.2 * R())), h = Math.round(w * (0.17 + R() * 0.08));
      const span = Math.max(1, yMax - top - h), y = top + h + Math.pow(R(), 0.8) * span, s = nearAt(y - h / 2, box);
      const x0 = R() * (W + w * 0.6) - w * 0.8;
      // (groups apart: never two stacked on each other — they would read as one striped block)
      if (placed.some(o => Math.min(o.x0 + o.w, x0 + w) - Math.max(o.x0, x0) > 0.35 * Math.min(o.w, w) && Math.min(o.y, y) - Math.max(o.y - o.h, y - h) > 0.3 * Math.min(o.h, h))) continue;
      const c = { kind: 'cirrus', seed: seedOf(), w, h, s, y, x0, v: 0.18 * (0.4 + 0.6 * s) };
      placed.push(c); out.push(c); i++;
    }
  }
  if (M.veil > 0.05) out.push({ kind: 'cirrus', veil: M.veil, seed: seedOf(), w: Math.round(W * 1.5), h: Math.round(Math.max(80, (box.avoid ? box.avoid.y1 : roof) - top) * 0.95), s: 0.9, y: (box.avoid ? box.avoid.y1 : roof) - 4, x0: -W * 0.25, v: 0.1 });
  // ---- SCUD: low ragged fragments under the deck (they drift faster) — 6b, the owner: "the small dark floating puffs at the tagline
  // height look off" → none under a FULL deck (the deck alone reads right); a broken sky keeps a few
  for (let i = 0, n = M.deck > 0.6 ? 0 : Math.round(M.scud * 5 * wide); i < n; i++) {
    const y = roof + 10 - R() * (roof - top) * 0.45, s = nearAt(y, box), w = (0.25 + R() * 0.3) * phoneW * (0.3 + 0.7 * s);
    out.push({ kind: 'scud', seed: seedOf(), w, h: w * 0.32, s, y, x0: R() * (W + w) - w, v: 0.6 + 1.1 * s, tall: 0 });
  }
  // (the deck: one tile wider than the screen, wrapping, the whole sky down to the horizon)
  if (M.deck > 0.04) out.push({ kind: 'deck', seed: seedOf(), w: Math.ceil(W * 1.5), h: Math.ceil(hz + 6), s: 1, y: hz + 6, x0: 0, v: 0.22, k: M.deck });
  // far first; at the same nearness the high kinds behind the low
  const rankK = { deck: 0, cirrus: 1, alto: 2, strato: 3, cumulus: 4, scud: 5 };
  // (6b — THE LAYERING BUG, the owner: a high cirrus showed THROUGH a cumulus at night. The HIGH kinds (the deck, cirrus, alto) are
  // always drawn FIRST, whatever their nearness on the screen; then the low ones far → near)
  const high = d => (d.kind === 'deck' ? 0 : d.kind === 'cirrus' ? 1 : d.kind === 'alto' ? 2 : 3);
  out.sort((a, b) => (high(a) - high(b)) || (a.s - b.s) || (rankK[a.kind] - rankK[b.kind]));
  // (6b: under a full deck no small round cumulus either — only the big ones stay, melting into it)
  if (M.deck > 0.6) for (let i = out.length - 1; i >= 0; i--) { const d = out[i]; if ((d.kind === 'cumulus' && (d.form === 'frag' || d.form === 'wisp' || d.w < phoneW * 0.4))) out.splice(i, 1); }
  out.forEach((d, i) => { d.z = i; d.w = Math.round(d.w * 10) / 10; d.h = Math.round(d.h * 10) / 10; });
  return out;
}

/** SP4 — the clouds' SCREEN speed (pt/s for d.v = 1): the real wind at their height, slowed for the camera (they are kilometres off):
 *  a cumulus takes MINUTES to cross a phone, never seconds (the owner's "clouds racing" on the seeded wind) — 1.0 pt/s at 1.6 m/s,
 *  2.4 at 6, capped at 2.6 for a gale (a 402-pt phone: ≥ 2.5 min for the nearest, 10+ for the far cirrus) */
export const driftSpeed = wind => Math.min(2.6, 0.5 + Math.max(0, wind || 0) * 0.32);
/** a cloud's left edge now: it drifts with the real wind (nearer = faster), wrapping round the screen (each its own margin) */
export function driftX(d, tSec, wind, windX, W) {
  const span = W + d.w * 1.08, sp = driftSpeed(wind) * windX * d.v;
  const x = d.x0 + d.w * 1.04 + sp * tSec;
  return ((x % span) + span) % span - d.w * 1.04;
}

// ------------------------------------------------------------------ THE LIGHT FOR THE HOUR
// sunlight on the clouds by the sun's elevation (they are high: they keep its light a little after the street loses it) —
// white at midday, gold → orange low, coral + pink just after sunset, a dusky mauve as it goes
const SUNC = [[-9, [96, 74, 146]], [-6.5, [196, 104, 168]], [-4, [255, 112, 128]], [-1.8, [255, 128, 96]], [0.8, [255, 156, 92]],
  [3.5, [255, 188, 118]], [7, [255, 214, 164]], [13, [255, 236, 208]], [24, [255, 248, 238]]];
export function sunOnClouds(el) {
  if (el <= SUNC[0][0]) return SUNC[0][1];
  for (let i = 1; i < SUNC.length; i++) if (el <= SUNC[i][0]) { const [e0, c0] = SUNC[i - 1], [e1, c1] = SUNC[i]; return mix(c0, c1, (el - e0) / (e1 - e0)); }
  return SUNC[SUNC.length - 1][1];
}
// the ambient: the sky above (the tops) and the light from below (the bellies) for each look
const AMB = {
  day: { top: [160, 180, 218], bot: [138, 148, 172] },
  gold: { top: [168, 148, 190], bot: [196, 140, 128] },
  blue: { top: [70, 80, 138], bot: [96, 80, 134] },
  night: { top: [22, 22, 46], bot: [26, 20, 48] },
};
const CITY_GLOW = [168, 86, 226];
/** the look's shares by the real sun's elevation (the same at dusk + dawn): { day, gold, blue, night } summing to 1 */
export function lookShares(el) {
  const day = smooth(4, 13, el), gold = (1 - day) * smooth(-2.5, 1.5, el), blue = (1 - day - gold) * smooth(-12, -5.5, el);
  return { day, gold, blue, night: Math.max(0, 1 - day - gold - blue) };
}
const q = (v, n) => Math.round(v * n);
const qc = c => c.map(v => Math.round(v / 6)).join('.');

/**
 * The light now: { sunC (the key light's colour), sunK (its strength), src ({ x, y, el, vis } on screen | null), moonLit,
 * ambTop, ambBot, glow ({ c, k, party: [[r,g,b]…] | null }), body (how solid they read: 1 by day … 0.6 at night), hazeC, hazeK,
 * grey (0..1: in the deck's shade), key }.
 * o: { sun: { x, y, vis } | null (screen), side (−1..1: the sun's side when it has no x), moon: { x, y, r } | null (screen),
 *      party (0..1), palette ([[r,g,b]…]), horizon ([r,g,b]: the sky's lowest stop), deck (0..1), extra: { grey, dark } }
 */
export function skyLight(L, o = {}) {
  const el = L && L.sun ? L.sun.el : 30, sh = lookShares(el);
  const amb = k => mix(mix(mix(AMB.day[k], AMB.gold[k], sh.gold / Math.max(1e-6, sh.gold + sh.day)), AMB.blue[k], sh.blue / Math.max(1e-6, sh.gold + sh.day + sh.blue)), AMB.night[k], sh.night);
  let ambTop = amb('top'), ambBot = amb('bot');
  const eff = el + 1.6;
  let sunC = sunOnClouds(eff), sunK = smooth(-9.5, -3.2, eff) * (0.82 + 0.18 * smooth(-3, 6, eff));
  const grey = clamp01(smooth(0.6, 1, o.deck || 0) * 0.85 + clamp01((o.extra && o.extra.grey) || 0));
  const dark = clamp01((o.extra && o.extra.dark) || 0);
  // (under a deck the light is diffuse: the key light mostly gone, the colours greyed)
  const lum = c => (c[0] + c[1] + c[2]) / 3, greyed = (c, k) => mix(c, [lum(c) * 0.98, lum(c) * 1.0, lum(c) * 1.05], k);
  sunK *= 1 - 0.82 * grey; ambTop = greyed(ambTop, 0.55 * grey); ambBot = greyed(ambBot, 0.5 * grey);
  if (dark > 0) { ambTop = mix(ambTop, [48, 50, 60], dark * 0.7); ambBot = mix(ambBot, [36, 38, 48], dark * 0.75); sunK *= 1 - 0.8 * dark; }
  let src = null, moonLit = false;
  if (sunK > 0.02) {
    const s = o.sun, side = o.side == null ? 0 : o.side;
    src = { x: s && s.x != null ? s.x : null, side, y: s ? s.y : null, el, vis: s ? clamp01(s.vis == null ? 1 : s.vis) : 0 };
  } else if (o.moon && L && L.moon && L.moon.el > 1) {
    const il = clamp01(L.moon.illum == null ? 0.5 : L.moon.illum);
    sunC = [196, 206, 236]; sunK = (0.14 + 0.36 * il) * (sh.night + sh.blue * 0.5) * (1 - 0.8 * grey);
    src = { x: o.moon.x, y: o.moon.y, el: L.moon.el, vis: 1, moon: true }; moonLit = sunK > 0.03;
    if (!moonLit) src = null;
  }
  const party = clamp01(o.party || 0), pal = party > 0.05 && o.palette && o.palette.length ? o.palette : null;
  const glowK = (0.5 * sh.night + 0.3 * sh.blue) * (1 + 0.6 * party) * (1 - 0.3 * grey);
  const body = 1 - 0.34 * sh.night - 0.12 * sh.blue;
  const hazeC = o.horizon || mix([214, 230, 242], [60, 40, 90], sh.night);
  const hazeK = 0.62 * (sh.day + sh.gold) + 0.35 * sh.blue + 0.25 * sh.night;
  const G = { sunC, sunK, src, moonLit, ambTop, ambBot, glow: { c: CITY_GLOW, k: glowK, party: pal }, body, hazeC, hazeK, grey, shares: sh, el };
  G.key = [qc(sunC), q(sunK, 25), qc(ambTop), qc(ambBot), q(glowK, 20), pal ? 'p' : '-', q(body, 20), qc(hazeC), q(grey, 10), moonLit ? 'm' : ''].join('|');
  return G;
}

/**
 * One cloud's light from where it is now (x: its left edge; box as cloudPlan's): { lx, ly, lz (the key light's direction, unit,
 * screen space: +x right, +y DOWN, +z toward us), l2 ([x, y]: its direction on the screen, for the rim), back (0..1: the key
 * light right behind it — the silver rim), rim, below (0..1: lit from below), haze, farA, glow ([r,g,b] under it), glowK, key }.
 */
export function cloudLit(G, d, x, box) {
  const { W, hz } = box, cx = x + d.w / 2, cy = d.y - d.h * 0.5, s = d.s;
  let lx = 0, ly = -0.8, lz = 0.35, back = 0;
  const S = G.src;
  if (S) {
    const sx = S.x != null ? S.x : W / 2 + (S.side || 0) * W * 0.75;
    const dx = sx - cx;
    lx = clamp(dx / (0.62 * W), -1, 1) * (S.moon ? 1 : 1 - 0.45 * smooth(30, 60, S.el));
    if (S.moon) ly = clamp(((S.y == null ? cy - W * 0.3 : S.y) - cy) / (0.55 * W), -1, 0.9);
    else ly = S.el > 3 ? -Math.min(0.95, Math.sin(rad(S.el - 3)) * 2.2) : Math.min(0.78, Math.sin(rad(3 - S.el)) * 3.4);
    // (backlit: the sun just behind this cloud on the screen — or, set, just below the skyline under it)
    const sy = S.y != null && (S.moon || S.vis > 0.05) ? S.y : hz + 20;
    const dist = Math.hypot(dx / W, (sy - cy) * 1.15 / W);
    back = Math.exp(-((dist / 0.3) ** 2)) * (S.moon ? 0.9 : 0.4 + 0.6 * Math.max(S.vis || 0, smooth(4, -2, S.el)));
    lz = 0.42 * (1 - back) - 0.85 * back;
  }
  const n = Math.hypot(lx, ly, lz) || 1;
  lx /= n; ly /= n; lz /= n;
  const n2 = Math.hypot(lx, ly) || 1;
  const rim = S ? (S.moon ? 0.25 + 1.1 * back : 0.16 + 1.25 * back) * G.sunK : 0;
  const below = clamp01(ly / 0.55);
  const far = 1 - s, haze = Math.pow(far, 1.5) * 0.62 * G.hazeK, farA = 1 - 0.38 * far * far * (d.kind === 'cirrus' ? 0.3 : 1);
  let glow = G.glow.c;
  if (G.glow.party) { const p = G.glow.party[(d.seed >>> 3) % G.glow.party.length]; glow = mix(glow, p, 0.7); }
  const glowK = G.glow.k * (0.5 + 0.7 * far);
  // (SP — the cloudy party's cost: by MOONLIGHT the direction matters little — a weak, silvery key light — so a drifting cloud
  // re-lights in coarse steps only; by day an eighth of the way round the sun, as before)
  const qd = S && S.moon ? 3 : 8;
  const key = [G.key, q(lx, qd), q(ly, qd), q(lz, qd), q(back, qd), q(glowK, 16), glow.map(v => v >> 4).join('.')].join('/');
  return { lx, ly, lz, l2: [lx / n2, ly / n2], back, rim, below, haze, farA, glow, glowK, key };
}

/**
 * POLISH 4 — THE 22° HALO + THE SUN DOGS on a veil day (lc: the city clock's local { y, m, d }; force: the preview flags) →
 * { halo, dogs }: the halo on ~1 veil day in 4 (seeded by the date — every phone the same), the sun dogs on ~half of those (a rarer
 * bonus); forced = { halo, dogs } (&force=halo shows the ring, &force=sundogs the ring + the dogs).
 */
export function haloOf(lc, forced = {}) {
  const h = lc ? (((lc.y * 400 + lc.m * 31 + lc.d) * 2654435761) >>> 0) : 1;
  const seeded = h % 4 === 0;
  return { halo: seeded || !!forced.halo || !!forced.dogs, dogs: (seeded && ((h >>> 2) & 1) === 1) || !!forced.dogs };
}
