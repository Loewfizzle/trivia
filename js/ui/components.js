// Reusable design-system components.
import { h, svgEl, reducedMotion } from './dom.js';
import { AVATARS, colorHex } from '../config.js';
import { serverNow } from '../firebase.js';
import { sfx } from '../audio/sfx.js';
import { rankBadge } from './emblems.js';
import { pubOf } from '../profile/public.js';

// Player emblems: every avatar has its own silhouette (the frame belongs to the icon — ghost → arch, crown → pentagon,
// wave → capsule…), so players are told apart by shape as well as colour, even tiny or colour-blind. Each is built
// like the NEON sign: dark glass lit from inside in the player's colour, a neon-tube rim (glow, colour, white-hot core),
// a soft sheen across the top, and the icon drawn as a tube too. Static SVG (no filters, nothing animated): cheap to
// draw anywhere, however many are on screen. viewBox 48×48 with room around it for the glow.
const oct = (r = 21) => { const a = Math.PI / 8; return 'M' + Array.from({ length: 8 }, (_, i) => `${(24 + r * Math.cos(a + i * Math.PI / 4)).toFixed(2)} ${(24 + r * Math.sin(a + i * Math.PI / 4)).toFixed(2)}`).join('L') + 'Z'; };
export const FRAMES = {
  // frame path, icon centre (x, y) and size (px of the 24-grid icon)
  bolt: ['M24 3L42 9V23C42 34 34 41 24 45C14 41 6 34 6 23V9Z', 24, 22.5, 24],                     // shield
  eye: ['M3 24C10 11 17 6.5 24 6.5S38 11 45 24C38 37 31 41.5 24 41.5S10 37 3 24Z', 24, 24, 24],   // almond
  diamond: ['M24 2L46 24L24 46L2 24Z', 24, 24, 21],                                               // diamond
  hex: ['M24 2L43 13V35L24 46L5 35V13Z', 24, 24, 24],                                             // hexagon
  ghost: ['M8 43V22A16 16 0 0 1 40 22V43L34.7 39.5L29.3 43L24 39.5L18.7 43L13.3 39.5Z', 24, 24, 23], // arch
  crown: ['M24 3L45 18.5L37 44H11L3 18.5Z', 24, 27.5, 22.5],                                          // pentagon
  star: [oct(21.5), 24, 24, 25],                                                                  // octagon
  moon: ['M24 2.5A21.5 21.5 0 1 1 23.99 2.5Z', 24, 24, 25],                                       // circle
  cube: ['M11 4H37A7 7 0 0 1 44 11V37A7 7 0 0 1 37 44H11A7 7 0 0 1 4 37V11A7 7 0 0 1 11 4Z', 24, 24, 25], // rounded square
  alien: ['M7 6.5Q3.6 6.5 5.3 9.6L21.2 41.5Q24 46 26.8 41.5L42.7 9.6Q44.4 6.5 41 6.5Z', 24, 19.5, 19.5], // shield-point (down)
  target: ['M11 4H37A6.5 6.5 0 0 0 44 11V37A6.5 6.5 0 0 0 37 44H11A6.5 6.5 0 0 0 4 37V11A6.5 6.5 0 0 0 11 4Z', 24, 24, 25], // notched ticket
  wave: ['M15 10.5H33A13.5 13.5 0 0 1 33 37.5H15A13.5 13.5 0 0 1 15 10.5Z', 24, 24, 24],           // capsule
};
let avatarSeq = 0;

