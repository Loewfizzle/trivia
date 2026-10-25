// CITY 2.0 — THE HARBOR: THE SPEAKEASY — THE BLADE SIGN (the game's name in stacked letters, the marquee's bulbs) (FP3b: split out of speakeasy.js, FREV A1's split by responsibility; speakeasy.js
// re-exports everything, so its importers are unchanged).
import { project } from '../../core/harbor-layout.js';
import { SPEAK_V, ROOMS, roomLight } from '../../core/harbor-speakeasy.js';
import { rngFrom } from '../../core/rng.js';
import { rgb, mix, shade, box, poly } from './shapes.js';
import { faces } from './blocks.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import { dayPaint } from './signs.js';
import { paintRoom, createWindowLife, lateOf } from './windows.js';
import { createHushSign } from './hushsign.js';
import { clamp01, tri, FONT, V, W_FRONT, GLASS_IN, AWNING_LAMP, VAL, awningBulbs, SHOP_GLOW, speakGeo, mats, wallMap, R, devRect, fillPat, text, brickTile, streak, fan, chevrons } from './speakeasy-geo.js';

// ------------------------------------------------------------------ THE BLADE SIGN (the weekly ghost ad's home — the owner's pick, 8a)
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
export const BLADE_SPLIT = Object.freeze({ SLIPSTREAM: ['SLIP', 'STREAM'], RUMRUNNER: ['RUM', 'RUNNER'], OVERCLOCK: ['OVER', 'CLOCK'] });
export const BLADE_ONE = 8;
export function bladeWords(name) {
  const words = String(name || '').toUpperCase().split(/\s+/).filter(Boolean).slice(0, 2);
  if (words.length !== 1 || words[0].length <= BLADE_ONE) return words;
  const w = words[0];
  return BLADE_SPLIT[w] ? [...BLADE_SPLIT[w]] : [w.slice(0, Math.ceil(w.length / 2)), w.slice(Math.ceil(w.length / 2))];
}
export function bladeLetters(name, bw = BLADE.bw, v0 = BLADE.v0, v1 = BLADE.v1) {
  const words = bladeWords(name), nc = Math.max(1, words.length);
  const x0 = MARQUEE.edge + 0.05, x1 = bw - MARQUEE.edge - 0.05, top = v1 - LETTER.v1, foot = v0 + LETTER.v0, ih = top - foot;
  const cw = (x1 - x0 - LETTER.gap * (nc - 1)) / nc, n = Math.max(1, ...words.map(w => w.length)), lh = ih / n;
  const cap = Math.min(lh * 0.86, cw * LETTER.tall);
  return { cw, cap, lh, cols: words.map((w, ci) => ({ word: w, cx: x0 + cw * (ci + 0.5) + LETTER.gap * ci, lh, cap, top: top - (ih - lh * w.length) / 2 })) };
}
/** paint the name (board units, v up): each letter centred in its slot, squeezed / stretched to fill the column; style: 'day' (cream +
 *  gold paint, a dark keyline, a drop shade), 'dark' (the night's unlit letters: dull paint), 'lit' (the warm-white self-lit letter
 *  + a tight glow — the live layer) */
