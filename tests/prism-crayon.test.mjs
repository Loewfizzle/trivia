// PRISM DROP — THE DAY LOOK's crayons + papers (PD-4): every crayon stays in its piece's COLOUR FAMILY (the PD-3 hue-family test), the pieces
// stay apart, every crayon reads on EVERY paper (its fill clearly off the paper, its outline ≥ 3:1), the pages' text ≥ 4.5:1; the paper is dealt
// per match — the same for everyone (from the game), a rotation through all four, never twice in a row.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRAYON, CRAYON_LINE, GRAPHITE, PAPERS, paperOf, pickPaper, contrast } from '../js/games/prism/crayon.js';
import { hexRgb, rgbHsl, hueDiff, deltaE } from '../js/games/prism/neon.js';
import { JEWEL } from '../js/games/prism/board.js';

const hue = hex => rgbHsl(hexRgb(hex))[0];

test('every crayon is in its piece’s colour family (hue within ±15° of its JEWEL hue — the night’s family)', () => {
  for (let t = 1; t <= 7; t++) {
    const d = Math.abs(hueDiff(hue(JEWEL[t]), hue(CRAYON[t])));
    assert.ok(d <= 15, `crayon ${t}: ${CRAYON[t]} is ${d.toFixed(1)}° off its family`);
    // the outline is the same crayon pressed harder — the same family
    assert.ok(Math.abs(hueDiff(hue(JEWEL[t]), hue(CRAYON_LINE[t]))) <= 15, `outline ${t}`);
  }
});

test('the crayons stay clearly apart (every pair ≥ ΔE 18, junk ≥ 25 from every piece)', () => {
  for (let a = 1; a <= 7; a++) for (let b = a + 1; b <= 7; b++) assert.ok(deltaE(CRAYON[a], CRAYON[b]) >= 18, `${a} + ${b}: ΔE ${deltaE(CRAYON[a], CRAYON[b]).toFixed(1)}`);
  for (let t = 1; t <= 7; t++) assert.ok(deltaE(CRAYON[8], CRAYON[t]) >= 25, `junk vs ${t}`);
});

test('every crayon reads on every paper: the fill ≥ ΔE 25 off the paper, the outline ≥ 3:1 against it', () => {
  for (const p of PAPERS) {
    for (let t = 1; t <= 8; t++) {
      const e = deltaE(CRAYON[t], p.base);
      assert.ok(e >= 25, `${p.id}: crayon ${t} fill ΔE ${e.toFixed(1)}`);
      const c = contrast(CRAYON_LINE[t], p.base);
      assert.ok(c >= 3, `${p.id}: crayon ${t} outline ${c.toFixed(2)}:1`);
    }
    // the page's text (the top line, the labels) ≥ 4.5:1; the pencil (the frame, the ghost) ≥ 3:1
    assert.ok(contrast(p.ink, p.base) >= 4.5, `${p.id}: ink ${contrast(p.ink, p.base).toFixed(2)}`);
    assert.ok(contrast(GRAPHITE, p.base) >= 3, `${p.id}: graphite`);
  }
});

test('the paper is the game’s: the same on every phone, from the host’s deal (or the seed for an older game)', () => {
  assert.equal(paperOf({ pp: 2, seed: 'x' }).id, 'construction');
  assert.equal(paperOf({ seed: 'abc' }), paperOf({ seed: 'abc' }));
  assert.ok(PAPERS.includes(paperOf({ seed: 'abc' })));
  assert.ok(PAPERS.includes(paperOf(null)));
  assert.equal(paperOf({ pp: 9, seed: 'abc' }), paperOf({ seed: 'abc' }));   // (an unknown deal → the seed's)
});

test('the deal: a rotation through all four papers, never the same twice in a row, the key marks the night', () => {
  for (let s = 0; s < 40; s++) {
    const used = {};
    const seen = [];
    for (let m = 0; m < 12; m++) {
      const { i, key } = pickPaper(`seed-${s}-${m}`, used);
      assert.equal(key, `pp${m}-${i}`);
      if (seen.length) assert.notEqual(i, seen[seen.length - 1], 'never twice in a row');
      used[key] = true;
      seen.push(i);
    }
    // each round of four has every paper once
    for (let r = 0; r < 3; r++) assert.deepEqual([...new Set(seen.slice(r * 4, r * 4 + 4))].sort(), [0, 1, 2, 3], `round ${r}: ${seen}`);
  }
  // the room's first match: any paper; other games' keys in the night are ignored
  assert.ok(pickPaper('a', { 'tv-1': true }).i >= 0);
  assert.equal(pickPaper('a', { 'tv-1': true }).key.slice(0, 4), 'pp0-');
});
