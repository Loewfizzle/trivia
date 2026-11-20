// JAYWALK H3 — THE SOLO GAME's rules + its anti-cheat (PURE — THE UNIT JOB INSTALLS NOTHING): THE COURSE IS PICKED AFTER GO (seedOf), the
// chunks' own clock, THE SPEED CHECK BOTH WAYS (a log from the future refused · a slowed log cut at its last on-time hop · an honest one
// passes), the server's own result → the solo best (only a match the server replayed earns the record), the cause lines, the solo
// director (no count, PLAY AGAIN's next run), and the phone's side of the proof read from its source. (H4: ONE LIFE — no lives anywhere;
// THE DROPPED SIGNAL + the match: tests/jaywalk-match.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyRun, verifyNode, jaywalkSolo, serverRow, seedOf as serverSeedOf } from '../api/_lib/jaywalk.js';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, resultOf, step, isOver } from '../js/games/jaywalk/engine.js';
import { packLog, logFromChunks, chunkTimes, clockProblem, replay, seedProblem } from '../js/games/jaywalk/replay.js';
import { seedOf, soloTick, scoreRun, scoreRuns, standings } from '../js/games/jaywalk/logic.js';
import { createGame, nextStep, nextRun } from '../js/games/jaywalk/director.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';
import { causeLine, CAUSE_LINES, hitVehicle, vehicleAt, CAR_KINDS } from '../js/games/jaywalk/causes.js';
import { extractMatch, soloEmpty } from '../js/core/match-report.js';
import { boardDef } from '../js/core/boards.js';
import { OPTIONAL, META_KEYS, checkCartridge } from '../js/games/contract.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const CODE = 'WXYZ', M = 'sabc12', GO = 1_800_000_000_000;
const msOf = tick => Math.ceil(tick * 1000 / T.TICK_HZ);

/** an honest solo run on the course its GO picked: the bot plays, then the kid stands until the run ends → the log + the live result */
function honest(go = GO, ticks = 3000, code = CODE, m = M) {
  const seed = seedOf(code, m, go), course = createCourse(seed), run = createRun({ seed, mode: 'solo' });
  const log = playBot(run, course, greedyBot({ seed }), ticks);
  while (!isOver(run)) step(run, course, '');
  return { seed, log, live: resultOf(run), go };
}
/** a LONG honest run (≥ 60 hops, past lane 20, 43 s+ — a 20 % slow-down needs 32 s to fall 8 s behind): the first GO time from `GO` on whose course the bot gets that far */
let LONG = null;
function longRun() {
  if (LONG) return LONG;
  for (let k = 0; k < 400; k++) { const h = honest(GO + k * 7); if (h.log.length >= 60 && h.live.lanes > 20 && h.live.end > 2600) { LONG = h; return h; } }
  throw new Error('no long honest run');
}
/** the proof node a phone writes: the log in one chunk a second, each stamped `at` = when (server time) its hops went up.
 *  clock(tick) → the server's time that tick was played at (honest: go + the tick's own time); lag = the upload's delay */
function nodeOf({ log, go }, { clock = t => go + msOf(t), lag = 120, per = T.TICK_HZ } = {}) {
  const c = {};
  let from = 0, k = 0;
  while (from < log.length) {
    const edge = (Math.floor(log[from].t / per) + 1) * per;
    let to = from; while (to < log.length && log[to].t < edge) to++;
    c[k++] = { s: packLog(log.slice(0, to), from), at: clock(edge) + lag };
    from = to;
  }
  return { go, c, e: { l: 0, t: 0 } };
}

test('THE COURSE IS PICKED AFTER GO: seed = hash(room code + matchId + the server\'s GO time) — the same on the phone + the server, another for every code / match / millisecond', () => {
  const s = seedOf(CODE, M, GO);
  assert.equal(s, seedOf(CODE, M, GO)); assert.equal(s, serverSeedOf(CODE, M, GO), 'the server derives the same seed');
  assert.equal(seedProblem(s), null); assert.ok(s.length <= T.SEED_MAX && /^g[0-9a-z]+$/.test(s));
  const others = [seedOf(CODE, M, GO + 1), seedOf(CODE, M, GO - 1), seedOf('WXYA', M, GO), seedOf(CODE, 'sabc13', GO)];
  assert.equal(new Set([s, ...others]).size, 5, 'one millisecond later = another course');
  const lanes = seed => JSON.stringify(Array.from({ length: 40 }, (_, i) => createCourse(seed).lane(i + 4).type));
  assert.notEqual(lanes(s), lanes(others[0]), '… really another course');
  // 2,000 GO times a millisecond apart: 2,000 different seeds (nobody can shop for a course they have seen)
  assert.equal(new Set(Array.from({ length: 2000 }, (_, i) => seedOf(CODE, M, GO + i))).size, 2000);
  assert.equal(soloTick(GO, GO), 0); assert.equal(soloTick(GO, GO + 1000), T.TICK_HZ, 'tick 0 = GO; 60 ticks a second on the server\'s clock');
  // the phone never makes the seed itself: the solo director's game.seed is not the course
  const g = createGame({ matchId: M, settings: {}, participants: { a: true }, now: GO, seed: 'host-made' });
  const h = longRun();
  assert.equal(scoreRun(g, nodeOf(h), h.go + msOf(h.live.end) + 5000, CODE).l, h.live.lanes, 'the result is the replay on the GO-picked course');
  assert.equal(scoreRun(g, { c: nodeOf(h).c }, h.go + 60000, CODE).l, 0, 'no GO = no run (never the host\'s own seed)');
  assert.notEqual(scoreRun({ ...g, matchId: 'sother' }, nodeOf(h), h.go + msOf(h.live.end) + 5000, CODE).l, h.live.lanes, 'the same log on another match\'s course is another run');
});

