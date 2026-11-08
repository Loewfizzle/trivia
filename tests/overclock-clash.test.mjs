// OVERCLOCK — COLOR CLASH, THE ADD-ONS (the owner, Nov 7 — docs/overclock.md): the answers are COLOR WORDS, never a plain swatch, their four text
// colours a DERANGEMENT re-rolled every word (all different, none its own); the right one = the word naming the prompt's TEXT COLOR (ONE pure rule:
// challenges.js#clashAnswer); no "TAP THE WORD" rule (built + dropped — the owner); never the word "ink" on screen or in the help.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generate, CLASH_COLORS, clashAnswer, INFO } from '../js/games/overclock/challenges.js';

const specs = [];
for (let s = 0; s < 400; s++) for (const level of [0, 0.6, 1]) specs.push(generate('stroop', { seed: `clash${s}`, ci: 4, level }));

test('THE ANSWERS: four colour WORDS in four DIFFERENT text colours, none its own (a derangement, re-rolled every word); the answer = the text colour', () => {
  const perms = new Set();
  for (const s of specs) {
    assert.equal(s.items.length, 8);
    assert.equal(s.rule, undefined, 'one rule only: TAP THE TEXT COLOR');
    for (const it of s.items) {
      assert.equal(it.order.length, 4); assert.equal(new Set(it.order).size, 4);
      assert.deepEqual(Object.keys(it.opts).sort(), [...it.order].sort(), 'every button has its text colour (a word — never a swatch-only button)');
      for (const id of it.order) {
        assert.ok(CLASH_COLORS.includes(it.opts[id]), it.opts[id]);
        assert.notEqual(it.opts[id], id, 'a word is never shown in its own colour');
      }
      assert.equal(new Set(Object.values(it.opts)).size, 4, 'no two answers share a text colour');
      perms.add(CLASH_COLORS.map(id => it.opts[id]).join());
      const ans = clashAnswer(s, it);
      assert.equal(ans, it.color, 'the right button = the word naming the prompt\'s text colour');
      assert.ok(it.order.includes(ans));
      assert.notEqual(it.opts[ans], ans, 'the right button never shows its own colour (no colour-matching shortcut)');
    }
  }
  assert.equal(perms.size, 9, `re-rolled: all nine derangements of four come up (${perms.size} seen)`);
  assert.deepEqual(generate('stroop', { seed: 'same', ci: 4, level: 0.6 }), generate('stroop', { seed: 'same', ci: 4, level: 0.6 }), 'deterministic');
});

test('THE SCREEN: words on the buttons, no swatch face, TAP THE TEXT COLOR (no word rule, no flash); "ink" nowhere on screen or in the help; the timings kept', () => {
  const ui = readFileSync('js/games/overclock/ui/stroop.js', 'utf8');
  const css = readFileSync('css/overclock.css', 'utf8');
  assert.match(ui, /h\('b\.oc-cc-optw'[^)]*name\)/, 'each button carries its colour NAME');
  assert.doesNotMatch(ui, /--sw/, 'no solid swatch colour on a button');
  assert.doesNotMatch(css.slice(css.indexOf('COLOR CLASH (ui/stroop.js)'), css.indexOf('/* the answer: the word as it was shown')), /var\(--sw\)/, 'the Color Clash tiles paint no swatch');
  assert.match(ui, /right \? 220 : 650/);
  assert.match(ui, /clashAnswer\(s, it\)/, 'the screen judges by the one rule');
  assert.match(ui, /'TAP THE ', h\('em', 'TEXT COLOR'\)/);
  const code = ui.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.doesNotMatch(code, /TAP THE WORD|oc-cc-flash/, 'no word rule, no flash');
  const help = INFO.stroop.rules.join(' ');
  assert.doesNotMatch(help, /\bink\b/i); assert.doesNotMatch(help, /TAP THE WORD/);
  assert.match(help, /COLOR OF THE TEXT/);
  const strings = code.match(/'[^']*'|`[^`]*`/g) || [];
  assert.deepEqual(strings.filter(x => /\bink\b/i.test(x)), [], 'no on-screen "ink"');
  assert.match(readFileSync('js/games/overclock/answers.js', 'utf8'), /clashAnswer\(spec, it\)/, 'THE ANSWER review uses the same rule');
});
