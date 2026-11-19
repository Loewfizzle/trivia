// HIGH RISE — S4A FIX, the look items (docs/highrise.md · docs/games/passes/highrise-s4a-fix.md; the garbage hunt has its own file:
// tests/highrise-zero-garbage.test.mjs): THE UFO's far-side lamps are HIDDEN by the hull · THE NEXT FRIEND's pink tape has a WHITE
// CORE (the gold tape unchanged) · THE ICON = "A · THE TOWER".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MARKS, markFor } from '../js/core/marks.js';
import { markSvg } from '../js/ui/mark-svg.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const HI = 'js/games/highrise/';
// (flyers.js is a browser module — the audio engine, a GLB reader: its two numbers are read off its source, never imported here)
const [, LAMP_FROM, LAMP_FULL] = read(`${HI}flyers.js`).match(/export const LAMP_FROM = ([\d.]+), LAMP_FULL = ([\d.]+);/).map(Number);

test('THE UFO: a rim lamp on the FAR side is fully OFF (the hull hides it) — a short smooth fade as it rounds the rim, full in front; both looks', () => {
  assert.ok(LAMP_FROM >= 0 && LAMP_FROM < LAMP_FULL && LAMP_FULL <= 0.35, 'off at the silhouette and behind it; full within ~20° of its turn');
  const fl = read(`${HI}flyers.js`);
  assert.match(fl, /const face = ease\(\(w\.dot\(c\) - LAMP_FROM\) \/ \(LAMP_FULL - LAMP_FROM\)\),/, 'a lamp\'s light = how far its face (the rim\'s outer face: straight out from the axis) is turned to the lens');
  assert.doesNotMatch(fl, /0\.4 \+ 0\.6 \* ease\(\(w\.dot\(c\)/, 'never "the far ones at 40 %" again: a lamp is a glow drawn over the body — nothing else hides it');
  // the same maths, by hand: every lamp of the ten, at every turn of the saucer
  const ease = v => { const t = v < 0 ? 0 : v > 1 ? 1 : v; return t * t * (3 - 2 * t); };
  const face = d => ease((d - LAMP_FROM) / (LAMP_FULL - LAMP_FROM));
  for (let spin = 0; spin < Math.PI * 2; spin += 0.05) {
    let lit = 0;
    for (let i = 0; i < 10; i++) { const d = Math.cos(i * Math.PI / 5 + spin), f = face(d); if (d <= 0) assert.equal(f, 0, `a lamp turned from the lens (facing ${d.toFixed(2)}) gives no light`); if (f > 0.5) lit++; }
    assert.ok(lit >= 3 && lit <= 5, `the front of the rim is lit at every turn (${lit} of 10 at ${spin.toFixed(2)})`);
  }
  assert.equal(face(1), 1); assert.ok(face((LAMP_FROM + LAMP_FULL) / 2) > 0.4 && face((LAMP_FROM + LAMP_FULL) / 2) < 0.6, 'a smooth fade between');
  // (one loop for both looks: the day's lamp is the same light as paint — LG[9] = 0.9 × the day)
  assert.match(fl, /LG\[8\] = face \* ch \* fade; LG\[9\] = 0\.9 \* d; LG\[10\] = 4;/);
});

test('THE PINK TAPE HAS A WHITE CORE: white at its heart, the pink either side, then the glow — the front edges only; THE GOLD TAPE IS UNCHANGED; the tag\'s edge too', () => {
  // (night-fx.js imports three.js — its shader is read off its source, never imported here)
  const fx = read(`${HI}night-fx.js`), TAPE_F = fx.slice(fx.indexOf('export const TAPE_F = '), fx.indexOf('// ---- THE FLYERS'));
  const TAPE_CORE_EDGE = Number(fx.match(/export const TAPE_CORE_EDGE = ([\d.]+);/)[1]), TAPE_LINE = Number(fx.match(/export const TAPE_LINE = ([\d.]+),/)[1]);
  assert.match(TAPE_F, /uniform float uGlow, uWhite, uFace, uBloom, uDay, uCore;/);
  assert.match(TAPE_F, /vec3 lineC = mix\(uCol, vec3\(1\.0\), line \* uCore \* 0\.94 \* step\(0\.99, uFace\)\);/, 'the core is white, on the edges turned to the camera only (never a white diamond through the glass)');
  assert.ok(TAPE_F.includes('float hb = hw * (1.0 + ${TAPE_CORE_EDGE.toFixed(2)} * uCore);'), 'the colour\'s band is wider than the core');
  assert.ok(TAPE_CORE_EDGE >= 1 && TAPE_CORE_EDGE <= 2 && TAPE_LINE === 0.0021);
  // uCore = 0 (the gold tape): the band IS the line, the core adds nothing — the S2 FIX's maths, term for term
  assert.match(TAPE_F, /vec3 c = \(lineC \* band \+ uCol \* glow \* \(1\.0 - band\) \+ vec3\(uWhite\) \* band\) \* uGlow \* k \+ mix\(vec3\(0\.2, 0\.085, 0\.01\), vec3\(0\.2, 0\.02, 0\.13\), uCore\) \* dark \* k;/);
  assert.match(TAPE_F, /gl_FragColor = vec4\(c, min\(1\.0, band \+ glow \* 0\.6 \+ dark\) \* k\);/);
  const n = read(`${HI}night.js`);
  assert.match(n, /const tapeU = \{[^\n]*uCore: \{ value: 0 \} \};/, 'the gold tape: no core');
  assert.match(n, /const ftapeU = \{ \.\.\.tapeU, uCol: \{ value: new THREE\.Vector3\(TAPE_PINK\[0\], TAPE_PINK\[1\], TAPE_PINK\[2\]\) \}, uGlow: \{ value: 1 \}, uWhite: \{ value: 0 \}, uCore: \{ value: 1 \} \};/, 'the friend\'s tape: the white core');
  assert.match(n, /const ftapeMat = new THREE\.ShaderMaterial\(\{ \.\.\.tapeOpt, uniforms: ftapeU,/, 'the SAME shader: one program for both tapes (a second tape builds nothing — THE LAG RULES)');
  assert.match(read('css/highrise-play.css'), /\.hi-ftag \{ color: #ffd9f4; border-left: 2px solid #fff; padding-left: 12px; box-shadow: -2px 0 0 #ff4fd8, inset 2px 0 0 #ff4fd8, -4px 0 10px rgba\(255, 79, 216, 0\.8\); \}/, 'the friend\'s tag edge: a white core, the pink either side, a pink glow');
});

test('THE ICON = "A · THE TOWER": a cyan isometric stack + the pink slab dropping on top — in the mark\'s 0 … 100 box, stroke and all, at its own tube width', () => {
  const m = MARKS.highrise;
  assert.equal(m.blade, 'HIGHRISE');
  assert.deepEqual(m.tubes.map(t => t.col), ['#35e3ff', '#35e3ff', '#ff4fd8'], 'cyan · cyan · the sign\'s pink');
  assert.deepEqual(m.tubes.map(t => t.d), [
    'M26 58 L46 48 L66 58 M26 58 V86 L46 96 L66 86 V58 L46 68 L26 58 M46 68 V96',
    'M26 68 L46 78 L66 68 M26 77 L46 87 L66 77',
    'M36 26 L56 16 L76 26 L56 36 Z M36 26 V34 L56 44 L76 34 V26 M56 36 V44',
  ], 'the owner\'s three paths, as given');
  assert.equal(markFor({ id: 'highrise' }), m);
  // every number of every path, a half tube out: inside the box
  const half = m.w / 2;
  for (const t of m.tubes) {
    let x = 0, y = 0;
    for (const [, cmd, args] of t.d.matchAll(/([MLVHZ])([^MLVHZ]*)/g)) {
      const v = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
      if (cmd === 'M' || cmd === 'L') { x = v[0]; y = v[1]; } else if (cmd === 'V') y = v[0]; else if (cmd === 'H') x = v[0];
      assert.ok(x - half >= 0 && x + half <= 100 && y - half >= 0 && y + half <= 100, `${cmd}${args}: (${x}, ${y}) ± ${half} stays in the box`);
    }
  }
  // its floor lines lie 8 apart: at the house width (7) they close up into two solid blocks — the mark names its own
  assert.equal(m.w, 4.5);
  const svg = markSvg({ id: 'highrise' });
  assert.equal((svg.match(/stroke-width:4\.5;/g) || []).length, 3); assert.match(svg, /^<svg viewBox="0 0 100 100" aria-hidden="true" class="nd-shelf-mark">/);
  assert.equal((markSvg({ id: 'jaywalk' }).match(/stroke-width:7;/g) || []).length, MARKS.jaywalk.tubes.length, 'every other mark keeps the house width');
  for (const [id, mk] of Object.entries(MARKS)) if (id !== 'highrise') assert.equal(mk.w, undefined, `${id}: no width of its own`);
});
