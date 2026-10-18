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

// NEON PAR: a rooftop green floating over the night city — teal turf glow, the pink flag, a putt on its way
const GOLF = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<linearGradient id="ga-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04060f"/><stop offset="0.5" stop-color="#101a3a"/><stop offset="1" stop-color="#2a1640"/></linearGradient>
<linearGradient id="ga-turf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d3f40"/><stop offset="1" stop-color="#0a2a2e"/></linearGradient>
<radialGradient id="ga-cup" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ff4fa3" stop-opacity="0.7"/><stop offset="1" stop-color="#ff4fa3" stop-opacity="0"/></radialGradient>
<radialGradient id="ga-ball" cx="0.38" cy="0.35" r="0.7"><stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#9ffbe8"/><stop offset="1" stop-color="#16b89c"/></radialGradient>
${glow('ga-glow', 1.8)}${glow('ga-soft', 3.5)}</defs>
<rect width="120" height="120" fill="url(#ga-sky)"/>
<g fill="#0b1124"><path d="M0 70V48h7v-8h6v8h5V34h8v36zM28 70V44h6v-6h7v32zM46 70V52h9V40h6v30zM66 70V36h4v-8h3v8h4v34zM82 70V46h10v24zM96 70V30h9v40zM108 70V50h12v20z"/></g>
<g fill="#ffcf8a" opacity="0.55"><rect x="9" y="44" width="2" height="2"/><rect x="21" y="38" width="2" height="2"/><rect x="21" y="46" width="2" height="2"/><rect x="36" y="48" width="2" height="2"/><rect x="57" y="44" width="2" height="2"/><rect x="69" y="40" width="2" height="2"/><rect x="69" y="52" width="2" height="2"/><rect x="99" y="36" width="2" height="2"/><rect x="99" y="48" width="2" height="2"/><rect x="85" y="52" width="2" height="2"/><rect x="112" y="56" width="2" height="2"/></g>
<g fill="#7fe3ff" opacity="0.5"><rect x="31" y="54" width="2" height="2"/><rect x="88" y="58" width="2" height="2"/><rect x="102" y="58" width="2" height="2"/></g>
<circle cx="71" cy="27" r="1.6" fill="#ff3355" filter="url(#ga-glow)"/><circle cx="71" cy="27" r="0.8" fill="#ffd0d8"/>
<path d="M30 66 L90 66 L116 112 L4 112 Z" fill="#0a0f1d"/>
<path d="M33 64 L87 64 L110 104 L10 104 Z" fill="url(#ga-turf)"/>
<path d="M33 64 L87 64 L110 104 L10 104 Z" fill="none" stroke="#2ff5d2" stroke-width="2.2" filter="url(#ga-soft)" opacity="0.8"/>
<path d="M33 64 L87 64 L110 104 L10 104 Z" fill="none" stroke="#b9fff2" stroke-width="0.8"/>
<path d="M10 104 L110 104 L110 108 L10 108 Z" fill="#071a1c"/>
<g stroke="#2ff5d2" stroke-width="0.4" opacity="0.18"><path d="M45 64 L37 104 M60 64 L60 104 M75 64 L83 104 M24 80 H96 M17 92 H103"/></g>
<ellipse cx="68" cy="71" rx="9" ry="3.6" fill="url(#ga-cup)"/>
<ellipse cx="68" cy="71" rx="3.2" ry="1.3" fill="#05030a" stroke="#ff4fa3" stroke-width="0.8"/>
<path d="M68 71 V46" stroke="#e8ecf6" stroke-width="0.9"/>
<path d="M68 46 L80 49.5 L68 53 Z" fill="#ff4fa3" filter="url(#ga-glow)"/><path d="M68 46 L80 49.5 L68 53 Z" fill="#ff7fbf"/>
<g fill="#ff4fa3"><circle cx="64.6" cy="75.5" r="0.9" opacity="0.5"/><circle cx="61" cy="80" r="1.1" opacity="0.65"/><circle cx="56.8" cy="85" r="1.3" opacity="0.8"/><circle cx="52.2" cy="90.3" r="1.5" opacity="0.95"/></g>
<path d="M50 94 Q41 99 30 101" stroke="#2ff5d2" stroke-width="3" stroke-linecap="round" opacity="0.25" fill="none" filter="url(#ga-glow)"/>
<circle cx="48" cy="95" r="4.6" fill="#2ff5d2" filter="url(#ga-soft)" opacity="0.8"/>
<circle cx="48" cy="95" r="3.4" fill="url(#ga-ball)"/>
<ellipse cx="48.6" cy="99.4" rx="3.6" ry="0.9" fill="#000" opacity="0.4"/></svg>`;

// DOUBLE AGENT: a surveillance frame on four suspects — one of them doesn't hold the signal (RGB split)
function agent() {
  const head = (x, fill) => `<g transform="translate(${x} 0)"><circle cx="0" cy="62" r="8.5" fill="${fill}"/><path d="M-15 92c0-11 6.5-17 15-17s15 6 15 17z" fill="${fill}"/></g>`;
  let lines = '';
  for (let y = 2; y < 120; y += 3) lines += `<path d="M0 ${y}h120" stroke="#ffffff" stroke-opacity="0.035" stroke-width="1"/>`;
  const br = 'stroke="#c9ced8" stroke-width="1.6" fill="none" stroke-linecap="square"';
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<radialGradient id="da-bg" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stop-color="#262a33"/><stop offset="1" stop-color="#08090c"/></radialGradient>
<linearGradient id="da-fig" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa1ae"/><stop offset="1" stop-color="#4a505c"/></linearGradient>
<clipPath id="da-top"><rect x="0" y="0" width="120" height="69"/></clipPath><clipPath id="da-bot"><rect x="0" y="69" width="120" height="51"/></clipPath>
${glow('da-glow', 2)}</defs>
<rect width="120" height="120" fill="url(#da-bg)"/>
${lines}
<path d="M10 22v-10h10M110 22v-10h-10M10 98v10h10M110 98v10h-10" ${br}/>
<circle cx="17" cy="30" r="2.2" fill="#e6e9ef"/><rect x="22" y="28.2" width="12" height="3.6" rx="1" fill="#e6e9ef" opacity="0.75"/>
<rect x="80" y="28.6" width="23" height="2.8" rx="1" fill="#e6e9ef" opacity="0.35"/>
${head(22, 'url(#da-fig)')}${head(47, 'url(#da-fig)')}${head(98, 'url(#da-fig)')}
<g opacity="0.7">${head(70.5, '#ff2e63')}</g><g opacity="0.7">${head(75.5, '#2ee6ff')}</g>
<g clip-path="url(#da-top)">${head(73, '#f4f6fa')}</g><g clip-path="url(#da-bot)" transform="translate(4 0)">${head(73, '#f4f6fa')}</g>
<rect x="56" y="67.5" width="36" height="1.4" fill="#ffffff" opacity="0.8" filter="url(#da-glow)"/>
<path d="M58 54h-6v6M88 54h6v6M58 96h-6v-6M88 96h6v-6" stroke="#f4f6fa" stroke-width="1.4" fill="none"/>
<rect x="18" y="100" width="30" height="3" rx="1" fill="#e6e9ef" opacity="0.28"/><rect x="52" y="100" width="18" height="3" rx="1" fill="#e6e9ef" opacity="0.18"/></svg>`;
}

