// THE DAILY CONTRACT — the phone's side (PROGRESSION A; core/daily.js + api/daily.js). A daily cartridge calls these three; everything
// goes through /api (fetch + the ID token) — never a database socket (THE PARKED DATABASE: a solo daily wants nothing from firebase.js).
// Profiles are polish: with /api down a daily can still be PLAYED for fun, it just isn't official (start() throws, the cartridge says so).
import { api } from '../profile/api.js';

/** The day's official try: { day, seed, startedAt, done (a score if already finished today) }. The first call starts the clock. */
export const startDaily = game => api('daily', { action: 'start', game });
/** Hand in the result; the server checks it against the seed → { day, score, stand: { n, pct, top, band }, outcome: { streak, items } }. */
export const finishDaily = (game, result) => api('daily', { action: 'finish', game, result });
/** YOUR TABLE's TODAY: your scores + friends' (a tick until you've played that daily, then their score). */
export const dailyToday = (pids = []) => api('daily', { action: 'today', pids });
