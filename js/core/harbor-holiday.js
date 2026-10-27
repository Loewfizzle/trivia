// CITY 2.0 — THE HARBOR, PART 11a-1: THE HOLIDAY CALENDAR (PURE: no DOM, no clock of its own — tests/harbor-holiday.test.mjs).
// docs/harbor.md#part-11a-1. ONE answer for "what holiday is the city dressed for right now, how far along is its build-up, what is
// up, what is coming down" — every holiday piece (the sign's dressing, the steps, the windows, the promenade, the people, the light
// rules, the sky) reads it; none keeps its own dates.
//
//   holidayAt(lc)        lc = the city clock's local { y, m, d, h, mi, s? } → the state (below) — date-driven: opening the city on
//                        Oct 27 shows the build-up as far along as Oct 27 should look; Nov 1 shows Halloween gone + Day of the Dead
//   halloweenPieces(H)   what of HALLOWEEN shows now (the web's growth, the pumpkins, the window scenes' weight, the night's people …)
//   dotdPieces(H)        what of DAY OF THE DEAD shows now (the marigolds, the papel picado, the ofrendas, the procession …)
//   lightRules(H, o)     THE HOLIDAY LIGHT RULES: the wheel's scheme, the beam's colour, Rosie's bulbs, the roof's strings, the window
//                        tint, the lamps' flicker, the shadows (o: { dark 0..1 }) — reused by Thanksgiving + Christmas next
//   HOLIDAY_TABLE        the calendar's rows (ADD A HOLIDAY: a row here + its pieces function + its painters; docs/harbor.md)
//
// The STATE: { id: 'halloween' | 'dotd' | null, label, phase: 'build' | 'day' | 'night' | 'down' | null, stage (0..1: the build-up's
// progress — 1 on the day), down (0..1: how far the come-down is — 0 = all up), days (days into the build-up), eve (the holiday's
// own night is on), key (a cache key that changes ~every 10 min + on every phase change) }.
// The DAY a holiday ends, its pieces come down OVERNIGHT (the owner: "comes down overnight into Day of the Dead"): Halloween's last
// night runs to 4 am on Nov 1; Day of the Dead's crews dress the promenade 4 → 7 am; Nov 3 its pieces come down through the day.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const DAYMS = 864e5;
const dn = (y, m, d) => Math.floor(Date.UTC(y, m - 1, d) / DAYMS);
/** a local moment as fractional days since the epoch (the calendar's own clock — no time zone: lc is already local) */
const at = (y, m, d, h = 0) => dn(y, m, d) + h / 24;
export const lcDays = lc => at(lc.y, lc.m, lc.d, lc.h + (lc.mi || 0) / 60 + (lc.s || 0) / 3600);

/** the holidays (the year of the moment asked): build = when the build-up starts, day = the day itself [from, to) in local days,
 *  night = the holiday's own night [from, to) (hours on the day's clock: 26 = 2 am the next morning), down = the come-down [from, to) */
export const HOLIDAY_TABLE = Object.freeze([
  { id: 'halloween', label: 'HALLOWEEN', build: [10, 1], day: [10, 31], night: [17.5, 28], end: [11, 1, 4], downLen: 0 },
  // (Day of the Dead: Nov 1 + 2 — dressed 4 → 7 am on Nov 1 while Halloween's last pieces go; Nov 3 down through the day)
  { id: 'dotd', label: 'DAY OF THE DEAD', start: [11, 1, 4], dressLen: 3, day: [11, 1], days: 2, night: [17, 23.5], down: [11, 3, 7], downLen: 12 },
]);

/**
 * holidayAt(lc) → the state. lc: { y, m, d, h, mi, s? } local.
 */
