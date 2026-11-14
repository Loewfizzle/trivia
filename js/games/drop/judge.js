// THE DROP — THE JUDGE on the phone (THE DROP A): THE DAILY KIT's judge (js/daily/judge.js) with THE DROP's moves. Every upload carries the
// run's LOG CHUNK (from the run's driver — view.js binds it): { at (the offset), add (the chunk), k (the tick it reaches), fin? }.
//   judge.start() → { startedAt, done, run: { seed, go, k, len, log, pm, pa, kd, left, ml, e?, refresh? }, day, now }
//   judge.checkpoint(body) · judge.ppause(body) (a PLAYER pause — one of 3) · judge.pause(room) (THE ROOM WINS — the chunk added) · judge.resume()
//   judge.finish() → { score, stand, outcome, counted }
import { createDailyJudge } from '../../daily/judge.js';

export const GAME_ID = 'drop';
export function createApiJudge() {
  let drv = null;
  const j = createDailyJudge(GAME_ID, { moves: {
    checkpoint: body => body,
    ppause: body => body,
    pause: room => ({ ...(drv && drv.chunk ? drv.chunk() : {}), ...(room ? { room } : {}) }),
    resume: () => ({}),
  } });
  /** the run's driver (view.js) — THE ROOM WINS' pause carries its freshest chunk */
  j.bind = d => { drv = d; };
  return j;
}
