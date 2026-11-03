// THE VAULT 2A — THE EMBLEM SYSTEM: AN EMBLEM = A SHAPE + A FINISH (the owner, Nov 2 10:20 pm + Nov 3 7:46 am; emblem-finishes.png — "one
// shape, eight finishes"). Every emblem is ONE inline SVG (no canvas: crisp at the phone's full 3×, nothing on the shared effect surface),
// its motion CSS on transform + opacity only (css/vault.css .ve-*), still under reduced motion. THE 28-PT RULE: every shape reads at 28 pt
// on a lobby strip — bold silhouettes, one or two tubes, one bright accent; the effects TOUCH or SURROUND the shape (frost on the arms,
// embers off it, its own lights, a glint) — never fill over it.
//   NEON — the house style (the commons): the sign's own tube stack (ui/logo.js + ui/tube-logo.js — glass → wide glow → near glow →
//          body → white-hot core → a highlight), the glows as wide soft strokes (no blur filter: an animated SVG with a filter repaints it).
//          TODAY'S 12 EMBLEMS (the sign-up shapes, config.js AVATARS + ui/components.js FRAMES) are commons on this renderer, in the
//          player's colour. TUBE STYLES (separate unlocks, worn on ANY neon emblem — mix + match): two-tone · breathing · a chasing light
//          (2A) · gold tube · old sign · slow burn · on the beat (2B).
//   PRISM · CHROME · GOLD · ICE CRYSTAL · MOLTEN · GLITCH · GALAXY — the rarer finishes, each tied to its own emblem.
// THE PROMINENCE RULE (emblems.js#prominence): mode 'lead' (a still card: the full motion) · 'even' · 'quiet' (a legendary card: calmer).
//   emblemEl({ id, avatar, color, tube, mode, size }) → <svg class="ve …">   (id: an emblem item id with art — else the avatar shape)
import { AVATARS, colorHex } from '../config.js';
import { FRAMES } from '../ui/components.js';
import { flattenPath } from '../core/tube-path.js';

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
});
export const FINISHES = Object.freeze(['neon', 'prism', 'chrome', 'gold', 'ice', 'molten', 'glitch', 'galaxy']);
/** the tube styles with a look (2A); the others wear as a plain tube until 2B builds theirs */
export const TUBE_STYLES = Object.freeze({ 'tube-twotone': 'twotone', 'tube-breath': 'breath', 'tube-chase': 'chase' });
export const hasArt = id => !!(id && EMBLEM_ART[id]);
export const finishOf = id => (EMBLEM_ART[id] || { finish: 'neon' }).finish;
/** a tube style shows on NEON emblems only (a special finish keeps its own light) */
export const tubeApplies = id => !id || !EMBLEM_ART[id] || EMBLEM_ART[id].finish === 'neon';