export function holidayAt(lc) {
  const none = { id: null, label: '', phase: null, stage: 0, down: 0, days: 0, eve: false, key: 'none' };
  if (!lc || !lc.y) return none;
  const t = lcDays(lc), y = lc.y;
  // ---- HALLOWEEN: Oct 1 → the night of the 31st (to 4 am on Nov 1)
  {
    const R = HOLIDAY_TABLE[0], b0 = at(y, R.build[0], R.build[1]), d0 = at(y, R.day[0], R.day[1]), end = at(y, R.end[0], R.end[1], R.end[2]);
    if (t >= b0 && t < end) {
      // the build-up's stage: 0 on Oct 1 → 1 as Halloween night begins (the 31st at its dusk hour: the web fully woven by then)
      const full = d0 + R.night[0] / 24, stage = clamp01((t - b0) / (full - b0));
      const onDay = t >= d0, eve = t >= d0 + R.night[0] / 24;
      const phase = eve ? 'night' : onDay ? 'day' : 'build';
      return { id: 'halloween', label: R.label, phase, stage: onDay ? 1 : stage, down: 0, days: t - b0, eve, key: `halloween|${phase}|${Math.floor((t - b0) * 144)}` };
    }
  }
  // ---- DAY OF THE DEAD: Nov 1 4 am → Nov 3 7 pm (dressed 4 → 7 am on the 1st, down through the 3rd)
  {
    const R = HOLIDAY_TABLE[1], s0 = at(y, R.start[0], R.start[1], R.start[2]), d0 = at(y, R.day[0], R.day[1]), dEnd = d0 + R.days;
    const down0 = at(y, R.down[0], R.down[1], R.down[2]), down1 = down0 + R.downLen / 24;
    if (t >= s0 && t < down1) {
      const stage = clamp01((t - s0) / (R.dressLen / 24)), down = clamp01((t - down0) / (down1 - down0));
      const dayNo = Math.floor(t - d0);      // 0 = Nov 1, 1 = Nov 2, 2 = Nov 3
      const hr = (t - Math.floor(t)) * 24, eve = t < dEnd && hr >= R.night[0] && hr < R.night[1];
      const phase = t >= down0 ? 'down' : eve ? 'night' : 'day';
      return { id: 'dotd', label: R.label, phase, stage, down, days: t - s0, day: dayNo, eve, key: `dotd|${phase}|${dayNo}|${Math.floor((t - s0) * 144)}` };
    }
  }
  return none;
}

// a small seeded hash (the same everywhere: the pieces' order + places)
export function h01(n, salt = 0) {
  let x = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt | 0, 0x27d4eb2d);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

/** THE PUMPKINS on the speakeasy's steps: how many by the day of October, how many of them carved — MAX on Halloween */
/** the day (of October) the farm delivery brings the BIG jack-o'-lanterns to the promenade (core/harbor-holidayprops.js#BIG_PIECES) */
export const BIG_DAY = 20;
export const PUMPKINS_MAX = 5;   // (WIN: nine → five — the owner: too crowded on small iPhones)
/** WIN3 — the day (of October) the SECOND SPIDER arrives on the last N's corner web (the owner: ~2 days before the night) */
export const SPIDER2_DAY = 29;
/** 11a-2 — THE GIANT JACK-O'-LANTERN on the centre circle (the owner, Oct 26 6:52 pm): the farm's biggest pumpkin arrives on its straw-bale
 *  plinth on Oct 20 (uncarved), is CARVED OVERNIGHT into Oct 28 (by 4 am — the carvers come in the small hours; the city wakes to it),
 *  lit every night from then (its candle from dusk), brightest on Halloween night; gone with the rest at 4 am Nov 1 */
export const GIANT_DAYS = Object.freeze({ arrive: 20, carve: 28, carveH: 4 });
/** the day (of October) each pumpkin arrives (i 0..8) and the day it is carved — spread through the month, carving from ~the 18th */
export const PUMPKIN_DAYS = Object.freeze(Array.from({ length: PUMPKINS_MAX }, (_, i) => {
  const arrive = 2 + Math.round(i * 6 + h01(i, 3) * 1.6);                     // Oct 2 → ~Oct 27 (five, a week apart)
  const carve = Math.max(arrive + 1, 17 + Math.round(i * 1.4 + h01(i, 5) * 1.8)); // Oct ~17 → 31 (never the day it arrives)
  return { arrive: Math.min(29, arrive), carve: Math.min(31, carve) };
}));

