// CITY 2.0 — THE HARBOR, PART 8b1 (Group 3): THE WITNESSES (plan.md "WITNESSES FLEE THE ABDUCTION", the owner, Oct 25). PURE — the
// people's reaction to a legendary night, planned on the clock like everything else (every phone the same, joined mid-way).
//   THE UFO     as the saucer comes in (its approach, 0 → 5.5 s) everyone on the promenade STOPS and LOOKS UP — a couple POINT — each a
//               beat apart; when the BEAM opens (5.5 s) they FLEE IN FEAR: a real run, scattering to the nearest way out (a screen edge,
//               the side door, across the road from the kerb), the one nearest the bench DUCKS BEHIND IT first, crouches a few seconds,
//               then bolts; a dog walker is dragged off by the dog (they run together, the dog in front). Nobody stands calmly watching.
//               The promenade stays EMPTY for a while after the saucer leaves (EMPTY), then the ordinary crowd drifts back in.
//   THE TR-3B   as the city goes dark (3.4 s → ~10 s) people STOP and STARE UP, a few POINT; some (`indoors`) hurry in at the nearest door;
//               when the power comes back (~41 s) the rest go on their way out of here (a quieter promenade for a minute).
// HOW: folkAt hands every visit on the promenade at the moment they notice to `reactVisit` — its legs up to that moment are kept, the
// rest replaced by the reaction (on the people's map, routed); visits that would START during the event (+ the empty tail) don't come.
import { FOLK, planVisit, visitAt, doorLeg, DOOR } from './harbor-people.js';
import { rngFrom, hashString } from './rng.js';

const PI = Math.PI;
/** the numbers (s from the legend's start): noticing (spread), the flight, the run's pace (u / s), the crouch behind the bench, the empty
 *  promenade after; the TR-3B's stare + the share going indoors */
export const WITNESS = Object.freeze({
  ufo: { notice: [0.8, 3.2], flee: 5.7, react: [0.15, 1.1], run: 3.5, hide: [3.2, 4.6], empty: 240, len: 30, point: 0.35 },
  tr3b: { notice: [3.6, 7.5], back: 41, after: [0.5, 3], indoors: 0.3, len: 50, empty: 60, point: 0.3 },
});
/** is t inside the legend's people window (its own length + the empty tail)? */
export function witnessWindow(lg, t) {
  if (!lg) return false;
  const W = WITNESS[lg.kind]; if (!W) return false;
  return t >= lg.t0 && t < lg.t0 + W.len + W.empty;
}
/** a visit that would START during the event or its empty tail doesn't come (the promenade stays empty) */
export function suppressed(lg, v) {
  const W = lg && WITNESS[lg.kind]; if (!W) return false;
  return v.t0 >= lg.t0 - 0.5 && v.t0 < lg.t0 + W.len + W.empty;
}

/** the nearest way out for someone running from (x, z): a screen edge (by side), the side door (when close), across the road (from the kerb) */
function wayOut(M, p, r) {
  const side = M.nodes.sideDoor, dDoor = Math.hypot(p.x - side.x, p.z - side.z);
  if (dDoor < 4.2 && r() < 0.8) return { door: 'side' };
  if (p.z > FOLK.zMax - 0.8) return { road: p.x < (M.cw.x0 + M.cw.x1) / 2 ? 'farLeft' : 'farRight' };
  const ex = p.x < 2 ? M.exits.left : M.exits.right, e = ex.reduce((a, b) => (Math.abs(b.z - p.z) < Math.abs(a.z - p.z) ? b : a));
  return { edge: e };
}

/**
 * A visit's reaction to a legendary (PURE): v (a planned visit on the promenade), lg { kind: 'ufo' | 'tr3b', t0 }, M (the people's map),
 * ctx { hide: the visit chosen to duck behind the bench } → a NEW visit (the same id + members, legs replaced from the moment they notice) or
 * null (not on the promenade then — it simply doesn't come).
 */
