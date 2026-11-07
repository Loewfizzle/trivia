// THE PASSWORD — THE DAILY PLUG-IN (PW1 — docs/cartridge.md D2 "THE DAILY PLUG-IN", docs/password.md). SHIPS OFF: THE DAILY MODULE (later)
// opens it once a day, owns the banner, the pause, the RESUME chip, the result + the share, the rankings and the streak hooks. PURE.
//
// THE PASSWORD is SERVER-JUDGED: its day set carries NO words — { v: 1, day } is all a phone gets (the answers live only in the server's pw folder (api · _data · pw) and
// reach a phone as MARKS through the guess action, a door's word only once that door closes — api/_lib/pw.js). So create() builds an EMPTY
// run for the day; the view fills it from judge.start() (the server's record — a resume) and every guess's answer.
//   create({ date, uid, now, daySet }) → the game (a run shell: { id, matchId, day, uid, startedAt: now, participants, phase: 'play' … })
//   resumeKey(date, uid)               → the one key a day's try lives under (a refresh / an app switch RESUMES — the server holds the record)
//   result(game, uid)                   → { score, time, rank } of a finished run (null while it runs) — ONE comparable number
//   replay(daySet, record, answers)     → THE SERVER's check: the stored words re-judged → the same result, or null (logic.js#replay)
//   problems(daySet)                    → what's wrong with a day set ([] = fine)
import { createRun, resultOf, replay as replayRun } from './logic.js';

export const DAILY_V = 1;
const DAY_RE = /^(\d{4}-\d{2}-\d{2}|d\d{8})$/;

export function daySetProblems(ds) {
  const out = [];
  if (!ds || typeof ds !== 'object') return ['no day set'];
  if (ds.v !== DAILY_V) out.push(`v must be ${DAILY_V}`);
  if (!DAY_RE.test(String(ds.day || ''))) out.push('day must be YYYY-MM-DD (or the streak-day key)');
  for (const k of ['words', 'answers', 'answer', 'w']) if (k in ds) out.push(`${k}: a day set never carries a word — the server judges`);
  return out;
}
export const resumeKey = (date, uid) => `password:daily:${date}:${uid}`;

/** today's run shell for ONE player — the server fills it (judge.start → the record so far) */
export function create({ date, uid, now, daySet } = {}) {
  const bad = daySetProblems(daySet);
  if (bad.length) throw new Error(`password daily: ${bad.join(' · ')}`);
  if (date && String(date) !== String(daySet.day)) throw new Error('password daily: the day set is for another day');
  if (!uid || typeof now !== 'number') throw new Error('password daily: uid + now (the server clock) are required');
  const run = createRun({ day: daySet.day, uid, startedAt: now });
  return { ...run, matchId: `pw${String(daySet.day).replace(/\D/g, '')}`, participants: { [uid]: true }, phase: 'play', daily: { day: daySet.day, v: DAILY_V } };
}
/** the comparable result of a finished run (the module's rankings: the score first — lower is better — then the faster run) */
export const result = game => resultOf(game);
/** THE SERVER's replay: record = { g: { 0: [words], 1: [words] }, e } + the day's two answers (server-only) */
export const replay = (daySet, record, answers, { startedAt = 0 } = {}) => (daySetProblems(daySet).length ? null : replayRun(record, answers, { startedAt }));

/** THE PLUG-IN (docs/cartridge.md D2): on: false — the game never switches itself on */
export const daily = Object.freeze({ on: false, create, resumeKey, result, replay, problems: daySetProblems });
