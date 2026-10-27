// CITY 2.0 — PART 9b: THE WINTER WORK on the waterside road (PURE: tests/harbor-snowwork.test.mjs). THE PLOW (a 1920s plow truck, its big
// angled blade throwing a spray of snow) clears each lane + piles the bank along the kerb; THE SALT TRUCK follows it (a fan of grains,
// a darker wet lane behind). They run through the back road's own traffic (core/harbor-traffic.js#simulateLane: the light, the queues,
// every phone the same) as extra cars of their lane.
//   WHEN  while SNOW IS FALLING: a plow pass on each lane every ~40 min (seeded offsets), the salt truck ~10 min after each near-lane pass;
//         the MORNING AFTER a snowfall (fresh snow, nothing falling): the clean-up round at ~6:40 → 7:30; &force=plow / &force=salt: one
//         pass now (the near lane) — the salt truck right behind a forced plow. NEVER during the parade or a raid (hold windows).
//   9c — THE PREVIEW STARTS AT ONCE (the owner's iPhone: &force=plow showed nothing): a forced pass is BACKDATED by ctx.lead (s — the
//         scene's time from the lane's entry, off-screen, to where the road first shows past the speakeasy) so the plow comes into view
//         ~1 s after the flag; forced spawns are never dropped for a bus due at the stop / a worker's truck (simulateLane's `forced`).
import { rngFrom, hashString } from './rng.js';

export const SNOWWORK = Object.freeze({ every: 2400, saltAfter: 600, v: { plow: 3.0, salt: 3.6 }, len: { plow: 7.1, salter: 6.0 }, morning: [[6.65, 'plow', 'near'], [6.9, 'plow', 'far'], [7.2, 'salter', 'near'], [7.45, 'salter', 'far']], forcedSalt: 8, block: 120 });

const localHour = (t, off) => ((((t + (off || 0) * 60) / 3600) % 24) + 24) % 24;

/**
 * PURE: the work passes in a span [a, b) (s): [{ id, kind ('plow' | 'salter'), lane ('near' | 'far'), t0 }]. ctx: { snowing (bool: snow
 * falling now ≥ the plow's threshold), fresh (bool: fresh snow lying, nothing falling — the morning after), off (min from UTC), seed,
 * forced: { plow: t | null, salt: t | null } (when a preview flag came on), lead: { plow, salter } (s: a forced pass starts this much
 * earlier, so it is IN VIEW at once), holds: [[t0, t1], …] (the parade, a raid: nothing starts inside) }
 */
export function workPasses(a, b, ctx = {}) {
  const out = [], seed = ctx.seed || 1924, E = SNOWWORK.every;
  const held = t => (ctx.holds || []).some(h => h && t >= h[0] - 30 && t < h[1]);
  if (ctx.snowing) {
    for (const lane of ['near', 'far']) {
      const off = (hashString(`plow|${seed}|${lane}`) % 1000) / 1000 * E;
      for (let k = Math.floor((a - off) / E) - 1; k * E + off < b; k++) {
        const t0 = k * E + off;
        if (t0 >= a && t0 < b) out.push({ id: `plow.${lane}.${k}`, kind: 'plow', lane, t0 });
        if (lane === 'near') { const ts = t0 + SNOWWORK.saltAfter; if (ts >= a && ts < b) out.push({ id: `salt.near.${k}`, kind: 'salter', lane, t0: ts }); }
      }
    }
  } else if (ctx.fresh) {
    // the morning clean-up (each local day): the seeded minutes round the round's slots
    const d0 = Math.floor((a + (ctx.off || 0) * 60) / 86400) - 1, d1 = Math.floor((b + (ctx.off || 0) * 60) / 86400);
    for (let d = d0; d <= d1; d++) {
      const r = rngFrom(hashString(`morning|${seed}|${d}`));
      for (const [h, kind, lane] of SNOWWORK.morning) {
        const t0 = d * 86400 - (ctx.off || 0) * 60 + (h + (r() - 0.5) * 0.15) * 3600;
        if (t0 >= a && t0 < b) out.push({ id: `${kind}.${lane}.m${d}`, kind, lane, t0 });
      }
    }
  }
  const f = ctx.forced || {}, ld = ctx.lead || {}, lp = Math.max(0, ld.plow || 0), ls = Math.max(0, ld.salter == null ? lp : ld.salter);
  if (f.plow != null) {
    const tp = f.plow - lp, ts = f.plow - ls + SNOWWORK.forcedSalt;
    if (tp >= a && tp < b) out.push({ id: `plow.near.f${Math.round(f.plow)}`, kind: 'plow', lane: 'near', t0: tp, forced: true });
    if (ts >= a && ts < b) out.push({ id: `salt.near.f${Math.round(f.plow)}`, kind: 'salter', lane: 'near', t0: ts, forced: true });
  }
  if (f.salt != null) { const ts = f.salt - ls; if (ts >= a && ts < b) out.push({ id: `salt.near.g${Math.round(f.salt)}`, kind: 'salter', lane: 'near', t0: ts, forced: true }); }
  return out.filter(p => p.forced || !held(p.t0)).sort((p, q) => p.t0 - q.t0);
}

/** PURE: the passes of block j on a lane as the traffic simulation's spawns (core/harbor-traffic.js#simulateLane: ctx.extra) */
export function workSpawns(j, lane, ctx = {}) {
  const B = SNOWWORK.block;
  return workPasses(j * B, (j + 1) * B, ctx).filter(p => p.lane === lane).map((p, i) => ({
    id: p.id, n: 9000 + i, t0: p.t0, v: SNOWWORK.v[p.kind === 'plow' ? 'plow' : 'salt'], model: p.kind, len: SNOWWORK.len[p.kind], paint: 0, trade: 0, rumble: false, glow: -1, work: p.kind, forced: !!p.forced,
  }));
}

/** PURE: the last near-lane plow pass that has CLEARED the road by t (s) — its time + 70 s (the crossing), or null */
export function lastCleared(t, ctx = {}) {
  const ps = workPasses(t - 4 * SNOWWORK.every, t, ctx).filter(p => p.kind === 'plow' && p.lane === 'near' && p.t0 + 70 <= t);
  return ps.length ? ps[ps.length - 1].t0 + 70 : null;
}
/** a short signature of the work's state for the traffic cache (its spawns change with it) */
export const workKey = ctx => (ctx ? `${ctx.snowing ? 's' : ''}${ctx.fresh ? 'f' : ''}${ctx.forced && ctx.forced.plow != null ? `p${Math.round(ctx.forced.plow)}` : ''}${ctx.forced && ctx.forced.salt != null ? `x${Math.round(ctx.forced.salt)}` : ''}${ctx.lead ? `l${Math.round(ctx.lead.plow || 0)}` : ''}` : '');
