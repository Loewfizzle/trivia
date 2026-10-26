// CITY 2.0 — THE HARBOR, Part 6a: HOT AIR BALLOONS (docs/harbor.md#part-6a; re-rendered PREMIUM in 6b). On calm, clear mornings and
// summer evenings (only when the real wind is low: core/harbor-sky.js#balloonWeather + #balloonTime) a crafted balloon drifts slowly
// across THE WHOLE SKY (6b: from under the corner buttons down to the crowns, behind the NEON sign, in front of the sun + the moon;
// nearer = bigger + lower) — rarely a FESTIVAL of several spread over it at different heights + distances.
//   6b PREMIUM     each GORE puffed between its load tapes (its own fabric shading), a soft highlight on the sun's side, the dark MOUTH
//                  you see into from below (the flame inside it on a burn), the skirt, the cables, two tiny passengers over the rim;
//                  THE BURNER's flare lights the whole envelope from inside (brightest by the mouth), the basket + the air round it
//   THE SPECIALS   (sometimes in a normal flight, always at the festival) THE ₿ BALLOON — all black with a big orange ₿ by day, at
//                  night all ORANGE with a black ₿ (lit from inside; a nod, never explained) · THE ALIEN HEAD — a special-shape grey
//                  alien in green, big glossy black almond eyes, seamed fabric, the basket under its chin
//   THE ENVELOPE   a teardrop of 12 gores: the stripes narrow toward its edges as they turn away (a sphere, not a flat
//                  pattern), the load tapes on the seams, the crown's vent cap, the darker skirt; shaded as a sphere toward
//                  the REAL sun's side (morning: the east, our left), a rim of sky light on the other
//   THE BASKET     wicker (a weave + a leather rim), the burner frame, the cables up to the skirt
//   THE BURNER     every 8–20 s a burn of a few pulses: a yellow-white flame up into the mouth — and at dusk the envelope LIGHTS
//                  FROM INSIDE like a lantern (its own stripes glowing, brightest by the mouth)
// Positions are a function of the time since the event began (every phone sees the same sky): a slow drift with the real wind
// (a crossing takes most of the event), a gentle rise and fall. Sprites per balloon per light; the flame + the glow live.
import { safeCtx } from '../../ui/canvas-safe.js';
const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

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
// THE ₿ (POLISH 5 — the owner: "it reads as a B with short stubs"): the real Bitcoin symbol, drawn (never a font's glyph) — a BOLD B
// (its stem + two bowls, the lower a touch wider, the counters cut clean: one even-odd fill, crisp) with TWO VERTICAL STROKES that
// clearly stand ABOVE and BELOW the letter, the whole mark at the logo's slight tilt, centred on the envelope
function bitcoinMark(x, R, col) {
  const h = R * 1.02, t = h * 0.19, r = h * 0.25, wb = h * 0.3, x0 = -(wb + r) * 0.62, y0 = -h / 2;
  x.save(); x.fillStyle = col; x.rotate(0.24);
  x.beginPath();
  // the outer B
  x.moveTo(x0, y0); x.lineTo(x0 + wb, y0); x.arc(x0 + wb, y0 + r, r, -Math.PI / 2, Math.PI / 2);
  x.lineTo(x0 + wb * 1.12, y0 + h / 2); x.arc(x0 + wb * 1.12, y0 + h * 0.75, r, -Math.PI / 2, Math.PI / 2); x.lineTo(x0, y0 + h); x.closePath();
  // the two counters (cut out: even-odd)
  const ri = r - t * 0.92;
  x.moveTo(x0 + t, y0 + t * 0.92); x.lineTo(x0 + wb, y0 + t * 0.92); x.arc(x0 + wb, y0 + r, ri, -Math.PI / 2, Math.PI / 2); x.lineTo(x0 + t, y0 + r + ri); x.closePath();
  x.moveTo(x0 + t, y0 + h / 2 + (r - ri)); x.lineTo(x0 + wb * 1.12, y0 + h / 2 + (r - ri)); x.arc(x0 + wb * 1.12, y0 + h * 0.75, ri, -Math.PI / 2, Math.PI / 2); x.lineTo(x0 + t, y0 + h - t * 0.92); x.closePath();
  x.fill('evenodd');
  // the two strokes through it, standing well clear above + below (the ₿'s mark of identity)
  const bw = t * 0.72, ext = h * 0.2;
  for (const bx of [x0 + wb * 0.28, x0 + wb * 0.92]) { x.fillRect(bx - bw / 2, y0 - ext, bw, ext + t); x.fillRect(bx - bw / 2, y0 + h - t, bw, ext + t); }
  x.restore();
}
// ---------------------------------------------------------------- 9a — THE STYLES (the owner, Oct 25: the festival's line-up + new designs)
// Every design is painted ON the sphere: a point at longitude φ / latitude λ (the dome's centre at 0,0) shows at
// (R·sin φ·cos λ, −R·sin λ) — gores narrow toward the edges, rings + the face wrap round the curve; the puffed gores + the sphere's
// light are laid over afterwards (the seams read only as shading).
/** the everyday kinds a single balloon draws from (₿ + the alien keep their rare odds) */
export const BALLOON_KINDS = ['vstripes', 'pinstripes', 'bullseye', 'smiley'];
/** the festival's line-up, in launch order (the owner: orange ₿, the alien, black ₿, bullseye, smiley, striped) */
// (the owner's add-on, Oct 25: the sixth is the AMERICAN FLAG — vertical stripes stay an everyday style)
export const FESTIVAL_ORDER = ['btc-orange', 'alien', 'bitcoin', 'bullseye', 'smiley', 'flag'];
/** Old Glory: red #B22234, navy #3C3B6E, white */
export const FLAG = { red: [178, 34, 52], navy: [60, 59, 110], white: [246, 244, 240] };
export const BTC_ORANGE = [247, 147, 26];
/** the schemes per kind (POLISH 5's two-colour gores kept as PINSTRIPES: red / gold, blue / cream) */
export const BALLOON_SCHEMES = {
  pinstripes: [[[214, 40, 48], [250, 204, 60]], [[40, 92, 196], [246, 244, 236]]],
  vstripes: [[[214, 40, 48], [246, 150, 40], [250, 214, 60], [60, 170, 90], [50, 120, 210], [120, 70, 170]], [[24, 130, 110], [244, 232, 200], [232, 92, 40], [244, 232, 200]], [[30, 34, 72], [240, 190, 60], [196, 44, 52], [240, 190, 60]]],
  // (the owner's add-on: DEEP VIOLET + TEAL rings on CREAM — distinct from the orange ₿, the black ₿, the alien, the yellow smiley, the flag)
  bullseye: [[[244, 236, 214], [86, 40, 140], [22, 140, 138]]],
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
    if (kind === 'bitcoin') return lit ? [[255, 150, 36], [250, 140, 30]][i % 2] : [[26, 24, 28], [32, 30, 34]][i % 2];
    if (kind === 'btc-orange') return L([[247, 147, 26], [240, 140, 22]][i % 2]);
    if (kind === 'bullseye') return L(sch[0]);
    if (kind === 'smiley') return L(sch[i % sch.length]);
    if (kind === 'flag') return L(i % 2 ? FLAG.white : FLAG.red);
    return L(sch[i % sch.length]);                       // (pinstripes + vstripes: a colour a gore, round the sphere)
  };
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + i * Math.PI / (n / 2) - Math.PI / n, a1 = a0 + Math.PI / (n / 2);
    if (a1 < -Math.PI / 2 - 0.01 || a0 > Math.PI / 2 + 0.01) continue;
    const x0 = Math.sin(Math.max(-Math.PI / 2, a0)) * R * 1.08, x1 = Math.sin(Math.min(Math.PI / 2, a1)) * R * 1.08;
    void x0; void x1;
    goreFill(x, R, Math.max(-Math.PI / 2, a0), Math.min(Math.PI / 2, a1), kind === 'flag' ? [L(FLAG.red), L(FLAG.white)] : [goreCol(i)]);
  }
  // BULLSEYE: rings of equal angle round the point facing us — on the sphere they crowd toward the limb (radius R·sin θ)
  if (kind === 'bullseye') {
    const K = 7, cy = -0.04 * R;
    for (let k = K; k >= 1; k--) {
      const th = (k / K) * (Math.PI / 2) * 1.02, r = R * 1.06 * Math.sin(Math.min(Math.PI / 2, th));
      x.fillStyle = rgb(L(k % 2 ? sch[0] : sch[1 + ((k / 2) % 2)])); x.beginPath(); x.ellipse(0, cy, r, r * 1.02, 0, 0, TAU); x.fill();
    }
    // (below the dome the taper carries the outer ring's colour — a band at the skirt so the pattern reads as rings, not a target)
    x.fillStyle = rgb(L(sch[1])); x.fillRect(-R * 1.2, R * 1.02, R * 2.4, R * 0.5);
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
  // THE MARKS: the ₿ (black envelope: orange by day, black on the lit orange at night · the ORANGE envelope: a white ₿ on a dark
  // keyline) + the alien's big glossy almond eyes
  if (kind === 'bitcoin') bitcoinMark(x, R, lit || light.day < 0.3 ? 'rgb(20,14,8)' : 'rgb(247,147,26)');
  if (kind === 'btc-orange') {
    x.save(); x.scale(1.06, 1.05); bitcoinMark(x, R, lit ? 'rgba(60,28,6,0.85)' : 'rgb(30,18,10)'); x.restore();
    bitcoinMark(x, R, lit ? 'rgb(255,246,222)' : 'rgb(252,248,240)');
  }
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
/** one balloon's art in this light → { cv, glow, w, h, oy (the dome's centre from the top), mouth (y of the mouth) } — kind: one of
 *  BALLOON_KINDS (pinstripes · vstripes · bullseye · smiley — its scheme) or the specials ('bitcoin' black, 'btc-orange', 'alien') */
function balloonArt(R, scheme, light, dpr, kind = 'pinstripes') {
  const alien = kind === 'alien', path = alien ? alienPath : envPath, mouthY = (alien ? 1.5 : 1.42) * R;
  const W = R * 2.3, Hh = R * (kind === 'alien' ? 3.5 : 3.35), d = Math.min(3, dpr * 1.25);
  const make = lit => {
    const cv = mk(W * d, Hh * d), x = safeCtx(cv);
    x.setTransform(d, 0, 0, d, (W / 2) * d, (R * 1.08) * d);
    // the stripes: 12 gores round the sphere — a seam at longitude φ shows at x = R·sin φ (they narrow toward the edges)
    x.save(); path(x, R); x.clip();
    const n = 12;
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
  return { cv: make(false), glow: make(true), w: W, h: Hh, oy: R * 1.08, mouth: mouthY, burner: mouthY + 0.31 * R, kind };
}

// ---------------------------------------------------------------- 9a — THE BALLOONS STAY UP (the owner, Oct 25 — DECIDED)
/** a flight's length (minutes): a single balloon 45–60, the festival 60–90 (a real flight lasts 1–2 h) */
export const FLIGHT = { single: [45, 60], festival: [60, 90] };
/** the preview's FAST crossing: the whole flight this many times faster (a 45-min crossing in ~4 min) */
export const FAST = 12;
/** the burner: one short burn every 45–120 s on a cruise (seeded, never a rhythm); every 3–7 s while climbing at the launch */
export const BURN = { cruise: [45, 120], climb: [3, 7], len: [1.8, 3.4] };
const hash01 = (a, b) => { let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x7f4a7c15, 0x85ebca6b)) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; return (h >>> 0) / 4294967296; };
/** PURE: a flight's length in seconds from its seed (every phone the same) */
export function flightLen(seed, festival) {
  const [a, b] = festival ? FLIGHT.festival : FLIGHT.single;
  return Math.round((a + (b - a) * hash01(seed || 7, 0x51)) * 60);
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
/** PURE: a balloon's drift across (0 at its start → 1 off the far edge), eased in so it never lurches from rest */
export const driftAt = u => { const v = clamp01(u); return v * v * (1.5 - 0.5 * v); };

export function createBalloons() {
  let W = 1, K = 1, dpr = 2, cur = null, burnId = 0, burnPan = 0;
  const flameDot = (() => { const c = mk(32, 32), x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.3, 'rgba(255,170,60,0.6)'); g.addColorStop(1, 'rgba(255,120,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c; })();

  /** start: { at (clock ms: the launch), seed, festival, box: { x, y, w, h } (the open sky), lanes (the old way), windSign (−1 / 1),
   *  fast (the preview's FAST crossing), fade (a preview: a short fade-in — a load joining mid-flight never fades) } */
  function start(o) {
    stop();
    const seed = o.seed || 7, R0 = rng(seed), fest = !!o.festival, n = fest ? FESTIVAL_ORDER.length : 1, list = [];
    const box = o.box || (o.lanes && o.lanes['sky-low']);
    const dur = flightLen(seed, fest);
    // a single flight's style: the everyday kinds; ~1 in 8 the black ₿, ~1 in 16 the orange ₿, ~1 in 50 the alien (6b's rare odds)
    const r = R0(), single = r < 0.12 ? 'bitcoin' : r < 0.18 ? 'btc-orange' : r < 0.2 ? 'alien' : BALLOON_KINDS[Math.floor(R0() * BALLOON_KINDS.length)];
    // (the festival's launch spots: spread across, shuffled — the line-up keeps its ORDER in time, not in space)
    const spots = FESTIVAL_ORDER.map((_, i) => 0.1 + 0.8 * (i + 0.5) / n).sort(() => R0() - 0.5);
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
    // (the festival's heights by depth, evenly spread: the near ones lower, the far ones higher — never a row)
    if (fest) [...list].sort((a, b) => a.near - b.near).forEach((b, k) => { b.band = clamp01(0.04 + 0.86 * k / (n - 1) + (R0() - 0.5) * 0.08); });
    list.sort((a, b) => a.near - b.near);                 // far first
    cur = { at: o.at, list, dir: o.windSign || 1, dur, festival: fest, box, fast: o.fast ? FAST : 1, fadeAt: o.fade ? performance.now() : null };
  }
  function stop() { if (cur) for (const b of cur.list) if (b.art) { b.art.cv.width = 0; b.art.glow.width = 0; } cur = null; }

  return {
    resize(w) { W = w; K = Math.max(0.9, Math.min(1.35, w / 402)); },
    setDpr(d) { dpr = d; },
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
      // THE OPEN SKY they keep to: under the tagline (never parked behind the NEON sign — the owner) down to the crowns (a basket may
      // dip behind a spire); the box's top when the sign isn't measured
      const tr = s.textRects, under = tr ? (tr.sub || tr.tag || tr.word) : null, box = cur.box || { x: 0, y: 40, w: W, h: 300 };
      const top = under ? Math.max(box.y, under.y + under.h + 8) : box.y + 2, floor0 = box.y + box.h + 10, sk = s.skyline;
      let gone = 0;
      for (const b of cur.list) {
        if (!b.art || b.key !== key) { if (b.art) { b.art.cv.width = 0; b.art.glow.width = 0; } b.art = balloonArt(b.R, b.scheme, light, dpr, b.kind); b.key = key; }
        const A = b.art;
        const eL = e - b.launch;
        if (eL < 0) continue;
        // THE DRIFT: the crossing spread over the WHOLE flight (barely moving at a glance) — a single balloon drifts in from the upwind
        // edge and out the other side as its flight ends; a festival balloon from its launch spot out on the wind
        const exitX = cur.dir > 0 ? W + A.w * 0.55 : -A.w * 0.55, enterX = cur.dir > 0 ? -A.w * 0.55 : W + A.w * 0.55;
        const x0 = b.x0 == null ? enterX : b.x0 * W, d0 = b.climb * 0.5, u = (eL - d0) / Math.max(60, cur.dur - b.launch - d0);
        const x = x0 + (exitX - x0) * (b.x0 == null ? clamp01(eL / cur.dur) : driftAt(u));
        if ((cur.dir > 0 && x - A.w / 2 > W) || (cur.dir < 0 && x + A.w / 2 < 0)) { gone++; continue; }
        // its own height: the far ones high, the near ones lower; a slow rise + fall over ~7–12 min, a little bob
        // (its floor: the skyline under it — the highest roof across its width, the basket may tuck a little behind — eased, so it
        // RISES gently over a tall tower as it drifts toward it, like a pilot would)
        let fl = floor0;
        if (sk && sk.length) { const i0 = Math.max(0, Math.floor((x - A.w * 0.6) / 4)), i1 = Math.min(sk.length - 1, Math.ceil((x + A.w * 0.6) / 4)); if (i1 >= i0) { fl = 1e9; for (let i = i0; i <= i1; i++) if (sk[i] < fl) fl = sk[i]; fl += A.h * 0.18; } }
        fl = Math.max(fl, top + A.h + 4);
        const dts = Math.min(0.25, (s.dt || 16) / 1000) * cur.fast;
        b.fl = b.fl == null || Math.abs(b.fl - fl) > 400 ? fl : b.fl + Math.max(-1.6 * dts, Math.min(1.6 * dts, fl - b.fl));
        const room = Math.max(0, b.fl - top - A.h), rise = 0.08 * Math.sin(eL * TAU / b.rise + b.ph);
        let y = top + room * clamp01(b.band + rise) + (s.motion ? Math.sin(s.t * 0.55 + b.ph) * 0.7 : 0);
        // THE RISE (the festival): from just under the roofline at its x (hidden behind the buildings: the sky draws first) up to its
        // height, easing out
        if (b.climb && eL < b.climb) {
          const ix = Math.max(0, Math.min((sk ? sk.length : 1) - 1, Math.round(x / 4))), roof = sk && sk.length ? sk[ix] : floor0;
          const y0 = roof + 2, k = clamp01(eL / b.climb), ez = 1 - Math.pow(1 - k, 2.2);
          y = y0 + (y - y0) * ez;
        }
        const alpha = fadeIn * fadeOut * (0.75 + 0.25 * b.near);
        c.globalAlpha = alpha; c.drawImage(A.cv, x - A.w / 2, y, A.w, A.h); c.globalAlpha = 1;
        // THE BURNER: RARE + irregular (seeded: burnSchedule) — one short burn of a few pulses every 45–120 s, every few s while it climbs
        if (b.bi > 0 && eL < b.burns[b.bi - 1][0]) b.bi = 0;     // (a jump back: from the top)
        while (b.bi < b.burns.length - 1 && b.burns[b.bi][0] + b.burns[b.bi][1] < eL) b.bi++;
        const bn = b.burns[b.bi], cyc = bn ? eL - bn[0] : -1, inBurn = s.motion && cyc >= 0 && cyc < bn[1];
        if (inBurn && b.lastBurn !== b.bi) { b.lastBurn = b.bi; if (x > -A.w * 0.3 && x < W + A.w * 0.3) { burnId++; burnPan = Math.max(-1, Math.min(1, x / W * 2 - 1)); } }
        const ct = s.t || 0, burn = inBurn ? Math.min(1, cyc * 6, (bn[1] - cyc) * 4) * (0.62 + 0.38 * Math.max(0, Math.sin(ct * 13 + b.ph))) : 0;
        if (burn > 0.02) {
          const fx = x, fy = y + A.oy + A.burner, fl = b.R * (0.35 + 0.25 * burn) * (0.9 + 0.1 * Math.sin(ct * 40));
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * burn;
          c.drawImage(flameDot, fx - fl * 0.35, fy - fl * 1.1, fl * 0.7, fl * 1.25);
          c.globalAlpha = alpha * burn * (0.25 + 0.75 * dark + 0.4 * gold) * 0.9;
          c.drawImage(A.glow, x - A.w / 2, y, A.w, A.h);
          // (6b) the flare lights the basket + the air round the mouth (a warm halo, strongest in the dark)
          c.globalAlpha = alpha * burn * (0.2 + 0.6 * dark); c.drawImage(flameDot, fx - b.R * 0.9, fy - b.R * 0.8, b.R * 1.8, b.R * 1.4);
          c.restore();
        }
        // THE ₿s AT NIGHT: lit from inside all the time (the black one: orange with a black ₿; the orange one: a glowing white ₿) — the
        // burns only brighten it (POLISH 5: laid OVER the day's look, not added to it)
        if ((b.kind === 'bitcoin' || b.kind === 'btc-orange') && dark > 0.3) { c.save(); c.globalAlpha = alpha * Math.min(1, (dark - 0.3) / 0.5); c.drawImage(A.glow, x - A.w / 2, y, A.w, A.h); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * (dark - 0.3) * 0.35; c.drawImage(A.glow, x - A.w / 2, y, A.w, A.h); c.restore(); }
      }
      // (a festival is over once every balloon has drifted off)
      if (cur.festival && gone === cur.list.length) { stop(); return false; }
      return true;
    },
    /** the burner's sound follows the burns you SEE: { id (a counter: a new burn), pan } */
    burn: () => ({ id: burnId, pan: burnPan }),
    debug: () => (cur ? { n: cur.list.length, at: cur.at, dir: cur.dir, dur: cur.dur, fast: cur.fast, festival: cur.festival, kinds: cur.list.map(b => b.kind), order: [...cur.list].sort((p, q) => p.launch - q.launch).map(b => b.kind), launches: cur.list.map(b => (b.climb ? +b.launch.toFixed(1) : null)), burns: burnId } : null),
    destroy: stop,
  };
}
