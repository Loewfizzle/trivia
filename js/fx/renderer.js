// THE EFFECT LIBRARY — THE ONE SHARED RENDERER (THE VAULT 1A; docs/vault.md). Size-agnostic effects (js/fx/*.js) draw into RECTS of a
// SURFACE: one canvas behind a host's children (a list of strips, the lab, later the lobby's guest list, an emblem row, the end of round)
// — never a canvas per card. ONE clock, ONE requestAnimationFrame for every surface on the page; a surface draws only while it's on screen
// (IntersectionObserver) and the page is visible, each slot only while ITS element is on screen; reduced motion = each slot's still frame,
// drawn once. Sizes come from ResizeObservers (never a layout read in the frame loop — CLAUDE.md). The canvas through ctx2d (the memory
// guard counts it). Its pixel ratio + the effects' particle share come from THE TIER TABLE (core/harbor-tiers.js: fxDpr, fxParticles),
// the tier stepped by its own frame-time guard (the same idea as the city's: slow frames step it down, a long calm steps it up).
//
// LAYERING (no extra canvases): the host is its own stacking context; a slot element (a strip) must NOT be one (no transform / opacity /
// filter on the strip itself) so its children interleave with the canvas: the material (z 0) < the canvas (z 1) < the plate + frame (z 2+).
//
//   const S = createSurface(host)           host: position relative (the slots' offsetParent)
//   const slot = S.add(el, effect, opts)    opts: { tint, seed, calm (0..1: the lobby's calmer cut), phase, still (a fixed still time) }
//   S.remove(el) · S.destroy() · S.redraw()
//   fxStats → { fps, tier, ms, slots, mp }  (the lab's readout)
import { ctx2d } from '../ui/canvas-safe.js';
import { tierVal } from '../core/harbor-tiers.js';

const surfaces = new Set();
let raf = 0, lastT = 0, tier = 2, forced = null;
let slowRun = 0, calmRun = 0, frames = 0, fpsT = 0;
export const fxStats = { fps: 0, tier: 2, ms: 0, slots: 0, mp: 0, frames: 0 };

/** reduced motion: the OS setting or the app's REDUCED EFFECTS (body.reduced-fx / na:settings) */
let reducedFlag = null;
export function fxReduced() {
  if (reducedFlag != null) return reducedFlag;
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (document.body && document.body.classList.contains('reduced-fx')) return true;
    const s = JSON.parse(localStorage.getItem('na:settings') || '{}'); return !!s.reducedFx;
  } catch { return false; }
}
/** the lab's STILL switch (null = follow the settings) */
export function setFxReduced(v) { reducedFlag = v == null ? null : !!v; for (const S of surfaces) S.dirty = true; kick(); }
/** pin the tier (the lab's TIER buttons; null = the guard decides) */
export function setFxTier(t) { forced = t == null ? null : Math.max(0, Math.min(2, t)); if (forced != null) setTier(forced); }
function setTier(t) { if (t === tier) return; tier = t; fxStats.tier = t; for (const S of surfaces) S.sized = false; }

/** a quality bundle for the effects this frame */
const quality = () => ({ q: tierVal('fxParticles', tier) / 100, tier });

function measure(S) {
  const w = S.host.clientWidth, h = S.host.clientHeight;   // (only in a ResizeObserver callback / when marked — never per frame)
  S.w = w; S.h = h;
  for (const sl of S.slots.values()) {
    // (the slot's offset inside the host, summed up the offsetParent chain — the host is positioned: .fx-host)
    let x = 0, y = 0, e = sl.el; while (e && e !== S.host) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    sl.x = x; sl.y = y; sl.w = sl.el.offsetWidth; sl.h = sl.el.offsetHeight;
  }
  S.sized = false; S.dirty = true;
}
function size(S) {
  const want = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, tierVal('fxDpr', tier) / 10);
  const W = Math.max(1, Math.round(S.w * want)), H = Math.max(1, Math.round(S.h * want));
  if (S.cv.width !== W || S.cv.height !== H) { S.cv.width = W; S.cv.height = H; }
  S.dpr = want; S.sized = true; S.dirty = true;
}

