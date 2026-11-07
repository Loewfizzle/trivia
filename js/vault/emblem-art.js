// THE VAULT 2A — THE EMBLEM SYSTEM: AN EMBLEM = A SHAPE + A FINISH (the owner, Nov 2 10:20 pm + Nov 3 7:46 am; emblem-finishes.png — "one
// shape, eight finishes"). Every emblem is a box of small SVG LAYERS (no canvas: crisp at the phone's full 3×, nothing on the shared effect surface) — each moving
// part its own layer, its motion CSS on transform + opacity of the layer (the compositor: nothing repaints — css/vault.css .ve-*), still
// under reduced motion. THE 28-PT RULE: every shape reads at 28 pt
// on a lobby strip — bold silhouettes, one or two tubes, one bright accent; the effects TOUCH or SURROUND the shape (frost on the arms,
// embers off it, its own lights, a glint) — never fill over it.
//   NEON — the house style (the commons): the sign's own tube stack (ui/logo.js + ui/tube-logo.js — glass → wide glow → near glow →
//          body → white-hot core → a highlight), the glows as wide soft strokes (no blur filter: an animated SVG with a filter repaints it).
//          TODAY'S 12 EMBLEMS (the sign-up shapes, config.js AVATARS + ui/components.js FRAMES) are commons on this renderer, in the
//          player's colour. TUBE STYLES (separate unlocks, worn on ANY neon emblem — mix + match): two-tone · breathing · a chasing light
//          (2A) · gold tube · old sign · slow burn · on the beat (2B).
//   PRISM · CHROME · GOLD · ICE CRYSTAL · MOLTEN · GLITCH · GALAXY — the rarer finishes, each tied to its own emblem.
// THE PROMINENCE RULE (emblems.js#prominence): mode 'lead' (a still card: the full motion) · 'even' · 'quiet' (a legendary card: calmer).
//   emblemEl({ id, avatar, color, tube, mode, size }) → <span class="ve …"> (its SVG layers)   (id: an emblem item id with art — else the avatar shape)
import { AVATARS, colorHex } from '../config.js';
import { FRAMES } from '../ui/components.js';
import { flattenPath } from '../core/tube-path.js';
import { beatSync } from './beat-sync.js';

const NS = 'http://www.w3.org/2000/svg';
let uid = 0;
const el = (tag, a = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) if (v != null) e.setAttribute(k, String(v)); return e; };
const hexRgb = hex => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
/** a colour lightened toward white (k > 0) or darkened (k < 0) → 'rgb()' */
export const shade = (hex, k) => `rgb(${hexRgb(hex).map(v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)).join(',')})`;
/** two-tone's second colour: each neon's partner across the wheel (pink ↔ cyan, gold ↔ violet …) */
const PARTNER = { '#ff2bd6': '#00f0ff', '#00f0ff': '#ff2bd6', '#f3ff3a': '#a66bff', '#3dff8b': '#ff5fb4', '#ff8c1a': '#3fd8ff', '#a66bff': '#ffcf3a', '#ff3355': '#3fd8ff', '#3d7bff': '#ffcf3a' };
const partner = hex => PARTNER[hex.toLowerCase()] || '#3fd8ff';

// ---------------------------------------------------------------- THE SHAPES (a 48 × 48 grid; tubes = { d, col } — d in absolute commands)
export const BOLT = 'M28.5 3.5 L9.5 27.5 H22.5 L17.5 44.5 L38.5 18.5 H25.5 Z';
const SH = {
  key: [{ d: 'M15 6.5 A8.5 8.5 0 1 1 14.99 6.5 Z M21 21 L41 41 M36.5 36.5 L40.5 32.5 M31.5 31.5 L35 28', col: '#ffb43a' },
    { d: 'M15 10.6 L18.4 15 L15 19.4 L11.6 15 Z', col: '#ff5fb4' }],
  // (emb-sweetheart — the heart done properly, the owner: "the heart must be better": full round lobes, a long elegant point, one tube with its
  //  reflection arc; the little purple heart tucked over the right lobe)
  sweetheart: [{ d: 'M21 41.5 C 13.5 35.5, 5 29, 5 19.5 C 5 13.5, 9.5 9.5, 14.5 9.5 C 17.6 9.5, 19.8 11.2, 21 13.6 C 22.2 11.2, 24.4 9.5, 27.5 9.5 C 32.5 9.5, 37 13.5, 37 19.5 C 37 29, 28.5 35.5, 21 41.5 Z', col: '#ff4fb8' },
    { d: 'M10.5 19 C 10.5 16, 12.4 14.2, 14.8 14', col: '#ffd0ec', thin: true },
    { d: 'M39 22 C 35.6 19.4, 33 17.2, 33 14.4 C 33 12.4, 34.5 11, 36.2 11 C 37.5 11, 38.5 11.7, 39 12.8 C 39.5 11.7, 40.5 11, 41.8 11 C 43.5 11, 45 12.4, 45 14.4 C 45 17.2, 42.4 19.4, 39 22 Z', col: '#b46bff' }],
  // (emb-owl, Art Deco — the owner: "too cartoon": no round eyes. The body an egg in violet with two feathered tufts swept OUT (an owl's,
  //  not a cat's ears), the BARN OWL's heart-shaped face as the gold mask, two narrow almond eyes + a beak inside it, the folded wings'
  //  chevrons below)
  owl: [{ d: 'M12.5 7 L24 13 L35.5 7 L33 16.5 C 37 20.5, 38 26.5, 35.5 32 C 33.5 37, 29 40.8, 24 42.8 C 19 40.8, 14.5 37, 12.5 32 C 10 26.5, 11 20.5, 15 16.5 Z M17.5 34 L24 39 L30.5 34', col: '#b874ff' },
    { d: 'M24 30.5 C 20.5 30.5, 16.5 28, 16.5 23.5 C 16.5 20, 19 18, 21.2 18 C 22.6 18, 23.5 18.8, 24 19.8 C 24.5 18.8, 25.4 18, 26.8 18 C 29 18, 31.5 20, 31.5 23.5 C 31.5 28, 27.5 30.5, 24 30.5 Z M18.8 23.6 L21.2 22.2 L23 23.6 L21.2 25 Z M25 23.6 L26.8 22.2 L29.2 23.6 L26.8 25 Z M24 25.8 L24 28', col: '#ffcf5a' }],
  prism: { body: 'M24 8.5 L39.5 36.5 H8.5 Z', beam: 'M1.5 27 L16.2 23.6', fan: [['M31.4 23.4 L46 17.5', '#ff4f6a'], ['M32.4 25.4 L46.5 22.6', '#ffd23a'], ['M33.3 27.4 L46.5 27.7', '#3dff8b'], ['M34.2 29.4 L46 32.6', '#3fa8ff']] },
  crown: { body: 'M8.5 33 L5.5 13.5 L16 21.5 L24 8.5 L32 21.5 L42.5 13.5 L39.5 33 Z', base: 'M8.5 36.5 H39.5 V40 H8.5 Z', gems: [[24, 27, 2.6, '#ff5fb4'], [15.2, 29.3, 1.6, '#5fd7ff'], [32.8, 29.3, 1.6, '#5fd7ff']], tips: [[5.5, 13.5], [24, 8.5], [42.5, 13.5]] },
  snowflake: (() => {
    const c = 24, R = 17, arms = [], tips = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 3, ux = Math.cos(a), uy = Math.sin(a), P = (r, s = 0) => [c + ux * r - uy * s, c + uy * r + ux * s].map(v => v.toFixed(2)).join(' ');
      arms.push(`M${P(3)} L${P(R)} M${P(9.5)} L${P(13.5, 4)} M${P(9.5)} L${P(13.5, -4)}`);
      tips.push([c + ux * R, c + uy * R, a]);
    }
    return { arms: arms.join(' '), hex: 'M24 20.6 L26.9 22.3 V25.7 L24 27.4 L21.1 25.7 V22.3 Z', tips };
  })(),
  flame: { outer: 'M24 43 C 14 43, 9 36, 10.5 28 C 12 21, 18 18, 18.5 10 C 23 13.5, 23.5 18.5, 22.8 22.5 C 26 19.5, 27.5 14.5, 26.5 6 C 34 11, 38.5 19.5, 37.8 28.5 C 37.2 37, 32.5 43, 24 43 Z',
    inner: 'M24 40 C 19.5 40, 17.5 36.5, 18.5 32.5 C 19.3 29.5, 22 28, 22.5 24.5 C 25.5 27, 26 29.5, 25.6 31 C 27.5 30, 28.4 28.8, 28.8 27 C 30.5 29.5, 31 33, 30 35.8 C 29 38.6, 26.8 40, 24 40 Z',
    cracks: 'M14.5 31 L17.2 33.5 L16.4 36.8 M33.6 24.2 L31.4 27.5 L33 30.2 M20.4 17.5 L21.6 20.2 M29.5 13.5 L28.7 17.4 L30.6 19.4 M12.8 26.6 L15.6 26.1' },
  bolt: { body: BOLT },
  // emb-crown — THE CROWN (level 55, RARE): its OWN shape (the owner, Nov 3 — never a second of emb-house's three-spike gold crown): an
  // IMPERIAL crown — a jewelled band, two arches sweeping up to meet in the middle, the orb + cross on top; violet neon arches, the orb +
  // cross in gold; its three band gems twinkling in turn + a glint off the cross
  crown2: { tubes: [
    { d: 'M12.4 31.6 C 8.6 22.5, 14.5 15.2, 24 15.8 C 33.5 15.2, 39.4 22.5, 35.6 31.6 M24 15.8 V31.6', col: '#b46bff' },
    { d: 'M11 31.6 H37 V38.4 H11 Z M21.3 11 A2.7 2.7 0 1 0 26.7 11 A2.7 2.7 0 1 0 21.3 11 Z M24 8.3 V2.6 M21.4 5.1 H26.6', col: '#ffcf5a' }],
    fx(C) {
      [[15.5, 35, '#ff5fb4'], [24, 35, '#5fd7ff'], [32.5, 35, '#ff5fb4']].forEach(([x, y, col], i) => {
        const L = C.layer('ve-gem', `--i:${i};transform-origin:${pct(x)} ${pct(y)}`); L.g.append(el('circle', { cx: x, cy: y, r: 3.2, fill: col, opacity: 0.35 }), el('circle', { cx: x, cy: y, r: 1.35, fill: '#fff' }));
      });
      glint(C, 24, 3.6, 3.4, 've-2 ve-cglint');
    } },
  // emb-sg-tr3b — THE REAL TR-3B, seen from below as the city flies it (screens/harbor/legends.js#tr3bCorners un-flattened: an equilateral
  // triangle, its corners rounded at 3.5 % of its length, the recessed corner pods at 0.8 of the way out, the hub at 0.135): nose up
  tr3b: (() => {
    const c = [24, 26.5], R = 19, P = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; return [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]; });
    const rr = 2.6, path = (k = 1) => {
      const Q = P.map(p => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]);
      return Q.map((b, i) => { const a = Q[(i + 2) % 3], n = Q[(i + 1) % 3], la = Math.hypot(a[0] - b[0], a[1] - b[1]), ln = Math.hypot(n[0] - b[0], n[1] - b[1]);
        const p0 = [b[0] + (a[0] - b[0]) / la * rr * 1.7, b[1] + (a[1] - b[1]) / la * rr * 1.7], p1 = [b[0] + (n[0] - b[0]) / ln * rr * 1.7, b[1] + (n[1] - b[1]) / ln * rr * 1.7];
        return `${i ? 'L' : 'M'}${p0.map(v => v.toFixed(2)).join(' ')} Q${b.map(v => v.toFixed(2)).join(' ')} ${p1.map(v => v.toFixed(2)).join(' ')}`; }).join(' ') + ' Z';
    };
    return { hull: path(1), inset: path(0.72), pods: P.map(p => [c[0] + (p[0] - c[0]) * 0.8, c[1] + (p[1] - c[1]) * 0.8]), hub: c, hubR: R * 0.135 / 0.6 };
  })(),
  // emb-sg-ufo — the city's saucer (screens/harbor/ufo-model.js: the dome, the wide disc, the rim ports, the beam) as a silhouette
  saucer: { body: 'M3.5 26.5 C 6.5 22.4, 12.5 21.4, 16.4 21.1 C 17 13.6, 31 13.6, 31.6 21.1 C 35.5 21.4, 41.5 22.4, 44.5 26.5 C 40.5 30.8, 7.5 30.8, 3.5 26.5 Z',
    rim: 'M5.5 26.6 C 12 28.6, 36 28.6, 42.5 26.6', dome: 'M17.6 21.2 C 21 20.1, 27 20.1, 30.4 21.2',
    ports: [[9.5, 27.1], [16.5, 28], [24, 28.3], [31.5, 28], [38.5, 27.1]], beam: ['M17.5 31 L12 43.5', 'M24 31.5 L24 44.5', 'M30.5 31 L36 43.5'] },
};

