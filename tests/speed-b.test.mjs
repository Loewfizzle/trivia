// THE SPEED PASS B (docs/harbor/passes/speed-b.md) — the pure halves: A3 the laser's caches + its segments by tier.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const fakeCtx = () => {
  const log = { strokes: 0, styles: [] };
  const c = { save() {}, restore() {}, translate() {}, beginPath() {}, moveTo() {}, lineTo() {}, drawImage() {}, fillRect() {},
    stroke() { log.strokes++; log.styles.push(this.strokeStyle); }, set globalAlpha(v) {}, set lineWidth(v) {}, set lineCap(v) {}, set globalCompositeOperation(v) {} };
  return { c, log };
};

test('A3 — THE BORDER LASER: the tail\'s stroke colours made once (the same strings every frame), fewer segments at tier ≤ 1', async () => {
  let L, R;
  try { R = await import('../js/fx/renderer.js'); L = await import('../js/fx/laser.js'); } catch (e) { return; }   // (a browser-only import chain: the E2E's vault bench covers it)
  const o = { rgb: '90,255,160', rgb2: '255,70,220', radius: 12 };
  R.setFxTier(2);
  const a = fakeCtx(); try { L.drawLaser(a.c, 300, 60, 1.2, o); } catch { /* the head's sprite needs a canvas */ }
  const b = fakeCtx(); try { L.drawLaser(b.c, 300, 60, 1.9, o); } catch { /* */ }
  assert.equal(a.log.strokes, 60, 'tier 2: 30 segments × 2 passes');
  assert.deepEqual(a.log.styles, b.log.styles, 'the same colour strings frame to frame');
  R.setFxTier(1);
  const d = fakeCtx(); try { L.drawLaser(d.c, 300, 60, 1.2, o); } catch { /* */ }
  assert.equal(d.log.strokes, 36, 'tier ≤ 1: 18 segments × 2 passes');
  R.setFxTier(null);
});

test('A3 — along(): the perimeter walk is unchanged by the once-a-draw lengths', async () => {
  let L; try { L = await import('../js/fx/laser.js'); } catch { return; }
  const P = L.perimeter(200, 50, 10);
  assert.deepEqual(L.along(200, 50, 10, 0).map(v => +v.toFixed(6)), [10, 0]);
  assert.deepEqual(L.along(200, 50, 10, 180).map(v => +v.toFixed(6)), [190, 0]);
  assert.deepEqual(L.along(200, 50, 10, P + 5).map(v => +v.toFixed(6)), [15, 0]);
});
