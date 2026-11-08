// THE DAILY MODULE — SHARE TODAY (DM2): ONE image card for all of today's dailies — each game's spoiler-free result line (its meta's scoreLine:
// THE PASSWORD's guesses / LOCKED OUT, COAST CLEAR's time / CAUGHT — never a board, never a word) + THE SWEEP, on THE DAILY KIT's frame
// (daily/share.js — 1080 × 1350, the look on screen, the site at the foot) + ONE plain line through the same share sheet. Fits 1–6 rows.
import { shareFrame, sendShare } from './share.js';
import { sweepState, shareTodayLine, MAX_ROWS } from './today-logic.js';

const LOOKS = {
  night: { bg0: '#05040c', bg1: '#1a0d2c', ink: '#f6f2ff', dim: 'rgba(226,222,246,0.72)', sign: '#ff6fc8', glow: 'rgba(255,111,200,0.75)', seg: 'rgba(255,255,255,0.14)', on: '#ff6fc8', panel: 'rgba(255,255,255,0.05)', line: 'rgba(255,111,200,0.45)', good: '#5ad1ff' },
  day: { bg0: '#bfdcff', bg1: '#eef6ff', ink: '#14284a', dim: '#3a5582', sign: '#16305c', glow: 'transparent', seg: 'rgba(60,100,160,0.2)', on: '#2f86ff', panel: 'rgba(255,255,255,0.7)', line: 'rgba(47,134,255,0.45)', good: '#2f86ff' },
};
const INK = { password: '#ff5ec4', coastclear: '#5fe1ff' };

/** the card (a canvas) — the screen's test hook draws it without sharing */
export function drawToday(today, lineOf, look = document.body.dataset.look === 'day' ? 'day' : 'night') {
  const L = LOOKS[look] || LOOKS.night;
  const { cv, c, W } = shareFrame({ bg0: L.bg0, bg1: L.bg1 }, look);
  const ds = (today.dailies || []).slice(0, MAX_ROWS), sw = sweepState(today);
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // the sign
  c.save(); c.font = '900 92px Orbitron, "Chakra Petch", system-ui, sans-serif'; c.letterSpacing = '12px';
  if (look === 'night') { c.shadowColor = L.glow; c.shadowBlur = 40; c.fillStyle = L.sign; c.fillText('THE DAILIES', W / 2 + 6, 170); c.shadowBlur = 8; c.fillStyle = '#fff3fb'; }
  else c.fillStyle = L.sign;
  c.fillText('THE DAILIES', W / 2 + 6, 170); c.restore();
  // THE SWEEP meter
  const mx = 150, mw = W - 300, gap = 18, n = Math.max(1, sw.of), sg = (mw - gap * (n - 1)) / n;
  sw.segs.forEach((s, i) => {
    c.fillStyle = s.done ? L.on : L.seg;
    if (s.done && look === 'night') { c.shadowColor = L.glow; c.shadowBlur = 24; } else c.shadowBlur = 0;
    roundRect(c, mx + i * (sg + gap), 270, sg, 26, 10); c.fill();
  });
  c.shadowBlur = 0;
  c.font = '700 34px "Chakra Petch", system-ui, sans-serif'; c.fillStyle = L.dim; c.save(); c.letterSpacing = '8px';
  c.fillText(sw.swept ? 'SWEPT · EVERY DAILY' : `${sw.done} OF ${sw.of} · THE SWEEP`, W / 2 + 4, 350); c.restore();
  // the rows: name left, the result right (one per daily — 1 to 6 fit between 420 and 1120)
  const top = 420, room = 680, rh = Math.min(150, room / Math.max(1, ds.length));
  ds.forEach((d, i) => {
    const y = top + i * rh, h = rh - 22, ink = look === 'day' ? L.on : (INK[d.id] || L.sign);
    c.fillStyle = L.panel; roundRect(c, 110, y, W - 220, h, 22); c.fill();
    c.strokeStyle = ink; c.globalAlpha = 0.6; c.lineWidth = 3; roundRect(c, 110, y, W - 220, h, 22); c.stroke(); c.globalAlpha = 1;
    const done = today.mine && today.mine[d.id] != null;
    c.textAlign = 'left'; c.font = `900 ${Math.min(44, h * 0.36)}px Orbitron, "Chakra Petch", system-ui, sans-serif`; c.fillStyle = L.ink;
    c.fillText(d.name, 150, y + h / 2);
    c.textAlign = 'right'; c.font = `800 ${Math.min(48, h * 0.4)}px "Chakra Petch", system-ui, sans-serif`;
    c.fillStyle = done ? L.ink : L.dim;
    c.fillText(done ? lineOf(d.id, today.mine[d.id]) : 'NOT YET', W - 150, y + h / 2);
  });
  c.textAlign = 'center';
  c.font = '700 30px "Chakra Petch", system-ui, sans-serif'; c.save(); c.letterSpacing = '6px';
  c.fillStyle = L.dim; c.fillText('NEON SPEAKEASY · TODAY', W / 2 + 3, 1190);
  c.fillStyle = L.on; c.fillText('NEONSPEAKEASY.COM', W / 2 + 3, 1250); c.restore();
  return cv;
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

export async function shareToday(today, lineOf) {
  const line = shareTodayLine(today, (id, s) => String(lineOf(id, s)).toLowerCase());
  const cv = drawToday(today, lineOf);
  return sendShare(cv, { file: 'neon-speakeasy-dailies.png', line });
}
