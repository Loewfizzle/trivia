// JAYWALK SMOOTH 4 — WARM START (docs/jaywalk.md "SMOOTH 4"): every load + warm-up on the STILL screen, never spread over the first seconds of play;
// the first tap is never held. The measure: `jaywalk-lab.mjs --smooth=warm[:reps:rate] [--webkit]` (kit/jaywalk-warm.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('THE STILL SCREEN: the opening + the first area + the next one, in big chunks, wanted before the first link hold ends', async () => {
  const { STILL, PUMP, areaWants } = await import('../js/games/jaywalk/variety.js');
  const { areaIndex } = await import('../js/games/jaywalk/tuning.js');
  assert.deepEqual([...STILL.areas], [-1, 0, 1]);
  assert.deepEqual([areaIndex(0), areaIndex(50), areaIndex(100)], [-1, 0, 1]);   // (the opening · THE DOCKS · the one after: the start's three)
  assert.ok(STILL.chunk > PUMP.budget * 2, 'a still frame takes many steps');
  for (const a of STILL.areas) assert.ok(areaWants(a).length > 0, `area ${a} has models to load`);
  const night = read('js/games/jaywalk/night.js');
  assert.match(night, /const still = run\.t === 0;/);
  assert.match(night, /while \(performance\.now\(\) - t1 < STILL\.chunk && \(VL\.pump\(0\) \|\| \(PR && PR\.pump\(0\)\)\)\) n\+\+;/);
  assert.match(night, /warmHeld\+\+; if \(still\) stillPump\(\); return;/);           // (it loads while the picture holds for the links)
  assert.match(night, /if \(still\) stillPump\(\);\n\s+else \{ const busy = /);         // (in play: one small step a frame, as before)
  assert.match(night, /\[\.\.\.STILL\.areas, a0, a1, a2\]/);                           // (the start's areas stay in: PLAY AGAIN never loads them in play)
  assert.match(night, /if \(n\) stillGot \+= n; else if \(stillGot\) \{ stillGot = 0; needWarm = true; \}/);   // (all in → one more warm behind the start)
  assert.match(night, /stillWinter !== winterT/);                                      // (winter's trucks join the start's ask)
});

test('THE FIRST TAP IS NEVER HELD: the run starts at the tap; links still in flight finish in the background', () => {
  const night = read('js/games/jaywalk/night.js'), view = read('js/games/jaywalk/view.js'), lab = read('js/games/jaywalk/lab.js');
  assert.match(view, /function begin\(d\) \{\n\s+if \(!waitTap \|\| gone\) return;\n\s+waitTap = false; hideStart\(\);/);
  assert.doesNotMatch(view, /startAsk/);
  assert.match(lab, /if \(!started\) \{ if \(queue\.length \|\| bot\) \{ started = true;/);
  assert.match(night, /warmQ = null; if \(calm\) warmStage = 1; else warmLater = true; \}/);
  assert.match(night, /if \(warmStage\) \{ if \(calm\) warmStep\(\); else \{ warmStage = 0; warmLater = true; \} \}/);
  assert.doesNotMatch(night, /warmCalm/);
  assert.doesNotMatch(night, /function warmStep\(calm\)/);   // (no full paint at the first hop any more)
});

test('THE DAILY\'s veiled start draws every frame while it warms + loads, then twice a second', () => {
  const view = read('js/games/jaywalk/view.js');
  assert.match(view, /const VEIL_WARM = 3000;/);
  assert.match(view, /if \(now - veilAt < 500 && performance\.now\(\) - veilFrom > VEIL_WARM && !\(night\.stillBusy && night\.stillBusy\(\)\)\) return;/);
  assert.match(read('js/games/jaywalk/night.js'), /stillBusy: \(\) => stillGot > 0 \|\| !!warmQ \|\| warmStage > 0,/);
});

test('A CONTEXT THAT DID NOT START is asked again (GL_TRIES), never a dead match screen; the line only after the last try', () => {
  const view = read('js/games/jaywalk/view.js');
  assert.match(view, /const GL_TRIES = 4, GL_AGAIN_MS = 600;/);
  assert.match(view, /if \(\+\+glTries < GL_TRIES\) setTimeout\(\(\) => \{ if \(gone \|\| night\) return;[^\n]*this\.mount\(el, st\); \}, GL_AGAIN_MS\);/);
  assert.match(view, /if \(glTries \+ 1 >= GL_TRIES\) root\.append\(h\('p\.jw-nogl'/);
  assert.match(view, /console\.warn\(`game view: jaywalk — the WebGL context did not start/);   // ("game view" = the E2E harness's warn pattern: a red says so)
});
