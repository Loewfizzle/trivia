// FREEFALL — THE AREA PALETTES (F3 — docs/freefall.md "THE AREA PALETTES"): PURE — the colours only (the scene: night.js; a unit test
// reads them here: tests/freefall-play.test.mjs).
/** THE AREA PALETTES — DEPTH-RELATIVE (F3 — the owner, Nov 26: replaces F2's gradient on one screen): a floor wears the colour of ITS
 *  OWN floor — its area's — never of its place on the screen. An area = [a → b: its top colour walks from a to b down its 40 floors ·
 *  rim: its neon rim · day: the tint of its frosted glass by day]. The last three floors of an area lean to the next one's (¼ · ½ · ¾):
 *  the next area's colour shows in the floors below as you come to it. RED IS THE ONLY RED: no colour here within 25° of hue 352
 *  (tests/freefall-play.test.mjs). In tuning.js#AREAS' order — THE BOTTOM (one floor) wears THE DEEP's. */
export const PALETTES = Object.freeze([
  Object.freeze({ a: 0xff2fb4, b: 0xf23be6, rim: 0xffd0f2, day: 0xff8fd0 }),   // THE ROOFTOP: hot pink + magenta
  Object.freeze({ a: 0x9a3cff, b: 0x3a63ff, rim: 0xd9d4ff, day: 0x8ea2ff }),   // THE OFFICES: electric violet → blue
  Object.freeze({ a: 0xc22a8c, b: 0x7a2a86, rim: 0xffcf6a, day: 0xe58ac6 }),   // THE SPEAKEASY: deep rose + plum, warm brass rims
  Object.freeze({ a: 0x12b8ae, b: 0x35d9f2, rim: 0xd6fff8, day: 0x6fe3e0 }),   // UNDER THE HARBOR: teal + aqua
  Object.freeze({ a: 0x2a2478, b: 0x1c1a5c, rim: 0xb46bff, day: 0x7f7ce0 }),   // THE DEEP: dark indigo, glowing ultraviolet rims
  Object.freeze({ a: 0x1c1a5c, b: 0x1c1a5c, rim: 0xb46bff, day: 0x7f7ce0 }),   // THE BOTTOM: the deep's
]);
/** THE TRENCH = THE DEEP's, cycled — a lap (40 floors) each: the dark body stays, the glowing rim turns */
export const TRENCH_PALETTES = Object.freeze([
  Object.freeze({ a: 0x2a2478, b: 0x1c1a5c, rim: 0xb46bff, day: 0x7f7ce0 }),   // ultraviolet rims (the deep's own)
  Object.freeze({ a: 0x14306e, b: 0x101f52, rim: 0x4fb4ff, day: 0x74b4f0 }),   // electric blue
  Object.freeze({ a: 0x4a1a70, b: 0x2e1452, rim: 0xff5ce0, day: 0xd88ae6 }),   // magenta
  Object.freeze({ a: 0x0f3f4a, b: 0x0c2c3a, rim: 0x5dffc0, day: 0x7fe0c8 }),   // mint
]);
