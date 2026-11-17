// JAYWALK H4B — THE GHOSTS IN STEP WITH THE WORLD (js/games/jaywalk/ghosts.js — docs/jaywalk.md "THE GHOSTS"). THE RULE (the owner, Nov
// 16): a ghost is ALWAYS drawn consistent with the world on screen — never inside a car, never in the water while alive.
//   · the cause, proven: H4's ghost (its run 75 ticks BEHIND a world drawn now) stands in cars' boxes + on open water
//   · the new ghost = the engine's state AT THE WORLD's TICK: on a log it is ON the log, at a roadside never in a car — with the
//     network's delay on every hop, with jitter, through a 20 s dropped signal
//   · a late hop catches up in a quick hop (the drawn place never jumps), no death is shown before the player's own end confirms it and
//     none ever un-happens, the ghost's final lanes + end tick = the player's own
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCourse, laneHit, logUnder } from '../js/games/jaywalk/course.js';
import { createRun, step, isOver, kidAt } from '../js/games/jaywalk/engine.js';
import { FP, HOP_TICKS, TICK_MS } from '../js/games/jaywalk/tuning.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';
import { createGhost, feedGhost, stepGhost, resetGhost, offAt, HELD_SHOW_MS, CATCH_MAX_MS } from '../js/games/jaywalk/ghosts.js';
import { rngFrom, hashString } from '../js/core/rng.js';

/** a bot's whole run on a course: its hop log + the TRUE state after every tick (what the player's own phone showed) */
function playRun(seed, { ticks = 2400, lazy = false, bot = 'b' } = {}) {
  const course = createCourse(seed), run = createRun({ seed, mode: 'match' });
  const log = playBot(run, course, greedyBot({ seed: bot, lazy }), ticks);
  const r = createRun({ seed, mode: 'match' }), truth = [{ st: r.st, x: r.x, y: r.y, k: r.k, best: r.best }];
  let i = 0;
  while (!isOver(r)) { let d = ''; if (i < log.length && log[i].t === r.t) d = log[i++].d; step(r, course, d); truth[r.t] = { st: r.st, x: r.x, y: r.y, k: r.k, best: r.best }; }
  return { seed, course, log, truth, end: r.end, lanes: r.best, cause: r.cause };
}
/** when each hop REACHES another phone (ticks): its own tick + the network's delay (lo … hi, jittered), never before the hop before
 *  it; inside an offline window [a, b) everything waits for b */
