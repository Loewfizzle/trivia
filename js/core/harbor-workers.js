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
import { rngFrom, hashString } from './rng.js';
import { partyAt, partyAtT } from './harbor-moments.js';
import { XMAS, blackFriday } from './harbor-xmas.js';
import { thanksgiving } from './sky.js';
import { legendNight } from './harbor-legend.js';

const H = 3600;
/** the days: 0 Sun … 6 Sat */
const WEEKDAY = [1, 2, 3, 4, 5], MON_SAT = [1, 2, 3, 4, 5, 6], EVERY = [0, 1, 2, 3, 4, 5, 6];

/**
 * THE SHOWS (one at a time on the stage): kind → { days, at (a fixed start, local hours) | win ([from, to] for a seeded start), len (s),
 * prio (a fixed one wins; the higher keeps its time), truck (it parks at the stop on the back road: the van's trade / the model) }
 */
export const SHOWS = Object.freeze({
  // ~5:30 the street sweeper — a 1920s "white wing" with his broom + can cart; a wet streak left drying on the cobbles
  sweeper: { days: MON_SAT, win: [5.35, 5.6], len: 20 * 60, prio: 2 },
  // 6:00 THE MILK TRUCK (fixed): the milkman's wire carrier of bottles left on the barbershop's step (they wait there until the barber)
  milk: { days: MON_SAT, at: 5.982, len: 4.6 * 60, prio: 5, truck: { model: 'van', word: 'HARBOR DAIRY', paint: 0 } },
  // the newspaper van drops two twine-tied bundles at the vendor spot before the newsboy comes (the bundles wait: a trace)
  newsdrop: { days: EVERY, at: null, before: 'newsboy', lead: 24 * 60, len: 70, prio: 4, truck: { model: 'van', word: 'THE HERALD', paint: 2 } },
  // weekday mornings: THE TRASH TRUCK — the collector carries the can from beside the front-left lamppost to the truck, tips it, brings it back
  trash: { days: WEEKDAY, win: [6.3, 7.3], len: 3.6 * 60, prio: 3, truck: { model: 'dump', paint: 0 } },
  // mid-morning THE ICE MAN: a block on his shoulder with the tongs, to the side door
  ice: { days: WEEKDAY, win: [9.75, 10.6], len: 4.4 * 60, prio: 2, truck: { model: 'van', word: 'ICE CO.', paint: 2 } },
  // Tue + Fri, late morning → noon: THE WINDOW WASHERS on their hanging platform, the upper floor then the one below
  washers: { days: [2, 5], win: [10.55, 10.85], len: 84 * 60, prio: 3 },
  // Wednesday: THE ROOFTOP GARDENER (the beds through the seasons)
  gardener: { days: [3], win: [9.3, 9.6], len: 95 * 60, prio: 2 },
  // ~2 pm the "SODA WATER" truck: crates to the side door (wink)
  soda: { days: WEEKDAY, win: [13.7, 14.35], len: 5.5 * 60, prio: 2, truck: { model: 'van', word: 'SODA WATER', paint: 1 } },
  // MONDAY 1–4 pm THE SIGN PAINTERS repaint the blade for the new week, in stages (paint-out → chalk → letters → the gilt)
  painters: { days: [1], at: 13.0, len: 170 * 60, prio: 5 },
  // ~5–6 pm THE BILLPOSTER changes the roof billboard (the daily game change): on the catwalk, pasting the new poster in strips
  billposter: { days: EVERY, win: [16.85, 17.3], len: 34 * 60, prio: 4 },
  // ~11 pm (a few nights a month) THE BOOTLEGGERS: a quiet truck (no lamps), crates passed down the basement hatch, a lookout
  bootleg: { days: [0, 1, 2, 3, 4], win: [22.7, 23.25], len: 7 * 60, prio: 3, truck: { model: 'stake', paint: 0, dark: true }, rare: 0.09 },
  // SATURDAY: the bootleggers' BIG delivery before the party night (every Saturday, ~6:30–7 pm)
  delivery: { days: [6], win: [18.45, 18.9], len: 11 * 60, prio: 4, truck: { model: 'stake', paint: 1, dark: true } },
  // CAUSE AND EFFECT (the city notices itself): the morning after a blade bulb went out — the repairman's tall ladder at the corner
  bulb: { days: EVERY, win: [9.15, 9.7], len: 8 * 60, prio: 4, after: 'bulbOut' },
  // the morning after a lamppost's bad night — a short ladder at that lamp
  // (PROM — RETIRED: `lamp`, the lampman's stepladder at a lamppost — the promenade has no lampposts now (the implied lamps stand behind
  // the viewer); a lamp's bad night still stutters its implied pool until the next day — lampFault below + scene.js#lampLife)
  // the morning after a party night: the extra sweep (7:30) + a cleanup crew on the roof (9 am)
  sweep2: { days: [0, 6], win: [7.4, 7.7], len: 32 * 60, prio: 3, after: 'party' },
  crew: { days: [0, 6], win: [8.95, 9.2], len: 70 * 60, prio: 3, after: 'party' },
  // POLISH 5 — HOT SUMMER AFTERNOONS (the real temperature ≥ HOT_C — ctx.hot(key), the live weather): a city worker opens THE HYDRANT,
  // its spray arcs onto the cobbles for a couple of minutes (a kid runs through it), shut again; the wet patch dries (~2 hot days in 3)
  hydrant: { days: EVERY, win: [13.6, 16.7], len: 3.6 * 60, prio: 2, hot: true, chance: 0.66 },
  // 11a-2 — THE LEAF RAKER (the Thanksgiving build-up: Nov 4 → 22, late morning): a groundskeeper rakes the fallen leaves under the
  // trees into two piles, bags them + carries the sack off (dates: a local-date gate — PURE)
  // 11a-2 — BLACK FRIDAY: THE FIRST CHRISTMAS CREW (core/harbor-xmas.js — its hour + length; the strings appear as they work)
  xlights: { days: EVERY, at: XMAS.crew.at, len: XMAS.crew.len * 60, prio: 7, truck: { model: 'van', word: 'HOLIDAY LIGHTING', paint: 1 }, dates: key => { const [y, m, d] = key.split('-').map(Number), b = blackFriday(y); return m === b.m && d === b.d; } },
  // 9e — THE WATER WAGON's NIGHT (plan.md "FILLING THE DEAD TIMES — DECIDED" (2)): while the street flusher makes its slow passes on the back
  // road (~2:45 → 3:30 — core/harbor-snowwork.js#flushWindow), a crewman opens THE HYDRANT and hoses the cobbles (the hot day's spray,
  // its wet patch drying); never after rain, below freezing or on snow (ctx.flush(key) — the scene's live conditions)
  hoser: { days: EVERY, win: [2.95, 3.1], len: 4 * 60, prio: 3, flush: true },
  raker: { days: MON_SAT, win: [10.9, 11.5], len: 32 * 60, prio: 2, dates: key => { const [, m, d] = key.split('-').map(Number); return m === 11 && d >= 4 && d <= 22; } },
});
/** the hydrant's day: the real temperature at least this (°C: ~85 °F) */
export const HOT_C = 29;
/** windowed shows may slide this far past their window's end to dodge another show (s) */
const SLACK = 60 * 60;

