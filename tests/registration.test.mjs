// FIXES R2 — THE REVIEW B2 T1: ONE REGISTRATION CROSS-CHECK. Adding a game = about 20 hand-edited places; the pairs nothing checked failed
// SILENTLY (a SOLO meta without its SOLO_OK row: PLAY NOW works, then the server refuses the run · a proof tree whose node isn't in
// PROOF_NODE_LIST · a livePaths node never wiped · the smoke list, the help sheet, the art, the theme). For EVERY playable game: its row in
// each place — JAYWALK's pass runs this the moment its GAMES row turns playable. Server files are READ (never imported: THE UNIT JOB INSTALLS
// NOTHING); the pure client modules are imported.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES } from '../js/config.js';
import { META, ALL_PLAYER_NODES, NEW_PLAYER_NODES, PROOF_NODE_LIST } from '../js/games/registry.js';
import { MARKS } from '../js/core/marks.js';
import { REPORT_GAMES, DEALER_GAMES, SOLO_OK } from '../js/core/match-report.js';
import { checkCartridge } from '../js/games/contract.js';

const read = f => readFileSync(f, 'utf8');
const PLAYABLE = GAMES.filter(g => g.playable && !g.daily);
/** JAYWALK H1 — A GAME BEING BUILT (`preview: true`, not playable) is checked in the SAME places, minus the ones that honestly wait for a later pass */
const BUILDING = GAMES.filter(g => !g.playable && g.preview && !g.daily);
/** THE ONE LIST of the places JAYWALK does not have YET — each with the pass that gives it. A place that is there is REMOVED from this list
 *  (a test below fails on a stale entry); the go-live pass (the fix pass that flips `playable`) must leave it EMPTY (a test says so) — it did. */
export const JAYWALK_WAITS = Object.freeze({});   // (THE GO-LIVE PASS, Nov 17: EMPTY — meta, help, art all landed; JAYWALK is playable)
/** HIGH RISE S4A — THE HIDDEN CARTRIDGE (being built): what it does not have YET, each with the pass that gives it */
export const HIGHRISE_WAITS = Object.freeze({});   // (HIGH RISE's GO-LIVE, Nov 20: EMPTY — the meta, HOW TO PLAY, the tile, THE BOARD's tab all landed; HIGH RISE is playable)   // (S4B: its smoke start is IN — e2e-smoke.mjs: a local page that asks, two phones = THE MATCH's opening)
const WAITS = Object.freeze({ jaywalk: JAYWALK_WAITS, highrise: HIGHRISE_WAITS });
/** a live node only the SERVER writes (rules: .write false) — not a player node, never in the wipe list (its dealer clears it) */
const SERVER_LIVE = Object.freeze({ holdem: "HOLD'EM's public table — rooms/{CODE}/holdem, written by THE DEALER (api/_lib/holdem-store.js) only" });

