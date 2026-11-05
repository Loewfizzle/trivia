// THE CATALOG — SERVER ONLY (THE VAULT 1B — ITEM NAMES ONLY TO OWNERS; the owner: "keep them guessing"). Every item's name, line + look,
// the 30 achievements (names, lines, checks, items), WHAT each level + streak milestone gives — moved here out of the site's code: Vercel
// never serves a file under /api (an /api/_lib module is only ever imported by the functions), so a code reader can't list what exists.
// Importing this module REGISTERS it all into the shared registries (core/items.js · achievements.js · levels.js · streak.js) — every
// /api function that grants, wears or describes an item imports it first. A phone gets display rows only for what its player OWNS
// (displayOf / achDisplayOf below → the responses' `items` / `ach`). The local look previews (tests/integration/*-preview.html, never
// deployed) import it straight off the local server. A NEW item / achievement = its row here (+ its art in js/vault + THE CARD LAB).
import { registerItems } from '../../js/core/items.js';
import { registerAchievements } from '../../js/core/achievements.js';
import { registerLevelRewards } from '../../js/core/levels.js';
import { registerMilestoneItems } from '../../js/core/streak.js';
import { registerSeasonalItems } from '../../js/core/progress.js';
import { MAX_DAILIES_A_DAY } from '../../js/core/daily.js';
import { LEGENDARIES } from '../../js/core/achievements.js';

const C = (id, name, tier, lac, foil, acc, line, x = {}) => ({ id, kind: 'card', name, tier, look: { lac, foil, ink: x.ink || foil, acc }, line, ...x });
const E = (id, name, tier, glyph, line) => ({ id, kind: 'emblem', name, tier, glyph, line });
const T = (id, name, tier, line) => ({ id, kind: 'tube', name, tier, line });
const G = (id, name, tier, line, x = {}) => ({ id, kind: 'glow', name, tier, line, ...x });

