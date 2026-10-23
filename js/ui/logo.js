// NEON SPEAKEASY logotype. Pure markup (no DOM), so the title, the lobby header, the boot screen, the app icons
// and the link preview (tests/integration/render-assets.mjs) all draw the exact same sign.
//
// "NEON" is a real neon sign: each letter is one bent glass tube (a single stroke with rounded bends), drawn as
//   glass (unlit tube) -> wide glow -> near glow -> tube body -> hot white core -> a thin glass highlight,
// with blacked-out connector tubes between the letters, electrode caps at the tube ends and small mounting
// clips — the way a sign shop builds one. Each letter is its own group (.ndl-1 … .ndl-4) so it can flicker alone.
// "SPEAKEASY" is set in the display face, wide and quiet, under the sign (HTML, see title.js / lobby.js).
//
// PREMIUM (CITY 2.0, ?city=2 only until the switch-over: logoSvg({ premium: true })): the same letters, positions and colours,
// rendered richer — the glass's own thickness (a pale wall around the tube), the light UNEVEN along each tube (hot spots on the
// bends, dimmer near the electrodes: core/tube-path.js), a highlight that leans toward the light; by day sun glints on the
// glass. ANCHOR POINTS (LOGO_ANCHORS) for the holiday dressings of Parts 11a–c to hang things from.
import { flattenPath } from '../core/tube-path.js';

const TUBE = 9;
// letter paths in a 0..64 × 0..100 box (y down), placed by x offset
const LETTERS = [
  { x: 0, d: 'M0 100 V10 Q0 0 7 7 L57 93 Q64 100 64 90 V0', ends: [[0, 100], [64, 0]] },                 // N
  { x: 92, d: 'M62 0 H11 Q0 0 0 11 V89 Q0 100 11 100 H62 M9 50 H50', ends: [[62, 0], [62, 100], [9, 50], [50, 50]] }, // E
  { x: 176, d: 'M37 100 C55 100 64 85 64 68 V32 C64 14 50 0 32 0 C14 0 0 14 0 32 V68 C0 86 12 100 27 100', ends: [[37, 100], [27, 100]] }, // O (electrode gap at the bottom)
  { x: 268, d: 'M0 100 V10 Q0 0 7 7 L57 93 Q64 100 64 90 V0', ends: [[0, 100], [64, 0]] },               // N
];
// blacked-out connectors (painted tube running behind, from one letter's end to the next letter's start)
const LINKS = [
  'M64 0 C 92 -22, 128 -22, 154 0',       // N -> E (top right of E)
  'M154 100 C 166 116, 192 118, 203 100',  // E bottom -> O right electrode
  'M203 100 C 222 120, 252 122, 268 100',  // O -> N
];
// mounting clips (x, y) — tiny standoffs crossing the tube
const CLIPS = [[0, 30], [64, 70], [92, 30], [92, 76], [176, 50], [240, 50], [268, 30], [332, 70]];

/** the NEON letters' tube paths (x offset + SVG path in the 332 × 100 logo box) — CITY 2.0's dark halo behind the sign (harbor/scene.js) */
export const LOGO_LETTERS = LETTERS.map(L => ({ x: L.x, d: L.d }));
export const LOGO_TUBE = TUBE;
export const LOGO_W = 332;
export const LOGO_H = 100;

const PINK = { glass: '#40243a', glow: '#ff2e97', body: '#ff5fb4', core: '#fff1f8' };

/**
 * opts: { id: unique prefix for filter ids, pad (viewBox padding), lit: true = always on (no classes needed),
 *         blur: glow strength multiplier, clips: draw mounting clips }
 */
