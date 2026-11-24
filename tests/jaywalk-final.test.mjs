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
