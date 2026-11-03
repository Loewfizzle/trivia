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
