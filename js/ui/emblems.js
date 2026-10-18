// SPEAKEASY RANK emblems: NEWCOMER → REGULAR → INSIDER → MADE → LEGEND, from a clean steel mark to an ornate
// glowing insignia. One SVG sprite (injected once): every emblem on screen is a <use>, so a lobby of eight costs nothing.
// Two drawings per rank: the full one (profile card, rank-up, top rows) and a bold "mini" one that stays readable at
// 14–18 px next to names (lobby, chat, results, board rows).
//
//   emblem(rank, size)        → <svg> (picks the mini drawing under 28 px)
//   rankBadge(profile)        → emblem + "#4821" for name lines (null without a profile)
import { h } from './dom.js';
import { RANKS } from '../core/ranks.js';
import { fmtTag } from '../core/names.js';

export const RANK_COLORS = ['#b4c3e6', '#ecaa72', '#9fe8ff', '#ffd27a', '#ff9be0'];
const NS = 'http://www.w3.org/2000/svg';
const f = n => +n.toFixed(2);
const polar = (r, deg, cx = 32, cy = 32) => [f(cx + r * Math.cos(deg * Math.PI / 180)), f(cy + r * Math.sin(deg * Math.PI / 180))];
const poly = (n, r, rot = 0) => Array.from({ length: n }, (_, i) => polar(r, rot + (360 / n) * i).join(',')).join(' ');
function star(points, ro, ri, rot = -90) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) pts.push(polar(i % 2 ? ri : ro, rot + (180 / points) * i).join(','));
  return pts.join(' ');
}

const GRADS = `
<linearGradient id="rkg0" x1="0" y1="4" x2="0" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f4f7ff"/><stop offset=".5" stop-color="#a7b6d8"/><stop offset="1" stop-color="#5d6b8e"/></linearGradient>
<linearGradient id="rkg1" x1="0" y1="4" x2="0" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe3c2"/><stop offset=".45" stop-color="#e99a5c"/><stop offset="1" stop-color="#8a4520"/></linearGradient>
<linearGradient id="rkg2" x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset=".4" stop-color="#cfe6f6"/><stop offset=".75" stop-color="#7f9db8"/><stop offset="1" stop-color="#e2f4ff"/></linearGradient>
<linearGradient id="rkg2k" x1="0" y1="18" x2="0" y2="46" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e8fbff"/><stop offset="1" stop-color="#57d4ff"/></linearGradient>
<linearGradient id="rkg3" x1="12" y1="4" x2="52" y2="60" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6cf"/><stop offset=".35" stop-color="#f6cd68"/><stop offset=".7" stop-color="#b98128"/><stop offset="1" stop-color="#ffe7a0"/></linearGradient>
<radialGradient id="rkg3f" cx="32" cy="30" r="26" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3a2a0c"/><stop offset="1" stop-color="#140e04"/></radialGradient>
<linearGradient id="rkg4" x1="10" y1="2" x2="54" y2="62" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff2c4"/><stop offset=".3" stop-color="#ffc56a"/><stop offset=".6" stop-color="#ff86cf"/><stop offset="1" stop-color="#a874ff"/></linearGradient>
<radialGradient id="rkg4f" cx="32" cy="32" r="20" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3b1236"/><stop offset=".8" stop-color="#16061a"/><stop offset="1" stop-color="#0c0310"/></radialGradient>
<linearGradient id="rkg4s" x1="22" y1="22" x2="42" y2="42" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#ffd27a"/><stop offset="1" stop-color="#ff7ccb"/></linearGradient>`;

