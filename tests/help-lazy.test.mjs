// CITY I — HOW TO PLAY OUT OF THE BOOT: js/ui/help.js (every game's rules, ~28 KB) is a LAZY chunk — no module of THE BOOT's graph (js/app.js +
// THE BOOT PRELOAD's entries) imports it statically; every caller goes through ui/help-open.js (THE SKEW WRAPPER, the frame at the tap, the
// retry); the title pre-warms it after the reveal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { preloadList } from '../scripts/build-boot-preload.mjs';

const ROOT = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, ROOT), 'utf8');

test('CITY I: help.js is NOT in the boot graph (nor in THE BOOT PRELOAD) — help-open.js is', () => {
  const list = preloadList();
  assert.ok(!list.includes('js/ui/help.js'), 'js/ui/help.js rides the boot again — import it through ui/help-open.js');
  assert.ok(list.includes('js/ui/help-open.js'), 'the opener is the boot\'s');
});

test('CITY I: no module anywhere imports help.js statically — only help-open.js loads it, through lazyImport', () => {
  const STATIC = /(?:^|[\s;}])(?:import|export)\s+(?:[\w*{}\s,$]+\s+from\s+)?['"]([^'"]*\/help\.js|\.\/help\.js)['"]/m;
  const bad = [];
  const walk = d => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js') && STATIC.test(readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1'))) bad.push(p); } };
  walk(new URL('js', ROOT).pathname.replace(/^\/(\w:)/, '$1'));
  assert.deepEqual(bad, [], `a static import of help.js: ${bad.join(', ')}`);
  const op = read('js/ui/help-open.js');
  assert.match(op, /lazyImport\(import\('\.\/help\.js'\), '\.\/help\.js'\)/, 'the opener loads help.js through THE SKEW WRAPPER');
  assert.match(op, /TAP TO RETRY/, 'a failed load shows TAP TO RETRY');
  assert.match(op, /reportError\(/, '…and is reported');
  assert.match(read('js/screens/title.js'), /warmHelpSoon\(/, 'the title pre-warms it after the reveal');
});
