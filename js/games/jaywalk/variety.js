// JAYWALK — THE AREA TRAFFIC (VARIETY B1 — docs/jaywalk.md "VARIETY B1"): COSMETIC — the rules' road slots (a 1-cell car · the 2-cell van ·
// the 3-cell box truck) are unchanged; this only says WHICH MODEL draws a slot, by THE AREA, from the course's seed (the same on every phone).
// Plain cars stay the majority: more TYPES on screen, never more vehicles. A model fills EXACTLY its slot's length (night.js scales it to the
// rule's length). The models load PER AREA, a stretch AHEAD (createVariety) — never the start bundle; until a model is in (a slow network)
// the slot draws its plain vehicle — and the end line names the vehicle drawn (KNOWN: causes.js#vehicleAt asks it).

/** every variety vehicle: its slot (cells), its drawn width + height (cells), its emergency light bar ('' = none; `bar` = along the body from the … */
export const VARIETY = Object.freeze({
  police: { slot: 1, w: 0.7, h: 0.56, light: 'police', bar: [0.52, 0.98] },
  suv: { slot: 1, w: 0.72, h: 0.6 },
  sports: { slot: 1, w: 0.66, h: 0.46 },
  forklift: { slot: 1, w: 0.5, h: 0.64 },
  ambulance: { slot: 2, w: 0.8, h: 0.9, dayK: 0.85, light: 'ambulance', bar: [0.3, 0.99] },
  firetruck: { slot: 2, w: 0.8, h: 0.86, light: 'fire', bar: [0.24, 0.99] },
  delivery: { slot: 2, w: 0.8, h: 0.86, dayK: 0.8 },
  garbage: { slot: 2, w: 0.82, h: 0.86 },
  citybus: { slot: 2, w: 0.8, h: 0.86, dayK: 0.86 },
  tanker: { slot: 2, w: 0.8, h: 0.84 },
  dump: { slot: 2, w: 0.82, h: 0.76 },
  tug: { slot: 2, w: 0.82, h: 0.6 },
  schoolbus: { slot: 3, w: 0.9, h: 0.95 },
  semi: { slot: 3, w: 0.9, h: 1.05, dayK: 0.8 },
  bendy: { slot: 3, w: 0.88, h: 0.95 },
  // VARIETY B2 — THE WINTER TRUCKS (winter runs only — setWinterTraffic): built from the dump / delivery truck + parts in code; an AMBER
  // beacon (flashing at night, unlit by day) + one shared spray (`spray`: the plow's snow off its blade · the salt fanned from the spinner)
  plow: { slot: 2, w: 0.92, h: 0.82, light: 'beacon', bar: [0.319, 1.0], spray: 'snow' },
  salt: { slot: 2, w: 0.8, h: 0.92, dayK: 0.88, light: 'beacon', bar: [0.154, 0.778], spray: 'salt' },
});
export const VARIETY_IDS = Object.freeze(Object.keys(VARIETY));
/** the end line of each (causes.js#CAUSE_LINES — 'car:<id>') */
export const VARIETY_LINES = Object.freeze({
  police: 'BUSTED BY A POLICE CAR', suv: 'FLATTENED BY AN SUV', sports: 'SMOKED BY A SPORTS CAR', forklift: 'SCOOPED BY A FORKLIFT',
  ambulance: 'HIT BY AN AMBULANCE', firetruck: 'RUN DOWN BY A FIRE TRUCK', delivery: 'HIT BY A DELIVERY TRUCK', garbage: 'TRASHED BY A GARBAGE TRUCK',
  citybus: 'FLATTENED BY A CITY BUS', tanker: 'FLATTENED BY A FUEL TANKER', dump: 'FLATTENED BY A DUMP TRUCK', tug: 'RUN OVER BY AN AIRPORT TUG',
  schoolbus: 'FLATTENED BY A SCHOOL BUS', semi: 'FLATTENED BY A SEMI', bendy: 'FLATTENED BY A BENDY BUS',
  plow: 'PLOWED BY A SNOWPLOW', salt: 'SALTED BY A SALT TRUCK',
});
/** THE AREA SETS — by the area's index (tuning.js#LANDMARKS: 0 THE DOCKS · 1 THE FISH MARKET · 2 THE RAIL YARD · 3 THE BRIDGE · 4 DOWNTOWN · … */
const DOWNTOWN = { 1: [['police', 0.07], ['suv', 0.08], ['sports', 0.07]], 2: [['citybus', 0.2], ['delivery', 0.17]], 3: [['bendy', 0.42]] };
const DOCKS = { 1: [['forklift', 0.1]], 2: [['delivery', 0.13], ['garbage', 0.12], ['tanker', 0.13]], 3: [['semi', 0.45]] };
const SHORE = { 1: [['suv', 0.1]], 2: [['ambulance', 0.2]], 3: [['schoolbus', 0.42]] };
export const AREA_SETS = Object.freeze({
  '-1': DOWNTOWN, 4: DOWNTOWN,
  0: DOCKS, 1: DOCKS,
  2: { 2: [['dump', 0.22], ['garbage', 0.16]], 3: [['semi', 0.45]] },
  3: { 1: [['suv', 0.12]], 2: [['citybus', 0.18], ['tanker', 0.18]], 3: [['semi', 0.42]] },
  5: SHORE, 6: SHORE,
  7: { 2: [['tug', 0.12], ['tanker', 0.1], ['firetruck', 0.1], ['delivery', 0.1]] },
});
/** the ids an area draws */
export const areaIds = ar => { const S = AREA_SETS[ar] || {}; return [...new Set(Object.values(S).flat().map(e => e[0]))]; };
/** VARIETY B2 — THE WINTER TRUCKS: on a winter run (the run's own day — night.js#setSeason, Dec 1 → Mar 1) the van slot's top tenth of … */
let WINTER = false;
export const setWinterTraffic = on => { WINTER = !!on; };
export const winterTraffic = () => WINTER;
/** what an area wants loaded (+ the winter trucks on a winter run) */
export const areaWants = ar => (WINTER ? [...areaIds(ar), 'plow', 'salt'] : areaIds(ar));
/** PURE (+ the run's winter): area `ar`, slot `slot` (1 · 2 · 3 cells), a 0 … 1 draw `u` (the course seed's hash) → the variety id, or '' (a plain vehicle) */
export function varietyAt(ar, slot, u) {
  if (WINTER && slot === 2 && u >= 0.9) return u < 0.95 ? 'plow' : 'salt';
  const L = (AREA_SETS[ar] || {})[slot];
  if (!L) return '';
  let c = 0;
  for (const [id, k] of L) { c += k; if (u < c) return id; }
  return '';
}

