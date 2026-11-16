// FIXES R2 — the pure halves of the pass (the browser proofs: tests/integration/audio-cut.mjs, wk-press.mjs, the harbor groups).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stopsScroll, pressActs, cleanTap, SCROLL_STOP_MS, DRAG_MS } from '../js/ui/tapwatch.js';

const read = f => readFileSync(f, 'utf8');

test('THE REVIEW A8 — a press is a STOPPER only while a list a finger flung is still moving', () => {
  const now = 10000;
  assert.equal(stopsScroll(now, now - 30, now - 400), true, 'scrolled 30 ms ago, a drag ended 0.4 s ago: a fling being stopped');
  assert.equal(stopsScroll(now, now - SCROLL_STOP_MS - 1, now - 400), false, 'the list had stopped');
  assert.equal(stopsScroll(now, now - 30, now - DRAG_MS - 1), false, 'no finger flung it (a programmatic scroll)');
  assert.equal(stopsScroll(now, now - 30, -1e9), false, 'never dragged');
  assert.equal(pressActs({ type: 'touch', dur: 80, travel: 0, stopper: true }), false, 'a stopper never acts');
  assert.equal(pressActs({ type: 'touch', dur: 80, travel: 0 }), true);
  assert.equal(cleanTap({ dur: 80, travel: 0, stopper: true }), false, 'a stopper is never rescued');
  const tw = read('js/ui/tapwatch.js');
  assert.match(tw, /stopper: stopsScroll\(performance\.now\(\), lastScroll, lastDrag\) && scrolledHolds\(el\)/, 'judged at the press, on the list it sits in');
  assert.match(tw, /disabled: disabled\(p\.act\), stopper: p\.stopper \}\)/, 'the press-act reads it');
  assert.match(tw, /if \(e\.isTrusted && stopper && tookClick\(stopper/, 'its click swallowed');
});

test('the owner\'s add-on — every SCORES list\'s slim card opens THE PLAYER PAGE through THE BOARD\'s own opener (data-press)', () => {
  const d = read('js/screens/daily.js');
  assert.equal((d.match(/h\('div\.lb-card\.dy-card', opener\(/g) || []).length, 4, 'friends today · everyone today · friends all time · everyone all time');
  assert.match(d, /function opener\(target, name\) \{[\s\S]{0,400}import\('\.\.\/profile\/player-page\.js'\)[\s\S]{0,120}m\.openPlayer\(target\)/, 'openPlayer — never a second player page');
  assert.match(d, /role: 'button', tabindex: '0', 'data-press': true/, 'press + lift; a keyboard reaches it');
});

test('the owner\'s add-on — THE FOUNDER WINDOW is switched only at the foot of /admin (the radio\'s paper gone; the server unchanged)', () => {
  assert.doesNotMatch(read('js/screens/harbor/radio-ledger.js'), /founderPaper|rd-fsw|action: 'radioFounder'/);
  assert.doesNotMatch(read('css/radio.css'), /\.rd-fsw|\.rd-founder/);
  assert.match(read('js/admin/admin.js'), /call\('radioFounder', \{ open: !f\.open \}\)/, '/admin keeps its switch');
  assert.match(read('api/_lib/radio.js'), /case 'radioFounder': \{/, 'the server action stays');
});
