// CITY 2.0 — SKY-B: THE SHADOWBOXER's ROOM (core/harbor-boxer.js: when + what he does; the owner's look, Oct 29 5:43 pm — CONFIRMED):
// straight into the room through the upper middle window — ONE BARE BULB near the top, the room's only light (it SWINGS when he hits the
// bag: its pool on the wall + his and the bag's SHADOWS swing with it); a warm AMBER back wall, the floor darker; HIM a solid black
// SILHOUETTE in strict profile (~70 % of the window's height) with a thin warm RIM from the bulb ("not flat black paper"); the HEAVY BAG a
// second dark shape on its chain. Big moves that read unzoomed: jabs, crosses, hooks, uppercuts, combos, a bounce on the toes, a duck +
// a weave; in the rests he walks, drinks, shakes out his arms; at the end he towels off + walks out. Drawn in the front wall's units
// (v up) inside the pane's clip — the window life's E (windows.js) — and on the crisp layer at 3× with the other live rooms.
import { swingAt } from '../../core/harbor-boxer.js';
import { knob } from '../../core/harbor-schedule.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const ease = k => k * k * (3 - 2 * k);
const lerp = (a, b, k) => a + (b - a) * k;
const lp = (A, B, k) => [lerp(A[0], B[0], k), lerp(A[1], B[1], k)];

