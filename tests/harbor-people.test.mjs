// CITY 2.0 — PART 8P: THE PEOPLE (+ section 0's pure pieces: the hush word sign, the lamps' life, the basement window, the crossing's
// light). node --test tests/harbor-people.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { hushPlan, hushState, strikeLevel, darkLevel, hushGlass } from '../js/core/harbor-hush.js';
import { lampThresholds, warmUp, lampMoment, LAMP_LIFE } from '../js/core/harbor-lamps.js';
import { FOLK, MIX, mixNow, folkMap, folkAt, busesOf, busStopX, linePlaces, roofAt, roofCrowd, KINDS, TIER_CAP, capByTier } from '../js/core/harbor-people.js';
import { signalAt } from '../js/core/harbor-promenade.js';

const SIZES = {
  '390x844': { W: 390, H: 844, safe: { top: 47, bottom: 34 } },
  '402x874': { W: 402, H: 874, safe: { top: 62, bottom: 34 } },
  '430x932': { W: 430, H: 932, safe: { top: 59, bottom: 34 } },
};
const setup = k => { const s = SIZES[k]; const cam = cameraFor(s.W, s.H, { dock: { x: 14, y: s.H - 116, w: s.W - 28, h: 76 } }, s.safe); return { cam, L: harborLayout(cam) }; };

