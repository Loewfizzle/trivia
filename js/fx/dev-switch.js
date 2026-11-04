// `card-dev-switchboard` (THE VAULT 2B — the owner's own, ONE OF ONE · DEV; Nov 3 12:14 pm: "BUILD BOTH … a lot of flair, a lot of effects,
// must look stunning"; his sketch: Downloads\NEON\vault\dev-card-ideas.png #2). THE BRASS RADIO DESK he runs the city from (the city's own
// radio look — CITY CONTROLS' desk: brass, jacks, lamps, patch cables), in warm lamplight:
//   THE JACK FIELD   brass-ringed jacks in rows, each with its indicator lamp; a lamp lights as a cable lands in its jack
//   THE PATCH CABLES glowing cables SNAKE IN from below + between jacks, each ending in its brass plug — a SPARK as it lands; once
//                    plugged, LIGHT RUNS ALONG THEM — on the party's beat when a song is playing (audio/beat.js), a steady 112 bpm else
//   ON AIR           a red neon sign in its brass box, BUZZING ON with a stutter (sign-kit.js — the city's tube alphabet), humming
//   THE METER        (full card) a VU meter — its needle swinging to the level — + a row of level lamps dancing green → amber → red
//   THE LAMP         a warm beam slanting in from the top-left, DUST MOTES drifting in it; a glint sliding across the brass
//   THE LASER        gold into red (laser.js rgb2)
// A 10-second loop (the cables plug in, hold, slip out); the still frame: every cable plugged, ON AIR lit, the meter mid-swing. The brass
// itself is the strip's CSS material (crisp at the phone's ratio); the panel's light + the jacks + the boxes are ONE bake per size.
import { glow, stamp, sprite, rng, smooth, fract, sparkle } from './kit.js';
import { drawLaser } from './laser.js';
import { rrect } from './renderer.js';
import { bakeDpr, city } from './sg-kit.js';
import { signLayout, drawTube, ignite, hum } from './sign-kit.js';

const LOOP = 10;
const RED = { glow: '255,40,30', body: '#ff4636', core: '#fff0e6', glass: '#3a1412' };
const CABLES = ['255,70,70', '255,200,80', '90,220,255', '120,255,150', '255,90,210'];

/** where everything sits: the full card vs the strip (CSS px) */
function layoutOf(w, h, full) {
  if (full) {
    // (ON AIR beside the plate, the jacks it would cover left out; the meter + its lamps in the band under the top line)
    const cols = 11, rows = [0.42, 0.57, 0.72, 0.87], x0 = w * 0.07, x1 = w * 0.93, air = [w * 0.765, h * 0.35, w * 0.19, h * 0.13];
    const jacks = []; rows.forEach((ry, j) => { for (let i = 0; i < cols; i++) { const x = x0 + (x1 - x0) * i / (cols - 1), y = h * ry; if (x > air[0] - w * 0.03 && y < air[1] + air[3] + h * 0.06) continue; jacks.push([x, y, j, i]); } });
    return { full, jacks, r: Math.min((x1 - x0) / (cols - 1), h * 0.15) * 0.27, air, vu: [w * 0.065, h * 0.185, w * 0.15, h * 0.115], leds: [w * 0.25, h * 0.245, w * 0.3, 10],
      beam: [w * 0.02, -h * 0.05, w * 0.9, h * 1.05],
      cables: [[[w * 0.6, h + 8], 27], [[w * 0.84, h + 8], 37], [[-1, 0], 2, 35], [[w * 0.95, h + 8], 19], [[-1, 0], 23, 33]] };
  }
  const cols = 4, rows = [0.4, 0.78], x0 = w * 0.6, x1 = w * 0.76;
  const jacks = []; rows.forEach((ry, j) => { for (let i = 0; i < cols; i++) jacks.push([x0 + (x1 - x0) * i / (cols - 1), h * ry, j, i]); });
  return { full, jacks, r: Math.min((x1 - x0) / (cols - 1), h * 0.3) * 0.3, air: [w * 0.785, h * 0.1, w * 0.19, h * 0.4], vu: null, leds: [0, 0, 0, 0],
    beam: [w * 0.35, -h * 0.4, w * 0.55, h * 1.6],
    cables: [[[w * 0.66, h + 6], 2], [[-1, 0], 0, 7], [[w * 0.8, h + 6], 3]] };   // (2C — the owner's FIX: the pink-red cable lands in the TOP row)
}

