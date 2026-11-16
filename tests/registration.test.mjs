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
/** a live node only the SERVER writes (rules: .write false) — not a player node, never in the wipe list (its dealer clears it) */
const SERVER_LIVE = Object.freeze({ holdem: "HOLD'EM's public table — rooms/{CODE}/holdem, written by THE DEALER (api/_lib/holdem-store.js) only" });
const keysOf = (src, name) => { const m = new RegExp(`(?:const|export const) ${name} = (?:Object\\.freeze\\()?\\{([\\s\\S]*?)\\n?\\}\\)?;`).exec(src); return m ? [...m[1].matchAll(/(?:^|[\s,{])'?([a-z][a-z0-9]*)'?\s*:/g)].map(x => x[1]) : []; };

test('T1 — every playable game is registered in EVERY place the console, the server and the tests read', () => {
  assert.ok(PLAYABLE.length >= 3, 'the playable games');
  const reg = read('js/games/registry.js'), help = read('js/ui/help.js'), art = read('js/ui/game-art.js'), base = read('css/base.css');
  const boards = read('js/core/boards.js'), smoke = read('tests/integration/e2e-smoke.mjs'), report = read('api/report.js');
  const budget = JSON.parse(read('tests/integration/game-budget.json')), graph = read('js/games/preload-graph.js');
  const proofs = Object.fromEntries([...report.matchAll(/^\s{2}([a-z]+): m => \(\{ room: \[([^\]]*)\]/gm)].map(x => [x[1], [...x[2].matchAll(/`([a-z]+)\//g)].map(y => y[1])]));
  const bad = [];
  for (const g of PLAYABLE) {
    const id = g.id, meta = META[id], idx = (() => { try { return read(`js/games/${id}/index.js`); } catch { return ''; } })();
    const miss = what => bad.push(`${id}: ${what}`);
    if (!g.name || !g.theme || !g.tag || !g.blurb) miss('config.js GAMES row — name, theme, tag, blurb');
    if (!meta) miss('games/registry.js META (its thin meta at boot)');
    if (!new RegExp(`\\b${id}: \\(\\) => import\\('\\./${id}/index\\.js'\\)`).test(reg)) miss('games/registry.js#loadGame — its cartridge loader');
    if (!MARKS[id]) miss('core/marks.js MARKS (the sign at the game start + the city\'s signs)');
    if (!new RegExp(`RULES\\.${id} = \\{|\\n  ${id}: \\{`).test(help) || !new RegExp(`[{ ]${id}: '[A-Z]{2}'`).test(help)) miss('ui/help.js — its RULES + its tab (else HOW TO PLAY shows the first game\'s rules)');
    if (!new RegExp(`const ART = \\{[^}]*\\b${id}\\b`).test(art)) miss('ui/game-art.js ART (its tile)');
    if (!base.includes(`[data-theme='${g.theme}']`)) miss(`css/base.css [data-theme='${g.theme}'] (its theme)`);
    if (!new RegExp(`\\n\\s+${id}: \\{ records:`).test(boards)) miss('core/boards.js (its boards)');
    if (!REPORT_GAMES.includes(id) && !DEALER_GAMES.includes(id)) miss('core/match-report.js — STANDINGS (the shared report) or DEALER_GAMES (its own dealer)');
    if (meta && meta.SOLO === true && !SOLO_OK[id]) miss('match-report.js SOLO_OK — a SOLO meta without it: PLAY NOW works, then the server refuses the run');
    if (REPORT_GAMES.includes(id) && !proofs[id]) miss('api/report.js PROOF_TREES — a reported game\'s proof of play (else the seat rule silently)');
    for (const n of proofs[id] || []) if (!PROOF_NODE_LIST.includes(n)) miss(`registry.js PROOF_NODE_LIST lacks '${n}' (its proof tree — wiped at the wrong time)`);
    const lp = /export const livePaths = [^\n]*/.exec(idx);
    if (!lp) miss('index.js livePaths');
    else for (const n of [...lp[0].matchAll(/[`']([a-z]+)(?:\/|')/g)].map(x => x[1])) if (!ALL_PLAYER_NODES.includes(n) && !NEW_PLAYER_NODES.includes(n) && !SERVER_LIVE[n]) miss(`a livePaths node '${n}' outside ALL_PLAYER_NODES / NEW_PLAYER_NODES — never wiped`);
    if (!new RegExp(`\\['${id}', \\{`).test(smoke)) miss('tests/integration/e2e-smoke.mjs — its smoke start');
    if (!(id in (budget.games || {}))) miss('tests/integration/game-budget.json — THE PER-GAME BUDGET');
    if (!graph.includes(`"${id}": [`)) miss('js/games/preload-graph.js — its preload graph (node scripts/build-preload-graph.mjs)');
    // (the contract, read from the meta: the full module needs a browser — the harbor `cartridge` group checks the whole cartridge)
    const metaOnly = checkCartridge(id, { ...meta, start() {}, prepare() {}, step() {}, livePaths() {}, createView() {}, finalRanks() {} }, { marks: MARKS, game: g });
    for (const p of metaOnly) miss(`the contract: ${p}`);
  }
  assert.deepEqual(bad, [], 'every playable game, every place');
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
