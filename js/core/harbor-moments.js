// CITY 2.0 — THE HARBOR, PART 7b: THE SPEAKEASY'S LIFE — the WINDOW MOMENTS catalogue, the day's schedule and the rooms' states
// by the hour (PURE — tested in tests/harbor-moments.test.mjs; drawn by screens/harbor/windows.js; docs/harbor.md#part-7b).
//
// THE CATALOGUE: every moment is ONE entry — its window(s), when it may happen, its rarity, its length + cooldown, and the name of
// its painter in screens/harbor/windows.js (PAINT[id]). ADDING A MOMENT LATER = one entry here + one painter there (+ its row
// appears in THE PREVIEW PANEL's WINDOWS category by itself, and &force=window&moment=<id> previews it).
//   rarity     routine (fixed in the day: `at` + a seeded few minutes) · common · uncommon · rare (random draws weighted by
//              RARITY) · legendary (its own calendar: a few nights a year, `plays` times through the evening)
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

export const RARITY = Object.freeze({ common: 1, uncommon: 0.34, rare: 0.008 });
export const RARITIES = Object.freeze(['routine', 'common', 'uncommon', 'rare', 'legendary']);
export const WINDOW_IDS = Object.freeze(['edge2', 'bar', 'jazz', 'edge3', 'apartment', 'back', 'shop']);
/** the tango's way round the building: the top floor left → right, then the bar floor right → left */
export const TANGO_PATH = Object.freeze(['edge3', 'back', 'apartment', 'jazz', 'bar', 'edge2']);
export const MAX_AT_ONCE = 2;

