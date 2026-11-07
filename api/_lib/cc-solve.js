// COAST CLEAR — THE NO-GUESS BOARD MAKER + THE SOLVER (CC1 — docs/coastclear.md "The board maker"), PURE (no node:, no DOM — the rules in
// js/games/coastclear/logic.js + a random stream passed in). cc-board.js feeds it the day's seeds from THE PEPPER; the look preview imports it
// through the dev server's /__dev/api-lib/ door to make its fixed test board (never the real day).
//
// ONE ATTEMPT: a start cell near the middle (its 3 × 3 kept clear, so it is a 0), the lights scattered over the rest, the opening = the start's
// flood (10–20 cells — big enough to start thinking). Then THE SOLVER plays it from that opening with PURE LOGIC only:
//   1. single cells — a number whose lights are all known → its other neighbours are safe; a number needing every unknown neighbour → all lights
//   2. pairs — two numbers sharing cells: the bounds on the shared part decide each side's own cells (covers the subset rule: 1-2-1, 1-1 …)
//   3. the light count — the lights left vs the cells left (all safe / all lights), + the count against each number (the rest of the board)
// If it can't finish without a guess, the board is thrown away — the next seed. Every board a phone ever gets was finished by this solver.
import { countsOf, flood, nbOf } from '../../js/games/coastclear/logic.js';
import { W, H, LIGHTS } from '../../js/games/coastclear/meta.js';

export const OPEN_MIN = 10, OPEN_MAX = 20;

/** the middle band a start may sit in (never at an edge: the opening reads as "the harbor mouth", centred) */
const startCells = (w, h) => {
  const out = [];
  for (let y = Math.floor(h / 3); y <= Math.ceil((2 * h) / 3) - 1; y++) for (let x = 2; x <= w - 3; x++) out.push(y * w + x);
  return out;
};

/** ONE candidate board from a random stream → { board, opening } | { why } (no solving here) */
export function candidate(rand, { w = W, h = H, lights = LIGHTS } = {}) {
  const starts = startCells(w, h);
  const start = starts[Math.floor(rand() * starts.length)];
  const keep = new Set([start, ...nbOf(w, h)[start]]);
  const cells = [];
  for (let i = 0; i < w * h; i++) if (!keep.has(i)) cells.push(i);
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const board = { w, h, lights: cells.slice(0, lights).sort((a, b) => a - b), start };
  const counts = countsOf(board);
  const opening = flood(board, counts, start);
  if (opening.length < OPEN_MIN || opening.length > OPEN_MAX) return { why: 'opening', board, size: opening.length };
  return { board, counts, opening };
}

/**
 * THE SOLVER: from the opening, pure logic only → { solved, steps, opened, safeLeft, rounds }. `steps` counts the deduction rounds; a round that
 * finds nothing = stuck (a guess would be needed) → solved: false.
 *   (the solver sees the whole board only to open a cell it has PROVEN safe — the way the server answers a dig)
 */