export const ITEM_ROWS = [
  // ---- cards: THE ORIGINAL GILDED (everyone, final) + the Gilded family + NEON GLASS + VELVET ROOM + today's VAULT folded in (levels)
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
  C('card-platinum', 'PLATINUM', 'epic', '#101114', '#eef1f6', '#ffffff', 'The metal card. Few get here.'),
  C('card-house', 'THE HOUSE', 'legendary', '#07060a', '#ffd98a', '#ff4fb8', 'Level 100. The house is yours.'),
  // ---- THE VAULT 1A — the style test's new cards (the owner approved the set, Nov 2 10:23 pm; their art: js/vault/strip.js + js/fx, shipped
  // only once APPROVED in THE CARD LAB). Where SMOKE ROOM, FROSTBITE, INFERNO + PRISM unlock: THE VAULT 1B (with the rest of the ~40).
  // THE PINK PAIR (the owner, 10:14–10:20 pm — no champagne): HEARTBREAKER + GLITTER BOMB, EARLY level rewards (core/levels.js)
  C('card-smoke', 'SMOKE ROOM', 'uncommon', '#14151b', '#d8dbe6', '#ffb070', 'Smoke drifting through a lamp-lit back room.'),
  C('card-frostbite', 'FROSTBITE', 'uncommon', '#06141e', '#cfeeff', '#7fd8ff', 'Frost creeping in, the ice cracking.'),
  C('card-inferno', 'INFERNO', 'rare', '#120303', '#ffb070', '#ff5a1f', 'Flames licking up, the edge glowing hot.'),
  C('card-prism', 'PRISM', 'rare', '#0b0b12', '#f0f2ff', '#9fd8ff', 'White light in, a rainbow out.'),
  C('card-glitter', 'GLITTER BOMB', 'epic', '#2a0522', '#ffd0ec', '#ff4fb8', 'Pink glitter everywhere. Hearts. Sparkles. More.'),
  C('card-heartbreaker', 'HEARTBREAKER', 'uncommon', '#1e0920', '#ffd6ee', '#ff6fc8', 'Pink hearts drifting up through violet.'),
  // ---- the streak's milestones
  C('card-flame30', 'THE 30-NIGHT FLAME', 'rare', '#140604', '#ffb35c', '#ff6a2a', 'Thirty nights in a row.'),
  C('card-century', 'CENTURY', 'epic', '#0d0703', '#ffcf8a', '#ff8a3a', 'A hundred nights in a row.'),
  C('card-wildfire', 'WILDFIRE', 'legendary', '#120302', '#ff9a4a', '#ff3b1f', 'Two hundred nights in a row.'),
  C('card-eternal', 'ETERNAL FLAME', 'legendary', '#06030c', '#ffe6a8', '#9f6bff', 'A whole year, every night.'),
  // ---- the achievements' cards
  C('card-zebra', 'ZEBRA', 'uncommon', '#111111', '#f2f2f2', '#ff4fb8', 'Black and white, loud on purpose.'),
  C('card-camo', 'CAMO', 'uncommon', '#151a10', '#b8c48a', '#d8ff6a', 'Blend in. You won’t.'),
  C('card-brushed', 'BRUSHED GOLD', 'common', '#1a1407', '#e6c47a', '#ffd27a', 'Gold, brushed like the bar rail.'),   // (THE VAULT 1A: a COMMON — still, its emblem leads)
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
  // ---- THE VAULT 2B — THE TWO DEVELOPER CARDS (ONE OF ONE · DEV — js/core/dev-cards.js): the owner's only, granted by /api/profile 'me' to
  // ADMIN_PIDS, never earnable (in no reward table); legendary in every rule, a tier above it in look
  C('card-dev-switchboard', 'THE SWITCHBOARD', 'legendary', '#120a04', '#ffd27a', '#ff3a3a', 'The brass desk you run the city from. One of one.', { dev: true }),
  C('card-dev-source', 'THE SOURCE', 'legendary', '#030a06', '#7affb0', '#ff4fe0', 'The code that runs the city. One of one.', { dev: true }),
  // ---- SHELL 2.0 B2 — THE GIFT CARDS (1 OF 1 — js/core/gift-cards.js): never earnable, in no reward table; given by the owner's GIFT TOOL
  // (/admin → GIFTS — one profile ever, api/_lib/gifts.js); THE ANARCHIST is the owner's own (granted on /api/profile 'me' to ADMIN_PIDS)
  C('card-gift-playerone', 'PLAYER ONE', 'legendary', '#0b1a4a', '#7fe3ff', '#ffd23a', 'A 16-bit hero, ready for the next level. One of one.', { gift: true }),
  C('card-gift-halloffame', 'HALL OF FAME', 'legendary', '#140c04', '#e6b45a', '#ffd27a', 'Cast in bronze. One of one.', { gift: true }),
  C('card-gift-enforcer', 'THE ENFORCER', 'legendary', '#121212', '#e6e6e6', '#ffd27a', 'Charcoal on dark paper. One of one.', { gift: true }),
  C('card-gift-linebacker', 'THE LINEBACKER', 'legendary', '#0e1d44', '#ffd23a', '#ffffff', 'Hit hard. One of one.', { gift: true }),
  C('card-gift-underlights', 'UNDER THE LIGHTS', 'legendary', '#1a0630', '#ff6fe0', '#5fe9ff', 'Neon under the stadium lights. One of one.', { gift: true }),
  C('card-gift-sunsetstrip', 'SUNSET STRIP', 'legendary', '#2a0f3e', '#ffd27a', '#ff6fb5', 'Aviators on, sun going down. One of one.', { gift: true }),
  C('card-gift-goldenhour', 'GOLDEN HOUR', 'legendary', '#3a1e22', '#ffcf7a', '#ff5fa2', 'A polaroid, a heart, the golden hour. One of one.', { gift: true, ink: '#3a1e22' }),
  C('card-gift-goldenboot', 'GOLDEN BOOT', 'legendary', '#120a2a', '#ffd27a', '#7affc0', 'Under the floodlights, the ball at his feet. One of one.', { gift: true }),
  C('card-gift-youngbuck', 'YOUNG BUCK', 'legendary', '#14060f', '#ff4fd8', '#f6ff4a', 'Cut out, pasted up, punk. One of one.', { gift: true }),
  C('card-gift-icecold', 'ICE COLD', 'legendary', '#04102a', '#cfefff', '#7fd8ff', 'Snow, aurora, ice in the veins. One of one.', { gift: true }),
  C('card-gift-anarchist', 'THE ANARCHIST', 'legendary', '#0a0608', '#ff4f8b', '#ffd27a', 'No masters. One of one.', { gift: true }),
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
  E('emb-lightning', 'RAINMAKER', 'epic', 'ϟ', 'Played through a real thunderstorm.'),
  E('emb-snowflake', 'SNOWED IN', 'epic', '❄', 'Played while it really snowed.'),
  E('emb-peephole', 'THE PEEPHOLE', 'rare', '◉', 'You know the knock.'),
  E('emb-wings', 'WINGS', 'epic', '✈', 'Twenty-five sightings.'),
  E('emb-stars', 'THREE STARS', 'rare', '✦', 'All three dailies in one day.'),
  E('emb-sunrise', 'SUNRISE', 'uncommon', '☀', 'A daily before 8 am.'),
  E('emb-bitcoin', '₿', 'epic', '₿', 'Twenty-one nights in a row. HODL.'),
  E('emb-prism', 'FOUR ON THE FLOOR', 'rare', '◆', 'Four lines at once.'),
  E('emb-bullseye', 'BULLSEYE', 'uncommon', '◎', 'Dead on.'),
  E('emb-torch', 'THE FLAME', 'epic', '♨', 'Fifty nights in a row.'),
  E('emb-diamond', 'DIAMOND', 'common', '◇', 'Level 13.'),
  E('emb-crescent', 'CRESCENT', 'uncommon', '☾', 'Level 37.'),
  E('emb-crown', 'THE CROWN', 'rare', '♛', 'Level 55.'),
  E('emb-sunburst', 'SUNBURST', 'epic', '✺', 'Level 75.'),
  E('emb-ace', 'THE ACE', 'legendary', '♠', 'Level 90.'),
  // THE VAULT 2A — the emblem set's new marks (the owner's sketches): SWEETHEART (early: a friend's daughters play) + THE HOUSE's crown (level 100)
  E('emb-sweetheart', 'SWEETHEART', 'common', '♥', 'A pink neon heart, and a little purple one.'),
  E('emb-house', 'THE HOUSE', 'legendary', '♛', 'Level 100. The crown is yours.'),
  // THE VAULT 2B — BUTTERFLY (early, beside SWEETHEART: a friend's daughters play) + THE SEASONAL EMBLEMS (earned only during their holiday —
  // a counted match on its days: core/progress.js#SEASONAL — kept forever)
  E('emb-butterfly', 'BUTTERFLY', 'uncommon', '✿', 'Purple wings, pink accents.'),
  E('emb-hw', 'THE LANTERN', 'epic', '☗', 'You played on Halloween.'),
  E('emb-tg', 'HARVEST', 'epic', '❦', 'You played on Thanksgiving.'),
  E('emb-xmas', 'DECK THE HALLS', 'epic', '✷', 'You played at Christmas.'),
  E('emb-nye', 'AULD LANG SYNE', 'epic', '✧', 'You played on New Year’s.'),
  // ---- tube styles (how your emblem's neon burns)
  T('tube-twotone', 'TWO-TONE', 'common', 'Two colours in one tube.'),
  T('tube-ember', 'SLOW BURN', 'uncommon', 'Fourteen nights in a row: a tube that smoulders.'),
  T('tube-breath', 'BREATHING', 'uncommon', 'A slow breathing glow.'),
  T('tube-gold', 'GOLD TUBE', 'rare', 'Neon in gold glass.'),
  T('tube-flicker', 'OLD SIGN', 'rare', 'The flicker of an old sign.'),
  T('tube-beat', 'ON THE BEAT', 'epic', 'Pulses with the party on Friday + Saturday nights.'),
  T('tube-chase', 'A CHASING LIGHT', 'uncommon', 'A light running round and round the tube.'),
  T('tube-burnt', 'BURNT OUT', 'rare', 'One tube half dead, catching now and then.'),     // (THE VAULT 2B)
  // ---- name glows (today's VAULT glows folded in, + the new ones)
  G('glow-ember', 'EMBER', 'common', 'A warm glow, like a cigar in the dark.', { old: 'ember' }),
  G('glow-ice', 'ICE', 'common', 'Cold blue light, the back room at 3 a.m.', { old: 'ice' }),
  G('glow-neon', 'NEON', 'uncommon', 'Pink and cyan tubes, buzzing.', { old: 'neon' }),
  G('glow-gold', 'GOLD LEAF', 'rare', 'Your name in gold leaf.', { old: 'gold' }),
  G('glow-prism', 'PRISM', 'epic', 'Every colour, moving through your name.', { old: 'prism' }),
  G('glow-champagne', 'CHAMPAGNE', 'rare', 'Bubbles of light.', { old: 'gold' }),
  G('glow-afterglow', 'AFTERGLOW', 'common', 'Seven nights in a row.', { old: 'ember' }),
  G('glow-spark', 'ELECTRIC', 'rare', 'From last to first.', { old: 'neon' }),
  G('glow-starlight', 'STARLIGHT', 'rare', 'Three different legends seen.', { old: 'ice' }),
  G('glow-candle', 'CANDLELIGHT', 'uncommon', 'A daily on seven different days.', { old: 'ember' }),
  G('glow-tinsel', 'TINSEL', 'rare', 'Three holidays at the bar.', { old: 'gold' }),
  // THE VAULT 2B — the decided glows that had no item yet
  G('glow-frost', 'FROST', 'uncommon', 'Frost creeping onto your name.'),
  G('glow-fire', 'FIRE', 'rare', 'Your name, burning.'),
  G('glow-glitch', 'GLITCH', 'epic', 'The signal tears. Your name holds.'),
  // ---- the rest
  { id: 'flame-full', kind: 'flame', name: 'FULL NEON', tier: 'common', line: 'Three nights in a row: your flame burns full.' },
  { id: 'favor', kind: 'favor', name: 'A FAVOR', tier: 'epic', line: 'Call in a favor: one moment for your room.' },
];

