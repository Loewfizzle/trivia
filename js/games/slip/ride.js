// SLIPSTREAM rider looks (no physics here: both rides share the exact same physics and hitbox).
//   HOVERBOARD — a sleek, faceless silhouette on a glowing board whose underside glows in the player's colour;
//                crouches when diving, tucks into flips.
//   LIGHT-CYCLE — a motorcycle made of light: glowing wheels, an angular body, the rider hunched low.
// Trails: RIBBON, SPARK STREAM or LIGHT WALL, always in the player's colour. Saved on the device
// (localStorage na:slipride) and published in the rider node so ghosts look right.
import { h } from '../../ui/dom.js';
import { segmented } from '../../ui/components.js';
import { sfx } from '../../audio/sfx.js';

const KEY = 'na:slipride';
export const RIDES = [{ value: 'board', label: 'HOVERBOARD' }, { value: 'cycle', label: 'LIGHT-CYCLE' }];
export const TRAILS = [{ value: 'ribbon', label: 'RIBBON' }, { value: 'sparks', label: 'SPARKS' }, { value: 'wall', label: 'LIGHT WALL' }];
const listeners = new Set();

export function loadRide() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
    return { ride: s.ride === 'cycle' ? 'cycle' : 'board', trail: ['ribbon', 'sparks', 'wall'].includes(s.trail) ? s.trail : 'ribbon' };
  } catch { return { ride: 'board', trail: 'ribbon' }; }
}
export function saveRide(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode: this session only */ }
  listeners.forEach(fn => fn(s));
}
export const onRide = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const rideCode = s => `${s.ride === 'cycle' ? 'c' : 'b'}${s.trail[0]}`;
export const decodeRide = code => ({ ride: code && code[0] === 'c' ? 'cycle' : 'board', trail: code && code[1] === 's' ? 'sparks' : code && code[1] === 'w' ? 'wall' : 'ribbon' });

const lerp = (a, b, k) => a + (b - a) * k;

/**
 * Draws a rider. ctx is already translated to the contact point and rotated to the board angle, in a y-UP metric
 * frame (1 unit = 1 m): call drawRider(ctx, { ride, color, crouch 0..1, tuck 0..1, t (seconds), ghost }).
 */
