// JAYWALK J2 — COURSE RULES v1 STAY EXACTLY TODAY's (docs/jaywalk.md "COURSE RULES v2"): js/games/jaywalk/ with cv = 1 (the default
// everywhere) builds every lane and replays every run BYTE FOR BYTE like the frozen copy of the rules as they shipped up to J1
// (tests/fixtures/jaywalk-v1/ — course.js + tuning.js + engine.js + replay.js at 28972e7b; never edited). A v1 run already on the board,
// an old phone's run, today's daily: all replay as they always did.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as NOW from '../js/games/jaywalk/course.js';
import * as OLD from './fixtures/jaywalk-v1/course.js';
import { replay as replayNow } from '../js/games/jaywalk/replay.js';
import { replay as replayOld } from './fixtures/jaywalk-v1/replay.js';
import { createRun, step, isOver } from '../js/games/jaywalk/engine.js';
import { greedyBot, randomBot, playBot } from '../js/games/jaywalk/bot.js';

const seeds = (n, tag) => Array.from({ length: n }, (_, k) => `${tag}${k}x${(k * 7919) % 104729}`);

test('v1: every lane of 3,000 seeds (lanes 0–260) + 200 seeds through the loop (0–900) = the frozen generator, byte for byte', () => {
  let n = 0;
  const check = (seed, i) => {
    const a = JSON.stringify(NOW.buildLane(seed, i, 1)), b = JSON.stringify(OLD.buildLane(seed, i));
    if (a !== b) assert.fail(`seed ${seed} lane ${i}:\n now ${a}\n was ${b}`);
    n++;
  };
  for (const s of seeds(3000, 'f')) for (let i = 0; i <= 260; i++) check(s, i);
  for (const s of seeds(200, 'L')) for (let i = 261; i <= 900; i++) check(s, i);
  // (+ the shapes real runs use: a solo seed from GO, a match seed, a daily seed)
  for (const s of ['g1abc2def', 'gzz9k0q7m', 'd3f9a0c1e', 'start']) for (let i = 0; i <= 700; i++) check(s, i);
  assert.ok(n > 900000, `${n} lanes`);
});

test('v1: the course object defaults to v1 — createCourse(seed) = createCourse(seed, { cv: 1 }) = the frozen one, any order', () => {
  for (const s of seeds(40, 'o')) {
    const a = NOW.createCourse(s), b = NOW.createCourse(s, { cv: 1 }), c = OLD.createCourse(s);
    assert.equal(a.cv, 1); assert.equal(b.cv, 1);
    for (let i = 600; i >= 0; i -= 7) assert.equal(JSON.stringify(a.lane(i)), JSON.stringify(c.lane(i)));
    for (let i = 0; i <= 600; i += 3) assert.equal(JSON.stringify(b.lane(i)), JSON.stringify(c.lane(i)));
  }
});

test('v1: the hazards in time — every pulse / mover / UFO position + the hit test over thousands of ticks = the frozen ones', () => {
  for (const s of seeds(60, 'h')) {
    const C = NOW.createCourse(s), O = OLD.createCourse(s);
    for (let i = 0; i < 480; i++) {
      const L = C.lane(i), M = O.lane(i);
      for (let t = 0; t < 1800; t += 13) {
        if (L.pulse) assert.deepEqual(NOW.pulseAt(L.pulse, t), OLD.pulseAt(M.pulse, t));
        for (const x of [500, 2500, 4500, 6500, 8500]) assert.equal(NOW.laneHit(L, t, x), OLD.laneHit(M, t, x));
      }
    }
  }
});

test('v1: whole runs (the greedy bot, the lazy bot, the random bot — solo, match, daily) replay = the frozen replay, result for result', () => {
  let runs = 0;
  for (const mode of ['solo', 'match', 'daily']) {
    for (const s of seeds(70, `r${mode}`)) {
      const course = NOW.createCourse(s), run = createRun({ seed: s, mode });
      const bot = runs % 3 === 0 ? greedyBot({ seed: s }) : runs % 3 === 1 ? greedyBot({ seed: s, lazy: true }) : randomBot({ seed: s });
      const log = playBot(run, course, bot, 26000);
      const a = replayNow({ seed: s, mode, log }), b = replayOld({ seed: s, mode, log }), c = replayNow({ seed: s, mode, log, cv: 1 });
      assert.deepEqual(a, b, `${mode} ${s}`); assert.deepEqual(c, b, `${mode} ${s} (cv 1)`);
      runs++;
    }
  }
  assert.equal(runs, 210);
});

test('v1: the frozen copy is never edited (its header names it) and the live rules files never import it', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  for (const f of readdirSync(new URL('./fixtures/jaywalk-v1/', import.meta.url))) assert.match(readFileSync(new URL(`./fixtures/jaywalk-v1/${f}`, import.meta.url), 'utf8'), /^\/\/ FROZEN \(JAYWALK J2, Nov 21 2026\)/, f);
  for (const f of ['course.js', 'engine.js', 'replay.js', 'tuning.js', 'logic.js', 'versions.js']) assert.doesNotMatch(readFileSync(new URL(`../js/games/jaywalk/${f}`, import.meta.url), 'utf8'), /(from|import\()\s*['"][^'"]*fixtures/, f);
  void step; void isOver;
});
