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
  // ZERO GARBAGE (S4A FIX — the owner's iPhone: a stall a floor, the collector's): a landing makes NOTHING here. The top is ONE record
  // written in place; a slab that leaves the list (under the screen) is the next one to enter it; the dropped slab + a cut's overhang
  // are two kept rectangles (a hook reads its rect at once — it never keeps it).
  const top = { x0: run.x0, x1: run.x1, z0: run.z0, z1: run.z1 };
  const slabs = [{ x0: top.x0, x1: top.x1, z0: top.z0, z1: top.z1, floor: run.floor }], spare = [];
  // the slab of the last 'drop' event, until its 'land' (it lies there) or its 'out' (it falls)
  const pend = { on: false, floor: 0, x: false, r: { x0: 0, x1: 0, z0: 0, z1: 0 } }, pc = { x0: 0, x1: 0, z0: 0, z1: 0 };
  const newSlab = () => ({ x0: 0, x1: 0, z0: 0, z1: 0, floor: 0 });   // (only while the list is still filling: the first keep + 8 floors)
  function feed(events) {
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (e.e === 'drop') {
        const x = e.axis === 'x', r = pend.r;
        pend.on = true; pend.floor = e.floor; pend.x = x;
        r.x0 = top.x0 + (x ? e.off : 0); r.x1 = top.x1 + (x ? e.off : 0); r.z0 = top.z0 + (x ? 0 : e.off); r.z1 = top.z1 + (x ? 0 : e.off);
      } else if (e.e === 'land') {
        // (the engine's own word for where the slab lies: nothing is worked out here, so no batching can lose or double a slab)
        top.x0 = e.x0; top.x1 = e.x1; top.z0 = e.z0; top.z1 = e.z1;
        const s = spare.length ? spare.pop() : newSlab();
        s.x0 = e.x0; s.x1 = e.x1; s.z0 = e.z0; s.z1 = e.z1; s.floor = e.floor;
        slabs.push(s);
        if (slabs.length > keep + 8) {
          const cut = slabs.length - keep;
          for (let k = 0; k < cut; k++) spare.push(slabs[k]);
          for (let k = cut; k < slabs.length; k++) slabs[k - cut] = slabs[k];
          slabs.length = keep;
        }
        pend.on = false;
      } else if (!pend.on) continue;
      else if (e.e === 'perfect') { if (hooks.onPerfect) hooks.onPerfect(pend.floor); }
      else if (e.e === 'cut') {
        // the overhang: the part of the dropped slab past the top slab's edge, on the side it hangs
        const r = pend.r, s = e.side;
        pc.x0 = r.x0; pc.x1 = r.x1; pc.z0 = r.z0; pc.z1 = r.z1;
        if (pend.x) { if (s > 0) { r.x1 = top.x1; pc.x0 = top.x1; } else { r.x0 = top.x0; pc.x1 = top.x0; } }
        else if (s > 0) { r.z1 = top.z1; pc.z0 = top.z1; } else { r.z0 = top.z0; pc.z1 = top.z0; }
        if (hooks.onFall) hooks.onFall(pc, pend.floor, pend.x ? s : 0, pend.x ? 0 : s, false);
      } else if (e.e === 'out') {
        if (hooks.onFall) hooks.onFall(pend.r, pend.floor, 0, 0, true);   // (the slab that missed / slipped: it just falls)
        pend.on = false;
      }
    }
  }
  return { feed, top: () => top, slabs: () => slabs, floor: () => slabs[slabs.length - 1].floor };
}
