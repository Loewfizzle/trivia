// JAYWALK J2 FIX — THE BLACKBIRD YOU CAN SEE (docs/jaywalk.md "J2 FIX"): v2's runway numbers changed BEFORE v2 went live (the jets slower —
// seen, not just felt —, the tell 1.2 s, THE WAIT GUARD), then v2 FROZEN (tests/jaywalk-v2-frozen.test.mjs). Here: the numbers; and A PHONE
// STILL ON THE PRE-FIX J2 BUILD after the 4 am switch (it plays the old v2 numbers — tests/fixtures/jaywalk-v2-j2pre/ — under the same cv 2):
// its run is REFUSED CLEANLY (THE END CHECK: 'old build' · or 'past the end') or counted exactly as its own screen showed — NEVER A WRONG
// COUNT; its daily is refused at START (no `cvr` — told to refresh). PURE — THE UNIT JOB INSTALLS NOTHING.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TICK_HZ, RUNWAY, FP, COLS } from '../js/games/jaywalk/tuning.js';
import { createCourse, specials } from '../js/games/jaywalk/course.js';
import * as PRE from './fixtures/jaywalk-v2-j2pre/course.js';
import { createRun, step, isOver, resultOf, canLog } from '../js/games/jaywalk/engine.js';
import { greedyBot } from '../js/games/jaywalk/bot.js';
import { packLog, judgeRun } from '../js/games/jaywalk/replay.js';
import { seedOf, scoreNode } from '../js/games/jaywalk/logic.js';
import { jaywalkSolo } from '../api/_lib/jaywalk.js';
import { CV_SWITCH_MS, CV_REV, tryVersion, setCvSwitch } from '../js/games/jaywalk/versions.js';
import { ZOOM } from '../js/games/jaywalk/camera.js';

setCvSwitch(null);   // (the REAL switch: 2026-11-22 09:00 UTC)
const CODE = 'WXYZ', AFTER = CV_SWITCH_MS + 3600e3;

/** the greedy bot plays a solo run on a course (the live one, or the PRE-FIX J2 build's) through the recorder's own bounds → { log, live } */
function played(course, seed, mode = 'solo', maxTicks = 5 * 60 * TICK_HZ) {
  const run = createRun({ seed, mode }), bot = greedyBot({ seed }), log = [];
  while (!isOver(run) && run.t < maxTicks) {
    let d = bot(run, course) || '';
    if (d && !canLog(log, run.t, d, mode)) d = '';
    if (d) log.push({ t: run.t, d });
    step(run, course, d);
  }
  while (!isOver(run)) step(run, course, '');
  return { log, live: resultOf(run) };
}
function chunks(log, t0) {
  const c = {};
  let from = 0, k = 0;
  for (let t = TICK_HZ; from < log.length; t += TICK_HZ) {
    let to = from; while (to < log.length && log[to].t < t) to++;
    if (to > from) { c[k++] = { s: packLog(log.slice(0, to), from), at: t0 + Math.round(t * 1000 / TICK_HZ) + 200 }; from = to; }
  }
  return c;
}

test('THE NUMBERS (v2, J2 FIX): a runway jet crosses the 8-column view in ≈ 0.6–0.7 s at lanes 120–249, a step faster from 250, THE AIRFIELD fastest (never past J2’s 1000); the tell 1.2 s; the trail 0.7 s; the wait guard', () => {
  const across = v => ZOOM * FP / v / TICK_HZ;
  assert.equal(ZOOM, 8);
  assert.ok(across(RUNWAY.v[0]) >= 0.6 && across(RUNWAY.v[0]) <= 0.7, `the first runways: ${across(RUNWAY.v[0]).toFixed(2)} s`);
  assert.ok(RUNWAY.v[0] < RUNWAY.v[1] && RUNWAY.v[1] < RUNWAY.v[2] && RUNWAY.v[2] <= 1000, 'slow → faster → THE AIRFIELD fastest, never past J2’s');
  assert.equal(RUNWAY.tell, 72); assert.equal(RUNWAY.trail, 42); assert.ok(RUNWAY.wait <= 240, 'the careful wait ≤ 4 s');
  // the pre-fix build flew 1000 with a 1.6 s tell — the fixture is the J2 code exactly
  const r = PRE.specials('j2fixpre', 4, 2).rw.concat(PRE.specials('j2fixpre', 5, 2).rw)[0];
  if (r) { assert.equal(r.lanes[0].v, 1000); assert.equal(r.lanes[0].tell, 96); }
  void COLS;
});

