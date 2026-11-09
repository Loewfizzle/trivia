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
//   renderShare({ inputs, look }) → <canvas>      shareRun({ inputs, line, look }) → 'shared' | 'saved' | 'copied' | 'none'
//   paintSection(c, { inputs, look, W, H }) — SHARE TODAY's section (the box W × H ≥ SECTION_H, its wordmark on top — PD-4 Group 0: the result + the time a centred pair)
import { SHARE_W, SHARE_H, shareFrame, shareFoot, sendShare } from '../../daily/share.js';   // (DM1 — THE DAILY KIT: the card's frame + its sender)
export { SHARE_W, SHARE_H };
/** the only keys the card may read (tests/coastclear-share.test.mjs holds the line) */
export const SHARE_KEYS = Object.freeze(['head', 'caught', 'time', 'line', 'spots', 'dayNo', 'site']);
const LOOK = {
  night: { bg0: '#061226', bg1: '#02050f', sign: '#7fe8ff', signCore: '#effcff', ink: '#eaf6ff', dim: 'rgba(234,246,255,0.62)', win: '#3dff8b', lose: '#ff3d5e', lampOff: 'rgba(255,255,255,0.32)', lamp: '#ffd36b', lampCore: '#fff6dc', beam: 'rgba(255,246,214,0.5)', site: '#7fe8ff', font: '"Orbitron", "Chakra Petch", system-ui, sans-serif' },
  day: { bg0: '#8ec6ff', bg1: '#f7fbff', sign: '#16305c', signCore: '#16305c', ink: '#14284a', dim: '#3a5582', win: '#1f7a45', lose: '#c0304a', lampOff: 'rgba(22,48,92,0.34)', lamp: '#f0a51c', lampCore: '#fff6dc', beam: 'rgba(255,214,110,0.55)', site: '#2f86ff', font: 'ui-rounded, "SF Pro Rounded", "Chakra Petch", system-ui, sans-serif' },
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

// ---------------------------------------------------------------------------------------------- THE PIECES (this card + SHARE TODAY's section)
/** the sign: "coast clear." by day, the neon COAST CLEAR by night — centred on cx (k = its scale) */
export function paintSign(c, L, look, cx, y, k = 1) {
  if (look === 'day') { c.font = `800 ${70 * k}px ${L.font}`; const tw = c.measureText('coast clear').width, dw = c.measureText('.').width; c.textAlign = 'left'; c.fillStyle = L.sign; c.fillText('coast clear', (cx * 2 - tw - dw) / 2, y); c.fillStyle = L.site; c.fillText('.', (cx * 2 - tw - dw) / 2 + tw, y); c.textAlign = 'center'; }
  else { c.font = `900 ${54 * k}px ${L.font}`; c.save(); c.letterSpacing = `${13 * k}px`; glowText(c, 'COAST CLEAR', cx + 6 * k, y, L.signCore, L.sign, 36 * k); c.restore(); }
}
/** the lighthouse beam behind a clear's headline: a broad soft cone from (x, y), rotated, `len` long (k scales its spread) */
export function paintBeam(c, L, x, y, len = 1150, k = 1) {
  c.save(); c.translate(x, y); c.rotate(-0.36);
  for (const [spread, a] of [[340, 0.45], [170, 1]]) {
    const bm = c.createLinearGradient(0, 0, len, 0); bm.addColorStop(0, L.beam); bm.addColorStop(0.55, 'rgba(255,236,190,0.08)'); bm.addColorStop(1, 'rgba(255,240,200,0)');
    c.globalAlpha = a; c.fillStyle = bm; c.beginPath(); c.moveTo(0, -6 * k); c.lineTo(len, -spread * k); c.lineTo(len, spread * k); c.lineTo(0, 6 * k); c.closePath(); c.fill();
  }
  c.restore();
}
/** the headline (COAST CLEAR · CAUGHT); fitW = the widest it may print (a section's column) */
export function paintHead(c, I, L, look, cx, y, px, ls, fitW = 0) {
  const hc = I.caught ? L.lose : L.win;
  c.font = `900 ${px}px ${L.font}`;
  c.save(); c.letterSpacing = `${ls}px`;
  if (fitW) { let p = px; while (p > 24 && c.measureText(String(I.head || '')).width > fitW) { p -= 2; c.font = `900 ${p}px ${L.font}`; } }
  glowText(c, String(I.head || ''), cx + ls / 2, y, hc, look === 'day' ? 'rgba(0,0,0,0)' : hc, look === 'day' ? 0 : 36);
  c.restore();
}
/** the big time (a clear) */
export function paintTime(c, I, L, cx, y, px) {
  c.font = `700 ${px}px "Chakra Petch", system-ui, sans-serif`; c.fillStyle = L.ink; c.fillText(String(I.time), cx, y);
}
/** the one line ("0 SPOTTED" · "3 SPOTTED · 1:58") */
export function paintLine(c, I, L, cx, y, px, ls) {
  c.font = `700 ${px}px "Chakra Petch", system-ui, sans-serif`; c.fillStyle = I.caught ? L.ink : L.dim; c.save(); c.letterSpacing = `${ls}px`;
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
  // the sign (the name once; the headline below is the result)
  paintSign(c, L, look, W / 2, 140);
  // the headline, with a soft lighthouse beam behind a clear
  const hy = I.caught ? 540 : 440;   // (a caught card has no big time: its block sits lower, centred)
  if (!I.caught) paintBeam(c, L, W * 0.12, hy + 120);
  paintHead(c, I, L, look, W / 2, hy, I.caught ? 118 : 104, 8);
  // the big time (a clear) + the one line
  let y = hy + 150;
  if (!I.caught && I.time) { paintTime(c, I, L, W / 2, y + 30, 190); y += 190; }
  paintLine(c, I, L, W / 2, y, 44, 6);
  // THREE drawn searchlights, lit per spot (under the result — never a hole above them)
  paintLamps(c, I, L, look, W / 2, y + 120, 5.4, 46);
  // the day number + the site
  shareFoot(c, { name: 'COAST CLEAR', dayNo: I.dayNo, dim: L.dim, color: L.site, site: I.site, W });   // (the kit's foot)
  return cv;
}

// ---------------------------------------------------------------------------------------------- SHARE TODAY's SECTION
export const SECTION_H = 420;
/**
 * COAST CLEAR as a section of SHARE TODAY (BOARD 2.0 B; PD-4's Group 0 — the owner, Nov 9: "no dead space"): its wordmark on top; the result (the
 * headline over its line) + THE BIG TIME side by side, centred as a PAIR (the beam behind a clear's headline); the three searchlights ~2× bigger
 * centred under them (a caught run: the result centred alone, the searchlights under it). The whole block centred in the box (W × H). The same pieces.
 */
export function paintSection(c, { inputs, look = 'night', W = SHARE_W, H = SECTION_H } = {}) {
  const I = pick(inputs);
  const L = tokens(look);
  const clear = !I.caught && !!I.time;
  const lampS = 5.2, lampH = 22 * lampS, lampTop = clear ? 262 : 246;
  const contentH = lampTop + lampH;
  c.save();
  c.translate(0, Math.max(0, (H - contentH) / 2));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  paintSign(c, L, look, W / 2, 40, 0.87);
  // the widths (the pieces' own fonts) → the pair's places
  const widthOf = (font, ls, t) => { c.save(); c.font = font; c.letterSpacing = `${ls}px`; const w = c.measureText(String(t || '')).width; c.restore(); return w; };
  let headPx = 72;
  while (headPx > 40 && widthOf(`900 ${headPx}px ${L.font}`, 6, I.head) > (clear ? W * 0.46 : W - 180)) headPx -= 2;
  if (clear) {
    const left = Math.max(widthOf(`900 ${headPx}px ${L.font}`, 6, I.head), widthOf('700 38px "Chakra Petch", system-ui, sans-serif', 4, I.line));
    const timeW = widthOf('700 176px "Chakra Petch", system-ui, sans-serif', 0, I.time), gapX = 64;
    const x0 = (W - (left + gapX + timeW)) / 2, lx = x0 + left / 2, rx = x0 + left + gapX + timeW / 2;
    c.save(); c.beginPath(); c.rect(0, 70, W, 200); c.clip(); paintBeam(c, L, Math.max(0, x0 - 60), 210, 760, 0.5); c.restore();
    paintHead(c, I, L, look, lx, 138, headPx, 6);
    paintLine(c, I, L, lx, 204, 38, 4);
    paintTime(c, I, L, rx, 168, 176);
  } else {
    paintHead(c, I, L, look, W / 2, 130, headPx, 6);
    paintLine(c, I, L, W / 2, 196, 38, 4);
  }
  paintLamps(c, I, L, look, W / 2, lampTop, lampS, 44);
  c.restore();
}

/** SHARE: the image through the share sheet with the line; no file sharing → the line shared (or copied) + the image saved (THE DAILY KIT's sender) */
export async function shareRun({ inputs, line, look = 'night' } = {}) {
  return sendShare(renderShare({ inputs, look }), { file: 'coast-clear.png', line });
}
