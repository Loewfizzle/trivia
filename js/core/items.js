// THE ITEMS (PROGRESSION A), PURE — every collectible a player can OWN: player CARDS, EMBLEM SHAPES, TUBE STYLES, NAME GLOWS + FAVOR tokens.
// Granted ONLY by the server's award engine (levels, streak milestones, achievements, FOUNDER — later CITY SIGHTINGS) into pstats/{pid}/it;
// worn through /api/profile 'style' (checked against what you own). THE VAULT replaces the ART, never the ids. Collections show ONLY what
// a player owns — no totals, no locked slots, no list of what's left (the owner: "I want them to guess").
//
// look (placeholder-grade until THE VAULT; the ORIGINAL GILDED is final): { lac (lacquer), foil, ink (text on the card), acc (the neon
// accent) } — css/progress.css paints a card from these four. `old`: today's VAULT finish it folds in (css/card.css still paints it).
export const TIERS = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const TIER_NAMES = { common: 'COMMON', uncommon: 'UNCOMMON', rare: 'RARE', epic: 'EPIC', legendary: 'LEGENDARY' };
export const KINDS = { card: 'CARD', emblem: 'EMBLEM', tube: 'TUBE STYLE', glow: 'NAME GLOW', favor: 'FAVOR', flame: 'FLAME' };

const C = (id, name, tier, lac, foil, acc, line, x = {}) => ({ id, kind: 'card', name, tier, look: { lac, foil, ink: x.ink || foil, acc }, line, ...x });
const E = (id, name, tier, glyph, line) => ({ id, kind: 'emblem', name, tier, glyph, line });
const T = (id, name, tier, line) => ({ id, kind: 'tube', name, tier, line });
const G = (id, name, tier, line, x = {}) => ({ id, kind: 'glow', name, tier, line, ...x });

// THE VAULT 1B — ITEM NAMES ONLY TO OWNERS (the owner: "keep them guessing"): the site's code carries ONE item — the ORIGINAL GILDED every
// member owns. Every other item's name, line + look lives on the SERVER (api/_lib/catalog.js — never served as a file) and reaches a phone
// only for what that player OWNS (/api/profile 'me', a match's / a daily's / an event's outcome, a sighting's claim: { items: { id: {…} } })
// → registerItems(). The registry below is what every screen reads; the server registers the whole catalog at import.
export const ITEMS = [
  C('card-gilded', 'GILDED', 'common', '#0b0a0d', '#d8b46a', '#ff4fb8', 'Black lacquer, brass foil, the fan over the door.'),
];
export const ITEM = Object.fromEntries(ITEMS.map(x => [x.id, x]));
/** add display rows (the server's catalog, or a response's `items` for what this player owns) — an id already known is updated */
export function registerItems(rows) {
  if (!rows) return;
  for (const x of Array.isArray(rows) ? rows : Object.entries(rows).map(([id, v]) => ({ id, ...v }))) {
    if (!x || !x.id) continue;
    if (!ITEM[x.id]) ITEMS.push(x); else Object.assign(ITEMS.find(y => y.id === x.id), x);
    ITEM[x.id] = ITEMS.find(y => y.id === x.id);
  }
}
export const itemOf = id => ITEM[id] || null;
/** Everyone owns the ORIGINAL GILDED card. */
export const DEFAULT_CARD = 'card-gilded';
export const STARTER = [DEFAULT_CARD];
/** What a player wears: their choice if they own it, else the default (cards) / nothing (glows, tubes, shapes). */
export function wearing(owned, pick = {}) {
  const has = id => id && ITEM[id] && (STARTER.includes(id) || (owned && owned[id]));
  const card = has(pick.card) && ITEM[pick.card].kind === 'card' ? pick.card : DEFAULT_CARD;
  const glow = has(pick.glow) && ITEM[pick.glow].kind === 'glow' ? pick.glow : null;
  const tube = has(pick.tube) && ITEM[pick.tube].kind === 'tube' ? pick.tube : null;
  const shape = has(pick.shape) && ITEM[pick.shape].kind === 'emblem' ? pick.shape : null;
  return { card, glow, tube, shape };
}
/** Owned items of a kind, newest first (the profile's VAULT): owned = pstats.it { id: at }. */
export function ownedOf(owned, kind) {
  const ids = Object.keys(owned || {}).filter(id => ITEM[id] && (!kind || ITEM[id].kind === kind));
  if (kind === 'card' && !ids.includes(DEFAULT_CARD)) ids.push(DEFAULT_CARD);
  return ids.sort((a, b) => ((owned && owned[b]) || 0) - ((owned && owned[a]) || 0)).map(id => ITEM[id]);
}
/** The old VAULT ids (profiles/{pid}/f, /g before PROGRESSION A) → the new item ids. */
export const OLD_FINISH = { midnight: 'card-midnight', brass: 'card-brass', chrome: 'card-chrome', aurora: 'card-aurora', gold: 'card-gold', noir: 'card-noir', legend: 'card-legend' };
export const OLD_GLOW = { ember: 'glow-ember', ice: 'glow-ice', neon: 'glow-neon', gold: 'glow-gold', prism: 'glow-prism' };
