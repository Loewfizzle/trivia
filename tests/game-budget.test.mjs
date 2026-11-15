// CITY A — item 15, A GAME COSTS NOTHING UNTIL IT'S PICKED — THE PER-GAME BUDGET: what a phone fetches for THE CITY + ONE game (the boot graph
// + that cartridge's whole graph past it — js/games/preload-graph.js, the list the lobby wires for the PICKED game only). Each game's modules +
// raw KB stay under its line in tests/integration/game-budget.json; RAISING ONE IS A DECISION a pass names in its summary (like THE BOOT BUDGET).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { bootGraph } from '../scripts/boot-bytes.mjs';
import { PRELOAD } from '../js/games/preload-graph.js';

const BUDGET = JSON.parse(readFileSync('tests/integration/game-budget.json', 'utf8'));
test('THE PER-GAME BUDGET: the city + one game — modules + KB under each game\'s line (game-budget.json)', () => {
  const boot = bootGraph().rows, bootKB = boot.reduce((s, r) => s + r.b, 0) / 1024;
  const rows = [];
  for (const [id, files] of Object.entries(PRELOAD)) {
    const kb = files.reduce((s, f) => s + statSync(f).size, 0) / 1024, B = BUDGET.games[id];
    assert.ok(B, `${id} has a line in game-budget.json`);
    rows.push(`${id}: city ${boot.length} + ${files.length} modules = ${boot.length + files.length} · ${Math.round(bootKB + kb)} KB (the game alone ${files.length} / ${Math.round(kb)} KB)`);
    assert.ok(boot.length + files.length <= B.modules, `${id}: ${boot.length + files.length} modules > its budget ${B.modules}`);
    assert.ok(bootKB + kb <= B.kb, `${id}: ${Math.round(bootKB + kb)} KB > its budget ${B.kb}`);
  }
  console.log(rows.join('\n'));
});
test('the lobby never wires every cartridge — only the picked one (room-city.js#pickedGame)', () => {
  assert.doesNotMatch(readFileSync('js/screens/room-city.js', 'utf8'), /Object\.keys\(R\.META\)\) P\.wireGame/);
});
