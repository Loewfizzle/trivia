// JAYWALK — THE GHOSTS (H4B — docs/jaywalk.md "THE GHOSTS"): the other players' kids, IN STEP WITH THE WORLD ON SCREEN. PURE (no DOM,
// no clock of its own: the view hands it the world's tick + the frame's time).
// THE RULE (the owner, Nov 16 — after his first live match): a ghost is ALWAYS drawn consistent with the world on screen — never inside
// a car, never in the water while alive. H4 drew a ghost 75 ticks BEHIND a world drawn NOW (a friend safe on a log 1.25 s ago was drawn
// in the water today). Now:
//   · `conf` — THE CONFIRMED RUN: every hop this phone has of them, each applied in its own tick, through the same engine.
//   · `run`  — THE DRAWN RUN: `conf` stepped on to THE WORLD's TICK with no new hop assumed — they stand / ride their log with it, exactly
//     as the rules would. A ghost's state IS the engine's state at the tick the cars + logs are drawn at.
//   · A LATE HOP (it always is, by the network's delay): `run` is rebuilt from `conf`; where the ghost was drawn → where the rules put it
//     now is `off`, closed in A QUICK HOP (never a teleport, never a slide along the ground).
//   · A DEATH ONLY ONCE CONFIRMED: a ghost goes out only when that player's own log is complete (`done` — their node's `e` is here). Until
//     then a drawn run that WOULD go out next tick HOLDS STILL in place (`held`) — a death never un-happens. Held longer than
//     HELD_SHOW_MS (a dropped signal, not the network's beat) it is not drawn until its hops / its end arrive.
// THE MOTHERSHIP takes a ghost at its fixed tick with nothing to confirm (it is the world's, not a hop's).
import { createRun, step, isOver, kidAt } from './engine.js';

/** a late hop's catch-up lasts this long (ms) + a little per extra cell, never longer than the max */
export const CATCH_MS = 110, CATCH_CELL_MS = 40, CATCH_MAX_MS = 320;
/** a HELD ghost (it would go out, unconfirmed) is drawn standing this long (ms) — the network's beat; past it: not drawn until news of it */
export const HELD_SHOW_MS = 900;
/** the most ticks one call steps (a rejoin's long log is spread over a few frames; a ghost still this far behind is not drawn) */
export const GHOST_STEPS = 2700;
const BEHIND_TICKS = 30;

const copyRun = (to, r) => { Object.assign(to, r); to.near = { ...r.near }; to.took = { ...r.took }; return to; };

export function createGhost(seed, mode = 'match') {
  return { conf: createRun({ seed, mode }), ci: 0, run: createRun({ seed, mode }), keep: {}, log: [], done: false, held: false, heldAt: 0, off: null, vis: null, behind: false };
}
/** the course changed (THE FIRST GO landed / a rejoin): their run from the start again — the log is kept */
export function resetGhost(G, seed, mode = 'match') {
  G.conf = createRun({ seed, mode }); G.run = createRun({ seed, mode }); G.ci = 0; G.held = false; G.off = null; G.vis = null; G.behind = false;
}
/** their new hops (in order — the proof's chunks) + whether their own END is here (`e`: the log is complete — a death may be shown) */
export function feedGhost(G, hops, done) {
  if (hops) for (const x of hops) G.log.push(x);
  if (done && !G.done) { G.done = true; G.held = false; }
}
/** where a catch-up stands at `now`: { x, y (cells still to close), u (0 … 1), d (its whole length) } — null = none / over */
export function offAt(o, now) {
  if (!o) return null;
  const u = (now - o.t0) / o.ms;
  if (!(u < 1)) return null;
  const v = u < 0 ? 0 : u, k = 1 - v * v * (3 - 2 * v);
  return { x: o.x * k, y: o.y * k, u: v, d: o.d };
}

/** ONE FRAME: the ghost to THE WORLD's TICK `target`; `now` = the frame's time (ms — only the catch-up's + the hold's own clocks) */
export function stepGhost(G, course, target, now) {
  const cf = G.conf, lg = G.log, r = G.run;
  let n = 0, moved = false;
  // THE CONFIRMED RUN: every known hop in its own tick — never past the world's tick (a phone's clock a touch ahead of this one's)
  while (G.ci < lg.length && !isOver(cf) && cf.t < target && n < GHOST_STEPS) {
    const at = lg[G.ci].t;
    if (at < cf.t) { G.ci++; continue; }   // (never: the log's ticks rise)
    let d = '';
    if (at === cf.t) { d = lg[G.ci++].d; moved = true; }
    step(cf, course, d); n++;
  }
  let was = null;
  if (moved) {
    const p = kidAt(r), v = offAt(G.off, now);
    was = { x: p.x + (v ? v.x : 0), y: p.y + (v ? v.y : 0) };
    copyRun(r, cf); G.held = false;
  }
  // THE DRAWN RUN: on to the world's tick with no new hop assumed. A step that would take them OUT is not taken until their own end says so
  if (!G.held) {
    const sure = G.done && G.ci >= lg.length;   // (their whole log is here AND applied: what the rules say next is what happened)
    while (r.t < target && !isOver(r) && n < GHOST_STEPS) {
      n++;
      if (sure) { step(r, course, ''); continue; }
      Object.assign(G.keep, r);
      step(r, course, '');
      if (r.st === 'out') { Object.assign(r, G.keep); G.held = true; G.heldAt = now; break; }
    }
  }
  if (was) {
    const p = kidAt(r), x = was.x - p.x, y = was.y - p.y, d = Math.sqrt(x * x + y * y);
    G.off = d > 0.04 ? { x, y, d, t0: now, ms: Math.min(CATCH_MAX_MS, CATCH_MS + CATCH_CELL_MS * Math.max(0, d - 1)) } : null;
  }
  G.vis = offAt(G.off, now);
  if (!G.vis) G.off = null;
  G.behind = G.held ? now - G.heldAt > HELD_SHOW_MS : !isOver(r) && r.t < target - BEHIND_TICKS;
  return G;
}
