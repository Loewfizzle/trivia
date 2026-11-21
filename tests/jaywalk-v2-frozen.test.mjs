// JAYWALK J2 FIX — COURSE RULES v2 ARE FROZEN (docs/jaywalk.md "J2 FIX"): v2 went live at 2026-11-22 09:00 UTC with THE BLACKBIRD YOU CAN
// SEE's numbers; from here js/games/jaywalk/ with cv = 2 builds every lane, every hazard in time and replays every run BYTE FOR BYTE like the
// frozen copy (tests/fixtures/jaywalk-v2/ — course.js + tuning.js + engine.js + replay.js, never edited). A v2 run on the board, today's v2
// daily: all replay as they did. A change to v2 = a v3 at a later 4 am (versions.js). The v1 freeze is tests/jaywalk-v1-frozen.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as NOW from '../js/games/jaywalk/course.js';
import * as OLD from './fixtures/jaywalk-v2/course.js';
import { replay as replayNow, judgeRun as judgeNow } from '../js/games/jaywalk/replay.js';
import { replay as replayOld, judgeRun as judgeOld } from './fixtures/jaywalk-v2/replay.js';
import { createRun } from '../js/games/jaywalk/engine.js';
import { greedyBot, randomBot, playBot } from '../js/games/jaywalk/bot.js';

const seeds = (n, tag) => Array.from({ length: n }, (_, k) => `${tag}${k}x${(k * 7919) % 104729}`);

test('v2: every lane of 1,500 seeds (lanes 0–460) + 150 seeds through the loop (to 900) = the frozen generator, byte for byte', () => {
  let n = 0;
  const check = (seed, i) => {
    const a = JSON.stringify(NOW.buildLane(seed, i, 2)), b = JSON.stringify(OLD.buildLane(seed, i, 2));
    if (a !== b) assert.fail(`seed ${seed} lane ${i}:\n now ${a}\n was ${b}`);
    n++;
  };
  for (const s of seeds(1500, 'f')) for (let i = 0; i <= 460; i++) check(s, i);
  for (const s of seeds(150, 'L')) for (let i = 461; i <= 900; i++) check(s, i);
  for (const s of ['g1abc2def', 'gzz9k0q7m', 'd3f9a0c1e', 'start']) for (let i = 0; i <= 900; i++) check(s, i);
  assert.ok(n > 750000, `${n} lanes`);
});

test('v2: every stretch\'s specials (the runways: their lanes, speeds, tells, stagger) + the fairness checks = the frozen ones', () => {
  for (const s of seeds(400, 's')) for (let k = 0; k < 18; k++) {
    const a = NOW.specials(s, k, 2), b = OLD.specials(s, k, 2);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${s} stretch ${k}`);
    for (const r of a.rw) { assert.equal(NOW.runwaySlack(r.lanes), OLD.runwaySlack(r.lanes)); assert.equal(NOW.runwayWait(r.lanes), OLD.runwayWait(r.lanes)); }
  }
});

test('v2: the hazards in time — every pulse / mover / UFO position + the hit test over thousands of ticks = the frozen ones', () => {
  for (const s of seeds(40, 'h')) {
    const C = NOW.createCourse(s, { cv: 2 }), O = OLD.createCourse(s, { cv: 2 });
    for (let i = 0; i < 480; i++) {
      const L = C.lane(i), M = O.lane(i);
      for (let t = 0; t < 1800; t += 13) {
        if (L.pulse) assert.deepEqual(NOW.pulseAt(L.pulse, t), OLD.pulseAt(M.pulse, t));
        for (const x of [500, 2500, 4500, 6500, 8500]) assert.equal(NOW.laneHit(L, t, x), OLD.laneHit(M, t, x));
      }
    }
  }
});

test('v2: whole runs (the greedy bot, the lazy bot, the random bot — solo, match, daily) replay + judge (THE END CHECK) = the frozen ones', () => {
  let runs = 0;
  for (const mode of ['solo', 'match', 'daily']) {
    for (const s of seeds(40, `r${mode}`)) {
      const course = NOW.createCourse(s, { cv: 2 }), run = createRun({ seed: s, mode });
      const bot = runs % 3 === 0 ? greedyBot({ seed: s }) : runs % 3 === 1 ? greedyBot({ seed: s, lazy: true }) : randomBot({ seed: s });
      const log = playBot(run, course, bot, 26000);
      const a = replayNow({ seed: s, mode, log, cv: 2 }), b = replayOld({ seed: s, mode, log, cv: 2 });
      assert.deepEqual(a, b, `${mode} ${s}`);
      const end = { l: a.lanes, t: a.tick };
      assert.deepEqual(judgeNow({ seed: s, mode, log, cv: 2, end }), judgeOld({ seed: s, mode, log, cv: 2, end }));
      assert.deepEqual(judgeNow({ seed: s, mode, log, cv: 2, end: { l: a.lanes + 1, t: a.tick } }), judgeOld({ seed: s, mode, log, cv: 2, end: { l: a.lanes + 1, t: a.tick } }));
      runs++;
    }
  }
  assert.equal(runs, 120);
});

test('v2: the frozen copy is never edited (its header names it) and the live rules files never import it', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  for (const f of readdirSync(new URL('./fixtures/jaywalk-v2/', import.meta.url))) assert.match(readFileSync(new URL(`./fixtures/jaywalk-v2/${f}`, import.meta.url), 'utf8'), /^\/\/ FROZEN \(JAYWALK J2 FIX, Nov 21 2026\)/, f);
  for (const f of ['course.js', 'engine.js', 'replay.js', 'tuning.js', 'logic.js', 'versions.js']) assert.doesNotMatch(readFileSync(new URL(`../js/games/jaywalk/${f}`, import.meta.url), 'utf8'), /(from|import\()\s*['"][^'"]*fixtures/, f);
});
