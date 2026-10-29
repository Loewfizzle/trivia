// CITY 2.0 — THE HARBOR, PART 7b: THE SPEAKEASY'S LIFE — the WINDOW MOMENTS catalogue, the day's schedule and the rooms' states
// by the hour (PURE — tested in tests/harbor-moments.test.mjs; drawn by screens/harbor/windows.js; docs/harbor/passes/part-7b.md).
//
// THE CATALOGUE: every moment is ONE entry — its window(s), when it may happen, its rarity, its length + cooldown, and the name of
// its painter in screens/harbor/windows.js (PAINT[id]). ADDING A MOMENT LATER = one entry here + one painter there (+ its row
// appears in THE PREVIEW PANEL's WINDOWS category by itself, and &force=window&moment=<id> previews it).
//   rarity     routine (fixed in the day: `at` + a seeded few minutes) · common · uncommon · rare (random draws weighted by
//              RARITY) · legendary (its own calendar: a few nights a year, `plays` times through the evening) · holiday (11a-2: a
//              holiday's ROOM LIFE on its own calendar — `calendar` + `from`/`to`: back-to-back plays of `len` s, never drawn at random)
//   windows    the rooms it may use (core/harbor-speakeasy.js ROOMS ids + 'shop' — the barbershop's big window); the draw picks
//              a free one. 'all' = every window in turn (it holds them all while it runs)
//   hours      [from, to) local hours, wrapping past midnight ([19.5, 2] = 7:30 pm → 2 am); null = any hour
//   light      'night' — only while the rooms are lit (between the evening's dusk and the morning's dawn: ctx.dark)
//   days       'weekend' | 'weekday' | null · months: [1..12] | null · party: × its weight on a party night (0 = never then)
//   len        seconds on screen · cooldown: seconds before the same moment may start again (party nights: × 0.6)
// THE SCHEDULE (dayPlan): seeded by the local DATE, so every phone at the same place sees the same moments at the same second
// and a phone opened mid-way joins the one already running (momentsAt). Something starts every ~10–20 s (party nights ~7–14),
// never two in the same window at once, never more than MAX_AT_ONCE together. RARITY = the chance a slot (when the eligible ones sum
// under 1 — by day — the rest of the slot stays empty: rare stays rare).
import { rngFrom, hashString } from './rng.js';
import { legendNight } from './harbor-legend.js';
import { partyDow } from './party.js';

export const RARITY = Object.freeze({ common: 1, uncommon: 0.34, rare: 0.008 });
export const RARITIES = Object.freeze(['routine', 'common', 'uncommon', 'rare', 'legendary', 'holiday']);
export const WINDOW_IDS = Object.freeze(['edge2', 'bar', 'jazz', 'edge3', 'apartment', 'back', 'shop']);
/** the tango's way round the building: the top floor left → right, then the bar floor right → left */
export const TANGO_PATH = Object.freeze(['edge3', 'back', 'jazz', 'bar', 'edge2']);   // (SP5: never through the boss's room)
/** SP5 — THE BOSS's ROOM (the owner: you NEVER see him): NO moment ever plays in the apartment — day or night, the holidays included;
 *  the routines moved to other windows, the tango skips it, hourPlan refuses it. Its only life: the TV's glow at night, the drawn shade
 *  by day (bossDayPlan), the bootleggers' tell (bossSignal), his shadow at the shade on a party night (bossWatch). */
export const BOSS_ROOM = 'apartment';
export const MAX_AT_ONCE = 2;

