// JAYWALK SMOOTH — what must hold (docs/jaywalk.md "SMOOTH"): THE FRAME METER is the lab's alone + reads dropped / worst frames.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DROP_MS, BIG_MS, frameStats } from '../js/games/jaywalk/lab-hud-stats.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE FRAME METER: lazy, the lab only — never the live game, never the start bundle', () => {
  assert.match(read('js/games/jaywalk/lab.js'), /Q\.get\('hud'\) === '1'[^\n]*lazyImport\(import\('\.\/lab-hud\.js'\)/);
  for (const f of ['js/games/jaywalk/view.js', 'js/games/jaywalk/night.js', 'js/games/jaywalk/index.js', 'js/games/preload-graph.js']) assert.doesNotMatch(read(f), /lab-hud/, f);
});

test('THE FRAME METER reads drops + the worst frame, not the median', () => {
  const steady = Array(600).fill(16.7), s = frameStats(steady);
  assert.equal(s.drops, 0); assert.equal(s.big, 0); assert.ok(Math.abs(s.fps - 59.9) < 0.2);
  const hitchy = [...steady.slice(0, 590), ...Array(6).fill(25), ...Array(4).fill(50)], h = frameStats(hitchy);
  assert.equal(h.p50, 16.7, 'the median cannot see it');
  assert.equal(h.drops, 10); assert.equal(h.big, 4); assert.equal(h.worst, 50);
  assert.ok(DROP_MS === 20 && BIG_MS === 33);
  assert.deepEqual(frameStats([]), { n: 0, fps: 0, drops: 0, big: 0, p50: 0, p95: 0, p99: 0, worst: 0 });
});