test('THE CHUNKS\' OWN CLOCK: c/{i} = { s, at } → the hop log + each chunk\'s server time; a hole, a bare string, a missing time = no clock', () => {
  const h = longRun(), node = nodeOf(h);
  assert.deepEqual(logFromChunks(node.c), h.log, 'the chunks joined = the log');
  const times = chunkTimes(node.c);
  assert.equal(times.reduce((a, k) => a + k.n, 0), h.log.length);
  for (let i = 1; i < times.length; i++) assert.ok(times[i].at >= times[i - 1].at && times[i].t0 > times[i - 1].t1);
  assert.equal(clockProblem(h.go, times), null, 'an honest run\'s clock');
  assert.deepEqual(logFromChunks({ 0: 'U5', 1: 'R9' }), [{ t: 5, d: 'u' }, { t: 14, d: 'r' }], 'H1\'s bare strings still read as a LOG (the pure tests)');
  assert.equal(chunkTimes({ 0: 'U5' }), null, '… but carry no clock');
  assert.equal(chunkTimes({ 0: { s: 'U5' } }), null); assert.equal(chunkTimes({ 1: { s: 'U5', at: 5 } }), null, 'a hole');
  assert.equal(chunkTimes({ 0: { s: 'u5', at: 5 } }), null, 'a bad chunk');
  assert.deepEqual(chunkTimes(null), []);
  assert.deepEqual(clockProblem(0, []), { why: 'go' }); assert.deepEqual(clockProblem(GO, null), { why: 'chunks' });
  assert.deepEqual(clockProblem(GO, [{ at: GO - 1, n: 1, t0: 0, t1: 0 }]), { why: 'clock' }, 'a chunk before GO');
  assert.deepEqual(clockProblem(GO, [{ at: GO + 5000, n: 1, t0: 10, t1: 10 }, { at: GO + 4000, n: 1, t0: 200, t1: 200 }]), { why: 'clock' }, 'a chunk\'s time never runs backwards');
});

