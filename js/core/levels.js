// LEVELS 1–100 (PROGRESSION A), PURE — shared by /api, the screens and the tests. XP is earned exactly as before (core/ranks.js#matchXp,
// server-only); the level is just a reading of it. The curve is FITTED to the old rank thresholds (the bands keep their XP lines):
//   NEWCOMER 1–4 · REGULAR 5–19 (250 XP) · INSIDER 20–39 (2,000) · MADE 40–69 (7,500) · LEGEND 70–99 (25,000) · OWNER 100 (45,000)
// Each band starts at its own price per level (`c0`) and ramps straight up to the cost that makes its levels add up to its XP (rounded,
// the band's total exact), so the early levels come fast (night one), a new band's levels cost more, and no level ever costs less than
// the one before it. OWNER at 45,000 = the lowest the old thresholds allow with that rule (LEGEND's 30 levels can't be cheaper than
// MADE's last). THE YEAR SIM (tests/levels.test.mjs) on real match XP, ~3 matches a night every other night (≈ 120 XP a day): REGULAR on
// night one, INSIDER ~2 weeks, MADE ~2 months, LEGEND ~7 months, OWNER ~a year.
import { RANKS } from './ranks.js';

export const MAX_LEVEL = 100;
/** The bands: the old ranks + OWNER at 100. `r` = the rank emblem (core/ranks.js#RANKS — OWNER wears LEGEND's until THE VAULT). */
export const BANDS = [
  { id: 'newcomer', name: 'NEWCOMER', from: 1, xp: 0, c0: 40, r: 0, line: RANKS[0].line },
  { id: 'regular', name: 'REGULAR', from: 5, xp: 250, c0: 85, r: 1, line: RANKS[1].line },
  { id: 'insider', name: 'INSIDER', from: 20, xp: 2000, c0: 150, r: 2, line: RANKS[2].line },
  { id: 'made', name: 'MADE', from: 40, xp: 7500, c0: 505, r: 3, line: RANKS[3].line },
  { id: 'legend', name: 'LEGEND', from: 70, xp: 25000, c0: 662, r: 4, line: RANKS[4].line },
  { id: 'owner', name: 'OWNER', from: 100, xp: 45000, r: 4, line: 'The house is yours' },
];
// XP_AT[L] = the XP where level L starts (XP_AT[1] = 0 … XP_AT[100] = 45,000); level 1 → 2 costs 40: the first match does it
export const XP_AT = (() => {
  const at = new Array(MAX_LEVEL + 1).fill(0);
  let L = 1;
  for (let b = 0; b < BANDS.length - 1; b++) {
    const a = BANDS[b], z = BANDS[b + 1], n = z.from - a.from, sum = z.xp - a.xp, u = a.c0;
    const v = (2 * sum) / n - u;                        // the ramp's last cost so the band's levels add up to its XP
    const costs = [];
    for (let k = 0; k < n; k++) costs.push(Math.floor(u + ((v - u) * k) / Math.max(1, n - 1)));
    let rest = sum - costs.reduce((s, c) => s + c, 0);           // the rounding: +1 on the band's LAST levels (a suffix — never a dip)
    for (let k = n - 1; rest > 0; k = (k - 1 + n) % n, rest--) costs[k]++;
    for (const c of costs) { at[L + 1] = at[L] + c; L++; }
  }
  return at;
})();

/** The level for an XP total (1–100). */
export function levelOf(xp) {
  xp = Math.max(0, Math.floor(xp || 0));
  let lo = 1, hi = MAX_LEVEL;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (XP_AT[m] <= xp) lo = m; else hi = m - 1; }
  return lo;
}
export const bandOf = lvl => { let b = BANDS[0]; for (const x of BANDS) if (lvl >= x.from) b = x; return b; };
export const bandIndex = lvl => BANDS.indexOf(bandOf(lvl));
/** The rank emblem's index (0–4) for an XP total — what profiles/{pid}/r holds. */
export const emblemRank = xp => bandOf(levelOf(xp)).r;

/** { lvl, band, from, to, into, need, frac, max } — progress inside the current level (frac 1 at 100). */
export function levelInfo(xp) {
  xp = Math.max(0, Math.floor(xp || 0));
  const lvl = levelOf(xp), band = bandOf(lvl), max = lvl >= MAX_LEVEL;
  const from = XP_AT[lvl], to = max ? from : XP_AT[lvl + 1];
  return { lvl, band, from, to, into: xp - from, need: max ? 0 : to - xp, frac: max ? 1 : (xp - from) / (to - from), max };
}
/** "INSIDER · LEVEL 23" */
export const levelLabel = xp => { const i = levelInfo(xp); return `${i.band.name} · LEVEL ${i.lvl}`; };

// ------------------------------------------------------------------ THE LEVEL REWARDS (item ids — core/items.js; THE VAULT replaces the art,
// never the ids). Every member owns the ORIGINAL GILDED card from level 1. The Gilded family at 10 / 25 / 40 / 60, NEON GLASS + VELVET
// ROOM between, today's VAULT (the old card finishes + name glows) folded in at the levels their old rank steps were worth, emblem shapes +
// tube styles filling the rest, THE HOUSE at 100.
// THE VAULT 1B — NAMES ONLY TO OWNERS: WHAT each level gives lives on the server (api/_lib/catalog.js → registerLevelRewards); the site
// keeps only WHEN (REWARD_LEVELS — THE VAGUE TEASE's "something new at level N").
export const REWARD_LEVELS = Object.freeze([1, 3, 4, 5, 7, 8, 10, 12, 13, 15, 16, 18, 20, 22, 25, 28, 30, 32, 35, 37, 40, 42, 44, 47, 50, 55, 58, 60, 65, 70, 75, 80, 85, 90, 95, 100]);
export const LEVEL_REWARDS = [];
export function registerLevelRewards(rows) { LEVEL_REWARDS.length = 0; LEVEL_REWARDS.push(...rows); }
/** The reward items for every level in (from, to] — what a match that took you from one level to another unlocks. */
export const rewardsBetween = (fromLvl, toLvl) => LEVEL_REWARDS.filter(r => r.lvl > fromLvl && r.lvl <= toLvl).map(r => r.item);
/** Every level reward up to a level (the carry-over: an existing profile's XP → everything its level has earned). */
export const rewardsUpTo = lvl => LEVEL_REWARDS.filter(r => r.lvl <= lvl).map(r => r.item);
/** THE VAGUE TEASE: the next level with something new (WHEN, never WHAT) — null past the last. */
export const nextRewardLevel = lvl => REWARD_LEVELS.find(x => x > lvl) ?? null;
