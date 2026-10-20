// THE NEON COMES ALIVE: the day's plan (district/neon-ramp.js) and the sun's moments it hangs on (sun.js#sunMoments).
//   node --test tests/neon.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { neonPlan, neonState, neonNext } from '../js/screens/district/neon-ramp.js';
import { sunMoments, sunPlace, sunShape } from '../js/screens/district/sun.js';
import { sunPosition, sunArc } from '../js/core/sky.js';

const MIN = 60000;
const D0 = Date.UTC(2026, 9, 20, 4, 0);                 // Oct 20 2026, 00:00 in New York (EDT)
const at = (h, m = 0, s = 0) => D0 + ((h * 60 + m) * 60 + s) * 1000;
const MOM = { rise: at(7, 17), clearAt: at(7, 40), startAt: at(17, 0), catchAt: at(17, 55) };
const plan = (o = {}) => neonPlan({ moments: MOM, seed: '2026-10-20|42.9|-85.7', signs: 4, ...o });
const transitions = (p, a, b, step = 20) => { let n = 0, prev = null; for (let t = a; t < b; t += step) { const k = neonState(p, t).letters.join(); if (prev != null && k !== prev) n++; prev = k; } return n; };

test('the stages through a day', () => {
  const p = plan();
  const st = t => neonState(p, t);
  assert.equal(st(at(3)).stage, 'night'); assert.ok(st(at(3)).letters.every(Boolean) && st(at(3)).signs.every(Boolean), 'deep night: everything lit');
  const dawn = st(at(6, 58));
  assert.equal(dawn.stage, 'night'); assert.ok(dawn.letters.every(Boolean), 'dawn twilight: the logo still on');
  assert.ok(st(at(7, 8)).signs.every(x => !x), '10 min before sunrise: the city signs are all off');
  assert.equal(st(at(7, 45)).stage, 'goodbye');
  assert.equal(st(at(9)).stage, 'day'); assert.ok(st(at(9)).letters.every(x => !x) && st(at(9)).signs.every(x => !x), 'day: all off');
  assert.equal(st(at(17, 5)).stage, 'ramp');
  assert.ok(st(at(17, 54, 50)).letters.filter(Boolean).length >= 3, 'the last moments: letters sticking');
  assert.equal(st(at(17, 56)).stage, 'lit'); assert.ok(st(at(17, 56)).letters.every(Boolean), 'the catch: all four on');
  assert.ok(st(at(17, 56)).signs.every(x => !x), 'right after the catch the city signs are still dark');
  assert.ok(st(at(18, 12)).signs.every(Boolean), '15+ min after the catch: every city sign is on');
});

test('the evening ramp: easy to miss at first, more and longer sputters toward the catch, letters sticking at the end', () => {
  const p = plan();
  const early = transitions(p, at(17, 0), at(17, 10)), late = transitions(p, at(17, 40), at(17, 50));
  assert.ok(early >= 2 && early < late, `sputters grow (${early} changes in the first 10 min, ${late} in the 10 min before the end)`);
  const firstEv = p.letters.flatMap(l => l.ev).sort((a, b) => a[0] - b[0]).filter(e => e[0] < at(17, 3));
  assert.ok(firstEv.length && firstEv.every(e => e[1] - e[0] <= 150), `the first sputters are brief (${firstEv.map(e => e[1] - e[0]).map(Math.round).join(', ')} ms)`);
  // never more than 3 flashes a second (≤ 6 changes in any second), in the busiest stretch
  let worst = 0;
  for (let t = at(17, 40); t < at(17, 55); t += 500) worst = Math.max(worst, transitions(p, t, t + 1000, 10));
  assert.ok(worst <= 6, `at most 3 flashes a second (worst ${worst / 2})`);
  // letters stick one after another in the last few minutes
  const sticks = p.letters.map(l => l.stick).sort((a, b) => a - b);
  assert.ok(sticks[0] >= at(17, 50) && sticks[3] < MOM.catchAt && new Set(sticks).size === 4, 'four letters stick one by one in the last minutes');
});

