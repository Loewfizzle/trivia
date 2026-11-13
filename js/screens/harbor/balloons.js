// CITY 2.0 — THE HARBOR, Part 6a: HOT AIR BALLOONS (docs/harbor/passes/part-6a.md; re-rendered PREMIUM in 6b). On calm, clear mornings and
// summer evenings (only when the real wind is low: core/harbor-sky.js#balloonWeather + #balloonTime) a crafted balloon drifts slowly
// across THE WHOLE SKY (6b: from under the corner buttons down to the crowns, behind the NEON sign, in front of the sun + the moon;
// nearer = bigger + lower) — rarely a FESTIVAL of several spread over it at different heights + distances.
//   6b PREMIUM     each GORE puffed between its load tapes (its own fabric shading), a soft highlight on the sun's side, the dark MOUTH
//                  you see into from below (the flame inside it on a burn), the skirt, the cables, two tiny passengers over the rim;
//                  THE BURNER's flare lights the whole envelope from inside (brightest by the mouth), the basket + the air round it
//   THE SPECIALS   (sometimes in a normal flight, always at the festival) THE TWO ₿ BALLOONS, THE OPPOSITES at every hour (PERF-A — the
//                  owner, Nov 1): 'bitcoin' all BLACK with a big ORANGE ₿ (at night still black, the ₿ glowing orange from inside) +
//                  'btc-orange' all ORANGE with a BLACK ₿ (lit orange from inside at night) — never neighbours at the festival (apartSpots);
//                  a nod, never explained · THE ALIEN HEAD — a special-shape grey
//                  alien in green, big glossy black almond eyes, seamed fabric, the basket under its chin
//   THE ENVELOPE   a teardrop of 12 gores: the stripes narrow toward its edges as they turn away (a sphere, not a flat
//                  pattern), the load tapes on the seams, the crown's vent cap, the darker skirt; shaded as a sphere toward
//                  the REAL sun's side (morning: the east, our left), a rim of sky light on the other
//   THE BASKET     wicker (a weave + a leather rim), the burner frame, the cables up to the skirt
//   THE BURNER     every 8–20 s a burn of a few pulses: a yellow-white flame up into the mouth — and at dusk the envelope LIGHTS
//                  FROM INSIDE like a lantern (its own stripes glowing, brightest by the mouth)
//   THE DISCO BALL (PERF-B — the owner, Nov 1: the festival's 7th, "make it VERY HIGH QUALITY") — a mirror-ball envelope: real TILES on
//                  the sphere (rows narrowing to the poles, the gores' meridians), each reflecting what it faces — by day the sky above +
//                  the warm city below + the sun's glints, at night the night sky + the city's neon; a handful of twinkling glints that
//                  slide with its slow turn (THE TIER TABLE's discoGlints); the burner's warm flash in the lower tiles
//   THE WHOLE SKY  (PERF-B — the owner, Nov 1: "put them HIGHER … they can go up IN FRONT OF THE NEON SIGN … drift up ABOVE it"): heights
//                  spread from just over the roofs past the sign to under the corner buttons, never a row; BY DEPTH — the far / small ones
//                  pass BEHIND the lit sign (the city's canvas), the near / big ones IN FRONT of it (a small overlay each, only while one
//                  is over the sign); the sign's band is a place they CROSS (its rows squeezed: never hovering over the letters)
// Positions are a function of the time since the event began (every phone sees the same sky): a slow drift with the real wind
// (a crossing takes most of the event), a gentle rise and fall. Sprites per balloon per light; the flame + the glow live.
import { safeCtx, ctx2d, freeCanvases } from '../../ui/canvas-safe.js';
import { tierVal } from '../../core/harbor-tiers.js';
const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
import * as SR from './sight-react.js';
import { rng, BALLOON_KINDS, FESTIVAL_ORDER, FLIGHT, hash01, flightLen, singleKind } from '../../core/harbor-balloon-kinds.js';
// (PROGRESSION B: the line-up + the flight's length moved to core/harbor-balloon-kinds.js — the server replays a flight for a CITY SIGHTING)
export { BALLOON_KINDS, FESTIVAL_ORDER, FLIGHT, flightLen };

// the envelope's outline (centre of the dome at 0,0; radius 1): the dome, then the taper to the mouth
function envPath(x, R) {
  x.beginPath();
  x.moveTo(-0.2 * R, 1.42 * R);
  x.bezierCurveTo(-0.55 * R, 1.05 * R, -1.02 * R, 0.55 * R, -1.0 * R, 0.0);
  x.bezierCurveTo(-0.98 * R, -0.6 * R, -0.55 * R, -1.02 * R, 0, -1.02 * R);
  x.bezierCurveTo(0.55 * R, -1.02 * R, 0.98 * R, -0.6 * R, 1.0 * R, 0.0);
  x.bezierCurveTo(1.02 * R, 0.55 * R, 0.55 * R, 1.05 * R, 0.2 * R, 1.42 * R);
  x.closePath();
}
// THE ALIEN HEAD: a wide dome, the cheeks narrowing to a soft chin (the mouth under it)
function alienPath(x, R) {
  x.beginPath();
  x.moveTo(-0.16 * R, 1.5 * R);
  x.bezierCurveTo(-0.45 * R, 1.3 * R, -0.95 * R, 0.85 * R, -1.05 * R, 0.1 * R);
  x.bezierCurveTo(-1.12 * R, -0.62 * R, -0.62 * R, -1.08 * R, 0, -1.08 * R);
  x.bezierCurveTo(0.62 * R, -1.08 * R, 1.12 * R, -0.62 * R, 1.05 * R, 0.1 * R);
  x.bezierCurveTo(0.95 * R, 0.85 * R, 0.45 * R, 1.3 * R, 0.16 * R, 1.5 * R);
  x.closePath();
}
// THE ₿ — WSP, PREMIUM (the owner's PERF-B review, Nov 1: "looks very cheap"; supersedes POLISH 5's arcs): THE REAL MARK — the open
// Bitcoin logo's ₿ (public domain; its 64-unit drawing, the B tilted ~14° with its two short strokes above + below), flattened ONCE to
// polygons (btcMarkPolys, PURE) and PROJECTED POINT BY POINT onto the envelope's sphere (onSphere: longitude / latitude) — so it wraps over
// the gores, narrowing where the sphere turns away, its edges vector-crisp at any dpr (never a font, never a stretched bitmap). Painted ON
// the fabric: a soft print shadow under it, the mark, a gloss on the light's side clipped to it — then (balloonArt) the puffed gores, the
// sphere's light + shade and the sheen are laid OVER it like the rest of the fabric. THE OPPOSITES kept: orange on black (glowing at
// night through the lit sprite), black on orange.
const BTC_D = 'm46.11,27.441c0.637-4.258-2.605-6.547-7.038-8.074l1.438-5.768-3.511-0.875-1.4,5.616c-0.923-0.23-1.871-0.447-2.813-0.662l1.41-5.653-3.509-0.875-1.439,5.766c-0.764-0.174-1.514-0.346-2.242-0.527l0.004-0.018-4.842-1.209-0.934,3.75s2.605,0.597,2.55,0.634c1.422,0.355,1.679,1.296,1.636,2.042l-1.638,6.571c0.098,0.025,0.225,0.061,0.365,0.117-0.117-0.029-0.242-0.061-0.371-0.092l-2.296,9.205c-0.174,0.432-0.615,1.08-1.609,0.834,0.035,0.051-2.552-0.637-2.552-0.637l-1.743,4.019,4.569,1.139c0.85,0.213,1.683,0.436,2.503,0.646l-1.453,5.834,3.507,0.875,1.439-5.772c0.958,0.26,1.888,0.5,2.798,0.726l-1.434,5.745,3.511,0.875,1.453-5.823c5.987,1.133,10.489,0.676,12.384-4.739,1.527-4.36-0.076-6.875-3.226-8.515,2.294-0.529,4.022-2.038,4.483-5.155zm-8.023,11.249c-1.085,4.36-8.426,2.003-10.806,1.412l1.928-7.729c2.38,0.594,10.012,1.77,8.878,6.317zm1.086-11.312c-0.99,3.966-7.1,1.951-9.082,1.457l1.748-7.007c1.982,0.494,8.365,1.416,7.334,5.55z';
let btcMemo = null;
/** PURE: the ₿'s outline as closed polygons in its own units, centred on the mark (0,0) — [[x, y, x, y, …], …] (the outer + 2 counters) */
export function btcMarkPolys(d = BTC_D, seg = 10) {
  if (d === BTC_D && btcMemo) return btcMemo;
  const tok = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g), polys = [];
  let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, cx2 = 0, cy2 = 0, cur = null;
  const num = () => +tok[i++], isNum = () => i < tok.length && !/[a-zA-Z]/.test(tok[i]);
  const cubic = (x1, y1, x2, y2, x3, y3) => { for (let k = 1; k <= seg; k++) { const t = k / seg, u = 1 - t; cur.push(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3, u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3); } cx2 = x2; cy2 = y2; x = x3; y = y3; };
  while (i < tok.length) {
    if (!isNum()) cmd = tok[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase(), ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === 'Z') { if (cur && cur.length >= 6) polys.push(cur); cur = null; x = sx; y = sy; continue; }
    if (C === 'M') { if (cur && cur.length >= 6) polys.push(cur); x = ox + num(); y = oy + num(); sx = x; sy = y; cur = [x, y]; cmd = rel ? 'l' : 'L'; cx2 = x; cy2 = y; continue; }
    if (C === 'L') { x = ox + num(); y = oy + num(); cur.push(x, y); cx2 = x; cy2 = y; continue; }
    if (C === 'H') { x = ox + num(); cur.push(x, y); cx2 = x; cy2 = y; continue; }
    if (C === 'V') { y = oy + num(); cur.push(x, y); cx2 = x; cy2 = y; continue; }
    if (C === 'C') { const a = [num(), num(), num(), num(), num(), num()]; cubic(ox + a[0], oy + a[1], ox + a[2], oy + a[3], ox + a[4], oy + a[5]); continue; }
    if (C === 'S') { const a = [num(), num(), num(), num()]; cubic(2 * x - cx2, 2 * y - cy2, ox + a[0], oy + a[1], ox + a[2], oy + a[3]); continue; }
    i++;   // (an unknown command's number: skipped)
  }
  if (cur && cur.length >= 6) polys.push(cur);
  // centred on the mark's own box
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of polys) for (let k = 0; k < p.length; k += 2) { x0 = Math.min(x0, p[k]); x1 = Math.max(x1, p[k]); y0 = Math.min(y0, p[k + 1]); y1 = Math.max(y1, p[k + 1]); }
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const out = polys.map(p => p.map((v, k) => (k % 2 ? v - my : v - mx)));
  out.h = y1 - y0; out.w = x1 - x0;
  if (d === BTC_D) btcMemo = out;
  return out;
}
/** the ₿ traced onto the sphere: SPAN = the mark's full height in radians of latitude (strokes included), centred a touch above the
 *  dome's middle (where the sphere faces us most) */
