// THE DAILY MODULE — SHARE TODAY (DM2 → DFIX3 — THE SHARE IMAGE FROM THE TICKET): ONE 1080 × 1350 card built from THE PREMIUM TICKET itself —
// the date at the top ("SUN NOV 8"), THE DAILIES sign, THE SWEEP meter, each daily as a BIG ticket (the paper grain, the notches, the punched
// stub with its art + serial, the name, the spoiler-free result line — its meta's scoreLine — and the ADMITTED stamp when done / NOT YET with no
// stamp), the player's STREAK FLAME + count, NEONSPEAKEASY.COM as the foot's headline (CITY FIXES). Composed to FILL the card for 1–6 dailies, in the look on
// screen (day / night). NO SPOILERS: never a word, a letter colour, a board or a searchlight. The one plain line is unchanged (today-logic.js).
import { shareFrame, sendShare } from '/js/daily/share.js';
import { sweepState, shareTodayLine, MAX_ROWS } from '/js/daily/today-logic.js';
import { TICKET_PATHS, STAMP_WORD, serialOf, dateLineOf } from '/js/daily/ticket-art.js';

const LOOKS = {
  night: { bg0: '#05040c', bg1: '#1a0d2c', ink: '#f6f2ff', dim: 'rgba(226,222,246,0.72)', sign: '#ff6fc8', glow: 'rgba(255,111,200,0.75)', seg: 'rgba(255,255,255,0.14)', on: '#ff6fc8',
    paper: '#1b1331', paperHi: 'rgba(255,255,255,0.08)', hole: '#09061a', grain: 'soft-light', grainA: 0.9, serial: 'rgba(226,222,246,0.62)', lift: 'rgba(0,0,0,0.6)' },
  day: { bg0: '#bfdcff', bg1: '#eef6ff', ink: '#14284a', dim: '#3a5582', sign: '#16305c', glow: 'transparent', seg: 'rgba(60,100,160,0.2)', on: '#2f86ff',
    paper: '#f4ecda', paperHi: '#fffdf7', hole: '#cfe0f6', grain: 'overlay', grainA: 1, serial: '#5a6f93', lift: 'rgba(20,40,74,0.3)' },
};
const INK = { password: '#ff5ec4', coastclear: '#5fe1ff' };
const DAY_INK = { password: '#2f86ff', coastclear: '#0f86b0' };
const FONT_D = 'Orbitron, "Chakra Petch", system-ui, sans-serif', FONT_U = '"Chakra Petch", system-ui, sans-serif', FONT_M = '"JetBrains Mono", ui-monospace, monospace';

