// CITY 2.0 — THE HARBOR, PART 6b: THE DIRECTOR (plan.md "THE DIRECTOR — can a phone handle the whole plan?"; docs/harbor.md#part-6b).
// PURE. ONE arbiter every HEAVY moment asks before it STARTS (the party show, a drone show, the air show, a legendary, the balloon
// festival — Part 10's fireworks, the raid, storms + the holidays join the same way): a per-tier SPECTACLE BUDGET (at most N heavy
// effects at once) and the owner's PRIORITIES (holidays > party > legendary > rare > routine). A heavy thing already running keeps its
// slot; a new one starts only while there's room, or by displacing nothing (it never stops what's on screen — it waits / is skipped).
// Previews (&force=, THE PREVIEW PANEL) bypass it: the owner asked for them. Every phone of a tier decides the same from the same
// inputs (the clock's plan), so a room's phones agree.
export const PRIO = Object.freeze({ holiday: 5, party: 4, legendary: 3, rare: 2, routine: 1 });
/** heavy effects at once, per tier (0 = the slow phone) */
export const SPECTACLE = Object.freeze([1, 2, 2]);

/**
 * createDirector() → { frame(running), may(id, kind), budget(tier) , state() }
 *   frame(running, tier)  the heavies on screen this frame: [{ id, kind }] (kind: a PRIO key) — call once a frame before asking
 *   may(id, kind)         may `id` (of PRIO `kind`) START now? true while the budget has room for it, counting only what runs that
 *                         ranks at or above it (a lower one running doesn't block a higher one — the higher one still never stops it)
 */
export function createDirector() {
  let running = [], tier = 2, asked = new Map();
  return {
    frame(list, t = 2) { running = (list || []).filter(Boolean); tier = Math.max(0, Math.min(2, t | 0)); },
    may(id, kind) {
      if (running.some(r => r.id === id)) return true;                         // (already on: it keeps its slot)
      const p = PRIO[kind] || 1, cap = SPECTACLE[tier];
      const above = running.filter(r => (PRIO[r.kind] || 1) >= p).length;
      const ok = above < cap && running.length < cap + 1;                     // (never more than one over the budget, even for a higher one)
      asked.set(id, { kind, ok, at: running.map(r => r.id) });
      if (asked.size > 24) asked.delete(asked.keys().next().value);
      return ok;
    },
    budget: t => SPECTACLE[Math.max(0, Math.min(2, t | 0))],
    state: () => ({ tier, budget: SPECTACLE[tier], running: running.map(r => `${r.id}:${r.kind}`), asked: Object.fromEntries([...asked].map(([k, v]) => [k, v.ok])) }),
  };
}
