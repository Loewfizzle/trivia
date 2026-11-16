// JAYWALK H1 — THE SERVER HALF (api/_lib/jaywalk.js — pure: THE UNIT JOB INSTALLS NOTHING): verifyRun = THE HOP LOG's bounds + THE
// REPLAY → the server's own result. An honest log comes back with the phone's result; a FORGED one (ticks backwards, too fast, past the
// cap, hops after the run's end) is refused. (Wiring it into /api/report + the solo best: H3 / H4.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { verifyRun, logFromChunks } from '../api/_lib/jaywalk.js';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, resultOf, step, isOver, canLog } from '../js/games/jaywalk/engine.js';
import { packLog } from '../js/games/jaywalk/replay.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';

/** an honest finished run: the bot plays, then the kid stands until the run ends */
function honest(seed, mode, ticks = 1500) {
  const course = createCourse(seed), run = createRun({ seed, mode });
  const log = playBot(run, course, greedyBot({ seed }), ticks);
  while (!isOver(run)) step(run, course, '');
  return { seed, mode, log, live: resultOf(run) };
}

test('an honest log → ok + THE SERVER\'s result = the phone\'s (lanes, the tick, the cause, the lives, the feats)', () => {
  for (const mode of T.MODE_IDS) for (let s = 0; s < 6; s++) {
    const h = honest(`srv${s}`, mode);
    const v = verifyRun(h);
    assert.equal(v.ok, true, `${mode} srv${s}: ${v.why}`);
    const { over, ...live } = h.live; void over;
    assert.deepEqual(v.result, live);
    assert.deepEqual(verifyRun(JSON.parse(JSON.stringify(h))), v, 'through JSON');
  }
});

test('A FORGED LOG IS REFUSED: ticks backwards · too fast · past the cap · a hop after the run ended · a bad entry / seed / mode / lives · too long', () => {
  const h = honest('forge', 'match', 2400), log = h.log;
  assert.ok(log.length > 100);
  const why = l => verifyRun({ ...h, log: l }).why;
  assert.equal(verifyRun(h).ok, true);
  const back = log.slice(); back[50] = { t: back[49].t - 4, d: 'u' };
  assert.equal(why(back), 'ticks not rising');
  const same = log.slice(); same[50] = { t: same[49].t, d: 'u' };
  assert.equal(why(same), 'ticks not rising');
  const fast = log.slice(0, 40); fast.push({ t: fast[39].t + 1, d: 'u' });
  assert.equal(why(fast), 'too fast');
  const burst = []; for (let i = 0; i < 40; i++) burst.push({ t: i * 2, d: 'u' });   // (30 inputs a second: no hand)
  assert.equal(why(burst), 'too fast');
  assert.equal(why([{ t: T.MODES.match.cap, d: 'u' }]), 'past the cap');
  assert.equal(why([{ t: T.MODES.match.cap + 500, d: 'u' }]), 'past the cap');
  // a hop logged after the run had ended (the kid was out): the replay never plays it
  const solo = honest('forge', 'solo', 600);
  const late = [...solo.log, { t: solo.live.end + 30, d: 'u' }];
  assert.equal(verifyRun({ ...solo, log: late }).why, 'past the end');
  for (const bad of [[{ t: 1.5, d: 'u' }], [{ t: -1, d: 'u' }], [{ t: 3, d: 'x' }], [null], [{ t: '3', d: 'u' }], 'u0', null]) assert.match(String(why(bad)), /entry|log/);
  assert.equal(verifyRun({ ...h, seed: '' }).why, 'seed'); assert.equal(verifyRun({ ...h, seed: 'x'.repeat(65) }).why, 'seed'); assert.equal(verifyRun({ ...h, seed: 7 }).why, 'seed');
  assert.equal(verifyRun({ ...h, mode: 'endless' }).why, 'mode');
  assert.equal(verifyRun({ ...h, lives: 9 }).why, 'lives'); assert.equal(verifyRun({ ...solo, lives: 3 }).why, 'lives');
  const long = []; for (let i = 0; i < T.MAX_LOG + 1; i++) long.push({ t: i * 3, d: 'u' });
  assert.equal(verifyRun({ seed: 's', mode: 'solo', log: long }).why, 'too long');
  // a forged CLAIM changes nothing: the result is the replay's, whatever else rides along
  assert.deepEqual(verifyRun({ ...h, lanes: 99999, feats: { boom: true } }).result, verifyRun(h).result);
  // a different seed with the same hops is a different run
  assert.notDeepEqual(verifyRun({ ...h, seed: 'forge2' }).result, verifyRun(h).result);
});

test('the phone\'s recorder never makes a log the server refuses (the same bounds: canLog) · the proof node\'s chunks → the log', () => {
  const log = [];
  for (let t = 0; t < 400; t++) if (canLog(log, t, 'u')) log.push({ t, d: 'u' });
  assert.ok(log.every((h, i) => !i || h.t - log[i - 1].t >= T.MIN_INPUT_GAP));
  assert.equal(canLog(log, 9999, 'x'), false);
  const h = honest('chunks', 'match', 1200), chunks = {};
  for (let i = 0, n = 0; i < h.log.length; i += 40, n++) chunks[n] = packLog(h.log.slice(0, i + 40), i);
  assert.deepEqual(logFromChunks(chunks), h.log, 'the chunks joined = the hop log');
  assert.deepEqual(logFromChunks(Object.values(chunks)), h.log, 'as an array too');
  assert.deepEqual(logFromChunks(null), [], 'GO written, no hop yet: an empty log (a silent player still has a run)');
  assert.equal(logFromChunks({ 0: chunks[0], 2: chunks[2] }), null, 'a hole in the chunks');
  assert.equal(logFromChunks({ 0: 'u0' }), null, 'a bad chunk');
  assert.equal(verifyRun({ seed: 'chunks', mode: 'match', log: logFromChunks(null) }).ok, true, 'a player who never hopped: the wall takes their lives — a real, replayed result');
});

test('NOT a function (the 8 stay 8) + never imports fb.js', () => {
  const fns = readdirSync(new URL('../api/', import.meta.url)).filter(f => f.endsWith('.js'));
  assert.equal(fns.length, 8);
  const src = readFileSync(new URL('../api/_lib/jaywalk.js', import.meta.url), 'utf8');
  assert.deepEqual([...src.matchAll(/^import .* from '([^']+)'/gm)].map(m => m[1]), ['../../js/games/jaywalk/replay.js', '../../js/games/jaywalk/tuning.js', '../../js/games/jaywalk/logic.js']);   // (H3: + the pure seedOf)
});
