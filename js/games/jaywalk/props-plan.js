// JAYWALK — VARIETY B2: THE AREA TREES + THE EDGE DECORATION, the PURE half (the tables + the dressing — tests/jaywalk-variety-b2.test.mjs;
// the scene's half: props.js). docs/jaywalk.md "VARIETY B2".
import { COLS } from './tuning.js';

/** THE TREES (normalised to a height of 1 at build): their height + their across (`xz` — the crown ≈ 0.8 of a cell: a blocked cell reads FULL,
 *  as today's round tree did) in cells · deciduous (autumn turns it; winter dusts it) or a palm (green in autumn; a snow pine in winter —
 *  seasonal.js) · the shrub is built in cells */
export const TREES = Object.freeze({ thin: { h: 1.35, xz: 1.7, leaf: true }, oak: { h: 1.25, xz: 1.35, leaf: true }, palm: { h: 1.5, xz: 1.75, leaf: false }, tall: { h: 1.7, xz: 1.95, leaf: true }, shrub: { h: 1, xz: 1, leaf: true, code: true } });
/** each area's tree mix (by course.js#area(lane).index; −1 = the opening) for the cells that hold a TREE today · `street` = the share of its
 *  PLANTER cells drawn as a thin street tree instead (the same one cell) · the opening's lanes by THE DOCKS' gate (41 …) hold palms */
export const TREE_SETS = Object.freeze({
  '-1': { tree: [['thin', 0.8], ['oak', 0.2]] },
  4: { tree: [['thin', 1]], street: 0.4 },
  5: { tree: [['oak', 0.6], ['thin', 0.4]] },
  6: { tree: [['palm', 0.85], ['oak', 0.15]] },
  0: { tree: [['palm', 1]] }, 1: { tree: [['palm', 1]] }, 2: { tree: [['tall', 1]] }, 3: { tree: [['oak', 0.6], ['thin', 0.4]] }, 7: { tree: [['tall', 1]] },
});
/** THE EDGE DECORATION: what goes into an EMPTY edge-column slot of a ground lane, by area, and how often (`p` of the free slots). Ids: e- = a
 *  model (assets/jaywalk/edge/) · t- = a margin tree (the area's mix: palms by the water, tall trees + shrubs by the rails + the runways) ·
 *  c- = built in code · `bollard` = THE DOCKS' own piece. DOWNTOWN's edge column is always full (its shops) — its EDGE HYDRANTS become the
 *  street furniture (`swap`). THE BRIDGE's edge is its railing: nothing. */
