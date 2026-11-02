// CITY 2.0 — WINDOWS: THE CHARLESTON's ROOM (core/harbor-charleston.js: what she does; core/harbor-scenes.js: when) — the bottom-middle
// window, 7 → 10 pm. THE WINDOW STANDARD: ONE ROSY LAMP with a FRINGED shade (at the left) — a warm pink room; SHE IS LIT, never a silhouette:
// a BRIGHT TEAL FRINGE DRESS whose fringe tiers swing with every kick + twist (the legs + the dress carry it at ~40 pt), bare arms + legs in
// the lamp's warm light (brighter on its side), a black bob + a gold band. The chair she collapses into (left), the phonograph + its brass horn
// (right). Big shapes, light + colour — nothing the phone can't show. THE OWNER's WINDOWS REVIEW (Nov 2 — "hard to see what she's doing — you
// see her feet moving"; the PINK stays): she is BIGGER in the frame (~86 % of the pane), the kicks go to hip height + out wide, the arms swing
// wide, the limbs thicker, and a DARK PLUM CONTOUR round her whole shape separates the teal from the pink (a clear silhouette at ~40 pt).
import { CHA, charlestonPlan, stepAt, movesAt, ENTER, EXIT } from '../../core/harbor-charleston.js';
import { SCENE_TIMING } from '../../core/harbor-scenes.js';
import { cached, ease, lerp, lp, add, rgb, mixc, clamp01, pullAtGlass, hemAt, glowAt } from './scene-kit.js';

const TAU = Math.PI * 2;
const ROSE = [255, 150, 170];
const DRESS = [0, 196, 196], FRINGE = [150, 255, 240], SKIN = [240, 190, 160], HAIR = [22, 14, 18], BAND = [250, 212, 96];
const CONTOUR = 'rgb(46,8,30)';

/** her FRONT pose from the moves: { hip, sh, head, legs: { l: [knee, foot], r: [knee, foot] }, arms: { l: [elbow, hand], r: [elbow, hand] },
 *  fr (the fringe's swing −1..1) } — x across her (her right = our left is l = −1 side), y up, 1 = her height */
function poseOf(m, o = {}) {
  const dy = (m.knees || 0) * 0.07 + (o.sit || 0) * 0.24, bob = m.bob || 0, dx = m.dx || 0;
  const hip = [dx, 0.5 - dy + bob], sh = [dx + (o.lean || 0), 0.795 - dy * 0.85 + bob], head = [dx + (o.lean || 0) * 1.2 + (o.headX || 0), 0.905 - dy * 0.85 + bob + (o.headY || 0)];
  const leg = s => {
    const i = s < 0 ? 0 : 1, tw = (m.twist || 0) * s, k = m.kick[i] || 0, b = m.back[i] || 0, kn = m.knees || 0;
    let knee = [dx + s * (0.065 - 0.06 * tw + 0.05 * k + 0.03 * b) - s * kn * 0.05 * (1 + (m.cross || 0) * s), 0.255 - dy * 0.5 + 0.17 * k + 0.05 * b];
    let foot = [dx + s * (0.075 + 0.06 * tw + 0.1 * b + 0.12 * k), 0.012 + 0.44 * k + 0.3 * b];
    if (o.sit) { knee = [dx + s * 0.075, hip[1] + 0.02]; foot = [dx + s * 0.085, 0.012]; }
    return [knee, foot];
  };
  const arm = s => {
    const i = s < 0 ? 0 : 1, S = [sh[0] + s * 0.105, sh[1] - 0.025], a = (m.arms && m.arms[i]) || 0, op = m.open || 0;
    let hand = a >= 0 ? [S[0] + s * (0.15 + 0.12 * a), S[1] - 0.22 + 0.46 * a] : [S[0] + s * (0.11 - 0.05 * a), S[1] - 0.3 - 0.02 * a];
    hand = lp(hand, [S[0] + s * 0.36, S[1] + 0.02], op);
    if (m.knees > 0.3) { const kneeOf = (m.cross || 0) * s > 0 ? leg(-s)[0] : leg(s)[0]; hand = lp(hand, add(kneeOf, 0, 0.02), Math.min(1, m.knees)); }
    if (m.stop > 0 && s > 0) hand = lp(hand, [head[0] + 0.05, head[1] + 0.04], m.stop);
    if (m.stop > 0 && s < 0) hand = lp(hand, [hip[0] - 0.09, hip[1] + 0.02], m.stop);
    if (m.tada > 0) hand = lp(hand, [S[0] + s * 0.24, S[1] + 0.24], m.tada);
    if (o.hands && o.hands[i]) hand = o.hands[i];
    const elbow = [lerp(S[0], hand[0], 0.5) + s * 0.05, lerp(S[1], hand[1], 0.5) - 0.02];
    return [elbow, hand];
  };
  const fr = Math.max(-1, Math.min(1, (m.twist || 0) * 0.8 + ((m.kick[1] || 0) - (m.kick[0] || 0)) * 0.8 + ((m.back[1] || 0) - (m.back[0] || 0)) * 0.5 + (m.dx || 0) * 0.5));
  return { hip, sh, head, legs: { l: leg(-1), r: leg(1) }, arms: { l: arm(-1), r: arm(1) }, fr };
}

