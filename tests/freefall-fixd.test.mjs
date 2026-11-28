// FREEFALL — FIX D: THE IN-PLAY HUD INSIDE THE 3D PICTURE (Nov 27 — docs/games/passes/freefall-fixd.md). Ben's iPhone: the HTML HUD layers
// over the canvas were the stutter (15 hitches / 75 floors · 4 / 65 with them hidden · 0 with no game). The GL HUD (js/games/freefall/hudgl.js)
// imports three.js, so these checks read the SOURCE (the unit job installs nothing); the browser half: tests/integration/freefall-play.mjs --fixd.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const FF = 'js/games/freefall/';
/** a function's body (from its head to the matching close) */
function body(src, head) {
  const i = src.indexOf(head);
  assert.ok(i >= 0, `found: ${head}`);
  let d = 0;
  for (let j = src.indexOf('{', i + head.length - 1); j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(i, j + 1); }
  return src.slice(i);
}
const WRITES = /\.textContent\s*=|\.className\s*=|classList\.(add|remove|toggle)|dataset\.\w+\s*=|\.style\.|setAttribute|\.animate\(|replaceChildren|\.append\(|\.prepend\(/;

test('FIX D — IN A FALL NOTHING OVER THE CANVAS IS WRITTEN: the floor, the darkness, the calls, the bands, the rail → the GL HUD\'s state', () => {
  const s = read(`${FF}stage.js`);
  for (const head of ['  function setNum(n) {', '  function hudFloorNow(R = run) {', '  function hudDarkNow(gap, over) {', '  function say(text, cls, pri, ms, now) {', '  function band(floor) {', '  function moments(from, to, now, late) {', '  function hudFrame(now) {', '  function ghostsFrame(now, tauW, R0, tauD, lead) {', '  function matchHudNow(R0) {']) assert.doesNotMatch(body(s, head), WRITES, `${head.trim()} writes no page`);
  assert.match(s, /numShown = n; H\.num\(n\);\n    if \(n && n % 10 === 0\) BNR\.say\(`FLOOR \$\{n\}`\);/, 'the ONE screen-reader line: the floor every 10 (+ the arrivals) — never more than once a floor');
  assert.match(s, /const setGold = on => \{ goldOn = on; H\.gold\(on\); \};/, 'NEW BEST\'s gold: a flag, not a class');
  assert.match(s, /nearOn = gap <= 1 && on; H\.near\(nearOn, performance\.now\(\)\);/, 'THE LIGHTS ARE GOING OUT: a flag, not a class');
  assert.doesNotMatch(s, /stage\.dataset\.(dark|area) =/, 'data-dark + data-area are never written (the veil draws the darkness — FIX C)');
  assert.match(s, /cls: `\$\{stage\.className\}\$\{goldOn \? ' is-gold' : ''\}\$\{nearOn \? ' is-near' : ''\}`/, 'the checks still read is-gold / is-near (the state hook names the flags)');
  // the HUD's state goes in BEFORE the picture (drawn in it: the number in the same frame as its floor)
  const f = body(s, '  function frame(now) {');
  assert.ok(f.indexOf('hudFrame(now);') > 0 && f.indexOf('hudFrame(now);') < f.indexOf('view.draw(R0, tauD, dt, lead);'));
  const mh = read(`${FF}matchhud.js`);
  for (const head of ['    callout(text, hex) {', '    clock(text) {', '    watching(text) {', '    sheet() {']) assert.doesNotMatch(body(mh, head), WRITES, `MH.${head.trim()} writes no page`);
  assert.doesNotMatch(body(mh, '    rail(rows) {').replace('if (rail.hidden) { rail.hidden = false;', ''), WRITES, 'the rail: records only (the GL HUD eases + draws them) — the source shown once, at the match\'s start');
  const bn = read(`${FF}banner.js`);
  assert.doesNotMatch(body(bn, '    show(name, sub, onDone, cls) {').replace("live.textContent = `${name} — ${sub}`", ''), WRITES, 'a band\'s arrival: the GL HUD\'s frames (+ the reader\'s line 350 ms later)');
});

test('FIX D — THE GL HUD: the frame\'s last pass, never in a share frame; every texture UPLOADED AT ITS BAKE; nothing baked in a frame', () => {
  const n = read(`${FF}night.js`), h = read(`${FF}hudgl.js`);
  assert.match(n, /if \(!staged\) \{ veil\.draw\(subAt\); if \(overlay\) overlay\(\); \}/, 'after the bloom + the veil; a staged share frame never carries it (the HTML HUD never did)');
  assert.match(h, /try \{ R\.initTexture\(t\); cv\.width = cv\.height = 0; \}/, 'a texture goes up when it is baked (never at a first draw in a fall) and its canvas is let go');
  assert.match(h, /s\.tex = tex\(s\.cv\); s\.texVer = s\.ver;/, 'every glyph atlas goes up with its look');
  for (const head of ['  function bandFrame(now, S, off, k) {', '  function matchFrame(now, S, off, k) {', '  function lay(Rn, set, lines, gap) {']) assert.doesNotMatch(body(h, head), /getBoundingClientRect|getComputedStyle|bakeEl\(|glyphSet\(|new THREE\./, `${head.trim()}: no layout read, no bake, nothing made`);
  const fr = body(h, '  function frame(now, S) {').split('\n').filter(l => /bakeEl\(|useLook\(/.test(l));
  assert.deepEqual(fr.map(l => l.trim().slice(0, 40)), ['if (want !== cur) useLook(want);', 'if (noteOn && st.noteKey !== `${st.note}'], 'a frame bakes only on a LOOK change (never in a fall — the look is locked) or a NEW note line');
  // the glows ≥ 12 px at 1×, the letters + their tight edges at the device's own
  assert.match(h, /export const BIG_BLUR = 12;/);
  assert.match(h, /return \(big \? \[\[\{ box: 1 \}, S\], \[\{ glow: 1 \}, 1\], \[\{ sharp: 1 \}, S\]\] : \[\[\{ box: 1, glow: 1, sharp: 1 \}, S\]\]\)/);
  assert.match(h, /gl_FragColor = c; \}`;/, 'raw sRGB, premultiplied — the page\'s own layers\' blend (no colour conversion)');
});

test('FIX D — THE SAME MOTION: the GL HUD\'s keyframes are the stylesheet\'s (ff-out · ff-last · ff-blink), number for number', () => {
  const css = read('css/freefall-play.css'), h = read(`${FF}hudgl.js`);
  assert.match(css, /@keyframes ff-out \{ 0% \{ opacity: 0; transform: translateY\(8px\) scale\(0\.92\); \} 14% \{ opacity: 1; transform: none; \} 78% \{ opacity: 1; transform: none; \} 100% \{ opacity: 0; transform: translateY\(-4px\); \} \}/);
  assert.match(h, /OUT_FRAMES = framesOf\(\[\{ opacity: 0, transform: 'translateY\(8px\) scale\(0\.92\)' \}, \{ opacity: 1, offset: 0\.14 \}, \{ opacity: 1, offset: 0\.78 \}, \{ opacity: 0, transform: 'translateY\(-4px\)' \}\]\);/);
  assert.match(css, /animation: ff-out 1\.5s ease-out both;/); assert.match(css, /animation: ff-last 2\.6s ease-out both;/);
  assert.match(css, /@keyframes ff-last \{ 0% \{ opacity: 0; transform: scale\(0\.7\); \} 12% \{ opacity: 1; transform: none; \} 82% \{ opacity: 1; transform: none; \} 100% \{ opacity: 0; \} \}/);
  assert.match(h, /LAST_FRAMES = framesOf\(\[\{ opacity: 0, transform: 'scale\(0\.7\)' \}, \{ opacity: 1, offset: 0\.12 \}, \{ opacity: 1, offset: 0\.82 \}, \{ opacity: 0 \}\]\);/);
  assert.match(css, /animation: ff-blink 0\.7s steps\(2, jump-none\) infinite;/); assert.match(css, /@keyframes ff-blink \{ 0% \{ opacity: 1; \} 100% \{ opacity: 0\.62; \} \}/);
  assert.match(h, /export const BLINK_MS = 700, BLINK_LOW = 0\.62;/);
  assert.match(css, /\.ff-rail-dot \{[^}]*transition: transform 0\.2s linear;/); assert.match(h, /tw\(d\.ty \|\|= \{\}, d\.y, now, 200\)/, 'the rail\'s 0.2 s linear moves');
  assert.match(css, /\.ff-hud \{[^}]*transition: opacity 0\.4s;/); assert.match(h, /st\.hudMs = to === 0 && \(S\.over \|\| off\) \? 0 : S\.over && S\.watch \? 300 : 400;/, '.ff-hud\'s fade: 0.4 s in · gone at once · 0.3 s back while WATCHING');
  // CSS's own easing curves
  assert.match(h, /export const EASE = bez\(0\.25, 0\.1, 0\.25, 1\), EASE_OUT = bez\(0, 0, 0\.58, 1\);/);
});

test('FIX D — THE SOURCES: hidden (the look painted from them), the reader\'s line kept; HOW TO PLAY says "Multiplayer never pauses."', () => {
  const css = read('css/freefall-play.css').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.match(css, /\.ff-stage\.ff-gl :is\(\.ff-best, \.ff-hud, \.ff-banner, \.ff-rail, \.ff-clock, \.ff-outs, \.ff-last, \.ff-watch\) \{ visibility: hidden; will-change: auto; \}/);
  assert.match(css, /\.ff-stage\.ff-gl:is\(\.is-live, \.is-starting\) :is\(\.ff-note, \.ff-fps\) \{ visibility: hidden; \}/, 'the note + the fps line: in the picture / away while a run is on (the fps summary is back at the end)');
  assert.doesNotMatch(css, /\.ff-gl[^{]*\.ff-banners[^-]/, 'the bands\' box stays: the screen-reader line lives in it');
  assert.match(read(`${FF}stage.js`), /h\(`div\.ff-stage\.is-open\.ff-gl/);
  assert.match(read('js/ui/help.js'), /'Multiplayer never pauses\.',/);
  assert.doesNotMatch(read('js/ui/help.js'), /'A MATCH never pauses\.'/);
});
