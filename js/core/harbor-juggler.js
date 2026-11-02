// CITY 2.0 — WINDOWS: THE JUGGLER (the owner, Nov 1 8:57–9:06 am + 10:06 am — DECIDED; plan.md "OWNER'S NOTES — NOV 1 (late morning)").
// PURE (tests/harbor-juggler.test.mjs): every phone the same, a late page joins him mid-throw. His hours + window: THE CITY TIMETABLE's
// scene.juggler row (the bottom right, 6:30 → 9:30 pm); the shared shade-up / walk-in / exit: core/harbor-scenes.js#sceneAt.
//   HIS WORK      ~3 hours of SEGMENTS (seeded by the evening — a fresh routine whenever you glance): a SLOW start, CASCADES, the
//                 HALF-SHOWER (the right hand's throws high, the left's low + quick), FAST runs, UNDER THE LEG (the right's throws pass under
//                 his raised knee), THE HIGH THROW (one ball way up, he watches it, catches), THE SPIN (a high throw + a full turn under it),
//                 PAUSES (all three caught, a breath), now + then A DROP (the ball misses his hand: it thuds, bounces + rolls; he walks over,
//                 picks it up, walks back, restarts slow) and every ~25–35 min A REST (the balls in the bag, the stool: he sits, wipes his
//                 brow, drinks, then back).
//   THE BALLS     their flights are exact parabolas between his hands (a throw from the inner point → the other hand's outer point, the
//                 dwell scooping back in) — ballsAt(); three balls: red, cream, red.
//   THE SOUND     ONLY the drops (jugglerCues: the floor contact — juggler-drop with its bounces, or juggler-thud when it lands dead on the
//                 rug) + his bag set down; NO catch sounds.
import { hashString, rngFrom } from './rng.js';
import { SCENE_TIMING } from './harbor-scenes.js';

/** his room, in his own units (x 0 = the pane's left edge … 1 its right; 1 = his height for heights): where he stands, the stool + the bag at
 *  the left, the lamp at the right (low + to the side, its bulb at the arcs' apex height — the balls pass through its brightest light) */
export const JUG = Object.freeze({ spot: 0.53, stool: 0.14, bag: 0.3, lamp: 0.86, hand: 0.52, inner: 0.075, outer: 0.215, ballR: 0.074, floor: 0.0 });
/** the patterns: b (s between throws), apex (above the hands, × his height); 'shower' = the right hand's throws high, the left's low */
export const PAT = Object.freeze({
  slow: { b: 0.42, apex: 0.3 }, cascade: { b: 0.33, apex: 0.36 }, fast: { b: 0.25, apex: 0.25 }, shower: { b: 0.31, apex: 0.36, hi: 1.55, lo: 0.32 },
  under: { b: 0.36, apex: 0.36, under: true },
});
const TRICK_LEN = { high: 3.4, spin: 3.8, pause: 4.2 };
const FETCH = 6.5;         // (s: walk to the dropped ball, pick it up, walk back)
const REST = [130, 210];   // (s: the stool)
const sm = u => { const v = u < 0 ? 0 : u > 1 ? 1 : u; return v * v * (3 - 2 * v); };
const pickW = (list, u) => { let a = 0; for (const [k, w] of list) { a += w; if (u < a) return k; } return list[list.length - 1][0]; };

/**
 * HIS PLAN for the evening's work (len s of work, from his walk-in's end): [{ t0, d, kind, b, apex, lead (the hand holding two: 0 right / 1
 * left), ids ([ball in slot 0, 1, 2] — slot 0 + 2 start in the lead hand), throws (how many — the last lands before d), drop?: { k (the
 * throw that's missed), hit (s into the segment: its first floor contact), x (where it stops rolling), dead (lands on the rug: no bounce) } }].
 * Memoized per evening.
 */
