// OC1 — THE KIT PIECES (js/games/kit/ — docs/cartridge.md D9, the `gk-` prefix): the number pad, the letter keyboard, the tach timer,
// the title slam + 3-2-1, THE ANSWER frame. Their pure parts here; the look at tests/integration/kit-preview.html + overclock-preview.html.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { numpadReduce, numpadNumber, NP_KEYS, NP_BACK } from '../js/games/kit/numpad.js';
import { keyboardReduce, KB_ROWS, KB_BACK, KEY_STATES } from '../js/games/kit/keyboard.js';
import { tachState } from '../js/games/kit/tach.js';
import { slamPhase, SLAM_LATE_MS } from '../js/games/kit/slam.js';
import { answerMark } from '../js/games/kit/answer.js';

const run = (keys, o) => keys.reduce((v, k) => numpadReduce(v, k, o), '');

test('THE NUMBER PAD: 3×4 keys; digits up to maxLen, no leading zeros, one "." / a "−" that toggles, ⌫; the extra key only when asked', () => {
  assert.equal(NP_KEYS.length, 12);
  assert.equal(run(['1', '2', '3']), '123');
  assert.equal(run(['0', '7']), '7', 'no "07"');
  assert.equal(run(['1', NP_BACK, NP_BACK, '4']), '4');
  assert.equal(run(['9', '9', '9'], { maxLen: 2 }), '99');
  assert.equal(run(['.', '5'], { extra: '.' }), '0.5');
  assert.equal(run(['1', '.', '.', '2'], { extra: '.' }), '1.2', 'one point');
  assert.equal(run(['1', '.'], {}), '1', 'no "." key unless asked');
  assert.equal(run(['−', '8'], { extra: '−' }), '−8');
  assert.equal(run(['8', '−'], { extra: '−' }), '−8', 'the minus toggles the sign wherever it is tapped');
  assert.equal(run(['8', '−', '−'], { extra: '−' }), '8');
  assert.equal(run(['−', '8'], {}), '8', 'no "−" key unless asked');
  assert.equal(numpadNumber('−12'), -12);
  assert.equal(numpadNumber('0.5'), 0.5);
  for (const v of ['', '−', '3.']) assert.ok(Number.isNaN(numpadNumber(v)), `"${v}" is not a number yet`);
});

test('THE LETTER KEYBOARD: QWERTY 10 · 9 · 7 + ⌫, then GO; letters only, up to maxLen', () => {
  assert.deepEqual(KB_ROWS.map(r => r.length), [10, 9, 7]);
  assert.equal(new Set(KB_ROWS.join('')).size, 26);
  const t = ks => ks.reduce((v, k) => keyboardReduce(v, k, 5), '');
  assert.equal(t(['C', 'A', 'T']), 'CAT');
  assert.equal(t(['C', 'A', KB_BACK, 'O']), 'CO');
  assert.equal(t(['A', 'B', 'C', 'D', 'E', 'F']), 'ABCDE');
  assert.equal(t(['a', '1', ' ']), '', 'capitals A–Z only');
});

test('THE TACH: the segments fill as the time runs out; the last 3 s white-hot; done at zero; refresh-safe (a pure function of the clock)', () => {
  const T = 30_000;
  assert.deepEqual([0, 1, 10, 19, 20].map(n => tachState(T - (T * n) / 20, T, 20, 3000).lit), [0, 1, 10, 19, 20]);
  assert.equal(tachState(T, T).lit, 0, 'the start: none lit');
  assert.equal(tachState(3001, T).hot, false);
  assert.equal(tachState(3000, T).hot, true, 'the last 3 s');
  assert.equal(tachState(0, T).hot, false, 'zero = done, not hot');
  assert.equal(tachState(0, T).done, true);
  assert.equal(tachState(-500, T).lit, 20);
  assert.equal(tachState(2500, T).sec, 3);
  assert.equal(tachState(50_000, T).lit, 0, 'clamped');
});

test('THE SLAM: the card slams only when seen from the phase\'s start; 3 · 2 · 1 in the last 3 s, GO held a moment — inside the phase', () => {
  const s = 1000, e = 1000 + 3200;   // READY_MS
  assert.equal(slamPhase(s, s, e).slam, true);
  assert.equal(slamPhase(s + SLAM_LATE_MS + 1, s, e).slam, false, 'a late mount: settled');
  assert.deepEqual([s, s + 250, s + 1300, s + 2300, e, e + 300, e + 600].map(t => slamPhase(t, s, e).count), ['', '3', '2', '1', 'GO', 'GO', '']);
  assert.equal(slamPhase(e - 1, s, e).count, '1');
  // the brief (7 s): no number until the last 3 s
  assert.equal(slamPhase(s + 3000, s, s + 7000).count, '');
  assert.equal(slamPhase(s + 4100, s, s + 7000).count, '3');
});