test('THE SPEED CHECK, BOTH WAYS: an honest run passes (a slow network too) · a log from the FUTURE is refused · a SLOWED game counts only up to its last on-time hop', () => {
  const h = longRun();
  assert.ok(h.log.length >= 60 && h.live.lanes > 20, `a real run (${h.log.length} hops, lane ${h.live.lanes})`);
  // honest: the server's result = the phone's
  const ok = verifyNode({ code: CODE, matchId: M, node: nodeOf(h) });
  assert.equal(ok.ok, true, ok.why); assert.equal(ok.cut, undefined);
  const { over, ...phone } = h.live; assert.equal(over, true);
  assert.deepEqual(ok.result, phone, 'THE SERVER\'s replay = the phone\'s run (lanes, tick, cause, where)');
  // a slow network (every upload 3 s late) and a 5 s stall mid-run are still honest
  assert.equal(verifyNode({ code: CODE, matchId: M, node: nodeOf(h, { lag: 3000 }) }).cut, undefined, '3 s of upload lag');
  assert.deepEqual(verifyNode({ code: CODE, matchId: M, node: nodeOf(h, { lag: 3000 }) }).result, phone);
  // AHEAD — a log from the future: the whole log uploaded the moment the run began (made in advance, or a sped-up game)
  const future = nodeOf(h, { clock: () => h.go + 500, lag: 0 });
  assert.deepEqual(verifyNode({ code: CODE, matchId: M, node: future }), { ok: false, why: 'ahead of the clock' });
  // … a game run at DOUBLE speed (each tick takes half its time)
  const fast = nodeOf(h, { clock: t => h.go + msOf(t) / 2 });
  assert.deepEqual(verifyNode({ code: CODE, matchId: M, node: fast }), { ok: false, why: 'ahead of the clock' });
  // … but a frame early is fine (the phone's clock estimate): inside CLOCK.ahead
  assert.equal(verifyNode({ code: CODE, matchId: M, node: nodeOf(h, { lag: -900 }) }).ok, true, '0.9 s early: the slack');
  // BEHIND — a SLOWED game (every tick takes twice its time): the run counts up to the last hop that was on time, never past it
  const slow = verifyNode({ code: CODE, matchId: M, node: nodeOf(h, { clock: t => h.go + msOf(t) * 2 }) });
  assert.equal(slow.ok, true); assert.equal(slow.cut.why, 'behind');
  assert.ok(slow.cut.tick <= 2 * T.CLOCK.behind + T.TICK_HZ, `cut within ${(slow.cut.tick / T.TICK_HZ).toFixed(1)} s of real play (2× slow: 8 s of lag is reached after ~8 s)`);
  assert.ok(slow.result.lanes < h.live.lanes && slow.result.lanes <= replay({ seed: h.seed, mode: 'solo', log: h.log, until: slow.cut.tick }).lanes, `the slowed run keeps ${slow.result.lanes} of its ${h.live.lanes} lanes`);
  // … 20 % slow: caught too, later
  const slower = verifyNode({ code: CODE, matchId: M, node: nodeOf(h, { clock: t => h.go + msOf(t) * 1.25 }) });
  assert.equal(slower.cut && slower.cut.why, 'behind'); assert.ok(slower.cut.tick > slow.cut.tick && slower.result.lanes < h.live.lanes);
  // a pause in the middle (the game stopped for 30 s, then went on): everything after it is late
  const paused = verifyNode({ code: CODE, matchId: M, node: nodeOf(h, { clock: t => h.go + msOf(t) + (t > 300 ? 30000 : 0) }) });
  assert.equal(paused.cut.why, 'behind'); assert.ok(paused.cut.tick >= 300 && paused.cut.tick < 400, 'cut at the pause');
  // the proof must be whole: no GO, no chunks' clock, a broken clock, a forged hop
  assert.deepEqual(verifyNode({ code: CODE, matchId: M, node: { c: nodeOf(h).c } }), { ok: false, why: 'no go' });
  assert.deepEqual(verifyNode({ code: CODE, matchId: M, node: { go: h.go, c: { 0: packLog(h.log) } } }), { ok: false, why: 'chunks' });
  const back = nodeOf(h); back.c[2].at = back.c[1].at - 5;
  assert.equal(verifyNode({ code: CODE, matchId: M, node: back }).why, 'the chunks\' clock');
  const forged = nodeOf(h); forged.c[0].s = `${forged.c[0].s}U1`;
  assert.equal(verifyNode({ code: CODE, matchId: M, node: forged }).ok === true && verifyNode({ code: CODE, matchId: M, node: forged }).result.lanes === h.live.lanes && !verifyNode({ code: CODE, matchId: M, node: forged }).cut, false, 'an edited log is never the honest run');
  assert.equal(verifyNode({ code: CODE, matchId: 'sother', node: nodeOf(h) }).ok && verifyNode({ code: CODE, matchId: 'sother', node: nodeOf(h) }).result.lanes === h.live.lanes, false, 'a log replayed on another match\'s course');
  // verifyRun without a clock is H1's (the pure log) — with one, the same rule
  assert.equal(verifyRun({ seed: h.seed, mode: 'solo', log: h.log }).ok, true);
  assert.equal(verifyRun({ seed: h.seed, mode: 'solo', log: h.log, go: h.go, times: chunkTimes(future.c) }).why, 'ahead of the clock');
});

