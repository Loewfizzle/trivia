// THE PASSWORD — THE RULES (PW1 — docs/password.md). PURE: no DOM, no Firebase, no clock of its own — the SERVER imports it (api/_lib/pw.js
// judges every guess with it) and the phone folds the server's answers into its copy of the run with it. The answers never live here:
// judge() takes the answer in; everything a phone holds is marks.
//
//   judge(answer, guess) → ['hit' | 'near' | 'miss' × 5]       the standard duplicate-letter rule (hits first, then nears left to right)
//   createRun({ day, uid, startedAt }) → the run                 two doors, no guesses yet
//   canGuess(run) → null | 'done' | 'closed'                     may the next guess go in?
//   serverGuess(run, guess, answers, now) → { run, resp }        THE SERVER's step: judges + closes doors; resp = what the phone gets
//   applyGuess(run, resp, guess) → run                           THE PHONE's step: folds a guess's answer in (the same run the server holds)
//   runView(record, answers) → run                               the server's stored record (the words guessed) → the run a phone may see
//   scoreOf(run) → { doors, guesses, score, time }               score = (2 − doors) × 100 + guesses (2…12 a clean crack; lower is better)
//   replay(record, answers) → result | null                      THE SERVER's CHECK: re-scores a finished record, refuses one no run makes
import { WORD_LEN, DOORS, GUESSES, DOOR_NAMES, DEFAULT_SETTINGS, chatLocked } from './meta.js';
export { WORD_LEN, DOORS, GUESSES, DOOR_NAMES, DEFAULT_SETTINGS, chatLocked };

export const HIT = 'hit', NEAR = 'near', MISS = 'miss';
export const MARKS = Object.freeze([HIT, NEAR, MISS]);
const WORD_RE = /^[A-Z]{5}$/;

/** a 5-letter word in capitals, or null */
export const cleanWord = w => { const s = String(w || '').trim().toUpperCase(); return WORD_RE.test(s) ? s : null; };

/** the five marks for a guess against the answer — Wordle's duplicate rule: every exact letter is a HIT first; then each remaining guess letter
 *  is NEAR only while the answer still has an unmatched copy of it (left to right); the rest MISS */
export function judge(answer, guess) {
  const a = cleanWord(answer), g = cleanWord(guess);
  if (!a || !g) throw new Error('judge: two 5-letter words');
  const marks = new Array(WORD_LEN).fill(MISS);
  const left = {};
  for (let i = 0; i < WORD_LEN; i++) {
    if (g[i] === a[i]) marks[i] = HIT;
    else left[a[i]] = (left[a[i]] || 0) + 1;
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (marks[i] === HIT) continue;
    if (left[g[i]] > 0) { marks[i] = NEAR; left[g[i]]--; }
  }
  return marks;
}
export const solvedBy = marks => Array.isArray(marks) && marks.length === WORD_LEN && marks.every(m => m === HIT);

const freshDoor = () => ({ guesses: [], marks: [], state: 'open', word: null });
/** a new run: two doors, the first one open */
export function createRun({ day, uid, startedAt } = {}) {
  return { id: 'password', day: day || null, uid: uid || null, startedAt: Number(startedAt) || 0, door: 0, doors: Array.from({ length: DOORS }, freshDoor), done: false, finishedAt: 0 };
}
export const doorOf = run => run.doors[run.door] || null;
/** may a guess go in? null = yes */
export function canGuess(run) {
  if (!run || run.done) return 'done';
  const d = doorOf(run);
  if (!d || d.state !== 'open') return 'closed';
  if (d.guesses.length >= GUESSES) return 'closed';
  return null;
}
/** guesses left on the open door */
export const guessesLeft = run => { const d = doorOf(run); return d && d.state === 'open' ? GUESSES - d.guesses.length : 0; };

