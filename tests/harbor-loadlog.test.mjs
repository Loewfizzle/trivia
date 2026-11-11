// POLISH 5 — THE LOAD LOG (core/harbor-loadlog.js): rows before + after the reveal, what counts as a change the eye sees, the window.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLoadLog, visibleRow, keyDiff, LOAD_LOG_MS } from '../js/core/harbor-loadlog.js';

test('the load log: before the reveal nothing is visible; after it, a re-layout / crossfade / applied tier step / instant sky is', () => {
  let t = 0;
  const L = createLoadLog(0, { now: () => t });
  t = 100; L.add('layout', 'the start'); L.add('bake', 'swap (dark) · first', { fade: false });
  t = 900; L.reveal('ready', 't2');
  assert.equal(L.rows.find(r => r.kind === 'reveal').a, 0);
  t = 1200; L.add('bake', 'crossfade 6000 ms · tones (the weather: slow)', { fade: false });
  L.add('sky', 'repainted · faded over 6000 ms', { slow: true });
  L.add('power', 'the skyline +20 (the power-on)');
  L.add('wx', 'live overcast');
  assert.equal(L.visible().length, 0, 'slow blends, the power-on and notes never count');
  t = 1500; L.add('layout', 'the title\'s rects moved');
  L.add('bake', 'crossfade 1200 ms · camera', { fade: true });
  L.add('tier', '2 → 1', { applied: true });
  L.add('clouds', 're-planned', { replan: true, slow: false });
  assert.deepEqual(L.visible().map(r => r.kind), ['layout', 'bake', 'tier', 'clouds']);
  assert.ok(L.lines().some(l => l.startsWith('−0.80s') && l.includes('layout')), 'a row before the reveal reads as minus from it');
  assert.ok(L.lines().some(l => l.startsWith('+0.60s') && l.includes('⚠')), 'a visible row after it is flagged');
  assert.match(L.head(), /^LOAD ready 0\.90 s · 4 changes after/);
});

test('the load log closes LOAD_LOG_MS after the reveal and caps its rows', () => {
  let t = 0;
  const L = createLoadLog(0, { now: () => t, before: 5, after: 5 });
  t = 10; L.reveal('late', '');
  t = 10 + LOAD_LOG_MS + 1;
  assert.equal(L.add('layout', 'too late'), null);
  assert.equal(L.open(), false);
  const M = createLoadLog(0, { now: () => 1, before: 2 });
  M.add('note', 'a'); M.add('note', 'b'); assert.equal(M.add('note', 'c'), null); assert.equal(M.dropped, 1);
  // (LOAD FIX 4 — Grok #13: a chatty load in the dark can't blind the check after the reveal — each side its own allowance; the reveal always in)
  let u = 0;
  const N = createLoadLog(0, { now: () => u, before: 60, after: 60 });
  for (let i = 0; i < 200; i++) { u = i; N.add('resize', `dark ${i}`); }
  u = 300; assert.ok(N.reveal('late', ''), 'the reveal row goes in over a full dark allowance');
  u = 400; assert.ok(N.add('layout', 'a re-lay after the reveal'), 'a post-reveal row still lands');
  assert.equal(N.visible().length, 1);
  assert.equal(N.rows.filter(r => r.a == null).length, 60);
  for (let i = 0; i < 80; i++) { u = 500 + i; N.add('note', `after ${i}`); }
  assert.equal(N.rows.filter(r => r.a != null && r.kind !== 'reveal').length, 60);
  assert.equal(visibleRow({ kind: 'layout', a: null }), false);
});

test('keyDiff names the parts that changed', () => {
  assert.equal(keyDiff(null, 'a|b'), 'first');
  assert.equal(keyDiff('1|2|3', '1|5|3', ['x', 'y', 'z']), 'y');
  assert.equal(keyDiff('1|2', '1|2'), 'same');
});
