// JAYWALK — THE SEASON CLOCK (J4 — docs/jaywalk.md "J4 — WINTER" · JT1 "SEASONS"): PURE. A day → how much AUTUMN (the turned trees, the
// leaves), how much WINTER (the ground's snow), how much CHRISTMAS (the lit trees), whether SNOW FALLS (light / heavy — picked from the day:
// every phone the same), THE HAT (Santa Dec 1–31 · the party hat Jan 1), THE FIREWORKS (Dec 31 · Jan 1) and how WET the night streets are.
// JT1 — ROOM FIRST: this module is part of THE SEASONAL PACK (seasonal.js imports it — never the start bundle); the start bundle asks only
// season-gate.js#seasonWindow (Oct 20 → Mar 1) whether to fetch the pack at all.
// A VIEW's input only: the rules, the course, the replay + the server never read it (THE GAMEPLAY LOCK — tests/jaywalk-season.test.mjs).
// THE DAY = the game's own day (the 4 am Eastern turn — core/week.js#turnDay): a solo run = its GO's day, the daily = its day, a MATCH = its
// start's day (THE FIRST GO's playAt — every phone in the room the same winter). Never the phone's clock alone.
import { turnDay } from '../../core/week.js';

const N = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 864e5);
/** 'd20261224' | '2026-12-24' → { y, m, d } (null if neither) */
export function parseDay(k) {
  const s = String(k || ''), a = /^d(\d{4})(\d{2})(\d{2})$/.exec(s) || /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!a) return null;
  const y = +a[1], m = +a[2], d = +a[3];
  return m >= 1 && m <= 12 && d >= 1 && d <= 31 ? { y, m, d } : null;
}
/** the day's key in the course's form ('d20261224') */
export const dayKeyOf = k => { const p = parseDay(k); return p ? `d${p.y}${String(p.m).padStart(2, '0')}${String(p.d).padStart(2, '0')}` : ''; };
/** FNV-1a over the day key → 0 … 1 (the same on every phone, every engine) */
function h01(s, salt) {
  let x = 0x811c9dc5 ^ salt;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 0x01000193) >>> 0; }
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 12; x = Math.imul(x, 0x297a2d39) >>> 0; x ^= x >>> 15;
  return (x >>> 0) / 4294967296;
}
/** the snow days: in every block of 4 days (by day number) exactly 2 have falling snow — WHICH 2 picked from the block (the same on every
 *  phone): ≈ half the winter, never a long dry or snowy spell beyond 4 days by chance */
const PAIRS = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
const snowsOn = n => { const b = Math.floor(n / 4), P = PAIRS[Math.floor(h01(`b${b}`, 0x5e05) * 6)]; return P.includes(n - b * 4); };
/** THE TABLE (the owner, Nov 21 — docs/games/plan.md "JAYWALK J4"): every number of the season in one place */
export const SEASON = Object.freeze({
  dust: 0.18,          // (Dec 1: a dusting — the grass shows through)
  meltDays: 7,         // (the last 7 days of February melt back to grass; Mar 1 = none)
  snowShare: 0.5,      // (half the winter days have falling snow — 2 in every 4: snowsOn)
  heavyShare: 0.45,    // (… of those, this share is heavy)
  xmasWeeks: [0.15, 0.35, 0.55],   // (Dec 1–7 · 8–14 · 15–21: a few lit trees on Dec 1, more each week)
  xmasEve: 0.75,       // (Dec 22–23)
  xmasAfter: 0.7,      // (Dec 26 → Jan 6: still up; all down on Jan 7)
  wetBase: 0.55, wetWinter: 0.45,  // (WET NEON STREETS: every night, stronger + glossier in winter)
  // JT1 — AUTUMN (the owner, Nov 22 — docs/games/plan.md "JAYWALK JT1"): Oct 20 the first trees turn (autumnStart) → full by Nov 1 → full to
  // Nov 30 → 0 on Dec 1 (WINTER takes over that morning: no overlap — never a turned tree and a snow pine on the same day)
  autumnFrom: [10, 20], autumnFull: [11, 1], autumnStart: 0.2,
});
const NONE = Object.freeze({ day: '', winter: 0, christmas: 0, snowfall: 'none', wet: SEASON.wetBase, melt: false, autumn: 0, hat: '', fireworks: '' });
/** JT1 — AUTUMN of a day number in year `y`: 0 before Oct 20 · SEASON.autumnStart on Oct 20 → 1 on Nov 1 (eased) · 1 to Nov 30 · 0 from Dec 1 */
function autumnOf(y, n) {
  const a0 = N(y, ...SEASON.autumnFrom), a1 = N(y, ...SEASON.autumnFull), dec1 = N(y, 12, 1);
  if (n < a0 || n >= dec1) return 0;
  if (n >= a1) return 1;
  const u = (n - a0) / (a1 - a0), e = u * u * (3 - 2 * u);
  return Math.round((SEASON.autumnStart + (1 - SEASON.autumnStart) * e) * 1000) / 1000;
}
/**
 * the season of a day ('d20261224' | '2026-12-24') → { day, winter: 0 … 1, christmas: 0 … 1, snowfall: 'none' | 'light' | 'heavy', wet: 0 … 1, melt }
 *   winter — 0 none · a dusting (SEASON.dust) on Dec 1 → 1 (full) by Dec 24 · full through January + February · back to 0 over the last 7
 *            days of February (patchy, the grass returning) · 0 from Mar 1
 *   christmas — Dec 1 small → more each week → 1 on Dec 24–25 → SEASON.xmasAfter to Jan 6 → 0 from Jan 7
 *   snowfall — ≈ half the winter days (from the day — the same for everyone), ALWAYS on Dec 24 (heavy) + Dec 25 (light); the melt week light only
 */
