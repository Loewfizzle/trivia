// CITY 2.0 — THE HARBOR, PART 7a: THE SPEAKEASY's plan (PURE — tested in tests/harbor.test.mjs; drawn by screens/harbor/speakeasy.js).
import { rngFrom, hashString } from './rng.js';
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
const EDGE_NIGHT = 0.4;
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
// ------------------------------------------------------------------ SP5 — THE BLADE'S WEEKLY LOOK (the owner: never boring)
/** Each Monday's repaint (the sign painters, 1–4 pm) changes THE GAME + THE LETTER COLOUR + THE LETTER STYLE + THE PANEL COLOUR; the
 *  marquee bulbs stay warm white. Four letter styles from one 1920s Art Deco family — never a script, never the same style two weeks
 *  running (an iterative seeded walk from the epoch's week, the same on every phone); the ink: the GAME's colour with a white-hot core
 *  (most weeks), a classic warm white or an amber; the panel: one of five dark enamels. By day the painted letters + the panel vary the
 *  same way. forced ('<font>-<ink>-<panel>', the &blade= preview) overrides any part. */
export const BLADE_FONTS = Object.freeze(['block', 'condensed', 'slab', 'inline']);
export const BLADE_INKS = Object.freeze(['game', 'warm', 'amber']);
export const BLADE_PANELS = Object.freeze({ navy: [24, 30, 50], green: [14, 42, 34], burgundy: [54, 16, 28], charcoal: [26, 26, 31], violet: [34, 20, 54] });
export const INK_COLS = Object.freeze({ warm: [255, 214, 150], amber: [255, 168, 56] });
const styleMemo = new Map();
export function bladeStyle(week, forced = null) {
  const w = Math.max(0, week | 0);
  let font = styleMemo.get(w);
  if (!font) {
    let f = BLADE_FONTS[Math.floor(rngFrom(hashString('blade-font|0'))() * 4)], from = 0;
    for (let i = w; i > 0; i--) if (styleMemo.has(i)) { f = styleMemo.get(i); from = i; break; }
    for (let i = from + 1; i <= w; i++) { const r = rngFrom(hashString(`blade-font|${i}`)), others = BLADE_FONTS.filter(x => x !== f); f = others[Math.floor(r() * others.length)]; styleMemo.set(i, f); }
    if (w === 0) styleMemo.set(0, f);
    font = f;
  }
  const r = rngFrom(hashString(`blade-look|${w}`)), u = r();
  const out = { font, ink: u < 0.62 ? 'game' : u < 0.86 ? 'warm' : 'amber', panel: Object.keys(BLADE_PANELS)[Math.floor(r() * 5)] };
  if (forced) { const [f, i, pn] = String(forced).split('-'); if (BLADE_FONTS.includes(f)) out.font = f; if (BLADE_INKS.includes(i)) out.ink = i; if (BLADE_PANELS[pn]) out.panel = pn; }
  out.key = `${out.font}-${out.ink}-${out.panel}`;
  return out;
}
/** this week's ghost ad: a game id from `ids` (the playable games), the same for everyone; `avoid`: tonight's billboard game (the
 *  board stands right behind the speakeasy — on a night it shows the same game, the ad is the next one in the rotation) */
export function ghostAdGame(ms, ids, avoid = null) {
  const have = new Set(ids || []);
  const order = AD_ORDER.filter(id => have.has(id)).concat([...have].filter(id => !AD_ORDER.includes(id)).sort());
  if (!order.length) return null;
  const n = order.length, w = adWeek(ms), i = ((w % n) + n) % n;
  return order[i] === avoid && n > 1 ? order[(i + 1) % n] : order[i];
}

// ------------------------------------------------------------------ PROM — THE BARBERSHOP AWNING, LIT FROM UNDERNEATH (the owner, Oct 28 — "B")
// The three little lamps over the awning are gone: a row of warm bulbs tucked UNDER the awning's front edge lights the canvas from
// beneath (its stripes glow through), washes the shop window + the HARBOR BARBERS lettering below and lays a warm pool on the pavement.
// HOURS (the owner asked Claude to pick): ON AT DUSK by the PHOTOCELL (the darkness input — earlier on a dark overcast evening), OFF at
// 1:00 am Sun–Thu + 2:00 am Fri / Sat + the holiday party nights (last call), a short warm fade (FADE_H of clock time), never a snap.
// The TR-3B's blackout takes it with everything else (the scene's power); after it goes off the shop keeps its faint night lamp.
const AWNING_LIGHT = Object.freeze({ dk: [0.16, 0.34], off: 1, offLate: 2, fadeH: 0.01 });   // (fadeH: 36 s of clock time)
/** the awning's light 0..1 at a local moment (PURE): local { h, mi, s?, dow }, dk (the darkness 0..1), lateNight (a party night: the
 *  later switch-off) */
export function awningLight(local, dk, lateNight = false) {
  if (!local) return 0;
  const A = AWNING_LIGHT, h = local.h + (local.mi || 0) / 60 + (local.s || 0) / 3600, eh = h < 12 ? h + 24 : h;
  const dow = h < 12 ? ((local.dow ?? 0) + 6) % 7 : (local.dow ?? 0);                       // (the EVENING's day — after midnight, yesterday's)
  const offAt = 24 + (lateNight || dow === 5 || dow === 6 ? A.offLate : A.off);
  const cell = Math.max(0, Math.min(1, ((dk || 0) - A.dk[0]) / (A.dk[1] - A.dk[0])));
  const shut = eh >= offAt ? 0 : eh > offAt - A.fadeH ? (offAt - eh) / A.fadeH : 1;
  return cell * shut;
}
