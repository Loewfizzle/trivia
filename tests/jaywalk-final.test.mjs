// JAYWALK FINAL (Nov 24 2026 — docs/games/passes/jaywalk-final.md): Grok's fixes · THE FIRST-TAP HOLD · THE LOAD SNAP · VEHICLE DIRECTIONS
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { uploadRange } from '../js/games/jaywalk/gl-upload.js';

const src = f => readFileSync(new URL(`../js/games/jaywalk/${f}`, import.meta.url), 'utf8');
/** a stand-in for three r160's BufferAttribute: its kept `_updateRange` record; `needsUpdate = true` bumps its version (what makes the renderer upload) */
const attr = () => ({ version: 0, _updateRange: { offset: 0, count: -1 }, set needsUpdate(v) { if (v) this.version++; } });

test('GROUP 1 — EMPTY UPLOADS: an empty kind does not bump its attribute version (nothing goes to the GPU)', () => {
  const a = attr(), u = a._updateRange;
  uploadRange(a, 0); uploadRange(a, -3);
  assert.equal(a.version, 0, 'no upload asked for an empty kind');
  assert.equal(u.count, -1, '… and its range untouched');
  uploadRange(a, 48);
  assert.equal(a.version, 1);
  assert.equal(a._updateRange, u, 'the SAME kept record (never a new one)');
  assert.deepEqual([u.offset, u.count], [0, 48], 'only the instances in use');
});

