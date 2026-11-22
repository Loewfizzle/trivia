// CITY D — 0b, THE LIVE LANE (the owner's iPhone: DAILIES → SCORES → TODAY + ALL TIME froze, then the page reloaded itself — an iOS memory
// kill, nothing reached /admin; the same family as CUSTOMIZE YOUR CARD's reload). Every slim-card LIST (the dailies' SCORES today + all time,
// THE BOARD, the room's guests, a game's results, the friends lists) used to lay ONE effect surface over the whole list: a GPU canvas up to
// 2.6 MP a list (two or three on SCORES), a fresh GPU context on every repaint, and EVERY card on it running its effect. Now:
//   · a list's cards show their BAKED STILLS (js/vault/stills.js — the effect's own still frame as the strip's material; a CSS card its own art)
//   · only the strips ON SCREEN may run a live effect — at most CAP (3) on the whole page, the topmost first (a joiner's entrance = prio)
//   · a live strip gets its OWN small 2D canvas (the strip's size — ~0.1 MP, never a GPU context); a strip that leaves the screen (or the
//     page) stops at once and frees its canvas (fx/renderer.js#destroy → width 0)
//   · the choice waits for the screen to settle (~200 ms after the last change) and starts ONE live strip a frame — building a list never
//     runs every card's effect in one go
//   · reduced motion / REDUCED EFFECTS → no live strip at all (the stills ARE the still frames)
// The API is a surface's (fx/renderer.js#createSurface): lane.add(el, effect, opts) · lane.remove(el) · lane.destroy() — so a list swaps
// `createSurface(list)` for `liveList(list)` and nothing else changes (ui/strip-board.js#stripFx).
import { createSurface, fxReduced } from '../fx/renderer.js';

export const CAP = 3;
const recs = new Map();          // strip el → rec { el, fx, opts, lane, vis, S, slot }
let io = null, pickT = 0, pumping = false;
const queue = [];
export const laneStats = { live: 0, made: 0, freed: 0, recs: 0 };

const docOrder = (a, b) => (a.el === b.el ? 0 : a.el.compareDocumentPosition(b.el) & 4 ? -1 : 1);
function observer() {
  if (io || typeof IntersectionObserver === 'undefined') return io;
  // (on screen = at least half of the strip inside the viewport — a strip peeking at the edge stays a still)
  io = new IntersectionObserver(es => {
    for (const e of es) { const r = recs.get(e.target); if (r) r.vis = e.isIntersecting && e.intersectionRatio >= 0.5; }
    schedule();
  }, { threshold: [0, 0.5, 1] });
  return io;
}
function schedule(ms = 200) { if (pickT) return; pickT = setTimeout(pick, ms); }
function stop(r) {
  if (!r.S) return;
  try { r.S.destroy(); } catch { /* fine */ }
  r.S = null; r.slot = null; r.el.classList.remove('fx-host');
  laneStats.live--; laneStats.freed++;
}
function start(r) {
  if (r.S || !r.el.isConnected || !r.vis || !r.fx) return;
  const S = createSurface(r.el, { label: `lane:${r.lane.label}`, gpu: false });
  r.S = S; r.slot = S.add(r.el, r.fx, r.opts);
  laneStats.live++; laneStats.made++;
}
function pump() {
  pumping = false;
  const r = queue.shift();
  if (r && recs.get(r.el) === r && live().length < CAP) start(r);   // (BEFORE-LAUNCH — REVIEW A11: a strip forgotten while queued never starts)
  if (queue.length) { pumping = true; requestAnimationFrame(pump); }
}
const live = () => [...recs.values()].filter(r => r.S);
function pick() {
  pickT = 0;
  for (const r of [...recs.values()]) if (!r.el.isConnected) { stop(r); forget(r); }
  const still = fxReduced();
  const want = still ? [] : [...recs.values()].filter(r => r.vis && r.fx).sort((a, b) => ((b.opts && b.opts.prio) ? 1 : 0) - ((a.opts && a.opts.prio) ? 1 : 0) || docOrder(a, b)).slice(0, CAP);
  for (const r of recs.values()) if (r.S && !want.includes(r)) stop(r);
  queue.length = 0;
  for (const r of want) if (!r.S) queue.push(r);
  if (queue.length && !pumping) { pumping = true; requestAnimationFrame(pump); }
}
function forget(r) {
  recs.delete(r.el); laneStats.recs = recs.size;
  if (io) io.unobserve(r.el);
  if (r.lane) r.lane.els.delete(r.el);
}
// (a strip that leaves the page without its list's destroy — a screen repainted — is swept by the next pick; a slow sweep catches the rest)
let sweepT = 0;
function sweep() { sweepT = 0; if (!recs.size) return; for (const r of recs.values()) if (!r.el.isConnected) { schedule(0); break; } sweepT = setTimeout(sweep, 1500); }

/** a slim-card list's live lane (the surface API): its strips show their stills; up to CAP on-screen strips page-wide run live */
export function liveList(host, o = {}) {
  const lane = { label: o.label || 'list', els: new Set() };
  return {
    lane,
    add(el, fx, opts = {}) {
      if (!el) return null;
      const old = recs.get(el); if (old) { stop(old); forget(old); }
      const r = { el, fx, opts, lane, vis: false, S: null, slot: null };
      recs.set(el, r); lane.els.add(el); laneStats.recs = recs.size;
      const ob = observer(); if (ob) ob.observe(el); else { r.vis = true; schedule(); }
      if (!sweepT) sweepT = setTimeout(sweep, 1500);
      // (the slot the caller may tune later — the guest list's entrance: { ...opts, calm: 1, prio: 0 } after ~3 s)
      return { get opts() { return r.opts; }, set opts(v) { r.opts = v; if (r.slot) r.slot.opts = v; schedule(); }, el };
    },
    remove(el) { const r = recs.get(el); if (r && r.lane === lane) { stop(r); forget(r); schedule(); } },
    redraw() { for (const el of lane.els) { const r = recs.get(el); if (r && r.S) r.S.redraw(); } },
    destroy() { for (const el of [...lane.els]) { const r = recs.get(el); if (r) { stop(r); forget(r); } } lane.els.clear(); schedule(); },
  };
}
/** TESTS — the live strips now (≤ CAP) */
export const laneLive = () => live().length;
