// HOLD'EM (HE5 + HE6) — THE SKIN SYSTEM (skins.js — data + pure helpers): THE THREE SKINS (NEON CASINO · COZY CABIN · CYBERPUNK APARTMENT) are
// the same shape (data + art, no skin code path), the CSS variables name ONLY the chosen skin's files, every variable the CSS reads, a
// per-phone setting (default NEON CASINO), each skin's art small, every living touch has its CSS.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { SKINS, SKIN_IDS, DEFAULT_SKIN, skinOf, skinVars, skinAssets } from '../js/games/holdem/skins.js';

const KEYS = ['id', 'name', 'line', 'felt', 'rail', 'light', 'print', 'betline', 'accent', 'plate', 'button', 'back', 'stock', 'backdrop', 'living'];
const shape = o => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.keys(o).sort().map(k => [k, shape(o[k])])) : typeof o);

test('THE SKINS: the three, one data shape each (nested too); NEON CASINO the default; an unknown id → the default', () => {
  assert.equal(DEFAULT_SKIN, 'casino');
  assert.deepEqual([...SKIN_IDS], ['casino', 'cabin', 'apartment']);
  const want = shape(SKINS.casino);
  for (const id of SKIN_IDS) {
    const s = SKINS[id];
    assert.deepEqual(Object.keys(s).sort(), [...KEYS].sort(), `${id}: the shape`);
    const got = shape(s);
    for (const k of ['felt', 'rail', 'light', 'print', 'betline', 'accent', 'plate']) assert.deepEqual(got[k], want[k], `${id}.${k}: the same fields as the casino`);
    assert.deepEqual(Object.keys(s.button).sort(), Object.keys(SKINS.casino.button).sort(), `${id}.button`);
    assert.deepEqual(got.button.call, want.button.call, `${id}.button.call`);
    assert.deepEqual(got.button.fold, want.button.fold, `${id}.button.fold`);
    assert.equal(s.id, id);
    assert.ok(Number.isFinite(s.light.dir.x) && Number.isFinite(s.light.dir.y), `${id}: ONE light direction (the chips read it)`);
    assert.match(s.accent.rgb, /^\d+, \d+, \d+$/, `${id}: the accent's rgb (the glows)`);
    assert.ok(Array.isArray(s.living) && s.living.length, `${id}: living touches`);
    for (const f of [s.felt.img, s.rail.img, s.back, s.backdrop.portrait, s.button.tex].filter(Boolean)) assert.ok(existsSync(`assets/holdem/${f}`), `${id}: ${f}`);
  }
  assert.equal(skinOf('nope').id, 'casino');
  assert.match(readFileSync('js/audio/settings.js', 'utf8'), /heSkin: 'casino'/, 'a per-phone setting');
});

test('ONLY THE CHOSEN SKIN LOADS: its variables + its preload name only its own files; every variable is read by the CSS; every living touch has its CSS', () => {
  const css = readFileSync('css/holdem.css', 'utf8');
  for (const id of SKIN_IDS) {
    const v = skinVars(SKINS[id]), urls = Object.values(v).join(' ').match(/assets\/holdem\/[^")]+/g) || [];
    for (const u of urls) assert.ok(skinAssets(SKINS[id]).some(a => a.endsWith(u.replace('assets/holdem/', ''))), `${id}: ${u} is its own`);
    for (const other of SKIN_IDS.filter(o => o !== id)) assert.ok(!urls.some(u => u.includes(`/${other}/`) || u.includes(`cardback-${other}`)), `${id}: names nothing of ${other}`);
    for (const k of Object.keys(v)) assert.ok(css.includes(`var(${k}`), `the CSS reads ${k}`);
    for (const k of SKINS[id].living) assert.match(css, new RegExp(`\\.he\\[data-skin='${id}'\\] \\.he-live-${k}`), `${id}: the ${k} touch's CSS`);
  }
  assert.doesNotMatch(css, /felt-green\.webp/, 'no hard-coded felt — the skin names it');
  assert.match(css, /\.he\[data-tier='1'\] \.he-live/, 'the tiers drop the living touches first');
  assert.doesNotMatch(css.split('\n').filter(l => !l.includes('.he-rk')).join('\n'), /rgba\(242, 193, 78,/, 'every accent glow reads the skin (the rankings sheet sits outside the table)');
});

test('EACH SKIN\'s art: baked + compressed (felt + rail + backdrop + the back + its wood ≤ 200 KB)', () => {
  for (const id of SKIN_IDS) {
    const total = skinAssets(SKINS[id]).reduce((n, u) => n + statSync(`assets/holdem/${u.split('assets/holdem/')[1]}`).size, 0);
    assert.ok(total < 200_000, `${id}: ${Math.round(total / 1024)} KB`);
  }
});
