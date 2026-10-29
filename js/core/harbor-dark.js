// CITY 2.0 — THE HARBOR: ONE "HOW DARK IS IT" INPUT (cleanup C1.5; docs/harbor/passes/cleanup-c15.md) + THE BLUE-HOUR POWER-UP
// (DT1). PURE.
// Every lighting decision in the Harbor reads ONE value a frame — darkness() — through a NAMED ramp (LIT) or the power-up's
// stagger: the windows, the neon + signs, the lamps (quay, pier, waterfront, the street, the wheel's + the boats' lights), the
// floodlights, the billboard's lamps, the beams, the lighthouse, the strings, the water's reflections, the NEON logo's light on
// the city, the sky's city glow.
//
// DT1 — THE BLUE HOUR (the owner: "real cities light up in the blue hour, not in golden hour"): the sky model's darkness
// (palette.js P.dark) sat FLAT at 0.35 from +5° down to −4° (golden hour's own value), so the city half lit its neon in full sun
// and nothing could tell "before sunset" from "after". The Harbor's darkness now follows the real sun's ELEVATION (DUSK): golden
// hour barely dark (only the billboard's lamps + a few windows), then the POWER-UP from sunset (−0.8°) to the end of the blue
// hour (−7°, ~30–35 min at 43° N): power(k) runs 0 → 1 and every light has its own place in it (powerOrder — seeded by the
// night's date: the outlines CLUSTER BY CLUSTER in tonight's sweep, the signs one by one, never all at once), mirrored at dawn.
// The NEON logo keeps its own timing (title.js). ALWAYS NIGHT passes no elevation: the sky model's 1.
// PART 9 turns on the storm / cloud terms (clouds.set({ dark }) → a storm afternoon powers the city up in the same order), an
// eclipse (core/sky.js) can join through `eclipse`.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const sm = t => t * t * (3 - 2 * t);

/** how much each extra input darkens the city (0 = off). All 0 today. */
// (9a — THE WEATHER turns them on: an overcast day a touch darker; a STORM afternoon (scene.js#stormDark: the storm's rain, heavy rain
// a little) much darker — the city's lights come on early: the lamps at ~0.36, the neon partly)
export const DARK_TERMS = Object.freeze({ cloud: 0.08, storm: 0.55, eclipse: 0 });

/**
 * THE DUSK CURVE (DT1): the sun's elevation (°) → the Harbor's darkness. [el, darkness] knots, high → low; between them a straight
 * line (eased at both ends). Golden hour (+10° → sunset): 0 → 0.2, the billboard's lamps from ~+4°; THE BLUE HOUR (sunset −0.8°
 * → −7°): 0.2 → 0.9 — the power-up; then the last of the light to 1 at −12°. The morning is the same curve (the power-down).
 */
export const DUSK = Object.freeze([[10, 0], [4, 0.06], [-0.8, 0.2], [-7, 0.9], [-12, 1]]);
export function duskDark(el) {
  const K = DUSK;
  if (!(el < K[0][0])) return 0;
  if (!(el > K[K.length - 1][0])) return 1;
  for (let i = 1; i < K.length; i++) {
    const [e0, d0] = K[i - 1], [e1, d1] = K[i];
    if (el >= e1) { let u = (e0 - el) / (e0 - e1); if (i === 1) u = sm(u) * 0.5 + u * 0.5; if (i === K.length - 1) u = 1 - (1 - u) * (1 - u); return d0 + (d1 - d0) * u; }
  }
  return 1;
}

/**
 * The city's darkness now, 0 (broad day) .. 1 (night).
 * @param {{ sky?: number, el?: number, cloud?: number, storm?: number, eclipse?: number }} o
 *   el: the real sun's elevation (°) — the Harbor's dusk curve (DUSK); without it (ALWAYS NIGHT, a test) the sky model's
 *   darkness `sky` (palette.js P.dark); cloud: the real cover 0..1; storm: 0..1 (a storm sky); eclipse: 0..1 (the sun covered)
 * @param terms the weights (DARK_TERMS unless a test / a later part passes its own)
 * The extras only ever darken (never lighten the night), and saturate toward 1.
 */
