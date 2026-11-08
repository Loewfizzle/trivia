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

// ------------------------------------------------------------------ THE FROZEN SCHEDULE (DM1 — FABLE REVIEW #1, 13)
// dayWords() reshuffles a whole cycle whenever the list changes (its length + its order feed the shuffle). THE FROZEN SCHEDULE fixes the order
// ONCE: a flat sequence of words (day k of the schedule = words 2k + 2k+1), stored server-only (pw.js — dsched/password) and only ever:
//   · EXTENDED — a new cycle appended when the days reach the end (the same keyed order dayWords uses, cut to an even length: so while the list
//     is untouched the frozen schedule IS dayWords' — the switch to it moved nothing), its first words never the last day's;
//   · RECONCILED when the list changes — everything up to TODAY's pair kept as it is (a day already scheduled — played, or in flight — never
//     moves), the rest: a REMOVED word skipped (the later days slide up one), a NEW word joins at the END (the current cycle's end) — nothing
//     already scheduled is reshuffled.
// PURE (node:crypto only): the tests pass the pepper in; pw.js stores + reads the record.
/** a list's fingerprint (the record's `h`: a changed list → reconcile) */
export const listHash = list => createHmac('sha256', 'pw-list').update(list.map(w => String(w).toUpperCase()).join(',')).digest('hex').slice(0, 16);
const up = list => list.map(w => String(w).toUpperCase());
/** cycle c's words, as the schedule takes them (an even count — the odd word rests that cycle, like dayWords) */
export function cycleWords(list, pepper, c) {
  const o = up(orderFor(list, pepper, c));
  return o.slice(0, 2 * Math.floor(o.length / 2));
}
/** the first record: cycle 0 → { v, s: [words], c: 1 (cycles appended), h } */
export function freezeSchedule(list, pepper) {
  if (!Array.isArray(list) || list.length < 2) throw new Error('pw-day: a list of at least two words');
  if (!pepper) throw new Error('pw-day: the pepper');
  return { v: 1, s: cycleWords(list, pepper, 0), c: 1, h: listHash(list) };
}
/** append cycles until day index `idx` has its pair (a new cycle never opens on the last day's words) → a new record, or the same one */
export function extendSchedule(rec, list, pepper, idx) {
  if (2 * idx + 1 < rec.s.length) return rec;
  const s = rec.s.slice();
  let c = rec.c;
  while (2 * idx + 1 >= s.length) {
    const add = cycleWords(list, pepper, c++);
    const tail = new Set(s.slice(-2));
    for (let i = 0, g = 0; i < 2 && g < add.length; g++) { if (tail.has(add[i])) add.push(add.splice(i, 1)[0]); else i++; }
    s.push(...add);
    if (!add.length) break;
  }
  return { ...rec, s, c };
}
/** the list changed: keep every word up to (and including) day `idx`'s pair; skip removed words after it; new words join at the end */
export function reconcileSchedule(rec, list, pepper, idx) {
  const now = new Set(up(list)), keepN = Math.max(0, Math.min(rec.s.length, 2 * (idx + 1)));
  const kept = rec.s.slice(0, keepN), rest = rec.s.slice(keepN).filter(w => now.has(w));
  const seen = new Set(rec.s);
  const fresh = up(orderFor(up(list).filter(w => !seen.has(w)), pepper, `add:${listHash(list)}`));
  return { ...rec, s: [...kept, ...rest, ...fresh], h: listHash(list) };
}
/** day index (from SCHEDULE_EPOCH) of a streak-day key */
export const dayIndex = day => dayNum(day) - SCHEDULE_EPOCH;
/** THE DAY's two words from a frozen record (two different words — a seam's repeat steps over to the next word) */
export function frozenWords(rec, idx) {
  const a = rec.s[2 * idx];
  let j = 2 * idx + 1;
  while (j < rec.s.length - 1 && rec.s[j] === a) j++;
  return [a, rec.s[j]];
}
/** THE RESEED (DM1 ADD-ON): everything up to day `keepIdx`'s pair kept; every word after it — the same words — in a NEW order from the new
 *  daily secret (no word lost, none added, today + the past untouched) → a new record */
export function reorderAfter(rec, keepIdx, key, label = 'reseed') {
  const keepN = Math.max(0, Math.min(rec.s.length, 2 * (keepIdx + 1)));
  return { ...rec, s: [...rec.s.slice(0, keepN), ...up(orderFor(rec.s.slice(keepN), key, label))], rs: label };
}
