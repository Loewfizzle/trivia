// FREEFALL F4A — THE HIDDEN CARTRIDGE + THE JUDGE ON THE SERVER + THE SWITCH + THE BOARD (+ AVG) + THE CARDS (docs/freefall.md): the unit
// half. The proof itself: tests/freefall-proof.test.mjs. The browser + emulator halves: tests/integration/e2e-freefall.mjs ·
// rules.test.mjs "the ff proof node" · server.test.mjs "FREEFALL F4A".
// (THE UNIT JOB INSTALLS NOTHING: api/_lib/freefall.js is PURE — never fb.js; api/report.js + stats.js are read as TEXT here.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { GAMES, isPlayable, isOwnerTest, setOwnerPhone, FROZEN_IDS } from '../js/config.js';
import * as META from '../js/games/freefall/meta.js';
import { createGame, nextStep, nextRun, scoreNode, endNow } from '../js/games/freefall/director.js';
import { finalCount, packRange, START_LEAD_MS, CLOCK } from '../js/games/freefall/proof.js';
import { seedOf, gameStandings, modeOf } from '../js/games/freefall/logic.js';
import { makeBot, playBot } from '../js/games/freefall/bot.js';
import { createRun, stepTo, turn, isOver, resultOf, logOf } from '../js/games/freefall/engine.js';
import { TICK_HZ, HARBOR_FLOOR, BOTTOM_FLOOR, TERMINAL_RUN } from '../js/games/freefall/tuning.js';
import { BOARD, SRV_BEST_KEY, wouldLine, bestAvgLine } from '../js/games/freefall/lines.js';
import { FREEFALL_COUNTS, freefallSolo, freefallMatch, verifyRun, serverRow } from '../api/_lib/freefall.js';
import { extractMatch, SOLO_OK, QUICK_SOLO, REPORT_GAMES, FF_FEATS, unreportable } from '../js/core/match-report.js';
import { boardDef, fmtValue, GAME_BOARDS } from '../js/core/boards.js';
import { avgOf, avgLabel } from '../js/core/board-avg.js';
import { matchStep } from '../js/core/progress.js';
import { VERIFIED_SOLO } from '../js/core/proof.js';
import { PROOF_NODE_LIST, NEW_PLAYER_NODES, LOCKED_PROOF_NODES, GAME_IDS, META as ROWS } from '../js/games/registry.js';
import { FF_SPECS, FF_AW, FF_AH } from '../js/fx/ff-specs.js';
import '../api/_lib/catalog.js';   // (the server-only catalog registers the names, the rewards + the achievements)
import { ACH } from '../js/core/achievements.js';
import { ITEM } from '../js/core/items.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const CODE = 'MOON', M = 'sabc123', GO = 1_800_000_000_000, MS = 1000 / TICK_HZ;
/** an HONEST proof node from a finished run's own log: the final events sent every 15 ticks, each arriving `lag` ms after its tick */
function nodeOf(log, { seed, mode = 'solo', go = GO, lag = 120 } = {}) {
  const run = createRun({ seed, mode }), c = {};
  let sent = 0, i = 0, k = 0;
  const flush = T => { const n = finalCount(run); if (n > sent) { c[k++] = { s: packRange(run, sent, n), at: Math.round(go + START_LEAD_MS + T * MS + lag) }; sent = n; } };
  for (let T = 0; T < 200000 && !isOver(run); T++) {
    while (i < log.length && log[i].t === T) { const e = log[i++]; turn(run, T, ((e.a - run.a + 6144) % 4096) - 2048); }
    stepTo(run, T);
    if (T % 15 === 0) flush(T);
  }
  flush(run.end);
  return { node: { go, c, e: { f: run.floor, t: run.at, w: run.cause } }, run };
}
/** a run on the seed a room's GO picks: a bot's own run on that seed → its log → its node */
function proven(id, { maxFloor = 400 } = {}) {
  const seed = seedOf(CODE, M, GO), run = createRun({ seed, mode: 'solo' });
  playBot(run, makeBot(id, seed), { maxFloor });
  if (!isOver(run)) stepTo(run, 200000);
  return { ...nodeOf(logOf(run), { seed }), seed, live: resultOf(run) };
}
/** a PERFECT hand (a script that reads the tower): every floor's gap, tick after tick — for the feats that need depth */
function perfect(floors) {
  const seed = seedOf(CODE, M, GO), run = createRun({ seed, mode: 'solo' });
  playBot(run, makeBot('great', seed), { maxFloor: floors });
  if (!isOver(run)) stepTo(run, 200000);
  return { ...nodeOf(logOf(run), { seed }), seed, live: resultOf(run) };
}

