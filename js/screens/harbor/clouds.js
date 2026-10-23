// CITY 2.0 — THE HARBOR: THE CLOUDS (THE DAY PASS, the owner's add-on). One cloud system for every hour, replacing City 1.0's cloud
// art on the Harbor (district/weather-fx.js still runs the lightning; City 1.0 keeps its own clouds untouched).
//   - Driven by the REAL cloud cover (LK.cloud: the live weather or the seeded day) and the REAL wind (speed + direction): a fair
//     day a few cumulus (and, some days, high wispy cirrus); a cloudy one more and bigger, low stratus banks; overcast a deck.
//   - Lit for the hour from the real sun's side: by day sunlit white tops + soft blue-grey shaded bottoms; at sunset + dawn gold /
//     pink / orange underneath, brightest toward the sun; at night barely there, faintly lit from below by the city's violet glow
//     (the party's colours on a party night).
//   - In the sky band only (the safe top → above the skyline's roofs): behind the NEON sign (the page draws over the canvas),
//     never over the dock.
//   - PART 9 PLUGS IN: KINDS is a table of shape builders (cumulus, cirrus, stratus, deck — add 'nimbus', 'fog bank' …) and
//     set({ grey, dark, base, kinds }) greys / darkens / lowers the whole sky for rain, storms and snow.
// Cost: the shapes bake once (a few a frame, ~0.2–0.6 ms each) and re-light only when the light's key moves; a frame is one
// drawImage a cloud (≤ ~14). Reduced motion: still clouds.
import { rngFrom } from '../../core/rng.js';
import { ctx2d } from '../../ui/canvas-safe.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const BAKE = 1.6;                         // device px per pt in a cloud's sprite (clouds are soft: never the screen's DPR)

// ------------------------------------------------------------------ THE SHAPES (Part 9 adds its own here)
/** a cumulus: a flat base, a row of small puffs along it, one to three towers of bigger ones, lobes on the top edge */
function cumulusPuffs(R, w, h, o = {}) {
  // (a real fair-weather cumulus: a broad flat base, a body that swells up into one big dome — sometimes a second, smaller one
  // beside it — its top edge a run of round lobes; never a string of beads)
  const base = h * 0.88, out = [], towers = 1 + (R() < 0.55 ? 1 : 0) + (R() < 0.2 ? 1 : 0);
  for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6, r = h * (0.22 + R() * 0.06) * (1 - Math.abs(u - 0.5) * 0.55); out.push([w * (0.14 + u * 0.72), base - r * 0.85, r]); }
  const main = 0.38 + R() * 0.24;
  for (let t = 0; t < towers; t++) {
    const cx = w * (t === 0 ? main : main + (t % 2 ? 1 : -1) * (0.2 + R() * 0.1)), th = h * (t === 0 ? 0.56 + R() * 0.16 : 0.36 + R() * 0.14);
    const n = 4 + Math.floor(R() * 2);
    for (let k = 0; k < n; k++) { const f = k / (n - 0.6), r = th * (0.5 - f * 0.2) * (0.9 + R() * 0.2); out.push([cx + (R() - 0.5) * th * 0.55, base - r * 0.8 - th * f * 0.62, r]); }
    // the lobes on the dome's shoulders
    for (const sgn of [-1, 1]) { const r = th * (0.26 + R() * 0.08); out.push([cx + sgn * th * (0.42 + R() * 0.12), base - th * (0.32 + R() * 0.12), r]); }
  }
  return { puffs: out, base, body: [w * 0.5, base - h * 0.14, w * 0.4, h * 0.15] };
}
export const KINDS = {
  cumulus: (R, w, h) => cumulusPuffs(R, w, h),
  // a low bank: long, flat, ragged on top
  stratus: (R, w, h) => {
    // (a run of low rounded heaps on one flat base — lumpy all along its top, never a smooth blurred strip)
    const base = h * 0.86, out = [], n = 9 + Math.floor(R() * 5);
    for (let i = 0; i < n; i++) { const u = (i + 0.3 + R() * 0.4) / n, r = h * (0.26 + R() * 0.14) * (1 - Math.pow(Math.abs(u - 0.5) * 2, 3) * 0.55); out.push([w * (0.05 + u * 0.9), base - r * (0.55 + R() * 0.2), r]); }
    return { puffs: out, base, body: [w * 0.5, base - h * 0.12, w * 0.43, h * 0.12] };
  },
  cirrus: null,        // (drawn as strands, below)
  deck: null,          // (the overcast sheet, below)
};