test('THE PRE-FIX J2 BUILD after the switch (SOLO): every run of its is REFUSED CLEANLY (\'old build\' / \'past the end\') or counted EXACTLY as its own screen showed — never a wrong count; its runway runs are caught', () => {
  setCvSwitch(null);
  let met = 0, refused = 0, same = 0, noE = { same: 0, refused: 0, other: 0 };
  const whys = {};
  for (let k = 0; k < 36; k++) {
    const m = `pf${k}`, go = AFTER + k * 7919, seed = seedOf(CODE, m, go), old = PRE.createCourse(seed, { cv: 2 });
    const h = played(old, seed);
    const R = []; for (let s = 2; s < 12; s++) R.push(...specials(seed, s, 2).rw);
    if (R.some(r => h.live.lanes >= r.y0 - 1)) met++;
    const node = { go, cv: 2, c: chunks(h.log, go), e: { l: h.live.lanes, t: h.live.tick } };
    const S = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node }), row = S.game.results.me;
    if (!S.v.ok) { refused++; whys[S.v.why] = (whys[S.v.why] || 0) + 1; assert.ok(['old build', 'past the end'].includes(S.v.why), S.v.why); assert.equal(row.l, 0); continue; }
    assert.equal(row.l, h.live.lanes, `${m}: counted = what the phone showed (lanes)`); assert.equal(row.t, h.live.tick, `${m}: … the tick`);
    same++;
    // (its end write lost — the rare dropped `e`: the replay alone decides; measured, not asserted — docs/games/passes/jaywalk-j2fix.md)
    const S2 = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node: { ...node, e: undefined } });
    if (!S2.v.ok) noE.refused++; else if (S2.game.results.me.l === h.live.lanes && S2.game.results.me.t === h.live.tick) noE.same++; else noE.other++;
  }
  console.log(`  (pre-fix build, 36 solo runs, ${met} met a runway: ${same} counted as shown, ${refused} refused ${JSON.stringify(whys)}; with no e: ${JSON.stringify(noE)})`);
  assert.ok(met >= 8, `runs that reached a runway: ${met}`);
  assert.ok(refused >= 4, `the old build's runs refused: ${refused} (${JSON.stringify(whys)})`);
  // (here every mismatch was a hop past the fix course's end; THE END CHECK covers the other way — the old phone saw an end the fix course
  //  never made, nothing left to hop: the next test refuses such a node)
  assert.equal(same + refused, 36);
});

test('THE END CHECK never touches an honest run: the J2 FIX phone\'s own end = the replay (solo + the host\'s match row); v1 is never checked; a cut / unfinished run is not checked', () => {
  for (let k = 0; k < 10; k++) {
    const m = `ok${k}`, go = AFTER + k * 104729, seed = seedOf(CODE, m, go), h = played(createCourse(seed, { cv: 2 }), seed);
    const node = { go, cv: 2, c: chunks(h.log, go), e: { l: h.live.lanes, t: h.live.tick } };
    const S = jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node });
    assert.ok(S.v.ok, `${m}: ${S.v.why}`); assert.equal(S.game.results.me.l, h.live.lanes);
    const row = scoreNode({ seed, mode: 'solo', node, t0: go, cv: 2 });
    assert.equal(row.bad, undefined); assert.equal(row.l, h.live.lanes);
    // a wrong end on the node = refused on v2 (only ever hurts the phone that wrote it) · ignored on v1 · ignored while the run is still going
    const bad = { ...node, e: { l: h.live.lanes + 1, t: h.live.tick } };
    assert.equal(jaywalkSolo({ code: CODE, matchId: m, uid: 'me', node: bad }).v.why, 'old build');
    assert.equal(scoreNode({ seed, mode: 'solo', node: bad, t0: go, cv: 2 }).bad, 'old build', 'the host’s podium refuses it the same way');
    if (k < 3) { const h1 = played(createCourse(seed, { cv: 1 }), seed); assert.ok(judgeRun({ seed, mode: 'solo', log: h1.log, cv: 1, end: { l: 999, t: 1 } }).ok, 'v1: never checked'); }
    const mid = h.log.length > 4 ? h.log[Math.floor(h.log.length / 2)].t : 0;
    if (mid) assert.ok(judgeRun({ seed, mode: 'solo', log: h.log, cv: 2, until: mid, end: { l: 999, t: 1 } }).ok, 'a run still going: not checked');
  }
});