test('the city answers one at a time; at dawn the city signs go first, then the logo dies letter by letter', () => {
  const p = plan();
  const on = [...p.signOn].sort((a, b) => a - b);
  assert.ok(on[0] > MOM.catchAt && on[3] < MOM.catchAt + 16 * MIN, 'all on within ~15 min after the catch');
  for (let i = 1; i < on.length; i++) assert.ok(on[i] - on[i - 1] > 2 * MIN, 'a few minutes apart (never two sputtering at once)');
  assert.ok(p.signOff.every(t => t >= MOM.rise - 31 * MIN && t <= MOM.rise - 9 * MIN), 'off in the dawn twilight, 30–10 min before sunrise');
  assert.ok(Math.max(...p.signOff) < MOM.clearAt, 'the city signs go before the logo starts to falter');
  const deaths = p.letters.map(l => l.death).sort((a, b) => a - b);
  assert.ok(deaths[0] > MOM.clearAt && deaths[3] === p.endAt && p.endAt - MOM.clearAt >= 6 * MIN && p.endAt - MOM.clearAt <= 9 * MIN, 'over 6–9 min after the disc clears the rooftops');
  assert.ok(deaths[3] - deaths[2] >= 30000, 'the last letter hangs on alone for a moment');
});

test('the same everywhere on reload (seeded), different on another day; neonNext finds the next change', () => {
  const a = plan(), b = plan(), c = neonPlan({ moments: MOM, seed: '2026-10-21|42.9|-85.7', signs: 4 });
  assert.deepEqual(a.marks, b.marks);
  assert.notDeepEqual(a.marks, c.marks);
  for (let t = at(17, 20); t < at(17, 30); ) { const n = neonNext(a, t); assert.ok(n > t); t = n; }
});

test('Reduced effects: no sputters — a fade over the ramp, all on at the catch, a fade out in the goodbye', () => {
  const p = plan({ reduced: true });
  assert.ok(p.letters.every(l => !l.ev.length && !l.mo.length), 'no sputter events');
  const f1 = neonState(p, at(17, 10)).fade, f2 = neonState(p, at(17, 45)).fade;
  assert.ok(f1 > 0 && f2 > f1 && f2 < 1, `the fade grows (${f1.toFixed(2)} → ${f2.toFixed(2)})`);
  assert.equal(neonState(p, at(17, 56)).stage, 'lit');
  assert.ok(neonState(p, at(7, 44)).fade < 1, 'mornings fade out');
});

// ---- the moments: where the sun is drawn, not the weather
const valley = (W, mid, edge) => x => mid - (mid - edge) * Math.pow(Math.min(1, Math.abs(x - W / 2) / (W / 2)), 2.5);
const PHONE = { W: 390, H: 844, HZ: 690, block: { x: 29, y: 78, w: 332, h: 191 }, buttons: { x: 334, y: 10, w: 44, h: 90 }, safeTop: 0, roof: valley(390, 400, 300), base: 16.5,
  neon: { x: 57, y: 108, w: 275, h: 85 }, word: { x: 45, y: 215, w: 299, h: 21 }, tag: { x: 40, y: 249, w: 311, h: 14 } };
const DESK = { W: 1440, H: 900, HZ: 666, block: { x: 504, y: 129, w: 432, h: 272 }, buttons: { x: 1380, y: 10, w: 44, h: 90 }, safeTop: 0, roof: x => 300 + 60 * Math.sin(x / 37), base: 26 };
const CITY = { ny: { tz: 'America/New_York', lat: 40.71, lon: -74.01 }, sydney: { tz: 'Australia/Sydney', lat: -33.87, lon: 151.21 }, gr: { tz: 'America/Detroit', lat: 42.96, lon: -85.67 } };
function placed(c, layout, t) {
  const el = sunPosition(t, c.lat, c.lon).el, a = sunArc(t, c.tz, c.lat, c.lon);
  const p = sunPlace({ ...layout, u: a.u, el, south: c.lat < 0, r: layout.base, e1: a.e1, e4: a.e4, noonEl: a.noonEl, season: a.season, prof: a.prof });
  return { ...p, r: layout.base * sunShape(el).size };
}
const hidden = (layout, p) => { if (p.x - p.r >= layout.W || p.x + p.r <= 0) return true; for (let dx = -p.r; dx <= p.r; dx += 2) if (p.x + dx >= 0 && p.x + dx <= layout.W && layout.roof(p.x + dx) > p.y - p.r) return false; return true; };

