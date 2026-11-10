// PD-5B — PRISM DROP's FINAL POLISH: THE BURST BEFORE THE COLLAPSE (neonfx.js#preClear — the stack as it was before a clear, held until the burst)
// + THE HOLIDAY HOOK (looks.js — a look takes a holiday variant from the city's calendar through ONE small interface; nothing visible yet).
import test from 'node:test';
import assert from 'node:assert/strict';
import { preClear, holdMs } from '../js/games/prism/neonfx.js';
import * as E from '../js/games/prism/engine.js';

const W = E.W, H = E.H;
const rowsOf = (cells) => Array.from({ length: cells.length / W }, (_, y) => [...cells.subarray(y * W, (y + 1) * W)]);

test('THE BURST BEFORE THE COLLAPSE — preClear puts the cleared rows back where they were, everything above lifted', () => {
  // a real clear through the engine: two rows full under a partial row → lock → the engine removes them at once
  const g = E.createEngine({ seed: 'pd5b', mode: 'rush' }); E.start(g);
  g.cells.fill(0);
  for (const y of [0, 1]) for (let x = 0; x < W; x++) g.cells[y * W + x] = x === 0 ? 0 : 1 + (x % 7);   // (column 0 open)
  for (let x = 0; x < 5; x++) g.cells[2 * W + x] = 3;                                                    // (a partial row above them)
  const before = Uint8Array.from(g.cells);
  // fill column 0 of rows 0–1 = the clear (by hand, as the engine would see it on lock)
  g.cells[0] = 6; g.cells[W] = 6; before[0] = 6; before[W] = 6;
  const ev = { e: 'clear', rows: [0, 1], cells: [[...before.subarray(0, W)], [...before.subarray(W, 2 * W)]], lines: 2 };
  // the engine's result: rows 0–1 gone, the partial row dropped to row 0
  const post = new Uint8Array(W * H); post.set(before.subarray(2 * W, H * W), 0);
  const pre = preClear(post, ev);
  assert.deepEqual(rowsOf(pre), rowsOf(before), 'the stack exactly as it was before the clear');
});

test('preClear: rows out of order + a clear in the middle; the board\'s size kept; a missing cell = junk', () => {
  const post = new Uint8Array(W * H);
  for (let x = 0; x < W; x++) { post[x] = 1; post[W + x] = 2; }   // (two rows left after the clear)
  const pre = preClear(post, { rows: [3, 1], cells: [[5, 5, 5, 5, 5, 5, 5, 5, 5, 5], [7, 7, 7, 7, 7, 7, 7, 7, 7]] });
  const r = rowsOf(pre);
  assert.equal(pre.length, W * H);
  assert.deepEqual(r[0], Array(W).fill(1)); assert.deepEqual(r[2], Array(W).fill(2));
  assert.deepEqual(r[1], [7, 7, 7, 7, 7, 7, 7, 7, 7, 8], 'the short row padded with junk');
  assert.deepEqual(r[3], Array(W).fill(5));
  assert.deepEqual(r[4], Array(W).fill(0));
});

test('holdMs: the race + a breath of the burst; reduced effects (no race) = no hold — the game itself never waits', () => {
  assert.equal(holdMs(230, false), 300);
  assert.equal(holdMs(170, false), 240);
  assert.equal(holdMs(1, false), 0);
  assert.equal(holdMs(230, true), 0);
  assert.ok(holdMs(150 + 20 * 4, false) <= 300, 'never longer than ~0.3 s (a 4-line clear)');
});

