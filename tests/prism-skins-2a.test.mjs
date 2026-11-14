// SKINS 2A — PRISM DROP: THE WATERCOLOR REWORK + THE CRAYON's TEXTURE + THE TIER STEP (docs/games/plan.md "SKINS 2A"; docs/prism.md "THE SKINS").
//   WATERCOLOR  no dark outline (no line is stroked round a block: the edge is a pooled BAND), a lighter middle, blotches of a close hue that stay
//               in the piece's colour family, a bloom on 2 of the 6 variants, THE BLEED where two different colours touch (seamAt — PURE, the
//               same on every phone; painted in the board's cached stack layer through the skin's optional `seams` hook — never per frame)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hexRgb, rgbHsl, hueDiff } from '../js/games/prism/neon.js';
import { JEWEL } from '../js/games/prism/skin-kit.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const hue = hex => rgbHsl(hexRgb(hex))[0];
const fnBody = (src, name) => { const a = src.indexOf(`function ${name}(`); assert.ok(a >= 0, name); const b = src.indexOf('\n}\n', a); return src.slice(a, b); };

test('WATERCOLOR: NO DARK OUTLINE — a block strokes no crisp line: its edge is the pooled band (wide soft passes), in the colour\'s own deeper shade', () => {
  const src = read('js/games/prism/water-art.js'), block = fnBody(src, 'blockArt');
  assert.doesNotMatch(block, /setLineDash|lineDashOffset/, 'no dashed hard edge');
  assert.doesNotMatch(block, /Math\.max\(1, size \* 0\.0[0-3]\d*\)/, 'no hairline');
  const widths = [...block.matchAll(/for \(const \[w, a\] of (\[\[.*?\]\])\)/g)].map(m => JSON.parse(m[1]));
  assert.ok(widths.length >= 1, 'the pooling passes');
  for (const [w, a] of widths[0]) { assert.ok(w >= 0.05, `a pooling pass is a band (${w} of the cell), never a line`); assert.ok(a <= 0.25, `each pass is faint (${a})`); }
  assert.match(block, /squircle\(x, cx, cy, half \* k, seeded\(v \* 131 \+ 5\), 0\.028, 8\.5\)/, 'a brushed square — not a round blob');
  assert.doesNotMatch(block, /255,255,255/, 'no white highlight: the lighter middle is the PAPER through the paint');
  assert.match(block, /destination-out/, 'the paint itself is lifted in the middle');
  // the pooled shade stays the colour (never near-black)
  const m = /export const poolOf = hex => mixHex\(hex, DEEP, (0\.\d+)\);/.exec(src);
  assert.ok(m && Number(m[1]) <= 0.34, 'the pooled shade: at most a third toward the deep');
  // the ghost: a wash ring in the piece's own colour — no pencil line
  const ghost = fnBody(src, 'ghostArt');
  assert.doesNotMatch(ghost, /PENCIL/);
  assert.match(ghost, /function ghostArt\(size, col, pool\)/);
});

test('WATERCOLOR: a bloom on 2 of the 6 variants; the wet-in-wet neighbours stay inside each piece\'s colour family', async () => {
  // (the art module needs no DOM until a sprite is drawn)
  const W = await import('../js/games/prism/water-art.js');
  assert.equal(W.VARIANTS, 6);
  assert.deepEqual(Object.keys(W.BLOOMS).map(Number).filter(v => v >= 0 && v < 6).length, 2);
  for (let t = 1; t <= 7; t++) {
    assert.ok(Math.abs(hueDiff(hue(JEWEL[t]), hue(W.WATER[t]))) <= 20, `piece ${t}'s paint`);
    for (const n of W.WATER_NEAR[t]) assert.ok(Math.abs(hueDiff(hue(W.WATER[t]), hue(n))) <= 42, `piece ${t}: ${n} is a NEIGHBOUR of ${W.WATER[t]} (${Math.round(hueDiff(hue(W.WATER[t]), hue(n)))}°)`);
    assert.ok(Math.abs(hueDiff(hue(W.WATER[t]), hue(W.WATER_POOL[t]))) <= 20, `piece ${t}'s pooled shade keeps its hue`);
  }
});

test('THE BLEED: seamAt is PURE + by place (≈ 3 seams in 5, three shapes); the skin paints it through the optional `seams` hook in the cached stack layer', async () => {
  const W = await import('../js/games/prism/water-art.js');
  let on = 0, n = 0; const shapes = new Set();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 10; x++) for (const flat of [false, true]) { const k = W.seamAt(x, y, flat); assert.equal(k, W.seamAt(x, y, flat)); assert.ok(k >= 0 && k <= 3); n++; if (k) { on++; shapes.add(k); } }
  assert.ok(on / n > 0.45 && on / n < 0.75, `${on} of ${n} seams bleed`);
  assert.equal(shapes.size, 3);
  const board = read('js/games/prism/board.js'), skins = read('js/games/prism/skins.js');
  // (inside the stack layer's rebuild — between the cells' loop and `ctx = main` — so it costs nothing in a frame)
  assert.match(board, /if \(t\) drawCell\(x, y, t, grey, 0\);\n        \}\n        if \(skin\.seams\) skin\.seams\(ctx, \{ cells, px, sy, grey \}\);[^\n]*\n        ctx = main;/);
  assert.equal((board.match(/skin\.seams/g) || []).length, 2, 'one generic call — no skin named');
  const wc = skins.slice(skins.indexOf('const watercolor = {'), skins.indexOf('const paper = {'));
  assert.match(wc, /seams\(ctx, \{ cells, px, sy, grey = 0 \}\) \{/);
  assert.match(wc, /r && r !== t \? seamAt\(x, y, false\) : 0/, 'only where two DIFFERENT colours touch');
  assert.doesNotMatch(wc, /filter\s*=|blur\(/, 'no blur (Safari has no canvas filter; nothing per frame)');
  for (const id of ['crayon', 'paper', 'neon']) { const a = skins.indexOf(`const ${id} = {`); assert.doesNotMatch(skins.slice(a, skins.indexOf('\n};', a)), /seams\(/, `${id} paints no seams`); }
});
