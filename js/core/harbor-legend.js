// CITY 2.0 — THE HARBOR, PART 6b: THE LEGENDARY SKY — WHEN + HOW (PURE: no DOM, no clock of its own; tests/harbor-legend.test.mjs).
// docs/harbor.md#part-6b. The two legendary events — THE UFO ABDUCTION and THE TR-3B (+ its jet chase) — and the rarer everyday
// stunts on the clock: THE BARNSTORMER (a few times a week). Everything is a function of the date (the same nights for everyone,
// seeded) and of the seconds since an event began (a phone that joins mid-way lands mid-way; a refresh never re-rolls).
//   legendNight(y, m, d)   tonight's legendary (the EVENING's date): { kind: 'ufo' | 'tr3b', h } or null — ~1.5 a month each,
//                          never both on one night, never two legendary nights in a row
//   barnstormDay(y, m, d)  the barnstormer's day: { h } or null — ~3 days a week (by day; now and then after dark)
//   ufoAt(s) / tr3bAt(s)   each event's state s seconds in (its phases, the craft, the beam, the figure, the drain, the music)
//   drainAt(x, d)          THE TR-3B's POWER DRAIN at a screen x (0 = cut dead … 1 = untouched) for a band (its range by distance)
import { hashString, rngFrom } from './rng.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const DAY = 864e5;
const dateKey = (y, m, d) => `${y}-${m}-${d}`;
const prevDay = (y, m, d) => { const p = new Date(Date.UTC(y, m - 1, d) - DAY); return [p.getUTCFullYear(), p.getUTCMonth() + 1, p.getUTCDate()]; };

/** each legendary's share of the nights: ~1.5 a month each (the owner: "~1–2 a month") */
export const LEGEND_P = 0.05;
/** how long each runs (s): the abduction's short film, the TR-3B's crossing + the chase + the power coming back */
export const UFO_LEN = 30, TR3B_LEN = 50;
/** the legendary hours (local, the evening's clock: 24.5 = 00:30 the next morning) */
export const LEGEND_HOURS = [21.5, 24.75];

function dice(y, m, d) {
  const r = rngFrom(hashString(`legend|${dateKey(y, m, d)}`));
  const u = r(), h = r();
  return { kind: u < LEGEND_P ? 'ufo' : u < 2 * LEGEND_P ? 'tr3b' : null, h: Math.round(lerp(LEGEND_HOURS[0], LEGEND_HOURS[1], h) * 60) / 60 };
}
/** tonight's legendary (y, m, d = the EVENING's local date) → { kind, h } | null. Never two legendary nights in a row. */
export function legendNight(y, m, d) {
  const t = dice(y, m, d);
  if (!t.kind) return null;
  if (dice(...prevDay(y, m, d)).kind) return null;
  return t;
}
/** the evening a local clock moment belongs to (after midnight → the day before) and its hour on that evening's clock */
export function eveningOf(lc) {
  const hr = lc.h + lc.mi / 60 + (lc.s || 0) / 3600;
  if (hr >= 12) return { y: lc.y, m: lc.m, d: lc.d, hr };
  const [y, m, d] = prevDay(lc.y, lc.m, lc.d);
  return { y, m, d, hr: hr + 24 };
}
/** the legendary running at a local moment: { kind, s (seconds in), len } or null (lc: the city clock's local { y, m, d, h, mi, s }) */
export function legendAt(lc) {
  if (!lc) return null;
  const ev = eveningOf(lc), t = legendNight(ev.y, ev.m, ev.d);
  if (!t) return null;
  const s = (ev.hr - t.h) * 3600, len = t.kind === 'ufo' ? UFO_LEN : TR3B_LEN;
  return s >= 0 && s < len ? { kind: t.kind, s, len, h: t.h } : null;
}

/** THE BARNSTORMER: ~3 days a week, at a seeded hour by day (one in five after dark: its wingtip lights on the tubes) → { h } | null */
export function barnstormDay(y, m, d) {
  const r = rngFrom(hashString(`barnstorm|${dateKey(y, m, d)}`));
  if (r() >= 0.43) return null;
  const night = r() < 0.2;
  return { h: Math.round((night ? lerp(20.75, 22.5, r()) : lerp(10.5, 17.5, r())) * 60) / 60, night };
}
export const BARN_LEN = 16;

