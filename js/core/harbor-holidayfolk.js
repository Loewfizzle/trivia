// CITY 2.0 — THE HARBOR, PART 11a-1: THE PEOPLE OF THE HOLIDAYS — WHO comes WHEN (PURE: no DOM, no clock of its own; tested in
// tests/harbor-holidayfolk.test.mjs; turned into visits on the walkable map by core/harbor-people.js#folkAt, drawn by folk.js).
//   HALLOWEEN NIGHT (core/harbor-holiday.js#halloweenPieces): TRICK-OR-TREATERS — small groups of kids in costumes + a grown-up,
//     dusk → ~9:15 pm, to the speakeasy's side door (a knock, the door opens on the warm bar, a treat, on to the next) or the
//     barbershop's; ZOMBIES — a costume-party crowd shambling to the speakeasy (or past it), 8 pm → 2 am.
//   DAY OF THE DEAD, NOV 2 (core/harbor-holiday.js#processionAt): THE CANDLELIGHT PROCESSION in the waterside road's near lane, from
//     10 min after sunset for 70 min — candles, Catrinas in flower crowns, marigolds, photos held up, a mariachi trio, an ofrenda
//     carried on poles; the street closed to cars while it passes (its traffic hold).
// Everything is seeded per block of the clock (the same on every phone; a phone opening mid-way lands mid-way). &force= previews
// (forceAt: the clock s the flag was switched on): 'trick-or-treat', 'zombies', 'procession' — on a loop from that moment, any date.
import { rngFrom, hashString } from './rng.js';
import { holidayAt, halloweenPieces } from './harbor-holiday.js';

