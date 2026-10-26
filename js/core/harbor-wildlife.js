// CITY 2.0 — THE HARBOR, PART 8b1 (Group 2): THE WILDLIFE — the plan (PURE — tests/harbor-wildlife.test.mjs; drawn by
// screens/harbor/wildlife.js + fauna.js). The owner's "8b — THE WILDLIFE, ALL NEW FOR CITY 2.0" + "8b — WILDLIFE THAT REACTS TO PEOPLE"
// (docs/harbor/plan.md): every animal rebuilt for the Harbor, premium, readable at phone size or enlarged / cut.
//
// HOW IT STAYS THE SAME ON EVERY PHONE + JOINS MID-WAY: like the people (core/harbor-people.js) and the routines
// (core/harbor-routines.js), every animal's SCHEDULE is planned from a seed (the local date + a slot), so where the pigeons sit, when
// the gulls land, the owl's day, the coyote's night are a pure function of the clock: a page opened mid-way finds them mid-way. Nothing
// pops in or out — they fly / walk / climb in and out. Only the REACTIONS are live (screens/harbor/wildlife.js): a person walking
// close flushes the pigeons, the squirrel dashes up its tree, the coyote bolts — the people themselves are a pure function
// of the clock, so every phone watching sees the same scare.
//
// ADDING AN ANIMAL: its plan here (a function of a slot / a day + ctx → its sessions, seeded; the season, the hour, the weather as
// weights; a `force` loop for the preview), its painter in fauna.js (3-D points projected through the camera: the facing comes for
// free), its live state + pass in wildlife.js, a row in core/harbor-remote.js (cat 'wildlife'), a check in the unit test.
import { rngFrom, hashString } from './rng.js';
import { xOfF, seasonOf, HYDRANT, hydrantSpot } from './harbor-promenade.js';
import { mixNow, FOLK } from './harbor-people.js';
import { SPEAK_V } from './harbor-speakeasy.js';

const PI = Math.PI;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
/** the local clock at t (s, absolute) → { key, dow, h, month, day, day0 (the local midnight, s abs) } */
export const localOf = (t, off) => { const lt = t + (off || 0) * 60, d = new Date(lt * 1000), h = ((lt / 3600) % 24 + 24) % 24; return { key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, dow: d.getUTCDay(), h, month: d.getUTCMonth() + 1, day: d.getUTCDate(), day0: t - h * 3600 }; };
const R = (...k) => rngFrom(hashString(k.join('|')));

// ------------------------------------------------------------------ THE SIZES (world units; 1 ≈ 0.85 m) — the phone cheats
/** each animal's size in world units WITH the phone's cheat (the true size × k): at ~13 pt a unit on the promenade a true pigeon is
 *  ~5 pt, a squirrel ~4 — they read only by motion + silhouette, so every small one is drawn bigger (the owner's squirrel note: ~1.5×) */
export const SIZE = Object.freeze({
  pigeon: { len: 0.7, k: 1.85 },         // (0.32 m true → ~9–10 pt on the floor, ~8 on the blade's top: they read as a flock in motion)
  gull: { len: 1.05, span: 2.3, k: 1.55 },
  owl: { h: 1.05, k: 1.6 },              // (the snowy owl: ~10–13 pt on its perch)
  squirrel: { len: 0.56, tail: 0.56, k: 2.0 },  // (8b1 phone test: 1.5× was lost among the autumn leaves at 402 — 2×, a dark coat)
  coyote: { len: 1.55, h: 0.95, k: 1.15 },
  cat: { len: 0.72, h: 0.34, k: 1.25 },
  heron: { h: 2.6, k: 2.0 },             // (a big readable shape on its piling out at z 100 — 1.1 m true, ~16 pt)
});

// ------------------------------------------------------------------ THE PLACES (world x, y, z — from the layout)
/** the café-light canopy's posts (screens/harbor/strings.js#CANOPY: back 1.2, top 13.0, the posts' wall units) and the blade's top
 *  (screens/harbor/speakeasy-blade.js#BLADE: out 0.22, bw 1.86, v1 11.0, set back w 0.42 along the side wall) — kept in step by hand */
const CANOPY = { back: 1.2, top: 13.0, posts: [2.55, 9.75] };
const BLADE = { w: 0.42, out: 0.22, bw: 1.86, v1: 11.0 };
/** POLISH 5 — THE FIRE HYDRANT's spot (the trash can's old one): the layout's (core/harbor-promenade.js#hydrantSpot — L.hydrant) */
export { HYDRANT };
export const hydrantOf = L => L.hydrant || hydrantSpot(L.cam, L.lamps);
/** THE MOORING PILING (the heron's): a weathered three-timber dolphin out in the open water between the WALK / WAIT lantern and the
 *  right stop light (f 0.712, z 100 at 402 — clear of the lamps' globes, the lantern + the crabapple: the heron stands over the lamps'
 *  line against the bright water + Rosie's reflection); its top `top` over the water */
export const PILING = Object.freeze({ f: 0.712, z: 100, top: 1.45, water: -1.2, r: 0.4 });
export function pilingSpot(L) { return { x: xOfF(L.cam, PILING.f, PILING.z), z: PILING.z, y: PILING.top, water: PILING.water, r: PILING.r }; }

/**
 * Every perch (world): { id, kind ('ground' | 'ledge' | 'rail'), x0, x1 (its span), y, z, cap (birds), who: [kinds allowed] }.
 * The pigeons' patches on the cobbles are spots too (kind 'ground', a centre + a radius). PURE.
 */