function arrivals(log, { lo = 6, hi = 22, seed = 'net', offline = null } = {}) {
  const rand = rngFrom(hashString(`arr:${seed}`)), out = [];
  let last = 0;
  for (const h of log) {
    let at = h.t + lo + Math.floor(rand() * (hi - lo + 1));
    if (offline && at >= offline[0] && at < offline[1]) at = offline[1];
    if (at < last) at = last;
    out.push(at); last = at;
  }
  return out;
}
/** is this alive, drawn run consistent with the world at tick T? → '' or what is wrong (course.js's own checks — not the engine's step) */
function worldProblem(course, r, T) {
  const hop = r.st === 'hop', y = hop ? (r.k * 2 >= HOP_TICKS ? r.ty : r.fy) : r.y, L = course.lane(y);
  const x = hop ? r.fx + Math.floor((r.tx - r.fx) * r.k / HOP_TICKS) : r.x;
  if (L.type !== 'water' && laneHit(L, T, x)) return `inside a ${laneHit(L, T, x)} on lane ${y}`;
  if (!hop && L.type === 'water' && logUnder(L, T, r.x) < 0) return `standing on open water on lane ${y}`;
  return '';
}
/** one player's ghost on another phone, tick by tick → what was seen */
function watch(R, { lo, hi, seed = 'net', offline = null, endLat = 14 } = {}) {
  const arr = arrivals(R.log, { lo, hi, seed, offline }), G = createGhost(R.seed), eAt = Math.max(R.end + endLat, arr.length ? arr[arr.length - 1] : 0, offline && R.end >= offline[0] && R.end < offline[1] ? offline[1] : 0);
  const seen = { frames: 0, drawn: 0, onLog: 0, roadside: 0, onRoad: 0, held: 0, hidden: 0, catchUps: 0, maxJump: 0, maxOff: 0, bad: [], outAt: -1, outShownBeforeE: false, unDied: false, exact: 0, exactOf: 0 };
  let fed = 0, prev = null, wasOut = false;
  for (let T = 0; T <= eAt + 90; T++) {
    const now = T * TICK_MS, hops = [];
    while (fed < arr.length && arr[fed] <= T) hops.push(R.log[fed++]);
    const hadOff = !!G.off, t0 = G.off ? G.off.t0 : -1, pb = kidAt(G.run), vb = offAt(G.off, now), want = { x: pb.x + (vb ? vb.x : 0), y: pb.y + (vb ? vb.y : 0) };
    feedGhost(G, hops.length ? hops : null, T >= eAt);
    stepGhost(G, R.course, T, now);
    const r = G.run;
    seen.frames++;
    if (isOver(r)) {
      if (!wasOut) { wasOut = true; seen.outAt = r.end; if (T < eAt) seen.outShownBeforeE = true; }
      continue;
    }
    if (wasOut) seen.unDied = true;
    if (G.held) seen.held++;
    if (G.behind) { seen.hidden++; prev = null; continue; }
    seen.drawn++;
    // where it is DRAWN (cells): the rules' place + what is left of a catch-up
    const p = kidAt(r), at = { x: p.x + (G.vis ? G.vis.x : 0), y: p.y + (G.vis ? G.vis.y : 0) };
    if (G.off && (!hadOff || G.off.t0 !== t0)) {
      seen.catchUps++; if (G.off.d > seen.maxOff) seen.maxOff = G.off.d;
      // (the moment a late hop lands: the drawn place does not jump — the catch-up starts from where the ghost WAS drawn)
      if (prev) { const j = Math.hypot(at.x - want.x, at.y - want.y); if (j > seen.maxJump) seen.maxJump = j; }   // (`want` = exactly where it was drawn)
      assert.ok(G.off.ms <= CATCH_MAX_MS && G.off.ms >= 100, 'a QUICK hop');
    }
    prev = at;
    if (G.held) continue;                                    // (standing still, unconfirmed: its own check below)
    assert.equal(r.t, T, 'a drawn ghost is the engine\'s state AT THE WORLD\'s TICK');
    const w = worldProblem(R.course, r, T);
    if (w) seen.bad.push(`tick ${T}: ${w}`);
    const L = R.course.lane(r.y);
    if (r.st === 'idle' && L.type === 'water') seen.onLog++;
    if (r.st === 'idle' && L.type === 'grass' && R.course.lane(r.y + 1).type === 'road') seen.roadside++;
    if (L.type === 'road') seen.onRoad++;
    // every hop made up to this tick is here → the ghost IS the player (x, lane, state, the hop's own step)
    if (fed === R.log.length || R.log[fed].t >= T) { seen.exactOf++; const tr = R.truth[T]; if (tr && tr.st === r.st && tr.x === r.x && tr.y === r.y && tr.k === r.k && tr.best === r.best) seen.exact++; }
  }
  return { G, seen, eAt };
}
const RUNS = [playRun('ghost-a', { bot: 'a' }), playRun('ghost-b', { bot: 'b', lazy: true }), playRun('ghost-c', { bot: 'c', ticks: 3600 }), playRun('ghost-d', { bot: 'd', lazy: true, ticks: 3600 })];

test('THE CAUSE (H4): a ghost stepped 75 ticks BEHIND a world drawn NOW stands inside cars + on open water — a friend safe on a log 1.25 s ago is drawn in the water today', () => {
  let cars = 0, water = 0, frames = 0;
  for (const R of RUNS) for (let T = 75; T < R.end; T++) {
    const s = R.truth[T - 75], r = { ...s, fx: s.x, fy: s.y, tx: s.x, ty: s.y };
    if (s.st !== 'idle') continue;
    frames++;
    const w = worldProblem(R.course, r, T);
    if (/inside/.test(w)) cars++; else if (w) water++;
  }
  assert.ok(cars > 20 && water > 20, `the old delayed ghost: ${cars} frames inside a vehicle + ${water} on open water of ${frames}`);
  // … and the same runs at the world's own tick: never
  for (const R of RUNS) for (let T = 1; T < R.end; T++) { const s = R.truth[T]; if (s.st === 'idle') assert.equal(worldProblem(R.course, { ...s }, T), '', `the player's own state at tick ${T}`); }
});

