// JAYWALK H5C — THE PAINTED SKYLINES (js/games/jaywalk/skyline.js — PURE): which picture the band shows at a lane, the opening, the loop,
// only the current + the next picture held, where the band rests, its room on any screen — and the view's half (night.js): two layers,
// cross-faded at a gate, skymarks.js by night only, THE FAR EDGE (the sea wall, the fog full at its foot).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { SKY_IDS, SKY_AHEAD, SKY_FADE_MS, SKY_BIAS, skyId, skyFile, skyPlan, skyHeld, skyRoom, skyShift } from '../js/games/jaywalk/skyline.js';
import { STRETCH, LANDMARKS } from '../js/games/jaywalk/tuning.js';
import { MARK_IDS } from '../js/games/jaywalk/skymarks.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

test('THE PICKER: an area → its picture; the opening keeps skyline-day; the loop (lane 450 +) repeats the 8; by night ONE picture', () => {
  assert.deepEqual([...SKY_IDS], [...MARK_IDS], 'the ids = the areas\', in the course\'s order'); assert.equal(SKY_IDS.length, LANDMARKS.length);
  for (const l of [0, 1, 25, 49]) { assert.equal(skyId(l), ''); assert.equal(skyPlan(l, 'day').now, 'skyline-day.webp', `lane ${l}: the opening keeps skyline-day`); }
  SKY_IDS.forEach((id, k) => { for (const l of [STRETCH * (k + 1), STRETCH * (k + 1) + 24, STRETCH * (k + 2) - 1]) assert.equal(skyPlan(l, 'day').now, `skyline-day-${id}.webp`, `lane ${l}`); });
  assert.equal(skyPlan(450, 'day').now, 'skyline-day-docks.webp', 'the loop\'s first gate: THE DOCKS again'); assert.equal(skyPlan(455, 'day').now, 'skyline-day-docks.webp');
  assert.equal(skyPlan(849, 'day').now, 'skyline-day-airfield.webp'); assert.equal(skyPlan(850, 'day').now, 'skyline-day-docks.webp', 'lap 3');
  for (const l of [0, 60, 455, 2000]) assert.deepEqual(skyPlan(l, 'night'), { now: 'skyline-night.webp', next: null, bias: 0 }, 'by night: the one night picture, nothing ahead, no rest offset');
  assert.equal(skyFile('day', ''), 'skyline-day.webp'); assert.equal(skyFile('night', 'docks'), 'skyline-night.webp');
  for (const id of SKY_IDS) assert.ok(existsSync(new URL(`../assets/jaywalk/skyline-day-${id}.webp`, import.meta.url)), `skyline-day-${id}.webp ships`);
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
  assert.match(n, /skyOver\.style\.transition = slow \? `opacity \$\{SKY_FADE_MS\}ms ease-in-out` : 'none';/, 'the cross-fade: opacity only');
  assert.match(n, /\(skyS\.over \? skyUnder : skyOver\)\.style\.backgroundImage = `url\("\$\{skyUrl\(f\)\}"\)`;/, 'a picture is only ever set on the HIDDEN layer');
  assert.match(n, /for \(const f of \[\.\.\.skyHold\.keys\(\)\]\) if \(!keep\.includes\(f\)\) skyHold\.delete\(f\);/, 'only the current + the next are held');
  assert.match(n, /const slow = !!\(fade && !reduce && skyS\.now\);/, 'at once with reduce motion / on the first picture / on a look change');
  assert.doesNotMatch(n, /skyline-day|skyline-night/, 'no file name in the view: skyline.js picks');
  assert.match(n, /skyMark\.set\(day \? -1 : ka, 'night',/, 'by day skymarks.js draws NOTHING');
  assert.match(n, /if \(kl !== skyLane\) \{ skyLane = kl; skyFollow\(kl, skyFresh\); skyFresh = false; \}/, 'asked on a lane change — never per frame');
  // THE FAR EDGE
  assert.doesNotMatch(css.slice(css.indexOf('.jw-skyline {'), css.indexOf('.jw-skyline-img')), /mask-image/, 'the band is SOLID down to its foot: nothing half-see-through over the backdrop');
  assert.match(css, /\.jw-seawall \{ position: absolute; left: 0; right: 0; bottom: 0;/); assert.match(css, /\.jw-skyline\[data-look='day'\] \.jw-seawall b \{ display: none; \}/, 'the wall\'s lamps are the night\'s');
  assert.match(n, /const FOOT_AT = 0\.25, HAZE_LANES = 5\.6;/); assert.match(n, /if \(P\.y < -0\.05\) footAt = cam\.position\.y \/ -P\.y;/, 'the fog is FULL where the ground meets the sea wall\'s foot — measured off the camera');
  assert.match(n, /f = 24\.5 \* k \+ \(footAt - 24\.5 \* k\) \* reveal;/);
  assert.match(n, /q\.d\.visible = hz > 0\.02; q\.d\.material\.opacity = hz;/, 'THE UFO\'s disc fades by where it stands over the ground: never a pale disc on the backdrop');
  const fog = /export const DAY_FOG_HEX = (0x[0-9a-f]{6});/.exec(read('js/games/jaywalk/night-fx.js'))[1].slice(2);
  assert.ok(css.includes(`.jw-farhaze[data-look='day'] { background: linear-gradient(#${fog} 0,`) && css.includes(`.jw-stage[data-look='day'] { background: #${fog};`), 'ONE day haze: the scene\'s fog = the far haze = the stage');
});
