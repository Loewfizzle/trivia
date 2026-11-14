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
// SKINS 2B (the owner, Nov 14) — THE SHARE CARD's ONE RULE: the card and the section = COAST CLEAR — the NAME CARRIES THE RESULT (the kit's
// small neon name: GREEN on a clear, RED when caught — no CAUGHT word anywhere) · ONE big TIME (a caught run's too) · ONE grey stat line
// ("1 SPOTTED · +30 s" · "3 SPOTTED") · the three lamps. The three text pieces are the kit's painters (js/daily/share.js#paintName · paintBig
// · paintStat).
//   renderShare({ inputs, look }) → <canvas>      shareRun({ inputs, line, look }) → 'shared' | 'saved' | 'copied' | 'none'
//   paintSection(c, { inputs, look, W, H }) — SHARE TODAY's section (the rhythm's box, centred in W × H)
import { SHARE_W, SHARE_H, shareFrame, shareFoot, sendShare, RHYTHM, OWN, paintName, paintBig, paintStat, MADE, FAILED } from '../../daily/share.js';   // (DM1 — THE DAILY KIT: the card's frame + its sender)
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
/** the daily's name (the kit paints it, in its result's colour; never swapped for a result word) */
export const NAME = 'COAST CLEAR';
/**
 * PURE — the result + the big TIME + the stat line from the no-board inputs: a CLEAR = MADE · its time · its line ("1 SPOTTED · +30 s"); a
 * CAUGHT run = FAILED · the time its line ends with ("3 SPOTTED · 1:58" — logic.js#endLine) · the spots alone ("3 SPOTTED" — the red name
 * says CAUGHT)
 */
export function partsOf(I) {
  const line = String((I && I.line) || '');
  if (!I || !I.caught) return { result: MADE, big: String((I && I.time) || ''), stat: line };
  const m = /^(.*?)\s*·\s*(\d+:\d{2})\s*$/.exec(line);
  return { result: FAILED, big: m ? m[2] : '', stat: m ? m[1] : line };
}
/** the content column a SHARE TODAY section keeps to (the card's rules — every section centred on the card's centre line inside it) */
export const COL_PAD = RHYTHM.COL;

// ---------------------------------------------------------------------------------------------- THE PIECES (this card + SHARE TODAY's section)
/** a lamp's INK inside its 32-unit box (the bulb's left edge → the cone's tip, strokes included) — what the eye centres on */
export const LAMP_INK = Object.freeze({ x0: 4.6, x1: 31.5, h: 22 });
/** the three lamps' ink width at scale S with `gap` between the boxes */
export const lampsWidth = (S, gap) => 2 * (32 * S + gap) + (LAMP_INK.x1 - LAMP_INK.x0) * S;
/** the biggest scale the three lamps fit `maxW` at (the gap = `gapK` × S) */
export const lampScale = (maxW, gapK) => maxW / (64 + 2 * gapK + LAMP_INK.x1 - LAMP_INK.x0);
/** THREE drawn searchlights, lit per spot, centred on cx BY THEIR INK (PFIX-3 — FABLE REVIEW 2's S7: the 32-unit boxes were centred, and a
 *  lamp's ink sits right of its box's middle — the row read 12–18 px right of every other band) */
export function paintLamps(c, I, L, look, cx, y, S, gap) {
  const lw = 32 * S, x0 = cx - lampsWidth(S, gap) / 2 - LAMP_INK.x0 * S;
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
  // THE ONE RULE (SKINS 2B): (1) THE NAME — green on a clear, red when caught (never a result word) · (2) ONE BIG TIME · (3) ONE grey STAT LINE ·
  // (4) THE ART — the three searchlights, lit per spot, centred in the card's art box. No beam.
  const P = partsOf(I);
  paintName(c, look, NAME, W / 2, OWN.nameY, OWN.namePx, W - 120, P.result);
  paintBig(c, look, P.big, W / 2, OWN.bigY, OWN.bigPx);
  paintStat(c, look, P.stat, W / 2, OWN.statY, OWN.statPx, W - 120);
  // (the lamps never wider than the card's column — S7: capped by its width)
  const S = Math.min(8, lampScale(W - 2 * RHYTHM.COL, 6.25)), lh = 22 * S;
  paintLamps(c, I, L, look, W / 2, OWN.artY + (OWN.artBot - OWN.artY - lh) / 2 - 40, S, S * 6.25);
  // the day number + THE FOOT (the kit's)
  shareFoot(c, { dayNo: I.dayNo, dim: L.dim, color: L.site, site: I.site, W, look });
  return cv;
}

// ---------------------------------------------------------------------------------------------- SHARE TODAY's SECTION
/** PFIX-3 (Ben, Nov 14 — "the three signal things are big: shrink them a little to give THE DROP's box more room"): the lamps' strip is
 *  SHORTER than the rhythm's — STRIP_H — and the section with it (share-today.js lays the card out by each section's own height: the room
 *  goes to THE DROP's board). The name, the big time and the stat line keep the rhythm's sizes. */
export const STRIP_H = 112;
export const SECTION_H = RHYTHM.H - RHYTHM.artH + STRIP_H;
/** this section's natural height — share-today.js lays the card out by it */
export const sectionH = () => SECTION_H;
/**
 * COAST CLEAR as a section of SHARE TODAY — THE ONE RULE (SKINS 2B; js/daily/share.js#RHYTHM): the name · the big TIME · the stat line · the
 * art strip (the three searchlights, as tall as the strip, centred) — every piece centred on the card's centre line inside the column, the
 * block centred in the box (W × H). The same pieces as the card. No beam.
 */
export function paintSection(c, { inputs, look = 'night', W = SHARE_W, H = SECTION_H } = {}) {
  const I = pick(inputs);
  const L = tokens(look);
  const R = RHYTHM, cw = W - 2 * R.COL, P = partsOf(I);
  c.save();
  c.translate(0, Math.max(0, (H - SECTION_H) / 2));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  paintName(c, look, NAME, W / 2, R.nameY, R.namePx, cw, P.result);
  paintBig(c, look, P.big, W / 2, R.bigY, R.bigPx);
  paintStat(c, look, P.stat, W / 2, R.statY, R.statPx, cw);
  // (a lamp is 22 tall in its own units: the strip's height less a breath — and never wider than the column: with TWO dailies a section is
  //  scaled 1.45× and the row stuck out past the foot line — S7)
  const S = Math.min((STRIP_H - 12) / 22, lampScale(cw, 8.5));
  paintLamps(c, I, L, look, W / 2, R.artY + (STRIP_H - 22 * S) / 2, S, S * 8.5);
  c.restore();
}

/** SHARE: the image through the share sheet with the line; no file sharing → the line shared (or copied) + the image saved (THE DAILY KIT's sender) */
export async function shareRun({ inputs, line, look = 'night' } = {}) {
  return sendShare(renderShare({ inputs, look }), { file: 'coast-clear.png', line });
}
