// JAYWALK H1 — THE CARTRIDGE (js/games/jaywalk/ meta · logic · director — docs/jaywalk.md "THE MATCH"; docs/cartridge.md): hidden
// (playable: false + preview), THE GAME FRAME at the start, a pure step that respects THE 3 S RULE, a whole match simulated (count → play →
// final) with the results REPLAYED from every player's own hop log — a silent-but-present player still has a run.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES, FROZEN_IDS, isPlayable } from '../js/config.js';
import * as META from '../js/games/jaywalk/meta.js';
import { createGame, nextStep, endNow } from '../js/games/jaywalk/director.js';
import { standings, scoreRun, modeOf, capAt, tickAt, COUNT_MS, END_GRACE_MS } from '../js/games/jaywalk/logic.js';
import { frameProblems } from '../js/games/cartridge.js';
import { checkCartridge } from '../js/games/contract.js';
import { MARKS } from '../js/core/marks.js';
import { MODES, TICK_HZ } from '../js/games/jaywalk/tuning.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, resultOf } from '../js/games/jaywalk/engine.js';
import { packLog, replay } from '../js/games/jaywalk/replay.js';
import { greedyBot, playBot } from '../js/games/jaywalk/bot.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const T0 = 1_800_000_000_000;

test('HIDDEN: its GAMES row is playable: false + preview (THE ONE SWITCH stays off) — not frozen, never offered, never startable on a plain page', () => {
  const g = GAMES.find(x => x.id === 'jaywalk');
  assert.deepEqual([g.name, g.theme, g.playable, g.preview], ['JAYWALK', 'jaywalk', false, true]);
  assert.ok(g.tag && g.blurb);
  assert.ok(!FROZEN_IDS.includes('jaywalk'), 'being built — not a frozen game');
  assert.equal(isPlayable('jaywalk'), false, 'no start (Node has no local emulator page / owner phone)');
  assert.deepEqual(GAMES.filter(x => x.playable).map(x => x.id).sort(), ['holdem', 'overclock', 'prism'], 'the playable three, unchanged');
  assert.doesNotMatch(read('js/games/registry.js'), /jaywalk\/meta\.js/, 'no meta at boot until its go-live (THE BOOT BUDGET)');
});

test('THE META: 3 lives (the host\'s option: 1), ~6 minutes, the EVENING station, NIGHT (the day look: H5), SOLO; one player = 1 life; the contract', () => {
  assert.deepEqual(META.DEFAULT_SETTINGS, { lives: 3 });
  assert.deepEqual(META.OPTIONS[0].choices.map(c => c.value), [3, 1]);
  assert.equal(META.estimateMinutes(), 6);
  assert.deepEqual([META.MUSIC, META.SOLO, META.BANNER_NAME], ['mood:evening', true, 'JAYWALK']);
  assert.deepEqual(META.LOOKS, ['night'], 'H3: ONE look until H5 builds the day — the console paints NIGHT + shows it LOCKED');
  assert.deepEqual([META.AGAIN_LABEL, META.OWN_VICTORY_SOUND, META.ACCENT], ['HOP AGAIN', true, '#ff4fc4']);
  assert.deepEqual(META.cleanSettings({ lives: 1 }, 4), { lives: 1 }); assert.deepEqual(META.cleanSettings({ lives: 7 }, 4), { lives: 3 });
  assert.deepEqual(META.cleanSettings({ lives: 3 }, 1), { lives: 1 }, 'SOLO ENDLESS is one life');
  assert.deepEqual(META.LIVES, MODES.match.livesOpt, 'the option = the rules\' own table');
  assert.equal(Math.round(MODES.match.cap / TICK_HZ / 60), META.estimateMinutes(), 'the minutes = THE MOTHERSHIP');
  const idx = read('js/games/jaywalk/index.js');
  const mod = { ...META, start() {}, prepare() {}, step() {}, livePaths() {}, createView() {}, finalRanks() {} };
  assert.deepEqual(checkCartridge('jaywalk', mod, { marks: MARKS, game: GAMES.find(x => x.id === 'jaywalk') }), [], 'checkCartridge passes');
  for (const k of ['start', 'prepare', 'step', 'livePaths', 'createView', 'finalRanks']) assert.match(idx, new RegExp(`export (async function|function|const) ${k}\\b`), `index.js exports ${k}`);
  assert.match(idx, /export const livePaths = g => \(\{ runs: `jw\/\$\{g\.matchId\}` \}\);/);
  assert.match(idx, /lazyView\(\(\) => lazyImport\(import\('\.\/view\.js'\), '\.\/view\.js'\), gameSheets\('jaywalk'\)\)/, 'createView = the lazy view (a stub until H2 / H4)');
  // the chat's lock: shut while you hop, open once your run ended / for a spectator
  const game = { phase: 'play', participants: { a: true } };
  assert.equal(META.chatLocked(game, 'a', { runs: {} }), true); assert.equal(META.chatLocked(game, 'a', { runs: { a: { e: { l: 3, t: 9 } } } }), false);
  assert.equal(META.chatLocked(game, 'zz', {}), false); assert.equal(META.chatLocked({ ...game, phase: 'final' }, 'a', {}), false);
});