const memo = new Map();
export function jugglerPlan(key, len, seed = 1924) {
  const mk = `${key}|${len}|${seed}`;
  if (memo.has(mk)) return memo.get(mk);
  const r = rngFrom(hashString(`juggler|${seed}|${key}`)), out = [];
  let t = 0, lead = 0, ids = [0, 1, 2], since = 0, nextRest = 1500 + r() * 600, restart = true, nextDrop = 150 + r() * 200;
  const push = s => { out.push(s); t += s.d; };
  while (t < len - 8) {
    // A REST on the stool every ~25–35 min (never in the last few minutes: he finishes on his feet)
    if (t >= nextRest && t < len - 300) {
      const d = REST[0] + r() * (REST[1] - REST[0]);
      push({ t0: t, d, kind: 'rest', lead, ids: [...ids] });
      nextRest = t + 1500 + r() * 600; restart = true; continue;
    }
    // the next run: a slow start after a rest / a drop, else a pattern (tricks now + then)
    const kind = restart ? 'slow' : pickW([['cascade', 0.34], ['shower', 0.16], ['fast', 0.14], ['under', 0.1], ['high', 0.09], ['spin', 0.05], ['pause', 0.12]], r());
    restart = false;
    if (TRICK_LEN[kind]) { push({ t0: t, d: TRICK_LEN[kind] + r() * 0.6, kind, lead, ids: [...ids] }); continue; }
    const P = PAT[kind], want = kind === 'slow' ? 9 + r() * 8 : 14 + r() * 30;
    // the number of throws: a multiple of 3 keeps the lead hand (2 balls) where it started; one more + the lead swaps (the next run mirrors)
    let n = Math.max(6, Math.round(want / P.b));
    const drop = t + want > nextDrop && kind !== 'slow';
    let seg = { t0: t, kind, b: P.b, apex: P.apex, lead, ids: [...ids], throws: n };
    if (drop) {
      const k = Math.max(4, Math.floor(n * (0.4 + 0.5 * r()))), dead = r() < 0.3;
      // (the missed ball: thrown at k·b, it reaches the catch at k·b + 2b, falls on past his hand to the floor, bounces + rolls out)
      // (it lands on the CATCHING hand's side — the thrower's opposite — and runs on outward; dx: its stop, his units from his spot)
      const hand = (k + lead) % 2, side = hand === 0 ? -1 : 1, fall = Math.sqrt(2 * (JUG.hand - JUG.ballR) / gOf(P)), hit = k * P.b + 2 * P.b + fall;
      const roll = dead ? 0.05 + 0.05 * r() : 0.2 + 0.25 * r(), dx = side * (JUG.outer + roll);
      seg = { ...seg, throws: k + 1, drop: { k, hit, dx, dead, hand }, d: hit + (dead ? 1.0 : 2.6) };
      // (after a drop: the two still in his hands + the one on the floor — the fetch, then a slow restart)
      push(seg);
      const held = heldAfter(seg);
      push({ t0: t, d: FETCH, kind: 'fetch', lead, ids: [...ids], dx, dropped: seg.ids[k % 3], held });
      lead = held.lead; ids = held.ids;
      nextDrop = t + 160 + r() * 260; restart = true; continue;
    }
    seg.d = n * P.b + 2 * P.b + 0.35;
    push(seg);
    const end = endState(seg); lead = end.lead; ids = end.ids;
    since += seg.d;
  }
  // (the last moment: whatever is running ends on time — his exit begins with all three caught)
  if (out.length) { const last = out[out.length - 1]; if (last.t0 + last.d > len) last.d = Math.max(1, len - last.t0); }
  memo.set(mk, out); if (memo.size > 6) memo.delete(memo.keys().next().value);
  return out;
}
/** the pattern's gravity (his units / s²): its apex reached in one beat-pair (a throw's flight = 2b) */
export const gOf = P => (8 * P.apex) / ((2 * P.b) ** 2);
/** after a run of `throws` throws the balls sit: throw k (ball slot k % 3) lands in the hand opposite its thrower — which hand holds two
 *  now, and which ball is in which slot (slot 0 + 2 = the lead hand) */
function endState(seg) {
  const where = [0, 1, 2].map(i => handOfSlotStart(i, seg.lead));
  for (let k = 0; k < seg.throws; k++) { const i = k % 3; where[i] = 1 - (k + seg.lead) % 2; }
  return regroup(where, seg.ids);
}
function heldAfter(seg) {
  const where = [0, 1, 2].map(i => handOfSlotStart(i, seg.lead));
  for (let k = 0; k < seg.drop.k; k++) { const i = k % 3; where[i] = 1 - (k + seg.lead) % 2; }
  const dropped = seg.drop.k % 3;
  // (he picks it up with the hand that held one: it goes back to the hand that ends up with two)
  const ones = [0, 1].map(h => where.filter((w, i) => i !== dropped && w === h).length);
  where[dropped] = ones[0] <= ones[1] ? 0 : 1;
  return regroup(where, seg.ids);
}
const handOfSlotStart = (i, lead) => (i === 1 ? 1 - lead : lead);
function regroup(where, ids) {
  const lead = where.filter(w => w === 0).length >= 2 ? 0 : 1, inLead = [0, 1, 2].filter(i => where[i] === lead), other = [0, 1, 2].find(i => where[i] !== lead);
  return { lead, ids: [ids[inLead[0]], ids[other], ids[inLead[1]]] };
}

