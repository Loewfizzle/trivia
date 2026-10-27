// CITY 2.0 — PART 9b: THE SNOWPACK (PURE: tests/harbor-snow.test.mjs). Snow STAYS on the ground until it really melts (the owner is in
// Michigan): the real snow depth at the player's place (Open-Meteo's snow_depth through /api/sky) when the answer has it, else this model
// run over the days behind today — the real ones (the answer's `days`: each day's high, low, snowfall + rain) or the climate's
// (core/climate.js, when the live weather failed). Every phone at a place runs the same days → the same ground.
//   THE MODEL (one step a day): fresh snow adds (only on a cold day — a mild day's flakes don't stick), the pack SETTLES (fresh snow
//   compacts fast, old slowly), it MELTS only above freezing (degree-days + rain on snow), the PLOWED BANKS grow with every real
//   snowfall and melt at under half the rate (they last longest), the snow gets DIRTIER with every day without a fresh coat.
//   THE STAGES (read by COLOUR + COVERAGE over big areas — the glance test): FRESH (bright white on everything, branches too) ·
//   OLDER (duller, off the branches, worn footpaths) · BANKS (an old pack: grey-brown plowed mounds dominate) · THAW (slush, a dark
//   shiny wet road) · SPRING (white patches on dark ground, the last dirty piles) · none.

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

export const SNOW_STAGES = ['none', 'fresh', 'older', 'banks', 'thaw', 'spring'];
/** the thresholds: cm of snow, °C, days */
export const SNOW = Object.freeze({ stick: 2.5, warmStick: 4.5, settleFresh: 0.93, settleOld: 0.985, meltMax: 0.3, meltMean: 0.25, meltRain: 0.06, bankK: 1.2, bankMelt: 0.42, bankMax: 120, freshDays: 1, olderDays: 4, springDepth: 4, springPeak: 8, none: 0.5, bankNone: 3 });

/** an empty pack */
export const emptyPack = () => ({ depth: 0, banks: 0, age: 99, dirt: 0, thaw: 0, warm: 0, peak: 0, days: 0, last: 0 });

/**
 * PURE: one day on the pack — day = { tmax, tmin (°C), snow (cm of fresh snow fallen), rain (mm of rain) } → a new pack.
 * Fresh snow sticks only on a cold day (the day's high ≤ SNOW.stick °C fully, a little up to SNOW.warmStick); the pack settles, melts by
 * degree-days above 0 °C (never on a day that stays below freezing), the banks grow with each real snowfall (≥ 2 cm: the plows) and
 * melt slower; the snow dirties a little each day without a new coat.
 */
export function packStep(pack, day) {
  const p = { ...emptyPack(), ...pack };
  const tmax = num(day && day.tmax, 5), tmin = num(day && day.tmin, tmax - 8), tmean = (tmax + tmin) / 2;
  const fell = Math.max(0, num(day && day.snow)), rain = Math.max(0, num(day && day.rain));
  const stick = tmax <= SNOW.stick ? 1 : tmax >= SNOW.warmStick ? 0 : 1 - (tmax - SNOW.stick) / (SNOW.warmStick - SNOW.stick);
  const add = fell * stick;
  const melt = tmax <= 0 ? 0 : SNOW.meltMax * Math.max(0, tmax) + SNOW.meltMean * Math.max(0, tmean) + SNOW.meltRain * rain * (tmean > 0 ? 1 : 0.3);
  const settle = p.age <= 2 ? SNOW.settleFresh : SNOW.settleOld;
  p.depth = Math.max(0, p.depth * settle + add - melt);
  if (add >= 2) p.banks = Math.min(SNOW.bankMax, p.banks + add * SNOW.bankK);
  p.banks = Math.max(0, p.banks - melt * SNOW.bankMelt);
  if (p.depth < 0.05) p.depth = 0;
  if (p.banks < 0.3) p.banks = 0;
  p.age = add >= 1 ? 0 : Math.min(99, p.age + 1);
  p.dirt = add >= 2 ? p.dirt * 0.25 : clamp01(p.dirt + (p.depth > 0 || p.banks > 0 ? 0.07 + (melt > 0 ? 0.05 : 0) : -1));
  p.thaw = melt > 0.4 && (p.depth > 0 || p.banks > 0) ? p.thaw + 1 : 0;
  p.warm = tmax;
  p.peak = Math.max(p.depth, p.peak * 0.96);
  p.days += 1;
  p.last = add;
  return p;
}

/** PURE: the pack after a run of days (oldest first) */
export function packFromDays(days, pack = emptyPack()) {
  let p = pack;
  for (const d of days || []) p = packStep(p, d);
  return p;
}

/**
 * PURE: the ground's look from a pack (+ the real depth now, cm, when the live answer has it; + what's falling now) →
 * { stage, depth (cm), cover (0..1 the ground's white), banks (0..1), branches (0..1 snow on the twigs), white (0..1 how bright the
 *   snow is), paths (0..1 the worn footpaths), slush (0..1 the wet road), dirt, age (days), why }
 */