export function wildSpots(L) {
  const s = L.speakeasy, B = L.roof && L.roof.board, cam = L.cam, out = [];
  const add = o => out.push(o);
  // the cobbles: three patches on the open floor (between the bench + the compass, the right floor, the front middle)
  [[0.585, 43.6], [0.79, 43.4], [0.69, 40.6]].forEach(([f, z], i) => add({ id: `ground${i}`, kind: 'ground', x: xOfF(cam, f, z), z, y: 0, rx: 1.5, rz: 0.9, cap: 8, who: ['pigeon'] }));
  // the blade's top (the stepped crest's flat), the parapet's coping (either side of the date stone's panel), the date stone's top
  const bx = s.x1 + BLADE.out;
  add({ id: 'blade', kind: 'ledge', x0: bx + 0.62, x1: bx + BLADE.bw - 0.62, y: BLADE.v1, z: s.z0 + BLADE.w, cap: 3, who: ['pigeon'] });
  add({ id: 'parapetL', kind: 'ledge', x0: s.x0 + 3.5, x1: s.x0 + 4.5, y: SPEAK_V.parapet, z: s.z0 + 0.1, cap: 2, who: ['pigeon'] });
  add({ id: 'parapetR', kind: 'ledge', x0: s.x0 + 7.7, x1: s.x0 + 10.3, y: SPEAK_V.parapet, z: s.z0 + 0.1, cap: 3, who: ['pigeon'] });
  add({ id: 'crest', kind: 'ledge', x0: s.x0 + 5.5, x1: s.x0 + 5.9, y: SPEAK_V.crest, z: s.z0 + 0.1, cap: 1, who: ['owl'] });
  // the roof billboard: its top edge + the catwalk's railing along its foot
  if (B) {
    add({ id: 'bill', kind: 'ledge', x0: B.x0 + 0.45, x1: B.x1 - 0.45, y: B.y1 + 0.03, z: B.z, cap: 4, who: ['pigeon', 'gull'] });
    add({ id: 'catwalk', kind: 'rail', x0: B.x0 + 0.2, x1: B.x1 - 0.2, y: B.y0 + 0.2, z: B.z - 0.35, cap: 3, who: ['pigeon', 'gull'] });
    add({ id: 'billL', kind: 'ledge', x0: B.x0 + 0.3, x1: B.x0 + 0.6, y: B.y1 + 0.03, z: B.z, cap: 1, who: ['owl'] });
    add({ id: 'billR', kind: 'ledge', x0: B.x1 - 0.6, x1: B.x1 - 0.3, y: B.y1 + 0.03, z: B.z, cap: 1, who: ['owl'] });
  }
  // the tall lamps' crossarms (either side of the finial), the café-light posts' caps
  (L.lamps || []).filter(l => l.kind === 'tall').forEach((l, i) => {
    for (const d of [-1, 1]) add({ id: `lamp${i}${d < 0 ? 'a' : 'b'}`, kind: 'rail', x0: l.x + d * 0.42 - 0.08, x1: l.x + d * 0.42 + 0.08, y: l.h - 0.66, z: l.z, cap: 1, who: ['pigeon'] });
    add({ id: `lampTop${i}`, kind: 'ledge', x0: l.x - 0.02, x1: l.x + 0.02, y: l.h - 0.32, z: l.z, cap: 1, who: ['owl'] });
  });
  CANOPY.posts.forEach((u, i) => add({ id: `post${i}`, kind: 'ledge', x0: s.x0 + u - 0.02, x1: s.x0 + u + 0.02, y: CANOPY.top + 0.1, z: s.z0 + CANOPY.back, cap: 1, who: ['pigeon'] }));
  // the waterside railing (gulls): either side of the WALK / WAIT lantern, behind the crosswalk (open water behind them)
  const rz = 64, cw = L.crosswalk;
  if (cw) for (const [id, f] of [['railA', 0.36], ['railB', 0.78]]) { const x = cw.x0 + (cw.x1 - cw.x0) * f; add({ id, kind: 'rail', x0: x - 0.2, x1: x + 0.2, y: 1.12, z: rz, cap: 1, who: ['gull'] }); }
  return out;
}
/** a bird's place on a spot: k-th of the spot's slots (ledges: evenly along the span; the ground: seeded inside the patch) */
export function spotPoint(sp, k, seed = 0) {
  if (sp.kind === 'ground') { const r = rngFrom(hashString(`gp|${sp.id}|${k}|${seed}`)), a = r() * 2 * PI, d = Math.sqrt(r()); return { x: sp.x + Math.cos(a) * d * sp.rx, y: 0, z: sp.z + Math.sin(a) * d * sp.rz }; }
  const n = Math.max(1, sp.cap), u = n === 1 ? 0.5 : k / (n - 1);
  return { x: sp.x0 + (sp.x1 - sp.x0) * u, y: sp.y, z: sp.z };
}
/** an off-screen point a bird flies to / from: left / right edge (at the height + depth of the flight), or BACK over the harbor */
export function offPoint(L, dir, near) {
  const cam = L.cam, z = near ? near.z : 46;
  if (dir === 'back') return { x: (near ? near.x : 0) + 6, y: 15, z: 105 };
  const s = dir === 'left' ? -1 : 1;
  return { x: s * (cam.hw(z) + 3), y: Math.max(6, (near ? near.y : 0) + 4), z };
}

