// PRISM DROP engine: rotation + kicks against the standard rotation system, the 7-bag, lock delay,
// twists, scoring, attack table, countering, badges, junk.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../js/games/prism/engine.js';

const ID = { I: 1, O: 2, T: 3, S: 4, Z: 5, J: 6, L: 7 };

// draw a rotation state as rows (top first) inside its box
function pic(t, r) {
  const n = E.BOX[t];
  const g = Array.from({ length: n }, () => Array(n).fill('.'));
  for (const [x, y] of E.SHAPES[t][r]) g[n - 1 - y][x] = 'X';
  return g.map(r => r.join('')).join('/');
}

test('rotation states match the standard rotation system', () => {
  // standard pictures (spawn, R, 2, L), top row first
  const want = {
    I: ['..../XXXX/..../....', '..X./..X./..X./..X.', '..../..../XXXX/....', '.X../.X../.X../.X..'],
    T: ['.X./XXX/...', '.X./.XX/.X.', '.../XXX/.X.', '.X./XX./.X.'],
    S: ['.XX/XX./...', '.X./.XX/..X', '.../.XX/XX.', 'X../XX./.X.'],
    Z: ['XX./.XX/...', '..X/.XX/.X.', '.../XX./.XX', '.X./XX./X..'],
    J: ['X../XXX/...', '.XX/.X./.X.', '.../XXX/..X', '.X./.X./XX.'],
    L: ['..X/XXX/...', '.X./.X./.XX', '.../XXX/X..', 'XX./.X./.X.'],
  };
  for (const [name, states] of Object.entries(want)) states.forEach((s, r) => assert.equal(pic(ID[name], r), s, `${name} state ${r}`));
});

const tick = (g, ms) => { for (let t = 0; t < ms; t += 10) E.update(g, 10); };

// board from rows (top first, bottom row last), '#' = filled
function board(rows, seed = 'x') {
  const g = E.createEngine({ seed, mode: 'battle' });
  rows.slice().reverse().forEach((row, y) => [...row].forEach((c, x) => { if (c !== '.') g.cells[y * E.W + x] = E.JUNK; }));
  return g;
}

test('wall kicks: I piece against the left wall uses the table (not a plain rotation)', () => {
  const g = board([]);
  g.cur = { t: ID.I, r: 1, x: -2, y: 5 }; // vertical I hugging the left wall (column 0)
  assert.ok(E.fits(g, g.cur));
  assert.ok(E.rotate(g, 1)); // R -> 2 needs a kick to stay in bounds
  assert.ok(E.cellsOf(g.cur).every(([x]) => x >= 0 && x < 10));
  assert.equal(g.cur.r, 2);
});

// any rotation (from a free spot) that, after a hard drop, clears `lines` with a twist
function twistInto(rows, lines) {
  for (let x = -1; x < 9; x++) for (let y = 0; y < 8; y++) for (let r = 0; r < 4; r++) for (const dir of [1, -1]) {
    const h = board(rows);
    h.cur = { t: ID.T, r, x, y };
    if (!E.fits(h, h.cur) || !E.rotate(h, dir)) continue;
    const kick = h.lastRot.kick;
    if (E.ghostY(h) !== h.cur.y) continue; // must already rest (the rotation is the last action)
    E.takeEvents(h);
    E.hardDrop(h);
    const c = E.takeEvents(h).find(e => e.e === 'clear');
    if (c && c.lines === lines && c.twist) return { ...c, kick };
  }
  return null;
}

test('twist double: the classic slot is a full twist and sends 4', () => {
  const c = twistInto([
    '##........',
    '#...######',
    '##.#######',
  ], 2);
  assert.ok(c, 'found');
  assert.equal(c.twist, 'twist');
  assert.equal(c.attack, 4);
  assert.equal(c.key, 'tdouble');
});

test('twist triple via the last kick is a full twist (sends 6)', () => {
  // a standard triple-twist slot: the piece rotates in using the (±1, ±2) kick
  const g = board([
    '###.......',
    '##........',
    '##.#######',
    '##..######',
    '##.#######',
  ]);
  g.cur = { t: ID.T, r: 3, x: 2, y: 3 }; // pointing left, beside the overhang
  // place it so a clockwise→ counter-clockwise rotation needs kick 4; search for the rotation that lands
  let found = null;
  for (let x = 0; x < 8 && !found; x++) for (let y = 0; y < 8 && !found; y++) for (let r = 0; r < 4 && !found; r++) {
    for (const dir of [1, -1]) {
      const h = board(['###.......', '##........', '##.#######', '##..######', '##.#######']);
      h.cur = { t: ID.T, r, x, y };
      if (!E.fits(h, h.cur)) continue;
      if (!E.rotate(h, dir)) continue;
      if (h.lastRot.kick !== 4) continue;
      E.takeEvents(h);
      E.hardDrop(h);
      const c = E.takeEvents(h).find(e => e.e === 'clear');
      if (c && c.lines === 3) { found = c; break; }
    }
  }
  assert.ok(found, 'a kick-4 rotation into the triple slot exists');
  assert.equal(found.twist, 'twist');
  assert.equal(found.attack, 6);
});

