// JAYWALK H1 — THE CARTRIDGE (js/games/jaywalk/ meta · logic · director — docs/jaywalk.md "THE MATCH"; docs/cartridge.md): hidden
// (playable: false + preview), THE GAME FRAME at the start, a pure step that respects THE 3 S RULE, the ranking. (H4 — ONE LIFE, no options;
// the whole match — THE FIRST GO, the ghosts' logs, the end, Call the Winner, the server's replay: tests/jaywalk-match.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES, FROZEN_IDS, isPlayable } from '../js/config.js';
import * as META from '../js/games/jaywalk/meta.js';
import { createGame, nextStep, endNow, IDLE_OUT_MS } from '../js/games/jaywalk/director.js';
import { standings, scoreRun, modeOf, capAt, tickAt, COUNT_MS, END_GRACE_MS, GO_LEAD_MS, NO_GO_MS, seedOf } from '../js/games/jaywalk/logic.js';
import { frameProblems } from '../js/games/cartridge.js';
import { checkCartridge } from '../js/games/contract.js';
import { MARKS } from '../js/core/marks.js';
import { MODES, TICK_HZ } from '../js/games/jaywalk/tuning.js';
import { setCvSwitch } from '../js/games/jaywalk/versions.js';
setCvSwitch(Infinity);   // (J2: these cases are the MATCH / SOLO LOGIC on v1 courses at test times past the real switch — the versions themselves: tests/jaywalk-versions.test.mjs + jaywalk-v2-agree.test.mjs)

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const T0 = 1_800_000_000_000;

