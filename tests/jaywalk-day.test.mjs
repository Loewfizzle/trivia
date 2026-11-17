// JAYWALK H5B — THE DAY LOOK + THE LANDMARKS SEEN + THE FIXES (docs/jaywalk.md "THE DAY LOOK" · "THE LANDMARKS IN THE SKYLINE"):
// THE SWITCH (both looks; the views read the console's GAME LOOK live — per phone; the lab's own LOOK tabs; the music follows the
// look), the day's own cause line (THE FOG BANK), a VIEW only (no rule file knows the look), the scene's day (one scene: the ground's
// DN(night, day), the lights that glow switched off + the ones that must read as paint, the fog bank, the painted gate), THE LANDMARKS
// IN THE SKYLINE (one canvas, drawn on a change), THE HEADER, and THE REFUSED CHAT WRITE (a keyed system line is written once).
// (The sounds' changes: tests/jaywalk-cues.test.mjs · the areas' hero pieces at the gate: tests/jaywalk-areas.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import * as META from '../js/games/jaywalk/meta.js';
import { causeLine, runLine, CAUSE_LINES, DAY_LINES } from '../js/games/jaywalk/causes.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { looksOf, lookLockOf } from '../js/games/cartridge.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

test('THE SWITCH: JAYWALK has BOTH looks — the console\'s GAME LOOK setting is back (never LOCKED); the views read body[data-look] LIVE, per phone; the lab has its own LOOK: DAY · NIGHT; the music follows the look', () => {
  assert.deepEqual(META.LOOKS, ['day', 'night']);
  assert.deepEqual(looksOf(META), ['day', 'night']); assert.equal(lookLockOf(META), null, 'no lock: ☰ → Settings → GAME LOOK works in a run');
  const v = code('view.js'), idx = code('index.js'), lab = code('lab.js'), n = code('night.js');
  // the game: the phone's own setting, re-read every frame (a change mid-run re-themes at once) — never a switch of its own, never the room's
  assert.match(v, /const lookNow = \(\) => \(document\.body\.dataset\.look === 'day' \? 'day' : 'night'\);/);
  assert.match(v, /createNight\(play, \{[^}]*look: lookNow\(\) \}\)/, 'the scene is made in the phone\'s look');
  assert.match(v, /if \(night && root\) \{ const lk = lookNow\(\); if \(lk !== look\) \{ look = lk; night\.setLook\(lk\); root\.dataset\.look = lk; \} \}/, 'read LIVE in the frame');
  assert.doesNotMatch(v, /game\.look|g\.look|meta\.look|settings\.look/, 'the look is this phone\'s (the site\'s GAME LOOK: per device, no lock) — never a field of the match');
  assert.doesNotMatch(v + idx, /saveLook|LOOK_LABEL/, 'the game draws no look switch of its own');
  // the music: the day deck by day, the evening deck by night (the existing mood stations)
  assert.match(idx, /export const musicFor = \(\) => \[typeof document !== 'undefined' && document\.body && document\.body\.dataset\.look === 'day' \? 'mood:day' : 'mood:evening', 'menu'\];/);
  assert.equal(META.MUSIC, 'mood:evening', 'the meta\'s station stays the fallback');
  // the lab: its own switch (tabs, remembered, ?look=), an end on screen re-worded
  assert.match(lab, /let look = pick\('look', \['night', 'day'\], 'night'\);/); assert.match(lab, /h\('span\.jw-bar-k', 'LOOK'\), \.\.\.looks\)/);
  assert.match(lab, /function setLook\(l\) \{ look = l === 'day' \? 'day' : 'night'; setPref\('look', look\); if \(view && view\.setLook\) view\.setLook\(look\);/);
  assert.match(lab, /createNight\(play, \{ kidColor, zoom, angle, tier: pin == null \? 2 : pin, look \}\)/);
  // the scene: ONE scene, switched at once
  assert.match(n, /function setLook\(l\) \{/); assert.match(n, /setLook\(o\.look === 'day' \? 'day' : 'night'\);/); assert.match(n, /setLook, look: \(\) => \(day \? 'day' : 'night'\),/);
});

