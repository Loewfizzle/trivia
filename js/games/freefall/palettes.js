// FREEFALL — THE AREA PALETTES (F3 — docs/freefall.md "THE AREA PALETTES"): PURE — the colours only (the scene: night.js; a unit test
// reads them here: tests/freefall-play.test.mjs).
/** THE AREA PALETTES — DEPTH-RELATIVE (F3 — the owner, Nov 26: replaces F2's gradient on one screen): a floor wears the colour of ITS
 *  OWN floor — its area's — never of its place on the screen. An area = [a → b: its top colour walks from a to b down its 40 floors ·
 *  rim: its neon rim · day: the colour of its frosted glass by day · dayRim: its rim by day, a brighter version of that colour]. The last
 *  three floors of an area lean to the next one's (¼ · ½ · ¾): the next area's colour shows in the floors below as you come to it.
 *  F3B (the owner, Nov 26) — THE COLOUR FIXES: THE SPEAKEASY = BRASS GOLD IN BOTH LOOKS (F3's rose sat close to red): by night warm neon
 *  gold faces + brighter gold rims, by day champagne gold (#f0d590, rims #e0a83a — the owner's own hexes); UNDER THE HARBOR by day = PEARL
 *  / ice-white glass with a faint aqua tint (about 15 % saturation) + BRIGHT CYAN rims (contrast by lightness against the teal water);
 *  THE OFFICES by day = a lighter, whiter periwinkle with brighter rims (they sat close to the blue glass wall).
 *  THE COLOUR RULE (tests/freefall-play.test.mjs): RED IS THE ONLY RED — by night no colour within 25° of hue 352; BY DAY every colour
 *  ≥ 60° of hue from red (THE SPEAKEASY's gold is the one named exception: the owner's hexes are 51° / 48° away — brass can not be 60°
 *  from red and still be brass), and red is the darkest + the most saturated thing on a day floor.
 *  In tuning.js#AREAS' order — THE BOTTOM (one floor) wears THE DEEP's. */
export const PALETTES = Object.freeze([
  Object.freeze({ a: 0xff2fb4, b: 0xf23be6, rim: 0xffd0f2, day: 0xdc8cea, dayRim: 0xdc6ef4 }),   // THE ROOFTOP: hot pink + magenta · by day a soft pink-lavender (cool — never peach)
  Object.freeze({ a: 0x9a3cff, b: 0x3a63ff, rim: 0xd9d4ff, day: 0xb4c2f8, dayRim: 0x4f86ff }),   // THE OFFICES: electric violet → blue · by day a light, whitish periwinkle, bright blue rims
  Object.freeze({ a: 0xeb9a1c, b: 0xc97f16, rim: 0xffe07a, day: 0xf0d590, dayRim: 0xe0a83a }),   // THE SPEAKEASY: BRASS GOLD — warm neon gold, brighter gold rims · by day champagne gold
  Object.freeze({ a: 0x12b8ae, b: 0x35d9f2, rim: 0xd6fff8, day: 0xd0f5ef, dayRim: 0x22e0f0 }),   // UNDER THE HARBOR: teal + aqua · by day PEARL (a faint aqua tint), bright cyan rims
  Object.freeze({ a: 0x2a2478, b: 0x1c1a5c, rim: 0xb46bff, day: 0xa48cea, dayRim: 0x8f6cff }),   // THE DEEP: dark indigo, glowing ultraviolet rims · by day soft indigo / lilac, brighter rims
  Object.freeze({ a: 0x1c1a5c, b: 0x1c1a5c, rim: 0xb46bff, day: 0xa48cea, dayRim: 0x8f6cff }),   // THE BOTTOM: the deep's
]);
/** THE TRENCH = THE DEEP's, cycled — a lap (40 floors) each: the dark body stays, the glowing rim turns */
export const TRENCH_PALETTES = Object.freeze([
  Object.freeze({ a: 0x2a2478, b: 0x1c1a5c, rim: 0xb46bff, day: 0xa48cea, dayRim: 0x8f6cff }),   // ultraviolet rims (the deep's own)
  Object.freeze({ a: 0x14306e, b: 0x101f52, rim: 0x4fb4ff, day: 0x8fb6ee, dayRim: 0x3f9cff }),   // electric blue
  Object.freeze({ a: 0x4a1a70, b: 0x2e1452, rim: 0xff5ce0, day: 0xd68cea, dayRim: 0xd65cee }),   // magenta
  Object.freeze({ a: 0x0f3f4a, b: 0x0c2c3a, rim: 0x5dffc0, day: 0x86e2c2, dayRim: 0x35e0aa }),   // mint
]);
/** the areas whose floors are GOLD (tuning.js#AREAS' index): YOUR BEST's gold tape turns WHITE with a dark edge there (both looks) */
export const GOLD_AREAS = Object.freeze([2]);
