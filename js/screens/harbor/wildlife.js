// CITY 2.0 — THE HARBOR, PART 8b1 (Group 2): THE WILDLIFE, live — the plan (core/harbor-wildlife.js: who is where by the clock, every
// phone the same, joined mid-way) + the REACTIONS (the people walking close: the pigeons burst up, some to a ledge, some away for
// minutes and back from another side; the squirrel dashes up its tree; the coyote + the raccoon bolt; a dog lunges at the flock; the
// cat stalks a pigeon) + the passes the scene draws them in, each where it really stands (the painters: fauna.js):
//   'water'  the heron on its mooring piling + the fish jumping (before the road layer: the railing stands in front of them)
//   'far'    → items() into the people's far pass (sorted by depth with them): gulls on the waterside railing, the ducks on the road,
//            the coyote on the waterside sidewalk
//   'bill'   after the roof billboard: the birds on its top edge + its catwalk's railing (pigeons, gulls, the snowy owl)
//   'near'   → items() into the people's near pass: the pigeons on the cobbles + the lamps' arms, every bird in flight, the cat, the
//            coyote, the squirrel on the cobbles, the ducks on the curb
//   'front'  after the people: the trash can + the raccoon (nearer than anyone on the floor)
//   'high'   after the café lights: the birds on the speakeasy (the blade's top, the parapet, the date stone, the canopy's posts)
//   'top'    after the front row + the leaves: the squirrel on the big maple's trunk, the fireflies
// HOOKS: scare(x, z, r) + startle() (Group 3's witnesses: the pigeons burst up), crossBlocked(a, b) (the people wait for the ducks),
// dogLunge(vid) (people.js: a dog lunging at the flock), canState() (the trash can's lid), busy() (60 fps while anything flies),
// budget(k) (THE DIRECTOR — a big sky moment thins the new arrivals), positions of the people in: frame({ people }).
import { project } from '../../core/harbor-layout.js';
import { rngFrom, hashString } from '../../core/rng.js';
import { FOLK } from '../../core/harbor-people.js';
import { sunTimes } from '../../core/sky.js';
import { lightField, lightSources, sunShadow } from '../../core/harbor-light.js';
import { hourPlan } from '../../core/harbor-moments.js';
import { safeCtx } from '../../ui/canvas-safe.js';
import {
  localOf, wildSpots, spotPoint, offPoint, canSpot, pilingSpot, PIGEON, pigeonAt, groundLife, GULL, gullSlot, gullSlotLen, OWL, owlDay, owlAt,
  SQUIRREL, squirrelSlot, squirrelSlotLen, fishSlotLen, coyoteNight, coyotePath, pathAt, coyoteTracks, raccoonNight, raccoonPath, canAt, catEvening, catPath, catSpot,
  fireflyCount, fireflyAt, FIREFLY, heronMorning, heronForced, HERON, FISH, fishSlot, duckDay, duckPlan, ducksBlock, SIZE,
} from '../../core/harbor-wildlife.js';
import { drawBird, drawDuck, drawOwl, drawHeron, drawQuad, drawTrashCan, drawPiling, drawJump, drawFirefly, fireflySprite } from './fauna.js';

const TAU = Math.PI * 2, PI = Math.PI;
const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = u => { const x = clamp01(u); return x * x * (3 - 2 * x); };
const lerp = (a, b, u) => a + (b - a) * u;
const hash = (...k) => rngFrom(hashString(k.join('|')));
/** the forced previews (THE PREVIEW PANEL's WILDLIFE rows + &force=…) */
export const WILD_FORCES = ['pigeons', 'pigeons-scatter', 'dog-pigeons', 'cat-out', 'cat-stalk', 'gulls-land', 'squirrel', 'snowy-owl', 'coyote', 'raccoon', 'fireflies', 'heron', 'fish', 'ducks'];

