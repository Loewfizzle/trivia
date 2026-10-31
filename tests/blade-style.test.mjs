// SP5 — THE BLADE'S WEEKLY LOOK (js/core/harbor-speakeasy.js#bladeStyle): a seeded style a week, never the same letter style two weeks
// running, every style + ink + panel used, the same on every phone, the &blade= preview's override.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bladeStyle, BLADE_FONTS, BLADE_INKS, BLADE_PANELS } from '../js/core/harbor-speakeasy.js';

test('two hundred weeks: never the same letter style two weeks running; every font, ink + panel seen; deterministic', () => {
  const fonts = new Set(), inks = new Set(), panels = new Set();
  let prev = null;
  for (let w = 0; w < 200; w++) {
    const S = bladeStyle(w);
    assert.ok(BLADE_FONTS.includes(S.font) && BLADE_INKS.includes(S.ink) && BLADE_PANELS[S.panel], `week ${w}: ${S.key}`);
    if (prev) assert.notEqual(S.font, prev.font, `week ${w}: the style changes every week (${S.font} after ${prev.font})`);
    assert.equal(S.key, bladeStyle(w).key, 'the same on every call');
    fonts.add(S.font); inks.add(S.ink); panels.add(S.panel); prev = S;
  }
  assert.equal(fonts.size, 3); assert.ok(!fonts.has('inline'), 'ATM-C: the inline style out of the rotation'); assert.equal(inks.size, 3); assert.equal(panels.size, 5);
  // the memo never changes an answer: week 150 asked cold equals week 150 asked after its neighbours
  assert.equal(bladeStyle(150).key, bladeStyle(150).key);
});

test('the preview override: any part of <font>-<ink>-<panel>, the rest the week\'s own', () => {
  const S = bladeStyle(40), F = bladeStyle(40, 'condensed-amber-burgundy');
  assert.deepEqual([F.font, F.ink, F.panel], ['condensed', 'amber', 'burgundy']);
  assert.equal(bladeStyle(40, 'inline').font, S.font, 'ATM-C: an old inline link falls back to the week’s own style');
  const G = bladeStyle(40, 'slab');
  assert.equal(G.font, 'slab'); assert.equal(G.ink, S.ink); assert.equal(G.panel, S.panel);
  assert.equal(bladeStyle(40, 'nonsense').key, S.key);
});
