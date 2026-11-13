// PLAY NOW's ADD-ON (the owner, Nov 13 noon) — SHARE YOUR RUN: a solo run's podium (PLAY NOW's room or a room of one) offers SHARE for a
// cartridge with `shareRun` (PRISM DROP, OVERCLOCK). A tap draws ONE image ON THE PHONE (THE SHARE CARD pattern of the dailies — js/daily/share.js;
// never a server render, no new /api call): 1080 × 1350 portrait (reads in a text + a story) — the NEON SPEAKEASY sign at the top, the game + the
// mode, the game's own middle (PRISM DROP: the final board in its tubes / crayon; OVERCLOCK: the score), the player's NAME, the result line, the
// site at the foot. Nothing private: the card is built from the result's PUBLIC fields only (runCard — the unit test proves it). Out through the
// phone's share sheet with the IMAGE + the site's URL; no file sharing → the line + the image saved (js/daily/share.js#sendShare).
// Lazy: the console's podium (ui/final.js) asks the cartridge's shareRun on the first SHARE.
import { ctx2d } from '../../ui/canvas-safe.js';
import { sendShare, SHARE_W, SHARE_H, SITE } from '../../daily/share.js';

export const RUN_W = SHARE_W, RUN_H = SHARE_H;
const clip = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, '').slice(0, n);
/** PURE: the card's inputs, from a result's PUBLIC fields only — anything else is dropped (never a pid, a uid, a key, tag digits) */
export function runCard(o = {}) {
  return {
    game: /^[a-z]{2,16}$/.test(String(o.game || '')) ? o.game : 'game',
    title: clip(o.title, 24).toUpperCase(),
    mode: clip(o.mode, 24).toUpperCase(),
    name: clip(o.name, 16).toUpperCase(),
    result: clip(o.result, 64).toUpperCase(),
    big: o.big == null ? null : clip(o.big, 12),
    bigUnit: o.bigUnit == null ? null : clip(o.bigUnit, 16).toUpperCase(),
    board: typeof o.board === 'string' && /^[0-9a-zA-Z.\-_ ]{0,400}$/.test(o.board) ? o.board : null,
    look: o.look === 'day' ? 'day' : 'night',
    accent: /^#[0-9a-f]{6}$/i.test(String(o.accent || '')) ? o.accent : '#ff4fc4',
  };
}
/** the share line: "My PRISM DROP run — SURVIVED 1:52 · 14 LINES · https://neonspeakeasy.com" */
export const runLine = card => `My ${card.title} run — ${card.result} · https://${SITE}`;

/** a colour darkened for the day's paper (a light accent like PRISM DROP's ice blue reads on the night, not on the paper) */
const deepen = hex => { const n = parseInt(hex.slice(1), 16), k = 0.55; return `rgb(${[n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v * k)).join(',')})`; };
const FONT = (w, px, fam = '"Chakra Petch", system-ui, sans-serif') => `${w} ${px}px ${fam}`;
const DISPLAY = '"Orbitron", "Chakra Petch", system-ui, sans-serif';
/** neon lettering: a soft glow under a coloured tube with a hot core (by day: the coloured glass with a dark edge) */
function neonText(c, text, x, y, { px, col, day, spacing = 0, weight = 800, fam = DISPLAY }) {
  c.save();
  c.font = FONT(weight, px, fam); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  try { c.letterSpacing = `${spacing}px`; } catch { /* an older canvas: no tracking */ }
  if (day) {
    c.lineWidth = px * 0.1; c.strokeStyle = 'rgba(20,24,40,0.55)'; c.strokeText(text, x, y);
    c.fillStyle = col; c.fillText(text, x, y);
  } else {
    c.shadowColor = col; c.shadowBlur = px * 0.55; c.fillStyle = col; c.fillText(text, x, y);
    c.shadowBlur = px * 0.18; c.fillText(text, x, y);
    c.shadowBlur = 0; c.fillStyle = 'rgba(255,245,252,0.92)'; c.lineWidth = px * 0.035; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.strokeText(text, x, y);
  }
  c.restore();
}
/**
 * the card: the frame + the sign + the game's middle (`drawMiddle(c, box, card)` — the cartridge's) + the name + the result + the site
 * → a canvas (null when this phone can't make one)
 */
