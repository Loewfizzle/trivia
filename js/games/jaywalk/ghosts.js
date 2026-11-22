// JAYWALK — THE GHOSTS (H4B — docs/jaywalk.md "THE GHOSTS"): the other players' kids, IN STEP WITH THE WORLD ON SCREEN. PURE (no DOM,
// The long notes: docs/games/jaywalk-notes.md
import { createRun, step, isOver, kidAt } from './engine.js';

/** a late hop's catch-up lasts this long (ms) + a little per extra cell, never longer than the max */
export const CATCH_MS = 110, CATCH_CELL_MS = 40, CATCH_MAX_MS = 320;
/** a HELD ghost (it would go out, unconfirmed) is drawn standing this long (ms) — the network's beat; past it: not drawn until news of it */
export const HELD_SHOW_MS = 900;
/** the most ticks one call steps (a rejoin's long log is spread over a few frames; a ghost still this far behind is not drawn) */
export const GHOST_STEPS = 2700;
const BEHIND_TICKS = 30;

const copyRun = (to, r) => { Object.assign(to, r); to.near = { ...r.near }; to.took = { ...r.took }; to.sp = r.sp.slice(); return to; };   // (J1: the splits too — never one array for two runs)

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
      Object.assign(G.keep, r); G.keep.sp = r.sp.slice();   // (J1 — the review: its own splits)
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

/**
 * H5B's add-on — STACKED TAGS MERGE (the owner: never a pile of name tags): ghosts standing on the same / touching squares share ONE
 * tag — the leader's name + "+N" ("MIKIE +2"). PURE: items = [{ id, x (cells), y (lane), best, name }] (the ghosts whose tag may show)
 * → [{ lead (its id), text, ids }] — a group = everything joined by touching squares (a chain counts); its leader = the farthest
 * along (best, then the lane it stands on, then the id — the same on every phone).
 */
export function tagGroups(items) {
  const list = items.map(q => ({ ...q, cx: Math.floor(q.x), cy: Math.round(q.y) })), seen = new Set(), out = [];
  for (const a of list) {
    if (seen.has(a.id)) continue;
    const grp = [a]; seen.add(a.id);
    for (let i = 0; i < grp.length; i++) for (const b of list) if (!seen.has(b.id) && Math.abs(b.cx - grp[i].cx) <= 1 && Math.abs(b.cy - grp[i].cy) <= 1) { seen.add(b.id); grp.push(b); }
    grp.sort((p, q) => (q.best || 0) - (p.best || 0) || q.cy - p.cy || (p.id < q.id ? -1 : 1));
    out.push({ lead: grp[0].id, text: grp.length > 1 ? `${grp[0].name} +${grp.length - 1}` : grp[0].name, ids: grp.map(q => q.id) });
  }
  return out;
}