// ---------------------------------------------------------------- NEON (the sign's tube stack)
const lenOf = d => flattenPath(d, 1, 0, 0, 1).reduce((a, p) => a + p.pts.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p.pts[i - 1][0], q[1] - p.pts[i - 1][1]) : 0), 0), 0);
/** one tube: { d, col, thin?, tf? (a transform), k (its scale: widths ÷ k) } + the style's paint (two-tone gradients) → <g> */
function tube(t, T, st) {
  const k = t.k || 1, w = (t.thin ? T * 0.55 : T) / k, g = el('g', { class: 've-tube', transform: t.tf });
  const body = st.grad ? `url(#${st.grad}b)` : shade(t.col, 0.16), glowC = st.grad ? `url(#${st.grad}b)` : t.col, core = st.grad ? `url(#${st.grad}c)` : shade(t.col, 0.84);
  g.append(
    el('path', { d: t.d, class: 've-glass', stroke: shade(t.col, -0.74), 'stroke-width': (w + 1.1 / k).toFixed(2) }),
    el('path', { d: t.d, class: 've-g2', stroke: glowC, 'stroke-width': (w * 3.4).toFixed(2) }),
    el('path', { d: t.d, class: 've-g1', stroke: glowC, 'stroke-width': (w * 1.9).toFixed(2) }),
    el('path', { d: t.d, class: 've-body', stroke: body, 'stroke-width': w.toFixed(2) }),
    el('path', { d: t.d, class: 've-core', stroke: core, 'stroke-width': (w * 0.36).toFixed(2) }),
    el('path', { d: t.d, class: 've-hi', stroke: '#fff', 'stroke-width': (0.42 / k).toFixed(2), transform: `translate(${(-0.45 / k).toFixed(2)} ${(-0.45 / k).toFixed(2)})` }));
  // A CHASING LIGHT: the tube's white-hot core in eight short runs, each flashing in turn → a light running the glass (opacity only)
  if (st.chase && !t.noChase) {
    const L = t.len || lenOf(t.d), N = 8;
    for (let i = 0; i < N; i++) g.append(el('path', { d: t.d, class: 've-ch', stroke: '#fff', 'stroke-width': (w * 1.15).toFixed(2), 'stroke-dasharray': `${(L * 0.14).toFixed(2)} ${L.toFixed(2)}`, 'stroke-dashoffset': (-i * L / N).toFixed(2), style: `--i:${i}` }));
  }
  return g;
}
function neon(svg, defs, tubes, o) {
  const st = { chase: o.tube === 'chase' };
  if (o.tube === 'twotone') {
    const n = `ve${++uid}`, A = tubes[0].col, B = partner(A);
    const lg = (id, k) => { const g = el('linearGradient', { id, gradientUnits: 'userSpaceOnUse', x1: 8, y1: 8, x2: 40, y2: 40 }); for (const [o2, c] of [[0, A], [0.47, A], [0.53, B], [1, B]]) g.append(el('stop', { offset: o2, 'stop-color': k ? shade(c, k) : c })); return g; };
    defs.append(lg(`${n}b`, 0.16), lg(`${n}c`, 0.84)); st.grad = n;
  }
  for (const t of tubes) svg.append(tube(t, o.T || 2.6, st));
}

// ---------------------------------------------------------------- THE FINISHES
const clipOf = (defs, d) => { const id = `vec${++uid}`, cp = el('clipPath', { id }); cp.append(el('path', { d })); defs.append(cp); return `url(#${id})`; };
const lin = (defs, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units) => { const id = `veg${++uid}`, g = el('linearGradient', { id, x1, y1, x2, y2, gradientUnits: units }); for (const [o, c, a] of stops) g.append(el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a })); defs.append(g); return `url(#${id})`; };
const rad = (defs, stops, cx = 0.5, cy = 0.5, r = 0.5) => { const id = `ver${++uid}`, g = el('radialGradient', { id, cx, cy, r }); for (const [o, c, a] of stops) g.append(el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a == null ? 1 : a })); defs.append(g); return `url(#${id})`; };
const glintStar = (x, y, s, cls = 've-glint') => el('path', { class: cls, d: `M${x} ${y - s} L${x + s * 0.18} ${y - s * 0.18} L${x + s} ${y} L${x + s * 0.18} ${y + s * 0.18} L${x} ${y + s} L${x - s * 0.18} ${y + s * 0.18} L${x - s} ${y} L${x - s * 0.18} ${y - s * 0.18} Z`, fill: '#fff' });
const RAINBOW = ['#ff5f8f', '#ffb34d', '#fff27a', '#6dffa8', '#5fd7ff', '#8f7dff', '#ff6fe0'];

