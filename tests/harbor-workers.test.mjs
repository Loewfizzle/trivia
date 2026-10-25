// CITY 2.0 — THE HARBOR, PART 8b1: THE WORKERS' SCHEDULE (core/harbor-workers.js — the timetable) + THE CREW (core/harbor-crew.js —
// their itineraries, the trucks, the props, the traces). PURE: node --test tests/harbor-workers.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOWS, REGULARS, workDay, forcedWork, bulbOut, lampFault, bootlegNight, paintStage, PAINT_TOTAL, sheetsUp, SHEETS, platformAt, dayOf } from '../js/core/harbor-workers.js';
import { crewAt, crewSpan, tracesAt, truckPlan, crewSpots, FLICK } from '../js/core/harbor-crew.js';
import { cameraFor, harborLayout, REF_TITLE } from '../js/core/harbor-layout.js';
import { folkMap, folkAt, FOLK } from '../js/core/harbor-people.js';
import { signalAt } from '../js/core/harbor-promenade.js';

const OFF = -240;                                                   // (Grand Rapids in October: UTC − 4 h)
const day0 = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) / 1000 - OFF * 60; };
const hOf = (t, key) => (t - day0(key)) / 3600;
const plan = key => workDay(key, { day0: day0(key), off: OFF });
const setup = (W = 402, H = 874) => { const cam = cameraFor(W, H, { tag: REF_TITLE.tag, dock: { ...REF_TITLE.dock, w: W - 28, y: H - 116 } }, REF_TITLE.safe); const L = harborLayout(cam, 1924); return { cam, L, M: folkMap(L) }; };
// a fortnight from Monday Oct 26 2026
const DAYS = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.UTC(2026, 9, 26 + i)); return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; });

test('8b1 — THE FIXED REGULARS to the minute: the milk 6:00, the newsboy 7:00, the barber 8:30, the beat cop 9:00 am + 9:00 pm', () => {
  const mon = plan('2026-10-26'), at = k => mon.find(w => w.kind === k);
  // (the milk truck pulls up a minute before six so the bottles touch the step at 6:00)
  assert.ok(Math.abs(hOf(at('milk').t0, '2026-10-26') - 5.98) < 0.01, 'the milk truck at ~5:59');
  assert.equal(hOf(at('newsboy').t0, '2026-10-26'), 7, 'the newsboy at 7:00');
  assert.equal(hOf(at('barber').t0, '2026-10-26'), 8.5, 'the barber at 8:30');
  assert.equal(hOf(at('cop').t0, '2026-10-26'), 9, 'the beat cop at 9:00');
  assert.equal(hOf(at('patrol').t0, '2026-10-26'), 21, 'the 9 pm round');
});

test('8b1 — NEVER TWO WORKER SHOWS AT ONCE, every day of a fortnight; the weekly shows on their days; Sunday quiet', () => {
  for (const key of DAYS) {
    const p = plan(key), shows = p.filter(w => w.show).sort((a, b) => a.t0 - b.t0), dow = dayOf(day0(key) + 43200, OFF).dow;
    for (let i = 1; i < shows.length; i++) assert.ok(shows[i].t0 >= shows[i - 1].t1, `${key}: ${shows[i - 1].kind} overlaps ${shows[i].kind}`);
    const kinds = new Set(p.map(w => w.kind));
    if (dow === 1) assert.ok(kinds.has('painters'), `${key}: Monday's sign painters`);
    if (dow === 2 || dow === 5) assert.ok(kinds.has('washers'), `${key}: the window washers`);
    if (dow === 3) assert.ok(kinds.has('gardener'), `${key}: Wednesday's gardener`);
    if (dow === 6) assert.ok(kinds.has('delivery'), `${key}: Saturday's big delivery`);
    if (dow === 0) { assert.ok(!kinds.has('milk') && !kinds.has('barber') && !kinds.has('trash') && !kinds.has('ice'), `${key}: Sunday sleepy`); assert.ok(p.filter(w => w.show).length <= 5, `${key}: hardly any shows on a Sunday (the morning-after sweep + crew, the papers, the billposter, a rare quiet truck)`); }
    if (dow >= 1 && dow <= 5) for (const k of ['milk', 'trash', 'newsboy', 'evening', 'barber', 'billposter']) assert.ok(kinds.has(k), `${key}: ${k} on a weekday`);
    assert.ok(kinds.has('billposter') && kinds.has('doorman') && kinds.has('staff'), `${key}: the daily regulars`);
  }
});

