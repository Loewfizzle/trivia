// JAYWALK H6A — THE BIG MOMENTS + YOUR BEST ANYWHERE (PURE — THE UNIT JOB INSTALLS NOTHING; docs/jaywalk.md "THE CARDS" · "YOUR BEST"):
//   · THE FOUR FEATS (boom · ufo · airfield · mothership) ride each result row as `f`, from THE JUDGE's replay alone: the host's podium and
//     the server's count agree; the report reads them ONLY from a match the server built itself (`sv`) — never a room's own results, never
//     an unproven match; mothership never from a solo run
//   · each achievement awards ONCE (the award engine is idempotent; a replayed report is skipped by its key)
//   · YOUR BEST ANYWHERE: a counted MATCH run's lanes raise the SAME best as a solo run's (the board keeps its id — jaywalk-solo)
//   · REPLAY = LIVE across many seeds, with UFO zones + flight paths + THE MOTHERSHIP's cap in the runs
//   · THE MOMENTS ARE A VIEW: flyers.js is out of the cartridge's eager graph, never imported by a rule / the replay / the server; the
//     glint stands inside the tell (never shortening it), the shake ≤ 4 px for ≤ 200 ms, nothing a player reads says TAKEN
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import '../api/_lib/catalog.js';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, step, resultOf, isOver } from '../js/games/jaywalk/engine.js';
import { replay, packLog } from '../js/games/jaywalk/replay.js';
import { featsOf, scoreNode, seedOf, matchStart, GO_LEAD_MS } from '../js/games/jaywalk/logic.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';
import { jaywalkMatch, jaywalkSolo, serverRow, verifyRun } from '../api/_lib/jaywalk.js';
import { extractMatch, JW_FEATS } from '../js/core/match-report.js';
import { matchStep } from '../js/core/progress.js';
import { ACH } from '../js/core/achievements.js';
import { causeLine, CAUSE_LINES, SHIP_LINE } from '../js/games/jaywalk/causes.js';
import { PRELOAD } from '../js/games/preload-graph.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const CODE = 'ROOM', T0 = 1_800_000_000_000, msOf = tick => tick * 1000 / T.TICK_HZ;
/** an honest phone's proof chunks: the hops of each half second, arriving 100 ms after the last of them (tick 0 = t0) */
function chunksOf(log, t0) {
  const c = {};
  let k = 0, from = 0;
  while (from < log.length) {
    const w = Math.floor(log[from].t / 30);
    let to = from; while (to < log.length && Math.floor(log[to].t / 30) === w) to++;
    c[k++] = { s: packLog(log.slice(0, to), from), at: Math.round(t0 + msOf(log[to - 1].t) + 100) };
    from = to;
  }
  return c;
}
/**
 * A PACED bot plays a MATCH on the course a room's first GO picks, to THE MOTHERSHIP's tick: it rests on plain grass while the wall is more
 * than K lanes behind (the wall waits 5 lanes behind the kid's best — the low lanes are the easy ones), else the greedy bot hops. Rushing
 * ahead never lasts 6 minutes (scratch search, Nov 17: 0 of 6,000 greedy runs; paced: seeds 16 · 46 · 60). Seed 60 / K 4 is still in at
 * the cap at lane 510 — with ALL FOUR feats in the one run.
 */
function paced(s, K) {
  const matchId = `m${s}`, S = matchStart(CODE, matchId, { a: { go: T0 } }), course = createCourse(S.seed), run = createRun({ seed: S.seed, mode: 'match' });
  const bot = greedyBot({ seed: `ship${s}` }), log = [];
  let last = -9;
  while (!isOver(run) && run.t <= T.MODES.match.cap + 5) {
    const L = course.lane(run.y);
    let d = run.st === 'idle' && L.type === 'grass' && !L.ufo && run.y - run.wall / T.FP > K ? '' : bot(run, course);
    if (d && run.t - last < T.MIN_INPUT_GAP) d = '';
    if (d) { log.push({ t: run.t, d }); last = run.t; }
    step(run, course, d);
  }
  return { matchId, S, log, live: resultOf(run) };
}
let SHIP = null;
function shipRun() {
  if (!SHIP) for (const [s, K] of [[60, 4], [16, 3], [46, 2]]) { const R = paced(s, K); if (R.live.taken) { SHIP = R; break; } }
  return SHIP;
}

