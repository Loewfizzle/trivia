// HOLD'EM (HE6) — THE REAL CARDS (card-art.js + the GENERATED card-data.js — scripts/build-holdem-cards.mjs): every card in all three sizes,
// the classic pip counts, the court figures from the chosen deck's sprite, the ink by deck (never by skin), the serif index in BOTH corners,
// our own ace of spades, the material small + only the chosen deck's sprite preloaded.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { faceSvg, suitColor, courtUrl } from '../js/games/holdem/card-art.js';
import { GLYPH, PIP, COURT } from '../js/games/holdem/card-data.js';

const RANKS = 'AKQJT98765432', SUITS = 'shdc';
const ALL = [...SUITS].flatMap(s => [...RANKS].map(r => r + s));
const count = (s, re) => (s.match(re) || []).length;

test('THE MATERIAL: the glyphs (A K Q J 1 0 2–9), the four pips, the two deck sprites + the stock grain — small', () => {
  for (const ch of 'AKQJ1023456789') assert.ok(GLYPH[ch] && GLYPH[ch].d.length > 20, `glyph ${ch}`);
  for (const s of SUITS) assert.ok(PIP[s] && PIP[s].box.length === 4 && PIP[s].aspect > 0.6 && PIP[s].aspect < 1.4, `pip ${s}`);
  for (const d of ['four', 'two']) {
    const f = `assets/holdem/${COURT.img[d]}`;
    assert.ok(existsSync(f), f);
    assert.ok(statSync(f).size < 230_000, `${f}: ${Math.round(statSync(f).size / 1024)} KB`);
  }
  assert.ok(statSync('assets/holdem/cards/stock.webp').size < 4_000, 'the stock grain');
  assert.deepEqual(COURT.cols, ['J', 'Q', 'K']);
});

test('EVERY CARD × EVERY SIZE: a well-formed face, the ink by suit + deck', () => {
  for (const deck of ['four', 'two']) for (const size of ['full', 'board', 'mini']) for (const c of ALL) {
    const svg = faceSvg(c, deck, size);
    assert.match(svg, /^<svg class="he-face" viewBox="0 0 70 98"[^>]*>[\s\S]*<\/svg>$/, `${c} ${size}`);
    assert.ok(svg.includes(suitColor(c[1], deck)), `${c} ${size} ${deck}: its ink`);
    assert.doesNotMatch(svg, /undefined|NaN/, `${c} ${size}`);
  }
});

test('YOUR CARDS (full): the index in BOTH corners, the classic pip counts, the court figure from the deck\'s sprite, our own ace of spades', () => {
  for (const c of ALL) {
    const svg = faceSvg(c, 'four', 'full'), r = c[0];
    assert.equal(count(svg, /rotate\(180 35 49\)/g), 1, `${c}: the bottom-right twin`);
    const pips = count(svg, new RegExp(PIP[c[1]].d.slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
    if ('23456789T'.includes(r)) assert.equal(pips, 2 * 1 + (r === 'T' ? 10 : +r), `${c}: two corner pips (one + its twin) + the layout`);
    if ('JQK'.includes(r)) assert.match(svg, /courts-four\.webp/, `${c}: the figure`);
  }
  assert.match(faceSvg('As', 'four', 'full'), /<circle/, 'the ace of spades: our own ring');
  assert.doesNotMatch(faceSvg('Ah', 'four', 'full'), /<circle/);
  assert.match(faceSvg('Kd', 'two', 'full'), /courts-two\.webp/, 'CLASSIC: the classic sprite');
});

test('THE BOARD + THE MINI: big indexes, one centre suit (the board), the court small between the indexes', () => {
  assert.match(faceSvg('Qh', 'four', 'board'), /courts-four\.webp/);
  assert.doesNotMatch(faceSvg('Qh', 'four', 'mini'), /courts/, 'a shown hand: index + suit only');
  assert.equal(count(faceSvg('9c', 'four', 'mini'), /rotate\(180 35 49\)/g), 0);
});

test('ONLY THE CHOSEN DECK LOADS: the preload names this phone\'s deck sprite', () => {
  const src = readFileSync('js/games/holdem/index.js', 'utf8');
  assert.match(src, /courtUrl\(settings\.heDeck\)/);
  assert.ok(courtUrl('two').endsWith('cards/courts-two.webp') && courtUrl('x').endsWith('cards/courts-four.webp'));
  assert.doesNotMatch(readFileSync('js/games/holdem/card-art.js', 'utf8'), /AS\.svg/);
});
