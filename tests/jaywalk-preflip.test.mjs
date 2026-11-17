// JAYWALK — BEFORE THE FLIP (docs/games/passes/jaywalk-preflip.md; the owner's decisions: docs/games/plan.md "JAYWALK … BEFORE THE FLIP"):
//   · THE CAMERA + THE TAKES ARE PINNED: the game draws ZOOM 8 · STRAIGHT and plays the owner's takes whatever the lab saved on the phone
//   · THE LOST CONTEXT: a deliberate teardown is never heard as a lost context (the listeners come off before any destroy())
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = f => readFileSync(new URL(`../js/games/jaywalk/${f}`, import.meta.url), 'utf8');
// (a phone's own storage — the lab's odd picks saved on it)
const store = new Map();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) } });

test('THE TAKES ARE PINNED: the game plays take A for every A / B sound whatever the lab saved; only the lab plays its own picks', async () => {
  const S = await import('../js/games/jaywalk/sfx.js');
  const ab = S.SOUNDS.filter(s => s.b).map(s => s.id);
  assert.ok(ab.length >= 3, `the sounds with a B take: ${ab.join(', ')}`);
  for (const id of ab) store.set(`jw:lab:snd:${id}`, 'b');
  for (const id of ab) assert.equal(S.pick(id), 'a', `${id}: the game plays A though the lab saved B`);
  assert.match(S.picksLine(), /hop A/);
  S.useLabPicks(true);
  for (const id of ab) assert.equal(S.pick(id), 'b', `${id}: the lab plays this phone's audition pick`);
  S.useLabPicks(false);
  assert.equal(S.pick('hop'), 'a');
  assert.ok(!S.SOUNDS.find(s => s.id === 'new-best').b && !S.SOUNDS.find(s => s.id === 'area-arrive').b && !S.SOUNDS.find(s => s.id === 'train-bell').b,
    'NEW BEST (its B recording), THE AREA ARRIVAL (the sparkle) + the train (set B) are single files: nothing to pick');
  assert.match(src('lab.js'), /S\.useLabPicks\(true\); S\.fetchSounds\(\);/, 'the lab page switches its own picks on');
  assert.match(src('audition.js'), /useLabPicks\(true\);/, '… and so does THE SOUND AUDITION');
  for (const f of ['view.js', 'victory.js', 'index.js', 'night.js']) assert.doesNotMatch(src(f), /useLabPicks/, `${f}: the game never switches the lab's picks on`);
});

test('THE CAMERA IS PINNED: ZOOM 8 · STRAIGHT for everyone — the game never reads the lab\'s zoom / angle', async () => {
  const C = await import('../js/games/jaywalk/camera.js');
  assert.equal(C.ZOOM, 8); assert.equal(C.ANGLE, 'straight');
  const v = src('view.js');
  assert.match(v, /createNight\(play, \{ kidColor: colorHex\(me\.color\), zoom: ZOOM, angle: ANGLE, tier: tierMem\(\)/, 'the game\'s scene: ZOOM + ANGLE straight from camera.js');
  assert.doesNotMatch(v, /getPref\('(zoom|angle|look)'/, 'no lab zoom / angle / look read');
  assert.doesNotMatch(v, /ZOOMS|ANGLES/, 'no lab list to pick from');
  // (the lost context's rebuild keeps the scene's own — pinned — zoom + angle)
  assert.match(v, /zoom: night\.zoom\(\), angle: night\.angle\(\)/);
});

test('THE LOST CONTEXT: a deliberate teardown is never reported or rebuilt (the listeners off BEFORE any destroy)', () => {
  const v = src('view.js');
  assert.match(v, /unmount\(\) \{\n      gone = true; cancelAnimationFrame\(raf\); clearTimeout\(goTimer\);\n      if \(offGL\) offGL\(\);/, 'unmount: the listeners off first');
  assert.ok(v.indexOf('if (offGL) offGL();   // (the dead scene') < v.indexOf('try { night.destroy(); } catch { /* its context is gone */ }'), 'remake: off before the dead scene\'s destroy');
  assert.match(v, /if \(gone \|\| night !== mine\) return;   \/\/ \(our own teardown — never a report, never a rebuild\)/);
  assert.match(v, /offGL = \(\) => \{ offGL = null; clearTimeout\(t\); cv\.removeEventListener\('webglcontextlost', lost\); cv\.removeEventListener\('webglcontextrestored', remake\); \};/);
  assert.match(src('night.js'), /renderer\.forceContextLoss\(\); \} catch \{ \/\* fine \*\/ \}\n      el\.width = 0; el\.height = 0;/, 'destroy(): the 3D canvas freed at once');
});