export const MOMENTS = Object.freeze([
  // ---- ROUTINES (fixed in the day; each also moves its room to its next state — roomState below)
  { id: 'wake', label: 'THE UPSTAIRS WAKES', rarity: 'routine', windows: ['apartment'], at: 7, jitter: 8, len: 42, kind: 'a big silhouette motion: the blind up, a stretch, a look out at the morning' },
  { id: 'shop-open', label: 'THE BARBERSHOP OPENS', rarity: 'routine', windows: ['shop'], at: 9, jitter: 3, len: 44, kind: 'a light change + people: the lamp on, the barber in, OPEN, the first customer in the chair' },
  { id: 'bartender', label: 'THE BARTENDER ARRIVES', rarity: 'routine', windows: ['bar'], at: 16, jitter: 6, len: 52, kind: 'lights on one by one behind a half-drawn shade, a glass polished' },
  { id: 'lights-out', label: 'LIGHTS OUT · THE TV', rarity: 'routine', windows: ['apartment'], at: 22, jitter: 12, len: 16, kind: 'the lamp clicks off, the TV flickers on, someone settles on the couch' },
  // ---- the random draws
  { id: 'dance', label: 'A COUPLE DANCING', rarity: 'common', windows: ['jazz'], hours: [19.5, 2], light: 'night', len: 9, cooldown: 30, party: 2, kind: 'big silhouettes crossing the shade' },
  { id: 'toast', label: 'A TOAST AT THE BAR', rarity: 'common', windows: ['bar'], hours: [19, 2.5], light: 'night', len: 7, cooldown: 24, party: 1.6, kind: 'arms up, glasses glinting, the clink' },
  { id: 'sax', label: 'THE SAX SOLO', rarity: 'uncommon', windows: ['jazz'], hours: [20, 2], light: 'night', len: 15, cooldown: 200, party: 1.5, kind: 'the sax player’s shadow swaying hard on the blind' },
  { id: 'cat', label: 'THE CAT ON THE SILL', rarity: 'uncommon', windows: ['apartment', 'edge3', 'edge2'], hours: null, len: 26, cooldown: 240, kind: 'the cat: up onto the sill, settles, tail flicking, down again' },
  // 9a — THE WEATHER ON THE GLASS (the plan's wx gate): a DESK FAN turning on the sill on hot afternoons (the real temperature ≥ HOT_C)
  { id: 'fan', label: 'A FAN ON A HOT DAY', rarity: 'common', windows: ['apartment'], hours: [11.5, 21], len: 55, cooldown: 300, wx: ['hot'], starter: false, kind: 'a desk fan on the sill, its blades a blur, the curtain stirring' },
  { id: 'peek', label: 'A PEEK AT THE STREET', rarity: 'rare', windows: ['apartment', 'jazz'], hours: [7.5, 2], len: 6.5, cooldown: 1800, kind: 'a silhouette behind the curtain, looking left and right' },
  { id: 'tango', label: 'THE TANGO (LEGENDARY)', rarity: 'legendary', windows: 'all', hours: [20.5, 23.75], light: 'night', len: 30, plays: 3, nights: 4, kind: 'a top hat + a flapper dress tango past every window in turn' },
  // ---- THE HIDDEN MIRROR DOOR (the barbershop's back wall — not one of the starter ten: the speakeasy's own secret)
  // ---- 11a-1 — THE HOLIDAYS' WINDOW SCENES (core/harbor-holiday.js gates them: holiday = its id, minStage = how far the build-up must
  // be, eve = × its weight on the holiday's own night; ctx.hol = { id, stage, eve, w (the build-up's window weight 0..1) })
  { id: 'ghost', label: 'A GHOST BEHIND THE CURTAIN', rarity: 'common', holiday: 'halloween', minStage: 0.45, windows: ['apartment', 'back'], hours: [18, 3], light: 'night', len: 11, cooldown: 70, eve: 2.4, starter: false, kind: 'a pale glowing sheet rising out of the room’s shadows, drifting across behind the glass, its eyes looking out, the room’s light shivering' },
  { id: 'mummy', label: 'A MUMMY ON THE SHADE', rarity: 'common', holiday: 'halloween', minStage: 0.6, windows: ['jazz'], hours: [19, 2.5], light: 'night', len: 10, cooldown: 110, eve: 2, starter: false, kind: 'a mummy’s shadow lurching across the jazz room’s shade, arms out stiff, its loose wraps swinging' },
  { id: 'witchsil', label: 'A WITCH AT HER CAULDRON', rarity: 'common', holiday: 'halloween', minStage: 0.7, windows: ['apartment', 'back'], hours: [19, 2.5], light: 'night', len: 14, cooldown: 160, eve: 1.6, starter: false, kind: 'a witch’s silhouette stirring a cauldron, its green glow from below, the bubbles rising' },
  { id: 'costume', label: 'THE COSTUME PARTY', rarity: 'common', holiday: 'halloween', minStage: 0.85, windows: ['bar'], hours: [19.5, 2.5], light: 'night', len: 9, cooldown: 45, eve: 3, party: 2, starter: false, kind: 'a witch, a devil, a cat + a sheet ghost raising their glasses at the bar' },
  { id: 'ofrenda', label: 'LIGHTING THE OFRENDA', rarity: 'common', holiday: 'dotd', minStage: 0.5, windows: ['back'], hours: [16.5, 23.5], len: 14, cooldown: 120, eve: 1.5, starter: false, kind: 'someone kneels at the ofrenda and lights its candles one by one, then a moment of stillness' },
  { id: 'mirror', label: 'THE MIRROR DOOR', rarity: 'uncommon', windows: ['shop'], hours: [20.75, 2.5], light: 'night', len: 8.5, cooldown: 150, party: 3, starter: false, kind: 'the mirror swings open on the bar: amber light, bottles, silhouettes, a burst of jazz' },
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
/** is it a party night at this hour (Fri / Sat 8 pm → 2 am — core/party.js's window; dow 0 = Sunday) */
export const partyAt = (dow, h) => ((dow === 5 || dow === 6) && h >= 19.5) || ((dow === 6 || dow === 0) && h < 2.25);
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

// ------------------------------------------------------------------ THE DAY'S SCHEDULE (in HOUR BLOCKS)
/** the day's fixed starts: the routines (their seeded minutes) + the legendary night's plays → [{ id, win, t0, len, n }] */
export function fixedPlan(key, only = null) {
  const out = [], y = Number(String(key).slice(0, 4));
  for (const m of MOMENTS) {
    if (only && !only.includes(m.id)) continue;
    if (m.rarity === 'routine') out.push({ id: m.id, win: m.windows[0], t0: routineAt(m.id, key), len: m.len, n: 0 });
    if (m.rarity === 'legendary') { const s = legendNights(y, m.id)[key]; if (s) s.forEach((t0, i) => out.push({ id: m.id, win: 'all', t0, len: m.len, n: i })); }
  }
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
  const fixed = fixedPlan(key, ctx.only).filter(e => e.t0 + e.len > H0 - 120 && e.t0 < H1 + 120);
  const out = fixed.filter(e => e.t0 >= H0 && e.t0 < H1), busyTill = {}, last = {};
  const pool = MOMENTS.filter(m => RARITY[m.rarity] && (!ctx.only || ctx.only.includes(m.id)));
  const free = (win, a, b) => (busyTill[win] || 0) <= a && !fixed.some(e => (e.win === win || e.win === 'all') && e.t0 < b + 1.5 && e.t0 + e.len + 1.5 > a);
  let t = H0 + 2 + r() * 6, n = hour * 1000 + 1, recent = [];
  while (t < H1) {
    recent = recent.filter(e => e.t0 + e.len > t);
    const h = t / 3600, party = partyAt(ctx.dow, h), cands = [];
    let wsum = 0;
    for (const m of pool) {
      if (t + m.len > H1) continue;
      if (!inHours(h, m.hours)) continue;
      if (m.light === 'night' && !darkAt(h, ctx.dark)) continue;
      if (m.days === 'weekend' && !(ctx.dow === 0 || ctx.dow === 6)) continue;
      if (m.days === 'weekday' && (ctx.dow === 0 || ctx.dow === 6)) continue;
      if (m.months && !m.months.includes(ctx.month)) continue;
      if (m.wx && !m.wx.includes(ctx.wx)) continue;
      // (11a-1: a holiday's scene only in its season, past its stage; its weight from the build-up, × eve on its own night)
      let hw = 1;
      if (m.holiday) { const hl = ctx.hol; if (!hl || hl.id !== m.holiday || (hl.stage || 0) < (m.minStage || 0)) continue; hw = (hl.w == null ? 1 : hl.w) * (hl.eve ? (m.eve || 1) : 1); if (hw <= 0) continue; }
      const pw = (party ? (m.party == null ? 1 : m.party) : 1) * hw;
      if (pw <= 0) continue;
      if (last[m.id] != null && t - last[m.id] < (m.cooldown || 0) * (party ? 0.6 : 1)) continue;
      const wins = windowsOf(m).filter(w => free(w, t, t + m.len));
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
/** SP3 — ONE STAR WINDOW AT A TIME (the owner): of the moments on now, the routines (a room's own life) + ONE star — the one that started
 *  first (the eye always knows where to look); the rest wait their turn off the stage. PURE: on → the filtered list */
export function starOnly(on) {
  let star = null;
  for (const e of on) if (MOMENT[e.id] && MOMENT[e.id].rarity !== 'routine' && (!star || e.t0 < star.t0 || (e.t0 === star.t0 && e.id < star.id))) star = e;
  return on.filter(e => (MOMENT[e.id] && MOMENT[e.id].rarity === 'routine') || e === star);
}
/** SP3 — THE STAGING (the owner: "too small — you can't make anything out"): how close each moment plays to the glass — a zoom about the
 *  pane's foot, so a close moment is a BOLD silhouette cropped by the frame (~60–70 % of the pane's height: head + shoulders the shape),
 *  a 'room' moment full-body a little deeper in a simplified room. 1 = as drawn. */
/** SP4 — THE LOOK of the people in each window scene (the owner: "if it's lit in the room you should be able to SEE them"):
 *  lit (real colours, the lamp's modelling, the rim) · shadow (ON the jazz room's shade — between the lamp and the window: backlit) ·
 *  silhouette (a dark room / backlit by the TV) · ghost (the holiday's own glow). windows.js draws them so; tests/sp4.test.mjs keeps
 *  every moment in the table. */
export const WINDOW_LOOKS = Object.freeze({
  wake: 'lit', 'shop-open': 'lit', bartender: 'lit', 'lights-out': 'silhouette', dance: 'shadow', toast: 'lit', sax: 'shadow', cat: 'silhouette',
  fan: 'silhouette', peek: 'lit', tango: 'lit', mirror: 'lit', ghost: 'ghost', mummy: 'shadow', witchsil: 'silhouette', costume: 'lit', ofrenda: 'lit',
});
export const LOOK_WHY = Object.freeze({ shadow: 'on the jazz room\'s shade (backlit)', silhouette: 'a dark room, or backlit by the TV', ghost: 'the holiday\'s own glow', lit: 'in a lit room' });
export const STAGE = Object.freeze({ ghost: 1.12, mummy: 1.12, witchsil: 1.0, costume: 1.16, ofrenda: 1.1, peek: 1.55, toast: 1.45, wake: 1.4, 'lights-out': 1.3, bartender: 1.3, sax: 1.3, cat: 1.3, dance: 1.18, fan: 1.1, tango: 1, mirror: 1, 'shop-open': 1 });
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
export function tvLight(t, seed = 7) {
  const b = Math.floor(t / TV_STEP);
  let c = b;
  for (let i = 0; i < 10; i++, c--) if (h01(c, seed) < 0.4) break;     // (the last cut; a scene lasts ≤ 3.5 s)
  const lv = 0.38 + 0.62 * h01(c, seed + 1), tint = h01(c, seed + 2), warm = h01(c, seed + 3) < 0.12 ? 1 : 0, el = t - c * TV_STEP;
  const drift = 0.06 * Math.sin(el * 1.7 + c), fl = 0.035 * Math.sin(t * 31 + c) + 0.02 * Math.sin(t * 57.3);
  const flash = el < 0.08 && h01(c, seed + 4) < 0.3 ? 0.18 : 0;      // (a bright cut now and then)
  return { k: Math.max(0.2, Math.min(1.1, lv + drift + fl + flash)), tint, warm, cut: el };
}

/** THE LATE TVs across the skyline (screens/harbor/lights.js): their level at hour h (local 0–24) — on from ~10 pm, full by 10:20,
 *  fading out ~2:40 → 3 am; the same hours as the speakeasy's own TV upstairs */
export function lateTvK(h) {
  const x = h < 12 ? h + 24 : h, e = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  return e(22, 22.33, x) * (1 - e(26.67, 27, x));
}
