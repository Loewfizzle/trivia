// CITY 2.0 — WINDOWS: THE SCENES' FIGURE KIT (the juggler, the crate guy, the bookie; the Charleston's lit dancer has her own). The boxer's
// craft (boxer.js) made general: ONE BOLD SILHOUETTE at the window's real size (~40 pt: a man ~27 pt tall) — thick limbs, a strong torso,
// the head, a hat — a warm RIM from the room's one light ("not flat black paper"), poses eased + mixed, never a snap. In his own frame: the
// feet at (0, 0), +x the way he faces (front: his right as we see it), +y up, 1 = his height. Drawn in the front wall's units (v up).
import { safeCtx } from '../../ui/canvas-safe.js';
const TAU = Math.PI * 2;
// THE STILL ROOM, CACHED (WINDOWS — the calm-load check: three scenes + their 3× copies at once stepped the tier down on the mini PC): a room's
// parts that never move (the walls' light, the floor, the furniture) painted ONCE into a canvas at the window's device scale, then one
// drawImage a frame. Keyed by the scene, the pane's place + size and the scale (the city's + the crisp layer's copies each their own); ≤ 10
// kept, the oldest freed. rect: [x, y, w, h] in the wall's units (v up) — the canvas holds it with row 0 at v = y (the wall's own flip
// puts it the right way up when drawn back). Every canvas through safeCtx (counted by the memory guard).
const stillCache = new Map();
export function cached(c, key, rect, paint) {
  const m = c.getTransform(), s = Math.hypot(m.a, m.b) || 1, [x, y, w, h] = rect, k = `${key}|${x.toFixed(3)}|${y.toFixed(3)}|${w.toFixed(3)}|${h.toFixed(3)}|${s.toFixed(2)}`;
  let cv = stillCache.get(k);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * s)); cv.height = Math.max(1, Math.ceil(h * s));
    const g = safeCtx(cv); g.setTransform(s, 0, 0, s, -x * s, -y * s); paint(g);
    stillCache.set(k, cv);
    if (stillCache.size > 10) { const [k0, c0] = stillCache.entries().next().value; c0.width = c0.height = 0; stillCache.delete(k0); }
  }
  c.drawImage(cv, x, y, w, h);
}
export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const ease = k => { const v = clamp01(k); return v * v * (3 - 2 * v); };
export const easeOut = k => 1 - (1 - clamp01(k)) ** 3;
export const lerp = (a, b, k) => a + (b - a) * k;
export const lp = (A, B, k) => [lerp(A[0], B[0], k), lerp(A[1], B[1], k)];
export const add = (A, dx, dy) => [A[0] + dx, A[1] + dy];
export const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mixc = (a, b, k) => [0, 1, 2].map(i => a[i] + (b[i] - a[i]) * k);

/** a 2-bone limb: from the root to the end (lengths a, b), the joint bent to side s (+1 / −1) → the joint */
export function ik(root, end, a, b, s = 1) {
  const dx = end[0] - root[0], dy = end[1] - root[1], d = Math.max(1e-4, Math.min(a + b - 1e-4, Math.hypot(dx, dy)));
  const ang = Math.atan2(dy, dx), cosA = (a * a + d * d - b * b) / (2 * a * d), A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  return [root[0] + a * Math.cos(ang + s * A), root[1] + a * Math.sin(ang + s * A)];
}

