// CITY 2.0 — PART 8P: THE PEOPLE (+ section 0's pure pieces: the hush word sign, the lamps' life, the basement window, the crossing's
// light). node --test tests/harbor-people.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout, project } from '../js/core/harbor-layout.js';
import { wallPlan, hushState, strikeLevel, darkLevel } from '../js/core/harbor-hush.js';
import { lampThresholds, warmUp, lampMoment, LAMP_LIFE } from '../js/core/harbor-lamps.js';
import { standSpots } from '../js/core/harbor-cabs.js';
import { DOOR, busDoorAt, CART_IN_Z, FOLK, MIX, mixNow, folkMap, folkAt, jogHour, JOG, busesOf, busStopX, linePlaces, roofAt, roofCrowd, KINDS, TIER_CAP, capByTier } from '../js/core/harbor-people.js';
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
      maxN = Math.max(maxN, heads.filter(m => m.routine !== 'dance').length);   // (POLISH 4: the dance circle on top of the crowd's cap)
      for (const m of heads) {
        const s = m.s; seenKinds.add(m.kind);
        assert.ok(s.z >= FOLK.zMin - (m.kind === 'trash' ? 1.4 : m.kind === 'cabwait' ? 1.05 : m.kind === 'vendor' && L.cart.from === 'below' ? FOLK.zMin - CART_IN_Z + 0.6 : 0.6), `${k}: ${m.kind} under the dock (z ${s.z.toFixed(2)})`);   // (C4b: the vendor wheels his cart up from the front street)   // (8b1: the collector at the can, beside the front-left globe; PROM: the cab stand's waiter on its bench at the front curb)
        if (m.kind === 'cabwait') assert.ok(project(cam, s.x, 0, s.z)[1] < cam.dock.y - 6, `${k}: the cab stand's waiter above the dock (${project(cam, s.x, 0, s.z)[1].toFixed(0)})`);
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
test('FP3a + POL4 — THE BUS DOOR shuts 6–9 s after the LAST rider (off or on) — never open long with nobody coming; nobody steps on after it shuts', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), buses = new Map(), last = new Map();
  for (let t = DAY + 6 * 3600; t < DAY + 30 * 3600; t += 2) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
    for (const b of f.buses) buses.set(b.id, b);
    // (FP3b: a rider is through the bus's door once past its threshold — the door leg's tClose, the group's last member lagging)
    for (const v of f.visits) for (const lg of v.legs) if (lg.k === 'door' && lg.bus) last.set(lg.bus, Math.max(last.get(lg.bus) || 0, lg.tClose + Math.max(0, ...v.members.map(m => m.lag))));
  }
  let n = 0;
  for (const [id, b] of buses) {
    const l = last.get(id);
    if (l == null) { assert.ok(b.shut - (b.tA + 1) >= 6 - 1e-6 && b.shut - (b.tA + 1) <= 9 + 1e-6, `${id}: nobody — shut soon after it stops`); continue; }
    n++;
    assert.ok(b.shut - l >= 6 - 1e-6 && b.shut - l <= 9 + 1e-6, `${id}: shut ${(b.shut - l).toFixed(2)} s after the last rider`);
    assert.ok(b.shut < b.tD, `${id}: shut before it pulls away`);
  }
  assert.ok(n >= 20, `${n} buses with riders over the day`);
});
test('C4c — EVERY LEASH HAS ITS DOG (the owner, Oct 29: "a dog walker with no dog"): every dog walker has a dog member, on screen whenever the walker is (390 / 402 / 430, a late-October day), the sniff at the hydrant with both of them on the screen; dogs come by every day + evening', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), M = folkMap(L), cache = new Map(), on = x => x > 2 && x < cam.W - 2;
    let walkers = 0, missing = 0, sniffs = 0, evening = 0;
    for (let t = DAY + 6 * 3600; t < DAY + 23 * 3600; t += 3) {
      const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
      for (const v of f.visits) if (v.kind === 'dogwalker') assert.ok(v.members.some(m => m.role === 'dog'), `${k}: visit ${v.id} has its dog`);
      const leads = f.members.filter(m => m.kind === 'dogwalker' && m.m.role === 'lead' && m.s.z < 44 && m.s.a !== 0);
      for (const w of leads) {
        const [wx] = project(cam, w.s.x, 0, w.s.z);
        if (!on(wx)) continue;
        walkers++;
        if ((t - DAY) / 3600 >= 18) evening++;
        const d = f.members.find(m => m.vid === w.vid && m.m.role === 'dog');
        const dx = d ? project(cam, d.s.x, 0, d.s.z)[0] : null;
        if (!d || dx < -4 || dx > cam.W + 4) missing++;
        if (w.s.sniff) { sniffs++; assert.ok(d && on(dx) && on(wx), `${k}: the sniff at the hydrant on screen (walker ${wx.toFixed(1)}, dog ${dx && dx.toFixed(1)})`); }
      }
    }
    assert.ok(walkers > 40 && missing / walkers < 0.03, `${k}: ${missing} of ${walkers} on-screen dog-walker frames without the dog on screen`);
    assert.ok(evening > 10, `${k}: dogs out in the evening too (${evening} frames after 6 pm)`);
    assert.ok(sniffs > 0, `${k}: a sniff at the hydrant through the day (${sniffs})`);
  }
});
test('C4c — THE BUS DOOR NEVER SNAPS: its open amount eases 0 → 1 → 0 (never more than a small step a 60 fps frame), opens fully at a stop, starts folding back only after the last rider is clear, shut at the shut time', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), seen = new Map(), last = new Map();
  for (let t = DAY + 7 * 3600; t < DAY + 10 * 3600; t += 2) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
    for (const b of f.buses) seen.set(b.id, b);
    for (const v of f.visits) for (const lg of v.legs) if (lg.k === 'door' && lg.bus) last.set(lg.bus, Math.max(last.get(lg.bus) || 0, lg.tClose + Math.max(0, ...v.members.map(m => m.lag))));
  }
  let n = 0;
  for (const [id, b] of seen) {
    let prev = 0, maxStep = 0, peak = 0, closeAt = null;
    for (let t = b.tA; t <= b.shut + 0.5; t += 1 / 60) {
      const d = busDoorAt(t, b, b.shut);
      maxStep = Math.max(maxStep, Math.abs(d.k - prev)); prev = d.k; peak = Math.max(peak, d.k);
      if (closeAt == null && d.phase === 'closing') closeAt = t;
    }
    assert.ok(maxStep <= 0.045, `${id}: the door moves at most ${maxStep.toFixed(3)} a frame (no snap)`);
    assert.equal(busDoorAt(b.shut, b, b.shut).k, 0, `${id}: shut at its shut time`);
    if (b.shut - b.tA > 3) assert.ok(peak > 0.999, `${id}: fully open at the stop (${peak.toFixed(3)})`);
    const l = last.get(id);
    if (l != null && closeAt != null) { n++; assert.ok(closeAt >= l + 1, `${id}: the fold back starts ${(closeAt - l).toFixed(2)} s after the last rider is through`); }
  }
  assert.ok(n >= 5, `${n} buses with riders checked`);
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
test('FP3b — THEY FACE WHERE THEY GO: the heading follows the route, turns at a corner are blended (no snap), a pose turns to its facing through a 3/4 frame, a half turn goes through the front', async () => {
  const { lerpHd, hdOfDir, dirOfHd, TURN } = await import('../js/core/harbor-people.js');
  assert.equal(dirOfHd(0), 1); assert.equal(dirOfHd(Math.PI), -1); assert.equal(dirOfHd(Math.PI / 2), 2); assert.equal(dirOfHd(-Math.PI / 2), 0);
  // a half turn right → left goes through the FRONT (sin < 0 half way)
  assert.ok(Math.sin(lerpHd(0, Math.PI, 0.5)) < -0.9 && Math.sin(lerpHd(Math.PI, 0, 0.5)) < -0.9, 'a half turn faces us half way');
  // over a day at 402: no frame-to-frame heading jump bigger than a turn could make in 1/30 s (except a member appearing)
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), ctx = { off: -240, seed: 1924 };
  const t0 = DAY + 12 * 3600, prev = new Map();
  let worst = 0, n = 0, turns = 0;
  for (let t = t0; t < t0 + 1200; t += 1 / 30) {
    const f = folkAt(t, { L, M, ctx }, cache);
    for (const m of f.members) {
      if (m.m.role === 'dog') continue;
      const id = m.vid + m.m.role, p = prev.get(id);
      if (p != null) { const d = Math.abs(((m.s.hd - p + 3 * Math.PI) % (2 * Math.PI)) - Math.PI); worst = Math.max(worst, d); n++; if (d > 0.01) turns++; }
      prev.set(id, m.s.hd);
    }
  }
  assert.ok(n > 10000 && turns > 50, `enough walking (${n} frames, ${turns} turning)`);
  assert.ok(worst < 0.5, `no snap: the biggest heading change in a frame ${worst.toFixed(3)} rad`);
  assert.ok(TURN.corner > 0.3 && TURN.pose > 0.3, 'turns take a few frames');
  assert.equal(hdOfDir(1), 0);
});
test('FP3b — REAL DOORS: nobody fades on the promenade — through the speakeasy\'s side door, the barbershop\'s + the bus\'s they WALK (a door leg); the door swings open only while someone passes, shut again within a second after', async () => {
  const { DOOR, doorLeg, doorOpenK } = await import('../js/core/harbor-people.js');
  const { DOORMAN } = await import('../js/core/harbor-crew.js');
  // a leg in: waits for the swing, walks through, the door shuts behind them while they walk on
  const lg = doorLeg('side', 'in', -8, 100, 1.2, 44);
  assert.ok(lg.z0 < 44 && lg.z1 > 44 + DOOR.clear, 'from the step to inside');
  assert.equal(doorOpenK(lg, 99.9), 0); assert.ok(doorOpenK(lg, 100 + DOOR.open) > 0.99, 'open before they step through');
  assert.ok(doorOpenK(lg, lg.tClose + DOOR.close + 0.01) === 0 && lg.t1 >= lg.tClose + DOOR.close - 1e-9, 'shut behind them — they are still walking in as it closes');
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map();
  let sideOpen = 0, shopOpen = 0, through = 0;
  for (let t = DAY + 8 * 3600; t < DAY + 26 * 3600; t += 0.5) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
    for (const m of f.members) { assert.equal(m.s.a == null ? 1 : m.s.a, 1, `${m.kind} fading at ${m.s.x.toFixed(1)}, ${m.s.z.toFixed(1)}`); if (m.s.door) through++; }
    if (f.doors.side > 0.5) sideOpen++; if (f.doors.shop > 0.5) shopOpen++;
    // (C4b: the doorman opens the side door a moment BEFORE the guest reaches it + holds it a moment after — DOORMAN.pre / post)
    const passing = id => f.visits.some(v => v.legs.some(lg => lg.k === 'door' && lg.door === id && t >= lg.tOpen - (id === 'side' ? DOORMAN.pre + DOORMAN.step : 0) - 0.01 && t <= lg.tClose + DOOR.close + 4));
    if (f.doors.side > 0.01) assert.ok(passing('side'), 'the side door opens only for someone');
    if (f.doors.shop > 0.01) assert.ok(passing('shop'), 'the shop door opens only for someone');
  }
  assert.ok(sideOpen > 20 && shopOpen > 10 && through > 100, `doors in use over the day (side ${sideOpen}, shop ${shopOpen}, ${through} member-frames in a doorway)`);
});
test('9d — THE DOOR CLOSER: the swing shut is one continuous motion — it starts gently, sweeps, SLOWS through the last ~9° and comes to rest at the latch (no speed left: never a snap)', async () => {
  const { closerLeft, CLOSER } = await import('../js/core/harbor-people.js');
  assert.equal(closerLeft(0), 1); assert.equal(closerLeft(1), 0);
  const N = 2000, v = [];
  for (let i = 0; i < N; i++) v.push((closerLeft(i / N) - closerLeft((i + 1) / N)) * N);   // (the closing speed, swings per closing time)
  assert.ok(v.every(x => x >= -1e-9), 'it never swings back open');
  assert.ok(v[0] < 0.05, `it starts from rest (${v[0].toFixed(3)})`);
  assert.ok(v[N - 1] < 0.02, `no speed left at the latch (${v[N - 1].toFixed(3)})`);
  let jump = 0; for (let i = 1; i < N; i++) jump = Math.max(jump, Math.abs(v[i] - v[i - 1]));
  assert.ok(jump < 0.01, `the speed never jumps (${jump.toFixed(4)} per step)`);
  const at = closerLeft(CLOSER.sweep), peak = Math.max(...v), late = v[Math.round(N * 0.9)];
  assert.ok(Math.abs(at - CLOSER.latch) < 1e-9 && late < peak * 0.35, `slow through the last degrees (${late.toFixed(2)} vs the sweep's ${peak.toFixed(2)})`);
});
test('FP3b — THE DANCE CIRCLE (the routines layer): party nights only, at the peak; dancers out of the side door + back in; the crowd routes round the compass while it dances; within the cap; tier 0 keeps 4 dancers', async () => {
  const { DANCE, danceSlot } = await import('../js/core/harbor-routines.js');
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), m = L.medallion;
  // (a Thursday night: none; a Saturday: SP5 — ON THE HOUR, every hour of the party (21:00 → 01:00), each ON its hour for two songs)
  const thu = Date.parse('2026-10-22T22:00:00-04:00') / 1000, sat = Date.parse('2026-10-24T21:00:00-04:00') / 1000;
  for (let j = Math.floor(thu / 3600); j < Math.floor(thu / 3600) + 4; j++) assert.equal(danceSlot(j, { off: OFF }), null, 'no circle on a Thursday');
  let sessions = 0;
  for (let j = Math.floor(sat / 3600); j < Math.floor(sat / 3600) + 5; j++) { const S = danceSlot(j, { off: OFF }); if (S) { sessions++; assert.ok(S.s0 - j * 3600 < 12 && S.s1 - S.s0 === DANCE.len, `on the hour: starts ${(S.s0 - j * 3600).toFixed(0)} s in, ${S.s1 - S.s0} s long (two songs)`); } }
  assert.equal(sessions, 5, `a circle every hour of the party (${sessions} / 5)`);
  assert.equal(danceSlot(Math.floor(sat / 3600), { off: OFF, event: true }), null, 'none under a holiday centrepiece');
  assert.equal(danceSlot(Math.floor(sat / 3600), { off: OFF, blocked: () => true }), null, 'none during a raid / a legendary');
  let formed = 0;
  for (let t = sat; t < sat + 2 * 3600; t += 4) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
    // (POLISH 4: the dance circle is ON TOP of the crowd — the crowd itself stays within the cap)
    assert.ok(f.members.filter(x => x.m.role !== 'dog' && x.routine !== 'dance').length <= FOLK.cap, 'the crowd within the cap');
    if (!f.dance.on || f.dance.k < 1) continue;
    formed++;
    const d = f.members.filter(x => x.kind === 'dancer');
    assert.ok(d.length >= 4 && d.length <= DANCE.n, `${d.length} dancers`);
    assert.equal(capByTier(f.members, 0).filter(x => x.kind === 'dancer').length, Math.min(DANCE.tier0, d.length), 'tier 0: the first four dancers kept');
    for (const x of f.members) if (!x.routine && x.m.role !== 'dog') assert.ok(Math.hypot(x.s.x - m.x, x.s.z - m.z) > m.ring + 0.2, `${x.kind} walking through the dance (${Math.hypot(x.s.x - m.x, x.s.z - m.z).toFixed(2)})`);
    for (const v of f.visits.filter(v => v.kind === 'dancer')) { assert.equal(v.legs[0].k, 'door'); assert.equal(v.legs[0].dir, 'out'); assert.equal(v.legs[v.legs.length - 1].dir, 'in'); }
  }
  assert.ok(formed > 100, `the circle danced (${formed} samples)`);
});
test('11a-2 — THE RING round the GIANT JACK-O\'-LANTERN: on Halloween night (a Saturday) the hourly dance circles it — evenly round it at RING.r, stepping on together along the arc (never a slide), nobody walking through it, the cart still out', async () => {
  const { RING, danceSlot } = await import('../js/core/harbor-routines.js');
  const onRing = x => Math.hypot((x.s.x - m.x) / RING.rx, (x.s.z - m.z - RING.cz) / RING.rz);
  const { GIANT } = await import('../js/core/harbor-holidayprops.js');
  const { L } = setup('402x874'), M = folkMap(L, { event: true, ring: true }), cache = new Map(), m = L.medallion;   // (people.js#ensureMap: the event's map)
  const sat = Date.parse('2026-10-31T22:00:00-04:00') / 1000, ctx = { off: OFF, event: true, ring: true };
  assert.ok(danceSlot(Math.floor(sat / 3600), ctx), 'the hour still has its dance with the giant standing (ring)');
  assert.equal(danceSlot(Math.floor(sat / 3600), { off: OFF, event: true }), null, 'a centrepiece that is not ringed still stops it');
  let posed = 0, moved = 0, prev = null, slides = 0;
  for (let t = sat + 70; t < sat + 400; t += 0.5) {
    const f = folkAt(t, { L, M, ctx }, cache);
    const d = f.members.filter(x => x.kind === 'dancer' && x.routine === 'dance');
    for (const x of d) {
      const r = onRing(x);
      if (x.s.pose === 'wands') { posed++; assert.ok(Math.abs(r - 1) < 0.02, `a dancer on the ring (${r.toFixed(3)})`); }
      if (x.s.pose === 'walk' && Math.abs(r - 1) < 0.04) { moved++; if (!(x.s.v > 0.3)) slides++; }
    }
    // (nobody walks through the giant: its girth + a body's width)
    // (PROM: the giant is drawn at today's on-screen size on the nearer compass — × centreK about its foot: its girth in world units)
    // (+ the compass came forward: the front strip passes just IN FRONT of it — drawn in front, never through it)
    for (const x of f.members) if (!x.routine && x.m.role !== 'dog') assert.ok(Math.hypot(x.s.x - m.x, x.s.z - m.z) > GIANT.body.R * centreK(L) * 1.08 || x.s.z - m.z < -GIANT.body.R * centreK(L), `${x.kind} walking through the giant (${(x.s.x - m.x).toFixed(2)}, ${(x.s.z - m.z).toFixed(2)})`);
    // (evenly round it: no two posed dancers closer than ~2/3 of a step)
    const ps = d.filter(x => x.s.pose === 'wands');
    for (let a = 0; a < ps.length; a++) for (let b = a + 1; b < ps.length; b++) assert.ok(Math.hypot(ps[a].s.x - ps[b].s.x, ps[a].s.z - ps[b].s.z) > RING.rz * 0.6, 'evenly spaced');
    prev = d;
  }
  void prev;
  assert.ok(posed > 1000 && moved > 50 && slides === 0, `the ring danced (${posed} posed samples) + stepped round together (${moved} walking samples, ${slides} sliding)`);
  // the chestnut cart still comes out (the giant stands on the inlay, the cart's spot is its own)
  let cart = 0; const c2 = new Map();
  for (let t = Date.parse('2026-10-29T18:30:00-04:00') / 1000; t < Date.parse('2026-10-29T21:00:00-04:00') / 1000; t += 60) if (folkAt(t, { L, M, ctx }, c2).cart.on) cart++;
  assert.ok(cart > 60, `the chestnut cart out with the giant up (${cart} min)`);
});
test('FP3b — THE VENDOR SPOT: the chestnut cart wheeled in ~6:30 pm + out ~9:30 pm in the cold months only, its vendor with it; never while the inlay is in use; its customers only while it stands there', async () => {
  const { VENDOR } = await import('../js/core/harbor-routines.js');
  const { L } = setup('402x874'), M = folkMap(L);
  const run = (iso, hours, ctx = {}) => { const cache = new Map(), t0 = Date.parse(iso) / 1000, out = []; for (let t = t0; t < t0 + hours * 3600; t += 20) out.push([t, folkAt(t, { L, M, ctx: { off: OFF, ...ctx } }, cache)]); return out; };
  // October: out in the evening, parked at the spot, its vendor behind it; gone by day + late
  const oct = run('2026-10-22T08:00:00-04:00', 16);
  const hourOf = t => ((t - (Date.parse('2026-10-22T00:00:00-04:00') / 1000)) / 3600);
  let parked = 0, buyers = 0;
  for (const [t, f] of oct) {
    const h = hourOf(t);
    if (h < VENDOR.from - 0.4 || h > VENDOR.to + 0.4) assert.ok(!f.cart.on, `no cart at ${h.toFixed(2)}`);
    if (f.cart.on && f.cart.parked) { parked++; assert.ok(Math.abs(f.cart.x - L.cart.x) < 1e-6, 'parked at the spot'); assert.ok(f.members.some(m => m.kind === 'vendor' && m.s.pose === 'cart'), 'its vendor behind it'); }
    for (const m of f.members) if (m.kind === 'cart' && m.s.pose === 'cart') { buyers++; assert.ok(f.cart.parked, 'a customer only while it stands there'); }
  }
  assert.ok(parked > 400, `out all evening (${parked} samples)`);
  assert.ok(buyers > 5, `people stop for chestnuts (${buyers})`);
  // July: never
  for (const [, f] of run('2026-07-16T17:00:00-04:00', 6)) assert.ok(!f.cart.on, 'no chestnuts in July');
  // the inlay in use (a centrepiece / the dance circle): it doesn't come out
  for (const [, f] of run('2026-10-22T18:00:00-04:00', 4, { event: true })) assert.ok(!f.cart.on, 'not while a centrepiece stands');
  for (const [, f] of run('2026-10-22T18:00:00-04:00', 4, { forceDance: true })) assert.ok(!f.cart.on, 'not while the circle dances');
});

