// Reusable design-system components.
import { h, svgEl, reducedMotion } from './dom.js';
import { AVATARS, colorHex } from '../config.js';
import { serverNow } from '../firebase.js';
import { sfx } from '../audio/sfx.js';

export function avatar(avatarId, colorId, size = 40) {
  const path = AVATARS[avatarId] || AVATARS.bolt;
  const el = h('span.avatar', { style: { '--c': colorHex(colorId), '--s': `${size}px` } });
  el.append(svgEl(`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg>`));
  return el;
}

// Player chip: avatar + name + badges. opts: { you, host, offline, right }
export function playerChip(p, opts = {}) {
  const el = h('div.chip', { class: opts.offline ? 'is-offline' : null, style: { '--c': colorHex(p.color) } },
    avatar(p.avatar, p.color, opts.size || 36),
    h('div.chip-body',
      h('div.chip-name', p.name || '???'),
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
export function countUp(el, from, to, ms = 900, fmt = n => String(n)) {
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
    const scoreEl = h('span.lb-score', String(r.prevScore ?? r.score));
    const move = r.prevRank && r.prevRank !== r.rank ? (r.prevRank > r.rank ? 'up' : 'down') : null;
    const row = h('li.lb-row', {
      class: [r.uid === me ? 'is-me' : '', r.rank === 1 ? 'is-first' : '', move ? `move-${move}` : ''].join(' '),
      style: { '--c': colorHex(p.color), '--i': i, animationDelay: `${i * stagger}ms` },
    },
    h('span.lb-rank', String(r.rank).padStart(2, '0')),
    avatar(p.avatar, p.color, 30),
    h('span.lb-name', p.name, presence && presence[r.uid] && presence[r.uid].online === false ? h('span.lb-lost', ' ⌁') : null,
      r.note ? h('small.lb-note', r.note) : null),
    r.delta ? h('span.lb-delta', `+${r.delta}`) : null,
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

// "ACCESS GRANTED" room-join effect.
export function accessGranted(code) {
  const el = h('div.access', { 'aria-hidden': 'true' },
    h('div.access-ring'), h('div.access-ring.r2'), h('div.access-ring.r3'),
    h('div.access-text', h('small', 'UPLINK ESTABLISHED'), h('strong', 'ACCESS GRANTED'), h('small.mono', `ROOM ${code}`)));
  document.body.append(el);
  sfx('join');
  setTimeout(() => el.classList.add('out'), reducedMotion() ? 600 : 1300);
  setTimeout(() => el.remove(), reducedMotion() ? 900 : 1800);
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
