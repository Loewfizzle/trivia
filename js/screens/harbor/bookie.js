// CITY 2.0 — WINDOWS: THE BOOKIE's ROOM (core/harbor-bookie.js: what he does; core/harbor-scenes.js: when + which window tonight). THE
// WINDOW STANDARD: ONE GREEN-SHADED DESK LAMP — a green pool on the desk, his face + hands lit from BELOW by it, the rest of the room dark;
// the cigar's ember + its smoke curling up through the beam; HIM mostly a silhouette (the pacing, the receiver at his head, the hat thrown
// carry it — never the ledger or the cash). The light coming on IS his entrance; the lamp burns on behind his shade after hours (green).
import { BK, bookiePlan, doingAt, BAD, ENTER, EXIT } from '../../core/harbor-bookie.js';
import { SCENE_TIMING } from '../../core/harbor-scenes.js';
import { cached, man, rimmed, walk, crouch, stand, mix, ease, lerp, lp, add, rgb, clamp01, pullAtGlass, hemAt, glowAt } from './scene-kit.js';

const TAU = Math.PI * 2;
const GREEN = [120, 230, 140];

/** sat at his desk, square to us (o.write: the pen hand moving · o.count: the thumb flicking · o.ear: the receiver at his ear · o.lean: back
 *  in the chair · o.cig: the cigar to his mouth) */
function atDesk(o = {}, t = 0) {
  const dy = 0.2, lean = o.lean || 0;
  const P = { hip: [0, 0.48 - dy], sh: [0, 0.79 - dy - 0.015 * lean], head: [0, 0.905 - dy - 0.02 * lean + (o.nod || 0)],
    legs: { back: [[-0.08, 0.27 - dy * 0.5], [-0.09, 0.012]], front: [[0.08, 0.27 - dy * 0.5], [0.09, 0.012]] } };
  const deskY = 0.34;
  let L = [0.12 + (o.write ? 0.02 * Math.sin(t * 9) : 0), deskY + 0.02], R = [-0.12, deskY + 0.015];
  if (o.count) R = [-0.08 + 0.015 * Math.sin(t * 14), deskY + 0.03];
  if (o.ear) R = [-0.08, P.head[1] - 0.01];
  if (o.cig) L = lp(L, [0.04, P.head[1] - 0.04], o.cig);
  if (lean) { L = lp(L, [0.06, P.sh[1] - 0.12], lean); R = lp(R, [-0.06, P.sh[1] - 0.12], lean); }
  const el = (S, H, s) => [lerp(S[0], H[0], 0.45) + s * 0.07, lerp(S[1], H[1], 0.5) - 0.04];
  const SL = [0.13, P.sh[1] - 0.03], SR = [-0.13, P.sh[1] - 0.03];
  P.arms = { lead: [el(SL, L, 1), L], rear: [el(SR, R, -1), R] };
  return P;
}

/**
 * paint his room — E: the window life's (c, G, k, t, mo, deep), st: core/harbor-scenes.js#sceneAt, o: { key, seed }
 * → { phase, doing, lamp, hat ('hook' | 'head' | 'air' | 'floor' | 'hand'), x }
 */
