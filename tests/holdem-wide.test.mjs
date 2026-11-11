// HOLD'EM (HE7) — THE SIDEWAYS TABLE (js/games/holdem/layout-wide.js), PURE: at every phone on its side (the visible area after Safari's
// bars + the notch) and 2–8 players, nothing overlaps; the seats are EVENLY spaced by arc length round the stadium, YOU at the bottom centre;
// the action column right of the table, low; the sizes (the board ≥ 50 pt on every iPhone since the X — the SE's 7–8 players the one
// compromise); THE STAGE scales a desktop's window. The portrait layout (layout.js) is tested by holdem-phone.test.mjs, untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { wideLayout, wideBlocks, stageOf, onStadium, STAGE } from '../js/games/holdem/layout-wide.js';
import { tableLayout, seatRects, betSpot, cardsSpot, dealerSpot } from '../js/games/holdem/layout.js';

const hit = (a, b, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;
// [w, h, top, bottom, left, right, an SE?] — the iPhone on its side: 13/14 (Safari's bars hidden + showing), 14 Pro Max, 16 Pro, SE (± its bars)
const PHONES = [[844, 390, 0, 21, 47, 47], [844, 340, 0, 0, 47, 47], [932, 430, 0, 21, 59, 59], [874, 402, 0, 21, 62, 62], [667, 375, 0, 0, 0, 0, true], [667, 320, 0, 0, 0, 0, true]];

test('THE SIDEWAYS LAYOUT at 844×390 · 844×340 · 932×430 · 874×402 · 667×375 · 667×320, 2–8 players: no piece overlaps another, everything on screen + off the column + the corner buttons', () => {
  for (const [w, h, top, bottom, left, right] of PHONES) {
    for (let k = 1; k <= 7; k++) {
      const L = wideLayout({ w, h, top, bottom, left, right, k }), B = wideBlocks(L), at = `${w}×${h} k=${k}`;
      assert.equal(L.misfits, 0, `${at}: everything found its place`);
      assert.ok(L.wide && L.box.w > L.box.h * 1.3, `${at}: a WIDE stadium (${Math.round(L.box.w)} × ${Math.round(L.box.h)})`);
      const parts = ['main', 'cards', 'bet', 'tag'];
      B.seats.forEach((A, i) => {
        B.seats.slice(i + 1).forEach((C, j) => { for (const a of parts) for (const c of parts) assert.ok(!hit(A[a], C[c]), `${at}: seat ${i}.${a} × seat ${i + j + 1}.${c}`); });
        for (const a of parts) {
          for (const o of ['board', 'pot', 'side', 'myBet', 'hand', 'plate', 'column']) assert.ok(!hit(A[a], B[o], o === 'board' || o === 'pot' ? 2 : 0), `${at}: seat ${i}.${a} × ${o}`);
          for (const c of B.corners) assert.ok(!hit(A[a], c), `${at}: seat ${i}.${a} × a corner button`);
          assert.ok(A[a].x0 >= left - 0.5 && A[a].y0 >= top - 0.5 && A[a].y1 <= h - bottom + 0.5, `${at}: seat ${i}.${a} on screen (the safe areas)`);
        }
        for (const a of ['main', 'cards', 'tag']) assert.ok(!hit(A[a], B.award), `${at}: seat ${i}.${a} × the award box (the hand's end)`);
        // (a bet shares the felt with your hand's name only while the hand runs — its name ≤ ~26 letters, the label box)
        assert.ok(!hit(A.bet, B.label), `${at}: seat ${i}'s bet × your hand's name`);
      });
      assert.ok(!hit(B.myBet, B.hand) && !hit(B.myBet, B.board) && !hit(B.myBet, B.label), `${at}: your bet beside your cards, clear of the board`);
      assert.ok(B.side.y1 <= B.pot.y0 + 1e-6 && B.pot.y1 <= B.board.y0, `${at}: the side-pot line above the pot above the board`);
      assert.ok(B.board.y1 <= B.label.y0 + 1e-6 && B.label.y1 <= B.hand.y0 + 1, `${at}: the board above your hand's name above your cards`);
      assert.ok(B.hand.y1 <= B.plate.y1 && B.plate.y1 <= h - bottom + 1, `${at}: your plate under your cards, on screen`);
      // THE COLUMN: right of the table, low — the presets above the buttons (≥ 12 pt apart), nothing over the board, your cards or a seat
      assert.ok(L.act.x0 >= L.box.x + L.box.w, `${at}: the column right of the table`);
      assert.ok(B.buttons.x1 <= w - right + 0.5 && B.buttons.y1 <= h - bottom + 0.5, `${at}: the buttons on screen (the home bar's safe area)`);
      assert.ok(B.buttons.y0 - B.presets.y1 >= 12 - 1e-6, `${at}: ${(B.buttons.y0 - B.presets.y1).toFixed(1)} pt between the presets + the buttons`);
      assert.ok(L.btn >= 50 && L.presets - 22 > L.level + 40, `${at}: round buttons ≥ 50 pt; the level line clear above`);
      for (const o of ['board', 'hand', 'plate', 'label']) assert.ok(!hit(B[o], B.column), `${at}: the ${o} clear of the column`);
    }
  }
});

test('THE SEATS: YOU at the bottom centre, the others FULLY EVENLY SPACED by arc length round the rail (2–8 players) — heads-up straight across', () => {
  for (const [w, h, top, bottom, left, right] of PHONES) {
    for (let k = 1; k <= 7; k++) {
      const L = wideLayout({ w, h, top, bottom, left, right, k }), N = k + 1, s = L.s;
      // the track = the rail's middle; walk it finely and read each seat's arc position
      const [x0, y0, x1, y1] = [L.box.x + 8 * s, L.box.y + 8 * s, L.box.x + L.box.w - 8 * s, L.box.y + L.box.h - 8 * s];
      const pts = Array.from({ length: 4001 }, (_, i) => onStadium(x0, y0, x1, y1, i / 4000));
      let len = 0;
      const arc = [0];
      for (let i = 1; i < pts.length; i++) arc.push(len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      const at = q => { let b = 0, d = Infinity; pts.forEach((p, i) => { const e = Math.hypot(p.x - q.x, p.y - q.y); if (e < d) { d = e; b = i; } }); assert.ok(d < 1, 'on the track'); return arc[b]; };
      const pos = [0, ...L.seats.map(at)];
      for (let i = 1; i <= k; i++) assert.ok(Math.abs(pos[i] - pos[i - 1] - len / N) < len / 400 + 1, `${w}×${h} k=${k}: seat ${i} ${(pos[i] - pos[i - 1]).toFixed(1)} along (≈ ${(len / N).toFixed(1)})`);
      if (k > 1) assert.ok(L.seats[0].x < L.box.x + L.box.w / 2, `${w}×${h} k=${k}: clockwise from you — the bottom-left first`);
      if (k === 1) assert.ok(Math.abs(L.seats[0].x - (L.box.x + L.box.w / 2)) < 0.5 && L.seats[0].y < L.box.y + 30, 'heads-up: the opponent top-centre');
    }
  }
});

test('THE SIZES: the board as big as fits (≥ 50 pt on every iPhone since the X; heads-up the biggest), your cards ≥ 55 pt (64 at a 390-tall phone) + the biggest thing (heads-up: the board as big)', () => {
  for (const [w, h, top, bottom, left, right, se] of PHONES) {
    for (let k = 1; k <= 7; k++) {
      const L = wideLayout({ w, h, top, bottom, left, right, k }), at = `${w}×${h} k=${k}`;
      assert.ok(L.board.card.w >= (se ? 45 : 50) - 1e-6, `${at}: the board's cards ${L.board.card.w.toFixed(1)} pt`);
      // (your cards the biggest — heads-up's board may come close: it's the whole middle)
      assert.ok(L.hand.card.w >= 55 && (k === 1 || L.hand.card.w >= L.board.card.w), `${at}: your cards ${L.hand.card.w.toFixed(1)} pt`);
      assert.ok(L.ss >= 0.78, `${at}: the seats ≥ 0.78 (their text above the minimums)`);
    }
    const H1 = wideLayout({ w, h, top, bottom, left, right, k: 1 }), H7 = wideLayout({ w, h, top, bottom, left, right, k: 7 });
    assert.ok(H1.board.card.w >= H7.board.card.w, `${w}×${h}: heads-up's board ≥ 8 players'`);
  }
  assert.ok(wideLayout({ w: 844, h: 390, bottom: 21, left: 47, right: 47, k: 1 }).board.card.w >= 64, 'heads-up on a 390-tall phone: 64+ pt cards');
  assert.ok(wideLayout({ w: 844, h: 390, bottom: 21, left: 47, right: 47, k: 7 }).hand.card.w >= 63, 'your cards ≈ 64 pt on a 390-tall phone');
});

test('THE STAGE (desktop + any wide window): a phone on its side = the screen itself; a desktop scales the sideways table to the window, centred, never flatter than a phone, with air at the sides', () => {
  assert.deepEqual(stageOf(844, 390), { z: 1, x: 0, y: 0, w: 844, h: 390 });
  assert.deepEqual(stageOf(667, 320), { z: 1, x: 0, y: 0, w: 667, h: 320 });
  for (const [W, H] of [[1440, 900], [1920, 1080], [1280, 720], [2560, 1080], [1180, 820], [2560, 1440]]) {
    const S = stageOf(W, H);
    assert.ok(S.z > 1 && S.z <= STAGE.zMax, `${W}×${H}: scaled ${S.z.toFixed(2)}`);
    assert.ok(S.x >= 20 && Math.abs(S.x * 2 + S.w * S.z - W) < 0.5 && Math.abs(S.y * 2 + S.h * S.z - H) < 0.5, `${W}×${H}: centred with air at the sides`);
    assert.ok(S.w / S.h >= 1.99 && S.w / S.h <= 2.41, `${W}×${H}: the frame ${(S.w / S.h).toFixed(2)} wide`);
    const L = wideLayout({ w: S.w, h: S.h, k: 7, cb: 36 / S.z, cbTop: (10 - S.y) / S.z, cbIn: (12 - S.x) / S.z });
    assert.equal(L.misfits, 0, `${W}×${H}: 8 players fit`);
    assert.ok(L.board.card.w >= 54, `${W}×${H}: the board's cards ${L.board.card.w.toFixed(0)} stage pt (× ${S.z.toFixed(2)} on screen)`);
  }
});

test('THE MOTION reads a sideways seat\'s own box (the bet, the cards, the D button); a portrait seat is exactly as before', () => {
  const L = wideLayout({ w: 844, h: 390, bottom: 21, left: 47, right: 47, k: 7 });
  for (const q of L.seats) {
    const R = seatRects(q, L.ss), b = betSpot(q, L.ss), c = cardsSpot(q, L.ss), d = dealerSpot(q, L.ss);
    assert.ok(b.x > R.bet.x0 && b.x < R.bet.x1 && b.y > R.bet.y0 && b.y < R.bet.y1, 'the bet flies to its own box');
    assert.ok(c.x >= R.cards.x0 && c.x <= R.cards.x1 && c.y >= R.cards.y0 && c.y <= R.cards.y1, 'the deal lands on its cards');
    assert.ok(Math.hypot(d.x - q.x, d.y - q.y) < 40 * L.ss, 'the D button by its emblem');
  }
  const P = tableLayout({ w: 390, h: 844, top: 47, bottom: 34, k: 7 });
  assert.ok(P.seats.every(q => !q.wbox) && !P.wide, 'portrait seats carry no sideways box');
});
