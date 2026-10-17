// SLIPSTREAM bot (PURE): plays by looking ahead with the real physics. Every decision it tries a handful of
// hold/release plans for the next second (hold for k·0.1 s then release, or release then hold), finishes each with
// a simple default policy (dive on descents, release on climbs) for another ~1.6 s, and keeps the plan that
// survives and goes fastest. Used by tests/slip.test.mjs to prove courses are survivable and by the browser E2E
// (window.__slip.bot) to ride for simulated players. Optional flips: when a rollout says a flip still lands clean.
import { step, clone, STEP } from './physics.js';
import { floorSlope, floorCurv } from './course.js';

// the same step as the real simulation: near a crest's launch threshold a coarser step can disagree with reality
const DT = STEP;

function rollout(r, c, plan, horizon, pressT0 = 0) {
  const s = clone(r);
  // the press already under way counts (a held press becomes an air dive after AIR_HOLD_AFTER)
  const input = { hold: false, pressT: pressT0, taps: 0 };
  let t = 0, drops = 0;
  while (t < horizon) {
    let hold;
    if (t < plan.window) hold = plan.hold(t);
    // default: dive on the scooping (concave) part of descents; never on the rounded top of a crest (that glues you
    // down and you miss the launch)
    else hold = s.gnd && s.g > 0 ? floorSlope(c, s.x) < -0.05 && floorCurv(c, s.x) > -0.004 : false;
    input.pressT = hold ? input.pressT + DT : 0;
    input.hold = hold;
    if (plan.tapAt != null && t <= plan.tapAt && t + DT > plan.tapAt) input.taps = plan.taps || 1;
    s.t += DT;
    step(s, c, input, DT);
    t += DT;
    for (const e of s.events) if (e.e === 'drop') drops++;
    s.events.length = 0;
    if (s.st !== 'ride') return { ok: false, t, s, drops };
  }
  return { ok: true, t, s, drops };
}

const PLANS = [];
for (let k = 0; k <= 8; k++) PLANS.push({ window: 0.8, hold: t => t < k * 0.1 });         // hold k·0.1 s, then release
for (let k = 1; k <= 8; k++) PLANS.push({ window: 0.8, hold: t => t >= k * 0.1 });         // release k·0.1 s, then hold

/**
 * Next input for rider r. opts: { flips (bool), rnd (0..1 source), skill (0..1, chance to take the best plan),
 * pressT (how long the current press has lasted), mem (an object the caller keeps between calls: the bot commits to a plan's release time across replans —
 * without it, "dive a little longer" keeps winning every tenth of a second and the release never comes) }.
 * Returns { hold, tap }.
 */
export function decide(r, c, opts = {}) {
  if (r.st !== 'ride') return { hold: false, tap: false };
  const horizon = 3.2;   // long enough to see a whole flight land (flights are floaty: AIR_FLOAT)
  const mem = opts.mem || {};
  const cands = PLANS.slice();
  // the plan in progress, continued from where it is
  if (mem.plan && mem.t0 != null && r.t - mem.t0 < mem.plan.window) {
    const el = r.t - mem.t0, cur = mem.plan;
    cands.push({ window: cur.window - el, hold: t => cur.hold(t + el), cont: true });
  }
  let best = null;
  // commitment: a plan in progress that still survives is kept as is (re-planning every tenth of a second otherwise
  // picks "release in 0.2 s" over and over, and the release never comes)
  const cont = cands.find(p => p.cont);
  if (cont) {
    const o = rollout(r, c, cont, horizon, opts.pressT || 0);
    if (o.ok) best = { p: cont, score: Infinity, o };
  }
  if (!best) for (const p of cands) {
    const o = rollout(r, c, p, horizon, opts.pressT || 0);
    // survive, go far and fast; rolling off an edge is a risk, not a shortcut; keep a plan we're executing
    const score = o.ok ? 1000 + o.s.x + o.s.sp * 0.6 - o.drops * 25 + (p.cont ? 4 : 0) : o.t * 10;
    if (!best || score > best.score) best = { p, score, o };
  }
  if (!best.p.cont) { mem.plan = best.p; mem.t0 = r.t; }
  let tap = false;
  // flips: only in the air, with nothing spinning, if a rollout with a tap now still lands clean
  if (opts.flips && !r.gnd && r.spin === 0 && r.airT > 0.05) {
    const p = { ...best.p, tapAt: 0, taps: 1 };
    const o = rollout(r, c, p, horizon, opts.pressT || 0);
    if (o.ok && (!opts.rnd || opts.rnd() < (opts.flipRate ?? 0.85))) tap = true;
  }
  let hold = best.p.hold(0);
  if (opts.skill != null && opts.rnd && opts.rnd() > opts.skill) hold = !hold;   // a human-ish slip now and then
  return { hold, tap, safe: best.o.ok };
}
