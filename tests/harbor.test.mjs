// CITY 2.0 — THE HARBOR: the camera, the layout per screen size, the SIZE rules and the events scheduler (pure; docs/harbor.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { REF, Z, SIZE, units, ptAt, cameraFor, project, xAt, groundY, squeeze, harborLayout, screenBoxes, SUN_GAPS, LANE_MIN, laneMin, roofline } from '../js/core/harbor-layout.js';
import { LANES, SLOT_MS, RARITY, BUDGET, QUIET, defineEvent, schedule, createScheduler, anchorFor, densityOf, startChance, HARBOR_EVENTS } from '../js/core/harbor-events.js';

// the title's real rects at each size (measured from the real title, Oct 20 2026, with iPhone safe areas)
const SIZES = {
  '390x844': { W: 390, H: 844, tag: { y: 296, h: 14 }, dock: { x: 14, y: 728, w: 362, h: 76 }, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, tag: { y: 319, h: 14 }, dock: { x: 14, y: 758, w: 374, h: 76 }, safe: { top: 62, bottom: 34 } },
  '412x915': { W: 412, H: 915, tag: { y: 308, h: 14 }, dock: { x: 14, y: 799, w: 384, h: 76 }, safe: { top: 47, bottom: 34 } },
  '430x932': { W: 430, H: 932, tag: { y: 322, h: 14 }, dock: { x: 14, y: 816, w: 402, h: 76 }, safe: { top: 59, bottom: 34 } },
  '874x402': { W: 874, H: 402, tag: { y: 179, h: 14 }, dock: { x: 227, y: 305, w: 420, h: 70 }, safe: { top: 0, bottom: 21 } },
  '1440x900': { W: 1440, H: 900, tag: { y: 351, h: 15 }, dock: { x: 510, y: 794, w: 420, h: 86 }, safe: { top: 0, bottom: 0 } },
};
// the sign + the corner buttons, relative to the tagline (measured from the real title, Oct 21 2026)
const signOf = s => { const wide = s.W > s.H, desk = wide && s.W >= 1000;
  return { neon: { x: s.W / 2 - 140, y: s.tag.y - (desk ? 205 : wide ? 121 : 141), w: 280, h: desk ? 125 : wide ? 72 : 85 }, word: { x: s.W / 2 - 150, y: s.tag.y - 34, w: 300, h: 21 }, corner: { x: s.W - 56, y: s.safe.top + 10, w: 44, h: 90 } }; };
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { tag: s.tag, dock: s.dock, ...signOf(s) }, s.safe); return { s, cam, L: harborLayout(cam) }; };
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

test('the projector: the mockup camera at the reference phone', () => {
  const cam = { W: 402, H: 874, VPX: 201, VPY: REF.VPY, F: REF.F, CAMH: REF.CAMH };
  assert.deepEqual(project(cam, 0, REF.CAMH, 100), [201, 540]);              // eye height sits on the horizon
  const [x, y] = project(cam, 10, 0, 50);
  assert.equal(x, 201 + 600 * 10 / 50); assert.equal(y, 540 + 600 * 13.5 / 50);
  assert.ok(Math.abs(xAt(cam, x, 50) - 10) < 1e-9);
  assert.equal(groundY(cam, 50), y);
  // the mockup's reference sizes: the 11-unit bus at z 60 is 110 pt
  assert.equal(ptAt(cam, 11, 60), 110);
});

test('SIZE rules: world units ↔ pt at the reference phone', () => {
  const cam = { F: REF.F };
  for (const [name, r] of Object.entries(SIZE)) assert.ok(Math.abs(ptAt(cam, units(name), r.z) - r.pt) < 1e-9, name);
  assert.ok(units('person') > 1.4 && units('person') < 1.7);
  assert.ok(Math.abs(units('bus') - 11) < 0.01);
});

