// CITY 2.0 — PART 8b1, Group 0 (the fixes from Polish 4 + the beat): THE SAFETY RULE (core/harbor-beat.js#stepSafety, safePunch),
// the van's night paint (screens/harbor/vehicles.js#nightPaint), the window words' real limits on wordA (core/harbor-windows.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSafety, stepSafety, safePunch, SAFE, LEAD_N } from '../js/core/harbor-beat.js';
import { layoutText, WORD_FACES, lineWidth, FONTS } from '../js/core/harbor-windows.js';

const run = (sf, xs, frames = 1, dt = 16) => { for (let i = 0; i < frames; i++) stepSafety(sf, xs, dt); return sf; };
const grid = (o = {}) => ({ src: 'grid', bar: 0, song: 's1', anchors: 1, live: true, saved: false, cal: { res: null, fast: null, n: 0, seen: 0, errs: 0 }, ...o });

test('NIGHT-A2 — THE RULE CHANGES: a TRUSTED GRID ALWAYS PUNCHES — at HALF strength from its first bar while nothing confirms the lead (was: a breath until LEAD_N kicks confirmed it — c2-party9 breathed a whole song)', () => {
  const sf = createSafety();
  run(sf, grid({ bar: 0 }), 60);   // (one second of frames at the song's start)
  assert.equal(sf.mode, 'punch'); assert.equal(sf.full, false);
  assert.match(sf.why, /half · the default lead · confirming \(0\/6 kicks, bar 1\)/);
  assert.ok(sf.k > 0.9, `the punch is in within a second (${sf.k.toFixed(2)})`);
  assert.ok(Math.abs(sf.amp - SAFE.half) < 1e-9, 'at half strength');
  assert.equal(sf.punchAt, 0, 'the first punch on the song\'s first bar');
  // (a punch on the beat: half of the full one — never the breath's gentle swell)
  assert.ok(safePunch(sf, 1, 0, 0.85) > 0.45 && safePunch(sf, 1, 0, 0.85) < 0.6, `half a punch (${safePunch(sf, 1, 0, 0.85).toFixed(2)})`);
  // the saved lead: still half until the kicks confirm it (the readout names it)
  const sv = createSafety(); run(sv, grid({ bar: 0, saved: true }), 1); assert.match(sv.why, /the saved lead/);
  // a settle after a return, a song whose kicks are off its beats, a deaf listener: all HALF on the grid — never the breath
  for (const [x, re] of [[{ cal: { res: 0.01, fast: { why: 'visible' }, n: LEAD_N, seen: 9, errs: 2 } }, /settling after visible/], [{ deafSong: true }, /kicks are off its beats/], [{ live: false }, /nothing heard/]]) {
    const s2 = createSafety(); run(s2, grid({ bar: 3, ...x }), 60);
    assert.equal(s2.mode, 'punch'); assert.equal(s2.full, false); assert.match(s2.why, re);
  }
});

test('8b1 — THE BREATH (NIGHT-A2: only without a trusted grid): a gentle swell a bar, never a hard edge', () => {
  const sf = createSafety();
  run(sf, grid({ bar: 2, src: 'tempo' }), 60);
  assert.equal(sf.mode, 'breathe');
  assert.match(sf.why, /no trusted grid/);
  assert.ok(sf.k < 0.05, 'the punch share stays off');
  // the light: a slow swell a bar — no attack: its largest step between two frames ~16 ms apart at 120 bpm is tiny
  let mx = 0, prev = safePunch(sf, 1, 0, 0.85);
  for (let b = 0.03; b < 8; b += 0.03) { const v = safePunch(sf, 1, b, 0.85); mx = Math.max(mx, Math.abs(v - prev)); prev = v; }
  assert.ok(mx < 0.02, `the breath has no hard edge (${mx.toFixed(4)} a step)`);
  assert.ok(safePunch(sf, 1, 0, 0.85) <= SAFE.breathe + 1e-9, 'a gentle peak');
});

test('8b1 → NIGHT-A2 — kicks that agree + land within the tolerance → FULL strength (eased in), held through a breakdown, then HALF again (never the breath)', () => {
  const sf = createSafety();
  run(sf, grid({ bar: 1, cal: { res: 0.012, fast: null, n: LEAD_N, seen: 8, errs: 8 } }), 120);
  assert.equal(sf.mode, 'punch'); assert.equal(sf.full, true); assert.match(sf.why, /lead confirmed/);
  assert.ok(sf.k > 0.85 && sf.amp > 0.85, `crossfaded in (k ${sf.k.toFixed(2)}, amp ${sf.amp.toFixed(2)})`);
  assert.equal(sf.fullAt, 0, 'full from the song\'s first bar seen (its bars count from there)');
  // a breakdown: the kicks scatter — FULL holds for SAFE.hold bars …
  run(sf, grid({ bar: 1 + SAFE.hold, cal: { res: null, fast: null, n: LEAD_N, seen: 12, errs: 12 } }), 1);
  assert.equal(sf.full, true);
  // … then HALF on the grid until the kicks confirm it anew
  run(sf, grid({ bar: 2 + SAFE.hold, cal: { res: null, fast: null, n: LEAD_N, seen: 14, errs: 14 } }), 1);
  assert.equal(sf.mode, 'punch'); assert.equal(sf.full, false); assert.match(sf.why, /don’t agree/);
});

