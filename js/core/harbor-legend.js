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

/**
 * THE SURPRISE FLYBY (POLISH 4, the owner): now and then, unannounced, a few F-16s scream straight across the sky — from GOLDEN
 * HOUR until 11 pm, weighted toward after dark (when the afterburners look best), in a random direction. ~Twice a month, the
 * same for everyone (seeded by the date). duskH: tonight's sunset as a local hour (the golden hour starts ~1 h before it).
 * → { h (local hour), dir (±1), n (2–4 jets), night (after dark) } | null
 */
// (8b1, the owner's decision: ~TWICE A MONTH on random days — POLISH 4 shipped ~2 evenings a week — and NEVER on a legendary night:
// the UFO / the TR-3B own that sky. 0.073 × the nights that aren't legendary ≈ 2.0 a month.)
export const FLYBY_P = 0.073;
export function flybyDay(y, m, d, duskH = 19) {
  const r = rngFrom(hashString(`flyby|${dateKey(y, m, d)}`));
  if (r() >= FLYBY_P || legendNight(y, m, d)) return null;
  const night = r() < 0.72, u = r(), dark0 = Math.min(22.4, duskH + 0.6), gold0 = Math.min(dark0 - 0.25, duskH - 1);
  const h = night ? lerp(dark0, 23, u) : lerp(gold0, dark0, u);
  return { h: Math.round(h * 120) / 120, dir: r() < 0.5 ? 1 : -1, n: 2 + Math.floor(r() * 3), night };
}

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
  const chaseU = (s - CHASE.t0) / CHASE.dur;
  const P = s < TR3B_CROSS ? 'cross' : s < CHASE.t0 ? 'gap' : s < BLACK.on0 ? 'chase' : s < TR3B_LEN ? 'restore' : 'gone';
  // THE MUSIC POWERS DOWN as it nears — a record player losing power (POLISH 4, the owner's iPhone: "it doesn't do that weird drone
  // down … and slowly get back up to speed"): the SPEED + PITCH sag first while it's still LOUD (3.5 → 10.5 s: an audible drone-down,
  // never under 0.5 — iOS Safari mutes a media element below half speed), only then muffled + faded to a hum (8.5 → 12.5 s); after the
  // jets the VOLUME comes back first (38.6 → 40.4 s) at the low speed, then it SPINS UP slowly (39.4 → 45.5 s) as the filter opens
  const sag = smooth(3.5, 10.5, s), up = smooth(39.4, 45.5, s), fadeOut = smooth(8.5, 12.5, s), back = smooth(38.6, 40.4, s);
  return {
    phase: P, len: TR3B_LEN, x, dir, u,
    dip: smooth(0, 8, s) * 0.6 + 0.4 * smooth(8, TR3B_CROSS, s) * 0.5,
    pulse: 0.5 + 0.5 * Math.sin(s * 2.1),
    drain: smooth(0.5, 3.5, s) * (1 - smooth(TR3B_CROSS - 1, TR3B_CROSS + 3, s)),
    chase: { on: chaseU > -0.15 && chaseU < CHASE.uOff, u: chaseU },
    music: { rate: lerp(1, 0.5, sag * (1 - up)), hz: lerp(20000, 380, smooth(6, 12, s) * (1 - smooth(39.4, 45, s))), duck: lerp(1, 0.12, fadeOut * (1 - back)), crackle: smooth(4, 9, s) * (1 - smooth(30, 36, s)), catchUp: s > 38.2 && s < 38.9 },
  };
}
/** THE CHASE's pass (s into the event): three F-16s a few seconds behind the TR-3B, across the screen in `dur` s — the lead's x
 *  (fraction of W) goes −0.25 → 1.25 over u 0..1 (each jet `back` jet lengths behind it); `uOff` — the last plume is off the screen */
export const CHASE = Object.freeze({ t0: 34, dur: 3.4, uOff: 1.45 });
/** the chase's lead x (fraction of W, as if flying right) u into its pass, a jet `back` lengths behind (len: a jet's length as a fraction of W) */
export const chaseX = (u, back = 0, len = 0.2) => lerp(-0.25, 1.25, u) + back * len;
/** when (s into the event) the chase formation's middle crosses the screen's centre — the roar's peak lands there */
export function chasePeakS(len = 0.2) {
  const mid = FORMATIONS.chase.reduce((a, [fx]) => a + fx, 0) / FORMATIONS.chase.length;   // (the formation's centre, in jet lengths behind)
  return CHASE.t0 + CHASE.dur * ((0.5 - mid * len + 0.25) / 1.5);
}