export function logoSvg({ id = 'nd', pad = 26, lit = false, blur = 1, clips = true, connectors = false, title = 'NEON', premium = false, light = -1 } = {}) {
  const vb = `${-pad} ${-pad - 4} ${LOGO_W + pad * 2} ${LOGO_H + pad * 2 + 8}`;
  const letters = LETTERS.map((L, i) => {
    const t = `translate(${L.x} 0)`;
    // electrode ends: a small darker cap where the tube turns back into the sign (under the light)
    const caps = L.ends.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${TUBE * 0.5}" fill="#2a1626"/>`).join('');
    const P = premium ? premiumBits(L, id, light) : null;
    return `<g class="ndl ndl-${i + 1}" transform="${t}">
  <path class="ndl-glass" d="${L.d}" stroke="${PINK.glass}" stroke-width="${TUBE + 2}"/>
  ${P ? P.wall : ''}
  ${caps}
  <g class="ndl-light">
    <path class="ndl-glow2" d="${L.d}" stroke="${PINK.glow}" stroke-width="${TUBE + 14}" filter="url(#${id}-b2)"/>
    <path class="ndl-glow1" d="${L.d}" stroke="${PINK.glow}" stroke-width="${TUBE + 4}" filter="url(#${id}-b1)"/>
    <path class="ndl-body" d="${L.d}" stroke="${PINK.body}" stroke-width="${TUBE}"/>
    ${P ? P.dim : ''}
    <path class="ndl-core" d="${L.d}" stroke="${PINK.core}" stroke-width="${TUBE * 0.34}"/>
    ${P ? P.hot : ''}
    <path class="ndl-hi" d="${L.d}" stroke="#ffffff" stroke-width="0.8" transform="translate(${P ? P.hi : '-1.4 -1.4'})" opacity="0.35"/>
  </g>
  ${P ? P.glint : ''}
</g>`;
  }).join('');
  const links = connectors ? LINKS.map(d => `<path d="${d}" stroke="#20131d" stroke-width="3.2" opacity="0.9"/>`).join('') : '';
  const clipMarks = clips ? CLIPS.map(([x, y]) => `<rect x="${x - 1.5}" y="${y - 6.5}" width="3" height="13" rx="1" fill="#1c1019" opacity="0.75"/>`).join('') : '';
  return `<svg class="nd-logo${lit ? ' is-lit' : ''}" viewBox="${vb}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <filter id="${id}-b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${3.2 * blur}"/></filter>
  <filter id="${id}-b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${11 * blur}"/></filter>
  ${premium ? `<radialGradient id="${id}-hot"><stop offset="0" stop-color="#fff6fb"/><stop offset="0.45" stop-color="#fff6fb" stop-opacity="0.8"/><stop offset="1" stop-color="#fff6fb" stop-opacity="0"/></radialGradient>
  <radialGradient id="${id}-dim"><stop offset="0" stop-color="#5a1d44"/><stop offset="0.5" stop-color="#5a1d44" stop-opacity="0.75"/><stop offset="1" stop-color="#5a1d44" stop-opacity="0"/></radialGradient>` : ''}
</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round"${premium ? ' class="ndp"' : ''}>
  ${links}
  ${letters}
  ${clipMarks}
</g>
</svg>`;
}

/**
 * THE PARTY PUNCH LAYER (CITY 2.0, NEON PASS 5): the letters' light alone — a wide glow, a near glow, a hot core — in the same
 * viewBox as logoSvg, laid over the sign (title.js) and faded in on the beat by its opacity alone (a compositor change: the
 * blurred layers are rasterised once). Its letters are .ndg (never .ndl: the boot + the flicker query those) — .off hides one.
 */
export function logoGlowSvg({ id = 'ndg', pad = 26, blur = 1 } = {}) {
  const vb = `${-pad} ${-pad - 4} ${LOGO_W + pad * 2} ${LOGO_H + pad * 2 + 8}`;
  const letters = LETTERS.map((L, i) => `<g class="ndg ndg-${i + 1}" transform="translate(${L.x} 0)">
  <path class="ndg-w" d="${L.d}" stroke-width="${TUBE + 16}" filter="url(#${id}-b2)"/>
  <path class="ndg-n" d="${L.d}" stroke-width="${TUBE + 5}" filter="url(#${id}-b1)"/>
  <path class="ndg-c" d="${L.d}" stroke-width="${TUBE * 0.5}"/>
</g>`).join('');
  return `<svg class="nd-logo-glow" viewBox="${vb}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs>
  <filter id="${id}-b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${3.6 * blur}"/></filter>
  <filter id="${id}-b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${12 * blur}"/></filter>
</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">${letters}</g>
</svg>`;
}

/**
 * THE RACE (CITY 2.0, NEON PASS 6 — the owner): a bright surge racing through the NEON letters in turn (N → E → O → N), each letter
 * blazing fully on as it passes — at the catch, when a tap re-ignites the sign, and now and then on party nights (title.js#raceLogo).
 * Built for the compositor: ONE SVG PER LETTER holding that letter's blaze (its glow blurred once, faded in + out by the svg's own
 * opacity) and one SVG for the HEAD — a white-hot dot + a tail of soft dots of gradient fill (no filter), moved by their transform
 * along the tube (logoTrack). Same viewBox as logoSvg, laid over it.
 */
