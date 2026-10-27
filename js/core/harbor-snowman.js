// CITY 2.0 — PART 9b: THE JANUARY SNOWMAN (PURE: tests/harbor-snowman.test.mjs). A BIG snowman on the promenade's centre circle (the inlay,
// THE CENTREPIECE RIG: screens/harbor/snowman.js) built over JANUARY by the neighbourhood — started ~Jan 2 (kids + a couple of adults
// rolling the base), growing + dressed on SNOW DAYS ONLY (snow on the ground + a cold day): the middle, the head, the coal eyes + buttons,
// the carrot, the scarf, the hat, the stick arms, the pebble smile — done by ~Jan 31, then standing until a real sustained thaw.
// A brief thaw SLUMPS him (and the next snow day the builders patch him up); a SUSTAINED thaw (three days running above 4 °C, or the
// snow gone) MELTS him in stages; no snow → no snowman (Florida never has one). Built from the same days as the snowpack (the live
// answer's 30 days, or the climate's) — every phone at a place the same.

import { packStep, emptyPack } from './harbor-snow.js';

/** the numbers: the build window (January 2–31), each snow day's progress, the thaw's slump + melt (°C, per day) */
export const SNOWMAN = Object.freeze({ from: 2, to: 31, perDay: 0.045, lastWeek: 24, buildDepth: 3, buildMax: 3, slumpT: 2, slumpK: 0.12, patch: 0.6, thawT: 4, thawDays: 3, meltPerDay: 0.34 });
/** the stages by progress (what's on him): the base, the middle, the head, the face (eyes + buttons), the carrot, the scarf, the hat, the arms, the smile */
export const STAGES = Object.freeze([['base', 0.04], ['middle', 0.24], ['head', 0.42], ['face', 0.55], ['carrot', 0.65], ['scarf', 0.74], ['hat', 0.84], ['arms', 0.93], ['smile', 0.99]]);
export const stageOf = p => { let s = null; for (const [id, at] of STAGES) if (p >= at) s = id; return s; };
export const has = (p, id) => { const r = STAGES.find(s => s[0] === id); return !!r && p >= r[1]; };

/**
 * PURE: the snowman at the end of the given days (oldest first; each { y, m, d, tmax, tmin, snow, rain }) + today so far ({ y, m, d, h,
 * tmax?, snowDepth? }: a build day counts from late morning) → { progress (0..1), slump (0..1), melt (0..1), stage, standing, why }
 */
export function snowmanPlan(days, today = null) {
  let pack = emptyPack(), progress = 0, slump = 0, melt = 0, thaw = 0, why = 'no snowman';
  const step = (D, part = 1) => {
    pack = part >= 1 ? packStep(pack, D) : pack;
    const jan = D.m === 1 && D.d >= SNOWMAN.from && D.d <= SNOWMAN.to;
    const ground = pack.depth >= SNOWMAN.buildDepth, cold = D.tmax <= SNOWMAN.buildMax;
    const warm = D.tmax > SNOWMAN.thawT || (pack.depth < 0.5 && pack.banks < 3);
    thaw = warm ? thaw + part : 0;
    if (progress > 0 || melt > 0) {
      if (thaw >= SNOWMAN.thawDays) { melt = Math.min(1, melt + SNOWMAN.meltPerDay * part); why = `melting · ${Math.floor(thaw)} warm days`; }
      else if (D.tmax > SNOWMAN.slumpT) { slump = Math.min(1, slump + SNOWMAN.slumpK * (D.tmax - SNOWMAN.slumpT) * part); why = `slumping · ${D.tmax} °C`; }
    }
    if (melt >= 1) { progress = 0; slump = 0; melt = 0; why = 'melted away'; }
    if (jan && ground && cold && melt < 0.3) {
      progress = Math.min(1, progress + SNOWMAN.perDay * (D.d >= SNOWMAN.lastWeek ? 2.2 : 1) * part);   // (the last week's finishing touches come quicker)
      slump = Math.max(0, slump - SNOWMAN.patch * part);       // (the builders patch him up)
      melt = Math.max(0, melt - 0.2 * part);
      why = progress >= 1 ? 'done — standing' : `building · day ${D.m}/${D.d}`;
    }
  };
  for (const D of days || []) step(D, 1);
  if (today && today.m === 1) {
    // today so far: the builders come out late morning; the day's weather as the model's day (its high so far)
    const D = { ...today, tmax: today.tmax != null ? today.tmax : -2, tmin: today.tmin != null ? today.tmin : -8, snow: 0, rain: 0 };
    const part = Math.max(0, Math.min(1, ((today.h || 0) - 10) / 5));
    if (part > 0) step(D, part);
  }
  progress = Math.round(progress * 100) / 100;
  return { progress, slump: Math.round(slump * 100) / 100, melt: Math.round(melt * 100) / 100, stage: progress > 0 ? stageOf(progress) : null, standing: progress > 0, why };
}

/** the previews: &snowman=base|middle|head|face|carrot|scarf|hat|done|slump|melt → a state */
export function forcedSnowman(id) {
  const at = Object.fromEntries(STAGES.map(([k, v]) => [k, v + 0.005]));
  if (id === 'done') return { progress: 1, slump: 0, melt: 0, stage: 'smile', standing: true, why: 'forced: done' };
  if (id === 'slump') return { progress: 1, slump: 0.7, melt: 0, stage: 'smile', standing: true, why: 'forced: a thaw slump' };
  if (id === 'melt') return { progress: 1, slump: 0.6, melt: 0.6, stage: 'smile', standing: true, why: 'forced: melting' };
  if (at[id] != null) return { progress: at[id], slump: 0, melt: 0, stage: id, standing: true, why: `forced: ${id}` };
  return null;
}
