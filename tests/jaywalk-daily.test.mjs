// DAILY A — JAYWALK's DAILY, the PURE half (api/_lib/jaywalk-tries.js): three tries, a 4th refused, an open try blocks a new one, the try's
// score from its proof node through THE JUDGE (mode 'daily', tick 0 = the SERVER's go), a live try vs a gone one, the best try = the day.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TRIES, CAP_MS, LEAD_MS, GRACE_MS, QUIET_MS, openTry, openOf, closeTry, scoreTry, liveTry, bestTry, dayScore, triesView, leftOf, usedOf } from '../api/_lib/jaywalk-tries.js';
import { jwScore, jwLanes } from '../js/core/daily-best.js';
import { createRun, step, isOver, resultOf, canLog } from '../js/games/jaywalk/engine.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { greedyBot } from '../js/games/jaywalk/bot.js';
import { packLog } from '../js/games/jaywalk/replay.js';
import { MODES, TICK_HZ } from '../js/games/jaywalk/tuning.js';

const SEED = 'd123456789';
/** a run played by the greedy bot on the daily course, uploaded as a proof node's chunks every `every` ms of its own clock (+ `lag` ms) */
function played({ seed = SEED, go = 1_000_000, every = 1000, lag = 300, stopAt = null } = {}) {
  const run = createRun({ seed, mode: 'daily' }), course = createCourse(seed), bot = greedyBot({ seed }), log = [];
  while (!isOver(run) && (stopAt == null || run.t < stopAt)) { let d = bot(run, course) || ''; if (d && !canLog(log, run.t, d, 'daily')) d = ''; if (d) log.push({ t: run.t, d }); step(run, course, d); }
  const c = {}, perChunk = Math.round(every * TICK_HZ / 1000);
  let from = 0, k = 0;
  for (let t = perChunk; from < log.length; t += perChunk) {
    let to = from; while (to < log.length && log[to].t < t) to++;
    if (to > from) { c[k++] = { s: packLog(log, from), at: go + Math.round(t * 1000 / TICK_HZ) + lag }; c[k - 1].s = packLog(log.slice(0, to), from); from = to; }
  }
  return { node: { go, z: go + CAP_MS + GRACE_MS, c }, live: resultOf(run), log };
}

test('the numbers: 3 tries, THE MOTHERSHIP at 5:00, a 3 s count-in, the chunks\' window = the cap + 90 s', () => {
  assert.equal(TRIES, 3); assert.equal(CAP_MS, 300000); assert.equal(MODES.daily.cap, 18000); assert.equal(LEAD_MS, 3000); assert.equal(GRACE_MS, 90000);
});

test('START: a try opens with the server\'s GO (+ the count-in) and z; an OPEN try blocks a new one; a 4th is refused', () => {
  let rec = null;
  const a = openTry(rec, { uid: 'u1', now: 1000, startedAt: 1000 });
  assert.equal(a.i, 0); assert.equal(a.go, 4000); assert.equal(a.z, 4000 + CAP_MS + GRACE_MS);
  rec = a.record;
  assert.deepEqual(openTry(rec, { uid: 'u1', now: 2000 }), { refused: 'open' }, 'the open try must be closed first (condition 1)');
  assert.equal(openOf(rec).i, 0); assert.equal(usedOf(rec), 1); assert.equal(leftOf(rec), 2);
  rec = closeTry(rec, 0, { l: 10, k: 600, s: jwScore(10, 600), w: 'car' }, { now: 9000 });
  assert.equal(closeTry(rec, 0, { l: 99 }, { now: 9001 }), null, 'a closed try is never closed again');
  for (const i of [1, 2]) { const o = openTry(rec, { uid: 'u2', now: 10000 * i }); assert.equal(o.i, i); rec = closeTry(o.record, i, { l: 3 * i, k: 10, s: jwScore(3 * i, 10) }, { now: 10000 * i + 5 }); }
  assert.deepEqual(openTry(rec, { uid: 'u1', now: 99999 }), { refused: 'no_tries' });
  assert.equal(leftOf(rec), 0);
  assert.equal(bestTry(rec).i, 0, 'the best try: 10 lanes'); assert.equal(dayScore(rec), jwScore(10, 600));
  assert.deepEqual(triesView(rec).map(x => x.l), [10, 3, 6]);
});

