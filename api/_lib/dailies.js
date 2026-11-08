// THE DAILIES on the server (PROGRESSION A — the daily contract, core/daily.js; DM1 — THE DAILY MODULE's engine): the cartridges the server
// knows, THE GO-LIVE SWITCH, THE 4 AM PICKER + the secret seed.
//
// PLUG-AND-PLAY (DM1): config.js#DAILIES is the list; SERVER_CARTS maps a row's id to its server cartridge (THE PASSWORD — pw.js, COAST CLEAR —
// cc.js). Adding a daily = its cartridge (client + server parts, docs/cartridge.md D2) + its row (+ its line in SERVER_CARTS, the cartridge's
// server half). Nothing else counts the dailies: THE SWEEP, the XP cap, `today`, the picker all read core/daily.js#todaysDailies.
//
// THE GO-LIVE SWITCH (DM1): progress/dailies = { on: true, at, by } (server-only — the rules' default deny), flipped by the owner only
// (/api/admin dailySwitch — audited). OFF (no node — the default, until THE SWITCH-OVER) → production registers NOTHING: every daily answers
// 404 no_daily. ON → the list's switched-on rows. DAILY_TEST=1 (the tests + `serve.mjs --emu`) opens them whatever the switch says, + THE FAKE
// DAILY (guess a number 0–999, the score = 1000 − how far off) + any test-registered daily (registerTestDaily) — never on the live site
// (Vercel has no DAILY_TEST).
import { createHmac } from 'node:crypto';
import { ref, val } from './fb.js';
import { dailySecret, clearSecretCache } from './daily-secret.js';
import { registerDaily, unregisterDaily, dailyOf, dailyIds, dailyRows, todaysDailies, addDailyRow, removeDailyRow } from '../../js/core/daily.js';
import { PW_DAILY } from './pw.js';
import { CC_DAILY } from './cc.js';

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
/** a row's id → its SERVER cartridge (the list's rows; the test ones join through registerTestDaily) */
export const SERVER_CARTS = { password: PW_DAILY, coastclear: CC_DAILY };
const TEST_CARTS = new Map();
const testing = () => process.env.DAILY_TEST === '1';

/** TEST-ONLY: a whole daily (its row + its cartridge) — refused outside DAILY_TEST=1 */
export function registerTestDaily(row, cart) {
  if (!testing()) throw new Error('registerTestDaily: DAILY_TEST=1 only');
  addDailyRow({ ...row, id: cart.id });
  TEST_CARTS.set(cart.id, cart);
  syncDailies(lastSwitch);
}
export function removeTestDaily(id) {
  TEST_CARTS.delete(id); removeDailyRow(id); unregisterDaily(id);
}

// ---- THE GO-LIVE SWITCH (cached ~30 s a warm function: a dig never waits on it)
export const SWITCH_PATH = 'progress/dailies';
const TTL_MS = 30_000;
let cache = null, lastSwitch = false;
export async function dailiesOn(now = Date.now()) {
  if (cache && now - cache.at >= 0 && now - cache.at < TTL_MS) return cache.on;
  const v = await val(SWITCH_PATH).catch(() => null);
  cache = { at: now, on: !!(v && v.on === true) };
  return cache.on;
}
export const clearSwitchCache = () => { cache = null; };
/** the owner's switch (the caller checks the admin role + audits) → { on, at, by } */
export async function setDailiesSwitch(on, by, now = Date.now()) {
  if (on) await ref(SWITCH_PATH).set({ on: true, at: now, by }); else await ref(SWITCH_PATH).remove();
  clearSwitchCache();
  return dailiesState(now);
}
export async function dailiesState(now = Date.now()) {
  const v = await val(SWITCH_PATH);
  return { on: !!(v && v.on === true), at: (v && v.at) || null, by: (v && v.by) || null, test: testing(), live: (await openDailies(now)) };
}

/** register exactly what should answer now: the list's switched-on rows (switch ON, or DAILY_TEST) + under DAILY_TEST the fake + the test ones */
export function syncDailies(live) {
  lastSwitch = !!live;
  const open = lastSwitch || testing();
  const want = new Map();
  for (const r of dailyRows()) {
    if (r.on === false) continue;
    const c = SERVER_CARTS[r.id] || (testing() ? TEST_CARTS.get(r.id) : null);
    if (c && open) want.set(r.id, c);
  }
  if (testing()) want.set(FAKE_DAILY.id, FAKE_DAILY);
  for (const id of dailyIds()) if (!want.has(id) && (id === FAKE_DAILY.id || SERVER_CARTS[id] || TEST_CARTS.has(id))) unregisterDaily(id);
  for (const [id, c] of want) { const had = dailyOf(id); if (!had || had.verify !== c.verify) registerDaily(c); }
  return todaysDailies();
}
/** the dailies that answer now (the switch read, cached) → their ids, in the list's order */
export async function openDailies(now = Date.now()) { return syncDailies(await dailiesOn(now)); }
/** the old sync entry (the tests): the env flag + the switch as last read */
export function loadDailies() { return syncDailies(lastSwitch); }

// ---- THE 4 AM PICKER (DM1): today's set FIXED for every live daily — each cartridge's `load(day)` builds its day from THE PEPPER (never the
// date) and stores it ONCE (THE PASSWORD's pair — pw.js#pwDay through THE FROZEN SCHEDULE; COAST CLEAR's board — cc-board.js#boardFor; both a
// transaction: two first calls at once keep one day). Lazy: the day's first start runs it for every daily (memo per warm function); idempotent.
const PICKED = new Map();
export async function pickDay(day, now = Date.now()) {
  const ids = todaysDailies();
  const key = `${day}|${ids.join(',')}`;
  if (!PICKED.has(key)) {
    // DFIX2 (FABLE REVIEW #2, finding 3 → Ben's decision 5): a day this instance has not seen reads THE DAILY SECRET afresh — a RESEED on the
    // admin function in the last minute before 4 am can't hand the new day the OLD key from this instance's 60 s cache (one extra read a day)
    clearSecretCache();
    const p = Promise.all(ids.map(id => { const c = dailyOf(id); return c && c.load ? c.load(day, now) : null; }))
      .then(() => ids, e => { PICKED.delete(key); throw e; });
    PICKED.set(key, p);
    for (const k of [...PICKED.keys()].slice(0, -4)) PICKED.delete(k);
  }
  return PICKED.get(key);
}
export const forgetPicks = () => PICKED.clear();

/** The day's seed for a daily: from THE DAILY SECRET (daily-secret.js — never the pepper), the same for everyone, unknowable before the server
 *  hands it out (async: the secret lives in the database) */
export const dailySeed = async (id, day) => parseInt(createHmac('sha256', String(await dailySecret(day))).update(`daily:${id}:${day}`).digest('hex').slice(0, 8), 16);
