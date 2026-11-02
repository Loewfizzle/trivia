// CITY 2.0 — PART 6b: THE LEGENDARY SKY's rules (core/harbor-legend.js) — rarity, the nights, the timelines, the drain.
import test from 'node:test';
import assert from 'node:assert/strict';
import { legendNight, legendsOf, legendAt, eveningOf, ufoAt, tr3bAt, drainAt, tr3bDir, UFO_LEN, TR3B_LEN, FORMATIONS, missingManAt, blackAt, blackAll, BLACK, CHASE, chasePeakS, chaseX, trafficHold, inHold, HOLD, JETS_GONE } from '../js/core/harbor-legend.js';

test('Oct 25 — NO TRAFFIC DURING THE LEGENDARIES: the hold from 4 s before the craft until the jets are gone + the power is back', () => {
  const h = trafficHold({ kind: 'tr3b', t0: 1000 });
  assert.deepEqual(h, [1000 - HOLD.lead, 1000 + BLACK.on0 + 1.5]);
  assert.ok(inHold(h, h[0]) && inHold(h, 1030) && !inHold(h, h[0] - 0.1) && !inHold(h, h[1]) && !inHold(null, 1000));
  assert.ok(h[1] - 1000 > CHASE.t0 + CHASE.dur * CHASE.uOff, 'past the last plume');
  assert.ok(h[1] - 1000 < TR3B_LEN, 'but before the run is over: a car starting then takes seconds to show, the lights back by then');
  assert.deepEqual(trafficHold({ kind: 'ufo', t0: 50 }), [50 - HOLD.lead, 50 + UFO_LEN + 2]);
  assert.equal(trafficHold(null), null); assert.equal(trafficHold({ kind: 'x', t0: 1 }), null); assert.equal(trafficHold({ kind: 'tr3b' }), null);
});

const days = (y, n) => Array.from({ length: n }, (_, i) => { const d = new Date(Date.UTC(y, 0, 1) + i * 864e5); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]; });

test('SCHED — the legendaries on the showcase dial (HIGH): weeknights 2–3, party nights 4 (one an hour from 8 pm), never the same one twice a night, the TR-3B after dark, never on a fireworks night, the same for everyone', () => {
  for (const [y, m, d] of days(2026, 365 * 2)) {
    const L = legendsOf(y, m, d), dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    assert.equal(new Set(L.map(x => x.kind)).size, L.length, `the same one twice on ${y}-${m}-${d}`);
    if (m === 10 && d === 31) { assert.equal(L.length, 0, 'Halloween night is the ghost ship’s'); continue; }
    for (const x of L) if (x.kind === 'tr3b') assert.ok(!((m === 7 && d === 4) || (m === 12 && d === 31) || (m === 1 && d === 1)), 'never on a fireworks night');
    for (const x of L) if (x.kind === 'ufo') assert.ok(x.h >= 21.5 && x.h <= 24.75);
    assert.deepEqual(legendsOf(y, m, d), L);                 // (seeded: every phone the same)
    const party = dow === 5 || dow === 6 || (m === 11 && dow === 3 && legendNight(y, m, d) && L.length === 4);
    if (!party) assert.ok(L.length >= 2 && L.length <= 3, `a weeknight ${y}-${m}-${d}: ${L.length}`);
  }
});

