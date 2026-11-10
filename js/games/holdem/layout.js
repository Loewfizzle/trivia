// HOLD'EM — THE PORTRAIT TABLE's numbers (HE3 — docs/holdem.md "THE TABLE SCREEN"), PURE: one function from the screen's size (+ its safe
// areas) and the number of opponents to every piece's place, in CSS px (= iPhone points). The design target is 390 × 844: the stadium
// table ≈ x 18–372, y 100–752; everything scales with the table's height (`s`) on a shorter phone, never wider than the 430 column.
// The view sets these once per resize (a ResizeObserver) — never a layout read in a frame loop.
import { seatSlots } from './logic.js';

/** the design's anchors as fractions of the table box's height (390 × 844: the box = y 100 → 752, 652 tall) */
export const Y = {
  top: 0.028,                       // the top seat's emblem centre (on the rail)
  band: [0.15, 0.395],              // the side seats' rows live in this band (emblem centres)
  pot: 0.527, board: 0.606,         // the POT line + the board's centre
  presets: 0.714, buttons: 0.8,     // the action area: the presets' centre + the round buttons' centre — always BELOW the board
  hand: 0.95,                       // your two cards' centre (they overlap the bottom rail)
};
export const DESIGN = { w: 390, h: 844, boxTop: 100, boxBottom: 752 };

/**
 * → { s, box: { x, y, w, h }, seats: [{ x, y, side, big }], pot, board: { y, card: { w, h } }, presets, buttons, hand: { y, card }, plate }
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
  // the opponents: uniform + evenly spaced on the rail (logic.js#seatSlots), the side rows spread over the band
  const slots = seatSlots(k);
  const sideYs = sideRows(k);
  let li = 0, ri = 0;
  const inset = 34 * Math.min(1, s + 0.1);                                        // a side seat's emblem centre from the box's edge (on the rail)
  const seats = slots.map(q => {
    if (q.side === 'top') return { x: box.x + box.w / 2, y: at(Y.top), side: 'top', big: k === 1 };
    if (q.side === 'left') return { x: box.x + inset, y: at(sideYs.left[li++]), side: 'left', big: false };
    return { x: box.x + box.w - inset, y: at(sideYs.right[ri++]), side: 'right', big: false };
  });
  const boardCard = k === 1 ? { w: 60 * s, h: 84 * s } : { w: 56 * s, h: 78 * s };
  const handCard = { w: 78 * s, h: 108 * s };
  return {
    s, ss: Math.min(1, s), w, h, box, seats,         // ss: a seat's block shrinks with a short table (never grows)
    pot: at(Y.pot), board: { y: at(Y.board), card: boardCard },
    presets: at(Y.presets), buttons: at(Y.buttons),
    hand: { y: at(Y.hand), card: handCard },
    plate: at(Y.hand) + handCard.h / 2 + 4 * s,
  };
}

/** The side rows' heights (fractions) for k opponents — the left side listed bottom → top (clockwise from your left), the right top → bottom. */
export function sideRows(k) {
  const [a, b] = Y.band, mid = (a + b) / 2;
  const three = [b, mid, a], two = [a + (b - a) * 0.88, a + (b - a) * 0.08];   // (two rows: as far apart as the band allows — a shown hand never covers the label above)
  switch (k) {
    case 2: return { left: [mid], right: [mid] };
    case 3: return { left: [mid + 0.03], right: [mid + 0.03] };
    case 4: case 5: return { left: two, right: [...two].reverse() };
    case 6: case 7: return { left: three, right: [...three].reverse() };
    default: return { left: [], right: [] };
  }
}