export function logoRaceSvg({ id = 'ndr', pad = 26, blur = 1, tail = 14 } = {}) {
  const vb = `${-pad} ${-pad - 4} ${LOGO_W + pad * 2} ${LOGO_H + pad * 2 + 8}`;
  const defs = `<filter id="${id}-b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${3.6 * blur}"/></filter>
  <filter id="${id}-b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${13 * blur}"/></filter>`;
  const blaze = LETTERS.map((L, i) => `<svg class="nd-race nd-race-l" data-i="${i}" viewBox="${vb}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs>${defs.replaceAll(`${id}-b`, `${id}${i}-b`)}</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(${L.x} 0)">
  <path class="ndr-w" d="${L.d}" stroke-width="${TUBE + 20}" filter="url(#${id}${i}-b2)"/>
  <path class="ndr-n" d="${L.d}" stroke-width="${TUBE + 6}" filter="url(#${id}${i}-b1)"/>
  <path class="ndr-c" d="${L.d}" stroke-width="${TUBE * 0.62}"/>
</g></svg>`).join('');
  const dots = Array.from({ length: tail }, (_, k) => `<circle class="ndr-t" r="${(TUBE * (1.35 - 0.05 * k)).toFixed(2)}" fill="url(#${id}-tg)" opacity="0"/>`).reverse().join('');
  const head = `<svg class="nd-race nd-race-h" viewBox="${vb}" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="${id}-hg"><stop offset="0" stop-color="#ffffff"/><stop offset="0.22" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.5" style="stop-color:var(--pcb,#ff5fb4);stop-opacity:0.45"/><stop offset="1" style="stop-color:var(--pc,#ff2e97);stop-opacity:0"/></radialGradient>
  <radialGradient id="${id}-tg"><stop offset="0" stop-color="#fff4fa" stop-opacity="0.9"/><stop offset="0.35" style="stop-color:var(--pcb,#ff5fb4);stop-opacity:0.5"/><stop offset="1" style="stop-color:var(--pc,#ff2e97);stop-opacity:0"/></radialGradient>
</defs>
<g class="ndr-dots">${dots}<circle class="ndr-hd" r="${TUBE * 3.1}" fill="url(#${id}-hg)" opacity="0"/></g></svg>`;
  return blaze + head;
}
/**
 * The race's TRACK through the sign (logo units): N, its connector, E's main stroke, the connector, O (round from the electrode the
 * connector reaches), the connector, N — [{ pts: [[x, y]…], len: [cumulative], letter (0..3) | -1 on a connector }]
 */
let TRACK = null;
export function logoTrack() {
  if (TRACK) return TRACK;
  const seg = (pts, letter) => { const len = [0]; for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, len, total: len[len.length - 1], letter }; };
  const main = (L, rev = false) => { const p = flattenPath(L.d, 1, L.x, 0, 2)[0].pts; return rev ? p.slice().reverse() : p; };
  const link = d => flattenPath(d, 1, 0, 0, 3)[0].pts;
  TRACK = [seg(main(LETTERS[0]), 0), seg(link(LINKS[0]), -1), seg(main(LETTERS[1]), 1), seg(link(LINKS[1]), -1), seg(main(LETTERS[2], true), 2), seg(link(LINKS[2]), -1), seg(main(LETTERS[3]), 3)];
  return TRACK;
}

