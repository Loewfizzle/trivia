// THE DAILIES' RETRY RULE (PURE — no DOM: the unit tests + every daily share it)
/** an error worth another try (no signal, the server's own trouble) — never a refusal */
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
