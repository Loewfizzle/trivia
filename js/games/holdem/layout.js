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
  hand: 0.955,                      // your two cards' centre (they overlap the bottom rail; HE5: 0.95 → 0.955 — room for the action area)
};
/**
 * HE5 — THE ACTION AREA, built UP from your cards (Ben's HE4 review: real breathing room): the round buttons (≥ 56 pt) a few pt above your
 * cards, ≥ 12 pt of air, the presets (44 pt — the touch minimum), then YOUR BET's chip stack on the felt above them (never on a button).
 * The board for 5–8 players rises only as much as that needs (HE3's 0.6 when the screen allows it).
 */
export const ACT = { gapHand: 4, gapPB: 12, preset: 44, gapBet: 3, bet: 18, gapBoard: 3, btn: 56 };
/** the round buttons' gap (× s) — HE5: wider (HE4: 20) */
export const BTN_GAP = 30;
/** HE4 — the board's centre + its card width (pt at s = 1) by the number of OPPONENTS (k): heads-up · 3–4 players · 5–8 players */
export const BOARD = { 1: { y: 0.44, w: 64 }, 2: { y: 0.54, w: 56 }, 3: { y: 0.55, w: 56 }, rest: { y: 0.6, w: 56 } };
/** HE4 — the side rows (emblem centres, top → bottom) by k: from just under the top seat to just above the pot line (sideRowsPx) */
export const ROWS = { 4: [0.16], 5: [0.16], 6: [0.11, 0.274], 7: [0.128, 0.274] };   // (HE5: k = 6's first row 0.128 → 0.11 — still on the rail's curve; the first row; the rows' count = its length + 1)
/** HE10 (A28): with a top seat, the first side row sits 66–72 pt (× ss) under it — as low as the rows' spacing allows (its bet chip ran 5 pt
 *  into the top plate at 66) */
