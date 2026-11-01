// 9a — THE BALLOONS STAY UP (the owner, Oct 25): the flights' lengths, the burner rare + irregular, the festival's line-up, and a
// flight found again on load after its scheduler window (screens/harbor/balloons.js PURE helpers + core/harbor-events.js#recent).
import test from 'node:test';
import assert from 'node:assert/strict';
import { flightLen, burnSchedule, FLIGHT, BURN, FESTIVAL_ORDER, BALLOON_KINDS, BALLOON_SCHEMES, FAST, driftAt, apartSpots, festivalSpots, discoTiles } from '../js/screens/harbor/balloons.js';
import { createScheduler, HARBOR_EVENTS, SLOT_MS, RECENT_MS } from '../js/core/harbor-events.js';

test('a single flight lasts 45–60 min, the festival 60–90 — seeded (every phone the same)', () => {
  for (let s = 1; s < 400; s += 7) {
    const a = flightLen(s, false), b = flightLen(s, true);
    assert.ok(a >= FLIGHT.single[0] * 60 && a <= FLIGHT.single[1] * 60, `single ${a}`);
    assert.ok(b >= FLIGHT.festival[0] * 60 && b <= FLIGHT.festival[1] * 60, `festival ${b}`);
    assert.equal(flightLen(s, false), a);
  }
  assert.ok(FAST >= 10, 'the preview\'s fast crossing');
});

test('the burner: RARE + irregular on a cruise (45–120 s), often while climbing, never on a rhythm', () => {
  const climb = 80, b = burnSchedule(12345, climb, 60 * 60);
  const gaps = [];
  for (let i = 1; i < b.length; i++) {
    const g = b[i][0] - (b[i - 1][0] + b[i - 1][1]), [g0, g1] = b[i - 1][0] < climb ? BURN.climb : BURN.cruise;
    assert.ok(g >= g0 - 1e-9 && g <= g1 + 1e-9, `gap ${g.toFixed(1)} after ${b[i - 1][0].toFixed(0)} s`);
    if (b[i - 1][0] >= climb) gaps.push(g);
  }
  assert.ok(b.filter(x => x[0] < climb).length >= 8, 'flaring as it climbs');
  assert.ok(gaps.length >= 25 && gaps.length <= 85, `${gaps.length} burns in an hour's cruise`);
  const mean = gaps.reduce((a, c) => a + c, 0) / gaps.length, sd = Math.sqrt(gaps.reduce((a, c) => a + (c - mean) ** 2, 0) / gaps.length);
  assert.ok(sd > 12, `irregular (σ ${sd.toFixed(1)} s)`);
  for (const [, len] of b) assert.ok(len >= BURN.len[0] && len <= BURN.len[1]);
  assert.deepEqual(burnSchedule(12345, climb, 600), burnSchedule(12345, climb, 600));
});

test('the festival line-up in the owner\'s order + the new styles', () => {
  assert.deepEqual(FESTIVAL_ORDER, ['btc-orange', 'alien', 'bitcoin', 'skull', 'smiley', 'flag', 'disco']);
  for (const k of ['vstripes', 'pinstripes', 'skull', 'smiley']) { assert.ok(BALLOON_KINDS.includes(k), k); assert.ok(BALLOON_SCHEMES[k].length >= 1, k); }
  assert.equal(BALLOON_SCHEMES.pinstripes.length, 2, 'two of the old schemes kept');
  assert.ok(!BALLOON_KINDS.includes('bitcoin') && !BALLOON_KINDS.includes('alien'), 'the specials keep their rare odds');
  assert.equal(driftAt(0), 0); assert.equal(driftAt(1), 1); assert.ok(driftAt(0.05) < 0.05, 'eased from rest');
});

test('a flight still up is found on load: the scheduler keeps what started (recent) after its 12-min window', () => {
  const ctxAt = ms => ({ ms, force: new Set(), night: false, el: 8, az: 110, month: 7, south: false });
  const t0 = Date.UTC(2026, 6, 10, 0, 0, 0);
  const sch = createScheduler(HARBOR_EVENTS, ctxAt, { seed: 1924, anchor: t0 });
  // walk a day: every balloon flight found in `recent` long after its window has closed
  let found = null;
  for (let ms = t0; ms < t0 + 86400e3 && !found; ms += SLOT_MS) {
    const r = sch.at(ms);
    const b = r.recent.find(e => e.id === 'balloons' && ms - e.end > 20 * 60e3);
    if (b) found = { b, ms, active: r.active.some(e => e.id === 'balloons' && e.start === b.start) };
  }
  assert.ok(found, 'a balloon flight in recent after its window');
  assert.equal(found.active, false, 'no longer active — only recent');
  assert.ok(found.ms - found.b.start < RECENT_MS);
});