// ---- PREMIUM layers (CITY 2.0): per letter, from its own path
const BENDS = new Map();
/** a letter's bends (where the tube turns hardest: the hot spots) and its open ends (the electrodes), in its own 0..64 box */
export function letterLight(L) {
  if (BENDS.has(L.d)) return BENDS.get(L.d);
  const hot = [];
  for (const pl of flattenPath(L.d, 1, 0, 0, 3)) {
    const p = pl.pts;
    // the turn over a short window (a bend drawn as a curve turns a little at every step)
    const cand = [];
    for (let i = 1; i < p.length - 1; i++) {
      const i0 = Math.max(0, i - 2), i1 = Math.min(p.length - 1, i + 2);
      const a = Math.atan2(p[i][1] - p[i0][1], p[i][0] - p[i0][0]), b = Math.atan2(p[i1][1] - p[i][1], p[i1][0] - p[i][0]);
      let d = Math.abs(b - a); if (d > Math.PI) d = 2 * Math.PI - d;
      if (d > 0.34) cand.push([p[i][0], p[i][1], d]);
    }
    cand.sort((u, v) => v[2] - u[2]);
    for (const [x, y, d] of cand) if (!hot.some(([hx, hy]) => Math.hypot(hx - x, hy - y) < 10)) hot.push([+x.toFixed(1), +y.toFixed(1), +d.toFixed(2)]);
  }
  // (NEON PASS 5 — the owner: the O always looked "off", an ageing tube: all smooth curves, it had NO hot spots while N and E have
  // two bright bends each. A letter with fewer than two sharp bends takes its gentle ones — the turn over a wider window — so every
  // letter glows alike; the tired tube is a rotating look of its own now: title.js#tiredLetters)
  if (hot.length < 2) {
    const soft = [];
    for (const pl of flattenPath(L.d, 1, 0, 0, 3)) {
      const p = pl.pts;
      for (let i = 1; i < p.length - 1; i++) {
        const i0 = Math.max(0, i - 8), i1 = Math.min(p.length - 1, i + 8);
        const a = Math.atan2(p[i][1] - p[i0][1], p[i][0] - p[i0][0]), b = Math.atan2(p[i1][1] - p[i][1], p[i1][0] - p[i][0]);
        let d = Math.abs(b - a); if (d > Math.PI) d = 2 * Math.PI - d;
        if (d > 0.7) soft.push([p[i][0], p[i][1], Math.min(1.4, d)]);
      }
    }
    soft.sort((u, v) => v[2] - u[2]);
    for (const [x, y, d] of soft) if (hot.length < 4 && !hot.some(([hx, hy]) => Math.hypot(hx - x, hy - y) < 22)) hot.push([+x.toFixed(1), +y.toFixed(1), +d.toFixed(2)]);
  }
  const out = { hot, ends: L.ends };
  BENDS.set(L.d, out);
  return out;
}
function premiumBits(L, id, light) {
  const { hot, ends } = letterLight(L);
  // the glass wall: the tube's own thickness — a pale rim around the gas (by day it reads as clear glass)
  const wall = `<path class="ndl-wall" d="${L.d}" stroke="#ffe3f1" stroke-width="${TUBE + 2.6}"/><path class="ndl-wall2" d="${L.d}" stroke="#2a1626" stroke-width="${TUBE - 0.6}"/>`;
  // hotter on the bends, dimmer near the electrodes — soft dots from radial gradients, NOT filters (cleanup pass 1: a blur filter
  // per spot made every repaint of the sign ~3× dearer, and the catch's 1.5 s glow animation repaints it every frame)
  const hotC = hot.map(([x, y, d]) => `<circle class="ndl-hot" cx="${x}" cy="${y}" r="${(TUBE * (0.42 + Math.min(0.3, d * 0.18)) * 1.9).toFixed(1)}" fill="url(#${id}-hot)"/>`).join('');
  // (THE DAY PASS — the owner: the O looked PERMANENTLY dimmer, an "imperfect tube": its two electrodes sit 10 apart at its foot,
  // so their two shade spots overlapped into one dark patch across the whole bottom of the letter. Electrodes that close share
  // ONE spot of the usual size between them; the imperfection is the rotating tired tube's alone — core/harbor-show.js#tiredLetters)
  const dimAt = [];
  for (const e of ends) { const near = dimAt.find(d => Math.hypot(d[0] - e[0], d[1] - e[1]) < TUBE * 2.6); if (near) { near[0] = (near[0] + e[0]) / 2; near[1] = (near[1] + e[1]) / 2; } else dimAt.push([...e]); }
  const dim = dimAt.map(([x, y]) => `<circle class="ndl-dim" cx="${x}" cy="${y}" r="${(TUBE * 0.95 * 1.5).toFixed(1)}" fill="url(#${id}-dim)"/>`).join('');
  // sun glints on the glass (day only): a few bright points on the bends toward the light
  const glint = hot.filter((_, i) => i % 2 === 0).slice(0, 3).map(([x, y]) => `<circle class="ndl-glint" cx="${(x + light * 1.6).toFixed(1)}" cy="${(y - 1.8).toFixed(1)}" r="1.1" fill="#ffffff"/>`).join('');
  // the highlight leans toward the light (the sun's side by day; the title moves it as the day goes)
  return { wall, hot: hotC, dim, glint, hi: `${(light * 1.4).toFixed(2)} -1.4` };
}

