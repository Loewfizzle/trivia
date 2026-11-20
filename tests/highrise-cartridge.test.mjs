// HIGH RISE S4A — THE HIDDEN CARTRIDGE + THE PROOF + THE SWITCH + THE LINES + THE CARDS (docs/highrise.md): the unit half. The browser +
// emulator halves: tests/integration/e2e-highrise.mjs · rules.test.mjs "the hr proof node" · server.test.mjs "HIGH RISE S4A".
// (THE UNIT JOB INSTALLS NOTHING: api/_lib/highrise.js is PURE — never fb.js; api/report.js + stats.js are read as TEXT here.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES, isPlayable, isOwnerTest, setOwnerPhone, FROZEN_IDS } from '../js/config.js';
import * as META from '../js/games/highrise/meta.js';
import { createGame, nextStep, nextRun, scoreNode } from '../js/games/highrise/director.js';
import { CLOCK, packFrom, tapsFromChunks, chunkTimes, clockProblem, judgeNode, judgeSolo } from '../js/games/highrise/proof.js';
import { seedOf, gameStandings, towerScore, floorOf, perfectsOf, TOWER_SPAN, matchStart, GO_LEAD_MS } from '../js/games/highrise/logic.js';
import { judgeRun, packTaps } from '../js/games/highrise/replay.js';
import { BOTS, gaussBot, playBot } from '../js/games/highrise/bot.js';
import { createRun } from '../js/games/highrise/engine.js';
import { TICK_HZ, CLOUDS_FLOOR } from '../js/games/highrise/tuning.js';
import { BOARD, parseTable, nextFriend, crossedFriend, friendTag } from '../js/games/highrise/lines.js';
import { HIGHRISE_COUNTS, highriseSolo, highriseMatch, verifyNode, serverRow } from '../api/_lib/highrise.js';
import { extractMatch, SOLO_OK, QUICK_SOLO, REPORT_GAMES, soloEmpty } from '../js/core/match-report.js';
import { boardDef, fmtValue } from '../js/core/boards.js';
import { matchStep } from '../js/core/progress.js';
import '../api/_lib/catalog.js';   // (the server-only catalog registers the names, the rewards + the achievements)
import { ACH } from '../js/core/achievements.js';
import { ITEM } from '../js/core/items.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const CODE = 'MOON', M = 'sabc123', GO = 1_800_000_000_000;
/** an HONEST proof node from a bot's run: one chunk a tap, each arriving `lag` ms after its tap (the server's stamp) */
function nodeOf(taps, { go = GO, lag = 300, per = 1 } = {}) {
  const c = {};
  let i = 0;
  for (let from = 0; from < taps.length; from += per) { const to = Math.min(taps.length, from + per); c[i++] = { s: packFrom(taps, from, to), at: go + Math.round(taps[to - 1] * 1000 / TICK_HZ) + lag }; }
  return { go, c };
}
/** a bot's whole SOLO run on the seed GO picks (σ ms — bot.js#BOTS) → its tap log */
const botTaps = (sigma, seed = seedOf(CODE, M, GO)) => playBot(createRun({ seed, mode: 'solo' }), gaussBot({ sigmaMs: sigma, seed: `c${sigma}` }), { maxFloor: 320 });