test('THE FOG BANK\'s WORDS: by day the wall\'s line is LOST IN THE FOG (by night THE LIGHTS WENT OUT) — the same cause; every other line is the same in both looks; the views pass this screen\'s look', () => {
  assert.equal(causeLine({ cause: 'wall' }), 'THE LIGHTS WENT OUT'); assert.equal(causeLine({ cause: 'wall', look: 'night' }), 'THE LIGHTS WENT OUT');
  assert.equal(causeLine({ cause: 'wall', look: 'day' }), 'LOST IN THE FOG');
  assert.deepEqual(Object.keys(DAY_LINES), ['wall'], 'only the wall has a day line');
  for (const k of Object.keys(CAUSE_LINES)) if (k !== 'wall') { const [cause, vehicle = ''] = k.split(':'); assert.equal(causeLine({ cause, vehicle, look: 'day' }), CAUSE_LINES[k], `${k}: the same by day`); }
  assert.equal(causeLine({ cause: 'wall', taken: true, lanes: 7, look: 'day' }), 'MADE IT TO THE MOTHERSHIP');
  const course = createCourse('day1');
  assert.equal(runLine(course, { cause: 'wall', y: 3, x: 4500, end: 400, lanes: 3 }, 'day'), 'LOST IN THE FOG'); assert.equal(runLine(course, { cause: 'wall', y: 3, x: 4500, end: 400, lanes: 3 }), 'THE LIGHTS WENT OUT');
  assert.equal(runLine(course, { cause: 'water', y: 3, x: 4500, end: 400, lanes: 3 }, 'day'), 'SWEPT AWAY');
  assert.match(code('victory.js'), /const look = typeof document !== 'undefined' && document\.body && document\.body\.dataset\.look === 'day' \? 'day' : 'night';/, 'the podium\'s lines in this screen\'s look');
  assert.ok('LOST IN THE FOG'.length <= 20, 'two short lines at phone size at most');
});

test('A VIEW ONLY: no rule file, no replay, no server file knows the look — the same run, the same course, the same judge by day and by night', () => {
  for (const f of ['tuning.js', 'course.js', 'engine.js', 'replay.js', 'logic.js', 'director.js', 'cues.js', 'ghosts.js', 'bot.js', 'lines.js', 'camera.js']) assert.doesNotMatch(code(f), /data-look|dataset\.look|setLook|lookNow|uDay|'day'/, `${f} knows no look`);
  assert.doesNotMatch(read('api/_lib/jaywalk.js'), /data-look|'day' \|\| 'night'|setLook/, 'the server\'s judge neither');
  assert.doesNotMatch(read('database.rules.json'), /"look"/, 'no look in the database rules: nothing new is written');
});

