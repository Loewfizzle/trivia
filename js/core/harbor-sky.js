// CITY 2.0 — THE HARBOR, Part 6a: THE EVERYDAY SKY, the rules (PURE: no DOM, no clock of its own; tests/harbor.test.mjs).
// docs/harbor.md#part-6a. What the sky's art modules (screens/harbor/air, banner, smoke, birds, balloons, moon) ask:
//   THE AURORA     a rare timed event for everyone (~2 nights a month, seeded, never two in a row) + a bonus night on a real
//                  strong geomagnetic storm (NOAA planetary Kp ≥ 7 through /api/sky), wherever the player is
//   THE MOON       its look tonight: the big amber moonrise (bigger + amber low, silver as it climbs), the harvest moon, a
//                  supermoon (the real distance), a halo only in real haze, earthshine on a crescent
//   THE WEATHER    what may fly: balloons (calm, clear), skywriting + skytyping (clear, low wind), the banner plane
//   MESSAGES       the skytype lines (≤ 16 a line, ≤ 2 lines: the window font's 5 rows = the 5 planes), the skywriting strokes
//                  (single-stroke capitals: the tube alphabet + digits, a heart), the banner's panels (≤ 3, ≤ 24 characters)
//   THE BIRDS      who is up: gulls by day, swifts at summer dusk, geese (in V's — the migrations most), bats at summer dusk
import { implosionDay, announceText, FIRST_YEAR as TOWER_FIRST } from './harbor-tower.js';
import { flattenPath } from './tube-path.js';
import { lineCells, lineWidth, normText, glyph, FONT_H } from './harbor-windows.js';
import { hashString } from './rng.js';
import { easter, thanksgiving } from './sky.js';
export { parseKp, kpAt } from './weather.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------ THE AURORA (the owner's call, Oct 21 2026)
// Not limited by where the player is: a RARE TIMED EVENT for everyone — about 2 nights a month, the same nights for all players
// (seeded by the evening's date), never two nights in a row — PLUS a bonus night whenever the real planetary Kp index (NOAA,
// through /api/sky) shows a strong geomagnetic storm (Kp ≥ 7), wherever the player is. Only at night, under clear-enough skies.
const auroraDice = (y, m, d) => hashString(`aurora-night:${y}-${m}-${d}`) % 14 === 0;
/** a seeded aurora night (the evening's local date): 1 in 16 dice, never right after another dice night → ~2 a month, never two
 *  nights in a row */
export function auroraNight2(y, m, d) {
  if (!auroraDice(y, m, d)) return false;
  const p = new Date(Date.UTC(y, m - 1, d) - 864e5);
  return !auroraDice(p.getUTCFullYear(), p.getUTCMonth() + 1, p.getUTCDate());
}
/** the strong-storm threshold (Kp) for the bonus night */
export const STORM_KP = 7;
/** the strongest Kp within 12 hours either side of ms (tonight's storm), or null without blocks */
export function stormKp(blocks, ms) {
  if (!Array.isArray(blocks) || !blocks.length) return null;
  let k = null;
  for (const [t, v] of blocks) if (t + 3 * 3600e3 > ms - 12 * 3600e3 && t < ms + 12 * 3600e3) k = k == null ? v : Math.max(k, v);
  return k;
}
/**
 * Tonight's aurora: { on, strength (0..1 — a storm night is brighter + higher), why: 'night' | 'storm' | null }.
 * ev: the evening's local date { y, m, d }; kp: tonight's strongest Kp (stormKp) or null when the forecast is unknown.
 */
export function auroraTonight(ev, kp) {
  const storm = kp != null && kp >= STORM_KP;
  if (storm) return { on: true, strength: clamp01(0.75 + (kp - STORM_KP) * 0.12), why: 'storm' };
  if (ev && auroraNight2(ev.y, ev.m, ev.d)) return { on: true, strength: 0.62, why: 'night' };
  return { on: false, strength: 0, why: null };
}
// (NOAA's Kp parsing lives in core/weather.js — the server's /api/sky shares it: parseKp, kpAt)