test('a legendary joined mid-way: legendAt lands mid-way, after midnight belongs to the evening before', () => {
  const [y, m, d] = days(2026, 400).find(([y, m, d]) => legendsOf(y, m, d).some(x => x.kind === 'ufo' || x.kind === 'tr3b'));
  const n = legendsOf(y, m, d).find(x => x.kind === 'ufo' || x.kind === 'tr3b'), h = n.h + 10 / 3600, hh = Math.floor(h % 24), mi = Math.floor((h * 60) % 60), sec = Math.round((h * 3600) % 60);
  const next = new Date(Date.UTC(y, m - 1, d) + 864e5);
  const lc = h >= 24 ? { y: next.getUTCFullYear(), m: next.getUTCMonth() + 1, d: next.getUTCDate(), h: hh, mi, s: sec } : { y, m, d, h: hh, mi, s: sec };
  const a = legendAt(lc);
  assert.ok(a && a.kind === n.kind && Math.abs(a.s - 10) < 1.5, JSON.stringify(a));
  assert.deepEqual([eveningOf({ y: 2026, m: 3, d: 2, h: 0, mi: 30 }).d, eveningOf({ y: 2026, m: 3, d: 2, h: 0, mi: 30 }).hr], [1, 24.5]);
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
    assert.ok(tr3bAt(30.5, dir).chase.on && !tr3bAt(20, dir).chase.on && !tr3bAt(JETS_GONE + 0.1, dir).chase.on);
    // (Oct 25 — THE TAPE STOP IN WEB AUDIO: overhead the song is slow + deep (~0.5 ×, no iOS floor on a buffer source) but CLEARLY there —
    // duller (2.2 kHz), −3 dB; `rate` is the BASE (steady while held): the warble is the tape's oscillators, their depths here)
    { const m = tr3bAt(15, dir).music; assert.ok(m.rate <= 0.52 && m.rate >= 0.48 && m.duck > 0.65 && m.duck < 0.8 && m.hz > 1800 && m.hz < 2600 && m.warble > 0.9 && m.wow > 0.02 && m.wow < 0.03 && m.flutter > 0.005 && m.flutter < 0.01, `held audible: ${m.rate.toFixed(2)} at ${m.duck.toFixed(2)}, wow ${m.wow}`); }
    { let lo = 9, hi = 0; for (let t = 12; t < 30; t += 0.05) { const r = tr3bAt(t, dir).music.rate; lo = Math.min(lo, r); hi = Math.max(hi, r); } assert.ok(hi - lo < 0.002, `the base rate steady while held — no wobble in it (${lo.toFixed(3)}–${hi.toFixed(3)})`); }
    assert.ok(tr3bAt(1, dir).music.wow === 0 && tr3bAt(TR3B_LEN - 0.01, dir).music.wow === 0, 'no warble before + after');
    // (POLISH 4 — THE TAPE STOP HEARD: the speed sags while the music is still loud; after the jets the volume is back first at the low
    // speed, then it spins up)
    const m8 = tr3bAt(8.2, dir).music; assert.ok(m8.rate < 0.75 && m8.duck > 0.9, `sagging while loud: ${m8.rate.toFixed(2)} at ${m8.duck.toFixed(2)}`);
    for (let t = 0; t < TR3B_LEN; t += 0.05) { const m = tr3bAt(t, dir).music; assert.ok(m.rate >= 0.4 - 1e-9 && m.rate <= 1 && m.duck >= 0.5, `the rate sane, never ducked deep (${t.toFixed(2)} s)`); }
    const m41 = tr3bAt(JETS_GONE + 1.67, dir).music; assert.ok(m41.duck > 0.85 && m41.rate < 0.7, `back loud, still slow: ${m41.rate.toFixed(2)} at ${m41.duck.toFixed(2)}`);
    assert.ok(tr3bAt(JETS_GONE - 0.4, dir).music.catchUp && !tr3bAt(28, dir).music.catchUp && tr3bAt(JETS_GONE - 0.4, dir).music.duck < 0.6, 'the time made up under the jets');
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

test('POLISH 4 — THE SURPRISE FLYBY (SCHED: one of the showcase’s soft legendaries — most nights at HIGH): in its window (5 pm → 11 pm), never twice a night, either way, the same for everyone', async () => {
  const { flybyDay, legendsOf } = await import('../js/core/harbor-legend.js');
  let n = 0, dirs = new Set();
  for (let d = 0; d < 365; d++) {
    const dt = new Date(Date.UTC(2026, 0, 1) + d * 864e5), y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, dd = dt.getUTCDate();
    const f = flybyDay(y, m, dd, 18.5);
    assert.equal(!!f, legendsOf(y, m, dd).some(x => x.kind === 'flyby'), 'the flyby = the showcase list’s');
    if (!f) continue;
    n++; dirs.add(f.dir);
    assert.ok(f.h >= 17 && f.h <= 23, `in its window (${f.h})`); assert.ok(f.n >= 3 && f.n <= 4);
  }
  assert.ok(n > 150, `${n} a year at HIGH`); assert.equal(dirs.size, 2);
  assert.deepEqual(flybyDay(2026, 10, 24, 18.6), flybyDay(2026, 10, 24, 18.6), 'the same for everyone');
});
