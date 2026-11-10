// HOLD'EM — THE PORTRAIT TABLE's numbers (HE3 — docs/holdem.md "THE TABLE SCREEN"; HE4 — Ben's preview fixes), PURE: one function from the
// screen's size (+ its safe areas) and the number of opponents to every piece's place, in CSS px (= iPhone points). The design target is
// 390 × 844: the stadium table ≈ x 18–372, y 100–752; everything scales with the table's height (`s`) on a shorter phone, never wider than
// the 430 column. The view sets these once per resize (a ResizeObserver) — never a layout read in a frame loop.
// HE4: the BOARD follows the player count (heads-up: centred between the opponent and your buttons, bigger cards; 3–4 players: raised
// toward the middle; 5–8: HE3's place); the SIDE SEATS spread evenly from the top seat down to just above the pot line (~20 % more room
// between rows than HE3); the side pots stack ABOVE the main pot (each one short — they never reach the side seats' columns).
// `blocks(L)` = every piece's rectangle (the CSS's own offsets, below) — tests/holdem-phone.test.mjs checks none of them overlap.
import { seatSlots } from './logic.js';

/** the design's anchors as fractions of the table box's height (390 × 844: the box = y 100 → 752, 652 tall) */
export const Y = {
  top: 0.028,                       // the top seat's emblem centre (on the rail)
  presets: 0.714, buttons: 0.8,     // the action area: the presets' centre + the round buttons' centre — always BELOW the board
  hand: 0.95,                       // your two cards' centre (they overlap the bottom rail)
};
/** HE4 — the board's centre + its card width (pt at s = 1) by the number of OPPONENTS (k): heads-up · 3–4 players · 5–8 players */
export const BOARD = { 1: { y: 0.44, w: 64 }, 2: { y: 0.54, w: 56 }, 3: { y: 0.55, w: 56 }, rest: { y: 0.6, w: 56 } };
/** HE4 — the side rows (emblem centres, top → bottom) by k: from just under the top seat to just above the pot line (sideRowsPx) */
export const ROWS = { 4: [0.16], 5: [0.16], 6: [0.128, 0.274], 7: [0.128, 0.274] };   // (the first row; the rows' count = its length + 1)
export const DESIGN = { w: 390, h: 844, boxTop: 100, boxBottom: 752 };
const CARD_RATIO = 78 / 56;

/**
 * → { s, box: { x, y, w, h }, seats: [{ x, y, side, big }], pot, board: { y, card: { w, h }, gap }, presets, buttons, hand: { y, card }, plate }
 * w / h = the screen (the view's root); top / bottom = the safe areas; k = the opponents (0–7).
 */
export function tableLayout({ w, h, top = 0, bottom = 0, k = 0 }) {
  const cw = Math.min(w, 430), x0 = (w - cw) / 2;
  const boxTop = top + 54;                       // the header row above (☰ · the level line · music): 47 + 54 ≈ 100 on the design phone
  const boxBottom = h - bottom - 58;              // room under the table for your plate: 844 − 34 − 58 = 752
  const bh = Math.max(360, boxBottom - boxTop);
  const s = Math.max(0.74, Math.min(1.08, bh / 652));
  const box = { x: x0 + 18, y: boxTop, w: cw - 36, h: bh };
  const at = f => box.y + f * box.h;
  const B = BOARD[k] || BOARD.rest;
  // (the five cards always fit inside the felt — the rail 16 · s each side: 64 pt heads-up on the bigger phones, a little less on a 390)
  const feltW = box.w - 32 * s, bw = Math.min(B.w * s, (feltW - 8 - 4 * 5 * s) / 5), boardCard = { w: bw, h: bw * CARD_RATIO };
  const boardY = at(B.y);
  const pot = boardY - boardCard.h / 2 - 17 * s;     // the POT line sits just above the board, wherever the board is
  const ss = Math.min(1, s);
  // the opponents: uniform + evenly spaced on the rail (logic.js#seatSlots); the side rows evenly between `first` and `last` (in px — the
  // seats' blocks are fixed sizes (× ss) while the band scales with the table, so the limits are the real pieces, not fractions)
  const slots = seatSlots(k);
  const topY = at(Y.top);
  const rows = sideRowsPx(k, { at, ss, s, topY, pot, boardTop: boardY - boardCard.h / 2 });
  let li = 0, ri = 0;
  const left = [...rows].reverse();
  const inset = 34 * Math.min(1, s + 0.1);                                        // a side seat's emblem centre from the box's edge (on the rail)
  const seats = slots.map(q => {
    if (q.side === 'top') return { x: box.x + box.w / 2, y: topY, side: 'top', big: k === 1 };
    if (q.side === 'left') return { x: box.x + inset, y: left[li++], side: 'left', big: false };
    return { x: box.x + box.w - inset, y: rows[ri++], side: 'right', big: false };
  });
  const handCard = { w: 78 * s, h: 108 * s };
  return {
    s, ss, w, h, box, seats, k,                          // ss: a seat's block shrinks with a short table (never grows)
    pot,
    board: { y: boardY, card: boardCard, gap: 5 * s },
    presets: at(Y.presets), buttons: at(Y.buttons),
    hand: { y: at(Y.hand), card: handCard },
    plate: at(Y.hand) + handCard.h / 2 + 4 * s,
  };
}

