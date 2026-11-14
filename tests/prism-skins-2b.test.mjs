// PRISM DROP — SKINS 2B (docs/prism.md "THE SKINS" → SKINS 2B; the owner's decisions: docs/games/plan.md "SKINS 2B").
//   THE NIGHT POOL    neon · ARCADE PIXEL · GALAXY, rotated as SKINS 1 (pool[k % n]); the settings' NIGHT row appears (ROTATE + three tiles)
//   PINS              a night pin wins; an UN-OWNED pin falls back to ROTATE
//   ARCADE PIXEL      an 8 × 8 grid on whole device pixels, 4 variants, NO bloom, Press Start 2P (SIL OFL) fetched only when it shows
//   GALAXY            FILLED clouds (never the neon's dark-centred tubes), 6 variants, a gentle bloom, downloads nothing
//   THE TIERS         the sky's motion + the scanlines + the particle count go FIRST (.pd[data-lite], the fx's lean cap), the board's 3× LAST
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { SKINS, POOLS, ROTATE, ownedOf, poolOf, skinOf, phoneOf } from '../js/games/prism/skins.js';
import { JEWEL, contrast } from '../js/games/prism/skin-kit.js';
import { hexRgb, rgbHsl, hueDiff } from '../js/games/prism/neon.js';
import { PIXEL, GRID, VARIANTS as PIXEL_VARIANTS, pixelGrid, textureOf } from '../js/games/prism/pixel-art.js';
import { clearWord, wordSize } from '../js/games/prism/pixelfx.js';
import { GALAXY, GALAXY_NEAR, VARIANTS as GALAXY_VARIANTS } from '../js/games/prism/galaxy-art.js';
import { PIXEL_PAGE, GALAXY_PAGE } from '../js/games/prism/night-pages.js';
import { stepTier, TOP_TIER, LITE_TIER, tierOf } from '../js/games/prism/tiers.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
const phone = (day = ROTATE, night = ROTATE, grants = null) => ({ pin: { day, night }, grants });
const hue = hex => rgbHsl(hexRgb(hex))[0];
const src = read('js/games/prism/skins.js');
const body = id => { const a = src.indexOf(`const ${id} = {`); return src.slice(a, src.indexOf('\n};', a)); };

test('THE NIGHT POOL = neon · arcade pixel · galaxy, in that order; the rotation deals every one before a repeat, never the same twice in a row', () => {
  assert.deepEqual([...POOLS.night], ['neon', 'pixel', 'galaxy']);
  assert.deepEqual([...POOLS.day], ['crayon', 'watercolor', 'paper'], 'the day pool is untouched');
  for (const id of POOLS.night) { assert.equal(SKINS[id].look, 'night'); assert.equal(SKINS[id].family, 'neon'); assert.equal(SKINS[id].unlock, null, `${id}: everyone owns it`); }
  assert.equal(SKINS.pixel.name, 'ARCADE PIXEL'); assert.equal(SKINS.galaxy.name, 'GALAXY');
  for (let k0 = 0; k0 < 5; k0++) {
    const seq = Array.from({ length: 9 }, (_, i) => skinOf({ sk: k0 + i }, 'night', phone()).id);
    for (let i = 0; i + 3 <= seq.length; i++) assert.equal(new Set(seq.slice(i, i + 3)).size, 3, 'every night skin before a repeat');
    for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1]);
    assert.equal(seq[0], POOLS.night[k0 % 3], 'pool[k % n] — the same on every phone');
  }
  // ONE counter a match: the day + the night skin of a match come from the same k (a mid-match look flip keeps it)
  assert.equal(skinOf({ sk: 4 }, 'day', phone()).id, 'watercolor'); assert.equal(skinOf({ sk: 4 }, 'night', phone()).id, 'pixel');
  // a game from before SKINS 1 (no counter) still opens on neon
  assert.equal(skinOf({}, 'night', phone()).id, 'neon');
});

