// FREEFALL — THE AREA PALETTES (F3 — docs/freefall.md "THE AREA PALETTES"): PURE — the colours only (the scene: night.js; a unit test
// reads them here: tests/freefall-play.test.mjs).
/** THE AREA PALETTES — DEPTH-RELATIVE (F3 — the owner, Nov 26: replaces F2's gradient on one screen): a floor wears the colour of ITS
 *  OWN floor — its area's — never of its place on the screen. An area = [a → b: its top colour walks from a to b down its 40 floors ·
 *  rim: its neon rim · day: the colour of its frosted glass by day — CLEARLY COLOURED pastel (the owner, Nov 26: 35–55 % saturation on
 *  the slice faces; white only in the frost, the highlights + the seams) · dayRim: its rim by day, a brighter version of that colour]. The last three floors of an area lean to the next one's (¼ · ½ · ¾):
 *  the next area's colour shows in the floors below as you come to it. RED IS THE ONLY RED: no colour here within 25° of hue 352
 *  (tests/freefall-play.test.mjs). In tuning.js#AREAS' order — THE BOTTOM (one floor) wears THE DEEP's. */
export const PALETTES = Object.freeze([
  Object.freeze({ a: 0xff2fb4, b: 0xf23be6, rim: 0xffd0f2, day: 0xe08cea, dayRim: 0xf46ef0 }),   // THE ROOFTOP: hot pink + magenta · by day a soft pink-lavender (cool — never peach)
  Object.freeze({ a: 0x9a3cff, b: 0x3a63ff, rim: 0xd9d4ff, day: 0x8da3f4, dayRim: 0x5f84ff }),   // THE OFFICES: electric violet → blue · by day periwinkle blue
  Object.freeze({ a: 0xc22a8c, b: 0x7a2a86, rim: 0xffcf6a, day: 0xeb8dc4, dayRim: 0xf0b545 }),   // THE SPEAKEASY: deep rose + plum, warm brass rims · by day blush rose, the brass rims too
  Object.freeze({ a: 0x12b8ae, b: 0x35d9f2, rim: 0xd6fff8, day: 0x82e0cf, dayRim: 0x2fe6cf }),   // UNDER THE HARBOR: teal + aqua · by day aqua / mint
  Object.freeze({ a: 0x2a2478, b: 0x1c1a5c, rim: 0xb46bff, day: 0xa48cea, dayRim: 0x8f6cff }),   // THE DEEP: dark indigo, glowing ultraviolet rims · by day soft indigo / lilac, brighter rims
  Object.freeze({ a: 0x1c1a5c, b: 0x1c1a5c, rim: 0xb46bff, day: 0xa48cea, dayRim: 0x8f6cff }),   // THE BOTTOM: the deep's
]);
/** THE TRENCH = THE DEEP's, cycled — a lap (40 floors) each: the dark body stays, the glowing rim turns */
export const TRENCH_PALETTES = Object.freeze([
  Object.freeze({ a: 0x2a2478, b: 0x1c1a5c, rim: 0xb46bff, day: 0xa48cea, dayRim: 0x8f6cff }),   // ultraviolet rims (the deep's own)
  Object.freeze({ a: 0x14306e, b: 0x101f52, rim: 0x4fb4ff, day: 0x8fb6ee, dayRim: 0x3f9cff }),   // electric blue
  Object.freeze({ a: 0x4a1a70, b: 0x2e1452, rim: 0xff5ce0, day: 0xd68cea, dayRim: 0xee5ce8 }),   // magenta
  Object.freeze({ a: 0x0f3f4a, b: 0x0c2c3a, rim: 0x5dffc0, day: 0x86e2c2, dayRim: 0x35e0aa }),   // mint
]);
