// SP5 + CITY B — THE BLADE'S BOLD WEEKLY LOOK (js/core/harbor-speakeasy.js#bladeStyle): a seeded look a week — the KIND (enamel / neon / bulb),
// a SATURATED panel (≥ 8), the letter colour holding ≥ 4.5 : 1 on its board day + night, the bulbs' colour; the kind, the font + the panel never
// the same two weeks running; the same on every phone; the &blade=<kind>-<font>-<panel>-<bulb> preview.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bladeStyle, bladeGround, bladeLetterCol, contrast, BLADE_KINDS, BLADE_FONTS, BLADE_PANELS, BLADE_BULBS, BULB_GLASS } from '../js/core/harbor-speakeasy.js';
import { SIGN_ACC } from '../js/screens/harbor/signs.js';
import { hexRgb } from '../js/core/marks.js';

const NEONS = Object.values(SIGN_ACC).map(hexRgb);
const lift = c => c.map(v => Math.round(v + (255 - v) * 0.3));

test('CITY B: 260 weeks — every kind, font, ≥ 8 saturated panels + ≥ 5 bulb colours seen; the kind, font + panel change every week; deterministic', () => {
  const kinds = new Set(), fonts = new Set(), panels = new Set(), bulbs = new Set();
  let prev = null;
  assert.ok(Object.keys(BLADE_PANELS).length >= 8 && Object.keys(BLADE_BULBS).length >= 6);
  for (let w = 0; w < 260; w++) {
    const S = bladeStyle(w);
    assert.ok(BLADE_KINDS.includes(S.kind) && BLADE_FONTS.includes(S.font) && BLADE_PANELS[S.panel] && BLADE_BULBS[S.bulb], `week ${w}: ${S.key}`);
    if (prev) for (const k of ['kind', 'font', 'panel']) assert.notEqual(S[k], prev[k], `week ${w}: the ${k} changes every week (${S[k]})`);
    assert.equal(S.key, bladeStyle(w).key, 'the same on every call');
    kinds.add(S.kind); fonts.add(S.font); panels.add(S.panel); bulbs.add(S.bulb); prev = S;
  }
  assert.equal(kinds.size, 3); assert.equal(fonts.size, 3); assert.ok(!fonts.has('inline'), 'ATM-C: the inline style out');
  assert.ok(panels.size >= 8, `${panels.size} panels`); assert.ok(bulbs.size >= 5, `${bulbs.size} bulb colours`);
});

test('CITY B: the letters hold ≥ 4.5 : 1 on their board day AND night — every week × every game neon (cream / gold / black / the neon, a fallback when it fails)', () => {
  for (let w = 0; w < 260; w++) {
    const S = bladeStyle(w), G = bladeGround(S.kind, S.panel);
    for (const n of NEONS) {
      const c = bladeLetterCol(S, n);
      const day = S.kind === 'bulb' ? BULB_GLASS : c, night = S.kind === 'neon' ? lift(c) : c;
      assert.ok(contrast(day, G.day) >= 4.5, `week ${w} ${S.key}: day ${contrast(day, G.day).toFixed(2)}`);
      assert.ok(contrast(night, G.night) >= 4.5, `week ${w} ${S.key}: night ${contrast(night, G.night).toFixed(2)}`);
    }
    // the bulbs never melt into the board (a BULB letter IS a bulb: ≥ 4.5 : 1 at night)
    assert.ok(contrast(BLADE_BULBS[S.bulb], G.night) >= (S.kind === 'bulb' ? 4.5 : 3) || S.bulb === 'warm', `week ${w}: the ${S.bulb} bulbs on ${S.panel}`);
  }
});

test('the preview override: any part of <kind>-<font>-<panel>-<bulb> in any order, the rest the week’s own; old + unknown parts ignored', () => {
  const S = bladeStyle(40), F = bladeStyle(40, 'neon-condensed-cobalt-pink');
  assert.deepEqual([F.kind, F.font, F.panel, F.bulb], ['neon', 'condensed', 'cobalt', 'pink']);
  assert.equal(bladeStyle(40, 'inline').key, S.key, 'ATM-C: an old inline link = the week’s own look');
  const G = bladeStyle(40, 'slab');
  assert.equal(G.font, 'slab'); assert.equal(G.kind, S.kind); assert.equal(G.panel, S.panel);
  assert.equal(bladeStyle(40, 'nonsense').key, S.key);
  assert.equal(bladeStyle(40, 'bulb').letter, 'bulb'); assert.notEqual(bladeStyle(41, 'enamel-red').letter, 'bulb');
  assert.deepEqual(bladeStyle(40, 'red-enamel').kind, 'enamel');
});