test('THE NIGHT ROW: the settings sheet shows NIGHT SKIN now (ROTATE + one tile per owned night skin); a look with ONE owned skin still has none', () => {
  assert.deepEqual(ownedOf('night', phone()), ['neon', 'pixel', 'galaxy']);
  const p = read('js/games/prism/picker.js');
  assert.match(p, /for \(const look of \['day', 'night'\]\) \{\s+const ids = ownedOf\(look, phone\);\s+if \(ids\.length < 2\) continue;/, 'a row per look with 2+ owned skins');
  assert.match(p, /const opts = \[ROTATE, \.\.\.ids\]\.map\(id => \{/, 'ROTATE + a tile per owned skin');
  assert.match(p, /label: look === 'day' \? 'DAY SKIN' : 'NIGHT SKIN'/);
  // the tiles draw each skin's OWN sprites (no thumbnail) — and never name a skin
  assert.match(p, /skin\.sprite\(px, 'block', t, skin\.pieceV\(x, y, t\), env\)/);
  assert.doesNotMatch(code('js/games/prism/picker.js'), /'(neon|pixel|galaxy|crayon|watercolor|paper)'/);
  // a phone that owns only the look's first skin: no row (nothing to choose)
  const locked = { ...SKINS, pixel: { ...SKINS.pixel, unlock: { level: 20 } }, galaxy: { ...SKINS.galaxy, unlock: { level: 30 } } };
  assert.deepEqual(ownedOf('night', phone(), locked), ['neon']);
  // the setting: this phone only
  assert.match(read('js/audio/settings.js'), /prismSkinDay: 'rotate', prismSkinNight: 'rotate'/);
});

test('PINS: a night pin wins on every match; an UN-OWNED pin falls back to ROTATE (the skins it does own, in turn); a grant makes it its own again', () => {
  for (const id of POOLS.night) {
    assert.deepEqual(poolOf('night', phone(ROTATE, id)), [id]);
    for (let k = 0; k < 7; k++) assert.equal(skinOf({ sk: k }, 'night', phone(ROTATE, id)).id, id);
    assert.deepEqual(poolOf('day', phone(ROTATE, id)), poolOf('day', phone()), 'a night pin never touches the day row');
  }
  assert.deepEqual(phoneOf({ prismSkinNight: 'galaxy' }).pin, { day: ROTATE, night: 'galaxy' });
  // galaxy LOCKED behind a level this phone has not reached: its pin = ROTATE over what it owns (neon · pixel)
  const locked = { ...SKINS, galaxy: { ...SKINS.galaxy, unlock: { level: 30 } } };
  assert.deepEqual(ownedOf('night', phone(ROTATE, 'galaxy'), locked), ['neon', 'pixel']);
  assert.deepEqual(poolOf('night', phone(ROTATE, 'galaxy'), locked), ['neon', 'pixel'], 'an un-owned pin = ROTATE');
  assert.deepEqual(poolOf('night', phone(ROTATE, 'pixel'), locked), ['pixel'], 'an owned pin still wins');
  // the server's grant: the pin is its own again
  assert.deepEqual(poolOf('night', phone(ROTATE, 'galaxy', { galaxy: true }), locked), ['galaxy']);
  // a pin of the other look / a retired id = ROTATE
  assert.deepEqual(poolOf('night', phone(ROTATE, 'paper')), ['neon', 'pixel', 'galaxy']);
  assert.deepEqual(poolOf('night', phone(ROTATE, 'glass')), ['neon', 'pixel', 'galaxy']);
});

test('ARCADE PIXEL: an 8 × 8 grid on WHOLE device pixels at every cell size; 4 variants; NO bloom; the colour families hold', () => {
  assert.equal(GRID, 8); assert.equal(PIXEL_VARIANTS, 4); assert.equal(SKINS.pixel.variants, 4);
  for (let size = 16; size <= 120; size++) {
    const g = pixelGrid(size);
    assert.equal(g.length, 9); assert.equal(g[0], 0); assert.equal(g[8], size);
    for (let i = 0; i < 8; i++) { assert.ok(Number.isInteger(g[i]), `size ${size}: line ${i} on a whole pixel`); assert.ok(g[i + 1] - g[i] >= Math.floor(size / 8) && g[i + 1] - g[i] <= Math.ceil(size / 8), 'the pixels are even to within one device pixel'); }
  }
  // NO BLOOM: no baked glow under the stack / the piece, no light layer, no WebGL world; its art never blurs
  assert.equal(SKINS.pixel.glow, 0); assert.equal(SKINS.pixel.pieceGlow, 0); assert.equal(SKINS.pixel.light, false); assert.equal(SKINS.pixel.world, 'page');
  for (const f of ['js/games/prism/pixel-art.js', 'js/games/prism/pixelfx.js']) assert.doesNotMatch(code(f), /shadowBlur|createRadialGradient|createLinearGradient|filter\s*=/, `${f}: flat squares only`);
  // the texture pixels sit INSIDE the field (never on the bevel, never on a glint) — the same on every phone
  for (let t = 1; t <= 7; t++) for (let v = 0; v < 4; v++) {
    const tx = textureOf(t, v);
    assert.ok(tx.length >= 1 && tx.length <= 2);
    for (const [x, y] of tx) assert.ok(x >= 2 && x <= 5 && y >= 3 && y <= 5, `texture (${x},${y})`);
    assert.deepEqual(textureOf(t, v), tx);
  }
  for (let t = 1; t <= 7; t++) assert.ok(Math.abs(hueDiff(hue(JEWEL[t]), hue(PIXEL[t]))) <= 20, `piece ${t} keeps its colour family`);
  // the incoming rows keep the kit's rules (an occupied cell only tinted, the gap open) — the shared painter, never a copy
  assert.match(body('pixel'), /incoming: sketchIncoming\(\{/);
  assert.match(body('galaxy'), /incoming: sketchIncoming\(\{/);
});

test("ARCADE PIXEL's clear: LINE! · DOUBLE! · TRIPLE! on the rows; the view's callout names the rest (never the name twice); reduced = the flash only", async () => {
  assert.equal(clearWord({ lines: 1 }), 'LINE!'); assert.equal(clearWord({ lines: 2 }), 'DOUBLE!'); assert.equal(clearWord({ lines: 3 }), 'TRIPLE!');
  assert.equal(clearWord({ lines: 4 }), null, "4 LINES is the view's callout");
  assert.equal(clearWord({ lines: 2, twist: 'twist' }), null); assert.equal(clearWord({ lines: 4, pc: true }), null);
  // the word: a multiple of 8 device px (one font pixel = whole device pixels), never wider than the well
  for (const px of [48, 65, 87, 97, 114]) for (const t of ['LINE!', 'DOUBLE!', 'TRIPLE!']) { const F = wordSize(t, px); assert.equal(F % 8, 0); assert.ok(F * t.length <= px * 10 * 0.9 + 1e-9 && F <= px * 1.5); assert.ok(F >= px * 0.9, `${t} is BIG (${F} at a ${px}-px cell)`); }
  const mk = () => ({ e: 'clear', lines: 2, rows: [0, 1], cells: [Array(10).fill(1), Array(10).fill(2)], combo: 0, pc: false });
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) }) };
  try {
    const { createPixelFx, HOLD_MS } = await import('../js/games/prism/pixelfx.js');
    const p = createPixelFx();
    assert.deepEqual(p.event(mk(), { px: 96, reduced: false }), { hold: HOLD_MS, gap: true }, 'the row is held EMPTY under the flash bar');
    assert.equal(p.busy, true);
    const r = createPixelFx();
    assert.deepEqual(r.event(mk(), { px: 96, reduced: true }), { hold: 90, gap: true });
    assert.equal(r.event({ e: 'lock', t: 1, cells: [[0, 0]] }, { px: 96, reduced: true }), null);
    r.erase([{ y: 0, h: 96, gap: 3 }], { px: 96, reduced: true });
    // (reduced: the flash's clear is the only thing live — no burst pixel, no word, no blink)
    const drawn = [];
    const ctx = new Proxy({}, { get: (_, k) => (k === 'drawImage' ? () => drawn.push(1) : () => {}), set: () => true });
    r.over(ctx, { px: 96, sy: y => y * 96, H: 1920 }); r.streaks(ctx, { px: 96, sy: y => y * 96, H: 1920 });
    assert.equal(drawn.length, 0, 'reduced effects: nothing but the flash');
    const { createGalaxyFx, HOLD_MS: GH } = await import('../js/games/prism/galaxyfx.js');
    assert.deepEqual(createGalaxyFx().event(mk(), { px: 96, reduced: false }), { hold: GH, gap: true });
    assert.equal(createGalaxyFx().event(mk(), { px: 96, reduced: true }), null, 'the galaxy reduced: a quick fade in place — no hold, no dust');
  } finally { delete globalThis.document; }
});

test('GALAXY: FILLED glowing clouds (never a dark-centred tube); 6 variants; a gentle bloom; the colour families hold; its small mini is filled too', () => {
  assert.equal(GALAXY_VARIANTS, 6); assert.equal(SKINS.galaxy.variants, 6);
  assert.ok(SKINS.galaxy.glow > 0 && SKINS.galaxy.glow <= 0.7 && SKINS.galaxy.pieceGlow > 0, 'a gentle bloom on the rims (the baked ring, the tier\'s glow)');
  assert.equal(SKINS.galaxy.light, false); assert.equal(SKINS.galaxy.world, 'page');
  for (let t = 1; t <= 7; t++) {
    assert.ok(Math.abs(hueDiff(hue(JEWEL[t]), hue(GALAXY[t]))) <= 20, `piece ${t} keeps its colour family`);
    assert.ok(Math.abs(hueDiff(hue(GALAXY[t]), hue(GALAXY_NEAR[t]))) <= 75, `piece ${t}: its second hue is a NEIGHBOUR (${GALAXY_NEAR[t]})`);
    const [, s, l] = rgbHsl(hexRgb(GALAXY[t]));
    assert.ok(s >= 0.7 && l >= 0.5, `piece ${t} is bright + saturated — colour first`);
  }
  const art = read('js/games/prism/galaxy-art.js'), blk = art.slice(art.indexOf('function block('), art.indexOf('/** the rim\'s gentle bloom'));
  // the fill starts from the piece's OWN colour at the middle (the neon's core is the colour mixed 80–90 % toward black)
  assert.match(blk, /fg\.addColorStop\(0, col\);/);
  assert.doesNotMatch(blk, /mix\(col, BLACK, 0\.[89]/, 'no dark core');
  assert.match(read('js/games/prism/neon-art.js'), /cg\.addColorStop\(0, mix\(col, '#000000', junk \? 0\.74 : 0\.8\)\);/, 'the neon keeps its dark core — the two never read alike');
  // the small mini: the colour FILLED inside a lighter rim (the neon's small mini is a lit edge round a dark core)
  assert.match(body('galaxy'), /ctx\.fillStyle = c; ctx\.fillRect\(X \+ e, Y \+ e, s - 2 \* e, s - 2 \* e\);/);
  // readable ink on both new skins' panels
  for (const id of ['pixel', 'galaxy']) { const t = SKINS[id].tokens; assert.ok(contrast(t.ink, t.panel) >= 7 && contrast(t.sub, t.panel) >= 4.5, id); }
});

test("ONLY THE SHOWN SKIN's ASSETS: the pixel font loads in the pixel's enter() only; the galaxy downloads nothing; neither page lists a file", () => {
  assert.deepEqual(PIXEL_PAGE.files({}), []); assert.deepEqual(GALAXY_PAGE.files({}), []);
  assert.match(body('pixel'), /enter\(\{ sky \} = \{\}\) \{ loadPixelFont\(\); pixelSky\(sky\); \}/);
  assert.match(body('galaxy'), /enter\(\{ sky \} = \{\}\) \{ galaxySky\(sky\); \}/);
  for (const id of ['neon', 'galaxy', 'crayon', 'watercolor', 'paper', 'glass']) assert.doesNotMatch(body(id), /loadPixelFont/, `${id} never loads the pixel font`);
  for (const id of ['pixel', 'galaxy']) assert.doesNotMatch(body(id), /loadImg|loadMarker|warmDay/, `${id} loads no paper + no marker font`);
  // the font is fetched by a FontFace built in the loader (never an @font-face in the CSS, which would load with the stylesheet's first use)
  assert.doesNotMatch(read('css/prism.css'), /@font-face/);
  assert.match(read('js/games/prism/pixel-art.js'), /new FontFace\('PD Pixel', `url\(\$\{FONT\.href\}\) format\('woff2'\)`/);
  // Press Start 2P: the file, small, + its licence beside it (SIL OFL 1.1) + the credit line
  assert.ok(statSync(new URL('../assets/fonts/prism/press-start-2p-latin-400.woff2', import.meta.url)).size < 20 * 1024);
  assert.match(read('assets/fonts/prism/LICENSE-PressStart2P.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(read('assets/prism/paper/CREDITS.md'), /Press Start 2P/);
  assert.match(read('js/ui/credits.js'), /Press Start 2P — PRISM DROP’s ARCADE PIXEL skin', by: .+SIL Open Font License 1\.1/, 'the in-app credits (☰ → CREDITS)');
  // the galaxy's drifting field is made in code (a data URL) — no asset
  assert.match(read('js/games/prism/night-pages.js'), /driftUrl = c\.toDataURL\('image\/png'\)/);
});

test('THE TIERS: a night PAGE skin steps like the day — the sky\'s motion, the scanlines + the particle count go FIRST, the board\'s 3× LAST', () => {
  // the step (tiers.js — a page skin's class step): 3 → 1 (the extras) → 0 (the board's 2×)
  const down1 = stepTier(TOP_TIER, -1, 'crayon'), down2 = stepTier(down1, -1, 'crayon');
  assert.equal(down1, LITE_TIER); assert.equal(tierOf(down1).board, tierOf(TOP_TIER).board, 'the first step keeps the 3× board');
  assert.ok(tierOf(down2).board < tierOf(TOP_TIER).board, 'the board\'s sharpness goes last');
  const v = read('js/games/prism/view.js');
  assert.match(v, /const tierLook = skin\.world === 'page' \? 'crayon' : 'neon';/, 'a page skin (day OR night) steps by class');
  assert.match(v, /if \(root\) root\.toggleAttribute\('data-lite', tier <= LITE_TIER\);/, 'the CSS learns the lower tiers');
  assert.match(v, /if \(still !== lastStill\) \{ lastStill = still; root\.toggleAttribute\('data-still', still\); \}/, 'the CSS learns reduced effects');
  assert.match(v, /if \(els\.sky\) els\.sky\.replaceChildren\(\);\s+\/\/[^\n]*\n\s+skin\.enter\(\{ root, paper, sky: els\.sky \}\);/, "another skin's sky goes at once");
  const css = read('css/prism.css');
  assert.match(css, /\.pd:is\(\[data-lite\], \[data-still\]\) \.pd-tw \{ animation: none;/, 'the twinkle stops');
  assert.match(css, /\.pd:is\(\[data-lite\], \[data-still\]\) \.pd-drift \{ animation: none; \}/, 'the drift stops');
  assert.match(css, /\.pd\[data-skin='pixel'\]\[data-lite\]::after \{ display: none; \}/, 'the scanlines go');
  // the sky only ever moves on the compositor: transform / opacity keyframes
  const kf = n => css.slice(css.indexOf(`@keyframes ${n} {`), css.indexOf('\n', css.indexOf(`@keyframes ${n} {`)));
  assert.match(kf('pd-tw'), /^@keyframes pd-tw \{( \d+% \{ opacity: [\d.]+; \})+ \}$/);
  assert.match(kf('pd-drift'), /^@keyframes pd-drift \{ to \{ transform: translate3d\(.+\); \} \}$/);
  // the particle count: the fx's lean cap (tiers.js sparks ≤ 100 at tiers 0 + 1)
  for (const f of ['pixelfx.js', 'galaxyfx.js']) assert.match(read(`js/games/prism/${f}`), /const lean = \(\) => cap <= 100;/, f);
  // no shader work: both are page skins whose WebGL world + light layer are hidden
  assert.match(css, /\.pd:is\(\[data-skin='pixel'\], \[data-skin='galaxy'\]\) :is\(\.pd-world, \.pd-light\) \{ visibility: hidden; \}/);
});

test('NO PILLS in the new skins: no capsule radius in their CSS; the pixel skin is square-cornered', () => {
  const css = read('css/prism.css'), a = css.indexOf('SKINS 2B — THE NIGHT SKINS that are PAGE skins'), b = css.indexOf('@media (prefers-reduced-motion: reduce)', a);
  const blk = css.slice(a, b);
  assert.ok(a > 0 && b > a);
  assert.doesNotMatch(blk, /border-radius:\s*(999|9999|50%|[2-9]\dpx)/, 'no capsule');
  const px = blk.split('\n').filter(l => l.includes("[data-skin='pixel']") && /border-radius/.test(l));
  assert.ok(px.length >= 5);
  for (const l of px) assert.match(l, /border-radius: 0;/, l.slice(0, 80));
});
