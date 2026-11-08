// THE VAULT 2C — THE TIER GEM (the owner, Nov 3 5:20–5:25 pm: "the tier pill is too big on the slim strip" → APPROVED: a small TIER GEM in
// the corner — Downloads\NEON\vault\tier-gem.png). No words on the strip (the full card + CUSTOMIZE still spell the tier).
// FRIENDS B — THE TIER GEM = ONE SHAPE (the owner, Nov 6): the faceted BRILLIANT for EVERY tier, the SAME size; the tier = colour + shine:
//   COMMON    a silver-grey brilliant                 (still, softly lit)   — the river stone RETIRED
//   UNCOMMON  a green brilliant                       (still, softly lit)   — the emerald-cut octagon RETIRED
//   RARE      a blue brilliant                        (still, its facets lit)
//   EPIC      a purple brilliant + a SPARKLE          (the sparkle pops now + then)
//   LEGENDARY a gold brilliant + a GLINT + a tiny STAR
//   DEV       THE DEV GEM (the owner, 6:05 pm: "very bright, vivid, pulsing, dancing" — it must OUTSHINE every other gem): larger, PRISMATIC —
//             its facets cycling through the spectrum, a rainbow light sweeping across, a slow bright pulse, sparkles popping round it, a
//             soft rainbow halo. It plays even on a legendary-led strip (THE PROMINENCE RULE's one stated exception).
// Built like the emblems (THE VAULT 2A): small SVG LAYERS in one box, each moving part its own HTML <i> moved on transform + opacity only
// (the compositor moves it; nothing repaints), a part moving INSIDE the gem under a CSS mask of it. Reduced motion = the still frame (the
// dev gem: bright + still, its rainbow facets lit). css/vault.css `.vl-gem`.
//   gemEl(tier, { dev, size }) → span.vl-gem
const NS = 'http://www.w3.org/2000/svg';
const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

// the brilliant's outline + its facets (a 24-unit box: the crown's table 7..17 at y 4, the girdle 2..22 at y 10, the culet 12, 22)
const OUT = 'M7 4 H17 L22 10 L12 22 L2 10 Z';
const FACETS = [
  // [points, light 0..1] — the crown (lit from the upper left), then the pavilion
  ['2,10 7,4 9.5,10', 0.62], ['7,4 12,10 9.5,10', 0.86], ['7,4 17,4 12,10', 1], ['17,4 14.5,10 12,10', 0.74], ['17,4 22,10 14.5,10', 0.5],
  ['2,10 9.5,10 12,22', 0.42], ['9.5,10 14.5,10 12,22', 0.66], ['14.5,10 22,10 12,22', 0.28],
];
// each tier's colour: [dark, light] (the one tier palette's hues — js/core/rarity.js — as cut stones)
const COL = {
  rare: ['#1a4fb8', '#bfe2ff'], epic: ['#5a1fa8', '#ead2ff'], legendary: ['#9a5a08', '#fff2b8'], uncommon: ['#127a3e', '#c9ffd9'], common: ['#545a68', '#eef1f6'],
};
// the STILL tiers' light: the facets' range squeezed (a calmer stone); rare + up get the whole range ("its facets lit")
const SOFT = k => 0.22 + k * 0.56;
const mix = (a, b, k) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`; };
const SPECTRUM = ['#ff3b6b', '#ff9a2e', '#ffe14a', '#3dff8e', '#2ee6ff', '#5b7bff', '#c45bff', '#ff4fd8'];

function layer(box, cls, vb = '0 0 24 24') {
  const i = document.createElement('i'); i.className = `vl-gl${cls ? ` ${cls}` : ''}`;
  const svg = el('svg', { viewBox: vb, 'aria-hidden': 'true' }); i.append(svg); box.append(i);
  return svg;
}
function masked(box, d, cls) {
  const m = document.createElement('i'); m.className = `vl-gm${cls ? ` ${cls}` : ''}`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='${d}'/></svg>`)}")`;
  m.style.webkitMaskImage = url; m.style.maskImage = url; box.append(m);
  return m;
}
const star = (svg, cx, cy, r, fill = '#fff') => svg.append(el('path', { d: `M${cx} ${cy - r} Q${cx + r * 0.16} ${cy - r * 0.16} ${cx + r} ${cy} Q${cx + r * 0.16} ${cy + r * 0.16} ${cx} ${cy + r} Q${cx - r * 0.16} ${cy + r * 0.16} ${cx - r} ${cy} Q${cx - r * 0.16} ${cy - r * 0.16} ${cx} ${cy - r} Z`, fill }));

