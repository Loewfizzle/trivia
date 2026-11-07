// COAST CLEAR — THE SHARE CARD (CC2 — docs/coastclear.md "THE SHARE"; built on THE PASSWORD's share.js). SHARE renders an IMAGE on a canvas
// (1080 × 1350, in the look on screen — the night harbor's neon or the sunny harbor) with NO BOARD (everyone gets the same harbor that day: a
// picture of yours would give the searchlights away): the sign, the headline (COAST CLEAR · CAUGHT), the big time (a clear) or the one line,
// THREE small drawn searchlights lit per spot, neonspeakeasy.com. It draws ONLY logic.js#shareInputs (the headline, the time, the line, the
// spot count, the day number, the site — no cell, no light, no count), so nothing about the board can reach the picture. Sent through the
// phone's share sheet (navigator.share with the file) + ONE plain line ("COAST CLEAR #<n> · 2:41 · 0 spotted · neonspeakeasy.com"). No file
// sharing → the line is shared (or copied) and the image is saved. No emoji anywhere. Lazy: the view imports this on the first tap.
//   renderShare({ inputs, look }) → <canvas>      shareRun({ inputs, line, look }) → 'shared' | 'saved' | 'copied' | 'none'
export const SHARE_W = 1080, SHARE_H = 1350;
/** the only keys the card may read (tests/coastclear-share.test.mjs holds the line) */
export const SHARE_KEYS = Object.freeze(['head', 'caught', 'time', 'line', 'spots', 'dayNo', 'site']);
const LOOK = {
  night: { bg0: '#061226', bg1: '#02050f', sign: '#7fe8ff', signCore: '#effcff', ink: '#eaf6ff', dim: 'rgba(234,246,255,0.62)', win: '#3dff8b', lose: '#ff3d5e', lampOff: 'rgba(255,255,255,0.32)', lamp: '#ffd36b', lampCore: '#fff6dc', beam: 'rgba(255,246,214,0.5)', site: '#7fe8ff', font: '"Orbitron", "Chakra Petch", system-ui, sans-serif' },
  day: { bg0: '#8ec6ff', bg1: '#f7fbff', sign: '#16305c', signCore: '#16305c', ink: '#14284a', dim: '#3a5582', win: '#1f7a45', lose: '#c0304a', lampOff: 'rgba(22,48,92,0.34)', lamp: '#f0a51c', lampCore: '#fff6dc', beam: 'rgba(255,214,110,0.55)', site: '#2f86ff', font: 'ui-rounded, "SF Pro Rounded", "Chakra Petch", system-ui, sans-serif' },
};
/** the shared answer token as the page has it now (the colour-blind swap rides along) */
function tokens(look) {
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

/** the share image (a canvas, 1080 × 1350) from the no-board inputs ONLY */
export function renderShare({ inputs, look = 'night' } = {}) {
  const I = {};
  for (const k of SHARE_KEYS) I[k] = inputs ? inputs[k] : undefined;
  const L = tokens(look), W = SHARE_W, H = SHARE_H;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, L.bg0); g.addColorStop(1, L.bg1); c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (look === 'day') {
    const sun = c.createRadialGradient(150, 120, 0, 150, 120, 320); sun.addColorStop(0, 'rgba(255,250,230,0.95)'); sun.addColorStop(0.4, 'rgba(255,244,200,0.45)'); sun.addColorStop(1, 'rgba(255,244,200,0)'); c.fillStyle = sun; c.fillRect(0, 0, W, H);
    for (const [x, y, w] of [[780, 120, 170], [380, 210, 190]]) { const cl = c.createRadialGradient(x, y / 0.34, 0, x, y / 0.34, w); cl.addColorStop(0, 'rgba(255,255,255,0.85)'); cl.addColorStop(0.5, 'rgba(255,255,255,0.4)'); cl.addColorStop(1, 'rgba(255,255,255,0)'); c.save(); c.scale(1, 0.34); c.fillStyle = cl; c.fillRect(0, 0, W, H / 0.34); c.restore(); }
  } else {
    const moon = c.createRadialGradient(W * 0.86, 30, 0, W * 0.86, 30, 420); moon.addColorStop(0, 'rgba(200,225,255,0.14)'); moon.addColorStop(1, 'rgba(200,225,255,0)'); c.fillStyle = moon; c.fillRect(0, 0, W, H);
  }
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // the sign (the name once; the headline below is the result)
  if (look === 'day') { c.font = `800 70px ${L.font}`; const tw = c.measureText('coast clear').width, dw = c.measureText('.').width; c.textAlign = 'left'; c.fillStyle = L.sign; c.fillText('coast clear', (W - tw - dw) / 2, 140); c.fillStyle = L.site; c.fillText('.', (W - tw - dw) / 2 + tw, 140); c.textAlign = 'center'; }
  else { c.font = `900 54px ${L.font}`; c.save(); c.letterSpacing = '13px'; glowText(c, 'COAST CLEAR', W / 2 + 6, 140, L.signCore, L.sign, 36); c.restore(); }
  // the headline, with a soft lighthouse beam behind a clear
  const hy = I.caught ? 540 : 440;   // (a caught card has no big time: its block sits lower, centred)
  if (!I.caught) {
    // the lighthouse: a broad soft cone from low on the left, sweeping up behind the headline (a halo cone + the beam)
    c.save(); c.translate(W * 0.12, hy + 120); c.rotate(-0.36);
    for (const [spread, a] of [[340, 0.45], [170, 1]]) {
      const bm = c.createLinearGradient(0, 0, 1150, 0); bm.addColorStop(0, L.beam); bm.addColorStop(0.55, 'rgba(255,236,190,0.08)'); bm.addColorStop(1, 'rgba(255,240,200,0)');
      c.globalAlpha = a; c.fillStyle = bm; c.beginPath(); c.moveTo(0, -6); c.lineTo(1150, -spread); c.lineTo(1150, spread); c.lineTo(0, 6); c.closePath(); c.fill();
    }
    c.restore();
  }
  const hc = I.caught ? L.lose : L.win;
  c.font = `900 ${I.caught ? 118 : 104}px ${L.font}`;
  c.save(); c.letterSpacing = '8px';
  glowText(c, String(I.head || ''), W / 2 + 4, hy, hc, look === 'day' ? 'rgba(0,0,0,0)' : hc, look === 'day' ? 0 : 36);
  c.restore();
  // the big time (a clear) + the one line
  let y = hy + 150;
  if (!I.caught && I.time) { c.font = '700 190px "Chakra Petch", system-ui, sans-serif'; c.fillStyle = L.ink; c.fillText(String(I.time), W / 2, y + 30); y += 190; }
  c.font = '700 44px "Chakra Petch", system-ui, sans-serif'; c.fillStyle = I.caught ? L.ink : L.dim; c.save(); c.letterSpacing = '6px';
  c.fillText(String(I.line || ''), W / 2 + 3, y); c.restore();
  // THREE drawn searchlights, lit per spot (under the result — never a hole above them)
  const lampY = y + 120;
  const S = 5.4, lw = 32 * S, gap = 46, x0 = (W - (3 * lw + 2 * gap)) / 2;
  for (let k = 0; k < 3; k++) lamp(c, x0 + k * (lw + gap), lampY, S, k < (Number(I.spots) || 0), L, look);
  // the day number + the site
  c.font = '700 30px "Chakra Petch", system-ui, sans-serif'; c.fillStyle = L.dim; c.save(); c.letterSpacing = '6px';
  c.fillText(I.dayNo != null ? `COAST CLEAR #${I.dayNo}` : 'COAST CLEAR', W / 2 + 3, 1190);
  c.fillStyle = L.site;
  c.fillText(String(I.site || 'neonspeakeasy.com').toUpperCase(), W / 2 + 3, 1250);
  c.restore();
  return cv;
}

const blobOf = cv => new Promise(res => cv.toBlob(b => res(b), 'image/png'));
/** SHARE: the image through the share sheet with the line; no file sharing → the line shared (or copied) + the image saved */
export async function shareRun({ inputs, line, look = 'night' } = {}) {
  const cv = renderShare({ inputs, look });
  const blob = await blobOf(cv);
  const file = blob ? new File([blob], 'coast-clear.png', { type: 'image/png' }) : null;
  if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], text: line }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'none'; }
  }
  let how = 'none';
  try { if (navigator.share) { await navigator.share({ text: line }); how = 'shared'; } else { await navigator.clipboard.writeText(line); how = 'copied'; } } catch { /* closed */ }
  if (blob) {
    try {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'coast-clear.png'; a.rel = 'noopener';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      how = how === 'none' ? 'saved' : how;
    } catch { /* no download */ }
  }
  return how;
}
