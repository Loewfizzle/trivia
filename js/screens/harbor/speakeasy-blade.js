// CITY 2.0 — THE HARBOR: THE SPEAKEASY — THE BLADE SIGN (the game's name in stacked letters, the marquee's bulbs) (FP3b: split out of speakeasy.js, FREV A1's split by responsibility; speakeasy.js
// re-exports everything, so its importers are unchanged).
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V, ROOMS, roomLight } from '../../core/harbor-speakeasy.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, mix, shade, box, poly } from './shapes.js';
import { faces } from './blocks.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { dayPaint, SIGN_ACC } from './signs.js';
import { paintRoom, createWindowLife, lateOf } from './windows.js';
import { createHushSign } from './hushsign.js';
import { BLADE_PANELS, BLADE_BULBS, BULB_GLASS, bladeGround, bladeLetterCol } from '../../core/harbor-speakeasy.js';
import { LETTERS, hexRgb } from '../../core/marks.js';
import { flattenPath } from '../../core/tube-path.js';
import { clamp01, tri, FONT, V, W_FRONT, GLASS_IN, AWNING_LAMP, VAL, awningBulbs, SHOP_GLOW, speakGeo, mats, wallMap, R, devRect, fillPat, text, brickTile, streak, fan, chevrons } from './speakeasy-geo.js';

// ---- THE BLADE SIGN (the weekly ghost ad's home — the owner's pick, 8a)
/** the BLADE: a board on iron brackets out from the side wall near the corner, facing us (parallel to the front), the same weekly game
 *  as the ghost ad. Board units: b 0 … bw across (from the brackets), v up (wall units).
 *  SP2 — THE CLASSIC 1920s THEATRE BLADE (the owner: "you just can't read it well at all" — thin dark letters on a dim board, the bulbs
 *  crowding it): a DARK enamel board (deep navy-black) for every game, the name in BIG BOLD letters filling the board's width — cream +
 *  gold paint by day, LIT warm-white at night (they light themselves: a crisp tube-bright letter + a tight glow) — the marquee bulbs only
 *  along the stepped crest + the foot (none on the long sides: the letters get the room), the game's colour a thin pinstripe. It can't
 *  grow right (the wheel's left leg is ~1.5 pt away): it gains its width from shorter brackets + the thin side frame, and it rises to
 *  the parapet (the classic blade tops the cornice) — ~25 × 112 pt on a 402 phone (was 24 × 102, its letters ~30 % narrower). */
export const BLADE = Object.freeze({ w: 0.42, out: 0.22, bw: 1.86, v0: 2.75, v1: 11.0 });
/** the lit letters' glow (pt — tight: the letter stays crisp, never a haze) */
export const BLADE_GLOW = 1.6;
export function bladeGeo(G) {
  const B = BLADE, [ox, oy] = G.side(B.w, 0, B.out), z = G.zAt(B.w), k = G.cam.F / z;
  const [x0, y0] = G.side(B.w, B.v1, B.out), [x1, y1] = G.side(B.w, B.v0, B.out + B.bw);
  return { ox, oy, k, z, rect: { x: Math.min(x0, x1), y: y0, w: Math.abs(x1 - x0), h: y1 - y0 } };
}
/** the board's stepped Deco outline (board units, v up) */
export const bladeOutline = (bw = BLADE.bw, v0 = BLADE.v0, v1 = BLADE.v1) => [[0, v1 - 0.35], [0.25, v1 - 0.35], [0.25, v1 - 0.18], [0.5, v1 - 0.18], [0.5, v1], [bw - 0.5, v1], [bw - 0.5, v1 - 0.18], [bw - 0.25, v1 - 0.18], [bw - 0.25, v1 - 0.35], [bw, v1 - 0.35], [bw, v0], [0, v0]];
/** 7b — THE MARQUEE (SP2: the crest + the foot only): soft warm-white BULBS — steady at night, a slow CHASE on party nights (a step a
 *  beat), unlit glass globes by day. gap / inset / r: board units; edge: the thin gilt frame down the long sides; halo: × r */
