// CITY 2.0 — SKY-B: THE SHADOWBOXER's ROOM (core/harbor-boxer.js: when + what he does) — REWORKED in THE MODELS PASS (the owner's review,
// Oct 30 6:01 + 6:41 pm, judged UNZOOMED on his iPhone: "looks good close up", but —):
//   · NO WALL SHADOW (an arm sticking out read as a weird blob at phone size) — the bulb's swinging POOL of light on the wall stays
//   · THE BAG NEVER MOVES SIDES: one fixed spot on the RIGHT (core#BAG_SIDE), swinging only from his hits (a delayed pendulum); only HE turns
//   · SMOOTH: every move eased, in-betweens, his weight shifting, a head bob; ALI-STYLE FOOTWORK — always light on his toes, bouncing, the
//     shuffle, quick steps side to side; a TURN passes through his front (the silhouette narrows), never a flip
//   · LONG, OBVIOUS COMBINATIONS in the air, turned away from the bag — every punch FULLY OUT (a straight's arm the length of his
//     reach); slips + ducks between; BURSTS ON THE BAG (it swings visibly)
//   · THE REST: he walks it off, shakes out his arms, then SITS ON THE FLOOR, his back against the wall, knees up, head down — up for the
//     bell; the long break the same, longer, then he steps out
// Every pose a BOLD silhouette at the window's real size (~40 pt: he is ~28 pt tall) — big shapes, never fine detail; one warm rim from the
// bulb ("not flat black paper"). Drawn in the front wall's units (v up) inside the pane's clip — the window life's E (windows.js) — and on
// the crisp layer at 3× with the other live rooms.
import { swingAt, BAG_X } from '../../core/harbor-boxer.js';
import { knob } from '../../core/harbor-schedule.js';

const TAU = Math.PI * 2;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const ease = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - (1 - k) ** 3;
const lerp = (a, b, k) => a + (b - a) * k;
const lp = (A, B, k) => [lerp(A[0], B[0], k), lerp(A[1], B[1], k)];
const add = (A, dx, dy) => [A[0] + dx, A[1] + dy];

