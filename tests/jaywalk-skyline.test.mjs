// JAYWALK H5C — THE PAINTED SKYLINES (js/games/jaywalk/skyline.js — PURE): which picture the band shows at a lane, the opening, the loop,
// only the current + the next picture held, where the band rests, its room on any screen — and the view's half (night.js): two layers,
// cross-faded at a gate, THE FAR EDGE (the sea wall, the fog full at its foot). H6B: THE PAINTED NIGHT SKYLINES (the same machinery,
// the night's own rest offsets, the lights a landmark covers OFF), THE LOOK SWITCH (a cross-fade of the whole band).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { SKY_IDS, SKY_AHEAD, SKY_FADE_MS, SKY_LOOK_MS, SKY_BIAS, SKY_BIAS_NIGHT, SKY_LIGHTS, SKY_NEON, SKY_OFF, skyOff, skyId, skyFile, skyPlan, skyHeld, skyRoom, skyShift } from '../js/games/jaywalk/skyline.js';
import { STRETCH, LANDMARKS } from '../js/games/jaywalk/tuning.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

test('THE PICKER: an area → its picture; the opening keeps skyline-day; the loop (lane 450 +) repeats the 8; by night THE SAME (H6B: 8 painted night pictures)', () => {
  assert.deepEqual([...SKY_IDS], [...readFileSync(new URL('../js/games/jaywalk/areas.js', import.meta.url), 'utf8').matchAll(/\n  \{ id: '([a-z]+)', accent:/g)].map(m => m[1]), 'the ids = the areas\' (areas.js#LOOKS), in the course\'s order'); assert.equal(SKY_IDS.length, LANDMARKS.length);
  for (const l of [0, 1, 25, 49]) { assert.equal(skyId(l), ''); assert.equal(skyPlan(l, 'day').now, 'skyline-day.webp', `lane ${l}: the opening keeps skyline-day`); }
  SKY_IDS.forEach((id, k) => { for (const l of [STRETCH * (k + 1), STRETCH * (k + 1) + 24, STRETCH * (k + 2) - 1]) assert.equal(skyPlan(l, 'day').now, `skyline-day-${id}.webp`, `lane ${l}`); });
  assert.equal(skyPlan(450, 'day').now, 'skyline-day-docks.webp', 'the loop\'s first gate: THE DOCKS again'); assert.equal(skyPlan(455, 'day').now, 'skyline-day-docks.webp');
  assert.equal(skyPlan(849, 'day').now, 'skyline-day-airfield.webp'); assert.equal(skyPlan(850, 'day').now, 'skyline-day-docks.webp', 'lap 3');
  // BY NIGHT (H6B): the same picker — the opening keeps skyline-night, each area its painted night picture, the loop repeats
  for (const l of [0, 25, 35]) assert.deepEqual(skyPlan(l, 'night'), { now: 'skyline-night.webp', next: null, bias: 0 });
  SKY_IDS.forEach((id, k) => { for (const l of [STRETCH * (k + 1), STRETCH * (k + 1) + 24, 450 + STRETCH * k + 3]) assert.equal(skyPlan(l, 'night').now, `skyline-night-${id}.webp`, `lane ${l} by night`); });
  assert.equal(skyPlan(40, 'night').next, 'skyline-night-docks.webp', 'the next night picture is fetched ahead of its gate');
  assert.equal(skyFile('day', ''), 'skyline-day.webp'); assert.equal(skyFile('night', 'docks'), 'skyline-night-docks.webp'); assert.equal(skyFile('night', ''), 'skyline-night.webp');
  for (const id of SKY_IDS) for (const lk of ['day', 'night']) { const f = new URL(`../assets/jaywalk/skyline-${lk}-${id}.webp`, import.meta.url); assert.ok(existsSync(f), `skyline-${lk}-${id}.webp ships`); const b = readFileSync(f).length; assert.ok(b > 20 * 1024 && b <= 150 * 1024, `${lk} ${id}: ${b} B`); }
  for (let l = 0; l < 1300; l++) assert.ok(skyHeld(skyPlan(l, 'night')).length <= 2, 'by night too: never more than two held');
});

test('ONLY THE CURRENT + THE NEXT: the next area\'s picture is asked for as the kid nears its gate — never more than two held, never all 8', () => {
  for (let l = 0; l < 1300; l++) {
    const p = skyPlan(l, 'day'), held = skyHeld(p), toGate = STRETCH - (l % STRETCH);
    assert.ok(held.length <= 2 && held[0] === p.now, `lane ${l}: ${held.join(' + ')}`);
    if (toGate <= SKY_AHEAD) { assert.ok(p.next && p.next !== p.now, `lane ${l}: ${toGate} lanes before a gate the next picture is fetched`); assert.equal(p.next, skyPlan(l + toGate, 'day').now, 'it IS the next area\'s'); }
    else assert.equal(p.next, null, `lane ${l}: nothing ahead yet`);
  }
  assert.ok(SKY_AHEAD >= 8 && SKY_AHEAD <= 20, 'fetched a few seconds before its gate — not a whole stretch early');
  // a whole run to lane 455 holds each picture only around its own stretch
  const seen = new Set(); for (let l = 0; l <= 455; l++) for (const f of skyHeld(skyPlan(l, 'day'))) seen.add(f);
  assert.equal(seen.size, 9, 'the opening\'s + the 8 areas\', one after the other');
  assert.ok(SKY_FADE_MS >= 1500 && SKY_FADE_MS <= 2500, 'the cross-fade ≈ 2 s');
});

test('WHERE THE BAND RESTS: the landmark is on a phone\'s screen; the rest + the slide never show the band\'s edge on any screen', () => {
  for (const id of SKY_IDS) assert.ok(Number.isFinite(SKY_BIAS[id]) && Math.abs(SKY_BIAS[id]) <= 14, `${id}: ${SKY_BIAS[id]}`);
  assert.ok(SKY_BIAS.bridge < 0 && SKY_BIAS.lighthouse < 0, 'painted on the LEFT: the bridge, the lighthouse'); for (const id of ['docks', 'fish', 'yard', 'canal', 'airfield']) assert.ok(SKY_BIAS[id] > 0, `${id}: painted on the right`);
  const room = skyRoom(390, 844);
  assert.ok(room > 16 && room < 18.5, `a 390 × 844 phone: ± ${room.toFixed(1)} % of room`);
  for (const id of SKY_IDS) for (const slide of [-7.5, 0, 7.5]) assert.ok(Math.abs(skyShift(SKY_BIAS[id], slide, room)) <= room, `${id}: inside the room`);
  assert.equal(skyRoom(1440, 900), 0, 'a wide stage: no room — the picture stays centred'); assert.equal(skyShift(13, 5, 0), 0);
  assert.equal(skyRoom(0, 0), 0); assert.equal(skyShift(13, 7, 17), 17); assert.equal(skyShift(-13.5, -7, 17), -17);
  assert.equal(skyPlan(60, 'day').bias, SKY_BIAS.docks); assert.equal(skyPlan(10, 'day').bias, 0);
});

test('THE VIEW: two layers cross-faded (opacity only), the pictures fetched through skyline.js alone, the drawn day landmarks RETIRED, THE FAR EDGE', () => {
  const n = code('night.js'), css = read('css/jaywalk.css'), sk = code('skyline.js');
  assert.doesNotMatch(sk, /document|window|THREE|Date\.now|Math\.random|performance/, 'skyline.js is PURE');
  for (const f of ['course.js', 'engine.js', 'replay.js', 'logic.js', 'director.js', 'tuning.js']) assert.doesNotMatch(code(f), /skyline\.js/, `${f}: a view's table — no rule reads it`);
  assert.doesNotMatch(read('api/_lib/jaywalk.js'), /skyline/);
  assert.match(n, /skyOver\.style\.transition = slow \? `opacity \$\{skyS\.ms\}ms ease-in-out` : 'none';/, 'the cross-fade: opacity only');
  assert.match(n, /\(skyS\.over \? skyUnder : skyOver\)\.style\.backgroundImage = `url\("\$\{skyUrl\(f\)\}"\)`;/, 'a picture is only ever set on the HIDDEN layer');
  assert.match(n, /for \(const f of \[\.\.\.skyHold\.keys\(\)\]\) if \(!keep\.includes\(f\) && f !== skyS\.now\) skyHold\.delete\(f\);/, 'only the current + the next are held (+ the one on screen through a look\'s cross-fade)');
  assert.match(n, /const slow = !!\(skyS\.ms && !reduce && skyS\.now\);/, 'at once with reduce motion / on the first picture');
  assert.doesNotMatch(n, /skyline-day|skyline-night/, 'no file name in the view: skyline.js picks');
  assert.match(n, /if \(kl !== skyLane\) \{ skyLane = kl; skyFollow\(kl, skyFresh\); skyFresh = false; \}/, 'asked on a lane change — never per frame');
  // THE FAR EDGE
  assert.doesNotMatch(css.slice(css.indexOf('.jw-skyline {'), css.indexOf('.jw-skyline-img')), /mask-image/, 'the band is SOLID down to its foot: nothing half-see-through over the backdrop');
  assert.match(css, /\.jw-seawall \{ position: absolute; left: 0; right: 0; bottom: 0;/); assert.match(css, /\.jw-skyline\[data-look='day'\] \.jw-seawall b \{ opacity: 0; \}/, 'the wall\'s lamps are the night\'s');
  assert.match(n, /const FOOT_AT = 0\.25, HAZE_LANES = 4\.4;/); assert.match(n, /if \(P\.y < -0\.05\) footAt = cam\.position\.y \/ -P\.y;/, 'the fog is FULL where the ground meets the sea wall\'s foot — measured off the camera');
  assert.match(n, /f = 24\.5 \* k \+ \(footAt - 24\.5 \* k\) \* reveal;/);
  assert.match(read('js/games/jaywalk/flyers.js'), /hz = 1 - C\.hazeAt\(bx, 0, bz\)[\s\S]{0,2400}if \(hz < 0\.02\) return;[\s\S]{0,2400}m\.color\.setHex\(UFO_HEX\[day \? 1 : 0\]\)\.lerp\(fogC, 1 - hz\);/, 'THE UFO\'s saucer (flyers.js — H6B: SOLID) takes the far haze\'s own colour by where it stands over the ground: never a pale disc on the backdrop');
  // (the review: "the ground fades out before the things standing on it") — every lit material's fog follows the GROUND under the thing
  const fx = read('js/games/jaywalk/night-fx.js');
  assert.match(fx, /vFogDepth = -mvPosition\.z \+ uFogUp \* \(modelMatrix \* jwW\)\.y;/); assert.match(fx, /mat\.onBeforeCompile = sh => \{\s+fogPatch\(sh\);/, 'the painted materials too');
  assert.match(n, /const lambert = \(\) => fogUp\(new THREE\.MeshLambertMaterial\(\{ vertexColors: true \}\)\);/); assert.match(n, /FOG_UP\.value = -fwd\.y;/, 'how much nearer a unit of height is: off the camera, every frame');
  assert.match(fx, /float e = d \+ \(0\.6 \* vnoise\(/, 'the blackout: its edge per pixel off the wall itself — ragged, never a straight cut');
  const fog = /export const DAY_FOG_HEX = (0x[0-9a-f]{6});/.exec(read('js/games/jaywalk/night-fx.js'))[1].slice(2);
  assert.ok(css.includes(`.jw-farhaze[data-look='day'] { background: linear-gradient(#${fog} 0,`) && css.includes(`.jw-stage[data-look='day'] { background: #${fog};`), 'ONE day haze: the scene\'s fog = the far haze = the stage');
});

test('H6B — THE NIGHT BAND: its own rest offsets (the landmark on a phone\'s screen), the lights + windows a painted landmark covers are OFF — and only while its picture is on the band', () => {
  for (const id of SKY_IDS) assert.ok(Number.isFinite(SKY_BIAS_NIGHT[id]) && Math.abs(SKY_BIAS_NIGHT[id]) <= 17.25, `${id}: ${SKY_BIAS_NIGHT[id]}`);
  assert.ok(SKY_BIAS_NIGHT.bridge < 0 && SKY_BIAS_NIGHT.lighthouse < 0); for (const id of ['docks', 'fish', 'yard', 'downtown', 'canal', 'airfield']) assert.ok(SKY_BIAS_NIGHT[id] > 0, `${id}: painted on the right`);
  assert.equal(skyPlan(60, 'night').bias, SKY_BIAS_NIGHT.docks); assert.equal(skyPlan(60, 'day').bias, SKY_BIAS.docks); assert.notDeepEqual({ ...SKY_BIAS_NIGHT }, { ...SKY_BIAS }, 'measured again for the night pictures');
  // the landmark stands inside the phone's window of the picture (± 32.5 % round the rest point): the columns Grok painted it in
  const X = { docks: [725, 1164], fish: [948, 1064], yard: [699, 1233], bridge: [258, 579], downtown: [764, 1100], canal: [768, 1184], lighthouse: [20, 293], airfield: [751, 1122] };
  const room = skyRoom(390, 844);
  for (const id of SKY_IDS) { const c = 50 + skyShift(SKY_BIAS_NIGHT[id], 0, room), [a, b] = X[id].map(x => x / 12.8); assert.ok(a >= c - 33 && b <= c + 33.5, `${id}: its landmark's tall part (${a.toFixed(0)}–${b.toFixed(0)} %) is on a 390 pt screen (${(c - 32.5).toFixed(0)}–${(c + 32.5).toFixed(0)} %)`); }
  // THE MASKED LIGHTS
  assert.equal(SKY_LIGHTS.length, 8); assert.equal(SKY_NEON.length, 5);
  for (const [x, y] of [...SKY_LIGHTS, ...SKY_NEON]) assert.ok(x > 0 && x < 100 && y > 40 && y < 90, 'in the picture, over the city (the crop is 84 rows higher than H2\'s)');
  for (const id of SKY_IDS) { const o = SKY_OFF[id]; assert.ok(o && o.l.every(i => i >= 0 && i < 8) && o.n.every(i => i >= 0 && i < 5), id); assert.deepEqual(skyOff(`skyline-night-${id}.webp`), o); assert.ok(o.n.length >= 2, `${id}: a landmark this size covers a window or two`); }
  // (a light is off exactly where the landmark stands: a right-side landmark never touches the far-left lights, the bridge + the lighthouse never the right ones)
  for (const id of ['docks', 'fish', 'yard', 'downtown', 'canal', 'airfield']) { assert.ok(!SKY_OFF[id].l.includes(0) && !SKY_OFF[id].l.includes(7), `${id}: the left lights stay`); assert.ok(!SKY_OFF[id].n.includes(0) && !SKY_OFF[id].n.includes(3)); }
  for (const id of ['bridge', 'lighthouse']) { assert.deepEqual([...SKY_OFF[id].l], []); assert.ok(!SKY_OFF[id].n.includes(2) && !SKY_OFF[id].n.includes(4), `${id}: the right windows stay`); }
  assert.deepEqual(SKY_OFF.canal.l, [1, 2, 3, 4, 5, 6], 'the canal houses stand in front of six of them');
  for (const f of ['skyline-night.webp', 'skyline-day-docks.webp', 'skyline-day.webp', '', undefined]) assert.deepEqual(skyOff(f), { l: [], n: [] }, `${f}: nothing off`);
  const n = code('night.js');
  assert.match(n, /clearTimeout\(skyLifeT\); skyLife\(skyS\.now, f\); if \(slow\) skyLifeT = setTimeout\(\(\) => \{ if \(!dead\) skyLife\(skyS\.now\); \}, skyS\.ms \+ 60\); else skyLife\(f\);/, 'through a cross-fade nothing blinks on EITHER picture\'s landmark');
  assert.match(n, /skyL\.forEach\(\(e, i\) => \{ e\.hidden = off\.some\(o => o\.l\.includes\(i\)\); \}\);/);
});

test('H6B — THE LOOK SWITCH: the whole band CROSS-FADES (≈ 1.5 s, opacity only) — the picture, the wall\'s stone, the night\'s life; the rest offset eases; never a jump', () => {
  const n = code('night.js'), css = read('css/jaywalk.css');
  assert.ok(SKY_LOOK_MS >= 1200 && SKY_LOOK_MS <= 1800);
  assert.match(n, /skyLane = -1e9; skyFresh = first \? true : 'look'; needWarm = true;/, 'a look change asks for a cross-fade — only the very first picture is at once');
  assert.match(n, /skyShow\(plan\.now, fresh === true \? 0 : fresh === 'look' \? SKY_LOOK_MS : SKY_FADE_MS\);/);
  assert.match(n, /if \(fresh === true\) skyBias = skyBiasT;/, 'the rest offset EASES on a look change');
  assert.match(n, /if \(wait > 0\) \{ setTimeout\(go, wait \+ 30\); return; \}/, 'a cross-fade still running is waited out: a visible layer\'s picture never changes');
  assert.match(css, /\.jw-seawall i\.is-day \{ opacity: 0; transition: opacity 1\.5s ease-in-out; \}/); assert.match(css, /\.jw-skyline\[data-look='day'\] \.jw-seawall i\.is-day \{ opacity: 1; \}/, 'the sea wall stays at the band\'s foot in both: the day\'s stone over the night\'s, opacity only');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.jw-sky-life, \.jw-skyline\[data-look='day'\] \.jw-sky-life, \.jw-seawall i\.is-day, \.jw-seawall b \{ transition: none; \} \}/);
});
