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

// ---------------------------------------------------------------- 8b2 — THE PROPS NEVER POP (the owner: "props arrive and leave in hands")
test('8b2 — THE TALL LADDER is one object edge to edge: carried in + out level by two IN STEP, never a jump; it stands on its foot + top', async () => {
  const { visitAt } = await import('../js/core/harbor-people.js');
  const { jointsOf, lookOf } = await import('../js/screens/harbor/folk.js');
  const { LADDER } = await import('../js/core/harbor-crew.js');
  const { L, M } = setup(), P = crewSpots(L, M), key = '2026-10-26', w = plan(key).find(x => x.kind === 'painters');
  const res = crewSpan(w.t0, w.t1, { L, M, ctx: { off: OFF } }), lad = res.props.find(p => p.kind === 'xladder'), [a, b] = res.visits;
  assert.ok(lad && res.props.some(p => p.kind === 'ladder' && p.mark), 'the ladder as one prop + the moment it stands');
  // off the screen's right edge at both ends (the whole ladder: its foot end leads in + trails out)
  const hw = L.cam.hw(lad.z);
  for (const t of [lad.t0, lad.t1 - 0.06]) assert.ok(lad.at(t).x > hw, `off the edge at ${t === lad.t0 ? 'the start' : 'the end'} (${lad.at(t).x.toFixed(2)} > ${hw.toFixed(2)})`);
  // never a jump: its state moves less than a walk's worth in any 1/60 s (the long stand skipped)
  let prev = null, worst = 0;
  for (let t = lad.t0; t < lad.t1; t += 1 / 60) {
    const s = lad.at(t); if (!s) { prev = null; continue; }
    if (prev) worst = Math.max(worst, Math.abs(s.x - prev.x) / 0.08, Math.abs(s.y - prev.y) / 0.08, Math.abs(s.th - prev.th) / 0.05, Math.abs(s.e - prev.e) / 0.08);
    prev = s; if (t > lad.t0 + 60 && t < w.t1 - 200) { t = w.t1 - 200; prev = null; }
  }
  assert.ok(worst <= 1, `continuous (worst step ${worst.toFixed(2)} of the allowance)`);
  // standing: its centreline from the foot to the top, the fly run up
  const s = lad.at((w.t0 + w.t1) / 2), cx = s.x - Math.sin(s.th) * LADDER.w / 2, top = cx + Math.cos(s.th) * (LADDER.len + s.e);
  assert.ok(Math.abs(cx - P.ladder.foot.x) < 0.01 && Math.abs(top - P.ladder.top.x) < 0.02, 'leaning from its foot to the blade');
  // the two carriers in step (the same stride phase) + the ladder at the holder's hands
  const La = lookOf('painter', a.members[0].seed), Lb = lookOf('painter', b.members[0].seed);
  let n = 0;
  for (let t = w.t0 + 1; t < w.t1; t += 0.25) {
    const sa = visitAt(a, t), sb = visitAt(b, t); if (!sa || !sb || sa.pose !== 'walk' || sb.pose !== 'walk' || sb.carry !== 'ladderA') continue;
    const d = Math.abs(((jointsOf(sa, La, t).p - jointsOf(sb, Lb, t).p) % 1 + 1.5) % 1 - 0.5); assert.ok(d < 1e-6, `in step at ${t}`);
    assert.ok(Math.abs(lad.at(t).x - (sb.x - LADDER.hA)) < 1e-6, 'carried at the holder\'s hands'); n++;
    if (t > w.t0 + 30 && t < w.t1 - 200) t = w.t1 - 200;
  }
  assert.ok(n > 40, `carried in + out (${n} samples)`);
  // the painters' kit: off the ladder at the moment the holder's hands have it; the cloth from his set's middle
  const kit = lad.kit[0], hold = b.legs.find(l => l.k === 'pose' && l.pose === 'pick' && l.carry === 'kit');
  assert.ok(Math.abs(kit[1] - (hold.t0 + hold.t1) / 2) < 1e-6, 'the kit leaves the ladder at the pick\'s middle');
  const set = b.legs.find(l => l.k === 'pose' && l.pose === 'set' && l.carry === 'kit'), cloth = res.props.find(p => p.kind === 'cloth');
  assert.ok(Math.abs(cloth.t0 - (set.t0 + set.t1) / 2) < 1e-6 && cloth.un > 0, 'the drop cloth unrolled from the set\'s middle');
  // the bulb's repairmen carry the same ladder the same way
  const fw = forcedWork('bulb', Date.UTC(2026, 9, 22, 18) / 1000 + 400)[0], rb = crewSpan(fw.t0, fw.t1, { L, M, ctx: { off: OFF, force: 'bulb' } });
  assert.ok(rb.props.some(p => p.kind === 'xladder') && rb.visits.filter(v => v.kind === 'repairman').length >= 2, 'two repairmen + the ladder');
});