export function snowState(pack, { depth: realDepth = null, falling = 0, temp = null } = {}) {
  const p = { ...emptyPack(), ...pack };
  let depth = realDepth != null && Number.isFinite(Number(realDepth)) ? Math.max(0, Number(realDepth)) : p.depth;
  // snow falling NOW on a freezing day whitens the ground as it falls (the day's model hasn't counted it yet)
  if (falling > 0.05 && (temp == null || temp <= 1)) depth = Math.max(depth, 1.2 * falling);
  const banksCm = depth < SNOW.none && realDepth != null ? p.banks * 0.6 : p.banks;
  const base = { depth: Math.round(depth * 10) / 10, age: p.age, dirt: Math.round(p.dirt * 100) / 100, banks: Math.round(clamp01(banksCm / 40) * 100) / 100 };
  const fallingNow = falling > 0.05 && (temp == null || temp <= 1);
  if (depth < SNOW.none && banksCm < SNOW.bankNone) return { ...base, stage: 'none', cover: 0, branches: 0, white: 0, paths: 0, slush: p.thaw ? 0.3 : 0, banks: 0, why: 'no snow on the ground' };
  const cov = clamp01(Math.pow(clamp01(depth / 7), 0.6));
  if (!fallingNow && (depth < SNOW.none || (depth < SNOW.springDepth && p.peak >= SNOW.springPeak && p.age > 1))) {
    return { ...base, stage: 'spring', cover: Math.round(clamp01(0.12 + depth / 9) * 100) / 100, branches: 0, white: 0.5, paths: 0, slush: p.thaw ? 0.6 : 0.25, why: `the last patches · ${base.depth} cm · the banks ${Math.round(banksCm)} cm` };
  }
  if (!fallingNow && p.thaw >= 1 && p.warm > 2 && p.age > 0) {
    return { ...base, stage: 'thaw', cover: Math.round(clamp01(cov * 0.62) * 100) / 100, branches: 0, white: 0.42, paths: 1, slush: 1, why: `thawing · ${base.depth} cm · ${p.warm} °C` };
  }
  if (fallingNow || p.age <= SNOW.freshDays) {
    return { ...base, stage: 'fresh', cover: Math.round(Math.max(cov, fallingNow ? 0.5 : 0) * 100) / 100, branches: fallingNow ? 1 : p.age === 0 ? 1 : 0.55, white: 1, paths: fallingNow ? 0.15 : p.age === 0 ? 0.3 : 0.6, slush: 0, why: `fresh snow · ${base.depth} cm${fallingNow ? ' · falling' : ''}` };
  }
  if (p.age <= SNOW.olderDays) {
    return { ...base, stage: 'older', cover: Math.round(cov * 100) / 100, branches: 0.12, white: 0.7, paths: 1, slush: 0.15, why: `older snow · ${base.depth} cm · ${p.age} days` };
  }
  return { ...base, stage: 'banks', cover: Math.round(clamp01(cov * 0.9) * 100) / 100, branches: 0, white: 0.5, paths: 1, slush: 0.2, banks: Math.max(base.banks, 0.5), why: `an old pack · ${base.depth} cm · the banks ${Math.round(banksCm)} cm · ${p.age} days` };
}

/** the previews: &snow=fresh|older|banks|thaw|spring|none (+ &snowdepth=<cm>) → a pack that reads as that stage */
export function forcedPack(stage, depthCm = null) {
  const d = depthCm != null && Number.isFinite(Number(depthCm)) ? Math.max(0, Number(depthCm)) : null;
  const P = {
    fresh: { depth: d ?? 14, banks: 10, age: 0, dirt: 0, thaw: 0, warm: -3, peak: d ?? 14 },
    older: { depth: d ?? 12, banks: 22, age: 3, dirt: 0.3, thaw: 0, warm: -2, peak: d ?? 16 },
    banks: { depth: d ?? 9, banks: 45, age: 8, dirt: 0.6, thaw: 0, warm: -1, peak: d ?? 18 },
    thaw: { depth: d ?? 7, banks: 30, age: 5, dirt: 0.7, thaw: 2, warm: 6, peak: d ?? 18 },
    spring: { depth: d ?? 2, banks: 14, age: 9, dirt: 0.9, thaw: 3, warm: 9, peak: 20 },
    none: { depth: 0, banks: 0, age: 99, dirt: 0, thaw: 0, warm: 10, peak: 0 },
  }[stage];
  return P ? { ...emptyPack(), ...P, days: 30 } : null;
}

/** PURE: the bake's key for the ground (quantized: a re-bake only when the look moves a step) */
export const snowKey = s => (!s || s.stage === 'none' ? '' : `${s.stage}${Math.round(s.cover * 8)}${Math.round(s.banks * 4)}${Math.round(s.branches * 4)}${Math.round(s.white * 5)}`);

/** PURE: the live answer's daily rows ([[dayMs, tmax, tmin, snowCm, rainMm], …], oldest first, today's partial row last) → the model's
 *  days (today's row left out — the day isn't over: what's falling now is counted live) */
export function daysOf(rows, nowMs = Date.now()) {
  if (!Array.isArray(rows)) return [];
  const out = [];
  for (const r of rows) {
    if (!Array.isArray(r) || r.length < 5) continue;
    const [t, hi, lo, sn, rn] = r.map(Number);
    if (!Number.isFinite(t) || t + 864e5 > nowMs) continue;          // (a day counts once it has ended: the row's time is its start)
    out.push({ tmax: Number.isFinite(hi) ? hi : 5, tmin: Number.isFinite(lo) ? lo : 0, snow: Number.isFinite(sn) ? Math.max(0, sn) : 0, rain: Number.isFinite(rn) ? Math.max(0, rn) : 0 });
  }
  return out;
}