// ------------------------------------------------------------------ THE LIGHT FOR THE HOUR
/**
 * The clouds' light now: { top (the sunlit side), shade (the belly), under (the light from below: sunset or the city), uk (its
 * strength), lx (−1..1: the sun's side across the screen), body (how much they stand out: 0 at night … 1), key }.
 */
export function cloudLight(LK, sunX, W, party = 0, o = {}) {
  const w = LK.w || {}, day = w.day || 0, gold = (w.golden || 0) + (w.dawn || 0), night = (w.night || 0) + (w.late || 0);
  const el = LK.sun ? LK.sun.el : 30, s = day + gold + night || 1;
  const low = smooth(14, 1, el) * smooth(-7, -1, el);                  // the sun near the horizon: the bellies catch fire
  const dusk = smooth(1, -3, el) * smooth(-9, -4, el);                  // just after sunset: pink + red from below, the tops dark
  // (a low sun lights the clouds from the SIDE + below: the lobes toward it gold, the rest in a dusky mauve shade)
  const top = mix(mix(mix([255, 255, 255], [255, 204, 150], low), [196, 120, 150], dusk), [44, 42, 74], night / s * (1 - dusk));
  const shade = mix(mix(mix([166, 182, 210], [132, 92, 140], low), [92, 62, 112], dusk), [24, 22, 46], night / s * (1 - dusk));
  const cityU = party > 0.05 ? mix([150, 90, 220], [90, 80, 255], party) : [150, 90, 210];
  const under = low + dusk > 0.05 ? mix([255, 168, 88], [255, 92, 112], clamp01(dusk + smooth(6, 0, el) * 0.5)) : cityU;
  const uk = Math.max(Math.max(low, dusk), 0.38 * night / s * (1 - dusk));
  const lx = sunX == null ? 0 : Math.max(-1, Math.min(1, (sunX - W / 2) / (W * 0.45)));
  const body = clamp01(0.92 * day / s + 0.9 * gold / s + 0.42 * night / s);
  const grey = clamp01(o.grey || 0), dark = clamp01(o.dark || 0);
  const g = c => mix(mix(c, [(c[0] + c[1] + c[2]) / 3, (c[0] + c[1] + c[2]) / 3, (c[0] + c[1] + c[2]) / 3 + 6], grey), [40, 42, 52], dark * 0.7);
  const L = { top: g(top), shade: g(shade), under: g(under), uk: uk * (1 - 0.6 * grey), lx: Math.round(lx * 3) / 3, ly: Math.round(Math.max(low, dusk) * 4) / 4, body, party: party > 0.05 };
  const q = c => c.map(v => Math.round(v / 10)).join('.');
  L.key = `${q(L.top)}|${q(L.shade)}|${q(L.under)}|${Math.round(L.uk * 10)}|${L.lx}`;
  return L;
}