// ------------------------------------------------------------------ THE PIGEONS (perches + the flock by the clock)
/** the flock: up to `max` birds (the same eight for the day), planned per `slot` s — how many are out + where each sits; between two
 *  slots each bird flies from its old spot to its new one at its own moment in the first `move` s (never all together) */
export const PIGEON = Object.freeze({ max: 8, slot: 540, move: 70, fly: 2.6, tier: [4, 6, 8], awayP: 0.3, away: [90, 360], highStay: [60, 240] });
/** how many pigeons are out at local hour h (PURE): 2–8 by the time (busy mornings + evenings), the season (winter fewer on the ground,
 *  spring + summer the most), the weather (rain: a few huddled on ledges), Sunday a few more (quiet), the night a couple roosting */
export function pigeonCount({ h = 12, dow = 3, month = 10, rain = 0, sun = null } = {}) {
  const rise = sun ? sun.rise : 7, set = sun ? sun.set : 18.5;
  if (h < rise - 0.3 || h > set + 0.6) return 2;                      // (roosting: two asleep on a ledge)
  const season = seasonOf(month, 15);
  let n = h < 9.5 ? 6.5 : h < 12 ? 5 : h < 14 ? 4.5 : h < 17 ? 5 : 4;
  n *= season === 'winter' ? 0.75 : season === 'autumn' ? 0.9 : 1.15;
  if (dow === 0) n += 1;
  if (rain > 0.3) n *= 0.6;
  return Math.max(2, Math.min(PIGEON.max, Math.round(n)));
}
/** the share of the flock on the cobbles (PURE): quiet times + the warm months more, winter / rain / a busy promenade / the evening
 *  fewer (they sit high) */
export function groundShare({ h = 12, month = 10, rain = 0, busy = 3, sun = null } = {}) {
  const set = sun ? sun.set : 18.5, season = seasonOf(month, 15);
  let g = 0.55;
  if (season === 'winter') g = 0.18; else if (season === 'autumn') g = 0.5;
  if (rain > 0.3) g = 0.04;
  g *= busy > 5.5 ? 0.3 : busy > 4 ? 0.5 : busy > 2.5 ? 0.75 : 1;   // (a busy promenade: most of them up on the ledges — the walkers would only flush them)
  if (h > set - 0.8) g *= 0.35;
  return clamp01(g);
}
/**
 * The flock in slot j (PURE): { j, n, gone (the whole flock away this slot), birds: [{ i, spot (id) | null, k (its place on it) }] }.
 * ctx: { off, seed, spots (wildSpots), sun: { rise, set } (local hours), rain, owl(t) → its perch spot id | null, force: Set }.
 * Never a stale loop: each slot re-draws who sits where; sometimes the whole flock is gone for a stretch (gone slots come in runs).
 */
export function pigeonSlot(j, ctx = {}) {
  const S = PIGEON.slot, t = j * S + S / 2, loc = localOf(t, ctx.off), r = R('pg', ctx.seed || 1924, loc.key, j);
  const f = ctx.force || new Set(), forced = f.has('pigeons') || f.has('pigeons-scatter') || f.has('dog-pigeons') || f.has('cat-stalk');
  const night = !forced && ctx.sun && (loc.h < ctx.sun.rise - 0.3 || loc.h > ctx.sun.set + 0.6);
  const busy = forced ? 0 : mixNow({ h: loc.h, dow: loc.dow, rain: ctx.rain || 0 }).n;
  // (a run of absent slots: if the slot before was gone, this one is too half the time; otherwise ~1 in 9 — never at night)
  const goneHere = s => !night && !forced && R('pgone', ctx.seed || 1924, s)() < 0.11;
  let gone = goneHere(j);
  if (!gone && goneHere(j - 1) && R('pgone2', ctx.seed || 1924, j)() < 0.5) gone = true;
  const n = gone ? 0 : forced ? PIGEON.max : pigeonCount({ h: loc.h, dow: loc.dow, month: loc.month, rain: ctx.rain || 0, sun: ctx.sun });
  const g = forced ? 1 : night ? 0 : groundShare({ h: loc.h, month: loc.month, rain: ctx.rain || 0, busy, sun: ctx.sun });
  const spots = ctx.spots || [], owlAt = ctx.owl ? ctx.owl(t) : null, owlSp = owlAt ? spots.find(s => s.id === owlAt) : null;
  // (the pigeons keep away from the owl: no perch within 4 units of its spot)
  const near = (a, b) => b && Math.hypot(((a.x0 ?? a.x) + (a.x1 ?? a.x)) / 2 - ((b.x0 ?? b.x) + (b.x1 ?? b.x)) / 2, a.y - b.y, a.z - b.z) < 4;
  const ledges = spots.filter(s => s.kind !== 'ground' && s.who.includes('pigeon') && !near(s, owlSp));
  const grounds = spots.filter(s => s.kind === 'ground');
  const patch = grounds.length ? grounds[Math.floor(r() * grounds.length)] : null;
  const roost = night ? ledges.filter(s => s.id === 'catwalk' || s.id === 'parapetR' || s.id === 'blade') : ledges;
  const used = new Map(), birds = [];
  for (let i = 0; i < PIGEON.max; i++) {
    if (i >= n) { birds.push({ i, spot: null, k: 0 }); continue; }
    let sp = null;
    if (patch && r() < g) sp = patch;
    else {
      // (a ledge with room: weighted toward the blade + the parapet + the billboard — the city's favourites)
      const free = roost.filter(s => (used.get(s.id) || 0) < s.cap);
      if (free.length) { const w = free.map(s => (s.id === 'blade' || s.id.startsWith('parapet') ? 2 : s.id === 'bill' || s.id === 'catwalk' ? 1.6 : 1)), tot = w.reduce((a, b) => a + b, 0); let u = r() * tot; for (let q = 0; q < free.length; q++) { u -= w[q]; if (u <= 0) { sp = free[q]; break; } } sp = sp || free[0]; }
      else sp = patch;
    }
    const k = used.get(sp.id) || 0; used.set(sp.id, k + 1);
    birds.push({ i, spot: sp.id, k, seed: Math.floor(r() * 1e6) });
  }
  return { j, n, gone, night: !!night, birds };
}
/**
 * Where pigeon i is at t (PURE, the plan only — the live manager lays the scares on top): { state: 'at' | 'fly' | 'away', spot, k,
 * seed, from / to ({ spot, k } | { off: dir }), t0, t1 (the flight), u (0..1 along it) }.
 */
