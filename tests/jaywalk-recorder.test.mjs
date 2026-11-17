// JAYWALK — THE GO-LIVE REVIEW: THE RECORDER AND THE JUDGE ARE ONE BOUND (docs/jaywalk.md "THE GO-LIVE REVIEW" — the audit's two rules
// findings). The phone's recorder (engine.js#canLog) checked only the 2-tick gap, the judge (replay.js#logProblem) also "20 in any one
// second" + "nothing at or past the cap": an honest phone could write a log the judge refused WHOLE —
//   · A TAP IN THE MOTHERSHIP's OWN TICK: logged at t = cap (the engine lifts the kid there and never plays it) → "past the cap" → the
//     finisher's whole run scored as a kid who never hopped (the best player in the room: 0 lanes, no BEAM ME UP, no best)
//   · A FAST MASH: two thumbs / three fingers at > 20 taps a second for one second → "too fast" → the same
// Both are ONE function now (engine.js#inputProblem): the recorder logs an input only where the judge accepts it, and what it does not
// log it does not play — so the run on the phone IS the run the judge replays. The judge is exactly as strict as it was.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, resultOf, step, isOver, canLog, inputProblem } from '../js/games/jaywalk/engine.js';
import { replay, logProblem, judgeRun, unpackLog } from '../js/games/jaywalk/replay.js';
import { SHIP_RUN } from './fixtures/jaywalk-ship-run.mjs';
import { greedyBot } from '../js/games/jaywalk/bot.js';

const { MODES, TICK_HZ, MAX_INPUTS_PER_SEC, MIN_INPUT_GAP } = T;
/** the phone's own loop (view.js#hop + tick): a queue of two, an input logged ONLY where the recorder allows it, played only if logged */
function phone(seed, mode, want, maxTicks) {
  const course = createCourse(seed), run = createRun({ seed, mode }), log = [], queue = [];
  for (let n = 0; n < maxTicks && !isOver(run); n++) {
    for (const d of want(run, course)) if (queue.length < 2) queue.push(d);
    let d = '';
    if (queue.length && canLog(log, run.t, queue[0], mode)) { d = queue.shift(); log.push({ t: run.t, d }); }
    step(run, course, d, []);
  }
  return { run, log, course };
}
const lcg = s => () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;

test('ONE BOUND, BOTH WAYS: what the recorder logs the judge accepts — and what the recorder refuses the judge would refuse', () => {
  for (const mode of Object.keys(MODES)) {
    const rnd = lcg(mode.length * 7919 + 13), log = [];
    let refused = 0;
    const cap = MODES[mode].cap || 0;
    for (let t = 0; t < 4000 || (cap && t < cap + 60); t += t === 4000 && cap ? cap - 4300 : 1 + Math.floor(rnd() * 3)) {   // (… and across the mode's cap)
      const d = T.DIRS[Math.floor(rnd() * T.DIRS.length)];
      if (canLog(log, t, d, mode)) { log.push({ t, d }); assert.equal(logProblem(log, mode), null, `${mode}: logged at ${t} → still a log the judge takes`); }
      else { refused++; assert.notEqual(logProblem([...log, { t, d }], mode), null, `${mode}: refused at ${t} → the judge would refuse it too`); }
    }
    assert.ok(log.length > 600 && refused > 100, `${mode}: ${log.length} logged, ${refused} refused`);
    assert.equal(inputProblem(log, log.length, log[log.length - 1].t + 1, 'u', mode), 'too fast', 'the reason is the judge\'s own word');
    assert.equal(canLog(log, 99999, 'x', mode), false, 'never a way that is not a way');
  }
});

test('A FAST MASH never voids a run: at 16 · 20 · 21 · 30 · 60 taps a second the phone\'s log is accepted and replays to the phone\'s own result', () => {
  let runs = 0, capped = 0;
  for (const mode of ['solo', 'match']) for (const rate of [16, 20, 21, 30, 60]) for (let k = 0; k < 6; k++) {
    const seed = `mash-${mode}-${rate}-${k}`, bot = greedyBot({ seed }), every = Math.max(1, Math.round(TICK_HZ / rate));
    // the bot plays; from tick 300 a hand drums UP for 70 ticks (a full second + of it)
    const { run, log } = phone(seed, mode, (r, c) => { const out = []; const b = bot(r, c); if (b) out.push(b); if (r.t >= 300 && r.t < 370 && r.t % every === 0) out.push('u'); return out; }, 2400);
    assert.equal(logProblem(log, mode), null, `${seed}: the judge takes the log (${log.length} inputs)`);
    for (let i = MAX_INPUTS_PER_SEC; i < log.length; i++) assert.ok(log[i].t - log[i - MAX_INPUTS_PER_SEC].t >= TICK_HZ, 'never 21 inputs inside one second');
    if (rate > MAX_INPUTS_PER_SEC && log.filter(h => h.t >= 300 && h.t < 372).length >= MAX_INPUTS_PER_SEC) capped++;
    const live = resultOf(run), j = judgeRun({ seed, mode, log, until: isOver(run) ? null : run.t });
    assert.ok(j.ok, `${seed}: judged (${j.why || ''})`);
    assert.deepEqual([j.result.lanes, j.result.cause, j.result.end], [live.lanes, live.cause, live.end], `${seed}: the judge's run = the phone's (lane ${live.lanes})`);
    runs++;
  }
  assert.ok(runs === 60 && capped >= 3,`${runs} runs; the mash really reached the recorder's limit in ${capped}`);
});