/**
 * ANCHOR POINTS on the sign (logo coordinates: x 0..332, y 0..100, y down) for the holiday dressings of Parts 11a–c — the
 * Halloween web, the Christmas garland + C9 bulbs + snow + icicles, the marigold garland, the harvest wreath, the heart tube:
 *   tops     each letter's top points (snow settles, icicles hang, bulbs clip on) — [[x, y], …] per letter
 *   garland  a sagging run along the letters' tops, end to end (the fir garland, the marigolds)
 *   gaps     the spaces between the letters (papel picado, a web's corners, the wreath's ties)
 *   base     the sign's foot, under each letter (candles, pumpkins, the cornstalks)
 *   centre   the middle of the sign (a heart tube, a wreath)
 *   corners  the sign's four corners (webs)
 */
export const LOGO_ANCHORS = {
  tops: [[[0, 4], [5, 2], [64, 0]], [[103, 0], [130, 0], [154, 0]], [[190, 3], [208, 0], [226, 3]], [[268, 4], [273, 2], [332, 0]]],
  garland: [[-8, -6], [30, 2], [64, -3], [78, 4], [92, -3], [123, 3], [154, -3], [168, 4], [184, -2], [208, 2], [234, -2], [251, 4], [268, -3], [300, 2], [340, -6]],
  gaps: [[78, 50], [165, 50], [254, 50]],
  base: [[0, 104], [64, 104], [123, 104], [208, 104], [268, 104], [332, 104]],
  centre: [166, 50],
  corners: [[-10, -8], [342, -8], [-10, 108], [342, 108]],
};
/** a debug view of the anchors (title: &force=anchors under ?city=2): an SVG to lay over the logo (the same viewBox) */
export function anchorsSvg({ pad = 26 } = {}) {
  const vb = `${-pad} ${-pad - 4} ${LOGO_W + pad * 2} ${LOGO_H + pad * 2 + 8}`, A = LOGO_ANCHORS;
  const dot = ([x, y], c) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${c}" stroke="#000" stroke-width="0.6"/>`;
  return `<svg class="nd-anchors" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">
<polyline points="${A.garland.map(p => p.join(',')).join(' ')}" fill="none" stroke="#7dff9a" stroke-width="1" stroke-dasharray="3 2"/>
${A.tops.flat().map(p => dot(p, '#00e5ff')).join('')}${A.garland.map(p => dot(p, '#7dff9a')).join('')}${A.gaps.map(p => dot(p, '#ffd23f')).join('')}
${A.base.map(p => dot(p, '#ff8a3d')).join('')}${dot(A.centre, '#ff3b6b')}${A.corners.map(p => dot(p, '#c38bff')).join('')}
</svg>`;
}

/** The tube "N" alone (app icon / favicon). */
export function monogramSvg({ id = 'ndm', size = 100, blur = 1 } = {}) {
  const L = LETTERS[0];
  return `<svg viewBox="-34 -30 132 160" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <filter id="${id}-b1" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${3.4 * blur}"/></filter>
  <filter id="${id}-b2" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${12 * blur}"/></filter>
</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  ${L.ends.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${TUBE * 0.5}" fill="#2a1626"/>`).join('')}
  <path d="${L.d}" stroke="${PINK.glow}" stroke-width="${TUBE + 16}" filter="url(#${id}-b2)" opacity="0.9"/>
  <path d="${L.d}" stroke="${PINK.glow}" stroke-width="${TUBE + 4}" filter="url(#${id}-b1)"/>
  <path d="${L.d}" stroke="${PINK.body}" stroke-width="${TUBE + 1}"/>
  <path d="${L.d}" stroke="${PINK.core}" stroke-width="${TUBE * 0.38}"/>
  <path d="${L.d}" stroke="#fff" stroke-width="1.2" transform="translate(-1.8 -1.8)" opacity="0.5"/>
</g>
</svg>`;
}

export const TAGLINE = 'YOUR FRIENDS ARE ALREADY INSIDE.';
