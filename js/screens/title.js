// NEON SPEAKEASY — the front door.
//
// A night city (district/scene.js) behind a neon sign and a short menu. The opening sequence:
//   1. TAP TO ENTER (first visit on this device): the district in near-darkness, rain, a few dim lights.
//      The tap unlocks audio (iPhone needs a gesture) — the menu music fades in from it.
//   2. POWER-ON: windows light up in a sweep from the street up, billboards boot, the haze takes the colour.
//   3. The sign powers on like real neon: a flicker per letter with a hum and crackle, then a steady glow,
//      its light shimmering on the wet street.
//   4. The menu eases in.  The full sequence (≈ 3.4 s) plays on every visit — the TAP TO ENTER gate only on a
//      device's first visit; stepping back from the name / profile screen gets a quick ≈ 1.2 s re-light. Any tap skips. Reduced effects / prefers-reduced-motion: simple fades.
// The dock — THE NEON RING: one floating glass bar, JOIN · BOARD · [HOST] · GAMES · YOU. HOST is a raised neon ring in
// the sign's colours (always lit); JOIN opens a glass panel with four hush-word boxes (paste, auto-join on the 4th letter, ?room=
// pre-fills); REJOIN floats above the bar when a saved room couldn't be reached; YOU opens the membership card.
// Test hook: window.__district.
import { h, reducedMotion } from '../ui/dom.js';
import { step } from '../core/ranks.js';
import { avatar } from '../ui/components.js';
import { gameArt, gameArtSvg } from '../ui/game-art.js';
import { logoSvg, anchorsSvg, TAGLINE } from '../ui/logo.js';
import { openHelp } from '../ui/help.js';
import { APP_NAME, GAMES, MIN_PLAYERS, MAX_PLAYERS, colorHex } from '../config.js';
import { setState } from '../store.js';
import { slot, loadProfile, useEmulator, loadMe } from '../identity.js';
import { rankBadge, emblem, RANK_COLORS } from '../ui/emblems.js';
import { primaryBoard, fmtValue } from '../core/boards.js';
import { createRoom, joinRoom } from '../room.js';
import { firebaseReady } from '../firebase.js';
import { GAME_MODULES } from '../games/registry.js';
import { settings } from '../audio/settings.js';
import { sfx } from '../audio/sfx.js';
import { neonPowerOn, neonTick, neonFlicker, neonDropout, neonCatch, neonHumFade, neonPreload, startRain, thunder, cityPowerOn, fireworkBurst, knock } from '../audio/ambience.js';
import { beatSource } from '../audio/beat.js';
import { isUnlocked } from '../audio/engine.js';
import { createDistrict } from './district/scene.js';
// CITY 2.0 — THE HARBOR (docs/harbor.md): only with ?city=2 in the URL (never saved anywhere); without it nothing is loaded
const createHarbor = /[?&]city=2(?:&|$)/.test(location.search) ? (await import('./harbor/scene.js')).createHarbor : null;
import { captureBackdrop } from './district/backdrop.js';
import { neonPlan, neonState, neonNext } from './district/neon-ramp.js';
import { createDock, dressCorners, ICON } from './title-dock.js';

const ACC = { rum: '#f0c75e', stakes: '#f2c869', overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#d6f0ff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2' };
const SEEN = 'nd:entered';      // localStorage: this device has been through the door before
const BACK = 'nd:back';          // sessionStorage: just stepped back from the name / profile screen (a quick re-light)
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const store = (s, k, v) => { try { if (v === undefined) return s.getItem(k); s.setItem(k, v); } catch { /* private mode */ } return null; };

// the sequences (seconds from the start). wave = window lights climbing, lit = the city's glow, bill = billboards,
// logo = when the sign starts, steady = when it holds, menu = when the menu starts easing in
const FULL = { wave: [0.04, 1.6], lit: [0.04, 1.8], bill: [1.0, 1.8], logo: 1.4, steady: 2.2, menu: 2.25, end: 3.4 };
const SHORT = { wave: [0, 0.6], lit: [0, 0.7], bill: [0.25, 0.65], logo: 0.15, steady: 0.55, menu: 0.45, end: 1.2 };
const INSTANT = { wave: [0, 0.01], lit: [0, 0.01], bill: [0, 0.01], logo: 0, steady: 0, menu: 0, end: 0.4 };
const smooth = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a || 1e-6))); return t * t * (3 - 2 * t); };
// the light wave answers the tap at once and slows as it reaches the rooftops
const easeOut = (a, b, v) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a || 1e-6))); return 1 - Math.pow(1 - t, 2.4); };

// Halloween: a fine orb web in the sign's corner, its dew beads catching the pink neon, and a spider on a silk line that
// drops from the tube, hangs a while and climbs back (built once, here, as SVG: spokes + a sagging spiral + beads)
function orbWeb() {
  const C = [58, 50], spokes = [];
  const anchors = [[0, 0], [30, 0], [68, 0], [112, 0], [160, 0], [0, 30], [0, 74], [0, 118], [48, 128], [104, 110], [150, 64]];
  for (const [x, y] of anchors) spokes.push([x, y, Math.atan2(y - C[1], x - C[0])]);
  spokes.sort((p, q) => p[2] - q[2]);
  let d = spokes.map(([x, y]) => `M${C[0]} ${C[1]}L${x} ${y}`).join('');
  const beads = [];
  for (let k = 1; k <= 9; k++) {
    const f = k / 10.4;
    const pts = spokes.map(([x, y]) => [C[0] + (x - C[0]) * f, C[1] + (y - C[1]) * f]);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if (Math.abs(spokes[i][2] - spokes[(i + 1) % pts.length][2]) > Math.PI * 0.9) continue;
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const cx = mx + (C[0] - mx) * 0.12, cy = my + (C[1] - my) * 0.12 + 1.2;
      d += `M${p[0].toFixed(1)} ${p[1].toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
      if ((k * 7 + i * 3) % 5 === 0) beads.push([mx * 0.6 + cx * 0.4, my * 0.6 + cy * 0.4, 0.9 + ((k + i) % 3) * 0.35]);
    }
  }
  return `<svg viewBox="0 0 170 140" aria-hidden="true"><defs><radialGradient id="ndw-b"><stop offset="0" stop-color="#fff"/><stop offset="0.45" stop-color="#ffd2ec"/><stop offset="1" stop-color="#ff5fb4" stop-opacity="0"/></radialGradient>
<linearGradient id="ndw-s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.75"/><stop offset="1" stop-color="#ffc6e8" stop-opacity="0.25"/></linearGradient></defs>
<path d="${d}" fill="none" stroke="url(#ndw-s)" stroke-width="0.42" stroke-linecap="round"/>
${beads.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 1.9).toFixed(2)}" fill="url(#ndw-b)" opacity="0.8"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(r * 0.45).toFixed(2)}" fill="#fff"/>`).join('')}
</svg>`;
}
const WEBS = orbWeb();
// the spider: a glossy black body, eight jointed legs, two tiny ember eyes
const SPIDER = `<svg viewBox="-20 -20 40 44" aria-hidden="true"><defs><radialGradient id="nds-a" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#4a3a5a"/><stop offset="0.35" stop-color="#14101c"/><stop offset="1" stop-color="#050308"/></radialGradient></defs>
<g fill="none" stroke="#0c0910" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M-3 0 L-10 -7 L-16 -2"/><path d="M-3 2 L-12 -2 L-18 5"/><path d="M-3 4 L-11 6 L-16 14"/><path d="M-2 5 L-7 11 L-10 19"/>
<path d="M3 0 L10 -7 L16 -2"/><path d="M3 2 L12 -2 L18 5"/><path d="M3 4 L11 6 L16 14"/><path d="M2 5 L7 11 L10 19"/></g>
<ellipse cx="0" cy="11" rx="6.4" ry="8" fill="url(#nds-a)"/><ellipse cx="0" cy="1" rx="4.2" ry="3.8" fill="url(#nds-a)"/>
<ellipse cx="-1.8" cy="7.6" rx="1.6" ry="2.4" fill="#fff" opacity="0.18"/>
<circle cx="-1.3" cy="-1.6" r="0.75" fill="#ff7a3a"/><circle cx="1.3" cy="-1.6" r="0.75" fill="#ff7a3a"/></svg>`;
// Christmas: a velvet Santa hat slung over the first N, its tip flopping over the side; folds in the velvet, a fluffy
// fur brim and pom-pom built from soft tufts, the pink neon catching its edge, snow resting in the creases
function santaHat() {
  // fur tufts along the brim and around the pom-pom (deterministic)
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const tufts = [];
  for (let i = 0; i <= 26; i++) {
    const u = i / 26, x = 10 + u * 104, y = 98 - Math.sin(u * Math.PI) * 9 + (rnd() - 0.5) * 2;
    for (const dy of [-6, 0, 6]) tufts.push([x + (rnd() - 0.5) * 3, y + dy + (rnd() - 0.5) * 3, 5.2 + rnd() * 2.6]);
  }
  for (let i = 0; i < 22; i++) { const a = rnd() * Math.PI * 2, d = rnd() * 8; tufts.push([150 + Math.cos(a) * d, 80 + Math.sin(a) * d, 4.6 + rnd() * 2.8]); }
  const fur = tufts.map(([x, y, r]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}"/>`).join('');
  const hi = tufts.filter((_, i) => i % 3 === 0).map(([x, y, r]) => `<circle cx="${(x - r * 0.3).toFixed(1)}" cy="${(y - r * 0.35).toFixed(1)}" r="${(r * 0.45).toFixed(1)}"/>`).join('');
  return `<svg viewBox="0 0 170 128" aria-hidden="true"><defs>
<linearGradient id="nh-v" x1="0.1" y1="0.1" x2="0.8" y2="1"><stop offset="0" stop-color="#e2253f"/><stop offset="0.45" stop-color="#b0102c"/><stop offset="1" stop-color="#5e0614"/></linearGradient>
<linearGradient id="nh-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="0.6" stop-color="#eef0f6"/><stop offset="1" stop-color="#b9bfd2"/></linearGradient>
<radialGradient id="nh-p" cx="0.38" cy="0.32" r="0.75"><stop offset="0" stop-color="#ffffff"/><stop offset="0.7" stop-color="#e8ebf3"/><stop offset="1" stop-color="#aeb5ca"/></radialGradient>
<filter id="nh-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="0.6"/></filter>
<filter id="nh-rim" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter></defs>
<g transform="translate(0 0)">
<!-- the crown: a slouched cone, the tip flopping over to the right -->
<path d="M14 98 C18 56 46 20 88 14 C118 10 146 30 152 64 C153 70 148 74 144 70 C138 54 126 44 118 54 C113 64 114 84 116 98 Z" fill="url(#nh-v)"/>
<!-- the underside of the flop, in shadow -->
<path d="M118 54 C126 44 138 54 144 70 C134 60 124 56 118 62 Z" fill="#6a0618" opacity="0.5"/>
<!-- folds and the velvet's sheen -->
<path d="M64 22 C58 46 60 74 66 96" stroke="#4a0410" stroke-width="8" opacity="0.3" fill="none" filter="url(#nh-rim)"/>
<path d="M36 72 C44 46 62 28 92 20" stroke="#ff8a9a" stroke-width="3.4" opacity="0.4" fill="none" filter="url(#nh-rim)"/>
<path d="M104 18 C124 20 140 34 146 52" stroke="#ff9aa8" stroke-width="2.4" opacity="0.35" fill="none" filter="url(#nh-rim)"/>
<!-- the sign's light on the left edge -->
<path d="M14 98 C18 56 46 20 88 14" stroke="#ff4fb0" stroke-width="3" opacity="0.7" fill="none" filter="url(#nh-rim)"/>
<!-- the fur brim and the pom-pom -->
<g fill="url(#nh-f)" filter="url(#nh-soft)">${fur}</g>
<g fill="#ffffff" opacity="0.55" filter="url(#nh-soft)">${hi}</g>
<circle cx="150" cy="80" r="9" fill="url(#nh-p)" opacity="0.9" filter="url(#nh-soft)"/>
<path d="M10 100 C40 112 84 114 116 100" stroke="#ff4fb0" stroke-width="2.4" opacity="0.45" fill="none" filter="url(#nh-rim)"/>
</g></svg>`;
}
const HAT = santaHat();

