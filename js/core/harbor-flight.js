// CITY 2.0 — THE HARBOR: how the birds fly (PURE; drawn by screens/harbor/birds.js — docs/harbor/passes/part-6a.md).
// Every path here is a function of (the flight's seed, the seconds since it began): no per-frame randomness, nothing that
// depends on the frame's dt — so 30 fps and 60 fps sample the same curve, and the same seed draws the same flock on every phone.
//   smoothRoof / roofAt   the roofline (a STEP function: the highest roof per 4 pt — a tower's edge jumps 50–90 pt) smoothed
//                         into a gentle curve a bird can follow without teleporting at a building's edge
//   batPlan / batAt       a bat: a smooth loop (three sines per axis) + quick DARTS — every ~1 s a fast but smooth swerve
//                         (smootherstep: C2, so it reads as a flick of the wings, not a jump) — and the bank into each dart
//   geesePlan / goosePose a V that is never perfect: uneven arms, irregular spacing, birds drifting in their slots, 1–2
//                         STRAGGLERS trailing with a gap (flapping harder, falling back + catching up), and now and then one
//                         bird DROPPING BACK and rejoining, or two neighbours SHIFTING PLACES
import { rngFrom } from './rng.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** a stateless hash → [0, 1): the same (seed, a, b) always gives the same number */
export function hash01(seed, a, b = 0) {
  let h = (seed ^ Math.imul((a + 0x9e3779b9) | 0, 0x85ebca6b) ^ Math.imul((b + 0x632be5ab) | 0, 0xc2b2ae35)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
/** smootherstep (C2: no kick in the acceleration at either end), its 1st + 2nd derivatives */
const ss = u => u * u * u * (u * (u * 6 - 15) + 10);
const ss1 = u => 30 * u * u * (u - 1) * (u - 1);
const ss2 = u => 60 * u * (2 * u - 1) * (u - 1);

// ---------------------------------------------------------------- the roofline, smoothed
/** sky: the roofline per 4 pt (scene.js#skyline). A box average over ±r cells, `passes` times (≈ a gaussian) */
export function smoothRoof(sky, r = 12, passes = 2) {
  const n = sky.length;
  let a = Float32Array.from(sky), b = new Float32Array(n);
  for (let p = 0; p < passes; p++) {
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += a[clamp(i + k, 0, n - 1)];
      b[i] = sum / (2 * r + 1);
    }
    const t = a; a = b; b = t;
  }
  return a;
}
/** the smoothed roof's y at screen x (pt): linear between the 4-pt cells — continuous */
export function roofAt(arr, x) {
  const f = clamp(x / 4, 0, arr.length - 1), i = Math.min(arr.length - 2, Math.floor(f)), u = f - i;
  return arr.length < 2 ? arr[0] : arr[i] + (arr[i + 1] - arr[i]) * u;
}

// ---------------------------------------------------------------- a bat
/** one bat's flight (amplitudes in pt at K = 1) */
export function batPlan(seed) {
  const r = rngFrom(seed >>> 0), R = (a, b) => a + r() * (b - a), sg = () => (r() < 0.5 ? -1 : 1);
  return {
    seed: seed >>> 0,
    // the loop: a wide lazy sweep, a quicker weave, a small flutter (incommensurate: never quite repeats)
    ax0: R(22, 46), wx0: R(0.45, 0.95) * sg(), px0: R(0, TAU),
    ax1: R(6, 12), wx1: R(1.4, 2.2), px1: R(0, TAU),
    ax2: R(1.5, 3), wx2: R(3.1, 4.3), px2: R(0, TAU),
    ay0: R(6, 14), wy0: R(0.6, 1.2), py0: R(0, TAU),
    ay1: R(3, 7), wy1: R(1.7, 2.7), py1: R(0, TAU),
    ay2: R(1, 2.2), wy2: R(3.4, 4.8), py2: R(0, TAU),
    // the darts: one per period, at a seeded moment inside it; d = how long the swerve takes; mag = how far it throws the bat
    P: R(0.8, 1.5), d: R(0.24, 0.34), mag: R(8, 14),
    // the wings: 6–8 beats a second (smooth at 60 fps, still readable at 30)
    flapW: TAU * R(6, 8), ph: R(0, TAU),
  };
}
/** a dart's target offset k (a stateless hash: no state, no per-frame dice): the darts alternate sides (a zig-zag, each
 *  throw a different angle + length), and now and then a SWOOP (a drop after a moth) */
function dart(p, k, out) {
  const ang = Math.PI * (k & 1) + (hash01(p.seed, k, 1) - 0.5) * 2.2, m = p.mag * (0.6 + 0.4 * hash01(p.seed, k, 2));
  out.dx = Math.cos(ang) * m;
  out.dy = Math.sin(ang) * m * 0.6 + (hash01(p.seed, k, 3) < 0.22 ? p.mag * 0.8 : 0);
}
const DA = { dx: 0, dy: 0 }, DB = { dx: 0, dy: 0 };
/** where the bat is t s into its flight, as an offset (pt at K = 1) from its home: out.x, out.y; + out.ax (its sideways
 *  acceleration, pt/s²: the bank) and out.flap (the wings' phase). No allocations. */
export function batAt(p, t, out) {
  let x = p.ax0 * Math.sin(p.wx0 * t + p.px0) + p.ax1 * Math.sin(p.wx1 * t + p.px1) + p.ax2 * Math.sin(p.wx2 * t + p.px2);
  let y = p.ay0 * Math.sin(p.wy0 * t + p.py0) + p.ay1 * Math.sin(p.wy1 * t + p.py1) + p.ay2 * Math.sin(p.wy2 * t + p.py2);
  let ax = -(p.ax0 * p.wx0 * p.wx0 * Math.sin(p.wx0 * t + p.px0) + p.ax1 * p.wx1 * p.wx1 * Math.sin(p.wx1 * t + p.px1) + p.ax2 * p.wx2 * p.wx2 * Math.sin(p.wx2 * t + p.px2));
  // the dart in this period: from the last one's offset to this one's, in d seconds
  const k = Math.floor(t / p.P), s0 = k * p.P + hash01(p.seed, k, 0) * (p.P - p.d), u = (t - s0) / p.d;
  if (u >= 1) { dart(p, k, DA); x += DA.dx; y += DA.dy; }
  else {
    dart(p, k - 1, DA);
    if (u <= 0) { x += DA.dx; y += DA.dy; }
    else {
      dart(p, k, DB);
      const e = ss(u);
      x += DA.dx + (DB.dx - DA.dx) * e; y += DA.dy + (DB.dy - DA.dy) * e;
      ax += (DB.dx - DA.dx) * ss2(u) / (p.d * p.d);
    }
  }
  out.x = x; out.y = y; out.ax = ax; out.flap = p.flapW * t + p.ph;
  return out;
}

// ---------------------------------------------------------------- the geese
/** the wingbeat (rad/s) — the V's base; each bird a few % off it, a straggler 30–45 % faster */
const GOOSE_BEAT = 5.2;

/**
 * A V of n geese (7–13), seeded; flightS = about how long it takes to cross (so the events land on screen).
 * Positions are in GAPS (× the flock's gap, pt): along = how far behind the leader, across = to the side (− one arm, + the other).
 */
export function geesePlan(seed, n, flightS = 30) {
  const r = rngFrom(seed >>> 0), R = (a, b) => a + r() * (b - a);
  const ns = n >= 9 && r() < 0.5 ? 2 : 1, inV = n - ns, armN = inV - 1;
  const left = clamp(Math.round(armN / 2 + R(-1.7, 1.7)), 1, armN - 1);
  const count = [left, armN - left], side = [-1, 1];
  const slope = [0.62 * R(0.82, 1.18), 0.62 * R(0.82, 1.18)], bend = [R(-0.03, 0.03), R(-0.03, 0.03)];
  const F = () => new Float32Array(n);
  const p = {
    n, seed: seed >>> 0,
    along: F(), across: F(), side: new Int8Array(n), arm: new Int8Array(n), slot: new Int8Array(n), kind: new Int8Array(n),
    rate: F(), ph: F(),
    wa: F(), ww: F(), wp: F(), wc: F(), wcw: F(), wcp: F(),     // the drift in the slot (along, across)
    sa: F(), sw: F(), sp: F(),                                // a straggler falling back + catching up
    ev: [], maxAlong: 0, minAcross: 0, maxAcross: 0,
  };
  const tail = [0, 0], last = [0, 0];                         // each arm's last bird (along) + its index
  let i = 0;
  const put = (a, along, across, kind, slot) => {
    p.along[i] = along; p.across[i] = across; p.side[i] = a < 0 ? 0 : side[a]; p.arm[i] = a; p.kind[i] = kind; p.slot[i] = slot;
    p.rate[i] = kind === 2 ? R(1.3, 1.45) : R(0.96, 1.04);
    p.ph[i] = -slot * 0.55 + R(-0.3, 0.3);                     // the ripple down each arm, not quite in step
    p.wa[i] = kind === 0 ? 0.04 : R(0.06, 0.16); p.ww[i] = TAU / R(6, 15); p.wp[i] = R(0, TAU);
    p.wc[i] = kind === 0 ? 0.03 : R(0.04, 0.1); p.wcw[i] = TAU / R(5, 13); p.wcp[i] = R(0, TAU);
    if (kind === 2) { p.sa[i] = R(0.3, 0.6); p.sw[i] = TAU / R(11, 22); p.sp[i] = R(0, TAU); }
    if (along > p.maxAlong) p.maxAlong = along;
    if (across < p.minAcross) p.minAcross = across;
    if (across > p.maxAcross) p.maxAcross = across;
    return i++;
  };
  put(-1, 0, 0, 0, 0);                                        // the leader
  for (let a = 0; a < 2; a++) {
    let along = 0;
    for (let k = 1; k <= count[a]; k++) {
      along += 1 + R(-0.16, 0.28);                           // the spacing: never even
      last[a] = put(a, along, side[a] * (slope[a] * along + bend[a] * k * k) + R(-0.12, 0.12), 1, k);
      tail[a] = along;
    }
  }
  // THE STRAGGLERS: off the end of an arm (the longer one more often), a clear gap back, a little off the line
  let sArm = count[0] > count[1] ? (r() < 0.7 ? 0 : 1) : count[1] > count[0] ? (r() < 0.7 ? 1 : 0) : (r() < 0.5 ? 0 : 1);
  const hasS = [false, false];
  for (let s = 0; s < ns; s++) {
    if (s === 1 && r() < 0.5) sArm = 1 - sArm;
    const first = !hasS[sArm], along = tail[sArm] + 1 + (first ? R(0.9, 2.0) : R(0.5, 1.4));
    put(sArm, along, side[sArm] * (slope[sArm] * along + R(-0.4, 0.25)), 2, count[sArm] + 1 + s);
    tail[sArm] = along; hasS[sArm] = true;
  }
  // THE EVENTS (each on its own clock, spread over the crossing): one bird dropping back and rejoining; two neighbours on an
  // arm trading places. Most V's get one, many both.
  const armBirds = [];
  for (let j = 1; j < n; j++) if (p.kind[j] === 1) armBirds.push(j);
  const doDrop = r() < 0.85, doSwap = !doDrop || r() < 0.6;
  let dropper = -1;
  if (doDrop) {
    dropper = armBirds[Math.floor(r() * armBirds.length)];
    p.ev.push({ type: 'drop', a: dropper, b: -1, t0: flightS * R(0.1, 0.45), dur: Math.min(R(8, 12), Math.max(5, flightS * 0.4)), depth: R(0.9, 1.5), lat: R(0.45, 0.65), boost: R(0.35, 0.5) });
  }
  if (doSwap) {
    // the front one eases back, the one behind moves up past it (not the dropper, nor its neighbours)
    const pairs = [];
    for (let a = 0; a < 2; a++) for (let k = 1; k < count[a]; k++) {
      const f = 1 + (a === 0 ? 0 : count[0]) + (k - 1);
      if (dropper < 0 || Math.abs(f - dropper) > 1 && Math.abs(f + 1 - dropper) > 1) pairs.push(f);
    }
    if (pairs.length) { const f = pairs[Math.floor(r() * pairs.length)]; p.ev.push({ type: 'swap', a: f, b: f + 1, t0: flightS * R(0.2, 0.55), dur: Math.min(R(6, 9), Math.max(4, flightS * 0.3)), lat: R(0.45, 0.6), boost: R(0.25, 0.4) }); }
  }
  return p;
}
const bumpInt = u => u / 2 - Math.sin(TAU * u) / (2 * TAU);   // ∫₀ᵘ sin²(πv) dv: the extra wingbeats while working harder

/** bird i, t s into the flight: out.along / out.across (gaps), out.flap (the wings' phase, rad). No allocations. */
export function goosePose(p, i, t, out) {
  let a = p.along[i], c = p.across[i], extra = 0;
  for (let e = 0; e < p.ev.length; e++) {
    const ev = p.ev[e];
    if (ev.a !== i && ev.b !== i) continue;
    const u = clamp((t - ev.t0) / ev.dur, 0, 1), bump = Math.sin(Math.PI * u) ** 2, sd = p.side[i] || 1;
    if (ev.type === 'drop') {
      // back by `depth` gaps, inside the line (it slides past its follower), then flapping harder to win its place back
      a += ev.depth * bump; c -= sd * ev.lat * bump;
      extra += ev.boost * ev.dur * bumpInt(u);
    } else {
      const o = ev.a === i ? ev.b : ev.a, s = ss(u), front = ev.a === i;
      a += (p.along[o] - p.along[i]) * s; c += (p.across[o] - p.across[i]) * s;
      c += (front ? -1 : 1) * sd * ev.lat * Math.sin(Math.PI * u);  // they pass side by side, never through each other
      if (!front) extra += ev.boost * ev.dur * bumpInt(u);      // the one moving up works for it
    }
  }
  a += p.wa[i] * Math.sin(t * p.ww[i] + p.wp[i]);
  c += p.wc[i] * Math.sin(t * p.wcw[i] + p.wcp[i]);
  if (p.kind[i] === 2) a += p.sa[i] * Math.sin(t * p.sw[i] + p.sp[i]);
  out.along = a; out.across = c; out.flap = GOOSE_BEAT * (t * p.rate[i] + extra) + p.ph[i];
  return out;
}
/** the V's tail (gaps): how far behind the leader the last bird can be (the flight ends when it has left the screen) */
export const geeseTail = p => p.maxAlong + 1.5 + 0.6;