test('THE PRE-FIX J2 BUILD\'s DAILY: refused at START on a v2 day (no `cvr` — "Refresh the page to play today\'s course."), the J2 FIX phone gets v2; a v1 day plays as before', () => {
  assert.equal(tryVersion('d20261122', 2, AFTER), 0);
  assert.equal(tryVersion('d20261122', 2, AFTER, CV_REV), 2);
  assert.equal(tryVersion('d20261121', 2, AFTER), 1);
});

test('THE DAY RUNWAY (Group 2) + THE NIGHT COMPARE (Group 3): crisp lamps + the heat trail by day; by night J2’s exactly unless the LAB asks (&rwnight=new) — the game never does; no new draw call (instanced kinds only)', async () => {
  const { readFileSync } = await import('node:fs');
  const rd = f => readFileSync(new URL(`../js/games/jaywalk/${f}`, import.meta.url), 'utf8');
  const N = rd('night.js'), FX = rd('night-fx.js'), LAB = rd('lab.js'), V = rd('view.js'), P = rd('poster.js');
  // the switch: the lab's query only — never the game, never the poster
  assert.match(N, /const RWN = o\.rwNight === true;/);
  assert.match(LAB, /rwNight: Q\.get\('rwnight'\) === 'new'/);
  for (const [f, s] of [['view.js', V], ['poster.js', P]]) assert.doesNotMatch(s, /rwNight|rwnight/, `${f} never turns the night compare on`);
  // by day (or the compare) the new lamps + trail; by night the J2 lamps + plasma, as shipped
  assert.match(N, /if \(day \|\| RWN\) runwayLamps\(p, st, tellF, head, z, lt\);\s*else for \(let c = -1; c <= COLS; c\+\+\)/);
  assert.match(N, /if \(day \|\| RWN\) \{ heatTrail\(p, u, z, x0, x1, cx, w, A, age, live, heat\); return; \}/);
  assert.match(N, /K\.bill\.put\(X\(c \+ 0\.5\), 0\.07, z \+ e, hot \? 0\.74 : 0\.3, hot \? 0\.74 : 0\.3, 1, 0, hot \? 0xfff6dc : 0xffcf8a, 1, 5,/, 'the night lamps J2 shipped');
  assert.match(N, /K\.bill\.put\(x, fh \* 0\.45, zz, fw, fh, 1, 0, 0x1e50ff, 1, 9, A\);/, 'the night plasma tongue J2 shipped');
  // the new pieces ride the existing instanced kinds (K.flat / K.bill / K.shadow) — three new shapes in the ONE glow shader
  const fns = N.slice(N.indexOf('function runwayLamps('), N.indexOf('function draw('));
  assert.doesNotMatch(fns, /new THREE\.|scene\.add\(/, 'no mesh of its own');
  for (const sh of ['11 a CRISP disc', '12 a CRISP rounded box', '13 a FLAME TONGUE']) assert.ok(FX.includes(sh), sh);
  assert.match(fns, /0x58a4ff/); assert.doesNotMatch(fns.slice(fns.indexOf('function heatTrail')), /K\.flat\.put\([^;]*0x58a4ff/, 'blue only STANDS UP (bills) — never on the ground');
  // the lamps blink in a running sequence (steady with reduce motion); no halo by day (the glow under a pip is the night compare's)
  assert.match(fns, /step = reduce \? 0 : Math\.floor\(k \/ 7\)/); assert.match(fns, /if \(!day\) K\.flat\.put\(x, 0\.04, z \+ e, 0\.9, 1, 0\.7, 0, hex, 1, 0,/);
});