// ------------------------------------------------------------------ THE MOON
/** the harvest moon: the full moon nearest the autumn equinox (Sep 23 north / Mar 20 south), within a day and a half of full */
export function harvestMoon(local, phase, south) {
  if (!local || phase == null) return false;
  const full = Math.abs(phase - 0.5) * 29.53 <= 1.6;
  const doy = local.doy != null ? local.doy : Math.round((Date.UTC(local.y, local.m - 1, local.d) - Date.UTC(local.y, 0, 0)) / 864e5);
  const eq = south ? 79 : 266;
  return full && Math.abs(doy - eq) <= 15;
}
/** a supermoon: a full moon (± 1.6 days) at its nearest (closer than 362 000 km) */
export const supermoon = (phase, dist) => phase != null && dist != null && Math.abs(phase - 0.5) * 29.53 <= 1.6 && dist < 362000;
/**
 * The moon's look tonight. m: { el, phase, illum, dist }, o: { local, south, cloud, fog, rain, clear, veil (0..1: a cirrostratus
 * veil tonight — clouds.js) }.
 * → { size (× the drawn radius: the moon illusion low + a supermoon), amber (0..1: the colour of a low moon; a harvest moon
 *     stays amber longer), harvest, supermoon, halo (0..1: the 22° ring — only under a cirrostratus veil), haze (0..1: thin cloud /
 *     light fog: a wider, brighter soft glow), corona (0..1: a tight glow in clear
 *     air), earthshine (0..1: the crescent's dark part lit by the earth) }
 */
export function moonLook(m, o = {}) {
  const el = m.el == null ? 30 : m.el, ph = m.phase == null ? 0.5 : m.phase;
  const harvest = harvestMoon(o.local, ph, o.south), sup = supermoon(ph, m.dist);
  const low = 1 - smooth(3, 26, el);
  const size = (1 + 0.32 * low) * (sup ? 1.12 : 1);
  const amber = clamp01(1 - smooth(harvest ? 10 : 6, harvest ? 34 : 26, el));
  const cloud = o.cloud || 0, fog = o.fog || 0, rain = o.rain || 0;
  // (the moonlight scattered round it: thin cloud or light fog widens + brightens its soft glow — the aureole)
  const haze = clamp01(rain > 0.05 ? 0 : smooth(0.18, 0.4, cloud) * (1 - smooth(0.62, 0.8, cloud)) + smooth(0.1, 0.3, fog) * (1 - smooth(0.5, 0.75, fog)));
  // (SP — the owner: the big faint ring cut through the tagline on any cloudy night: the 22° HALO is ice crystals — only a thin
  // high CIRROSTRATUS veil makes it (o.veil: clouds.js's), never a cumulus night, fog or rain)
  const halo = rain > 0.05 ? 0 : clamp01(o.veil || 0) * smooth(0.35, 0.6, m.illum == null ? 1 : m.illum);
  const corona = o.clear === false ? 0.3 : 1 - smooth(0.2, 0.5, cloud);
  // earthshine: strongest on a thin crescent, gone past the quarters
  const crescent = 1 - smooth(0.1, 0.32, Math.min(ph, 1 - ph));
  return { size, amber, harvest, supermoon: sup, halo, haze, corona, earthshine: crescent };
}

// ------------------------------------------------------------------ THE WEATHER — what may fly
const calm = (L, max) => (L.wind == null ? 3 : L.wind) <= max;
/** hot air balloons: calm (≤ 4 m/s), clear, dry, no fog, little cloud */
export const balloonWeather = L => !!L && calm(L, 4) && !(L.rain > 0.02) && !(L.snow > 0.05) && !(L.fog > 0.2) && !(L.storm) && (L.cloud || 0) < 0.55;
/** skywriting + skytyping: clear and low wind (the smoke must hold its shape) */
export const smokeWeather = L => !!L && calm(L, 6.5) && !(L.rain > 0.02) && !(L.snow > 0.05) && !(L.fog > 0.15) && !(L.storm) && (L.cloud || 0) < 0.45;
/** the banner plane: anything but rain, snow, fog, a storm or a low overcast */
export const bannerWeather = L => !!L && calm(L, 11) && !(L.rain > 0.05) && !(L.snow > 0.1) && !(L.fog > 0.35) && !(L.storm) && (L.cloud || 0) < 0.9;
/** the season's months, the north's (a southern place: shifted six months) */
const monthN = (month, south) => (south ? ((month + 5) % 12) + 1 : month);
/** when balloons fly (the sun's elevation + azimuth, the month): 'morning' (the first hours after sunrise, Apr–Oct) | 'evening'
 *  (the last hours before sunset into dusk, Jun–Aug) | null */
export function balloonTime(el, az, month, south) {
  const mn = monthN(month, south), am = south ? az > 180 : az < 180;
  if (am && el > -1 && el < 24 && mn >= 4 && mn <= 10) return 'morning';
  if (!am && el > -5 && el < 18 && mn >= 6 && mn <= 8) return 'evening';
  return null;
}

