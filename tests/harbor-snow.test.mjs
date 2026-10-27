// CITY 2.0 — 9b: THE SNOWPACK (core/harbor-snow.js) — snow stays until it really melts; the stages by colour + coverage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { packStep, packFromDays, emptyPack, snowState, forcedPack, snowKey, daysOf, SNOW_STAGES } from '../js/core/harbor-snow.js';
import { GR_WINTER } from './fixtures/gr-winter.mjs';

test('snowpack: it never melts on a day that stays below freezing; a mild day\'s flakes don\'t stick', () => {
  let p = packStep(emptyPack(), { tmax: -3, tmin: -9, snow: 10 });
  const d = p.depth;
  for (let i = 0; i < 10; i++) p = packStep(p, { tmax: -1, tmin: -8, snow: 0 });
  assert.ok(p.depth > d * 0.6 && p.depth < d, `settles only (${d} → ${p.depth.toFixed(1)})`);
  const warm = packStep(emptyPack(), { tmax: 7, tmin: 2, snow: 5 });
  assert.equal(warm.depth, 0, 'no snow sticks at 7 °C');
});

test('snowpack: the plowed banks outlast the level snow', () => {
  let p = packFromDays([{ tmax: -2, tmin: -8, snow: 15 }, { tmax: -1, tmin: -6, snow: 6 }]);
  let lastLevel = null, lastBank = null;
  for (let i = 0; i < 30; i++) {
    p = packStep(p, { tmax: 4, tmin: -1, snow: 0 });
    if (lastLevel == null && p.depth === 0) lastLevel = i;
    if (lastBank == null && p.banks === 0) lastBank = i;
  }
  assert.ok(lastLevel != null && (lastBank == null || lastBank > lastLevel + 3), `level gone day ${lastLevel}, banks day ${lastBank}`);
  assert.equal(snowState(packFromDays(Array(lastLevel + 1).fill({ tmax: 4, tmin: -1 }), packFromDays([{ tmax: -2, tmin: -8, snow: 15 }, { tmax: -1, tmin: -6, snow: 6 }]))).stage, 'spring', 'only the piles left = SPRING');
});

test('snowpack: a real Grand Rapids winter (2022–23) walks through the stages in a sensible order', () => {
  let p = emptyPack();
  const seen = new Map(), byDate = {};
  for (const [t, tmax, tmin, snow, rain, ref] of GR_WINTER) {
    p = packStep(p, { tmax, tmin, snow, rain });
    const s = snowState(p);
    byDate[t] = { s, p: { ...p }, ref };
    seen.set(s.stage, (seen.get(s.stage) || 0) + 1);
  }
  for (const st of SNOW_STAGES) assert.ok(seen.get(st) > 0, `the stage ${st} happens (${[...seen].map(([k, v]) => `${k} ${v}`).join(', ')})`);
  assert.equal(byDate['2022-11-05'].s.stage, 'none', 'early November: no snow');
  assert.equal(byDate['2022-11-19'].s.stage, 'fresh', 'the mid-November storm: FRESH');
  assert.ok(byDate['2022-12-25'].s.depth >= 12, `Christmas 2022's blizzard: deep (${byDate['2022-12-25'].s.depth} cm; ERA5 ${byDate['2022-12-25'].ref})`);
  assert.equal(byDate['2022-12-25'].s.stage, 'fresh');
  assert.ok(['older', 'thaw'].includes(byDate['2022-12-28'].s.stage), `the warm-up after it (${byDate['2022-12-28'].s.stage})`);
  assert.equal(byDate['2023-04-14'].s.stage, 'none', 'mid-April: gone');
  // the depth tracks the reanalysis within reason on the snowy days (never a pack where ERA5 has bare ground for a week)
  let close = 0, n = 0;
  for (const v of Object.values(byDate)) if (v.ref != null && v.ref >= 5) { n++; if (Math.abs(v.s.depth - v.ref) < Math.max(6, v.ref * 0.6)) close++; }
  assert.ok(close / n > 0.6, `close to ERA5 on ${close}/${n} snowy days`);
});

test('snowpack: the stages read by colour + coverage', () => {
  const s = Object.fromEntries(SNOW_STAGES.map(st => [st, snowState(forcedPack(st))]));
  for (const st of SNOW_STAGES) assert.equal(s[st].stage, st, `&snow=${st} reads as ${st}`);
  assert.ok(s.fresh.white > s.older.white && s.older.white > s.banks.white, 'fresh is the brightest, then older, then the old pack');
  assert.ok(s.fresh.branches > 0.5 && s.older.branches < 0.3 && s.banks.branches === 0, 'only fresh snow holds on the branches');
  assert.ok(s.older.paths === 1 && s.fresh.paths < 0.5, 'older snow has its footpaths worn in');
  assert.ok(s.thaw.slush === 1, 'the thaw: slush + a wet road');
  assert.ok(s.spring.cover < 0.5 && s.spring.cover > 0, 'spring: patches');
  assert.equal(s.none.cover, 0);
  assert.ok(snowKey(s.fresh) && !snowKey(s.none));
  // snow falling NOW on a freezing evening whitens bare ground (fresh)
  const falling = snowState(emptyPack(), { falling: 0.7, temp: -2 });
  assert.equal(falling.stage, 'fresh');
  assert.ok(falling.cover >= 0.5);
  assert.equal(snowState(emptyPack(), { falling: 0.7, temp: 5 }).stage, 'none', 'wet flakes on a mild night don\'t lie');
  // the real depth wins over the model
  { const z = snowState(forcedPack('fresh'), { depth: 0 }); assert.ok(z.stage === 'spring' && z.cover <= 0.15, 'a real depth of 0: only the piles'); }
});

test('snowpack: the answer\'s daily rows → the model\'s days (today left out)', () => {
  const now = Date.UTC(2027, 0, 10, 18);
  const rows = [[Date.UTC(2027, 0, 8, 5), -3, -9, 6, 0], [Date.UTC(2027, 0, 9, 5), -1, -7, 2, 0], [Date.UTC(2027, 0, 10, 5), 1, -4, 3, 0]];
  const d = daysOf(rows, now);
  assert.equal(d.length, 2);
  assert.deepEqual(d[0], { tmax: -3, tmin: -9, snow: 6, rain: 0 });
});
