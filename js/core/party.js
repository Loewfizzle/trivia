// PARTY NIGHTS (PURE): Friday and Saturday nights, 8 pm → 2 am local, the city comes alive on the beat (docs/title.md).
// The window, the shape of the night (warm-up → peak → after hours), the beat clock that breathes with the music, the party
// palette, and which windows join in. No DOM, no audio: title.js / district/scene.js draw what this decides.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };

export const PARTY_START_H = 20;     // 8 pm
export const PARTY_END_H = 26;       // 2 am (as an hour of the evening's day)
export const PARTY_FADE_MIN = 1.5;   // the wind-down at 2 am, minutes
export const FALLBACK_BREATH_S = 3.5; // one breath every 3.5 s before the music plays

/** THE HOMECOMING (11a-2): the night before Thanksgiving (the fourth Thursday of November) is a party night too. partyDow → the day of
 *  the week as the party sees it: that Wednesday counts as a Friday (its evening), Thanksgiving itself as a Sunday (only the party's
 *  small hours — its own evening stays quiet); every other day is itself */
const tgDay = y => { const dow = new Date(Date.UTC(y, 10, 1)).getUTCDay(); return 1 + ((4 - dow + 7) % 7) + 21; };
export function partyDow(y, m, d, dow) { if (m !== 11 || !y) return dow; const td = tgDay(y); return d === td - 1 ? 5 : d === td ? 0 : dow; }
export const homecomingNight = (y, m, d) => m === 11 && d === tgDay(y) - 1;

/** The hour as an hour of the EVENING's day: 20..26 through a party night, 2 am = 26 (null outside a Fri/Sat night — or the homecoming). */
export function partyHour(local) {
  if (!local) return null;
  const hr = (local.h || 0) + (local.mi || 0) / 60 + (local.s || 0) / 3600;
  const dow = local.y ? partyDow(local.y, local.m, local.d, local.dow) : local.dow;
  if ((dow === 5 || dow === 6) && hr >= PARTY_START_H - 0.5) return hr;          // the evening (from 7:30 pm, for the fade-in maths)
  if ((dow === 6 || dow === 0) && hr < PARTY_END_H - 24 + 1.5) return hr + 24;    // the small hours (to 3:30 am, for the fade-out)
  return null;
}

/** Is this local time inside the party window (8 pm → 2 am, Fri and Sat nights)? */
export function inPartyWindow(local) {
  const h = partyHour(local);
  return h != null && h >= PARTY_START_H && h < PARTY_END_H;
}

/** The phase of the night: 'warm' (8–10 pm), 'peak' (10 pm–midnight), 'after' (midnight–2 am), or null. */
export function partyPhase(local) {
  const h = partyHour(local);
  if (h == null || h < PARTY_START_H || h >= PARTY_END_H) return null;
  return h < 22 ? 'warm' : h < 24 ? 'peak' : 'after';
}

/** The night's energy, 0..1, blended smoothly across the phases: warm-up 0.6 → 0.75, the peak 1, after hours 0.7. */
export function partyEnergy(local) {
  const h = partyHour(local);
  if (h == null) return 0;
  return 0.6 + 0.15 * smooth(20, 22, h) + 0.25 * smooth(21.6, 22.3, h) - 0.3 * smooth(23.7, 24.4, h);
}

/**
 * The party right now. { on: 0..1 (1 through the night, winding down over ~1.5 min after 2 am), phase, energy, hour, ending }
 * caught: the neon has caught tonight (the party never starts in daylight: 8 pm OR the catch, whichever is later).
 * force: a preview (&force=party) — on regardless of the clock, at the peak.
 */
export function partyState(local, { caught = true, force = false } = {}) {
  if (force) return { on: 1, phase: 'peak', energy: 1, hour: 23, ending: false, forced: true };
  const h = partyHour(local);
  if (h == null || !caught) return { on: 0, phase: null, energy: 0, hour: h, ending: false };
  const fadeOut = 1 - smooth(PARTY_END_H, PARTY_END_H + PARTY_FADE_MIN / 60, h);
  const on = h >= PARTY_START_H ? fadeOut : 0;
  if (on <= 0) return { on: 0, phase: null, energy: 0, hour: h, ending: h >= PARTY_END_H };
  return { on, phase: partyPhase(local) || 'after', energy: partyEnergy(local), hour: h, ending: h >= PARTY_END_H };
}