test('THE ANSWER: right ✓ / close ≈ / wrong ✕ — a shape every time, never colour alone; the shared --good / --close tokens', () => {
  assert.equal(answerMark('right').sym, '✓');
  assert.equal(answerMark('wrong').sym, '✕');
  assert.equal(answerMark('close').sym, '≈');
  assert.equal(answerMark('weird').cls, 'is-none');
  const css = readFileSync('css/kit.css', 'utf8');
  assert.match(css, /\.gk-sock\.is-check \{ --sock-c: var\(--good\)/);
  assert.match(css, /\.gk-sock\.is-approx \{ --sock-c: var\(--close\)/);
  // ADD-ONs 3 + 4: a neon tube in a dark-glass socket — never a filled circle; the glow a static path (never an animated shadow)
  assert.doesNotMatch(css, /gk-answer-mark|gk-pick-mark/);
  assert.match(css, /\.gk-sock \{[^}]*skewX\(var\(--gk-slant/);
  const src = readFileSync('js/games/kit/answer.js', 'utf8');
  assert.match(src, /gk-tube-glow/);
  assert.match(src, /h\('span\.gk-you'/, 'the YOU tag when it was your pick');
  assert.match(css, /\.gk-answers \{[^}]*gap: (1[6-9]|[2-9]\d)px/, 'each question group has ≥ 16 pt after it');
});

test('THE KIT\'s rules: gk- classes only; no input element (never the system keyboard); no animated shadow / filter; a server clock passed in', () => {
  const files = ['numpad', 'keyboard', 'tach', 'slam', 'answer'].map(f => [f, readFileSync(`js/games/kit/${f}.js`, 'utf8')]);
  for (const [f, src] of files) {
    assert.doesNotMatch(src, /h\(['`]input|createElement\(['"]input|contenteditable/i, `${f}: no input`);
    assert.doesNotMatch(src, /Date\.now\(\)/, `${f}: never Date.now`);
    for (const m of src.matchAll(/h\(['`]([a-z0-9]+)((?:\.[\w-]+)+)/g)) for (const c of m[2].split('.').filter(Boolean)) assert.match(c, /^(gk-|is-|has-|r\d)/, `${f}: .${c} (the gk- prefix)`);
    assert.doesNotMatch(src, /from '\.\.\/\.\.\/firebase\.js'/, `${f}: no firebase import (its clock comes in)`);
  }
  const css = readFileSync('css/kit.css', 'utf8');
  const kit = css.slice(css.indexOf('THE KIT PIECES'));
  for (const kf of kit.matchAll(/@keyframes ([\w-]+) \{([^@]*?)\}\s*\}/g)) assert.doesNotMatch(kf[2], /box-shadow|filter|text-shadow|width|height|left|top/, `@keyframes ${kf[1]}: transform + opacity only`);
  assert.match(kit, /--gk-key-h, 56px/);
  assert.match(kit, /\.gk-kb-key \{[^}]*--gk-key-h, 54px/);
  assert.match(kit, /prefers-reduced-motion/);
});

// PW1 — THE KEYBOARD HOOK (THE PASSWORD): setKeyStates's three states; the delete key a DRAWN icon (no ⌫ glyph reaches the screen — KB_BACK stays
// the key's code); the keys' marks from the shared --good / --close tokens (the colour-blind swap rides them), never a hard-coded green / gold
test('THE LETTER KEYBOARD (PW1): per-key states, a drawn delete icon, the marks on the shared tokens', () => {
  assert.deepEqual([...KEY_STATES], ['hit', 'near', 'miss']);
  const src = readFileSync('js/games/kit/keyboard.js', 'utf8');
  assert.match(src, /setKeyStates\(map/);
  assert.match(src, /key\(KB_BACK, backIcon\(\), '\.is-back'\)/, 'the delete key takes the drawn icon as its label');
  assert.match(src, /createElementNS\('http:\/\/www\.w3\.org\/2000\/svg', 'svg'\)/);
  assert.match(src, /'stroke', 'currentColor'/);
  const css = readFileSync('css/kit.css', 'utf8');
  const marks = css.slice(css.indexOf("THE KEYS' MARKS"), css.indexOf('THE TACH TIMER'));
  assert.match(marks, /\[data-st="hit"\] \.gk-key-face \{ background: var\(--good/);
  assert.match(marks, /\[data-st="near"\] \.gk-key-face \{[^}]*var\(--close/);
  assert.match(marks, /\[data-st="miss"\]/);
  assert.doesNotMatch(marks.replace(/var\(--good, #3dff8b\)|var\(--close, #ffd23d\)/g, ''), /#3dff8b|#ffd23d|#00ff|green|gold/i, 'no green / gold of its own');
  assert.match(marks, /::after/, 'the bar / the dot are shapes, not colour alone');
});