/** the panel's bake: the lamp's warm light + the vignette over the brass, every jack (its ring, its hole, its lamp's socket), the ON
 *  AIR box, the meter's face */
function panel(L, w, h, dpr) {
  return sprite(`dsw:${w}x${h}:${L.full ? 1 : 0}@${dpr}`, w * dpr, h * dpr, (c) => {
    c.scale(dpr, dpr);
    // the lamp's warm pool (top-left) + the dark falloff to the edges — the brass stays the CSS material underneath
    const lg = c.createRadialGradient(w * 0.2, -h * 0.1, 0, w * 0.2, -h * 0.1, Math.hypot(w, h) * 0.95);
    lg.addColorStop(0, 'rgba(255,214,150,0.16)'); lg.addColorStop(0.45, 'rgba(60,30,8,0.18)'); lg.addColorStop(1, 'rgba(8,4,0,0.72)');
    c.fillStyle = lg; c.fillRect(0, 0, w, h);
    // the engraved rule between the desk's sections (full)
    if (L.full) { c.fillStyle = 'rgba(30,16,4,0.6)'; c.fillRect(w * 0.04, h * 0.355, w * 0.92, 1.4); c.fillStyle = 'rgba(255,226,170,0.28)'; c.fillRect(w * 0.04, h * 0.355 + 1.4, w * 0.92, 0.8); }
    for (const [x, y] of L.jacks) {
      const r = L.r;
      // the lamp's socket above the jack
      c.fillStyle = 'rgba(20,10,4,0.85)'; c.beginPath(); c.arc(x, y - r * 1.75, r * 0.38, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,230,180,0.22)'; c.beginPath(); c.arc(x - r * 0.1, y - r * 1.82, r * 0.14, 0, Math.PI * 2); c.fill();
      // the ring: a raised brass bezel (lit top-left), its shadow on the panel
      c.fillStyle = 'rgba(10,5,0,0.45)'; c.beginPath(); c.arc(x + r * 0.12, y + r * 0.18, r * 1.08, 0, Math.PI * 2); c.fill();
      const rg = c.createLinearGradient(x - r, y - r, x + r, y + r); rg.addColorStop(0, '#fff0c0'); rg.addColorStop(0.35, '#d8a850'); rg.addColorStop(0.7, '#7a4e18'); rg.addColorStop(1, '#3a2408');
      c.fillStyle = rg; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      // the hole: deep black, a dark inner lip
      const hg = c.createRadialGradient(x - r * 0.15, y - r * 0.15, 0, x, y, r * 0.62); hg.addColorStop(0, '#000'); hg.addColorStop(0.8, '#0a0604'); hg.addColorStop(1, '#2a1a08');
      c.fillStyle = hg; c.beginPath(); c.arc(x, y, r * 0.62, 0, Math.PI * 2); c.fill();
    }
    // ON AIR's box: black glass in a brass frame, a small plate of screws
    { const [x, y, bw, bh] = L.air;
      c.fillStyle = 'rgba(10,4,0,0.5)'; rrect(c, x + 2, y + 3, bw, bh, 5); c.fill();
      const fg = c.createLinearGradient(x, y, x, y + bh); fg.addColorStop(0, '#f6d690'); fg.addColorStop(0.5, '#a8762a'); fg.addColorStop(1, '#5a3a10');
      c.fillStyle = fg; rrect(c, x, y, bw, bh, 5); c.fill();
      const gg = c.createLinearGradient(x, y, x, y + bh); gg.addColorStop(0, '#1a0806'); gg.addColorStop(1, '#0a0404');
      c.fillStyle = gg; rrect(c, x + 2.4, y + 2.4, bw - 4.8, bh - 4.8, 3.5); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(x + 3, y + 3, bw - 6, (bh - 6) * 0.35); }
    // THE METER's face (full): cream paper, the scale + its red zone, the brass bezel
    if (L.vu) {
      const [x, y, bw, bh] = L.vu, cx = x + bw / 2, cy = y + bh * 0.92, R = bh * 0.82;
      const fg = c.createLinearGradient(x, y, x, y + bh); fg.addColorStop(0, '#f2d38a'); fg.addColorStop(1, '#6a4612');
      c.fillStyle = fg; rrect(c, x - 2, y - 2, bw + 4, bh + 4, 5); c.fill();
      const pg = c.createLinearGradient(x, y, x, y + bh); pg.addColorStop(0, '#fff3d4'); pg.addColorStop(1, '#e6cf9c');
      c.fillStyle = pg; rrect(c, x, y, bw, bh, 3.5); c.fill();
      c.lineCap = 'round';
      for (let i = 0; i <= 10; i++) {
        const a = -Math.PI / 2 - 0.9 + i * 0.18, red = i >= 8, l = i % 5 ? 0.12 : 0.2;
        c.strokeStyle = red ? '#c8261a' : '#3a2a18'; c.lineWidth = i % 5 ? 0.8 : 1.3;
        c.beginPath(); c.moveTo(cx + Math.cos(a) * R * (1 - l), cy + Math.sin(a) * R * (1 - l)); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke();
      }
      c.strokeStyle = '#c8261a'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R * 0.9, -Math.PI / 2 + 0.54, -Math.PI / 2 + 0.9); c.stroke();
      c.fillStyle = '#3a2a18'; c.font = `700 ${Math.max(6, bh * 0.16)}px "Chakra Petch", sans-serif`; c.textAlign = 'center'; c.fillText('VU', cx, y + bh * 0.62);
    }
    // the level lamps' sockets
    { const [x, y, bw, n] = L.leds; for (let i = 0; i < n; i++) { const lx = x + bw * (i + 0.5) / n; c.fillStyle = 'rgba(16,8,2,0.85)'; c.beginPath(); c.arc(lx, y, Math.min(4, bw / n * 0.32), 0, Math.PI * 2); c.fill(); } }
  });
}
/** a soft beam sprite (the lamp's light, a long cone) */
const beamSpr = () => sprite('dsw-beam', 64, 256, (c, W, H) => {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,226,170,0.5)'); g.addColorStop(1, 'rgba(255,200,120,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(W * 0.42, 0); c.lineTo(W * 0.58, 0); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
});
/** the glint band (a slanted white streak) */
const glintSpr = () => sprite('dsw-glint', 128, 32, (c, W, H) => { const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,250,230,0)'); g.addColorStop(0.5, 'rgba(255,250,230,0.9)'); g.addColorStop(1, 'rgba(255,250,230,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });

