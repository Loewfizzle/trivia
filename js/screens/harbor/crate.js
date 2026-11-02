// CITY 2.0 — WINDOWS: THE CRATE GUY's ROOM (core/harbor-crate.js: what he does; core/harbor-scenes.js: when) — the bottom-right window,
// 9:45 pm → midnight. THE WINDOW STANDARD: ONE BARE BULB on a cord, a cold white light, SWINGING a little — its pool on the wall + every
// shadow sway with it; a crate set down BUMPS it (it swings more, settling). The room bare plaster + a plank floor; THE PILE of crates in the
// left corner (big blocks, three columns, growing to head height over his shift); HIM mostly a silhouette with the bulb's cold rim. Nothing
// smaller than a crate or a bottle held up against the bulb (PHONE FIRST: the window is ~40 pt).
// THE REWORK (the owner's WINDOWS review, Nov 2 — "has promise" but jittery, snappy + very thin): a STOCKY dock worker (scene-kit.js#man
// build 1.45: broad shoulders, heavy arms, a thick neck, a cap) and ONE CONTINUOUS MOTION — every job starts from where + how the last one
// ended (jobState → a walk between spots, a 0.7-s blend of the pose, turns eased through his front, never a flip), a walk slows to a stop
// before he lifts, and the crate's WEIGHT shows: the knees soft + the back leaning under it, a dip to gather before a high lift, a bend to set
// one low, the slow rise, the straighten after.
import { CRATE, PILE_MAX, cratePlan, jobAt, pileAt, carryPart, bulbAt, crateBumps, slotOf, ENTER, EXIT } from '../../core/harbor-crate.js';
import { SCENE_TIMING } from '../../core/harbor-scenes.js';
import { man, rimmed, walk, crouch, sit, stand, mix, ease, lerp, lp, add, rgb, mixc, clamp01, pullAtGlass, hemAt, glowAt } from './scene-kit.js';

const TAU = Math.PI * 2;
const COLD = [214, 228, 255];
const BUILD = 1.45;                 // (THE REWORK: a stocky dock worker)
const BLEND = 0.7;                  // (s: every job's pose blends in from the last one's end)

/** carrying a crate with both arms in front, the WEIGHT in his posture: the back leaning away from it, the knees soft, a heavier bob */
function carryPose(s, stride) {
  const P = stride > 0.01 ? walk(s * 0.85, stride, { lean: -0.055 }) : stand({ lean: -0.05 });
  P.hip = add(P.hip, 0, -0.025); P.sh = add(P.sh, -0.02, -0.02); P.head = add(P.head, -0.025, -0.02);
  if (stride > 0.01) { const d = Math.abs(Math.sin(s * 0.85 * TAU * 0.9)) * 0.012 * stride; P.hip = add(P.hip, 0, -d); P.sh = add(P.sh, 0, -d); P.head = add(P.head, 0, -d); }
  P.arms = { rear: [[0.12, 0.6], [0.24, 0.55]], lead: [[0.14, 0.58], [0.26, 0.54]] };
  return P;
}
/** setting a crate on its slot (u 0..1 through the lift; up: the slot's middle × his height) → { pose, k (the crate's rise 0..1) } —
 *  a high slot: a dip to gather (the knees bend), then the slow push up, the arms high; a low slot: he bends to set it down; then off + straighten */
