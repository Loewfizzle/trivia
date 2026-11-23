// JAYWALK — THE AREA TRAFFIC (VARIETY B1 — docs/jaywalk.md "VARIETY B1"): COSMETIC — the rules' road slots (a 1-cell car · the 2-cell van ·
// the 3-cell box truck) are unchanged; this only says WHICH MODEL draws a slot, by THE AREA, from the course's seed (the same on every phone).
// Plain cars stay the majority: more TYPES on screen, never more vehicles. A model fills EXACTLY its slot's length (night.js scales it to the
// rule's length). The models load PER AREA, a stretch AHEAD (createVariety) — never the start bundle; until a model is in (a slow network)
// the slot draws its plain vehicle — and the end line names the vehicle drawn (KNOWN: causes.js#vehicleAt asks it).

/** every variety vehicle: its slot (cells), its drawn width + height (cells), its emergency light bar ('' = none; `bar` = along the body from the
 *  nose 0 … 1, its height as a share of the model's) · dayK = by day a touch under (a white body blew out to a flat slab — the box truck's rule) */
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
});
export const VARIETY_IDS = Object.freeze(Object.keys(VARIETY));
/** the end line of each (causes.js#CAUSE_LINES — 'car:<id>') */
export const VARIETY_LINES = Object.freeze({
  police: 'BUSTED BY A POLICE CAR', suv: 'FLATTENED BY AN SUV', sports: 'SMOKED BY A SPORTS CAR', forklift: 'SCOOPED BY A FORKLIFT',
  ambulance: 'HIT BY AN AMBULANCE', firetruck: 'RUN DOWN BY A FIRE TRUCK', delivery: 'HIT BY A DELIVERY TRUCK', garbage: 'TRASHED BY A GARBAGE TRUCK',
  citybus: 'FLATTENED BY A CITY BUS', tanker: 'FLATTENED BY A FUEL TANKER', dump: 'FLATTENED BY A DUMP TRUCK', tug: 'RUN OVER BY AN AIRPORT TUG',
  schoolbus: 'FLATTENED BY A SCHOOL BUS', semi: 'FLATTENED BY A SEMI', bendy: 'FLATTENED BY A BENDY BUS',
});
/** THE AREA SETS — by the area's index (tuning.js#LANDMARKS: 0 THE DOCKS · 1 THE FISH MARKET · 2 THE RAIL YARD · 3 THE BRIDGE · 4 DOWNTOWN ·
 *  5 THE CANAL · 6 THE LIGHTHOUSE · 7 THE AIRFIELD; −1 = the opening, DOWNTOWN's set) → per slot [id, share of that slot's vehicles]. A 1-cell
 *  slot keeps ≥ 3 / 4 plain cars everywhere (the sedans · hatchbacks · taxis), every slot ≥ 1/2 plain — plain the clear majority on screen. */
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
/** PURE: area `ar`, slot `slot` (1 · 2 · 3 cells), a 0 … 1 draw `u` (the course seed's hash) → the variety id, or '' (a plain vehicle) */
export function varietyAt(ar, slot, u) {
  const L = (AREA_SETS[ar] || {})[slot];
  if (!L) return '';
  let c = 0;
  for (const [id, k] of L) { c += k; if (u < c) return id; }
  return '';
}

/** THE NAMES ARE THE DRAWN ONES: the ids whose model has come in on this page (kept for the page's life — a rival's end line in an area this
 *  phone already passed still names what was drawn there) */
const KNOWN = new Set();
export const varietyKnown = id => KNOWN.has(id);
/** (the tests + the lab) every id known — as if all were in */
export const knowAll = (on = true) => { if (on) for (const id of VARIETY_IDS) KNOWN.add(id); else KNOWN.clear(); };

const DIR = new URL('../../../assets/jaywalk/variety/', import.meta.url);
export const VARIETY_REV = 1;
/** the OPENING's files into the HTTP cache (the cartridge's preload, during the walk inside — its 1.5 MB line: THE DOCKS' come in from the
 *  scene itself while the menu / the count shows) — fetched, never parsed */
export const warmVariety = () => Promise.all(areaIds(-1).map(id => fetch(new URL(`${id}.glb?v=${VARIETY_REV}`, DIR)).catch(() => null)));

/**
 * THE PER-AREA LOADER: want(list of area indices) → the files of those areas fetched (the ones no longer wanted FREED — drop(id)); pump() at a
 * frame parses at most ONE model (a frame never pays for two); a file that fails is asked again 5 s later (never a stall: the slot draws its
 * plain vehicle meanwhile). → { want, pump, info, destroy }
 */
export function createVariety({ parseGlb, add, drop, now = () => performance.now() }) {
  const held = new Map(), queue = [];   // id → 'loading' | 'in' · the fetched buffers waiting for a frame
  let wanted = new Set(), dead = false, retryAt = 0;
  function fetchOne(id) {
    held.set(id, 'loading');
    fetch(new URL(`${id}.glb?v=${VARIETY_REV}`, DIR)).then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(id))))
      .then(b => { if (!dead && wanted.has(id)) queue.push([id, b]); else held.delete(id); }, () => { held.delete(id); retryAt = now() + 5000; });
  }
  return {
    /** a failed file's retry is due (the scene then asks again) */
    due: () => retryAt > 0 && now() > retryAt,
    want(areas) {
      retryAt = 0;
      wanted = new Set(areas.flatMap(areaIds));
      for (const id of wanted) if (!held.has(id)) fetchOne(id);
      for (const [id, st] of [...held]) if (!wanted.has(id)) { held.delete(id); if (st === 'in') drop(id); }
    },
    pump() {
      const q = queue.shift();
      if (!q || dead) return;
      const [id, b] = q;
      if (!wanted.has(id)) { held.delete(id); return; }
      try { add(id, parseGlb(b)); held.set(id, 'in'); KNOWN.add(id); } catch { held.delete(id); }
    },
    info: () => ({ held: [...held].filter(e => e[1] === 'in').map(e => e[0]).sort(), loading: [...held].filter(e => e[1] === 'loading').length, queued: queue.length }),
    destroy() { dead = true; queue.length = 0; },
  };
}
