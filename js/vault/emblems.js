// THE VAULT 1A — THE TWO TEST EMBLEMS (VAULT 2 builds the rest: an emblem = a SHAPE + a FINISH — emblem-finishes.png): one shape (the
// bolt) in two finishes — NEON (the house style, a common: the tube, its glow, an ignition flicker) and PRISM (a rare: a rainbow sweeping
// through the shape, a white edge, a glint). Inline SVG, motion by CSS on transform + opacity only (css/vault.css), so they cost no
// canvas. THE PROMINENCE RULE (the owner, Nov 2 10:20 pm): the higher tier on a strip LEADS — prominence(cardTier, emblemTier) →
// 'lead' (the emblem gets the full motion + the spotlight: a still common card) · 'even' · 'quiet' (a busy legendary: the emblem calms).
import { TIERS } from '../core/items.js';

export const BOLT = 'M28.5 3.5 L9.5 27.5 H22.5 L17.5 44.5 L38.5 18.5 H25.5 Z';
export const TEST_EMBLEMS = Object.freeze({
  'emb-test-neon': { id: 'emb-test-neon', name: 'BOLT · NEON', tier: 'common', finish: 'neon' },
  'emb-test-prism': { id: 'emb-test-prism', name: 'BOLT · PRISM', tier: 'rare', finish: 'prism' },
});
const rank = t => Math.max(0, TIERS.indexOf(t));
/** THE PROMINENCE RULE: the higher tier leads */
export function prominence(cardTier, embTier) {
  const d = rank(embTier) - rank(cardTier);
  return d > 0 ? 'lead' : d <= -2 ? 'quiet' : 'even';
}

let uid = 0;
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };

/** an emblem element: finish 'neon' | 'prism', mode 'lead' | 'even' | 'quiet' */
export function emblemSvg(finish, mode = 'even', o = {}) {
  const svg = el('svg', { viewBox: '0 0 48 48', class: `vl-e vl-e-${finish} is-${mode}`, 'aria-hidden': 'true' });
  if (finish === 'prism') {
    const n = ++uid, defs = el('defs');
    const cp = el('clipPath', { id: `vlb${n}` }); cp.append(el('path', { d: BOLT }));
    const g = el('linearGradient', { id: `vlg${n}`, x1: '0', y1: '0', x2: '1', y2: '0.35' });
    const C = ['#ff5f8f', '#ffb34d', '#fff27a', '#6dffa8', '#5fd7ff', '#8f7dff', '#ff6fe0'];
    // (the stops twice over the rect's width: it slides one period and loops without a seam)
    [...C, ...C, C[0]].forEach((c, i, a) => g.append(el('stop', { offset: (i / (a.length - 1)).toFixed(4), 'stop-color': c })));
    const sh = el('linearGradient', { id: `vls${n}`, x1: '0', y1: '0', x2: '1', y2: '0' });
    for (const [o2, a] of [[0, 0], [0.45, 0], [0.5, 0.85], [0.55, 0], [1, 0]]) sh.append(el('stop', { offset: String(o2), 'stop-color': '#fff', 'stop-opacity': String(a) }));
    defs.append(cp, g, sh);
    svg.append(defs,
      el('path', { d: BOLT, class: 'p-halo' }),
      Object.assign(el('g', { 'clip-path': `url(#vlb${n})` }), {}),
      el('path', { d: BOLT, class: 'p-edge' }),
      el('path', { d: 'M24 2 L25 6 L29 7 L25 8 L24 12 L23 8 L19 7 L23 6 Z', class: 'p-glint' }));
    const grp = svg.querySelector('g');
    grp.append(el('rect', { x: '0', y: '-8', width: '128', height: '64', fill: `url(#vlg${n})`, class: 'p-sweep' }),
      el('rect', { x: '-48', y: '-8', width: '48', height: '64', fill: `url(#vls${n})`, class: 'p-sheen' }),
      el('path', { d: BOLT, class: 'p-facet' }));
  } else {
    svg.append(el('path', { d: BOLT, class: 'n3' }), el('path', { d: BOLT, class: 'n2' }), el('path', { d: BOLT, class: 'n1' }), el('path', { d: BOLT, class: 'n0' }));
  }
  if (o.size) { svg.setAttribute('width', String(o.size)); svg.setAttribute('height', String(o.size)); if (o.size === 28) svg.classList.add('is-28'); }
  return svg;
}
