// THE ONE TIER PALETTE (THE VAULT 1C — the owner, Nov 3 8:47 am: "one shared tier palette across the whole game — cards, events,
// emblems"). PURE: the five tiers, their colours + the rule that gives a timetable row (THE PROGRAM's listing) its tier.
//   COMMON grey · UNCOMMON green · RARE blue · EPIC purple · LEGENDARY gold
// The CSS twin lives in css/base.css :root (--tier-<id> for light on dark, --tier-<id>-ink for words on paper / light glass); this file
// holds the same hexes for canvases + tests (tests/rarity.test.mjs checks the two agree + every pair's contrast ≥ 4.5 : 1).
export const RARITY = Object.freeze(['common', 'uncommon', 'rare', 'epic', 'legendary']);
export const RARITY_NAME = Object.freeze({ common: 'COMMON', uncommon: 'UNCOMMON', rare: 'RARE', epic: 'EPIC', legendary: 'LEGENDARY' });
/** the light on a dark ground (a badge's fill, a glow, a dark card's tag) */
export const RARITY_HEX = Object.freeze({ common: '#aeb4bd', uncommon: '#4fdc8c', rare: '#5aa8ff', epic: '#bd84ff', legendary: '#ffc64f' });
/** the INK: words + badges on paper / light glass (THE PROGRAM's paper is #f6ecd4 → #eadbb6) */
export const RARITY_INK = Object.freeze({ common: '#585d64', uncommon: '#136034', rare: '#1b58ad', epic: '#6a2bb3', legendary: '#7f5300' });
/** the dark ink a light badge carries (the tag's words on its own RARITY_HEX fill) */
export const RARITY_ON = '#14100a';

/**
 * a row of THE DAY CHART (core/harbor-daychart.js: { cat, big?, rare? }) → its tier on THE PROGRAM:
 *   LEGENDARY the legendaries · EPIC the fireworks, the raid, a holiday's big moment · RARE a window scene the timetable gives under half
 *   the nights · UNCOMMON the other window scenes, the showcase's MEDIUM tier (the airliners, the extra helicopter passes — several a
 *   night), the party night's phases, the holidays' small things · COMMON the
 *   everyday city (the patrol, the workers, the airliners, the billboard's hints, the lights, the boats …)
 */
export function programTier(i) {
  if (!i) return 'common';
  const c = i.cat;
  if (c === 'legendary' || i.legend) return 'legendary';          // (the ghost ship is a holiday row + a legendary sighting)
  if (c === 'fireworks' || c === 'raid' || (c === 'holiday' && i.big)) return 'epic';
  if ((c === 'windows' && i.rare) || i.rare) return 'rare';
  // (SHELL 2.0 B2 — the owner, Nov 5 12:22 pm: ~8 airliners an hour tagged UNCOMMON read wrong → THE MEDIUM MOMENTS are tagged by HOW OFTEN
  //  they come: the word MEDIUM (programWord) in the common grey — they're the city's regular texture, not a rarity)
  if (c === 'medium') return 'common';
  if (c === 'windows' || c === 'party' || c === 'holiday' || c === 'holidays') return 'uncommon';
  return 'common';
}
/** a program row's TAG word — its tier's name, except THE MEDIUM MOMENTS: MEDIUM (how often they come) */
export const programWord = i => (i && i.cat === 'medium' ? 'MEDIUM' : RARITY_NAME[programTier(i)]);
/** one of HIS moments (a radio jack — core/harbor-radio.js#jacks: its lane) → its tier */
export const jackTier = j => (!j ? 'uncommon' : j.lane === 'legend' ? 'legendary' : j.lane === 'show' ? 'epic' : 'uncommon');
