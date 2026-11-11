// HOLD'EM (HE5) — THE SKIN SYSTEM (skins.js — data + pure helpers): every skin the same shape (HE6's COZY CABIN + CYBERPUNK APARTMENT plug in
// as data + art), the CSS variables name ONLY the chosen skin's files, a per-phone setting (default NEON CASINO), NEON CASINO's art small.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { SKINS, SKIN_IDS, DEFAULT_SKIN, skinOf, skinVars, skinAssets } from '../js/games/holdem/skins.js';

const KEYS = ['id', 'name', 'line', 'felt', 'rail', 'light', 'print', 'accent', 'plate', 'button', 'back', 'stock', 'backdrop', 'living'];

test('THE SKINS: one data shape each; NEON CASINO the default; an unknown id → the default', () => {
  assert.equal(DEFAULT_SKIN, 'casino');
  assert.ok(SKIN_IDS.includes('casino'));
  for (const id of SKIN_IDS) {
    const s = SKINS[id];
    assert.deepEqual(Object.keys(s).sort(), [...KEYS].sort(), `${id}: the shape`);
    assert.equal(s.id, id);
    assert.ok(Number.isFinite(s.light.dir.x) && Number.isFinite(s.light.dir.y), `${id}: ONE light direction (the chips read it)`);
    assert.ok(Array.isArray(s.living));
    for (const f of [s.felt.img, s.rail.img, s.back, s.backdrop.portrait].filter(Boolean)) assert.ok(existsSync(`assets/holdem/${f}`), `${id}: ${f}`);
  }
  assert.equal(skinOf('nope').id, 'casino');
  assert.match(readFileSync('js/audio/settings.js', 'utf8'), /heSkin: 'casino'/, 'a per-phone setting');
});

test('ONLY THE CHOSEN SKIN LOADS: its variables + its preload name only its own files; every living touch has its CSS', () => {
  const css = readFileSync('css/holdem.css', 'utf8');
  for (const id of SKIN_IDS) {
    const v = skinVars(SKINS[id]), urls = Object.values(v).join(' ').match(/assets\/holdem\/[^")]+/g) || [];
    for (const u of urls) assert.ok(skinAssets(SKINS[id]).some(a => a.endsWith(u.replace('assets/holdem/', ''))), `${id}: ${u} is its own`);
    for (const k of SKINS[id].living) assert.match(css, new RegExp(`\\.he\\[data-skin='${id}'\\] \\.he-live-${k}`), `${id}: the ${k} touch's CSS`);
  }
  assert.doesNotMatch(css, /felt-green\.webp/, 'no hard-coded felt — the skin names it');
  assert.match(css, /\.he\[data-tier='1'\] \.he-live/, 'the tiers drop the living touches first');
});

test('NEON CASINO\'s art: baked + compressed (felt + rail + backdrop + the back ≤ 100 KB)', () => {
  const total = skinAssets(SKINS.casino).reduce((n, u) => n + statSync(`assets/holdem/${u.split('assets/holdem/')[1]}`).size, 0);
  assert.ok(total < 100_000, `${Math.round(total / 1024)} KB`);
});