const BTC_SPAN = 1.56, BTC_LAT = 0.05;
function btcPath(x, R, dx = 0, dy = 0) {
  const P = btcMarkPolys(), k = BTC_SPAN / P.h;
  x.beginPath();
  for (const p of P) {
    for (let j = 0; j < p.length; j += 2) {
      const [px, py] = onSphere(R, p[j] * k, BTC_LAT - p[j + 1] * k);
      if (j) x.lineTo(px + dx, py + dy); else x.moveTo(px + dx, py + dy);
    }
    x.closePath();
  }
}
function bitcoinMark(x, R, col, light, lit) {
  x.save();
  // the print's shadow: the mark a hair down + away from the light, soft + faint — it sits ON the fabric, not floating over it
  if (!lit) { x.fillStyle = 'rgba(0,0,0,0.28)'; btcPath(x, R, -light.side * R * 0.018, R * 0.026); x.fill('nonzero'); }
  x.fillStyle = col; btcPath(x, R); x.fill('nonzero');
  if (!lit) {
    // THE GLOSS: a soft highlight on the light's side, clipped to the mark (printed ink catching the sun / the sky) + a thin bright lip
    // along its lit edges (the emboss), the far side a touch darker
    x.save(); btcPath(x, R); x.clip('nonzero');
    const hx = light.side * R * 0.35, g = x.createRadialGradient(hx, -R * 0.42, 0, hx * 0.5, -R * 0.1, R * 0.95);
    g.addColorStop(0, `rgba(255,252,240,${(0.16 + 0.22 * light.day).toFixed(3)})`); g.addColorStop(0.6, 'rgba(255,252,240,0)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    x.fillStyle = g; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.6);
    x.strokeStyle = `rgba(255,248,230,${(0.1 + 0.18 * light.day).toFixed(3)})`; x.lineWidth = Math.max(0.35, R * 0.022); x.lineJoin = 'round';
    btcPath(x, R, light.side * R * 0.008, -R * 0.012); x.stroke();
    x.restore();
  }
  x.restore();
}
// ---------------------------------------------------------------- 9a — THE STYLES (the owner, Oct 25: the festival's line-up + new designs)
// Every design is painted ON the sphere: a point at longitude φ / latitude λ (the dome's centre at 0,0) shows at
// (R·sin φ·cos λ, −R·sin λ) — gores narrow toward the edges, rings + the face wrap round the curve; the puffed gores + the sphere's
// light are laid over afterwards (the seams read only as shading).
/** Old Glory: red #B22234, navy #3C3B6E, white */
export const FLAG = { red: [178, 34, 52], navy: [60, 59, 110], white: [246, 244, 240] };
/** the schemes per kind (POLISH 5's two-colour gores kept as PINSTRIPES: red / gold, blue / cream) */
export const BALLOON_SCHEMES = {
  pinstripes: [[[214, 40, 48], [250, 204, 60]], [[40, 92, 196], [246, 244, 236]]],
  vstripes: [[[214, 40, 48], [246, 150, 40], [250, 214, 60], [60, 170, 90], [50, 120, 210], [120, 70, 170]], [[24, 130, 110], [244, 232, 200], [232, 92, 40], [244, 232, 200]], [[30, 34, 72], [240, 190, 60], [196, 44, 52], [240, 190, 60]]],
  // (WINDOWS: THE MENACING SKULL — a BLACK envelope (two gores' blacks) + the bone-white skull on its face; [black, black 2, the bone])
  skull: [[[22, 20, 24], [30, 28, 32], [240, 234, 220]]],
  smiley: [[[250, 208, 36], [246, 200, 30]]],
};
const brighten = c => mix(c, [255, 220, 150], 0.25).map(v => Math.min(255, Math.round(v * 1.15)));
/** a point on the dome's sphere (φ, λ in radians) → x, y */
const onSphere = (R, lon, lat) => [R * Math.sin(lon) * Math.cos(lat), -R * Math.sin(lat)];
// the envelope's half width at y (in R; the dome a circle, the taper the outline's bezier down to the mouth) — the gores' meridians
const HW = (() => { const out = []; for (let i = 0; i <= 48; i++) { const t = i / 48, u = 1 - t; out.push([3 * u * u * t * 0.55 + 3 * u * t * t * 1.05 + t * t * t * 1.42, u * u * u * 1 + 3 * u * u * t * 1.02 + 3 * u * t * t * 0.55 + t * t * t * 0.2]); } return out; })();
function halfW(v) {
  if (v <= 0) return Math.sqrt(Math.max(0, 1 - (v / 1.02) * (v / 1.02)));
  if (v >= 1.42) return 0.2;
  for (let i = 1; i < HW.length; i++) if (HW[i][0] >= v) { const [y0, x0] = HW[i - 1], [y1, x1] = HW[i]; return x0 + (x1 - x0) * ((v - y0) / Math.max(1e-6, y1 - y0)); }
  return 0.2;
}
/** one gore (longitudes a0..a1) filled between its two MERIDIANS, from the crown down the taper to the mouth — `split` stripes in it */
function goreFill(x, R, a0, a1, cols) {
  const split = cols.length;
  for (let k = 0; k < split; k++) {
    const b0 = a0 + (a1 - a0) * k / split, b1 = a0 + (a1 - a0) * (k + 1) / split;
    x.fillStyle = rgb(cols[k]);
    x.beginPath();
    const ys = []; for (let i = 0; i <= 26; i++) ys.push(-1.04 + i * (2.6 / 26));
    ys.forEach((v, i) => { const h = halfW(v) * R * 1.03, px = Math.sin(b0) * h - 0.2; if (i) x.lineTo(px, v * R); else x.moveTo(px, v * R); });
    for (let i = ys.length - 1; i >= 0; i--) { const v = ys[i], h = halfW(v) * R * 1.03; x.lineTo(Math.sin(b1) * h + 0.2, v * R); }
    x.closePath(); x.fill();
  }
}
/** a five-pointed star (r its outer radius; squeezed by sx where the sphere turns away) */
function starAt(x, cx, cy, r, sx = 1) {
  x.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; const px = cx + Math.cos(a) * rr * sx, py = cy + Math.sin(a) * rr; if (i) x.lineTo(px, py); else x.moveTo(px, py); }
  x.closePath(); x.fill();
}
function fabric(x, R, kind, scheme, lit, light) {
  const n = 12, alien = kind === 'alien';
  const sch = scheme || BALLOON_SCHEMES.pinstripes[0];
  const L = c => (lit ? brighten(c) : c);
  const goreCol = i => {
    if (alien) return [[118, 196, 92], [126, 204, 100]][i % 2];
    // (PERF-A — THE OPPOSITES: the black ₿ balloon stays BLACK lit from inside too (only its ₿ glows); the orange one's night look is the
    //  lit orange + the black ₿ the owner keeps exactly — the colours the black one used to turn at night)
    if (kind === 'bitcoin') return [[26, 24, 28], [32, 30, 34]][i % 2];
    if (kind === 'btc-orange') return lit ? [[255, 150, 36], [250, 140, 30]][i % 2] : [[247, 147, 26], [240, 140, 22]][i % 2];
    if (kind === 'skull') return sch[i % 2];             // (WINDOWS: the black stays black lit from inside — only the bone glows)
    if (kind === 'smiley') return L(sch[i % sch.length]);
    if (kind === 'flag') return L(i % 2 ? FLAG.white : FLAG.red);
    return L(sch[i % sch.length]);                       // (pinstripes + vstripes: a colour a gore, round the sphere)
  };
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + i * Math.PI / (n / 2) - Math.PI / n, a1 = a0 + Math.PI / (n / 2);
    if (a1 < -Math.PI / 2 - 0.01 || a0 > Math.PI / 2 + 0.01) continue;
    goreFill(x, R, Math.max(-Math.PI / 2, a0), Math.min(Math.PI / 2, a1), kind === 'flag' ? [L(FLAG.red), L(FLAG.white)] : [goreCol(i)]);
  }
  // THE SKULL — MENACING (WINDOWS — the owner's WSP review, Nov 1 8:20 pm: WSP's "looks like a panda bear" — the black from the jaw down +
  // the round sockets). An ORIGINAL design, no brand mark: a BLACK envelope with a hard, angular BONE-WHITE skull painted on its face —
  // the cranium round, the CHEEKBONES + the JAW cut in straight lines (the black shows in the cheek notches), DEEP ANGLED SOCKETS whose top
  // edges slope DOWN to the nose (the angry brow) under a heavy brow shadow, a SHARP TRIANGULAR NOSE, a CLENCHED ROW OF TEETH (the bite line
  // + the gaps through both rows). Every point placed on the sphere (foreshortened where it turns away). Lit from inside (dusk + night) the
  // envelope STAYS BLACK and only the bone glows warm — a skull hanging in the dark.
  if (kind === 'skull') {
    const ink = 'rgb(12,10,14)', bone = lit ? [255, 236, 196] : sch[2];
    const sph = (pts, close = true) => { x.beginPath(); pts.forEach(([lo, la], k) => { const [px, py] = onSphere(R, lo, la); if (k) x.lineTo(px, py); else x.moveTo(px, py); }); if (close) x.closePath(); };
    const mirror = half => [...half, ...half.slice().reverse().map(([lo, la]) => [-lo, la])];
    // the head: the cranium an arc (centre lat 0.12), then the cheekbone, the notch, the jaw's straight sides to a squared chin
    const cran = Array.from({ length: 12 }, (_, k) => { const a = Math.PI / 2 - k / 11 * (Math.PI / 2 + 0.2); return [0.66 * Math.cos(a), 0.12 + 0.62 * Math.sin(a)]; });
    const head = mirror([...cran, [0.63, -0.2], [0.47, -0.34], [0.43, -0.64], [0.29, -0.86], [0.001, -0.9]]);
    x.fillStyle = rgb(bone); sph(head); x.fill();
    // (the bone's own shading: darker toward its edges + under the cheekbones — depth by light, never detail)
    { const [cx, cy] = onSphere(R, 0, 0.18), g = x.createRadialGradient(cx, cy, R * 0.18, cx, cy, R * 0.95), e = lit ? 'rgba(110,52,18,' : 'rgba(40,34,30,';
      g.addColorStop(0, `${e}0)`); g.addColorStop(1, `${e}${lit ? 0.42 : 0.32})`); x.fillStyle = g; sph(head); x.fill(); }
    // THE HEAVY BROW: a bone shadow just over each socket's sloping top edge
    for (const sg of [-1, 1]) {
      x.fillStyle = lit ? 'rgba(60,28,10,0.5)' : 'rgba(40,32,30,0.5)';
      sph([[sg * 0.04, 0.13], [sg * 0.54, 0.33], [sg * 0.56, 0.2], [sg * 0.06, 0.0]]); x.fill();
    }
    // THE SOCKETS: angled + deep — the inner top corner LOW by the nose, the outer top high, a hard straight brow edge
    x.fillStyle = ink;
    for (const sg of [-1, 1]) { sph([[sg * 0.06, 0.03], [sg * 0.52, 0.22], [sg * 0.5, -0.06], [sg * 0.36, -0.2], [sg * 0.15, -0.17], [sg * 0.07, -0.08]]); x.fill(); }
    // THE NOSE: a sharp triangle, point up
    sph([[0, -0.15], [0.085, -0.37], [-0.085, -0.37]]); x.fill();
    // THE TEETH, CLENCHED: the upper lip line, the bite line, the jaw's foot, the gaps through both rows (bold strokes: they read at ~30 pt)
    const tw = Math.max(0.45, R * 0.045);
    x.strokeStyle = ink; x.lineJoin = 'miter'; x.lineCap = 'butt';
    const row = (la, lo0 = 0.31, bend = 0.03) => Array.from({ length: 13 }, (_, k) => { const u = k / 12 * 2 - 1; return [u * lo0, la - bend * (1 - u * u)]; });
    x.lineWidth = tw * 1.4; sph(row(-0.47, 0.33), false); x.stroke();
    x.lineWidth = tw; sph(row(-0.64, 0.31), false); x.stroke();
    x.lineWidth = tw * 1.2; sph(row(-0.79, 0.27, 0.02), false); x.stroke();
    x.lineWidth = tw * 0.9;
    for (let k = 1; k < 7; k++) { const lo = -0.3 + k / 7 * 0.6; sph([[lo, -0.47 - 0.03 * (1 - (lo / 0.33) ** 2)], [lo, -0.79]], false); x.stroke(); }
  }
  // THE AMERICAN FLAG wrapped round the envelope: the red + white stripes down the gores to the mouth (goreFill: two a gore), the NAVY
  // CANTON over the crown — its lower edge a circle of latitude (seen a little from below: a soft curve) — and its stars as crisp white
  // points placed on the sphere (smaller + closer where it turns away)
  if (kind === 'flag') {
    const lat0 = 0.36, y0 = -R * Math.sin(lat0), rx = R * Math.cos(lat0) * 1.1;
    x.fillStyle = rgb(L(FLAG.navy));
    x.beginPath(); x.moveTo(-R * 1.2, -R * 1.2); x.lineTo(R * 1.2, -R * 1.2); x.lineTo(R * 1.2, y0); x.ellipse(0, y0, rx, R * 0.1, 0, 0, Math.PI); x.lineTo(-R * 1.2, y0); x.closePath(); x.fill();
    // (a thin white band under the canton — the flag's own white stripe at its foot, so navy never meets red)
    x.strokeStyle = rgb(L(FLAG.white)); x.lineWidth = R * 0.05; x.beginPath(); x.ellipse(0, y0 + R * 0.025, rx, R * 0.1, 0, 0.12, Math.PI - 0.12); x.stroke();
    x.fillStyle = lit ? 'rgb(255,250,236)' : 'rgb(255,255,255)';
    for (let row = 0; row < 3; row++) {
      const lat = lat0 + 0.17 + row * 0.2, cols = 7 - row * 2;
      for (let k = 0; k < cols; k++) {
        const lon = ((k + 0.5) / cols - 0.5) * Math.PI * (0.92 - row * 0.12) + (row % 2 ? 0.08 : 0), [sx, sy] = onSphere(R, lon, lat), f = Math.cos(lon) * Math.cos(lat);
        if (f < 0.2) continue;
        starAt(x, sx, sy, Math.max(0.55, R * 0.075 * (0.55 + 0.45 * f)), Math.cos(lon));
      }
    }
  }
  // THE SMILEY: two tall oval eyes + a wide smile, each placed on the sphere (foreshortened where it turns away)
  if (kind === 'smiley') {
    const ink = lit ? 'rgb(44,26,10)' : 'rgb(28,20,14)';
    x.fillStyle = ink;
    for (const sg of [-1, 1]) {
      const lon = sg * 0.3, lat = 0.24, [ex, ey] = onSphere(R, lon, lat);
      x.beginPath(); x.ellipse(ex, ey, 0.085 * R * Math.cos(lon), 0.17 * R * Math.cos(lat), sg * 0.05, 0, TAU); x.fill();
    }
    x.strokeStyle = ink; x.lineCap = 'round'; x.lineWidth = 0.075 * R;
    x.beginPath();
    for (let i = 0; i <= 18; i++) {
      const u = i / 18 * 2 - 1, lon = u * 0.66, lat = -0.2 - 0.26 * (1 - u * u), [sx, sy] = onSphere(R, lon, lat);
      if (i === 0) x.moveTo(sx, sy); else x.lineTo(sx, sy);
    }
    x.stroke();
    // (the smile's dimples: two short ticks at its ends, the classic face)
    x.lineWidth = 0.05 * R;
    for (const sg of [-1, 1]) { const [ax, ay] = onSphere(R, sg * 0.7, -0.15), [bx, by] = onSphere(R, sg * 0.62, -0.25); x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); }
    x.lineCap = 'butt';
  }
  // THE MARKS: the ₿ (THE OPPOSITES — the black envelope: an ORANGE ₿ at every hour, brighter lit from inside · the orange envelope: a
  // BLACK ₿ at every hour) + the alien's big glossy almond eyes
  if (kind === 'bitcoin') bitcoinMark(x, R, lit ? 'rgb(255,168,46)' : 'rgb(247,147,26)', light, lit);
  if (kind === 'btc-orange') bitcoinMark(x, R, 'rgb(20,14,8)', light, lit);
  if (alien && !lit) {
    for (const sg of [-1, 1]) {
      x.save(); x.translate(sg * 0.42 * R, 0.22 * R); x.rotate(sg * -0.5);
      x.fillStyle = 'rgb(10,10,14)'; x.beginPath(); x.ellipse(0, 0, 0.38 * R, 0.17 * R, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(200,220,255,0.55)'; x.beginPath(); x.ellipse(-0.12 * R, -0.06 * R, 0.1 * R, 0.035 * R, -0.2, 0, TAU); x.fill();
      x.restore();
    }
    x.strokeStyle = 'rgba(40,70,30,0.5)'; x.lineWidth = Math.max(0.3, R * 0.02); x.beginPath(); x.moveTo(-0.14 * R, 0.86 * R); x.quadraticCurveTo(0, 0.92 * R, 0.14 * R, 0.86 * R); x.stroke();
  }
}
// ---------------------------------------------------------------- PERF-B — THE DISCO BALL's TILES
// The envelope's front half as rows of mirror tiles: on the dome a row per 7.5° of latitude (shorter toward the crown: the sphere turning
// away), on the taper a row per the same arc down to the mouth; each row's tiles spread round its circle (fewer where it's smaller), every
// other row staggered half a tile; each tile's NORMAL (the sphere's + a small seeded tilt: real tiles never sit quite flat) reflects the
// view → what it sees: the sky / the night above, the city below, the sun's glint. PURE: the same tiles every bake.
const DISCO = { dLat: Math.PI / 24, gap: 0.84, tilt: 0.09 };
const NEON_TILE = [[255, 79, 180], [70, 220, 255], [160, 100, 255], [255, 176, 64], [90, 255, 170], [255, 90, 120]];
const tileHash = (a, b) => { let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x7f4a7c15, 0x85ebca6b)) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; return (h >>> 0) / 4294967296; };
/** PURE: the disco ball's tiles — [{ row, k, v0, v1 (rows, in R), a0, a1 (longitudes), lon, lat (the normal's), jx, jy (the tilt), h3 }] */
export function discoTiles() {
  const out = [], dl = DISCO.dLat;
  let row = 0;
  const addRow = (v0, v1, latN) => {
    const vm = (v0 + v1) / 2, hw = halfW(vm), n = Math.max(3, Math.round(Math.PI * hw / dl)), off = row % 2 ? 0.5 : 0;
    for (let k = 0; k < n + (off ? 1 : 0); k++) {
      const l0 = -Math.PI / 2 + (k - off) * Math.PI / n, l1 = l0 + Math.PI / n;
      const a0 = Math.max(-Math.PI / 2, l0), a1 = Math.min(Math.PI / 2, l1);
      if (a1 - a0 < 0.02) continue;
      const lon = (a0 + a1) / 2, h = tileHash(row * 131 + 7, k * 977 + 3), h2 = tileHash(row * 71 + k, 0x5e), h3 = tileHash(k * 31 + 1, row * 17 + 0x9a);
      out.push({ row, k, v0, v1, a0, a1, lon, lat: latN, jx: (h - 0.5) * 2 * DISCO.tilt, jy: (h2 - 0.5) * 2 * DISCO.tilt, h3 });
    }
    row++;
  };
  // the dome: latitude ~88° → 0 (v = −sin(lat)·1.02)
  for (let lat = Math.PI / 2 - dl * 0.3; lat > 0.001; lat -= dl) { const la1 = Math.max(0, lat - dl); addRow(-Math.sin(lat) * 1.02, -Math.sin(la1) * 1.02, (lat + la1) / 2); }
  // the taper: the same arc a row down to the mouth (its surface turning down: the normal leans down as it narrows)
  for (let v = 0; v < 1.3; v += dl * 1.06) { const v1 = Math.min(1.34, v + dl * 1.06); addRow(v, v1, -Math.min(1.2, ((v + v1) / 2) / 1.42 * 1.25)); }
  return out;
}
let discoMemo = null;
/** what a tile sees: its normal reflected (the view along −z) → [r, g, b, a] by day / night, or the burner's warm light (lit) */
function tileColour(t, light, lit) {
  const cl = Math.cos(t.lat);
  let nx = cl * Math.sin(t.lon) + t.jx, ny = Math.sin(t.lat) + t.jy, nz = cl * Math.cos(t.lon); const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
  const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;                     // (the view reflected: what this tile shows)
  const day = light.day, gold = light.gold, v = 0.74 + 0.5 * t.h3 * t.h3 + (t.h3 > 0.9 ? 0.18 : 0);   // (each tile its own brightness — a few much brighter)
  if (lit) {
    // the burner's flash: the lower tiles catch the flame below them (warm), the upper ones barely
    const k = Math.max(0, -ry * 0.7 + 0.3 - Math.max(0, ny) * 0.4) * (0.5 + 0.7 * t.h3);
    return [255, 160 + 50 * t.h3, 76, Math.min(1, k)];
  }
  let c;
  if (ry >= 0) {
    // the sky above (day: pale at the horizon → the deep blue; gold hour warm) · the night sky (deep violet, a star now + then)
    const u = Math.pow(ry, 0.7);
    const dc = mix(mix([232, 240, 252], [92, 150, 220], u), [255, 196, 140], gold * 0.45 * (1 - u));
    // (at night the upper tiles catch the NEON sign over them — its pink in a share — + a star now + then)
    const pink = tileHash(t.row * 3 + 1, t.k * 5 + 2), nc = t.h3 > 0.94 ? [226, 226, 250] : pink > 0.72 ? mix([60, 26, 70], [255, 92, 196], 0.45 + 0.5 * pink) : mix([46, 38, 80], [14, 14, 34], u);
    c = mix(nc, dc, Math.min(1, day * 1.15));
  } else {
    // the city below (day: warm stone + brick near the horizon, darker down) · at night the city's NEON in a share of them
    const u = Math.pow(-ry, 0.8);
    const dc = mix([218, 170, 124], [98, 80, 74], u);
    const neonPick = NEON_TILE[Math.floor(tileHash(t.row * 13 + 5, t.k * 29 + 11) * NEON_TILE.length)], on = tileHash(t.k * 7 + 3, t.row * 19 + 1);
    const nc = on < 0.5 + 0.3 * (1 - u) ? mix([40, 28, 50], neonPick, 0.7 + 0.3 * on) : mix([26, 22, 36], [70, 56, 70], t.h3);
    c = mix(nc, dc, Math.min(1, day * 1.15));
  }
  c = c.map(q => Math.min(255, q * v));
  // THE SUN's glint (by day + gold hour: the tiles whose reflection meets the sun) — white-hot, a few
  if (day > 0.25) {
    const sx = light.side * 0.62, sy = 0.5, sz = 0.6, sl = Math.hypot(sx, sy, sz), d = (rx * sx + ry * sy + rz * sz) / sl;
    if (d > 0.84) c = mix(c, [255, 252, 238], Math.min(1, (d - 0.84) / 0.08) * Math.min(1, (day - 0.25) * 2));
  }
  // the limb: grazing tiles reflect less (a mirror ball's darker edge — its volume)
  const edge = Math.max(0, 0.38 - nz) / 0.38;
  c = mix(c, day > 0.4 ? [64, 78, 104] : [10, 10, 20], edge * 0.6);
  return [...c, 1];
}
/** the tiles painted into a balloon's canvas (its transform at the dome's centre, R) — the grout first, then each tile's quad; returns
 *  the bright tiles (where a glint may twinkle) */