export const MARQUEE = Object.freeze({ gap: 0.34, inset: 0.1, r: 0.08, edge: 0.07, halo: 3.1, chase: 3 });
/** the bulbs along the stepped crest (left → right) then the foot (right → left), in board units, in order round the board */
export function marqueeBulbs(bw = BLADE.bw, v0 = BLADE.v0, v1 = BLADE.v1) {
  const i = MARQUEE.inset, out = [];
  // the crest: one on each outer step, one on each middle step, the top flat evenly (symmetric — the steps' corners never crowd a pair)
  const flat = [0.5 + i, bw - 0.5 - i], nf = Math.max(1, Math.round((flat[1] - flat[0]) / MARQUEE.gap));
  out.push([i, v1 - 0.35 - i], [0.375, v1 - 0.18 - i]);
  for (let q = 0; q <= nf; q++) out.push([flat[0] + (flat[1] - flat[0]) * q / nf, v1 - i]);
  out.push([bw - 0.375, v1 - 0.18 - i], [bw - i, v1 - 0.35 - i]);
  // the foot, right → left
  const nb = Math.max(1, Math.round((bw - 2 * i) / MARQUEE.gap));
  for (let q = 0; q <= nb; q++) out.push([bw - i - (bw - 2 * i) * q / nb, v0 + i]);
  return out;
}
/** the marquee's bulbs on screen (pt): { x, y, r, i } */
export function marqueeScreen(bg) { return marqueeBulbs().map(([u, v], i) => ({ x: bg.ox + bg.k * u, y: bg.oy - bg.k * v, r: bg.k * MARQUEE.r, i })); }
/** a bulb's brightness (PURE): steady 1; on a party night (party = its ramp 0..1) the slow chase — every third bulb leads, stepping
 *  one bulb a beat (beats + beatU: the beat clock), the others at 0.5, crossfading over the first third of the beat */
export function marqueeLevel(i, party = 0, beats = 0, beatU = 0) {
  if (party <= 0.01) return 1;
  const n = MARQUEE.chase, on = j => (((i + j) % n) + n) % n === 0 ? 1 : 0.5, f = Math.min(1, Math.max(0, beatU * 3));
  return 1 + (on(beats) * f + on(beats - 1) * (1 - f) - 1) * party;
}
/** SP2 — the name's layout on the board (PURE): one column a word (a two-word name side by side: each column reads top-down), the
 *  letters as big as the column allows — each letter's slot height, its cap height (never taller than LETTER.tall × the column's width:
 *  a sliver of a letter doesn't read) and its width (filling LETTER.fill of the column, at most LETTER.wide × a natural letter) →
 *  { cols: [{ word, cx, lh, cap, top }], cw, cap } (board units) */
export const LETTER = Object.freeze({ fill: 0.86, tall: 1.5, wide: 1.9, gap: 0.08, v0: 0.32, v1: 0.52 });
/** 8P — a long ONE-WORD name reads as two stacked columns at its seam (the owner: SLIPSTREAM was ~8.6 pt, under the 10 pt rule; one
 *  column of 9–10 letters can't get bigger on a ~25 pt board): SLIP / STREAM like the two-word names. Unknown long words split at
 *  their middle; ≤ BLADE_ONE letters stay one column. */
export const BLADE_SPLIT = Object.freeze({ SLIPSTREAM: ['SLIP', 'STREAM'], RUMRUNNER: ['RUM', 'RUNNER'], OVERCLOCK: ['OVER', 'CLOCK'], JAYWALK: ['JAY', 'WALK'] });
export const BLADE_ONE = 8;
export function bladeWords(name) {
  const words = String(name || '').toUpperCase().split(/\s+/).filter(Boolean).slice(0, 2);
  // (the owner, Nov 15: OVER / CLOCK + JAY / WALK are ALWAYS two words on every sign — a listed split is taken whatever its length)
  if (words.length === 1 && BLADE_SPLIT[words[0]]) return [...BLADE_SPLIT[words[0]]];
  if (words.length !== 1 || words[0].length <= BLADE_ONE) return words;
  const w = words[0];
  return BLADE_SPLIT[w] ? [...BLADE_SPLIT[w]] : [w.slice(0, Math.ceil(w.length / 2)), w.slice(Math.ceil(w.length / 2))];
}
/** CITY PART 1 — ONE COLUMN, TWO WORDS (the owner, Nov 20: the speakeasy blade's HIGH RISE "stacked with a clear gap, or one line — whichever
 *  reads at 390 unzoomed"): two side-by-side columns read ACROSS on a vertical board (HR · II · GS · HE), so these names stack in ONE column —
 *  the first word over the second, a short gap (BLADE_GAP_SLOT of a letter's slot) between them; every letter still ≥ 10 pt (tests/harbor.test.mjs) */
