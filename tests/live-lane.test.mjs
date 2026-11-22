// CITY D — 0b, THE LIVE LANE (js/ui/live-lane.js): every slim-card LIST shows baked STILLS; at most 3 strips ON SCREEN run a live effect, page-wide;
// a strip leaving the screen frees its canvas at once; no list lays a surface (a GPU canvas) over itself any more.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE LIVE LANE: the cap, the 2D canvas of its own, one start a frame, reduced = no live strip', () => {
  const L = read('js/ui/live-lane.js');
  assert.match(L, /export const CAP = 3;/);
  assert.match(L, /createSurface\(r\.el, \{ label: `lane:\$\{r\.lane\.label\}`, gpu: false \}\)/, 'a live strip = its OWN small 2D canvas, never a GPU context');
  assert.match(L, /requestAnimationFrame\(pump\)/, 'ONE live strip started a frame');
  assert.match(L, /const still = fxReduced\(\);/, 'reduced motion → the stills only');
  assert.match(L, /intersectionRatio >= 0\.5/, 'on screen = at least half the strip in view');
  assert.match(read('js/fx/renderer.js'), /noGpu: o\.gpu === false/);
});

test('THE LIVE LANE: every slim-card LIST goes through it — no surface over a list', () => {
  const lists = { 'js/screens/daily.js': 3, 'js/board/view.js': 1,   // (CITY H2: THE BOARD's foot is ONE slim line now — no card, no second lane)
    'js/profile/friends-ui.js': 3, 'js/screens/title-taps.js': 1, 'js/ui/strip-board.js': 1 };
  for (const [f, n] of Object.entries(lists)) {
    const s = read(f);
    assert.equal((s.match(/\.liveList\(/g) || []).length, n, `${f}: its lists through liveList`);
    assert.doesNotMatch(s, /K\.createSurface\(/, `${f}: no list surface`);
  }
  const g = read('js/screens/room-guests.js');
  assert.match(g, /surface = liveList\(surfHost, \{ label: 'guests' \}\);/, 'the room\'s guests');
  assert.doesNotMatch(g, /createSurface/);
  assert.match(g, /prio: fresh \? 1 : 0/, 'a joiner\'s entrance runs live first');
});

// THE BEFORE-LAUNCH PASS — REVIEW A11: a list destroyed while its strips wait in the start queue (their elements still in the page) never
// gets a canvas outside the cap — the pump starts only a strip the lane still holds
test('THE LIVE LANE: a strip forgotten while queued never starts (A11)', () => {
  const src = read('js/ui/live-lane.js');
  assert.match(src, /const r = queue\.shift\(\);\s*if \(r && recs\.get\(r\.el\) === r && live\(\)\.length < CAP\) start\(r\);/);
});
