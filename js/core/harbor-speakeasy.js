// CITY 2.0 — THE HARBOR, PART 7a: THE SPEAKEASY's plan (PURE — tested in tests/harbor.test.mjs; drawn by screens/harbor/speakeasy.js).
// The once-grand 1920s Deco corner building on our side of the harbor, its barbershop front the cover. This file holds what the
// building IS, not how it looks: the rooms behind its windows (the hooks Part 7b's window MOMENTS animate), the weekly GHOST AD on
// its blade sign (the owner's pick, 8a — the corner-turn preview is gone).
//
// The facade in wall units (u across from the building's left end, v up from the pavement; ~13.6 pt a unit on a 402 phone):
//   0 – 0.55   the granite plinth (the basement window in it, its faint amber glow day + night: the one hint of the secret)
//   0.55 – 3.85  the ground floor: the barbershop's big window + its door, the barber pole, the unmarked side door
//   3.85 – 4.3   the belt course (terracotta)
//   4.5 – 6.75   floor 2 — the speakeasy's rooms: the edge window, THE BAR (the one clear window), THE JAZZ ROOM
//   6.75 – 7.4   the lintels, the carved spandrels, the sills
//   7.4 – 9.65   floor 3 — the edge window, THE BACK ROOM, THE APARTMENT (the cat's sill, the TV: the upper-RIGHT window — the owner, SP2)
//   (SP3 — the owner: the four upper windows EQUAL + as big as the facade allows while it reads as 1920s brick: 2.2 wide × 2.25 tall,
//   was 1.9 × 2.2 / 2.0 — the belt → the cornice holds two sills, two glass rows, two lintels + a spandrel: 2.25 is the most an equal
//   row gets; 0.95-unit piers keep the wall-washers)
//   9.85 – 10.5  the cornice; 10.5 – 11.25 the parapet; the Deco crest to 12.05

/** the facade's heights (wall units) */
export const SPEAK_V = Object.freeze({ plinth: 0.55, ground: 3.85, belt: 4.3, rows: [[4.5, 6.75], [7.4, 9.65]], cornice: [9.85, 10.5], parapet: 11.25, crest: 12.05, lintel: 0.2 });
/** the window columns across the front (u, wall units) — SP3: 2.2 wide, 0.95-unit piers between */
export const SPEAK_WIN = Object.freeze([[0.85, 3.05], [4.0, 6.2], [7.15, 9.35]]);
/** the piers between + beside them (the wall-washers stand on these) */
export const SPEAK_PIERS = Object.freeze([[-0.4, 0.85], [3.05, 4.0], [6.2, 7.15], [9.35, 11.2]]);

/**
 * THE ROOMS behind the six upper windows (the plan's assignments, chosen by what every iPhone shows): col 0 is the EDGE column the
 * screen's left edge cuts at about half — AMBIENT ONLY (curtains, light, a plant, the cat's ledge; no story moments); col 1–2 the
 * fully visible ones. Part 7b's moments name a window by its id; `lit` is how it glows at night (7a's still look).
 */
export const ROOMS = Object.freeze([
  { id: 'edge2', floor: 2, col: 0, room: 'edge', edge: true, lit: 'curtain' },
  { id: 'bar', floor: 2, col: 1, room: 'bar', clear: true, lit: 'bar' },
  { id: 'jazz', floor: 2, col: 2, room: 'jazz', lit: 'shade' },
  { id: 'edge3', floor: 3, col: 0, room: 'edge', edge: true, lit: 'curtain' },
  { id: 'back', floor: 3, col: 1, room: 'back', lit: 'table' },
  { id: 'apartment', floor: 3, col: 2, room: 'apartment', lit: 'lamp' },     // (SP2 — the owner: the TV window belongs upper-RIGHT)
]);
/** the ground floor's rooms (hooks): the barbershop (its mirror wall is 7b's hidden door), the basement (the bar's glow) */
export const GROUND = Object.freeze([{ id: 'shop', room: 'shop', mirror: true }, { id: 'basement', room: 'basement' }]);

/**
 * A window's light by the hour (7a's still timeline; the lit layer multiplies it by the evening's ramp): the speakeasy is the heart
 * of the city — every room lit from dusk; after 2 am the back room + the jazz room go dark, the bar at 3 (the last patrons leave),
 * the apartment's lamp until 1:30 (then its TV glow is 7b's), the edge windows' curtains until 1. `hour` local 0–24 (null: lit).
 */
/** SP3: the edge window's lamp left on low through the small hours */
export const EDGE_NIGHT = 0.4;
export function roomLight(id, hour) {
  if (hour == null) return 1;
  const h = hour < 12 ? hour + 24 : hour;                     // (the night as one run: 12 → 36)
  if (h < 12 + 4) return 1;                                   // (afternoon: the lights the lamps' ramp allows)
  const off = { back: 26, jazz: 26.5, bar: 27, apartment: 25.5, edge2: 25, edge3: 24.8 }[id] ?? 26;
  const on = id === 'apartment' ? 30.5 : 31;                  // (the small hours dark; before dawn the apartment wakes)
  if (h < off) return 1;
  if (h < off + 0.25) return Math.max(id === 'edge2' ? EDGE_NIGHT : 0, 1 - (h - off) / 0.25);
  if (h >= on && h < 33) return id === 'apartment' ? 1 : id === 'edge2' ? EDGE_NIGHT : 0;
  // (SP3 — NEVER FULLY DARK moves here: the apartment goes dark after its TV (the owner); the lower EDGE window keeps a lamp on low behind
  // its curtains all night — a light that reads half-seen at the screen's edge)
  return id === 'edge2' ? EDGE_NIGHT : 0;
}

// ------------------------------------------------------------------ THE GHOST AD (weekly)
const WEEK = 7 * 864e5;
/** the swap: Monday ~4 am Eastern (09:00 UTC — 4 am in winter, 5 am in summer: nobody watching) */
export const AD_EPOCH = Date.UTC(2026, 0, 5, 9, 0);
/** the rotation: one ad per game, each about every 12 weeks, neighbours in different colours */
export const AD_ORDER = Object.freeze(['rum', 'golf', 'stakes', 'pulse', 'cipher', 'overclock', 'agent', 'slip', 'gridlock', 'bluff', 'prism', 'signal']);
export const adWeek = ms => Math.floor((ms - AD_EPOCH) / WEEK);
/** this week's ghost ad: a game id from `ids` (the playable games), the same for everyone; `avoid`: tonight's billboard game (the
 *  board stands right behind the speakeasy — on a night it shows the same game, the ad is the next one in the rotation) */
export function ghostAdGame(ms, ids, avoid = null) {
  const have = new Set(ids || []);
  const order = AD_ORDER.filter(id => have.has(id)).concat([...have].filter(id => !AD_ORDER.includes(id)).sort());
  if (!order.length) return null;
  const n = order.length, w = adWeek(ms), i = ((w % n) + n) % n;
  return order[i] === avoid && n > 1 ? order[(i + 1) % n] : order[i];
}
