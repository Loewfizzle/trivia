// HOLD'EM — THE STRUCTURE (HE1, pure): the owner's numbers (docs/games/plan.md "HOLD'EM — THE PLAN") in one place.
// PLAY CHIPS ONLY — every amount here is chips.

/** THE BLIND LADDER (small / big). Past the last rung each level doubles both. No antes. */
export const LADDER = [
  [10, 20], [15, 30], [25, 50], [50, 100], [75, 150], [100, 200], [150, 300], [200, 400],
  [300, 600], [500, 1000], [700, 1400], [1000, 2000], [1500, 3000], [2000, 4000], [3000, 6000], [5000, 10000],
];

/**
 * TOURNAMENT speeds: the starting stack + the level time. TURBO is the default. TURBO's level = 90 s (the plan said
 * 2 min; HE1's length study — scripts/holdem-sim.mjs — put 2 min at a 22–25 min median for 6–8 players, 90 s at
 * 18.5–19.7 inside the 15–20 target; docs/holdem.md "THE LENGTH STUDY").
 */
export const SPEEDS = {
  turbo: { stack: 1500, levelMs: 90_000 },
  standard: { stack: 1500, levelMs: 6 * 60_000 },
  deep: { stack: 3000, levelMs: 15 * 60_000 },            // HE2 (Ben): 15 min (HE1 had 12)
};
export const DEFAULT_SPEED = 'turbo';

/**
 * CASH: an open session — fixed blinds, a rebuy at zero, no session END time (HE2: "no timer" never meant no shot clock —
 * CASH runs THE SHOT CLOCK too, its time bank refilling BANK_REFILL_MS a hand dealt in, up to BANK_MS).
 */
export const CASH = { stack: 1000, sb: 5, bb: 10, rebuy: 1000 };

/** THE SHOT CLOCK (both modes — HE2): 20 s a turn + a 30 s TIME BANK, spent after the 20 s (a TOURNAMENT's bank is one per match). */
export const SHOT_MS = 20_000;
export const BANK_MS = 30_000;
/** CASH (HE2): the bank refills +5 s per hand a player is dealt into, never past BANK_MS. */
export const BANK_REFILL_MS = 5_000;
/** Two TIMEOUTs in a row → AWAY (a TOURNAMENT: auto check / fold, still dealt in; CASH — HE2: SAT OUT, not dealt in until back). */
export const AWAY_AFTER = 2;

export const MAX_SEATS = 8;
export const MIN_PLAYERS = 2;

/** Level n's blinds { sb, bb } (n from 0). */
export function blindsAt(level) {
  const n = Math.max(0, Math.floor(level || 0));
  if (n < LADDER.length) return { sb: LADDER[n][0], bb: LADDER[n][1] };
  const [s, b] = LADDER[LADDER.length - 1], k = 2 ** (n - LADDER.length + 1);
  return { sb: s * k, bb: b * k };
}

/** The level running at `now` for a tournament that began at `startAt`. */
export const levelAt = (startAt, now, levelMs) => Math.max(0, Math.floor((now - startAt) / levelMs));