test('the squeeze: monotonic, the tallest lands on the limit, low roofs untouched', () => {
  const { cam } = setup('402x874');
  const yMax = cam.VPY + cam.F * (cam.CAMH - 125) / 255;
  const sq = squeeze(cam, yMax);
  assert.ok(sq.s < 1 && sq.s > 0.3);
  const top = h => cam.VPY + cam.F * (cam.CAMH - sq(h, 255)) / 255;
  assert.ok(Math.abs(top(125) - cam.limitY) < 0.5, 'the tallest crown stops at the limit');
  let prev = -1;
  for (let h = 0; h <= 125; h += 2.5) { const v = sq(h, 255); assert.ok(v >= prev - 1e-9, 'taller stays taller'); prev = v; }
  assert.equal(sq(10, 255), 10, 'a low roof is not squeezed');
  // the tall shrink more than the low: the ratio falls with height
  assert.ok(sq(125, 255) / 125 < sq(70, 255) / 70);
});

for (const k of Object.keys(SIZES)) {
  test(`layout ${k}: no reserved zone violated`, () => {
    const { s, cam, L } = setup(k);
    const boxes = screenBoxes(L);
    // the skyline stops under the tagline (crowns included)
    for (const b of boxes.filter(b => b.kind === 'sky')) assert.ok(b.y >= cam.limitY - 0.6, `${b.id} top ${b.y.toFixed(1)} above the limit ${cam.limitY}`);
    assert.ok(cam.limitY >= s.tag.y + s.tag.h + 9.5);
    // the landmarks stay the tallest (a landmark's top is the highest on screen)
    const sky = boxes.filter(b => b.kind === 'sky');
    const best = sky.reduce((a, b) => (b.y < a.y ? b : a));
    assert.ok(L.landmarks.some(l => l.id === best.id), `the highest is ${best.id}`);
    // nothing alive under the dock
    for (const b of boxes.filter(b => b.kind === 'alive')) assert.ok(!overlap(b, { ...s.dock, h: s.H }), `${b.id} under the dock`);
    // the door: on screen, ≥ 44 pt, clear of the dock and the corner buttons
    const d = L.door.rect;
    assert.ok(d.w >= 44 && d.h >= 44);
    assert.ok(d.x >= 0 && d.x + d.w <= s.W && d.y >= 0, 'the door is on screen');
    assert.ok(!overlap(d, s.dock), 'the door clear of the dock');
    assert.ok(!overlap(d, { x: s.W - 60, y: 0, w: 60, h: 160 }), 'the door clear of the corner buttons');
    // the bands keep their order and some depth: the water and the promenade are visible
    assert.ok(groundY(cam, Z.rail) - groundY(cam, Z.quay) > (cam.wide && s.H < 500 ? 12 : 40), 'the water reads');
    assert.ok(cam.dock.y - groundY(cam, Z.road[0]) > (s.H < 500 ? 10 : 40), 'the promenade reads');
    // the speakeasy bleeds off the left edge
    assert.ok(project(cam, L.speakeasy.x0, 0, L.speakeasy.z0)[0] < 0);
    assert.ok(project(cam, L.speakeasy.x1, 0, L.speakeasy.z0)[0] > 40);
  });

  test(`layout ${k}: the sizes`, () => {
    const { s, cam, L } = setup(k);
    const person = ptAt(cam, units('person'), SIZE.person.z), bus = ptAt(cam, L.bus.len, L.bus.z);
    if (!cam.wide) {
      // the SIZE rules on a phone held upright (390–430 pt follow the width)
      const f = s.W / REF.W;
      assert.ok(person > 17 * f && person < 23 * f, `person ${person}`);
      assert.ok(bus > 100 * f && bus < 120 * f, `bus ${bus}`);
      assert.ok(ptAt(cam, L.cars[0].len, L.cars[0].z) > 48 * f && ptAt(cam, L.cars[0].len, L.cars[0].z) < 62 * f);
      assert.ok(ptAt(cam, L.lamps[0].h, L.lamps[0].z) > 45 * f && ptAt(cam, L.lamps[0].h, L.lamps[0].z) < 55 * f);
      assert.ok(ptAt(cam, L.trees[0].r * 2, L.trees[0].z) > 36 * f && ptAt(cam, L.trees[0].r * 2, L.trees[0].z) < 44 * f);
      assert.ok(ptAt(cam, L.signals[0].h, L.signals[0].z) > 50 * f && ptAt(cam, L.signals[0].h, L.signals[0].z) < 60 * f);
    } else if (s.H < 500) {
      assert.ok(person >= 8.5, `sideways people ${person}`);   // the owner's call: the whole city, smaller
    } else {
      assert.ok(person > 17 && person < 23, `desktop person ${person}`);
      assert.ok(cam.spread > 2, 'a panorama, not a stretched phone');
    }
  });
}

