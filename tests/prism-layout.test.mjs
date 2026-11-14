// PD-1 — THE MAX BOARD (js/games/prism/layout.js): the board fills the upright phone at 390 / 402 / 430 with the real safe areas — 20 rows always
// fit (never clipped), the cell snaps to the device's pixels, the rail + its 7 tiles + SLAM fit beside the board, THE BUTTONS scheme's board is
// smaller, the tiers step the board's pixel ratio down, the corner panels' cover zones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prismLayout, panelCells, MARGIN, GAP, RAIL, TOP, TILE_MIN, TILE_GAP, COL_MAX, SLAM_RIM, SLAM_CAP } from '../js/games/prism/layout.js';
import { TIERS } from '../js/games/prism/tiers.js';

const PHONES = [[390, 844, 47, 34], [402, 874, 62, 34], [430, 932, 59, 34], [375, 667, 20, 0], [412, 915, 24, 16]];

test('THE MAX BOARD: fits every phone with its safe areas, ~33 pt blocks on a 390', () => {
  for (const [W0, H0, t, b] of PHONES) {
    const L = prismLayout({ W0, H0, safe: { t, b }, dpr: 3, n: 7 });
    assert.ok(L.boardH <= H0 - t - b - TOP, `${W0}: 20 rows fit (${L.boardH} ≤ ${H0 - t - b - TOP})`);
    assert.ok(L.fieldW + 2 * MARGIN <= W0 + 0.01, `${W0}: board + gap + rail + margins fit across (${L.fieldW})`);
    assert.equal(Math.round(L.cell * 3), L.cell * 3, `${W0}: the cell lands on whole device pixels (${L.cell})`);
    assert.equal(L.fieldW, L.boardW + GAP + L.railW);   // (PD-6: the 375 x 667 SE row is height-bound: its spare width went to the column)
    if (!L.wide) assert.equal(L.railW, RAIL);
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

test('THE TIERS (PD-3): the board at the full 3× on every tier but the LAST (2×) — the light steps down first; the shards keep their reduced resolution', () => {
  const dprAt = tier => prismLayout({ W0: 390, H0: 844, dpr: 3, tier }).boardDpr;
  assert.deepEqual([dprAt(3), dprAt(2), dprAt(1), dprAt(0)], [3, 3, 3, 2]);
  assert.equal(prismLayout({ W0: 390, H0: 844, dpr: 3 }).boardDpr, 3, 'the top tier by default');
  assert.deepEqual([0, 1, 2, 3].map(tier => prismLayout({ W0: 390, H0: 844, dpr: 3, tier }).fxDpr), [1, 1, 1.5, 2]);
  // the order the owner asked for: bloom → spill → particles drop before the board's resolution
  const T = TIERS;
  assert.equal(T.length, 4);
  for (let t = 1; t < T.length; t++) {
    assert.ok(T[t].bloom >= T[t - 1].bloom && T[t].sparks >= T[t - 1].sparks && T[t].light >= T[t - 1].light, `tier ${t} never has less light than ${t - 1}`);
  }
  assert.ok(T[1].board === 3 && T[1].bloom === 0 && !T[1].spill, 'the bloom + the spill are gone before the board drops');
  assert.ok(T[3].bloom === 3 && T[3].spill, 'the top tier: the full light');
});

test('HOLD + NEXT: the board cells under each corner panel (the fade zones)', () => {
  const L = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3 });
  const hz = panelCells(L, 'hold'), nz = panelCells(L, 'next');
  assert.equal(hz.x0, 0);
  assert.equal(nz.x1, 10);
  assert.ok(hz.y0 >= 17 && nz.y0 >= 17, 'the top two rows (+ a sliver)');
  assert.ok(hz.x1 <= nz.x0, 'the two panels never overlap');
});

// PD-6 — THE SPARE-WIDTH COLUMN: Safari WITH its toolbars (the visible height, no safe areas) is HEIGHT-bound — the spare width goes to the rail +
// SLAM column, the board at the outer margin; a home-screen app (the full height + the safe areas) is width-bound = PD-1's numbers exactly.
const SAFARI = [[390, 650], [390, 664], [402, 690], [430, 746]];
const APP = [[390, 844, 47, 34], [402, 874, 62, 34], [430, 932, 59, 34]];

test('PD-6 THE SPARE-WIDTH COLUMN: Safari with its toolbars → a wide column, a bigger SLAM, the board at the margin', () => {
  for (const [W0, H0] of SAFARI) {
    for (const n of [0, 5, 7]) {
      const L = prismLayout({ W0, H0, dpr: 3, n });
      assert.ok(L.wide, `${W0}×${H0}: the column took the spare width`);
      assert.ok(L.railW > RAIL && L.railW <= COL_MAX, `${W0}×${H0}: the column ${L.railW} in (34, ${COL_MAX}]`);
      assert.ok(L.slamD >= 44 && L.slamD <= L.strip - 2 * SLAM_RIM, `${W0}×${H0}: SLAM ${L.slamD} inside the strip ${L.strip}`);
      assert.ok(L.slamD + 12 >= 44, 'the tap area ≥ 44 pt');
      // the board at the outer margin: nothing left to split when the column isn't capped
      const left = W0 - 2 * MARGIN - L.fieldW;
      assert.ok(left >= 0 && (left < 1 || L.railW === COL_MAX), `${W0}×${H0}: no empty strips (${left.toFixed(2)} pt left over)`);
      assert.ok(L.boardH <= H0 - TOP, '20 rows fit');
      assert.equal(L.fieldW, L.boardW + GAP + L.railW, 'the column never overlaps the board');
      if (n) assert.ok(L.tileH >= TILE_MIN && n * L.tileH + (n - 1) * TILE_GAP + L.slamArea <= L.boardH + 0.5, `${n} tiles of ${L.tileH} + SLAM fit`);
    }
    const lf = prismLayout({ W0, H0, dpr: 3, n: 5 }), b = prismLayout({ W0, H0, dpr: 3, n: 5, scheme: 'buttons' });
    assert.ok(b.wide && b.slamArea === 0, `${W0}: BUTTONS — the column rule on the rail, no SLAM`);
    assert.ok(lf.railW >= 60, `${W0}×${H0}: a real column (${lf.railW})`);
  }
  const L = prismLayout({ W0: 390, H0: 650, dpr: 3, n: 5 });
  assert.deepEqual([L.cell, L.railW, L.slamD], [29, 68, 80], 'the owner screenshot (390 × ~650): 29-pt cells, a 68-pt column, SLAM 80 (THE DROP B add-on — the whole strip − 8; was 62)');
});

test('PD-6: a home-screen app / fullscreen (width-bound) keeps the PD-1 34-pt rail + board exactly (SLAM: the strip — THE DROP B add-on)', () => {
  for (const [W0, H0, t, b] of APP) for (const btnScale of [0, 0.5, 1]) {
    const L = prismLayout({ W0, H0, safe: { t, b }, dpr: 3, n: 5, btnScale });
    assert.equal(L.wide, false, `${W0}: width-bound`);
    assert.equal(L.railW, RAIL);
    assert.equal(L.slamD, Math.floor(L.strip - 2 * SLAM_RIM), 'SLAM = the strip − 8, whatever BUTTON SIZE says');
    assert.equal(L.fieldW, L.boardW + GAP + L.railW);   // (PD-6: the 375 x 667 SE row is height-bound: its spare width went to the column)
    if (!L.wide) assert.equal(L.railW, RAIL);
  }
  // a duel tile in a wide column holds a bigger board, never wider than the column
  const d = prismLayout({ W0: 390, H0: 650, dpr: 3, n: 1, duel: true });
  assert.ok(d.duelCell >= 3 && d.duelCell * 10 <= d.railW - 4, `the duel board (${d.duelCell}) fits the column (${d.railW})`);
});

// THE DROP B ADD-ON (Ben, Nov 13 9:56 pm — his iPhone HOME-SCREEN APP): SLAM = the WHOLE STRIP from the board's edge to the screen's safe edge − 8 pt
// in EVERY layout, centred across that strip (slamX from the column's centre, outward); the board + the rail never change for it
test('THE DROP B add-on — SLAM fills the strip in every layout: the home-screen app (≈ 46 pt, was 40) + Safari with its toolbars (80 / 72 / 73, was 62 / 54 / 55)', () => {
  const was = { '390x844': 40, '402x874': 40, '430x932': 40, '390x650': 62, '402x690': 54, '430x746': 55 };
  for (const [W0, H0, t = 0, b = 0] of [...APP, ...SAFARI.filter(([w, h]) => h !== 664)]) {
    const L = prismLayout({ W0, H0, safe: { t, b }, dpr: 3, n: 7 });
    const outer = (W0 - (L.boardW + GAP + L.railW)) / 2;
    assert.ok(Math.abs(L.strip - (GAP + L.railW + outer)) < 1e-9, `${W0}×${H0}: the strip = gap + column + the outer margin`);
    assert.equal(L.slamD, Math.floor(L.strip - 2 * SLAM_RIM), `${W0}×${H0}: SLAM = the strip − 8 (${L.slamD} in ${L.strip.toFixed(2)})`);
    assert.ok(L.slamD >= was[`${W0}x${H0}`], `${W0}×${H0}: never smaller than before (${L.slamD} ≥ ${was[`${W0}x${H0}`]})`);
    // centred across the strip: its left edge SLAM_RIM past the board's edge, its right edge ≥ SLAM_RIM clear of the screen's
    const centre = GAP + L.railW / 2 + L.slamX;
    assert.ok(Math.abs(centre - L.slamD / 2 - SLAM_RIM) < 0.34, `${W0}×${H0}: SLAM_RIM clear of the board (${(centre - L.slamD / 2).toFixed(2)})`);
    assert.ok(L.strip - (centre + L.slamD / 2) >= SLAM_RIM - 0.01, `${W0}×${H0}: its chrome rim clear of the screen's edge`);
    // nothing else moves: the board + the rail as PD-1 / PD-6 made them; 7 tiles + SLAM still fit the column
    assert.equal(L.fieldW, L.boardW + GAP + L.railW);
    assert.ok(7 * L.tileH + 6 * TILE_GAP + L.slamArea <= L.boardH + 0.5, `${W0}×${H0}: 7 tiles + SLAM fit`);
  }
  const app = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3 });
  assert.equal(app.slamD, 46, 'the home-screen app at 390: 46 pt (the real strip is 54.3 pt)');
  assert.equal(prismLayout({ W0: 1440, H0: 900, dpr: 3 }).slamD, SLAM_CAP, 'a desktop: capped at the widest phone strip');
  const left = prismLayout({ W0: 390, H0: 844, safe: { t: 47, b: 34 }, dpr: 3, scheme: 'gesture' });
  assert.ok(left.slamX > 0, 'the shift is outward (the LEFT setting mirrors it in CSS)');
});
