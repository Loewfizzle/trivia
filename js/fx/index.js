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
import scan from './scan.js';
import spot from './spot.js';
import rays from './rays.js';
import embers from './embers.js';
import twinkle from './twinkle.js';
import confetti from './confetti.js';
import circuit from './circuit.js';
import holo from './holo.js';
import bulbs from './bulbs.js';
import penthouse from './penthouse.js';
import veil from './veil.js';
import neoncamo from './neoncamo.js';
import witness from './witness.js';
import { wildfire, eternal } from './blaze.js';

/** COMBO (THE VAULT 1C — an EPIC's two effects together on ONE slot): parts = [[effect, opts the part overrides]…], drawn in order */
export function combo(id, tier, ...parts) {
  return { id, tier, bleed: Math.max(...parts.map(([e]) => e.bleed || 0)), stillT: parts[0][0].stillT,
    draw(c, s, t, Q) { for (const [e, o] of parts) { c.save(); e.draw(c, o ? { ...s, opts: { ...s.opts, ...o } } : s, t, Q); c.restore(); } } };
}

export const FX = Object.freeze({ ufo, laser, smoke, frost, flames, prism, marquee, glitter, hearts, sheen, tube,
  // THE VAULT 1C — THE 8 SIGHTING CARDS (each the city's own model / painter in its own scene: js/fx/sg-kit.js)
  sgTr3b, sgBlackbird, sgF22, sgGhost, sgAurora, sgFireball, sgSkull, sgBtc,
  // THE VAULT 1C — the held-back cards' effects (+ the epics' combos)
  scan, spot, rays, embers, twinkle, confetti, circuit, holo, bulbs, penthouse, veil, neoncamo, witness, wildfire, eternal,
  noir: combo('noir', 'epic', [tube, { tint: '255,58,92' }], [smoke, null]),
  sapphire: combo('sapphire', 'epic', [sheen, { tint: '200,214,238' }], [twinkle, { tint: '226,234,255', n: 1.3 }]),
  legend: combo('legend', 'epic', [holo, null], [twinkle, { tint: '255,255,255', n: 1.1 }]),
  century: combo('century', 'epic', [flames, null], [embers, { noBed: true, tint: '255,200,90' }]) });
