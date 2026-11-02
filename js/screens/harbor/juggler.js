// CITY 2.0 — WINDOWS: THE JUGGLER's ROOM (core/harbor-juggler.js: what he does; core/harbor-scenes.js: when) — the bottom-right window,
// 6:30 → 9:30 pm. THE WINDOW STANDARD (the boxer's craft): ONE LAMP on a side table to his right, low, its shade at the arcs' apex height —
// every throw's top passes through its brightest light. His room WARM AMBER (SCHED — the owner's DESKTOP review: DESKTOP's absinthe green
// was "too hard to see anything" → back to the amber WINDOWS shipped; reading close to the boxer's warm light is accepted), a PLAIN back
// wall behind his whole stage (the owner's WINDOWS review: the old doorway hid his body), and the balls NEON EVERY NIGHT (magenta · yellow · orange — the red + cream couldn't be seen): glowing, the
// brightest things in the room. PARTY NIGHTS add the PULSE on the song's beat + the room lit in their colours. Every pose eased; he walks in
// from the SIDE (off the pane's left edge), sets down his bag, takes the balls out, starts slow; at the end he catches all three, a flourish,
// packs the bag, comes to the glass + pulls the shade (scene-kit.js#pullAtGlass).
import { JUG, PAT, jugglerPlan, segAt, ballsAt, trickAt, ENTER, EXIT } from '../../core/harbor-juggler.js';
import { SCENE_TIMING } from '../../core/harbor-scenes.js';
import { cached, man, rimmed, walk, crouch, sit, stand, mix, ik, ease, lerp, lp, add, rgb, mixc, clamp01, pullAtGlass, hemAt, glowAt } from './scene-kit.js';

const TAU = Math.PI * 2;
const NEON = { 0: [255, 46, 170], 1: [255, 228, 60], 2: [255, 128, 28] };           // every night: magenta · yellow · orange (glowing over the amber room)
const AMBER = [255, 178, 96];                                                       // the lamp's light: warm amber (his rim, the pull's) — SCHED: back from DESKTOP's green

/** his FRONT pose (square to us): hands at [x, y] (his units), toss 0..1 per hand (the forearm's flick), knee (the right knee up: under the leg),
 *  dy (a crouch: the hips down), bob, step (a walking step's phase: the feet lifting in turn) */
function front(o = {}) {
  const dy = o.dy || 0, bob = o.bob || 0, k = o.knee || 0, st = o.step || 0;
  const hip = [0, 0.48 - dy + bob], sh = [0, 0.785 - dy * 0.92 + bob], head = [o.headX || 0, 0.9 - dy * 0.9 + bob + (o.look || 0) * 0.008];
  const lift = s => Math.max(0, Math.sin(st * Math.PI + s)) * (o.stride || 0);
  const legs = {
    back: [[-0.085 - dy * 0.12, 0.25 - dy * 0.35 + lift(Math.PI) * 0.6], [-0.11, 0.012 + lift(Math.PI)]],
    front: [[0.085 + dy * 0.12 + k * 0.03, 0.25 - dy * 0.35 + k * 0.17 + lift(0) * 0.6], [0.11 - k * 0.04, 0.012 + k * 0.16 + lift(0)]],
  };
  const hands = o.hands || [[0.1, 0.46], [-0.1, 0.46]];
  const arm = (h, side) => { const S = [side * 0.13, sh[1] - 0.03], Hn = [hands[h][0], hands[h][1] - dy * (o.handsDrop == null ? 0.9 : o.handsDrop) + bob]; return [ik(S, Hn, 0.17, 0.17, side > 0 ? -1 : 1), Hn]; };
  return { hip, sh, head, legs, arms: { lead: arm(0, 1), rear: arm(1, -1) } };
}

/**
 * paint his room — E: the window life's (c, G, k, t, mo, B, deep), st: core/harbor-scenes.js#sceneAt, o: { key, seed, party, beat }
 * → a trace for the tests + the readout: { phase, kind, air (balls in the air), x, drop }
 */