// ---- THE SKELETON, in his own frame: the feet at (0, 0), +x the way he faces, +y up, 1 = his height
//   { hip, sh (between the shoulders), head, legs: { back: [knee, foot], front: [knee, foot] }, arms: { rear: [elbow, fist], lead: [elbow,
//   fist] }, gloves, lift (his heels off the floor: on his toes) }
const GUARD = { lead: [[0.12, 0.66], [0.19, 0.83]], rear: [[0.05, 0.64], [0.11, 0.81]] };
const PUNCH = {                                        // (the punching arm at full extension — a straight's fist a whole reach out)
  straight: [[0.3, 0.8], [0.52, 0.81]],
  hook: [[0.28, 0.81], [0.37, 0.84]],
  upper: [[0.17, 0.67], [0.27, 0.94]],
};
function stance(o = {}) {
  const b = o.bob || 0, sway = o.sway || 0, lean = o.lean || 0, dy = o.dy || 0, dx = o.dx || 0;
  const hip = [0.0 + sway + dx * 0.6, 0.49 + b + dy], sh = [0.05 + sway + lean + dx, 0.79 + b + dy * 1.05], head = [0.09 + sway + lean * 1.25 + dx * 1.1 + (o.headX || 0), 0.905 + b * 1.15 + dy * 1.1 + (o.headY || 0)];
  const lift = o.lift || 0, w = o.width == null ? 1 : o.width;
  return { hip, sh, head, legs: { back: [[-0.07 * w + dx * 0.3, 0.26 + b * 0.5 + dy * 0.6], [-0.14 * w, 0.012 + lift]], front: [[0.1 * w + dx * 0.4, 0.26 + b * 0.5 + dy * 0.6], [0.14 * w, 0.012 + lift]] },
    arms: { lead: GUARD.lead.map(p => add(p, sway + lean * 0.9 + dx, b + dy)), rear: GUARD.rear.map(p => add(p, sway + lean * 0.9 + dx, b + dy)) }, gloves: true, lift };
}
/** a beat's moves → the pose (u: 0..1 through the beat, t: the beat's own seconds) */
function roundPose(st, t, mo) {
  const b = st.beat, bt = b ? st.t - b.t : 0, u = b ? clamp01(bt / b.d) : 0;
  // ALI's FOOTWORK: always bouncing on his toes (~2.3 bounces a second, the heels never down), the weight rocking front ↔ back, the head
  // riding the bounce a hair late
  const ph = mo ? t * TAU * 2.3 : 0, bounce = mo ? 0.016 * Math.abs(Math.sin(ph)) : 0, rock = mo ? 0.012 * Math.sin(t * TAU * 0.55) : 0;
  const o = { bob: bounce, sway: rock, lift: mo ? 0.008 + 0.012 * Math.abs(Math.sin(ph)) : 0.01, headY: mo ? -0.004 * Math.sin(ph - 0.6) : 0 };
  let width = 1, feetOff = 0;
  if (b) {
    const k = Math.sin(Math.PI * u);
    if (b.act === 'slip') { o.dx = 0.05 * (b.side || 1) * k; o.lean = 0.05 * k; o.dy = -0.03 * k; o.headX = 0.03 * (b.side || 1) * k; }
    else if (b.act === 'duck') { o.dy = -0.14 * k; o.lean = 0.1 * k; o.dx = 0.02 * k; }
    else if (b.act === 'weave') { o.dy = -0.12 * k; o.dx = 0.06 * Math.sin(TAU * u); o.lean = 0.08 * k; }
    else if (b.act === 'pull') { o.lean = -0.06 * k; o.dx = -0.03 * k; }
    else if (b.act === 'shuffle') feetOff = mo ? 0.05 * Math.sin(bt * TAU * 5.5) : 0;   // (the Ali shuffle: the feet flicking past each other)
    else if (b.act === 'step') { feetOff = 0.04 * Math.sin(Math.PI * u); }
    else if (b.act === 'turn') width = 0.55 + 0.45 * Math.abs(Math.cos(Math.PI * u));     // (through his front: a narrow, square stance)
  }
  const P = stance({ ...o, width });
  if (feetOff) { P.legs.front[1] = add(P.legs.front[1], -feetOff, 0); P.legs.back[1] = add(P.legs.back[1], feetOff, 0); }
  if (b && b.act === 'go') return walkPose(t, true, 1);
  // THE PUNCHES: out fast (eased), a beat held at full extension, back eased — the torso turns into it (the shoulder + the head forward)
  if (b) for (const p of b.punches) {
    const d = bt - p.t, OUT = 0.11, HOLD = 0.06, BACK = 0.17;
    if (d < -0.01 || d > OUT + HOLD + BACK) continue;
    const e = d < OUT ? easeOut(clamp01((d + 0.01) / (OUT + 0.01))) : d < OUT + HOLD ? 1 : 1 - ease(clamp01((d - OUT - HOLD) / BACK));
    const arm = p.arm ? 'rear' : 'lead', G0 = P.arms[arm], Pk = PUNCH[p.kind] || PUNCH.straight, rot = (p.arm ? 0.06 : 0.035) * e;
    P.arms[arm] = [lp(G0[0], add(Pk[0], rot, 0), e), lp(G0[1], add(Pk[1], rot, 0), e)];
    P.sh = add(P.sh, rot, 0); P.head = add(P.head, rot * 1.1, -0.006 * e); P.hip = add(P.hip, rot * 0.35, 0);
    if (p.arm) P.legs.back[1] = add(P.legs.back[1], 0.02 * e, 0.01 * e);   // (the rear heel turns in behind a cross)
  }
  return P;
}
/** walking (s: the walk's time; guard: the hands up as he steps over to the bag; tired: the hands down, a slight hunch) */
function walkPose(s, guard, k) {
  const ph = Math.sin(s * TAU * 0.95), up = Math.abs(Math.cos(s * TAU * 0.95)) * 0.012;
  const P = stance({ bob: up, lean: guard ? 0.02 : -0.01 });
  P.legs = { front: [[0.04 + 0.07 * ph, 0.26 + up], [0.06 + 0.12 * ph, 0.012]], back: [[-0.03 - 0.07 * ph, 0.26 + up], [-0.05 - 0.12 * ph, 0.012]] };
  if (!guard) { P.arms = { lead: [[0.04 + 0.03 * ph, 0.57], [0.07 + 0.05 * ph, 0.45]], rear: [[-0.01 - 0.03 * ph, 0.57], [-0.03 - 0.05 * ph, 0.46]] }; P.gloves = true; P.head = add(P.head, 0.01, -0.01); }
  return P;
}
/** HIS SEAT on the floor, his back to the wall, the knees up, the arms over the knees, the head down — breathing hard */
function sitPose(t, mo) {
  const br = mo ? 0.008 * Math.sin(t * TAU * 0.42) : 0;
  return { hip: [0.0, 0.08], sh: [0.02, 0.4 + br], head: [0.1, 0.44 + br * 0.6], legs: { back: [[0.19, 0.31], [0.31, 0.012]], front: [[0.21, 0.33], [0.33, 0.012]] },
    arms: { lead: [[0.17, 0.35 + br * 0.5], [0.27, 0.27 + br * 0.5]], rear: [[0.15, 0.34 + br * 0.5], [0.25, 0.26 + br * 0.5]] }, gloves: true, lift: 0 };
}
/** shaking it out: standing, the arms hanging, shaken loose; the shoulders rolling; a lazy bounce */
function shakePose(t, mo) {
  const sh = mo ? Math.sin(t * 21) * 0.03 : 0, roll = mo ? Math.sin(t * TAU * 0.6) * 0.012 : 0, b = mo ? 0.008 * Math.abs(Math.sin(t * TAU * 1.3)) : 0;
  const P = stance({ bob: b, lean: -0.01, width: 0.6 });
  P.sh = add(P.sh, 0, roll); P.head = add(P.head, 0, roll * 0.8);
  P.arms = { lead: [[0.05 + sh * 0.5, 0.58 + roll], [0.07 + sh, 0.44 + roll]], rear: [[-0.01 - sh * 0.5, 0.58 + roll], [-0.03 - sh, 0.44 + roll]] };
  return P;
}
const mixPose = (A, B, k) => ({
  hip: lp(A.hip, B.hip, k), sh: lp(A.sh, B.sh, k), head: lp(A.head, B.head, k),
  legs: { back: [lp(A.legs.back[0], B.legs.back[0], k), lp(A.legs.back[1], B.legs.back[1], k)], front: [lp(A.legs.front[0], B.legs.front[0], k), lp(A.legs.front[1], B.legs.front[1], k)] },
  arms: { lead: [lp(A.arms.lead[0], B.arms.lead[0], k), lp(A.arms.lead[1], B.arms.lead[1], k)], rear: [lp(A.arms.rear[0], B.arms.rear[0], k), lp(A.arms.rear[1], B.arms.rear[1], k)] },
  gloves: true, lift: lerp(A.lift || 0, B.lift || 0, k),
});
/** his POSE now (any phase) → the skeleton */
function poseOf(st, t, mo) {
  const P = knob('boxer');
  if (st.phase === 'round') {
    if (st.round === 1 && st.t < P.walkIn) return walkPose(st.t, false, 1);              // (he walks in)
    return roundPose(st, t, mo);
  }
  if ((st.phase === 'rest' || st.phase === 'break') && st.rest) {
    const R = st.rest, rt = st.t;
    if (R.act === 'walk' || R.act === 'walkout') return walkPose(rt, false, 1);
    if (R.act === 'back') return R.u < 0.5 ? walkPose(rt, false, 1) : mixPose(walkPose(rt, false, 1), stance({ lift: 0.01 }), ease((R.u - 0.5) * 2));
    if (R.act === 'shake') return shakePose(rt, mo);
    if (R.act === 'sitdown') return mixPose(shakePose(rt, mo), sitPose(rt, mo), ease(R.u));
    if (R.act === 'getup') return mixPose(sitPose(rt, mo), stance({ lift: 0.01 }), ease(R.u));
    return sitPose(rt, mo);
  }
  if (st.phase === 'done') {
    const r = st.t;
    if (r < 4) { const Pp = stance({ width: 0.6 }); const k = 0.5 + 0.5 * Math.sin(r * 6); Pp.arms.rear = [[0.07, 0.83], [0.04, 0.88 + 0.06 * k]]; Pp.arms.lead = [[0.04, 0.57], [0.06, 0.45]]; Pp.head = add(Pp.head, -0.02, -0.01); return Pp; }   // (the towel over his head)
    return walkPose(r, false, 1);
  }
  return stance();
}