test('the 7-bag: identical for a seed, every bag has all seven', () => {
  const a = Array.from({ length: 70 }, (_, i) => E.pieceAt('room-seed', i));
  const b = Array.from({ length: 70 }, (_, i) => E.pieceAt('room-seed', i));
  assert.deepEqual(a, b);
  for (let k = 0; k < 10; k++) assert.deepEqual(a.slice(k * 7, k * 7 + 7).sort(), [1, 2, 3, 4, 5, 6, 7]);
  const c = Array.from({ length: 70 }, (_, i) => E.pieceAt('other', i));
  assert.notDeepEqual(a, c);
});

test('spawn: pieces enter at the top centre, the next queue shows 5', () => {
  const g = E.createEngine({ seed: 's' });
  E.start(g);
  assert.equal(E.nextQueue(g).length, 5);
  const ys = E.cellsOf(g.cur).map(c => c[1]);
  assert.ok(Math.min(...ys) === 19, `enters the visible field (row ${Math.min(...ys)})`);
  const xs = E.cellsOf(g.cur).map(c => c[0]);
  assert.ok(Math.min(...xs) >= 3 && Math.max(...xs) <= 6);
});

test('lock delay ~500 ms, reset by moves at most 15 times', () => {
  const g = E.createEngine({ seed: 's', level: 1 });
  E.start(g);
  E.hardDrop(g); // lock one to get a fresh piece
  E.takeEvents(g);
  while (E.stepDown(g)) { /* down to the floor */ }
  tick(g, 480);
  assert.ok(g.cur, 'still moving at 480 ms');
  tick(g, 40);
  assert.ok(E.takeEvents(g).some(e => e.e === 'lock'), 'locked after 500 ms');
  // resets: wiggle forever — it must still lock
  while (E.stepDown(g)) { /* floor */ }
  let locked = false;
  for (let i = 0; i < 40 && !locked; i++) {
    tick(g, 300);
    E.move(g, i % 2 ? 1 : -1);
    locked = E.takeEvents(g).some(e => e.e === 'lock');
  }
  assert.ok(locked, 'the reset limit forces a lock');
});

test('hold: once per drop, swaps with the held piece', () => {
  const g = E.createEngine({ seed: 'h' });
  E.start(g);
  const first = g.cur.t;
  assert.ok(E.holdPiece(g));
  assert.equal(g.hold, first);
  assert.equal(E.holdPiece(g), false, 'only once per drop');
  E.hardDrop(g);
  const now = g.cur.t;
  assert.ok(E.holdPiece(g));
  assert.equal(g.cur.t, first);
  assert.equal(g.hold, now);
});

test('scoring: lines × level, combo, back-to-back, perfect clear', () => {
  const g = board(['#########.', '#########.', '#########.', '#########.']);
  g.mode = 'rush';
  g.cur = { t: ID.I, r: 1, x: 7, y: 6 };
  E.hardDrop(g);
  const evs = E.takeEvents(g);
  const ev = evs.find(e => e.e === 'clear');
  const rows = evs.find(e => e.e === 'hard').rows;
  assert.equal(ev.lines, 4);
  assert.equal(ev.pc, true, 'board empty after = perfect clear');
  assert.equal(g.score, 2 * rows + 800 + 2000, 'hard drop 2/row + four lines 800 + perfect clear 2000 (level 1)');
  // a second clear in a row adds the combo bonus (50 × combo × level)
  const h = board(['#########.', '.#########']);
  h.mode = 'rush';
  h.combo = 0;
  h.cur = { t: ID.I, r: 1, x: 7, y: 8 };
  E.hardDrop(h);
  const c2 = E.takeEvents(h).find(e => e.e === 'clear');
  assert.equal(c2.pts, 100 + 50);
  assert.equal(E.CLEAR_RANK[g.best.k], E.CLEAR_RANK.pc);
});

test('attack table: 1 = 0, 2 = 1, 3 = 2, 4 = 4, back-to-back +1, combos add rows', () => {
  const send = (rows, pieceCol = 9) => {
    const g = board(rows.map(r => r));
    g.cur = { t: ID.I, r: 1, x: pieceCol - 2, y: 10 };
    E.hardDrop(g);
    return E.takeEvents(g).find(e => e.e === 'clear');
  };
  const filled = n => Array.from({ length: n }, () => '#########.');
  // keep a junk row under so it isn't a perfect clear
  assert.equal(send([...filled(1), '.#########']).attack, 0);
  assert.equal(send([...filled(2), '.#########']).attack, 1);
  assert.equal(send([...filled(3), '.#########']).attack, 2);
  assert.equal(send([...filled(4), '.#########']).attack, 4);
  // back-to-back four-line clears
  const g = board([...filled(8), '.#########']);
  g.cur = { t: ID.I, r: 1, x: 7, y: 12 };
  E.hardDrop(g);
  const first = E.takeEvents(g).find(e => e.e === 'clear');
  g.cur = { t: ID.I, r: 1, x: 7, y: 12 };
  E.hardDrop(g);
  const second = E.takeEvents(g).find(e => e.e === 'clear');
  assert.equal(first.attack, 4);
  assert.equal(second.b2b, true);
  assert.equal(second.attack, 4 + 1 + E.comboAttack(1), 'b2b +1 and the combo bonus');
});