// his parts in his own frame: the feet at (0, 0), +x the way he faces, +y up, 1 = his height
const GUARD = { lead: { el: [0.08, 0.62], fi: [0.15, 0.79] }, rear: { el: [0.01, 0.61], fi: [0.08, 0.77] } };
function punchPose(kind, e) {
  // e: 0 (guard) → 1 (full extension) → 0; the fist + the elbow at the peak
  const P = kind === 'hook' ? { el: [0.2, 0.79], fi: [0.33, 0.8] } : kind === 'upper' ? { el: [0.15, 0.66], fi: [0.27, 0.93] } : { el: [0.25, 0.78], fi: [0.44, 0.79] };
  return P;
}
/** his POSE now → { hip (y), lean, head [x, y], arms: { lead, rear: { el, fi } }, legs: { front, back: [hip, knee, foot] } } */
function poseOf(st, t, mo) {
  const bob = mo ? Math.abs(Math.sin(t * Math.PI * 2.6)) * 0.014 : 0;
  let dy = 0, dx = 0, lean = 0.04, arms = { lead: { ...GUARD.lead }, rear: { ...GUARD.rear } }, stance = 1, walk = null;
  const b = st.beat;
  if (st.phase === 'round' && b) {
    const u = clamp01((st.t - b.t) / b.d);
    if (b.act === 'duck') { const k = Math.sin(Math.PI * u); dy = -0.12 * k; dx = 0.03 * k; lean = 0.04 + 0.22 * k; }
    if (b.act === 'weave') { const k = Math.sin(Math.PI * u); dy = -0.1 * k; dx = 0.06 * Math.sin(2 * Math.PI * u); lean = 0.04 + 0.18 * k; }
    for (const p of b.punches) {
      const at = p.at * b.d, d = st.t - b.t - at, out = 0.13, back = 0.2;
      if (d < -0.02 || d > out + back) continue;
      const e = d < out ? ease(clamp01((d + 0.02) / (out + 0.02))) : 1 - ease(clamp01((d - out) / back));
      const arm = p.arm ? 'rear' : 'lead', G0 = GUARD[arm], P = punchPose(p.kind, e);
      arms[arm] = { el: lp(G0.el, P.el, e), fi: lp(G0.fi, P.fi, e) };
      lean = Math.max(lean, 0.04 + 0.08 * e * (p.arm ? 1 : 0.5)); dx += 0.025 * e;
    }
  }
  if (st.phase === 'round' && st.round === 1 && st.t < knob('boxer').walkIn) walk = st.t;      // (he walks in)
  if (st.phase === 'rest') {
    // the rest: walk to his corner, a drink, shake out the arms, bounce back toward the middle
    const r = st.t;
    if (r < 4 || (r > 40 && r < 46)) walk = r;
    if (r >= 5 && r < 14) { const k = Math.sin(Math.PI * clamp01((r - 5) / 9)); arms.rear = { el: lp([0.0, 0.55], [0.1, 0.72], k), fi: lp([0.02, 0.45], [0.11, 0.9], k) }; arms.lead = { el: [0.0, 0.56], fi: [0.02, 0.44] }; lean = 0.0 - 0.06 * k; }
    if (r >= 16 && r < 38) { const sh = mo ? Math.sin(r * 22) * 0.025 : 0; arms.rear = { el: [0.0, 0.56], fi: [0.02 + sh, 0.43] }; arms.lead = { el: [0.01, 0.56], fi: [0.03 - sh, 0.43 + sh] }; lean = 0.0; stance = 0.4; }
  }
  if (st.phase === 'done') {
    const r = st.t;
    if (r < 4) { const k = Math.sin(Math.PI * clamp01(r / 4)); arms.rear = { el: [0.06, 0.82], fi: lp([0.04, 0.8], [0.02, 0.95], 0.5 + 0.5 * Math.sin(r * 6)) }; arms.lead = { el: [0.0, 0.56], fi: [0.02, 0.44] }; lean = -0.04 * k; stance = 0.4; }
    else walk = r;
  }
  const hip = 0.49 + dy + bob;
  const legs = walk != null
    ? (() => { const ph = Math.sin(walk * Math.PI * 2 * 0.9); return { front: [[0.02, hip], [0.06 + 0.06 * ph, hip - 0.23], [0.08 + 0.1 * ph, 0.02]], back: [[-0.02, hip], [-0.04 - 0.06 * ph, hip - 0.23], [-0.06 - 0.1 * ph, 0.02]] }; })()
    : { front: [[0.02 + dx, hip], [0.1 * stance + 0.03 + dx * 0.5, hip - 0.24 + 0.02 * (1 - stance)], [0.13 * stance + 0.01, 0.02]], back: [[-0.03 + dx, hip], [-0.07 * stance - 0.02, hip - 0.23], [-0.15 * stance, 0.02]] };
  if (walk != null) { arms = { lead: { el: [0.03, 0.57], fi: [0.07, 0.47] }, rear: { el: [-0.01, 0.57], fi: [-0.04, 0.48] } }; lean = 0.02; }
  return { hip, lean, dx, legs, arms, gloves: st.phase === 'round' || (st.phase === 'rest' && false) };
}
/** his whole silhouette as ONE path set (one fill + one stroke pass): legs + arms stroked, the torso, the head + the gloves filled */
function silhouette(c, X, Y, H, f, pose, col, grow = 0) {
  const { hip, lean, legs, arms } = pose, P = ([x, y]) => [X + f * x * H, Y + y * H];   // (the wall's units: v up)
  const shY = 0.78 + (hip - 0.49), sx = 0.03 + lean * 0.6 + pose.dx;
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  // the legs (strokes)
  c.lineWidth = (0.092 + grow) * H; c.beginPath();
  for (const L of [legs.back, legs.front]) { const a = P(L[0]), b = P(L[1]), e = P(L[2]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(e[0], e[1]); }
  c.stroke();
  // the shoes + the torso + the head + the gloves (fills, one path)
  c.beginPath();
  for (const L of [legs.back, legs.front]) { const e = P(L[2]); c.ellipse(e[0] + f * 0.03 * H, e[1] - 0.005 * H, (0.065 + grow) * H, (0.026 + grow) * H, 0, 0, TAU); }
  const h0 = P([-0.08 + pose.dx, hip - 0.02]), h1 = P([0.085 + pose.dx, hip - 0.02]), s1 = P([sx + 0.1, shY]), s0 = P([sx - 0.095, shY + 0.012]), g = grow * H;
  c.moveTo(h0[0] - f * g, h0[1] - g); c.lineTo(h1[0] + f * g, h1[1] - g); c.lineTo(s1[0] + f * g, s1[1] + g); c.lineTo(s0[0] - f * g, s0[1] + g); c.closePath();
  const hd = P([sx + 0.05, shY + 0.11]); c.moveTo(hd[0] + (0.078 + grow) * H, hd[1]); c.ellipse(hd[0], hd[1], (0.078 + grow) * H, (0.084 + grow) * H, 0, 0, TAU);
  const nk = P([sx + 0.035, shY + 0.03]); c.moveTo(nk[0] + 0.045 * H, nk[1]); c.ellipse(nk[0], nk[1], (0.045 + grow) * H, (0.05 + grow) * H, 0, 0, TAU);
  c.fill();
  // the arms (strokes) + the gloves (fills): the rear arm, then the lead
  for (const k of ['rear', 'lead']) {
    const A = arms[k], sh = P([sx + (k === 'lead' ? 0.02 : -0.01), shY - 0.03]), el = P([A.el[0] + sx - 0.03, A.el[1] + (hip - 0.49)]), fi = P([A.fi[0] + sx - 0.03, A.fi[1] + (hip - 0.49)]);
    c.lineWidth = (0.07 + grow) * H; c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(fi[0], fi[1]); c.stroke();
    c.beginPath(); c.arc(fi[0], fi[1], (pose.gloves ? 0.064 : 0.04) * H + grow * H, 0, TAU); c.fill();   // (the gloves: big round fists that read)
  }
}

/**
 * paint the room into the pane — E: the window life's (c, G (the glass), k (night 0..1), t, mo), st: core#boxerAt now, o: { key, seed }
 * → { hit: the last bag hit's age (s) | null, bulb [u, v] }
 */
export function boxerRoom(E, st, o = {}) {
  const { c, G, t, mo } = E, P = knob('boxer');
  const cw = G.cw, ch = G.ch, x0 = G.g0, y0 = G.h0, y1 = G.h1;
  const side = st.bagSide || 1;
  const sw = st.phase === 'round' ? swingAt(o.key || '', st.set, st.round, st.t, o.seed || 1924) : { bag: 0, bulb: 0 };
  const lamp = st.lamp == null ? 1 : st.lamp;
  // THE BULB: hanging from above the frame on its cord, swinging
  const cordTop = [G.cx - side * 0.1 * cw, y1 + 0.25 * ch], cl = 0.37 * ch, phi = (mo ? sw.bulb : 0) + (mo ? Math.sin(t * 0.9) * 0.012 : 0);
  const bulb = [cordTop[0] + Math.sin(phi) * cl, cordTop[1] - Math.cos(phi) * cl];
  // THE WALL: warm amber, lit from the bulb (its pool moves with the swing); the floor darker; the side walls in shade
  const L = lamp;
  { const g = c.createRadialGradient(bulb[0], bulb[1] - 0.05 * ch, 0.02 * ch, bulb[0], bulb[1] - 0.05 * ch, 1.05 * ch);
    g.addColorStop(0, rgb([255, 206, 132].map(v => v * (0.25 + 0.75 * L)))); g.addColorStop(0.35, rgb([214, 136, 62].map(v => v * (0.2 + 0.8 * L)))); g.addColorStop(0.75, rgb([120, 64, 28].map(v => v * (0.25 + 0.75 * L)))); g.addColorStop(1, rgb([52, 26, 14].map(v => v * (0.4 + 0.6 * L))));
    c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1); }
  const floorV = y0 + 0.16 * ch;
  { const g = c.createLinearGradient(0, y0, 0, floorV); g.addColorStop(0, rgb([30, 16, 10])); g.addColorStop(1, rgb([86, 48, 24].map(v => v * (0.3 + 0.7 * L))));
    c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, floorV - y0 + 0.05);
    c.fillStyle = rgb([255, 190, 110], 0.18 * L); c.beginPath(); c.ellipse(bulb[0], floorV - 0.04 * ch, 0.3 * cw, 0.05 * ch, 0, 0, TAU); c.fill(); }
  for (const s of [-1, 1]) { const ex = s < 0 ? x0 : x0 + cw, g = c.createLinearGradient(ex, 0, ex - s * 0.18 * cw, 0); g.addColorStop(0, 'rgba(14,8,6,0.62)'); g.addColorStop(1, 'rgba(14,8,6,0)'); c.fillStyle = g; c.fillRect(s < 0 ? x0 - 0.05 : x0 + cw * 0.82, y0 - 0.05, cw * 0.18 + 0.05, ch + 0.1); }
  // THE BAG: from a chain above the frame, a heavy dark cylinder at one side, swinging on its hits
  const bagX = G.cx + side * 0.25 * cw, pivot = [bagX, y1 + 0.18 * ch], th = mo ? sw.bag : 0, bh = 0.4 * ch, bw = 0.15 * cw, chain = 0.34 * ch;
  const drawBag = (col, dx = 0, dy = 0, sc = 1) => {
    c.save(); c.translate(pivot[0] + dx, pivot[1] + dy); c.rotate(th); c.scale(sc, sc);
    c.strokeStyle = col; c.lineWidth = 0.022 * ch; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -chain); c.stroke();
    c.fillStyle = col; c.beginPath(); const r = bw * 0.5; c.moveTo(-r, -chain); c.lineTo(r, -chain); c.quadraticCurveTo(r * 1.08, -chain - bh * 0.5, r, -chain - bh); c.quadraticCurveTo(0, -chain - bh - 0.04 * ch, -r, -chain - bh); c.quadraticCurveTo(-r * 1.08, -chain - bh * 0.5, -r, -chain); c.closePath(); c.fill();
    c.restore();
  };
  // HIM: where he stands (the room's width), the way he faces — at the bag in a bag round
  const H = P.height * ch, margin = 0.2 * cw;
  // (in a shadow / weave round he works the OPEN side of the room, clear of the bag)
  const open0 = side > 0 ? x0 + margin * 0.8 : x0 + cw * 0.46, open1 = side > 0 ? x0 + cw * 0.54 : x0 + cw - margin * 0.8;
  let fx = open0 + (open1 - open0) * (st.x == null ? 0.5 : st.x), face = st.face || 1;
  if (st.phase === 'round' && st.kind === 'bag') { face = side; fx = bagX - side * (0.2 * cw + 0.08 * H); }   // (between the bag + the room's middle, facing it)
  // walking in / out: from beyond the frame's edge
  const wi = st.phase === 'round' && st.round === 1 && st.t < P.walkIn ? 1 - ease(clamp01(st.t / P.walkIn)) : 0;
  const wo = st.phase === 'done' && st.t > 4 ? ease(clamp01((st.t - 4) / Math.max(0.1, P.outWalk - 4))) : 0;
  const rw = st.phase === 'rest' ? (st.t < 4 ? ease(st.t / 4) : st.t < 40 ? 1 : st.t < 46 ? 1 - ease((st.t - 40) / 6) : 0) : 0;
  if (wi > 0) { face = side; fx = lerp(fx, x0 - 0.3 * H, wi); }
  if (wo > 0) { face = side; fx = lerp(fx, x0 + cw + 0.3 * H, wo); }
  if (rw > 0) { fx = lerp(fx, x0 + (side > 0 ? 0.22 : 0.78) * cw, rw); if (st.t < 4) face = -side; else if (st.t > 40) face = side; }
  if (st.phase === 'rest' && st.round === P.rounds && st.t > 54) { face = side; fx = lerp(fx, x0 + cw + 0.3 * H, ease(clamp01((st.t - 54) / 6))); }
  const fy = floorV - 0.05 * ch;
  const pose = st.inView ? poseOf({ ...st }, t, mo) : null;
  // THE SHADOWS on the back wall: thrown away from the bulb, a little bigger, swinging with it (his + the bag's)
  const shK = 0.42 * L;
  if (shK > 0.01) {
    c.save(); c.globalAlpha = shK;
    const sCol = 'rgb(58,26,10)';
    drawBag(sCol, (pivot[0] - bulb[0]) * 0.32, 0.06 * ch, 1.06);
    if (pose) { const sxo = (fx - bulb[0]) * 0.3; silhouette(c, fx + sxo, fy + 0.04 * ch, H * 1.08, face, pose, sCol); }
    c.restore();
  }
  drawBag('rgb(16,10,8)');
  // the bag's rim on the bulb's side
  // HIM: a warm rim from the bulb (the silhouette a hair bigger + nudged toward the light), then the solid black
  if (pose) {
    const toward = Math.sign(bulb[0] - fx) || 1;
    c.save(); c.globalAlpha = 0.9 * L; c.translate(toward * 0.012 * H, 0.006 * H); silhouette(c, fx, fy, H, face, pose, 'rgb(255,176,92)', 0.006); c.restore();
    silhouette(c, fx, fy, H, face, pose, 'rgb(10,6,6)');
  }
  // THE BULB: its cord, the glass, its glow (the room's one light)
  c.strokeStyle = 'rgb(20,14,10)'; c.lineWidth = 0.012 * ch; c.beginPath(); c.moveTo(cordTop[0], cordTop[1]); c.lineTo(bulb[0], bulb[1]); c.stroke();
  if (L > 0.01) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(bulb[0], bulb[1] - 0.03 * ch, 0, bulb[0], bulb[1] - 0.03 * ch, 0.22 * ch);
    gr.addColorStop(0, `rgba(255,236,190,${0.95 * L})`); gr.addColorStop(0.25, `rgba(255,196,120,${0.45 * L})`); gr.addColorStop(1, 'rgba(255,170,90,0)');
    c.fillStyle = gr; c.fillRect(bulb[0] - 0.22 * ch, bulb[1] - 0.25 * ch, 0.44 * ch, 0.44 * ch);
    c.restore();
    c.fillStyle = `rgba(255,248,226,${L})`; c.beginPath(); c.ellipse(bulb[0], bulb[1] - 0.035 * ch, 0.032 * ch, 0.042 * ch, phi, 0, TAU); c.fill();
  }
  return { hit: sw.lastHit != null && st.phase === 'round' ? st.t - sw.lastHit : null, bulb, fx, face };
}