export function darkness(o = {}, terms = DARK_TERMS) {
  const base = o.el != null && Number.isFinite(+o.el) ? duskDark(+o.el) : clamp01(+o.sky || 0);
  const extra = clamp01((terms.cloud || 0) * clamp01(+o.cloud || 0) + (terms.storm || 0) * clamp01(+o.storm || 0) + (terms.eclipse || 0) * clamp01(+o.eclipse || 0));
  return extra > 0 ? base + (1 - base) * extra : base;
}

/**
 * THE NAMED RAMPS: [from, span] in darkness — a light is off below `from` and fully on at `from + span`. DT1: re-cut for the dusk
 * curve (≈ the sun at: 0.06 +4°, 0.13 +1.5°, 0.2 −0.8° sunset, 0.34 −2°, 0.45 −3°, 0.56 −4°, 0.67 −5°, 0.79 −6°, 0.9 −7°). Every
 * ramp is fully on by 0.9 — the night (1) looks exactly as before.
 */
export const LIT = Object.freeze({
  bill: [0.05, 0.05],      // THE BILLBOARD'S LAMPS — the first light of the evening (late golden hour, ~+4°), the last at dawn
  lamps: [0.16, 0.2],      // the street lamps + the stop lights' glow, the quay lamps, the waterfront strip, the pier's lamps, the wheel's + the boats' lights — around sunset
  logo: [0.16, 0.3],       // the NEON logo's light on the city under it (the logo catches near sunset: title.js)
  beams: [0.22, 0.3],      // the lighthouse's beam (from sunset), the party's sky beams
  water: [0.2, 0.55],      // the water's night look: its reflections + light columns
  city: [0.25, 0.55],      // the city's night light over the skyline (the windows' twinkles + TVs, the beacons, the searchlights)
  neon: [0.3, 0.55],       // the LED facades, the slow chasers, the shimmer (the outlines + signs: the power-up's stagger)
  glow: [0.3, 0.55],       // the city's glow on the night air (sky.js)
  strings: [0.3, 0.4],     // the string lights on the speakeasy's roof
  flood: [0.32, 0.5],      // THE FLOODLIGHTS (the wheel's backdrop, behind the lighthouse, the landmarks, the crowns) fading up in the blue hour
});
/** a named ramp of the darkness: 0 (off) .. 1 (fully lit) */
export function litK(k, name) {
  const r = LIT[name];
  return r ? clamp01((k - r[0]) / r[1]) : 0;
}
/** dark enough for the windows' night bake (the light key's switch) */
export const windowsNight = k => k > 0.2;
/** dark enough to call it night (the sign "caught" at power-on, tier 0's calm) */
export const isNight = k => k > 0.5;

// ------------------------------------------------------------------ 9d — THE BEACONS' PHOTOCELL
/**
 * The owner (Oct 27): real obstruction lights switch on by a LIGHT SENSOR as the daylight drops — around sunset — so the red beacons
 * blink through the last of golden hour into dusk (they followed the city's ramp before, landing in the blue hour); on a dark overcast
 * evening earlier (the same darkness input: the real cloud + storm terms darken it); off again at sunrise; the white strobe on the
 * tallest by day hands over at the same moment. ON at darkness `on` (≈ the sun on the horizon, a few minutes before sunset), OFF below
 * `off` (a sensor's hysteresis: never flicking on + off as the light hovers), the lamps fading over `ramp` seconds.
 */
export const BEACON = Object.freeze({ on: 0.177, off: 0.165, ramp: 90 });
/** PURE: the photocell's state for darkness k, given its last state (null: a first look — on from `on`) */
export function photocell(k, was = null) { return was ? k >= BEACON.off : k >= BEACON.on; }
/** PURE: the beacons' lamp level one step on: level (0..1) toward the cell's state over BEACON.ramp s; dt in s (a jump > 10 min joins at once) */
export function beaconStep(level, on, dt) {
  if (!(dt >= 0) || dt > 600) return on ? 1 : 0;
  const d = dt / BEACON.ramp;
  return on ? Math.min(1, level + d) : Math.max(0, level - d);
}

