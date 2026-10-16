// NEON PAR — ball customization (color, finish, trail; saved on this device) and the canvas-drawn
// icons shared by the 3D scene and the HUD. No three.js here, so the lobby can open the picker
// without loading the renderer.
import { h } from '../../ui/dom.js';
import { sfx } from '../../audio/sfx.js';

export const BALL_COLORS = ['#2ff5d2', '#ff4fa3', '#ffb627', '#a374ff', '#36e6ff', '#ff5a4f', '#c8ff4f', '#f4f4ff'];
export const FINISHES = [
  { id: 'neon', label: 'NEON', sub: 'Glows' },
  { id: 'chrome', label: 'CHROME', sub: 'Mirror' },
  { id: 'glass', label: 'GLASS', sub: 'See-through' },
];
export const TRAILS = [
  { id: 'ribbon', label: 'RIBBON' },
  { id: 'sparks', label: 'SPARKS' },
  { id: 'pixels', label: 'PIXELS' },
];
const KEY = 'na:golfball';
const DEFAULT = { c: BALL_COLORS[0], f: 'neon', t: 'ribbon' };

export function sanitizeStyle(s) {
  const o = s && typeof s === 'object' ? s : {};
  return {
    c: BALL_COLORS.includes(o.c) ? o.c : DEFAULT.c,
    f: FINISHES.some(x => x.id === o.f) ? o.f : DEFAULT.f,
    t: TRAILS.some(x => x.id === o.t) ? o.t : DEFAULT.t,
  };
}
export function loadStyle() {
  try { return sanitizeStyle(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch { return { ...DEFAULT }; }
}
export function saveStyle(s) {
  try { localStorage.setItem(KEY, JSON.stringify(sanitizeStyle(s))); } catch { /* private mode: just this session */ }
  listeners.forEach(fn => fn(sanitizeStyle(s)));
}
const listeners = new Set();
export const onStyle = fn => { listeners.add(fn); return () => listeners.delete(fn); };

/** A CSS ball (radial gradients) for previews. */
export function ballPreview(style, size = 64) {
  const s = sanitizeStyle(style);
  return h('span.gb-ball', { class: `gb-${s.f}`, style: { '--c': s.c, '--s': `${size}px` } }, h('i'));
}

/** Bottom sheet to pick your ball. */
export function openBallPicker() {
  let style = loadStyle();
  const preview = h('div.gb-preview');
  const paint = () => {
    preview.replaceChildren(ballPreview(style, 92), h('div.gb-trail', { class: `gt-${style.t}`, style: { '--c': style.c } }, h('i'), h('i'), h('i'), h('i'), h('i')));
    colors.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === style.c)));
    finishes.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === style.f)));
    trails.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.v === style.t)));
  };
  const set = patch => { style = sanitizeStyle({ ...style, ...patch }); saveStyle(style); sfx('select'); paint(); };
  const colors = h('div.gb-colors', { role: 'radiogroup', 'aria-label': 'Ball color' },
    BALL_COLORS.map(c => h('button.gb-color', { type: 'button', role: 'radio', 'aria-label': c, dataset: { v: c, sfx: 'none' }, style: { '--c': c }, onclick: () => set({ c }) })));
  const finishes = h('div.gb-opts', { role: 'radiogroup', 'aria-label': 'Finish' },
    FINISHES.map(f => h('button.gb-opt', { type: 'button', role: 'radio', dataset: { v: f.id, sfx: 'none' }, onclick: () => set({ f: f.id }) },
      ballPreview({ ...style, f: f.id }, 26), h('span', f.label))));
  const trails = h('div.gb-opts', { role: 'radiogroup', 'aria-label': 'Trail' },
    TRAILS.map(t => h('button.gb-opt', { type: 'button', role: 'radio', dataset: { v: t.id, sfx: 'none' }, onclick: () => set({ t: t.id }) },
      h('span.gb-tr-icon', { class: `gti-${t.id}` }), h('span', t.label))));
  const close = () => { modal.classList.add('out'); setTimeout(() => modal.remove(), 260); };
  const modal = h('div.modal', { dataset: { theme: 'golf' }, onclick: e => { if (e.target === modal) close(); } },
    h('div.sheet.gb-sheet',
      h('div.sheet-grip'),
      h('div.sheet-kicker', 'NEON PAR'),
      h('h2.sheet-title', 'MY BALL'),
      preview,
      h('div.field', h('span.label', 'COLOR'), colors),
      h('div.field', h('span.label', 'FINISH'), finishes),
      h('div.field', h('span.label', 'TRAIL'), trails),
      h('p.gb-note', 'Saved on this device. Everyone sees your ball as a ghost with your name.'),
      h('button.btn.btn-primary.btn-block', { type: 'button', onclick: close }, h('span', 'DONE'))));
  document.body.append(modal);
  paint();
  return close;
}