export const MOMENTS = Object.freeze([
  // ---- ROUTINES (fixed in the day; each also moves its room to its next state — roomState below)
  { id: 'wake', label: 'THE UPSTAIRS WAKES', rarity: 'routine', windows: ['back'], at: 7, jitter: 8, len: 42, kind: 'a big silhouette motion: the blind up, a stretch, a look out at the morning' },
  { id: 'shop-open', label: 'THE BARBERSHOP OPENS', rarity: 'routine', windows: ['shop'], at: 9, jitter: 3, len: 44, kind: 'a light change + people: the lamp on, the barber in, OPEN, the first customer in the chair' },
  { id: 'bartender', label: 'THE BARTENDER ARRIVES', rarity: 'routine', windows: ['bar'], at: 16, jitter: 6, len: 52, kind: 'lights on one by one behind a half-drawn shade, a glass polished' },
  { id: 'lights-out', label: 'LIGHTS OUT · THE TV', rarity: 'routine', windows: ['apartment'], at: 22, jitter: 12, len: 16, kind: 'the lamp clicks off, the TV flickers on, someone settles on the couch' },
  // ---- the random draws
  { id: 'dance', label: 'A COUPLE DANCING', rarity: 'common', windows: ['jazz'], hours: [19.5, 2], light: 'night', len: 9, cooldown: 30, party: 2, kind: 'big silhouettes crossing the shade' },
  { id: 'toast', label: 'A TOAST AT THE BAR', rarity: 'common', windows: ['bar'], hours: [19, 2.5], light: 'night', len: 7, cooldown: 24, party: 1.6, kind: 'arms up, glasses glinting, the clink' },
  { id: 'sax', label: 'THE SAX SOLO', rarity: 'uncommon', windows: ['jazz'], hours: [20, 2], light: 'night', len: 15, cooldown: 200, party: 1.5, kind: 'the sax player (lit in the honey room, the shade up) steps to the glass, leans back + swings the brass bell up (9e)' },
  { id: 'cat', label: 'THE CAT ON THE SILL', rarity: 'uncommon', windows: ['back', 'edge3', 'edge2'], hours: null, len: 26, cooldown: 240, kind: 'the cat: up onto the sill, settles, tail flicking, down again' },
  // 9a — THE WEATHER ON THE GLASS (the plan's wx gate): a DESK FAN turning on the sill on hot afternoons (the real temperature ≥ HOT_C)
  { id: 'fan', label: 'A FAN ON A HOT DAY', rarity: 'common', windows: ['back'], hours: [11.5, 21], len: 55, cooldown: 300, wx: ['hot'], starter: false, kind: 'a desk fan on the sill, its blades a blur, the curtain stirring' },
  // (9e's MORNING PAPER was taken out in 9f — the owner: "way too cheap looking"; the back / bar windows' other moments fill its hours)
  { id: 'peek', label: 'A PEEK AT THE STREET', rarity: 'rare', windows: ['jazz', 'back'], hours: [7.5, 2], len: 6.5, cooldown: 1800, kind: 'a silhouette behind the curtain, looking left and right' },
  { id: 'tango', label: 'THE TANGO (LEGENDARY)', rarity: 'legendary', windows: 'all', hours: [20.5, 23.75], light: 'night', len: 30, plays: 3, nights: 4, kind: 'a top hat + a flapper dress tango past every window in turn' },
  // ---- THE HIDDEN MIRROR DOOR (the barbershop's back wall — not one of the starter ten: the speakeasy's own secret)
  // ---- 11a-1 — THE HOLIDAYS' WINDOW SCENES (core/harbor-holiday.js gates them: holiday = its id, minStage = how far the build-up must
  // be, eve = × its weight on the holiday's own night; ctx.hol = { id, stage, eve, w (the build-up's window weight 0..1) })
  { id: 'ghost', label: 'A GHOST BEHIND THE CURTAIN', rarity: 'common', holiday: 'halloween', minStage: 0.45, windows: ['back'], hours: [18, 3], light: 'night', len: 11, cooldown: 70, eve: 2.4, starter: false, kind: 'a pale glowing sheet rising out of the room’s shadows, drifting across behind the glass, its eyes looking out, the room’s light shivering' },
  { id: 'mummy', label: 'A MUMMY ON THE SHADE', rarity: 'common', holiday: 'halloween', minStage: 0.6, windows: ['jazz'], hours: [19, 2.5], light: 'night', len: 10, cooldown: 110, eve: 2, starter: false, kind: 'a mummy’s shadow lurching across the jazz room’s shade, arms out stiff, its loose wraps swinging' },
  { id: 'witchsil', label: 'A WITCH AT HER CAULDRON', rarity: 'common', holiday: 'halloween', minStage: 0.7, windows: ['back'], hours: [19, 2.5], light: 'night', len: 14, cooldown: 160, eve: 1.6, starter: false, kind: 'a witch’s silhouette stirring a cauldron, its green glow from below, the bubbles rising' },
  { id: 'costume', label: 'THE COSTUME PARTY', rarity: 'common', holiday: 'halloween', minStage: 0.85, windows: ['bar'], hours: [19.5, 2.5], light: 'night', len: 9, cooldown: 45, eve: 3, party: 2, starter: false, kind: 'a witch, a devil, a cat + a sheet ghost raising their glasses at the bar' },
  { id: 'ofrenda', label: 'LIGHTING THE OFRENDA', rarity: 'common', holiday: 'dotd', minStage: 0.5, windows: ['back'], hours: [16.5, 23.5], len: 14, cooldown: 120, eve: 1.5, starter: false, kind: 'someone kneels at the ofrenda and lights its candles one by one, then a moment of stillness' },
  { id: 'mirror', label: 'THE MIRROR DOOR', rarity: 'uncommon', windows: ['shop'], hours: [20.75, 2.5], light: 'night', len: 8.5, cooldown: 150, party: 3, starter: false, kind: 'the mirror swings open on the bar: amber light, bottles, silhouettes, a burst of jazz' },
  // ---- WIN — COUNTING THE CASH (the owner): the bootlegger's take counted under the green banker's lamp in the back room — late on the
  // bootleggers' nights (boot: a delivery night — core/harbor-workers.js#bootlegNight, or Saturday's big one), NEVER on a raid night
  // (noRaid: the cash is gone before the police come — core/harbor-raid.js#raidEvening)
  // ---- WIN2 — THE EYES IN THE HAZE (the owner's add-on): one of the four full windows a dark room full of slow drifting haze, lit faintly
  // from below by an ember-red glow, with just a pair of big red glowing eyes watching the street — blinking rarely, drifting a little,
  // narrowing now + then; no body, no face. Its own calendar (eyesNights): 2 random weekend nights a month, 11 pm → 4 am, 3 plays of
  // 150 s; never a legendary's night, never with the edge windows' eerie-red mood, never a Mothman night (ctx.mothman — none yet)
  { id: 'eyes', label: 'THE EYES IN THE HAZE', rarity: 'legendary', calendar: 'eyes', windows: ['bar', 'jazz', 'back'], hours: [23, 4], light: 'night', len: 150, plays: 3, starter: false, kind: 'a dark room full of slow haze, an ember-red glow from below, a pair of big red eyes watching the street — blinking rarely, drifting, narrowing; no body, no face' },
  { id: 'cash', label: 'COUNTING THE CASH', rarity: 'uncommon', windows: ['back'], hours: [22.5, 2.5], light: 'night', len: 26, cooldown: 420, party: 0.6, boot: true, noRaid: true, starter: false, kind: 'a close-up: a man in shirtsleeves + braces under the green banker\'s lamp, bills peeled off the heap into banded stacks, a lick of the thumb, a glance over his shoulder; a shadow at the door — it all goes in the bag' },
  // ---- 11a-2 — THANKSGIVING's ROOM LIFE (the owner: "candlelit family tables in windows on the lit 3D kit + ACT BIG — NEVER in the boss's
  // room, a football game on a TV in another room"): long steady scenes on the holiday's own date (calendar: 'thanksgiving' — the fourth
  // Thursday of November), each played as back-to-back chunks of `len` s from `from` to `to` (local hours; a seeded few minutes' jitter):
  // a phone opened at 4 pm or 7 pm walks straight into them. The people ARRIVE at the start of the first chunk + LEAVE at the end of the
  // last (walkIn), never a cut; the chunks between are seamless. They are the rooms' own life (starOnly keeps them with the routines)
  { id: 'table', label: 'THE FAMILY TABLE', rarity: 'holiday', calendar: 'thanksgiving', holiday: 'thanksgiving', windows: ['back'], from: 15, to: 21.5, hours: [15, 21.5], len: 900, cooldown: 900, starter: false, kind: 'Thanksgiving dinner by candlelight: a white cloth, the turkey on its platter, the dishes going round, a family of four at the table — passing a dish, leaning in, a toast' },
  { id: 'football', label: 'THE GAME ON TV', rarity: 'holiday', calendar: 'thanksgiving', holiday: 'thanksgiving', windows: ['jazz'], from: 12.5, to: 19, hours: [12.5, 19], len: 900, cooldown: 900, starter: false, kind: 'Thanksgiving football: the set\u2019s green glow on three on the couch, the snap, a long run — and on a score they jump up, arms high' },
]);
export const MOMENT = Object.freeze(Object.fromEntries(MOMENTS.map(m => [m.id, m])));
export const STARTERS = Object.freeze(MOMENTS.filter(m => m.starter !== false).map(m => m.id));
export const windowsOf = m => (m.windows === 'all' ? TANGO_PATH : m.windows);

// ------------------------------------------------------------------ time helpers
const DAY = 86400;
/** h in [from, to) on a 24 h clock, wrapping past midnight */
export function inHours(h, w) {
  if (!w) return true;
  const [a, b] = w, x = ((h % 24) + 24) % 24;
  return a <= b ? x >= a && x < b : x >= a || x < b;
}
/** a local date's key (YYYY-MM-DD) */
export const dayKey = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
/** is it a party night at this hour (Fri / Sat 8 pm → 2 am — core/party.js's window; dow 0 = Sunday). key (that day's 'y-m-d', optional):
 *  + THE HOMECOMING — the night before Thanksgiving (core/party.js#partyDow) */
export const partyAt = (dow, h, key) => {
  if (key) { const [y, m, d] = String(key).split('-').map(Number); dow = partyDow(y, m, d, dow); }
  return ((dow === 5 || dow === 6) && h >= 19.5) || ((dow === 6 || dow === 0) && h < 2.25);
};
/** partyAt at an absolute time (s) in a zone (off: minutes east of UTC) */
export const partyAtT = (t, off) => { const lt = t + (off || 0) * 60, d = new Date(lt * 1000); return partyAt(d.getUTCDay(), ((lt / 3600) % 24 + 24) % 24, `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`); };
/** the rooms are lit (the evening's dusk → the morning's dawn; dark = [duskH, dawnH]; none known: 19 → 7) */
export const darkAt = (h, dark) => { const [d, w] = dark || [19, 7]; return h >= d || h < w; };

/** a routine's start today (seconds after local midnight): its hour + a few seeded minutes, the same for everyone */
export function routineAt(id, key) {
  const m = MOMENT[id];
  if (!m || m.at == null) return null;
  const r = rngFrom(hashString(`routine|${id}|${key}`));
  return Math.round(m.at * 3600 + r() * (m.jitter || 0) * 60);
}

