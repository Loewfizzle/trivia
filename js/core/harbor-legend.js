// CITY 2.0 — THE HARBOR, PART 6b: THE LEGENDARY SKY — WHEN + HOW (PURE: no DOM, no clock of its own; tests/harbor-legend.test.mjs).
// docs/harbor/passes/part-6b.md. The two legendary events — THE UFO ABDUCTION and THE TR-3B (+ its jet chase) — and the rarer everyday
// stunts on the clock: THE BARNSTORMER (a few times a week). Everything is a function of the date (the same nights for everyone,
// seeded) and of the seconds since an event began (a phone that joins mid-way lands mid-way; a refresh never re-rolls).
//   legendNight(y, m, d)   tonight's legendary (the EVENING's date): { kind: 'ufo' | 'tr3b', h } or null — ~1.5 a month each,
//                          never both on one night, never two legendary nights in a row
//   ufoAt(s) / tr3bAt(s)   each event's state s seconds in (its phases, the craft, the beam, the figure, the drain, the music)
//   drainAt(x, d)          THE TR-3B's POWER DRAIN at a screen x (0 = cut dead … 1 = untouched) for a band (its range by distance)
import { hashString, rngFrom } from './rng.js';
import { partyDow } from './party.js';

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const DAY = 864e5;
const dateKey = (y, m, d) => `${y}-${m}-${d}`;
const prevDay = (y, m, d) => { const p = new Date(Date.UTC(y, m - 1, d) - DAY); return [p.getUTCFullYear(), p.getUTCMonth() + 1, p.getUTCDate()]; };

/** each legendary's share of the nights: ~1.5 a month each (the owner: "~1–2 a month") */
const LEGEND_P = 0.05;
/** how long each runs (s): the abduction's short film, the TR-3B's crossing + the chase + the power coming back */
/** THE CHASE's pass (s into the event): three F-22s a few seconds behind the TR-3B, across the screen in `dur` s — the lead's x
 *  (fraction of W) goes −0.25 → 1.25 over u 0..1 (each jet `back` jet lengths behind it); `uOff` — the last plume is off the screen.
 *  (C2 — the owner: the gap after the craft leaves "too long → ~2 s", the jets "~25 % faster": t0 34 → 29.2 — on a phone the craft's
 *  tail clears the edge ~27.5 s in and the lead's nose shows ~29.5 s — and dur 3.4 → 2.72; everything after the jets (the power back,
 *  the music's spin-up, the people's return, the run's end) is measured from JETS_GONE, so it moved up with them) */
export const CHASE = Object.freeze({ t0: 29.2, dur: 2.72, uOff: 1.45 });
/** the last plume off the screen (s into the TR-3B) */
export const JETS_GONE = CHASE.t0 + CHASE.dur * CHASE.uOff;
export const UFO_LEN = 30, TR3B_LEN = Math.round(JETS_GONE + 11);
/** the legendary hours (local, the evening's clock: 24.5 = 00:30 the next morning) */
const LEGEND_HOURS = [21.5, 24.75];

/** 9e — THE TR-3B ONLY ON PARTY NIGHTS (the owner, Oct 26 — DECIDED): a Friday / Saturday evening (or the homecoming), its own roll
 *  (~1.5 a month: TR3B_PARTY_P of ~8.6 party nights), at the PEAK — the whole lit party blacking out is the drama — in the peak's hours
 *  but never inside the midnight finale's minutes or the first minutes of an hourly dance (TR3B_HOURS: the windows' starts + ends);
 *  never on a fireworks night (July 4th, New Year's Eve); the UFO keeps its any-night roll (LEGEND_P); never two legendary nights running
 *  (legendNight); a raid never shares its night (harbor-raid.js#raidEvening skips legendary nights) */