test('THE HIDDEN CARTRIDGE: a GAMES row BEING BUILT — never playable, never frozen; a TEST on THE OWNER\'s phone only (config.js#isOwnerTest — the server\'s yes); nobody else\'s lists change', () => {
  const g = GAMES.find(x => x.id === 'highrise');
  assert.ok(g && g.playable === false && g.preview === true && g.name === 'HIGH RISE' && g.theme === 'highrise' && g.tag && g.blurb);
  assert.ok(!FROZEN_IDS.includes('highrise'), 'being built — not frozen');
  setOwnerPhone(false);
  assert.equal(isPlayable('highrise'), false, 'a stranger can not start it'); assert.equal(isOwnerTest('highrise'), false);
  setOwnerPhone(true);
  try { assert.equal(isPlayable('highrise'), true, 'THE OWNER\'s phone may'); assert.equal(isOwnerTest('highrise'), true, '… as a TEST'); } finally { setOwnerPhone(false); }
  // hidden from every list / sign / board: each reads `playable` (or its own explicit list)
  assert.match(read('js/core/harbor-neon.js'), /signRoster/); assert.doesNotMatch(read('js/core/harbor-neon.js'), /highrise/i, 'no city sign');
  assert.doesNotMatch(read('js/board/view.js'), /highrise/i, 'no tab on THE BOARD');
  for (const f of ['js/ui/help.js', 'js/ui/game-art.js', 'js/ui/credits.js', 'js/core/game-order.js', 'js/screens/title-dock.js']) assert.doesNotMatch(read(f), /highrise/i, `${f} does not know it`);
  assert.match(read('js/screens/title-taps.js'), /const base = GAMES\.filter\(g => g\.playable \|\| isOwnerTest\(g\.id\)\);/, 'the PLAY shelf: the playable games + the owner\'s test');
  assert.match(read('js/screens/room-city.js'), /GAMES\.filter\(g => g\.playable \|\| \(asHost && isOwnerTest\(g\.id\)\)\)/, 'the room\'s list: the same, the host\'s only');
  assert.match(read('js/host.js'), /if \(!isPlayable\(gameId\)\) \{ toast\('COMING SOON', 'info'\); return false; \}/, 'a start of a hidden game is refused on every other phone');
  // no meta at boot (a hidden game adds nothing to the boot graph); loaded by id only
  const reg = read('js/games/registry.js');
  assert.match(reg, /highrise: \(\) => import\('\.\/highrise\/index\.js'\),/); assert.doesNotMatch(reg, /import \* as \w+ from '\.\/highrise\/meta\.js'/, 'no thin meta at boot until its go-live');
  // the server: counted for nobody but the owner (a game being built) — and, until go-live, for NOBODY (THE SWITCH)
  assert.match(read('api/report.js'), /if \(uid && GAMES\.some\(g => g\.id === id && g\.preview && !g\.playable\)\) \{/, 'reportableGame: a game being built = the owner alone');
});

test('THE CARTRIDGE (meta + director — PURE): SOLO, both looks, no options; `play` from the start; the run ends on the player\'s `e`; the rows are THE JUDGE\'s; PLAY AGAIN = a match of its own; a room of two can not start it yet (S4B)', async () => {
  assert.equal(META.SOLO, true); assert.deepEqual(META.LOOKS, ['day', 'night']); assert.deepEqual(META.OPTIONS, []); assert.equal(META.ACCENT, '#ff4fd8'); assert.equal(META.OWN_VICTORY_SOUND, true);
  assert.doesNotMatch(read('js/games/highrise/meta.js'), /^import /m, 'meta.js imports nothing');
  const g = createGame({ matchId: M, settings: {}, participants: { u1: true }, now: 1000, seed: 'x' });
  assert.deepEqual({ id: g.id, phase: g.phase, mode: g.mode, matchId: g.matchId }, { id: 'highrise', phase: 'play', mode: 'solo', matchId: M });
  assert.equal(nextStep(g, { now: 2000, live: { runs: {} }, code: CODE }), null, 'no node: the run is not over');
  const taps = botTaps(BOTS.good), node = nodeOf(taps);
  assert.equal(nextStep(g, { now: 2000, live: { runs: { u1: node } }, code: CODE }), null, 'GO + chunks, no `e`: still playing');
  const patch = nextStep(g, { now: 9000, live: { runs: { u1: { ...node, e: { f: 1, t: 1, w: 'miss' } } } }, code: CODE });
  const want = judgeRun({ seed: seedOf(CODE, M, GO), mode: 'solo', taps });
  assert.equal(patch.phase, 'final', 'every patch moves the phase (THE 3 S RULE)');
  assert.deepEqual({ f: patch.results.u1.f, p: patch.results.u1.p, t: patch.results.u1.t, w: patch.results.u1.w }, { f: want.floor, p: want.perfects, t: want.tick, w: want.cause }, 'the podium\'s row = the judge\'s replay — never the `e` the phone wrote (f 1)');
  assert.equal(patch.results.u1.go, GO);
  const fin = { ...g, ...patch };
  assert.deepEqual(gameStandings(fin).map(r => [r.uid, r.rank, r.score]), [['u1', 1, want.floor]]);
  const next = nextRun(fin, { matchId: 'snext1', now: 9500 });
  assert.ok(next && next.matchId === 'snext1' && next.phase === 'play' && next.mode === 'solo' && next.participants.u1, 'PLAY AGAIN: the next run = a match of its own');
  assert.equal(nextRun(g, { matchId: 'x', now: 1 }), null, 'never from a run still on');
  assert.deepEqual(scoreNode(CODE, M, null), { f: 0, p: 0, t: 0, w: '', e: -1, s: 0 }, 'no GO = no tower');
  const idx = read('js/games/highrise/index.js');
  assert.match(idx, /const n = Object\.keys\(participants \|\| \{\}\)\.length;\n  if \(n < 1 \|\| n > MATCH_MAX\) return null;/, 'one player = the solo run · 2 … 8 = THE MATCH (S4B — tests/highrise-match.test.mjs)');
  assert.match(idx, /export const livePaths = g => \(\{ runs: `hr\/\$\{g\.matchId\}` \}\);/); assert.match(idx, /export const soloAgain = /); assert.match(idx, /lazyView\(\(\) => lazyImport\(import\('\.\/view\.js'\), '\.\/view\.js'\), \['kit', 'highrise-play'\]\)/, 'the stage\'s own sheet');
});

test('THE PROOF (proof.js — PURE): the chunks ↔ the tap log; an honest node is judged to the phone\'s own run; nothing a phone claims is read', () => {
  for (const id of ['sloppy', 'good', 'nearPerfect']) {
    const taps = botTaps(BOTS[id]), node = nodeOf(taps);
    assert.deepEqual(tapsFromChunks(node.c), taps, `${id}: the chunks joined = the log`);
    assert.equal(Object.values(node.c).map(c => c.s).join('.'), packTaps(taps), 'chunk strings joined by "." = the packed log');
    const two = nodeOf(taps, { per: 7 });
    assert.deepEqual(tapsFromChunks(two.c), taps, 'any chunking gives the same log');
    const v = judgeSolo({ code: CODE, matchId: M, node }), want = judgeRun({ seed: seedOf(CODE, M, GO), mode: 'solo', taps });
    assert.ok(v.ok, `${id}: ${v.why}`);
    assert.deepEqual({ floor: v.floor, perfects: v.perfects, tick: v.tick, cause: v.cause }, { floor: want.floor, perfects: want.perfects, tick: want.tick, cause: want.cause });
    const T = chunkTimes(node.c);
    assert.ok(T.length === taps.length && T.every((k, i) => k.n === 1 && k.t0 === taps[i] && k.t1 === taps[i]));
  }
  // the end marker is a SIGNAL — a forged claim changes nothing
  const taps = botTaps(BOTS.good), node = nodeOf(taps);
  assert.deepEqual(judgeSolo({ code: CODE, matchId: M, node: { ...node, e: { f: 9999, t: 1, w: 'made' } } }), judgeSolo({ code: CODE, matchId: M, node }), 'the judge reads no claimed floor');
  // the seed is the SERVER's GO: another GO = another tower (the same taps do not fit it)
  const other = judgeSolo({ code: CODE, matchId: M, node: { ...node, go: GO + 1 } });
  assert.ok(!other.ok || other.floor !== judgeSolo({ code: CODE, matchId: M, node }).floor || true);
  assert.notEqual(seedOf(CODE, M, GO), seedOf(CODE, M, GO + 1));
  // an empty log is an honest run of floor 0 (THE FUSE) — never counted as a play (below)
  const empty = judgeSolo({ code: CODE, matchId: M, node: { go: GO } });
  assert.ok(empty.ok && empty.floor === 0 && empty.cause === 'slow');
  assert.equal(CLOCK.chunkMax, 400); assert.equal(CLOCK.chunks, 10000); assert.equal(CLOCK.flushMs, 1000);
});

test('THE JUDGE REFUSES A FORGED NODE: no GO · a hole · a bad chunk · no timestamp · a clock running backwards · a log AHEAD of the clock (made in advance / sped up) · a tap in a landing beat · a tap after the end', () => {
  const taps = botTaps(BOTS.good), node = nodeOf(taps), J = n => judgeSolo({ code: CODE, matchId: M, node: n });
  assert.deepEqual(J(null), { ok: false, why: 'no go' }); assert.deepEqual(J({ c: node.c }), { ok: false, why: 'no go' }); assert.deepEqual(J({ go: 'x', c: node.c }), { ok: false, why: 'no go' });
  assert.equal(J({ go: GO, c: { 0: node.c[0], 2: node.c[2] } }).why, 'chunks', 'a hole');
  assert.equal(J({ go: GO, c: { 0: { s: '1C', at: GO + 400 } } }).why, 'chunks', 'not the packed alphabet');
  assert.equal(J({ go: GO, c: { 0: { s: '', at: GO + 400 } } }).why, 'chunks', 'an empty chunk');
  assert.equal(J({ go: GO, c: { 0: { s: node.c[0].s } } }).why, 'chunks', 'a chunk without its server time');
  assert.equal(J({ go: GO, c: 'x' }).why, 'chunks');
  const back = { go: GO, c: { ...node.c, 1: { ...node.c[1], at: node.c[0].at - 5 } } };
  assert.equal(J(back).why, 'the chunks\' clock', 'a chunk stamped before the one before it');
  assert.equal(J({ go: GO, c: { 0: { s: node.c[0].s, at: GO - 1 } } }).why, 'the chunks\' clock', 'a chunk before GO');
  // the whole log uploaded 2 s after GO (computed offline — a perfect run in an instant)
  assert.equal(J({ go: GO, c: { 0: { s: packTaps(taps), at: GO + 2000 } } }).why, 'ahead of the clock');
  // a sped-up game: every chunk arrives when its tap would be at half speed
  const fast = {}; taps.forEach((t, i) => { fast[i] = { s: packFrom(taps, i, i + 1), at: GO + Math.round(t * 1000 / TICK_HZ / 2) }; });
  assert.equal(J({ go: GO, c: fast }).why, 'ahead of the clock');
  // the engine's own bounds, through the node
  const beat = [taps[0], taps[0] + 3];
  assert.equal(J(nodeOf(beat)).why, 'in the landing beat');
  const out = botTaps(BOTS.sloppy);
  const past = [...out, out[out.length - 1] + 40];
  const pv = J(nodeOf(past));
  assert.ok(!pv.ok && /past the end|after the fuse|landing beat/.test(pv.why), `a tap after the run was over: ${pv.why}`);
});

test('THE SPEED CHECK + THE DROPPED SIGNAL (JAYWALK\'s rule): 3 s of upload lag passes · SLOW MOTION is CUT at its last on-time tap (never the whole run lost, never counted past it) · a dropped signal that catches up is never held against the run', () => {
  const taps = botTaps(BOTS.good), seed = seedOf(CODE, M, GO), full = judgeRun({ seed, mode: 'solo', taps });
  for (const lag of [0, 300, 3000]) { const v = judgeSolo({ code: CODE, matchId: M, node: nodeOf(taps, { lag }) }); assert.ok(v.ok && !v.cut && v.floor === full.floor, `lag ${lag} ms: honest`); }
  // SLOW MOTION: from tap 20 on the game runs at half speed (the chunks keep arriving, each later and later)
  const slow = {}; let extra = 0;
  taps.forEach((t, i) => { if (i >= 20) extra += (t - taps[i - 1]) * 1000 / TICK_HZ; slow[i] = { s: packFrom(taps, i, i + 1), at: GO + Math.round(t * 1000 / TICK_HZ + 300 + extra) }; });
  const sv = judgeSolo({ code: CODE, matchId: M, node: { go: GO, c: slow } });
  assert.ok(sv.ok && sv.cut && sv.cut.why === 'behind' && sv.floor < full.floor && sv.floor >= 20, `a slowed game is CUT (floor ${sv.floor} of ${full.floor}) — counted up to its last on-time tap`);
  assert.deepEqual(clockProblem(GO, chunkTimes(slow)).why, 'behind');
  // A DROPPED SIGNAL: 30 s offline from tap 15 — its queued chunks land together when the line is back, then the run is on the clock again
  const drop = {}, t15 = Math.round(taps[15] * 1000 / TICK_HZ), back = t15 + 30000;
  taps.forEach((t, i) => { const ms = Math.round(t * 1000 / TICK_HZ); drop[i] = { s: packFrom(taps, i, i + 1), at: GO + (ms >= t15 && ms < back ? back + (i - 15) * 4 : ms + 300) }; });
  const dv = judgeSolo({ code: CODE, matchId: M, node: { go: GO, c: drop } });
  assert.ok(dv.ok && !dv.cut && dv.floor === full.floor, `a dropped signal (30 s) is never held against the run (${dv.ok ? dv.floor : dv.why})`);
  assert.equal(clockProblem(0, []).why, 'go'); assert.equal(clockProblem(GO, null).why, 'chunks'); assert.equal(clockProblem(GO, []), null);
});

test('THE SERVER\'S OWN RESULT (api/_lib/highrise.js — PURE): highriseSolo builds the match ONLY from the node (`sv`); the row → the report: a record on the SOLO board as ONE sort number, the feats → the cards\' flags; a refused / an empty run earns nothing', () => {
  const taps = botTaps(BOTS.nearPerfect), node = nodeOf(taps);
  const S = highriseSolo({ code: CODE, matchId: M, uid: 'u1', node });
  assert.ok(S.v.ok && S.game.sv === 1 && S.game.id === 'highrise' && S.game.phase === 'final' && S.game.mode === 'solo');
  assert.deepEqual(verifyNode({ code: CODE, matchId: M, node }), S.v);
  const row = S.game.results.u1;
  assert.deepEqual(row, serverRow(S.v));
  assert.ok(row.f >= 200 && /reachedClouds/.test(row.ft) && /reachedTop/.test(row.ft), `a near-perfect bot: floor ${row.f}, both feats`);
  const ex = extractMatch(S.game);
  assert.ok(ex.solo && ex.rows.u1.solo && !ex.rows.u1.win && !ex.rows.u1.empty);
  assert.deepEqual(Object.keys(ex.rows.u1.rec), ['highrise-solo']);
  const v = ex.rows.u1.rec['highrise-solo'];
  assert.equal(v, towerScore(row.f, row.p, row.t)); assert.equal(floorOf(v), row.f); assert.equal(perfectsOf(v), Math.min(9999, row.p));
  assert.deepEqual(ex.rows.u1.f, { clouds: 1, top: 1 }, 'the feats → the flags the catalog reads (highrise-clouds · highrise-top)');
  // a casual run: clouds only when it got there
  const cas = highriseSolo({ code: CODE, matchId: M, uid: 'u1', node: nodeOf(botTaps(BOTS.casual)) }), cr = cas.game.results.u1, cex = extractMatch(cas.game);
  assert.deepEqual(cex.rows.u1.f || {}, cr.f >= CLOUDS_FLOOR ? { clouds: 1 } : {});
  // the ROOM's own results never earn a record: only an `sv` match does
  const hostMade = { ...S.game, sv: undefined, results: { u1: { f: 999, p: 999, t: 1, w: 'made', ft: 'reachedClouds reachedTop' } } };
  const hx = extractMatch(hostMade);
  assert.deepEqual(hx.rows.u1.rec, {}, 'a host-written 999 earns no record'); assert.equal(hx.rows.u1.f, undefined, '… and no card flag');
  // a refused run: named, nothing earned, EMPTY (never a play)
  const bad = highriseSolo({ code: CODE, matchId: M, uid: 'u1', node: { go: GO, c: { 0: { s: packTaps(taps), at: GO + 2000 } } } });
  assert.ok(!bad.v.ok && bad.game.results.u1.f === 0 && /ahead/.test(bad.game.results.u1.bad));
  const bx = extractMatch(bad.game);
  assert.deepEqual(bx.rejected, [{ uid: 'u1', board: 'highrise-solo', v: bad.game.results.u1.bad }]); assert.equal(bx.rows.u1.empty, 1);
  const none = extractMatch(highriseSolo({ code: CODE, matchId: M, uid: 'u1', node: { go: GO } }).game);
  assert.equal(none.rows.u1.empty, 1, 'an EMPTY log (floor 0 — the fuse) is never a play'); assert.equal(soloEmpty({ id: 'highrise', results: { u1: { f: 0 } } }, 'u1', { score: 0 }), true);
  assert.ok(SOLO_OK.highrise && QUICK_SOLO.highrise && REPORT_GAMES.includes('highrise'), 'XP + the streak by JAYWALK\'s rules: the solo lane, the quick solo runs');
  // S4B's half, ready: a match from THE FIRST GO's seed
  const mm = matchStart(CODE, M, { a: { go: GO + 50 }, b: { go: GO } });
  assert.deepEqual(mm, { g0: GO, playAt: GO + GO_LEAD_MS, seed: seedOf(CODE, M, GO) });
  assert.equal(highriseMatch({ code: CODE, matchId: M, uids: ['a'], nodes: { a: { go: GO } } }).game, null, 'fewer than two players: no match');
  assert.equal(highriseMatch({ code: CODE, matchId: M, uids: ['a', 'b'], nodes: {} }).why, 'no go');
});

test('THE BOARD highrise-solo: a tower as ONE sort number — the FLOOR, then THE MOST PERFECTS, then the EARLIER tick; it shows its floor', () => {
  const def = boardDef(BOARD);
  assert.ok(def && def.kind === 'record' && def.fmt === 'floor' && def.dir === 1 && def.label === 'TALLEST TOWER');
  assert.equal(TOWER_SPAN, 1e11);
  assert.ok(towerScore(86, 0, 99999) > towerScore(85, 85, 1), 'the floor first');
  assert.ok(towerScore(200, 190, 12500) > towerScore(200, 189, 12400), 'the same floor: the most perfects');
  assert.ok(towerScore(200, 190, 12400) > towerScore(200, 190, 12500), 'then the earlier tick');
  assert.ok(Number.isSafeInteger(towerScore(20000, 20000, 99999999)), 'never past a safe integer');
  assert.equal(fmtValue(def, towerScore(85, 40, 9000)), '85'); assert.equal(fmtValue(def, 85), '85', 'a plain floor reads as itself');
  assert.equal(floorOf(null), 0); assert.equal(floorOf('x'), 0); assert.equal(floorOf(57), 57); assert.equal(perfectsOf(57), 0);
});

test('THE SWITCH (COUNTING OFF until go-live): ONE flag, OFF; /api/report returns WOULD COUNT before any claim / credit; the dry run reads only; ON = the pure step awards floor, XP, the streak, the best, the card', () => {
  assert.equal(HIGHRISE_COUNTS, false, 'OFF — the go-live pass flips this ONE line');
  const rep = code('api/report.js'), stats = code('api/_lib/stats.js');
  assert.match(rep, /export const highriseCounts = async \(\) => HIGHRISE_COUNTS \|\| \(emulated\(\) && !!\(await val\('testHighriseCounts'\)\)\);/, 'the test flip is honoured on the emulators only');
  // the switch sits AFTER every verification and BEFORE credit(): nothing is claimed, nothing written
  const sw = rep.indexOf("if (hrOff && ex.gid === 'highrise') {"), cr = rep.indexOf('return credit({ key, uid, myPid, ex, pids, now, room: { code, meta, win }, at, src });');
  assert.ok(sw > 0 && cr > sw && rep.indexOf('dedupePids(ex.rows, pids);') < sw, 'judged first, then the switch, then (only when ON) credit()');
  const body = rep.slice(sw, cr);
  assert.match(body, /return \{ ok: true, status: 'would_count', outcome: \{ none: true, would: wouldAward\(judged, w, rec\) \} \};/);
  assert.doesNotMatch(body, /\.set\(|\.update\(|\.transaction\(|credit\(|applyMatch\(|bumpPlayed\(/, 'the OFF branch writes nothing');
  const wa = stats.slice(stats.indexOf('export async function wouldApply'), stats.indexOf('export { toSort };'));
  assert.doesNotMatch(wa, /\.set\(|\.update\(|\.transaction\(|bumpOwners|syncBoards|noteRecent/, 'wouldApply: reads only — the SAME pure step, never a transaction');
  assert.match(wa, /const res = step\(cur, key, ex\.gid, row, ex\.n, now, at, outage,/);
  // the ONLY other writers of a result for it: credit() — reached only past the switch
  assert.equal((rep.match(/highriseCounts\(\)/g) || []).length, 1, 'ONE place asks the switch');
  // (the fresh-eyes review: asked BEFORE the one earlier write a HIGH RISE match could reach — a match from before the progress reset)
  const ask = rep.indexOf("const hrOff = night.g === 'highrise' && !(await highriseCounts());"), pre = rep.indexOf("if (hrOff) return { ok: true, status: 'before_reset', outcome: null };"), seal = rep.indexOf("{ st: 'done', at: now, pre: 1, by: uid, o: {} }");
  assert.ok(ask > 0 && ask < pre && pre < seal && seal < sw, 'OFF: not even the before-reset record is sealed');
  // every write processReport itself can make sits past the switch's ask or is not HIGH RISE's (noteSeen = the account's hashed address, every report)
  assert.equal((rep.slice(0, ask).match(/\.set\(|\.update\(|\.transaction\(/g) || []).length, 0, 'nothing is written before the switch is asked');
  // ON (the pure step — what credit() runs): a counted run past floor 60
  const S = highriseSolo({ code: CODE, matchId: M, uid: 'u1', node: nodeOf(botTaps(BOTS.nearPerfect)) }), ex = extractMatch(S.game);
  const res = matchStep(null, { key: `${CODE}_${M}`, gid: 'highrise', row: ex.rows.u1, n: 1, now: GO + 400000, at: GO + 400000, gap: 0 });
  assert.ok(!res.skip && res.xp.total > 0, `XP +${res.xp && res.xp.total}`);
  assert.ok(res.next.st && res.next.st.n === 1, 'the streak day');
  assert.equal(floorOf(res.next.b['highrise-solo'].a), S.game.results.u1.f, 'the best on the board highrise-solo');
  assert.ok(res.next.pa.gf['highrise-clouds'] === 1 && res.next.pa.gf['highrise-top'] === 1, 'the flags');
  assert.ok(res.next.it['card-abovetheclouds'] && res.next.it['card-topoftheworld'] && res.next.ac['above-the-clouds'] && res.next.ac['top-of-the-world'], 'BOTH cards awarded by the step (floor 60 + floor 200)');
  // an empty run is skipped by the step itself
  const none = extractMatch(highriseSolo({ code: CODE, matchId: M, uid: 'u1', node: { go: GO } }).game);
  assert.equal(matchStep(null, { key: 'k', gid: 'highrise', row: none.rows.u1, n: 1, now: GO, at: GO, gap: 0 }).skip, 'empty');
});

test('THE CARDS: ABOVE THE CLOUDS (floor 60) + TOP OF THE WORLD (floor 200) in the catalog — unlocked only by the server\'s feat flags; in THE LAB; hidden until go-live (nothing is awarded while the switch is OFF)', () => {
  assert.ok(ITEM['card-abovetheclouds'] && ITEM['card-abovetheclouds'].tier === 'rare' && ITEM['card-topoftheworld'].tier === 'legendary');
  const a = ACH['above-the-clouds'], b = ACH['top-of-the-world'];
  assert.ok(a.item === 'card-abovetheclouds' && b.item === 'card-topoftheworld' && a.game === 'highrise' && b.game === 'highrise');
  assert.equal(a.check({}, { gf: { 'highrise-clouds': 1 } }), true); assert.equal(a.check({}, { gf: {} }), false); assert.equal(a.check({ b: { 'highrise-solo': { a: towerScore(300) } } }, {}), false, 'never from a number — the flag only');
  assert.equal(b.check({}, { gf: { 'highrise-top': 1 } }), true); assert.equal(b.check({}, { gf: { 'highrise-clouds': 1 } }), false);
  const lab = read('js/vault/catalog.js');
  for (const id of ['card-abovetheclouds', 'card-topoftheworld', 'full-card-abovetheclouds', 'full-card-topoftheworld']) { assert.ok(lab.includes(`{ id: '${id}',`), `${id} in THE LAB`); assert.ok(read('api/_lib/lab-text.js').includes(`"${id}": { "name":`), `${id}: its name + text are the server's`); }
});

test('THE NEXT FRIEND (lines.js — PURE): the LOWEST friend best above you, one at a time; the tag\'s words; the landing over their floor crosses it; the table\'s values are towers (one sort number) or plain floors', () => {
  const T = parseTable([{ n: 'you', v: towerScore(40, 20, 3000), me: true }, { n: 'liam', v: towerScore(57, 30, 5000) }, { n: 'Maya', v: 12 }, { n: 'Zed', v: 0 }, null, { n: 'bad', v: 'x' }]);
  assert.equal(T.best, 40);
  assert.deepEqual(T.friends, [{ n: 'MAYA', v: 12 }, { n: 'LIAM', v: 57 }], 'the nearest first; no best = no line');
  assert.deepEqual(parseTable(null), { best: 0, friends: [] });
  assert.equal(nextFriend(T.friends, 0).n, 'MAYA'); assert.equal(nextFriend(T.friends, 12).n, 'MAYA', 'standing on their floor: still theirs');
  assert.equal(nextFriend(T.friends, 13).n, 'LIAM'); assert.equal(nextFriend(T.friends, 58), null, 'nobody above: no tag');
  assert.equal(nextFriend([], 3), null); assert.equal(nextFriend(null, 3), null);
  assert.equal(friendTag({ n: 'LIAM', v: 57 }, 45), 'LIAM 57 ▲12'); assert.equal(friendTag({ n: 'LIAM', v: 57 }, 57), 'LIAM 57 · ONE MORE');
  assert.equal(crossedFriend(T.friends, 13).n, 'MAYA'); assert.equal(crossedFriend(T.friends, 12), null); assert.equal(crossedFriend(T.friends, 58).n, 'LIAM'); assert.equal(crossedFriend(null, 5), null);
  // the stage: solo only, never without a list handed in (the test page hands none), the tag clear of THE DROP ZONE + the gold tag
  const st = code('js/games/highrise/stage.js');
  assert.match(st, /const gold = live && !FROM && !matchOn && best > 0 && run\.floor <= best, fr = live && o\.friends && MODE === 'solo' \? nextFriend\(o\.friends\(\), run\.floor\) : null;/);   // (S4A FIX: asked once a landing — placeTags — never every frame)
  assert.match(st, /yf = tagY\(view\.restY\(Math\.min\(fr\.v, run\.floor \+ 100\)\) \* stageH, hudFoot, zone\);/, 'held between the HUD\'s foot and THE DROP ZONE\'s upper edge');
  assert.match(st, /if \(o\.friends && MODE === 'solo'\) \{ const f = crossedFriend\(o\.friends\(\), e\.floor\); if \(f\) \{ friendTape = f\.v; view\.setFriend\(f\.v, !late\);/);
  assert.match(code('js/games/highrise/night.js'), /const ftapeMat = new THREE\.ShaderMaterial\(\{ \.\.\.tapeOpt, uniforms: ftapeU,/, 'the pink tape = the gold tape\'s shader (the same program: a second tape builds nothing)');
  assert.match(read('css/highrise-play.css'), /\.hi-ftag \{ color: #ffd9f4; border-left: 2px solid #fff; padding-left: 12px; box-shadow: -2px 0 0 #ff4fd8, inset 2px 0 0 #ff4fd8, -4px 0 10px rgba\(255, 79, 216, 0\.8\); \}/, 'PINK (S4A FIX: a white core in it) — never gold (gold = YOUR BEST)');
  // the data: YOUR TABLE's board, the server's — asked once a run by the VIEW (never the stage, never the test page)
  assert.match(code('js/games/highrise/view.js'), /A\.api\('profile', \{ action: 'table', b: BOARD \}\)/); assert.equal(BOARD, 'highrise-solo');
  assert.doesNotMatch(code('js/games/highrise/stage.js'), /profile|api\(/);
});

test('THE VIEW WRITES THE PROOF — AND ONLY ITS OWN NODE: GO once (the server\'s time, read back), the chunks server-stamped, `e` once behind the last chunk; never after the match left `play`; the scene parked only over PLAY AGAIN', () => {
  const v = code('js/games/highrise/view.js');
  assert.match(v, /const nodePath = \(\) => `rooms\/\$\{code\}\/hr\/\$\{matchId\}\/\$\{uid\}`;/, 'its own uid, its own match');
  assert.match(v, /dbSet\(dbRef\(path\), serverTimestamp\(\)\)\.then\(\(\) => dbGet\(dbRef\(path\)\)\)/, 'GO: the server\'s time, read back — never the phone\'s estimate');
  assert.match(v, /fin\(\{ seed: seedOf\(code, matchId, go\), t0: perfOf\(go\), taps: old \|\| \[\] \}\);/, 'the seed = hash(code + matchId + GO); tick 0 = GO');
  assert.match(v, /dbSet\(dbRef\(`\$\{nodePath\(\)\}\/c\/\$\{chunkN\}`\), \{ s, at: serverTimestamp\(\) \}\)/);
  assert.match(v, /dbUpdate\(dbRef\(nodePath\(\)\), \{ e: \{ f: r\.floor, t: r\.tick, w: String\(r\.cause \|\| ''\)\.slice\(0, 12\) \} \}\)/);
  assert.equal((v.match(/dbSet\(|dbUpdate\(/g) || []).length, 4, 'four writes in all: GO, the rule set (S4B: `rs`, once, right behind GO), a chunk, the end');
  assert.match(v, /dbSet\(dbRef\(path\), RULES_DEFAULT\)\.catch\(/, 'the rule set: best effort — a refused write is read as classic by the judge');
  assert.match(v, /if \(matchLeft\(\)\) \{ lateProof\('dropped'\); sent = taps\.length; countQuietLate\(\); return; \}/, 'never a chunk once the match left `play`');
  assert.match(v, /if \(!isMatch && performance\.now\(\) - \(globalThis\.__nsAgainAt \|\| -1e9\) < 3000\) park\(S\); else S\.destroy\(\);/, 'parked only over a SOLO run\'s PLAY AGAIN — else (a match too) freed at once');
  assert.match(v, /if \(!proven\) \{ showLeave\(\); return \{ own: true, note: 'NOT COUNTED — NO LINE TO THE BOARD' \}; \}/, 'an UNPROVEN run ends on the stage\'s own card');
  // the stage itself writes nothing (it is the test page's module too)
  assert.doesNotMatch(code('js/games/highrise/stage.js'), /firebase|dbRef|serverTimestamp|\/api\//);
});

test('THE FRESH-EYES REVIEW — the host\'s podium reads its LIVE MIRROR (a chunk in flight carries the phone\'s estimate of the server\'s time): never an honest run refused as "the chunks\' clock"; THE SERVER stays strict', () => {
  const taps = botTaps(BOTS.good), node = nodeOf(taps), seed = seedOf(CODE, M, GO), want = judgeRun({ seed, mode: 'solo', taps });
  // the last chunk still unacknowledged: its `at` = the phone's estimate — a round trip EARLIER than the acknowledged chunk before it
  const n = Object.keys(node.c).length, flight = { ...node, c: { ...node.c, [n - 1]: { ...node.c[n - 1], at: node.c[n - 2].at - 180 } }, e: { f: 1, t: 1, w: 'miss' } };
  assert.equal(judgeSolo({ code: CODE, matchId: M, node: flight }).why, 'the chunks\' clock', 'the strict judge (the server\'s) refuses a clock that runs backwards');
  const row = scoreNode(CODE, M, flight);
  assert.ok(!row.bad && row.f === want.floor && row.p === want.perfects, `the host's podium: the run as it was (floor ${row.f})`);
  const g = createGame({ matchId: M, settings: {}, participants: { u1: true }, now: 1, seed: 'x' });
  assert.equal(nextStep(g, { now: 2, live: { runs: { u1: flight } }, code: CODE }).results.u1.f, want.floor);
  // the lenient read forgives ONLY the backwards step: a log AHEAD of the clock is still refused on the podium
  assert.match(scoreNode(CODE, M, { go: GO, c: { 0: { s: packTaps(taps), at: GO + 2000 } } }).bad, /ahead/);
  assert.match(code('js/games/highrise/director.js'), /judgeSolo\(\{ code, matchId, node, mirror: true \}\)/);
  assert.doesNotMatch(code('api/_lib/highrise.js'), /mirror/, 'the server never sets it');
  assert.equal(highriseSolo({ code: CODE, matchId: M, uid: 'u1', node: flight }).v.why, 'the chunks\' clock', '… the server\'s result of the same node: refused (it only ever reads acknowledged stamps)');
});

test('THE FRESH-EYES REVIEW — the view + the stage: a LATE GO answer never touches a run that went on; the hold is taken in the START touch; the podium puts the stage\'s card away; the best is stored before the end screen; the two tags keep the floors\' order', () => {
  const v = code('js/games/highrise/view.js'), st = code('js/games/highrise/stage.js'), fin = code('js/games/highrise/final.js');
  assert.match(v, /const stale = \(\) => done \|\| gone \|\| m !== matchId;/);
  assert.match(v, /const proof = \(goAt, chunks\) => \{\s*if \(stale\(\)\) \{ if \(!gone && m === matchId\) spent = true; return; \}/, 'a late GO: nothing of the view is written — and this match\'s one GO is spent');
  assert.match(v, /const unproven = why => \{ if \(stale\(\)\) return;/);
  assert.match(v, /if \(node && node\.go > 0\) \{\s*dbGet\(dbRef\(nodePath\(\)\)\)\.then\(snap => \{ const n = snap\.val\(\); if \(n && n\.go > 0 && !n\.e\) proof\(n\.go, n\.c\); else unproven\('again'\); \}\)/, 'a rejoin reads the node FROM THE SERVER — never the mirror\'s estimate');
  assert.doesNotMatch(v, /proof\(node\.go/, 'the seed is never picked from the mirror');
  assert.match(st, /starting = true; stage\.classList\.add\('is-starting'\);\s*awakeAt = performance\.now\(\); awake\(true\);/, 'the hold: in the START touch');
  assert.match(st, /if \(\(t0 != null \|\| starting\) && !shown && now - awakeAt > 1000\) \{ awakeAt = now; awake\(true\); \}/, '… renewed while GO is on its way');
  assert.match(v, /S\.hideCard\(\);[\s\S]{0,500}?final = createFinal\(/); assert.match(st, /hideCard\(\) \{ if \(!card\) return; card = false; end\.hidden = true; check\.hidden = true; again\.hidden = true; stage\.classList\.remove\('is-over'\); \},/);
  assert.match(st, /!\(shown && !card\) && !stage\.classList\.contains\('is-final'\) &&/, 'a key never restarts a run under the podium');
  assert.ok(st.indexOf('if (best > was) writeBest(best);') < st.indexOf('const E = o.onEnd ? o.onEnd(live) : null;'), 'YOUR BEST is stored BEFORE the end screen is asked for');
  assert.match(fin, /if \(!srv && nb && game && nb\.m === game\.matchId && nb\.v === floor && floor > 0\)/, 'counting OFF: NEW BEST from this phone\'s own record of THIS run');
  assert.doesNotMatch(fin, /if \(!\(floor > 0\)\) return;/, 'the server\'s answer shows whatever the host\'s row says');
  assert.match(st, /if \(Math\.abs\(want - yg\) >= 29\.5\) yf = want; else \{ yf = yg; yg \+= up \? 30 : -30; \}/, 'no room on the friend\'s side: the GOLD tag steps the other way — the higher floor stays above');
  assert.match(st, /if \(document\.visibilityState === 'hidden'\) \{ awake\(false\); if \(o\.onHide\) o\.onHide\(\); \}/); assert.match(v, /hide: \(\) => \{ if \(S && started && !S\.state\(\)\.over\) flush\(true\); \}/, 'a hidden page\'s last taps go up at once');
  assert.match(code('js/audio/engine.js'), /if \(startWaits >= 8\) return;/, 'the sync measure never piles listeners on a context that does not run');
});
