// BOARD 2.0 A — DAILY POINTS (PURE — the owner's decision, Nov 9 2:30 am: "each day's result → points (the server, from its own record); THIS WEEK =
// the sum; ALL TIME = the average per day played, shown from 10 days played; skipping a day never helps; a played-and-lost day always beats not
// playing"). ONE table, a row per daily (PLUG-AND-PLAY: a new daily = its row here + its cartridge — the boards, the back-fill + the server's step
// find it by itself). A row turns the SERVER's stored score (dly/{game}/{day}/r/{pid} — judged from the server's own record: never a phone's
// claim) into 0–100 points:
//   · a better result NEVER scores fewer points (whole points: two close results can tie) · a played-and-lost day ≥ POINTS_FLOOR (> 0) ·
//     not playing = 0 · only a COUNTED result (THE THROWAWAY GATE) earns points.
// The boards (core/boards.js — `daily` = all the dailies summed per day, `daily-<game>` one each): THIS WEEK = the sum of the week's days;
// ALL TIME = the average (ALL_TIME_RULE below) — ranked from MIN_DAYS days played; below it unranked, the average still returned to the player.
import { DAILIES } from '../config.js';

export const POINTS_MAX = 100;
/** a played-and-lost day's least (always more than not playing) */
export const POINTS_FLOOR = 10;
/** ALL TIME is ranked from this many days played */
export const MIN_DAYS = 10;
/**
 * ALL TIME's average (the owner's two rules met — "the average per day played" + "skipping a day never helps"): 'span' = the points ÷ the days
 * from your FIRST daily-day to your LAST — a day you skipped in between counts as a 0 (skipping a hard day and coming back never helps; stopping
 * isn't skipping: a day only turns into a 0 once you come back). 'played' = the plain points ÷ days played (skipping a bad day WOULD raise it).
 * One constant — the owner's call (BOARD 2.0 A's summary).
 */
export const ALL_TIME_RULE = 'span';

// ---- THE PASSWORD (score = (2 − doors opened) × 100 + guesses — js/games/password/logic.js#scoreOf; a door locked out = its 6 guesses)
//   both doors in G guesses (2–12):           100 − 4 × (G − 2)  → 100 … 60
//   the first door in g (1–6), then LOCKED OUT: 55 − 6 × (g − 1)  → 55 … 25  (the owner's "50 − 6 × (g − 1)" + "a locked door = 5")
//   LOCKED OUT at the first door:              10                 (the floor — both doors locked: 5 + 5)
// (the proposed 50 − 6 × (g − 1) a door gave both doors in 12 = 40 BELOW one door in 1 = 55 — a worse result over a better one: both doors now
//  slide 4 a guess, so the worst two-door run (60) still beats the best one-door run (55))
function passwordPoints(score) {
  const s = Math.round(Number(score));
  if (!Number.isFinite(s) || s < 2) return null;
  if (s <= 12) return 100 - 4 * (s - 2);
  if (s >= 100 && s < 200) { const g = Math.min(6, Math.max(1, s - 100 - 6)); return 55 - 6 * (g - 1); }
  return POINTS_FLOOR;
}

// ---- COAST CLEAR (score = whole seconds on the clock, spots + pauses in — js/games/coastclear/logic.js#scoreOf; CAUGHT = 10000 + the safe
//   cells left). CLEARED = 40 + up to 60 by time on a LOG scale from scripts/sim-coastclear.mjs's human-paced clears (3000 real boards:
//   p10 0:53 · median 1:19 · p90 1:58): 100 at ≤ 0:45, ~83 at the median, 50 at 4:00, sliding to 40 at 15:00 (and after). CAUGHT = 10 + up to
//   20 by how much of the harbor was opened (90 safe cells) — the best caught run (30) still under the slowest clear (40).
export const CC_TIME = Object.freeze({ fast: 45, mid: 240, slow: 900 });
const CC_SAFE = 9 * 12 - 18, CC_CAUGHT = 10000;
function coastPoints(score) {
  const s = Number(score);
  if (!Number.isFinite(s) || s < 0) return null;
  if (s >= CC_CAUGHT) { const left = Math.min(CC_SAFE, Math.max(0, s - CC_CAUGHT)); return POINTS_FLOOR + Math.round(20 * (CC_SAFE - left) / CC_SAFE); }
  const { fast, mid, slow } = CC_TIME;
  if (s <= fast) return 100;
  if (s <= mid) return Math.round(100 - 50 * Math.log(s / fast) / Math.log(mid / fast));
  if (s <= slow) return Math.round(50 - 10 * Math.log(s / mid) / Math.log(slow / mid));
  return 40;
}

