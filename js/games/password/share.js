// THE PASSWORD — THE SHARE CARD (PW2 — docs/password.md "THE SHARE"): SHARE renders an IMAGE on a canvas (1080 × 1350, in the look on
// screen — night neon or the day sky): the sign, the two drawn doors, the result line ("7 GUESSES · 2:54" or the held line), both doors'
// MINI GRIDS (marks only — NO letters, NO words), neonspeakeasy.com. The headline: WELCOME IN · LOCKED OUT (the owner's ADD-ON). Sent through the phone's share sheet (navigator.share with the file)
// + ONE plain line (logic.js#shareLine: "THE PASSWORD #<n> · 7 guesses · neonspeakeasy.com" — #n = days since meta.js#PW_EPOCH). No file
// sharing → the line is shared (or copied) and the image is saved. No emoji anywhere. Lazy: the view imports this on the first tap.
//   renderShare({ run, look }) → <canvas>      shareRun({ run, line, look }) → 'shared' | 'saved' | 'copied' | 'none'
import { scoreOf, fmtTime, doorState, HEAD_IN, HEAD_OUT, DOOR_NAMES, DOORS, HIT, NEAR } from './logic.js';
import { SHARE_W, SHARE_H, SITE, shareFrame, shareFoot, sendShare } from '../../daily/share.js';   // (DM1 — THE DAILY KIT: the card's frame + its sender)
export { SHARE_W, SHARE_H, SITE };
const LOOK = {
  night: { bg0: '#0d0a1c', bg1: '#05040c', sign: '#ff5ec4', signCore: '#fff2fa', ink: '#f4f6ff', dim: 'rgba(244,246,255,0.62)', faint: 'rgba(244,246,255,0.4)', good: '#3dff8b', close: '#ffd23d', red: '#ff3355', tile: 'rgba(255,255,255,0.05)', tileLine: 'rgba(255,255,255,0.16)', miss: 'rgba(0,0,0,0.42)', near: 'rgba(0,0,0,0.45)', hitInk: '#06130b', doorOn: '#ff5ec4', doorLock: 'rgba(255,255,255,0.28)', doorHeld: 'rgba(255,92,120,0.8)', room: '#ffc266', font: '"Orbitron", "Chakra Petch", system-ui, sans-serif' },
  day: { bg0: '#8ec6ff', bg1: '#f7fbff', sign: '#16305c', signCore: '#16305c', ink: '#14284a', dim: '#3a5582', faint: '#5a7196', good: '#3dff8b', close: '#ffd23d', red: '#c0304a', tile: 'rgba(255,255,255,0.78)', tileLine: 'rgba(80,120,180,0.25)', miss: 'rgba(160,176,198,0.6)', near: 'rgba(255,255,255,0.9)', hitInk: '#06220f', doorOn: '#2f86ff', doorLock: 'rgba(22,48,92,0.32)', doorHeld: 'rgba(196,60,80,0.75)', room: '#ffd27a', font: 'ui-rounded, "SF Pro Rounded", "Chakra Petch", system-ui, sans-serif' },
};
/** the shared answer tokens as the page has them now (the colour-blind swap rides along) */
function tokens(look) {
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
    if (m === HIT) { c.shadowColor = L.good; c.shadowBlur = cell * 0.35; c.fillStyle = L.good; rr(c, cx, cy, cell, cell, cell * 0.18); c.fill(); c.shadowBlur = 0; c.fillStyle = '#fff'; rr(c, cx + cell * 0.18, cy + cell * 0.8, cell * 0.64, cell * 0.1, cell * 0.05); c.fill(); }
    else if (m === NEAR) { c.fillStyle = L.near; rr(c, cx, cy, cell, cell, cell * 0.18); c.fill(); c.strokeStyle = L.close; c.lineWidth = cell * 0.08; c.stroke(); c.fillStyle = L.close; c.beginPath(); c.arc(cx + cell * 0.78, cy + cell * 0.22, cell * 0.11, 0, Math.PI * 2); c.fill(); }
    else { c.fillStyle = L.miss; rr(c, cx, cy, cell, cell, cell * 0.18); c.fill(); c.strokeStyle = L.tileLine; c.lineWidth = cell * 0.05; c.stroke(); }
    c.restore();
  }));
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
  // the sign
  if (look === 'day') { c.font = `800 74px ${L.font}`; c.fillStyle = L.sign; c.fillText('the password', W / 2 - 14, 140); c.fillStyle = L.doorOn; c.fillText('.', W / 2 + 232, 140); }
  else { c.font = `900 58px ${L.font}`; c.save(); c.letterSpacing = '14px'; glowText(c, 'THE PASSWORD', W / 2 + 7, 140, L.signCore, L.sign, 40); c.restore(); }
  // the two doors + their names
  const names = DOOR_NAMES;
  const dx = [250, 650], S = 2.9;
  names.forEach((n, i) => {
    const st = doorState(run, i);
    door(c, dx[i], 250, S, st, L);
    c.textAlign = 'left'; c.font = `700 26px "Chakra Petch", system-ui, sans-serif`; c.save(); c.letterSpacing = '4px';
    c.fillStyle = st === 'open' ? L.good : st === 'on' ? L.doorOn : st === 'held' ? L.doorHeld : L.faint;
    if (look === 'day' && st === 'open') c.fillStyle = '#1f7a45';
    c.fillText(n, dx[i] + 34 * S + 18, 290);
    c.restore();
  });
  c.textAlign = 'center';
  // the result line
  const s = scoreOf(run), crack = s.doors === DOORS;
  const head = crack ? HEAD_IN : HEAD_OUT;
  c.font = `900 96px ${L.font}`;
  c.save(); c.letterSpacing = '8px';
  const hc = crack ? (look === 'day' ? '#1f7a45' : L.good) : L.red;
  glowText(c, head, W / 2 + 4, 500, hc, look === 'day' ? 'rgba(0,0,0,0)' : hc, look === 'day' ? 0 : 36);
  c.restore();
  c.font = `700 44px "Chakra Petch", system-ui, sans-serif`; c.fillStyle = L.ink; c.save(); c.letterSpacing = '6px';
  c.fillText(`${s.guesses} ${s.guesses === 1 ? 'GUESS' : 'GUESSES'} · ${fmtTime(s.time)}`, W / 2 + 3, 592);
  c.restore();
  // the mini grids (the doors attempted; marks only)
  const played = run.doors.filter(d => d.guesses.length);
  const cell = 56, gap = 10, gw = 5 * cell + 4 * gap, gapX = 90;
  const total = played.length * gw + (played.length - 1) * gapX;
  let x0 = (W - total) / 2;
  const top = 690;
  for (const d of played) { grid(c, d.marks, x0, top, cell, gap, L); x0 += gw + gapX; }
  // the site (+ the day number) — the kit's foot
  shareFoot(c, { name: 'THE PASSWORD', dayNo, dim: L.dim, color: look === 'day' ? L.doorOn : L.sign, W });
  return cv;
}

/** SHARE: the image through the share sheet with the line; no file sharing → the line shared (or copied) + the image saved (THE DAILY KIT's sender) */
export async function shareRun({ run, line, look = 'night', dayNo = null } = {}) {
  return sendShare(renderShare({ run, look, dayNo }), { file: 'the-password.png', line });
}
