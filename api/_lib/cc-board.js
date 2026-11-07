// COAST CLEAR — THE DAY's BOARD on the server (CC1 — docs/coastclear.md "The board maker"). The board comes from THE PEPPER (the server's
// secret — fb.js) through the daily seed (`dailySeed('coastclear', day)`, the same HMAC form; attempt a > 0 = `…:<day>:<a>`), so it is the
// same for everyone that day and NEVER computable from the date (the repo is public). cc-solve.js makes + proves it (no-guess).
// Built ONCE a day and kept server-side: dly/coastclear/{day}/b = { v, w, h, l: 'cell,cell,…', s: start, a: attempts } (the rules' default deny);
// a warm function keeps it in memory too. A phone never sees it — only the cells it opens (api/_lib/cc.js).
import { createHmac } from 'node:crypto';
import { rngFrom } from '../../js/core/rng.js';
import { makeBoard } from './cc-solve.js';
import { flood, countsOf } from '../../js/games/coastclear/logic.js';

export const BOARD_V = 1;
/** attempt a's seed for a day (a = 0 is exactly dailySeed('coastclear', day)) */
export const ccSeed = (pepper, day, a = 0) => parseInt(createHmac('sha256', String(pepper)).update(a ? `daily:coastclear:${day}:${a}` : `daily:coastclear:${day}`).digest('hex').slice(0, 8), 16);
/** THE DAY's BOARD, built (deterministic for a pepper + day) → { board, attempts, ms, tried } */
export function buildBoard(day, pepper) {
  if (!pepper) throw new Error('cc-board: the pepper');
  const t = Date.now();
  const r = makeBoard(a => rngFrom(ccSeed(pepper, day, a)));
  return { board: r.board, attempts: r.attempts, tried: r.tried, ms: Date.now() - t };
}
/** the stored form ↔ the board */
export const packBoard = (board, attempts = 0) => ({ v: BOARD_V, w: board.w, h: board.h, l: board.lights.join(','), s: board.start, a: attempts });
export function unpackBoard(p) {
  if (!p || p.v !== BOARD_V) return null;
  const board = { w: p.w, h: p.h, lights: String(p.l).split(',').map(Number), start: p.s };
  board.open = flood(board, countsOf(board), board.start).map(c => c[0]).sort((a, b) => a - b);
  return board;
}

const MEM = new Map();   // day → board (a warm function's copy; ≤ 3 days kept)
/** the day's board: memory → the stored copy → built + stored once (a transaction: two first calls at once keep ONE) */
export async function boardFor(day, { ref, val, pepper }) {
  if (MEM.has(day)) return MEM.get(day);
  const path = `dly/coastclear/${day}/b`;
  let board = unpackBoard(await val(path));
  if (!board) {
    const built = buildBoard(day, pepper);
    const tx = await ref(path).transaction(cur => (cur && cur.v === BOARD_V ? undefined : packBoard(built.board, built.attempts)));
    board = unpackBoard(tx.snapshot.val()) || built.board;
  }
  MEM.set(day, board);
  for (const k of [...MEM.keys()].slice(0, -3)) MEM.delete(k);
  return board;
}
export const forgetBoards = () => MEM.clear();