/** THE ART of every emblem with one (by item id): its shape + finish (+ the neon tubes' own colours) */
export const EMBLEM_ART = Object.freeze({
  'emb-key': { shape: 'key', finish: 'neon' },
  'emb-sweetheart': { shape: 'sweetheart', finish: 'neon' },
  'emb-owl': { shape: 'owl', finish: 'neon' },
  'emb-prism': { shape: 'prism', finish: 'prism' },
  'emb-house': { shape: 'crown', finish: 'gold' },
  'emb-snowflake': { shape: 'snowflake', finish: 'ice' },
  'emb-torch': { shape: 'flame', finish: 'molten' },
  'emb-lightning': { shape: 'bolt', finish: 'glitch' },
  'emb-sg-tr3b': { shape: 'tr3b', finish: 'chrome' },
  'emb-sg-ufo': { shape: 'saucer', finish: 'galaxy' },
  // THE VAULT 2B — the rest of the set
  'emb-crown': { shape: 'crown2', finish: 'neon' },
  'emb-cocktail': { shape: 'cocktail', finish: 'neon' },
  'emb-diamond': { shape: 'gem', finish: 'neon' },
  'emb-glasses': { shape: 'glasses', finish: 'neon' },
  'emb-sunrise': { shape: 'sunrise', finish: 'neon' },
  'emb-bullseye': { shape: 'target', finish: 'neon' },
  'emb-crescent': { shape: 'crescent', finish: 'neon' },
  'emb-butterfly': { shape: 'butterfly', finish: 'neon' },
  'emb-peephole': { shape: 'door', finish: 'neon' },
  'emb-keyhole': { shape: 'keyhole', finish: 'neon' },
  'emb-lighthouse': { shape: 'lighthouse', finish: 'neon' },
  'emb-stars': { shape: 'stars3', finish: 'neon' },
  'emb-wings': { shape: 'wings', finish: 'metal' },
  'emb-bitcoin': { shape: 'coin', finish: 'coin' },
  'emb-sunburst': { shape: 'sunburst', finish: 'metal' },
  'emb-ace': { shape: 'spade', finish: 'metal' },
  'emb-sg-blackbird': { shape: 'sr71', finish: 'metal' },
  'emb-sg-f22': { shape: 'f22', finish: 'metal' },
  'emb-sg-ghostship': { shape: 'ghost', finish: 'spectral' },
  'emb-sg-aurora': { shape: 'aurora', finish: 'aurora' },
  'emb-sg-fireball': { shape: 'comet', finish: 'comet' },
  'emb-sg-skull': { shape: 'skullb', finish: 'balloon' },
  'emb-sg-btc': { shape: 'btcb', finish: 'balloon' },
  // THE SEASONAL EMBLEMS (2B — earned only during their holiday, kept forever: core/progress.js#SEASONAL)
  'emb-hw': { shape: 'pumpkin', finish: 'neon' },
  'emb-tg': { shape: 'maple', finish: 'autumn' },
  'emb-xmas': { shape: 'xmas', finish: 'neon' },
  'emb-nye': { shape: 'coupe', finish: 'neon' },
});
export const FINISHES = Object.freeze(['neon', 'prism', 'chrome', 'gold', 'ice', 'molten', 'glitch', 'galaxy', 'metal', 'coin', 'spectral', 'aurora', 'comet', 'balloon', 'autumn']);
/** the tube styles with a look (2A); the others wear as a plain tube until 2B builds theirs */
export const TUBE_STYLES = Object.freeze({ 'tube-twotone': 'twotone', 'tube-breath': 'breath', 'tube-chase': 'chase',
  // THE VAULT 2B — the rest
  'tube-gold': 'gold', 'tube-flicker': 'flicker', 'tube-ember': 'ember', 'tube-burnt': 'burnt', 'tube-beat': 'beat' });
export const hasArt = id => !!(id && EMBLEM_ART[id]);
export const finishOf = id => (EMBLEM_ART[id] || { finish: 'neon' }).finish;
/** a tube style shows on NEON emblems only (a special finish keeps its own light) */
export const tubeApplies = id => !id || !EMBLEM_ART[id] || EMBLEM_ART[id].finish === 'neon';