test('THE GAME FRAME at the start (id · matchId · participants · phase) — host.js\'s frame check passes; a room = the MATCH, one player = SOLO ENDLESS; a new seed rides the game', () => {
  const parts = { a: true, b: true, c: true };
  const g = createGame({ matchId: 'm1', settings: { lives: 1 }, participants: parts, now: T0, seed: 'abc' });
  assert.deepEqual(frameProblems(g, 'jaywalk', 'm1'), []);
  assert.deepEqual([g.id, g.phase, g.phaseStartAt, g.playAt, g.mode, g.seed, g.settings.lives], ['jaywalk', 'count', T0, T0 + COUNT_MS, 'match', 'abc', 1]);
  const s = createGame({ matchId: 's1', settings: {}, participants: { a: true }, now: T0, seed: 'x' });
  assert.deepEqual([s.mode, s.settings.lives, capAt(s)], ['solo', 1, null], 'solo: one life, no mothership');
  assert.equal(modeOf(parts), 'match');
  assert.equal(capAt(g), g.playAt + 6 * 60 * 1000, 'THE MOTHERSHIP: 6 minutes after GO');
  assert.equal(tickAt(g, g.playAt + 1000), TICK_HZ);
  assert.match(read('js/games/jaywalk/index.js'), /crypto\.getRandomValues/, 'start(): a new seed every match (start may be impure; the step never)');
});

/** a player's proof node, as the phone will write it (H4): GO + the packed log in chunks (+ the end) */
function nodeOf(seed, mode, lives, ticks, botSeed, ended = true) {
  const course = createCourse(seed), run = createRun({ seed, mode, lives });
  const log = playBot(run, course, greedyBot({ seed: botSeed }), ticks), c = {};
  for (let i = 0, n = 0; i < log.length; i += 50, n++) c[n] = packLog(log.slice(0, i + 50), i);
  return { node: { go: T0, c, ...(ended ? { e: { l: run.best, t: run.bestT } } : {}) }, log, live: resultOf(run) };
}