/** THE REGULARS (may overlap a show): kind → { days, at | win, len } — evening ones in the evening's hours (25 = 1 am) */
export const REGULARS = Object.freeze({
  // 7:00 THE NEWSBOY (fixed) at his stand till ~10 (the weekend edition 8 → 11); the EVENING EDITION 4:30 → 6:30 on weekdays
  newsboy: { days: WEEKDAY, at: 7.0, len: 3 * H, weekend: { at: 8.0, len: 3 * H } },
  evening: { days: WEEKDAY, at: 16.5, len: 2 * H },
  // 8:30 THE BARBER (fixed, Mon–Sat): takes in the milk, sweeps the step, cranks the awning
  barber: { days: MON_SAT, at: 8.5, len: 13.5 * 60 },
  // 9:00 am + 9:00 pm THE BEAT COP (fixed, every day): a friendly stroll through — the baton's twirl, a tip of the hat
  cop: { days: EVERY, at: 9.0, len: 110 },
  patrol: { days: EVERY, at: 21.0, len: 110 },
  // ~10:30 THE MAILMAN to the barbershop
  mail: { days: MON_SAT, win: [10.25, 10.75], len: 95 },
  // ~4 pm THE BARTENDER arrives at the side door (the window moment's lights come on behind him)
  bartender: { days: EVERY, at: 15.93, len: 60 },
  // from dusk THE DOORMAN at the side door (guests whisper the password); on party nights he hands over to the line's doorman
  doorman: { days: EVERY, dusk: 0.17, until: 25.85 },
  // dusk THE FLOWER SELLER (Wed–Sat, most weeks) selling to couples heading in
  flowers: { days: [3, 4, 5, 6], dusk: 0.3, len: 2.4 * H, chance: 0.72 },
  // ~8 pm THE MUSICIAN with his double-bass case (the band) — not on Mondays (the band's night off)
  musician: { days: [0, 2, 3, 4, 5, 6], win: [19.85, 20.1], len: 75 },
  // ~2 am THE BAR STAFF lock up + leave (the evening's own clock: 26 = 2 am)
  staff: { days: EVERY, at: 25.97, len: 150 },
  // 9e — THE NIGHT SHIFT (plan.md "FILLING THE DEAD TIMES — DECIDED" (1)): the boss's HENCHMAN patrols the block with a flashlight in the
  // small hours (2:03 → 5:55, every night — after the staff have locked up) + the weekday late nights (Sun–Thu, 11:24 pm → 12:51 am);
  // his BEAT (the left end of the front, a look round, the corner, a look up the street, a check of the door) + his LAP (off round the
  // block, back a minute later)
  henchman: { days: EVERY, at: 2.05, len: 3.85 * H },
  henchman2: { days: [0, 1, 2, 3, 4], at: 23.4, len: 1.45 * H },
});

