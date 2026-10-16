// Tiny helpers for hole files. Coordinates: x across the course, y away from the tee (units ≈ 2 ball radii).
export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
/** Slope helper: a rectangle whose surface falls along `dir` (unit vector) with acceleration g; visual h0 -> h1. */
export const slope = (x0, y0, x1, y1, dir, g, h0 = null, h1 = null) => {
  const from = [dir[0] > 0 ? x0 : dir[0] < 0 ? x1 : x0, dir[1] > 0 ? y0 : dir[1] < 0 ? y1 : y0];
  const len = Math.abs(dir[0]) > Math.abs(dir[1]) ? x1 - x0 : y1 - y0;
  return { poly: rect(x0, y0, x1, y1), dir, g, h0, h1, from, len };
};
