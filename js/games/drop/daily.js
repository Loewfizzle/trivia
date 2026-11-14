// THE DROP — THE DAILY PLUG-IN (THE DROP A — docs/cartridge.md D2). SHIPS OFF. PURE. THE DROP is SERVER-REPLAYED: its day set carries no
// pieces ({ v: 1, day } — the day's seed comes from judge.start(), from THE DAILY SECRET); the phone plays the run (drop.js) and uploads its log.
//   create({ date, uid, now, daySet }) → the run shell (the view fills it from judge.start — the seed + the run so far)
//   resumeKey(date, uid)               → the one key a day's try lives under (a refresh RESUMES at the latest checkpoint — one of the 3 pauses)
//   result(game)                       → { score } of a finished run (null while it runs) — the server's replay is the record
export const DAILY_V = 1;
const DAY_RE = /^(\d{4}-\d{2}-\d{2}|d\d{8})$/;
export function daySetProblems(ds) {
  const out = [];
  if (!ds || typeof ds !== 'object') return ['no day set'];
  if (ds.v !== DAILY_V) out.push(`v must be ${DAILY_V}`);
  if (!DAY_RE.test(String(ds.day || ''))) out.push('day must be YYYY-MM-DD (or the streak-day key)');
  for (const k of ['seed', 'pieces', 'rows']) if (k in ds) out.push(`${k}: a day set never carries the day — the server hands the seed at the start`);
  return out;
}
export const resumeKey = (date, uid) => `drop:daily:${date}:${uid}`;
export function create({ date, uid, now, daySet } = {}) {
  const bad = daySetProblems(daySet);
  if (bad.length) throw new Error(`drop daily: ${bad.join(' · ')}`);
  if (date && String(date) !== String(daySet.day)) throw new Error('drop daily: the day set is for another day');
  if (!uid || typeof now !== 'number') throw new Error('drop daily: uid + now are required');
  return { id: 'drop', matchId: `dr${String(daySet.day).replace(/\D/g, '')}`, day: daySet.day, uid, startedAt: now, participants: { [uid]: true }, phase: 'play', run: null, daily: { day: daySet.day, v: DAILY_V } };
}
export function result(game) {
  const r = game && game.run;
  return r && r.score != null ? { score: r.score } : null;
}
export const daily = { on: false, create, resumeKey, result, problems: daySetProblems };
