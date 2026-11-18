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

test('THE AREA ARRIVAL: the banner\'s words, its colours (white letters ≥ 4.5 : 1 on every area\'s day board), where it shows + what wins', async () => {
  const A = await import('../js/games/jaywalk/arrival.js');
  // (the areas' colours, read from areas.js's own table — it imports three.js, so it is read, not loaded)
  const LOOKS = [...readFileSync(new URL('../js/games/jaywalk/areas.js', import.meta.url), 'utf8').matchAll(/{ id: '([a-z]+)', accent: (0x[0-9a-f]{6}), paint: (0x[0-9a-f]{6})/g)].map(m => ({ id: m[1], accent: Number(m[2]), paint: Number(m[3]) }));
  assert.equal(LOOKS.length, 8);
  assert.deepEqual(A.arrivalWords(50), { name: 'THE DOCKS', sub: 'LANE 50', index: 0 });
  assert.equal(A.arrivalWords(400).name, 'THE AIRFIELD');
  assert.deepEqual(A.arrivalWords(450), { name: 'THE DOCKS', sub: 'LAP 2 · LANE 450', index: 0 }, 'a lap: LAP 2 in the small line, the name stays big');
  assert.equal(A.arrivalWords(10), null, 'the opening has no gate');
  const lum = n => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
  for (const L of LOOKS) { const r = 1.05 / (lum(A.shade(L.paint, 0.72)) + 0.05); assert.ok(r >= 4.5, `${L.id}: white on its day board ${r.toFixed(2)} : 1`); }
  assert.equal(A.ARRIVE_MS, 2500);
  const css = readFileSync(new URL('../css/jaywalk.css', import.meta.url), 'utf8');
  assert.match(css, /\.jw-arrive \{[^}]*top: min\(calc\(env\(safe-area-inset-top\) \+ 86px\), calc\(28% - 60px\)\)/, 'under the lane count, its foot above the far haze (never over a lane) on any phone');
  assert.match(css, /\.jw-arrive\.is-on \{ visibility: visible; animation: jw-arr-neon 2\.5s linear both; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.jw-arrive\.is-on, \.jw-arrive\[data-look='day'\]\.is-on \{ animation-name: jw-arr-fade; \} \}/, 'reduced motion: a plain fade');
  for (const k of ['jw-arr-neon', 'jw-arr-sign', 'jw-arr-fade']) { const m = css.match(new RegExp(`@keyframes ${k} \{(.*)\}`)); assert.ok(m && !/box-shadow|filter|top:|left:|width|height/.test(m[1]), `${k}: transform + opacity only`); }
  const v = src('view.js');
  assert.match(v, /if \(e\.e === 'landmark'\) \{\n        if \(arriveNow\(\)\) arriveEl\.show\(e\.lane, look\);\n        if \(sndOn\)/, 'the crossing (this phone\'s own kid\'s tick) shows it, with the area-arrival sound');
  assert.match(v, /const arriveNow = \(\) => !!arriveEl && mode === 'run' && !watching && !outCard && !final && !localEnd && !shipWarn\(\) && !isOver\(run\);/, 'never over the Mothership\'s warning, the OUT card or the end');
  assert.match(v, /const shipWarn = \(\) => isMatch && !!run && run\.t >= MODES\.match\.cap - SHIP_WARN;/);
  assert.match(v, /if \(arriveEl && arriveEl\.on\(\) && !arriveNow\(\)\) arriveEl\.hide\(\);/, '… and goes at once when one of them starts');
  assert.match(src('lab.js'), /arrive\.show\(e\.lane, look\)/, 'the lab shows the same banner');
});

test('THE APPROACH SIGN: drawn again whenever it might be blank (a refused / wiped canvas, the font arriving) + darker day paint', () => {
  const n = src('night.js');
  assert.match(n, /const c = ctx2d\(G\.cv\);\n    if \(!c\) return;   \/\/ \(refused — asked again next frame\)\n    G\.text = key;/, 'marked drawn only once it was drawn');
  assert.match(n, /const offLost = onCanvasLost\(\(\) => \{ G\.text = null; \}\);/, 'a wiped canvas is drawn again');
  assert.match(n, /c\.getImageData\(512, 150, 1, 1\)\.data\[3\] === 0\) G\.text = null;/, 'a blank board found as it comes up is drawn again');
  assert.match(n, /document\.fonts\.load\('900 88px "Orbitron"'\)/);
  assert.match(n, /c\.fillStyle = css\(shade\(paint, 0\.72\)\);/, 'the day board: the area\'s paint darkened');
  assert.match(n, /offLost\(\);/, 'the subscription goes with the scene');
});

test('THE INBOX (Nov 17 6:58 pm): ONE BODY OF WATER + no white flash at a tier step / a resize', () => {
  const fx = src('night-fx.js'), w = fx.slice(fx.indexOf('// THE WATER (H4'), fx.indexOf('} else if (type < 3.5)'));
  assert.match(w, /float zw = mod\(vLane, 256\.0\) \+ z, xc = x - 0\.12 \* t;/, 'the surface runs on the world\'s z with ONE slow drift');
  assert.match(w, /vec2 q = vec2\(xc \* 0\.85, zw \* 2\.4\);/, 'the colour + ripple fields: no lane seed, no lane current');
  assert.doesNotMatch(w.slice(w.indexOf('vec2 q ='), w.indexOf('// the specks')), /seed|xf/, 'nothing lane-own in the surface');
  assert.match(w, /float shD = step\(0\.5, abs\(dn - 2\.0\)\), shU = step\(0\.5, abs\(up - 2\.0\)\);/, 'the foam + the shallows only where the water meets something that is not water');
  const n = src('night.js');
  assert.match(n, /const fit = force => \{ fitAsk = Math\.max\(fitAsk, force \? 2 : 1\); \};/, 'a resize only ASKS');
  assert.match(n, /function draw\(run, course, a, dt, o = null\) \{\n    if \(fitAsk\) \{ const f = fitAsk === 2; fitAsk = 0; fitNow\(f\); \}/, '… the next draw resizes FIRST, then renders (the canvas is never presented cleared)');
  assert.equal((n.match(/renderer\.setSize\(/g) || []).length, 1, 'ONE resize path');
  assert.match(n, /setTier\(o\.tier == null \? 2 : o\.tier\);\n  fitNow\(true\); fitAsk = 0;/);
});