test('A TAP IN THE MOTHERSHIP\'s OWN TICK never voids the finisher: a REAL 2,043-lane run to 6:00, a thumb coming down as she arrives → judged TAKEN at the phone\'s own lanes', () => {
  const cap = MODES.match.cap, { seed, log: packed, lanes, hops } = SHIP_RUN, src = unpackLog(packed);
  assert.equal(src.length, hops); assert.equal(logProblem(src, 'match'), null);
  for (const taps of [0, 1, 3, 12]) {   // (no tap · one in her own tick · the last three ticks · a drum roll through the last twelve)
    let i = 0;
    const { run, log } = phone(seed, 'match', r => { const out = []; if (i < src.length && src[i].t === r.t) out.push(src[i++].d); if (taps && r.t > cap - taps) out.push('u'); return out; }, cap + 10);
    if (taps < 12) assert.equal(run.st, 'taken', `${taps} taps: still standing when THE MOTHERSHIP arrives`);   // (a drum roll may hop her into the traffic: an honest OUT, judged the same)
    assert.ok(log.every(h => h.t < cap), `${taps} taps: nothing is logged at or past the cap (the last at ${log[log.length - 1].t}, the cap ${cap})`);
    assert.equal(logProblem(log, 'match'), null, `${taps} taps: the judge takes the log`);
    const live = resultOf(run), j = judgeRun({ seed, mode: 'match', log });
    assert.ok(j.ok && !!j.result.taken === (run.st === 'taken'), `${taps} taps: judged as the phone saw it (${j.why || ''})`);
    assert.deepEqual([j.result.lanes, j.result.end], [live.lanes, live.end], `${taps} taps: MADE IT TO THE MOTHERSHIP at lane ${live.lanes} — the phone's own`);
    if (run.st === 'taken') assert.ok(live.lanes >= lanes && live.feats.mothership,'BEAM ME UP\'s flag, the fixture\'s lanes at least');
    assert.equal(replay({ seed, mode: 'match', log }).used, log.length, 'every logged hop was played');
  }
  // (what the old recorder wrote: ONE more entry in her tick → the whole run refused — the judge is as strict as it was)
  assert.equal(logProblem([...src, { t: cap, d: 'u' }], 'match'), 'past the cap'); assert.equal(judgeRun({ seed, mode: 'match', log: [...src, { t: cap, d: 'u' }] }).ok, false);
  assert.equal(canLog(src, cap, 'u', 'match'), false, 'the recorder never writes it'); assert.equal(canLog([], cap - 1, 'u', 'match'), true);
  assert.equal(canLog([], cap + 500, 'u', 'solo'), true, 'solo has no cap');
});

test('the views pass the run\'s mode to the recorder (the cap is the mode\'s) — the game AND the lab', () => {
  const { readFileSync } = require_fs(), v = readFileSync(new URL('../js/games/jaywalk/view.js', import.meta.url), 'utf8'), l = readFileSync(new URL('../js/games/jaywalk/lab.js', import.meta.url), 'utf8');
  assert.match(v, /if \(queue\.length && canLog\(log, run\.t, queue\[0\], run\.mode\)\)/); assert.match(l, /if \(queue\.length && canLog\(log, run\.t, queue\[0\], run\.mode\)\)/);
  const r = readFileSync(new URL('../js/games/jaywalk/replay.js', import.meta.url), 'utf8');
  assert.match(r, /const why = inputProblem\(log, i, h && h\.t, h && h\.d, mode\);/, 'the judge reads the SAME function');
  assert.ok(MIN_INPUT_GAP === 2 && MAX_INPUTS_PER_SEC === 20, 'the bounds themselves are unchanged');
});
import * as FS from 'node:fs';
function require_fs() { return FS; }
