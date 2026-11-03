// THE VAULT 1C — AFTERBURNER's hero: the city's F-22 bake (scripts/bake/f22.mjs — "F22 Raptor FREE" by NLM, CC BY 4.0) at the card's angle:
// from below + ahead, banking, the planform + both intakes, in the day light (the three of the vic are this one jet, stamped).
//   node scripts/bake-model.mjs "<chromium>" f22-card   → assets/vault/sg/f22-hero.webp + f22.json
import { MODEL, page } from './f22.mjs';
import { cardRun } from './card-shots.mjs';
export { MODEL, page };
export const OUT = 'assets/vault/sg';
export const SHOTS = [
  { name: 'f22-hero', light: 'day', elev: 25, yaw: 35, roll: -12, px: 700,
    pts: [[-0.8, 0, 0.06], [-0.8, 0, -0.06]] },   // (the two nozzles)
];
export const run = cardRun(SHOTS, 'f22');
