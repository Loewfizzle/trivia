// CITY 2.0 — THE PEOPLE, part of harbor-people.test.mjs split out (PERF-A, FR5 D4: the unit suite's wall time is its slowest FILE —
// the one 79-s file became six of ~8–15 s, the same checks): REAL DOORS, THE SIDE DOOR, THE DOOR CLOSER, THE DOORMAN. node --test tests/harbor-people-doors.test.mjs
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