// ---------------------------------------------------------------- THE LAYERS (Group 2's speed fix: 8 legendaries + the samples measured 33.5 fps
// at 4× CPU with the motion on the SVG's CHILDREN — every animated child repaints its whole SVG each frame). Now an emblem is a stack of
// small SVG LAYERS in one box (span.ve): the still parts in one, EACH MOVING PART ITS OWN LAYER, animated on the layer itself (transform +
// opacity → the compositor moves it, nothing repaints); a part that moves INSIDE the shape (a sweep, a shine, the nebula) moves inside a
// MASK of the shape (i.ve-m — the mask still, the layer under it sliding).
const VB = '-2 -2 52 52', BOX = 52, pct = v => `${((v + 2) / BOX * 100).toFixed(2)}%`;
const G_ATTR = { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
/** the context: C.layer(cls, style, vb) → { svg, defs, g } appended to the box (DOM order = stacking); C.mask(d, cls) → a mask of the shape
 *  with its own .layer() */
function ctx(root) {
  // (each layer an HTML <i> holding its <svg>: the animation runs on the <i> — Chromium never moves an SVG element on the compositor, so an
  //  animated <svg> repaints every frame; an animated <i> is just moved)
  const mk = (host, cls, style, vb) => {
    const box = document.createElement('i'); box.className = `ve-l${cls ? ` ${cls}` : ''}`;
    if (style) box.setAttribute('style', style);
    const svg = el('svg', { viewBox: vb || VB, 'aria-hidden': 'true' });
    const defs = el('defs'), g = el('g', G_ATTR); svg.append(defs, g); box.append(svg); host.append(box);
    return { svg: box, defs, g };
  };
  return {
    layer: (cls, style, vb) => mk(root, cls, style, vb),
    // (THE VAULT 2B: a GROUP — one HTML layer holding layers of its own, moved as one: the butterfly's wings opening + closing)
    group(cls, style) { const g = document.createElement('i'); g.className = `ve-l ve-grp${cls ? ` ${cls}` : ''}`; if (style) g.setAttribute('style', style); root.append(g); return ctx(g); },
    mask(d, cls) {
      const m = document.createElement('i'); m.className = `ve-m${cls ? ` ${cls}` : ''}`;
      const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='${VB}'><path d='${d}'/></svg>`)}")`;
      m.style.webkitMaskImage = url; m.style.maskImage = url; root.append(m);
      return { layer: (cls2, style, vb) => mk(m, cls2, style, vb) };
    },
  };
}

// ---------------------------------------------------------------- NEON (the sign's tube stack)
const lenOf = d => flattenPath(d, 1, 0, 0, 1).reduce((a, p) => a + p.pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p.pts[i - 1][0], q[1] - p.pts[i - 1][1]) : 0), 0), 0);
/** two-tone's gradients in one layer's defs → { b, c } fills (else null: each tube its own colour) */
function twoTone(defs, A) {
  const n = `ve${++uid}`, B = partner(A);
  const lg = (id, k) => { const g = el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 8, y1: 8, x2: 40, y2: 40 }); for (const [o2, c] of [[0, A], [0.47, A], [0.53, B], [1, B]]) g.append(el('stop', { offset: o2, 'stop-color': k ? shade(c, k) : c })); return g; };
  defs.append(lg(`${n}b`, 0.16), lg(`${n}c`, 0.84));
  return { b: `url(#${n}b)`, c: `url(#${n}c)` };
}
/** one tube's chosen parts ('glass' 'g2' 'g1' 'body' 'core' 'hi') into a layer's group (two-tone: the layer's gradients) */
function tubeParts(L, t, T, parts, tt) {
  const k = t.k || 1, w = (t.thin ? T * 0.55 : T) / k, g = el('g', { transform: t.tf });
  const body = tt ? tt.b : shade(t.col, 0.16), glowC = t.glow || (tt ? tt.b : t.col), core = tt ? tt.c : shade(t.col, 0.84);
  const P = {
    glass: () => el('path', { d: t.d, class: 've-glass', stroke: shade(t.col, -0.74), 'stroke-width': (w + 1.1 / k).toFixed(2) }),
    g2: () => el('path', { d: t.d, class: 've-g2', stroke: glowC, 'stroke-width': (w * 3.4).toFixed(2) }),
    g1: () => el('path', { d: t.d, class: 've-g1', stroke: glowC, 'stroke-width': (w * 1.9).toFixed(2) }),
    body: () => el('path', { d: t.d, class: 've-body', stroke: body, 'stroke-width': w.toFixed(2) }),
    core: () => el('path', { d: t.d, class: 've-core', stroke: core, 'stroke-width': (w * 0.36).toFixed(2) }),
    hi: () => el('path', { d: t.d, class: 've-hi', stroke: '#fff', 'stroke-width': (0.42 / k).toFixed(2), transform: `translate(${(-0.45 / k).toFixed(2)} ${(-0.45 / k).toFixed(2)})` }),
  };
  for (const p of parts) g.append(P[p]());
  L.g.append(g);
}
/** GOLD TUBE's glass (2B): every tube in struck gold — a warm body, a cream core, gold glows */
const GOLD_TT = { b: '#ffcf5a', c: '#fff4cc' };
/** SLOW BURN's light (2B): the glow smouldering ember-red round the tube's own colour */
const EMBER_TT = { b: null, c: '#ffe4c8', g: '#ff5a1e' };
function neon(C, tubes, o, base) {
  const T = o.T || 2.6, two = o.tube === 'twotone', st = o.tube;
  const tt0 = st === 'gold' ? GOLD_TT : null;
  const put = (L, parts, only) => { const tt = two ? twoTone(L.defs, tubes[0].col) : tt0; for (const [k, t] of tubes.entries()) if (!only || only(k)) tubeParts(L, st === 'ember' ? { ...t, glow: EMBER_TT.g } : t, T, parts, tt); };
  // (THE VAULT 2B — the rest of the tube styles: OLD SIGN · BURNT OUT · SLOW BURN · GOLD TUBE · ON THE BEAT)
  if (st === 'flicker') {
    // OLD SIGN: the whole tube's light on one layer, flickering like an old sign (dips + a stutter now + then); the dark glass stays
    put(base, ['glass']); put(C.layer('ve-old'), ['g2', 'g1', 'body', 'core', 'hi']); return;
  }
  if (st === 'burnt') {
    // BURNT OUT: one tube half dead — the first tube's light stuttering (dark mostly, catching for a moment); the rest burns steady
    put(base, ['glass']); put(base, ['g2', 'g1', 'body', 'core', 'hi'], k => k > 0 || tubes.length === 1); if (tubes.length > 1) put(C.layer('ve-burnt'), ['g2', 'g1', 'body', 'core', 'hi'], k => k === 0);
    if (tubes.length === 1) C.layer('ve-burnt-d').g.append(el('path', { d: tubes[0].d, transform: tubes[0].tf, stroke: '#07060a', 'stroke-width': (T * 1.4 / (tubes[0].k || 1)).toFixed(2), 'stroke-dasharray': `${((tubes[0].len || lenOf(tubes[0].d)) * 0.3).toFixed(2)} 999` }));
    return;
  }
  if (st === 'ember') {
    // SLOW BURN: the tube smouldering — its glow in ember red, breathing slowly + deeply, two embers drifting up off it
    put(base, ['glass', 'body', 'core', 'hi']); put(C.layer('ve-smoulder'), ['g2', 'g1']);
    for (const i of [0, 1]) C.layer('ve-spark', `--i:${i}`).g.append(el('circle', { cx: 16 + i * 16, cy: 12 + i * 4, r: 0.9, fill: '#ffb060' }), el('circle', { cx: 16 + i * 16, cy: 12 + i * 4, r: 2, fill: '#ff6a2a', opacity: 0.35 }));
    return;
  }
  if (st === 'beat') {
    // ON THE BEAT: the glows + the core PULSE on the song's grid on a party night (Fri + Sat, 8 pm – 2 am: --beat / --beat-off from
    // js/vault/beat-sync.js); any other time a slow, steady glow
    put(base, ['glass', 'body', 'hi']); put(C.layer('ve-bt'), ['g2', 'g1', 'core']); beatSync(); return;
  }
  if (o.tube === 'breath') {
    // BREATHING: the glows breathe on their own layer, the body + core on another (the glass + the highlight still)
    put(base, ['glass']); put(C.layer('ve-br-g'), ['g2', 'g1']); put(C.layer('ve-br-b'), ['body', 'core']); put(C.layer(), ['hi']);
    return;
  }
  put(base, ['glass', 'g2', 'g1', 'body', 'core', 'hi']);
  if (st === 'gold') {
    // GOLD TUBE: neon in gold glass — + one slow run of white-gold light round it
    for (const t of tubes) { if (t.noChase) continue; const k = t.k || 1, w = (t.thin ? T * 0.55 : T) / k, len = t.len || lenOf(t.d); C.layer('ve-grun').g.append(el('path', { d: t.d, transform: t.tf, stroke: '#fffbe6', 'stroke-width': (w * 1.05).toFixed(2), 'stroke-dasharray': `${(len * 0.22).toFixed(2)} ${len.toFixed(2)}` })); }
  }
  if (o.tube === 'chase') {
    // A CHASING LIGHT: the white-hot light in eight short runs round every tube — eight layers, each flashing in turn (opacity only)
    const N = 6;
    for (let i = 0; i < N; i++) {
      const L = C.layer('ve-ch', `--i:${i}`);
      for (const t of tubes) {
        if (t.noChase) continue;
        const k = t.k || 1, w = (t.thin ? T * 0.55 : T) / k, len = t.len || lenOf(t.d);
        L.g.append(el('path', { d: t.d, transform: t.tf, stroke: '#fff', 'stroke-width': (w * 1.15).toFixed(2), 'stroke-dasharray': `${(len * 0.14).toFixed(2)} ${len.toFixed(2)}`, 'stroke-dashoffset': (-i * len / N).toFixed(2) }));
      }
    }
  }
}

// ---------------------------------------------------------------- THE FINISHES
const lin = (defs, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units) => { const id = `veg${++uid}`, g = el('linearGradient', { id, x1, y1, x2, y2, gradientUnits: units }); for (const [o, c, a] of stops) g.append(el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a })); defs.append(g); return `url(#${id})`; };
const rad = (defs, stops, cx = 0.5, cy = 0.5, r = 0.5) => { const id = `ver${++uid}`, g = el('radialGradient', { id, cx, cy, r }); for (const [o, c, a] of stops) g.append(el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a })); defs.append(g); return `url(#${id})`; };
const starPath = (x, y, s) => `M${x} ${y - s} L${x + s * 0.18} ${y - s * 0.18} L${x + s} ${y} L${x + s * 0.18} ${y + s * 0.18} L${x} ${y + s} L${x - s * 0.18} ${y + s * 0.18} L${x - s} ${y} L${x - s * 0.18} ${y - s * 0.18} Z`;
/** a glint on its own layer, scaling from its own centre */
const glint = (C, x, y, s, cls = '', style = '') => C.layer(`ve-glint${cls ? ` ${cls}` : ''}`, `transform-origin:${pct(x)} ${pct(y)};${style}`).g.append(el('path', { d: starPath(x, y, s), fill: '#fff' }));
/** a band of light sliding across a shape (inside its mask): a layer `w` units wide starting `w` left of the box, moved by CSS (ve-slide) */
const slide = (M, cls, w, fill, style = '') => { const L = M.layer(cls, `left:${(-w / BOX * 100).toFixed(2)}%;width:${(w / BOX * 100).toFixed(2)}%;${style}`, `0 -2 ${w} 52`); L.g.append(el('rect', { x: 0, y: -2, width: w, height: 52, fill: fill(L.defs) })); return L; };
const RAINBOW = ['#ff5f8f', '#ffb34d', '#fff27a', '#6dffa8', '#5fd7ff', '#8f7dff', '#ff6fe0'];
const SHEEN = a => [[0, '#fff', 0], [0.42, '#fff', 0], [0.5, '#fff', a], [0.58, '#fff', 0], [1, '#fff', 0]];