export const FIRST_UNDER_TOP = [66, 72];
/** HE5: the side rows never closer than a seat's block (94 pt × ss) */
export const ROW_MIN = 94.5;
/** HE11: the air between two side seats' blocks when the short-phone squeeze runs (pt — the SE at 8 players) */
export const ROW_AIR = 4;
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
  // HE5 — THE ACTION AREA from the bottom up (ACT): your cards → the buttons → 12 pt → the presets → your bet's stack
  const handCard = { w: 78 * s, h: 108 * s }, handY = at(Y.hand);
  const btn = Math.max(ACT.btn, ACT.btn * s);
  const buttons = handY - handCard.h / 2 - ACT.gapHand * s - btn / 2;
  const presets = buttons - btn / 2 - Math.max(ACT.gapPB, ACT.gapPB * s) - ACT.preset / 2;
  let ss = Math.min(1, s);
  // the opponents: uniform + evenly spaced on the rail (logic.js#seatSlots); the side rows evenly between `first` and `last` (in px — the
  // seats' blocks are fixed sizes (× ss) while the band scales with the table, so the limits are the real pieces, not fractions)
  const slots = seatSlots(k);
  const topY = at(Y.top);
  // YOUR BET above the presets — unless that would squeeze the side rows closer than a seat's block (a short phone, 5–8 players): then it
  // sits on the felt LEFT of your cards, under FOLD (still never on a button) and the board keeps the room
  const place = (above, ss) => {
    const myBet = above ? presets - ACT.preset / 2 - ACT.gapBet - ACT.bet / 2 : null;
    const floor = above ? myBet - ACT.bet / 2 : presets - ACT.preset / 2;
    const boardY = Math.min(at(B.y), floor - ACT.gapBoard - boardCard.h / 2);
    const pot = boardY - boardCard.h / 2 - 17 * s;     // the POT line sits just above the board, wherever the board is
    const rows = sideRowsPx(k, { at, ss, s, topY, pot, boardTop: boardY - boardCard.h / 2 });
    const gap = rows.length > 1 ? rows[1] - rows[0] : Infinity;
    return { myBet, boardY, pot, rows, gap };
  };
  let P = place(true, ss);
  if (P.gap < ROW_MIN * ss) P = place(false, ss);
  // (an SE-height phone with 8 at the table: the seats a hair smaller — never below 0.74 — rather than touching. HE11 (FR7-B's NICE): with
  //  ROW_AIR between two side seats — a showdown's hand tag sat 1–2 pt off the next seat's emblem + cards on the SE, in WebKit's text metrics
  //  a touch; the squeeze runs until the rows (which move with ss) hold the air. A phone that never squeezes is untouched)
  if (P.myBet == null) for (let i = 0; i < 4 && P.gap < (ROW_MIN + ROW_AIR) * ss; i++) {
    ss = Math.max(0.74, Math.min(ss, P.gap / (ROW_MIN + ROW_AIR)));
    P = place(false, ss);
  }
  const { boardY, pot, rows } = P;
  const myBet = P.myBet != null ? { x: box.x + box.w / 2, y: P.myBet, above: true }
    : { x: box.x + box.w / 2 - handCard.w * 0.92 - 40, y: handY - 30 * s, above: false };
  let li = 0, ri = 0;
  const left = [...rows].reverse();
  const inset = 34 * Math.min(1, s + 0.1);                                        // a side seat's emblem centre from the box's edge (on the rail)
  const seats = slots.map(q => {
    if (q.side === 'top') return { x: box.x + box.w / 2, y: topY, side: 'top', big: k === 1 };
    if (q.side === 'left') return { x: box.x + inset, y: left[li++], side: 'left', big: false };
    return { x: box.x + box.w - inset, y: rows[ri++], side: 'right', big: false };
  });
  return {
    s, ss, w, h, box, seats, k,                          // ss: a seat's block shrinks with a short table (never grows)
    pot,
    board: { y: boardY, card: boardCard, gap: 5 * s },
    presets, buttons, btn, myBet,
    hand: { y: handY, card: handCard },
    // (HE8: never past the screen's bottom — the SE with no home bar: 2–3 pt of your plate ran off; every other phone unchanged)
    plate: Math.min(handY + handCard.h / 2 + 4 * s, h - 38),
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
  // (HE5: every side pot is ONE line just above the pot — potSideTop; a bottom-row bet ends 3 pt above it. 4: the showdown's lift of a
  //  winning board card is 3 pt — css)
  const last = Math.min(potSideTop(pot, s) - 3 - 12 * ss, boardTop - 72 * ss - 4);
  // with a top seat (5, 7) the first row tucks in under its plate — HE10 (A9 / A28): under the top seat's TAG too (its bet chip clear of the
  // plate + the tag, the top seat's own bet lower — SEAT_BOX.top)
  const n = fr.length + 1;
  const first = k === 5 || k === 7 ? topY + Math.max(FIRST_UNDER_TOP[0] * ss, Math.min(FIRST_UNDER_TOP[1] * ss, last - (n - 1) * ROW_MIN * ss - topY)) : at(fr[0]);
  return Array.from({ length: n }, (_, i) => first + (last - first) * (n === 1 ? 0 : i / (n - 1)));
}