export function pigeonAt(i, t, ctx = {}, cache = null) {
  const S = PIGEON.slot, j = Math.floor(t / S);
  const slot = jj => { const key = `pg|${jj}`; if (cache) { if (!cache.has(key)) { cache.set(key, pigeonSlot(jj, ctx)); if (cache.size > 24) cache.delete(cache.keys().next().value); } return cache.get(key); } return pigeonSlot(jj, ctx); };
  const a = slot(j - 1).birds[i], b = slot(j).birds[i];
  const r = R('pgmove', ctx.seed || 1924, j, i), tm = j * S + 3 + r() * PIGEON.move, dir = r() < 0.4 ? 'left' : r() < 0.66 ? 'right' : 'back';
  const same = a.spot === b.spot && a.k === b.k;
  if (same || t < tm) { const c = same ? b : a; return c.spot ? { state: 'at', spot: c.spot, k: c.k, seed: c.seed || 0 } : { state: 'away' }; }
  const dur = PIGEON.fly * (a.spot && b.spot ? 1 : 1.6), t1 = tm + dur;
  if (t >= t1) return b.spot ? { state: 'at', spot: b.spot, k: b.k, seed: b.seed || 0 } : { state: 'away' };
  return { state: 'fly', from: a.spot ? { spot: a.spot, k: a.k, seed: a.seed || 0 } : { off: dir }, to: b.spot ? { spot: b.spot, k: b.k, seed: b.seed || 0 } : { off: dir }, t0: tm, t1, u: (t - tm) / dur };
}
/** a ground pigeon's little life on its patch (PURE in t + its seed): short walks, pecking, a look round — { dx, dz (from its place),
 *  hd (heading), act ('walk' | 'peck' | 'look'), step (the stride's phase), peck (0..1 the head down) } */
export function groundLife(t, seed) {
  const SEG = 2.6, s = Math.floor((t + (seed % 997) * 0.37) / SEG), u = ((t + (seed % 997) * 0.37) / SEG) - s;
  const act = q => { const v = rngFrom(seed * 31 + q * 7919)(); return v < 0.42 ? 'walk' : v < 0.82 ? 'peck' : 'look'; };
  // the spot at the end of segment q (a walk moves it; the rest keep it), searched back a few segments
  const tgt = q => { for (let b = q; b > q - 10; b--) if (act(b) === 'walk') { const r = rngFrom(seed * 131 + b * 104729), a = r() * 2 * PI, d = Math.sqrt(r()) * 0.75; return { x: Math.cos(a) * d, z: Math.sin(a) * d * 0.6 }; } return { x: 0, z: 0 }; };
  const A = tgt(s - 1), B = tgt(s), k = act(s);
  if (k === 'walk') {
    const w = Math.min(1, u / 0.7), e = w * w * (3 - 2 * w), dx = B.x - A.x, dz = B.z - A.z;
    return { dx: A.x + dx * e, dz: A.z + dz * e, hd: Math.hypot(dx, dz) > 1e-3 ? Math.atan2(dz, dx) : 0, act: w < 1 ? 'walk' : 'look', step: (u * 6) % 1, peck: 0 };
  }
  // (still: the heading of the last walk, turned a little now + then)
  let hd = 0; for (let b = s; b > s - 10; b--) if (act(b) === 'walk') { const P = tgt(b - 1), Q = tgt(b); hd = Math.atan2(Q.z - P.z, Q.x - P.x); break; }
  hd += 0.5 * Math.sin(s * 1.7 + seed);
  const peck = k === 'peck' ? Math.max(0, Math.sin(u * PI * 6)) ** 2 : 0;
  return { dx: B.x, dz: B.z, hd, act: k, step: 0, peck };
}

// ------------------------------------------------------------------ THE GULLS (landing on the billboard + the railing, by day)
/** per slot: 0–3 landings (more on windy days; none at night), each on a free gull spot, staying `stay` s (preening, looking round,
 *  the odd call); in rain they sit huddled (puffed, the head drawn in) */