// ------------------------------------------------------------------ THE LEGENDARY CALENDAR
/** the legendary nights of a year: `nights` dates a year (one a season, never the same two years running), each with `plays`
 *  starts through its hours (seconds after local midnight) — { 'YYYY-MM-DD': [s, s, s] } */
export function legendNights(y, id = 'tango') {
  const m = MOMENT[id], n = (m && m.nights) || 4, plays = (m && m.plays) || 3, [h0, h1] = (m && m.hours) || [21, 23];
  const r = rngFrom(hashString(`legend|${id}|${y}`)), out = {};
  for (let q = 0; q < n; q++) {
    const mo = 1 + Math.floor((12 / n) * q + r() * (12 / n)), d = 1 + Math.floor(r() * 28);
    const span = (h1 - h0) * 3600 - (m ? m.len : 30), starts = [];
    for (let i = 0; i < plays; i++) starts.push(Math.round(h0 * 3600 + span * ((i + 0.15 + r() * 0.7) / plays)));
    out[dayKey(y, mo, d)] = starts;
  }
  return out;
}

// ------------------------------------------------------------------ WIN2 — THE EDGE WINDOWS' MOOD LIGHTS (the owner: light + shadow only)
/** the moods: TV blue flicker · an eerie RED darkroom bulb · a wavering CANDLE · a green BANKER's lamp + a shadow passing · HEADLIGHT sweeps
 *  through slatted blinds · a CEILING FAN's turning shadow · LIGHTS OUT at ~midnight · a PARTY colour cycle (party nights only) */
export const EDGE_MOODS = Object.freeze(['tv', 'red', 'candle', 'banker', 'headlights', 'fan', 'out']);
/** tonight's moods for the two edge windows (seeded by the night's date: every phone the same), never the same in both; a party night
 *  turns one into 'party'; the holidays tint them (hol: 'halloween' | 'christmas'); off: the lights-out minute (s after midnight) →
 *  { edge2, edge3, tint, off } */
export function edgeMoods(key, ctx = {}) {
  const r = rngFrom(hashString(`edge-mood|${key}`)), n = EDGE_MOODS.length;
  const a = EDGE_MOODS[Math.floor(r() * n)], b = EDGE_MOODS[(EDGE_MOODS.indexOf(a) + 1 + Math.floor(r() * (n - 1))) % n];
  const out = { edge2: a, edge3: b, tint: ctx.hol === 'halloween' ? 'halloween' : ctx.hol === 'christmas' ? 'christmas' : null, off: Math.round(23.8 * 3600 + r() * 1800) };
  if (ctx.party) out[r() < 0.5 ? 'edge2' : 'edge3'] = 'party';
  return out;
}
/** the eerie-red mood is on tonight (the eyes never share a night with it) */
/** SP5 — THE EDGE WINDOWS' ROLLER SHADES (the owner: the curtains looked like bow ties and blocked what little window there is → NO
 *  curtains in the half-cut windows; a plain 1920s roller shade at a seeded HEIGHT each night): 'up' (the full mood light), 'half' (the
 *  light + its shadows below one straight edge), 'down' (the shade itself a glowing translucent panel with the mood's shadows playing ON
 *  it). The two edge windows never at the same height the same night. → { edge2, edge3 } */
export const SHADE_HEIGHTS = Object.freeze(['up', 'half', 'down']);
export function edgeShades(key, ctx = {}) {
  const r = rngFrom(hashString(`shade|${ctx.seed || 1924}|${key}`));
  const a = SHADE_HEIGHTS[Math.floor(r() * 3)], b = SHADE_HEIGHTS[(SHADE_HEIGHTS.indexOf(a) + 1 + Math.floor(r() * 2)) % 3];
  return { edge2: a, edge3: b };
}
export const redMoodNight = (key, ctx = {}) => { const m = edgeMoods(key, ctx); return m.edge2 === 'red' || m.edge3 === 'red'; };

// ------------------------------------------------------------------ WIN2 — THE EYES' CALENDAR
const ymdOf = key => String(key).split('-').map(Number);
const shiftKey = (key, days) => { const [y, m, d] = ymdOf(key), t = new Date(Date.UTC(y, m - 1, d + days)); return dayKey(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()); };
/**
 * the eyes' nights of a month: TWO weekend nights (Fri / Sat evenings, seeded by the month), each with `plays` starts between 11 pm and
 * 4 am (seconds after the EVENING's midnight — the small hours' starts run past 86400) → { 'YYYY-MM-DD': [s, s, s] }; a legendary's
 * night (harbor-legend.js) or a night the edge windows show the eerie-red mood is skipped (ctx.mothman: none yet — the hook)
 */
export function eyesNights(y, m, ctx = {}) {
  const M = MOMENT.eyes, r = rngFrom(hashString(`eyes|${y}|${m}`)), out = {};
  // (the eligible weekend nights first — a legendary's night, an eerie-red night, a Mothman night are never in the draw — then two of them)
  const days = []; for (let d = 1; d <= 31; d++) { const t = new Date(Date.UTC(y, m - 1, d)); if (t.getUTCMonth() !== m - 1) break; const dow = t.getUTCDay(); if ((dow === 5 || dow === 6) && !legendNight(y, m, d) && !redMoodNight(dayKey(y, m, d), ctx) && !ctx.mothman) days.push(d); }
  const picks = []; while (picks.length < 2 && days.length) { const i = Math.floor(r() * days.length); picks.push(days.splice(i, 1)[0]); }
  for (const d of picks.sort((a, b) => a - b)) {
    const key = dayKey(y, m, d);
    const span = (M.hours[1] + 24 - M.hours[0]) * 3600 - M.len, starts = [];
    for (let i = 0; i < M.plays; i++) starts.push(Math.round(M.hours[0] * 3600 + span * ((i + 0.1 + r() * 0.8) / M.plays)));
    out[key] = starts;
  }
  return out;
}
/** the eyes' plays landing on a day's clock: tonight's before midnight + last night's after it (shifted back a day) → [{ t0, n, win }] */
export function eyesPlaysOn(key, ctx = {}) {
  const [y, m] = ymdOf(key), prev = shiftKey(key, -1), [py, pm] = ymdOf(prev), out = [];
  const pick = (k, i) => MOMENT.eyes.windows[Math.floor(rngFrom(hashString(`eyes-win|${k}|${i}`))() * MOMENT.eyes.windows.length)];
  const tonight = eyesNights(y, m, ctx)[key] || []; tonight.forEach((t0, i) => { if (t0 < 86400) out.push({ t0, n: i, win: pick(key, i) }); });
  const last = eyesNights(py, pm, ctx)[prev] || []; last.forEach((t0, i) => { if (t0 >= 86400) out.push({ t0: t0 - 86400, n: i, win: pick(prev, i) }); });
  return out;
}