test('THE FEATS RIDE THE ROW: featsOf → `f`; the host\'s row = the server\'s; a run still in at THE MOTHERSHIP\'s tick = mothership (+ x: the finish line)', () => {
  assert.deepEqual(JW_FEATS, ['boom', 'ufo', 'airfield', 'mothership']);
  assert.equal(featsOf({ feats: { boom: true, ufo: false, airfield: true, mothership: false } }), 'boom airfield');
  assert.equal(featsOf({ feats: {} }), ''); assert.equal(featsOf({}), '');
  const R = shipRun();
  assert.ok(R, 'a paced bot run that is still in at the cap');
  assert.deepEqual([R.live.taken, R.live.cause, R.live.feats.mothership, R.live.hits], [true, 'taken', true, 0]);
  assert.deepEqual([R.live.lanes, featsOf(R.live)], [510, 'boom ufo airfield mothership'], 'the pinned run: lane 510, all four feats in ONE counted match run');
  const node = { go: T0, c: chunksOf(R.log, R.S.playAt) };
  const row = scoreNode({ seed: R.S.seed, mode: 'match', node, t0: R.S.playAt, from: R.S.g0 });
  assert.ok(!row.bad && !row.cut, `an honest log (${row.bad || ''})`);
  assert.deepEqual([row.l, row.x, row.w, row.e], [R.live.lanes, 1, 'taken', T.MODES.match.cap]);
  assert.ok(String(row.f).split(' ').includes('mothership'), `the row's feats: ${row.f}`);
  assert.equal(String(row.f).includes('airfield'), R.live.lanes >= T.LOOP_LANES, 'airfield with it exactly when lane 400 was reached');
  // the server's own match: the same row, from the proof nodes alone
  const other = { go: T0 + 40 };   // (a silent-but-present second player: the blackout's run)
  const J = jaywalkMatch({ code: CODE, matchId: R.matchId, uids: ['a', 'b'], nodes: { a: node, b: other } });
  assert.deepEqual(J.game.results.a, row, 'the server\'s row = the host\'s, feats and all');
  assert.equal(J.game.results.b.f, undefined, 'the silent player: no feat');
  const ex = extractMatch(J.game);
  assert.equal(ex.rows.a.f.mothership, 1, 'BEAM ME UP\'s flag from the server\'s replay');
  assert.deepEqual(ex.rows.a.rec, { 'jaywalk-solo': R.live.lanes }, 'YOUR BEST ANYWHERE: the match run\'s lanes');
  assert.equal(ex.rows.b.f, undefined); assert.deepEqual(ex.rows.b.rec, {}, 'a run of 0 lanes raises nothing');
  // a log cut one hop short of the cap by a forger → still honest up to there; a hop AT the cap → refused (no feat)
  const bad = verifyRun({ seed: R.S.seed, mode: 'match', log: [...R.log, { t: T.MODES.match.cap, d: 'u' }] });
  assert.equal(bad.ok, false, 'a hop at the cap is refused');
});

