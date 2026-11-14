// THE DAILIES on the server (PROGRESSION A — the daily contract, core/daily.js; DM1 — THE DAILY MODULE's engine): the cartridges the server
// knows, THE GO-LIVE SWITCH, THE 4 AM PICKER + the secret seed.
//
// PLUG-AND-PLAY (DM1): config.js#DAILIES is the list; SERVER_CARTS maps a row's id to its server cartridge (THE PASSWORD — pw.js, COAST CLEAR —
// cc.js, THE DROP — drop.js). Adding a daily = its cartridge (client + server parts, docs/cartridge.md D2) + its row (+ its line in SERVER_CARTS, the cartridge's
// server half). Nothing else counts the dailies: THE SWEEP, the XP cap, `today`, the picker all read core/daily.js#todaysDailies.
//
// THE GO-LIVE SWITCH (DM1): progress/dailies = { on: true, at, by } (server-only — the rules' default deny), flipped by the owner only
// (/api/admin dailySwitch — audited). OFF (no node — the default, until THE SWITCH-OVER) → production registers NOTHING: every daily answers
// 404 no_daily. ON → the list's switched-on rows. DAILY_TEST=1 (the tests + `serve.mjs --emu`) opens them whatever the switch says, + THE FAKE
// DAILY (guess a number 0–999, the score = 1000 − how far off) + any test-registered daily (registerTestDaily) — never on the live site
// (Vercel has no DAILY_TEST).
//
// THE DROP B — THE SCHEDULED GO-LIVE (Ben, Nov 13 — he won't stay up for 4 am): a row that ships OFF (`on: false`) opens from a DAY the owner
// schedules — progress/dlive/{id} = { from: <the next streak day>, at, by } (server-only; /api/admin dailySchedule, audited). It opens AT that
// day's 4 am turn, never mid-day (the day key decides, read on every call — the 30 s cache only holds the schedule itself), cancellable only
// before then; plug-and-play for any daily, no code edit or deploy. THE SWEEP / PERFECT WEEK / the XP cap of a day read THAT day's set
// (liveFor(day) — a run that crossed 4 am keeps the set of ITS day).
import { createHmac } from 'node:crypto';
import { ref, val } from './fb.js';
import { dailySecret, clearSecretCache } from './daily-secret.js';
import { registerDaily, unregisterDaily, dailyOf, dailyIds, dailyRows, dailyRow, todaysDailies, addDailyRow, removeDailyRow, rowOpenOn, nextLiveDay } from '../../js/core/daily.js';
import { streakDay } from '../../js/core/streak.js';
import { PW_DAILY } from './pw.js';
import { CC_DAILY } from './cc.js';
import { DROP_DAILY } from './drop.js';

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
export const SERVER_CARTS = { password: PW_DAILY, coastclear: CC_DAILY, drop: DROP_DAILY };   // (THE DROP A: its row ships `on: false`)
const TEST_CARTS = new Map();
const testing = () => process.env.DAILY_TEST === '1';

/** TEST-ONLY: a whole daily (its row + its cartridge) — refused outside DAILY_TEST=1 */
export function registerTestDaily(row, cart) {
  if (!testing()) throw new Error('registerTestDaily: DAILY_TEST=1 only');
  addDailyRow({ ...row, id: cart.id });
  TEST_CARTS.set(cart.id, cart);
  syncDailies(lastSwitch, lastSched, lastDay);
}
export function removeTestDaily(id) {
  TEST_CARTS.delete(id); removeDailyRow(id); unregisterDaily(id);
}

// ---- THE GO-LIVE SWITCH + THE SCHEDULED GO-LIVE (cached ~30 s a warm function: a dig never waits on them)
export const SWITCH_PATH = 'progress/dailies';
export const SCHED_PATH = 'progress/dlive';
const TTL_MS = 30_000;
const DAY_KEY = /^d\d{8}$/;
let cache = null, lastSwitch = false, lastSched = {}, lastDay = null;
/** the schedule as stored → { id: { from } } (a malformed entry dropped) */
export function cleanSched(v) {
  const out = {};
  for (const [id, x] of Object.entries(v || {})) if (/^[a-z0-9-]{2,16}$/.test(id) && x && DAY_KEY.test(String(x.from || ''))) out[id] = { from: String(x.from), at: Number(x.at) || null, by: x.by || null };
  return out;
}
async function readState(now) {
  if (cache && now - cache.at >= 0 && now - cache.at < TTL_MS) return cache;
  const [v, sc] = await Promise.all([val(SWITCH_PATH).catch(() => null), val(SCHED_PATH).catch(() => null)]);
  cache = { at: now, on: !!(v && v.on === true), sched: cleanSched(sc) };
  return cache;
}
export async function dailiesOn(now = Date.now()) { return (await readState(now)).on; }
export const clearSwitchCache = () => { cache = null; };
/** the scheduled go-lives (cached with the switch) → { id: { from, at, by } } */
export async function dailySchedule(now = Date.now()) { return (await readState(now)).sched; }
/**
 * THE DROP B — schedule a daily's go-live at THE NEXT 4 AM (the caller checks the owner + audits): `from` = the next streak day. Refused for a
 * row that isn't OFF (already in the set) or unknown, and for a daily already live (from ≤ today). cancel = remove it — only BEFORE its day.
 * → the dailies' state
 */
