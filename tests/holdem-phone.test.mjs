// HOLD'EM (HE3) — THE PHONE's pure side: the director's end (the podium only once the result is in), GAME NIGHT's ranks + the podium rows,
// the level line, WHO POKES, the seats on the rail (uniform, never overlapping at 2–8 players on 375–430 wide phones), the cartridge's frame.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ranksOf, finalRowsOf, levelLine, pokeIn, HOST_POKE_MS, GUEST_POKE_MS, seatSlots, othersInOrder, clockOf, sidePots, finished } from '../js/games/holdem/logic.js';
import { tableLayout, sideRows, blocks, overlaps, SEAT_BOX } from '../js/games/holdem/layout.js';
import { estimateMinutes, cleanSettings, OPTIONS, DEFAULT_SETTINGS, CHAT_CHIPS, LOOKS, chatLocked } from '../js/games/holdem/meta.js';
import { faceSvg, suitColor, RANKINGS } from '../js/games/holdem/card-art.js';
import { evaluate } from '../js/games/holdem/rank.js';
import { newRecord, advance, publicOf } from '../api/_lib/holdem-dealer.js';
import { toWire, nestWire, fromWire } from '../js/games/holdem/wire.js';
import { rngFrom } from '../js/core/rng.js';

test('THE META: TOURNAMENT · TURBO by default; SPEED is a tournament option; CASH is "OPEN"; NIGHT only; the chat never locked; its chips', () => {
  assert.deepEqual(DEFAULT_SETTINGS, { mode: 'tournament', speed: 'turbo' });
  assert.deepEqual(OPTIONS.map(o => o.key), ['mode', 'speed']);
  assert.equal(estimateMinutes({ mode: 'tournament', speed: 'turbo' }), 20);
  assert.equal(estimateMinutes({ mode: 'tournament', speed: 'standard' }), 50);
  assert.equal(estimateMinutes({ mode: 'tournament', speed: 'deep' }), 100);
  assert.equal(estimateMinutes({ mode: 'cash', speed: 'deep' }), 'OPEN');
  assert.deepEqual(cleanSettings({ mode: 'poker', speed: 'warp' }), DEFAULT_SETTINGS);
  assert.deepEqual(LOOKS, ['night']);
  assert.deepEqual(CHAT_CHIPS, ['NICE HAND', 'NO WAY', 'WELL PLAYED', 'UNLUCKY']);
  assert.equal(chatLocked({ phase: 'play' }), false);
  // PLAY CHIPS ONLY: no money words in anything the meta shows
  const text = JSON.stringify(OPTIONS);
  assert.doesNotMatch(text, /\$|dollar|money|cash out|bet money/i);
});

test('THE END: the podium only once the dealer says ended AND its result is in; GAME NIGHT ranks (tournament places · cash by net, ties share)', () => {
  assert.equal(finished({ ended: true, rep: null }), false);
  assert.equal(finished({ ended: true, rep: 'done' }), true);
  const tour = { mode: 'tournament', places: [{ id: 'b', place: 2 }, { id: 'a', place: 1 }, { id: 'c', place: 2 }], players: { a: { kos: 2, won: 5, hands: 9 } } };
  assert.deepEqual(ranksOf(tour), [{ uid: 'a', rank: 1 }, { uid: 'b', rank: 2 }, { uid: 'c', rank: 2 }]);
  assert.match(finalRowsOf(tour)[0].note, /5 HANDS WON · 9 PLAYED/);
  assert.equal(finalRowsOf(tour)[0].scoreText, '2 KO');
  const cash = { mode: 'cash', ledger: [{ id: 'a', net: 300, final: 1300, buyins: 1000, hands: 9 }, { id: 'b', net: -300, final: 700, buyins: 1000, hands: 9 }, { id: 'c', net: 0, final: 0, buyins: 0, hands: 0 }] };
  assert.deepEqual(ranksOf(cash), [{ uid: 'a', rank: 1 }, { uid: 'b', rank: 2 }], 'a player dealt no hand is not ranked');
  const rows = finalRowsOf(cash);
  assert.equal(rows[0].scoreText, '+300');
  assert.equal(rows[1].scoreText, '−300');
  assert.doesNotMatch(JSON.stringify(rows), /\$/);
});

test('THE LEVEL LINE: TOURNAMENT = the level, the blinds, the time to the next level; CASH = its fixed blinds', () => {
  const pub = { mode: 'tournament', level: 2, startAt: 0, levelMs: 90_000, table: { sb: 25, bb: 50 } };
  assert.equal(levelLine(pub, 2 * 90_000 + 48_000), 'LVL 3 · BLINDS 25/50 · 0:42');
  assert.equal(levelLine({ mode: 'cash', table: {} }, 0), 'BLINDS 5/10');
});

