// CITY 2.0 — THE HARBOR: THE WINDOW FIGURE KIT (C4a split from windows.js): figure() / figures() — the people in the windows (a
// silhouette or lit — SP4's litPal), the rim, the cast + the trace (the e2e's motion probe), the props, the sax, the cat, the palettes.
import { CUR_DEPTH, rgb, TAU, clamp01 } from './window-rooms.js';

// ------------------------------------------------------------------ THE FIGURE KIT (wall units, v up)
/**
 * figure(c, P): a person from the WAIST up (+ the legs with P.legs) — (P.x, P.y) the waist; P.s the scale (1: ~1.02 units from the
 * waist to the crown ≈ 14 pt at 402); lean (rad, + = the top to the right), tilt (the head), face (-1 left … 0 front / back … 1 right —
 * CONTINUOUS: the head turns through it, the nose + the chin grow into profile; 11a-1 — no more snapping from side to side),
 * arms: [[a, e], [a, e]] (left, right: the upper arm's angle from hanging, + = out / up; e = the elbow's bend on top of it),
 * hat: 'fedora' | 'top' | 'cloche' | 'cap' | 'witch' | 'horns' | 'ears' | 'crown' (flowers) | 'sombrero',
 * hair: 'bob' | 'bun' | 'short' | 'long' | null, dress (a flapper: narrower, a dropped waist + a fringed skirt) | gown (to the floor),
 * skirt (the skirt's flare 0..1), legs (the leg length: a full figure), step (-1..1 the stride), hold: [prop, prop] ('glass' | 'can'
 * | 'shaker' | 'broom' | 'cup' | 'scissors' | 'paper' | 'cloth' | 'candle' | 'wand'), col (one fill: a silhouette) or pal { body, skin,
 * hair, hat, legs, prop, arm } (lit by day). glints: where the glasses catch the light (P.glints for a 'lighter' pass).
 * THE RIM (11a-1 — the owner: "a warm rim from each room's lamp"): a silhouette against a lit room carries a thin warm edge all round
 * (the room's light wrapping it) + a stronger one on the lamp's side — P.rim { col: [r,g,b], a, side (-1 | 1: where the lamp is), w }
 * (default: the window's own — setRim()). Costumes ride on the same kit: wraps (a mummy's bandages), sheet (a sheet ghost: the
 * whole figure one draped cloth), cape (a high-collared cape), bones (a skeleton's ribs + arm bones in the lit colour).
 */
export let RIM = null;
/** the window being drawn sets its lamp's rim for the figures in it (null: none) */
export function setRim(r) { RIM = r; }
// WIN — THE MOTION TRACE (the owner: "the toast looks choppy" — measured like PEO): every figure drawn this frame, where + how it
// stands (the window, the waist, the scale, the arms' angles, the lean, the face, the stride) — rebuilt each frame by frame(), read by
// harbor().speakeasy.life.figs. A few small objects a frame: nothing measurable.
let TRACE = [], TRACE_WIN = '';
export function traceWindow(id) { TRACE_WIN = id || ''; }
export function traceReset() { TRACE = []; }
export const traceList = () => TRACE;
const traceOf = P => ({ w: TRACE_WIN, d: CUR_DEPTH, x: +(P.x || 0).toFixed(4), y: +(P.y || 0).toFixed(4), s: +(P.s || 1).toFixed(3), lean: +(P.lean || 0).toFixed(4), face: +(P.face || 0).toFixed(3), step: +(P.step || 0).toFixed(4), arms: P.arms ? P.arms.map(a => (a ? [+a[0].toFixed(4), +a[1].toFixed(4)] : [0, 0])) : null, sil: !P.pal });
/** SP4 — LIT PEOPLE (the owner: "if it's lit in the room you should be able to SEE them, not silhouettes"): P.lit = { col: [r,g,b]
 *  (the room's lamp), side (-1 | 0 | 1: where the lamp is; 0 = above), k (0..1 the room's level) } draws the figure in its palette's REAL
 *  colours tinted by the lamp, MODELLED by it — a lit side, a shade side (a gradient over every shape, away from the lamp; from above:
 *  the shoulders + the hat lit, the waist in shade), the warm rim on the lamp's side — the face a simple lit shape. P.marks = the
 *  clothes' patterns as blocks of colour: 'braces' | 'pocket' (a pocket square) | 'bow' | 'pearls' | 'pinstripe' | 'collar' | 'sash'. */
export function figure(c, P) { TRACE.push(traceOf(P)); castPass(c, P); rimPass(c, P); body(c, P, 0); }
/** a palette in a room's light: each colour toward the lamp's tone, the whole a little under daylight (a lit room at night) */
export function litPal(pal, lamp, k = 1) {
  const out = {}, L = lamp || [255, 222, 176], m = Math.min(1, 0.72 + 0.28 * k);
  for (const key of Object.keys(pal)) {
    const v = pal[key]; if (typeof v !== 'string' || !v.startsWith('rgb')) { out[key] = v; continue; }
    const c = v.match(/[\d.]+/g).map(Number);
    out[key] = `rgb(${Math.min(255, (c[0] * (0.62 + 0.38 * L[0] / 255)) * m) | 0},${Math.min(255, (c[1] * (0.62 + 0.38 * L[1] / 255)) * m) | 0},${Math.min(255, (c[2] * (0.62 + 0.38 * L[2] / 255)) * m) | 0})`;
  }
  return out;
}
/** a GROUP that overlaps (the toast's three, the tango's couple): every rim first, then every body — one figure's rim never lands on
 *  another's dark shape */
export function figures(c, list) { for (const P of list) if (P) { TRACE.push(traceOf(P)); castPass(c, P); } for (const P of list) if (P) rimPass(c, P); for (const P of list) if (P) body(c, P, 0); }
/** SP4 — THE CAST SHADOW (the owner: lit people in 3D): a lit figure throws a soft shadow on the wall / the furniture behind it, away from
 *  the lamp (two offset silhouettes, the farther fainter: a soft edge without a blur) */
