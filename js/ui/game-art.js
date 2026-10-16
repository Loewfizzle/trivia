// Lobby card artwork: one small SVG scene per game, in its identity colours (no images, no text).
// Gradient/filter ids are prefixed per game so the five SVGs can share one page.
import { h, svgEl } from './dom.js';

const glow = (id, sd = 1.6) => `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

// OVERCLOCK: a rev gauge pushed into the red, amber → magenta
function overclock() {
  const cx = 60, cy = 64, r = 44;
  const pt = (deg, rad) => [cx + rad * Math.cos(deg * Math.PI / 180), cy - rad * Math.sin(deg * Math.PI / 180)].map(v => v.toFixed(1));
  const [sx, sy] = pt(210, r), [ex, ey] = pt(-30, r);
  let ticks = '';
  for (let a = 210; a >= -30; a -= 20) {
    const [x1, y1] = pt(a, r - 11), [x2, y2] = pt(a, r - (a % 60 === 30 ? 5 : 8));
    ticks += `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${a < 40 ? '#ff6bd8' : '#ffd27a'}" stroke-width="${a % 60 === 30 ? 1.6 : 1}" opacity="0.85"/>`;
  }
  const [nx, ny] = pt(18, r - 6);
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<radialGradient id="oa-bg" cx="0.5" cy="0.55" r="0.75"><stop offset="0" stop-color="#2a1236"/><stop offset="1" stop-color="#07040f"/></radialGradient>
<linearGradient id="oa-arc" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffb627"/><stop offset="0.6" stop-color="#ff7a5c"/><stop offset="1" stop-color="#ff2bd6"/></linearGradient>
${glow('oa-glow', 2.2)}</defs>
<rect width="120" height="120" fill="url(#oa-bg)"/>
<path d="M${sx} ${sy}A${r} ${r} 0 1 1 ${ex} ${ey}" fill="none" stroke="#2a1a3c" stroke-width="8" stroke-linecap="round"/>
<path d="M${sx} ${sy}A${r} ${r} 0 1 1 ${ex} ${ey}" fill="none" stroke="url(#oa-arc)" stroke-width="7" stroke-linecap="round" filter="url(#oa-glow)" opacity="0.85"/>
<path d="M${sx} ${sy}A${r} ${r} 0 1 1 ${ex} ${ey}" fill="none" stroke="url(#oa-arc)" stroke-width="3.2" stroke-linecap="round"/>
${ticks}
<path d="M${cx} ${cy}L${nx} ${ny}" stroke="#ff2bd6" stroke-width="3.4" stroke-linecap="round" filter="url(#oa-glow)"/>
<path d="M${cx} ${cy}L${nx} ${ny}" stroke="#fff3fb" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="${cx}" cy="${cy}" r="5.5" fill="#1a0f22" stroke="#ffb627" stroke-width="1.6"/>
<path d="M63 82l-8 14h6l-4 12 11-17h-6l4-9z" fill="#ffd27a" filter="url(#oa-glow)"/><path d="M63 82l-8 14h6l-4 12 11-17h-6l4-9z" fill="#fff6dc"/></svg>`;
}

// PULSE: a neon highway running into a violet horizon, notes riding it
const PULSE = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<linearGradient id="pa-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07051a"/><stop offset="0.42" stop-color="#2a1458"/><stop offset="0.46" stop-color="#4b2a8f"/><stop offset="1" stop-color="#05040d"/></linearGradient>
<radialGradient id="pa-sun" cx="0.5" cy="0.44" r="0.4"><stop offset="0" stop-color="#c79bff" stop-opacity="0.9"/><stop offset="1" stop-color="#7c5cff" stop-opacity="0"/></radialGradient>
<linearGradient id="pa-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1238"/><stop offset="1" stop-color="#0a0816"/></linearGradient>
${glow('pa-glow')}</defs>
<rect width="120" height="120" fill="url(#pa-sky)"/><rect width="120" height="120" fill="url(#pa-sun)"/>
<path d="M4 53h8v-14h6v14h5v-22h7v22h6v-9h5v9h8v-17h6v17h4v-26h6v26h6v-12h5v12h8v-19h7v19h8v-10h6v10h4v1H4z" fill="#140c2c"/>
<path d="M60 53 L-10 120 H130 Z" fill="url(#pa-road)"/>
<g stroke-linecap="round" fill="none"><path d="M60 53 L-10 120 M60 53 L130 120" stroke="#36e6ff" stroke-width="1.6" filter="url(#pa-glow)" opacity="0.9"/>
<path d="M60 53 L-10 120 M60 53 L130 120" stroke="#bff6ff" stroke-width="0.7"/>
<path d="M60 53 L37 120 M60 53 L83 120" stroke="#8a72ff" stroke-width="0.8" opacity="0.7"/></g>
<g filter="url(#pa-glow)"><rect x="47" y="70" width="11" height="3" rx="1.5" fill="#a374ff"/><rect x="64" y="88" width="17" height="4.5" rx="2.2" fill="#36e6ff"/><rect x="20" y="104" width="24" height="6" rx="3" fill="#a374ff"/></g>
<rect x="47" y="70" width="11" height="3" rx="1.5" fill="#efe6ff"/><rect x="64" y="88" width="17" height="4.5" rx="2.2" fill="#e8fdff"/><rect x="20" y="104" width="24" height="6" rx="3" fill="#efe6ff"/>
<path d="M0 53.5h120" stroke="#d9c4ff" stroke-width="0.6" opacity="0.8"/></svg>`;