export const GULL = Object.freeze({ slot: 480, stay: [50, 220], landS: 2.6, offS: 2.2 });
export const gullSlotLen = force => (force && force.has('gulls-land') ? 90 : GULL.slot);   // (the preview: a round every 90 s)
export function gullSlot(j, ctx = {}) {
  const f = ctx.force || new Set(), S = gullSlotLen(f), t = j * S + S / 2, loc = localOf(t, ctx.off), r = R('gl', ctx.seed || 1924, loc.key, j);
  const day = f.has('gulls-land') || !ctx.sun || (loc.h > ctx.sun.rise + 0.3 && loc.h < ctx.sun.set - 0.2);
  if (!day) return [];
  const wind = ctx.wind || 3, storm = (ctx.rain || 0) > 0.5;
  const want = f.has('gulls-land') ? 3 : (r() < 0.55 ? 1 : 0) + (r() < (wind > 8 || storm ? 0.7 : 0.3) ? 1 : 0) + (wind > 10 && r() < 0.5 ? 1 : 0);
  const spots = (ctx.spots || []).filter(s => s.who.includes('gull')), out = [], used = new Map();
  for (let q = 0; q < want && spots.length; q++) {
    const sp = spots[Math.floor(r() * spots.length)], k = used.get(sp.id) || 0;
    if (k >= Math.min(2, sp.cap)) continue;
    used.set(sp.id, k + 1);
    const t0 = j * S + (f.has('gulls-land') ? 4 + q * 9 : 8 + r() * (S * 0.55)), stay = f.has('gulls-land') ? 50 + q * 8 : GULL.stay[0] + r() * (GULL.stay[1] - GULL.stay[0]);
    out.push({ id: `gull.${j}.${q}`, spot: sp.id, k: sp.cap > 1 ? (k === 0 ? 0.3 : 0.7) : 0.5, t0, t1: Math.min(t0 + stay, (j + 1) * S + 120), from: r() < 0.5 ? -1 : 1, seed: Math.floor(r() * 1e6), huddle: storm || (ctx.rain || 0) > 0.3 });
  }
  return out;
}

// ------------------------------------------------------------------ THE SNOWY OWL (winter days, Dec–Mar, uncommon)
export const OWL = Object.freeze({ months: [12, 1, 2, 3], chance: 0.28, move: [1500, 3600], glide: 6 });
/** the owl's day (PURE): { day0, t0 (glides in), t1 (glides off at dusk), stops: [{ spot, ta, tb }] } or null. Perches: the billboard's
 *  corners, the date stone's top (the speakeasy's crest), a tall lamp's top — big, white, ~10–13 pt; it relocates now and then */
export function owlDay(key, day0, ctx = {}) {
  const f = ctx.force || new Set(), r = R('owl', ctx.seed || 1924, key), month = Number(String(key).split('-')[1]);
  if (!f.has('snowy-owl') && (!OWL.months.includes(month) || r() >= OWL.chance)) return null;
  const rise = ctx.sun ? ctx.sun.rise : 7.8, set = ctx.sun ? ctx.sun.set : 17.4;
  const t0 = f.has('snowy-owl') ? day0 : day0 + (rise + 1.5 + r() * Math.max(0.5, 13.5 - rise - 1.5)) * 3600;
  const t1 = f.has('snowy-owl') ? day0 + 86400 : day0 + (set + 0.3 + r() * 0.25) * 3600;
  const ids = (ctx.spots || []).filter(s => s.who.includes('owl')).map(s => s.id);
  if (!ids.length) return null;
  const stops = []; let tt = t0, last = null;
  while (tt < t1) {
    const choices = ids.filter(id => id !== last), sp = choices[Math.floor(r() * choices.length)];
    const len = f.has('snowy-owl') ? 70 : OWL.move[0] + r() * (OWL.move[1] - OWL.move[0]);
    stops.push({ spot: sp, ta: tt + (stops.length ? OWL.glide : 0), tb: Math.min(t1, tt + len) }); last = sp; tt += len;
  }
  return { day0, t0, t1, stops };
}
/** the owl now (PURE): { state: 'at' | 'glide' | 'in' | 'out', spot / from / to, u } or null */
export function owlAt(plan, t) {
  if (!plan || t < plan.t0 - OWL.glide || t > plan.t1 + OWL.glide) return null;
  const st = plan.stops;
  if (t < plan.t0) return { state: 'in', to: st[0].spot, u: (t - plan.t0 + OWL.glide) / OWL.glide };
  if (t >= plan.t1) return { state: 'out', from: st[st.length - 1].spot, u: (t - plan.t1) / OWL.glide };
  for (let i = 0; i < st.length; i++) {
    const s = st[i];
    if (t >= s.ta && t < s.tb) return { state: 'at', spot: s.spot, since: t - s.ta };
    if (i > 0 && t >= st[i - 1].tb && t < s.ta) return { state: 'glide', from: st[i - 1].spot, to: s.spot, u: (t - st[i - 1].tb) / OWL.glide };
  }
  return { state: 'at', spot: st[st.length - 1].spot, since: 0 };
}

// ------------------------------------------------------------------ THE SQUIRREL (the big framing maple, by day)
/** per slot: comes DOWN the trunk (a spiral), hops out across the cobbles to a few spots, forages (sits up, the tail flicking), then
 *  back UP (into the leaves; in winter into its hollow). Autumn: busy dashing to and fro; winter: rare, short (a mild day). */
