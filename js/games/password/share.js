// THE PASSWORD — THE SHARE CARD (PW2 — docs/password.md "THE SHARE"): SHARE renders an IMAGE on a canvas (1080 × 1350, in the look on
// screen — night neon or the day sky): the sign, the two drawn doors, the result line ("7 GUESSES · 2:54" or the held line), both doors'
// MINI GRIDS (marks only — NO letters, NO words), neonspeakeasy.com. The headline: WELCOME IN · LOCKED OUT (the owner's ADD-ON). Sent through the phone's share sheet (navigator.share with the file)
// + ONE plain line (logic.js#shareLine: "THE PASSWORD #<n> · 7 guesses · neonspeakeasy.com" — #n = days since meta.js#PW_EPOCH). No file
// sharing → the line is shared (or copied) and the image is saved. No emoji anywhere. Lazy: the view imports this on the first tap.
// BOARD 2.0 B (the owner's add-on — SHARE TODAY = ONE CARD FROM EACH DAILY's OWN PIECES): the card is built from EXPORTED PIECES (the sign, the
// doors, the headline, the line, the grids) that BOTH this card and SHARE TODAY's section (`paintSection` — js/daily/share-today.js) call: never a
// redraw or a copy; this card stays pixel-identical (tests/integration/share-same.html checks it against the code before the split).
// SKINS 2A (the owner, Nov 14) — ONE RHYTHM + NO PILLS: the card and the section = the name · ONE big result (WELCOME IN · LOCKED OUT) · ONE
// stat line ("7 GUESSES · 2:54") · ONE art strip (the doors + their tiles) — js/daily/share.js#RHYTHM / OWN; the foot = the kit's (one straight
// neon line + the address, no frame); a hit tile's mark is a straight bar (no rounded capsule).
// SKINS 2B (the owner, Nov 14) — THE SHARE CARD's ONE RULE: the card and the section = THE PASSWORD — the NAME CARRIES THE RESULT (the kit's
// small neon name: GREEN when both doors opened, RED when locked out — no WELCOME IN / LOCKED OUT headline, no extra word) · ONE big TIME ·
// ONE grey stat line ("5 GUESSES") · the art (the section: the TILES ONLY, bigger — no doors; this card keeps its doors + their names over
// the tiles). The three text pieces are the kit's painters (js/daily/share.js#paintName · paintBig · paintStat).
// ADD-ON (Ben, Nov 14 11:25 am): on THIS card each room = ONE centred column — its small door + its label stacked and CENTRED over ITS OWN
// grid, the two columns TOP-ALIGNED, the pair centred, an even gap (paintRooms); in SHARE TODAY the tiles never shrink under a FLOOR (≈ 22 px
// on the 1080 card) — a tall grid makes its strip GROW (stripOf / sectionH: readability beats equal strip heights).
//   renderShare({ run, look }) → <canvas>      shareRun({ run, line, look }) → 'shared' | 'saved' | 'copied' | 'none'
//   paintSection(c, { run, look, W, H }) — SHARE TODAY's section (the rhythm's box, centred in W × H)
import { scoreOf, fmtTime, doorState, guessesLine, DOOR_NAMES, DOORS, HIT, NEAR } from './logic.js';
import { SHARE_W, SHARE_H, SITE, shareFrame, shareFoot, sendShare, spacedText, RHYTHM, OWN, paintName, paintBig, paintStat, MADE, FAILED, measureOf } from '../../daily/share.js';   // (DM1 — THE DAILY KIT: the card's frame + its sender)
export { SHARE_W, SHARE_H, SITE };
const LOOK = {
  night: { bg0: '#0d0a1c', bg1: '#05040c', sign: '#ff5ec4', signCore: '#fff2fa', ink: '#f4f6ff', dim: 'rgba(244,246,255,0.62)', faint: 'rgba(244,246,255,0.4)', good: '#3dff8b', close: '#ffd23d', red: '#ff3355', tile: 'rgba(255,255,255,0.05)', tileLine: 'rgba(255,255,255,0.16)', miss: 'rgba(0,0,0,0.42)', near: 'rgba(0,0,0,0.45)', hitInk: '#06130b', doorOn: '#ff5ec4', doorLock: 'rgba(255,255,255,0.28)', doorHeld: 'rgba(255,92,120,0.8)', room: '#ffc266', font: '"Orbitron", "Chakra Petch", system-ui, sans-serif' },
  day: { bg0: '#8ec6ff', bg1: '#f7fbff', sign: '#16305c', signCore: '#16305c', ink: '#14284a', dim: '#3a5582', faint: '#3a5582', heldInk: '#9c1a36', good: '#3dff8b', close: '#ffd23d', red: '#c0304a', tile: 'rgba(255,255,255,0.78)', tileLine: 'rgba(80,120,180,0.25)', miss: 'rgba(160,176,198,0.6)', near: 'rgba(255,255,255,0.9)', hitInk: '#06220f', doorOn: '#2f86ff', doorLock: 'rgba(22,48,92,0.32)', doorHeld: 'rgba(196,60,80,0.75)', room: '#ffd27a', font: 'ui-rounded, "SF Pro Rounded", "Chakra Petch", system-ui, sans-serif' },
};
/** the shared answer tokens as the page has them now (the colour-blind swap rides along) */
export function tokens(look) {
  const L = { ...LOOK[look] || LOOK.night };
  try {
    const cs = getComputedStyle(document.body);
    const g = cs.getPropertyValue('--good').trim(), c = cs.getPropertyValue('--close').trim();
    if (g) L.good = g; if (c) L.close = c;
  } catch { /* no DOM tokens */ }
  return L;
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

/** a drawn door (the same shape as doors.js, in canvas): state locked | on | open | held; S = the scale (1 = 34 × 44). PFIX-3 (FABLE REVIEW
 *  2 — S8): the LOOK is passed in — by day the leaf is a light panel (a room never opened was a near-black slab on the sunny card: the old
 *  test `L === LOOK.day` was never true — tokens() hands out a copy), a held door a light rose, the ajar leaf navy */
function door(c, x, y, S, st, L, look = 'night') {
  const day = look === 'day';
  const col = st === 'open' ? L.good : st === 'on' ? L.doorOn : st === 'held' ? L.doorHeld : L.doorLock;
  c.save(); c.translate(x, y); c.scale(S, S);
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (st === 'open') { c.fillStyle = L.room; c.globalAlpha = 0.95; c.fillRect(7, 4.5, 20, 38); c.globalAlpha = 1; }
  const frame = () => { c.beginPath(); c.moveTo(4.5, 42.5); c.lineTo(4.5, 5); c.arcTo(4.5, 2.5, 7, 2.5, 2.5); c.lineTo(27, 2.5); c.arcTo(29.5, 2.5, 29.5, 5, 2.5); c.lineTo(29.5, 42.5); c.moveTo(1.5, 42.5); c.lineTo(32.5, 42.5); };
  if (st === 'on' || st === 'open') { c.strokeStyle = col; c.lineWidth = 4.2; c.globalAlpha = 0.35; frame(); c.stroke(); c.globalAlpha = 1; }
  c.strokeStyle = col; c.lineWidth = 1.7; frame(); c.stroke();
  // the leaf: closed (a panel + its knob) or swung ajar (a narrow slab at the hinge)
  if (st === 'open') { c.fillStyle = day ? 'rgba(22,48,92,0.7)' : 'rgba(10,8,18,0.85)'; c.fillRect(5.5, 3.5, 7, 36); c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(6, 4, 6, 35); }
  else {
    c.fillStyle = st === 'held' ? (day ? 'rgba(255,214,222,0.92)' : 'rgba(60,10,20,0.5)') : day ? 'rgba(255,255,255,0.85)' : 'rgba(8,6,18,0.9)'; c.fillRect(7, 5, 20, 33);
    c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(7, 5, 20, 33);
    c.fillStyle = col; c.beginPath(); c.arc(22.5, 22, 1.7, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
/** a mini grid of marks (no letters): cell px, gap px */
function grid(c, marks, x, y, cell, gap, L) {
  marks.forEach((row, r) => row.forEach((m, i) => {
    const cx = x + i * (cell + gap), cy = y + r * (cell + gap);
    c.save();
    if (m === HIT) { c.shadowColor = L.good; c.shadowBlur = cell * 0.35; c.fillStyle = L.good; rr(c, cx, cy, cell, cell, cell * 0.18); c.fill(); c.shadowBlur = 0; c.fillStyle = '#fff'; c.fillRect(cx + cell * 0.18, cy + cell * 0.8, cell * 0.64, cell * 0.1); }
    else if (m === NEAR) { c.fillStyle = L.near; rr(c, cx, cy, cell, cell, cell * 0.18); c.fill(); c.strokeStyle = L.close; c.lineWidth = cell * 0.08; c.stroke(); c.fillStyle = L.close; c.beginPath(); c.arc(cx + cell * 0.78, cy + cell * 0.22, cell * 0.11, 0, Math.PI * 2); c.fill(); }
    else { c.fillStyle = L.miss; rr(c, cx, cy, cell, cell, cell * 0.18); c.fill(); c.strokeStyle = L.tileLine; c.lineWidth = cell * 0.05; c.stroke(); }
    c.restore();
  }));
}

// ---------------------------------------------------------------------------------------------- THE PIECES (this card + SHARE TODAY's section)
/** the daily's name (the kit paints it, in its result's colour) · the result: MADE (both doors opened) | FAILED (locked out) */
export const NAME = 'THE PASSWORD';
export const resultOf = run => (scoreOf(run).doors === DOORS ? MADE : FAILED);
/** the big TIME ("2:54") · the stat line ("5 GUESSES" — a locked-out run's too: the red name says it) */
export const timeOf = run => fmtTime(scoreOf(run).time);
/** THE ONE RULE (FIXES R3, the owner Nov 15): ONE big SCORE = the daily's MAIN MEASURE (config.js DAILIES `measure` — THE PASSWORD's is its
 *  GUESSES: "8 GUESSES" big), the other = the grey stat line (the time) */
const byGuesses = () => measureOf('password') === 'guesses';
export const bigOf = run => (byGuesses() ? guessesLine(run) : timeOf(run));
export const statOf = run => (byGuesses() ? timeOf(run) : guessesLine(run));
/** HIGH RISE DAILY B — THE BIG FIVE's line (share-today.js — text only): "5 GUESSES" / "2:54"; a locked-out run's fail word big — LOCKED OUT / its time */
export const fiveLine = ({ run } = {}) => (resultOf(run) === FAILED ? { big: 'LOCKED OUT', stat: timeOf(run) } : { big: bigOf(run), stat: statOf(run) });
/** THE ROOMS' sizes on the card (the door's scale — 1 = 34 × 44 — the tiles, the gap between the two columns, the label) */
export const ROOMS = Object.freeze({ S: 2.3, cell: 56, gap: 10, colGap: 110, label: 24, ls: 4, padDoor: 14, padLabel: 20 });
const roomsHead = () => 44 * ROOMS.S + ROOMS.padDoor + ROOMS.label + ROOMS.padLabel;
/** PURE: the rooms block's height for a run (the door + its label + the TALLEST grid) */
export const roomsH = run => { const rows = Math.max(0, ...run.doors.map(d => d.marks.length)); return roomsHead() + (rows ? rows * (ROOMS.cell + ROOMS.gap) - ROOMS.gap : -ROOMS.padLabel); };
/**
 * THE ROOMS (this card's art — the owner's add-on, Nov 14): each room = ONE CENTRED COLUMN — its small door, then its label (THE FRONT DOOR ·
 * THE BACK ROOM), stacked and centred over ITS OWN grid; both columns start at `top` (TOP-ALIGNED: a short grid never floats mid-height),
 * the pair centred on cx with an even gap. A label is always inside its own column (never beside a door, never over the other room). A
 * room's door + label keep its state's colour (a held room red). A room never played = its door + label alone.
 */
export function paintRooms(c, run, L, look, cx, top) {
  const G = ROOMS, gw = 5 * G.cell + 4 * G.gap, dw = 34 * G.S, dh = 44 * G.S;
  const n = DOOR_NAMES.length, x0 = cx - (n * gw + (n - 1) * G.colGap) / 2;
  DOOR_NAMES.forEach((name, i) => {
    const mid = x0 + i * (gw + G.colGap) + gw / 2, st = doorState(run, i), d = run.doors[i];
    door(c, mid - dw / 2, top, G.S, st, L, look);
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 ${G.label}px "Chakra Petch", system-ui, sans-serif`;
    // (S8: by day a failed room's label is a solid dark red, a room never opened the dim navy — both ≥ 4.5:1 on the sky)
    c.fillStyle = st === 'open' ? (look === 'day' ? '#1f7a45' : L.good) : st === 'on' ? L.doorOn : st === 'held' ? (L.heldInk || L.doorHeld) : L.faint;
    spacedText(c, name, mid + G.ls / 2, top + dh + G.padDoor + G.label / 2, G.ls);
    c.restore();
    if (d && d.marks.length) grid(c, d.marks, mid - gw / 2, top + roomsHead(), G.cell, G.gap, L);
  });
}
/** the mini grids of the doors attempted (marks only), centred on cx from `top` — BOTTOM-ALIGNED (PFIX-3 — Ben's call on N6, like the
 *  approved mockup: a short grid sits on the same floor as the tall one; this is SHARE TODAY's strip — the daily's own card keeps its
 *  top-aligned columns under their labels: paintRooms) */
export function paintGrids(c, run, L, cx, top, cell, gap, gapX) {
  const played = run.doors.filter(d => d.guesses.length);
  const gw = 5 * cell + 4 * gap, rows = Math.max(0, ...played.map(d => d.marks.length));
  const total = played.length * gw + (played.length - 1) * gapX;
  let x0 = (cx * 2 - total) / 2;
  for (const d of played) { grid(c, d.marks, x0, top + (rows - d.marks.length) * (cell + gap), cell, gap, L); x0 += gw + gapX; }
}

/** the share image (a canvas, 1080 × 1350) */
export function renderShare({ run, look = 'night', dayNo = null } = {}) {
  const L = tokens(look);
  const { cv, c, W, H } = shareFrame(L, look);   // (the ground + the day's sun — the kit)
  if (look === 'day') {
    for (const [x, y, w] of [[780, 300, 170], [320, 470, 190], [880, 640, 150]]) { const cl = c.createRadialGradient(x, y, 0, x, y, w); cl.addColorStop(0, 'rgba(255,255,255,0.85)'); cl.addColorStop(0.5, 'rgba(255,255,255,0.4)'); cl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = cl; c.save(); c.scale(1, 0.34); c.fillRect(0, 0, W, H / 0.34); c.restore(); }
  } else {
    const hz = c.createRadialGradient(W / 2, -80, 0, W / 2, -80, 700); hz.addColorStop(0, 'rgba(255,94,196,0.18)'); hz.addColorStop(1, 'rgba(255,94,196,0)'); c.fillStyle = hz; c.fillRect(0, 0, W, H);
  }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // THE ONE RULE (SKINS 2B): the name (green made · red locked out) · ONE big SCORE (FIXES R3: the GUESSES) · ONE grey stat line (the time) · THE ART (the two rooms, each ONE
  // centred column: its door + its label over its own grid — top-aligned, the pair centred) · the foot
  paintName(c, look, NAME, W / 2, OWN.nameY, OWN.namePx, W - 120, resultOf(run));
  paintBig(c, look, bigOf(run), W / 2, OWN.bigY, OWN.bigPx, W - 120);
  paintStat(c, look, statOf(run), W / 2, OWN.statY, OWN.statPx, W - 120);
  // (the rooms sit a little above the middle of the art box — a six-row room fills it)
  paintRooms(c, run, L, look, W / 2, OWN.artY + Math.max(0, (OWN.artBot - OWN.artY - roomsH(run)) * 0.4));
  // the day number + THE FOOT (the kit's)
  shareFoot(c, { dayNo, dim: L.dim, color: look === 'day' ? L.doorOn : L.sign, W, look });
  return cv;
}

// ---------------------------------------------------------------------------------------------- SHARE TODAY's SECTION
/** the section's box height in its own units — the rhythm's (SHARE TODAY scales every section by the same factor) */
export const SECTION_H = RHYTHM.H;
/** the biggest a tile prints in the strip (a short run — one or two rows a door — never balloons) · the SMALLEST, in px of the 1080 card
 *  (the owner's add-on: tiles shrink only to a floor — a tall grid makes the strip GROW instead; never a squashed sliver) */
export const TILE_MAX = 46, TILE_FLOOR = 22;
/**
 * PURE — the strip's layout for a run: the cell as big as the strip's height + the column's width allow (a grid = 5 cells + 4 gaps of 0.2,
 * 1.5 cells between the grids), never over TILE_MAX, never under the FLOOR (TILE_FLOOR px ON THE CARD: ÷ the section's scale k) — and the
 * strip as tall as its grids need (≥ the rhythm's). W = the section's width in its own units.
 */
export function stripOf(run, W = SHARE_W, k = 1) {
  const R = RHYTHM, played = run.doors.filter(d => d.guesses.length);
  const n = Math.max(1, played.length), rows = Math.max(1, ...played.map(d => d.marks.length));
  const byH = R.artH / (1.2 * rows - 0.2), byW = (W - 2 * R.COL) / (n * 5.8 - 0.8 + (n - 1) * 1.5);
  const cell = Math.max(TILE_FLOOR / Math.max(0.5, k), Math.min(TILE_MAX, byH, byW)), gap = cell * 0.2;
  const gridH = rows * cell + (rows - 1) * gap;
  return { cell, gap, gx: cell * 1.5, rows, n, gridH, stripH: gridH > R.artH + 0.01 ? gridH : R.artH };   // (a grid that just fills the strip never grows it by a rounding hair)
}
/** PURE — this section's natural height for a run (the rhythm's box, its strip grown for a tall grid) — share-today.js lays the card out by it */
export const sectionH = ({ run, W = SHARE_W, k = 1 } = {}) => RHYTHM.H - RHYTHM.artH + stripOf(run, W, k).stripH;
/**
 * THE PASSWORD as a section of SHARE TODAY — THE ONE RULE (SKINS 2B; js/daily/share.js#RHYTHM): the name · the big TIME · the stat line · the
 * art strip: the TILES ONLY (no doors — the owner: the tiles read small beside them), each door's grid side by side (top-aligned), as big
 * as the strip allows (≤ TILE_MAX a cell), READABLE always (≥ the floor — a LOCKED OUT door's six rows make the strip grow: `stripOf`),
 * centred. The result = the NAME's colour (+ the tiles: a cracked door ends on a full green row). The block centred in the box (W × H);
 * k = the section's scale on the card. The same pieces as the card.
 */
export function paintSection(c, { run, look = 'night', W = SHARE_W, H = SECTION_H, k = 1 } = {}) {
  const L = tokens(look), R = RHYTHM, T = stripOf(run, W, k);
  c.save();
  c.translate(0, Math.max(0, (H - sectionH({ run, W, k })) / 2));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  paintName(c, look, NAME, W / 2, R.nameY, R.namePx, W - 2 * R.COL, resultOf(run));
  paintBig(c, look, bigOf(run), W / 2, R.bigY, R.bigPx, W - 2 * R.COL);
  paintStat(c, look, statOf(run), W / 2, R.statY, R.statPx, W - 2 * R.COL);
  paintGrids(c, run, L, W / 2, R.artY + (T.stripH - T.gridH) / 2, T.cell, T.gap, T.gx);
  c.restore();
}

/** SHARE: the image through the share sheet with the line; no file sharing → the line shared (or copied) + the image saved (THE DAILY KIT's sender) */
export async function shareRun({ run, line, look = 'night', dayNo = null } = {}) {
  return sendShare(renderShare({ run, look, dayNo }), { file: 'the-password.png', line });
}