export const POWER_COLOR = { ghost: '#9ff6ff', sticky: '#ffb627', magnet: '#ff4fa3' };
export const POWER_INFO = {
  ghost: { name: 'GHOST', text: 'Next shot passes through walls (not over the edge).', short: 'THROUGH WALLS' },
  sticky: { name: 'STICKY', text: 'Next shot stops dead on the first wall it touches.', short: 'STOPS AT THE FIRST WALL' },
  magnet: { name: 'MAGNET', text: 'Next shot: the cup pulls the ball in.', short: 'THE CUP PULLS IT IN' },
};
export const SAB_INFO = {
  fog: { name: 'FOG', text: 'Thick fog around their ball' },
  wobble: { name: 'WOBBLE', text: 'Their aim drifts' },
  shake: { name: 'SHAKE', text: 'Their camera shakes' },
};

/** Draws a power-up icon centered in a 128×128 canvas context. */
export function drawPowerIcon(x, kind) {
  const col = POWER_COLOR[kind];
  x.save();
  x.clearRect(0, 0, 128, 128);
  x.translate(64, 64);
  x.fillStyle = 'rgba(8,10,24,0.85)'; x.beginPath(); x.arc(0, 0, 54, 0, Math.PI * 2); x.fill();
  x.strokeStyle = col; x.lineWidth = 6; x.beginPath(); x.arc(0, 0, 54, 0, Math.PI * 2); x.stroke();
  x.fillStyle = col; x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round';
  if (kind === 'ghost') {
    for (const [ox, a] of [[-14, 0.3], [-6, 0.55], [4, 1]]) { x.globalAlpha = a; x.beginPath(); x.arc(ox, 0, 18, 0, Math.PI * 2); x.fill(); }
    x.globalAlpha = 1; x.lineWidth = 5; x.setLineDash([7, 6]); x.beginPath(); x.moveTo(28, -28); x.lineTo(28, 28); x.stroke();
  } else if (kind === 'sticky') {
    x.beginPath(); x.moveTo(0, -32); x.bezierCurveTo(22, -6, 26, 10, 0, 30); x.bezierCurveTo(-26, 10, -22, -6, 0, -32); x.fill();
    x.fillStyle = 'rgba(8,10,24,0.85)'; x.beginPath(); x.arc(-7, 6, 6, 0, Math.PI * 2); x.fill();
  } else {
    x.lineWidth = 13; x.beginPath(); x.arc(0, 2, 20, Math.PI, 0, true); x.stroke();
    x.beginPath(); x.moveTo(-20, 2); x.lineTo(-20, -22); x.moveTo(20, 2); x.lineTo(20, -22); x.stroke();
    x.strokeStyle = '#ffffff'; x.beginPath(); x.moveTo(-20, -15); x.lineTo(-20, -24); x.moveTo(20, -15); x.lineTo(20, -24); x.stroke();
  }
  x.restore();
}
export function powerIconCanvas(kind, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  c.style.width = c.style.height = `${size}px`;
  drawPowerIcon(c.getContext('2d'), kind);
  return c;
}
