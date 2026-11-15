// FIXES R1 — THE SMALL ONES (THE REVIEW A10 / A12 / A13 / A14): the source pins. The behaviours in a browser: A12 + A13 in
// tests/integration/wk-press.mjs (WebKit, iOS's dropped click), A10 in daily-preview.html (&scope=all&pts=down after a kept visit →
// "COULDN'T UPDATE" — Downloads/NEON/fixes-r1/scores-couldnt-update-390.png).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TWIN_SEL, PRESS_IMPLICIT, GESTURE_OWN, pressControl, gestureControl } from '../js/ui/tapwatch.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('A12 — a new press ends the last press-act\'s swallow window (took = null at the top of onDown)', () => {
  const t = read('js/ui/tapwatch.js');
  assert.match(t, /function onDown\(e\) \{[\s\S]{0,400}if \(e\.isPrimary !== false\) took = null;\s*try \{/);
});

test('A13 — the twin at the lift is found by every press rule: data-press, the implicit buttons AND the gesture controls', () => {
  assert.equal(TWIN_SEL, `[data-press], ${PRESS_IMPLICIT}, ${GESTURE_OWN}`);
  const t = read('js/ui/tapwatch.js');
  assert.match(t, /c = at && at\.closest && at\.closest\(TWIN_SEL\), tw = c && \(pressControl\(c, p\.game\) \|\| gestureControl\(c, p\.type\)\)/);
  assert.equal(typeof pressControl, 'function'); assert.equal(typeof gestureControl, 'function');
});

test('A10 — SCORES: a refresh that failed over a kept list says COULDN\'T UPDATE (today, all time, each board); a fresh answer clears it', () => {
  const d = read('js/screens/daily.js');
  assert.match(d, /const upd = \(on, failed = false\) => \(on \? h\('span\.dy-upd', ' · UPDATING…'\) : failed \? h\('span\.dy-upd\.is-failed', ' · COULDN’T UPDATE'\) : null\);/);
  assert.match(d, /\.catch\(\(\) => \{ if \(ev && evCached\) \{ evCached = false; evFailed = true; rev\+\+; \}/, 'today');
  assert.match(d, /\.catch\(\(\) => \{ if \(pts && ptsCached\) \{ ptsCached = false; ptsFailed = true; rev\+\+; \}/, 'all time');
  assert.match(d, /else if \(everyCached\.has\(board\)\) everyFailed\.add\(board\); everyCached\.delete\(board\); rev\+\+; \}\)/, 'a board');
  assert.match(d, /upd\(evCached, evFailed\)/); assert.match(d, /upd\(everyCached\.has\(board\) \|\| ptsCached, everyFailed\.has\(board\) \|\| ptsFailed\)/);
  assert.match(d, /evCached = false; evFailed = false; rev\+\+;/, 'a fresh answer clears it');
});

test('A14 — the add-me link is removed only once the server ANSWERED; no answer (status 0) keeps it', () => {
  const t = read('js/screens/title.js'), f = read('js/profile/friends-ui.js');
  const at = t.indexOf('function addLinkSoon()'), body = t.slice(at, t.indexOf('\n  }', at));
  assert.ok(!/localStorage\.removeItem\('ns:fr:addme'\);[\s\S]*openAddLink/.test(body), 'never removed BEFORE the fetch');
  assert.match(body, /m\.openAddLink\(code\)\)\s*\.then\(\(\) => \{ try \{ localStorage\.removeItem\('ns:fr:addme'\); \}/);
  assert.match(f, /catch \(e\) \{ toast\(why\(e\), 'warn'\); if \(!e \|\| !e\.status\) throw e; return null; \}/);
});