const FIN = {
  // PRISM — a rainbow sweeping through the glass, a white edge, a sheen, a glint; the white beam in + the four lines out (emb-prism)
  prism(svg, defs) {
    const S = SH.prism, cp = clipOf(defs, S.body);
    const rb = lin(defs, [...RAINBOW, ...RAINBOW, RAINBOW[0]].map((c, i, a) => [(i / (a.length - 1)).toFixed(4), c]), 0, 0, 1, 0.35);
    const sh = lin(defs, [[0, '#fff', 0], [0.45, '#fff', 0], [0.5, '#fff', 0.85], [0.55, '#fff', 0], [1, '#fff', 0]], 0, 0, 1, 0);
    svg.append(el('path', { d: S.beam, class: 've-beam', stroke: '#fff', 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
      el('path', { d: S.body, class: 've-halo', stroke: '#fff', 'stroke-width': 5, fill: 'none' }));
    const g = el('g', { 'clip-path': cp });
    g.append(el('rect', { x: 0, y: -8, width: 128, height: 64, fill: rb, class: 've-sweep' }), el('rect', { x: -48, y: -8, width: 48, height: 64, fill: sh, class: 've-sheen' }));
    svg.append(g, el('path', { d: S.body, fill: 'none', stroke: '#fff', 'stroke-width': 1.4, 'stroke-linejoin': 'round', class: 've-edge' }));
    S.fan.forEach(([d, c], i) => { svg.append(el('path', { d, stroke: c, 'stroke-width': 3.4, opacity: 0.25, 'stroke-linecap': 'round', class: 've-ray-g' }), el('path', { d, stroke: c, 'stroke-width': 1.6, 'stroke-linecap': 'round', class: 've-ray', style: `--i:${i}` })); });
    svg.append(glintStar(24, 9.5, 4.2));
  },
  // GOLD — solid gold (emb-house's crown): a struck metal gradient, a dark edge + a bright inner bevel, its gems, a slow shine + a glint
  gold(svg, defs) {
    const S = SH.crown, cp = clipOf(defs, `${S.body} ${S.base}`);
    const au = lin(defs, [[0, '#fff6cf'], [0.28, '#f6cf6a'], [0.5, '#c18a2a'], [0.62, '#f2c45a'], [0.82, '#a8701c'], [1, '#e8b850']]);
    const sh = lin(defs, [[0, '#fff', 0], [0.42, '#fff', 0], [0.5, '#fff', 0.9], [0.58, '#fff', 0], [1, '#fff', 0]], 0, 0, 1, 0);
    svg.append(el('path', { d: `${S.body} ${S.base}`, fill: 'none', stroke: '#ffcf5a', 'stroke-width': 5, class: 've-halo' }),
      el('path', { d: `${S.body} ${S.base}`, fill: au, stroke: '#6a4208', 'stroke-width': 1.3, 'stroke-linejoin': 'round' }),
      el('path', { d: S.body, fill: 'none', stroke: '#fff3c4', 'stroke-width': 0.7, 'stroke-linejoin': 'round', transform: 'translate(24 23) scale(0.86) translate(-24 -23)', opacity: 0.85 }));
    for (const [x, y, r, c] of S.gems) svg.append(el('circle', { cx: x, cy: y, r, fill: c, stroke: '#4a2a04', 'stroke-width': 0.6 }), el('circle', { cx: x - r * 0.32, cy: y - r * 0.35, r: r * 0.32, fill: '#fff', opacity: 0.85 }));
    const g = el('g', { 'clip-path': cp }); g.append(el('rect', { x: -40, y: 0, width: 40, height: 48, fill: sh, class: 've-shine' })); svg.append(g);
    S.tips.forEach(([x, y], i) => svg.append(glintStar(x, y, 3.6, `ve-glint ve-tip ve-tip${i}`)));
  },
  // ICE CRYSTAL — cut ice (emb-snowflake): pale crystal arms + a white core, FROST growing at each tip in turn, a glint running round
  ice(svg, defs) {
    const S = SH.snowflake, ice = lin(defs, [[0, '#ffffff'], [0.5, '#bfeaff'], [1, '#7fc8f0']]);
    svg.append(el('path', { d: S.arms, stroke: '#7fd4ff', 'stroke-width': 6.5, opacity: 0.18, 'stroke-linecap': 'round', class: 've-halo' }),
      el('path', { d: S.arms, stroke: '#2d6f96', 'stroke-width': 4.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      el('path', { d: S.arms, stroke: ice, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      el('path', { d: S.arms, stroke: '#fff', 'stroke-width': 0.8, 'stroke-linecap': 'round', opacity: 0.95 }),
      el('path', { d: S.hex, fill: ice, stroke: '#2d6f96', 'stroke-width': 0.8 }));
    // the frost: a small crystal at each tip (three little spikes), growing out in turn (scale from the tip)
    S.tips.forEach(([x, y, a], i) => {
      const f = el('g', { class: 've-frost', style: `--i:${i};transform-origin:${x.toFixed(2)}px ${y.toFixed(2)}px` });
      for (const da of [-0.7, 0, 0.7]) { const b = a + da; f.append(el('path', { d: `M${x.toFixed(2)} ${y.toFixed(2)} L${(x + Math.cos(b) * 3.4).toFixed(2)} ${(y + Math.sin(b) * 3.4).toFixed(2)}`, stroke: '#eafaff', 'stroke-width': 0.9, 'stroke-linecap': 'round' })); }
      const gs = glintStar(x, y, 3.2, 've-glint ve-tip'); gs.setAttribute('style', `--i:${i}`); svg.append(f, gs);
    });
  },
  // MOLTEN — emb-torch's flame as lava: a black crust, glowing cracks pulsing, the hot core breathing, heat dripping off the foot, embers rising
  molten(svg, defs) {
    const S = SH.flame, crust = lin(defs, [[0, '#3a1206'], [0.6, '#24090a'], [1, '#120404']]);
    const hot = lin(defs, [[0, '#ffe9a0'], [0.5, '#ffb030'], [1, '#ff5a10']]);
    svg.append(el('path', { d: S.outer, fill: 'none', stroke: '#ff5a14', 'stroke-width': 5.5, opacity: 0.22, class: 've-halo' }),
      el('path', { d: S.outer, fill: crust, stroke: '#ff6a1a', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }),
      el('path', { d: S.cracks, stroke: '#ff8a2a', 'stroke-width': 1.1, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 've-crack' }),
      el('path', { d: S.cracks, stroke: '#ffe08a', 'stroke-width': 0.45, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 've-crack ve-crack2' }),
      el('path', { d: S.inner, fill: hot, class: 've-core-h' }),
      el('path', { d: S.inner, fill: 'none', stroke: '#fff4c8', 'stroke-width': 0.6 }));
    svg.append(el('ellipse', { cx: 24, cy: 44.2, rx: 1.2, ry: 1.6, fill: '#ffb030', class: 've-drip' }));
    [[8.5, 30, 0], [39.5, 25, 1], [33.5, 9, 2], [14, 14, 3]].forEach(([x, y, i]) => svg.append(el('circle', { cx: x, cy: y, r: 0.9, fill: '#ffc060', class: 've-ember', style: `--i:${i}` })));
  },
  // GLITCH — emb-lightning's bolt: white + its red / cyan ghosts, now + then it jumps, splits into slices + snaps back
  glitch(svg, defs) {
    const d = SH.bolt.body;
    svg.append(el('path', { d, fill: '#0a0a14', stroke: '#ff2e6a', 'stroke-width': 1.6, 'stroke-linejoin': 'round', class: 've-gr' }),
      el('path', { d, fill: 'none', stroke: '#2ef0ff', 'stroke-width': 1.6, 'stroke-linejoin': 'round', class: 've-gc' }),
      el('path', { d, fill: '#14141e', stroke: '#fff', 'stroke-width': 1.6, 'stroke-linejoin': 'round', class: 've-gw' }));
    // two slices of the bolt that tear sideways for a frame (their own clips: horizontal bands)
    for (const [y, h, i] of [[17, 4.5, 0], [30, 3.5, 1]]) {
      const id = `vec${++uid}`, cp = el('clipPath', { id }); cp.append(el('rect', { x: 0, y, width: 48, height: h })); defs.append(cp);
      const g = el('g', { 'clip-path': `url(#${id})` }), s = el('g', { class: `ve-slice ve-sl${i}` });
      s.append(el('rect', { x: 0, y, width: 48, height: h, fill: '#05050a' }), el('path', { d, fill: '#14141e', stroke: i ? '#2ef0ff' : '#ff2e6a', 'stroke-width': 1.6 }));
      g.append(s); svg.append(g);
    }
  },
  // CHROME — emb-sg-tr3b's black-chrome hull (the real TR-3B): mirror bands, the inset panel line, the hub; a light gliding across; its
  // WHITE corner lights pulsing in turn + the RED centre's heavy pulse (the city's light layout — never red corners)
  chrome(svg, defs) {
    const S = SH.tr3b, cp = clipOf(defs, S.hull);
    const cr = lin(defs, [[0, '#2a2e36'], [0.3, '#0c0d11'], [0.46, '#5a616c'], [0.5, '#c9ced6'], [0.55, '#3a3f48'], [0.8, '#0a0b0e'], [1, '#1c1f25']], 0, 0, 0.3, 1);
    const sh = lin(defs, [[0, '#fff', 0], [0.44, '#fff', 0], [0.5, '#fff', 0.55], [0.56, '#fff', 0], [1, '#fff', 0]], 0, 0, 1, 0);
    svg.append(el('path', { d: S.hull, fill: 'none', stroke: '#c8d2e6', 'stroke-width': 4.5, opacity: 0.12, class: 've-halo' }),
      el('path', { d: S.hull, fill: cr, stroke: '#d8dee8', 'stroke-width': 1.1, 'stroke-linejoin': 'round' }),
      el('path', { d: S.inset, fill: 'none', stroke: 'rgba(200,210,230,0.32)', 'stroke-width': 0.6 }),
      el('circle', { cx: S.hub[0], cy: S.hub[1], r: S.hubR, fill: '#08090c', stroke: 'rgba(210,218,232,0.55)', 'stroke-width': 0.6 }));
    const g = el('g', { 'clip-path': cp }); g.append(el('rect', { x: -40, y: 0, width: 40, height: 48, fill: sh, class: 've-shine' })); svg.append(g);
    S.pods.forEach(([x, y], i) => svg.append(el('circle', { cx: x, cy: y, r: 4.2, fill: '#dfe8ff', opacity: 0.25, class: 've-pod-g', style: `--i:${i}` }), el('circle', { cx: x, cy: y, r: 1.9, fill: '#fff', class: 've-pod', style: `--i:${i}` })));
    svg.append(el('circle', { cx: S.hub[0], cy: S.hub[1], r: 5.8, fill: '#ff2a14', opacity: 0.3, class: 've-red-g' }), el('circle', { cx: S.hub[0], cy: S.hub[1], r: 2.2, fill: '#ff4a2a', class: 've-red' }), el('circle', { cx: S.hub[0] - 0.5, cy: S.hub[1] - 0.5, r: 0.7, fill: '#ffd6c8' }));
  },
  // GALAXY — emb-sg-ufo's saucer filled with deep space: a nebula drifting through it, stars twinkling inside; a pale rim, its
  // ports chasing round the rim, the beam's three rays pulsing below it
  galaxy(svg, defs) {
    const S = SH.saucer, cp = clipOf(defs, S.body);
    // (two identical cycles across the 96-wide band: it slides one cycle + loops without a seam)
    const cyc = [['#2a0f5e'], ['#8a2ab0'], ['#2c3fb8'], ['#d0449c'], ['#3a1a7a'], ['#2a6ad0']];
    const neb = lin(defs, [...cyc, ...cyc, cyc[0]].map(([c], i, a) => [(i / (a.length - 1)).toFixed(4), c]), 0, 0, 1, 0);
    const deep = rad(defs, [[0, '#2a1458'], [1, '#080414']]);
    S.beam.forEach((d, i) => svg.append(el('path', { d, stroke: '#9affd2', 'stroke-width': 1.2, 'stroke-linecap': 'round', class: 've-beamr', style: `--i:${i}` })));
    svg.append(el('path', { d: S.body, fill: 'none', stroke: '#c7a6ff', 'stroke-width': 5, opacity: 0.18, class: 've-halo' }),
      el('path', { d: S.body, fill: deep }));
    const g = el('g', { 'clip-path': cp });
    g.append(el('rect', { x: 0, y: 10, width: 96, height: 24, fill: neb, opacity: 0.85, class: 've-neb' }));
    const stars = el('g', { class: 've-stars' });
    [[9, 26], [14, 24.5], [20, 18], [27, 16.6], [30, 24], [36, 25], [41, 26.5], [23, 26], [17.5, 27.5], [33, 19.5]].forEach(([x, y], i) => stars.append(el('circle', { cx: x, cy: y, r: i % 3 ? 0.45 : 0.75, fill: '#fff', class: 've-star', style: `--i:${i}` })));
    g.append(stars); svg.append(g);
    svg.append(el('path', { d: S.body, fill: 'none', stroke: '#e6d8ff', 'stroke-width': 1.1, 'stroke-linejoin': 'round' }),
      el('path', { d: S.rim, fill: 'none', stroke: 'rgba(230,216,255,0.6)', 'stroke-width': 0.6 }),
      el('path', { d: S.dome, fill: 'none', stroke: 'rgba(230,216,255,0.5)', 'stroke-width': 0.5 }));
    S.ports.forEach(([x, y], i) => svg.append(el('circle', { cx: x, cy: y, r: 1.15, fill: '#9affd2', class: 've-port', style: `--i:${i}` })));
  },
};

/** the 12 sign-up shapes as NEON (the frame + the icon, two tubes in the player's colour, the dark glass behind) */
function avatarTubes(svg, defs, avatarId, hex, o) {
  const id = AVATARS[avatarId] ? avatarId : 'bolt', [frame, cx, cy, is] = FRAMES[id] || FRAMES.bolt, k = is / 24;
  const glass = rad(defs, [[0, hex, 0.42], [0.55, '#0c1030', 0.9], [1, '#03040c', 0.96]], 0.5, 0.3, 0.8);
  svg.append(el('path', { d: frame, fill: glass, transform: 'translate(24 24) scale(0.94) translate(-24 -24)' }));
  neon(svg, defs, [
    { d: frame, col: hex, len: lenOf(frame) },
    { d: AVATARS[id], col: hex, k, tf: `translate(${(cx - is / 2).toFixed(2)} ${(cy - is / 2).toFixed(2)}) scale(${k.toFixed(3)})`, noChase: true },
  ], { ...o, T: 2.2 });
}

/**
 * THE EMBLEM — o = { id (an emblem with art) | avatar + color (the sign-up shape, neon in the player's colour), tube (a TUBE STYLE item id —
 * NEON only), mode ('lead' | 'even' | 'quiet'), size (px: also `is-28` at 28) } → <svg class="ve ve-f-<finish> ve-t-<style> is-<mode>">
 */
export function emblemEl(o = {}) {
  const art = EMBLEM_ART[o.id], finish = art ? art.finish : 'neon', style = finish === 'neon' ? TUBE_STYLES[o.tube] || null : null, mode = o.mode || 'even';
  const svg = el('svg', { viewBox: '-2 -2 52 52', class: `ve ve-f-${finish}${style ? ` ve-t-${style}` : ''} is-${mode}`, 'aria-hidden': 'true', 'data-emb': o.id || o.avatar || 'bolt' });
  const defs = el('defs'); svg.append(defs);
  const g = el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  if (art && finish === 'neon') neon(g, defs, SH[art.shape], { tube: style });
  else if (art) FIN[finish](g, defs);
  else avatarTubes(g, defs, o.avatar, colorHex(o.color || 'magenta'), { tube: style });
  svg.append(g);
  if (o.size) { svg.setAttribute('width', String(o.size)); svg.setAttribute('height', String(o.size)); if (o.size <= 30) svg.classList.add('is-28'); }
  return svg;
}
