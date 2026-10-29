// CITY 2.0 — THE HARBOR: the baker. The static layers are drawn once per LOOK KEY into offscreen canvases, in small chunks
// (a few ms a frame — never a blocked frame), into a second set of canvases while the current set keeps showing; then the
// scene crossfades and the sets swap. Never more than the current + the next set; canvases are reused, never re-allocated
// for a re-bake (only when the screen size or the tier changes); destroy() frees every pixel (width = height = 0).
//
// MEMORY (iOS Safari kills a page that holds too much canvas memory): every offscreen canvas counts against a hard budget per
// tier. Baked layers are capped at DPR 2 on phones; if the budget is still exceeded the biggest layers step down to DPR 1.5,
// then 1. The main canvas is the scene's (its own DPR per tier) and is reported next to the budget. &debug=1 logs it all.
import { safeCtx } from '../../ui/canvas-safe.js';
// C4c — THE MEMORY GUARD RAISED (the owner, Oct 28: "are we throttling ourselves on memory?"): set in Part 1 when Safari's limit was
// believed ~224-384 MB; review-4 measured the real iOS canvas ceiling at >= ~1 GB (a quarter of RAM) and the whole city at 70-83 MB in
// every state (tier 2). 24 / 40 / 64 -> 64 / 96 / 160 (~2-3x today's real total, still < 20 % of the ceiling): softness only ever comes
// from the SPEED tier. The budget now counts what is REALLY there (usedMb = every other live canvas: canvas-safe.js#canvasMb)
export const MEM_BUDGET_MB = [64, 96, 160];   // tier 0, 1, 2: every live canvas of the scene (the bakes' both sets + the rest)

const mk = () => document.createElement('canvas');

export function createBaker() {
  let groups = [];            // [{ name, y0, h, dpr, cur, next }]
  let queue = [], key = '', pendingKey = '', W = 0, tier = 2;
  let doneAt = -1, bakes = 0, busyMs = 0, planned = 0;
  let stepped = [], wantMb = 0, usedAt = 0;   // (C4c: what the guard stepped down on the last plan, what the layers wanted at full dpr, what else was live)

  /** (re)plan the canvases for a screen: groups = [{ name, y0, h }] in pt; maxDpr from the tier; usedMb: what another baker
   *  of the same scene already holds (the budget is the scene's, shared) */
  function plan(w, gs, maxDpr, t, usedMb = 0) {
    W = w; tier = t; stepped = [];
    const budget = (MEM_BUDGET_MB[tier] - usedMb) * 1e6;
    const want = gs.map(g => ({ ...g, y0: Math.floor(g.y0), h: Math.max(1, Math.ceil(g.h)), dpr: maxDpr }));
    const bytes = () => want.reduce((s, g) => s + 2 * Math.ceil(W * g.dpr) * Math.ceil(g.h * g.dpr) * 4, 0);
    wantMb = bytes() / 1e6; usedAt = usedMb;
    // over budget: the biggest layers come down a step at a time
    for (let guard = 0; bytes() > budget && guard < 20; guard++) {
      const big = want.filter(g => g.dpr > 1).sort((a, b) => b.h - a.h)[0];
      if (!big) break;
      const was = big.dpr; big.dpr = big.dpr > 1.5 ? 1.5 : 1; stepped.push({ name: big.name, from: was, to: big.dpr });
    }
    // A re-plan never blanks the city: a group that was baked keeps its current canvas (and `ready`) and goes on drawing it
    // until the new bake swaps in — ALWAYS in the band it was baked for (FP3a, FREV B1: it used to be stretched into the new band
    // after a resize, then the crossfade snapped it back: the iPhone's "shrink, enlarge, snap"). Only `next` (the bake target) is
    // resized, when the bake starts.
    const old = new Map(groups.map(g => [g.name, g]));
    groups = want.map(g => {
      const o = old.get(g.name);
      if (!o) { const cur = mk(), next = mk(); for (const c of [cur, next]) { c.width = Math.ceil(W * g.dpr); c.height = Math.ceil(g.h * g.dpr); } return { ...g, cur, next, ready: false, show: { y0: g.y0, h: g.h }, prev: null }; }
      return { ...g, cur: o.cur, next: o.next, ready: o.ready, show: o.show, prev: o.prev };
    });
    for (const o of old.values()) if (!groups.some(g => g.name === o.name)) { o.cur.width = o.cur.height = o.next.width = o.next.height = 0; }
    key = ''; queue = [];
    planned = bytes() / 1e6;
  }

  /** start baking a look: jobs = { [group]: [step(x), …] } (each step draws a small part, in screen pt) */
  function start(k, jobs) {
    pendingKey = k;
    queue = [];
    for (const g of groups) {
      const x = safeCtx(g.next);
      queue.push(() => { const cw = Math.ceil(W * g.dpr), ch = Math.ceil(g.h * g.dpr); if (g.next.width !== cw || g.next.height !== ch) { g.next.width = cw; g.next.height = ch; } x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, g.next.width, g.next.height); x.setTransform(g.dpr, 0, 0, g.dpr, 0, -g.y0 * g.dpr); });
      for (const s of jobs[g.name] || []) queue.push(() => { x.save(); s(x); x.restore(); });
    }
  }

  /** run queued steps for up to ms; returns true on the frame the bake completes (the sets swap) */
  function pump(ms) {
    if (!queue.length) return false;
    const t0 = performance.now();
    do { queue.shift()(); } while (queue.length && performance.now() - t0 < ms);
    busyMs += performance.now() - t0;
    if (queue.length) return false;
    // the swap: the old canvas (now `next`) and its band stay for the crossfade
    for (const g of groups) { const c = g.cur; g.cur = g.next; g.next = c; g.prev = g.ready ? g.show : null; g.show = { y0: g.y0, h: g.h }; g.ready = true; g.ver = (g.ver || 0) + 1; }
    key = pendingKey; bakes++; doneAt = performance.now();
    return true;
  }

  const mem = () => {
    const per = groups.map(g => ({ name: g.name, dpr: g.dpr, w: g.cur.width, h: g.cur.height, mb: +(((g.cur.width * g.cur.height) + (g.next.width * g.next.height)) * 4 / 1e6).toFixed(2) }));
    const mb = +per.reduce((s, g) => s + g.mb, 0).toFixed(2);
    return { mb, budget: MEM_BUDGET_MB[tier], tier, layers: per, want: +wantMb.toFixed(1), others: +usedAt.toFixed(1), stepped: stepped.slice() };
  };

  /** after the crossfade: the spare canvas (the old layer) takes its group's size again, so the steady state is always two
   *  sets at the current size (what the budget counts) — never during a fade, it is the fade's source */
  function settle() {
    for (const g of groups) { const cw = Math.ceil(W * g.dpr), ch = Math.ceil(g.h * g.dpr); if (g.next.width !== cw || g.next.height !== ch) { g.next.width = cw; g.next.height = ch; } }
  }

  return {
    plan, start, pump, mem, settle,
    get key() { return key; },
    get pending() { return queue.length > 0; },
    get bakes() { return bakes; },
    get busyMs() { return busyMs; },
    /** MB the current plan holds at its steady state (both sets) */
    get planned() { return planned; },
    /** the current canvas of a group (+ the previous one, still in `next`, for the crossfade) */
    group: name => groups.find(g => g.name === name) || null,
    destroy() { for (const g of groups) { g.cur.width = g.cur.height = g.next.width = g.next.height = 0; } groups = []; queue = []; },
  };
}
