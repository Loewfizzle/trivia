// THE STREET (core/trees.js + core/street-life.js): the trees through the year, the layout, the bus, the signal, the cars, the plows.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { treeState, treeKey, hueMix } from '../js/core/trees.js';
import { streetLayout, busGap, busSlot, busRoute, isOwlHour, signalAt, SIGNAL, carKind, carWeights, plowDue, lampLit, SIZE } from '../js/core/street-life.js';

const st = (y, m, d, o = {}) => treeState({ y, m, d }, { seed: 'gr', ...o });
const avg = (y, m, d, k, o = {}) => [0, 1, 2, 3, 4, 5].reduce((a, i) => a + st(y, m, d, { ...o, i })[k], 0) / 6;

test('trees: bare in winter, a fresh leaf-out in spring, full green in summer', () => {
  assert.ok(st(2026, 1, 20).bare && st(2026, 2, 20).bare, 'winter: bare branches');
  assert.ok(avg(2026, 4, 2, 'bud') > 0.3 && avg(2026, 4, 2, 'leaf') < 0.3, 'early April: buds');
  const may = st(2026, 5, 6);
  assert.ok(may.leaf > 0.6 && may.young > 0.3, 'early May: fresh light-green leaves');
  const jul = st(2026, 7, 15);
  assert.ok(jul.leaf === 1 && jul.mix.green === 1 && jul.young === 0, 'summer: full, deep green');
});

test('trees: autumn turns gradually and differently, thins, sheds most in Thanksgiving week, bare by December', () => {
  const sep = st(2026, 9, 10);
  assert.ok(sep.mix.green > 0.95, 'early September: still green');
  const oct = [0, 1, 2].map(i => st(2026, 10, 22, { i }));
  assert.ok(oct.every(s => s.mix.green < 0.6), 'late October: turned');
  assert.equal(new Set(oct.map(s => Object.entries(s.mix).sort((a, b) => b[1] - a[1])[0][0])).size, 3, 'each tree its own colour (gold, orange, red)');
  assert.ok(avg(2026, 10, 22, 'leaf') > avg(2026, 11, 15, 'leaf') && avg(2026, 11, 15, 'leaf') > 0.15, 'thinning through November');
  // Thanksgiving 2026 is Nov 26: the shed rate peaks that week
  assert.ok(avg(2026, 11, 25, 'shed') > avg(2026, 11, 2, 'shed') * 1.4, `Thanksgiving week sheds the most (${avg(2026, 11, 25, 'shed').toFixed(2)} vs ${avg(2026, 11, 2, 'shed').toFixed(2)})`);
  assert.ok(st(2026, 12, 8).bare, 'bare by December');
  assert.ok(avg(2026, 11, 20, 'ground') > 0.6, 'a pile of leaves at their feet in late autumn');
  assert.ok(avg(2026, 12, 28, 'ground') < 0.05, 'winter clears them');
});

test('the cherry: about two weeks of pale pink blossom, fullest around Easter, then green leaves', () => {
  // Easter 2026: April 5; 2027: March 28
  const at = (y, m, d) => st(y, m, d, { cherry: true, i: 1 });
  assert.ok(at(2026, 4, 5).blossom > 0.9, 'Easter: in full bloom');
  assert.ok(at(2027, 3, 28).blossom > 0.9, 'Easter 2027 (a week earlier): in full bloom');
  assert.ok(at(2026, 3, 22).blossom < 0.05 && at(2026, 4, 20).blossom < 0.05, 'about two weeks, not more');
  assert.ok(at(2026, 4, 10).shed > 0.3, 'it sheds its petals as it fades');
  assert.ok(at(2026, 4, 5).leaf < 0.3 && at(2026, 5, 10).leaf > 0.6, 'the leaves come after the flowers');
  assert.equal(st(2026, 4, 5, { i: 1 }).blossom, 0, 'only the cherry blossoms');
});

test('the lights and the south', () => {
  assert.ok(st(2026, 11, 26).lights && st(2026, 12, 24).lights && st(2027, 1, 5).lights, 'Thanksgiving → early January');
  assert.ok(!st(2026, 11, 20).lights && !st(2027, 1, 10).lights, 'not before Thanksgiving, not after early January');
  assert.ok(st(2026, 10, 28, { i: 0 }).halloween && !st(2026, 10, 28, { i: 1 }).halloween && !st(2026, 10, 20, { i: 0 }).halloween, 'Halloween week: one tree');
  const s = { south: true };
  assert.ok(st(2026, 7, 15, s).bare, 'July in Sydney: winter, bare');
  assert.ok(st(2026, 1, 15, s).leaf === 1, 'January in Sydney: summer, full');
  assert.ok(st(2026, 4, 25, s).mix.green < 0.7, 'April in Sydney: autumn colours');
  assert.ok(st(2026, 12, 24, s).lights, 'the Christmas lights keep the real dates');
});

