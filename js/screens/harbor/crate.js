// CITY 2.0 — WINDOWS: THE CRATE GUY's ROOM (core/harbor-crate.js: what he does; core/harbor-scenes.js: when) — the bottom-right window,
// 9:45 pm → midnight. THE WINDOW STANDARD: ONE BARE BULB on a cord, a cold white light, SWINGING a little — its pool on the wall + every
// shadow sway with it; a crate set down BUMPS it (it swings more, settling). The room bare plaster + a plank floor; THE PILE of crates in the
// left corner (big blocks, three columns, growing to head height over his shift); HIM mostly a silhouette with the bulb's cold rim. Nothing
// smaller than a crate or a bottle held up against the bulb (PHONE FIRST: the window is ~40 pt).
import { CRATE, PILE_MAX, cratePlan, jobAt, pileAt, carryPart, bulbAt, crateBumps, slotOf, ENTER, EXIT } from '../../core/harbor-crate.js';
import { SCENE_TIMING } from '../../core/harbor-scenes.js';
import { man, rimmed, walk, crouch, sit, stand, mix, ease, lerp, lp, add, rgb, mixc, clamp01, pullAtGlass, hemAt, glowAt } from './scene-kit.js';

const TAU = Math.PI * 2;
const COLD = [214, 228, 255];

/** carrying a crate with both arms in front (leaning back from the weight); lift 0..1: the crate raised toward a slot (up: its height) */
function carryPose(s, stride, lift = 0, up = 0.5) {
  const P = stride > 0 ? walk(s, stride, { lean: -0.035 }) : stand({ lean: -0.03 });
  const hy = lerp(0.58, up, lift), hx = lerp(0.23, 0.27, lift);
  P.arms = { rear: [[0.1, lerp(0.62, Math.max(0.62, up - 0.12), lift)], [hx, hy]], lead: [[0.12, lerp(0.6, Math.max(0.6, up - 0.14), lift)], [hx + 0.02, hy - 0.01]] };
  P.sh = add(P.sh, -0.015, 0); P.head = add(P.head, -0.02, 0);
  return P;
}

/**
 * paint his room — E: the window life's (c, G, k, t, mo, deep), st: core/harbor-scenes.js#sceneAt, o: { key, seed }
 * → { phase, job, pile, bulb (its swing, rad), x }
 */