export const BLADE_COLUMN = Object.freeze(['HIGH RISE', 'FREE FALL']);
const BLADE_AS = { FREEFALL: 'FREE FALL' };   // (THE FREEFALL CITY PASS: FREE over FALL, one column)
export const BLADE_GAP_SLOT = 0.6;
const colSlots = w => [...w].reduce((a, ch) => a + (ch === ' ' ? BLADE_GAP_SLOT : 1), 0);
/** each character's slot offset down its column (a space = the gap) */
export const colAt = w => { const at = []; let y = 0; for (const ch of w) { at.push(y); y += ch === ' ' ? BLADE_GAP_SLOT : 1; } return at; };
export function bladeLetters(name, bw = BLADE.bw, v0 = BLADE.v0, v1 = BLADE.v1) {
  let one = String(name || '').toUpperCase().trim().replace(/\s+/g, ' ');
  one = BLADE_AS[one] || one;
  const words = BLADE_COLUMN.includes(one) ? [one] : bladeWords(name), nc = Math.max(1, words.length);
  const x0 = MARQUEE.edge + 0.05, x1 = bw - MARQUEE.edge - 0.05, top = v1 - LETTER.v1, foot = v0 + LETTER.v0, ih = top - foot;
  const cw = (x1 - x0 - LETTER.gap * (nc - 1)) / nc, n = Math.max(1, ...words.map(colSlots)), lh = ih / n;
  const cap = Math.min(lh * 0.86, cw * LETTER.tall);
  return { cw, cap, lh, cols: words.map((w, ci) => ({ word: w, at: colAt(w), slots: colSlots(w), cx: x0 + cw * (ci + 0.5) + LETTER.gap * ci, lh, cap, top: top - (ih - lh * colSlots(w)) / 2 })) };
}
/** paint the name (board units, v up): each letter centred in its slot, squeezed / stretched to fill the column; style: 'day' (cream +
 *  gold paint, a dark keyline, a drop shade), 'dark' (the night's unlit letters: dull paint), 'lit' (the warm-white self-lit letter
 *  + a tight glow — the live layer) */