export function jugglerRoom(E, st, o = {}) {
  const { c, G, t, mo } = E, cw = G.cw, ch = G.ch, x0 = G.g0, y0 = G.h0, y1 = G.h1;
  const floorV = y0 + 0.13 * ch, H = 0.68 * ch, party = !!o.party;
  const T = SCENE_TIMING.juggler, plan = jugglerPlan(o.key || '', st.workLen, o.seed || 1924);
  const PX = u => x0 + u * cw;
  // the beat's pulse (party nights): 1 on the beat, decaying through it
  const beatK = party && o.beat && o.beat.beatsF != null ? Math.exp(-((o.beat.beatsF % 1 + 1) % 1) * 3.2) : 0;
  // THE LAMP: on a side table at the right, its shade at about his head's height (the arcs' apex): the room's ONE light
  const lamp = [PX(JUG.lamp), floorV + 0.8 * H];
  // ---- THE STILL ROOM (cached — scene-kit.js#cached): the back wall lit round the lamp, the floor, the corners, the stool, the lamp's table
  cached(c, 'juggler', [x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1], c => {
  // ---- the room: the back wall dark brown, lit round the lamp (amber, falling off); the floor darker; the corners in shade
    { const g = c.createRadialGradient(lamp[0], lamp[1], 0.02 * ch, lamp[0], lamp[1], 1.25 * ch);
      g.addColorStop(0, rgb([248, 178, 100])); g.addColorStop(0.25, rgb([200, 120, 58])); g.addColorStop(0.6, rgb([112, 62, 30])); g.addColorStop(1, rgb([42, 22, 12]));
      c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1); }
    { const g = c.createLinearGradient(0, y0, 0, floorV + 0.03 * ch); g.addColorStop(0, rgb([22, 12, 8])); g.addColorStop(1, rgb([72, 40, 20]));
      c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, floorV + 0.03 * ch - y0 + 0.05);
      c.fillStyle = 'rgba(255,184,100,0.16)'; c.beginPath(); c.ellipse(lamp[0] - 0.08 * cw, floorV - 0.02 * ch, 0.38 * cw, 0.05 * ch, 0, 0, TAU); c.fill(); }
    for (const s of [-1, 1]) { const ex = s < 0 ? x0 : x0 + cw, g = c.createLinearGradient(ex, 0, ex - s * 0.2 * cw, 0); g.addColorStop(0, 'rgba(10,6,4,0.66)'); g.addColorStop(1, 'rgba(10,6,4,0)'); c.fillStyle = g; c.fillRect(s < 0 ? x0 - 0.05 : x0 + cw * 0.8, y0 - 0.05, cw * 0.2 + 0.05, ch + 0.1); }
    // ---- the stool (left) + his bag (on the floor by it)
    const stoolX = PX(JUG.stool), seat = floorV + 0.27 * H;
    c.fillStyle = 'rgb(26,15,10)'; c.fillRect(stoolX - 0.085 * cw, seat - 0.02 * ch, 0.17 * cw, 0.035 * ch);
    c.strokeStyle = 'rgb(26,15,10)'; c.lineWidth = 0.022 * cw; c.beginPath(); for (const d of [-0.065, 0.065]) { c.moveTo(stoolX + d * cw * 0.9, seat - 0.02 * ch); c.lineTo(stoolX + d * cw * 1.15, floorV); } c.stroke();
    c.strokeStyle = `rgba(255,170,90,${0.35})`; c.lineWidth = 0.008 * ch; c.beginPath(); c.moveTo(stoolX - 0.085 * cw, seat + 0.015 * ch); c.lineTo(stoolX + 0.085 * cw, seat + 0.015 * ch); c.stroke();
    c.fillStyle = 'rgb(28,16,10)'; c.fillRect(lamp[0] - 0.14 * cw, floorV, 0.28 * cw, 0.42 * H); c.fillRect(lamp[0] - 0.17 * cw, floorV + 0.42 * H - 0.02 * ch, 0.34 * cw, 0.03 * ch); c.fillRect(lamp[0] - 0.012 * cw, floorV + 0.42 * H, 0.024 * cw, 0.3 * H);
  });
  // (NO doorway: THE OWNER's REVIEW — his body vanished against its dark opening. A plain lit wall behind his whole stage; he enters from the side)
  // ---- what he's doing now: his place (pane x), facing, depth, pose, the balls
  const bagHome = PX(JUG.bag), spot = PX(JUG.spot), Y0 = floorV;
  let manA = 1, X = spot, face = 0, pose = null, depth = 0, scale = 1, bag = { x: bagHome, held: false, open: false, on: true }, balls = [], kind = st.phase, air = 0, look = 0, turn = 0, bottle = null, floorBall = null, glassK = 0;
  const heldBalls = (hands, ids, n = 3) => ids.slice(0, n).map((id, i) => { const h = i === 1 ? 1 : 0, [hx, hy] = hands[h]; return { id, x: hx + (i === 2 ? -0.05 : i === 0 ? 0.03 : 0) * (h ? -1 : 1), y: hy + JUG.ballR * (i === 2 ? 1.35 : 0.4), held: true }; });
  if (st.phase === 'enter') {
    const e = st.t;
    if (e < ENTER.walk) {                                     // (in from the SIDE: off the pane's left edge, the bag in his hand, his steps shortening)
      const k = ease(e / (ENTER.walk - 0.7)), turnK = ease((e - (ENTER.walk - 0.7)) / 0.7);
      X = lerp(x0 - 0.24 * cw, bagHome + 0.06 * cw, k); face = 1 - 0.99 * turnK;
      pose = turnK > 0 ? mix(walk(e, 1 - 0.7 * k, { lean: 0.01 }), stand(), turnK) : walk(e, 1 - 0.7 * k, { lean: 0.01 });
      bag = { x: null, held: 0, on: true };
    } else if (e < ENTER.crouch[1] + 0.6) {                   // (the bag down, crouched over it: the balls out one by one)
      const into = e - ENTER.walk, d = ease(into / 0.7) * (1 - ease((e - ENTER.crouch[1]) / 0.6)); X = bagHome + 0.06 * cw;
      const dig = Math.max(0, Math.sin((e - ENTER.crouch[0]) * Math.PI * 0.75));
      pose = front({ dy: 0.22 * d, hands: [[0.1, 0.42 - 0.3 * d + 0.12 * dig * d], [-0.1, 0.42 - 0.3 * d]], handsDrop: 0.3 });
      bag = { x: bagHome, on: true, open: e > ENTER.crouch[0] };
      const nOut = e < ENTER.crouch[0] ? 0 : Math.min(3, Math.floor((e - ENTER.crouch[0]) / 1.35));
      if (nOut) balls = heldBalls([pose.arms.lead[1], pose.arms.rear[1]], [0, 1, 2], nOut);
    } else {                                                  // (up + a few steps to his spot, the balls in his hands)
      const k = ease((e - ENTER.crouch[1] - 0.6) / (T.enter - ENTER.crouch[1] - 0.6)); X = lerp(bagHome + 0.06 * cw, spot, k);
      const hands = [[0.12, 0.46], [-0.12, 0.46]];
      pose = front({ step: e * 2, stride: 0.035 * Math.sin(Math.PI * k), hands }); balls = heldBalls(hands, [0, 1, 2]);
    }
  } else if (st.phase === 'work') {
    const S = segAt(plan, st.work), seg = S ? S.seg : null, e = S ? S.e : 0;
    kind = seg ? seg.kind : 'cascade';
    if (seg && (PAT[seg.kind] || seg.kind === 'high' || seg.kind === 'spin' || seg.kind === 'pause')) {
      const J = PAT[seg.kind] ? ballsAt(seg, e) : trickAt(seg, e);
      look = J.look || 0; turn = J.turn || 0;
      // (a breath in the pause: his shoulders rise + fall; in a run a gentle sway with the rhythm)
      const br = seg.kind === 'pause' && mo ? 0.008 * Math.sin(e * TAU / 1.6) : 0, sway = mo && PAT[seg.kind] ? 0.006 * Math.sin(e * TAU / (2 * (seg.b || 0.33))) : 0;
      pose = front({ hands: J.hands, toss: J.toss, knee: J.knee, bob: br, headX: sway, look });
      balls = J.balls.map(B => ({ id: B.id, x: B.x, y: B.y, air: !!B.air, floor: !!B.floor, rest: !!B.rest, spin: B.spin || 0 }));
      air = balls.filter(B => B.air).length;
      if (seg.drop) { const fb = balls.find(B => B.floor); if (fb) floorBall = fb; }
    } else if (seg && seg.kind === 'fetch') {
      // (to the ball on the floor: a turn, the walk, crouch + pick up, up, back, the turn to the front)
      const tx = Math.max(x0 + 0.08 * cw, Math.min(x0 + 0.92 * cw, spot + seg.dx * H)), sgn = Math.sign(seg.dx) || 1, held = [[0.16, 0.55], [0.13, 0.53]];
      const toK = ease((e - 0.4) / 2.0), backK = ease((e - 4.1) / 2.0), cr = ease((e - 2.5) / 0.5) * (1 - ease((e - 3.6) / 0.5));
      X = lerp(spot, tx - sgn * 0.14 * H, toK - backK * toK);
      face = e < 0.4 ? sgn * ease(e / 0.4) : e < 3.9 ? sgn : e < 4.2 ? sgn * (1 - 2 * ease((e - 3.9) / 0.3)) : e < 6.2 ? -sgn : -sgn * (1 - ease((e - 6.2) / 0.3));
      const walking = (e > 0.4 && e < 2.5) || (e > 4.1 && e < 6.2);
      pose = cr > 0.01 ? crouch(cr, { reach: 1 }) : walking ? walk(e, 0.9, { carry: 'low' }) : stand();
      if (cr <= 0.01 && !walking) pose.arms = { rear: [[0.08, 0.6], held[0]], lead: [[0.1, 0.6], held[1]] };
      const picked = e > 3.25;
      if (!picked) floorBall = { id: seg.dropped, x: tx, y: Y0 + JUG.ballR * H, floor: true, rest: true, abs: true };
      bag = { x: bagHome, on: true };
      balls = 'profile';
    } else if (seg && seg.kind === 'rest') {
      kind = 'rest';
      const d = seg.d, toStool = PX(JUG.stool) + 0.015 * cw, bagX = bagHome;
      const a = [0.4, 3.0, 6.0, 8.4, 10.0], b = [d - 12, d - 10, d - 6.5, d - 4.2, d - 0.5];
      let p;
      if (e < a[0]) { face = -ease(e / a[0]); X = spot; pose = stand(); }
      else if (e < a[1]) { face = -1; X = lerp(spot, bagX + 0.08 * cw, ease((e - a[0]) / (a[1] - a[0]))); pose = walk(e, 0.9); }
      else if (e < a[2]) { face = -1; X = bagX + 0.08 * cw; p = ease((e - a[1]) / 0.6) * (1 - ease((e - a[2] + 0.6) / 0.6)); pose = crouch(p); bag.open = true; if (e > a[2] - 1.4) bottle = 'hand'; }
      else if (e < a[3]) { face = -1; X = lerp(bagX + 0.08 * cw, toStool, ease((e - a[2]) / (a[3] - a[2]))); pose = walk(e, 0.8); bottle = 'hand'; }
      else if (e < b[0]) {
        // (on the stool, turned to us a little: sits, the wipe of his brow, a drink now + then, his head down a moment)
        X = toStool; face = 0.55;   // (turned into the room — the lamp's rim on him)
        const sitK = ease((e - a[3]) / (a[4] - a[3])), rel = e - a[4];
        let P1 = sit(0.27, { lean: 0.03 });
        const wipe = rel > 4 && rel < 7 ? Math.sin(Math.PI * (rel - 4) / 3) : 0, sip = [20, 62, 115].some(s0 => rel > s0 && rel < s0 + 4) ? Math.sin(Math.PI * ((rel - [20, 62, 115].find(s0 => rel > s0 && rel < s0 + 4)) / 4)) : 0;
        if (wipe > 0) P1.arms.lead = [lp(P1.arms.lead[0], [0.1, 0.58], wipe), lp(P1.arms.lead[1], [0.04, 0.68 + 0.02 * Math.sin(rel * 6)], wipe)];
        if (sip > 0) { P1.arms.rear = [lp(P1.arms.rear[0], [0.1, 0.52], sip), lp(P1.arms.rear[1], [0.1, 0.66], sip)]; P1.head = add(P1.head, -0.01 * sip, 0.008 * sip); }
        P1.head = add(P1.head, 0, mo ? 0.004 * Math.sin(e * TAU / 3.2) : 0);
        pose = mix(stand(), P1, sitK); bottle = sip > 0.05 ? 'mouth' : 'knee';
      }
      else if (e < b[1]) { face = 1; X = lerp(toStool, bagX + 0.08 * cw, ease((e - b[0]) / (b[1] - b[0]))); pose = mix(sit(0.27), walk(e, 0.8), ease((e - b[0]) / 0.8)); bottle = 'hand'; }
      else if (e < b[2]) { face = -1; X = bagX + 0.08 * cw; p = ease((e - b[1]) / 0.6) * (1 - ease((e - b[2] + 0.6) / 0.6)); pose = crouch(p); bag.open = true; bottle = e < b[1] + 1.4 ? 'hand' : null; }
      else if (e < b[3]) { face = 1; X = lerp(bagX + 0.08 * cw, spot, ease((e - b[2]) / (b[3] - b[2]))); pose = walk(e, 0.9, { carry: 'low' }); balls = 'profile'; }
      else { face = 1 - ease((e - b[3]) / (b[4] - b[3] + 0.5)); X = spot; pose = stand(); pose.arms = { rear: [[0.08, 0.6], [0.16, 0.55]], lead: [[0.1, 0.6], [0.13, 0.53]] }; balls = 'profile'; }
      if (balls !== 'profile') balls = [];
    }
  } else if (st.phase === 'exit') {
    const e = st.t;
    if (e < EXIT.flourish) {                                  // (all three caught: the arms up in a V, the balls high, then a small bow)
      const up = ease(e / 0.6) * (1 - ease((e - 1.8) / 0.6)), bow = Math.sin(Math.PI * clamp01((e - 2.0) / 1.4));
      const hands = [[lerp(0.12, 0.3, up), lerp(0.46, 0.98, up)], [lerp(-0.12, -0.3, up), lerp(0.46, 0.98, up)]];
      pose = front({ hands, bob: -0.05 * bow, look: up }); if (bow > 0) pose.head = add(pose.head, 0, -0.03 * bow);
      balls = heldBalls(hands, [0, 1, 2]);
    } else if (e < EXIT.stand) {                              // (to the bag, crouched, the balls in, up with the bag)
      const k = ease((e - EXIT.flourish) / (EXIT.toBag - EXIT.flourish)); X = lerp(spot, bagHome + 0.08 * cw, k); face = -Math.min(1, k * 3);
      if (e < EXIT.toBag) { pose = walk(e, 0.9, { carry: 'low' }); balls = 'profile'; }
      else { const p = ease((e - EXIT.toBag) / 0.6) * (1 - ease((e - EXIT.stand + 0.6) / 0.6)); pose = crouch(p); bag.open = e < EXIT.pack[1]; }
    } else if (e < EXIT.reach) {                              // (with the bag, he comes to the glass: nearer = bigger, out of the room's frame)
      const k = ease((e - EXIT.stand) / (EXIT.toWindow - EXIT.stand)); face = 0; glassK = k;
      X = lerp(bagHome + 0.08 * cw, PX(0.56), k); scale = lerp(1, 1.55, k);
      pose = front({ step: e * 1.7, stride: 0.05 * (1 - k), hands: [[0.24, 0.42], [-0.13, 0.44]] });
      bag = { x: null, held: 1, on: true };
    } else { glassK = 2; X = PX(0.56); scale = 1.55; face = 0; pose = front({ hands: [[0.24, 0.42], [-0.13, 0.44]] }); bag = { x: null, held: 1, on: true }; }
  }
  // ---- the bag on the floor (or in his hand)
  if (bag.on && bag.x != null) { const bw = 0.2 * cw, bh = 0.075 * ch; c.fillStyle = 'rgb(34,20,14)'; c.beginPath(); c.moveTo(bag.x - bw / 2, floorV - 0.005); c.lineTo(bag.x + bw / 2, floorV - 0.005); c.lineTo(bag.x + bw * 0.42, floorV + bh); c.quadraticCurveTo(bag.x, floorV + bh * (bag.open ? 1.4 : 1.25), bag.x - bw * 0.42, floorV + bh); c.closePath(); c.fill(); c.strokeStyle = 'rgba(120,236,190,0.4)'; c.lineWidth = 0.008 * ch; c.beginPath(); c.moveTo(bag.x - bw * 0.42, floorV + bh); c.quadraticCurveTo(bag.x, floorV + bh * 1.28, bag.x + bw * 0.42, floorV + bh); c.stroke(); }
  // ---- THE LAMP's furniture (in front of the wall, behind him): the table, the base, the shade glowing from inside
  // ---- HIM (with the lamp's warm rim: the light is on his right — our right)
  const Y = floorV, toward = 1;
  const drawMan = () => {
    if (!pose) return;
    const Hs = H * scale, Yf = Y - (scale - 1) * 1.28 * H;   // (nearer the glass: bigger, his feet below the pane — his head ends where the pull's close-up has it)
    const rimA = 0.85 * (1 - 0.6 * Math.min(1, glassK));
    const draw = () => {
      if (face === 0 || Math.abs(face) < 0.01) {   // (square to us — the spin squeezes him through its turn)
        const sq = turn > 0 ? Math.max(0.28, Math.abs(Math.cos(turn * TAU))) : 1;
        c.save(); c.translate(X, 0); c.scale(sq, 1); c.translate(-X, 0);
        rimmed(c, X, Yf, Hs, 1, pose, { front: true, hat: 'cap', rim: AMBER, rimA, toward });
        c.restore();
      } else rimmed(c, X, Yf, Hs, face, pose, { hat: 'cap', rim: AMBER, rimA: rimA * (face > 0 ? 1 : 0.6), toward });
    };
    const withBag = () => { draw(); if (bag.held != null && bag.held !== false && pose) { const hn = pose.arms[bag.held === 1 ? 'rear' : 'lead'][1], fx = face === 0 ? 1 : Math.sign(face), hx = X + fx * hn[0] * Hs, hy = Yf + hn[1] * Hs, bw = 0.17 * Hs, bh = 0.11 * Hs; c.fillStyle = 'rgb(30,18,12)'; c.beginPath(); c.moveTo(hx - bw / 2, hy - bh * 0.25); c.lineTo(hx + bw / 2, hy - bh * 0.25); c.lineTo(hx + bw * 0.42, hy - bh * 1.25); c.lineTo(hx - bw * 0.42, hy - bh * 1.25); c.closePath(); c.fill(); c.strokeStyle = 'rgb(30,18,12)'; c.lineWidth = 0.02 * Hs; c.beginPath(); c.moveTo(hx - bw * 0.2, hy - bh * 0.25); c.lineTo(hx, hy + 0.01 * Hs); c.lineTo(hx + bw * 0.2, hy - bh * 0.25); c.stroke(); } };
    c.save(); c.globalAlpha *= manA;
    if (depth > 0 && E.deep) E.deep(depth, withBag); else withBag();
    c.restore();
  };
  // ---- THE BALLS: glossy, lit by the lamp (the highlight on its side, brighter near it), the brightest things in the room
  const drawBall = (B, prof) => {
    const r = JUG.ballR * H * scale, px = B.abs ? B.x : X + B.x * H * scale, py = B.abs ? B.y : Y + B.y * H * scale - (scale - 1) * 1.28 * H;
    // NEON EVERY NIGHT (the owner, Nov 2): a glowing ball + its halo; a party night pulses them on the beat
    const col = NEON[B.id], k = party ? 0.75 + 0.45 * beatK : 0.8;
    c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, px, py, r * (party ? 5.5 + 2 * beatK : 4.6), col, 0.22 * k); glowAt(c, px, py, r * 2.2, col, 0.55 * k); c.restore();
    const g = c.createRadialGradient(px - r * 0.3, py + r * 0.3, 0, px, py, r); g.addColorStop(0, rgb(mixc(col, [255, 255, 255], 0.65))); g.addColorStop(0.5, rgb(col)); g.addColorStop(1, rgb(mixc(col, [0, 0, 0], 0.25)));
    c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
  };
  // (the party's colours on the room: each neon ball lights the wall round it)
  if (Array.isArray(balls)) { c.save(); c.globalCompositeOperation = 'lighter'; for (const B of balls) { const px = X + B.x * H, py = Y + B.y * H; glowAt(c, px, py, 0.55 * ch, NEON[B.id], party ? 0.1 + 0.08 * beatK : 0.05); } c.restore(); }
  if (floorBall) drawBall({ ...floorBall });
  if (glassK < 2) drawMan();
  else if (st.pull != null && st.pull < 0.14 && pose) { c.save(); c.globalAlpha = 1 - ease(st.pull / 0.12); drawMan(); c.restore(); }
  if (Array.isArray(balls)) for (const B of balls) drawBall(B);
  else if (balls === 'profile' && pose) {   // (in profile the balls ride his hands)
    const fx = Math.sign(face) || 1, sq = Math.max(0.35, Math.abs(face)), P = p => [X + fx * sq * p[0] * H, Y + p[1] * H];
    const a1 = P(pose.arms.rear[1]), a2 = P(pose.arms.lead[1]);
    drawBall({ id: 0, abs: true, x: a1[0], y: a1[1] + JUG.ballR * H * 0.5 }); drawBall({ id: 1, abs: true, x: a2[0] + 0.01, y: a2[1] + JUG.ballR * H * 0.5 });
    if (!(st.phase === 'work' && segAt(plan, st.work).seg.kind === 'fetch' && segAt(plan, st.work).e < 3.25)) drawBall({ id: 2, abs: true, x: a2[0] - 0.01, y: a2[1] + JUG.ballR * H * 1.5 });
  }
  if (bottle && pose) { const fx = Math.sign(face) || 1, sq = Math.max(0.35, Math.abs(face)), P = p => [X + fx * sq * p[0] * H, Y + p[1] * H], hp = P(pose.arms.rear[1]); c.save(); c.translate(hp[0], hp[1]); c.rotate(bottle === 'mouth' ? -fx * 1.9 : 0); c.fillStyle = 'rgb(22,30,18)'; c.fillRect(-0.016 * H, 0, 0.032 * H, 0.1 * H); c.fillRect(-0.008 * H, 0.1 * H, 0.016 * H, 0.04 * H); c.fillStyle = 'rgba(150,240,200,0.5)'; c.fillRect(0.004 * H, 0.015 * H, 0.006 * H, 0.06 * H); c.restore(); }
  // ---- the lamp's shade + bulb glow LAST (in front of the room's air: the light itself)
  { const sw = 0.24 * cw, sh = 0.13 * ch, sx = lamp[0], sy = lamp[1];
    c.fillStyle = rgb([255, 196, 120]); c.beginPath(); c.moveTo(sx - sw * 0.36, sy + sh * 0.5); c.lineTo(sx + sw * 0.36, sy + sh * 0.5); c.lineTo(sx + sw * 0.5, sy - sh * 0.5); c.lineTo(sx - sw * 0.5, sy - sh * 0.5); c.closePath(); c.fill();
    const g = c.createLinearGradient(sx - sw * 0.5, 0, sx + sw * 0.5, 0); g.addColorStop(0, 'rgba(120,60,20,0.35)'); g.addColorStop(0.5, 'rgba(255,240,200,0.2)'); g.addColorStop(1, 'rgba(120,60,20,0.35)'); c.fillStyle = g; c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, sx, sy - sh * 0.55, 0.32 * ch, [255, 170, 80], 0.4); glowAt(c, sx, sy, 0.16 * ch, [255, 210, 150], 0.45); c.restore(); }
  // ---- at the glass: the pull (drawn after the shade — windows.js runs E.front)
  if (st.phase === 'exit' && st.pull > 0) E.front = () => pullAtGlass(E, st.pull, hemAt(G, st.shade || 0), { x: 0.56, hat: 'cap', rim: AMBER, rimA: 0.5 });
  return { phase: st.phase, kind, air, x: +((X - x0) / cw).toFixed(3), drop: !!floorBall, party };
}
