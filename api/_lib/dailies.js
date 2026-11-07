// THE DAILIES on the server (PROGRESSION A — the daily contract, core/daily.js): the cartridges the server knows + the secret seed.
// THE PASSWORD (PW1, pw.js) is the first real one — behind DAILY_TEST until THE SWITCH-OVER; COAST CLEAR + the smallest OVERCLOCK come with
// their passes (each adds ONE import here).
// DAILY_TEST=1 (the tests + `serve.mjs --emu` runs) adds THE FAKE DAILY: guess a number 0–999, the score = 1000 − how far off — test-only,
// never on the live site (Vercel has no DAILY_TEST).
import { createHmac } from 'node:crypto';
import { fb } from './fb.js';
import { registerDaily, dailyOf } from '../../js/core/daily.js';
import { PW_DAILY } from './pw.js';

export const FAKE_DAILY = {
  id: 'test', name: 'THE TEST DAILY', better: 'high', buckets: 101,
  bucket: score => score / 10,
  target: seed => seed % 1000,
  verify(seed, result) {
    const g = Number(result && result.guess);
    if (!Number.isInteger(g) || g < 0 || g > 999) return null;
    return 1000 - Math.abs(g - (seed % 1000));
  },
};
/** The cartridges this server plays (read at call time — the env can be set after the import). */
export function loadDailies() {
  if (process.env.DAILY_TEST === '1' && !dailyOf('test')) registerDaily(FAKE_DAILY);
  // THE PASSWORD (PW1 — pw.js): a REAL daily, held behind the same flag until THE SWITCH-OVER (THE DAILY MODULE; the repo private first) —
  // production answers 'no_daily' for it
  if (process.env.DAILY_TEST === '1' && !dailyOf('password')) registerDaily(PW_DAILY);
}

/** The day's seed for a daily: secret (the pepper), the same for everyone, unknowable before the server hands it out. */
export const dailySeed = (id, day) => parseInt(createHmac('sha256', fb().pepper).update(`daily:${id}:${day}`).digest('hex').slice(0, 8), 16);
