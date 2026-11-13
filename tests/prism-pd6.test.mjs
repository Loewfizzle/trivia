// PD-6 — PRISM DROP: THE SLAM's WEIGHT (the sound + THE BOARD KICK) — the parts a node test can read; the kick's motion itself is measured in a
// browser (the pass log: night board + light 2.5 pt and back to 0, day board 2.5 pt, Reduced effects / prefers-reduced-motion none; 60 fps at
// 4x CPU with SLAM spammed — prism-shots PERF_SETS=slam).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE BOARD KICK: a Web Animation on the board (+ the night light), transform only, OFF when reduced — the old reflow dip gone', () => {
  const v = read('js/games/prism/view.js');
  const fn = v.slice(v.indexOf('function kick()'), v.indexOf('function bump('));
  assert.match(fn, /if \(reduced\(\) \|\|/, 'OFF under Reduced effects + prefers-reduced-motion (reduced() = both)');
  assert.match(fn, /els\.boardWrap/); assert.match(fn, /look === 'neon' && els\.light/, 'the light layer moves with the board');
  assert.match(fn, /\.animate\(KICK, \{ duration: 120 \}\)/, '~0.1 s');
  const kf = v.slice(v.indexOf('const KICK = ['), v.indexOf('let kicks'));
  assert.doesNotMatch(kf.replace(/transform/g, '').replace(/easing|offset/g, ''), /[a-z]+:\s*'(?!translateY|cubic|ease)/i, 'transform only');
  assert.match(v, /const KICK_PT = 2\.5;/, 'a 2–3 pt dip');
  assert.match(v.slice(v.indexOf("case 'hard':"), v.indexOf("case 'lock':")), /kick\(\);/, 'every slam kicks');
  assert.doesNotMatch(v + read('css/prism.css'), /pd-thud\b(?! CSS dip)/, 'the old CSS dip (restarted with a forced reflow) is gone');
});

test('THE SLAM sound: deeper + a touch heavier, still in the key (note()), still quieter than a clear', () => {
  const a = read('js/games/prism/audio.js');
  const hard = a.slice(a.indexOf('    hard() {'), a.indexOf('    hold() {'));
  const th = /thump\(at, \{ gain: ([\d.]+), from: (\d+), to: (\d+), dur: ([\d.]+) \}\)/.exec(hard);
  assert.ok(th, 'the thump has its own deeper numbers');
  const [, gain, from, to, dur] = th.map(Number);
  assert.ok(from < 130 && to < 42 && dur > 0.22, `deeper + longer than before (130 → 42 Hz, 0.22 s): ${from} → ${to} Hz, ${dur} s`);
  assert.ok(gain <= 0.25, `still quiet (${gain})`);
  assert.match(hard, /note\(0, 2\)/); assert.match(hard, /note\(0, 3\)/, 'the tonic, an octave up — a phone speaker feels it');
  for (const g of [...hard.matchAll(/pluck\([^)]*gain: ([\d.]+)/g)].map(m => Number(m[1]))) assert.ok(g <= 0.1, `each tone under a clear's 0.085-ish notes + the lock's (${g})`);
});
