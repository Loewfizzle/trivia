// JAYWALK H1 — THE DEEP RUNS + THE CARD MOMENTS (docs/jaywalk.md): whole runs far up the curve, the per-mode END (the match / the daily
// always end at THE MOTHERSHIP's tick, solo never ends by the clock), and the three moments THE REPLAY detects — (H4: ONE LIFE; THE ONE-UP is
// gone — tests/jaywalk-engine.test.mjs proves it) hand-built logs that EARN boom / ufo / airfield and the near-misses that must NOT (hit
// by the Blackbird, on its lane too late, taken by that UFO, lane 400 in a match).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse, specials, pulseAt, ufoX, ufoY, buildLane } from '../js/games/jaywalk/course.js';
import { createRun, step, resultOf, isOver } from '../js/games/jaywalk/engine.js';
import { replay } from '../js/games/jaywalk/replay.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';

test('DEEP RUNS: the greedy bot gets far up the curve + into the loop; every death names its cause; the wall is the rare one', () => {
  const N = 150, causes = {};
  let far = 0, deep = 0;
  for (let s = 0; s < N; s++) {
    const seed = `deep${s}`, course = createCourse(seed), run = createRun({ seed, mode: 'solo' });
    playBot(run, course, greedyBot({ seed }), 9000);
    const r = resultOf(run);
    if (r.over) { assert.ok(T.CAUSES.includes(r.cause), `a named cause (${r.cause})`); causes[r.cause] = (causes[r.cause] || 0) + 1; assert.equal(r.hits, 1); }
    if (r.lanes >= 150) far++;
    if (r.lanes >= 400) deep++;
  }
  assert.ok(far >= N * 0.4, `${far} of ${N} runs past lane 150`);
  assert.ok(deep >= 1, 'the loop is reachable');
  assert.ok((causes.wall || 0) <= N * 0.08, `the wall: ${causes.wall || 0} of ${N} (a stuck bot — never the usual end)`);
  assert.ok(causes.car > 0 && causes.water > 0, 'cars + the water do the work');
});

test('THE END PER MODE: the match + the daily ALWAYS end at THE MOTHERSHIP\'s tick (taken = A FINISH LINE — H6A: "MADE IT TO THE MOTHERSHIP"); solo NEVER ends by the clock', () => {
  for (const mode of ['match', 'daily']) {
    const cap = T.MODES[mode].cap;
    let taken = 0;
    for (let s = 0; s < 24; s++) {
      const seed = `cap-${mode}-${s}`, course = createCourse(seed), run = createRun({ seed, mode });
      const log = playBot(run, course, greedyBot({ seed, lazy: true, look: 30 }), cap + 50);
      assert.ok(isOver(run), `${seed}: over by the cap`);
      assert.ok(run.end <= cap && run.t <= cap + 1, `${seed}: never a tick past ${cap}`);
      if (run.st === 'taken') { taken++; assert.equal(run.end, cap); assert.equal(resultOf(run).cause, 'taken'); assert.equal(run.hits, 0, 'taken = never hit'); }
      assert.ok(log.every(h => h.t < cap), 'no hop at / after the cap');
    }
    // (a kid still standing at the cap is taken AT the cap — whatever the bot managed above)
    const run = createRun({ seed: 'stand', mode }), course = createCourse('stand');
    let at = 212; while (course.lane(at).type !== 'grass' || course.lane(at).ufo || course.lane(at).obs[T.MID_COL]) at++;   // (plain ground: nothing else ends the run in these 10 ticks)
    run.t = cap - 3; run.best = at; run.y = at; run.wall = (at - 12) * T.FP;
    const ev = [];
    for (let i = 0; i < 10; i++) step(run, course, '', ev);
    assert.deepEqual([run.st, run.end, run.t], ['taken', cap, cap], `${mode}: taken at tick ${cap}`);
    assert.deepEqual(ev.filter(e => e.e === 'taken'), [{ e: 'taken', lane: at }], `still in at lane ${at}: the finish line`);
    assert.equal(resultOf(run).taken, true); assert.equal(resultOf(run).feats.ufo, false, 'the mothership is never the UFO moment');
    void taken;   // (how many the lazy bot lasted is its luck — the rule is the check above: still standing at the cap = taken AT the cap)
  }
  assert.equal(T.MODES.solo.cap, 0);
  const run = createRun({ seed: 'solo', mode: 'solo' }), course = createCourse('solo');
  let far = 3000; while (course.lane(far).type !== 'grass' || course.lane(far).ufo) far++;   // (plain ground: nothing hits a kid standing there)
  run.t = 40 * 60 * T.TICK_HZ; run.best = far; run.y = far; run.wall = (far - 10) * T.FP;
  for (let i = 0; i < 20; i++) step(run, course, '');
  assert.notEqual(run.st, 'taken', 'solo endless: 40 minutes in, nobody comes');
  assert.equal(T.wallPace('solo', run.t), T.MODES.solo.wall.base, '… and the wall never speeds up');
});

