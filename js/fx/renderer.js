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
//   fxStats → { fps, tier, ms, slots, mp, fms, slow, dpr }  (the lab's readout)
//
// THE VAULT 1B — SPEED (the owner's iPhone: 8 legendary strips ~42 fps, 38 scrolling, with "0 ms" of effect time): on iOS a 2D canvas
// is RASTERISED BY CoreGraphics IN SAFARI's GPU PROCESS — the script only records the calls, so performance.now() around the draw reads
// ~0 while the real cost (every call, every blended pixel) lands outside the page's timer and still delays the frame. So: (1) the
// effects draw FEW, CHEAP calls (statics baked once — fx.base, drawn into the strip's own CSS material, never into the canvas per frame;
// particles stamped from sprites); (2) WHILE A FINGER SCROLLS nothing redraws (the canvas is a layer: it scrolls with the page for free)
// and the effects' clock pauses, resuming where it stopped; (3) the guard never trades quality for nothing: a step down that doesn't
// make the frames faster is undone and the tier held (the cost wasn't the canvas's pixels). fxDiag = THE DIAGNOSTICS ROW's switches.
import { ctx2d } from '../ui/canvas-safe.js';
import { tierVal } from '../core/harbor-tiers.js';
import { glPainter } from './gl.js';

const surfaces = new Set();
let raf = 0, lastT = 0, tier = 2, forced = null;
let slowRun = 0, calmRun = 0, frames = 0, fpsT = 0, dtSum = 0, slowN = 0;
let clock = 0;                                   // the effects' own clock (s) — it pauses while a finger scrolls
export const fxStats = { fps: 0, tier: 2, ms: 0, slots: 0, mp: 0, frames: 0, fms: 0, slow: 0, dpr: 1, scrolling: false, held: false, gpu: false, draws: 0 };

/** THE DIAGNOSTICS ROW (the lab, owner-only — js/vault/lab-views.js): each switch turns ONE cost off so the owner can find it from his
 *  phone. fx = the whole effect canvas · laser = THE BORDER LASER · sprites = the UFO's baked model + ports · scrollPause = hold the
 *  frame while a finger scrolls (on by default — the shipped behaviour). (CSS glows + emblems are the lab's classes on the page.) */
export const fxDiag = { fx: true, laser: true, sprites: true, scrollPause: true, gpu: true };
/** an image an effect draws just arrived (sg-kit.js#image): every surface draws again — a STILL frame (reduced motion) drawn before it came
 *  would otherwise stay without it (OVERCLOCK CARDS: REDLINE's needle + cap were missing from the still frame) */
export function fxAssetIn() { for (const S of surfaces) S.dirty = true; kick(); }
export function setFxDiag(k, v) {
  if (!(k in fxDiag)) return;
  const was = fxDiag[k]; fxDiag[k] = !!v;
  if (k === 'gpu' && was !== fxDiag[k]) for (const S of surfaces) canvasFor(S);     // (GPU DRAW ↔ 2D: a fresh canvas each way)
  for (const S of surfaces) S.dirty = true; kick();
}
// THE GPU PATH (THE VAULT 1B): every surface draws through THE GL PAINTER (js/fx/gl.js — WebGL2, a 2D look-alike: the effects' code is
// the same) unless WebGL2 is missing / refused / lost, the address says &fx=2d, or the lab's GPU DRAW switch is off → the 2D canvas
// (the fallback — the same looks, CoreGraphics' cost on an iPhone).
const gpuWanted = () => { if (!fxDiag.gpu) return false; try { return !/[?&]fx=2d\b/.test(location.search); } catch { return true; } };