const FIN = {
  // PRISM — a rainbow sweeping through the glass, a white edge, a sheen, a glint; the white beam in + the four lines out (emb-prism)
  prism(C, B) {
    const S = SH.prism;
    B.g.append(el('path', { d: S.beam, class: 've-beam', stroke: '#fff', 'stroke-width': 1.6 }), el('path', { d: S.body, class: 've-halo', stroke: '#fff', 'stroke-width': 5 }));
    const M = C.mask(S.body);
    // (the rainbow: two identical cycles across a band 128 wide, sliding one cycle + looping without a seam)
    const sw = M.layer('ve-sweep', 'width:246.15%', '0 -2 128 52');
    sw.g.append(el('rect', { x: 0, y: -2, width: 128, height: 52, fill: lin(sw.defs, [...RAINBOW, ...RAINBOW, RAINBOW[0]].map((c, i, a) => [(i / (a.length - 1)).toFixed(4), c]), 0, 0, 1, 0.35) }));
    slide(M, 've-sheen ve-2', 48, d => lin(d, SHEEN(0.85), 0, 0, 1, 0));
    const top = C.layer();
    top.g.append(el('path', { d: S.body, stroke: '#fff', 'stroke-width': 1.4, class: 've-edge' }));
    S.fan.forEach(([d, c]) => top.g.append(el('path', { d, stroke: c, 'stroke-width': 3.4, opacity: 0.25 }), el('path', { d, stroke: c, 'stroke-width': 1.6, opacity: 0.55 })));
    // the four lines pulsing out in turn (two layers: 1 + 3, then 2 + 4)
    for (const i of [0, 1]) { const L = C.layer('ve-rays ve-2', `--i:${i}`); S.fan.filter((x, k) => k % 2 === i).forEach(([d, c]) => L.g.append(el('path', { d, stroke: c, 'stroke-width': 1.6 }))); }
    glint(C, 24, 9.5, 4.2, 've-2');
  },
  // GOLD — solid gold (emb-house's crown): a struck metal gradient, a dark edge + a bright inner bevel, its gems, a slow shine + a glint
  gold(C, B) {
    const S = SH.crown, all = `${S.body} ${S.base}`;
    const au = lin(B.defs, [[0, '#fff6cf'], [0.28, '#f6cf6a'], [0.5, '#c18a2a'], [0.62, '#f2c45a'], [0.82, '#a8701c'], [1, '#e8b850']]);
    B.g.append(el('path', { d: all, stroke: '#ffcf5a', 'stroke-width': 5, class: 've-halo' }),
      el('path', { d: all, fill: au, stroke: '#6a4208', 'stroke-width': 1.3 }),
      el('path', { d: S.body, stroke: '#fff3c4', 'stroke-width': 0.7, transform: 'translate(24 23) scale(0.86) translate(-24 -23)', opacity: 0.85 }));
    for (const [x, y, r, c] of S.gems) B.g.append(el('circle', { cx: x, cy: y, r, fill: c, stroke: '#4a2a04', 'stroke-width': 0.6 }), el('circle', { cx: x - r * 0.32, cy: y - r * 0.35, r: r * 0.32, fill: '#fff', opacity: 0.85 }));
    slide(C.mask(all), 've-shine', 40, d => lin(d, SHEEN(0.9), 0, 0, 1, 0));
    glint(C, S.tips[1][0], S.tips[1][1], 3.6, 've-tip');
  },
  // ICE CRYSTAL — cut ice (emb-snowflake): pale crystal arms + a white core; FROST growing out at each tip in turn, glinting as it finishes
  ice(C, B) {
    const S = SH.snowflake, ice = lin(B.defs, [[0, '#ffffff'], [0.5, '#bfeaff'], [1, '#7fc8f0']]);
    B.g.append(el('path', { d: S.arms, stroke: '#7fd4ff', 'stroke-width': 6.5, opacity: 0.18, class: 've-halo' }),
      el('path', { d: S.arms, stroke: '#2d6f96', 'stroke-width': 4.4 }), el('path', { d: S.arms, stroke: ice, 'stroke-width': 3 }),
      el('path', { d: S.arms, stroke: '#fff', 'stroke-width': 0.8, opacity: 0.95 }), el('path', { d: S.hex, fill: ice, stroke: '#2d6f96', 'stroke-width': 0.8 }));
    // (three layers, each a PAIR of opposite tips growing together from the centre's side — a pair every 2 s)
    for (let i = 0; i < 3; i++) {
      const L = C.layer('ve-frost', `--i:${i}`);
      for (const [x, y, a] of [S.tips[i], S.tips[i + 3]]) {
      L.g.append(el('circle', { cx: x.toFixed(2), cy: y.toFixed(2), r: 3.6, fill: '#bfeaff', opacity: 0.22 }));
      for (const da of [-0.75, 0, 0.75]) { const b = a + da, L2 = da ? 4.2 : 5.2; L.g.append(el('path', { d: `M${x.toFixed(2)} ${y.toFixed(2)} L${(x + Math.cos(b) * L2).toFixed(2)} ${(y + Math.sin(b) * L2).toFixed(2)}`, stroke: '#f2fcff', 'stroke-width': 1.25 })); }
      L.g.append(el('path', { d: starPath(x + Math.cos(a) * 5.2, y + Math.sin(a) * 5.2, 2.4), fill: '#fff', class: 've-tipglint' }));
      }
    }
  },
  // MOLTEN — emb-torch's flame as lava: a black crust, glowing cracks pulsing, the hot core breathing, heat dripping off the foot, embers rising
  molten(C, B) {
    const S = SH.flame, crust = lin(B.defs, [[0, '#3a1206'], [0.6, '#24090a'], [1, '#120404']]);
    B.g.append(el('path', { d: S.outer, stroke: '#ff5a14', 'stroke-width': 5.5, opacity: 0.22, class: 've-halo' }),
      el('path', { d: S.outer, fill: crust, stroke: '#ff6a1a', 'stroke-width': 1.5 }),
      el('path', { d: S.cracks, stroke: '#ff8a2a', 'stroke-width': 1.1, opacity: 0.4 }));
    const cr = C.layer('ve-crack'); cr.g.append(el('path', { d: S.cracks, stroke: '#ff8a2a', 'stroke-width': 1.1 }));
    const cr2 = C.layer('ve-crack ve-crack2 ve-2'); cr2.g.append(el('path', { d: S.cracks, stroke: '#ffe08a', 'stroke-width': 0.45 }));
    const hot = C.layer('ve-core-h'); hot.g.append(el('path', { d: S.inner, fill: lin(hot.defs, [[0, '#ffe9a0'], [0.5, '#ffb030'], [1, '#ff5a10']]) }), el('path', { d: S.inner, stroke: '#fff4c8', 'stroke-width': 0.6 }));
    C.layer('ve-drip ve-2').g.append(el('ellipse', { cx: 24, cy: 44.2, rx: 1.2, ry: 1.6, fill: '#ffb030' }));
    for (const [i, pts] of [[0, [[8.5, 30], [33.5, 9]]], [1, [[39.5, 25], [14, 14]]]]) { const L = C.layer('ve-ember ve-2', `--i:${i}`); for (const [x, y] of pts) L.g.append(el('circle', { cx: x, cy: y, r: 0.95, fill: '#ffc060' })); }
  },
  // GLITCH — emb-lightning's bolt: white + its red / cyan ghosts, now + then it jumps, two slices tear sideways + it snaps back
  glitch(C) {
    const d = SH.bolt.body;
    C.layer('ve-gr').g.append(el('path', { d, fill: '#0a0a14', stroke: '#ff2e6a', 'stroke-width': 1.6 }));
    C.layer('ve-gc').g.append(el('path', { d, stroke: '#2ef0ff', 'stroke-width': 1.6 }));
    C.layer('ve-gw').g.append(el('path', { d, fill: '#14141e', stroke: '#fff', 'stroke-width': 1.6 }));
    for (const [y, h, i] of [[17, 4.5, 0], [30, 3.5, 1]]) {
      const L = C.layer(`ve-slice ve-sl${i} ve-2`), id = `vec${++uid}`, cp = el('clipPath', { id });
      cp.append(el('rect', { x: -2, y, width: 52, height: h })); L.defs.append(cp);
      const g = el('g', { 'clip-path': `url(#${id})` });
      g.append(el('rect', { x: -2, y, width: 52, height: h, fill: '#05050a' }), el('path', { d, fill: '#14141e', stroke: i ? '#2ef0ff' : '#ff2e6a', 'stroke-width': 1.6 }));
      L.g.append(g);
    }
  },
  // CHROME — emb-sg-tr3b's black-chrome hull (the real TR-3B): mirror bands, the inset panel line, the hub; a light gliding across; its
  // WHITE corner lights pulsing in turn + the RED centre's heavy pulse (the city's light layout — never red corners)
  chrome(C, B) {
    const S = SH.tr3b;
    const cr = lin(B.defs, [[0, '#2a2e36'], [0.3, '#0c0d11'], [0.46, '#5a616c'], [0.5, '#c9ced6'], [0.55, '#3a3f48'], [0.8, '#0a0b0e'], [1, '#1c1f25']], 0, 0, 0.3, 1);
    B.g.append(el('path', { d: S.hull, stroke: '#c8d2e6', 'stroke-width': 4.5, opacity: 0.12, class: 've-halo' }),
      el('path', { d: S.hull, fill: cr, stroke: '#d8dee8', 'stroke-width': 1.1 }),
      el('path', { d: S.inset, stroke: 'rgba(200,210,230,0.32)', 'stroke-width': 0.6 }),
      el('circle', { cx: S.hub[0], cy: S.hub[1], r: S.hubR, fill: '#08090c', stroke: 'rgba(210,218,232,0.55)', 'stroke-width': 0.6 }));
    slide(C.mask(S.hull), 've-shine ve-2', 40, d => lin(d, SHEEN(0.55), 0, 0, 1, 0));
    S.pods.forEach(([x, y], i) => { const L = C.layer('ve-pod ve-2', `--i:${i}`); L.g.append(el('circle', { cx: x, cy: y, r: 4.2, fill: '#dfe8ff', opacity: 0.4 }), el('circle', { cx: x, cy: y, r: 1.9, fill: '#fff' })); });
    const R = C.layer('ve-red'); R.g.append(el('circle', { cx: S.hub[0], cy: S.hub[1], r: 5.8, fill: '#ff2a14', opacity: 0.45 }), el('circle', { cx: S.hub[0], cy: S.hub[1], r: 2.2, fill: '#ff4a2a' }));
    C.layer().g.append(el('circle', { cx: S.hub[0] - 0.5, cy: S.hub[1] - 0.5, r: 0.7, fill: '#ffd6c8' }));
  },
  // GALAXY — emb-sg-ufo's saucer filled with deep space: a nebula drifting through it, stars twinkling inside; a pale rim, its
  // ports chasing round the rim, the beam's three rays pulsing below it
  galaxy(C, B) {
    const S = SH.saucer;
    const rays = C.layer('ve-beamr ve-2'); S.beam.forEach(d => rays.g.append(el('path', { d, stroke: '#9affd2', 'stroke-width': 1.2 })));
    const base = C.layer();
    base.g.append(el('path', { d: S.body, stroke: '#c7a6ff', 'stroke-width': 5, opacity: 0.18, class: 've-halo' }), el('path', { d: S.body, fill: rad(base.defs, [[0, '#2a1458'], [1, '#080414']]) }));
    const M = C.mask(S.body);
    // (the nebula: two identical cycles across a band 96 wide, sliding one cycle + looping without a seam)
    const cyc = ['#2a0f5e', '#8a2ab0', '#2c3fb8', '#d0449c', '#3a1a7a', '#2a6ad0'];
    const nb = M.layer('ve-neb', 'width:184.62%', '0 -2 96 52');
    nb.g.append(el('rect', { x: 0, y: 10, width: 96, height: 24, opacity: 0.85, fill: lin(nb.defs, [...cyc, ...cyc, cyc[0]].map((c, i, a) => [(i / (a.length - 1)).toFixed(4), c]), 0, 0, 1, 0) }));
    const ST = [[9, 26], [14, 24.5], [20, 18], [27, 16.6], [30, 24], [36, 25], [41, 26.5], [23, 26], [17.5, 27.5], [33, 19.5]];
    for (const i of [0, 1]) { const L = M.layer(`ve-stars${i ? ' ve-2' : ''}`, `--i:${i}`); ST.filter((s, k) => k % 2 === i).forEach(([x, y], k) => L.g.append(el('circle', { cx: x, cy: y, r: k % 2 ? 0.45 : 0.75, fill: '#fff' }))); }
    C.layer().g.append(el('path', { d: S.body, stroke: '#e6d8ff', 'stroke-width': 1.1 }), el('path', { d: S.rim, stroke: 'rgba(230,216,255,0.6)', 'stroke-width': 0.6 }), el('path', { d: S.dome, stroke: 'rgba(230,216,255,0.5)', 'stroke-width': 0.5 }));
    S.ports.forEach(([x, y], i) => C.layer('ve-port ve-2', `--i:${i}`).g.append(el('circle', { cx: x, cy: y, r: 1.15, fill: '#9affd2' })));
    void B;
  },
};


// ================================================================ THE VAULT 2B — THE REST OF THE SET (shapes on the 48 grid; ids, never
// names, in this file's comments — the names are the server's). Every shape reads at 28 pt (one or two tubes / one bold silhouette + one
// bright accent); the effects TOUCH or SURROUND it. The neon ones carry their own accents (fx: their own layers); the specials use the
// finishes below (METAL — silver · gold · black · grey · obsidian —, SPECTRAL, AURORA, COMET, BALLOON, COIN, AUTUMN).
const circ = (cx, cy, r) => `M${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} Z`;
const star5 = (cx, cy, R, r = R * 0.45) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * q).toFixed(2)} ${(cy + Math.sin(a) * q).toFixed(2)} `; } return `${d}Z`; };
const scaleY = (d, cy, k) => d.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${x} ${(cy + (+y - cy) * k).toFixed(2)}`);
const mirrorX = d => d.replace(/([MLCQHAVZ])|(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)|(-?\d+(?:\.\d+)?)/g, (m, cmd, x, y, n) => (cmd ? cmd : x != null ? `${(48 - +x).toFixed(2)} ${y}` : m));
/** a few small layers flashing in turn (--i) — a twinkle / a chase / a pulse; pts: [[x, y, r, col]] */
const dots = (C, cls, pts, glowR = 2.4) => pts.forEach(([x, y, r, col], i) => { const L = C.layer(cls, `--i:${i};transform-origin:${pct(x)} ${pct(y)}`); L.g.append(el('circle', { cx: x, cy: y, r: r * glowR, fill: col, opacity: 0.35 }), el('circle', { cx: x, cy: y, r, fill: '#fff' })); });

