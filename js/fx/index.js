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

export const FX = Object.freeze({ ufo, laser, smoke, frost, flames, prism, marquee, glitter });
