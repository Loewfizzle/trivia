// PD-1 — THE MAX BOARD (js/games/prism/layout.js): the board fills the upright phone at 390 / 402 / 430 with the real safe areas — 20 rows always
// fit (never clipped), the cell snaps to the device's pixels, the rail + its 7 tiles + SLAM fit beside the board, THE BUTTONS scheme's board is
// smaller, the tiers step the board's pixel ratio down, the corner panels' cover zones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prismLayout, panelCells, MARGIN, GAP, RAIL, TOP, TILE_MIN } from '../js/games/prism/layout.js';

const PHONES = [[390, 844, 47, 34], [402, 874, 62, 34], [430, 932, 59, 34], [375, 667, 20, 0], [412, 915, 24, 16]];

test('THE MAX BOARD: fits every phone with its safe areas, ~33 pt blocks on a 390', () => {
  for (const [W0, H0, t, b] of PHONES) {
    const L = prismLayout({ W0, H0, safe: { t, b }, dpr: 3, n: 7 });
    assert.ok(L.boardH <= H0 - t - b - TOP, `${W0}: 20 rows fit (${L.boardH} ≤ ${H0 - t - b - TOP})`);
    assert.ok(L.fieldW + 2 * MARGIN <= W0 + 0.01, `${W0}: board + gap + rail + margins fit across (${L.fieldW})`);
    assert.equal(Math.round(L.cell * 3), L.cell * 3, `${W0}: the cell lands on whole device pixels (${L.cell})`);
    assert.equal(L.fieldW, L.boardW + GAP + RAIL);
  }
  const L = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3 });
  assert.ok(L.cell >= 32 && L.cell <= 34, `390: ~33 pt blocks (${L.cell}) — was ~25`);
});

test('THE BUTTONS scheme: the board shrinks to fit the button bar; GESTURES gets the full board', () => {
  const g = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3 });
  const bt = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3, scheme: 'buttons' });
  assert.ok(bt.btnH > 0 && bt.cell < g.cell, `${bt.cell} < ${g.cell}`);
  assert.ok(bt.boardH + bt.btnH <= 844 - 47 - 34 - TOP, 'the board + the bar fit');
  assert.equal(bt.slamArea, 0, 'no SLAM in the buttons scheme (its own DROP)');
});

test('THE RAIL: 7 opponents + SLAM fit beside the board; a duel tile shows a board', () => {
  for (const scheme of ['gesture', 'buttons']) {
    const L = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3, n: 7, scheme });
    assert.ok(L.tileH >= TILE_MIN && 7 * L.tileH + 6 * 6 + L.slamArea <= L.boardH + 0.5, `${scheme}: 7 tiles of ${L.tileH} + SLAM in ${L.boardH}`);
  }
  const d = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3, n: 1, duel: true });
  assert.ok(d.duelCell >= 2 && d.tileH >= d.duelCell * 20, 'the duel tile holds the opponent board');
  assert.ok(d.slamD >= 36 && d.slamD + 12 >= 44, 'SLAM ~38–44 pt with a 44 pt tap area');
});

test('THE TIERS: the board at the full 3×, stepped to 2× (then 1.5×) — the world + shards keep their reduced resolution', () => {
  const dprAt = tier => prismLayout({ W0: 390, H0: 844, dpr: 3, tier }).boardDpr;
  assert.deepEqual([dprAt(2), dprAt(1), dprAt(0)], [3, 2, 1.5]);
  assert.deepEqual([0, 1, 2].map(tier => prismLayout({ W0: 390, H0: 844, dpr: 3, tier }).fxDpr), [1, 1.5, 2]);
});

test('HOLD + NEXT: the board cells under each corner panel (the fade zones)', () => {
  const L = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3 });
  const hz = panelCells(L, 'hold'), nz = panelCells(L, 'next');
  assert.equal(hz.x0, 0);
  assert.equal(nz.x1, 10);
  assert.ok(hz.y0 >= 17 && nz.y0 >= 17, 'the top two rows (+ a sliver)');
  assert.ok(hz.x1 <= nz.x0, 'the two panels never overlap');
});
