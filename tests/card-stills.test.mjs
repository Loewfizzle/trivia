// LOAD FIX 3 — NO BLACK TILES (js/vault/stills.js): every card DRAWN IN CODE has its baked still on disk + wired as its material (the GENERATED
// block in css/vault.css, shown only where the effect is NOT painting — `.fx-on`, fx/renderer.js). A card with neither a picture in its CSS
// material, a still, nor a place on CSS_ART fails here — a new code-drawn card can't ship a black tile.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { STILLS, CSS_ART } from '../js/vault/stills.js';
import { stillRows, stillsBlock, withBlock } from '../scripts/build-card-stills.mjs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const css = read('css/vault.css'), strip = read('js/vault/strip.js');
const looks = [...strip.matchAll(/'(card-[\w-]+)': \{ mat: '([\w-]+)'(?:, fx: '([\w:-]+)')?/g)].map(m => ({ id: m[1], mat: m[2], fx: m[3] || '' }));
const hasPicture = mat => new RegExp(`\\.vl-s-${mat.replace(/-/g, '\\-')}(?![\\w-])[^{]*\\.vl-mat[^{]*\\{[^}]*url\\(\\s*['"]?\\.\\./assets`).test(css);

test('every card is covered: a picture in its material, a baked still, or a CSS-designed material (CSS_ART)', () => {
  assert.ok(looks.length > 60, `the LOOKS were read (${looks.length})`);
  for (const L of looks) {
    const ok = hasPicture(L.mat) || STILLS[L.id] || CSS_ART.includes(L.id);
    assert.ok(ok, `${L.id} (material ${L.mat}, effect ${L.fx || 'none'}): no picture without its effect — add it to js/vault/stills.js#STILLS (+ node scripts/build-card-stills.mjs) or, if its CSS material IS its look, to CSS_ART`);
  }
  for (const id of [...Object.keys(STILLS), ...CSS_ART]) assert.ok(looks.some(L => L.id === id), `${id} is a card with a LOOKS row`);
});

test('every still is on disk + the GENERATED block in css/vault.css is current', () => {
  for (const r of stillRows()) for (const k of r.kinds) {
    assert.ok(existsSync(new URL(`../assets/vault/still/${r.card}-${k}.webp`, import.meta.url)), `${r.card}-${k}.webp (node scripts/build-card-stills.mjs)`);
    const sel = k === 's' ? `.vl-s-${r.mat}:not(.fx-on) > .vl-mat` : `.vl-fcm-${r.mat}:not(.fx-on) > .vl-mat`;
    assert.ok(css.includes(`${sel} { background: #05060a url('../assets/vault/still/${r.card}-${k}.webp')`), `${r.card}: its ${k === 's' ? 'strip' : 'full card'} still wired (${sel})`);
  }
  assert.equal(withBlock(css, stillsBlock(stillRows())), css, 'css/vault.css: THE CARD STILLS block is stale — node scripts/build-card-stills.mjs');
  assert.equal(STILLS['card-penthouse'], 'sf', 'PENTHOUSE · THE DIAL (the known one) has both stills');
});

test('the renderer marks a painted slot (.fx-on) — the still never shows under a live effect', () => {
  const r = read('js/fx/renderer.js');
  assert.match(r, /sl\.fx\.draw\(c, sl, tt, \{[^}]*\}\); painted\(sl\);/, 'a slot drawn → .fx-on');
  assert.match(r, /remove\(el\) \{[^}]*unpainted\(sl\)/, 'a slot removed → no longer .fx-on');
  assert.match(r, /function clearSurface\(S\) \{\n  for \(const sl of S\.slots\.values\(\)\) unpainted\(sl\);/, 'a surface cleared (no effects) → the stills show');
});