// ------------------------------------------------------------------ THE HUSH WORD SIGN
test('8P — THE HUSH WORD SIGN: bare tubes in the lower-right upstairs window — a 4-letter word a 2 × 2 block as big as the glass allows; 5 letters (3 + 2) fit; inside the glass at 390 / 402 / 430', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = L.speakeasy, K = cam.F / s.z0, [a, b] = s.windows[2], [r0, r1] = s.rows[0], g = hushGlass(a, b, r0, r1);
    const four = hushPlan('JAZZ', g), five = hushPlan('SWING', g);
    assert.deepEqual(four.rows.map(r => r.word), ['JA', 'ZZ']); assert.deepEqual(five.rows.map(r => r.word), ['SWI', 'NG']);
    assert.ok(four.cap >= five.cap, `${k}: four letters at least as big as five`);
    for (const p of [four, five]) for (const r of p.rows) for (const l of r.letters) for (const q of l.polys) for (const [u, v] of q.pts)
      assert.ok(u >= g[0] - 1e-6 && u <= g[1] + 1e-6 && v >= g[2] - 1e-6 && v <= g[3] + 1e-6, `${k} ${p.text}: inside the glass`);
    // (the size the window allows: reported, not a pass mark — ~11 pt caps for four letters on a 390 phone)
    assert.ok(four.cap * K > 9.5, `${k}: four letters ${(four.cap * K).toFixed(1)} pt`);
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
test('8P — THE CROSSWALK LIT: the two lamps framing it light the crossing — brightest on the stripes nearest the promenade, fading across', async () => {
  const { crossLightOf, crossPools } = await import('../js/screens/harbor/road.js');
  for (const k of Object.keys(SIZES)) {
    const { L } = setup(k), cw = L.crosswalk, f = crossLightOf(L), mid = (cw.x0 + cw.x1) / 2;
    assert.equal(crossPools(L).length, 2, `${k}: the pair`);
    assert.ok(f(mid, 56.5) > 1, `${k}: the pools overlap on the crossing (${f(mid, 56.5).toFixed(2)})`);
    for (const x of [cw.x0, mid, cw.x1]) assert.ok(f(x, 55.5) > 0.6, `${k}: lit across its width`);
    assert.ok(f(mid, 63.9) < 0.2, `${k}: fading by the far kerb`);
  }
});

// ------------------------------------------------------------------ THE PEOPLE (section 1)
const OFF = -240, DAY = Date.UTC(2026, 9, 22, 4) / 1000;     // (Thu Oct 22 2026, local midnight in Grand Rapids)
const inR = (p, r) => p.x > r.x0 + 0.05 && p.x < r.x1 - 0.05 && p.z > r.z0 + 0.05 && p.z < r.z1 - 0.05;
test('8P — WHO\'S OUT WHEN: the mix by the clock (joggers + dogs early, the commute, lunch on the bench, couples + guests at night, nearly empty at 3 am), weekends busier, party nights a stream of guests, rain fewer', () => {
  const at = (h, o = {}) => mixNow({ h, dow: 4, ...o });
  assert.ok(at(3.5).n < 1, 'the small hours: almost empty');
  assert.ok(at(6.5).mix.jogger && at(6.5).mix.dogwalker && at(6.5).mix.worker, 'early: joggers, dog walkers, a worker to the bus');
  assert.ok(at(8.5).mix.brisk && at(8.5).mix.busrider && at(8.5).mix.newsboy, 'the commute');
  assert.ok(at(12.5).mix.lunch && at(12.5).mix.window && at(12.5).mix.customer, 'midday: lunch on the bench, a window-shopper, a customer');
  assert.ok(at(17).mix.homeward, 'late afternoon: heading home');
  assert.ok(at(20).mix.couple >= 3 && at(20).mix.guests, 'evening: couples, guests to the side door');
  assert.ok(at(23.5).mix.straggler && at(23.5).mix.leaving, 'late: stragglers, a couple leaving');
  assert.ok(at(12.5).n > at(3.5).n * 8 && at(12.5).n <= FOLK.cap, 'busiest at midday, never past the cap');
  assert.ok(mixNow({ h: 20.5, dow: 6 }).n >= at(20.5).n, 'a weekend evening busier');
  assert.ok(at(21, { party: true }).mix.guests > at(21).mix.guests * 2, 'party nights: a stream of guests');
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
      maxN = Math.max(maxN, heads.length);
      for (const m of heads) {
        const s = m.s; seenKinds.add(m.kind);
        assert.ok(s.z >= FOLK.zMin - 0.6, `${k}: ${m.kind} under the dock (z ${s.z.toFixed(2)})`);
        if (s.a >= 0.999 && m.m.role === 'lead') for (const r of block) assert.ok(!inR(s, r), `${k}: ${m.kind} inside ${r.id} at ${s.x.toFixed(2)}, ${s.z.toFixed(2)} (${s.pose})`);
        if (s.z > FOLK.roadZ + 0.2 && s.z < FOLK.farZ - 0.35 && m.m.role === 'lead') {
          const nearBus = Math.abs(s.x - busStopX(L)) < 2.2;
          assert.ok(s.cross || nearBus || s.a < 1, `${k}: ${m.kind} on the road, not crossing (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`);
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
      assert.ok(first.k === 'fade' || off(p0), `${v.kind} appears on screen at ${p0.x.toFixed(1)}, ${p0.z.toFixed(1)}`);
      assert.ok(last.k === 'fade' || off(p1), `${v.kind} leaves on screen at ${p1.x.toFixed(1)}, ${p1.z.toFixed(1)}`);
    }
  }
});
test('8P — JOIN MID-WAY: the promenade at any moment is the same on every phone (a cold start mid-afternoon = a phone that watched all day)', () => {
  const { L } = setup('402x874'), M = folkMap(L), warm = new Map();
  for (let t = DAY + 14 * 3600; t < DAY + 14 * 3600 + 900; t += 3) folkAt(t, { L, M, ctx: { off: OFF } }, warm);
  for (const t of [DAY + 14 * 3600 + 901, DAY + 14 * 3600 + 1333.3]) {
    const a = folkAt(t, { L, M, ctx: { off: OFF } }, warm), b = folkAt(t, { L, M, ctx: { off: OFF } }, new Map());
    assert.deepEqual(b.members.map(m => [m.vid, m.m.role, m.s.x.toFixed(4), m.s.z.toFixed(4), m.s.pose]), a.members.map(m => [m.vid, m.m.role, m.s.x.toFixed(4), m.s.z.toFixed(4), m.s.pose]));
    assert.ok(a.members.length > 2, 'people already there, mid-stroll');
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
test('FP3a — THE BUS DOOR shuts 3–5 s after the LAST rider (off or on) — never open long with nobody coming; nobody steps on after it shuts', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), buses = new Map(), last = new Map();
  for (let t = DAY + 6 * 3600; t < DAY + 30 * 3600; t += 2) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
    for (const b of f.buses) buses.set(b.id, b);
    for (const v of f.visits) for (const lg of v.legs) if (lg.k === 'fade' && lg.bus) last.set(lg.bus, Math.max(last.get(lg.bus) || 0, lg.t1));
  }
  let n = 0;
  for (const [id, b] of buses) {
    const l = last.get(id);
    if (l == null) { assert.ok(b.shut - (b.tA + 1) >= 3 - 1e-6 && b.shut - (b.tA + 1) <= 5 + 1e-6, `${id}: nobody — shut soon after it stops`); continue; }
    n++;
    assert.ok(b.shut - l >= 3 - 1e-6 && b.shut - l <= 5 + 1e-6, `${id}: shut ${(b.shut - l).toFixed(2)} s after the last rider`);
    assert.ok(b.shut < b.tD, `${id}: shut before it pulls away`);
  }
  assert.ok(n >= 20, `${n} buses with riders over the day`);
});

test('FP3a — THE PACE: ~25 % slower than 8P, strollers + couples slowest, commuters brisker, joggers clearly faster', () => {
  const S = FOLK.speed;
  assert.ok(S.walk <= 1.5 * 0.8 && S.walk >= 1.5 * 0.7, `walk ${S.walk}`);
  assert.ok(S.stroll < S.walk && S.walk < S.brisk && S.brisk * 1.8 < S.jog, 'stroll < walk < brisk, the jog clearly faster');
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
test('8P — THE WALK never slides: the planted foot stays put on the ground while the body walks on', async () => {
  const { jointsOf, lookOf } = await import('../js/screens/harbor/folk.js');
  for (const name of ['commuter', 'lady', 'jogger', 'newsboy']) {
    const L = lookOf(name, 5, {}), H = 2.1 * L.h, v = name === 'jogger' ? 3 : 1.5;
    let prev = null, drift = 0, stance = 0;
    for (let d = 0; d < 6; d += 0.02) {
      const J = jointsOf({ pose: 'walk', dir: 1, dist: d, v }, L, 0, false), f = J.feet[0], wx = d + f[0] * H;
      if (f[1] === 0 && prev && prev.planted) { drift = Math.max(drift, Math.abs(wx - prev.wx)); stance++; }
      prev = { wx, planted: f[1] === 0 };
    }
    assert.ok(stance > 50 && drift < 1e-4, `${name}: the planted foot drifts ${drift.toFixed(5)} units a step`);
  }
});