// ------------------------------------------------------------------ MESSAGES
/** words into lines of ≤ max characters (a word longer than a line is cut), at most `lines` lines; extra words are dropped */
export function wrapLines(text, max = 16, lines = 2) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).map(w => w.slice(0, max));
  const out = [];
  for (const w of words) {
    const last = out[out.length - 1];
    if (last != null && last.length + 1 + w.length <= max) out[out.length - 1] = `${last} ${w}`;
    else if (out.length < lines) out.push(w);
    else break;
  }
  return out;
}
/** SKYTYPING: a message in the window font's dots (5 rows = the 5 planes of a line) — ≤ max characters a line, ≤ `lines` lines.
 *  → { lines, cols (the widest line), rows (5 a line + a blank row between), dots: [[col, row, line, letter, word], …] (each line
 *  centred) } or null when nothing is left to type */
export function skytypeLayout(text, max = 16, lines = 2) {
  return dotLayout(wrapLines(normText(text, 160), max, lines));
}
/** the dots of given lines (each centred) — skytyping + the drone show's letters (6b: one layout for every sky message) */
export function dotLayout(lines0) {
  const lines = (lines0 || []).map(l => String(l).trim()).filter(l => l && [...l].some(ch => glyph(ch)));
  if (!lines.length) return null;
  const widths = lines.map(l => lineWidth(l)), cols = Math.max(...widths), dots = [];
  // (each dot carries its letter + word index: the drone show's colour per letter / per word)
  let li = 0, wi = 0;
  lines.forEach((l, i) => {
    const off = Math.floor((cols - widths[i]) / 2);
    let x = 0;
    [...l].forEach((ch, k) => {
      const g = glyph(ch); if (!g) return;
      if (k) x += 1;
      if (ch === ' ') wi++;
      else { g.forEach((row, r) => [...row].forEach((v, c) => { if (v === '#') dots.push([x + c + off, r + i * (FONT_H + 1), i, li, wi]); })); li++; }
      x += g[0].length;
    });
    wi++;
  });
  return { lines, cols, rows: lines.length * FONT_H + (lines.length - 1), dots };
}
/** 6b — ONE LAYOUT FOR EVERY SKY MESSAGE (skytyping by day, the drone show at night): up to `lines` lines of ≤ `max` characters a
 *  PAGE, up to `pages` pages (≈ 140 characters); " | " forces a new page. Each page's words are wrapped into however many lines (1 …
 *  `lines`) make its letters BIGGEST in a box `aspect` times as wide as it is tall. → [[line, …], …] (pages) — [] when nothing types */
export const MSG = Object.freeze({ max: 16, lines: 3, pages: 3 });
export function messagePages(text, { max = MSG.max, lines = MSG.lines, pages = MSG.pages, aspect = 1.4 } = {}) {
  const out = [];
  for (const part of String(text || '').split(/\s*\|\s*/)) {
    let words = normText(part, 400).trim().split(/\s+/).filter(w => w && [...w].some(ch => glyph(ch))).map(w => w.slice(0, max));
    while (words.length && out.length < pages) {
      const fill = wrapLines(words.join(' '), max, lines);
      const n = fill.join(' ').split(' ').length;
      out.push(bestWrap(words.slice(0, n), max, lines, aspect));
      words = words.slice(n);
    }
  }
  return out;
}
// a page's words in the line count (≤ lines) that gives the biggest letters in a box of this aspect (w / h)
function bestWrap(words, max, lines, aspect) {
  let best = null, bestP = -1;
  for (let L = 1; L <= lines; L++) {
    // the narrowest line length that still fits the words in L lines → the most even lines
    let got = null;
    for (let m = Math.max(...words.map(w => w.length)); m <= max; m++) { const w = wrapLines(words.join(' '), m, L); if (w.join(' ').split(' ').length === words.length) { got = w; break; } }
    if (!got) continue;
    const cols = Math.max(...got.map(l => lineWidth(l))), rows = got.length * FONT_H + got.length - 1;
    const p = Math.min(aspect / Math.max(1, cols), 1 / rows);
    if (p > bestP * 1.02) { bestP = p; best = got; }
  }
  return best || wrapLines(words.join(' '), max, lines);
}
/** the banner plane's panels: an array as given (≤ 3), or a string cut at " | " / " · ", or wrapped to ≤ 24 characters a panel */
export function bannerPanels(msg, max = 24) {
  let p = Array.isArray(msg) ? msg.map(String) : String(msg || '').split(/\s+[|·]\s+/);
  if (p.length === 1 && p[0].length > max) p = wrapLines(p[0], max, 3);
  return p.map(s => s.trim().toUpperCase().slice(0, max)).filter(Boolean).slice(0, 3);
}
/** what the random sky events carry (in-world: the city's own little ads and greetings — never anything about the player) */
export const BANNER_POOL = [['FRESH LEMONADE', 'AT THE PIER'], ['RIDE THE WHEEL'], ['ROSIE SAILS AT SIX'], ['JAZZ TONIGHT', "NINE O'CLOCK"], ['HELLO DOWN THERE!'],
  ['ICE COLD ROOT BEER', '5¢ A GLASS'], ['WATCH THE SKIES'], ['HARBOR DAYS', 'THIS WEEKEND']];
