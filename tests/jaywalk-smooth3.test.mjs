// JAYWALK SMOOTH 3 — what must hold (docs/jaywalk.md "SMOOTH 3"): no blend, filter or backdrop layer over or grouped with the 3D canvas unless it
// visibly does something, and then isolated from it. The compositor's own count: `jaywalk-lab.mjs --smooth=passes`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const css = read('css/jaywalk.css').replace(/\/\*[\s\S]*?\*\//g, '');
const rulesWith = prop => css.split('}').filter(r => r.includes(prop)).map(r => r.trim());

test('THE BLEND LAYER: only at the looks that tint, never at a clear noon, never at opacity 0', () => {
  const R = rulesWith('mix-blend-mode');
  assert.equal(R.length, 1, 'one blend rule in the game\'s css');
  const sel = R[0].slice(0, R[0].indexOf('{')).split(',').map(s => s.trim());
  assert.deepEqual(sel.map(s => /\[data-(?:tod|wx)='(\w+)'\]::after$/.exec(s)?.[1]).sort(), ['golden', 'overcast', 'sunrise', 'sunset']);
  for (const s of sel) assert.match(s, /^\.jw-skyline\[data-look='day'\]/);
  assert.doesNotMatch(R[0], /opacity:\s*0\s*;/);
});

test('THE BLEND LAYER: the band is its own blend group, so the canvas is never in it', () => {
  assert.match(css, /\.jw-skyline \{ isolation: isolate; \}/);
});

test('nothing else blends or blurs what is behind it over the canvas', () => {
  assert.equal(rulesWith('backdrop-filter').length, 0);
  // (the one filter over the whole scene is the daily's start veil: the scene has stopped drawing under it)
  const over = rulesWith('filter:').filter(r => /\.jw-(stage|play)\b/.test(r.slice(0, r.indexOf('{'))));
  assert.equal(over.length, 1);
  assert.match(over[0], /^\.jw-stage\.is-veiled \.jw-play/);
});

test('&blend=old is the lab\'s alone, and put before the game\'s css so the tints still win', () => {
  const lab = read('js/games/jaywalk/lab.js');
  assert.match(lab, /Q\.get\('blend'\) === 'old'/);
  assert.match(lab, /document\.head\.prepend\(s\)/);
  for (const f of ['js/games/jaywalk/view.js', 'js/games/jaywalk/night.js', 'js/games/jaywalk/index.js']) assert.doesNotMatch(read(f), /blend=old|BLEND_OLD/);
});

test('the app\'s animated background stops behind a full-screen stage, and comes back when the game leaves', () => {
  assert.match(css, /@media \(max-aspect-ratio: 62\/100\) \{ body\.jw-on \.bg \{ display: none; \} \}/);
  const view = read('js/games/jaywalk/view.js');
  assert.match(view, /el\.replaceChildren\(root\); document\.body\.classList\.add\('jw-on'\)/);
  assert.match(view, /unmount\(\) \{\s+gone = true;[^\n]*document\.body\.classList\.remove\('jw-on'\)/);
});