test('GROUP 1 — ZERO GARBAGE (the owner\'s add-on): uploadRange makes no object — never addUpdateRange / clearUpdateRanges (a record each call, every frame)', () => {
  const g = readFileSync(new URL('../js/games/jaywalk/gl-upload.js', import.meta.url), 'utf8');
  const noComments = t => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const code = noComments(g), fn = code.slice(code.indexOf('export const uploadRange'));
  assert.doesNotMatch(fn, /addUpdateRange|clearUpdateRanges|updateRanges/, 'three\'s allocating range calls');
  assert.doesNotMatch(fn.slice(fn.indexOf('=>') + 2), /=>|\bnew\b|\[|\.\.\.|`|push\(|\{\s*\w+\s*:/, 'no closure, list, spread, string or record inside');
  for (const f of ['night.js', 'night-fx.js']) assert.doesNotMatch(noComments(src(f)), /addUpdateRange|clearUpdateRanges/, `${f}: no allocating range call`);
  // and running it: the same kept record, 200,000 calls (a phone's hour of one kind's frames), the heap does not climb by a record a call
  const a = attr(), before = process.memoryUsage().heapUsed;
  for (let k = 0; k < 200000; k++) uploadRange(a, (k % 7) * 16);
  assert.ok(process.memoryUsage().heapUsed - before < 2 * 1024 * 1024, 'no garbage per call');
});

test('GROUP 1 — the kinds: an empty kind is hidden + uploads nothing; only the emptiness it hid is shown again', () => {
  const n = src('night.js'), done = /done\(\) \{\n([\s\S]*?)\n      \},/.exec(n);
  assert.ok(done, 'kind().done() found');
  const body = done[1];
  assert.match(body, /if \(i > 0\) \{ if \(hid\) \{ hid = false; m\.visible = true; \} upRange\(m\.instanceMatrix, i \* 16\); upRange\(m\.instanceColor, i \* 3\); if \(ax\) upRange\(ax, i \* aux\[1\]\); \}/);
  assert.match(body, /else if \(m\.visible\) \{ hid = true; m\.visible = false; \}/);
  assert.ok(n.includes('const upRange = uploadRange;') && !n.includes('a._updateRange'), 'no more three\'s deprecated _updateRange (it reset to −1: a whole-array upload)');
  assert.ok(src('night-fx.js').includes('done(c) { g.instanceCount = c; uploadRange(aL, c); uploadRange(aK, c * 4); uploadRange(aS, c * 3); }'), 'the ground sends only the lanes laid');
});

test('GROUP 1 — THE FOG EARLY-OUT: pure fog + the day fog bank skip the ground work; the night blackout is unchanged', () => {
  const f = src('night-fx.js'), main = f.slice(f.indexOf('void main() {\n  // (JAYWALK FINAL'));
  const lines = main.split('\n').slice(0, 8).join('\n');
  assert.match(lines, /if \(vFog > 0\.9999\) \{ gl_FragColor = vec4\(uFogCol, 1\.0\); return; \}/);
  assert.match(lines, /if \(uDay > 0\.5 && uWall - \(vLane \+ vP\.y\) > 3\.4\) \{ gl_FragColor = vec4\(mix\(uFogBank \* 0\.98, uFogCol, vFog\), 1\.0\); return; \}/);
  assert.ok(f.includes('if (d > 3.4) c = uFogBank * 0.98;') && f.includes('if (d > 1.5) c = vec3(0.012, 0.016, 0.03) + c * 0.05;'), 'the bank + the blackout as they were further down');
});

test('GROUP 1 — THE BLOOM SPLIT: the glow\'s offscreen passes before the main picture, its add right after', () => {
  const n = src('night.js'), at = n.indexOf('const bloomNow = bloom && !day ? bloom : null;');
  assert.ok(at > 0);
  const seg = n.slice(at, at + 220);
  assert.ok(seg.indexOf('bloomNow.prepare(scene, cam)') < seg.indexOf('renderer.render(scene, cam)') && seg.indexOf('renderer.render(scene, cam)') < seg.indexOf('bloomNow.composite()'));
  const fx = src('night-fx.js');
  assert.ok(fx.includes('render(scene, cam) { this.prepare(scene, cam); this.composite(); }'), 'the warm-up still draws the whole glow at once');
});

test('GROUP 2 — THE FIRST-TAP HOLD: the stamp at the tap, the GO behind the warm-up; silent ≤ 0.5 s, GETTING READY past it, 2.5 s at most', async () => {
  const n = src('night.js'), v = src('view.js'), l = src('lab.js');
  assert.match(n, /export const START_HOLD_MS = 500, START_HOLD_MAX = 2500;/);
  assert.match(n, /startBusy: \(loads = true\) => \(needWarm && !!\(w && h\)\) \|\| warmLater \|\| \(loads && stillGot > 0\) \|\| !!warmQ \|\| warmStage > 0,/);
  // THE STAMP: still the first write, started at the tap (askGo runs from begin → sync); only the GO waits for the gate
  assert.ok(v.includes("Promise.all([stampT0(treePath(), 'jaywalk'), startGate()]).then(() => {") && v.includes('return dbSet(dbRef(path), serverTimestamp()); })'), 'the GO after the stamp AND the gate');
  assert.ok(/waitTap = false; hideStart\(\); tapAt = performance\.now\(\);/.test(v), 'the tap is remembered at the tap');
  assert.ok(/el >= START_HOLD_MAX/.test(v) && /night\.startBusy\(el < START_HOLD_MS\)/.test(v) && v.includes("'GETTING READY…'"), 'the game: the loaders only inside 0.5 s, a link past it holds on with a quiet line, 2.5 s at most');
  assert.ok(/view\.startBusy\(el < START_HOLD_MS\) && el < START_HOLD_MAX/.test(l) && l.includes("mark.textContent = 'GETTING READY…'"), 'the lab the same');
  // GO within the stamp's 5 s: the longest hold + the GO's own wait stay inside it
  const { GO_WINDOW_MS } = await import('../js/core/proof.js');
  assert.ok(2500 < GO_WINDOW_MS, `the hold (2.5 s) is inside the GO window (${GO_WINDOW_MS} ms)`);
  // Grok's P0-4: the daily's veiled start never parks a warm-up behind its twice-a-second throttle
  assert.ok(v.includes("!(night.startBusy && night.startBusy())) return; veilAt = now; }"), 'the veil throttle counts a warm-up owed');
});

test('GROUP 3 — THE LOAD SNAP: a fresh scene shows ONCE in its final look (≤ 2 s); a later pack eases in; a match + PLAY AGAIN keep their own path', () => {
  const n = src('night.js'), v = src('view.js'), l = src('lab.js'), css = readFileSync(new URL('../css/jaywalk.css', import.meta.url), 'utf8');
  assert.ok(n.includes('const FADE_LOOK_MS = 1000, UNCOVER_MS = 280;') && n.includes('cover, covered: () => covered, fadeLook,'), 'the scene: cover + fadeLook');
  assert.ok(n.includes("coverEl.style.backgroundColor = `#${fogHex.toString(16).padStart(6, '0')}`;"), 'the cover is the look\'s own haze (no black flash by day)');
  assert.ok(n.includes('if (fadeAsk) { const fn = fadeAsk; fadeAsk = null; fadeNow(fn); }'), 'the still is read right after a drawn frame');
  assert.ok(v.includes('if (!had && !isMatch) coverUntilLook();') && v.includes('const LOOK_WAIT_MS = 2000;'), 'the game: a fresh solo / daily scene only');
  assert.ok(/if \(\(models && season && sun && !todDirty\) \|\| performance\.now\(\) - t0 >= LOOK_WAIT_MS\)/.test(v), 'the models + the season + the sun\'s time of day, 2 s at most');
  assert.ok(v.includes('if (shown) n.fadeLook(put); else put();') && l.includes('if (lookIn && view.fadeLook) view.fadeLook(put); else put();'), 'a later pack eases in (the game + the lab)');
  assert.ok(/\.jw-cover \{ position: absolute; inset: 0; pointer-events: none;/.test(css) && /\.jw-fadelook \{/.test(css));
});

test('GROUP 4 — EVERY VEHICLE FACES ITS TRAVEL: each model\'s front at +z as built (the scene turns +z to the lane\'s direction); the dump truck turned, the snowplow\'s blade at its cab', async () => {
  const { readVehicle, zProfile } = await import('./fixtures/vehicle-fronts.mjs');
  // THE PINNED PROFILES — each model's z-profile [all · upper · lower] as shipped, every one checked by eye driving both ways, day + night
  // (`jaywalk-lab.mjs --vb2=dirs` → Downloads\NEON\jaywalk-final\dirs\). A model rebuilt turned round flips every sign → red here
  const PIN = {
    'variety/police': [0.175, -0.024, 0.175], 'variety/suv': [0.123, -0.031, 0.067], 'variety/sports': [-0.04, -0.403, 0.001], 'variety/forklift': [0.003, 0.049, -0.039],
    'variety/ambulance': [0.028, -0.122, 0.061], 'variety/firetruck': [0.164, -0.151, 0.202], 'variety/delivery': [0.138, -0.073, 0.126], 'variety/garbage': [0.053, -0.019, 0.096],
    'variety/citybus': [-0.061, 0.039, -0.059], 'variety/tanker': [0.119, -0.088, 0.16], 'variety/dump': [0.114, 0.025, 0.021], 'variety/tug': [0.103, 0.597, -0.14],
    'variety/schoolbus': [0.223, 0.156, 0.14], 'variety/semi': [0.271, 0, 0.252], 'variety/bendy': [0.018, 0, 0.022], 'variety/plow': [-0.05, -0.119, -0.098], 'variety/salt': [0.138, 0.006, 0.132],
    'models/car-sedan': [0.003, -0.196, -0.002], 'models/car-hatchback': [0.001, -0.254, 0.002], 'models/car-taxi': [0.009, -0.098, 0.002], 'models/car-van': [0.021, -0.102, 0.005],
  };
  const { VARIETY_IDS } = await import('../js/games/jaywalk/variety.js');
  for (const id of VARIETY_IDS) assert.ok(PIN[`variety/${id}`], `${id}: every variety vehicle is pinned (a new one: check it both ways, then pin it)`);
  for (const [f, pin] of Object.entries(PIN)) {
    const got = zProfile(readVehicle(new URL(`../assets/jaywalk/${f}.glb`, import.meta.url)));
    const strong = pin.map((x, k) => [x, got[k]]).filter(([x]) => Math.abs(x) >= 0.015);
    assert.ok(strong.length > 0, `${f}: a profile to judge by`);
    for (const [x, g] of strong) assert.equal(Math.sign(g), Math.sign(x), `${f}: faces its travel (z-profile ${JSON.stringify(got)} against the checked ${JSON.stringify(pin)})`);
  }
  // the scene: a variety model's +z turned to the lane's direction; its nose, headlamps + tail lamps placed from the lane's direction
  const n = src('night.js');
  assert.ok(n.includes('ry = L.dir > 0 ? Math.PI / 2 : -Math.PI / 2;') && n.includes('const nose = left + (L.dir > 0 ? len - 0.02 : 0.02)'));
  // the asset table: the dump truck turned round (its cab was at the file's −z) — the snowplow is built from it, so its blade + beacon go to the cab
  const py = readFileSync(new URL('../scripts/build-jaywalk-assets.py', import.meta.url), 'utf8');
  assert.ok(py.includes("('dump', 'round2/dump-truck.glb', 180, False, {},"), 'the dump truck turned 180° in the vehicle table');
  assert.ok(/zb = hi\[2\] \+ 0\.07 \* L/.test(py), 'the plow\'s blade at the front (+z) of the turned dump truck');
  // the snowplow = the dump truck's vertices first (the builder appends its parts): that body must face the same way as the turned dump truck
  const dump = readVehicle(new URL('../assets/jaywalk/variety/dump.glb', import.meta.url)), plow = readVehicle(new URL('../assets/jaywalk/variety/plow.glb', import.meta.url));
  const raw = plow.pos.slice(0, dump.pos.length), zs = raw.map(q => q[2]), mid = (Math.min(...zs) + Math.max(...zs)) / 2;   // (centred on its own box: the blade made the plow's longer)
  const body = { ...plow, pos: raw.map(q => [q[0], q[1], q[2] - mid]), col: plow.col.slice(0, dump.pos.length) };
  const pb = zProfile(body), pd = zProfile(dump);
  assert.ok(Math.sign(pb[0]) === Math.sign(pd[0]) && Math.sign(pb[2]) === Math.sign(pd[2]), `the snowplow's body faces as the dump truck (${JSON.stringify(pb)} · ${JSON.stringify(pd)}) — its blade leads`);
  const { VARIETY } = await import('../js/games/jaywalk/variety.js');
  assert.deepEqual(VARIETY.plow.bar, [0.319, 0.995], 'the plow\'s beacon where the rebuilt file puts it (on the cab)');
});