test('A WHOLE MATCH (the pure step): count → play at GO → final when every run has ended — the results are THE REPLAY of each log, never a claim', () => {
  const parts = { a: true, b: true, c: true };
  const g0 = createGame({ matchId: 'm1', settings: { lives: 3 }, participants: parts, now: T0, seed: 'match-seed' });
  assert.equal(nextStep(g0, { now: T0 + 100, live: {} }), null, 'the count holds');
  const p1 = nextStep(g0, { now: g0.playAt + 5, live: {} });
  assert.deepEqual(p1, { phase: 'play', phaseStartAt: g0.playAt });
  const g1 = { ...g0, ...p1 };
  const A = nodeOf('match-seed', 'match', 3, 2400, 'a'), B = nodeOf('match-seed', 'match', 3, 900, 'b', false);
  // b is still hopping, c is silent: the match goes on
  assert.equal(nextStep(g1, { now: g1.playAt + 40_000, live: { runs: { a: A.node, b: B.node } } }), null);
  // a LIES about their lanes; b + c have ended (c wrote only GO — silent but present)
  const lied = { ...A.node, e: { l: 99999, t: 1 } };
  const now = g1.playAt + 5 * 60_000, runs = { a: lied, b: { ...B.node, e: { l: 1, t: 1 } }, c: { go: T0, e: { l: 0, t: 0 } } };
  const p2 = nextStep(g1, { now, live: { runs } });
  assert.equal(p2.phase, 'final'); assert.equal(p2.phaseStartAt, now);
  const until = tickAt(g1, now);
  for (const [u, n] of [['a', A], ['b', B]]) {
    const want = replay({ seed: 'match-seed', mode: 'match', lives: 3, log: n.log, until });
    assert.deepEqual([p2.results[u].l, p2.results[u].t], [want.lanes, want.tick], `${u}: the replay's lanes + tick`);
  }
  assert.notEqual(p2.results.a.l, 99999, 'a claim is never read');
  assert.ok(p2.results.c && p2.results.c.l === 0 && p2.results.c.lv === 0 && p2.results.c.w, 'the silent player has a real run: the wall took their lives');
  const g2 = { ...g1, ...p2 };
  assert.equal(nextStep(g2, { now: now + 9999, live: { runs } }), null, 'final holds (the console\'s podium)');
  const st = standings(g2);
  assert.deepEqual(st.map(r => r.rank), [1, 2, 3]); assert.equal(st[2].uid, 'c');
  assert.ok(st[0].lanes >= st[1].lanes);
  // the same step asked again (a host migration) = the same patch
  assert.deepEqual(nextStep(g1, { now, live: { runs } }), p2);
});

test('THE END: THE MOTHERSHIP\'s moment + a grace ends the match for everyone; solo never ends by the clock; END NOW scores the runs as they stand', () => {
  const g = { ...createGame({ matchId: 'm', settings: {}, participants: { a: true, b: true }, now: T0, seed: 'cap' }), phase: 'play' };
  const cap = capAt(g);
  assert.equal(nextStep(g, { now: cap + END_GRACE_MS - 1, live: { runs: {} } }), null);
  const p = nextStep(g, { now: cap + END_GRACE_MS, live: { runs: {} } });
  assert.equal(p.phase, 'final'); assert.ok(p.results.a && p.results.b);
  const solo = { ...createGame({ matchId: 's', settings: {}, participants: { a: true }, now: T0, seed: 'cap' }), phase: 'play' };
  assert.equal(nextStep(solo, { now: T0 + 3 * 3600_000, live: { runs: { a: { go: 1 } } } }), null, 'solo endless: three hours in, still on');
  assert.equal(nextStep(solo, { now: T0 + 9000, live: { runs: { a: { go: 1, e: { l: 4, t: 99 } } } } }).phase, 'final', 'it ends when the run does');
  const e = endNow(g, { now: g.playAt + 30_000, live: { runs: {} } });
  assert.equal(e.phase, 'final'); assert.equal(endNow({ ...g, phase: 'final' }, { now: 1 }), null);
  // a broken log (a bad chunk, a forged one) is scored as a kid who never hopped — never a throw
  assert.deepEqual(Object.keys(scoreRun(g, { go: 1, c: { 0: 'zz' } }, g.playAt + 10000)).sort(), ['e', 'l', 'lv', 'px', 't', 'w', 'y']);
  assert.equal(scoreRun(g, { go: 1, c: { 0: 'U0U1' } }, g.playAt + 10000).l, 0, 'inputs closer than a hand: the whole log refused');
});