// ---- THE CARD MOMENTS — hand-built logs (the bot walks to the spot; the hops that matter are placed by hand), then THE REPLAY judges them
const idle = (run, course, log, n) => { for (let i = 0; i < n && !isOver(run); i++) step(run, course, ''); };
const hop = (run, course, log, d) => { log.push({ t: run.t, d }); step(run, course, d); for (let i = 0; i < T.HOP_TICKS + 1; i++) step(run, course, ''); };
/** walk (the greedy bot) until the kid stands idle on lane `y` with no life lost → the log, or null */
function walkTo(seed, y, mode = 'match') {
  const course = createCourse(seed), run = createRun({ seed, mode }), bot = greedyBot({ seed }), log = [];
  let last = -9;
  while (!isOver(run) && run.t < 9000 && !run.hits) {
    if (run.st === 'idle' && run.y === y) return { course, run, log };
    if (run.y > y) return null;
    let d = bot(run, course);
    if (d === 'u' && run.y + 1 > y) d = '';
    if (d && run.t - last < 2) d = '';
    if (d) { log.push({ t: run.t, d }); last = run.t; }
    step(run, course, d);
  }
  return null;
}
/** the first seed whose first flight path the bot reaches alive, standing on plain grass right before it */
function atFlightPath(tag) {
  for (let s = 0; s < 400; s++) {
    const seed = `${tag}${s}`;
    let bb = null;
    for (let st = 3; st < 6 && !bb; st++) bb = specials(seed, st).bb;
    if (!bb || buildLane(seed, bb.y0 - 1).type !== 'grass') continue;
    const w = walkTo(seed, bb.y0 - 1);
    if (!w) continue;
    // (H3: the tell must come SOON — a kid who waits a whole lap beside the band is caught by the wall (5 lanes behind his best, 0.6 lanes / s):
    //  the scenario's own trap, not the moment's)
    const q = pulseAt(bb.pulse, w.run.t), wait = q.st === 'idle' ? q.left - bb.pulse.tell : -1;
    if (wait >= 40 && wait <= 200) return { seed, bb, ...w };
  }
  throw new Error('no course with a reachable flight path');
}
/** wait beside the band until its tell is `ahead` ticks away (alive, no hit) */
function waitForTell(w, ahead) {
  const p = w.bb.pulse;
  for (let i = 0; i < p.period + 5; i++) { const q = pulseAt(p, w.run.t); if (q.st === 'idle' && q.left - p.tell === ahead) return true; step(w.run, w.course, ''); if (w.run.hits) return false; }
  return false;
}