/** HE5 — the pot pill (22 · s tall, centred on `pot`) + ONE side-pot line above it (14 · s, 2 pt apart): that line's top — no seat piece reaches below it */
export const potSideTop = (pot, s) => pot - 11 * s - 2 - 14 * s;

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
  side: { main: [-32, -22, 84, 72], cards: [22, -21, 83, 22], bet: [66, -10, 136, 12] },          // (left; the right side mirrors x)
  // (HE4: its tag LEFT of the plate while a hand runs — HE10 (A9): once the hand is over it drops UNDER the plate (`tagDone` — the bets are gone then))
  top: { main: [-50, -22, 50, 55], tag: [-170, 26, -60, 42], tagDone: [-55, 56, 55, 72], cards: [28, -16, 92, 26], bet: [-35, 86, 35, 106] },
  big: { main: [-58, -28, 58, 80], cards: [34, -16, 100, 26], bet: [-35, 92, 35, 112] },
};
export function seatRects(seat, ss) {
  // (HE7 — a SIDEWAYS seat carries its own box: layout-wide.js#wideSeatBox)
  if (seat.wbox) { const a = r => ({ x0: seat.x + r[0] * ss, y0: seat.y + r[1] * ss, x1: seat.x + r[2] * ss, y1: seat.y + r[3] * ss }); return { main: a(seat.wbox.main), cards: a(seat.wbox.cards), bet: a(seat.wbox.bet), tag: a(seat.wbox.tag) }; }
  const g = seat.side === 'top' ? (seat.big ? SEAT_BOX.big : SEAT_BOX.top) : SEAT_BOX.side;
  const flip = seat.side === 'right';
  const r = ([a, b, c, d]) => (flip ? [-c, b, -a, d] : [a, b, c, d]);
  const abs = ([a, b, c, d]) => ({ x0: seat.x + a * ss, y0: seat.y + b * ss, x1: seat.x + c * ss, y1: seat.y + d * ss });
  return { main: abs(r(g.main)), cards: abs(r(g.cards)), bet: abs(r(g.bet)), ...(g.tag ? { tag: abs(r(g.tag)) } : {}) };
}
/** the bet chip's centre (the motion: a bet flies emblem → here; the sweep flies here → the pot) */
export function betSpot(seat, ss) {
  if (seat.wbox) return { x: seat.x + seat.wbox.betAt[0] * ss, y: seat.y + seat.wbox.betAt[1] * ss };
  const b = seatRects(seat, ss).bet;
  return { x: seat.side === 'right' ? b.x1 - 10 * ss : seat.side === 'left' ? b.x0 + 10 * ss : (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 };
}
/** the cards' centre at a seat (the deal flies here; a fold's backs leave from here) */
export function cardsSpot(seat, ss) {
  const c = seatRects(seat, ss).cards;
  if (seat.wbox) return { x: seat.wbox.cs < 0 ? c.x1 - 18 * ss : seat.wbox.cs > 0 ? c.x0 + 18 * ss : (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2 };
  return { x: seat.side === 'right' ? c.x1 - 18 * ss : c.x0 + 18 * ss, y: (c.y0 + c.y1) / 2 };
}
/** the D button's centre at a seat (the deal flies from it) — css: .he-seat .he-dealer (18 pt) */
export function dealerSpot(seat, ss) {
  if (seat.wbox) return { x: seat.x + seat.wbox.dealer[0] * ss, y: seat.y + seat.wbox.dealer[1] * ss };
  const o = seat.side === 'top' ? (seat.big ? [-31, 13] : [-25, 13]) : seat.side === 'right' ? [-21, 17] : [21, 17];
  return { x: seat.x + o[0] * ss, y: seat.y + o[1] * ss };
}
export function blocks(L) {
  const cx = L.box.x + L.box.w / 2, s = L.s;
  const bw = 5 * L.board.card.w + 4 * L.board.gap;
  const rect = (x, y, w, h) => ({ x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 });
  return {
    seats: L.seats.map(q => seatRects(q, L.ss)),
    pot: rect(cx, L.pot, 112 * s, 22 * s),                                   // "POT 12,345" (the main pot — the widest one)
    // HE5: every side pot on ONE line just above the pot, never wider than the pot ("SIDE 1,320 · 480" · "3 SIDE POTS · 2,140")
    side: { x0: cx - 56 * s, x1: cx + 56 * s, y0: potSideTop(L.pot, s), y1: L.pot - 11 * s - 2 },
    board: rect(cx, L.board.y, bw, L.board.card.h),
    presets: rect(cx, L.presets, 3 * 86 * s + 16, ACT.preset),
    buttons: rect(cx, L.buttons, 3 * L.btn + 2 * BTN_GAP * s, L.btn),
    // HE5: YOUR bet's chip stack + its amount, on the felt above the action area (never on a button)
    myBet: rect(L.myBet.x, L.myBet.y, L.myBet.above ? 110 : 70, ACT.bet),
    hand: rect(cx, L.hand.y, L.hand.card.w * 1.84, L.hand.card.h),
    // (HE4: THE AWARD BOX under the board at a hand's end — the gold winning hand + a pot's line; the between-hands buttons on the buttons' row)
    award: { x0: L.box.x + 12, x1: L.box.x + L.box.w - 12, y0: L.board.y + L.board.card.h / 2 + 9 * s, y1: L.board.y + L.board.card.h / 2 + 9 * s + 50 * s },
    minisDone: rect(cx, L.buttons, 280, 44),
  };
}
export const overlaps = (a, b, pad = 0) => a.x0 < b.x1 + pad && b.x0 < a.x1 + pad && a.y0 < b.y1 + pad && b.y0 < a.y1 + pad;