Object.assign(SH, {
  // emb-cocktail — a martini glass in cyan, its olive on a pick in green (still: the tube style is its motion)
  cocktail: [{ d: 'M9 11 H39 L24 26.5 Z M24 26.5 V40 M16 40.5 H32', col: '#3fe0ff' }, { d: `${circ(27.6, 16.8, 2.6)} M29.6 14.8 L34.8 8.6`, col: '#7dff6a' }],
  // emb-diamond — a brilliant-cut gem: its outline in sky blue, the facets in ice white
  gem: [{ d: 'M15 12 H33 L40.5 20 L24 40.5 L7.5 20 Z', col: '#5fd7ff' }, { d: 'M7.5 20 H40.5 M15 12 L19 20 L24 40.5 M33 12 L29 20 L24 40.5 M19 20 L24 12 L29 20', col: '#dff4ff', thin: true }],
  // emb-glasses — two glasses raised together (gold + pink); a CLINK flashing between the rims
  glasses: { tubes: [{ d: 'M9.5 13 H21 C 21 21, 18.6 24.5, 15.25 24.5 C 11.9 24.5, 9.5 21, 9.5 13 Z M15.25 24.5 V37 M10.5 37.5 H20', col: '#ffcf5a' },
    { d: 'M27 13 H38.5 C 38.5 21, 36.1 24.5, 32.75 24.5 C 29.4 24.5, 27 21, 27 13 Z M32.75 24.5 V37 M28 37.5 H37.5', col: '#ff6fc8' }],
    fx(C) { const L = C.layer('ve-clink'); L.g.append(el('path', { d: 'M24 10 V4.5 M20.2 10.8 L17.8 7 M27.8 10.8 L30.2 7', stroke: '#fff4d0', 'stroke-width': 1.6 }), el('circle', { cx: 24, cy: 12.4, r: 3.2, fill: '#fff4d0', opacity: 0.5 })); } },
  // emb-sunrise — the sun half up over the horizon (gold), its rays pulsing out one by one
  sunrise: { tubes: [{ d: 'M5 34 H43 M13.5 34 A10.5 10.5 0 0 1 34.5 34 M12 39.5 H36', col: '#ffc24a' }],
    fx(C) { [-162, -126, -90, -54, -18].forEach((a, i) => { const r = a * Math.PI / 180, L = C.layer('ve-sray', `--i:${i}`); L.g.append(el('path', { d: `M${(24 + Math.cos(r) * 14.5).toFixed(2)} ${(34 + Math.sin(r) * 14.5).toFixed(2)} L${(24 + Math.cos(r) * 19.5).toFixed(2)} ${(34 + Math.sin(r) * 19.5).toFixed(2)}`, stroke: '#ffe9a6', 'stroke-width': 2.2 })); }); } },
  // emb-bullseye — a target (pink rings, a white bull); a HIT rippling out from the centre
  target: { tubes: [{ d: `${circ(24, 24, 17)} ${circ(24, 24, 9.5)}`, col: '#ff4f7a' }, { d: circ(24, 24, 3.4), col: '#ffe6ef' }],
    fx(C) { const L = C.layer('ve-ripple', 'transform-origin:50% 50%'); L.g.append(el('path', { d: circ(24, 24, 6), stroke: '#fff', 'stroke-width': 1.2 })); C.layer('ve-hit').g.append(el('circle', { cx: 24, cy: 24, r: 5.5, fill: '#fff', opacity: 0.55 })); } },
  // emb-crescent — a crescent moon in violet, a small cyan star beside it twinkling
  crescent: { tubes: [{ d: 'M29.5 10.5 A15.5 15.5 0 1 0 29.5 38.5 A19 19 0 0 1 29.5 10.5 Z', col: '#b46bff' }],
    fx(C) { const L = C.layer('ve-tw2', `transform-origin:${pct(37)} ${pct(21)}`); L.g.append(el('path', { d: starPath(37, 21, 4.6), fill: '#9ff0ff' }), el('circle', { cx: 37, cy: 21, r: 3.6, fill: '#5fd7ff', opacity: 0.35 })); } },
  // emb-butterfly — purple wings, pink accents (the antennae, a dot on each wing); its wings OPENING + CLOSING slowly (one layer, scaleX)
  butterfly: { tubes: [{ d: 'M24 15 V36', col: '#c79bff' }, { d: `M23.2 15 L19.5 8.2 M24.8 15 L28.5 8.2 ${circ(14.2, 17, 1.5)} ${circ(33.8, 17, 1.5)}`, col: '#ff5fb4', thin: true }],
    group: { cls: 've-flap', tubes: [{ d: `M22.6 19 C 18 9.5, 6.5 9, 6.5 16.5 C 6.5 23.2, 15.5 25.2, 22.6 23.4 M22.6 25.4 C 16.6 25.6, 10.6 30.4, 12.6 35.4 C 14.6 40.4, 21.6 36.6, 22.6 30.6 ${mirrorX('M22.6 19 C 18 9.5, 6.5 9, 6.5 16.5 C 6.5 23.2, 15.5 25.2, 22.6 23.4 M22.6 25.4 C 16.6 25.6, 10.6 30.4, 12.6 35.4 C 14.6 40.4, 21.6 36.6, 22.6 30.6')}`, col: '#a66bff' }] } },
  // emb-peephole — the speakeasy's arched door (amber), its peephole SLIDING OPEN: light behind, two eyes, it shuts again
  door: { tubes: [{ d: 'M13.5 42 V18.5 A10.5 10.5 0 0 1 34.5 18.5 V42 Z M10 42.5 H38', col: '#ff9a3a' }, { d: `M19 19.5 H29 V24.8 H19 Z ${circ(30.6, 31.5, 1.2)}`, col: '#ffd27a', thin: true }],
    fx(C) { const L = C.layer('ve-peek'); L.g.append(el('rect', { x: 19.6, y: 20.1, width: 8.8, height: 4.1, fill: '#ffb84d' }), el('circle', { cx: 22, cy: 22.2, r: 0.95, fill: '#1a0a00' }), el('circle', { cx: 26, cy: 22.2, r: 0.95, fill: '#1a0a00' }), el('rect', { x: 17, y: 18, width: 14, height: 8, fill: '#ffb84d', opacity: 0.22 })); } },
  // emb-keyhole (PW2 — THE PASSWORD: any full crack) — a keyhole in amber: the round eye + the slot below it; a pink key's tip at the eye;
  // a warm light GLOWING through the hole (one layer, opacity — the room behind the door)
  keyhole: { tubes: [{ d: 'M24 11 A7.5 7.5 0 1 1 23.99 11 Z', col: '#ffb43a' }, { d: 'M20.2 24.5 L15.5 41 H32.5 L27.8 24.5', col: '#ffb43a' }, { d: 'M34 13.5 L40 7.5 M37.5 10 L40.5 13', col: '#ff5fb4', thin: true }],
    fx(C) { const L = C.layer('ve-keyglow'); L.g.append(el('circle', { cx: 24, cy: 18.5, r: 5.2, fill: '#ffd27a', opacity: 0.85 }), el('path', { d: 'M21.2 24.5 L17.8 38.5 H30.2 L26.8 24.5 Z', fill: '#ffd27a', opacity: 0.7 })); } },
  // emb-lighthouse (CC2 — COAST CLEAR: any clear) — a lighthouse in neon tubes: the tapered tower (white) with its stripe, the lamp room +
  // cap (gold), a wave line at its foot (cyan); its BEAM sweeping (one layer: the two cones swinging on the lamp — transform) + the lamp's glow
  lighthouse: { tubes: [{ d: 'M19.5 40 L21.6 19 H26.4 L28.5 40 Z M20.6 30 H27.4', col: '#e8f6ff' }, { d: 'M20.4 19 V13.5 H27.6 V19 M19.2 13.5 L24 9 L28.8 13.5 Z', col: '#ffcf5a' }, { d: 'M7 42.5 Q11.5 40.4 16 42.5 T25 42.5 T34 42.5 T41 42.5', col: '#5fd7ff', thin: true }],
    fx(C) {
      const G = C.layer('ve-lhglow'); G.g.append(el('circle', { cx: 24, cy: 16.2, r: 3.4, fill: '#fff3c4', opacity: 0.9 }), el('circle', { cx: 24, cy: 16.2, r: 6.5, fill: '#ffd27a', opacity: 0.25 }));
      const B = C.layer('ve-lhbeam', `transform-origin:${pct(24)} ${pct(16.2)}`); B.g.append(el('path', { d: 'M24 16.2 L44 10.5 L44 21.9 Z', fill: '#ffe6a3', opacity: 0.56 }), el('path', { d: 'M24 16.2 L4 10.5 L4 21.9 Z', fill: '#ffe6a3', opacity: 0.28 }));
    } },
  // emb-stars — three stars (gold, pink, cyan); the light HOPPING star to star
  stars3: { tubes: [{ d: star5(24, 13.5, 8), col: '#ffcf5a' }, { d: star5(13.5, 31.5, 7), col: '#ff5fb4' }, { d: star5(34.5, 31.5, 7), col: '#5fd7ff' }],
    fx(C) { [[24, 13.5, 8], [13.5, 31.5, 7], [34.5, 31.5, 7]].forEach(([x, y, R], i) => { const L = C.layer('ve-starlit', `--i:${i};transform-origin:${pct(x)} ${pct(y)}`); L.g.append(el('path', { d: star5(x, y, R * 0.62), fill: '#fff', opacity: 0.85 }), el('circle', { cx: x, cy: y, r: R * 1.2, fill: '#fff', opacity: 0.16 })); }); } },
  // emb-xmas — a tree in green neon zig-zags, a gold star on top glinting, its bulbs chasing in colour
  xmas: { tubes: [{ d: 'M24 9.5 L31.5 18.5 H27.5 L34.5 27 H29.5 L37.5 36.5 H10.5 L18.5 27 H13.5 L20.5 18.5 H16.5 Z M21.6 36.5 V41.5 H26.4 V36.5', col: '#3dff8b' }, { d: star5(24, 6.6, 4.2), col: '#ffcf5a', thin: true }],
    fx(C) { dots(C, 've-bulb', [[19.5, 21.5, 1.05, '#ff4a4a'], [28.5, 22.8, 1.05, '#ffcf5a'], [17, 31.5, 1.05, '#5fa8ff'], [24, 30, 1.05, '#ff5fd8'], [31.5, 32.5, 1.05, '#ff4a4a'], [24.5, 15.5, 1.05, '#5fd7ff']]); glint(C, 24, 6.6, 3.6, 've-2 ve-cglint'); } },
  // emb-nye — a champagne coupe in gold, bubbles rising in it, a firework bursting over it
  coupe: { tubes: [{ d: 'M11.5 20 H36.5 C 36.5 26.4, 30.6 29.2, 24 29.2 C 17.4 29.2, 11.5 26.4, 11.5 20 Z M24 29.2 V40 M17.5 40.5 H30.5', col: '#ffcf5a' }],
    fx(C) { [[20.5, 25], [25, 26.5], [28.5, 24.5]].forEach(([x, y], i) => C.layer('ve-bub', `--i:${i}`).g.append(el('circle', { cx: x, cy: y, r: 0.95, stroke: '#fff4d0', 'stroke-width': 0.6 })));
      const B = C.layer('ve-burst', `transform-origin:${pct(24)} ${pct(9.5)}`); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; B.g.append(el('path', { d: `M${(24 + Math.cos(a) * 3).toFixed(2)} ${(9.5 + Math.sin(a) * 3).toFixed(2)} L${(24 + Math.cos(a) * 7).toFixed(2)} ${(9.5 + Math.sin(a) * 7).toFixed(2)}`, stroke: i % 2 ? '#5fd7ff' : '#ff5fd8', 'stroke-width': 1.3 })); } } },
  // emb-hw — a jack-o'-lantern: the pumpkin in orange neon, its carved face lit from inside by a FLICKERING candle; a bat crossing the moon
  pumpkin: { tubes: [{ d: 'M24 14 C 33.5 14, 41.5 19, 41.5 27.5 C 41.5 36.5, 33.5 41, 24 41 C 14.5 41, 6.5 36.5, 6.5 27.5 C 6.5 19, 14.5 14, 24 14 Z M24 14.5 C 21.6 16.4, 20.6 18.2, 20.3 19.8 M24 14.5 C 26.4 16.4, 27.4 18.2, 27.7 19.8 M20.6 38.4 C 21.6 39.6, 22.7 40.3, 24 40.6 M27.4 38.4 C 26.4 39.6, 25.3 40.3, 24 40.6', col: '#ff8c1a' }, { d: 'M24 14 C 24 10.5, 25.8 8, 28.4 7.4', col: '#7dff6a', thin: true }],
    fx(C) { const F = C.layer('ve-candle'); F.g.append(el('path', { d: 'M14.8 25 L18.8 20.5 L21 26 Z M33.2 25 L29.2 20.5 L27 26 Z M14.5 31 L18.2 34 L21 31.6 L24 34.4 L27 31.6 L29.8 34 L33.5 31 L30 36.5 L24 37.6 L18 36.5 Z', fill: '#ffd34a' }));
      C.layer('ve-bat ve-2').g.append(el('path', { d: 'M40 7 C 41 6, 42 6.4, 42.5 7.4 C 43.2 6.6, 44.2 6.6, 44.6 7.4 C 45.2 6.4, 46.4 6.2, 47 7.2 C 45.8 7.2, 45 8, 44.8 9 C 44 8.4, 43.4 8.4, 42.6 9 C 42.4 8, 41.4 7.2, 40 7 Z', fill: '#c79bff' })); } },
  // ---- the specials' shapes
  // emb-wings — aviator wings (silver), three feather tiers each side, a gold roundel + star in the middle
  wings: { metal: 'silver', tall: 1.7, body: `M19 20.5 C 13.5 17, 7 16.4, 2 18 C 5.6 19.6, 8.8 20.4, 12 20.8 C 8.4 21.8, 5.8 23, 3.6 24.6 C 8.2 24.9, 12.4 24.5, 15.6 23.7 C 13 25.2, 11.4 26.6, 10.4 28.4 C 14 27.8, 17.2 26.4, 19.4 24.7 Z ${mirrorX('M19 20.5 C 13.5 17, 7 16.4, 2 18 C 5.6 19.6, 8.8 20.4, 12 20.8 C 8.4 21.8, 5.8 23, 3.6 24.6 C 8.2 24.9, 12.4 24.5, 15.6 23.7 C 13 25.2, 11.4 26.6, 10.4 28.4 C 14 27.8, 17.2 26.4, 19.4 24.7 Z')}`,
    lines: 'M12 20.8 L18.6 21.8 M15.6 23.7 L19 23.4 M36 20.8 L29.4 21.8 M32.4 23.7 L29 23.4', tip: [2.4, 18],
    fx(C) { const R = C.layer(); R.g.append(el('path', { d: circ(24, 22.6, 5.6), fill: lin(R.defs, [[0, '#fff1b8'], [0.5, '#e0a63a'], [1, '#8a5a12']]), stroke: '#4a2c04', 'stroke-width': 0.8 }), el('path', { d: star5(24, 22.8, 3.4), fill: '#fff7d6' }));
      dots(C, 've-feather ve-2', [[3.6, 18.2, 0.8, '#fff'], [44.4, 18.2, 0.8, '#fff'], [4.6, 24.6, 0.7, '#fff'], [43.4, 24.6, 0.7, '#fff']], 2.6); } },
  // emb-sunburst — an Art Deco sunburst in gold (the Chrysler's fan), its rays catching the light one after another
  sunburst: (() => { const rays = [], cx = 24, cy = 37; for (let i = 0; i < 9; i++) { const a0 = Math.PI + (i + 0.12) * Math.PI / 9, a1 = Math.PI + (i + 0.88) * Math.PI / 9, R = i % 2 ? 27 : 31; rays.push(`M${cx} ${cy} L${(cx + Math.cos(a0) * R).toFixed(2)} ${(cy + Math.sin(a0) * R).toFixed(2)} L${(cx + Math.cos(a1) * R).toFixed(2)} ${(cy + Math.sin(a1) * R).toFixed(2)} Z`); }
    return { metal: 'gold', body: `${rays.join(' ')} M10 37 A14 14 0 0 1 38 37 Z M4 37 H44 V40.5 H4 Z`, rays, lines: 'M10 37 A14 14 0 0 1 38 37', tip: [24, 6.5],
      fx(C) { rays.forEach((d, i) => C.layer('ve-gray', `--i:${i}`).g.append(el('path', { d, fill: '#fff6d4', opacity: 0.55 }))); } }; })(),
  // emb-ace — the ace of spades: black obsidian glass, a gold edge with light running round it, a deep red glow breathing inside
  spade: { metal: 'obsidian', body: 'M24 5.5 C 30.5 14, 40.5 19, 40.5 27.5 C 40.5 33.6, 34.4 36.6, 29.8 33.4 C 30.6 37.2, 32.2 40.2, 34.2 42.2 H13.8 C 15.8 40.2, 17.4 37.2, 18.2 33.4 C 13.6 36.6, 7.5 33.6, 7.5 27.5 C 7.5 19, 17.5 14, 24 5.5 Z', tip: [24, 6.5], runs: true,
    fx(C) { C.layer('ve-ember2').g.append(el('ellipse', { cx: 24, cy: 26, rx: 9, ry: 7.5, fill: '#ff2a3a', opacity: 0.32 }), el('ellipse', { cx: 24, cy: 25.5, rx: 3.5, ry: 3, fill: '#ff6a5a', opacity: 0.4 })); } },
  // emb-sg-blackbird — THE CITY's BLACKBIRD from above (its plan-form: the long chined fuselage, the delta, the two nacelles + their
  // canted tails): black chrome, its two burners flickering orange behind the nacelles
  sr71: { metal: 'black', body: 'M24 2.5 C 25.4 8, 26.3 13, 27.2 18.2 L31.6 22.2 L32.8 19.8 L34.4 24.4 L43.5 33.4 L43.8 36.2 L34.8 35.2 L34.2 41.4 L31.9 41.4 L31.4 35.8 L26.2 36.2 L25.7 42.2 L22.3 42.2 L21.8 36.2 L16.6 35.8 L16.1 41.4 L13.8 41.4 L13.2 35.2 L4.2 36.2 L4.5 33.4 L13.6 24.4 L15.2 19.8 L16.4 22.2 L20.8 18.2 C 21.7 13, 22.6 8, 24 2.5 Z',
    lines: 'M24 6 V40 M16.4 22.2 L15 35.6 M31.6 22.2 L33 35.6', tip: [24, 3.4],
    fx(C) { [[15, 43.6], [33, 43.6]].forEach(([x, y], i) => { const L = C.layer('ve-burn', `--i:${i};transform-origin:${pct(x)} ${pct(y - 1.5)}`); L.g.append(el('path', { d: `M${x - 1.6} ${y - 1.4} C ${x - 1.2} ${y + 2.5}, ${x} ${y + 4.6}, ${x} ${y + 5.2} C ${x} ${y + 4.6}, ${x + 1.2} ${y + 2.5}, ${x + 1.6} ${y - 1.4} Z`, fill: '#ff8a2a' }), el('circle', { cx: x, cy: y, r: 1, fill: '#fff2c8' })); }); } },
  // emb-sg-f22 — THE CITY's F-22 from above (the diamond wing, the canted tails, the twin nozzles): grey chrome, twin flames with
  // their shock diamonds pulsing
  f22: { metal: 'grey', body: 'M24 3.5 L26.3 11.5 L27.1 16.8 L37.4 24 L37.9 27.6 L28.2 28.2 L29.7 33.6 L34.4 38 L34 40.2 L26.7 38.7 L25.6 41.4 L22.4 41.4 L21.3 38.7 L14 40.2 L13.6 38 L18.3 33.6 L19.8 28.2 L10.1 27.6 L10.6 24 L20.9 16.8 L21.7 11.5 Z',
    lines: 'M24 6 V38 M21 17 L13 25 M27 17 L35 25', tip: [24, 4.4],
    fx(C) { [[22.9, 42.6], [25.1, 42.6]].forEach(([x, y], i) => { const L = C.layer('ve-burn', `--i:${i};transform-origin:${pct(x)} ${pct(y - 1)}`); L.g.append(el('path', { d: `M${x - 1} ${y - 0.8} L${x} ${y + 5} L${x + 1} ${y - 0.8} Z`, fill: '#ffb04a' }), el('circle', { cx: x, cy: y + 1.8, r: 0.6, fill: '#fff' }), el('circle', { cx: x, cy: y + 3.4, r: 0.45, fill: '#fff' })); }); } },
  // emb-sg-ghostship — THE CITY's ghost ship (its high stern, three masts, the torn sails): SPECTRAL — pale green glass you see through,
  // its lanterns flickering, mist drifting along its waterline, the whole ghost breathing
  ghost: { body: 'M5.5 30.5 L9.5 30.5 L9.5 26.8 L14.5 26.8 L14.5 30.5 L38 30.5 L42.5 26.5 L40.2 35.5 Q 24 39.8, 8.6 35.4 Z M12.5 9.5 H19.6 L19 17 L17.4 15.8 L15.8 18 L14 16.4 L12.9 18.2 Z M21.6 6.5 H29.6 L29 15.6 L27.4 14.4 L25.6 16.8 L23.8 14.8 L22 16.6 Z M30.6 11 H36.8 L36.4 18 L35 16.8 L33.4 18.6 L31.8 17 L30.8 18.4 Z',
    lines: 'M16 30.5 V8 M25.5 30.5 V5 M33.6 30.5 V9.5 M9.5 26.8 L16 8 M42.5 26.5 L33.6 9.5', lanterns: [[11.8, 28.4], [40.6, 27.6], [25.5, 21.5]] },
  // emb-sg-aurora — THE CITY's northern lights in a round badge over a mountain line: AURORA — its curtains drifting + breathing, stars
  aurora: { body: circ(24, 24, 18.5), mtn: 'M5.5 34 L13.5 25.8 L18.4 30.6 L25.6 21.2 L33.4 30 L37.6 26.4 L42.5 34 L42.5 37 Q 24 46, 5.5 37 Z',
    ribbons: [['M2 23 C 10 15, 16 27, 24 19 C 32 11, 38 23, 46 15', '#7affc8'], ['M2 27 C 10 21, 17 31, 25 24 C 33 17, 39 27, 46 21', '#5fd7ff'], ['M2 19 C 11 12, 17 22, 26 15 C 34 9, 40 18, 46 12', '#c79bff']] },
  // emb-sg-fireball — THE CITY's fireball breaking up: COMET — a white-green head blazing, its tail streaming back, fragments peeling off
  comet: { body: 'M10.5 38.5 C 7.8 36, 8 31.6, 11.2 29.4 L39.6 6.8 L41.2 8.4 L19 37 C 16.6 40.2, 13.2 41, 10.5 38.5 Z', head: [13.6, 34.4, 5.2], frags: [[24, 20.5], [30.5, 15.5], [20, 27], [35.5, 10.5]] },
  // emb-sg-skull — THE CITY's skull balloon: BALLOON — bone white, its eyes glowing orange, the burner's flame puffing under it
  skullb: { body: 'M24 3.5 C 34 3.5, 40.5 10.5, 40.5 18.8 C 40.5 24.8, 37.2 28.4, 33.2 29.9 L31.6 34 H16.4 L14.8 29.9 C 10.8 28.4, 7.5 24.8, 7.5 18.8 C 7.5 10.5, 14 3.5, 24 3.5 Z', env: 'bone',
    holes: `M13.6 18.6 C 13.6 15.4, 21 15, 21 18.8 C 21 22.2, 13.6 22.6, 13.6 18.6 Z M27 18.8 C 27 15, 34.4 15.4, 34.4 18.6 C 34.4 22.6, 27 22.2, 27 18.8 Z M24 22.6 L22.2 26.2 H25.8 Z`, teeth: 'M18.8 30.4 V33.6 M22 30.8 V34 M26 30.8 V34 M29.2 30.4 V33.6 M16.8 30 H31.2',
    eyes: [[17.3, 18.8], [30.7, 18.8]], ropes: 'M17 34 L19.6 39 M31 34 L28.4 39', basket: 'M19 39 H29 V43.6 H19 Z' },
  // emb-sg-btc — THE CITY's ₿ balloon: BALLOON — orange gores, the ₿ in white, a gold PULSE ringing out once a block, the burner's flame
  btcb: { body: 'M24 3.5 C 34 3.5, 40.5 10.5, 40.5 18.8 C 40.5 26.8, 31.6 30.6, 29.4 34 H18.6 C 16.4 30.6, 7.5 26.8, 7.5 18.8 C 7.5 10.5, 14 3.5, 24 3.5 Z', env: 'orange',
    gores: 'M24 3.6 C 18.5 10, 18.5 26, 21.4 34 M24 3.6 C 29.5 10, 29.5 26, 26.6 34 M24 3.6 C 13.5 9, 12.5 24, 18.6 34 M24 3.6 C 34.5 9, 35.5 24, 29.4 34',
    mark: 'M21 11.6 V26.4 M21 11.6 H25.6 C 28.8 11.6, 28.8 18.4, 25.6 18.4 H21 M25.6 18.4 C 29.6 18.4, 29.6 26.4, 25.6 26.4 H21 M22.8 9.6 V11.6 M25 9.6 V11.6 M22.8 26.4 V28.4 M25 26.4 V28.4',
    ropes: 'M18.8 34 L20.2 39 M29.2 34 L27.8 39', basket: 'M19.6 39 H28.4 V43.6 H19.6 Z' },
  // emb-bitcoin — a struck gold coin, the ₿ embossed on its face; now + then it SPINS (a flip on its edge), a shine + a glint
  coin: { body: circ(24, 24, 17), rim: circ(24, 24, 14.6), mark: 'M20.6 15.4 V32.6 M20.6 15.4 H25.8 C 29.6 15.4, 29.6 23.6, 25.8 23.6 H20.6 M25.8 23.6 C 30.4 23.6, 30.4 32.6, 25.8 32.6 H20.6 M22.6 13 V15.4 M25.2 13 V15.4 M22.6 32.6 V35 M25.2 32.6 V35' },
  // emb-tg — a maple leaf: AUTUMN — amber turning crimson + back, its veins, a small leaf drifting down beside it
  maple: { body: 'M24 4 L26.6 11 L30.2 8.8 L29.2 16 L35.4 11.8 L33.8 18.6 L41.4 18 L36.2 24.2 L38.8 26.4 L31.2 29.2 L32.8 33.4 L25.6 31.2 L25.6 41.6 L22.4 41.6 L22.4 31.2 L15.2 33.4 L16.8 29.2 L9.2 26.4 L11.8 24.2 L6.6 18 L14.2 18.6 L12.6 11.8 L18.8 16 L17.8 8.8 L21.4 11 Z', veins: 'M24 38 V12 M24 28.6 L14.6 20.6 M24 28.6 L33.4 20.6 M24 33 L17.4 29.6 M24 33 L30.6 29.6' },
});

