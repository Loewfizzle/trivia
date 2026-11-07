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
import { fb } from './fb.js';
import { dayWords } from './pw-day.js';
import { runView, serverGuess, recordOf, canGuess, cleanWord, replay, SCORE_MIN, SCORE_MAX } from '../../js/games/password/logic.js';

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
/** THE DAY's two words (server-only) */
export const wordsFor = (day, pepper = fb().pepper) => dayWords(day, pwLists().answers, pepper);

/** the phone's view of a stored record */
export const viewOf = (record, day, { startedAt = 0, pepper } = {}) => runView(record, wordsFor(day, pepper), { day, startedAt });

/** THE PASSWORD's daily cartridge (core/daily.js#registerDaily): better = LOW, one bucket per score 2…206 */
export const PW_DAILY = {
  id: 'password', name: 'THE PASSWORD', better: 'low', buckets: SCORE_MAX - SCORE_MIN + 1,
  bucket: score => score - SCORE_MIN,
  judged: true,                                                  // the server holds the record: start returns the run, guess exists, finish ignores the claim
  /** a resume: the record → what the phone may see */
  resume: ({ record, day, startedAt }) => viewOf(record, day, { startedAt }),
  /** ONE guess, judged inside a transaction on the record (two taps at once can't both be guess n) → { record, resp } or a refusal */
  judge({ record, word, day, startedAt, now }) {
    const g = cleanWord(word);
    if (!g || !isWord(g)) return { refused: 'not_a_word' };      // (no cost: nothing is written)
    const run = viewOf(record, day, { startedAt });
    const why = canGuess(run);
    if (why) return { refused: why };                             // 'done' | 'closed'
    const { run: next, resp } = serverGuess(run, g, wordsFor(day), now);
    if (resp.done) resp.finishedAt = next.finishedAt;
    return { record: recordOf(next), resp };
  },
  /** THE SCORE from the server's record — the phone's `result` is ignored; null = not finished / a record no run makes */
  verify(seed, result, { startedAt, record, day } = {}) {
    if (!record || !day) return null;
    const r = replay(record, wordsFor(day), { startedAt });
    return r ? r.score : null;
  },
  /** PW2 — THE FLAGS a finished run earns, from the RECORD (the award engine keys them `password-<flag>`): `crack` = both doors opened
   *  (KEYHOLE) · `safe` = both doors in SAFE_GUESSES or fewer combined (SAFECRACKER — ≈ the best ~10 % of runs: scripts/sim-password.mjs) */
  flags({ record, day, startedAt } = {}) {
    if (!record || !day) return null;
    return runFlags(replay(record, wordsFor(day), { startedAt }));
  },
};
/** the threshold SAFECRACKER asks for: both doors in this many guesses or fewer (the owner, PW2 — the simulation checks ≈ 10 %) */
export const SAFE_GUESSES = 6;
/** a finished result → its flags (PURE): { crack: 1, safe?: 1 } | null */
export const runFlags = r => (r && r.doors === 2 ? { crack: 1, ...(r.guesses <= SAFE_GUESSES ? { safe: 1 } : {}) } : null);