// Halloween / St. Patrick's: the O of NEON becomes a neon jack-o'-lantern / a four-leaf clover, bent in the same glass tube
// as the letters (glass, two glows, body, white-hot core, highlight, electrode caps), so it powers on, flickers and takes the
// holiday colours like them. Drawn in the O's own box (0..64 × 0..100). Parts: [d, width, colour-vars | null]
const O_ALT = {
  halloween: [
    // the body: a squat pumpkin with a dimple at the top, and two rib lines
    ['M32 30 C26 24 14 25 7 36 C0 47 0 74 9 87 C16 97 26 100 32 97 C38 100 48 97 55 87 C64 74 64 47 57 36 C50 25 38 24 32 30', 7, null, 'translate(32 100) scale(1.24) translate(-32 -100)'],
    ['M24 31 C17 45 17 82 25 97 M40 31 C47 45 47 82 39 97', 3.2, null, 'translate(32 100) scale(1.24) translate(-32 -100)'],
    // the carved face: triangle eyes, a nose, a toothy grin
    ['M14 55 L22 45 L28 57 Z M50 55 L42 45 L36 57 Z', 3.6, '--g:#ffcf4a;--b:#ffe07a;--c:#fffbe8', 'translate(32 100) scale(1.24) translate(-32 -100)'],
    ['M30 66 L32 61 L34 66 Z', 3, '--g:#ffcf4a;--b:#ffe07a;--c:#fffbe8', 'translate(32 100) scale(1.24) translate(-32 -100)'],
    ['M13 72 Q32 90 51 72 L47 79 L42 74 L37 81 L32 75 L27 81 L22 74 L17 79 Z', 3.4, '--g:#ffcf4a;--b:#ffe07a;--c:#fffbe8', 'translate(32 100) scale(1.24) translate(-32 -100)'],
    // the stem and a curling vine
    ['M31 29 C30 20 33 12 39 8 M34 18 C40 21 47 18 50 11 C52 7 49 4 46 6', 4.2, '--g:#3ddc6a;--b:#7dff9c;--c:#efffe9', 'translate(32 100) scale(1.24) translate(-32 -100)'],
  ],
  stpatrick: [
    // four heart-shaped leaves round the centre, a slender stem
    ...[45, 135, 225, 315].map(a => [`M32 54 C27 47 15 44 15 34 C15 26 25 24 29 31 C30 33 31 34 32 36 C33 34 34 33 35 31 C39 24 49 26 49 34 C49 44 37 47 32 54`, 5.2, null, `translate(32 46) scale(1.72) translate(-32 -54) rotate(${a} 32 54)`]),
    ['M32 50 C36 66 33 84 22 100', 5.4, null],
  ],
};
function swapO(svg, kind) {
  const g = svg && svg.querySelector('.ndl-3');
  if (!g) return;
  if (!g.dataset.orig) g.dataset.orig = g.innerHTML;
  if (!kind) { if (g.dataset.kind) { g.innerHTML = g.dataset.orig; delete g.dataset.kind; } return; }
  if (g.dataset.kind === kind) return;
  const filt = (g.querySelector('.ndl-glow1') || {}).getAttribute ? g.querySelector('.ndl-glow1').getAttribute('filter') : '';
  const filt2 = g.querySelector('.ndl-glow2') ? g.querySelector('.ndl-glow2').getAttribute('filter') : '';
  const parts = O_ALT[kind];
  const paths = (cls, extra) => parts.map(([d, w, vars, tf]) => `<path class="${cls}" d="${d}" ${tf ? `transform="${tf}"` : ''} ${vars ? `style="${vars}"` : ''} stroke-width="${extra(w)}"/>`).join('');
  const tube = (cls, extra) => cls.includes('glow') ? `<g filter="${cls.includes('glow1') ? filt : filt2}"><rect x="-30" y="-30" width="124" height="160" fill="none" stroke="none"/>${paths(cls, extra)}</g>` : paths(cls, extra);
  g.innerHTML = `<g class="ndl-glass-g">${parts.map(([d, w, v, tf]) => `<path class="ndl-glass" d="${d}" ${tf ? `transform="${tf}"` : ''} stroke="#40243a" stroke-width="${w + 2}"/>`).join('')}</g>
<g class="ndl-light">${tube('ndl-glow2', w => w + 12)}${tube('ndl-glow1', w => w + 3.5)}${tube('ndl-body', w => w)}${tube('ndl-core', w => w * 0.36)}
${parts.map(([d, w, v, tf]) => `<path class="ndl-hi" d="${d}" ${tf ? `transform="${tf}"` : ''} stroke="#ffffff" stroke-width="0.6" opacity="0.3"/>`).join('')}</g>`;
  // inline colour vars on the parts that need them (eyes, stem): set on the <path>s, which read var(--g/--b/--c)
  g.querySelectorAll('path[style]').forEach(p => { p.style.cssText = p.getAttribute('style'); });
  g.dataset.kind = kind;
}


