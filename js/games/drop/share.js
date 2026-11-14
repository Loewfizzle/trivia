// THE DROP — THE SHARE CARD (THE DROP B — docs/prism.md "THE DROP"; the owner's plan: "the final-board picture KEPT, the junk rows drawn SOLID").
// SHARE YOUR RUN's card (js/games/kit/share-run.js — the sign, the game's middle, the result, the site; PRISM DROP's board middle —
// prism/share.js#drawBoardMiddle, both looks) with THE DROP's run: the FINAL BOARD with every junk row drawn SOLID (the day's holes are the same
// for everyone — a picture of them would give the day away), THE DROP · the day, the time (m:ss.t) big, the lines. No name, no pid, nothing else.
// The SAME pieces paint SHARE TODAY's section (`paintSection` — js/daily/share-today.js): the board on the left, the time + the lines on the right.
//   solidJunk(board) — PURE (the server runs it too: api/_lib/drop.js#share never sends a hole)
//   dropInputs({ t, ln, b, day }) — PURE: the card's only inputs (SHARE_KEYS)
//   renderShare({ inputs, look }) → <canvas>   ·   shareDrop({ inputs, look }) → 'shared' | 'saved' | 'copied' | 'none' | 'failed'
//   paintSection(c, { inputs, look, W, H })
import { W as BW, VISIBLE, JUNK } from '../prism/engine.js';
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
  return K.drawRunCard(card, P.drawBoardMiddle);
}
/** SHARE: the card through the phone's share sheet with the line (THE DAILY KIT's sender) */
export async function shareDrop({ inputs, look = 'night' } = {}) {
  const cv = await renderShare({ inputs, look });
  if (!cv) return 'failed';
  const { S } = await load();
  return S.sendShare(cv, { file: 'the-drop.png', line: shareLine(inputs) });
}

// ---------------------------------------------------------------------------------------------- SHARE TODAY's SECTION
export const SECTION_H = 420;
/** the board (the holes filled) drawn into a box — PRISM DROP's own mini (its tubes by night, its crayon by day) */
function paintBoard(c, P, I, look, x, y, h) {
  const w = h * BW / VISIBLE, day = look === 'day';
  c.save();
  c.fillStyle = day ? 'rgba(255,255,255,0.55)' : 'rgba(6,8,22,0.92)';
  c.strokeStyle = day ? 'rgba(40,46,70,0.6)' : 'rgba(143,216,255,0.75)'; c.lineWidth = 3;
  if (!day) { c.shadowColor = '#8fd8ff'; c.shadowBlur = 18; }
  c.beginPath(); c.roundRect(x - 9, y - 9, w + 18, h + 18, 14); c.fill(); c.stroke();
  c.restore();
  if (I.b) { const t = document.createElement('canvas'); P.drawMini(t, I.b, null, { cell: Math.max(6, Math.round(h / VISIBLE)), look: day ? 'crayon' : 'neon' }); c.drawImage(t, x, y, w, h); }
  return w;
}
/**
 * THE DROP as a section of SHARE TODAY: its wordmark on top; the final board (the holes filled) + the big time over the lines, side by side,
 * centred as a pair — the whole block centred in the box (W × H). P = PRISM DROP's board module (its drawMini — share-today.js loads it).
 */
export function paintSection(c, { inputs, look = 'night', W = 1080, H = SECTION_H, P = null } = {}) {
  const I = dropInputs(inputs);
  const day = look === 'day';
  const ink = day ? '#14284a' : '#f6f2ff', dim = day ? '#3a5582' : 'rgba(226,222,246,0.72)', sign = day ? '#5b33c9' : '#eef1ff', glow = day ? 'transparent' : 'rgba(170,190,255,0.8)';
  const contentH = 380;
  c.save();
  c.translate(0, Math.max(0, (H - contentH) / 2));
  c.textAlign = 'center'; c.textBaseline = 'middle';
  // the wordmark (THE DROP, PRISM's white light by night — the ticket's ink)
  c.save(); c.font = '900 50px "Orbitron", "Chakra Petch", system-ui, sans-serif'; c.letterSpacing = '10px';
  if (!day) { c.shadowColor = glow; c.shadowBlur = 22; }
  c.fillStyle = sign; c.fillText('THE DROP', W / 2 + 5, 36); c.restore();
  // the pair: the board (left) + the time over the lines (right)
  const bh = 290, bw = bh * BW / VISIBLE;
  c.save(); c.font = '700 168px "Chakra Petch", system-ui, sans-serif'; const tw = c.measureText(timeOf(I.t)).width; c.restore();
  const gap = 70, x0 = (W - (bw + gap + tw)) / 2;
  if (P) paintBoard(c, P, I, look, x0, 82, bh);
  const rx = x0 + bw + gap + tw / 2;
  c.save(); c.font = '700 168px "Chakra Petch", system-ui, sans-serif'; c.fillStyle = ink; c.fillText(timeOf(I.t), rx, 196); c.restore();
  c.save(); c.font = '700 44px "Chakra Petch", system-ui, sans-serif'; c.letterSpacing = '6px'; c.fillStyle = dim; c.fillText(isEnd(I) ? `THE END · ${linesOf(I.ln)}` : linesOf(I.ln), rx + 3, 318); c.restore();
  c.restore();
}