export function drawRider(ctx, { ride = 'board', color = '#3fe0ff', crouch = 0, tuck = 0, t = 0, ghost = false, px = 0.05 }) {
  const lw = Math.max(px * 1.3, 0.035);
  if (ride === 'cycle') return drawCycle(ctx, { color, crouch, tuck, t, ghost, lw });
  // ---- the board: underside glow, deck, nose kick
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, -0.02, 0.05, 0, -0.02, 1.1);
  glow.addColorStop(0, hexA(color, ghost ? 0.35 : 0.75));
  glow.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = glow;
  ctx.save(); ctx.scale(1, 0.32); ctx.beginPath(); ctx.arc(0, -0.05, 1.1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(-0.74, 0.02); ctx.quadraticCurveTo(-0.84, 0.05, -0.82, 0.16);
  ctx.lineTo(0.7, 0.16); ctx.quadraticCurveTo(0.9, 0.16, 0.92, 0.04); ctx.quadraticCurveTo(0.8, 0.01, 0.6, 0.02);
  ctx.closePath();
  ctx.fillStyle = ghost ? hexA('#0b0e20', 0.6) : '#0b0e20';
  ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = hexA(color, ghost ? 0.7 : 1); ctx.stroke();
  // light strip under the deck
  ctx.fillStyle = hexA(color, ghost ? 0.6 : 0.95);
  ctx.fillRect(-0.62, 0.02, 1.26, 0.035);
  // ---- the rider: a faceless silhouette with a rim of light. crouch bends the knees; tuck pulls everything in.
  const k = Math.max(crouch, tuck);
  const hipY = lerp(1.02, 0.66, k) + 0.16, hipX = lerp(-0.06, -0.14, k);
  const kneeY = lerp(0.62, 0.5, k) + 0.16, kneeOut = lerp(0.14, 0.36, k);
  const shY = hipY + lerp(0.6, 0.4, tuck), shX = hipX + lerp(0.14, 0.36, k);
  const headX = shX + lerp(0.07, 0.22, k), headY = shY + lerp(0.27, 0.21, tuck);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const RIM = ghost ? hexA('#d8e0ff', 0.5) : 'rgba(236,240,255,0.92)';
  const BODY = ghost ? hexA('#0b0e20', 0.72) : '#0a0c1c';
  const limb = (pts, wd) => {
    for (const [c, w] of [[RIM, wd + lw * 2], [BODY, wd]]) {
      ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
      ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke();
    }
  };
  // the scarf, streaming behind in the player's colour
  const wv = Math.sin(t * 9) * 0.07, wv2 = Math.sin(t * 9 + 1.6) * 0.1;
  ctx.beginPath();
  ctx.moveTo(shX + 0.04, shY + 0.08);
  ctx.bezierCurveTo(shX - 0.3, shY + 0.14 + wv, shX - 0.55, shY + 0.02 - wv, shX - 0.92, shY + 0.1 + wv2);
  ctx.lineWidth = 0.075; ctx.strokeStyle = hexA(color, ghost ? 0.65 : 1); ctx.stroke();
  limb([-0.3, 0.17, hipX - kneeOut * 0.4, kneeY, hipX, hipY], 0.19);          // back leg
  limb([hipX, hipY, shX, shY], 0.34);                                          // torso
  limb([0.32, 0.17, hipX + kneeOut, kneeY, hipX, hipY], 0.2);                 // front leg
  // arms: out for balance, wrapped around the knees in a tuck
  const handX = lerp(shX + 0.44, hipX + kneeOut, tuck), handY = lerp(shY - 0.2 + Math.sin(t * 3) * 0.03, kneeY + 0.04, tuck);
  const backX = lerp(shX - 0.52, hipX, tuck), backY = lerp(shY - 0.1, kneeY, tuck);
  limb([backX, backY, shX - 0.02, shY - 0.02, handX, handY], 0.1);
  // head: a smooth helmet, a visor in the player's colour
  ctx.beginPath(); ctx.arc(headX, headY, 0.19, 0, Math.PI * 2);
  ctx.fillStyle = BODY; ctx.fill();
  ctx.lineWidth = lw * 1.2; ctx.strokeStyle = RIM; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(headX + 0.03, headY + 0.03); ctx.quadraticCurveTo(headX + 0.14, headY + 0.05, headX + 0.18, headY - 0.01);
  ctx.lineWidth = 0.065; ctx.strokeStyle = hexA(color, ghost ? 0.8 : 1); ctx.stroke();
}