test('THE SCENE BY DAY: one ground shader with DN(night, day) on every lane kind; the tells stay bold (the rails flash red, the runway\'s chevrons race); THE FOG BANK where the blackout is; the lights that only glow are off, the ones that must read are paint; no bloom', () => {
  const fx = read('js/games/jaywalk/night-fx.js'), n = code('night.js');
  assert.match(fx, /#define DN\(n, d\) mix\(n, d, uDay\)/); assert.match(fx, /uDay: \{ value: 0 \}, uWall: \{ value: -99 \} \};/);
  const main = fx.slice(fx.indexOf('void main() {\n  float type = vKind.x'), fx.indexOf('gl_FragColor = vec4(c, 1.0);'));
  for (const [kind, re] of [['grass', /c = mix\(DN\(vec3\(0\.064, 0\.192, 0\.092\), vec3\(/], ['the gate lane', /c = DN\(vec3\(0\.105, 0\.10, 0\.15\), vec3\(/], ['the road', /c = DN\(vec3\(0\.062, 0\.062, 0\.086\), vec3\(/], ['the water', /c = mix\(DN\(vec3\(0\.102, 0\.435, 0\.878\), vec3\(/], ['the rails', /c = DN\(vec3\(0\.088, 0\.078, 0\.09\), vec3\(/], ['the flight path', /c = DN\(vec3\(0\.088, 0\.086, 0\.104\), vec3\(/]]) assert.match(main, re, `${kind}: its night colour + its day colour`);
  // the day water: bright + saturated blue; the day road: a clean mid grey with white + yellow paint
  const w = /c = mix\(DN\(vec3\([\d., ]+\), vec3\(([\d.]+), ([\d.]+), ([\d.]+)\)\), DN\(vec3\([\d., ]+\), vec3\(([\d.]+), ([\d.]+), ([\d.]+)\)\), w \* w/.exec(main).slice(1).map(Number);
  assert.ok(w[2] >= 0.95 && w[2] > w[0] * 4 && w[5] >= 0.95 && w[4] > w[3] * 1.5 && w[4] < w[5], `the day water: a classic arcade blue ≈ #2f9cff → #6cc8ff (${w})`);
  const r = /c = DN\(vec3\(0\.062, 0\.062, 0\.086\), vec3\(([\d.]+), ([\d.]+), ([\d.]+)\)\)/.exec(main).slice(1).map(Number);
  assert.ok(r[0] >= 0.3 && r[0] <= 0.45 && Math.abs(r[0] - r[2]) < 0.06, `the day road: clean grey asphalt (${r})`);
  assert.match(main, /DN\(vec3\(1\.0, 0\.62, 0\.9\), vec3\(1\.0, 0\.84, 0\.20\)\) : DN\(vec3\(0\.93, 0\.86, 1\.0\), vec3\(0\.97, 0\.97, 0\.95\)\)/, 'yellow + white lane paint');
  // THE TELLS in sunlight
  assert.match(main, /vec3\(0\.98, 0\.10, 0\.08\), vState\.y \* \(0\.2 \+ 0\.7 \* r\) \* uDay\);/, 'a rail lane in its tell FLASHES red by day');
  assert.match(main, /c = mix\(c, mix\(vec3\(1\.0, 0\.86, 0\.10\), vec3\(1\.0\), chev \* 0\.75\), clamp\(band \* 1\.25, 0\.0, 1\.0\) \* uDay\);/, 'THE BLACKBIRD\'s tell: a hot yellow-white chevron band races to the crossing');
  assert.match(n, /hot \? \(day \? 0\.9 : 0\.74\) : \(day \? 0\.22 : 0\.3\)/, 'the runway lights: dim lenses by day, BIGGER than at night when they race');
  assert.match(n, /blink \? \(day \? 0\.7 : 0\.62\) : 0\.24/, 'the rail signals\' red lens is a touch bigger by day (H5C: in a dark signal head — a lamp, never a lollipop)'); assert.match(n, /K\.posts\.put\(x, 0\.66, z - 0\.46, 0\.3, 0\.34, 0\.12, 0, 0x1c1c24, lt\);/, 'the signal head\'s housing');
  // THE FOG BANK = the blackout's own darkness (vState.x), whitened — the same lanes, the same timing
  // (H5C — never a flat slab, never a hard line: the bank's edge is measured PER PIXEL off the wall itself (uWall), soft + ragged, the
  //  lane seen through its first metre, a cool shadow in front; night.js lays FOG_LAYERS — billows rolling at their own speeds)
  assert.match(fx, /float ly = vLane \+ z, d = uWall - ly;/, 'the bank\'s edge per pixel, off the wall itself'); assert.match(fx, /float thin = smoothstep\(-1\.5, 0\.7, d \+ \(bn - 0\.5\) \* 1\.9\);/, 'soft + ragged (two drifting noise fields)'); assert.match(fx, /if \(d > 3\.4\) c = vec3\(0\.875, 0\.906, 0\.933\) \* 0\.98;\s+else if \(d > -3\.4\) \{/, 'only the pixels near the wall pay for the noise');
  assert.match(fx, /float fogA = thin \* mix\(0\.5, 1\.0, smoothstep\(0\.1, 2\.1, d\)\);/, 'the lane is seen THROUGH its first metre, solid two lanes in');
  assert.match(fx, /c = mix\(c, vec3\(0\.875, 0\.906, 0\.933\) \* \(0\.93 \+ 0\.1 \* bn\), clamp\(fogA, 0\.0, 1\.0\)\);/, 'the lane whitens under the bank');
  assert.match(n, /ground\.uniforms\.uWall\.value = wallE;/, '… the SAME wall (the run\'s own)');
  { const lay = /const FOG_LAYERS = Object\.freeze\(\[([\s\S]*?)\]\);/.exec(n)[1].split('\n').filter(l => l.trim().startsWith('[')).map(l => JSON.parse(l.trim().replace(/,$/, '').replace(/0x[0-9a-f]+/g, m => String(parseInt(m, 16))))); assert.equal(lay.length, 6, 'six layers: three mottle the body (never a flat fill), three roll on its face'); assert.ok(new Set(lay.map(l => l[5])).size === 6 && lay.some(l => l[5] < 0) && lay.some(l => l[5] > 0), 'each layer its own speed, both ways'); assert.ok(lay[5][4] < 0.7, 'the front layer is thin: the lanes show through'); assert.ok(lay.slice(0, 3).every(l => l[4] >= 0.8 && l[6] !== l[7]), 'the billows of the body are solid + two-toned'); }
  assert.match(n, /K\.shadow\.raw\(0, 0\.06, Z\(wallE \+ 1\.25\), 34, 1, 3\.2, 0, 0, 1, 4, 0\.2\);/, 'a cool shadow on the ground in front of it');
  assert.match(n, /fogK = day \? 2\.4 : -0\.96;/); assert.match(n, /lt = 1 \+ fogK \* dk, on = day \? dk < 0\.6 : lt > 0\.3;/, 'what stands on a taken lane: dark by night, whited out by day');
  assert.match(n, /curtain\.material\.color\.setHex\(day \? 0xdfe7ee : 0x000000\);/, 'the bank\'s body = the blackout\'s curtain');
  assert.match(n, /const wallE = run\.wall \/ FP, darkOf = i => clamp01\(wallE - i\)/, 'ONE wall: the run\'s own (the rules\')');
  // light vs paint
  assert.match(n, /const LF = day \? NOP : K\.flat\.put, LB = day \? NOP : K\.bill\.put,/);
  for (const [what, re] of [['the headlights\' beams', /LF\(X\(nose \+ L\.dir \* HEAD_REACH \/ 2\)/], ['the tail glow', /LF\(X\(rearX - L\.dir \* \(TAIL_LEN \/ 2 - 0\.2\)\)/], ['a street lamp\'s pool', /LF\(x - side \* 0\.75, 0\.035, z, 3\.6/], ['the kid\'s glow pool', /LF\(px, feet \+ 0\.04, pz \+ 0\.04, 2\.3/], ['the logs\' amber underglow', /LF\(cx, 0\.045, z, len \+ 1\.1/]]) assert.match(n, re, `${what}: off by day`);
  assert.match(n, /m\.blending = day \? THREE\.NormalBlending : THREE\.AdditiveBlending; m\.uniforms\.uDay\.value = day \? 1 : 0;/, 'the lights that stay are PAINT by day');
  assert.match(fx, /if \(uDay > 0\.5\) gl_FragColor = vec4\(vCol, clamp\(k, 0\.0, 1\.0\)\); else gl_FragColor = vec4\(vCol \* k, 1\.0\);/);
  assert.match(n, /if \(day\) K\.shadow\.raw\(px, feet \+ 0\.043, pz \+ 0\.04, 1\.72 \* br, 1, 1\.42 \* br, 0, 0, 1, 3,/, 'THE KID by day: a soft shadow-ring + his colour inside it');
  // (H5C — things SIT on the ground: every shadow is TWO by day — a contact shadow straight under the thing + the sun's, thrown to one side by its height)
  assert.match(n, /put0\(x \+ SUN\.x \* off, y - 0\.003, z \+ SUN\.z \* off, sx \* 1\.05, 1, sz \* 1\.05, ry, hex, k, a0, a \* 0\.62, \.\.\.r\);/, 'the sun\'s shadow: thrown to one side, by the thing\'s height');
  assert.match(n, /put0\(x \+ SUN\.x \* 0\.05, y, z \+ SUN\.z \* 0\.05, sx \* 0\.9, 1, sz \* 0\.9, ry, hex, k, a0, a \* 0\.9, \.\.\.r\);/, '… + a tight contact shadow under it');
  assert.match(n, /if \(!day\) \{ put0\(x, y, z, sx, 1, sz, ry, hex, k, a0, a1, \.\.\.r\); return; \}/, 'by night: the one blob shadow, as before');
  assert.match(fx, /gl_FragColor = vec4\(vec3\(0\.03, 0\.07, 0\.17\) \* uDay, a \* vFx\.y \* \(1\.0 - vFog\)\);/, 'a day shadow is cool, never plain black');
  assert.match(n, /if \(bloom && !day\) bloom\.render\(scene, cam\);/);
  // the gate by day: painted — never neon
  assert.match(n, /if \(day\) \{[\s\S]{0,400}const pc = LOOKS\[AR\]\.paint/); assert.match(n, /for \(let k = 0; k < 10; k\+\+\) K\.posts\.put\(xl \+ \(xr - xl\) \* \(k \+ 0\.5\) \/ 10, 3\.04, zf, \(xr - xl\) \/ 10 \+ 0\.01, 0\.34, 0\.2, 0, k % 2 \? wh : pc, li\);/, 'a painted, striped crossbar (H5C: the name\'s arched board stands on it)');
  assert.match(n, /if \(day\) \{[^}]*c\.strokeText\(text, 0, 0\); c\.fillStyle = '#ffffff'; c\.fillText\(text, 0, 0\);/, 'the name: white paint, a dark edge');
  // only the look on screen is fetched
  assert.match(n, /const plan = skyPlan\(lane, day \? 'day' : 'night'\), keep = skyHeld\(plan\);/, 'the band asks skyline.js: the look on screen, the kid\'s area');
  assert.ok(existsSync(new URL('../assets/jaywalk/skyline-day.webp', import.meta.url)));
});

test('THE LANDMARKS IN THE SKYLINE (H6B): PAINTED in the band\'s pictures in BOTH looks — the drawn landmarks (skymarks.js), their canvas, their css + the band\'s colour wash are RETIRED; the night\'s life is its own layer, faded with the look', () => {
  const n = code('night.js'), css = read('css/jaywalk.css');
  assert.ok(!existsSync(new URL('../js/games/jaywalk/skymarks.js', import.meta.url)), 'skymarks.js is gone');
  assert.doesNotMatch(n, /skymarks|skyMark|skyTint/); assert.doesNotMatch(css, /jw-sky-mark|jw-sky-beam|jw-sky-tint|jw-mark-a|jw-beam/);
  assert.match(css, /\.jw-skyline\[data-look='day'\] \.jw-sky-life \{ opacity: 0; visibility: hidden; transition: opacity 1\.5s ease-in-out, visibility 0s 1\.5s; \}/, 'the night life is the night\'s — it FADES with the look (opacity only), then is not painted');
  assert.match(css, /\.jw-sky-life \[hidden\] \{ display: none; \}/, 'a light a painted landmark covers is simply not there');
});

test('THE HEADER + THE DAY WORDS: "JAYWALK · SOLO" / "JAYWALK · MATCH" is a big, bold header (no pill); every word over the bright scene keeps a dark edge', () => {
  const v = code('view.js'), css = read('css/jaywalk.css');
  assert.match(v, /kicker: solo \? 'JAYWALK · SOLO' : 'JAYWALK · MATCH',/);
  const hd = /\.jw-final \.final > \.sheet-kicker \{([^}]*)\}/.exec(css)[1];
  assert.match(hd, /font: 900 clamp\(17px, 5\.1vw, 22px\)\/1\.15 var\(--font-display\)/, 'bigger + bolder: the display face, 900, ≈ 20 px at 390 (the frame\'s kicker: 11 px mono)');
  assert.match(hd, /white-space: nowrap/); assert.doesNotMatch(hd, /border-radius|background|border:/, 'no pill, no box');
  for (const sel of ['.jw-mark', '.jw-hint', '.jw-watch', '.jw-count.is-wait']) assert.ok(css.includes(`.jw-stage[data-look='day'] ${sel}`), `${sel} has its day rule`);
  assert.match(css, /\.jw-stage\[data-look='day'\]:not\(\.is-gray\) \.jw-lanes \{ color: #fff; -webkit-text-stroke: 2px #c4168a;/, 'the lane count: white, a dark magenta edge');
  assert.match(css, /\.jw-stage\[data-look='day'\] \.jw-blackout \{ background: linear-gradient\(rgba\(223, 231, 238, 0\) 0,/, 'the screen\'s foot fades to THE FOG, not to black');
  const day = css.slice(css.indexOf('/* THE DAY LOOK (night.js#setLook'));
  assert.doesNotMatch(day, /border-radius: (?:[2-9]\d|1[1-9])px|border-radius: 999/, 'no pill in the day rules');
});

test('THE REFUSED CHAT WRITE (the inbox, Nov 16 8:12 pm — "set chats/*/m/*" ×2 on game:jaywalk/final): the winner\'s + the start\'s keyed system lines are written ONCE — the host asks first; host-only, within the limits, NO rules change', () => {
  const c = read('js/chat/chat.js');
  const once = c.slice(c.indexOf('export async function systemOnce('), c.indexOf('const nameOf'));
  assert.match(once, /if \(!code \|\| !key \|\| !isHost\(\) \|\| !mayWrite\(code, true\)\) return;/, 'the HOST only');
  assert.match(once, /if \(chat\.code === code && chat\.msgs\.some\(m => m\.k === key\)\) return;/, 'already in this phone\'s chat → nothing');
  assert.match(once, /try \{ if \(\(await get\(dbRef\(`\$\{C\(code\)\}\/m\/\$\{key\}`\)\)\)\.exists\(\)\) return; \} catch \{ return; \}/, 'already in the database → nothing (an unread key is never written blind)');
  assert.match(once, /if \(state\.code === code\) return system\(kind, text, key\);/);
  assert.match(c, /if \(winners\.length\) systemOnce\('win', line, `s-win-\$\{g\.matchId\}`\);/); assert.match(c, /return systemOnce\('start', `\$\{name\} started`, `s-start-\$\{matchId\}`\);/);
  assert.doesNotMatch(c.replace(once, ''), /system\([^)]*`s-(win|start)-/, 'no keyed line is written without asking');
  // within the rules' limits: s ≤ 12, x ≤ 80
  assert.match(c, /const SYS_MAX = 80;/); assert.match(c, /\{ s: kind, x: String\(text\)\.slice\(0, SYS_MAX\), at: serverTimestamp\(\) \}/);
  for (const k of ['win', 'start', 'host', 'join', 'left', 'kick', 'lost', 'back']) assert.ok(k.length <= 12);
  // JAYWALK itself writes nothing to the chat
  for (const f of ['view.js', 'victory.js', 'index.js', 'director.js', 'share.js']) assert.doesNotMatch(code(f), /chats\/|chat\/chat\.js/, `${f} never writes the chat`);
  // the rule that refused the second write is untouched (a system line needs !data.exists())
  assert.match(read('database.rules.json'), /\(!newData\.exists\(\) \|\| \(!data\.exists\(\) && newData\.hasChild\('s'\)\)\)/);
});

// ---- THE ADD-ONS (THE ADD-ON INBOX, Nov 16 9:10 pm + 9:15 pm — the owner, after a 4-player match with family)
test('BLUE ON THE GROUND = WATER, NOTHING ELSE: no gateway neon / paint, no line, no runway light, no lane marking, no wall edge is blue-led; the friend line is a pink TAPE between two posts — a line you cross', () => {
  const a = code('areas.js'), n = code('night.js'), fx = read('js/games/jaywalk/night-fx.js');
  const rgb = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255], blue = h => { const [r, g, b] = rgb(h); return b > r && b > g; };
  const table = a.slice(a.indexOf('export const LOOKS'), a.indexOf('export const lookAt'));
  const hexes = [...table.matchAll(/(accent|paint|lamp): 0x([0-9a-f]{6})/g)].map(m => [m[1], parseInt(m[2], 16)]);
  assert.equal(hexes.filter(q => q[0] === 'accent').length, 8); assert.equal(hexes.filter(q => q[0] === 'paint').length, 8);
  for (const [k, h] of hexes) assert.ok(!blue(h), `an area's ${k} #${h.toString(16)} lies on the ground: never blue-led`);
  // the scene's own lights on the ground (the flat kind) + the lane's markings: the old blues are gone
  assert.doesNotMatch(n, /0x2a7cff|0x2f7bff|0x1f5fd0|0x7fd0ff|0x8fc4ff|0x2a4a9a|0xd8f0ff/, 'the runway lights, the train\'s side light, the blackout\'s edge: no blue left');
  assert.doesNotMatch(a, /0x7fd0ff|0xcfe4ff|0x4d9dff|0x35e3ff/, 'the boats\' / the tower\'s / the hangars\' light on the ground: warm');
  const flight = fx.slice(fx.indexOf('DN(vec3(0.088, 0.086, 0.104)'), fx.indexOf('// THE WIDER VIEW'));
  assert.match(flight, /c \+= \(vec3\(1\.0, 0\.66, 0\.14\) \* band/, 'the runway\'s tell is AMBER by night'); assert.doesNotMatch(flight, /vec3\(0\.20, 0\.55, 1\.0\)|vec3\(0\.05, 0\.12, 0\.34\)/);
  assert.doesNotMatch(fx, /vec3\(0\.6, 0\.9, 1\.0\)/, 'no cyan lane dashes on the road');
  // the only blue ground is the water: its lane's colours are the only blue-led base in the shader's main()
  const main = fx.slice(fx.indexOf('void main() {\n  float type = vKind.x'), fx.indexOf('gl_FragColor = vec4(c, 1.0);'));
  const bases = [...main.matchAll(/c = (?:mix\()?DN\(vec3\(([\d.]+), ([\d.]+), ([\d.]+)\)/g)].map(m => m.slice(1).map(Number));
  assert.equal(bases.filter(c => c[2] > c[0] * 1.6 && c[2] > c[1] * 1.3).length, 1, `one blue ground: the water (${bases.map(c => c.join(' ')).join(' | ')})`);
  // THE FRIEND LINE: neon pink, a tape a little above the ground between two posts at the play's edges; YOUR BEST stays the gold band
  // (H5C — ONE FORM FOR BOTH lines: YOUR BEST is a GOLD tape between two posts too; on water the posts are buoys)
  const tape = n.slice(n.indexOf('const la = Math.min(1.4, ll), wet ='), n.indexOf('lab.m.visible = ll > 0.2;'));
  assert.ok(tape.length > 400);
  assert.match(tape, /for \(const px0 of \[X\(-0\.03\), X\(COLS \+ 0\.03\)\]\) \{/); assert.match(tape, /K\.posts\.put\(px0, 0\.31, z, 0\.12, 0\.62, 0\.12,/, 'a short post at each edge of the play (on its boundary lines — it covers no cell)');
  assert.match(tape, /K\.flat\.put\(0, 0\.36, z, 9\.06, 1,/, 'the band = a TAPE above the ground'); assert.match(tape, /K\.shadow\.raw\(0, 0\.052, z \+ 0\.07, 9\.0, 1, 0\.26,/, '… its thin shadow under it: it reads as lifted');
  assert.doesNotMatch(tape, /K\.flat\.put\(0, 0\.06[0-9]?, z, 13,/, 'no band lying on the lane');
});

test('THE RAIL SIGNALS FLASH ONLY BEFORE THE TRAIN (the owner\'s nephew: "is another one coming?"): flashing red = a train is COMING; dark once its nose is in the lane, through the pass + after it; the bell follows; view + sound only', () => {
  const n = code('night.js'), g = code('graybox.js'), c = code('cues.js');
  assert.match(n, /const tell = st\.st === 'tell', blink = tell && Math\.floor\(t \/ 8\) % 2 === 0;/); assert.doesNotMatch(n + g, /st\.st !== 'idle'/, 'never "anything but idle": the pass + the body\'s lead are DARK');
  assert.match(n, /fxv = tell \? \(blink \? 1 : 0\.35\) : 0;/, 'the lane\'s own red flash (the ground) too');
  assert.match(n, /blink \? 0xff2a2a : tell \? 0x7a1414 : 0x32151b/, 'an unlit dim lamp when no train is coming');
  assert.match(n, /if \(st\.st === 'tell' && on\) \{/, 'the side warning glow: the tell alone');
  assert.match(n, /fxv \? 0xff2a2a : railGone \? 0x24302a : 0x40ff80/, 'the rail yard\'s gantry lamp: red in the tell, dark while the train is here, green when clear');
  assert.match(g, /const on = st\.st === 'tell' && \(Math\.floor\(t \/ 8\) % 2 === 0\)/, 'the graybox the same');
  // the bell: on exactly while a near rail is in its tell, off (faded) as the pass begins — tests/jaywalk-cues.test.mjs proves it on real runs
  assert.match(c, /if \(st\.st === 'tell'\) \{\s+tell = true;/); assert.match(c, /if \(tell !== S\.bell\) \{ S\.bell = tell; out\.push\(\{ cue: tell \? 'bell-on' : 'bell-off' \}\); \}/);
  for (const f of ['course.js', 'engine.js', 'replay.js', 'tuning.js']) assert.doesNotMatch(code(f), /railGone|blink/, `${f}: the rules are untouched`);
});

// ---- THE ADD-ON (THE ADD-ON INBOX, Nov 16 9:20 pm — the owner: the start pile-up of a match)
test('THE GHOSTS STOP BLOCKING YOU: NEAR YOU = FAINT (≈ 15 %, no tag, eased ≈ 150 ms); your own kid ALWAYS on top (the stencil); THE NAMES AT THE START lined up once through the count; STACKED TAGS MERGE — the leader + "+N"; view only', async () => {
  const { tagGroups } = await import('../js/games/jaywalk/ghosts.js');
  const n = code('night.js'), fx = read('js/games/jaywalk/night-fx.js'), v = code('view.js'), css = read('css/jaywalk.css');
  // (1) near you = faint
  assert.match(n, /const near = show \? clamp01\(\(2\.0 - Math\.hypot\(gpx - px, gpz - pz\)\) \/ 0\.5\) : 0;/, 'within ≈ 1.5 cells of the kid on screen (fully faint at 1.5, itself from 2)');
  assert.match(n, /g\.fade = \(g\.fade \|\| 0\) \+ \(near - \(g\.fade \|\| 0\)\) \* \(reduce \? 1 : 1 - Math\.exp\(-dt \/ 50\)\);/, 'eased (≈ 150 ms) — never a pop');
  assert.match(n, /Math\.min\(7\.9, glit\) \+ 8 \* Math\.round\(g\.fade \* 15\)/); assert.match(fx, /vJwA = 1\.0 - 0\.68 \* floor\(aKid\.x \/ 8\.0\) \/ 15\.0;/, 'the instance\'s own alpha: 1 → 0.32 of the ghosts\' 0.46 ≈ 15 %');
  assert.ok(Math.abs(0.46 * (1 - 0.68) - 0.15) < 0.01);
  assert.match(fx, /diffuseColor\.a \*= vJwA;/); assert.match(fx, /\$\{skin \? 'mod\(aKid\.x, 8\.0\)' : 'aLit'\}/, 'the light is still the instance\'s own');
  assert.match(n, /g\.tag = gone > 0 \|\| g\.fade > 0\.45 \? null : true;/, 'a faint ghost carries no name tag');
  // your own kid on top of every ghost
  assert.match(n, /kidMat\.stencilWrite = true; kidMat\.stencilRef = 1; kidMat\.stencilFunc = THREE\.AlwaysStencilFunc; kidMat\.stencilZPass = THREE\.ReplaceStencilOp;/);
  assert.match(n, /gm\.stencilWrite = true; gm\.stencilWriteMask = 0; gm\.stencilRef = 1; gm\.stencilFunc = THREE\.NotEqualStencilFunc;/, 'a ghost never draws on the kid\'s pixels');
  // (2) the names at the start
  assert.match(v, /const counting = \/\^\[123\]\$\/\.test\(key\) \|\| key === 'GET READY';/); assert.match(v, /rosterEl\.classList\.toggle\('is-on', counting\);/, 'through the 3 · 2 · 1 only — gone at GO');
  assert.match(v, /\.sort\(\(a, b\) => \(a === uid \? -1 : b === uid \? 1 : a < b \? -1 : 1\)\)/, 'you first, then the others');
  assert.match(v, /const shown = counting \? \[\] : extra\.ghosts\.filter\(G => G\.tag\)/, 'no ghost tag through the count');
  assert.match(css, /\.jw-roster \{[^}]*pointer-events: none; opacity: 0; transition: opacity 0\.25s; \}/); assert.doesNotMatch(/\.jw-roster span \{([^}]*)\}/.exec(css)[1], /border-radius: (?:[1-9]\d|[5-9])px/, 'no pill');
  // (3) stacked tags merge — PURE
  const G = (id, x, y, best, name = id.toUpperCase()) => ({ id, x, y, best, name });
  assert.deepEqual(tagGroups([]), []);
  assert.deepEqual(tagGroups([G('mikie', 4.5, 9, 9)]), [{ lead: 'mikie', text: 'MIKIE', ids: ['mikie'] }]);
  assert.deepEqual(tagGroups([G('ada', 4.5, 9, 9), G('mikie', 4.6, 9, 12), G('zed', 4.4, 9, 9)]), [{ lead: 'mikie', text: 'MIKIE +2', ids: ['mikie', 'ada', 'zed'] }], 'three on one square: the leader (the farthest along) + "+2"');
  assert.deepEqual(tagGroups([G('a', 4.5, 9, 9), G('b', 5.5, 10, 10)]).map(q => q.text), ['B +1'], 'touching squares (a corner counts)');
  assert.deepEqual(tagGroups([G('a', 4.5, 9, 9), G('b', 6.5, 9, 9)]).map(q => q.text).sort(), ['A', 'B'], 'a square apart: each its own tag');
  assert.deepEqual(tagGroups([G('a', 1.5, 5, 5), G('b', 2.5, 5, 5), G('c', 3.5, 5, 5)]).map(q => q.text), ['A +2'], 'a chain of touching squares is one group');
  assert.deepEqual(tagGroups([G('b', 4.5, 9, 9), G('a', 4.5, 9, 9)]).map(q => q.lead), ['a'], 'level: the same leader on every phone (the id)');
  assert.match(v, /for \(const q of tagGroups\(shown\.map\(G => \(\{ id: G\.uid, x: G\.run\.x \/ FP, y: G\.run\.y, best: G\.run\.best, name: G\.name \}\)\)\)\) lead\.set\(q\.lead, q\.text\);/);
  assert.match(v, /if \(text !== G\.tagText\) \{ G\.tagText = text; G\.tagEl\.textContent = text; \}/, 'the tag\'s words change only when they differ (never per frame)');
  // view only
  for (const f of ['engine.js', 'course.js', 'replay.js', 'logic.js', 'director.js']) assert.doesNotMatch(code(f), /tagGroups|\.fade\b|roster/, `${f}: the rules are untouched`);
});