test('ONLY THE SERVER\'S OWN REPLAY: a room\'s own results (no `sv`) earn no flag + no best; an UNPROVEN match (no GO) is nothing to count; mothership never from a solo run', () => {
  const hostWritten = { id: 'jaywalk', matchId: 'm1', phase: 'final', mode: 'match', participants: { a: true, b: true }, settings: {}, results: { a: { l: 412, t: 20000, w: 'taken', e: 21600, x: 1, f: 'boom ufo airfield mothership' }, b: { l: 9, t: 500, w: 'car', e: 600 } } };
  const ex = extractMatch(hostWritten);
  assert.equal(ex.rows.a.f, undefined, 'no flag from a host-written row'); assert.deepEqual(ex.rows.a.rec, {}, 'no best from a host-written row');
  assert.deepEqual(extractMatch({ ...hostWritten, sv: 1 }).rows.a.f, { boom: 1, ufo: 1, airfield: 1, mothership: 1 }, '(the same row from the server\'s own match: all four)');
  // an unproven match: no GO anywhere → the server has no match at all
  assert.deepEqual(jaywalkMatch({ code: CODE, matchId: 'm2', uids: ['a', 'b'], nodes: {} }), { game: null, why: 'no go' });
  assert.equal(jaywalkMatch({ code: CODE, matchId: 'm2', uids: ['a', 'b'], nodes: { a: { go: T0 }, b: { go: T0 + 5 } } }).game, null, 'nobody ever hopped: nothing to count');
  // solo: the engine has no cap → never taken; and a forged `f` on a solo row is dropped by the report
  assert.equal(T.MODES.solo.cap, 0);
  const run = createRun({ seed: 's', mode: 'solo' }), course = createCourse('s');
  for (let i = 0; i < 30000 && !isOver(run); i++) step(run, course, '');
  assert.equal(resultOf(run).feats.mothership, false, 'a solo run is never taken');
  const solo = extractMatch({ id: 'jaywalk', matchId: 'm3', phase: 'final', mode: 'solo', sv: 1, participants: { a: true }, settings: {}, results: { a: { l: 50, t: 9, w: 'car', e: 99, f: 'boom mothership bogus' } } });
  assert.deepEqual(solo.rows.a.f, { boom: 1 }, 'solo: boom counts, mothership never, an unknown word never');
  assert.deepEqual(solo.rows.a.rec, { 'jaywalk-solo': 50 });
  // a refused solo run: named, earns nothing
  const J = jaywalkSolo({ code: CODE, matchId: 'm4', uid: 'a', node: { go: T0, c: { 0: { s: 'U0U1', at: T0 + 50 } } } });
  assert.ok(J.game.results.a.bad, 'two hops a tick apart: refused'); assert.equal(J.game.results.a.f, undefined);
  assert.deepEqual(serverRow({ ok: true, result: { lanes: 400, tick: 9, cause: 'car', end: 10, taken: false, feats: { boom: true, ufo: true, airfield: true, mothership: false } } }).f, 'boom ufo airfield');
});

test('EACH AWARDS ONCE: the four achievements + their cards from the flags, never twice; a replayed report is skipped', () => {
  const row = f => ({ rank: 2, win: false, c: { p: 1 }, rec: {}, ...(f ? { f } : {}) });
  let s = null, k = 0;
  const go = (f, n = 4) => { const r = matchStep(s, { key: `J_${k++}`, gid: 'jaywalk', row: row(f), n, now: T0 + k * 120e3, ceiling: Infinity }); assert.ok(!r.skip, r.skip); s = r.next; return r; };
  const a = go({ boom: 1 });
  assert.ok(a.ach.includes('sonic-boom') && a.items.includes('card-sonicboom'), 'SONIC BOOM + its card');
  assert.ok(!a.ach.includes('close-encounter') && !a.ach.includes('right-of-way') && !a.ach.includes('beam-me-up'));
  const b = go({ boom: 1, ufo: 1 });
  assert.ok(!b.ach.includes('sonic-boom') && !b.items.includes('card-sonicboom'), 'never twice');
  assert.ok(b.ach.includes('close-encounter') && b.items.includes('card-closeencounter'));
  const c = go({ airfield: 1, mothership: 1 });
  assert.deepEqual(c.ach.filter(x => ACH[x].game === 'jaywalk').sort(), ['beam-me-up', 'right-of-way']);
  assert.ok(c.items.includes('card-rightofway') && c.items.includes('card-beammeup'));
  const d = go({ boom: 1, ufo: 1, airfield: 1, mothership: 1 });
  assert.deepEqual(d.ach.filter(x => ACH[x].game === 'jaywalk'), [], 'all four held: nothing more');
  assert.equal(matchStep(s, { key: 'J_0', gid: 'jaywalk', row: row({ boom: 1 }), n: 4, now: T0 + 9e6 }).skip, 'counted', 'a replayed report is skipped by its key');
  // a solo row's flags reach the engine too (RIGHT OF WAY in a solo run)
  const solo = matchStep(null, { key: 'S_1', gid: 'jaywalk', row: { rank: 1, win: false, solo: true, c: { p: 1 }, rec: { 'jaywalk-solo': 400 }, f: { airfield: 1 } }, n: 1, now: T0 });
  assert.ok(solo.ach.includes('right-of-way'), 'a solo run earns RIGHT OF WAY');
});