export const SQUIRREL = Object.freeze({ slot: 420, climb: 3.4, hop: 2.2, chance: { spring: 0.5, summer: 0.55, autumn: 0.7, winter: 0.1 } });
/** the slot (s): the preview loops every 110 s */
export const squirrelSlotLen = force => (force && force.has('squirrel') ? 110 : SQUIRREL.slot);
export function squirrelSlot(j, ctx = {}) {
  const f = ctx.force || new Set(), S = squirrelSlotLen(f), t = j * S + S / 2, loc = localOf(t, ctx.off), r = R('sq', ctx.seed || 1924, loc.key, j);
  const season = ctx.season || seasonOf(loc.month, loc.day);
  if (!f.has('squirrel')) {
    const rise = ctx.sun ? ctx.sun.rise : 7, set = ctx.sun ? ctx.sun.set : 18.5;
    if (loc.h < rise + 0.5 || loc.h > set - 0.6 || (ctx.rain || 0) > 0.3) return null;
    if (r() >= SQUIRREL.chance[season]) return null;
  }
  const t0 = j * S + (f.has('squirrel') ? 3 : 10 + r() * 90), busy = season === 'autumn', n = f.has('squirrel') ? 6 : season === 'winter' ? 1 : busy ? 3 + Math.floor(r() * 3) : 2 + Math.floor(r() * 2);
  const hops = []; let tt = t0 + SQUIRREL.climb;
  for (let q = 0; q < n; q++) {
    const a = PI * (0.55 + r() * 0.9), d = 1.4 + r() * (busy ? 3.6 : 2.6);
    hops.push({ dx: Math.cos(a) * d, dz: -Math.abs(Math.sin(a)) * d * 0.25 + (r() - 0.3) * 1.6, ta: tt, tb: tt + SQUIRREL.hop * (0.7 + d / 4), stay: busy ? 4 + r() * 9 : 9 + r() * 22 });
    tt = hops[q].tb + hops[q].stay;
  }
  const back = tt, t1 = back + SQUIRREL.hop * 1.2 + SQUIRREL.climb;
  return { id: `sq.${j}`, t0, hops, back, t1, winter: season === 'winter', seed: Math.floor(r() * 1e6) };
}

// ------------------------------------------------------------------ THE COYOTE (rare quiet nights)
/** a night's coyote (PURE): rare (any quiet night from ~10 pm, likeliest 1–4 am); only when the promenade is nearly empty (the
 *  people's own count by the clock). It trots in, stops under a lamp, turns its head to us (the eye-flash), slips off. On full-moon
 *  nights a distant howl (+ the visit's own, head up). → { t0, legs: [{ k: 'trot' | 'stop', ... }], t1, howl?, distant? } | null */
export const COYOTE = Object.freeze({ chance: 0.3, trot: 2.4, stop: [6, 10], full: 0.93 });
export function coyoteNight(key, day0, L, ctx = {}) {
  const f = ctx.force || new Set(), r = R('coy', ctx.seed || 1924, key);
  const on = r() < COYOTE.chance, full = (ctx.moon || 0) >= COYOTE.full;
  // the hour (local, after the evening's midnight): ~25 % 10 pm–1 am, ~75 % 1–4 am
  const h = r() < 0.25 ? 22 + r() * 3 : 25 + r() * 3, t0 = day0 + h * 3600;
  const distant = full ? day0 + (23 + r() * 4) * 3600 : null;
  if (!on && !f.has('coyote')) return distant ? { distant } : null;
  if (!f.has('coyote')) { const lc = localOf(t0, ctx.off); if (mixNow({ h: lc.h, dow: lc.dow }).n > 1.6) return distant ? { distant } : null; }
  return { ...coyotePath(L, t0, r), howl: full, distant };
}
/** the coyote's route from t0: in from the right edge across the promenade, a stop under the left tall lamp, on over the road to the
 *  waterside sidewalk and off behind the speakeasy (or the reverse) */