// PRISM DROP: a beam of white light through a glass prism splits into a spectrum over a stack of jewel blocks;
// one row is clearing into light, a falling piece above, shards drifting off
function prism() {
  const C = { I: '#2be4f0', O: '#ffc93a', T: '#b46bff', S: '#2fe07a', Z: '#ff4d6d', J: '#4a86ff', L: '#ff9b3d', X: '#59617a' };
  const s = 9.2;
  const ox = 14, oy = 108;
  const block = (cx, cy, col, a = 1) => {
    const x = ox + cx * s, y = oy - (cy + 1) * s;
    return `<g opacity="${a}"><rect x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}" rx="1.6" fill="${col}"/>`
      + `<path d="M${x + 0.8} ${y + 0.8}h${s * 0.7}l-${s * 0.55} ${s * 0.7}z" fill="#fff" opacity="0.28"/>`
      + `<rect x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}" rx="1.6" fill="none" stroke="#fff" stroke-opacity="0.45" stroke-width="0.6"/></g>`;
  };
  const rows = [
    'JJXZZSSXLL',
    'JIIIITTTLX',
    'OOSS..TZZL',
    'OO.SSI..ZZ',
  ];
  let stack = '';
  rows.forEach((r, i) => [...r].forEach((c, x) => { if (c !== '.') stack += block(x, i, C[c] || C.X); }));
  // the clearing row (row 4): light
  const cy = oy - 5 * s;
  const clear = `<rect x="${ox}" y="${cy}" width="${s * 10}" height="${s}" fill="url(#pr-row)" filter="url(#pr-glow)"/>`;
  // falling piece (T, amethyst) + its ghost
  const fall = [[4, 9], [5, 9], [6, 9], [5, 8]].map(([x, y]) => block(x, y, C.T)).join('');
  const ghost = [[4, 4], [5, 4], [6, 4], [5, 3]].map(([x, y]) => `<rect x="${ox + x * s + 1}" y="${oy - (y + 1) * s + 1}" width="${s - 2}" height="${s - 2}" rx="1.4" fill="none" stroke="${C.T}" stroke-opacity="0.65" stroke-width="0.8"/>`).join('');
  const shard = (x, y, r, col, sc = 1) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${sc})" d="M0 -4L3.4 2.6L-3 1.8Z" fill="${col}" opacity="0.9"/>`;
  const spec = ['#ff5f8f', '#ffb347', '#fff27a', '#5fffb0', '#4fd8ff', '#8a7dff'];
  const rays = spec.map((c, i) => `<path d="M60 30L120 ${8 + i * 7}L120 ${12 + i * 7}Z" fill="${c}" opacity="0.55"/>`).join('');
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<radialGradient id="pr-bg" cx="0.55" cy="0.25" r="0.9"><stop offset="0" stop-color="#1d2452"/><stop offset="0.55" stop-color="#0a0d22"/><stop offset="1" stop-color="#04050c"/></radialGradient>
<linearGradient id="pr-row" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7aa8"/><stop offset="0.3" stop-color="#fff"/><stop offset="0.6" stop-color="#bff7ff"/><stop offset="1" stop-color="#a58bff"/></linearGradient>
<linearGradient id="pr-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#9fd8ff" stop-opacity="0.12"/></linearGradient>
${glow('pr-glow', 2.4)}</defs>
<rect width="120" height="120" fill="url(#pr-bg)"/>
<path d="M0 34L60 30" stroke="#fff" stroke-width="2.2" opacity="0.9" filter="url(#pr-glow)"/>
${rays}
<path d="M50 40L60 18L70 40Z" fill="url(#pr-glass)" stroke="#fff" stroke-width="0.9" stroke-opacity="0.9"/>
<rect x="${ox - 2}" y="${oy - 10 * s - 2}" width="${s * 10 + 4}" height="${s * 10 + 4}" rx="3" fill="#05070f" fill-opacity="0.55" stroke="#ffffff" stroke-opacity="0.22"/>
${ghost}${stack}${clear}${fall}
${shard(10, 66, 20, '#ff4d6d')}${shard(112, 62, -30, '#2be4f0', 0.8)}${shard(108, 76, 60, '#ffc93a', 0.7)}${shard(8, 80, -50, '#b46bff', 0.6)}
</svg>`;
}

// SLIPSTREAM: a dusk sky from sunset gold into deep blue, a low sun, layered dunes, the track a single line of
// light; a rider mid-flip off a crest trailing a ribbon of light, light-birds and the first stars
function slip() {
  const track = 'M0 92C14 90 22 78 34 78S52 96 66 96S86 70 98 66S114 70 120 74';
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<linearGradient id="sl-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1440"/><stop offset="0.38" stop-color="#2a2a7a"/><stop offset="0.62" stop-color="#a0457e"/><stop offset="0.8" stop-color="#ff8a5c"/><stop offset="1" stop-color="#ffc46b"/></linearGradient>
<radialGradient id="sl-sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff4cf"/><stop offset="0.35" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff8a5c" stop-opacity="0"/></radialGradient>
<linearGradient id="sl-d1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3a62"/><stop offset="1" stop-color="#3a1a4a"/></linearGradient>
<linearGradient id="sl-d2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1a3e"/><stop offset="1" stop-color="#120818"/></linearGradient>
<linearGradient id="sl-rib" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffc46b" stop-opacity="0"/><stop offset="1" stop-color="#ffe6bf"/></linearGradient>
${glow('sl-glow', 1.8)}${glow('sl-glow2', 4)}</defs>
<rect width="120" height="120" fill="url(#sl-sky)"/>
<g fill="#fff">${[[12, 10, 0.8], [30, 22, 0.5], [52, 8, 0.7], [78, 16, 0.6], [100, 9, 0.9], [110, 28, 0.5], [66, 30, 0.4], [20, 36, 0.4]].map(([x, y, a]) => `<circle cx="${x}" cy="${y}" r="0.7" opacity="${a}"/>`).join('')}</g>
<circle cx="84" cy="72" r="26" fill="url(#sl-sun)"/>
<circle cx="84" cy="72" r="9" fill="#fff1c4" opacity="0.95"/>
<path d="M0 82C20 70 36 74 52 80S90 70 120 76V120H0Z" fill="url(#sl-d1)" opacity="0.9"/>
<path d="${track}V120H0Z" fill="url(#sl-d2)"/>
<path d="${track}" stroke="#ff9a5c" stroke-width="5" fill="none" opacity="0.35" filter="url(#sl-glow2)"/>
<path d="${track}" stroke="#ffe6bf" stroke-width="1.6" fill="none" filter="url(#sl-glow)"/>
<path d="${track}" stroke="#fff6e6" stroke-width="0.9" fill="none"/>
<path d="M44 86C52 70 60 58 72 50" stroke="url(#sl-rib)" stroke-width="3.2" fill="none" stroke-linecap="round" filter="url(#sl-glow)"/>
<g transform="translate(76 46) rotate(-150)">
  <ellipse cx="0" cy="1.6" rx="9" ry="2.6" fill="#ffc46b" opacity="0.55" filter="url(#sl-glow2)"/>
  <path d="M-7 0.4Q-8 1.8 -6.4 2.4H6.4Q8 2.4 8.2 0.6Z" fill="#0b0e20" stroke="#ffe6bf" stroke-width="0.7"/>
  <rect x="-5.6" y="1.6" width="11.2" height="0.7" fill="#ffc46b"/>
  <g stroke="#0b0e20" stroke-linecap="round" fill="none"><path d="M-2 0.4L-1 -3.4L1 -5.6" stroke-width="2.2"/><path d="M2.6 0.4L3 -3.2L1 -5.6" stroke-width="2.2"/><path d="M1 -5.6L2.6 -9" stroke-width="3"/></g>
  <circle cx="3.6" cy="-10.6" r="2" fill="#0b0e20" stroke="#ffe6bf" stroke-width="0.6"/>
</g>
<g stroke="#ffe6bf" stroke-width="0.8" fill="none" opacity="0.85" stroke-linecap="round"><path d="M20 46l3 1.6 3-1.6"/><path d="M28 40l2.4 1.3 2.4-1.3"/><path d="M14 40l2 1.1 2-1.1"/></g>
<rect x="18" y="104" width="30" height="3" rx="1" fill="#ffc46b" opacity="0.32"/><rect x="52" y="104" width="16" height="3" rx="1" fill="#ffc46b" opacity="0.2"/>
</svg>`;
}