// ---- THE DROP (THE DROP A — score = time survived in TENTHS × 1000 + lines: js/games/prism/drop.js#scoreOf). A CAPPED curve on the time:
//   POINTS_FLOOR (10) + 90 × (t / 8:00)^0.6 — 0:30 → 27 · 1:00 → 35 · 2:00 → 49 · 3:00 → 59 · 4:00 → 69 · 6:00 → 85 · THE END (8:00 — the
//   guaranteed end) → 100. A longer run never fewer points; the lines only break ties on the board, never here; any played day ≥ the floor.
export const DROP_END_TENTHS = 4800;
function dropPoints(score) {
  const s = Number(score);
  if (!Number.isFinite(s) || s < 0) return null;
  const tenths = Math.min(DROP_END_TENTHS, Math.floor(s / 1000));
  if (tenths >= DROP_END_TENTHS) return POINTS_MAX;
  return Math.min(POINTS_MAX - 1, Math.floor(POINTS_FLOOR + (POINTS_MAX - POINTS_FLOOR) * Math.pow(tenths / DROP_END_TENTHS, 0.6)));
}

/** THE TABLE — a row per daily: its score → points (+ the row's own best / worst / lost, for the docs + the tests) */
export const POINTS = Object.freeze({
  password: { of: passwordPoints, best: 2, worstWin: 12, lost: 206, label: 'both doors in 2 · both in 12 · locked out at the first door' },
  coastclear: { of: coastPoints, best: 30, worstWin: 3600, lost: 10090, label: 'cleared in 0:30 · cleared in 1:00:00 · caught with nothing opened' },
  drop: { of: dropPoints, best: DROP_END_TENTHS * 1000 + 120, worstWin: 600 * 1000, lost: 0, label: 'THE END (8:00) · 1:00 survived · topped out at once', high: true },
});
/** the dailies with a points row (the boards' list — DAILIES' order) */
export const POINT_DAILIES = DAILIES.map(d => d.id).filter(id => POINTS[id]);
/** a stored score → its points (0–100), or null (no row / a score no run makes) */
export function dailyPoints(game, score) {
  const row = POINTS[game];
  if (!row || score == null) return null;
  const v = row.of(score);
  return v == null ? null : Math.max(0, Math.min(POINTS_MAX, Math.round(v)));
}

// ---- THE PLAYER'S POINTS (pstats/{pid}/dp — server-written inside THE DAILY's own transaction, core/progress.js#dailyStep):
//   d: { [day]: { g: { game: pts }, t } }   the newest KEEP_DAYS days (a run's day is today's or yesterday's — DFIX1 — so a repeat is always seen)
//   w: { [wk]: { t, g: { game: t } } }      the two newest weeks (a Sunday-day run finishing after midnight lands on ITS week)
//   a: { t, n, f, l, g: { game: { t, n, f, l } } }   ALL TIME: the points, the days played, the first + the last daily-day
export const KEEP_DAYS = 16;
const dayN = d => { const y = +d.slice(1, 5), m = +d.slice(5, 7), dd = +d.slice(7, 9); return Math.round(Date.UTC(y, m - 1, dd) / 86400e3); };
/** the Eastern week (core/week.js's key: the Monday) a daily-day belongs to */
export function weekOfDay(day) {
  const n = dayN(day), dow = (new Date(n * 86400e3).getUTCDay() + 6) % 7, mon = new Date((n - dow) * 86400e3);
  return `w${mon.getUTCFullYear()}${String(mon.getUTCMonth() + 1).padStart(2, '0')}${String(mon.getUTCDate()).padStart(2, '0')}`;
}
/** days from a to b inclusive */
export const spanDays = (a, b) => (a && b ? dayN(b) - dayN(a) + 1 : 0);

