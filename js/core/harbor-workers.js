// CITY 2.0 — THE HARBOR, PART 8b1: THE WORKERS' SCHEDULE (plan.md "THE WORKERS' SCHEDULE — DECIDED", the owner + Claude, Oct 24).
// PURE — the TIMETABLE + every prop's state on the clock (tests/harbor-workers.test.mjs). The ROUTINES layer (review-3 §A2): a
// scheduled set-piece layer beside the people's random visits (core/harbor-people.js) — who comes WHEN, planned once per local day from
// a seed (the date), so every phone sees the same worker at the same moment and a page opened mid-way JOINS MID-WAY. Their walks are
// planned on the people's map by core/harbor-crew.js; their props are drawn by screens/harbor/workers.js.
//
// THE PRINCIPLE (the owner): most people open the site in the EVENING (7–11 pm), then lunch, then after work — so the big shows sit
// where people look; the early morning stays light but leaves TRACES (the milk bottles on the step until the barber takes them in,
// the sweeper's wet streak drying, the newsboy's bundles waiting). SET-YOUR-WATCH FIXED regulars (to the minute): the milk truck 6:00,
// the newsboy 7:00, the barber 8:30, the beat cop 9:00 am + 9:00 pm; everything else in a WINDOW with seeded randomness.
// NEVER TWO WORKER SHOWS AT ONCE: a SHOW (a truck at the stop, a ladder, the platform, the billposter, the painters, the gardener, a
// crew) holds the stage alone — a windowed one slides later inside its window (+ a little slack) or is skipped that day; the
// REGULARS (the newsboy at his stand, the beat cop's stroll, the mailman, the doorman, the flower seller, the musician, the staff)
// may overlap a show (they're small).
//
// ADDING A WORKER: a row in SHOWS (or REGULARS) — its days, its time (fixed `at` or a `win` [from, to] for the start), its length —
// then its itinerary in core/harbor-crew.js#PLAN[kind] (+ a look in folk.js#lookOf, props in screens/harbor/workers.js). Its preview:
// &force=work-<kind> (one every few minutes, any day) + a row in core/harbor-remote.js's WORKERS category.
import { holdemKeeps } from './harbor-holdem.js';
import { rngFrom, hashString } from './rng.js';
import { partyAt, partyAtT } from './harbor-moments.js';
import { XMAS, blackFriday } from './harbor-xmas.js';
import { thanksgiving } from './sky.js';
import { legendsOf } from './harbor-legend.js';
import { knob } from './harbor-schedule.js';

const H = 3600;

/**
 * THE SHOWS (one at a time on the stage): kind → { days, at (a fixed start, local hours) | win ([from, to] for a seeded start), len (s),
 * prio (a fixed one wins; the higher keeps its time), truck (it parks at the stop on the back road: the van's trade / the model) }
 */
/** a kind → spec table: the timetable's timing (knob) + the planner's own fields per kind (trucks, date gates), frozen */
function withKnobs(times, own) { const out = {}; for (const [k, v] of Object.entries(times)) out[k] = Object.freeze({ ...v, ...(own[k] || {}) }); for (const k of Object.keys(own)) if (!out[k]) out[k] = Object.freeze({ ...own[k] }); return Object.freeze(out); }
export const SHOWS = withKnobs(knob('workers').shows, {
  milk: { truck: { model: 'van', word: 'HARBOR DAIRY', paint: 0 } },
  newsdrop: { truck: { model: 'van', word: 'THE HERALD', paint: 2 } },
  trash: { truck: { model: 'dump', paint: 0 } },
  ice: { truck: { model: 'van', word: 'ICE CO.', paint: 2 } },
  soda: { truck: { model: 'van', word: 'SODA WATER', paint: 1 } },
  bootleg: { truck: { model: 'stake', paint: 0, dark: true } },
  delivery: { truck: { model: 'stake', paint: 1, dark: true } },
  xlights: { at: XMAS.crew.at, len: XMAS.crew.len * 60, truck: { model: 'van', word: 'HOLIDAY LIGHTING', paint: 1 }, dates: key => { const [y, m, d] = key.split('-').map(Number), b = blackFriday(y); return m === b.m && d === b.d; } },
  raker: { dates: key => { const [, m, d] = key.split('-').map(Number), W = knob('workers').shows.raker.dateWin; return m === W[0] && d >= W[1] && d <= W[2]; } },
});
/** the hydrant's day: the real temperature at least this (°C: ~85 °F) */
export const HOT_C = 29;
/** windowed shows may slide this far past their window's end to dodge another show (s) */
const SLACK = knob('workers').slack;

