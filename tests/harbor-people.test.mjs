// CITY 2.0 — PART 8P: THE PEOPLE (+ section 0's pure pieces: the hush word sign, the lamps' life, the basement window, the crossing's
// light). node --test tests/harbor-people.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout, project } from '../js/core/harbor-layout.js';
import { wallPlan, hushState, strikeLevel, darkLevel } from '../js/core/harbor-hush.js';
import { lampThresholds, warmUp, lampMoment, LAMP_LIFE } from '../js/core/harbor-lamps.js';
import { standSpots } from '../js/core/harbor-cabs.js';
import { BUS, DOOR, busDoorAt, CART_IN_Z, FOLK, MIX, mixNow, folkMap, folkAt, jogHour, JOG, busesOf, busStopX, FOLK_CACHE, dogOffset, linePlaces, roofAt, roofCrowd, KINDS, TIER_CAP, capByTier } from '../js/core/harbor-people.js';
import { signalAt, centreK } from '../js/core/harbor-promenade.js';

const SIZES = {
  '390x844': { W: 390, H: 844, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, safe: { top: 62, bottom: 34 } },
  '430x932': { W: 430, H: 932, safe: { top: 59, bottom: 34 } },
};
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { dock: { x: 14, y: s.H - 116, w: s.W - 28, h: 76 } }, s.safe); return { cam, L: harborLayout(cam) }; };

// ------------------------------------------------------------------ THE HUSH WORD SIGN
test("8P → WIN — THE HUSH WORD SIGN: the letters stacked on the corner pier's plate — a 4-letter word ~15 pt at 402, five letters ~12, every word inside the pier at 390 / 402 / 430", () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = L.speakeasy, K = cam.F / s.z0;
    const four = wallPlan('JAZZ'), five = wallPlan('SWING');
    assert.deepEqual(four.letters.map(l => l.ch), ['J', 'A', 'Z', 'Z']); assert.deepEqual(five.letters.map(l => l.ch), ['S', 'W', 'I', 'N', 'G']);
    assert.ok(four.cap >= five.cap, `${k}: four letters at least as big as five`);
    for (const p of [four, five]) for (const l of p.letters) for (const q of l.polys) for (const [u, v] of q.pts)
      assert.ok(u >= p.pier[0] - 1e-6 && u <= p.pier[1] + 1e-6 && v >= p.pier[2] - 1e-6 && v <= p.pier[3] + 1e-6, `${k} ${p.text}: inside the pier`);
    // (the size the pier allows: reported, not a pass mark — ~15 pt caps for four letters on a 402 phone)
    assert.ok(four.cap * K > 13.5, `${k}: four letters ${(four.cap * K).toFixed(1)} pt`);
  }
});
test('8P — THE HUSH WORD SIGN exists ONLY in a lobby: absent otherwise (no unlit tubes); lights letter by letter; dark + gone on leaving', () => {
  assert.deepEqual(hushState({ word: 'jazz' }), { text: 'JAZZ', lit: 1 });
  assert.deepEqual(hushState({ word: null }), { text: null, lit: 0 });
  const first = i => { for (let t = 0; t < 5; t += 0.01) if (strikeLevel(i, t) > 0) return t; return 99; };
  assert.ok(first(0) < first(1) && first(1) < first(3), 'strikes in turn');
  for (let i = 0; i < 5; i++) assert.equal(strikeLevel(i, 2.5), 1, 'all on');
  assert.ok([0.32, 0.36, 0.4, 0.45].some(t => strikeLevel(0, t) < 0.5), 'a cold tube flickers as it catches');
  assert.equal(darkLevel(0.6), 0, 'gone half a second after the lobby closes');
});

// ------------------------------------------------------------------ THE LAMPS' LIFE
test('8P — THE LAMPS\' LIFE: one by one at dusk (a seeded order), a warm-up stutter, rare moments — never two at once, never the crossing pair during an event', () => {
  const th = lampThresholds(4, 1924);
  assert.equal(new Set(th.map(v => v.toFixed(4))).size, 4, 'each lamp its own moment');
  assert.ok(Math.min(...th) >= LAMP_LIFE.from - 1e-9 && Math.max(...th) <= LAMP_LIFE.to + 1e-9, 'inside the ramp');
  assert.notDeepEqual(th, [...th].sort((a, b) => a - b), 'not simply left → right');
  assert.equal(warmUp(-1), 0); assert.equal(warmUp(LAMP_LIFE.warm + 0.1), 1);
  assert.ok(warmUp(0.03) > 0.5 && warmUp(0.1) < 0.2, 'a flash, then dark: the stutter');
  for (let u = 0.4; u < LAMP_LIFE.warm; u += 0.1) assert.ok(warmUp(u + 0.1) >= warmUp(u) - 1e-9, 'then a steady climb');
  // a day of moments: how often, which lamp, one at a time, the skip list
  let n = 0, outs = 0; const day = 86400e3, at0 = Date.UTC(2026, 9, 22);
  const seen = new Set();
  for (let ms = at0; ms < at0 + day; ms += LAMP_LIFE.slot * 1000) {
    const m = lampMoment(ms + 1000, 4, { skip: [0, 1] });
    if (!m) continue;
    n++; if (m.kind === 'out') outs++; seen.add(m.i);
    assert.ok(![0, 1].includes(m.i), 'never a skipped lamp');
    assert.ok(m.at >= Math.floor((ms + 1000) / 1000 / LAMP_LIFE.slot) * LAMP_LIFE.slot * 1000, 'inside its slot');
    assert.ok(m.len < LAMP_LIFE.slot - 30, 'short');
    assert.equal(m.level(m.at - 1), 1); assert.equal(m.level(m.at + m.len * 1000 + 1), 1);
    const lows = []; for (let t = m.at; t < m.at + m.len * 1000; t += 20) lows.push(m.level(t));
    assert.ok(Math.min(...lows) < 0.5, 'a visible dip');
  }
  const slots = day / 1000 / LAMP_LIFE.slot;
  assert.ok(n > slots * 0.3 && n < slots * 0.7, `rare: ${n} moments in ${slots} slots (one lamp at most each)`);
  assert.ok(outs > 0 && outs < n * 0.4, `the outage rarer (${outs} of ${n})`);
  assert.deepEqual([...seen].sort(), [2, 3]);
  assert.equal(lampMoment(at0, 2, { skip: [0, 1] }), null, 'nothing when every lamp is skipped');
  // the same moment on every phone
  assert.deepEqual(JSON.stringify(lampMoment(at0 + 5e6, 4)), JSON.stringify(lampMoment(at0 + 5e6, 4)));
});