export function createSurface(host, o = {}) {
  host.classList.add('fx-host');
  const cv = document.createElement('canvas');
  cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true');
  host.prepend(cv);
  const S = { host, cv, c: ctx2d(cv), slots: new Map(), w: 0, h: 0, dpr: 1, on: true, dirty: true, sized: false, label: o.label || '' };
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => { measure(S); kick(); }) : null;
  if (ro) ro.observe(host);
  const io = typeof IntersectionObserver !== 'undefined' ? new IntersectionObserver(es => {
    for (const e of es) {
      if (e.target === host) S.on = e.isIntersecting;
      else { const sl = S.slots.get(e.target); if (sl) sl.on = e.isIntersecting; }
    }
    S.dirty = true; kick();
  }, { rootMargin: '40px' }) : null;
  if (io) io.observe(host);
  surfaces.add(S);
  measure(S);
  kick();
  const api = {
    surface: S,
    add(el, effect, opts = {}) {
      const sl = { el, fx: effect, opts, st: null, on: true, x: 0, y: 0, w: 0, h: 0, phase: opts.phase != null ? opts.phase : (opts.seed || 0) * 1.618 % 9 };
      S.slots.set(el, sl);
      if (ro) ro.observe(el);
      if (io) io.observe(el);
      measure(S); kick();
      return sl;
    },
    remove(el) { const sl = S.slots.get(el); if (!sl) return; S.slots.delete(el); if (ro) ro.unobserve(el); if (io) io.unobserve(el); S.dirty = true; kick(); },
    redraw() { measure(S); kick(); },
    destroy() { surfaces.delete(S); if (ro) ro.disconnect(); if (io) io.disconnect(); cv.width = cv.height = 0; cv.remove(); },
  };
  return api;
}

/** a rounded-rect path (the strip's own corner radius) */
export function rrect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

function drawSurface(S, t, still, Q) {
  const c = S.c; if (!c) return 0;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, S.cv.width, S.cv.height);
  let n = 0;
  for (const sl of S.slots.values()) {
    if (!sl.fx || !sl.on || sl.w <= 0 || sl.h <= 0) continue;
    const tt = still ? (sl.opts.still != null ? sl.opts.still : (sl.fx.stillT != null ? sl.fx.stillT : 3)) : t + sl.phase;
    c.setTransform(S.dpr, 0, 0, S.dpr, S.dpr * sl.x, S.dpr * sl.y);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    try { sl.fx.draw(c, sl, tt, { ...Q, still, dpr: S.dpr, calm: sl.opts.calm || 0 }); } catch (e) { console.warn('[fx]', sl.fx.id, e); sl.fx = null; }
    n++;
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  return n;
}

function guard(dt) {
  if (forced != null || dt > 250) return;          // (a tab switch / a stall is not a slow phone)
  if (dt > 22) { slowRun++; calmRun = 0; } else if (dt < 18) { calmRun++; slowRun = Math.max(0, slowRun - 1); }
  if (slowRun > 40 && tier > 0) { setTier(tier - 1); slowRun = 0; calmRun = 0; }
  else if (calmRun > 600 && tier < 2) { setTier(tier + 1); calmRun = 0; }
}

function frame(now) {
  raf = 0;
  const dt = lastT ? now - lastT : 16.7; lastT = now;
  const still = fxReduced();
  if (!still) guard(dt);
  const t0 = performance.now(), Q = quality();
  let live = false, drawn = 0, px = 0;
  for (const S of surfaces) {
    if (!S.on || (typeof document !== 'undefined' && document.hidden)) continue;
    if (!S.sized) size(S);
    px += S.cv.width * S.cv.height;
    if (still && !S.dirty) continue;
    drawn += drawSurface(S, now / 1000, still, Q);
    S.dirty = false;
    if (!still && S.slots.size) live = true;
  }
  frames++; fxStats.frames++;
  if (now - fpsT > 1000) { fxStats.fps = Math.round(frames * 1000 / (now - fpsT)); frames = 0; fpsT = now; }
  fxStats.ms = +(performance.now() - t0).toFixed(2); fxStats.slots = drawn; fxStats.mp = +(px / 1e6).toFixed(2); fxStats.tier = tier;
  if (live) raf = requestAnimationFrame(frame); else lastT = 0;
}
export function kick() {
  if (raf || typeof requestAnimationFrame === 'undefined') return;
  raf = requestAnimationFrame(frame);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { lastT = 0; if (!document.hidden) { for (const S of surfaces) S.dirty = true; kick(); } });