/** The late-night wind-down (core/sky.js): on a party night the windows stay lit until 2 am, then go out over the next hour.
 *  Returns the share wound down, 0..1, or null when it's not a party night (the usual rule applies). */
export function partyLateK(local) {
  const h = partyHour(local);
  if (h == null) return null;
  if (h < PARTY_END_H) return 0;
  return smooth(PARTY_END_H, PARTY_END_H + 1, h);
}

/** The finale is due: the moment local midnight passes on a party night (prevHour / hour as partyHour values). */
export function finaleDue(prevHour, hour) {
  return prevHour != null && hour != null && prevHour < 24 && hour >= 24 && hour < 24.1;
}

// ---------------------------------------------------------------- the beat clock
// A breath is a swell of light that peaks on the beat and relaxes until the next: it rises over the last ~14 % of a beat and
// eases down over the first ~75 %. The clock keeps its own phase and rate; a song pulls both toward it gently (no jump),
// and without one (before the first tap, music off, a song loading) it breathes once every 3.5 s.
/** The swell, 0..1, at a phase 0..1 (0 = the beat). */
export function breathShape(phase) {
  const u = phase - Math.floor(phase);
  const decay = 1 - smooth(0, 0.75, u);
  const attack = smooth(0.8, 1, u);   // a soft attack (~150 ms at 80 bpm): a breath in, not a strobe
  return Math.max(decay, attack);
}

/** Breaths per beat for a tempo: a breath per beat up to ~84 bpm, every second beat above (never faster than ~1.4 breaths / s). */
export function breathDiv(bpm) {
  if (!bpm) return 1;
  let div = 1;
  while (bpm / div > 84) div *= 2;
  return div;
}

export function createBeatClock() {
  return { phase: Math.random(), rate: 1 / FALLBACK_BREATH_S, bpm: 0, locked: 0, bars: 0 };
}

/**
 * Advance the clock by dt ms. song: { bpm, pos (s) } or null. Returns the state (mutated): phase (0..1 of a breath), rate
 * (breaths / s), locked (0..1 how far onto the song it has eased), beat (true the frame a breath peaks), bar (counts breaths).
 */
export function advanceBeat(bc, dt, song) {
  const sec = Math.min(0.25, Math.max(0, dt / 1000));
  const before = bc.phase;
  if (song && song.bpm > 0 && song.pos >= 0) {
    const div = breathDiv(song.bpm);
    const target = song.bpm / 60 / div;                                   // breaths per second on this song
    const tp = (song.pos * target) % 1;                                   // where the song's breath is right now
    // ease the rate over ~2 s, and pull the phase toward the song's a little every second (the shortest way round)
    bc.rate += (target - bc.rate) * Math.min(1, sec * 1.6);
    let d = tp - bc.phase; d -= Math.round(d);
    bc.phase += d * Math.min(1, sec * 1.4);
    bc.locked = Math.min(1, bc.locked + sec / 2.5);
    bc.bpm = song.bpm;
  } else {
    bc.rate += (1 / FALLBACK_BREATH_S - bc.rate) * Math.min(1, sec * 0.8);
    bc.locked = Math.max(0, bc.locked - sec / 2.5);
    bc.bpm = 0;
  }
  bc.phase += bc.rate * sec;
  bc.beat = Math.floor(bc.phase) > Math.floor(before) || (bc.phase - Math.floor(bc.phase)) < (before - Math.floor(before)) - 0.5;
  if (bc.beat) bc.bars++;
  bc.phase -= Math.floor(bc.phase);
  bc.breath = breathShape(bc.phase);
  return bc;
}