function drawCycle(ctx, { color, crouch, tuck, t, ghost, lw }) {
  const R = 0.33;
  const wheels = [[-0.66, R], [0.68, R]];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [wx, wy] of wheels) {
    const g = ctx.createRadialGradient(wx, wy, R * 0.6, wx, wy, R * 1.9);
    g.addColorStop(0, hexA(color, ghost ? 0.3 : 0.6)); g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(wx, wy, R * 1.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  for (const [wx, wy] of wheels) {
    ctx.beginPath(); ctx.arc(wx, wy, R, 0, Math.PI * 2);
    ctx.fillStyle = ghost ? hexA('#060812', 0.6) : '#060812'; ctx.fill();
    ctx.lineWidth = 0.075; ctx.strokeStyle = hexA(color, ghost ? 0.75 : 1); ctx.stroke();
    ctx.beginPath(); ctx.arc(wx, wy, R * 0.55, 0, Math.PI * 2);
    ctx.lineWidth = 0.03; ctx.strokeStyle = hexA('#ffffff', ghost ? 0.4 : 0.8); ctx.stroke();
    // spokes of light, turning
    const sp = t * 18;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) { const a = sp + i * 2.094; ctx.moveTo(wx + Math.cos(a) * R * 0.2, wy + Math.sin(a) * R * 0.2); ctx.lineTo(wx + Math.cos(a) * R * 0.5, wy + Math.sin(a) * R * 0.5); }
    ctx.lineWidth = 0.025; ctx.strokeStyle = hexA(color, 0.7); ctx.stroke();
  }
  // the body: low, angular, a light line along its spine
  const dip = 0.06 * Math.max(crouch, tuck);
  ctx.beginPath();
  ctx.moveTo(-0.95, 0.42); ctx.lineTo(-0.55, 0.7 - dip); ctx.lineTo(0.1, 0.78 - dip); ctx.lineTo(0.55, 0.92 - dip);
  ctx.lineTo(0.98, 0.62); ctx.lineTo(0.78, 0.46); ctx.lineTo(0.2, 0.4); ctx.lineTo(-0.4, 0.46);
  ctx.closePath();
  ctx.fillStyle = ghost ? hexA('#0a0d1c', 0.65) : '#0a0d1c'; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = hexA(color, ghost ? 0.75 : 1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.85, 0.48); ctx.lineTo(-0.4, 0.62 - dip); ctx.lineTo(0.5, 0.74 - dip); ctx.lineTo(0.88, 0.6);
  ctx.lineWidth = 0.04; ctx.strokeStyle = hexA('#ffffff', ghost ? 0.4 : 0.85); ctx.stroke();
  // the rider, hunched over the bars
  const k = Math.max(crouch, tuck);
  const back = [[-0.25, 0.84 - dip], [0.25, lerp(1.22, 1.06, k) - dip]];
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(back[0][0], back[0][1]); ctx.lineTo(back[1][0], back[1][1]);
  ctx.lineWidth = 0.26 + lw; ctx.strokeStyle = ghost ? hexA('#c9d4ff', 0.55) : '#e8eeff'; ctx.stroke();
  ctx.lineWidth = 0.22; ctx.strokeStyle = ghost ? hexA('#0b0e20', 0.7) : '#0b0e20'; ctx.stroke();
  const hx = back[1][0] + 0.2, hy = back[1][1] + 0.1;
  ctx.beginPath(); ctx.arc(hx, hy, 0.17, 0, Math.PI * 2);
  ctx.fillStyle = ghost ? hexA('#0b0e20', 0.75) : '#0b0e20'; ctx.fill();
  ctx.lineWidth = lw; ctx.strokeStyle = ghost ? hexA('#c9d4ff', 0.6) : '#e8eeff'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 0.03, hy + 0.02); ctx.lineTo(hx + 0.16, hy); ctx.lineWidth = 0.05; ctx.strokeStyle = hexA(color, 1); ctx.stroke();
}

