// LOAD FIX 2 — THE BOOT PRELOAD (scripts/build-boot-preload.mjs): index.html's generated list of every module the first picture needs,
// asked for at once (no import waterfall). Stale = a module added / moved without re-running the builder → this fails.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { withPreload, preloadList, ENTRIES } from '../scripts/build-boot-preload.mjs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('THE BOOT PRELOAD in index.html is current (node scripts/build-boot-preload.mjs)', () => {
  assert.equal(withPreload(html), html, 'index.html: THE BOOT PRELOAD is stale — run node scripts/build-boot-preload.mjs');
});

test('THE BOOT PRELOAD: every listed module exists, the city + its entries are in, the sheets go first', () => {
  const list = preloadList();
  for (const f of list) assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${f} missing`);
  for (const e of ENTRIES) assert.ok(list.includes(e), `${e} not preloaded`);
  // (after the core sheets: the preloads are asked for once the four are in — index.html's __cssDone calls window.__bootPre)
  assert.ok(html.indexOf('BOOT PRELOAD (GENERATED') > html.indexOf('href="css/title.css"'), 'the preload block sits after the core sheets');
  assert.match(html, /__cssDone = function \(l\) \{[^\n]*__bootPre/, '__cssDone hands on to THE BOOT PRELOAD');
});