test('YOUR BEST ANYWHERE: a counted match run raises the same best (jaywalk-solo); a shorter run never lowers it; NEW BEST is told (pbs); the same match twice = once', () => {
  const m = (lanes, n = 4) => ({ rank: 1, win: n > 1, c: { p: 1 }, rec: { 'jaywalk-solo': lanes } });
  const a = matchStep(null, { key: 'A_1', gid: 'jaywalk', row: { ...m(150, 1), solo: true, win: false }, n: 1, now: T0 });
  assert.equal(a.next.b['jaywalk-solo'].a, 150, 'a solo run: the best');
  const b = matchStep(a.next, { key: 'B_1', gid: 'jaywalk', row: m(212), n: 4, now: T0 + 120e3, ceiling: Infinity });
  assert.equal(b.next.b['jaywalk-solo'].a, 212, 'a 212-lane MATCH run raises it');
  assert.deepEqual(b.pbs.map(p => [p.b, p.v, p.prev]), [['jaywalk-solo', 212, 150]], 'NEW BEST · WAS 150 — on the match\'s end screen');
  const c = matchStep(b.next, { key: 'C_1', gid: 'jaywalk', row: m(180), n: 3, now: T0 + 240e3, ceiling: Infinity });
  assert.equal(c.next.b['jaywalk-solo'].a, 212, 'a shorter match run never lowers it'); assert.deepEqual(c.pbs, []);
  assert.equal(matchStep(c.next, { key: 'B_1', gid: 'jaywalk', row: m(999), n: 4, now: T0 + 480e3 }).skip, 'counted', 'idempotent: the same match is never counted twice');
  // the report's own extract: a match row carries the board's id itself; a solo row through the solo lane — the same board
  const g = { id: 'jaywalk', matchId: 'x', phase: 'final', sv: 1, settings: {}, participants: { a: true, b: true }, results: { a: { l: 212, t: 9, w: 'car', e: 10 }, b: { l: 3, t: 2, w: 'car', e: 4 } } };
  assert.deepEqual(extractMatch({ ...g, mode: 'match' }).rows.a.rec, { 'jaywalk-solo': 212 });
  assert.deepEqual(extractMatch({ ...g, mode: 'solo', participants: { a: true }, results: { a: g.results.a } }).rows.a.rec, { 'jaywalk-solo': 212 });
});

