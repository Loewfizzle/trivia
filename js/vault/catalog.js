// THE VAULT — THE LAB's CATALOG (PURE — the server validates THE CARD LAB's marks against it; docs/vault.md). Every collectible the lab
// shows, in the order it shows them. THE VAULT 1A = THE STYLE TEST: the 8 sample cards as SLIM STRIPS (the owner approved the set, Nov 2
// 10:23 pm) + the two test emblems. A NEW card / emblem plugs in with a row here (+ its look in js/vault/strip.js + its item in
// core/items.js); it ships to players only once the owner APPROVES it in the lab (js/vault/approved.js).
export const LAB = [
  { id: 'card-brushed', kind: 'card', tier: 'common', n: 1 },
  { id: 'card-smoke', kind: 'card', tier: 'uncommon', n: 2 },
  { id: 'card-frostbite', kind: 'card', tier: 'uncommon', n: 3 },
  { id: 'card-inferno', kind: 'card', tier: 'rare', n: 4 },
  { id: 'card-prism', kind: 'card', tier: 'rare', n: 5 },
  { id: 'card-marquee', kind: 'card', tier: 'epic', n: 6 },
  { id: 'card-glitter', kind: 'card', tier: 'epic', n: 7 },
  { id: 'card-sg-ufo', kind: 'card', tier: 'legendary', n: 8 },
  { id: 'emb-test-neon', kind: 'emblem', tier: 'common', n: 9 },
  { id: 'emb-test-prism', kind: 'emblem', tier: 'rare', n: 10 },
  // THE VAULT 1B — THE LAUNCH SET, part 1: the first cards players meet (the level rewards everyone reaches early) — strips
  { id: 'card-gilded', kind: 'card', tier: 'common', n: 19 },
  { id: 'card-midnight', kind: 'card', tier: 'common', n: 20 },
  { id: 'card-heartbreaker', kind: 'card', tier: 'uncommon', n: 21 },
  { id: 'card-brass', kind: 'card', tier: 'common', n: 22 },
  { id: 'card-emerald', kind: 'card', tier: 'uncommon', n: 23 },
  { id: 'card-neonglass', kind: 'card', tier: 'uncommon', n: 24 },
  { id: 'card-chrome', kind: 'card', tier: 'uncommon', n: 25 },
  { id: 'card-champagne', kind: 'card', tier: 'uncommon', n: 26 },
  // THE VAULT 1B — THE FULL CARDS of the 8 approved strips (their own marks: the strip can ship before its full card)
  { id: 'full-card-brushed', kind: 'full', of: 'card-brushed', tier: 'common', n: 11 },
  { id: 'full-card-smoke', kind: 'full', of: 'card-smoke', tier: 'uncommon', n: 12 },
  { id: 'full-card-frostbite', kind: 'full', of: 'card-frostbite', tier: 'uncommon', n: 13 },
  { id: 'full-card-inferno', kind: 'full', of: 'card-inferno', tier: 'rare', n: 14 },
  { id: 'full-card-prism', kind: 'full', of: 'card-prism', tier: 'rare', n: 15 },
  { id: 'full-card-marquee', kind: 'full', of: 'card-marquee', tier: 'epic', n: 16 },
  { id: 'full-card-glitter', kind: 'full', of: 'card-glitter', tier: 'epic', n: 17 },
  { id: 'full-card-midnight', kind: 'full', of: 'card-midnight', tier: 'common', n: 27 },
  { id: 'full-card-heartbreaker', kind: 'full', of: 'card-heartbreaker', tier: 'uncommon', n: 28 },
  { id: 'full-card-brass', kind: 'full', of: 'card-brass', tier: 'common', n: 29 },
  { id: 'full-card-emerald', kind: 'full', of: 'card-emerald', tier: 'uncommon', n: 30 },
  { id: 'full-card-neonglass', kind: 'full', of: 'card-neonglass', tier: 'uncommon', n: 31 },
  { id: 'full-card-chrome', kind: 'full', of: 'card-chrome', tier: 'uncommon', n: 32 },
  { id: 'full-card-champagne', kind: 'full', of: 'card-champagne', tier: 'uncommon', n: 33 },
  { id: 'full-card-sg-ufo', kind: 'full', of: 'card-sg-ufo', tier: 'legendary', n: 18 },
];
export const LAB_IDS = Object.freeze(LAB.map(x => x.id));
// THE VAULT 1B — NAMES ONLY TO OWNERS: the lab's NAMES + what each one does are the SERVER's (api/_lib/lab-text.js) — handed to the lab with
// the marks (admins only: /api/admin labMarks → { marks, text }); the look previews (never deployed) import them off the local server.
export function registerLabText(t) { for (const x of LAB) if (t && t[x.id]) Object.assign(x, t[x.id]); }
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