/** THE NAMES ARE THE DRAWN ONES: the ids whose model has come in on this page (kept for the page's life — a rival's end line in an area this … */
const KNOWN = new Set();
export const varietyKnown = id => KNOWN.has(id);
/** (the tests + the lab) every id known — as if all were in */
export const knowAll = (on = true) => { if (on) for (const id of VARIETY_IDS) KNOWN.add(id); else KNOWN.clear(); };

const DIR = new URL('../../../assets/jaywalk/variety/', import.meta.url);
export const VARIETY_REV = 2;
/** the OPENING's files into the HTTP cache (the cartridge's preload, during the walk inside — its 1.5 MB line: THE DOCKS' come in from the … */
export const warmVariety = () => Promise.all(areaIds(-1).map(id => fetch(new URL(`${id}.glb?v=${VARIETY_REV}`, DIR)).catch(() => null)));

/** VARIETY B2 — THE TAPS: a frame that has already worked this long (ms) — or whose kid has just left the ground — takes no loading step; … */
export const PUMP = Object.freeze({ budget: 7, starve: 24 });
/** … */
export function createVariety({ parseGlb, add, drop, now = () => performance.now(), ids = areaWants, url = id => new URL(`${id}.glb?v=${VARIETY_REV}`, DIR), known = KNOWN }) {
  const held = new Map(), queue = [];
  let wanted = new Set(), dead = false, retryAt = 0, staged = null, starve = 0, worst = 0;
  const drops = [];
  function fetchOne(id) {
    held.set(id, 'loading');
    fetch(url(id)).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(id))))
      .then(b => { if (!dead && wanted.has(id)) queue.push([id, b]); else held.delete(id); }, () => { held.delete(id); retryAt = now() + 5000; });
  }
  return {
    /** a failed file's retry is due (the scene then asks again) */
    due: () => retryAt > 0 && now() > retryAt,
    want(areas) {
      retryAt = 0;
      wanted = new Set(areas.flatMap(ids));
      for (let k = drops.length - 1; k >= 0; k--) if (wanted.has(drops[k])) { held.set(drops[k], 'in'); drops.splice(k, 1); }
      for (const id of wanted) if (!held.has(id)) fetchOne(id);
      for (const [id, st] of [...held]) if (!wanted.has(id)) { held.delete(id); if (st === 'in') drops.push(id); }
    },
    /** busy = this frame's work so far (ms) — Infinity when the kid has just hopped: no step this frame. → a step taken? */
    pump(busy = 0) {
      if (dead || (!staged && !queue.length && !drops.length)) { starve = 0; return false; }
      if (busy > PUMP.budget && ++starve < PUMP.starve) return false;
      starve = 0;
      const t0 = now();
      if (drops.length) drop(drops.shift());
      else if (staged) {
        const [id, g] = staged; staged = null;
        if (!wanted.has(id)) { held.delete(id); g.dispose(); return true; }
        try { add(id, g); held.set(id, 'in'); known.add(id); } catch { held.delete(id); }
      } else {
        const [id, b] = queue.shift();
        if (!wanted.has(id)) { held.delete(id); return true; }
        try { staged = [id, parseGlb(b)]; } catch { held.delete(id); }
      }
      worst = Math.max(worst, now() - t0);
      return true;
    },
    info: () => ({ held: [...held].filter(e => e[1] === 'in').map(e => e[0]).sort(), loading: [...held].filter(e => e[1] === 'loading').length, queued: queue.length, staged: staged ? 1 : 0, drops: drops.length, worst: Math.round(worst * 10) / 10 }),
    destroy() { dead = true; queue.length = 0; if (staged) { staged[1].dispose(); staged = null; } },
  };
}
