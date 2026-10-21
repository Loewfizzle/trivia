// CITY 2.0 — THE HARBOR: lanes + events (PURE: no DOM, no clock of its own; tests/harbor.test.mjs). docs/harbor.md#events.
//
// The city's occasional moments (a banner plane, a parade, a yacht, an easter egg…) are EVENTS. Each one runs in one or more
// LANES (the parts of the picture it uses) for a while. The scheduler is deterministic: time is cut into slots, and each slot's
// dice come from the slot's number + the seed, so every phone at the same time sees the same city and a refresh never
// reshuffles it. It never lets two events share a lane at the same time, keeps the sum of their frame costs within the
// budget, and a HEAVY event quiets the other lanes (the scene thins out what runs there).
import { hashString, rngFrom } from './rng.js';

export const LANES = ['sky', 'skyline', 'water', 'road', 'promenade', 'windows', 'rooftop'];
export const SLOT_MS = 90 * 1000;
const DAY = 864e5;
/** how often, on average, an eligible event starts (the period in ms): common = every few slots … legendary = once a year */
export const RARITY = { common: 4 * SLOT_MS, weekly: 7 * DAY, rare: 30 * DAY, legendary: 365 * DAY };
const ORDER = { legendary: 0, rare: 1, weekly: 2, common: 3 };
/** the frame budget (ms of drawing per frame) all running events share, and each lane's own share */
export const BUDGET = { total: 2.5, lane: 1.5 };

/**
 * An event: { id, lanes: [...LANES], when(ctx) → bool, rarity: 'common'|'weekly'|'rare'|'legendary', duration (ms),
 * cost?: ms per frame (default 0.5), heavy?: bool, seed?: number }.
 * ctx (from ctxAt(ms)): whatever the scene knows — { ms, local, night, season, holiday, weather, party, force: Set }.
 */
export function defineEvent(e) {
  if (!e || !e.id || !Array.isArray(e.lanes) || !e.lanes.length) throw new Error('event: id + lanes');
  for (const l of e.lanes) if (!LANES.includes(l)) throw new Error(`event ${e.id}: unknown lane ${l}`);
  if (!RARITY[e.rarity]) throw new Error(`event ${e.id}: rarity`);
  if (!(e.duration > 0) || e.duration > 8 * SLOT_MS) throw new Error(`event ${e.id}: duration`);
  return { cost: 0.5, heavy: false, seed: hashString(e.id), when: () => true, ...e };
}

/** the chance an eligible event starts in a given slot */
export const startChance = e => Math.min(1, SLOT_MS / RARITY[e.rarity]);

/**
 * What runs at time ms. events: defined events; ctxAt(ms) → ctx; seed: the city's seed. forced: ids that start in every slot
 * (previews, &force=demo). Returns { active: [{ id, lanes, start, end, k (0..1 through it), seed, heavy }], quiet: [lanes] }.
 */
export function schedule(events, ms, ctxAt, { seed = 1924, forced = [] } = {}) {
  const longest = Math.max(SLOT_MS, ...events.map(e => e.duration));
  const n1 = Math.floor(ms / SLOT_MS), n0 = n1 - Math.ceil(longest / SLOT_MS);
  const running = [];
  for (let n = n0; n <= n1; n++) {
    const t0 = n * SLOT_MS;
    const ctx = ctxAt(t0);
    const rand = rngFrom((hashString(`harbor|${seed}|${n}`) ^ 0x9e3779b9) >>> 0);
    // this slot's candidates: forced first, then the rarest, ties in the slot's own dice order
    const cands = [];
    for (const e of events) {
      const roll = rand();     // one roll per event per slot, always drawn (adding an event never changes the others' dice… for those before it)
      const isForced = forced.includes(e.id);
      if (!isForced && !(e.when(ctx) && roll < startChance(e))) continue;
      cands.push({ e, forced: isForced, tie: rand() });
    }
    cands.sort((a, b) => (b.forced - a.forced) || (ORDER[a.e.rarity] - ORDER[b.e.rarity]) || (a.tie - b.tie));
    for (const { e } of cands) {
      const start = t0 + Math.floor(((hashString(`${e.id}|${n}`) % 1000) / 1000) * Math.min(SLOT_MS * 0.5, Math.max(0, SLOT_MS - e.duration)));
      const end = start + e.duration;
      const live = running.filter(r => r.start < end && start < r.end);
      if (live.some(r => r.id === e.id)) continue;                                         // one at a time
      if (live.some(r => r.lanes.some(l => e.lanes.includes(l)))) continue;                // a lane is taken
      if (live.reduce((s, r) => s + r.cost, 0) + e.cost > BUDGET.total) continue;           // over the frame budget
      if (e.cost > BUDGET.lane * e.lanes.length) continue;
      if (e.heavy && live.some(r => r.heavy)) continue;
      running.push({ id: e.id, lanes: e.lanes, start, end, cost: e.cost, heavy: e.heavy, seed: (e.seed ^ hashString(String(n))) >>> 0 });
    }
  }
  const active = running.filter(r => r.start <= ms && ms < r.end).map(r => ({ ...r, k: (ms - r.start) / (r.end - r.start) }));
  const quiet = [];
  for (const r of active) if (r.heavy) for (const l of LANES) if (!r.lanes.includes(l) && !quiet.includes(l)) quiet.push(l);
  return { active, quiet };
}

/** The built-in events. Part 1 has one debug-only demo (&force=demo) that proves the pipeline end to end. */
export const HARBOR_EVENTS = [
  defineEvent({ id: 'demo', lanes: ['sky'], rarity: 'legendary', duration: SLOT_MS, cost: 0.1, when: ctx => !!(ctx.force && ctx.force.has('demo')) }),
];
