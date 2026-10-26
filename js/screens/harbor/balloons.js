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
export const BALLOON_SCHEMES = [
  [[214, 40, 48], [250, 204, 60]], [[40, 92, 196], [246, 244, 236]], [[232, 92, 40], [128, 52, 160]],
  [[214, 40, 48], [246, 150, 40], [250, 214, 60], [60, 170, 90], [50, 120, 210], [120, 70, 170]], [[24, 130, 110], [244, 232, 200]], [[30, 30, 60], [240, 190, 60]],
];

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
/** one balloon's art in this light → { cv, glow, w, h, oy (the dome's centre from the top), mouth (y of the mouth) } — kind: 'stripes'
 *  (its scheme), 'bitcoin', 'alien' */
function balloonArt(R, scheme, light, dpr, kind = 'stripes') {
  const alien = kind === 'alien', btc = kind === 'bitcoin', path = alien ? alienPath : envPath, mouthY = (alien ? 1.5 : 1.42) * R;
  const W = R * 2.3, Hh = R * (kind === 'alien' ? 3.5 : 3.35), d = Math.min(3, dpr * 1.25);
  const make = lit => {
    const cv = mk(W * d, Hh * d), x = safeCtx(cv);
    x.setTransform(d, 0, 0, d, (W / 2) * d, (R * 1.08) * d);
    // the stripes: 12 gores round the sphere — a seam at longitude φ shows at x = R·sin φ (they narrow toward the edges)
    x.save(); path(x, R); x.clip();
    const n = 12, cols = alien ? [[118, 196, 92], [126, 204, 100]] : btc ? (lit ? [[255, 150, 36], [250, 140, 30]] : [[26, 24, 28], [32, 30, 34]]) : scheme;
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * Math.PI / (n / 2) - Math.PI / n, a1 = a0 + Math.PI / (n / 2);
      if (a1 < -Math.PI / 2 - 0.01 || a0 > Math.PI / 2 + 0.01) continue;
      const x0 = Math.sin(Math.max(-Math.PI / 2, a0)) * R * 1.08, x1 = Math.sin(Math.min(Math.PI / 2, a1)) * R * 1.08;
      let col = cols[i % cols.length];
      if (lit && !btc) col = mix(col, [255, 220, 150], 0.25).map(v => Math.min(255, v * 1.15));
      x.fillStyle = rgb(col); x.fillRect(x0, -1.12 * R, x1 - x0 + 0.3, 2.7 * R);
      // (6b: THE GORE PUFFED between its tapes — its edges a shade darker, its middle catching the light: fabric, not paint)
      if (!lit && x1 - x0 > 0.6) { const g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, 'rgba(20,12,30,0.22)'); g.addColorStop(0.45, 'rgba(255,255,255,0.08)'); g.addColorStop(0.55, 'rgba(255,255,255,0.08)'); g.addColorStop(1, 'rgba(20,12,30,0.22)'); x.fillStyle = g; x.fillRect(x0, -1.12 * R, x1 - x0 + 0.3, 2.7 * R); }
    }
    // the specials' faces: the ₿ (orange by day on black; black on the lit orange at night), the alien's big glossy almond eyes
    if (btc) bitcoinMark(x, R, lit || light.day < 0.3 ? 'rgb(20,14,8)' : 'rgb(247,147,26)');   // (at night the day's layer carries no orange ₿: the lit one shows it black)
    if (alien && !lit) {
      for (const sg of [-1, 1]) {
        x.save(); x.translate(sg * 0.42 * R, 0.22 * R); x.rotate(sg * -0.5);
        x.fillStyle = 'rgb(10,10,14)'; x.beginPath(); x.ellipse(0, 0, 0.38 * R, 0.17 * R, 0, 0, TAU); x.fill();
        x.fillStyle = 'rgba(200,220,255,0.55)'; x.beginPath(); x.ellipse(-0.12 * R, -0.06 * R, 0.1 * R, 0.035 * R, -0.2, 0, TAU); x.fill();
        x.restore();
      }
      x.strokeStyle = 'rgba(40,70,30,0.5)'; x.lineWidth = Math.max(0.3, R * 0.02); x.beginPath(); x.moveTo(-0.14 * R, 0.86 * R); x.quadraticCurveTo(0, 0.92 * R, 0.14 * R, 0.86 * R); x.stroke();
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

export function createBalloons() {
  let W = 1, K = 1, dpr = 2, cur = null;
  const flameDot = (() => { const c = mk(32, 32), x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(0.3, 'rgba(255,170,60,0.6)'); g.addColorStop(1, 'rgba(255,120,30,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return c; })();

  /** start: { at (clock ms), seed, festival, box: { x, y, w, h } (6b: the whole open sky), lanes (the old way), windSign (−1 / 1) } */
  function start(o) {
    stop();
    const R0 = rng(o.seed || 7), n = o.festival ? 5 + Math.floor(R0() * 3) : 1, list = [];
    const box = o.box || o.lanes['sky-low'];
    // (6b: the specials — always at the festival, now and then on a normal flight: ~1 in 8 each)
    const spec = o.festival ? ['bitcoin', 'alien'] : [R0() < 0.12 ? 'bitcoin' : R0() < 0.14 ? 'alien' : 'stripes'];
    for (let i = 0; i < n; i++) {
      // depth: nearer = bigger + lower in the sky; the festival spread across it (each its own height band, no two stacked)
      const near = o.festival ? (i === 0 ? 1 : 0.25 + 0.65 * ((i * 0.618 + R0() * 0.2) % 1)) : 0.75 + R0() * 0.25;
      const R = (9 + 11 * near) * K;
      list.push({ R, near, kind: spec[i] || 'stripes', scheme: BALLOON_SCHEMES[Math.floor(R0() * BALLOON_SCHEMES.length)], lane: box, band: o.festival ? (i === 0 ? 0.55 : (i * 0.37 + R0() * 0.15) % 1) : 0.3 + R0() * 0.4, x0: o.festival ? (i / n + R0() * 0.12) % 1 : R0(), drift: 0.7 + 0.6 * R0(), ph: R0() * TAU, burnEvery: 8 + R0() * 12, art: null, key: '' });
    }
    list.sort((a, b) => a.near - b.near);                 // far first
    // POLISH 5 — THE FESTIVAL LAUNCH (the owner): real balloons RISE from behind the buildings, one after another — inflated + stood up out of
    // sight, then lifting slowly above the skyline, the burners flaring as they climb, then away on the wind; each its own launch moment
    if (o.festival) { const ord = [...list].sort((p, q) => (p.kind === 'bitcoin' ? -2 : p.kind === 'alien' ? -1 : p.x0) - (q.kind === 'bitcoin' ? -2 : q.kind === 'alien' ? -1 : q.x0));   // (the ₿ first, the alien, then the rest)
      ord.forEach((b, i) => { b.launch = 4 + i * 21 + R0() * 9; b.climb = 70 + R0() * 25; }); }
    cur = { at: o.at, list, dir: o.windSign || 1, dur: o.dur || 12 * 60, festival: !!o.festival };
  }
  function stop() { if (cur) for (const b of cur.list) if (b.art) { b.art.cv.width = 0; b.art.glow.width = 0; } cur = null; }

  return {
    resize(w) { W = w; K = Math.max(0.9, Math.min(1.35, w / 402)); },
    setDpr(d) { dpr = d; },
    start, stop,
    on: () => !!cur,
    draw(c, s) {
      if (!cur) return false;
      const e = (s.now - cur.at) / 1000;
      if (e > cur.dur) { stop(); return false; }
      if (e < 0) return true;
      const L = s.L, dark = clamp01(L.w.night + L.w.late), day = clamp01(L.w.day + L.w.golden * 0.85 + L.w.dawn * 0.8) * (1 - dark * 0.9);
      const gold = clamp01((L.w.golden + L.w.dawn) * 1.3), side = L.south ? (L.sun.az < 180 ? 1 : -1) : (L.sun.az < 180 ? -1 : 1);
      const light = { day: Math.max(0.1, day), gold, side }, key = `${Math.round(light.day * 6)}${Math.round(gold * 6)}${side}`;
      const fadeIn = cur.festival ? 1 : clamp01(e / 6), fadeOut = clamp01((cur.dur - e) / 10);   // (a festival never fades in: it rises from behind the city)
      for (const b of cur.list) {
        if (!b.art || b.key !== key) { if (b.art) { b.art.cv.width = 0; b.art.glow.width = 0; } b.art = balloonArt(b.R, b.scheme, light, dpr, b.kind); b.key = key; }
        const A = b.art;
        // the drift across (the real wind's side), slower for the far ones; a slow rise and fall, a little bob
        // (it starts in view and drifts about half the screen over the event: a balloon is slow)
        // (a festival balloon: its clock from its own launch; before it, still behind the city — nothing drawn)
        const eL = b.launch != null ? e - b.launch : e;
        if (eL < 0) continue;
        const span = W + A.w * 2, k = (cur.list.length > 1 ? 0.12 + b.x0 * 0.72 : 0.18 + b.x0 * 0.4) + Math.max(0, eL - (b.climb || 0) * 0.5) / cur.dur * b.drift * 0.5 * (0.55 + 0.45 * b.near);   // (never wrapped: it drifts off; a climbing balloon barely drifts)
        const x = cur.dir > 0 ? -A.w + k * span : W + A.w - k * span;
        // (6b: its own height in the sky — the far ones high, the near ones lower; never below the crowns: the box's foot)
        const top = b.lane.y + 2, room = Math.max(0, b.lane.h - A.h - 4), band = clamp01(0.04 + b.band * 0.78 + 0.18 * b.near);
        let y = top + room * clamp01(band + 0.06 * Math.sin(e * 0.012 + b.ph)) + (s.motion ? Math.sin(e * 0.6 + b.ph) * 0.8 : 0);
        // THE RISE: from just under the roofline at its x (hidden behind the buildings: the sky draws first) up to its height, easing out
        let climbing = 0;
        if (b.climb && eL < b.climb) {
          const sk = s.skyline, ix = Math.max(0, Math.min((sk ? sk.length : 1) - 1, Math.round(x / 4))), roof = sk && sk.length ? sk[ix] : top + room + A.h;
          const y0 = roof + 2, u = clamp01(eL / b.climb), ez = 1 - Math.pow(1 - u, 2.2);
          y = y0 + (y - y0) * ez; climbing = 1 - u;
        }
        const alpha = fadeIn * fadeOut * (0.75 + 0.25 * b.near);
        c.globalAlpha = alpha; c.drawImage(A.cv, x - A.w / 2, y, A.w, A.h); c.globalAlpha = 1;
        // THE BURNER: a burn of a few pulses every 8–20 s; the flame, and at dusk the envelope lit from inside
        // (climbing: the burners flare far more often — every ~3 s — as it lifts)
        const every = climbing > 0.05 ? 3.2 : b.burnEvery, cyc = (e + b.ph * 3) % every, burn = s.motion ? (cyc < 2.4 ? Math.max(0, Math.sin(cyc * 7.5)) * 0.6 + 0.4 * (cyc < 2.2 ? 1 : 0) : 0) : 0;
        if (burn > 0.02) {
          const fx = x, fy = y + A.oy + A.burner, fl = b.R * (0.35 + 0.25 * burn) * (0.9 + 0.1 * Math.sin(e * 40));
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * burn;
          c.drawImage(flameDot, fx - fl * 0.35, fy - fl * 1.1, fl * 0.7, fl * 1.25);
          c.globalAlpha = alpha * burn * (0.25 + 0.75 * dark + 0.4 * gold) * 0.9;
          c.drawImage(A.glow, x - A.w / 2, y, A.w, A.h);
          // (6b) the flare lights the basket + the air round the mouth (a warm halo, strongest in the dark)
          c.globalAlpha = alpha * burn * (0.2 + 0.6 * dark); c.drawImage(flameDot, fx - b.R * 0.9, fy - b.R * 0.8, b.R * 1.8, b.R * 1.4);
          c.restore();
        }
        // THE ₿ AT NIGHT: lit from inside all the time (orange with a black ₿) — the burns only brighten it
        // (POLISH 5: laid OVER the day's look, not added to it — added, the day's orange ₿ glowed through and the mark went orange-on-orange)
        if (b.kind === 'bitcoin' && dark > 0.3) { c.save(); c.globalAlpha = alpha * Math.min(1, (dark - 0.3) / 0.5); c.drawImage(A.glow, x - A.w / 2, y, A.w, A.h); c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * (dark - 0.3) * 0.35; c.drawImage(A.glow, x - A.w / 2, y, A.w, A.h); c.restore(); }
      }
      return true;
    },
    debug: () => (cur ? { n: cur.list.length, at: cur.at, dir: cur.dir, festival: cur.festival, launches: cur.list.map(b => b.launch == null ? null : +b.launch.toFixed(1)) } : null),
    destroy: stop,
  };
}
