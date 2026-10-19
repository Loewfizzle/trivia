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
// Menu: HOST GAME (the one glowing element), JOIN with four code boxes (auto-advance, paste, auto-join on the
// 4th letter, ?room= pre-fills), REJOIN when a saved room couldn't be reached, "Welcome back" with the saved
// profile, and a drifting showcase of the games (tap one for a preview sheet).
// Test hook: window.__district.
import { h, reducedMotion } from '../ui/dom.js';
import { step } from '../core/ranks.js';
import { avatar } from '../ui/components.js';
import { gameArt, gameArtSvg } from '../ui/game-art.js';
import { logoSvg, TAGLINE } from '../ui/logo.js';
import { openHelp } from '../ui/help.js';
import { APP_NAME, GAMES, MIN_PLAYERS, MAX_PLAYERS, CODE_ALPHABET, colorHex } from '../config.js';
import { setState } from '../store.js';
import { slot, loadProfile, useEmulator, loadMe } from '../identity.js';
import { rankBadge, emblem, RANK_COLORS } from '../ui/emblems.js';
import { primaryBoard, fmtValue } from '../core/boards.js';
import { createRoom, joinRoom } from '../room.js';
import { firebaseReady } from '../firebase.js';
import { GAME_MODULES } from '../games/registry.js';
import { settings } from '../audio/settings.js';
import { sfx } from '../audio/sfx.js';
import { neonPowerOn, neonTick, startRain, cityPowerOn } from '../audio/ambience.js';
import { createDistrict } from './district/scene.js';
import { captureBackdrop } from './district/backdrop.js';

const ACC = { rum: '#f0c75e', stakes: '#f2c869', overclock: '#ffb627', gridlock: '#7fb2ff', slip: '#ffc46b', prism: '#d6f0ff', golf: '#2ff5d2', agent: '#e6e9ef', pulse: '#a374ff', cipher: '#3dff8b', signal: '#ff4466', bluff: '#efe6d2' };
const SEEN = 'nd:entered';      // localStorage: this device has been through the door before
const BACK = 'nd:back';          // sessionStorage: just stepped back from the name / profile screen (a quick re-light)
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
const SIGN_LIGHT = { halloween: '#ff8a2a', christmas: '#ff3048', nye: '#ffd27a', valentine: '#ff4f8a', stpatrick: '#3dff8b', easter: '#c9a2ff', thanksgiving: '#ffa040', july4: '#5a8cff' };