test('layout: the sun gaps stay clear through every skyline band', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k);
    for (const bd of L.bands) for (const b of bd.blocks) {
      const s0 = project(cam, b.x0, 0, b.z0)[0], s1 = project(cam, b.x1, 0, b.z0)[0];
      for (const g of L.gaps) assert.ok(!(s1 > g.sx - g.w / 2 && s0 < g.sx + g.w / 2), `${k}: a ${bd.id} block in the gap at ${g.sx}`);
    }
    assert.equal(L.gaps.length, SUN_GAPS.length);
  }
});

test('layout: the lanes are places — on screen, clear of the sign and the corner buttons, tall enough for what runs there', () => {
  for (const k of Object.keys(SIZES)) {
    const { s, cam, L } = setup(k);
    assert.deepEqual(Object.keys(L.lanes).sort(), [...LANES].sort(), `${k}: a rect per lane`);
    const sign = signOf(s);
    for (const [id, r] of Object.entries(L.lanes)) {
      assert.ok(r.x >= 0 && r.x + r.w <= s.W + 0.01 && r.y >= cam.safeTop && r.y + r.h <= s.H, `${k}: ${id} on screen`);
      assert.ok(r.h >= laneMin(cam, id), `${k}: ${id} ${r.h.toFixed(1)} pt tall (≥ ${laneMin(cam, id).toFixed(1)})`);
      for (const [n, z] of [['neon', sign.neon], ['word', sign.word], ['tag', s.tag], ['corner buttons', sign.corner], ['dock', s.dock]]) assert.ok(!overlap(r, { w: s.W, ...z }), `${k}: ${id} over the ${n}`);
    }
    // a banner plane needs a long strip; a parade needs the promenade's whole width; sky-low grows when the tagline goes
    assert.ok(L.lanes['sky-high'].w >= s.W * 0.6, `${k}: sky-high ${L.lanes['sky-high'].w} wide`);
    assert.ok(L.lanes.promenade.w >= s.W * 0.99);
    assert.ok(L.lanes['sky-low'].y0NoTag < L.lanes['sky-low'].y && L.lanes['sky-low'].y0NoTag > sign.word.y + sign.word.h);
    assert.ok(L.lanes.promenade.h >= 2 * ptAt(cam, units('person'), Z.ref), `${k}: a float two people tall fits the promenade`);
    assert.ok(roofline(L).every(v => v >= cam.limitY - 0.6));
  }
});

test('layout: deterministic (the same seed, the same city)', () => {
  const a = setup('402x874').L, b = setup('402x874').L;
  assert.deepEqual(a.bands.map(x => x.blocks.length), b.bands.map(x => x.blocks.length));
  assert.deepEqual(a.bands[1].blocks[3], b.bands[1].blocks[3]);
});

// ---------------------------------------------------------------- events
const ctxAt = force => ms => ({ ms, force: new Set(force), night: true });

test('events: definitions are checked', () => {
  assert.throws(() => defineEvent({ id: 'x', lanes: ['moon'], rarity: 'common', duration: 1000 }));
  assert.throws(() => defineEvent({ id: 'x', lanes: ['sky-high'], rarity: 'often', duration: 1000 }));
  assert.throws(() => defineEvent({ id: 'x', lanes: ['sky-high'], rarity: 'common', duration: 0 }));
  assert.equal(LANES.length, 8);
  assert.ok(startChance(defineEvent({ id: 'l', lanes: ['sky-high'], rarity: 'legendary', duration: 1000 })) < startChance(defineEvent({ id: 'c', lanes: ['sky-high'], rarity: 'common', duration: 1000 })));
});

test('events: deterministic — the same time gives the same schedule (a refresh never reshuffles)', () => {
  const evs = ['a', 'b', 'c', 'd'].map((id, i) => defineEvent({ id, lanes: [LANES[i % 3]], rarity: 'common', duration: 40000 }));
  for (let ms = 1.8e12; ms < 1.8e12 + 30 * SLOT_MS; ms += 13000) {
    assert.deepEqual(schedule(evs, ms, ctxAt([])), schedule(evs, ms, ctxAt([])));
  }
});

