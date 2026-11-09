// THE PASSWORD on the server (PW1 — docs/password.md "The server flow"): THE DAILY CARTRIDGE that JUDGES EVERY GUESS. The answers live ONLY
// here — api/_data/pw/answers.json (never served: Vercel serves api/ as functions only; scripts/serve.mjs the same; vercel.json's
// includeFiles ships it with api/daily.js) — ordered by THE SECRET SCHEDULE (pw-day.js, the pepper). A phone gets MARKS, never a word, until
// a door CLOSES (solved or failed — then that door's word); a door never attempted is never revealed.
//
//   the record a run leaves: dly/password/{day}/p/{pid} = { g: { 0: [words], 1: [words] }, e?: finishedAt }   (server-only — the rules' default deny)
//   start  → { run } (the record → the phone's view: the marks, the closed doors' words — a resume);  NO seed (a seed a phone holds must say nothing)
//   guess  { word } → { door, n, marks, solved, failed, word?, next?, done, finishedAt? } — a word that isn't one is refused BEFORE it counts
//   finish → the score from the SERVER's record (never the phone's claim): replay() → (2 − doors) × 100 + guesses
// Registered by dailies.js — until THE SWITCH-OVER only under DAILY_TEST=1 (production answers 'no_daily').
import { readFileSync } from 'node:fs';
import { ref, val } from './fb.js';
import { dayWords, freezeSchedule, extendSchedule, reconcileSchedule, reorderAfter, frozenWords, dayIndex, listHash } from './pw-day.js';
import { dailySecret } from './daily-secret.js';
import { streakDay, dayOf } from '../../js/core/streak.js';
import { SCHEDULE_EPOCH } from './pw-day.js';
import { runView, serverGuess, recordOf, canGuess, cleanWord, replay, shareRunOf, SCORE_MIN, SCORE_MAX } from '../../js/games/password/logic.js';

const DATA = new URL('../_data/pw/', import.meta.url);
let lists = null;
/** the answer list + the spelling check (read once per process) */
export function pwLists() {
  if (lists) return lists;
  const a = JSON.parse(readFileSync(new URL('answers.json', DATA), 'utf8'));
  const v = JSON.parse(readFileSync(new URL('valid-5.json', DATA), 'utf8'));
  const answers = a.words.map(w => w.toUpperCase());
  const valid = new Set(String(v).toUpperCase().match(/.{5}/g) || []);
  for (const w of answers) valid.add(w);
  lists = { answers, valid, n: answers.length };
  return lists;
}
/** is this a word a guess may be? (valid-5 ∪ the answers) */
export const isWord = w => { const c = cleanWord(w); return !!c && pwLists().valid.has(c); };
/** the schedule's FORMULA for a day (pw-day.js#dayWords) from THE DAILY SECRET (daily-secret.js — never the pepper) — the same words as THE
 *  FROZEN SCHEDULE while the list is untouched and no reseed has run (the tests read the answers through it); the server judges from
 *  pwDay(day), the frozen schedule's stored pair */
export const wordsFor = async (day, secret = null) => dayWords(day, pwLists().answers, secret || await dailySecret(day));

// ---- DM1 — THE 4 AM PICKER's part for THE PASSWORD: the day's pair FIXED once (dly/password/{day}/b = { v, w: 'W1,W2' }, server-only), read from
// THE FROZEN SCHEDULE (dsched/password = { v, s: 'W,W,…', c, h }, server-only — pw-day.js: extended + reconciled, never reshuffled). Built lazily
// on the day's first call; both writes are transactions (two first calls at once keep ONE pair); a warm function keeps ≤ 3 days in memory.
export const SCHED_PATH = 'dsched/password';
const packSched = r => ({ v: 1, s: r.s.join(','), c: r.c, h: r.h });
const unpackSched = p => (p && p.v === 1 && typeof p.s === 'string' ? { v: 1, s: p.s ? p.s.split(',') : [], c: p.c || 1, h: p.h || '' } : null);
/** the frozen schedule, frozen / reconciled / extended as needed so day index `idx` has its pair (one transaction) */
export async function frozenSchedule(idx, keepIdx, { pepper = null, list = pwLists().answers } = {}) {
  pepper ||= await dailySecret(dayOfIndex(Math.max(idx, keepIdx)));   // (THE DAILY SECRET in force that day — a reseed's new key from its day on)
  const h = listHash(list);
  let out = null;
  const step = cur => {
    let r = unpackSched(cur) || freezeSchedule(list, pepper);
    if (r.h !== h) r = reconcileSchedule(r, list, pepper, keepIdx);
    r = extendSchedule(r, list, pepper, Math.max(idx, keepIdx));
    out = r;
    return r;
  };
  const tx = await ref(SCHED_PATH).transaction(cur => {
    const before = unpackSched(cur);
    const r = step(cur);
    if (before && before.h === r.h && before.s.length === r.s.length && before.c === r.c) return undefined;   // nothing new: nothing written
    return packSched(r);
  });
  return unpackSched(tx.snapshot.val()) || out;
}
const DAYS = new Map();   // day → [W1, W2] (a warm function's copy; ≤ 3 days)
/** THE DAY's two words (server-only): memory → the stored pair → the frozen schedule (+ the pair stored once). A day before the schedule's
 *  epoch (no frozen slot) takes the formula. */