// ------------------------------------------------------------------ BAKING ONE CLOUD
function canvasFor(cv, w, h) {
  const cw = Math.max(1, Math.ceil(w * BAKE)), ch = Math.max(1, Math.ceil(h * BAKE));
  if (!cv) cv = document.createElement('canvas');
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
  return cv;
}
/** a puffy cloud (cumulus / stratus): silhouette → the shade → the sunlit lobes → the belly → the light from below → the rims */
function bakePuffy(cv, d, Lt) {
  const { w, h } = d, sh = d.shape, x = ctx2d(cv);
  if (!x) return;
  x.setTransform(BAKE, 0, 0, BAKE, 0, 0); x.clearRect(0, 0, w, h);
  const P = sh.puffs, lx = Lt.lx;
  // 1. the silhouette (each puff soft at its very edge), the base cut flat with a soft fade
  x.globalCompositeOperation = 'source-over';
  // (the body: one broad flat lens along the base that every puff grows from — no gaps between the base puffs)
  if (sh.body) { const [bx, by, brx, bry] = sh.body; x.fillStyle = '#000'; x.beginPath(); x.ellipse(bx, by, brx, bry, 0, 0, Math.PI * 2); x.fill(); }
  for (const [px, py, r] of P) { const g = x.createRadialGradient(px, py, r * 0.9, px, py, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(px, py, r * 0.91, 0, Math.PI * 2); x.fillStyle = '#000'; x.fill(); }
  x.globalCompositeOperation = 'destination-out';
  const bf = x.createLinearGradient(0, sh.base - h * 0.05, 0, sh.base + h * 0.06); bf.addColorStop(0, 'rgba(0,0,0,0)'); bf.addColorStop(1, 'rgba(0,0,0,1)');
  x.fillStyle = bf; x.fillRect(0, sh.base - h * 0.05, w, h);
  // 2. the body in the shade colour
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = rgba(Lt.shade); x.fillRect(0, 0, w, h);
  // 3. the sunlit lobes: each puff lit from above + the sun's side (the light wraps round it, the far side stays in shade)
  for (const [px, py, r] of P) {
    const cx = px + lx * r * (0.42 + 0.3 * (Lt.ly || 0)), cy = py - r * 0.5 * (1 - 0.85 * (Lt.ly || 0)), g = x.createRadialGradient(cx, cy, r * 0.05, cx, cy, r * (1.08 - 0.3 * (Lt.ly || 0)));
    g.addColorStop(0, rgba(Lt.top, 1)); g.addColorStop(0.55, rgba(Lt.top, 0.75)); g.addColorStop(1, rgba(Lt.top, 0));
    x.fillStyle = g; x.fillRect(px - r * 1.6, py - r * 1.6, r * 3.2, r * 3.2);
  }
  // 4. the belly: a soft shaded underside (darker toward the flat base)
  const bg = x.createLinearGradient(0, sh.base, 0, sh.base - h * 0.42);
  bg.addColorStop(0, rgba(mix(Lt.shade, [40, 46, 80], 0.18), 0.85)); bg.addColorStop(1, rgba(Lt.shade, 0));
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  // 5. the light from below: sunset's fire on the sun's side / the city's glow (soft, from the base up)
  if (Lt.uk > 0.02) {
    const ux = w * (0.5 + 0.55 * lx), ug = x.createRadialGradient(ux, sh.base + h * 0.25, 0, ux, sh.base + h * 0.25, Math.max(w * 0.8, h * 1.1));
    ug.addColorStop(0, rgba(Lt.under, Lt.uk)); ug.addColorStop(0.45, rgba(Lt.under, Lt.uk * 0.55)); ug.addColorStop(1, rgba(Lt.under, 0));
    x.fillStyle = ug; x.fillRect(0, 0, w, h);
    const bl = x.createLinearGradient(0, sh.base, 0, sh.base - h * 0.5);
    bl.addColorStop(0, rgba(mix(Lt.under, [255, 240, 210], 0.35), Lt.uk * 0.8)); bl.addColorStop(1, rgba(Lt.under, 0));
    x.fillStyle = bl; x.fillRect(0, 0, w, h);
  }
  // 6. the lobes' rims: a fine light line on the upper edge of every puff (the cauliflower reads), brightest toward the sun
  x.lineWidth = Math.max(0.5, h * 0.012);
  for (const [px, py, r] of P) {
    x.strokeStyle = rgba(mix(Lt.top, [255, 255, 255], 0.4), (0.24 - 0.12 * (Lt.ly || 0)) * Lt.body);
    x.beginPath(); x.arc(px, py, r * 0.93, Math.PI * (1.12 + 0.12 * lx), Math.PI * (1.88 + 0.12 * lx)); x.stroke();
  }
  x.globalCompositeOperation = 'source-over';
}
/** cirrus: long thin strands, a little curled at their ends (mares' tails), brightest in the middle */
function bakeCirrus(cv, d, Lt) {
  const { w, h } = d, x = ctx2d(cv), R = rngFrom(`ci|${d.seed}`);
  if (!x) return;
  x.setTransform(BAKE, 0, 0, BAKE, 0, 0); x.clearRect(0, 0, w, h);
  x.lineCap = 'round';
  const col = mix(Lt.top, Lt.under, Lt.uk * 0.8), n = 6 + Math.floor(R() * 5);
  for (let i = 0; i < n; i++) {
    const y0 = h * (0.2 + R() * 0.6), x0 = w * R() * 0.3, x1 = w * (0.6 + R() * 0.4), bend = (R() - 0.5) * h * 0.5, lw = 0.6 + R() * 2.2;
    const g = x.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.35, rgba(col, 0.42 + R() * 0.3)); g.addColorStop(0.75, rgba(col, 0.3)); g.addColorStop(1, rgba(col, 0));
    x.strokeStyle = g;
    for (const [k, a] of [[3.2, 0.25], [1.6, 0.5], [1, 1]]) {
      x.globalAlpha = a; x.lineWidth = lw * k;
      x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo((x0 + x1) / 2, y0 + bend, x1, y0 - bend * 0.4);
      // the curl at the end (the fall streak)
      x.quadraticCurveTo(x1 + w * 0.03, y0 - bend * 0.4 + h * 0.12, x1 - w * 0.02, y0 - bend * 0.4 + h * 0.22); x.stroke();
    }
  }
  x.globalAlpha = 1;
}
/** the overcast deck: a sheet across the whole sky band, thick above, its lumpy underside softly lit */
function bakeDeck(cv, d, Lt) {
  const { w, h } = d, x = ctx2d(cv), R = rngFrom(`deck|${d.seed}`);
  if (!x) return;
  x.setTransform(BAKE, 0, 0, BAKE, 0, 0); x.clearRect(0, 0, w, h);
  const edge = h * 0.78;
  x.fillStyle = '#000'; x.fillRect(0, 0, w, edge * 0.8);
  // (the underside: broad soft swells, never peaks — a ragged soft edge)
  // (the tile wraps: every soft shape is drawn at x and x ± w, so the copies side by side meet without a seam)
  const wrap = (cx, r, f) => { for (const ox of [-w, 0, w]) if (cx + ox + r > 0 && cx + ox - r < w) f(cx + ox); };
  for (let px = 0; px < w; px += h * (0.16 + R() * 0.1)) { const r = h * (0.12 + R() * 0.08); wrap(px, r, cx => { const g = x.createRadialGradient(cx, edge * 0.78, 0, cx, edge * 0.78, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, edge * 0.78 - r, r * 2, r * 2); }); }
  x.globalCompositeOperation = 'destination-out';
  const fe = x.createLinearGradient(0, edge * 0.62, 0, edge * 1.02); fe.addColorStop(0, 'rgba(0,0,0,0)'); fe.addColorStop(1, 'rgba(0,0,0,0.85)');
  x.fillStyle = fe; x.fillRect(0, edge * 0.62, w, h);
  x.globalCompositeOperation = 'source-atop';
  const g = x.createLinearGradient(0, 0, 0, edge);
  g.addColorStop(0, rgba(mix(Lt.shade, [60, 64, 80], 0.25))); g.addColorStop(0.7, rgba(Lt.shade)); g.addColorStop(1, rgba(mix(Lt.shade, Lt.top, 0.3)));
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // soft ripples of light and shade in the sheet (the texture of an overcast sky)
  for (let i = 0; i < 22; i++) { const cx0 = R() * w, cy = R() * edge, r = h * (0.1 + R() * 0.2), up = R() < 0.5; wrap(cx0, r, cx => { const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r); rg.addColorStop(0, rgba(up ? Lt.top : mix(Lt.shade, [30, 34, 50], 0.3), 0.16)); rg.addColorStop(1, rgba(Lt.top, 0)); x.fillStyle = rg; x.fillRect(cx - r, cy - r, r * 2, r * 2); }); }
  // (the light from below: an even band along the underside — a tile has no "sun side" of its own)
  if (Lt.uk > 0.02) {
    const ug = x.createLinearGradient(0, edge, 0, edge * 0.4);
    ug.addColorStop(0, rgba(Lt.under, Lt.uk * 0.7)); ug.addColorStop(1, rgba(Lt.under, 0)); x.fillStyle = ug; x.fillRect(0, 0, w, h);
  }
  x.globalCompositeOperation = 'source-over';
}