export function reactVisit(v, lg, M, ctx = {}) {
  const W = WITNESS[lg.kind], r = rngFrom(hashString(`witness|${lg.t0}|${v.id}`));
  const tn = lg.t0 + W.notice[0] + r() * (W.notice[1] - W.notice[0]);
  const s = visitAt(v, tn);
  if (!s || s.door || s.a < 0.999 || s.z > FOLK.roadZ + 0.1 || s.y > 0.3) return null;     // (in a doorway, fading, on the road, up a ladder: gone with the others)
  const keep = v.legs.filter(lg2 => lg2.t1 <= tn).map(lg2 => ({ ...lg2 }));
  // (the leg they were in, cut at the moment they notice — a walk ends where they stand)
  const cur = v.legs.find(lg2 => tn >= lg2.t0 && tn < lg2.t1);
  if (cur && cur.k === 'walk') keep.push({ ...cur, pts: cutPts(cur.pts, (tn - cur.t0) * cur.v), t1: tn });
  else if (cur && cur.k === 'pose') keep.push({ ...cur, t1: tn });
  const at = { x: s.x, z: s.z }, look = -PI / 2;          // (they turn to us + look up: the pose carries the sky)
  const legs = [...keep], push = lg2 => legs.push(lg2);
  let now = tn;
  if (lg.kind === 'ufo') {
    // STOP + LOOK UP (a couple point) until the beam opens, then a startled beat
    const tf = lg.t0 + W.flee + W.react[0] + r() * (W.react[1] - W.react[0]);
    push({ k: 'pose', pose: r() < W.point ? 'point' : 'watch', x: at.x, z: at.z, t0: now, t1: tf, hd: look });
    now = tf;
    let p = at;
    const run = (to, vv = W.run) => { const vis = planVisit({ look: 'walker', gait: 'jog', goals: [{ at: to }] }, now, M, { r, start: p }); if (!vis) return; const k = vv / Math.max(0.1, vis.v), t0 = now; for (const l2 of vis.legs) push({ ...l2, t0: t0 + (l2.t0 - t0) / k, t1: t0 + (l2.t1 - t0) / k, v: l2.v * k, run: true }); now = t0 + (vis.t1 - t0) / k; p = { x: vis.end.x, z: vis.end.z }; };
    // the one nearest the bench ducks behind it first, crouches, then bolts
    if (ctx.hide === v.id) { const b = M.nodes.bench; run({ x: b.x - 0.4, z: b.z + 0.75 }); push({ k: 'pose', pose: 'garden', x: p.x, z: p.z, t0: now, t1: now + W.hide[0] + r() * (W.hide[1] - W.hide[0]), hd: -PI / 2 }); now = legs[legs.length - 1].t1; }
    const out = wayOut(M, p, r);
    if (out.door) { const d = M.nodes.sideDoor, zs = M.face - DOOR.stepSide; run({ x: d.x, z: zs - 0.6 }); push({ k: 'walk', pts: [p, { x: d.x, z: zs }], t0: now, t1: now + Math.hypot(d.x - p.x, zs - p.z) / W.run + 0.05, v: W.run, run: true }); now = legs[legs.length - 1].t1; const dl = doorLeg('side', 'in', d.x, now, W.run, M.face); push(dl); now = dl.t1; }
    else if (out.road) { const fz = FOLK.farZ, e = M.exits[out.road]; push({ k: 'walk', pts: [p, { x: p.x + (r() - 0.5), z: fz }], t0: now, t1: now + (fz - p.z) / W.run, v: W.run, run: true }); now = legs[legs.length - 1].t1; p = { x: legs[legs.length - 1].pts[1].x, z: fz }; push({ k: 'walk', pts: [p, { x: e.x, z: e.z }], t0: now, t1: now + Math.abs(e.x - p.x) / W.run, v: W.run, run: true }); now = legs[legs.length - 1].t1; }
    else run(out.edge);
    // a ROUTINE (the doorman, the vendor, a worker) comes back once the empty spell is over — in from where they fled — and picks up its day
    if (v.routine) {
      const back = lg.t0 + W.len + W.empty + r() * 50;
      if (out.door) { const d = M.nodes.sideDoor, dl = doorLeg('side', 'out', d.x, back, FOLK.speed.walk, M.face); legs.push(dl); now = dl.t1; p = { x: dl.x1, z: dl.z1 }; }
      else { now = back; }
      now = resume(v, legs, p, now, r) || now;
    }
  } else {
    // THE TR-3B: stop + stare up as the lights die; some hurry indoors; the rest go on their way once the power's back
    const indoors = !v.routine && r() < W.indoors;
    if (v.routine) {
      const tb = lg.t0 + W.back + W.after[0] + r() * (W.after[1] - W.after[0]);
      push({ k: 'pose', pose: r() < W.point ? 'point' : 'watch', x: at.x, z: at.z, t0: now, t1: tb, hd: look }); now = tb;
      now = resume(v, legs, at, now, r) || now;
    } else if (indoors) {
      const d = M.nodes.sideDoor, zs = M.face - DOOR.stepSide, p = at, tStart = now + 0.6;
      push({ k: 'pose', pose: 'watch', x: at.x, z: at.z, t0: now, t1: tStart, hd: look }); now = tStart;
      const vis = planVisit({ look: 'walker', gait: 'brisk', goals: [{ at: { x: d.x, z: zs - DOOR.approach } }, { at: { x: d.x, z: zs } }] }, now, M, { r, start: p });
      if (vis) { for (const l2 of vis.legs) push(l2); now = vis.t1; const dl = doorLeg('side', 'in', d.x, now, FOLK.speed.brisk, M.face); push(dl); now = dl.t1; }
    } else {
      const tb = lg.t0 + W.back + W.after[0] + r() * (W.after[1] - W.after[0]);
      push({ k: 'pose', pose: r() < W.point ? 'point' : 'watch', x: at.x, z: at.z, t0: now, t1: tb, hd: look }); now = tb;
      const out = wayOut(M, at, r), to = out.edge || M.exits[at.x < 2 ? 'left' : 'right'][0];
      const vis = planVisit({ look: 'walker', gait: 'walk', goals: [{ at: { x: to.x, z: to.z } }] }, now, M, { r, start: at });
      if (vis) { for (const l2 of vis.legs) push(l2); now = vis.t1; }
    }
  }
  return { ...v, legs, t1: now, tEnd: now + Math.max(0, ...v.members.map(m => m.lag || 0)), witness: lg.kind };
}
/** walk from p back into the visit's own itinerary (its lead where it will be when they get there) and carry on with its legs from then
 *  → the new end time, or 0 when it can't (in a doorway / up a ladder then: they simply don't come back) */