test('THE SERVER\'S OWN RESULT → THE SOLO BEST: only a match the server replayed (sv) earns `jaywalk-solo`; a refused run earns nothing + is named; a 0-lane run is empty', () => {
  const h = longRun(), uid = 'u1';
  const J = jaywalkSolo({ code: CODE, matchId: M, uid, node: nodeOf(h) });
  assert.equal(J.v.ok, true); assert.equal(J.game.sv, 1); assert.equal(J.game.results[uid].l, h.live.lanes);
  const ex = extractMatch(J.game);
  assert.equal(ex.solo, true); assert.deepEqual(ex.rows[uid].rec, { 'jaywalk-solo': h.live.lanes }, 'the lanes on the solo board');
  assert.equal(ex.rows[uid].win, false); assert.equal(ex.rows[uid].empty, undefined);
  assert.deepEqual({ ...boardDef('jaywalk-solo') }, { id: 'jaywalk-solo', kind: 'record', label: 'FARTHEST RUN', fmt: 'int', dir: 1, short: 'LANES', unit: '', game: 'jaywalk' }, 'lanes, max');
  // the room's own results (the host wrote them) never earn a record — whatever they claim
  const claim = { id: 'jaywalk', matchId: M, phase: 'final', mode: 'solo', participants: { [uid]: true }, settings: {}, results: { [uid]: { l: 99999, t: 5 } } };
  assert.deepEqual(extractMatch(claim).rows[uid].rec, {}, 'a claim is never a record');
  assert.deepEqual(extractMatch({ ...claim, sv: 1, participants: { [uid]: true, u2: true }, results: { [uid]: { l: 50, t: 5 }, u2: { l: 40, t: 5 } } }).rows[uid].rec, { 'jaywalk-solo': 50 }, 'H6A — YOUR BEST ANYWHERE: a counted MATCH run raises the same best');
  // a run from the future: refused → 0 lanes, named in `rejected`, EMPTY (no XP, no streak day)
  const bad = jaywalkSolo({ code: CODE, matchId: M, uid, node: nodeOf(h, { clock: () => h.go + 500, lag: 0 }) });
  assert.equal(bad.v.ok, false); assert.deepEqual(bad.game.results[uid], { l: 0, t: 0, w: '', e: -1, bad: 'ahead of the clock' });
  const exBad = extractMatch(bad.game);
  assert.deepEqual(exBad.rows[uid].rec, {}); assert.equal(exBad.rows[uid].empty, 1); assert.deepEqual(exBad.rejected, [{ uid, board: 'jaywalk-solo', v: 'ahead of the clock' }]);
  // a slowed run: counted to its cut (marked), never its full lanes
  const cut = jaywalkSolo({ code: CODE, matchId: M, uid, node: nodeOf(h, { clock: t => h.go + msOf(t) * 2 }) });
  assert.equal(cut.game.results[uid].cut, 1); assert.ok(cut.game.results[uid].l < h.live.lanes);
  // a phone left on the table (no hop): empty
  const idle = jaywalkSolo({ code: CODE, matchId: M, uid, node: { go: h.go } });
  assert.equal(idle.v.ok, true); assert.equal(idle.game.results[uid].l, 0); assert.equal(soloEmpty(idle.game, uid, { score: 0 }), true);
  assert.equal(jaywalkSolo({ code: CODE, matchId: M, uid, node: null }).v.why, 'no go');
  assert.deepEqual(serverRow({ ok: false, why: 'x'.repeat(40) }).bad.length, 24);
});

test('THE SOLO DIRECTOR: no count (`play` at once, PLAY NOW\'s walk inside is the wait); the end = the run\'s own `e`; PLAY AGAIN = the next run as a match of its own', () => {
  const g = createGame({ matchId: M, settings: { lives: 3 }, participants: { a: true }, now: GO, seed: 'x' });
  assert.deepEqual([g.mode, g.phase, g.playAt, g.settings], ['solo', 'play', GO, {}], 'ONE LIFE: a lives setting is dropped — the game has no options');
  const match = createGame({ matchId: 'm2', settings: {}, participants: { a: true, b: true }, now: GO, seed: 'x' });
  assert.deepEqual([match.mode, match.phase, match.playAt], ['match', 'count', GO + 3000], 'the match keeps its 3 · 2 · 1');
  assert.equal(nextStep(g, { now: GO + 5000, live: { runs: {} }, code: CODE }), null, 'waiting for GO');
  assert.equal(nextStep(g, { now: GO + 5000, live: { runs: { a: { go: GO + 100 } } }, code: CODE }), null, 'the run is on');
  const h = honest(GO + 100), node = { ...nodeOf(h), e: { l: h.live.lanes, t: h.live.tick, w: h.live.cause } };
  const end = nextStep(g, { now: GO + 100 + msOf(h.live.end) + 400, live: { runs: { a: node } }, code: CODE });
  assert.equal(end.phase, 'final');
  assert.deepEqual([end.results.a.l, end.results.a.w, end.results.a.e, end.results.a.go], [h.live.lanes, h.live.cause, h.live.end, GO + 100], 'the result = the replay; + where it ended (the end screen) + its GO');
  assert.deepEqual(standings({ ...g, ...end }).map(r => [r.uid, r.rank, r.score]), [['a', 1, h.live.lanes]]);
  assert.equal(scoreRuns(g, { a: { ...node, e: { l: 99999, t: 1 } } }, GO + 100 + msOf(h.live.end) + 400, CODE).a.l, h.live.lanes, 'the node\'s `e` is a signal — never read as a score');
  // PLAY AGAIN (the console's INSTANT AGAIN)
  const done = { ...g, ...end };
  const n = nextRun(done, { matchId: 'snext1', now: GO + 90000 });
  assert.deepEqual([n.id, n.matchId, n.mode, n.phase, n.playAt, Object.keys(n.participants).join(), n.settings, n.results], ['jaywalk', 'snext1', 'solo', 'play', GO + 90000, 'a', {}, undefined]);
  assert.equal(nextRun(g, { matchId: 'snext1', now: 1 }), null, 'only after the run ended');
  assert.equal(nextRun({ ...match, phase: 'final' }, { matchId: 'snext1', now: 1 }), null, 'only a solo run');
  // the contract knows the two new optional pieces
  assert.equal(OPTIONAL.soloAgain, 'function'); assert.equal(OPTIONAL.AGAIN_LABEL, 'string'); assert.ok(META_KEYS.includes('AGAIN_LABEL'));
  const stub = { DEFAULT_SETTINGS: {}, OPTIONS: [], estimateMinutes() {}, MUSIC: null, start() {}, prepare() {}, step() {}, livePaths() {}, createView() {}, finalRanks() {} };
  assert.deepEqual(checkCartridge('x', { ...stub, AGAIN_LABEL: 'ONE MORE' }), []);
  assert.doesNotMatch(read('js/games/jaywalk/meta.js').replace(/\/\/[^\n]*/g, ''), /AGAIN_LABEL|HOP AGAIN/, 'H4 — the owner: PLAY AGAIN everywhere (the console\'s own word): JAYWALK sets no label');
  for (const f of ['view.js', 'lab.js', 'victory.js']) assert.doesNotMatch(read(`js/games/jaywalk/${f}`).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, ''), /HOP AGAIN/, `${f}: never HOP AGAIN on screen`);
  assert.equal(checkCartridge('x', { ...stub, AGAIN_LABEL: 'go' }).length, 1);
});

