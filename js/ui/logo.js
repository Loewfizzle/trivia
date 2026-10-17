// NEON SPEAKEASY logotype. Pure markup (no DOM), so the title, the lobby header, the boot screen, the app icons
// and the link preview (tests/integration/render-assets.mjs) all draw the exact same sign.
//
// "NEON" is a real neon sign: each letter is one bent glass tube (a single stroke with rounded bends), drawn as
//   glass (unlit tube) -> wide glow -> near glow -> tube body -> hot white core -> a thin glass highlight,
// with blacked-out connector tubes between the letters, electrode caps at the tube ends and small mounting
// clips — the way a sign shop builds one. Each letter is its own group (.ndl-1 … .ndl-4) so it can flicker alone.
// "SPEAKEASY" is set in the display face, wide and quiet, under the sign (HTML, see title.js / lobby.js).

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

export const LOGO_W = 332;
export const LOGO_H = 100;

const PINK = { glass: '#40243a', glow: '#ff2e97', body: '#ff5fb4', core: '#fff1f8' };

/**
 * opts: { id: unique prefix for filter ids, pad (viewBox padding), lit: true = always on (no classes needed),
 *         blur: glow strength multiplier, clips: draw mounting clips }
 */
export function logoSvg({ id = 'nd', pad = 26, lit = false, blur = 1, clips = true, connectors = false, title = 'NEON' } = {}) {
  const vb = `${-pad} ${-pad - 4} ${LOGO_W + pad * 2} ${LOGO_H + pad * 2 + 8}`;
  const letters = LETTERS.map((L, i) => {
    const t = `translate(${L.x} 0)`;
    // electrode ends: a small darker cap where the tube turns back into the sign (under the light)
    const caps = L.ends.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${TUBE * 0.5}" fill="#2a1626"/>`).join('');
    return `<g class="ndl ndl-${i + 1}" transform="${t}">
  <path class="ndl-glass" d="${L.d}" stroke="${PINK.glass}" stroke-width="${TUBE + 2}"/>
  ${caps}
  <g class="ndl-light">
    <path class="ndl-glow2" d="${L.d}" stroke="${PINK.glow}" stroke-width="${TUBE + 14}" filter="url(#${id}-b2)"/>
    <path class="ndl-glow1" d="${L.d}" stroke="${PINK.glow}" stroke-width="${TUBE + 4}" filter="url(#${id}-b1)"/>
    <path class="ndl-body" d="${L.d}" stroke="${PINK.body}" stroke-width="${TUBE}"/>
    <path class="ndl-core" d="${L.d}" stroke="${PINK.core}" stroke-width="${TUBE * 0.34}"/>
    <path class="ndl-hi" d="${L.d}" stroke="#ffffff" stroke-width="0.8" transform="translate(-1.4 -1.4)" opacity="0.35"/>
  </g>
</g>`;
  }).join('');
  const links = connectors ? LINKS.map(d => `<path d="${d}" stroke="#20131d" stroke-width="3.2" opacity="0.9"/>`).join('') : '';
  const clipMarks = clips ? CLIPS.map(([x, y]) => `<rect x="${x - 1.5}" y="${y - 6.5}" width="3" height="13" rx="1" fill="#1c1019" opacity="0.75"/>`).join('') : '';
  return `<svg class="nd-logo${lit ? ' is-lit' : ''}" viewBox="${vb}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <filter id="${id}-b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${3.2 * blur}"/></filter>
  <filter id="${id}-b2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${11 * blur}"/></filter>
</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  ${links}
  ${letters}
  ${clipMarks}
</g>
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

export const TAGLINE = 'GAME NIGHT, AFTER DARK.';
