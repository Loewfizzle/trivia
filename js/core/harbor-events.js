// CITY 2.0 — THE HARBOR: lanes + events (PURE: no DOM, no clock of its own; tests/harbor.test.mjs). docs/harbor.md#events.
//
// The city's occasional moments (a banner plane, a parade, a yacht, an easter egg…) are EVENTS. Each one runs in one or more
// LANES (the parts of the picture it uses; their screen rects: core/harbor-layout.js#laneRects) for a while. The scheduler is
// deterministic: time is cut into slots, and each slot's dice come from the slot's number + the seed, so every phone at the
// same time sees the same city and a refresh never reshuffles it. It never lets two events share a lane at the same time,
// keeps the sum of their frame costs within the budget, and a HEAVY event quiets the other lanes (the scene thins out what
// runs there: fs.density).
import { hashString, rngFrom } from './rng.js';

export const LANES = ['sky-high', 'sky-low', 'skyline', 'water', 'road', 'promenade', 'windows', 'rooftop', 'tagline'];
export const SLOT_MS = 90 * 1000;
const DAY = 864e5;
/** how often, on average, an eligible event starts (the period in ms): common = every few slots … legendary = once a year */
export const RARITY = { common: 4 * SLOT_MS, weekly: 7 * DAY, rare: 30 * DAY, legendary: 365 * DAY };
const ORDER = { legendary: 0, rare: 1, weekly: 2, common: 3 };
/** the frame budget (ms of drawing per frame) all running events share, and each lane's own share */
export const BUDGET = { total: 2.5, lane: 1.5 };
/** what a quiet lane keeps of its usual traffic while a heavy event runs elsewhere (fs.density) */
export const QUIET = 0.3;

/**
 * An event: { id, lanes: [...LANES], when(ctx) → bool, rarity: 'common'|'weekly'|'rare'|'legendary', duration (ms),
 * cost?: ms per frame (default 0.5), heavy?: bool, seed?: number }.
 * ctx (from ctxAt(ms)): what is known about that moment — { ms, force: Set, night (the sun under −6° there and then) }. A
 * function of ms ONLY: the replay asks it about the past (Part 6 adds the season, the holiday from core/sky.js).
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
/** the slot a moment falls in */
export const slotOf = ms => Math.floor(ms / SLOT_MS);
/** the longest replay: two days of slots (a fresh scheduler replays from the local midnight one day back: ≤ 1920 slots) */
export const REPLAY_SLOTS = 2 * DAY / SLOT_MS;

/**
 * THE SCHEDULER — state, advanced one slot at a time. What slot n admits depends on what still runs from the slots before
 * it, so the past is decided ONCE and never re-decided (a window recomputed from scratch drops the event that blocked a slot,
 * and a "blocked" event pops in mid-flight). A fresh scheduler starts empty at a fixed ANCHOR (the scene: the local midnight
 * one day back, anchorFor; tests: any ms) and replays to the present once; after that the scene calls at(ms) every 500 ms
 * and only new slots are decided. Two schedulers with different anchors (a session that crossed midnight vs. a fresh load)
 * agree from the first slot where both find the lanes free (tested: well within the day of replay).
 * events: defined events; ctxAt(ms) → ctx; seed: the city's seed; forced: ids that start in every slot, first (&force=demo).
 */
export function createScheduler(events, ctxAt, { seed = 1924, forced = [], anchor = 0 } = {}) {
  const longest = Math.max(SLOT_MS, ...events.map(e => e.duration));
  let slot = slotOf(anchor) - 1;   // the last slot decided
  let running = [];
  let decided = 0;                 // slots decided in all (the replay + the live ones): tests, &debug

  function decide(n) {
    const t0 = n * SLOT_MS;
    running = running.filter(r => r.end > t0 - longest);     // only what can still overlap something new
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
    slot = n; decided++;
  }

  /** decide every slot up to the one ms falls in (never backwards: what was decided stays decided) */
  function advance(ms) {
    const n1 = slotOf(ms);
    // a jump longer than the replay window (a phone asleep for days, &when far ahead): start over a day before
    if (n1 - slot > REPLAY_SLOTS) { slot = n1 - REPLAY_SLOTS / 2 - 1; running = []; }
    while (slot < n1) decide(slot + 1);
  }

  /** what runs at ms: { active: [{ id, lanes, start, end, k (0..1 through it), seed, heavy, cost }], quiet: [lanes] } */
  function at(ms) {
    advance(ms);
    const active = running.filter(r => r.start <= ms && ms < r.end).map(r => ({ ...r, k: (ms - r.start) / (r.end - r.start) }));
    const quiet = [];
    for (const r of active) if (r.heavy) for (const l of LANES) if (!r.lanes.includes(l) && !quiet.includes(l)) quiet.push(l);
    return { active, quiet };
  }

  return { at, advance, get slot() { return slot; }, get decided() { return decided; } };
}

/**
 * What runs at ms, from scratch (tests, previews): a scheduler anchored at `anchor` (default: the UTC midnight one day before
 * ms) and replayed to ms. The same anchor gives the same history, so schedule(t) and schedule(t − SLOT_MS) agree on every
 * event spanning both.
 */
export function schedule(events, ms, ctxAt, { seed = 1924, forced = [], anchor = Math.floor(ms / DAY) * DAY - DAY } = {}) {
  return createScheduler(events, ctxAt, { seed, forced, anchor }).at(ms);
}

/** the scene's anchor: the local midnight one day before ms (local = { h, mi, s } of ms on the city's clock) */
export const anchorFor = (ms, local) => ms - (((local.h * 60 + local.mi) * 60 + (local.s || 0)) * 1000 + (((ms % 1000) + 1000) % 1000)) - DAY;

/** what each lane keeps of its usual traffic right now: 1, or QUIET while a heavy event runs elsewhere */
export const densityOf = quiet => Object.fromEntries(LANES.map(l => [l, quiet.includes(l) ? QUIET : 1]));

/** The built-in events: the debug-only demo (&force=demo, Part 1); Part 2's searchlights (a rare "grand opening" night — party
 *  nights and holidays use them too, later) and a word in the windows (a heart, a star, HI… — never by day). */
export const HARBOR_EVENTS = [
  defineEvent({ id: 'demo', lanes: ['sky-low'], rarity: 'legendary', duration: SLOT_MS, cost: 0.1, when: ctx => !!(ctx.force && ctx.force.has('demo')) }),
  defineEvent({ id: 'searchlights', lanes: ['skyline'], rarity: 'rare', duration: 8 * SLOT_MS, cost: 0.6, when: ctx => !!ctx.night }),
  defineEvent({ id: 'spell', lanes: ['windows'], rarity: 'weekly', duration: 4 * SLOT_MS, cost: 0.3, when: ctx => !!ctx.night }),
];