test('the state key changes only when the look does; hueMix sums to 1', () => {
  assert.equal(treeKey(st(2026, 7, 10)), treeKey(st(2026, 7, 11)), 'summer days look alike');
  assert.notEqual(treeKey(st(2026, 10, 5)), treeKey(st(2026, 10, 25)));
  for (const u of [0, 0.2, 0.4, 0.55, 0.7, 0.9, 1]) { const m = hueMix(u); assert.ok(Math.abs(m.green + m.gold + m.orange + m.red - 1) < 1e-9); }
});

const PHONES = [
  { W: 390, HZ: 697, blades: [{ x: 53, w: 30, bottom: 656 }, { x: 272, w: 30, bottom: 672 }] },
  { W: 402, HZ: 724, blades: [{ x: 9, w: 31, bottom: 666 }, { x: 349, w: 31, bottom: 656 }] },
  { W: 412, HZ: 762, blades: [{ x: 43, w: 32, bottom: 692 }, { x: 356, w: 32, bottom: 714 }] },
];
const K = W => Math.max(0.9, Math.min(1.4, W / 390));

test('the layout on phones: 3–4 lamps, 2–3 trees each beside its own lamp, one shelter, one stop light, the door spot clear', () => {
  for (const s of PHONES) for (const seed of ['street', 'a', 'b', 'c']) {
    const k = K(s.W), L = streetLayout({ ...s, K: k, phone: true, seed });
    assert.ok(L.lamps.length >= 3 && L.lamps.length <= 4, `${s.W}/${seed}: ${L.lamps.length} lamps`);
    assert.ok(L.trees.length >= 2 && L.trees.length <= 3, `${s.W}/${seed}: ${L.trees.length} trees`);
    assert.ok(L.shelter && L.signals.length === 1, 'one shelter, one stop light');
    for (const t of L.trees) {
      const lamp = L.lamps[t.lamp];
      assert.ok(lamp && lamp.tree === L.trees.indexOf(t), 'every tree beside its own lamp');
      const gap = Math.abs(t.x - lamp.x) / k;
      assert.ok(gap >= 10 && gap <= 16, `the trunk 10–16 pt from the post (${gap.toFixed(1)})`);
      assert.equal(Math.sign(t.x - lamp.x), lamp.side, 'on the side the arm reaches');
      const head = lamp.x + lamp.side * SIZE.arm * k;
      assert.ok(Math.abs(head - t.x) <= t.w / 2, 'the head hangs over the canopy');
      assert.ok(Math.hypot(head - t.x, SIZE.lampH * k - (SIZE.trunkH + SIZE.canopyH) * k) <= 30 * k, 'no tree more than ~30 pt from a lamp head');
      assert.ok(t.w / k >= 30 && t.w / k <= 34, 'canopies 30–34 pt');
    }
    const head = SIZE.lampH - SIZE.trunkH - SIZE.canopyH;
    assert.ok(head >= 6 && head <= 10, 'the head 6–10 pt above the canopy');
    assert.ok(L.trees.some(t => t.cherry), 'one cherry');
    const sx = L.shelter.x, tree = L.trees.reduce((a, t) => (Math.abs(t.x - sx) < Math.abs(a.x - sx) ? t : a));
    assert.ok(Math.sign(sx - tree.x) === L.lamps[tree.lamp].side, 'the shelter on the tree\'s far side from its lamp');
    const g = L.signals[0].x;
    assert.ok(g > s.W * 0.66 || (g > s.W * 0.52 && g < s.W * 0.67), 'the stop light in the right third (or just right of the middle)');
    assert.ok(Math.abs(g - s.W / 2) > s.W * 0.05, 'never in the middle');
    const tall = SIZE.lampH * k + 4;
    for (const b of s.blades) if (b.bottom > s.HZ - tall) {
      for (const l of L.lamps) assert.ok(l.x < b.x - 2 || l.x > b.x + b.w + 2, `${s.W}: lamp ${Math.round(l.x)} clear of the blade ${b.x}–${b.x + b.w}`);
      assert.ok(g + 3 * k < b.x || g - (SIZE.signalArm + 3) * k > b.x + b.w, 'the stop light clear of the blade signs');
      for (const t of L.trees) assert.ok(t.x + t.w / 2 < b.x || t.x - t.w / 2 > b.x + b.w, 'trees clear of the blade signs');
    }
    for (const l of L.lamps) assert.ok(Math.abs(l.x - L.door.x) > L.door.w / 2, 'the door spot stays clear');
    const xs = L.lamps.map(l => l.x).sort((a, b) => a - b);
    for (let i = 1; i < xs.length; i++) assert.ok(xs[i] - xs[i - 1] > 28 * k, 'never bunched');
  }
});

