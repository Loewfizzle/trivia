// CITY 2.0 — WHICH BALLOONS FLY (PURE; PROGRESSION B moved it out of screens/harbor/balloons.js so the SERVER can replay a flight): a
// flight's line-up + its length from its seed — every phone the same, and /api's sighting check (core/sightings.js) the same again.
//   kindsOf(seed, festival, kind?)  → the kinds in the air ('bitcoin' · 'btc-orange' · 'skull' · …)
//   flightLen(seed, festival)       → the flight's length (s)
/** the seeded dice every balloon flight draws from (mulberry32) */
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** the everyday kinds a single balloon draws from (₿ + the alien keep their rare odds) */
export const BALLOON_KINDS = ['vstripes', 'pinstripes', 'skull', 'smiley'];
/** the festival's line-up, in launch order (the owner: orange ₿, the alien, black ₿, the skull, smiley, striped) */
// (WSP — the owner, Nov 1 evening: THE SKULL replaces the violet + teal bullseye — "a black and white skull", "high quality like all the
//  other ones")
// (the owner's add-on, Oct 25: the sixth is the AMERICAN FLAG — vertical stripes stay an everyday style)
// (PERF-B — the owner, Nov 1: the 7th, THE DISCO BALL, on the far right's open slot — festivalSpots)
export const FESTIVAL_ORDER = ['btc-orange', 'alien', 'bitcoin', 'skull', 'smiley', 'flag', 'disco'];
/** the specials a forced kind may name besides the everyday ones */
export const SPECIAL_KINDS = ['bitcoin', 'btc-orange', 'alien', 'flag', 'disco'];
/** a flight's length (minutes): a single balloon 45–60, the festival 60–90 (a real flight lasts 1–2 h) */
export const FLIGHT = { single: [45, 60], festival: [60, 90] };
export const hash01 = (a, b) => { let h = (Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x7f4a7c15, 0x85ebca6b)) >>> 0; h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12; return (h >>> 0) / 4294967296; };
/** PURE: a flight's length in seconds from its seed (every phone the same) */
export function flightLen(seed, festival) {
  const [a, b] = festival ? FLIGHT.festival : FLIGHT.single;
  return Math.round((a + (b - a) * hash01(seed || 7, 0x51)) * 60);
}
/** a single flight's style from its dice (R0: rng(seed), its first draws): ~1 in 8 the black ₿, ~1 in 16 the orange ₿, ~1 in 50 the
 *  alien (6b's rare odds), else an everyday kind; `kind` (a preview / the radio) wins when it names a known one */
export function singleKind(R0, kind, known = k => BALLOON_KINDS.includes(k)) {
  const r = R0();
  return kind && (known(kind) || SPECIAL_KINDS.includes(kind)) ? kind : r < 0.12 ? 'bitcoin' : r < 0.18 ? 'btc-orange' : r < 0.2 ? 'alien' : BALLOON_KINDS[Math.floor(R0() * BALLOON_KINDS.length)];
}
/** the kinds a flight puts in the sky (the festival: the whole line-up) */
export function kindsOf(seed, festival, kind = null) {
  if (festival) return FESTIVAL_ORDER.slice();
  return [singleKind(rng(seed || 7), kind)];
}
