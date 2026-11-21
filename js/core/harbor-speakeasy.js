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

// ---- THE GHOST AD (weekly)
const WEEK = 7 * 864e5;
/** the swap: Monday ~4 am Eastern (09:00 UTC — 4 am in winter, 5 am in summer: nobody watching) */
export const AD_EPOCH = Date.UTC(2026, 0, 5, 9, 0);
/** the rotation: one ad per game, each about every 12 weeks, neighbours in different colours */
export const AD_ORDER = Object.freeze(['rum', 'golf', 'stakes', 'pulse', 'cipher', 'overclock', 'agent', 'slip', 'holdem', 'bluff', 'prism', 'signal', 'gridlock']);   // (HOLD'EM IN THE CITY: HOLD'EM in GRIDLOCK's slot — the five's weeks unchanged)
export const adWeek = ms => Math.floor((ms - AD_EPOCH) / WEEK);
// ---- THE BLADE'S WEEKLY LOOK (SP5; CITY B — BOLD, the owner Nov 14)
/** Each Monday's repaint (the painters, 1–4 pm) changes the game + the look, clearly different week to week on the phone, never at the cost of
 *  the name: a sign KIND (ENAMEL — a saturated painted board, floodlit at night · NEON — a dark board, the letters glowing tubes · BULB — the
 *  letters made of bulbs), a SATURATED panel, a letter colour that holds ≥ 4.5 : 1 on it (cream / gold / black / the game's neon), the font
 *  (block / condensed / slab) and the BULB colour. A seeded walk from the epoch (every phone the same): the kind, the font + the panel never
 *  repeat two weeks running. forced (&blade=<kind>-<font>-<panel>-<bulb>, any part, any order) previews a combo. docs/harbor.md. */