test('8b2 — THE STEPLADDER from the lampman\'s shoulder (never out of the cobbles), clear of the hydrant (POLISH 5)', () => {
  const { L, M } = setup(), P = crewSpots(L, M), w0 = Date.UTC(2026, 9, 22, 18) / 1000 + 400;
  // (every forced slot of a day picks its lamp: the slots' lamps between them)
  const seen = new Set();
  for (let k = 0; k < 12; k++) {
    const fw = forcedWork('lamp', w0 + k * 180)[0], res = crewSpan(fw.t0, fw.t0 + 2, { L, M, ctx: { off: OFF, force: 'lamp' } });
    const st = res.props.find(p => p.kind === 'xsteps' && Math.abs(p.t0 - fw.t0) < 1); if (!st) continue;
    let prev = null, worst = 0;
    for (let t = st.t0; t < st.t1; t += 1 / 60) {
      const q = st.at(t); if (!q) { prev = null; continue; }
      if (prev) worst = Math.max(worst, Math.hypot(q.tp.x - prev.tp.x, q.tp.y - prev.tp.y, q.tp.z - prev.tp.z), Math.hypot(q.fb.x - prev.fb.x, q.fb.y - prev.fb.y));
      prev = q; if (t > st.t0 + 40 && t < st.t1 - 40) { t = st.t1 - 40; prev = null; }
    }
    const ft = res.props.find(p => p.kind === 'steps' && p.mark).foot; seen.add(ft.x.toFixed(1));
    assert.ok(worst < 0.12, `the stepladder moves, never jumps (${worst.toFixed(3)})`);
    assert.ok(!(Math.abs(P.hydrant.x - ft.x) < 0.7 && Math.abs(P.hydrant.z - ft.z) < 0.7), 'never behind the hydrant');
  }
  assert.ok(seen.size >= 1, 'a stepladder planned');
  // POLISH 5 — THE TRASH ROUND without the promenade's can: the collector off screen left for the street's cans, back with one on his
  // shoulder, tipped in at the tail, carried back out, back to his cab
  const key = '2026-10-26', tr = plan(key).find(x => x.kind === 'trash'), res = crewSpan(tr.t0, tr.t1, { L, M, ctx: { off: OFF } });
  const v = res.visits.find(x => x.kind === 'trash'), tip = v.legs.find(l => l.pose === 'tip');
  assert.ok(tip && tip.carry === 'can', 'the can tipped into the truck');
  const xs = v.legs.flatMap(l => (l.pts || [{ x: l.x }]).map(p => p.x));
  assert.ok(Math.max(...xs) > L.cam.hw(51.6) + 0.5, `off screen right for the cans (${Math.max(...xs).toFixed(1)})`);
  assert.ok(!v.legs.some(l => l.pose === 'pick' || l.pose === 'set'), 'nothing picked up on the promenade');
});
test('POLISH 5 — THE HYDRANT on a hot afternoon only; the spray + the wet patch on the clock; a kid runs through it', () => {
  const { L, M } = setup(), P = crewSpots(L, M);
  const hotDays = [], key = '2026-7-14';
  for (let d = 1; d <= 30; d++) { const k = `2026-7-${d}`, day0 = Date.UTC(2026, 6, d, 4) / 1000; if (workDay(k, { day0, hot: () => true }).some(w => w.kind === 'hydrant')) hotDays.push(d); }
  assert.ok(hotDays.length >= 12 && hotDays.length <= 26, `most hot days (${hotDays.length} of 30)`);
  assert.equal(workDay(key, { day0: Date.UTC(2026, 6, 14, 4) / 1000, hot: () => false }).filter(w => w.kind === 'hydrant').length, 0, 'never on a cool day');
  const fw = forcedWork('hydrant', 1000, { forceAt: 997 })[0];
  assert.ok(Math.abs(fw.t0 - 1000) < 0.01, 'a forced one starts at the fire (+ the lead)');
  const res = crewSpan(fw.t0, fw.t1, { L, M, ctx: { off: OFF, force: 'hydrant', forceAt: 997 } });
  const man = res.visits.find(x => x.kind === 'hydrant'), kid = res.visits.find(x => x.kind === 'hydrant-kid');
  assert.ok(man && kid, 'the worker + the kid');
  const w = { L, M, ctx: { off: OFF, force: 'hydrant', forceAt: 997 } }, cache = new Map();
  const tr = u => tracesAt(fw.t0 + u, w, cache).hydrant;
  assert.equal(tr(2), null, 'shut as he walks up');
  const open = man.legs.find(l => l.pose === 'pick').t1;
  assert.equal(tr(open - fw.t0 + 20).spray, 1, 'spraying');
  assert.ok(tr(open - fw.t0 + 20).wet > 0.3 && tr(open - fw.t0 + 20).wet < 1, 'the patch spreading');
  assert.ok(kid.t0 > open && kid.t0 < open + 150, 'the kid while it sprays');
  assert.ok(Math.min(...kid.legs.flatMap(l => (l.pts || []).map(p => Math.abs(p.x - P.hydrant.x)))) < 2.5, 'through the spray');
  const x0 = man.legs[0].pts ? man.legs[0].pts[0].x : man.legs[0].x;
  assert.ok(x0 < -L.cam.hw(40), `he walks in from off screen (${x0.toFixed(1)})`);
});
test('POLISH 5 — EVERY FORCED WORKER STARTS AT THE MOMENT IT FIRES: its first visit FORCE.lead s after forceAt — never one already under way', () => {
  for (const kind of [...Object.keys(SHOWS), ...Object.keys(REGULARS)]) for (const at of [1000.4, 1793000123.7]) {
    const ws = forcedWork(kind, at + 1, { forceAt: at });
    assert.equal(ws.length, 1, `${kind}: one visit right after the fire`);
    assert.ok(Math.abs(ws[0].t0 - (at + 3)) < 1e-6, `${kind}: it starts 3 s after the fire (${(ws[0].t0 - at).toFixed(2)})`);
    assert.ok(forcedWork(kind, at - 5, { forceAt: at }).length === 0, `${kind}: nothing before it`);
  }
});
