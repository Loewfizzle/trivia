// CITY 2.0 — PART 6b: THE LEGENDARY SKY's rules (core/harbor-legend.js) — rarity, the nights, the timelines, the drain.
import test from 'node:test';
import assert from 'node:assert/strict';
import { legendNight, legendAt, eveningOf, barnstormDay, ufoAt, tr3bAt, drainAt, tr3bDir, UFO_LEN, TR3B_LEN, FORMATIONS, missingManAt } from '../js/core/harbor-legend.js';

const days = (y, n) => Array.from({ length: n }, (_, i) => { const d = new Date(Date.UTC(y, 0, 1) + i * 864e5); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]; });

test('legendary rarity: ~1–2 a month each, never two in one night, never two nights in a row, the same for everyone', () => {
  let ufo = 0, tr = 0, prev = null;
  for (const [y, m, d] of days(2026, 365 * 3)) {
    const n = legendNight(y, m, d);
    if (n) { if (n.kind === 'ufo') ufo++; else tr++; assert.equal(prev, null, `two legendary nights in a row at ${y}-${m}-${d}`); assert.ok(n.h >= 21.5 && n.h <= 24.75); }
    assert.deepEqual(legendNight(y, m, d), n);                 // (seeded: every phone the same)
    prev = n;
  }
  for (const v of [ufo, tr]) assert.ok(v / 36 >= 0.8 && v / 36 <= 2.2, `per month ${(v / 36).toFixed(2)}`);
});

test('a legendary joined mid-way: legendAt lands mid-way, after midnight belongs to the evening before', () => {
  const [y, m, d] = days(2026, 400).find(([y, m, d]) => legendNight(y, m, d));
  const n = legendNight(y, m, d), h = n.h + 10 / 3600, hh = Math.floor(h % 24), mi = Math.floor((h * 60) % 60), sec = Math.round((h * 3600) % 60);
  const next = new Date(Date.UTC(y, m - 1, d) + 864e5);
  const lc = h >= 24 ? { y: next.getUTCFullYear(), m: next.getUTCMonth() + 1, d: next.getUTCDate(), h: hh, mi, s: sec } : { y, m, d, h: hh, mi, s: sec };
  const a = legendAt(lc);
  assert.ok(a && a.kind === n.kind && Math.abs(a.s - 10) < 1.5, JSON.stringify(a));
  assert.deepEqual([eveningOf({ y: 2026, m: 3, d: 2, h: 0, mi: 30 }).d, eveningOf({ y: 2026, m: 3, d: 2, h: 0, mi: 30 }).hr], [1, 24.5]);
});

test('the barnstormer: a few days a week', () => {
  const n = days(2026, 364).filter(([y, m, d]) => barnstormDay(y, m, d)).length;
  assert.ok(n / 52 > 2.2 && n / 52 < 4, `${(n / 52).toFixed(2)} a week`);
});

test('the abduction: the film in order — the approach, the beam, the walker, the lift, the vanish, gone; the music back', () => {
  const at = s => ufoAt(s);
  assert.equal(at(0).beam.k, 0); assert.equal(at(2).phase, 'approach');
  assert.ok(at(7).beam.open > 0.6 && at(7).walker.pose !== 'walk');
  let h = -1; for (let s = 9; s < 20; s += 0.5) { const l = at(s).lift; assert.ok(l.h >= h, 'he only rises'); h = l.h; }
  assert.ok(at(19.9).lift.h > 0.9 && at(12).lift.arch === 1);
  assert.ok(at(23.8).beam.open < 0.05 && at(26.9).craft.out > 0.95);
  assert.deepEqual([at(UFO_LEN - 0.01).music.duck > 0.95, at(UFO_LEN - 0.01).music.hz > 15000], [true, true]);
  for (let s = 9; s < 20; s += 0.25) assert.ok(Math.abs(Math.cos(at(s).lift.turn)) > 0.4, 'never end-on while he arches (it reads as a hunch)');
});

test('the TR-3B: crosses the whole screen, drains while over the city, the chase after, the music powers down + back', () => {
  for (const dir of [1, -1]) {
    const a = tr3bAt(0, dir), b = tr3bAt(29.9, dir);
    assert.ok(dir > 0 ? a.x < -0.3 && b.x > 1.3 : a.x > 1.3 && b.x < -0.3);
    assert.ok(tr3bAt(15, dir).drain > 0.99 && tr3bAt(34, dir).drain === 0);
    assert.ok(tr3bAt(35.5, dir).chase.on && !tr3bAt(20, dir).chase.on);
    assert.ok(tr3bAt(15, dir).music.rate < 0.5 && tr3bAt(15, dir).music.duck < 0.2);
    const e = tr3bAt(TR3B_LEN - 0.01, dir).music; assert.ok(e.rate === 1 && e.duck > 0.95 && e.hz > 15000);
  }
  assert.ok([1, -1].includes(tr3bDir(2026, 10, 24)));
});

test('the drain: dead right under it, untouched out of range, a floor by distance, the lights come back late behind it', () => {
  assert.equal(drainAt(0.5, 0.5, 1, 'city'), 0);
  assert.equal(drainAt(1, 0.4, 1, 'city'), 1);                     // (ahead of it, out of range)
  assert.ok(drainAt(0.05, 0.6, 1, 'city') < 1);                   // (behind it the lights are still coming back)
  assert.ok(drainAt(0.5, 0.5, 1, 'near') >= 0.44 && drainAt(0.5, 0.5, 1, 'harbor') >= 0.11);
  // (flying right: 0.3 behind it is darker than 0.3 ahead)
  assert.ok(drainAt(0.2, 0.5, 1, 'city', 1, 0, 0.5) < drainAt(0.8, 0.5, 1, 'city', 1, 0, 0.5));
  assert.equal(drainAt(0.5, 0.5, 0, 'city'), 1);
  for (let x = 0; x <= 1; x += 0.05) for (const f of [0, 0.5, 1]) { const v = drainAt(x, 0.4, 0.7, 'city', 1, 0.3, f); assert.ok(v >= 0 && v <= 1); }
});

test('the jets: formations + the missing man pulls up', () => {
  assert.equal(FORMATIONS.chase.length, 3); assert.equal(FORMATIONS.diamond.length, 4); assert.equal(FORMATIONS.finger.length, 4);
  assert.ok(missingManAt(0.2).climb === 0 && missingManAt(0.9).climb > 0.8);
});

test('THE DIRECTOR: a spectacle budget per tier, holidays > party > legendary > rare; what runs keeps its slot', async () => {
  const { createDirector, SPECTACLE } = await import('../js/core/harbor-director.js');
  const d = createDirector();
  d.frame([], 2); assert.ok(d.may('legend', 'legendary'));
  d.frame([{ id: 'party', kind: 'party' }], 0);
  assert.equal(SPECTACLE[0], 1);
  assert.ok(!d.may('legend', 'legendary'), 'tier 0 on a party night: the legendary waits');
  d.frame([{ id: 'party', kind: 'party' }], 2);
  assert.ok(d.may('legend', 'legendary'), 'tier 2: the party + a legendary');
  d.frame([{ id: 'party', kind: 'party' }, { id: 'legend', kind: 'legendary' }], 2);
  assert.ok(!d.may('festival', 'rare') && d.may('legend', 'legendary'), 'the budget full: a rare one waits; a running one keeps its slot');
  d.frame([{ id: 'festival', kind: 'rare' }], 0);
  assert.ok(d.may('drones', 'holiday'), 'a holiday outranks what runs below it');
});