// the long, contended case (Part 1's review measured 5217 pop-ins in 9000 samples with the sliding window): 5 sky events of
// 4 slots, 5 water events of 6 slots, 3 parade-length (8 slots) heavy events in the promenade, all common
const CONTENDED = [
  ...Array.from({ length: 5 }, (_, i) => defineEvent({ id: `sky${i}`, lanes: ['sky-high'], rarity: 'common', duration: 4 * SLOT_MS })),
  ...Array.from({ length: 5 }, (_, i) => defineEvent({ id: `wat${i}`, lanes: ['water'], rarity: 'common', duration: 6 * SLOT_MS })),
  ...Array.from({ length: 3 }, (_, i) => defineEvent({ id: `par${i}`, lanes: ['promenade', 'road'], rarity: 'common', duration: 8 * SLOT_MS, heavy: true, cost: 1 })),
];
const sig = e => `${e.id}|${e.start}|${e.end}`;

test('events: schedule(t) and schedule(t − SLOT_MS) agree on every event spanning both (the past is never re-decided)', () => {
  const t0 = Math.floor(1.8e12 / 864e5) * 864e5 + 3600e3;     // inside one UTC day: one anchor for every sample
  let spans = 0;
  for (let ms = t0; ms < t0 + 300 * SLOT_MS; ms += SLOT_MS / 3 + 7000) {
    const now = schedule(CONTENDED, ms, ctxAt([])).active, before = schedule(CONTENDED, ms - SLOT_MS, ctxAt([])).active;
    for (const e of now) if (e.start <= ms - SLOT_MS) { spans++; assert.ok(before.some(b => sig(b) === sig(e)), `${e.id} popped in mid-flight at ${ms}`); }
    for (const b of before) if (b.end > ms) assert.ok(now.some(e => sig(e) === sig(b)), `${b.id} vanished mid-flight at ${ms}`);
  }
  assert.ok(spans > 300, `enough long events seen (${spans})`);
});

test('events: the stateful scheduler (advanced slot by slot, as the scene does) never pops in or drops an event', () => {
  const t0 = 1.8e12 + 7200e3;
  const s = createScheduler(CONTENDED, ctxAt([]), { anchor: t0 - 864e5 });
  let prev = null, pops = 0, samples = 0, lanesOk = true;
  for (let ms = t0; ms < t0 + 3000 * SLOT_MS; ms += 30000) {
    const { active } = s.at(ms);
    samples++;
    const lanes = active.flatMap(e => e.lanes);
    if (new Set(lanes).size !== lanes.length) lanesOk = false;
    if (prev) {
      for (const e of active) if (e.start < ms - 30000 && !prev.some(p => sig(p) === sig(e))) pops++;
      for (const p of prev) if (p.end > ms && !active.some(e => sig(e) === sig(p))) pops++;
    }
    prev = active;
  }
  assert.equal(pops, 0, `${pops} pop-ins / drops in ${samples} samples`);
  assert.ok(lanesOk, 'a lane taken twice');
  // the scene's live path and a fresh replay with the same anchor tell the same story
  const ms = t0 + 3000 * SLOT_MS - 1;
  assert.deepEqual(s.at(ms).active.map(sig), schedule(CONTENDED, ms, ctxAt([]), { anchor: t0 - 864e5 }).active.map(sig));
  assert.ok(s.decided <= 3000 + 960 + 2, `each slot decided once (${s.decided})`);
});

test('events: anchors a day apart (a session across midnight vs. a fresh load) agree within the day of replay', () => {
  const day = 864e5, mid = Math.ceil(1.8e12 / day) * day;
  const a = createScheduler(CONTENDED, ctxAt([]), { anchor: mid - 2 * day }), b = createScheduler(CONTENDED, ctxAt([]), { anchor: mid - day });
  for (let ms = mid + 3600e3; ms < mid + 6 * 3600e3; ms += 45000) assert.deepEqual(a.at(ms).active.map(sig), b.at(ms).active.map(sig));
  // the scene's anchor: the local midnight one day back
  assert.equal(anchorFor(mid + 5 * 3600e3 + 61500, { h: 5, mi: 1, s: 1 }), mid - day);
});