test('8b1 — every phone the same: the plan is a pure function of the date; the bootleggers a few nights a month', () => {
  for (const key of DAYS) assert.deepEqual(plan(key), plan(key));
  let n = 0, nights = 0;
  for (let i = 0; i < 365; i++) { const d = new Date(Date.UTC(2026, 0, 1 + i)), key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; if (SHOWS.bootleg.days.includes(d.getUTCDay())) { nights++; if (bootlegNight(key)) n++; } }
  const perMonth = n / 12;
  assert.ok(perMonth >= 1 && perMonth <= 4, `a few quiet weeknights a month (${perMonth.toFixed(1)})`);
  assert.ok(nights > 200);
});

test('8b1 — CAUSE AND EFFECT: a bulb out → the repairman next morning; a lamp\'s bad night → the stepladder; the morning after a party → the extra sweep + the roof crew', () => {
  let bulbs = 0, lamps = 0;
  for (const key of DAYS) {
    const p = plan(key), kinds = new Set(p.map(w => w.kind)), y = DAYS[DAYS.indexOf(key) - 1];
    if (!y) continue;
    if (bulbOut(y, day0(y))) { bulbs++; assert.ok(kinds.has('bulb'), `${key}: last night's bulb fixed this morning`); }
    if (lampFault(y, day0(y))) { lamps++; assert.ok(kinds.has('lamp'), `${key}: last night's bad lamp fixed`); }
    const dow = dayOf(day0(key) + 43200, OFF).dow;
    if (dow === 6 || dow === 0) assert.ok(kinds.has('sweep2') && kinds.has('crew'), `${key}: the morning after a party night`);
  }
  assert.ok(bulbs >= 1 && bulbs <= 3, `~a bulb a week (${bulbs} in a fortnight)`);
  assert.ok(lamps >= 1, 'a lamp\'s bad night now and then');
  assert.equal(FLICK(-1), 0); assert.equal(FLICK(5), 1); assert.ok(FLICK(0.4) < 0.3, 'the test flicker dips');
});

test('8b1 — THE STAGES: the blade repainted (out → chalk → letters → gilt), the billposter\'s sheets one by one, the platform lowered a floor', () => {
  assert.equal(paintStage(-1).stage, 'before'); assert.equal(paintStage(5 * 60).stage, 'setup'); assert.equal(paintStage(30 * 60).stage, 'out');
  assert.equal(paintStage(60 * 60).stage, 'chalk'); assert.equal(paintStage(100 * 60).stage, 'letters'); assert.equal(paintStage(150 * 60).stage, 'gilt'); assert.equal(paintStage(PAINT_TOTAL + 1).stage, 'done');
  assert.equal(sheetsUp(0).done, 0); const all = sheetsUp(SHEETS.from + SHEETS.per * SHEETS.cols * SHEETS.rows + 1); assert.equal(all.done, SHEETS.cols * SHEETS.rows);
  const len = 84 * 60, a = platformAt(len * 0.2, len), b = platformAt(len * 0.7, len);
  assert.ok(a.y > b.y + 2, 'the upper floor first, then a floor lower');
});

test('8b1 — THE TRACES: the milk on the step 6:00 → the barber; the roof board keeps yesterday\'s poster until the billposter; the blade\'s week turns at the painters\' end', () => {
  const { L, M } = setup(), cache = new Map(), w = { L, M, ctx: { off: OFF } }, key = '2026-10-27', d0 = day0(key);
  const tr = h => tracesAt(d0 + h * 3600, w, cache);
  assert.equal(tr(5.5).milk, false, 'no milk before the truck');
  assert.equal(tr(7.5).milk, true, 'the bottles wait on the step');
  assert.equal(tr(9.5).milk, false, 'taken in by the barber');
  assert.equal(tr(10).board.key, '2026-10-26', 'the morning: yesterday\'s poster');
  assert.equal(tr(20).board.key, key, 'the evening: today\'s (pasted)');
  const p = plan(key).find(x => x.kind === 'billposter'), mid = (p.t0 + p.t1) / 2;
  const tm = tracesAt(mid, w, cache);
  assert.ok(tm.board.pasting && tm.board.pasting.sheets.done >= 1, 'mid-paste: some sheets up');
  const mon = '2026-10-26', painted = tracesAt(day0(mon) + 14 * 3600, w, cache);
  assert.ok(painted.blade && ['out', 'chalk', 'letters'].includes(painted.blade.stage), `Monday 2 pm: the repaint in progress (${painted.blade && painted.blade.stage})`);
  assert.ok(painted.monday && painted.bladeDone > day0(mon) + 15.5 * 3600, 'the blade keeps last week\'s name until ~3:50 pm');
});