test('the layout on a wide screen: about twice the lamps and trees, the shelter near the middle, two stop lights; stable per size', () => {
  const s = { W: 1440, HZ: 666, blades: [{ x: 57, w: 32, bottom: 655 }] };
  const L = streetLayout({ ...s, K: 1.4, phone: false });
  assert.ok(L.lamps.length >= 7 && L.trees.length >= 5, `${L.lamps.length} lamps, ${L.trees.length} trees`);
  assert.equal(L.signals.length, 2);
  assert.ok(Math.abs(L.shelter.x - 720) < 1440 * 0.2, 'the shelter near the middle');
  assert.deepEqual(streetLayout({ ...s, K: 1.4, phone: false }), L, 'seeded: the same every visit');
});

test('the bus timetable: tied to the clock — rush hours often, the night owl, none from ~2 to ~5 am', () => {
  assert.ok(busGap(8) < busGap(13) && busGap(13) < busGap(21));
  assert.equal(busGap(3), Infinity); assert.equal(busGap(4.9), Infinity);
  assert.ok(isOwlHour(1) && busGap(1) > 20 && !isOwlHour(3));
  const t = Date.UTC(2026, 9, 20, 12);
  assert.equal(busSlot(t, 8), busSlot(t + 60_000, 8), 'the same bus a minute later');
  assert.notEqual(busSlot(t, 8), busSlot(t + 8 * 60_000, 8), 'the next one after the gap');
  assert.equal(busSlot(t, Infinity), null);
  assert.ok(/PARTY|AFTER|DANCE|NEON/.test(busRoute(3, { party: true })), 'the PARTY BUS\'s sign');
  assert.equal(busRoute(5, { owl: true }).includes('OWL') || /LAST CALL|NOT IN SERVICE/.test(busRoute(5, { owl: true })), true);
  const eggs = Array.from({ length: 2000 }, (_, i) => busRoute(i)).filter(r => /LAST CALL|NOT IN SERVICE/.test(r)).length;
  assert.ok(eggs > 10 && eggs < 120, `the easter egg very rarely (${eggs}/2000)`);
});

test('the stop light: green ~20 s, yellow 3 s, red ~20 s; flashing yellow late at night', () => {
  const seen = {};
  for (let s = 0; s < 43; s += 0.5) { const st = signalAt(1_000_000 + s * 1000, 14).state; seen[st] = (seen[st] || 0) + 0.5; }
  assert.deepEqual(Object.keys(seen).sort(), ['green', 'red', 'yellow']);
  assert.ok(Math.abs(seen.green - SIGNAL.green) <= 1 && Math.abs(seen.yellow - SIGNAL.yellow) <= 1 && Math.abs(seen.red - SIGNAL.red) <= 1, JSON.stringify(seen));
  const late = new Set(Array.from({ length: 8 }, (_, i) => signalAt(1_000_000 + i * 500, 2.5).state));
  assert.deepEqual([...late].sort(), ['dark', 'flash'], 'flashing yellow ~1–5 am');
  assert.notEqual(signalAt(5000, 14).state === signalAt(5000, 14, { offset: 9 }).state && signalAt(15000, 14).state === signalAt(15000, 14, { offset: 9 }).state, true, 'a second light is offset');
});

test('the car mix by the hour; plows only in real snow; the photocells', () => {
  const share = (hr, k, o) => { const w = carWeights(hr, o); return w[k] / Object.values(w).reduce((a, b) => a + b, 0); };
  assert.ok(share(8, 'van') > share(14, 'van') * 1.6 && share(8, 'truck') > share(22, 'truck') * 3, 'vans and trucks in the morning');
  assert.ok(share(23, 'cab') > share(13, 'cab') * 1.8 && share(23, 'cab', { party: true }) > share(23, 'cab'), 'cabs at night, more on a party night');
  const kinds = new Set(Array.from({ length: 4000 }, (_, i) => carKind(i / 4000, 12)));
  for (const k of ['sedan', 'suv', 'compact', 'van', 'pickup', 'truck', 'moto', 'cab', 'vintage']) assert.ok(kinds.has(k), k);
  assert.ok(share(12, 'vintage') < 0.01, 'the vintage car very rarely');
  assert.equal(plowDue({ live: true, snow: 0 }), Infinity, 'never in clear weather');
  assert.equal(plowDue({ live: false, snow: 0.9 }), Infinity, 'never on a made-up snow');
  assert.ok(plowDue({ live: true, snow: 0.8 }) < plowDue({ live: true, snow: 0.3 }), 'more often in heavy snow');
  const L = (el, h, an = false) => ({ sun: { el }, local: { h }, alwaysNight: an });
  assert.ok(!lampLit(L(5, 18), 0) && lampLit(L(-2, 19), 1), 'off by day, on after sunset');
  assert.ok(lampLit(L(1.2, 18), 0) && !lampLit(L(1.2, 18), 1), 'one by one: the first lamps before the last');
  assert.ok(lampLit(L(0.2, 7), 0) && !lampLit(L(2.5, 7), 1), 'off one by one after sunrise');
  assert.ok(lampLit(L(40, 13, true), 0), 'ALWAYS NIGHT: on');
});
