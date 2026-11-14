// (SKINS 2A — the EXPECTED copy, re-taken ON PURPOSE on Nov 14: the foot = one straight neon line + the address, ONE RHYTHM, COAST CLEAR's beam removed. A frozen copy of js/games/coastclear/share.js for tests/integration/share-same.html — a later refactor of the card must stay pixel-identical to it.)
// COAST CLEAR — THE SHARE CARD (CC2 — docs/coastclear.md "THE SHARE"; built on THE PASSWORD's share.js). SHARE renders an IMAGE on a canvas
// (1080 × 1350, in the look on screen — the night harbor's neon or the sunny harbor) with NO BOARD (everyone gets the same harbor that day: a
// picture of yours would give the searchlights away): the sign, the headline (COAST CLEAR · CAUGHT), the big time (a clear) or the one line,
// THREE small drawn searchlights lit per spot, neonspeakeasy.com. It draws ONLY logic.js#shareInputs (the headline, the time, the line, the
// spot count, the day number, the site — no cell, no light, no count), so nothing about the board can reach the picture. Sent through the
// phone's share sheet (navigator.share with the file) + ONE plain line ("COAST CLEAR #<n> · 2:41 · 0 spotted · neonspeakeasy.com"). No file
// sharing → the line is shared (or copied) and the image is saved. No emoji anywhere. Lazy: the view imports this on the first tap.
// BOARD 2.0 B (the owner's add-on — SHARE TODAY = ONE CARD FROM EACH DAILY's OWN PIECES): the card is built from EXPORTED PIECES (the sign, the
// beam, the headline, the big time, the line, the searchlights) that BOTH this card and SHARE TODAY's section (`paintSection`) call — this card
// stays pixel-identical (tests/integration/share-same.html). Still ONLY the no-board inputs.
// SKINS 2A (the owner, Nov 14) — ONE RHYTHM + NO PILLS + NO BEAM: the card and the section = the name (a CLEAR: the green COAST CLEAR, once) ·
// ONE big result (the time; CAUGHT) · ONE stat line · ONE art strip (the three lamps, centred) — js/daily/share.js#RHYTHM / OWN; the beam wedge
// behind the time is REMOVED (both places); the foot = the kit's (one straight neon line + the address, no frame).
//   renderShare({ inputs, look }) → <canvas>      shareRun({ inputs, line, look }) → 'shared' | 'saved' | 'copied' | 'none'
//   paintSection(c, { inputs, look, W, H }) — SHARE TODAY's section (the rhythm's box, centred in W × H)
import { SHARE_W, SHARE_H, shareFrame, shareFoot, sendShare, RHYTHM, OWN, WORD_K } from '/js/daily/share.js';   // (DM1 — THE DAILY KIT: the card's frame + its sender)
export { SHARE_W, SHARE_H };
/** the only keys the card may read (tests/coastclear-share.test.mjs holds the line) */
export const SHARE_KEYS = Object.freeze(['head', 'caught', 'time', 'line', 'spots', 'dayNo', 'site']);
const LOOK = {
  night: { bg0: '#061226', bg1: '#02050f', sign: '#7fe8ff', signCore: '#effcff', ink: '#eaf6ff', dim: 'rgba(234,246,255,0.62)', win: '#3dff8b', lose: '#ff3d5e', lampOff: 'rgba(255,255,255,0.32)', lamp: '#ffd36b', lampCore: '#fff6dc', site: '#7fe8ff', font: '"Orbitron", "Chakra Petch", system-ui, sans-serif' },
  day: { bg0: '#8ec6ff', bg1: '#f7fbff', sign: '#16305c', signCore: '#16305c', ink: '#14284a', dim: '#3a5582', win: '#1f7a45', lose: '#c0304a', lampOff: 'rgba(22,48,92,0.34)', lamp: '#f0a51c', lampCore: '#fff6dc', site: '#2f86ff', font: 'ui-rounded, "SF Pro Rounded", "Chakra Petch", system-ui, sans-serif' },
};
/** the shared answer token as the page has it now (the colour-blind swap rides along) */
export function tokens(look) {
  const L = { ...(LOOK[look] || LOOK.night) };
  try { const g = getComputedStyle(document.body).getPropertyValue('--good').trim(); if (g && look !== 'day') L.win = g; } catch { /* no DOM tokens */ }
  return L;
}
const glowText = (c, text, x, y, color, glow, blur) => { c.save(); c.shadowColor = glow; c.shadowBlur = blur; c.fillStyle = color; c.fillText(text, x, y); if (blur) c.fillText(text, x, y); c.restore(); };
/** a drawn searchlight (the status row's icon, in canvas): a lamp on a stand, its cone to the upper right; lit = gold */
function lamp(c, x, y, S, lit, L, look) {
  c.save(); c.translate(x, y); c.scale(S, S); c.lineCap = 'round'; c.lineJoin = 'round';
  const col = lit ? L.lamp : L.lampOff;
  c.beginPath(); c.moveTo(13.5, 9.5); c.lineTo(31, 1.5); c.lineTo(31, 14.5); c.lineTo(14.5, 13.5); c.closePath();
  if (lit) { c.fillStyle = look === 'day' ? 'rgba(255,196,80,0.4)' : 'rgba(255,220,130,0.6)'; c.fill(); c.strokeStyle = col; c.lineWidth = 1; c.stroke(); }
  else { c.setLineDash([2, 2.5]); c.strokeStyle = col; c.lineWidth = 1; c.stroke(); c.setLineDash([]); }
  c.beginPath(); c.arc(10, 11.5, 4.6, 0, Math.PI * 2);
  if (lit) { c.shadowColor = L.lamp; c.shadowBlur = 6; c.fillStyle = col; c.fill(); c.shadowBlur = 0; c.strokeStyle = L.lampCore; c.lineWidth = 1.6; c.stroke(); }
  else { c.strokeStyle = col; c.lineWidth = 1.6; c.stroke(); }
  c.beginPath(); c.arc(11.4, 11.2, 2, 0, Math.PI * 2); c.fillStyle = lit ? L.lampCore : col; c.fill();
  c.beginPath(); c.moveTo(10, 16); c.lineTo(10, 21); c.moveTo(6.5, 21.5); c.lineTo(13.5, 21.5); c.strokeStyle = col; c.lineWidth = 1.6; c.stroke();
  c.restore();
}
const pick = inputs => { const I = {}; for (const k of SHARE_KEYS) I[k] = inputs ? inputs[k] : undefined; return I; };
/** THE DROP B add-on (Ben, Nov 13 10:19 pm — "COAST CLEAR" then "COAST CLEAR" read as a typo): the result word IS the daily's own name (a clear)
 *  → it shows ONCE, as the coloured result word in the title's slot (no white sign above it); a lost run (CAUGHT, the red word) is unchanged */