test('countering cancels incoming junk first; the rest is sent', () => {
  const g = board(['#########.', '#########.', '#########.', '#########.', '.#########']);
  E.receive(g, { n: 3, gap: 4, from: 'bob', delayMs: 5000 });
  g.cur = { t: ID.I, r: 1, x: 7, y: 10 };
  E.hardDrop(g);
  const ev = E.takeEvents(g);
  assert.equal(ev.find(e => e.e === 'counter').n, 3);
  assert.equal(ev.find(e => e.e === 'send').n, 1);
  assert.equal(E.pendingTotal(g), 0);
});

test('junk lands after its delay on the next lock without a clear; one gap column per attack', () => {
  const g = E.createEngine({ seed: 'j', mode: 'battle' });
  E.start(g);
  E.receive(g, { n: 2, gap: 6, from: 'amy', delayMs: 1000 });
  E.hardDrop(g); // lands? not yet: delay not passed
  assert.equal(E.pendingTotal(g), 2);
  tick(g, 1100);
  E.hardDrop(g);
  assert.equal(E.pendingTotal(g), 0);
  for (let y = 0; y < 2; y++) {
    const row = Array.from({ length: 10 }, (_, x) => g.cells[y * 10 + x]);
    assert.equal(row.filter(c => c === E.JUNK).length, 9);
    assert.equal(row[6], 0, 'the gap');
  }
});

test('badges boost attacks with fractional carry', () => {
  assert.equal(E.badgeBonus(0), 0);
  assert.equal(E.badgeBonus(1), 0.25);
  assert.equal(E.badgeBonus(3), 0.5);
  assert.equal(E.badgeBonus(6), 0.75);
  assert.equal(E.badgeBonus(10), 1);
  const g = board(['#########.', '#########.', '.#########']);
  g.badges = 1; // +25 %: a double (1) sends 1.25 -> 1 now, 0.25 carried
  g.cur = { t: ID.I, r: 1, x: 7, y: 10 };
  E.hardDrop(g);
  assert.equal(E.takeEvents(g).find(e => e.e === 'send').n, 1);
  assert.ok(Math.abs(g.frac - 0.25) < 1e-9);
});

test('top out: a piece that cannot spawn ends the game; junk pushing over the top too', () => {
  const g = E.createEngine({ seed: 't', mode: 'battle' });
  for (let y = 0; y < 22; y++) for (let x = 0; x < 10; x++) if (x !== 0) g.cells[y * 10 + x] = 8;
  E.start(g);
  assert.equal(g.over, true);
  const h = E.createEngine({ seed: 't', mode: 'battle' });
  E.start(h);
  for (let i = 0; i < 4 && !h.over; i++) E.insertJunk(h, 10, 0);
  assert.equal(h.over, true);
});

test('save/restore: board, score, queue position and pending junk survive', () => {
  const g = E.createEngine({ seed: 'r', mode: 'battle' });
  E.start(g);
  for (let i = 0; i < 6; i++) { E.move(g, i % 3 - 1); E.hardDrop(g); }
  E.receive(g, { n: 2, gap: 3, from: 'x', id: 'k1' });
  const s = JSON.parse(JSON.stringify(E.save(g)));
  const h = E.createEngine({ seed: 'r', mode: 'battle' });
  E.restore(h, s);
  assert.equal(E.boardString(h), E.boardString(g));
  assert.equal(h.n, g.n);
  assert.equal(h.score, g.score);
  assert.equal(h.cur.t, E.pieceAt('r', g.n));
  assert.equal(E.pendingTotal(h), 2);
});

test('save/restore after a hold swap brings back the piece that was in play', () => {
  const g = E.createEngine({ seed: 'swap', mode: 'battle' });
  E.start(g);
  E.holdPiece(g);           // hold the first piece, the second comes in
  E.hardDrop(g);
  E.holdPiece(g);           // swap: the first piece comes back out of hold
  const inPlay = g.cur.t;
  const h = E.createEngine({ seed: 'swap', mode: 'battle' });
  E.restore(h, JSON.parse(JSON.stringify(E.save(g))));
  assert.equal(h.cur.t, inPlay);
  assert.equal(h.hold, g.hold);
  assert.equal(h.held, true);
});

test('gravity speeds up with the level', () => {
  assert.equal(Math.round(E.gravityMs(1)), 1000);
  assert.ok(E.gravityMs(5) < E.gravityMs(4));
  assert.ok(E.gravityMs(15) >= 1000 / 60);
});
