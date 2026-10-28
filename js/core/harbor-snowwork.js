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

export const SNOWWORK = Object.freeze({ every: 2400, saltAfter: 600, v: { plow: 3.0, salt: 3.6, flusher: 2.3 }, len: { plow: 7.1, salter: 6.0, flusher: 6.2 }, morning: [[6.65, 'plow', 'near'], [6.9, 'plow', 'far'], [7.2, 'salter', 'near'], [7.45, 'salter', 'far']], forcedSalt: 8, block: 120 });

const localHour = (t, off) => ((((t + (off || 0) * 60) / 3600) % 24) + 24) % 24;

/** 9e — THE WATER WAGON (plan.md "FILLING THE DEAD TIMES — DECIDED" (2)): a 1920s street flusher washing the back road in the small hours —
 *  A LONG SHIFT (~2:45 → ~3:30, ~40–46 min, seeded per night), slow passes every `every` s, the lanes in turn, fans of spray (snowfx.js),
 *  the road left wet behind (the scene's wet road while it works + drying `dry` s after). Its nights: ctx.flush (the scene: not after rain,
 *  not below freezing, not on snow — the hoser at the hydrant (core/harbor-workers.js#SHOWS.hoser) shares the gate). &force=flusher: a
 *  pass every `every` s from the flag (a loop). */
export const FLUSH = Object.freeze({ h0: 2.75, jitter: 0.08, len: [40 * 60, 46 * 60], every: 380, dry: 25 * 60 });
/** PURE: the water wagon's shift on local day index d (days since the epoch, local) → [t0, t1] (abs s) */
export function flushWindow(d, ctx = {}) {
  const r = rngFrom(hashString(`flush|${ctx.seed || 1924}|${d}`));
  const t0 = d * 86400 - (ctx.off || 0) * 60 + (FLUSH.h0 + r() * FLUSH.jitter) * 3600;
  return [t0, t0 + FLUSH.len[0] + r() * (FLUSH.len[1] - FLUSH.len[0])];
}
/** PURE: how wet the water wagon left the road at t (0..1: 1 while it works, drying over FLUSH.dry after) — ctx.flush gates it */
export function flushWet(t, ctx = {}) {
  if (!ctx.flush && !(ctx.forced && ctx.forced.flush != null)) return 0;
  if (ctx.forced && ctx.forced.flush != null && t >= ctx.forced.flush) return 1;
  const d = Math.floor((t + (ctx.off || 0) * 60) / 86400);
  const [a, b] = flushWindow(d, ctx);
  if (t < a + 120) return 0;
  return t <= b ? Math.min(1, (t - a - 120) / 300) : Math.max(0, 1 - (t - b) / FLUSH.dry);
}

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
  // 9e — THE WATER WAGON's passes (its nights only: ctx.flush) — the near lane, then the far one, in turn
  if (ctx.flush) {
    const off = (ctx.off || 0) * 60, d0 = Math.floor((a + off) / 86400) - 1, d1 = Math.floor((b + off) / 86400);
    for (let d = d0; d <= d1; d++) {
      const [w0, w1] = flushWindow(d, ctx);
      for (let k = 0; w0 + k * FLUSH.every < w1 - 60; k++) { const t0 = w0 + k * FLUSH.every; if (t0 >= a && t0 < b) out.push({ id: `flush.${k % 2 ? 'far' : 'near'}.${d}.${k}`, kind: 'flusher', lane: k % 2 ? 'far' : 'near', t0 }); }
    }
  }
  const f = ctx.forced || {}, ld = ctx.lead || {}, lp = Math.max(0, ld.plow || 0), ls = Math.max(0, ld.salter == null ? lp : ld.salter);
  if (f.flush != null) {
    const lf = Math.max(0, ld.flusher == null ? lp : ld.flusher);
    for (let k = Math.max(0, Math.floor((a - f.flush) / FLUSH.every) - 1); f.flush - lf + k * FLUSH.every < b; k++) { const t0 = f.flush - lf + k * FLUSH.every; if (t0 >= a && t0 < b) out.push({ id: `flush.near.f${Math.round(f.flush)}.${k}`, kind: 'flusher', lane: 'near', t0, forced: true }); }
  }
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
    id: p.id, n: 9000 + i, t0: p.t0, v: SNOWWORK.v[p.kind === 'salter' ? 'salt' : p.kind], model: p.kind, len: SNOWWORK.len[p.kind], paint: 0, trade: 0, rumble: false, glow: -1, work: p.kind, forced: !!p.forced,
  }));
}

/** PURE: the last near-lane plow pass that has CLEARED the road by t (s) — its time + 70 s (the crossing), or null */
export function lastCleared(t, ctx = {}) {
  const ps = workPasses(t - 4 * SNOWWORK.every, t, ctx).filter(p => p.kind === 'plow' && p.lane === 'near' && p.t0 + 70 <= t);
  return ps.length ? ps[ps.length - 1].t0 + 70 : null;
}
/** a short signature of the work's state for the traffic cache (its spawns change with it) */
export const workKey = ctx => (ctx ? `${ctx.snowing ? 's' : ''}${ctx.fresh ? 'f' : ''}${ctx.flush ? 'w' : ''}${ctx.forced && ctx.forced.flush != null ? `w${Math.round(ctx.forced.flush)}` : ''}${ctx.forced && ctx.forced.plow != null ? `p${Math.round(ctx.forced.plow)}` : ''}${ctx.forced && ctx.forced.salt != null ? `x${Math.round(ctx.forced.salt)}` : ''}${ctx.lead ? `l${Math.round(ctx.lead.plow || 0)}` : ''}` : '');
