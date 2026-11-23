// JAYWALK SMOOTH 2 (docs/games/passes/jaywalk-smooth2.md): nothing in the frame reads the GPU back, the seasonal layer's frame paths make no garbage,
// what a run first needs is warmed before anyone plays, and the meter can say what KIND of drop it saw.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dropKinds, frameStats, LATE_PAIR_MS, JS_BIG_MS } from '../js/games/jaywalk/lab-hud-stats.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const between = (s, a, b) => { const i = s.indexOf(a); assert.ok(i >= 0, `found: ${a}`); const j = s.indexOf(b, i + a.length); assert.ok(j > i, `found: ${b}`); return s.slice(i, j); };

test('THE ONE-OFF SPIKE: the scene never reads a canvas back mid-run; a hidden gate sign is simply drawn again', () => {
  const n = read('js/games/jaywalk/night.js');
  assert.doesNotMatch(n, /getImageData/, 'no synchronous read-back anywhere in the scene');
  assert.match(n, /if \(o === '0'\) G\.text = null;/, 'a hidden sign is drawn fresh on its next approach (a wiped canvas heals itself)');
});

test('THE ONE-OFF SPIKE: the flyers\' three programs + the first banner are warmed before anyone plays', () => {
  const n = read('js/games/jaywalk/night.js'), w = between(n, 'const flyWarm = (() => {', 'function warm()');
  assert.match(w, /new THREE\.Mesh\(g, new THREE\.MeshStandardMaterial\(\{ vertexColors: true \}\)\)/, 'the UFO\'s settings');
  assert.match(w, /InstancedMesh\(g, new THREE\.MeshStandardMaterial\(\{ vertexColors: true, side: THREE\.DoubleSide \}\), 1\)/, 'the jet\'s settings');
  assert.match(w, /InstancedMesh\(g, new THREE\.MeshBasicMaterial\(\{ vertexColors: true, fog: false, toneMapped: false \}\), 1\)/, 'the flame\'s settings');
  assert.match(n, /fish, \.\.\.flyWarm\.L\]\) \{ put\.push\(/, 'they ride the scene\'s quiet warm frame');
  assert.match(n, /for \(const m of flyWarm\.L\) \{ scene\.remove\(m\); m\.material\.dispose\(\);/, 'freed with the scene');
  const fl = read('js/games/jaywalk/flyers.js');
  assert.match(fl, /jetMat = new THREE\.MeshStandardMaterial\(\{ vertexColors: true, color: 0xffffff, roughness: 0\.36, metalness: 0\.6, envMapIntensity: 1\.5, side: THREE\.DoubleSide \}\)/, 'the jet still has the settings its stand-in copies');
  assert.match(fl, /flameMat = new THREE\.MeshBasicMaterial\(\{ vertexColors: true, fog: false, toneMapped: false \}\)/, 'so does the flame');
  const a = read('js/games/jaywalk/arrival.js');
  assert.match(a, /el\.classList\.add\('is-warm'\)/); assert.match(a, /cancelAnimationFrame\(warmF\)/);
  assert.match(read('css/jaywalk.css'), /\.jw-arrive\.is-warm \{ visibility: visible; opacity: 0\.004; \}/, 'all but invisible');
});

test('NO GARBAGE IN THE SEASONAL FRAME: no closure, string key, spread or literal list on the per-frame paths', () => {
  const s = read('js/games/jaywalk/seasonal.js'), pile = between(s, 'function pileAt(', '// ---- JT1 — THE FOOTPRINTS');
  assert.doesNotMatch(pile, /=>/, 'pileAt makes no closure');
  const grass = between(s, 'grass(i, L, z, lt, AR) {', '/** a kid LANDED'), land = between(s, 'land(L, cx, ly, dir, own, AR) {', '/** the end of a frame');
  for (const [name, body] of [['grass', grass], ['land', land]]) { assert.doesNotMatch(body, /`/, `${name}: no string built`); assert.doesNotMatch(body, /A\.part\([^;]*\{ hex/, `${name}: no options object a particle`); }
  assert.doesNotMatch(between(s, 'end(f) {', '/** J4 — the fall'), /of \[-1, 1\]/, 'the footprints: no list a print');
  const n = read('js/games/jaywalk/night.js');
  assert.doesNotMatch(n, /K\.shadow\.put = \([^)]*\.\.\./, 'the day shadow: no rest array');
  assert.doesNotMatch(n, /Object\.values\(KM?\)\) q\.(reset|done)\(\)/, 'the kinds\' loops: no array a frame');
  assert.doesNotMatch(n, /KM\.kid\.put\(\.\.\./, 'the kid: no spread');
  assert.match(n, /const partFree = \[\]/, 'the particles are pooled');
});

test('AUTUMN\'S GROUND pays only where a leaf can show', () => {
  const f = read('js/games/jaywalk/seasonal-fx.js');
  assert.match(f, /if \(m <= 0\.0\) return vec3\(0\.0\);/, 'outside a leaf: no colour hashes');
  assert.match(f, /if \(m1 < 1\.0\) \{ vec3 l2 = leafAt/, 'under a whole leaf: no second layer');
  assert.match(f, /if \(gz < 0\.17\) \{ vec3 l = leafAt/, 'the road: only the gutters');
});

test('THE METER says what kind of drop it saw', () => {
  assert.ok(LATE_PAIR_MS === 37 && JS_BIG_MS === 14);
  // a late callback: 24 then 9 — two frames' time, no picture lost
  assert.deepEqual(dropKinds([16.7, 24, 9.4, 16.7]), { late: 1, bigJs: 0 });
  // a real slip: 25 then a full frame
  assert.deepEqual(dropKinds([16.7, 25, 16.7]), { late: 0, bigJs: 0 });
  // a BIG frame after a long JS frame · a BIG frame after a short one
  assert.deepEqual(dropKinds([16.7, 34, 16.7, 34], [5, 20, 5, 6]), { late: 0, bigJs: 1 });
  assert.equal(frameStats([16.7, 24, 9.4, 16.7]).drops, 1, 'DROPS still counts it (the owner\'s numbers stay comparable)');
  const h = read('js/games/jaywalk/lab-hud.js');
  assert.match(h, /PAINT_MS = 1000/, 'the text repaints once a second');
  assert.match(h, /if \(!test && now - paintAt >= PAINT_MS\)/, 'and never during a 10 S TEST');
  assert.match(read('css/jaywalk.css'), /\.jw-meter \{ will-change: transform; contain: layout paint style;/, 'in its own layer');
});
