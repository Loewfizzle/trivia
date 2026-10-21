// CITY 2.0 — THE HARBOR: the far skyline bands (the haze band at z 620–820, the far band at z 380–560). Part 1: grey boxes.
// Part 2 builds them for real (glitter windows, floodlit crowns, the haze). Baked into the 'far' layer with mid.js.
import { bandSteps, hazeVeil } from './blocks.js';

export function farSteps(L, T) {
  const cam = L.cam, band = id => L.bands.find(b => b.id === id).blocks;
  return [
    ...bandSteps(cam, band('haze'), T, 'far', 12),
    x => hazeVeil(x, cam, 620, 70, T, 0.75),
    ...bandSteps(cam, band('far'), T, 'far', 10),
    x => hazeVeil(x, cam, 380, 60, T, 0.55),
  ];
}