/**
 * THE BLACKOUT (POLISH 4, the owner: "a COMPLETE BLACKOUT — the whole city dark while it crosses, staying dark through the JET FLYBY;
 * only after the jets leave does the power FLICKER BACK ON from the BACK of the city to the FRONT, uneven and stuttering").
 * A light's power s seconds in (0 = dead … 1 = on), on top of the drain's own sputter near the craft (drainAt):
 *   DYING   each light dies at its own moment — the side the craft comes in on first (`die0` s in), the far side `dieSpan` s later,
 *           ± a little — after `sput` s of STUTTER (quick on/off flicks, the off share growing, the light sagging); the promenade
 *           holds a beat longer. By ~10 s the whole city is dark.
 *   DARK    everything, through the crossing, the gap and the jets' pass
 *   BACK    after the jets have gone (`on0` s in), depth by depth — the FAR skyline first, then its near rows, the NEON sign, the
 *           harbor, the promenade last — each light after its own stutter (dim flicks, more of them as it catches), now and then
 *           one dropping out once more just after it came on
 * depth: 'far' (the skyline's far rows) | 'city' (its near rows) | 'sign' (the NEON sign + the tagline) | 'harbor' | 'near' (the
 * promenade); xf: the light's place across the screen (fraction of W); i: its own id (its moments). PURE (every phone the same).
 */
export const BLACK = Object.freeze({ die0: 3.4, dieSpan: 5.2, sput: 1.4, on0: 40.2, onSpan: 1.5, depth: Object.freeze({ far: 0, city: 1.0, sign: 1.8, harbor: 2.5, near: 3.4 }) });
const h01 = (a, b) => { let h = (a * 374761393 + b * 668265263 + 1013904223) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
export function blackAt(s, xf, depth = 'city', dir = 1, i = 0) {
  const B = BLACK, dz = B.depth[depth] ?? B.depth.city;
  // dying: the entry side first
  const xd = clamp01(dir > 0 ? xf : 1 - xf);
  const tDie = B.die0 + B.dieSpan * xd + 0.9 * h01(i, 11) + (depth === 'near' ? 0.5 : depth === 'harbor' ? 0.25 : 0);
  // back on: the far skyline first … the promenade last
  const tOn = B.on0 + dz + B.onSpan * h01(i, 23);
  if (s < tDie - B.sput) return 1;
  if (s < tDie) {
    const u = (s - (tDie - B.sput)) / B.sput, n = h01(i + 31, Math.floor(s * 12));
    return n < 0.12 + 0.78 * u ? 0 : 1 - 0.55 * u;
  }
  if (s < tOn - B.sput) return 0;
  if (s < tOn) {
    const u = (s - (tOn - B.sput)) / B.sput, n = h01(i + 57, Math.floor(s * 13));
    return n < 0.14 + 0.62 * u * u ? 0.35 + 0.5 * u : 0;
  }
  // caught: a quick warm-up, and one light in four drops out once more just after
  const v = s - tOn;
  if (h01(i, 41) < 0.25 && v > 0.3 && v < 0.3 + 0.18 + 0.2 * h01(i, 43)) return 0.12;
  return 0.6 + 0.4 * smooth(0, 0.7, v);
}
/** the whole blackout's shape s seconds in: 0 = every light on … 1 = all dark (for the sky's glow + the dead layers) — `depth` dead
 *  everywhere means every light of that depth is fully off (the scene skips drawing them) */
export function blackAll(s, depth = 'city') {
  const B = BLACK, dz = B.depth[depth] ?? B.depth.city;
  const allDead = s >= B.die0 + B.dieSpan + 0.9 + 0.5 + 0.05 && s < B.on0 + dz - B.sput;
  const k = smooth(B.die0 - B.sput, B.die0 + B.dieSpan + 0.9, s) * (1 - smooth(B.on0 + dz - B.sput, B.on0 + dz + B.onSpan + 0.7, s));
  return { k, dead: allDead };
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