test('THE END SCREEN\'s WORDS: one line per cause + vehicle — big neon words, never dev text; the vehicle named is the one the night look drew', () => {
  for (const c of T.CAUSES) assert.ok(c === 'car' ? !CAUSE_LINES.car : CAUSE_LINES[c], c === 'car' ? 'a car hit has NO generic line — only its vehicle\'s (H4)' : `a line for ${c}`);
  for (const v of [...CAR_KINDS, 'van', 'truck']) assert.ok(CAUSE_LINES[`car:${v}`], `a line for a ${v}`);
  assert.equal(new Set(Object.values(CAUSE_LINES)).size, Object.keys(CAUSE_LINES).length, 'every line its own');
  for (const line of Object.values(CAUSE_LINES)) assert.match(line, /^[A-Z0-9][A-Z0-9 :]{5,25}$/, `${line}: capitals, ≤ 26 letters (two short lines at 390)`);
  assert.equal(causeLine({ cause: 'car', vehicle: 'taxi' }), 'FLATTENED BY A TAXI'); assert.equal(causeLine({ cause: 'water' }), 'SWEPT AWAY');
  assert.equal(causeLine({ cause: 'train' }), 'HIT BY THE 6:15'); assert.equal(causeLine({ cause: 'wall' }), 'THE LIGHTS WENT OUT');
  assert.equal(causeLine({ cause: 'car' }), 'OUT', 'H4: no generic "HIT BY A CAR" — a car hit is always named by its vehicle (tests/jaywalk-causes.test.mjs)'); assert.equal(causeLine({ cause: 'taken', lanes: 212 }), 'MADE IT TO THE MOTHERSHIP'); assert.equal(causeLine({}), 'OUT');
  // real runs that end under a car: the vehicle found at the end = the one on that lane at that tick; every kind shows up
  const seen = new Set();
  for (let s = 0; s < 400 && seen.size < 5; s++) {
    const seed = `hit${s}`, course = createCourse(seed), run = createRun({ seed, mode: 'solo' });
    let i = 4; while (course.lane(i).type !== 'road') i++;
    while (!isOver(run) && run.y < i && run.t < 4000) step(run, course, run.st === 'idle' ? 'u' : '');
    while (!isOver(run) && run.t < 6000) step(run, course, '');
    const r = resultOf(run);
    if (r.cause !== 'car') continue;
    const v = hitVehicle(course, r);
    assert.ok(v, `${seed}: the car that hit at lane ${r.y}, tick ${r.end}`);
    const L = course.lane(r.y), j = L.items.findIndex((it, k) => vehicleAt(course, r.y, k) === v);
    assert.ok(j >= 0); seen.add(v);
    assert.equal(hitVehicle(course, replay({ seed, mode: 'solo', log: [] , until: null }).cause === 'car' ? r : r), v);
  }
  assert.deepEqual([...seen].sort(), ['hatchback', 'sedan', 'taxi', 'truck', 'van'], 'every vehicle has flattened someone');
  assert.equal(hitVehicle(createCourse('x'), { y: 0, x: 4500, end: 10 }), '', 'not a road: nothing');
  // night.js draws by the SAME pick
  const n = read('js/games/jaywalk/night.js');
  assert.match(n, /import \{ hsh, strSeed, vehicleAt \} from '\.\/causes\.js';/); assert.match(n, /const what = vehicleAt\(course, i, j\)/);
  const v = read('js/games/jaywalk/victory.js');
  assert.match(v, /const seed = solo \? seedOf\(code, game\.matchId, r\.go\) : game\.seed;/, 'the course: a solo run\'s from its own GO, a match\'s the game\'s');
  assert.match(v, /const vehicle = course \? hitVehicle\(course, \{ y: r\.y, x: r\.px, end: r\.e \}\) : '';/, 'the end screen reads it back from the result');
  assert.doesNotMatch(v + read('js/games/jaywalk/causes.js'), /[\u{1F300}-\u{1FAFF}✅❌]/u, 'no emoji');
});

