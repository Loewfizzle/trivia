// CITY B — THE DECO MEDALS (the owner approved the mockup Nov 13: Downloads\NEON\medals\medals-approved-nov13.html — its shapes + colours are the
// source): every place 1 / 2 / 3 badge — THE BOARD (every game's tab, HOLD'EM's too), the title's score peek, the dailies' SCORES — is THIS one
// component, never a per-screen copy. A toothed disc, three stepped Art Deco octagons, the numeral in a dark ink (≥ 4.5 : 1 on its face —
// tests/medal.test.mjs), a gloss. Colour-blind safe: the NUMERAL carries the place, never the metal alone. ~32 pt on a phone. No pills.
export const MEDAL_INKS = Object.freeze({
  //        hi          a (face)    b           c (rim)     edge        ink
  gold: ['#fff3b8', '#f4c84a', '#b8831c', '#6a4508', '#ffe9a0', '#3a2404'],
  silver: ['#ffffff', '#d6dbe6', '#9aa3b5', '#4e5568', '#f2f5fb', '#252a36'],
  bronze: ['#ffd9b0', '#d98a4e', '#9a5427', '#4f2610', '#f6b98a', '#2a1206'],
});
export const MEDAL_KIND = ['', 'gold', 'silver', 'bronze'];
const oct = r => { const k = r * 0.4142; return `M${-k},${-r}L${k},${-r}L${r},${-k}L${r},${k}L${k},${r}L${-k},${r}L${-r},${k}L${-r},${-k}Z`; };
let TEETH = '';
for (let i = 0; i < 48; i++) { const a = i * 7.5 * Math.PI / 180, c = Math.cos(a), s = Math.sin(a); TEETH += `M${(c * 21.6).toFixed(2)},${(s * 21.6).toFixed(2)}L${(c * 23.2).toFixed(2)},${(s * 23.2).toFixed(2)}`; }
/** the inner face's stop under the numeral's foot (the numeral spans 0.22 → 0.78 of the face) */
export const FACE_MID = 0.85;
export const mixHex = (x, y, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(x.slice(i, i + 2), 16) * (1 - t) + parseInt(y.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
let N = 0;
/** the medal's SVG markup for place n (1–3) */
export function medalSvg(n) {
  const kind = MEDAL_KIND[n]; if (!kind) return '';
  const [hi, a, b, c, edge, ink] = MEDAL_INKS[kind], id = `rk${++N}`;
  const num = (fill, op, dy = 0) => `<text y="8.6" text-anchor="middle" font-family="'Chakra Petch',sans-serif" font-weight="700" font-size="24" fill="${fill}" opacity="${op}"${dy ? ` transform="translate(0,${dy})"` : ''}>${n}</text>`;
  return `<svg viewBox="-25 -25 50 50" aria-hidden="true"><defs>`
    + `<linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".35" stop-color="${a}"/><stop offset=".7" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`
    + `<linearGradient id="${id}r" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${hi}"/><stop offset=".4" stop-color="${a}"/><stop offset="1" stop-color="${c}"/></linearGradient>`
    // (the innermost face — under the numeral — reaches the dark b only at its very foot: the numeral holds ≥ 4.5 : 1 over all of it)
    + `<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".4" stop-color="${a}"/><stop offset="${FACE_MID}" stop-color="${mixHex(a, b, 0.4)}"/><stop offset="1" stop-color="${b}"/></linearGradient>`
    + `<radialGradient id="${id}g" cx=".35" cy=".25" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`
    + `<circle r="23.4" fill="${c}"/><path d="${TEETH}" stroke="${c}" stroke-width=".9"/>`
    + `<path d="${oct(21)}" fill="url(#${id}m)" stroke="${ink}" stroke-width=".8"/>`
    + `<path d="${oct(17.6)}" fill="url(#${id}r)" stroke="${edge}" stroke-width=".7" opacity=".95"/>`
    + `<path d="${oct(15.2)}" fill="url(#${id}f)" stroke="${c}" stroke-width=".9"/>`
    + num(hi, 0.9, 1.1) + num(ink, 0.88) + `<path d="${oct(21)}" fill="url(#${id}g)"/></svg>`;
}
const PLACE = ['', '1st', '2nd', '3rd'];
/** a place badge: the Deco medal for 1–3 (an element), null for any other place (the caller shows its own number); size in px */
export function rankMedal(n, { size = 32, cls = '' } = {}) {
  if (!MEDAL_KIND[n] || typeof document === 'undefined') return null;
  const el = document.createElement('span');
  el.className = `rk-medal${cls ? ` ${cls}` : ''}`;
  el.setAttribute('role', 'img'); el.setAttribute('aria-label', `${PLACE[n]} place`);
  el.style.setProperty('--rk', `${size}px`);
  el.innerHTML = medalSvg(n);
  return el;
}