export const SKYTYPE_POOL = ['HAVE A NICE DAY', 'LOOK UP!', 'SEE YOU AT THE PIER', 'HELLO DOWN THERE', 'JAZZ TONIGHT AT NINE', 'WHAT A DAY'];
/** a random event's message: from its pool by its seed (the same for everyone) — the banner may carry a game's name */
/** 11a-1 — THE BANNER PLANE's HOLIDAY MESSAGES: through a holiday's build-up + its days, two of three daily banners carry its own lines
 *  (core/harbor-holiday.js decides the holiday — the scene passes its id); Thanksgiving + Christmas add rows here */
export const HOLIDAY_BANNERS = Object.freeze({
  halloween: [['HAPPY HALLOWEEN'], ['TRICK OR TREAT', 'OCTOBER 31'], ['COSTUME PARTY', 'AT THE SPEAKEASY'], ['FRESH PUMPKINS', 'AT THE PIER'], ['BEWARE THE', 'GHOST SHIP']],
  dotd: [['FELIZ DIA DE MUERTOS'], ['REMEMBER THEM', 'WITH LOVE'], ['CANDLELIGHT PROCESSION', 'NOV 2 AT DUSK'], ['MARIGOLDS', 'AT THE MARKET']],
  thanksgiving: [['HAPPY THANKSGIVING'], ['GIVE THANKS'], ['BALLOON PARADE', 'THURSDAY 9 AM'], ['FRESH PIES', 'ORDER NOW']],
  // (11a-2 — BLACK FRIDAY: the sale — no store, no brand: the city's own shops)
  blackfriday: [['BLACK FRIDAY SALE'], ['EVERYTHING MUST GO', 'TODAY ONLY'], ['HALF OFF', 'ALL DAY'], ['DOORS OPEN AT SIX', 'BIG SAVINGS']],
});
export function eventMessage(kind, seed, games = [], holiday = null) {
  const s = seed >>> 0;
  if (kind === 'skytype') return SKYTYPE_POOL[s % SKYTYPE_POOL.length];
  if (kind === 'banner' && holiday && HOLIDAY_BANNERS[holiday] && s % 3 !== 2) { const p = HOLIDAY_BANNERS[holiday]; return p[(s >>> 2) % p.length]; }
  if (games.length && s % 3 === 0) { const g = games[(s >>> 3) % games.length]; return ['TONIGHT', String(g.name || g.id).toUpperCase().slice(0, 24)]; }
  return BANNER_POOL[s % BANNER_POOL.length];
}

// ------------------------------------------------------------------ THE BIRDS
/**
 * Who is up in the sky now (0..1 each). L: the look (core/sky.js) — { sun: { el, az }, local: { m, h }, south, rain, storm, fog }.
 *   gulls  by day over the harbor (fewer in rain; none at night) · swifts  summer evenings round the rooftops (May–Aug, the sun
 *   low → dusk) · geese  V's: a steady trickle, the autumn migration most (Sep–Nov), the spring one (Mar–Apr); dawn to dusk ·
 *   bats  summer dusk into the night (late May–early Sep)
 */
export function birdsNow(L) {
  if (!L || !L.sun) return { gulls: 0, swifts: 0, geese: 0, bats: 0 };
  const el = L.sun.el, mn = monthN(L.local ? L.local.m : 6, L.south), d = L.local ? L.local.d : 15;
  const pm = (L.south ? L.sun.az < 180 : L.sun.az > 180), wet = (L.rain || 0) > 0.1 || L.storm ? 1 : 0;
  const summer = mn >= 6 && mn <= 8 ? 1 : mn === 5 ? smooth(10, 31, d) : mn === 9 ? 1 - smooth(1, 12, d) : 0;
  const gulls = smooth(-3, 4, el) * (wet ? 0.3 : 1) * (L.fog > 0.5 ? 0.5 : 1);
  const swifts = (mn >= 5 && mn <= 8 ? 1 : 0) * (pm ? smooth(-5, -1, el) * (1 - smooth(9, 16, el)) : 0) * (wet ? 0 : 1);
  const mig = mn >= 9 && mn <= 11 ? 1 : mn === 3 || mn === 4 ? 0.7 : 0.18;
  const geese = mig * smooth(-7, -2, el) * (L.storm ? 0 : 1);
  const bats = summer * (el < -1 ? (pm ? smooth(-1, -5, el) : smooth(-6, -12, el)) : 0) * (wet ? 0 : 1);
  return { gulls, swifts, geese, bats };
}