/** the door's state after a guess (pure, the door only) */
function closeDoor(d, marks) {
  if (solvedBy(marks)) return 'solved';
  if (d.guesses.length >= GUESSES) return 'failed';
  return 'open';
}
const clone = run => ({ ...run, doors: run.doors.map(d => ({ ...d, guesses: d.guesses.slice(), marks: d.marks.map(m => m.slice()) })) });

/**
 * THE SERVER's step. answers = the day's two words (server-only). now = the server clock (the finish time).
 * → { run, resp } · resp = { door, n, marks, solved, failed, word (only when that door just closed), done, next? (the next door opened) }
 * Throws on a guess the rules refuse (the caller answers 409 / 422); the word's spelling is checked by the caller (valid-5 + the list).
 */
export function serverGuess(run, guess, answers, now) {
  const why = canGuess(run);
  if (why) throw Object.assign(new Error(why === 'done' ? 'The run is over.' : 'That door is closed.'), { code: why });
  const g = cleanWord(guess);
  if (!g) throw Object.assign(new Error('A 5-letter word.'), { code: 'bad_word' });
  if (!Array.isArray(answers) || answers.length !== DOORS) throw new Error('serverGuess: the day\'s two answers');
  const next = clone(run);
  const di = next.door, d = next.doors[di];
  const marks = judge(answers[di], g);
  d.guesses.push(g); d.marks.push(marks);
  d.state = closeDoor(d, marks);
  const resp = { door: di, n: d.guesses.length, marks, solved: d.state === 'solved', failed: d.state === 'failed', done: false };
  if (d.state !== 'open') {
    d.word = cleanWord(answers[di]);
    resp.word = d.word;
    // door 1 missed = the run ends (THE BACK ROOM never opens, its word never shown); door 1 opened = THE BACK ROOM is next
    if (d.state === 'solved' && di + 1 < DOORS) { next.door = di + 1; resp.next = di + 1; }
    else { next.done = true; next.finishedAt = Number(now) || 0; resp.done = true; }
  }
  return { run: next, resp };
}

/** THE PHONE's step: fold the server's answer to `guess` into its run (the run it would hold had it judged itself) */
export function applyGuess(run, resp, guess) {
  const g = cleanWord(guess);
  if (!resp || !g || !Array.isArray(resp.marks) || resp.marks.length !== WORD_LEN) throw new Error('applyGuess: a server answer + the word');
  const next = clone(run);
  const di = Number(resp.door);
  const d = next.doors[di];
  if (!d) throw new Error('applyGuess: no such door');
  if (d.guesses.length !== Number(resp.n) - 1) throw Object.assign(new Error('applyGuess: out of step'), { code: 'out_of_step' });
  d.guesses.push(g); d.marks.push(resp.marks.slice());
  d.state = resp.solved ? 'solved' : resp.failed ? 'failed' : 'open';
  if (d.state !== 'open' && resp.word) d.word = cleanWord(resp.word);
  if (resp.next != null) next.door = Number(resp.next);
  if (resp.done) { next.done = true; next.finishedAt = Number(resp.finishedAt) || next.finishedAt || 0; }
  return next;
}

/**
 * THE SERVER's STORED RECORD → the run a phone may see (a resume). record = { g: { 0: [words], 1: [words] }, e?: finishedAt } — the words
 * guessed, door by door (the server keeps nothing else: the marks come from the answers). Only a CLOSED door's word is in the run.
 */
export function runView(record, answers, { day, uid, startedAt } = {}) {
  let run = createRun({ day, uid, startedAt });
  const g = (record && record.g) || {};
  for (let di = 0; di < DOORS; di++) {
    for (const w of Array.isArray(g[di]) ? g[di] : Object.values(g[di] || {})) {
      if (!canGuess(run) && run.door === di) run = serverGuess(run, w, answers, record && record.e).run;
    }
  }
  if (record && record.e && run.done) run.finishedAt = Number(record.e) || run.finishedAt;
  return run;
}
/** what the server stores of a run (the words only — never a mark, never an answer) */
export const recordOf = run => ({ g: Object.fromEntries(run.doors.map((d, i) => [i, d.guesses.slice()]).filter(([, g]) => g.length)), ...(run.done ? { e: run.finishedAt } : {}) });