// Christmas: a string of glass C9 bulbs wound round the sign's own tubes. The wire spirals along each letter's tube path
// (traced from the live SVG), passing in front of the glass and behind it; at every turn a bulb hangs off the side of the
// tube, drooping a little under its weight; between letters the wire sags in a swag with a few bulbs. k: how many are lit.
function xmasWrapSvg(svg, k) {
  const vb = svg.getAttribute('viewBox');
  const P = 23, A = 8.2, R = 5.4;             // turn length, wire swing (tube radius 4.5 + a little), what the glass hides
  const COLS = ['#ff3b4e', '#2fe07a', '#ffc94a', '#4ea3ff', '#fff1d6'];
  const back = [], front = [], bulbs = [];
  const ends = [];
  let bi = 0;
  for (const g of svg.querySelectorAll('.ndl')) {
    const tx = +((g.getAttribute('transform') || '').match(/translate\(([-\d.]+)/) || [0, 0])[1];
    const path = g.querySelector('.ndl-body');
    if (!path) continue;
    const len = path.getTotalLength();
    const pt = d => { const q = path.getPointAtLength(Math.max(0, Math.min(len, d))); return [q.x + tx, q.y]; };
    let segF = [], segB = [], prev = null, first = null, last = null;
    const flush = () => { if (segF.length > 1) front.push(segF); if (segB.length > 1) back.push(segB); segF = []; segB = []; };
    for (let d = 0; d <= len; d += 1.4) {
      const p = pt(d), a = pt(d - 1), b = pt(d + 1);
      if (prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 4) flush();          // a jump between the tube's strokes
      prev = p;
      let tX = b[0] - a[0], tY = b[1] - a[1]; const tl = Math.hypot(tX, tY) || 1; tX /= tl; tY /= tl;
      const nX = -tY, nY = tX;
      const ph = (d / P) * Math.PI * 2, off = A * Math.sin(ph), z = Math.cos(ph);
      const w = [p[0] + nX * off, p[1] + nY * off];
      if (!first) first = w; last = w;
      if (z >= 0) { if (segB.length > 1) back.push(segB); segB = []; segF.push(w); }
      else { if (segF.length > 1) front.push(segF); segF = []; if (Math.abs(off) > R) segB.push(w); else { if (segB.length > 1) back.push(segB); segB = []; } }
      // a bulb at each turn, hanging off the side the wire is on (alternating), drooping under its weight
      const turn = (d / P) % 1, prevTurn = ((d - 1.4) / P) % 1;
      if (d > 4 && d < len - 4 && ((turn >= 0.25 && prevTurn < 0.25) || (turn >= 0.75 && prevTurn < 0.75))) {
        const side = turn < 0.5 ? 1 : -1;
        let vx = nX * side * 0.65, vy = nY * side * 0.65 + 0.55; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;
        if ((bi++) % 2 === 0) bulbs.push({ x: w[0], y: w[1], ang: Math.atan2(vy, vx) * 180 / Math.PI - 90 });
      }
    }
    flush();
    ends.push({ first, last });
  }
  // swags between the letters: from the bottom of one to the bottom of the next
  const swags = [];
  const bottoms = [...svg.querySelectorAll('.ndl')].map(g => +((g.getAttribute('transform') || '').match(/translate\(([-\d.]+)/) || [0, 0])[1]);
  for (let i = 0; i < bottoms.length - 1; i++) {
    const x0 = bottoms[i] + 60, x1 = bottoms[i + 1] + 4, y = 102, sag = 13;
    const pts = []; for (let j = 0; j <= 16; j++) { const t = j / 16; pts.push([x0 + (x1 - x0) * t, y + Math.sin(Math.PI * t) * sag]); }
    swags.push(pts);
    for (const t of [0.3, 0.7]) bulbs.push({ x: x0 + (x1 - x0) * t, y: y + Math.sin(Math.PI * t) * sag, ang: 0 });
  }
  const d = segs => segs.map(sg => 'M' + sg.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L')).join(' ');
  const order = bulbs.map((_, i) => ((i * 7919 + 13) % 97) / 97);
  const defs = COLS.map((hot, i) => `<radialGradient id="ndw-b${i}" cx="0.38" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff"/><stop offset="0.3" stop-color="${hot}"/><stop offset="1" stop-color="${hot}" stop-opacity="0.88"/></radialGradient>
<radialGradient id="ndw-g${i}"><stop offset="0" stop-color="${hot}" stop-opacity="0.6"/><stop offset="0.45" stop-color="${hot}" stop-opacity="0.16"/><stop offset="1" stop-color="${hot}" stop-opacity="0"/></radialGradient>
<linearGradient id="ndw-d${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hot}" stop-opacity="0.55"/><stop offset="1" stop-color="#0b0710" stop-opacity="0.9"/></linearGradient>`).join('');
  const bulbSvg = bulbs.map((b, i) => {
    const c = i % COLS.length, on = order[i] < k;
    const tw = on && i % 6 === 3 ? ` class="nd-xb-tw" style="animation-delay:${(-((i * 1.37) % 4)).toFixed(2)}s"` : '';
    return `<g transform="translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) rotate(${b.ang.toFixed(0)}) scale(0.9)">${on ? `<circle cx="0" cy="8" r="12" fill="url(#ndw-g${c})"${tw}/>` : ''}
<rect x="-1.8" y="-0.4" width="3.6" height="3.8" rx="0.7" fill="#1a3a22"/><rect x="-1.8" y="1.2" width="3.6" height="0.6" fill="#0c1f12"/>
<path d="M-2.3 3.3 C-3.7 6 -3.3 9.6 0 11.8 C3.3 9.6 3.7 6 2.3 3.3 Z" fill="url(#ndw-${on ? 'b' : 'd'}${c})"/>
<path d="M-1.4 4.4 C-2 6.4 -1.8 8.4 -0.6 9.6" stroke="#fff" stroke-width="0.55" fill="none" stroke-linecap="round" opacity="${on ? 0.8 : 0.3}"/></g>`;
  }).join('');
  return `<svg viewBox="${vb}" aria-hidden="true"><defs>${defs}</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="${d(back)}" stroke="#0b1d10" stroke-width="0.9" opacity="0.55"/>
<path d="${d(swags)}" stroke="#0e2414" stroke-width="1.05"/>
<path d="${d(front)}" stroke="#0e2414" stroke-width="1.25"/>
<path d="${d(front)}" stroke="rgba(180,255,200,0.18)" stroke-width="0.4" transform="translate(-0.3 -0.3)"/>
</g>${bulbSvg}</svg>`;
}


// the colour each holiday's sign throws on the haze and the wet street
// the dock's neon line icons, each drawn twice: the tube (its colour, glowing) and a thin white-hot core on top
const SIGN_LIGHT = { halloween: '#ff8a2a', christmas: '#ff3048', nye: '#ffd27a', valentine: '#ff4f8a', stpatrick: '#3dff8b', easter: '#c9a2ff', thanksgiving: '#ffa040', july4: '#5a8cff' };

export function createTitle() {
  const els = {};
  let scene = null;
  let stopRain = null;
  let tl = null;                 // { plan, t0, raf, kind }
  let remote = null, remoteT = 0;  // CITY 2.0 only: THE PREVIEW PANEL (harbor/remote.js), loaded after the first paint
  let flickerTimer = 0;
  let destroyed = false;
  let busy = false;
  let st = null;
  const reduced = () => !!settings.reducedFx || reducedMotion();

  function mount(el, state) {
    st = state;
    el.classList.add('title-screen', 'nd');
    document.body.classList.add('nd-on');
    dressCorners(true);
    // the city: fixed behind everything, full viewport (the screen column is narrower on desktop)
    els.sceneWrap = h('div.nd-scene', { 'aria-hidden': 'true' }, els.canvas = h('canvas'));
    document.body.prepend(els.sceneWrap);
    // (City 2.0 starts every phone at tier 2 — iOS reports a capped core count, so the old guess put every iPhone at tier 1 while it
    // ran the Harbor in 1–3 ms; the Harbor's own step-down still protects a slow phone: docs/harbor.md#performance)
    scene = (createHarbor || createDistrict)(els.canvas, { games: GAMES, tier: createHarbor ? 2 : (window.devicePixelRatio || 1) > 2.5 && (navigator.hardwareConcurrency || 8) <= 4 ? 1 : 2 });
    scene.set({ motion: reduced() ? 0 : 1 });
    // a lightning strike: thunder a few seconds later, the glass of the dock catches the flash
    scene.set({ onFlash: e => { if (destroyed) return; thunder(e); flashGlass(e.near); } });
    // PARTY NIGHTS: the beat the city breathes to, the finale's distant thumps, and the party's numbers for the CSS (the sign,
    // SPEAKEASY and the rings breathe through custom properties on the root: one style write a frame)
    scene.set({ beat: beatSource, onBurst: () => { if (!destroyed) fireworkBurst({ delay: 0.25 + Math.random() * 0.15, level: 0.9 }); }, onParty: partyFrame });
    // CITY 2.0: THE PREVIEW PANEL (docs/harbor.md) — everyone on ?city=2 follows the owner's city2/live; she gets the TEST pill.
    // Loaded 1.5 s after the city starts (never in the title's first second); the default city never requests it.
    if (createHarbor) remoteT = setTimeout(() => { if (!destroyed) import('./harbor/remote.js').then(m => { if (!destroyed && scene) remote = m.createRemote({ scene: () => scene }); }).catch(e => console.warn('preview panel', e)); }, 1500);

    // the sign is there from the start, dark (glass tubes only, like the boot screen); the power-on lights it
    els.sign = h('div.nd-sign', { class: 'is-glass' },
      h('div.nd-bloom', { 'aria-hidden': 'true' }),   // PARTY NIGHTS: the logo's breath, behind the letters
      h('div.nd-logo-wrap', { html: logoSvg({ id: 'ndt', title: APP_NAME, premium: !!createHarbor }) + (createHarbor && /[?&]force=[^&]*anchors/.test(location.search) ? anchorsSvg() : '') }),
      h('div.nd-word', h('span.nd-word-g', 'SPEAKEASY', h('span.nd-word-s', { 'aria-hidden': 'true' }, 'SPEAKEASY'), createHarbor ? h('span.nd-word-p', { 'aria-hidden': 'true' }, 'SPEAKEASY') : null)),
      h('div.nd-tag', TAGLINE),
      els.sub = h('div.nd-sub', `${GAMES.filter(g => g.playable).length} PARTY GAMES · ONE PHONE EACH`));
    els.actions = buildActions();
    { const st0 = neonNow(); if (!st0.caught) { els.sign.classList.add('is-day'); if (st0.stage !== 'goodbye') els.actions.classList.add('is-daylit'); } }
    els.gate = h('button.nd-gate', { type: 'button', 'aria-label': 'Tap to enter', onclick: enter },
      h('span.nd-gate-txt', 'TAP TO ENTER'),
      h('span.nd-gate-sub', 'BEST WITH SOUND ON'));
    el.append(
      h('div.nd-corner', slot !== '1' ? h('span.tag.tag-you', `TEST SLOT ${slot}`) : null),
      els.sign,
      h('div.nd-city'),
      els.actions,
      els.gate);
    el.addEventListener('pointerdown', onAnyTap, { capture: true });
    els.root = el;
    ringColors();
    requestAnimationFrame(ringColors);
    // the sign's text boxes for the scene at once (not only after the intro): a phone's sun hangs its arch off the words and
    // the rainbow sits under them — measured once the sign is laid out, then kept in step by trackLogo
    requestAnimationFrame(() => { if (!destroyed) { const tr = textRects(); if (tr) scene.set({ textRects: tr }); } });
    if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitKeyboard); window.visualViewport.addEventListener('scroll', fitKeyboard); }
    window.addEventListener('pointerdown', onWake, { capture: true });
    window.addEventListener('click', onWakeClick, { capture: true });
    window.addEventListener('keydown', onWake, { capture: true });
    window.addEventListener('pointermove', onMouse, { passive: true });
    // city taps come from the touch itself (iOS Safari never sends 'click' to plain page areas like the city)
    window.addEventListener('pointerdown', onCityDown, { passive: true });
    window.addEventListener('pointerup', onCityUp, { passive: true });
    els.probe = h('div', { style: { position: 'fixed', top: '0', left: '0', width: '1px', height: 'var(--safe-t)', visibility: 'hidden', pointerEvents: 'none' } });
    els.probeB = h('div', { style: { position: 'fixed', bottom: '0', left: '0', width: '1px', height: 'var(--safe-b)', visibility: 'hidden', pointerEvents: 'none' } });
    document.body.append(els.probe, els.probeB);
    scene.safeTop(els.probe.offsetHeight);
    scene.safeBottom(els.probeB.offsetHeight);
    setupHook();

    // local test runs (?emu) skip the intro unless they ask for it (&intro=1) — every other E2E just needs the menu
    const testSkip = useEmulator && !/[?&]intro(?![a-z])/.test(location.search);
    const first = !testSkip && !store(localStorage, SEEN);
    // every visit gets the full power-on (the tap screen only the first time: it's there to unlock sound);
    // stepping back from the name / profile screen a moment later gets the quick version
    const back = store(sessionStorage, BACK) === '1';
    try { sessionStorage.removeItem(BACK); } catch { /* fine */ }
    if (first) {
      el.classList.add('is-gated');
      requestAnimationFrame(() => els.gate.classList.add('is-in'));
    } else {
      els.gate.remove();
      if (testSkip) run(INSTANT, 'instant');
      else if (back) run(SHORT, 'short');
      else { if (!reduced()) cityPowerOn(); run(FULL, 'full'); }
    }
    update(state);
  }

  // ------------------------------------------------------------------ the sequence
  function enter() {
    if (tl) return;
    store(localStorage, SEEN, '1');
    els.gate.classList.add('is-out');
    setTimeout(() => els.gate.remove(), 600);
    els.gate.closest('.nd').classList.remove('is-gated');
    if (!reduced()) cityPowerOn();
    run(FULL, 'full');
  }

  function onAnyTap(e) {
    // a tap during the sequence skips to the end (but never swallows a tap on the menu itself)
    if (!tl || tl.done || e.target.closest('.nd-gate')) return;
    if (performance.now() - tl.t0 < 250) return;
    skip();
  }

  function run(plan, kind) {
    const r = reduced();
    tl = { plan: r ? { ...INSTANT, end: 0.7 } : plan, kind: r ? 'reduced' : kind, t0: performance.now(), done: false, marks: {} };
    const root = els.sign.closest('.nd');
    root.classList.add(`seq-${tl.kind}`);
    rainSound();
    armTagline();     // (CITY 2.0: the tagline's 15 s count from the moment the title appears, not from the end of its power-on)
    tick();
  }

  function tick() {
    if (destroyed || !tl) return;
    const p = tl.plan;
    const e = (performance.now() - tl.t0) / 1000;
    scene.set({
      wave: tl.kind === 'reduced' ? 1 : easeOut(p.wave[0], p.wave[1], e) * (e >= p.wave[1] ? 1 : 0.999),
      lit: tl.kind === 'reduced' ? smooth(0, 0.7, e) : easeOut(p.lit[0], p.lit[1], e) * (e >= p.lit[1] ? 1 : 0.999),
      bill: tl.kind === 'reduced' ? smooth(0, 0.7, e) : smooth(p.bill[0], p.bill[1], e),
      logo: logoLevel(e),
      logoRect: logoRect(),
    });
    if (e >= p.wave[1]) scene.set({ wave: 1 });
    if (!tl.marks.logo && e >= p.logo) { tl.marks.logo = true; signOn(); }
    if (!tl.marks.menu && e >= p.menu) { tl.marks.menu = true; els.sign.closest('.nd').classList.add('is-menu'); }
    if (e >= p.end) { finish(); return; }
    tl.raf = requestAnimationFrame(tick);
  }

  function logoLevel(e) {
    if (!tl.marks.logo) return 0;
    return els.sign.classList.contains('is-steady') ? 1 : 0.45;
  }

  function logoRect() {
    const svg = els.sign.querySelector('svg');
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width * 0.07, y: r.top + r.height * 0.18, w: r.width * 0.86, h: r.height * 0.64 };
  }

  // the sign: glass -> per-letter flicker -> steady glow (crackles + hum on the SFX bus)
  function signOn() {
    const s = els.sign;
    const root = s.closest('.nd');
    if (root) root.classList.add('is-dock');
    s.classList.remove('is-off');
    s.classList.add('is-glass');
    const letters = [...s.querySelectorAll('.ndl')];
    // daylight: the sign rests (glass and brackets, unlit) until dusk
    // before the catch (and in the morning goodbye) the city boots but the sign isn't forced on: it joins its stage of the day
    const st0 = neonNow();
    if (!st0.caught) { s.classList.add('is-day'); if (ringsWanted(st0)) ringOn(tl && (tl.kind === 'full' || tl.kind === 'short') ? [[140, true], [210, false], [300, true]] : null); applyNeon(st0, { quiet: true }); return; }
    scene.set({ signPow: null });
    s.classList.remove('is-day');
    const kind = tl.kind;
    if (kind === 'instant' || kind === 'reduced') {
      letters.forEach(l => l.classList.add('on'));
      s.classList.add('is-steady', 'is-warm');
      dockAll(true);
      ringOn(null);
      return;
    }
    const full = kind === 'full';
    // on/off toggles per letter (ms after the sign starts); the O stutters a little longer
    const base = full ? [0, 70, 150, 220] : [0, 40, 80, 120];
    const pattern = full ? [0, 45, 110, 150, 250, 290, 400] : [0, 40, 90];
    const crackles = [];
    letters.forEach((l, i) => {
      const pat = i === 2 && full ? [...pattern.slice(0, -1), 470, 520, 600] : pattern;
      pat.forEach((ms, k) => {
        const at = base[i] + ms;
        setTimeout(() => { if (!destroyed) l.classList.toggle('on', k % 2 === 0); }, at);
        setTimeout(() => dockLight(i, k % 2 === 0), at + 40);
        if (k % 2 === 0 && (k < 3 || i === 2)) crackles.push(at / 1000);
      });
    });
    neonPowerOn({ crackles: crackles.slice(0, full ? 7 : 3), dur: full ? 2.4 : 1.4 });
    const steadyIn = ((tl.plan.steady - tl.plan.logo) * 1000);
    // the ring flickers with the first N (a beat behind it), then holds
    ringOn([...pattern.map((ms, k) => [base[0] + ms + 30, k % 2 === 0]), [steadyIn, true]]);
    setTimeout(() => { if (!destroyed) { letters.forEach(l => l.classList.add('on')); s.classList.add('is-steady'); dockAll(true); } }, steadyIn);
    setTimeout(() => { if (!destroyed) s.classList.add('is-warm'); }, steadyIn + 60);
  }

  function skip() {
    if (!tl || tl.done) return;
    const root = els.sign.closest('.nd');
    root.classList.add('is-skip');
    if (!tl.marks.logo) { tl.marks.logo = true; tl.kind = 'instant'; signOn(); }
    else if (neonNow().caught) { els.sign.querySelectorAll('.ndl').forEach(l => l.classList.add('on')); els.sign.classList.add('is-steady', 'is-warm'); dockAll(true); }
    else applyNeon(neonNow(), { quiet: true });
    dock.resetRing(); if (ringsWanted(neonNow())) ringOn(null); else dock.ringSet(false);
    root.classList.add('is-menu', 'is-dock');
    finish();
  }

  function finish() {
    if (!tl || tl.done) return;
    tl.done = true;
    tl.doneAt = (performance.now() - tl.t0) / 1000;
    cancelAnimationFrame(tl.raf);
    scene.set({ wave: 1, lit: 1, bill: 1, logo: 1 });
    trackLogo();
    scheduleFlicker();
    watchSky();
    neonTick();
    armIdle();
    document.addEventListener('visibilitychange', onVisTitle);
  }

  // CITY 2.0 (docs/harbor.md): THE TAGLINE follows the screen at rest (Part 5, the owner's call): shown on arrival, it fades out
  // together with the dock when the screen goes to rest and comes back with the dock on a tap (opacity only: its rect, and so the
  // city, never move — the scene only hands its band to the sky-low lane while it is gone). Its band is THE TAGLINE SLOT:
  // tagSlot(text, ms) shows a special line there for a while, even at rest (holidays, the countdown, CITY CONTROL).
  // &tagms=N (dev + shots): the tagline alone fades N ms in, as if at rest.
  function armTagline() {
    if (!createHarbor || destroyed) return;
    const ms = +((location.search.match(/[?&]tagms=(\d+)/) || [])[1] || 0);
    clearTimeout(els.tagTimer);
    if (ms) els.tagTimer = setTimeout(() => { if (destroyed) return; els.sign.classList.add('nd-tag-gone'); scene.set({ tagGone: true }); }, ms);
    scene.set({ tagSlot });
  }
  /** City 2.0: the tagline's band is the sky's while the tagline is hidden (at rest, or faded by &tagms) and no message shows */
  function tagState() {
    if (!createHarbor || destroyed || !scene) return;
    const tag = els.sign.querySelector('.nd-tag');
    const msg = tag && tag.classList.contains('nd-tag-msg');
    scene.set({ tagGone: !msg && (els.root.classList.contains('is-idle') || els.sign.classList.contains('nd-tag-gone')) });
  }
  function tagSlot(text, ms = 6000) {
    if (destroyed || !createHarbor) return false;
    const tag = els.sign.querySelector('.nd-tag');
    if (!tag || tag.classList.contains('nd-count')) return false;
    clearTimeout(els.tagSlotTimer);
    tag.textContent = text;
    tag.classList.add('nd-tag-msg');
    els.sign.classList.remove('nd-tag-gone'); tagState();
    els.tagSlotTimer = setTimeout(() => {
      if (destroyed) return;
      // the message fades out; then the tagline is back in its place (shown with the dock, hidden at rest)
      els.sign.classList.add('nd-tag-gone');
      els.tagSlotTimer = setTimeout(() => {
        if (destroyed) return;
        tag.classList.remove('nd-tag-msg');
        if (!tag.classList.contains('nd-count')) tag.textContent = TAGLINE;
        els.sign.classList.remove('nd-tag-gone'); tagState();
      }, 2600);
    }, ms);
    return true;
  }

  // LIVING CITY: the sign follows the hour (off at dawn like closing time, back on at dusk tube by tube) and wears the
  // holiday (cobwebs, a Santa hat, the New Year countdown, rose / green tubes)
  function watchSky() {
    if (destroyed || !scene) return;
    // (a hidden page — the phone locked, another app in front — does none of this; visibilitychange re-arms it at once)
    if (document.visibilityState !== 'visible') { els.skyTimer = setTimeout(watchSky, 5000); return; }
    dressSign(scene.look());
    premiumLogo(scene.look());
    els.root.classList.toggle('nd-noblur', (scene.tier ? scene.tier() : 2) === 0);
    tintGlass();
    snowOnSign();
    rainSound();
    tagShade();
    els.skyTimer = setTimeout(watchSky, 1000);
  }
  // CITY 2.0 (NEON PASS 2): the sun + the moon may pass behind the tagline — while a bright disc is behind it, a soft shadow behind
  // its letters keeps it readable (no box; only where needed)
  function tagShade() {
    if (!createHarbor) return;
    const tag = els.sign && els.sign.querySelector('.nd-tag');
    if (!tag) return;
    const r = tag.getBoundingClientRect(), s = scene.sun && scene.sun(), m = scene.moonAt && scene.moonAt();
    const near = d => d && d.x + d.r * 1.6 > r.left && d.x - d.r * 1.6 < r.right && d.y + d.r * 1.6 > r.top && d.y - d.r * 1.6 < r.bottom;
    tag.classList.toggle('nd-tag-shade', !!((s && (s.vis == null || s.vis > 0.1) && near(s)) || near(m)));
  }
  // CITY 2.0's premium logo (logo.js#premiumBits): the glass highlight leans toward the light — the real sun's side by day, a
  // little left at night — moving with the sun through the day; a faint flutter now and then in one lit tube's core (rare and
  // brief: each is one repaint of the sign)
  let hiKey = '';
  function premiumLogo(L) {
    if (!createHarbor || !L) return;
    const svg = els.sign.querySelector('svg.nd-logo');
    if (!svg) return;
    const az = L.sun ? L.sun.az : 180, el = L.sun ? L.sun.el : -10, side = el > -2 ? Math.max(-1, Math.min(1, (((az - 180 + 540) % 360) - 180) / 70)) : -0.6;
    const k = (side * 1.5).toFixed(2);
    if (k !== hiKey) { hiKey = k; svg.style.setProperty('--hix', `${k}px`); }
    if (reduced() || Math.random() > 0.22 || !els.sign.classList.contains('is-steady')) return;
    const lit = [...svg.querySelectorAll('.ndl.on .ndl-core')];
    const core = lit[Math.floor(Math.random() * lit.length)];
    if (!core) return;
    core.style.opacity = '0.8';
    setTimeout(() => { core.style.opacity = ''; }, 70 + Math.random() * 60);
  }
  // the dock's glass takes the sky's light: the sign's neon after dark (the holiday's colour on its days), amber at golden
  // hour, rose at dawn, a cool frosted daylight — and rain runs down it while it rains. The labels never change (contrast).
  let glassKey = '';
  function tintGlass() {
    const L = scene.look(), P = scene.palette && scene.palette();
    if (!L || !P) return;
    const hex = h6 => [parseInt(h6.slice(1, 3), 16), parseInt(h6.slice(3, 5), 16), parseInt(h6.slice(5, 7), 16)];
    const neon = hex((scene.signCol && scene.signCol()) || '#ff4fb4');
    const LIGHT = { night: neon, late: neon, golden: [255, 166, 96], dawn: [255, 160, 186], day: [214, 228, 255] };
    const mix = [0, 0, 0];
    let tw = 0;
    for (const [k, w] of Object.entries(L.w)) { const c = LIGHT[k]; if (!c || w <= 0) continue; tw += w; for (let i = 0; i < 3; i++) mix[i] += c[i] * w; }
    const glow = mix.map(v => Math.round(v / (tw || 1)));
    // the glass itself: the sky's low colour, darkened so white labels always read on it
    const sky = P.sky[2].map(v => Math.round(v * 0.32));
    const day = clamp01(L.w.day + L.w.dawn * 0.5);
    const key = `${glow.join(',')}|${sky.join(',')}|${Math.round(day * 10)}`;
    if (key !== glassKey) {
      glassKey = key;
      const st = els.root.style;
      st.setProperty('--dk-glow', `rgb(${glow.join(',')})`);
      st.setProperty('--dk-tint', `rgb(${sky.join(',')})`);
      document.body.style.setProperty('--dk-tint', `rgb(${sky.join(',')})`);   // (the corner buttons live on the body)
      st.setProperty('--dk-day', String(Math.round(day * 100) / 100));
    }
    els.door.classList.toggle('is-rain', !!L.rain && !L.snow);
  }
  // LIVE WEATHER: snow settles on the sign's tubes while it snows (fades in over a minute, melts slowly after), drawn from the
  // tubes themselves (their top edges: the shape minus itself shifted down); the first snow of the winter starts gently
  function snowOnSign() {
    const L = scene.look(), logo = els.sign.querySelector('svg.nd-logo');
    if (!logo) return;
    const snowing = (L.snow || 0) > 0.25;
    if (snowing && !els.snowCap) {
      const paths = [...logo.querySelectorAll('.ndl')].map(g => {
        const p = g.querySelector('.ndl-glass');
        return p ? `<path d="${p.getAttribute('d')}" transform="${g.getAttribute('transform') || ''}" stroke="#fff" stroke-width="${p.getAttribute('stroke-width')}"/>` : '';
      }).join('');
      els.snowCap = h('div.nd-snowcap', { 'aria-hidden': 'true', html: `<svg viewBox="${logo.getAttribute('viewBox')}" xmlns="http://www.w3.org/2000/svg"><defs><filter id="nd-snow" x="-5%" y="-10%" width="110%" height="120%"><feOffset in="SourceAlpha" dy="2.8" result="o"/><feComposite in="SourceAlpha" in2="o" operator="out" result="top"/><feGaussianBlur in="top" stdDeviation="0.45" result="b"/><feFlood flood-color="#f6f8ff"/><feComposite in2="b" operator="in"/></filter></defs><g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#nd-snow)">${paths}</g></svg>` });
      logo.parentNode.append(els.snowCap);
    }
    els.sign.classList.toggle('is-snowy', snowing);
    // the first snow of this winter (per device): a hush — a few big, slow flakes before it really comes down
    if (snowing) {
      const winter = L.local ? (L.local.m >= 7 ? L.local.y : L.local.y - 1) : 0;
      if (store(localStorage, 'nd:firstsnow') !== String(winter)) { store(localStorage, 'nd:firstsnow', String(winter)); scene.set({ firstSnow: performance.now() }); }
    }
  }
  // the rain sound only while it rains on screen: in over ~3 s when a shower starts, out over 4 s when it stops
  function rainSound() {
    if (destroyed || !scene) return;
    const L = scene.look(), level = (L.rain || 0) + (L.storm ? 0.25 : 0);
    if (level > 0 && !stopRain) stopRain = startRain(level);
    else if (level > 0 && stopRain && stopRain.level) stopRain.level(level);
    else if (!level && stopRain) { stopRain(4); stopRain = null; }
  }
  let glassT = 0;
  function flashGlass(near) {
    if (!els.door) return;
    els.door.classList.remove('is-flash', 'is-flash-near'); void els.door.offsetWidth;
    els.door.classList.add('is-flash'); if (near) els.door.classList.add('is-flash-near');
    clearTimeout(glassT); glassT = setTimeout(() => els.door && els.door.classList.remove('is-flash', 'is-flash-near'), 900);
  }
  // ------------------------------------------------------------------ THE NEON COMES ALIVE (district/neon-ramp.js, docs/title.md)
  // The sign follows the day's plan: silent sputters that grow through the golden hour, letters sticking, THE CATCH — the crackle +
  // hum, the only sound — when the sun's disc goes behind the rooftops; the city's signs answer one at a time. At dawn the city
  // signs go first, then the logo falters and dies letter by letter. The sun's computed place only — never the weather.
  // The dock: icons dark through the ramp, lit from the catch until the last letter dies; HOST brightens at the catch and softens
  // (no flicker) when the last letter dies.
  let neonPlanV = null, neonKey = '', neonT = 0, neonStage = null, neonFromPlan = false, neonSounds = 0;
  // CITY 2.0 — THE HUM (NEON PASS 3, the owner's ears): no hum looping all night — the power-on brings it up and it FADES OUT
  // smoothly over the 10 s after the sign is fully on (ambience.js#neonHumFade); the same after a tapped letter re-ignites. The
  // files are warmed once audio unlocks (checked on every neon update); a hidden page / the goodbye cut a hum still fading.
  let humStop = null, neonWarm = false;
  function humSync(on) {
    if (!createHarbor) return;
    if (!neonWarm && isUnlocked()) { neonWarm = true; neonPreload(); }
    if ((!on || destroyed || document.visibilityState !== 'visible') && humStop) { humStop(0.6); humStop = null; }
  }
  /** City 2.0: a power-on (the catch, a tapped letter re-igniting) — the recorded strike + the hum fading out after it */
  function neonOnSound(level = 1) {
    if (!createHarbor || destroyed || document.visibilityState !== 'visible') return;
    neonCatch({ level });
    if (humStop) humStop(0.3);
    humStop = neonHumFade({ level });
  }
  // CITY 2.0 — THE WARM-UP'S LAST 30 s (NEON PASS 4, the owner): the golden-hour sputters stay silent until the last
  // WARM_SOUND_MS before THE CATCH; from then each tube striking plays a flicker, quiet at first and building toward the catch
  // (level 0.3 → 0.8), never closer than 4 s → 1.2 s apart (real time). Then the catch's power-on + the fading hum. The window is
  // on the plan's clock (?speed= shrinks it too); never on the first paint, under Reduced effects or on a hidden page.
  const WARM_SOUND_MS = 30000;
  let warmSoundAt = -1e9, neonWarmSounds = 0;
  function warmFlicker() {
    if (!createHarbor || !neonPlanV || !scene || reduced() || destroyed || document.visibilityState !== 'visible') return;
    const left = neonPlanV.catchAt - scene.now();
    if (left <= 0 || left > WARM_SOUND_MS) return;
    const k = 1 - left / WARM_SOUND_MS, now = performance.now();
    if (now - warmSoundAt < 4000 - 2800 * k) return;
    warmSoundAt = now; neonWarmSounds++;
    neonFlicker({ level: 0.3 + 0.5 * k });
  }
  const NEON_LIT ={ stage: 'night', letters: [true, true, true, true], signs: null, fade: 1, caught: true };
  const NEON_DAY = { stage: 'day', letters: [false, false, false, false], signs: null, fade: 0, caught: false };
  function neonNow() {
    neonFromPlan = false;
    if (!scene) return NEON_DAY;
    const L = scene.look();
    if (!L) return NEON_DAY;
    if (L.alwaysNight) return NEON_LIT;
    const m = scene.neonMoments ? scene.neonMoments() : null;
    if (!m) return scene.signOn() ? NEON_LIT : NEON_DAY;                    // no sunrise / sunset today (polar): the old rule
    const nSigns = Math.max(1, scene.signCount ? scene.signCount() : 4), sp = scene.speed ? scene.speed() : 1;
    const key = `${Math.round(m.catchAt / 10000)}|${Math.round(m.clearAt / 10000)}|${reduced() ? 'r' : ''}|${nSigns}|${sp}`;
    if (key !== neonKey) {
      neonKey = key;
      const day = new Date(m.rise).toISOString().slice(0, 10);
      neonPlanV = neonPlan({ moments: m, seed: `${day}|${(L.lat || 0).toFixed(1)}|${(L.lon || 0).toFixed(1)}`, signs: nSigns, reduced: reduced(), scale: sp });
    }
    const st = neonState(neonPlanV, scene.now());
    neonFromPlan = !!st;
    return st || NEON_DAY;
  }
  function applyNeon(st, opts = {}) {
    if (!els.sign || !scene) return;
    humSync(!!st.caught);
    const s = els.sign, letters = [...s.querySelectorAll('.ndl')];
    const prev = neonStage;
    neonStage = st.stage;
    scene.set({ signPower: st.signs });
    // HOST: bright from the catch until the last letter dies; softer by day and through the ramp
    els.actions.classList.toggle('is-daylit', st.stage === 'day' || st.stage === 'ramp');
    // JOIN / HOST follow the sign (Oct 21): unlit glass by day and through the evening ramp; they go dark with the sign's last
    // letter at the morning goodbye and light again at the catch with a short flicker (none under Reduced effects)
    if (tl && tl.done && dock) {
      const want = ringsWanted(st);
      if (want && !dock.ringLit()) ringOn(prev === 'ramp' && !opts.quiet && !reduced() ? [[0, true], [70, false], [150, true], [230, false], [340, true]] : null);
      else if (!want && dock.ringLit()) { dock.resetRing(); dock.ringSet(false); }
    }
    if (st.caught) {
      if (!s.classList.contains('is-steady') || s.classList.contains('is-day')) {
        const isCatch = prev === 'ramp' && !opts.quiet;
        s.classList.remove('is-day', 'is-fade');
        letters.forEach((l, i) => { if (!buzzing.has(i)) l.classList.add('on'); });
        s.classList.add('is-steady');
        setTimeout(() => { if (!destroyed) s.classList.add('is-warm'); }, 60);
        dockAll(true);
        if (isCatch) {
          // THE CATCH: all four lock on together, the crackle + hum, a soft bloom (City 2.0: the city holds its tier through it)
          if (scene.hold) scene.hold(3000);
          if (createHarbor) neonOnSound(); else neonPowerOn({ crackles: [0, 0.05, 0.13], dur: 1.6 });   // (City 2.0: the recorded power-on + the hum fading)
          neonSounds++;
          s.classList.add('is-catch');
          setTimeout(() => { if (!destroyed) s.classList.remove('is-catch'); }, 1500);
        }
      }
      scene.set({ logo: 1, signPow: 1, caught: true });
      return;
    }
    // the ramp, the goodbye, the day: the daytime glass look, with whichever letters are lit right now
    s.classList.remove('is-steady', 'is-warm');
    s.classList.add('is-day');
    const fade = !!(neonPlanV && neonPlanV.reduced && (st.stage === 'ramp' || st.stage === 'goodbye'));
    s.classList.toggle('is-fade', fade);
    if (fade) s.style.setProperty('--rf', st.fade.toFixed(3));
    let on = 0, struck = 0, dropped = 0;
    letters.forEach((l, i) => {
      if (st.letters[i]) on++;
      if (buzzing.has(i)) return;
      const was = l.classList.contains('on');
      l.classList.toggle('on', !!st.letters[i]);
      if (was !== !!st.letters[i]) { if (st.letters[i]) struck++; else dropped++; }
    });
    // CITY 2.0 — THE RECORDED NEON (NEON PASS 3 + 4, the owner's ears): the golden-hour warm-up is SILENT but for its last 30 s
    // (warmFlicker: the strikes building toward the catch); the dawn's stutters are silent — only the very last tube cutting out
    // at dawn sounds, the dropout, softly (it lands as the plan turns to 'day'). Never on the first paint, never under Reduced effects.
    if (createHarbor && st.stage === 'ramp' && !opts.quiet && !fade && struck) warmFlicker();
    if (createHarbor && prev === 'goodbye' && st.stage === 'day' && !opts.quiet && !fade && dropped) neonDropout({ level: 0.55 });
    dockAll(st.stage === 'goodbye');                                          // the dock goes dark with the last letter
    const share = fade ? st.fade : on / 4;
    scene.set({ logo: share > 0 ? 1 : 0, signPow: share, caught: false });
  }
  // PARTY NIGHTS (scene.js#partyTick, every frame while it's on): --pb the breath 0..1, --pe how hard (the phase's energy, 0
  // until the start wave has passed), --psw the finale's swell; .is-party while the party is on
  let partyOn = false;
  const partyCssOff = /no-party-css/.test(location.search);   // (test-only: pacing bisects)
  function partyFrame(p) {
    if (destroyed || !els.root || partyCssOff) return;
    if (!els.root.dataset.pt) { els.root.dataset.pt = '1'; for (const k of ['no-bloom', 'no-ringbreath', 'no-shimmer', 'no-vars']) if (location.search.includes(k)) els.root.classList.add(k); }
    if (els.root.classList.contains('no-vars')) { els.root.classList.toggle('is-party', p.on > 0); return; }
    const on = p.on > 0;
    if (on !== partyOn) { partyOn = on; els.root.classList.toggle('is-party', on); if (!on && partyEls) { for (const g of partyEls.glows) g.el.style.opacity = ''; if (partyEls.word) partyEls.word.style.opacity = ''; partyEls = null; } }
    if (!on) return;
    // the numbers go on the three elements that breathe — never on the root: a custom property there is inherited by the whole
    // title, and writing it every frame re-styled all of it (100 ms frames on a slow phone). (Reduced: the breath holds at 0.5.)
    // (the rings breathe through their glow layer's opacity — a compositor change — never the registered --hk, whose 2.4 s
    // transition restarted on every write and re-styled the whole ring)
    if (!partyEls || !partyEls.bloom || !partyEls.bloom.isConnected) partyEls = { bloom: els.sign.querySelector('.nd-bloom'), word: els.sign.querySelector('.nd-word-p'), glows: [...els.root.querySelectorAll('.nd-ringbtn')].map(r => ({ el: r.querySelector('.nd-hglow'), ring: r, k: r.classList.contains('nd-joinring') ? 0.46 : 0.62 })).filter(g => g.el), bo: -1, hk: -1, wp: -1 };
    const pe = p.ramp * p.energy;
    // the bloom holds a gentle level that moves with the party's phase and the finale's swell (the beat breathes in the canvas's
    // halo under it): a big layer re-composited every frame cost a slow phone 60+ ms
    // (City 2.0, NEON PASS 3: the NEON word joins the show on its BIGGEST drops only — p.big, a flare easing back)
    const sw = Math.max(p.swell, 0.8 * (p.big || 0));
    // (City 2.0, NEON PASS 4 — THE HARD BEAT: the rings + SPEAKEASY PUNCH on every beat — p.punch, a ~50 ms attack and a quick
    // decay — through opacity alone: the rings' glow layer, SPEAKEASY's extra glow layer; the big bloom keeps its gentle level)
    const bo = Math.round((0.2 * pe + 0.6 * sw) * 50) / 50, hk = Math.round((createHarbor ? 0.78 + 0.95 * (p.punch || 0) + 0.5 * sw : 1 + 0.34 * p.breath * pe + 0.5 * sw) * 50) / 50;
    if (createHarbor && partyEls.word) { const wp = Math.round(Math.min(1, (p.punch || 0) * 1.15 + 0.6 * sw) * 40) / 40; if (wp !== partyEls.wp) { partyEls.wp = wp; partyEls.word.style.opacity = String(wp); } }
    if (bo !== partyEls.bo && partyEls.bloom) { partyEls.bo = bo; partyEls.bloom.style.setProperty('--bo', bo); }
    if (hk !== partyEls.hk) { partyEls.hk = hk; for (const g of partyEls.glows) g.el.style.opacity = g.ring.classList.contains('is-lit') ? String(Math.round(hk * g.k * 250) / 250) : ''; }
  }
  let partyEls = null;
  function neonTick() {
    clearTimeout(neonT);
    if (destroyed || !scene || !tl || !tl.done) return;
    const st = neonNow();
    applyNeon(st);
    const now = scene.now();
    const next = neonFromPlan ? neonNext(neonPlanV, now) : now + 60000;
    const sp = scene.speed ? scene.speed() : 1;
    neonT = setTimeout(neonTick, Math.max(25, Math.min(2000, (next - now) / sp + 8)));
  }

  let dressKey = '';
  function dressSign(L) {
    const hol = L && L.holiday;
    const n = L && L.nye;
    const key = `${hol ? hol.id + (hol.full ? 'F' : '') + Math.round((hol.k || 0) * 40) : ''}|${n ? (n.countdown != null ? 'c' + n.countdown : 'f') : ''}`;
    if (key === dressKey) return;
    dressKey = key;
    const s = els.sign;
    const full = hol && hol.full ? hol.id : null;
    for (const k of ['halloween', 'christmas', 'nye', 'valentine', 'stpatrick', 'easter', 'thanksgiving', 'july4']) s.classList.toggle(`sg-${k}`, full === k);
    if (scene) scene.set({ signCol: SIGN_LIGHT[full] || null });
    s.querySelectorAll('.nd-dress').forEach(e => e.remove());
    swapO(s.querySelector('svg.nd-logo'), full === 'halloween' || full === 'stpatrick' ? full : null);
    const wrap = s.querySelector('.nd-logo-wrap');
    if (full === 'halloween') {
      wrap.append(h('div.nd-dress.nd-webs', { 'aria-hidden': 'true', html: WEBS }));
      wrap.append(h('div.nd-dress.nd-spider', { 'aria-hidden': 'true' }, h('div.nd-spider-b', h('i.nd-silk'), h('div.nd-spider-s', { html: SPIDER }))));
    }
    if (hol && hol.id === 'christmas') { const logo = wrap.querySelector('svg.nd-logo'); if (logo) wrap.append(h('div.nd-dress.nd-xlights', { 'aria-hidden': 'true', html: xmasWrapSvg(logo, hol.full ? 1 : hol.k) })); }
    if (full === 'christmas') wrap.append(h('div.nd-dress.nd-hat', { 'aria-hidden': 'true', html: HAT }));
    const tag = s.querySelector('.nd-tag');
    if (n && n.countdown != null) { const m = Math.floor(n.countdown / 60), sec = n.countdown % 60; tag.textContent = `${m}:${String(sec).padStart(2, '0')} TO MIDNIGHT`; tag.classList.add('nd-count'); }
    else if (n && n.finale != null) { tag.textContent = 'HAPPY NEW YEAR'; tag.classList.add('nd-count'); }
    else { tag.textContent = TAGLINE; tag.classList.remove('nd-count'); }
    ringColors();
  }

  // keep the sign's light in the scene in sync with layout (resizes, the keyboard)
  function clearZones() {
    const out = [];
    const add = el => { if (!el) return; const r = el.getBoundingClientRect(); if (r.width && r.height) out.push({ x: r.left, y: r.top, w: r.width, h: r.height }); };
    add(els.sign); add(els.actions);
    // open sky under the tagline too, so the city frames the sign instead of crowding it
    if (out[0]) out[0].h += 34;
    document.querySelectorAll('.menu-btn, .music-btn').forEach(add);
    return out;
  }
  // the NEON letters, SPEAKEASY and the tagline, for the phone sun's arch (it passes behind the words, never the letters)
  function textRects() {
    const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; };
    const neon = logoRect(), word = box(els.sign.querySelector('.nd-word')), tag = box(els.sign.querySelector('.nd-tag'));
    // (sub: a first visit's "12 PARTY GAMES · ONE PHONE EACH" under the tagline — the rainbow keeps under it too)
    return neon && word && tag ? { neon, word, tag, sub: box(els.sign.querySelector('.nd-sub')) } : null;
  }
  // BATTERY: the title's loops (the sign's rects, the sky watch) idle while the page is hidden and pick up at once when it shows
  function onVisTitle() { if (document.visibilityState !== 'visible') humSync(false); if (destroyed || !tl || !tl.done || document.visibilityState !== 'visible') return; clearTimeout(els.logoTimer); clearTimeout(els.skyTimer); trackLogo(); watchSky(); neonTick(); }
  function trackLogo() {
    if (destroyed) return;
    if (document.visibilityState !== 'visible') { els.logoTimer = setTimeout(trackLogo, 5000); return; }
    scene.set({ logoRect: logoRect(), clear: clearZones(), textRects: textRects() });
    sunGlass();
    // (City 2.0, NEON PASS 3: a drone show's formation fills the band under SPEAKEASY — the tagline steps aside while it flies)
    if (scene.holdTag) { const h = !!scene.holdTag(); if (h !== els.sign.classList.contains('nd-tag-hold')) els.sign.classList.toggle('nd-tag-hold', h); }
    els.logoTimer = setTimeout(trackLogo, 500);
  }

  // the sun passing behind the corner buttons (☰, music): it glows through their frosted glass; while it's there the glass
  // darkens a touch and the icon gets a soft dark edge, so the icon stays readable (≥ 4.5:1) — the rest of the time, unchanged
  let sunOverride = null;   // test-only: a sun placed by the hook (dock.sunAt) to review the glass
  function sunGlass() {
    const sn = sunOverride || (scene && scene.sun ? scene.sun() : null);
    document.querySelectorAll('.menu-btn, .music-btn').forEach(b => {
      let k = 0;
      const r = b.getBoundingClientRect();
      if (sn && sn.vis > 0.15 && r.width > 0) {
        const br = r.width / 2, d = Math.hypot(sn.x - (r.left + br), sn.y - (r.top + br));
        k = clamp01((br + sn.r * 1.3 - d) / (sn.r * 1.3)) * Math.min(1, sn.vis);   // how much of the sun (and its halo) is behind it
        // the sun's light in the glass: where it is behind the button, in its own colour, as strong as it is close
        const st = b.style;
        st.setProperty('--sun-x', `${Math.round(sn.x - r.left)}px`);
        st.setProperty('--sun-y', `${Math.round(sn.y - r.top)}px`);
        st.setProperty('--sun-c', (sn.col || [255, 240, 220]).join(', '));
        st.setProperty('--sun-k', k.toFixed(2));
        st.setProperty('--sun-r', `${Math.round(sn.r * 2.4)}px`);
      }
      b.classList.toggle('nd-sunlit', k > 0.02);
    });
    // the words the sun passes behind keep a soft dark edge while it's there (readable on the bright disc), barely any otherwise
    [els.sign.querySelector('.nd-word'), els.sign.querySelector('.nd-tag')].forEach(t => {
      if (!t) return;
      let k = 0;
      if (sn && sn.vis > 0.15) {
        const r = t.getBoundingClientRect(), R = sn.r * 2.2;
        const dx = Math.max(r.left - sn.x, 0, sn.x - r.right), dy = Math.max(r.top - sn.y, 0, sn.y - r.bottom);
        k = clamp01(1 - Math.hypot(dx, dy) / R) * Math.min(1, sn.vis);
      }
      t.style.setProperty('--sunk', k.toFixed(2));
      t.classList.toggle('nd-sunbk', k > 0.02);
    });
  }

  // every ~20–40 s one letter gives a tiny, realistic flicker
  function scheduleFlicker() {
    if (reduced()) return;
    flickerTimer = setTimeout(() => {
      if (destroyed) return;
      // only a lit sign flickers (by day the tubes are dark: a flicker there used to leave a letter switched on)
      if (!els.sign.classList.contains('is-steady') || els.sign.classList.contains('is-day') || !(neonStage === 'lit' || neonStage === 'night')) { scheduleFlicker(); return; }
      // never a letter someone just tapped (its own animation is running)
      const letters = [...els.sign.querySelectorAll('.ndl')].filter((_, i) => !buzzing.has(i));
      if (!letters.length) { scheduleFlicker(); return; }
      const l = letters[Math.floor(Math.random() * letters.length)];
      const li = [...els.sign.querySelectorAll('.ndl')].indexOf(l);
      const seq = [0, 60, 95, 130, 190];
      seq.forEach((ms, k) => setTimeout(() => { if (destroyed) return; l.classList.toggle('on', k % 2 === 1 || k === seq.length - 1); dockLight(li, k % 2 === 1 || k === seq.length - 1); }, ms));
      // (City 2.0: the flicker sounds — rare and random, one of four recordings, never the same twice running)
      if (createHarbor && document.visibilityState === 'visible') neonFlicker({ level: 0.8 });
      neonTick();
      scene.set({ logo: 0.8 }); setTimeout(() => scene && scene.set({ logo: 1 }), 200);
      scheduleFlicker();
    }, 20000 + Math.random() * 20000);
  }

  // ------------------------------------------------------------------ the games (a sheet; the city's billboards show them too)
  function openGames() {
    sfx('select');
    const games = GAMES.filter(g => g.playable);
    let sheet;
    const close = () => { sheet.classList.add('out'); setTimeout(() => sheet.remove(), 260); };
    sheet = h('div.modal', { onclick: e => { if (e.target === sheet) close(); } },
      h('div.sheet.nd-games', { role: 'dialog', 'aria-label': 'The games' },
        h('div.sheet-grip'),
        h('div.nd-games-h', h('h2', 'THE GAMES'), h('p', `${games.length} party games · ${MIN_PLAYERS}–${MAX_PLAYERS} players · one phone each`)),
        h('div.nd-games-grid', ...games.map(g => h('button.nd-gtile', {
          type: 'button', dataset: { id: g.id, theme: g.theme }, style: { '--acc': ACC[g.id] || '#d6f0ff' },
          onclick: () => { close(); preview(g); },
        }, gameArt(g.id) || h('div.gc-glyph'), h('span.nd-gtile-n', g.name), h('span.nd-gtile-t', g.tag)))),
        h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'CLOSE')));
    document.body.append(sheet);
  }

  // ------------------------------------------------------------------ the living city: taps, and the screen at rest
  // a tap on the city: a sign opens that game's HOW TO PLAY; the moon, the UFO, the cat answer (fx.js); a tap on the
  // main sign makes that tube buzz
  let down = null;
  function onCityDown(e) { down = swallowed ? null : { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target }; }
  function onCityUp(e) {
    const d = down; down = null;
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.t > 600) return;
    onCityTap({ target: d.target, clientX: e.clientX, clientY: e.clientY });
  }
  function onCityTap(e) {
    if (destroyed || !scene || !tl || !tl.done || swallowed) return;
    if (e.target.closest('button, input, label, a, .modal, .sheet, .nd-actions, .nd-gate, .menu-btn, .music-btn, .gm-panel')) return;
    const x = e.clientX, y = e.clientY;
    const r = logoRect();
    if (r && x >= r.x && x <= r.x + r.w && y >= r.y - 12 && y <= r.y + r.h + 12) { buzz(Math.max(0, Math.min(3, Math.floor((x - r.x) / r.w * 4)))); return; }
    const hit = scene.hit(x, y);
    if (!hit) return;
    if (hit.kind === 'sign') { sfx('select'); openHelp(hit.id); }
    else if (hit.kind === 'ufo') sfx('portal');
    else if (hit.kind === 'cat') sfx('key');
    // THE STREET: knock on the speakeasy's door — a soft double knock, the peephole slides open, and the JOIN panel opens (a real
    // way in: enter the hush word), exactly like the JOIN ring. Reduced effects: no flash, the panel still opens.
    else if (hit.kind === 'door') { knock(); if (!reduced()) scene.knock(); openJoin(true, true); }
  }
  // a tapped letter: by night it stutters out, stays dark a moment and re-ignites like neon does; by day it sparks to life,
  // glows for a moment and flickers out again. One tap at a time per letter.
  const buzzing = new Set();
  function buzz(i) {
    const l = els.sign.querySelectorAll('.ndl')[i];
    if (!l || buzzing.has(i)) return;
    buzzing.add(i);
    const day = els.sign.classList.contains('is-day') || !els.sign.classList.contains('is-steady');
    // (City 2.0, NEON PASS 3: the tap's sounds — the dropout when the letter goes dark, the power-on (+ the hum fading after 10 s)
    // when it lights; by night: out at once, re-ignites at 1.6 s; by day: sparks on at once, out at 1.85 s)
    const sound = on => { if (!createHarbor || reduced()) return; if (on) neonOnSound(0.75); else neonDropout({ level: 0.75 }); };
    const set = (on, ms, tick) => setTimeout(() => { if (destroyed) return; l.classList.toggle('on', on); if (tick) { neonTick(); sound(on); } }, ms);
    // [state, at ms]: the stutter, the hold, the restart flicker
    const plan = day
      ? [[1, 0], [0, 60], [1, 110], [0, 170], [1, 230], [0, 1850], [1, 1910], [0, 1990]]          // sparks on … glows … flickers out
      : [[0, 0], [1, 50], [0, 95], [1, 150], [0, 200], [1, 1600], [0, 1660], [1, 1720], [0, 1800], [1, 1900]];   // out … dark … re-ignites
    plan.forEach(([on, ms], k) => set(!!on, ms, k === 0 || k === 5));        // a tick as it changes, and as it restarts
    setTimeout(() => { buzzing.delete(i); if (destroyed) return; l.classList.toggle('on', !day); if (tl && tl.done) neonTick(); }, plan[plan.length - 1][1] + 40);
  }

  // after 15 s without a touch the menu and the tagline fade away — just the sign and the city; any touch brings them back
  const IDLE_MS = 15000;
  let idleTimer = 0, swallowed = false, mouseAt = null;
  // (local test runs don't fade on their own unless they ask with &idle=1 — a slow test step must not hide the buttons)
  const autoIdle = !(useEmulator && !/[?&]idle(?![a-z])/.test(location.search));
  function armIdle() { clearTimeout(idleTimer); if (!destroyed && autoIdle) idleTimer = setTimeout(goIdle, IDLE_MS); }
  function goIdle() {
    if (destroyed || !tl || !tl.done) return;
    const busyNow = busy || document.querySelector('.modal, .sheet') || document.activeElement === els.code || els.actions.classList.contains('is-join');
    if (busyNow) { armIdle(); return; }
    els.root.classList.add('is-idle');
    document.body.classList.add('nd-idle');
    tagState();
  }
  function wake() { const was = els.root.classList.contains('is-idle'); els.root.classList.remove('is-idle'); document.body.classList.remove('nd-idle'); if (was) tagState(); }
  function onWake(e) {
    if (destroyed) return;
    // the touch that wakes the screen only wakes it (it doesn't press whatever was under it)
    if (els.root.classList.contains('is-idle') && e.type === 'pointerdown') { swallowed = true; setTimeout(() => { swallowed = false; }, 700); e.preventDefault(); }
    wake();
    armIdle();
  }
  function onWakeClick(e) { if (swallowed) { e.stopPropagation(); e.preventDefault(); swallowed = false; } }
  function onMouse(e) {
    if (e.pointerType !== 'mouse') return;
    if (!mouseAt) { mouseAt = [e.clientX, e.clientY]; return; }
    if (Math.hypot(e.clientX - mouseAt[0], e.clientY - mouseAt[1]) > 24) { mouseAt = [e.clientX, e.clientY]; wake(); armIdle(); }
  }

  function meta(g) {
    const mod = GAME_MODULES[g.id] || {};
    const min = Math.max(MIN_PLAYERS, mod.MIN_PLAYERS || 0);
    let mins = null;
    try { mins = mod.estimateMinutes ? mod.estimateMinutes(mod.DEFAULT_SETTINGS || {}) : null; } catch { mins = null; }
    return { players: `${min}–${MAX_PLAYERS} PLAYERS`, mins: mins ? `≈ ${Math.round(mins)} MIN` : null };
  }

  function preview(g) {
    sfx('select');
    const m = meta(g);
    let sheet;
    const close = () => { sheet.classList.add('out'); setTimeout(() => sheet.remove(), 260); };
    const art = gameArtSvg(g.id);
    sheet = h('div.modal', { onclick: e => { if (e.target === sheet) close(); } },
      h('div.sheet.nd-preview', { role: 'dialog', 'aria-label': g.name, dataset: { theme: g.theme }, style: { '--acc': ACC[g.id] || '#d6f0ff' } },
        h('div.sheet-grip'),
        h('div.nd-pv-art', art),
        h('div.nd-pv-body',
          h('div.gc-tag', g.tag),
          h('h2.nd-pv-name', g.name),
          h('p.nd-pv-blurb', g.blurb),
          h('div.nd-pv-meta', h('span', m.players), m.mins ? h('span', m.mins) : null, h('span', 'ONE PHONE EACH')),
          topThree(g, () => close())),
        h('div.nd-pv-actions',
          h('button.btn.btn-ghost.btn-block', { type: 'button', onclick: () => { close(); openHelp(g.id); } }, h('span', 'HOW TO PLAY')),
          h('button.btn.btn-text.btn-block', { type: 'button', onclick: close }, 'CLOSE'))));
    document.body.append(sheet);
  }

  // the game's top three on THE BOARD (its first record, else its wins) and your own rank there
  function topThree(g, close) {
    const def = primaryBoard(g.id, g.id === 'pulse' ? [{ id: 'pulse1', title: 'Track 01' }] : []);
    const list = h('ol.nd-pv-top', h('li.nd-pv-wait', 'THE BOARD…'));
    const mine = h('div.nd-pv-you');
    const wrap = h('div.nd-pv-board', { style: { '--acc': ACC[g.id] || '#d6f0ff' } },
      h('div.nd-pv-bh', h('span', 'THE BOARD'), h('span', def.label)),
      list, mine,
      h('button.nd-pv-more', { type: 'button', onclick: () => { close(); setState({ view: 'board', boardGame: g.id }); } }, 'SEE THE FULL BOARD ›'));
    const MEDALS = ['gold', 'silver', 'bronze'];
    import('../profile/api.js').then(api => api.board(def.id, 'all', { n: 3 })).then(d => {
      list.replaceChildren(...(d.rows.length ? d.rows.map(r => h('li', h('span.nd-pv-medal', { class: `is-${MEDALS[Math.min(2, r.rank - 1)]}` }, String(r.rank)), h('span.nd-pv-n', r.n, rankBadge(r, { tag: true, size: 13 })), h('b', fmtValue(def, r.v))))
        : [h('li.nd-pv-wait', 'No one yet — be the first.')]));
    }).catch(() => { wrap.remove(); });
    const me = loadMe();
    if (me && me.pid) {
      import('../profile/me.js').then(m => m.myRanks([def.id])).then(r => {
        const x = r[def.id] && r[def.id].all;
        mine.replaceChildren(h('span', 'YOU'), h('b', x ? `#${x.rank.toLocaleString('en-US')}` : '—'), h('span', x ? fmtValue(def, x.v) : 'NOT RANKED YET'));
      }).catch(() => {});
    }
    return wrap;
  }

  // ------------------------------------------------------------------ the dock: THE NEON RING (docs/title.md)
  // One floating bar of smoked glass: JOIN · BOARD · [HOST] · GAMES · YOU. HOST is a raised disc with a neon tube ring that
  // wears the sign's colours (read from the sign's own tubes: ringColors) and never switches off. JOIN opens a glass panel
  // above the bar (the four code boxes); REJOIN and notes float above it too, so the bar itself never moves.
  // THE FLANK (Oct 20 2026): [ JOIN ring ] [ glass pill: BOARD · GAMES · YOU ] [ HOST ring ] — two identical neon rings,
  // mirrored round a compact smoked-glass pill of three icons. HOST wears the sign's colours (ringColors); JOIN is white neon
  // all year. Both are always lit and never sputter; the pill's icons are tubes of the sign (dockLight).
  // THE FLANK (title-dock.js): the dock's markup, rings and lighting; the behaviour lives here
  let dock = null;
  function buildActions() {
    dock = createDock({
      join: () => { sfx('select'); openJoin(!els.actions.classList.contains('is-join'), true); },
      board: () => { sfx('select'); setState({ view: 'board' }); },
      games: () => { openJoin(false); openGames(); },
      you: () => { sfx('select'); const p = loadProfile(); setState(p && p.name ? { view: 'profile' } : { view: 'setup', setupMode: 'edit' }); },
      host,
      code: {
        input: onCode, paste: onPaste, focus: () => { paintCode(); fitKeyboard(); }, blur: paintCode,
        keydown: e => { if (e.key === 'Enter' && els.code.value.length === 4) join(els.code.value); if (e.key === 'Escape') openJoin(false); },
      },
      go: () => (els.code.value.length === 4 ? join(els.code.value) : els.code.focus()),
      panelDown, panelUp,
      note: () => note(''),
    });
    Object.assign(els, dock.els);
    return dock.el;
  }
  const ringColors = (force = false) => dock && dock.ringColors(els.sign, force);
  const dockLight = (i, on) => dock && dock.light(i, on);
  const dockAll = on => dock && dock.all(on);
  const ringOn = times => dock && dock.ringOn(times);
  /** JOIN / HOST are lit while the sign is: from the catch through the morning goodbye (dark by day and through the ramp) */
  const ringsWanted = st => !!st && (st.caught || st.stage === 'goodbye');

  // JOIN: the panel above the bar. Tap outside, swipe it down, tap JOIN again or Escape to close
  let swipe = null;
  function panelDown(e) { swipe = { y: e.clientY, t: performance.now() }; }
  function panelUp(e) {
    const s = swipe; swipe = null;
    if (s && e.clientY - s.y > 38 && performance.now() - s.t < 700) openJoin(false);
  }
  function outsideDown(e) {
    if (!els.actions.classList.contains('is-join')) return;
    if (els.jpanel.contains(e.target) || els.joinTab.contains(e.target)) return;
    openJoin(false);
  }
  // the iOS keyboard: keep the panel just above it (the visual viewport shrinks; the layout viewport doesn't)
  function fitKeyboard() {
    const vv = window.visualViewport;
    if (!vv || !els.jpanel) return;
    const open = els.actions.classList.contains('is-join');
    const kb = window.innerHeight - vv.height - vv.offsetTop;
    if (open && kb > 90) {
      els.jpanel.style.setProperty('--kb-top', `${Math.max(8, vv.offsetTop + vv.height - els.jpanel.offsetHeight - 12)}px`);
      els.jpanel.classList.add('is-kb');
    } else els.jpanel.classList.remove('is-kb');
  }

  function openJoin(on, focus = false) {
    if (!els.actions) return;
    const was = els.actions.classList.contains('is-join');
    els.actions.classList.toggle('is-join', on);
    els.joinTab.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) {
      if (!was) say('');
      paintCode();
      if (focus) setTimeout(() => els.code.focus(), 60);
      window.addEventListener('pointerdown', outsideDown, { capture: true });
    } else {
      els.code.blur();
      els.jpanel.classList.remove('is-kb');
      window.removeEventListener('pointerdown', outsideDown, { capture: true });
    }
  }

  // a note floating above the bar (a host that couldn't open, an expired invite); tap it to dismiss
  let noteT = 0;
  function note(text, kind = 'info', ms = 6500) {
    if (!els.note) return;
    clearTimeout(noteT);
    els.note.textContent = text;
    els.note.dataset.kind = kind;
    els.note.classList.toggle('is-on', !!text);
    if (text && ms) noteT = setTimeout(() => note(''), ms);
  }

  function update(state) {
    st = state;
    if (!els.youTab) return;
    const p = loadProfile();
    const me = loadMe();
    const pub = me && me.profile && me.uid === state.uid ? me.profile : null;
    const sig = `${p ? `${p.name}|${p.color}|${p.avatar}` : ''}|${pub ? `${pub.t}|${pub.r}|${pub.x}` : ''}|${state.rejoin || ''}|${state.invite || ''}|${state.inviteExpired || ''}`;
    if (sig === els.sig) return;
    els.sig = sig;
    // YOU: your own emblem in your colour (a neutral outline emblem before there's a profile). Each piece is rebuilt only
    // when its own data changes: replacing a button between a finger's touch-down and its click loses the click.
    const youSig = `${p ? `${p.name}|${p.color}|${p.avatar}` : ''}|${pub ? `${pub.r}|${pub.x}` : ''}`;
    const ic = els.youTab.querySelector('.nd-tab-ic');
    if (youSig === els.youSig) { /* unchanged */ } else if ((els.youSig = youSig) && p && p.name) {
      ic.replaceChildren(avatar(p.avatar, p.color, 27));
      els.youTab.setAttribute('aria-label', `Your membership card, ${p.name}${pub ? `, ${step(pub.x || 0).name}` : ''}`);
      els.youTab.classList.remove('is-guest');
    } else {
      ic.innerHTML = ICON.guest;
      els.youTab.setAttribute('aria-label', 'Create your player');
      els.youTab.classList.add('is-guest');
    }
    if (els.sub) els.sub.hidden = !!(p && p.name);
    if ((state.rejoin || '') !== els.rejoinCode) els.rejoin.replaceChildren(...(state.rejoin ? [h('button.nd-rejoin-btn', { type: 'button', 'aria-label': `Rejoin room ${state.rejoin}`, onclick: () => join(state.rejoin, true) },
      h('i.nd-rejoin-dot', { 'aria-hidden': 'true' }), h('span.nd-rejoin-l', 'REJOIN'), ' ', h('b.nd-rejoin-c', state.rejoin))] : []));
    els.rejoinCode = state.rejoin || '';
    els.rejoin.hidden = !state.rejoin;
    if (state.invite && !els.code.value) {
      openJoin(true);
      els.code.value = clean(state.invite);
      paintCode();
      say(`You’re invited — the hush word is ${els.code.value}. Tap › to join.`, 'info');
      els.go.classList.add('is-ready');
    }
    if (state.inviteExpired) note(`The room behind ${state.inviteExpired} has closed. Host a new game, or ask for a fresh hush word.`, 'warn', 9000);
  }


  const clean = v => String(v || '').toUpperCase().replace(/[^A-Z]/g, '');

  function onCode() {
    // any letter A–Z (hush words use them all; the old codes are letters too) — digits and symbols just don't type
    const v = clean(els.code.value).slice(0, 4);
    els.code.value = v;
    paintCode();
    els.go.classList.toggle('is-ready', v.length === 4);
    if (v.length < 4) say('');
    if (v.length === 4) join(v);
  }

  function onPaste(e) {
    // pasting an invite link (or "the hush word is MINT") works too: take the word out of it
    const text = (e.clipboardData || window.clipboardData).getData('text') || '';
    const m = /[?&]room=([A-Za-z]{4})\b/.exec(text) || /\b([A-Za-z]{4})\b/.exec(text.trim());
    if (!m) return;
    e.preventDefault();
    els.code.value = m[1].toUpperCase();
    onCode();
  }

  function paintCode() {
    const v = els.code.value;
    const focused = document.activeElement === els.code;
    els.boxes.forEach((b, i) => {
      b.textContent = v[i] || '';
      b.classList.toggle('is-filled', !!v[i]);
      b.classList.toggle('is-caret', focused && i === Math.min(v.length, 3) && v.length < 4);
    });
  }

  function say(text, kind = 'info') {
    els.msg.textContent = text;
    els.msg.dataset.kind = kind;
  }

  function shake() {
    const c = els.code.parentElement;
    c.classList.remove('is-shake');
    void c.offsetWidth;
    c.classList.add('is-shake');
  }

  async function host() {
    if (busy) return;
    const p = loadProfile();
    if (!p || !p.name) { setState({ view: 'setup', setupMode: 'host' }); return; }
    busy = true;
    openJoin(false);
    els.host.classList.add('is-busy');
    els.host.setAttribute('aria-busy', 'true');
    try {
      await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error('network')), 20000))]);
      await createRoom(p);
      setState({ invite: '', rejoin: '' });
    } catch (e) {
      busy = false;
      els.host.classList.remove('is-busy');
      els.host.removeAttribute('aria-busy');
      note(friendly(e), 'warn');
      sfx('invalid');
    }
  }

  async function join(code, isRejoin = false) {
    if (busy) return;
    const p = loadProfile();
    if (!p || !p.name) { setState({ view: 'setup', setupMode: 'join', invite: code }); return; }
    busy = true;
    els.code.blur();
    els.code.parentElement.classList.add('is-busy');
    const tell = els.actions.classList.contains('is-join') ? say : note;
    tell(isRejoin ? `Rejoining ${code}…` : `Knocking: ${code}…`, 'info');
    try {
      await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error('network')), 20000))]);
      await joinRoom(code, p);
      setState({ invite: '', rejoin: '', inviteExpired: '' });
    } catch (e) {
      busy = false;
      els.code.parentElement.classList.remove('is-busy');
      tell(friendly(e, code), 'warn');
      if (isRejoin) setState({ rejoin: '' });
      sfx('invalid');
      shake();
      els.code.select && els.code.select();
    }
  }

  function friendly(e, code = '') {
    const m = String((e && e.message) || e);
    if (/No room/i.test(m)) return `No room behind ${code} right now. Check the hush word, or ask for a fresh invite.`;
    if (/door’s locked/i.test(m)) return m;
    if (/wrong words/i.test(m)) return m;
    if (/full/i.test(m)) return `That room is full — 8 players is the limit.`;
    if (/removed you/i.test(m)) return 'The host removed you from that room.';
    if (/permission|network|unavailable|offline/i.test(m)) return 'Couldn’t reach the game servers. Check your connection and try again.';
    return m;
  }

  // ------------------------------------------------------------------ test hook + unmount
  function setupHook() {
    window.__district = {
      scene: () => scene && scene.debug(),
      phase: () => (tl ? { kind: tl.kind, done: tl.done, t: tl.done ? tl.doneAt : (performance.now() - tl.t0) / 1000 } : { kind: 'gate', done: false }),
      skip,
      enter,
      setTier: t => scene && scene.setTier(t),
      frames: () => scene && scene.frames(),
      reduced,
      hit: (x, y) => scene && scene.hit(x, y),
      idle: () => goIdle(),
      isIdle: () => els.root.classList.contains('is-idle'),
      rainSound: () => !!stopRain,
      neonAt: t => (neonPlanV ? neonState(neonPlanV, t) : null),
      neonSounds: () => neonSounds,
      neonWarmSounds: () => neonWarmSounds,                                   // (City 2.0: the warm-up's last-30-s flickers)
      neon: () => { const p = neonPlanV; return { stage: neonStage, letters: [...els.sign.querySelectorAll('.ndl')].map(l => l.classList.contains('on')), signs: neonNow().signs, plan: p && { startAt: p.startAt, catchAt: p.catchAt, clearAt: p.clearAt, endAt: p.endAt, offFrom: p.offFrom, offTo: p.offTo, reduced: p.reduced }, now: scene && scene.now() }; },
      party: () => (scene ? scene.party() : null),
      rainbow: () => (scene && scene.rainbow ? scene.rainbow() : null),
      street: () => (scene && scene.street ? scene.street() : null),
      cost: () => (scene && scene.cost ? scene.cost() : []),
      harbor: () => (scene && scene.harbor ? scene.harbor() : null),
      remote: () => remote,                                              // CITY 2.0 only: THE PREVIEW PANEL (tests)     // CITY 2.0 only (?city=2): camera, layout, bake + memory
      door: () => (scene && scene.door ? scene.door() : null),
      finale: () => scene && scene.finale(),
      dock: {
        join: openJoin,
        preview: patch => { els.sig = null; update({ ...st, ...patch }); },   // test-only: show the dock for a state (REJOIN, an invite)
        note,
        recolor: () => ringColors(true),
        sunAt: (x, y, r = 16.5) => { sunOverride = x == null ? null : { x, y, r, vis: 1, col: [255, 236, 200] }; sunGlass(); },
        // [BOARD, GAMES, YOU, the corner buttons]
        icons: () => [...dock.tabs().map(t => !!(t && t.classList.contains('is-lit'))), dock.corners().length > 0 && dock.corners().every(b => b.classList.contains('nd-cl-lit'))],
        ring: () => ({ lit: dock.ringLit(), on: !!(els.host && els.host.classList.contains('is-lit')), join: !!(els.joinTab && els.joinTab.classList.contains('is-lit')), multi: els.host ? els.host.dataset.multi : null, g: [1, 2, 3, 4].map(i => (els.hostSlot ? els.hostSlot.style.getPropertyValue(`--hg${i}`) : '')) }),
      },
    };
  }

  function unmount() {
    destroyed = true;
    humSync(false);
    if (tl) cancelAnimationFrame(tl.raf);
    clearTimeout(flickerTimer);
    clearTimeout(els.logoTimer);
    clearTimeout(els.skyTimer);
    clearTimeout(neonT);
    clearTimeout(idleTimer); clearTimeout(els.tagTimer); clearTimeout(els.tagSlotTimer);
    document.body.classList.remove('nd-idle');
    document.querySelectorAll('.nd-sunlit').forEach(b => b.classList.remove('nd-sunlit'));
    window.removeEventListener('pointerdown', onWake, { capture: true });
    window.removeEventListener('click', onWakeClick, { capture: true });
    window.removeEventListener('keydown', onWake, { capture: true });
    window.removeEventListener('pointermove', onMouse);
    window.removeEventListener('pointerdown', onCityDown);
    window.removeEventListener('pointerup', onCityUp);
    document.removeEventListener('visibilitychange', onVisTitle);
    window.removeEventListener('pointerdown', outsideDown, { capture: true });
    if (window.visualViewport) { window.visualViewport.removeEventListener('resize', fitKeyboard); window.visualViewport.removeEventListener('scroll', fitKeyboard); }
    clearTimeout(noteT);
    if (els.probe) els.probe.remove();
    if (els.probeB) els.probeB.remove();
    if (stopRain) stopRain(0.6);
    document.body.classList.remove('nd-on');
    document.body.style.removeProperty('--dk-tint');
    dressCorners(false);
    if (dock) dock.destroy();
    clearTimeout(remoteT);
    if (remote) { remote.destroy(); remote = null; }
    const wrap = els.sceneWrap;
    captureBackdrop(els.canvas, scene.partyLight ? scene.partyLight() : null);   // the menus keep a still of the city (+ the party's light, which breathes on)
    const sc = scene;
    scene = null;
    wrap.classList.add('is-out');
    setTimeout(() => { sc && sc.destroy(); wrap.remove(); }, 420);
    if (window.__district) delete window.__district;
  }

  return { mount, update, unmount };
}