const sum = (g, k) => Object.values(g || {}).reduce((a, x) => a + ((x && x[k]) || 0), 0);
const A = (id, name, group, item, line, check, x = {}) => ({ id, name, group, item, line, check, ...x });
export const ACH_ROWS = [
  // PLAYING
  A('first-round', 'FIRST ROUND', 'playing', 'glow-ember', 'Your first match.', (s) => sum(s.g, 'p') >= 1),
  A('house-warming', 'HOUSE WARMING', 'playing', 'emb-key', 'You hosted your first room.', (s, p) => p.ho >= 1),
  A('full-house', 'FULL HOUSE', 'playing', 'card-zebra', 'An eight-player match.', (s, p) => !!p.m8),
  A('the-regular', 'THE REGULAR', 'playing', 'card-camo', 'Ten different nights at the bar.', (s, p) => p.nt >= 10),
  A('top-shelf', 'TOP SHELF', 'playing', 'card-brushed', 'Ten wins.', (s) => sum(s.g, 'w') >= 10),
  A('made-man', 'MADE MAN', 'playing', 'card-marble', 'Fifty wins.', (s) => sum(s.g, 'w') >= 50),
  A('kingpin', 'KINGPIN', 'playing', 'card-marquee-gold', 'Two hundred and fifty wins.', (s) => sum(s.g, 'w') >= 250),
  A('the-host', 'THE HOST', 'playing', 'card-marquee', 'Twenty-five rooms of four or more, hosted.', (s, p) => p.h4 >= 25),
  A('comeback-kid', 'COMEBACK KID', 'playing', 'glow-spark', 'Last at the halfway point — then the win.', (s, p) => !!(p.gf && p.gf.comeback)),
  A('last-call', 'LAST CALL', 'playing', 'emb-cocktail', 'Last place, ten times. Have one on the house.', (s, p) => p.lc >= 10),
  A('party-animal', 'PARTY ANIMAL', 'playing', 'card-neoncamo', 'Five matches on one party night.', (s, p) => !!p.pn && p.pn.n >= 5),
  A('night-owl', 'NIGHT OWL', 'playing', 'emb-owl', 'A match between 2 and 4 am.', (s, p) => !!p.ow),
  A('the-crew', 'THE CREW', 'playing', 'emb-glasses', 'The same friend, ten nights.', (s, p) => Object.values(p.fr || {}).some(f => f && f[0] >= 10)),
  // THE CITY
  A('rainmaker', 'RAINMAKER', 'city', 'emb-lightning', 'You played through a real thunderstorm.', (s, p) => !!p.rn),
  A('snowed-in', 'SNOWED IN', 'city', 'emb-snowflake', 'You played while it really snowed.', (s, p) => !!p.sn),
  A('knock-knock', 'KNOCK KNOCK', 'city', 'emb-peephole', 'You know the knock.', (s, p) => !!p.kn),
  A('patience-pays', 'PATIENCE PAYS', 'city', 'card-carbon', 'You waited. Something flew.', (s, p) => !!p.pw),
  // CITY SIGHTINGS (each legendary's own card + emblem pair is PROGRESSION B's; these sit on top) — dormant until B's tap
  A('stargazer', 'STARGAZER', 'sightings', 'glow-starlight', 'Three different legends, seen.', (s, p) => Object.keys(p.sg || {}).length >= 3, { dormant: 'sightings' }),
  A('frequent-flyer', 'FREQUENT FLYER', 'sightings', 'emb-wings', 'Twenty-five sightings.', (s, p) => (p.sgt || 0) >= 25, { dormant: 'sightings' }),
  A('the-witness', 'THE WITNESS', 'sightings', 'card-witness', 'Every legend over the harbor, seen.', (s, p) => LEGENDARIES.every(id => p.sg && p.sg[id]), { dormant: 'sightings' }),
  // DAILIES — dormant until the first daily ships (the contract is built; the fake daily proves them)
  A('daily-bread', 'DAILY BREAD', 'dailies', 'glow-candle', 'A daily on seven different days.', (s) => !!s.dl && s.dl.n >= 7, { dormant: 'dailies' }),
  A('the-triple', 'THE TRIPLE', 'dailies', 'emb-stars', 'Every daily in one day.', (s) => !!s.dl && !!s.dl.day && Object.keys(s.dl.day.g || {}).length >= MAX_DAILIES_A_DAY, { dormant: 'dailies' }),
  A('early-bird', 'EARLY BIRD', 'dailies', 'emb-sunrise', 'A daily before 8 am.', (s) => !!s.dl && s.dl.early >= 1, { dormant: 'dailies' }),
  A('penthouse-suite', 'PENTHOUSE SUITE', 'dailies', 'card-penthouse', 'Top one percent of a daily.', (s) => !!s.dl && s.dl.ph >= 1, { dormant: 'dailies' }),
  // SPECIALS
  A('hodl', 'HODL', 'specials', 'emb-bitcoin', 'Twenty-one nights in a row.', (s) => !!s.st && Math.max(s.st.n || 0, s.st.b || 0) >= 21),
  A('many-happy-returns', 'MANY HAPPY RETURNS', 'specials', 'card-confetti', 'You played on your birthday.', (s, p) => !!p.bd, { dormant: 'birthday' }),
  A('seasons-greetings', 'SEASON’S GREETINGS', 'specials', 'glow-tinsel', 'Three holidays at the bar.', (s, p) => Object.keys(p.hol || {}).length >= 3),
  // GAME-SPECIFIC (placeholders — each game's rework sets 2–3 of its own: GAME_ACHIEVEMENTS + a flag from its match report)
  A('four-on-the-floor', 'FOUR ON THE FLOOR', 'prism', 'emb-prism', 'Four lines at once.', (s, p) => !!(p.gf && p.gf['prism.quad']), { game: 'prism' }),
  A('dead-on', 'DEAD ON', 'overclock', 'emb-bullseye', 'A Closest Call, dead on.', (s, p) => !!(p.gf && p.gf['overclock.exact']), { game: 'overclock' }),
  A('overclocked', 'OVERCLOCKED', 'overclock', 'card-circuit', 'Ten OVERCLOCK wins.', (s) => ((s.g && s.g.overclock && s.g.overclock.w) || 0) >= 10, { game: 'overclock' }),
];