/** doors opened · guesses used · THE SCORE = (2 − doors) × 100 + guesses (lower is better) · the time (ms, start → finish) */
export function scoreOf(run) {
  const doors = run.doors.filter(d => d.state === 'solved').length;
  const guesses = run.doors.reduce((s, d) => s + d.guesses.length, 0);
  const time = run.done && run.finishedAt && run.startedAt ? Math.max(0, run.finishedAt - run.startedAt) : 0;
  return { doors, guesses, score: (DOORS - doors) * 100 + guesses, time };
}
export const SCORE_MIN = DOORS, SCORE_MAX = DOORS * 100 + GUESSES;   // 2 … 206
/** ONE number that orders both (the module's rankings): a lower score first, then the faster run */
export const rankOf = (score, time) => Math.round(score) * (1e7 + 1) + Math.max(0, Math.min(1e7, Math.round(time)));

/** the comparable result of a FINISHED run (the daily plug-in's result): { score, time, rank, doors, guesses } — null while it runs */
export function resultOf(run) {
  if (!run || !run.done) return null;
  const s = scoreOf(run);
  return { ...s, rank: rankOf(s.score, s.time) };
}

/**
 * THE SERVER's REPLAY: a finished record re-judged against the answers → the same result, or null for a record no run makes (a guess after a
 * door closed or the run ended, more than 6 a door, THE BACK ROOM before THE DOOR opened, a word that isn't five letters, an unfinished run).
 */
export function replay(record, answers, { startedAt = 0 } = {}) {
  if (!record || typeof record !== 'object' || !Array.isArray(answers) || answers.length !== DOORS) return null;
  const g = record.g || {};
  for (const k of Object.keys(g)) if (!(Number(k) >= 0 && Number(k) < DOORS)) return null;
  let run = createRun({ startedAt });
  for (let di = 0; di < DOORS; di++) {
    const words = Array.isArray(g[di]) ? g[di] : g[di] ? Object.values(g[di]) : [];
    if (!words.length) continue;
    if (run.done || run.door !== di) return null;                 // a door guessed at that was never open
    for (const w of words) {
      if (!cleanWord(w) || canGuess(run) || run.door !== di) return null;   // (a word on a door the run had left)
      run = serverGuess(run, w, answers, record.e).run;
    }
  }
  if (!run.done) return null;
  if (!(Number(record.e) > 0)) return null;
  run.finishedAt = Number(record.e);
  return resultOf(run);
}

/** "DOOR 2 · THE BACK ROOM · 4 OF 6 LEFT" — the line over the grid */
export function statusLine(run) {
  if (!run) return '';
  if (run.done) { const s = scoreOf(run); return s.doors === DOORS ? 'BOTH DOORS OPEN' : s.doors ? 'THE BACK ROOM HELD' : 'THE DOOR HELD'; }
  return `DOOR ${run.door + 1} · ${DOOR_NAMES[run.door]} · ${guessesLeft(run)} OF ${GUESSES} LEFT`;
}

/** the keyboard's marks from every guess so far on the open door (+ the closed ones): the best mark a letter earned — hit > near > miss */
export function keyStates(run, door = null) {
  const rank = { [HIT]: 3, [NEAR]: 2, [MISS]: 1 };
  const out = {};
  const doors = door == null ? [doorOf(run)].filter(Boolean) : [run.doors[door]].filter(Boolean);
  for (const d of doors) d.guesses.forEach((w, gi) => [...w].forEach((ch, i) => { const m = d.marks[gi][i]; if ((rank[m] || 0) > (rank[out[ch]] || 0)) out[ch] = m; }));
  return out;
}