export function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// ---------------------------------------------------------------- the picker sheet
export function openRidePicker({ color = '#3fe0ff' } = {}) {
  let s = loadRide();
  let sheet, raf = 0;
  const cv = h('canvas.sl-pick-cv');
  const close = () => { cancelAnimationFrame(raf); sheet.classList.add('out'); setTimeout(() => sheet.remove(), 260); };
  sheet = h('div.modal', { onclick: e => { if (e.target === sheet) close(); } },
    h('div.sheet.sl-pick', { role: 'dialog', 'aria-label': 'Your ride' },
      h('div.sheet-grip'),
      h('div.sheet-kicker', 'SLIPSTREAM'),
      h('h2.sheet-title', 'YOUR RIDE'),
      h('div.sl-pick-stage', cv),
      h('div.sl-pick-row', h('span.label', 'RIDE'), segmented(RIDES, s.ride, v => { s = { ...s, ride: v }; saveRide(s); sfx('select'); })),
      h('div.sl-pick-row', h('span.label', 'TRAIL'), segmented(TRAILS, s.trail, v => { s = { ...s, trail: v }; saveRide(s); sfx('select'); })),
      h('p.sl-pick-note', 'Both rides handle exactly the same — pick the look you like. Your trail is always your colour.'),
      h('button.btn.btn-primary.btn-block', { type: 'button', onclick: close }, h('span', 'DONE'))));
  document.body.append(sheet);
  // a little live preview: the rider gliding over a slow wave, trail behind
  const trail = [];
  const t0 = performance.now();
  const frame = now => {
    raf = requestAnimationFrame(frame);
    const r = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    const x = cv.getContext('2d');
    const W = cv.width, H = cv.height, t = (now - t0) / 1000;
    x.setTransform(1, 0, 0, 1, 0, 0);
    const bg = x.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1b1442'); bg.addColorStop(0.7, '#3a1d52'); bg.addColorStop(1, '#ff8a5c');
    x.fillStyle = bg; x.fillRect(0, 0, W, H);
    const sc = H / 5.2;
    const ground = u => H * 0.78 - Math.sin(u * 0.5 + t * 0.9) * sc * 0.35;
    // the track line
    x.beginPath();
    for (let px = 0; px <= W; px += 4) { const u = (px - W / 2) / sc; px ? x.lineTo(px, ground(u)) : x.moveTo(px, ground(u)); }
    x.lineWidth = 3 * dpr; x.strokeStyle = 'rgba(255,230,200,0.9)'; x.shadowBlur = 0; x.stroke();
    const cx = W / 2, cy = ground(0);
    const slope = (ground(0.05) - ground(-0.05)) / (0.1 * sc);
    const ang = Math.atan(-slope);
    trail.push([cx - t * 0 , cy, t]);
    // trail: drawn in screen space drifting left
    const pts = [];
    for (let i = 0; i < 26; i++) { const u = -i * 0.28; pts.push([cx + u * sc, ground(u) - 0.25 * sc]); }
    drawTrailPreview(x, pts, s.trail, color, dpr, t);
    x.save();
    x.translate(cx, cy); x.rotate(-ang); x.scale(sc, -sc);
    drawRider(x, { ride: s.ride, color, crouch: 0.3 + 0.3 * Math.sin(t * 1.7), tuck: 0, t, px: 1 / sc });
    x.restore();
  };
  raf = requestAnimationFrame(frame);
}

function drawTrailPreview(x, pts, kind, color, dpr, t) {
  x.save();
  x.globalCompositeOperation = 'lighter';
  if (kind === 'ribbon') {
    for (let i = 0; i < pts.length - 1; i++) {
      const k = 1 - i / pts.length;
      x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1]);
      x.lineWidth = (2 + 7 * k) * dpr; x.strokeStyle = hexA(color, 0.7 * k); x.lineCap = 'round'; x.stroke();
    }
  } else if (kind === 'sparks') {
    for (let i = 0; i < pts.length; i++) {
      const k = 1 - i / pts.length;
      for (let j = 0; j < 3; j++) {
        const jx = Math.sin(t * 7 + i * 3.1 + j) * 6 * dpr, jy = Math.cos(t * 5 + i * 1.7 + j * 2) * 6 * dpr * (1 - k);
        x.fillStyle = hexA(j ? color : '#ffffff', 0.85 * k);
        x.fillRect(pts[i][0] + jx, pts[i][1] + jy + i * 0.6 * dpr, 2.2 * dpr, 2.2 * dpr);
      }
    }
  } else {
    for (let i = 0; i < pts.length - 1; i++) {
      const k = 1 - i / pts.length;
      const g = x.createLinearGradient(0, pts[i][1] - 22 * dpr, 0, pts[i][1]);
      g.addColorStop(0, hexA(color, 0)); g.addColorStop(1, hexA(color, 0.55 * k));
      x.fillStyle = g;
      x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1] - 22 * dpr); x.lineTo(pts[i][0], pts[i][1] - 22 * dpr); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(pts[i][0], pts[i][1] - 22 * dpr); x.lineTo(pts[i + 1][0], pts[i + 1][1] - 22 * dpr);
      x.lineWidth = 1.5 * dpr; x.strokeStyle = hexA('#ffffff', 0.5 * k); x.stroke();
    }
  }
  x.restore();
}