// ------------------------------------------------------------------ THE HOLIDAY SKY (the owner's call, Oct 21 2026)
// Holidays get an automatic sky message ON THE CLOCK (never the scheduler's dice): by day a SKYWRITING / SKYTYPING message at a
// local hour (only on a clear, low-wind day — no smoke in cloud), at night a DRONE SHOW at a local hour chosen to stay clear of
// that holiday's own moments (NYE: the evening, long before the countdown, the ball drop and the fireworks; July 4th: before
// the fireworks). Regular party nights get NO automatic show. Parts 11a–c fill the entries in (more shapes, timings); CITY
// CONTROL can cancel or override any of them (setSkyHoliday). Sky messages are otherwise API-only (skyfx.js): no random ones.
//   entry: { id, date(y) → { m, d }, day?: { kind: 'skytype' (6b: skywriting cut), text, h (local hour, fractional) }, night?: { show: [shape
//   specs: { text } | { shape }], h }, calm?: true (a respectful show: slower, steady lights, no burst) }
const lastMonday = (y, m) => { const d = new Date(Date.UTC(y, m, 0)); return d.getUTCDate() - ((d.getUTCDay() + 6) % 7); };
export const SKY_HOLIDAYS = [
  { id: 'valentine', date: () => ({ m: 2, d: 14 }), day: { kind: 'skytype', text: '♥ LOVE ♥', h: 13 }, night: { show: [{ text: 'HAPPY VALENTINES DAY' }], h: 21 } },
  { id: 'stpatrick', date: () => ({ m: 3, d: 17 }), day: { kind: 'skytype', text: 'HAPPY ST PATRICKS DAY', h: 13 }, night: { show: [{ text: 'SLAINTE' }], h: 21 } },
  { id: 'easter', date: y => easter(y), day: { kind: 'skytype', text: 'HAPPY EASTER', h: 13 }, night: { show: [{ text: 'HAPPY EASTER' }], h: 21 } },
  { id: 'memorial', date: y => ({ m: 5, d: lastMonday(y, 5) }), calm: true, show: { kind: 'missing', h: 11 }, day: { kind: 'skytype', text: 'WE REMEMBER', h: 12 }, night: { show: [{ text: 'WE REMEMBER' }], h: 21.25 } },
  { id: 'july4', date: () => ({ m: 7, d: 4 }), show: { kind: 'airshow', h: 15.5 }, day: { kind: 'skytype', text: 'HAPPY 4TH OF JULY', h: 13 }, night: { show: [{ text: 'HAPPY 4TH OF JULY' }], h: 21.25 } },
  { id: 'halloween', date: () => ({ m: 10, d: 31 }), day: { kind: 'skytype', text: 'BOO!', h: 14 }, night: { show: [{ text: 'HAPPY HALLOWEEN' }], h: 20.5 } },
  { id: 'veterans', date: () => ({ m: 11, d: 11 }), calm: true, show: { kind: 'missing', h: 11 }, day: { kind: 'skytype', text: 'THANK YOU VETERANS', h: 12 }, night: { show: [{ text: 'THANK YOU VETERANS' }], h: 21 } },
  { id: 'thanksgiving', date: y => thanksgiving(y), day: { kind: 'skytype', text: 'HAPPY THANKSGIVING', h: 12.5 }, night: { show: [{ text: 'HAPPY THANKSGIVING' }], h: 20.5 } },
  { id: 'christmas-eve', date: () => ({ m: 12, d: 24 }), day: { kind: 'skytype', text: 'MERRY CHRISTMAS', h: 13 }, night: { show: [{ text: 'MERRY CHRISTMAS' }], h: 19.5 } },
  { id: 'nye', date: () => ({ m: 12, d: 31 }), day: { kind: 'skytype', text: 'HAPPY NEW YEAR', h: 14 }, night: { show: [{ text: 'HAPPY NEW YEAR' }, { text: '{next}' }], h: 21 } },
];
const overrides = new Map();
/** CITY CONTROL (later): cancel (null) or override (a patch: { day, night } — either may be null) one holiday's sky; undefined resets */
export function setSkyHoliday(id, patch) { if (patch === undefined) overrides.delete(id); else overrides.set(id, patch); }
/** the holiday sky on a local date: the entry (with any override) or null */
/** 11a-2 — THE SALE DAYS (not holidays — no message in the sky, no drone show): a banner plane's SALE pass on the clock (three passes,
 *  weather allowing — skyfx.js); the day's random banners carry its lines too (HOLIDAY_BANNERS — the scene names the day) */