// ------------------------------------------------------------------ THE BASEMENT WINDOW + THE CROSSING'S LIGHT (their DOM-free parts)
test('8P — THE BASEMENT WINDOW: shadows pass now and then, the beat lifts it on party nights, a flicker only rarely; brighter at night', async () => {
  globalThis.document = globalThis.document || { createElement: () => ({ getContext: () => null }) };
  const { basementLight, BASEMENT } = await import('../js/screens/harbor/speakeasy.js');
  let passing = 0, flicks = 0; const N = 3600 * 4;
  for (let t = 0; t < N; t += 0.25) { const b = basementLight(t, { night: 1 }); if (b.shadows.length) passing++; if (b.flick) flicks++; }
  const share = passing / (N / 0.25);
  assert.ok(share > 0.08 && share < 0.4, `people pass now and then (${(share * 100).toFixed(0)} % of the time)`);
  assert.ok(flicks > 0 && flicks / (N / 0.25) < 0.003, `a rare flicker (${flicks} quarter-seconds in 4 h)`);
  const still = t => { for (; ; t += 0.25) { const b = basementLight(t); if (!b.shadows.length && !b.flick) return t; } };
  const t0 = still(0);
  assert.ok(basementLight(t0, { night: 1 }).a > basementLight(t0, { night: 0 }).a, 'brighter at night');
  assert.ok(basementLight(t0, { night: 1, beat: 1 }).a > basementLight(t0, { night: 1 }).a * (1 + BASEMENT.beat * 0.9), 'the beat lifts it');
});
test('8P → PROM — THE CROSSWALK LIT (no lampposts): the back road’s implied lamps past both edges + the crossing the brightest strip, fading by the far kerb', async () => {
  const { crossLightOf, crossPools } = await import('../js/screens/harbor/road.js');
  for (const k of Object.keys(SIZES)) {
    const { L, cam } = setup(k), cw = L.crosswalk, f = crossLightOf(L), mid = (cw.x0 + cw.x1) / 2;
    assert.equal(crossPools(L).length, 3, `${k}: the crossing's + the two edges'`);
    assert.ok(f(mid, 56.5) > 0.8, `${k}: the crossing lit (${f(mid, 56.5).toFixed(2)})`);
    assert.ok(f(mid, 57) > f(mid - 9, 57) && f(mid, 57) > f(mid + 9, 57) * 0.95, `${k}: brightest at the crossing`);
    // (C4b: the edges' pools dimmer still — 0.5 → 0.14 of a pool: a faint spill, never a band)
    if (!cam.wide) assert.ok(f(-cam.hw(57) + 0.5, 57) > 0.04 && f(cam.hw(57) - 0.5, 57) > 0.04 && f(-cam.hw(57) + 0.5, 57) < 0.2, `${k}: the edges catch the implied lamps' faint spill`);
    for (const x of [cw.x0, mid, cw.x1]) assert.ok(f(x, 55.5) > 0.6, `${k}: lit across its width`);
    assert.ok(f(mid, 63.9) < 0.2, `${k}: fading by the far kerb`);
  }
});
test('C4a — THE CROSSING’S LIGHT IS A SPILL, NOT A STAGE POOL: smooth along the road (no step > 0.08 per 0.2 u), rising to the crossing, the crossing the brightest; a car sampled at its tail / middle / nose brightens ACROSS it', async () => {
  const { crossLightOf, poolFall, POOL_R } = await import('../js/screens/harbor/road.js');
  assert.equal(poolFall(0), 1); assert.equal(poolFall(POOL_R * POOL_R), 0);
  for (let d2 = 0; d2 < POOL_R * POOL_R; d2 += 0.01) assert.ok(poolFall(d2 + 0.01) <= poolFall(d2) + 1e-12, 'monotone falloff');
  for (const k of Object.keys(SIZES)) {
    const { L, cam } = setup(k), cw = L.crosswalk, f = crossLightOf(L), mid = (cw.x0 + cw.x1) / 2, hw = cam.hw(57);
    let worst = 0;
    for (let x = -hw; x < hw; x += 0.2) worst = Math.max(worst, Math.abs(f(x + 0.2, 57) - f(x, 57)));
    assert.ok(worst <= 0.08, `${k}: no step along the road (${worst.toFixed(3)})`);
    for (let x = mid - 6; x < mid; x += 0.2) assert.ok(f(x + 0.2, 57) >= f(x, 57) - 1e-9, `${k}: rising toward the crossing at x ${x.toFixed(1)}`);
    assert.ok(f(mid, 57) > 1.5 * f(mid - 12, 57), `${k}: the crossing clearly the brightest (${f(mid, 57).toFixed(2)} vs ${f(mid - 12, 57).toFixed(2)})`);
    // a 4.4-u car whose nose reaches the crossing: its nose lit well before its tail (the gradient, never all at once)
    const car = mid - 4, nose = f(car + 1.76, 57), tail = f(car - 1.76, 57);
    assert.ok(nose > tail + 0.1, `${k}: the nose ahead of the tail (${nose.toFixed(2)} > ${tail.toFixed(2)})`);
  }
});