test('REGISTERED — HIDDEN: a `preview` GAMES row (never playable, never frozen, the owner\'s live test only); its row in THE ONE META MODULE; the loader; its proof node in every list; solo only', async () => {
  const g = GAMES.find(x => x.id === 'freefall');
  assert.ok(g && g.playable === false && g.preview === true && g.name === 'FREEFALL' && g.theme === 'freefall' && g.tag && g.blurb && !g.live);
  assert.equal(isPlayable('freefall'), false); assert.equal(isOwnerTest('freefall'), false); assert.ok(!FROZEN_IDS.includes('freefall'));
  setOwnerPhone(true);
  try { assert.equal(isOwnerTest('freefall'), true, 'the owner\'s phone: his to test'); assert.equal(isPlayable('freefall'), true); } finally { setOwnerPhone(false); }
  assert.equal(isPlayable('freefall'), false, 'nobody else');
  assert.ok(GAME_IDS.includes('freefall') && ROWS.freefall && ROWS.freefall.SOLO === true && ROWS.freefall.BANNER_NAME === 'FREEFALL');
  assert.equal(META.SOLO, true); assert.deepEqual(META.OPTIONS, []); assert.deepEqual(META.cleanSettings({ x: 1 }), {}); assert.deepEqual(META.LOOKS, ['day', 'night']);
  assert.equal(ROWS.freefall.CONTROLLER, undefined, 'no controller mark: a drag game');
  for (const [name, list] of [['PROOF_NODE_LIST', PROOF_NODE_LIST], ['NEW_PLAYER_NODES', NEW_PLAYER_NODES], ['LOCKED_PROOF_NODES', LOCKED_PROOF_NODES]]) assert.ok(list.includes('ff'), `ff in ${name}`);
  assert.ok(VERIFIED_SOLO.includes('freefall') && SOLO_OK.freefall === true && QUICK_SOLO.freefall === true && REPORT_GAMES.includes('freefall'));
  const idx = read('js/games/freefall/index.js');
  assert.match(idx, /export const livePaths = g => \(\{ runs: `ff\/\$\{g\.matchId\}` \}\);/);
  assert.match(idx, /if \(Object\.keys\(participants \|\| \{\}\)\.length !== 1\) return null;/, 'F4A: a room of two or more can not start it (THE MATCH is F4B)');
  assert.match(idx, /lazyView\(\(\) => lazyImport\(import\('\.\/view\.js'\), '\.\/view\.js'\), \['kit', 'freefall-play'\]/, 'the SAME stage + sheet as the test page');
  assert.match(idx, /export const soloAgain = /); assert.match(idx, /export \{ finalScene \} from '\.\/final\.js';/);
  assert.doesNotMatch(read('js/config.js'), /id: 'freefall'[^\n]*playable: true/, 'NEVER playable before its go-live pass');
});

test('THE DIRECTOR (PURE): `play` from the start; the player\'s `e` → `final` with THE JUDGE\'s own row (never the phone\'s numbers); PLAY AGAIN = the next run, a match of its own', () => {
  const P = proven('good'), game = createGame({ matchId: M, settings: { junk: 1 }, participants: { u1: true }, now: GO, seed: 'stand-in' });
  assert.deepEqual([game.id, game.phase, game.mode, game.settings], ['freefall', 'play', 'solo', {}]);
  assert.equal(modeOf({ a: 1, b: 1 }), 'match');
  assert.equal(nextStep(game, { now: GO + 1, live: { runs: {} }, code: CODE }), null, 'no end yet: the run plays');
  const noE = { ...P.node }; delete noE.e;
  assert.equal(nextStep(game, { now: GO + 1, live: { runs: { u1: noE } }, code: CODE }), null, 'chunks alone are no end');
  const patch = nextStep(game, { now: GO + 9000, live: { runs: { u1: P.node } }, code: CODE });
  assert.equal(patch.phase, 'final');
  const r = patch.results.u1;
  assert.deepEqual([r.f, r.t, r.w, r.e], [P.live.floor, P.live.tick, P.live.cause, P.live.end], 'the row = the judge\'s replay of the node');
  assert.deepEqual([r.b, r.bl, r.br], [P.live.bounces, P.live.blazes, P.live.bestRun]);
  // a node that CLAIMS more than it played: the `e` is a signal — the claimed floor is never read
  const liar = { ...P.node, e: { f: 999, t: 1, w: 'made' } };
  assert.equal(nextStep(game, { now: GO + 9000, live: { runs: { u1: liar } }, code: CODE }).results.u1.f, P.live.floor);
  assert.deepEqual(scoreNode(CODE, M, null), { f: 0, t: 0, w: '', e: -1 });
  assert.equal(scoreNode(CODE, M, { go: GO, c: { 0: { s: 'junk', at: GO + 700 } } }).bad, 'chunks');
  assert.equal(endNow(game, { now: GO + 5, live: { runs: {} }, code: CODE }).phase, 'final', 'the host\'s END GAME');
  // AN UNPROVEN RUN's MATCH ENDS TOO (the review): the host's mark `x/{uid}` closes a SOLO match with no node — floor 0, never counted
  const marked = nextStep({ ...game, x: { u1: 1 } }, { now: GO + 7000, live: { runs: {} }, code: CODE });
  assert.deepEqual([marked.phase, marked.results.u1], ['final', { f: 0, t: 0, w: '', e: -1 }], 'the mark ends it; the row is the judge\'s of a node that is not there');
  assert.equal(nextStep({ ...game, x: { other: 1 } }, { now: GO + 7000, live: { runs: {} }, code: CODE }), null, 'only the run\'s own mark');
  assert.equal(nextStep({ ...game, mode: 'match', participants: { u1: true, u2: true }, x: { u1: 1, u2: 1 } }, { now: GO + 7000, live: { runs: {} }, code: CODE }), null, 'never in a match (F4B): a mark ends nobody\'s run there');
  const fin = { ...game, ...patch }, next = nextRun(fin, { matchId: 'snext1', now: GO + 20000 });
  assert.deepEqual([next.matchId, next.phase, next.mode, Object.keys(next.participants)], ['snext1', 'play', 'solo', ['u1']]);
  assert.equal(nextRun(game, { matchId: 'x', now: 1 }), null, 'only after a finished solo run');
  assert.deepEqual(gameStandings(fin).map(x => [x.uid, x.rank, x.score]), [['u1', 1, P.live.floor]]);
});

test('THE JUDGE ON THE SERVER: a SOLO run counted ONLY from the server\'s replay of the proof node (`sv`) — the row, the record on freefall-solo, the feats, THE AVERAGE\'s value; a refused node earns nothing; the match is a stub (F4B)', () => {
  const P = proven('good'), S = freefallSolo({ code: CODE, matchId: M, uid: 'u1', node: P.node });
  assert.equal(S.v.ok, true, S.v.why);
  assert.deepEqual([S.game.id, S.game.sv, S.game.mode, S.game.phase], ['freefall', 1, 'solo', 'final']);
  assert.equal(S.game.results.u1.f, P.live.floor); assert.equal(verifyRun({ code: CODE, matchId: M, node: P.node }).floor, P.live.floor);
  assert.equal(unreportable(S.game), null);
  const ex = extractMatch(S.game);
  assert.equal(ex.solo, true); assert.deepEqual(ex.rejected, []);
  assert.equal(ex.rows.u1.rec[BOARD], P.live.floor, 'the solo lane: its record on the board freefall-solo');
  assert.deepEqual(ex.rows.u1.av, { [BOARD]: P.live.floor }, 'THE AVERAGE: a SOLO run\'s floors');
  assert.equal(ex.rows.u1.win, false);
  // another room's code = another seed: the same node is another run (or refused) — never this floor from a copied log
  const other = freefallSolo({ code: 'ZZZZ', matchId: M, uid: 'u1', node: P.node });
  assert.ok(!other.v.ok || other.v.floor !== P.live.floor || other.v.tick !== P.live.tick);
  // refused: a forged chunk → named, nothing earned
  const forged = structuredClone(P.node); forged.c[0].s = '+4s';
  const F = freefallSolo({ code: CODE, matchId: M, uid: 'u1', node: forged }), exF = extractMatch(F.game);
  assert.equal(F.v.ok, false); assert.equal(F.game.results.u1.f, 0); assert.ok(F.game.results.u1.bad);
  assert.deepEqual(exF.rejected.map(x => x.board), [BOARD]); assert.deepEqual(exF.rows.u1.rec, {}); assert.equal(exF.rows.u1.av, undefined);
  // no GO = no run; an EMPTY log = floor 0: never a counted play (match-report.js#SOLO_PLAYED → the step skips it)
  assert.equal(freefallSolo({ code: CODE, matchId: M, uid: 'u1', node: null }).v.why, 'no go');
  const none = extractMatch(freefallSolo({ code: CODE, matchId: M, uid: 'u1', node: { go: GO } }).game);
  assert.equal(matchStep(null, { key: 'k', gid: 'freefall', row: none.rows.u1, n: 1, now: GO, at: GO, gap: 0 }).skip, 'empty');
  // a room's own results are never read: without `sv` the extract gives no record, no feat
  const hosts = extractMatch({ id: 'freefall', matchId: M, phase: 'final', mode: 'solo', participants: { u1: true }, settings: {}, results: { u1: { f: 300, t: 9, w: 'made', ft: 'reachedHarbor terminal reachedBottom' } } });
  assert.deepEqual(hosts.rows.u1.rec, {}); assert.equal(hosts.rows.u1.f, undefined);
  assert.deepEqual(freefallMatch({ code: CODE, matchId: M, uids: ['a', 'b'], nodes: {} }), { game: null, why: 'the match is not built yet' });
  assert.deepEqual(serverRow({ ok: false, why: 'spin' }), { f: 0, t: 0, w: '', e: -1, bad: 'spin' });
});

test('THE SWITCH — OFF (the owner: nothing counts until go-live): /api/report judges, answers WOULD COUNT before any claim / credit, writes nothing; the emulators\' own flip; the would-be line', () => {
  assert.equal(FREEFALL_COUNTS, false, 'OFF — the go-live pass flips this ONE line');
  const rep = code('api/report.js');
  assert.ok(rep.includes("export const freefallCounts = async () => { if (emulated()) { const t = await val('testFreefallCounts'); if (t === true || t === false) return t; } return FREEFALL_COUNTS; };"), 'the test flip is honoured on the emulators only');
  assert.match(rep, /export const SWITCHED = Object\.freeze\(Object\.assign\(Object\.create\(null\), \{/, 'the switch table has no inherited key');
  assert.match(rep, /\.\.\.\(SW === SWITCHED\.highrise \? \{ perfects: /, 'FREEFALL\'s would-award carries no `perfects` (HIGH RISE\'s)');
  assert.match(rep, /freefall: Object\.freeze\(\{ counts: freefallCounts, board: 'freefall-solo', cards: Object\.freeze\(\[\['splashdown', 'harbor'\], \['terminal-velocity', 'terminal'\], \['rock-bottom', 'bottom'\]\]\) \}\),/);
  const ask = rep.indexOf('const hrOff = !!SWITCHED[night.g] && !(await SWITCHED[night.g].counts());'), sw = rep.indexOf('if (hrOff && SWITCHED[ex.gid]) {'), cr = rep.indexOf('return credit({ key, uid, myPid, ex, pids, now, room: { code, meta, win }, at, src });');
  assert.ok(ask > 0 && sw > ask && cr > sw, 'asked once, early; judged; the switch; then (only when ON) credit()');
  assert.doesNotMatch(rep.slice(sw, cr), /\.set\(|\.update\(|\.transaction\(|credit\(|applyMatch\(|bumpPlayed\(/, 'the OFF branch writes nothing');
  assert.equal((rep.slice(0, ask).match(/\.set\(|\.update\(|\.transaction\(/g) || []).length, 0, 'nothing is written before the switch is asked');
  // the would-be line (lines.js — what the owner's phone shows)
  assert.equal(wouldLine({ floor: 85, xp: 12, best: true, cards: ['harbor'], cause: 'red' }), 'WOULD COUNT · FLOOR 85 · +12 XP · NEW BEST · 1 CARD');
  assert.equal(wouldLine({ floor: 212, xp: 0, cap: 1, cards: ['harbor', 'terminal', 'bottom'] }), 'WOULD COUNT · FLOOR 212 · +0 XP · DAILY CAP · 3 CARDS');
  assert.equal(wouldLine({ floor: 40, xp: 8, cut: 1 }), 'WOULD COUNT · FLOOR 40 · +8 XP · CUT SHORT');
  assert.equal(wouldLine({ floor: 0, skip: 'refused (spin)' }), 'WOULD NOT COUNT · REFUSED (SPIN)');
  assert.equal(wouldLine(null), '');
  assert.equal(SRV_BEST_KEY, 'ff:best');
  // the end screen's body reads the server's answer; the stage's own page never does
  const fin = read('js/games/freefall/final.js');
  assert.match(fin, /if \(o\.would\) \{ would\.textContent = wouldLine\(o\.would\);/);
  assert.doesNotMatch(read('js/games/freefall/stage.js') + read('js/games/freefall/play.js'), /profile\/queue|wouldLine/);
});

test('ON (the pure step — what credit() runs once the switch is flipped): the floor, XP, the streak, the best on freefall-solo, THE AVERAGE, and THE THREE CARDS from the server\'s feats — SPLASHDOWN 120 · TERMINAL VELOCITY 15 · ROCK BOTTOM 200', () => {
  assert.deepEqual([HARBOR_FLOOR, TERMINAL_RUN, BOTTOM_FLOOR], [120, 15, 200]);
  assert.deepEqual(FF_FEATS, { reachedHarbor: 'harbor', terminal: 'terminal', reachedBottom: 'bottom' });
  // a deep run by the great bot: past THE BOTTOM on some seed — find one in a few tries (the judge's own floors decide)
  let deep = null;
  for (let k = 0; k < 40 && !deep; k++) {
    const seed = `ffc-deep-${k}`, run = createRun({ seed, mode: 'solo' });
    playBot(run, makeBot('great', seed), { maxFloor: 260 });
    if (!isOver(run)) stepTo(run, 200000);
    if (run.floor >= 201) deep = { seed, log: logOf(run), live: resultOf(run) };
  }
  assert.ok(deep, 'a great bot reaches THE BOTTOM on one of 40 seeds');
  // (the run as a node on ITS OWN seed: the report's path picks the seed from the GO — here the judge is asked by seed: api/_lib's judgeRun == proof)
  const N = nodeOf(deep.log, { seed: deep.seed });
  const row = { ...serverRow({ ok: true, floor: deep.live.floor, tick: deep.live.tick, cause: deep.live.cause, end: deep.live.end, feats: deep.live.feats }) };
  assert.equal(N.run.floor, deep.live.floor);
  assert.ok(/reachedHarbor/.test(row.ft) && /reachedBottom/.test(row.ft), `the feats of a run to floor ${deep.live.floor}: ${row.ft}`);
  const game = { id: 'freefall', matchId: M, phase: 'final', mode: 'solo', sv: 1, participants: { u1: true }, settings: {}, results: { u1: { ...row, ft: 'reachedHarbor terminal reachedBottom' } } };
  const ex = extractMatch(game);
  assert.deepEqual(ex.rows.u1.f, { harbor: 1, terminal: 1, bottom: 1 });
  const res = matchStep(null, { key: `${CODE}_${M}`, gid: 'freefall', row: ex.rows.u1, n: 1, now: GO + 400000, at: GO + 400000, gap: 0 });
  assert.ok(!res.skip && res.xp.total > 0, `XP +${res.xp && res.xp.total}`);
  assert.ok(res.next.st && res.next.st.n === 1, 'the streak day');
  assert.equal(res.next.b[BOARD].a, deep.live.floor, 'the best on the board freefall-solo');
  assert.ok(res.next.pa.gf['freefall-harbor'] === 1 && res.next.pa.gf['freefall-terminal'] === 1 && res.next.pa.gf['freefall-bottom'] === 1, 'the flags');
  for (const [card, ach] of [['card-splashdown', 'splashdown'], ['card-terminalvelocity', 'terminal-velocity'], ['card-rockbottom', 'rock-bottom']]) assert.ok(res.next.it[card] && res.next.ac[ach], `${card} awarded by the step`);
  // only the feat a run really has: floor 130 without a 15-run → SPLASHDOWN alone
  const g2 = { ...game, results: { u1: { f: 130, t: 5000, w: 'red', e: 5100, ft: 'reachedHarbor' } } };
  const r2 = matchStep(null, { key: 'k2', gid: 'freefall', row: extractMatch(g2).rows.u1, n: 1, now: GO + 400000, at: GO + 400000, gap: 0 });
  assert.ok(r2.next.it['card-splashdown'] && !r2.next.it['card-terminalvelocity'] && !r2.next.it['card-rockbottom']);
  // … and an unknown feat word is nothing ('constructor' never a flag)
  const g3 = { ...game, results: { u1: { f: 30, t: 900, w: 'red', e: 950, ft: 'constructor toString reachedTop' } } };
  assert.equal(extractMatch(g3).rows.u1.f, undefined);
  // the catalog: tiers, the feat checks — never from a number
  assert.deepEqual([ITEM['card-splashdown'].tier, ITEM['card-terminalvelocity'].tier, ITEM['card-rockbottom'].tier], ['rare', 'epic', 'legendary']);
  const [a, b, c] = [ACH.splashdown, ACH['terminal-velocity'], ACH['rock-bottom']];
  assert.ok(a.item === 'card-splashdown' && b.item === 'card-terminalvelocity' && c.item === 'card-rockbottom' && [a, b, c].every(x => x.game === 'freefall'));
  assert.equal(a.check({}, { gf: { 'freefall-harbor': 1 } }), true); assert.equal(a.check({ b: { [BOARD]: { a: 500 } } }, {}), false, 'never from the board\'s number — the flag only');
  assert.equal(b.check({}, { gf: { 'freefall-terminal': 1 } }), true); assert.equal(b.check({}, { gf: { 'freefall-harbor': 1 } }), false);
  assert.equal(c.check({}, { gf: { 'freefall-bottom': 1 } }), true); assert.equal(c.check({}, { gf: { 'highrise-top': 1 } }), false);
});

test('THE BOARD + THE AVERAGE (the owner: "like JAYWALK, in all the same spots"): freefall-solo = DEEPEST RUN · FLOORS, avg { days: 14, min: 5 } — counted SOLO runs only, a dash under 5 runs, the ranking stays BEST; the tab wired + HIDDEN', () => {
  const def = boardDef(BOARD);
  assert.deepEqual([def.label, def.short, def.fmt, def.kind, def.avg], ['DEEPEST RUN', 'FLOORS', 'int', 'record', { days: 14, min: 5 }]);
  assert.deepEqual(GAME_BOARDS.freefall.records.map(r => r.id), [BOARD]); assert.deepEqual(boardDef('jaywalk-solo').avg, def.avg, 'JAYWALK\'s own numbers');
  assert.equal(fmtValue(def, 141), '141');
  // five counted SOLO runs (the server's `sv` rows) over two days → the average shows; four → a dash
  const row = f => extractMatch({ id: 'freefall', matchId: M, phase: 'final', mode: 'solo', sv: 1, participants: { u1: true }, settings: {}, results: { u1: { f, t: f * 40, w: 'red', e: f * 40 + 30 } } }).rows.u1;
  let s = null;
  const floors = [40, 60, 100, 20, 80];
  floors.forEach((f, i) => { const r = matchStep(s, { key: `k${i}`, gid: 'freefall', row: row(f), n: 1, now: GO + i * 600_000 + (i >= 3 ? 86_400_000 : 0), at: GO + i * 600_000 + (i >= 3 ? 86_400_000 : 0), gap: 0 }); assert.ok(!r.skip, `run ${i}: ${r.skip}`); s = r.next; if (i === 3) assert.equal(avgOf(s.av[BOARD]).avg, null, 'four runs: no average yet'); });
  const A = avgOf(s.av[BOARD]);
  assert.deepEqual([A.avg, A.runs, A.days], [60, 5, 2], 'the average of five runs: (40 + 60 + 100 + 20 + 80) / 5');
  assert.equal(s.b[BOARD].a, 100, 'the ranking value stays the BEST');
  assert.equal(avgLabel(A.avg), 'AVG 60'); assert.equal(avgLabel(null), 'AVG —');
  // a floor-0 solo run (an empty log) never counts — not into the average either
  assert.equal(matchStep(s, { key: 'k9', gid: 'freefall', row: row(0), n: 1, now: GO + 90_000_000, at: GO + 90_000_000, gap: 0 }).skip, 'empty');
  // the end card's line, wired for F4B
  assert.equal(bestAvgLine(141, 62), 'YOUR BEST · 141 · AVG 62'); assert.equal(bestAvgLine(141, null), 'YOUR BEST · 141 · AVG —'); assert.equal(bestAvgLine(0, 5), '');
  // THE BOARD's tab: wired, hidden (the owner's phone only), never in TABS before the go-live
  const bv = read('js/board/view.js');
  assert.match(bv, /export const HIDDEN_TABS = Object\.freeze\(\['freefall'\]\);/);
  assert.match(bv, /export const TABS = Object\.freeze\(\['xp', 'dailies', 'overclock', 'prism', 'holdem', 'jaywalk', 'highrise'\]\);/, 'not a public tab');
  assert.match(bv, /freefall: \['#27e0e6', '#ff4fa8'\]/);
});

test('THE CARDS\' ART: three WebPs, 1280 × 720, small; the crops in ONE place (ff-specs.js = the CSS); the slim card\'s face to the RIGHT (0.75 – 0.85), the left dark; THE LAB 231 – 236; raw masters never in git', async () => {
  assert.deepEqual(Object.keys(FF_SPECS), ['card-splashdown', 'card-terminalvelocity', 'card-rockbottom']); assert.deepEqual([FF_AW, FF_AH], [1280, 720]);
  const css = read('css/vault.css'), lab = read('js/vault/catalog.js'), text = read('api/_lib/lab-text.js'), strip = read('js/vault/strip.js');
  const { HERO, heroMisses } = await import('../js/vault/hero.js');
  assert.deepEqual(heroMisses(), []);
  for (const [id, S] of Object.entries(FF_SPECS)) {
    const k = id.slice(5), f = `assets/vault/ff/${S.art}.webp`;
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), f);
    const size = statSync(new URL(`../${f}`, import.meta.url)).size;
    assert.ok(size > 20_000 && size < 120_000, `${f}: ${size} bytes`);
    assert.ok(css.includes(`.vl-s-ff-${k} .vl-mat { background: ${S.ground} url('../assets/vault/ff/${S.art}.webp') ${S.strip[0]}% ${S.strip[1]}% / ${S.strip[2] * 100}% auto no-repeat; }`), `${id}: the strip's CSS crop = the spec's`);
    assert.ok(css.includes(`.vl-fcm-ff-${k} .vl-mat`) && css.includes(`${S.ground} url('../assets/vault/ff/${S.art}.webp') ${S.full[0]}% ${S.full[1]}% / ${S.full[2] * 100}% auto no-repeat; }`), `${id}: the full card's`);
    assert.ok(strip.includes(`'${id}': { mat: 'ff-${k}' },`), `${id}: its material`);
    const cx = HERO[id][0][0] + HERO[id][0][2] / 2;
    assert.ok(cx >= 0.75 && cx <= 0.85, `${id}: its hero ${cx.toFixed(3)} across the strip (the face to the RIGHT)`);
    for (const x of [id, `full-${id}`]) { assert.ok(lab.includes(`{ id: '${x}',`), `${x}: in THE LAB`); assert.ok(text.includes(`"${x}"`), `${x}: its lab text`); }
  }
  assert.match(lab, /\{ id: 'card-splashdown', kind: 'card', tier: 'rare', n: 231 \},\n  \{ id: 'card-terminalvelocity', kind: 'card', tier: 'epic', n: 232 \},\n  \{ id: 'card-rockbottom', kind: 'card', tier: 'legendary', n: 233 \},/);
  // RAW ART OFF GIT: the builder reads the masters outside the repo; no PNG master in art/
  const b = read('scripts/build-freefall-cards.mjs');
  assert.match(b, /import \{ ART_SRC \} from '\.\/art-src\.mjs';/); assert.match(b, /'terminal-velocity': 'terminal-velocity-v1\.png'/, 'the ORANGE fire one — never terminal-velocity.png');
  assert.ok(!existsSync(new URL('../art/freefall-cards', import.meta.url)), 'no masters in the repo');
});

test('THE CARTRIDGE\'s SCREEN (static): GO behind THE STAMP → the seed + tick 0 on the server\'s clock; the kit\'s proof-writer on FINAL events only; a hold\'s way back stamped; UNPROVEN says so; the stage writes nothing itself', () => {
  const v = read('js/games/freefall/view.js'), st = read('js/games/freefall/stage.js');
  assert.match(v, /return stampT0\(treePath\(\), 'freefall'\)\.then\(\(\) => \(stale\(\) \? Promise\.reject\(new Error\('the run stopped waiting'\)\) : dbSet\(dbRef\(path\), serverTimestamp\(\)\)\)\);/, 'THE STAMP, then the GO — the server\'s time');
  assert.match(v, /fin\(\{ seed: seedOf\(code, matchId, go\), t0: perfOf\(go \+ START_LEAD_MS\), note: '' \}\);/, 'the seed from the GO read back; tick 0 = GO + the lead');
  assert.match(v, /if \(r\.c \|\| serverNow\(\) - r\.go > START_LATE_MS\) \{ unproven\(r\.c \? 'again' : 'late'\); return; \}/, 'a GO answered too late starts no proven run');
  assert.match(v, /count: \(\) => \{ if \(!S \|\| !proven\) return 0; const n = finalCount\(S\.run\(\)\); return capN >= 0 && n > capN \? capN : n; \}, pack: \(a, b\) => packRange\(S\.run\(\), a, b\), entriesOf: eventsOf,/, 'the writer sends FINAL events only — and nothing past a hold that got no stamp (the review)');
  assert.match(v, /if \(capN < 0\) capN = finalCount\(S\.run\(\)\);/, 'the cap = the log through that hold');
  assert.match(v, /dbSet\(dbRef\(`rooms\/\$\{code\}\/game\/x\/\$\{uid\}`\), 1\)/, 'PLAY AGAIN on the stage\'s own card: the host marks the unproven run ended …');
  assert.match(v, /return finalSoon\(\)\.then\(ok => \(ok \? instant\(\) : false\)\)/, '… and THE INSTANT AGAIN starts a NEW match (its own GO) — never stuck uncounted (the review)');
  assert.match(v, /!final && !againing && \(!started \|\| S\.state\(\)\.shown\)\) showFinal\(g\);/, '… the podium never flashes in between');
  assert.match(v, /flushMs: \(\) => CLOCK\.flushMs/); assert.equal(CLOCK.flushMs, 250, 'chunked every 250 ms (the owner: ~200–250 ms)');
  assert.match(v, /dbSet\(dbRef\(path\), serverTimestamp\(\)\)\.then\(\(\) => dbGet\(dbRef\(path\)\)\)/, 'a hold\'s way back: the SERVER\'s stamp, read back');
  assert.match(v, /if \(!proven\) return \{ own: true, note: notCounted\(whyNot\) \};/, 'an UNPROVEN run ends on the stage\'s own card');
  assert.match(v, /NOT COUNTED — NO LINE TO THE BOARD/); assert.match(v, /NOT COUNTED — NO CONNECTION/);
  assert.match(v, /if \(had\) \{ S = had; S\.moveTo\(el\);/, 'PLAY AGAIN: the scene kept warm');
  // the stage: its hooks, nothing of its own written
  assert.doesNotMatch(st, /firebase|dbSet|serverTimestamp|profile\/|\/api\//, 'the stage never writes: the view\'s hooks do');
  assert.match(st, /Promise\.all\(\[Promise\.resolve\(\)\.then\(\(\) => o\.go\(\)\), wait\]\)/, 'the cartridge\'s start: the GO + the sounds\' decode');
  assert.match(st, /if \(left <= 0 && o\.resume && !stamped && countTries < RESUME_TRIES\) startCount\(\);/, 'no stamp: the count runs again (3 tries)');
  assert.match(st, /if \(T < 0\) \{ owed \+= units;/, 'a move before tick 0 is kept');
  assert.match(st, /if \(c !== countShown && \(c < countShown \|\| !countShown\)\) countLine\(c\);/, 'the 3 · 2 · 1 never jumps back up when the stamp\'s answer is slow (the review)');
  assert.match(st, /o\.onLeave \? null : share, city/, 'the cartridge\'s own card: no SHARE · SOON');
  assert.match(st, /const E = o\.onEnd \? o\.onEnd\(res\) \|\| \{ own: true \} : \{ own: true \};/);
  assert.match(read('css/freefall-play.css'), /\.ff-stage\.ff-game \{ position: fixed; inset: 0; margin: 0 auto; height: 100dvh; \}/, 'the stage fills the window inside the console\'s frame');
});