const airMemo = new Map();
const airSign = (bw, bh) => { const k = `${bw.toFixed(1)}:${bh.toFixed(1)}`; let s = airMemo.get(k); if (!s) { const ch = Math.min(bh * 0.5, bw / 7.2); s = signLayout([{ word: 'ON AIR', y: (bh - ch) / 2, h: ch, cx: bw / 2, col: RED, track: 0.42, tw: 1.6 }]); airMemo.set(k, s); } return s; };

/** the beat's phase now (0..1 through a beat) — the song's grid when one is playing, a steady 112 bpm else */
function beatPhase(t) {
  const B = city('beat', () => import('../audio/beat.js'));
  try {
    const s = B && B.beatSource ? B.beatSource() : null;
    if (s && s.bpm > 0) { const p = 60 / (s.grid ? s.grid.bpm : s.bpm); return fract((s.pos - ((s.grid && s.grid.t0) || 0)) / p); }
  } catch { /* the beat is polish */ }
  return fract(t * 112 / 60);
}
/** a cable's curve: start → end, sagging (points, cached per layout) */
function curve(a, b, sag, n = 26) {
  const pts = [], c1 = [a[0] + (b[0] - a[0]) * 0.15, a[1] + sag], c2 = [b[0] - (b[0] - a[0]) * 0.15, b[1] + sag * 0.9];
  for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; pts.push([v * v * v * a[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * b[0], v * v * v * a[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * b[1]]); }
  return pts;
}
const cablesMemo = new Map();
function cablesOf(L, w, h) {
  const key = `${w}x${h}:${L.full ? 1 : 0}`; let C = cablesMemo.get(key); if (C) return C;
  C = L.cables.map((d, i) => {
    const end = L.jacks[d[1]];
    const start = d[0][0] < 0 ? L.jacks[d[2]] : d[0];
    const sag = d[0][0] < 0 ? Math.abs(end[0] - start[0]) * 0.32 + L.r * 3 : -(start[1] - end[1]) * 0.55;
    return { pts: curve(start, end, sag), end, from: d[0][0] < 0 ? d[2] : -1, to: d[1], col: CABLES[i % CABLES.length], t0: 0.7 + i * 0.72 };
  });
  cablesMemo.set(key, C); return C;
}
/** how far a cable has snaked in (0..1) at t in the loop */
const reach = (C, t) => smooth(C.t0, C.t0 + 0.85, t) * (1 - smooth(9.05 + C.t0 * 0.08, 9.55 + C.t0 * 0.08, t));

function drawCable(c, C, p, w0) {
  const n = Math.max(1, Math.round(p * (C.pts.length - 1))), pts = C.pts.slice(0, n + 1);
  if (p < 1) { const f = p * (C.pts.length - 1) - (n - 1), a = C.pts[n - 1], b = C.pts[Math.min(C.pts.length - 1, n)]; if (a && b && f < 1) pts[pts.length - 1] = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
  const line = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.save(); c.translate(0.8, 1.6); c.strokeStyle = 'rgba(10,5,0,0.5)'; c.lineWidth = w0 * 1.2; line(); c.stroke(); c.restore();
  c.strokeStyle = `rgb(${C.col})`; c.lineWidth = w0; line(); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = Math.max(0.6, w0 * 0.28); c.save(); c.translate(-w0 * 0.15, -w0 * 0.2); line(); c.stroke(); c.restore();
  // the glow (the cable's light, 'lighter')
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.34; c.strokeStyle = `rgb(${C.col})`; c.lineWidth = w0 * 3.2; line(); c.stroke(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  // the plug at the head: a brass sleeve along the cable's last direction
  const [hx, hy] = pts[pts.length - 1], [px, py] = pts[Math.max(0, pts.length - 2)], dx = hx - px, dy = hy - py, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  c.strokeStyle = '#3a2408'; c.lineWidth = w0 * 1.9; c.beginPath(); c.moveTo(hx - ux * w0 * 3, hy - uy * w0 * 3); c.lineTo(hx, hy); c.stroke();
  c.strokeStyle = '#e8b85a'; c.lineWidth = w0 * 1.4; c.beginPath(); c.moveTo(hx - ux * w0 * 2.8, hy - uy * w0 * 2.8); c.lineTo(hx - ux * w0 * 0.3, hy - uy * w0 * 0.3); c.stroke();
  c.strokeStyle = 'rgba(255,248,220,0.7)'; c.lineWidth = Math.max(0.5, w0 * 0.35); c.beginPath(); c.moveTo(hx - ux * w0 * 2.6 - uy * w0 * 0.3, hy - uy * w0 * 2.6 + ux * w0 * 0.3); c.lineTo(hx - ux * w0 * 0.6 - uy * w0 * 0.3, hy - uy * w0 * 0.6 + ux * w0 * 0.3); c.stroke();
}

export default {
  id: 'devSwitch', tier: 'legendary', bleed: 10, stillT: 6.4,
  draw(c, s, t, Q) {
    const { w, h } = s, full = !!s.opts.full, rad = s.opts.radius || 12, dpr = bakeDpr(Q), still = Q.still, q = Q.q || 1;
    const tt = still ? 6.4 : t % LOOP, L = layoutOf(w, h, full), cables = cablesOf(L, w, h);
    const bp = still ? 0.2 : beatPhase(t), beatK = Math.exp(-bp * 5);
    c.save(); rrect(c, 0, 0, w, h, rad); c.clip();
    // THE LAMP's beam (behind the jacks' shine), its dust motes
    c.globalCompositeOperation = 'lighter';
    { const [bx, by, bw, bh] = L.beam; c.save(); c.translate(bx, by); c.rotate(-0.55); c.globalAlpha = 0.32; c.drawImage(beamSpr(), -bw * 0.25, 0, bw * 0.5, bh); c.restore(); }
    { const r = rng(9), n = Math.round((full ? 44 : 16) * q), spr = glow('255,236,200', 0.35, 32);
      for (let i = 0; i < n; i++) {
        const u = r(), v = r(), sp = 0.012 + r() * 0.02, ph = r() * 50;
        const x = fract(u + (still ? 0 : t) * sp) * w, y = fract(v + (still ? 0 : t) * sp * 0.4 + Math.sin((still ? 0 : t) * 0.6 + ph) * 0.01) * h;
        const along = (x / w) * 0.7 - (y / h) * 0.55 + 0.1, inBeam = Math.max(0, 1 - Math.abs(along - 0.2) * 3.2);
        if (inBeam < 0.05) continue;
        stamp(c, spr, x, y, (full ? 2.6 : 1.8) * (0.6 + r()), 0.55 * inBeam * (0.5 + 0.5 * Math.sin((still ? 0 : t) * 2 + ph)));
      } }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // THE PANEL (baked)
    c.drawImage(panel(L, w, h, dpr), 0, 0, w, h);
    // the jacks' lamps: lit while a cable sits in that jack (its colour), a few others idling (warm, dim, twinkling)
    c.globalCompositeOperation = 'lighter';
    const lampOf = new Map();
    for (const C of cables) { const p = still ? 1 : reach(C, tt); if (p >= 0.999) { lampOf.set(C.to, C.col); if (C.from >= 0) lampOf.set(C.from, C.col); } }
    L.jacks.forEach(([x, y], i) => {
      const r = L.r, col = lampOf.get(i);
      const idle = !col && (i * 7) % 5 === 1 ? 0.25 + 0.25 * Math.sin((still ? 0 : t) * 1.3 + i) : 0;
      if (col || idle > 0.05) { stamp(c, glow(col || '255,190,110', 0.3, 32), x, y - r * 1.75, r * (col ? 3.4 : 2), col ? 0.95 : idle); stamp(c, glow('255,255,255', 0.5, 16), x, y - r * 1.75, r * 0.7, col ? 0.9 : idle * 0.6); }
    });
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // THE CABLES — snaking in, plugging, the light running along them on the beat
    const w0 = full ? Math.max(2.2, L.r * 0.5) : Math.max(1.6, L.r * 0.45);
    for (const C of cables) {
      const p = still ? 1 : reach(C, tt);
      if (p <= 0.001) continue;
      drawCable(c, C, p, w0);
      c.globalCompositeOperation = 'lighter';
      // the spark as it lands
      const e = tt - (C.t0 + 0.85);
      if (!still && e >= 0 && e < 0.55) {
        const [x, y] = C.end, f = 1 - e / 0.55, r = rng(31 + C.t0 * 10);
        stamp(c, glow('255,240,200', 0.3, 32), x, y, L.r * 6 * f, 0.9 * f);
        for (let j = 0; j < Math.round(9 * q); j++) { const a = r() * Math.PI * 2, v = (12 + r() * 26) * (full ? 1 : 0.6); stamp(c, sparkle('255,236,190'), x + Math.cos(a) * v * e, y + Math.sin(a) * v * e + 30 * e * e, (full ? 7 : 4.5) * f, f); }
      }
      // the pulse: a bead of light running down the plugged cable, once a beat
      if (p >= 0.999) {
        const u = still ? 0.5 : bp, idx = u * (C.pts.length - 1), i0 = Math.floor(idx), f = idx - i0, a = C.pts[i0], b = C.pts[Math.min(C.pts.length - 1, i0 + 1)];
        const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
        stamp(c, glow(C.col, 0.25, 32), x, y, w0 * 7, 0.8); stamp(c, glow('255,255,255', 0.5, 16), x, y, w0 * 2.2, 0.9);
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    // ON AIR — buzzing on with a stutter, humming; a buzz-flicker now + then
    { const [x, y, bw, bh] = L.air, on = still ? 1 : ignite(tt, 0.25, 1) * (1 - smooth(9.7, 9.95, tt));
      const buzz = still ? 1 : (fract(t * 0.23) < 0.02 ? 0.45 : 1) * hum(t, 3), a = on * buzz;
      c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,40,30', 0.12, 64), x + bw / 2, y + bh / 2, bw * 1.5, 0.45 * a, bh * 2.4); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      airSign(bw, bh).forEach((T, i) => drawTube(c, T, 1, dpr, x, y, a * (still ? 1 : hum(t, i + 7)))); }
    // THE METER (full): the needle to the level; the level lamps dancing (green → amber → red)
    const lvl = still ? 0.62 : Math.min(1, 0.3 + 0.55 * beatK + 0.12 * Math.sin(t * 7.1) * Math.sin(t * 3.3));
    if (L.vu) {
      const [x, y, bw, bh] = L.vu, cx = x + bw / 2, cy = y + bh * 0.92, R = bh * 0.8, a = -Math.PI / 2 - 0.9 + lvl * 1.8;
      c.strokeStyle = '#1a1008'; c.lineWidth = 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.stroke();
      c.fillStyle = '#3a2a18'; c.beginPath(); c.arc(cx, cy, 2.2, 0, Math.PI * 2); c.fill();
      c.globalCompositeOperation = 'lighter'; stamp(c, glow('255,210,140', 0.2, 32), cx, y + bh * 0.4, bw * 1.2, 0.18, bh); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    { const [x, y, bw, n] = L.leds, lit = Math.round(lvl * n);
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) { if (i >= lit) continue; const lx = x + bw * (i + 0.5) / n, col = i >= n * 0.8 ? '255,60,40' : i >= n * 0.55 ? '255,190,60' : '110,255,140', r = Math.min(4, bw / n * 0.32); stamp(c, glow(col, 0.35, 32), lx, y, r * 4, 0.95); stamp(c, glow('255,255,255', 0.6, 16), lx, y, r * 1.1, 0.8); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    // the glint sliding across the brass
    if (!still) { const g = fract(t / 6.5); if (g < 0.28) { const gx = -w * 0.3 + (w * 1.6) * (g / 0.28); c.globalCompositeOperation = 'lighter'; c.save(); c.translate(gx, h / 2); c.rotate(-0.6); c.globalAlpha = 0.22; c.drawImage(glintSpr(), -h * 0.35, -h * 1.2, h * 0.7, h * 2.4); c.restore(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; } }
    c.restore();
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    drawLaser(c, w, h, t, { rgb: '255,206,110', rgb2: '255,50,40', still, radius: rad });
  },
};
