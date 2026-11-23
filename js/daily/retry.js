// THE DAILIES' RETRY RULE (PURE — no DOM: the unit tests + every daily share it)
/** an error worth another try (no signal, the server's own trouble) — never a refusal */
/** THE ROOM WINS, told truthfully (VARIETY B2's cloud fix — the owner): the server refused a clocked daily's pause (a party of brand-new profiles,
 *  the pause caps) → its clock IS running through the match: the screen must not go on saying SAVED. '' = nothing to correct */
export const ROOM_CLOCK_RUNS = 'YOUR DAILY’S CLOCK IS STILL RUNNING';
const CLOCK_DAILIES = new Set(['coastclear', 'drop']), NO_PAUSE = new Set(['no_room_game', 'pause_limit', 'room_used']);
export const refusedLine = (id, res) => (CLOCK_DAILIES.has(id) && !!res && !res.ok && !!res.error && NO_PAUSE.has(res.error.code) ? ROOM_CLOCK_RUNS : '');
export const retryable = e => !e || e.status === 0 || e.status >= 500 || e.code === 'offline' || e.code === 'http';

/**
 * FR7 FIXES A — DY5: a call worth retrying while `alive()` (THE ROOM WINS' pause: while that room still plays) — backed off 1, 2, 4 … 30 s, up
 * to `tries`; a refusal (not retryable) ends it at once → { ok, resp }. `wait` is injectable (tests).
 */
export async function retryWhile(call, { alive = () => true, tries = 12, wait = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  for (let t = 0; t < tries && alive(); t++) {
    try { return { ok: true, resp: await call() }; } catch (e) {
      if (!retryable(e)) return { ok: false, resp: null, error: e };
      await wait(Math.min(30_000, 1000 * 2 ** t));
    }
  }
  return { ok: false, resp: null };
}
