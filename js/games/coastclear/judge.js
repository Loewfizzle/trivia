// COAST CLEAR — THE JUDGE on the phone (CC1 — docs/coastclear.md "The server flow"): every cell's content comes from /api/daily
// (api/_lib/cc.js) — the phone never holds a cell it hasn't opened. ONE shape the view talks to, so the preview (a local fake with a fixed
// test board) and the real game plug in alike:
//   judge.start()               → { startedAt, done (a score, once today's run is finished), run (the opening + the run so far), day, now }
//   judge.dig(cell)             → { cells: [[cell, n]…], lit: [cell…], spots, done, out?, finishedAt?, already?, now }
//   judge.chord(cell, buoys)    → the same shape (the phone's buoys around that number)
//   judge.pause() / resume()    → { paused, pauses, pausedMs }   (THE DAILY MODULE calls pause — the room started a game mid-run)
//   judge.finish()              → { score, stand, outcome }       (the server scores from ITS record; a retry gets the stored score back)
// Everything goes through js/profile/api.js (fetch + the ID token — no database socket: THE PARKED DATABASE never wakes for a daily).
import { createDailyJudge } from '../../daily/judge.js';

export const GAME_ID = 'coastclear';
/** (DM1: on THE DAILY KIT's judge — js/daily/judge.js; `pause(room)` names the room that started a game — THE ROOM WINS, checked on the server) */
export function createApiJudge() {
  return createDailyJudge(GAME_ID, { moves: {
    dig: cell => ({ cell }),
    chord: (cell, buoys) => ({ cell, buoys }),
    pause: room => (room ? { room } : {}),
    resume: () => ({}),
  } });
}