// GRIDLOCK: a tilted holographic tactical grid over the night city, two ships of light, a beam arcing in from
// off-screen and a bright impact ring where it lands; steel-blue glass, signal-orange fire
function gridlock() {
  const lines = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    lines.push(`<line x1="${20 + t * 80}" y1="46" x2="${8 + t * 104}" y2="106"/>`);
    const y = 46 + t * 60, xl = 20 - t * 12, xr = 100 + t * 12;
    lines.push(`<line x1="${xl}" y1="${y}" x2="${xr}" y2="${y}"/>`);
  }
  return `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<radialGradient id="gl-bg" cx="0.5" cy="0.2" r="0.95"><stop offset="0" stop-color="#15224a"/><stop offset="0.6" stop-color="#070b1e"/><stop offset="1" stop-color="#03040c"/></radialGradient>
<linearGradient id="gl-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb2ff" stop-opacity="0.22"/><stop offset="1" stop-color="#7fb2ff" stop-opacity="0.05"/></linearGradient>
<linearGradient id="gl-beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7a2a" stop-opacity="0"/><stop offset="1" stop-color="#ffd0a0"/></linearGradient>
${glow('gl-glow', 2)}${glow('gl-glow2', 4)}</defs>
<rect width="120" height="120" fill="url(#gl-bg)"/>
<g fill="#ffd9a0" opacity="0.5">${[[8, 112], [20, 108], [34, 114], [52, 110], [70, 115], [88, 109], [104, 113], [114, 108]].map(([x, y]) => `<rect x="${x}" y="${y}" width="2" height="2"/>`).join('')}</g>
<polygon points="20,46 100,46 112,106 8,106" fill="url(#gl-glass)" stroke="#9fc3ff" stroke-width="1.2" stroke-opacity="0.9" filter="url(#gl-glow)"/>
<g stroke="#7fb2ff" stroke-opacity="0.35" stroke-width="0.7">${lines.join('')}</g>
<g filter="url(#gl-glow)"><rect x="30" y="58" width="28" height="6" rx="2" fill="#0b1230" stroke="#8fd8ff" stroke-width="1.2"/><rect x="33" y="60.5" width="22" height="1" fill="#8fd8ff" opacity="0.9"/>
<rect x="62" y="82" width="7" height="18" rx="2" fill="#0b1230" stroke="#8fd8ff" stroke-width="1.2"/><rect x="65" y="85" width="1" height="12" fill="#8fd8ff" opacity="0.9"/></g>
<path d="M-4 22C30 6 62 20 84 70" stroke="url(#gl-beam)" stroke-width="2.4" fill="none" stroke-linecap="round" filter="url(#gl-glow)"/>
<circle cx="84" cy="70" r="9" fill="none" stroke="#ff9a5c" stroke-width="1.4" opacity="0.8" filter="url(#gl-glow2)"/>
<circle cx="84" cy="70" r="3.5" fill="#fff1e0" filter="url(#gl-glow2)"/>
<g stroke="#ff7a2a" stroke-width="1.2" stroke-linecap="round" opacity="0.9"><path d="M78 64l-5-5M90 64l5-5M78 76l-5 5M90 76l5 5"/></g>
<rect x="18" y="26" width="30" height="3" rx="1" fill="#7fb2ff" opacity="0.28"/><rect x="52" y="26" width="14" height="3" rx="1" fill="#7fb2ff" opacity="0.18"/>
</svg>`;
}

