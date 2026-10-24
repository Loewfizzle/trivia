// CITY 2.0 — THE HARBOR, FP3b item 9: THE ROUTINES — the people's SCHEDULED layer, beside core/harbor-people.js's random blocks (FREV
// A2 row 8). A routine is a set piece on the CLOCK: planned once per slot from a seed (the local date + the slot), so every phone sees
// the same one and a page opened mid-way joins it mid-way; it reserves its people (the blocks plan around its occupancy) and its
// floor (the walkers route round it). FP3b builds the SKELETON with ONE routine — THE GLOW-WAND DANCE CIRCLE (the owner's 8P note 5);
// 8b adds the workers' day (the newsboy, the barber, the window washers…) as more entries of the same shape. PURE (tests: harbor-
// people.test.mjs).
//
// THE DANCE CIRCLE: on a party night at its PEAK (22:00 → 00:45), in most quarter hours, a circle FORMS on the brick compass inlay —
// 4–6 dancers come out of the speakeasy's side door (real doors) to their spots round the compass, dance for ~6 minutes swinging
// handheld neon light wands (people.js#wands: the moves + the wands on the beat), then go back in; 3–5 others drift over to watch
// round it (behind + beside, never in front of the dancers) — clapping, bobbing, watching — and drift off after. The floor spots
// (the inlay's event rig) come on with it. &force=dance: one every 5 minutes, any night (the preview).
import { rngFrom, hashString } from './rng.js';
import { partyAt } from './harbor-moments.js';

/** the circle's numbers: slot (s), the window (local hours, after midnight + 24), the chance a slot has one, when it starts in its
 *  slot + how long it dances (s), the dancers (tier 0: the first `tier0`), their ring (× the inlay's ring) + the watchers' */
export const DANCE = Object.freeze({
  slot: 900, from: 22, to: 24.75, chance: 0.75, start: 150, len: 360, stagger: 2.2,
  n: 6, tier0: 4, ring: 0.92, watchers: [3, 5], watchRing: [1.55, 1.75],
  // (the spots round the compass, by index: the first four even — a square — so tier 0's four still stand round it)
  angles: [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4, Math.PI / 2, 3 * Math.PI / 2],
  // (&force=dance: a circle every 5 minutes, any night)
  force: { slot: 300, start: 8, len: 240 },
});

const localOf = (t, off) => { const lt = t + (off || 0) * 60, d = new Date(lt * 1000); return { key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, dow: d.getUTCDay(), h: ((lt / 3600) % 24 + 24) % 24 }; };

/**
 * The circle in slot j (PURE): { id, s0 (the first dancer steps out), s1 (the dance ends — they head back in), dancers, watchers }
 * or null (no circle this slot). ctx: { off (minutes from UTC), seed, party(t) → bool, force (&force=dance) }.
 */
export function danceSlot(j, ctx = {}) {
  const F = ctx.force ? DANCE.force : null, S = F ? F.slot : DANCE.slot, t0 = j * S;
  const r = rngFrom(hashString(`dance|${ctx.seed || 1924}|${j}|${F ? 'f' : ''}`));
  if (!F) {
    const loc = localOf(t0 + S / 2, ctx.off), hh = loc.h < 3 ? loc.h + 24 : loc.h;
    const party = ctx.party ? ctx.party(t0 + S / 2) : partyAt(loc.dow, loc.h);
    if (!party || hh < DANCE.from || hh >= DANCE.to || r() >= DANCE.chance) return null;
  }
  const s0 = t0 + (F ? F.start : DANCE.start + r() * 60), s1 = s0 + (F ? F.len : DANCE.len * (0.85 + r() * 0.3));
  const nw = DANCE.watchers[0] + Math.floor(r() * (DANCE.watchers[1] - DANCE.watchers[0] + 1));
  return { id: `dance.${j}`, s0, s1, dancers: DANCE.n, watchers: nw, seed: Math.floor(r() * 1e6) };
}
/** the slots whose circle could touch [a, b] */
export function danceSlotsNear(a, b, ctx = {}) {
  const S = ctx.force ? DANCE.force.slot : DANCE.slot, out = [];
  for (let j = Math.floor(a / S) - 1; j <= Math.floor(b / S); j++) out.push(j);
  return out;
}
/** a dancer's spot (world x, z) round the inlay m */
export const danceSpot = (m, i) => ({ x: m.x + Math.cos(DANCE.angles[i]) * m.ring * DANCE.ring, z: m.z + Math.sin(DANCE.angles[i]) * m.ring * DANCE.ring });
/** a watcher's spot (world): behind + beside the circle (never in front of the dancers — they'd hide them), spread by the seed */
export function watchSpot(m, k, n, r) {
  const a0 = -0.15 * Math.PI, a1 = 1.15 * Math.PI, a = a0 + (a1 - a0) * ((k + 0.5) / n) + (r() - 0.5) * 0.25;
  const R = m.ring * (DANCE.watchRing[0] + r() * (DANCE.watchRing[1] - DANCE.watchRing[0]));
  return { x: m.x + Math.cos(a) * R, z: m.z + Math.sin(a) * R };
}
/** the circle's state at t (0..1 formed: everyone on their spots; the floor spots + the moves follow it) */
export function danceLevel(sess, t) {
  if (!sess) return 0;
  const up = (t - sess.s0 - 10) / 18, down = (sess.s1 + 8 - t) / 10;
  return Math.max(0, Math.min(1, up, down));
}
