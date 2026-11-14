// A SCREEN ON TOP OF THE CITY OWNS THE TOUCH (the owner's live bug, Nov 14 2026 — docs/title.md "A SCREEN ON TOP OF THE CITY"): on DAILY →
// SCORES a tap on a slim card opened PRISM DROP's game card — the city behind the DAILY screen answered it. The city listens on the WINDOW
// and used to let through every target not on a short list of classes; the DAILY screen (a body-level overlay) was not on it.
//   THE SHARED RULE  ui/layers.js#cityCovered (PURE): a layer open · the city held · a touch that began outside the city's root → not the city's
//   THE CITY ASKS IT at the down, at the tap and for the hover (title-taps.js#covered) — before any class list
// The real taps: tests/integration/e2e-daily.mjs (every SCORES card, its edges + gaps, ALL TIME, TODAY's results, a billboard's own points).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cityCovered, takeLayer, layersOpen } from '../js/ui/layers.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE SHARED RULE: a layer open, the city held, or a touch that began off the city = a screen is on top (PURE)', () => {
  assert.equal(cityCovered({ layers: 0, held: false, inCity: true }), false, 'the bare city answers its own taps');
  assert.equal(cityCovered({ layers: 1, held: false, inCity: true }), true, 'a pop-up on THE LAYER STACK — even while its element cannot be hit yet (the DAILY screen loads its sheet hidden)');
  assert.equal(cityCovered({ layers: 0, held: true, inCity: true }), true, 'the city HELD under a full-screen overlay');
  assert.equal(cityCovered({ layers: 0, held: false, inCity: false }), true, 'the touch began on another screen\'s element (an overlay fading out after it left the stack, a game\'s screen)');
  assert.equal(cityCovered({ layers: 3, held: true, inCity: false }), true);
  assert.equal(cityCovered(), false);
  // the stack's own count is the shared state (the DAILY screen takes its layer with NO element — nothing in the DOM marks it)
  const before = layersOpen(), release = takeLayer(null, { close() {} });
  assert.equal(layersOpen(), before + 1);
  assert.equal(cityCovered({ layers: layersOpen() }), true);
  release();
  assert.equal(layersOpen(), before);
});

test('THE CITY ASKS before it answers: at the DOWN, at the TAP (before any class list) and for the HOVER — one rule, no per-screen list', () => {
  const s = read('js/screens/title-taps.js');
  assert.match(s, /const covered = t => cityCovered\(\{ layers: layersOpen\(\), held, inCity: !!\(t && T\.els\.root && T\.els\.root\.contains && T\.els\.root\.contains\(t\)\) \}\);/);
  const down = s.slice(s.indexOf('function onCityDown(e) {'), s.indexOf('function onCityUp(e) {'));
  assert.match(down, /if \(covered\(e\.target\)\) \{ down = null; return; \}/, 'a touch that lands on a screen over the city is never recorded as a city touch');
  const tap = s.slice(s.indexOf('function onCityTap(e) {'), s.indexOf('// a tapped letter'));
  const iCov = tap.indexOf('if (covered(e.target)) return;'), iList = tap.indexOf("e.target.closest('button, input,"), iHit = tap.indexOf('T.scene.hit(x, y)'), iSight = tap.indexOf('T.scene.sightAt');
  assert.ok(iCov > 0 && iCov < iList && iCov < iSight && iCov < iHit, 'asked FIRST — before the class list, the sightings, the billboards, the door');
  assert.match(s, /!swallowed && !covered\(p\.t\) && !\(p\.t && p\.t\.closest && p\.t\.closest\(HOVER_UI\)\)/, 'the desktop hover (the pointer cursor + the glow) never shows through a screen');
  // the city-held signal reaches the taps without a new boot module (ui/city-hold.js tells the window)
  assert.match(s, /const onCover = e => \{ held = !!\(e && e\.detail\); \};/);
  const t = read('js/screens/title.js');
  assert.match(t, /window\.addEventListener\('vl-cover', tap\.onCover\);/);
  assert.match(t, /window\.removeEventListener\('vl-cover', tap\.onCover\);/);
  assert.match(read('js/ui/city-hold.js'), /new CustomEvent\('vl-cover', \{ detail: on \}\)/);
  assert.doesNotMatch(s, /from '\.\.\/ui\/city-hold\.js'/, 'the boot graph gains no module (THE BOOT BUDGET)');
});

test('THE DAILY SCREEN is on the stack + holds the city from the moment it opens; a SCORES card has no tap of its own (no navigation)', () => {
  const d = read('js/screens/daily.js');
  assert.match(d, /document\.body\.append\(el\);\n  const release = takeLayer\(null, \{ close: onBack \}\);[^\n]*\n  const unhold = holdCity\(\);/, 'the layer + the hold are taken as the overlay lands');
  // the slim cards' rows carry no click / tap handler (the only taps on SCORES are its buttons: the tabs, the scope, SHOW ALL, SEE THE FULL BOARD)
  const rows = d.slice(d.indexOf('function paintScores') > 0 ? d.indexOf('function paintScores') : d.indexOf("h('div.dy-scope'"), d.indexOf('/** the strips into their rows'));
  for (const m of rows.matchAll(/h\(`?li\.lb-row[^\n]*/g)) assert.doesNotMatch(m[0], /onclick|onpointer|ontouch/, 'a SCORES row is not tappable');
  assert.match(read('css/daily.css'), /\.dy-overlay \{[^}]*position: fixed; inset: 0;[^}]*background:/, 'the overlay covers its whole area (its own surface takes every touch)');
});