// SP5 + CITY B — THE WEEKLY LOOK (core/harbor-speakeasy.js#bladeStyle on game.style): the KIND (enamel · neon · bulb), the font, the saturated
// panel, the letter colour (≥ 4.5 : 1 — bladeLetterCol), the bulbs' colour. BULB letters follow the tube alphabet's strokes (a bulb letter is a
// stroke of bulbs — the fonts are the painted + the neon kinds')
const BLADE_FONT = {
  block: FONT,                                                                                     // (a bold Deco block: Chakra Petch, stretched wide)
  condensed: px => `700 ${px}px "Chakra Petch", Orbitron, sans-serif`,                                // (a condensed marquee sans: tall, never stretched)
  slab: px => `800 ${px}px "JetBrains Mono", "Courier New", monospace`,                             // (a slab)
};
const BLADE_WIDE = { block: LETTER.wide, condensed: 1.08, slab: 1.55 };   // (ATM-C: 'inline' gone — it split each letter into two strokes at blade size)
const lum3 = c => (c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722);
const gameNeon = game => { if (SIGN_ACC[game.id]) return hexRgb(SIGN_ACC[game.id]); let c = dayPaint(game).face; for (let i = 0; i < 6 && lum3(c) < 150; i++) c = mix(c, [255, 255, 255], 0.22); return c; };
const lookMemo = new Map();
/** the week's look for a game: { S (the style), G (the board day / night), letter, bulb, panel } */
export function bladeLook(game) {
  const S = game.style || { kind: 'enamel', font: 'block', panel: 'ink', bulb: 'warm', letter: 'cream' }, k = `${game.id}|${S.kind}|${S.panel}|${S.bulb}|${S.letter}`;
  if (!lookMemo.has(k)) lookMemo.set(k, { S, G: bladeGround(S.kind, S.panel), letter: bladeLetterCol(S, gameNeon(game)), bulb: BLADE_BULBS[S.bulb] || BLADE_BULBS.warm, panel: BLADE_PANELS[S.panel] || BLADE_PANELS.ink });
  return lookMemo.get(k);
}
/** a BULB letter's bulbs (board units): points every BULB.pitch along the tube alphabet's strokes, scaled into the letter's slot */
export const BULB = Object.freeze({ pitch: 0.2, r: 0.074 });
function bulbPoints(ch, cx, vb, cap, cw) {
  const d = LETTERS[ch]; if (!d) return [];
  // (the glyph 80 % of the cap, centred: a gap of ≥ one bulb pitch between letters — else their bulbs run together)
  const gh = cap * 0.8, gw = Math.min(cw * 0.86, gh * 0.85), sx = gw / 10, sy = gh / 14, y0 = vb + (cap - gh) / 2, pts = [];
  for (const pl of flattenPath(d, 1, 0, 0, 1)) {
    const P = pl.pts.map(([px, py]) => [cx + (px - 5) * sx, y0 + gh - py * sy]);
    let acc = BULB.pitch;
    for (let i = 1; i < P.length; i++) {
      const [ax, ay] = P[i - 1], [bx, by] = P[i], L = Math.hypot(bx - ax, by - ay);
      for (let t = 0; t < L; t += 0.01) { acc += 0.01; if (acc >= BULB.pitch) { acc = 0; pts.push([ax + (bx - ax) * t / L, ay + (by - ay) * t / L]); } }
    }
    if (pl.closed !== true) pts.push(P[P.length - 1]);
  }
  return pts.filter((p, i) => pts.findIndex(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < BULB.pitch * 0.62) === i);
}
const dot = (x, u, v, r, col, a = 1) => { x.fillStyle = rgb(col, a); x.beginPath(); x.arc(u, v, r, 0, Math.PI * 2); x.fill(); };
const glowDot = (x, u, v, r, col, a) => { const g = x.createRadialGradient(u, v, 0, u, v, r); g.addColorStop(0, rgb(col, a)); g.addColorStop(0.35, rgb(col, a * 0.45)); g.addColorStop(1, rgb(col, 0)); x.fillStyle = g; x.beginPath(); x.arc(u, v, r, 0, Math.PI * 2); x.fill(); };
/** paint the name (board units, v up): style 'day' (painted / unlit glass), 'dark' (the night's unlit letters), 'lit' (the live layer) */
export function paintLetters(x, game, style, M) {
  const L = bladeLetters(game.name || game.id), LK = bladeLook(game), S = LK.S, font = BLADE_FONT[S.font] || FONT, wide = BLADE_WIDE[S.font] || LETTER.wide, ink = LK.letter;
  x.save(); x.font = font(100); const cap = (x.measureText('H').actualBoundingBoxAscent || 70) / 100; x.restore();
  for (const col of L.cols) [...col.word].forEach((ch, i) => {
    if (ch === ' ') return;   // (CITY PART 1: the gap between a one-column name's two words)
    const slot = col.at ? col.at[i] : i, size = col.cap / cap, vb = col.top - col.lh * (slot + 1) + (col.lh - col.cap) / 2;
    if (S.kind === 'bulb') {
      // BULB LETTERS: by day glass globes in their sockets, at night the bulbs' own light (a hot core + a soft halo)
      const vb2 = col.top - col.lh * (slot + 1) + (col.lh - col.cap) / 2, r = BULB.r;
      for (const [u, v] of bulbPoints(ch, col.cx, vb2, col.cap, L.cw)) {
        if (style === 'lit') { glowDot(x, u, v, r * 2.1, LK.bulb, 0.5);   // (CITY H1: a tighter bulb glow — the letter's shape crisp at phone size)
          dot(x, u, v, r * 1.12, mix(LK.bulb, [255, 255, 255], 0.5)); dot(x, u, v, r * 0.62, mix(LK.bulb, [255, 255, 255], 0.88)); }
        else { dot(x, u, v, r * 1.3, mix(M.iron || [40, 36, 40], [0, 0, 0], 0.3)); dot(x, u, v, r, style === 'day' ? mix(BULB_GLASS, LK.bulb, 0.18) : mix(LK.bulb, LK.G.night, 0.72)); if (style === 'day') dot(x, u - r * 0.3, v + r * 0.3, r * 0.34, [255, 255, 255], 0.8); }
      }
      return;
    }
    // (one stretch for every letter, from an H: an I stays a narrow stroke, never a block)
    x.save(); x.font = font(size * 100); const nat = x.measureText('H').width / 100, own = x.measureText(ch).width / 100; x.restore();
    const sq = Math.max(0.6, Math.min(wide, (L.cw * LETTER.fill) / Math.max(1e-3, nat), (L.cw * 0.98) / Math.max(1e-3, own)));   // (a wide M / W never past its column)
    const keyCol = lum3(ink) > 128 ? mix(ink, [10, 8, 14], 0.62) : mix(ink, [255, 255, 255], 0.5);
    if (S.kind === 'neon') {
      // NEON TUBES: by day pale unlit glass on the dark board; at night ONE clean letter in its colour, a white-hot body, its glow (9e: never a
      // second letter inside the first)
      // (CITY PART 1 — THE DAY PASS: unlit glass is nearly colourless in sunlight — a faint tint of the letter's colour, never a pastel that reads lit)
      if (style === 'day') text(x, ch, col.cx, vb, size, { fill: rgb(mix(ink, [222, 224, 232], 0.8)), stroke: rgb(mix(ink, [10, 10, 16], 0.62)), lw: size * 0.05, sq, font });
      else if (style === 'dark') text(x, ch, col.cx, vb, size, { fill: rgb(mix(ink, LK.G.night, 0.7)), sq, font });
      // (CITY H1 — the owner: CRISP at phone size — no wide halo, a hair-thin edge at most (was glowPx × 2.2 ≈ 3.5 pt of blur); the bulbs keep it lively)
      else text(x, ch, col.cx, vb, size, { fill: rgb(mix(ink, [255, 255, 255], 0.42)), stroke: rgb(mix(ink, [255, 255, 255], 0.12)), lw: size * 0.05, sq, font, glow: [M.glowPx * 0.45, rgb(ink, 0.85)] });
      return;
    }
    // ENAMEL: flat painted letters + a keyline + a soft shade; at night the floodlit board (paintBlade's lit layer) shows them in their paint
    if (style === 'day') {
      text(x, ch, col.cx + size * 0.025, vb - size * 0.025, size, { fill: rgb([10, 8, 14], 0.3), sq, font });
      text(x, ch, col.cx, vb, size, { fill: rgb(mix(ink, M.inside, 0.5 * M.night)), stroke: rgb(mix(keyCol, M.inside, 0.5 * M.night)), lw: size * 0.06, sq, font });
    } else if (style === 'dark') text(x, ch, col.cx, vb, size, { fill: rgb(M.letterN), stroke: rgb(M.letterN), lw: size * 0.06, sq, font });
    else text(x, ch, col.cx, vb, size, { fill: rgb(ink), stroke: rgb(keyCol), lw: size * 0.06, sq, font, glow: lum3(ink) > 128 ? [M.glowPx * 0.5, rgb(ink, 0.5)] : null });
  });
}
/** the board, painted (by day / the night's unlit board: the baked layer; lit: only what lights — the letters + the bulbs' glass) */
export function paintBlade(x, M, game, lit = false) {
  const B = BLADE, p = dayPaint(game), bw = B.bw, v0 = B.v0, v1 = B.v1, r = rngFrom(17), outline = bladeOutline(bw, v0, v1);
  const LK = bladeLook(game), e0 = MARQUEE.edge;
  if (lit) {
    // (CITY B: the ENAMEL board FLOODLIT by its marquee at night — the week's colour reads after dark; brightest under the crest's bulbs)
    if (LK.S.kind === 'enamel') {
      const g = x.createLinearGradient(0, v1, 0, v0); g.addColorStop(0, rgb(mix(LK.G.night, LK.bulb, 0.12))); g.addColorStop(0.25, rgb(LK.G.night)); g.addColorStop(1, rgb(mix(LK.G.night, [0, 0, 0], 0.18)));
      x.fillStyle = g; x.beginPath(); bladeOutline(bw - 2 * e0, v0 + e0, v1 - e0).forEach(([a, b], i) => (i ? x.lineTo(a + e0, b) : x.moveTo(a + e0, b))); x.closePath(); x.fill();
    }
    paintLetters(x, game, 'lit', M);
    return;
  }
  const PN = LK.G.day, enamel = LK.S.kind === 'neon' ? tri(M.T, PN, PN, mix(PN, [0, 0, 0], 0.3)) : tri(M.T, PN, mix(PN, [60, 44, 30], 0.18), mix(PN, [0, 0, 0], 0.5)), giltE = mix(M.gilt, enamel, 0.15);   // (the week's board, by the time of day)
  // the iron brackets from the wall (scrolled arms) at the top and the foot
  x.strokeStyle = rgb(M.iron); x.lineWidth = 0.07; x.lineCap = 'round';
  for (const v of [v1 - 0.55, v0 + 0.35]) { x.beginPath(); x.moveTo(-B.out, v); x.lineTo(0.1, v); x.stroke(); x.beginPath(); x.arc(-B.out * 0.45, v - 0.12, 0.09, 0, Math.PI * 1.6); x.stroke(); }
  // the board: a thin gilt frame (the crest a little deeper — its bulbs ride on it), the dark enamel face with a soft sheen
  x.fillStyle = rgb(giltE); x.beginPath(); outline.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
  const e = MARQUEE.edge;
  { const g = x.createLinearGradient(0, 0, bw, 0); g.addColorStop(0, rgb(shade(enamel, -0.25))); g.addColorStop(0.35, rgb(shade(enamel, 0.18 * (M.day + M.gold)))); g.addColorStop(1, rgb(shade(enamel, -0.12)));
    x.fillStyle = g; x.beginPath(); bladeOutline(bw - 2 * e, v0 + e, v1 - e).forEach(([a, b], i) => (i ? x.lineTo(a + e, b) : x.moveTo(a + e, b))); x.closePath(); x.fill(); }
  // (CITY B: the game's pinstripe is gone — a sub-pt line; the board's own colour is the week's identity now)
  // the name: painted cream + gold by day (the night's bake: the letters' dull paint — the live layer lights them)
  paintLetters(x, game, M.night > 0.5 ? 'dark' : 'day', { ...M, letterN: mix([120, 108, 92], enamel, 0.55) });
  // the weather: a few chips in the enamel at the edges, a rain streak from the crest
  for (let i = 0; i < 12; i++) { const ed = r() < 0.5, u = ed ? e + r() * 0.08 : bw - e - 0.1 + r() * 0.08, v = v0 + 0.2 + r() * (v1 - v0 - 0.8); R(x, u, v, u + 0.03 + r() * 0.04, v + 0.03 + r() * 0.06, rgb(mix(enamel, [120, 110, 100], 0.4), 0.7)); }
  streak(x, bw * 0.7, v1 - 0.5, 0.1, 1.4, M.soot, 0.14 * (M.day + M.gold));
  // THE MARQUEE'S BULBS (crest + foot): a dark socket ring, the glass globe — unlit: pale glass + a highlight (the live layer lights them)
  const glass = mix(mix(tri(M.T, [226, 222, 210], [240, 214, 180], [44, 40, 52]), [255, 255, 255], 0.1), LK.bulb, 0.28 * (1 - 0.6 * M.night)), ring = shade(M.iron, 0.25);   // (CITY B: the glass tinted the week's bulb colour)
  for (const [u, v] of marqueeBulbs(bw, v0, v1)) {
    x.fillStyle = rgb(ring); x.beginPath(); x.arc(u, v, MARQUEE.r * 1.32, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(glass); x.beginPath(); x.arc(u, v, MARQUEE.r, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb([255, 255, 255], 0.75 * (1 - 0.8 * M.night)); x.beginPath(); x.arc(u - MARQUEE.r * 0.35, v + MARQUEE.r * 0.35, MARQUEE.r * 0.36, 0, Math.PI * 2); x.fill();
  }
}
