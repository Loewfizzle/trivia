// JAYWALK FINAL (Nov 24 2026 — docs/games/passes/jaywalk-final.md): Grok's fixes · THE FIRST-TAP HOLD · THE LOAD SNAP · VEHICLE DIRECTIONS
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { uploadRange } from '../js/games/jaywalk/gl-upload.js';

const src = f => readFileSync(new URL(`../js/games/jaywalk/${f}`, import.meta.url), 'utf8');
/** a stand-in for three r160's BufferAttribute: `needsUpdate = true` bumps its version (what makes the renderer upload) */
const attr = () => ({ version: 0, updateRanges: [], set needsUpdate(v) { if (v) this.version++; }, clearUpdateRanges() { this.updateRanges.length = 0; }, addUpdateRange(start, count) { this.updateRanges.push({ start, count }); } });

test('GROUP 1 — EMPTY UPLOADS: an empty kind does not bump its attribute version (nothing goes to the GPU)', () => {
  const a = attr();
  assert.equal(uploadRange(a, 0), false);
  assert.equal(uploadRange(a, -3), false);
  assert.equal(a.version, 0, 'no upload asked for an empty kind');
  assert.deepEqual(a.updateRanges, []);
  assert.equal(uploadRange(a, 48), true);
  assert.equal(a.version, 1);
  assert.deepEqual(a.updateRanges, [{ start: 0, count: 48 }], 'only the instances in use — through three r160\'s own ranges');
  uploadRange(a, 16);
  assert.deepEqual(a.updateRanges, [{ start: 0, count: 16 }], 'a second ask before the draw replaces the range, never piles one up');
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