export function avatar(avatarId, colorId, size = 40) {
  const id = AVATARS[avatarId] ? avatarId : 'bolt';
  const icon = AVATARS[id];
  const c = colorHex(colorId);
  const [frame, cx, cy, is] = FRAMES[id] || FRAMES.bolt;
  const k = is / 24;
  const n = `av${++avatarSeq}`;
  const iconT = `translate(${(cx - is / 2).toFixed(2)} ${(cy - is / 2).toFixed(2)}) scale(${k.toFixed(3)})`;
  const inset = 'translate(24 24) scale(0.83) translate(-24 -24)';
  const el = h('span.avatar', { 'data-av': id, style: { '--c': c, '--s': `${size}px` } });
  el.append(svgEl(`<svg viewBox="-4 -4 56 56" aria-hidden="true">
<defs>
<radialGradient id="${n}b" cx="0.5" cy="0.28" r="0.8"><stop offset="0" stop-color="${c}" stop-opacity="0.5"/><stop offset="0.5" stop-color="#0c1030" stop-opacity="0.96"/><stop offset="1" stop-color="#03040c"/></radialGradient>
<linearGradient id="${n}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.32"/><stop offset="0.42" stop-color="#fff" stop-opacity="0.04"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${n}c"><path d="${frame}"/></clipPath>
</defs>
<path d="${frame}" fill="none" stroke="${c}" stroke-opacity="0.22" stroke-width="7" stroke-linejoin="round"/>
<path d="${frame}" fill="url(#${n}b)"/>
<g clip-path="url(#${n}c)"><ellipse cx="24" cy="6" rx="30" ry="20" fill="url(#${n}s)"/></g>
${size >= 34 ? `<path d="${frame}" transform="${inset}" fill="none" stroke="${c}" stroke-opacity="0.32" stroke-width="1" stroke-linejoin="round"/>` : ''}
<path d="${frame}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="${frame}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="0.8" stroke-linejoin="round"/>
<g transform="${iconT}" fill="none" stroke-linecap="round" stroke-linejoin="round">
<path d="${icon}" stroke="${c}" stroke-opacity="${size >= 34 ? 0.35 : 0.22}" stroke-width="${(5 / k).toFixed(2)}"/>
<path d="${icon}" stroke="${c}" stroke-width="${((size >= 34 ? 2.6 : 3) / k).toFixed(2)}"/>
<path d="${icon}" stroke="#fff" stroke-opacity="0.92" stroke-width="${(1 / k).toFixed(2)}"/>
</g></svg>`));
  return el;
}

// Player chip: avatar + name + badges. opts: { you, host, offline, right }
export function playerChip(p, opts = {}) {
  const el = h('div.chip', { class: opts.offline ? 'is-offline' : null, style: { '--c': colorHex(p.color) } },
    avatar(p.avatar, p.color, opts.size || 36),
    h('div.chip-body',
      h('div.chip-name', p.name || '???', rankBadge(pubOf(p))),
      h('div.chip-tags',
        opts.host && h('span.tag.tag-host', 'HOST'),
        opts.you && h('span.tag.tag-you', 'YOU'),
        opts.offline && h('span.tag.tag-lost', 'SIGNAL LOST'),
        opts.sub && h('span.tag.tag-dim', opts.sub))),
    opts.right || null);
  return el;
}

// Countdown bar driven by server time. set(endsAt, totalMs)
// ticks: soft countdown ticks during the last 5 seconds.
export function createTimer({ warnAt = 10_000, ticks = false } = {}) {
  const fill = h('div.timer-fill');
  const num = h('div.timer-num', '--');
  const el = h('div.timer', h('div.timer-track', fill), num);
  let endsAt = 0, total = 1, raf = 0, lastSec = -1;
  function frame() {
    const left = Math.max(0, endsAt - serverNow());
    fill.style.transform = `scaleX(${Math.min(1, left / total)})`;
    const sec = Math.ceil(left / 1000);
    if (sec !== lastSec) {
      if (ticks && lastSec !== -1 && sec >= 1 && sec <= 5) sfx('tick', { last: sec === 1 });
      lastSec = sec;
      num.textContent = sec >= 60 ? `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` : String(sec).padStart(2, '0');
      el.classList.toggle('is-warn', left > 0 && left <= warnAt);
      el.classList.toggle('is-zero', left <= 0);
    }
    raf = left > 0 ? requestAnimationFrame(frame) : 0;
  }
  return {
    el,
    set(e, t) {
      if (e === endsAt && t === total) return;
      endsAt = e; total = Math.max(1, t); lastSec = -1;
      cancelAnimationFrame(raf); frame();
    },
    stop() { cancelAnimationFrame(raf); raf = 0; },
  };
}

// Animated number. Returns a cancel fn.
// Scores: 21,000 rather than 21000 (Neural Bluff totals get big).
export const fmtNum = n => Number(n || 0).toLocaleString('en-US');

