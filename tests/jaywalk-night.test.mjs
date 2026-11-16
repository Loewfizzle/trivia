// JAYWALK H2 — THE NIGHT LOOK + THE KID + THE SOUNDS (docs/jaywalk.md "THE NIGHT LOOK" · "THE ASSETS" · "THE SOUNDS"): the files that came
// in (small, credited, the originals untouched), the scene's contract (the proven camera, THE WIDER VIEW, the tiers, instanced, view only),
// the sounds' table + the voice rule (PURE), the lab's tools. (The browser half: tests/integration/jaywalk-lab.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { SOUNDS, VOICES, HOP_VARY, admit } from '../js/games/jaywalk/sounds.js';

const root = new URL('../', import.meta.url);
const read = f => readFileSync(new URL(f, root), 'utf8');
const bytes = f => readFileSync(new URL(f, root));
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const MODELS = ['car-sedan', 'car-hatchback', 'car-taxi', 'car-van', 'train-front', 'train-carriage', 'bush-planter', 'street-lamp', 'traffic-cone', 'traffic-barrier', 'trash-dumpster', 'crate-box'];

test('THE MODELS: the 12 Kenney models (CC0), re-packed small — one mesh each, the colormap baked into vertex colours, NO texture, never the two trees', () => {
  const dir = readdirSync(new URL('assets/jaywalk/models/', root));
  assert.deepEqual(dir.filter(f => f.endsWith('.glb')).sort(), MODELS.map(m => `${m}.glb`).sort());
  assert.ok(!dir.some(f => /^tree-/.test(f)), 'Kenney\'s trees are not used (the round puffy trees are built in code)');
  let total = 0;
  for (const m of MODELS) {
    const b = bytes(`assets/jaywalk/models/${m}.glb`);
    total += b.length;
    assert.equal(b.readUInt32LE(0), 0x46546c67, `${m}: a GLB`); assert.equal(b.readUInt32LE(4), 2); assert.equal(b.readUInt32LE(8), b.length, `${m}: its length`);
    const j = JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString('utf8'));
    assert.ok(!j.images && !j.textures && !j.samplers, `${m}: no texture ships`);
    assert.equal(j.nodes.length, 1); assert.equal(j.meshes.length, 1); assert.equal(j.meshes[0].primitives.length, 1);
    const a = j.meshes[0].primitives[0].attributes;
    assert.deepEqual(Object.keys(a).sort(), ['COLOR_0', 'NORMAL', 'POSITION'], `${m}: no tangents, no UVs`);
    assert.equal(j.accessors[a.POSITION].componentType, 5122); assert.equal(j.accessors[a.NORMAL].componentType, 5120); assert.equal(j.accessors[a.COLOR_0].type, 'VEC4');
    assert.match(j.asset.copyright, /Kenney.*CC0/);
    assert.ok(b.length < 60 * 1024, `${m}: ${b.length} B`);
  }
  assert.ok(total < 320 * 1024, `the set: ${total} B (the delivery was 1,174 KB)`);
  const lic = read('assets/jaywalk/models/LICENSE.txt');
  for (const kit of ['Car Kit', 'Train Kit', 'City Kit Suburban', 'City Kit Roads']) assert.ok(lic.includes(kit) && /Creative Commons Zero, CC0/.test(lic), `LICENSE.txt: ${kit}`);
  // a car's body paint is marked (COLOR_0's alpha 0): the view re-tints only the paint
  const b = bytes('assets/jaywalk/models/car-sedan.glb'), jl = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + jl).toString('utf8')), bin = 20 + jl + 8, n = j.accessors[2].count;
  let paint = 0;
  for (let v = 0; v < n; v++) if (b[bin + v * 16 + 15] === 0) paint++;
  assert.ok(paint > 100 && paint < n / 2, `the sedan's paint: ${paint} of ${n} vertices`);
  assert.match(read('scripts/build-jaywalk-assets.py'), /never moved, renamed or edited/);
});

test('THE SKYLINE + THE SOUNDS: the night band ≤ 150 KB; every pick + every -b backup; the bells as 16-bit mono WAV (the whole file is the loop); the credits', () => {
  const sky = statSync(new URL('assets/jaywalk/skyline-night.webp', root)).size;
  assert.ok(sky > 20 * 1024 && sky <= 150 * 1024, `skyline-night.webp: ${sky} B`);
  assert.ok(!existsSync(new URL('assets/jaywalk/skyline-day.webp', root)), 'the day picture comes with the day look (H5)');
  const have = readdirSync(new URL('audio/jaywalk/', root)).sort();
  const want = SOUNDS.flatMap(s => [`${s.id}.${s.ext || 'mp3'}`, ...(s.b ? [`${s.id}-b.${s.ext || 'mp3'}`] : [])]);
  assert.deepEqual(have, [...want, 'CREDITS.md'].sort(), 'audio/jaywalk = the table\'s files + CREDITS.md');
  assert.equal(SOUNDS.length, 12); assert.equal(SOUNDS.filter(s => s.b).length, 7);
  for (const [f, frames] of [['train-bell.wav', 84405], ['train-bell-b.wav', 78572]]) {
    const w = bytes(`audio/jaywalk/${f}`);
    assert.equal(w.toString('ascii', 0, 4), 'RIFF'); assert.equal(w.readUInt16LE(22), 1, 'mono'); assert.equal(w.readUInt32LE(24), 44100); assert.equal(w.readUInt16LE(34), 16, '16-bit');
    assert.equal(w.readUInt32LE(40) / 2, frames, `${f}: the delivery's exact sample count (its loop)`);
  }
  const cr = read('audio/jaywalk/CREDITS.md');
  for (const who of ['InspectorJ', 'SkyernAklea', 'TommasoMotteran']) assert.ok(cr.includes(who), `CC BY 4.0: ${who} credited`);
  assert.match(cr, /3D models: Kenney — kenney\.nl \(CC0\)/);
  assert.doesNotMatch(read('.vercelignore'), /jaywalk/, 'the files deploy');
});

