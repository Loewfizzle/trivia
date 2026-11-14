// SKINS 2A — PRISM DROP: THE WATERCOLOR REWORK + THE CRAYON's TEXTURE + THE TIER STEP (docs/games/plan.md "SKINS 2A"; docs/prism.md "THE SKINS").
//   WATERCOLOR  no dark outline (no line is stroked round a block: the edge is a pooled BAND), a lighter middle, blotches of a close hue that stay
//               in the piece's colour family, a bloom on 2 of the 6 variants, THE BLEED where two different colours touch (seamAt — PURE, the
//               same on every phone; painted in the board's cached stack layer through the skin's optional `seams` hook — never per frame)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hexRgb, rgbHsl, hueDiff } from '../js/games/prism/neon.js';
import { JEWEL } from '../js/games/prism/skin-kit.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const hue = hex => rgbHsl(hexRgb(hex))[0];
const fnBody = (src, name) => { const a = src.indexOf(`function ${name}(`); assert.ok(a >= 0, name); const b = src.indexOf('\n}\n', a); return src.slice(a, b); };

test('WATERCOLOR: NO DARK OUTLINE — a block strokes no crisp line: its edge is the pooled band (wide soft passes), in the colour\'s own deeper shade', () => {
  const src = read('js/games/prism/water-art.js'), block = fnBody(src, 'blockArt');
  assert.doesNotMatch(block, /setLineDash|lineDashOffset/, 'no dashed hard edge');
  assert.doesNotMatch(block, /Math\.max\(1, size \* 0\.0[0-3]\d*\)/, 'no hairline');
  const widths = [...block.matchAll(/for \(const \[w, a\] of (\[\[.*?\]\])\)/g)].map(m => JSON.parse(m[1]));
  assert.ok(widths.length >= 1, 'the pooling passes');
  for (const [w, a] of widths[0]) { assert.ok(w >= 0.05, `a pooling pass is a band (${w} of the cell), never a line`); assert.ok(a <= 0.25, `each pass is faint (${a})`); }
  assert.match(block, /squircle\(x, cx, cy, half \* k, seeded\(v \* 131 \+ 5\), 0\.028, 8\.5\)/, 'a brushed square — not a round blob');
  assert.doesNotMatch(block, /255,255,255/, 'no white highlight: the lighter middle is the PAPER through the paint');
  assert.match(block, /destination-out/, 'the paint itself is lifted in the middle');
  // the pooled shade stays the colour (never near-black)
  const m = /export const poolOf = hex => mixHex\(hex, DEEP, (0\.\d+)\);/.exec(src);
  assert.ok(m && Number(m[1]) <= 0.34, 'the pooled shade: at most a third toward the deep');
  // the ghost: a wash ring in the piece's own colour — no pencil line
  const ghost = fnBody(src, 'ghostArt');
  assert.doesNotMatch(ghost, /PENCIL/);
  assert.match(ghost, /function ghostArt\(size, col, pool\)/);
});

test('WATERCOLOR: a bloom on 2 of the 6 variants; the wet-in-wet neighbours stay inside each piece\'s colour family', async () => {
  // (the art module needs no DOM until a sprite is drawn)
  const W = await import('../js/games/prism/water-art.js');
  assert.equal(W.VARIANTS, 6);
  assert.deepEqual(Object.keys(W.BLOOMS).map(Number).filter(v => v >= 0 && v < 6).length, 2);
  for (let t = 1; t <= 7; t++) {
    assert.ok(Math.abs(hueDiff(hue(JEWEL[t]), hue(W.WATER[t]))) <= 20, `piece ${t}'s paint`);
    for (const n of W.WATER_NEAR[t]) assert.ok(Math.abs(hueDiff(hue(W.WATER[t]), hue(n))) <= 42, `piece ${t}: ${n} is a NEIGHBOUR of ${W.WATER[t]} (${Math.round(hueDiff(hue(W.WATER[t]), hue(n)))}°)`);
    assert.ok(Math.abs(hueDiff(hue(W.WATER[t]), hue(W.WATER_POOL[t]))) <= 20, `piece ${t}'s pooled shade keeps its hue`);
  }
});

