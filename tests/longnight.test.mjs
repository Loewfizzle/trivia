// THE CITY's LONG NIGHT (Nov 12 night — docs/harbor/passes/jaywalk-cards.md Group 4): every module the scene creates is destroyed in
// scene.js#destroy() (the misses Grok's review found: the GPU fireworks, people, the gale's sea, the raid's light — + the sweep's: the 2D
// fireworks, the chimneys, the lit windows, the tower, the crossing's light); every module with canvases frees them AT ONCE (freeCanvases —
// WebKit keeps a dropped canvas's pixels until its next GC); the backdrop keeps ONE still canvas; the title STOPS the city at once (halt), its
// teardown after the fade. The live proof: the harbor `longnight` group + tests/integration/wk-longnight.mjs (WebKit, 30 + 10 trips).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { freeCanvases } from '../js/ui/canvas-safe.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const fakeCv = (w = 10, h = 10) => ({ width: w, height: h, getContext() { return null; } });

test('freeCanvases zeroes canvases, their holders, Maps / Sets / arrays / plain objects of them (two levels) — anything else untouched', () => {
  const a = fakeCv(), b = fakeCv(), c = fakeCv(), d = fakeCv(), e = fakeCv(), f = fakeCv(), g = fakeCv();
  const m = new Map([['x', a], ['y', { cv: b, ang: c }]]), arr = [{ canvas: d }], obj = { k: e, deep: { glow: f } };
  freeCanvases(m, arr, obj, g, null, 3, 'x');
  for (const [n, x] of Object.entries({ a, b, c, d, e, f, g })) assert.deepEqual([x.width, x.height], [0, 0], n);
  const notCanvas = { width: 5, height: 5 }; freeCanvases(notCanvas); assert.equal(notCanvas.width, 5, 'no getContext → not a canvas');
});

test('scene.js#destroy() destroys every module the scene creates (the long night\'s misses + the sweep) and frees the scene\'s own canvases', () => {
  const s = read('js/screens/harbor/scene.js'), d = s.slice(s.indexOf('    destroy() {'), s.indexOf('    destroy() {') + 9000);
  assert.match(d, /for \(const m of \[people, galeSea, raidFx, fw, fwx, chimneys, lights, towerFx, crossLit\]\)/);
  assert.match(d, /freeCanvases\(tri\.art, bxf\.cv, sheetV, bladeV\)/, 'the tri-vision faces + the board copies');
  for (const m of ['baker', 'litBaker', 'wild', 'sky', 'snd', 'roadLight', 'leaves', 'waterfront', 'skyBeams', 'strings', 'speak', 'centre', 'neon', 'water', 'wheel', 'beam', 'boats', 'still', 'cabStand', 'crisp', 'fx', 'clouds', 'rain', 'waterFog', 'stormDeck', 'sun', 'bb', 'moth'])
    assert.match(d, new RegExp(`\\b${m}\\.destroy\\(\\)`), `${m}.destroy()`);
  // the modules that hold canvases each have a destroy that frees them
  for (const [f, re] of [['fireworks-2d', /destroy\(\) \{ freeCanvases\(sprites\)/], ['chimneys', /destroy\(\) \{ freeCanvases\(sprites\)/], ['lights', /destroy\(\) \{ dropSpell\('destroy'\); freeCanvases\(faceDark, sets\)/],
    ['tower', /destroy\(\) \{ freeCanvases\(glowSp, dustSp, warmSp, redSp, bulbs, ghost, front\)/], ['road', /destroy\(\) \{ freeCanvases\(cv\)/], ['people', /freeCanvases\(cache, roofCache, looks\)[^\n]*kit\.destroy\(\)/],
    ['stars', /freeCanvases\(glowCache\)/], ['speakeasy', /freeCanvases\(dlMasks, awnMask\)/], ['fx', /fwx\.destroy\(\)/], ['balloons', /function destroy\(\) \{ stop\(\); freeCanvases\(flameDot\); \}/],
    ['crisp', /I\.a\.width = I\.a\.height = 0/]])
    assert.match(read(`js/screens/harbor/${f}.js`), re, f);
});

test('the title STOPS the city at once (halt: the loop + every timer — the last frame under the fade), the teardown after the fade; the backdrop keeps ONE still', () => {
  const t = read('js/screens/title.js');
  assert.match(t, /if \(sc && sc\.halt\) sc\.halt\(\);\n    wrap\.classList\.add\('is-out'\);\n    setTimeout\(\(\) => \{ sc && sc\.destroy\(\); wrap\.remove\(\); \}, 420\);/);
  assert.match(read('js/screens/harbor/scene.js'), /halt\(\) \{ destroyed = true; stop\(\); clearTimeout\(resizeT\); clearTimeout\(relayT\); clearTimeout\(extrasT\); clearInterval\(watchdog\); \}/);
  const b = read('js/screens/backdrop.js');
  assert.match(b, /const c = snap \|\| document\.createElement\('canvas'\);/, 'ONE still canvas, reused');
  assert.doesNotMatch(b, /getContext\('2d'\)/, 'through ctx2d (the memory guard counts it)');
});