// ------------------------------------------------------------------ THE UFO ABDUCTION (a short film, ~30 s)
/**
 * The abduction s seconds in → {
 *   phase   'approach' | 'beam' | 'lift' | 'vanish' | 'close' | 'leave' | 'gone'
 *   craft   { k (0..1 how far it has come in: its size + its height), x (0..1: −1 = still far up-left … its hover), bob, tilt, out (0..1 leaving) }
 *   beam    { open (0..1 how far down it reaches), k (its brightness 0..1) }
 *   walker  { u (0..1 along the walk in), pose: 'walk' | 'look' | 'point' | 'stand' } — before the lift
 *   lift    { h (0..1 from the ground to the craft's belly), arch (0..1 the pose), turn (rad), fade (0..1 into the light), hat (0..1 its
 *            own float — off the head first) }
 *   lamps   0..1 how much the lamps under it flicker (the approach, the beam)
 *   music   { duck (level 0..1), hz (the low-pass) } — the dip + the muffle while it's here
 * }
 */
export function ufoAt(s) {
  const P = s < 5.5 ? 'approach' : s < 8.5 ? 'beam' : s < 20 ? 'lift' : s < 21.6 ? 'vanish' : s < 23.6 ? 'close' : s < 27 ? 'leave' : 'gone';
  const k = smooth(0, 5.5, s);
  // (THE LIFT: slow, then faster — an ease-in over 11.5 s, the last stretch quick into the light)
  const lu = clamp01((s - 9) / 11.2), h = lu * lu * (0.55 + 0.45 * lu);
  const out = smooth(24.6, 27, s);
  return {
    phase: P, len: UFO_LEN,
    craft: { k, x: 1 - k, bob: Math.sin(s * 1.3) * (1 - out), tilt: (1 - k) * -0.16 + out * 0.22 + Math.sin(s * 0.7) * 0.02, out, pause: smooth(23.6, 24.6, s) },
    beam: { open: smooth(5.5, 7.6, s) * (1 - smooth(21.8, 23.4, s)), k: smooth(5.4, 6.4, s) * (1 - smooth(22.4, 23.6, s)) * (0.85 + 0.15 * smooth(9, 12, s)) },
    walker: { u: smooth(0, 6.2, s), pose: s < 6.2 ? 'walk' : s < 6.9 ? 'look' : s < 8.4 ? 'point' : 'stand' },
    lift: { h, arch: smooth(9.2, 11.4, s), turn: 0.3 * Math.sin(Math.max(0, s - 9) * 0.5) + 0.12 * Math.max(0, s - 9) * smooth(9, 20, s),   // (a slow sway round side-on — end-on the arch would read as a hunch)
                  fade: smooth(18.6, 21.2, s), hat: clamp01((s - 11.2) / 7.5), on: s >= 9 && s < 21.4 },
    lamps: smooth(3.2, 5.2, s) * (1 - smooth(22, 25, s)),
    music: { duck: lerp(1, 0.42, smooth(1, 4, s) * (1 - smooth(25, 29, s))), hz: lerp(20000, 900, smooth(1.5, 5, s) * (1 - smooth(24.5, 29, s))) },
  };
}

// ------------------------------------------------------------------ THE TR-3B + THE JET CHASE (~50 s)
/** where the TR-3B is: x across the screen (fraction: −0.45 → 1.45 over its crossing), its direction (seeded) */
export const TR3B_CROSS = 30;
/**
 * The TR-3B s seconds in (dir ±1: left → right or right → left) → {
 *   phase  'cross' | 'gap' | 'chase' | 'restore' | 'gone'
 *   x      the craft's centre across the screen (fraction of W; off the screen before + after)
 *   dip    0..1 its height in the band (it sinks a touch over the city, then holds)
 *   pulse  the centre orb's slow pulse 0..1
 *   drain  0..1 how hard it pulls (on while it's over the city; 0 before it arrives — the city comes back behind it)
 *   chase  { on, u (0..1 across the screen) } — 2–3 F-16s screaming after it, a few seconds after it leaves
 *   music  { rate (the tape's speed), hz (the low-pass), duck (level), crackle (0..1 the interference) }
 * }
 */