/** a STANDING man (profile: +x the way he faces): hip, shoulders, head, two legs [knee, foot], two arms [elbow, hand] */
export function stand(o = {}) {
  const b = o.bob || 0, lean = o.lean || 0, dy = o.dy || 0, w = o.width == null ? 1 : o.width;
  const hip = [0.0, 0.49 + b + dy], sh = [0.03 + lean, 0.79 + b + dy * 1.05], head = [0.05 + lean * 1.25 + (o.headX || 0), 0.905 + b * 1.15 + dy * 1.1 + (o.headY || 0)];
  return { hip, sh, head, legs: { back: [[-0.03 * w, 0.255 + dy * 0.5], [-0.07 * w, 0.012]], front: [[0.04 * w, 0.255 + dy * 0.5], [0.07 * w, 0.012]] },
    arms: { rear: [[-0.01, 0.6 + b + dy], [0.0, 0.43 + b + dy]], lead: [[0.06, 0.6 + b + dy], [0.07, 0.43 + b + dy]] } };
}
/** walking (s: the walk's own time, k: the stride 0..1 — short steps as he slows), the arms swinging; o.carry: both hands forward at the chest */
export function walk(s, k = 1, o = {}) {
  const ph = Math.sin(s * TAU * 0.9) * k, up = Math.abs(Math.cos(s * TAU * 0.9)) * 0.012 * k;
  const P = stand({ bob: up, lean: o.lean || 0 });
  P.legs = { front: [[0.04 + 0.07 * ph, 0.255 + up], [0.05 + 0.13 * ph, 0.012]], back: [[-0.02 - 0.07 * ph, 0.255 + up], [-0.04 - 0.13 * ph, 0.012]] };
  if (o.carry) { const cy = o.carry === 'low' ? 0.5 : 0.62; P.arms = { rear: [[0.1, 0.62 + up], [0.22, cy + up]], lead: [[0.12, 0.6 + up], [0.24, cy - 0.02 + up]] }; }
  else P.arms = { rear: [[-0.0 - 0.04 * ph, 0.6 + up], [-0.02 - 0.07 * ph, 0.44 + up]], lead: [[0.05 + 0.04 * ph, 0.6 + up], [0.06 + 0.07 * ph, 0.44 + up]] };
  return P;
}
/** crouched (k 0 stand … 1 deep): the knees out, the back bent over, the hands down to the floor in front */
export function crouch(k, o = {}) {
  const S = stand(), d = ease(k);
  const hip = [-0.06 * d, lerp(0.49, 0.25, d)], sh = [lerp(0.03, 0.17, d), lerp(0.79, 0.5, d)], head = [lerp(0.05, 0.25, d), lerp(0.905, 0.6, d)];
  const reach = o.reach == null ? 1 : o.reach;
  return { hip, sh, head, legs: { back: [[lerp(-0.03, 0.08, d), lerp(0.255, 0.25, d)], [-0.07, 0.012]], front: [[lerp(0.04, 0.17, d), lerp(0.255, 0.3, d)], [lerp(0.07, 0.1, d), 0.012]] },
    arms: { rear: [lp(S.arms.rear[0], [0.22, 0.36], d), lp(S.arms.rear[1], [0.27 + 0.03 * reach, lerp(0.2, 0.06, reach)], d)], lead: [lp(S.arms.lead[0], [0.24, 0.37], d), lp(S.arms.lead[1], [0.3 + 0.03 * reach, lerp(0.2, 0.07, reach)], d)] } };
}
/** sitting on a seat (h: its height × his height), the hands on the knees (o.hand: one arm's hand somewhere else) */
export function sit(h = 0.26, o = {}) {
  const hip = [-0.02, h + 0.03], sh = [0.02 + (o.lean || 0), h + 0.33], head = [0.05 + (o.lean || 0) * 1.2 + (o.headX || 0), h + 0.44 + (o.headY || 0)];
  return { hip, sh, head, legs: { back: [[0.15, h + 0.04], [0.15, 0.012]], front: [[0.17, h + 0.05], [0.18, 0.012]] },
    arms: { rear: [[0.03, h + 0.18], [0.14, h + 0.1]], lead: [[0.06, h + 0.18], [0.17, h + 0.1]] } };
}
export const mix = (A, B, k) => ({
  hip: lp(A.hip, B.hip, k), sh: lp(A.sh, B.sh, k), head: lp(A.head, B.head, k),
  legs: { back: [lp(A.legs.back[0], B.legs.back[0], k), lp(A.legs.back[1], B.legs.back[1], k)], front: [lp(A.legs.front[0], B.legs.front[0], k), lp(A.legs.front[1], B.legs.front[1], k)] },
  arms: { rear: [lp(A.arms.rear[0], B.arms.rear[0], k), lp(A.arms.rear[1], B.arms.rear[1], k)], lead: [lp(A.arms.lead[0], B.arms.lead[0], k), lp(A.arms.lead[1], B.arms.lead[1], k)] },
});

/**
 * THE SILHOUETTE: legs + arms as thick strokes, the torso a strong V, the neck, the head, shoes + hands, a hat (o.hat 'cap' | 'fedora' |
 * null). f: his facing (−1 … +1: a turn narrows him through his front — never a flip); o.front: drawn square to us (the juggler: the torso
 * wider, the shoulders level). grow: a rim's extra (the rim pass draws it a hair bigger, nudged toward the light).
 */