/** his whole silhouette: the legs + the arms as thick strokes, the torso, the head, the neck, the shoes + the gloves filled (f: his facing,
 *  −1 … +1 — a turn narrows him through his front) */
function silhouette(c, X, Y, H, f, pose, col, grow = 0) {
  const fx = Math.sign(f) || 1, sq = Math.max(0.35, Math.abs(f));
  const P = ([x, y]) => [X + fx * sq * x * H, Y + y * H];
  const g = grow * H;
  c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
  // the legs
  c.lineWidth = 0.094 * H + g * 2; c.beginPath();
  for (const k of ['back', 'front']) { const a = P(pose.hip), b = P(pose.legs[k][0]), e = P(pose.legs[k][1]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(e[0], e[1]); }
  c.stroke();
  c.beginPath();
  // the shoes (on his toes: a little smaller, raised)
  for (const k of ['back', 'front']) { const e = P(pose.legs[k][1]); c.ellipse(e[0] + fx * 0.025 * H, e[1] - 0.004 * H, 0.06 * H * Math.max(0.7, sq) + g, 0.025 * H + g, 0, 0, TAU); }
  // the torso: the hips → the shoulders (a strong V), the neck, the head
  const hp = pose.hip, sh = pose.sh, h0 = P([hp[0] - 0.075, hp[1] - 0.01]), h1 = P([hp[0] + 0.075, hp[1] - 0.01]), s1 = P([sh[0] + 0.1, sh[1]]), s0 = P([sh[0] - 0.1, sh[1] + 0.01]);
  c.moveTo(h0[0] - fx * g, h0[1] - g); c.lineTo(h1[0] + fx * g, h1[1] - g); c.lineTo(s1[0] + fx * g, s1[1] + g); c.lineTo(s0[0] - fx * g, s0[1] + g); c.closePath();
  const hd = P(pose.head), nk = P(lp(sh, pose.head, 0.45));
  c.moveTo(nk[0] + 0.045 * H, nk[1]); c.ellipse(nk[0], nk[1], 0.045 * H * Math.max(0.7, sq) + g, 0.05 * H + g, 0, 0, TAU);
  c.moveTo(hd[0] + 0.08 * H, hd[1]); c.ellipse(hd[0], hd[1], 0.08 * H * Math.max(0.75, sq) + g, 0.086 * H + g, 0, 0, TAU);
  c.fill();
  // the arms (the rear one first, then the lead) + the gloves: big round fists that read
  for (const k of ['rear', 'lead']) {
    const A = pose.arms[k], s = P(add(sh, k === 'lead' ? 0.025 : -0.015, -0.03)), el = P(A[0]), fi = P(A[1]);
    c.lineWidth = 0.072 * H + g * 2; c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(el[0], el[1]); c.lineTo(fi[0], fi[1]); c.stroke();
    c.beginPath(); c.arc(fi[0], fi[1], (pose.gloves ? 0.066 : 0.042) * H + g, 0, TAU); c.fill();
  }
}

/**
 * paint the room into the pane — E: the window life's (c, G (the glass), k (night 0..1), t, mo), st: core#boxerAt now, o: { key, seed }
 * → { hit: the last bag hit's age (s) | null, bulb [u, v], fx, face, bagX }
 */
export function boxerRoom(E, st, o = {}) {
  const { c, G, t, mo } = E, P = knob('boxer');
  const cw = G.cw, ch = G.ch, x0 = G.g0, y0 = G.h0, y1 = G.h1;
  const sw = st.phase === 'round' ? swingAt(o.key || '', st.set, st.round, st.t, o.seed || 1924) : { bag: 0, bulb: 0, lastHit: null };
  const lamp = st.lamp == null ? 1 : st.lamp, L = lamp;
  // THE BULB: hanging from above the frame on its cord, a little left of the middle (over his open floor), swinging with the bag's hits
  const cordTop = [G.cx - 0.08 * cw, y1 + 0.25 * ch], cl = 0.37 * ch, phi = (mo ? sw.bulb : 0) + (mo ? Math.sin(t * 0.9) * 0.012 : 0);
  const bulb = [cordTop[0] + Math.sin(phi) * cl, cordTop[1] - Math.cos(phi) * cl];
  // THE WALL: warm amber, lit from the bulb (its POOL moves with the swing — the room's one light); the floor darker; the side walls in shade
  { const g = c.createRadialGradient(bulb[0], bulb[1] - 0.05 * ch, 0.02 * ch, bulb[0], bulb[1] - 0.05 * ch, 1.05 * ch);
    g.addColorStop(0, rgb([255, 206, 132].map(v => v * (0.25 + 0.75 * L)))); g.addColorStop(0.35, rgb([214, 136, 62].map(v => v * (0.2 + 0.8 * L)))); g.addColorStop(0.75, rgb([120, 64, 28].map(v => v * (0.25 + 0.75 * L)))); g.addColorStop(1, rgb([52, 26, 14].map(v => v * (0.4 + 0.6 * L))));
    c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1); }
  const floorV = y0 + 0.16 * ch;
  { const g = c.createLinearGradient(0, y0, 0, floorV); g.addColorStop(0, rgb([30, 16, 10])); g.addColorStop(1, rgb([86, 48, 24].map(v => v * (0.3 + 0.7 * L))));
    c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, floorV - y0 + 0.05);
    c.fillStyle = rgb([255, 190, 110], 0.18 * L); c.beginPath(); c.ellipse(bulb[0], floorV - 0.04 * ch, 0.3 * cw, 0.05 * ch, 0, 0, TAU); c.fill(); }
  for (const s of [-1, 1]) { const ex = s < 0 ? x0 : x0 + cw, g = c.createLinearGradient(ex, 0, ex - s * 0.18 * cw, 0); g.addColorStop(0, 'rgba(14,8,6,0.62)'); g.addColorStop(1, 'rgba(14,8,6,0)'); c.fillStyle = g; c.fillRect(s < 0 ? x0 - 0.05 : x0 + cw * 0.82, y0 - 0.05, cw * 0.18 + 0.05, ch + 0.1); }
  // THE BAG — ONE fixed spot on the RIGHT, from its chain above the frame; it swings only from his hits (+ = its bottom away from him)
  const H = P.height * ch, bagX = x0 + cw * 0.9, pivot = [bagX, y1 + 0.18 * ch], th = mo ? sw.bag : 0, bh = 0.42 * ch, bw = 0.16 * cw, chain = 0.32 * ch;
  c.save(); c.translate(pivot[0], pivot[1]); c.rotate(th);
  c.strokeStyle = 'rgb(16,10,8)'; c.lineWidth = 0.022 * ch; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -chain); c.stroke();
  { const r = bw * 0.5; c.beginPath(); c.moveTo(-r, -chain); c.lineTo(r, -chain); c.quadraticCurveTo(r * 1.08, -chain - bh * 0.5, r, -chain - bh); c.quadraticCurveTo(0, -chain - bh - 0.04 * ch, -r, -chain - bh); c.quadraticCurveTo(-r * 1.08, -chain - bh * 0.5, -r, -chain); c.closePath();
    c.fillStyle = 'rgb(18,11,9)'; c.fill();
    // (its rim on the bulb's side: a warm edge so the bag reads as a solid shape, not a hole)
    c.strokeStyle = `rgba(255,170,90,${0.5 * L})`; c.lineWidth = 0.014 * cw; c.beginPath(); c.moveTo(-r * 1.02, -chain - 0.02 * ch); c.quadraticCurveTo(-r * 1.1, -chain - bh * 0.5, -r * 1.02, -chain - bh + 0.02 * ch); c.stroke(); }
  c.restore();
  // HIM: his place across the room (core: x 0 = the open side's wall … BAG_X = his spot at the bag, a full reach from it), the way he faces
  // (his room is ~square and his straight reaches ~⅓ of its width: the OPEN FLOOR he punches from (facing left) sits mid-room, so a full
  // jab never leaves the frame; the wall he sits against at the left; his spot at the bag a reach from it — core x → the pane, piecewise)
  const spot = bagX - 0.53 * H, KX = [[-0.32, x0 - 0.3 * H], [0.1, x0 + 0.12 * cw], [0.14, x0 + 0.4 * cw], [0.5, x0 + 0.58 * cw], [BAG_X, spot]];
  const fxOf = x => { if (x <= KX[0][0]) return KX[0][1]; for (let i = 1; i < KX.length; i++) if (x <= KX[i][0]) { const [a, A] = KX[i - 1], [b, B] = KX[i]; return A + (B - A) * ((x - a) / (b - a)); } return spot; };
  let fx = fxOf(st.x == null ? 0.35 : st.x), face = st.face == null ? -1 : st.face;
  if ((st.phase === 'rest' || st.phase === 'break') && st.rest) { const R = st.rest, k = R.act === 'walk' || R.act === 'back' || R.act === 'walkout' ? ease(R.u) : 1; fx = fxOf(lerp(R.x0, R.x1, k)); face = R.face; }
  // walking in (round 1) + out (after his last set): from / to beyond the frame's open side
  const wi = st.phase === 'round' && st.round === 1 && st.t < P.walkIn ? 1 - ease(clamp01(st.t / P.walkIn)) : 0;
  const wo = st.phase === 'done' && st.t > 4 ? ease(clamp01((st.t - 4) / Math.max(0.1, P.outWalk - 4))) : 0;
  if (wi > 0) { face = 1; fx = lerp(fx, x0 - 0.3 * H, wi); }
  if (wo > 0) { face = -1; fx = lerp(fx, x0 - 0.3 * H, wo); }
  const fy = floorV - 0.05 * ch;
  const pose = st.inView ? poseOf({ ...st }, t, mo) : null;
  // (MODELS: NO SHADOW on the wall — only the bulb's light; HIM: a warm rim from the bulb (a hair bigger, nudged toward the light), then black)
  if (pose) {
    const toward = Math.sign(bulb[0] - fx) || 1;
    c.save(); c.globalAlpha = 0.9 * L; c.translate(toward * 0.012 * H, 0.006 * H); silhouette(c, fx, fy, H, face, pose, 'rgb(255,176,92)', 0.006); c.restore();
    silhouette(c, fx, fy, H, face, pose, 'rgb(10,6,6)');
  }
  // THE BULB: its cord, the glass, its glow
  c.strokeStyle = 'rgb(20,14,10)'; c.lineWidth = 0.012 * ch; c.beginPath(); c.moveTo(cordTop[0], cordTop[1]); c.lineTo(bulb[0], bulb[1]); c.stroke();
  if (L > 0.01) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(bulb[0], bulb[1] - 0.03 * ch, 0, bulb[0], bulb[1] - 0.03 * ch, 0.22 * ch);
    gr.addColorStop(0, `rgba(255,236,190,${0.95 * L})`); gr.addColorStop(0.25, `rgba(255,196,120,${0.45 * L})`); gr.addColorStop(1, 'rgba(255,170,90,0)');
    c.fillStyle = gr; c.fillRect(bulb[0] - 0.22 * ch, bulb[1] - 0.25 * ch, 0.44 * ch, 0.44 * ch);
    c.restore();
    c.fillStyle = `rgba(255,248,226,${L})`; c.beginPath(); c.ellipse(bulb[0], bulb[1] - 0.035 * ch, 0.032 * ch, 0.042 * ch, phi, 0, TAU); c.fill();
  }
  return { hit: sw.lastHit != null && st.phase === 'round' ? st.t - sw.lastHit : null, bulb, fx, face, bagX, bag: th };
}