function liftPose(u, up) {
  const k = ease(clamp01(u / 0.62)), off = ease(clamp01((u - 0.62) / 0.38)), high = clamp01((up - 0.55) / 0.4), low = clamp01((0.5 - up) / 0.4);
  const dip = high * Math.sin(Math.PI * clamp01(u / 0.3)) * 0.06, bend = low * Math.sin(Math.PI * clamp01(u / 0.8)) * 0.16;
  const P = stand({ lean: lerp(-0.05, -0.02 + 0.05 * low, k) * (1 - off), dy: -(dip + bend) });
  P.hip = add(P.hip, 0, -0.025 * (1 - off)); P.sh = add(P.sh, lerp(-0.02, 0.04 * low, k) * (1 - off), -0.02 * (1 - off)); P.head = add(P.head, -0.025 * (1 - off), -0.02 * (1 - off));
  const hy = lerp(0.55, Math.max(0.3, up), k) - (dip + bend) * 0.5, hx = lerp(0.24, 0.3, k);
  const carryArms = { rear: [[0.12, lerp(0.6, Math.max(0.6, hy - 0.1), k)], [hx, hy]], lead: [[0.14, lerp(0.58, Math.max(0.58, hy - 0.12), k)], [hx + 0.02, hy - 0.01]] };
  const S = stand();
  P.arms = { rear: [lp(carryArms.rear[0], S.arms.rear[0], off), lp(carryArms.rear[1], S.arms.rear[1], off)], lead: [lp(carryArms.lead[0], S.arms.lead[0], off), lp(carryArms.lead[1], S.arms.lead[1], off)] };
  return { pose: P, k };
}
/** an eased turn: from facing a to b over [t0, t0 + d] (through his front — man() narrows him there) */
const turnTo = (a, b, e, t0, d = 0.6) => { const dd = Math.max(d, 0.62 * Math.abs(b - a)); return lerp(a, b, ease((e - t0) / dd)); };

/**
 * paint his room — E: the window life's (c, G, k, t, mo, deep), st: core/harbor-scenes.js#sceneAt, o: { key, seed }
 * → { phase, job, pile, bulb (its swing, rad), x, face }
 */