export const DECO_SETS = Object.freeze({
  '-1': { p: 0.9, ids: ['e-bench', 'e-trashcan', 'e-sign', 'e-mailbox'] },
  4: { p: 0, swap: 'hydrant', ids: ['e-bench', 'e-busstop', 'e-trashcan', 'e-mailbox', 'e-sign'] },
  0: { p: 1, palm: { from: ['crate'], p: 0.55 }, ids: ['e-buoy', 'e-rowboat', 'e-barrel', 'c-fishcrate', 'bollard', 't-palm'] },
  1: { p: 1, palm: { from: ['crate', 'icecrate'], p: 0.55 }, ids: ['c-fishcrate', 'e-barrel', 'e-buoy', 'e-rowboat', 't-palm'] },
  2: { p: 1, ids: ['c-railsignal', 'c-railties', 't-tall', 't-shrub'] },
  5: { p: 1, ids: ['e-bench', 'e-fence', 'e-trashcan', 't-oak'] },
  6: { p: 0.85, ids: ['e-rocks', 'e-fence', 'e-rocks', 't-palm'] },
  7: { p: 1, ids: ['c-windsock', 'c-runwaysign', 'c-bagcart', 't-tall', 't-shrub'] },
});
/** each piece: its height in cells (the edge models are normalised to 1 at build), its turn (+ the side's inward turn), its contact shadow */
export const DECO = Object.freeze({
  'e-bench': { h: 0.3, ry: Math.PI / 2, sh: [0.62, 0.36] }, 'e-busstop': { h: 0.6, ry: Math.PI / 2, sh: [0.9, 0.6] }, 'e-sign': { h: 0.78, ry: 0, sh: [0.3, 0.3] },
  'e-trashcan': { h: 0.4, ry: 0, sh: [0.32, 0.32] }, 'e-mailbox': { h: 0.5, ry: Math.PI / 2, sh: [0.3, 0.3] }, 'e-barrel': { h: 0.36, ry: 0, sh: [0.44, 0.44] },
  'e-buoy': { h: 0.62, ry: 0, sh: [0.32, 0.36] }, 'e-rocks': { h: 0.3, ry: 0, sh: [0.62, 0.62] }, 'e-fence': { h: 0.3, ry: Math.PI / 2, sh: [0.2, 0.55] },
  'e-rowboat': { h: 0.26, ry: Math.PI / 2, sh: [0.62, 0.85] },
  'c-fishcrate': { h: 1, ry: 0, sh: [0.6, 0.46] }, 'c-railsignal': { h: 1, ry: 0, sh: [0.3, 0.3] }, 'c-railties': { h: 1, ry: 0, sh: [0.5, 0.86] },
  'c-windsock': { h: 1, ry: 0, sh: [0.3, 0.3], sway: true }, 'c-runwaysign': { h: 1, ry: Math.PI / 2, sh: [0.24, 0.6] }, 'c-bagcart': { h: 1, ry: 0, sh: [0.5, 0.86] },
});
const pick = (L, u) => { let c = 0; for (const [id, k] of L) { c += k; if (u < c) return id; } return L[L.length - 1][0]; };
/** PURE: the tree model a TREE cell of lane `lane` in area `ai` draws (u: its 0 … 1 hash) */
export const treeOf = (ai, lane, u) => (ai < 0 && lane > 40 ? 'palm' : pick((TREE_SETS[ai] || TREE_SETS['-1']).tree, u));
/** PURE: the model ids an area's pieces need (trees + edge files — the code-built ones need none) */
export const propIds = ai => {
  const T = TREE_SETS[ai], D = DECO_SETS[ai], out = new Set();
  if (T) for (const [id] of T.tree) if (!TREES[id].code) out.add(`t-${id}`);
  if (T && T.street) out.add('t-thin');
  if (ai < 0) out.add('t-palm');
  if (D) for (const id of D.ids) if (id.startsWith('e-') || (id.startsWith('t-') && !TREES[id.slice(2)].code)) out.add(id);
  return [...out].sort();
};
/**
 * PURE — THE DRESSING (decorOf's lane, after areas.js / the opening laid it): `d` = { obs, lamp }, `ai` the area, `h(a, b)` the lane's own hash
 * (the course's seed — every phone the same). Marks each TREE cell's model (q.tk), turns DOWNTOWN's share of planters into street trees,
 * fills empty edge slots. Never adds, moves or removes a PLAY cell's prop (the gameplay lock: tests/jaywalk-variety-b2.test.mjs).
 */
export function dress(d, i, L, ai, h) {
  const T = TREE_SETS[ai], D = DECO_SETS[ai];
  for (const q of d.obs) {
    if (q.k === 'tree') q.tk = treeOf(ai, i, h(q.c * 13 + 7, 21));
    else if (q.k === 'bush-planter' && T && T.street && q.c >= 0 && q.c < COLS && h(q.c * 17 + 2, 22) < T.street) q.tk = 'thin';
  }
  if (!D || L.mark) return d;
  for (const c of [-1, COLS]) {
    const side = c < 0 ? -1 : 1;
    if (d.lamp === side) continue;
    const here = d.obs.filter(q => q.c === c);
    const deco = id => (id.startsWith('t-') ? { c, k: 'tree', tk: id.slice(2), s: h(c * 5 + 3, 23), ry: (h(c + 31, 24) - 0.5) * 0.9, dx: side * 0.1, dz: (h(c + 7, 25) - 0.5) * 0.3, edge: true, deco: 1 }
      : id === 'bollard' ? { c, k: 'bollard', s: 0.5, ry: 0, dx: side * 0.12, dz: 0, r: 0, edge: true, deco: 1 }
        : { c, k: id, s: h(c * 5 + 3, 23), ry: (h(c + 31, 24) - 0.5) * 0.5, dx: side * 0.14, dz: (h(c + 7, 25) - 0.5) * 0.24, edge: true, deco: 2, side });
    const id = D.ids[Math.floor(h(c * 11 + 1, 26) * D.ids.length) % D.ids.length];
    if (D.palm) { const q = here.find(x => x.edge && D.palm.from.includes(x.k)); if (q && h(c * 23 + 6, 28) < D.palm.p) { d.obs[d.obs.indexOf(q)] = deco('t-palm'); continue; } }   // (the owner: some EDGE crates at THE DOCKS + THE FISH MARKET are palms — never a play cell)
    if (D.swap) { const q = here.find(x => x.k === D.swap && x.edge); if (q) d.obs[d.obs.indexOf(q)] = deco(id); continue; }
    if (here.length || h(c * 19 + 4, 27) >= D.p) continue;
    d.obs.push(deco(id));
  }
  return d;
}