// ------------------------------------------------------------------ THE DAY'S SCHEDULE (in HOUR BLOCKS)
/** the day's fixed starts: the routines (their seeded minutes) + the legendary night's plays → [{ id, win, t0, len, n }] */
export function fixedPlan(key, only = null, ctx = {}) {
  const out = [], y = Number(String(key).slice(0, 4));
  for (const m of MOMENTS) {
    if (only && !only.includes(m.id)) continue;
    if (m.rarity === 'routine') out.push({ id: m.id, win: m.windows[0], t0: routineAt(m.id, key), len: m.len, n: 0 });
    else if (m.calendar === 'eyes') { for (const p of eyesPlaysOn(key, ctx)) out.push({ id: m.id, win: p.win, t0: p.t0, len: m.len, n: p.n }); }   // (WIN2: its own calendar, in ONE window)
    else if (m.calendar === 'thanksgiving') out.push(...holidayPlays(m, key, ctx));   // (11a-2: the holiday's room life, by its date)
    else if (m.rarity === 'legendary') { const s = legendNights(y, m.id)[key]; if (s) s.forEach((t0, i) => out.push({ id: m.id, win: 'all', t0, len: m.len, n: i })); }
  }
  return out;
}
/** 11a-2 — the fourth Thursday of November (Thanksgiving) of year y → its day of the month */
const thanksgivingOf = y => { const dow = new Date(Date.UTC(y, 10, 1)).getUTCDay(); return 1 + ((4 - dow + 7) % 7) + 21; };
/** is local day `key` ('YYYY-MM-DD') the holiday a calendar names? (11a-2: 'thanksgiving') */
export function holidayDay(cal, key) {
  const [y, m, d] = String(key).split('-').map(Number);
  return cal === 'thanksgiving' && m === 11 && d === thanksgivingOf(y);
}
/** 11a-2 — a holiday ROOM-LIFE moment's plays on day `key` (PURE): from `from` (+ a seeded 0–6 min) to `to`, back-to-back chunks of
 *  m.len s in its window → [{ id, win, t0, len, n, first?, last? }] (first: the people arrive in it · last: they leave). Never the boss's. */
export function holidayPlays(m, key, ctx = {}) {
  if (!holidayDay(m.calendar, key)) return [];
  const win = windowsOf(m).find(w => w !== BOSS_ROOM);
  if (!win) return [];
  const r = rngFrom(hashString(`hol|${m.id}|${key}|${ctx.seed || 1924}`)), t0 = Math.round(m.from * 3600 + r() * 360), t1 = Math.round(m.to * 3600 - r() * 360);
  const n = Math.max(1, Math.round((t1 - t0) / m.len)), out = [];
  for (let i = 0; i < n; i++) out.push({ id: m.id, win, t0: t0 + i * m.len, len: m.len, n: i, ...(i === 0 ? { first: true } : {}), ...(i === n - 1 ? { last: true } : {}) });
  return out;
}
/**
 * hourPlan(key, hour, ctx) → [{ id, win, t0, len, n }] sorted by t0 (seconds after local midnight) — one HOUR of the day's schedule:
 * the fixed starts in it + the random draws, each seeded by (date, hour) so a phone builds only the hour it needs (< 1 ms) and every
 * phone gets the same (11a-1: ctx.hol — the holiday's id, stage, eve + window weight — gates the holiday scenes). A random draw starts and ENDS inside its hour (the next hour's block can't see it), never in a window a fixed
 * start holds, never two in one window, never more than MAX_AT_ONCE together. ctx: { dow (0 Sun … 6 Sat), month, dark: [duskH,
 * dawnH], wx?: a weather kind, only?: [ids] (a subset — tests), seed? }.
 */
export function hourPlan(key, hour, ctx = {}) {
  const r = rngFrom(hashString(`moments|${key}|${hour}|${ctx.seed || 1924}`));
  const H0 = hour * 3600, H1 = H0 + 3600;
  const fixed = fixedPlan(key, ctx.only, ctx).filter(e => e.t0 + e.len > H0 - 120 && e.t0 < H1 + 120);
  const out = fixed.filter(e => e.t0 >= H0 && e.t0 < H1), busyTill = {}, last = {};
  const pool = MOMENTS.filter(m => RARITY[m.rarity] && (!ctx.only || ctx.only.includes(m.id)));
  const free = (win, a, b) => (busyTill[win] || 0) <= a && !fixed.some(e => (e.win === win || e.win === 'all') && e.t0 < b + 1.5 && e.t0 + e.len + 1.5 > a);
  let t = H0 + 2 + r() * 6, n = hour * 1000 + 1, recent = [];
  while (t < H1) {
    recent = recent.filter(e => e.t0 + e.len > t);
    const h = t / 3600, party = partyAt(ctx.dow, h, key), cands = [];
    let wsum = 0;
    for (const m of pool) {
      if (t + m.len > H1) continue;
      if (!inHours(h, m.hours)) continue;
      if (m.light === 'night' && !darkAt(h, ctx.dark)) continue;
      if (m.days === 'weekend' && !(ctx.dow === 0 || ctx.dow === 6)) continue;
      if (m.days === 'weekday' && (ctx.dow === 0 || ctx.dow === 6)) continue;
      if (m.months && !m.months.includes(ctx.month)) continue;
      if (m.wx && !m.wx.includes(ctx.wx)) continue;
      if (m.boot && !ctx.boot) continue;              // (WIN: only on a bootleggers' night)
      if (m.noRaid && ctx.raid) continue;             // (WIN: never on a raid night)
      // (11a-1: a holiday's scene only in its season, past its stage; its weight from the build-up, × eve on its own night)
      let hw = 1;
      if (m.holiday) { const hl = ctx.hol; if (!hl || hl.id !== m.holiday || (hl.stage || 0) < (m.minStage || 0)) continue; hw = (hl.w == null ? 1 : hl.w) * (hl.eve ? (m.eve || 1) : 1); if (hw <= 0) continue; }
      const pw = (party ? (m.party == null ? 1 : m.party) : 1) * hw;
      if (pw <= 0) continue;
      if (last[m.id] != null && t - last[m.id] < (m.cooldown || 0) * (party ? 0.6 : 1)) continue;
      const wins = windowsOf(m).filter(w => w !== BOSS_ROOM && free(w, t, t + m.len));   // (SP5: never the boss's room)
      if (!wins.length) continue;
      // (never more than MAX_AT_ONCE moments together, the routines + the legend included)
      let at = 0;
      for (const e of recent) if (e.t0 < t + m.len) at++;
      for (const e of fixed) if (e.t0 < t + m.len && e.t0 + e.len > t) at++;
      if (at >= MAX_AT_ONCE) continue;
      const w = RARITY[m.rarity] * pw;
      cands.push({ m, wins, w }); wsum += w;
    }
    // (RARITY is a chance a slot: when only a few rare / uncommon ones may play — by day — the rest of the slot stays EMPTY, so a rare
    // moment stays rare instead of taking every slot nobody else wants)
    const idle = Math.max(0, 1 - wsum), roll = r() * (wsum + idle);
    if (cands.length && roll < wsum) {
      let x = roll, c = cands[0];
      for (const k of cands) { x -= k.w; if (x <= 0) { c = k; break; } }
      const win = c.wins[Math.floor(r() * c.wins.length)];
      const e = { id: c.m.id, win, t0: Math.round(t * 10) / 10, len: c.m.len, n: n++ };
      out.push(e); recent.push(e);
      busyTill[win] = t + c.m.len + 1.5; last[c.m.id] = t;
    }
    t += party && darkAt(h, ctx.dark) ? 7 + r() * 7 : 10 + r() * 10;
  }
  return out.sort((a, b) => a.t0 - b.t0);
}
/** the whole day (tests, the e2e's look-ahead): every hour's block */
export function dayPlan(key, ctx = {}) { const out = []; for (let h = 0; h < 24; h++) out.push(...hourPlan(key, h, ctx)); return out; }

/** the moments running at second `sec` (after local midnight) in `entries` (this hour's block + the last hour's; yesterday's with
 *  t0 shifted back a day) → [{ ...entry, p (0..1), el (s) }] */
