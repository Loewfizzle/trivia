// THE DROP — THE SHARE CARD (THE DROP B — docs/prism.md "THE DROP"; the owner's plan: "the final-board picture KEPT, the junk rows drawn SOLID").
// SHARE YOUR RUN's card (js/games/kit/share-run.js — the sign, the game's middle, the result, the site; PRISM DROP's board middle —
// prism/share.js#drawBoardMiddle, both looks) with THE DROP's run: the FINAL BOARD with every junk row drawn SOLID (the day's holes are the same
// for everyone — a picture of them would give the day away), THE DROP · the day, the time (m:ss.t) big, the lines. No name, no pid, nothing else.
// The SAME pieces paint SHARE TODAY's section (`paintSection` — js/daily/share-today.js).
// SKINS 2A (the owner, Nov 14): the JUNK rows draw SOLID FILLED grey blocks on both (never outline squares — board.js#SOLID_JUNK: the board
// reads packed); the section follows ONE RHYTHM (js/daily/share.js#RHYTHM): THE DROP · the big time · the lines · the art strip = A CROP OF THE
// BOARD's TOP ROWS (cropRows — the stack's top STRIP_ROWS rows at the strip's height: readable at real size; a whole board in the strip was
// 6-px cells); the card's foot = the kit's (one straight neon line + the address).
//   solidJunk(board) — PURE (the server runs it too: api/_lib/drop.js#share never sends a hole)
//   dropInputs({ t, ln, b, day }) — PURE: the card's only inputs (SHARE_KEYS)
//   renderShare({ inputs, look }) → <canvas>   ·   shareDrop({ inputs, look }) → 'shared' | 'saved' | 'copied' | 'none' | 'failed'
//   paintSection(c, { inputs, look, W, H })   ·   cropRows(board, n) — PURE: which rows the strip shows
import { W as BW, VISIBLE, JUNK } from '../prism/engine.js';
import { RHYTHM } from '../../daily/share.js';
import { lazyImport } from '../../ui/lazy-import.js';

export const SHARE_KEYS = Object.freeze(['t', 'ln', 'b', 'day']);
const END_MS = 480_000;
/** every row with a junk cell drawn SOLID — its hole filled with junk too (PURE: a board string, W cells a row, bottom row first) */
export function solidJunk(board) {
  const s = typeof board === 'string' ? board.replace(/[^0-9]/g, '') : '';
  let out = '';
  for (let i = 0; i < s.length; i += BW) {
    const row = s.slice(i, i + BW);
    out += row.includes(String(JUNK)) ? row.replace(/0/g, String(JUNK)) : row;
  }
  return out.slice(0, BW * VISIBLE);
}
/** the time line: "5:12.4" (THE END: "8:00") */
export function timeOf(t) {
  const d = Math.max(0, Math.min(END_MS / 100, Math.round((Number(t) || 0) / 100))), s = Math.floor(d / 10);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}${d >= END_MS / 100 ? '' : `.${d % 10}`}`;
}
export const linesOf = ln => { const n = Math.max(0, Math.min(999, Number(ln) | 0)); return `${n} ${n === 1 ? 'LINE' : 'LINES'}`; };
/** PURE: the card's inputs — only these keys, each cleaned; the board's holes filled */
export function dropInputs(o = {}) {
  return {
    t: Math.max(0, Math.min(END_MS, Number(o.t) || 0)),
    ln: Math.max(0, Math.min(999, Number(o.ln) | 0)),
    b: solidJunk(o.b),
    day: /^d\d{8}$/.test(String(o.day || '')) ? String(o.day) : null,
  };
}
/** "FRI NOV 13" from the day key (its own calendar day) */
function dateOf(day) {
  const m = /^d(\d{4})(\d{2})(\d{2})$/.exec(String(day || ''));
  if (!m) return '';
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12)).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(',', '').toUpperCase();
}
const isEnd = I => I.t >= END_MS;
/** the one plain line: "THE DROP · FRI NOV 13 · 5:12.4 · 17 LINES · https://neonspeakeasy.com" */
export function shareLine(inputs, site = 'neonspeakeasy.com') {
  const I = dropInputs(inputs);
  return ['THE DROP', dateOf(I.day), timeOf(I.t), isEnd(I) ? 'THE END' : '', linesOf(I.ln), `https://${site}`].filter(Boolean).join(' · ');
}

let mods = null;
const load = () => (mods ||= Promise.all([lazyImport(import('../kit/share-run.js'), '../kit/share-run.js'), lazyImport(import('../prism/share.js'), '../prism/share.js'),
  lazyImport(import('../prism/meta.js'), '../prism/meta.js'), lazyImport(import('../../daily/share.js'), '../../daily/share.js')]).then(([K, P, M, S]) => ({ K, P, M, S })));

/** THE CARD: SHARE YOUR RUN's frame + PRISM DROP's board middle (the holes filled) → a canvas */
export async function renderShare({ inputs, look = 'night' } = {}) {
  const { K, P, M } = await load();
  const I = dropInputs(inputs);
  const card = K.runCard({ game: 'drop', title: 'THE DROP', mode: dateOf(I.day), name: timeOf(I.t), result: isEnd(I) ? `THE END · ${linesOf(I.ln)}` : linesOf(I.ln), board: I.b || null, look, accent: M.ACCENT });
  return K.drawRunCard(card, (c, box, k) => P.drawBoardMiddle(c, box, k, { solid: true }));   // (the junk rows SOLID FILLED)
}
/** SHARE: the card through the phone's share sheet with the line (THE DAILY KIT's sender) */
export async function shareDrop({ inputs, look = 'night' } = {}) {
  const cv = await renderShare({ inputs, look });
  if (!cv) return 'failed';
  const { S } = await load();
  return S.sendShare(cv, { file: 'the-drop.png', line: shareLine(inputs) });
}

