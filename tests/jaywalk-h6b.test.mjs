// JAYWALK H6B — THE FINAL POLISH (docs/jaywalk.md "THE FINAL POLISH"): THE GATE SIGN's window (only on the approach), the lab's ?lane=N
// (a look check — never counts), THE MOMENTS' FINISH (the solid UFO, the bigger Blackbird, the kids into the Mothership's port, the
// traffic stopping under it), DOWNTOWN's shops on demand, THE MIX (the table, no old NEW BEST, the ducks), THE CREDITS — and REPLAY =
// LIVE across many seeds (everything in this pass is a VIEW or a SOUND: the rules, the proof, the feats are untouched).
// (The night skylines, the masked lights + THE LOOK SWITCH: tests/jaywalk-skyline.test.mjs · the tail light bar: tests/jaywalk-night.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createCourse } from '../js/games/jaywalk/course.js';
import { createRun, step, isOver, resultOf, canLog } from '../js/games/jaywalk/engine.js';
import { replay } from '../js/games/jaywalk/replay.js';
import { greedyBot } from '../js/games/jaywalk/bot.js';
import { MODE_IDS, MODES } from '../js/games/jaywalk/tuning.js';
import { SOUNDS } from '../js/games/jaywalk/sounds.js';
import { PRELOAD } from '../js/games/preload-graph.js';
import { CREDITS } from '../js/ui/credits.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const N = code('night.js'), FL = code('flyers.js'), LAB = code('lab.js'), V = code('view.js'), CSS = read('css/jaywalk.css');
const num = (src, re) => { const m = re.exec(src); assert.ok(m, String(re)); return m.slice(1).map(Number); };

test('THE GATE SIGN shows ONLY ON THE APPROACH: up 10 lanes out, whole to 4.5, FULLY GONE 3 lanes from the gate — and at it, and through it; never a plane over the lanes', () => {
  const [gone, fade, seen] = num(N, /const GATE_GONE = (\d+), GATE_FADE = ([\d.]+), GATE_SEEN = (\d+);/);
  assert.equal(gone, 3, 'fully gone by the time he is 3 lanes from the gate'); assert.ok(seen >= 8 && seen <= 10, `readable from ${seen} lanes out`);
  assert.match(N, /const dg = i - ky, near = clamp01\(\(dg - GATE_GONE\) \/ GATE_FADE\) \* clamp01\(GATE_SEEN \+ 0\.5 - dg\);/);
  const c01 = v => (v < 0 ? 0 : v > 1 ? 1 : v), near = dg => c01((dg - gone) / fade) * c01(seen + 0.5 - dg);
  for (const d of [3, 2.5, 2, 1, 0.4, 0, -0.5, -3, -40]) assert.equal(near(d), 0, `${d} lanes from the gate: no sign`);
  for (const d of [4.5, 5, 6, 7, 8, 9, 9.5]) assert.equal(near(d), 1, `${d} lanes out: the whole sign`);
  assert.ok(near(4) > 0.5 && near(4) < 0.8 && near(3.2) < 0.2, 'it fades between 4.5 and 3'); assert.equal(near(10.5), 0); assert.equal(near(12), 0, 'not before its gate is near');
  for (let d = 12; d > -2; d -= 0.05) assert.ok(near(d) >= 0 && near(d) <= 1);
  // ONE canvas over the scene, under the sea wall: drawn on a change, its opacity alone moves — nothing stands on a lane any more
  assert.match(N, /G\.cv\.className = 'jw-gate';/); assert.match(N, /const gateShow = v => \{ const o = v < 0\.01 \? '0' : v\.toFixed\(2\); if \(o !== G\.o\) \{ G\.o = o; G\.cv\.style\.opacity = o; \} \};/);
  assert.match(N, /if \(G\.text === key\) return;/, 'painted only when its words or the look change'); assert.match(N, /const c = ctx2d\(G\.cv\);/, 'through canvas-safe');
  assert.doesNotMatch(N, /gateGeo|GATE\[|G\.m\b/, 'the plane on the crossbar is gone');
  assert.match(CSS, /\.jw-gate \{ position: absolute; z-index: 1; left: 13%; width: 74%; top: 24%; aspect-ratio: 1024 \/ 176; opacity: 0; pointer-events: none; \}/, 'it hangs at the band\'s foot (24 %): over the far haze — the fogged far lanes, never one he is about to cross');
});

test('THE MATCH CHIPS are COMPACT: a small dot + the name short + the lanes, 13 px a row on a soft veil — never a box over the painted landmark', () => {
  const row = /\.jw-order li \{([^}]*)\}/.exec(CSS)[1], ol = /\.jw-order \{([^}]*)\}/.exec(CSS)[1];
  assert.match(row, /height: 13px;/); assert.match(row, /grid-template-columns: 6px minmax\(0, 46px\) auto;/, 'the name is cut short (the whole name stays in the row)');
  assert.match(row, /background: linear-gradient\(90deg, rgba\(7, 6, 11, 0\.66\) 0, rgba\(7, 6, 11, 0\.5\) 62%, rgba\(7, 6, 11, 0\) 100%\);/, 'a soft backing that thins out — no box');
  assert.doesNotMatch(row, /border-radius/, 'no pill, no box'); assert.match(ol, /max-width: 86px;/); assert.match(ol, /gap: 1px;/);
  assert.ok(8 * 13 + 7 * 1 <= 112, '8 players = 111 px tall');
  assert.match(CSS, /\.jw-order li\.is-out \.jw-order-n \{ text-decoration: line-through; \}/, 'OUT is never colour alone: the name struck through + a cross for the dot');
  assert.match(V, /h\('i\.jw-order-dot', \{ 'aria-hidden': 'true' \}\), h\('span\.jw-order-n', r\.name\), h\('b', String\(r\.lanes\)\)/, 'the same row: the dot, the WHOLE name (the css shortens it), the lanes');
});

