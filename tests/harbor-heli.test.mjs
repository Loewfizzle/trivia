// NIGHT-C Group 2 — THE HELICOPTER: core/harbor-heli.js (the patrol's timetable, the break flight, the beam's sweep + colour) + the sky
// scheduler's 'timed' event. PURE — no DOM.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { patrolDay, patrolsNear, patrolInSlot, legendWindow, breakFlight, beatSweep, beamColour, beamPair, breakDrift, localDay } from '../js/core/harbor-heli.js';
import { sunPosition } from '../js/core/sky.js';
import { knob } from '../js/core/harbor-schedule.js';
import { createScheduler, HARBOR_EVENTS, SLOT_MS } from '../js/core/harbor-events.js';
import { legendNight } from '../js/core/harbor-legend.js';

const OFF = -240, LAT = 42.96, LON = -85.67;               // Grand Rapids, EDT
const elAt = t => sunPosition(t * 1000, LAT, LON).el;
const at = (iso) => Date.parse(iso) / 1000;
const hourOf = t => { const lt = t + OFF * 60; return ((lt / 3600) % 24 + 24) % 24; };

test('THE PATROL (SKY-A, the owner Oct 30 8:35 am): every ~30 MIN from dusk → ~2 am (3–4 min each), HOURLY by day (2–3 min) — the same on every phone', () => {
  const P = knob('helicopter.patrol'), day = patrolDay(at('2026-10-27T12:00:00-04:00'), OFF, elAt, 1924);
  const night = day.filter(f => f.night), dayF = day.filter(f => !f.night);
  assert.ok(night.length >= 13, `${night.length} night flights (dusk ~7 pm → 1:30 am, half-hourly)`);
  for (let i = 1; i < night.length; i++) { const gap = (night[i].t0 - night[i - 1].t0) / 60; assert.ok(gap > 15 && gap < 45, `every ~30 min: ${gap.toFixed(1)} min`); }
  for (const f of night) { assert.ok(elAt(f.t0) < P.nightEl, 'a night flight is after dusk'); assert.ok(f.dur >= 180 && f.dur <= 240, `3–4 min at night (${f.dur} s)`); }
  const last = night[night.length - 1]; assert.ok(hourOf(last.t0) < 2 && hourOf(last.t0) >= 1, `the last at ${hourOf(last.t0).toFixed(2)} (1:30 am — down by ~2)`);
  assert.ok(dayF.length >= 7 && dayF.length <= 12, `${dayF.length} by day (hourly)`);
  for (const f of dayF) assert.ok(f.dur >= 120 && f.dur <= 180, `2–3 min by day (${f.dur} s)`);
  for (let i = 1; i < dayF.length; i++) { const gap = (dayF[i].t0 - dayF[i - 1].t0) / 3600; assert.ok(gap >= 0.84 && gap <= 1.16, `hourly by day: ${gap.toFixed(2)} h`); }
  // (each patrol is over before the next — the sky lane's hold covers it: 3 sky slots)
  for (let i = 1; i < day.length; i++) assert.ok(day[i].t0 >= day[i - 1].t0 + day[i - 1].dur, 'never two patrols at once');
  assert.ok(P.durNight <= 3 * SLOT_MS / 1000, 'the lane holds the whole night patrol');
  assert.deepEqual(patrolDay(at('2026-10-27T12:00:00-04:00'), OFF, elAt, 1924), day, 'every phone the same');
  assert.notDeepEqual(patrolDay(at('2026-10-28T12:00:00-04:00'), OFF, elAt, 1924).map(f => f.t0 % 3600), day.map(f => f.t0 % 3600), 'another day, other minutes');
  // (the small hours belong to the evening before: at 12:30 am the list is still yesterday's)
  assert.deepEqual(patrolDay(at('2026-10-28T00:30:00-04:00'), OFF, elAt, 1924), day);
});

test('THE PATROL keeps clear of a LEGENDARY night\'s window + of every DANCE BREAK (the timetable\'s conflicts)', () => {
  // find a legendary night
  let lgDay = null;
  for (let d = 1; d < 120 && !lgDay; d++) { const t = at('2026-09-01T12:00:00-04:00') + d * 86400, D = localDay(t, OFF); if (legendNight(D.y, D.m, D.d)) lgDay = t; }
  assert.ok(lgDay, 'a legendary night in the window');
  const lw = legendWindow(lgDay + 10 * 3600, OFF);
  assert.ok(lw && lw[1] > lw[0]);
  const all = patrolDay(lgDay, OFF, elAt, 1924), kept = patrolsNear(lgDay - 6 * 3600, lgDay + 18 * 3600, { off: OFF, seed: 1924, elAt });
  assert.ok(kept.every(f => !(f.t0 < lw[1] && f.t0 + f.dur > lw[0])), 'none in the legend\'s window');
  const breaks = [[at('2026-10-27T21:20:00-04:00'), at('2026-10-27T21:24:00-04:00')]];
  const blocked = (a, b) => breaks.some(([s0, s1]) => b > s0 && a < s1);
  const day = patrolsNear(at('2026-10-27T18:00:00-04:00'), at('2026-10-28T02:00:00-04:00'), { off: OFF, seed: 1924, elAt, blocked });
  assert.ok(day.every(f => !blocked(f.t0 - knob('helicopter.break').lead, f.t0 + f.dur + knob('helicopter.break').trail)), 'none over a break');
  assert.ok(all.length >= day.length);
});