/** THE REGULARS (may overlap a show): kind → { days, at | win, len } — evening ones in the evening's hours (25 = 1 am) */
export const REGULARS = withKnobs(knob('workers.regulars'), {});

// ------------------------------------------------------------------ CAUSE AND EFFECT (seeded nights)
/** THE BLADE BULB: one night a week (seeded) a marquee bulb dies at a seeded moment (21:30 → 00:30) — dark until the repairman. → {
 *  t (abs s), bulb (an index into the marquee) } | null. dayKey: the EVENING's local date; ev0: its local midnight (abs s) */
export function bulbOut(dayKey, ev0, ctx = {}) {
  const wk = weekOf(dayKey), r = rngFrom(hashString(`bulbwk|${ctx.seed || 1924}|${wk}`)), dow = dowOf(dayKey);
  if (Math.floor(r() * 7) !== dow) return null;
  const F = knob('workers.faults').bulb;
  return { t: ev0 + (F.from + r() * F.span) * H, bulb: Math.floor(r() * 40) };
}
/** THE LAMP'S BAD NIGHT (~2 a week): one lamppost stutters now and then all night (dusk → dawn) — fixed next morning. → { lamp (0..n),
 *  from (abs s) } | null */
export function lampFault(dayKey, ev0, ctx = {}) {
  const r = rngFrom(hashString(`lampfault|${ctx.seed || 1924}|${dayKey}`));
  const F = knob('workers.faults').lamp;
  if (r() > F.p) return null;
  return { lamp: Math.floor(r() * (ctx.lamps || 4)), from: ev0 + (F.from + r() * F.span) * H, period: 38 + r() * 40 };
}
/** THE BILLBOARD LAMP (~every 9 days): one of its four goosenecks burns out (19:30 → 01:00) — dark until the next billposter fixes it */
export function boardLampOut(dayKey, ev0, ctx = {}) {
  const r = rngFrom(hashString(`bblamp|${ctx.seed || 1924}|${dayKey}`));
  const F = knob('workers.faults').board;
  if (r() > F.p) return null;
  return { lamp: Math.floor(r() * 4), t: ev0 + (F.from + r() * F.span) * H };
}
/** the bootleggers' quiet weeknight (a few a month) — the RAID's hook (8b2: "rarely the raid comes the night after a delivery") */
export function bootlegNight(dayKey, ctx = {}) {
  const dow = dowOf(dayKey);
  if (!SHOWS.bootleg.days.includes(dow)) return false;
  return rngFrom(hashString(`bootleg|${ctx.seed || 1924}|${dayKey}`))() < SHOWS.bootleg.rare;
}

