// PRISM DROP — THE NEON LOOK's PALETTES (PD-3): every world keeps each piece in its COLOUR FAMILY (the hue within a fixed band of its JEWEL hue)
// and keeps the pieces apart (enough contrast between every pair); a world shifts only the shade + the glow.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neonPalette, NEON_BASE, WORLD_SHIFT, hexRgb, rgbHsl, hueDiff, deltaE } from '../js/games/prism/neon.js';
import { JEWEL } from '../js/games/prism/board.js';

const WORLDS = ['aurora', 'city', 'nebula', 'crystal', 'sunset'];
const BAND = 15;        // degrees: a piece's hue never leaves its family
const MIN_DE = 18;      // CIE76: every pair of pieces stays clearly apart
const hue = hex => rgbHsl(hexRgb(hex))[0];
const JEWEL_HUES = JEWEL.map(c => (c ? hue(c) : null));

test('the neon base IS the jewel hues (one family per piece, day + night)', () => {
  for (let t = 1; t <= 7; t++) assert.ok(Math.abs(hueDiff(hue(NEON_BASE[t]), JEWEL_HUES[t])) < 1, `piece ${t}`);
});

test('every world keeps each piece in its colour family (hue within ±15° of its JEWEL hue)', () => {
  for (const w of WORLDS) {
    const p = neonPalette(w);
    for (let t = 1; t <= 7; t++) {
      const d = Math.abs(hueDiff(JEWEL_HUES[t], hue(p.piece[t])));
      assert.ok(d <= BAND, `${w} piece ${t}: ${p.piece[t]} is ${d.toFixed(1)}° off its family`);
      // the glow too stays in the family (it leans toward the world, never across)
      const g = Math.abs(hueDiff(JEWEL_HUES[t], hue(p.glow[t])));
      assert.ok(g <= BAND + 12, `${w} glow ${t}: ${g.toFixed(1)}°`);
    }
  }
});

test('every world keeps enough contrast between every pair of pieces', () => {
  for (const w of [...WORLDS, 'neutral']) {
    const p = neonPalette(w);
    for (let a = 1; a <= 7; a++) for (let b = a + 1; b <= 7; b++) {
      const e = deltaE(p.piece[a], p.piece[b]);
      assert.ok(e >= MIN_DE, `${w}: pieces ${a} + ${b} too close (ΔE ${e.toFixed(1)})`);
    }
    // junk reads as junk: far from every lit piece
    for (let t = 1; t <= 7; t++) assert.ok(deltaE(p.piece[8], p.piece[t]) >= 25, `${w}: junk vs ${t}`);
  }
});

test('the worlds DO shift the shade (warmer at SYNTH SUNSET, icier in CRYSTAL CAVE) — never a swap', () => {
  const sun = neonPalette('sunset'), ice = neonPalette('crystal');
  let warmer = 0, icier = 0;
  for (let t = 1; t <= 7; t++) {
    if (Math.abs(hueDiff(hue(sun.piece[t]), 28)) < Math.abs(hueDiff(hue(NEON_BASE[t]), 28))) warmer++;
    if (Math.abs(hueDiff(hue(ice.piece[t]), 198)) < Math.abs(hueDiff(hue(NEON_BASE[t]), 198))) icier++;
  }
  assert.ok(warmer >= 5, `sunset warms ${warmer}/7`);
  assert.ok(icier >= 5, `crystal cools ${icier}/7`);
  for (const w of WORLDS) {
    const p = neonPalette(w);
    assert.ok(WORLD_SHIFT[w], w);
    for (const k of ['edge', 'frame', 'well', 'flash']) assert.match(p[k], /^#[0-9a-f]{6}$/, `${w}.${k}`);
    assert.equal(p.sparks.length, 2);
  }
  // an unknown world → the neutral palette; memoised (the sprite cache keys on its id)
  assert.equal(neonPalette('nope').id, 'neutral');
  assert.equal(neonPalette('city'), neonPalette('city'));
});

test('PFIX-B (finding 10): THE STEPS — by day every step changes the board\'s ratio (3 → 0, 0 → 3); by night one tier at a time', async () => {
  const { TIERS, TOP_TIER, stepTier, DAY_KEYS } = await import('../js/games/prism/tiers.js');
  for (let t = 0; t <= TOP_TIER; t++) {
    for (const dir of [-1, 1]) {
      const d = stepTier(t, dir, 'crayon');
      if (d !== t) {
        assert.ok(DAY_KEYS.some(k => TIERS[d][k] !== TIERS[t][k]), `day ${t} → ${d}: it changes something the day look draws`);
        assert.notEqual(TIERS[d].board, TIERS[t].board, `day ${t} → ${d}: the board's ratio (the one change that helps by day)`);
      }
      assert.equal(stepTier(t, dir, 'neon'), Math.max(0, Math.min(TOP_TIER, t + dir)), 'night: one at a time');
    }
  }
  assert.equal(stepTier(TOP_TIER, -1, 'crayon'), 0, 'day: from the top straight to the 2× board');
  assert.equal(stepTier(0, 1, 'crayon'), TOP_TIER, 'day: back up to the top of the 3× class');
  assert.equal(stepTier(0, -1, 'crayon'), 0, 'nowhere lower');
});