export const NAME = 'COAST CLEAR';
export const doubledName = I => !I.caught && String(I.head || '').trim().toUpperCase() === NAME;
/** the content column a SHARE TODAY section keeps to (the card's rules — every section centred on the card's centre line inside it) */
export const COL_PAD = RHYTHM.COL;

// ---------------------------------------------------------------------------------------------- THE PIECES (this card + SHARE TODAY's section)
/** the sign: "coast clear." by day, the neon COAST CLEAR by night — centred on cx (k = its scale) */
export function paintSign(c, L, look, cx, y, k = 1) {
  if (look === 'day') { c.font = `800 ${70 * k}px ${L.font}`; const tw = c.measureText('coast clear').width, dw = c.measureText('.').width; c.textAlign = 'left'; c.fillStyle = L.sign; c.fillText('coast clear', (cx * 2 - tw - dw) / 2, y); c.fillStyle = L.site; c.fillText('.', (cx * 2 - tw - dw) / 2 + tw, y); c.textAlign = 'center'; }
  else { c.font = `900 ${54 * k}px ${L.font}`; c.save(); c.letterSpacing = `${13 * k}px`; glowText(c, 'COAST CLEAR', cx + 6 * k, y, L.signCore, L.sign, 36 * k); c.restore(); }
}
/** the headline (COAST CLEAR · CAUGHT); fitW = the widest it may print (a section's column) */
export function paintHead(c, I, L, look, cx, y, px, ls, fitW = 0) {
  const hc = I.caught ? L.lose : L.win;
  c.font = `900 ${px}px ${L.font}`;
  c.save(); c.letterSpacing = `${ls}px`;
  if (fitW) { let p = px; while (p > 24 && c.measureText(String(I.head || '')).width > fitW) { p -= 2; c.font = `900 ${p}px ${L.font}`; } }
  glowText(c, String(I.head || ''), cx + ls / 2, y, hc, look === 'day' ? 'rgba(0,0,0,0)' : hc, look === 'day' ? 0 : Math.round(Math.min(36, px * 0.375)));
  c.restore();
}
/** the big time (a clear) */
export function paintTime(c, I, L, cx, y, px) {
  c.font = `700 ${px}px "Chakra Petch", system-ui, sans-serif`; c.fillStyle = L.ink; c.fillText(String(I.time), cx, y);
}
/** the one line ("0 SPOTTED" · "3 SPOTTED · 1:58") */
export function paintLine(c, I, L, cx, y, px, ls) {
  c.font = `700 ${px}px "Chakra Petch", system-ui, sans-serif`; c.fillStyle = L.ink; c.save(); c.letterSpacing = `${ls}px`;
  c.fillText(String(I.line || ''), cx + ls / 2, y); c.restore();
}
/** THREE drawn searchlights, lit per spot, centred on cx */
export function paintLamps(c, I, L, look, cx, y, S, gap) {
  const lw = 32 * S, x0 = (cx * 2 - (3 * lw + 2 * gap)) / 2;
  for (let k = 0; k < 3; k++) lamp(c, x0 + k * (lw + gap), y, S, k < (Number(I.spots) || 0), L, look);
}

