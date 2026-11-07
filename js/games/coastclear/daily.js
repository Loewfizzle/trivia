// COAST CLEAR — THE DAILY PLUG-IN (CC1 — docs/cartridge.md D2 "THE DAILY PLUG-IN", docs/coastclear.md). SHIPS OFF: THE DAILY MODULE (later)
// opens it once a day, owns the banner, the pause + the RESUME chip, the rankings and the streak hooks. PURE.
//
// COAST CLEAR is SERVER-JUDGED: its day set carries NO board — { v: 1, day } is all a phone gets (the board lives only on the server,
// dly/coastclear/{day}/b — api/_lib/cc-board.js — and reaches a phone one opened cell at a time through the dig / chord actions). So create()
// builds an EMPTY run shell for the day; the view fills it from judge.start() (the opening + the server's record — a resume) and every answer.
//   create({ date, uid, now, daySet }) → the game (a run shell: { id, matchId, day, uid, startedAt: now, participants, phase: 'play', run })
//   resumeKey(date, uid)               → the one key a day's try lives under (a refresh / an app switch RESUMES — the server holds the record)
//   result(game)                        → { score, time, rank } of a finished run (null while it runs) — ONE comparable number (lower = better)
//   replay(daySet, record, board)       → THE SERVER's check: the stored moves replayed on the day's board → the same result, or null
//   problems(daySet)                    → what's wrong with a day set ([] = fine)
import { emptyView, replay as replayRun, scoreOf, MAX_SPOTS } from './logic.js';

export const DAILY_V = 1;
const DAY_RE = /^(\d{4}-\d{2}-\d{2}|d\d{8})$/;

export function daySetProblems(ds) {
  const out = [];
  if (!ds || typeof ds !== 'object') return ['no day set'];
  if (ds.v !== DAILY_V) out.push(`v must be ${DAILY_V}`);
  if (!DAY_RE.test(String(ds.day || ''))) out.push('day must be YYYY-MM-DD (or the streak-day key)');
  for (const k of ['board', 'lights', 'counts', 'mines', 'l', 'seed']) if (k in ds) out.push(`${k}: a day set never carries the board — the server keeps it`);
  return out;
}
export const resumeKey = (date, uid) => `coastclear:daily:${date}:${uid}`;

/** today's run shell for ONE player — the server fills it (judge.start → the opening + the record so far) */
export function create({ date, uid, now, daySet } = {}) {
  const bad = daySetProblems(daySet);
  if (bad.length) throw new Error(`coastclear daily: ${bad.join(' · ')}`);
  if (date && String(date) !== String(daySet.day)) throw new Error('coastclear daily: the day set is for another day');
  if (!uid || typeof now !== 'number') throw new Error('coastclear daily: uid + now (the server clock) are required');
  return {
    id: 'coastclear', matchId: `cc${String(daySet.day).replace(/\D/g, '')}`, day: daySet.day, uid, startedAt: now,
    participants: { [uid]: true }, phase: 'play', run: emptyView({ startedAt: now }), daily: { day: daySet.day, v: DAILY_V },
  };
}
/** the comparable result of a finished run, from the phone's view (the module's rankings — the server's own replay is the record) */
export function result(game) {
  const v = game && game.run;
  if (!v || !v.done || !v.finishedAt) return null;
  const ms = v.finishedAt - v.startedAt - (v.pausedMs || 0);
  const safeLeft = v.w * v.h - v.lights - v.open.length;
  const score = scoreOf({ out: v.out, ms, spots: Math.min(MAX_SPOTS, v.spots), pauses: v.pauses, safeLeft });
  return { score, time: ms, rank: null };
}
/** THE SERVER's replay: the record's moves on the day's board (server-only) */
export const replay = (daySet, record, board) => (daySetProblems(daySet).length ? null : replayRun(record, board));

/** THE PLUG-IN (docs/cartridge.md D2): on: false — the game never switches itself on */
export const daily = Object.freeze({ on: false, create, resumeKey, result, replay, problems: daySetProblems });