test('jaywalk-boom: STANDING ON the flight path when THE BLACKBIRD\'s tell begins, hopping clear, never hit → earned — the replay finds it', () => {
  const w = atFlightPath('boom');
  assert.ok(waitForTell(w, 30), 'beside the band, the tell 30 ticks away');
  hop(w.run, w.course, w.log, 'u');
  assert.equal(w.course.lane(w.run.y).type, 'flight'); assert.equal(pulseAt(w.bb.pulse, w.run.t).st, 'idle', 'on it BEFORE the tell');
  idle(w.run, w.course, w.log, 60);
  assert.equal(pulseAt(w.bb.pulse, w.run.t).st, 'tell', 'the runway lights are racing');
  assert.ok(w.bb.pulse.tell >= T.MIN_TELL_TICKS, '≥ 1.5 s to hop clear');
  hop(w.run, w.course, w.log, 'd');
  const ev = [];
  for (let i = 0; i < w.bb.pulse.tell + w.bb.pulse.pass && !w.run.boom; i++) step(w.run, w.course, '', ev);
  assert.equal(w.run.boom, 1); assert.ok(ev.some(e => e.e === 'boom'));
  const r = replay({ seed: w.seed, mode: 'match', log: w.log });
  assert.equal(r.feats.boom, true, 'THE REPLAY detects jaywalk-boom');
  assert.equal(r.used, w.log.length);
});

test('jaywalk-boom is NOT earned: hit by the Blackbird (stayed on the lane) · on the lane only AFTER the tell began · never on it at all', () => {
  // stayed: the Blackbird ends the run (ONE LIFE), no moment
  let w = atFlightPath('boom');
  waitForTell(w, 30); hop(w.run, w.course, w.log, 'u');
  const ev = [];
  for (let i = 0; i < 30 + w.bb.pulse.tell + w.bb.pulse.pass + 5; i++) step(w.run, w.course, '', ev);
  assert.ok(ev.some(e => e.e === 'out' && e.cause === 'blackbird'), 'the Blackbird hits a kid who stays: out');
  assert.equal(replay({ seed: w.seed, mode: 'match', log: w.log }).feats.boom, false);
  // late: stepped on during the tell, hopped clear again — not standing on it when the tell BEGAN
  w = atFlightPath('boom');
  waitForTell(w, 1); idle(w.run, w.course, w.log, 12);
  assert.equal(pulseAt(w.bb.pulse, w.run.t).st, 'tell');
  hop(w.run, w.course, w.log, 'u'); hop(w.run, w.course, w.log, 'd');
  idle(w.run, w.course, w.log, w.bb.pulse.tell + w.bb.pulse.pass);
  assert.equal(w.run.hits, 0); assert.equal(w.run.boom, 0);
  assert.equal(replay({ seed: w.seed, mode: 'match', log: w.log }).feats.boom, false);
  // never on it: waiting beside the band while it passes
  w = atFlightPath('boom');
  waitForTell(w, 1); idle(w.run, w.course, w.log, w.bb.pulse.tell + w.bb.pulse.pass + 5);
  assert.equal(replay({ seed: w.seed, mode: 'match', log: w.log }).feats.boom, false);
});

/** a seed whose first UFO (lanes 100–149) the bot reaches; → standing right below the beam's reach */
function atUfo(tag) {
  for (let s = 0; s < 400; s++) {
    const seed = `${tag}${s}`, u = specials(seed, 2).ufo;
    if (!u) continue;
    const w = walkTo(seed, u.y0 - 2);
    if (w && w.course.lane(u.y0 - 2).type === 'grass') return { seed, u, ...w };
  }
  throw new Error('no course with a reachable UFO');
}
/** hop toward the beam until it sweeps the cell beside the kid (near) — or over them (took) */
function chase(w, until) {
  for (let i = 0; i < 4000 && !isOver(w.run) && !until(w.run); i++) {
    let d = '';
    if (w.run.st === 'idle') {
      const dx = ufoX(w.u, w.run.t) - w.run.x, dy = ufoY(w.u, w.run.t) - (w.run.y * T.FP + 500);
      const want = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 'u' : 'd') : dx > 0 ? 'r' : 'l';
      const type = w.course.lane(w.run.y + (want === 'u' ? 1 : want === 'd' ? -1 : 0)).type;
      if ((type === 'grass' || type === 'flight') && (!w.log.length || w.run.t - w.log[w.log.length - 1].t >= 12)) d = want;   // (only ever onto plain ground: nothing else may end the run)
    }
    if (d) w.log.push({ t: w.run.t, d });
    step(w.run, w.course, d);
  }
}