/** the share image (a canvas, 1080 × 1350) from the no-board inputs ONLY */
export function renderShare({ inputs, look = 'night' } = {}) {
  const I = pick(inputs);
  const L = tokens(look);
  const { cv, c, W, H } = shareFrame(L, look);   // (the ground + the day's sun — the kit)
  if (look === 'day') {
    for (const [x, y, w] of [[780, 120, 170], [380, 210, 190]]) { const cl = c.createRadialGradient(x, y / 0.34, 0, x, y / 0.34, w); cl.addColorStop(0, 'rgba(255,255,255,0.85)'); cl.addColorStop(0.5, 'rgba(255,255,255,0.4)'); cl.addColorStop(1, 'rgba(255,255,255,0)'); c.save(); c.scale(1, 0.34); c.fillStyle = cl; c.fillRect(0, 0, W, H / 0.34); c.restore(); }
  } else {
    const moon = c.createRadialGradient(W * 0.86, 30, 0, W * 0.86, 30, 420); moon.addColorStop(0, 'rgba(200,225,255,0.14)'); moon.addColorStop(1, 'rgba(200,225,255,0)'); c.fillStyle = moon; c.fillRect(0, 0, W, H);
  }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // ONE RHYTHM (SKINS 2A): (1) THE NAME — a CLEAR's result word IS the daily's own name: it takes the name's slot, ONCE (THE DROP B add-on);
  // CAUGHT keeps the sign · (2) ONE BIG RESULT — the time (a clear) / CAUGHT · (3) ONE STAT LINE · (4) THE ART — the three searchlights, lit
  // per spot, centred in the card's art box. No beam (the owner: the wedge is removed — the lamps stay).
  const once = doubledName(I) && !!I.time;
  if (once) paintHead(c, I, L, look, W / 2, OWN.nameY, OWN.namePx, 10, W - 120);
  else paintSign(c, L, look, W / 2, OWN.nameY, OWN.namePx / (look === 'day' ? 70 : 54));
  if (once) paintTime(c, I, L, W / 2, OWN.bigY, OWN.bigPx);
  else paintHead(c, I, L, look, W / 2, OWN.bigY, OWN.bigPx * WORD_K, 8, W - 120);
  paintLine(c, I, L, W / 2, OWN.statY, OWN.statPx, 6);
  const S = 8, lh = 22 * S;
  paintLamps(c, I, L, look, W / 2, OWN.artY + (OWN.artBot - OWN.artY - lh) / 2 - 40, S, 50);
  // the day number + THE FOOT (the kit's)
  shareFoot(c, { dayNo: I.dayNo, dim: L.dim, color: L.site, site: I.site, W, look });
  return cv;
}

// ---------------------------------------------------------------------------------------------- SHARE TODAY's SECTION
export const SECTION_H = RHYTHM.H;
/**
 * COAST CLEAR as a section of SHARE TODAY — ONE RHYTHM (SKINS 2A; js/daily/share.js#RHYTHM): the name's slot (a CLEAR: the green COAST CLEAR,
 * once; CAUGHT: the sign) · the big result (the time; CAUGHT) · the stat line · the art strip (the three searchlights, centred) — every piece
 * centred on the card's centre line inside the column, the block centred in the box (W × H). The same pieces as the card. No beam.
 */
export function paintSection(c, { inputs, look = 'night', W = SHARE_W, H = SECTION_H } = {}) {
  const I = pick(inputs);
  const L = tokens(look);
  const R = RHYTHM, cw = W - 2 * R.COL, once = doubledName(I) && !!I.time;
  c.save();
  c.translate(0, Math.max(0, (H - R.H) / 2));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (once) paintHead(c, I, L, look, W / 2, R.nameY, R.namePx, 8, cw);
  else paintSign(c, L, look, W / 2, R.nameY, R.namePx / (look === 'day' ? 70 : 54));
  if (once) paintTime(c, I, L, W / 2, R.bigY, R.bigPx);
  else paintHead(c, I, L, look, W / 2, R.bigY, R.bigPx * WORD_K, 6, cw);
  paintLine(c, I, L, W / 2, R.statY, R.statPx, 4);
  const S = 5.2;
  paintLamps(c, I, L, look, W / 2, R.artY + (R.artH - 22 * S) / 2, S, 44);
  c.restore();
}

/** SHARE: the image through the share sheet with the line; no file sharing → the line shared (or copied) + the image saved (THE DAILY KIT's sender) */
export async function shareRun({ inputs, line, look = 'night' } = {}) {
  return sendShare(renderShare({ inputs, look }), { file: 'coast-clear.png', line });
}