export function paintLetters(x, game, style, M) {
  const L = bladeLetters(game.name || game.id);
  x.save(); x.font = FONT(100); const cap = (x.measureText('H').actualBoundingBoxAscent || 70) / 100; x.restore();
  for (const col of L.cols) [...col.word].forEach((ch, i) => {
    const size = col.cap / cap, vb = col.top - col.lh * (i + 1) + (col.lh - col.cap) / 2;
    // (one stretch for every letter, from an H: an I stays a narrow stroke, never a block)
    x.save(); x.font = FONT(size * 100); const nat = x.measureText('H').width / 100, own = x.measureText(ch).width / 100; x.restore();
    const sq = Math.max(0.6, Math.min(LETTER.wide, (L.cw * LETTER.fill) / Math.max(1e-3, nat), (L.cw * 0.98) / Math.max(1e-3, own)));   // (a wide M / W never past its column)
    if (style === 'day') {
      text(x, ch, col.cx + size * 0.05, vb - size * 0.05, size, { fill: rgb(mix(M.giltLo, [10, 10, 20], 0.3), 0.85), sq });
      text(x, ch, col.cx, vb, size, { fill: rgb(mix([246, 232, 196], M.inside, 0.5 * M.night)), stroke: rgb(mix(M.gilt, M.inside, 0.5 * M.night)), lw: size * 0.07, sq });
    } else if (style === 'dark') text(x, ch, col.cx, vb, size, { fill: rgb(M.letterN), stroke: rgb(M.letterN), lw: size * 0.06, sq });
    else {
      text(x, ch, col.cx, vb, size, { fill: 'rgb(255,214,150)', stroke: 'rgb(255,190,120)', lw: size * 0.1, sq, glow: [M.glowPx, 'rgba(255,170,90,0.95)'] });
      text(x, ch, col.cx, vb, size, { fill: 'rgb(255,246,226)', stroke: 'rgb(255,236,200)', lw: size * 0.05, sq });
    }
  });
}
/** the board, painted (by day / the night's unlit board: the baked layer; lit: only what lights — the letters + the bulbs' glass) */
export function paintBlade(x, M, game, lit = false) {
  const B = BLADE, p = dayPaint(game), bw = B.bw, v0 = B.v0, v1 = B.v1, r = rngFrom(17), outline = bladeOutline(bw, v0, v1);
  if (lit) {
    paintLetters(x, game, 'lit', M);
    return;
  }
  const enamel = tri(M.T, [24, 30, 50], [30, 28, 44], [10, 11, 22]), giltE = mix(M.gilt, enamel, 0.15);
  // the iron brackets from the wall (scrolled arms) at the top and the foot
  x.strokeStyle = rgb(M.iron); x.lineWidth = 0.07; x.lineCap = 'round';
  for (const v of [v1 - 0.55, v0 + 0.35]) { x.beginPath(); x.moveTo(-B.out, v); x.lineTo(0.1, v); x.stroke(); x.beginPath(); x.arc(-B.out * 0.45, v - 0.12, 0.09, 0, Math.PI * 1.6); x.stroke(); }
  // the board: a thin gilt frame (the crest a little deeper — its bulbs ride on it), the dark enamel face with a soft sheen
  x.fillStyle = rgb(giltE); x.beginPath(); outline.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill();
  const e = MARQUEE.edge;
  { const g = x.createLinearGradient(0, 0, bw, 0); g.addColorStop(0, rgb(shade(enamel, -0.25))); g.addColorStop(0.35, rgb(shade(enamel, 0.18 * (M.day + M.gold)))); g.addColorStop(1, rgb(shade(enamel, -0.12)));
    x.fillStyle = g; x.beginPath(); bladeOutline(bw - 2 * e, v0 + e, v1 - e).forEach(([a, b], i) => (i ? x.lineTo(a + e, b) : x.moveTo(a + e, b))); x.closePath(); x.fill(); }
  // the game's colour: a thin pinstripe just inside the frame (the board's identity — the name itself is the theatre's white + gold)
  { const pc = mix(p.face, enamel, 0.25 + 0.55 * M.night), q = 0.14;
    x.strokeStyle = rgb(pc); x.lineWidth = 0.035; x.beginPath(); bladeOutline(bw - 2 * q, v0 + q, v1 - q).forEach(([a, b], i) => (i ? x.lineTo(a + q, b) : x.moveTo(a + q, b))); x.closePath(); x.stroke(); }
  // the name: painted cream + gold by day (the night's bake: the letters' dull paint — the live layer lights them)
  paintLetters(x, game, M.night > 0.5 ? 'dark' : 'day', { ...M, letterN: mix([120, 108, 92], enamel, 0.55) });
  // the weather: a few chips in the enamel at the edges, a rain streak from the crest
  for (let i = 0; i < 12; i++) { const ed = r() < 0.5, u = ed ? e + r() * 0.08 : bw - e - 0.1 + r() * 0.08, v = v0 + 0.2 + r() * (v1 - v0 - 0.8); R(x, u, v, u + 0.03 + r() * 0.04, v + 0.03 + r() * 0.06, rgb(mix(enamel, [120, 110, 100], 0.4), 0.7)); }
  streak(x, bw * 0.7, v1 - 0.5, 0.1, 1.4, M.soot, 0.14 * (M.day + M.gold));
  // THE MARQUEE'S BULBS (crest + foot): a dark socket ring, the glass globe — unlit: pale glass + a highlight (the live layer lights them)
  const glass = mix(tri(M.T, [226, 222, 210], [240, 214, 180], [44, 40, 52]), [255, 255, 255], 0.1), ring = shade(M.iron, 0.25);
  for (const [u, v] of marqueeBulbs(bw, v0, v1)) {
    x.fillStyle = rgb(ring); x.beginPath(); x.arc(u, v, MARQUEE.r * 1.32, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb(glass); x.beginPath(); x.arc(u, v, MARQUEE.r, 0, Math.PI * 2); x.fill();
    x.fillStyle = rgb([255, 255, 255], 0.75 * (1 - 0.8 * M.night)); x.beginPath(); x.arc(u - MARQUEE.r * 0.35, v + MARQUEE.r * 0.35, MARQUEE.r * 0.36, 0, Math.PI * 2); x.fill();
  }
}
