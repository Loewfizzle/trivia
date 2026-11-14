// THE DAILY CONTRACT (PROGRESSION A), PURE — how a DAILY plugs into the console (PLUG AND PLAY: a cartridge says only how it talks to it).
// The dailies themselves come later (the WORDLE-type, COAST CLEAR, the smallest OVERCLOCK — before launch); this is the slot + the rules:
//   · the DAY = the streak's day (4 am Eastern); the SEED is made on the server from a secret (the puzzle never reaches a phone early)
//   · ONE OFFICIAL TRY per player per day (START is recorded; a refresh continues the same try, its clock still running)
//   · the score is CHECKED on the server (the cartridge's `verify` replays the result against the seed) and stored there only
//   · → the day's PERCENTILE ("better than 72 % today") + the BANDS (PENTHOUSE top 1 % · VIP ROOM 10 % · LOUNGE 25 % · BAR 50 % · FLOOR),
//     the bands shown only from ~50 finishers; YOUR TABLE's TODAY (BOARD 2.0 shows it — friends' scores hidden until you've played)
//   · a daily keeps THE STREAK like a match; no database socket for a solo daily (THE PARKED DATABASE — /api only)
//
// A CARTRIDGE: { id, name, better: 'high' | 'low', buckets (the histogram's size), bucket(score) → 0…buckets−1, verify(seed, result,
//   { startedAt, now }) → a score (a finite number) | null (refused) }. Register with registerDaily(); the server lists its cartridges in
//   api/_lib/dailies.js (+ a TEST-ONLY fake behind DAILY_TEST=1).
import { DAILIES } from '../config.js';
import { streakDay, dayNum, dayOf } from './streak.js';

export const BAND_MIN = 50;
export const BANDS = [
  { id: 'penthouse', name: 'PENTHOUSE', top: 1 },
  { id: 'vip', name: 'VIP ROOM', top: 10 },
  { id: 'lounge', name: 'LOUNGE', top: 25 },
  { id: 'bar', name: 'BAR', top: 50 },
  { id: 'floor', name: 'FLOOR', top: 100 },
];

// ------------------------------------------------------------------ THE LIST (DM1 — PLUG-AND-PLAY: no fixed count anywhere)
// ONE registry the server + the phone share: config.js#DAILIES (each row: id · name · order · ticket (its ticket art key) · lesson (a first-time
// lesson — DFIX3's one-time hint, the cartridge's HINT line) · on (in the set)) + the TEST-ONLY rows a test adds (addDailyRow). Adding a daily = its cartridge (D2) + one row.
//   dailyRows()     → every row, in order (the phone's picker, the TODAY rows, the SCORES tabs — DM2)
//   listedDailies() → the rows switched on (`on` !== false)
//   todaysDailies() → the dailies LIVE on this server: the registered cartridges, in the list's order (the server registers exactly the list's
//                     switched-on rows while THE GO-LIVE SWITCH is on, + under DAILY_TEST=1 the test ones — api/_lib/dailies.js#openDailies).
//                     THE SWEEP, the daily XP cap, the 4 am picker and `today` all read it.
const EXTRA = new Map();
/** a TEST-ONLY row (the server takes one only under DAILY_TEST=1 — api/_lib/dailies.js#registerTestDaily) */
export function addDailyRow(row) {
  if (!row || !/^[a-z0-9-]{2,16}$/.test(row.id)) throw new Error('bad daily row');
  EXTRA.set(row.id, { name: row.id.toUpperCase(), order: 90, ticket: row.id, lesson: false, on: true, test: true, ...row });
  return EXTRA.get(row.id);
}
export const removeDailyRow = id => EXTRA.delete(id);
const ord = r => (r && Number.isFinite(r.order) ? r.order : 99);
export const dailyRows = () => [...DAILIES, ...EXTRA.values()].sort((a, b) => ord(a) - ord(b));
export const dailyRow = id => dailyRows().find(r => r.id === String(id)) || null;
export const listedDailies = () => dailyRows().filter(r => r.on !== false).map(r => r.id);
/** THE DROP B — THE SCHEDULED GO-LIVE (PURE): is a row in the set on `day`? An ON row always; an OFF row only from its scheduled day
 *  (sched = { from: 'dYYYYMMDD' } — api/_lib/dailies.js reads progress/dlive) — whole days: a day key is compared, never a time */
export function rowOpenOn(row, sched, day) {
  if (!row) return false;
  if (row.on !== false) return true;
  return !!(sched && /^d\d{8}$/.test(String(sched.from || '')) && /^d\d{8}$/.test(String(day || '')) && String(day) >= String(sched.from));
}
/** the next 4 am turn's day key (the day a GO LIVE AT THE NEXT 4 AM opens on) — from any time of today (never today itself) */
export const nextLiveDay = now => dayOf(dayNum(streakDay(now)) + 1);

/** DM2 — PENTHOUSE (the owner, Step 0): the top 1 % of a daily's COUNTING finishers that day by PLACE — rank ≤ max(1, floor(n × 1 %)) — and
 *  only once the day has BAND_MIN (50) counting finishers (dormant below). rank = 1-based (1 + the finishers strictly better). */