test('events: a quiet lane thins out (densityOf)', () => {
  const d = densityOf(['sky-high', 'water']);
  assert.equal(d['sky-high'], QUIET); assert.equal(d.water, QUIET); assert.equal(d.promenade, 1);
  assert.ok(QUIET < 0.5, 'a heavy event really thins the others');
});

test('events: two events never share a lane; the budget holds; heavy events quiet the other lanes', () => {
  const evs = [
    ...Array.from({ length: 6 }, (_, i) => defineEvent({ id: `sky${i}`, lanes: ['sky-high'], rarity: 'common', duration: 2 * SLOT_MS })),
    ...Array.from({ length: 6 }, (_, i) => defineEvent({ id: `w${i}`, lanes: ['water', 'road'], rarity: 'common', duration: SLOT_MS, cost: 1 })),
    defineEvent({ id: 'parade', lanes: ['promenade', 'road'], rarity: 'common', duration: SLOT_MS, heavy: true, cost: 1.2 }),
  ];
  let sawQuiet = false, sawTwo = false;
  const sch = createScheduler(evs, ctxAt([]), { anchor: 1.8e12 - 864e5 });
  for (let ms = 1.8e12; ms < 1.8e12 + 400 * SLOT_MS; ms += SLOT_MS / 3) {
    const { active, quiet } = sch.at(ms);
    const lanes = active.flatMap(e => e.lanes);
    assert.equal(new Set(lanes).size, lanes.length, 'a lane taken twice');
    assert.ok(active.reduce((s, e) => s + e.cost, 0) <= BUDGET.total + 1e-9, 'over budget');
    for (const e of active) assert.ok(e.k >= 0 && e.k < 1);
    if (active.some(e => e.heavy)) { sawQuiet = true; assert.ok(quiet.includes('sky-high') && !quiet.includes('promenade')); }
    if (active.length >= 2) sawTwo = true;
  }
  assert.ok(sawQuiet && sawTwo);
});

test('events: rarity — common is common, legendary is rare', () => {
  const evs = [defineEvent({ id: 'c', lanes: ['sky-high'], rarity: 'common', duration: 20000 }), defineEvent({ id: 'l', lanes: ['water'], rarity: 'legendary', duration: 20000 }), defineEvent({ id: 'w', lanes: ['road'], rarity: 'weekly', duration: 20000 })];
  const seen = { c: 0, l: 0, w: 0 }, starts = new Set();
  const day = 864e5, step = SLOT_MS;
  // (an event of 20 s inside a 90 s slot: sample the slot every 10 s and count each start once)
  const sch = createScheduler(evs, ctxAt([]), { anchor: 1.8e12 - day });
  for (let ms = 1.8e12; ms < 1.8e12 + 14 * day; ms += step) for (let o = 0; o < step; o += 10000) for (const e of sch.at(ms + o).active) { const k = `${e.id}|${e.start}`; if (!starts.has(k)) { starts.add(k); seen[e.id]++; } }
  const slots = 14 * day / SLOT_MS;
  assert.ok(seen.c > slots / RARITY.common * SLOT_MS * 0.7 && seen.c < slots / RARITY.common * SLOT_MS * 1.3, `common ${seen.c}`);
  assert.ok(seen.w >= 0 && seen.w <= 8, `weekly ${seen.w}`);
  assert.ok(seen.l <= 2, `legendary ${seen.l}`);
});

test('events: when() gates by the context; forced events run at once', () => {
  const evs = [defineEvent({ id: 'snowy', lanes: ['promenade'], rarity: 'common', duration: 20000, when: c => c.snow })];
  for (let ms = 1.8e12; ms < 1.8e12 + 50 * SLOT_MS; ms += SLOT_MS / 2) assert.equal(schedule(evs, ms, ms2 => ({ ms: ms2, snow: false })).active.length, 0);
  // the demo: only with &force=demo, and then it is running right away
  assert.equal(schedule(HARBOR_EVENTS, 1.8e12, ctxAt([])).active.length, 0);
  const on = schedule(HARBOR_EVENTS, 1.8e12 + 1234, ctxAt(['demo']), { forced: ['demo'] });
  assert.deepEqual(on.active.map(e => e.id), ['demo']);
  assert.deepEqual(on.active[0].lanes, ['sky-low']);
});