/** the segment at s (s into his work) → { seg, i, e (s into it) } */
export function segAt(plan, s) {
  let lo = 0, hi = plan.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (plan[m].t0 <= s) lo = m; else hi = m - 1; }
  const seg = plan[lo];
  return seg ? { seg, i: lo, e: Math.max(0, s - seg.t0) } : null;
}

/** a hand's place now (his units, x across his own frame: + = his right as WE see it… the hand 0 'right' is on the viewer's left? — no:
 *  hand 0 is at +x, hand 1 at −x), for a scooping dwell: p 0 (caught, at the outer point) → 1 (released, at the inner point) */
export function dwellAt(hand, p, P) {
  const sx = hand === 0 ? 1 : -1, x = sx * (JUG.outer + (JUG.inner - JUG.outer) * sm(p)), y = JUG.hand - 0.05 * Math.sin(Math.PI * p);
  return [x, y];
}
/** a hand's place in its scoop cycle q (0 = the release at the inner point, 0.5 = the catch at the outer point, back in by 1) — under the leg:
 *  the right hand's release dips to the knee */
export function handCycle(hand, q, P) {
  const sx = hand === 0 ? 1 : -1;
  let x, y;
  if (q < 0.5) { const u = q / 0.5; x = sx * (JUG.inner + (JUG.outer - JUG.inner) * sm(u)); y = JUG.hand + 0.03 * Math.sin(Math.PI * u); }
  else { const u = (q - 0.5) / 0.5; x = sx * (JUG.outer + (JUG.inner - JUG.outer) * sm(u)); y = JUG.hand - 0.06 * Math.sin(Math.PI * u); }
  if (P && P.under && hand === 0) { const d = q < 0.18 ? 1 - q / 0.18 : q > 0.82 ? (q - 0.82) / 0.18 : 0; y -= 0.2 * sm(d); }
  return [x, y];
}
/** a ball in flight: thrown from `hand` at its inner point, to the other hand's outer point, f (0..1 through its flight) */
function flight(hand, f, P, hi = 1, low = 0) {
  const sx = hand === 0 ? 1 : -1, x0 = sx * JUG.inner, x1 = -sx * JUG.outer, y0 = JUG.hand - low, A = P.apex * hi;
  return [x0 + (x1 - x0) * f, y0 + (JUG.hand - y0) * f + 4 * A * f * (1 - f)];
}

/**
 * THE BALLS at e (s into a juggling segment) → [{ id, x, y (his units: 0 = between his feet / the floor), air (in flight), hand (held: 0 / 1 |
 * null), floor (on the floor / bouncing) }] + his hands' places { hands: [[x, y], [x, y]], throwing: [0..1, 0..1] (each hand's toss —
 * the forearm's lift), knee (the under-the-leg lift 0..1) }
 */