test('THE HOLIDAY HOOK — a dummy variant through the ONE interface: night palette + day paper / doodle overrides; no variant = nothing changes', async () => {
  const { VARIANTS, NIGHT_KEYS, withHoliday, holidayNow } = await import('../js/games/prism/holiday.js');
  const { neonPalette } = await import('../js/games/prism/neon.js');
  const { PAPERS } = await import('../js/games/prism/crayon.js');
  assert.deepEqual(Object.keys(VARIANTS), [], 'no holiday art yet — nothing visible changes now');
  const DUMMY = { halloween: { night: { palette: { edge: '#ff7a1a', frame: '#ff5a00', sparks: ['#ffb36b', '#9b5cff'], piece: ['x'] } }, day: { paper: { base: '#1b1410' }, world: 'pumpkins' } } };
  const pal = neonPalette('city'), night = withHoliday('night', { palette: pal }, 'halloween', DUMMY).palette;
  assert.equal(night.edge, '#ff7a1a'); assert.equal(night.frame, '#ff5a00'); assert.deepEqual(night.sparks, ['#ffb36b', '#9b5cff']);
  assert.equal(night.piece, pal.piece, 'the pieces\' colours never change (the families hold)'); assert.equal(night.well, pal.well);
  assert.equal(night.id, 'city+halloween', 'a new id — the board\'s sprite cache rebuilds');
  assert.ok(NIGHT_KEYS.every(k => k !== 'piece' && k !== 'glow'));
  const day = withHoliday('day', { paper: PAPERS[0], world: 'sunset' }, 'halloween', DUMMY);
  assert.equal(day.paper.base, '#1b1410'); assert.equal(day.paper.ink, PAPERS[0].ink); assert.equal(day.world, 'pumpkins');
  // no name / an unknown name / no row for that look → the SAME object (nothing rebuilt)
  const base = { palette: pal };
  assert.equal(withHoliday('night', base, null, DUMMY), base);
  assert.equal(withHoliday('night', base, 'easter', DUMMY), base);
  assert.equal(withHoliday('night', base, 'halloween'), base, 'the real (empty) table');
  assert.equal(withHoliday('day', base, 'christmas', { christmas: { night: { palette: { edge: '#fff' } } } }), base);
  // the calendar: a full holiday day with a variant → its name; an ordinary day / no variant → null
  assert.equal(holidayNow(new Date(2026, 9, 31, 20), DUMMY), 'halloween');
  assert.equal(holidayNow(new Date(2026, 9, 31, 20)), null, 'no variant in the real table');
  assert.equal(holidayNow(new Date(2026, 4, 12, 20), DUMMY), null);
});

test('PFIX-B (optional 11): a lock or landed rows inside the clear hold END it — the live stack + the landing preview at once', async () => {
  const { endsHold } = await import('../js/games/prism/neonfx.js');
  const E = await import('../js/games/prism/engine.js');
  // the view's loop (view.js#handleEvents): each event may end the hold, a clear sets it
  const run = (batches) => {
    let held = null;
    const log = [];
    for (const evs of batches) for (const ev of evs) {
      if (endsHold(ev)) held = null;
      if (ev.e === 'clear') held = { rows: ev.rows };
      log.push(held ? 'held' : 'live');
    }
    return { held, log };
  };
  const g = E.createEngine({ seed: 'pfixb-11', mode: 'battle' });
  E.start(g);
  for (let x = 0; x < E.W; x++) if (x < 4 || x > 7) g.cells[x] = 8;   // a row open in 4..7
  g.cur = { t: 1, r: 0, x: 4, y: 10 };                                 // the long piece, flat, over the gap (its cells x + 0..3)
  E.hardDrop(g);
  const clearBatch = E.takeEvents(g);
  assert.deepEqual(clearBatch.filter(e => ['lock', 'clear'].includes(e.e)).map(e => e.e), ['lock', 'clear'], 'the clearing piece: its lock comes before its clear');
  assert.equal(run([clearBatch]).held != null, true, 'the clear holds the picture (its own lock never ends it)');
  E.hardDrop(g);
  const next = E.takeEvents(g);
  assert.ok(next.some(e => e.e === 'lock'));
  assert.equal(run([clearBatch, next]).held, null, 'the next lock inside the hold ends it at once');
  assert.equal(run([clearBatch, [{ e: 'junk', n: 2, from: 'b' }]]).held, null, 'rows landing end it');
  assert.notEqual(run([clearBatch, [{ e: 'junk', n: 0 }], [{ e: 'move' }], [{ e: 'rotate' }]]).held, null, 'a move, a turn, nothing landing: still held');
  assert.equal(endsHold(null), false);
});

test('PFIX-B (optional 14): a half-risen ghost row is drawn only over empty cells — never half a ghost cell over a block', async () => {
  const { ghostBlocked } = await import('../js/games/prism/board.js');
  const cells = new Uint8Array(W * H);
  cells[0] = 5;                    // row 0, x 0: a block · row 1, x 0: empty
  assert.equal(ghostBlocked(cells, 0, 0.475, 1.475), true, 'straddling the block\'s row: tinted only (was drawn — the row under its middle, 0.975 → 0... or 1)');
  assert.equal(ghostBlocked(cells, 0, 1.475, 2.475), false, 'over empty rows: drawn');
  assert.equal(ghostBlocked(cells, 0, 1, 2), false, 'a whole row over an empty cell');
  assert.equal(ghostBlocked(cells, 0, 0, 1), true, 'a whole row over the block');
  assert.equal(ghostBlocked(cells, 1, 0, 1), false);
});