test('WHO POKES: the host ~100 ms after due; a guest ~2 s after (+ its jitter ≤ 1 s); nothing timed → no poke; due 0 → now', () => {
  assert.equal(pokeIn({ due: 10_000, now: 9_000, host: true }), 1000 + HOST_POKE_MS);
  assert.equal(pokeIn({ due: 10_000, now: 9_000, host: false, jitter: 400 }), 1000 + GUEST_POKE_MS + 400);
  assert.equal(pokeIn({ due: 10_000, now: 9_000, host: false, jitter: 99_999 }), 1000 + GUEST_POKE_MS + 1000);
  assert.equal(pokeIn({ due: null, now: 0, host: true }), null);
  assert.equal(pokeIn({ due: 0, now: 50_000, host: true }), 0);
});

test('THE SEATS: uniform + evenly spaced — the top seat alone heads-up, 3 down each side at 8; clockwise from your left', () => {
  assert.deepEqual(seatSlots(1).map(s => s.side), ['top']);
  assert.deepEqual(seatSlots(7).map(s => s.side), ['left', 'left', 'left', 'top', 'right', 'right', 'right']);
  for (let k = 1; k <= 7; k++) {
    const r = sideRows(k);
    assert.equal(seatSlots(k).filter(s => s.side === 'left').length, r.left.length, `k=${k}: the left rows`);
    assert.equal(seatSlots(k).filter(s => s.side === 'right').length, r.right.length, `k=${k}: the right rows`);
  }
  const seats = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, seat: i }));
  assert.deepEqual(othersInOrder(seats, 'c').map(x => x.id), ['d', 'a', 'b']);
  assert.deepEqual(othersInOrder(seats, 'zz').map(x => x.id), ['a', 'b', 'c', 'd'], 'watching: everyone');
});

test('THE LAYOUT (HE4) at 375 / 390 / 402 / 430 wide + an SE-height phone, 2–8 players: no piece overlaps another (every seat’s block, its cards + bet, the pot + a side pot, the board, the presets) — the board above the presets, the buttons above your cards, your cards the biggest', () => {
  const phones = [[375, 812, 47, 34], [390, 844, 47, 34], [402, 874, 62, 34], [430, 932, 59, 34], [375, 667, 20, 0]];
  for (const [w, h, top, bottom] of phones) {
    for (let k = 1; k <= 7; k++) {
      const L = tableLayout({ w, h, top, bottom, k }), B = blocks(L), at = `${w}×${h} k=${k}`;
      assert.ok(L.box.x >= 16 && L.box.x + L.box.w <= w - 16, `${at}: the table inside the screen`);
      assert.ok(L.box.h > L.box.w, `${at}: a TALL stadium`);
      const parts = ['main', 'cards', 'bet', 'tag'];
      B.seats.forEach((A, i) => {
        B.seats.slice(i + 1).forEach((C, j) => {
          for (const a of parts) for (const c of parts) if (A[a] && C[c]) assert.ok(!overlaps(A[a], C[c]), `${at}: seat ${i}.${a} × seat ${i + j + 1}.${c}`);
        });
        for (const a of parts) {
          if (!A[a]) continue;
          assert.ok(!overlaps(A[a], B.board, 2), `${at}: seat ${i}.${a} × the board`);
          assert.ok(!overlaps(A[a], B.pot, 2), `${at}: seat ${i}.${a} × the pot`);
          assert.ok(!overlaps(A[a], B.sides(1)[0]), `${at}: seat ${i}.${a} × a side pot`);
          assert.ok(!overlaps(A[a], B.presets), `${at}: seat ${i}.${a} × the presets`);
        }
      });
      assert.ok(!overlaps(B.pot, B.board), `${at}: the pot above the board`);
      // (HE4: the hand's end — THE AWARD BOX under the board clear of every seat, the between-hands buttons + your cards)
      B.seats.forEach((A, i) => { for (const k of ['main', 'cards', 'bet', 'tag']) if (A[k]) assert.ok(!overlaps(A[k], B.award), `${at}: seat ${i}.${k} × the award box`); });
      assert.ok(!overlaps(B.award, B.minisDone) && !overlaps(B.award, B.hand), `${at}: the award box above the between-hands buttons + your cards`);
      assert.ok(B.board.y1 + 2 <= B.presets.y0, `${at}: the presets below the board`);
      assert.ok(B.buttons.y1 <= B.hand.y0 + 4, `${at}: the buttons above your cards`);
      assert.ok(L.hand.card.w > L.board.card.w && L.hand.card.h > L.board.card.h, `${at}: your cards are the biggest thing`);
      assert.ok(L.plate + 30 <= h - bottom + 2, `${at}: your plate on screen`);
    }
  }
});

