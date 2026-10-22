// CITY 2.0 — THE HARBOR, Part 5: THE FERRIS WHEEL (docs/harbor.md#the-wheel). A real steel wheel on its pier, turning slowly on
// the real clock (one turn in 150 s — every phone shows it at the same angle):
//
//   the steel (a sprite, rotated)   the rim (two rings + the zigzag truss between them), 16 pairs of tension spokes crossing
//                                   to the hub, an inner ring, the hub's plate + bolts — painted red steel by day, a dark
//                                   silhouette at night; the sun's side of the rim catches the light (drawn per frame: it must
//                                   not turn with the wheel)
//   the gondolas (16 sprites)        cabins that HANG LEVEL from their pivots on the rim and sway a little; painted by day,
//                                   their windows lit warm at night (a few empty and dark)
//   the bulbs (night; sprites)       48 on the rim (three chase sets), 64 on the spokes (four rings), a star round the hub:
//                                   PATTERNS on a 48 s show — steady, a chase round the rim, rings pulsing outward, a sparkle;
//                                   their colours from a SCHEME (city warm white; halloween, christmas, valentine, stpatrick,
//                                   july4, nye, party — the hooks for Parts 10 + 11a–c: harbor().wheel.scheme(name))
//   the A-frames                     the back one baked with the pier (pier.js#aFrame), the front one a sprite over the wheel
//   the light                        at night a warm haze round the wheel + its pool on the platform's deck
//   the reflection                   reflect(ctx): the same wheel, flipped by the water (water.reflect, the mirror's 10 a second)
//
// Tier 0 + reduced motion: the bulbs steady (no show); reduced motion also stills the wheel (it stands at its angle).
//
// NEON PASS 5 — THE WHEEL AS A SHOWPIECE (the owner: with the dark offices behind it, it can stand out much more): bigger,
// brighter bulbs, a wider soft halo round the rim, warm-lit gondolas, and its bulbs drawn ONE BY ONE into the 20-a-second cache
// (a colour + a level each — ~170 small draws 20 times a second, never per frame):
//   A NORMAL NIGHT   elegant + slow — a gentle colour wave travelling round the rim (gold, rose, ice in turn, ~14 s a lap), a
//                    slow sparkle, and every ~40 s a spiral running out from the hub along the spokes
//   A PARTY NIGHT    a light show on the beat in the party palette (core/harbor-show.js#PARTY_PAL, the city's colour scene),
//                    a new routine every 4 bars — a rainbow chase round the rim, the spokes lighting in sequence like a clock
//                    hand, spirals, bursts from the hub on the strong beats (and a big one on the drops); the whole wheel
//                    punching with the city. Smooth envelopes everywhere: one of the party's stars, never a strobe.
import { project } from '../../core/harbor-layout.js';
import { mix, rgb, shade, clamp01 } from './shapes.js';
import { PARTY_PAL } from '../../core/harbor-show.js';

const TURN_S = 150;                         // one turn (s)
// (NEON PASS 4 — A STRONGER WHEEL, the owner: the spokes read as LINES OF LIGHT — seven bulbs along each, the rim bolder, a
// glowing hub medallion; on a party night the spoke bulbs chase OUTWARD from the hub on every beat, in colour)
const CARS = 16, RIM_BULBS = 48, SPOKE_RINGS = [0.24, 0.35, 0.46, 0.57, 0.68, 0.79, 0.89], HUB_BULBS = 10, NR = SPOKE_RINGS.length;
const SHOW_S = 48;
// the bulbs' colours per scheme: rim sets A/B/C, the spoke rings 0..3, the hub
export const WHEEL_SCHEMES = {
  // (Part 6a, the owner's review: the city's own bulbs are a crisp near-white — the skyline's windows behind are warm tungsten, so
  // warm bulbs melted into them; a soft glow ring traces the rim: the wheel reads as the wheel, still elegant)
  city: { rim: [[255, 248, 236], [255, 248, 236], [246, 246, 255]], rings: [[255, 232, 196], [255, 244, 226], [255, 232, 196], [255, 248, 236]], hub: [255, 252, 246], ring: [232, 238, 255] },
  party: { rim: [[255, 70, 190], [70, 220, 255], [255, 214, 90]], rings: [[160, 90, 255], [255, 70, 190], [70, 220, 255], [120, 255, 160]], hub: [255, 255, 255] },
  halloween: { rim: [[255, 140, 30], [170, 70, 255], [255, 140, 30]], rings: [[170, 70, 255], [255, 140, 30], [170, 70, 255], [120, 255, 90]], hub: [255, 170, 60] },
  christmas: { rim: [[255, 60, 60], [80, 255, 120], [255, 236, 200]], rings: [[255, 236, 200], [255, 60, 60], [80, 255, 120], [255, 236, 200]], hub: [255, 214, 120] },
  valentine: { rim: [[255, 80, 130], [255, 170, 200], [255, 80, 130]], rings: [[255, 40, 90], [255, 140, 180], [255, 40, 90], [255, 200, 220]], hub: [255, 220, 230] },
  stpatrick: { rim: [[80, 255, 120], [200, 255, 170], [80, 255, 120]], rings: [[60, 220, 100], [255, 226, 170], [60, 220, 100], [200, 255, 170]], hub: [255, 226, 140] },
  july4: { rim: [[255, 60, 70], [255, 255, 255], [70, 120, 255]], rings: [[255, 60, 70], [255, 255, 255], [70, 120, 255], [255, 255, 255]], hub: [255, 255, 255] },
  nye: { rim: [[255, 214, 120], [230, 236, 255], [255, 214, 120]], rings: [[255, 214, 120], [230, 236, 255], [255, 214, 120], [230, 236, 255]], hub: [255, 255, 255] },
};
WHEEL_SCHEMES.thanksgiving = { rim: [[255, 170, 70], [255, 214, 150], [255, 140, 50]], rings: [[255, 140, 50], [255, 214, 150], [255, 170, 70], [255, 226, 170]], hub: [255, 214, 150] };
WHEEL_SCHEMES.easter = { rim: [[255, 190, 230], [190, 230, 255], [255, 246, 170]], rings: [[200, 255, 210], [255, 190, 230], [190, 230, 255], [255, 246, 170]], hub: [255, 255, 255] };