export const LEVEL_REWARD_ROWS = [
  { lvl: 1, item: 'card-gilded' },
  { lvl: 3, item: 'card-midnight' },
  { lvl: 4, item: 'card-heartbreaker' },     // (THE VAULT 1A — THE PINK PAIR, early: the owner, Nov 2 10:11 pm)
  { lvl: 5, item: 'card-brass' },
  { lvl: 6, item: 'emb-sweetheart' },        // (THE VAULT 2A — the pink pair's emblem, early)
  { lvl: 7, item: 'tube-twotone' },
  { lvl: 8, item: 'card-glitter' },
  { lvl: 9, item: 'emb-butterfly' },           // (THE VAULT 2B — the pink pair's second emblem, early)
  { lvl: 10, item: 'card-emerald' },
  { lvl: 12, item: 'card-smoke' },          // (THE VAULT 1B — the 1A samples that unlocked nowhere: SMOKE ROOM · FROSTBITE · PRISM · INFERNO)
  { lvl: 13, item: 'emb-diamond' },
  { lvl: 15, item: 'glow-ice' },
  { lvl: 16, item: 'card-frostbite' },
  { lvl: 18, item: 'card-neonglass' },
  { lvl: 20, item: 'card-chrome' },
  { lvl: 22, item: 'card-prism' },
  { lvl: 23, item: 'glow-frost' },            // (THE VAULT 2B)
  { lvl: 25, item: 'card-champagne' },
  { lvl: 26, item: 'tube-chase' },            // (THE VAULT 2A — the chasing light)
  { lvl: 28, item: 'glow-neon' },
  { lvl: 30, item: 'tube-breath' },
  { lvl: 32, item: 'card-velvet' },
  { lvl: 35, item: 'card-aurora' },
  { lvl: 37, item: 'emb-crescent' },
  { lvl: 38, item: 'glow-fire' },             // (THE VAULT 2B)
  { lvl: 40, item: 'card-rosegold' },
  { lvl: 42, item: 'card-inferno' },
  { lvl: 44, item: 'card-gold' },
  { lvl: 47, item: 'tube-gold' },
  { lvl: 50, item: 'glow-gold' },
  { lvl: 53, item: 'tube-burnt' },            // (THE VAULT 2B)
  { lvl: 55, item: 'emb-crown' },
  { lvl: 58, item: 'card-noir' },
  { lvl: 60, item: 'card-sapphire' },
  { lvl: 63, item: 'glow-glitch' },           // (THE VAULT 2B)
  { lvl: 65, item: 'tube-flicker' },
  { lvl: 70, item: 'card-legend' },
  { lvl: 70, item: 'glow-prism' },
  { lvl: 75, item: 'emb-sunburst' },
  { lvl: 80, item: 'tube-beat' },
  { lvl: 85, item: 'glow-champagne' },
  { lvl: 90, item: 'emb-ace' },
  { lvl: 95, item: 'card-platinum' },
  { lvl: 100, item: 'card-house' },
  { lvl: 100, item: 'emb-house' },            // (THE VAULT 2A — THE HOUSE's crown, gold)
];

