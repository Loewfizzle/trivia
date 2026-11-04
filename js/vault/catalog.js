// THE VAULT — THE LAB's CATALOG (PURE — the server validates THE CARD LAB's marks against it; docs/vault.md). Every collectible the lab
// shows, in the order it shows them. THE VAULT 1A = THE STYLE TEST: the 8 sample cards as SLIM STRIPS (the owner approved the set, Nov 2
// 10:23 pm) + the two test emblems. A NEW card / emblem plugs in with a row here (+ its look in js/vault/strip.js + its item in
// core/items.js); it ships to players only once the owner APPROVES it in the lab (js/vault/approved.js).
export const LAB = [
  // THE VAULT 2A — THE 3 HELD CARDS (first: the owner marks them first) — strips, then their full cards
  { id: 'card-founder', kind: 'card', tier: 'legendary', n: 92 },
  { id: 'card-house', kind: 'card', tier: 'legendary', n: 93 },
  { id: 'card-platinum', kind: 'card', tier: 'epic', n: 94 },
  { id: 'full-card-founder', kind: 'full', of: 'card-founder', tier: 'legendary', n: 95 },
  { id: 'full-card-house', kind: 'full', of: 'card-house', tier: 'legendary', n: 96 },
  { id: 'full-card-platinum', kind: 'full', of: 'card-platinum', tier: 'epic', n: 97 },
  // THE VAULT 1C — THE 8 SIGHTING CARDS (first in the lab: the owner marks them first) — strips, then their full cards
  { id: 'card-sg-tr3b', kind: 'card', tier: 'legendary', n: 34 },
  { id: 'card-sg-blackbird', kind: 'card', tier: 'legendary', n: 35 },
  { id: 'card-sg-f22', kind: 'card', tier: 'legendary', n: 36 },
  { id: 'card-sg-ghostship', kind: 'card', tier: 'legendary', n: 37 },
  { id: 'card-sg-aurora', kind: 'card', tier: 'legendary', n: 38 },
  { id: 'card-sg-fireball', kind: 'card', tier: 'legendary', n: 39 },
  { id: 'card-sg-skull', kind: 'card', tier: 'legendary', n: 40 },
  { id: 'card-sg-btc', kind: 'card', tier: 'legendary', n: 41 },
  { id: 'full-card-sg-tr3b', kind: 'full', of: 'card-sg-tr3b', tier: 'legendary', n: 42 },
  { id: 'full-card-sg-blackbird', kind: 'full', of: 'card-sg-blackbird', tier: 'legendary', n: 43 },
  { id: 'full-card-sg-f22', kind: 'full', of: 'card-sg-f22', tier: 'legendary', n: 44 },
  { id: 'full-card-sg-ghostship', kind: 'full', of: 'card-sg-ghostship', tier: 'legendary', n: 45 },
  { id: 'full-card-sg-aurora', kind: 'full', of: 'card-sg-aurora', tier: 'legendary', n: 46 },
  { id: 'full-card-sg-fireball', kind: 'full', of: 'card-sg-fireball', tier: 'legendary', n: 47 },
  { id: 'full-card-sg-skull', kind: 'full', of: 'card-sg-skull', tier: 'legendary', n: 48 },
  { id: 'full-card-sg-btc', kind: 'full', of: 'card-sg-btc', tier: 'legendary', n: 49 },
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
// THE VAULT 1C — THE HELD-BACK CARDS (the rest of the launch set: strips, then their full cards)
LAB.push(
  { id: 'card-zebra', kind: 'card', tier: 'uncommon', n: 50 },
  { id: 'card-camo', kind: 'card', tier: 'uncommon', n: 51 },
  { id: 'card-velvet', kind: 'card', tier: 'rare', n: 52 },
  { id: 'card-aurora', kind: 'card', tier: 'rare', n: 53 },
  { id: 'card-rosegold', kind: 'card', tier: 'rare', n: 54 },
  { id: 'card-gold', kind: 'card', tier: 'rare', n: 55 },
  { id: 'card-flame30', kind: 'card', tier: 'rare', n: 56 },
  { id: 'card-marble', kind: 'card', tier: 'rare', n: 57 },
  { id: 'card-neoncamo', kind: 'card', tier: 'rare', n: 58 },
  { id: 'card-carbon', kind: 'card', tier: 'rare', n: 59 },
  { id: 'card-confetti', kind: 'card', tier: 'rare', n: 60 },
  { id: 'card-circuit', kind: 'card', tier: 'rare', n: 61 },
  { id: 'card-noir', kind: 'card', tier: 'epic', n: 62 },
  { id: 'card-sapphire', kind: 'card', tier: 'epic', n: 63 },
  { id: 'card-legend', kind: 'card', tier: 'epic', n: 64 },
  { id: 'card-century', kind: 'card', tier: 'epic', n: 65 },
  { id: 'card-marquee-gold', kind: 'card', tier: 'epic', n: 66 },
  { id: 'card-penthouse', kind: 'card', tier: 'epic', n: 67 },
  { id: 'card-wildfire', kind: 'card', tier: 'legendary', n: 68 },
  { id: 'card-eternal', kind: 'card', tier: 'legendary', n: 69 },
  { id: 'card-witness', kind: 'card', tier: 'legendary', n: 70 },
  { id: 'full-card-zebra', kind: 'full', of: 'card-zebra', tier: 'uncommon', n: 71 },
  { id: 'full-card-camo', kind: 'full', of: 'card-camo', tier: 'uncommon', n: 72 },
  { id: 'full-card-velvet', kind: 'full', of: 'card-velvet', tier: 'rare', n: 73 },
  { id: 'full-card-aurora', kind: 'full', of: 'card-aurora', tier: 'rare', n: 74 },
  { id: 'full-card-rosegold', kind: 'full', of: 'card-rosegold', tier: 'rare', n: 75 },
  { id: 'full-card-gold', kind: 'full', of: 'card-gold', tier: 'rare', n: 76 },
  { id: 'full-card-flame30', kind: 'full', of: 'card-flame30', tier: 'rare', n: 77 },
  { id: 'full-card-marble', kind: 'full', of: 'card-marble', tier: 'rare', n: 78 },
  { id: 'full-card-neoncamo', kind: 'full', of: 'card-neoncamo', tier: 'rare', n: 79 },
  { id: 'full-card-carbon', kind: 'full', of: 'card-carbon', tier: 'rare', n: 80 },
  { id: 'full-card-confetti', kind: 'full', of: 'card-confetti', tier: 'rare', n: 81 },
  { id: 'full-card-circuit', kind: 'full', of: 'card-circuit', tier: 'rare', n: 82 },
  { id: 'full-card-noir', kind: 'full', of: 'card-noir', tier: 'epic', n: 83 },
  { id: 'full-card-sapphire', kind: 'full', of: 'card-sapphire', tier: 'epic', n: 84 },
  { id: 'full-card-legend', kind: 'full', of: 'card-legend', tier: 'epic', n: 85 },
  { id: 'full-card-century', kind: 'full', of: 'card-century', tier: 'epic', n: 86 },
  { id: 'full-card-marquee-gold', kind: 'full', of: 'card-marquee-gold', tier: 'epic', n: 87 },
  { id: 'full-card-penthouse', kind: 'full', of: 'card-penthouse', tier: 'epic', n: 88 },
  { id: 'full-card-wildfire', kind: 'full', of: 'card-wildfire', tier: 'legendary', n: 89 },
  { id: 'full-card-eternal', kind: 'full', of: 'card-eternal', tier: 'legendary', n: 90 },
  { id: 'full-card-witness', kind: 'full', of: 'card-witness', tier: 'legendary', n: 91 },
);
// THE VAULT 2A — THE EMBLEM SYSTEM's SAMPLES (the EMBLEMS + GLOWS tabs; 2B builds the rest from these marks): 10 emblems (a shape + a
// finish each), today's 12 sign-up shapes on the neon renderer (one block), 3 tube styles, 3 name glows
LAB.push(
  { id: 'emb-key', kind: 'emblem', tier: 'common', n: 98, fin: 'neon' },
  { id: 'emb-sweetheart', kind: 'emblem', tier: 'common', n: 99, fin: 'neon' },
  { id: 'emb-owl', kind: 'emblem', tier: 'uncommon', n: 100, fin: 'neon' },
  { id: 'emb-prism', kind: 'emblem', tier: 'rare', n: 101, fin: 'prism' },
  { id: 'emb-house', kind: 'emblem', tier: 'legendary', n: 102, fin: 'gold' },
  { id: 'emb-snowflake', kind: 'emblem', tier: 'epic', n: 103, fin: 'ice' },
  { id: 'emb-torch', kind: 'emblem', tier: 'epic', n: 104, fin: 'molten' },
  { id: 'emb-lightning', kind: 'emblem', tier: 'epic', n: 105, fin: 'glitch' },
  { id: 'emb-sg-tr3b', kind: 'emblem', tier: 'legendary', n: 106, fin: 'chrome' },
  { id: 'emb-sg-ufo', kind: 'emblem', tier: 'legendary', n: 107, fin: 'galaxy' },
  { id: 'emb-signup', kind: 'emblem', tier: 'common', n: 108, fin: 'neon', set: true },
  { id: 'tube-twotone', kind: 'tube', tier: 'common', n: 109 },
  { id: 'tube-breath', kind: 'tube', tier: 'uncommon', n: 110 },
  { id: 'tube-chase', kind: 'tube', tier: 'uncommon', n: 111 },
  { id: 'glow-ember', kind: 'glow', tier: 'common', n: 112 },
  { id: 'glow-gold', kind: 'glow', tier: 'rare', n: 113 },
  { id: 'glow-spark', kind: 'glow', tier: 'rare', n: 114 },
);
// THE VAULT 2B — Group 0: THE CROWN's own shape (the owner: two crowns → its own: an imperial crown)
LAB.push({ id: 'emb-crown', kind: 'emblem', tier: 'rare', n: 115, fin: 'neon' });
// THE VAULT 2B — Group 1: THE TWO DEV CARDS (the owner's own — strips first, then their full cards; FIRST in the lab)
LAB.unshift(
  { id: 'card-dev-switchboard', kind: 'card', tier: 'legendary', n: 116, dev: true },
  { id: 'card-dev-source', kind: 'card', tier: 'legendary', n: 117, dev: true },
  { id: 'full-card-dev-switchboard', kind: 'full', of: 'card-dev-switchboard', tier: 'legendary', n: 118, dev: true },
  { id: 'full-card-dev-source', kind: 'full', of: 'card-dev-source', tier: 'legendary', n: 119, dev: true },
);
// THE VAULT 2B — Group 2: THE REST OF THE EMBLEM SET (the sighting pairs' emblems, the marks, BUTTERFLY, the seasonal four)
LAB.push(
  { id: 'emb-cocktail', kind: 'emblem', tier: 'common', n: 120, fin: 'neon' },
  { id: 'emb-diamond', kind: 'emblem', tier: 'common', n: 121, fin: 'neon' },
  { id: 'emb-glasses', kind: 'emblem', tier: 'uncommon', n: 122, fin: 'neon' },
  { id: 'emb-sunrise', kind: 'emblem', tier: 'uncommon', n: 123, fin: 'neon' },
  { id: 'emb-bullseye', kind: 'emblem', tier: 'uncommon', n: 124, fin: 'neon' },
  { id: 'emb-crescent', kind: 'emblem', tier: 'uncommon', n: 125, fin: 'neon' },
  { id: 'emb-butterfly', kind: 'emblem', tier: 'uncommon', n: 126, fin: 'neon' },
  { id: 'emb-peephole', kind: 'emblem', tier: 'rare', n: 127, fin: 'neon' },
  { id: 'emb-stars', kind: 'emblem', tier: 'rare', n: 128, fin: 'neon' },
  { id: 'emb-wings', kind: 'emblem', tier: 'epic', n: 129, fin: 'metal' },
  { id: 'emb-bitcoin', kind: 'emblem', tier: 'epic', n: 130, fin: 'coin' },
  { id: 'emb-sunburst', kind: 'emblem', tier: 'epic', n: 131, fin: 'metal' },
  { id: 'emb-ace', kind: 'emblem', tier: 'legendary', n: 132, fin: 'metal' },
  { id: 'emb-sg-blackbird', kind: 'emblem', tier: 'legendary', n: 133, fin: 'metal' },
  { id: 'emb-sg-f22', kind: 'emblem', tier: 'legendary', n: 134, fin: 'metal' },
  { id: 'emb-sg-ghostship', kind: 'emblem', tier: 'legendary', n: 135, fin: 'spectral' },
  { id: 'emb-sg-aurora', kind: 'emblem', tier: 'legendary', n: 136, fin: 'aurora' },
  { id: 'emb-sg-fireball', kind: 'emblem', tier: 'legendary', n: 137, fin: 'comet' },
  { id: 'emb-sg-skull', kind: 'emblem', tier: 'legendary', n: 138, fin: 'balloon' },
  { id: 'emb-sg-btc', kind: 'emblem', tier: 'legendary', n: 139, fin: 'balloon' },
  { id: 'emb-hw', kind: 'emblem', tier: 'epic', n: 140, fin: 'neon' },
  { id: 'emb-tg', kind: 'emblem', tier: 'epic', n: 141, fin: 'autumn' },
  { id: 'emb-xmas', kind: 'emblem', tier: 'epic', n: 142, fin: 'neon' },
  { id: 'emb-nye', kind: 'emblem', tier: 'epic', n: 143, fin: 'neon' },
);
// THE VAULT 2B — Group 3: THE REST OF THE TUBE STYLES + THE NAME GLOWS
LAB.push(
  { id: 'tube-gold', kind: 'tube', tier: 'rare', n: 144 },
  { id: 'tube-flicker', kind: 'tube', tier: 'rare', n: 145 },
  { id: 'tube-ember', kind: 'tube', tier: 'uncommon', n: 146 },
  { id: 'tube-burnt', kind: 'tube', tier: 'rare', n: 147 },
  { id: 'tube-beat', kind: 'tube', tier: 'epic', n: 148 },
  { id: 'glow-afterglow', kind: 'glow', tier: 'common', n: 149 },
  { id: 'glow-ice', kind: 'glow', tier: 'common', n: 150 },
  { id: 'glow-neon', kind: 'glow', tier: 'uncommon', n: 151 },
  { id: 'glow-candle', kind: 'glow', tier: 'uncommon', n: 152 },
  { id: 'glow-frost', kind: 'glow', tier: 'uncommon', n: 153 },
  { id: 'glow-fire', kind: 'glow', tier: 'rare', n: 154 },
  { id: 'glow-starlight', kind: 'glow', tier: 'rare', n: 155 },
  { id: 'glow-tinsel', kind: 'glow', tier: 'rare', n: 156 },
  { id: 'glow-champagne', kind: 'glow', tier: 'rare', n: 157 },
  { id: 'glow-prism', kind: 'glow', tier: 'epic', n: 158 },
  { id: 'glow-glitch', kind: 'glow', tier: 'epic', n: 159 },
);
export const LAB_IDS = Object.freeze(LAB.map(x => x.id));
// THE VAULT 1B — NAMES ONLY TO OWNERS: the lab's NAMES + what each one does are the SERVER's (api/_lib/lab-text.js) — handed to the lab with
// the marks (admins only: /api/admin labMarks → { marks, text }); the look previews (never deployed) import them off the local server.
export function registerLabText(t) { for (const x of LAB) if (t && t[x.id]) Object.assign(x, t[x.id]); }
// THE LAB 2.0 (THE VAULT 2C — the owner, Nov 3 6:45 pm): every item carries a VERSION — 1 until a pass edits its art / words, then the pass
// bumps it here + writes WHAT changed (api/_lib/lab-text.js#LAB_CHANGES — server-side with the names; dated). A mark stores the version it
// was made at (the server stamps it); a newer version = CHANGED → the item drops back into NEEDS YOU with its "CHANGED <date> — what" line
// beside his old mark. (An APPROVE still ships the newer art: CHANGED asks for a re-look, it never pulls approved art.)
export const LAB_V = Object.freeze({
  'card-inferno': 2, 'full-card-inferno': 2, 'card-century': 3, 'full-card-century': 3,
  'card-dev-switchboard': 2, 'card-dev-source': 2, 'full-card-dev-switchboard': 4, 'full-card-dev-source': 4,
  'card-founder': 2, 'full-card-founder': 2, 'full-card-house': 2,
});
/** an item's current version */
export const verOf = id => LAB_V[id] || 1;
let CHANGES = {};
/** the server's dated "what changed" lines (admins only — with the names): { id: [{ v, at: 'YYYY-MM-DD', what }] } */
export function registerLabChanges(c) { CHANGES = c || {}; }
export const changesOf = id => CHANGES[id] || [];
/** a mark's state against the item's version: 'new' (never marked) · 'changed' (marked at an older version) · approve · fix · cut */
export function labStatus(id, mark) {
  if (!mark || !mark.m) return 'new';
  if ((mark.v || 1) < verOf(id)) return 'changed';
  return mark.m;
}
export const NEEDS = Object.freeze(['new', 'changed']);
export const MARKS = Object.freeze(['approve', 'fix', 'cut']);
export const NOTE_MAX = 400;
/** a mark as the server stores it — or null (bad input) */
export function cleanMark(id, mark, note) {
  if (!LAB_IDS.includes(id)) return null;
  if (mark !== null && !MARKS.includes(mark)) return null;
  const n = typeof note === 'string' ? note.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, NOTE_MAX) : '';
  return { m: mark, note: n, v: verOf(id) };   // (THE LAB 2.0: the server stamps the version marked — what he saw)
}
/** the sample guests the lab dresses the strips on (names + levels from the owner's sketch) */
export const GUESTS = Object.freeze([
  { name: 'BEN', lv: 23 }, { name: 'MAYA', lv: 8 }, { name: 'JAKE', lv: 15 }, { name: 'RIO', lv: 31 },
  { name: 'SAM', lv: 40 }, { name: 'DEV', lv: 52 }, { name: 'LILY', lv: 12 }, { name: 'EMMA', lv: 64 },
]);
