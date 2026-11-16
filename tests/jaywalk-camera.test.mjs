// JAYWALK H2B — THE CAMERA (js/games/jaywalk/camera.js — docs/jaywalk.md "THE CAMERA"): ONE camera for the night look + the graybox, PURE
// MATH: ZOOM 7 · 8 · 9 columns across on every screen shape, the kid ≈ 62 % down, 3–4 lanes seen behind him, the sideways follow (clamped
// ~1 column past the play edge, a log ride without lag), the slight TURN about the kid; + THE AUTOMATIC TIER STEP on the kit's rule (a slow
// phone steps down, a GPU-bound one too, a 30 Hz cap does not). (The browser half: tests/integration/jaywalk-lab.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CAM, ZOOMS, ZOOM, ANGLES, ANGLE, TURN_DEG, PAST_EDGE, EASE_MS, lensFor, followLimit, createCamera } from '../js/games/jaywalk/camera.js';
import { COLS } from '../js/games/jaywalk/tuning.js';
import { createTiers } from '../js/games/kit/tiers.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = a => { const l = Math.hypot(...a); return a.map(v => v / l); };
/** a stand-in for a three.js perspective camera: position.set + lookAt, and a projection to NDC (x, y: −1 … 1) */
function fakeCam(aspect, fov) {
  const c = { pos: [0, 0, 0], at: [0, 0, -1], position: { set(x, y, z) { c.pos = [x, y, z]; } }, lookAt(x, y, z) { c.at = [x, y, z]; } };
  c.project = p => {
    const f = norm(sub(c.at, c.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), d = sub(p, c.pos), T = Math.tan(fov * Math.PI / 360);
    return [dot(d, r) / dot(d, f) / (T * aspect), dot(d, u) / dot(d, f) / T, dot(d, f)];
  };
  return c;
}
/** a camera settled on a kid at column cell `x`, lane `y` (+ 0.5) */
function settled(zoom, angle, aspect, x = 4.5, y = 10.5) {
  const rig = createCamera({ zoom, angle }), cam = fakeCam(aspect, rig.fit(aspect));
  rig.follow(x, y, 16.7); for (let i = 0; i < 200; i++) rig.follow(x, y, 16.7);
  rig.apply(cam);
  return { rig, cam, kid: cam.project([x - COLS / 2, 0, -y]) };
}

test('THE CAMERA\'s numbers: ZOOM 7 · 8 · 9 (default 8), ANGLE straight · turned (default STRAIGHT — H3, the pick so far), ONE tuned turn, the proven rig', () => {
  assert.deepEqual([...ZOOMS], [7, 8, 9]); assert.equal(ZOOM, 8);
  assert.deepEqual([...ANGLES], ['straight', 'turned']); assert.equal(ANGLE, 'straight');
  assert.ok(TURN_DEG >= 10 && TURN_DEG <= 15, `the turn: ${TURN_DEG}° (a slight yaw)`);
  assert.deepEqual({ ...CAM }, { fov: 54, up: 16, back: 12, width: 9.42, kidAt: 0.62 }, 'H1\'s proven rig (16 up / 12 back), the kid 62 % down');
  assert.equal(PAST_EDGE, 1);
  const c = createCamera();
  assert.equal(c.zoom(), 8); assert.equal(c.angle(), 'straight'); assert.equal(c.yaw(), 0);
  assert.ok(Math.abs(createCamera({ angle: 'turned' }).yaw() - TURN_DEG * Math.PI / 180) < 1e-9, 'TURNED is still one switch away');
  assert.equal(createCamera({ zoom: 11, angle: 'sideways' }).zoom(), 8, 'a bad value = the default');
  assert.ok(Math.abs(lensFor(390 / 844).fov - 54.4) < 0.2, `fov ${lensFor(390 / 844).fov.toFixed(2)} on a 390 × 844 phone`);
});

test('ZOOM = the columns ACROSS THE SCREEN at the kid\'s row on EVERY screen shape; the kid 62 % down; 3–4 lanes seen behind him', () => {
  for (const aspect of [390 / 844, 402 / 874, 430 / 932, 390 / 664, 0.62, 0.42]) for (const zoom of ZOOMS) for (const angle of ANGLES) {
    const { cam, kid } = settled(zoom, angle, aspect);
    assert.ok(Math.abs(kid[0]) < 1e-6 && Math.abs((1 - kid[1]) / 2 - CAM.kidAt) < 0.002, `${zoom} ${angle} @${aspect.toFixed(3)}: the kid centred, ${((1 - kid[1]) / 2 * 100).toFixed(1)} % down`);
    // (the width across at his depth: a unit along the screen's own horizontal through him)
    const yaw = angle === 'turned' ? TURN_DEG * Math.PI / 180 : 0, e = cam.project([Math.cos(yaw), 0, -10.5 - Math.sin(yaw)]);
    assert.ok(Math.abs(2 / (e[0] - kid[0]) - zoom) < 0.02, `${zoom} ${angle} @${aspect.toFixed(3)}: ${(2 / (e[0] - kid[0])).toFixed(3)} columns across`);
  }
  // 390 × 844: the lanes behind him whose MIDDLE is above the foot's fade (83 % down) — and to the screen's very edge
  for (const zoom of ZOOMS) {
    const { cam } = settled(zoom, 'turned', 390 / 844);
    const down = k => (1 - cam.project([0, 0, -10.5 + k])[1]) / 2;
    let clear = 0, all = 0;
    for (let k = 1; k < 12; k++) { if (down(k) <= 0.83) clear = k; if (down(k) <= 1) all = k; }
    assert.ok(clear >= 3 && clear <= 4, `ZOOM ${zoom}: ${clear} lanes clear behind the kid (3–4)`);
    assert.ok(all >= clear + 1 && all <= 7, `ZOOM ${zoom}: ${all} to the screen's foot`);
  }
});

test('THE SIDEWAYS FOLLOW: eases to the kid, clamped ~1 column past the play edge; a log ride is followed with a steady small lag; a far jump snaps', () => {
  assert.deepEqual(ZOOMS.map(followLimit), [2, 1.5, 1], 'the view\'s edge stops one column past the play area\'s');
  for (const zoom of ZOOMS) for (const [x, side] of [[0.5, -1], [8.5, 1]]) {
    const { rig, cam, kid } = settled(zoom, 'straight', 390 / 844, x);
    assert.ok(Math.abs(rig.x() - side * followLimit(zoom)) < 1e-3, `ZOOM ${zoom}: the follow stops at ${rig.x().toFixed(2)}`);
    assert.ok(Math.abs(kid[0]) < 0.9, `… the kid still on screen at the play edge (${kid[0].toFixed(2)})`);
    const past = cam.project([side * (COLS / 2 + PAST_EDGE), 0, -10.5])[0];
    assert.ok(Math.abs(past - side) < 0.02, `… exactly ${PAST_EDGE} column past the edge at the screen's side (${past.toFixed(3)})`);
  }
  // an ease: never past its target, done in well under half a second
  const rig = createCamera({ zoom: 8, angle: 'straight' });
  rig.follow(4.5, 3.5, 16.7);
  let prev = rig.x(), t = 0;
  for (; t < 500 && rig.x() < 0.9; t += 16.7) { rig.follow(5.5, 3.5, 16.7); assert.ok(rig.x() >= prev && rig.x() <= 1 + 1e-9); prev = rig.x(); }
  assert.ok(t > 100 && t < 450, `one column sideways: nine tenths there in ${t.toFixed(0)} ms (smooth, not a cut)`);
  // a log ride at 2 columns a second: the lag settles at v × the ease (no jitter: the same every frame)
  const ride = createCamera({ zoom: 7, angle: 'turned' });
  ride.follow(3, 3.5, 16.7);
  const lags = [];
  for (let i = 1; i <= 60; i++) { const x = 3 + i * 2 / 60; ride.follow(x, 3.5, 1000 / 60); lags.push(x - COLS / 2 - ride.x()); }
  const tail = lags.slice(-10);
  assert.ok(Math.max(...tail) < 2 * EASE_MS.x / 1000 + 0.02 && Math.max(...tail) - Math.min(...tail) < 0.01, `a log ride: the camera ${Math.max(...tail).toFixed(2)} columns behind, steady`);
  const jump = createCamera();
  jump.follow(4.5, 3.5, 16.7); jump.follow(4.5, 300.5, 16.7);
  assert.equal(jump.y(), 300.5, 'a far jump (a respawn, a warp) snaps — no long pan');
});

test('THE TURN: a yaw about the kid — he stays put on the screen, the lanes run on a gentle diagonal, "up the course" still runs up; a switch eases', () => {
  const a = settled(8, 'straight', 390 / 844), b = settled(8, 'turned', 390 / 844);
  assert.ok(Math.abs(a.kid[0] - b.kid[0]) < 1e-6 && Math.abs(a.kid[1] - b.kid[1]) < 1e-6, 'the kid in the same place, straight or turned');
  const lane = (c, x) => c.cam.project([x, 0, -10.5]);
  assert.ok(Math.abs(lane(a, 3)[1] - lane(a, -3)[1]) < 1e-6, 'straight: a lane is level');
  const slope = Math.atan2((lane(b, 3)[1] - lane(b, -3)[1]) * 844 / 390, lane(b, 3)[0] - lane(b, -3)[0]) * 180 / Math.PI;
  assert.ok(Math.abs(slope) > 5 && Math.abs(slope) < 15, `turned: the lanes run ${slope.toFixed(1)}° off level`);
  const ahead = b.cam.project([0, 0, -13.5]), side = b.cam.project([1, 0, -10.5]);
  assert.ok(ahead[1] > b.kid[1] && Math.abs(ahead[0] - b.kid[0]) < ahead[1] - b.kid[1], 'a lane ahead is UP the screen (more up than sideways): a swipe up is still "forward"');
  assert.ok(side[0] > b.kid[0] && Math.abs(side[1] - b.kid[1]) < side[0] - b.kid[0], 'a column to the right is RIGHT on the screen: swipes stay screen-relative');
  const rig = createCamera({ zoom: 8, angle: 'straight' });
  rig.follow(4.5, 3.5, 16.7); rig.choose(7, 'turned');
  rig.follow(4.5, 3.5, 16.7);
  assert.ok(rig.yaw() > 0 && rig.yaw() < TURN_DEG * Math.PI / 180 && rig.k() < 8 / CAM.width && rig.k() > 7 / CAM.width, 'a ZOOM / ANGLE change eases in');
  for (let i = 0; i < 120; i++) rig.follow(4.5, 3.5, 16.7);
  assert.equal(rig.k(), 7 / CAM.width); assert.equal(rig.yaw(), TURN_DEG * Math.PI / 180);
  rig.choose(9, 'straight', true);
  assert.equal(rig.k(), 9 / CAM.width, '`snap` = at once'); assert.equal(rig.yaw(), 0);
});

test('ONE CAMERA, PURE: no three.js, no DOM, no clock; both views use it; the rules never know it; the lab\'s switches', () => {
  const c = code('camera.js');
  assert.doesNotMatch(c, /from 'three'|document\.|window\.|performance\.|Date\.now|requestAnimationFrame|localStorage|fetch\(/);
  assert.match(c, /^import \{ COLS \} from '\.\/tuning\.js';$/m, 'its only import: the play area\'s width');
  for (const f of ['night.js', 'graybox.js']) {
    const s = code(f);
    assert.match(s, /import \{ CAM, createCamera \} from '\.\/camera\.js';/, `${f}: the shared camera`);
    assert.match(s, /const rig = createCamera\(\{ zoom: o\.zoom, angle: o\.angle(, hero: o\.hero)? \}\);/); assert.match(s, /cam\.fov = rig\.fit\(w \/ h\);/);
    assert.match(s, /rig\.apply\(cam/); assert.match(s, /setCamera\(zoom, angle, snap\) \{ rig\.choose\(zoom, angle, snap\); \}/);
    assert.doesNotMatch(s, /export const CAM|WIDTHS|setCols|cam\.lookAt\(/, `${f}: no camera of its own`);
  }
  for (const f of ['engine.js', 'course.js', 'replay.js', 'tuning.js', 'logic.js', 'director.js', 'controls.js']) assert.doesNotMatch(code(f), /camera/, `${f} never knows the camera (swipes stay screen-relative)`);
  const lab = code('lab.js'), css = read('css/jaywalk.css');
  assert.match(lab, /import \{ ZOOMS, ZOOM, ANGLES, ANGLE \} from '\.\/camera\.js';/);
  assert.match(lab, /setPref\('zoom', z\); setPref\('angle', a\); view\.setCamera\(z, a, snap\);/, 'remembered on the phone');
  assert.match(lab, /h\('span\.jw-bar-k', 'ZOOM'\), \.\.\.zooms\), h\('div\.jw-tabs', \.\.\.angles\)\)/);
  assert.doesNotMatch(lab, /WIDTH|setCols|'cols'/, 'the WIDTH 9 · 11 switch is retired');
  assert.match(css, /\.jw-ang \{/); for (const line of css.split('\n').filter(l => /^\.jw-(bar|tab|tabs|ang|w|new)\b/.test(l))) assert.doesNotMatch(line, /border-radius/, `neon-underline tabs — no pills (${line.slice(0, 30)})`);
  for (const x of css.matchAll(/border-radius: ([^;}]+)[;}]/g)) assert.match(x[1].trim(), /^(\d|1[0-2])px$|^50%$/, `no pills anywhere in the sheet (H4: the match's tags + order, the end screen's 10 px tubes): ${x[1]}`);
});

test('THE AUTOMATIC TIER STEP (the match kit\'s rule, as the lab runs it): slipping frames step down by themselves — a GPU-bound phone too; a 30 Hz cap ends back at the top', () => {
  const run = (frameMs, workMs, seconds) => {
    const T = createTiers({ initial: 2, max: 2 });
    let now = 0;
    const seen = [2];
    for (; now < seconds * 1000;) { now += frameMs(T.get()); T.sample(now, workMs(T.get())); T.tick(now); if (T.get() !== seen[seen.length - 1]) seen.push(T.get()); }
    return { end: T.get(), capped: T.capped(), seen };
  };
  // a phone whose GPU can't hold tier 2 or 1 (held to the display's beat: 33 ms at both, light CPU work) — tier 0 runs at 60
  const gpu = run(t => (t === 0 ? 16.7 : 33.3), () => 3, 40);
  assert.deepEqual(gpu.seen, [2, 1, 0], 'it walks down to the tier that IS faster'); assert.equal(gpu.end, 0); assert.equal(gpu.capped, false);
  // a phone one step helps (the sharpness + the bloom were the cost)
  const one = run(t => (t === 2 ? 24 : 16.7), () => 4, 40);
  assert.equal(one.end, 1, `one step down and it stays (${one.seen.join(' → ')})`);
  // a slow CPU: the work itself is the cost at every tier → down to the bottom, and it stays there
  const cpu = run(() => 33.3, () => 28, 40);
  assert.equal(cpu.end, 0, `a slow CPU ends at tier 0 (${cpu.seen.join(' → ')})`);
  // iOS Low Power Mode: 30 Hz whatever is drawn, light work → no tier is faster: back at the top (the kit's PD6)
  const cap = run(() => 33.3, () => 1.5, 40);
  assert.equal(cap.end, 2, `a true 30 Hz cap ends at the top (${cap.seen.join(' → ')})`); assert.equal(cap.capped, true);
  // ONE long frame (a screenshot, a restart — H2's shots read "worst 250" at tier 2) is not a slow phone: no step
  let k = 0;
  const hitch = run(() => (++k % 120 === 0 ? 250 : 16.7), () => 2, 30);
  assert.deepEqual(hitch.seen, [2], 'a single 250 ms frame in every 120 never steps a tier (the rule reads the p75)');
  const lab = code('lab.js');
  assert.match(lab, /tiers\.sample\(now, performance\.now\(\) - t0\); if \(pin == null && !GRAY\) tiers\.tick\(now\);/, 'the lab samples every drawn frame + ticks the rule unless a tier is pinned');
  assert.match(lab, /if \(document\.visibilityState === 'hidden' \|\| sheetOpen\) return;/, '… and never samples a hidden page or a held run');
});