function castPass(c, P) {
  if (!P.lit || !P.pal || P.sheet) return;
  const s = P.s || 1, side = P.lit.side || 0, a = P.lit.cast == null ? 0.34 : P.lit.cast;
  if (a <= 0.01) return;
  const dx = side ? -side * 0.075 * s : 0.03 * s, dy = side ? -0.02 * s : P.lit.below ? 0.06 * s : -0.045 * s;   // (lit from below: the shadow climbs the wall)
  c.save();
  body(c, { ...P, col: `rgba(16,8,14,${(a * 0.55).toFixed(3)})`, pal: null, lit: null, hold: null, glints: null, marks: null, bones: null, wraps: null, rim: null, shadePass: true, x: P.x + dx * 1.8, y: P.y + dy * 1.8 }, 0.012 * s);
  body(c, { ...P, col: `rgba(16,8,14,${a.toFixed(3)})`, pal: null, lit: null, hold: null, glints: null, marks: null, bones: null, wraps: null, rim: null, shadePass: true, x: P.x + dx, y: P.y + dy }, 0);
  c.restore();
}
/** SP4 — the VOLUME pass's fill for one form (the lamp decides): a gradient that models the form round — the lit side clear, a CORE
 *  SHADOW three quarters of the way to the far side, the far edge lifted a little by the room's reflected light. FORM = { kind:
 *  'torso' | 'head' | 'hair' | 'hat' | 'limb', … (the geometry in the figure's frame) }; lampSide −1 / 0 (above) / 1; far: the limb on
 *  the far side of a ¾ turn (a touch darker all over) */