// (the wings: taller feathers — they read at 28 pt)
if (SH.wings.tall) { SH.wings.body = scaleY(SH.wings.body, 22.6, SH.wings.tall); SH.wings.lines = scaleY(SH.wings.lines, 22.6, SH.wings.tall); }
/** the metals' faces (a struck, lit gradient each) + their edge */
const METAL = {
  silver: { s: [[0, '#ffffff'], [0.22, '#dde3ec'], [0.48, '#7d8796'], [0.6, '#eef2f7'], [0.84, '#6a7482'], [1, '#c8d0dc']], edge: '#2a3038', halo: '#dfe8ff', bev: '#ffffff' },
  gold: { s: [[0, '#fff6cf'], [0.28, '#f6cf6a'], [0.5, '#c18a2a'], [0.62, '#f2c45a'], [0.82, '#a8701c'], [1, '#e8b850']], edge: '#6a4208', halo: '#ffcf5a', bev: '#fff3c4' },
  black: { s: [[0, '#2a2e36'], [0.3, '#0c0d11'], [0.46, '#4a515c'], [0.5, '#b8bec8'], [0.55, '#2e333c'], [0.8, '#0a0b0e'], [1, '#1c1f25']], edge: '#c8d0dc', halo: '#c8d2e6', bev: 'rgba(210,218,232,0.5)' },
  grey: { s: [[0, '#d6dde6'], [0.3, '#7b8592'], [0.47, '#b4bdc8'], [0.52, '#f4f7fa'], [0.58, '#7f8996'], [0.85, '#4e5661'], [1, '#a2abb6']], edge: '#262b33', halo: '#e2ecff', bev: '#ffffff' },
  obsidian: { s: [[0, '#2c2232'], [0.38, '#08060c'], [0.52, '#33263e'], [0.58, '#0e0a14'], [1, '#040306']], edge: '#ffcf5a', halo: '#ff3a4a', bev: 'rgba(255,214,140,0.45)' },
};
const lenD = d => lenOf(d);

