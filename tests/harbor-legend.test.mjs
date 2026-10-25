// CITY 2.0 — PART 6b: THE LEGENDARY SKY's rules (core/harbor-legend.js) — rarity, the nights, the timelines, the drain.
import test from 'node:test';
import assert from 'node:assert/strict';
import { legendNight, legendAt, eveningOf, barnstormDay, ufoAt, tr3bAt, drainAt, tr3bDir, UFO_LEN, TR3B_LEN, FORMATIONS, missingManAt, blackAt, blackAll, BLACK, CHASE, chasePeakS, chaseX } from '../js/core/harbor-legend.js';

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
    // (8b1 — THE DRAIN DRAMATIC: overhead the song is held LOW but audible — deep (~0.56 ×, warbling), muffled (900 Hz), at half volume)
    { const m = tr3bAt(15, dir).music; assert.ok(m.rate <= 0.62 && m.rate >= 0.5 && m.duck > 0.35 && m.duck < 0.6 && m.hz < 1000 && m.warble > 0.9, `held low: ${m.rate.toFixed(2)} at ${m.duck.toFixed(2)}`); }
    { let lo = 9, hi = 0; for (let t = 12; t < 30; t += 0.05) { const r = tr3bAt(t, dir).music.rate; lo = Math.min(lo, r); hi = Math.max(hi, r); } assert.ok(hi - lo > 0.05, `a heavy warble (${lo.toFixed(3)}–${hi.toFixed(3)})`); }
    // (POLISH 4 — THE TAPE STOP HEARD: the speed sags while the music is still loud, never under half speed (iOS mutes below it); after
    // the jets the volume is back first at the low speed, then it spins up)
    const m8 = tr3bAt(8.2, dir).music; assert.ok(m8.rate < 0.75 && m8.duck > 0.9, `sagging while loud: ${m8.rate.toFixed(2)} at ${m8.duck.toFixed(2)}`);
    for (let t = 0; t < TR3B_LEN; t += 0.25) assert.ok(tr3bAt(t, dir).music.rate >= 0.5 - 1e-9);
    const m41 = tr3bAt(40.6, dir).music; assert.ok(m41.duck > 0.85 && m41.rate < 0.7, `back loud, still slow: ${m41.rate.toFixed(2)} at ${m41.duck.toFixed(2)}`);
    assert.ok(tr3bAt(38.5, dir).music.catchUp && !tr3bAt(30, dir).music.catchUp && tr3bAt(38.5, dir).music.duck < 0.2, 'the time made up while silent');
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