export const penthouseCut = n => Math.max(1, Math.floor(n / 100));
export const isPenthouse = (rank, n) => n >= BAND_MIN && rank >= 1 && rank <= penthouseCut(n);
/**
 * DFIX2 — PENTHOUSE at THE DAY'S CLOSE (FABLE REVIEW #2, finding 2 → Ben's decision 2): the winners among a day's FINAL counting finishers
 * — scores = { pid: score } (the non-counting ones already left out), better = 'high' | 'low'. Rank = 1 + the finishers strictly better;
 * every finisher at or inside the cut wins (a tie AT the cutoff: all of them). Nobody below BAND_MIN finishers. → [pid…] sorted.
 */
export function penthouseWinners(scores, better = 'high') {
  const rows = Object.entries(scores || {}).filter(([, v]) => typeof v === 'number' && Number.isFinite(v));
  const n = rows.length;
  if (n < BAND_MIN) return [];
  const cut = penthouseCut(n), sign = better === 'low' ? 1 : -1;
  rows.sort((a, b) => sign * (a[1] - b[1]));
  const out = [];
  let place = 0, prev = null;
  rows.forEach(([pid, v], i) => { if (prev === null || v !== prev) { place = i + 1; prev = v; } if (place <= cut) out.push(pid); });
  return out.sort();
}
/** DM2 — THE SWEEP BONUS: +10 XP on the day every daily is finished (on top of DAILY_XP each), once a day, counted results only */
export const SWEEP_XP = 10;
/** DM2 — PERFECT WEEK: THE SWEEP on this many daily-days IN A ROW (any 7 consecutive — never a weekday rule) */
export const PERFECT_RUN = 7;

/** THE SWEEP: every one of today's dailies finished (dayG = { game: 1 } — the day's COUNTED finishes); an empty list never sweeps */
export const sweptDay = (dayG, today) => Array.isArray(today) && today.length > 0 && today.every(id => !!(dayG && dayG[id]));
/** THE DAILY XP (DM1): a small XP per finished daily — the solo lane's size (ranks.js#SOLO_XP = 15: never more than a match played) — capped at
 *  ONE credit per daily on today's list (credited = the day's credits so far) */
export const DAILY_XP = 15;
export function dailyXp(credited, today) {
  const cap = Math.max(1, Array.isArray(today) ? today.length : 1);
  const v = (credited || 0) < cap ? DAILY_XP : 0;
  return { total: v, cap, parts: [{ k: 'daily', label: v ? 'DAILY' : 'DAILY · TODAY’S XP DONE', v }] };
}

const CARTS = new Map();
export function registerDaily(c) {
  if (!c || !/^[a-z0-9-]{2,16}$/.test(c.id) || typeof c.verify !== 'function' || typeof c.bucket !== 'function' || !(c.buckets > 0)) throw new Error('bad daily cartridge');
  CARTS.set(c.id, { better: 'high', ...c });
  return c;
}
export const dailyOf = id => CARTS.get(String(id)) || null;
export const dailyIds = () => [...CARTS.keys()];
/** the LIVE dailies, in the list's order (a cartridge with no row — a unit test's — after the rows) */
export function todaysDailies() {
  const at = new Map(dailyRows().map((r, i) => [r.id, i]));
  const pos = id => (at.has(id) ? at.get(id) : 1e3);
  return dailyIds().sort((a, b) => pos(a) - pos(b) || (a < b ? -1 : 1));
}
export const unregisterDaily = id => CARTS.delete(id);

/** The bucket a score falls in (clamped). */
export const bucketOf = (cart, score) => Math.max(0, Math.min(cart.buckets - 1, Math.floor(cart.bucket(score))));

/**
 * Where a score stands among the day's finishers. hist = { bucket: count } (INCLUDING this score), n = finishers (including it).
 * Buckets are ordered low → high score; for a 'low' daily (fewer is better) the order flips.
 * → { n, better, worse, pct (0–100: the share of the OTHER finishers you beat), top (your place from the top, as a % of n), band | null }
 */
export function standing(cart, hist, n, score) {
  const b = bucketOf(cart, score);
  let above = 0, below = 0;
  for (const [k, c] of Object.entries(hist || {})) {
    const kb = Number(k);
    if (kb > b) above += c; else if (kb < b) below += c;
  }
  const better = cart.better === 'low' ? below : above, worse = cart.better === 'low' ? above : below;
  const pct = n <= 1 ? 100 : Math.round((100 * worse) / (n - 1));
  const top = Math.max(0, Math.min(100, (100 * (better + 1)) / Math.max(1, n)));
  return { n, better, worse, pct, top, band: n >= BAND_MIN ? bandFor(top) : null };
}
export const bandFor = top => BANDS.find(b => top <= b.top) || BANDS[BANDS.length - 1];

/** YOUR TABLE's TODAY for one friend: their score only once YOU have finished that daily (before, a tick). */
export function todayView(mine, theirs) {
  const out = {};
  for (const [g, v] of Object.entries(theirs || {})) out[g] = mine && mine[g] != null ? { score: v } : { done: true };
  return out;
}
