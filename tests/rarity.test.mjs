// THE ONE TIER PALETTE (THE VAULT 1C): the JS + CSS twins agree, every pair reads (≥ 4.5 : 1), THE PROGRAM gives every row a tier, the
// vault's tags + THE PROGRAM use the tokens (no stray hexes), I'M NEW HERE gone (2A).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { RARITY, RARITY_HEX, RARITY_INK, RARITY_ON, programTier, jackTier } from '../js/core/rarity.js';

const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const lum = hex => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

test('the CSS tokens are the JS palette', () => {
  const css = read('css/base.css');
  for (const t of RARITY) {
    assert.match(css, new RegExp(`--tier-${t}: ${RARITY_HEX[t]};`), `--tier-${t}`);
    assert.match(css, new RegExp(`--tier-${t}-ink: ${RARITY_INK[t]};`), `--tier-${t}-ink`);
  }
  assert.match(css, new RegExp(`--tier-on: ${RARITY_ON};`));
});

test('every pair reads: the ink on THE PROGRAM paper, white on the ink badge, the dark words on the light badge, the light on the night', () => {
  for (const t of RARITY) {
    for (const paper of ['#f6ecd4', '#eadbb6']) assert.ok(cr(RARITY_INK[t], paper) >= 4.5, `${t} ink on ${paper}`);
    assert.ok(cr('#ffffff', RARITY_INK[t]) >= 4.5, `${t} badge words`);
    assert.ok(cr(RARITY_ON, RARITY_HEX[t]) >= 4.5, `${t} light badge`);
    assert.ok(cr(RARITY_HEX[t], '#0a0f26') >= 4.5, `${t} on the panel`);
  }
});

test('the tiers are the owner\'s colours (grey · green · blue · purple · gold)', () => {
  const hue = hex => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255, M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m;
    if (d < 0.08) return 'grey'; const h = M === r ? ((g - b) / d) % 6 : M === g ? (b - r) / d + 2 : (r - g) / d + 4; const deg = (h * 60 + 360) % 360;
    return deg < 60 ? 'gold' : deg < 170 ? 'green' : deg < 250 ? 'blue' : 'purple'; };
  assert.deepEqual(RARITY.map(t => hue(RARITY_HEX[t])), ['grey', 'green', 'blue', 'purple', 'gold']);
  assert.deepEqual(RARITY.map(t => hue(RARITY_INK[t])), ['grey', 'green', 'blue', 'purple', 'gold']);
});

test('THE PROGRAM: every day-chart row gets a tier', () => {
  assert.equal(programTier({ cat: 'legendary' }), 'legendary');
  assert.equal(programTier({ cat: 'holiday', big: true, legend: true }), 'legendary');
  assert.equal(programTier({ cat: 'fireworks' }), 'epic');
  assert.equal(programTier({ cat: 'raid' }), 'epic');
  assert.equal(programTier({ cat: 'holiday', big: true }), 'epic');
  assert.equal(programTier({ cat: 'windows', rare: true }), 'rare');
  assert.equal(programTier({ cat: 'medium' }), 'common');   // (SHELL 2.0 B2: the medium moments say MEDIUM, in the common grey)
  assert.equal(programTier({ cat: 'windows' }), 'uncommon');
  assert.equal(programTier({ cat: 'party' }), 'uncommon');
  for (const c of ['workers', 'sky', 'billboard', 'harbor', 'lights', 'wildlife', 'weather']) assert.equal(programTier({ cat: c }), 'common', c);
  assert.equal(jackTier({ lane: 'legend' }), 'legendary');
  assert.equal(jackTier({ lane: 'show' }), 'epic');
  assert.equal(jackTier({ lane: 'free' }), 'uncommon');
});

test('THE PROGRAM paints a badge on every row + tints its name; the vault tags read the tokens', () => {
  const prog = read('js/screens/harbor/radio-program.js');
  assert.match(prog, /programTier\(i\)/);
  assert.match(prog, /h\('i\.rd-tier', r\.word \|\| RARITY_NAME\[r\.tier\]\)/);
  assert.match(prog, /word: programWord\(i\)/);   // (SHELL 2.0 B2: the medium moments say MEDIUM)
  assert.doesNotMatch(prog, /'LEGEND'\)/, 'the old LEGEND-only tag is gone');
  const radio = read('css/radio.css');
  for (const t of RARITY) assert.match(radio, new RegExp(`data-tier="${t}"\\] \\{ --tc-ink: var\\(--tier-${t}-ink\\)`));
  const vault = read('css/vault.css');
  // (SHELL 2.0 A: the full card wears THE TIER GEM — vault/full.js#tierBadge; the tier's words only where cards are picked)
  assert.match(read('js/vault/full.js'), /gemEl\(dev \? null : t, \{ dev \}\)/); assert.doesNotMatch(vault, /\.vl-tier[ .{:]/);
  for (const t of RARITY) assert.match(vault, new RegExp(`\\.vl-tt-${t} \\{ color: var\\(--tier-${t}\\)`));
});

test("I'M NEW HERE is gone (THE VAULT 2A — the ✕ closes the sheet)", () => {
  const src = read('js/profile/bring.js');
  assert.doesNotMatch(src, /'I’M NEW HERE'/);
  assert.doesNotMatch(src, /WELCOME IN — PICK A NAME/);
  assert.doesNotMatch(src, /byc-new/);
  assert.ok(src.includes("openSheet({ title: t ? t.textContent : label"), 'THE SHEET (its × closes it — SHELL 2.0 A)');
  assert.doesNotMatch(read('css/bring.css'), /.byc-new/);
});