export function ballsAt(seg, e) {
  const P = PAT[seg.kind] || PAT.cascade, b = seg.b || P.b, lead = seg.lead, g = gOf(P);
  const balls = [], hands = [dwellAt(0, 0.5, P), dwellAt(1, 0.5, P)], toss = [0, 0];
  let knee = 0;
  const nThrows = seg.drop ? seg.drop.k + 1 : seg.throws;
  for (let i = 0; i < 3; i++) {
    // its throws: k = i, i+3, i+6 … < nThrows, at k·b from hand (k + lead) % 2
    let state = null, hand = handOfSlotStart(i, lead), caught = -9;
    for (let k = i; k < nThrows; k += 3) {
      const th = k * b, from = (k + lead) % 2;
      if (e < th) break;
      const dropped = seg.drop && k === seg.drop.k;
      if (e < th + 2 * b || dropped) {
        const f = (e - th) / (2 * b);
        if (dropped && f >= 1) { state = dropBall(seg, e - th - 2 * b, from, g); break; }
        const hi = seg.kind === 'shower' ? (from === 0 ? P.hi : P.lo) : 1, low = P.under && from === 0 ? 0.2 : 0;
        const [x, y] = flight(from, f, P, hi, low);
        state = { x, y, air: true, hand: null };
        if (P.under && from === 0 && f < 0.3) knee = Math.max(knee, Math.sin(Math.PI * Math.min(1, f / 0.3 + 0.15)));
        hand = 1 - from;
      } else { hand = 1 - from; caught = th + 2 * b; }
    }
    if (!state) state = { hand, air: false, caught };
    balls.push({ id: seg.ids[i], ...state });
  }
  // THE HANDS: each runs ONE continuous scoop, period 2b — released at the inner point on its throws, out to the outer point to catch
  // (halfway between its throws: the other hand's ball lands there), scooping down + back in; a held ball rides it. Before its first throw it
  // winds up (the last half of the cycle); after its last catch / throw it settles to rest, holding.
  for (const h of [0, 1]) {
    let first = Infinity, lastEv = -Infinity;
    for (let k = 0; k < nThrows; k++) { const th = k * b; if ((k + lead) % 2 === h) { first = Math.min(first, th); lastEv = Math.max(lastEv, th); } else if (!(seg.drop && k === seg.drop.k)) lastEv = Math.max(lastEv, th + 2 * b); }
    if (first === Infinity) { hands[h] = handCycle(h, 0.75, P); continue; }
    if (e >= first - b && e <= lastEv) {
      const q = ((((e - first) / (2 * b)) % 1) + 1) % 1;
      hands[h] = handCycle(h, q, P);
      toss[h] = q < 0.12 && e >= first ? Math.sin(Math.PI * q / 0.12) : 0;
    } else {
      // (at rest: holding, the hand a little in front of the hip — eased in from the cycle's last place over 0.4 s)
      const rest = handCycle(h, 0.75, P), from = handCycle(h, e < first ? 0.5 : ((((lastEv - first) / (2 * b)) % 1) + 1) % 1, P), k = e < first ? 1 : sm((e - lastEv) / 0.4);
      hands[h] = [from[0] + (rest[0] - from[0]) * k, from[1] + (rest[1] - from[1]) * k];
    }
  }
  // (two in one hand: the one caught first at the palm, the newer one settling on top of it over 0.22 s — never a snap)
  const held = [[], []];
  for (const B of balls) if (!B.air && !B.floor && B.hand != null) held[B.hand].push(B);
  for (const h of [0, 1]) { held[h].sort((p, q) => (p.caught ?? -9) - (q.caught ?? -9)); held[h].forEach((B, j) => placeHeld(B, j, held[h].length, hands[h], h, j ? sm((e - (B.caught ?? -9)) / 0.22) : 1)); }
  return { balls, hands, toss, knee };
}
/** the missed ball, u s after it passed his hand: falling, its bounces (each lower + shorter, drifting out), rolling to a stop */
function dropBall(seg, u, hand, g) {
  const D = seg.drop, x0 = (hand === 0 ? -1 : 1) * JUG.outer, fall = Math.sqrt(2 * (JUG.hand - JUG.ballR) / g), sx = D.dx;
  if (u < fall) return { x: x0 + (sx - x0) * 0.12 * (u / fall), y: JUG.hand - 0.5 * g * u * u, air: true, hand: null, floor: false };
  let t = u - fall, v = g * fall * (D.dead ? 0.12 : 0.5), xs = x0 + (sx - x0) * 0.12, n = 0;
  const shares = D.dead ? [1] : [0.42, 0.26, 0.17, 0.15];
  while (v > 0.05 && n < 6) {
    const T = 2 * v / g, x1 = xs + (sx - xs) * shares[Math.min(n, shares.length - 1)] / (D.dead ? 1 : 0.6);
    if (t < T) return { x: xs + (x1 - xs) * (t / T), y: JUG.ballR + v * t - 0.5 * g * t * t, air: true, hand: null, floor: true };
    t -= T; xs = x1; v *= 0.55; n++;
  }
  // the roll: out to its stop, slowing
  const rollT = D.dead ? 0.4 : 1.1, k = Math.min(1, t / rollT), xe = sx;
  return { x: xs + (xe - xs) * (1 - (1 - k) ** 2), y: JUG.ballR, air: false, hand: null, floor: true, rest: k >= 1, spin: (xe - xs) * (1 - (1 - k) ** 2) / JUG.ballR };
}

/** a held ball's place in its hand: alone at the palm; two = the first at the palm, the second resting on it (k 0..1: settling in) */
function placeHeld(B, j, n, [hx, hy], h, k = 1) {
  const sx = h === 0 ? 1 : -1;
  if (n < 2) { B.x = hx; B.y = hy + JUG.ballR * 0.4; return; }
  if (j === 0) { B.x = hx + sx * JUG.ballR * 0.35; B.y = hy + JUG.ballR * 0.4; return; }
  B.x = hx - sx * JUG.ballR * 0.45 * k; B.y = hy + JUG.ballR * (0.4 + 0.95 * k);
}
/** a trick at e: 'high' (one ball way up from the hand with one — he looks up), 'spin' (the same + a full turn under it), 'pause' (all three
 *  held, a breath) → { balls (as ballsAt), hands, look (0..1: his head up), turn (0..1 through a spin), throwing } */