/**
 * THE SIDE ROWS in px, top → bottom (HE4): `last` = just above the pot line (its bet clear of a side pot stacked over the pot, its block
 * clear of the board); `first` = ROWS' first fraction — or, with a top seat (5, 7), just under its plate. 2–3 opponents:
 * one row at the band's middle.
 */
export function sideRowsPx(k, { at, ss, s, topY, pot, boardTop }) {
  if (k === 2) return [at(0.2725)];
  if (k === 3) return [at(0.3025)];
  const fr = ROWS[k];
  if (!fr) return [];
  const last = Math.min(pot - 20 * s - 10.5 - 12 * ss - 2, boardTop - 72 * ss - 4);
  // with a top seat (5, 7) the first row tucks in just under its plate — its bet chip between the top seat's plate and the top seat's bet
  const first = k === 5 || k === 7 ? topY + 66 * ss : at(fr[0]);
  const n = fr.length + 1;
  return Array.from({ length: n }, (_, i) => first + (last - first) * (n === 1 ? 0 : i / (n - 1)));
}

/** The side rows for k opponents (their ORDER — the left side listed bottom → top, clockwise from your left; the right top → bottom; 2–3: one row). */
export function sideRows(k) {
  const mid = 0.2725;
  if (k === 2) return { left: [mid], right: [mid] };
  if (k === 3) return { left: [mid + 0.03], right: [mid + 0.03] };
  const n = ROWS[k] ? ROWS[k].length + 1 : 0, rows = Array.from({ length: n }, (_, i) => i);
  return { left: [...rows].reverse(), right: rows };
}

/**
 * THE PIECES' RECTANGLES (the CSS's offsets, css/holdem.css — keep the two in step): for the overlap test + the motion's start / end points.
 * A seat's offsets are in its own units (× ss around the emblem's centre). → { seats: [{ main, cards, bet }], pot, sides(n), board, presets, buttons, hand }
 */
export const SEAT_BOX = {
  side: { main: [-32, -22, 84, 72], cards: [26, -20, 72, 26], bet: [66, -10, 136, 12] },          // (left; the right side mirrors x)
  top: { main: [-58, -22, 58, 55], tag: [-170, 26, -60, 42], cards: [28, -16, 92, 26], bet: [-35, 86, 35, 106] },   // (HE4: its tag LEFT of the plate)
  big: { main: [-58, -28, 58, 80], cards: [34, -16, 100, 26], bet: [-35, 92, 35, 112] },
};
export function seatRects(seat, ss) {
  const g = seat.side === 'top' ? (seat.big ? SEAT_BOX.big : SEAT_BOX.top) : SEAT_BOX.side;
  const flip = seat.side === 'right';
  const r = ([a, b, c, d]) => (flip ? [-c, b, -a, d] : [a, b, c, d]);
  const abs = ([a, b, c, d]) => ({ x0: seat.x + a * ss, y0: seat.y + b * ss, x1: seat.x + c * ss, y1: seat.y + d * ss });
  return { main: abs(r(g.main)), cards: abs(r(g.cards)), bet: abs(r(g.bet)), ...(g.tag ? { tag: abs(r(g.tag)) } : {}) };
}
/** the bet chip's centre (the motion: a bet flies emblem → here; the sweep flies here → the pot) */
export function betSpot(seat, ss) {
  const b = seatRects(seat, ss).bet;
  return { x: seat.side === 'right' ? b.x1 - 10 * ss : seat.side === 'left' ? b.x0 + 10 * ss : (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 };
}
/** the cards' centre at a seat (the deal flies here; a fold's backs leave from here) */
export function cardsSpot(seat, ss) {
  const c = seatRects(seat, ss).cards;
  return { x: seat.side === 'right' ? c.x1 - 18 * ss : c.x0 + 18 * ss, y: (c.y0 + c.y1) / 2 };
}
export function blocks(L) {
  const cx = L.box.x + L.box.w / 2, s = L.s;
  const bw = 5 * L.board.card.w + 4 * L.board.gap;
  const rect = (x, y, w, h) => ({ x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 });
  return {
    seats: L.seats.map(q => seatRects(q, L.ss)),
    pot: rect(cx, L.pot, 112 * s, 22 * s),                                   // "POT 12,345" (the main pot — the widest one)
    sides: n => Array.from({ length: n }, (_, i) => rect(cx, L.pot - (i + 1) * 20 * s, 84, 17)),   // "SIDE 1 1,320", stacked above it
    board: rect(cx, L.board.y, bw, L.board.card.h),
    presets: rect(cx, L.presets, 3 * 86 * s + 16, 46),
    buttons: rect(cx, L.buttons, 3 * Math.max(56, 66 * s) + 2 * 20 * s, Math.max(56, 66 * s)),
    hand: rect(cx, L.hand.y, L.hand.card.w * 1.84, L.hand.card.h),
  };
}
export const overlaps = (a, b, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;