test('REPLAY = LIVE across many seeds — through UFO zones, flight paths and THE MOTHERSHIP\'s cap; the feats included', () => {
  let ufo = 0, flight = 0, taken = 0, boom = 0, near = 0;
  for (let s = 0; s < 60; s++) {
    const mode = s % 3 === 2 ? 'match' : 'solo', seed = `h6a-${s}`, course = createCourse(seed), run = createRun({ seed, mode });
    const log = playBot(run, course, greedyBot({ seed, lazy: mode === 'match', look: mode === 'match' ? 30 : 22 }), mode === 'match' ? T.MODES.match.cap + 20 : 9000);
    while (!isOver(run)) step(run, course, '');
    const live = resultOf(run), { used, ...r } = replay({ seed, mode, log });
    assert.deepEqual(r, live, `${seed} (${mode}): the replay = the live run — lane ${live.lanes}, ${live.cause}`);
    assert.equal(used, log.length);
    for (let i = 0; i <= live.lanes; i++) { const L = course.lane(i); if (L.ufo) { ufo++; break; } }
    for (let i = 0; i <= live.lanes; i++) if (course.lane(i).type === 'flight') { flight++; break; }
    if (live.taken) taken++; if (live.feats.boom) boom++; if (live.feats.ufo) near++;
    assert.equal(live.feats.mothership, live.taken); assert.equal(live.feats.airfield, live.lanes >= T.LOOP_LANES);
    if (live.cause === 'ufo') assert.equal(live.feats.mothership, false);
  }
  const R = shipRun(), again = replay({ seed: R.S.seed, mode: 'match', log: R.log });
  assert.equal(again.taken, true); assert.equal(again.end, T.MODES.match.cap); if (again.taken) taken++;
  assert.ok(ufo >= 5 && flight >= 5 && taken >= 1, `the runs went through ${ufo} UFO zones, ${flight} flight paths, ${taken} mothership finishes (${boom} booms, ${near} close encounters)`);
});