test('POLISH 4 — THE BLACKOUT: the flicker-out as it arrives, the WHOLE city dark through the crossing + the jets, back from the far skyline to the promenade', () => {
  const mean = (s, d, dir = 1) => { let a = 0, n = 0; for (let x = 0.02; x < 1; x += 0.04) for (let i = 0; i < 12; i++) { a += blackAt(s, x, d, dir, i * 31 + Math.round(x * 100)); n++; } return a / n; };
  for (const dir of [1, -1]) {
    // untouched before it comes; the entry side dies first
    assert.equal(mean(1, 'city', dir), 1);
    const entry = dir > 0 ? 0.1 : 0.9, far = 1 - entry;
    let e = 0, f = 0; for (let i = 0; i < 40; i++) { e += blackAt(6, entry, 'city', dir, i); f += blackAt(6, far, 'city', dir, i); }
    assert.ok(e < f, `the side it comes in on dies first (${e} < ${f})`);
    // every light of every depth dead from ~10.5 s through the crossing, the gap and the jets' pass
    for (const d of ['far', 'city', 'sign', 'harbor', 'near']) for (let s = 10.5; s < BLACK.on0 - 1.5; s += 0.5) assert.equal(mean(s, d, dir), 0, `${d} dead at ${s}`);
    // the jets are gone before anything comes back
    assert.ok(BLACK.on0 - BLACK.sput >= CHASE.t0 + CHASE.dur * 1.2, 'the power waits for the jets to leave');
    // back to front: the far skyline is back before the near rows, the sign, the harbor, the promenade last
    const back = d => { for (let s = BLACK.on0 - 2; s < TR3B_LEN; s += 0.05) if (mean(s, d, dir) > 0.9) return s; return Infinity; };
    const order = ['far', 'city', 'sign', 'harbor', 'near'].map(back);
    for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1], `back to front: ${order.map(v => v.toFixed(2)).join(' < ')}`);
    assert.ok(order[order.length - 1] < TR3B_LEN - 2, 'all back before the event ends');
    // it STUTTERS back (on/off flicks before a light holds), never a single fade
    let flips = 0, prev = 0; for (let s = BLACK.on0 - 2; s < BLACK.on0 + 1; s += 0.02) { const v = blackAt(s, 0.5, 'far', dir, 7) > 0.2 ? 1 : 0; if (v !== prev) flips++; prev = v; }
    assert.ok(flips >= 3, `stutters back (${flips} flips)`);
  }
  // blackAll: dead flags + the overall darkness
  assert.ok(blackAll(20, 'near').dead && blackAll(20, 'far').dead && blackAll(20).k > 0.99);
  assert.ok(!blackAll(5, 'city').dead && !blackAll(TR3B_LEN - 0.5, 'near').dead && blackAll(TR3B_LEN - 0.5).k < 0.02);
  for (let s = 0; s < TR3B_LEN; s += 0.1) for (const d of ['far', 'near']) { const v = blackAt(s, 0.3, d, 1, 3); assert.ok(v >= 0 && v <= 1); }
});

test('POLISH 4 — THE CHASE: its middle crosses the centre when chasePeakS says; the last plume is off the screen before it ends', () => {
  const len = 0.2, pk = chasePeakS(len), u = (pk - CHASE.t0) / CHASE.dur;
  const mid = FORMATIONS.chase.reduce((a, [fx]) => a + chaseX(u, fx, len), 0) / FORMATIONS.chase.length;
  assert.ok(Math.abs(mid - 0.5) < 1e-9, `the middle at the centre (${mid})`);
  // the last jet + its ~0.9-length plume past the right edge when the chase stops drawing
  assert.ok(chaseX(CHASE.uOff, FORMATIONS.chase[2][0], len) - 0.5 * len - 0.9 * len > 1, 'the last plume gone');
  assert.ok(tr3bAt(chasePeakS(len), 1).chase.on && !tr3bAt(CHASE.t0 + CHASE.dur * (CHASE.uOff + 0.05), 1).chase.on);
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

test('POLISH 4 — THE SURPRISE FLYBY: ~twice a month (8b1), never on a legendary night, golden hour → 11 pm, mostly after dark, either way', async () => {
  const { flybyDay, legendNight } = await import('../js/core/harbor-legend.js');
  let n = 0, night = 0, dirs = new Set();
  for (let d = 0; d < 730; d++) {
    const dt = new Date(Date.UTC(2026, 0, 1) + d * 864e5), dusk = 17 + 4 * Math.sin(((d % 365) / 365) * Math.PI);   // (a dusk between 17:00 and 21:00)
    const f = flybyDay(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), dusk);
    if (!f) continue;
    n++; if (f.night) night++; dirs.add(f.dir);
    assert.equal(legendNight(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()), null, 'never on a legendary night');
    assert.ok(f.h >= dusk - 1.01 && f.h <= 23, `in its window (${f.h} vs dusk ${dusk.toFixed(2)})`);
    assert.ok(f.n >= 2 && f.n <= 4);
  }
  const perMonth = n / (730 / 30.44);
  assert.ok(perMonth > 1.3 && perMonth < 2.8, `${perMonth.toFixed(2)} a month`);
  assert.ok(night / n > 0.6, 'weighted toward after dark'); assert.equal(dirs.size, 2);
  assert.deepEqual(flybyDay(2026, 10, 24, 18.6), flybyDay(2026, 10, 24, 18.6), 'the same for everyone');
});
