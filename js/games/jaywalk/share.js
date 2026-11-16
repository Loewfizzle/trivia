// JAYWALK — THE SHARE IMAGE (H4 — the owner, Nov 16: the player's REAL run; docs/jaywalk.md "THE SHARE IMAGE"). On the site's share kit
// (js/games/kit/share-run.js — its frame + its rules unchanged: the sign, the game, the middle, the name, the result, the site; drawn ON
// THE PHONE, built from the result's PUBLIC fields only). THE MIDDLE = the game frame frozen a beat after the player went out (the kid +
// what got him — shot.js: taken by the view, kept on this phone until the next run) with HOW THEY WENT OUT in neon words at its head,
// the lanes in the game's big neon numerals at its foot, and THE SIGNAL (the game's icon) in its corner. Every share is a different
// picture. No frame on this phone (a refresh on the podium) → the lanes + the words + the icon on the night's dark. A solo run + a match.
// Lazy (index.js#shareRun · victory.js's SHARE MY RUN).
import { runCard, shareRunCard } from '../kit/share-run.js';
import { spacedText } from '../../daily/share.js';
import { MARKS } from '../../core/marks.js';
import { ACCENT } from './meta.js';
import { shotFor } from './shot.js';
import { endOf } from './victory.js';

/** PURE: the card's inputs — this player's lanes + their cause line (the host's replay of their own log), their display name */
export function jwRunCard(game, { uid, name, line = '' }) {
  const lanes = Math.max(0, Math.floor(Number((((game && game.results) || {})[uid] || {}).l) || 0)), unit = lanes === 1 ? 'LANE' : 'LANES';
  return runCard({ game: 'jaywalk', title: 'JAYWALK', mode: game && game.mode === 'solo' ? 'SOLO' : '', name, big: lanes.toLocaleString('en-US'), bigUnit: unit,
    result: `${line ? `${line} · ` : ''}${lanes.toLocaleString('en-US')} ${unit}`, look: 'night', accent: ACCENT });
}
const DISPLAY = '"Orbitron", "Chakra Petch", system-ui, sans-serif';
/** THE SIGNAL, drawn as neon tubes (core/marks.js — the game's own mark): a 100-box scaled to `size` at (x, y) */
export function drawSignal(c, x, y, size) {
  c.save(); c.translate(x, y); c.scale(size / 100, size / 100); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const t of MARKS.jaywalk.tubes) {
    const p = new Path2D(t.d);
    c.shadowColor = t.col; c.shadowBlur = 22; c.strokeStyle = t.col; c.lineWidth = 7; c.stroke(p);
    c.shadowBlur = 0; c.strokeStyle = 'rgba(255,255,255,0.78)'; c.lineWidth = 2.2; c.stroke(p);
  }
  c.restore();
}
/** the cause line on ≤ 2 lines of ≤ `max` px: split at the middle space when one line is too long */
function wrap2(c, text, max) {
  if (c.measureText(text).width <= max) return [text];
  const w = text.split(' ');
  let best = [text], bw = Infinity;
  for (let i = 1; i < w.length; i++) { const a = w.slice(0, i).join(' '), b = w.slice(i).join(' '), m = Math.max(c.measureText(a).width, c.measureText(b).width); if (m < bw) { bw = m; best = [a, b]; } }
  return best;
}
/** the middle: THE RUN's FRAME (cropped round the kid) under the words, the lanes + the icon over it — or, with no frame, the dark */
export function drawRunMiddle(c, box, card, shot) {
  const { x, y, w, h } = box, r = 26;
  c.save();
  c.beginPath(); c.roundRect(x, y, w, h, r); c.clip();
  if (shot && shot.canvas && shot.canvas.width > 0) {
    // the frame: the whole width, the box's height of it round where the kid went out (a little above him: what got him is up the lane)
    const src = shot.canvas, k = w / src.width, sh = Math.min(src.height, h / k), cy = (shot.kidY == null ? 0.62 : shot.kidY) * src.height - sh * 0.08;
    const sy = Math.max(0, Math.min(src.height - sh, cy - sh / 2));
    c.drawImage(src, 0, sy, src.width, sh, x, y, w, sh * k);
  } else { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#14102c'); g.addColorStop(1, '#090716'); c.fillStyle = g; c.fillRect(x, y, w, h); }
  // the words read on any frame: a soft dark at the head + the foot
  let g = c.createLinearGradient(0, y, 0, y + 250); g.addColorStop(0, 'rgba(7,6,11,0.9)'); g.addColorStop(1, 'rgba(7,6,11,0)'); c.fillStyle = g; c.fillRect(x, y, w, 250);
  g = c.createLinearGradient(0, y + h - 300, 0, y + h); g.addColorStop(0, 'rgba(7,6,11,0)'); g.addColorStop(1, 'rgba(7,6,11,0.92)'); c.fillStyle = g; c.fillRect(x, y + h - 300, w, 300);
  c.restore();
  // the frame's edge: one thin neon line (the kit's own rounded window — never a pill)
  c.save(); c.strokeStyle = card.accent; c.lineWidth = 3; c.shadowColor = card.accent; c.shadowBlur = 18; c.beginPath(); c.roundRect(x, y, w, h, r); c.stroke(); c.restore();
  // HOW THEY WENT OUT — neon words at the head
  const line = String((shot && shot.line) || card.line || '').toUpperCase();
  if (line) {
    c.save(); c.textAlign = 'left'; c.font = `900 58px ${DISPLAY}`;
    const rows = wrap2(c, line, w - 190);
    rows.forEach((t, i) => { c.shadowColor = card.accent; c.shadowBlur = 30; c.fillStyle = '#fff3fb'; c.fillText(t, x + 34, y + 84 + i * 66); c.shadowBlur = 8; c.fillText(t, x + 34, y + 84 + i * 66); });
    c.restore();
  }
  // THE SIGNAL in the corner
  drawSignal(c, x + w - 150, y + 22, 128);
  // the lanes: the game's big neon numerals at the foot
  c.save(); c.textAlign = 'left'; c.font = `900 210px ${DISPLAY}`;
  const big = card.big || '0';
  c.shadowColor = card.accent; c.shadowBlur = 44; c.fillStyle = '#fff3fb'; c.fillText(big, x + 30, y + h - 44);
  c.shadowBlur = 12; c.fillText(big, x + 30, y + h - 44);
  const bw = c.measureText(big).width;
  c.shadowBlur = 0; c.font = `800 46px ${DISPLAY}`; c.fillStyle = '#ffd6f0'; spacedText(c, card.bigUnit || 'LANES', x + 30 + bw + 26, y + h - 52, 12);
  c.restore();
}
export function shareRun(game, state) {
  const uid = state && state.uid, me = (state && state.players && state.players[uid]) || {};
  const shot = shotFor(game && game.matchId), E = endOf(game, uid, state && state.code);
  const card = { ...jwRunCard(game, { uid, name: me.name, line: (shot && shot.line) || E.line }), line: (shot && shot.line) || E.line };
  return shareRunCard(card, (c, box, k) => drawRunMiddle(c, box, k, shot));
}