function discoFabric(x, R, lit, light) {
  if (!discoMemo) discoMemo = discoTiles();
  const P = (lon, v) => [Math.sin(lon) * halfW(v) * R * 1.03, v * R];
  if (!lit) { x.fillStyle = light.day > 0.4 ? 'rgb(54,60,74)' : 'rgb(12,11,20)'; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.8); }   // (the grout)
  const g = DISCO.gap, glints = [];
  for (const t of discoMemo) {
    const [r, gg, b, a] = tileColour(t, light, lit);
    if (a < 0.03) continue;
    const lm = (t.a0 + t.a1) / 2, la = (t.a1 - t.a0) / 2 * g, vm = (t.v0 + t.v1) / 2, va = (t.v1 - t.v0) / 2 * g;
    const p = [P(lm - la, vm - va), P(lm + la, vm - va), P(lm + la, vm + va), P(lm - la, vm + va)];
    x.fillStyle = `rgba(${r | 0},${gg | 0},${b | 0},${a.toFixed(3)})`;
    x.beginPath(); x.moveTo(p[0][0], p[0][1]); for (let i = 1; i < 4; i++) x.lineTo(p[i][0], p[i][1]); x.closePath(); x.fill();
    if (!lit) { const lum = 0.3 * r + 0.59 * gg + 0.11 * b, [cx, cy] = P(lm, vm); if (lum > 185 || (light.day < 0.4 && lum > 120)) glints.push([cx, cy, lum, r, gg, b]); }
  }
  if (!lit) {
    // the gores' meridians (the 12 seams, faint) + the crown's vent cap + the dark seam band at the mouth
    x.strokeStyle = light.day > 0.4 ? 'rgba(36,42,58,0.4)' : 'rgba(0,0,0,0.5)'; x.lineWidth = Math.max(0.3, R * 0.02);
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + Math.PI / 12 + i * Math.PI / 6; x.beginPath(); for (let j = 0; j <= 24; j++) { const [px, py] = P(a, -1.02 + j * (2.42 / 24)); if (j) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); }
    x.fillStyle = 'rgba(30,28,40,0.6)'; x.beginPath(); x.ellipse(0, -0.99 * R, R * 0.2, R * 0.055, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgb(22,18,26)'; x.fillRect(-R, 1.26 * R, R * 2, R * 0.18);
    // the sphere's volume: a soft sheen on the light's side (the tiles crisp under it) + the shade away from it
    const sx = light.side * R * 0.4, sh = x.createRadialGradient(sx, -R * 0.4, R * 0.05, sx * 0.3, 0, R * 1.45);
    sh.addColorStop(0, `rgba(255,255,255,${(0.14 * light.day + 0.04).toFixed(3)})`); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, `rgba(10,12,30,${(0.26 + 0.2 * (1 - light.day)).toFixed(3)})`);
    x.fillStyle = sh; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.8);
  }
  return glints;
}
/** a glint: a four-point star (+ two faint diagonals) round a hot core — white; drawn 'lighter', tinted at night by a coloured core */
let glintArt = null;
function glintSprite() {
  if (glintArt) return glintArt;
  const c = mk(48, 48), x = safeCtx(c);
  const g = x.createRadialGradient(24, 24, 0, 24, 24, 9); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 48, 48);
  for (const [w, h] of [[23, 1.5], [1.5, 23]]) { const l = x.createRadialGradient(24, 24, 0, 24, 24, 23); l.addColorStop(0, 'rgba(255,255,255,1)'); l.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = l; x.beginPath(); x.ellipse(24, 24, w, h, 0, 0, TAU); x.fill(); }
  for (const r of [Math.PI / 4, -Math.PI / 4]) { x.save(); x.translate(24, 24); x.rotate(r); x.fillStyle = 'rgba(255,255,255,0.45)'; x.beginPath(); x.ellipse(0, 0, 9, 0.8, 0, 0, TAU); x.fill(); x.restore(); }
  glintArt = c;
  return c;
}
/** one balloon's art in this light → { cv, glow, w, h, oy (the dome's centre from the top), mouth (y of the mouth) } — kind: one of
 *  BALLOON_KINDS (pinstripes · vstripes · skull · smiley — its scheme) or the specials ('bitcoin' black, 'btc-orange', 'alien') */