test('phones, THE BIG ARCH in step with the real sky: peeks at sunrise, clear soon after, the catch at the real sunset — any skyline', () => {
  const base = PHONE.roof;
  const tower = (x0, x1, top) => x => (x > x0 && x < x1 ? Math.min(base(x), top) : base(x));
  const SKY = {
    valley: base,
    'tall right tower': tower(270, 345, 250),            // the 390×844 city's tall tower on the right
    'tall left towers': tower(0, 80, 262),                // edge towers up to the tagline (like 412×915)
    'towers both sides': x => Math.min(tower(0, 70, 270)(x), tower(300, 390, 275)(x)),
  };
  for (const [sk, roof] of Object.entries(SKY)) for (const [name, c] of Object.entries(CITY)) for (const date of ['2026-06-21', '2026-12-21', '2026-10-20']) {
    const L = { ...PHONE, roof };
    const ms = Date.parse(date + 'T12:00:00Z') + (c.lon > 100 ? -10 * 3600000 : 5 * 3600000);
    const m = sunMoments({ ...c, ms, layout: L });
    const tag = `${sk} ${name} ${date}`;
    assert.ok(Math.abs(m.catchAt - m.set) <= 5 * MIN, `${tag}: the catch at the real sunset (${((m.catchAt - m.set) / MIN).toFixed(1)} min)`);
    assert.ok(m.clearAt - m.rise >= 0 && m.clearAt - m.rise <= 45 * MIN, `${tag}: the morning clear soon after sunrise (${((m.clearAt - m.rise) / MIN).toFixed(0)} min)`);
    assert.ok(!hidden(L, placed(c, L, m.rise + 5 * MIN)), `${tag}: peeking 5 min after sunrise`);
    assert.ok(!hidden(L, placed(c, L, m.set - 5 * MIN)), `${tag}: still showing 5 min before sunset`);
    for (let t = m.rise; t < m.set; t += 4 * MIN) if (sunPosition(t, c.lat, c.lon).el >= 4) assert.ok(!hidden(L, placed(c, L, t)), `${tag}: never hidden while the real sun is 4° up`);
    for (let t = m.catchAt + MIN; t < m.set + 20 * MIN; t += 2 * MIN) assert.ok(hidden(L, placed(c, L, t)), `${tag}: hidden after the catch (the LAST time it goes behind)`);
  }
});

test('the catch is the moment the sun is drawn fully behind the rooftops (phones and desktop, summer and winter, north and south)', () => {
  for (const [name, c] of Object.entries(CITY)) for (const date of ['2026-06-21', '2026-12-21', '2026-10-20']) for (const [ln, layout] of [['phone', PHONE], ['desktop', DESK]]) {
    const ms = Date.parse(date + 'T12:00:00Z') + (c.lon > 100 ? -10 * 3600000 : 5 * 3600000);
    const m = sunMoments({ ...c, ms, layout });
    assert.ok(m, `${name} ${date} ${ln}: moments`);
    assert.ok(m.catchAt <= m.set + 20 * MIN && m.catchAt > m.set - (ln === 'phone' ? 5 * MIN : 3 * 3600000), `${name} ${date} ${ln}: the catch near sunset`);
    assert.ok(hidden(layout, placed(c, layout, m.catchAt + 5000)), `${name} ${date} ${ln}: hidden just after the catch`);
    assert.ok(!hidden(layout, placed(c, layout, m.catchAt - 60000)), `${name} ${date} ${ln}: still showing a minute before`);
    for (let t = m.catchAt + 60000; t < m.set; t += 120000) assert.ok(hidden(layout, placed(c, layout, t)), `${name} ${date} ${ln}: and it stays hidden (the LAST time it goes behind)`);
    assert.ok(m.clearAt >= m.rise - 10 * MIN && m.clearAt < m.rise + 4 * 3600000, `${name} ${date} ${ln}: the morning clear after sunrise`);
    assert.ok(m.startAt < m.catchAt - 20 * MIN, `${name} ${date} ${ln}: the ramp starts well before the catch`);
  }
  // (and below: a phone whose arch dips behind a tall tower on the right and comes back out before it sets)
  // no layout yet: the real sunset / sunrise
  const f = sunMoments({ ...CITY.ny, ms: Date.parse('2026-10-20T16:00:00Z'), layout: null });
  assert.equal(f.catchAt, f.set); assert.equal(f.clearAt, f.rise);
});
