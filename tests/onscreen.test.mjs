// LOAD FIX 4 — TIME ON SCREEN (Grok's boot audit #1 + #6): the boot's waits count the time the page is VISIBLE (js/ui/onscreen.js — ONE
// clock): THE REJOIN LIMIT (app.js), the boot screen's hold + the wait for the city's module (app.js), the title's safety reveal
// (title.js), the scene's reveal gates (REVEAL_MAX, WX_WAIT, FONT_WAIT, the rects' wait — harbor/scene.js). The WebKit proofs:
// tests/integration/wk-hidden.mjs (hidden 5 s / 30 s mid-bake) + the harbor load group's THE REJOIN LIMIT.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onScreenWait, onScreenSince, onScreenNow } from '../js/ui/onscreen.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('the clock: a wait resolves after its time on screen; a stopwatch counts up', async () => {
  const t = performance.now(), sw = onScreenSince();
  await onScreenWait(40);
  assert.ok(performance.now() - t >= 39, 'not early');
  assert.ok(sw() >= 39 && onScreenNow() > 0);
});

test("the boot's gates are on the ON-SCREEN clock — none on the wall clock", () => {
  const scene = read('js/screens/harbor/scene.js');
  const reveal = scene.slice(scene.indexOf('function tryReveal(now)'), scene.indexOf('function fontsReady(now)') + 600);
  assert.match(reveal, /const on = up\(\);/);
  assert.doesNotMatch(reveal, /now - t0 [<>]/, 'tryReveal + fontsReady compare no wall-clock age with a gate');
  for (const g of ['REVEAL_MAX', 'WX_WAIT', 'FONT_WAIT']) assert.match(reveal, new RegExp(`(on|up\\(\\)) [<>] ${g}`), `${g} on the on-screen clock`);
  assert.match(scene, /!S\.textRects && up\(\) < 1200/);
  const title = read('js/screens/title.js');
  assert.match(title, /onScreenWait\(7500\)\.then\(reveal\)/);
  assert.doesNotMatch(title, /setTimeout\(reveal, 7500\)/);
  const app = read('js/app.js');
  assert.match(app, /Promise\.race\(\[cityShown\(\), onScreenWait\(9000\)\]\)/);
  assert.match(app, /Promise\.race\(\[harborReady, onScreenWait\(30000\)\]\)/);
  assert.match(app, /Promise\.race\(\[uplink, onScreenWait\(UPLINK_WAIT_MS\)\]\)/, 'THE REJOIN LIMIT');
});