export function man(c, X, Y, H, f, pose, col, o = {}) {
  const fx = Math.sign(f) || 1, sq = o.front ? 1 : Math.max(0.35, Math.abs(f)), g = (o.grow || 0) * H, front = !!o.front;
  const P = ([x, y]) => [X + fx * sq * x * H, Y + y * H];
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  c.lineWidth = (front ? 0.1 : 0.1) * H + g * 2; c.beginPath();
  for (const k of ['back', 'front']) { const a = P(add(pose.hip, front ? (k === 'back' ? -0.055 : 0.055) : 0, 0)), b = P(pose.legs[k][0]), e = P(pose.legs[k][1]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(e[0], e[1]); }
  c.stroke();
  c.beginPath();
  for (const k of ['back', 'front']) { const e = P(pose.legs[k][1]); c.ellipse(e[0] + (front ? 0 : fx * 0.025 * H), e[1] - 0.004 * H, (front ? 0.045 : 0.058 * Math.max(0.7, sq)) * H + g, 0.024 * H + g, 0, 0, TAU); }
  const hp = pose.hip, sh = pose.sh, hw = front ? 0.1 : 0.088, sw = front ? 0.155 : 0.118;
  const h0 = P([hp[0] - hw, hp[1] - 0.01]), h1 = P([hp[0] + hw, hp[1] - 0.01]), s1 = P([sh[0] + sw, sh[1] + (front ? 0.005 : 0)]), s0 = P([sh[0] - sw, sh[1] + 0.01]);
  c.moveTo(h0[0] - fx * g, h0[1] - g); c.lineTo(h1[0] + fx * g, h1[1] - g); c.lineTo(s1[0] + fx * g, s1[1] + g); c.lineTo(s0[0] - fx * g, s0[1] + g); c.closePath();
  const hd = P(pose.head), nk = P(lp(sh, pose.head, 0.45));
  c.moveTo(nk[0] + 0.042 * H, nk[1]); c.ellipse(nk[0], nk[1], 0.042 * H * Math.max(0.7, sq) + g, 0.05 * H + g, 0, 0, TAU);
  c.moveTo(hd[0] + 0.075 * H, hd[1]); c.ellipse(hd[0], hd[1], 0.074 * H * Math.max(0.78, sq) + g, 0.082 * H + g, 0, 0, TAU);
  // the hat: a flat cap (the crown + a short brim forward) / a fedora (a pinched crown, a brim all round)
  if (o.hat === 'cap') { c.moveTo(hd[0] - 0.08 * H, hd[1] + 0.035 * H); c.ellipse(hd[0] + fx * 0.004 * H, hd[1] + 0.045 * H, 0.083 * H * Math.max(0.8, sq) + g, 0.04 * H + g, 0, Math.PI, TAU); c.rect(hd[0] + (front ? -0.075 : fx > 0 ? 0 : -0.12) * H, hd[1] + 0.03 * H - g, (front ? 0.15 : 0.12) * H, 0.018 * H + g * 2); }
  if (o.hat === 'fedora') { c.rect(hd[0] - 0.12 * H * Math.max(0.8, sq) - g, hd[1] + 0.045 * H - g, 0.24 * H * Math.max(0.8, sq) + g * 2, 0.018 * H + g * 2); c.moveTo(hd[0] - 0.065 * H, hd[1] + 0.06 * H); c.lineTo(hd[0] - 0.06 * H, hd[1] + 0.125 * H); c.quadraticCurveTo(hd[0], hd[1] + 0.105 * H, hd[0] + 0.06 * H, hd[1] + 0.125 * H); c.lineTo(hd[0] + 0.065 * H, hd[1] + 0.06 * H); c.closePath(); }
  c.fill();
  for (const k of ['rear', 'lead']) {
    const A = pose.arms[k], s = P(add(sh, front ? (k === 'lead' ? sw - 0.025 : -sw + 0.025) : k === 'lead' ? 0.025 : -0.015, -0.03)), el = P(A[0]), hn = P(A[1]);
    c.lineWidth = (front ? 0.07 : 0.078) * H + g * 2; c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(el[0], el[1]); c.lineTo(hn[0], hn[1]); c.stroke();
    c.beginPath(); c.arc(hn[0], hn[1], 0.04 * H + g, 0, TAU); c.fill();
  }
}
/** the man with his rim: a hair bigger in the light's colour, nudged toward it, then the dark shape over it (o.rim [r,g,b], o.rimA, o.toward) */
export function rimmed(c, X, Y, H, f, pose, o = {}) {
  if ((o.rimA || 0) > 0.01) { c.save(); c.globalAlpha = o.rimA; c.translate((o.toward || 1) * 0.012 * H, 0.005 * H); man(c, X, Y, H, f, pose, rgb(o.rim || [255, 180, 100]), { ...o, grow: 0.006 }); c.restore(); }
  man(c, X, Y, H, f, pose, o.col || 'rgb(10,7,7)', o);
}

/**
 * THE PULL — every scene's exit (core/harbor-scenes.js#sceneAt's last `pull` s): close to the glass, his head + shoulders big against the
 * shade coming down, one arm up on the hem's ring drawing it down, eased (the boss's WSP pull, made general). u: 0..1 through the pull;
 * hem: the shade's hem now (v); o: { x (0..1 across the pane), col, rim, rimA, hat }. Drawn AFTER the shade (windows.js: E.front).
 */
export function pullAtGlass(E, u, hem, o = {}) {
  const { c, G, t, mo } = E, W = G.cw, Y = v => G.h0 + v * G.ch, a = ease(u / 0.12) * (1 - ease((u - 0.9) / 0.1));
  if (a < 0.01) return;
  const x = G.g0 + G.cw * (o.x == null ? 0.56 : o.x) - W * 0.06 * ease((u - 0.88) / 0.12), br = mo ? Math.sin(t * 2.2) * 0.004 * G.ch : 0;
  const draw = (col, grow, dx) => {
    c.fillStyle = col; c.strokeStyle = col;
    c.beginPath(); c.moveTo(x + dx - W * 0.21 - grow, Y(0) - 0.02); c.quadraticCurveTo(x + dx - W * 0.21 - grow, Y(0.5) + br + grow, x + dx - W * 0.07, Y(0.48) + br + grow);
    c.lineTo(x + dx + W * 0.08, Y(0.48) + br + grow); c.quadraticCurveTo(x + dx + W * 0.22 + grow, Y(0.5) + br + grow, x + dx + W * 0.22 + grow, Y(0) - 0.02); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(x + dx, Y(0.575) + br, W * 0.09 + grow, G.ch * 0.083 + grow, 0, 0, TAU); c.fill();
    if (o.hat === 'fedora') { c.fillRect(x + dx - W * 0.15 - grow, Y(0.63) + br - grow, W * 0.3 + grow * 2, G.ch * 0.022 + grow * 2); c.beginPath(); c.ellipse(x + dx, Y(0.66) + br, W * 0.085 + grow, G.ch * 0.05 + grow, 0, Math.PI, TAU, true); c.fill(); }
    if (o.hat === 'bob') { c.beginPath(); c.ellipse(x + dx, Y(0.585) + br, W * 0.12 + grow, G.ch * 0.075 + grow, 0, -0.05, Math.PI + 0.05); c.fill(); c.fillRect(x + dx - W * 0.12 - grow, Y(0.53) + br, W * 0.24 + grow * 2, G.ch * 0.06); }
    if (o.hat === 'cap') { c.beginPath(); c.ellipse(x + dx, Y(0.625) + br, W * 0.1 + grow, G.ch * 0.045 + grow, 0, 0, Math.PI); c.fill(); c.fillRect(x + dx - W * 0.02, Y(0.615) + br - grow, W * 0.14 + grow, G.ch * 0.02 + grow * 2); }
    const reach = ease((u - 0.1) / 0.14) * (1 - ease((u - 0.84) / 0.08)), hx = x + dx + W * (0.12 + 0.06 * reach), hy = lerp(Y(0.3), Math.min(Y(0.95), hem - G.ch * 0.02), reach);
    c.lineCap = 'round'; c.lineWidth = W * 0.085 + grow * 2;
    c.beginPath(); c.moveTo(x + dx + W * 0.15, Y(0.45) + br); c.quadraticCurveTo(x + dx + W * (0.24 - 0.04 * reach), lerp(Y(0.32), Y(0.62), reach), hx, hy); c.stroke();
    c.beginPath(); c.arc(hx, hy, W * 0.05 + grow, 0, TAU); c.fill();
  };
  c.save(); c.beginPath(); c.rect(G.g0, G.h0, G.cw, G.ch); c.clip();
  if (o.rim && (o.rimA || 0) > 0.01) { c.globalAlpha = a * o.rimA; draw(rgb(o.rim), W * 0.008, -W * 0.012); }
  c.globalAlpha = a; draw(o.col || 'rgb(8,6,9)', 0, 0);
  c.restore();
}
/** where the shade's hem is at a cover (0..1) — the blind's own maths (windows.js#cycleBlind: 0.96 of the pane at most) */
export const hemAt = (G, cover) => G.h1 - G.ch * 0.96 * cover;
/** a soft round glow (the light's own): radial, 'lighter' — the caller saves / restores the composite */
export function glowAt(c, x, y, r, col, a) {
  if (a <= 0.004 || r <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(0.35, rgb(col, a * 0.42)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