export const SALE_DAYS = Object.freeze([
  { id: 'blackfriday', date: y => ({ m: 11, d: thanksgiving(y).d + 1 }), banner: { text: ['BLACK FRIDAY SALE', 'EVERYTHING MUST GO'], h: 11, passes: 3 } },
  // 9e — THE CONSTRUCTION TOWER's IMPLOSION (core/harbor-tower.js): the banner plane announces it the three days before (from 2027)
  ...[3, 2, 1].map(k => ({ id: `demolition-${k}`, date: y => (y >= TOWER_FIRST ? { m: 4, d: implosionDay(y).d - k } : { m: 0, d: 0 }), banner: { text: [announceText(), 'STAND WELL BACK'], h: 13.5, passes: 2 } })),
]);
export function saleDayOn(y, m, d) { for (const s of SALE_DAYS) { const dt = s.date(y); if (dt.m === m && dt.d === d) return s; } return null; }
export function skyHolidayOn(y, m, d) {
  for (const h of SKY_HOLIDAYS) {
    const dt = h.date(y);
    if (dt.m !== m || dt.d !== d) continue;
    if (overrides.has(h.id)) { const o = overrides.get(h.id); if (o === null) return null; return { ...h, ...o }; }
    return h;
  }
  return null;
}
/** a show's texts with their placeholders filled ({next}: the coming year; {year}: this one) */
export const fillText = (t, y) => String(t).replace('{next}', String(y + 1)).replace('{year}', String(y));