/** the faceted gem's still body in one layer (a colour per facet), its rim + a crisp top edge */
function faceted(svg, fill, out = OUT, facets = FACETS, rim = 'rgba(255,255,255,0.55)') {
  for (const [pts, k] of facets) svg.append(el('polygon', { points: pts, fill: typeof fill === 'function' ? fill(k, pts) : fill }));
  svg.append(el('path', { d: out, fill: 'none', stroke: rim, 'stroke-width': 0.8, 'stroke-linejoin': 'round' }));
}

/** a tier's gem: tier = common · uncommon · rare · epic · legendary; o.dev = THE DEV GEM; o.size (px) overrides the tier's size */
export function gemEl(tier, o = {}) {
  const dev = !!o.dev, t = dev ? 'dev' : tier || 'common';
  const box = document.createElement('span');
  box.className = `vl-gem vl-gem-${t}`;
  box.setAttribute('aria-hidden', 'true');
  if (o.size) box.style.setProperty('--gs', `${o.size}px`);
  if (t === 'common' || t === 'uncommon') {
    // (FRIENDS B: the same brilliant, softly lit + still — silver-grey / green)
    const [d, l] = COL[t];
    faceted(layer(box, ''), k => mix(d, l, SOFT(k)), OUT, FACETS, t === 'common' ? 'rgba(240,244,250,0.55)' : 'rgba(220,255,230,0.55)');
    return box;
  }
  if (t === 'dev') {
    // THE HALO (behind): a rainbow ring, soft — turning slowly
    box.append(Object.assign(document.createElement('i'), { className: 'vl-gl vl-gem-halo' }));
    // THE BODY: three prismatic facet sets stacked, each the spectrum shifted — they CROSS-FADE in turn (opacity only): the facets cycle
    const body = document.createElement('i'); body.className = 'vl-gl vl-gem-body'; box.append(body);
    for (let s = 0; s < 3; s++) {
      const svg = layer(body, `vl-gem-cyc vl-gem-c${s}`);
      faceted(svg, (k, pts) => { const i = FACETS.findIndex(f => f[0] === pts); const c = SPECTRUM[(i + s * 3) % SPECTRUM.length]; return mix('#ffffff', c, 0.62 + 0.38 * (1 - k)); }, OUT, FACETS, 'rgba(255,255,255,0.95)');
    }
    // THE SWEEP: a rainbow band sliding across inside the gem
    const sw = masked(body, OUT, 'vl-gem-sweepm');
    sw.append(Object.assign(document.createElement('i'), { className: 'vl-gem-sweep' }));
    // a white-hot table glint
    const gl = layer(body, 'vl-gem-glint'); star(gl, 9.6, 6.2, 3.2);
    // THE SPARKLES: four popping round it, in turn
    for (const [x, y, r, i] of [[-3, 3, 4.2, 0], [25, 5, 3.4, 1], [24, 19, 3, 2], [-1, 18, 2.6, 3]]) { const sp = layer(box, 'vl-gem-spk', '-6 -6 36 36'); sp.parentNode.style.setProperty('--i', i); star(sp, x, y, r, i % 2 ? '#bff6ff' : '#fff2c4'); }
    return box;
  }
  // RARE · EPIC · LEGENDARY: the faceted brilliant in the tier's colour
  const [d, l] = COL[t] || COL.rare;
  faceted(layer(box, ''), k => mix(d, l, k), OUT, FACETS, t === 'legendary' ? 'rgba(255,246,210,0.9)' : 'rgba(230,240,255,0.6)');
  if (t === 'legendary') {
    // THE GLINT: a white-hot star flashing on the crown's table now + then, + a tiny star twinkling off its shoulder (no mask: a masked
    // moving layer repaints — 8 legendary strips paid ~0.75 ms a frame for it; the bench, Nov 3)
    // (ONE moving layer for both: the table's glint + the shoulder's star flash together)
    const gl = layer(box, 'vl-gem-gl', '-6 -6 36 36'); star(gl, 9.4, 6, 3.4); star(gl, 24, 0, 3.6, '#fff8dc');
  }
  if (t === 'epic') { const sp = layer(box, 'vl-gem-spk1', '-6 -6 36 36'); star(sp, 23, 2, 3.6, '#f4e6ff'); }
  return box;
}