export function momentsAt(entries, sec) {
  const on = [];
  for (const e of entries) if (e.t0 <= sec && sec < e.t0 + e.len) on.push({ ...e, el: sec - e.t0, p: (sec - e.t0) / e.len });
  return on;
}
/** 9c — WINDOW SCENES NEVER POP IN (the owner's RULE, Oct 27): a scene starts in one of two ways only — (1) its people WALK UP through the
 *  room's depth (WIN2's walkIn) / arrive by their own motion, or (2) the BLIND comes DOWN, ~2 s, the blind goes UP and the scene is there;
 *  it ENDS the same way. ENTERS_BY_MOTION: the moments whose painters bring their people in + out (walkIn, crossing the shade, the cat
 *  jumping up, the routines' own actions — the blind up at the wake, the lamp clicking on one by one, the mirror swinging); every other
 *  moment gets THE BLIND CYCLE (blindAt). The sax is 9d's rework (its own entrance there). tests/harbor-windows-rule.test.mjs */
export const ENTERS_BY_MOTION = Object.freeze(['wake', 'shop-open', 'bartender', 'lights-out', 'dance', 'toast', 'cat', 'tango', 'mirror', 'cash', 'eyes', 'table', 'football', 'sax']);
export const BLIND = Object.freeze({ down: 0.7, hold: 2.0 });
export const usesBlind = id => !!MOMENT[id] && !ENTERS_BY_MOTION.includes(id);
const sm01 = u => { const v = u < 0 ? 0 : u > 1 ? 1 : u; return v * v * (3 - 2 * v); };
/** PURE: how far a moment's blind is down (0 up … 1 down) at rel s after its start (len s long): down + held BEFORE it starts (the scene
 *  swaps under it), up over its first 0.7 s; down over its last 0.7 s, held, up again on the empty room */
export function blindAt(rel, len) {
  const D = BLIND.down, H = BLIND.hold;
  if (rel < -(D + H) || rel >= len + D + H) return 0;
  if (rel < -H) return sm01((rel + D + H) / D);
  if (rel < 0) return 1;
  if (rel < D) return 1 - sm01(rel / D);
  if (rel < len - D) return 0;
  if (rel < len) return sm01((rel - (len - D)) / D);
  if (rel < len + H) return 1;
  return 1 - sm01((rel - len - H) / D);
}
/** PURE: the blinds' levels by window at second `sec` from the day's entries (+ the last hour's) → { [win]: 0..1 } */
export function blindsAt(entries, sec) {
  const out = {};
  for (const e of entries) {
    if (e.win === 'all' || !usesBlind(e.id)) continue;
    const b = blindAt(sec - e.t0, e.len);
    if (b > 0 && b > (out[e.win] || 0)) out[e.win] = b;
  }
  return out;
}
/** SP3 — ONE STAR WINDOW AT A TIME (the owner): of the moments on now, the routines (a room's own life) + ONE star — the one that started
 *  first (the eye always knows where to look); the rest wait their turn off the stage. PURE: on → the filtered list */
export function starOnly(on) {
  let star = null;
  const own = e => MOMENT[e.id] && (MOMENT[e.id].rarity === 'routine' || MOMENT[e.id].rarity === 'holiday');   // (11a-2: a holiday's room life too)
  for (const e of on) if (MOMENT[e.id] && !own(e) && (!star || e.t0 < star.t0 || (e.t0 === star.t0 && e.id < star.id))) star = e;
  return on.filter(e => own(e) || e === star);
}
/** SP3 — THE STAGING (the owner: "too small — you can't make anything out"): how close each moment plays to the glass — a zoom about the
 *  pane's foot, so a close moment is a BOLD silhouette cropped by the frame (~60–70 % of the pane's height: head + shoulders the shape),
 *  a 'room' moment full-body a little deeper in a simplified room. 1 = as drawn. */
/** SP4 — THE LOOK of the people in each window scene (the owner: "if it's lit in the room you should be able to SEE them"):
 *  lit (real colours, the lamp's modelling, the rim) · shadow (ON the jazz room's shade — between the lamp and the window: backlit) ·
 *  silhouette (a dark room / backlit by the TV) · ghost (the holiday's own glow). windows.js draws them so; tests/sp4.test.mjs keeps
 *  every moment in the table. */
export const WINDOW_LOOKS = Object.freeze({
  wake: 'lit', 'shop-open': 'lit', bartender: 'lit', 'lights-out': 'silhouette', dance: 'shadow', toast: 'lit', sax: 'lit', cat: 'silhouette',
  fan: 'silhouette', peek: 'lit', tango: 'lit', mirror: 'lit', ghost: 'ghost', mummy: 'shadow', witchsil: 'silhouette', costume: 'lit', ofrenda: 'lit', cash: 'lit', eyes: 'light', table: 'lit', football: 'lit',
});
export const LOOK_WHY = Object.freeze({ shadow: 'on the jazz room\'s shade (backlit)', silhouette: 'a dark room, or backlit by the TV', ghost: 'the holiday\'s own glow', lit: 'in a lit room', light: 'light + shadow only — no figure (WIN2)' });
export const STAGE = Object.freeze({ eyes: 1.0, cash: 1.0, table: 1.0, football: 1.0, ghost: 1.12, mummy: 1.12, witchsil: 1.0, costume: 1.16, ofrenda: 1.1, peek: 1.55, toast: 1.45, wake: 1.4, 'lights-out': 1.3, bartender: 1.3, sax: 1.3, cat: 1.3, dance: 1.18, fan: 1.1, tango: 1, mirror: 1, 'shop-open': 1 });
/** the rooms' own steady figures (the jazz room's player, the TV couch, the bar's afternoon) — a step closer too */
export const STAGE_ROOM = 1.22;
/** the next start after `sec` (the readout + the e2e): { id, win, in: seconds } or null */
function nextMoment(plan, sec) { const e = plan.find(o => o.t0 > sec); return e ? { id: e.id, win: e.win, in: Math.round(e.t0 - sec) } : null; }

// ------------------------------------------------------------------ THE ROOMS' STATES BY THE HOUR
/**
 * What a room is doing at hour h (local, 0–24) — the routines move them (routines: { wake, shop-open, bartender, lights-out } →
 * their starts today, seconds; their ends = start + len). NEVER FULLY DARK: from the bar's close at 3 am until the upstairs wakes
 * there is always the apartment's night lamp (and the bar's last light + the sweeping until 4).
 *   apartment  'day' (after the wake, until dusk) · 'lamp' (dusk → lights out) · 'tv' (lights out → 3 am) · 'tvoff' (3 am: the TV's last
 *              flicker, TV_OFF s) · 'dark' (→ the wake: SP3 — the owner: the TV switches off and the room goes DARK until morning)
 *   bar        'closed' (4 am → the bartender) · 'open' (the bartender → 3 am: by day the half-drawn shade, at night the full bar) · 'last' (3 → 4 am)
 *   shop       'closed' · 'open' (the opening's end → 6 pm)
 */
const BAR_LAST = [3, 4], SHOP_CLOSE = 18, TV_END = 3;
/** SP3: the TV's switch-off at TV_END (s): a last flicker + the picture shrinking away */
export const TV_OFF = 3.2;
export function roomState(id, h, routines = {}) {
  const s = h * 3600, start = k => (routines[k] == null ? MOMENT[k].at * 3600 : routines[k]), end = k => start(k) + MOMENT[k].len;
  if (id === 'apartment') {
    if (h < TV_END || s >= start('lights-out')) return 'tv';
    if (s - TV_END * 3600 < TV_OFF) return 'tvoff';
    return s < end('wake') ? 'dark' : 'lamp';
  }
  if (id === 'bar') {
    if (h >= BAR_LAST[0] && h < BAR_LAST[1]) return 'last';
    if (h < BAR_LAST[0]) return 'open';
    return s >= end('bartender') ? 'open' : 'closed';
  }
  if (id === 'shop') return s >= end('shop-open') && h < SHOP_CLOSE ? 'open' : 'closed';
  return 'still';
}

