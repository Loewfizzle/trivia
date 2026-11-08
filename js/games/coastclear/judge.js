// COAST CLEAR — THE JUDGE on the phone (CC1 — docs/coastclear.md "The server flow"): every cell's content comes from /api/daily
// (api/_lib/cc.js) — the phone never holds a cell it hasn't opened. ONE shape the view talks to, so the preview (a local fake with a fixed
// test board) and the real game plug in alike:
//   judge.start()               → { startedAt, done (a score, once today's run is finished), run (the opening + the run so far), day, now }
//   judge.dig(cell)             → { cells: [[cell, n]…], lit: [cell…], spots, done, out?, finishedAt?, already?, now }
//   judge.chord(cell, buoys)    → the same shape (the phone's buoys around that number)
//   judge.pause() / resume()    → { paused, pauses, pausedMs }   (THE DAILY MODULE calls pause — the room started a game mid-run)
//   judge.finish()              → { score, stand, outcome }       (the server scores from ITS record; a retry gets the stored score back)
// Everything goes through js/profile/api.js (fetch + the ID token — no database socket: THE PARKED DATABASE never wakes for a daily).
import { api } from '../../profile/api.js';
import { runDay } from '../../daily/run-day.js';

export const GAME_ID = 'coastclear';
export function createApiJudge() {
  const rd = runDay(GAME_ID);   // (DFIX1 — every call names the run's own day: a run that crosses 4 am Eastern finishes on its day)
  const call = (action, extra) => api('daily', rd.with({ action, game: GAME_ID, ...extra }));
  return {
    kind: 'api',
    async start() {
      const asked = rd.asked();
      const r = await api('daily', { action: 'start', game: GAME_ID, ...(asked ? { day: asked } : {}) });
      rd.started(r);
      return { startedAt: r.startedAt, done: r.done, run: r.run, day: r.day, now: r.now };
    },
    dig: cell => call('dig', { cell }),
    chord: (cell, buoys) => call('chord', { cell, buoys }),
    pause: () => call('pause'),
    resume: () => call('resume'),
    finish: async () => { const r = await call('finish', { result: null }); rd.scored(); return r; },
  };
}
