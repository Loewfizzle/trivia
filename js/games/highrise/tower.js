// HIGH RISE — THE TOWER A VIEW DRAWS (S1 — docs/highrise.md "THE LAB"): built from the engine's EVENTS alone (engine.js#stepTo / tap).
// PURE (no three.js, no DOM) — so a test proves it equals the engine's own tower HOWEVER the events are batched: one drop a frame, two
// drops in one batch (two touches inside a long frame), a tap and then THE FUSE's drop with no frame between (a hidden tab), one event
// at a time. (The fresh-eyes review's find: a view that worked the landing out itself, at the END of a batch, lost a slab whenever a
// batch held two drops — now the slab lies where the engine's own `land` event says.)
// VIEW ONLY: the rules never read it.

/**
 * createTower(run, hooks) → { feed(events), top(), slabs(), floor() }. `hooks` (all optional — the view's effects):
 *   onPerfect(floor) · onFall(rect, floor, dx, dz, whole) — a cut's overhang (dx / dz = the side it hangs on), or a WHOLE slab that
 *   missed / slipped. A rect = { x0, x1, z0, z1 } in rule units.
 */
export function createTower(run, hooks = {}, keep = 44) {
  let top = { x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1 };
  const slabs = [{ ...top, floor: run.floor }];
  let pending = null;   // the slab of the last 'drop' event, until its 'land' (it lies there) or its 'out' (it falls)
  function feed(events) {
    for (const e of events) {
      if (e.e === 'drop') {
        const x = e.axis === 'x';
        pending = { floor: e.floor, x, r: { x0: top.x0 + (x ? e.off : 0), x1: top.x1 + (x ? e.off : 0), z0: top.z0 + (x ? 0 : e.off), z1: top.z1 + (x ? 0 : e.off) } };
      } else if (e.e === 'land') {
        // (the engine's own word for where the slab lies: nothing is worked out here, so no batching can lose or double a slab)
        top = { x0: e.x0, x1: e.x1, z0: e.z0, z1: e.z1 };
        slabs.push({ ...top, floor: e.floor });
        if (slabs.length > keep + 8) slabs.splice(0, slabs.length - keep);
        pending = null;
      } else if (!pending) continue;
      else if (e.e === 'perfect') { if (hooks.onPerfect) hooks.onPerfect(pending.floor); }
      else if (e.e === 'cut') {
        // the overhang: the part of the dropped slab past the top slab's edge, on the side it hangs
        const r = pending.r, pc = { ...r }, s = e.side;
        if (pending.x) { if (s > 0) { r.x1 = top.x1; pc.x0 = top.x1; } else { r.x0 = top.x0; pc.x1 = top.x0; } }
        else if (s > 0) { r.z1 = top.z1; pc.z0 = top.z1; } else { r.z0 = top.z0; pc.z1 = top.z0; }
        if (hooks.onFall) hooks.onFall(pc, pending.floor, pending.x ? s : 0, pending.x ? 0 : s, false);
      } else if (e.e === 'out') {
        if (hooks.onFall) hooks.onFall(pending.r, pending.floor, 0, 0, true);   // (the slab that missed / slipped: it just falls)
        pending = null;
      }
    }
  }
  return { feed, top: () => top, slabs: () => slabs, floor: () => slabs[slabs.length - 1].floor };
}
