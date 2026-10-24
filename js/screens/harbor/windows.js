// CITY 2.0 — THE HARBOR, PART 7b: THE SPEAKEASY'S LIFE — the window MOMENTS drawn (the plan, the catalogue + the rooms' states:
// core/harbor-moments.js, PURE). The speakeasy's live layer (speakeasy.js#createSpeakeasy) calls this every frame; the rooms' STILL
// looks (paintRoom — the back-bar's bottles, the shade, the lamp room, the card table, the drawn curtains) stay in its cached lit
// canvas, and only what moves is drawn here, in the front wall's own units (v up; ~13.6 pt a unit on a 402 phone):
//   THE PEOPLE   silhouettes ~12–18 pt (figure(): a body, a head, two jointed arms, a hat, a prop) — dark against a lit room at
//                night, lit by the daylight against a dark room by day; on the jazz room's shade a soft shadow (the legs below it dark)
//   THE CAT      a large sitting silhouette, its tail flicking (cat())
//   THE STATES   the apartment's TV glow (22:00 → 3 am: an IRREGULAR blue flicker — core#tvLight), its night lamp (3 am → the
//                wake: NEVER FULLY DARK), the bar's afternoon (a half-drawn shade, the lower half lit), its last light + the
//                sweeping (3 → 4 am), the barbershop's day (the barber + a customer every ~8 min; the barber reading in his own
//                chair between them) and its CLOSED card before 9
//   THE MOMENTS  PAINT[id](env, el, len, inst) — one painter per catalogue entry (wake, shop-open, bartender, lights-out, dance,
//                toast, sax, cat, peek, tango, mirror) + the taps (a curtain twitches, a head peeks out, the cat leaps off)
// ADD A MOMENT: an entry in core/harbor-moments.js#MOMENTS + PAINT[id] here (+ a sound through env.play if it has one).
import { hourPlan, momentsAt, roomState, routineAt, tvLight, dayKey, MOMENT, TANGO_PATH } from '../../core/harbor-moments.js';
import { sunTimes } from '../../core/sky.js';
import { rngFrom } from '../../core/rng.js';
import { safeCtx } from '../../ui/canvas-safe.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const sm = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${+a.toFixed(3)})`;
const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
const hsh = (n, s = 0) => { let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ (s * 0x27d4eb2d); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
const R = (x, u0, v0, u1, v1, col) => { if (col) x.fillStyle = col; x.fillRect(u0, v0, u1 - u0, v1 - v0); };

/** SP2 — the sash's meeting rail, this far up the glass: a 1920s one-over-one with a SHORT upper sash, so the room's scene plays in one
 *  big clean lower pane (the owner: the old bar through the middle cut every scene in half). speakeasy.js#paintWindow bakes the same. */
export const SASH_RAIL = 0.74;
/** a window's glass in wall units (the same numbers as speakeasy.js's paintWindow / room): mid = the glass's middle (the moments'
 *  curves), rail = the meeting rail's height */
export function glassOf(w) {
  const [a, b] = w.u, [r0, r1] = w.v, g0 = a + 0.13 + 0.05, g1 = b - 0.05, h0 = r0 + 0.12, h1 = r1 - 0.06;
  return { a, b, r0, r1, g0, g1, h0, h1, mid: h0 + (h1 - h0) * 0.46, rail: h0 + (h1 - h0) * SASH_RAIL, cw: g1 - g0, ch: h1 - h0, cx: (g0 + g1) / 2 };
}

// ------------------------------------------------------------------ THE ROOMS' STILL LOOKS (cached in the lit canvas)
/** a room's still look at night. SP2 — LESS INSIDE (the owner: the rooms read as busy fragments at ~25 pt): each room is a warm wall,
 *  ONE light source and one or two strong shapes; furniture dim + simple; curtains only framing the edges. (7b: the people are live.) */
export function paintRoom(x, w, o = {}) {
  const G = glassOf(w), { g0, g1, h0, h1, cw, ch } = G;
  x.save(); x.beginPath(); x.rect(g0, h0, cw, ch); x.clip();
  const warm = (c0, c1) => { const g = x.createLinearGradient(0, h1, 0, h0); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(g0, h0, cw, ch); };
  if (w.lit === 'bar') paintBar(x, G, 1, o.dim || 0);
  else if (w.lit === 'shade') {
    // THE JAZZ ROOM behind an amber shade (three quarters down: the room's lamp behind it the one light) — the sax player is live
    warm('rgb(232,150,80)', 'rgb(120,56,34)');
    const sv = h0 + ch * 0.26;
    const g = x.createRadialGradient(G.cx, h0 + ch * 0.62, 0, G.cx, h0 + ch * 0.62, ch * 0.75);
    g.addColorStop(0, 'rgb(255,214,140)'); g.addColorStop(0.55, 'rgb(246,168,84)'); g.addColorStop(1, 'rgb(214,124,58)');
    x.fillStyle = g; x.fillRect(g0, sv, cw, h1 - sv);
    R(x, g0, sv, g1, sv + 0.05, 'rgba(110,60,30,0.8)');
  } else if (w.lit === 'lamp') paintLampRoom(x, G, 1);
  else if (w.lit === 'table') {
    // THE BACK ROOM: dark, ONE green-shaded lamp low over a round table (its pool of light), the heads round it
    R(x, g0, h0, g1, h1, 'rgb(58,32,22)');
    const tx = G.cx, ty = h0 + ch * 0.22;
    const pg = x.createRadialGradient(tx, ty + 0.18, 0, tx, ty + 0.18, 0.95); pg.addColorStop(0, 'rgba(255,214,140,0.95)'); pg.addColorStop(0.45, 'rgba(206,134,72,0.5)'); pg.addColorStop(1, 'rgba(58,32,22,0)'); x.fillStyle = pg; x.fillRect(g0, h0, cw, ch);
    x.fillStyle = 'rgba(255,214,140,0.12)'; x.beginPath(); x.moveTo(tx - 0.16, ty + 0.78); x.lineTo(tx + 0.16, ty + 0.78); x.lineTo(tx + 0.6, ty + 0.04); x.lineTo(tx - 0.6, ty + 0.04); x.fill();
    const sil = 'rgb(22,12,10)';
    for (const [dx, sc, hat] of [[-0.56, 1, true], [0.58, 0.96, false]]) {
      const px = tx + dx, sh = 0.34 * sc;
      x.fillStyle = sil; x.beginPath(); x.moveTo(px - 0.25 * sc, ty); x.quadraticCurveTo(px - 0.25 * sc, ty + sh, px, ty + sh + 0.02); x.quadraticCurveTo(px + 0.25 * sc, ty + sh, px + 0.25 * sc, ty); x.fill();
      x.beginPath(); x.arc(px, ty + sh + 0.13 * sc, 0.12 * sc, 0, TAU); x.fill();
      if (hat) { R(x, px - 0.19 * sc, ty + sh + 0.2 * sc, px + 0.19 * sc, ty + sh + 0.235 * sc, sil); R(x, px - 0.11 * sc, ty + sh + 0.23 * sc, px + 0.11 * sc, ty + sh + 0.33 * sc, sil); }
      x.fillStyle = 'rgba(255,190,110,0.4)'; x.beginPath(); x.arc(px + (dx < 0 ? 0.06 : -0.06) * sc, ty + sh + 0.16 * sc, 0.1 * sc, 0, Math.PI); x.fill();
    }
    x.fillStyle = 'rgb(46,104,62)'; x.beginPath(); x.ellipse(tx, ty, 0.62, 0.13, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgb(98,166,104)'; x.beginPath(); x.ellipse(tx, ty + 0.02, 0.46, 0.075, 0, 0, TAU); x.fill();
    R(x, tx - 0.62, ty - 0.1, tx + 0.62, ty - 0.02, 'rgb(36,20,14)');
    R(x, tx - 0.008, ty + 0.92, tx + 0.008, h1, 'rgb(30,20,16)');
    x.fillStyle = 'rgb(36,104,58)'; x.beginPath(); x.moveTo(tx - 0.1, ty + 0.94); x.lineTo(tx + 0.1, ty + 0.94); x.lineTo(tx + 0.24, ty + 0.78); x.lineTo(tx - 0.24, ty + 0.78); x.fill();
    R(x, tx - 0.24, ty + 0.76, tx + 0.24, ty + 0.79, 'rgb(255,232,170)');
  } else {
    // an EDGE window (ambient only): curtains drawn, glowing with the room's light, a brighter gap between them, two soft folds
    warm('rgb(240,150,80)', 'rgb(170,80,44)');
    R(x, g0 + cw * 0.46, h0, g0 + cw * 0.56, h1, 'rgb(255,214,150)');
    x.fillStyle = 'rgba(120,40,24,0.28)'; for (const f of [0.22, 0.76]) x.fillRect(g0 + cw * f, h0, 0.05, ch);
    if (w.id === 'edge2') { x.fillStyle = 'rgba(30,20,14,0.9)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(g0 + 0.32 + i * 0.12, h0 + 0.2 + (i % 3) * 0.1, 0.13, 0.08, 0.4 * (i - 3), 0, TAU); x.fill(); } R(x, g0 + 0.28, h0, g0 + 0.95, h0 + 0.16, 'rgb(30,18,14)'); }
  }
  // SP2 — each room its OWN bulb (the owner): one incandescent family, never colours — multiplied over the room (+ late: dimmer, warmer)
  { const tn = ROOM_TINT[w.id], lt = clamp01(o.late || 0);
    if (tn || lt > 0) { x.globalCompositeOperation = 'multiply'; if (tn) { x.fillStyle = rgb(tn); x.fillRect(g0, h0, cw, ch); } if (lt > 0) { x.fillStyle = rgb(mixc([255, 255, 255], LATE_TINT, lt)); x.fillRect(g0, h0, cw, ch); } x.globalCompositeOperation = 'source-over'; } }
  x.restore();
  sash(x, G, 'rgb(26,18,20)');
  { const tn = ROOM_TINT[w.id] || [255, 255, 255]; landing(x, G, [255, 196, 130].map((v, i) => v * tn[i] / 255), 1 - 0.25 * clamp01(o.late || 0)); }
}
/** SP2 — THE ROOMS' BULBS (the owner: the facade shouldn't be one uniform glow): a multiply over each lit room, all ~2200–3000 K — the
 *  bar + the jazz room the deepest amber edging to red, the back room a dim low amber, the apartment a soft peach / lampshade gold, the
 *  edge windows a little dimmer + each a touch off its neighbour. (The barbershop — the cleanest warm-white — is speakeasy.js's shop
 *  lamp; the TV's blue stays the only cool light.) LATE_TINT: the small hours (from ~11:30 pm, full by 1:30) dimmer + warmer. */
export const ROOM_TINT = Object.freeze({ bar: [255, 214, 184], jazz: [252, 206, 178], back: [246, 216, 186], apartment: [255, 238, 214], edge2: [232, 214, 196], edge3: [226, 214, 204] });
export const LATE_TINT = [222, 190, 160];
export const lateOf = h => (h == null ? 0 : (v => clamp01((v - 23.5) / 2))(h < 12 ? h + 24 : h));
/** the room's light LANDING outside the glass (crisp, no haze — SP2 replaced the soft blob round each window): the sill's lit top, the
 *  left reveal's face (we look into the opening from the right), a short fall down the sill's front edge. col: the light, a: 0..1 */
export function landing(x, G, col, a) {
  if (a <= 0.004) return;
  const c = (al) => `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},${(al * a).toFixed(3)})`;
  R(x, G.a - 0.16, G.r0 - 0.03, G.b + 0.16, G.r0, c(0.6));
  { const g = x.createLinearGradient(G.a, 0, G.a + 0.13, 0); g.addColorStop(0, c(0.06)); g.addColorStop(1, c(0.42)); x.fillStyle = g; x.fillRect(G.a, G.r0 + 0.07, 0.13, G.r1 - G.r0 - 0.07); }
  { const g = x.createLinearGradient(0, G.r0 - 0.03, 0, G.r0 - 0.16); g.addColorStop(0, c(0.3)); g.addColorStop(1, c(0)); x.fillStyle = g; x.fillRect(G.a - 0.16, G.r0 - 0.16, G.b - G.a + 0.32, 0.13); }
}
/** the sash over the light (dark against it): the slim meeting rail high up (re-drawn over anything a moment painted) */
export function sash(x, G, fc) {
  R(x, G.g0, G.rail - 0.025, G.g1, G.rail + 0.025, fc);
}
/** THE BAR's room: the gold back-bar's glow (the pendant over the counter the one light), two shelves of bottles, the counter (lit
 *  0..1: the shelves' lights one by one while the bartender switches them on — lit ≥ 1 all; dim: the last light, only the pendant) */
function paintBar(x, G, lit = 1, dim = 0) {
  const { g0, g1, h0, h1, cw, ch } = G, L = (a, b) => Math.round(lerp(a, b, dim));
  const g = x.createLinearGradient(0, h1, 0, h0);
  g.addColorStop(0, `rgb(${L(150, 50)},${L(80, 28)},${L(40, 18)})`); g.addColorStop(0.42, `rgb(${L(255, 120)},${L(192, 84)},${L(108, 50)})`); g.addColorStop(1, `rgb(${L(176, 60)},${L(98, 34)},${L(46, 22)})`);
  x.fillStyle = g; x.fillRect(g0, h0, cw, ch);
  const r = rngFrom(31), bc = [[255, 170, 60], [90, 200, 110], [230, 60, 60], [255, 230, 170], [120, 170, 255], [255, 140, 40]];
  [h0 + ch * 0.44, h0 + ch * 0.64].forEach((v, si) => {
    const on = clamp01((lit * 2 - si)) * (1 - dim * 0.75);
    R(x, g0, v - 0.04, g1, v, 'rgb(96,52,28)');
    for (let u = g0 + 0.1; u < g1 - 0.1; u += 0.15 + r() * 0.05) {
      const c = bc[Math.floor(r() * bc.length)], hh = 0.14 + r() * 0.08;
      R(x, u, v, u + 0.07, v + hh, rgb(mixc([60, 34, 24], c, 0.25 + 0.75 * on))); R(x, u + 0.022, v + hh, u + 0.048, v + hh + 0.05, rgb(mixc([60, 34, 24], c, 0.2 + 0.6 * on)));
      if (on > 0.05) R(x, u + 0.014, v + hh * 0.35, u + 0.028, v + hh * 0.85, `rgba(255,255,240,${(0.75 * on).toFixed(3)})`);
    }
  });
  // the pendant: its cord, a small shade, the bulb (a crisp core + a tight halo)
  const px = g0 + cw * 0.5, py = h1 - 0.34; R(x, px - 0.008, py, px + 0.008, h1, 'rgb(60,40,30)');
  x.fillStyle = 'rgb(70,44,28)'; x.beginPath(); x.moveTo(px - 0.05, py + 0.06); x.lineTo(px + 0.05, py + 0.06); x.lineTo(px + 0.13, py - 0.02); x.lineTo(px - 0.13, py - 0.02); x.fill();
  const lg = x.createRadialGradient(px, py - 0.04, 0, px, py - 0.04, 0.3); lg.addColorStop(0, 'rgba(255,250,224,1)'); lg.addColorStop(0.3, 'rgba(255,220,150,0.55)'); lg.addColorStop(1, 'rgba(255,190,100,0)'); x.fillStyle = lg; x.fillRect(px - 0.3, py - 0.34, 0.6, 0.6);
  R(x, g0, h0, g1, h0 + ch * 0.3, 'rgb(70,34,20)'); R(x, g0, h0 + ch * 0.3 - 0.05, g1, h0 + ch * 0.3, `rgb(${L(230, 120)},${L(170, 80)},${L(90, 40)})`);
}
/** THE APARTMENT's lamp room: a warm wall, ONE fringed floor lamp (its light on the wall round it), the armchair's back, the curtains
 *  tied back at the edges (lamp: the lamp's light 0..1 — the lights-out click takes it down) */
function paintLampRoom(x, G, lamp = 1) {
  const { g0, g1, h0, h1, cw, ch } = G;
  const c0 = mixc([40, 26, 30], [226, 160, 100], lamp), c1 = mixc([22, 14, 20], [150, 84, 50], lamp);
  const g = x.createLinearGradient(0, h1, 0, h0); g.addColorStop(0, rgb(c0)); g.addColorStop(1, rgb(c1)); x.fillStyle = g; x.fillRect(g0, h0, cw, ch);
  const lx = g0 + cw * 0.3, ly = h0 + ch * 0.72;
  if (lamp > 0.02) { const lg = x.createRadialGradient(lx, ly, 0, lx, ly, 1.0); lg.addColorStop(0, `rgba(255,236,190,${(0.75 * lamp).toFixed(3)})`); lg.addColorStop(0.4, `rgba(255,200,130,${(0.32 * lamp).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,190,120,0)'); x.fillStyle = lg; x.fillRect(g0, h0, cw, ch); }
  R(x, lx - 0.012, h0, lx + 0.012, ly - 0.08, 'rgb(64,38,26)');
  x.fillStyle = rgb(mixc([60, 46, 40], [255, 236, 180], lamp)); x.beginPath(); x.moveTo(lx - 0.2, ly - 0.08); x.lineTo(lx + 0.2, ly - 0.08); x.lineTo(lx + 0.12, ly + 0.08); x.lineTo(lx - 0.12, ly + 0.08); x.fill();
  x.fillStyle = rgb(mixc([40, 30, 28], [200, 130, 70], lamp)); for (let u = -0.18; u <= 0.18; u += 0.06) x.fillRect(lx + u - 0.008, ly - 0.14, 0.016, 0.06);
  // the armchair's back (one dim shape low in the room)
  x.fillStyle = rgb(mixc([26, 14, 16], [96, 40, 34], lamp)); x.beginPath(); x.ellipse(g0 + cw * 0.66, h0 + 0.05, 0.44, 0.34, 0, Math.PI, 0, true); x.fill();
  for (const [p, q, d] of [[g0, g0 + 0.22, 1], [g1 - 0.22, g1, -1]]) { x.fillStyle = rgb(mixc([40, 14, 18], [130, 36, 40], lamp)); x.beginPath(); x.moveTo(p, h1); x.lineTo(q, h1); x.quadraticCurveTo(d > 0 ? q - 0.04 : p + 0.04, h0 + ch * 0.45, d > 0 ? q - 0.09 : p + 0.09, h0); x.lineTo(d > 0 ? p : q, h0); x.fill(); }
}

// ------------------------------------------------------------------ THE FIGURE KIT (wall units, v up)
/**
 * figure(c, P): a person from the WAIST up (+ the legs with P.legs) — (P.x, P.y) the waist; P.s the scale (1: ~1.02 units from the
 * waist to the crown ≈ 14 pt at 402); lean (rad, + = the top to the right), tilt (the head), face (-1 left, 1 right, 0 front / back),
 * arms: [[a, e], [a, e]] (left, right: the upper arm's angle from hanging, + = out / up; e = the elbow's bend on top of it),
 * hat: 'fedora' | 'top' | 'cloche' | 'cap', hair: 'bob' | 'bun' | null, dress (a flapper: narrower, a dropped waist + a fringed skirt),
 * skirt (the skirt's flare 0..1), legs (the leg length: a full figure), step (-1..1 the stride), hold: [prop, prop] ('glass' | 'can'
 * | 'shaker' | 'broom' | 'cup' | 'scissors' | 'paper' | 'cloth' | 'sax'), col (one fill: a silhouette) or pal { body, skin, hair,
 * hat, legs, prop } (lit by day). glint: where the glasses catch the light (filled into P.glints for a 'lighter' pass)
 */
export function figure(c, P) {
  const s = P.s || 1, pal = P.pal || null, col = P.col || 'rgb(26,12,10)';
  const fill = k => (pal ? pal[k] || pal.body : col);
  c.save(); c.translate(P.x, P.y);
  const wh = (P.dress ? 0.15 : 0.19) * s, sh = (P.dress ? 0.235 : 0.29) * s, shY = 0.64 * s;
  if (P.legs) {
    const L = P.legs, st = (P.step || 0) * 0.16 * s;
    c.fillStyle = fill('legs');
    for (const [dx, sx] of [[-0.085 * s, -st], [0.085 * s, st]]) { c.beginPath(); c.moveTo(dx - 0.075 * s, 0.02 * s); c.lineTo(dx + 0.075 * s, 0.02 * s); c.lineTo(dx + sx + 0.06 * s, -L); c.lineTo(dx + sx - 0.06 * s, -L); c.closePath(); c.fill(); c.fillRect(dx + sx - 0.07 * s + (P.face || 0) * 0.03 * s, -L - 0.02 * s, 0.14 * s, 0.05 * s); }
  }
  if (P.dress) {
    // the flapper's skirt from a dropped waist, the fringe at its hem (it flares in a spin / a dip)
    const fl = clamp01(P.skirt || 0), hw = (0.2 + 0.18 * fl) * s, hy = -(0.52 - 0.12 * fl) * s;
    c.fillStyle = fill('body'); c.beginPath(); c.moveTo(-wh, 0.05 * s); c.lineTo(wh, 0.05 * s); c.lineTo(hw, hy); c.lineTo(-hw, hy); c.closePath(); c.fill();
    c.beginPath(); for (let i = 0; i <= 8; i++) { const u = -hw + (2 * hw) * i / 8; c.lineTo(u, hy - (i % 2 ? 0.07 : 0.02) * s); } c.lineTo(-hw, hy); c.fill();
  }
  c.rotate(-(P.lean || 0));
  c.fillStyle = fill('body');
  c.beginPath(); c.moveTo(-wh, 0); c.lineTo(-sh, shY - 0.1 * s); c.quadraticCurveTo(-sh, shY + 0.01 * s, -sh + 0.1 * s, shY + 0.02 * s); c.lineTo(sh - 0.1 * s, shY + 0.02 * s); c.quadraticCurveTo(sh, shY + 0.01 * s, sh, shY - 0.1 * s); c.lineTo(wh, 0); c.closePath(); c.fill();
  if (P.tails) { c.beginPath(); c.moveTo(-wh * 0.9, 0.02 * s); c.lineTo(-wh * 1.15 - (P.face || 0) * 0.06 * s, -0.42 * s); c.lineTo(-wh * 0.1, -0.1 * s); c.lineTo(wh * 0.1, -0.1 * s); c.lineTo(wh * 1.15 - (P.face || 0) * 0.06 * s, -0.42 * s); c.lineTo(wh * 0.9, 0.02 * s); c.fill(); }
  // the head on its neck
  c.fillStyle = fill('skin'); c.fillRect(-0.05 * s, shY - 0.02 * s, 0.1 * s, 0.13 * s);
  c.save(); c.translate(0, shY + 0.09 * s); c.rotate(-(P.tilt || 0));
  const f = P.face || 0, hx = f * 0.015 * s, hy = 0.15 * s, hr = 0.135 * s;
  c.beginPath(); c.arc(hx, hy, hr, 0, TAU); c.fill();
  if (f) { c.beginPath(); c.moveTo(hx + f * hr * 0.85, hy + 0.02 * s); c.lineTo(hx + f * (hr + 0.045 * s), hy - 0.03 * s); c.lineTo(hx + f * hr * 0.8, hy - 0.06 * s); c.fill(); }
  if (P.hair === 'bob') { c.fillStyle = fill('hair'); c.beginPath(); c.arc(hx - f * 0.01 * s, hy + 0.02 * s, hr * 1.12, Math.PI * 1.05, Math.PI * 1.95, true); c.lineTo(hx + hr * 1.12, hy - 0.08 * s); c.lineTo(hx - hr * 1.12, hy - 0.08 * s); c.fill(); }
  else if (P.hair === 'bun') { c.fillStyle = fill('hair'); c.beginPath(); c.arc(hx, hy + 0.04 * s, hr * 1.04, 0.4, Math.PI - 0.4); c.closePath(); c.fill(); c.beginPath(); c.arc(hx - (f || 0) * 0.13 * s, hy + (f ? 0.05 : 0.15) * s, 0.06 * s, 0, TAU); c.fill(); }
  else if (pal && P.hair !== null) { c.fillStyle = fill('hair'); c.beginPath(); c.arc(hx, hy + 0.04 * s, hr * 1.04, 0.4, Math.PI - 0.4); c.closePath(); c.fill(); }
  c.fillStyle = fill('hat');
  if (P.hat === 'fedora') { c.beginPath(); c.ellipse(hx, hy + 0.09 * s, 0.23 * s, 0.035 * s, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(hx - 0.13 * s, hy + 0.09 * s); c.lineTo(hx - 0.12 * s, hy + 0.24 * s); c.quadraticCurveTo(hx, hy + 0.2 * s, hx + 0.12 * s, hy + 0.24 * s); c.lineTo(hx + 0.13 * s, hy + 0.09 * s); c.fill(); }
  else if (P.hat === 'top') { c.beginPath(); c.ellipse(hx, hy + 0.1 * s, 0.21 * s, 0.032 * s, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(hx - 0.115 * s, hy + 0.1 * s); c.lineTo(hx - 0.13 * s, hy + 0.46 * s); c.lineTo(hx + 0.13 * s, hy + 0.46 * s); c.lineTo(hx + 0.115 * s, hy + 0.1 * s); c.fill(); }
  else if (P.hat === 'cloche') { c.beginPath(); c.arc(hx, hy + 0.03 * s, hr * 1.12, -0.25, Math.PI + 0.25); c.fill(); c.lineWidth = 0.025 * s; c.strokeStyle = fill('hat'); c.beginPath(); c.moveTo(hx - f * 0.08 * s, hy + 0.14 * s); c.quadraticCurveTo(hx - f * 0.14 * s, hy + 0.32 * s, hx - f * 0.24 * s, hy + 0.38 * s); c.stroke(); }
  else if (P.hat === 'cap') { c.beginPath(); c.arc(hx, hy + 0.04 * s, hr * 1.05, 0, Math.PI); c.fill(); c.fillRect(hx + (f || 1) * 0.02 * s - 0.01 * s, hy + 0.03 * s, (f || 1) * 0.2 * s, 0.03 * s); }
  c.restore();
  // the arms (two segments, round joints) + what the hands hold
  c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 0.105 * s;
  const arms = P.arms || [[0.1, 0.1], [0.1, 0.1]];
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1, [a, e] = arms[i] || [0.1, 0.1], sx = side * (sh - 0.05 * s), sy = shY - 0.05 * s;
    const ex = sx + side * Math.sin(a) * 0.33 * s, ey = sy - Math.cos(a) * 0.33 * s, fa = a + e, hx2 = ex + side * Math.sin(fa) * 0.3 * s, hy2 = ey - Math.cos(fa) * 0.3 * s;
    c.strokeStyle = fill('arm'); c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx2, hy2); c.stroke();
    c.fillStyle = fill('skin'); c.beginPath(); c.arc(hx2, hy2, 0.052 * s, 0, TAU); c.fill();
    const hold = P.hold && P.hold[i];
    if (hold) prop(c, hold, hx2, hy2, side, fa, s, fill('prop'), P);
  }
  c.restore();
}
function prop(c, kind, x, y, side, fa, s, col, P) {
  c.fillStyle = col; c.strokeStyle = col;
  if (kind === 'glass' || kind === 'cup') {
    const w = 0.075 * s, h = (kind === 'cup' ? 0.07 : 0.1) * s;
    c.beginPath(); c.moveTo(x - w, y + 0.02 * s); c.lineTo(x + w, y + 0.02 * s); c.lineTo(x + w * 0.7, y + 0.02 * s + h); c.lineTo(x - w * 0.7, y + 0.02 * s + h); c.closePath();
    if (kind === 'glass') { c.moveTo(x - w * 1.2, y + 0.02 * s + h); c.lineTo(x + w * 1.2, y + 0.02 * s + h); c.lineTo(x, y + 0.02 * s + h * 1.9); c.closePath(); }
    c.fill();
    if (P.glints) P.glints(c, x + 0.02 * s, y + 0.02 * s + h * 1.2, s);
  } else if (kind === 'shaker') { c.fillRect(x - 0.045 * s, y - 0.02 * s, 0.09 * s, 0.22 * s); c.beginPath(); c.arc(x, y + 0.2 * s, 0.045 * s, 0, Math.PI); c.fill(); if (P.glints) P.glints(c, x, y + 0.12 * s, s); }
  else if (kind === 'broom') { c.lineWidth = 0.035 * s; c.beginPath(); c.moveTo(x - side * 0.15 * s, y + 0.25 * s); c.lineTo(x + side * 0.25 * s, y - 0.9 * s); c.stroke(); c.beginPath(); c.moveTo(x + side * 0.16 * s, y - 0.88 * s); c.lineTo(x + side * 0.4 * s, y - 0.92 * s); c.lineTo(x + side * 0.46 * s, y - 1.08 * s); c.lineTo(x + side * 0.12 * s, y - 1.04 * s); c.fill(); }
  else if (kind === 'can') {
    c.save(); c.translate(x, y); c.rotate(-side * (P.pour || 0));
    c.fillRect(-0.02 * s, -0.12 * s, side * 0.2 * s, 0.13 * s);
    c.lineWidth = 0.03 * s; c.beginPath(); c.moveTo(side * 0.17 * s, -0.08 * s); c.lineTo(side * 0.36 * s, 0.03 * s); c.stroke();
    c.restore();
  } else if (kind === 'scissors') { c.lineWidth = 0.022 * s; const o = P.snip || 0; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * 0.14 * s, y + (0.04 + 0.05 * o) * s); c.moveTo(x, y); c.lineTo(x + side * 0.14 * s, y + (0.04 - 0.05 * o) * s); c.stroke(); if (P.glints) P.glints(c, x + side * 0.1 * s, y + 0.04 * s, s * 0.6); }
  else if (kind === 'paper') { c.fillRect(x - 0.02 * s - (side > 0 ? 0.3 * s : 0), y - 0.05 * s, 0.32 * s, 0.4 * s); }
  else if (kind === 'cloth') { c.beginPath(); c.ellipse(x, y + 0.02 * s, 0.06 * s, 0.045 * s, 0.4, 0, TAU); c.fill(); }
}
/** the sax (a curved silhouette held at the mouth: the neck, the body down, the bell turned out) — at (x, y) the mouth, ang the lift */
function sax(c, x, y, s, ang, dir, col) {
  c.save(); c.translate(x, y); c.rotate(-dir * ang); c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round';
  c.lineWidth = 0.1 * s; c.beginPath(); c.moveTo(0, 0); c.lineTo(dir * 0.08 * s, -0.08 * s); c.quadraticCurveTo(dir * 0.12 * s, -0.6 * s, dir * 0.22 * s, -0.66 * s); c.quadraticCurveTo(dir * 0.36 * s, -0.68 * s, dir * 0.4 * s, -0.42 * s); c.stroke();
  // (the bell: a flared cone turned up + out — the shape that says SAX at a glance)
  c.beginPath(); c.moveTo(dir * 0.33 * s, -0.46 * s); c.lineTo(dir * 0.56 * s, -0.22 * s); c.quadraticCurveTo(dir * 0.5 * s, -0.18 * s, dir * 0.42 * s, -0.2 * s); c.lineTo(dir * 0.3 * s, -0.36 * s); c.closePath(); c.fill();
  c.restore();
}
/** THE CAT: a large sitting silhouette (pose 0 sitting · 1 stretched mid-leap), its tail curling / flicking (flick 0..1), facing dir */
export function cat(c, x, y, s, { pose = 0, flick = 0, dir = 1, look = 0, col = 'rgb(16,10,10)' } = {}) {
  c.save(); c.translate(x, y); c.scale(dir, 1); c.fillStyle = col; c.strokeStyle = col;
  if (pose > 0.5) {
    // mid-leap: long and low, the legs reaching
    c.beginPath(); c.ellipse(0, 0.16 * s, 0.34 * s, 0.11 * s, 0, 0, TAU); c.fill();
    c.beginPath(); c.arc(0.36 * s, 0.24 * s, 0.1 * s, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(0.3 * s, 0.31 * s); c.lineTo(0.33 * s, 0.4 * s); c.lineTo(0.37 * s, 0.32 * s); c.moveTo(0.4 * s, 0.31 * s); c.lineTo(0.44 * s, 0.4 * s); c.lineTo(0.46 * s, 0.3 * s); c.fill();
    c.lineWidth = 0.05 * s; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0.22 * s, 0.1 * s); c.lineTo(0.42 * s, -0.04 * s); c.moveTo(-0.22 * s, 0.1 * s); c.lineTo(-0.44 * s, 0.0 * s); c.stroke();
    c.lineWidth = 0.055 * s; c.beginPath(); c.moveTo(-0.32 * s, 0.18 * s); c.quadraticCurveTo(-0.55 * s, 0.24 * s, -0.66 * s, 0.38 * s); c.stroke();
  } else {
    // sitting: haunches, the chest up, the head, two ears; the tail round the paws, its tip flicking up
    c.beginPath(); c.moveTo(-0.26 * s, 0); c.quadraticCurveTo(-0.3 * s, 0.32 * s, -0.08 * s, 0.5 * s); c.quadraticCurveTo(0.12 * s, 0.6 * s, 0.14 * s, 0.4 * s); c.lineTo(0.16 * s, 0); c.closePath(); c.fill();
    const hx = 0.06 * s + look * 0.03 * s, hy = 0.64 * s;
    c.beginPath(); c.ellipse(hx, hy, 0.13 * s, 0.115 * s, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(hx - 0.11 * s, hy + 0.05 * s); c.lineTo(hx - 0.09 * s, hy + 0.22 * s); c.lineTo(hx - 0.01 * s, hy + 0.1 * s); c.moveTo(hx + 0.03 * s, hy + 0.1 * s); c.lineTo(hx + 0.11 * s, hy + 0.22 * s); c.lineTo(hx + 0.12 * s, hy + 0.04 * s); c.fill();
    c.lineWidth = 0.06 * s; c.lineCap = 'round';
    const tip = flick;
    c.beginPath(); c.moveTo(-0.22 * s, 0.04 * s); c.quadraticCurveTo(-0.46 * s, 0.02 * s, -0.48 * s, (0.12 + 0.18 * tip) * s); c.quadraticCurveTo(-0.5 * s, (0.26 + 0.24 * tip) * s, (-0.4 + 0.06 * tip) * s, (0.3 + 0.3 * tip) * s); c.stroke();
  }
  c.restore();
}

// ------------------------------------------------------------------ the palettes
const SIL = 'rgb(24,11,10)', SIL_BACK = 'rgb(84,42,24)', SIL_TV = 'rgb(6,8,22)', SHADOW = 'rgba(78,24,8,0.84)', LEGS_SH = 'rgba(34,10,4,0.95)';
const DAY_PALS = [
  { body: 'rgb(74,84,104)', skin: 'rgb(214,168,136)', hair: 'rgb(60,40,30)', hat: 'rgb(54,50,58)', legs: 'rgb(50,48,56)', prop: 'rgb(200,206,214)' },
  { body: 'rgb(150,62,58)', skin: 'rgb(196,146,112)', hair: 'rgb(40,28,24)', hat: 'rgb(70,50,44)', legs: 'rgb(60,54,60)', prop: 'rgb(220,220,214)' },
  { body: 'rgb(208,196,170)', skin: 'rgb(222,178,146)', hair: 'rgb(120,80,44)', hat: 'rgb(110,84,60)', legs: 'rgb(70,66,74)', prop: 'rgb(110,140,160)' },
];
const BARBER = { body: 'rgb(238,236,228)', skin: 'rgb(210,164,130)', hair: 'rgb(44,32,28)', hat: 'rgb(44,32,28)', legs: 'rgb(46,44,52)', prop: 'rgb(214,220,228)', arm: 'rgb(232,230,222)' };
const pals = n => DAY_PALS[((n % 3) + 3) % 3];

// ------------------------------------------------------------------ THE LIVE LAYER
export function createWindowLife() {
  const blocks = new Map();           // `${key}|${hour}` → that hour's plan
  let dark = null, darkKey = '', routines = {}, rKey = '';
  const played = new Set();            // (a moment's sound once per instance)
  const taps = [];                     // { id, kind, at (frame s) } — the viewer's own taps (local, not synced)
  let catTap = -1, forcedT0 = -1, forcedId = null, last = { on: [], states: {}, sec: 0, key: '', next: null, forced: null };
  const sprites = new Map();
  function spot(col) {
    const key = col.join(','); let cv = sprites.get(key);
    if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const x = safeCtx(cv), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    for (const [t, a] of [[0, 1], [0.18, 0.62], [0.42, 0.22], [0.7, 0.06], [1, 0]]) g.addColorStop(t, `rgba(${key},${a})`);
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); sprites.set(key, cv);
    return cv;
  }
  const glow = (c, col, x, y, r, a, sy = 1) => { if (a <= 0.004) return; c.globalAlpha = Math.min(1, a); c.drawImage(spot(col), x - r, y - r * sy, r * 2, r * 2 * sy); };

  // the local clock: seconds after local midnight, the date's key + weekday (the tz offset from the look: core/sky.js#localParts)
  function localNow(ms, off) {
    const lms = ms + (off || 0) * 60000, d = new Date(lms);
    return { key: dayKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()), dow: d.getUTCDay(), month: d.getUTCMonth() + 1, sec: (((lms / 1000) % 86400) + 86400) % 86400, lms };
  }
  function block(key, hour, ctx) {
    const k = `${key}|${hour}|${ctx.dow}|${ctx.dark.map(v => v.toFixed(2)).join(',')}`;
    let b = blocks.get(k);
    if (!b) { b = hourPlan(key, hour, ctx); blocks.set(k, b); if (blocks.size > 8) blocks.delete(blocks.keys().next().value); }
    return b;
  }

  /**
   * frame(f): this frame's life — the moments on (the plan: this hour + the last), the rooms' states, the forced preview.
   * f.life = { ms (the city's clock), off (the tz offset, min), tz, lat, lon, moment (a forced id), dark: [duskH, dawnH] | null }
   * → { on: [{ id, win, el, len, n }], states: { apartment, bar, shop }, full: Set (windows drawn whole here: their lit canvas 0) }
   */
  function frame(f) {
    const L = f.life || {}, ms = L.ms || Date.now(), loc = localNow(ms, L.off), h = loc.sec / 3600;
    if (L.dark) dark = L.dark;
    else if (darkKey !== loc.key && L.tz && L.lat != null) {
      darkKey = loc.key;
      try { const st = sunTimes(ms, L.tz, L.lat, L.lon), hr = t => ((((t + (L.off || 0) * 60000) / 3.6e6) % 24) + 24) % 24; dark = st.rise && st.set ? [hr(st.set) + 0.35, hr(st.rise) - 0.35] : [19, 7]; } catch { dark = [19, 7]; }
    }
    const ctx = { dow: loc.dow, month: loc.month, dark: dark || [19, 7] };
    if (rKey !== loc.key) { rKey = loc.key; routines = {}; for (const m of ['wake', 'shop-open', 'bartender', 'lights-out']) routines[m] = routineAt(m, loc.key); }
    let on;
    const forced = L.moment && MOMENT[L.moment] ? L.moment : null;
    if (forced) {
      // THE PREVIEW (&force=window&moment=<id>, the panel's WINDOWS rows): that moment on a loop from 1.2 s in, nothing else drawn
      if (forcedId !== forced) { forcedId = forced; forcedT0 = f.t + 1.2; }
      const m = MOMENT[forced], cyc = m.len + 2.5, el = f.t - forcedT0;
      const n = Math.floor(el / cyc), e = el - n * cyc;
      on = el >= 0 && e < m.len ? [{ id: forced, win: m.windows === 'all' ? 'all' : (Array.isArray(m.windows) ? m.windows[((n % m.windows.length) + m.windows.length) % m.windows.length] : m.windows), el: e, len: m.len, n: -1 - n, p: e / m.len }] : [];
    } else {
      forcedId = null;
      const hr = Math.floor(h), prev = hr ? block(loc.key, hr - 1, ctx) : block(localNow(ms - 86400e3, L.off).key, 23, { ...ctx, dow: (loc.dow + 6) % 7 }).map(e => ({ ...e, t0: e.t0 - 86400 }));
      on = momentsAt([...prev, ...block(loc.key, hr, ctx)], loc.sec);
      // (Reduced motion: no moving moments — the rooms keep their states: the TV's light steady, the night lamp, the shop's barber still)
      if (f.motion === false) on = [];
    }
    const states = { apartment: roomState('apartment', h, routines), bar: roomState('bar', h, routines), shop: roomState('shop', h, routines) };
    const full = new Set();
    if (states.apartment === 'tv' || states.apartment === 'nightlamp') full.add('apartment');
    if (states.bar === 'last') full.add('bar');
    for (const e of on) if (['wake', 'lights-out'].includes(e.id)) full.add('apartment'); else if (e.id === 'bartender') full.add('bar');
    const cur = block(loc.key, Math.floor(h), ctx), nx = cur.find(e => e.t0 > loc.sec);
    last = { on, states, sec: loc.sec, h, key: loc.key, forced, full, next: nx ? { id: nx.id, win: nx.win, in: Math.round(nx.t0 - loc.sec) } : null, dark: ctx.dark };
    return last;
  }

  // ---------------------------------------------------------------- drawing
  /**
   * draw(c, env): after the lit rooms. env = { map(c) (the front wall's transform), wins (+ u, v), shopWin [w0, w1, v0, v1], door
   * { card: [u, v] }, k (the night 0..1 × fade), levels (each window's lit level), f (the frame: t, motion, tw { day, gold, night },
   * party, tier, fade), play(slot, o), loop(slot, o) }
   */
  function draw(c, env) {
    const fr = last, f = env.f, t = f.t || 0, k = env.k, day = clamp01(1 - k), mo = f.motion !== false;
    const T = f.tw || { day: 1 - k, gold: 0, night: k };
    const frameC = rgb(tri(T, [30, 54, 46], [40, 40, 40], [11, 12, 22]));
    const winOf = id => env.wins.find(w => w.id === id);
    const byWin = new Map();
    for (const e of fr.on) {
      if (e.win === 'all') { for (const id of TANGO_PATH) (byWin.get(id) || byWin.set(id, []).get(id)).push(e); }
      else (byWin.get(e.win) || byWin.set(e.win, []).get(e.win)).push(e);
      if (!played.has(`${e.id}|${e.n}`)) { played.add(`${e.id}|${e.n}`); if (played.size > 64) played.delete(played.values().next().value); sound(e, env); }
    }
    c.save(); env.map(c);
    // the glints: the glasses + the shaker catching the light where they are (warm at night, a cool sparkle by day)
    const glints = (x, gx, gy, s) => { const a = x.globalAlpha; x.save(); x.globalCompositeOperation = 'lighter'; glow(x, k > 0.3 ? [255, 236, 190] : [255, 255, 255], gx, gy, 0.12 * s, 0.85 * Math.max(0.35, k) * a); x.restore(); };
    for (const w of env.wins) {
      const G = glassOf(w), lv = env.levels[env.wins.indexOf(w)], kl = k * (fr.full.has(w.id) ? 1 : lv);
      const list = byWin.get(w.id) || [];
      const tap = taps.find(o => o.id === w.id && t - o.at < 3.2);
      if (!list.length && !tap && !fr.full.has(w.id) && kl < 0.01 && w.id !== 'bar' && !(w.id === 'apartment' && fr.states.apartment !== 'lamp')) continue;
      c.save(); c.beginPath(); c.rect(G.g0, G.h0, G.cw, G.ch); c.clip();
      const E = { c, G, w, k, kl, day, t, mo, T, glints, f, env, frameC, after: [] };
      let redrawSash = false;
      // the room's own state
      if (w.id === 'apartment') redrawSash = apartmentState(E, fr.states.apartment, list) || redrawSash;
      if (w.id === 'bar') redrawSash = barState(E, fr.states.bar, list) || redrawSash;
      if (w.id === 'jazz' && kl > 0.01) { saxPlayer(E, list.find(e => e.id === 'sax')); redrawSash = true; }
      // the moments in this window
      for (const e of list) { const p = PAINT[e.id]; if (p) { p(E, e.el, e.len, e); redrawSash = true; } }
      if (tap) { tapPaint(E, tap); redrawSash = true; }
      c.restore();
      if (redrawSash) sash(c, G, kl > 0.3 ? 'rgb(26,18,20)' : frameC);
      for (const fn of E.after) fn();
    }
    c.restore();
    // the shop (the barbershop's big window): its day life, its CLOSED card, the hidden mirror door
    shop(c, env, fr, byWin.get('shop') || [], { k, day, t, mo, T, f });
    // the TV's blue spill on the brick round the apartment window (the bake's warm blobs belong to the lit rooms)
    spills(c, env, fr, t);
  }

  // ---------------------------------------------------------------- THE ROOMS' STATES
  function apartmentState(E, st, list) {
    const { c, G, k, t } = E;
    const routine = list.find(e => e.id === 'wake' || e.id === 'lights-out');
    if (routine) return false;                      // (the routine's painter draws the whole room)
    if (st === 'tv') { if (k > 0.01) { tvRoom(E, 1, true); return true; } return false; }
    if (st === 'nightlamp') { if (k > 0.01) { nightLamp(E, 0); return true; } return false; }
    void c; void G; void t;
    return false;
  }
  function barState(E, st, list) {
    const { c, G, k, day, t, mo } = E;
    if (list.find(e => e.id === 'bartender')) return false;
    if (st === 'last') {
      // THE LAST LIGHT (3 → 4 am): the bar low, the pendant on, the stools up on the counter, someone sweeping up
      if (k < 0.01) return false;
      c.globalAlpha = k; paintBar(c, G, 1, 0.62);
      const cy = G.h0 + G.ch * 0.3;
      c.fillStyle = 'rgb(30,16,12)';
      for (const u of [0.18, 0.42, 0.66, 0.88]) { const x = G.g0 + G.cw * u; c.fillRect(x - 0.1, cy, 0.2, 0.04); c.fillRect(x - 0.09, cy + 0.04, 0.025, 0.22); c.fillRect(x + 0.065, cy + 0.04, 0.025, 0.22); }
      const sw = mo ? Math.sin(t * 2.4) : 0, x = G.g0 + G.cw * (0.5 + 0.22 * Math.sin(t * 0.21));
      figure(c, { x, y: G.h0 + 0.02, s: 0.92, lean: 0.18 + 0.08 * sw, tilt: 0.2, face: 1, arms: [[0.5 + 0.25 * sw, 0.6], [0.7 + 0.25 * sw, 0.4]], hold: [null, 'broom'], col: SIL, hair: null });
      c.globalAlpha = 1;
      return true;
    }
    if (st !== 'open') return false;
    // THE AFTERNOON (the bartender came at 4): the shade half drawn, the lower half lit warm, the bartender pottering — by day
    if (day > 0.01) { c.globalAlpha = day; barAfternoon(E, 1, 1); c.globalAlpha = 1; }
    // THE NIGHT: the bartender behind the bar + the patron in the hat (the toast brings two more) over the still bar
    const salute = taps.find(o => o.id === 'bar' && t - o.at < 3.2);
    if (k > 0.01 && !list.find(e => e.id === 'toast')) { c.globalAlpha = k; bartender(E, 'night'); if (!salute) patrons(E, null); c.globalAlpha = 1; }
    else if (k > 0.01) { c.globalAlpha = k; bartender(E, 'night'); c.globalAlpha = 1; }
    return day > 0.01 || k > 0.01;
  }
  /** the bar by day after 4 pm: the shade at `shade` (0..1 of the way to half), the room lit `lit` (0..1, the shelves one by one) */
  function barAfternoon(E, shade, lit) {
    // (a third of the way down — half-drawn reads as the shade's own height: the lit shelves + the bartender stay in view below it)
    const { c, G } = E, sv = G.h1 - G.ch * 0.34 * shade;
    // the lower half: the bar lit warm (or still dark)
    c.save(); c.beginPath(); c.rect(G.g0, G.h0, G.cw, sv - G.h0); c.clip();
    if (lit > 0.01) { const a = c.globalAlpha; c.globalAlpha = a * Math.min(1, 0.35 + lit); paintBar(c, G, lit, 0.15 * (1 - lit)); c.globalAlpha = a; }
    else R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(36,26,26)');
    bartender(E, 'day', lit);
    // the glass: a little of the street's reflection over it
    R(c, G.g0, G.h0, G.g1, sv, 'rgba(236,232,220,0.1)');
    c.restore();
    // the shade: cream linen, its pull + hem, its folds
    const bl = tri(E.T, [232, 220, 192], [240, 196, 150], [80, 64, 60]);
    R(c, G.g0, sv, G.g1, G.h1, rgb(bl)); R(c, G.g0, sv, G.g1, sv + 0.05, rgb(mixc(bl, [0, 0, 0], 0.25)));
    c.fillStyle = rgb(mixc(bl, [0, 0, 0], 0.12)); for (let v = sv + 0.18; v < G.h1; v += 0.22) c.fillRect(G.g0, v, G.cw, 0.012);
    R(c, G.cx - 0.03, sv - 0.1, G.cx + 0.03, sv, E.frameC);
  }
  /** the bartender behind the counter, facing us: polishing a glass, now and then the cocktail shake (seeded on the clock) */
  function bartender(E, mode, lit = 1) {
    const { c, G, t, mo } = E, x = G.g0 + G.cw * 0.2, y = G.h0 + G.ch * 0.3 - 0.3;
    const slot = Math.floor(t / 31), ph = t - slot * 31, shake = mo && hsh(slot, 3) < 0.7 && ph > 22 && ph < 25;
    const pol = mo ? Math.sin(t * 5.2) : 0;
    let arms = [[0.55, 1.75 + 0.15 * pol], [0.35, 1.9 - 0.12 * pol]], hold = ['cloth', 'glass'];
    if (shake) { const u = Math.sin((ph - 22) * 22); arms = [[0.25, 2.3], [1.9 + 0.35 * u, 0.9 - 0.3 * u]]; hold = [null, 'shaker']; }
    // (behind the counter = further back than the patrons: a step smaller + a lighter silhouette, the back-bar's glow round him — so the
    // patrons' raised glasses read against him)
    if (mode === 'day') figure(c, { x, y, s: 0.86, face: 0, arms, hold, pal: { ...DAY_PALS[2], body: 'rgb(236,232,222)', arm: 'rgb(236,232,222)' }, glints: lit > 0.5 ? E.glints : null });
    else figure(c, { x, y, s: 0.86, face: 0, arms, hold, col: SIL_BACK, glints: E.glints });
    // the counter in front of him (his waist behind it)
    R(c, G.g0, G.h0, G.g1, G.h0 + G.ch * 0.3, mode === 'day' ? 'rgb(70,40,28)' : 'rgb(70,34,20)');
    R(c, G.g0, G.h0 + G.ch * 0.3 - 0.05, G.g1, G.h0 + G.ch * 0.3, mode === 'day' ? `rgba(230,170,90,${(0.5 + 0.5 * lit).toFixed(2)})` : 'rgb(230,170,90)');
  }
  /** the patrons at the bar (their backs to us, in front of the counter): the regular in the hat; THE TOAST brings two friends —
   *  three glasses raised high over their heads (catching the light), the clink over the middle (a sparkle), a drink, glasses down.
   *  toast: { p } (0..1) | { p, solo } (a tap: the regular alone salutes you) | null */
  function patrons(E, toast) {
    const { c, G } = E, y = G.h0 - 0.02;
    const full = toast && !toast.solo;
    const who = full ? [[0.2, 'fedora', 0.88, 1], [0.5, 'cloche', 0.8, 0], [0.8, 'fedora', 0.9, -1]] : [[0.74, 'fedora', 0.9, -1]];
    const p = toast ? toast.p : 0, up = toast ? sm(0.06, 0.26, p) * (1 - sm(0.84, 0.98, p)) : 0, clink = full ? sm(0.3, 0.38, p) * (1 - sm(0.44, 0.52, p)) : 0, drink = toast ? sm(0.54, 0.62, p) * (1 - sm(0.74, 0.82, p)) : 0;
    for (const [u, hat, s, toward] of who) {
      const x = G.g0 + G.cw * u;
      // the toasting arm: down → straight up over the head (→ leaning in over the middle for the clink) → folded to the mouth
      const a = lerp(lerp(0.15, toward ? 2.75 : 3.0, up), toward ? 2.25 : 3.0, clink), e = lerp(lerp(0.25, 0.15, up), toward ? 0.45 : 0.05, clink);
      const arm = drink > 0.01 ? [lerp(a, 0.7, drink), lerp(e, 2.3, drink)] : [a, e];
      // (toward: +1 = the centre is to his right — his right arm toasts; −1 his left; 0 the middle one, her right)
      const arms = toward < 0 ? [arm, [0.12, 0.2]] : [[0.12, 0.2], arm], hold = toward < 0 ? ['glass', null] : [null, 'glass'];
      figure(c, { x: x + toward * 0.05 * clink, y, s, face: 0, lean: toward * 0.12 * clink, tilt: -0.4 * drink, arms, hold: up > 0.05 || !toast ? hold : null, hat, hair: hat === 'cloche' ? 'bob' : null, col: SIL, glints: up > 0.3 ? E.glints : null });
    }
    if (full) {
      const k = sm(0.33, 0.38, p) * (1 - sm(0.4, 0.52, p));
      if (k > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; glow(c, [255, 244, 210], G.cx, G.h0 + G.ch * 0.72, 0.42, 0.95 * k); glow(c, [255, 255, 255], G.cx, G.h0 + G.ch * 0.72, 0.14, k); c.restore(); }
    }
  }
  /** the jazz room's sax player: his shadow on the shade (soft) — swaying gently all night; THE SOLO (sax) leans back hard */
  function saxPlayer(E, solo) {
    const { c, G, t, mo, kl } = E, sv = G.h0 + G.ch * 0.26;
    const p = solo ? solo.el / solo.len : 0, big = solo ? sm(0, 0.12, p) * (1 - sm(0.86, 1, p)) : 0;
    const beat = mo ? Math.sin(t * (solo ? 7.4 : 2.1)) : 0;
    const lean = mo ? -0.06 * Math.sin(t * 1.3) - big * (0.32 + 0.1 * beat) : 0, bob = big * 0.05 * Math.abs(beat);
    c.save(); c.globalAlpha = kl;
    c.beginPath(); c.rect(G.g0, sv, G.cw, G.h1 - sv); c.clip();
    const x = G.g0 + G.cw * 0.46, y = sv - 0.08 + bob, s = 1.08;
    figure(c, { x, y, s, lean, tilt: -0.2 - big * 0.35, face: 1, arms: [[0.55 - big * 0.2, 1.4], [0.75 - big * 0.25, 1.15]], col: SHADOW, hat: 'fedora' });
    // the sax: its mouthpiece at the lips, the body down + out, the bell up in the solo
    const mx = x + Math.sin(-lean) * 0.0 + 0.12 * s, my = y + 0.86 * s;
    sax(c, mx + lean * -0.5, my, s * 1.35, 0.15 + big * 0.75, 1, SHADOW);
    c.restore(); c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- THE APARTMENT AT NIGHT: the TV, the night lamp
  function tvRoom(E, on = 1, people = true) {
    const { c, G, t, k, mo } = E;
    const tv = mo ? tvLight(t, 11) : { k: 0.75, tint: 0.4, warm: 0, cut: 1 }, a = k * on;
    // (8P — the owner: a touch BLUER, less white — even the brightest flicker frame never reads as a blank grey sheet: the blues deeper,
    // the two glows lower, the level capped)
    const tc = tv.warm ? [255, 206, 160] : mixc([64, 108, 255], [128, 162, 255], tv.tint), tk = Math.min(0.92, tv.k);
    c.globalAlpha = 1;
    // the room in the TV's light: the walls take its colour (the whole window reads BLUE at a glance), brighter toward the set
    R(c, G.g0, G.h0, G.g1, G.h1, rgb(mixc([8, 9, 20], mixc([30, 44, 96], tc, 0.25), clamp01(a * (0.55 + 0.45 * tv.k)))));
    // the TV's light on the walls + the ceiling (the set low at the left, out of sight below the sill)
    c.globalCompositeOperation = 'lighter';
    glow(c, tc, G.g0 + G.cw * 0.3, G.h0 + G.ch * 0.45, G.ch * 1.15, 0.5 * a * tk, 0.9);
    glow(c, tc, G.g0 + G.cw * 0.22, G.h0 + G.ch * 0.18, G.ch * 0.6, 0.36 * a * tk);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // the picture on the wall (faint), the curtains tied back (their inner edges catching the blue)
    R(c, G.g0 + G.cw * 0.58, G.h0 + G.ch * 0.58, G.g0 + G.cw * 0.82, G.h0 + G.ch * 0.77, rgb(mixc([10, 12, 24], tc, 0.16 * a * tv.k)));
    for (const [p, q, d] of [[G.g0, G.g0 + 0.3, 1], [G.g1 - 0.3, G.g1, -1]]) { c.fillStyle = 'rgb(10,10,22)'; c.beginPath(); c.moveTo(p, G.h1); c.lineTo(q, G.h1); c.quadraticCurveTo(d > 0 ? q - 0.05 : p + 0.05, G.h0 + G.ch * 0.45, d > 0 ? q - 0.12 : p + 0.12, G.h0); c.lineTo(d > 0 ? p : q, G.h0); c.fill(); }
    // the couch's back across the foot of the window; now and then a head on it (+ the cat beside, ears up)
    const cy = G.h0 + G.ch * 0.2;
    c.fillStyle = SIL_TV; c.beginPath(); c.moveTo(G.g0, G.h0); c.lineTo(G.g0, cy - 0.04); c.quadraticCurveTo(G.g0 + G.cw * 0.5, cy + 0.08, G.g1, cy - 0.04); c.lineTo(G.g1, G.h0); c.fill();
    if (people) {
      const slot = Math.floor(t / 47), head = typeof people === 'number' ? people : hsh(slot, 5) < 0.62 ? sm(0, 1.5, t - slot * 47) * (1 - sm(44, 46.5, t - slot * 47)) : 0;
      if (head > 0.01) {
        const hx = G.g0 + G.cw * 0.44, hy = cy - 0.22 + 0.34 * head;
        c.fillStyle = SIL_TV; c.beginPath(); c.arc(hx, hy, 0.15, 0, TAU); c.fill(); c.fillRect(hx - 0.06, hy - 0.2, 0.12, 0.12);
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgb(tc, 0.5 * a * tv.k); c.lineWidth = 0.035; c.beginPath(); c.arc(hx, hy, 0.15, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); c.globalCompositeOperation = 'source-over';
        if (hsh(Math.floor(t / 71), 6) < 0.5) cat(c, hx + 0.48, cy - 0.06, 0.62, { col: SIL_TV, flick: mo ? clamp01(Math.sin(t * 1.9) * 2 - 1) : 0, dir: -1 });
      }
    }
  }
  /** the night lamp (3 am → the wake): the blind down, glowing warm from a small lamp low in the room — the speakeasy never goes dark */
  function nightLamp(E, up = 0) {
    const { c, G, k, t, mo } = E, a = k;
    const g = c.createRadialGradient(G.g0 + G.cw * 0.74, G.h0 + G.ch * 0.18, 0, G.g0 + G.cw * 0.74, G.h0 + G.ch * 0.18, G.ch * 1.1);
    const br = 0.92 + (mo ? 0.04 * Math.sin(t * 0.7) : 0);
    g.addColorStop(0, rgb([255, 206, 140], a * br)); g.addColorStop(0.45, rgb([214, 140, 84], a * 0.85)); g.addColorStop(1, rgb([96, 52, 40], a * 0.9));
    c.fillStyle = g; c.fillRect(G.g0, G.h0, G.cw, G.ch);
    // the blind's folds + its hem (the blind drawn down to `up` of the way up)
    const bv = G.h0 + G.ch * up;
    c.fillStyle = rgb([120, 70, 40], 0.3 * a); for (let v = bv + 0.18; v < G.h1; v += 0.22) c.fillRect(G.g0, v, G.cw, 0.014);
    if (up > 0.01) R(c, G.g0, bv - 0.03, G.g1, bv + 0.02, rgb([90, 50, 30], a));
  }

  // ---------------------------------------------------------------- THE SHOP (the barbershop's big window)
  function shop(c, env, fr, list, o) {
    const sw = env.shopWin; if (!sw) return;
    const [w0, w1, v0, v1] = sw, { k, day, t, mo } = o, open = fr.states.shop === 'open';
    const routine = list.find(e => e.id === 'shop-open'), mirror = list.find(e => e.id === 'mirror');
    const chairX = w0 + (w1 - w0) * 0.36, base = v0 + 0.02;
    let drew = false;
    c.save(); env.map(c); c.beginPath(); c.rect(w0, v0, w1 - w0, v1 - v0); c.clip();
    if (day > 0.01 && (routine || !open)) {
      // CLOSED (before 9, after 6): the shop dim inside (the bake is the open shop by day) — the opening brings the lights up
      const lit = routine ? sm(0.02, 0.12, routine.el / routine.len) : 0;
      c.globalAlpha = day * (1 - lit) * 0.5; R(c, w0, v0, w1, v1, 'rgb(14,12,18)'); c.globalAlpha = 1; drew = true;
    }
    if (day > 0.01 && (open || routine)) {
      c.globalAlpha = day;
      if (routine) shopOpening(c, routine.el / routine.len, { w0, w1, v0, v1, chairX, base, t, mo });
      else barberDay(c, fr, { w0, w1, v0, v1, chairX, base, t, mo });
      c.globalAlpha = 1; drew = true;
    }
    if (mirror && k > 0.01) { mirrorDoor(c, mirror.el / mirror.len, { w0, w1, v0, v1, chairX, base, k, t, glow }); drew = true; }
    c.restore();
    // the gold leaf over whatever moved behind the glass (it is ON the glass)
    if (drew && env.gilt) env.gilt(c);
    // the door's card: CLOSED by day before the opening (the bake says OPEN by day) → flipped at the opening
    if (day > 0.01 && env.card && (!open || routine)) {
      c.save(); env.map(c);
      const flip = routine ? sm(0.3, 0.36, routine.el / routine.len) : 0, [cu, cv] = env.card;
      c.globalAlpha = day;
      const wd = 0.3 * Math.abs(Math.cos(flip * Math.PI));
      R(c, cu - wd, cv - 0.02, cu + wd, cv + 0.2, 'rgb(244,240,228)');
      if (wd > 0.12) { c.save(); c.translate(cu, cv + 0.035); c.scale(1, -1); c.font = '700 11px "Chakra Petch", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.scale(wd / 0.3 / 100, 1 / 100); c.fillStyle = flip > 0.5 ? 'rgb(190,30,36)' : 'rgb(30,30,40)'; c.font = `700 ${flip > 0.5 ? 15 : 11}px "Chakra Petch", sans-serif`; c.fillText(flip > 0.5 ? 'OPEN' : 'CLOSED', 0, 0); c.restore(); }
      c.globalAlpha = 1; c.restore();
    }
  }
  /** the barbershop's day: a customer every ~8 min (in, the cape, the haircut, out), between them the barber reading in his chair */
  function barberDay(c, fr, g) {
    const CYC = 480, el = (fr.sec - (routines['shop-open'] || 9 * 3600) - MOMENT['shop-open'].len) + 40, n = Math.floor(el / CYC), ph = el - n * CYC;
    const { chairX, base, w0, t, mo } = g;
    if (ph < 360) {
      // the haircut: the customer walks in (≤ 14 s), sits, the cape; the barber circling the chair, snipping
      const inn = ph < 14 ? ph / 14 : 1, out = ph > 344 ? (ph - 344) / 16 : 0;
      const sit = sm(0.85, 1, inn) * (1 - sm(0, 0.25, out));
      if (sit < 0.99) { const x = inn < 1 ? lerp(w0 - 0.6, chairX + 0.1, sm(0, 0.85, inn)) : lerp(chairX + 0.1, w0 - 0.7, sm(0.25, 1, out)); figure(c, { x, y: base + 0.95, s: 0.98, legs: 0.95, step: mo ? Math.sin(t * 7) : 0, face: inn < 1 ? 1 : -1, pal: pals(n), hat: 'fedora', arms: [[0.15, 0.1], [0.15, 0.1]] }); }
      if (sit > 0.01) seated(c, chairX, base, sit, pals(n), mo ? t : 0, 1);
      const orbit = mo ? Math.sin(t * 0.13 + n) : 0.3, bx = chairX + 0.62 + 0.18 * orbit, snip = mo ? (Math.sin(t * 9) > 0 ? 1 : 0) : 0;
      figure(c, { x: bx, y: base + 0.95, s: 1.0, legs: 0.95, face: -1, lean: 0.06, tilt: 0.12, pal: BARBER, arms: [[0.3, 1.6 + 0.08 * snip], [0.2, 1.3]], hold: [null, 'scissors'], snip });
    } else {
      // between customers: the barber reading the paper in his own chair
      seated(c, chairX, base, 1, BARBER, 0, 0, true);
    }
  }
  /** a seated figure in the barber chair (the cape: a white bib to the knees); reading: the barber himself with the paper */
  function seated(c, x, base, k, pal, t, cape, reading = false) {
    const y = base + 0.86, s = 0.92, rise = (1 - k) * 0.35;
    figure(c, { x: x + 0.02, y: y + rise, s, face: reading ? 0 : 1, pal, arms: reading ? [[0.5, 1.7], [0.5, 1.7]] : [[0.1, 0.9], [0.1, 0.9]], hold: reading ? ['paper', null] : null, tilt: t ? 0.05 * Math.sin(t * 0.8) : 0 });
    if (cape && k > 0.6) { c.fillStyle = 'rgba(244,244,240,0.96)'; c.beginPath(); c.moveTo(x - 0.28, y + 0.62 * s); c.lineTo(x + 0.3, y + 0.62 * s); c.lineTo(x + 0.62, y - 0.12); c.lineTo(x - 0.36, y - 0.12); c.closePath(); c.fill(); }
  }
  /** THE OPENING (~9 am): the lamp on, the barber in from the back → out to the door (the card flips) → back to the chair; the first
   *  customer in; the cape; the first snips */
  function shopOpening(c, p, g) {
    const { chairX, base, w0, w1, t, mo, v1 } = g;
    if (p > 0.04) { c.globalCompositeOperation = 'lighter'; glow(c, [255, 226, 170], w0 + (w1 - w0) * 0.38, v1 - 0.48, 0.5, 0.55 * sm(0.04, 0.1, p) * (1 - sm(0.06, 0.08, p) * 0.4 * (mo ? (Math.sin(t * 40) > 0 ? 1 : 0) : 0))); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    const walk = mo ? Math.sin(t * 7) : 0;
    let bx = null, face = -1;
    if (p > 0.08 && p < 0.3) { bx = lerp(w1 + 0.3, w0 - 0.6, sm(0.08, 0.3, p)); face = -1; }
    else if (p >= 0.36 && p < 0.5) { bx = lerp(w0 - 0.6, chairX + 0.7, sm(0.36, 0.5, p)); face = 1; }
    else if (p >= 0.5) { bx = chairX + 0.7; face = -1; }
    const cust = p >= 0.48 ? sm(0.48, 0.66, p) : 0;
    if (cust > 0 && cust < 0.85) figure(c, { x: lerp(w0 - 0.6, chairX + 0.1, cust / 0.85), y: base + 0.95, s: 0.98, legs: 0.95, step: walk, face: 1, pal: pals(0), hat: 'fedora' });
    if (cust >= 0.85) seated(c, chairX, base, sm(0.85, 1, cust), pals(0), mo ? t : 0, p > 0.72);
    if (bx != null) { const working = p > 0.74, snip = working && mo ? (Math.sin(t * 9) > 0 ? 1 : 0) : 0; figure(c, { x: bx, y: base + 0.95, s: 1, legs: 0.95, step: p < 0.5 ? walk : 0, face, pal: BARBER, arms: working ? [[0.3, 1.6 + 0.08 * snip], [0.2, 1.3]] : p > 0.66 ? [[1.2, 0.8], [1.2, 0.8]] : [[0.12, 0.1], [0.12, 0.1]], hold: working ? [null, 'scissors'] : null, snip }); }
  }
  /** THE HIDDEN MIRROR DOOR: the mirror right of the chair swings in on its hinge — warm amber light, the bar's bottle shelves
   *  glowing, a silhouette with a glass, the light spilling across the closed shop — then it swings shut */
  function mirrorDoor(c, p, g) {
    const { w0, v0, v1, k, t } = g, glowF = g.glow;
    const o = sm(0, 0.2, p) * (1 - sm(0.76, 0.95, p));
    if (o <= 0.004) return;
    // (the door: the third mirror panel + the shelf under it, from the counter top up — door-sized, right of the chair)
    const m0 = w0 + 0.15 + 2 * 1.0 - 0.02, m1 = m0 + 0.94, mv0 = v0 + 0.47, mv1 = v1 - 0.3;
    c.globalAlpha = k;
    // the bar beyond: amber, the shelves of bottles glowing, a figure raising a glass
    const bg = c.createLinearGradient(0, mv0, 0, mv1); bg.addColorStop(0, 'rgb(255,170,80)'); bg.addColorStop(0.6, 'rgb(220,120,52)'); bg.addColorStop(1, 'rgb(120,56,28)');
    c.fillStyle = bg; c.fillRect(m0, mv0, m1 - m0, mv1 - mv0);
    const r = rngFrom(57), bc = [[255, 196, 90], [120, 220, 140], [255, 90, 80], [255, 240, 190], [140, 190, 255]];
    for (const v of [mv0 + 0.62, mv0 + 0.9, mv0 + 1.16]) { R(c, m0, v - 0.03, m1, v, 'rgb(90,44,22)'); for (let u = m0 + 0.04; u < m1 - 0.04; u += 0.08 + r() * 0.04) { const cc = bc[Math.floor(r() * bc.length)], hh = 0.1 + r() * 0.08; R(c, u, v, u + 0.045, v + hh, rgb(cc)); } }
    const sway = Math.sin(t * 1.6) * 0.05;
    figure(c, { x: m0 + 0.5, y: mv0 + 0.32, s: 0.86, lean: sway, face: -1, hat: 'fedora', arms: [[0.15, 0.3], [0.4, 1.9]], hold: [null, 'glass'], col: 'rgb(40,16,10)' });
    figure(c, { x: m0 + 0.14, y: mv0 + 0.3, s: 0.76, lean: -sway, face: 1, hat: 'cloche', hair: 'bob', dress: true, arms: [[0.2, 0.5], [0.3, 0.4]], col: 'rgb(40,16,10)' });
    // the mirror itself, swung in on its left hinge (foreshortened: narrower, its far edge shorter), catching the light
    const th = o * 1.25, wv = (m1 - m0) * Math.cos(th), ins = 0.12 * Math.sin(th);
    c.fillStyle = 'rgb(46,40,52)'; c.beginPath(); c.moveTo(m0, mv0); c.lineTo(m0 + wv, mv0 + ins); c.lineTo(m0 + wv, mv1 - ins); c.lineTo(m0, mv1); c.closePath(); c.fill();
    c.fillStyle = `rgba(255,214,150,${(0.35 * o).toFixed(3)})`; c.beginPath(); c.moveTo(m0, mv0); c.lineTo(m0 + wv, mv0 + ins); c.lineTo(m0 + wv, mv1 - ins); c.lineTo(m0, mv1); c.closePath(); c.fill();
    // the light spilling into the dark shop: across the floor, the chair's edge, the mirror frames
    c.globalCompositeOperation = 'lighter';
    glowF(c, [255, 170, 90], (m0 + m1) / 2, (mv0 + mv1) / 2, 2.4, 0.7 * o * k, 0.8);
    glowF(c, [255, 190, 110], (m0 + m1) / 2 - 0.6, v0 + 0.3, 2.2, 0.6 * o * k, 0.35);
    glowF(c, [255, 214, 150], (m0 + m1) / 2, (mv0 + mv1) / 2, 0.9, 0.5 * o * k, 1.3);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- the TV's blue LANDING outside the glass (SP2: crisp — the sill's
  // lit top + the reveal + a short fall, flickering with the set; the soft blob over the brick is gone)
  function spills(c, env, fr, t) {
    const w = env.wins.find(o => o.id === 'apartment');
    if (!w || fr.states.apartment !== 'tv' || env.k < 0.02) return;
    const tv = env.f.motion !== false ? tvLight(t, 11) : { k: 0.75, tint: 0.4, warm: 0 };
    c.save(); env.map(c); c.globalCompositeOperation = 'lighter';
    landing(c, glassOf(w), tv.warm ? [255, 206, 160] : mixc([64, 108, 255], [128, 162, 255], tv.tint), 0.75 * env.k * Math.min(0.92, tv.k));
    c.restore();
  }

  // ---------------------------------------------------------------- the sounds (each calls its slot; an empty slot is silent)
  function sound(e, env) {
    const play = env.play; if (!play) return;
    if (e.id === 'mirror') play('door-heavy', { gain: 0.8, pan: -0.55 });
    else if (e.id === 'cat') play('cat-meow', { gain: 0.7, pan: -0.6 });
  }
  /** the beds' levels (sounds.js#speakeasy keeps them, ducked under the music like the city's bed): the club's murmur through the
   *  wall while the bar is open at night (louder on a party night), the TV's murmur upstairs late */
  function bedLevels(k, party) {
    const st = last.states || {};
    return { club: st.bar === 'open' && k > 0.3 ? (party ? 1 : 0.6) * k : 0, party: !!party, tv: st.apartment === 'tv' && k > 0.3 ? 0.7 * k : 0 };
  }

  // ---------------------------------------------------------------- THE TAPS
  function tapPaint(E, tap) {
    const { c, G, t, k, day } = E, el = t - tap.at, p = clamp01(el / 3.2);
    if (tap.kind === 'twitch') {
      // a curtain twitches: its edge pulled aside a hand's width and let go (the room's light through the gap)
      const o = sm(0, 0.12, p) * (1 - sm(0.45, 0.8, p)) * (1 + 0.15 * Math.sin(el * 14) * (1 - p)), gx = G.g0 + G.cw * 0.5;
      c.fillStyle = k > 0.3 ? `rgba(255,214,150,${(0.85 * k).toFixed(2)})` : 'rgba(20,16,22,0.7)'; c.beginPath(); c.moveTo(gx, G.h1); c.lineTo(gx + 0.36 * o, G.h1); c.quadraticCurveTo(gx + 0.3 * o, G.mid, gx, G.h0); c.fill();
      if (o > 0.4) { c.fillStyle = k > 0.3 ? SIL : 'rgb(60,50,56)'; c.beginPath(); c.arc(gx + 0.16 * o, G.mid + 0.32, 0.13, 0, TAU); c.fill(); }
    } else if (tap.kind === 'salute') {
      // the patron in the hat turns + raises his glass to you
      return void patrons(E, { p: 0.12 + 0.6 * sm(0, 0.3, p) * (1 - sm(0.7, 1, p)), solo: true });
    } else if (tap.kind === 'lamp') {
      // the back room's lamp knocked: it swings, the pool of light swaying on the table
      const sw = Math.sin(el * 5) * 0.25 * (1 - p), tx = G.cx + sw, ty = G.h0 + G.ch * 0.22;
      c.globalCompositeOperation = 'lighter'; glow(c, [255, 214, 140], tx, ty + 0.2, 0.7, 0.3 * k * (1 - p)); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    } else peekPaint(E, Math.min(1, 0.15 + p * 0.85), tap.at * 7);
    void day;
  }
  function peekPaint(E, p, seed = 0) {
    const { c, G, k, w } = E, night = k > 0.3;
    const o = sm(0, 0.18, p) * (1 - sm(0.82, 1, p)), look = Math.sin(sm(0.22, 0.8, p) * Math.PI * 2);
    const col = night ? SIL : 'rgb(70,58,60)';
    if (w.id === 'jazz') {
      // under the jazz room's shade: someone ducks under its hem and looks out, left then right (the shade's hem lifted over the head)
      const sv = G.h0 + G.ch * 0.26, x = G.g0 + G.cw * (0.36 + 0.28 * hsh(seed | 0, 9)), rise = 0.42 * o;
      c.save(); c.beginPath(); c.rect(G.g0, G.h0, G.cw, sv - G.h0 + 0.1 * o); c.clip();
      figure(c, { x, y: sv - 0.86 + rise, s: 0.95, face: look > 0.1 ? 1 : look < -0.1 ? -1 : 0, tilt: 0.1, col, arms: [[2.4, 0.5], [0.3, 0.3]] });
      c.restore();
      c.fillStyle = 'rgba(110,60,30,0.85)'; c.beginPath(); c.moveTo(x - 0.34, sv); c.quadraticCurveTo(x, sv + 0.26 * o, x + 0.34, sv); c.lineTo(x + 0.34, sv + 0.05); c.quadraticCurveTo(x, sv + 0.3 * o, x - 0.34, sv + 0.05); c.fill();
      return;
    }
    // behind a curtain: the body hidden by the curtain pulled half across, the HEAD leaning out past its edge (turning to look down the
    // street, left then right), the hand gripping the edge
    const side = hsh(seed | 0, 9) < 0.5 ? -1 : 1, open = -side, x0 = side < 0 ? G.g0 : G.g1;
    const xe = x0 + open * (0.3 + 0.32 * o), y = G.h0 + 0.02;
    figure(c, { x: xe - open * 0.14, y, s: 1, face: look > 0.1 ? 1 : look < -0.1 ? -1 : open, lean: open * 0.24 * o, tilt: -0.12 * look, col, arms: [[0.2, 0.3], [0.2, 0.3]] });
    const cc = night ? 'rgb(130,36,40)' : rgb(tri(E.T, [140, 40, 44], [150, 50, 44], [20, 10, 18]));
    c.fillStyle = cc; c.beginPath(); c.moveTo(x0, G.h1); c.lineTo(xe, G.h1); c.quadraticCurveTo(xe - open * 0.06, G.mid, xe + open * 0.04, G.h0); c.lineTo(x0, G.h0); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)'; for (let u = 0.08; u < Math.abs(xe - x0) - 0.04; u += 0.11) c.fillRect(x0 + open * u, G.h0, 0.03, G.ch);
    c.fillStyle = col; c.beginPath(); c.arc(xe + open * 0.02, G.h0 + G.ch * 0.52, 0.065, 0, TAU); c.fill();
  }

  /** a tap on the speakeasy (screen pt) → { kind, id } or null: a window (its curtain twitches / a head peeks out / the patron
   *  salutes / the lamp swings), the cat (it leaps off) */
  function hit(x, y, wins, t) {
    for (const w of wins) {
      const r = w.rect; if (x < r.x - 2 || x > r.x + r.w + 2 || y < r.y - 2 || y > r.y + r.h + 2) continue;
      const catOn = last.on.find(e => e.id === 'cat' && e.win === w.id);
      if (catOn && catTap < 0) { catTap = t; return { kind: 'cat', id: w.id }; }
      const kind = w.edge ? 'twitch' : w.id === 'bar' ? 'salute' : w.id === 'back' ? 'lamp' : 'peek';
      taps.splice(0, taps.length, ...taps.filter(o => t - o.at < 3.2 && o.id !== w.id), { id: w.id, kind, at: t });
      return { kind: 'window', id: w.id, tap: kind };
    }
    return null;
  }

  // ---------------------------------------------------------------- THE MOMENTS' PAINTERS (PAINT[id](E, el, len, inst))
  const PAINT = {
    wake(E, el, len) {
      const { c, G, k, t, mo } = E, p = el / len, day = 1 - k;
      // the room: the lamp room at night (the morning before the sun), the dark glass by day
      if (k > 0.01) { c.globalAlpha = k; paintLampRoom(c, G, 1); c.fillStyle = 'rgba(236,240,255,0.14)'; c.fillRect(G.g0, G.h0, G.cw, G.ch); c.globalAlpha = 1; }   // (SP2: the dawn's lamp a little paler)
      if (day > 0.01) { c.globalAlpha = day; R(c, G.g0, G.h0, G.g1, G.h1, 'rgb(40,32,38)'); c.globalAlpha = 1; }
      const night = k > 0.4, col = night ? SIL : null, pal = night ? null : DAY_PALS[0];
      // the figure: in from the back (0.18), THE STRETCH (arms up in a V, a yawn, side to side), the watering can at the box
      const inx = sm(0.17, 0.3, p), outx = sm(0.9, 0.99, p), x = G.g0 + G.cw * (1.05 - 0.55 * inx + 0.6 * outx);
      const st = sm(0.3, 0.38, p) * (1 - sm(0.52, 0.58, p)), sway = mo ? Math.sin(el * 2.2) * st : 0;
      const can = sm(0.58, 0.64, p) * (1 - sm(0.84, 0.9, p)), pour = sm(0.64, 0.68, p) * (1 - sm(0.8, 0.84, p));
      const sashUp = sm(0.56, 0.62, p) * (1 - sm(0.84, 0.9, p));
      if (inx > 0.01 && outx < 0.99) {
        const arms = st > 0.02 ? [[0.2 + 2.6 * st, 0.15], [0.2 + 2.6 * st, 0.15]] : can > 0.02 ? [[0.15, 0.2], [0.5 + 0.6 * can, 0.5 + 0.2 * pour]] : [[0.12, 0.15], [0.12, 0.15]];
        figure(c, { x, y: G.h0 + 0.02 - 0.06 * st, s: 1.02, lean: 0.14 * sway + 0.22 * can, tilt: -0.3 * st, face: can > 0.2 ? 1 : 0, arms, hold: [null, can > 0.02 ? 'can' : null], pour: pour * 0.9, hair: 'bun', col, pal });
      }
      // the lower sash raised for the watering (its bottom rail up a third of the glass, the gap open under it)
      if (sashUp > 0.01) { const sv = G.h0 + G.ch * 0.3 * sashUp; R(c, G.g0, sv - 0.06, G.g1, sv, E.frameC); }
      // the blind: down until the wake, rolled up in its first seconds
      const up = sm(0.02, 0.16, p), bv = lerp(G.h0, G.h1, up);
      if (up < 0.995) {
        if (k > 0.01) { c.save(); c.beginPath(); c.rect(G.g0, bv, G.cw, G.h1 - bv); c.clip(); nightLamp(E, 0); c.restore(); }
        if (day > 0.01) { c.globalAlpha = day; R(c, G.g0, bv, G.g1, G.h1, rgb(tri(E.T, [232, 220, 192], [240, 196, 150], [60, 50, 50]))); c.globalAlpha = 1; }
        R(c, G.g0, bv, G.g1, bv + 0.05, 'rgb(90,60,40)'); R(c, G.cx - 0.03, bv - 0.1, G.cx + 0.03, bv, E.frameC);
      }
      // the water: drops falling from the spout through the open sash onto the geraniums below the sill (outside)
      if (pour > 0.05 && mo) E.after.push(() => {
        const sx = x + 0.62, sy = G.h0 + 0.36;
        c.fillStyle = night ? 'rgba(255,220,170,0.85)' : 'rgba(200,226,255,0.95)';
        for (let i = 0; i < 6; i++) { const q = ((t * 1.6 + i / 6) % 1), dx = sx + 0.05 * Math.sin(i * 2.3), dy = sy - q * 0.85; if (dy > G.r0 - 0.42) { c.beginPath(); c.arc(dx, dy, 0.035, 0, TAU); c.fill(); } }
      });
      void t;
    },
    'lights-out'(E, el, len) {
      const { c, G, k } = E, p = el / len;
      if (k < 0.01) return;
      const lamp = 1 - sm(0.24, 0.27, p), tvOn = sm(0.36, 0.56, p);
      c.globalAlpha = k;
      if (lamp > 0.01) { paintLampRoom(c, G, lamp); if (tvOn > 0) { c.globalAlpha = k * tvOn; tvRoom(E, tvOn, sm(0.55, 0.9, p)); } }
      else tvRoom(E, tvOn * (0.6 + 0.4 * ((E.t * 9) % 1 > 0.3 ? 1 : 0.4) * (1 - sm(0.5, 0.56, p)) + 0.4 * sm(0.5, 0.56, p)), sm(0.55, 0.9, p));
      c.globalAlpha = 1;
    },
    bartender(E, el, len) {
      const { c, G, k } = E, p = el / len, day = 1 - k;
      // (an evening already dark — winter: the routine runs over the lit bar; by day the half-drawn shade + the lights one by one)
      const shade = sm(0.02, 0.12, p), lit = sm(0.14, 0.46, p);
      if (day > 0.01) { c.globalAlpha = day; barAfternoon(E, shade, lit); c.globalAlpha = 1; }
      if (k > 0.01) { c.globalAlpha = k; paintBar(c, G, Math.max(0.2, lit), 0); bartender(E, 'night', lit); c.globalAlpha = 1; }
    },
    dance(E, el, len, inst) {
      const { c, G, kl, mo } = E, p = el / len, dir = hsh(inst.n, 2) < 0.5 ? 1 : -1, sv = G.h0 + G.ch * 0.26;
      const x = lerp(dir > 0 ? G.g0 - 0.9 : G.g1 + 0.9, dir > 0 ? G.g1 + 0.9 : G.g0 - 0.9, p);
      const spin = sm(0.38, 0.5, p) * (1 - sm(0.56, 0.68, p)), sway = mo ? Math.sin(el * 4.2) : 0, ph = mo ? Math.sin(el * 8.4) : 0;
      c.save(); c.globalAlpha = kl;
      for (const pass of ['shade', 'legs']) {
        c.save(); c.beginPath(); if (pass === 'shade') c.rect(G.g0, sv, G.cw, G.h1 - sv); else c.rect(G.g0, G.h0, G.cw, sv - G.h0); c.clip();
        const col = pass === 'shade' ? SHADOW : LEGS_SH, s = 1.12, y = G.h0 + 0.46;
        // HIM (a fedora, his arm round her / up for her twirl) · HER (the bob, the dress flaring as she spins)
        figure(c, { x: x - dir * 0.26, y, s, legs: 0.5, step: ph, lean: dir * 0.08 * sway, face: dir, hat: 'fedora', col, arms: dir > 0 ? [[0.3, 0.5], [0.9 + 1.6 * spin, 0.5 - 0.4 * spin]] : [[0.9 + 1.6 * spin, 0.5 - 0.4 * spin], [0.3, 0.5]] });
        figure(c, { x: x + dir * (0.24 + 0.08 * spin), y: y - 0.02, s: s * 0.92, legs: 0.48, step: -ph, lean: -dir * 0.1 * sway, face: spin > 0.5 ? dir : -dir, hair: 'bob', dress: true, skirt: 0.3 + 0.7 * spin, col, arms: dir > 0 ? [[0.9 + 1.8 * spin, 0.6], [0.4, 0.3]] : [[0.4, 0.3], [0.9 + 1.8 * spin, 0.6]] });
        c.restore();
      }
      c.restore(); c.globalAlpha = 1;
    },
    toast(E, el, len) { const { c, kl } = E; c.globalAlpha = kl; patrons(E, { p: el / len }); c.globalAlpha = 1; },
    sax() { /* (drawn by saxPlayer with the solo) */ },
    cat(E, el, len, inst) {
      const { c, G, kl, k, t, mo, w } = E, p = el / len;
      const night = k > 0.3, a = night ? Math.max(0.2, kl) : 1, col = night ? (last.states.apartment === 'tv' && w.id === 'apartment' ? SIL_TV : 'rgb(16,8,8)') : 'rgb(30,26,30)';
      const x = w.edge ? G.g0 + G.cw * 0.74 : G.g0 + G.cw * 0.66, y = G.h0 + 0.03;
      const tapped = catTap >= 0 && t - catTap < 0.9 ? (t - catTap) / 0.9 : catTap >= 0 && t - catTap < len ? 1.01 : -1;
      if (tapped > 1) return;
      const up = sm(0, 0.07, p), down = tapped >= 0 ? tapped : sm(0.9, 0.98, p);
      if (up >= 1 && down <= 0) { const fl = mo ? Math.pow(clamp01(Math.sin(el * 2.6 + inst.n) * 1.6 - 0.6), 2) : 0; c.globalAlpha = a; cat(c, x, y, 1.12, { pose: 0, flick: fl, dir: -1, look: mo ? Math.sin(el * 0.5) : 0, col }); c.globalAlpha = 1; return; }
      // the leap up (an arc from below the sill) / the hop down (off the back)
      const q = up < 1 ? up : down, j = up < 1 ? 1 - up : down;
      c.globalAlpha = a; cat(c, x + (up < 1 ? 0.4 * j : -0.5 * j), y - 0.7 * j * j + (up < 1 ? 0.15 * Math.sin(Math.PI * q) : 0.25 * Math.sin(Math.PI * j)), 1.12, { pose: j > 0.15 ? 1 : 0, dir: up < 1 ? -1 : 1, col }); c.globalAlpha = 1;
    },
    peek(E, el, len, inst) { const { c, kl, k } = E; c.globalAlpha = k > 0.3 ? kl : 1; peekPaint(E, el / len, inst.n); c.globalAlpha = 1; },
    tango(E, el, len) {
      // THE TANGO (legendary): a top hat + a flapper dress, in every window in turn (TANGO_PATH: the top floor left → right, then the
      // bar floor right → left), each pass with its own figure — the stride, the turn, THE DIP, the kick
      const { c, G, w, kl, mo } = E, i = TANGO_PATH.indexOf(w.id), slot = len / TANGO_PATH.length, e = el - i * slot;
      if (i < 0 || e < 0 || e > slot) return;
      const p = e / slot, dir = i < 3 ? 1 : -1, jazz = w.id === 'jazz', sv = G.h0 + G.ch * 0.26;
      const x = lerp(dir > 0 ? G.g0 - 0.8 : G.g1 + 0.8, dir > 0 ? G.g1 + 0.8 : G.g0 - 0.8, p);
      const move = ['stride', 'turn', 'dip', 'kick', 'dip', 'turn'][i], m = sm(0.36, 0.48, p) * (1 - sm(0.56, 0.68, p));
      const step = mo ? Math.sin(e * 6) : 0, s = 0.98, y = G.h0 + 0.4;
      const passes = jazz ? ['shade', 'legs'] : ['clear'];
      c.save(); c.globalAlpha = Math.max(0.35, kl);
      for (const pass of passes) {
        c.save();
        if (pass !== 'clear') { c.beginPath(); if (pass === 'shade') c.rect(G.g0, sv, G.cw, G.h1 - sv); else c.rect(G.g0, G.h0, G.cw, sv - G.h0); c.clip(); }
        const col = pass === 'shade' ? SHADOW : pass === 'legs' ? LEGS_SH : SIL;
        const dip = move === 'dip' ? m : 0, kick = move === 'kick' ? m : 0, turn = move === 'turn' ? m : 0;
        // him: the top hat, the tails, his arm out with her hand (the tango's line), leaning over her in the dip
        figure(c, { x: x - dir * 0.24, y, s, legs: 0.48, step: step * (1 - dip), lean: dir * (0.12 + 0.28 * dip), face: dir, hat: 'top', tails: true, col, arms: dir > 0 ? [[0.2, 0.4], [1.5 - 0.4 * dip, 0.1]] : [[1.5 - 0.4 * dip, 0.1], [0.2, 0.4]] });
        // her: the cloche + its feather, the bob, the fringed dress — bent back in the dip, a leg up in the kick, flaring in the turn
        figure(c, { x: x + dir * (0.26 + 0.1 * dip), y: y - 0.04 - 0.12 * dip, s: s * 0.93, legs: 0.46 + 0.1 * kick, step: kick ? -1.6 * kick : -step, lean: -dir * (0.1 + 0.95 * dip), face: -dir, hat: 'cloche', hair: 'bob', dress: true, skirt: 0.2 + 0.8 * Math.max(turn, kick), col, arms: dir > 0 ? [[1.45 - 0.3 * dip, 0.1], [0.6 + 1.6 * dip, 0.8]] : [[0.6 + 1.6 * dip, 0.8], [1.45 - 0.3 * dip, 0.1]] });
        c.restore();
      }
      c.restore(); c.globalAlpha = 1;
    },
    mirror() { /* (drawn by shop: mirrorDoor) */ },
  };

  return {
    frame, draw, hit, bedLevels,
    paint: PAINT,
    /** a tap on the cat let go (its next instance comes back) */
    catReset() { catTap = -1; },
    debug: () => ({ on: last.on.map(e => ({ id: e.id, win: e.win, el: +e.el.toFixed(1), len: e.len })), states: { ...last.states }, next: last.next, forced: last.forced, sec: Math.round(last.sec || 0), dark: last.dark, full: [...(last.full || [])], blocks: blocks.size }),
    destroy() { for (const cv of sprites.values()) cv.width = cv.height = 0; sprites.clear(); blocks.clear(); },
  };
}