export function balloonArt(R, scheme, light, dpr, kind = 'pinstripes') {   // (exported for the look previews)
  const alien = kind === 'alien', path = alien ? alienPath : envPath, mouthY = (alien ? 1.5 : 1.42) * R;
  const W = R * 2.3, Hh = R * (kind === 'alien' ? 3.5 : 3.35), d = Math.min(3, dpr * 1.25);
  let glintsOut = null;
  const make = lit => {
    const cv = mk(W * d, Hh * d), x = safeCtx(cv);
    x.setTransform(d, 0, 0, d, (W / 2) * d, (R * 1.08) * d);
    // the stripes: 12 gores round the sphere — a seam at longitude φ shows at x = R·sin φ (they narrow toward the edges)
    x.save(); path(x, R); x.clip();
    const n = 12;
    if (kind === 'disco') { const gl = discoFabric(x, R, lit, light); if (!lit) glintsOut = gl; }
    else {
    // 9a — THE DESIGN PAINTED ON THE FABRIC (gores, rings, the face, the marks), then the gores PUFFED over it: the seams read only as shading
    fabric(x, R, kind, scheme, lit, light);
    for (let i = 0; i < n && !lit; i++) {
      const a0 = -Math.PI / 2 + i * Math.PI / (n / 2) - Math.PI / n, a1 = a0 + Math.PI / (n / 2);
      if (a1 < -Math.PI / 2 - 0.01 || a0 > Math.PI / 2 + 0.01) continue;
      const x0 = Math.sin(Math.max(-Math.PI / 2, a0)) * R * 1.08, x1 = Math.sin(Math.min(Math.PI / 2, a1)) * R * 1.08;
      // (6b: THE GORE PUFFED between its tapes — its edges a shade darker, its middle catching the light: fabric, not paint)
      if (x1 - x0 > 0.6) { const g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(20,12,30,0.22)'); g.addColorStop(0.45, 'rgba(255,255,255,0.08)'); g.addColorStop(0.55, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(20,12,30,0.22)'); x.fillStyle = g; x.fillRect(x0, -1.12 * R, x1 - x0 + 0.3, 2.7 * R); }
    }
    if (!lit) {
      // the sphere's light: the sun's side lit, the far side in shade, a sky rim on the shaded edge
      const sx = light.side * R * 0.45;
      let g = x.createRadialGradient(sx, -R * 0.35, R * 0.1, sx * 0.4, 0, R * 1.5);
      g.addColorStop(0, `rgba(255,250,235,${0.35 * light.day})`); g.addColorStop(0.45, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(20,12,40,${0.42 + 0.3 * (1 - light.day)})`);
      x.fillStyle = g; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.8);
      if (light.gold > 0.1) { g = x.createLinearGradient(light.side * R, 0, -light.side * R, 0); g.addColorStop(0, `rgba(255,170,90,${0.35 * light.gold})`); g.addColorStop(1, 'rgba(255,170,90,0)'); x.fillStyle = g; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.8); }
      g = x.createLinearGradient(-light.side * R, 0, -light.side * R * 0.7, 0); g.addColorStop(0, `rgba(200,220,255,${0.25 * light.day})`); g.addColorStop(1, 'rgba(200,220,255,0)'); x.fillStyle = g; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.8);
      // the load tapes on the seams (fine, a little darker), the crown's vent cap, the skirt
      x.strokeStyle = 'rgba(30,20,30,0.18)'; x.lineWidth = Math.max(0.25, R * 0.012);
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * Math.PI / (n / 2) - Math.PI / n; if (Math.abs(a) > Math.PI / 2) continue; const sx2 = Math.sin(a) * R; x.beginPath(); x.moveTo(sx2 * 0.15, -1.02 * R); x.quadraticCurveTo(sx2 * 1.1, -0.2 * R, sx2 * 0.22, 1.4 * R); x.stroke(); }
      x.fillStyle = `rgba(30,24,36,${0.35})`; x.beginPath(); x.ellipse(0, -0.98 * R, R * 0.26, R * 0.07, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgba(28,20,24,0.5)'; x.fillRect(-R, mouthY - 0.16 * R, R * 2, R * 0.2);
      // (6b) a soft HIGHLIGHT on the sun's side — the fabric's sheen
      { const hx = light.side * R * 0.42, g2 = x.createRadialGradient(hx, -R * 0.45, 0, hx, -R * 0.45, R * 0.55); g2.addColorStop(0, `rgba(255,255,250,${(0.28 * light.day + 0.05).toFixed(3)})`); g2.addColorStop(1, 'rgba(255,255,250,0)'); x.fillStyle = g2; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 1.6); }
    } else {
      // lit from inside: brightest by the mouth, fading up the dome (only this, drawn additively over the envelope)
      x.globalCompositeOperation = 'destination-in';
      const g = x.createRadialGradient(0, R * 1.2, R * 0.1, 0, R * 0.2, R * 1.6);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
      x.fillStyle = g; x.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.8);
      x.globalCompositeOperation = 'source-over';
    }
    }
    x.restore();
    // THE MOUTH seen from below: a dark opening at the envelope's foot (the flame shows inside it on a burn)
    if (!lit) { x.fillStyle = 'rgb(30,18,16)'; x.beginPath(); x.ellipse(0, mouthY, 0.19 * R, 0.055 * R, 0, 0, TAU); x.fill(); x.strokeStyle = 'rgba(120,90,70,0.6)'; x.lineWidth = Math.max(0.25, R * 0.012); x.stroke(); }
    if (!lit) {
      // the cables, the burner frame, the basket (wicker: a weave + a leather rim), two tiny passengers over the rim
      const by = mouthY + 0.5 * R, bw = 0.36 * R, bh = 0.3 * R;
      x.fillStyle = rgb(mix([40, 30, 26], [96, 72, 56], light.day)); for (const px of [-0.08, 0.09]) { x.beginPath(); x.arc(px * R, by - 0.05 * R, 0.055 * R, 0, TAU); x.fill(); }
      x.strokeStyle = 'rgba(40,30,30,0.7)'; x.lineWidth = Math.max(0.3, R * 0.015);
      x.beginPath(); for (const f of [-1, -0.35, 0.35, 1]) { x.moveTo(f * 0.2 * R, mouthY); x.lineTo(f * bw * 0.5, by); } x.stroke();
      x.fillStyle = 'rgb(40,36,40)'; x.fillRect(-bw * 0.32, mouthY + 0.28 * R, bw * 0.64, R * 0.06);
      const bc = mix([60, 40, 26], [150, 104, 60], light.day);
      x.fillStyle = rgb(bc); x.beginPath(); x.roundRect(-bw / 2, by, bw, bh, R * 0.04); x.fill();
      x.strokeStyle = rgb(mix(bc, [30, 20, 10], 0.45), 0.7); x.lineWidth = Math.max(0.2, R * 0.01);
      x.beginPath(); for (let i = 1; i < 5; i++) { x.moveTo(-bw / 2, by + bh * i / 5); x.lineTo(bw / 2, by + bh * i / 5); } for (let i = 1; i < 6; i++) { x.moveTo(-bw / 2 + bw * i / 6, by); x.lineTo(-bw / 2 + bw * i / 6, by + bh); } x.stroke();
      x.fillStyle = rgb(mix(bc, [20, 12, 8], 0.55)); x.fillRect(-bw / 2 - R * 0.01, by - R * 0.02, bw + R * 0.02, R * 0.05);
      x.fillStyle = rgb([255, 250, 230], 0.25 * light.day); x.fillRect(light.side > 0 ? bw * 0.3 : -bw / 2, by, bw * 0.2, bh);
    }
    return cv;
  };
  const cv = make(false), glow = make(true);
  // (the disco ball's glint spots, in the sprite's own pt: the brightest tiles first — where a glint may twinkle)
  const glints = glintsOut ? glintsOut.sort((p, q) => q[2] - p[2]).slice(0, 36).map(([gx, gy, l, r, g, b]) => ({ x: gx + W / 2, y: gy + R * 1.08, l, col: [r, g, b] })) : null;
  return { cv, glow, w: W, h: Hh, oy: R * 1.08, mouth: mouthY, burner: mouthY + 0.31 * R, kind, glints };
}

// ---------------------------------------------------------------- 9a — THE BALLOONS STAY UP (the owner, Oct 25 — DECIDED)
/** the preview's FAST crossing: the whole flight this many times faster (a 45-min crossing in ~4 min) */
export const FAST = 12;
/** the burner: one short burn every 45–120 s on a cruise (seeded, never a rhythm); every 3–7 s while climbing at the launch */
export const BURN = { cruise: [45, 120], climb: [3, 7], len: [1.8, 3.4] };
/** WSP — the sign's band crossed this many times faster by a NEAR balloon's altitude journey (squeezeBand) */
export const SIGN_SQUEEZE = 2.5;
/** PURE: a height y in [y0, y1] remapped so the band [sb.y, sb.y + sb.h] takes 1 / SIGN_SQUEEZE of its natural share of the journey —
 *  continuous + monotonic (no jump), the ends fixed; sb null = unchanged */
export function squeezeBand(y, sb, y0, y1) {
  if (!sb || !(y1 > y0)) return y;
  const a = Math.max(y0, Math.min(y1, sb.y)), b = Math.max(y0, Math.min(y1, sb.y + sb.h));
  if (!(b > a)) return y;
  const A = a - y0, S = (b - a) / SIGN_SQUEEZE, C = y1 - b, T = A + S + C, v = (y - y0) / (y1 - y0) * T;
  return v < A ? y0 + v : v < A + S ? a + (v - A) * SIGN_SQUEEZE : b + (v - A - S);
}
/** PURE (WSP — THE LAYER SNAP): may a balloon whose box is [x, y, w, h] change its layer here? Only where the switch can't be SEEN: its
 *  bottom above every roof under it (sk: the roofline per 4-px column; tops: the roof signs, the billboard + the spires' tips — + .tips)
 *  and its box clear of the sign's band (sb) */
export function layerClear(x, y, w, h, sb, sk, tops) {
  if (sb && x + w > sb.x && x < sb.x + sb.w && y < sb.y + sb.h && y + h > sb.y) return false;
  const i0 = Math.max(0, Math.floor(x / 4)), yb = y + h + 1;
  for (const arr of [sk, tops, tops && tops.tips]) {
    if (!arr || !arr.length) continue;
    const i1 = Math.min(arr.length - 1, Math.ceil((x + w) / 4));
    for (let i = i0; i <= i1; i++) if (arr[i] < yb) return false;
  }
  return true;
}
/** PURE: the burns of one balloon — the i-th burn's start (s after its launch) and length; `climb` = the launch's climb (s; 0 = none) */
export function burnSchedule(seed, climb, until) {
  const out = []; let t = 2 + 4 * hash01(seed, 1), i = 0;
  while (t < until && i < 400) {
    const len = BURN.len[0] + (BURN.len[1] - BURN.len[0]) * hash01(seed, 1000 + i);
    out.push([t, len]);
    const [g0, g1] = t < climb ? BURN.climb : BURN.cruise;
    t += len + g0 + (g1 - g0) * hash01(seed, 2000 + i); i++;
  }
  return out;
}
/** PURE (PERF-A — the owner, Nov 1: the two ₿ balloons landed side by side): the festival's shuffled launch spots with the two ₿ balloons
 *  (line-up indexes a, b) at least 3 spots apart — opposite halves of the sky, never neighbours; the black one swaps with whoever holds
 *  the spot 3 across from the orange one (no extra draws: the same plan on every phone) */
export function apartSpots(spots, a = FESTIVAL_ORDER.indexOf('btc-orange'), b = FESTIVAL_ORDER.indexOf('bitcoin')) {
  const out = [...spots], rank = v => [...out].sort((p, q) => p - q).indexOf(v), n = out.length;
  if (a < 0 || b < 0 || n < 6) return out;
  const ra = rank(out[a]), rb = rank(out[b]);
  if (Math.abs(ra - rb) >= 3) return out;
  const want = [...out].sort((p, q) => p - q)[ra <= (n - 1) / 2 ? ra + 3 : ra - 3], j = out.indexOf(want);
  [out[b], out[j]] = [out[j], out[b]];
  return out;
}
/** PURE (PERF-B — the owner, Nov 1: the 7th balloon, THE DISCO BALL, on the far right's open slot): the festival's launch spots with the
 *  disco ball on the RIGHTMOST spot (the screen's right; the wind carries the whole line together) and the two ₿ balloons apart from each
 *  other (≥ 3 spots) and never beside the disco ball — the nearest valid pair of spots to the shuffle's own (no extra draws: the same plan on
 *  every phone) */
export function festivalSpots(spots, order = FESTIVAL_ORDER) {
  const out = [...spots], n = out.length, d = order.indexOf('disco'), a = order.indexOf('btc-orange'), b = order.indexOf('bitcoin');
  const sorted = () => [...out].sort((p, q) => p - q), rank = v => sorted().indexOf(v), swapTo = (who, r) => { const want = sorted()[r], j = out.indexOf(want); [out[who], out[j]] = [out[j], out[who]]; };
  if (d < 0) return apartSpots(out, a, b);
  swapTo(d, n - 1);
  if (a < 0 || b < 0) return out;
  const lim = n - 3;                                          // (the ₿ pair: ranks 0..n−3 — never beside the disco ball at n−1)
  const valid = [];
  for (let p = 0; p <= lim; p++) for (let q = 0; q <= lim; q++) if (Math.abs(p - q) >= 3) valid.push([p, q]);
  const ra = rank(out[a]), rb = rank(out[b]);
  if (valid.some(([p, q]) => p === ra && q === rb)) return out;
  let best = valid[0], bd = 1e9;
  for (const v of valid) { const dd = Math.abs(v[0] - ra) + Math.abs(v[1] - rb); if (dd < bd) { bd = dd; best = v; } }
  swapTo(a, best[0]); swapTo(b, best[1]);
  return out;
}
/** PURE: a balloon's drift across (0 at its start → 1 off the far edge), eased in so it never lurches from rest */
export const driftAt = u => { const v = clamp01(u); return v * v * (1.5 - 0.5 * v); };

export function createBalloons() {
  let W = 1, K = 1, dpr = 2, cur = null, burnId = 0, burnPan = 0, tier = 2;
  // PERF-B — THE NEAR ONES IN FRONT OF THE SIGN: a small fixed canvas per balloon (its own box, moved by a transform — a compositor move),
  // above the NEON sign (z 2, like the Blackbird + the Mothman), only while a near balloon is over the sign's band; freed with the flight
  const fronts = new Map();
  function frontOf(b, w, h, d) {
    let f = fronts.get(b.i);
    const cw = Math.max(1, Math.ceil(w * d)), ch = Math.max(1, Math.ceil(h * d));
    if (!f) {
      const cv = document.createElement('canvas'); cv.className = 'hb-balloon'; cv.setAttribute('aria-hidden', 'true');
      Object.assign(cv.style, { position: 'fixed', left: '0px', top: '0px', pointerEvents: 'none', zIndex: '2', willChange: 'transform' });
      document.body.appendChild(cv); f = { cv, x: null, key: '' }; fronts.set(b.i, f);
    }
    if (f.cv.width !== cw || f.cv.height !== ch) { f.cv.width = cw; f.cv.height = ch; f.cv.style.width = `${w}px`; f.cv.style.height = `${h}px`; f.x = null; }
    if (!f.x) f.x = ctx2d(f.cv);
    if (f.cv.style.display === 'none') f.cv.style.display = '';
    return f.x ? f : null;
  }
  function freeFronts() { for (const f of fronts.values()) { f.cv.width = f.cv.height = 0; f.cv.remove(); } fronts.clear(); }
  const flameDot = (() => { const c = mk(32, 32), x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.3, 'rgba(255,170,60,0.6)'); g.addColorStop(1, 'rgba(255,120,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c; })();

  /** start: { at (clock ms: the launch), seed, festival, box: { x, y, w, h } (the open sky), lanes (the old way), windSign (−1 / 1),
   *  fast (the preview's FAST crossing), fade (a preview: a short fade-in — a load joining mid-flight never fades) } */
  function start(o) {
    stop();
    const seed = o.seed || 7, R0 = rng(seed), fest = !!o.festival, n = fest ? FESTIVAL_ORDER.length : 1, list = [];
    const box = o.box || (o.lanes && o.lanes['sky-low']);
    const dur = flightLen(seed, fest);
    // a single flight's style: the everyday kinds; ~1 in 8 the black ₿, ~1 in 16 the orange ₿, ~1 in 50 the alien (6b's rare odds)
    const single = singleKind(R0, o.kind, k => !!BALLOON_SCHEMES[k]);   // (core/harbor-balloon-kinds.js — the server replays the same pick)
    // (the festival's launch spots: spread across, shuffled — the line-up keeps its ORDER in time, not in space)
    const spots = festivalSpots(FESTIVAL_ORDER.map((_, i) => 0.06 + 0.88 * (i + 0.5) / n).sort(() => R0() - 0.5));
    for (let i = 0; i < n; i++) {
      const kind = fest ? FESTIVAL_ORDER[i] : single;
      // depth: nearer = bigger + lower in the sky (each its own height band in the festival)
      const near = fest ? 0.25 + 0.75 * ((i * 0.618 + R0() * 0.25) % 1) : 0.72 + R0() * 0.28;
      const sch = BALLOON_SCHEMES[kind] ? BALLOON_SCHEMES[kind][Math.floor(R0() * BALLOON_SCHEMES[kind].length)] : null;
      const launch = fest ? 4 + i * 21 + R0() * 9 : 0, climb = fest ? 70 + R0() * 25 : 0;
      list.push({ i, R: (8 + 14 * near) * K, near, kind, scheme: sch, band: clamp01(0.08 + 0.72 * near + (R0() - 0.5) * 0.2), x0: fest ? spots[i] : null,
        launch, climb, ph: R0() * TAU, rise: 420 + R0() * 300, seed: (seed * 31 + i * 977) >>> 0, burns: null, bi: 0, lastBurn: -1, art: null, key: '' });
    }
    for (const b of list) b.burns = burnSchedule(b.seed, b.climb, dur - b.launch);
    // (PERF-B — THE WHOLE SKY: a single balloon at any height, high to low — seeded; its slow altitude journey below)
    if (!fest) for (const b of list) b.band = o.band != null ? o.band : 0.1 + 0.78 * hash01(seed, 0xba);   // (o.band: a preview's height — the skull's link: mid-sky)
    // (each balloon's slow ALTITUDE JOURNEY — a pilot climbing + sinking to find the wind: ±16 % of the sky over 9–15 min, so it drifts
    //  THROUGH the sign's band, never parked over the letters)
    for (const b of list) { b.jP = (9 + 6 * hash01(b.seed, 0x1f)) * 60; b.jPh = hash01(b.seed, 0x2e) * TAU; }
    // (the depth rule: the NEAR / big ones pass IN FRONT of the lit sign, the far / small ones behind it)
    for (const b of list) b.front = b.near >= 0.6;
    // (the festival's heights by depth, evenly spread: the near ones lower, the far ones higher — never a row)
    if (fest) [...list].sort((a, b) => a.near - b.near).forEach((b, k) => { b.band = clamp01(0.04 + 0.86 * k / (n - 1) + (R0() - 0.5) * 0.08); });
    // (SP3 — 9a's review: at 402 the six overlapped at times. Now they drift TOGETHER on the one wind (festival.x: a shared speed — their
    // spacing across the sky holds the whole flight) and x-neighbours alternate HIGH / LOW, so no two sit in the same patch of sky)
    // (PERF-B — 7 now, over the WHOLE sky: neighbours HIGH / LOW across its full height; the journeys' phases split so x-neighbours swing
    //  apart, never in step)
    if (fest) { const ALT = [0, 4, 1, 5, 2, 6, 3]; [...list].sort((a, b) => a.x0 - b.x0).forEach((b, k) => { b.band = clamp01(0.04 + 0.88 * ALT[k % ALT.length] / 6 + (R0() - 0.5) * 0.04); b.jPh = (k % 2 ? Math.PI : 0) + b.jPh * 0.35; }); }
    list.sort((a, b) => a.near - b.near);                 // far first
    cur = { at: o.at, list, dir: o.windSign || 1, dur, festival: fest, box, fast: o.fast ? FAST : 1, fadeAt: o.fade ? performance.now() : null };
  }
  function stop() { if (cur) for (const b of cur.list) if (b.art) { b.art.cv.width = 0; b.art.glow.width = 0; } cur = null; freeFronts(); }
  function destroy() { stop(); freeCanvases(flameDot); }   // (THE LONG NIGHT: + the flame's dot)

  return {
    resize(w) { W = w; K = Math.max(0.9, Math.min(1.35, w / 402)); },
    setDpr(d) { dpr = d; },
    setTier(t) { tier = t; },
    start, stop,
    on: () => !!cur,
    /** a flight's length (s) for a seed — skyfx asks it to find a flight still up on load */
    flightLen,
    draw(c, s) {
      if (!cur) return false;
      const e = (s.now - cur.at) / 1000 * cur.fast;
      if (e > cur.dur) { stop(); return false; }
      if (e < 0) return true;
      const L = s.L, dark = clamp01(L.w.night + L.w.late), day = clamp01(L.w.day + L.w.golden * 0.85 + L.w.dawn * 0.8) * (1 - dark * 0.9);
      const gold = clamp01((L.w.golden + L.w.dawn) * 1.3), side = L.south ? (L.sun.az < 180 ? 1 : -1) : (L.sun.az < 180 ? -1 : 1);
      const light = { day: Math.max(0.1, day), gold, side }, key = `${Math.round(light.day * 6)}${Math.round(gold * 6)}${side}`;
      const fadeIn = cur.fadeAt == null ? 1 : clamp01((performance.now() - cur.fadeAt) / 2500), fadeOut = clamp01((cur.dur - e) / (20 * cur.fast));
      // THE OPEN SKY they keep to (PERF-B — the owner, Nov 1: "put them HIGHER … in front of the NEON sign … above it" — SUPERSEDES "under
      // the tagline"): the WHOLE sky, from under the corner buttons (the box's top) down to the crowns (a basket may dip behind a spire)
      const tr = s.textRects, box = cur.box || { x: 0, y: 40, w: W, h: 300 };
      const top = box.y + 2, floor0 = box.y + box.h + 10, sk = s.skyline;
      // the sign's band (the NEON letters → the tagline): a near balloon over it is drawn IN FRONT (its overlay), a far one behind
      let sb = null;
      if (tr && tr.neon) { const parts = [tr.neon, tr.word, tr.tag, tr.sub].filter(Boolean); const x0 = Math.min(...parts.map(r => r.x)), y0 = Math.min(...parts.map(r => r.y)), x1 = Math.max(...parts.map(r => r.x + r.w)), y1 = Math.max(...parts.map(r => r.y + r.h)); sb = { x: x0 - 6, y: y0 - 6, w: x1 - x0 + 12, h: y1 - y0 + 12 }; }
      const used = new Set(), nG = tierVal('discoGlints', tier);
      let gone = 0;
      for (const b of cur.list) {
        if (!b.art || b.key !== key) { if (b.art) { b.art.cv.width = 0; b.art.glow.width = 0; } b.art = balloonArt(b.R, b.scheme, light, dpr, b.kind); b.key = key; }
        const A = b.art;
        const eL = e - b.launch;
        if (eL < 0) continue;
        // THE DRIFT: the crossing spread over the WHOLE flight (barely moving at a glance) — a single balloon drifts in from the upwind
        // edge and out the other side as its flight ends; a festival balloon from its launch spot out on the wind
        const exitX = cur.dir > 0 ? W + A.w * 0.55 : -A.w * 0.55, enterX = cur.dir > 0 ? -A.w * 0.55 : W + A.w * 0.55;
        const x0 = b.x0 == null ? enterX : b.x0 * W;
        // (the festival: one shared drift — every balloon carried at the same speed from 40 s in, so the furthest upwind one is off the
        // far edge as the flight ends)
        const vF = (W * 1.02 + 70) / Math.max(600, cur.dur - 60), x = b.x0 == null ? x0 + (exitX - x0) * clamp01(eL / cur.dur) : x0 + cur.dir * vF * Math.max(0, e - 40);
        if ((cur.dir > 0 && x - A.w / 2 > W) || (cur.dir < 0 && x + A.w / 2 < 0)) { gone++; continue; }
        // its own height: the far ones high, the near ones lower; a slow rise + fall over ~7–12 min, a little bob
        // (its floor: the skyline under it — the highest roof across its width, the basket may tuck a little behind — eased, so it
        // RISES gently over a tall tower as it drifts toward it, like a pilot would. PERF-A — the owner, Nov 1: they sat BEHIND the roof
        // billboards + a spire: s.skyTops = the roof signs, the billboard + the spires' tips (scene.js#skyTopsNow) — those count whole,
        // no tuck, and the window looks half a balloon AHEAD on the wind, so it is already rising as it reaches one)
        let fl = floor0;
        const ahead = A.w * 0.5, xa = x - A.w * 0.6 - (cur.dir < 0 ? ahead : 0), xb = x + A.w * 0.6 + (cur.dir > 0 ? ahead : 0);
        if (sk && sk.length) { const i0 = Math.max(0, Math.floor((x - A.w * 0.6) / 4)), i1 = Math.min(sk.length - 1, Math.ceil((x + A.w * 0.6) / 4)); if (i1 >= i0) { fl = 1e9; for (let i = i0; i <= i1; i++) if (sk[i] < fl) fl = sk[i]; fl += A.h * 0.18; } }
        const tops = s.skyTops;
        if (tops && tops.length) {
          { const i0 = Math.max(0, Math.floor(xa / 4)), i1 = Math.min(tops.length - 1, Math.ceil(xb / 4)); for (let i = i0; i <= i1; i++) if (tops[i] - 3 < fl) fl = tops[i] - 3; }
          // (a thin tip: only under the balloon's own body — the envelope's middle ±⅓ + its basket — never across the window)
          const tp = tops.tips; if (tp) { const i0 = Math.max(0, Math.floor((x - A.w * 0.34) / 4)), i1 = Math.min(tp.length - 1, Math.ceil((x + A.w * 0.34) / 4)); for (let i = i0; i <= i1; i++) if (tp[i] - 2 < fl) fl = tp[i] - 2; }
        }
        if (b.lay === 'front') fl -= A.h * 0.18 + 2;    // (WSP: in front, no basket tucked behind a roof — it would show IN FRONT of it)
        fl = Math.max(fl, top + A.h + 4);
        const dts = Math.min(0.25, (s.dt || 16) / 1000) * cur.fast;
        b.fl = b.fl == null || Math.abs(b.fl - fl) > 400 ? fl : b.fl + Math.max(-1.6 * dts, Math.min(1.6 * dts, fl - b.fl));
        const room = Math.max(0, b.fl - top - A.h), rise = 0.05 * Math.sin(eL * TAU / b.rise + b.ph) + 0.16 * Math.sin(eL * TAU / b.jP + b.jPh);
        // (WSP — PERF-B's known issue "they sit over the NEON letters for minutes": a NEAR one's heights SQUEEZE the sign's band — the
        //  part of its journey that falls on the letters is crossed SIGN_SQUEEZE× faster, the rest of the sky keeps its share; one smooth,
        //  monotonic map: no jump)
        let y = squeezeBand(top + room * clamp01(b.band + rise), b.front && sb ? sb : null, top, top + room) + (s.motion ? Math.sin(s.t * 0.55 + b.ph) * 0.7 : 0);
        // THE RISE (the festival): from just under the roofline at its x (hidden behind the buildings: the sky draws first) up to its
        // height, easing out
        if (b.climb && eL < b.climb) {
          const ix = Math.max(0, Math.min((sk ? sk.length : 1) - 1, Math.round(x / 4))), roof = sk && sk.length ? sk[ix] : floor0;
          const y0 = roof + 2, k = clamp01(eL / b.climb), ez = 1 - Math.pow(1 - k, 2.2);
          y = y0 + (y - y0) * ez;
        }
        // (PROGRESSION B — CITY SIGHTINGS: the skull + the two ₿s answer a tap — each its own box (the festival's two ₿s apart: slot = its
        // index); the skull's BURNER ROARS (a big flame lighting the skull from below), a ₿'s burner flares + it BOBS UP + a gold pulse
        // on its ₿; still: the flame + the light held, no bob)
        const sid = b.kind === 'skull' ? 'skull' : b.kind === 'bitcoin' || b.kind === 'btc-orange' ? 'btc' : null, skey = sid ? `${sid}#${b.i}` : null;
        const rkS = sid ? SR.k(skey) : 0;
        if (rkS > 0 && sid === 'btc' && s.motion) y -= rkS * A.h * 0.14;
        if (sid && x > -A.w * 0.3 && x < W + A.w * 0.3) SR.box(sid, x, y + A.h * 0.45, A.w * 0.5, A.h * 0.5, { slot: b.i });
        const alpha = fadeIn * fadeOut * (0.75 + 0.25 * b.near);
        b.box = [x - A.w / 2, y + A.oy * 0, A.w, A.h];
        // (PERF-B — the depth rule: a near balloon over the sign's band goes onto its own overlay above the sign; everything else in the city.
        //  WSP — THE LAYER SNAP (the owner's PERF-B review: "it pops IN FRONT of the buildings on the way up", day + night): the overlay sits
        //  above the WHOLE city, so a near balloon still rising from behind a tower jumped in front of it the moment it touched the sign's
        //  band. ONE CONTINUOUS DEPTH now: the layer it WANTS (front: a near one by the sign; back: everyone else) is TAKEN only where nothing
        //  it overlaps would show the switch — clear of every roof, roof sign + spire under it AND clear of the sign's band (layerSwitch).
        //  A near one that reaches the sign still tucked behind a roof simply crosses BEHIND the letters this time)
        const pad = b.R * 0.9;
        const want = !!(b.front && sb && x + A.w / 2 > sb.x - A.w * 0.5 && x - A.w / 2 < sb.x + sb.w + A.w * 0.5 && y < sb.y + sb.h + A.h * 0.7 && y + A.h > sb.y - A.h * 0.7);
        if ((b.lay === 'front') !== want && layerClear(x - A.w / 2, y, A.w, A.h, sb, sk, tops)) b.lay = want ? 'front' : 'back';
        const inFront = b.lay === 'front';
        let g = c, ox = 0, oy = 0;
        if (inFront) {
          const dd = Math.min(3, dpr * 1.25), f = frontOf(b, A.w + pad * 2, A.h + pad * 2, dd);
          if (f) {
            const fx = x - A.w / 2 - pad, fy = y - pad;
            f.cv.style.transform = `translate3d(${fx.toFixed(2)}px,${fy.toFixed(2)}px,0)`;
            g = f.x; g.setTransform(dd, 0, 0, dd, 0, 0); g.clearRect(0, 0, A.w + pad * 2, A.h + pad * 2); ox = -fx; oy = -fy; g.translate(ox, oy);
            used.add(b.i);
          }
        }
        b.shownFront = g !== c;
        g.globalAlpha = alpha; g.drawImage(A.cv, x - A.w / 2, y, A.w, A.h); g.globalAlpha = 1;
        // THE DISCO BALL's GLINTS: a handful twinkling on its brightest tiles (THE TIER TABLE's discoGlints), each sliding a little with
        // the ball's slow turn as it flares + fades — seeded on the clock (every phone the same), never a rhythm
        if (A.glints && A.glints.length && s.motion) {
          const ct = s.t || 0, G = glintSprite();
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < nG; i++) {
            const P = 1.1 + 0.9 * hash01(b.seed + i, 0x77), ph = hash01(b.seed, i * 13 + 5) * P, cyc = Math.floor((ct + ph) / P), u = ((ct + ph) % P) / P;
            const sp = A.glints[Math.floor(hash01(cyc * 7 + i, b.seed) * Math.min(A.glints.length, 24))];
            const k = Math.pow(Math.sin(Math.PI * u), 3) * (0.55 + 0.45 * hash01(cyc, i + 3));
            if (k < 0.03) continue;
            const gs = b.R * (0.5 + 0.35 * k) * (dark > 0.5 ? 0.8 : 1), gx = x - A.w / 2 + sp.x + (u - 0.5) * b.R * 0.18 * cur.dir, gy = y + sp.y;
            g.globalAlpha = alpha * k * (dark > 0.5 ? 0.85 : 1);
            g.drawImage(G, gx - gs / 2, gy - gs / 2, gs, gs);
            if (dark > 0.5) { g.globalAlpha = alpha * k * 0.5; g.fillStyle = rgb(sp.col); g.beginPath(); g.arc(gx, gy, b.R * 0.07, 0, TAU); g.fill(); }
          }
          g.restore();
        }
        // THE BURNER: RARE + irregular (seeded: burnSchedule) — one short burn of a few pulses every 45–120 s, every few s while it climbs
        if (b.bi > 0 && eL < b.burns[b.bi - 1][0]) b.bi = 0;     // (a jump back: from the top)
        while (b.bi < b.burns.length - 1 && b.burns[b.bi][0] + b.burns[b.bi][1] < eL) b.bi++;
        const bn = b.burns[b.bi], cyc = bn ? eL - bn[0] : -1, inBurn = s.motion && cyc >= 0 && cyc < bn[1];
        if (inBurn && b.lastBurn !== b.bi) { b.lastBurn = b.bi; if (x > -A.w * 0.3 && x < W + A.w * 0.3) { burnId++; burnPan = Math.max(-1, Math.min(1, x / W * 2 - 1)); } }
        const ct = s.t || 0, burn0 = inBurn ? Math.min(1, cyc * 6, (bn[1] - cyc) * 4) * (0.62 + 0.38 * Math.max(0, Math.sin(ct * 13 + b.ph))) : 0;
        const burn = Math.max(burn0, rkS * (s.motion ? 0.8 + 0.2 * Math.sin(ct * 31 + b.ph) : 0.9)), roar = sid === 'skull' ? 1 + 1.5 * rkS : 1 + 0.6 * rkS;
        if (burn > 0.02) {
          const fx = x, fy = y + A.oy + A.burner, fl = b.R * (0.35 + 0.25 * burn) * (0.9 + 0.1 * Math.sin(ct * 40)) * roar;
          g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * burn;
          g.drawImage(flameDot, fx - fl * 0.35, fy - fl * 1.1, fl * 0.7, fl * 1.25);
          g.globalAlpha = alpha * burn * (0.25 + 0.75 * dark + 0.4 * gold) * 0.9;
          g.drawImage(A.glow, x - A.w / 2, y, A.w, A.h);
          // (6b) the flare lights the basket + the air round the mouth (a warm halo, strongest in the dark)
          g.globalAlpha = alpha * burn * (0.2 + 0.6 * dark); g.drawImage(flameDot, fx - b.R * 0.9, fy - b.R * 0.8, b.R * 1.8, b.R * 1.4);
          // (the tap's roar: the flame's warm light thrown UP over the envelope's face — the skull lit from below)
          if (rkS > 0.01) { g.globalAlpha = alpha * rkS * (sid === 'skull' ? 0.75 : 0.4) * (0.55 + 0.45 * dark); g.drawImage(flameDot, x - A.w * 0.62, y + A.h * 0.12, A.w * 1.24, A.h * 0.95); }
          g.restore();
        }
        // (a ₿'s GOLD PULSE: its lit-from-inside glow pulsed gold over the mark, twice through the reaction)
        if (rkS > 0.01 && sid === 'btc') { const ru = SR.u(skey) || 0, pz = s.motion ? Math.pow(Math.sin(Math.PI * ((ru * 2) % 1)), 2) : 1; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * rkS * 0.85 * pz; g.drawImage(A.glow, x - A.w / 2, y, A.w, A.h); g.restore(); }
        // THE ₿s AT NIGHT: lit from inside all the time (THE OPPOSITES — the orange one: lit orange with its black ₿; the black one stays
        // black, its orange ₿ glowing) — the burns only brighten it (POLISH 5: laid OVER the day's look, not added to it)
        // (WINDOWS: THE MENACING SKULL too — its envelope black, the bone glowing warm all night: a skull hanging in the dark)
        if ((b.kind === 'bitcoin' || b.kind === 'btc-orange' || b.kind === 'skull') && dark > 0.3) { g.save(); g.globalAlpha = alpha * Math.min(1, (dark - 0.3) / 0.5); g.drawImage(A.glow, x - A.w / 2, y, A.w, A.h); g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha * (dark - 0.3) * 0.35; g.drawImage(A.glow, x - A.w / 2, y, A.w, A.h); g.restore(); }
        if (g !== c) g.setTransform(1, 0, 0, 1, 0, 0);
      }
      for (const [i, f] of fronts) if (!used.has(i) && f.cv.style.display !== 'none') f.cv.style.display = 'none';
      // (a festival is over once every balloon has drifted off)
      if (cur.festival && gone === cur.list.length) { stop(); return false; }
      return true;
    },
    /** the burner's sound follows the burns you SEE: { id (a counter: a new burn), pan } */
    burn: () => ({ id: burnId, pan: burnPan }),
    debug: () => (cur ? { n: cur.list.length, at: cur.at, dir: cur.dir, dur: cur.dur, fast: cur.fast, festival: cur.festival, kinds: cur.list.map(b => b.kind), order: [...cur.list].sort((p, q) => p.launch - q.launch).map(b => b.kind), launches: cur.list.map(b => (b.climb ? +b.launch.toFixed(1) : null)), burns: burnId, boxes: cur.list.map(b => (b.box ? b.box.map(v => Math.round(v)) : null)), front: cur.list.map(b => !!b.shownFront), near: cur.list.map(b => +b.near.toFixed(2)), overlays: fronts.size } : null),
    destroy,
  };
}