// WHILE A FINGER SCROLLS: any scroll on the page (capture: a scrolling list inside it too) or a touch moving holds the effects (no
// redraw, the clock paused) until ~160 ms after the last one — then they resume where they stopped.
let scrollUntil = 0, resumeT = 0;
function onScroll() {
  if (!fxDiag.scrollPause) return;
  scrollUntil = performance.now() + 160; fxStats.scrolling = true;
  if (!resumeT) resumeT = setTimeout(resume, 180);
}
function resume() {
  resumeT = 0;
  const left = scrollUntil - performance.now();
  if (left > 0) { resumeT = setTimeout(resume, left + 20); return; }
  fxStats.scrolling = false; lastT = 0; kick();
}
if (typeof document !== 'undefined') {
  document.addEventListener('scroll', onScroll, { capture: true, passive: true });
  document.addEventListener('touchmove', onScroll, { capture: true, passive: true });
}
const scrolling = () => fxDiag.scrollPause && fxStats.scrolling && performance.now() < scrollUntil + 400;

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
/** the tier the guard / the lab has set (tests + the readout) */
export const fxTier = () => tier;

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
  // (the pixel ratio: the device's, capped by THE TIER TABLE — fxDprGl on the GPU path (the phone's full 3× at the top tier: the GPU
  // pays pixels, not calls), fxDpr on the 2D one — and by THE PIXEL BUDGET: a tall surface (the lab's whole list) never allocates more
  // than ~2.6 MP; a lobby of 8 at 3× is ~1.9 MP and never meets it)
  const cap = tierVal(S.gl ? 'fxDprGl' : 'fxDpr', tier) / 10;
  const want = Math.max(1, Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, cap, Math.sqrt(2.6e6 / Math.max(1, S.w * S.h))));
  const W = Math.max(1, Math.round(S.w * want)), H = Math.max(1, Math.round(S.h * want));
  if (S.cv.width !== W || S.cv.height !== H) { S.cv.width = W; S.cv.height = H; }
  S.dpr = want; S.sized = true; S.dirty = true;
}

/** the surface's canvas: the GPU one (THE GL PAINTER) or the 2D one — a fresh element each time (a canvas keeps its first context) */
function canvasFor(S) {
  if (S.gl) { S.gl.destroy(); S.gl = null; }
  if (S.cv) { S.cv.width = S.cv.height = 0; S.cv.remove(); }
  const make = () => { const cv = document.createElement('canvas'); cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true'); S.host.prepend(cv); return cv; };
  let cv = make();
  if (gpuWanted() && !S.noGpu) {
    const P = glPainter(cv);
    if (P) { S.cv = cv; S.gl = P; S.c = P.ctx; S.sized = false; S.dirty = true; return; }
    cv.remove(); cv = make();                      // (the GL try may have taken the canvas: a clean one for 2D)
  }
  S.cv = cv; S.c = ctx2d(cv); S.sized = false; S.dirty = true;
}

export function createSurface(host, o = {}) {
  host.classList.add('fx-host');
  const S = { host, cv: null, gl: null, c: null, slots: new Map(), w: 0, h: 0, dpr: 1, on: true, dirty: true, sized: false, label: o.label || '' };
  canvasFor(S);
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
    remove(el) { const sl = S.slots.get(el); if (!sl) return; S.slots.delete(el); unpainted(sl); if (ro) ro.unobserve(el); if (io) io.unobserve(el); S.dirty = true; kick(); },
    redraw() { measure(S); kick(); },
    destroy() { surfaces.delete(S); for (const sl of S.slots.values()) unpainted(sl); if (ro) ro.disconnect(); if (io) io.disconnect(); if (S.gl) S.gl.destroy(); S.cv.width = S.cv.height = 0; S.cv.remove(); },
  };
  S.destroy = api.destroy;
  return api;
}