export function countUp(el, from, to, ms = 900, fmt = fmtNum) {
  if (reducedMotion() || from === to) { el.textContent = fmt(to); return () => {}; }
  const t0 = performance.now();
  let raf;
  const step = t => {
    const k = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(from + (to - from) * e));
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

// Leaderboard. rows: [{ uid, score, rank, prevScore?, prevRank?, delta? }]
export function leaderboard(rows, players, { me, presence, stagger = 70 } = {}) {
  const list = h('ol.board-list');
  rows.forEach((r, i) => {
    const p = players[r.uid] || { name: 'GHOST', color: 'cyan', avatar: 'ghost' };
    const scoreEl = h('span.lb-score', fmtNum(r.prevScore ?? r.score));
    const move = r.prevRank && r.prevRank !== r.rank ? (r.prevRank > r.rank ? 'up' : 'down') : null;
    const row = h('li.lb-row', {
      class: [r.uid === me ? 'is-me' : '', r.rank === 1 ? 'is-first' : '', move ? `move-${move}` : ''].join(' '),
      style: { '--c': colorHex(p.color), '--i': i, animationDelay: `${i * stagger}ms` },
    },
    h('span.lb-rank', String(r.rank).padStart(2, '0')),
    avatar(p.avatar, p.color, 30),
    h('span.lb-name', p.name, rankBadge(pubOf(p)), presence && presence[r.uid] && presence[r.uid].online === false ? h('span.lb-lost', ' ⌁') : null,
      r.note ? h('small.lb-note', r.note) : null),
    r.delta ? h('span.lb-delta', `+${fmtNum(r.delta)}`) : null,
    move ? h('span.lb-move', move === 'up' ? '▲' : '▼') : null,
    scoreEl);
    list.append(row);
    setTimeout(() => countUp(scoreEl, r.prevScore ?? r.score, r.score, 1100), 250 + i * stagger);
  });
  if (rows.some(r => (r.prevScore ?? r.score) !== r.score)) setTimeout(() => sfx('shimmer'), 300);
  return list;
}

// Particle burst (transform/opacity only). Removes itself.
export function burst(container, colors = ['#00f0ff', '#ff2bd6', '#f3ff3a'], count = 36) {
  if (reducedMotion()) return;
  const wrap = h('div.burst');
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const d = 90 + Math.random() * 160;
    wrap.append(h('i', {
      style: {
        '--x': `${Math.cos(a) * d}px`, '--y': `${Math.sin(a) * d}px`, '--r': `${Math.random() * 360}deg`,
        background: colors[i % colors.length], animationDelay: `${Math.random() * 120}ms`,
      },
    }));
  }
  container.append(wrap);
  setTimeout(() => wrap.remove(), 1600);
}

// Full-screen glitch slice flash used on screen transitions.
export function glitchFlash() {
  if (reducedMotion()) return;
  const el = h('div.glitch-flash', h('i'), h('i'), h('i'));
  document.body.append(el);
  setTimeout(() => el.remove(), 450);
}

// Multi-select chips. values: array of selected values.
export function chips(options, values, onChange) {
  const sel = new Set(values || []);
  const el = h('div.chips', { role: 'group' });
  const render = () => [...el.children].forEach(b => b.setAttribute('aria-pressed', String(sel.has(b.dataset.v))));
  options.forEach(o => el.append(h('button.chip-btn', {
    type: 'button', dataset: { v: String(o.value) },
    onclick: () => { if (sel.has(o.value)) sel.delete(o.value); else sel.add(o.value); render(); onChange([...sel]); },
  }, o.label)));
  render();
  return el;
}

// Segmented control. options: [{ value, label }]
export function segmented(options, value, onChange) {
  const el = h('div.seg', { role: 'radiogroup' });
  const render = v => [...el.children].forEach(b => b.classList.toggle('is-on', b.dataset.v === String(v)));
  options.forEach(o => el.append(h('button.seg-btn', {
    type: 'button', role: 'radio', dataset: { v: String(o.value) },
    onclick: () => { render(o.value); onChange(o.value); },
  }, o.label)));
  render(value);
  return el;
}

// ---------------------------------------------------------------- THE SHELL's parts (SHELL 2.0 A — components.css "THE SHELL")
// THE NEON TUBE: tubeButton(label, { kind: 'main'|'secondary'|'danger', size: 'sm', block, onClick, confirm, busy, disabled, cls, attrs })
//   kind main = the pink tube (ONE per screen), secondary = the quiet cool-white tube, danger = the red tube. confirm: 'TAP AGAIN TO …' →
//   the first tap turns the button itself red-filled with those words; the second within 2.5 s runs onClick (confirmTap).
const KIND = { main: '.btn-primary', secondary: '.btn-ghost', danger: '.btn-danger' };
export function tubeButton(label, { kind = 'secondary', size = '', block = false, onClick = null, confirm = null, disabled = false, cls = '', attrs = {} } = {}) {
  const sel = `button.btn${KIND[kind] || KIND.secondary}${size === 'sm' ? '.btn-sm' : size === 'xl' ? '.btn-xl' : ''}${block ? '.btn-block' : ''}${cls ? `.${cls.split(' ').join('.')}` : ''}`;
  const b = h(sel, { type: 'button', disabled: disabled || null, ...attrs }, h('span', label));
  if (confirm) confirmTap(b, confirm, onClick);
  else if (onClick) b.addEventListener('click', onClick);
  return b;
}
/** CONFIRM-BY-SECOND-TAP on any tube button or row: the first tap arms it (red-filled + `text`), a second within `ms` runs `run`; it
 *  disarms by itself. The label is the element's first <span> (a row: its .sh-row-l b). Never a toast. → disarm() */