export const MILESTONE_ITEMS = {
  3: ['flame-full'],
  7: ['glow-afterglow'],
  14: ['tube-ember'],
  30: ['card-flame30'],
  50: ['emb-torch'],
  100: ['card-century', 'favor'],
  200: ['card-wildfire'],
  365: ['card-eternal'],
};

registerItems(ITEM_ROWS);
registerAchievements(ACH_ROWS);
registerLevelRewards(LEVEL_REWARD_ROWS);
registerMilestoneItems(MILESTONE_ITEMS);
/** THE SEASONAL EMBLEMS (THE VAULT 2B): a counted match during the holiday's own days (core/sky.js#holidayOf — full) → its emblem */
export const SEASONAL_ITEMS = { halloween: 'emb-hw', thanksgiving: 'emb-tg', christmas: 'emb-xmas', nye: 'emb-nye' };
registerSeasonalItems(SEASONAL_ITEMS);

const levelOfItem = Object.fromEntries(LEVEL_REWARD_ROWS.map(r => [r.item, r.lvl]));
const ROW = Object.fromEntries(ITEM_ROWS.map(x => [x.id, x]));
const AROW = Object.fromEntries(ACH_ROWS.map(a => [a.id, a]));
/** the display rows a phone may have: only these ids (what its player owns / just unlocked) → { id: { kind, name, tier, line, look?, glyph?, old?, sg?, lv? } } */
export function displayOf(ids) {
  const out = {};
  for (const id of ids || []) {
    const x = ROW[id]; if (!x) continue;
    const { id: _, ...rest } = x;
    out[id] = levelOfItem[id] ? { ...rest, lv: levelOfItem[id] } : rest;
  }
  return out;
}
/** the achievements' display rows for ids this player holds / just earned → { id: { name, group, item, line } } (never the checks) */
export function achDisplayOf(ids) {
  const out = {};
  for (const id of ids || []) { const a = AROW[id]; if (a) out[id] = { name: a.name, group: a.group, item: a.item, line: a.line }; }
  return out;
}
/** a stats object's owned + held → { items, ach } (the profile's 'me') */
export function displayForStats(st) {
  const s = st || {};
  return { items: displayOf(Object.keys(s.it || {})), ach: achDisplayOf(Object.keys(s.ac || {})) };
}
export { LEGENDARIES };

/** THE SHOW (the one way a name reaches a phone): a response gets `show: { items, ach }` — display rows for exactly the ids it carries
 *  (its items / ach, its outcome's, the profile's owned + held). Every /api function that answers with items runs its answer through. */
export function withShow(r) {
  if (!r || typeof r !== 'object') return r;
  const ids = [], achs = [];
  const take = o => { if (!o) return; if (Array.isArray(o.items)) ids.push(...o.items); if (Array.isArray(o.ach)) achs.push(...o.ach); };
  take(r); take(r.outcome);
  if (r.stats) { ids.push(...Object.keys(r.stats.it || {})); achs.push(...Object.keys(r.stats.ac || {})); }
  if (!ids.length && !achs.length) return r;
  return { ...r, show: { items: displayOf([...new Set(ids)]), ach: achDisplayOf([...new Set(achs)]) } };
}