export function bookieRoom(E, st, o = {}) {
  const { c, G, t, mo } = E, cw = G.cw, ch = G.ch, x0 = G.g0, y0 = G.h0;
  const floorV = y0 + 0.12 * ch, H = 0.68 * ch, T = SCENE_TIMING.bookie, PX = u => x0 + u * cw;
  const plan = bookiePlan(o.key || '', st.workLen, o.seed || 1924);
  const deskX = PX(BK.desk), deskTop = floorV + 0.34 * H, lampP = [PX(BK.lamp), deskTop + 0.2 * H], hook = [PX(BK.hook), floorV + 0.84 * H];
  // ---- the lamp's state: off until he clicks it on (a flicker as it catches), then steady
  let lamp = 1;
  if (st.phase === 'up') lamp = 0;
  else if (st.phase === 'enter') { const e = st.t - ENTER.lamp; lamp = e < 0 ? 0 : e < 0.08 ? 0.7 : e < 0.16 ? 0.1 : e < 0.3 ? 0.9 : 1; }
  const L = lamp;
  // ---- THE STILL ROOM (cached per lamp level — scene-kit.js#cached): dark panelled walls, the lamp's GREEN SPILL low round the desk
  cached(c, `bookie${Math.round(L * 10)}`, [x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1], c => {
  { c.fillStyle = rgb([16, 18, 16]); c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1);
      if (L > 0) { const g = c.createRadialGradient(lampP[0], lampP[1] - 0.04 * ch, 0.02 * ch, lampP[0], lampP[1] - 0.1 * ch, 0.95 * ch); g.addColorStop(0, rgb([96, 150, 104], L)); g.addColorStop(0.35, rgb([44, 70, 50], L)); g.addColorStop(1, rgb([12, 16, 14], L)); c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1); }
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, floorV - y0 + 0.05);
      for (let i = 1; i < 4; i++) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(PX(i / 4) - 0.004 * cw, floorV, 0.008 * cw, ch); }   // (the wall's panels)
    }
  });
  // ---- the hat hook on the left wall
  c.fillStyle = 'rgb(30,26,20)'; c.fillRect(hook[0] - 0.03 * cw, hook[1] - 0.01 * ch, 0.06 * cw, 0.02 * ch);
  // ---- what he's doing
  let X = deskX, face = 0, pose = null, seated = false, hat = 'hook', hatXY = null, ear = false, phoneInHand = false, cig = 0, ember = 0.3, scale = 1, glassK = 0, bag = 0, doing = st.phase;
  const toHookX = hook[0] + 0.22 * H, besideDesk = deskX + 0.34 * cw;
  const walkTo = (a, b, e0, e1, e) => { const k = ease((e - e0) / (e1 - e0)); X = lerp(a, b, k); face = Math.sign(b - a) || 1; pose = walk(e, 0.9); };
  if (st.phase === 'enter') {
    const e = st.t; hat = 'head';
    if (e < ENTER.toHook) walkTo(PX(1.08), toHookX, 0, ENTER.toHook, e);
    else if (e < ENTER.hang) { X = toHookX; face = -1; const r = Math.sin(Math.PI * (e - ENTER.toHook) / (ENTER.hang - ENTER.toHook)); pose = stand(); pose.arms.lead = [[0.12, 0.72 + 0.1 * r], [0.2 + 0.05 * r, 0.86 + 0.06 * r]]; if (e > (ENTER.toHook + ENTER.hang) / 2) hat = 'hook'; }
    else if (e < ENTER.toDesk) { hat = 'hook'; walkTo(toHookX, deskX, ENTER.hang, ENTER.toDesk, e); }
    else { hat = 'hook'; X = deskX; seated = true; const k = ease((e - ENTER.toDesk) / (ENTER.sit - ENTER.toDesk)); pose = mix(stand(), atDesk({}, t), k); face = 0; if (e > ENTER.sit && e < ENTER.lamp + 0.4) pose.arms.lead = [[0.14, 0.52], [lampP[0] > X ? 0.16 : -0.16, 0.5]]; }
  } else if (st.phase === 'work') {
    // (&force=bookie-slam — the panel's HAT THROW row: the bad call on a loop, 10 s of writing between)
    const D = o.slam ? (st.work % 26 < BAD.sit ? { seg: { kind: 'bad', d: BAD.sit }, e: st.work % 26 } : { seg: { kind: 'write', d: 26 - BAD.sit }, e: st.work % 26 - BAD.sit }) : doingAt(plan, st.work), seg = D ? D.seg : null, e = D ? D.e : 0;
    doing = seg ? seg.kind : 'write';
    if (!seg || ['write', 'count', 'call', 'smoke', 'lean'].includes(seg.kind)) {
      seated = true; face = 0;
      const callUp = seg && seg.kind === 'call' ? ease(e / 0.6) * (1 - ease((e - seg.d + 0.7) / 0.6)) : 0, cg = seg && seg.kind === 'smoke' ? Math.sin(Math.PI * clamp01(e / 2.6)) : 0;
      pose = atDesk({ write: seg && seg.kind === 'write', count: seg && seg.kind === 'count', ear: callUp > 0.5, nod: callUp > 0.5 && mo ? 0.008 * Math.sin(e * 5) : 0, lean: seg && seg.kind === 'lean' ? ease(e / 1.2) * (1 - ease((e - seg.d + 1.2) / 1.2)) : 0, cig: cg }, t);
      ear = callUp > 0.5; cig = cg; ember = 0.3 + 0.7 * cg;
    } else if (seg.kind === 'pace') {
      // (up with the phone in his hand, the receiver at his head, pacing the room — a gesture with the cigar hand now + then)
      const up = ease(e / 1.2), down = ease((e - seg.d + 1.4) / 1.2);
      if (up < 1 || down > 0) { X = deskX; seated = true; pose = mix(atDesk({ ear: true }, t), stand(), up * (1 - down)); face = 0; }
      else { const span = BK.pace, ph = (e - 1.2) / 5.5, u = 0.5 + 0.5 * Math.sin(ph * Math.PI - Math.PI / 2); X = PX(lerp(span[0], span[1], u)); face = Math.cos(ph * Math.PI - Math.PI / 2) >= 0 ? 1 : -1; pose = walk(e, 0.7); pose.arms.rear = [[0.0, 0.66], [0.06, 0.88]]; pose.arms.lead = [[0.1, 0.6], [0.2, 0.62 + 0.05 * Math.sin(e * 2.3)]]; }
      ear = true; phoneInHand = up >= 1 && down <= 0;
    } else if (seg.kind === 'bad') {
      // THE BAD CALL: the SLAM, to the hook, the HAT THROWN on the floor, a beat (hands on his hips), picks it up, hangs it back, sits
      const hatFloor = [PX(0.36), floorV + 0.01 * ch];
      if (e < BAD.slam) { X = deskX; seated = true; face = 0; const s = Math.sin(Math.PI * e / BAD.slam); pose = mix(atDesk({ ear: true }, t), stand(), Math.min(1, e / 0.6)); pose.arms.rear = [[-0.14, 0.62], [-0.15, lerp(0.75, 0.32, s)]]; ear = e < 0.6; }
      else if (e < BAD.toHook) walkTo(deskX, toHookX, BAD.slam, BAD.toHook, e);
      else if (e < BAD.land) { X = toHookX; face = 1; const u = clamp01((e - BAD.toHook) / (BAD.throw - BAD.toHook)); pose = stand({ lean: 0.04 * u }); pose.arms.lead = [lp([0.12, 0.72], [0.16, 0.7], u), lp([0.18, 0.9], [0.32, 0.5], u)];
        if (e < BAD.throw) hat = 'hand'; else { const f = (e - BAD.throw) / (BAD.land - BAD.throw); hat = 'air'; hatXY = [lerp(X + 0.3 * H, hatFloor[0], f), lerp(floorV + 0.55 * H, hatFloor[1], f) + 0.25 * H * Math.sin(Math.PI * f)]; } }
      else if (e < BAD.beat) { X = toHookX; face = 1; pose = stand(); pose.arms = { rear: [[-0.08, 0.6], [-0.14, 0.5]], lead: [[0.1, 0.6], [0.15, 0.5]] }; hat = 'floor'; hatXY = hatFloor; }
      else if (e < BAD.pick) { const k = ease((e - BAD.beat) / (BAD.pick - BAD.beat)); X = lerp(toHookX, hatFloor[0] - 0.2 * H, Math.min(1, k * 1.6)); face = 1; const cr = ease((k - 0.6) / 0.4); pose = cr > 0 ? crouch(cr) : walk(e, 0.8); hat = k > 0.9 ? 'hand' : 'floor'; hatXY = hatFloor; }
      else if (e < BAD.hang) { walkTo(hatFloor[0] - 0.2 * H, toHookX, BAD.pick, BAD.hang - 0.6, e); hat = e < BAD.hang - 0.4 ? 'hand' : 'hook'; }
      else walkTo(toHookX, deskX, BAD.hang, BAD.sit, e);
      if (e >= BAD.sit - 0.6) { seated = true; X = deskX; face = 0; pose = mix(stand(), atDesk({}, t), ease((e - BAD.sit + 0.6) / 0.6)); }
    }
  } else if (st.phase === 'exit') {
    const e = st.t;
    if (e < EXIT.up) { X = deskX; seated = true; face = 0; pose = atDesk({ count: true }, t); bag = clamp01(e / EXIT.bag[1]); if (e > EXIT.bag[1]) pose = mix(atDesk({}, t), stand(), ease((e - EXIT.bag[1]) / (EXIT.up - EXIT.bag[1]))); }
    else if (e < EXIT.toHook) { walkTo(deskX, toHookX, EXIT.up, EXIT.toHook, e); bag = 2; }
    else if (e < EXIT.hatOn) { X = toHookX; face = -1; pose = stand(); const r = Math.sin(Math.PI * (e - EXIT.toHook) / (EXIT.hatOn - EXIT.toHook)); pose.arms.lead = [[0.12, 0.72 + 0.1 * r], [0.16, 0.86 + 0.08 * r]]; hat = e > (EXIT.toHook + EXIT.hatOn) / 2 ? 'head' : 'hook'; bag = 2; }
    else if (e < EXIT.toWindow) { const k = ease((e - EXIT.hatOn) / (EXIT.toWindow - EXIT.hatOn)); glassK = k; X = lerp(toHookX, PX(0.56), k); scale = lerp(1, 1.5, k); face = 0.2; pose = walk(e, 0.8 * (1 - k)); hat = 'head'; bag = 2; }
    else { glassK = 2; X = PX(0.56); scale = 1.5; face = 0.2; hat = 'head'; bag = 2; }
  }
  // ---- HIM (behind the desk when seated; in front of it when he's up + walking — never through it), the hat
  const Hs = H * scale, Yf = floorV - (scale - 1) * 1.25 * H;
  const drawMan = () => {
    if (!pose) return;
    const front = seated || Math.abs(face) < 0.01;
    // (the lamp's green rim — before it's on, a faint cool edge from the street through the glass: he is there, just)
    rimmed(c, X, Yf, Hs, front ? 1 : face, pose, { front, hat: hat === 'head' ? 'fedora' : null, rim: L > 0.3 ? GREEN : [110, 124, 150], rimA: (L > 0.3 ? 0.42 * L : 0.4) * (1 - 0.5 * Math.min(1, glassK)), toward: L > 0.3 ? Math.sign(lampP[0] - X) || 1 : 1, col: 'rgb(8,10,9)' });
    const fx = front ? 1 : Math.sign(face) || 1, sq = front ? 1 : Math.max(0.35, Math.abs(face)), P = p => [X + fx * sq * p[0] * Hs, Yf + p[1] * Hs];
    if (ear) { const h = P(pose.arms.rear[1]); c.fillStyle = 'rgb(10,10,10)'; c.fillRect(h[0] - 0.02 * Hs, h[1] - 0.06 * Hs, 0.04 * Hs, 0.1 * Hs); }
    if (phoneInHand) { const h = P(pose.arms.lead[1]); c.fillStyle = 'rgb(12,12,12)'; c.fillRect(h[0] - 0.012 * Hs, h[1] - 0.02 * Hs, 0.024 * Hs, 0.2 * Hs); c.beginPath(); c.ellipse(h[0], h[1] + 0.19 * Hs, 0.035 * Hs, 0.02 * Hs, 0, 0, TAU); c.fill(); }
    if (hat === 'hand') { const h = P(pose.arms.lead[1]); fedora(c, h[0], h[1], 0.24 * Hs, 0, L); }
    // (the cigar's ember: at his mouth on a draw, else in his hand resting on the desk)
    if (seated && L > 0) { const h = cig > 0.3 ? P([0.05, pose.head[1] - 0.03]) : P(pose.arms.lead[1]); c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, h[0] + 0.02 * Hs, h[1], 0.05 * Hs * (0.7 + ember), [255, 120, 40], 0.85 * ember); c.restore();
      smoke(c, h[0] + 0.02 * Hs, h[1] + 0.01 * Hs, Hs, t, mo, L); }
  };
  if (!seated && glassK < 2) desk();
  if (glassK < 2) drawMan(); else if (st.pull != null && st.pull < 0.14) { c.save(); c.globalAlpha = 1 - ease(st.pull / 0.12); drawMan(); c.restore(); }
  if (seated) desk();
  if (hat === 'hook') fedora(c, hook[0], hook[1] - 0.07 * H, 0.24 * H, 0, L);
  if ((hat === 'air' || hat === 'floor') && hatXY) fedora(c, hatXY[0], hatXY[1], 0.26 * H, hat === 'air' ? Math.sin(t * 9) * 0.6 : 0, L);
  // ---- his face + hands LIT FROM BELOW by the lamp (the green light thrown up off the desk), the beam on the desk
  if (L > 0) { c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, lampP[0] + 0.06 * cw, deskTop + 0.05 * ch, 0.36 * ch, GREEN, 0.3 * L); glowAt(c, lampP[0], deskTop + 0.01 * ch, 0.16 * ch, [200, 255, 210], 0.35 * L); c.restore(); }
  if (st.phase === 'exit' && st.pull > 0) E.front = () => pullAtGlass(E, st.pull, hemAt(G, st.shade || 0), { x: 0.56, hat: 'fedora', rim: GREEN, rimA: 0.4 });
  return { phase: st.phase, doing, lamp: +L.toFixed(2), hat, x: +((X - x0) / cw).toFixed(3) };

  function desk() {
    // the desk (front panel + top edge in the lamp's light), THE LAMP (brass stem, the green glass shade glowing), the candlestick phone,
    // the bag of cash at the end
    c.fillStyle = 'rgb(30,20,14)'; c.fillRect(deskX - 0.3 * cw, floorV, 0.6 * cw, deskTop - floorV);
    c.fillStyle = rgb([150, 200, 150], 0.35 * L); c.fillRect(deskX - 0.3 * cw, deskTop - 0.012 * ch, 0.6 * cw, 0.014 * ch);
    c.fillStyle = 'rgb(60,48,26)'; c.fillRect(lampP[0] - 0.01 * cw, deskTop, 0.02 * cw, lampP[1] - deskTop);
    const sw = 0.2 * cw, sh = 0.06 * ch;
    c.fillStyle = L > 0 ? rgb([60 + 80 * L, 150 + 70 * L, 80 + 50 * L]) : 'rgb(24,50,30)'; c.beginPath(); c.ellipse(lampP[0], lampP[1], sw / 2, sh, 0, 0, Math.PI); c.closePath(); c.fill();
    if (L > 0) { c.fillStyle = rgb([230, 255, 230], 0.7 * L); c.fillRect(lampP[0] - sw / 2, lampP[1] - 0.006 * ch, sw, 0.008 * ch); }
    if (!phoneInHand) { const px = PX(0.66); c.fillStyle = 'rgb(12,12,12)'; c.fillRect(px - 0.012 * cw, deskTop, 0.024 * cw, 0.16 * H); c.beginPath(); c.ellipse(px, deskTop + 0.16 * H, 0.035 * cw, 0.02 * ch, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(px, deskTop + 0.01 * ch, 0.05 * cw, 0.015 * ch, 0, 0, TAU); c.fill();
      if (!ear) c.fillRect(px + 0.03 * cw, deskTop + 0.06 * H, 0.025 * cw, 0.08 * H); }
    if (bag > 0) { const bx = deskX + 0.12 * cw, s = Math.min(1, bag); c.fillStyle = 'rgb(40,32,22)'; c.beginPath(); c.ellipse(bx, deskTop + 0.05 * ch * s, 0.08 * cw, 0.05 * ch * s, 0, 0, TAU); c.fill(); }
  }
}
/** a fedora (its pinched crown + the brim) at x, y (the brim's middle), w wide, tilted a */
function fedora(c, x, y, w, a = 0, L = 1) {
  c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = 'rgb(14,13,12)';
  c.fillRect(-w / 2, 0, w, w * 0.09); c.beginPath(); c.moveTo(-w * 0.28, w * 0.07); c.lineTo(-w * 0.25, w * 0.36); c.quadraticCurveTo(0, w * 0.28, w * 0.25, w * 0.36); c.lineTo(w * 0.28, w * 0.07); c.closePath(); c.fill();
  // (the lamp's green on its brim + the crown's band: the hat reads on the dark floor)
  c.fillStyle = `rgba(150,230,160,${(0.55 * Math.max(0.35, L)).toFixed(3)})`; c.fillRect(-w / 2, w * 0.07, w, w * 0.03); c.fillRect(-w * 0.27, w * 0.11, w * 0.54, w * 0.04);
  c.restore();
}
/** the cigar's smoke: three slow curling strands rising through the lamp's beam (soft, catching its green) */
function smoke(c, x, y, H, t, mo, L) {
  c.save(); c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = (mo ? t * 0.35 : 0) + i * 0.33, f = ph % 1;
    c.strokeStyle = `rgba(190,220,200,${(0.22 * L * (1 - f)).toFixed(3)})`; c.lineWidth = 0.025 * H * (1 + 1.5 * f);
    c.beginPath();
    for (let k = 0; k <= 8; k++) { const u = k / 8, yy = y + (f * 0.35 + u * 0.25) * H, xx = x + Math.sin((u + f) * 6 + i) * 0.035 * H * (0.4 + u); if (k) c.lineTo(xx, yy); else c.moveTo(xx, yy); }
    c.stroke();
  }
  c.restore();
}