// ------------------------------------------------------------------ THE TV GLOW (an owner favourite)
/**
 * The TV's light at time t (s) — IRREGULAR like real TV: SCENES of 0.4–3.5 s (cuts on a 0.35 s grid, about two in five), each its own
 * level (0.38–1) + tint (cool blue ↔ a whiter blue, now and then a warm scene), a slow drift inside a scene and a fine flicker.
 * → { k (0..1.1), tint (0 cool … 1 white-blue), warm (0..1), cut (s since the last cut) }
 */
const TV_STEP = 0.35;
const h01 = (n, salt) => { let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ salt; x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
export function tvLight(t, seed = 7, o = {}) {
  // WIN3 — THE BOSS's TV, seen from the street (the owner): on top of the cuts, LONG STEADY DIM STRETCHES (a quiet scene: ~1 slot in 5 holds
  // 7–12 s at a low level with only the fine flicker) and, LATE (o.late: ~1 am on), a CHANNEL-FLIPPING BURST now and then (a few seconds
  // of cuts every 0.12 s, each its own level + tint) — never a steady pulse
  if (o.late) { const slot = Math.floor(t / 180), b0 = slot * 180 + 15 + h01(slot, seed + 21) * 120, bLen = 2.6 + 1.6 * h01(slot, seed + 22);
    if (h01(slot, seed + 20) < 0.45 && t >= b0 && t < b0 + bLen) { const n = Math.floor((t - b0) / 0.12), el = t - b0 - n * 0.12;
      return { k: Math.max(0.12, Math.min(1.2, 0.3 + 0.9 * h01(n, seed + 23 + slot) + (el < 0.03 ? 0.25 : 0))), tint: h01(n, seed + 24), warm: h01(n, seed + 25) < 0.2 ? 1 : 0, cut: el, dim: 0, burst: 1 }; } }
  // (SP5 — THE SMALL NUDGE (the owner: "mostly calm"): longer + more frequent steady stretches (~1 slot in 2 holds 12–22 s), gentler
  // + fewer cuts, a narrower level range, the warm flashes 4× rarer, the late bursts rarer — everything else as it was)
  { const slot = Math.floor(t / 45), q0 = slot * 45 + 3 + h01(slot, seed + 11) * 8, qLen = 14 + 10 * h01(slot, seed + 12);
    if (h01(slot, seed + 10) < 0.7 && t >= q0 && t < q0 + qLen) { const u = (t - q0) / qLen, fade = Math.min(1, u * 14, (1 - u) * 14); const lv = 0.3 + 0.08 * h01(slot, seed + 14), fl = 0.01 * Math.sin(t * 31) + 0.006 * Math.sin(t * 57.3);
      return { k: Math.max(0.12, lv + fl), tint: h01(slot, seed + 15), warm: 0, cut: t - q0, dim: 1, quiet: fade }; } }
  const b = Math.floor(t / TV_STEP);
  let c = b;
  for (let i = 0; i < 10; i++, c--) if (h01(c, seed) < 0.28) break;     // (the last cut; a scene lasts ≤ 3.5 s — SP5: cuts rarer, scenes longer)
  // (WIN — the owner: "the glow must FLICKER much more": bigger jumps at the cuts (0.4 → 1.1), DIM spells (~1 scene in 7 at a quarter
  // level), warm flashes, a dropped frame now and then, never a steady pulse)
  const dim = h01(c, seed + 5) < 0.16 ? 1 : 0, lv = dim ? 0.24 + 0.14 * h01(c, seed + 1) : 0.5 + 0.48 * h01(c, seed + 1), tint = h01(c, seed + 2), warm = h01(c, seed + 3) < 0.03 ? 1 : 0, el = t - c * TV_STEP;
  const drift = 0.05 * Math.sin(el * 1.7 + c), fl = 0.025 * Math.sin(t * 31 + c) + 0.015 * Math.sin(t * 57.3) + (h01(Math.floor(t * 12), seed + 7) < 0.03 ? -0.08 : 0);
  const flash = el < 0.1 && h01(c, seed + 4) < 0.2 ? 0.22 : 0;      // (a bright cut now and then)
  return { k: Math.max(0.12, Math.min(1.2, lv + drift + fl + flash)), tint, warm, cut: el, dim };
}
/** SP6 — THE BLUE TV WINDOW's COLOURS (the owner, Oct 27, picked from a 15-swatch mock-up): the set's light CUTS between scenes like
 *  channels / shots — DEEP, SATURATED blues, bright without whitening. Each palette: [the light near the set, the deeper wash further off].
 *  B (deep royal) is HOME, then A (7b's first look), H (royal, the ceiling catching it: `ceil`), N (sapphire); F (violet-blue) now + then,
 *  briefly; W (amber) a brief warm scene on the odd change. Never a pale periwinkle. */
export const TV_PAL = Object.freeze({
  B: [[40, 90, 255], [20, 45, 170]],
  A: [[64, 108, 255], [40, 70, 200]],
  H: [[45, 95, 255], [28, 62, 196]],
  N: [[20, 60, 255], [10, 30, 160]],
  F: [[85, 85, 255], [50, 48, 190]],
  W: [[255, 190, 110], [196, 122, 58]],
});
const TV_SLOT = 60;
/** the scene list of one minute (seeded: the same on every phone) → [{ id, t0, len }] — a cut every ~3–8 s (never a metronome), about a
 *  quarter of the B scenes a LONG steady stretch (12–20 s), F + W brief (1.2–2.2 s) and always followed by B (it SETTLES on the blue) */
export function tvScenes(slot, seed = 7) {
  const out = []; let t = 0, prev = 'B', i = 0;
  while (t < TV_SLOT && i < 40) {
    const u = h01(slot * 64 + i, seed + 41), r = h01(slot * 64 + i, seed + 42);
    let id = u < 0.42 ? 'B' : u < 0.6 ? 'A' : u < 0.75 ? 'H' : u < 0.88 ? 'N' : u < 0.95 ? 'F' : 'W';
    if (prev === 'F' || prev === 'W') id = 'B';                                      // (a brief scene always settles back on B)
    else if (prev !== 'B' && id !== 'B' && r < 0.5) id = 'B';                        // (and the others drift home often)
    if (id === prev) id = id === 'B' ? 'A' : 'B';                                     // (a cut is a change)
    const brief = id === 'F' || id === 'W', long = id === 'B' && h01(slot * 64 + i, seed + 43) < 0.25;
    const len = brief ? 1.2 + r : long ? 12 + 8 * r : 3 + 5 * r;
    out.push({ id, t0: t, len: Math.min(len, TV_SLOT - t) });
    t += len; prev = id; i++;
  }
  return out;
}
const tvCache = new Map();
/** the scene on screen at t (seconds) → { id, col: [near, far], ceil (H), el (seconds since the cut) } */
export function tvScene(t, seed = 7) {
  const slot = Math.floor(t / TV_SLOT), key = slot * 131 + seed;
  let list = tvCache.get(key);
  if (!list) { if (tvCache.size > 8) tvCache.clear(); list = tvScenes(slot, seed); tvCache.set(key, list); }
  const el = t - slot * TV_SLOT;
  let sc = list[0];
  for (const s of list) if (el >= s.t0) sc = s;
  return { id: sc.id, col: TV_PAL[sc.id], ceil: sc.id === 'H' ? 1 : 0, el: el - sc.t0 };
}
/** WIN3 — a SHADOW across the ceiling's glow now and then (someone shifting, getting up for a snack — only ever a shadow): every ~2–3 min
 *  a soft dark shape crosses the back wall over ~2.6 s → { u (0..1 across, the direction in dir), a (0..1) } | null */
export function tvShadow(t, seed = 7) {
  const slot = Math.floor(t / 140), s0 = slot * 140 + 8 + h01(slot, seed + 31) * 110, len = 2.4 + 0.8 * h01(slot, seed + 32);
  if (h01(slot, seed + 30) < 0.22 || t < s0 || t >= s0 + len) return null;
  const u = (t - s0) / len;
  return { u, a: Math.sin(Math.PI * u), dir: h01(slot, seed + 33) < 0.5 ? -1 : 1 };
}
/** WIN3 — the holiday film's tint on the boss's screen (a faint shift of the blue): Halloween a sickly orange-green, Christmas red + green
 *  → { col: [r,g,b], w (the mix weight) } | null */
export function tvHolidayTint(holId) {
  if (holId === 'halloween') return { col: [150, 190, 70], w: 0.22 };
  if (holId === 'christmas') return { col: [235, 90, 80], w: 0.2 };
  return null;
}

// ------------------------------------------------------------------ SP5 — THE BOSS's ROOM BY DAY, THE TELL, THE WATCH (PURE)
/** THE BOSS's ROOM BY DAY (the owner): the SHADE DRAWN all day — the one window that never opens to the daylight; a few rare, seeded
 *  events a day, never two at once: 'peek' (the shade lifts an inch and drops — someone peeking out; 3.2 s), 'smoke' (a thin curl of
 *  cigar smoke out of the sash cracked open at the top; 50 s), 'shadow' (on OVERCAST days only — ctx.overcast: a shadow crossing behind
 *  the lit shade; 4.2 s). 5–8 a day between 7:30 and 21:30 → [{ id, t0, len }] (seconds after local midnight), the same on every phone */
export function bossDayPlan(key, ctx = {}) {
  const r = rngFrom(hashString(`boss|${ctx.seed || 1924}|${key}`)), out = [], n = 5 + Math.floor(r() * 4);
  let t = 7.5 * 3600 + r() * 1800;
  for (let i = 0; i < n && t < 21.3 * 3600; i++) {
    const u = r(); let id = u < 0.42 ? 'peek' : u < 0.78 ? 'smoke' : 'shadow';
    if (id === 'shadow' && !ctx.overcast) id = u < 0.9 ? 'peek' : 'smoke';
    out.push({ id, t0: Math.round(t), len: id === 'peek' ? 3.2 : id === 'smoke' ? 50 : 4.2 });
    t += (50 + r() * 110) * 60;
  }
  return out;
}
/** the boss's day event running at `sec` → { id, el, p } | null */
export function bossDayAt(plan, sec) { for (const e of plan) if (sec >= e.t0 && sec < e.t0 + e.len) return { id: e.id, el: sec - e.t0, p: (sec - e.t0) / e.len }; return null; }
/** THE BOOTLEGGERS' TELL (the owner, DECIDED): a VIOLET lamp behind the drawn shade + a dark SPADE cut-out against it, lit from 3 pm
 *  before Saturday's big delivery (~6:30–7 pm) and from 5 pm before a quiet weeknight run (~10:40–11:15 pm) UNTIL THE TRUCK ARRIVES
 *  (truckAt: the show's start, seconds after local midnight — core/harbor-workers.js; without it the window's own middle), then off →
 *  0..1 (a fade in over 25 s, a snap off at the truck) */
export const SIGNAL_FROM = Object.freeze({ sat: 15, week: 17 });
export function bossSignal(sec, { boot = false, sat = false, truckAt = null } = {}) {
  if (!boot) return 0;
  const from = (sat ? SIGNAL_FROM.sat : SIGNAL_FROM.week) * 3600, to = truckAt != null ? truckAt : (sat ? 18.65 : 22.95) * 3600;
  if (sec < from || sec >= to) return 0;
  return Math.min(1, (sec - from) / 25);
}
/** THE BOSS AT THE SHADE on a party night — 11a-2 (the owner's SP5 phone review, Oct 26 9:13 + 9:24 pm: "fades in, stays a moment +
 *  fades out" → he WALKS UP to the shade, STANDS there ~15 min, WALKS AWAY, is gone ~10 min, comes BACK for another ~15 min… for about
 *  1 h 45 min at the party's PEAK, then done for the night). The shade is all the way down, glowing with the set's light; his shadow on
 *  it sharpens + darkens as he nears it (from the room's depth, a big soft blur) and blurs off as he leaves. While he stands: TINY LIFE —
 *  a weight shift now + then, the cigar's ember brightening on a draw (raised to the mouth), a slow turn of the head.
 *  The plan's clock `s` = seconds since the party's PEAK began (the same on every phone; a page opened mid-way joins mid-stand);
 *  `demo` (&force=boss-watch, the panel's row) = a short preview cycle from the flag (stands of 40 s, 12 s away, forever). */
export const BOSS_WATCH = Object.freeze({ start: [90, 330], stands: 4, stand: [15 * 60, 18 * 60], away: [10 * 60, 13 * 60], up: 7, off: 6,
  demo: { start: 2, stand: 40, away: 12 } });
/** the night's stands (PURE): [{ t0 (he sets off toward the shade), t1 (gone from it) }] in the plan's seconds */
export function bossWatchPlan(seed = 11, { demo = false, n = null } = {}) {
  const W = BOSS_WATCH, out = [];
  if (demo) { let t = W.demo.start; for (let i = 0; i < (n || 400); i++) { out.push({ t0: t, t1: t + W.up + W.demo.stand + W.off }); t += W.up + W.demo.stand + W.off + W.demo.away; } return out; }
  let t = W.start[0] + (W.start[1] - W.start[0]) * h01(1, seed + 50);
  for (let i = 0; i < W.stands; i++) {
    const st = W.stand[0] + (W.stand[1] - W.stand[0]) * h01(i, seed + 51), aw = W.away[0] + (W.away[1] - W.away[0]) * h01(i, seed + 52);
    out.push({ t0: t, t1: t + W.up + st + W.off }); t += W.up + st + W.off + aw;
  }
  return out;
}
const ease = v => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
/** a slow seeded wander (−1..1): a new target every ~`per` s (± a third), eased over `ease` s — the weight shift, the head's turn */
function wander(s, per, ez, seed, salt) {
  const k = Math.floor(s / per), u = s - k * per, at = v => h01(v, seed + salt) * 2 - 1;
  return at(k - 1) + (at(k) - at(k - 1)) * ease(u / ez);
}
/** his shadow at `s` (the plan's seconds) → null (not at the shade) | { phase 'up' | 'stand' | 'away', a (its darkness 0..1), near (0..1:
 *  1 = against the shade — sharp; 0 = deep in the room — a big soft blur), x (across the pane), shift (−1..1 the weight), head (−1..1
 *  a turn), ember (0..1: a draw — the cigar at the mouth), hold (0..1: the cigar's faint glow at his side between draws), stand (i) } */
export function bossWatchAt(plan, s, seed = 11) {
  const W = BOSS_WATCH;
  for (let i = 0; i < plan.length; i++) {
    const p = plan[i];
    if (s < p.t0 || s >= p.t1) continue;
    const el = s - p.t0, left = p.t1 - s, x0 = 0.44 + 0.24 * h01(i, seed + 53);
    let phase = 'stand', near = 1, side = 0;
    if (el < W.up) { phase = 'up'; near = ease(el / W.up); side = (1 - near) * (h01(i, seed + 54) < 0.5 ? -1 : 1); }
    else if (left < W.off) { phase = 'away'; near = ease(left / W.off); side = (1 - near) * (h01(i, seed + 55) < 0.5 ? -1 : 1); }
    const a = Math.pow(near, 0.6);
    const sl = Math.max(0, el - W.up);          // (the stand's own clock)
    const shift = phase === 'stand' ? wander(sl, 26, 1.8, seed + i * 7, 56) : 0, head = phase === 'stand' ? wander(sl + 9, 34, 2.6, seed + i * 7, 57) : 0;
    // the draws: one every 30–55 s (seeded per draw), 2.6 s each (the hand up 0.5 s, the ember flaring, down) — never in the walk
    let ember = 0, k = 0, t = 12 + 10 * h01(i, seed + 58);
    while (t < sl && k < 80) { if (sl < t + 2.6) { const u = (sl - t) / 2.6; ember = Math.sin(Math.PI * Math.min(1, u * 1.15)) * (u < 0.85 ? 1 : (1 - u) / 0.15); break; } t += 30 + 25 * h01(k++, seed + i * 13 + 59); }
    return { phase, a: +a.toFixed(4), near: +near.toFixed(4), x: x0 + 0.2 * side, shift, head, ember: phase === 'stand' ? Math.max(0, ember) : 0, hold: phase === 'stand' ? 0.22 : 0.1, stand: i };
  }
  return null;
}
/** (SP5's old name, kept for callers: the plan's stand at `s` for the default plan) */
export function bossWatch(s, seed = 11, demo = false) { return bossWatchAt(bossWatchPlan(seed, { demo }), s, seed); }

// ------------------------------------------------------------------ WIN3 — THE QUIET NIGHTS (the boss's glow the only light on)
const dowOfKey = key => { const [y, m, d] = key.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
/** THE QUIET NIGHTS (the owner: "some nights it's the only one on" — variety, never stale): ~1 night in 6, mostly Sun–Wed (a few Thursdays),
 *  never Friday / Saturday (the party nights) nor a party night by ctx.party. key = the EVENING's date (the night runs into the next day) */
export function quietNight(key, ctx = {}) {
  if (ctx.party) return false;
  const dow = dowOfKey(key);
  if (dow === 5 || dow === 6) return false;
  const r = rngFrom(hashString(`quiet|${ctx.seed || 1924}|${key}`))();
  return r < (dow === 4 ? 0.12 : 0.25);
}
/** the rooms that go to bed on a quiet night (the apartment's TV never does; the shop is dark at night anyway) */
export const BED_ROOMS = Object.freeze(['back', 'jazz', 'bar', 'edge2', 'edge3']);
/** the BEDTIMES of a quiet night: each room's lamp-off, seconds after MIDNIGHT, one by one every ~7–15 min from ~00:20 in a seeded order
 *  (every phone the same) → { back, jazz, bar, edge2, edge3 } — the last one out by ~01:35 */
export function bedtimes(key, ctx = {}) {
  const r = rngFrom(hashString(`bed|${ctx.seed || 1924}|${key}`)), order = [...BED_ROOMS];
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  let t = 20 * 60 + r() * 10 * 60; const out = {};
  for (const id of order) { out[id] = Math.round(t); t += 7 * 60 + r() * 8 * 60; }
  return out;
}
/** a room's level on a quiet night at s seconds after midnight (negative = before it): 1 until its bedtime, then the lamp CLICKS off (a
 *  stutter: off, a flash back, off for good) → 0 — until 3 am, when the TV clicks off too and the night goes on as every night */
export function bedLevel(bed, id, s) {
  const b = bed ? bed[id] : null;
  if (b == null || s < b || s >= TV_END * 3600) return 1;   // (the beds end at 3 am with the TV's click-off: the night goes on as every night — SP3's never-fully-dark floor)
  const e = s - b;
  return e < 0.12 ? 0.3 : e < 0.2 ? 0.85 : e < 0.3 ? 0.12 : 0;
}

/** THE LATE TVs across the skyline (screens/harbor/lights.js): their level at hour h (local 0–24) — on from ~10 pm, full by 10:20,
 *  fading out ~2:40 → 3 am; the same hours as the speakeasy's own TV upstairs */
export function lateTvK(h) {
  const x = h < 12 ? h + 24 : h, e = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  return e(22, 22.33, x) * (1 - e(26.67, 27, x));
}

// ------------------------------------------------------------------ WIN3 — THE PARTY IN THE WINDOWS (PURE)
// The owner (Oct 26): on PARTY NIGHTS, during the party's PEAK, the blinds go up in every window ONE ROOM AT A TIME (~every 10 s, the
// whole building within ~60 s, a seeded order each night), every room ONE BIG DANCE PARTY in its OWN neon colour (never two alike),
// winding down the same way at the end; the boss's TV room never joins; the edge windows join with their party cycle.
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const PARTY_ROOMS = Object.freeze(['bar', 'jazz', 'back', 'edge2', 'edge3']);
export const PARTY_COLS = Object.freeze([[255, 46, 151], [46, 230, 255], [179, 107, 255], [255, 196, 50], [125, 255, 106], [255, 90, 60]]);   // magenta · cyan · violet · amber · green · coral
/** tonight's window party (seeded on the evening's date — every phone the same): the rooms' ORDER + the second each goes up (0 → ~50)
 *  + each room's OWN colour → { order, at: { id: s }, col: { id: [r,g,b] } } */
export function windowParty(key, ctx = {}) {
  const r = rngFrom(hashString(`wparty|${ctx.seed || 1924}|${key}`)), order = [...PARTY_ROOMS], cols = [...PARTY_COLS];
  for (const a of [order, cols]) for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const at = {}, col = {}; let t = 1 + r() * 3;
  order.forEach((id, i) => { at[id] = Math.round(t); col[id] = cols[i]; t += 8 + r() * 5; });
  return { order, at, col };
}
/** THE WIND-DOWN's length (s) before the peak's end; a room's level at `s` seconds since the peak began and `left` seconds before its end:
 *  the blinds up over 1.6 s at its turn, down in the same order over the last ~60 s (each over 1.2 s) → 0..1 */
export const PARTY_DOWN = 60;
export function partyRoomK(P, id, s, left) {
  const i = P.order.indexOf(id); if (i < 0 || P.at[id] == null) return 0;
  const up = clamp01((s - P.at[id]) / 1.6), downAt = PARTY_DOWN - i * (PARTY_DOWN / P.order.length);
  const down = left == null ? 0 : clamp01((downAt - left) / 1.2);
  return up * (1 - down);
}
/** the window party's shape tonight at the peak: P = windowParty(key); s / left as above → { on, k: { id: 0..1 }, cut } */
export function windowPartyAt(P, s, left, raidS = null) {
  const k = {}; let on = false;
  const cut = raidS != null && raidS >= 0;
  for (const id of P.order) { k[id] = cut ? 0 : partyRoomK(P, id, s, left); if (k[id] > 0.01) on = true; }
  return { on, k, cut };
}