test('THE LAB LINK ?lane=N: a LOOK CHECK from the grass lane nearest N — WARPED from its first frame: never counts, never a replay; zero server calls', () => {
  assert.match(LAB, /const LANE0 = \/\^\\d\{1,5\}\$\/\.test\(Q\.get\('lane'\) \|\| ''\) \? Math\.min\(20000, Number\(Q\.get\('lane'\)\)\) : 0;/, 'a plain number only');
  assert.match(LAB, /if \(LANE0\) \{ let y = LANE0; for \(let d = 0; d < 40; d\+\+\) \{[\s\S]{0,300}? warped = true; safe = true; run\.y = y; run\.best = y; run\.wall = \(y - 5\) \* FP;/, 'every run of that page starts there, WARPED');
  assert.match(LAB, /check\.textContent = warped \? 'WARPED \(a look check\) — no replay'/, 'its end says so: never REPLAY = LIVE');
  assert.doesNotMatch(LAB, /firebase|\/api\/|fetch\(/, 'the lab still loads no Firebase and calls no /api');
  // ONE COUNTDOWN: the lab's small line is the mode's quiet clock — it never says THE MOTHERSHIP (the big red one is flyers.js's)
  assert.doesNotMatch(LAB, /THE MOTHERSHIP \$\{/); assert.match(LAB, /sub\.textContent = M\.cap \? \(M\.cap - run\.t > 10 \* TICK_HZ \? `\$\{mode\.toUpperCase\(\)\} · \$\{clock\(M\.cap - run\.t\)\}` : ''\) : 'ENDLESS';/);
  assert.equal((FL.match(/THE MOTHERSHIP · 0:/g) || []).length, 1, 'ONE Mothership countdown on screen');
});

test('THE MOMENTS\' FINISH: THE UFO solid (no transparency), smaller + a little higher, the kid INTO it; THE BLACKBIRD 1.3× with blazing burners laid last; the Mothership\'s kids into its port; the traffic stops under it', () => {
  const [jl] = num(FL, /jetLen: ([\d.]+),/), [uy, ud] = num(FL, /ufoY: ([\d.]+), ufoD: ([\d.]+),/);
  assert.ok(jl >= 3.7 * 1.25 && jl <= 3.7 * 1.35, `THE BLACKBIRD ≈ 1.3× (${jl} cells — the rules' body stays 3)`);
  assert.ok(ud < 3 && ud >= 2 && uy > 4.7 && uy <= 5.4, `THE UFO: smaller (${ud} < 3.0) + higher (${uy} > 4.7 — any higher and the skyline band hides it)`);
  const um = /const ufoMat = \(\) => new THREE\.MeshStandardMaterial\(\{([^}]*)\}\);/.exec(FL)[1];
  assert.doesNotMatch(um, /transparent|opacity/, 'a SOLID saucer: no transparency anywhere'); assert.doesNotMatch(FL, /q\.m\.material\.opacity|1 - 0\.72 \* over/, 'it never goes see-through over the kid');
  assert.match(FL, /m\.color\.setHex\(UFO_HEX\[day \? 1 : 0\]\)\.lerp\(fogC, 1 - hz\); m\.emissive\.copy\(fogC\)\.multiplyScalar\(\(1 - hz\) \* 0\.8\);/, 'far off it takes the haze\'s colour — solid to the last');
  assert.match(FL, /sc: 1 - 0\.95 \* away,/, 'it zips off SMALL + far (never faded out)');
  assert.match(FL, /const A = abductAt\(e\), top = A\.top - 0\.1, by = top \* A\.rise;/, 'the kid rises INTO the hull (the solid saucer closes over him), not to under its rim');
  assert.match(FL, /hatch: clamp01\(\(e - 200\) \/ 300\) \* \(1 - clamp01\(\(e - 1560\) \/ 140\)\),/, 'its hatch opens wide as it takes him, shuts as he is in');
  assert.match(FL, /dim: clamp01\(\(e - 120\) \/ 260\) \* \(1 - clamp01\(\(e - 1800\) \/ 220\)\),/); assert.match(FL, /if \(F\.own\) dimNow = Math\.max\(dimNow, A\.dim\);/, 'the world dims round the beam — on the abducted player\'s OWN phone only');
  assert.match(CSS, /\.jw-ufo-shade \{[^}]*opacity: 0;[^}]*radial-gradient\(46% 38% at var\(--x, 50%\) var\(--y, 50%\)/);
  assert.match(FL, /K\.bill\.put\(bx, 0\.6, bz \+ r \* 0\.95, r \* 2\.5, 1\.5, 1, 0, day \? 0x6dffa0 : 0x4dff7a, 1, 0,/, 'its beam LIGHTS what drives through it: a green wash over the cars in the ring');
  // THE BLACKBIRD's burners: laid LAST (after the contrails + the flash), the contrails start behind them
  assert.match(FL, /if \(tell\) \{ if \(burn\) burn\(\); return; \}/); assert.match(FL, /shakeNow = FLY\.shake \* \(1 - \(u - FLY\.shakeFrom\) \/ FLY\.shakeTicks\);\s*if \(burn\) burn\(\);/);
  assert.match(FL, /const flameMat = new THREE\.MeshBasicMaterial\(\{ vertexColors: true, fog: false, toneMapped: false \}\), flames = \[\];/, 'the flames are SOLID cones (the second review: additive ribbons washed to a white smear by night) — unlit, opaque, the same fire in both looks'); for (const hex of ['0xffffff', '0x3f8cff', '0xff8a1e', '0xff4f9a']) assert.ok(/const rings = \[[^\n]*\];/.exec(FL)[0].includes(hex), `the cone's colours: ${hex} (white-hot → blue → orange → a pink tip)`);
  assert.doesNotMatch(FL, /0xeaf6ff, 1, 3, \(day \? 0\.9 : 0\.45\)/, 'no vapor ring across the fuselage (the airframe looked see-through)');
  assert.doesNotMatch(FL, /for \(let d = 0; d < 4; d\+\+\) K\.bill\.put\(nx/, 'no row of shock diamonds (the review: beads on a string) — ONE hot core a nozzle'); assert.match(FL, /jetMat\.emissive\.setHex\(day \? 0 : 0x1a2440\);/, 'by night the airframe carries a cool light of its own');
  assert.match(FL, /if \(S\.q0 < 0 \|\| q < S\.q0\) \{ S\.q0 = q; S\.x = sx; S\.y = Math\.min\(0\.96, sy\); \}/, 'a kid\'s light flies STRAIGHT from where he went behind the rim to the port (the second review: it flew on past it)');
  assert.match(FL, /if \(yf < 0\.31\) \{[^}]*sy = Math\.max\(2\.6, sy - \(0\.31 - yf\) \/ per\); \}/, 'THE UFO hovers lower while its ring is far up the screen: never half in the haze under the wall');
  // THE MOTHERSHIP
  assert.match(N, /t = capT && tr > capT \? capT \+ 40 \* \(1 - Math\.exp\(\(capT - tr\) \/ 40\)\) : tr,/, 'past the cap the scene\'s tick eases to a stop: the traffic under the ship slows to a halt (a view — the run is over)');
  { const cap = 21600, t = tr => (tr > cap ? cap + 40 * (1 - Math.exp((cap - tr) / 40)) : tr); assert.equal(t(cap - 5), cap - 5); assert.ok(t(cap + 6) - cap > 5 && t(cap + 6) - cap < 6, 'no jump at the cap'); assert.ok(t(cap + 600) - t(cap + 300) < 0.05, 'stopped'); for (let k = 0; k < 400; k++) assert.ok(t(cap + k + 1) >= t(cap + k), 'never backwards'); }
  assert.match(N, /if \(capT\) FL\.ship\(tr, capT, taken \? fx\.out : -1, 1\);/, 'the ship itself runs on the real clock');
  assert.match(FL, /if \(ship\) spark\(x, y, z, q, hex\);/); assert.match(FL, /const px = \(S\.x \+ \(ship\.port\[0\] - S\.x\) \* k\) \* cw, py = \(S\.y \+ \(ship\.port\[1\] - S\.y\) \* k\) \* ch,/, 'every kid flies INTO the port: a light of their colour on ONE canvas inside the ship\'s own sprite'); assert.doesNotMatch(FL + CSS, /jw-ship-kid/, 'never an element a kid'); assert.match(FL, /ship\.fxc = ctx2d\(fv, \{ willReadFrequently: true \}\);/, 'a plain bitmap canvas (measured: a default one cost a 150 ms frame as the first kid reached the rim)');
  assert.match(FL, /if \(!fxUsed && fxHad && ship\.fxc\) ship\.fxc\.clearRect\(0, 0, ship\.fx\.width, ship\.fx\.height\);/, 'cleared once the last kid is in — nothing is drawn on it otherwise');
  // every big moment's module + model stays ON DEMAND; the rules never import a view
  for (const f of ['flyers.js', 'shops.js', 'skymarks.js']) assert.ok(!PRELOAD.jaywalk.includes(`js/games/jaywalk/${f}`), `${f}: not in the cartridge's eager graph`);
  for (const f of ['course.js', 'engine.js', 'replay.js', 'logic.js', 'director.js', 'tuning.js', 'causes.js', 'cues.js']) assert.doesNotMatch(code(f), /flyers\.js|shops\.js|skyline\.js|night\.js/, `${f}: no rule reads a view`);
  assert.doesNotMatch(read('api/_lib/jaywalk.js'), /flyers|shops|skyline|night\.js/);
});

test('DOWNTOWN\'s EDGE SHOPS: Kenney\'s storefronts (CC0), fetched ON DEMAND; lit windows + a neon sign by night; the code-built box until they land', () => {
  const S = code('shops.js'), A = code('areas.js');
  assert.match(N, /lazyImport\(import\('\.\/shops\.js'\), '\.\/shops\.js'\)/, 'through THE SKEW WRAPPER'); assert.match(N, /if \(q\.k === 'shop' && !SH\) shopGet\(\);/, 'asked for when a shop first comes into the window');
  assert.match(A, /if \(shop && c\.SH && c\.SH\(q, x, z, dim, lt, on, c\.day, sg\)\) return;/, 'the box is drawn only until the models land');
  assert.match(S, /export const SHOPS = Object\.freeze\(\['shop-a', 'shop-b', 'shop-c', 'shop-d'\]\);/);
  for (const n of ['shop-a', 'shop-b', 'shop-c', 'shop-d']) { const f = new URL(`../assets/jaywalk/models/${n}.glb`, import.meta.url); assert.ok(existsSync(f)); const b = readFileSync(f); assert.ok(b.length > 8000 && b.length < 60 * 1024, `${n}.glb: ${b.length} B`); assert.equal(b.toString('ascii', 0, 4), 'glTF'); assert.ok(!b.includes(Buffer.from('image/png')), 'no texture: the colormap is in its vertex colours'); }
  assert.ok(existsSync(new URL('../assets/jaywalk/models/LICENSE-kenney-city-kit-commercial.txt', import.meta.url)));
  assert.match(S, /SHOP = Object\.freeze\(\{ w: 1\.8, d: 0\.9,/, 'a shop stays inside its own lane (0.9 deep)'); assert.match(S, /totalEmissiveRadiance \+= vWin \* uWin \*/, 'the window glass glows by night'); assert.match(S, /U\.value = day \? 0 : 1;/);
  assert.doesNotMatch(S, /PointLight|SpotLight|requestAnimationFrame|getBoundingClientRect/);
});

test('THE MIX: NEW BEST = its B take (ONE take — the sparkle is THE AREA ARRIVAL\'s alone); every gain set against the others; the music ducks under the big moments', () => {
  const have = readdirSync(new URL('../audio/jaywalk/', import.meta.url));
  assert.ok(have.includes('new-best.mp3') && !have.includes('new-best-b.mp3'), 'ONE new-best file');
  const nb = readFileSync(new URL('../audio/jaywalk/new-best.mp3', import.meta.url)), ar = readFileSync(new URL('../audio/jaywalk/area-arrive.mp3', import.meta.url));
  assert.ok(Math.abs(nb.length - 30868) < 64, `new-best.mp3 is the B take's bytes (${nb.length} B — "Fantasy Achievement Unlock Magical Stinger")`); assert.notEqual(nb.length, 26688, 'never the old take (the sparkle)'); assert.ok(!nb.equals(ar));
  const by = Object.fromEntries(SOUNDS.map(s => [s.id, s]));
  assert.equal(by['new-best'].b, false, 'no second take to pick'); assert.match(code('sfx.js'), /export const JW_SFX_REV = 3;/);
  // the levels (measured — tests/integration/jaywalk-mix.mjs): the hop / the landing never tiring, the horn half, the train's bell + horn + the arrival chime no longer 10–17 dB hot
  assert.ok(by.hop.gain <= 1.3 && by['land-wood'].gain <= 1.45, 'the hop + the landing: a touch softer (heard hundreds of times a run)'); assert.equal(by.horn.gain, 0.5, 'the horn: half, as set');
  assert.ok(by['train-bell'].gain <= 0.35 && by['train-horn'].gain <= 0.3 && by['area-arrive'].gain <= 0.45, 'the three hot files are brought down to the others');
  assert.ok(by.hit.gain >= 2 && by.splash.gain >= 2, 'your own hit / splash stay the loudest small sounds'); assert.ok(by['new-best'].gain > by['area-arrive'].gain);
  for (const s of SOUNDS) assert.ok(s.gain > 0.1 && s.gain <= 2.5, `${s.id}: ${s.gain}`);
  // the city's flyer sounds: ONE table, every play through it
  const mix = /export const MIX = Object\.freeze\(\{([\s\S]*?)\n\}\);/.exec(read('js/games/jaywalk/flyers.js'))[1], ids = [...mix.matchAll(/\n  '([\w@-]+)': \{ gain: ([\d.]+)/g)].map(m => [m[1], +m[2]]);
  assert.deepEqual(ids.map(q => q[0]), ['radio-static_1', 'jet-scream', 'sonic-boom', 'ufo-hum', 'ufo-beam-on', 'ufo-lift', 'ufo-depart', 'ufo-beam-off', 'ufo-hum@ship', 'ufo-beam-on@ship', 'ufo-lift@ship']);
  for (const [id, g] of ids) { assert.ok(g > 0.2 && g <= 0.9, `${id}: ${g}`); assert.ok(existsSync(new URL(`../audio/city/${id.replace(/@.*/, '')}.mp3`, import.meta.url)), `${id}: the city's own file`); }
  assert.doesNotMatch(FL, /\bplay\('(?!ufo-hum)[\w-]+', \{ gain:/, 'no level outside the table'); assert.ok((FL.match(/\bmix\('/g) || []).length >= 10);
  const [jet, ufo, warn, ship] = num(FL, /export const DUCK = Object\.freeze\(\{ jet: ([\d.]+), ufo: ([\d.]+), warn: ([\d.]+), ship: ([\d.]+),/);
  for (const k of [jet, ufo, warn, ship]) assert.ok(k >= 0.25 && k < 0.7, `the music keeps ${k} of its level under a big moment`); assert.ok(ship < warn, 'deeper as THE MOTHERSHIP arrives');
  assert.match(V, /night\.draw\(drawRun, course, a, dt, extra\); duckMoment\(\);/, 'asked a frame'); assert.match(V, /function duckMoment\(\) \{ const k = night && sndOn \? night\.duck\(\) : 1; if \(k !== momK\)/, 'a change only');
  assert.match(FL, /duckNow = Math\.min\(duckK, duckJ, dimNow > 0\.02 \? DUCK\.ufo : 1\); duckK = 1; duckJ = 1;/);
  assert.match(read('js/games/jaywalk/index.js'), /export const musicFor = \(\) => \[typeof document !== 'undefined' && document\.body && document\.body\.dataset\.look === 'day' \? 'mood:day' : 'mood:evening', 'menu'\];/, 'the station follows the look');
});

test('THE CREDITS: JAYWALK\'s own group in the site\'s Credits sheet — every sound + model line, the CC BY ones exactly, the art created with Grok', () => {
  const rows = CREDITS.filter(c => c.group === 'JAYWALK'), all = rows.map(c => `${c.title} ¦ ${c.by} ¦ ${c.licence}`).join('\n');
  assert.ok(rows.length >= 12);
  for (const need of ['"Fantasy Achievement Unlock Magical Stinger" by TommasoMotteran (https://freesound.org/people/TommasoMotteran/sounds/859080/) - Licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)',
    '"Neon ON OFF" by SkyernAklea (https://freesound.org/people/SkyernAklea/sounds/539909/) - Licensed under CC BY 4.0', '"Train Passing A" by InspectorJ (https://freesound.org/people/InspectorJ/sounds/328114/) - Licensed under CC BY 4.0',
    '"Railroad Crossing Bell" by Brylon Terry (SoundBible.com), CC BY 3.0. https://soundbible.com/2070-Railroad-Crossing-Bell.html', '"Train Diesel Double Horn from Class 142 with Reverb" by AMBIOSIS (Freesound), CC BY 4.0. https://freesound.org/s/316689/',
    'This work is based on "Sr-71" (https://sketchfab.com/3d-models/sr-71-79e6c14217ab417abe524a99ffbb472e) by Kiiba (https://sketchfab.com/Kiiba), licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)',
    'Flying saucer: Poly by Google — https://poly.pizza/m/b0N_HeT_Ttb (CC BY 3.0)', 'Flying saucer: Poly by Google — https://poly.pizza/m/6hu2h8v78mO (CC BY 3.0)', 'Skyline art created with Grok', 'Card art created with Grok', 'City Kit (Commercial) 2.1', 'the Sonniss GDC Game Audio Bundles'])
    assert.ok(all.includes(need), need);
  // every author named in the two CREDITS.md files is in the group
  const snd = read('audio/jaywalk/CREDITS.md'), who = [...snd.matchAll(/^\| [\w.-]+ \| [^|]+ \| ([^|]+) \|/gm)].map(m => m[1].trim().replace(/ \(.*/, '')).filter(a => a !== 'author' && a !== '---');
  assert.ok(who.length >= 10); for (const a of new Set(who)) assert.ok(all.includes(a.replace('Kenney Vleugels', 'Kenney')), `${a} (audio/jaywalk/CREDITS.md) is credited`);
  for (const a of ['Kiiba', 'Poly by Google', 'MaverickFX', 'Kenney']) { assert.ok(read('assets/jaywalk/models/CREDITS.md').includes(a)); assert.ok(all.includes(a), `${a} (the models) is credited`); }
  assert.match(read('css/components.css'), /\.cr-by \{[^}]*overflow-wrap: anywhere; \}/, 'a long source address wraps: a required credit is never cut off');
});

test('REPLAY = LIVE across many seeds, every mode (this pass changed no rule: the run a bot plays = the run the judge replays from its hop log)', () => {
  let runs = 0, taken = 0;
  for (const mode of MODE_IDS) for (let k = 0; k < 40; k++) {
    const seed = `h6b-${mode}-${k}`, course = createCourse(seed), run = createRun({ seed, mode }), bot = greedyBot({ seed }), log = [];
    const cap = MODES[mode].cap || 9000;
    for (let n = 0; n <= cap + 5 && !isOver(run); n++) { let d = ''; const b = bot(run, course); if (b && canLog(log, run.t, b)) { d = b; log.push({ t: run.t, d }); } step(run, course, d, []); }
    if (!isOver(run)) continue;
    const live = resultOf(run), { used, ...r } = replay({ seed, mode, log });
    assert.deepEqual(r, live, `${seed}: the replay = the live run (lane ${live.lanes}, ${live.cause})`); assert.equal(used, log.length);
    runs++; if (live.taken) taken++;
  }
  assert.ok(runs >= 80, `${runs} runs ended + were replayed (${taken} reached THE MOTHERSHIP)`);
});

// THE END SCREEN's MEMORY (the 8:50 am add-on — "PAGE KILLED … game:jaywalk/final · iPhone"; docs/jaywalk.md "THE END SCREEN's MEMORY"):
// behind the end screen the scene RESTS — a small still, no bloom targets, ONE skyline picture, the Mothership's sprite let go, nothing
// drawn; the run's picture is ONE canvas of the rows the card uses. The measured budget = tests/integration/kit/jaywalk-mem.mjs.
test('H6B — THE END SCREEN\'s MEMORY: the scene rests behind the end screen, the run\'s picture is cropped, the budget is pinned', () => {
  const n = readFileSync(new URL('../js/games/jaywalk/night.js', import.meta.url), 'utf8'), v = readFileSync(new URL('../js/games/jaywalk/view.js', import.meta.url), 'utf8');
  const f = readFileSync(new URL('../js/games/jaywalk/flyers.js', import.meta.url), 'utf8'), m = readFileSync(new URL('./integration/kit/jaywalk-mem.mjs', import.meta.url), 'utf8');
  // the scene: dpr 1 while it rests, no bloom made, nothing drawn once its still is up
  assert.match(n, /nd = resting \? 1 : Math\.min\(devDpr, DPR_AT\[tier\]\)/, 'a resting scene is a dpr-1 still');
  assert.match(n, /if \(tier === 2 && !bloom && !resting\)/, 'no bloom targets while it rests');
  assert.match(n, /if \(resting === 1\) return;/, 'nothing is drawn once the still is up');
  const rest = n.slice(n.indexOf('    rest(on) {'), n.indexOf('    resting: () => resting'));
  assert.match(rest, /bloom\.dispose\(\); bloom = null;/, 'the bloom\'s targets are freed');
  assert.match(rest, /if \(f !== skyS\.now\) skyHold\.delete\(f\)/, 'only the skyline picture on screen is held');
  assert.match(rest, /if \(FL\) FL\.rest\(on\);/, 'the big moments\' module lets its sprite go');
  assert.match(rest, /if \(!on\) setTier\(tier\)/, 'waking = the tier\'s own setup again (the bloom back at the top tier)');
  // (the flag is declared before setLook reads it — a first cut put it below and the scene never built)
  assert.ok(n.indexOf('let lookSet = false, resting = 0, otherWarm = false;') > 0 && n.indexOf('let lookSet = false, resting = 0, otherWarm = false;') < n.indexOf('  setLook(o.look'), 'the flag exists before the first setLook');
  // the view: rests on BOTH end screens, wakes on a new run; ONE picture a run, only the rows round the kid
  assert.equal((v.match(/night\.rest\(true\)/g) || []).length, 3, 'the podium + the local end both rest the scene (+ a scene rebuilt after a lost context rests again if it was resting)');
  // THE GO-LIVE REVIEW (the audit): behind an end screen nothing is drawn — the Mothership's hum + rumble fade as the scene rests and the
  // music comes back up (they stayed at their last frame's level through the whole podium); a WATCHER's podium waits her lift out;
  // the rumble has a known peak; leaving the game lets go of the decoded sounds + the run's picture; the tier is sampled only while drawn
  assert.match(FL, /if \(on\) \{ const f = ship\.on \? 2\.4 : 0\.6; if \(snd\.ship\) snd\.ship\.stop\(f\); if \(snd\.rum\) snd\.rum\.stop\(f\); snd\.ship = snd\.rum = null; duckNow = 1; \}/, 'the scene rests → the ship\'s loops fade, the duck lets go');
  assert.match(FL, /for \(let i = 0; i < n; i\+\+\) d\[i\] \*= 0\.9 \/ pk;/, 'the rumble is normalised: 0.9 × DUCK.rumble at the bus at most');
  assert.match(FL, /dead = true; offBed\(\); bufs\.clear\(\); bufCtx = null;/, 'the moments\' decoded sounds go with the scene');
  assert.match(v, /const ship = mode === 'over' && Object\.values\(g && g\.results \|\| \{\}\)\.some\(r => r && r\.x\) && tickNow\(\)\.t < MODES\.match\.cap \+ SHIP_SEEN;/, 'a watcher sees the Mothership\'s lift before the podium');
  assert.match(v, /if \(!final && !localEnd\) \{ tiers\.sample\(now, performance\.now\(\) - t0\); if \(!pinned\) tiers\.tick\(now\); \}/, 'the tier is measured only while the scene is drawn');
  assert.match(v, /cv\.addEventListener\('webglcontextlost', e => \{ e\.preventDefault\(\);/, 'THE LOST CONTEXT is noticed'); assert.match(v, /cv\.addEventListener\('webglcontextrestored', remake\);/, '… and the scene rebuilt');
  { const sx = readFileSync(new URL('../js/games/jaywalk/sfx.js', import.meta.url), 'utf8');
    assert.match(sx, /export function release\(\) \{ stopAll\(\); bufs\.clear\(\); bufCtx = null; \}/, 'sfx.release: the decoded buffers let go (the bytes stay)');
    assert.match(sx, /else if \(!lockWait\) \{ lockWait = true; onUnlock\(\(\) => \{ lockWait = false; go\(\); \}\); \}/, 'a locked / muted phone: ONE sound waits for the unlock — never a listener a call'); }
  assert.match(v, /if \(night\) night\.rest\(false\)/, 'a new run wakes it');
  assert.match(v, /\}, 1080, 1080\);/, 'the run\'s picture: 1080 wide, the 1080 rows round the kid (≤ 1080 × 1350)');
  assert.match(n, /cv\.width = width; cv\.height = hh; cv\.top = top; cv\.full = H;/, 'the cut knows where it began');
  // THE MOTHERSHIP's sprite: let go unless she is up; baked again on waking
  const fr = f.slice(f.indexOf('    rest(on) {'), f.indexOf('    /** the world goes quiet'));
  assert.match(fr, /if \(ship\.on\) return;/, 'never while she is on screen');
  assert.match(fr, /cv\.width = 0; cv\.height = 0;/, 'her canvases are freed');
  assert.match(fr, /if \(!ship\.cv\.width\) bakeAsk = true;/, 'baked again as the scene wakes');
  // the budget: a number, never raised quietly; both end-to-end checks hold their final screens to it
  const b = Number((/export const JW_FINAL_BUDGET_MB = (\d+);/.exec(m) || [])[1]);
  assert.ok(b > 0 && b <= 20, `the final screen's budget is ${b} MB of pixels (measured: 7.6 solo · ≤ 9.6 a match · before the fix 40 – 48) — raising it is a decision`);
  for (const t of ['e2e-jaywalk.mjs', 'e2e-jaywalk-match.mjs']) assert.match(readFileSync(new URL(`./integration/${t}`, import.meta.url), 'utf8'), /pix <= JW_FINAL_BUDGET_MB|peak <= JW_FINAL_BUDGET_MB/, `${t} fails past the budget`);
});
