// CITY 2.0 — THE HARBOR: the skyline's two baked groups (Part 2), far → near.
//   'far'  : the haze band → its veil → the far band + the glass towers → its veil → the mid band + the middle-tier towers → veil
//   'near' : the landmark towers (the sunburst, the EMPIRE, the needle, the word towers), the near band, the hero blocks — all
//            by depth (a word tower at z 247 stands among the near band's blocks), then the quay (quay.js)
// The facades bake here per look key; the lit windows bake per light step (lights.js) over the same items in the same order.
import { skyBlock, shadowsFor, drawShadow, hazeVeil, castShadows, drawCast } from './blocks.js';

/** floodlights at night (from tier `from` up): the sunburst gold, the EMPIRE white, the needle cool, the dome warm */
const FLOOD = {
  sunburst: { col: [255, 204, 128], from: 1 }, empire: { col: [228, 234, 255], from: 2 }, needle: { col: [196, 228, 255], from: 1 },
  'm-dome': { col: [255, 212, 156], from: 1 },
};
const SPLIT = 300;                 // towers this far back are baked with the far group
const VEILS = [{ z: 620, up: 70, a: 0.72 }, { z: 380, up: 60, a: 0.5 }, { z: 300, up: 46, a: 0.38 }];

const cache = new WeakMap();
/** the items of both groups, far first: { b (the box drawn: a block or a tower's tier), o (draw options) } or { veil } */
export function skyItems(L) {
  if (cache.has(L)) return cache.get(L);
  const far = [], near = [];
  for (const bd of L.bands) for (const b of bd.blocks) (bd.id === 'near' ? near : far).push({ b, o: { rank: 'band', tierIndex: 0 } });
  for (const t of L.towers) {
    const fl = FLOOD[t.id] || (t.rank === 'pano' && t.seed % 3 === 0 ? { col: [255, 210, 156], from: t.tiers.length - 1 } : null);
    t.tiers.forEach((tr, i) => (t.z0 >= SPLIT ? far : near).push({
      b: { ...tr, mat: t.mat, seed: t.seed, kind: 'landmark', tower: t.id, rank: t.rank, works: t.works || null },   // (9e: the construction slot's frame / dark shell)
      o: { rank: t.rank, tierIndex: i, tiers: t.tiers.length, flood: fl && i >= fl.from ? fl.col : null, gold: !!t.gold, tower: t },
    }));
  }
  for (const b of L.heroes) near.push({ b, o: { rank: 'quay', tierIndex: 0 } });
  const byZ = (a, c) => c.b.z0 - a.b.z0;
  far.sort(byZ); near.sort(byZ);
  // the veils go in where the depth crosses them (the distance dissolves at each band's feet)
  const farV = [];
  let vi = 0;
  for (const it of far) { while (vi < VEILS.length && it.b.z0 < VEILS[vi].z) farV.push({ veil: VEILS[vi++] }); farV.push(it); }
  while (vi < VEILS.length) farV.push({ veil: VEILS[vi++] });
  const out = { far: farV, near };
  cache.set(L, out);
  return out;
}

/** the facade bake steps of a group (n buildings a step); cast shadows are drawn right after their building */
const castCache = new WeakMap();
export function facadeSteps(L, T, group, n = 6, after = null) {
  const cam = L.cam, items = skyItems(L)[group];
  const sh = shadowsFor(cam, items.filter(it => it.b).map(it => it.b), T);
  // (M2: shadows between buildings at different depths — every box of BOTH groups can throw one onto a wall behind it)
  const all = skyItems(L), key = `${T.day}|${T.sunDir}|${T.sunEl}|${T.ovc}|${T.cloud}`;
  let cc = castCache.get(L);
  if (!cc || cc.key !== key) { cc = { key, map: castShadows(cam, [...all.far, ...all.near].filter(it => it.b).map(it => it.b), T) }; castCache.set(L, cc); }
  const cast = cc.map;
  const steps = [];
  for (let i = 0; i < items.length; i += n) {
    const part = items.slice(i, i + n);
    steps.push(x => {
      for (const it of part) {
        if (it.veil) { hazeVeil(x, cam, it.veil.z, it.veil.up * cam.F / 600, T, it.veil.a); continue; }
        skyBlock(x, cam, it.b, T, it.o);
        drawShadow(x, sh.get(it.b));
        drawCast(x, cast.get(it.b));
        if (after) after(x, it, T);          // (Part 3: its neon outline's glass, so whatever stands nearer covers it)
      }
    });
  }
  return steps;
}
