// CITY 2.0 — THE HARBOR: the mid skyline band (z 300–360) between the far bands and the landmark towers. Part 1: grey boxes.
import { bandSteps, hazeVeil } from './blocks.js';

export function midSteps(L, T) {
  const cam = L.cam;
  return [...bandSteps(cam, L.bands.find(b => b.id === 'mid').blocks, T, 'mid', 8), x => hazeVeil(x, cam, 300, 46, T, 0.42)];
}