export function coyotePath(L, t0, r = Math.random) {
  const cam = L.cam, lamp = (L.lamps || []).filter(l => l.kind === 'tall').sort((a, b) => a.x - b.x)[0] || { x: 0, z: 52.6 };
  const rev = r() < 0.4, z1 = 46.5 + r() * 2, edge = { x: cam.hw(z1) + 2.5, z: z1 }, stop = { x: lamp.x + 0.9, z: lamp.z - 1.25 };
  const curb = { x: stop.x - 1.6, z: FOLK.roadZ + 0.2 }, far = { x: stop.x - 2.6, z: FOLK.farZ - 0.1 }, gone = { x: L.speakeasy.x1 - 4, z: FOLK.farZ - 0.1 };
  const pts1 = rev ? [gone, far, curb, stop] : [edge, stop], pts2 = rev ? [stop, edge] : [stop, curb, far, gone];
  const len = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z); return s; };
  const v = COYOTE.trot, d1 = len(pts1) / v, st = COYOTE.stop[0] + r() * (COYOTE.stop[1] - COYOTE.stop[0]), d2 = len(pts2) / (v * 1.15);
  return { t0, legs: [{ k: 'trot', pts: pts1, t0, t1: t0 + d1, v }, { k: 'stop', x: stop.x, z: stop.z, t0: t0 + d1, t1: t0 + d1 + st, hd: rev ? 0 : PI }, { k: 'trot', pts: pts2, t0: t0 + d1 + st, t1: t0 + d1 + st + d2, v: v * 1.15 }], t1: t0 + d1 + st + d2 };
}
/** a planned path's state at t (PURE): { x, z, hd, moving, v, dist, leg } | null */
export function pathAt(plan, t) {
  if (!plan || !plan.legs || t < plan.t0 || t >= plan.t1) return null;
  let dist = 0;
  for (const lg of plan.legs) {
    if (lg.k === 'trot' || lg.k === 'walk') {
      const L = polyLen(lg.pts);
      if (t < lg.t1) { const d = (t - lg.t0) / (lg.t1 - lg.t0) * L, p = polyAt(lg.pts, d); return { x: p.x, z: p.z, hd: p.hd, moving: true, v: L / (lg.t1 - lg.t0), dist: dist + d, leg: lg }; }
      dist += L;
    } else if (t < lg.t1) return { x: lg.x, z: lg.z, hd: lg.hd, moving: false, v: 0, dist, leg: lg, since: t - lg.t0, left: lg.t1 - t };
  }
  return null;
}
export const polyLen = p => { let s = 0; for (let i = 1; i < p.length; i++) s += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z); return s; };
export function polyAt(p, d) {
  let c = 0;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i], l = Math.hypot(b.x - a.x, b.z - a.z);
    if (d <= c + l || i === p.length - 1) { const u = l ? clamp01((d - c) / l) : 1; return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, hd: Math.atan2(b.z - a.z, b.x - a.x) }; }
    c += l;
  }
  const e = p[p.length - 1]; return { x: e.x, z: e.z, hd: 0 };
}
/** THE TRACKS IN FRESH SNOW (Part 9's hook: ctx.snow): the prints the coyote left along its path up to t, each fading over `fade` s */
export function coyoteTracks(plan, t, fade = 1500) {
  if (!plan || !plan.legs || t < plan.t0) return [];
  const out = [], step = 0.55;
  for (const lg of plan.legs) {
    if (lg.k !== 'trot') continue;
    const L = polyLen(lg.pts), n = Math.floor(L / step);
    for (let q = 0; q <= n; q++) {
      const tt = lg.t0 + (q * step / L) * (lg.t1 - lg.t0);
      if (tt > t) break;
      const p = polyAt(lg.pts, q * step), side = q % 2 ? 1 : -1;
      out.push({ x: p.x - Math.sin(p.hd) * 0.09 * side, z: p.z + Math.cos(p.hd) * 0.09 * side, hd: p.hd, a: clamp01(1 - (t - tt) / fade) });
    }
  }
  return out.filter(p => p.a > 0.02);
}

// ------------------------------------------------------------------ THE SPEAKEASY CAT, OUTSIDE (some evenings)
/** an evening's outing (PURE): ~35 % of warm evenings (winter ~12 %) between dusk and 11 pm, 6–16 minutes on the barbershop's outside
 *  window SILL or the side door's step; never while the window moment shows the cat inside (ctx.catInside(a, b)); now + then it stalks
 *  a pigeon on the cobbles (stalk: a moment it may go, if one is near — the live manager decides). → { t0, ta, tb, t1, spot, stalk } */
export const CAT = Object.freeze({ chance: 0.35, winter: 0.12, len: [360, 960], walk: 0.9 });
export function catEvening(key, day0, L, ctx = {}) {
  const f = ctx.force || new Set(), r = R('cat', ctx.seed || 1924, key), month = Number(String(key).split('-')[1]);
  const forced = f.has('cat-out') || f.has('cat-stalk');
  if (!forced && r() >= (month >= 11 || month <= 3 ? CAT.winter : CAT.chance)) return null;
  const set = ctx.sun ? ctx.sun.set : 18.5, a = Math.max(18, set - 0.4), t0 = forced ? null : day0 + (a + r() * Math.max(0.3, 22.6 - a)) * 3600;
  const len = CAT.len[0] + r() * (CAT.len[1] - CAT.len[0]), spot = r() < 0.65 ? 'sill' : 'step';
  if (forced) return { forced: true, spot, len, seed: Math.floor(r() * 1e6) };
  const p = catPath(L, t0, len, spot);
  if (ctx.catInside && ctx.catInside(p.t0, p.t1)) return null;
  return { ...p, stalk: r() < 0.5 ? p.ta + 60 + r() * Math.max(10, len - 160) : null };
}
export function catSpot(L, spot) {
  const s = L.speakeasy;
  return spot === 'sill' ? { x: s.x0 + (s.shop.win[0] + 1.25), y: s.shop.win[2] + 0.02, z: s.z0 - 0.16, hd: -PI / 2 } : { x: s.x0 + s.door.u1 + 0.32, y: 0.26, z: s.z0 - 0.32, hd: -PI / 2 + 0.4 };
}
export function catPath(L, t0, len, spot) {
  const cam = L.cam, sp = catSpot(L, spot), z = L.speakeasy.z0 - 0.75, edge = { x: -cam.hw(z) - 1, z }, below = { x: sp.x + 0.35, z };
  const d = Math.hypot(below.x - edge.x, below.z - edge.z) / CAT.walk, ta = t0 + d + 1.2, tb = ta + len, t1 = tb + 1.2 + d;
  return { t0, ta, tb, t1, spot, legs: [{ k: 'walk', pts: [edge, below], t0, t1: t0 + d, v: CAT.walk }, { k: 'stop', x: sp.x, z: sp.z, t0: t0 + d, t1: tb + 1.2, hd: sp.hd }, { k: 'walk', pts: [below, edge], t0: tb + 1.2, t1, v: CAT.walk }] };
}

