// THE DAILY SECRET (DM1 ADD-ON — Ben, Nov 8: the dailies go ON while the repo is PUBLIC): the dailies' OWN server secret — NEVER the shared
// pepper (fb.js: the restore keys, the board ids, the flags, the logs). Every day's content comes from it: THE PASSWORD's word order (the
// frozen schedule — pw.js), COAST CLEAR's boards (cc-board.js), the plain seed (dailies.js#dailySeed). Rotating it can never break a tag, a
// key or anything else.
//
//   dsecret = { v: 1, k: { '<fromDay>': hex } }   server-only (the rules' default deny) — a key applies from its day ON; the base key sits at
//                                                 BASE_DAY. Base = the DAILY_SECRET env when set, else a random one made + stored at first use.
//   THE RESEED (reseedDailies — `node scripts/dailies-reseed.mjs`): a NEW key from the NEXT 4 am day on + THE PASSWORD's remaining schedule
//   reordered by it + any stored future day dropped — today's run, every past day and every result stay exactly as they were.
// Nothing here is ever a committed file (tests/daily-secrets.test.mjs).
import { randomBytes } from 'node:crypto';
import { ref, val } from './fb.js';
import { streakDay, dayNum, dayOf } from '../../js/core/streak.js';

export const SECRET_PATH = 'dsecret';
export const BASE_DAY = 'd00000000';
const TTL_MS = 60_000;
/** how far ahead a reseed looks for a stored day to drop */
const FUTURE_DAYS = 14;
let cache = null;
export const clearSecretCache = () => { cache = null; };

/** the key in force on `day` (PURE): the newest `from` ≤ day */
export function secretOf(keys, day) {
  let best = null, at = '';
  for (const [from, k] of Object.entries(keys || {})) if (from <= day && from >= at && k) { best = k; at = from; }
  return best;
}
/** every key (the base made once if there's none and no DAILY_SECRET) — cached ~60 s a warm function */
export async function dailyKeys(now = Date.now()) {
  if (cache && now - cache.at >= 0 && now - cache.at < TTL_MS) return cache.k;
  let rec = await val(SECRET_PATH);
  const env = (process.env.DAILY_SECRET || '').trim();
  if (!env && !(rec && rec.k && rec.k[BASE_DAY])) {
    const fresh = randomBytes(32).toString('hex');
    const tx = await ref(`${SECRET_PATH}/k/${BASE_DAY}`).transaction(cur => (cur ? undefined : fresh));
    rec = { v: 1, ...(rec || {}), k: { ...((rec && rec.k) || {}), [BASE_DAY]: tx.snapshot.val() || fresh } };
  }
  const k = { ...((rec && rec.k) || {}) };
  if (env) k[BASE_DAY] = env;
  cache = { at: now, k };
  return k;
}
/** the daily secret for a day (async: the database) */
export const dailySecret = async (day, now = Date.now()) => secretOf(await dailyKeys(now), day);

/**
 * THE RESEED: a new key from the NEXT streak day (the next 4 am Eastern) + THE PASSWORD's schedule after today reordered by it + every
 * stored day from then on dropped (none is built before its day — this only cleans up). Safe twice: a key already starting tomorrow →
 * nothing (unless `force`). `dryRun` → the plan, nothing written. → { changed, from, today, steps: [lines] }
 * `hooks` = { games: [daily ids — their stored future days dropped], schedule: async ({ today, from, key, dryRun }) → line | null } (pw.js
 * reorders its schedule — kept apart: no import cycle; scripts/dailies-reseed.mjs wires both)
 */
export async function reseedDailies({ now = Date.now(), dryRun = false, force = false, hooks = {} } = {}) {
  const today = streakDay(now), from = dayOf(dayNum(today) + 1);
  const keys = await dailyKeys(now);
  const steps = [];
  if (keys[from] && !force) return { changed: false, from, today, steps: [`already reseeded from ${from} (the next 4 am) — nothing to do (--force rotates again)`] };
  const key = randomBytes(32).toString('hex');
  steps.push(`a new daily secret from ${from} (the next 4 am Eastern) on — today (${today}) and every day before keep theirs`);
  // the stored days from `from` on (a future day is never built before its day; a test or a clock skew could have) — dropped
  const drop = {};
  await Promise.all((hooks.games || []).flatMap(g => Array.from({ length: FUTURE_DAYS }, (_, i) => dayOf(dayNum(from) + i)).map(async d => {
    const [b, s] = await Promise.all([val(`dly/${g}/${d}/b`), val(`dly/${g}/${d}/s`)]);
    if (b != null && !s) drop[`dly/${g}/${d}/b`] = null;
  })));
  if (Object.keys(drop).length) steps.push(`dropped ${Object.keys(drop).length} stored future day(s): ${Object.keys(drop).join(', ')}`);
  if (hooks.schedule) { const line = await hooks.schedule({ today, from, key, dryRun }); if (line) steps.push(line); }
  if (dryRun) return { changed: false, dryRun: true, from, today, steps };
  await ref('/').update({ [`${SECRET_PATH}/v`]: 1, [`${SECRET_PATH}/k/${from}`]: key, ...drop });
  clearSecretCache();
  return { changed: true, from, today, steps };
}
