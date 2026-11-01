// CITY 2.0 — THE PEOPLE, part of harbor-people.test.mjs split out (PERF-A, FR5 D4: the unit suite's wall time is its slowest FILE —
// the one 79-s file became six of ~8–15 s, the same checks): THE VENDOR, THE FORCED BUS, THE HEADINGS, THE DOG'S TURN, THE PEOPLE RULE, THE JOGGERS. node --test tests/harbor-people-walks.test.mjs
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

const OFF = -240, DAY = Date.UTC(2026, 9, 22, 4) / 1000;     // (Thu Oct 22 2026, local midnight in Grand Rapids)
const inR = (p, r) => p.x > r.x0 + 0.05 && p.x < r.x1 - 0.05 && p.z > r.z0 + 0.05 && p.z < r.z1 - 0.05;
const onScreen = (cam, R) => R.members.filter(m => m.m.role !== 'dog' && m.routine !== 'dance' && m.s.z >= FOLK.zMin - 0.3 && Math.abs(m.s.x) < cam.hw(m.s.z));
// (NIGHT-B: `keep` picks who counts — the everyday crowd by default; THE STREET PARTY's people are on top of it, counted on their own)
const bandMean = (cam, L, M, day, h0, h1, cache, step = 30, keep = m => !m.sp) => { let n = 0, k = 0; for (let t = day + h0 * 3600; t < day + h1 * 3600; t += step) { n += onScreen(cam, folkAt(t, { L, M, ctx: { off: OFF } }, cache)).filter(keep).length; k++; } return n / k; };
// 9f — THE JOGGERS ON THEIR OWN LANE (the owner, Oct 28: "the joggers didn't show" — 1 person in ~20 at lunch): one every ~1–2 min in
// their hours, none in heavy rain, &force=joggers every ~20 s at any hour