// ------------------------------------------------------------------ FIREFLIES (summer nights)
export const FIREFLY = Object.freeze({ n: 24, tier: [10, 16, 24], from: 21.2, to: 24.6 });
/** how many fireflies now (PURE): Jun 10 – Aug 31, after dark (21:15 → 00:35), no rain, a light wind; 0 otherwise */
export function fireflyCount({ h = 22, month = 7, day = 15, rain = 0, wind = 2, dark = 1, force = false } = {}) {
  if (force) return FIREFLY.n;
  const md = month * 100 + day, hh = h < 12 ? h + 24 : h;
  if (md < 610 || md > 831 || rain > 0.1 || wind > 7 || dark < 0.55 || hh < FIREFLY.from || hh > FIREFLY.to) return 0;
  const edge = Math.min(1, (hh - FIREFLY.from) / 0.5, (FIREFLY.to - hh) / 0.6);
  return Math.round(FIREFLY.n * clamp01(edge) * (wind > 4 ? 0.6 : 1));
}
/** firefly q's place + its light at t (PURE): homes round the trees' feet + the bench; a slow drift, a glow every few seconds */
export function fireflyAt(q, t, homes) {
  const r = rngFrom(hashString(`ff|${q}`)), h = homes[q % homes.length], ph = r() * 100, w = 0.1 + r() * 0.12;
  const x = h.x + Math.sin(t * w + ph) * 1.6 + Math.sin(t * w * 2.3 + ph * 2) * 0.5, z = h.z + Math.sin(t * w * 0.7 + ph * 3) * 1.0;
  const y = 0.5 + r() * 1.6 + Math.sin(t * w * 1.6 + ph) * 0.35;
  const per = 3.2 + r() * 3.4, u = ((t + ph * 7) / per) % 1, dbl = r() < 0.3;
  const flash = u < 0.08 ? u / 0.08 : u < 0.42 ? Math.exp(-(u - 0.08) * 6.5) : dbl && u > 0.4 && u < 0.62 ? Math.max(0, Math.sin((u - 0.4) / 0.22 * PI)) * 0.7 : 0;
  return { x, y, z, k: flash };
}

// ------------------------------------------------------------------ THE HERON (on its piling at dawn)
/** a morning's heron (PURE): April–October on ~45 % of mornings — it glides in round the sunrise, stands on its piling 25–70 min (a
 *  big still shape against the bright water, the neck shifting, a strike at the water now + then), then flies off low over the water */
export const HERON = Object.freeze({ months: [4, 5, 6, 7, 8, 9, 10], chance: 0.45, glide: 7, stay: [1500, 4200] });
export function heronMorning(key, day0, ctx = {}) {
  const f = ctx.force || new Set(), r = R('her', ctx.seed || 1924, key), month = Number(String(key).split('-')[1]);
  if (f.has('heron')) return null;              // (the preview loops: heronForced)
  if (!HERON.months.includes(month) || r() >= HERON.chance) return null;
  const rise = ctx.sun ? ctx.sun.rise : 7, ta = day0 + (rise - 0.45 + r() * 0.5) * 3600, tb = ta + HERON.stay[0] + r() * (HERON.stay[1] - HERON.stay[0]);
  const strikes = []; for (let tt = ta + 200 + r() * 300; tt < tb - 60; tt += 300 + r() * 600) strikes.push(tt);
  return { ta, tb, t0: ta - HERON.glide, t1: tb + HERON.glide, from: r() < 0.5 ? -1 : 1, to: r() < 0.5 ? -1 : 1, strikes };
}
/** the preview: a heron every 80 s — in (7 s), standing ~60 s with a strike at 34 s, off (7 s) */
export function heronForced(t) { const n = Math.floor(t / 80), t0 = n * 80; return { ta: t0 + HERON.glide, tb: t0 + 70, t0, t1: t0 + 70 + HERON.glide, from: n % 2 ? 1 : -1, to: n % 2 ? -1 : 1, strikes: [t0 + 41] }; }

// ------------------------------------------------------------------ FISH JUMPING (ripple rings in the near water)
export const FISH = Object.freeze({ slot: 45, band: [66, 104], f: [0.4, 0.8] });
/** the jump in slot j (PURE): { t0, x, z, big } | null — likeliest at dawn + dusk, a few by day, rare at night */
/** the slot (s): the preview jumps every 9 s */
export const fishSlotLen = force => (force && force.has('fish') ? 9 : FISH.slot);
export function fishSlot(j, L, ctx = {}) {
  const f = ctx.force || new Set(), S = fishSlotLen(f), t = j * S + S / 2, loc = localOf(t, ctx.off), r = R('fish', ctx.seed || 1924, j);
  const rise = ctx.sun ? ctx.sun.rise : 7, set = ctx.sun ? ctx.sun.set : 18.5;
  const near = (a, b) => Math.abs(loc.h - a) < b;
  const p = f.has('fish') ? 1 : near(rise + 0.5, 1.4) || near(set, 1.2) ? 0.6 : loc.h > rise && loc.h < set ? 0.28 : 0.07;
  if (r() >= p || (ctx.rain || 0) > 0.6) return null;
  const z = FISH.band[0] + r() * (FISH.band[1] - FISH.band[0]), fx = FISH.f[0] + r() * (FISH.f[1] - FISH.f[0]);
  return { t0: j * S + (f.has('fish') ? 2 : r() * (S - 6)), x: xOfF(L.cam, fx, z), z, big: r() < 0.25, dir: r() < 0.5 ? -1 : 1 };
}