test('THE BLEED: seamAt is PURE + by place (≈ 3 seams in 5, three shapes); the skin paints it through the optional `seams` hook in the cached stack layer', async () => {
  const W = await import('../js/games/prism/water-art.js');
  let on = 0, n = 0; const shapes = new Set();
  for (let y = 0; y < 20; y++) for (let x = 0; x < 10; x++) for (const flat of [false, true]) { const k = W.seamAt(x, y, flat); assert.equal(k, W.seamAt(x, y, flat)); assert.ok(k >= 0 && k <= 3); n++; if (k) { on++; shapes.add(k); } }
  assert.ok(on / n > 0.45 && on / n < 0.75, `${on} of ${n} seams bleed`);
  assert.equal(shapes.size, 3);
  const board = read('js/games/prism/board.js'), skins = read('js/games/prism/skins.js');
  // (inside the stack layer's rebuild — between the cells' loop and `ctx = main` — so it costs nothing in a frame)
  assert.match(board, /if \(t\) drawCell\(x, y, t, grey, 0\);\n        \}\n        if \(skin\.seams\) skin\.seams\(ctx, \{ cells, px, sy, grey \}\);[^\n]*\n        ctx = main;/);
  assert.equal((board.match(/skin\.seams/g) || []).length, 2, 'one generic call — no skin named');
  const wc = skins.slice(skins.indexOf('const watercolor = {'), skins.indexOf('const paper = {'));
  assert.match(wc, /seams\(ctx, \{ cells, px, sy, grey = 0 \}\) \{/);
  assert.match(wc, /r && r !== t \? seamAt\(x, y, false\) : 0/, 'only where two DIFFERENT colours touch');
  assert.doesNotMatch(wc, /filter\s*=|blur\(/, 'no blur (Safari has no canvas filter; nothing per frame)');
  for (const id of ['crayon', 'paper', 'neon']) { const a = skins.indexOf(`const ${id} = {`); assert.doesNotMatch(skins.slice(a, skins.indexOf('\n};', a)), /seams\(/, `${id} paints no seams`); }
});

//   CRAYON      THE TEXTURE TWEAK (light — the blocks only): the hatching reads (strokes a little apart over a thinner base, a few thin PRESSED
//               strokes), a fine waxy grain over the tooth, the outline pressed a touch heavier — the same colours + outline colours
test('CRAYON — THE TEXTURE TWEAK: more hatching, a waxy grain, a heavier pressed outline; the colours + the outline colours untouched', async () => {
  const src = read('js/games/prism/crayon-art.js'), fill = fnBody(src, 'crayonFill'), block = fnBody(src, 'blockArt');
  assert.match(fill, /const step = S \* \(pass \? 0\.12 : 0\.072\);/, 'the strokes sit a little apart');
  assert.match(fill, /THE PRESSED STROKES/);
  assert.match(fill, /x\.lineWidth = S \* \(0\.018 \+ rnd\(\) \* 0\.016\);/, 'thin pressed hatch lines');
  assert.match(block, /base: junk \? 0\.3 : 0\.32 \}/, 'a thinner base: the paper through the gaps');
  assert.equal((block.match(/punch\(fx, S, /g) || []).length, 2, 'the tooth + the waxy grain');
  const w = /ox\.lineWidth = S \* (0\.\d+);/.exec(block);
  assert.ok(w && Number(w[1]) > 0.085 && Number(w[1]) <= 0.105, `the outline a touch heavier (${w && w[1]}) — never a thick frame`);
  // (the palette is the crayon's own module — this pass never touched it)
  const C = await import('../js/games/prism/crayon.js');
  assert.deepEqual([...C.CRAYON].slice(1, 8).map(c => c.toLowerCase()).length, 7);
  for (let t = 1; t <= 7; t++) assert.ok(Math.abs(hueDiff(hue(JEWEL[t]), hue(C.CRAYON[t]))) <= 20, `piece ${t}'s crayon`);
});

//   THE SOUNDS  each DAY skin's SOURCED lock / clear (audio/sfx/prism/ — Grok's CC0 picks through scripts/build-prism-skin-sfx.py): a skin names
//               only its own two files, each ≤ 30 KB + credited; the code-made voice stays the fallback (audio.js); the night's pixel-* /
//               galaxy-* files wait for SKINS 2B
test("THE SKINS' SOURCED SOUNDS: only a skin's own files, each ≤ 30 KB + in CREDITS; the code-made voice is the fallback", async () => {
  const { statSync, readdirSync } = await import('node:fs');
  const skins = read('js/games/prism/skins.js'), audio = read('js/games/prism/audio.js');
  const filesOf = id => { const a = skins.indexOf(`const ${id} = {`), body = skins.slice(a, skins.indexOf('\n};', a)); const m = /sounds: \{[^}]*files: \{ lock: '([a-z-]+)', clear: '([a-z-]+)' \} \}/.exec(body); return m ? [m[1], m[2]] : []; };
  assert.deepEqual(filesOf('watercolor'), ['watercolor-lock', 'watercolor-clear']);
  assert.deepEqual(filesOf('paper'), ['paper-lock', 'paper-clear']);
  for (const id of ['crayon', 'neon', 'glass']) assert.deepEqual(filesOf(id), [], `${id} keeps the synth's own sounds`);
  const dir = new URL('../audio/sfx/prism/', import.meta.url), have = readdirSync(dir).sort();
  // (SKINS 2B — updated ON PURPOSE: + the night skins' four picks; their own pins: tests/prism-skins-2b.test.mjs)
  assert.deepEqual(have, ['CREDITS.md', 'galaxy-clear.mp3', 'galaxy-lock.mp3', 'paper-clear.mp3', 'paper-lock.mp3', 'pixel-clear.mp3', 'pixel-lock.mp3', 'watercolor-clear.mp3', 'watercolor-lock.mp3'], 'the eight picks + their credits');
  const credits = read('audio/sfx/prism/CREDITS.md');
  for (const f of have.filter(x => x.endsWith('.mp3'))) {
    const n = statSync(new URL(f, dir)).size;
    assert.ok(n > 600 && n <= 30 * 1024, `${f}: ${n} B ≤ 30 KB`);
    const line = credits.split('\n').find(l => l.startsWith(`- \`${f}\` — `)) || '';
    assert.ok(line.includes('CC0 1.0') || line.includes('generated (Grok)'), `${f} is credited: CC0, or generated (Grok)`);
  }
  assert.doesNotMatch(credits, /CC BY-NC|CC BY-ND|All rights|Sonniss/i);
  // the synth: fetched at setVoices (the skin shows), never before; a file not ready → the code-made voice
  assert.match(audio, /setVoices\(v\) \{\n      voices = v \|\| \{\};\n      files = \(v && v\.files\) \|\| \{\};\n      for \(const f of soundFiles\(v\)\) fetchSample\(f\);/);
  assert.equal((audio.match(/fetchSample\(/g) || []).length, 2, 'fetched in two places only: setVoices (the skin shows) + the decode');
  for (const [voice, code] of [['plip', 'else drip(m, ctx.currentTime + 0.002, { gain: 0.05, dur: 0.1 });'], ['swish', 'else brush(q.at, { gain: 0.035 + 0.008 * Math.min(4, lines)'], ['tap', 'noise(at, { gain: 0.045, dur: 0.035, from: 3800, to: 1600, q: 1.4 });'], ['rip', 'tear(q.at, { gain: 0.05 + 0.008 * Math.min(4, lines)']]) {
    assert.ok(audio.includes(code), `${voice}: its code-made sound is still there — the fallback`);
    assert.ok(audio.includes(`SAMPLE_GAIN.${voice}(`), `${voice}: the file plays at the voice's own level`);
  }
  const A = await import('../js/games/prism/skins.js').catch(() => null);   // (the registry imports DOM-free)
  if (A) { const { soundFiles } = { soundFiles: s => (s && s.files ? [...new Set(Object.values(s.files))] : []) }; assert.deepEqual(soundFiles(A.SKINS.watercolor.sounds), ['watercolor-lock', 'watercolor-clear']); assert.deepEqual(soundFiles(A.SKINS.crayon.sounds), []); }
  // THE LEVELS (the owner's add-on — levelled in the game: tests/integration/prism-sfx-level.mjs measured each skin's lock + clear on the SFX
  // bus against the crayon's / the neon's): a file's peak is −8 dBFS (≈ 0.4) — × its gain it stays a quiet effect (a lock ≤ 0.08 of full
  // scale, the biggest clear ≤ 0.13), a clear grows with its lines, and paper's clear is LIFTED over watercolor's (as recorded it sat under)
  // (audio.js needs a page to load — the constants are read from its source and evaluated here, so these pins always run)
  const konst = name => { const m = new RegExp(`export const ${name} = ([^;]+);`).exec(audio); assert.ok(m, `audio.js exports ${name}`); return new Function(`return ${m[1]};`)(); };
  const SAMPLE_GAIN = konst('SAMPLE_GAIN'), NOTE_GAIN = konst('NOTE_GAIN'), RUN_LIFT = konst('RUN_LIFT'), LOCK_PITCH = konst('LOCK_PITCH');
  {
    const peak = 0.4;
    for (const v of ['plip', 'tap']) assert.ok(SAMPLE_GAIN[v]() * peak >= 0.04 && SAMPLE_GAIN[v]() * peak <= 0.08, `${v}: ${(SAMPLE_GAIN[v]() * peak).toFixed(3)}`);
    for (const v of ['swish', 'rip']) {
      assert.ok(SAMPLE_GAIN[v](1) * peak >= 0.04 && SAMPLE_GAIN[v](4) * peak <= 0.13, `${v}: ${(SAMPLE_GAIN[v](1) * peak).toFixed(3)} – ${(SAMPLE_GAIN[v](4) * peak).toFixed(3)} — quiet under the song`);
      assert.ok(SAMPLE_GAIN[v](1) < SAMPLE_GAIN[v](2) && SAMPLE_GAIN[v](2) < SAMPLE_GAIN[v](4) && SAMPLE_GAIN[v](9) === SAMPLE_GAIN[v](4), `${v}: a clear grows with its lines (to 4)`);
      assert.ok(NOTE_GAIN[v] > 0.03 && NOTE_GAIN[v] <= 0.07, `${v}: the clear keeps its own notes under the file`);
    }
    for (const l of [1, 2, 4]) assert.ok(SAMPLE_GAIN.rip(l) > SAMPLE_GAIN.swish(l), `paper's clear is lifted over watercolor's at ${l} line(s)`);
    assert.ok(RUN_LIFT >= 1 && RUN_LIFT <= 2.5);
    // THE LOCK's PITCH: ± 3 % at random each play — on the file's own source node (a one-shot effect; never a song)
    assert.equal(LOCK_PITCH, 0.03);
  }
  assert.match(audio, /const lockRate = \(\) => 1 \+ \(Math\.random\(\) \* 2 - 1\) \* LOCK_PITCH;/);
  assert.equal((audio.match(/rate = lockRate\(\)/g) || []).length, 4, 'the four lock voices (plip · tap — + SKINS 2B: blip · chime) — a clear keeps its pitch');
  assert.match(audio, /src\.playbackRate\.value = rate;/);
  // the credits: the sourced parts CC0, the other layers "generated (Grok)" (the owner checked Grok's terms); a -b backup only if its pick fails
  for (const f of ['watercolor-clear.mp3', 'paper-lock.mp3', 'paper-clear.mp3']) assert.ok((credits.split('\n').find(l => l.startsWith(`- \`${f}\` — `)) || '').includes('generated (Grok)'), `${f}: its generated layer is credited "generated (Grok)"`);
  assert.ok(!(credits.split('\n').find(l => l.startsWith('- `watercolor-lock.mp3`')) || '').includes('generated'), 'watercolor-lock is all sourced');
  assert.ok(!credits.includes('THE BACKUP'), 'every pick imported — no backup in use');
  const script = read('scripts/build-prism-skin-sfx.py');
  for (const b of ['watercolor-lock-b.wav', 'paper-lock-b.wav', 'paper-clear-b.wav']) assert.ok(script.includes(`'${b}'`), `${b} is the pick's backup`);
  assert.ok(script.includes("ALLOWED = ('CC0 1.0', 'CC BY 4.0', 'CC BY 3.0', 'generated (Grok)')"));
});
