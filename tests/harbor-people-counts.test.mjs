// CITY 2.0 — THE PEOPLE, part of harbor-people.test.mjs split out (PERF-A, FR5 D4: the unit suite's wall time is its slowest FILE —
// the one 79-s file became six of ~8–15 s, the same checks): EVERY LEASH, ARRIVALS, THE COUNTS, THE SECRET, LINGER. node --test tests/harbor-people-counts.test.mjs
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
test('POLISH 4 + WSP — THE COUNTS ON SCREEN: a weekday daytime ~5–6 (WSP: +1–2, standing still), lunch ~7–8, after work 6–7, a normal night 3–4, a party night 8–12 (the dance circle on top), late at night 0–3', () => {
  const { cam, L } = setup('402x874'), M = folkMap(L), cache = new Map(), SAT = DAY + 2 * 86400;
  const bands = [['weekday daytime', DAY, 9.5, 11, 4.8, 6.8], ['weekday afternoon', DAY, 14.2, 16, 4.8, 6.8], ['lunch', DAY, 12, 13.5, 6.4, 8.6], ['after work', DAY, 16.6, 18.2, 5.6, 7.6],
    ['a normal night', DAY, 19, 22, 2.8, 4.6], ['a party night (the everyday crowd: the walkers, THE LINE, the side door)', SAT, 21, 24, 5, 12], ['late at night', DAY + 86400, 0.25, 1.75, 0, 3]];
  for (const [name, day, h0, h1, lo, hi] of bands) { const v = bandMean(cam, L, M, day, h0, h1, cache); assert.ok(v >= lo && v <= hi, `${name}: ${v.toFixed(2)} on screen (want ${lo}–${hi})`); }
  // (NIGHT-B — THE STREET PARTY on top at the peak: its pockets ~18–26 people at tier 2 (the owner: "even more if the bench allows"))
  const sp = bandMean(cam, L, M, SAT, 22, 24, cache, 60, m => m.sp && m.sp.pocket != null);
  assert.ok(sp >= 16 && sp <= 28, `the street party's pockets at the peak: ${sp.toFixed(1)} on screen (want 16–28)`);
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