export function tr3bAt(s, dir = 1) {
  const u = clamp01(s / TR3B_CROSS);
  const x0 = -0.5, x1 = 1.5, xf = lerp(x0, x1, u);
  const x = dir > 0 ? xf : 1 - xf;
  const chaseU = (s - 34) / 3.4;
  const P = s < TR3B_CROSS ? 'cross' : s < 34 ? 'gap' : s < 37.6 ? 'chase' : s < TR3B_LEN - 4 ? 'restore' : s < TR3B_LEN ? 'restore' : 'gone';
  // THE MUSIC POWERS DOWN as it nears (a tape stop: the speed sags, muffled, a warble), almost gone overhead, comes back after the jets
  const down = smooth(3, 10, s) * (1 - smooth(38, 44, s));
  return {
    phase: P, len: TR3B_LEN, x, dir, u,
    dip: smooth(0, 8, s) * 0.6 + 0.4 * smooth(8, TR3B_CROSS, s) * 0.5,
    pulse: 0.5 + 0.5 * Math.sin(s * 2.1),
    drain: smooth(0.5, 3.5, s) * (1 - smooth(TR3B_CROSS - 1, TR3B_CROSS + 3, s)),
    chase: { on: chaseU > -0.15 && chaseU < 1.2, u: chaseU },
    music: { rate: lerp(1, 0.42, smooth(4, 11, s) * (1 - smooth(38.5, 40, s))), hz: lerp(20000, 380, down), duck: lerp(1, 0.1, down), crackle: smooth(4, 9, s) * (1 - smooth(30, 36, s)) },
  };
}
/** the TR-3B's direction for tonight (seeded by the evening's date) */
export const tr3bDir = (y, m, d) => (hashString(`tr3b-dir|${dateKey(y, m, d)}`) & 1 ? 1 : -1);

/**
 * THE POWER DRAIN at a screen x (fraction of W) — 1 = untouched, 0 = cut dead. The craft at cx (fraction), pulling `drain` (0..1);
 * band: 'city' (right under it: everything near its track dies), 'harbor' (a little further: dims hard, flickers), 'near' (the
 * promenade, nearest us: the edge of its range — a sputter + a dip). The zone TRAILS the craft (the lights come back behind it
 * slowly, unevenly: `lag` is each place's own extra recovery — a few lights slow to come back). flick: a 0..1 noise for the sputter.
 */
export const DRAIN = Object.freeze({ city: { r0: 0.13, r1: 0.42, floor: 0 }, harbor: { r0: 0.08, r1: 0.36, floor: 0.12 }, near: { r0: 0, r1: 0.34, floor: 0.45 } });
export function drainAt(x, cx, drain, band = 'city', dir = 1, lag = 0, flick = 0.5) {
  if (!(drain > 0)) return 1;
  const B = DRAIN[band] || DRAIN.city;
  // (behind the craft the zone stretches — the lights recover late, each with its own lag; ahead of it the edge comes sooner)
  const dx = (x - cx) * dir, behind = dx < 0;
  const d = Math.abs(dx) / (behind ? 1.6 + lag * 1.2 : 1);
  const core = 1 - smooth(B.r0, B.r1, d);                    // 1 right under it … 0 out of range
  const k = clamp01(core * drain);
  if (k <= 0.001) return 1;
  // the edge of its range sputters (lights stutter before they die); the middle is dead
  const edge = k > 0.05 && k < 0.85 ? (flick - 0.5) * 0.7 * Math.sin(Math.PI * k) : 0;
  return clamp01(lerp(1, B.floor, k) + edge);
}

// ------------------------------------------------------------------ THE JETS (shared: the TR-3B's chase, the air show, the missing man)
/**
 * A formation's slots (in jet lengths, x back along the flight, y down on the screen) — 'chase' (three in a tight echelon), 'diamond'
 * (four: lead, two wings, the slot), 'finger' (the missing man's finger-four: lead, #2, #3 (the one who pulls up), #4).
 */
export const FORMATIONS = Object.freeze({
  chase: [[0, 0], [-1.25, 0.42], [-2.5, 0.84]],
  diamond: [[0, 0], [-1.1, -0.5], [-1.1, 0.5], [-2.2, 0]],
  finger: [[0, 0], [-1.1, 0.45], [-1.1, -0.45], [-2.2, -0.9]],
});
/** the missing man's #3 pulls up and away: its climb (rad) and its own path's offset u seconds into the pass (0..1) */
export function missingManAt(u) { const k = smooth(0.42, 0.7, u); return { climb: k * 0.9, rise: k * k * 2.6, slow: 1 - 0.18 * k }; }