export function trickAt(seg, e) {
  const hands = [dwellAt(0, 0.35, PAT.cascade), dwellAt(1, 0.35, PAT.cascade)], other = 1 - seg.lead;
  const balls = [0, 1, 2].map(i => ({ id: seg.ids[i], hand: handOfSlotStart(i, seg.lead), air: false }));
  let look = 0, turn = 0; const toss = [0, 0];
  if (seg.kind === 'high' || seg.kind === 'spin') {
    const up = 0.35, F = seg.kind === 'spin' ? 2.6 : 2.2, A = seg.kind === 'spin' ? 1.25 : 1.05, f = (e - up) / F;
    // (from where it sat in his hand, straight up + a little in, back down into the same hand)
    if (f > 0 && f < 1) { const sx = other === 0 ? 1 : -1, [hx, hy] = hands[other], y0 = hy + JUG.ballR * 0.4; balls[1] = { ...balls[1], x: hx + (sx * JUG.inner - hx) * Math.sin(Math.PI * f) * 0.6, y: y0 + 4 * A * f * (1 - f), air: true, hand: null }; }
    look = sm((e - up) / 0.5) * (1 - sm((e - up - F + 0.4) / 0.5));
    if (seg.kind === 'spin') turn = sm((e - up - 0.25) / 1.7);
    const th = e - up; toss[other] = th > 0 && th < 0.25 ? Math.sin(Math.PI * th / 0.25) : 0;
  }
  const held = [[], []];
  for (const B of balls) if (!B.air) held[B.hand].push(B);
  for (const h of [0, 1]) held[h].forEach((B, j) => placeHeld(B, j, held[h].length, hands[h], h, 1));
  return { balls, hands, look, turn, toss, knee: 0 };
}

/**
 * HIS SOUNDS between two work times (a0, a1] (s into his work) → [{ at (s into his work), slot, take? }]: each drop's first floor contact
 * (juggler-drop with its bounces, or juggler-thud when it lands dead on the rug); NO catch sounds. + the bag set down in his entrance / packed
 * at his exit are the painter's (enter/exit) — jugglerSceneCues
 */
export function jugglerCues(a0, a1, plan) {
  const out = [];
  if (!plan || !(a1 > a0) || a1 - a0 > 30) return out;
  for (const s of plan) {
    if (!s.drop) continue;
    const at = s.t0 + s.drop.hit;
    if (at > a0 && at <= a1) out.push({ at, slot: s.drop.dead ? 'juggler-thud' : 'juggler-drop' });
  }
  return out;
}
/** his scene's sounds on the evening's clock: sc (core/harbor-scenes.js scene entry), (a0, a1] evening seconds → [{ at (evening s), slot }]
 *  — the bag set down in his entrance (a soft thud), the drops, the bag set down + packed at his exit */
export function jugglerSceneCues(sc, a0, a1, key, seed = 1924) {
  const T = SCENE_TIMING.juggler, w0 = sc.start + T.up + T.enter, len = Math.max(1, sc.end - sc.start - T.up - T.enter - T.exit), out = [];
  const bagIn = sc.start + T.up + ENTER.bagDown;
  if (bagIn > a0 && bagIn <= a1) out.push({ at: bagIn, slot: 'juggler-thud' });
  for (const c of jugglerCues(a0 - w0, a1 - w0, jugglerPlan(key, len, seed))) out.push({ at: c.at + w0, slot: c.slot });
  return out;
}
/** his entrance (s into it, SCENE_TIMING.juggler.enter long): in from the BACK of the room carrying the bag (deep → front), the bag down,
 *  crouched taking the balls out, up + a step to his spot */
export const ENTER = Object.freeze({ walk: 5.6, bagDown: 6.2, crouch: [6.4, 10.6], up: 11.6 });
/** his exit (s into it, SCENE_TIMING.juggler.exit long): the flourish, to the bag, packing, up with it, to the window, the reach + the pull */
export const EXIT = Object.freeze({ flourish: 3.4, toBag: 5.6, pack: [5.8, 10.2], stand: 11, toWindow: 17, reach: 19.5 });