export async function scheduleDaily(id, { cancel = false, by = null, now = Date.now() } = {}) {
  const row = dailyRow(id);
  if (!row || (row.test && !testing())) { const e = new Error('no_daily'); e.code = 'no_daily'; throw e; }
  if (row.on !== false) { const e = new Error('always_on'); e.code = 'always_on'; throw e; }
  const today = streakDay(now), cur = cleanSched(await val(SCHED_PATH))[id] || null;
  if (cur && cur.from <= today) { const e = new Error('already_live'); e.code = 'already_live'; throw e; }
  if (cancel) await ref(`${SCHED_PATH}/${id}`).remove();
  else await ref(`${SCHED_PATH}/${id}`).set({ from: nextLiveDay(now), at: now, by });
  clearSwitchCache();
  return dailiesState(now);
}
/** the owner's switch (the caller checks the admin role + audits) → { on, at, by } */
export async function setDailiesSwitch(on, by, now = Date.now()) {
  if (on) await ref(SWITCH_PATH).set({ on: true, at: now, by }); else await ref(SWITCH_PATH).remove();
  clearSwitchCache();
  return dailiesState(now);
}
export async function dailiesState(now = Date.now()) {
  clearSwitchCache();
  const v = await val(SWITCH_PATH);
  const live = await openDailies(now), sched = await dailySchedule(now), today = streakDay(now);
  // (THE DROP B: each row's go-live — 'live' (in the set from today) · 'scheduled' (+ its `from`) · 'off' — for /admin's rows)
  const rows = dailyRows().filter(r => !r.test || testing()).map(r => {
    const sc = sched[r.id] || null;
    const state = r.on !== false ? 'live' : sc && sc.from <= today ? 'live' : sc ? 'scheduled' : 'off';
    return { id: r.id, name: r.name, state, always: r.on !== false, ...(sc ? { from: sc.from } : {}) };
  });
  return { on: !!(v && v.on === true), at: (v && v.at) || null, by: (v && v.by) || null, test: testing(), live, today, next: nextLiveDay(now), rows };
}

/** the emulators' own opener: the OFF rows DAILY_TEST_OFF names (the tests + e2e-drop) — open on every day */
const testOff = id => testing() && String(process.env.DAILY_TEST_OFF || '').split(',').includes(id);
/** register exactly what should answer now: the list's switched-on rows + the OFF rows scheduled live by `day` (switch ON, or DAILY_TEST) +
 *  under DAILY_TEST the fake + the test ones */
export function syncDailies(live, sched = lastSched, day = lastDay) {
  lastSwitch = !!live; lastSched = sched || {}; lastDay = day || null;
  const open = lastSwitch || testing();
  const want = new Map();
  for (const r of dailyRows()) {
    // (THE DROP A: a row that ships OFF is never opened — THE DROP B: unless THE SCHEDULED GO-LIVE has reached its day; on the emulators the
    //  ids DAILY_TEST_OFF names too)
    if (!testOff(r.id) && !rowOpenOn(r, lastSched[r.id], lastDay)) continue;
    const c = SERVER_CARTS[r.id] || (testing() ? TEST_CARTS.get(r.id) : null);
    if (c && open) want.set(r.id, c);
  }
  if (testing()) want.set(FAKE_DAILY.id, FAKE_DAILY);
  for (const id of dailyIds()) if (!want.has(id) && (id === FAKE_DAILY.id || SERVER_CARTS[id] || TEST_CARTS.has(id))) unregisterDaily(id);
  for (const [id, c] of want) { const had = dailyOf(id); if (!had || had.verify !== c.verify) registerDaily(c); }
  return todaysDailies();
}
/** the dailies that answer now (the switch + the schedule read, cached; the day from the clock) → their ids, in the list's order */
export async function openDailies(now = Date.now()) { const st = await readState(now); return syncDailies(st.on, st.sched, streakDay(now)); }
/** the old sync entry (the tests): the env flag + the switch as last read */
export function loadDailies() { return syncDailies(lastSwitch, lastSched, lastDay); }
/** THE DROP B — the set a GIVEN day had (THE SWEEP, the XP cap, PERFECT WEEK of that day — a run that crossed 4 am keeps ITS day's set): the
 *  live dailies minus a scheduled row whose day had not come yet (call after openDailies) */
export function liveFor(day) {
  return todaysDailies().filter(id => { const r = dailyRow(id); return !r || testOff(id) || rowOpenOn(r, lastSched[id], day); });
}

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
