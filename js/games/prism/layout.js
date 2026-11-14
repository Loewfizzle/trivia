// PRISM DROP — THE LAYOUT (PD-1 — THE MAX BOARD, the owner's plan: docs/games/plan.md "PRISM DROP — THE REWORK PLAN"). PURE (no DOM): the
// view measures the screen when it changes (never in the frame loop) and paints these numbers as CSS custom properties.
//
//   the corner row (☰ · the top line · the music) = TOP pt under the safe area; under it THE FIELD, centred in the space left:
//   [ 12 pt ][ THE BOARD — 10 × 20 cells ][ 8 pt ][ THE RAIL — 34 pt ][ 12 pt ]   (the LEFT slam setting mirrors the rail to the board's left)
//   The cell is as big as the width allows, the height then checked (20 rows must fit — never clipped, never scrolled), and snapped to the
//   phone's device pixels (an iPhone: thirds of a point) so the board's sprites land on whole pixels at the full 3×.
//   HOLD + NEXT float INSIDE the board's top corners (slim see-through panels); the rail's tiles stack from its top, SLAM at its foot.
//   THE BUTTONS scheme only: the board shrinks to fit the button bar under it; GESTURES (the default) gets the full MAX BOARD.
//   PD-6 — THE SPARE-WIDTH COLUMN: when the cell is HEIGHT-bound (Safari WITH its toolbars — 20 square rows can't get wider without getting
//   taller) the spare width is no longer split as empty strips: the board sits at the outer margin and the spare goes to the rail + SLAM
//   column (34 → COL_MAX pt); SLAM grows with it (the column − SLAM_PAD, centred across the column at its foot — THE DROP A). WIDTH-bound (fullscreen / a home-screen app / a
//   narrow phone / a desktop's MAX_CELL) = PD-1's board + rail exactly.
//   THE DROP B ADD-ON (Ben, Nov 13 9:56 pm — his home-screen app's SLAM was still ~40 pt): in EVERY layout SLAM = THE WHOLE STRIP from the board's
//   edge to the screen's safe edge − SLAM_RIM × 2 (its chrome rim clear of both), centred across that strip at the column's foot (`slamX` = its
//   centre's shift from the column's centre, outward); never the board's width, the rail tiles keep theirs; LEFT mirrors it. Capped at SLAM_CAP
//   (the widest phone strip) so a desktop / tablet's wide margins never make a giant button.
import { W, VISIBLE } from './engine.js';
import { tierOf, TOP_TIER } from './tiers.js';

export const MARGIN = 12;     // the screen's outer margin (pt)
export const GAP = 8;         // board ↔ rail
export const RAIL = 34;       // the rail's width
export const TOP = 52;        // the corner row under the safe area (☰ + the music are 36 pt at +10)
export const AIR = 8;         // the least air above + below the board
export const MAX_CELL = 44;   // a desktop / a tablet: the board stops growing here
export const TILE_MAX = 54;   // a rail tile's height (shrinks to fit 7 opponents)
export const TILE_MIN = 22;
export const TILE_GAP = 6;
export const COL_MAX = 72;    // PD-6: the widest the rail + SLAM column grows into the spare width
export const SLAM_PAD = 6;    // THE DROP A Group 0 (PD-6's review, Ben): SLAM's diameter = the column − this — AS BIG AS THE COLUMN ALLOWS, its chrome rim 3 pt
                              //   clear of each edge (PD-6 had −10 / max 56 → 56 / 50 / 51 pt; now ≈ 62 pt at 390 in Safari with its toolbars)
export const SLAM_MAX = COL_MAX - SLAM_PAD;   // the biggest SLAM in THE DROP A's column rule: 66 (kept for reference)
export const SLAM_RIM = 4;    // THE DROP B add-on: the clearance each side of SLAM inside the strip (board edge … SLAM … the screen's safe edge) — "minus ~8 pt"
export const SLAM_CAP = GAP + COL_MAX + MARGIN - 2 * SLAM_RIM;   // the widest strip a phone has (the widest column at the margin): 84

/**
 * { W0, H0 (the screen, pt), safe: { t, r, b, l }, scheme: 'gesture' | 'buttons', spectating, btnScale (0–1), tier (2 | 1 | 0), dpr, n (opponents
 *   on the rail), duel (one opponent left — its tile shows their board) }
 * → { cell, boardW, boardH, fieldW, topH, btnH, railW, gap, hold: { w, h }, next: { w, h }, pieceCell, slamD, slamX (THE DROP B: its shift outward from
 *     the column's centre), strip (board edge → the screen's safe edge), slamArea, tileH, duelCell,
 *     boardDpr, fxDpr, wide (PD-6: the column took spare width) }
 */