const TR3B_PARTY_P = 0.17;
export const TR3B_HOURS = [[22.15, 22.85], [23.15, 23.85], [24.15, 24.5]];
const FIREWORKS = (m, d) => (m === 7 && d === 4) || (m === 12 && d === 31) || (m === 1 && d === 1);
const partyEvening = (y, m, d) => { const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(), pd = partyDow(y, m, d, dow); return pd === 5 || pd === 6; };
function dice(y, m, d) {
  const r = rngFrom(hashString(`legend|${dateKey(y, m, d)}`));
  const u = r(), h = r(), v = r(), hp = r();
  if (u < LEGEND_P) return { kind: 'ufo', h: Math.round(lerp(LEGEND_HOURS[0], LEGEND_HOURS[1], h) * 60) / 60 };
  if (v < TR3B_PARTY_P && partyEvening(y, m, d) && !FIREWORKS(m, d)) {
    // (the peak's windows laid end to end, the roll spread over them)
    const tot = TR3B_HOURS.reduce((a, [p, q]) => a + q - p, 0); let x = hp * tot, hh = TR3B_HOURS[0][0];
    for (const [p, q] of TR3B_HOURS) { if (x <= q - p) { hh = p + x; break; } x -= q - p; }
    return { kind: 'tr3b', h: Math.round(hh * 60) / 60 };
  }
  return { kind: null, h: 0 };
}
/** tonight's legendary (y, m, d = the EVENING's local date) → { kind, h } | null. Never two legendary nights in a row. */
export function legendNight(y, m, d) {
  if (m === 10 && d === 31) return null;      // (11a-1: Halloween night is the GHOST SHIP's — core/harbor-holiday.js#ghostShipAt)
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

// (POLISH 5 — the owner: "I don't like it": THE BARNSTORMER is gone — its event, its preview + panel row, its schedule slot)

/**
 * THE SURPRISE FLYBY (POLISH 4, the owner): now and then, unannounced, a few F-16s scream straight across the sky — from GOLDEN
 * HOUR until 11 pm, weighted toward after dark (when the afterburners look best), in a random direction. ~Twice a month, the
 * same for everyone (seeded by the date). duskH: tonight's sunset as a local hour (the golden hour starts ~1 h before it).
 * → { h (local hour), dir (±1), n (3–4 jets), night (after dark) } | null
 */
// (8b1, the owner's decision: ~TWICE A MONTH on random days — POLISH 4 shipped ~2 evenings a week — and NEVER on a legendary night:
// the UFO / the TR-3B own that sky. 0.073 × the nights that aren't legendary ≈ 2.0 a month.)
const FLYBY_P = 0.073;
export function flybyDay(y, m, d, duskH = 19) {
  const r = rngFrom(hashString(`flyby|${dateKey(y, m, d)}`));
  if (r() >= FLYBY_P || legendNight(y, m, d)) return null;
  const night = r() < 0.72, u = r(), dark0 = Math.min(22.4, duskH + 0.6), gold0 = Math.min(dark0 - 0.25, duskH - 1);
  const h = night ? lerp(dark0, 23, u) : lerp(gold0, dark0, u);
  return { h: Math.round(h * 120) / 120, dir: r() < 0.5 ? 1 : -1, n: 3 + Math.floor(r() * 2), night };   // (plan.md: 3–4 in tight formation)
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
const TR3B_CROSS = 30;
/**
 * The TR-3B s seconds in (dir ±1: left → right or right → left) → {
 *   phase  'cross' | 'gap' | 'chase' | 'restore' | 'gone'
 *   x      the craft's centre across the screen (fraction of W; off the screen before + after)
 *   dip    0..1 its height in the band (it sinks a touch over the city, then holds)
 *   pulse  the centre orb's slow pulse 0..1
 *   drain  0..1 how hard it pulls (on while it's over the city; 0 before it arrives — the city comes back behind it)
 *   chase  { on, u (0..1 across the screen) } — three F-22s screaming after it, a few seconds after it leaves
 *   music  { rate (the tape's speed), hz (the low-pass), duck (level), crackle (0..1 the interference) }
 * }
 */
export function tr3bAt(s, dir = 1) {
  const u = clamp01(s / TR3B_CROSS);
  const x0 = -0.5, x1 = 1.5, xf = lerp(x0, x1, u);
  const x = dir > 0 ? xf : 1 - xf;
  const chaseU = (s - CHASE.t0) / CHASE.dur;
  const P = s < CHASE.t0 ? (s < TR3B_CROSS ? 'cross' : 'gap') : s < BLACK.on0 ? 'chase' : s < TR3B_LEN ? 'restore' : 'gone';
  // THE MUSIC POWERS DOWN as it nears — a record player losing power (POLISH 4, the owner's iPhone: "it doesn't do that weird drone
  // down … and slowly get back up to speed"): the SPEED + PITCH sag first while it's still LOUD (3.5 → 10.5 s: an audible drone-down,
  // never under 0.5 — iOS Safari mutes a media element below half speed), only then muffled + faded to a hum (8.5 → 12.5 s); after the
  // jets the VOLUME comes back first (38.6 → 40.4 s) at the low speed, then it SPINS UP slowly (39.4 → 45.5 s) as the filter opens
  // (8b1 — THE DRAIN MADE DRAMATIC (plan.md 6b note 2g): the speed + the pitch sag DEEP (to ~0.56 — never under 0.5, iOS's floor) with a
  // heavy WARBLE on top (a wow + a flutter, deepening with the sag), a CLOSING low-pass (to 900 Hz — a phone still hears it muffled),
  // HELD LOW but audible (½ volume) while the craft is overhead; near silent only under the jets' roar (31 → 38.6 s: the lost time
  // made up there); then the volume back first, the spin-up slow, the filter opening — DRAIN below)
  // (8b2 — THE OWNER'S IPHONE: the AUDIO panel read NOT SOUNDING through it, and again with the raised floor — the bend ALONE kills the
  // song: iOS Safari stalls a media element whose playbackRate changes. Oct 25: THE TAPE STOP IS IN WEB AUDIO now (audio/tape-stop.js: a
  // decoded slice of the song on a buffer source, its rate ramped — no iOS floor), so the drain goes DEEP again: the speed + pitch sag to
  // ~0.5 ×, a warped-record WARBLE made by two oscillators on the rate (`wow` / `flutter` here are their depths, fractions of the rate: a
  // 0.55 Hz wow ± 2.5 % + a 1.9 Hz flutter ± 0.8 % while held — `rate` is the BASE, no wobble in it), a LIGHT duck (−3 dB overhead; a
  // little more under the jets' roar) and a PARTIAL low-pass (2.2 kHz: duller, never gone); after the jets the volume first, then the
  // slow spin-up as the filter opens; the song goes on from where the tape got to)
  // (C2: the jets came ~5 s sooner — everything round them is measured from CHASE.t0 (J) + JETS_GONE (G): the hush under the roar
  // J − 3.5 → J − 0.5, the volume back G − 0.3 → G + 1.5, the spin-up G + 0.5 → G + 6.6 — the same shape as before, earlier)
  const J = CHASE.t0, G = JETS_GONE;
  // (9f — THE TAPE ON THE DRAIN (the owner's iPhone: "the audio slowdown effect was lagging"): the sag IS the city's power — the
  // blackout's own curve (blackAll: the first lights stutter at die0 − sput, all dark at die0 + dieSpan + 0.9), so the slow-down starts
  // on the first dip + bottoms out with the lights; it used to start a second later and the way it was sent lagged it ~2 s: sounds.js)
  const sag = smooth(BLACK.die0 - BLACK.sput, BLACK.die0 + BLACK.dieSpan + 0.9, s), up = smooth(G + 0.5, G + 6.6, s), fadeOut = smooth(8.5, 12.5, s), back = smooth(G - 0.3, G + 1.5, s), hush = smooth(J - 3.5, J - 0.5, s);
  const bent = sag * (1 - up);
  const rate = Math.max(DRAIN_M.floor, lerp(1, DRAIN_M.rate, bent));
  return {
    phase: P, len: TR3B_LEN, x, dir, u,
    dip: smooth(0, 8, s) * 0.6 + 0.4 * smooth(8, TR3B_CROSS, s) * 0.5,
    pulse: 0.5 + 0.5 * Math.sin(s * 2.1),
    drain: smooth(0.5, 3.5, s) * (1 - smooth(TR3B_CROSS - 1, TR3B_CROSS + 3, s)),
    chase: { on: chaseU > -0.15 && chaseU < CHASE.uOff, u: chaseU },
    music: { rate, hz: lerp(20000, DRAIN_M.hz, smooth(5, 12, s) * (1 - smooth(G + 0.5, G + 6.1, s))), duck: lerp(1, lerp(DRAIN_M.held, DRAIN_M.jets, hush), fadeOut * (1 - back)), crackle: smooth(4, 9, s) * (1 - smooth(J - 4, J + 2, s)), catchUp: s > G - 0.7 && s < G, warble: bent, wow: DRAIN_M.wow * bent, flutter: DRAIN_M.flutter * bent },
  };
}
/** 8b1 → Oct 25 (THE TAPE STOP IN WEB AUDIO) — the drain's numbers: the base speed it sags to, a floor (a sanity clamp: the tape has no
 *  iOS floor any more), the wow + the flutter (the oscillators' depths, fractions of the speed), the low-pass it closes to (Hz), the
 *  level it holds while the craft is overhead, the level under the jets' roar */
const DRAIN_M = Object.freeze({ rate: 0.5, floor: 0.4, wow: 0.025, flutter: 0.008, hz: 2200, held: 0.72, jets: 0.55 });
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
export const BLACK = Object.freeze({ die0: 3.4, dieSpan: 5.2, sput: 1.4, on0: JETS_GONE + 1.3, onSpan: 1.5, depth: Object.freeze({ far: 0, city: 1.0, sign: 1.8, harbor: 2.5, near: 3.4 }) });
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
  // (C2 — the owner: "the power coming back looks glitchy — the WHOLE SCREEN seems to go black / flicker": the BIG lights — the NEON
  // sign, whose halo is half the sky, and the promenade's lamps, whose pools are the whole foreground — snapped dead ⇄ ~85 % at 13 Hz.
  // They stutter SHALLOW now (dim flicks under a third) and then RISE smoothly, never dropping out again; the skyline's small lights
  // keep the full stutter)
  const big = depth === 'sign' || depth === 'near';
  if (s < tOn) {
    const u = (s - (tOn - B.sput)) / B.sput, n = h01(i + 57, Math.floor(s * 13));
    return n < 0.14 + 0.62 * u * u ? (big ? 0.1 + 0.18 * u : 0.35 + 0.5 * u) : 0;
  }
  const v = s - tOn;
  if (big) return 0.28 + 0.72 * smooth(0, 1.3, v);
  // caught: a quick warm-up, and one light in four drops out once more just after
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

// ------------------------------------------------------------------ NO TRAFFIC DURING THE LEGENDARIES (Oct 25; plan.md)
/**
 * The owner: "no vehicle drives by (the street under the dock, the back road, the bus, cabs, trucks, the raid) while the TR-3B makes
 * its pass or during the UFO abduction — it's distracting. Vehicles already on screen finish quickly / stop; none start until the event
 * (and the jets) are gone; nothing pops out." THE HOLD on every vehicle's START: [t0, t1] (abs s) for a legend { kind, t0 (abs s: the
 * run's start) } — from `lead` s before the craft shows until the jets are gone + the power is back (the TR-3B) / the saucer has left
 * (the abduction). The planners (core/harbor-traffic.js, core/harbor-people.js: the cars, the buses, the cabs; screens/harbor/
 * roadlight.js: the street under the dock) drop every start inside it; one already on the road finishes. PURE — every phone the same.
 */
export const HOLD = Object.freeze({ lead: 4, tr3b: BLACK.on0 + 1.5, ufo: UFO_LEN + 2 });
export function trafficHold(legend) {
  if (!legend || HOLD[legend.kind] == null || !Number.isFinite(legend.t0)) return null;
  return [legend.t0 - HOLD.lead, legend.t0 + HOLD[legend.kind]];
}
/** is t (abs s) inside the hold? */
export const inHold = (hold, t) => !!hold && t >= hold[0] && t < hold[1];

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