const SH = '18,10,16';
function volFill(c, F, k, lampSide, s, below = false) {
  if (!F) return null;
  const A = (a, lift = 0) => `rgba(${SH},${Math.min(1, Math.max(0, a + lift)).toFixed(3)})`;
  const extra = F.far ? 0.12 : 0;
  if (F.kind === 'head' || F.kind === 'hair' || F.kind === 'hat') {
    // a sphere: lit from the lamp's side (or from above; WIN2: from BELOW — a TV screen), the core shadow round the far rim, the rim lifted
    const r = Math.max(F.rx, F.ry), lx = F.cx + (lampSide ? lampSide * F.rx * 0.45 : 0), ly = F.cy + (lampSide ? F.ry * 0.28 : below ? -F.ry * 0.55 : F.ry * 0.5);
    const g = c.createRadialGradient(lx, ly, r * 0.05, F.cx, F.cy, r * 1.25);
    const d = F.kind === 'hair' ? 0.16 : F.kind === 'hat' ? 0.1 : 0;
    g.addColorStop(0, A(0 + extra)); g.addColorStop(0.5, A(0.12 + d + extra)); g.addColorStop(0.8, A(0.52 + d + extra)); g.addColorStop(1, A(0.36 + d + extra));
    return g;
  }
  if (F.kind === 'torso') {
    if (lampSide) {
      const g = c.createLinearGradient(lampSide > 0 ? F.x1 : F.x0, 0, lampSide > 0 ? F.x0 : F.x1, 0);
      g.addColorStop(0, A(extra)); g.addColorStop(0.42, A(0.1 + extra)); g.addColorStop(0.78, A(0.5 + extra)); g.addColorStop(1, A(0.32 + extra));
      return g;
    }
    const g = below ? c.createLinearGradient(0, F.y0, 0, F.y1) : c.createLinearGradient(0, F.y1, 0, F.y0);   // (from above: the shoulders lit, the waist in shade, the hem lifted a touch; from below: the reverse)
    g.addColorStop(0, A(0.02 + extra)); g.addColorStop(0.55, A(0.2 + extra)); g.addColorStop(0.9, A(0.42 + extra)); g.addColorStop(1, A(0.34 + extra));
    return g;
  }
  if (F.kind === 'limb') {
    // a cylinder: across its width, the lit edge the one that faces the lamp (or the upper edge, from above)
    const dx = F.x1 - F.x0, dy = F.y1 - F.y0, L = Math.hypot(dx, dy) || 1; let nx = -dy / L, ny = dx / L;
    const toward = lampSide ? nx * lampSide : below ? -ny : ny;      // (does the normal point at the lamp?)
    if (toward < 0) { nx = -nx; ny = -ny; }
    const mx = (F.x0 + F.x1) / 2, my = (F.y0 + F.y1) / 2, w = F.w;
    const g = c.createLinearGradient(mx + nx * w, my + ny * w, mx - nx * w, my - ny * w);
    g.addColorStop(0, A(extra)); g.addColorStop(0.5, A(0.12 + extra)); g.addColorStop(0.82, A(0.48 + extra)); g.addColorStop(1, A(0.32 + extra));
    return g;
  }
  return null;
}
function rimPass(c, P) {
  const rim = P.rim === undefined ? (P.pal && !P.lit ? null : RIM) : P.rim;
  if (rim && rim.a > 0.01) {
    // THE RIM PASS: the same figure inflated by the rim's width in the room's light, nudged toward the lamp — the dark figure over it
    // leaves a thin warm line round the head, the hat, the shoulders, the arms (crisp, no blur: a few hundredths of a unit)
    const s = P.s || 1, w = (rim.w || 0.03) * s;
    c.save(); c.globalAlpha *= Math.min(1, rim.a);
    body(c, { ...P, col: rgb(rim.col), pal: null, x: P.x + (rim.side || 0) * w * 0.8, y: P.y + (rim.below ? -w * 0.35 : w * 0.35) }, w);
    c.restore();
  }
}
export function body(c, P, inf) {
  const s = P.s || 1, pal = P.pal || null, col = P.col || 'rgb(26,12,10)';
  const fill = k => (pal ? pal[k] || pal.body : col);
  // every shape: filled (+ stroked by the rim's width in the rim pass)
  c.lineJoin = 'round'; c.lineCap = 'round';
  // (SP4 — THE VOLUME PASS: the same shapes again, each filled with ITS form's light — setForm() names the form before each shape)
  const vol = !!P.volPass, lampSide = P.lit ? (P.lit.side || 0) : 0, below = !!(P.lit && P.lit.below), farSide = P.face ? -Math.sign(P.face) : 0;
  let FORM = null; const setForm = o => { FORM = o; };
  const F = k => { if (vol) { const g = volFill(c, FORM, k, lampSide, s, below); if (g) { c.fillStyle = g; c.fill(); } return; } c.fillStyle = fill(k); c.fill(); if (inf) { c.strokeStyle = fill(k); c.lineWidth = inf * 2; c.stroke(); } };
  const f = Math.max(-1, Math.min(1, P.face || 0)), af = Math.abs(f), sf = f < 0 ? -1 : 1;
  c.save(); c.translate(P.x, P.y);
  const woman = !!(P.dress || P.gown || P.hair === 'bob' || P.hair === 'bun' || P.hair === 'long');
  const wh = (woman ? 0.14 : 0.175) * s, sh = (woman ? 0.235 : 0.295) * s * (1 - 0.22 * af), shY = 0.64 * s;
  // ---- the legs (a full figure): trousers tapering to the shoes / stockings under a skirt
  if (P.legs) {
    const L = P.legs, st = (P.step || 0) * 0.16 * s, lw = (woman ? 0.06 : 0.075) * s;
    for (const [dx, sx] of [[-0.075 * s, -st], [0.075 * s, st]]) {
      setForm({ kind: 'limb', x0: dx, y0: 0.03 * s, x1: dx + sx, y1: -L + 0.04 * s, w: lw * 1.2, far: farSide && Math.sign(dx) === farSide });
      c.beginPath(); c.moveTo(dx - lw * 1.15, 0.03 * s); c.lineTo(dx + lw * 1.15, 0.03 * s); c.lineTo(dx + sx + lw * 0.72, -L + 0.04 * s); c.lineTo(dx + sx - lw * 0.72, -L + 0.04 * s); c.closePath(); F('legs');
      // the shoe: a low wedge pointing the way the figure faces
      const fx = f === 0 ? 0 : sf * 0.05 * s;
      c.beginPath(); c.ellipse(dx + sx + fx, -L + 0.012 * s, (0.075 + 0.02 * af) * s, 0.03 * s, 0, 0, TAU); F('legs');
    }
  }
  // ---- the skirt: the flapper's from a dropped waist (its fringe), the gown to the floor
  if (P.dress || P.gown) {
    const fl = clamp01(P.skirt || 0), hw = (P.gown ? 0.26 + 0.12 * fl : 0.2 + 0.18 * fl) * s, hy = P.gown ? -(P.legs || 0.62 * s) + 0.03 * s : -(0.52 - 0.12 * fl) * s;
    setForm({ kind: 'torso', x0: -hw, x1: hw, y0: hy, y1: 0.06 * s });
    c.beginPath(); c.moveTo(-wh, 0.06 * s); c.quadraticCurveTo(-wh - 0.02 * s, hy * 0.4, -hw, hy); c.lineTo(hw, hy); c.quadraticCurveTo(wh + 0.02 * s, hy * 0.4, wh, 0.06 * s); c.closePath(); F('body');
    if (P.dress) { c.beginPath(); for (let i = 0; i <= 10; i++) { const u = -hw + (2 * hw) * i / 10; c.lineTo(u, hy - (i % 2 ? 0.075 : 0.025) * s); } c.lineTo(hw, hy + 0.01 * s); c.lineTo(-hw, hy + 0.01 * s); c.closePath(); F('body'); }
  }
  // ---- a sheet ghost: one draped cloth from the crown to the floor (P.sheet: its sway), two dark eye holes — drawn instead of the body
  if (P.sheet) {
    const sw = P.sway || 0, top = shY + 0.36 * s, foot = P.legs ? -P.legs : -0.5 * s, hw2 = 0.34 * s;
    c.rotate(-(P.lean || 0));
    c.beginPath(); c.moveTo(0, top + 0.03 * s);
    c.bezierCurveTo(0.2 * s, top + 0.02 * s, 0.24 * s, shY + 0.08 * s, sh * 1.05, shY - 0.04 * s);
    c.bezierCurveTo(hw2 + sw * 0.05 * s, shY * 0.4, hw2 + 0.02 * s + sw * 0.08 * s, foot * 0.5, hw2 + sw * 0.1 * s, foot);
    for (let i = 6; i >= 0; i--) { const u = -hw2 + (2 * hw2) * i / 6 + sw * 0.1 * s; c.lineTo(u, foot + (i % 2 ? 0.07 : -0.01) * s + Math.sin(i * 1.7 + sw * 3) * 0.02 * s); }
    c.bezierCurveTo(-hw2 - 0.02 * s + sw * 0.08 * s, foot * 0.5, -hw2 + sw * 0.05 * s, shY * 0.4, -sh * 1.05, shY - 0.04 * s);
    c.bezierCurveTo(-0.24 * s, shY + 0.08 * s, -0.2 * s, top + 0.02 * s, 0, top + 0.03 * s);
    F('body');
    // (WIN — the owner: "the ghost needs BIGGER EYES": two big hollow eyes + a wailing mouth, the three dark holes that say GHOST at the
    // real window size — each eye ~2 × 3 pt at 402, tilted a little inward at the top; the mouth an O below them)
    if (!inf && P.eyes !== false && !P.shadePass && !P.volPass) {
      c.fillStyle = P.eyeCol || 'rgba(10,8,14,0.92)';
      for (const e of [-1, 1]) { c.beginPath(); c.ellipse(e * 0.095 * s + f * 0.03 * s, shY + 0.215 * s, 0.062 * s, 0.085 * s, e * 0.22, 0, TAU); c.fill(); }
      c.beginPath(); c.ellipse(f * 0.03 * s, shY + 0.06 * s, 0.05 * s, 0.068 * s, 0, 0, TAU); c.fill();
    }
    c.restore();
    return;
  }
  c.rotate(-(P.lean || 0));
  // ---- the torso: the waist up the flanks to the armpits, the deltoids' round caps, the trapezius sloping up to the neck
  {
    const ch = (woman ? 0.02 : 0.03) * s * f;      // (in profile the chest leads, the back follows)
    setForm({ kind: 'torso', x0: -sh, x1: sh, y0: 0, y1: shY });
    c.beginPath();
    c.moveTo(-wh, 0);
    c.bezierCurveTo(-wh - 0.015 * s, 0.22 * s, -sh + 0.03 * s - (f < 0 ? ch : 0), shY - 0.26 * s, -sh + 0.01 * s, shY - 0.1 * s);
    c.bezierCurveTo(-sh - 0.005 * s, shY - 0.02 * s, -sh + 0.03 * s, shY + 0.035 * s, -sh + 0.1 * s, shY + 0.045 * s);
    c.quadraticCurveTo(-0.11 * s, shY + 0.06 * s, -0.06 * s, shY + 0.1 * s);
    c.lineTo(0.06 * s, shY + 0.1 * s);
    c.quadraticCurveTo(0.11 * s, shY + 0.06 * s, sh - 0.1 * s, shY + 0.045 * s);
    c.bezierCurveTo(sh - 0.03 * s, shY + 0.035 * s, sh + 0.005 * s, shY - 0.02 * s, sh - 0.01 * s, shY - 0.1 * s);
    c.bezierCurveTo(sh - 0.03 * s + (f > 0 ? ch : 0), shY - 0.26 * s, wh + 0.015 * s, 0.22 * s, wh, 0);
    c.closePath(); F('body');
    if (P.tails) { c.beginPath(); c.moveTo(-wh * 0.9, 0.02 * s); c.lineTo(-wh * 1.2 - f * 0.06 * s, -0.44 * s); c.lineTo(-wh * 0.15, -0.12 * s); c.lineTo(wh * 0.15, -0.12 * s); c.lineTo(wh * 1.2 - f * 0.06 * s, -0.44 * s); c.lineTo(wh * 0.9, 0.02 * s); c.closePath(); F('body'); }
    // the cape: a high stand-up collar behind the head + the cloth falling wide from the shoulders (a vampire's, a witch's cloak)
    if (P.cape) {
      const cw = sh + 0.1 * s, fl = P.capeFlare || 0;
      c.beginPath(); c.moveTo(-sh + 0.04 * s, shY + 0.03 * s); c.quadraticCurveTo(-cw - 0.06 * s - fl * 0.1 * s, -0.1 * s, -cw - fl * 0.18 * s, -(P.legs ? P.legs * 0.85 : 0.5 * s));
      c.lineTo(cw + fl * 0.18 * s, -(P.legs ? P.legs * 0.85 : 0.5 * s)); c.quadraticCurveTo(cw + 0.06 * s + fl * 0.1 * s, -0.1 * s, sh - 0.04 * s, shY + 0.03 * s); c.closePath(); F('cape');
      if (P.cape === 'collar') { c.beginPath(); c.moveTo(-0.16 * s, shY + 0.04 * s); c.lineTo(-0.22 * s, shY + 0.3 * s); c.quadraticCurveTo(-0.1 * s, shY + 0.18 * s, -0.04 * s, shY + 0.1 * s); c.lineTo(0.04 * s, shY + 0.1 * s); c.quadraticCurveTo(0.1 * s, shY + 0.18 * s, 0.22 * s, shY + 0.3 * s); c.lineTo(0.16 * s, shY + 0.04 * s); c.closePath(); F('cape'); }
    }
  }
  // ---- the neck (tapered) + the head on it
  setForm({ kind: 'limb', x0: 0, y0: shY + 0.06 * s, x1: f * 0.012 * s, y1: shY + 0.17 * s, w: 0.05 * s });
  c.beginPath(); c.moveTo(-0.048 * s, shY + 0.06 * s); c.lineTo(-0.042 * s + f * 0.012 * s, shY + 0.17 * s); c.lineTo(0.042 * s + f * 0.012 * s, shY + 0.17 * s); c.lineTo(0.048 * s, shY + 0.06 * s); c.closePath(); F('skin');
  c.save(); c.translate(f * 0.012 * s, shY + 0.13 * s); c.rotate(-(P.tilt || 0));
  const hx = f * 0.012 * s, hy = 0.15 * s, rx = (0.112 + 0.012 * af) * s, ry = 0.138 * s;
  // the skull + the jaw: an egg, the chin a little forward in profile; the nose + the brow in profile (grow in with |face|)
  setForm({ kind: 'head', cx: hx - f * 0.008 * s, cy: hy + 0.01 * s, rx, ry });
  c.beginPath(); c.ellipse(hx - f * 0.008 * s, hy + 0.01 * s, rx, ry, 0, 0, TAU); F('skin');
  if (af > 0.05) {
    const nx = hx + f * rx * 0.86;
    c.beginPath(); c.moveTo(nx, hy + 0.045 * s); c.lineTo(nx + f * 0.042 * s * af, hy - 0.012 * s); c.lineTo(nx + f * 0.012 * s, hy - 0.03 * s);
    c.quadraticCurveTo(nx + f * 0.02 * s * af, hy - 0.075 * s, nx - f * 0.01 * s, hy - 0.1 * s); c.lineTo(nx - f * 0.06 * s, hy - 0.11 * s); c.lineTo(nx - f * 0.05 * s, hy + 0.04 * s); c.closePath(); F('skin');
  } else if (!P.hat || P.hat === 'cap' || P.hat === 'crown') {
    // (front / back: the ears' small bumps break the egg — the head reads as a head, not a ball)
    for (const e of [-1, 1]) { c.beginPath(); c.ellipse(hx + e * rx * 0.98, hy + 0.005 * s, 0.022 * s, 0.035 * s, 0, 0, TAU); F('skin'); }
  }
  // the hair
  const hair = P.hair === undefined ? (!P.hat && !woman ? 'short' : null) : P.hair;
  setForm({ kind: 'hair', cx: hx, cy: hy + 0.06 * s, rx: rx * 1.15, ry: ry * 1.1 });
  if (hair === 'bob') {
    // the 1920s bob: a sleek cap to the jaw, flicking forward at the cheek, the nape bare
    c.beginPath(); c.moveTo(hx - rx * 1.12, hy - 0.06 * s); c.bezierCurveTo(hx - rx * 1.22, hy + 0.12 * s, hx - rx * 0.7, hy + ry * 1.18, hx, hy + ry * 1.12); c.bezierCurveTo(hx + rx * 0.7, hy + ry * 1.18, hx + rx * 1.22, hy + 0.12 * s, hx + rx * 1.12, hy - 0.06 * s);
    c.quadraticCurveTo(hx + rx * 1.0 + f * 0.03 * s, hy - 0.1 * s, hx + rx * 0.82, hy - 0.05 * s); c.lineTo(hx + rx * 0.7, hy + 0.04 * s); c.quadraticCurveTo(hx, hy + ry * 0.62, hx - rx * 0.7, hy + 0.04 * s); c.lineTo(hx - rx * 0.82, hy - 0.05 * s); c.quadraticCurveTo(hx - rx * 1.0 + f * 0.03 * s, hy - 0.1 * s, hx - rx * 1.12, hy - 0.06 * s); c.closePath(); F('hair');
  } else if (hair === 'bun') {
    c.beginPath(); c.ellipse(hx - f * 0.01 * s, hy + 0.045 * s, rx * 1.05, ry * 0.92, 0, Math.PI * 0.08, Math.PI * 0.92); c.closePath(); F('hair');
    c.beginPath(); c.arc(hx - f * 0.13 * s, hy + (af > 0.3 ? 0.06 : 0.17) * s, 0.06 * s, 0, TAU); F('hair');
  } else if (hair === 'long') {
    c.beginPath(); c.moveTo(hx - rx * 1.1, hy + 0.05 * s); c.quadraticCurveTo(hx, hy + ry * 1.35, hx + rx * 1.1, hy + 0.05 * s); c.quadraticCurveTo(hx + rx * 1.25 - f * 0.05 * s, hy - 0.16 * s, hx + rx * 0.9 - f * 0.08 * s, hy - 0.36 * s); c.lineTo(hx - rx * 0.9 - f * 0.08 * s, hy - 0.36 * s); c.quadraticCurveTo(hx - rx * 1.25 - f * 0.05 * s, hy - 0.16 * s, hx - rx * 1.1, hy + 0.05 * s); c.closePath(); F('hair');
  } else if (hair === 'short') {
    c.beginPath(); c.ellipse(hx - f * 0.015 * s, hy + 0.05 * s, rx * 1.04, ry * 0.9, 0, Math.PI * 0.06, Math.PI * 0.94); c.closePath(); F('hair');
  }
  // the hat
  const hat = P.hat;
  setForm({ kind: 'hat', cx: hx, cy: hy + 0.2 * s, rx: 0.24 * s, ry: 0.2 * s });
  if (hat === 'fedora') {
    // the brim (a shallow ellipse, dipping toward the face) + the pinched crown with its dent + the band
    c.save(); c.translate(hx, hy + 0.085 * s); c.rotate(-f * 0.08);
    c.beginPath(); c.ellipse(0, 0, 0.235 * s, 0.038 * s, 0, 0, TAU); F('hat');
    c.beginPath(); c.moveTo(-0.13 * s, 0.01 * s); c.bezierCurveTo(-0.14 * s, 0.1 * s, -0.12 * s, 0.17 * s, -0.07 * s, 0.17 * s); c.quadraticCurveTo(0, 0.145 * s, 0.07 * s, 0.17 * s); c.bezierCurveTo(0.12 * s, 0.17 * s, 0.14 * s, 0.1 * s, 0.13 * s, 0.01 * s); c.closePath(); F('hat');
    c.restore();
  } else if (hat === 'top') {
    c.beginPath(); c.ellipse(hx, hy + 0.1 * s, 0.205 * s, 0.032 * s, 0, 0, TAU); F('hat');
    c.beginPath(); c.moveTo(hx - 0.118 * s, hy + 0.1 * s); c.quadraticCurveTo(hx - 0.105 * s, hy + 0.28 * s, hx - 0.132 * s, hy + 0.46 * s); c.lineTo(hx + 0.132 * s, hy + 0.46 * s); c.quadraticCurveTo(hx + 0.105 * s, hy + 0.28 * s, hx + 0.118 * s, hy + 0.1 * s); c.closePath(); F('hat');
  } else if (hat === 'cloche') {
    // the bell down to the brows, its small turned-down brim, the feather sweeping back
    c.beginPath(); c.moveTo(hx - rx * 1.2, hy + 0.0 * s); c.bezierCurveTo(hx - rx * 1.25, hy + ry * 1.5, hx + rx * 1.25, hy + ry * 1.5, hx + rx * 1.2, hy + 0.0 * s); c.quadraticCurveTo(hx + rx * 1.32 + f * 0.03 * s, hy - 0.045 * s, hx + rx * 0.9, hy - 0.02 * s); c.lineTo(hx - rx * 0.9, hy - 0.02 * s); c.quadraticCurveTo(hx - rx * 1.32 + f * 0.03 * s, hy - 0.045 * s, hx - rx * 1.2, hy); c.closePath(); F('hat');
    c.lineWidth = 0.024 * s + inf * 2; c.strokeStyle = fill('hat'); c.beginPath(); c.moveTo(hx - f * 0.06 * s, hy + 0.15 * s); c.quadraticCurveTo(hx - f * 0.14 * s - 0.02 * s, hy + 0.33 * s, hx - f * 0.26 * s - 0.04 * s, hy + 0.38 * s); c.stroke();
  } else if (hat === 'cap') {
    c.beginPath(); c.ellipse(hx - f * 0.01 * s, hy + 0.075 * s, rx * 1.12, 0.07 * s, -f * 0.1, Math.PI, 0, true); c.closePath(); F('hat');
    c.beginPath(); c.ellipse(hx + (f || 1) * 0.1 * s, hy + 0.07 * s, 0.09 * s, 0.022 * s, 0, 0, TAU); F('hat');
  } else if (hat === 'witch') {
    // the witch's hat: a wide soft brim + a tall cone that bends over at the tip
    c.beginPath(); c.ellipse(hx, hy + 0.08 * s, 0.27 * s, 0.04 * s, -f * 0.06, 0, TAU); F('hat');
    c.beginPath(); c.moveTo(hx - 0.12 * s, hy + 0.08 * s); c.quadraticCurveTo(hx - 0.07 * s, hy + 0.32 * s, hx + 0.02 * s, hy + 0.52 * s); c.quadraticCurveTo(hx + 0.12 * s + f * 0.04 * s, hy + 0.58 * s, hx + 0.2 * s + f * 0.06 * s, hy + 0.5 * s); c.quadraticCurveTo(hx + 0.08 * s, hy + 0.45 * s, hx + 0.12 * s, hy + 0.08 * s); c.closePath(); F('hat');
  } else if (hat === 'horns') {
    for (const e of [-1, 1]) { c.beginPath(); c.moveTo(hx + e * 0.05 * s, hy + 0.1 * s); c.quadraticCurveTo(hx + e * 0.15 * s, hy + 0.2 * s, hx + e * 0.11 * s, hy + 0.27 * s); c.quadraticCurveTo(hx + e * 0.1 * s, hy + 0.19 * s, hx + e * 0.1 * s, hy + 0.09 * s); c.closePath(); F('hat'); }
  } else if (hat === 'ears') {
    for (const e of [-1, 1]) { c.beginPath(); c.moveTo(hx + e * 0.03 * s, hy + 0.12 * s); c.lineTo(hx + e * 0.1 * s, hy + 0.24 * s); c.lineTo(hx + e * 0.12 * s, hy + 0.08 * s); c.closePath(); F('hat'); }
  } else if (hat === 'crown') {
    // a crown of flowers (Day of the Dead): blooms round the head — their colours by day / lit, a bumpy silhouette at night
    const cols = P.crownCols || ['rgb(255,140,30)', 'rgb(236,60,120)', 'rgb(255,200,40)', 'rgb(160,70,200)', 'rgb(255,110,40)'];
    for (let i = 0; i < 7; i++) { const a = Math.PI * (0.12 + 0.76 * i / 6), bx = hx + Math.cos(a) * rx * 1.08, by = hy + 0.02 * s + Math.sin(a) * ry * 0.95; c.beginPath(); c.arc(bx, by, (i % 2 ? 0.042 : 0.052) * s, 0, TAU); if (pal || P.crownLit) { c.fillStyle = cols[i % cols.length]; c.fill(); if (inf) { c.strokeStyle = c.fillStyle; c.lineWidth = inf * 2; c.stroke(); } } else F('hat'); }
  } else if (hat === 'sombrero') {
    c.beginPath(); c.ellipse(hx, hy + 0.08 * s, 0.36 * s, 0.05 * s, -f * 0.05, 0, TAU); F('hat');
    c.beginPath(); c.moveTo(hx - 0.13 * s, hy + 0.09 * s); c.quadraticCurveTo(hx - 0.11 * s, hy + 0.3 * s, hx, hy + 0.32 * s); c.quadraticCurveTo(hx + 0.11 * s, hy + 0.3 * s, hx + 0.13 * s, hy + 0.09 * s); c.closePath(); F('hat');
  }
  c.restore();
  // ---- the arms: tapered (the upper arm fuller than the forearm), round joints, a hand at the end + what it holds
  const arms = P.arms || [[0.1, 0.1], [0.1, 0.1]];
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1, [a, e] = arms[i] || [0.1, 0.1], sx = side * (sh - 0.055 * s), sy = shY - 0.045 * s;
    const ex = sx + side * Math.sin(a) * 0.32 * s, ey = sy - Math.cos(a) * 0.32 * s, fa = a + e, hx2 = ex + side * Math.sin(fa) * 0.29 * s, hy2 = ey - Math.cos(fa) * 0.29 * s;
    const far = !!farSide && side === farSide;        // (a ¾ turn: this arm is on the far side — behind the body, a touch slimmer + darker)
    const seg = (x0, y0, x1, y1, w0, w1) => { if (far) { w0 *= 0.86; w1 *= 0.86; } setForm({ kind: 'limb', x0, y0, x1, y1, w: w0, far }); const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d; c.beginPath(); c.moveTo(x0 + nx * w0, y0 + ny * w0); c.lineTo(x1 + nx * w1, y1 + ny * w1); c.arc(x1, y1, w1, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true); c.lineTo(x0 - nx * w0, y0 - ny * w0); c.arc(x0, y0, w0, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true); c.closePath(); F('arm'); };
    const aw = (woman ? 0.042 : 0.054) * s;
    seg(sx, sy, ex, ey, aw * 1.08, aw * 0.86);
    seg(ex, ey, hx2, hy2, aw * 0.86, aw * 0.66);
    // the hand: a small mitten along the forearm's line (the fingers' mass + the thumb's nub)
    if (!P.noHands) { const dx = Math.sin(fa) * side, dy = -Math.cos(fa); setForm({ kind: 'head', cx: hx2 + dx * 0.035 * s, cy: hy2 + dy * 0.035 * s, rx: 0.05 * s, ry: 0.036 * s, far }); c.beginPath(); c.ellipse(hx2 + dx * 0.035 * s, hy2 + dy * 0.035 * s, 0.05 * s, 0.036 * s, Math.atan2(dy, dx), 0, TAU); F('skin'); }   // (SP5: noHands — the cash count's own hands at the arms' ends)
    if (P.bones && !inf) { c.strokeStyle = P.bones; c.lineWidth = 0.018 * s; c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.lineTo(hx2, hy2); c.stroke(); }
    const hold = P.hold && P.hold[i];
    if (hold && !inf) prop(c, hold, hx2, hy2, side, fa, s, fill('prop'), P);
  }
  // ---- the costumes' marks over the body: a skeleton's ribs + spine, a mummy's bandages (in their own lit colour)
  if (!inf && P.bones) {
    c.strokeStyle = P.bones; c.lineWidth = 0.02 * s;
    c.beginPath(); c.moveTo(0, 0.08 * s); c.lineTo(0, shY); for (let k = 0; k < 4; k++) { const y = shY - 0.1 * s - k * 0.085 * s, w = (0.17 - k * 0.012) * s; c.moveTo(-w, y - 0.03 * s); c.quadraticCurveTo(-w * 0.4, y + 0.02 * s, 0, y); c.quadraticCurveTo(w * 0.4, y + 0.02 * s, w, y - 0.03 * s); } c.stroke();
  }
  if (!inf && P.wraps) {
    c.save(); c.strokeStyle = P.wraps; c.lineWidth = 0.022 * s;
    for (let k = 0; k < 9; k++) { const y = 0.04 * s + k * 0.085 * s, tl = (k % 3 - 1) * 0.06; c.beginPath(); c.moveTo(-0.3 * s, y + tl * s); c.lineTo(0.3 * s, y - tl * s + 0.03 * s); c.stroke(); }
    c.restore();
  }
  // ---- SP4: the clothes' marks (blocks of colour that read at 14 pt: braces over a shirt, a pocket square, a bow tie, pearls, pinstripes)
  if (!inf && P.marks && pal) {
    const mk = pal.marks || 'rgb(40,30,34)', lt = pal.light || 'rgb(240,236,228)';
    for (const m of P.marks) {
      if (m === 'braces') { c.strokeStyle = mk; c.lineWidth = 0.03 * s; c.beginPath(); for (const e of [-1, 1]) { c.moveTo(e * 0.075 * s, 0.02 * s); c.lineTo(e * 0.11 * s, shY - 0.02 * s); } c.stroke(); }
      else if (m === 'vest') { c.fillStyle = mk; c.beginPath(); c.moveTo(-wh * 0.98, 0.0 * s); c.lineTo(wh * 0.98, 0.0 * s); c.lineTo(wh * 0.86, shY - 0.08 * s); c.lineTo(0.1 * s, shY - 0.02 * s); c.lineTo(0, shY - 0.22 * s); c.lineTo(-0.1 * s, shY - 0.02 * s); c.lineTo(-wh * 0.86, shY - 0.08 * s); c.closePath(); c.fill(); }   // (SP5: a dark waistcoat, the shirt a white V at the chest)
      else if (m === 'pocket') { c.fillStyle = lt; c.fillRect(0.08 * s + f * 0.02 * s, shY - 0.22 * s, 0.07 * s, 0.028 * s); }
      else if (m === 'bow') { c.fillStyle = mk; c.beginPath(); c.moveTo(0, shY + 0.07 * s); c.lineTo(-0.06 * s, shY + 0.1 * s); c.lineTo(-0.06 * s, shY + 0.04 * s); c.closePath(); c.fill(); c.beginPath(); c.moveTo(0, shY + 0.07 * s); c.lineTo(0.06 * s, shY + 0.1 * s); c.lineTo(0.06 * s, shY + 0.04 * s); c.closePath(); c.fill(); }
      else if (m === 'pearls') { c.fillStyle = lt; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(i * 0.03 * s + f * 0.01 * s, shY + 0.03 * s - Math.abs(i) * 0.012 * s, 0.013 * s, 0, TAU); c.fill(); } }
      else if (m === 'pinstripe') { c.strokeStyle = lt; c.lineWidth = 0.008 * s; c.globalAlpha *= 0.55; c.beginPath(); for (const u of [-0.12, -0.06, 0, 0.06, 0.12]) { c.moveTo(u * s * 0.8, 0.04 * s); c.lineTo(u * s * 1.3, shY - 0.05 * s); } c.stroke(); c.globalAlpha /= 0.55; }
      else if (m === 'collar') { c.fillStyle = lt; c.beginPath(); c.moveTo(-0.05 * s, shY + 0.08 * s); c.lineTo(-0.1 * s, shY - 0.04 * s); c.lineTo(0, shY - 0.0 * s); c.lineTo(0.1 * s, shY - 0.04 * s); c.lineTo(0.05 * s, shY + 0.08 * s); c.closePath(); c.fill(); }
      else if (m === 'sash') { c.fillStyle = mk; c.beginPath(); c.moveTo(-wh, 0.08 * s); c.lineTo(wh, 0.02 * s); c.lineTo(wh, 0.1 * s); c.lineTo(-wh, 0.16 * s); c.closePath(); c.fill(); }
    }
  }
  // ---- SP4: VOLUME FROM LIGHT (the owner: lit people in 3D, never flat cut-outs) — the same shapes again, each filled with ITS form's
  // gradient (volFill: a lit side, a core shadow, the far edge lifted by reflected light); then the hair's sheen, the clothes' folds and
  // the occlusion where the arms meet the body. The same shapes, so nothing spills.
  if (!inf && P.lit && pal && !P.sheet && !P.volPass) {
    const ls = P.lit.side || 0;
    c.restore();
    body(c, { ...P, volPass: true, hold: null, glints: null, marks: null, bones: null, wraps: null, rim: null }, 0);
    c.save(); c.translate(P.x, P.y); c.rotate(-(P.lean || 0));
    // the folds: two soft creases from the armpit toward the waist on the shade side (+ a dress's vertical falls)
    c.strokeStyle = `rgba(${SH},0.16)`; c.lineWidth = 0.018 * s; c.lineCap = 'round';
    const fx = ls ? -ls : (f ? -Math.sign(f) : 1);
    c.beginPath(); c.moveTo(fx * sh * 0.72, shY - 0.12 * s); c.quadraticCurveTo(fx * sh * 0.3, shY - 0.3 * s, fx * wh * 0.5, 0.08 * s);
    c.moveTo(fx * sh * 0.5, shY - 0.2 * s); c.quadraticCurveTo(fx * sh * 0.18, shY - 0.36 * s, fx * wh * 0.15, 0.1 * s); c.stroke();
    if (P.dress || P.gown) { const hy0 = P.gown ? -(P.legs || 0.62 * s) + 0.03 * s : -(0.52 - 0.12 * clamp01(P.skirt || 0)) * s; c.beginPath(); for (const u of [-0.11, 0.02, 0.13]) { c.moveTo(u * s, -0.02 * s); c.lineTo(u * s * 1.6, hy0 + 0.02 * s); } c.stroke(); }
    // the occlusion where each arm leaves the shoulder (a small dark pool at the joint) + under the chin
    c.fillStyle = `rgba(${SH},0.3)`;
    for (const e of [-1, 1]) { c.beginPath(); c.ellipse(e * (sh - 0.06 * s), shY - 0.07 * s, 0.045 * s, 0.03 * s, 0, 0, TAU); c.fill(); }
    c.beginPath(); c.ellipse(f * 0.012 * s, shY + 0.1 * s, 0.05 * s, 0.025 * s, 0, 0, TAU); c.fill();
    // the hair's sheen: a soft pale highlight on the lit side of the crown (a hat: its crown's edge)
    c.save(); c.translate(f * 0.012 * s, shY + 0.13 * s); c.rotate(-(P.tilt || 0));
    const hxx = f * 0.012 * s, hyy = 0.15 * s, rxx = (0.112 + 0.012 * Math.abs(f)) * s, ryy = 0.138 * s;
    if (hair || P.hat) { c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,240,220,0.14)'; c.beginPath(); c.ellipse(hxx + (ls || 0) * rxx * 0.35, hyy + ryy * (P.lit && P.lit.below ? -0.35 : P.hat ? 0.55 : 0.42), rxx * 0.42, ryy * 0.14, (ls || 0) * 0.35, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; }
    c.restore();
    c.restore();
    return;
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
  else if (kind === 'candle') { c.fillRect(x - 0.022 * s, y - 0.02 * s, 0.044 * s, 0.16 * s); c.fillStyle = P.flame || 'rgb(255,214,120)'; c.beginPath(); c.ellipse(x, y + 0.2 * s, 0.02 * s, 0.04 * s, 0, 0, TAU); c.fill(); if (P.glints) P.glints(c, x, y + 0.2 * s, s * 1.6); }
  else if (kind === 'wand') { c.lineWidth = 0.02 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + side * 0.2 * s, y + 0.18 * s); c.stroke(); if (P.glints) P.glints(c, x + side * 0.2 * s, y + 0.18 * s, s); }
  else if (kind === 'cloth') { c.beginPath(); c.ellipse(x, y + 0.02 * s, 0.06 * s, 0.045 * s, 0.4, 0, TAU); c.fill(); }
}
/** the sax (a curved silhouette held at the mouth: the neck, the body down, the bell turned out) — at (x, y) the mouth, ang the lift */
export function sax(c, x, y, s, ang, dir, col) {
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
export const SIL = 'rgb(24,11,10)', SIL_BACK = 'rgb(84,42,24)', SIL_TV = 'rgb(6,8,22)', SHADOW = 'rgba(78,24,8,0.84)', LEGS_SH = 'rgba(34,10,4,0.95)';
export const DAY_PALS = [
  { body: 'rgb(74,84,104)', skin: 'rgb(214,168,136)', hair: 'rgb(60,40,30)', hat: 'rgb(54,50,58)', legs: 'rgb(50,48,56)', prop: 'rgb(200,206,214)' },
  { body: 'rgb(150,62,58)', skin: 'rgb(196,146,112)', hair: 'rgb(40,28,24)', hat: 'rgb(70,50,44)', legs: 'rgb(60,54,60)', prop: 'rgb(220,220,214)' },
  { body: 'rgb(208,196,170)', skin: 'rgb(222,178,146)', hair: 'rgb(120,80,44)', hat: 'rgb(110,84,60)', legs: 'rgb(70,66,74)', prop: 'rgb(110,140,160)' },
];
export const BARBER = { body: 'rgb(238,236,228)', skin: 'rgb(210,164,130)', hair: 'rgb(44,32,28)', hat: 'rgb(44,32,28)', legs: 'rgb(46,44,52)', prop: 'rgb(214,220,228)', arm: 'rgb(232,230,222)', marks: 'rgb(30,26,34)', m: ['vest', 'bow'] };   // (SP5 — the owner: two white shapes in the shop → the barber's dark vest + black bow tie over his white jacket)
export const pals = n => DAY_PALS[((n % 3) + 3) % 3];
/** SP4 — THE NIGHT'S CLOTHES in real colours (+ `m`: the marks drawn as blocks — braces, a pocket square, a bow tie, pearls, pinstripes),
 *  lit by each room's lamp through litPal(); `light` = the pale marks' colour, `marks` the dark ones' */
const NIGHT_PALS = {
  men: [
    { body: 'rgb(242,238,228)', arm: 'rgb(242,238,228)', skin: 'rgb(224,180,148)', hair: 'rgb(48,32,24)', hat: 'rgb(52,42,44)', legs: 'rgb(44,40,48)', prop: 'rgb(214,220,228)', marks: 'rgb(70,36,40)', light: 'rgb(248,246,240)', m: ['braces'] },     // a white shirt + braces
    { body: 'rgb(38,38,54)', arm: 'rgb(38,38,54)', skin: 'rgb(206,160,128)', hair: 'rgb(30,22,20)', hat: 'rgb(30,30,42)', legs: 'rgb(34,34,46)', prop: 'rgb(214,220,228)', marks: 'rgb(20,20,30)', light: 'rgb(248,246,240)', m: ['collar', 'pocket'] },   // a dark suit + a pocket square
    { body: 'rgb(104,58,40)', arm: 'rgb(104,58,40)', skin: 'rgb(236,196,164)', hair: 'rgb(120,80,40)', hat: 'rgb(90,56,40)', legs: 'rgb(70,46,36)', prop: 'rgb(214,220,228)', marks: 'rgb(40,20,20)', light: 'rgb(248,244,236)', m: ['collar', 'bow'] },      // a brown suit, a bow tie
    { body: 'rgb(50,72,124)', arm: 'rgb(50,72,124)', skin: 'rgb(190,140,110)', hair: 'rgb(24,20,20)', hat: 'rgb(40,44,70)', legs: 'rgb(40,50,84)', prop: 'rgb(214,220,228)', marks: 'rgb(20,24,40)', light: 'rgb(230,236,248)', m: ['collar', 'pinstripe'] }, // navy pinstripe
  ],
  women: [
    { body: 'rgb(184,30,48)', arm: 'rgb(226,184,150)', skin: 'rgb(226,184,150)', hair: 'rgb(60,34,24)', hat: 'rgb(160,24,44)', legs: 'rgb(214,186,166)', prop: 'rgb(214,220,228)', marks: 'rgb(90,10,24)', light: 'rgb(250,246,240)', m: ['pearls'] },        // a red dress + pearls
    { body: 'rgb(36,126,116)', arm: 'rgb(214,170,140)', skin: 'rgb(214,170,140)', hair: 'rgb(28,20,18)', hat: 'rgb(30,100,96)', legs: 'rgb(206,176,156)', prop: 'rgb(214,220,228)', marks: 'rgb(20,60,60)', light: 'rgb(246,240,230)', m: ['sash'] },        // a teal dress, a sash
    { body: 'rgb(238,216,170)', arm: 'rgb(230,188,156)', skin: 'rgb(230,188,156)', hair: 'rgb(136,62,30)', hat: 'rgb(220,190,140)', legs: 'rgb(220,194,174)', prop: 'rgb(214,220,228)', marks: 'rgb(120,80,40)', light: 'rgb(255,252,244)', m: ['pearls'] },  // champagne + pearls, auburn
    { body: 'rgb(72,42,104)', arm: 'rgb(222,178,146)', skin: 'rgb(222,178,146)', hair: 'rgb(206,166,92)', hat: 'rgb(60,34,90)', legs: 'rgb(210,182,162)', prop: 'rgb(214,220,228)', marks: 'rgb(40,20,60)', light: 'rgb(248,244,250)', m: ['sash'] },         // plum, blonde
  ],
};
export const BARTENDER_PAL = { body: 'rgb(32,30,38)', arm: 'rgb(238,234,224)', skin: 'rgb(216,170,136)', hair: 'rgb(36,26,22)', hat: 'rgb(36,26,22)', legs: 'rgb(32,30,38)', prop: 'rgb(214,220,228)', marks: 'rgb(20,18,24)', light: 'rgb(246,244,238)', m: ['collar'] };   // a black waistcoat over a white shirt
export const whoM = n => NIGHT_PALS.men[((n % 4) + 4) % 4], whoW = n => NIGHT_PALS.women[((n % 4) + 4) % 4];
export const NIGHTGOWN = { body: 'rgb(206,218,238)', arm: 'rgb(226,184,150)', skin: 'rgb(226,184,150)', hair: 'rgb(96,56,32)', hat: 'rgb(206,218,238)', legs: 'rgb(206,218,238)', prop: 'rgb(214,220,228)', light: 'rgb(248,250,255)', m: [] };
export const TANGO_HIM = { body: 'rgb(22,20,28)', arm: 'rgb(22,20,28)', skin: 'rgb(214,170,136)', hair: 'rgb(24,18,16)', hat: 'rgb(18,16,22)', legs: 'rgb(22,20,28)', prop: 'rgb(214,220,228)', marks: 'rgb(10,8,12)', light: 'rgb(250,248,244)', m: ['collar', 'bow'] };
export const COSTUME_PALS = {
  witch: { body: 'rgb(22,18,34)', arm: 'rgb(22,18,34)', skin: 'rgb(214,178,150)', hair: 'rgb(150,40,40)', hat: 'rgb(18,14,30)', cape: 'rgb(92,36,140)', legs: 'rgb(22,18,34)', prop: 'rgb(214,220,228)', m: [] },
  devil: { body: 'rgb(188,30,40)', arm: 'rgb(188,30,40)', skin: 'rgb(220,170,140)', hair: 'rgb(30,20,20)', hat: 'rgb(230,50,50)', legs: 'rgb(150,24,32)', prop: 'rgb(214,220,228)', m: [] },
  cat: { body: 'rgb(20,18,24)', arm: 'rgb(20,18,24)', skin: 'rgb(224,184,150)', hair: 'rgb(20,18,24)', hat: 'rgb(20,18,24)', legs: 'rgb(20,18,24)', prop: 'rgb(214,220,228)', light: 'rgb(246,240,236)', m: ['collar'] },
};
/** 11a-1 — THE RIM: each room's lamp colour on its silhouettes' edges + the lamp's side (-1 left, 1 right, 0 behind) */
export const RIM_COL = { bar: [255, 190, 116], jazz: [255, 214, 160], apartment: [255, 206, 190], back: [255, 222, 170], edge2: [255, 230, 196], edge3: [255, 230, 196] };
export const RIM_SIDE = { apartment: -1, bar: 0, jazz: 0, back: 0, edge2: 0, edge3: 0 };

// ------------------------------------------------------------------ THE LIVE LAYER