test('PLAYABLE (THE GO-LIVE PASS, Nov 17): its GAMES row is playable: true, no preview — not frozen, offered + startable on every phone; its meta at boot', () => {
  const g = GAMES.find(x => x.id === 'jaywalk');
  assert.deepEqual([g.name, g.theme, g.playable, g.preview], ['JAYWALK', 'jaywalk', true, undefined]);
  assert.ok(g.tag && g.blurb);
  assert.ok(!FROZEN_IDS.includes('jaywalk'), 'a playable game — never frozen');
  assert.equal(isPlayable('jaywalk'), true, 'THE ONE SWITCH is on: any phone starts it (no owner phone, no local page)');
  assert.deepEqual(GAMES.filter(x => x.playable).map(x => x.id).sort(), ['highrise', 'holdem', 'jaywalk', 'overclock', 'prism'], 'the playable five (HIGH RISE since its go-live, Nov 20)');
  assert.match(read('js/games/metas.js'), /^  jaywalk: Object\.freeze\(\{/m, 'its thin meta at boot, like every playable game — its ROW in THE ONE META MODULE (CITY PART 1)');
});

test('THE META (H4): NO OPTIONS — ONE LIFE everywhere; a few minutes (THE MOTHERSHIP at 6 is the rare end), the EVENING station, NIGHT (the day look: H5), SOLO; the contract', () => {
  assert.deepEqual(META.DEFAULT_SETTINGS, {}); assert.deepEqual(META.OPTIONS, [], 'the lives option is GONE');
  assert.equal(META.LIVES, undefined); assert.equal(META.AGAIN_LABEL, undefined, 'PLAY AGAIN — the console\'s own word');
  assert.deepEqual(META.cleanSettings({ lives: 3 }, 4), {}); assert.deepEqual(META.cleanSettings(), {});
  assert.ok(META.estimateMinutes() >= 2 && META.estimateMinutes() <= MODES.match.cap / TICK_HZ / 60, 'the minutes: a match ends when the last player is out — never past THE MOTHERSHIP');
  assert.equal(MODES.match.cap / TICK_HZ / 60, 6);
  assert.deepEqual([META.MUSIC, META.SOLO, META.BANNER_NAME], ['mood:evening', true, 'JAYWALK']);
  assert.deepEqual(META.LOOKS, ['day', 'night'], 'H5B: THE DAY LOOK is built — both looks: the GAME LOOK setting is back (never LOCKED)');
  assert.deepEqual([META.OWN_VICTORY_SOUND, META.ACCENT], [true, '#ff4fc4']);
  const idx = read('js/games/jaywalk/index.js');
  const mod = { ...META, start() {}, prepare() {}, step() {}, livePaths() {}, createView() {}, finalRanks() {}, nightBonus() {} };
  assert.deepEqual(checkCartridge('jaywalk', mod, { marks: MARKS, game: GAMES.find(x => x.id === 'jaywalk') }), [], 'checkCartridge passes');
  for (const k of ['start', 'prepare', 'step', 'livePaths', 'createView', 'finalRanks', 'nightBonus']) assert.match(idx, new RegExp(`export (async function|function|const) ${k}\\b`), `index.js exports ${k}`);
  assert.match(idx, /export const livePaths = g => \(\{ runs: `jw\/\$\{g\.matchId\}` \}\);/, 'everyone\'s proof nodes, mirrored: the hop logs ARE the ghosts');
  assert.match(idx, /export const step = \(game, \{ now, live, code, online \}\) => nextStep\(game, \{ now, live, code, online \}\);/, 'the step knows who is online (THE DROPPED SIGNAL\'s wait)');
  assert.match(idx, /lazyView\(\(\) => lazyImport\(import\('\.\/view\.js'\), '\.\/view\.js'\), gameSheets\('jaywalk'\), \{ needs: globalThis\.__nsViewNeeds \? globalThis\.__nsViewNeeds\.importMaps\('JAYWALK'\) : null \}\)/, 'createView = the lazy view (THE FIX PASS — P1: + its feature card)');
  // the chat's lock: shut while you hop, open once your run ended / for a spectator
  const game = { phase: 'play', participants: { a: true } };
  assert.equal(META.chatLocked(game, 'a', { runs: {} }), true); assert.equal(META.chatLocked(game, 'a', { runs: { a: { e: { l: 3, t: 9 } } } }), false);
  assert.equal(META.chatLocked(game, 'zz', {}), false); assert.equal(META.chatLocked({ ...game, phase: 'final' }, 'a', {}), false);
});

test('THE GAME FRAME at the start (id · matchId · participants · phase) — host.js\'s frame check passes; a room = the MATCH (its course picked AFTER GO: no seed yet), one player = SOLO ENDLESS', () => {
  const parts = { a: true, b: true, c: true };
  const g = createGame({ matchId: 'm1', settings: { lives: 1 }, participants: parts, now: T0, seed: 'abc' });
  assert.deepEqual(frameProblems(g, 'jaywalk', 'm1'), []);
  assert.deepEqual([g.id, g.phase, g.phaseStartAt, g.playAt, g.mode, g.seed, g.settings], ['jaywalk', 'count', T0, T0 + COUNT_MS, 'match', '', {}], 'the host\'s seed is NEVER a match\'s course');
  const s = createGame({ matchId: 's1', settings: {}, participants: { a: true }, now: T0, seed: 'x' });
  assert.deepEqual([s.mode, s.phase, s.settings, capAt(s)], ['solo', 'play', {}, null], 'solo: no count, no mothership');
  assert.deepEqual(frameProblems(s, 'jaywalk', 's1'), []);
  assert.equal(modeOf(parts), 'match');
  assert.equal(capAt(g), g.playAt + 6 * 60 * 1000, 'THE MOTHERSHIP: 6 minutes after GO');
  assert.equal(tickAt(g, g.playAt + 1000), TICK_HZ);
});

test('THE STEP (pure): the count holds until THE FIRST GO\'s tick 0 → play (the course + the clock ride the patch); the end by THE MOTHERSHIP; solo never ends by the clock; END NOW scores the runs as they stand', () => {
  const g0 = createGame({ matchId: 'm1', settings: {}, participants: { a: true, b: true }, now: T0, seed: 'x' });
  assert.equal(nextStep(g0, { now: T0 + 100, live: {}, code: 'ROOM' }), null, 'the count holds');
  assert.equal(nextStep(g0, { now: g0.playAt + NO_GO_MS - 1, live: { runs: {} }, code: 'ROOM' }), null, 'no GO yet: it waits a moment more');
  const go = T0 + 1200, runs = { a: { go: go + 40 }, b: { go } };
  assert.equal(nextStep(g0, { now: go + GO_LEAD_MS - 1, live: { runs }, code: 'ROOM' }), null);
  const p1 = nextStep(g0, { now: go + GO_LEAD_MS, live: { runs }, code: 'ROOM' });
  assert.deepEqual(p1, { phase: 'play', phaseStartAt: go + GO_LEAD_MS, playAt: go + GO_LEAD_MS, seed: seedOf('ROOM', 'm1', go), g0: go }, 'tick 0 = the first GO + 2 s; the course = hash(code + matchId + that GO)');
  const g = { ...g0, ...p1 }, cap = capAt(g);
  // both still hopping right up to the cap (a chunk a moment ago): only THE MOTHERSHIP ends it
  const busy = at => ({ a: { go, c: { 0: { s: 'U9', at } } }, b: { go, c: { 0: { s: 'U9', at } } } });
  assert.equal(nextStep(g, { now: cap + END_GRACE_MS - 1, live: { runs: busy(cap - 500) }, code: 'ROOM', online: { a: true, b: true } }), null);
  const p = nextStep(g, { now: cap + END_GRACE_MS, live: { runs: busy(cap - 500) }, code: 'ROOM', online: { a: true, b: true } });
  assert.equal(p.phase, 'final'); assert.ok(p.results.a && p.results.b);
  assert.ok(IDLE_OUT_MS >= 16000 && IDLE_OUT_MS <= 25000, 'a kid nobody moves is out within it');
  const solo = { ...createGame({ matchId: 's', settings: {}, participants: { a: true }, now: T0, seed: 'cap' }), phase: 'play' };
  assert.equal(nextStep(solo, { now: T0 + 3 * 3600_000, live: { runs: { a: { go: 1 } } } }), null, 'solo endless: three hours in, still on');
  assert.equal(nextStep(solo, { now: T0 + 9000, live: { runs: { a: { go: 1, e: { l: 4, t: 99 } } } } }).phase, 'final', 'it ends when the run does');
  const e = endNow(g, { now: g.playAt + 30_000, live: { runs: {} } });
  assert.equal(e.phase, 'final'); assert.equal(endNow({ ...g, phase: 'final' }, { now: 1 }), null);
  // a broken log (a bad chunk, a forged one) is scored as a kid who never hopped — never a throw; it is NAMED (`bad`)
  const bad = scoreRun(g, { go, c: { 0: 'zz' } }, g.playAt + 10000);
  assert.deepEqual(Object.keys(bad).sort(), ['bad', 'e', 'l', 'px', 't', 'w', 'y']); assert.equal(bad.l, 0);
  assert.equal(scoreRun(g, { go, c: { 0: { s: 'U0U1', at: g.playAt + 500 } } }, g.playAt + 10000).bad, 'too fast', 'inputs closer than a hand: the whole log refused');
  assert.deepEqual(scoreRun(g0, { go }, T0 + 9000), { l: 0, t: 0, w: '', e: -1 }, 'no course yet (the count): nothing');
});

test('THE 3 S RULE + THE RANKING: every patch of the step moves the phase; lanes first, the earlier tick wins a tie, the same lanes at the same tick share the place', () => {
  const src = read('js/games/jaywalk/director.js').replace(/\/\/[^\n]*/g, '');
  const step = src.slice(src.indexOf('export function nextStep'), src.indexOf('export const endNow'));
  for (const m of step.matchAll(/\{ phase: [^}]*\}/g)) assert.match(m[0], /phaseStartAt:/, `a patch moves the phase + its start: ${m[0]}`);
  assert.doesNotMatch(step.replace(/\{ phase: [^}]*\}/g, 'PATCH').replace(/finalPatch\([^)]*\)/g, 'PATCH'), /return \{|\? \{/, 'every patch the step returns moves the phase (a play patch or the final one)');
  assert.match(src, /patch = \{ phase: 'final', phaseStartAt: now, endAt: now, results, /);
  for (const bad of [/Math\.random/, /Date\.now/, /serverNow/, /\bstate\b/]) assert.doesNotMatch(src, bad, `the step is pure (${bad})`);
  const g = { participants: { a: 1, b: 1, c: 1, d: 1 }, results: { a: { l: 212, t: 9000 }, b: { l: 212, t: 8000 }, c: { l: 212, t: 8000 }, d: { l: 300, t: 20000 } } };
  assert.deepEqual(standings(g).map(r => [r.uid, r.rank]), [['d', 1], ['b', 2], ['c', 2], ['a', 4]]);
  assert.deepEqual(standings({ participants: { a: 1 }, results: {} }).map(r => [r.rank, r.lanes]), [[1, 0]]);
});

test('REGISTERED: the mark (the signs\' pink), the theme, SOLO_OK + the report + the proof tree (jw) + the wipe lists, the stylesheet at its place', async () => {
  // THE ICON = THE SNEAKER (CITY H2 — the owner's pick; was THE SIGNAL): the upper HOT PINK, the sole + laces WHITE, two CYAN speed lines — three
  // tubes in the house mark system (the same stroke + glow as PRISM DROP / OVERCLOCK / HOLD'EM), inside the 0–100 box
  assert.equal(MARKS.jaywalk.blade, 'JAYWALK'); assert.equal(MARKS.jaywalk.tubes.length, 3);
  const rgbOf = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)), [box, sole, speed] = MARKS.jaywalk.tubes;
  const [fr, fg, fb] = rgbOf(box.col), [sr, sg, sb] = rgbOf(sole.col), [cr, cg, cb] = rgbOf(speed.col);
  assert.ok(fr > 230 && fg < 90 && fb < 110 && Math.abs(fb - fg) < 40, `the upper: neon red (J3 — was the house pink) — not pink, not orange (${box.col})`); assert.ok(sr > 240 && sg > 230 && sb > 230, `the sole + laces: white (${sole.col})`); assert.ok(cb > 220 && cg > 180 && cr < 120, `the speed lines: cyan (${speed.col})`);
  for (const t of MARKS.jaywalk.tubes) { const nums = t.d.match(/-?\d+(\.\d+)?/g).map(Number); assert.ok(Math.max(...nums) <= 100 && Math.min(...nums) >= 0, 'inside the 0–100 box'); }
  assert.ok((sole.d.match(/M/g) || []).length === 4, 'the sole + three laces'); assert.ok((speed.d.match(/M/g) || []).length === 2, 'two speed lines');
  assert.notEqual(box.col, MARKS.holdem.tubes[0].col);
  assert.match(read('js/screens/harbor/signs.js'), /jaywalk: '#ff4fc4'/);
  assert.match(read('css/base.css'), /\[data-theme='jaywalk'\] \{[^}]*--accent: #ff4fc4/);
  const R = await import('../js/core/match-report.js'), reg = await import('../js/games/registry.js');
  assert.equal(R.SOLO_OK.jaywalk, true); assert.ok(R.REPORT_GAMES.includes('jaywalk'));
  assert.match((read('api/report.js') + read('api/_lib/trust-lists.js')), /jaywalk: m => \(\{ room: \[`jw\/\$\{m\}`\], seal: \[\] \}\)/);
  assert.match((read('api/report.js') + read('api/_lib/trust-lists.js')), /const FLAT_PROOF = new Set\(\['prism', 'jaywalk', 'highrise'\]\);/, 'its tree is { uid: node } — GO alone proves a player');
  assert.ok(reg.PROOF_NODE_LIST.includes('jw') && reg.NEW_PLAYER_NODES.includes('jw') && !reg.ALL_PLAYER_NODES.includes('jw'), 'jw: kept as proof, out of the atomic clear (new in the rules)');
  assert.ok(reg.GAME_IDS.includes('jaywalk') && reg.META.jaywalk && reg.META.jaywalk.BANNER_NAME === 'JAYWALK', 'its thin meta at boot (THE GO-LIVE PASS)');
  const { staleProofPaths } = await import('../js/core/room-logic.js');
  assert.deepEqual(staleProofPaths({ jw: { m0: {}, m1: {}, m2: {} } }, ['m1', 'm2']), { 'jw/m0': null }, 'a rematch keeps the just-finished match\'s node (by matchId)');
  assert.match(read('js/games/lazy-view.js'), /'coastclear', 'jaywalk', 'highrise-play', 'slip'/);
  // a finished match reports (the server still refuses the game until it is playable: api/report.js#reportableGame)
  const ex = R.extractMatch({ id: 'jaywalk', matchId: 'm', phase: 'final', mode: 'match', participants: { a: true, b: true }, results: { a: { l: 90, t: 5000 }, b: { l: 40, t: 3000 } } });
  assert.deepEqual([ex.rows.a.rank, ex.rows.a.win, ex.rows.b.rank], [1, true, 2]);
  const so = R.extractMatch({ id: 'jaywalk', matchId: 'm', phase: 'final', mode: 'solo', participants: { a: true }, results: { a: { l: 0, t: 0 } } });
  assert.equal(so.rows.a.empty, 1, 'a solo run that reached no lane never counts');
});