// SPEED PASS B — THE COVER (the owner, Nov 4 8:05 pm: CUSTOMIZE → VIEW FULL lagged — the slim preview's code rain + the grid's thumbnails
// kept drawing under the full card; measured 33 ms a frame over CUSTOMIZE vs 16.7 alone at 4× CPU): fxCover(keep) HOLDS every surface
// outside `keep` — not drawn, not cleared (its canvas keeps the frame it showed), its time stopped — until the returned uncover() lets it
// go on from that same frame. Covers stack (a card over a card). Surfaces made after the cover (the full card's own) are never held.
const covers = [];
export function fxCover(keep) {
  const held = [...surfaces].filter(S => !(keep && keep.contains(S.host)));
  for (const S of held) { if (!S.held) S.heldAt = clock; S.held = (S.held || 0) + 1; }
  const c = { held }; covers.push(c);
  return () => {
    const i = covers.indexOf(c); if (i < 0) return; covers.splice(i, 1);
    for (const S of held) if (S.held && !--S.held) { S.toff = (S.toff || 0) + (clock - S.heldAt); S.dirty = true; }
    kick();
  };
}
/** TESTS — the fx slots drawn last frame on surfaces outside `el` (0 = nothing behind it moves) */
export const fxBehind = (el = typeof document !== 'undefined' ? document.querySelector('.vl-full') : null) => { let n = 0; for (const S of surfaces) if (!(el && el.contains(S.host))) n += S.lastN || 0; return n; };

