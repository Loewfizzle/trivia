// CITY 2.0 — PART 8b1, Group 0 (the fixes from Polish 4 + the beat): THE SAFETY RULE (core/harbor-beat.js#stepSafety, safePunch),
// the van's night paint (screens/harbor/vehicles.js#nightPaint), the window words' real limits on wordA (core/harbor-windows.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSafety, stepSafety, safePunch, SAFE, LEAD_N } from '../js/core/harbor-beat.js';
import { layoutText, WORD_FACES, lineWidth, FONTS } from '../js/core/harbor-windows.js';

const run = (sf, xs, frames = 1, dt = 16) => { for (let i = 0; i < frames; i++) stepSafety(sf, xs, dt); return sf; };
const grid = (o = {}) => ({ src: 'grid', bar: 0, song: 's1', anchors: 1, live: true, saved: false, cal: { res: null, fast: null, n: 0, seen: 0, errs: 0 }, ...o });

test('8b1 — THE SAFETY RULE: no confirmed lead → a gentle BREATH, never the punch', () => {
  const sf = createSafety();
  run(sf, grid({ bar: 2 }), 60);
  assert.equal(sf.mode, 'breathe');
  assert.match(sf.why, /no kicks confirmed yet/);
  assert.ok(sf.k < 0.05, 'the punch share stays off');
  // the light: a slow swell a bar — no attack: its largest step between two frames ~16 ms apart at 120 bpm is tiny
  let mx = 0, prev = safePunch(sf, 1, 0, 0.85);
  for (let b = 0.03; b < 8; b += 0.03) { const v = safePunch(sf, 1, b, 0.85); mx = Math.max(mx, Math.abs(v - prev)); prev = v; }
  assert.ok(mx < 0.02, `the breath has no hard edge (${mx.toFixed(4)} a step)`);
  assert.ok(safePunch(sf, 1, 0, 0.85) <= SAFE.breathe + 1e-9, 'a gentle peak');
});

test('8b1 — THE SAFETY RULE: kicks that agree + land within the tolerance → PUNCH (crossfaded in), held through a breakdown', () => {
  const sf = createSafety();
  run(sf, grid({ bar: 1, cal: { res: 0.012, fast: null, n: LEAD_N, seen: 8, errs: 8 } }), 120);
  assert.equal(sf.mode, 'punch'); assert.match(sf.why, /lead confirmed/);
  assert.ok(sf.k > 0.85, `crossfaded in (${sf.k.toFixed(2)})`);
  // a breakdown: the kicks scatter — the punch holds for SAFE.hold bars …
  run(sf, grid({ bar: 1 + SAFE.hold, cal: { res: null, fast: null, n: LEAD_N, seen: 12, errs: 12 } }), 1);
  assert.equal(sf.mode, 'punch');
  // … then breathes again until the kicks confirm it anew
  run(sf, grid({ bar: 2 + SAFE.hold, cal: { res: null, fast: null, n: LEAD_N, seen: 14, errs: 14 } }), 1);
  assert.equal(sf.mode, 'breathe'); assert.match(sf.why, /don’t agree/);
});

test('8b1 — THE SAFETY RULE: a residual past the tolerance, a settle after a return, a re-anchor — all breathe', () => {
  const sf = createSafety();
  run(sf, grid({ bar: 3, cal: { res: 0.237, fast: null, n: LEAD_N, seen: 9, errs: 9 } }), 1);
  assert.equal(sf.mode, 'breathe'); assert.match(sf.why, /237 ms off/);
  run(sf, grid({ bar: 4, cal: { res: 0.01, fast: null, n: LEAD_N, seen: 9, errs: 9 } }), 1);
  assert.equal(sf.mode, 'punch');
  // the page came back from the home screen: the lead is settling — what was confirmed before is history
  run(sf, grid({ bar: 5, cal: { res: 0.01, fast: { why: 'visible' }, n: LEAD_N, seen: 9, errs: 2 } }), 1);
  assert.equal(sf.mode, 'breathe'); assert.match(sf.why, /settling after visible/);
});

test('8b1 — THE SAFETY RULE: a device with a SAVED lead punches for the grace bars only, then breathes unless confirmed', () => {
  const sf = createSafety();
  run(sf, grid({ bar: 10, saved: true }), 1);
  assert.equal(sf.mode, 'punch'); assert.match(sf.why, /saved lead/);
  run(sf, grid({ bar: 10 + SAFE.grace, saved: true }), 1);
  assert.equal(sf.mode, 'breathe');
});

test('8b1 — THE SAFETY RULE: no trusted grid / the direct element / nothing heard → breathe; no song → the calm punch', () => {
  for (const [x, re] of [[{ src: 'tempo' }, /no trusted grid/], [{ src: 'direct-grid' }, /direct element/], [{ live: false, bar: 6 }, /nothing heard/]]) {
    const sf = createSafety(); run(sf, grid(x), 1);
    assert.equal(sf.mode, 'breathe'); assert.match(sf.why, re);
  }
  const sf = createSafety(); run(sf, grid({ src: 'calm' }), 1);
  assert.equal(sf.mode, 'punch');
});

test('8b1 — the van after dark wears a deep paint (never the cream dairy livery); the others unchanged', async () => {
  globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null }) };
  const { nightPaint, MODELS, PAINT } = await import('../js/screens/harbor/vehicles.js');
  const lum = p => 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2];
  for (let i = 0; i < MODELS.van.paints.length; i++) assert.ok(lum(PAINT[MODELS.van.paints[nightPaint('van', i)][0]]) <= 150, `van paint ${i} at night`);
  assert.equal(nightPaint('van', 1), 1, 'a deep paint stays itself');
  for (const id of ['roadster', 'modelA', 'taxi']) for (let i = 0; i < MODELS[id].paints.length; i++) assert.equal(nightPaint(id, i), i);
});

test('8b1 — the window words: a 5-letter word on wordA sets in the BIGGEST font that fits (the 3 × 5: 4 columns a letter needs 24 > 19)', () => {
  const A = WORD_FACES.wordA;
  const lay = layoutText('SPEAK', WORD_FACES, { tower: 'wordA' });
  assert.ok(lay && lay[0].font === 's');
  assert.ok(lineWidth('SPEAK', FONTS.m) > A.cols, 'the 4 × 5 is 24 columns');
  assert.ok(lineWidth('SPEAK', FONTS.s) <= A.cols, 'the 3 × 5 is 19');
  // the limits, one line on wordA: 3 letters in the 5 × 5, 4 in the 4 × 5, 5 in the 3 × 5
  assert.equal(layoutText('JAZ', WORD_FACES, { tower: 'wordA' })[0].font, 'l');
  assert.equal(layoutText('NEON', WORD_FACES, { tower: 'wordA' })[0].font, 'm');
});