test('THE SOUNDS (PURE): in play = hop · land-wood · hit · splash; ≈ 8 voices by PRIORITY — your own hit / splash over a hop / a landing', () => {
  assert.deepEqual(SOUNDS.filter(s => s.play).map(s => s.id), ['hop', 'land-wood', 'hit', 'splash']);
  const pri = id => SOUNDS.find(s => s.id === id).pri;
  assert.ok(pri('hit') > pri('hop') && pri('splash') > pri('land-wood'));
  assert.equal(VOICES, 8); assert.deepEqual(HOP_VARY, { rate: 0.06, db: 2 });
  const full = Array.from({ length: 8 }, (_, i) => ({ pri: 1, at: i }));
  assert.deepEqual(admit(full.slice(0, 7), 1), { ok: true, drop: -1 }, 'room: just plays');
  assert.deepEqual(admit(full, 1), { ok: false, drop: -1 }, 'a full house: one more hop is dropped');
  assert.deepEqual(admit(full, 3), { ok: true, drop: 0 }, '… a hit takes the OLDEST hop\'s voice');
  assert.deepEqual(admit([...full.slice(0, 7), { pri: 3, at: 99 }], 3), { ok: true, drop: 0 });
  assert.deepEqual(admit(Array.from({ length: 8 }, (_, i) => ({ pri: 3, at: i })), 3), { ok: false, drop: -1 }, 'never one hit over another');
  const s = code('sfx.js');
  assert.match(s, /import \{ getContext, getSfxBus, isUnlocked, onUnlock \} from '\.\.\/\.\.\/audio\/engine\.js';/, 'the SHARED engine');
  assert.match(s, /trim\.connect\(getSfxBus\(\) \|\| ctx\.destination\)/, 'a soft limiter → the console\'s SFX bus (the slider, the mute, THE CUT)');
  assert.match(s, /createDynamicsCompressor/);
  assert.doesNotMatch(s, /new (window\.)?(webkit)?AudioContext|new Audio\(/, 'never its own audio context / element');
  assert.match(s, /if \(e\.e === 'hop'\) return play\('hop', \{ rate: 1 \+ \(rnd\(\) \* 2 - 1\) \* HOP_VARY\.rate, vol: Math\.pow\(10, \(rnd\(\) \* 2 - 1\) \* HOP_VARY\.db \/ 20\) \}\);/);
  assert.match(s, /e\.e === 'land' && e\.on === 'wood'/); assert.match(s, /e\.cause === 'water' \|\| e\.cause === 'edge' \? play\('splash'\) : play\('hit'\)/);
  assert.match(s, /fetch\(new URL\(`\$\{fileOf\(id, k\.slice\(-1\)\)\}\?v=\$\{JW_SFX_REV\}`, DIR\)\)/, 'its only fetch: audio/jaywalk/');
});

test('THE NIGHT LOOK: the proven camera, THE WIDER VIEW (11 seen by default, 9 — the rules stay 9), instanced kinds, the tiers, reduce motion; a VIEW (no rules, no writes)', () => {
  const n = code('night.js'), fxs = code('night-fx.js'), m = code('models.js');
  assert.match(n, /export const CAM = Object\.freeze\(\{ fov: 54, up: 16, back: 12, ahead: 4\.5, width: 9\.42 \}\);/, 'H1\'s camera, unchanged');
  assert.match(n, /export const WIDTHS = Object\.freeze\(\[9, 11\]\);/);
  assert.match(n, /cols = WIDTHS\.includes\(o\.cols\) \? o\.cols : 11/, 'default 11');
  assert.match(n, /const kOf = \(\) => \(cols \+ 0\.42\) \/ CAM\.width;/, 'one camera: the rig scales about the kid');
  assert.match(read('js/games/jaywalk/tuning.js'), /export const COLS = 9;/);
  assert.match(n, /new THREE\.InstancedMesh\(g, mat, n\)/); assert.match(fxs, /new THREE\.InstancedBufferGeometry\(\)/);
  assert.match(n, /const DPR_AT = \[1\.5, 2, 3\];/, 'full device sharpness at the top tier (≤ 3)');
  assert.match(n, /if \(tier === 2 && !bloom\)/, 'the half-res bloom ONLY at the top tier'); assert.match(n, /if \(tier < 2 && bloom\) \{ bloom\.dispose\(\); bloom = null; \}/);
  assert.doesNotMatch(n + fxs, /PointLight|SpotLight|castShadow|shadowMap/, 'no real point light, no shadow map: pools + blobs');
  assert.doesNotMatch(n + fxs + m, /computeVertexNormals/, 'Kenney\'s normals are never recomputed');
  assert.match(n, /prefers-reduced-motion: reduce/); assert.match(n, /fx\.shake = reduce \? 0 : clock \+ 240;/, 'the shake is off with reduce motion');
  for (const cause of ['car', 'water', 'edge', 'train', 'blackbird', 'wall']) assert.ok(n.includes(`H.cause === '${cause}'`), `a hit of its own: ${cause}`);
  assert.match(n, /for \(let lap = -1; lap <= 1; lap\+\+\)/, 'a mover\'s next lap is drawn: nothing pops at the screen\'s side');
  for (const f of ['night.js', 'night-fx.js', 'models.js', 'audition.js', 'sfx.js', 'sounds.js', 'lab-prefs.js']) {
    const s = code(f);
    for (const bad of [/from '[^']*firebase\.js'/, /from '[^']*\/(room|host|store|seat|identity)\.js'/, /sendBeacon/, /(^|[^.\w])(set|update|remove|runTransaction|dbRef|onValue)\(/m]) assert.doesNotMatch(s, bad, `${f}: ${bad}`);
    if (!['models.js', 'sfx.js'].includes(f)) assert.doesNotMatch(s, /fetch\(/, `${f}: no fetch`);
    if (f !== 'lab-prefs.js') assert.doesNotMatch(s, /localStorage/, `${f}: the lab's memory is lab-prefs.js alone`);
  }
  assert.match(m, /fetch\(new URL\(`\$\{n\}\.glb\?v=\$\{MODEL_REV\}`, DIR\)\)/, 'models.js fetches only assets/jaywalk/models/');
  assert.match(code('lab-prefs.js'), /const KEY = 'jw:lab:';/);
  for (const f of ['engine.js', 'course.js', 'replay.js', 'tuning.js', 'logic.js', 'director.js']) assert.doesNotMatch(code(f), /night|models\.js|sfx|three/, `${f} never knows the view`);
});

test('THE LAB\'s TOOLS: ?gray=1 keeps the graybox, WIDTH 9 · 11 (remembered), SOUNDS → THE SHEET, every button on its own press + lift; the skyline + the neon count', () => {
  const lab = code('lab.js'), au = code('audition.js'), css = read('css/jaywalk.css'), html = read('jaywalk-lab.html');
  assert.match(lab, /const GRAY = Q\.get\('gray'\) === '1';/);
  assert.match(lab, /GRAY \? lazyImport\(import\('\.\/graybox\.js'\), '\.\/graybox\.js'\) : lazyImport\(import\('\.\/night\.js'\), '\.\/night\.js'\)/, 'only the look asked for is fetched');
  assert.match(lab, /getPref\('cols', '11'\) === '9' \? 9 : 11/); assert.match(lab, /setPref\('cols', n\)/);
  assert.match(lab, /E\.installAudio\(\); S\.fetchSounds\(\);/, 'the SHARED engine: unlocked by the first tap, the bytes at preload');
  assert.match(lab, /if \(snd\) snd\.onEvent\(e\);/);
  assert.match(lab, /createTiers\(\{ apply: t => \{ if \(view\.setTier\) view\.setTier\(t\); \}/, 'AUTOMATIC quality steps (the match kit\'s tiers)');
  assert.match(au, /openSheet\(\{ title: 'SOUNDS'/); assert.doesNotMatch(au, /addEventListener\('click'/, 'never a click');
  assert.match(au, /navigator\.clipboard\.writeText\(text\)/); assert.match(au, /PRESS AND HOLD THE LINE ABOVE TO COPY IT/, 'a refused clipboard is never a dead button');
  assert.match(html, /<link rel="stylesheet" href="css\/components\.css">/, 'THE SHEET + THE NEON TUBE\'s look');
  assert.match(css, /\.jw-skyline \{[^}]*height: 24%;/); assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.jw-sky-l, \.jw-sky-n \{ animation: none; \} \}/);
  assert.match(css, /\.jw-stage:not\(\.is-gray\) \.jw-lanes \{ font: 700 76px\/1 var\(--font-num/, 'the numbers\' font (Orbitron\'s heavy 0 reads as a block)');
  assert.doesNotMatch(css.slice(css.indexOf('THE SKYLINE BAND')), /border-radius/, 'no pills');
  for (const k of ['jw-blink', 'jw-flick', 'jw-pop']) { const body = css.slice(css.indexOf(`@keyframes ${k}`)).split('\n')[0]; assert.doesNotMatch(body, /box-shadow|filter|width|height|left|top/, `${k}: transform / opacity only`); }
});