Object.assign(FIN, {
  // METAL (2B — the wings, the sunburst, the ace, both jets): a struck metal face (its own palette), a dark edge + a bright inner bevel,
  // its detail lines engraved; a shine gliding across (inside the shape) + a glint off its tip; the shape's own accents on their layers
  metal(C, B, art) {
    const S = SH[art.shape], M = METAL[S.metal] || METAL.silver, d = S.body;
    B.g.append(el('path', { d, stroke: M.halo, 'stroke-width': 4.6, opacity: 0.16, class: 've-halo' }),
      el('path', { d, fill: lin(B.defs, M.s, 0, 0, 0.35, 1), stroke: M.edge, 'stroke-width': S.metal === 'obsidian' ? 1.5 : 1.1 }),
      el('path', { d, stroke: M.bev, 'stroke-width': 0.55, opacity: 0.8, transform: 'translate(24 24) scale(0.93) translate(-24 -24)' }));
    if (S.lines) B.g.append(el('path', { d: S.lines, stroke: S.metal === 'black' || S.metal === 'obsidian' ? 'rgba(200,210,230,0.35)' : 'rgba(30,24,16,0.55)', 'stroke-width': 0.7 }));
    slide(C.mask(d), 've-shine', 40, dd => lin(dd, SHEEN(S.metal === 'black' ? 0.55 : 0.8), 0, 0, 1, 0));
    if (S.runs) {
      // (the ace: light running round its gold edge — six runs flashing in turn, as a chasing tube)
      const len = lenD(d);
      for (let i = 0; i < 6; i++) C.layer('ve-run', `--i:${i}`).g.append(el('path', { d, stroke: '#fff4c8', 'stroke-width': 1.8, 'stroke-dasharray': `${(len * 0.12).toFixed(2)} ${len.toFixed(2)}`, 'stroke-dashoffset': (-i * len / 6).toFixed(2) }));
    }
    if (S.fx) S.fx(C);
    if (S.tip) glint(C, S.tip[0], S.tip[1], 3.6, 've-tip');
  },
  // COIN (emb-bitcoin): a struck gold coin + its embossed ₿ on ONE layer that flips on its edge now + then (scaleX — the compositor),
  // a shine across its face, a glint off its rim
  coin(C) {
    const S = SH.coin, F = C.layer('ve-coin', 'transform-origin:50% 50%');
    const au = lin(F.defs, METAL.gold.s, 0, 0, 0.4, 1);
    F.g.append(el('path', { d: S.body, stroke: '#ffcf5a', 'stroke-width': 4.4, opacity: 0.18 }), el('path', { d: S.body, fill: au, stroke: '#6a4208', 'stroke-width': 1.2 }),
      el('path', { d: S.rim, stroke: '#8a5a12', 'stroke-width': 1 }), el('path', { d: S.rim, stroke: '#fff3c4', 'stroke-width': 0.5, transform: 'translate(-0.5 -0.5)' }),
      el('path', { d: S.mark, stroke: '#7a4a0c', 'stroke-width': 2.6, transform: 'translate(0.5 0.6)' }), el('path', { d: S.mark, stroke: '#fff0b8', 'stroke-width': 2.2 }));
    slide(C.mask(S.body), 've-shine', 40, d => lin(d, SHEEN(0.85), 0, 0, 1, 0));
    glint(C, 33, 11.5, 3.4, 've-tip');
  },
  // SPECTRAL (emb-sg-ghostship): pale green glass you can see through, a bright spectral edge, its rigging; its lanterns flickering, the
  // whole ghost breathing, mist drifting along the waterline
  spectral(C, B) {
    const S = SH.ghost;
    B.g.append(el('path', { d: S.body, stroke: '#7affd0', 'stroke-width': 5, opacity: 0.16, class: 've-halo' }));
    const G = C.layer('ve-spec'); G.g.append(el('path', { d: S.body, fill: '#3dffb0', opacity: 0.22 }), el('path', { d: S.body, stroke: '#bfffe6', 'stroke-width': 1 }), el('path', { d: S.lines, stroke: '#9affd8', 'stroke-width': 0.7, opacity: 0.85 }));
    S.lanterns.forEach(([x, y], i) => { const L = C.layer('ve-lant', `--i:${i}`); L.g.append(el('circle', { cx: x, cy: y, r: 2.6, fill: '#c8ff9a', opacity: 0.4 }), el('circle', { cx: x, cy: y, r: 0.95, fill: '#fff' })); });
    for (const i of [0, 1]) C.layer('ve-mist ve-2', `--i:${i}`).g.append(el('ellipse', { cx: 14 + i * 20, cy: 37.5 + i * 1.6, rx: 11, ry: 1.8, fill: '#bfffe6', opacity: 0.28 }));
  },
  // AURORA (emb-sg-aurora): a round badge of night sky; the curtains drifting through it (each its own layer, inside the badge's mask),
  // the mountains dark in front, stars, the badge's pale rim
  aurora(C, B) {
    const S = SH.aurora;
    B.g.append(el('path', { d: S.body, stroke: '#7affc8', 'stroke-width': 4.4, opacity: 0.16, class: 've-halo' }), el('path', { d: S.body, fill: rad(B.defs, [[0, '#0e2a3a'], [1, '#04080f']], 0.5, 0.35, 0.7) }));
    const M = C.mask(S.body);
    S.ribbons.forEach(([d, col], i) => { const L = M.layer(`ve-rib${i === 2 ? ' ve-2' : ''}`, `--i:${i};left:-12%;width:124%`); L.g.append(el('path', { d, stroke: col, 'stroke-width': 4.2, opacity: 0.32 }), el('path', { d, stroke: col, 'stroke-width': 1.5, opacity: 0.9 })); });
    const T = M.layer('ve-stars ve-2'); [[15, 11], [31, 9], [37, 18], [10, 18]].forEach(([x, y]) => T.g.append(el('circle', { cx: x, cy: y, r: 0.55, fill: '#fff' })));
    const F = C.layer(); F.g.append(el('path', { d: S.mtn, fill: '#04070c' }), el('path', { d: 'M5.5 34 L13.5 25.8 L18.4 30.6 L25.6 21.2 L33.4 30 L37.6 26.4 L42.5 34', stroke: 'rgba(160,255,210,0.45)', 'stroke-width': 0.6 }), el('path', { d: S.body, stroke: '#d8fff0', 'stroke-width': 1 }));
  },
  // COMET (emb-sg-fireball): the tail streaming back (white-hot into green into nothing), the head BLAZING (its own layer), fragments
  // peeling off the tail one after another
  comet(C, B) {
    const S = SH.comet;
    B.g.append(el('path', { d: S.body, fill: lin(B.defs, [[0, '#ffffff'], [0.25, '#c8ffd8'], [0.6, '#5aff9a', 0.55], [1, '#2aff8a', 0]], 0.2, 0.85, 0.85, 0.12) }));
    const H = C.layer('ve-head', `transform-origin:${pct(S.head[0])} ${pct(S.head[1])}`); H.g.append(el('circle', { cx: S.head[0], cy: S.head[1], r: S.head[2] * 1.7, fill: '#7affb0', opacity: 0.3 }), el('circle', { cx: S.head[0], cy: S.head[1], r: S.head[2], fill: '#eafff2' }), el('circle', { cx: S.head[0] - 1, cy: S.head[1] - 1, r: S.head[2] * 0.5, fill: '#fff' }));
    S.frags.forEach(([x, y], i) => C.layer(`ve-frag${i > 1 ? ' ve-2' : ''}`, `--i:${i}`).g.append(el('circle', { cx: x, cy: y, r: 1.3, fill: '#d8ffe6' }), el('circle', { cx: x, cy: y, r: 2.6, fill: '#7affb0', opacity: 0.35 })));
  },
  // BALLOON (the two sighting balloons): the envelope lit from the left (bone white · ₿ orange), its gores / its features, the ropes + the
  // wicker basket; the BURNER's flame puffing between them; the skull's eyes glowing orange · the ₿'s gold pulse ringing out once a block
  balloon(C, B, art) {
    const S = SH[art.shape], bone = S.env === 'bone';
    const fill = lin(B.defs, bone ? [[0, '#fffaf0'], [0.45, '#e8dfcc'], [1, '#9a907e']] : [[0, '#ffc46a'], [0.45, '#f7931a'], [1, '#a85a08']], 0, 0, 1, 0.6);
    B.g.append(el('path', { d: S.body, stroke: bone ? '#fff4dc' : '#ffb347', 'stroke-width': 4.4, opacity: 0.16, class: 've-halo' }),
      el('path', { d: S.ropes, stroke: '#c8b08a', 'stroke-width': 0.8 }),
      el('path', { d: S.basket, fill: '#8a5a2a', stroke: '#4a2a0e', 'stroke-width': 0.8 }), el('path', { d: 'M19.4 41 H28.6', stroke: '#c8925a', 'stroke-width': 0.6 }),
      el('path', { d: S.body, fill, stroke: bone ? '#5a5244' : '#6a3a04', 'stroke-width': 1 }));
    if (bone) B.g.append(el('path', { d: S.holes, fill: '#120c08' }), el('path', { d: S.teeth, stroke: '#5a5244', 'stroke-width': 0.8 }));
    else B.g.append(el('path', { d: S.gores, stroke: 'rgba(110,50,0,0.45)', 'stroke-width': 0.7 }), el('path', { d: S.mark, stroke: '#7a3a00', 'stroke-width': 2.4, transform: 'translate(0.4 0.5)' }), el('path', { d: S.mark, stroke: '#fff8ec', 'stroke-width': 2 }));
    slide(C.mask(S.body), 've-shine ve-2', 40, d => lin(d, SHEEN(0.5), 0, 0, 1, 0));
    if (bone) S.eyes.forEach(([x, y], i) => C.layer('ve-eyeglow', `--i:${i}`).g.append(el('ellipse', { cx: x, cy: y, rx: 2.6, ry: 2.2, fill: '#ff8a1a', opacity: 0.85 }), el('circle', { cx: x, cy: y, r: 0.95, fill: '#fff2c8' })));
    else C.layer('ve-pulse', 'transform-origin:50% 38%').g.append(el('path', { d: S.body, stroke: '#ffd27a', 'stroke-width': 1.2 }));
    const F = C.layer('ve-burn', `transform-origin:${pct(24)} ${pct(35)}`); F.g.append(el('path', { d: 'M22.6 38.6 C 22.6 36.6, 23.6 35.4, 24 34.6 C 24.4 35.4, 25.4 36.6, 25.4 38.6 Z', fill: '#ffb030' }), el('circle', { cx: 24, cy: 37.8, r: 0.8, fill: '#fff4c8' }));
  },
  // AUTUMN (emb-tg): the maple leaf in amber, a crimson layer warming over it + cooling back, its veins; a small leaf drifting down
  autumn(C, B) {
    const S = SH.maple;
    B.g.append(el('path', { d: S.body, stroke: '#ffb04a', 'stroke-width': 4.4, opacity: 0.16, class: 've-halo' }), el('path', { d: S.body, fill: lin(B.defs, [[0, '#ffd27a'], [0.55, '#f0961e'], [1, '#c4580c']]), stroke: '#6a2a04', 'stroke-width': 1 }));
    const Rd = C.layer('ve-red'); Rd.g.append(el('path', { d: S.body, fill: lin(Rd.defs, [[0, '#ff6a3a'], [1, '#a8140c']]) }));
    const V = C.layer(); V.g.append(el('path', { d: S.veins, stroke: 'rgba(90,24,0,0.7)', 'stroke-width': 0.8 }), el('path', { d: S.body, stroke: '#ffe2a8', 'stroke-width': 0.5, transform: 'translate(24 24) scale(0.92) translate(-24 -24)', opacity: 0.6 }));
    C.layer('ve-fall ve-2').g.append(el('path', { d: 'M40 8 L41.2 10.4 L43.6 10 L42.4 12.2 L44 14 L41.6 14 L41 16.4 L39.8 14.2 L37.6 14.6 L38.8 12.4 L37.2 10.6 L39.6 10.6 Z', fill: '#ff8a2a' }));
  },
});