test('HOTFIX Oct 29 — THE FORCED BUS NEVER RE-PLANS EVERY FRAME (it ran at 5 fps on the owner\'s iPhone: an 80-entry FIFO plan cache, a working set of ~95): frames replayed as people.js calls them (+ the 70 s warm-ahead) plan almost nothing new once warm — a plain day, a plain night, &force=bus, &force=dogwalk', () => {
  const { L } = setup('402x874'), M = folkMap(L), off = -240;
  const cases = [
    ['day (a real bus stops)', '2026-10-30T15:00:00Z', {}],
    ['night', '2026-10-31T03:00:00Z', {}],
    ['&force=bus', '2026-10-30T15:00:00Z', { forceBus: true }],
    ['&force=dogwalk', '2026-10-30T23:12:00Z', { dog: true }],
  ];
  for (const [label, when, f] of cases) {
    const t0 = Date.parse(when) / 1000, cache = new Map();
    // (a plan made = a set of a key not just taken out for the least-recently-used move to the back)
    let fresh = 0, moved; const set = cache.set.bind(cache), del = cache.delete.bind(cache);
    cache.delete = k => { moved = k; return del(k); };
    cache.set = (k, v) => { if (!cache.has(k) && k !== moved) fresh++; moved = undefined; return set(k, v); };
    const ctx = { off, seed: 1924, budget: 1, shopOpen: () => true, forceBus: !!f.forceBus, forceBusAt: f.forceBus ? t0 : null, forceDogAt: f.dog ? t0 : null };
    folkAt(t0, { L, M, ctx }, cache); folkAt(t0 + 70, { L, M, ctx }, cache);
    const frames = 20 * 120; let warmAt = t0, n0 = fresh, worst = 0;
    // (two minutes at 20 fps; the warm-ahead every 5 s like people.js#warm — a whole bus cycle + more)
    for (let i = 1; i <= frames; i++) {
      const t = t0 + i / 20, before = fresh;
      folkAt(t, { L, M, ctx }, cache);
      worst = Math.max(worst, fresh - before);
      if (t - warmAt >= 5) { warmAt = t; folkAt(t + 70, { L, M, ctx }, cache); }
    }
    const per = (fresh - n0) / frames;
    assert.ok(cache.size <= FOLK_CACHE, `${label}: within the cap`);
    assert.ok(per < 1, `${label}: ${per.toFixed(2)} new plans a frame once warm (a thrashing cache re-plans hundreds)`);
  }
});
test('HOTFIX Oct 29 — THE DOG TURNS IN ONE EASED TURN (the owner: jittery turning away from an obstacle — it jumped up to 1.8 u a frame from one side of its walker to the other): on the forced dog walks it never moves more than ~0.15 u a 60 fps frame, its heading never more than 0.13 rad a frame, its facing never flips back within half a second; its place beside the walker is the old one on the four headings + continuous between', () => {
  // (the old four places: across → { dx·dir, dz }; in / out → { dz, ±dx })
  const m = { dx: 1.05, dz: -0.25 }, near = (a, b) => Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.z - b.z) < 1e-9;
  assert.ok(near(dogOffset(m, 0), { x: 1.05, z: -0.25 }) && near(dogOffset(m, Math.PI), { x: -1.05, z: -0.25 }) && near(dogOffset(m, Math.PI / 2), { x: -0.25, z: 1.05 }) && near(dogOffset(m, -Math.PI / 2), { x: -0.25, z: -1.05 }), 'the four headings: the old places');
  for (let h = -Math.PI; h < Math.PI; h += 0.002) { const a = dogOffset(m, h), b = dogOffset(m, h + 0.002); assert.ok(Math.hypot(a.x - b.x, a.z - b.z) < 0.02, `continuous at ${h.toFixed(3)}`); }
  const { L } = setup('402x874'), M = folkMap(L), off = -240, t0 = Date.parse('2026-10-30T23:12:00Z') / 1000, cache = new Map();
  const ctx = { off, seed: 1924, budget: 1, shopOpen: () => true, forceDogAt: t0 }, tr = new Map();
  for (let i = 0; i < 60 * 200; i++) {
    const t = t0 + i / 60;
    for (const x of folkAt(t, { L, M, ctx }, cache).members) if (x.kind === 'dogwalker' && x.m.role === 'dog') { if (!tr.has(x.vid)) tr.set(x.vid, []); tr.get(x.vid).push({ t, ...x.s }); }
  }
  assert.ok(tr.size >= 3, `${tr.size} dog walks in 200 s`);
  for (const [id, a] of tr) {
    let step = 0, turn = 0, lastFlip = -9, sign = null, back = 0;
    for (let i = 1; i < a.length; i++) {
      if (a[i].t - a[i - 1].t > 0.02) { sign = null; continue; }
      step = Math.max(step, Math.hypot(a[i].x - a[i - 1].x, a[i].z - a[i - 1].z));
      turn = Math.max(turn, Math.abs(((a[i].hd - a[i - 1].hd) % (2 * Math.PI) + 3 * Math.PI) % (2 * Math.PI) - Math.PI));
      const sg = Math.cos(a[i].hd) < 0 ? -1 : 1; if (sign != null && sg !== sign) { if (a[i].t - lastFlip < 0.5) back++; lastFlip = a[i].t; } sign = sg;
    }
    assert.ok(step < 0.16, `${id}: the dog's biggest move in a frame ${step.toFixed(3)} u`);
    assert.ok(turn < 0.13, `${id}: its biggest turn in a frame ${turn.toFixed(3)} rad`);
    assert.equal(back, 0, `${id}: its facing flipped back within ½ s ${back} times`);
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
    if (l != null && closeAt != null) { n++; assert.ok(closeAt >= l + BUS.shut[0] - BUS.doorClose - 0.02, `${id}: the fold back starts ${(closeAt - l).toFixed(2)} s after the last rider is through`); }
  }
  assert.ok(n >= 5, `${n} buses with riders checked`);
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
