// JAYWALK H2 — THE NIGHT LOOK + THE KID + THE SOUNDS (docs/jaywalk.md "THE NIGHT LOOK" · "THE ASSETS" · "THE SOUNDS"): the files that came
// in (small, credited, the originals untouched), the scene's contract (the proven camera, THE WIDER VIEW, the tiers, instanced, view only),
// the sounds' table + the voice rule (PURE), the lab's tools. (The browser half: tests/integration/jaywalk-lab.mjs.)
import test from 'node:test';
import { causeLine } from '../js/games/jaywalk/causes.js';
const causeLineOf = vehicle => causeLine({ cause: 'car', vehicle });
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
  assert.equal(SOUNDS.length, 11); assert.equal(SOUNDS.filter(s => s.b).length, 6);   // (H4: ONE LIFE — the RESPAWN sound left with respawn)
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

test('THE NIGHT LOOK: THE CAMERA is camera.js (H2B — the rules stay 9 columns), instanced kinds, the tiers, reduce motion; a VIEW (no rules, no writes)', () => {
  const n = code('night.js'), fxs = code('night-fx.js'), m = code('models.js');
  assert.match(n, /import \{ CAM, createCamera \} from '\.\/camera\.js';/, 'ONE camera, shared with the graybox (tests/jaywalk-camera.test.mjs)');
  assert.match(n, /rig\.follow\(run\.st === 'hop' \? run\.tx \/ FP : down && H \? H\.x : kx, run\.st === 'hop' \? run\.ty \+ 0\.5 : down \? \(H \? H\.y : ky\) : ky, dt\);/, 'the follow leads a hop to where it lands — up the lanes AND sideways');
  assert.match(read('js/games/jaywalk/tuning.js'), /export const COLS = 9;/);
  assert.match(n, /new THREE\.InstancedMesh\(g, mat, n\)/); assert.match(fxs, /new THREE\.InstancedBufferGeometry\(\)/);
  assert.match(n, /const DPR_AT = \[1\.5, 2, 3\];/, 'full device sharpness at the top tier (≤ 3)');
  assert.match(n, /if \(tier === 2 && !bloom\)/, 'the half-res bloom ONLY at the top tier'); assert.match(n, /if \(tier < 2 && bloom\) \{ bloom\.dispose\(\); bloom = null; \}/);
  assert.doesNotMatch(n + fxs, /PointLight|SpotLight|castShadow|shadowMap/, 'no real point light, no shadow map: pools + blobs');
  assert.doesNotMatch(n + fxs + m, /computeVertexNormals/, 'Kenney\'s normals are never recomputed');
  assert.match(n, /prefers-reduced-motion: reduce/); assert.match(n, /fx\.shake = reduce \? 0 : clock \+ 240;/, 'the shake is off with reduce motion');
  for (const cause of ['car', 'water', 'edge', 'train', 'blackbird', 'wall']) assert.ok(n.includes(`H.cause === '${cause}'`), `a hit of its own: ${cause}`);
  assert.match(n, /for \(let lap = -1; lap <= 1; lap\+\+\)/, 'a mover\'s next lap is drawn: nothing pops at the screen\'s side');
  for (const f of ['night.js', 'night-fx.js', 'models.js', 'camera.js', 'audition.js', 'sfx.js', 'sounds.js', 'lab-prefs.js']) {
    const s = code(f);
    for (const bad of [/from '[^']*firebase\.js'/, /from '[^']*\/(room|host|store|seat|identity)\.js'/, /sendBeacon/, /(^|[^.\w])(set|update|remove|runTransaction|dbRef|onValue)\(/m]) assert.doesNotMatch(s, bad, `${f}: ${bad}`);
    if (!['models.js', 'sfx.js'].includes(f)) assert.doesNotMatch(s, /fetch\(/, `${f}: no fetch`);
    if (f !== 'lab-prefs.js') assert.doesNotMatch(s, /localStorage/, `${f}: the lab's memory is lab-prefs.js alone`);
  }
  assert.match(m, /fetch\(new URL\(`\$\{n\}\.glb\?v=\$\{MODEL_REV\}`, DIR\)\)/, 'models.js fetches only assets/jaywalk/models/');
  assert.match(code('lab-prefs.js'), /const KEY = 'jw:lab:';/);
  for (const f of ['engine.js', 'course.js', 'replay.js', 'tuning.js', 'logic.js', 'director.js']) assert.doesNotMatch(code(f), /night\.js|night-fx|models\.js|sfx\.js|camera\.js|from 'three'/, `${f} never knows the view`);
});

test('H2B\'s LOOK FIXES: the water reads as water, the kid always stands out, a real box truck, no junk-looking props', () => {
  const n = code('night.js'), fxs = read('js/games/jaywalk/night-fx.js'), m = code('models.js');
  // THE WATER (H4 — the owner, Nov 16: CALM, real-looking night water — no electric zigzags): a deep night blue, navy → teal (never near-black,
  // never electric), soft uneven ripples from drifting noise fields (never a sine stripe), gentle reflections + small glints, a thin soft foam line
  const water = fxs.slice(fxs.indexOf('} else if (type < 2.5) {'), fxs.indexOf('} else if (type < 3.5) {'));
  const base = /c = mix\(vec3\(([\d.]+), ([\d.]+), ([\d.]+)\), vec3\(([\d.]+), ([\d.]+), ([\d.]+)\), w \* w[^;]*\);/.exec(water);
  assert.ok(base, 'the water\'s two colours');
  const [r0, g0, b0, r1, g1, b1] = base.slice(1).map(Number);
  assert.ok(b0 >= 0.12 && b0 > g0 * 2 && b0 > r0 * 6, `the troughs: a deep navy, not black (${base.slice(1, 4).join(' ')})`);
  assert.ok(b1 >= 0.25 && b1 > g1 && g1 > r1 * 4 && b1 <= 0.6, `the swell: teal — still blue, never the electric blue (${base.slice(4).join(' ')})`);
  assert.ok((water.match(/vnoise\(/g) || []).length >= 3, 'soft UNEVEN ripples: drifting generated noise — no texture file');
  assert.doesNotMatch(water.replace(/\/\/[^\n]*/g, ''), /float crest =|sin\(z \* 1[0-9]|float wob =|float streak =/, 'NO zigzags: no sine crests, no wobbling streaks');
  assert.match(water, /float rip = /, 'the ripples: thin pale contour lines'); assert.match(water, /float gl = step\(/, 'small moving glints of the neon');
  assert.match(water, /abs\(dn - 2\.0\)\), shU = step\(0\.5, abs\(up - 2\.0\)\)/, 'the banks only where the neighbour is not water');
  const foam = /float foam = max\(smoothstep\(([\d.]+) \+ lap, ([\d.]+) \+ lap, z\)/.exec(water), fmix = /c = mix\(c, vec3\([\d., ]+\), foam \* \(?([\d.]+)/.exec(water);
  assert.ok(foam && +foam[1] <= 0.1 && fmix && +fmix[1] <= 0.8, `a THINNER, SOFT foam line at the banks (edge ${foam && foam[1]}, strength ${fmix && fmix[1]})`);
  assert.match(n, /K\.flat\.put\(X\(tailX - L\.dir \* [\d.]+\), [^;]*0x[0-9a-f]{6}, 1, 1, 0\.\d+ \* dim\);/, 'a soft wake behind each log');
  // THE LOGS (H3 — the owner, Nov 16): all the SAME thickness, each its OWN length (1–4 cells — one geometry a length, nothing stretched), round +
  // half-sunk (lit on top, dark down the sides), bark grain along the length, pale ringed ends; NO moss, NO branch stub, NO dot
  assert.match(m, /export function buildLog\(len\)/); assert.match(n, /log1: buildLog\(1\), log2: buildLog\(2\), log3: buildLog\(3\), log4: buildLog\(4\), truck/, 'one geometry a length — nothing stretched');
  assert.match(n, /K\[`log\$\{n\}`\]\.put\(cx, by, z, 1, 1, 1, 0,/, '… drawn at scale 1: every log the same thickness');
  assert.match(m, /export const LOG = Object\.freeze\(\{ r: 0\.36, top: 0\.36 \}\);/, 'ONE radius — a true circle across');
  assert.doesNotMatch(m, /const rad = x =>/, 'no wobble in its thickness'); assert.match(m, /GRAIN = \[1, 1, 0\.7,/, 'bark grain along the length');
  assert.match(m, /const lit = a => 0\.3 \+ 0\.86 \* Math\.pow\(Math\.max\(0, Math\.cos\(a - 1\.3\)\), 2\.2\);/, 'lit on its shoulder, dark down the sides: round');
  // (H4 — the owner: LOG ENDS = plain pale wood with subtle rings — the banded ends read as a shell)
  const rings = [.../const RINGS = \[(.*?)\];/.exec(m)[1].matchAll(/\[([\d.]+), ([\d.]+), 0x([0-9a-f]{6})\]/g)].map(x => ({ a: +x[1], b: +x[2], lum: (parseInt(x[3].slice(0, 2), 16) * 0.299 + parseInt(x[3].slice(2, 4), 16) * 0.587 + parseInt(x[3].slice(4), 16) * 0.114) / 255 }));
  const wood = rings.slice(0, -1), lums = wood.map(q => q.lum);
  assert.ok(rings.length >= 5 && wood.every(q => q.lum > 0.7), `the cut ends: PALE wood (${lums.map(v => v.toFixed(2)).join(' ')})`);
  assert.ok(Math.max(...lums) - Math.min(...lums) <= 0.1, 'SUBTLE rings: a shade darker, never bands');
  assert.ok(rings[rings.length - 1].lum < Math.min(...lums) - 0.15 && rings[rings.length - 1].b - rings[rings.length - 1].a <= 0.12, 'the bark: a thin darker edge');
  assert.doesNotMatch(m + n, /buildMoss|K\.moss|CircleGeometry\(0\.083|const stub = build\(/, 'NO moss, NO branch stub, NO dot — nothing that could read as a pickup');
  assert.match(n, /const LOG_FEET = 0\.33;/, 'half-sunk: the kid stands on its round back');
  assert.match(n, /roughness: 0\.82, metalness: 0, envMapIntensity: 0\.25/, 'rough wood: the bark is seen, never a glow');
  const logLights = n.slice(n.indexOf('K[`log${n}`].put('), n.indexOf('} else {\n        const p = L.pulse'));
  assert.match(logLights, /0xffa23a, 1, 0, 0\.\d+ \* dim\);/, 'a soft light on the water round it'); assert.match(logLights, /0xffb060, 1, asp, 0\.\d+ \* dim\);/, 'THE WATERLINE: a thin amber ring hugging the log (the glow shader\'s stadium ring)');
  assert.match(logLights, /0x[0-9a-f]{6}, 1, 7 \+ [^;]*0\.\d+ \* \(1 - rp\) \* dim\);/, '… + a small ripple ring swelling off it');
  assert.match(fxs, /a thin STADIUM ring \(the waterline round a log/, 'shape 7');
  assert.doesNotMatch(logLights, /K\.bill\.put/, 'no glowing end caps (they made the pills)');
  assert.match(n, /rock = reduce \? 0 : Math\.sin\(clock \/ 880/, 'the logs rock gently — never with reduce motion');
  // CAR LIGHTS (the add-on): BOTH headlights + BOTH tail lights cast, short + soft, at the lamps' own places on each model — instanced quads
  assert.match(n, /const LAMPS = Object\.freeze\(\{ 'car-sedan': \[[\d.]+, [\d.]+\], 'car-hatchback': \[[\d.]+, [\d.]+\], 'car-taxi': \[[\d.]+, [\d.]+\], 'car-van': \[[\d.]+, [\d.]+\], truck: \[[\d.]+, [\d.]+\], train: \[[\d.]+, [\d.]+\] \}\);/);
  const reach = /const HEAD_REACH = ([\d.]+), TAIL_REACH = ([\d.]+);/.exec(n);
  assert.ok(reach && +reach[1] >= 1 && +reach[1] <= 1.5 && +reach[2] >= 0.5 && +reach[2] <= 1, `a headlight's glow is gone within ${reach && reach[1]} cells, a tail light's within ${reach && reach[2]}`);
  assert.match(n, /for \(const e of \[-hw, hw\]\) \{[^}]*0xfff0c8, 1, 6, 0\.5 \* a1\);[^}]*0xff2030, 1, 0, 0\.5 \* a1\);[^}]*streak, 1, 0\.12, back, tint, 1, 1,[^}]*0xfff0c0, 1, 5,[^}]*0xff2840, 1, 5,[^}]*\}/, 'a car: two beams, two red glows, TWO thin streaks (H3), two + two lamps');
  // (H3 — the owner: the light trail = two THIN, SHORT, fast-fading streaks, one from EACH tail light — never one long lopsided beam)
  const stk = /const streak = ([\d.]+) \+ L\.v \* ([\d.]+);/.exec(n);
  assert.ok(stk && +stk[1] + 130 * +stk[2] <= 2, `a streak is short: ${stk && (+stk[1] + 22 * +stk[2]).toFixed(2)}–${stk && (+stk[1] + 130 * +stk[2]).toFixed(2)} cells`);
  assert.doesNotMatch(n, /2\.0 \+ L\.v \* 0\.045, 1, 0\.62, back, tint/, 'the one long trail is gone');
  assert.match(n, /for \(const e of \[-tw, tw\]\) \{[^}]*1\.8, 1, 0\.14, p\.dir > 0 \? 0 : Math\.PI, 0xff3a5a, 1, 1,[^}]*\}/, 'the train: a streak from each tail light too');
  assert.match(n, /for \(const e of \[-tw, tw\]\) \{[^}]*0xfff2d0, 1, 6,[^}]*0xff2030, 1, 0,[^}]*\}/, 'the train\'s front: two beams; its rear: two red glows');
  assert.doesNotMatch(n, /2\.6, 1, 1\.15|6\.6, 1, 2\.3|, 1, 2, 0\.\d+ \* (a1|lt)\)/, 'no single long spotlight is left');
  assert.match(fxs, /e \* e \* \(1\.0 - u\) \* \(1\.0 - u \* u\) \* smoothstep\(0\.0, 0\.07, u\); \}/, 'shape 6: a short soft beam — a quick falloff, soft edges');
  assert.doesNotMatch(n + fxs, /PointLight|SpotLight/, 'still no real light');
  // THE KID: a glow pool + a ring in his colour under him, a rim light of his own
  assert.match(n, /paintMaterial\(glossy\(0\.42, 0\.7\), \{ rim: true \}\)/); assert.match(fxs, /outgoingLight \+= uRim \* pow\(1\.0 - clamp\(dot\(normalize\(normal\), normalize\(vViewPosition\)\), 0\.0, 1\.0\), 2\.6\);/);
  assert.match(n, /K\.flat\.put\(px, feet \+ 0\.045, pz \+ 0\.04, 1\.42 \* br, 1, 1\.16 \* br, 0, kidHex, 1, 3,/, 'the ring round his feet, in his colour');
  assert.match(n, /const br = reduce \? 1 :/, '… it breathes — never with reduce motion');
  // THE BOX TRUCK: built in code (a cab + a box), its amber markers + lit tail lights; never the van + a bare box
  assert.match(m, /export function buildTruck\(\)/); assert.match(m, /roundBox\(0\.74, 0\.6, 0\.76, 0\.13\), color: 0xa6a6a6, paint: 1/, 'a cab in its own colour'); assert.match(m, /roundBox\(0\.8, 0\.8, 1\.9, 0\.1\), color: white/, 'a long white box'); assert.doesNotMatch(m + n, /buildTrailer|K\.trailers/);
  assert.match(n, /if \(truck\) K\.trucks\.put\(cx, 0, z, 0\.94, 0\.9, tz, ry, tint, 1, dim\);\s*else if \(q\) q\.put\(/, 'a 3-cell vehicle = the truck alone, as long as its rules length');
  assert.match(n, /if \(truck\) for \(const m of \[0, 0\.34, 0\.67, 1\]\) K\.bill\.put\([^;]*0xff9a1c/, 'amber marker lights along its side');
  // THE PROPS: no crate, no pale jersey barrier (THE BARRICADE is built in code); the files stay in the folder
  assert.match(m, /export const SCENE_MODELS = Object\.freeze\(KENNEY\.filter\(n => n !== 'crate-box' && n !== 'traffic-barrier'\)\);/);
  assert.match(n, /loadKenney\(SCENE_MODELS\)/); assert.doesNotMatch(n, /crate-box|traffic-barrier/, 'the scene never places them');
  assert.match(m, /export function buildBarricade\(\)/); assert.match(n, /K\.barricades\.put\(/);
});

test('THE LAB\'s TOOLS: ?gray=1 keeps the graybox, ZOOM + ANGLE (remembered — tests/jaywalk-camera.test.mjs), SOUNDS → THE SHEET, every button on its own press + lift; the skyline + the neon count', () => {
  const lab = code('lab.js'), au = code('audition.js'), css = read('css/jaywalk.css'), html = read('jaywalk-lab.html');
  assert.match(lab, /const GRAY = Q\.get\('gray'\) === '1';/);
  assert.match(lab, /GRAY \? lazyImport\(import\('\.\/graybox\.js'\), '\.\/graybox\.js'\) : lazyImport\(import\('\.\/night\.js'\), '\.\/night\.js'\)/, 'only the look asked for is fetched');
  assert.match(lab, /let zoom = Number\(pick\('zoom', ZOOMS, ZOOM\)\), angle = pick\('angle', ANGLES, ANGLE\);/, 'a link\'s ?zoom / ?angle, else what the phone remembers, else 8 + turned');
  assert.match(lab, /E\.installAudio\(\); S\.fetchSounds\(\);/, 'the SHARED engine: unlocked by the first tap, the bytes at preload');
  assert.match(lab, /if \(snd\) snd\.onEvent\(e\);/);
  assert.match(lab, /createTiers\(\{ apply: t => \{ if \(view\.setTier\) view\.setTier\(t\); if \(tierPath\.length < 40\) tierPath\.push\(t\); \}/, 'AUTOMATIC quality steps (the match kit\'s tiers) — their path kept for the measure');
  assert.match(au, /openSheet\(\{ title: 'SOUNDS'/); assert.doesNotMatch(au, /addEventListener\('click'/, 'never a click');
  assert.match(au, /navigator\.clipboard\.writeText\(text\)/); assert.match(au, /PRESS AND HOLD THE LINE ABOVE TO COPY IT/, 'a refused clipboard is never a dead button');
  assert.match(html, /<link rel="stylesheet" href="css\/components\.css">/, 'THE SHEET + THE NEON TUBE\'s look');
  assert.match(css, /\.jw-skyline \{[^}]*height: 24%;/); assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.jw-sky-l, \.jw-sky-n \{ animation: none; \} \}/);
  assert.match(css, /\.jw-stage:not\(\.is-gray\) \.jw-lanes \{ font: 700 76px\/1 var\(--font-num/, 'the numbers\' font (Orbitron\'s heavy 0 reads as a block)');
  // NO PILLS (the owner): nothing in this sheet is a rounded capsule — a corner of ≤ 12 px, or a round dot (50 %) on a square
  for (const x of css.matchAll(/border-radius: ([^;}]+)[;}]/g)) assert.match(x[1].trim(), /^(\d|1[0-2])px$|^50%$/, `no pills: border-radius ${x[1]}`);
  assert.match(css, /\.jw-final \.btn, \.jw-final \.btn::before, \.jw-final \.btn::after \{ border-radius: 10px; \}/, 'H4: the end screen\'s buttons — the site\'s own non-pill tube (the dailies\' 10 px corners)');
  for (const k of ['jw-blink', 'jw-flick', 'jw-pop']) { const body = css.slice(css.indexOf(`@keyframes ${k}`)).split('\n')[0]; assert.doesNotMatch(body, /box-shadow|filter|width|height|left|top/, `${k}: transform / opacity only`); }
});

test('H4 — THE LOOK: ONE LIFE (no blink, no respawn, no one-up in any view), THE TAXI is yellow + its roof light, THE FLATTENED KID lies flat with his cap on top, THE GHOSTS, the frame for the share image', () => {
  const n = code('night.js'), g = code('graybox.js'), lab = code('lab.js'), v = code('view.js');
  for (const [f, s] of [['night.js', n], ['graybox.js', g], ['lab.js', lab], ['view.js', v], ['bot.js', code('bot.js')]]) assert.doesNotMatch(s, /\.blink\b|\.lives\b|oneUp|\.ups\b|'down'|DOWN_TICKS|safeLane|e\.e === 'respawn'/, `${f}: nothing of the lives / the blink / the one-up`);
  assert.doesNotMatch(lab + v, /LIVES/, 'no lives HUD anywhere');
  // THE TAXI: cab yellow, never a neon tint — the cause line "… BY A TAXI" is true; its roof light lit
  const taxi = /const TAXI_HEX = 0x([0-9a-f]{6});/.exec(n);
  assert.ok(taxi, 'TAXI_HEX');
  const [tr, tg, tb] = [0, 2, 4].map(i => parseInt(taxi[1].slice(i, i + 2), 16));
  assert.ok(tr > 220 && tg > 160 && tg < tr && tb < 90, `cab yellow (#${taxi[1]})`);
  assert.match(n, /taxi = what === 'taxi', tint = taxi \? TAXI_HEX : NEON\[/, 'the taxi keeps its yellow; every other car its neon tint');
  assert.match(n, /if \(taxi\) \{ K\.bill\.put\(/, 'its roof light');
  assert.equal(causeLineOf('taxi'), 'FLATTENED BY A TAXI');
  // THE FLATTENED KID: flat on his back (a paper doll, face up), the cap lands back on top — never a smear
  const car = n.slice(n.indexOf("if (H.cause === 'car') {"), n.indexOf("} else if (H.cause === 'water' || H.cause === 'edge')"));
  assert.match(car, /flat = \{ thin: /); assert.match(car, /capOff = \{ flat: true,/, 'his cap pops up and lands back ON TOP');
  assert.doesNotMatch(car, /s3 = \[1\.4, 0\.13, 1\.4\]/, 'H3\'s squashed disc is gone');
  assert.match(n, /kid\.rotation\.set\(Math\.PI \/ 2 \* lie, Math\.PI, 0, 'YXZ'\)/, 'he lies on his back, his head up the screen');
  assert.match(car, /reduce \? 0 :/, 'the bounce: never with reduce motion');
  // THE GHOSTS: instanced (two draw calls for all of them), see-through, their own colour; each gets its name tag's place
  assert.match(n, /K\.ghosts = kind\(kidGeo\.body, ghostMat\(\), 8,/); assert.match(n, /K\.ghostCaps = kind\(kidGeo\.cap, ghostMat\(\), 8,/);
  assert.match(n, /m\.transparent = true; m\.opacity = 0\.\d+;/, 'see-through');
  assert.match(n, /function draw\(run, course, a, dt, o = null\)/); assert.match(n, /K\.ghosts\.put\(gpx, gpy, gpz,[^;]*g\.hex,/, 'in their colour');
  assert.match(n, /g\.tag = v3\.z < 1 &&/, 'the name tag\'s place on the screen');
  // THE SHARE IMAGE's frame: copied off the canvas in the SAME frame it was drawn
  assert.match(n, /if \(snapAsk\) \{ const ask = snapAsk; snapAsk = null;/); assert.match(n, /import \{ ctx2d \} from '\.\.\/\.\.\/ui\/canvas-safe\.js';/, 'every canvas through ctx2d');
});