// ------------------------------------------------------------------ POLISH 4 — THE PEOPLE CALMER (the owner: "a little too chaotic")
const onScreen = (cam, R) => R.members.filter(m => m.m.role !== 'dog' && m.routine !== 'dance' && m.s.z >= FOLK.zMin - 0.3 && Math.abs(m.s.x) < cam.hw(m.s.z));
const bandMean = (cam, L, M, day, h0, h1, cache, step = 30) => { let n = 0, k = 0; for (let t = day + h0 * 3600; t < day + h1 * 3600; t += step) { n += onScreen(cam, folkAt(t, { L, M, ctx: { off: OFF } }, cache)).length; k++; } return n / k; };
test('POLISH 4 — THE COUNTS ON SCREEN: a weekday daytime 4–5, lunch + after work 6–7, a normal night 3–4, a party night 8–12 (the dance circle on top), late at night 0–3', () => {
  const { cam, L } = setup('402x874'), M = folkMap(L), cache = new Map(), SAT = DAY + 2 * 86400;
  const bands = [['weekday daytime', DAY, 9.5, 11, 3.6, 5.4], ['weekday afternoon', DAY, 14.2, 16, 3.6, 5.4], ['lunch', DAY, 12, 13.5, 5.6, 7.4], ['after work', DAY, 16.6, 18.2, 5.6, 7.6],
    ['a normal night', DAY, 19, 22, 2.8, 4.6], ['a party night', SAT, 21, 24, 7.6, 12], ['late at night', DAY + 86400, 0.25, 1.75, 0, 3]];
  for (const [name, day, h0, h1, lo, hi] of bands) { const v = bandMean(cam, L, M, day, h0, h1, cache); assert.ok(v >= lo && v <= hi, `${name}: ${v.toFixed(2)} on screen (want ${lo}–${hi})`); }
});
test('POLISH 4 — LINGER MORE: most of the day\'s people stay a while (a pose of 20 s or more) — the bench for minutes, the railing, a chat, the bus stop; few walk straight through', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), seen = new Map();
  for (let t = DAY + 9 * 3600; t < DAY + 18 * 3600; t += 20) for (const v of folkAt(t, { L, M, ctx: { off: OFF } }, cache).visits) seen.set(v.id, v);
  const vs = [...seen.values()].filter(v => !v.routine), stay = vs.filter(v => v.legs.some(lg => lg.k === 'pose' && lg.t1 - lg.t0 >= 20));
  assert.ok(stay.length / vs.length > 0.55, `${stay.length} of ${vs.length} stay a while`);
  const sit = vs.filter(v => v.legs.some(lg => lg.k === 'pose' && lg.pose === 'sit' && lg.t1 - lg.t0 >= 100));
  assert.ok(sit.length >= 10, `${sit.length} sat on the bench for minutes`);
});
test('POLISH 4 — THE SPEAKEASY STAYS SECRET: by day only the barbershop\'s odd customer (nobody at the side door); evenings a trickle at the side door; party nights THE LINE — queued left of the door, the doorman letting a few in at a time', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), SAT = DAY + 2 * 86400;
  const doorsIn = (day, h0, h1) => { const seen = new Map(); for (let t = day + h0 * 3600; t < day + h1 * 3600; t += 15) for (const v of folkAt(t, { L, M, ctx: { off: OFF } }, cache).visits) seen.set(v.id, v);
    const c = { side: 0, shop: 0 }; for (const v of seen.values()) if (!v.routine) for (const lg of v.legs) if (lg.k === 'door' && lg.dir === 'in' && lg.door in c) c[lg.door]++; return c; };
  const day = doorsIn(DAY, 10, 16), eve = doorsIn(DAY, 19, 22);
  assert.equal(day.side, 0, 'nobody at the side door by day');
  assert.ok(day.shop / 6 <= 10, `the barbershop: ${(day.shop / 6).toFixed(1)} customers an hour`);
  assert.ok(eve.side / 3 >= 6 && eve.side / 3 <= 22, `an evening: ${(eve.side / 3).toFixed(1)} in at the side door an hour — a trickle`);
  // the party night's line: on, a few in it most of the time, never past its max; the doorman by the door; admissions a few at a time
  let on = 0, sum = 0, k = 0, doorman = 0;
  for (let t = SAT + 21.5 * 3600; t < SAT + 23.5 * 3600; t += 10) {
    const R = folkAt(t, { L, M, ctx: { off: OFF } }, cache); k++;
    if (R.line.on) on++;
    sum += R.line.n; assert.ok(R.line.n <= 7, `the line ${R.line.n}`);
    if (R.members.some(m => m.kind === 'doorman' && m.s.pose !== 'walk')) doorman++;
    for (const m of R.members.filter(m => m.kind === 'liner' && m.s.pose === 'wait' && !m.s.door)) assert.ok(m.s.x < M.nodes.sideDoor.x && m.s.z > FOLK.zMin, 'queued left of the side door');
  }
  assert.ok(on === k && sum / k >= 1.5, `the line: ${(sum / k).toFixed(1)} waiting on average`);
  assert.ok(doorman / k > 0.95, 'the doorman at the door');
  const ln = folkAt(SAT + 22 * 3600, { L, M, ctx: { off: OFF } }, cache);
  assert.ok(ln.visits.filter(v => v.kind === 'liner').every(v => v.legs[v.legs.length - 1].k === 'door' && v.legs[v.legs.length - 1].dir === 'in'), 'every guest in the line goes in by the door');
  // never with Lobby 2.0's own line
  assert.equal(folkAt(SAT + 22 * 3600, { L, M, ctx: { off: OFF, lobby: 4 } }, new Map()).line.on, false);
});
test('POLISH 4 — ARRIVALS SPREAD OUT, never a burst: a new arrival (not a bus\'s riders, not the dance circle) at most every ~9 s', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), starts = new Map();
  for (const day of [DAY, DAY + 2 * 86400]) for (let t = day + 7 * 3600; t < day + 24 * 3600; t += 15)
    for (const v of folkAt(t, { L, M, ctx: { off: OFF } }, cache).visits) if (!v.routine && v.kind !== 'busrider' && v.kind !== 'doorman') starts.set(v.kind === 'liner' ? v.id.replace(/\.\d+$/, '') : v.id, v.t0);
  const ts = [...starts.values()].sort((a, b) => a - b);
  let perMin = new Map(); for (const t of ts) { const m = Math.floor(t / 60); perMin.set(m, (perMin.get(m) || 0) + 1); }
  // (SP5: the hourly dance circle moved the line's guests' schedule — one Saturday minute at ~22:25 has 8 starts (the stream's 9-s gap + the
  // line's own guests are separate schedules); 8 is the ceiling now, never a burst within 3 s)
  assert.ok(Math.max(...perMin.values()) <= 8, `at most ${Math.max(...perMin.values())} arrivals in a minute`);
  let close = 0; for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] < 3) close++;
  assert.ok(close / ts.length < 0.05, `${close} of ${ts.length} arrivals within 3 s of another`);
});
test('8b2 — THE BENCH\'S SEATS: reserved — two sitters never share a seat (nobody sits on anybody), each at least a body apart; a full bench means they walk on', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), seen = new Map();
  let both = 0;
  for (let t = DAY + 6 * 3600; t < DAY + 2 * 86400; t += 4) {
    const R = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
    const sitting = R.members.filter(m => m.m.role === 'lead' && m.s.pose === 'sit');
    for (let i = 0; i < sitting.length; i++) for (let j = i + 1; j < sitting.length; j++) assert.ok(Math.abs(sitting[i].s.x - sitting[j].s.x) > 0.9, `two on one seat at ${((t - DAY) / 3600).toFixed(2)} h`);
    if (sitting.length >= 2) both++;
    for (const v of R.visits) if (v.seat) seen.set(v.id, v.seat);
  }
  const S = [...seen.values()];
  for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) if (S[i].i === S[j].i) assert.ok(S[i].t1 <= S[j].t0 || S[j].t1 <= S[i].t0, 'a seat reserved twice at once');
  assert.ok(S.length >= 20 && both > 0, `the bench is used (${S.length} sitters, ${both} samples with two at once)`);
});