export function seasonOf(k) {
  const p = parseDay(k);
  if (!p) return NONE;
  const day = dayKeyOf(k), n = N(p.y, p.m, p.d);
  const wy = p.m === 12 ? p.y : p.y - 1, dec1 = N(wy, 12, 1), mar1 = N(wy + 1, 3, 1);
  if (n < dec1 || n >= mar1) return { ...NONE, day, autumn: autumnOf(p.y, n) };
  const i = n - dec1, left = mar1 - n;
  let winter = i >= 23 ? 1 : SEASON.dust + (1 - SEASON.dust) * Math.pow(i / 23, 0.85);
  const melt = left <= SEASON.meltDays;
  if (melt) winter = Math.min(winter, left / (SEASON.meltDays + 1));
  const jan7 = N(wy + 1, 1, 7);
  let christmas = 0;
  if (n < jan7) christmas = i <= 20 ? SEASON.xmasWeeks[Math.floor(i / 7)] : i <= 22 ? SEASON.xmasEve : i <= 24 ? 1 : SEASON.xmasAfter;
  let snowfall = 'none';
  if (i === 23) snowfall = 'heavy';
  else if (i === 24) snowfall = 'light';
  else if (snowsOn(n)) snowfall = melt || h01(day, 0xf1a4) >= SEASON.heavyShare ? 'light' : 'heavy';
  winter = Math.round(winter * 1000) / 1000;
  // JT1 — THE HAT (every kid: Santa Dec 1 → Dec 31 · the striped party hat on Jan 1) + THE FIREWORKS (Dec 31 'eve' — the finale before local
  // midnight · Jan 1 'day' — light bursts by night only)
  const hat = p.m === 12 ? 'santa' : p.m === 1 && p.d === 1 ? 'party' : '';
  const fireworks = p.m === 12 && p.d === 31 ? 'eve' : p.m === 1 && p.d === 1 ? 'day' : '';
  return { day, winter, christmas, snowfall, wet: Math.round((SEASON.wetBase + SEASON.wetWinter * winter) * 1000) / 1000, melt, autumn: 0, hat, fireworks };
}
/** the season of an instant (the 4 am Eastern day it belongs to) */
export const seasonAt = ms => seasonOf(turnDay(ms));
/** the seasonal pack (its code) is wanted on this day — autumn, winter, Christmas, a hat, fireworks (Oct 20 → Mar 1: season-gate.js#seasonWindow) */
export const packDay = s => !!s && (s.winter > 0 || s.christmas > 0 || s.autumn > 0 || !!s.hat || !!s.fireworks);
/** the pack's winter MODELS are wanted (Dec 1 → Mar 1 — autumn, the hats + the fireworks are built in code) */
export const modelsDay = s => !!s && (s.winter > 0 || s.christmas > 0);
/**
 * VARIETY B1 — ONE PACK PER SEASON (the owner, Nov 22): each season's pack = THE CORE (the pack's shared code: this clock, seasonal.js +
 * seasonal-fx.js — the hooks, the fall, the ground's season GLSL) + ITS OWN code + ITS OWN models, each under its OWN cap (150 KB). A phone
 * fetches only the day's pack: an autumn day never asks for a winter file (the winter models, the skyline snow, the fireworks) and a winter day
 * never for the leaf pile. Spring + Halloween: the structure is ready (live: false — nothing of theirs exists yet).
 */
export const PACK_CORE = Object.freeze(['season.js', 'seasonal.js', 'seasonal-fx.js']);
export const PACKS = Object.freeze({
  autumn: Object.freeze({ live: true, cap: 150, dir: 'autumn', models: ['leaf-pile'], code: [] }),
  winter: Object.freeze({ live: true, cap: 150, dir: 'winter', models: ['snow-pine', 'xmas-tree', 'snowman'], code: ['sky-snow.js', 'fireworks.js'] }),
  spring: Object.freeze({ live: false, cap: 150, dir: 'spring', models: [], code: [] }),
  halloween: Object.freeze({ live: false, cap: 150, dir: 'halloween', models: [], code: [] }),
});
/** the day's pack: 'winter' (the snow, Christmas, the hats, New Year's) · 'autumn' · '' (none) */
export const packOf = s => (!s ? '' : s.winter > 0 || s.christmas > 0 || !!s.hat || !!s.fireworks ? 'winter' : s.autumn > 0 ? 'autumn' : '');
/**
 * the lab's switches over the clock (J4 — `&date=YYYY-MM-DD` · `&snow=none|light|heavy` · `&wet=1`): `q` = the page's URLSearchParams.
 * → { season, forced (a date asked), wet (the reflections on) }. The live game never calls this.
 */
export function labSeason(q, nowMs) {
  const d = q.get('date'), base = parseDay(d) ? seasonOf(d) : seasonAt(nowMs), snow = q.get('snow');
  const season = /^(none|light|heavy)$/.test(snow || '') ? { ...base, snowfall: snow } : base;   // (the lab may force a fall on any day)
  return { season, forced: !!parseDay(d), wet: q.get('wet') === '1', snow: season.snowfall !== base.snowfall ? snow : '', clock: labClock(q.get('clock')) };
}
/** JT1 — the lab's `&clock=HH:MM` (the phone's LOCAL time forced — the New Year's finale before midnight) → minutes after midnight, or -1 */
export function labClock(v) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(v || '');
  return m && +m[1] < 24 && +m[2] < 60 ? +m[1] * 60 + +m[2] : -1;
}
/** WET NEON STREETS ships OFF in the live game (the owner's call — a later one-line add-on flips it: JT1 — the game's own switch is view.js#WET_LIVE,
 *  the start bundle never imports this module; this copy is the tests' + the lab's, kept equal — tests/jaywalk-winter.test.mjs) */
export const WET_LIVE = false;