test('THE MOMENTS ARE A VIEW, ON DEMAND: flyers.js out of the eager graph, never imported by a rule / the replay / the server; its numbers; the words', () => {
  const fl = read('js/games/jaywalk/flyers.js'), night = read('js/games/jaywalk/night.js'), view = read('js/games/jaywalk/view.js');
  assert.ok(!PRELOAD.jaywalk.includes('js/games/jaywalk/flyers.js'), 'flyers.js is NOT in the cartridge\'s eager graph (THE PER-GAME BUDGET)');
  assert.match(night, /lazyImport\(import\('\.\/flyers\.js'\), '\.\/flyers\.js'\)/, 'night.js fetches it on demand, through THE SKEW WRAPPER');
  for (const f of readdirSync(new URL('../js/games/jaywalk/', import.meta.url))) if (f !== 'night.js' && f.endsWith('.js')) assert.doesNotMatch(read(`js/games/jaywalk/${f}`), /from '\.\/flyers\.js'|import\('\.\/flyers\.js'\)/, `${f} never imports the moments`);
  for (const f of ['api/_lib/jaywalk.js', 'api/report.js', 'js/core/match-report.js']) assert.doesNotMatch(read(f), /flyers|jaywalk\/night|from 'three'/, `${f}: the rules + the server never see the view`);
  for (const f of ['engine.js', 'replay.js', 'course.js', 'tuning.js', 'logic.js']) assert.doesNotMatch(read(`js/games/jaywalk/${f}`), /flyers/, f);
  // the three models: fetched by flyers.js alone, each when its moment nears — never by the scene's own loader / the preload
  assert.doesNotMatch(read('js/games/jaywalk/models.js'), /blackbird|mothership|'ufo'/, 'models.js never lists the flyers (SCENE_MODELS + warmModels stay as they were)');
  assert.match(fl, /need\('blackbird'\)/); assert.match(fl, /need\('ufo'\)/); assert.match(fl, /if \(cap\) need\('mothership'\)/);
  for (const m of ['blackbird', 'ufo', 'mothership']) assert.ok(readFileSync(new URL(`../assets/jaywalk/models/${m}.glb`, import.meta.url)).length > 20000, `${m}.glb is in the repo`);
  const cr = read('assets/jaywalk/models/CREDITS.md');
  assert.match(cr, /Sr-71 by Kiiba[^\n]*CC BY 4\.0/); assert.match(cr, /Poly by Google[^\n]*b0N_HeT_Ttb[^\n]*CC BY 3\.0/); assert.match(cr, /Poly by Google[^\n]*6hu2h8v78mO[^\n]*CC BY 3\.0/);
  assert.ok(read('assets/jaywalk/models/LICENSE-flyers.txt').includes('creativecommons.org/licenses/by/4.0'));
  // THE NUMBERS (FLY): the glint is the tell's LAST 0.5 s — inside the tell, which is never under 1.5 s; the shake ≤ 4 px, ≤ 200 ms
  const num = k => Number(new RegExp(`\\b${k}: ([0-9.]+)`).exec(fl)[1]);
  assert.equal(num('glint'), 30, 'the glint: the last 30 ticks = 0.5 s');
  assert.ok(num('glint') < T.FLIGHT.tell && T.FLIGHT.tell >= T.MIN_TELL_TICKS, 'inside the tell — the ≥ 1.5 s warning itself is the rules\', untouched');
  assert.match(fl, /if \(tell && left0 <= FLY\.glint\)/, 'drawn only while the tell runs');
  assert.ok(num('shake') * 390 / 8 <= 4, `the shake ≤ 4 px at ZOOM 8 on a 390 pt phone (${(num('shake') * 390 / 8).toFixed(2)})`);
  assert.ok(num('shakeTicks') <= 12, '… for ≤ 200 ms'); assert.match(fl, /if \(!reduce && near && u >= FLY\.shakeFrom/, 'none with reduce motion');
  assert.equal(num('abductMs'), 2000, 'THE ABDUCTION ≈ 2 s'); assert.match(fl, /warn: 10 \* TICK_HZ/, 'THE MOTHERSHIP warns for 10 s');
  assert.match(fl, /const GREEN = 0x4dff5a, GREEN_D = 0x12d83c;/, 'the UFO\'s ring is a clear yellow-GREEN (night · day)');
  assert.match(fl, /ring\(bx, 0\.05, bz, d, 1, day \? GREEN_D : GREEN, pu \* dim\);/, '… laid where the rules have it'); assert.doesNotMatch(fl, /K\.flat\.put\([^\n]*0x(22e0ff|4d7dff|1a6fe0|3fb0ff)/, 'never a water blue laid on the ground by the UFO');
  // the view holds the scene on the moment before the end screen covers it; the scene's own sounds are the module's
  assert.match(view, /const hold = \(\) => Math\.max\(END_HOLD_MS, night \? night\.holdMs\(run\) : 0\);/);
  assert.match(fl, /holdMs = run => \(run\.st === 'taken' \? 4200 : run\.cause === 'ufo' \? FLY\.abductMs \+ 250/);
  assert.match(fl, /__nsAudioBeds/, 'its loops are BEDS (they stop at once when the page is left)');
  // THE WORDS: a finish line, never a death — nothing a player reads says TAKEN
  assert.equal(causeLine({ cause: 'taken', lanes: 412 }), SHIP_LINE); assert.equal(causeLine({ taken: true, look: 'day' }), 'MADE IT TO THE MOTHERSHIP');
  assert.equal(CAUSE_LINES.ufo, 'ABDUCTED'); assert.equal(CAUSE_LINES.blackbird, 'BUZZED BY THE BLACKBIRD');
  for (const f of readdirSync(new URL('../js/games/jaywalk/', import.meta.url))) if (f.endsWith('.js')) assert.doesNotMatch(read(`js/games/jaywalk/${f}`).replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ''), /TAKEN/, `${f}: no "TAKEN" in what the code shows`);
  assert.doesNotMatch(read('css/jaywalk.css').replace(/\/\*[\s\S]*?\*\//g, ''), /TAKEN/);
  assert.match(read('js/games/jaywalk/victory.js'), /E\.ship \? `YOU \$\{E\.line\}` : E\.line/, 'the match end screen: YOU MADE IT TO THE MOTHERSHIP');
});