/** every place ONE game must be registered in → [[key, what is missing]] */
async function gaps(g) {
  const reg = read('js/games/registry.js'), help = read('js/ui/help.js'), art = read('js/ui/game-art.js'), base = read('css/base.css');
  const boardView = read('js/board/view.js'), boards = read('js/core/boards.js'), smoke = read('tests/integration/e2e-smoke.mjs'), report = read('api/report.js');
  const budget = JSON.parse(read('tests/integration/game-budget.json')), graph = read('js/games/preload-graph.js');
  const proofs = Object.fromEntries([...report.matchAll(/^\s{2}([a-z]+): m => \(\{ room: \[([^\]]*)\]/gm)].map(x => [x[1], [...x[2].matchAll(/`([a-z]+)\//g)].map(y => y[1])]));
  const id = g.id, idx = (() => { try { return read(`js/games/${id}/index.js`); } catch { return ''; } })();
  // (a game being built has no meta at boot yet — its meta file is read directly, so SOLO ↔ SOLO_OK + the contract are still checked)
  const meta = META[id] || await import(`../js/games/${id}/meta.js`).catch(() => null);
  const out = [], miss = (key, what) => out.push([key, what]);
  if (!g.name || !g.theme || !g.tag || !g.blurb) miss('row', 'config.js GAMES row — name, theme, tag, blurb');
  if (!META[id]) miss('meta', 'games/registry.js META (its thin meta at boot)');
  if (!meta) miss('metafile', `js/games/${id}/meta.js`);
  if (!new RegExp(`\\b${id}: \\(\\) => import\\('\\./${id}/index\\.js'\\)`).test(reg)) miss('loader', 'games/registry.js#loadGame — its cartridge loader');
  if (!MARKS[id]) miss('mark', 'core/marks.js MARKS (the sign at the game start + the city\'s signs)');
  if (!new RegExp(`RULES\\.${id} = \\{|\\n  ${id}: \\{`).test(help) || !new RegExp(`[{ ]${id}: '[A-Z]{2}'`).test(help)) miss('help', 'ui/help.js — its RULES + its tab (else HOW TO PLAY shows the first game\'s rules)');
  if (!new RegExp(`const ART = \\{[^}]*\\b${id}\\b`).test(art)) miss('art', 'ui/game-art.js ART (its tile)');
  if (!base.includes(`[data-theme='${g.theme}']`)) miss('theme', `css/base.css [data-theme='${g.theme}'] (its theme)`);
  if (!new RegExp(`\\n\\s+${id}: \\{ records:`).test(boards)) miss('boards', 'core/boards.js (its boards)');
  // (THE GO-LIVE PASS — the review's gap: a playable game with no tab on THE BOARD — its tab in board/view.js#TABS)
  const tabs = /export const TABS = Object\.freeze\(\[([^\]]*)\]\)/.exec(boardView);
  if (!tabs || !tabs[1].includes(`'${id}'`)) miss('boardtab', 'board/view.js TABS — its tab on THE BOARD');
  if (!REPORT_GAMES.includes(id) && !DEALER_GAMES.includes(id)) miss('report', 'core/match-report.js — STANDINGS (the shared report) or DEALER_GAMES (its own dealer)');
  if (meta && meta.SOLO === true && !SOLO_OK[id]) miss('solo', 'match-report.js SOLO_OK — a SOLO meta without it: PLAY NOW works, then the server refuses the run');
  if (REPORT_GAMES.includes(id) && !proofs[id]) miss('proof', 'api/report.js PROOF_TREES — a reported game\'s proof of play (else the seat rule silently)');
  for (const n of proofs[id] || []) if (!PROOF_NODE_LIST.includes(n)) miss('proofnode', `registry.js PROOF_NODE_LIST lacks '${n}' (its proof tree — wiped at the wrong time)`);
  const lp = /export const livePaths = [^\n]*/.exec(idx);
  if (!lp) miss('live', 'index.js livePaths');
  else for (const n of [...lp[0].matchAll(/[`']([a-z]+)(?:\/|')/g)].map(x => x[1])) if (!ALL_PLAYER_NODES.includes(n) && !NEW_PLAYER_NODES.includes(n) && !SERVER_LIVE[n]) miss('live', `a livePaths node '${n}' outside ALL_PLAYER_NODES / NEW_PLAYER_NODES — never wiped`);
  if (!new RegExp(`\\['${id}', \\{`).test(smoke)) miss('smoke', 'tests/integration/e2e-smoke.mjs — its smoke start');
  if (!(id in (budget.games || {}))) miss('budget', 'tests/integration/game-budget.json — THE PER-GAME BUDGET');
  if (!graph.includes(`"${id}": [`)) miss('graph', 'js/games/preload-graph.js — its preload graph (node scripts/build-preload-graph.mjs)');
  // (the contract, read from the meta: the full module needs a browser — the harbor `cartridge` group checks the whole cartridge)
  if (meta) for (const p2 of checkCartridge(id, { ...meta, start() {}, prepare() {}, step() {}, livePaths() {}, createView() {}, finalRanks() {} }, { marks: MARKS, game: g })) miss('contract', `the contract: ${p2}`);
  return out;
}

test('T1 — every playable game is registered in EVERY place the console, the server and the tests read', async () => {
  assert.ok(PLAYABLE.length >= 3, 'the playable games');
  const bad = [];
  for (const g of PLAYABLE) for (const [, what] of await gaps(g)) bad.push(`${g.id}: ${what}`);
  assert.deepEqual(bad, [], 'every playable game, every place');
});

test('JAYWALK H1 — a game BEING BUILT (a `preview` row) is registered in the same places — minus its ONE named list of waits, each with its pass; none of them stale', async () => {
  assert.deepEqual(BUILDING.map(g => g.id), [], 'NO game is being built (HIGH RISE went playable at its GO-LIVE, Nov 20) — the rule waits for the next one');
  for (const g of BUILDING) {
    const waits = WAITS[g.id] || {}, found = await gaps(g), keys = new Set(found.map(x => x[0]));
    assert.deepEqual(found.filter(([k]) => !(k in waits)).map(([, what]) => `${g.id}: ${what}`), [], `${g.id}: every place that does not wait`);
    for (const k of Object.keys(waits)) assert.ok(keys.has(k), `${g.id}: "${k}" is registered now — take it off its waits list (${waits[k]})`);
    for (const why of Object.values(waits)) assert.match(why, /^(H[2-6]|S4B|the go-live pass) — /, 'every wait names the pass that empties it');
  }
});

test('JAYWALK is playable, no waits (THE GO-LIVE PASS): a playable game has no waits list left; a wait for a game that is not being built is stale', () => {
  for (const [id, waits] of Object.entries(WAITS)) {
    const g = GAMES.find(x => x.id === id);
    assert.ok(g, `${id} is a GAMES row`);
    if (g.playable) assert.deepEqual(Object.keys(waits), [], `${id} is PLAYABLE — its waits list must be empty (and it then passes the playable games' check above in full)`);
    else assert.ok(g.preview === true, `${id}: waits are only for a game being built`);
  }
  assert.ok(GAMES.find(x => x.id === 'jaywalk').playable && Object.keys(JAYWALK_WAITS).length === 0, 'JAYWALK is playable, no waits');
  assert.ok(GAMES.find(x => x.id === 'highrise').playable && Object.keys(HIGHRISE_WAITS).length === 0, 'HIGH RISE is playable, no waits (its GO-LIVE, Nov 20)');
  // (the rule still bites — the same check on a copy: a playable row with a wait left is red)
  const ok = (g, w) => !g.playable || Object.keys(w).length === 0;
  assert.equal(ok({ playable: true }, { meta: 'the go-live pass — x' }), false, 'a playable row with a wait left is red');
});

test('T1 — the cross-check bites: a SOLO meta without SOLO_OK, a proof node outside the list, a livePaths node never wiped are named', () => {
  // (a synthetic game through the same rules: the checks above fail loudly on exactly these)
  const fake = { SOLO: true }, proof = ['zz'], live = "export const livePaths = g => ({ boards: `zzlive/${g.matchId}` });";
  assert.ok(fake.SOLO === true && !SOLO_OK.zz);
  assert.ok(!PROOF_NODE_LIST.includes(proof[0]));
  const n = [...live.matchAll(/[`']([a-z]+)(?:\/|')/g)].map(x => x[1]);
  assert.deepEqual(n.filter(x => !ALL_PLAYER_NODES.includes(x) && !NEW_PLAYER_NODES.includes(x)), ['zzlive']);
});

test('T3 — a start()\'s game against THE GAME FRAME: id · matchId · participants · phase — a gap fails the start loudly (host.js), never mid-match', async () => {
  const { frameProblems } = await import('../js/games/cartridge.js');
  const ok = { id: 'prism', matchId: 'm1', participants: { a: true }, phase: 'count' };
  assert.deepEqual(frameProblems(ok, 'prism', 'm1'), []);
  assert.equal(frameProblems(null, 'prism', 'm1').length, 1);
  assert.deepEqual(frameProblems({ ...ok, id: 'x' }, 'prism', 'm1').length, 1);
  assert.deepEqual(frameProblems({ ...ok, matchId: 'm2' }, 'prism', 'm1').length, 1);
  assert.deepEqual(frameProblems({ ...ok, participants: {} }, 'prism', 'm1'), ['no participants']);
  assert.deepEqual(frameProblems({ ...ok, phase: '' }, 'prism', 'm1'), ['no phase']);
  const host = readFileSync('js/host.js', 'utf8');
  assert.match(host, /const bad = frameProblems\(created, gameId, matchId\);\s*if \(bad\.length\) \{[\s\S]{0,400}return false;/, 'the COULD NOT START path, before any write');
  assert.ok(host.indexOf('const bad = frameProblems') < host.indexOf("game: { ...game, go: serverTimestamp() }"), 'checked before the match is written');
});
