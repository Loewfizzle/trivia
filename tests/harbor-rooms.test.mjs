// CITY 2.0 — WIN: 2.5D ROOMS (core/harbor-rooms.js, PURE). node --test tests/harbor-rooms.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { roomBox, wallVP, lampPool, ROOM_DEPTH } from '../js/core/harbor-rooms.js';
import { cameraFor, harborLayout } from '../js/core/harbor-layout.js';
import { SPEAK_WIN, SPEAK_V } from '../js/core/harbor-speakeasy.js';

const SIZES = { '390x844': [390, 844, 47], '402x874': [402, 874, 62], '430x932': [430, 932, 59] };
const setup = k => { const [W, H, top] = SIZES[k]; const cam = cameraFor(W, H, { dock: { x: 14, y: H - 116, w: W - 28, h: 76 } }, { top, bottom: 34 }); return { cam, L: harborLayout(cam) }; };
const glass = (col, row) => { const [a, b] = SPEAK_WIN[col], [r0, r1] = SPEAK_V.rows[row]; return { g0: a + 0.18, g1: b - 0.05, h0: r0 + 0.12, h1: r1 - 0.06 }; };

test('WIN — THE BOX: from the street\'s real angle every speakeasy room shows its FLOOR + its LEFT wall (the camera right of the building, its eye over the roof) — never the ceiling or the right wall; the back wall inside the glass, shrunk toward the vanishing point', () => {
  for (const k of Object.keys(SIZES)) {
    const { cam, L } = setup(k), s = L.speakeasy, K = cam.F / s.z0, ox = cam.VPX + cam.F * s.x0 / s.z0, oy = cam.VPY + cam.F * cam.CAMH / s.z0;
    const vp = wallVP(ox, oy, K, cam.VPX, cam.VPY);
    assert.ok(vp.u > 11.2 && vp.v > SPEAK_V.crest, `${k}: the vanishing point right of the building (u ${vp.u.toFixed(1)}) and above its crest (v ${vp.v.toFixed(1)})`);
    for (const col of [1, 2]) for (const row of [0, 1]) {
      const G = glass(col, row), B = roomBox(G, vp);
      assert.ok(B.faces.floor && B.faces.left && !B.faces.ceiling && !B.faces.right, `${k}: col ${col} row ${row}: the floor + the left wall show`);
      assert.ok(B.back.g0 > G.g0 && B.back.h0 > G.h0 && B.back.g1 >= G.g1 - 0.25 && B.back.h1 >= G.h1 - 0.25, `${k}: the back wall up + right in the glass, reaching the right jamb + the head (${[B.back.g0, B.back.g1, B.back.h0, B.back.h1].map(v => v.toFixed(2)).join(' ')} in ${[G.g0, G.g1, G.h0, G.h1].map(v => v.toFixed(2)).join(' ')})`);
      assert.ok(B.back.g1 - B.back.g0 > (G.g1 - G.g0) * 0.7 && B.back.g1 - B.back.g0 < (G.g1 - G.g0) * 0.85, `${k}: the back wall ~${Math.round(ROOM_DEPTH * 100)} % of the glass`);
      // the slivers read: the floor ≥ 2 pt tall at the glass's foot, the left wall ≥ 2 pt wide — never more than a third of the pane
      assert.ok((B.back.h0 - G.h0) * K >= 2 && (B.back.h0 - G.h0) < (G.h1 - G.h0) * 0.34, `${k}: the floor ${((B.back.h0 - G.h0) * K).toFixed(1)} pt tall`);
      assert.ok((B.back.g0 - G.g0) * K >= 2 && (B.back.g0 - G.g0) < (G.g1 - G.g0) * 0.34, `${k}: the left wall ${((B.back.g0 - G.g0) * K).toFixed(1)} pt wide`);
    }
  }
});

test('WIN — DEPTH: a figure at the back wall is smaller than one at the glass, its feet on the floor at its depth; walking toward the window grows it, continuously', () => {
  const { cam, L } = setup('402x874'), s = L.speakeasy, K = cam.F / s.z0, ox = cam.VPX + cam.F * s.x0 / s.z0, oy = cam.VPY + cam.F * cam.CAMH / s.z0;
  const vp = wallVP(ox, oy, K, cam.VPX, cam.VPY), G = glass(1, 0), B = roomBox(G, vp);
  assert.equal(B.scale(0), 1); assert.equal(B.scale(1), ROOM_DEPTH); assert.ok(B.scale(0.5) > ROOM_DEPTH && B.scale(0.5) < 1);
  let prev = 2; for (let t = 0; t <= 1.0001; t += 0.05) { const sc = B.scale(t); assert.ok(sc < prev, 'smaller with every step back'); prev = sc; }
  const [, fv0] = B.at(G.cx || (G.g0 + G.g1) / 2, G.h0, 0), [, fv1] = B.at((G.g0 + G.g1) / 2, G.h0, 1);
  assert.ok(Math.abs(fv0 - G.h0) < 1e-9 && Math.abs(fv1 - B.back.h0) < 1e-9, 'the floor line at depth 0 is the sill, at depth 1 the back wall\'s foot');
  const [u1] = B.at(G.g0, G.h0, 1); assert.ok(u1 > G.g0, 'a point at the glass\'s left edge moves right (toward the VP) at depth');
});

test('WIN — THE LAMP\'S POOL: on the floor under the lamp at its depth, the wall\'s hot spot behind it, the corners dark', () => {
  const G = { g0: 0, g1: 2, h0: 0, h1: 2 }, vp = { u: 6, v: 8 }, B = roomBox(G, vp, 0.8);
  const P = lampPool(B, G, { u: 1, v: 1.6, t: 0.8 });
  assert.ok(P.floor[1] > G.h0 && P.floor[1] < B.back.h0 + 1e-9 && P.floor[2] > 0, `the pool on the floor between the sill and the back wall's foot (${P.floor.map(v => v.toFixed(2)).join(', ')})`);
  assert.ok(P.wall[0] >= B.back.g0 && P.wall[0] <= B.back.g1 && P.wall[1] >= B.back.h0 && P.wall[1] <= B.back.h1, 'the hot spot on the back wall');
  assert.ok(P.corner > 0.3 && P.corner <= 1, 'the corners dark');
});