test('8b1 — THE CREW joins mid-way + never pops: a truck at the stop (not on the crosswalk, away on green), the milkman round its nose to the step, the roof\'s billposter on the catwalk', () => {
  const { L, M } = setup(), cache = new Map(), w = { L, M, ctx: { off: OFF } }, key = '2026-10-26', P = crewSpots(L, M);
  const milk = plan(key).find(x => x.kind === 'milk');
  let sawTruck = false, sawStep = false;
  for (let t = milk.t0 - 5; t < milk.t1 + 60; t += 1.5) {
    const c = crewAt(t, w, cache);
    for (const T of c.trucks) { sawTruck = true; const x = T.x(t); if (t > T.tA && t < T.tD) assert.ok(x + T.len / 2 <= L.crosswalk.x0, 'parked short of the crosswalk'); }
    for (const v of c.visits) if (v.kind === 'milk') for (const lg of v.legs) if (lg.k === 'pose' && (lg.pose === 'garden' || lg.pose === 'set') && Math.abs(lg.x - P.step.x) < 0.3) sawStep = true;
  }
  assert.ok(sawTruck && sawStep, 'the dairy van at the stop, the carrier set down on the step');
  const T = crewSpan(milk.t0, milk.t1, w, cache).trucks[0];
  const S = signalAt(T.tD * 1000);
  assert.equal(S.road, 'green', 'the truck pulls away on green');
  // the folk on the promenade at the same moment see the worker (the routines layer is part of folkAt)
  const f = folkAt(milk.t0 + 30, { L, M, ctx: { off: OFF } }, new Map());
  assert.ok(f.crew && f.crew.trucks.length === 1 && f.members.some(m => m.kind === 'milk'), 'folkAt carries the crew');
  // the billposter: in at the side door, up on the roof's catwalk while he pastes
  const bp = plan(key).find(x => x.kind === 'billposter'), c2 = crewAt(bp.t0 + 12 * 60, w, cache);
  assert.ok(c2.roof.some(v => v.kind === 'billposter'), 'on the roof');
  // a bus never comes while a truck holds the stop
  const day = { L, M, ctx: { off: OFF } }, fc = new Map();
  for (let t = milk.t0; t < milk.t1; t += 5) { const r = folkAt(t, day, fc); assert.ok(!(r.buses.length && r.crew.trucks.some(Tk => Tk.parked)), 'no bus at the stop with a truck there'); }
});

test('8b1 — &force=work-<kind>: every worker on a loop, any day; each kind has an itinerary that lands on the map', () => {
  const { L, M } = setup(), w0 = Date.UTC(2026, 9, 22, 18) / 1000;
  for (const kind of [...Object.keys(SHOWS), ...Object.keys(REGULARS)]) {
    const fw = forcedWork(kind, w0 + 400);
    assert.ok(fw.length >= 1, kind);
    const cache = new Map(), w = { L, M, ctx: { off: OFF, force: kind } };
    let people = 0;
    for (let t = fw[0].t0; t < Math.min(fw[0].t1, fw[0].t0 + 300); t += 4) { const c = crewAt(t, w, cache); people += c.visits.length + c.roof.length; }
    assert.ok(people > 0, `${kind}: someone shows up in its preview`);
  }
});

// ---------------------------------------------------------------- Oct 25 — NO TRAFFIC DURING THE LEGENDARIES
test('NO TRAFFIC DURING THE LEGENDARIES: no worker show (its truck) runs across tonight\'s legendary minutes', async () => {
  const { legendNight } = await import('../js/core/harbor-legend.js');
  let n = 0;
  for (let d = new Date(Date.UTC(2026, 9, 1)); d.getTime() < Date.UTC(2027, 3, 1); d.setUTCDate(d.getUTCDate() + 1)) {
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dd = d.getUTCDate(), lg = legendNight(y, m, dd);
    if (!lg) continue;
    const key = `${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`, D0 = day0(key), w0 = D0 + lg.h * 3600 - 150, w1 = D0 + lg.h * 3600 + 120;
    for (const w of plan(key).filter(x => x.show)) assert.ok(w.t1 <= w0 || w.t0 >= w1, `${key}: ${w.kind} (${hOf(w.t0, key).toFixed(2)}–${hOf(w.t1, key).toFixed(2)}) across the legendary at ${lg.h}`);
    n++;
  }
  assert.ok(n >= 3, `${n} legendary nights checked`);
});