// ------------------------------------------------------------------ THE SKY'S CLOUDS
export function createClouds() {
  let W = 1, top = 0, roof = 200, HZ = 300, clouds = [], deck = null, seedKey = '', count = '', jobs = [], lightKey = '', Lt = null, born = 0;
  let extra = { grey: 0, dark: 0, base: 0 };              // (Part 9: set())
  let lastK = 0, lastDeck = 0;                            // (coverAt: what the last frame drew)
  const windX = LK => Math.sin(((LK.windDir == null ? 250 : LK.windDir)) * Math.PI / 180);
  function plan(LK, dayKey, tr) {
    const c = clamp01(LK.cloud || 0), R = rngFrom(`clouds|${dayKey}`), band = Math.max(40, roof - top - 24);
    // (the white SPEAKEASY word + the tagline never sit on a white cloud: a cloud that would span their band moves above it or
    // down behind the skyline)
    const wy0 = tr && tr.word ? tr.word.y - 6 : -1, wy1 = tr && tr.word ? (tr.tag ? tr.tag.y + tr.tag.h : tr.word.y + tr.word.h) + 4 : -1;
    const clear = d => { if (wy0 < 0) return; const t0 = d.y - d.h * 0.84; if (d.y > wy0 && t0 < wy1) { if (d.y - wy0 < wy1 - t0 && wy0 - d.h * 0.2 > top + d.h * 0.5) d.y = wy0; else d.y = Math.max(d.y, wy1 + d.h * 0.84 + 2); } };
    for (const d of clouds) if (d.cv) d.cv.width = 0;
    clouds = [];
    // the count + the size from the cover: a fair day 1–3 small cumulus, a cloudy one up to 9 big ones + low banks
    // (a wide screen: the same sizes, more of them across the panorama)
    const wide = Math.max(1, Math.min(2.6, W / 480));
    const nCu = Math.round((c < 0.05 ? 0 : c > 0.8 ? 3 : 1 + c * 7) * wide), nSt = Math.round((c > 0.45 ? (c - 0.35) * 6 : 0) * wide);
    const nCi = c < 0.7 && R() < 0.62 ? Math.round((1 + Math.floor(R() * 3)) * wide) : 0;
    const big = 0.75 + c * 0.6;
    for (let i = 0; i < nCu; i++) {
      const z = c > 0.8 ? R() * 0.4 : 0.15 + 0.85 * ((i + R() * 0.8) / nCu);   // 0: far (low, small, flat) … 1: near (high, big)
      const w = Math.min(230, Math.max(60, W * 0.34)) * (0.7 + z * 0.65) * big * (0.85 + R() * 0.3), h = w * (0.3 + 0.16 * z + R() * 0.1);
      const d = { kind: 'cumulus', seed: Math.floor(R() * 1e9), z, w, h, x: R() * (W + w) - w * 0.5, y: top + 18 + h * 0.8 + (band - h * 0.6) * (1 - z) * 0.95, a: 0.88 + 0.12 * R() };
      clear(d); clouds.push(d);
    }
    for (let i = 0; i < nSt; i++) {
      const z = R() * 0.5, w = Math.min(W, 560) * (0.7 + R() * 0.5), h = w * 0.13;
      const d = { kind: 'stratus', seed: Math.floor(R() * 1e9), z, w, h, x: R() * W - w * 0.3, y: top + band * (0.7 + R() * 0.25), a: 0.8 };
      clear(d); clouds.push(d);
    }
    for (let i = 0; i < nCi; i++) {
      const w = Math.min(W, 520) * (0.5 + R() * 0.5), h = w * 0.16;
      const d = { kind: 'cirrus', seed: Math.floor(R() * 1e9), z: 0.95, w, h, x: R() * W - w * 0.3, y: top + 10 + h + band * R() * 0.3, a: 0.5 + R() * 0.35 };
      clear(d); clouds.push(d);
    }
    clouds.sort((a, b) => a.z - b.z);
    for (const d of clouds) if (KINDS[d.kind]) d.shape = KINDS[d.kind](rngFrom(`sh|${d.seed}`), d.w, d.h);
    if (deck && deck.cv) deck.cv.width = 0;
    deck = c > 0.58 ? { kind: 'deck', seed: Math.floor(R() * 1e9), w: W * 1.6, h: top + band * 0.62, x: 0 } : null;
    lightKey = ''; born = 0;
  }
  function bake(d) {
    d.cv = canvasFor(d.cv, d.w, d.h);
    if (d.kind === 'cirrus') bakeCirrus(d.cv, d, Lt); else if (d.kind === 'deck') bakeDeck(d.cv, d, Lt); else bakePuffy(d.cv, d, Lt);
    d.lit = lightKey;
  }
  return {
    KINDS,
    /** W, the sky band: top (the safe top) .. roof (the skyline's median roof), HZ (the far quay's waterline) */
    resize(w, t, r, hz) { if (w !== W || Math.abs(r - roof) > 2 || t !== top) { W = w; top = t; roof = r; HZ = hz; seedKey = ''; } },
    /** Part 9: grey 0..1 (rain / snow skies), dark 0..1 (a storm), base (pt: a lower cloud base) — the next frame re-lights */
    set(o) { extra = { ...extra, ...o }; lightKey = ''; },
    draw(c, fs, sunX) {
      const LK = fs.L, dayKey = `${LK.local ? `${LK.local.y}-${LK.local.m}-${LK.local.d}-${Math.floor(LK.local.h / 6)}` : 'x'}`;
      const cover = clamp01(LK.cloud || 0), cnt = cover < 0.05 ? 0 : Math.round(1 + cover * 8) + (cover > 0.45 ? 10 : 0) + (cover > 0.58 ? 100 : 0);
      const tr = fs.textRects, wk = `${dayKey}|${tr && tr.word ? Math.round(tr.word.y) : '-'}`;
      if (seedKey !== wk || count !== cnt) { seedKey = wk; count = cnt; plan(LK, dayKey, tr); }
      if (!clouds.length && !deck) return;
      const party = fs.party && fs.party.on > 0.3 ? fs.party.on : 0;
      const L2 = cloudLight(LK, sunX, W, party, extra);
      if (L2.key !== lightKey) { Lt = L2; lightKey = L2.key; jobs = [...(deck ? [deck] : []), ...clouds]; }
      // (re-light a few a frame: the first time all at once while nothing shows yet)
      for (let i = 0, n = born ? 2 : 99; i < n && jobs.length; i++) bake(jobs.shift());
      if (!born && !jobs.length) born = performance.now();
      const appear = born ? smooth(0, 1800, performance.now() - born) : 0, sec = Math.min(0.1, (fs.dt || 16) / 1000);
      const drift = fs.motion ? (1.2 + (LK.wind || 3) * 0.9) * windX(LK) : 0;
      const k = appear * Lt.body * (0.55 + 0.45 * smooth(0.02, 0.35, cover));
      if (deck && deck.cv && deck.lit) {
        deck.x = (deck.x + drift * 0.2 * sec) % deck.w;
        const da = smooth(0.58, 0.92, cover) * appear * (0.5 + 0.5 * Lt.body);
        for (const ox of [deck.x - deck.w, deck.x, deck.x + deck.w]) if (ox < W && ox + deck.w > 0 && da > 0.01) { c.globalAlpha = da; c.drawImage(deck.cv, ox, -4, deck.w, deck.h); }
      }
      for (const d of clouds) {
        d.x += drift * (0.25 + 0.75 * d.z) * sec;
        if (d.x > W + d.w * 0.2) d.x = -d.w * 1.1; else if (d.x < -d.w * 1.2) d.x = W + d.w * 0.1;
        if (!d.cv || !d.lit) continue;
        c.globalAlpha = d.a * k * (0.75 + 0.25 * d.z); c.drawImage(d.cv, d.x, d.y - d.h * 0.84 + (extra.base || 0), d.w, d.h);
      }
      c.globalAlpha = 1;
      // the moon glowing through a cloud in front of it
      const m = fs.moonAt;
      if (m && (LK.w.night + LK.w.late) > 0.3) {
        let over = 0;
        for (const d of clouds) if (d.kind !== 'cirrus' && m.x > d.x + d.w * 0.12 && m.x < d.x + d.w * 0.88 && m.y > d.y - d.h * 0.6 && m.y < d.y) over = Math.max(over, d.a * appear);
        if (deck) over = Math.max(over, smooth(0.58, 0.92, cover) * appear * 0.8);
        if (over > 0.05) { const g = c.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 5); g.addColorStop(0, `rgba(200,205,235,${(0.3 * over * (LK.moon.illum || 0.5)).toFixed(3)})`); g.addColorStop(1, 'rgba(200,205,235,0)'); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(m.x - m.r * 5, m.y - m.r * 5, m.r * 10, m.r * 10); c.globalCompositeOperation = 'source-over'; }
      }
      lastK = k; lastDeck = deck ? smooth(0.58, 0.92, cover) * appear : 0;
    },
    /** how much cloud covers a point (0..1) — the sun glows through (district/sun.js#through) */
    coverAt(px, py) {
      let a = lastDeck && py < (deck ? deck.h * 0.7 : 0) ? lastDeck : 0;
      for (const d of clouds) if (d.kind !== 'cirrus' && px > d.x + d.w * 0.12 && px < d.x + d.w * 0.88 && py > d.y - d.h * 0.62 && py < d.y) a = Math.max(a, d.a * lastK);
      return a;
    },
    debug: () => ({ clouds: clouds.length, kinds: clouds.map(d => d.kind), deck: !!deck, lit: lightKey, pending: jobs.length, mb: [...clouds, ...(deck ? [deck] : [])].reduce((s, d) => s + (d.cv ? d.cv.width * d.cv.height * 4 / 1e6 : 0), 0) }),
    destroy() { for (const d of clouds) if (d.cv) d.cv.width = 0; if (deck && deck.cv) deck.cv.width = 0; clouds = []; deck = null; },
  };
}