test('IN STEP WITH THE WORLD: with the network\'s delay on every hop a drawn ghost is the engine\'s state at the world\'s tick — ON its log, never in a car, never on open water', () => {
  let onLog = 0, roadside = 0, onRoad = 0, drawn = 0;
  for (const R of RUNS) for (const net of [{ lo: 2, hi: 6 }, { lo: 6, hi: 22 }, { lo: 20, hi: 75 }]) {
    const { seen } = watch(R, { ...net, seed: `${R.seed}${net.lo}` });
    assert.deepEqual(seen.bad, [], `${R.seed} (${net.lo}–${net.hi} ticks late): never inside a car / on open water`);
    onLog += seen.onLog; roadside += seen.roadside; onRoad += seen.onRoad; drawn += seen.drawn;
  }
  assert.ok(onLog > 500, `a ghost standing on a log is drawn ON the log (${onLog} frames riding one, each checked against the log's place at that tick)`);
  assert.ok(roadside > 500 && onRoad > 500, `a ghost waiting at a roadside (${roadside} frames) / crossing a road (${onRoad}) is never drawn inside a car`);
  assert.ok(drawn > 20000);
});

test('A LATE HOP CATCHES UP in a quick hop: the drawn place never jumps (the catch-up starts where the ghost was drawn), and with every hop in the ghost IS the player', () => {
  for (const R of RUNS) {
    const { seen } = watch(R, { lo: 6, hi: 22, seed: R.seed });
    assert.ok(seen.catchUps > R.log.length * 0.5, `${R.seed}: ${seen.catchUps} catch-ups for ${R.log.length} hops (a hop always lands late)`);
    assert.ok(seen.maxJump < 1e-9, `never a teleport: the drawn place at a late hop = where the ghost was drawn (off by ${seen.maxJump})`);
    assert.ok(seen.maxOff > 0.3 && seen.maxOff < 4, `the catch-up closes what the delay cost (≤ ${seen.maxOff.toFixed(2)} cells)`);
    assert.ok(seen.exactOf > 200 && seen.exact === seen.exactOf, `with every hop in: the ghost = the player, tick for tick (${seen.exact}/${seen.exactOf})`);
  }
  // the catch-up's own shape: all of it at the start, none at the end, eased
  const o = { x: 1, y: -1, d: 1.4, t0: 1000, ms: 120 };
  assert.deepEqual([offAt(o, 1000).x, offAt(o, 1000).u], [1, 0]); assert.equal(offAt(o, 1120), null); assert.equal(offAt(null, 5), null);
  assert.ok(offAt(o, 1060).x > 0.45 && offAt(o, 1060).x < 0.55 && offAt(o, 1060).y < 0);
});

test('NO FALSE DEATHS: a ghost goes out only once the player\'s own end is here — at the player\'s own tick; before it, a ghost that would go out holds still; a death never un-happens', () => {
  let held = 0;
  for (const R of RUNS) for (const net of [{ lo: 6, hi: 22, endLat: 14 }, { lo: 20, hi: 75, endLat: 60 }]) {
    const { G, seen } = watch(R, { ...net, seed: `d${R.seed}` });
    assert.equal(seen.outShownBeforeE, false, `${R.seed}: no death before their own end arrived`);
    assert.equal(seen.unDied, false, 'a death never un-happens');
    assert.equal(seen.outAt, R.end, 'the ghost goes out at the player\'s own tick');
    assert.equal(G.run.best, R.lanes, 'the ghost\'s final lanes = the player\'s own'); assert.equal(G.run.cause, R.cause);
    held += seen.held;
  }
  assert.ok(held > 0, `a ghost whose next tick would take it out — unconfirmed — stood still (${held} frames in all)`);
  // by hand: a kid who never hops — the blackout takes them; the ghost holds at the tick before, then (their `e`) goes out at that tick
  const R = playRun('ghost-idle', { ticks: 0 }), G = createGhost(R.seed);
  for (let T = 0; T <= R.end + 90; T++) stepGhost(G, R.course, T, T * TICK_MS);
  assert.ok(G.held && !isOver(G.run) && G.run.t === R.end - 1, 'held one tick before the wall');
  assert.ok(G.behind, `held past ${HELD_SHOW_MS} ms (no news of them): not drawn — never a kid standing in what would have hit them`);
  feedGhost(G, null, true); stepGhost(G, R.course, R.end + 91, (R.end + 91) * TICK_MS);
  assert.ok(isOver(G.run) && G.run.end === R.end && G.run.cause === 'wall' && !G.held);
});