test('THE 3 S RULE + THE RANKING: every patch of the step moves the phase; lanes first, the earlier tick wins a tie, the same lanes at the same tick share the place', () => {
  const src = read('js/games/jaywalk/director.js').replace(/\/\/[^\n]*/g, '');
  for (const m of src.matchAll(/return (\{[^}]*\}|finalPatch\([^)]*\))/g)) assert.ok(/phase:|finalPatch/.test(m[1]), `a patch that moves the phase: ${m[1]}`);
  assert.match(src, /const finalPatch = \(game, runs, now, code\) => \(\{ phase: 'final', phaseStartAt: now,/);
  for (const bad of [/Math\.random/, /Date\.now/, /serverNow/, /\bstate\b/]) assert.doesNotMatch(src, bad, `the step is pure (${bad})`);
  const g = { participants: { a: 1, b: 1, c: 1, d: 1 }, results: { a: { l: 212, t: 9000 }, b: { l: 212, t: 8000 }, c: { l: 212, t: 8000 }, d: { l: 300, t: 20000 } } };
  assert.deepEqual(standings(g).map(r => [r.uid, r.rank]), [['d', 1], ['b', 2], ['c', 2], ['a', 4]]);
  assert.deepEqual(standings({ participants: { a: 1 }, results: {} }).map(r => [r.rank, r.lanes]), [[1, 0]]);
});

test('REGISTERED: the mark (the signs\' pink), the theme, SOLO_OK + the report + the proof tree (jw) + the wipe lists, the stylesheet at its place', async () => {
  assert.equal(MARKS.jaywalk.blade, 'JAYWALK'); assert.ok(MARKS.jaywalk.tubes.some(t => t.col === '#ff4fc4'), 'the city\'s JAY / WALK pink (signs.js SIGN_ACC)');
  assert.match(read('js/screens/harbor/signs.js'), /jaywalk: '#ff4fc4'/);
  assert.match(read('css/base.css'), /\[data-theme='jaywalk'\] \{[^}]*--accent: #ff4fc4/);
  const R = await import('../js/core/match-report.js'), reg = await import('../js/games/registry.js');
  assert.equal(R.SOLO_OK.jaywalk, true); assert.ok(R.REPORT_GAMES.includes('jaywalk'));
  assert.match(read('api/report.js'), /jaywalk: m => \(\{ room: \[`jw\/\$\{m\}`\], seal: \[\] \}\)/);
  assert.match(read('api/report.js'), /const FLAT_PROOF = new Set\(\['prism', 'jaywalk'\]\);/, 'its tree is { uid: node } — GO alone proves a player');
  assert.ok(reg.PROOF_NODE_LIST.includes('jw') && reg.NEW_PLAYER_NODES.includes('jw') && !reg.ALL_PLAYER_NODES.includes('jw'), 'jw: kept as proof, out of the atomic clear (new in the rules)');
  assert.ok(reg.GAME_IDS.includes('jaywalk') && !reg.META.jaywalk);
  const { staleProofPaths } = await import('../js/core/room-logic.js');
  assert.deepEqual(staleProofPaths({ jw: { m0: {}, m1: {}, m2: {} } }, ['m1', 'm2']), { 'jw/m0': null }, 'a rematch keeps the just-finished match\'s node (by matchId)');
  assert.match(read('js/games/lazy-view.js'), /'coastclear', 'jaywalk', 'slip'/);
  // a finished match reports (the server still refuses the game until it is playable: api/report.js#reportableGame)
  const ex = R.extractMatch({ id: 'jaywalk', matchId: 'm', phase: 'final', mode: 'match', participants: { a: true, b: true }, results: { a: { l: 90, t: 5000 }, b: { l: 40, t: 3000 } } });
  assert.deepEqual([ex.rows.a.rank, ex.rows.a.win, ex.rows.b.rank], [1, true, 2]);
  const so = R.extractMatch({ id: 'jaywalk', matchId: 'm', phase: 'final', mode: 'solo', participants: { a: true }, results: { a: { l: 0, t: 0 } } });
  assert.equal(so.rows.a.empty, 1, 'a solo run that reached no lane never counts');
});
