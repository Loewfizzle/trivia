// BOARD 2.0 A — THE PLAYER PAGE's DATA (PURE — api/_lib/player.js answers `player`; BOARD 2.0 B draws the page): the owner's decision (Nov 9,
// 2:30 am): the FULL CARD (+ its live effects) · level + the rank line + the streak flame · the TOP 3 RAREST achievements WITH their names + art +
// X% of players (THE APPROVED EXCEPTION to ITEM NAMES ONLY TO OWNERS — only these 3, only on this answer, only once that player owns them) ·
// INVITE (in a room) · ⋯ → REMOVE / BLOCK. NOT on it: the 4 stats, the best game (the owner left them off).
import { streakDay, dayNum } from './streak.js';

/** THE TOP 3 RAREST: held = { achId: at }, counts = { achId: holders }, n = players → [{ id, at, c }] — the lowest share first; a tie → the newest */
export function rarestThree(held, counts, n) {
  return Object.entries(held || {})
    .map(([id, at]) => ({ id, at: Number(at) || 0, c: Math.max(1, Number((counts || {})[id]) || 0) }))
    .sort((a, b) => a.c / Math.max(1, n) - b.c / Math.max(1, n) || b.at - a.at || (a.id < b.id ? -1 : 1))
    .slice(0, 3);
}

/** the streak's flame on the page: s = the count, sd = its last day → { n, alive } (alive = played today or yesterday — still lit / waiting) */
export function flameOf(s, sd, now) {
  const n = Number(s) || 0, today = streakDay(now);
  const alive = n > 0 && !!sd && dayNum(today) - dayNum(String(sd)) <= 1;
  return { n: alive ? n : 0, alive };
}

/** the fields a player's public card shows (display ids only — never the pid, the key, the tag's digits or the member Nº) */
export const CARD_FIELDS = Object.freeze(['n', 'a', 'c', 'l', 'r', 'cd', 'g', 'tb', 'es']);
