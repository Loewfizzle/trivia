// THE VAULT 1C — SKY KING's hero: the city's SR-71 bake (scripts/bake/sr71.mjs — "SR-71 blackbird (FREE) downloadable" by pablogcg05,
// CC BY 4.0) at the card's angle: from below + ahead, the long chines + the delta's underside, banking a touch, in the golden light (dusk).
//   node scripts/bake-model.mjs "<chromium>" sr71-card   → assets/vault/sg/sr71-*.webp + sr71.json
import { MODEL, page } from './sr71.mjs';
import { cardRun } from './card-shots.mjs';
export { MODEL, page };
export const OUT = 'assets/vault/sg';
export const SHOTS = [
  { name: 'sr71-hero', light: 'golden', elev: 25, yaw: 40, roll: -6, px: 960,
    pts: [[-0.86, -0.02, 0.34], [-0.86, -0.02, -0.34], [-0.95, 0, 0]] },   // (the two nacelles' exits + the tail cone)
];
export const run = cardRun(SHOTS, 'sr71');