test('jaywalk-ufo: THE UFO\'s beam sweeps the cell beside the kid and that UFO never takes them → earned; taken by THAT UFO → not; THE MOTHERSHIP never counts', () => {
  let earned = null, lost = null;
  for (let n = 0; n < 40 && !(earned && lost); n++) {
    const w = atUfo(`ufo${n}-`);
    chase(w, run => run.near[w.u.id] || run.hits);
    if (!w.run.near[w.u.id] || w.run.hits) continue;
    if (!earned) {
      const r = replay({ seed: w.seed, mode: 'match', log: w.log, until: w.run.t });
      assert.equal(r.feats.ufo, true, 'the beam swept beside them, nobody was taken');
      earned = { seed: w.seed, log: w.log.slice() };
    }
    if (!lost) {
      chase(w, run => run.took[w.u.id] || run.hits);   // (… and on into the beam)
      if (w.run.took[w.u.id]) { assert.equal(w.run.cause, 'ufo'); lost = { seed: w.seed, log: w.log.slice(), t: w.run.t + 1 }; }
    }
  }
  assert.ok(earned && lost, 'both logs were built');
  assert.equal(replay({ seed: lost.seed, mode: 'match', log: lost.log, until: lost.t }).feats.ufo, false, 'abducted by that UFO: no moment');
  const full = replay({ seed: lost.seed, mode: 'match', log: lost.log });
  assert.equal(full.feats.ufo, false, '… and still none when the run has ended');
  // the mothership: a kid taken at the cap who never met a UFO has no moment
  const run = createRun({ seed: 'm', mode: 'match' }), course = createCourse('m');
  run.t = T.MODES.match.cap; step(run, course, '');
  assert.deepEqual([resultOf(run).cause, resultOf(run).feats.ufo], ['taken', false]);
});

test('jaywalk-airfield (H6A): lane 400 in ONE run → earned, SOLO OR MATCH; lane 399 → not; jaywalk-mothership never in a solo run', () => {
  let got = null;
  for (let s = 0; s < 300 && !got; s++) {
    const seed = `air${s}`, course = createCourse(seed), run = createRun({ seed, mode: 'solo' });
    const bot = greedyBot({ seed }), log = [];
    let last = -9;
    while (!isOver(run) && run.t < 14000 && run.best < T.LOOP_LANES) { let d = bot(run, course); if (d && run.t - last < 2) d = ''; if (d) { log.push({ t: run.t, d }); last = run.t; } step(run, course, d); }
    if (run.best >= T.LOOP_LANES) got = { seed, log, t: run.t };
  }
  assert.ok(got, 'a solo run to THE AIRFIELD');
  const r = replay({ seed: got.seed, mode: 'solo', log: got.log });
  assert.ok(r.lanes >= 400 && r.feats.airfield === true, `lane ${r.lanes}: jaywalk-airfield`);
  const short = replay({ seed: got.seed, mode: 'solo', log: got.log.slice(0, got.log.length - 1) });
  assert.ok(short.lanes === 399 && short.feats.airfield === false, 'one hop short: lane 399, no moment');
  const m = replay({ seed: got.seed, mode: 'match', log: got.log });
  assert.ok(m.lanes >= 400 && m.feats.airfield === true, 'the same hops in a match: lane 400 — RIGHT OF WAY is no longer solo-only (H6A)');
  assert.ok(r.feats.mothership === false && m.feats.mothership === false, 'no mothership moment: the solo run has none, the match run ended before the cap');
});
