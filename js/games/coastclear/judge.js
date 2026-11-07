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

export const GAME_ID = 'coastclear';
export function createApiJudge() {
  const call = (action, extra) => api('daily', { action, game: GAME_ID, ...extra });
  return {
    kind: 'api',
    async start() { const r = await call('start'); return { startedAt: r.startedAt, done: r.done, run: r.run, day: r.day, now: r.now }; },
    dig: cell => call('dig', { cell }),
    chord: (cell, buoys) => call('chord', { cell, buoys }),
    pause: () => call('pause'),
    resume: () => call('resume'),
    finish: () => call('finish', { result: null }),
  };
}