// ------------------------------------------------------------------ THE PEOPLE (section 1)
const OFF = -240, DAY = Date.UTC(2026, 9, 22, 4) / 1000;     // (Thu Oct 22 2026, local midnight in Grand Rapids)
const inR = (p, r) => p.x > r.x0 + 0.05 && p.x < r.x1 - 0.05 && p.z > r.z0 + 0.05 && p.z < r.z1 - 0.05;
test('8P — WHO\'S OUT WHEN: the mix by the clock (joggers + dogs early, the commute, lunch on the bench, couples + guests at night, nearly empty at 3 am), weekends busier, party nights a stream of guests, rain fewer', () => {
  const at = (h, o = {}) => mixNow({ h, dow: 4, ...o });
  assert.ok(at(3.5).n < 1, 'the small hours: almost empty');
  assert.ok(jogHour(6.5, false) && at(6.5).mix.dogwalker && at(6.5).mix.worker, 'early: joggers (9f: their own lane — JOG), dog walkers, a worker to the bus');
  assert.ok(at(8.5).mix.brisk && at(8.5).mix.busrider && at(8.5).mix.newsboy, 'the commute');
  assert.ok(at(12.5).mix.lunch && at(12.5).mix.window && at(12.5).mix.customer, 'midday: lunch on the bench, a window-shopper, a customer');
  assert.ok(at(17).mix.homeward, 'late afternoon: heading home');
  // (POLISH 4: the speakeasy stays secret — no guests in the random mix: they come by the side door's own schedule + THE LINE)
  assert.ok(at(20).mix.couple >= 3 && !at(20).mix.guests && !at(23.5).mix.leaving, 'evening: couples; the guests are not in the mix');
  assert.ok(at(23.5).mix.straggler && at(23.5).mix.lone, 'late: a straggler, a lone walker');
  assert.ok(at(12.5).n > at(3.5).n * 8 && at(12.5).n <= FOLK.cap, 'busiest at midday, never past the cap');
  assert.ok(mixNow({ h: 20.5, dow: 6 }).n >= at(20.5).n, 'a weekend evening busier');
  assert.ok(at(21, { party: true }).n > at(21).n * 2 && at(21, { party: true }).mix.couple > at(21).mix.couple, 'party nights: busier, more people out enjoying it');
  assert.ok(at(12.5, { rain: 1 }).n < at(12.5).n * 0.6 && !at(12.5, { rain: 1 }).mix.lunch, 'rain: fewer, nobody lunching on the bench');
  assert.ok(MIX.every(p => Object.keys(p.mix).every(k => KINDS[k])), 'every kind in the mix has a builder');
});
test('8P — THE PEOPLE over two days at 390 / 402 / 430: never past the cap, never under the dock or inside a wall / the bench\'s back / the cart\'s front, crossing only on WALK, arriving + leaving through an edge, a door, the bus or the crossing', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), M = folkMap(L), cache = new Map();
    const block = M.rects.filter(r => ['building', 'back-left', 'cart'].includes(r.id));
    let maxN = 0; const seenKinds = new Set();
    for (let t = DAY + 5 * 3600; t < DAY + 2 * 86400; t += 9) {
      const R = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
      const heads = R.members.filter(m => m.m.role !== 'dog');
      maxN = Math.max(maxN, heads.filter(m => m.routine !== 'dance' && m.routine !== 'street').length);   // (POLISH 4: the dance circle on top of the crowd's cap; NIGHT-B: the street party too)
      for (const m of heads) {
        const s = m.s; seenKinds.add(m.kind);
        // (NIGHT-B: INTO THE STREET — the spill dances in the street's upper band, ONLY in a break; the bench dancers step up at the bench's front)
        if (m.kind === 'spiller' && s.z < FOLK.zMin - 0.6) { assert.ok(R.party && R.party.brk, `${k}: a spiller in the street outside a break`); assert.ok(s.z >= 33.5, `${k}: the spill below the street's upper band (${s.z.toFixed(2)})`); continue; }
        assert.ok(s.z >= FOLK.zMin - (m.kind === 'trash' ? 1.4 : m.kind === 'cabwait' ? 1.05 : m.kind === 'bencher' ? 1.45 : m.kind === 'vendor' && L.cart.from === 'below' ? FOLK.zMin - CART_IN_Z + 0.6 : 0.6), `${k}: ${m.kind} under the dock (z ${s.z.toFixed(2)})`);   // (C4b: the vendor wheels his cart up from the front street)   // (8b1: the collector at the can, beside the front-left globe; PROM: the cab stand's waiter on its bench at the front curb)
        if (m.kind === 'cabwait' || m.kind === 'bencher') assert.ok(project(cam, s.x, 0, s.z)[1] < cam.dock.y - 6, `${k}: the cab stand's waiter above the dock (${project(cam, s.x, 0, s.z)[1].toFixed(0)})`);
        if (s.a >= 0.999 && m.m.role === 'lead' && !s.door) for (const r of block) assert.ok(!inR(s, r), `${k}: ${m.kind} inside ${r.id} at ${s.x.toFixed(2)}, ${s.z.toFixed(2)} (${s.pose})`);
        if (s.z > FOLK.roadZ + 0.2 && s.z < FOLK.farZ - 0.35 && m.m.role === 'lead') {
          const nearBus = Math.abs(s.x - busStopX(L)) < 2.2, nearCab = (R.cars || []).some(c => c.cab && s.x > c.x - c.len / 2 - 0.6 && s.x < c.x + c.len / 2 + 1.4), nearTruck = m.routine === 'work' && (R.crew.trucks || []).some(T => s.x > T.x - T.len / 2 - 0.6 && s.x < T.x + T.len / 2 + 1.4);   // (8b1: a worker by his truck: round its nose, at its bed)
          assert.ok(s.cross || nearBus || nearTruck || nearCab || s.a < 1 || s.door, `${k}: ${m.kind} on the road, not crossing (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`);
          if (s.cross) { const S = signalAt(t * 1000); assert.ok(S.walk === 'walk' || S.phase === 'blink', `${k}: crossing on ${S.phase}`); }
        }
      }
    }
    assert.ok(maxN <= FOLK.cap, `${k}: at most ${FOLK.cap} at once (${maxN})`);
    for (const kind of ['stroller', 'couple', 'dogwalker', 'lunch', 'guests', 'water', 'busrider', 'jogger']) assert.ok(seenKinds.has(kind), `${k}: ${kind} seen`);
    const R = folkAt(DAY + 13 * 3600, { L, M, ctx: { off: OFF } }, cache);
    for (const v of R.visits) {
      const first = v.legs[0], last = v.legs[v.legs.length - 1];
      const off = p => Math.abs(p.x) > cam.hw(p.z) || (p.z >= FOLK.farZ - 0.01 && p.x < L.speakeasy.x1);
      const p0 = first.k === 'walk' ? first.pts[0] : first, p1 = last.k === 'walk' ? last.pts[last.pts.length - 1] : last;
      // (FP3b: through a REAL door — never a fade on the promenade)
      assert.ok(first.k === 'door' || off(p0), `${v.kind} appears on screen at ${p0.x.toFixed(1)}, ${p0.z.toFixed(1)}`);
      assert.ok(last.k === 'door' || off(p1), `${v.kind} leaves on screen at ${p1.x.toFixed(1)}, ${p1.z.toFixed(1)}`);
      assert.ok(!v.legs.some(lg => lg.k === 'fade'), `${v.kind}: no fade legs on the promenade`);
    }
  }
});
test('8P — JOIN MID-WAY: the promenade at any moment is the same on every phone (a cold start mid-afternoon = a phone that watched all day)', () => {
  const { L } = setup('402x874'), M = folkMap(L), warm = new Map();
  for (let t = DAY + 14 * 3600; t < DAY + 14 * 3600 + 900; t += 3) folkAt(t, { L, M, ctx: { off: OFF } }, warm);
  for (const t of [DAY + 14 * 3600 + 901, DAY + 14 * 3600 + 1333.3]) {
    const a = folkAt(t, { L, M, ctx: { off: OFF } }, warm), b = folkAt(t, { L, M, ctx: { off: OFF } }, new Map());
    assert.deepEqual(b.members.map(m => [m.vid, m.m.role, m.s.x.toFixed(4), m.s.z.toFixed(4), m.s.pose]), a.members.map(m => [m.vid, m.m.role, m.s.x.toFixed(4), m.s.z.toFixed(4), m.s.pose]));
    assert.ok(a.members.length >= 1, 'people already there, mid-stroll');
  }
});
test('8P — THE BUS: a few an hour by day, none in the small hours; it stops short of the crossing, pulls away only on green, never stands on the crosswalk', () => {
  const { L } = setup('402x874'), cw = L.crosswalk;
  let day = 0;
  for (let h = 0; h < 24; h++) {
    const bs = busesOf(L, '2026-10-22', h, DAY + h * 3600);
    if (h >= 2 && h < 5) assert.equal(bs.length, 0, `none at ${h}:00`);
    if (h >= 7 && h < 22) { assert.ok(bs.length >= 2 && bs.length <= 4, `${bs.length} at ${h}:00`); day += bs.length; }
    for (const b of bs) {
      assert.ok(b.xc + b.len / 2 <= cw.x0 - 0.3, 'its front short of the crosswalk at the stop');
      assert.ok(b.xc - b.len / 2 > L.speakeasy.x1, 'its rear clear of the speakeasy at the stop');
      assert.equal(signalAt(b.tD * 1000).road, 'green', 'away on green');
      for (let t = b.tE; t < b.tX; t += 0.25) {
        const x = b.x(t), on = x + b.len / 2 > cw.x0 && x - b.len / 2 < cw.x1;
        if (on) assert.ok(['green', 'amber'].includes(signalAt(t * 1000).road), 'over the crosswalk only while the road is green');
      }
      assert.ok(b.tD > b.tShut && b.tD - b.tA >= 4, 'it stops for its riders, and leaves after its door could shut');
    }
  }
  assert.ok(day >= 30 && day <= 60, `${day} buses through the day`);
});
test('FP3b → PEO — THE PACE, judged against real walking (1 unit = 0.83 m): a walk ~1.3 m/s, a stroll ~1.0, the commuter’s brisk ~1.5, a jog ~2.6; strollers + couples slowest, commuters brisker, joggers clearly faster', () => {
  const S = FOLK.speed, mps = v => v * 0.833;
  assert.ok(mps(S.walk) >= 1.2 && mps(S.walk) <= 1.4, `walk ${mps(S.walk).toFixed(2)} m/s`);
  assert.ok(mps(S.stroll) >= 0.9 && mps(S.stroll) <= 1.1 && mps(S.brisk) >= 1.4 && mps(S.brisk) <= 1.6 && mps(S.jog) >= 2.4 && mps(S.jog) <= 2.9, `stroll ${mps(S.stroll).toFixed(2)}, brisk ${mps(S.brisk).toFixed(2)}, jog ${mps(S.jog).toFixed(2)} m/s`);
  assert.ok(S.stroll < S.walk && S.walk < S.brisk && S.brisk * 1.6 < S.jog, 'stroll < walk < brisk, the jog clearly faster');
  assert.equal(KINDS.couple(() => 0.5, { nodes: { inlay: { x: 0, z: 45 } } }).gait, 'stroll', 'couples stroll');
});

