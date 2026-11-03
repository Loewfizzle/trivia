// THE VAULT — THE LAB's CATALOG (PURE — the server validates THE CARD LAB's marks against it; docs/vault.md). Every collectible the lab
// shows, in the order it shows them. THE VAULT 1A = THE STYLE TEST: the 8 sample cards as SLIM STRIPS (the owner approved the set, Nov 2
// 10:23 pm) + the two test emblems. A NEW card / emblem plugs in with a row here (+ its look in js/vault/strip.js + its item in
// core/items.js); it ships to players only once the owner APPROVES it in the lab (js/vault/approved.js).
export const LAB = Object.freeze([
  { id: 'card-brushed', kind: 'card', name: 'BRUSHED GOLD', tier: 'common', n: 1, motion: 'Still — real brushed gold, a bevelled edge; its emblem leads' },
  { id: 'card-smoke', kind: 'card', name: 'SMOKE ROOM', tier: 'uncommon', n: 2, motion: 'Smoke drifting across + curling off the edge, lit by a warm lamp' },
  { id: 'card-frostbite', kind: 'card', name: 'FROSTBITE', tier: 'uncommon', n: 3, motion: 'Frost creeping in from the edges, a crack running + glinting' },
  { id: 'card-inferno', kind: 'card', name: 'INFERNO', tier: 'rare', n: 4, motion: 'Flames licking up, embers rising, the edge glowing + pulsing' },
  { id: 'card-prism', kind: 'card', name: 'PRISM', tier: 'rare', n: 5, motion: 'A white beam splitting into a sweeping rainbow + a holo sheen' },
  { id: 'card-marquee', kind: 'card', name: 'THE MARQUEE', tier: 'epic', n: 6, motion: 'Theatre bulbs chasing round the edge + a neon tube flickering on' },
  { id: 'card-glitter', kind: 'card', name: 'GLITTER BOMB', tier: 'epic', n: 7, motion: 'Pink glitter bursting from the middle, hearts tumbling, sparkles popping' },
  { id: 'card-sg-ufo', kind: 'card', name: 'I WANT TO BELIEVE', tier: 'legendary', n: 8, motion: 'The real UFO over the harbor, its beam pulsing, motes rising, ports chasing + THE BORDER LASER' },
  { id: 'emb-test-neon', kind: 'emblem', name: 'BOLT · NEON', tier: 'common', n: 9, motion: 'The house tube: its glow, an ignition flicker (quiet on a legendary)' },
  { id: 'emb-test-prism', kind: 'emblem', name: 'BOLT · PRISM', tier: 'rare', n: 10, motion: 'A rainbow sweeping through the shape, a white edge, a glint (leads on a still card)' },
  // THE VAULT 1B — THE LAUNCH SET, part 1: what players meet FIRST (the ORIGINAL GILDED everyone owns + the early level rewards) — strips
  { id: 'card-gilded', kind: 'card', name: 'GILDED', tier: 'common', n: 19, motion: 'Still — black lacquer, the brass fan over the door, a brass double frame (everyone owns it; its full card is the Gilded membership card)' },
  { id: 'card-midnight', kind: 'card', name: 'MIDNIGHT', tier: 'common', n: 20, motion: 'Still — ink + starlight: a deep blue night, a faint band of the galaxy, stars at three sizes' },
  { id: 'card-heartbreaker', kind: 'card', name: 'HEARTBREAKER', tier: 'uncommon', n: 21, motion: 'Pink + lilac hearts drifting up through violet, swaying + turning, calmer behind the name' },
  { id: 'card-brass', kind: 'card', name: 'BRASS DECO', tier: 'common', n: 22, motion: 'Still — warm brass engraved like the bar rail: a deco lattice cut in, a polished crown' },
  { id: 'card-emerald', kind: 'card', name: 'EMERALD & BRASS', tier: 'uncommon', n: 23, motion: 'Green-black lacquer, a stepped deco crown in brass + emerald; a shine sweeps the foil + a glint' },
  { id: 'card-neonglass', kind: 'card', name: 'NEON GLASS', tier: 'uncommon', n: 24, motion: 'Smoked glass, a cyan tube bent round inside the edge — breathing, now + then it stutters' },
  { id: 'card-chrome', kind: 'card', name: 'SILVER CHROME', tier: 'uncommon', n: 25, motion: 'Mirror chrome, a prism running the rim; a cold shine sweeps across + a glint' },
  { id: 'card-champagne', kind: 'card', name: 'MIDNIGHT & CHAMPAGNE', tier: 'uncommon', n: 26, motion: 'Navy lacquer, Chrysler arches in champagne silver; a warm shine sweeps the foil' },
  // THE VAULT 1B — THE FULL CARDS of the 8 approved strips (their own marks: the strip can ship before its full card)
  { id: 'full-card-brushed', kind: 'full', of: 'card-brushed', name: 'BRUSHED GOLD · FULL CARD', tier: 'common', n: 11, motion: 'Still — the brushed gold at full size, its bevel + a bar-rail sheen; the emblem leads' },
  { id: 'full-card-smoke', kind: 'full', of: 'card-smoke', name: 'SMOKE ROOM · FULL CARD', tier: 'uncommon', n: 12, motion: 'Banks of smoke drifting through the lounge in two depths, curling up off the card, the lamp warming them' },
  { id: 'full-card-frostbite', kind: 'full', of: 'card-frostbite', name: 'FROSTBITE · FULL CARD', tier: 'uncommon', n: 13, motion: 'Frost growing in from every edge, the crack running across the ice + its glint, then easing back' },
  { id: 'full-card-inferno', kind: 'full', of: 'card-inferno', name: 'INFERNO · FULL CARD', tier: 'rare', n: 14, motion: 'A wall of flame up the card, embers + sparks rising, the edge burning + breathing, a foil sheen' },
  { id: 'full-card-prism', kind: 'full', of: 'card-prism', name: 'PRISM · FULL CARD', tier: 'rare', n: 15, motion: 'The white beam into the glass prism, the rainbow fanning out + sweeping, the holo sheen, a glinting edge' },
  { id: 'full-card-marquee', kind: 'full', of: 'card-marquee', name: 'THE MARQUEE · FULL CARD', tier: 'epic', n: 16, motion: 'A full ring of theatre bulbs chasing (+ the ring flash) round red velvet, the neon arrow flickering on' },
  { id: 'full-card-glitter', kind: 'full', of: 'card-glitter', name: 'GLITTER BOMB · FULL CARD', tier: 'epic', n: 17, motion: 'Pink glitter bursting with a shockwave, foil flakes flashing, hearts tumbling, sparkles popping' },
  { id: 'full-card-midnight', kind: 'full', of: 'card-midnight', name: 'MIDNIGHT · FULL CARD', tier: 'common', n: 27, motion: 'Still — the night + its stars at full size' },
  { id: 'full-card-heartbreaker', kind: 'full', of: 'card-heartbreaker', name: 'HEARTBREAKER · FULL CARD', tier: 'uncommon', n: 28, motion: 'Hearts drifting up the whole card, a pink haze breathing at the foot' },
  { id: 'full-card-brass', kind: 'full', of: 'card-brass', name: 'BRASS DECO · FULL CARD', tier: 'common', n: 29, motion: 'Still — the engraved brass at full size' },
  { id: 'full-card-emerald', kind: 'full', of: 'card-emerald', name: 'EMERALD & BRASS · FULL CARD', tier: 'uncommon', n: 30, motion: 'The stepped crown, the shine pass + its glint' },
  { id: 'full-card-neonglass', kind: 'full', of: 'card-neonglass', name: 'NEON GLASS · FULL CARD', tier: 'uncommon', n: 31, motion: 'The tube round the whole card, breathing + stuttering' },
  { id: 'full-card-chrome', kind: 'full', of: 'card-chrome', name: 'SILVER CHROME · FULL CARD', tier: 'uncommon', n: 32, motion: 'Mirror chrome, the prism rim, the shine pass' },
  { id: 'full-card-champagne', kind: 'full', of: 'card-champagne', name: 'MIDNIGHT & CHAMPAGNE · FULL CARD', tier: 'uncommon', n: 33, motion: 'The arches, the warm shine pass' },
  { id: 'full-card-sg-ufo', kind: 'full', of: 'card-sg-ufo', name: 'I WANT TO BELIEVE · FULL CARD', tier: 'legendary', n: 18, motion: 'The real UFO over the harbor, ports chasing, the beam pulsing to the skyline + motes rising, the title in neon, THE BORDER LASER' },
]);
export const LAB_IDS = Object.freeze(LAB.map(x => x.id));
export const MARKS = Object.freeze(['approve', 'fix', 'cut']);
export const NOTE_MAX = 400;
/** a mark as the server stores it — or null (bad input) */
export function cleanMark(id, mark, note) {
  if (!LAB_IDS.includes(id)) return null;
  if (mark !== null && !MARKS.includes(mark)) return null;
  const n = typeof note === 'string' ? note.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, NOTE_MAX) : '';
  return { m: mark, note: n };
}
/** the sample guests the lab dresses the strips on (names + levels from the owner's sketch) */
export const GUESTS = Object.freeze([
  { name: 'BEN', lv: 23 }, { name: 'MAYA', lv: 8 }, { name: 'JAKE', lv: 15 }, { name: 'RIO', lv: 31 },
  { name: 'SAM', lv: 40 }, { name: 'DEV', lv: 52 }, { name: 'LILY', lv: 12 }, { name: 'EMMA', lv: 64 },
]);