export function prismLayout({ W0, H0, safe = {}, scheme = 'gesture', spectating = false, btnScale = 0.5, tier = TOP_TIER, dpr = 1, n = 1, duel = false }) {
  const s = { t: safe.t || 0, r: safe.r || 0, b: safe.b || 0, l: safe.l || 0 };
  const q = Math.max(1, Math.min(3, dpr || 1));
  const gesture = scheme !== 'buttons';
  const btnH = !gesture && !spectating ? Math.round(118 + 46 * btnScale) : 0;
  const cellW = (W0 - s.l - s.r - 2 * MARGIN - GAP - RAIL) / W;
  const cellH = (H0 - s.t - TOP - s.b - btnH - 2 * AIR) / VISIBLE;
  // snapped DOWN to the device's pixel grid (never bigger than the space)
  const cell = Math.max(10, Math.floor(Math.min(cellW, cellH, MAX_CELL) * q) / q);
  const boardW = cell * W, boardH = cell * VISIBLE;
  // PD-6 — THE SPARE-WIDTH COLUMN: height-bound (and not stopped by MAX_CELL) → the width the board can't use goes to the column
  const heightBound = cellH < cellW && cellH < MAX_CELL;
  const spare = W0 - s.l - s.r - 2 * MARGIN - boardW - GAP;
  const railW = heightBound ? Math.max(RAIL, Math.floor(Math.min(spare, COL_MAX) * q) / q) : RAIL;
  const wide = railW > RAIL;
  // THE DROP B add-on — THE STRIP: the field is centred in the safe width (.pd-stage), so the outer margin = half of what the field leaves; the
  // strip = the gap + the column + that margin; SLAM = the strip − the rim each side (whole points), at least the old 36–44 pt never past the strip
  const outer = Math.max(0, (W0 - s.l - s.r - (boardW + GAP + railW)) / 2);
  const strip = GAP + railW + outer;
  const slamD = Math.max(36, Math.min(SLAM_CAP, Math.floor(strip - 2 * SLAM_RIM)));
  const slamX = Math.round((SLAM_RIM + slamD / 2 - (GAP + railW / 2)) * q) / q;   // (its centre from the column's centre, toward the screen's edge)
  void btnScale;   // (the BUTTON SIZE slider now sizes the BUTTONS scheme's bar only — SLAM is the strip's)
  const slamArea = gesture && !spectating ? slamD + 10 : 0;
  const count = Math.max(1, n | 0);
  const free = boardH - slamArea;
  const duelCell = duel ? Math.max(2, Math.min(wide ? 5 : 3, Math.floor((railW - 4) / W))) : 0;
  const tileH = duel
    ? Math.min(free, duelCell * VISIBLE + 22)
    : Math.max(TILE_MIN, Math.min(TILE_MAX, Math.floor((free - (count - 1) * TILE_GAP) / count)));
  const hold = { w: Math.round(cell * 2), h: Math.round(cell * 1.6) };
  const next = { w: Math.round(cell * 4.5), h: hold.h };
  // a preview piece: 4 cells across a NEXT slot (a third of the panel) + 2 rows under the label
  const pieceCell = Math.max(6, Math.floor(Math.min((next.w / 3 - 6) / 4, (hold.h - 15) / 2) * q) / q);
  return {
    W0, H0, cell, boardW, boardH, fieldW: boardW + GAP + railW, topH: TOP, btnH, railW, gap: GAP,
    hold, next, pieceCell, slamD, slamX, strip, slamArea, tileH, duelCell, wide,
    // THE BOARD at the phone's FULL pixel ratio (3× on an iPhone); only the LAST tier steps it to 2× (PD-3 — tiers.js: the light, the spill +
    // the particles step down first). The world + the shards keep their own reduced resolution (fxDpr)
    boardDpr: Math.min(q, tierOf(tier).board),
    fxDpr: tierOf(tier).fx,
  };
}

/** the board cells a corner panel covers (HOLD top-left, NEXT top-right) — for the fade while a piece passes under it.
 *  → { x0, x1, y0 } in board cells: columns [x0, x1), rows y ≥ y0 (row 0 = the bottom) */
export function panelCells(L, which, inset = 4) {
  const p = which === 'hold' ? L.hold : L.next;
  const left = which === 'hold' ? inset : L.boardW - inset - p.w;
  const x0 = Math.floor(left / L.cell), x1 = Math.ceil((left + p.w) / L.cell);
  const rows = Math.ceil((inset + p.h) / L.cell);
  return { x0: Math.max(0, x0), x1: Math.min(W, x1), y0: VISIBLE - rows };
}