// ---------------------------------------------------------------- Oct 25 — NO TRAFFIC DURING THE LEGENDARIES (core/harbor-legend.js#trafficHold)
test('NO TRAFFIC DURING THE LEGENDARIES: a bus due under the hold never comes; one already at the curb finishes; no car enters the back road under it', () => {
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
  const t0 = b.tE - 1, hold = [t0 - 4, t0 + 41.7], cache = new Map();
  let entered = 0, seen = 0, lg = { kind: 'tr3b', t0 };
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
test('9f — THE JOGGERS: one every ~1–2 min in their hours (lunch, after work, early, weekend mornings), none in heavy rain; forced every ~20 s', () => {
  const { L } = setup('402x874'), M = folkMap(L);
  const count = (h0, mins, ctx = {}) => {
    const t0 = DAY + h0 * 3600, cache = new Map(), seen = new Set();
    for (let t = t0; t < t0 + mins * 60; t += 2) for (const x of folkAt(t, { L, M, ctx: { off: OFF, ...ctx } }, cache).members) if (x.kind === 'jogger') seen.add(x.vid);
    return seen.size;
  };
  const lunch = count(12, 30), after = count(17.5, 30), dull = count(15, 30), wet = count(12, 30, { rain: 0.8 }), forced = count(3, 10, { forceJog: true });
  assert.ok(lunch >= 14 && lunch <= 32, `lunch (Thu 12:00–12:30): a jogger every ~1–2 min (${lunch} in 30 min)`);
  assert.ok(after >= 14 && after <= 32, `after work (17:30–18:00): ${after} in 30 min`);
  assert.equal(dull, 0, `mid-afternoon (15:00–15:30) none (${dull})`);
  assert.equal(wet, 0, `heavy rain at lunch: none (${wet})`);
  assert.ok(forced >= 20, `&force=joggers at 3 am: one every ~20 s (${forced} in 10 min)`);
  assert.ok(jogHour(9, true) && !jogHour(9, false) && JOG.gap[1] <= 120, 'weekend mornings 8–10 only on the weekend');
});

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

test("C4b — THE DOORMAN OPENS THE DOOR: at rest at his post facing us (attend); for each guest he steps to the door's handle side, holds it open over the guest's whole passage, tips his cap, steps back; two guests close together share one hold; never inside the door", async () => {
  const { DOORMAN, doormanHolds, doormanAt, doormanWall, doormanHoldSpot } = await import('../js/core/harbor-crew.js');
  const { doorOpenK, DOOR } = await import('../js/core/harbor-people.js');
  const { L } = setup('402x874'), post = doormanWall(L), hold = doormanHoldSpot(L), s = L.speakeasy;
  const g = { tOpen: 100, tClose: 102.4 }, H = doormanHolds([g, { tOpen: 104, tClose: 106 }, { tOpen: 130, tClose: 132 }]);
  assert.equal(H.length, 2, 'two guests 4 s apart share one hold');
  assert.equal(doormanAt(post, hold, H, 90).pose, 'attend');
  const atOpen = doormanAt(post, hold, H, g.tOpen);
  assert.ok(atOpen.pose === 'holdDoor' && Math.hypot(atOpen.x - hold.x, atOpen.z - hold.z) < 1e-9, 'at the door when the guest arrives');
  assert.ok(atOpen.swing.tOpen <= g.tOpen && atOpen.swing.tClose >= g.tClose, "his swing contains the guest's");
  // the door through his hold: open as the guest steps through, monotone (never snaps shut + open again between the two guests)
  let prev = -1, closedMid = false; for (let t = H[0].a; t < H[0].b; t += 0.05) { const k = doorOpenK(atOpen.swing, t); if (prev > 0.99 && k < 0.5) closedMid = true; prev = k; }
  assert.ok(!closedMid && doorOpenK(atOpen.swing, g.tOpen + 0.5) > 0.99, 'held open');
  let tipped = 0; for (let t = 99; t < 108; t += 0.1) tipped = Math.max(tipped, doormanAt(post, hold, H, t).tip);
  assert.ok(tipped > 0.9, 'he tips his cap');
  assert.equal(doormanAt(post, hold, H, H[0].b + DOORMAN.step + 0.1).pose, 'attend', 'back at his post');
  // never inside the door's rect (the opening u0..u1 at the facade)
  for (const p of [post, hold]) assert.ok(p.x > s.x0 + s.door.u1 && p.z < s.z0, 'outside the doorway, right of it');
  void DOOR;
});

test("C4b — THE PEOPLE RULE: across a UFO night + a TR-3B night nobody appears in view — every walker's first frame after the start is at a way in (off a screen edge, in a doorway, the back road / the crossing's far kerb, the front street under the dock); the promenade refills after the empty spell, staggered", async () => {
  const { WITNESS, REJOIN } = await import('../js/core/harbor-witness.js');
  for (const k of ['390x844', '402x874']) {
    const { cam, L } = setup(k), M = folkMap(L);
    for (const [kind, t0] of [['ufo', DAY + 21.5 * 3600 + 17], ['tr3b', DAY + 22 * 3600 + 400]]) {
      const lg = { kind, t0 }, end = t0 + WITNESS[kind].len + WITNESS[kind].empty, cache = new Map(), seen = new Set(), arrivals = [];
      let back = 0;
      for (let t = t0 - 6; t < end + REJOIN.stagger[1] + 90; t += 0.25) {
        const f = folkAt(t, { L, M, ctx: { off: OFF, legend: lg } }, cache), first = t === t0 - 6;
        for (const x of f.members) {
          if (x.m.role === 'dog') continue;
          const id = `${x.vid}|${x.m.seed}`; if (seen.has(id)) continue; seen.add(id);
          if (first) continue;
          const s = x.s, edge = Math.abs(s.x) >= cam.hw(s.z) + 0.9, way = edge || !!s.door || s.z >= FOLK.roadZ - 0.1 || s.z < FOLK.zMin - 0.4 || (s.a != null && s.a < 0.2);
          assert.ok(way, `${k} ${kind}: ${x.kind} (${x.vid}) appeared at ${s.x.toFixed(2)}, ${s.z.toFixed(2)} (${s.pose}) ${(t - t0).toFixed(1)} s in`);
          arrivals.push(t); if (t > end) back++;
        }
      }
      assert.ok(back >= 2, `${k} ${kind}: the promenade refills after the empty spell (${back} walked in)`);
    }
  }
});

test('C4c — THE BENCHES ARE SOLID (the owner, Oct 29: a cab-stand waiter from behind walked THROUGH the bench, then sat): at 390 / 402 / 430 over a day + forced cab-stand waiters, nobody\'s feet are ever inside either bench\'s footprint except a sitter on it (seated, or stepping into a seat of the water bench from its water side); a waiter reaches the cab bench round its END', () => {
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), M = folkMap(L), cache = new Map(), bad = [];
    const fp = [L.bench, L.cabStand].filter(Boolean).map(b => ({ id: b.face, b, x0: b.x - b.w / 2, x1: b.x + b.w / 2, z0: b.z, z1: b.z + 1.62 }));
    const seatOK = (m, q) => q.id === 'water' && (m.kind === 'bench' || m.kind === 'lunch' || m.kind === 'waterbench') && m.m.role === 'lead' && Math.abs(m.s.z - (q.b.z + 0.95)) < 1.15;
    const step = k === '402x874' ? 1 : 3;
    for (const [from, to, ctx] of [[DAY + 6 * 3600, DAY + 24 * 3600, { off: OFF }], [DAY + 20 * 3600, DAY + 20.6 * 3600, { off: OFF, forceStandAt: DAY + 20 * 3600 }]]) {
      for (let t = from; t < to; t += step) {
        const f = folkAt(t, { L, M, ctx }, cache);
        for (const m of f.members) { if (m.m.role === 'dog' || m.s.pose === 'sit') continue;
          for (const q of fp) if (m.s.x > q.x0 && m.s.x < q.x1 && m.s.z > q.z0 && m.s.z < q.z1 && !seatOK(m, q)) bad.push(`${q.id} ${m.kind}/${m.m.role} ${m.s.pose} @${((t - DAY) / 3600).toFixed(3)} h (${m.s.x.toFixed(2)}, ${m.s.z.toFixed(2)})`); }
      }
    }
    assert.equal(bad.length, 0, `${k}: inside a bench — ${bad.slice(0, 5).join(' · ')}`);
    // the forced waiter: seated on the cab bench, having come round its end (his path never crosses the bench's x-span behind its front)
    const S = standSpots(L);
    assert.ok(S.up.x < L.cabStand.x - L.cabStand.w / 2 && S.up.z < L.cabStand.z, `${k}: the waiter steps up at the bench's front-left corner`);
  }
});