export const BLADE_KINDS = Object.freeze(['enamel', 'neon', 'bulb']);
export const BLADE_FONTS = Object.freeze(['block', 'condensed', 'slab']);
export const BLADE_PANELS = Object.freeze({ red: [158, 22, 34], cobalt: [24, 60, 178], emerald: [8, 112, 68], plum: [98, 30, 108], mustard: [214, 160, 30], teal: [6, 114, 122], orange: [224, 98, 26], rose: [198, 38, 106], ink: [18, 18, 26], cream: [240, 226, 194] });
export const BLADE_BULBS = Object.freeze({ warm: [255, 214, 150], gold: [255, 184, 60], red: [255, 74, 62], blue: [98, 158, 255], green: [88, 236, 122], pink: [255, 98, 198] });
export const LETTER_COLS = Object.freeze({ cream: [250, 238, 206], gold: [246, 196, 62], black: [20, 16, 18] });
/** WCAG contrast of two sRGB colours */
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const relL = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
export const contrast = (a, b) => { const x = relL(a), y = relL(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const mixC = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
/** the glass of an unlit bulb by day (the BULB kind's letters by day) */
export const BULB_GLASS = [238, 232, 220];
/** the colour the letters stand on (PURE): day + night for a kind + panel (the NEON kind's board is the panel near black; the ENAMEL board is
 *  floodlit at night; the BULB board dims) */
export function bladeGround(kind, panel) {
  const P = BLADE_PANELS[panel] || BLADE_PANELS.ink;
  if (kind === 'neon') { const d = mixC(P, [8, 8, 12], 0.62); return { day: d, night: d }; }
  // (a bright ENAMEL board — mustard, orange, cream: black letters — is floodlit to its full colour; a deep one a touch darker)
  return { day: P, night: mixC(P, [0, 0, 0], kind === 'enamel' ? (relL(P) > 0.18 ? 0 : 0.22) : 0.5) };
}
/** the panels a kind may take (the BULB kind's glass letters need a dark-enough board by day) */
const panelsFor = kind => Object.keys(BLADE_PANELS).filter(p => kind !== 'bulb' || contrast(BULB_GLASS, BLADE_PANELS[p]) >= 4.5);
/** PURE: the letter colour of a style for a game (gameRgb: its neon) → rgb with ≥ 4.5 : 1 on the board day AND night (the night colour = the lit
 *  letter: NEON lifts it toward white, BULB = the bulb's light) — a choice that fails falls back to the best of cream / gold / black */
export function bladeLetterCol(S, gameRgb = [255, 255, 255]) {
  const G = bladeGround(S.kind, S.panel), lift = c => mixC(c, [255, 255, 255], 0.3);
  const want = S.letter === 'game' ? gameRgb : S.letter === 'bulb' ? BLADE_BULBS[S.bulb] : LETTER_COLS[S.letter] || LETTER_COLS.cream;
  const ok = c => contrast(S.kind === 'bulb' ? BULB_GLASS : c, G.day) >= 4.5 && contrast(S.kind === 'neon' ? lift(c) : c, G.night) >= 4.5;
  if (ok(want)) return want;
  for (let k = 0.15; k <= 0.75; k += 0.15) { const c = mixC(want, [255, 255, 255], k); if (ok(c)) return c; }
  return Object.values(LETTER_COLS).map(c => [c, Math.min(contrast(c, G.day), contrast(c, G.night))]).sort((a, b) => b[1] - a[1])[0][0];
}
/** a bulb colour never on a board of its own hue (red bulbs on red read as one blur) */
const SAME_HUE = { red: ['red', 'pink'], rose: ['red', 'pink'], orange: ['red', 'gold'], mustard: ['gold', 'warm'], cobalt: ['blue'], emerald: ['green'], teal: ['green', 'blue'], plum: ['pink'] };
const walkMemo = new Map();
function lookOf(w) {
  if (walkMemo.has(w)) return walkMemo.get(w);
  let prev = null, from = -1;
  for (let i = w - 1; i >= 0; i--) if (walkMemo.has(i)) { prev = walkMemo.get(i); from = i; break; }
  for (let i = from + 1; i <= w; i++) {
    const r = rngFrom(hashString(`blade-week|${i}`)), pick = (list, not) => { const l = list.filter(x => x !== not); return l[Math.floor(r() * l.length)]; };
    const kind = pick(BLADE_KINDS, prev && prev.kind), font = pick(BLADE_FONTS, prev && prev.font), panel = pick(panelsFor(kind), prev && prev.panel);
    const P = BLADE_PANELS[panel], G = bladeGround(kind, panel);
    // the bulbs: never melting into the board (≥ 3 : 1 on it); a BULB letter is the bulb itself (≥ 4.5 : 1 at night)
    const bulbs = Object.keys(BLADE_BULBS).filter(b => !(SAME_HUE[panel] || []).includes(b) && contrast(BLADE_BULBS[b], G.night) >= (kind === 'bulb' ? 4.5 : 3) && contrast(BLADE_BULBS[b], P) >= 2);
    const bulb = pick(bulbs.length ? bulbs : ['warm'], null);
    const letters = kind === 'bulb' ? ['bulb'] : kind === 'neon' ? ['game', 'game', 'cream', 'gold'] : ['cream', 'gold', 'black', 'game'].filter(l => l === 'game' || contrast(LETTER_COLS[l], G.day) >= 4.5 && contrast(LETTER_COLS[l], G.night) >= 4.5);
    prev = { kind, font, panel, bulb, letter: pick(letters.length ? letters : ['cream'], null) };
    walkMemo.set(i, prev);
  }
  return prev;
}
export function bladeStyle(week, forced = null) {
  const out = { ...lookOf(Math.max(0, week | 0)) };
  if (forced) {
    // (positional first — kind-font-panel-bulb: 'red' is a panel AND a bulb colour; a part out of place goes where it fits)
    const POS = [['kind', t => BLADE_KINDS.includes(t)], ['font', t => BLADE_FONTS.includes(t)], ['panel', t => !!BLADE_PANELS[t]], ['bulb', t => !!BLADE_BULBS[t]]];
    String(forced).toLowerCase().split('-').forEach((t, i) => { const at = POS[i] && POS[i][1](t) ? POS[i] : POS.find(([k, ok]) => ok(t) && !(k === 'panel' && i === 3)); if (at) out[at[0]] = t; });
    if (out.kind === 'bulb') out.letter = 'bulb'; else if (out.letter === 'bulb') out.letter = 'cream';
  }
  out.key = `${out.kind}-${out.font}-${out.panel}-${out.bulb}-${out.letter}`;
  return out;
}
/** this week's ghost ad: a game id from `ids` (the playable games), the same for everyone; `avoid`: tonight's billboard game (the
 *  board stands right behind the speakeasy — on a night it shows the same game, the ad is the next one in the rotation) */
export function ghostAdGame(ms, ids, avoid = null) {
  const have = new Set(ids || []);
  const order = AD_ORDER.filter(id => have.has(id)).concat([...have].filter(id => !AD_ORDER.includes(id)).sort());
  if (!order.length) return null;
  const n = order.length, w = adWeek(ms), i = ((w % n) + n) % n;
  // (CITY PART 2: `avoid` may be a LIST — the games lit on tonight's named signs: the next in the order that is none of them; all avoided →
  //  the week's own — core/harbor-neon.js#bladeGame)
  const av = [].concat(avoid == null ? [] : avoid);
  for (let k = 0; k < n; k++) { const g = order[(i + k) % n]; if (!av.includes(g)) return g; }
  return order[i];
}

// ---- PROM — THE BARBERSHOP AWNING, LIT FROM UNDERNEATH (the owner, Oct 28 — "B")
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