test('the try\'s SCORE = THE JUDGE on its proof node (mode daily, tick 0 = GO): the replay = the live run, to the lane', () => {
  const { node, live } = played();
  const r = scoreTry({ seed: SEED, go: node.go, node });
  assert.ok(!r.bad, `judged: ${r.bad}`);
  assert.equal(r.l, live.lanes); assert.equal(r.k, live.tick); assert.equal(r.s, jwScore(live.lanes, live.tick)); assert.equal(jwLanes(r.s), live.lanes);
});

test('a try left AS IT STANDS (a refresh / hidden / THE ROOM WINS mid-run): the lanes reached count, never more', () => {
  const { node, live } = played({ stopAt: 40 * TICK_HZ });
  assert.ok(!isOver({ st: 'run' }));
  const r = scoreTry({ seed: SEED, go: node.go, node });
  assert.ok(!r.bad); assert.ok(r.l <= live.lanes + 0 && r.l >= Math.max(0, live.lanes - 1), `as it stands: ${r.l} of ${live.lanes} reached`);
});

test('forged: a log AHEAD of the clock refused (0 lanes, bad) · a SLOWED log CUT · a DROPPED signal (a silence, then a burst) accepted in full', () => {
  const { node, live } = played();
  const keys = Object.keys(node.c);
  // ahead: every chunk stamped 6 s early
  const ahead = { ...node, c: Object.fromEntries(keys.map(k => [k, { ...node.c[k], at: node.c[k].at - 6000 }])) };
  const a = scoreTry({ seed: SEED, go: node.go, node: ahead });
  assert.ok(a.bad && a.l === 0, `ahead → refused (${a.bad})`);
  // slowed: the chunks arrive at 1.6× real time (the game run in slow motion)
  const slow = { ...node, c: Object.fromEntries(keys.map(k => [k, { ...node.c[k], at: node.go + Math.round((node.c[k].at - node.go) * 1.6) }])) };
  const s = scoreTry({ seed: SEED, go: node.go, node: slow });
  assert.ok(!s.bad && s.cut === 1 && s.l < live.lanes, `slowed → CUT at ${s.l} of ${live.lanes}`);
  // dropped: chunks 8 … 24 held offline, then landing together just before the 40th's own time
  assert.ok(keys.length > 30, `a long enough run (${keys.length} chunks)`);
  const held = Object.fromEntries(keys.map((k, n) => [k, n >= 8 && n < 25 ? { ...node.c[k], at: node.c[keys[25]].at - 100 + (n - 8) } : node.c[k]]));
  assert.ok(node.c[keys[25]].at - node.c[keys[7]].at < 75000, 'the silence fits THE DROPPED SIGNAL');
  const d = scoreTry({ seed: SEED, go: node.go, node: { ...node, c: held } });
  assert.ok(!d.bad && !d.cut && d.l === live.lanes, `a dropped signal → the full run (${d.l} of ${live.lanes})`);
  // a hole in the chunks / a bad string → refused
  assert.ok(scoreTry({ seed: SEED, go: node.go, node: { ...node, c: { 0: node.c[0], 2: node.c[2] } } }).bad);
});

test('liveTry: in play while chunks keep arriving; gone once its e is set, z has passed, or it went quiet for QUIET_MS', () => {
  const t = { go: 1000, z: 1000 + CAP_MS + GRACE_MS };
  assert.ok(liveTry(t, { go: 1000 }, 1000 + QUIET_MS - 1), 'just opened (GO counts as the last sign)');
  assert.ok(!liveTry(t, { go: 1000 }, 1000 + QUIET_MS + 1), 'nothing since GO for QUIET_MS');
  assert.ok(liveTry(t, { go: 1000, c: { 0: { s: 'U0', at: 50000 } } }, 50000 + 5000));
  assert.ok(!liveTry(t, { go: 1000, e: 60000, c: { 0: { s: 'U0', at: 50000 } } }, 50001), 'the phone ended it');
  assert.ok(!liveTry(t, null, t.z), 'past z');
  assert.ok(!liveTry({ ...t, e: 5 }, null, 2000), 'already closed');
});
