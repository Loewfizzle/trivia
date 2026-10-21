// CITY 2.0 — THE HARBOR: the landmark towers (the sunburst, the needle, the pyramid, the dome, the mast) — stepped tiers with
// a placeholder crown. Part 1: grey boxes; Part 5 crafts them as hero pieces (floodlit crowns, setbacks, neon).
import { skyBlock } from './blocks.js';

/** a landmark as its stepped tiers (each narrower, a little further back), the crown on the top tier */
export function tiersOf(t) {
  const n = t.tiers || 3, split = n === 2 ? [0.8, 0.2] : [0.62, 0.22, 0.16];
  const out = [];
  let y = 0, w = t.x1 - t.x0, z = t.z0;
  for (let i = 0; i < n; i++) {
    const h = t.h * split[i], cx = (t.x0 + t.x1) / 2;
    out.push({ x0: cx - w / 2, x1: cx + w / 2, z0: z, z1: z + 14, h, y0: y, crown: i === n - 1 ? t.crown : null });
    y += h; w *= 0.74; z += 1.3;
  }
  return out;
}

export function landmarkSteps(L, T) {
  const cam = L.cam;
  return [...L.landmarks].sort((a, b) => b.z0 - a.z0).map(t => x => {
    // a tier stands on the one below: a box from y0 to y0 + h, projected in the world (its side faces lean correctly)
    for (const tr of tiersOf(t)) skyBlock(x, cam, tr, T, 'landmark');
  });
}
