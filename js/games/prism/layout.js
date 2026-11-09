// PRISM DROP — THE LAYOUT (PD-1, split out of view.js): the sizes of the screen's parts from the screen's size + the settings. PURE (no DOM):
// the view measures the screen once per change (a ResizeObserver) and paints the numbers as CSS custom properties.
//   prismLayout({ W0, H0, scheme, spectating, duelist, btnScale, tier }) → { cell, sideL, sideR, topH, minisH, btnH, boardDpr }
import { W, VISIBLE } from './engine.js';

export function prismLayout({ W0, H0, scheme = 'gesture', spectating = false, duelist = false, btnScale = 0.5, tier = 2, dpr = 1 }) {
  const topH = 52;
  const btnH = scheme === 'buttons' && !spectating ? Math.round(118 + 46 * btnScale) : 0;
  let minisH = spectating ? 0 : (btnH ? 66 : 96);
  const sideL = Math.round(Math.max(40, Math.min(64, W0 * 0.115)));
  const sideR = duelist ? Math.round(Math.max(92, Math.min(150, W0 * 0.28))) : sideL;
  const cellW = (W0 - sideL - sideR - 16 - 9 - 6 - 12 - 4) / W; // ui padding, meter, glass inset, gaps, slack
  const cellH = (H0 - topH - minisH - btnH - 20) / VISIBLE;
  const cell = Math.max(10, Math.floor(Math.min(cellW, cellH, 40)));
  // spare height goes to the mini-boards (bigger when there's room)
  if (minisH) minisH = Math.max(minisH, Math.min(150, H0 - topH - cell * VISIBLE - btnH - 30));
  return { cell, sideL, sideR, topH, minisH, btnH, boardDpr: [1, 1.5, 2][tier] || 1, dpr };
}
