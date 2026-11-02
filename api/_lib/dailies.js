// THE DAILIES on the server (PROGRESSION A — the daily contract, core/daily.js): the cartridges the server knows + the secret seed.
// No real daily exists yet (the WORDLE-type, COAST CLEAR, the smallest OVERCLOCK come with their passes — each adds ONE import here).
// DAILY_TEST=1 (the tests + `serve.mjs --emu` runs) adds THE FAKE DAILY: guess a number 0–999, the score = 1000 − how far off — test-only,
// never on the live site (Vercel has no DAILY_TEST).
import { createHmac } from 'node:crypto';
import { fb } from './fb.js';
import { registerDaily, dailyOf } from '../../js/core/daily.js';

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
}

/** The day's seed for a daily: secret (the pepper), the same for everyone, unknowable before the server hands it out. */
export const dailySeed = (id, day) => parseInt(createHmac('sha256', fb().pepper).update(`daily:${id}:${day}`).digest('hex').slice(0, 8), 16);
