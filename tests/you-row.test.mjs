// CITY H2 — THE YOU ROW (the owner's pick B, THE GLOW): ONE standard in ui/strip-board.js for EVERY slim-card list — YOUR strip marked, the glow a
// pseudo-element whose OPACITY breathes (never an animated shadow), reduced motion steady; no list keeps its own "me" box / edge / tint.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE YOU ROW: one helper, one CSS rule (opacity only, reduced motion steady)', () => {
  const sb = read('js/ui/strip-board.js'), v = read('css/vault.css');
  assert.match(sb, /export const YOU_CLS = 'sb-me';/);
  assert.match(sb, /export function markMine\(el, on = true\)/);
  const rule = v.match(/\.vl-strip\.sb-me::after \{[^}]*\}/);
  assert.ok(rule, 'the glow on the strip\'s own pseudo-element');
  assert.match(rule[0], /animation: sb-breathe 3\.6s ease-in-out infinite alternate/, 'breathing slowly (3–4 s)');
  assert.match(v, /@keyframes sb-breathe \{ to \{ opacity: 1; \} \}/, 'only the opacity moves');
  assert.match(v, /@media \(prefers-reduced-motion: reduce\) \{ \.vl-strip\.sb-me::after \{ animation: none; opacity: 0\.85; \} \}/, 'reduced motion: a steady glow');
});

test('THE YOU ROW: every slim-card list marks YOUR strip through it — none keeps its own box / edge / tint', () => {
  for (const [f, re] of [['js/board/view.js', /markMine\(strip\.el, mine\)/], ['js/screens/daily.js', /markMine\(strip\.el, !!r\.me\)/], ['js/ui/end-board.js', /SB\.m\.markMine\(st\.el, !!r\.me\)/], ['js/ui/strip-board.js', /markMine\(s\.el, row\.classList\.contains\('is-me'\)\)/]]) assert.match(read(f), re, f);
  assert.doesNotMatch(read('css/board.css'), /\.bd-row\.is-me::before|\.bd-row\.is-me \{ background/, 'THE BOARD: no pink left edge, no wash');
  assert.doesNotMatch(read('css/jaywalk.css'), /\.jw-table-list li\.is-me::before/, 'JAYWALK\'s YOUR TABLE: no box of its own');
  assert.doesNotMatch(read('css/daily.css'), /\.is-me \.dy-card \.vl-strip \{ box-shadow/, 'SCORES: no lit frame of its own');
});
