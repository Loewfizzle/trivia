// HOLD'EM (HE3) — THE PHONE's pure side: the director's end (the podium only once the result is in), GAME NIGHT's ranks + the podium rows,
// the level line, WHO POKES, the seats on the rail (uniform, never overlapping at 2–8 players on 375–430 wide phones), the cartridge's frame.
import test from 'node:test';
import assert from 'node:assert/strict';
import { ranksOf, finalRowsOf, levelLine, pokeIn, HOST_POKE_MS, GUEST_POKE_MS, seatSlots, othersInOrder, clockOf, sidePots, finished } from '../js/games/holdem/logic.js';
import { tableLayout, sideRows } from '../js/games/holdem/layout.js';
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
  assert.match(finalRowsOf(tour)[0].note, /2 KO · 5 HANDS WON/);
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

test('THE LAYOUT at 375 / 390 / 402 / 430 wide, 2–8 players: the table fills the screen, no seat blocks overlap, the board sits above the buttons, your cards below them and the biggest cards on screen', () => {
  const phones = [[375, 812, 47, 34], [390, 844, 47, 34], [402, 874, 62, 34], [430, 932, 59, 34], [375, 667, 20, 0]];
  for (const [w, h, top, bottom] of phones) {
    for (let k = 1; k <= 7; k++) {
      const L = tableLayout({ w, h, top, bottom, k });
      assert.ok(L.box.x >= 16 && L.box.x + L.box.w <= w - 16, `${w}: the table inside the screen`);
      assert.ok(L.box.h > L.box.w, `${w}×${h}: a TALL stadium`);
      // a seat's block: the emblem (±22) + its plate + its tag below (to +74) — side seats on the same side never overlap
      for (const side of ['left', 'right']) {
        const ys = L.seats.filter(s => s.side === side).map(s => s.y).sort((a, b) => a - b);
        for (let i = 1; i < ys.length; i++) assert.ok(ys[i] - ys[i - 1] >= 74 * L.ss, `${w}×${h} k=${k}: ${side} seats ${Math.round(ys[i] - ys[i - 1])} pt apart`);
      }
      const lowest = Math.max(...L.seats.map(s => s.y));
      const boardTop = L.board.y - L.board.card.h / 2, boardBottom = L.board.y + L.board.card.h / 2;
      assert.ok(lowest + 74 * L.ss <= L.pot - 8, `${w}×${h} k=${k}: the seats end above the pot`);
      assert.ok(boardBottom < L.presets - 20, `${w}×${h} k=${k}: the presets below the board`);
      assert.ok(L.buttons + 33 * L.s <= L.hand.y - L.hand.card.h / 2 + 4, `${w}×${h} k=${k}: the buttons above your cards`);
      assert.ok(L.hand.card.w > L.board.card.w && L.hand.card.h > L.board.card.h, 'your cards are the biggest thing');
      assert.ok(L.plate + 30 <= h - bottom + 2, `${w}×${h}: your plate on screen`);
      void boardTop;
    }
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