// ---------------------------------------------------------------------------------------------- SHARE TODAY's SECTION
export const SECTION_H = RHYTHM.H;
export const STRIP_ROWS = 6;
/** PURE: the rows the strip shows — the stack's top `n` rows (a topped-out board: its top 6; a low stack: the bottom 6) → { from, to } (rows
 *  from the floor, `to` exclusive) */
export function cropRows(board, n = STRIP_ROWS) {
  const s = typeof board === 'string' ? board : '';
  let top = -1;
  for (let i = Math.min(s.length, BW * VISIBLE) - 1; i >= 0; i--) if (s.charCodeAt(i) !== 48) { top = (i / BW) | 0; break; }
  const to = Math.max(Math.min(n, VISIBLE), top + 1);
  return { from: to - Math.min(n, VISIBLE), to };
}
/** the art strip: the board's top rows (the junk SOLID), `h` tall, centred on cx — PRISM DROP's own mini (its tubes by night, its crayon by
 *  day) in a thin straight frame, open at the foot (the board goes on below) */
function paintStrip(c, P, I, look, cx, y, h) {
  const day = look === 'day', cell = h / STRIP_ROWS, w = cell * BW, x = cx - w / 2, { from, to } = cropRows(I.b);
  const t = document.createElement('canvas');
  P.drawMini(t, I.b || '', null, { cell: Math.max(6, Math.round(cell)), look: day ? 'crayon' : 'neon', solid: P.SOLID_JUNK[day ? 'day' : 'night'] });
  const px = t.width / BW, o = document.createElement('canvas');
  o.width = Math.round(w * 2); o.height = Math.round(h * 2);
  const g = o.getContext('2d');
  g.fillStyle = day ? 'rgba(255,255,255,0.6)' : 'rgba(6,8,22,0.92)'; g.fillRect(0, 0, o.width, o.height);
  g.imageSmoothingQuality = 'high';
  g.drawImage(t, 0, (VISIBLE - to) * px, t.width, (to - from) * px, 0, 0, o.width, o.height);
  c.drawImage(o, x, y, w, h);
  // the frame: straight lines — the top + the two sides (open at the foot where the board goes on)
  c.save();
  const col = day ? 'rgba(40,46,70,0.7)' : 'rgba(143,216,255,0.85)';
  const side = c.createLinearGradient(0, y, 0, y + h); side.addColorStop(0, col); side.addColorStop(0.72, col); side.addColorStop(1, day ? 'rgba(40,46,70,0)' : 'rgba(143,216,255,0)');
  c.lineWidth = 3; c.lineCap = 'butt';
  if (!day) { c.shadowColor = '#8fd8ff'; c.shadowBlur = 12; }
  c.strokeStyle = from > 0 ? side : col;
  c.beginPath(); c.moveTo(x - 1.5, y + h); c.lineTo(x - 1.5, y - 1.5); c.lineTo(x + w + 1.5, y - 1.5); c.lineTo(x + w + 1.5, y + h);
  if (from <= 0) c.closePath();
  c.stroke();
  c.restore();
}
/**
 * THE DROP as a section of SHARE TODAY — ONE RHYTHM (SKINS 2A; js/daily/share.js#RHYTHM): its wordmark · the big time · the lines · the art
 * strip (the board's top rows, the junk SOLID) — centred on the card's centre line, the block centred in the box (W × H). P = PRISM DROP's
 * board module (its drawMini — share-today.js loads it).
 */
export function paintSection(c, { inputs, look = 'night', W = 1080, H = SECTION_H, P = null } = {}) {
  const I = dropInputs(inputs), R = RHYTHM;
  const day = look === 'day';
  const ink = day ? '#14284a' : '#f6f2ff', sign = day ? '#5b33c9' : '#eef1ff', glow = day ? 'transparent' : 'rgba(170,190,255,0.8)';
  c.save();
  c.translate(0, Math.max(0, (H - R.H) / 2));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // the wordmark (THE DROP, PRISM's white light by night — the ticket's ink)
  c.save(); c.font = `900 ${R.namePx}px "Orbitron", "Chakra Petch", system-ui, sans-serif`; c.letterSpacing = '9px';
  if (!day) { c.shadowColor = glow; c.shadowBlur = 20; }
  c.fillStyle = sign; c.fillText('THE DROP', W / 2 + 4.5, R.nameY); c.restore();
  // the big time · the lines
  c.save(); c.font = `700 ${R.bigPx}px "Chakra Petch", system-ui, sans-serif`; c.fillStyle = ink; c.fillText(timeOf(I.t), W / 2, R.bigY); c.restore();
  c.save(); c.font = `700 ${R.statPx}px "Chakra Petch", system-ui, sans-serif`; c.letterSpacing = '4px'; c.fillStyle = ink; c.fillText(isEnd(I) ? `THE END · ${linesOf(I.ln)}` : linesOf(I.ln), W / 2 + 2, R.statY); c.restore();
  if (P) paintStrip(c, P, I, look, W / 2, R.artY, R.artH);
  c.restore();
}