export function createTitle() {
  const els = {};
  let scene = null;
  let stopRain = null;
  let tl = null;                 // { plan, t0, raf, kind }
  let flickerTimer = 0;
  let destroyed = false;
  let busy = false;
  let st = null;
  const reduced = () => !!settings.reducedFx || reducedMotion();

  function mount(el, state) {
    st = state;
    el.classList.add('title-screen', 'nd');
    document.body.classList.add('nd-on');
    // the city: fixed behind everything, full viewport (the screen column is narrower on desktop)
    els.sceneWrap = h('div.nd-scene', { 'aria-hidden': 'true' }, els.canvas = h('canvas'));
    document.body.prepend(els.sceneWrap);
    scene = createDistrict(els.canvas, { games: GAMES, tier: (window.devicePixelRatio || 1) > 2.5 && (navigator.hardwareConcurrency || 8) <= 4 ? 1 : 2 });
    scene.set({ motion: reduced() ? 0 : 1 });

    // the sign is there from the start, dark (glass tubes only, like the boot screen); the power-on lights it
    els.sign = h('div.nd-sign', { class: 'is-glass' },
      h('div.nd-logo-wrap', { html: logoSvg({ id: 'ndt', title: APP_NAME }) }),
      h('div.nd-word', 'SPEAKEASY'),
      h('div.nd-tag', TAGLINE),
      els.sub = h('div.nd-sub', `${GAMES.filter(g => g.playable).length} PARTY GAMES · ONE PHONE EACH`));
    els.actions = buildActions();
    if (!scene.signOn()) els.sign.classList.add('is-day');
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
    window.addEventListener('pointerdown', onWake, { capture: true });
    window.addEventListener('click', onWakeClick, { capture: true });
    window.addEventListener('keydown', onWake, { capture: true });
    window.addEventListener('pointermove', onMouse, { passive: true });
    // city taps come from the touch itself (iOS Safari never sends 'click' to plain page areas like the city)
    window.addEventListener('pointerdown', onCityDown, { passive: true });
    window.addEventListener('pointerup', onCityUp, { passive: true });
    els.probe = h('div', { style: { position: 'fixed', top: '0', left: '0', width: '1px', height: 'var(--safe-t)', visibility: 'hidden', pointerEvents: 'none' } });
    document.body.append(els.probe);
    scene.safeTop(els.probe.offsetHeight);
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
    s.classList.remove('is-off');
    s.classList.add('is-glass');
    const letters = [...s.querySelectorAll('.ndl')];
    // daylight: the sign rests (glass and brackets, unlit) until dusk
    if (scene && !scene.signOn()) { s.classList.add('is-day'); return; }
    s.classList.remove('is-day');
    const kind = tl.kind;
    if (kind === 'instant' || kind === 'reduced') {
      letters.forEach(l => l.classList.add('on'));
      s.classList.add('is-steady', 'is-warm');
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
        if (k % 2 === 0 && (k < 3 || i === 2)) crackles.push(at / 1000);
      });
    });
    neonPowerOn({ crackles: crackles.slice(0, full ? 7 : 3), dur: full ? 2.4 : 1.4 });
    const steadyIn = ((tl.plan.steady - tl.plan.logo) * 1000);
    setTimeout(() => { if (!destroyed) { letters.forEach(l => l.classList.add('on')); s.classList.add('is-steady'); } }, steadyIn);
    setTimeout(() => { if (!destroyed) s.classList.add('is-warm'); }, steadyIn + 60);
  }

  function skip() {
    if (!tl || tl.done) return;
    const root = els.sign.closest('.nd');
    root.classList.add('is-skip');
    if (!tl.marks.logo) { tl.marks.logo = true; tl.kind = 'instant'; signOn(); }
    else { els.sign.querySelectorAll('.ndl').forEach(l => l.classList.add('on')); els.sign.classList.add('is-steady', 'is-warm'); }
    root.classList.add('is-menu');
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
    armIdle();
  }

  // LIVING CITY: the sign follows the hour (off at dawn like closing time, back on at dusk tube by tube) and wears the
  // holiday (cobwebs, a Santa hat, the New Year countdown, rose / green tubes)
  function watchSky() {
    if (destroyed || !scene) return;
    const want = scene.signOn();
    const lit = els.sign.classList.contains('is-steady');
    if (want && !lit) { tl.kind = 'full'; signOn(); scene.set({ logo: 1 }); }
    else if (!want && lit) signOff();
    dressSign(scene.look());
    rainSound();
    els.skyTimer = setTimeout(watchSky, 1000);
  }
  // the rain sound only while it rains on screen: in over ~3 s when a shower starts, out over 4 s when it stops
  function rainSound() {
    if (destroyed || !scene) return;
    const raining = !!scene.look().rain;
    if (raining && !stopRain) stopRain = startRain();
    else if (!raining && stopRain) { stopRain(4); stopRain = null; }
  }
  function signOff() {
    const s = els.sign;
    const letters = [...s.querySelectorAll('.ndl')];
    s.classList.remove('is-warm');
    letters.forEach((l, i) => {
      const at = 300 * i + Math.random() * 120;
      [0, 70, 120, 260].forEach((ms, k) => setTimeout(() => { if (!destroyed) l.classList.toggle('on', k % 2 === 1 && k < 3); }, at + ms));
    });
    setTimeout(() => { if (!destroyed) { s.classList.remove('is-steady'); s.classList.add('is-day'); letters.forEach(l => l.classList.remove('on')); } }, 300 * letters.length + 400);
    neonTick();
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
  function trackLogo() {
    if (destroyed) return;
    scene.set({ logoRect: logoRect(), clear: clearZones() });
    els.logoTimer = setTimeout(trackLogo, 500);
  }

  // every ~20–40 s one letter gives a tiny, realistic flicker
  function scheduleFlicker() {
    if (reduced()) return;
    flickerTimer = setTimeout(() => {
      if (destroyed) return;
      const letters = [...els.sign.querySelectorAll('.ndl')];
      const l = letters[Math.floor(Math.random() * letters.length)];
      const seq = [0, 60, 95, 130, 190];
      seq.forEach((ms, k) => setTimeout(() => { if (!destroyed) l.classList.toggle('on', k % 2 === 1 || k === seq.length - 1); }, ms));
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
  }
  function buzz(i) {
    const l = els.sign.querySelectorAll('.ndl')[i];
    if (!l) return;
    const day = els.sign.classList.contains('is-day');
    const seq = day ? [0, 70, 120, 200, 260, 380] : [0, 50, 90, 140, 200, 300];
    // lit: the tube stutters off and back on; by day: it sparks to life for a moment and dies again
    seq.forEach((ms, k) => setTimeout(() => { if (!destroyed) l.classList.toggle('on', day ? k % 2 === 0 && k < seq.length - 1 : k % 2 === 1 || k === seq.length - 1); }, ms));
    neonTick();
  }

  // after 15 s without a touch the menu and the tagline fade away — just the sign and the city; any touch brings them back
  const IDLE_MS = 15000;
  let idleTimer = 0, swallowed = false, mouseAt = null;
  // (local test runs don't fade on their own unless they ask with &idle=1 — a slow test step must not hide the buttons)
  const autoIdle = !(useEmulator && !/[?&]idle(?![a-z])/.test(location.search));
  function armIdle() { clearTimeout(idleTimer); if (!destroyed && autoIdle) idleTimer = setTimeout(goIdle, IDLE_MS); }
  function goIdle() {
    if (destroyed || !tl || !tl.done) return;
    const busyNow = busy || document.querySelector('.modal, .sheet') || document.activeElement === els.code || els.door.classList.contains('is-join');
    if (busyNow) { armIdle(); return; }
    els.root.classList.add('is-idle');
    document.body.classList.add('nd-idle');
  }
  function wake() { els.root.classList.remove('is-idle'); document.body.classList.remove('nd-idle'); }
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

  // ------------------------------------------------------------------ actions
  function buildActions() {
    els.welcome = h('div.nd-welcome');
    els.rejoin = h('div.nd-rejoin');
    els.host = h('button.nd-host', { type: 'button', onclick: host }, h('span.nd-host-sheen'), h('span.nd-host-label', 'HOST'));
    els.joinBtn = h('button.nd-joinbtn', { type: 'button', onclick: () => openJoin(true, true) }, h('span.nd-joinbtn-l', 'JOIN'));
    // one real input under four boxes: native keyboard, autocapitalise, paste, iOS autofill all just work
    els.code = h('input.nd-code-in', {
      type: 'text', inputmode: 'text', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off', spellcheck: false,
      maxLength: 24, 'aria-label': 'Room code, 4 letters', enterkeyhint: 'go',
      oninput: onCode, onpaste: onPaste, onfocus: paintCode, onblur: paintCode,
      onkeydown: e => { if (e.key === 'Enter' && els.code.value.length === 4) join(els.code.value); if (e.key === 'Escape') openJoin(false); },
    });
    els.boxes = [0, 1, 2, 3].map(i => h('span.nd-box', { style: { '--i': i } }));
    els.go = h('button.nd-go', { type: 'button', 'aria-label': 'Join room', onclick: () => (els.code.value.length === 4 ? join(els.code.value) : els.code.focus()) }, '›');
    els.msg = h('p.nd-msg', { role: 'status', 'aria-live': 'polite' });
    // HOST and JOIN side by side; JOIN turns the dock into the four code boxes (× goes back)
    els.door = h('div.nd-door',
      h('div.nd-dock', els.host, els.joinBtn),
      h('div.nd-join',
        h('button.nd-join-x', { type: 'button', 'aria-label': 'Back', onclick: () => openJoin(false) }, '‹'),
        h('label.nd-codebox', { onpointerdown: () => setTimeout(() => els.code.focus(), 0) }, els.code, ...els.boxes),
        els.go));
    // the quiet links: THE BOARD, YOUR CARD, THE GAMES
    els.board = h('button.nd-link.nd-link-board', { type: 'button', onclick: () => { sfx('select'); setState({ view: 'board' }); } },
      h('span.nd-board-mark', { 'aria-hidden': 'true' }), h('span', 'THE BOARD'));
    els.gamesBtn = h('button.nd-link.nd-link-games', { type: 'button', onclick: openGames },
      h('span.nd-games-mark', { 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i')), h('span', 'GAMES'));
    return h('section.nd-actions',
      els.rejoin,
      els.door,
      h('div.nd-links', els.board, els.gamesBtn),
      h('div.nd-foot', els.msg, els.welcome));
  }

  function openJoin(on, focus = false) {
    els.door.classList.toggle('is-join', on);
    if (on) { paintCode(); if (focus) setTimeout(() => els.code.focus(), 60); }
    else { els.code.blur(); say(''); }
  }

  function update(state) {
    st = state;
    if (!els.welcome) return;
    const p = loadProfile();
    const me = loadMe();
    const pub = me && me.profile && me.uid === state.uid ? me.profile : null;
    const sig = `${p ? `${p.name}|${p.color}|${p.avatar}` : ''}|${pub ? `${pub.t}|${pub.r}|${pub.x}` : ''}|${state.rejoin || ''}|${state.invite || ''}|${state.inviteExpired || ''}`;
    if (sig === els.sig) return;
    els.sig = sig;
    els.welcome.replaceChildren(...(p && p.name ? [
      avatar(p.avatar, p.color, 22),
      h('button.nd-me', { type: 'button', 'aria-label': 'Your membership card', onclick: () => { sfx('select'); setState({ view: 'profile' }); } },
        h('span', 'Welcome back, ', h('b', { style: { color: colorHex(p.color) } }, p.name)),
        ...(pub ? (() => { const sp = step(pub.x || 0); return [h('span.nd-me-dot', '·'), h('span.nd-me-rank', { style: { '--rk': RANK_COLORS[sp.i] } }, emblem(sp.i, 15), h('span', sp.name))]; })() : [])),
    ] : []));
    els.welcome.hidden = !(p && p.name);
    if (els.sub) els.sub.hidden = !!(p && p.name);
    els.rejoin.replaceChildren(...(state.rejoin ? [h('button.nd-rejoin-btn', { type: 'button', onclick: () => join(state.rejoin, true) },
      h('span.nd-rejoin-k', 'YOUR ROOM IS STILL OPEN'), h('span.nd-rejoin-l', `REJOIN ${state.rejoin}`))] : []));
    els.rejoin.hidden = !state.rejoin;
    els.host.classList.toggle('is-quiet', !!state.rejoin);
    if (state.invite && !els.code.value) { openJoin(true); els.code.value = clean(state.invite); paintCode(); say(`You’re invited to room ${els.code.value} — tap › to join.`, 'info'); els.go.classList.add('is-ready'); }
    if (state.inviteExpired) say(`Room ${state.inviteExpired} has closed. Host a new game, or ask your friend for a fresh code.`, 'warn');
  }


  const clean = v => String(v || '').toUpperCase().replace(/[^A-Z]/g, '');

  function onCode() {
    const raw = clean(els.code.value);
    const bad = [...raw].some(ch => !CODE_ALPHABET.includes(ch));
    const v = [...raw].filter(ch => CODE_ALPHABET.includes(ch)).join('').slice(0, 4);
    els.code.value = v;
    paintCode();
    els.go.classList.toggle('is-ready', v.length === 4);
    if (bad) say('Room codes never use I or O.', 'warn');
    else if (v.length < 4) say('');
    if (v.length === 4) join(v);
  }

  function onPaste(e) {
    // pasting an invite link works too: take the code out of it
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
    els.host.classList.add('is-busy');
    els.host.querySelector('.nd-host-label').textContent = 'OPENING…';
    try {
      await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error('network')), 20000))]);
      await createRoom(p);
      setState({ invite: '', rejoin: '' });
    } catch (e) {
      busy = false;
      els.host.classList.remove('is-busy');
      els.host.querySelector('.nd-host-label').textContent = 'HOST';
      say(friendly(e), 'warn');
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
    say(isRejoin ? `Rejoining room ${code}…` : `Joining room ${code}…`, 'info');
    try {
      await Promise.race([firebaseReady, new Promise((_, rej) => setTimeout(() => rej(new Error('network')), 20000))]);
      await joinRoom(code, p);
      setState({ invite: '', rejoin: '', inviteExpired: '' });
    } catch (e) {
      busy = false;
      els.code.parentElement.classList.remove('is-busy');
      say(friendly(e, code), 'warn');
      if (isRejoin) setState({ rejoin: '' });
      sfx('invalid');
      shake();
      els.code.select && els.code.select();
    }
  }

  function friendly(e, code = '') {
    const m = String((e && e.message) || e);
    if (/No room/i.test(m)) return `There’s no room ${code} right now. Check the code, or ask for a fresh invite.`;
    if (/full/i.test(m)) return `Room ${code} is full — 8 players is the limit.`;
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
    };
  }

  function unmount() {
    destroyed = true;
    if (tl) cancelAnimationFrame(tl.raf);
    clearTimeout(flickerTimer);
    clearTimeout(els.logoTimer);
    clearTimeout(els.skyTimer);
    clearTimeout(idleTimer);
    document.body.classList.remove('nd-idle');
    window.removeEventListener('pointerdown', onWake, { capture: true });
    window.removeEventListener('click', onWakeClick, { capture: true });
    window.removeEventListener('keydown', onWake, { capture: true });
    window.removeEventListener('pointermove', onMouse);
    window.removeEventListener('pointerdown', onCityDown);
    window.removeEventListener('pointerup', onCityUp);
    if (els.probe) els.probe.remove();
    if (stopRain) stopRain(0.6);
    document.body.classList.remove('nd-on');
    const wrap = els.sceneWrap;
    captureBackdrop(els.canvas);   // the menus keep a still of the city
    const sc = scene;
    scene = null;
    wrap.classList.add('is-out');
    setTimeout(() => { sc && sc.destroy(); wrap.remove(); }, 420);
    if (window.__district) delete window.__district;
  }

  return { mount, update, unmount };
}