export function solve(board, counts = countsOf(board), opening = flood(board, counts, board.start), { trace = false } = {}) {
  const { w, h } = board, N = w * h, nb = nbOf(w, h);
  const total = board.lights.length, safeTotal = N - total;
  const open = new Set(opening.map(c => c[0]));
  const light = new Set();
  const log = trace ? [] : null;
  let rounds = 0, digs = 0;
  const openCell = i => { if (open.has(i)) return; digs++; for (const [c] of flood(board, counts, i, open)) open.add(c); };

  while (open.size < safeTotal) {
    rounds++;
    // the constraints: every open number with unknown neighbours → { cells (sorted), need }
    const cons = [];
    for (const i of open) {
      const n = counts[i];
      if (n < 0) continue;
      const unk = [], kl = nb[i].filter(j => light.has(j)).length;
      for (const j of nb[i]) if (!open.has(j) && !light.has(j)) unk.push(j);
      if (unk.length) cons.push({ cells: unk, need: n - kl, at: i });
    }
    const safe = new Set(), lit = new Set();
    let kind = 'single';   // (the trace: which rule found this round — CC2's GHOST RUN simulation paces a human by it)
    // 1. single cells
    for (const c of cons) {
      if (c.need === 0) c.cells.forEach(j => safe.add(j));
      else if (c.need === c.cells.length) c.cells.forEach(j => lit.add(j));
    }
    // 3a. the light count over everything unknown
    const unknown = [];
    for (let i = 0; i < N; i++) if (!open.has(i) && !light.has(i)) unknown.push(i);
    const left = total - light.size;
    if (!safe.size && !lit.size) {
      kind = 'count';
      if (left === 0) unknown.forEach(j => safe.add(j));
      else if (left === unknown.length) unknown.forEach(j => lit.add(j));
    }
    // 2. pairs (+ 3b. each number against the whole rest of the board — the count as one more constraint)
    if (!safe.size && !lit.size) {
      kind = 'pair';
      const all = [...cons, { cells: unknown, need: left, at: -1 }];
      const sets = all.map(c => new Set(c.cells));
      const byCell = new Map();
      all.forEach((c, k) => { if (c.at >= 0) for (const j of c.cells) { if (!byCell.has(j)) byCell.set(j, []); byCell.get(j).push(k); } });
      const seen = new Set();
      const pair = (a, b) => {
        const A = all[a], B = all[b], SA = sets[a], SB = sets[b];
        const common = A.cells.filter(j => SB.has(j));
        if (!common.length) return;
        const aOnly = A.cells.filter(j => !SB.has(j)), bOnly = B.cells.filter(j => !SA.has(j));
        const lo = Math.max(0, A.need - aOnly.length, B.need - bOnly.length);
        const hi = Math.min(common.length, A.need, B.need);
        for (const [X, only] of [[A, aOnly], [B, bOnly]]) {
          if (!only.length) continue;
          const maxIn = X.need - lo, minIn = X.need - hi;
          if (maxIn === 0) only.forEach(j => safe.add(j));
          else if (minIn === only.length) only.forEach(j => lit.add(j));
        }
        if (lo === hi) { if (lo === 0) common.forEach(j => safe.add(j)); else if (lo === common.length) common.forEach(j => lit.add(j)); }
      };
      for (let a = 0; a < cons.length; a++) {
        for (const j of cons[a].cells) for (const b of byCell.get(j) || []) {
          if (b === a) continue;
          const k = a < b ? `${a}|${b}` : `${b}|${a}`;
          if (seen.has(k)) continue;
          seen.add(k); pair(a, b);
        }
        pair(a, all.length - 1);   // the number against the board's light count
      }
    }
    if (!safe.size && !lit.size) return { solved: false, rounds, digs, opened: open.size, safeLeft: safeTotal - open.size, log };
    for (const j of lit) { if (counts[j] >= 0) throw new Error('solver: a safe cell called a light'); light.add(j); }
    for (const j of safe) { if (counts[j] < 0) throw new Error('solver: a light called safe'); openCell(j); }
    if (log) log.push({ safe: [...safe], lit: [...lit], kind });
  }
  return { solved: true, rounds, digs, opened: open.size, safeLeft: 0, log };
}

/**
 * THE MAKER: attempts from a seed stream (attempt a → its own random stream) until a board is solver-finishable → { board, attempts, tried }
 *   rngFor(a) → a random stream for attempt a (cc-board.js: the pepper's HMAC per attempt)
 */
export function makeBoard(rngFor, { max = 5000, ...size } = {}) {
  let opening = 0, stuck = 0;
  for (let a = 0; a < max; a++) {
    const c = candidate(rngFor(a), size);
    if (c.why) { opening++; continue; }
    const s = solve(c.board, c.counts, c.opening);
    if (s.solved) return { board: { ...c.board, open: c.opening.map(x => x[0]).sort((x, y) => x - y) }, attempts: a + 1, tried: { opening, stuck }, solve: s };
    stuck++;
  }
  throw new Error(`coast clear: no no-guess board in ${max} attempts`);
}