/** what of HALLOWEEN shows now. H: holidayAt(); o: { hour (local 0..24) } → the pieces (0 / false = not shown) */
export function halloweenPieces(H, o = {}) {
  if (!H || H.id !== 'halloween') return null;
  const day = 1 + Math.floor(H.days), night = H.eve, hr = o.hour == null ? 12 : o.hour, late = hr < 6;
  const pumpkins = PUMPKIN_DAYS.map((p, i) => ({ i, carved: day >= p.carve || night, here: day >= p.arrive })).filter(p => p.here);
  return {
    // the web on the NEON sign: grows every day, fully woven as the night of the 31st begins
    web: H.stage,
    // the spider: on its web from the first week (it comes with its web)
    spider: H.stage > 0.08,
    // WIN3 — THE SECOND SPIDER (the owner: part of the BUILD-UP, not a Halloween-only piece): it arrives on the corner web two days
    // before the night (Oct 29), so the 30th + the 31st have two (BY DATE — the web's growth no longer decides)
    spider2: day >= SPIDER2_DAY || night,
    pumpkins,                                     // [{ i, carved }] — the steps' jack-o'-lanterns (lit inside after dark)
    // WIN — THE BIG JACK-O'-LANTERNS on the promenade's dressing spots: the farm delivery comes Oct 20 (carved at the stand), lit after dark
    bigs: day >= BIG_DAY,
    // 11a-2 — THE GIANT JACK-O'-LANTERN on the centre circle: { carved, bright } from Oct 20 (bright: Halloween night's extra candle)
    giant: day >= GIANT_DAYS.arrive ? { carved: night || H.days >= GIANT_DAYS.carve - 1 + GIANT_DAYS.carveH / 24, bright: night ? 1.3 : 1 } : null,
    // the window scenes (the build-up's weight: from mid-month, more each night, the most on the night)
    windows: night ? 1 : H.stage < 0.45 ? 0 : 0.25 + 0.6 * clamp01((H.stage - 0.45) / 0.55),
    // the people of the night (Halloween night only): trick-or-treaters from dusk → 9 pm, zombies shambling 8 pm → 2 am
    trickOrTreat: night && !late && hr < 21.25,
    zombies: night && (hr >= 20 || late) && (!late || hr < 2),
    // the bats from a tower crown + the witch: the last week's nights more, the night most (the sky reads the weight)
    bats: night ? 1 : H.stage > 0.75 ? 0.35 : 0,
    witch: night ? 1 : H.stage > 0.85 ? 0.3 : 0,
    // the black cat on the speakeasy's step (from mid-month, at dusk + after dark)
    cat: H.stage > 0.5,
    // THE LEGENDARY: the ghost ship on Halloween night only
    ghostShip: night,
    // the spooky light (deeper shadows, green-tinted windows, flickering lamps): the night full, a hint the last two evenings
    spooky: night ? 1 : H.stage > 0.93 ? 0.35 : 0,
  };
}

/**
 * 11a-2 — BIG HOLIDAY PIECES CHANGE OFF-CAMERA (the owner, Oct 26 — a rule for every holiday CENTREPIECE + big set piece): no delivery /
 * build / removal scenes — a big piece is simply THERE when the city is opened and GONE the next time it is opened once its time is over.
 * A change (appears, goes, its next stage — the giant carved) applies only at a LOAD, a return from the BACKGROUND or a jump of the clock
 * (a preview link, the panel); its moment passing while someone watches waits for the next one — never popping in or out on screen.
 * (Exceptions are scenes MEANT to be watched — the crew stringing Christmas lights, kids building the snowman — never listed here.)
 * BIG_KEYS: the pieces' keys this rule holds (every holiday's pieces object). latchBig(held, now, relatch) → the pieces to show: `now`
 * with its big keys taken from `held` unless relatch (or nothing held yet); returns { pieces, held } (held: the big keys in force).
 */