export function confirmTap(el, text, run, { ms = 2500 } = {}) {
  const lab = () => el.querySelector('.sh-row-l b') || el.querySelector('span') || el;
  let at = 0, t = 0, orig = null;
  const disarm = () => { clearTimeout(t); at = 0; el.classList.remove('is-confirm'); if (orig != null) { lab().textContent = orig; orig = null; } };
  el.addEventListener('click', e => {
    if (at && Date.now() - at < ms) { disarm(); if (run) run(e); return; }
    at = Date.now(); orig = lab().textContent; lab().textContent = text; el.classList.add('is-confirm');
    clearTimeout(t); t = setTimeout(() => { if (el.isConnected) disarm(); }, ms);
  });
  return disarm;
}

// THE ROW: row({ icon, label, sub, value, chevron = true, toggle, on, danger, onClick, confirm, cls, ic }) — the glass row (56 pt, a neon
//   line icon, the label, a value on the right, a ›). toggle: a function(next) → the pink switch on the right (no ›), `on` its state.
export function row({ icon = null, label = '', sub = null, value = null, chevron = true, toggle = null, on = false, danger = false, onClick = null, confirm = null, cls = '', ic = null, attrs = {} } = {}) {
  const sw = toggle ? h('span.switch', { role: 'switch', 'aria-checked': String(!!on), 'aria-hidden': 'true' }, h('i')) : null;
  const el = h(`button.sh-row${danger ? '.is-danger' : ''}${cls ? `.${cls.split(' ').join('.')}` : ''}`, { type: 'button', style: ic ? { '--ic': ic } : null, ...(toggle ? { role: 'switch', 'aria-checked': String(!!on) } : {}), ...attrs },
    icon ? h('span.sh-row-ic', { html: ICONS[icon] || icon, 'aria-hidden': 'true' }) : null,
    h('span.sh-row-l', h('b', label), sub ? h('small', sub) : null),
    value != null && value !== '' ? h('span.sh-row-v', String(value)) : null,
    sw || (chevron ? h('span.sh-row-chev', { 'aria-hidden': 'true' }, '›') : null));
  if (toggle) {
    let state = !!on;
    el.addEventListener('click', () => { state = !state; el.setAttribute('aria-checked', String(state)); sw.setAttribute('aria-checked', String(state)); toggle(state); });
  } else if (confirm) confirmTap(el, confirm, onClick);
  else if (onClick) el.addEventListener('click', onClick);
  return el;
}

// the rows' neon LINE icons (24 × 24, stroked in the row's --ic colour)
const svg = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
export const ICONS = {
  card: svg('<path d="M12 3l7 3v5.5c0 4.3-3 7.7-7 9.5-4-1.8-7-5.2-7-9.5V6z"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><path d="M12 17.2v.1"/>'),
  settings: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>'),
  sound: svg('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  lab: svg('<path d="M9.5 3h5M10 3v6.2L4.8 18.4A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3"/><path d="M7.4 15h9.2"/>'),
  admin: svg('<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/>'),
  leave: svg('<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14"/><path d="M3.5 12h11M10.5 8l4 4-4 4"/>'),
  chat: svg('<path d="M4.5 5.5h15a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H10l-4.5 3.5V17h-1a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z"/>'),
  board: svg('<path d="M8 4h8v4.5a4 4 0 0 1-8 0z"/><path d="M8 5.5H4.5a3 3 0 0 0 3.6 3.4M16 5.5h3.5a3 3 0 0 1-3.6 3.4"/><path d="M12 12.5v3.5M8.5 20h7l-1-4h-5z"/>'),
  credits: svg('<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>'),
  quit: svg('<path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10"/><path d="M20.5 12h-11M13.5 8l-4 4 4 4"/>'),
  end: svg('<circle cx="12" cy="12" r="9"/><rect x="9" y="9" width="6" height="6" rx="1"/>'),
  music: svg('<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>'),
  key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16.5 6.5l2 2M14.5 8.5l1.5 1.5"/>'),
  user: svg('<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
  invite: svg('<path d="M4 12.5l16-8-5 16-3.5-6.5z"/><path d="M11.5 14l3-3"/>'),
  games: svg('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
};
