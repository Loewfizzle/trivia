// THE EFFECT LIBRARY — the registry (docs/vault.md). An effect: { id, tier (the tier it was built for), bleed (px its glow may spill past
// its slot), stillT (its reduced-motion frame), draw(c, slot, t, Q) } — c already translated to the slot's top-left in CSS px; slot.w /
// slot.h its size, slot.opts its options (seed, calm, tint, radius), slot.st its own state; Q = { q (THE TIER TABLE's particle share),
// still, dpr, calm, tier }. A NEW effect = a file here + its line below; anyone (a strip, an emblem row, the end of round, the city)
// draws it through a surface (renderer.js).
import ufo from './ufo.js';
import laser from './laser.js';
import smoke from './smoke.js';
import frost from './frost.js';
import flames from './flames.js';
import prism from './prism.js';
import marquee from './marquee.js';
import glitter from './glitter.js';
import hearts from './hearts.js';
import sheen from './sheen.js';
import tube from './tube.js';
import sgTr3b from './sg-tr3b.js';
import sgBlackbird from './sg-blackbird.js';
import sgF22 from './sg-f22.js';
import sgGhost from './sg-ghost.js';
import sgAurora from './sg-aurora.js';
import sgFireball from './sg-fireball.js';
import { skull as sgSkull, btc as sgBtc } from './sg-balloons.js';

export const FX = Object.freeze({ ufo, laser, smoke, frost, flames, prism, marquee, glitter, hearts, sheen, tube,
  // THE VAULT 1C — THE 8 SIGHTING CARDS (each the city's own model / painter in its own scene: js/fx/sg-kit.js)
  sgTr3b, sgBlackbird, sgF22, sgGhost, sgAurora, sgFireball, sgSkull, sgBtc });