// CIPHER BREACH: a word-race board, the last row cracked and glowing
function cipher() {
  const rows = [
    ['d', 'a', 'd', 'g', 'd'],
    ['g', 'd', 'a', 'g', 'd'],
    ['g', 'g', 'd', 'g', 'a'],
    ['g', 'g', 'g', 'g', 'g'],
  ];
  const fill = { g: '#3dff8b', a: '#ffc21a', d: '#16241e' };
  let tiles = '';
  rows.forEach((row, r) => row.forEach((c, i) => {
    const x = 14 + i * 19, y = 22 + r * 19;
    tiles += `<rect x="${x}" y="${y}" width="16" height="16" rx="1.5" fill="${fill[c]}"${c === 'd' ? ' stroke="#2f4a3d" stroke-width="0.8"' : ''}${r === 3 ? '' : ` opacity="${c === 'd' ? 1 : 0.85}"`}/>`;
  }));
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<radialGradient id="ca-bg" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="#0b2a1c"/><stop offset="1" stop-color="#030a07"/></radialGradient>
<pattern id="ca-scan" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="1" fill="#3dff8b" opacity="0.05"/></pattern>
${glow('ca-glow', 2.4)}</defs>
<rect width="120" height="120" fill="url(#ca-bg)"/>
<rect x="12" y="78" width="96" height="20" rx="2" fill="#3dff8b" opacity="0.5" filter="url(#ca-glow)"/>
${tiles}
<rect width="120" height="120" fill="url(#ca-scan)"/>
<path d="M14 106h20" stroke="#00f0ff" stroke-width="2" stroke-linecap="square"/><path d="M38 106h4" stroke="#00f0ff" stroke-width="2" opacity="0.6"/></svg>`;
}

// LAST SIGNAL: a heartbeat on a target reticle — one more hit and it flatlines
const SIGNAL = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<radialGradient id="sa-bg" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="#3a0812"/><stop offset="1" stop-color="#0a0205"/></radialGradient>
${glow('sa-glow', 2)}</defs>
<rect width="120" height="120" fill="url(#sa-bg)"/>
<g fill="none" stroke="#ff3355" opacity="0.32"><circle cx="60" cy="60" r="34" stroke-width="1"/><circle cx="60" cy="60" r="20" stroke-width="0.8" stroke-dasharray="3 4"/>
<path d="M60 20v10M60 90v10M20 60h10M90 60h10" stroke-width="1.4"/></g>
<path d="M6 64H32L37 54L43 78L50 28L57 74L62 64H84L88 58L92 64H114" fill="none" stroke="#ff3355" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" filter="url(#sa-glow)"/>
<path d="M6 64H32L37 54L43 78L50 28L57 74L62 64H84L88 58L92 64H114" fill="none" stroke="#ffd0d8" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>
<rect x="14" y="98" width="92" height="5" rx="1" fill="#2a0a12"/><rect x="14" y="98" width="30" height="5" rx="1" fill="#ff3355" filter="url(#sa-glow)"/><rect x="14" y="98" width="30" height="5" rx="1" fill="#ff6b80"/>
<path d="M98 86l4 2.3v4.6l-4 2.3-4-2.3v-4.6z" fill="#00f0ff" opacity="0.9"/><path d="M88 86l4 2.3v4.6l-4 2.3-4-2.3v-4.6z" fill="none" stroke="#00f0ff" stroke-width="1" opacity="0.5"/></svg>`;

// NEURAL BLUFF: a classified dossier — redacted lines, a red stamp
const BLUFF = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<radialGradient id="ba-bg" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stop-color="#2a1416"/><stop offset="1" stop-color="#0b0607"/></radialGradient>
<linearGradient id="ba-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe9d8"/><stop offset="1" stop-color="#d9d1bb"/></linearGradient>
${glow('ba-glow', 1.4)}</defs>
<rect width="120" height="120" fill="url(#ba-bg)"/>
<g transform="rotate(-7 60 60)">
<rect x="24" y="16" width="72" height="90" rx="2" fill="#000" opacity="0.45" transform="translate(3 4)"/>
<rect x="24" y="16" width="72" height="90" rx="2" fill="url(#ba-paper)"/>
<rect x="24" y="16" width="72" height="9" fill="#d7262e"/>
<g fill="#8a8578"><rect x="32" y="33" width="44" height="2.6"/><rect x="32" y="40" width="54" height="2.6"/><rect x="32" y="61" width="50" height="2.6"/><rect x="32" y="75" width="40" height="2.6"/><rect x="32" y="82" width="52" height="2.6"/></g>
<g fill="#120f0c"><rect x="32" y="47" width="48" height="6"/><rect x="50" y="67" width="34" height="5"/><rect x="32" y="89" width="26" height="5"/></g>
</g>
<g transform="rotate(-16 84 90)" opacity="0.9"><rect x="64" y="80" width="40" height="20" rx="2" fill="none" stroke="#d7262e" stroke-width="2.6"/>
<rect x="67.5" y="83.5" width="33" height="13" fill="none" stroke="#d7262e" stroke-width="1"/>
<rect x="71" y="87" width="26" height="2.6" fill="#d7262e"/><rect x="74" y="91.6" width="20" height="2" fill="#d7262e" opacity="0.8"/></g></svg>`;

const ART = { overclock, pulse: () => PULSE, cipher, signal: () => SIGNAL, bluff: () => BLUFF };

/** The card's artwork tile, or null for a game without art (falls back to its initials). */
export function gameArt(id) {
  const make = ART[id];
  return make ? h('div.gc-glyph.gc-art', svgEl(make())) : null;
}