// HIGH STAKES: the back room — emerald felt under a warm lamp, a gold-edged card turned up, a stack of chips
const STAKES = `<svg viewBox="0 0 120 120" aria-hidden="true"><defs>
<radialGradient id="ha-felt" cx="0.5" cy="0.35" r="0.85"><stop offset="0" stop-color="#17855a"/><stop offset="0.55" stop-color="#0a4a30"/><stop offset="1" stop-color="#021009"/></radialGradient>
<radialGradient id="ha-lamp" cx="0.5" cy="0.1" r="0.6"><stop offset="0" stop-color="#ffe2a8" stop-opacity="0.55"/><stop offset="1" stop-color="#ffb860" stop-opacity="0"/></radialGradient>
<linearGradient id="ha-card" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#e8dcbc"/></linearGradient>
<linearGradient id="ha-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1c8"/><stop offset="0.5" stop-color="#f2c869"/><stop offset="1" stop-color="#a8731f"/></linearGradient>
<linearGradient id="ha-back" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f6a44"/><stop offset="1" stop-color="#062a1a"/></linearGradient>
${glow('ha-glow', 1.8)}</defs>
<rect width="120" height="120" fill="url(#ha-felt)"/><rect width="120" height="120" fill="url(#ha-lamp)"/>
<path d="M28 0h64l-8 9H36z" fill="#16100a"/><ellipse cx="60" cy="9" rx="24" ry="3.5" fill="#ffe8b8" filter="url(#ha-glow)"/>
<g transform="rotate(-14 46 62)"><rect x="27" y="34" width="38" height="54" rx="4" fill="url(#ha-back)" stroke="url(#ha-gold)" stroke-width="1.6"/>
<path d="M31 38l30 46M61 38L31 84" stroke="#f2c869" stroke-opacity="0.25" stroke-width="0.8"/></g>
<g transform="rotate(9 68 60)"><rect x="49" y="31" width="38" height="54" rx="4" fill="url(#ha-card)" stroke="url(#ha-gold)" stroke-width="1.8"/>
<rect x="52" y="34" width="32" height="48" rx="2.5" fill="none" stroke="#c99234" stroke-width="0.7"/>
<path d="M68 45c6 6 9 9 9 13a5 5 0 0 1-8 4l2 6h-6l2-6a5 5 0 0 1-8-4c0-4 3-7 9-13z" fill="#0f6a44"/>
<text x="55" y="42" font-family="Georgia,serif" font-size="7" font-weight="700" fill="#8a2c4c">H</text></g>
<g filter="url(#ha-glow)" opacity="0.5"><ellipse cx="88" cy="99" rx="15" ry="5" fill="#f2c869"/></g>
<g>${[0, 1, 2, 3, 4].map(i => `<ellipse cx="88" cy="${104 - i * 4.4}" rx="14" ry="4.6" fill="${i % 2 ? '#16161a' : '#6d1f3a'}" stroke="#f2c869" stroke-width="0.9" stroke-dasharray="3 2.4"/>`).join('')}
<ellipse cx="88" cy="86.4" rx="14" ry="4.6" fill="#d9a93a" stroke="#fff4d2" stroke-width="0.9" stroke-dasharray="3 2.4"/><ellipse cx="88" cy="86.4" rx="7" ry="2.3" fill="#f6d27a"/></g>
<g>${[0, 1, 2].map(i => `<ellipse cx="22" cy="${106 - i * 4.4}" rx="12" ry="4" fill="#0f6e48" stroke="#f4efe0" stroke-width="0.8" stroke-dasharray="2.6 2.2"/>`).join('')}</g>
</svg>`;

const ART = { stakes: () => STAKES, gridlock, slip, prism, overclock, golf: () => GOLF, pulse: () => PULSE, cipher, signal: () => SIGNAL, bluff: () => BLUFF, agent };

/** Just the SVG (e.g. the How to Play tabs). */
export const gameArtSvg = id => (ART[id] ? svgEl(ART[id]()) : null);

/** The card's artwork tile, or null for a game without art (falls back to its initials). */
export function gameArt(id) {
  const make = ART[id];
  return make ? h('div.gc-glyph.gc-art', svgEl(make())) : null;
}