/** the local clock parts of an absolute second t at a UTC offset (minutes) */
export function localAt(t, off = 0) {
  const lt = t + (off || 0) * 60, d = new Date(lt * 1000);
  const h = ((lt / 3600) % 24 + 24) % 24;
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: Math.floor(h), mi: Math.floor((h % 1) * 60), s: 0, hr: h, key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`, day0: t - h * 3600 };
}
const pickW = (r, w) => { let s = 0; for (const k in w) s += w[k]; let u = r() * s; for (const k in w) { u -= w[k]; if (u <= 0) return k; } return Object.keys(w)[0]; };

// ------------------------------------------------------------------ HALLOWEEN NIGHT
/** the kids' costumes (each reads at ~20 pt by SILHOUETTE + COLOUR: folk.js#COSTUME) */
export const COSTUMES = Object.freeze(['ghost', 'witch', 'skeleton', 'pumpkin', 'vampire', 'hero', 'cat', 'pirate']);
/** trick-or-treaters: a group every `gap` s (a new block every BLOCK s), 2–4 kids + a grown-up (now and then in a witch hat),
 *  to the side door mostly; `treat` s at the door. The hours come from the calendar (halloweenPieces#trickOrTreat). */
export const TOT = Object.freeze({ block: 600, gap: [42, 88], kids: [2, 4], side: 0.78, treat: [7.5, 10], chapHat: 0.35, torch: 0.45, glow: 0.3 });
/** zombies: a group of 2–4 every `gap` s, 8 pm → 2 am (halloweenPieces#zombies); `inside` share go in at the side door (the party) */
export const ZOMBIE = Object.freeze({ block: 600, gap: [120, 230], n: [2, 4], inside: 0.6, notice: 1.7 });
export const ZOMBIE_LOOKS = Object.freeze(['suit', 'dress', 'worker', 'bride', 'suit', 'dress']);

/** is it trick-or-treat / zombie time at absolute second t (the calendar's own hours) */
export function halloweenAt(t, off) {
  const lc = localAt(t, off), H = holidayAt(lc);
  if (H.id !== 'halloween' || !H.eve) return { tot: false, zombies: false };
  const P = halloweenPieces(H, { hour: lc.hr });
  return { tot: !!P.trickOrTreat, zombies: !!P.zombies };
}

/**
 * the trick-or-treat groups whose START falls in block k (t ∈ [k·B, (k+1)·B)) → [{ t, seed, door: 'side' | 'shop', from: 'left' |
 * 'right', kids: [{ costume, carry: 'bucket' | 'pillowcase', glow: bool, seed }], chap: { seed, hat: 'witch' | null, torch: bool } }]
 * ctx: { off, seed, forceAt (s | null: the &force=trick-or-treat preview — a group every ~40 s from it, any date / hour) }
 */
export function totGroups(k, ctx = {}) {
  const B = TOT.block, t0 = k * B, r = rngFrom(hashString(`tot|${ctx.seed || 1924}|${k}`)), out = [];
  const forced = ctx.forceAt != null;
  for (let t = t0 + r() * TOT.gap[0]; t < t0 + B; t += forced ? 34 + r() * 14 : TOT.gap[0] + r() * (TOT.gap[1] - TOT.gap[0])) {
    if (forced ? t < ctx.forceAt + 1 : !halloweenAt(t, ctx.off).tot) continue;
    const n = TOT.kids[0] + Math.floor(r() * (TOT.kids[1] - TOT.kids[0] + 1)), pool = [...COSTUMES], kids = [];
    for (let i = 0; i < n; i++) { const j = Math.floor(r() * pool.length), c = pool.splice(j, 1)[0]; kids.push({ costume: c, carry: r() < 0.72 ? 'bucket' : 'pillowcase', glow: r() < TOT.glow, seed: Math.floor(r() * 1e6) }); }
    out.push({ t: Math.round(t * 10) / 10, seed: Math.floor(r() * 2147483647), door: r() < TOT.side ? 'side' : 'shop', from: r() < 0.5 ? 'left' : 'right', kids,
      chap: { seed: Math.floor(r() * 1e6), hat: r() < TOT.chapHat ? 'witch' : null, torch: r() < TOT.torch }, treat: TOT.treat[0] + r() * (TOT.treat[1] - TOT.treat[0]) });
  }
  return out;
}
/** the zombie groups whose start falls in block k → [{ t, seed, n, inside: bool, from, looks: [{ look, seed }] }] (ctx as totGroups) */
export function zombieGroups(k, ctx = {}) {
  const B = ZOMBIE.block, t0 = k * B, r = rngFrom(hashString(`zombie|${ctx.seed || 1924}|${k}`)), out = [];
  const forced = ctx.forceAt != null;
  for (let t = t0 + r() * 60; t < t0 + B; t += forced ? 45 + r() * 15 : ZOMBIE.gap[0] + r() * (ZOMBIE.gap[1] - ZOMBIE.gap[0])) {
    if (forced ? t < ctx.forceAt + 1 : !halloweenAt(t, ctx.off).zombies) continue;
    const n = ZOMBIE.n[0] + Math.floor(r() * (ZOMBIE.n[1] - ZOMBIE.n[0] + 1)), looks = [];
    for (let i = 0; i < n; i++) looks.push({ look: ZOMBIE_LOOKS[Math.floor(r() * ZOMBIE_LOOKS.length)], seed: Math.floor(r() * 1e6) });
    out.push({ t: Math.round(t * 10) / 10, seed: Math.floor(r() * 2147483647), n, inside: r() < ZOMBIE.inside, from: r() < 0.5 ? 'left' : 'right', looks });
  }
  return out;
}

// ------------------------------------------------------------------ DAY OF THE DEAD: THE PROCESSION
/** the procession: its pace (units / s — a slow walk), the near lane's two files (z), the gaps between walkers (units), the length
 *  of the chunks it is planned in (s), the walkers' kinds (weights), how often the trio + the ofrenda pass; its traffic hold */
export const PROC = Object.freeze({ v: 0.62, files: [55.55, 56.85], gap: [1.25, 2.3], chunk: 60, len: 70 * 60, lead: 40, roles: { candle: 5, catrina: 2.4, marigolds: 1.5, photo: 1.1, child: 0.9 }, trio: 210, ofrenda: 280 });
/** the sunset hour (local) for a day key from the people's dusk (duskFor: sunset + 0.42 h) — 17.6 without one */
export const sunsetOf = (dusk, key) => { const d = typeof dusk === 'function' ? dusk(key) : null; return d == null ? 17.6 : d - 0.42; };
/** the procession's window [T0, T1) (abs s) near t — Nov 2 from 10 min after sunset (core/harbor-holiday.js#processionAt), or the
 *  &force=procession preview's own (from forceAt + 1.5 s) — or null */
export function procWindow(t, ctx = {}) {
  if (ctx.forceAt != null) { const T0 = ctx.forceAt + 1.5; return t > T0 - 600 && t < T0 + PROC.len + 600 ? { T0, T1: T0 + PROC.len, forced: true } : null; }
  for (const dt of [0, -86400]) {
    const lc = localAt(t + dt, ctx.off);
    if (lc.m !== 11 || lc.d !== 2) continue;
    const T0 = lc.day0 + (sunsetOf(ctx.dusk, lc.key) + 1 / 6) * 3600, T1 = T0 + PROC.len;
    if (t > T0 - 3600 && t < T1 + 3600) return { T0, T1 };
  }
  return null;
}
/** the cars' hold while the procession is in the street: from PROC.lead s before its first walker until the last is off the screen */
export const procHold = (w, cross = 70) => (w ? [w.T0 - PROC.lead, w.T1 + cross] : null);
/**
 * the walkers who START in chunk c of a procession window w (their entry time from behind the speakeasy) → [{ t, n (the walker's
 * running number — the tier's thinning), role, z, seed, group? ('trio' | 'ofrenda'), members? }] — continuous across the chunks (each
 * chunk's first entry is spaced from the last one of the chunk before)
 */
export function procWalkers(c, w, ctx = {}) {
  if (!w) return [];
  const C = PROC.chunk, c0 = w.T0 + c * C, c1 = c0 + C;
  if (c1 <= w.T0 || c0 >= w.T1) return [];
  const r = rngFrom(hashString(`proc|${ctx.seed || 1924}|${Math.round(w.T0)}|${c}`)), out = [];
  const trio = r() < C / PROC.trio ? r() * 0.8 : -1, ofr = r() < C / PROC.ofrenda ? r() * 0.8 : -1;
  // (the chunks meet cleanly: a chunk's walkers start ≥ 1 s in and stop ≥ 1 s before its end — two walkers never closer than the gap)
  let t = c0 + 1 + r() * 0.8, n = c * 40;
  while (t < c1 - 1 && t < w.T1) {
    const u = (t - c0) / C, z = PROC.files[n % 2] + (r() - 0.5) * 0.35;
    if (trio >= 0 && u >= trio && !out.some(e => e.group === 'trio')) {
      // THE MARIACHI TRIO: three abreast-ish in a little knot (the guitar, the trumpet, the violin), sombreros + charro suits
      out.push({ t, n: n++, role: 'mariachi', group: 'trio', z: PROC.files[0] + 0.15, seed: Math.floor(r() * 1e6), members: [{ inst: 'guitar', dx: 0, dz: 0 }, { inst: 'trumpet', dx: -0.85, dz: 0.75 }, { inst: 'violin', dx: -1.6, dz: -0.1 }] });
      t += 3.2 / PROC.v; continue;
    }
    if (ofr >= 0 && u >= ofr && !out.some(e => e.group === 'ofrenda')) {
      // AN OFRENDA carried on poles by two (marigolds, candles, a photo on a little stepped altar between them)
      out.push({ t, n: n++, role: 'bearer', group: 'ofrenda', z: (PROC.files[0] + PROC.files[1]) / 2, seed: Math.floor(r() * 1e6), members: [{ dx: 0, dz: 0 }, { dx: -1.55, dz: 0 }] });
      t += 3.4 / PROC.v; continue;
    }
    out.push({ t, n: n++, role: pickW(r, PROC.roles), z, seed: Math.floor(r() * 1e6) });
    t += (PROC.gap[0] + r() * (PROC.gap[1] - PROC.gap[0])) / PROC.v;
  }
  return out;
}
