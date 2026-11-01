// CITY 2.0 — THE PEOPLE, part of harbor-people.test.mjs split out (PERF-A, FR5 D4: the unit suite's wall time is its slowest FILE —
// the one 79-s file became six of ~8–15 s, the same checks): THE DANCE CIRCLE, THE BUS DOOR, THE RING. node --test tests/harbor-people-dance.test.mjs
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

test('FP3a + POL4 + C4d — THE BUS DOOR folds shut a beat after the LAST rider (off or on) and the bus pulls away 1–2 s later (the owner, Oct 29: "it waits too long") — never open long with nobody coming; away on green, over the crossing only on green / amber', () => {
  const { L } = setup('402x874'), M = folkMap(L), cache = new Map(), buses = new Map(), last = new Map();
  for (let t = DAY + 6 * 3600; t < DAY + 30 * 3600; t += 2) {
    const f = folkAt(t, { L, M, ctx: { off: OFF } }, cache);
    for (const b of f.buses) buses.set(b.id, b);
    // (FP3b: a rider is through the bus's door once past its threshold — the door leg's tClose, the group's last member lagging)
    for (const v of f.visits) for (const lg of v.legs) if (lg.k === 'door' && lg.bus) last.set(lg.bus, Math.max(last.get(lg.bus) || 0, lg.tClose + Math.max(0, ...v.members.map(m => m.lag))));
  }
  let n = 0, prompt = 0, idle = 0;
  const { L: L2 } = setup('402x874'), cw = L2.crosswalk;
  for (const [id, b] of buses) {
    const l = last.get(id);
    assert.ok(b.shut < b.tD, `${id}: shut before it pulls away`);
    assert.equal(signalAt(b.tD * 1000).road, 'green', `${id}: away on green`);
    for (let t = b.tD; t < b.tX; t += 0.25) { const x = b.x(t); if (x + b.len / 2 > cw.x0 && x - b.len / 2 < cw.x1) assert.ok(['green', 'amber'].includes(signalAt(t * 1000).road), `${id}: over the crosswalk only while the road is green`); }
    // (away BUS.go0 s after the door is shut — later only when the light holds it)
    const go = b.tD - b.shut; idle += go;
    if (go <= BUS.go0[1] + 1e-6) { prompt++; assert.ok(go >= BUS.go0[0] - 1e-6, `${id}: a beat after the door shuts (${go.toFixed(2)} s)`); }
    else assert.ok(go < 30, `${id}: held by the light ${go.toFixed(1)} s`);
    if (l == null) { assert.ok(Math.abs(b.shut - (b.tA + BUS.emptyShut)) < 1e-6, `${id}: nobody — shut soon after it stops`); continue; }
    n++;
    assert.ok(b.shut - l >= BUS.shut[0] - 1e-6 && b.shut - l <= BUS.shut[1] + 1e-6, `${id}: shut ${(b.shut - l).toFixed(2)} s after the last rider`);
  }
  assert.ok(n >= 20, `${n} buses with riders over the day`);
  assert.ok(prompt / buses.size >= 0.8 && idle / buses.size < 3.5, `${prompt} of ${buses.size} away within ${BUS.go0[1]} s of the shut; a mean ${(idle / buses.size).toFixed(1)} s from shut to away (C4c's: 12.9)`);
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
  // (NIGHT-B: the party nights' hourly circle is RETIRED in folkAt — THE STREET PARTY's dance breaks replace it; the circle lives on as the
  // &force=circle preview, which this test now drives)
  for (let t = sat; t < sat + 2 * 3600; t += 120) assert.ok(!folkAt(t, { L, M, ctx: { off: OFF } }, new Map()).dance.on, 'no hourly circle on a party night now');
  let formed = 0;
  const cctx = { off: OFF, forceCircle: true, forceCircleAt: sat, noStreetParty: true };
  for (let t = sat; t < sat + 2 * 3600; t += 4) {
    const f = folkAt(t, { L, M, ctx: cctx }, cache);
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
  const sat = Date.parse('2026-10-31T22:00:00-04:00') / 1000, ctx = { off: OFF, event: true, ring: true, forceCircle: true, forceCircleAt: sat, noStreetParty: true };   // (NIGHT-B: the circle is a preview now — &force=circle)
  assert.ok(danceSlot(Math.floor(sat / 3600), { off: OFF, event: true, ring: true }), 'the hour still has its dance with the giant standing (ring)');
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