// ------------------------------------------------------------------ THE POWER-UP (DT1)
/** the blue hour in darkness: the power-up runs from sunset (0.2) to the end of the blue hour (0.9) */
export const POWER = Object.freeze([0.2, 0.9]);
/** the power-up's progress 0 (sunset / before) .. 1 (the city fully lit) */
export const power = k => clamp01((k - POWER[0]) / (POWER[1] - POWER[0]));
/** where each kind of light comes on inside the power-up (its share of power(): first .. last) */
export const STAGE = Object.freeze({
  neon: [0.06, 0.84],      // the building outlines, cluster by cluster (~−1.2° → −6°)
  signs: [0.04, 0.72],     // the game signs, one by one, between them
});
/** a light's own threshold in power(): its place (pos 0..1, powerOrder) inside its stage */
export const powerAt = (pos, stage = STAGE.neon) => stage[0] + clamp01(pos) * (stage[1] - stage[0]);
/** is a light on at darkness k (its place pos in its stage)? the evening's order, and the morning's in reverse */
export const lightOn = (k, pos, stage = STAGE.neon) => power(k) >= powerAt(pos, stage);
/** party nights wait for the power-up: the same power-up first, then the show warms up as it always has */
export const partyReady = k => power(k) >= 0.97;

const h32 = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
/** tonight's sweep for the outlines (a slightly different city each night): left → right, right → left, the centre out, the edges in */
export const SWEEPS = ['ltr', 'rtl', 'out', 'in'];
const sweepAt = (mode, x) => (mode === 'ltr' ? x : mode === 'rtl' ? 1 - x : mode === 'out' ? Math.abs(x - 0.5) * 2 : 1 - Math.abs(x - 0.5) * 2);
/**
 * Tonight's order (pure): key = the night's date (core/harbor-neon.js#nightKey); list: [{ id, kind: 'outline'|'sign'|…, x: 0..1
 * across the screen }]. → { sweep, pos: Map(id → 0..1) }. The OUTLINES follow tonight's sweep (neighbours — a cluster of three
 * blocks is one outline — light close together) with a little scatter; the SIGNS land one by one anywhere in their stage.
 */
export function powerOrder(key, list) {
  const sweep = SWEEPS[Math.floor(h32(`sweep|${key}`) * SWEEPS.length) % SWEEPS.length], pos = new Map();
  for (const it of list) {
    const j = h32(`pw|${key}|${it.id}`);
    pos.set(it.id, it.kind === 'outline' ? clamp01(0.8 * sweepAt(sweep, clamp01(it.x ?? 0.5)) + 0.2 * j) : j);
  }
  return { sweep, pos };
}

/**
 * THE WINDOWS through the power-up: the share of windows that may be lit at darkness k (the sky model's own timeline — City
 * 1.0's P.win, the small hours' thinning, the kitchens before dawn — still caps it). Golden hour: none → ~6 % of the windows (a FEW, lower
 * floors first: windowBias); the blue hour: → every window by its end.
 */
export function windowShare(k) {
  if (k <= 0.03) return 0;
  if (k < POWER[0]) return 0.25 * sm((k - 0.03) / (POWER[0] - 0.03));
  const u = power(k);
  return 0.25 + 0.75 * (1 - Math.pow(1 - u, 1.6));
}
/** how strongly the windows that light early are the LOWER floors (+ the shaded side's): 0 at night (City 1.0's order exactly) */
export const windowBias = k => 1.2 * (1 - power(k));
/**
 * a window's threshold under the bias: lit when its order ≤ windowThreshold(share, bias, low) — low: 0..1 (1 = the lowest floor).
 * Monotonic in share and in −bias, so through the power-up a window only ever comes ON (and at dawn only goes off).
 */
export const windowThreshold = (share, bias, low) => (bias > 0 && share < 1 ? Math.pow(Math.max(0, share), 1 + bias * (1 - clamp01(low))) : share);