export const BIG_KEYS = Object.freeze(['giant', 'bigs', 'harvest', 'centre']);
export function latchBig(held, now, relatch = false) {
  const fresh = {}; for (const k of BIG_KEYS) if (now && now[k] != null) fresh[k] = now[k];
  const use = relatch || !held ? fresh : held;
  if (!now && !Object.keys(use).length) return { pieces: null, held: use };
  const pieces = { ...(now || {}) };
  for (const k of BIG_KEYS) { if (use[k] != null) pieces[k] = use[k]; else delete pieces[k]; }
  return { pieces, held: use };
}

/** THE GHOST SHIP's crossings on Halloween night (local hours on the evening's clock: 24.5 = 00:30) — seeded by the year, the
 *  same for everyone: one early (20:45 → 21:45), one late (23:00 → 00:30). Each crossing takes GHOST_LEN s. */
export const GHOST_LEN = 150;
export function ghostShipTimes(y) {
  return [20.75 + h01(y, 11) * 1.0, 23 + h01(y, 13) * 1.5].map(h => Math.round(h * 60) / 60);
}
/** the ghost ship's crossing at a local moment: { s (seconds in), len, n } or null — on Halloween night only */
export function ghostShipAt(lc) {
  if (!lc) return null;
  const hr = lc.h + (lc.mi || 0) / 60 + (lc.s || 0) / 3600;
  // the evening's clock: after midnight it's still Oct 31's night
  const ev = hr < 12 ? { m: lc.m, d: lc.d - 1, hr: hr + 24 } : { m: lc.m, d: lc.d, hr };
  const isEve = (ev.m === 10 && ev.d === 31) || (lc.m === 11 && lc.d === 1 && hr < 12);
  if (!isEve) return null;
  const ts = ghostShipTimes(lc.y);
  for (let n = 0; n < ts.length; n++) { const s = (ev.hr - ts[n]) * 3600; if (s >= 0 && s < GHOST_LEN) return { s, len: GHOST_LEN, n }; }
  return null;
}

/** what of DAY OF THE DEAD shows now. H: holidayAt(); o: { hour, dusk (local hour of sunset; ~17.6 in Grand Rapids in early Nov) } */
export function dotdPieces(H, o = {}) {
  if (!H || H.id !== 'dotd') return null;
  const up = H.stage * (1 - H.down), hr = o.hour == null ? 12 : o.hour, dusk = o.dusk == null ? 17.6 : o.dusk;
  // each piece goes up in its own order through the dressing (4 → 7 am) and comes down in reverse through Nov 3
  const piece = (a, b) => clamp01((H.stage - a) / (b - a)) * (1 - clamp01((H.down - (1 - b)) / (b - a)));
  return {
    up,
    marigolds: piece(0, 0.35),       // in the planters
    garlands: piece(0.15, 0.55),     // on the lamp posts
    papel: piece(0.3, 0.75),         // papel picado across the promenade (fluttering in the real wind)
    petals: piece(0.55, 0.9),        // the marigold petal path to the speakeasy's door
    sign: piece(0.1, 0.6),           // the NEON sign: the marigold garland, papel picado between the letters, candles at its base
    ofrendas: piece(0.2, 0.7),       // the candlelit ofrendas in the windows (Group 1's kit)
    // Nov 2 at dusk: the candlelight PROCESSION along the waterside road (from 10 min after sunset, ~70 min)
    procession: H.day === 1 && hr >= dusk + 1 / 6 && hr < dusk + 1 / 6 + 70 / 60,
    // rare monarch butterflies by day (Nov 1 + 2)
    monarchs: H.day < 2 && hr > 9.5 && hr < dusk - 0.5,
    // the tubes warming to marigold / pink (the sign's colours; on the days themselves)
    warm: H.phase !== 'down' ? up : 0,
  };
}
/** the procession's place at a local moment (Nov 2): seconds since it began (0 → PROCESSION_LEN) or null */
export const PROCESSION_LEN = 70 * 60;
export function processionAt(lc, dusk = 17.6) {
  if (!lc || lc.m !== 11 || lc.d !== 2) return null;
  const hr = lc.h + (lc.mi || 0) / 60 + (lc.s || 0) / 3600, s = (hr - (dusk + 1 / 6)) * 3600;
  return s >= 0 && s < PROCESSION_LEN ? s : null;
}