// ---------------------------------------------------------------- colours
// the city's own neon: pink, cyan, violet, gold (+ white for the fireworks); a holiday brings its own
export const PARTY_PALETTES = {
  default: [[255, 63, 176], [63, 224, 255], [166, 91, 255], [255, 204, 90]],
  halloween: [[255, 138, 42], [155, 61, 255], [255, 170, 60], [200, 110, 255]],
  christmas: [[255, 48, 72], [40, 230, 120], [255, 220, 150], [120, 200, 255]],
  valentine: [[255, 79, 138], [255, 140, 180], [255, 220, 230], [200, 90, 255]],
  stpatrick: [[61, 255, 139], [120, 255, 180], [255, 230, 140], [60, 200, 255]],
  easter: [[255, 138, 208], [138, 216, 255], [180, 138, 255], [255, 216, 106]],
  thanksgiving: [[255, 160, 64], [255, 110, 60], [255, 210, 120], [200, 90, 255]],
  july4: [[255, 60, 80], [240, 244, 255], [90, 140, 255], [255, 255, 255]],
  nye: [[255, 210, 122], [255, 240, 200], [200, 220, 255], [255, 140, 200]],
};
export const partyPalette = holidayId => PARTY_PALETTES[holidayId] || PARTY_PALETTES.default;

// ---------------------------------------------------------------- which windows join in
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hash(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; }

/** The seed for tonight's party set: the evening's date (the small hours belong to the night before). */
export function partySeed(local) {
  if (!local) return 'party';
  let { y, m, d } = local;
  if ((local.h || 0) < 6) { const dt = new Date(Date.UTC(y, m - 1, d) - 86400000); y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate(); }
  return `party:${y}-${m}-${d}`;
}

/**
 * Picks the party windows of one skyline layer: about a quarter of the lit windows, some as whole floors lit in one colour.
 * windows: [{ x, y, w, h }] (lit ones only), seed: string, palette: [[r,g,b]...]. Returns [{ i, col, floor, extra }] — extra
 * marks the few more that come on at the peak. Deterministic for a seed; the same every time the city is rebuilt tonight.
 */
export function pickPartyWindows(windows, seed, palette, share = 0.25) {
  const R = rng(hash(seed));
  const out = [];
  const taken = new Set();
  const colour = () => { const r = R(); return palette[r < 0.3 ? 0 : r < 0.58 ? 1 : r < 0.84 ? 2 : 3]; };
  // whole floors: windows on one row (the same y, close in x) — a floor at a time, lit in one colour
  const rows = new Map();
  windows.forEach((w, i) => { const k = `${Math.round(w.y)}|${Math.round(w.h)}`; if (!rows.has(k)) rows.set(k, []); rows.get(k).push(i); });
  const floors = [...rows.values()].filter(r => r.length >= 3);
  const wantFloors = Math.max(1, Math.round(floors.length * 0.09));
  for (let n = 0; n < wantFloors && floors.length; n++) {
    const row = floors.splice(Math.floor(R() * floors.length), 1)[0];
    // a floor is a run of neighbours: split the row where there's a wide gap (another building)
    row.sort((a, b) => windows[a].x - windows[b].x);
    let run = [row[0]];
    const runs = [run];
    for (let j = 1; j < row.length; j++) { if (windows[row[j]].x - windows[row[j - 1]].x > windows[row[j]].w * 4.5) { run = []; runs.push(run); } run.push(row[j]); }
    const pick = runs.filter(r => r.length >= 3)[0];
    if (!pick) continue;
    const col = colour();
    for (const i of pick) if (!taken.has(i)) { taken.add(i); out.push({ i, col, floor: true, extra: false }); }
  }
  // single windows, up to the share (a few of them the peak's extras)
  const want = Math.round(windows.length * share);
  const order = windows.map((_, i) => i).sort(() => R() - 0.5);
  for (const i of order) {
    if (out.length >= want) break;
    if (taken.has(i)) continue;
    taken.add(i);
    out.push({ i, col: colour(), floor: false, extra: R() < 0.3 });
  }
  return out;
}