export async function pwDay(day, now = Date.now()) {
  if (DAYS.has(day)) return { words: DAYS.get(day) };
  const path = `dly/password/${day}/b`;
  const have = await val(path);
  let words = have && have.v === 1 && typeof have.w === 'string' ? have.w.split(',') : null;
  if (!words) {
    const idx = dayIndex(day);
    if (idx < 0) words = await wordsFor(day);
    else {
      const rec = await frozenSchedule(idx, Math.max(idx, dayIndex(streakDay(now))));
      const pair = frozenWords(rec, idx);
      const tx = await ref(path).transaction(cur => (cur && cur.v === 1 ? undefined : { v: 1, w: pair.join(',') }));
      const kept = tx.snapshot.val();
      words = kept && typeof kept.w === 'string' ? kept.w.split(',') : pair;
    }
  }
  DAYS.set(day, words);
  for (const k of [...DAYS.keys()].slice(0, -3)) DAYS.delete(k);
  return { words };
}
export const forgetPwDays = () => DAYS.clear();
const dayOfIndex = i => dayOf(SCHEDULE_EPOCH + i);
/** the day's words from a cartridge call's data (the picker's pair — api/daily.js always loads it) */
const wordsOf = (day, data) => { if (!(data && Array.isArray(data.words))) throw new Error(`pw: ${day}'s words (the cartridge's load) are required`); return data.words; };

/** THE RESEED's part (daily-secret.js#reseedDailies hooks.schedule): every word after TODAY's pair in a new order from the new key (frozen
 *  first if it never was — today's key) → a line for the report */
export async function reseedSchedule({ today, from, key, dryRun }) {
  const idx = dayIndex(today);
  if (idx < 0) return null;
  const rec = await frozenSchedule(idx + 1, idx);
  const next = reorderAfter(rec, idx, key, `reseed:${from}`);
  if (!dryRun) await ref(SCHED_PATH).set(packSched(next));
  forgetPwDays();
  return `THE PASSWORD: ${next.s.length - 2 * (idx + 1)} scheduled words after today reordered (today's pair + ${idx} day(s) before kept)`;
}

/** the phone's view of a stored record */
export const viewOf = (record, day, { startedAt = 0, data } = {}) => runView(record, wordsOf(day, data), { day, startedAt });

/** THE PASSWORD's daily cartridge (core/daily.js#registerDaily): better = LOW, one bucket per score 2…206 */
export const PW_DAILY = {
  id: 'password', name: 'THE PASSWORD', better: 'low', buckets: SCORE_MAX - SCORE_MIN + 1,
  bucket: score => score - SCORE_MIN,
  judged: true,                                                  // the server holds the record: start returns the run, guess exists, finish ignores the claim
  /** DM1 — the day's server-side data before any call: the day's pair, FIXED by the 4 am picker (pwDay — THE FROZEN SCHEDULE) */
  load: (day, now) => pwDay(day, now),
  /** a resume: the record → what the phone may see */
  resume: ({ record, day, startedAt, data }) => viewOf(record, day, { startedAt, data }),
  /** ONE guess, judged inside a transaction on the record (two taps at once can't both be guess n) → { record, resp } or a refusal */
  judge({ record, word, day, startedAt, now, data }) {
    const g = cleanWord(word);
    if (!g || !isWord(g)) return { refused: 'not_a_word' };      // (no cost: nothing is written)
    const run = viewOf(record, day, { startedAt, data });
    const why = canGuess(run);
    if (why) return { refused: why };                             // 'done' | 'closed'
    const { run: next, resp } = serverGuess(run, g, wordsOf(day, data), now);
    if (resp.done) resp.finishedAt = next.finishedAt;
    return { record: recordOf(next), resp };
  },
  /** THE SCORE from the server's record — the phone's `result` is ignored; null = not finished / a record no run makes */
  verify(seed, result, { startedAt, record, day, data } = {}) {
    if (!record || !day) return null;
    const r = replay(record, wordsOf(day, data), { startedAt });
    return r ? r.score : null;
  },
  /** BOARD 2.0 B — SHARE TODAY's section: the finished run's marks + counts (logic.js#shareRunOf — never a word) */
  share({ record, day, startedAt, data } = {}) {
    if (!record || !day) return null;
    return shareRunOf(viewOf(record, day, { startedAt, data }));
  },
  /** PW2 — THE FLAGS a finished run earns, from the RECORD (the award engine keys them `password-<flag>`): `crack` = both doors opened
   *  (KEYHOLE) · `safe` = both doors in SAFE_GUESSES or fewer combined (SAFECRACKER — ≈ the best ~10 % of runs: scripts/sim-password.mjs) */
  flags({ record, day, startedAt, data } = {}) {
    if (!record || !day) return null;
    return runFlags(replay(record, wordsOf(day, data), { startedAt }));
  },
};
/** the threshold SAFECRACKER asks for: both doors in this many guesses or fewer (the owner, PW2 — the simulation checks ≈ 10 %) */
export const SAFE_GUESSES = 6;
/** a finished result → its flags (PURE): { crack: 1, safe?: 1 } | null */
export const runFlags = r => (r && r.doors === 2 ? { crack: 1, ...(r.guesses <= SAFE_GUESSES ? { safe: 1 } : {}) } : null);
