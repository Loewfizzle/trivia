// FREEFALL F5A — THE BILLBOARD = A · THE LOGO (docs/freefall.md "THE BILLBOARD"; the readability proof in the city is the browser half:
// tests/integration/freefall-billboard.mjs). Static: the painter's layout is HIGH RISE's B1 formula (848 : 448, a dark foot band a quarter
// of the height), the baked face ships small, and NOTHING installs it — no game graph, no city file reads it (the CITY chat does that at
// go-live).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { BOARD } from '../js/games/freefall/billboard.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE BILLBOARD: 848 : 448, the foot band a quarter of the height, the logo big on the left, the tower on the right; OPEN NOW from Bowlby One\'s path data (handed in — no import across games)', () => {
  assert.deepEqual([BOARD.w, BOARD.h, BOARD.band], [848, 448, 0.25]);
  assert.ok(BOARD.logoW >= 0.55 && BOARD.logoX < 0.06, 'the lettering BIG on the left');
  assert.ok(BOARD.towerBallX > 0.7, 'the burning tower on the right');
  assert.ok(BOARD.city.x + BOARD.city.w <= 3072 && BOARD.city.y + BOARD.city.h <= 1024, 'the city is a part of FREEFALL\'s own panorama (3072 × 1024)');
  assert.ok(Math.abs(BOARD.city.w / BOARD.city.h - BOARD.w / BOARD.h) < 0.02, '… of the board\'s own shape (never stretched)');
  const src = read('js/games/freefall/billboard.js');
  assert.doesNotMatch(src, /^import /m, 'the painter imports nothing: its pictures + the lettering\'s paths are handed in');
  assert.match(src, /c\.fillStyle = '#ffffff'; c\.fill\(p\);/, 'OPEN NOW: WHITE on the dark band');
  const build = read('scripts/build-freefall-billboard.mjs');
  assert.match(build, /import\('\/js\/games\/highrise\/billboard-glyphs\.js'\)/, 'the builder hands the painter HIGH RISE\'s OPEN NOW paths');
  assert.match(build, /assets\/freefall\/sky\/rooftop-night\.webp/); assert.match(build, /assets\/freefall\/title\/lettering-1170\.webp/);
  assert.doesNotMatch(build, /https?:\/\/(?!localhost)/, 'nothing is fetched from outside');
});

test('THE FACE ships small — and is NOT installed: no game module, no city file names it', () => {
  const u = new URL('../assets/city/freefall/billboard.webp', import.meta.url);
  assert.ok(statSync(u).size > 20000 && statSync(u).size < 110000, `assets/city/freefall/billboard.webp ${statSync(u).size} B`);
  assert.deepEqual(readdirSync(new URL('../assets/city/freefall/', import.meta.url)), ['billboard.webp']);
  for (const f of readdirSync(new URL('../js/games/freefall/', import.meta.url))) if (f !== 'billboard.js') assert.doesNotMatch(read(`js/games/freefall/${f}`), /billboard/, `${f} knows no billboard`);
  for (const dir of ['js/screens/harbor', 'js/core']) for (const f of readdirSync(new URL(`../${dir}/`, import.meta.url))) if (f.endsWith('.js')) assert.doesNotMatch(read(`${dir}/${f}`), /city\/freefall\/billboard/, `${dir}/${f}: the city does not show it yet`);
});