/**
 * THE HOLIDAY LIGHT RULES (reusable: Thanksgiving + Christmas add rows). H: holidayAt(); o: { dark (0..1 the night) } →
 * { wheel: scheme | null, beam: [r,g,b] | null, rosie: scheme | null, strings: scheme | null, sign: 'halloween' | 'dotd' | null,
 *   windowTint: [r,g,b] multiply | null, windowTintK (0..1), lampFlicker (0..1), shadow (0..1 deeper shadows), signLight: '#hex' | null }
 * null = the city's own (the party / the defaults keep it).
 */
export function lightRules(H, o = {}) {
  const out = { wheel: null, beam: null, rosie: null, strings: null, sign: null, windowTint: null, windowTintK: 0, lampFlicker: 0, shadow: 0, signLight: null };
  if (!H || !H.id) return out;
  const dark = o.dark == null ? 1 : o.dark;
  if (H.id === 'halloween') {
    const p = halloweenPieces(H, o) || {};
    // the wheel orange / purple from the last week's evenings; the beam eerie green + Rosie + the roof's strings on the night
    if (H.stage > 0.75 || H.eve) out.wheel = 'halloween';
    if (H.eve) { out.beam = [96, 255, 150]; out.rosie = 'halloween'; out.strings = 'halloween'; out.sign = 'halloween'; out.signLight = '#ff8a2a'; }
    const sp = (p.spooky || 0) * dark;
    out.windowTint = [196, 255, 214]; out.windowTintK = 0.55 * sp; out.lampFlicker = sp; out.shadow = 0.5 * sp;
  } else if (H.id === 'dotd') {
    const p = dotdPieces(H, o) || {};
    if (p.warm > 0.5) { out.sign = 'dotd'; out.signLight = '#ffa62a'; out.strings = p.up > 0.5 ? 'dotd' : null; out.wheel = p.up > 0.5 ? 'dotd' : null; }
  }
  return out;
}

/** the City 1.0-shaped holiday the title's sign dressing reads (title.js#dressSign: { id, full, k }) — City 2.0's calendar mapped */
export function titleHoliday(H) {
  if (!H || !H.id) return null;
  if (H.id === 'halloween') return { id: 'halloween', full: H.phase !== 'build', k: H.phase === 'build' ? 0.3 + 0.45 * H.stage : 1, c2: true };
  if (H.id === 'dotd') return { id: 'dotd', full: H.phase !== 'down', k: H.stage * (1 - H.down), c2: true };
  return null;
}

/** THE SPOOKY LIGHT's lamp gutter (Halloween night): lamp i at second s → how far it drops now (0 = steady … ~0.9 = nearly out) — each lamp
 *  its own 7–13 s cycle, half of its cycles a short stutter (a dip, a catch, a dip) in the cycle's first second */
export function spookyFlicker(s, i) {
  const per = 7 + 6 * h01(i, 31), sh = per * h01(i, 37), n = Math.floor((s + sh) / per), u = s + sh - n * per;
  if (u > 0.95 || h01(n * 31 + i, 41) > 0.5) return 0;
  return u < 0.08 ? 0.85 : u < 0.2 ? 0.25 : u < 0.32 ? 0.7 : u < 0.5 ? 0.1 : u < 0.64 ? 0.55 : u < 0.8 ? 0.15 : 0;
}