test('8b1 → NIGHT-A2 — a residual past the tolerance, a settle after a return: HALF on the grid (the lights still pulse); confirmed again → FULL', () => {
  const sf = createSafety();
  run(sf, grid({ bar: 3, cal: { res: 0.237, fast: null, n: LEAD_N, seen: 9, errs: 9 } }), 1);
  assert.equal(sf.mode, 'punch'); assert.equal(sf.full, false); assert.match(sf.why, /237 ms off/);
  run(sf, grid({ bar: 4, cal: { res: 0.01, fast: null, n: LEAD_N, seen: 9, errs: 9 } }), 1);
  assert.equal(sf.full, true);
  // the page came back from the home screen: the lead is settling — what was confirmed before is history
  run(sf, grid({ bar: 5, cal: { res: 0.01, fast: { why: 'visible' }, n: LEAD_N, seen: 9, errs: 2 } }), 1);
  assert.equal(sf.mode, 'punch'); assert.equal(sf.full, false); assert.match(sf.why, /settling after visible/);
});

test('8b1 → NIGHT-A2 — no trusted grid / the direct element → breathe; no song → the calm punch, full', () => {
  for (const [x, re] of [[{ src: 'tempo' }, /no trusted grid/], [{ src: 'direct-grid' }, /direct element/]]) {
    const sf = createSafety(); run(sf, grid(x), 1);
    assert.equal(sf.mode, 'breathe'); assert.match(sf.why, re);
  }
  const sf = createSafety(); run(sf, grid({ src: 'calm' }), 1);
  assert.equal(sf.mode, 'punch'); assert.equal(sf.full, true);
});

test('NIGHT-A2 — THE SAVED LEAD: never a clamped value, never one learned after a return / a restart / a route change; kept PER OUTPUT; the old clamped +120 is not migrated', async () => {
  const B = await import('../js/core/harbor-beat.js');
  const g = { bpm: 100, t0: 0.1 }, feed = (c, off, n = 30, t0 = 0) => { for (let i = 0; i < n; i++) { const at = 0.1 + (i + 4) * 0.6 + off + B.KICK_LAG; B.leadKick(c, B.kickErrWide(at, g), g, t0 + i * 600); } };
  // the page's own start: the settle's lead is the device's
  const a = B.createLead(null, -0.04); B.leadFast(a, 'start', 0); feed(a, -0.03);
  assert.ok(Math.abs(a.v + 0.03) < 0.01 && Math.abs(B.leadToSave(a) + 0.03) < 0.01, `a start's lead is saved (${B.leadToSave(a)})`);
  // the owner's case: +156 ms settled after a focus restart — applied live, NEVER saved (and never as the clamped +120)
  const b = B.createLead(-0.021); B.leadFast(b, 'resume', 0); feed(b, 0.156);
  assert.ok(Math.abs(b.v - 0.156) < 0.01, `live ${Math.round(b.v * 1000)} ms`); assert.equal(B.leadToSave(b), null, 'after a restart: this visit\'s');
  for (const why of ['visible', 'pageshow', 'rebuild', 'route', 'resume']) { const c = B.createLead(null); B.leadFast(c, why, 0); feed(c, 0.02); assert.equal(B.leadToSave(c), null, why); }
  // outside the saved range: not saved, not clamped (a start at +156 on a slow Bluetooth route)
  const o = B.createLead(null); B.leadFast(o, 'start', 0); feed(o, 0.156); assert.equal(B.leadToSave(o), null, 'outside the range: not saved');
  // the outputs
  assert.match(B.outputLabel('wired'), /speaker/, 'NIGHT-B: a short output reads as the speaker or wired — iOS never says which'); assert.match(B.outputLabel('bt'), /\?/, 'wireless only a guess');
  assert.equal(B.outputKey(0), 'unknown'); assert.equal(B.outputKey(undefined), 'unknown'); assert.equal(B.outputKey(0.012, 0.005), 'wired'); assert.equal(B.outputKey(0.18, 0.005), 'bt');
  // the store: per output; junk → empty; the old single value migrates only from INSIDE the range (+120 = the clamp's edge: dropped)
  const r1 = B.readLeads(JSON.stringify({ v: 2, out: { wired: { el: -0.03, buf: 0, at: 5 }, bt: { el: 0.5, buf: null } }, last: 'bt' }));
  assert.deepEqual(r1.out.wired, { el: -0.03, buf: 0, at: 5 }); assert.equal(r1.out.bt.el, null, 'out of range: dropped'); assert.equal(r1.last, 'bt');
  assert.deepEqual(B.readLeads('{junk', null).out, {}); assert.deepEqual(B.readLeads(null, JSON.stringify({ el: 0.12, buf: null })).out, {}, 'the clamped +120: not migrated');
  assert.equal(B.readLeads(null, JSON.stringify({ el: -0.021, buf: 0.004 })).out.unknown.el, -0.021, 'a sane old value: migrated to the unknown output');
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