test('THE SKY SCHEDULER flies the patrol: the \'helicopter\' event exactly in the patrol\'s slots (a timed event), none in between', () => {
  const memo = new Map(), ctx = { off: OFF, seed: 1924, elAt, memo };
  const t0 = at('2026-10-27T15:00:00-04:00') * 1000, S = createScheduler(HARBOR_EVENTS.filter(e => e.id === 'helicopter'), ms => ({ ms, force: new Set(), el: elAt(ms / 1000), heli: m => !!patrolInSlot(m, SLOT_MS, ctx) }), { anchor: t0 - 86400e3 });
  const want = patrolsNear(t0 / 1000, t0 / 1000 + 10 * 3600, ctx).map(f => Math.floor(f.t0 * 1000 / SLOT_MS));
  const got = [];
  for (let ms = t0; ms < t0 + 10 * 3600e3; ms += SLOT_MS) for (const r of S.at(ms).active) if (r.id === 'helicopter' && !got.includes(Math.floor(r.start / SLOT_MS))) got.push(Math.floor(r.start / SLOT_MS));
  assert.deepEqual(got, want, `the patrol's slots: ${want.length}`);
});

test('THE BREAK FLIGHT: in before the song, over the crowd the whole song, off after it (the timetable\'s lead / trail)', () => {
  const B = knob('helicopter.break'), f = breakFlight({ id: 'brk.x.1', s0: 1000, s1: 1200 });
  assert.equal(f.arrive, 1000); assert.equal(f.leave, 1200); assert.equal(f.t0, 1000 - B.lead); assert.equal(f.t1, 1200 + B.trail);
  assert.equal(breakFlight(null), null);
});

test('SKY-A — THE BREAK FLIGHT DRIFTS BACK AND FORTH over the crowd (the owner, Oct 30 8:19 am): the whole band, smooth, 0 at both ends', () => {
  const B = knob('helicopter.break'), f = breakFlight({ id: 'brk.x.2', s0: 1000, s1: 1190 });
  assert.equal(breakDrift(f.arrive, f), 0); assert.equal(breakDrift(f.leave, f), 0); assert.equal(breakDrift(f.arrive - 5, f), 0);
  let lo = 0, hi = 0, jump = 0, turns = 0, prev = 0, prevV = 0;
  for (let t = f.arrive; t <= f.leave; t += 0.02) {
    const u = breakDrift(t, f); lo = Math.min(lo, u); hi = Math.max(hi, u); jump = Math.max(jump, Math.abs(u - prev));
    const v = u - prev; if (prevV && v && Math.sign(v) !== Math.sign(prevV)) turns++; if (v) prevV = v; prev = u;
  }
  assert.ok(hi > 0.95 && lo < -0.95, `across the whole band (${lo.toFixed(2)} … ${hi.toFixed(2)})`);
  assert.ok(jump < 0.02, `never a jump (${jump.toFixed(4)} per 1/50 s)`);
  assert.ok(turns >= 2 * Math.floor(190 / B.sweepPeriod) - 1, `back and forth the whole song (${turns} turns)`);
  assert.equal(breakDrift(1100, null), 0);
});

test('THE BEAM ON THE BEAT — a smooth swing (never a jump: NO STROBE), its turns on the downbeats; the party colour cross-fades bar to bar', () => {
  const n = knob('helicopter.break').sweepBeats;
  assert.equal(beatSweep(0), 1); assert.ok(Math.abs(beatSweep(n) + 1) < 1e-9, 'the far side after sweepBeats beats');
  let worst = 0; for (let b = 0; b < 64; b += 0.01) worst = Math.max(worst, Math.abs(beatSweep(b + 0.01) - beatSweep(b)));
  assert.ok(worst < 0.01, `no jump between frames (${worst.toFixed(4)})`);
  const pal = [[255, 0, 200], [0, 220, 255], [160, 80, 255]];
  assert.deepEqual(beamColour(pal, 1), pal[0]); assert.deepEqual(beamColour(pal, 4.5), pal[1]);
  let jump = 0; for (let b = 0; b < 24; b += 0.02) { const a = beamColour(pal, b), c = beamColour(pal, b + 0.02); jump = Math.max(jump, ...a.map((v, i) => Math.abs(v - c[i]))); }
  assert.ok(jump < 12, `the colour never cuts (${jump} per 0.02 beat)`);
  assert.equal(beamColour(null, 3), null);
  // SKY-A — THE PAIR (a sprite per palette colour, the in-between shade = the two ADDED — never a canvas per shade: NIGHT-C's leak):
  // the pair's weighted sum IS beamColour's shade, and only the palette's own colours ever appear in it
  for (let b = 0; b < 24; b += 0.05) {
    const pr = beamPair(pal, b), mixC = pr.a.map((v, i) => v * (1 - pr.e) + pr.b[i] * pr.e), c = beamColour(pal, b);
    assert.ok(mixC.every((v, i) => Math.abs(v - c[i]) <= 1), `the pair adds up to the shade at beat ${b.toFixed(2)}`);
    assert.ok(pal.includes(pr.a) && pal.includes(pr.b), 'only the palette' + "'" + 's own colours');
  }
  assert.equal(beamPair(null, 1), null);
});