function resume(v, legs, p, now, r) {
  const vv = FOLK.speed.walk;
  let ta = now + 2, q = null;
  for (let i = 0; i < 4; i++) { q = visitAt(v, ta); if (!q) return 0; ta = now + Math.hypot(q.x - p.x, q.z - p.z) / vv + 0.2; }
  q = visitAt(v, ta);
  if (!q || q.door || (q.y || 0) > 0.3 || q.a < 0.999) return 0;
  const d = Math.hypot(q.x - p.x, q.z - p.z);
  if (d > 0.05) legs.push({ k: 'walk', pts: [{ ...p }, { x: q.x, z: q.z }], t0: now, t1: ta, v: d / Math.max(0.1, ta - now) });
  for (const lg of v.legs) {
    if (lg.t1 <= ta) continue;
    if (lg.t0 >= ta) { legs.push({ ...lg }); continue; }
    if (lg.k === 'walk') legs.push({ ...lg, pts: fromPts(lg.pts, (ta - lg.t0) * lg.v), t0: ta });
    else if (lg.k === 'pose' || lg.k === 'gap') legs.push({ ...lg, t0: ta, x: lg.x1 != null ? q.x : lg.x, z: lg.z1 != null ? q.z : lg.z });
    else return 0;
  }
  return v.t1;
}
const fromPts = (pts, d) => {
  let c = 0;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b.x - a.x, b.z - a.z); if (c + l >= d) { const u = l ? (d - c) / l : 0; return [{ x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u }, ...pts.slice(i)]; } c += l; }
  return [pts[pts.length - 1], pts[pts.length - 1]];
};
const cutPts = (pts, d) => {
  const out = [pts[0]]; let c = 0;
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b.x - a.x, b.z - a.z); if (c + l >= d) { const u = l ? (d - c) / l : 0; out.push({ x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u }); return out; } out.push(b); c += l; }
  return out;
};
/** who ducks behind the bench: the visit whose lead stands nearest the bench when they notice (within ~7 units) */
export function hiderOf(vs, lg, M) {
  const b = M.nodes.bench; let best = null, bd = 7;
  for (const v of vs) { const s = visitAt(v, lg.t0 + 2); if (!s || s.door) continue; const d = Math.hypot(s.x - b.x, s.z - b.z); if (d < bd) { bd = d; best = v.id; } }
  return best;
}