/**
 * ONE counted daily result into the points (PURE, idempotent — a day + game already scored is a no-op → null). dp = pstats.dp (or null) →
 * the next dp | null
 */
export function pointsStep(dp0, { game, day, pts }) {
  if (pts == null || !game || !day) return null;
  const dp = dp0 || {};
  const d = { ...(dp.d || {}) };
  const D = d[day] ? { ...d[day], g: { ...(d[day].g || {}) } } : { g: {} };
  if (D.g[game] != null) return null;
  const newDay = !d[day];
  D.g[game] = pts; D.t = (D.t || 0) + pts; d[day] = D;
  for (const k of Object.keys(d).sort().slice(0, -KEEP_DAYS)) delete d[k];
  const wk = weekOfDay(day), w = { ...(dp.w || {}) };
  const W = w[wk] ? { ...w[wk], g: { ...(w[wk].g || {}) } } : { t: 0, g: {} };
  W.t += pts; W.g[game] = (W.g[game] || 0) + pts; w[wk] = W;
  for (const k of Object.keys(w).sort().slice(0, -2)) delete w[k];
  const a = { t: 0, n: 0, ...(dp.a || {}), g: { ...((dp.a && dp.a.g) || {}) } };
  a.t += pts; if (newDay) a.n += 1;
  a.f = !a.f || day < a.f ? day : a.f; a.l = !a.l || day > a.l ? day : a.l;
  const G = { t: 0, n: 0, ...(a.g[game] || {}) };
  G.t += pts; G.n += 1; G.f = !G.f || day < G.f ? day : G.f; G.l = !G.l || day > G.l ? day : G.l;
  a.g[game] = G;
  return { d, w, a };
}

/** ALL TIME's average of one tally ({ t, n, f, l }) by ALL_TIME_RULE */
export function averageOf(x, rule = ALL_TIME_RULE) {
  if (!x || !(x.n > 0)) return null;
  const days = rule === 'span' ? Math.max(x.n, spanDays(x.f, x.l)) : x.n;
  return x.t / days;
}

/** a points board's values from the stats: `daily` (all of them) or one daily → { weeks: { [wk]: sum }, all (avg × 100, ranked from MIN_DAYS),
 *  avg, days } — the ALL TIME sort value is the average in hundredths (an integer the database orders) */
export function pointsValues(dp, game = null) {
  const out = { weeks: {}, all: null, avg: null, days: 0 };
  if (!dp) return out;
  for (const [wk, W] of Object.entries(dp.w || {})) { const v = game ? (W.g || {})[game] || 0 : W.t || 0; if (v > 0) out.weeks[wk] = v; }
  const tally = game ? dp.a && dp.a.g && dp.a.g[game] : dp.a;
  const avg = averageOf(tally);
  out.days = (tally && tally.n) || 0;
  out.avg = avg == null ? null : Math.round(avg * 10) / 10;
  out.all = avg != null && out.days >= MIN_DAYS ? Math.round(avg * 100) : null;
  return out;
}

/** THE BACK-FILL (PURE): a player's points rebuilt from the stored COUNTED results (daily = { [game]: { [day]: { r, x } } }) → dp | null */
export function pointsFromRecords(daily, pid) {
  let dp = null;
  const runs = [];
  for (const [game, days] of Object.entries(daily || {})) for (const [day, D] of Object.entries(days || {})) {
    const score = D && D.r && D.r[pid];
    if (score == null || (D.x && D.x[pid])) continue;
    runs.push({ game, day, score });
  }
  runs.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.game < b.game ? -1 : 1));
  for (const r of runs) { const pts = dailyPoints(r.game, r.score); const nx = pointsStep(dp, { game: r.game, day: r.day, pts }); if (nx) dp = nx; }
  return dp;
}
