// HIGH RISE — THE GO-LIVE (Nov 20 2026 — docs/games/passes/highrise-golive.md; the owner's calls: docs/games/plan.md "HIGH RISE — THE GO-LIVE").
// The pins of the flip that are not the cartridge's own (tests/highrise-cartridge.test.mjs "PLAYABLE"): HOW TO PLAY's kid standard, THE SIGN
// HOLD, THE BOARD's seventh tab, NEW on top of the games list, the weekly goal's pool, the two cards out of THE LAB, the credits group, the lab
// page gone, the share card's new type.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { GAMES } from '../js/config.js';
import { SIGN_HOLD, signRoster } from '../js/core/harbor-neon.js';
import { shelfOrder, isNew } from '../js/core/game-order.js';
import { hiRunCard, POSTER_L } from '../js/games/highrise/share.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('HOW TO PLAY: RULES.highrise in ui/help.js — one line + two short sections, lines a kid can read, one drawing each, true to the rules', () => {
  const help = read('js/ui/help.js');
  const blk = help.slice(help.indexOf('RULES.highrise = {'), help.indexOf('RULES.highrise.pics = ['));
  const goal = /goal: '([^']+)'/.exec(blk)[1];
  const titles = [...blk.matchAll(/^ {4}\['([A-Z ]+)', \[$/gm)].map(x => x[1]);
  const lines = [...blk.matchAll(/^ {6}'([^']+)',$/gm)].map(x => x[1]);
  assert.ok(goal.length <= 70 && titles.length === 2, 'one line + two short sections');
  for (const t of lines) assert.ok(t.length <= 52 && /^[A-Z0-9]/.test(t), `a kid's line: ${t}`);
  assert.equal(lines.length, 11);
  const all = lines.join(' ');
  for (const w of ['TAP', 'CUT OFF', 'PERFECT', 'GROWS BACK', 'SPACE or ENTER', 'MISSED THE STACK', 'SLIPPED OFF', 'TOO SLOW', 'No pause', 'tallest tower wins', '6:00', 'MOTHERSHIP']) assert.ok(all.includes(w), `the rules say ${w}`);
  const pics = help.slice(help.indexOf('RULES.highrise.pics = ['), help.indexOf('const LEGEND = ['));
  assert.equal((pics.match(/svg\('/g) || []).length, 11, 'one drawing a line');
  assert.match(help, /const TAB = \{ jaywalk: 'JW', highrise: 'HR',/, 'its tab');
});

test('THE SIGN HOLD: HIGH RISE playable and on NO city sign (the roster every sign, the billboard, the blades + the ghost ad read) until THE CITY PASS lifts it', () => {
  assert.deepEqual(SIGN_HOLD, ['highrise']);
  assert.ok(GAMES.find(g => g.id === 'highrise').playable);
  assert.ok(!signRoster(GAMES).some(g => g.id === 'highrise'), 'not in the roster');
  assert.deepEqual(signRoster(GAMES).map(g => g.id).sort(), ['holdem', 'jaywalk', 'overclock', 'prism']);
  // the neon takes the roster (never its own `playable` filter) — the scene hands it the same; the ghost ad + the blades read signGames
  assert.match(read('js/screens/harbor/neon.js'), /const games = signRoster\(allGames\)\.map/);
  const scene = read('js/screens/harbor/scene.js');
  assert.match(scene, /const signGames = signRoster\(games\);/); assert.match(scene, /createNeon\(\{ games: signGames,/); assert.match(scene, /const playable = signGames;/);
  // nothing in the city names HIGH RISE on its own (the trivision's faces are its own list: HOLD'EM · JAYWALK · THE DROP)
  for (const f of ['js/core/harbor-trivision.js', 'js/core/harbor-speakeasy.js', 'js/screens/harbor/signs.js', 'js/screens/harbor/speakeasy-blade.js']) assert.doesNotMatch(read(f), /highrise/i, `${f}`);
});

test('THE GAMES LIST: HIGH RISE on TOP with NEW from its go-live day (the newest NEW first, above JAYWALK) for 14 days', () => {
  const g = GAMES.find(x => x.id === 'highrise');
  assert.equal(g.live, '2026-11-20');
  assert.ok(isNew(g.live, '2026-11-20') && isNew(g.live, '2026-12-03') && !isNew(g.live, '2026-12-04'));
  const at = Date.UTC(2026, 10, 20, 18);   // (Nov 20, 1 pm in New York — past the 4 am line)
  const list = shelfOrder(GAMES.filter(x => x.playable), ['prism', 'overclock', 'holdem', 'jaywalk'], at);
  assert.deepEqual(list.slice(0, 2).map(x => [x.id, x.isNew]), [['highrise', true], ['jaywalk', true]], 'HIGH RISE first, NEW');
});

test('THE BOARD: its own tab (the seventh) on TALLEST TOWER; the weekly goal\'s pool takes it (a playable game)', () => {
  assert.match(read('js/board/view.js'), /export const TABS = Object\.freeze\(\['xp', 'dailies', 'overclock', 'prism', 'holdem', 'jaywalk', 'highrise'\]\);/);
  assert.match(read('js/board/view.js'), /highrise: \['#ff4fd8', '#35e3ff'\]/);
  assert.match(read('js/core/boards.js'), /highrise: \{ records: \[rec\('highrise-solo', 'TALLEST TOWER', 'floor'/);
});

test('THE TWO CARDS: out of THE LAB (the owner: their marks removed) — their art ships as it is; their tiers kept', () => {
  const cat = read('js/vault/catalog.js'), appr = read('js/vault/approved.js');
  for (const id of ['card-abovetheclouds', 'card-topoftheworld']) {
    assert.ok(!cat.includes(`{ id: '${id}'`) && !cat.includes(`{ id: 'full-${id}'`), `${id}: no lab row`);
    assert.ok(appr.includes(`'${id}'`) && appr.includes(`'full-${id}'`), `${id}: shipped (strip + full card)`);
  }
  assert.match(read('js/vault/strip.js'), /\|\| SHIPPED_TIERS\[id\] \|\| 'common'/);
});

test('THE CREDITS: a HIGH RISE group — the F-22\'s CC BY 4.0 line (REQUIRED) + the Blackbird + the UFO (CC BY) + the sounds', () => {
  const c = read('js/ui/credits.js');
  assert.match(c, /group: 'HIGH RISE', title: 'HIGH RISE — 3D models: the F-22', by: 'This work is based on "F22 Raptor FREE" \(https:\/\/sketchfab\.com\/3d-models\/f22-raptor-free-2a64abf0866a405c865466c7642ca689\) by NLM/);
  assert.match(c, /group: 'HIGH RISE', title: 'HIGH RISE — 3D models: the Blackbird'/); assert.match(c, /group: 'HIGH RISE', title: 'HIGH RISE — 3D models: the UFO'/);
});

test('THE LAB PAGE IS GONE (/highrise-lab — the owner, at the go-live): no page, no files, not served; the unlisted test page /highrise-play stays and never counts', () => {
  for (const f of ['highrise-lab.html', 'js/games/highrise/lab.js', 'js/games/highrise/graybox.js', 'css/highrise.css']) assert.ok(!existsSync(new URL(`../${f}`, import.meta.url)), `${f} deleted`);
  assert.doesNotMatch(read('scripts/serve.mjs'), /highrise-lab/); assert.doesNotMatch(read('tests/integration/kit/page-loads.mjs'), /highrise-lab/);
  assert.ok(existsSync(new URL('../highrise-play.html', import.meta.url)), 'the test page stays');
});

test('THE SHARE CARD\'S TYPE: "10 FLOORS" on one row, the band on its own pink line (the gold finish the same in gold)', () => {
  const c = hiRunCard({ floor: 10, perfects: 7, cause: 'miss', name: 'BEN' });
  assert.deepEqual([c.big, c.bigUnit, c.band, c.sub], ['10', 'FLOORS', 'THE ROOFTOPS', undefined]);
  assert.ok(POSTER_L.unitPx >= 64 && POSTER_L.bandPx >= 60 && POSTER_L.bandY > POSTER_L.bigY, 'FLOORS + the band big enough to read at 300 px');
  const src = read('js/games/highrise/share.js');
  assert.match(src, /lit\.push\(neon\(card\.band \|\| '', W \/ 2, L\.bandY, \{ px: L\.bandPx, glow: gold \? GOLD : PINK,/, 'the band PINK (gold on the finish)');
  assert.match(src, /lit\.push\(neon\(unit, ux \+ uw \/ 2 - uls \/ 2, L\.bigY,/, 'FLOORS on the number\'s baseline, right of it');
});
