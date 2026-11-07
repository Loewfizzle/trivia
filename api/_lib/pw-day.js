// THE PASSWORD — THE SECRET SCHEDULE (PW1 — docs/password.md "The schedule"): the day's two words from THE PEPPER (the server's secret —
// fb.js: KEY_PEPPER, or derived from the service-account key; 'emulator-pepper' on the emulators) — NEVER from the date alone (the repo is
// public) and NEVER from the 32-bit `dailySeed` the start action hands a phone (a seed a phone holds must not order the list).
//
// The list is shuffled ONCE PER CYCLE with an HMAC-SHA256 stream keyed by the pepper + the cycle number (Fisher–Yates — every word exactly
// once per cycle), and day k of the cycle takes words 2k and 2k + 1 of that order: two words a day, both always different, NO WORD REPEATS
// UNTIL THE LIST IS USED UP (a cycle = ⌊n / 2⌋ days — ~1,000 days on a 2,000-word list), and the next cycle is a fresh order (new pairs).
// Pure: node:crypto only — the tests pass the pepper in.
import { createHmac } from 'node:crypto';
import { dayNum } from '../../js/core/streak.js';

/** day 0 of the schedule (the streak-day key of Nov 1 2026); an earlier day counts backwards into the cycle before */
export const SCHEDULE_EPOCH = dayNum('d20261101');

/** a keyed stream of floats in [0, 1): HMAC-SHA256(pepper, `${label}:${block}`) sliced 4 bytes at a time */
export function keyedRng(pepper, label) {
  let block = 0, buf = null, at = 0;
  return () => {
    if (!buf || at >= buf.length) { buf = createHmac('sha256', String(pepper)).update(`${label}:${block++}`).digest(); at = 0; }
    const v = buf.readUInt32BE(at); at += 4;
    return v / 4294967296;
  };
}
/** the list's order for one cycle (a Fisher–Yates shuffle on the keyed stream) — deterministic for a pepper + cycle */
export function orderFor(list, pepper, cycle) {
  const rnd = keyedRng(pepper, `pw-order:${cycle}`);
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
/** where a day falls: its cycle + its index in it */
export function slotOf(day, n) {
  const per = Math.max(1, Math.floor(n / 2));
  const idx = dayNum(day) - SCHEDULE_EPOCH;
  const cycle = Math.floor(idx / per);
  return { cycle, k: idx - cycle * per, per };
}
/** THE DAY's TWO WORDS (upper case) — day = the streak day key ('d20261107') */
export function dayWords(day, list, pepper) {
  if (!Array.isArray(list) || list.length < 2) throw new Error('pw-day: a list of at least two words');
  if (!pepper) throw new Error('pw-day: the pepper');
  const { cycle, k } = slotOf(day, list.length);
  const order = orderFor(list, pepper, cycle);
  return [order[2 * k], order[2 * k + 1]].map(w => String(w).toUpperCase());
}