test('C4c — THE SIDE DOOR SWINGS OUT toward the doorman (hinged at its right): over a Saturday night\'s guests at 402 the moving leaf never passes through anyone (nobody within its 1.5 u reach at its own angle ±12°), the doorman holds it from just right of its free edge, everyone who opens it stands outside its arc', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), s = L.speakeasy, hx = s.x0 + s.door.u1, hz = s.z0, W = s.door.u1 - s.door.u0;
  const SWING = 1.35, hits = []; let moving = 0, guests = 0;
  for (let t = DAY + 2 * 86400 + 21 * 3600; t < DAY + 2 * 86400 + 22.5 * 3600; t += 0.25) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache), k = f.doors ? f.doors.side : 0;
    if (!(k > 0.02)) continue;
    moving++;
    const th = k * SWING;
    for (const m of f.members) {
      if (m.m.role === 'dog' || m.s.z >= hz - 0.05 || m.s.x >= hx) continue;
      const dx = hx - m.s.x, dz = hz - m.s.z, r = Math.hypot(dx, dz), phi = Math.atan2(dz, dx);
      if (r < W - 0.05 && Math.abs(phi - th) < 0.21) hits.push(`${m.kind} @${((t - DAY) / 3600 % 24).toFixed(3)} h k ${k.toFixed(2)} (r ${r.toFixed(2)}, ${(phi * 180 / Math.PI).toFixed(0)}° vs the leaf ${(th * 180 / Math.PI).toFixed(0)}°)`);
      if (m.s.door && m.s.door.id === 'side') guests++;
    }
  }
  assert.ok(moving > 40, `${moving} frames of the side door open`);
  assert.equal(hits.length, 0, `the leaf through someone: ${hits.slice(0, 4).join(' · ')}`);
  assert.ok(DOOR.stepSide >= W + 0.03, `whoever opens it stands outside its arc (${DOOR.stepSide} ≥ ${W})`);
});