// ------------------------------------------------------------------ dates
const dowOf = key => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const dayNum = key => { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const weekOf = key => Math.floor((dayNum(key) + 3) / 7);
const keyOfNum = n => { const d = new Date(n * 864e5); return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`; };
/** the local day of t: { key, dow, h (local hours), month, day0 (its local midnight, abs s) } */
export function dayOf(t, off = 0) {
  const lt = t + off * 60, d = new Date(lt * 1000), h = ((lt / H) % 24 + 24) % 24;
  return { key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, dow: d.getUTCDay(), h, month: d.getUTCMonth() + 1, day0: t - h * H };
}
export const prevKey = key => keyOfNum(dayNum(key) - 1);
/** 11a-2 — the days the workers' shows stay home (Thanksgiving: the parade has the road) */
export const holidayOff = key => { const [y, m, d] = key.split('-').map(Number); const t = thanksgiving(y); return m === t.m && d === t.d; };
/** dusk on a day (local hours) when the scene doesn't hand the real one: Grand Rapids' sunset by the month + ~25 min */
export const duskOf = month => 19.6 + 1.85 * Math.cos(((month - 6.6) / 12) * 2 * Math.PI) + 0.42;

// ------------------------------------------------------------------ THE DAY'S PLAN
/**
 * The workers of local day `key` (PURE — the same on every phone): → [{ id, kind, show (bool), t0, t1 (abs s), truck?, … }] in start
 * order, no two SHOWS overlapping. ctx: { seed, day0 (its local midnight, abs s), dusk(key) → local hour, party(t) → bool, lamps,
 * force (a kind: &force=work-<kind> — one every FORCE.slot s, any day) }
 */
export function workDay(key, ctx = {}) {
  const day0 = ctx.day0, dow = dowOf(key), r = rngFrom(hashString(`work|${ctx.seed || 1924}|${key}`)), out = [];
  const party = t => (ctx.party ? ctx.party(t) : partyAtT(t, ctx.off || 0));
  const dusk = ctx.dusk ? ctx.dusk(key) : duskOf(+key.split('-')[1]);
  const yKey = prevKey(key), y0 = day0 - 24 * H;
  // the night before (the cause → this morning's effect)
  const yParty = ctx.party ? ctx.party(y0 + 22.5 * H) : partyAt(dowOf(yKey), 22.5, yKey);
  const causes = { bulbOut: bulbOut(yKey, y0, ctx), lampFault: lampFault(yKey, y0, ctx), party: yParty };
  // the shows: fixed first (by prio), then the windowed ones sliding into the gaps
  const want = [];
  for (const [kind, S] of Object.entries(SHOWS)) {
    if (!S.days.includes(dow)) continue;
    if (S.after && !causes[S.after]) continue;
    if (S.rare && !bootlegNight(key, ctx)) continue;
    if (kind === 'newsdrop') continue;
    if (S.hot && !(ctx.hot && ctx.hot(key) && rngFrom(hashString(`hot|${ctx.seed || 1924}|${key}`))() < S.chance)) continue;
    if (S.flush && !(ctx.flush && ctx.flush(key))) continue;   // (9e: the water wagon's night — never after rain / below freezing / on snow)
    if (S.dates && !S.dates(key)) continue;
    // (11a-2: THANKSGIVING is a day off — no truck, no crew on the parade's road: only the newspaper van at dawn)
    if (holidayOff(key)) continue;
    const u = r();
    // (CITY FIXES + HOLD'EM: THE BILLPOSTER stays home while the roof board keeps HOLD'EM — his draw is taken first, so no other show moves)
    if (kind === 'billposter' && holdemKeeps(key)) continue;
    const at = S.at != null ? S.at : S.win[0] + u * (S.win[1] - S.win[0]);
    want.push({ kind, S, t0: day0 + at * H, fixed: S.at != null });
  }
  // the newspaper van: before the newsboy's morning (the weekend edition later)
  { const nb = REGULARS.newsboy, at = nb.days.includes(dow) ? nb.at : nb.weekend.at; want.push({ kind: 'newsdrop', S: SHOWS.newsdrop, t0: day0 + at * H - SHOWS.newsdrop.lead, fixed: true }); }
  want.sort((a, b) => (b.fixed - a.fixed) || (b.S.prio - a.S.prio) || a.t0 - b.t0);
  const taken = [];
  // (Oct 25 — NO TRAFFIC DURING THE LEGENDARIES: tonight's legendary holds its minutes — no show (its truck would drive in under the
  // craft) across them; a show slides past like past any other, or is skipped)
  { const [yy, mm, dd] = key.split('-').map(Number);
    for (const lg of legendsOf(yy, mm, dd)) taken.push({ t0: day0 + lg.h * H - 150, t1: day0 + lg.h * H + 120, legend: true }); }   // (SCHED: every one of tonight's)
  const free = (a, b) => !taken.some(o => a < o.t1 + 25 && b > o.t0 - 25);
  for (const w of want) {
    let t0 = w.t0;
    const len = w.S.len, lim = w.fixed ? t0 : day0 + (w.S.win[1] * H) + SLACK;
    while (!free(t0, t0 + len) && t0 <= lim) { const o = taken.filter(x => t0 < x.t1 + 25 && t0 + len > x.t0 - 25).sort((p, q) => q.t1 - p.t1)[0]; t0 = o.t1 + 30; }
    if (!free(t0, t0 + len) || t0 > lim) continue;            // (no room today: skipped)
    const item = { id: `w.${key}.${w.kind}`, kind: w.kind, show: true, t0, t1: t0 + len, seed: Math.floor(r() * 1e9) };
    if (w.S.truck) item.truck = { ...w.S.truck };
    if (w.kind === 'bulb') item.bulb = causes.bulbOut.bulb;
    if (w.kind === 'lamp') item.lamp = causes.lampFault.lamp;
    taken.push(item); out.push(item);
  }
  // the regulars
  for (const [kind, R] of Object.entries(REGULARS)) {
    if (!R.days.includes(dow) && !(kind === 'newsboy' && (dow === 0 || dow === 6))) continue;
    const u = r(), u2 = r();
    let at, len = R.len;
    if (kind === 'newsboy' && (dow === 0 || dow === 6)) { at = R.weekend.at; len = R.weekend.len; }
    else if (R.dusk != null) at = dusk + R.dusk;
    else at = R.at != null ? R.at : R.win[0] + u * (R.win[1] - R.win[0]);
    if (R.chance != null && u2 > R.chance) continue;
    let t0 = day0 + at * H, t1 = t0 + (len || 0);
    if (kind === 'doorman') {
      t1 = day0 + R.until * H;
      // (a party night: he hands the door over to THE LINE's doorman — core/harbor-people.js#LINE — before its first guests)
      if (party(day0 + 21 * H)) t1 = Math.min(t1, day0 + 20.6 * H - 90);
      if (t1 <= t0 + 300) continue;
    }
    if (kind === 'bartender' && ctx.bartenderAt) { const s = ctx.bartenderAt(key); if (s != null) { t0 = day0 + s - 150; t1 = t0 + len; } }
    out.push({ id: `w.${key}.${kind}`, kind, show: false, t0, t1, seed: Math.floor(r() * 1e9) });
  }
  return out.sort((a, b) => a.t0 - b.t0);
}

/** &force=work-<kind>: the preview — that worker every FORCE.slot seconds (starting FORCE.lead s in), any day, nothing else of theirs.
 *  POLISH 5 (the owner: the lamp repairman POPPED IN already up his ladder): the slots count from ctx.forceAt — the moment the flag was
 *  switched on (the link's load, the panel's 3-2-1) — so every preview shows the whole visit: in from off screen with the props, the
 *  job, away. Without forceAt (old callers) the clock's own grid. */
export const FORCE = Object.freeze({ slot: 180, lead: 3, long: { washers: 900, xlights: 1500, painters: 1200, billposter: 2160, gardener: 600, crew: 600, doorman: 600, flowers: 600, newsboy: 600, evening: 600, sweeper: 600, sweep2: 600 } });
export function forcedWork(kind, t, ctx = {}) {
  const S = SHOWS[kind] || REGULARS[kind]; if (!S) return [];
  const slot = FORCE.long[kind] || FORCE.slot, base = ctx.forceAt != null ? ctx.forceAt : 0, k = Math.floor((t - base) / slot), out = [];
  for (const j of [k - 1, k]) {
    if (ctx.forceAt != null && j < 0) continue;                 // (nothing before the moment it fired)
    const t0 = base + j * slot + FORCE.lead, len = Math.min(slot - 20, kind in FORCE.long ? slot - 30 : S.len || 120);
    const it = { id: `wf.${kind}.${Math.round(base)}.${j}`, kind, show: !!SHOWS[kind], t0, t1: t0 + len, seed: hashString(`wf|${kind}|${j}`), forced: true };
    if (S.truck) it.truck = { ...S.truck };
    if (kind === 'bulb') it.bulb = 7;
    if (kind === 'lamp') it.lamp = 2;
    out.push(it);
  }
  return out;
}


// ------------------------------------------------------------------ THE PROPS' STATES (PURE, on the clock)
/** THE MILK BOTTLES on the barbershop's step: set down by the milkman at `drop`, taken in by the barber at `take` (abs s) → 0 | 1 */
export const MILK = Object.freeze({ drop: 2.05 * 60, n: 4 });           // (s after the milk truck's start the carrier touches the step)
/** the bundles at the vendor spot: from the van's drop until the newsboy unties them (s after his start) */
export const BUNDLES = Object.freeze({ drop: 32, untie: 40 });
/** the sweeper's WET STREAK: it dries over this long (s) */
export const WET = Object.freeze({ dry: 45 * 60 });
/**
 * THE BLADE'S REPAINT (Monday 1–4 pm) in stages, u = s since the painters' start: → { stage, k (0..1 within it) }
 *   'setup' (the ladder + the drop cloth) · 'out' (the old name painted out, bottom → top) · 'chalk' (the new letters outlined) ·
 *   'letters' (filled one by one) · 'gilt' (the highlights) · 'pack' (down + away) — the new week's name stands from 'chalk' on
 */
export const PAINT_STAGES = Object.freeze([['setup', 9 * 60], ['out', 42 * 60], ['chalk', 22 * 60], ['letters', 62 * 60], ['gilt', 22 * 60], ['pack', 13 * 60]]);
export const PAINT_TOTAL = PAINT_STAGES.reduce((a, s) => a + s[1], 0);
export function paintStage(u) {
  if (u < 0) return { stage: 'before', k: 0 };
  let a = 0;
  for (const [id, len] of PAINT_STAGES) { if (u < a + len) return { stage: id, k: (u - a) / len }; a += len; }
  return { stage: 'done', k: 1 };
}
/** THE BILLPOSTER's sheets (u = s since his start): SHEETS pasted one by one (cols × rows, top row first, left → right), each `per` s
 *  from his first stroke (`from`) → how many sheets are up + the one in progress (0..1) */
export const SHEETS = Object.freeze({ cols: 3, rows: 2, from: 6.2 * 60, per: 3.1 * 60, fix: 2.4 * 60 });
export function sheetsUp(u) {
  const n = SHEETS.cols * SHEETS.rows;
  if (u < SHEETS.from) return { done: 0, k: 0, n };
  const p = (u - SHEETS.from) / SHEETS.per;
  return p >= n ? { done: n, k: 0, n } : { done: Math.floor(p), k: p - Math.floor(p), n };
}
/** THE WINDOW WASHERS' platform: the upper floor first (bay by bay), then lowered to the floor below → { y (world: the deck's height
 *  above the ground), bay (0..1 of the facade's right part), moving } — u = s since their start, len their whole show */
export function platformAt(u, len, rows = [[4.6, 6.8], [7.6, 9.6]]) {
  const top = rows[1][0] - 0.95, low = rows[0][0] - 0.95, park = rows[1][1] + 1.3;
  const k = u / len;
  if (k < 0.08) return { y: park + (top - park) * smoothK(k / 0.08), bay: 1, moving: true };
  if (k < 0.5) return { y: top, bay: k < 0.29 ? 1 : 0, moving: Math.abs(k - 0.29) < 0.015 };
  if (k < 0.56) return { y: top + (low - top) * smoothK((k - 0.5) / 0.06), bay: 0, moving: true };
  if (k < 0.92) return { y: low, bay: k < 0.74 ? 0 : 1, moving: Math.abs(k - 0.74) < 0.015 };
  return { y: low + (park - low) * smoothK((k - 0.92) / 0.08), bay: 1, moving: true };
}
const smoothK = u => { const x = Math.max(0, Math.min(1, u)); return x * x * (3 - 2 * x); };
