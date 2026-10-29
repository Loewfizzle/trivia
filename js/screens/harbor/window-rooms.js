// CITY 2.0 — THE HARBOR: THE WINDOWS' ROOMS (C4a split from windows.js): the shared little helpers, a window's glass in wall units,
// the 2.5D room box (core/harbor-rooms.js) + deepAt (a depth's uniform scale), paintBox, lampFall, walkIn, the rooms' STILL looks
// (paintRoom: the back-bar, the shade, the lamp room, the card table, the curtains — the lit canvas's), the tints.
import { roomBox, lampPool } from '../../core/harbor-rooms.js';
import { rngFrom } from '../../core/rng.js';

export const TAU = Math.PI * 2;
export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const sm = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${+a.toFixed(3)})`;
export const tri = (T, d, g, n) => [0, 1, 2].map(i => d[i] * (T.day || 0) + g[i] * (T.gold || 0) + n[i] * (T.night || 0));
export const hsh = (n, s = 0) => { let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ (s * 0x27d4eb2d); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
export const R = (x, u0, v0, u1, v1, col) => { if (col) x.fillStyle = col; x.fillRect(u0, v0, u1 - u0, v1 - v0); };

// (POLISH 5 — SINGLE BIG PANES, the owner: "the whole point is to be able to see the scenes": the meeting rail SP2 kept high up is gone
// from every upper window — the bake, the lit rooms, the moments, the hush sign — one clear pane each)
/** a window's glass in wall units (the same numbers as speakeasy.js's paintWindow / room): mid = the glass's middle (the moments'
 *  curves) */
export function glassOf(w) {
  const [a, b] = w.u, [r0, r1] = w.v, g0 = a + 0.13 + 0.05, g1 = b - 0.05, h0 = r0 + 0.12, h1 = r1 - 0.06;
  return { a, b, r0, r1, g0, g1, h0, h1, mid: h0 + (h1 - h0) * 0.46, cw: g1 - g0, ch: h1 - h0, cx: (g0 + g1) / 2 };
}

// ------------------------------------------------------------------ WIN — 2.5D ROOMS (core/harbor-rooms.js: the box, PURE)
// (the owner: "rooms felt a little flat, let's try 2.5D") Every room is a BOX IN PERSPECTIVE behind its glass: the back wall shrunk toward
// the room's vanishing point (the scene's, pulled toward the pane), a FLOOR + a LEFT-WALL sliver (the camera is right of the building, its
// eye over the roof — the right wall + the ceiling never show), the lamp's light FALLING OFF (a pool on the floor, a hot spot on the back
// wall, dark corners), everyone AT DEPTH: deepAt(t) draws the glass's picture scaled about the vanishing point — nearer = bigger, walking
// toward the window grows a figure — and a lit figure throws a contact shadow on the floor at its depth (floorShadow).
/** the room's box behind a window (null without a vanishing point — a preview without one draws flat) */
export const boxOf = (G, vp) => (vp ? roomBox(G, vp) : null);
const quad = (x, q) => { x.beginPath(); x.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) x.lineTo(q[i][0], q[i][1]); x.closePath(); };
export let CUR_DEPTH = 0;
/** draw at depth t (0 = the glass, 1 = the back wall): ONE uniform scale about the room's vanishing point */
export function deepAt(x, B, t, fn) {
  if (!B || !(t > 0)) return fn();
  x.save(); const s = B.scale(t); x.translate(B.vp.u, B.vp.v); x.scale(s, s); x.translate(-B.vp.u, -B.vp.v);
  const was = CUR_DEPTH; CUR_DEPTH = t; const r = fn(); CUR_DEPTH = was; x.restore(); return r;
}
/** THE BOX's faces: the floor (floor[0] at the glass → floor[1] at the back), the left wall (side[0] → side[1]), the back wall (wall[0] at
 *  its foot → wall[1] at its top), a hair of dark where they meet; o.flat() paints the old flat room when there is no box */
export function paintBox(x, G, B, o) {
  if (!B) { if (o.flat) o.flat(); return; }
  const { back } = B, F = B.faces;
  if (F.floor) { const g = x.createLinearGradient(0, G.h0, 0, back.h0); g.addColorStop(0, rgb(o.floor[0])); g.addColorStop(1, rgb(o.floor[1] || o.floor[0])); x.fillStyle = g; quad(x, F.floor); x.fill(); }
  if (F.ceiling) { x.fillStyle = rgb(mixc(o.wall[1], [0, 0, 0], 0.3)); quad(x, F.ceiling); x.fill(); }
  if (F.left) { const g = x.createLinearGradient(G.g0, 0, back.g0, 0); g.addColorStop(0, rgb(o.side[0])); g.addColorStop(1, rgb(o.side[1] || o.side[0])); x.fillStyle = g; quad(x, F.left); x.fill(); }
  if (F.right) { x.fillStyle = rgb(o.side[0]); quad(x, F.right); x.fill(); }
  { const g = x.createLinearGradient(0, back.h0, 0, back.h1); g.addColorStop(0, rgb(o.wall[0])); g.addColorStop(1, rgb(o.wall[1])); x.fillStyle = g; x.fillRect(back.g0, back.h0, back.g1 - back.g0, back.h1 - back.h0); }
  x.strokeStyle = 'rgba(0,0,0,0.3)'; x.lineWidth = 0.025; x.strokeRect(back.g0, back.h0, back.g1 - back.g0, back.h1 - back.h0);
  if (F.floor) { x.beginPath(); x.moveTo(G.g0, G.h0); x.lineTo(back.g0, back.h0); x.stroke(); }
}
/** THE LAMP'S LIGHT FALLING OFF over the box: the far corners darkened (a multiply vignette), a pool on the floor under the lamp at its
 *  depth, a hot spot on the back wall round it — lamp { u, v, t } in the glass's units, col [r,g,b], k 0..1 */
export function lampFall(x, G, B, lamp, col, k = 1, o = {}) {
  if (!B || k <= 0.01) return;
  const P = lampPool(B, G, lamp, o);
  x.save(); x.beginPath(); x.rect(G.g0, G.h0, G.g1 - G.g0, G.h1 - G.h0); x.clip();
  { const cx = (B.back.g0 + B.back.g1) / 2, cy = (B.back.h0 + B.back.h1) / 2, r = Math.hypot(G.g1 - G.g0, G.h1 - G.h0) * 0.6, d = Math.round(255 * (1 - P.corner * 0.72 * k));
    const g = x.createRadialGradient(P.wall[0], P.wall[1], r * 0.12, cx, cy, r); g.addColorStop(0, 'rgb(255,255,255)'); g.addColorStop(0.5, 'rgb(255,255,255)'); g.addColorStop(1, `rgb(${d},${d},${d})`);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = g; x.fillRect(G.g0, G.h0, G.g1 - G.g0, G.h1 - G.h0); }
  x.globalCompositeOperation = 'lighter';
  { const [fu, fv, fr] = P.floor; x.save(); x.translate(fu, fv); x.scale(1, 0.3); const g = x.createRadialGradient(0, 0, 0, 0, 0, fr); g.addColorStop(0, rgb(col, 0.4 * k)); g.addColorStop(0.5, rgb(col, 0.13 * k)); g.addColorStop(1, rgb(col, 0)); x.fillStyle = g; x.fillRect(-fr, -fr, fr * 2, fr * 2); x.restore(); }
  { const [wu, wv, wr] = P.wall; const g = x.createRadialGradient(wu, wv, 0, wu, wv, wr); g.addColorStop(0, rgb(col, 0.2 * k)); g.addColorStop(1, rgb(col, 0)); x.fillStyle = g; x.fillRect(wu - wr, wv - wr, wr * 2, wr * 2); }
  x.restore();
}
/** WIN2 — ACT BIG (the owner: "we are on iPhone and NO ZOOM"): every close moment's people ARRIVE + LEAVE by walking through the
 *  room's depth (never a cut) — walkIn(p, o) → { d (the depth now), k (0..1 how "arrived"), x (0..1 along the way) }: in from the
 *  back (o.from, small) to the glass (o.to, big) over o.pin of the moment, back over the last 1 − o.pout; stop-start feet through the
 *  figure's step. The rooms' walls go DARKER than their people (value contrast) — WALL_DARK scales a lit room's wall + side tones. */
export const WALL_DARK = 0.6;
export function walkIn(p, o = {}) {
  const pin = o.pin == null ? 0.22 : o.pin, pout = o.pout == null ? 0.8 : o.pout, from = o.from == null ? 0.8 : o.from, to = o.to == null ? 0.12 : o.to;
  const inK = sm(0, pin, p), outK = sm(pout, 1, p), x = inK * (1 - outK);
  return { d: lerp(from, to, x), k: x, in: inK, out: outK, walking: (p < pin || p > pout) ? 1 : 0 };
}
const darker = (c, k = WALL_DARK) => [c[0] * k, c[1] * k, c[2] * k];
/** SP5 — TWO-BONE IK for the kit's arms: the hand's offset from the shoulder (dx, dy — world units, y up) → the kit's [a, e] (the upper
 *  arm's angle from straight down, outward positive on its side; the elbow's bend) so the forearm ends AT the hand (the elbow out) */
export function solveArm(side, dx, dy, L1, L2) {
  const ox = side * dx, dn = -dy, dmax = L1 + L2 - 0.02, dmin = Math.abs(L1 - L2) + 0.02;
  const d = Math.max(dmin, Math.min(dmax, Math.hypot(ox, dn) || 1e-6)), phi = Math.atan2(ox, dn);
  const beta = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)))), a = phi + beta;
  const ex = side * Math.sin(a) * L1, ey = -Math.cos(a) * L1;
  const fa = Math.atan2(side * (dx - ex), -(dy - ey));
  return [a, fa - a];
}
/** a figure's contact shadow on the floor (drawn inside its depth frame: y = the floor line there) */
export function floorShadow(c, x, y, s, a = 0.3) { c.save(); c.fillStyle = `rgba(10,6,12,${a.toFixed(3)})`; c.beginPath(); c.ellipse(x, y, 0.24 * s, 0.055 * s, 0, 0, TAU); c.fill(); c.restore(); }

// ------------------------------------------------------------------ THE ROOMS' STILL LOOKS (cached in the lit canvas)
/** a room's still look at night. SP2 — LESS INSIDE (the owner: the rooms read as busy fragments at ~25 pt): each room is a warm wall,
 *  ONE light source and one or two strong shapes; furniture dim + simple; curtains only framing the edges. (7b: the people are live.) */
export function paintRoom(x, w, o = {}) {
  const G = glassOf(w), { g0, g1, h0, h1, cw, ch } = G, B = boxOf(G, o.vp);   // (WIN: the room's box — o.vp the vanishing point in wall units)
  x.save(); x.beginPath(); x.rect(g0, h0, cw, ch); x.clip();
  const warm = (c0, c1) => { const g = x.createLinearGradient(0, h1, 0, h0); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(g0, h0, cw, ch); };
  if (w.lit === 'bar') paintBar(x, G, 1, o.dim || 0, B);
  else if (w.lit === 'shade') {
    // THE JAZZ ROOM behind an amber shade (three quarters down: the room's lamp behind it the one light) — the sax player is live
    // (SP3 — the owner: "way too orange": each room its own soft warm white — the jazz room HONEY behind its shade)
    // (WIN: the box in honey — its floor + left wall show under the shade's hem)
    paintBox(x, G, B, { wall: [[128, 92, 66], [236, 198, 146]], floor: [[66, 42, 30], [96, 62, 42]], side: [[98, 68, 48], [160, 112, 80]], flat: () => warm('rgb(236,198,146)', 'rgb(128,92,66)') });
    if (B) lampFall(x, G, B, { u: G.cx + 0.2, v: h0 + ch * 0.62, t: 0.85 }, [255, 214, 150], 0.9, { reach: 1.3, corner: 0.5 });
    // (9e — THE SAX REWORK, the owner: "comically cheap" → the shadow puppet dropped: the SHADE UP — a short rolled valance at the head
    // (its amber cloth, the hem), the honey room open below it: the musician stands LIT in it, live — windows.js#saxPlayer)
    const vh = h1 - ch * 0.17;
    const g = x.createLinearGradient(0, vh, 0, h1);
    g.addColorStop(0, 'rgb(214,160,100)'); g.addColorStop(0.5, 'rgb(244,204,148)'); g.addColorStop(1, 'rgb(176,120,70)');
    x.fillStyle = g; x.fillRect(g0, vh, cw, h1 - vh);
    R(x, g0, vh - 0.04, g1, vh, 'rgba(110,60,30,0.85)');
  } else if (w.lit === 'lamp') paintLampRoom(x, G, 1, B);
  else if (w.lit === 'table') {
    // THE BACK ROOM: dark, ONE green-shaded lamp low over a round table (its pool of light), the heads round it
    // (WIN: a dark box; the table + the players + the lamp at mid depth; the lamp's pool on the floor under them)
    paintBox(x, G, B, { wall: [[46, 26, 18], [70, 40, 28]], floor: [[30, 18, 14], [46, 28, 20]], side: [[36, 20, 16], [54, 32, 22]], flat: () => R(x, g0, h0, g1, h1, 'rgb(58,32,22)') });
    const tx = G.cx, ty = h0 + ch * 0.22;
    if (B) lampFall(x, G, B, { u: tx, v: ty + 0.8, t: 0.55 }, [255, 224, 160], 1, { reach: 0.9, corner: 0.7 });
    deepAt(x, B, 0.55, () => {
    const pg = x.createRadialGradient(tx, ty + 0.18, 0, tx, ty + 0.18, 0.95); pg.addColorStop(0, 'rgba(255,234,198,0.7)'); pg.addColorStop(0.45, 'rgba(204,156,112,0.35)'); pg.addColorStop(1, 'rgba(58,32,22,0)'); x.fillStyle = pg; x.fillRect(g0 - 0.5, h0 - 0.5, cw + 1, ch + 1);
    x.fillStyle = 'rgba(255,214,140,0.12)'; x.beginPath(); x.moveTo(tx - 0.16, ty + 0.78); x.lineTo(tx + 0.16, ty + 0.78); x.lineTo(tx + 0.6, ty + 0.04); x.lineTo(tx - 0.6, ty + 0.04); x.fill();
    // (SP4 — LIT PEOPLE: the card players under the lamp are lit from above — a white shirt + a navy jacket, skin, the lamp on the
    // crown + the shoulders, the undersides in shade)
    for (const [dx, sc, hat, shirt] of [[-0.56, 1, true, [236, 226, 206]], [0.58, 0.96, false, [54, 70, 112]]]) {
      const px = tx + dx, sh = 0.34 * sc, top = ty + sh;
      const sg = x.createLinearGradient(0, ty, 0, top); sg.addColorStop(0, rgb(mixc(shirt, [22, 12, 10], 0.72))); sg.addColorStop(1, rgb(mixc(shirt, [255, 234, 198], 0.12)));
      x.fillStyle = sg; x.beginPath(); x.moveTo(px - 0.25 * sc, ty); x.quadraticCurveTo(px - 0.25 * sc, top, px, top + 0.02); x.quadraticCurveTo(px + 0.25 * sc, top, px + 0.25 * sc, ty); x.fill();
      const hy = top + 0.13 * sc, hg = x.createRadialGradient(px, hy + 0.08 * sc, 0.02, px, hy, 0.15 * sc); hg.addColorStop(0, 'rgb(236,196,160)'); hg.addColorStop(0.7, 'rgb(188,136,104)'); hg.addColorStop(1, 'rgb(92,56,40)');
      x.fillStyle = hg; x.beginPath(); x.arc(px, hy, 0.12 * sc, 0, TAU); x.fill();
      if (hat) { R(x, px - 0.19 * sc, top + 0.2 * sc, px + 0.19 * sc, top + 0.235 * sc, 'rgb(70,52,44)'); R(x, px - 0.11 * sc, top + 0.23 * sc, px + 0.11 * sc, top + 0.33 * sc, 'rgb(96,72,58)'); }
      else { x.fillStyle = 'rgb(52,34,24)'; x.beginPath(); x.ellipse(px, hy + 0.05 * sc, 0.125 * sc, 0.1 * sc, 0, Math.PI, 0); x.fill(); }
    }
    x.fillStyle = 'rgb(46,104,62)'; x.beginPath(); x.ellipse(tx, ty, 0.62, 0.13, 0, 0, TAU); x.fill();
    x.fillStyle = 'rgb(98,166,104)'; x.beginPath(); x.ellipse(tx, ty + 0.02, 0.46, 0.075, 0, 0, TAU); x.fill();
    R(x, tx - 0.62, ty - 0.1, tx + 0.62, ty - 0.02, 'rgb(36,20,14)');
    R(x, tx - 0.008, ty + 0.92, tx + 0.008, h1, 'rgb(30,20,16)');
    x.fillStyle = 'rgb(36,104,58)'; x.beginPath(); x.moveTo(tx - 0.1, ty + 0.94); x.lineTo(tx + 0.1, ty + 0.94); x.lineTo(tx + 0.24, ty + 0.78); x.lineTo(tx - 0.24, ty + 0.78); x.fill();
    R(x, tx - 0.24, ty + 0.76, tx + 0.24, ty + 0.79, 'rgb(255,232,170)');
    });
  } else {
    // an EDGE window (ambient only): curtains drawn, glowing with the room's light, a brighter gap between them, two soft folds
    // (WIN: the box behind the curtains — its floor + corner show through the gap)
    paintBox(x, G, B, { wall: [[158, 118, 86], [242, 218, 178]], floor: [[72, 48, 36], [100, 68, 50]], side: [[112, 82, 60], [186, 146, 108]], flat: () => warm('rgb(242,218,178)', 'rgb(158,118,86)') });
    if (B) lampFall(x, G, B, { u: G.cx - 0.3, v: h0 + ch * 0.6, t: 0.8 }, [255, 230, 190], 0.8, { reach: 1.2, corner: 0.45 });
    R(x, g0 + cw * 0.46, h0, g0 + cw * 0.56, h1, 'rgb(255,240,212)');
    x.fillStyle = 'rgba(120,40,24,0.28)'; for (const f of [0.22, 0.76]) x.fillRect(g0 + cw * f, h0, 0.05, ch);
    if (w.id === 'edge2') { x.fillStyle = 'rgba(30,20,14,0.9)'; for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(g0 + 0.32 + i * 0.12, h0 + 0.2 + (i % 3) * 0.1, 0.13, 0.08, 0.4 * (i - 3), 0, TAU); x.fill(); } R(x, g0 + 0.28, h0, g0 + 0.95, h0 + 0.16, 'rgb(30,18,14)'); }
  }
  // SP2 — each room its OWN bulb (the owner): one incandescent family, never colours — multiplied over the room (+ late: dimmer, warmer)
  { const tn = ROOM_TINT[w.id], lt = clamp01(o.late || 0);
    if (tn || lt > 0) { x.globalCompositeOperation = 'multiply'; if (tn) { x.fillStyle = rgb(tn); x.fillRect(g0, h0, cw, ch); } if (lt > 0) { x.fillStyle = rgb(mixc([255, 255, 255], LATE_TINT, lt)); x.fillRect(g0, h0, cw, ch); } x.globalCompositeOperation = 'source-over'; } }
  x.restore();
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
/** THE BAR's room: the gold back-bar's glow (the pendant over the counter the one light), two shelves of bottles, the counter (lit
 *  0..1: the shelves' lights one by one while the bartender switches them on — lit ≥ 1 all; dim: the last light, only the pendant) */
export function paintBar(x, G, lit = 1, dim = 0, B = null) {
  const { g0, g1, h0, h1, cw, ch } = G, L = (a, b) => Math.round(lerp(a, b, dim));
  // (WIN: the bar as a box — the gold back-bar on the back wall, a dark wood floor, the left wall in the same amber a step darker)
  paintBox(x, G, B, { wall: [darker([L(176, 60), L(98, 34), L(46, 22)]), darker([L(255, 120), L(192, 84), L(108, 50)])], floor: [[L(56, 22), L(30, 14), L(18, 10)], [L(96, 36), L(52, 22), L(28, 14)]], side: [darker([L(110, 40), L(58, 22), L(28, 14)]), darker([L(196, 80), L(118, 46), L(60, 28)])],
    flat: () => { const g = x.createLinearGradient(0, h1, 0, h0); g.addColorStop(0, `rgb(${L(150, 50)},${L(80, 28)},${L(40, 18)})`); g.addColorStop(0.42, `rgb(${L(255, 120)},${L(192, 84)},${L(108, 50)})`); g.addColorStop(1, `rgb(${L(176, 60)},${L(98, 34)},${L(46, 22)})`); x.fillStyle = g; x.fillRect(g0, h0, cw, ch); } });
  if (B) lampFall(x, G, B, { u: G.cx, v: h1 - 0.38, t: 0.5 }, [255, 206, 130], 1 - dim * 0.5, { reach: 1.1, corner: 0.55 });
  const r = rngFrom(31), bc = [[255, 170, 60], [90, 200, 110], [230, 60, 60], [255, 230, 170], [120, 170, 255], [255, 140, 40]];
  deepAt(x, B, 1, () => {
  [h0 + ch * 0.44, h0 + ch * 0.64].forEach((v, si) => {
    const on = clamp01((lit * 2 - si)) * (1 - dim * 0.75);
    R(x, g0, v - 0.04, g1, v, 'rgb(96,52,28)');
    for (let u = g0 + 0.1; u < g1 - 0.1; u += 0.15 + r() * 0.05) {
      const c = bc[Math.floor(r() * bc.length)], hh = 0.14 + r() * 0.08;
      R(x, u, v, u + 0.07, v + hh, rgb(mixc([60, 34, 24], c, 0.25 + 0.75 * on))); R(x, u + 0.022, v + hh, u + 0.048, v + hh + 0.05, rgb(mixc([60, 34, 24], c, 0.2 + 0.6 * on)));
      if (on > 0.05) R(x, u + 0.014, v + hh * 0.35, u + 0.028, v + hh * 0.85, `rgba(255,255,240,${(0.75 * on).toFixed(3)})`);
    }
  });
  });
  // the pendant over the counter (mid depth): its cord, a small shade, the bulb (a crisp core + a tight halo)
  deepAt(x, B, 0.5, () => {
  const px = g0 + cw * 0.5, py = h1 - 0.34; R(x, px - 0.008, py, px + 0.008, h1 + 0.6, 'rgb(60,40,30)');
  x.fillStyle = 'rgb(70,44,28)'; x.beginPath(); x.moveTo(px - 0.05, py + 0.06); x.lineTo(px + 0.05, py + 0.06); x.lineTo(px + 0.13, py - 0.02); x.lineTo(px - 0.13, py - 0.02); x.fill();
  const lg = x.createRadialGradient(px, py - 0.04, 0, px, py - 0.04, 0.3); lg.addColorStop(0, 'rgba(255,250,224,1)'); lg.addColorStop(0.3, 'rgba(255,220,150,0.55)'); lg.addColorStop(1, 'rgba(255,190,100,0)'); x.fillStyle = lg; x.fillRect(px - 0.3, py - 0.34, 0.6, 0.6);
  });
  // the counter (nearer than the pendant: its front + its lit top edge)
  deepAt(x, B, 0.3, () => { R(x, g0 - 0.4, h0 - 0.4, g1 + 0.4, h0 + ch * 0.3, 'rgb(70,34,20)'); R(x, g0 - 0.4, h0 + ch * 0.3 - 0.05, g1 + 0.4, h0 + ch * 0.3, `rgb(${L(230, 120)},${L(170, 80)},${L(90, 40)})`); });
}
/** THE APARTMENT's lamp room: a warm wall, ONE fringed floor lamp (its light on the wall round it), the armchair's back, the curtains
 *  tied back at the edges (lamp: the lamp's light 0..1 — the lights-out click takes it down) */
export function paintLampRoom(x, G, lamp = 1, B = null) {
  const { g0, g1, h0, h1, cw, ch } = G;
  // (SP3: the apartment's lamp a faint ROSE — not one flat orange) (WIN: a rose box — the floor lamp by the back wall, the armchair mid-room)
  const c0 = mixc([40, 26, 30], [232, 180, 168], lamp), c1 = mixc([22, 14, 20], [146, 98, 96], lamp);
  paintBox(x, G, B, { wall: [darker(c0, 0.7), darker(c1, 0.7)], floor: [mixc([24, 16, 18], [84, 56, 50], lamp), mixc([30, 20, 22], [118, 80, 72], lamp)], side: [darker(mixc([30, 18, 22], [150, 108, 100], lamp), 0.7), darker(mixc([36, 22, 26], [200, 150, 140], lamp), 0.7)],
    flat: () => { const g = x.createLinearGradient(0, h1, 0, h0); g.addColorStop(0, rgb(c0)); g.addColorStop(1, rgb(c1)); x.fillStyle = g; x.fillRect(g0, h0, cw, ch); } });
  const lx = g0 + cw * 0.3, ly = h0 + ch * 0.72;
  if (B && lamp > 0.02) lampFall(x, G, B, { u: lx, v: ly, t: 0.8 }, [255, 230, 186], lamp, { reach: 1.25, corner: 0.55 });
  deepAt(x, B, 0.8, () => {
  if (lamp > 0.02) { const lg = x.createRadialGradient(lx, ly, 0, lx, ly, 1.0); lg.addColorStop(0, `rgba(255,236,190,${(0.6 * lamp).toFixed(3)})`); lg.addColorStop(0.4, `rgba(255,204,186,${(0.26 * lamp).toFixed(3)})`); lg.addColorStop(1, 'rgba(255,190,120,0)'); x.fillStyle = lg; x.fillRect(g0 - 0.5, h0 - 0.5, cw + 1, ch + 1); }
  R(x, lx - 0.012, h0 - 0.4, lx + 0.012, ly - 0.08, 'rgb(64,38,26)');
  x.fillStyle = rgb(mixc([60, 46, 40], [255, 236, 180], lamp)); x.beginPath(); x.moveTo(lx - 0.2, ly - 0.08); x.lineTo(lx + 0.2, ly - 0.08); x.lineTo(lx + 0.12, ly + 0.08); x.lineTo(lx - 0.12, ly + 0.08); x.fill();
  x.fillStyle = rgb(mixc([40, 30, 28], [200, 130, 70], lamp)); for (let u = -0.18; u <= 0.18; u += 0.06) x.fillRect(lx + u - 0.008, ly - 0.14, 0.016, 0.06);
  });
  // the armchair's back (one dim shape low in the room, mid depth)
  deepAt(x, B, 0.5, () => { x.fillStyle = rgb(mixc([26, 14, 16], [96, 40, 34], lamp)); x.beginPath(); x.ellipse(g0 + cw * 0.66, h0 + 0.05, 0.44, 0.34, 0, Math.PI, 0, true); x.fill(); });
  for (const [p, q, d] of [[g0, g0 + 0.22, 1], [g1 - 0.22, g1, -1]]) { x.fillStyle = rgb(mixc([40, 14, 18], [130, 36, 40], lamp)); x.beginPath(); x.moveTo(p, h1); x.lineTo(q, h1); x.quadraticCurveTo(d > 0 ? q - 0.04 : p + 0.04, h0 + ch * 0.45, d > 0 ? q - 0.09 : p + 0.09, h0); x.lineTo(d > 0 ? p : q, h0); x.fill(); }
}


// ------------------------------------------------------------------ C4a — THE BARBERSHOP AS A ROOM (review-4 §C1 1a)
// (the owner, Oct 28: "that light has always been off — like you're not using real light": a flat back wall, a veil, a pale oval blob +
// an additive halo + the awning's dodge band over the glass.) Now the shop is a BOX like the rooms upstairs: the MIRROR WALL across the
// back (one panel of it the hidden door to the bar), the black + white tiles on its floor, ONE barber chair mid-room as a bold
// silhouette, ONE lamp with a visible shade over it. The bake paints it by the day's light (paintShopRoom with the look's tones); at
// night the lit canvas paints it again DIM + CLOSED (the lamp's pool on the floor + the chair, the mirrors catching it, the corners
// dark — lampFall), and the live barber, the customer + the mirror door stand in the same box (SHOP_ROOM's depths).
/** the shop window's glass (s.shop.win [w0, w1, v0, v1]) as a room's G */
export function shopGlass(win) {
  const [w0, w1, v0, v1] = win;
  return { g0: w0, g1: w1, h0: v0, h1: v1, cw: w1 - w0, ch: v1 - v0, cx: (w0 + w1) / 2, mid: v0 + (v1 - v0) * 0.46 };
}
/** where the shop's pieces stand (fractions of the glass's width + depths in its box): the chair, the lamp over it, the mirror panels
 *  (pitch + the door = the third), the shelf of tonics; dim: the lamp's level after hours (closed); col: its warm white */
export const SHOP_ROOM = Object.freeze({ chairU: 0.36, chairT: 0.5, lamp: { uK: 0.63, dv: 1.02, t: 0.62 }, mirror: { u0: 0.15, pitch: 1.0, w: 0.9, door: 2, v0: 0.65, top: 0.3 }, shelfT: 0.96, dim: 0.45, col: [255, 232, 200] });
export const shopChairX = G => G.g0 + G.cw * SHOP_ROOM.chairU;
export const shopLamp = G => ({ u: G.g0 + G.cw * SHOP_ROOM.lamp.uK, v: G.h1 - SHOP_ROOM.lamp.dv, t: SHOP_ROOM.lamp.t });
/** the mirror door's panel in the glass's units (at the back wall: draw it through deepAt(…, 1)) → [m0, m1, mv0, mv1] */
export function shopMirrorDoor(G) {
  const M = SHOP_ROOM.mirror, m0 = G.g0 + M.u0 + M.door * M.pitch - 0.02;
  return [m0, m0 + M.w + 0.04, G.h0 + 0.47, G.h1 - M.top];
}
/** THE BARBER CHAIR, front on (its base at `base`, its middle at cx): the porcelain foot, the chrome column + the footrest, the red
 *  leather seat, the armrests, the high back + the headrest — one bold silhouette; P { leather, hi, chrome, foot } ([r,g,b]); rim: a
 *  0..1 warm edge on its top edges (the lamp over it) */
export function barberChair(x, cx, base, P, rim = 0) {
  const y = base + 0.86;
  x.fillStyle = rgb(P.foot); x.beginPath(); x.ellipse(cx + 0.02, base + 0.06, 0.42, 0.07, 0, 0, TAU); x.fill();
  R(x, cx - 0.05, base + 0.06, cx + 0.09, base + 0.56, rgb(P.chrome)); R(x, cx - 0.02, base + 0.06, cx + 0.02, base + 0.56, rgb(mixc(P.chrome, [255, 255, 255], 0.25)));
  x.fillStyle = rgb(P.chrome); x.beginPath(); x.ellipse(cx + 0.3, base + 0.34, 0.2, 0.05, 0, 0, TAU); x.fill();          // (the footrest)
  R(x, cx - 0.3, y - 0.1, cx + 0.34, y + 0.9, rgb(mixc(P.leather, [0, 0, 0], 0.18)));                                  // (the back)
  x.fillStyle = rgb(P.leather); x.beginPath(); x.ellipse(cx + 0.02, y + 1.02, 0.2, 0.1, 0, 0, TAU); x.fill();           // (the headrest)
  R(x, cx - 0.42, y - 0.36, cx + 0.44, y - 0.06, rgb(P.leather));                                                      // (the seat)
  R(x, cx - 0.44, y - 0.06, cx - 0.32, y + 0.46, rgb(P.hi)); R(x, cx + 0.34, y - 0.06, cx + 0.46, y + 0.46, rgb(P.hi)); // (the armrests)
  if (rim > 0.01) {
    const c = rgb([255, 228, 186], Math.min(1, rim));
    R(x, cx - 0.2, y + 1.08, cx + 0.24, y + 1.12, c); R(x, cx - 0.3, y + 0.76, cx + 0.34, y + 0.8, c);
    R(x, cx - 0.44, y + 0.42, cx - 0.32, y + 0.46, c); R(x, cx + 0.34, y + 0.42, cx + 0.46, y + 0.46, c); R(x, cx - 0.42, y - 0.1, cx + 0.44, y - 0.07, c);
  }
}
/** the shop's tones for a light: T { day, gold, night } (the bake: the daylight through the glass), or lit > 0 (the night's lamp —
 *  the lit canvas) */
export function shopTones(T, lit = 0) {
  const t = (d, g, n, l) => (lit > 0 ? l : tri(T, d, g, n));
  return {
    wall: [t([168, 160, 142], [176, 142, 112], [16, 14, 22], [48, 34, 26]), t([198, 190, 170], [204, 166, 130], [20, 18, 28], [64, 46, 34])],
    side: [t([140, 132, 116], [146, 116, 92], [12, 11, 18], [36, 26, 22]), t([176, 168, 150], [180, 146, 116], [16, 14, 22], [52, 38, 30])],
    floor: [t([200, 196, 186], [206, 176, 146], [20, 18, 24], [54, 42, 34]), t([170, 166, 156], [176, 146, 120], [16, 14, 20], [44, 34, 28])],
    tile: t([70, 66, 72], [70, 56, 52], [8, 8, 12], [30, 22, 20]),
    mirror: t([176, 190, 200], [200, 170, 150], [22, 22, 34], [52, 46, 44]), frame: t([118, 92, 52], [130, 90, 56], [30, 24, 22], [70, 52, 34]),
    wood: t([74, 46, 32], [84, 46, 34], [18, 13, 20], [56, 34, 24]),
    leather: t([150, 26, 34], [170, 40, 40], [26, 10, 18], [100, 26, 24]), hi: t([176, 40, 46], [190, 56, 50], [32, 12, 20], [122, 36, 30]),
    chrome: t([200, 204, 210], [230, 200, 170], [40, 40, 54], [132, 112, 92]), foot: t([62, 60, 68], [70, 56, 52], [10, 10, 16], [36, 30, 30]),
    shade: t([46, 92, 70], [60, 86, 64], [10, 16, 16], [40, 70, 54]), iron: t([32, 32, 38], [30, 26, 30], [10, 10, 18], [24, 20, 20]),
    dark: lit > 0 ? 0 : clamp01(T.night || 0),
  };
}
/** THE SHOP AS A ROOM (wall units, v up; the caller clips to the glass): the box (the back wall, the tiled floor, the left wall), the
 *  mirror wall at the back (o.doorOpen: the hidden door's panel left out — the live layer draws it swinging), the counter + the tonics,
 *  the chair mid-room, the lamp over it with its shade (o.lit: the night's lamp on — its pool, the hot spot, the dark corners: lampFall
 *  at o.lit × SHOP_ROOM.dim × 2) */
export function paintShopRoom(x, G, B, o = {}) {
  const C = o.tones || shopTones(o.T || { day: 1, gold: 0, night: 0 }, o.lit || 0), lit = o.lit || 0, { g0, g1, h0, h1, cw } = G;
  paintBox(x, G, B, { wall: C.wall, floor: C.floor, side: C.side, flat: () => R(x, g0, h0, g1, h1, rgb(C.wall[1])) });
  // the floor's black + white tiles, in the box's perspective (rows from the glass to the back wall)
  if (B && B.faces.floor) {
    x.fillStyle = rgb(C.tile);
    const rows = 4, cols = 9;
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      if ((i + j) % 2) continue;
      const t0 = i / rows, t1 = (i + 1) / rows, u0 = g0 + (cw * j) / cols, u1 = g0 + (cw * (j + 1)) / cols;
      quad(x, [B.at(u0, h0, t0), B.at(u1, h0, t0), B.at(u1, h0, t1), B.at(u0, h0, t1)]); x.fill();
    }
  }
  // THE MIRROR WALL (at the back): the counter along its foot, bevelled frames, the silvered glass catching the room (a lighter band)
  const M = SHOP_ROOM.mirror;
  deepAt(x, B, 1, () => {
    R(x, g0, h0, g1, h0 + 0.45, rgb(C.wood)); R(x, g0, h0 + 0.42, g1, h0 + 0.47, rgb(mixc(C.wood, [255, 230, 200], 0.2 * (1 - C.dark))));
    for (let k = 0, u = g0 + M.u0; u < g1 - 0.3; k++, u += M.pitch) {
      if (k === M.door && o.doorOpen) continue;
      R(x, u, h0 + M.v0, u + M.w, h1 - M.top, rgb(C.frame));
      const g = x.createLinearGradient(u, 0, u + M.w - 0.04, 0);
      g.addColorStop(0, rgb(mixc(C.mirror, [0, 0, 0], 0.18))); g.addColorStop(0.5, rgb(mixc(C.mirror, [255, 255, 255], 0.12 * (1 - C.dark)))); g.addColorStop(1, rgb(mixc(C.mirror, [0, 0, 0], 0.24)));
      x.fillStyle = g; x.fillRect(u + 0.04, h0 + M.v0 + 0.04, M.w - 0.08, h1 - M.top - h0 - M.v0 - 0.08);
    }
  });
  // the shelf of tonics on the counter
  deepAt(x, B, SHOP_ROOM.shelfT, () => {
    R(x, g0, h0 + 0.62, g1, h0 + 0.68, rgb(C.wood));
    const rr = rngFrom(7), cols = [[60, 140, 90], [170, 60, 50], [220, 170, 80], [90, 120, 190], [230, 230, 220]];
    for (let u = g0 + 0.2; u < g1 - 0.2; u += 0.16 + rr() * 0.1) { const c = cols[Math.floor(rr() * cols.length)], h = 0.18 + rr() * 0.14; R(x, u, h0 + 0.68, u + 0.08, h0 + 0.68 + h, rgb(mixc(c, C.wall[0], C.dark ? 0.75 : lit ? 0.45 : 0.15))); }
  });
  // the lamp's light FALLS in the room (before the chair: the chair stands in it)
  const L = shopLamp(G);
  if (lit > 0.01 && B) {
    lampFall(x, G, B, L, SHOP_ROOM.col, lit * SHOP_ROOM.dim * 2, { reach: 1.05, corner: 0.75 });
    // (+ a DEFINED pool on the tiles right under the shade — the cone's footprint, its edge soft but readable)
    const [fu, fv] = B.at(L.u, h0, L.t), r = 0.8 * B.scale(L.t), col = SHOP_ROOM.col;
    x.save(); x.globalCompositeOperation = 'lighter'; x.translate(fu, fv); x.scale(1, 0.3);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, rgb(col, 0.3 * lit)); g.addColorStop(0.55, rgb(col, 0.19 * lit)); g.addColorStop(0.82, rgb(col, 0.06 * lit)); g.addColorStop(1, rgb(col, 0));
    x.fillStyle = g; x.fillRect(-r, -r, r * 2, r * 2); x.restore();
  }
  // THE CHAIR mid-room (the live barber + his customer stand round it at the same depth)
  if (!o.noChair) deepAt(x, B, SHOP_ROOM.chairT, () => barberChair(x, shopChairX(G), h0 + 0.02, C, lit * 0.55));
  // THE LAMP over the chair: its cord from the ceiling, an enamel shade (green outside, white inside); lit: the inside of the shade
  // glowing + the bulb under it
  deepAt(x, B, L.t, () => {
    R(x, L.u - 0.012, L.v + 0.1, L.u + 0.012, h1 + 0.6, rgb(C.iron));
    x.fillStyle = rgb(C.shade); x.beginPath(); x.moveTo(L.u - 0.07, L.v + 0.12); x.lineTo(L.u + 0.07, L.v + 0.12); x.lineTo(L.u + 0.22, L.v - 0.04); x.lineTo(L.u - 0.22, L.v - 0.04); x.closePath(); x.fill();
    if (lit > 0.01) {
      x.fillStyle = rgb([255, 236, 200], Math.min(1, 0.6 + lit)); x.beginPath(); x.ellipse(L.u, L.v - 0.04, 0.2, 0.035, 0, 0, TAU); x.fill();
      x.fillStyle = 'rgb(255,250,236)'; x.beginPath(); x.arc(L.u, L.v - 0.06, 0.05, 0, TAU); x.fill();
    } else { x.fillStyle = rgb(mixc(C.shade, [255, 255, 255], 0.35 * (1 - C.dark))); x.fillRect(L.u - 0.2, L.v - 0.045, 0.4, 0.02); }
  });
}