test('THE PHONE\'s SIDE OF THE PROOF (view.js): GO = the server\'s time, read back before the course is built; the chunks stamped by the server; the run on the server\'s clock; never a phone\'s clock or a claim', () => {
  const v = read('js/games/jaywalk/view.js').replace(/^\s*\/\/[^\n]*$/gm, '');
  assert.match(v, /dbSet\(dbRef\(path\), serverTimestamp\(\)\)\.then\(\(\) => dbGet\(dbRef\(path\)\)\)/, 'GO written as the server\'s time, then READ BACK');
  assert.match(v, /const seed = ds \|\| isProof \? ds \|\| seedOf\(code, matchId, go\) :/, 'the course from GO (THE DAILY: the day\'s seed from its START — DAILY B)');
  assert.match(v, /course = START;/, 'THE START stands until it lands'); assert.match(v, /night\.setReveal\(0, true\)/); assert.match(v, /night\.setReveal\(1\)/);
  // (THE PROOF PASS: the chunks + the end go up through THE PROOF WRITER — kit/proof-writer.js + proof-io.js, HIGH RISE's too)
  assert.ok(read('js/games/kit/proof-io.js').includes('chunk: (i, s) => dbSet(dbRef(`${path()}/c/${i}`), { s, at: serverTimestamp() }),') && v.includes('io: proofIo(nodePath), pipe: !!D,'), 'every chunk: its hops + the server\'s time');
  assert.match(v, /const tickNow = \(\) => \{ const x = \(srvNow\(\) - go\) \* TICK_HZ \/ 1000/, 'tick 0 = GO, on the server\'s clock');
  assert.match(v, /while \(run\.t < c\.t && !isOver\(run\) && n\+\+ < CATCH_UP\) tick\(\);/, 'a stall is caught up — the rules never skip a tick');
  assert.doesNotMatch(v, /Date\.now\(|localStorage|soloPause/, 'never the phone\'s own clock; its memory = lab-prefs.js; a run never pauses');
  assert.match(v, /W\.end\(\{ l: run\.best, t: run\.bestT, w: String\(run\.cause \|\| ''\)\.slice\(0, 12\) \}\);/, 'the end: a signal only');
  assert.match(v, /TAP TO HOP · SWIPE TO STEP/); assert.match(v, /setPref\('hint', '1'\)/, 'the first-run hint: once per phone, gone on the first hop');
  assert.match(v, /if \(performance\.now\(\) - \(globalThis\.__nsAgainAt \|\| -1e9\) < 3000\) park\(play, night\); else \{ night\.destroy\(\); keepShot\(null\); try \{ SFX\.release\(\); \} catch \{ \/\* silent \*\/ \} \}/, 'the scene stays warm over PLAY AGAIN\'s instant remount only — leaving frees it, the run\'s picture + the decoded sounds (the go-live review)');
  // the console's side
  const a = read('js/games/kit/again.js'), f = read('js/ui/final.js'), idx = read('js/games/jaywalk/index.js');
  assert.match(a, /const matchId = newMatchId\('solo'\);/); assert.match(a, /const patch = \{ game: next, 'meta\/go': null, 'meta\/back': null,/, 'ONE update: the next run, no start stamp → no walk inside');
  assert.match(a, /for \(const n of ALL_PLAYER_NODES\) if \(!proof\.has\(n\)\) patch\[n\] = null;/, 'the proof nodes stay');
  assert.doesNotMatch(a, /from '\.\.\/\.\.\/host\.js'/, 'a lazy chunk: no new export from the boot graph');
  assert.match(f, /mod\.AGAIN_LABEL/); assert.match(f, /A\.instantAgain\(\) : false\)\) : false\)\.then\(ok => ok \|\| PN\.again\(\)\)/, 'no instant path → the console\'s PLAY AGAIN');
  assert.match(idx, /export const soloAgain = \(game, \{ matchId, now \}\) => nextRun\(game, \{ matchId, now \}\);/);
  assert.match(idx, /export \{ finalScene \} from '\.\/victory\.js';/); assert.match(idx, /export const shareRun =/); assert.match(idx, /export function preload\(\)/);
  // the server: the proof on both paths; the owner's-test branch is GENERIC now — kept for the next game being built (JAYWALK is playable
  // since THE GO-LIVE PASS: its GAMES row has no `preview`, so the branch never matches it — everyone's reports are counted)
  const r = read('api/report.js');
  assert.match(r, /if \(uid && GAMES\.some\(g => g\.id === id && g\.preview && !g\.playable\)\) \{\s*const owner = async u => \{ const pid = await pidOf\(u\); return !!pid && \(adminPids\(\)\.includes\(pid\) \|\|/, 'a game being built (none today — the branch waits for the next one): THE OWNER\'s test');
  assert.match(r, /if \(await owner\(uid\)\) return true;/);
  // (H4 — HIS GUESTS: a match THE OWNER PLAYED IN — his own proof node of that match in that room — counts for everyone in it)
  assert.match(r, /for \(const u of provenUids\(id, trees\)\) if \(u !== uid && \(await owner\(u\)\)\) return true;/, 'the owner\'s guests are counted — only in a match he played himself');
  assert.match(r, /if \(!\(await reportableGame\(gid, uid, \{ code, matchId \}\)\)\) throw new ApiError\(409, 'not_reportable'/);
  assert.match(r, /try \{ ex = extractMatch\(jwSolo \? await jwGame\(\) : jwMatch \? await jwMatchGame\(Object\.keys\(game\.participants\)\) : game,/, 'in the room: a solo run AND a match from the server\'s own replay');
  assert.match(r, /\} else if \(jwSolo\) \{/, 'the room moved on (PLAY AGAIN): the proof node still counts the run');
  assert.match(r, /\} else if \(jwMatch\) \{[\s\S]{0,700}ex = extractMatch\(await jwMatchGame\(Object\.keys\(night\.p \|\| \{\}\)\), \{\}\)/, '… a MATCH after a rematch: everyone the night record names, from their proof nodes');
  assert.match(r, /if \(jwMatch && game\.unproven\) throw new ApiError\(409, 'unverifiable'/, 'an UNPROVEN match is never counted');
  assert.match(r, /const agree = jwMatch \|\| /, 'a match the server replayed itself needs no second opinion on its placings');
  // THE MATCH on the phone (H4): the first GO, the ghosts, the half-second chunks, Call the Winner, the frame for the share image
  assert.match(v, /const S = startOf\(g, runs, code\);/, 'the course + tick 0 from THE FIRST GO (H4B — logic.js#startOf: the nodes are the truth)');
  assert.ok(v.includes("writeMatchGo(treePath(), uid, 'jaywalk')") && read('js/games/kit/proof-io.js').includes('return runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false })'),'H4B — a match\'s GO is a transaction never applied locally: the phone\'s own estimate is never in its mirror');
  assert.match(v, /srvNow\(\) >= g\.playAt - GO_EARLY_MS/, 'its own GO in the count\'s last 2 s (the rules\' window)');
  assert.match(v, /isMatch \? CLOCK\.flushMatchMs : CLOCK\.flushMs/); assert.match(v, /stepGhosts\(wt\);/, 'the ghosts: the others\' logs through the same engine, at THE WORLD\'s own tick (H4B)'); assert.doesNotMatch(v, /GHOST_DELAY/, 'no ghost delay any more');
  assert.match(v, /callEl = showCall\(\{/, 'Call the Winner = the match kit\'s piece'); assert.match(v, /const path = `\$\{nodePath\(\)\}\/k`;/, 'the call lives in the caller\'s own proof node');
  assert.match(v, /night\.snap\(cv => \{/, 'the frame of the moment you went out'); assert.doesNotMatch(v, /jw-stub|BEING BUILT/, 'the match screen is real: the stub is gone');
});

test('HOW TO PLAY + YOUR TABLE: the rules IN ui/help.js since THE GO-LIVE PASS (moved from the cartridge, the hub kept for the next game); the table = you + your friends\' bests', async () => {
  const help = read('js/ui/help.js');
  const blk = help.slice(help.indexOf('RULES.jaywalk = {'), help.indexOf('RULES.gridlock = {'));
  assert.ok(blk.length > 200, 'RULES.jaywalk lives in ui/help.js');
  const goal = /goal: '([^']+)'/.exec(blk)[1];
  const titles = [...blk.matchAll(/^ {4}\['([A-Z ]+)', \[$/gm)].map(x => x[1]);
  const lines = [...blk.matchAll(/^ {6}'([^']+)',$/gm)].map(x => x[1]);
  assert.ok(goal.length <= 70 && titles.length === 2, 'one line + two short sections');
  for (const t of titles) assert.match(t, /^[A-Z ]{6,16}$/);
  for (const t of lines) assert.ok(t.length <= 52 && /^[A-Z]/.test(t), `a kid's line: ${t}`);
  assert.equal(lines.length, 11, 'eleven short lines (the review\'s nine + THE GO-LIVE PASS\'s keyboard line + THE POLISH PASS\'s Mothership — a MATCH ends at 6:00, never in solo)');
  const all = lines.join(' ');
  for (const w of ['TAP', 'SWIPE', 'KEYBOARD', 'arrow keys', 'WASD', 'SPACE', 'ROADS', 'WATER', 'logs', 'RAILS', 'LIGHTS', 'RUNWAY', 'UFO', 'fog by day', 'MATCH ends at 6:00', 'MOTHERSHIP']) assert.ok(all.includes(w), `the rules say ${w}`);
  assert.doesNotMatch(goal + all, /night harbor/, 'true by DAY too (the go-live review)'); assert.match(goal, /One life\. In a match, the farthest wins\./);
  assert.equal((blk.match(/svg\('/g) || []).length, 11, 'one small drawing a line (picture-led)');
  assert.match(help, /const TAB = \{ jaywalk: 'JW',/);
  assert.match(help, /\? h\('ul\.help-list\.help-pics', items\.map\(\(t, i\) => h\('li', h\('span\.help-pic', \{ html: r\.pics\[s\]\[i\] \}\), h\('span', t\)\)\)\)/, 'the shared help draws one picture a line');
  assert.match(read('css/components.css'), /\.help-pics li \{/, 'its CSS in the boot stylesheet — the help opens before the cartridge loads');
  assert.doesNotMatch(read('css/jaywalk.css'), /jw-help/, 'the cartridge\'s copy is gone');
  assert.throws(() => read('js/games/jaywalk/help.js'), 'js/games/jaywalk/help.js is deleted');
  assert.doesNotMatch(read('js/games/jaywalk/index.js'), /registerHelp|__nsHelp/, 'the cartridge registers no hub body any more');
  assert.match(help, /const hub = id => \(globalThis\.__nsHelp \|\| \{\}\)\[id\];/); assert.match(help, /if \(hub\(id\)\) return hub\(id\)\(\);/, 'the hub stays for the next game being built');
  // THE BOOT BUDGET is never raised (CITY F freed the room JAYWALK's meta + help + tile took)
  assert.equal(JSON.parse(read('tests/integration/boot-budget.json')).moduleKB, 6500);
  // YOUR TABLE: a table of one is nothing; you are always on it; best first; at most 4 rows
  const { tableRows, TABLE_ROWS } = await import('../js/games/jaywalk/victory.js').catch(() => ({}));
  const v = read('js/games/jaywalk/victory.js');
  assert.match(v, /A\.api\('profile', \{ action: 'table', b: BOARD \}\)/); assert.match(v, /SB\.m\.stripFor\(SB\.K, r, \{ friend: !r\.me \}\)/, 'slim cards — the one strip system');
  assert.match(v, /SB\.K\.liveList\(list, \{ label: 'jaywalk-table' \}\)/, 'THE LIVE LANE');
  if (tableRows) {
    assert.deepEqual(tableRows([{ v: 9, me: true }]), [], 'only you: no table');
    assert.deepEqual(tableRows([]), []);
    const rows = [{ v: 90, n: 'A' }, { v: 80, n: 'B' }, { v: 70, n: 'C' }, { v: 60, n: 'D' }, { v: 50, n: 'E' }, { v: 4, n: 'ME', me: true }];
    const t = tableRows(rows);
    assert.equal(t.length, TABLE_ROWS); assert.deepEqual(t.map(r => [r.n, r.place]), [['A', 1], ['B', 2], ['C', 3], ['ME', 6]], 'the top + YOU with your real place');
    assert.deepEqual(tableRows([{ v: 9, me: true }, { v: 3, n: 'A' }]).map(r => r.place), [1, 2]);
  }
  const fr = read('api/_lib/friends.js');
  assert.match(fr, /const pids = \[pid, \.\.\.tablePids\(await node\(pid\), pid, null, now\)\];/, 'the server reads YOUR OWN friends list — never ids from the phone');
  assert.match(fr, /if \(!def \|\| def\.kind !== 'record'\) fail\(400, 'bad_board'\);/);
  assert.match(read('api/profile.js'), /case 'table': return boardTable\(await mine\(uid\), body\.b, now\);/);
});