export function crateRoom(E, st, o = {}) {
  const { c, G, t, mo } = E, cw = G.cw, ch = G.ch, x0 = G.g0, y0 = G.h0, y1 = G.h1;
  const floorV = y0 + 0.12 * ch, H = 0.68 * ch, T = SCENE_TIMING.crate;
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
  const colX = n => PX(CRATE.cols[slotOf(n).col]), slotY = n => floorV + slotOf(n).row * CRATE.crate[1] * H;
  const besideCol = n => colX(n) + 0.26 * H, HOME = PX(CRATE.home);
  // THE JOB's OWN MOTION at its local time e, begun where he stood (from) + the way he faced (ff) → { X, face, pose, carry?, held?, bottle?,
  // lid?, lidOpen?, scale? }. The small jobs (a wipe, a count, a swig, a look round) happen where he stands; the lean + the listen walk out +
  // back to where he was; the pry + the bottle need the pile (a walk first); a carry walks out from wherever he is.
  const spotOf = j => (j.kind === 'pry' || j.kind === 'bottle') ? besideCol(j.at || 0) : null;
  function jobState(j, e, from, ff) {
    const R = { X: from, face: ff, pose: stand(), scale: 1 };
    if (!j) return R;
    const there = (tx, go, back) => {   // (out to tx + back to from: the facing along the walk, a turn at each end)
      const dOut = Math.sign(tx - from) || ff, k = go * (1 - back), moving = Math.abs(tx - from) > 0.02 * cw;
      R.X = lerp(from, tx, k);
      return { k, dOut, moving };
    };
    if (j.kind === 'carry') {
      const cp = carryPart(j, e), tgt = besideCol(j.n);
      if (cp.part === 'out') { R.face = turnTo(ff, 1, e, 0, 0.5); R.X = lerp(from, PX(CRATE.side), ease(cp.u)); R.pose = walk(e, 0.9 * Math.min(1, cp.u * 4)); }
      else if (cp.part === 'gone') { R.X = PX(1.4); R.pose = null; }
      else if (cp.part === 'back') { const k = ease(cp.u); R.face = -1; R.X = lerp(PX(CRATE.side), tgt, k); R.pose = carryPose(e, 0.75 * (1 - ease((cp.u - 0.55) / 0.45))); R.carry = { x: R.X - 0.27 * H, y: floorV + 0.5 * H }; }
      else {
        R.face = -1; R.X = tgt; const sy = slotY(j.n), up = (sy - floorV) / H + CRATE.crate[1] * 0.5, L = liftPose(cp.u, up);
        R.pose = L.pose; if (cp.u < 0.62) R.carry = { x: lerp(R.X - 0.27 * H, colX(j.n), L.k), y: lerp(floorV + 0.5 * H, sy, L.k) };
      }
    } else if (j.kind === 'pry' || j.kind === 'bottle') {
      // (at the top crate of the column: THE CROWBAR — two big heaves, the lid pops; then ONE BOTTLE held up to the bulb)
      const n = j.at || 0, top = slotY(n) + CRATE.crate[1] * H;
      R.X = besideCol(n); R.face = -1;
      if (j.kind === 'pry') {
        const h1 = Math.sin(Math.PI * clamp01((e - 1.4) / 2.6)), h2 = Math.sin(Math.PI * clamp01((e - 4.2) / 2.8)) * 1.15, heave = ease(Math.max(h1, h2));
        R.pose = stand({ lean: 0.04 - 0.07 * heave, dy: -0.03 * (1 - heave) });
        const hy = (top - floorV) / H + 0.06 + 0.2 * heave, set = ease(e / 1.4) * (1 - ease((e - j.d + 1.3) / 1.3)), S = stand();
        R.pose.arms = { rear: [lp(S.arms.rear[0], [0.1, 0.6], set), lp(S.arms.rear[1], [0.25, Math.min(0.85, hy + 0.04)], set)], lead: [lp(S.arms.lead[0], [0.14, 0.62], set), lp(S.arms.lead[1], [0.28, Math.min(0.85, hy)], set)] };
        R.held = set > 0.2 ? { kind: 'bar', a: -0.9 + 0.5 * heave } : null; R.lid = n; R.lidOpen = clamp01((e - 6.8) / 0.8);
      } else {
        const up = ease(Math.sin(Math.PI * clamp01((e - 1.4) / 4.4))), reach = ease(e / 1.4) * (1 - ease((e - 5.6) / 1.3)), S = stand();
        R.pose = stand({ lean: 0.02 - 0.03 * up });
        const bx = 0.2 + 0.05 * up, by = lerp(lerp(0.55, (top - floorV) / H + 0.02, reach * (1 - up)), 1.06, up), a = Math.max(reach, up);
        R.pose.arms = { rear: S.arms.rear, lead: [lp(S.arms.lead[0], [0.12 + 0.03 * up, lerp(0.62, 0.88, up)], a), lp(S.arms.lead[1], [bx, by], a)] };
        R.pose.head = add(R.pose.head, 0.01 * up, 0.012 * up);
        R.bottle = a > 0.3 ? { at: 'lead', up } : null; R.lid = n; R.lidOpen = 1;
      }
    } else if (j.kind === 'wipe') {
      const w = ease(Math.sin(Math.PI * clamp01(e / j.d)));
      R.face = lerp(ff, ff * 0.55, w); R.pose = stand({ lean: 0.01 });
      R.pose.arms.lead = [lp(R.pose.arms.lead[0], [0.12, 0.68], w), lp(R.pose.arms.lead[1], [0.06, 0.84 + 0.012 * Math.sin(e * 6) * w], w)];
    } else if (j.kind === 'listen') {
      // (he stops, goes to the window, stands still — his head cocked toward the street — then back to where he was)
      const go = ease(e / 3.2), back = ease((e - j.d + 3.4) / 3.4), W = there(PX(CRATE.window), go, back), mv = W.moving ? Math.sin(Math.PI * clamp01(e / 3.2)) + Math.sin(Math.PI * clamp01((e - j.d + 3.4) / 3.4)) : 0;
      R.scale = 1 + 0.3 * W.k;
      R.face = e < j.d / 2 ? lerp(turnTo(ff, W.dOut, e, 0, 0.5), W.dOut * 0.8, ease((e - 2.6) / 1)) : lerp(turnTo(W.dOut * 0.8, -W.dOut, e, j.d - 3.6, 0.6), ff, ease((e - j.d + 1.5) / 1.5));   // (side-on at the glass, his ear to the street)
      R.pose = mix(stand({ headX: 0.012 * W.k, headY: -0.004 * W.k }), walk(e, 0.7), clamp01(mv));
    } else if (j.kind === 'lean') {
      // (to the pile, his back against it, the arms crossed, a breath; then back to where he was)
      const tx = colX(0) + 0.24 * H, go = ease(e / 2.4), back = ease((e - j.d + 2.4) / 2.4), W = there(tx, go, back), mv = W.moving ? Math.sin(Math.PI * clamp01(e / 2.4)) + Math.sin(Math.PI * clamp01((e - j.d + 2.4) / 2.4)) : 0;
      R.face = e < j.d / 2 ? turnTo(turnTo(ff, W.dOut, e, 0, 0.5), 1, e, 2.1, 0.9) : lerp(turnTo(1, -W.dOut, e, j.d - 2.6, 0.6), ff, ease((e - j.d + 1.5) / 1.5));
      const P = stand({ lean: -0.04, bob: mo ? 0.004 * Math.sin(e * 1.6) : 0 }), crossK = ease((e - 2.6) / 1.0) * (1 - ease((e - j.d + 3.0) / 0.8)), S = stand();
      P.arms = { rear: [lp(S.arms.rear[0], [0.08, 0.58], crossK), lp(S.arms.rear[1], [0.12, 0.66], crossK)], lead: [lp(S.arms.lead[0], [0.1, 0.58], crossK), lp(S.arms.lead[1], [0.0, 0.66], crossK)] };
      P.legs.front = [lp(P.legs.front[0], [0.07, 0.25], crossK), lp(P.legs.front[1], [0.13, 0.012], crossK)];
      R.pose = mix(P, walk(e, 0.8), clamp01(mv));
    } else if (j.kind === 'count') {
      const pt = ease(Math.sin(Math.PI * clamp01(e / j.d)));
      R.pose = stand(); R.pose.arms.lead = [lp(R.pose.arms.lead[0], [0.16, 0.7], pt), lp(R.pose.arms.lead[1], [0.32, lerp(0.45, 0.62 + 0.03 * Math.sin(e * 2.5), pt)], pt)];
    } else if (j.kind === 'swig') {
      const s = ease(Math.sin(Math.PI * clamp01(e / j.d)));
      R.face = lerp(ff, ff * 0.8, s); R.pose = stand({ lean: -0.02 * s });
      R.pose.arms.lead = [lp(R.pose.arms.lead[0], [0.1, 0.66], s), lp(R.pose.arms.lead[1], [0.1, 0.86], s)]; R.pose.head = add(R.pose.head, -0.01 * s, 0.006 * s);
      R.bottle = s > 0.05 ? { at: 'lead', up: 0, drink: s } : null;
    } else {
      // (standing: a breath, a slow look round over his shoulder + back)
      const look = ease(clamp01(0.5 - 0.5 * Math.cos(Math.PI * 2 * clamp01(e / Math.max(3, j.d)))));
      R.face = lerp(ff, -ff * 0.6, look); R.pose = stand({ bob: mo ? 0.004 * Math.sin(e * 1.4) : 0 });
    }
    return R;
  }
  // WHERE EACH JOB LEAVES HIM (+ his facing): worked out once along the plan — the next job starts there
  const ends = endsOf(plan, j => j.kind === 'carry' ? besideCol(j.n) : spotOf(j), besideCol(0));
  // THE WORK with every seam blended: the job's start state = the last job's end state, a walk to a new spot, a 0.7-s pose blend
  function workState(s) {
    const J = jobAt(plan, s), j = J ? J.job : null, e = J ? J.e : 0, i = J ? J.i : 0;
    const [fx, ff] = ends[i - 1] || [besideCol(0), -1], prev = i > 0 ? plan[i - 1] : null;
    const pe = prev ? jobState(prev, prev.d, ...(ends[i - 2] || [besideCol(0), -1])) : { X: fx, face: ff, pose: stand(), scale: 1 };
    if (!pe.pose) { pe.pose = stand(); pe.X = PX(CRATE.side); }
    const spot = j ? spotOf(j) : null;
    const dist = spot == null ? 0 : Math.abs(spot - pe.X) / cw, wd = dist > 0.03 ? Math.min(2.6, Math.max(1.2, dist * 5)) : 0;
    if (e < wd) {
      // (walking from where the last job left him to this one's spot: the turn, the steps, slowing to a stop)
      const k = ease(e / wd), dir = Math.sign(spot - pe.X) || -1, stride = 0.85 * Math.min(1, e / 0.35) * (1 - ease((e - wd + 0.55) / 0.55));
      return { X: lerp(pe.X, spot, k), face: turnTo(pe.face, dir, e, 0, 0.45), pose: mix(pe.pose, walk(e, stride), ease(e / 0.5)), scale: lerp(pe.scale || 1, 1, k) };
    }
    // (the job's own clock squeezed into what's left after the walk (≤ 1.4×): it still reaches its ending — the next job blends from there)
    const ej = wd > 0 ? (e - wd) * j.d / Math.max(0.5, j.d - wd) : e, R = jobState(j, ej, wd > 0 ? spot : fx, wd > 0 ? (Math.sign(spot - pe.X) || -1) : ff);
    if (R.pose && ej < BLEND) {
      const from = wd > 0 ? { X: spot, face: Math.sign(spot - pe.X) || -1, pose: walk(e, 0), scale: 1 } : pe, b = ease(ej / BLEND);
      R.pose = mix(from.pose, R.pose, b); R.face = lerp(from.face, R.face, b); R.scale = lerp(from.scale || 1, R.scale || 1, b);
      if (j.kind !== 'carry') R.X = lerp(from.X, R.X, b);
    }
    return R;
  }
  // ---- what he's doing now
  let X = HOME, face = -1, pose = stand(), scale = 1, job = st.phase, held = null, bottle = null, ember = 0, lid = -1, lidOpen = 0, pile = pileAt(plan, work), glassK = 0, carry = null;
  if (st.phase === 'up') { X = PX(1.2); pile = 0; pose = null; }
  else if (st.phase === 'enter') {
    // (he BACKS IN through the side with the first crate, stepping backward under its weight, sets it down on the corner, straightens, walks to his spot)
    const e = st.t; pile = 0;
    if (e < ENTER.back) { const k = ease(e / ENTER.back); X = lerp(PX(1.1), besideCol(0), k); face = 1; pose = carryPose(-e, 0.7 * (1 - ease((e / ENTER.back - 0.6) / 0.4))); carry = { x: X + 0.27 * H, y: floorV + 0.5 * H }; }
    else if (e < ENTER.up) {
      const u = (e - ENTER.back) / (ENTER.up - ENTER.back); X = besideCol(0); face = turnTo(1, -1, e, ENTER.back, 0.9);
      const L = liftPose(u, CRATE.crate[1] * 0.5); pose = L.pose; if (u < 0.62) carry = { x: lerp(X + 0.27 * H * face, colX(0), L.k), y: lerp(floorV + 0.5 * H, floorV, L.k) };
      if (u >= 0.62) pile = 1;
    } else { pile = 1; X = besideCol(0); face = -1; pose = stand({ bob: mo ? 0.004 * Math.sin(e * 1.6) : 0 }); }   // (a breath by his first crate — the first job walks him on from here)
  } else if (st.phase === 'work') {
    const J = jobAt(plan, st.work); job = J ? J.job.kind : 'stand';
    const R = workState(st.work);
    ({ X, face, pose } = R); scale = R.scale || 1; carry = R.carry || null; held = R.held || null; bottle = R.bottle || null;
    if (R.lid != null) { lid = R.lid; lidOpen = R.lidOpen || 0; }
  } else if (st.phase === 'exit') {
    const e = st.t, front = CRATE.cols.length - 1, seatX = PX(CRATE.cols[front]) + 0.05 * cw, seatH = Math.min(CRATE.full[front], Math.max(1, pile - CRATE.full[0] - CRATE.full[1])) * CRATE.crate[1];
    const last = workState(Math.max(0, st.workLen - 0.01)), from = last.pose ? last.X : HOME, lf = last.pose ? last.face : -1;
    if (e < EXIT.toPile) { face = turnTo(lf, -1, e, 0, 0.5); X = lerp(from, seatX + 0.1 * H, ease(e / EXIT.toPile)); pose = mix(last.pose || stand(), walk(e, 0.8 * (1 - ease((e - EXIT.toPile + 0.6) / 0.6))), ease(e / 0.5)); }
    else if (e < EXIT.up) {
      // (on his pile: the cigarette lit, three slow draws — its ember flaring each time)
      X = lerp(seatX + 0.1 * H, seatX, ease((e - EXIT.toPile) / 0.8)); face = turnTo(-1, 0.7, e, EXIT.toPile, 0.9);
      const sk = ease((e - EXIT.toPile) / (EXIT.sit - EXIT.toPile)), P = sit(seatH, { lean: 0.03 });
      const draw = EXIT.smoke.map(s0 => Math.sin(Math.PI * clamp01((e - s0) / 2.6))).reduce((a, b) => Math.max(a, b), 0), lit = e > EXIT.light ? 1 : 0;
      const hand = Math.max(draw, e > EXIT.sit && e < EXIT.light + 0.8 ? Math.sin(Math.PI * clamp01((e - EXIT.sit) / (EXIT.light + 0.8 - EXIT.sit))) : 0);
      P.arms.lead = [lp(P.arms.lead[0], [0.1, seatH + 0.25], hand), lp(P.arms.lead[1], [0.1, seatH + 0.4], hand)];
      const upK = ease((e - EXIT.up + 0.9) / 0.9);
      pose = mix(mix(stand(), P, sk), stand(), upK); ember = lit * (0.35 + 0.65 * draw); held = { kind: 'cig' };
    } else if (e < EXIT.toWindow) {
      const k = ease((e - EXIT.up) / (EXIT.toWindow - EXIT.up)); glassK = k; face = turnTo(0.7, 0.15, e, EXIT.up, 0.6); X = lerp(seatX, PX(0.58), k); scale = lerp(1, 1.5, k); pose = walk(e, 0.7 * Math.min(1, (e - EXIT.up) / 0.4) * (1 - k)); ember = 0.3; held = { kind: 'cig' };
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
    c.save(); c.translate(dx, dy); c.globalAlpha *= 0.3; man(c, X, Yf, Hs * 1.04, face, pose, 'rgb(6,6,10)', { hat: 'cap', build: BUILD, minW: 0.7 }); c.restore();
    rimmed(c, X, Yf, Hs, face, pose, { hat: 'cap', build: BUILD, minW: 0.7, rim: COLD, rimA: 0.62 * (1 - 0.5 * Math.min(1, glassK)), toward: Math.sign(bulb[0] - X) || 1, col: 'rgb(9,9,12)' });
    // (what's in his hands: the crowbar, the bottle up against the bulb, the cigarette)
    const fx = Math.sign(face) || 1, sq = Math.max(0.35, Math.abs(face)), P = p => [X + fx * sq * p[0] * Hs, Yf + p[1] * Hs];
    if (held && held.kind === 'bar') { const h = P(pose.arms.lead[1]); c.save(); c.translate(h[0], h[1]); c.rotate(fx * held.a); c.strokeStyle = 'rgb(14,14,16)'; c.lineWidth = 0.04 * Hs; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0.06 * Hs); c.lineTo(fx * 0.04 * Hs, -0.32 * Hs); c.stroke(); c.restore(); }
    if (bottle) { const h = P(pose.arms[bottle.at][1]); c.save(); c.translate(h[0], h[1]); c.rotate(bottle.drink ? -fx * 2.2 * bottle.drink : 0); c.fillStyle = 'rgb(14,22,14)'; c.fillRect(-0.028 * Hs, 0, 0.056 * Hs, 0.14 * Hs); c.fillRect(-0.012 * Hs, 0.14 * Hs, 0.024 * Hs, 0.06 * Hs);
      if (bottle.up > 0.2) { c.fillStyle = `rgba(150,220,150,${(0.5 * bottle.up).toFixed(3)})`; c.fillRect(-0.018 * Hs, 0.02 * Hs, 0.014 * Hs, 0.1 * Hs); } c.restore(); }
    if (held && held.kind === 'cig' && ember > 0) { const h = P(pose.arms.lead[1]); c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, h[0] + fx * 0.03 * Hs, h[1] + 0.02 * Hs, 0.07 * Hs * (0.6 + ember), [255, 120, 40], 0.9 * ember); c.restore(); c.fillStyle = `rgba(255,190,110,${ember.toFixed(3)})`; c.beginPath(); c.arc(h[0] + fx * 0.03 * Hs, h[1] + 0.02 * Hs, 0.014 * Hs, 0, TAU); c.fill(); }
  };
  if (glassK < 2) draw(); else if (st.pull != null && st.pull < 0.14) { c.save(); c.globalAlpha = 1 - ease(st.pull / 0.12); draw(); c.restore(); }
  // ---- THE BULB: its cord, the glass, its light (in front of everything: the light itself)
  c.strokeStyle = 'rgb(16,16,18)'; c.lineWidth = 0.012 * ch; c.beginPath(); c.moveTo(cordTop[0], cordTop[1]); c.lineTo(bulb[0], bulb[1]); c.stroke();
  c.save(); c.globalCompositeOperation = 'lighter'; glowAt(c, bulb[0], bulb[1] - 0.03 * ch, 0.24 * ch, [200, 215, 255], 0.42); glowAt(c, bulb[0], bulb[1] - 0.03 * ch, 0.09 * ch, [240, 246, 255], 0.9); c.restore();
  c.fillStyle = 'rgb(250,252,255)'; c.beginPath(); c.ellipse(bulb[0], bulb[1] - 0.035 * ch, 0.03 * ch, 0.04 * ch, phi, 0, TAU); c.fill();
  if (st.phase === 'exit' && st.pull > 0) E.front = () => pullAtGlass(E, st.pull, hemAt(G, st.shade || 0), { x: 0.58, hat: 'cap', rim: COLD, rimA: 0.45 });
  // (pts: his head, hip + both hands in the pane's units — tests/harbor-crate-motion.test.mjs measures the jitter from them)
  let pts = null;
  if (pose && glassK < 2) { const fx = Math.sign(face) || 1, sq = Math.max(0.35, Math.abs(face)), sl = Math.max(0.02, Math.abs(face)), Q = (p, k) => [(X + fx * k * p[0] * Hs - x0) / cw, (Yf + p[1] * Hs - y0) / ch]; pts = [Q(pose.head, sl), Q(pose.hip, sq), Q(pose.arms.lead[1], sl), Q(pose.arms.rear[1], sl), Q(pose.legs.front[1], sl), Q(pose.legs.back[1], sl)]; }
  return { phase: st.phase, job, pile, bulb: +phi.toFixed(3), x: +((X - x0) / cw).toFixed(3), face: +(+face).toFixed(3), pts };
}
/** where each job leaves him: [[x, facing], …] along the plan (a job with its own spot ends there facing the pile; the rest end where they
 *  began, facing as they began) — memoized per plan + room */
const endsMemo = new WeakMap();
function endsOf(plan, spot, x0) {
  const k = String(x0), m = endsMemo.get(plan); if (m && m.k === k) return m.v;
  const v = []; let x = x0, f = -1;
  for (const j of plan) { const s = spot(j); if (s != null) { x = s; f = -1; } v.push([x, f]); }
  endsMemo.set(plan, { k, v }); return v;
}
