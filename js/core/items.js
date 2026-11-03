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

export const ITEMS = [
  // ---- cards: THE ORIGINAL GILDED (everyone, final) + the Gilded family + NEON GLASS + VELVET ROOM + today's VAULT folded in (levels)
  C('card-gilded', 'GILDED', 'common', '#0b0a0d', '#d8b46a', '#ff4fb8', 'Black lacquer, brass foil, the fan over the door.'),
  C('card-midnight', 'MIDNIGHT', 'common', '#0a0e22', '#9fb4ff', '#7ad7ff', 'Ink and starlight.', { old: 'midnight' }),
  C('card-brass', 'BRASS DECO', 'common', '#1a1208', '#e0a85a', '#ffd27a', 'Warm brass, engraved like the bar rail.', { old: 'brass' }),
  C('card-emerald', 'EMERALD & BRASS', 'uncommon', '#06140f', '#d4af6a', '#5effc0', 'Green-black lacquer, a stepped crown in emerald enamel.'),
  C('card-neonglass', 'NEON GLASS', 'uncommon', '#140f2a', '#9fe9ff', '#3fe0ff', 'Smoked glass with a cyan tube inside the edge.', { ink: '#ffffff' }),
  C('card-chrome', 'SILVER CHROME', 'uncommon', '#14161b', '#d9dee6', '#a8c8ff', 'Mirror chrome with a prism on the edge.', { old: 'chrome' }),
  C('card-champagne', 'MIDNIGHT & CHAMPAGNE', 'uncommon', '#0b1024', '#e8dcc0', '#ff6fb5', 'Navy lacquer, champagne silver, Chrysler arches.'),
  C('card-velvet', 'VELVET ROOM', 'rare', '#2a0710', '#f0d9a8', '#ffcf7a', 'Oxblood velvet, cream and gold.', { ink: '#f6ead0' }),
  C('card-aurora', 'AURORA', 'rare', '#051a1c', '#8ff0d8', '#7affc8', 'Northern lights under glass.', { old: 'aurora' }),
  C('card-rosegold', 'ONYX & ROSE GOLD', 'rare', '#0c0a0c', '#e6a98f', '#b98cff', 'Onyx, rose gold, a diamond lattice.'),
  C('card-gold', 'GOLD FOIL', 'rare', '#1c1405', '#f3cf6b', '#ffe08a', 'Real foil, a deco sunburst pressed in.', { old: 'gold' }),
  C('card-noir', 'VELVET NOIR', 'epic', '#0a0507', '#e05a6a', '#ff3a5c', 'Black velvet, a crimson neon edge.', { old: 'noir' }),
  C('card-sapphire', 'SAPPHIRE & SILVER', 'epic', '#050c1f', '#c9d6ee', '#4f8dff', 'Deep sapphire, silver leaf.'),
  C('card-legend', 'PRISM LEGEND', 'epic', '#0b0714', '#f0e6ff', '#ff7af0', 'The whole spectrum, alive in the foil.', { old: 'legend' }),
  C('card-platinum', 'PLATINUM', 'legendary', '#101114', '#eef1f6', '#ffffff', 'Platinum on black. Few get here.'),
  C('card-house', 'THE HOUSE', 'legendary', '#07060a', '#ffd98a', '#ff4fb8', 'Level 100. The house is yours.'),
  // ---- the streak's milestones
  C('card-flame30', 'THE 30-NIGHT FLAME', 'rare', '#140604', '#ffb35c', '#ff6a2a', 'Thirty nights in a row.'),
  C('card-century', 'CENTURY', 'epic', '#0d0703', '#ffcf8a', '#ff8a3a', 'A hundred nights in a row.'),
  C('card-wildfire', 'WILDFIRE', 'legendary', '#120302', '#ff9a4a', '#ff3b1f', 'Two hundred nights in a row.'),
  C('card-eternal', 'ETERNAL FLAME', 'legendary', '#06030c', '#ffe6a8', '#9f6bff', 'A whole year, every night.'),
  // ---- the achievements' cards
  C('card-zebra', 'ZEBRA', 'uncommon', '#111111', '#f2f2f2', '#ff4fb8', 'Black and white, loud on purpose.'),
  C('card-camo', 'CAMO', 'uncommon', '#151a10', '#b8c48a', '#d8ff6a', 'Blend in. You won’t.'),
  C('card-brushed', 'BRUSHED GOLD', 'uncommon', '#1a1407', '#e6c47a', '#ffd27a', 'Gold, brushed like the bar rail.'),
  C('card-marble', 'MARBLE & GOLD', 'rare', '#1c1c1f', '#e9d3a0', '#ffffff', 'White marble, gold veins.', { ink: '#f4ecd8' }),
  C('card-marquee-gold', 'THE MARQUEE · GOLD BULBS', 'epic', '#120a04', '#ffd98a', '#ffcc4a', 'Your name in lights, gold bulbs chasing.'),
  C('card-marquee', 'THE MARQUEE', 'epic', '#12060c', '#ffe0b0', '#ff4f7a', 'Theatre bulbs chasing round the edge.'),
  C('card-neoncamo', 'NEON CAMO', 'rare', '#0c0f14', '#7affd8', '#ff4fe0', 'Camo, but it glows.'),
  C('card-carbon', 'CARBON', 'rare', '#0e0f11', '#c8cdd4', '#5ad1ff', 'Woven carbon. You waited for this.'),
  C('card-witness', 'THE WITNESS', 'legendary', '#04060a', '#cfe8ff', '#7affc8', 'Every legend over the harbor, seen.'),
  C('card-penthouse', 'PENTHOUSE', 'epic', '#0a0a10', '#f6e3b0', '#ffd27a', 'Top one percent. The view from up here.'),
  C('card-confetti', 'CONFETTI', 'rare', '#140a1c', '#ffd6f0', '#ff6fd0', 'Many happy returns.'),
  C('card-circuit', 'CIRCUIT', 'rare', '#04100c', '#7affc0', '#3dffa0', 'Overclocked.'),
  C('card-founder', 'FOUNDING MEMBER', 'legendary', '#0a0806', '#ffdca0', '#ff4fb8', 'Here before the doors opened.'),
  // ---- PROGRESSION B — CITY SIGHTINGS: each legendary's MATCHED PAIR (a LEGENDARY card + its EMBLEM), first tap that the server
  // believes (core/sightings.js — the ids final, the art THE VAULT's: the city's own baked models on the cards)
  C('card-sg-ufo', 'I WANT TO BELIEVE', 'legendary', '#04100a', '#9dffc4', '#5dff9a', 'The saucer over the harbor. You saw it.', { sg: 'ufo' }),
  C('card-sg-tr3b', 'LIGHTS OUT', 'legendary', '#050508', '#d8d2c8', '#ff5a3c', 'The black triangle, and the city going dark.', { sg: 'tr3b' }),
  C('card-sg-blackbird', 'SKY KING', 'legendary', '#06070a', '#c6ccd6', '#ff8a3a', 'The Blackbird, flat out over the city.', { sg: 'blackbird' }),
  C('card-sg-f22', 'AFTERBURNER', 'legendary', '#070b10', '#cdd6e2', '#ffb04a', 'Three jets on full afterburner.', { sg: 'f22' }),
  C('card-sg-ghostship', 'THE FLYING DUTCHMAN', 'legendary', '#040a0a', '#bfe8d8', '#7affd0', 'A ship that sank long ago, under sail on Halloween.', { sg: 'ghostship' }),
  C('card-sg-aurora', 'SKY DANCER', 'legendary', '#03100f', '#9ff5df', '#7affc8', 'The northern lights over the harbor.', { sg: 'aurora' }),
  C('card-sg-fireball', 'MAKE A WISH', 'legendary', '#05070a', '#d8ffe0', '#9cff9a', 'A fireball, breaking up over the city.', { sg: 'fireball' }),
  C('card-sg-skull', 'HOT AIR, COLD BLOOD', 'legendary', '#0a0a0c', '#efe9dc', '#ff8a3a', 'The skull balloon, drifting over the rooftops.', { sg: 'skull' }),
  C('card-sg-btc', 'FIX THE MONEY, FIX THE WORLD', 'legendary', '#0c0702', '#f7931a', '#ffb347', 'The ₿ balloon. Tick tock, next block.', { sg: 'btc' }),
  // ---- emblem shapes (drawn by THE VAULT 2; a placeholder glyph until then)
  { ...E('emb-sg-ufo', 'I WANT TO BELIEVE', 'legendary', '◍', 'The saucer over the harbor. You saw it.'), sg: 'ufo' },
  { ...E('emb-sg-tr3b', 'LIGHTS OUT', 'legendary', '▲', 'The black triangle, and the city going dark.'), sg: 'tr3b' },
  { ...E('emb-sg-blackbird', 'SKY KING', 'legendary', '✈', 'The Blackbird, flat out over the city.'), sg: 'blackbird' },
  { ...E('emb-sg-f22', 'AFTERBURNER', 'legendary', '➤', 'Three jets on full afterburner.'), sg: 'f22' },
  { ...E('emb-sg-ghostship', 'THE FLYING DUTCHMAN', 'legendary', '⚓', 'A ship that sank long ago, under sail on Halloween.'), sg: 'ghostship' },
  { ...E('emb-sg-aurora', 'SKY DANCER', 'legendary', '≋', 'The northern lights over the harbor.'), sg: 'aurora' },
  { ...E('emb-sg-fireball', 'MAKE A WISH', 'legendary', '☄', 'A fireball, breaking up over the city.'), sg: 'fireball' },
  { ...E('emb-sg-skull', 'HOT AIR, COLD BLOOD', 'legendary', '☠', 'The skull balloon, drifting over the rooftops.'), sg: 'skull' },
  { ...E('emb-sg-btc', 'FIX THE MONEY, FIX THE WORLD', 'legendary', '₿', 'The ₿ balloon. Tick tock, next block.'), sg: 'btc' },
  E('emb-key', 'THE KEY', 'common', '⚿', 'You opened your first room.'),
  E('emb-cocktail', 'COCKTAIL GLASS', 'common', '🍸', 'Last, ten times. Have one on the house.'),
  E('emb-owl', 'THE OWL', 'uncommon', '🦉', 'A match between 2 and 4 am.'),
  E('emb-glasses', 'TWO GLASSES', 'uncommon', '🥂', 'Ten nights with the same friend.'),
  E('emb-lightning', 'LIGHTNING', 'rare', 'ϟ', 'Played through a real thunderstorm.'),
  E('emb-snowflake', 'SNOWFLAKE', 'rare', '❄', 'Played while it really snowed.'),
  E('emb-peephole', 'THE PEEPHOLE', 'rare', '◉', 'You know the knock.'),
  E('emb-wings', 'WINGS', 'epic', '✈', 'Twenty-five sightings.'),
  E('emb-stars', 'THREE STARS', 'rare', '✦', 'All three dailies in one day.'),
  E('emb-sunrise', 'SUNRISE', 'uncommon', '☀', 'A daily before 8 am.'),
  E('emb-bitcoin', '₿', 'epic', '₿', 'Twenty-one nights in a row. HODL.'),
  E('emb-prism', 'THE PRISM', 'uncommon', '◆', 'Four lines at once.'),
  E('emb-bullseye', 'BULLSEYE', 'uncommon', '◎', 'Dead on.'),
  E('emb-torch', 'THE TORCH', 'epic', '♨', 'Fifty nights in a row.'),
  E('emb-diamond', 'DIAMOND', 'common', '◇', 'Level 13.'),
  E('emb-crescent', 'CRESCENT', 'uncommon', '☾', 'Level 37.'),
  E('emb-crown', 'THE CROWN', 'rare', '♛', 'Level 55.'),
  E('emb-sunburst', 'SUNBURST', 'epic', '✺', 'Level 75.'),
  E('emb-ace', 'THE ACE', 'legendary', '♠', 'Level 90.'),
  // ---- tube styles (how your emblem's neon burns)
  T('tube-twotone', 'TWO-TONE', 'common', 'Two colours in one tube.'),
  T('tube-ember', 'SLOW BURN', 'uncommon', 'Fourteen nights in a row: a tube that smoulders.'),
  T('tube-breath', 'BREATHING', 'uncommon', 'A slow breathing glow.'),
  T('tube-gold', 'GOLD TUBE', 'rare', 'Neon in gold glass.'),
  T('tube-flicker', 'OLD SIGN', 'rare', 'The flicker of an old sign.'),
  T('tube-beat', 'ON THE BEAT', 'epic', 'Pulses with the party on Friday + Saturday nights.'),
  // ---- name glows (today's VAULT glows folded in, + the new ones)
  G('glow-ember', 'EMBER', 'common', 'A warm glow, like a cigar in the dark.', { old: 'ember' }),
  G('glow-ice', 'ICE', 'uncommon', 'Cold blue light, the back room at 3 a.m.', { old: 'ice' }),
  G('glow-neon', 'NEON', 'uncommon', 'Pink and cyan tubes, buzzing.', { old: 'neon' }),
  G('glow-gold', 'GOLD', 'rare', 'Your name in gold leaf.', { old: 'gold' }),
  G('glow-prism', 'PRISM', 'epic', 'Every colour, moving through your name.', { old: 'prism' }),
  G('glow-champagne', 'CHAMPAGNE', 'rare', 'Bubbles of light.', { old: 'gold' }),
  G('glow-afterglow', 'AFTERGLOW', 'uncommon', 'Seven nights in a row.', { old: 'ember' }),
  G('glow-spark', 'SPARK', 'rare', 'From last to first.', { old: 'neon' }),
  G('glow-starlight', 'STARLIGHT', 'rare', 'Three different legends seen.', { old: 'ice' }),
  G('glow-candle', 'CANDLELIGHT', 'uncommon', 'A daily on seven different days.', { old: 'ember' }),
  G('glow-tinsel', 'TINSEL', 'rare', 'Three holidays at the bar.', { old: 'gold' }),
  // ---- the rest
  { id: 'flame-full', kind: 'flame', name: 'FULL NEON', tier: 'common', line: 'Three nights in a row: your flame burns full.' },
  { id: 'favor', kind: 'favor', name: 'A FAVOR', tier: 'epic', line: 'Call in a favor: one moment for your room.' },
];
export const ITEM = Object.fromEntries(ITEMS.map(x => [x.id, x]));
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