test('FP3a — THE CAP BY TIER: 12 / 9 / 6 heads drawn; whole visits kept (a couple stays a couple, a dog with its walker); the same people on every phone at a tier', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map();
  assert.deepEqual([...TIER_CAP], [6, 9, 12]);
  let busy = 0;
  for (let t = DAY + 11 * 3600; t < DAY + 15 * 3600; t += 37) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache), heads = ms => ms.filter(m => m.m.role !== 'dog').length;
    for (const tier of [0, 1, 2]) {
      const k = capByTier(f.members, tier), kv = new Set(k.map(m => m.vid));
      assert.ok(heads(k) <= TIER_CAP[tier], `tier ${tier}: ${heads(k)} heads`);
      for (const m of f.members) if (kv.has(m.vid)) assert.ok(k.includes(m), 'a kept visit keeps all its members');
      assert.deepEqual(capByTier([...f.members].reverse(), tier).map(m => m.vid).sort(), k.map(m => m.vid).sort(), 'the order of the plan never changes who is kept');
    }
    if (heads(f.members) > 6) busy++;
  }
  assert.ok(busy > 5, 'busy enough at midday to test the cap');
});

test('8P — THE LOBBY LINE: left of the door along the shopfront, bending toward the bottom-left corner; never cut by the left edge, never under the dock, the door clear', () => {
  for (const k of ['390x844', '402x874', '430x932']) {
    const { cam, L } = setup(k), s = L.speakeasy;
    for (const n of [4, 6, 8]) {
      const P = linePlaces(L, n);
      assert.equal(P.length, n);
      for (const p of P) {
        const sx = cam.VPX + cam.F * p.x / p.z;
        assert.ok(sx >= 9, `${k} n${n}: on screen (${sx.toFixed(1)} pt)`);
        assert.ok(p.z >= FOLK.zMin - 0.01, `${k}: never under the dock`);
        assert.ok(p.x < s.x0 + s.door.u0 - 0.3, `${k} n${n}: left of the door, the door clear (${p.x.toFixed(2)})`);
      }
      const q = P.filter(p => !p.wait);
      assert.ok(q[0].z > FOLK.doorZ - 0.6, 'the head of the line by the shopfront');
    }
  }
});
test('8P — THE ROOF: a crowd on party nights + summer weekend nights (≤ the roof\'s cap), 0–1 otherwise; up + down through the hatch only', () => {
  assert.ok(roofCrowd({ h: 21.5, dow: 6, month: 10, party: true }).n >= 4);
  assert.ok(roofCrowd({ h: 21.5, dow: 6, month: 7 }).n >= 4, 'a summer Saturday');
  assert.ok(roofCrowd({ h: 12, dow: 3, month: 10 }).n <= 1 && roofCrowd({ h: 21.5, dow: 3, month: 10 }).n <= 1);
  assert.equal(roofCrowd({ h: 21.5, dow: 6, party: true, rain: 1 }).n, 0, 'nobody up there in the rain');
  const { L } = setup('402x874'), cache = new Map(), sat = Date.UTC(2026, 9, 25, 1, 30) / 1000;     // (Sat Oct 24, 9:30 pm local)
  let mx = 0, sum = 0, k = 0;
  for (let t = sat; t < sat + 3600; t += 5) { const R = roofAt(t, L, { off: OFF, party: () => true }, cache); mx = Math.max(mx, R.members.length); sum += R.members.length; k++;
    for (const v of R.visits) { assert.equal(v.legs[0].k, 'fade'); assert.equal(v.legs[v.legs.length - 1].k, 'fade'); } }
  assert.ok(mx <= FOLK.roofCap, `≤ ${FOLK.roofCap} (${mx})`);
  assert.ok(sum / k >= 2.5, `a party up there (${(sum / k).toFixed(1)} on average)`);
});
test('FP3b — THE WALK never skates, on a DIAGONAL too: the planted foot stays put ON SCREEN (x and y) while the body walks on — side-on, 3/4, toward + away', async () => {
  const { rigOf, lookOf } = await import('../js/screens/harbor/folk.js');
  const { cam } = setup('402x874');
  for (const name of ['commuter', 'lady', 'jogger', 'newsboy']) for (const hd of [0, Math.PI, 0.7, -0.6, 2.4, Math.PI / 2, -Math.PI / 2]) {
    const L = lookOf(name, 5, {}), v = name === 'jogger' ? 3.1 : 1.3, cx = Math.cos(hd), cz = Math.sin(hd);
    let prev = null, drift = 0, stance = 0;
    for (let d = 0; d < 6; d += 0.02) {
      const st = { pose: 'walk', hd, dist: d, v, x: 2 + cx * d, z: 45 + cz * d }, { J, fx, fy, H } = rigOf(cam, st, L, 0, false);
      const f = J.feet[0], p = [fx + f[0] * H, fy - f[1] * H];
      // (flat on the ground — the heel's rise at push-off lifts the ankle off it, by design)
      const flat = J.planted[0] && J.heel[0] === 0;
      if (flat && prev && prev.planted) { drift = Math.max(drift, Math.hypot(p[0] - prev.p[0], p[1] - prev.p[1])); stance++; }
      prev = { p, planted: flat };
    }
    assert.ok(stance > 30 && drift < 0.03, `${name} at ${hd.toFixed(2)}: the planted foot moves ${drift.toFixed(3)} pt a frame`);
  }
});
test('FP3b — STRAIGHT LEGS (the owner: "they look like they\'re squatting"): standing, waiting, chatting + the contact pose have straight legs at full height; the knee bends on the swing leg only', async () => {
  const { jointsOf, lookOf } = await import('../js/screens/harbor/folk.js');
  const L = lookOf('walker', 9, {});
  const bend = (J, i) => { const h = J.hips[i], k = J.knees[i], f = J.feet[i]; const a = Math.atan2(k[1] - h[1], k[0] - h[0]), b = Math.atan2(f[1] - k[1], f[0] - k[0]); return Math.abs(((a - b + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * 180 / Math.PI; };
  for (const pose of ['wait', 'chat', 'watch', 'look', 'shop', 'point']) for (const hd of [0, -Math.PI / 2, 0.8]) {
    const J = jointsOf({ pose, hd, dist: 0, v: 0 }, L, 0, false);
    assert.ok(bend(J, 0) < 4 && bend(J, 1) < 4, `${pose} at ${hd}: straight (${bend(J, 0).toFixed(1)}°, ${bend(J, 1).toFixed(1)}°)`);
    assert.ok(J.hip[1] >= 0.49, `${pose}: the hips at full height (${J.hip[1].toFixed(3)})`);
  }
  // walking side-on: the stance legs nearly straight all the way, the swing knee bending clearly at the passing pose
  let maxSwing = 0, maxStance = 0;
  for (let d = 0; d < 1.6; d += 0.01) {
    const J = jointsOf({ pose: 'walk', hd: 0, dist: d, v: 1.3 }, L, 0, false);
    for (let i = 0; i < 2; i++) { const b = bend(J, i); if (J.planted[i] && J.heel[i] === 0) maxStance = Math.max(maxStance, b); else if (!J.planted[i]) maxSwing = Math.max(maxSwing, b); }
  }
  assert.ok(maxStance < 10, `the stance leg straight while the foot is flat (≤ ${maxStance.toFixed(1)}°)`);
  assert.ok(maxSwing > 35, `the swing knee bends (${maxSwing.toFixed(1)}°)`);
});
// ------------------------------------------------------------------ POLISH 4 — THE PEOPLE CALMER (the owner: "a little too chaotic")
const onScreen = (cam, R) => R.members.filter(m => m.m.role !== 'dog' && m.routine !== 'dance' && m.s.z >= FOLK.zMin - 0.3 && Math.abs(m.s.x) < cam.hw(m.s.z));
// (NIGHT-B: `keep` picks who counts — the everyday crowd by default; THE STREET PARTY's people are on top of it, counted on their own)
const bandMean = (cam, L, M, day, h0, h1, cache, step = 30, keep = m => !m.sp) => { let n = 0, k = 0; for (let t = day + h0 * 3600; t < day + h1 * 3600; t += step) { n += onScreen(cam, folkAt(t, { L, M, ctx: { off: OFF } }, cache)).filter(keep).length; k++; } return n / k; };
// ---------------------------------------------------------------- Oct 25 — NO TRAFFIC DURING THE LEGENDARIES (core/harbor-legend.js#trafficHold)
test('NO TRAFFIC DURING THE LEGENDARIES: a bus due under the hold never comes; one already at the curb finishes; no car enters the back road under it', async () => {
  const { L } = setup('402x874'), M = folkMap(L);
  let b = null;
  for (let h = 8; h < 23 && !b; h++) { const bs = busesOf(L, '2026-10-22', h, DAY + h * 3600); if (bs.length) b = bs[0]; }
  assert.ok(b, 'a bus in the day');
  const t = b.tA + 3;                                                        // (at the curb, its door open)
  const plain = folkAt(t, { L, M, ctx: { off: OFF } }, new Map());
  assert.ok(plain.buses.some(x => x.id === b.id), 'without a legendary: at the curb');
  const held = folkAt(t, { L, M, ctx: { off: OFF, legend: { kind: 'tr3b', t0: b.tE - 1 } } }, new Map());
  assert.ok(!held.buses.some(x => x.id === b.id), 'due under the hold: it never comes (it rides on)');
  const before = folkAt(t, { L, M, ctx: { off: OFF, legend: { kind: 'tr3b', t0: b.tE + 6 } } }, new Map());
  assert.ok(before.buses.some(x => x.id === b.id), 'already there when the hold starts: it finishes its stop');
  // the back road over a whole TR-3B: no car ENTERS inside the hold (one from before may still be finishing)
  // (C4d: the hold from trafficHold itself — the literal 41.7 s outlived the TR-3B's 35.9 s hold, and a car entering legitimately at 41.5 s
  // failed it once C4d's bus timetable moved the scene)
  const { trafficHold } = await import('../js/core/harbor-legend.js');
  const t0 = b.tE - 1, lg = { kind: 'tr3b', t0 }, hold = trafficHold(lg), cache = new Map();
  let entered = 0, seen = 0;
  for (let s = hold[0] - 30; s < hold[1] + 60; s += 1) { const f = folkAt(s, { L, M, ctx: { off: OFF, legend: lg } }, cache); for (const c of f.cars) { seen++; if (c.ts != null && c.ts >= hold[0] && c.ts < hold[1]) entered++; } }
  assert.equal(entered, 0, `no car entered under the hold (${seen} car-seconds seen round it)`);
});

// ---------------------------------------------------------------- PEO — THE PEOPLE'S MOTION (Oct 25)
test('PEO — THE DANCERS’ ARMS never jump: danceMoves sampled at 120 Hz over 48 phrases × 6 dancers — every arm angle + bend moves < 0.13 rad a sample (≈ 15 rad/s), the spin’s turn continuous; the wave’s hand-over, the point’s trade, the spin’s arms and every phrase change eased', async () => {
  const { danceMoves } = await import('../js/screens/harbor/wands.js');
  const HZ = 120, dtB = 2 / HZ;   // (120 bpm: beats per sample)
  let worst = 0, where = '';
  for (let idx = 0; idx < 6; idx++) {
    let prev = null;
    for (let b = 0; b < 8 * 48; b += dtB) {
      const m = danceMoves(idx, b, `dancer${idx}`);
      if (prev) {
        for (let i = 0; i < 2; i++) { const d = Math.max(Math.abs(m.arms[i][0] - prev.arms[i][0]), Math.abs(m.arms[i][1] - prev.arms[i][1])); if (d > worst) { worst = d; where = `${prev.move} → ${m.move} at beat ${(b % 8).toFixed(2)}, arm ${i}`; } }
        const ds = Math.abs(m.spin - prev.spin); assert.ok(ds < 0.25 || Math.abs(ds - Math.PI * 2) < 0.25, `the spin's turn continuous (${ds.toFixed(2)} at beat ${b.toFixed(2)})`);
        assert.ok(Math.abs(m.sway - prev.sway) < 0.08 && Math.abs(m.dip - prev.dip) < 0.02, `the sway + the dip continuous at beat ${b.toFixed(2)} (${prev.move} → ${m.move})`);
      }
      prev = m;
    }
  }
  assert.ok(worst < 0.13, `the biggest arm move in one 120 Hz sample: ${worst.toFixed(3)} rad (${where})`);
});

test('PEO — THE STEP FOLLOWS THE SPEED: a stroll takes a shorter step than a brisk walk (real walking: ~0.65 m · √v), so every gait’s cadence lands in the human range (a walk ~105 steps a minute, 90–120; a jog ~150); the planted foot still never skates at any speed', async () => {
  const { STEP, strideLen, rigOf, lookOf } = await import('../js/screens/harbor/folk.js');
  const L = lookOf('commuter', 5, {}), M = 0.833;   // (1 unit = 0.833 m)
  const spm = v => (v / (STEP(L, v) * 2.1 * L.h)) * 60;
  assert.ok(STEP(L, FOLK.speed.stroll) < STEP(L, FOLK.speed.walk) && STEP(L, FOLK.speed.walk) < STEP(L, FOLK.speed.brisk), 'a longer step at a faster pace');
  for (const [g, lo, hi] of [['stroll', 85, 105], ['walk', 95, 115], ['brisk', 100, 125], ['jog', 135, 170]]) { const c = spm(FOLK.speed[g]); assert.ok(c >= lo && c <= hi, `${g}: ${c.toFixed(0)} steps a minute at ${(FOLK.speed[g] * M).toFixed(2)} m/s, a step of ${(STEP(L, FOLK.speed[g]) * 2.1 * L.h * M).toFixed(2)} m`); }
  const { cam } = setup('402x874');
  for (const v of [FOLK.speed.stroll, FOLK.speed.walk, FOLK.speed.brisk]) for (const hd of [0, 0.7, Math.PI / 2]) {
    const cx = Math.cos(hd), cz = Math.sin(hd);
    let prev = null, drift = 0, stance = 0;
    for (let d = 0; d < 6; d += 0.02) {
      const { J, fx, fy, H } = rigOf(cam, { pose: 'walk', hd, dist: d, v, x: 2 + cx * d, z: 45 + cz * d }, L, 0, false), f = J.feet[0], p = [fx + f[0] * H, fy - f[1] * H], flat = J.planted[0] && J.heel[0] === 0;
      if (flat && prev && prev.planted) { drift = Math.max(drift, Math.hypot(p[0] - prev.p[0], p[1] - prev.p[1])); stance++; }
      prev = { p, planted: flat };
    }
    assert.ok(stance > 30 && drift < 0.03, `v ${v} at ${hd.toFixed(2)}: the planted foot moves ${drift.toFixed(3)} pt a step of 0.02 units (stride ${strideLen(L, v).toFixed(2)})`);
  }
});

// 9f — THE JOGGERS ON THEIR OWN LANE (the owner, Oct 28: "the joggers didn't show" — 1 person in ~20 at lunch): one every ~1–2 min in
// their hours, none in heavy rain, &force=joggers every ~20 s at any hour
test('9g — THE JOGGER RUNS LIKE A RUNNER (the owner: the knees "bent way out in front of them"): the foot lands just ahead of the hips, the knee never carried far out in front, the heel folded up behind the hips, clear of the ground as it passes', async () => {
  const { jointsOf } = await import('../js/screens/harbor/folk.js');
  const L = { h: 1, jog: true, woman: false, kid: false, stride: 1 };
  let knee = 0, land = 0, passLift = 0, tuck = 0;
  for (let k = 0; k < 64; k++) {
    const J = jointsOf({ pose: 'walk', dir: 1, hd: 0, dist: k / 64 * 2 * 0.62 * 1.75, v: 3, x: 0, z: 40 }, L, 0, true, [0, 0]);
    const hx = J.hip[0];
    for (let i = 0; i < 2; i++) {
      knee = Math.max(knee, J.knees[i][0] - hx);
      if (J.planted[i]) land = Math.max(land, J.feet[i][0] - hx);
      // (the passing: the swing foot right under the hips — how high it rides)
      if (!J.planted[i] && Math.abs(J.feet[i][0] - hx) < 0.06) passLift = Math.max(passLift, J.feet[i][1]);
      // (the heel folded up toward the seat while the foot is still BEHIND the hips — the lower leg tucked, not the knee thrown forward)
      if (!J.planted[i] && J.feet[i][0] < hx - 0.04) tuck = Math.max(tuck, J.feet[i][1]);
    }
  }
  // (body heights; before 9g: the knee 0.22 ahead, the foot planted 0.22 ahead — overstriding — and the swing foot passing low)
  assert.ok(knee < 0.19, `the knee's furthest reach ahead of the hips: ${knee.toFixed(3)}`);
  assert.ok(land < 0.16, `the foot lands just ahead of the hips: ${land.toFixed(3)}`);
  assert.ok(tuck > 0.2, `the heel folded up behind the hips: ${tuck.toFixed(3)}`);
  assert.ok(passLift > 0.07, `the foot clear of the ground as it passes under the hips (no shuffle): ${passLift.toFixed(3)}`);
});
test('PROM — THE BARBERSHOP AWNING LIT FROM UNDERNEATH: on at dusk by the photocell, off at 1 am Sun–Thu / 2 am Fri–Sat + party nights (a short fade), off by day', async () => {
  const { awningLight } = await import('../js/core/harbor-speakeasy.js');
  const at = (dow, h, mi = 0) => ({ dow, h, mi });
  assert.equal(awningLight(at(2, 13), 0), 0, 'by day: off');
  assert.ok(awningLight(at(2, 20, 30), 0.12) < 0.01 && awningLight(at(2, 20, 30), 0.4) === 1, 'the photocell: dark enough → on');
  assert.equal(awningLight(at(3, 0, 59), 1), 1, 'Tue night, 12:59 am: still on');
  assert.equal(awningLight(at(3, 1, 5), 1), 0, 'Tue night, 1:05 am: off (last call)');
  assert.ok(awningLight(at(3, 0, 59.5), 1) < 1 && awningLight(at(3, 0, 59.5), 1) > 0, 'a short fade, never a snap');
  assert.equal(awningLight(at(6, 1, 30), 1), 1, 'Fri night (Sat 1:30 am): still on');
  assert.equal(awningLight(at(6, 2, 5), 1), 0, 'Fri night (Sat 2:05 am): off');
  assert.equal(awningLight(at(4, 1, 30), 1, true), 1, 'a holiday party night: the late switch-off');
  assert.equal(awningLight(at(4, 6, 0), 1), 0, 'before dawn: off');
});

test('C4b — &force=waterbench: a sitter seated on the water bench within ~10 s of the link (facing the harbor) + a couple stopped beside it watching the skyline', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), t0 = DAY + 15 * 3600 + 120;
  let sat = null, watched = false;
  for (let t = t0; t < t0 + 40; t += 0.5) {
    const f = folkAt(t, { L, M, ctx: { off: OFF, forceBenchAt: t0 } }, cache);
    for (const x of f.members) {
      if (x.vid && x.vid.startsWith('wb.0.bench') && x.s.pose === 'sit' && sat == null) { sat = t - t0; assert.ok(Math.abs(x.s.z - M.nodes.bench.z) < 0.3, 'on the bench'); }
      if (x.vid && x.vid.startsWith('wb.0.skyline') && x.s.pose === 'watch') watched = true;
    }
  }
  assert.ok(sat != null && sat <= 12, `seated ${sat} s after the link`);
  assert.ok(watched, 'a couple watching the skyline beside it');
});

test('C4d — &force=dogwalk: a walker + their dog on screen within ~10 s of the link, again every ~45 s from the other side; the dog beside the walker; every other one sniffs the hydrant — by day + at night', () => {
  for (const hr of [15, 21]) {
    const { cam, L } = setup('402x874'), M = folkMap(L), cache = new Map(), t0 = DAY + hr * 3600 + 120, on = x => x > 4 && x < cam.W - 4;
    let first = null, sniff = false, ks = new Set();
    for (let t = t0; t < t0 + 100; t += 0.5) {
      const f = folkAt(t, { L, M, ctx: { off: OFF, forceDogAt: t0 } }, cache);
      for (const w of f.members.filter(m => m.vid && m.vid.startsWith('dw.') && m.m.role === 'lead')) {
        const d = f.members.find(m => m.vid === w.vid && m.m.role === 'dog'), [wx] = project(cam, w.s.x, 0, w.s.z);
        if (!on(wx)) continue;
        if (wx > 40 && wx < cam.W - 40) assert.ok(d && on(project(cam, d.s.x, 0, d.s.z)[0]), `${hr}h: ${w.vid}'s dog on screen beside them`);   // (the dog a step ahead: at an edge it leaves first)
        ks.add(w.vid); if (first == null) first = t - t0;
        if (w.s.sniff) sniff = true;
      }
    }
    assert.ok(first != null && first <= 10, `${hr}h: on screen ${first} s after the link`);
    assert.ok(ks.size >= 2 && sniff, `${hr}h: ${ks.size} dog walks in 100 s, a sniff at the hydrant ${sniff}`);
  }
});

test('ATM-C — AN UMBRELLA IS HELD: the umbrella hand steady by the shoulder through the stride (a free arm swings), the other arm still swings', async () => {
  const { jointsOf: J0, lookOf: L0 } = await import('../js/screens/harbor/folk.js');
  const run = umb => {
    const L = L0('walker', 7, { rain: 0 }); L.umbrella = umb ? [28, 28, 34] : null; L.paper = false;
    const xs = [], ys = [], far = [];
    for (let i = 0; i < 40; i++) {
      const J = J0({ x: 0, z: 40, pose: 'walk', hd: 0, v: 1.4, dist: i * 0.05, a: 1 }, L, i * 0.05), n = J.near, h = J.hands[n], s = J.shs[n], fh = J.hands[1 - n], fs = J.shs[1 - n];
      xs.push(h[0] - s[0]); ys.push(h[1] - s[1]); far.push(fh[0] - fs[0]);
    }
    const span = a => Math.max(...a) - Math.min(...a);
    return { dx: span(xs), dy: span(ys), y: ys.reduce((a, b) => a + b, 0) / ys.length, far: span(far) };
  };
  const free = run(false), held = run(true);
  assert.ok(free.dx > 0.1, `a free arm swings (${free.dx.toFixed(3)})`);
  assert.ok(held.dx < 0.01 && held.dy < 0.01, `the umbrella hand steady (${held.dx.toFixed(3)}, ${held.dy.toFixed(3)})`);
  assert.ok(held.y > -0.15 && held.y < 0.02, `held up by the shoulder (${held.y.toFixed(3)} below it)`);
  assert.ok(held.far > 0.1, `the other arm still swings (${held.far.toFixed(3)})`);
});

// FR6 FIXES A — THE DOGS FLASHED COLOURS while walking (the owner, Nov 4): the looks were keyed on the per-frame gust field crossing 10,
// and the dog's coat was drawn LAST from the person's random stream — a gust added a hand-on-the-hat draw and re-coloured the dog.
test('ONE LOOK PER DOG: no weather, wind or season changes a walking dog\'s coat or size', async () => {
  const { lookOf } = await import('../js/screens/harbor/folk.js');
  const weathers = [{}, { wind: 0 }, { wind: 11 }, { wind: 30 }, { rain: 0.9 }, { rain: 0.9, wind: 20 }, { snow: 0.6, cold: true }, { season: 'summer' }, { season: 'winter', wind: 14 }, { party: true }];
  for (const seed of [1, 7, 42, 1924, 99991, 'vid-7']) {
    const base = lookOf('dogwalker', seed, { role: 'dog' });
    for (const w of weathers) {
      const L = lookOf('dogwalker', seed, { role: 'dog', ...w });
      assert.deepEqual(L.dog, base.dog, `seed ${seed}: the coat changed under ${JSON.stringify(w)}`);
      assert.equal(L.dogSize, base.dogSize, `seed ${seed}: the size changed under ${JSON.stringify(w)}`);
    }
  }
});

test('the looks are keyed on the weather\'s STEADY wind (windLook), not the per-frame gust field', async () => {
  const { readFileSync } = await import('node:fs');
  const ppl = readFileSync(new URL('../js/screens/harbor/people.js', import.meta.url), 'utf8');
  const key = /const lookFor = [\s\S]*?const key = `[^`]*`/.exec(ppl)[0];
  assert.doesNotMatch(key, /env\.wind\b/, 'the look cache key reads the live gust field');
  assert.match(key, /lookWind\(env\)/);
  const scene = readFileSync(new URL('../js/screens/harbor/scene.js', import.meta.url), 'utf8');
  const env = /function peopleEnv[\s\S]*?\n {2}\}/.exec(scene)?.[0] || '';
  assert.ok(env.includes('windLook:'), 'peopleEnv hands the looks the steady wind');
  assert.equal((env.match(/(?<![\w.])wind:/g) || []).length, 1, 'peopleEnv has ONE wind key (a duplicate key silently wins)');
});