test('PERF-A — THE TWO ₿ BALLOONS are never neighbours (apartSpots, the 6-balloon line-up): opposite halves at every shuffle', () => {
  const six = ['btc-orange', 'alien', 'bitcoin', 'skull', 'smiley', 'flag'], n = 6, a = 0, b = 2, base = six.map((_, i) => 0.1 + 0.8 * (i + 0.5) / n);
  let s = 7; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let k = 0; k < 500; k++) {
    const sh = [...base].sort(() => R() - 0.5), out = apartSpots(sh, a, b), rank = v => [...out].sort((p, q) => p - q).indexOf(v);
    assert.deepEqual([...out].sort(), [...base].sort(), 'the same spots, only swapped');
    assert.ok(Math.abs(rank(out[a]) - rank(out[b])) >= 3, `apart: ${rank(out[a])} vs ${rank(out[b])}`);
    assert.ok((out[a] < 0.5) !== (out[b] < 0.5), 'opposite halves');
  }
});

test('PERF-B — THE FESTIVAL OF SEVEN: the disco ball on the rightmost spot, the ₿ pair apart (≥ 3) + never beside it — every shuffle, seeded', () => {
  const n = FESTIVAL_ORDER.length, d = FESTIVAL_ORDER.indexOf('disco'), a = FESTIVAL_ORDER.indexOf('btc-orange'), b = FESTIVAL_ORDER.indexOf('bitcoin'), base = FESTIVAL_ORDER.map((_, i) => 0.06 + 0.88 * (i + 0.5) / n);
  let s = 11; const R = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let k = 0; k < 800; k++) {
    const sh = [...base].sort(() => R() - 0.5), out = festivalSpots(sh), rank = v => [...out].sort((p, q) => p - q).indexOf(v);
    assert.deepEqual([...out].sort(), [...base].sort(), 'the same spots, only swapped');
    assert.equal(rank(out[d]), n - 1, 'the disco ball rightmost');
    assert.ok(Math.abs(rank(out[a]) - rank(out[b])) >= 3, `the ₿ pair apart: ${rank(out[a])} vs ${rank(out[b])}`);
    assert.ok(rank(out[a]) < n - 2 && rank(out[b]) < n - 2, 'never beside the disco ball');
    assert.deepEqual(festivalSpots(sh), out, 'the same on every phone');
  }
});

test('PERF-B — THE DISCO BALL TILES: rows narrowing to the crown, staggered, every tile on the front half, the same every bake', () => {
  const t = discoTiles(), rows = new Map();
  for (const x of t) { rows.set(x.row, (rows.get(x.row) || 0) + 1); assert.ok(x.a0 >= -Math.PI / 2 - 1e-9 && x.a1 <= Math.PI / 2 + 1e-9 && x.a1 > x.a0); assert.ok(x.v1 > x.v0); }
  const counts = [...rows.values()];
  assert.ok(counts.length >= 18 && t.length >= 250 && t.length <= 600, `${counts.length} rows, ${t.length} tiles`);
  assert.ok(counts[0] < counts[Math.floor(counts.length / 2) - 1], 'fewer tiles at the crown than round the middle');
  assert.deepEqual(discoTiles(), t);
});

test('WSP — THE LAYER SNAP: a balloon changes layer only where nothing it overlaps would show it; the sign band squeezed for the near ones', async () => {
  const { layerClear, squeezeBand, SIGN_SQUEEZE } = await import('../js/screens/harbor/balloons.js');
  const sk = Array.from({ length: 101 }, (_, i) => (i >= 40 && i <= 60 ? 300 : 500));   // a tower 160–240 px, its roof at 300
  const sb = { x: 50, y: 100, w: 300, h: 120 };
  assert.equal(layerClear(170, 260, 40, 60, null, sk, null), false, 'its basket behind the tower: no switch');
  assert.equal(layerClear(170, 200, 40, 60, sb, sk, null), false, 'clear of the roof but on the sign: no switch');
  assert.equal(layerClear(170, 232 - 0.5, 40, 60, { ...sb, h: 60 }, sk, null), true, 'clear of both: the switch is invisible here');
  const tops = Object.assign(Array(101).fill(1e9), { tips: Object.assign(Array(101).fill(1e9), { 45: 250 }) });
  assert.equal(layerClear(170, 200, 40, 60, null, sk, tops), false, 'a spire\'s tip under it counts');
  // the squeeze: continuous, monotonic, the ends fixed, the band crossed SIGN_SQUEEZE× faster
  const y0 = 40, y1 = 400; let last = -1e9;
  for (let k = 0; k <= 1000; k++) { const y = squeezeBand(y0 + (y1 - y0) * k / 1000, sb, y0, y1); assert.ok(y >= last - 1e-9); if (k) assert.ok(y - last < 3.6 * SIGN_SQUEEZE, 'no jump'); last = y; }
  assert.equal(squeezeBand(y0, sb, y0, y1), y0); assert.ok(Math.abs(squeezeBand(y1, sb, y0, y1) - y1) < 1e-9);
  const inBand = Array.from({ length: 1000 }, (_, k) => squeezeBand(y0 + (y1 - y0) * k / 999, sb, y0, y1)).filter(y => y > sb.y && y < sb.y + sb.h).length;
  const nat = sb.h / (y1 - y0), A = sb.y - y0, S = sb.h / SIGN_SQUEEZE, C = y1 - sb.y - sb.h;
  assert.ok(inBand <= 1000 * S / (A + S + C) + 2 && inBand < 1000 * nat * 0.55, `${inBand} of 1000 steps over the letters (was ${Math.round(1000 * nat)})`);
  assert.equal(squeezeBand(123, null, y0, y1), 123);
});
