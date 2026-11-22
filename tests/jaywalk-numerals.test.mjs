// JAYWALK H5A's add-on — THE BIG NUMERALS (docs/jaywalk.md "THE BIG NUMERALS"; the owner, Nov 16: on his iMessage share card "172"
// read like "N2"): ONE helper (numerals.js) for every place JAYWALK draws its big neon numerals — more room between two digits, a "1"
// on a base foot. Here: the canvas path with a stub context (the room, the foot's rectangle under every 1), and every place wired to
// it. (The pictures — 17 · 71 · 111 · 117 · 172 · 711 on the card, the counter, the end screen: tests/integration/jaywalk-lab.mjs --nums.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NUM_GAP, NUM_FAMILY, drawNum, numWidth } from '../js/games/jaywalk/numerals.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

/** a canvas context that only remembers what was drawn (every glyph 60 px wide at this "font") */
const stub = () => { const calls = []; return { calls, textAlign: 'left', measureText: () => ({ width: 60 }), fillText: (t, x, y) => calls.push(['text', t, x, y]), fillRect: (x, y, w, h) => calls.push(['rect', x, y, w, h]) }; };

test('THE ROOM BETWEEN THE DIGITS (canvas): a numeral is drawn glyph by glyph, NUM_GAP em apart — "172" can never close up into "N2"; text beside digits keeps its own spacing', () => {
  assert.ok(NUM_GAP >= 0.06 && NUM_GAP <= 0.14, `the room: ${NUM_GAP} em`);
  for (const t of ['17', '71', '111', '117', '172', '711', '1,172']) {
    const c = stub(), w = drawNum(c, t, 100, 500, 200, 'X', 900);
    const glyphs = c.calls.filter(q => q[0] === 'text');
    assert.equal(glyphs.map(q => q[1]).join(''), t, 'every glyph, in order');
    for (let i = 1; i < glyphs.length; i++) assert.ok(glyphs[i][2] - glyphs[i - 1][2] >= 60 + NUM_GAP * 200 - 1e-6, `${t}: ${glyphs[i - 1][1]}→${glyphs[i][1]} stand ${glyphs[i][2] - glyphs[i - 1][2]} px apart (the advance + the room)`);
    assert.equal(w, numWidth(c, t, 200, 'X', 900), 'numWidth = what drawNum draws');
    assert.equal(c.textAlign, 'left', 'the context\'s own alignment is put back');
  }
  // words keep the font's own spacing; only a digit's neighbours get the room
  const c = stub();
  drawNum(c, 'AB 12', 0, 0, 100, 'X', 900);
  const xs = c.calls.filter(q => q[0] === 'text').map(q => q[2]);
  assert.deepEqual(xs, [0, 60, 120, 180 + NUM_GAP * 100, 240 + 2 * NUM_GAP * 100], 'A·B·space plain; the room only round the digits');
});

test('EVERY PLACE draws its big numerals through numerals.js: the share card, the end screen, the in-game lane counter, the lab\'s, the lines\' words — a "1" on a base foot in the DOM (CSS, placed by the measured numbers) and on a canvas (a rectangle)', () => {
  const N = code('numerals.js'), S = code('share.js'), V = code('victory.js'), W = code('view.js'), L = code('lab.js'), G = code('night.js'), css = read('css/jaywalk.css');
  // the foot: measured off the font's own 1 (its stem read from the pixels), skipped when the font's 1 already has one
  assert.match(N, /const mid = span\(Y0 - Math\.round\(S \* 0\.3\)\), base = span\(Y0 - 4\);/, 'the 1 is rasterised once a font: its stem, its base');
  assert.match(N, /has = base\[1\] - base\[0\] > t \* 1\.6;/, 'a font whose 1 already stands on a foot gets none');
  assert.match(N, /if \(ch === '1' && f\.w > 0\) c\.fillRect\(at \+ f\.l \* size, y - f\.h \* size, f\.w \* size, f\.h \* size\);/, 'canvas: a foot under every 1, on the baseline');
  assert.match(N, /s\.className = ch === '1' \? 'jw-dg jw-d1' :/, 'DOM: each digit its own box, a 1 marked for its foot');
  assert.match(N, /el\.setAttribute\('aria-label', t\);/, 'a reader hears the number, not its digits');
  assert.match(N, /if \(ready\) FOOT\.set\(key, out\);/, 'a measure taken before the web font landed is never kept');
  assert.equal(NUM_FAMILY, "'Chakra Petch', system-ui, sans-serif"); assert.match(read('css/base.css'), /--font-num: 'Chakra Petch', system-ui, sans-serif;/, 'the same stack the DOM draws with');
  for (const bad of [/fetch\(/, /localStorage/, /firebase/, /Math\.random/]) assert.doesNotMatch(N, bad, `numerals.js: ${bad}`);
  // THE SHARE CARD: the big lanes
  assert.match(S, /c\.shadowBlur = 46; c\.fillStyle = fill; drawNum\(c, big, x \+ 32, by, BIG_PX, DISPLAY, 900\);/); assert.match(S, /bw = numWidth\(c, big, BIG_PX, DISPLAY, 900\);/, 'LANES sits after the numeral\'s real width');
  assert.doesNotMatch(S, /fillText\(big,/, 'never the plain run of digits again');
  // THE END SCREEN, THE LANE COUNTER (the game + the lab)
  assert.match(V, /setNum\(big, num\(lanes\)\); prepNums\(el\);/); assert.match(W, /lanesEl = h\('div\.jw-lanes'\); setNum\(lanesEl, 0\); prepNums\(lanesEl\);/); assert.match(W, /lanesShown = shownBest; setNum\(lanesEl, shownBest\);/);
  assert.match(L, /setNum\(lanes, run\.best\);/);
  assert.doesNotMatch(W + L, /lanes(El)?\.textContent = String\(/, 'the counter is never set as plain text');
  // THE LINES' WORDS (YOUR BEST · 172)
  assert.match(G, /drawNum\(c, text, x0, 0, 104, FAM, 900\);/);
  // the CSS: the room, the foot, one line; the LANES label's style is its own child's only (the digits are spans too)
  assert.match(css, /\.jw-dg \{ display: inline-block; position: relative; margin: 0 0\.045em; line-height: 1; \}/);
  assert.match(css, /\.jw-d1::after \{ content: ''; position: absolute; left: calc\(var\(--jw-1l, 0\) \* 1em\); width: calc\(var\(--jw-1w, 0\) \* 1em\); bottom: calc\(var\(--jw-1b, 0\) \* 1em\); height: calc\(var\(--jw-1h, 0\) \* 1em\); background: currentColor;/);
  assert.match(css, /\.jw-lanes, \.jw-fin-n b \{ white-space: nowrap; \}/); assert.match(css, /\.jw-fin-n > span \{ font: 700 15px/);
  assert.doesNotMatch(css, /\.jw-fin-n span \{/, 'a digit never takes the small LANES label\'s look');
  assert.match(css, /\.jw-stage:not\(\.is-gray\) \.jw-lanes\.is-record \{ --jw-ns: #ffc53a; \}/, 'the foot\'s outline follows the counter\'s (pink · gold on a record)');
});