// ------------------------------------------------------------------ THE DRONE SHOW'S SHAPES
// Each shape is points in a box (its own units; w × h) with a colour per point. Outlined shapes are sampled evenly along their
// paths (they read like neon in the night sky); LETTERS are the skytyping font's dots (one drone per lit cell — they read on a
// phone the way the skytyped words do); the FLAG is a filled grid (its stripes + the canton).
function starPath(cx, cy, R, r) { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + ' '; } return d + 'Z'; }
const S_PATHS = {
  heart: [{ d: 'M50 90 C20 68 4 50 4 31 C4 14 16 4 30 4 C40 4 47 10 50 19 C53 10 60 4 70 4 C84 4 96 14 96 31 C96 50 80 68 50 90 Z', col: [255, 46, 96] }, { d: 'M50 72 C32 58 22 46 22 34 C22 25 28 20 35 20 C42 20 47 25 50 31 C53 25 58 20 65 20 C72 20 78 25 78 34 C78 46 68 58 50 72 Z', col: [255, 140, 180] }],
  egg: [{ d: 'M50 6 C28 6 14 40 14 60 C14 82 30 94 50 94 C70 94 86 82 86 60 C86 40 72 6 50 6 Z', col: [255, 190, 230] }, { d: 'M17 50 Q50 60 83 50', col: [150, 210, 255] }, { d: 'M15 68 Q50 78 85 68', col: [255, 240, 140] }, { d: 'M24 34 Q50 42 76 34', col: [180, 255, 200] }],
  pumpkin: [{ d: 'M50 22 C20 22 8 40 8 58 C8 80 26 92 50 92 C74 92 92 80 92 58 C92 40 80 22 50 22 Z', col: [255, 128, 24] }, { d: 'M50 24 C38 40 38 76 50 90', col: [230, 96, 20] }, { d: 'M50 24 C62 40 62 76 50 90', col: [230, 96, 20] }, { d: 'M50 22 L52 10 L60 7', col: [90, 230, 80] },
    { d: 'M28 50 L38 40 L42 53 Z', col: [255, 230, 90] }, { d: 'M72 50 L62 40 L58 53 Z', col: [255, 230, 90] }, { d: 'M26 64 L34 72 L42 66 L50 74 L58 66 L66 72 L74 64 L66 82 L34 82 Z', col: [255, 230, 90] }],
  tree: [{ d: 'M50 10 L72 36 L62 36 L82 60 L68 60 L90 86 L10 86 L32 60 L18 60 L38 36 L28 36 Z', col: [60, 230, 110] }, { d: 'M45 86 L45 97 L55 97 L55 86', col: [190, 120, 60] }, { d: 'M50 0 L53 7 L60 7 L54 11 L57 18 L50 13 L43 18 L46 11 L40 7 L47 7 Z', col: [255, 214, 80] },
    { d: 'M40 46 L41 46 M60 52 L61 52 M30 72 L31 72 M52 68 L53 68 M70 76 L71 76 M44 80 L45 80 M58 32 L59 32', col: [255, 60, 70], dots: true }],
  star: [{ d: starPath(50, 52, 46, 19), col: [255, 214, 80] }, { d: starPath(50, 52, 24, 10), col: [255, 246, 200] }],
  burst: Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2, c = [[255, 90, 190], [90, 220, 255], [255, 214, 90], [140, 255, 150]][i % 4]; return { d: 'M' + (50 + Math.cos(a) * 12).toFixed(1) + ' ' + (50 + Math.sin(a) * 12).toFixed(1) + ' L' + (50 + Math.cos(a) * 48).toFixed(1) + ' ' + (50 + Math.sin(a) * 48).toFixed(1), col: c }; }),
  shamrock: [0, 1, 2].map(i => ({ d: 'M50 50 C30 46 22 34 24 24 C26 14 38 12 44 20 C46 14 50 8 56 10 C64 14 62 30 50 50 Z', col: [70, 235, 110], rot: i * 120 })).concat([{ d: 'M50 52 Q58 74 46 96', col: [60, 200, 90] }]),
  bitcoin: [{ d: 'M30 16 L30 84 M30 16 L58 16 Q74 16 74 32 Q74 48 58 48 L30 48 M58 48 Q78 48 78 66 Q78 84 58 84 L30 84 M40 4 L40 16 M54 4 L54 16 M40 84 L40 96 M54 84 L54 96', col: [247, 147, 26] }],
};
export const DRONE_SHAPES = ['heart', 'star', 'flag', 'pumpkin', 'tree', 'burst', 'shamrock', 'egg', 'bitcoin'];
const hexRgb = h => { const n = parseInt(String(h).replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
// sample paths evenly (≈ n points in all; ≥ 2 a path) → [[x, y, r, g, b], …] in the 0..100 box
function samplePaths(paths, n) {
  const polys = [];
  for (const p of paths) for (const pl of flattenPath(p.d, 1, 0, 0, 1)) {
    let pts = pl.pts;
    if (p.rot) { const a = p.rot * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); pts = pts.map(([x, y]) => [50 + (x - 50) * c - (y - 50) * s, 52 + (x - 50) * s + (y - 50) * c]); }
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    polys.push({ pts, cum, len: cum[cum.length - 1], col: p.col, dots: p.dots, closed: pl.closed || (pts.length > 2 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.01) });
  }
  const total = polys.reduce((s, p) => s + (p.dots ? 0 : p.len), 0) || 1, nd = polys.reduce((s, p) => s + (p.dots ? Math.ceil(p.pts.length / 2) : 0), 0), step = total / Math.max(8, n - nd), out = [];
  for (const p of polys) {
    if (p.dots) { for (let i = 0; i < p.pts.length; i += 2) out.push([p.pts[i][0], p.pts[i][1], ...p.col]); continue; }
    const k = Math.max(2, Math.round(p.len / step));
    for (let j = 0; j < k; j++) {
      const want = p.len * j / (p.closed ? k : k - 1);
      let seg = 1; while (seg < p.cum.length - 1 && p.cum[seg] < want) seg++;
      const a = p.pts[seg - 1], b = p.pts[seg], u = clamp01((want - p.cum[seg - 1]) / ((p.cum[seg] - p.cum[seg - 1]) || 1));
      out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, ...p.col]);
    }
  }
  return out;
}
/**
 * A drone formation: spec { text } | { shape: DRONE_SHAPES | 'mark:<gameId>' } (+ col: [r,g,b] for text); n: the drones there
 * are; marks: the games' marks (district/marks.js#MARKS) for 'mark:<id>'. → { w, h, pts: [[x, y, r, g, b], …] (≤ n; x right,
 * y down, in the box's units), kind } or null
 */
