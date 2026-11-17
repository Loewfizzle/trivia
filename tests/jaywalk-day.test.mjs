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
  assert.equal(causeLine({ cause: 'wall', taken: true, lanes: 7, look: 'day' }), 'TAKEN AT LANE 7');
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
  assert.match(fx, /#define DN\(n, d\) mix\(n, d, uDay\)/); assert.match(fx, /uDay: \{ value: 0 \} \};/);
  const main = fx.slice(fx.indexOf('void main() {\n  float type = vKind.x'), fx.indexOf('gl_FragColor = vec4(c, 1.0);'));
  for (const [kind, re] of [['grass', /c = mix\(DN\(vec3\(0\.070, 0\.205, 0\.098\), vec3\(/], ['the gate lane', /c = DN\(vec3\(0\.105, 0\.10, 0\.15\), vec3\(/], ['the road', /c = DN\(vec3\(0\.062, 0\.062, 0\.086\), vec3\(/], ['the water', /c = mix\(DN\(vec3\(0\.018, 0\.078, 0\.215\), vec3\(/], ['the rails', /c = DN\(vec3\(0\.088, 0\.078, 0\.09\), vec3\(/], ['the flight path', /c = DN\(vec3\(0\.068, 0\.084, 0\.135\), vec3\(/]]) assert.match(main, re, `${kind}: its night colour + its day colour`);
  // the day water: bright + saturated blue; the day road: a clean mid grey with white + yellow paint
  const w = /c = mix\(DN\(vec3\([\d., ]+\), vec3\(([\d.]+), ([\d.]+), ([\d.]+)\)\), DN\(vec3\([\d., ]+\), vec3\(([\d.]+), ([\d.]+), ([\d.]+)\)\), w \* w/.exec(main).slice(1).map(Number);
  assert.ok(w[2] >= 0.8 && w[2] > w[0] * 4 && w[5] >= 0.9 && w[4] > w[3] * 2, `the day water: bright saturated blue (${w})`);
  const r = /c = DN\(vec3\(0\.062, 0\.062, 0\.086\), vec3\(([\d.]+), ([\d.]+), ([\d.]+)\)\)/.exec(main).slice(1).map(Number);
  assert.ok(r[0] >= 0.3 && r[0] <= 0.45 && Math.abs(r[0] - r[2]) < 0.06, `the day road: clean grey asphalt (${r})`);
  assert.match(main, /DN\(vec3\(1\.0, 0\.62, 0\.9\), vec3\(1\.0, 0\.84, 0\.20\)\) : DN\(vec3\(0\.6, 0\.9, 1\.0\), vec3\(0\.97, 0\.97, 0\.95\)\)/, 'yellow + white lane paint');
  // THE TELLS in sunlight
  assert.match(main, /vec3\(0\.98, 0\.10, 0\.08\), vState\.y \* \(0\.42 \+ 0\.45 \* r\) \* uDay\);/, 'a rail lane in its tell FLASHES red by day');
  assert.match(main, /c = mix\(c, mix\(vec3\(1\.0, 0\.86, 0\.10\), vec3\(1\.0\), chev \* 0\.75\), clamp\(band \* 1\.25, 0\.0, 1\.0\) \* uDay\);/, 'THE BLACKBIRD\'s tell: a hot yellow-white chevron band races to the crossing');
  assert.match(n, /hot \? \(day \? 0\.9 : 0\.74\) : \(day \? 0\.22 : 0\.3\)/, 'the runway lights: dim lenses by day, BIGGER than at night when they race');
  assert.match(n, /blink \? \(day \? 1\.15 : 0\.62\) : 0\.24/, 'the rail signals\' red lens is bigger by day');
  // THE FOG BANK = the blackout's own darkness (vState.x), whitened — the same lanes, the same timing
  assert.match(fx, /if \(uDay > 0\.5\) \{[\s\S]{0,420}c = mix\(c, vec3\(0\.86, 0\.89, 0\.92\), clamp\(dk \* 1\.2 \+ wisp/, 'the lane whitens under the bank');
  assert.match(n, /fogK = day \? 2\.4 : -0\.96;/); assert.match(n, /lt = 1 \+ fogK \* dk, on = day \? dk < 0\.6 : lt > 0\.3;/, 'what stands on a taken lane: dark by night, whited out by day');
  assert.match(n, /curtain\.material\.color\.setHex\(day \? 0xd6dee6 : 0x000000\);/, 'the bank\'s body = the blackout\'s curtain');
  assert.match(n, /const wallE = run\.wall \/ FP, darkOf = i => clamp01\(wallE - i\)/, 'ONE wall: the run\'s own (the rules\')');
  // light vs paint
  assert.match(n, /const LF = day \? NOP : K\.flat\.put, LB = day \? NOP : K\.bill\.put,/);
  for (const [what, re] of [['the headlights\' beams', /LF\(X\(nose \+ L\.dir \* HEAD_REACH \/ 2\)/], ['the tail glows', /LF\(X\(tail - L\.dir \* TAIL_REACH \* 0\.3\)/], ['a street lamp\'s pool', /LF\(x - side \* 0\.75, 0\.035, z, 3\.6/], ['the kid\'s glow pool', /LF\(px, feet \+ 0\.04, pz \+ 0\.04, 2\.3/], ['the logs\' amber underglow', /LF\(cx, 0\.045, z, len \+ 1\.1/]]) assert.match(n, re, `${what}: off by day`);
  assert.match(n, /m\.blending = day \? THREE\.NormalBlending : THREE\.AdditiveBlending; m\.uniforms\.uDay\.value = day \? 1 : 0;/, 'the lights that stay are PAINT by day');
  assert.match(fx, /if \(uDay > 0\.5\) gl_FragColor = vec4\(vCol, clamp\(k, 0\.0, 1\.0\)\); else gl_FragColor = vec4\(vCol \* k, 1\.0\);/);
  assert.match(n, /if \(day\) K\.shadow\.raw\(px, feet \+ 0\.043, pz \+ 0\.04, 1\.72 \* br, 1, 1\.42 \* br, 0, 0, 1, 3,/, 'THE KID by day: a soft shadow-ring + his colour inside it');
  assert.match(n, /K\.shadow\.put = \(x, y, z, sx, sy, sz, ry, hex, k, a0, a1, \.\.\.r\) => \(day \? put0\(x \+ 0\.17 \* Math\.min\(1\.5, sz\), y, z - 0\.09,/, 'the sun\'s shadows: thrown to one side');
  assert.match(n, /if \(bloom && !day\) bloom\.render\(scene, cam\);/);
  // the gate by day: painted — never neon
  assert.match(n, /if \(day\) \{[\s\S]{0,400}const pc = LOOKS\[AR\]\.paint/); assert.match(n, /k % 2 \? wh : pc, li, 1, 1, 0, Math\.atan2\(ay1 - ay0, ax1 - ax0\)\);/, 'a painted, striped arch');
  assert.match(n, /if \(day\) \{[^}]*c\.strokeText\(text, 0, 0\); c\.fillStyle = '#ffffff'; c\.fillText\(text, 0, 0\);/, 'the name: white paint, a dark edge');
  // only the look on screen is fetched
  assert.match(n, /skyImg\.style\.backgroundImage = `url\("\$\{SKY_URL\[day \? 'day' : 'night'\]\}"\)`;/);
  assert.ok(existsSync(new URL('../assets/jaywalk/skyline-day.webp', import.meta.url)));
});

test('THE LANDMARKS IN THE SKYLINE: one landmark an area, in the band while the kid is in it — ONE small canvas through canvas-safe, drawn on a change (never per frame); night = the area\'s neon on a silhouette, day = sunlit; THE LIGHTHOUSE\'s beam sweeps (transform only)', () => {
  const s = code('skymarks.js'), n = code('night.js'), css = read('css/jaywalk.css');
  assert.match(s, /export const MARK_IDS = Object\.freeze\(\['docks', 'fish', 'yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield'\]\);/);
  const marks = s.slice(s.indexOf('const MARKS = ['), s.indexOf('export function drawSkyMark'));
  assert.equal((marks.match(/\n  t => \{/g) || []).length, 8, 'eight drawings, in the areas\' order');
  assert.match(s, /import \{ ctx2d \} from '\.\.\/\.\.\/ui\/canvas-safe\.js';/); assert.match(s, /const c = ctx2d\(cv\);\s*if \(!c\) return;/, 'every canvas through ctx2d');
  assert.doesNotMatch(s, /requestAnimationFrame|setInterval|getBoundingClientRect|offsetWidth|clientWidth/, 'no loop of its own, no layout read');
  assert.match(s, /if \(k === key\) return;/, 'drawn only when the area or the look changes');
  assert.match(s, /fill\.?Style = day \? dayCol : o\.deep \? deep : body/, 'day: its own sunlit colour · night: the silhouette');
  assert.match(s, /c\.strokeStyle = day \? 'rgba\(16, 36, 70, 0\.55\)' : A;/, '… edged in the area\'s neon by night');
  assert.match(n, /skyMark\.set\(ka, day \? 'day' : 'night', ka < 0 \? 0 : LOOKS\[ka\]\.accent\);/, 'set where the band\'s tint is set: on a gateway (+ a look change)');
  assert.match(n, /skyMark\.destroy\(\);/);
  assert.match(css, /\.jw-sky-mark\[data-area='lighthouse'\] \.jw-sky-beam \{ display: block; \}/);
  const beam = /@keyframes jw-beam \{([^@]*)\}\s/.exec(css)[1], rise = /@keyframes jw-mark-a \{([^@]*)\}\s/.exec(css)[1];
  assert.doesNotMatch(beam + rise, /box-shadow|filter|width|height|left|top|background/, 'transform + opacity only');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.jw-sky-mark\.is-a, \.jw-sky-mark\.is-b \{ animation: none; opacity: 1; \} \.jw-sky-beam::before \{ animation: none;/);
  assert.match(css, /\.jw-skyline\[data-look='day'\] \.jw-sky-l, \.jw-skyline\[data-look='day'\] \.jw-sky-n \{ display: none; \}/, 'the night life is the night\'s');
});

test('THE HEADER + THE DAY WORDS: "JAYWALK · SOLO" / "JAYWALK · MATCH" is a big, bold header (no pill); every word over the bright scene keeps a dark edge', () => {
  const v = code('view.js'), css = read('css/jaywalk.css');
  assert.match(v, /kicker: solo \? 'JAYWALK · SOLO' : 'JAYWALK · MATCH',/);
  const hd = /\.jw-final \.final > \.sheet-kicker \{([^}]*)\}/.exec(css)[1];
  assert.match(hd, /font: 900 clamp\(17px, 5\.1vw, 22px\)\/1\.15 var\(--font-display\)/, 'bigger + bolder: the display face, 900, ≈ 20 px at 390 (the frame\'s kicker: 11 px mono)');
  assert.match(hd, /white-space: nowrap/); assert.doesNotMatch(hd, /border-radius|background|border:/, 'no pill, no box');
  for (const sel of ['.jw-mark', '.jw-hint', '.jw-watch', '.jw-count.is-wait']) assert.ok(css.includes(`.jw-stage[data-look='day'] ${sel}`), `${sel} has its day rule`);
  assert.match(css, /\.jw-stage\[data-look='day'\]:not\(\.is-gray\) \.jw-lanes \{ color: #fff; -webkit-text-stroke: 2px #c4168a;/, 'the lane count: white, a dark magenta edge');
  assert.match(css, /\.jw-stage\[data-look='day'\] \.jw-blackout \{ background: linear-gradient\(rgba\(214, 222, 230, 0\) 0,/, 'the screen\'s foot fades to THE FOG, not to black');
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
