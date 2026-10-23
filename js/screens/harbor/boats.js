// CITY 2.0 — THE HARBOR, Part 5: THE BOATS (docs/harbor.md#the-boats). Each sails on the clock (core/harbor-boats.js: the
// routes, pure + tested) and is drawn from a SPRITE per look (built when the tones change, a few times a day) + its lights:
//
//   ROSIE      the riverboat: a white hull with a red boot stripe, three decks of arched windows, the pilothouse, twin black
//              stacks with feathered crowns, the red paddlewheel at her stern (it turns while she moves), flagstaffs; at night
//              every window warm and STRINGS OF BULBS from the bow staff over the stacks to the stern staff (a scheme hook:
//              set({ rosie: 'valentine' }) — 11c's dinner cruise; 'parade' — 11b's lit boat parade)
//   THE TAXI   a yellow water taxi with its checker band, zipping across in front of the pier head, bow up, spray
//   THE TUG    (night) red + black, its fender at the bow, the wheelhouse high, the stack, the towing lights on the mast
//   SAILBOATS  (day) a white sloop, main + jib catching the light on the sun's side, heeling in the real wind
//
// Every boat: a gentle bob, running lights at night (green to starboard — the side we see when she heads right — red to port,
// the white masthead + stern lights), a WAKE drawn every frame from its own past path (the foam stays where the hull passed and
// spreads + fades: a Kelvin V + the churn at the stern; the paddlewheel's wash), and its REFLECTION (water.reflect, about its own
// waterline; the taxi's own per frame — it is too fast for the mirror's 10 a second).
import { project } from '../../core/harbor-layout.js';
import { boatRoutes, boatAt } from '../../core/harbor-boats.js';
import { mix, rgb, shade, clamp01 } from './shapes.js';
import { LEVEL, axisAt } from './water.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const WAKE = { rosie: { life: 10, spread: 0.55, n: 16 }, taxi: { life: 3.4, spread: 1.6, n: 14 }, tug: { life: 8, spread: 0.6, n: 12 }, sail: { life: 6, spread: 0.45, n: 10 } };
const BULBS = { city: [[255, 214, 140]], valentine: [[255, 90, 140], [255, 200, 220]], parade: [[255, 70, 70], [80, 255, 120], [255, 214, 120], [90, 160, 255]], party: [[255, 70, 190], [70, 220, 255], [255, 214, 90]], halloween: [[255, 140, 30], [170, 70, 255]], christmas: [[255, 60, 60], [80, 255, 120], [255, 236, 200]] };

function cvs(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }

export function createBoats() {
  let L = null, cam = null, dpr = 2, tier = 2, routes = [], states = [], lookKey = '', rosieScheme = 'city', mb = 0;
  const spr = new Map();                 // id → { body, lights, ox, oy, w, h }
  let dot = null;
  const glow = () => { if (dot) return dot; dot = cvs(32, 32); const x = safeCtx(dot), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); return dot; };

  function layout(l, o) {
    L = l; cam = l.cam; dpr = Math.min(2, o.dpr || 1); tier = o.tier ?? 2;
    routes = boatRoutes(L, { taxi: !!o.taxi }); lookKey = '';
  }

  // ---------------------------------------------------------------- the sprites (facing right; origin = the waterline's middle)
  // (the sailboats' heel + the taxi's bow-up pitch are BAKED into their sprites — every boat is then drawn axis-aligned, a flip
  // at most: a rotated image is the slow path; the heel follows the real wind in steps)
  function build(T, heel = 0) {
    const hb = Math.round(heel * 40) / 40;
    const key = `${Math.round(T.day * 6)}${Math.round(T.gold * 6)}${Math.round(T.night * 6)}|${T.sunDir || 0}|${cam.F.toFixed(0)}|${dpr}|${rosieScheme}|${hb}`;
    if (key === lookKey) return;
    lookKey = key;
    for (const s of spr.values()) { s.body.width = 0; if (s.lights) s.lights.width = 0; if (s.bodyL) s.bodyL.width = 0; }
    spr.clear();
    const day = clamp01(T.day + 0.8 * T.gold), night = T.night, gold = T.gold / Math.max(0.01, T.day + T.gold);
    const lit = (c, k = 1) => mix(mix(c, shade(c, 0.12), day * 0.5), mix(c, [30, 26, 48], 0.86), night * k);
    let nameAt = null;
    for (const r of routes) {
      const u = cam.F / r.z, len = r.len * u, top = (r.kind === 'sail' ? r.h + 1 : r.h + 1.6) * u;
      const W = len + 8 + (r.kind === 'rosie' ? 2 * u : 0), H = top + 2 * u + 4, ox = W / 2, oy = top + 2;
      const body = cvs(W * dpr, H * dpr), x = safeCtx(body);
      x.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
      if (r.kind === 'sail' && hb) x.rotate(-hb * 0.6);
      if (r.kind === 'taxi') x.rotate(-0.035);
      const lights = night > 0.05 ? cvs(W * dpr, H * dpr) : null, g = lights && safeCtx(lights);
      if (g) { g.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr); if (r.kind === 'taxi') g.rotate(-0.035); g.globalCompositeOperation = 'lighter'; }
      const X = a => (a - r.len / 2) * u, Y = y => -y * u;
      const bulb = (px, py, col, rr = 1, k = 1) => { if (!g) return; g.globalAlpha = k; const d = glow(); const s = Math.max(1.2, u * 0.32) * rr; g.drawImage(d, px - s, py - s, s * 2, s * 2); g.fillStyle = `rgba(${col},1)`; g.globalAlpha = 1; };
      const warmWin = [255, 204, 128];
      if (r.kind === 'rosie') nameAt = drawRosie(x, g, X, Y, u, r, lit, day, night, gold, T, bulb, warmWin);
      else if (r.kind === 'taxi') drawTaxi(x, g, X, Y, u, r, lit, day, night, bulb);
      else if (r.kind === 'tug') drawTug(x, g, X, Y, u, r, lit, day, night, bulb);
      else drawSail(x, X, Y, u, r, lit, day, night, gold, T);
      // Rosie's name reads the right way whichever way she heads: a pre-mirrored sprite for heading left, each with the name
      let bodyL = null;
      if (r.kind === 'rosie' && nameAt) {
        bodyL = cvs(W * dpr, H * dpr);
        const y = safeCtx(bodyL); y.setTransform(-1, 0, 0, 1, W * dpr, 0); y.drawImage(body, 0, 0);
        const nm = (cx, px) => { cx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr); cx.fillStyle = nameAt.col; cx.font = `700 ${nameAt.px.toFixed(1)}px "Chakra Petch", system-ui, sans-serif`; cx.textAlign = 'center'; cx.fillText('ROSIE', px, nameAt.y); };
        nm(x, nameAt.x); nm(y, -nameAt.x);
      }
      spr.set(r.id, { body, bodyL, lights, ox, oy, w: W, h: H });
    }
    mb = [...spr.values()].reduce((s, o) => s + o.body.width * o.body.height * 4 * (o.bodyL ? 2 : 1) + (o.lights ? o.lights.width * o.lights.height * 4 : 0), 0) / 1e6;
  }

  function drawRosie(x, g, X, Y, u, r, lit, day, night, gold, T, bulb, warmWin) {
    let nameAt = null;
    const white = lit([244, 240, 230]), red = lit([180, 34, 44]), dark = lit([30, 28, 36], 0.4), trim = lit([206, 170, 90]), shadeW = shade(white, -0.18);
    const sun = T.sunDir || 0;
    // the hull: a long white hull, its sheer rising to the bow, the red boot stripe, the dark bottom at the waterline
    x.fillStyle = rgb(white);
    x.beginPath(); x.moveTo(X(0.6), Y(1.5)); x.lineTo(X(22.6), Y(1.6)); x.quadraticCurveTo(X(24.2), Y(1.9), X(24), Y(2.1)); x.lineTo(X(23.2), Y(-0.1)); x.lineTo(X(1.2), Y(-0.1)); x.quadraticCurveTo(X(0.2), Y(0.4), X(0.6), Y(1.5)); x.fill();
    x.fillStyle = rgb(red); x.fillRect(X(1), Y(0.55), X(23.1) - X(1), u * 0.32);
    x.fillStyle = rgb(dark); x.fillRect(X(1.1), Y(0.12), X(23.1) - X(1.1), u * 0.22);
    x.fillStyle = rgb(shade(white, 0.15)); x.fillRect(X(0.8), Y(1.62), X(22.8) - X(0.8), Math.max(0.4, u * 0.1));   // the rub rail
    // THE PADDLEWHEEL HOUSING at the stern (the wheel itself turns: drawn per frame), its name board
    x.fillStyle = rgb(red); x.beginPath(); x.moveTo(X(-1.4), Y(1.5)); x.lineTo(X(-1.4), Y(3.6)); x.quadraticCurveTo(X(0.5), Y(4.6), X(2.2), Y(3.6)); x.lineTo(X(2.2), Y(1.5)); x.closePath(); x.fill();
    x.strokeStyle = rgb(trim); x.lineWidth = Math.max(0.4, u * 0.08); x.stroke();
    x.fillStyle = rgb(shade(red, -0.35)); for (let i = 0; i < 5; i++) x.fillRect(X(-1.2 + i * 0.75), Y(3.3), Math.max(0.35, u * 0.09), u * 1.7);
    // decks: the main cabin, the promenade deck (open, columns + rail), the texas deck, the pilothouse
    const deck = (a0, a1, y0, y1, col) => { x.fillStyle = rgb(col); x.fillRect(X(a0), Y(y1), X(a1) - X(a0), (y1 - y0) * u); };
    deck(2.4, 21.8, 1.6, 3.9, white);
    deck(2.1, 22.2, 3.9, 4.15, shade(white, 0.1));                                     // the deck's edge, catching the light
    deck(4.2, 19.6, 4.15, 6.1, shadeW);
    deck(4, 19.8, 6.1, 6.35, shade(white, 0.1));
    deck(8.6, 15.4, 6.35, 7.7, white);
    deck(12.4, 15, 7.7, 9.0, white);
    x.fillStyle = rgb(shade(red, -0.1)); x.fillRect(X(12.2), Y(9.25), X(15.2) - X(12.2), u * 0.3);            // the pilothouse roof
    // relief: the shadow under each deck's overhang, the cabins lighter toward their tops, the hull rounding under into shade
    for (const [a0, a1, y] of [[2.4, 21.8, 3.9], [4.2, 19.6, 6.1], [8.6, 15.4, 7.7]]) { x.fillStyle = `rgba(20,16,30,${0.28 + 0.2 * night})`; x.fillRect(X(a0), Y(y) , X(a1) - X(a0), Math.max(0.5, u * 0.22)); }
    { const gh = x.createLinearGradient(0, Y(1.6), 0, Y(-0.1)); gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(1, `rgba(10,10,30,${0.22 + 0.2 * day})`); x.fillStyle = gh; x.fillRect(X(0.8), Y(1.6), X(23.2) - X(0.8), 1.7 * u); }
    // lifebuoys on the main deck's rail, her name on the paddle box
    for (const a of [6.1, 18.4]) { x.strokeStyle = rgb(lit([236, 96, 40])); x.lineWidth = Math.max(0.4, u * 0.12); x.beginPath(); x.arc(X(a), Y(2.45), 0.32 * u, 0, Math.PI * 2); x.stroke(); }
    nameAt = { x: X(0.4), y: Y(2.75), px: Math.max(3, 0.62 * u), col: rgb(trim) };
    // the sunlit side of the cabins (a soft light on the faces toward the sun by day)
    if (day > 0.15) { const gg = x.createLinearGradient(X(2), 0, X(22), 0); const a = 0.16 * day; gg.addColorStop(0, `rgba(255,250,236,${sun < 0 ? a : 0})`); gg.addColorStop(1, `rgba(255,250,236,${sun > 0 ? a : 0})`); x.fillStyle = gg; x.fillRect(X(2.4), Y(9), X(21.8) - X(2.4), 7.4 * u); }
    // the windows: arched on the main deck, square on the promenade, the pilothouse all round
    const win = night > 0.35 ? warmWin : mix([70, 96, 126], [170, 196, 214], day * 0.5);
    x.fillStyle = rgb(win);
    for (let a = 3.2; a < 21.2; a += 1.05) { x.beginPath(); x.roundRect(X(a), Y(3.4), 0.62 * u, 1.25 * u, [0.31 * u, 0.31 * u, 0, 0]); x.fill(); }
    for (let a = 5.0; a < 19; a += 1.15) x.fillRect(X(a), Y(5.6), 0.72 * u, 0.95 * u);
    for (let a = 9.3; a < 15; a += 1.1) x.fillRect(X(a), Y(7.35), 0.6 * u, 0.7 * u);
    x.fillRect(X(12.8), Y(8.75), (15 - 12.8 - 0.4) * u, 0.75 * u);
    // the promenade deck's columns + railing (in front of its windows)
    x.strokeStyle = rgb(white); x.lineWidth = Math.max(0.35, u * 0.09);
    x.beginPath(); for (let a = 4.4; a <= 19.6; a += 1.9) { x.moveTo(X(a), Y(4.15)); x.lineTo(X(a), Y(6.1)); } x.moveTo(X(4.2), Y(4.8)); x.lineTo(X(19.6), Y(4.8)); x.stroke();
    x.strokeStyle = rgb(trim, 0.9); x.lineWidth = Math.max(0.3, u * 0.06); x.beginPath(); x.moveTo(X(2.4), Y(3.95)); x.lineTo(X(21.8), Y(3.95)); x.moveTo(X(4.2), Y(6.15)); x.lineTo(X(19.6), Y(6.15)); x.stroke();
    // TWIN STACKS: black, feathered crowns, a gold band; forward of the pilothouse
    for (const a of [16.4, 17.6]) {
      x.fillStyle = rgb(lit([22, 20, 26], 0.3)); x.fillRect(X(a) - 0.3 * u, Y(11.2), 0.6 * u, (11.2 - 6.3) * u);
      x.fillStyle = rgb(trim); x.fillRect(X(a) - 0.32 * u, Y(9.4), 0.64 * u, 0.25 * u);
      x.fillStyle = rgb(lit([22, 20, 26], 0.3)); x.beginPath(); for (let i = 0; i < 5; i++) { const px = X(a) - 0.55 * u + i * 0.275 * u; x.moveTo(px, Y(11.2)); x.lineTo(px + 0.14 * u, Y(11.75)); x.lineTo(px + 0.275 * u, Y(11.2)); } x.fill();
      if (day > 0.15) { x.fillStyle = `rgba(255,255,255,${0.25 * day})`; x.fillRect(X(a) + (sun >= 0 ? 0.12 : -0.28) * u, Y(11.1), 0.12 * u, 4.6 * u); }
    }
    // the flagstaffs (bow + stern) + their pennants
    x.strokeStyle = rgb(dark); x.lineWidth = Math.max(0.3, u * 0.06);
    x.beginPath(); x.moveTo(X(23.6), Y(2)); x.lineTo(X(23.6), Y(5.2)); x.moveTo(X(-0.9), Y(3.6)); x.lineTo(X(-0.9), Y(6.4)); x.stroke();
    x.fillStyle = rgb(red); x.beginPath(); x.moveTo(X(23.6), Y(5.2)); x.lineTo(X(24.6), Y(4.95)); x.lineTo(X(23.6), Y(4.7)); x.fill();
    x.beginPath(); x.moveTo(X(-0.9), Y(6.4)); x.lineTo(X(-2), Y(6.1)); x.lineTo(X(-0.9), Y(5.8)); x.fill();
    // the bulb strings: bow staff → the stacks' tops → stern staff (sagging between): small white bulbs by day, LIGHT at night
    const runs = [[[23.6, 5.2], [17.6, 11.2]], [[17.6, 11.2], [16.4, 11.2]], [[16.4, 11.2], [-0.9, 6.4]]];
    const cols = BULBS[rosieScheme] || BULBS.city;
    let bi = 0;
    for (const [[a0, y0], [a1, y1]] of runs) {
      const n = Math.max(2, Math.round(Math.hypot(a1 - a0, y1 - y0) / 0.75));
      x.strokeStyle = rgb(dark, 0.6); x.lineWidth = 0.3; x.beginPath();
      for (let i = 0; i <= n; i++) {
        const t = i / n, sag = Math.sin(Math.PI * t) * Math.min(1.3, Math.abs(a1 - a0) * 0.06), px = X(a0 + (a1 - a0) * t), py = Y(y0 + (y1 - y0) * t - sag);
        if (i) x.lineTo(px, py); else x.moveTo(px, py);
        if (i % 1 === 0) { x.save(); x.fillStyle = `rgba(250,246,230,${0.7 * day + 0.1})`; x.fillRect(px - 0.3, py - 0.3, 0.6, 0.6); x.restore(); if (g && i > 0 && i < n) { const c = cols[bi++ % cols.length]; bulb(px, py, c.join(','), 1.15, 1); g.fillStyle = `rgb(${mix(c, [255, 255, 255], 0.6).map(Math.round)})`; g.beginPath(); g.arc(px, py, Math.max(0.35, u * 0.07), 0, Math.PI * 2); g.fill(); } }
      }
      x.stroke();
    }
    // her lights at night: every window's glow, the deck lamps along the main deck
    if (g) {
      g.globalAlpha = 0.5; g.fillStyle = 'rgba(255,190,110,1)';
      for (const [a0, a1, y] of [[3, 21.4, 4.0], [5, 19, 6.1], [9.3, 14.9, 7.7]]) { const gg = g.createLinearGradient(0, Y(y), 0, Y(y - 1.6)); gg.addColorStop(0, 'rgba(255,190,110,0)'); gg.addColorStop(1, 'rgba(255,190,110,0.5)'); g.fillStyle = gg; g.fillRect(X(a0), Y(y), X(a1) - X(a0), 1.6 * u); }
      g.globalAlpha = 1;
      for (let a = 3; a < 22; a += 2.4) bulb(X(a), Y(3.95), '255,214,150', 0.8, 0.6);
    }
    return nameAt;
  }
  function drawTaxi(x, g, X, Y, u, r, lit, day, night, bulb) {
    const yellow = lit([244, 196, 40]), white = lit([240, 238, 230]), black = lit([24, 22, 28], 0.3);
    // the hull: yellow, a raked bow, its checker band, the dark bottom
    x.fillStyle = rgb(yellow); x.beginPath(); x.moveTo(X(0), Y(1.25)); x.lineTo(X(5.2), Y(1.3)); x.quadraticCurveTo(X(6.2), Y(1.35), X(6.15), Y(1.0)); x.lineTo(X(5.5), Y(-0.05)); x.lineTo(X(0.25), Y(-0.05)); x.closePath(); x.fill();
    const cs = 0.3 * u; for (let i = 0; i * cs < X(5.6) - X(0.3); i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? rgb(black) : rgb(white); x.fillRect(X(0.3) + i * cs, Y(0.95) + j * cs * 0.8, cs, cs * 0.8); }
    x.fillStyle = rgb(black); x.fillRect(X(0.2), Y(0.12), X(5.6) - X(0.2), 0.2 * u);
    // the cabin: white, its windows, the roof + a little mast with the flag
    x.fillStyle = rgb(white); x.beginPath(); x.roundRect(X(1.1), Y(2.45), X(4.4) - X(1.1), 1.2 * u, [0.3 * u, 0.5 * u, 0, 0]); x.fill();
    x.fillStyle = night > 0.35 ? 'rgb(255,214,150)' : rgb(mix([60, 84, 110], [160, 190, 210], day * 0.5));
    for (let a = 1.35; a < 4.1; a += 0.72) x.fillRect(X(a), Y(2.2), 0.5 * u, 0.55 * u);
    x.fillStyle = rgb(yellow); x.fillRect(X(1.0), Y(2.6), X(4.5) - X(1.0), 0.18 * u);
    x.strokeStyle = rgb(black); x.lineWidth = Math.max(0.3, u * 0.05); x.beginPath(); x.moveTo(X(1.5), Y(2.6)); x.lineTo(X(1.5), Y(3.5)); x.stroke();
    x.fillStyle = rgb(lit([60, 120, 220])); x.fillRect(X(1.5), Y(3.5), -0.55 * u, 0.32 * u);
    if (g) { g.globalAlpha = 0.45; const gg = g.createRadialGradient(X(2.7), Y(1.9), 0, X(2.7), Y(1.9), 1.8 * u); gg.addColorStop(0, 'rgba(255,200,120,0.8)'); gg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gg; g.fillRect(X(0.5), Y(3.4), 4 * u, 2.6 * u); g.globalAlpha = 1; }
  }
  function drawTug(x, g, X, Y, u, r, lit, day, night, bulb) {
    const red = lit([176, 36, 36]), black = lit([22, 20, 26], 0.3), cream = lit([236, 226, 200]), buff = lit([200, 160, 90]);
    x.fillStyle = rgb(black); x.beginPath(); x.moveTo(X(0.2), Y(1.3)); x.lineTo(X(8.3), Y(1.6)); x.quadraticCurveTo(X(9.6), Y(1.8), X(9.4), Y(1.0)); x.lineTo(X(8.6), Y(-0.05)); x.lineTo(X(0.5), Y(-0.05)); x.closePath(); x.fill();
    x.fillStyle = rgb(red); x.fillRect(X(0.4), Y(1.25), X(8.5) - X(0.4), 0.5 * u);
    x.fillStyle = rgb(shade(black, 0.1)); x.beginPath(); x.ellipse(X(9.15), Y(1.0), 0.55 * u, 0.75 * u, 0, 0, Math.PI * 2); x.fill();   // the bow fender
    x.fillStyle = rgb(shade(black, 0.15)); for (let a = 1; a < 8.3; a += 1.2) { x.beginPath(); x.arc(X(a), Y(1.0), 0.28 * u, 0, Math.PI * 2); x.fill(); }   // tyre fenders
    x.fillStyle = rgb(cream); x.fillRect(X(2.4), Y(3.1), X(6.6) - X(2.4), 1.4 * u);
    x.fillRect(X(4.2), Y(4.3), X(6.8) - X(4.2), 1.2 * u);
    x.fillStyle = rgb(red); x.fillRect(X(4), Y(4.45), X(7) - X(4), 0.18 * u);
    x.fillStyle = night > 0.35 ? 'rgb(255,206,130)' : rgb(mix([60, 84, 110], [160, 190, 210], day * 0.5)); for (let a = 4.5; a < 6.6; a += 0.7) x.fillRect(X(a), Y(4.1), 0.48 * u, 0.6 * u);
    x.fillStyle = night > 0.35 ? 'rgb(120,96,70)' : rgb(shade(cream, -0.3)); for (let a = 2.8; a < 4; a += 0.8) x.fillRect(X(a), Y(2.7), 0.45 * u, 0.5 * u);
    x.fillStyle = rgb(buff); x.fillRect(X(2.7), Y(5.2), 0.9 * u, 2.1 * u); x.fillStyle = rgb(black); x.fillRect(X(2.65), Y(5.2), 1.0 * u, 0.4 * u); x.fillStyle = rgb(red); x.fillRect(X(2.7), Y(4.6), 0.9 * u, 0.3 * u);
    x.strokeStyle = rgb(black); x.lineWidth = Math.max(0.3, u * 0.08); x.beginPath(); x.moveTo(X(6), Y(5.5)); x.lineTo(X(6), Y(r.h + 1.4)); x.stroke();
    if (g) { bulb(X(6), Y(r.h + 1.3), '255,250,236', 1.2, 1); bulb(X(6), Y(r.h + 0.7), '255,250,236', 1.2, 1); bulb(X(0.4), Y(2.2), '255,250,236', 0.9, 0.8); g.globalAlpha = 0.4; const gg = g.createRadialGradient(X(5.5), Y(4.6), 0, X(5.5), Y(4.6), 2 * u); gg.addColorStop(0, 'rgba(255,200,120,0.9)'); gg.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gg; g.fillRect(X(3.3), Y(6.6), 4.4 * u, 4 * u); g.globalAlpha = 1; }
  }
  function drawSail(x, X, Y, u, r, lit, day, night, gold, T) {
    const hull = lit([246, 244, 238]), stripe = lit([30, 70, 140]), sail = mix(mix([252, 250, 244], [255, 224, 196], gold), [70, 66, 90], night), sailShade = shade(sail, -0.16);
    x.fillStyle = rgb(hull); x.beginPath(); x.moveTo(X(0.2), Y(0.9)); x.lineTo(X(5.6), Y(1.0)); x.quadraticCurveTo(X(6.6), Y(1.05), X(6.5), Y(0.8)); x.lineTo(X(5.6), Y(-0.05)); x.lineTo(X(0.8), Y(-0.05)); x.closePath(); x.fill();
    x.fillStyle = rgb(stripe); x.fillRect(X(0.5), Y(0.55), X(6) - X(0.5), Math.max(0.4, 0.14 * u));
    x.fillStyle = rgb(shade(hull, -0.2)); x.fillRect(X(2.2), Y(1.35), X(3.8) - X(2.2), 0.4 * u);
    // the mast, the boom; the mainsail (a curved leech) + the jib, each lit on its side toward the sun
    const m = 3.1;
    x.strokeStyle = rgb(lit([60, 56, 60])); x.lineWidth = Math.max(0.35, u * 0.07);
    x.beginPath(); x.moveTo(X(m), Y(0.9)); x.lineTo(X(m), Y(r.h)); x.moveTo(X(m), Y(1.6)); x.lineTo(X(0.7), Y(1.55)); x.stroke();
    const gm = x.createLinearGradient(X(0.8), 0, X(m), 0); gm.addColorStop(0, rgb((T.sunDir || 0) < 0 ? sail : sailShade)); gm.addColorStop(1, rgb((T.sunDir || 0) < 0 ? sailShade : sail));
    x.fillStyle = gm; x.beginPath(); x.moveTo(X(m - 0.08), Y(r.h - 0.2)); x.quadraticCurveTo(X(1.3), Y(r.h * 0.45), X(0.8), Y(1.7)); x.lineTo(X(m - 0.08), Y(1.7)); x.closePath(); x.fill();
    const gj = x.createLinearGradient(X(m), 0, X(6.3), 0); gj.addColorStop(0, rgb(sailShade)); gj.addColorStop(1, rgb(sail));
    x.fillStyle = gj; x.beginPath(); x.moveTo(X(m + 0.12), Y(r.h - 0.9)); x.quadraticCurveTo(X(5.2), Y(r.h * 0.42), X(6.2), Y(1.15)); x.lineTo(X(m + 0.12), Y(1.5)); x.closePath(); x.fill();
    x.strokeStyle = `rgba(0,0,0,${0.12 + 0.1 * night})`; x.lineWidth = 0.3; x.beginPath(); x.moveTo(X(m - 0.1), Y(r.h * 0.66)); x.lineTo(X(1.5), Y(r.h * 0.6)); x.moveTo(X(m - 0.1), Y(r.h * 0.36)); x.lineTo(X(1.1), Y(r.h * 0.32)); x.stroke();   // the batten seams
  }

  // ---------------------------------------------------------------- per frame
  /** the boats' places now (once a frame): ms = the clock, nightAt(ms) → bool (a day / night boat, per cycle) */
  // THE THINNING (the owner's call): while the water lane is QUIET (a big show: the party peak + the searchlights + a word; a
  // heavy event; tier 1's party night) the extra boats wait — the taxi skips its next crossing, the tug its next visit — decided
  // only while the boat is out of sight, so nothing pops; one already on the water finishes. Tier 0 (the calm city): the taxi
  // crosses every other time.
  const skipped = new Set();
  function tick(ms, nightAt, { quiet = false } = {}) {
    states = routes.map(r => {
      const st = { r, ...boatAt(r, ms, nightAt), ms };
      if (!r.thin) return st;
      if (!st.on && st.next != null && quiet) { skipped.add(`${r.id}|${st.next}`); if (skipped.size > 64) skipped.delete(skipped.values().next().value); }
      if (st.on && (skipped.has(`${r.id}|${st.run}`) || (tier === 0 && r.id === 'taxi' && st.run % 2 === 1))) { st.on = false; st.moving = false; st.seg = 'waits'; }
      return st;
    });
  }
  /** a boat on screen: its sprite at its place, its face (the turn), the bob + the heel; mirror: in the water's mirror */
  function drawOne(c, st, f, mirror) {
    const s = spr.get(st.r.id); if (!s) return;
    const r = st.r, [sx, sy] = project(cam, st.x, LEVEL, r.z), u = cam.F / r.z;
    const fast = r.kind === 'taxi';
    const bob = f.motion ? Math.sin(f.t * (fast ? 3.2 : 0.9) + r.z) * u * (fast ? 0.06 : 0.05) : 0;
    const face = Math.abs(st.face) < 0.06 ? 0.06 * Math.sign(st.face || 1) : st.face;
    c.save();
    c.translate(sx, sy + bob);
    if (s.bodyL && face < 0) { c.scale(-face, 1); c.drawImage(s.bodyL, -s.ox, -s.oy, s.w, s.h); c.scale(-1, 1); }
    else { c.scale(face, 1); c.drawImage(s.body, -s.ox, -s.oy, s.w, s.h); }
    if (s.lights && f.lights > 0.01) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, f.lights) * (mirror ? 0.9 : 1); c.drawImage(s.lights, -s.ox, -s.oy, s.w, s.h); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    // Rosie's paddlewheel (turning while she moves: its spokes + the wash's white water) — after the sprite
    if (r.kind === 'rosie' && tier > 0) {
      const wx = (-1.4 + 0.3 - r.len / 2) * u + 1.3 * u * 0.5, wy = -1.4 * u, rr = 1.55 * u, ang = (f.t * (st.moving ? 1.6 : 0.15)) % (Math.PI * 2);
      c.strokeStyle = rgb(mix([150, 30, 40], [40, 16, 26], f.T.night)); c.lineWidth = Math.max(0.35, u * 0.12);
      c.beginPath(); for (let i = 0; i < 8; i++) { const a = ang + i * Math.PI / 4; c.moveTo(wx + Math.cos(a) * rr * 0.25, wy + Math.sin(a) * rr * 0.25); c.lineTo(wx + Math.cos(a) * rr, wy + Math.sin(a) * rr); } c.stroke();
    }
    c.restore();
    // the running lights (never flipped: green to starboard — the side we see when she heads right — red to port)
    if (f.lights > 0.05 && !mirror) {
      const side = st.face >= 0 ? [90, 255, 140] : [255, 70, 60], [lx, ly] = project(cam, st.x + st.face * r.len * 0.36, 1.7, r.z), rr = Math.max(1.4, u * 0.45);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = f.lights * 0.9;
      c.drawImage(tint(side), lx - rr, ly - rr, rr * 2, rr * 2);
      c.restore();
    }
  }
  const tints = new Map();
  function tint(col) { const k = col.join(','); if (tints.has(k)) return tints.get(k); const c = cvs(32, 32), x = safeCtx(c), g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.2, `rgba(${k},0.9)`); g.addColorStop(1, `rgba(${k},0)`); x.fillStyle = g; x.fillRect(0, 0, 32, 32); tints.set(k, c); return c; }


  /** THE WAKE: the foam where the hull passed (anchored in the water, spreading + fading with age) — a Kelvin V (the near arm
   *  shows below the hull; the far arm half behind it), the churn behind the stern, a darker trough along the track */
  function wake(c, st, f) {
    const r = st.r, W = WAKE[r.kind]; if (!W || !st.on) return;
    const n = tier === 0 ? Math.ceil(W.n / 2) : W.n, nightK = f.T.night > 0.5;
    const foam = nightK ? '170,178,226' : '255,255,255', fk = nightK ? 0.5 : 0.9;
    // the samples: where the stern was `age` seconds ago (that water keeps the foam), how fast she went then — re-sampled 10
    // times a second (the foam fades over seconds); every frame only the head follows the hull
    const now = performance.now(), wc = wakeCache.get(r.id);
    let pts;
    let img = wc && wc.img;
    if (wc && now - wc.at < 95 && wc.n === n && wc.night === nightK) { pts = wc.pts; const h = pts[0]; if (h) h.stern = st.x - Math.sign(st.face || 1) * r.len * 0.47; }
    else {
      // (the older two thirds of the wake — it only fades — drawn once into its own small image at each re-sample)
      pts = sample(r, st, f, n, W);
      img = wakeImage(wc && wc.img && wc.img.cv, r, W, pts, f, nightK, fk, foam);
      wakeCache.set(r.id, { at: now, pts, n, night: nightK, img });
    }
    if (img && img.w > 0) c.drawImage(img.cv, img.x, img.y, img.w, img.h);
    if (r.kind === 'taxi') draw3(c, r, W, pts, f, nightK, fk, foam, [0]);      // (only the fast taxi's head is drawn live)
    // the bow wave (moving: a white curl at the stem)
    if (st.moving && Math.abs(st.face) > 0.5 && pts.length) { const [a, ya] = project(cam, st.x + st.face * r.len * 0.47, LEVEL, r.z - 0.2), s = cam.F / r.z; c.fillStyle = `rgba(${foam},${(0.6 * fk * Math.min(1, pts[0].v / 1.2)).toFixed(3)})`; c.beginPath(); c.ellipse(a, ya, s * (r.kind === 'taxi' ? 0.9 : 0.55), Math.max(0.45, s * 0.14), 0, 0, Math.PI * 2); c.fill(); }
  }
  const wakeCache = new Map();
  function sample(r, st, f, n, W) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const age = (i / n) * W.life, p = i ? boatAt(r, st.ms - age * 1000, f.nightAt) : st;
      if (!p.on) break;
      const q = boatAt(r, st.ms - age * 1000 + 250, f.nightAt), v = i ? Math.abs(q.x - p.x) * 4 : Math.abs(boatAt(r, st.ms - 250, f.nightAt).x - st.x) * 4;
      const dir = Math.sign(p.face || 1), stern = p.x - dir * r.len * 0.47;
      pts.push({ age, v, stern, spread: 0.2 + age * W.spread * Math.min(1.4, v / 2), k: (1 - age / W.life) * Math.min(1, v / 0.7) });
    }
    return pts;
  }
  // the older bands of a wake into a small image (screen-aligned; the foam stays where the hull passed, so it only fades)
  function wakeImage(cv, r, W, pts, f, nightK, fk, foam) {
    if (pts.length < 3) return null;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) for (const dz of [-p.spread, p.spread, -0.1]) { const [x, y] = project(cam, p.stern, LEVEL, r.z + dz); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    x0 = Math.floor(x0 - 4); y0 = Math.floor(y0 - 4); x1 = Math.ceil(x1 + 4); y1 = Math.ceil(y1 + 4);
    const w = Math.max(1, Math.min(cam.W + 40, x1 - x0)), h = Math.max(1, y1 - y0);
    cv = cv || cvs(1, 1);
    const cw = Math.ceil(w * dpr), ch = Math.ceil(h * dpr);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    const x = safeCtx(cv);
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cw, ch);
    x.setTransform(dpr, 0, 0, dpr, -x0 * dpr, -y0 * dpr);
    draw3(x, r, W, pts, f, nightK, fk, foam, r.kind === 'taxi' ? [1, 2] : [0, 1, 2]);
    return { cv, x: x0, y: y0, w, h };
  }
  // the foam drawn in three bands of strength per line (a stroke each — not one per segment); which: the bands to draw
  function draw3(c, r, W, pts, f, nightK, fk, foam, which = [0, 1, 2]) {
    if (pts.length < 2 || (pts[0].k < 0.02 && pts[1].k < 0.02)) return;
    c.save(); c.lineCap = 'round';
    const P = (x, dz) => project(cam, x, LEVEL, r.z + dz);
    // the wash on the track (white water right behind the stern, tapering + fading — Rosie's paddlewheel the most)
    const wash = r.kind === 'rosie' ? 0.62 : r.kind === 'taxi' ? 0.55 : 0.4;
    const s0 = cam.F / r.z, m = pts.length - 1, bands = [[0, Math.ceil(m / 3)], [Math.ceil(m / 3), Math.ceil(2 * m / 3)], [Math.ceil(2 * m / 3), m]];
    const line = (from, to, dz, al, lw) => {
      if (al < 0.02 || to <= from) return;
      c.strokeStyle = `rgba(${foam},${al.toFixed(3)})`; c.lineWidth = lw;
      c.beginPath();
      for (let i = from; i <= to; i++) { const p = pts[i], [x, y] = P(p.stern, dz(p)); if (i === from) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    };
    for (const [a, b] of which.map(i => bands[i])) {
      const mid = pts[(a + b) >> 1], k = mid.k, age = mid.age / W.life;
      line(a, b, () => -0.1, k * fk * wash, Math.max(0.5, s0 * (0.32 - 0.22 * age) * (r.kind === 'taxi' ? 1.2 : 1)));
      // the Kelvin V: two arms opening behind her — the near one below the hull, the far one fainter (half behind it)
      line(a, b, p => -p.spread, k * fk * 0.9, Math.max(0.45, s0 * 0.1));
      if (tier > 0) line(a, b, p => p.spread, k * fk * 0.45, Math.max(0.45, s0 * 0.09));      // (tier 0: the far arm, half hidden, off)
    }
    c.restore();
  }

  return {
    layout, tick,
    /** draw the boats between depths z0..z1 (far first) with their wakes. f: { t, T, lights, motion, heel, nightAt, fade } */
    draw(c, f, z0, z1) {
      if (!L || f.fade <= 0) return;
      build(f.T, f.heel || 0);
      c.save(); c.globalAlpha = f.fade;
      const list = states.filter(s => s.on && s.r.z >= z0 && s.r.z < z1).sort((a, b) => b.r.z - a.r.z);
      for (const st of list) {
        if (f.motion && !f.noWake && tier > 0) wake(c, st, f);          // (tier 0, the calm city: no wakes)
        // the taxi's own reflection, per frame (fast: the mirror's 10 a second would step it)
        if (st.r.kind === 'taxi' && tier > 0) { const ax = axisAt(L, st.r.z); c.save(); c.globalAlpha = f.fade * 0.38; c.translate(0, 2 * ax); c.scale(1, -1); drawOne(c, st, f, true); c.restore(); c.globalAlpha = f.fade; }
        drawOne(c, st, f, false);
      }
      c.restore();
    },
    /** the slow boats' reflections into the water's mirror (each about its own waterline) */
    mirrors(water, f) {
      if (!L || f.fade <= 0 || !spr.size) return;
      for (const st of states) if (st.on && (st.r.kind !== 'taxi' || tier === 0)) water.reflect(cx => { cx.save(); cx.globalAlpha = f.fade; drawOne(cx, st, f, true); cx.restore(); }, axisAt(L, st.r.z));
    },
    /** anything fast on the water (the taxi crossing): the scene keeps 60 fps */
    busy: () => states.some(s => s.on && s.moving && s.r.kind === 'taxi'),
    /** HOOKS: { rosie: 'city' | 'valentine' | 'parade' | 'party' | 'halloween' | 'christmas' } — her bulb strings (11b/11c, 10) */
    set(o) { if (o && o.rosie && BULBS[o.rosie] && o.rosie !== rosieScheme) { rosieScheme = o.rosie; lookKey = ''; } },
    setTier(t) { tier = t; },
    hit(x, y) { for (const st of states) if (st.on) { const r = st.r, [a, ya] = project(cam, st.x - r.len / 2, r.h, r.z), [b, yb] = project(cam, st.x + r.len / 2, LEVEL, r.z); if (x >= a - 4 && x <= b + 4 && y >= ya - 4 && y <= yb + 4) return r.id; } return null; },
    debug: () => ({ boats: states.map(s => ({ id: s.r.id, on: s.on, x: +project(cam, s.x, 0, s.r.z)[0].toFixed(1), face: +s.face.toFixed(2), seg: s.seg })), mb: +mb.toFixed(2), scheme: rosieScheme }),
    destroy() { for (const w of wakeCache.values()) if (w.img) w.img.cv.width = 0; wakeCache.clear(); for (const s of spr.values()) { s.body.width = 0; if (s.lights) s.lights.width = 0; if (s.bodyL) s.bodyL.width = 0; } spr.clear(); for (const t of tints.values()) t.width = 0; tints.clear(); if (dot) dot.width = 0; L = null; },
  };
}