export function droneShape(spec, n = 160, { year = 2026, marks = null } = {}) {
  if (spec && spec.text != null) {
    // (6b: the one message layout — a page's lines as given, else the text's first page: ≤ 3 lines of ≤ 16, wrapped for the biggest letters)
    const T = dotLayout(Array.isArray(spec.lines) && spec.lines.length ? spec.lines : messagePages(fillText(spec.text, year))[0] || []);
    if (!T) return null;
    // its colour (NEON PASS 2): one colour (col), a colour per word or per letter (cols + by: 'word' | 'letter'), or a rainbow
    // across the letters (col: 'rainbow'); the default a cool white
    const cols = Array.isArray(spec.cols) && spec.cols.length ? spec.cols : null, nL = Math.max(1, T.dots.reduce((m, d) => Math.max(m, d[3] + 1), 1));
    const colOf = (li, wi) => (spec.col === 'rainbow' ? hsv((li / nL) * 0.85, 0.75, 1) : cols ? cols[(spec.by === 'word' ? wi : li) % cols.length] : spec.col || [214, 240, 255]);
    // (each lit cell a small cluster of drones — 2 × 2 or 3 × 3 as the drones allow — so a letter reads as a solid pixel letter)
    const k = Math.max(1, Math.min(3, Math.floor(Math.sqrt(n / T.dots.length))));
    let pts = [];
    for (const [c, r, , li, wi] of T.dots) { const col = colOf(li, wi); for (let j = 0; j < k * k; j++) pts.push([c + (k > 1 ? ((j % k) + 0.5) / k - 0.5 : 0) * 0.6, r + (k > 1 ? (Math.floor(j / k) + 0.5) / k - 0.5 : 0) * 0.6, ...col]); }
    if (pts.length > n) { const q = pts.length / n; pts = Array.from({ length: n }, (_, i) => pts[Math.floor(i * q)]); }
    return { w: Math.max(1, T.cols - 1), h: Math.max(1, T.rows - 1), pts, kind: 'text', text: T.lines.join(' / '), sub: k };
  }
  const id = spec && spec.shape;
  if (id === 'flag') {
    // a filled grid 1.9 : 1 — 13 stripes red / white, the canton blue with white stars
    const cc = Math.max(12, Math.round(Math.sqrt(n * 1.9))), rr = Math.max(5, Math.floor(n / cc)), pts = [];
    for (let r = 0; r < rr; r++) for (let c = 0; c < cc; c++) {
      const fy = (r + 0.5) / rr, fx = (c + 0.5) / cc, stripe = Math.floor(fy * 13), canton = fx < 0.4 && fy < 7 / 13;
      const col = canton ? ((r + c) % 2 === 0 ? [255, 255, 255] : [40, 76, 230]) : stripe % 2 === 0 ? [255, 40, 56] : [255, 255, 255];
      pts.push([fx * 190, fy * 100, ...col]);
    }
    return { w: 190, h: 100, pts, kind: 'flag' };
  }
  let paths = S_PATHS[id];
  if (!paths && typeof id === 'string' && id.startsWith('mark:') && marks) { const m = marks[id.slice(5)]; if (m) paths = m.tubes.map(t => ({ d: t.d, col: hexRgb(t.col) })); }
  if (!paths) return null;
  let pts = samplePaths(paths, n);
  if (pts.length > n) { const k = pts.length / n; pts = Array.from({ length: n }, (_, i) => pts[Math.floor(i * k)]); }
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  return { w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0), pts: pts.map(p => [p[0] - x0, p[1] - y0, p[2], p[3], p[4]]), kind: 'shape' };
}
/** a colour from hue (0..1), saturation, value → [r, g, b] */
export function hsv(h, sa, v) {
  const i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - sa), q = v * (1 - f * sa), t = v * (1 - (1 - f) * sa);
  const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][((i % 6) + 6) % 6];
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
/** a page of a drone message: how long it holds READABLE once formed (s) — skytyping's own READ (smoke.js) */
export const DRONE_READ = 15;
/**
 * The show's timeline (s) — POLISH 4 (the owner: "the drone show = A MESSAGE", the night version of skytyping): the drones RISE from the
 * barge below the skyline straight INTO the message's first page (the launch: no staging cloud, no opening figure), each page HOLDS
 * readable (DRONE_READ), the next page flows in (a morph), then they DISPERSE (the scatter) and fly home. count: the pages.
 * calm: slower morphs, longer holds (Memorial + Veterans Day). shapes[0] has no morph: the launch forms it.
 */
export function droneTimeline(count, calm = false) {
  const launch = 15, morph = calm ? 7 : 5, hold = calm ? 18 : DRONE_READ, scatter = 4, home = 14;
  const shapes = Array.from({ length: count }, (_, i) => ({ t0: i ? launch + hold + (i - 1) * (morph + hold) : launch, morph: i ? morph : 0, hold }));
  const s0 = count ? launch + hold + (count - 1) * (morph + hold) : launch;
  return { launch, shapes, scatter: s0, home: s0 + scatter, end: s0 + scatter + home };
}
