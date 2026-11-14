// (SKINS 2A — the EXPECTED copy, re-taken ON PURPOSE on Nov 14: the foot = one straight neon line + the address, ONE RHYTHM, COAST CLEAR's beam removed. A frozen copy of js/games/password/share.js for tests/integration/share-same.html — a later refactor of the card must stay pixel-identical to it.)
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
//   renderShare({ run, look }) → <canvas>      shareRun({ run, line, look }) → 'shared' | 'saved' | 'copied' | 'none'
//   paintSection(c, { run, look, W, H }) — SHARE TODAY's section (the rhythm's box, centred in W × H)
import { scoreOf, fmtTime, doorState, HEAD_IN, HEAD_OUT, DOOR_NAMES, DOORS, HIT, NEAR } from '/js/games/password/logic.js';
import { SHARE_W, SHARE_H, SITE, shareFrame, shareFoot, sendShare, RHYTHM, OWN, WORD_K } from '/js/daily/share.js';   // (DM1 — THE DAILY KIT: the card's frame + its sender)
export { SHARE_W, SHARE_H, SITE };
const LOOK = {
  night: { bg0: '#0d0a1c', bg1: '#05040c', sign: '#ff5ec4', signCore: '#fff2fa', ink: '#f4f6ff', dim: 'rgba(244,246,255,0.62)', faint: 'rgba(244,246,255,0.4)', good: '#3dff8b', close: '#ffd23d', red: '#ff3355', tile: 'rgba(255,255,255,0.05)', tileLine: 'rgba(255,255,255,0.16)', miss: 'rgba(0,0,0,0.42)', near: 'rgba(0,0,0,0.45)', hitInk: '#06130b', doorOn: '#ff5ec4', doorLock: 'rgba(255,255,255,0.28)', doorHeld: 'rgba(255,92,120,0.8)', room: '#ffc266', font: '"Orbitron", "Chakra Petch", system-ui, sans-serif' },
  day: { bg0: '#8ec6ff', bg1: '#f7fbff', sign: '#16305c', signCore: '#16305c', ink: '#14284a', dim: '#3a5582', faint: '#5a7196', good: '#3dff8b', close: '#ffd23d', red: '#c0304a', tile: 'rgba(255,255,255,0.78)', tileLine: 'rgba(80,120,180,0.25)', miss: 'rgba(160,176,198,0.6)', near: 'rgba(255,255,255,0.9)', hitInk: '#06220f', doorOn: '#2f86ff', doorLock: 'rgba(22,48,92,0.32)', doorHeld: 'rgba(196,60,80,0.75)', room: '#ffd27a', font: 'ui-rounded, "SF Pro Rounded", "Chakra Petch", system-ui, sans-serif' },
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
const glowText = (c, text, x, y, color, glow, blur) => { c.save(); c.shadowColor = glow; c.shadowBlur = blur; c.fillStyle = color; c.fillText(text, x, y); c.fillText(text, x, y); c.restore(); };

/** a drawn door (the same shape as doors.js, in canvas): state locked | on | open | held; S = the scale (1 = 34 × 44) */
function door(c, x, y, S, st, L) {
  const col = st === 'open' ? L.good : st === 'on' ? L.doorOn : st === 'held' ? L.doorHeld : L.doorLock;
  c.save(); c.translate(x, y); c.scale(S, S);
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (st === 'open') { c.fillStyle = L.room; c.globalAlpha = 0.95; c.fillRect(7, 4.5, 20, 38); c.globalAlpha = 1; }
  const frame = () => { c.beginPath(); c.moveTo(4.5, 42.5); c.lineTo(4.5, 5); c.arcTo(4.5, 2.5, 7, 2.5, 2.5); c.lineTo(27, 2.5); c.arcTo(29.5, 2.5, 29.5, 5, 2.5); c.lineTo(29.5, 42.5); c.moveTo(1.5, 42.5); c.lineTo(32.5, 42.5); };
  if (st === 'on' || st === 'open') { c.strokeStyle = col; c.lineWidth = 4.2; c.globalAlpha = 0.35; frame(); c.stroke(); c.globalAlpha = 1; }
  c.strokeStyle = col; c.lineWidth = 1.7; frame(); c.stroke();
  // the leaf: closed (a panel + its knob) or swung ajar (a narrow slab at the hinge)
  if (st === 'open') { c.fillStyle = 'rgba(10,8,18,0.85)'; c.fillRect(5.5, 3.5, 7, 36); c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(6, 4, 6, 35); }
  else {
    c.fillStyle = st === 'held' ? 'rgba(60,10,20,0.5)' : L === LOOK.day ? 'rgba(255,255,255,0.85)' : 'rgba(8,6,18,0.9)'; c.fillRect(7, 5, 20, 33);
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
/** the sign: "the password." by day, the neon THE PASSWORD by night — centred on cx (k = its scale: 1 on this card, small as a section's wordmark) */
export function paintSign(c, L, look, cx, y, k = 1) {
  if (look === 'day') { c.font = `800 ${74 * k}px ${L.font}`; c.fillStyle = L.sign; c.fillText('the password', cx - 14 * k, y); c.fillStyle = L.doorOn; c.fillText('.', cx + 232 * k, y); }
  else { c.font = `900 ${58 * k}px ${L.font}`; c.save(); c.letterSpacing = `${14 * k}px`; glowText(c, 'THE PASSWORD', cx + 7 * k, y, L.signCore, L.sign, 40 * k); c.restore(); }
}
/** the two drawn doors + their names (THE FRONT DOOR · THE BACK ROOM) — each door at xs[i], its name to its right */
export function paintDoors(c, run, L, look, { xs, y, S, font, ls, tx, ty }) {
  DOOR_NAMES.forEach((n, i) => {
    const st = doorState(run, i);
    door(c, xs[i], y, S, st, L);
    c.textAlign = 'left'; c.font = `700 ${font}px "Chakra Petch", system-ui, sans-serif`; c.save(); c.letterSpacing = `${ls}px`;
    c.fillStyle = st === 'open' ? L.good : st === 'on' ? L.doorOn : st === 'held' ? L.doorHeld : L.faint;
    if (look === 'day' && st === 'open') c.fillStyle = '#1f7a45';
    c.fillText(n, xs[i] + 34 * S + tx, ty);
    c.restore();
  });
  c.textAlign = 'center';
}
/** the headline (WELCOME IN · LOCKED OUT) at cx, y in px; fitW = the widest it may print (a section's column) */
export function paintHead(c, run, L, look, cx, y, px, ls, fitW = 0) {
  const s = scoreOf(run), crack = s.doors === DOORS;
  const head = crack ? HEAD_IN : HEAD_OUT;
  c.font = `900 ${px}px ${L.font}`;
  c.save(); c.letterSpacing = `${ls}px`;
  if (fitW) { let p = px; while (p > 24 && c.measureText(head).width > fitW) { p -= 2; c.font = `900 ${p}px ${L.font}`; } }
  const hc = crack ? (look === 'day' ? '#1f7a45' : L.good) : L.red;
  glowText(c, head, cx + ls / 2, y, hc, look === 'day' ? 'rgba(0,0,0,0)' : hc, look === 'day' ? 0 : Math.round(px * 0.375));
  c.restore();
}
/** the result line ("7 GUESSES · 2:54") */
export function paintLine(c, run, L, cx, y, px, ls) {
  const s = scoreOf(run);
  c.font = `700 ${px}px "Chakra Petch", system-ui, sans-serif`; c.fillStyle = L.ink; c.save(); c.letterSpacing = `${ls}px`;
  c.fillText(`${s.guesses} ${s.guesses === 1 ? 'GUESS' : 'GUESSES'} · ${fmtTime(s.time)}`, cx + ls / 2, y);
  c.restore();
}
/** the mini grids of the doors attempted (marks only), centred on cx from `top` */
export function paintGrids(c, run, L, cx, top, cell, gap, gapX) {
  const played = run.doors.filter(d => d.guesses.length);
  const gw = 5 * cell + 4 * gap;
  const total = played.length * gw + (played.length - 1) * gapX;
  let x0 = (cx * 2 - total) / 2;
  for (const d of played) { grid(c, d.marks, x0, top, cell, gap, L); x0 += gw + gapX; }
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
  // ONE RHYTHM (SKINS 2A): the name · ONE big result (WELCOME IN · LOCKED OUT) · ONE stat line · THE ART (the two doors + their names, then
  // both doors' tiles) · the foot
  paintSign(c, L, look, W / 2, OWN.nameY, OWN.namePx / (look === 'day' ? 74 : 58));
  paintHead(c, run, L, look, W / 2, OWN.bigY, OWN.bigPx * WORD_K, 8, W - 120);
  paintLine(c, run, L, W / 2, OWN.statY, OWN.statPx, 6);
  // (the art block — the doors' row + the tallest grid — sits a little above the middle of the art box)
  const rows = Math.max(1, ...run.doors.map(d => d.marks.length)), blockH = 176 + rows * 66 - 10;
  const ay = OWN.artY + Math.max(0, (OWN.artBot - OWN.artY - blockH) * 0.4);
  paintDoors(c, run, L, look, { xs: [250, 650], y: ay + 6, S: 2.9, font: 26, ls: 4, tx: 18, ty: ay + 46 });
  paintGrids(c, run, L, W / 2, ay + 176, 56, 10, 90);
  // the day number + THE FOOT (the kit's)
  shareFoot(c, { dayNo, dim: L.dim, color: look === 'day' ? L.doorOn : L.sign, W, look });
  return cv;
}

// ---------------------------------------------------------------------------------------------- SHARE TODAY's SECTION
/** the section's box height in its own units — the rhythm's (SHARE TODAY scales every section by the same factor) */
export const SECTION_H = RHYTHM.H;
/** one door alone (a piece: SHARE TODAY's section heads each grid with its door — no name; the door's state as on the card) */
export function paintDoor(c, run, L, i, x, y, S) { door(c, x, y, S, doorState(run, i), L); }
/**
 * THE PASSWORD as a section of SHARE TODAY — ONE RHYTHM (SKINS 2A; js/daily/share.js#RHYTHM): the name · the big result (WELCOME IN · LOCKED
 * OUT) · the stat line ("n GUESSES · m:ss") · the art strip: each door played BESIDE its tiles (no names — unreadable at thread size; the
 * daily's OWN card keeps them), the units side by side, centred. The tiles as big as the strip allows (≤ 36 a cell — a LOCKED OUT door's six
 * rows fill the strip's height). The block centred in the box (W × H). The same pieces as the card.
 */
export function paintSection(c, { run, look = 'night', W = SHARE_W, H = SECTION_H } = {}) {
  const L = tokens(look), R = RHYTHM;
  const played = run.doors.map((d, i) => ({ d, i })).filter(x => x.d.guesses.length);
  const n = Math.max(1, played.length);
  const rows = Math.max(1, ...played.map(x => x.d.marks.length));
  const doorS = 1.5, doorH = 44 * doorS, doorW = 34 * doorS, dx = doorW + 14;
  // the cell: as big as the strip's height + the column's width allow — a grid = 5 cells + 4 gaps of 0.2, 1.5 cells between the units
  const byH = R.artH / (1.2 * rows - 0.2);
  const byW = (W - 2 * R.COL - n * dx) / (n * 5.8 - 0.8 + (n - 1) * 1.5);
  const cell = Math.max(10, Math.min(36, byH, byW)), gap = cell * 0.2, gx = cell * 1.5;
  const gridH = rows * cell + (rows - 1) * gap, top = R.artY + (R.artH - Math.max(gridH, doorH)) / 2;
  c.save();
  c.translate(0, Math.max(0, (H - R.H) / 2));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  paintSign(c, L, look, W / 2, R.nameY, R.namePx / (look === 'day' ? 74 : 58));
  paintHead(c, run, L, look, W / 2, R.bigY, R.bigPx * WORD_K, 6, W - 2 * R.COL);
  paintLine(c, run, L, W / 2, R.statY, R.statPx, 4);
  // the units [door][tiles] side by side, centred (paintGrids lays the grids out — its gap widened by each door, its centre shifted by one)
  const gw = 5 * cell + 4 * gap, total = n * (dx + gw) + (n - 1) * gx, x0 = W / 2 - total / 2;
  played.forEach((x, k) => paintDoor(c, run, L, x.i, x0 + k * (dx + gw + gx), top, doorS));
  paintGrids(c, run, L, W / 2 + dx / 2, top, cell, gap, gx + dx);
  c.restore();
}

/** SHARE: the image through the share sheet with the line; no file sharing → the line shared (or copied) + the image saved (THE DAILY KIT's sender) */
export async function shareRun({ run, line, look = 'night', dayNo = null } = {}) {
  return sendShare(renderShare({ run, look, dayNo }), { file: 'the-password.png', line });
}