export function createWildlife() {
  let L = null, spots = [], byId = new Map(), can = null, piling = null, maple = null, cache = new Map(), budgetK = 1;
  let ctx = null, t = 0, frameT = 0, forceKey = '', lastT = null, people = [], force = new Set(), tier = 2, motion = true, season = 'autumn';
  let sunKey = '', sun = { rise: 7.2, set: 18.6 }, catWinKey = '', catWin = null;
  const pig = Array.from({ length: PIGEON.max }, (_, i) => ({ i, ov: null, now: null, flushes: 0, hold: 0 }));
  const gullOv = new Map(), lunges = new Map(), bolts = { coyote: null, raccoon: null, squirrel: null };
  let catOv = null, catStalkDone = -1, sqHide = -1, sqId = null, lastFlutter = -1e9, nextCoo = 0, nextCall = 0, sounds = [];
  let scareQ = [], ffSprite = null, now = { birds: [], gulls: [], owl: null, sq: null, coyote: null, raccoon: null, cat: null, ducks: [], fish: [], heron: null, ff: [], can: null };

  function layout(l) {
    L = l; spots = wildSpots(L); byId = new Map(spots.map(s => [s.id, s])); can = canSpot(L); piling = pilingSpot(L);
    maple = (L.trees || []).filter(tr => tr.kind === 'maple').sort((a, b) => b.x - a.x)[0] || null;
    cache.clear(); for (const b of pig) { b.ov = null; b.now = null; }
  }
  const since = new Map();
  /** a forced loop of period P: { n (the round), base (its start, the city clock), s0 (when the row came on) } */
  const fbase = (id, P, tt = t) => { const s0 = since.has(id) ? since.get(id) : 0, n = Math.floor((tt - s0) / P); return { n, base: s0 + n * P, s0 }; };
  /** a plan's times moved by d (s) — every time field the planners make */
  const shiftPlan = (o, d) => {
    if (!o || !d) return o;
    if (Array.isArray(o)) return o.map(v => (typeof v === 'number' ? v + d : shiftPlan(v, d)));
    if (typeof o !== 'object') return o;
    const out = {};
    for (const [k, v] of Object.entries(o)) out[k] = typeof v === 'number' && ['t0', 't1', 'ta', 'tb', 'tTip', 'back', 'tw', 'stalk'].includes(k) ? v + d : k === 'onX' || k === 'strikes' ? v.map(x => x + d) : v && typeof v === 'object' && k !== 'pts' ? shiftPlan(v, d) : v;
    return out;
  };
  const get = (key, make) => { if (!cache.has(key)) { cache.set(key, make()); if (cache.size > 80) cache.delete(cache.keys().next().value); } return cache.get(key); };
  /** a bird's place on spot sp (its k-th slot), world */
  const placeOf = (id, k, seed) => { const sp = byId.get(id); return sp ? spotPoint(sp, k, seed) : null; };

  // ---------------------------------------------------------------- the frame: the plan + the reactions
  /**
   * frame(f): once a frame. f = { ms (the city clock), off (minutes from UTC), tz, lat, lon, season, month, rain, snow, wind, moon (illum
   * 0..1), force (Set), tier, motion, people: [{ x, z, v, kind, vid, role }] (people.js#positions), dark (the lamps' ramp), catInside?
   * (a, b) → bool, windowDark? ([duskH, dawnH] — the window life's, for the outside cat's rule), truck? (a, b) → bool (Group 1's trash
   * truck), lidFixedAt? (tTip → t) }
   */
  function frame(f) {
    if (!L) return;
    t = f.ms / 1000; force = f.force || new Set();
    { const fk = `${[...force].filter(x => WILD_FORCES.includes(x)).sort().join(',')}|${(f.rain || 0) > 0.3 ? 1 : 0}|${f.season || ''}`; if (fk !== forceKey) { forceKey = fk; cache.clear(); } } tier = f.tier == null ? 2 : f.tier; motion = f.motion !== false; season = f.season || 'autumn';
    people = f.people || []; frameT = f.t == null ? performance.now() / 1000 : f.t;
    // THE PREVIEWS start AT ONCE: each forced loop counts from the moment its row was switched on (2 s ago) — not from the epoch
    for (const id of WILD_FORCES) { if (force.has(id)) { if (!since.has(id)) since.set(id, t - 2); } else since.delete(id); }
    // the sun's times today (local hours) — once a day
    const lc = localOf(t, f.off);
    if (lc.key !== sunKey && f.tz && f.lat != null) {
      sunKey = lc.key;
      try { const st = sunTimes(f.ms, f.tz, f.lat, f.lon), hr = ms => ((((ms + (f.off || 0) * 60000) / 3.6e6) % 24) + 24) % 24; if (st.rise && st.set) sun = { rise: hr(st.rise), set: hr(st.set) }; } catch { /* keep the last */ }
    }
    ctx = { off: f.off || 0, seed: f.seed || 1924, spots, sun, rain: f.rain || 0, wind: f.wind || 3, force, season, moon: f.moon || 0, lidFixedAt: f.lidFixedAt || null,
      catInside: (a, b) => catInsideFn(a, b, f) };
    ctx.owl = tt => { const d = owlDayAt(tt); const o = owlAt(d, tt); return o ? o.spot || o.to || o.from : null; };
    lastT = t;
    stepPigeons();
    now.gulls = gullsNow();
    now.owl = owlNow();
    now.sq = squirrelNow();
    now.coyote = coyoteNow(f);
    now.raccoon = raccoonNow(f);
    now.can = canNow(f);
    now.cat = catNow();
    now.ducks = ducksNow();
    now.fish = fishNow();
    now.heron = heronNow();
    now.ff = firefliesNow(f);
    scareQ = [];
  }

  // ---------------------------------------------------------------- THE PIGEONS
  const peopleNear = (x, z, r) => { let best = null, bd = r; for (const p of people) { if (p.role === 'dog') continue; const d = Math.hypot(p.x - x, (p.z - z) * 1.1); if (d < bd) { bd = d; best = p; } } return best ? { p: best, d: bd } : null; };
  const dogsNear = (x, z, r) => people.filter(p => p.role === 'dog' && Math.hypot(p.x - x, p.z - z) < r);
  /** the spot occupancy (live): ids → count */
  const occupancy = () => { const m = new Map(); for (const b of pig) { const id = b.ov && b.ov.kind === 'at' ? b.ov.spot : b.ov ? (b.ov.to && b.ov.to.spot) : b.plan && b.plan.state === 'at' ? b.plan.spot : null; if (id) m.set(id, (m.get(id) || 0) + 1); } return m; };
  /** a flight between two world points (u 0..1 → { x, y, z, hd, pitch }); via: a roof perch is reached ABOVE the parapet (never behind it) */
  function flightAt(fl, u) {
    const A = fl.a, Bp = fl.b, e = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u);
    const hi = Math.max(A.y, Bp.y) + 0.9 + 0.12 * Math.hypot(Bp.x - A.x, Bp.z - A.z);
    const roof = (Bp.z > 47 && Bp.y > 9) || (A.z > 47 && A.y > 9);
    const c1 = { x: lerp(A.x, Bp.x, 0.25), y: roof ? Math.max(hi, 13.2) : hi, z: roof ? Math.min(A.z, 43.4) : lerp(A.z, Bp.z, 0.25) };
    const c2 = { x: lerp(A.x, Bp.x, 0.75), y: roof ? Math.max(hi, 13.2) : hi * 0.85 + Bp.y * 0.15, z: roof ? Math.max(Bp.z - 1, 44) : lerp(A.z, Bp.z, 0.75) };
    const bz = (p0, p1, p2, p3, s) => { const v = 1 - s; return v * v * v * p0 + 3 * v * v * s * p1 + 3 * v * s * s * p2 + s * s * s * p3; };
    const p = k => ({ x: bz(A.x, c1.x, c2.x, Bp.x, k), y: bz(A.y, c1.y, c2.y, Bp.y, k), z: bz(A.z, c1.z, c2.z, Bp.z, k) });
    const P0 = p(e), P1 = p(Math.min(1, e + 0.02)), P2 = p(Math.max(0, e - 0.02)), dx = P1.x - P2.x, dz = P1.z - P2.z, dy = P1.y - P2.y;
    const hd = Math.hypot(dx, dz) > 1e-4 ? Math.atan2(dz, dx) : (Bp.x >= A.x ? 0 : PI);
    return { ...P0, hd, pitch: Math.max(-0.5, Math.min(0.7, Math.atan2(dy, Math.hypot(dx, dz) + 1e-4))) };
  }
  const posOfPlan = (st, b) => {
    if (st.state === 'at') { const p = placeOf(st.spot, st.k, st.seed); return p ? { ...p, spot: st.spot, seed: st.seed } : null; }
    return null;
  };
  /** flush a bird from where it is (src: the scare's source) — some to a free ledge nearby, some off screen for minutes */
  function flush(b, src, delay = 0) {
    const cur = b.now; if (!cur || cur.air || b.ov && b.ov.kind === 'fly') return false;
    const r = hash('flush', b.i, b.flushes++, Math.floor(t / 600)), from = { x: cur.x, y: cur.y, z: cur.z };
    const t0 = t + delay;
    const occ0 = occupancy(), free0 = spots.filter(s => s.kind !== 'ground' && s.who.includes('pigeon') && (occ0.get(s.id) || 0) < s.cap && !owlNear(s));
    if (r() < PIGEON.awayP || !free0.length) {
      const dir = src && src.x > cur.x ? 'left' : src ? 'right' : r() < 0.5 ? 'left' : 'right', to = offPoint(L, r() < 0.25 ? 'back' : dir, from);
      b.ov = { kind: 'fly', a: from, b: to, t0, t1: t0 + 2.4 + r() * 0.8, off: dir, then: { kind: 'away', until: t0 + PIGEON.away[0] + r() * (PIGEON.away[1] - PIGEON.away[0]) * (force.has('pigeons-scatter') ? 0.12 : 1), back: dir === 'left' ? 'right' : 'left' } };
    } else {
      const occ = occ0, free = free0;
      const sp = free.sort((a, c) => Math.hypot((a.x0 + a.x1) / 2 - from.x, a.z - from.z) - Math.hypot((c.x0 + c.x1) / 2 - from.x, c.z - from.z))[Math.floor(r() * Math.min(3, free.length))];
      const k = occ.get(sp.id) || 0, to = spotPoint(sp, Math.min(k, sp.cap - 1), b.i);
      b.ov = { kind: 'fly', a: from, b: to, t0, t1: t0 + 1.5 + 0.18 * Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) / 2, to: { spot: sp.id, k }, then: { kind: 'at', spot: sp.id, k, until: t0 + PIGEON.highStay[0] + r() * (PIGEON.highStay[1] - PIGEON.highStay[0]) } };
    }
    b.ov.flush = true;
    return true;
  }
  const owlNear = s => { const o = now.owl; if (!o || o.state !== 'at') return false; const op = byId.get(o.spot); return op && Math.hypot((s.x0 + s.x1) / 2 - (op.x0 + op.x1) / 2, s.y - op.y, s.z - op.z) < 4; };
  /** scare everything within r of (x, z) (r: world units; z null: any depth) — the API's + the cat's pounce + the dog's lunge */
  function scareAt(x, z, r, src) {
    let n = 0;
    for (const b of pig) if (b.now && !b.now.air && Math.hypot(b.now.x - x, z == null ? 0 : b.now.z - z) < r) { if (flush(b, src || { x, z }, n * 0.05 + Math.random() * 0.25)) n++; }
    return n;
  }
  let scatterN = -1;
  function stepPigeons() {
    const pctx = ctx, tierCap = force.has('pigeons') ? PIGEON.max : PIGEON.tier[tier] * budgetK;   // (the preview: the whole flock at any tier)
    for (const b of pig) {
      b.plan = pigeonAt(b.i, t, pctx, cache);
      // the live override: a flight in progress → its landing; a stay on a ledge → back to the plan; away → back from another side
      if (b.ov) {
        const o = b.ov;
        if (o.kind === 'fly' && t >= o.t1) { b.ov = o.then && o.then.kind === 'at' ? { ...o.then } : o.then && o.then.kind === 'away' ? { ...o.then } : null; }
        else if (o.kind === 'at' && t >= o.until) {
          const st = b.plan, here = placeOf(o.spot, o.k, b.i);
          if (st.state === 'at' && st.spot !== o.spot && here) { const to = posOfPlan(st, b); if (to && !(byId.get(st.spot).kind === 'ground' && peopleNear(to.x, to.z, 2.4))) b.ov = { kind: 'fly', a: here, b: to, t0: t, t1: t + 2.2, then: null }; else o.until = t + 20; }
          else if (st.state !== 'at' && here) { const dir = hash('lv', b.i, Math.floor(t / 60))() < 0.5 ? 'left' : 'right'; b.ov = { kind: 'fly', a: here, b: offPoint(L, dir, here), t0: t, t1: t + 2.6, then: null }; }
          else b.ov = null;
        } else if (o.kind === 'away' && t >= o.until) {
          // (back from ANOTHER direction to another perch — never the same patch it left from when people are still there)
          const st = b.plan;
          if (st.state !== 'at') { b.ov = null; }
          else {
            let to = posOfPlan(st, b), tgt = { spot: st.spot, k: st.k };
            if (!to || (byId.get(st.spot).kind === 'ground' && peopleNear(to.x, to.z, 2.6))) { const occ = occupancy(), alt = spots.find(s => s.kind !== 'ground' && s.who.includes('pigeon') && (occ.get(s.id) || 0) < s.cap); if (alt) { tgt = { spot: alt.id, k: occ.get(alt.id) || 0 }; to = spotPoint(alt, tgt.k, b.i); } }
            if (to) { const a = offPoint(L, o.back || 'right', to); b.ov = { kind: 'fly', a, b: to, t0: t, t1: t + 2.8, then: tgt.spot !== st.spot ? { kind: 'at', spot: tgt.spot, k: tgt.k, until: t + 2.8 + 60 } : null }; }
            else b.ov = null;
          }
        }
      }
      // where it is now (+ how it looks)
      b.now = birdState(b);
      if (b.i >= tierCap && b.now) b.now.hide = true;
    }
    // THE SCARES: a person walking close (on foot, near a bird on the ground — not always all together), a dog's lunge, the API's
    if (motion) for (const b of pig) {
      const n = b.now; if (!n || n.air || n.spotKind !== 'ground' || b.ov && b.ov.kind === 'fly') continue;
      const r = 1.35 + 0.7 * hash('sr', b.i)();
      const near = peopleNear(n.x, n.z, r);
      if (near && (near.p.v > 0.1 || near.d < r * 0.65)) {
        if (flush(b, near.p, Math.random() * 0.2)) {
          // (its neighbours go too — most of them, staggered: not always together)
          for (const o of pig) if (o !== b && o.now && !o.now.air && o.now.spotKind === 'ground' && Math.hypot(o.now.x - n.x, o.now.z - n.z) < 2.6 && Math.random() < 0.72) flush(o, near.p, 0.08 + Math.random() * 0.5);
          flutter(n.x, 1);
        }
      }
      // A DOG now + then lunges at the flock: the flock bursts, its owner's leash goes taut (people.js reads dogLunge)
      for (const d of dogsNear(n.x, n.z, 2.8)) {
        if (lunges.has(d.vid)) continue;
        const yes = force.has('dog-pigeons') || hash('lunge', d.vid)() < 0.5;
        lunges.set(d.vid, yes ? { t0: t, x: n.x } : { t0: -1 });
        if (yes) { sounds.push({ slot: 'dog-bark', x: d.x, gain: 0.5 }); scareAt(n.x, n.z, 3.2, d); flutter(n.x, 1.2); }
      }
    }
    for (const q of scareQ) { const k = q.all ? scareAt(0, null, 1e9, null) : scareAt(q.x, q.z, q.r, { x: q.x, z: q.z }); if (k) flutter(q.x, 1.2); }
    if (lunges.size > 30) for (const [k, v] of lunges) if (t - v.t0 > 120 || v.t0 < 0 && lunges.size > 30) lunges.delete(k);
    // THE PREVIEW: &force=pigeons-scatter — a walker's scare every 25 s at the flock on the cobbles
    const sk = force.has('pigeons-scatter') ? Math.floor((t - fbase('pigeons-scatter', 25).s0 - 6) / 25) : -1;   // (6 s after the row comes on, then every 25 s)
    if (sk >= 0 && sk !== scatterN) { scatterN = sk; const g = pig.find(b => b.now && b.now.spotKind === 'ground'); if (g) { scareAt(g.now.x, g.now.z, 3, { x: g.now.x + 2, z: g.now.z }); flutter(g.now.x, 1.2); } }
  }
  function flutter(x, k) { if (t - lastFlutter < 1.2) return; lastFlutter = t; sounds.push({ slot: 'pigeon-flutter', x, gain: 0.55 * k }); }
  /** a bird's state now → { x, y, z, hd, pose, air, flap, spread, legs, pitch, turn, step, peck, spotKind, seed, layer } */
  function birdState(b) {
    const o = b.ov, seed = b.i * 977 + 13;
    const fly = fl => { const u = clamp01((t - fl.t0) / (fl.t1 - fl.t0)); if (t < fl.t0) return null; const p = flightAt(fl, u);
      const land = !fl.off && !(fl.then && fl.then.kind === 'away') ? smooth((u - 0.78) / 0.22) : 0;
      return { ...p, pose: 'fly', air: true, flap: frameT * TAU * (u < 0.25 ? 7.5 : u > 0.8 ? 5.5 : 5) + b.i, spread: 1, legs: land, pitch: land ? 0.5 * land : p.pitch, seed, spotKind: 'air', u }; };
    if (o && o.kind === 'fly') { const s = fly(o); if (s) return s; if (b.now) return b.now; }
    if (o && o.kind === 'away') return null;
    let st = o && o.kind === 'at' ? { state: 'at', spot: o.spot, k: o.k, seed: b.i } : b.plan;
    if (st.state === 'fly') {
      const a = st.from.off ? offPoint(L, st.from.off, placeOf(st.to.spot, st.to.k, st.to.seed)) : placeOf(st.from.spot, st.from.k, st.from.seed);
      const bb = st.to.off ? offPoint(L, st.to.off, a) : placeOf(st.to.spot, st.to.k, st.to.seed);
      if (!a || !bb) return null;
      return fly({ a, b: bb, t0: st.t0, t1: st.t1, off: st.to.off || null, then: st.to.off ? { kind: 'away' } : null });
    }
    if (st.state !== 'at') return null;
    const sp = byId.get(st.spot); if (!sp) return null;
    const p = spotPoint(sp, st.k, st.seed);
    if (sp.kind === 'ground') {
      const g = motion ? groundLife(t, seed + (st.seed || 0)) : { dx: 0, dz: 0, hd: -PI / 2, act: 'look', step: 0, peck: 0 };
      return { x: p.x + g.dx, y: 0, z: p.z + g.dz, hd: g.hd, pose: g.act === 'walk' ? 'walk' : g.act === 'peck' ? 'peck' : 'look', step: g.step, peck: g.peck, turn: g.act === 'look' ? 0.5 * Math.sin(t * 0.7 + seed) : 0, spotKind: 'ground', spot: sp.id, seed: seed + 3 };
    }
    // on a ledge: facing mostly toward us (profiles + 3/4 too), a slow look round, a shuffle; asleep at night, huddled in rain
    const r = hash('ledge', b.i, st.spot, st.k)(), night = b.plan && pigeonNight();
    const hd = -PI / 2 + (r - 0.5) * 2.2 + (motion ? 0.25 * Math.sin(t * 0.05 + seed) : 0);
    return { x: p.x + (motion ? 0.04 * Math.sin(t * 0.13 + seed) : 0), y: p.y, z: p.z, hd, pose: night ? 'sleep' : ctx.rain > 0.3 ? 'huddle' : 'stand', turn: motion ? 0.7 * Math.sin(t * 0.4 + seed * 1.3) * (Math.sin(t * 0.11 + seed) > 0 ? 1 : 0.2) : 0, spotKind: sp.kind, spot: sp.id, seed: seed + 3 };
  }
  const pigeonNight = () => { const h = localOf(t, ctx.off).h; return h < sun.rise - 0.3 || h > sun.set + 0.6; };

  // ---------------------------------------------------------------- THE GULLS (landing on the billboard + the railing)
  function gullsNow() {
    const S = gullSlotLen(force), F = force.has('gulls-land'), fb = F ? fbase('gulls-land', S) : null, j = F ? fb.n : Math.floor(t / S), out = [];
    for (const jj of [j - 1, j]) for (const g of get(`gl|${jj}|${F ? 1 : 0}|${(ctx.wind > 8) ? 1 : 0}|${ctx.rain > 0.3 ? 1 : 0}`, () => (F ? shiftPlan(gullSlot(jj, ctx), fb.s0) : gullSlot(jj, ctx)))) {
      const ov = gullOv.get(g.id), t1 = ov != null ? Math.min(g.t1, ov) : g.t1;
      if (t < g.t0 - GULL.landS || t > t1 + GULL.offS) continue;
      const sp = byId.get(g.spot); if (!sp) continue;
      const P = { x: lerp(sp.x0, sp.x1, g.k), y: sp.y, z: sp.z };
      const r = rngFrom(g.seed), side = g.from;
      // (a person close to a railing gull: it takes off early)
      if (sp.id.startsWith('rail') && t > g.t0 && t < t1 && peopleNear(P.x, P.z, 1.3)) gullOv.set(g.id, t);
      let st;
      if (t < g.t0) {
        // THE LANDING: a glide in from the side over the harbor, braking flaps, the legs down, a hop on the touchdown
        const u = (t - g.t0 + GULL.landS) / GULL.landS, A = { x: P.x + side * 9, y: P.y + 4.2, z: P.z + 6 }, e = 1 - (1 - u) * (1 - u);
        const x = lerp(A.x, P.x, e), y = lerp(A.y, P.y, e) + Math.sin(u * PI) * 0.5, z = lerp(A.z, P.z, e);
        const brake = smooth((u - 0.55) / 0.45);
        st = { x, y, z, hd: Math.atan2(P.z - A.z, P.x - A.x), pose: 'land', flap: brake > 0.1 ? frameT * TAU * 3.2 : 0.35, spread: 1, legs: brake, pitch: 0.1 + 0.6 * brake, air: true };
      } else if (t < t1) {
        const since = t - g.t0, hop = since < 0.45 ? Math.sin(since / 0.45 * PI) * 0.12 : 0, fold = since < 0.8 ? 1 - since / 0.8 : 0;
        const hd = -PI / 2 + side * (0.9 + 0.5 * Math.sin(g.seed)), pre = Math.sin(t * 0.21 + g.seed) > 0.85;
        st = fold > 0.05 ? { x: P.x, y: P.y + hop, z: P.z, hd, pose: 'land', flap: 0.9, spread: fold, legs: 1, pitch: 0.35 * fold, air: true } :
          { x: P.x, y: P.y, z: P.z, hd: hd + 0.15 * Math.sin(t * 0.07 + g.seed), pose: g.huddle ? 'huddle' : pre ? 'preen' : 'stand', turn: pre ? 1.4 : 0.9 * Math.sin(t * 0.33 + g.seed * 2) * (Math.sin(t * 0.09 + g.seed) > 0 ? 1 : 0.15), peck: 0, air: false };
        if (st.pose === 'preen') { st.pose = 'peck'; st.peck = 0.35 + 0.15 * Math.sin(t * 4); st.turn = 2.4; }
        if (!st.air && motion && t > nextCall && r() < 1 && Math.sin(t * 0.17 + g.seed) > 0.995) { nextCall = t + 20; sounds.push({ slot: 'gulls', x: P.x, gain: 0.5 }); }
      } else {
        // THE TAKE-OFF: a crouch, a jump, hard beats, away over the harbor
        const u = (t - t1) / GULL.offS, e = u * u, B = { x: P.x - side * 7, y: P.y + 5, z: P.z + 9 };
        st = { x: lerp(P.x, B.x, e), y: lerp(P.y, B.y, e) + (u < 0.12 ? -0.05 : 0), z: lerp(P.z, B.z, e), hd: Math.atan2(B.z - P.z, B.x - P.x), pose: 'takeoff', flap: frameT * TAU * 3.6, spread: smooth(u / 0.2), legs: 1 - smooth(u / 0.3), pitch: 0.3, air: true };
      }
      out.push({ ...st, kind: 'gull', seed: g.seed, spot: sp.id, id: g.id });
    }
    return out;
  }

  // ---------------------------------------------------------------- THE SNOWY OWL
  function owlDayAt(tt) { const lc = localOf(tt, ctx.off); return get(`owl|${lc.key}|${force.has('snowy-owl') ? 1 : 0}`, () => owlDay(lc.key, lc.day0, ctx)); }
  function owlNow() {
    const o = owlAt(owlDayAt(t), t); if (!o) return null;
    const pt = id => { const sp = byId.get(id); return sp ? { x: (sp.x0 + sp.x1) / 2, y: sp.y, z: sp.z } : null; };
    const seed = 41, h = localOf(t, ctx.off).h, dusk = clamp01((h - (sun.set - 0.7)) / 0.6) * clamp01((sun.set + 0.6 - h) / 0.3);
    if (o.state === 'at') {
      const P = pt(o.spot); if (!P) return null;
      // slow head turns (a new target every 7–15 s, eased over 2.4 s), a blink every few seconds
      const seg = Math.floor(t / 11), u = (t / 11) - seg, tg = q => (hash('ot', q)() - 0.5) * 2.6, turn = lerp(tg(seg - 1), tg(seg), smooth(u / 0.22));
      const bl = ((t + 3) % 5.3) < 0.16 ? 1 : 0;
      return { ...P, state: 'at', spot: o.spot, turn: motion ? turn : 0, blink: bl, eyes: dusk, hd: -PI / 2 + 0.25 * Math.sin(seed) };
    }
    const A = o.state === 'in' ? { ...pt(o.to), y: pt(o.to).y + 6, x: pt(o.to).x + 10 } : pt(o.from), Bq = o.state === 'out' ? { ...A, y: A.y + 5, x: A.x - 12, z: A.z + 10 } : pt(o.to);
    if (!A || !Bq) return null;
    const u = smooth(o.u), p = { x: lerp(A.x, Bq.x, u), y: lerp(A.y, Bq.y, u) + Math.sin(o.u * PI) * 0.8, z: lerp(A.z, Bq.z, u) };
    const land = o.state !== 'out' ? smooth((o.u - 0.75) / 0.25) : 0;
    return { ...p, state: 'glide', fly: 1 - land * 0.6, flap: o.u > 0.8 ? frameT * 6 : 0.2, hd: Math.atan2(Bq.z - A.z, Bq.x - A.x), eyes: dusk };
  }

  // ---------------------------------------------------------------- THE SQUIRREL (the big framing maple)
  function squirrelNow() {
    if (!maple) return null;
    const S = squirrelSlotLen(force), F = force.has('squirrel'), fb = F ? fbase('squirrel', S) : null, j = F ? fb.n : Math.floor(t / S);
    for (const jj of [j, j - 1]) {
      const s = get(`sq|${jj}|${F ? 1 : 0}|${season}|${ctx.rain > 0.3 ? 1 : 0}`, () => (F ? shiftPlan(squirrelSlot(jj, { ...ctx, season }), fb.s0 - 0) : squirrelSlot(jj, { ...ctx, season })));
      if (!s || t < s.t0 || t > s.t1 + 0.5) continue;
      sqId = s.id;
      if (sqHide === s.id) return null;
      const st = squirrelState(s);
      // (someone walking up to it on the cobbles: the dash to the trunk + the spiral climb, a chatter from up in the tree)
      if (st && !st.onTree && motion && !(bolts.squirrel && bolts.squirrel.id === s.id) && peopleNear(st.x, st.z, 3.2)) { bolts.squirrel = { id: s.id, t0: t, x: st.x, z: st.z }; sounds.push({ slot: 'squirrel-chatter', x: st.x, gain: 0.4 }); return squirrelState(s); }
      return st;
    }
    return null;
  }
  function squirrelState(s) {
    const tr = maple, trunkR = 0.24, top = s.winter ? 1.7 : tr.trunk * 0.95, base = { x: tr.x, z: tr.z - trunkR - 0.05 };
    const climb = (u, down) => { const th = (down ? 1 - u : u) * 2.4 * PI, y = (down ? 1 - u : u) * top; return { x: tr.x + Math.cos(th) * trunkR * 1.4, y, z: tr.z - Math.abs(Math.sin(th)) * trunkR - 0.15, hd: th + PI / 2, pose: 'climb', dir: down ? -1 : 1, onTree: true, a: clamp01((top - y) / (top * 0.25)) * (s.winter && !down ? clamp01((top - y) / 0.25) : 1) }; };
    // the bolt (live): a person within reach → a dash to the trunk + a fast climb; hidden for the rest of the session
    if (bolts.squirrel && bolts.squirrel.id === s.id) {
      const bo = bolts.squirrel, d = Math.hypot(base.x - bo.x, base.z - bo.z), tDash = d / 4.2, el = t - bo.t0;
      if (el < tDash) { const u = el / tDash; return { x: lerp(bo.x, base.x, u), y: Math.abs(Math.sin(u * PI * 4)) * 0.1, z: lerp(bo.z, base.z, u), hd: Math.atan2(base.z - bo.z, base.x - bo.x), pose: 'trot', gait: el * 3, moving: 1, a: 1 }; }
      const u = (el - tDash) / 1.5; if (u >= 1) { sqHide = s.id; return null; }
      return climb(u, false);
    }
    if (t < s.t0 + SQUIRREL.climb) return climb((t - s.t0) / SQUIRREL.climb, true);
    let cur = { x: base.x, z: base.z };
    for (const h of s.hops) {
      const to = { x: base.x + h.dx, z: base.z + h.dz };
      if (t < h.ta) return { ...cur, y: 0, hd: Math.atan2(to.z - cur.z, to.x - cur.x), pose: 'sitUp', tailFlick: Math.sin(t * 9) * 0.6, a: 1 };
      if (t < h.tb) { const u = (t - h.ta) / (h.tb - h.ta), nb = Math.max(2, Math.round(Math.hypot(to.x - cur.x, to.z - cur.z) / 0.5)); return { x: lerp(cur.x, to.x, u), y: Math.abs(Math.sin(u * PI * nb)) * 0.16, z: lerp(cur.z, to.z, u), hd: Math.atan2(to.z - cur.z, to.x - cur.x), pose: 'trot', gait: u * nb, moving: 1, a: 1 }; }
      if (t < h.tb + h.stay) { const el = t - h.tb, sit = Math.floor(el / 3.5) % 2 === 0; return { ...to, y: 0, hd: -PI / 2 + Math.sin(h.ta) * 1.4, pose: sit ? 'sitUp' : 'stand', turn: sit ? 0.5 * Math.sin(t * 1.3) : 0, tailFlick: Math.sin(t * 7 + h.ta) > 0.7 ? Math.sin(t * 30) * 0.8 : 0, a: 1 }; }
      cur = to;
    }
    if (t < s.back + SQUIRREL.hop * 1.2) { const u = (t - s.back) / (SQUIRREL.hop * 1.2); return { x: lerp(cur.x, base.x, u), y: Math.abs(Math.sin(u * PI * 4)) * 0.16, z: lerp(cur.z, base.z, u), hd: Math.atan2(base.z - cur.z, base.x - cur.x), pose: 'trot', gait: u * 4, moving: 1, a: 1 }; }
    return climb(clamp01((t - s.back - SQUIRREL.hop * 1.2) / SQUIRREL.climb), false);
  }

  // ---------------------------------------------------------------- THE COYOTE + THE RACCOON + THE CAN
  const nightKeyOf = tt => { const lc = localOf(tt, ctx.off); return lc.h < 12 ? localOf(tt - 43200, ctx.off) : lc; };
  function coyotePlan() {
    if (force.has('coyote')) { const { n, base } = fbase('coyote', 70); return get(`coyF|${n}`, () => ({ ...coyotePath(L, base + 1, rngFrom(n + 3)), howl: n % 3 === 1 })); }
    const ev = nightKeyOf(t); return get(`coy|${ev.key}|${ctx.moon >= 0.93 ? 1 : 0}`, () => coyoteNight(ev.key, ev.day0, L, ctx));
  }
  function coyoteNow(f) {
    const plan = coyotePlan(); if (!plan) return null;
    if (plan.distant && t > plan.distant && t - plan.distant < 1 && coyoteNow.howled !== plan.distant) { coyoteNow.howled = plan.distant; sounds.push({ slot: 'coyote-howl', x: 0, gain: 0.45 }); }
    if (!plan.legs) return null;
    let st = pathAt(plan, t);
    const bo = bolts.coyote && bolts.coyote.t0 >= plan.t0 && bolts.coyote.t0 <= plan.t1 ? bolts.coyote : null;
    if (bo) { const el = t - bo.t0, d = Math.hypot(bo.to.x - bo.x, bo.to.z - bo.z), u = el * 6 / Math.max(0.1, d); if (u >= 1) return null; st = { x: lerp(bo.x, bo.to.x, u), z: lerp(bo.z, bo.to.z, u), hd: Math.atan2(bo.to.z - bo.z, bo.to.x - bo.x), moving: true, v: 6, dist: el * 6 }; }
    else if (st && motion && !force.has('coyote')) {   // (the preview: it never bolts — the owner wants to see it)
      // (it slinks away fast if someone appears)
      const near = peopleNear(st.x, st.z, 6.5);
      if (near) { const to = st.x > 0 ? { x: L.cam.hw(st.z) + 3, z: st.z } : { x: L.speakeasy.x1 - 4, z: FOLK.farZ - 0.1 }; bolts.coyote = { t0: t, x: st.x, z: st.z, to }; }
    }
    if (!st) return null;
    const out = { kind: 'coyote', x: st.x, y: 0, z: st.z, hd: st.hd, pose: st.moving ? 'trot' : 'stand', gait: (st.dist || 0) / 1.5, moving: st.moving ? 1 : 0 };
    if (!st.moving && st.since != null) {
      // the stop under the lamp: the head turns to us (the eye-flash in the lamplight), back; on a full moon the howl, the head up
      const k = smooth((st.since - 1.0) / 1.2) * smooth((st.left - 0.6) / 1.0), toUs = -PI / 2 - st.hd;
      out.turn = ((toUs + 3 * PI) % TAU - PI) * k;
      const lt = f.dark > 0.3 ? 1 : 0;
      out.eyes = lt * k * (0.75 + 0.25 * Math.sin(frameT * 2.2));
      if (plan.howl) { const hk = smooth((st.since - 3.2) / 0.6) * smooth((st.left - 1.2) / 0.6); out.headUp = hk; if (hk > 0.5 && coyoteNow.howl !== plan.t0) { coyoteNow.howl = plan.t0; sounds.push({ slot: 'coyote-howl', x: st.x, gain: 0.55 }); } }
      else if (st.since > 2 && coyoteNow.yip !== plan.t0 && hash('yip', plan.t0)() < 0.35) { coyoteNow.yip = plan.t0; sounds.push({ slot: 'coyote-yip', x: st.x, gain: 0.4 }); }
    }
    out.tracks = (f.snow || 0) > 0.3 ? coyoteTracks(plan, t) : null;
    return out;
  }
  function raccoonPlan(ev) { if (force.has('raccoon')) return null; return get(`rac|${ev.key}`, () => raccoonNight(ev.key, ev.day0, L, ctx)); }
  function raccoonForcedPlan() { const { n, base } = fbase('raccoon', 95); return get(`racF|${n}`, () => raccoonPath(L, base + 1, rngFrom(n + 11))); }
  function raccoonNow(f) {
    const plan = force.has('raccoon') ? raccoonForcedPlan() : raccoonPlan(nightKeyOf(t)); if (!plan) return null;
    let st = pathAt(plan, t); if (!st) return null;
    const bo = bolts.raccoon && bolts.raccoon.t0 >= plan.t0 && bolts.raccoon.t0 <= plan.t1 ? bolts.raccoon : null;
    if (bo) { const el = t - bo.t0, ex = { x: -L.cam.hw(st.z) - 1.5, z: st.z }, d = Math.hypot(ex.x - bo.x, ex.z - bo.z), u = el * 4.5 / Math.max(0.1, d); if (u >= 1) return null; return { kind: 'raccoon', x: lerp(bo.x, ex.x, u), y: 0, z: bo.z, hd: PI, pose: 'trot', gait: el * 4.5 / 0.9, moving: 1 }; }
    if (motion && !force.has('raccoon') && (peopleNear(st.x, st.z, 3.6) || (f.truck && f.truck(t - 2, t + 6)))) { bolts.raccoon = { t0: t, x: st.x, z: st.z }; }
    if (st.moving) return { kind: 'raccoon', x: st.x, y: 0, z: st.z, hd: st.hd, pose: 'trot', gait: st.dist / 0.75, moving: 0.75 };
    // at the can: up on its hind legs, the paws on the rim → the lid off (the clang) → rummaging (the head in, popping up now + then)
    if (t < plan.tTip) return { kind: 'raccoon', x: st.x, y: 0, z: st.z, hd: 0, pose: 'rear', turn: t < plan.tTip - 1 ? -0.8 * smooth((t - plan.ta) / 1.2) : 0 };
    if (raccoonNow.clang !== plan.tTip) { raccoonNow.clang = plan.tTip; sounds.push({ slot: 'trash-can-lid', x: st.x, gain: 0.7 }); }
    const u = (t - plan.tTip) % 7, up = u > 5.2;
    return { kind: 'raccoon', x: st.x + 0.08, y: 0, z: st.z, hd: 0, pose: up ? 'rear' : 'rummage', turn: up ? -1.1 * Math.sin((u - 5.2) / 1.8 * PI) : 0 };
  }
  function canNow(f) {
    const plans = ev => (force.has('raccoon') ? null : raccoonPlan(ev));
    let st = canAt(t, L, ctx, plans);
    if (force.has('raccoon')) { const p = raccoonForcedPlan(); st = t >= p.tTip && t < p.t1 + 20 ? { lid: t < p.tb ? 'off' : 'askew', since: p.tTip } : { lid: 'on', since: null }; }
    const held = f.canHeld ? f.canHeld(t) : null;
    return { ...can, lid: st.lid, held };
  }

  // ---------------------------------------------------------------- THE SPEAKEASY CAT, OUTSIDE
  function catInsideFn(a, b, f) {
    // the window moment "THE CAT ON THE SILL" (core/harbor-moments.js) in any hour block that touches [a, b]: the same plan the
    // speakeasy's window life builds (its dusk / dawn from f.windowDark), so the two cats are never out at once
    const dark = f.windowDark || [19, 7], seen = [];
    for (let tt = a - 3600; tt <= b + 3600; tt += 3600) {
      const lc = localOf(tt, ctx.off), hr = Math.floor(lc.h), key = `${lc.key.split('-').map((v, i) => (i ? String(v).padStart(2, '0') : v)).join('-')}`;
      const plan = get(`win|${key}|${hr}|${lc.dow}|${dark.join(',')}`, () => hourPlan(key, hr, { dow: lc.dow, month: lc.month, dark }));
      for (const e of plan) if (e.id === 'cat') seen.push([lc.day0 + e.t0 - 30, lc.day0 + e.t0 + e.len + 30]);
    }
    return seen.some(([x, y]) => b > x && a < y);
  }
  function catPlan() {
    if (force.has('cat-out') || force.has('cat-stalk')) { const { n, base } = fbase(force.has('cat-stalk') ? 'cat-stalk' : 'cat-out', 200); return get(`catF|${n}`, () => ({ ...catPath(L, base + 1, 160, n % 2 ? 'step' : 'sill'), stalk: force.has('cat-stalk') ? base + 24 : null })); }
    const ev = nightKeyOf(t), lc = localOf(t, ctx.off);
    const day = lc.h < 12 ? ev : lc;
    return get(`cat|${day.key}`, () => catEvening(day.key, day.day0, L, ctx));
  }
  function catNow() {
    const plan = catPlan(); if (!plan || !plan.legs) return null;
    if (t < plan.t0 || t > plan.t1) { catOv = null; return null; }
    const sp = catSpot(L, plan.spot), below = plan.legs[0].pts[1];
    // THE STALK (live): drop down, creep low toward the nearest pigeon on the cobbles, a wiggle, the pounce (the flock bursts), a sit
    // + a lick, back to its place
    if (plan.stalk && t >= plan.stalk && catStalkDone !== plan.stalk && !catOv) {
      const g = pig.map(b => b.now).filter(n => n && n.spotKind === 'ground').sort((a, b) => Math.hypot(a.x - below.x, a.z - below.z) - Math.hypot(b.x - below.x, b.z - below.z))[0];
      catStalkDone = plan.stalk;
      if (g && Math.hypot(g.x - below.x, g.z - below.z) < 11) { const d = Math.hypot(g.x - below.x, g.z - below.z), hd = Math.atan2(g.z - below.z, g.x - below.x), stop = { x: g.x - Math.cos(hd) * 1.9, z: g.z - Math.sin(hd) * 1.9 };
        catOv = { t0: t, hd, from: { ...below }, stop, tCreep: Math.max(2, (d - 1.9) / 0.5), target: { x: g.x, z: g.z } }; }
    }
    if (catOv) {
      const o = catOv, el = t - o.t0, hop = 0.5;
      if (el < hop) return { kind: 'cat', x: sp.x, y: sp.y * (1 - smooth(el / hop)) + Math.sin(el / hop * PI) * 0.2, z: lerp(sp.z, o.from.z, el / hop), hd: o.hd, pose: 'stand' };
      const e2 = el - hop;
      if (e2 < o.tCreep) { const u = e2 / o.tCreep; return { kind: 'cat', x: lerp(o.from.x, o.stop.x, u), y: 0, z: lerp(o.from.z, o.stop.z, u), hd: o.hd, pose: 'crouch', gait: e2 * 0.9, moving: 0.6 }; }
      const e3 = e2 - o.tCreep;
      if (e3 < 1.3) return { kind: 'cat', x: o.stop.x, y: 0, z: o.stop.z, hd: o.hd, pose: 'crouch', tailFlick: Math.sin(t * 14) * 0.7 };
      const e4 = e3 - 1.3, land = { x: o.stop.x + Math.cos(o.hd) * 1.5, z: o.stop.z + Math.sin(o.hd) * 1.5 };
      if (e4 < 0.36) { if (!o.pounced) { o.pounced = true; scareAt(o.target.x, o.target.z, 3.4, { x: o.stop.x, z: o.stop.z }); flutter(o.target.x, 1.3); } const u = e4 / 0.36; return { kind: 'cat', x: lerp(o.stop.x, land.x, u), y: Math.sin(u * PI) * 0.45, z: lerp(o.stop.z, land.z, u), hd: o.hd, pose: 'pounce', gait: u, moving: 1 }; }
      const e5 = e4 - 0.36;
      if (e5 < 6.5) return { kind: 'cat', x: land.x, y: 0, z: land.z, hd: -PI / 2 + 0.3, pose: e5 > 2.5 ? 'lick' : 'sit', turn: e5 > 2.5 ? 0.3 : 0 };
      const back = Math.hypot(below.x - land.x, below.z - land.z) / 0.9, e6 = e5 - 6.5;
      if (e6 < back) { const u = e6 / back; return { kind: 'cat', x: lerp(land.x, below.x, u), y: 0, z: lerp(land.z, below.z, u), hd: Math.atan2(below.z - land.z, below.x - land.x), pose: 'trot', gait: e6 * 1.2, moving: 0.7 }; }
      if (e6 < back + 0.5) { const u = (e6 - back) / 0.5; return { kind: 'cat', x: lerp(below.x, sp.x, u), y: sp.y * smooth(u) + Math.sin(u * PI) * 0.25, z: lerp(below.z, sp.z, u), hd: -PI / 2, pose: 'stand' }; }
      catOv = null;
    }
    const st = pathAt(plan, t); if (!st) return null;
    if (st.moving) return { kind: 'cat', x: st.x, y: 0, z: st.z, hd: st.hd, pose: 'trot', gait: st.dist / 0.55, moving: 0.7 };
    // the stop: a hop up onto the sill / the step, sitting (the tail flicking, a lick now + then, looking round), a hop down at the end
    const since = st.since || 0, left = st.left || 0;
    if (since < 0.6) { const u = since / 0.6; return { kind: 'cat', x: lerp(below.x, sp.x, u), y: sp.y * smooth(u) + Math.sin(u * PI) * 0.25, z: lerp(below.z, sp.z, u), hd: -PI / 2, pose: 'stand' }; }
    if (left < 0.6) { const u = 1 - left / 0.6; return { kind: 'cat', x: lerp(sp.x, below.x, u), y: sp.y * (1 - smooth(u)) + Math.sin(u * PI) * 0.25, z: lerp(sp.z, below.z, u), hd: PI, pose: 'stand' }; }
    if (catNow.meow !== plan.t0 && since > 4) { catNow.meow = plan.t0; if (hash('meow', plan.t0)() < 0.5) sounds.push({ slot: 'cat-meow', x: sp.x, gain: 0.45 }); }
    const lick = Math.sin(t * 0.13 + plan.t0) > 0.86;
    return { kind: 'cat', x: sp.x, y: sp.y, z: sp.z, hd: sp.hd + 0.25 * Math.sin(t * 0.05), pose: lick ? 'lick' : 'sit', turn: lick ? 0.3 : 0.9 * Math.sin(t * 0.27 + plan.t0) * (Math.sin(t * 0.08) > 0 ? 1 : 0.2), tailFlick: Math.sin(t * 2.1) * 0.5 };
  }

  // ---------------------------------------------------------------- THE DUCKS · THE FISH · THE HERON · THE FIREFLIES
  function duckPlanNow() {
    if (force.has('ducks')) return duckRound(t);
    const lc = localOf(t, ctx.off); return get(`duck|${lc.key}`, () => duckDay(lc.key, lc.day0, L, ctx));
  }
  /** the preview's round at tt: three mallards every 90 s from the row's start (the WALK they wait for is the real one) */
  function duckRound(tt) { const { n, base } = fbase('ducks', 90, tt); return get(`duckF|${n}`, () => duckPlan(L, base - 18, 3, rngFrom(n + 7))); }   // (joined part-way: already waddling along the waterside sidewalk)
  function ducksNow() {
    const plan = duckPlanNow(); if (!plan || t < plan.t0 || t > plan.t1) return [];
    if (plan.tw <= t && ducksNow.quack !== plan.tw) { ducksNow.quack = plan.tw; sounds.push({ slot: 'duck-quack', x: 0, gain: 0.5 }); }
    return plan.ducks.map(d => { const st = pathAt({ legs: d.legs, t0: d.t0, t1: d.t1 }, t); return st ? { x: st.x, z: st.z, hd: st.hd, step: st.dist / 0.24, moving: true, drake: d.drake } : null; }).filter(Boolean);
  }
  function fishNow() {
    const S = fishSlotLen(force), j = Math.floor(t / S), out = [];
    for (const jj of [j - 1, j]) { const f = get(`fish|${jj}|${force.has('fish') ? 1 : 0}`, () => fishSlot(jj, L, ctx)); if (f && t >= f.t0 && t < f.t0 + 4.2) out.push({ ...f, t: t - f.t0, water: -1.2 }); }
    return out;
  }
  function heronPlan() {
    if (force.has('heron')) { const s0 = fbase('heron', 80).s0; return shiftPlan(heronForced(t - s0), s0); }
    const lc = localOf(t, ctx.off); return get(`her|${lc.key}`, () => heronMorning(lc.key, lc.day0, ctx));
  }
  function heronNow() {
    const p = heronPlan(); if (!p || t < p.t0 || t > p.t1) return null;
    const top = { x: piling.x, y: piling.y + 0.08, z: piling.z };
    if (t < p.ta) {
      const u = (t - p.t0) / HERON.glide, A = { x: top.x + p.from * 14, y: top.y + 3, z: top.z + 8 }, e = 1 - (1 - u) ** 2;
      const land = smooth((u - 0.7) / 0.3);
      if (land > 0.92) return { ...top, hd: -PI / 2 + 0.6 * p.from, pose: 'stand' };
      return { x: lerp(A.x, top.x, e), y: lerp(A.y, top.y, e) + Math.sin(u * PI) * 0.6, z: lerp(A.z, top.z, e), hd: Math.atan2(top.z - A.z, top.x - A.x), pose: 'fly', flap: frameT * TAU * (land > 0.1 ? 1.6 : 0.9), spread: 1 };
    }
    if (t > p.tb) {
      const u = (t - p.tb) / HERON.glide, B = { x: top.x + p.to * 16, y: top.y + 1.2, z: top.z + 10 }, e = u * u;
      return { x: lerp(top.x, B.x, e), y: lerp(top.y, B.y, e) + Math.sin(u * PI) * 0.4, z: lerp(top.z, B.z, e), hd: Math.atan2(B.z - top.z, B.x - top.x), pose: 'fly', flap: frameT * TAU * 1.1, spread: smooth(u / 0.25) };
    }
    let strike = 0;
    for (const s of p.strikes) { const e = t - s; if (e > 0 && e < 1.5) strike = e < 0.2 ? e / 0.2 : e < 0.7 ? 1 : 1 - (e - 0.7) / 0.8; }
    return { ...top, hd: -PI / 2 + 0.6 * p.from + 0.15 * Math.sin(t * 0.02), pose: 'stand', strike, t };
  }
  function firefliesNow(f) {
    const lc = localOf(t, ctx.off), n = Math.min(FIREFLY.tier[tier], fireflyCount({ h: lc.h, month: lc.month, day: lc.day, rain: ctx.rain, wind: ctx.wind, dark: f.dark || 0, force: force.has('fireflies') }));
    if (!n) return [];
    const homes = [...(L.trees || []).map(tr => ({ x: tr.x, z: tr.z - 0.6 })), { x: L.bench.x, z: L.bench.z - 1 }, { x: L.medallion.x, z: L.medallion.z }];
    const out = []; for (let q = 0; q < n; q++) out.push(fireflyAt(q, motion ? t : 0, homes));
    return out;
  }

  // ---------------------------------------------------------------- DRAWING
  let lightKey = '', lightFn = null, srcs = null, pileKey = '', pileCv = null, pileBox = null;
  function envOf(env) {
    const dark = clamp01(env.dark || 0), k = Math.round(dark * 20) / 20, key = String(k);
    if (key !== lightKey) { lightKey = key; lightFn = k > 0.01 ? lightField(L, { lamps: k }) : null; }
    if (!srcs) srcs = lightSources(L);
    const rimSide = (x, z) => { let best = 0, side = 1; for (const s of srcs) { const d = Math.hypot(x - s.x, (z - s.z) * 1.15), w = s.k / (0.6 + d * d); if (w > best) { best = w; side = s.x >= x ? 1 : -1; } } return side; };
    return { T: env.T || { day: 1 }, dark, lightAt: lightFn, rimSide, shadow: h => sunShadow(env.T || {}, h), t: frameT, mo: motion, tier: env.tier == null ? tier : env.tier };
  }
  const drawOne = (c, it, E) => {
    const cam = L.cam;
    if (it.kind === 'pigeon' || it.kind === 'gull') drawBird(c, cam, it, E);
    else if (it.kind === 'owl') drawOwl(c, cam, it, E);
    else if (it.kind === 'duck') drawDuck(c, cam, it, E);
    else drawQuad(c, cam, it, E);
  };
  /** what goes into the people's 'far' / 'near' pass this frame: [{ z, draw(c) }] — sorted by depth with them (people.js) */
  function items(pass, env) {
    if (!L) return [];
    const E = envOf(env), out = [], add = it => out.push({ z: it.z, draw: c => drawOne(c, it, E) });
    if (pass === 'far') {
      for (const g of now.gulls) if (g.spot.startsWith('rail') && !g.air) add(g);
      for (const d of now.ducks) if (d.z > FOLK.roadZ - 0.2) add({ ...d, kind: 'duck', moving: true });
      if (now.coyote && now.coyote.z > FOLK.roadZ) add(now.coyote);
      if (now.coyote && now.coyote.tracks) out.push({ z: 99, draw: c => tracks(c, now.coyote.tracks, E, true) });
    } else if (pass === 'near') {
      for (const b of pig) { const n = b.now; if (!n || n.hide) continue; if (n.air || n.spotKind === 'ground' || (n.spot || '').startsWith('lamp')) add({ ...n, kind: 'pigeon' }); }
      for (const g of now.gulls) if (g.air) add(g);
      if (now.owl && now.owl.state === 'glide') add({ ...now.owl, kind: 'owl' });
      for (const d of now.ducks) if (d.z <= FOLK.roadZ - 0.2) add({ ...d, kind: 'duck' });
      if (now.coyote && now.coyote.z <= FOLK.roadZ) add(now.coyote);
      if (now.cat) add(now.cat);
      if (now.sq && !now.sq.onTree) add({ ...now.sq, kind: 'squirrel' });
      if (now.coyote && now.coyote.tracks) out.push({ z: 99, draw: c => tracks(c, now.coyote.tracks, E, false) });
    }
    return out;
  }
  function tracks(c, pts, E, far) {
    const cam = L.cam; c.fillStyle = 'rgba(60,64,90,0.5)';
    for (const p of pts) { if ((p.z > FOLK.roadZ) !== far) continue; const [x, y] = project(cam, p.x, 0, p.z), s = cam.F / p.z; c.globalAlpha = p.a * 0.8; c.beginPath(); c.ellipse(x, y, Math.max(0.5, 0.07 * s), Math.max(0.3, 0.035 * s), 0, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
  }
  /** draw(c, pass, env): 'water' | 'bill' | 'front' | 'high' | 'top' (+ 'far' / 'near' on their own when the people aren't drawn) */
  function draw(c, pass, env) {
    if (!L) return;
    const E = envOf(env), cam = L.cam, fade = env.fade == null ? 1 : env.fade;
    c.save(); c.globalAlpha = fade;
    if (pass === 'water') {
      // (the piling never moves: painted once into a sprite per look — re-painted when the light changes a step)
      const T = E.T || {}, key = `${cam.W}x${cam.H}|${[T.day, T.gold, T.night, T.ovc, E.dark].map(v => Math.round((v || 0) * 20)).join(',')}`;
      if (key !== pileKey) {
        pileKey = key; const s = cam.F / piling.z, [px, py] = project(cam, piling.x, piling.y, piling.z), [, wy] = project(cam, piling.x, piling.water, piling.z);
        const dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1), bx = Math.floor(px - piling.r * s * 1.6), by = Math.floor(py - 0.4 * s), bw = Math.ceil(piling.r * s * 3.2), bh = Math.ceil(wy - by + (wy - py) * 0.6 + 2);
        pileCv = pileCv || document.createElement('canvas'); pileCv.width = Math.max(1, Math.ceil(bw * dpr)); pileCv.height = Math.max(1, Math.ceil(bh * dpr));
        const x = safeCtx(pileCv); if (x) { x.setTransform(dpr, 0, 0, dpr, -bx * dpr, -by * dpr); drawPiling(x, cam, piling, E); }
        pileBox = { x: bx, y: by, w: bw, h: bh };
      }
      if (pileCv && pileBox) c.drawImage(pileCv, pileBox.x, pileBox.y, pileBox.w, pileBox.h);
      for (const j of now.fish) drawJump(c, cam, j, E);
      if (now.heron) drawHeron(c, cam, now.heron, E);
    } else if (pass === 'bill') {
      for (const b of pig) { const n = b.now; if (n && !n.hide && !n.air && (n.spot === 'bill' || n.spot === 'catwalk')) drawBird(c, cam, { ...n, kind: 'pigeon' }, E); }
      for (const g of now.gulls) if (!g.air && (g.spot === 'bill' || g.spot === 'catwalk')) drawBird(c, cam, g, E);
      if (now.owl && now.owl.state === 'at' && now.owl.spot.startsWith('bill')) drawOwl(c, cam, now.owl, E);
    } else if (pass === 'high') {
      for (const b of pig) { const n = b.now; if (n && !n.hide && !n.air && (n.spot === 'blade' || (n.spot || '').startsWith('parapet') || (n.spot || '').startsWith('post'))) drawBird(c, cam, { ...n, kind: 'pigeon' }, E); }
      if (now.owl && now.owl.state === 'at' && !now.owl.spot.startsWith('bill')) drawOwl(c, cam, now.owl, E);
    } else if (pass === 'front') {
      if (now.raccoon) drawQuad(c, cam, now.raccoon, E);
      const cn = now.can; if (cn) drawTrashCan(c, cam, cn.held ? { ...cn, ...cn.held } : cn, E);
    } else if (pass === 'top') {
      if (season === 'winter' && maple) hollow(c, E);
      if (now.sq && now.sq.onTree) drawQuad(c, cam, { ...now.sq, kind: 'squirrel', pose: 'climb' }, E);
      if (now.ff.length) { ffSprite = ffSprite || fireflySprite(); c.save(); c.globalCompositeOperation = 'lighter'; for (const p of now.ff) { const [x, y] = project(cam, p.x, p.y, p.z); drawFirefly(c, x, y, p.k * fade, cam.F / p.z, ffSprite); } c.restore(); }
    } else for (const it of items(pass, env)) it.draw(c);
    c.restore();
  }
  /** the squirrel's winter hollow: a dark knot-hole in the big maple's trunk */
  function hollow(c, E) {
    const cam = L.cam, [x, y] = project(cam, maple.x + 0.1, 1.7, maple.z - 0.22), s = cam.F / maple.z;
    c.fillStyle = 'rgba(14,10,10,0.85)'; c.beginPath(); c.ellipse(x, y, 0.09 * s, 0.13 * s, 0, 0, TAU); c.fill();
    c.strokeStyle = E.dark > 0.5 ? 'rgba(60,48,40,0.6)' : 'rgba(120,96,70,0.7)'; c.lineWidth = Math.max(0.4, 0.025 * s); c.beginPath(); c.ellipse(x, y, 0.11 * s, 0.15 * s, 0, 0, TAU); c.stroke();
  }

  // ---------------------------------------------------------------- THE SOUNDS (through their slots — silent while empty)
  function tick(env) {
    const snd = env && env.snd; const q = sounds; sounds = [];
    if (!snd || !snd.play || !motion || !L) return;
    const pan = x => Math.max(-0.9, Math.min(0.9, (project(L.cam, x, 0, 46)[0] / L.cam.W) * 2 - 1));
    for (const s of q) snd.play(s.slot, { pan: pan(s.x), gain: s.gain });
    // the coos: pigeons on the cobbles / a ledge by day, now and then, quiet
    const any = pig.some(b => b.now && !b.now.air && b.now.pose !== 'sleep');
    if (any && t > nextCoo) { if (nextCoo) snd.play('pigeon-coo', { pan: pan(pig.find(b => b.now)?.now.x || 0), gain: 0.32 }); nextCoo = t + 22 + Math.random() * 40; }
    if (now.sq && now.sq.onTree && tick.sq !== now.sq.y > 1 && now.sq.y > 1) { snd.play('squirrel-chatter', { pan: pan(maple.x), gain: 0.35 }); }
    tick.sq = !!(now.sq && now.sq.onTree && now.sq.y > 1);
  }

  return {
    layout, frame, items, draw, tick,
    /** Group 3 — THE WITNESSES: scare everything within r of (x, z) / everything at once */
    scare(x, z, r = 4) { scareQ.push({ x, z, r }); if (now.sq) bolts.squirrel = bolts.squirrel || { id: lastSq(), t0: t, x: now.sq.x, z: now.sq.z }; },
    startle() { scareQ.push({ all: true }); if (now.coyote) bolts.coyote = { t0: t, x: now.coyote.x, z: now.coyote.z, to: { x: L.cam.hw(now.coyote.z) + 3, z: now.coyote.z } }; if (now.raccoon) bolts.raccoon = { t0: t, x: now.raccoon.x, z: now.raccoon.z }; if (now.sq && !now.sq.onTree) bolts.squirrel = { id: lastSq(), t0: t, x: now.sq.x, z: now.sq.z }; },
    /** core/harbor-people.js#walkStart asks: are the ducks on the crossing in [a, b] (s, the city clock)? (PURE: their plan) */
    crossBlocked(a, b) { if (!L || !ctx) return false; const lc = localOf(a, ctx.off); const p = force.has('ducks') ? duckRound(a) : get(`duck|${lc.key}`, () => duckDay(lc.key, lc.day0, L, ctx)); return ducksBlock(p, a, b); },
    /** people.js: how far a dog is into its lunge at the flock now (0..1) */
    dogLunge(vid) { const l = lunges.get(vid); if (!l || l.t0 < 0) return 0; const e = t - l.t0; return e < 0 || e > 1.6 ? 0 : e < 0.25 ? e / 0.25 : 1 - (e - 0.25) / 1.35; },
    /** the trash can now (Group 1: its position + the lid; canHeld comes in through frame) */
    canState: () => (now.can ? { x: now.can.x, z: now.can.z, lid: now.can.lid } : null),
    canSpot: () => can,
    /** anything flying / climbing / running now (the scene keeps 60 fps) */
    busy: () => pig.some(b => b.now && b.now.air) || now.gulls.some(g => g.air) || !!(now.owl && now.owl.state === 'glide') || !!(now.sq && (now.sq.pose === 'trot' || now.sq.onTree)) || !!(now.coyote && now.coyote.moving) || now.ducks.length > 0 || now.fish.length > 0 || !!(now.heron && now.heron.pose === 'fly') || !!(now.cat && now.cat.moving),
    /** THE DIRECTOR: the share of the flock drawn (0..1) */
    budget(k) { budgetK = clamp01(k == null ? 1 : k); },
    debug: () => ({
      pigeons: pig.map(b => (b.now ? { i: b.i, spot: b.now.spot || 'air', pose: b.now.pose, x: +b.now.x.toFixed(2), y: +b.now.y.toFixed(2), z: +b.now.z.toFixed(2), air: !!b.now.air, ov: b.ov ? b.ov.kind : null, hide: !!b.now.hide } : { i: b.i, away: true, ov: b.ov ? b.ov.kind : null })),
      gulls: now.gulls.map(g => ({ id: g.id, spot: g.spot, pose: g.pose, air: !!g.air })), owl: now.owl ? { state: now.owl.state, spot: now.owl.spot || null } : null,
      squirrel: now.sq ? { pose: now.sq.pose, onTree: !!now.sq.onTree, x: +now.sq.x.toFixed(2), z: +now.sq.z.toFixed(2) } : null,
      coyote: now.coyote ? { x: +now.coyote.x.toFixed(2), z: +now.coyote.z.toFixed(2), pose: now.coyote.pose, eyes: +(now.coyote.eyes || 0).toFixed(2) } : null,
      raccoon: now.raccoon ? { pose: now.raccoon.pose, x: +now.raccoon.x.toFixed(2) } : null, can: now.can ? { lid: now.can.lid, x: +now.can.x.toFixed(2), z: +now.can.z.toFixed(2), held: !!now.can.held } : null,
      cat: now.cat ? { pose: now.cat.pose, x: +now.cat.x.toFixed(2), y: +now.cat.y.toFixed(2), z: +now.cat.z.toFixed(2) } : null,
      ducks: now.ducks.length, fish: now.fish.length, heron: now.heron ? { pose: now.heron.pose, strike: +(now.heron.strike || 0).toFixed(2) } : null, fireflies: now.ff.length,
      sun: { rise: +sun.rise.toFixed(2), set: +sun.set.toFixed(2) }, spots: spots.map(s => s.id), piling: piling ? { x: +piling.x.toFixed(2), z: piling.z } : null,
    }),
    destroy() { cache.clear(); if (pileCv) pileCv.width = pileCv.height = 0; pileCv = null; pileKey = ''; },
  };
  function lastSq() { return sqId; }
}