// ---- the full drawings (64 × 64)
const FULL = [
  // NEWCOMER: a clean steel ring and a diamond — the token they hand you at the door
  `<circle cx="32" cy="32" r="25" fill="none" stroke="url(#rkg0)" stroke-width="3"/>
   <circle cx="32" cy="32" r="20" fill="none" stroke="url(#rkg0)" stroke-width=".8" opacity=".45"/>
   <path d="M32 21 41 32 32 43 23 32Z" fill="url(#rkg0)"/><path d="M32 21 41 32 32 32Z" fill="#fff" opacity=".35"/>`,
  // REGULAR: a copper token with the coupe glass — the bartender knows your drink
  `<circle cx="32" cy="32" r="26" fill="none" stroke="url(#rkg1)" stroke-width="3.2"/>
   <circle cx="32" cy="32" r="20.5" fill="none" stroke="url(#rkg1)" stroke-width="1.1" opacity=".7"/>
   ${[0, 90, 180, 270].map(a => `<circle cx="${polar(26, a)[0]}" cy="${polar(26, a)[1]}" r="2.1" fill="url(#rkg1)"/>`).join('')}
   <path d="M21.5 23.5h21c0 7.2-4.9 11.6-10.5 11.6S21.5 30.7 21.5 23.5Z" fill="url(#rkg1)" fill-opacity=".3" stroke="url(#rkg1)" stroke-width="2.2" stroke-linejoin="round"/>
   <path d="M32 35.2v8.3M25.5 44.6h13" stroke="url(#rkg1)" stroke-width="2.4" stroke-linecap="round"/>
   <path d="M24.5 26.5h15" stroke="#fff" stroke-width="1" opacity=".45" stroke-linecap="round"/>`,
  // INSIDER: a silver octagon and the key to the back rooms
  `<polygon points="${poly(8, 27.5, 22.5)}" fill="none" stroke="url(#rkg2)" stroke-width="3" stroke-linejoin="round"/>
   <polygon points="${poly(8, 21.5, 22.5)}" fill="#071820" fill-opacity=".55" stroke="url(#rkg2)" stroke-width="1" opacity=".8"/>
   ${[0, 90, 180, 270].map(a => `<path d="M${polar(24.5, a - 4).join(' ')} L${polar(27.5, a).join(' ')} L${polar(24.5, a + 4).join(' ')}" fill="none" stroke="url(#rkg2)" stroke-width="1.2"/>`).join('')}
   <circle cx="32" cy="24.5" r="5.6" fill="none" stroke="url(#rkg2k)" stroke-width="2.6"/>
   <path d="M32 30.2V45.5M32 40.5h5.2M32 45h4" stroke="url(#rkg2k)" stroke-width="2.6" stroke-linecap="round"/>
   <circle cx="32" cy="24.5" r="1.6" fill="#e8fbff"/>`,
  // MADE: an Art Deco shield in gold with a fan of light — your name opens doors
  `<path d="M32 4.5 54.5 12v18.5c0 14.2-9.4 23.4-22.5 29-13.1-5.6-22.5-14.8-22.5-29V12Z" fill="url(#rkg3f)" stroke="url(#rkg3)" stroke-width="3" stroke-linejoin="round"/>
   <path d="M32 11 48.5 16.5v14c0 10.4-6.9 17.2-16.5 21.6-9.6-4.4-16.5-11.2-16.5-21.6v-14Z" fill="none" stroke="url(#rkg3)" stroke-width="1" opacity=".75"/>
   ${[-64, -42, -21, 0, 21, 42, 64].map(a => { const [x1, y1] = polar(4, a - 90, 32, 51); const [x2, y2] = polar(a === 0 ? 13 : 11.5, a - 90, 32, 51); return `<path d="M${x1} ${y1} ${x2} ${y2}" stroke="url(#rkg3)" stroke-width="${a === 0 ? 1.8 : 1.3}" stroke-linecap="round"/>`; }).join('')}
   <path d="M32 19 38.5 27.5 32 36 25.5 27.5Z" fill="url(#rkg3)"/><path d="M32 19 38.5 27.5 32 27.5Z" fill="#fff" opacity=".42"/>
   <path d="M21.5 27.5h3.4M39.1 27.5h3.4" stroke="url(#rkg3)" stroke-width="1.3" stroke-linecap="round"/>
   <circle cx="32" cy="13" r="1.7" fill="url(#rkg3)"/>`,
  // LEGEND: a sunburst medallion with laurels and a star — they tell stories about you
  `${Array.from({ length: 17 }, (_, i) => { const a = 222 + i * 6; const long = i % 2 === 0; const [x1, y1] = polar(22.5, a); const [x2, y2] = polar(long ? 31.5 : 27.5, a); return `<path d="M${x1} ${y1} ${x2} ${y2}" stroke="url(#rkg4)" stroke-width="${long ? 1.5 : 0.9}" stroke-linecap="round"/>`; }).join('')}
   ${[1, -1].map(s => `<path d="M${polar(25, s > 0 ? 82 : 98).join(' ')} A25 25 0 0 ${s > 0 ? 0 : 1} ${polar(25, s > 0 ? -28 : 208).join(' ')}" fill="none" stroke="url(#rkg4)" stroke-width=".9" opacity=".8"/>`
     + Array.from({ length: 6 }, (_, i) => { const a = s > 0 ? 74 - i * 20 : 106 + i * 20; const [x, y] = polar(26.6, a); return `<ellipse cx="${x}" cy="${y}" rx="4.2" ry="1.65" transform="rotate(${f(s > 0 ? a - 58 : a + 58)} ${x} ${y})" fill="url(#rkg4)" opacity="${f(1 - i * 0.06)}"/>`; }).join('')).join('')}
   <circle cx="32" cy="32" r="19.5" fill="url(#rkg4f)" stroke="url(#rkg4)" stroke-width="2.6"/>
   <circle cx="32" cy="32" r="15.6" fill="none" stroke="#ff9be0" stroke-width="1" opacity=".75"/>
   <polygon points="${star(5, 11, 4.6)}" fill="url(#rkg4s)" stroke="#fff3d0" stroke-width=".7" stroke-linejoin="round"/>
   <path d="M32 2.2 34.6 5.6 32 9 29.4 5.6Z" fill="url(#rkg4)"/>
   <circle cx="32" cy="32" r="2.1" fill="#fff" opacity=".9"/>`,
];

