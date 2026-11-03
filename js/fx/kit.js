// THE EFFECT LIBRARY — the shared kit: a seeded RNG, eases, and PRE-BAKED SPRITES (glows, puffs, flame licks, sparkles, hearts) — each
// baked ONCE per page at its size (ctx2d: counted by the memory guard) and reused by every effect + every slot. Effects never build a
// gradient per particle per frame: they stamp these.
import { ctx2d } from '../ui/canvas-safe.js';

/** a seeded RNG (mulberry32): the same seed → the same strip on every phone */
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const fract = v => v - Math.floor(v);
/** a cheap smooth 1-D noise (two sines at odd ratios) in -1..1 */
export const wob = (t, s = 0) => (Math.sin(t * 1.7 + s * 3.1) * 0.6 + Math.sin(t * 3.13 + s * 5.7) * 0.3 + Math.sin(t * 7.21 + s * 1.3) * 0.1);

const cache = new Map();
/** a baked sprite (a small canvas) by key; paint(c, w, h) draws it once */
export function sprite(key, w, h, paint) {
  let s = cache.get(key);
  if (s) return s;
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w)); cv.height = Math.max(1, Math.round(h));
  const c = ctx2d(cv);
  if (c) { try { paint(c, cv.width, cv.height); } catch (e) { console.warn('[fx sprite]', key, e); } }
  cache.set(key, cv);
  return cv;
}
/** drop the bakes keyed to a size (a resize / a tier change) */
export function forget(prefix) { for (const k of [...cache.keys()]) if (k.startsWith(prefix)) { const cv = cache.get(k); cv.width = cv.height = 0; cache.delete(k); } }

/** a round glow: rgb 'r,g,b', soft falloff (core = how much of it is solid) */
export const glow = (rgb, core = 0.18, n = 64) => sprite(`glow:${rgb}:${core}:${n}`, n, n, (c, w) => {
  const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(core, `rgba(${rgb},0.6)`); g.addColorStop(0.5, `rgba(${rgb},0.16)`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(0, 0, w, w);
});
/** stamp a sprite centred at (x, y), d wide (h tall), at an alpha */
export function stamp(c, img, x, y, d, a = 1, h = d) {
  if (a <= 0.003 || !(d > 0)) return;
  c.globalAlpha = a > 1 ? 1 : a;
  c.drawImage(img, x - d / 2, y - h / 2, d, h);
}
/** a 4-point sparkle star (the glint): thin cross + a soft core */
export const sparkle = (rgb = '255,255,255', n = 64) => sprite(`spk:${rgb}:${n}`, n, n, (c, w) => {
  const m = w / 2;
  const core = c.createRadialGradient(m, m, 0, m, m, m * 0.42); core.addColorStop(0, `rgba(${rgb},1)`); core.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = core; c.fillRect(0, 0, w, w);
  c.globalCompositeOperation = 'lighter';
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const g = c.createLinearGradient(m - dx * m, m - dy * m, m + dx * m, m + dy * m);
    g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.5, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    if (dx) c.fillRect(0, m - w * 0.035, w, w * 0.07); else c.fillRect(m - w * 0.035, 0, w * 0.07, w);
  }
});
/** a heart (filled, a soft highlight, its own glow) */
export const heart = (fill = '#ff4fb8', hi = '#ffd6ee', n = 64) => sprite(`heart:${fill}:${hi}:${n}`, n, n, (c, w) => {
  const s = w / 64;
  const path = () => { c.beginPath(); c.moveTo(32 * s, 54 * s); c.bezierCurveTo(8 * s, 38 * s, 6 * s, 20 * s, 18 * s, 14 * s); c.bezierCurveTo(26 * s, 10 * s, 31 * s, 15 * s, 32 * s, 21 * s); c.bezierCurveTo(33 * s, 15 * s, 38 * s, 10 * s, 46 * s, 14 * s); c.bezierCurveTo(58 * s, 20 * s, 56 * s, 38 * s, 32 * s, 54 * s); c.closePath(); };
  const halo = c.createRadialGradient(32 * s, 32 * s, 4 * s, 32 * s, 32 * s, 32 * s); halo.addColorStop(0, 'rgba(255,90,190,0.45)'); halo.addColorStop(1, 'rgba(255,90,190,0)');
  c.fillStyle = halo; c.fillRect(0, 0, w, w);
  path(); const g = c.createLinearGradient(20 * s, 12 * s, 44 * s, 54 * s); g.addColorStop(0, hi); g.addColorStop(0.45, fill); g.addColorStop(1, fill);
  c.fillStyle = g; c.fill();
  c.lineWidth = 1.6 * s; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.stroke();
  c.globalAlpha = 0.85; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(22 * s, 22 * s, 4.5 * s, 2.6 * s, -0.6, 0, Math.PI * 2); c.fill();
});
/** a smoke puff: several soft blobs overlapping (an organic edge, not a disc) — variant v */
export const puff = (rgb, v = 0, n = 128) => sprite(`puff:${rgb}:${v}:${n}`, n, n, (c, w) => {
  const r = rng(91 + v * 17), m = w / 2;
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = r() * m * 0.42, rr = m * (0.28 + r() * 0.3), x = m + Math.cos(a) * d, y = m + Math.sin(a) * d * 0.8;
    const g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, `rgba(${rgb},0.34)`); g.addColorStop(0.55, `rgba(${rgb},0.12)`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }
});
/** a flame lick: a teardrop of fire, white-hot at its root, red at its tip (drawn 'lighter') */
export const lick = (n = 64) => sprite(`lick:${n}`, n, n * 2, (c, w, h) => {
  c.translate(w / 2, h * 0.72); c.scale(1, 2.1);
  const g = c.createRadialGradient(0, 0, 0, 0, -w * 0.06, w * 0.5);
  g.addColorStop(0, 'rgba(255,246,214,0.95)'); g.addColorStop(0.18, 'rgba(255,214,120,0.85)'); g.addColorStop(0.42, 'rgba(255,130,40,0.55)'); g.addColorStop(0.7, 'rgba(210,40,12,0.22)'); g.addColorStop(1, 'rgba(120,10,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, w * 0.5, 0, Math.PI * 2); c.fill();
});
