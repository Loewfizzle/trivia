// LOAD FIX 2 — THE BOOT BUDGET (static): every module the first picture needs (THE BOOT PRELOAD's list) — its count + its bytes — under
// tests/integration/boot-budget.json. A pass that grows the boot past it raises the budget ON PURPOSE (and says so in its summary);
// the browser half (requests + bytes on the wire + no audio before the reveal) is the harbor `load` group's THE BOOT BUDGET check.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { preloadList } from '../scripts/build-boot-preload.mjs';

const B = JSON.parse(readFileSync(new URL('./integration/boot-budget.json', import.meta.url), 'utf8'));

test('THE BOOT BUDGET: the modules before the reveal — count + bytes under tests/integration/boot-budget.json', () => {
  const files = ['js/app.js', ...preloadList()];
  const kb = files.reduce((s, f) => s + statSync(new URL(`../${f}`, import.meta.url)).size, 0) / 1024;
  assert.ok(files.length <= B.modules, `${files.length} modules before the reveal > the budget ${B.modules} — move what the first picture doesn't need behind the reveal, or raise the budget on purpose`);
  assert.ok(kb <= B.moduleKB, `${kb.toFixed(0)} KB of modules before the reveal > the budget ${B.moduleKB} KB`);
});

test('THE BOOT BUDGET: no game cartridge or game screen in the boot (the console never names a game)', () => {
  const list = preloadList();
  const games = list.filter(f => /^js\/games\/[a-z]+\/(index|view)\.js$/.test(f));
  assert.deepEqual(games, [], `a game's cartridge in the boot: ${games.join(', ')}`);
});