test('SHOWN HANDS READ (HE4 — Ben, the split-pot shot): a seat’s two shown cards side by side, 30 pt each, NO overlap — the seat block holds them', () => {
  for (const g of [SEAT_BOX.side, SEAT_BOX.top, SEAT_BOX.big]) assert.ok(g.cards[2] - g.cards[0] >= 2 * 30 + 1, `the shown cards' box ${g.cards[2] - g.cards[0]} pt wide`);
  assert.ok(SEAT_BOX.side.cards[3] <= 22, 'side seats: the cards end above the plate (it starts at 23)');
});

test('BEN’S PREVIEW FIXES (HE4): heads-up = the board centred between the opponent and your buttons, ~64 pt cards; 3–4 players raised; 5–8 as HE3; the side rows ~20 % further apart', () => {
  const L1 = tableLayout({ w: 390, h: 844, top: 47, bottom: 34, k: 1 }), B1 = blocks(L1);
  const opp = B1.seats[0].bet.y1, mid = (opp + B1.presets.y0) / 2;
  assert.ok(Math.abs(L1.board.y - mid) < 20, `heads-up board ${Math.round(L1.board.y)} ≈ the middle ${Math.round(mid)}`);
  assert.ok(L1.board.card.w >= 58 && L1.board.card.w <= 64, 'heads-up cards ~64 pt (as big as the felt allows)');
  assert.ok(Math.abs(tableLayout({ w: 430, h: 932, top: 59, bottom: 34, k: 1 }).board.card.w - 64 * 1.08) < 8, 'heads-up: 64 pt + on a bigger phone');
  const y = k => tableLayout({ w: 390, h: 844, top: 47, bottom: 34, k }).board.y;
  assert.ok(y(2) < y(4) - 30 && y(3) < y(4) - 30, '3–4 players: the board raised toward the middle');
  assert.ok(Math.abs(y(7) - (100 + 0.6 * 652)) < 1, '5–8: HE3’s place');
  for (const k of [6, 7]) {
    const L = tableLayout({ w: 390, h: 844, top: 47, bottom: 34, k });
    const ys = L.seats.filter(q => q.side === 'left').map(q => q.y).sort((a, b) => a - b);
    for (let i = 1; i < ys.length; i++) assert.ok(ys[i] - ys[i - 1] >= 80 * 1.18, `k=${k}: rows ${Math.round(ys[i] - ys[i - 1])} pt apart (HE3: 80)`);
  }
});

test('THE CLOCK BAR: the shot clock drains 1 → 0; the time bank is its own bar', () => {
  assert.deepEqual(clockOf({ deadline: 20_000, bankOn: false }, 10_000), { frac: 0.5, left: 10_000, bank: false });
  const b = clockOf({ deadline: 50_000, bankOn: true, bankFrom: 20_000 }, 35_000);
  assert.equal(b.bank, true); assert.equal(b.frac, 0.5);
  assert.equal(clockOf({ deadline: null }, 0), null);
  assert.deepEqual(sidePots({ pots: [{ amount: 300 }] }), []);
  assert.deepEqual(sidePots({ pots: [{ amount: 300 }, { amount: 120 }] }).map(p => p.label), ['MAIN', 'SIDE 1']);
});

test('THE CARD FACES: four colours (spades black · hearts red · diamonds blue · clubs green), CLASSIC two; the rankings best → worst, each example its hand', () => {
  assert.deepEqual(['s', 'h', 'd', 'c'].map(x => suitColor(x)), ['#15161c', '#d3202f', '#1d5fd6', '#14864a']);
  assert.equal(suitColor('d', 'two'), suitColor('h', 'two'));
  assert.equal(suitColor('c', 'two'), suitColor('s', 'two'));
  assert.match(faceSvg('Td'), />10</);
  assert.match(faceSvg('Td'), /#1d5fd6/);
  assert.equal(RANKINGS.length, 10);
  const want = ['STRAIGHT FLUSH', 'STRAIGHT FLUSH', 'FOUR OF A KIND', 'FULL HOUSE', 'FLUSH', 'STRAIGHT', 'THREE OF A KIND', 'TWO PAIR', 'PAIR', 'HIGH CARD'];
  RANKINGS.forEach(([, , cards], i) => assert.equal(evaluate(cards).name, want[i], `${RANKINGS[i][0]}'s example`));
  for (let i = 1; i < RANKINGS.length; i++) assert.ok(evaluate(RANKINGS[i - 1][2]).score > evaluate(RANKINGS[i][2]).score, 'best → worst');
});

test('A REFRESH reads the same table: the dealer\'s public view → the lean wire → a phone\'s copy', () => {
  const rng = rngFrom('phone');
  const rec = newRecord({ code: 'PHON', uids: ['a', 'b', 'c'], now: 1e12, rng });
  advance(rec, 1e12, rng);
  const pub = JSON.parse(JSON.stringify(publicOf(rec)));
  assert.deepEqual(fromWire({ seq: rec.seq, ...nestWire(toWire(pub)) }), pub);
});
