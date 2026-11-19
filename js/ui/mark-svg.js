// A game's neon mark as a small inline SVG string — its own tubes, its own colours. ONE builder (FIXES R2): THE PLAY sheet's rows
// (screens/title-taps.js) + the room's PICK A GAME (screens/room-city.js). Its own file: a lazy chunk never imports a boot-graph module for a
// NEW export (THE STALE-MODULE RULE) — this module is new to both.
import { markFor } from '../core/marks.js';

export function markSvg(game, cls = 'nd-shelf-mark') {
  const m = markFor(game);
  const w = (m && m.w) || 7;   // (a fine mark names its own tube width — core/marks.js: HIGH RISE's tower)
  const tubes = ((m && m.tubes) || []).map(t => `<path d="${t.d}" style="stroke:${t.col};fill:none;stroke-width:${w};stroke-linecap:round;stroke-linejoin:round"/>`).join('');
  return `<svg viewBox="0 0 100 100" aria-hidden="true" class="${cls}">${tubes}</svg>`;
}
