// A game's neon mark as a small inline SVG string. ONE builder (FIXES R2): THE PLAY sheet + PICK A GAME. A tube's `w` = its own width;
// `day` (a pale ground): a tube's `o` = an outline under it (F5C: FREEFALL's ball).
import { markFor } from '../core/marks.js';
export { GAME_ACC } from '../core/marks.js';

export function markSvg(game, cls = 'nd-shelf-mark', day = false) {
  const m = markFor(game), w = (m && m.w) || 7;
  const p = (t, c, sw) => `<path d="${t.d}" style="stroke:${c};fill:none;stroke-width:${sw};stroke-linecap:round;stroke-linejoin:round"/>`;
  const tubes = ((m && m.tubes) || []).map(t => (day && t.o ? p(t, t.o, (t.w || w) + 3) : '') + p(t, t.col, t.w || w)).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true" class="${cls}">${tubes}</svg>`;
}