// ---- the bitmaps the card needs (cached per page): the paper grain + an SVG drawn as an image
let grainP = null;
const grain = () => (grainP ||= new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = '/assets/daily/paper-grain.webp'; }));
const svgImage = (w, h, inner) => new Promise(res => {
  const im = new Image();
  im.onload = () => res(im); im.onerror = () => res(null);
  im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${inner}</svg>`)}`;
});
/** a daily's neon art (the ticket's own paths) as a bitmap in its ink */
const artImage = (key, ink, px, night) => svgImage(24, 24, `<g fill="none" stroke="${ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"${night ? ` style="filter:drop-shadow(0 0 0.6px ${ink})"` : ''}>${TICKET_PATHS[key] || TICKET_PATHS.star}</g>`).then(im => (im ? { im, px } : null));
/** the streak flame (js/progress/flame-art.js — the one flame everywhere) as a bitmap */
async function flameImage(state, w) {
  try {
    const { flameSvg } = await import('/js/progress/flame-art.js');
    const el = flameSvg(state, w);
    const s = new XMLSerializer().serializeToString(el);
    return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`; });
  } catch { return null; }
}

function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
/** the ticket's outline: a rounded box minus the two side notches (one path, even-odd) */
function ticketPath(c, x, y, w, h, r, nr) {
  roundRect(c, x, y, w, h, r);
  c.moveTo(x + nr, y + h / 2); c.arc(x, y + h / 2, nr, 0, Math.PI * 2, true);
  c.moveTo(x + w + nr, y + h / 2); c.arc(x + w, y + h / 2, nr, 0, Math.PI * 2, true);
}

/**
 * THE CARD (a canvas) — the screen's test hook draws it without sharing. { streak } = the profile's streak (the flame + its count; 0 = no flame row).
 * Async: the grain + the art + the flame are images.
 */
export async function drawToday(today, lineOf, look = document.body.dataset.look === 'day' ? 'day' : 'night', { streak = 0 } = {}) {
  const L = LOOKS[look] || LOOKS.night, night = look !== 'day';
  const { cv, c, W } = shareFrame({ bg0: L.bg0, bg1: L.bg1 }, look);
  const ds = (today.dailies || []).slice(0, MAX_ROWS), sw = sweepState(today);
  const [paper, flame, arts] = await Promise.all([grain(), streak > 0 ? flameImage('lit', 160) : null,
    Promise.all(ds.map(d => artImage(d.ticket || d.id, night ? (INK[d.id] || L.sign) : (DAY_INK[d.id] || L.on), 24, night)))]);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // the date
  c.save(); c.font = `700 34px ${FONT_U}`; c.letterSpacing = '9px'; c.fillStyle = L.dim; c.fillText(dateLineOf(today.day), W / 2 + 4, 92); c.restore();
  // the sign
  c.save(); c.font = `900 92px ${FONT_D}`; c.letterSpacing = '12px';
  if (night) { c.shadowColor = L.glow; c.shadowBlur = 40; c.fillStyle = L.sign; c.fillText('THE DAILIES', W / 2 + 6, 180); c.shadowBlur = 8; c.fillStyle = '#fff3fb'; }
  else c.fillStyle = L.sign;
  c.fillText('THE DAILIES', W / 2 + 6, 180); c.restore();
  // THE SWEEP meter
  const mx = 150, mw = W - 300, gap = 18, n = Math.max(1, sw.of), sg = (mw - gap * (n - 1)) / n;
  sw.segs.forEach((s, i) => {
    c.fillStyle = s.done ? L.on : L.seg;
    if (s.done && night) { c.shadowColor = L.glow; c.shadowBlur = 24; } else c.shadowBlur = 0;
    roundRect(c, mx + i * (sg + gap), 268, sg, 24, 9); c.fill();
  });
  c.shadowBlur = 0;
  c.save(); c.font = `700 30px ${FONT_U}`; c.fillStyle = L.dim; c.letterSpacing = '7px';
  c.fillText(sw.swept ? 'SWEPT · EVERY DAILY' : `${sw.done} OF ${sw.of} · THE SWEEP`, W / 2 + 4, 338); c.restore();

  // THE TICKETS — composed to FILL the room between the meter and the foot (the flame row takes 120 px when there is a streak)
  const top = 400, footTop = streak > 0 ? 1130 : 1200, room = footTop - top;
  const rowGap = 24, th = Math.min(ds.length <= 2 ? 272 : 230, Math.floor((room - rowGap * (ds.length - 1)) / Math.max(1, ds.length)));
  const totalH = th * ds.length + rowGap * (ds.length - 1), y0 = top + Math.max(0, (room - totalH) / 2);
  const x = 96, w = W - 192, r = 20, nr = 16, stubW = Math.round(Math.max(150, Math.min(190, th * 0.95)));
  const serial = serialOf(today.day);
  ds.forEach((d, i) => {
    const y = y0 + i * (th + rowGap), ink = night ? (INK[d.id] || L.sign) : (DAY_INK[d.id] || L.on);
    const done = today.mine && today.mine[d.id] != null;
    // the lift
    c.save(); c.shadowColor = L.lift; c.shadowBlur = 34; c.shadowOffsetY = 14; c.fillStyle = L.paper; roundRect(c, x + 14, y + 6, w - 28, th - 6, r); c.fill(); c.restore();
    // the paper (clipped to the notched outline): the colour, the grain blended over it, the top highlight, the ink edge
    c.save(); ticketPath(c, x, y, w, th, r, nr); c.clip('evenodd');
    c.fillStyle = L.paper; c.fillRect(x, y, w, th);
    if (paper) { c.save(); c.globalCompositeOperation = L.grain; c.globalAlpha = L.grainA; const pt = c.createPattern(paper, 'repeat'); if (pt) { c.fillStyle = pt; c.fillRect(x, y, w, th); } c.restore(); }
    c.fillStyle = L.paperHi; c.fillRect(x, y, w, 2);
    if (night) { c.save(); c.globalAlpha = 0.1; c.fillStyle = ink; c.fillRect(x, y, w, th); c.restore(); }   // (the neon's wash on the night paper)
    // the punched holes on the stub's edge
    const hx = x + stubW;
    for (let hy = y + 18; hy < y + th - 10; hy += 20) {
      c.beginPath(); c.arc(hx, hy, 5.2, 0, Math.PI * 2); c.fillStyle = L.hole; c.fill();
      c.lineWidth = 1.4; c.strokeStyle = ink; c.globalAlpha = 0.45; c.stroke(); c.globalAlpha = 1;
    }
    c.restore();
    // the ink edge (over the clip: the notches' arcs show too)
    c.save(); ticketPath(c, x, y, w, th, r, nr); c.lineWidth = 3; c.strokeStyle = ink; c.globalAlpha = night ? 0.7 : 0.55; c.stroke(); c.restore();
    // THE STUB: the art + the serial
    const a = arts[i];
    if (a) { const px = Math.round(th * 0.42); c.save(); if (night) { c.shadowColor = ink; c.shadowBlur = 14; } c.drawImage(a.im, x + stubW / 2 - px / 2, y + th / 2 - px / 2 - 12, px, px); c.restore(); }
    c.save(); c.font = `700 ${Math.round(th * 0.11)}px ${FONT_M}`; c.letterSpacing = '2px'; c.fillStyle = L.serial; c.fillText(serial, x + stubW / 2 + 1, y + th - Math.round(th * 0.14)); c.restore();
    // the name + the result line (or the hook while NOT YET)
    const tx = hx + 30, nameSize = Math.min(40, th * 0.21), lineSize = Math.min(44, th * 0.24);
    c.textAlign = 'left';
    c.save(); c.font = `900 ${nameSize}px ${FONT_D}`; c.letterSpacing = '2px'; c.fillStyle = L.ink; c.fillText(d.name, tx, y + th * (done ? 0.36 : 0.42)); c.restore();
    c.save(); c.font = `800 ${lineSize}px ${FONT_U}`; c.letterSpacing = '2px'; c.fillStyle = done ? L.ink : L.dim;
    c.fillText(done ? String(lineOf(d.id, today.mine[d.id])) : 'NOT YET', tx, y + th * (done ? 0.68 : 0.7)); c.restore();
    c.textAlign = 'center';
    // THE STAMP (done): ADMITTED — a rounded double border + the word, tilted −8°, in the ink; a touch translucent like real ink
    if (done) {
      const sw2 = Math.min(210, th * 1.05), sh = sw2 * 0.37, cx = x + w - 40 - sw2 / 2, cy = y + th / 2;
      c.save(); c.translate(cx, cy); c.rotate(-8 * Math.PI / 180); c.globalAlpha = night ? 0.95 : 0.9;
      if (night) { c.shadowColor = ink; c.shadowBlur = 16; }
      c.strokeStyle = ink; c.lineJoin = 'round';
      c.lineWidth = sh * 0.07; roundRect(c, -sw2 / 2, -sh / 2, sw2, sh, sh * 0.2); c.stroke();
      c.lineWidth = sh * 0.035; c.globalAlpha *= 0.9; roundRect(c, -sw2 / 2 + sh * 0.13, -sh / 2 + sh * 0.13, sw2 - sh * 0.26, sh - sh * 0.26, sh * 0.12); c.stroke();
      c.shadowBlur = 0; c.fillStyle = ink; c.font = `800 ${Math.round(sh * 0.34)}px ${FONT_U}`; c.letterSpacing = `${Math.round(sh * 0.05)}px`; c.fillText(STAMP_WORD, Math.round(sh * 0.025), 1);
      c.restore();
    }
  });

  // THE STREAK FLAME + its count
  if (streak > 0) {
    const fy = footTop + 8, fw = 78, fh = Math.round(fw * 160 / 140);
    const label = `${streak}-DAY STREAK`;
    c.save(); c.font = `800 36px ${FONT_U}`; c.letterSpacing = '5px';
    const tw = c.measureText(label).width, total = fw + 18 + tw, lx = W / 2 - total / 2;
    if (flame) c.drawImage(flame, lx, fy - 8, fw, fh);
    c.textAlign = 'left'; c.fillStyle = L.ink; c.fillText(label, lx + fw + 18, fy + fh / 2 - 4); c.restore();
    c.textAlign = 'center';
  }
  // THE FOOT = THE ADDRESS AS ITS HEADLINE (CITY FIXES — the dailies chat, Nov 8): NEONSPEAKEASY.COM about the result lines' size, bold, wide
  // tracking that never crowds; NIGHT a small neon sign (the sign's pink in a soft glow, a white core, a thin pink tube round it — like THE
  // DAILIES sign); DAY strong dark navy. The old "NEON SPEAKEASY" line above it is gone. It must read when the image is shown SMALL in a text
  // thread (a 360-px-wide downscale: ~17 px letters)
  { const ADDR = 'NEONSPEAKEASY.COM', ay = 1280;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    let fs = 52, ls = 7; c.font = `800 ${fs}px ${FONT_U}`; c.letterSpacing = `${ls}px`;
    while (c.measureText(ADDR).width > W - 220 && fs > 34) { fs -= 2; ls = Math.max(4, ls - 0.3); c.font = `800 ${fs}px ${FONT_U}`; c.letterSpacing = `${ls}px`; }
    const tw = c.measureText(ADDR).width, cx = W / 2 + ls / 2;
    if (night) {
      // the tube round it (rounded, thin, pink, glowing) + the letters: the glow pass, then the white-hot core
      const bw = tw + 76, bh = fs + 36;
      c.save(); c.shadowColor = L.glow; c.shadowBlur = 22; c.strokeStyle = L.sign; c.lineWidth = 4; roundRect(c, W / 2 - bw / 2, ay - bh / 2, bw, bh, bh / 2); c.stroke();
      c.shadowBlur = 4; c.strokeStyle = 'rgba(255,236,248,0.85)'; c.lineWidth = 1.4; roundRect(c, W / 2 - bw / 2, ay - bh / 2, bw, bh, bh / 2); c.stroke(); c.restore();
      c.shadowColor = L.glow; c.shadowBlur = 30; c.fillStyle = L.sign; c.fillText(ADDR, cx, ay);
      c.shadowBlur = 7; c.fillStyle = '#fff3fb'; c.fillText(ADDR, cx, ay);
    } else { c.fillStyle = '#10234a'; c.fillText(ADDR, cx, ay); }
    c.restore(); }
  return cv;
}

export async function shareToday(today, lineOf, { streak = 0 } = {}) {
  const line = shareTodayLine(today, (id, s) => String(lineOf(id, s)).toLowerCase());
  const cv = await drawToday(today, lineOf, undefined, { streak });
  return sendShare(cv, { file: 'neon-speakeasy-dailies.png', line });
}