/** a rounded-rect path (the strip's own corner radius) */
export function rrect(c, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath();
  if (c.roundRect) { c.roundRect(x, y, w, h, r); return; }
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// LOAD FIX 3 — NO BLACK TILES: a slot this renderer has PAINTED is marked `.fx-on` on its element — a card drawn in code shows its baked
// still (css/vault.css, vault/stills.js) only while it is NOT painted (the after-match tile, a strip past the budget, before the first frame)
const painted = sl => { if (!sl.painted && sl.el && sl.el.classList) { sl.painted = true; sl.el.classList.add('fx-on'); } };
const unpainted = sl => { if (sl.painted && sl.el && sl.el.classList) { sl.painted = false; sl.el.classList.remove('fx-on'); } };
function clearSurface(S) {
  for (const sl of S.slots.values()) unpainted(sl);
  if (S.gl) { S.gl.begin(S.cv.width, S.cv.height); S.gl.end(); return 0; }
  if (S.c) { S.c.setTransform(1, 0, 0, 1, 0, 0); S.c.clearRect(0, 0, S.cv.width, S.cv.height); }
  return 0;
}
function drawSurface(S, t, still, Q) {
  if (S.gl && S.gl.lost) { S.noGpu = true; canvasFor(S); size(S); }          // (a lost GPU context: this surface draws in 2D from now on)
  const c = S.c; if (!c) return 0;
  if (S.gl) S.gl.begin(S.cv.width, S.cv.height);
  else { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, S.cv.width, S.cv.height); }
  let n = 0;
  for (const sl of S.slots.values()) {
    if (!sl.fx || !sl.on || sl.w <= 0 || sl.h <= 0) continue;
    const tt = still ? (sl.opts.still != null ? sl.opts.still : (sl.fx.stillT != null ? sl.fx.stillT : 3)) : t + sl.phase;
    if (S.gl) S.gl.slot();
    c.setTransform(S.dpr, 0, 0, S.dpr, S.dpr * sl.x, S.dpr * sl.y);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    try { sl.fx.draw(c, sl, tt, { ...Q, still, dpr: S.dpr, calm: sl.opts.calm || 0 }); painted(sl); } catch (e) { console.warn('[fx]', sl.fx.id, e); sl.fx = null; unpainted(sl); }
    n++;
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  if (S.gl) { S.gl.end(); fxStats.draws += S.gl.stats.draws; }
  return n;
}

// THE GUARD: slow frames step the tier down, a long calm steps it back up — but a step down is ON PROBATION: if the next ~2 s aren't
// clearly faster (≥ 12 % shorter frames), the cost wasn't the canvas's pixels (another layer, the page, the scroll) — the tier goes
// back up and is HELD for 30 s (the owner's iPhone fell to a soft tier 0 and stayed at ~42 fps: quality lost for nothing).
let probe = null, holdUntil = 0, avgDt = 16.7;
function guard(dt, now) {
  if (forced != null || dt > 250) return;          // (a tab switch / a stall is not a slow phone)
  avgDt += (dt - avgDt) * 0.05;
  if (probe) {
    probe.n++; probe.sum += dt;
    if (probe.n >= 120) {
      const after = probe.sum / probe.n;
      if (after > probe.before * 0.88) { setTier(probe.from); holdUntil = now + 30000; fxStats.held = true; }
      probe = null; slowRun = 0; calmRun = 0;
    }
    return;
  }
  if (now < holdUntil) return;
  fxStats.held = false;
  if (dt > 22) { slowRun++; calmRun = 0; } else if (dt < 18) { calmRun++; slowRun = Math.max(0, slowRun - 1); }
  if (slowRun > 40 && tier > 0) { probe = { from: tier, before: avgDt, n: 0, sum: 0 }; setTier(tier - 1); slowRun = 0; calmRun = 0; }
  else if (calmRun > 600 && tier < 2) { setTier(tier + 1); calmRun = 0; }
}

function frame(now) {
  raf = 0;
  if (scrolling() && !probes.length) { lastT = 0; return; }           // (held while a finger scrolls — resume() kicks it again)
  const dt = lastT ? now - lastT : 16.7; lastT = now;
  const still = fxReduced();
  if (!still) guard(dt, now);
  clock += Math.min(dt, 100) / 1000;
  dtSum += dt; if (dt > 20) slowN++;
  const t0 = performance.now(), Q = quality();
  let live = false, drawn = 0, px = 0;
  fxStats.draws = 0;
  for (const S of surfaces) {
    // (a surface whose host left the page — a screen repainted without destroying it — lets its canvas + GPU context go after ~1 s)
    if (!S.host.isConnected) { if ((S.gone = (S.gone || 0) + 1) > 60) S.destroy(); continue; } else S.gone = 0;
    S.lastN = 0;
    if (!S.on || S.held || (typeof document !== 'undefined' && document.hidden)) continue;   // (SPEED PASS B: S.held — under a full card)
    if (!S.sized) size(S);
    px += S.cv.width * S.cv.height;
    if (still && !S.dirty) continue;
    const n = fxDiag.fx ? drawSurface(S, clock - (S.toff || 0), still, Q) : clearSurface(S);
    drawn += n; S.lastN = n;
    S.dirty = false;
    if (probes.length) S.lit = litOf(S);
    if (!still && S.slots.size) live = true;
  }
  frames++; fxStats.frames++;
  if (now - fpsT > 1000) { fxStats.fps = Math.round(frames * 1000 / (now - fpsT)); fxStats.fms = +(dtSum / Math.max(1, frames)).toFixed(1); fxStats.slow = slowN; frames = 0; dtSum = 0; slowN = 0; fpsT = now; }
  for (const S of surfaces) if (S.on) { fxStats.dpr = +S.dpr.toFixed(2); fxStats.gpu = !!S.gl; break; }
  fxStats.ms = +(performance.now() - t0).toFixed(2); fxStats.slots = drawn; fxStats.mp = +(px / 1e6).toFixed(2); fxStats.tier = tier;
  if (probes.length) { let n = 0; for (const S of surfaces) if (S.on && S.lit > 0) n += S.lit; const ps = probes; probes = []; ps.forEach(r => r(n)); }
  if (live) raf = requestAnimationFrame(frame); else lastT = 0;
}
/** TESTS — the lit pixels (alpha > 10, every 16th) the next drawn frame leaves on every surface: the same count on the GPU path (read
 *  back in the frame's own task, before the buffer is presented) and the 2D one (getImageData) */
let probes = [];
export function fxProbe() { return new Promise(res => { probes.push(res); for (const S of surfaces) S.dirty = true; kick(); }); }
function litOf(S) {
  if (S.gl) return S.gl.lit();
  try { const d = S.c.getImageData(0, 0, S.cv.width, S.cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 64) if (d[i] > 10) n++; return n; } catch { return -1; }
}
export function kick() {
  if (raf || typeof requestAnimationFrame === 'undefined') return;
  raf = requestAnimationFrame(frame);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { lastT = 0; if (!document.hidden) { for (const S of surfaces) S.dirty = true; kick(); } });
