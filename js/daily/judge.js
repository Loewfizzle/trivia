// THE DAILY KIT — THE JUDGE on the phone (DM1 — FABLE REVIEW #1, 10): ONE factory for a SERVER-JUDGED daily's calls (THE PASSWORD, COAST
// CLEAR): start (the run's own day asked for — DFIX1, js/daily/run-day.js), its moves (each carries the run's day), finish (then the next start
// opens today's). Everything goes through js/profile/api.js (fetch + the ID token — no database socket: THE PARKED DATABASE never wakes).
//   const j = createDailyJudge('coastclear', { moves: { dig: cell => ({ cell }), pause: () => ({}) } })
//   j.start() → { startedAt, done, run, day, now } · j.dig(cell) → the server's answer · j.finish() → { score, stand, outcome, counted }
import { api } from '../profile/api.js';
import { runDay } from './run-day.js';

export function createDailyJudge(game, { moves = {} } = {}) {
  const rd = runDay(game);
  const call = (action, extra) => api('daily', rd.with({ action, game, ...extra }));
  const judge = {
    kind: 'api',
    game,
    async start() {
      const asked = rd.asked();
      const r = await api('daily', { action: 'start', game, ...(asked ? { day: asked } : {}) });
      rd.started(r);
      return { startedAt: r.startedAt, done: r.done, run: r.run, day: r.day, now: r.now };
    },
    async finish() { const r = await call('finish', { result: null }); rd.scored(); return r; },
  };
  // (THE DROP A: a move body may ask for `$ka` — sent with keepalive, so it lands though the page is going: THE DROP's checkpoint on pagehide)
  for (const [name, body] of Object.entries(moves)) judge[name] = (...a) => {
    const b = { ...(body(...a) || {}) }, ka = !!b.$ka;
    delete b.$ka;
    return ka ? api('daily', rd.with({ action: name, game, ...b }), { keepalive: true }) : call(name, b);
  };
  return judge;
}