test('THE DROPPED SIGNAL: 20 s without a hop of theirs — the ghost stands / rides (held + hidden if it would go out), no death shown; the burst lands → it catches up and IS the player again', () => {
  for (const R of RUNS.slice(0, 2)) {
    const a = 600, b = a + 1200, { G, seen } = watch(R, { lo: 6, hi: 22, seed: `drop${R.seed}`, offline: [a, b] });
    assert.deepEqual(seen.bad, [], 'never inside a car / on open water — through the drop too');
    assert.equal(seen.outShownBeforeE, false); assert.equal(seen.unDied, false);
    assert.equal(seen.outAt, R.end); assert.equal(G.run.best, R.lanes, 'the final lanes = the player\'s own');
    assert.ok(seen.exactOf > 200 && seen.exact === seen.exactOf);
    assert.ok(seen.maxJump < 1e-9, 'the burst\'s catch-up starts where the ghost was drawn');
  }
  // a course change (THE FIRST GO lands / a rejoin): the run from the start again, the log kept
  const R = RUNS[0], G = createGhost('other-course');
  feedGhost(G, R.log.slice(0, 40), false); stepGhost(G, createCourse('other-course'), 300, 0);
  resetGhost(G, R.seed);
  assert.ok(G.ci === 0 && G.run.t === 0 && G.log.length === 40 && !G.held && !G.off);
  for (let T = 0; T <= R.log[39].t + 1; T++) stepGhost(G, R.course, T, T * TICK_MS);
  const tr = R.truth[R.log[39].t + 1];
  assert.deepEqual([G.run.x, G.run.y, G.run.st, G.run.best], [tr.x, tr.y, tr.st, tr.best]);
});

test('PURE + bounded: ghosts.js imports the engine only; no DOM, no clock of its own; the view steps every ghost to THE WORLD\'s tick and the scene draws the world at it', async () => {
  const { readFileSync } = await import('node:fs');
  const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
  const g = read('js/games/jaywalk/ghosts.js').replace(/\/\/[^\n]*/g, '');
  assert.deepEqual([...g.matchAll(/from '([^']+)'/g)].map(m => m[1]), ['./engine.js']);
  for (const bad of [/document\b/, /window\b/, /performance\.now/, /Date\.now/, /Math\.random/, /serverNow/]) assert.doesNotMatch(g, bad, `ghosts.js is pure (${bad})`);
  const v = read('js/games/jaywalk/view.js'), n = read('js/games/jaywalk/night.js');
  assert.match(v, /const alive = mode === 'run' && !isOver\(run\), wt = alive \? run\.t : Math\.max\(0, c\.t\)/, 'THE WORLD\'s tick: the kid\'s own while he runs, the clock\'s once he is out');
  assert.match(v, /extra = \{ ghosts: list, t: wt \+ wa, a: wa, off: F \? F\.vis : null, own: drawRun === run \};/, 'the scene gets the world\'s tick + the watched ghost\'s catch-up');
  assert.match(n, /const t = o && o\.t != null \? o\.t : run\.t \+ a \+ fx\.after/, 'the scene draws every car + log at the world\'s tick');
  assert.match(v, /if \(node && node\.e\) feedGhost\(G, null, true\);/, 'a ghost\'s death is confirmed by the player\'s own end');
  assert.ok(FP > 0);
});