export function crateRoom(E, st, o = {}) {
  const { c, G, t, mo } = E, cw = G.cw, ch = G.ch, x0 = G.g0, y0 = G.h0, y1 = G.h1;
  const floorV = y0 + 0.12 * ch, H = 0.66 * ch, T = SCENE_TIMING.crate;
  const plan = cratePlan(o.key || '', st.workLen, o.seed || 1924), PX = u => x0 + u * cw;
  const work = st.phase === 'work' ? st.work : st.phase === 'exit' ? st.workLen : 0;
  // THE BULB: from a cord above the pane, a little right of the middle; its swing (a crate set down bumps it)
  const sw = bulbAt(mo ? st.sec : 0, crateBumps(plan, T)), cordTop = [PX(0.56), y1 + 0.22 * ch], cl = 0.44 * ch, phi = mo ? sw.a : 0;
  const bulb = [cordTop[0] + Math.sin(phi) * cl, cordTop[1] - Math.cos(phi) * cl];
  // ---- the room: cold bare plaster lit from the bulb (its pool moves with the swing), the corners dark, a plank floor
  { const g = c.createRadialGradient(bulb[0], bulb[1], 0.02 * ch, bulb[0], bulb[1] - 0.05 * ch, 1.15 * ch);
    g.addColorStop(0, rgb([196, 206, 220])); g.addColorStop(0.2, rgb([124, 132, 146])); g.addColorStop(0.55, rgb([56, 60, 70])); g.addColorStop(1, rgb([16, 18, 24]));
    c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, ch + 0.1); }
  { const g = c.createLinearGradient(0, y0, 0, floorV + 0.02 * ch); g.addColorStop(0, rgb([16, 15, 16])); g.addColorStop(1, rgb([58, 54, 54]));
    c.fillStyle = g; c.fillRect(x0 - 0.05, y0 - 0.05, cw + 0.1, floorV + 0.02 * ch - y0 + 0.05);
    c.fillStyle = 'rgba(220,230,255,0.13)'; c.beginPath(); c.ellipse(bulb[0], floorV - 0.025 * ch, 0.34 * cw, 0.045 * ch, 0, 0, TAU); c.fill(); }
  for (const s of [-1, 1]) { const ex = s < 0 ? x0 : x0 + cw, g = c.createLinearGradient(ex, 0, ex - s * 0.2 * cw, 0); g.addColorStop(0, 'rgba(6,7,10,0.68)'); g.addColorStop(1, 'rgba(6,7,10,0)'); c.fillStyle = g; c.fillRect(s < 0 ? x0 - 0.05 : x0 + cw * 0.8, y0 - 0.05, cw * 0.2 + 0.05, ch + 0.1); }
  // (the side door at the right: a dark gap in the wall's edge he comes + goes through)
  c.fillStyle = 'rgba(8,8,10,0.82)'; c.fillRect(PX(0.93), floorV, 0.09 * cw, 0.72 * H);
  // ---- the shadows' throw: away from the bulb, on the back wall (a soft dark copy, nudged + a little bigger)
  const throwOf = (x, y) => [(x - bulb[0]) * 0.16, (y - bulb[1]) * 0.07];
  // ---- what he's doing: his place, facing, pose, what he holds
  let lidOpen = 0; const lidK = v => { lidOpen = v; };
  let X = PX(CRATE.home), face = -1, pose = stand(), scale = 1, job = st.phase, held = null, bottle = null, ember = 0, lid = -1, pile = pileAt(plan, work), glassK = 0, carry = null;
  const colX = n => PX(CRATE.cols[slotOf(n).col]), slotY = n => floorV + slotOf(n).row * CRATE.crate[1] * H;
  const besideCol = n => colX(n) + 0.24 * H;
  if (st.phase === 'up') { X = PX(1.2); pile = 0; }
  else if (st.phase === 'enter') {
    // (he BACKS IN through the side with the first crate: facing the door he came from, stepping backward, then sets it down on the corner)
    const e = st.t; pile = 0;
    if (e < ENTER.back) { const k = ease(e / ENTER.back); X = lerp(PX(1.1), besideCol(0), k); face = 1; pose = carryPose(-e, 0.75 * (1 - 0.4 * k)); carry = { x: X + 0.25 * H, y: floorV + 0.52 * H, face: 1 }; }
    else if (e < ENTER.down + 0.6) { const k = ease((e - ENTER.back) / 0.7); X = besideCol(0); face = lerp(1, -1, k) || -1; const dn = ease((e - ENTER.back - 0.4) / (ENTER.down - ENTER.back - 0.4)); pose = mix(carryPose(0, 0), crouch(0.55), dn); carry = e < ENTER.down ? { x: lerp(X + 0.25 * H * face, colX(0), dn), y: lerp(floorV + 0.52 * H, floorV, dn), face } : null; if (e >= ENTER.down) pile = 1; }
    else { pile = 1; X = lerp(besideCol(0), PX(CRATE.home), ease((e - ENTER.down - 0.6) / (T.enter - ENTER.down - 0.6))); face = 1; pose = mix(crouch(0.55), walk(e, 0.8), ease((e - ENTER.down - 0.6) / 0.8)); }
  } else if (st.phase === 'work') {
    const J = jobAt(plan, st.work), j = J ? J.job : null, e = J ? J.e : 0;
    job = j ? j.kind : 'stand';
    if (j && j.kind === 'carry') {
      const cp = carryPart(j, e), tgt = besideCol(j.n);
      if (cp.part === 'out') { face = 1; X = lerp(PX(CRATE.home), PX(CRATE.side), ease(cp.u)); pose = walk(e, 0.9); }
      else if (cp.part === 'gone') { X = PX(1.4); pose = null; }
      else if (cp.part === 'back') { face = -1; const k = ease(cp.u); X = lerp(PX(CRATE.side), tgt, k); pose = carryPose(e, 0.8 * (1 - 0.3 * k)); carry = { x: X - 0.25 * H, y: floorV + 0.52 * H, face: -1 }; }
      else {
        // (the lift onto its slot: raised to the slot's height (arms high for the top rows), set down — the bulb bumps — hands off)
        face = -1; X = tgt; const sy = slotY(j.n), up = (sy - floorV) / H + CRATE.crate[1] * 0.5, k = ease(cp.u / 0.62), off = ease((cp.u - 0.62) / 0.38);
        pose = mix(carryPose(0, 0, k, Math.max(0.32, up)), stand(), off);
        if (cp.u < 0.62) carry = { x: lerp(X - 0.25 * H, colX(j.n), k), y: lerp(floorV + 0.52 * H, sy, k), face: -1 };
      }
    } else if (j && (j.kind === 'pry' || j.kind === 'bottle')) {
      // (at the top crate of the shortest column he can reach: THE CROWBAR — two big heaves, the lid pops; then ONE BOTTLE held up to the bulb)
      const n = Math.max(0, pile - 1), tx = besideCol(n), top = slotY(n) + CRATE.crate[1] * H;
      X = tx; face = -1;
      if (j.kind === 'pry') {
        const heave = Math.max(0, Math.sin(Math.PI * clamp01((e - 1.2) / 2.6) * 2)) * (e < 4 ? 1 : 0) + Math.max(0, Math.sin(Math.PI * clamp01((e - 4.2) / 2.2))) * 1.2;
        pose = stand({ lean: 0.06 + 0.05 * heave });
        const hy = (top - floorV) / H + 0.05 + 0.18 * heave;
        pose.arms = { rear: [[0.1, 0.6], [0.25, Math.min(0.85, hy + 0.04)]], lead: [[0.14, 0.62], [0.28, Math.min(0.85, hy)]] };
        held = { kind: 'bar', a: -0.9 + 0.5 * heave }; lid = n; lidK(clamp01((e - 6.2) / 0.8));
      } else {
        const up = Math.sin(Math.PI * clamp01((e - 1.6) / 4.2)), reach = ease(e / 1.2) * (1 - ease((e - 6) / 1));
        pose = stand({ lean: 0.02 - 0.03 * up });
        const bx = 0.2 + 0.05 * up, by = lerp(lerp(0.55, (top - floorV) / H + 0.02, reach * (1 - up)), 1.08, up);
        pose.arms = { rear: [[0.06, 0.6], [0.08, 0.45]], lead: [[0.12 + 0.03 * up, lerp(0.62, 0.88, up)], [bx, by]] };
        pose.head = add(pose.head, 0.01 * up, 0.012 * up);
        bottle = { at: 'lead', up }; lid = n; lidK(1);
      }
    } else if (j && j.kind === 'wipe') {
      const w = Math.sin(Math.PI * clamp01(e / JOB_LEN.wipe));
      pose = stand({ lean: 0.01 }); pose.arms.lead = [lp(pose.arms.lead[0], [0.12, 0.66], w), lp(pose.arms.lead[1], [0.06, 0.82 + 0.015 * Math.sin(e * 7)], w)]; face = 0.7;
    } else if (j && j.kind === 'listen') {
      // (he stops, goes to the window, stands still — his head cocked toward the street — then back to work)
      const go = ease(e / 3), back = ease((e - 9.5) / 3.2), k = go * (1 - back);
      X = lerp(PX(CRATE.home), PX(CRATE.window), k); scale = 1 + 0.32 * k; face = e < 3 ? 0.4 : e > 9.5 ? 1 : 0.15;
      pose = e < 3 || e > 9.5 ? walk(e, 0.7 * (1 - Math.abs(k - 0.5) * 0)) : stand({ headX: 0.012, headY: -0.004 });
    } else if (j && j.kind === 'lean') {
      // (his back against the pile, the arms crossed; a breath)
      const n = Math.max(0, Math.min(pile, CRATE.full[0]) - 1), tx = colX(0) + 0.2 * H, k = ease(e / 2) * (1 - ease((e - j.d + 2) / 2));
      X = lerp(PX(CRATE.home), tx, k); face = k > 0.5 ? 1 : -1;
      const P = stand({ lean: -0.04, bob: mo ? 0.004 * Math.sin(e * 1.6) : 0 });
      P.arms = { rear: [[0.08, 0.58], [0.1, 0.66]], lead: [[0.1, 0.58], [0.0, 0.66]] }; P.legs.front = [[0.07, 0.25], [0.13, 0.012]];
      pose = k > 0.05 && k < 0.95 ? walk(e, 0.8) : P; void n;
    } else if (j && j.kind === 'count') {
      const pt = Math.sin(Math.PI * clamp01(e / JOB_LEN.count));
      face = -1; pose = stand(); pose.arms.lead = [lp(pose.arms.lead[0], [0.16, 0.7], pt), lp(pose.arms.lead[1], [0.32, lerp(0.45, 0.62 + 0.04 * Math.sin(e * 3), pt)], pt)];
    } else if (j && j.kind === 'swig') {
      const s = Math.sin(Math.PI * clamp01(e / JOB_LEN.swig));
      face = 0.8; pose = stand({ lean: -0.02 * s }); pose.arms.lead = [lp(pose.arms.lead[0], [0.1, 0.66], s), lp(pose.arms.lead[1], [0.1, 0.86], s)]; pose.head = add(pose.head, -0.01 * s, 0.006 * s);
      bottle = { at: 'lead', up: 0, drink: s };
    } else {
      // (standing: a breath, a look round, a roll of the shoulders)
      face = Math.sin(e * 0.6) > 0 ? -1 : 0.6; pose = stand({ bob: mo ? 0.004 * Math.sin(e * 1.4) : 0 });
    }
  } else if (st.phase === 'exit') {
    const e = st.t, front = CRATE.cols.length - 1, seatX = PX(CRATE.cols[front]) + 0.05 * cw, seatH = Math.min(CRATE.full[front], Math.max(1, pile - CRATE.full[0] - CRATE.full[1])) * CRATE.crate[1];
    if (e < EXIT.toPile) { face = -1; X = lerp(PX(CRATE.home), seatX + 0.1 * H, ease(e / EXIT.toPile)); pose = walk(e, 0.8); }
    else if (e < EXIT.up) {
      // (on his pile: the cigarette lit, three slow draws — its ember flaring each time)
      X = seatX; face = 0.7;
      const sk = ease((e - EXIT.toPile) / (EXIT.sit - EXIT.toPile)), P = sit(seatH, { lean: 0.03 });
      const draw = EXIT.smoke.map(s0 => Math.sin(Math.PI * clamp01((e - s0) / 2.6))).reduce((a, b) => Math.max(a, b), 0), lit = e > EXIT.light ? 1 : 0;
      const hand = Math.max(draw, e > EXIT.sit && e < EXIT.light + 0.8 ? Math.sin(Math.PI * clamp01((e - EXIT.sit) / (EXIT.light + 0.8 - EXIT.sit))) : 0);
      P.arms.lead = [lp(P.arms.lead[0], [0.1, seatH + 0.25], hand), lp(P.arms.lead[1], [0.1, seatH + 0.4], hand)];
      pose = mix(stand(), P, sk); ember = lit * (0.35 + 0.65 * draw); held = { kind: 'cig' };
    } else if (e < EXIT.toWindow) {
      const k = ease((e - EXIT.up) / (EXIT.toWindow - EXIT.up)); glassK = k; face = 0.15; X = lerp(seatX, PX(0.58), k); scale = lerp(1, 1.5, k); pose = walk(e, 0.7 * (1 - k)); ember = 0.3; held = { kind: 'cig' };
    } else { glassK = 2; X = PX(0.58); scale = 1.5; face = 0.15; }
  }
  // ---- THE PILE: its crates (+ their shadows on the wall first), the one coming in in his arms
  const cW = CRATE.crate[0] * H, cH = CRATE.crate[1] * H;
  const crateAt = (cx, cy, shadow, open = 0) => {
    if (shadow) { const [dx, dy] = throwOf(cx, cy + cH * 0.5); c.fillStyle = 'rgba(6,6,10,0.32)'; c.fillRect(cx - cW * 0.52 + dx, cy + dy + cH * 0.06, cW * 1.04, cH * 1.02); return; }
    c.fillStyle = 'rgb(46,34,24)'; c.fillRect(cx - cW / 2, cy, cW, cH);
    c.fillStyle = 'rgba(20,14,10,0.9)'; for (const f of [0.33, 0.66]) c.fillRect(cx - cW / 2, cy + cH * f - 0.006 * ch, cW, 0.012 * ch);
    c.fillRect(cx - cW / 2, cy, 0.016 * ch, cH); c.fillRect(cx + cW / 2 - 0.016 * ch, cy, 0.016 * ch, cH);
    // (the bulb's cold light on its top edge + the side toward it)
    const lit = clamp01(1.2 - Math.hypot(cx - bulb[0], cy + cH - bulb[1]) / ch);
    c.fillStyle = rgb(mixc([120, 100, 80], COLD, 0.4), 0.55 * lit); c.fillRect(cx - cW / 2, cy + cH - 0.014 * ch, cW, 0.014 * ch);
    const sd = Math.sign(bulb[0] - cx); c.fillStyle = rgb(COLD, 0.16 * lit); c.fillRect(sd > 0 ? cx + cW / 2 - 0.03 * ch : cx - cW / 2, cy, 0.03 * ch, cH);
    if (open > 0) { c.save(); c.translate(cx + cW / 2, cy + cH); c.rotate(0.9 * open); c.fillStyle = 'rgb(54,40,28)'; c.fillRect(-cW, -0.012 * ch, cW, 0.024 * ch); c.restore(); c.fillStyle = 'rgb(12,10,8)'; c.fillRect(cx - cW * 0.44, cy + cH - 0.02 * ch, cW * 0.88, 0.02 * ch * open); }
  };
  for (const pass of [true, false]) {
    for (let n = 0; n < Math.min(pile, PILE_MAX); n++) crateAt(colX(n), slotY(n), pass, lid === n ? lidOpen : 0);
    if (carry) crateAt(carry.x, carry.y - cH * 0.45, pass);
  }
  // ---- HIM (his shadow on the wall first, swaying with the bulb; then his silhouette with the bulb's cold rim)
  const Hs = H * scale, Yf = floorV - (scale - 1) * 1.25 * H;
  const draw = () => {
    if (!pose) return;
    const [dx, dy] = throwOf(X, Yf + Hs * 0.6);
    c.save(); c.translate(dx, dy); c.globalAlpha *= 0.3; man(c, X, Yf, Hs * 1.04, face, pose, 'rgb(6,6,10)', { hat: 'cap' }); c.restore();
    rimmed(c, X, Yf, Hs, face, pose, { hat: 'cap', rim: COLD, rimA: 0.62 * (1 - 0.5 * Math.min(1, glassK)), toward: Math.sign(bulb[0] - X) || 1, col: 'rgb(9,9,12)' });
    // (what's in his hands: the crowbar, the bottle up against the bulb, the cigarette)
    const fx = Math.sign(face) || 1, sq = Math.max(0.35, Math.abs(face)), P = p => [X + fx * sq * p[0] * Hs, Yf + p[1] * Hs];
    if (held && held.kind === 'bar') { const h = P(pose.arms.lead[1]); c.save(); c.translate(h[0], h[1]); c.rotate(fx * held.a); c.strokeStyle = 'rgb(14,14,16)'; c.lineWidth = 0.035 * Hs; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0.06 * Hs); c.lineTo(fx * 0.04 * Hs, -0.3 * Hs); c.stroke(); c.restore(); }
    if (bottle) { const h = P(pose.arms[bottle.at][1]); c.save(); c.translate(h[0], h[1]); c.rotate(bottle.drink ? -fx * 2.2 * bottle.drink : 0); c.fillStyle = 'rgb(14,22,14)'; c.fillRect(-0.025 * Hs, 0, 0.05 * Hs, 0.13 * Hs); c.fillRect(-0.011 * Hs, 0.13 * Hs, 0.022 * Hs, 0.06 * Hs);
      if (bottle.up > 0.2) { c.fillStyle = `rgba(150,220,150,${(0.45 * bottle.up).toFixed(3)})`; c.fillRect(-0.016 * Hs, 0.02 * Hs, 0.012 * Hs, 0.09 * Hs); } c.restore(); }
    if (held && held.kind === 'cig' && ember > 0) { const h = P(pose.arms.lead[1]); c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, h[0] + fx * 0.03 * Hs, h[1] + 0.02 * Hs, 0.07 * Hs * (0.6 + ember), [255, 120, 40], 0.9 * ember); c.restore(); c.fillStyle = `rgba(255,190,110,${ember.toFixed(3)})`; c.beginPath(); c.arc(h[0] + fx * 0.03 * Hs, h[1] + 0.02 * Hs, 0.014 * Hs, 0, TAU); c.fill(); }
  };
  if (glassK < 2) draw(); else if (st.pull != null && st.pull < 0.14) { c.save(); c.globalAlpha = 1 - ease(st.pull / 0.12); draw(); c.restore(); }
  // ---- THE BULB: its cord, the glass, its light (in front of everything: the light itself)
  c.strokeStyle = 'rgb(16,16,18)'; c.lineWidth = 0.012 * ch; c.beginPath(); c.moveTo(cordTop[0], cordTop[1]); c.lineTo(bulb[0], bulb[1]); c.stroke();
  c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, bulb[0], bulb[1] - 0.03 * ch, 0.24 * ch, [200, 215, 255], 0.42); glowAt(c, bulb[0], bulb[1] - 0.03 * ch, 0.09 * ch, [240, 246, 255], 0.9); c.restore();
  c.fillStyle = 'rgb(250,252,255)'; c.beginPath(); c.ellipse(bulb[0], bulb[1] - 0.035 * ch, 0.03 * ch, 0.04 * ch, phi, 0, TAU); c.fill();
  if (st.phase === 'exit' && st.pull > 0) E.front = () => pullAtGlass(E, st.pull, hemAt(G, st.shade || 0), { x: 0.58, hat: 'cap', rim: COLD, rimA: 0.45 });
  return { phase: st.phase, job, pile, bulb: +phi.toFixed(3), x: +((X - x0) / cw).toFixed(3) };
}
const JOB_LEN = { wipe: 3.4, count: 5, swig: 4.5 };
