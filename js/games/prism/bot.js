// PRISM DROP test bot (PURE): picks a placement for the current piece with the classic evaluation
// (aggregate height, holes, bumpiness, lines). Used by the match simulations and by the browser end-to-end
// test (window.__prism.bot), never by real players.
import { W, H, SHAPES, fits, ghostY } from './engine.js';

function evaluate(cells, lines) {
  const heights = new Array(W).fill(0);
  let holes = 0;
  for (let x = 0; x < W; x++) {
    let top = -1;
    for (let y = H - 1; y >= 0; y--) if (cells[y * W + x]) { top = y; break; }
    heights[x] = top + 1;
    for (let y = top - 1; y >= 0; y--) if (!cells[y * W + x]) holes++;
  }
  const agg = heights.reduce((a, b) => a + b, 0);
  let bump = 0;
  for (let x = 0; x < W - 1; x++) bump += Math.abs(heights[x] - heights[x + 1]);
  const maxH = Math.max(...heights);
  return -0.51 * agg + 0.76 * lines - 0.36 * holes * 1.6 - 0.18 * bump - (maxH > 14 ? (maxH - 14) * 2 : 0);
}

/** All final placements { r, x, score } for the current piece, best first. */
export function placements(g) {
  if (!g.cur) return [];
  const out = [];
  const t = g.cur.t;
  const rots = t === 2 ? [0] : [0, 1, 2, 3];
  for (const r of rots) {
    for (let x = -3; x < W + 1; x++) {
      const p = { t, r, x, y: Math.max(g.cur.y, 20) };
      if (!fits(g, p)) continue;
      const tmp = { ...g, cur: p };
      const y = ghostY(tmp);
      const cells = g.cells.slice();
      for (const [cx, cy] of SHAPES[t][r].map(([a, b]) => [p.x + a, y + b])) cells[cy * W + cx] = t;
      let lines = 0;
      for (let row = 0; row < H; row++) {
        let full = true;
        for (let cx = 0; cx < W; cx++) if (!cells[row * W + cx]) { full = false; break; }
        if (full) lines++;
      }
      out.push({ r, x, score: evaluate(cells, lines) });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

/** A move for the current piece; skill 0..1 (1 = always the best). rnd = random source. */
export function chooseMove(g, { skill = 0.9, rnd = Math.random } = {}) {
  const all = placements(g);
  if (!all.length) return null;
  if (rnd() > skill) return all[Math.min(all.length - 1, 1 + Math.floor(rnd() * Math.min(6, all.length - 1)))];
  return all[0];
}