// ---- the mini drawings: bold silhouettes, a 2.5 px line at 16 px
const MINI = [
  `<circle cx="32" cy="32" r="23" fill="none" stroke="url(#rkg0)" stroke-width="7"/><path d="M32 20 42 32 32 44 22 32Z" fill="url(#rkg0)"/>`,
  `<circle cx="32" cy="32" r="24" fill="none" stroke="url(#rkg1)" stroke-width="7"/><path d="M19 21h26c0 9-6 14-13 14s-13-5-13-14Z" fill="url(#rkg1)"/><path d="M32 34v9M24 45h16" stroke="url(#rkg1)" stroke-width="5" stroke-linecap="round"/>`,
  `<polygon points="${poly(8, 26, 22.5)}" fill="#0a1d26" stroke="url(#rkg2)" stroke-width="6.5" stroke-linejoin="round"/><circle cx="32" cy="26" r="6" fill="none" stroke="url(#rkg2k)" stroke-width="4.5"/><path d="M32 31v13" stroke="url(#rkg2k)" stroke-width="4.5" stroke-linecap="round"/>`,
  `<path d="M32 3 56 11v20c0 15-10 24-24 30C18 55 8 46 8 31V11Z" fill="url(#rkg3)"/><path d="M32 20 40 30 32 40 24 30Z" fill="#2a1b05"/>`,
  `<polygon points="${star(12, 31, 22)}" fill="url(#rkg4)"/><circle cx="32" cy="32" r="17" fill="url(#rkg4f)" stroke="url(#rkg4)" stroke-width="4"/><polygon points="${star(5, 10.5, 4.5)}" fill="url(#rkg4s)"/>`,
];

let installed = false;
export function installEmblems() {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  const holder = document.createElement('div');
  holder.innerHTML = `<svg xmlns="${NS}" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>${GRADS}</defs>${
    FULL.map((d, i) => `<symbol id="rk-${i}" viewBox="0 0 64 64" overflow="visible">${d}</symbol>`).join('')}${
    MINI.map((d, i) => `<symbol id="rk-m${i}" viewBox="0 0 64 64">${d}</symbol>`).join('')}</svg>`;
  document.body.prepend(holder.firstChild);
}

/** An emblem as an <svg> element. size in px; opts.mini forces the bold drawing (default under 28 px). */
export function emblem(rank, size = 18, opts = {}) {
  installEmblems();
  const i = Math.max(0, Math.min(RANKS.length - 1, rank | 0));
  const mini = opts.mini ?? size < 28;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', `rk-emb rk-${i}${mini ? ' is-mini' : ''}`);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', RANKS[i].name);
  svg.style.setProperty('--rk', RANK_COLORS[i]);
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#rk-${mini ? 'm' : ''}${i}`);
  svg.append(use);
  return svg;
}

/** The emblem + "#4821" that sits after a name (lobby, chat, results). null without a profile. */
export function rankBadge(pub, { tag = true, size = 15 } = {}) {
  if (!pub || pub.t == null) return null;
  return h('span.rk-badge', { title: `${RANKS[pub.r | 0].name} · ${fmtTag(pub.t)}`, style: { '--rk': RANK_COLORS[pub.r | 0] } },
    emblem(pub.r | 0, size), tag ? h('span.rk-tag', fmtTag(pub.t)) : null);
}