// ------------------------------------------------------------------ CAUSE AND EFFECT (seeded nights)
/** THE BLADE BULB: one night a week (seeded) a marquee bulb dies at a seeded moment (21:30 → 00:30) — dark until the repairman. → {
 *  t (abs s), bulb (an index into the marquee) } | null. dayKey: the EVENING's local date; ev0: its local midnight (abs s) */
export function bulbOut(dayKey, ev0, ctx = {}) {
  const wk = weekOf(dayKey), r = rngFrom(hashString(`bulbwk|${ctx.seed || 1924}|${wk}`)), dow = dowOf(dayKey);
  if (Math.floor(r() * 7) !== dow) return null;
  return { t: ev0 + (21.5 + r() * 3) * H, bulb: Math.floor(r() * 40) };
}
/** THE LAMP'S BAD NIGHT (~2 a week): one lamppost stutters now and then all night (dusk → dawn) — fixed next morning. → { lamp (0..n),
 *  from (abs s) } | null */
export function lampFault(dayKey, ev0, ctx = {}) {
  const r = rngFrom(hashString(`lampfault|${ctx.seed || 1924}|${dayKey}`));
  if (r() > 0.28) return null;
  return { lamp: Math.floor(r() * (ctx.lamps || 4)), from: ev0 + (18 + r() * 3) * H, period: 38 + r() * 40 };
}
/** THE BILLBOARD LAMP (~every 9 days): one of its four goosenecks burns out (19:30 → 01:00) — dark until the next billposter fixes it */
export function boardLampOut(dayKey, ev0, ctx = {}) {
  const r = rngFrom(hashString(`bblamp|${ctx.seed || 1924}|${dayKey}`));
  if (r() > 0.11) return null;
  return { lamp: Math.floor(r() * 4), t: ev0 + (19.5 + r() * 5.5) * H };
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
    const at = S.at != null ? S.at : S.win[0] + u * (S.win[1] - S.win[0]);
    want.push({ kind, S, t0: day0 + at * H, fixed: S.at != null });
  }
  // the newspaper van: before the newsboy's morning (the weekend edition later)
  { const nb = REGULARS.newsboy, at = WEEKDAY.includes(dow) ? nb.at : nb.weekend.at; want.push({ kind: 'newsdrop', S: SHOWS.newsdrop, t0: day0 + at * H - SHOWS.newsdrop.lead, fixed: true }); }
  want.sort((a, b) => (b.fixed - a.fixed) || (b.S.prio - a.S.prio) || a.t0 - b.t0);
  const taken = [];
  // (Oct 25 — NO TRAFFIC DURING THE LEGENDARIES: tonight's legendary holds its minutes — no show (its truck would drive in under the
  // craft) across them; a show slides past like past any other, or is skipped)
  { const [yy, mm, dd] = key.split('-').map(Number), lg = legendNight(yy, mm, dd);
    if (lg) taken.push({ t0: day0 + lg.h * H - 150, t1: day0 + lg.h * H + 120, legend: true }); }
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
