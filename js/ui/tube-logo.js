// EACH GAME'S TUBE LOGO (CITY 2.0, Part 3) — built exactly like the NEON logo (ui/logo.js): every stroke one bent glass tube,
// drawn as glass → wide glow → near glow → body → white-hot core → a thin highlight, electrode caps at the open ends, mounting
// clips. The game's mark (district/marks.js) beside its name in the tube alphabet, in the game's colours. Pure markup (no DOM),
// so LOBBY 2.0 can swap the title's sign to the game's logo ("TONIGHT") and any screen can show one.
//   gameLogoSvg(game, { id, lit, premium })  → an <svg class="nd-logo tube-logo"> using the logo's own class names (.ndl,
//   .ndl-light, .ndl-glow1 …): the title's CSS lights it the same way (.ndl.on, .is-lit), letter by letter (each tube its group).
// Preview: tests/integration/logos-preview.html (all of them, night + day).
import { LETTERS, markFor, tubeEnds, bladeWord } from '../screens/district/marks.js';

/** each game's tube colour for its name (the game's accent) */
export const LOGO_ACC = { rum: '#f0c75e', stakes: '#f2c869', overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#d6f0ff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2' };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)); return `rgb(${c.join(',')})`; };

// a path's numbers scaled + offset (absolute commands; A keeps its flags)
function scaleD(d, s, ox, oy) {
  return d.replace(/([MLHVQCAZ])([^MLHVQCAZ]*)/gi, (m, cmd, rest) => {
    const n = (rest.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) || []).map(Number), C = cmd.toUpperCase();
    const v = n.map((x, i) => C === 'H' ? x * s + ox : C === 'V' ? x * s + oy : C === 'A' ? (i % 7 < 2 ? x * s : i % 7 === 5 ? x * s + ox : i % 7 === 6 ? x * s + oy : x) : (i % 2 ? x * s + oy : x * s + ox));
    return C + v.map(x => +x.toFixed(2)).join(' ');
  });
}

/** the name a logo spells: the game's name, on one line or two (a two-word name breaks at the space when it is long) */
export function logoLines(game) {
  const name = String(game.name || bladeWord(game)).toUpperCase().replace(/[^A-Z ]/g, '');
  const w = name.split(' ').filter(Boolean);
  return name.length > 9 && w.length > 1 ? [w.slice(0, Math.ceil(w.length / 2)).join(' '), w.slice(Math.ceil(w.length / 2)).join(' ')] : [name];
}

/**
 * A game's tube logo. opts: { id (unique: its filter ids), lit (always on), blur, premium (the glass wall), pad }.
 * The box: the mark (100 × 100) on the left, the name to its right; the viewBox fits the content.
 */
export function gameLogoSvg(game, { id = `tl-${game.id}`, lit = false, blur = 1, pad = 24, premium = false } = {}) {
  const T = 7;                                     // the tube's width (the NEON logo's is 9 at a 100-high sign; this one's letters are smaller)
  const acc = LOGO_ACC[game.id] || '#9fd8ff', lines = logoLines(game);
  const lh = lines.length > 1 ? 42 : 56, s = lh / 14, lw = 10 * s, gap = lw * 0.32;
  const tubes = [];
  // the mark
  for (const t of markFor(game).tubes) tubes.push({ d: t.d, col: t.col, mark: true });
  // the letters, line by line, from x 118
  lines.forEach((ln, li) => {
    const y0 = lines.length > 1 ? 4 + li * (lh + 10) : (100 - lh) / 2;
    [...ln].forEach((ch, i) => { const d = LETTERS[ch]; if (d) tubes.push({ d: scaleD(d, s, 118 + i * (lw + gap), y0), col: acc }); });
  });
  const W = Math.max(...lines.map(ln => 118 + ln.length * (lw + gap) - gap));
  const vb = `${-pad} ${-pad} ${W + pad * 2} ${100 + pad * 2}`;
  const groups = tubes.map((t, i) => {
    const body = shade(t.col, 0.18), core = shade(t.col, 0.82), glass = shade(t.col, -0.72);
    const { ends, clips } = tubeEnds(t.d);
    const caps = ends.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${T * 0.5}" fill="#1e1420"/>`).join('');
    const clip = clips.slice(0, 1).map(c => `<rect x="${(c.x - 1.2).toFixed(1)}" y="${(c.y - 5).toFixed(1)}" width="2.4" height="10" rx="0.8" fill="#1c1019" opacity="0.75" transform="rotate(${(c.ang * 180 / Math.PI + 90).toFixed(0)} ${c.x.toFixed(1)} ${c.y.toFixed(1)})"/>`).join('');
    return `<g class="ndl ndl-${i + 1}${t.mark ? ' tl-mark' : ''}" style="--g:${t.col};--b:${body};--c:${core}">
  <path class="ndl-glass" d="${t.d}" stroke="${glass}" stroke-width="${T + 2}"/>
  ${premium ? `<path class="ndl-wall" d="${t.d}" stroke="#eef4ff" stroke-width="${T + 2.4}"/>` : ''}
  ${caps}
  <g class="ndl-light">
    <path class="ndl-glow2" d="${t.d}" stroke="${t.col}" stroke-width="${T + 12}" filter="url(#${id}-b2)"/>
    <path class="ndl-glow1" d="${t.d}" stroke="${t.col}" stroke-width="${T + 3}" filter="url(#${id}-b1)"/>
    <path class="ndl-body" d="${t.d}" stroke="${body}" stroke-width="${T}"/>
    <path class="ndl-core" d="${t.d}" stroke="${core}" stroke-width="${T * 0.36}"/>
    <path class="ndl-hi" d="${t.d}" stroke="#ffffff" stroke-width="0.7" transform="translate(-1.1 -1.1)" opacity="0.35"/>
  </g>
  ${clip}
</g>`;
  }).join('');
  return `<svg class="nd-logo tube-logo${lit ? ' is-lit' : ''}" data-game="${game.id}" viewBox="${vb}" role="img" aria-label="${game.name}" xmlns="http://www.w3.org/2000/svg">
<defs>
  <filter id="${id}-b1" filterUnits="userSpaceOnUse" x="${-pad}" y="${-pad}" width="${W + pad * 2}" height="${100 + pad * 2}"><feGaussianBlur stdDeviation="${2.6 * blur}"/></filter>
  <filter id="${id}-b2" filterUnits="userSpaceOnUse" x="${-pad}" y="${-pad}" width="${W + pad * 2}" height="${100 + pad * 2}"><feGaussianBlur stdDeviation="${9 * blur}"/></filter>
</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round"${premium ? ' class="ndp"' : ''}>
${groups}
</g>
</svg>`;
}