const DAY_CARS = [[196, 44, 52], [236, 226, 204], [38, 128, 140], [226, 168, 40]];

function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function glowDot(col) {
  const c = canvas(32, 32), x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgba(255,255,255,1)`); g.addColorStop(0.2, `rgba(${col},1)`); g.addColorStop(0.46, `rgba(${col},0.38)`); g.addColorStop(1, `rgba(${col},0)`);
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c;
}

export function createWheel() {
  let L = null, cam = null, dpr = 2, tier = 2;
  let cx = 0, cy = 0, r = 0, u = 1, deckY = 0, P = 0;               // the hub on screen, the rim's radius (pt), pt per unit, the sprite's half size
  let steel = null, bulbs = null, allBulbs = null, ring = null, cars = [], front = null, haze = null, pool = null, lookKey = '', schemeName = 'city', bulbKey = '';
  let mb = 0;
  const dots = new Map();
  const dot = col => { const k = col.join(','); if (!dots.has(k)) dots.set(k, glowDot(k)); return dots.get(k); };

  function layout(l, o) {
    L = l; cam = l.cam; dpr = Math.min(2, o.dpr || 1); tier = o.tier ?? 2;
    const w = L.wheel;
    [cx, cy] = project(cam, w.x, w.y, w.z); u = cam.F / w.z; r = w.r * u; deckY = project(cam, w.x, L.pier.y, w.z)[1];
    P = Math.ceil(r * 1.06 + 4);
    lookKey = ''; bulbKey = '';
  }

  // ---------------------------------------------------------------- the sprites (per look; the bulbs per scheme)
  function build(T) {
    const key = `${Math.round(T.day * 6)}${Math.round(T.gold * 6)}${Math.round(T.night * 6)}|${r.toFixed(1)}|${dpr}`;
    if (key === lookKey) return;
    lookKey = key;
    const day = clamp01(T.day + 0.7 * T.gold), night = T.night;
    // painted steel: red by day (deeper in the shade), plum at golden hour, a near-black silhouette at night (a cool sky rim)
    // (at night the steel catches its own bulbs: a warm-lit plum, so the structure reads between the lights)
    const paint = mix(mix([168, 40, 48], [150, 50, 66], T.gold / Math.max(0.01, T.day + T.gold)), [84, 50, 66], night);
    const dark = shade(paint, -0.35), pale = mix(paint, [255, 236, 226], 0.28 * day);
    const S = P * 2;
    steel = steel || canvas(1, 1); steel.width = steel.height = Math.ceil(S * dpr);
    const x = steel.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, P * dpr, P * dpr);
    x.lineCap = 'round';
    const lw = k => Math.max(0.3, r * k);
    // the tension spokes: 16 pairs from either side of the hub's plate, crossing to the rim (a fine lattice)
    // (thin rods: lighter than the struts, so the lattice reads as fine cables against the city behind)
    x.strokeStyle = rgb(mix(dark, pale, 0.25), 0.62 + 0.25 * night); x.lineWidth = lw(0.0052);
    x.beginPath();
    for (let i = 0; i < CARS; i++) {
      const a = (i / CARS) * Math.PI * 2;
      for (const s of [-1, 1]) {
        const ha = a + s * 0.5, ta = a - s * 0.045;
        x.moveTo(Math.cos(ha) * r * 0.075, Math.sin(ha) * r * 0.075); x.lineTo(Math.cos(ta) * r * 0.935, Math.sin(ta) * r * 0.935);
      }
    }
    x.stroke();
    // the radial struts (one per car: a heavier member to the rim) + the inner ring
    x.strokeStyle = rgb(paint); x.lineWidth = lw(0.011);
    x.beginPath(); for (let i = 0; i < CARS; i++) { const a = (i / CARS) * Math.PI * 2; x.moveTo(Math.cos(a) * r * 0.08, Math.sin(a) * r * 0.08); x.lineTo(Math.cos(a) * r * 0.935, Math.sin(a) * r * 0.935); } x.stroke();
    x.lineWidth = lw(0.009); x.beginPath(); x.arc(0, 0, r * 0.3, 0, Math.PI * 2); x.stroke();
    // THE RIM: two rings and the zigzag truss between them (the depth: the inner ring a shade darker)
    x.strokeStyle = rgb(dark); x.lineWidth = lw(0.012); x.beginPath(); x.arc(0, 0, r * 0.935, 0, Math.PI * 2); x.stroke();
    x.strokeStyle = rgb(paint, 0.95); x.lineWidth = lw(0.0075);
    x.beginPath();
    const NZ = 64;
    for (let i = 0; i <= NZ; i++) { const a = (i / NZ) * Math.PI * 2, rr = i % 2 ? r * 0.94 : r; const px = Math.cos(a) * rr, py = Math.sin(a) * rr; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
    x.stroke();
    x.strokeStyle = rgb(paint); x.lineWidth = lw(0.016); x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke();
    // the hub: a plate, its ring of bolts, the axle's cap
    x.fillStyle = rgb(dark); x.beginPath(); x.arc(0, 0, r * 0.085, 0, Math.PI * 2); x.fill();
    x.strokeStyle = rgb(paint); x.lineWidth = lw(0.012); x.stroke();
    x.fillStyle = rgb(pale); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.beginPath(); x.arc(Math.cos(a) * r * 0.058, Math.sin(a) * r * 0.058, Math.max(0.25, r * 0.007), 0, Math.PI * 2); x.fill(); }
    // the gondolas (4 paint colours by day; lit or dark windows at night)
    cars.forEach(cv => { cv.width = 0; });
    cars = [];
    const cw = 1.3 * u, ch = 1.55 * u, hang = 0.5 * u;
    for (let n = 0; n < 6; n++) {
      const lit = n >= 4 ? 0 : 1, colIdx = n % 4;
      const body = mix(DAY_CARS[colIdx], lit ? [70, 46, 40] : [24, 20, 34], night * 0.88), roofC = shade(body, -0.25), win = night > 0.3 ? (lit ? [255, 222, 160] : [16, 14, 24]) : mix([60, 80, 100], [150, 186, 210], day * 0.6);
      const W = cw + 4, H = ch + hang + 4, cv = canvas(W * dpr, H * dpr), g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, (W / 2) * dpr, 2 * dpr);
      // the hanger (from the pivot at 0,0), the roof (a little dome + its rim), the cabin, the window band, the floor
      g.strokeStyle = rgb(dark); g.lineWidth = Math.max(0.35, u * 0.08);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, hang); g.stroke();
      g.fillStyle = rgb(roofC); g.beginPath(); g.ellipse(0, hang + ch * 0.1, cw * 0.56, ch * 0.16, 0, Math.PI, 0); g.fill();
      g.fillRect(-cw * 0.58, hang + ch * 0.08, cw * 1.16, ch * 0.08);
      g.fillStyle = rgb(body); g.beginPath(); g.roundRect(-cw / 2, hang + ch * 0.15, cw, ch * 0.8, [cw * 0.08, cw * 0.08, cw * 0.28, cw * 0.28]); g.fill();
      g.fillStyle = rgb(win); g.fillRect(-cw * 0.4, hang + ch * 0.26, cw * 0.8, ch * 0.32);
      if (night > 0.3 && lit) { const gg = g.createRadialGradient(0, hang + ch * 0.42, 0, 0, hang + ch * 0.42, cw * 1.05); gg.addColorStop(0, 'rgba(255,214,150,0.62)'); gg.addColorStop(0.5, 'rgba(255,190,110,0.22)'); gg.addColorStop(1, 'rgba(255,190,110,0)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = gg; g.fillRect(-cw * 1.1, hang - ch * 0.1, cw * 2.2, ch * 1.2); g.globalCompositeOperation = 'source-over'; }
      g.fillStyle = rgb(shade(body, -0.3)); g.fillRect(-cw * 0.4, hang + ch * 0.42, cw * 0.8, Math.max(0.3, ch * 0.04));      // the window's mullion
      for (const s of [-1, 1]) g.fillRect(s * cw * 0.14 - 0.15, hang + ch * 0.26, 0.3, ch * 0.32);
      if (day > 0.2) { g.fillStyle = `rgba(255,248,232,${0.35 * day})`; g.fillRect(-cw / 2 + 0.2, hang + ch * 0.17, Math.max(0.3, cw * 0.1), ch * 0.7); }
      cars.push(cv);
    }
    // the front A-frame (+ the axle): two lattice legs from the hub to the deck, a cross beam
    front = front || canvas(1, 1);
    const fz = L.wheel.z - L.wheel.frame, fu = cam.F / fz, [fx, fy] = project(cam, L.wheel.x, L.wheel.y, fz), [, fd] = project(cam, L.wheel.x, L.pier.y, fz);
    const legX = L.wheel.leg * L.wheel.r * fu, FW = legX * 2 + 8, FH = fd - fy + 6;
    front.width = Math.ceil(FW * dpr); front.height = Math.ceil(FH * dpr); front.ox = fx - FW / 2; front.oy = fy - 3; front.w = FW; front.h = FH;
    { const fc = front.getContext('2d'); fc.setTransform(dpr, 0, 0, dpr, 0, 0); aFrame(fc, FW / 2, 3, legX, fd - fy, fu, paint, dark, pale, true); }
    mb = ((steel.width * steel.height) + cars.reduce((s, c) => s + c.width * c.height, 0) + front.width * front.height) * 4 / 1e6;
  }
  function buildBulbs() {
    const sc = WHEEL_SCHEMES[schemeName] || WHEEL_SCHEMES.city, key = `${schemeName}|${r.toFixed(1)}|${dpr}`;
    if (key === bulbKey && bulbs) return;
    bulbKey = key;
    if (bulbs) for (const b of bulbs) b.width = 0;
    const S = P * 2, br = BR();
    const mk = (pts) => { const cv = canvas(S * dpr, S * dpr), x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, P * dpr, P * dpr); x.globalCompositeOperation = 'lighter'; for (const [px, py, col, k] of pts) { const rr = br * (k || 1); x.drawImage(dot(col), px - rr, py - rr, rr * 2, rr * 2); } return cv; };
    bulbs = [];
    for (let s = 0; s < 3; s++) { const pts = []; for (let i = s; i < RIM_BULBS; i += 3) { const a = (i / RIM_BULBS) * Math.PI * 2; pts.push([Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97, sc.rim[s]]); } bulbs.push(mk(pts)); }
    SPOKE_RINGS.forEach((f, j) => { const pts = [], col = sc.rings[Math.round(j * (sc.rings.length - 1) / (NR - 1))]; for (let i = 0; i < CARS; i++) { const a = (i / CARS) * Math.PI * 2; pts.push([Math.cos(a) * r * f, Math.sin(a) * r * f, col, 0.72]); } bulbs.push(mk(pts)); });
    { const pts = []; for (let i = 0; i < HUB_BULBS; i++) { const a = (i / HUB_BULBS) * Math.PI * 2; pts.push([Math.cos(a) * r * 0.13, Math.sin(a) * r * 0.13, sc.hub, 0.75]); } pts.push([0, 0, sc.hub, 1.5]); bulbs.push(mk(pts)); }
    // NEON PASS 3 (the owner: the wheel must be SEE-THROUGH — it reads by its own light): the struts FAINTLY LIT by their bulbs (a
    // fine soft line hub → rim, turning with the wheel) — the city's windows show between them
    { const x = bulbs[bulbs.length - 1].getContext('2d'), sc2 = sc.ring || sc.hub;
      x.setTransform(dpr, 0, 0, dpr, P * dpr, P * dpr); x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
      for (const [w, a] of [[Math.max(0.9, r * 0.024), 0.09], [Math.max(0.4, r * 0.007), 0.36]]) {
        x.strokeStyle = `rgba(${sc2},${a})`; x.lineWidth = w; x.beginPath();
        for (let i = 0; i < CARS; i++) { const an = (i / CARS) * Math.PI * 2; x.moveTo(Math.cos(an) * r * 0.16, Math.sin(an) * r * 0.16); x.lineTo(Math.cos(an) * r * 0.93, Math.sin(an) * r * 0.93); }
        x.stroke();
      } }
    // THE RIM'S GLOW RING (Part 6a): a soft wide halo + a fine bright line along the rim — the circle reads against the lit skyline
    // (not rotated: drawn under the bulbs every frame the bulbs are)
    { const rc = sc.ring || sc.rim[0].map(v => Math.min(255, v + 30));
      ring = ring || canvas(1, 1); ring.width = ring.height = Math.ceil(S * dpr);
      const x = ring.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, P * dpr, P * dpr); x.globalCompositeOperation = 'lighter';
      for (const [w, a] of [[r * 0.26, 0.045], [r * 0.14, 0.08], [r * 0.065, 0.14], [Math.max(1.1, r * 0.026), 0.34], [Math.max(0.6, r * 0.009), 0.8]]) { x.strokeStyle = `rgba(${rc},${a})`; x.lineWidth = w; x.beginPath(); x.arc(0, 0, r * 0.97, 0, Math.PI * 2); x.stroke(); }
      // THE HUB MEDALLION: a glowing disc + two bright rings round the axle
      { const hc = sc.hub, g = x.createRadialGradient(0, 0, 0, 0, 0, r * 0.2); g.addColorStop(0, `rgba(${hc},0.55)`); g.addColorStop(0.45, `rgba(${hc},0.22)`); g.addColorStop(1, `rgba(${hc},0)`); x.fillStyle = g; x.beginPath(); x.arc(0, 0, r * 0.2, 0, Math.PI * 2); x.fill();
        for (const [rr, w, a] of [[0.165, Math.max(0.6, r * 0.01), 0.7], [0.1, Math.max(0.5, r * 0.007), 0.6]]) { x.strokeStyle = `rgba(${hc},${a})`; x.lineWidth = w; x.beginPath(); x.arc(0, 0, r * rr, 0, Math.PI * 2); x.stroke(); } }
      x.lineWidth = Math.max(0.35, r * 0.004); x.strokeStyle = `rgba(${rc},0.28)`; x.beginPath(); x.arc(0, 0, r * 0.3, 0, Math.PI * 2); x.stroke(); }
    // every set at once (the show's steady phase — most of the time — and tier 0: one draw instead of eight)
    allBulbs = allBulbs || canvas(1, 1); allBulbs.width = bulbs[0].width; allBulbs.height = bulbs[0].height;
    { const x = allBulbs.getContext('2d'); x.globalCompositeOperation = 'lighter'; for (const b of bulbs) x.drawImage(b, 0, 0); }
    // the haze the bulbs throw: a RING round the rim (NEON PASS 3) — clear inside, so the wheel never reads as a lit disc
    if (!haze) { haze = canvas(64, 64); const x = haze.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,236,214,0)'); g.addColorStop(0.5, 'rgba(240,232,236,0.05)'); g.addColorStop(0.66, 'rgba(240,232,236,0.42)'); g.addColorStop(0.8, 'rgba(236,226,232,0.12)'); g.addColorStop(1, 'rgba(220,220,240,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
    if (!pool) { pool = canvas(64, 64); const x = pool.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,236,214,0.55)'); g.addColorStop(0.5, 'rgba(236,226,232,0.16)'); g.addColorStop(1, 'rgba(220,220,240,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }
  }

  const BR = () => Math.max(2.1, r * 0.058);                        // (NEON PASS 5: a little bigger bulbs)
  // ---------------------------------------------------------------- THE BULBS, one by one (NEON PASS 5): a level + a colour each
  const TINTS = [[255, 206, 120], [255, 150, 190], [170, 214, 255]];  // a normal night's wave: gold, rose, ice in turn
  const q6 = (a, b, k) => mix(a, b, Math.round(clamp01(k) * 6) / 6).map(Math.round);     // (colours on 1/6 steps: few glow sprites)
  const hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const ring01 = v => v - Math.floor(v);
  const angD = (a, b) => { const d = Math.abs(ring01(a) - ring01(b)); return Math.min(d, 1 - d); };
  const bell = (d, w) => { const v = Math.max(0, 1 - d / w); return v * v * (3 - 2 * v); };
  function bulb(c, x, y, rr, col, k) {
    if (k <= 0.05) return;
    const D = dot(col), R2 = rr * (0.85 + 0.25 * Math.min(1.6, k));
    c.globalAlpha = Math.min(1, k); c.drawImage(D, x - R2, y - R2, R2 * 2, R2 * 2);
    if (k > 1.15) { c.globalAlpha = Math.min(1, k - 1); c.drawImage(D, x - R2 * 1.25, y - R2 * 1.25, R2 * 2.5, R2 * 2.5); }   // (the brightest: a wider bloom)
  }
  function drawBulbs(c, f, lights) {
    const sc = WHEEL_SCHEMES[schemeName] || WHEEL_SCHEMES.city, t = f.t, br = BR();
    const P2 = f.party, party = !!(P2 && P2.ramp > 0.3 && schemeName === 'party');
    const pk = party ? P2.punch || 0 : 0, bF = party ? P2.beatsF || 0 : 0, bar = party ? P2.bar || 0 : 0, cn = f.cn || 0, drop = party ? f.drop || 0 : 0;
    const whole = lights * (party ? 0.82 + 0.45 * pk : 1);
    const PAL = i => PARTY_PAL[((i % 7) + 7) % 7];
    const mode = party ? Math.floor(bar / 4) % 4 : -1;
    // (the perf pass: a normal night is the baked bulbs at their steady level + only the bulbs that differ drawn over them)
    const base = !party && allBulbs ? 0.84 : 0;
    if (base) { c.globalAlpha = Math.min(1, whole * base); c.drawImage(allBulbs, -P, -P, P * 2, P * 2); }
    // ---- the rim (48)
    for (let i = 0; i < RIM_BULBS; i++) {
      const u = i / RIM_BULBS, an = u * Math.PI * 2, x = Math.cos(an) * r * 0.97, y = Math.sin(an) * r * 0.97;
      let k, col;
      if (party) {
        if (mode === 0 || mode === 2) {
          // THE RAINBOW CHASE: the palette round the rim, rolling a step every beat; every third bulb leads, stepping on the beat
          col = PAL(Math.floor(u * 7 + bF * 0.5) + cn * 2);
          const lead = ((i + Math.floor(bF * 2)) % 3 + 3) % 3 === 0;
          k = lead ? 1.25 : 0.5;
        } else {
          // the rim in the scene's two colours, a soft wave following the clock hand / the bursts
          col = PAL(cn * 2 + (i % 2 ? 3 : 0));
          k = 0.62 + 0.6 * bell(angD(u, bF / 16), 0.12);
        }
      } else {
        // A NORMAL NIGHT: warm white, a gentle colour wave travelling round (one lap ~14 s), a slow sparkle
        const bc = sc.rim[i % 3], lap = t / 14, w = schemeName === 'city' ? bell(angD(u, lap), 0.16) : 0;
        col = w > 0.02 ? q6(bc, TINTS[Math.floor(lap) % 3], 0.9 * w) : bc;
        k = 0.28 * w;                                           // (over the base: the wave's tint)
        const sl = Math.floor(t * 2.2), sp = hsh(i, sl);
        if (sp < 0.05) k += 0.55 * Math.sin(Math.PI * (t * 2.2 - sl));
        if (!base) k += 0.84;
      }
      bulb(c, x, y, br, col, k * whole);
    }
    // ---- the spokes (16 × 7) and the hub
    const spiralAt = (t % 40) / 6;                                   // (a normal night: a spiral out from the hub every ~40 s, 6 s long)
    for (let i = 0; i < CARS; i++) {
      const an = (i / CARS) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an);
      for (let j = 0; j < NR; j++) {
        const f2 = SPOKE_RINGS[j], x = cs * r * f2, y = sn * r * f2;
        let k, col;
        if (party) {
          if (mode === 1) {
            // THE CLOCK HAND: one spoke a beat, lighting hub → rim, the last three fading behind it
            const d = ring01((bF - i) / 16) * 16;
            k = 0.32 + 1.1 * Math.max(0, 1 - d / 3.2) * (0.7 + 0.3 * bell(Math.abs((bF % 1) * (NR + 1) - j), 2.4));
            col = PAL(cn * 2 + Math.floor(i / 4));
          } else if (mode === 2) {
            // THE SPIRAL: out from the hub, round and round, a turn a bar
            const sPos = ring01((bF / 4) - (j / NR) * 0.5);
            k = 0.32 + 1.0 * bell(angD(i / CARS, sPos), 0.09);
            col = PAL(cn * 2 + j);
          } else {
            // BURSTS from the hub on the strong beats (beats 1 + 3): a ring of light running out to the rim
            const pos = ((bF % 2) / 2) * (NR + 2) - 0.5;
            k = 0.35 + 1.05 * bell(Math.abs(j - pos), 1.4) * (mode === 3 ? 1 : 0.6);
            col = PAL(cn * 2 + 3 + (j % 2));
          }
          if (drop > 0.2) k = Math.max(k, 1.2 * drop * bell(Math.abs(j - (1 - drop) * NR), 2.5));   // (a drop: a big burst out from the hub)
        } else {
          col = sc.rings[Math.round(j * (sc.rings.length - 1) / (NR - 1))];
          k = base ? 0 : 0.68;
          const sp = spiralAt < 1 ? ring01(spiralAt * 1.6 - (j / NR) * 0.45) : -1;
          if (sp >= 0) { const e = bell(angD(i / CARS, sp), 0.075) * Math.sin(Math.PI * Math.min(1, spiralAt)); k += 0.85 * e; if (e > 0.05 && schemeName === 'city') col = q6(col, TINTS[Math.floor(t / 40) % 3], 0.7 * e); }
        }
        bulb(c, x, y, br * 0.86, col, k * whole);
      }
    }
    const hc = party ? PAL(cn * 2 + 5) : sc.hub, hk = (party ? 0.9 + 0.7 * pk : 1) * whole;
    if (!base) { for (let i = 0; i < HUB_BULBS; i++) { const an = (i / HUB_BULBS) * Math.PI * 2; bulb(c, Math.cos(an) * r * 0.13, Math.sin(an) * r * 0.13, br * 0.8, hc, hk); } bulb(c, 0, 0, br * 1.5, hc, hk); }
    c.globalAlpha = 1;
  }
  // ---------------------------------------------------------------- the show: each bulb set's brightness at t (s)
  function show(t, f) {
    const k = new Array(3 + NR + 1).fill(1);
    k.steady = true;
    if (!f.motion || tier === 0) return k;
    k.steady = false;
    const party = f.party ? f.party.ramp : 0;
    const len = party > 0.3 ? SHOW_S * 0.5 : SHOW_S, ph = (t % len) / len;
    // (NEON PASS 3: at the party's peak the wheel's SPARKLE joins on the show's bars — a soft shimmer of the rim sets, never a strobe)
    // NEON PASS 4 — THE PARTY: the spoke bulbs CHASE OUTWARD from the hub on every beat (a wave hub → rim), the rim sets step round
    // on the beat, the whole wheel punching with it
    if (party > 0.3 && f.party && f.party.beatU != null) {
      const u = f.party.beatU, pos = u * (NR + 1.5) - 0.5, pk = f.party.punch || 0, step = (f.party.beats || 0) % 3;
      for (let j = 0; j < NR; j++) { const d = Math.abs(j - pos); k[3 + j] = 0.48 + 0.85 * Math.max(0, 1 - d / 1.6); }
      for (let s = 0; s < 3; s++) k[s] = (s === step ? 1.15 : 0.55) + 0.45 * pk;
      k[3 + NR] = 0.8 + 0.6 * pk;
      if (f.sparkle > 0) for (let s = 0; s < 3; s++) k[s] *= 0.75 + 0.25 * (0.5 + 0.5 * Math.sin(t * 7 + s * 2.1));
      return k;
    }
    if (f.sparkle > 0) { for (let s = 0; s < 3; s++) k[s] = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 7 + s * 2.1)); for (let j = 0; j < NR; j++) k[3 + j] = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 4 - j * 1.3)); return k; }
    const twinkle = i => 0.9 + 0.1 * Math.sin(t * 1.7 + i * 2.1);
    for (let i = 0; i < k.length; i++) k[i] = twinkle(i);
    const fade = (a, b) => clamp01(Math.min((ph - a) * len / 1.2, (b - ph) * len / 1.2));
    // 0.58–0.75: the chase round the rim (one set of three lit, the others low)
    const ch = fade(0.58, 0.75);
    if (ch > 0) { const step = Math.floor(t / (party > 0.3 ? 0.1 : 0.16)) % 3; for (let s = 0; s < 3; s++) k[s] = k[s] * (1 - ch) + ch * (s === step ? 1 : 0.16); }
    // 0.75–0.92: the rings pulse outward from the hub
    const rd = fade(0.75, 0.92);
    if (rd > 0) for (let j = 0; j < NR; j++) { const p = 0.2 + 0.8 * Math.pow(Math.max(0, Math.cos(Math.PI * 2 * (t * 0.9 - j / NR))), 3); k[3 + j] = k[3 + j] * (1 - rd) + rd * p; }
    // 0.92–1: a sparkle — the rim sets flicker against each other, fast
    const sp = fade(0.92, 1.0);
    if (sp > 0) for (let s = 0; s < 3; s++) k[s] = k[s] * (1 - sp) + sp * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 9 + s * 2.4)));   // (soft: never a hard strobe)
    return k;
  }

  /** the wheel's angle at the clock's ms (reduced motion: still) */
  const angleAt = (ms, motion) => (motion ? ((ms / 1000) % TURN_S) / TURN_S * Math.PI * 2 : 0.1);

  /** draw the wheel (the turning steel, the gondolas, the bulbs, the front A-frame) into c — the frame or the water's mirror */
  function paint(c, f, mirror) {
    const a = angleAt(f.ms, f.motion);
    c.save();
    c.translate(cx, cy);
    c.save(); c.rotate(a); c.drawImage(steel, -P, -P, P * 2, P * 2); c.restore();
    // the sun's side of the rim catches the light (by day / golden hour: an arc on that side — it never turns with the wheel)
    const day = clamp01(f.T.day + 0.8 * f.T.gold);
    if (day > 0.05 && !mirror) {
      const sa = f.sunDir > 0 ? 0 : f.sunDir < 0 ? Math.PI : -Math.PI / 2;
      c.strokeStyle = `rgba(255,236,214,${0.55 * day})`; c.lineWidth = Math.max(0.5, r * 0.012);
      c.beginPath(); c.arc(0, 0, r + r * 0.004, sa - 1.1, sa + 1.1); c.stroke();
    }
    // the gondolas: from their pivots on the rim, hanging level, a little sway (each its own phase)
    for (let i = 0; i < CARS; i++) {
      const ai = a + (i / CARS) * Math.PI * 2, px = Math.cos(ai) * r * 1.0, py = Math.sin(ai) * r * 1.0;
      const sw = f.motion ? 0.07 * Math.sin(f.t * 0.85 + i * 1.7) + 0.03 * Math.sin(f.t * 2.1 + i) : 0;
      const cv = cars[f.T.night > 0.3 ? (i % 8 === 5 ? 4 + (i % 2) : i % 4) : i % 4];     // (NEON PASS 5: 2 of 16 dark, the rest warm-lit)
      const W = cv.width / dpr, H = cv.height / dpr;
      c.save(); c.translate(px, py); if (sw) c.rotate(sw); c.drawImage(cv, -W / 2, -2, W, H); c.restore();
    }
    // the bulbs (night, with the city's power)
    if (f.lights > 0.01 && bulbs) {
      const k = show(f.t, f);
      c.globalCompositeOperation = 'lighter';
      if (ring) { c.globalAlpha = Math.min(1, f.lights); c.drawImage(ring, -P, -P, P * 2, P * 2); }
      c.save(); c.rotate(a);
      // (NEON PASS 5: the show bulb by bulb — tier 1–2 with motion; the baked sets for tier 0 + reduced motion: one still image)
      if (!k.steady) drawBulbs(c, f, Math.min(1.1, f.lights * 1.05));
      else if (allBulbs) { c.globalAlpha = Math.min(1, f.lights); c.drawImage(allBulbs, -P, -P, P * 2, P * 2); }
      c.restore();
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    c.restore();
  }
  // THE CACHE (Part 5's perf pass): the wheel turns 2.4° a second — so the turning steel, the gondolas and the bulbs are drawn
  // into one screen-aligned image 20 times a second (10 on the lower tiers; the rim moves ≤ 0.25 pt a step — invisible) and every
  // frame draws just that image (+ the front A-frame); the water's mirror reuses it
  let cache = null, cacheAt = -1e9, cacheKey = '', CP = 0;
  function refresh(f) {
    const now = performance.now(), key = `${lookKey}|${bulbKey}|${Math.round(f.lights * 40)}|${f.motion ? 1 : 0}|${f.sparkle > 0 ? 1 : 0}`;
    // (NEON PASS 5: a party night's wheel refreshes 30 times a second at tier 2 — the beat's chases need it; else 20)
    const every = !f.motion ? 1e9 : tier === 2 ? (f.party && f.party.ramp > 0.3 ? 33 : 50) : tier === 1 ? 100 : 250;          // (tier 0, the calm city: 4 a second)
    if (cache && key === cacheKey && now - cacheAt < every) return;
    cacheAt = now; cacheKey = key;
    CP = Math.ceil(r * 1.22 + 6);
    if (!cache) cache = canvas(1, 1);
    const S = Math.ceil(CP * 2 * dpr);
    if (cache.width !== S || cache.height !== S) { cache.width = S; cache.height = S; }
    const x = cache.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, S, S);
    x.setTransform(dpr, 0, 0, dpr, (CP - cx) * dpr, (CP - cy) * dpr);
    paint(x, f, false);
  }
  const blit = c => { c.drawImage(cache, cx - CP, cy - CP, CP * 2, CP * 2); c.drawImage(front, front.ox, front.oy, front.w, front.h); };

  return {
    layout,
    /** f: { t (s), ms (the clock), T (tones), sunDir, lights (0..1: night × the city's power), fade, motion, party } */
    draw(c, f) {
      if (!L || f.fade <= 0) return;
      build(f.T); buildBulbs();
      c.save(); c.globalAlpha = f.fade;
      // the warm haze the bulbs throw into the night air + their pool on the platform's deck (under the wheel)
      if (f.lights > 0.01) {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = f.fade * f.lights * 0.3; c.drawImage(haze, cx - r * 1.5, cy - r * 1.5, r * 3, r * 3);
        c.globalAlpha = f.fade * f.lights * 0.5; c.drawImage(pool, cx - r * 0.75, deckY - r * 0.16, r * 1.5, r * 0.32);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = f.fade;
      }
      refresh(f);
      blit(c);
      c.restore();
    },
    /** the wheel as the water mirrors it (water.reflect: the context is already flipped about the wheel's waterline) */
    reflect(c, f) { if (!L || !cache || f.fade <= 0) return; c.save(); c.globalAlpha = f.fade; blit(c); c.restore(); },
    /** HOOK (Parts 10, 11a–c): the bulbs' colours — a name in WHEEL_SCHEMES ('city' = the warm white of every night) */
    scheme(name) { if (WHEEL_SCHEMES[name] && name !== schemeName) { schemeName = name; bulbKey = ''; } return schemeName; },
    setTier(t) { tier = t; },
    /** a tap on the wheel? (Part 12's egg: a gondola rocks) */
    hit: (x, y) => Math.hypot(x - cx, y - cy) < r * 1.05,
    debug: () => ({ x: cx, y: cy, r, scheme: schemeName, mb: +(mb + (bulbs ? bulbs.reduce((s, b) => s + b.width * b.height * 4, 0) / 1e6 : 0) + (cache ? cache.width * cache.height * 4 / 1e6 : 0)).toFixed(2) }),
    destroy() { for (const cv of [steel, front, haze, pool, cache, allBulbs, ring, ...cars, ...(bulbs || []), ...dots.values()]) if (cv) { cv.width = 0; cv.height = 0; } dots.clear(); L = null; },
  };
}

/** an A-frame (two lattice legs from the hub down to the deck, a cross beam, the axle's bearing): the hub at (hx, hy), the
 *  feet at (hx ± legX, hy + h) — screen pt in x's current transform. Shared with the back frame (pier.js, baked). */
export function aFrame(x, hx, hy, legX, h, u, paint, dark, pale, axle) {
  x.lineCap = 'round';
  const rail = Math.max(0.45, u * 0.13), cw = u * 0.42;
  for (const s of [-1, 1]) {
    const fx = hx + s * legX, fy = hy + h;
    // two rails + the lacing between them (a lattice leg), the foot's plate
    x.strokeStyle = rgb(paint); x.lineWidth = rail;
    x.beginPath(); x.moveTo(hx + s * cw * 0.3, hy); x.lineTo(fx - s * cw * 0.5, fy); x.moveTo(hx + s * cw * 0.9, hy + cw * 0.3); x.lineTo(fx + s * cw * 0.5, fy); x.stroke();
    x.strokeStyle = rgb(dark); x.lineWidth = Math.max(0.3, rail * 0.5);
    x.beginPath();
    const n = Math.max(4, Math.round(h / (cw * 2.2)));
    for (let i = 0; i < n; i++) {
      const a = i / n, b = (i + 1) / n;
      const ax = hx + s * cw * 0.6 + (fx - hx - s * cw * 0.6) * a, ay = hy + h * a, bx = hx + s * cw * 0.6 + (fx - hx - s * cw * 0.6) * b, by = hy + h * b;
      const wa = cw * (0.3 + 0.7 * a) * 0.5, wb = cw * (0.3 + 0.7 * b) * 0.5;
      x.moveTo(ax - wa * (i % 2 ? 1 : -1), ay); x.lineTo(bx + wb * (i % 2 ? 1 : -1), by);
    }
    x.stroke();
    x.fillStyle = rgb(dark); x.fillRect(fx - cw * 0.9, fy - Math.max(0.6, u * 0.18), cw * 1.8, Math.max(0.6, u * 0.18));
  }
  // the cross beam (a third of the way up from the deck) and the bearing at the hub
  const by = hy + h * 0.68, bx = legX * 0.68;
  x.strokeStyle = rgb(paint); x.lineWidth = Math.max(0.4, rail * 0.85);
  x.beginPath(); x.moveTo(hx - bx, by); x.lineTo(hx + bx, by); x.stroke();
  if (axle) {
    x.fillStyle = rgb(dark); x.beginPath(); x.arc(hx, hy, Math.max(1, u * 0.42), 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(pale); x.beginPath(); x.arc(hx - u * 0.1, hy - u * 0.1, Math.max(0.4, u * 0.16), 0, Math.PI * 2); x.fill();
  }
}