/** HER, lit: the legs (skin), the fringe dress over them (three tiers swinging), the arms, the head + the bob + the band. The lamp is at the
 *  left: each shape brighter on its left, darker on its right (a gradient across her) */
function dancer(c, X, Y, H, P, o = {}) {
  const Q = ([x, y]) => [X + x * H, Y + y * H];
  // o.flat: THE CONTOUR pass — her whole shape in one dark colour, every stroke + fill grown by o.grow (× her height), drawn first
  const F = o.flat || null, G = (o.grow || 0) * H;
  // (the lamp's light across her: ONE gradient per colour per frame — skin, dress, fringe — shared by every shape of that colour)
  const memo = new Map(), across = F ? () => F : (col, k = 1) => { const key = col.join() + k; let g = memo.get(key); if (g) return g; g = c.createLinearGradient(X - 0.22 * H, 0, X + 0.22 * H, 0); g.addColorStop(0, rgb(mixc(col, [255, 236, 236], 0.18 * k))); g.addColorStop(0.55, rgb(col)); g.addColorStop(1, rgb(mixc(col, [40, 10, 30], 0.42 * k))); memo.set(key, g); return g; };
  const fill = () => { c.fill(); if (F) { c.strokeStyle = F; c.lineWidth = G * 2; c.stroke(); } };
  c.lineCap = 'round'; c.lineJoin = 'round';
  const limb = (pts, w, col) => { c.strokeStyle = col; c.lineWidth = w * H + G * 2; c.beginPath(); pts.forEach((p, i) => { const q = Q(p); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.stroke(); };
  for (const s of ['l', 'r']) { const [kn, ft] = P.legs[s]; limb([[P.hip[0] + (s === 'l' ? -0.05 : 0.05), P.hip[1] - 0.05], kn, ft], 0.084, across(SKIN)); c.fillStyle = F || 'rgb(60,22,34)'; const f = Q(ft); c.beginPath(); c.ellipse(f[0], f[1], 0.044 * H + G, 0.02 * H + G, 0, 0, TAU); c.fill(); }
  // THE DRESS: a straight drop-waist shift from the shoulders to the knee, its hem + two more tiers of FRINGE that swing (P.fr)
  const sw = 0.14, hw = 0.17, top = P.sh[1] + 0.01, waist = P.hip[1] + 0.02, hem = Math.max(P.hip[1] - 0.2, 0.2), sx = P.fr * 0.08;
  c.fillStyle = across(DRESS);
  c.beginPath(); { const a = Q([P.sh[0] - sw, top]), b = Q([P.sh[0] + sw, top]), cc = Q([P.hip[0] + hw + sx * 0.5, hem]), d = Q([P.hip[0] - hw + sx * 0.5, hem]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); } fill();
  // (the drop waist: a sash catching the light)
  if (!F) { const a = Q([P.hip[0] - hw * 0.95, waist]), b = Q([P.hip[0] + hw * 0.95, waist]); c.strokeStyle = rgb(mixc(DRESS, [255, 255, 255], 0.35)); c.lineWidth = 0.024 * H; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  // (the fringe: three tiers of strands, each tier's ends swinging further than the last — the motion IS the dress)
  for (const [ty, len, k] of [[waist - 0.035, 0.07, 0.4], [lerp(waist, hem, 0.5), 0.08, 0.7], [hem, 0.11, 1]]) {
    const w0 = hw * (0.85 + 0.15 * (waist - ty) / Math.max(0.01, waist - hem)), n = 8;
    c.strokeStyle = across(FRINGE, 0.7); c.lineWidth = 0.02 * H + G * 2;
    c.beginPath();
    for (let i = 0; i <= n; i++) { const u = i / n, x = P.hip[0] - w0 + 2 * w0 * u + sx * k * 0.5, a = Q([x, ty]), b = Q([x + sx * k + (o.mo ? 0.006 * Math.sin(o.t * 21 + i) * Math.abs(P.fr) : 0), ty - len]); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
  }
  // THE ARMS (skin), the shoulders' straps
  for (const s of ['l', 'r']) { const S = [P.sh[0] + (s === 'l' ? -0.1 : 0.1), P.sh[1] - 0.02], [el, hn] = P.arms[s]; limb([S, el, hn], 0.066, across(SKIN)); }
  // THE HEAD: the neck, the face lit from the left, the BOB (black, a sleek helmet to the jaw), the gold band
  limb([lp(P.sh, P.head, 0.25), lp(P.sh, P.head, 0.7)], 0.056, across(SKIN));
  const hd = Q(P.head), r = 0.072 * H;
  c.fillStyle = across(SKIN); c.beginPath(); c.ellipse(hd[0], hd[1], r * 0.92 + G, r * 1.05 + G, 0, 0, TAU); c.fill();
  // (v is UP here: the arc 0 → π is the TOP half — the bob's crown down to the brow; the sides fall to the jaw)
  c.fillStyle = F || rgb(HAIR); c.beginPath(); c.ellipse(hd[0], hd[1] + r * 0.18, r * 1.12 + G, r * 0.98 + G, 0, 0, Math.PI); c.fill();
  c.fillRect(hd[0] - r * 1.12 - G, hd[1] - r * 0.55 - G, r * 0.4 + G, r * 0.75 + G); c.fillRect(hd[0] + r * 0.72, hd[1] - r * 0.55 - G, r * 0.4 + G, r * 0.75 + G);
  if (F) return;
  c.strokeStyle = rgb(BAND); c.lineWidth = 0.02 * H; c.beginPath(); c.ellipse(hd[0], hd[1] + r * 0.3, r * 1.1, r * 0.4, 0, Math.PI * 0.05, Math.PI * 0.95); c.stroke();
  c.fillStyle = rgb(mixc(BAND, [255, 255, 255], 0.3)); c.beginPath(); c.arc(hd[0] - r * 0.55, hd[1] + r * 0.62, r * 0.2, 0, TAU); c.fill();   // (a jewel on the band)
}

/**
 * paint her room — E: the window life's (c, G, k, t, mo), st: core/harbor-scenes.js#sceneAt, o: { key, seed }
 * → { phase, step, x, fr (the fringe's swing) }
 */
export function charlestonRoom(E, st, o = {}) {
  const { c, G, t, mo } = E, cw = G.cw, ch = G.ch, x0 = G.g0, y0 = G.h0, y1 = G.h1;
  const floorV = y0 + 0.07 * ch, H = 0.86 * ch, T = SCENE_TIMING.charleston, PX = u => x0 + u * cw;
  const plan = charlestonPlan(o.key || '', st.workLen, o.seed || 1924), lamp = [PX(CHA.lamp), floorV + 0.8 * H];
  const ph = [PX(CHA.phono), floorV], chair = [PX(CHA.chair) + 0.08 * cw, floorV];
  // ---- THE STILL ROOM (cached — scene-kit.js#cached): the rosy walls + floor, the phonograph, the chair
  cached(c, 'charleston', [x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1], c => {
  // ---- the room: rosy, lit from the lamp at the left; the floor a dark pink-brown; the corners deep
    { const g = c.createRadialGradient(lamp[0], lamp[1], 0.03 * ch, lamp[0] + 0.1 * cw, lamp[1] - 0.05 * ch, 1.25 * ch);
      g.addColorStop(0, rgb([250, 186, 200])); g.addColorStop(0.22, rgb([228, 122, 146])); g.addColorStop(0.6, rgb([132, 58, 82])); g.addColorStop(1, rgb([40, 16, 28]));
      c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1); }
    { const g = c.createLinearGradient(0, y0, 0, floorV + 0.02 * ch); g.addColorStop(0, rgb([30, 14, 18])); g.addColorStop(1, rgb([96, 50, 58]));
      c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, floorV + 0.02 * ch - y0 + 0.05);
      c.fillStyle = 'rgba(255,170,190,0.18)'; c.beginPath(); c.ellipse(lamp[0] + 0.18 * cw, floorV - 0.02 * ch, 0.42 * cw, 0.05 * ch, 0, 0, TAU); c.fill(); }
    { const g = c.createLinearGradient(x0 + cw, 0, x0 + cw * 0.78, 0); g.addColorStop(0, 'rgba(20,6,14,0.6)'); g.addColorStop(1, 'rgba(20,6,14,0)'); c.fillStyle = g; c.fillRect(x0 + cw * 0.78, y0 - 0.05, cw * 0.22 + 0.05, ch + 0.1); }
    // ---- THE PHONOGRAPH (right): a small table, the box, the brass horn flaring up + toward the room (its rim catching the lamp)
    c.fillStyle = 'rgb(50,22,30)'; c.fillRect(ph[0] - 0.11 * cw, ph[1], 0.22 * cw, 0.36 * H); c.fillRect(ph[0] - 0.13 * cw, ph[1] + 0.36 * H - 0.02 * ch, 0.26 * cw, 0.03 * ch);
    c.fillStyle = 'rgb(70,32,26)'; c.fillRect(ph[0] - 0.08 * cw, ph[1] + 0.37 * H, 0.16 * cw, 0.09 * H);
    { const bx = ph[0] - 0.02 * cw, by = ph[1] + 0.46 * H, g = c.createLinearGradient(bx - 0.2 * cw, 0, bx + 0.05 * cw, 0); g.addColorStop(0, rgb([255, 214, 130])); g.addColorStop(1, rgb([150, 96, 40]));
      c.fillStyle = g; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx - 0.04 * cw, by + 0.16 * H, bx - 0.2 * cw, by + 0.3 * H); c.lineTo(bx - 0.08 * cw, by + 0.37 * H); c.quadraticCurveTo(bx - 0.02 * cw, by + 0.2 * H, bx + 0.02 * cw, by + 0.02 * H); c.closePath(); c.fill(); }
    // ---- THE CHAIR (left, by the lamp): a plum armchair, its arm + back catching the rosy light
    c.fillStyle = 'rgb(84,30,56)'; c.beginPath(); c.roundRect(chair[0] - 0.13 * cw, chair[1], 0.26 * cw, 0.42 * H, 0.03 * ch); c.fill();
    c.fillStyle = 'rgb(110,40,72)'; c.beginPath(); c.roundRect(chair[0] - 0.15 * cw, chair[1] + 0.06 * H, 0.06 * cw, 0.22 * H, 0.02 * ch); c.fill(); c.beginPath(); c.roundRect(chair[0] + 0.09 * cw, chair[1] + 0.06 * H, 0.06 * cw, 0.22 * H, 0.02 * ch); c.fill();
  });
  // ---- what she's doing: her place, pose
  let X = PX(CHA.spot), P = null, step = st.phase, scale = 1, glassK = 0, fan = 0;
  const still = { twist: 0, kick: [0, 0], back: [0, 0], knees: 0, cross: 0, arms: [-0.5, -0.5], dx: 0, bob: 0, open: 0, stop: 0, tada: 0 };
  const walking = (e, k) => ({ ...still, bob: 0.01 * Math.abs(Math.sin(e * 6)), kick: [Math.max(0, Math.sin(e * 6)) * 0.12 * k, Math.max(0, -Math.sin(e * 6)) * 0.12 * k], arms: [0.25 * Math.sin(e * 6) * k - 0.4, -0.25 * Math.sin(e * 6) * k - 0.4] });
  if (st.phase === 'enter') {
    const e = st.t;
    if (e < ENTER.walk) { X = lerp(PX(1.22), ph[0] - 0.2 * cw, ease(e / ENTER.walk)); P = poseOf(walking(e, 1)); }
    else if (e < ENTER.needle[1] + 0.5) { X = ph[0] - 0.2 * cw; const n = Math.sin(Math.PI * clamp01((e - ENTER.needle[0]) / (ENTER.needle[1] - ENTER.needle[0]))); P = poseOf(still, { lean: 0.03 * n, hands: [null, [0.2 + 0.03 * n, 0.5 + 0.08 * n]] }); }
    else if (e < ENTER.heels[0]) { X = lerp(ph[0] - 0.2 * cw, PX(CHA.spot), ease((e - ENTER.needle[1] - 0.5) / (ENTER.heels[0] - ENTER.needle[1] - 0.5))); P = poseOf(walking(e, 1)); }
    else if (e < ENTER.heels[1]) { const u = (e - ENTER.heels[0]) / (ENTER.heels[1] - ENTER.heels[0]), m = { ...still, back: [u < 0.5 ? Math.sin(Math.PI * u * 2) * 0.7 : 0, u >= 0.5 ? Math.sin(Math.PI * (u - 0.5) * 2) * 0.7 : 0], arms: [-0.2, -0.2] }; P = poseOf(m); }
    else { const u = clamp01((e - ENTER.heels[1]) / (T.enter - ENTER.heels[1])); P = poseOf({ ...still, twist: 0.4 * Math.sin(e * Math.PI / CHA.beat) * u, bob: 0.008 * Math.abs(Math.sin(e * Math.PI / CHA.beat)), arms: [-0.3, -0.3] }); }
  } else if (st.phase === 'work') {
    const S = stepAt(plan, st.work), seg = S ? S.seg : null, e = S ? S.e : 0;
    step = seg ? seg.kind + (seg.try ? `-${seg.try}` : '') : 'basic';
    if (seg && seg.kind === 'breather') {
      // (hands on her hips, catching her breath, then fanning herself with a hand)
      const br = mo ? 0.008 * Math.sin(e * TAU / 1.4) : 0, f = e > 2.5 ? Math.sin(e * 9) : 0;
      P = poseOf({ ...still, bob: br }, { hands: [[-0.15, 0.5], e > 2.5 ? [0.07 + 0.03 * f, 0.84] : [0.15, 0.5]] }); fan = e > 2.5 ? 1 : 0;
    } else if (seg && seg.kind === 'fix') {
      const d = Math.sin(Math.PI * clamp01(e / seg.d)); P = poseOf({ ...still, knees: 0.9 * d, bob: -0.04 * d }, { lean: 0.03 * d, hands: [[-0.05, lerp(0.45, 0.06, d)], [0.04, lerp(0.45, 0.07, d)]] });
    } else if (seg && seg.kind === 'chair') {
      // (the laughing collapse: she flops back into the chair, shoulders shaking, then up + back to it)
      const go = ease(e / 2.2), back = ease((e - seg.d + 3) / 2.6), k = go * (1 - back), sat = ease((e - 2) / 0.8) * (1 - ease((e - seg.d + 3.4) / 0.8));
      X = lerp(PX(CHA.spot), chair[0], k); const laugh = sat > 0.5 && mo ? 0.01 * Math.abs(Math.sin(e * 17)) : 0;
      P = sat > 0.05 ? poseOf({ ...still, bob: laugh }, { sit: sat, headY: 0.01 * sat, hands: [[-0.14, 0.42 - 0.12 * sat], [0.06, 0.62]] }) : poseOf(walking(e, 1));
    } else if (seg) { const m = movesAt(seg, e); P = poseOf(m); }
    else P = poseOf(still);
  } else if (st.phase === 'exit') {
    const e = st.t;
    if (e < EXIT.toChair) { X = lerp(PX(CHA.spot), chair[0], ease(e / EXIT.toChair)); P = poseOf(walking(e, 1)); }
    else if (e < EXIT.up) {
      X = chair[0]; const sat = ease((e - EXIT.toChair) / (EXIT.flop - EXIT.toChair)), laugh = e < EXIT.laugh[1] && mo ? 0.012 * Math.abs(Math.sin(e * 17)) : 0, f = e > EXIT.fan[0] && e < EXIT.fan[1] ? Math.sin(e * 9) : 0;
      P = poseOf({ ...still, bob: laugh }, { sit: sat, headY: 0.015 * sat, hands: [[-0.14, 0.32], f ? [0.07 + 0.03 * f, 0.72] : [0.12, 0.33]] }); fan = f ? 1 : 0;
    } else if (e < EXIT.toWindow) { const k = ease((e - EXIT.up) / (EXIT.toWindow - EXIT.up)); glassK = k; X = lerp(chair[0], PX(0.55), k); scale = lerp(1, 1.5, k); P = poseOf(walking(e, 1 - k)); }
    else { glassK = 2; X = PX(0.55); scale = 1.5; P = poseOf(still); }
  }
  // ---- HER (lit), her soft shadow on the floor
  const drawHer = () => {
    if (!P) return;
    const Hs = H * scale, Yf = floorV - (scale - 1) * 1.25 * H;
    c.fillStyle = 'rgba(40,10,24,0.35)'; c.beginPath(); c.ellipse(X + 0.05 * Hs, floorV + 0.004 * ch, 0.16 * Hs, 0.018 * ch, 0, 0, TAU); c.fill();
    dancer(c, X, Yf, Hs, P, { mo, t, flat: CONTOUR, grow: 0.014 });   // (the contour first: her shape against the pink)
    dancer(c, X, Yf, Hs, P, { mo, t });
  };
  if (glassK < 2) drawHer(); else if (st.pull != null && st.pull < 0.14) { c.save(); c.globalAlpha = 1 - ease(st.pull / 0.12); drawHer(); c.restore(); }
  // ---- THE LAMP (left): its stem, the FRINGED shade glowing rosy, its light
  c.fillStyle = 'rgb(40,16,26)'; c.fillRect(lamp[0] - 0.012 * cw, floorV, 0.024 * cw, lamp[1] - floorV - 0.04 * ch);
  { const sw = 0.24 * cw, sh = 0.12 * ch, sx = lamp[0], sy = lamp[1];
    c.fillStyle = rgb([255, 150, 178]); c.beginPath(); c.moveTo(sx - sw * 0.3, sy + sh * 0.5); c.lineTo(sx + sw * 0.3, sy + sh * 0.5); c.lineTo(sx + sw * 0.5, sy - sh * 0.4); c.lineTo(sx - sw * 0.5, sy - sh * 0.4); c.closePath(); c.fill();
    c.strokeStyle = rgb([255, 150, 176]); c.lineWidth = 0.012 * cw; c.beginPath(); for (let i = 0; i <= 8; i++) { const x = sx - sw * 0.5 + sw * i / 8, sway = mo ? 0.004 * ch * Math.sin(t * 2 + i) : 0; c.moveTo(x, sy - sh * 0.4); c.lineTo(x + sway, sy - sh * 0.4 - 0.05 * ch); } c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, sx, sy - sh * 0.5, 0.28 * ch, [255, 120, 150], 0.28); glowAt(c, sx, sy, 0.11 * ch, [255, 200, 214], 0.3); c.restore(); }
  if (st.phase === 'exit' && st.pull > 0) E.front = () => pullAtGlass(E, st.pull, hemAt(G, st.shade || 0), { x: 0.55, hat: 'bob', rim: ROSE, rimA: 0.55 });
  return { phase: st.phase, step, x: +((X - x0) / cw).toFixed(3), fr: P ? +P.fr.toFixed(2) : 0, fan };
}