export function drawRunCard(card, drawMiddle = null) {
  const W = RUN_W, H = RUN_H, day = card.look === 'day';
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = ctx2d(cv);
  if (!c) return null;
  // the ground: the night's deep blue-violet (+ a pink haze under the sign) · the day's paper
  const g = c.createLinearGradient(0, 0, 0, H);
  if (day) { g.addColorStop(0, '#e9eef6'); g.addColorStop(1, '#cfd8e6'); } else { g.addColorStop(0, '#0b0820'); g.addColorStop(0.55, '#120b2c'); g.addColorStop(1, '#05040e'); }
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (!day) { const r = c.createRadialGradient(W / 2, 150, 0, W / 2, 150, 520); r.addColorStop(0, 'rgba(255,79,196,0.22)'); r.addColorStop(1, 'rgba(255,79,196,0)'); c.fillStyle = r; c.fillRect(0, 0, W, H); }   // (the whole card — a clipped haze left a hard edge)
  // THE SIGN: NEON (pink tubes) + SPEAKEASY (white, spaced) between two rules
  neonText(c, 'NEON', W / 2, 168, { px: 128, col: day ? '#e3249b' : '#ff4fc4', day, spacing: 14 });
  c.save(); c.font = FONT(700, 34, DISPLAY); c.textAlign = 'center'; try { c.letterSpacing = '22px'; } catch { /* fine */ }
  c.fillStyle = day ? '#2a2f45' : '#f2ecff'; c.fillText('SPEAKEASY', W / 2 + 11, 232); c.restore();
  c.strokeStyle = day ? 'rgba(42,47,69,0.35)' : 'rgba(242,236,255,0.35)'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(150, 220); c.lineTo(260, 220); c.moveTo(W - 260, 220); c.lineTo(W - 150, 220); c.stroke();
  // the game + the mode (the game's colour)
  c.save(); c.font = FONT(800, 44, DISPLAY); c.textAlign = 'center'; try { c.letterSpacing = '8px'; } catch { /* fine */ }
  c.fillStyle = day ? deepen(card.accent) : card.accent; if (!day) { c.shadowColor = card.accent; c.shadowBlur = 18; }
  c.fillText(card.mode ? `${card.title} · ${card.mode}` : card.title, W / 2 + 4, 318); c.restore();
  // the game's own middle
  const box = { x: 140, y: 360, w: W - 280, h: 690 };
  if (drawMiddle) { try { drawMiddle(c, box, card); } catch (e) { console.warn('[share-run] middle', e); } }
  // the name + the result
  c.save(); c.textAlign = 'center';
  c.font = FONT(800, 78, DISPLAY); try { c.letterSpacing = '6px'; } catch { /* fine */ }
  c.fillStyle = day ? '#1d2236' : '#ffffff'; c.fillText(card.name || 'A PLAYER', W / 2 + 3, 1140);
  c.font = FONT(700, 46); try { c.letterSpacing = '4px'; } catch { /* fine */ }
  c.fillStyle = day ? '#2f3653' : '#e6e1ff'; c.fillText(card.result, W / 2 + 2, 1206, W - 80);
  // the site
  c.font = FONT(700, 32); try { c.letterSpacing = '6px'; } catch { /* fine */ }
  c.fillStyle = day ? '#c21d86' : '#ff8fdc'; c.fillText(SITE.toUpperCase(), W / 2 + 3, 1290);
  c.restore();
  return cv;
}
/** SHARE: draw + send → 'shared' | 'saved' | 'copied' | 'none' | 'failed' */
export async function shareRunCard(card, drawMiddle) {
  const cv = drawRunCard(card, drawMiddle);
  if (!cv) return 'failed';
  return sendShare(cv, { file: `neon-speakeasy-${card.game}.png`, line: runLine(card) });
}