/** the 12 sign-up shapes as NEON (the frame + the icon, two tubes in the player's colour, the dark glass behind) */
function avatarTubes(C, B, avatarId, hex, o) {
  const id = AVATARS[avatarId] ? avatarId : 'bolt', [frame, cx, cy, is] = FRAMES[id] || FRAMES.bolt, k = is / 24;
  B.g.append(el('path', { d: frame, fill: rad(B.defs, [[0, hex, 0.42], [0.55, '#0c1030', 0.9], [1, '#03040c', 0.96]], 0.5, 0.3, 0.8), transform: 'translate(24 24) scale(0.94) translate(-24 -24)' }));
  neon(C, [
    { d: frame, col: hex, len: lenOf(frame) },
    { d: AVATARS[id], col: hex, k, tf: `translate(${(cx - is / 2).toFixed(2)} ${(cy - is / 2).toFixed(2)}) scale(${k.toFixed(3)})`, noChase: true },
  ], { ...o, T: 2.2 }, B);
}

/**
 * THE EMBLEM — o = { id (an emblem with art) | avatar + color (the sign-up shape, neon in the player's colour), tube (a TUBE STYLE item id —
 * NEON only), mode ('lead' | 'even' | 'quiet'), size (px: also `is-28` at ≤ 30) } → <span class="ve ve-f-<finish> ve-t-<style> is-<mode>">
 * (its layers inside)
 */
export function emblemEl(o = {}) {
  const art = EMBLEM_ART[o.id], finish = art ? art.finish : 'neon', style = finish === 'neon' ? TUBE_STYLES[o.tube] || null : null, mode = o.mode || 'even';
  const box = document.createElement('span');
  box.className = `ve ve-f-${finish}${style ? ` ve-t-${style}` : ''} is-${mode}`;
  box.setAttribute('aria-hidden', 'true'); box.dataset.emb = o.id || o.avatar || 'bolt';
  const C = ctx(box), B = C.layer('ve-base');
  // (THE VAULT 2B: a neon shape may carry its OWN accents — { tubes, fx(C) }: gems twinkling, a spark, a flap — on layers of their own,
  //  the tube style still on its tubes)
  if (art && finish === 'neon') {
    const S = SH[art.shape]; neon(C, S.tubes || S, { tube: style }, B);
    if (S.group) { const G = C.group(S.group.cls, 'transform-origin:50% 50%'); neon(G, S.group.tubes, { tube: style }, G.layer('ve-base')); }
    if (S.fx) S.fx(C, mode);
  } else if (art) FIN[finish](C, B, art);
  else avatarTubes(C, B, o.avatar, colorHex(o.color || 'magenta'), { tube: style });
  if (o.size) { box.style.width = `${o.size}px`; box.style.height = `${o.size}px`; if (o.size <= 30) box.classList.add('is-28'); }
  return box;
}
