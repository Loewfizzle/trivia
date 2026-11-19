// HIGH RISE S1 — THE BOT SIMS, THE FAST VERSION (200 seeds a bot — the full table: `node scripts/highrise-sim.mjs`, 2,000 seeds): THE
// SPEED CURVE (tuning.js#SWEEP) is set by these targets — the owner's (docs/games/plan.md "HIGH RISE — S1"): sloppy 30–60 s · good
// 2–3 min · near-perfect on floor 200 in ≈ 3:00–4:00, most of its runs · casual sensibly between. A future tuning slip goes red HERE.
import test from 'node:test';
import assert from 'node:assert/strict';
import { simBot, SOLO_STOP } from '../scripts/highrise-sim.mjs';
import { BOTS, BOT_IDS, gaussBot, playBot } from '../js/games/highrise/bot.js';
import { createRun, isOver } from '../js/games/highrise/engine.js';
import { judgeRun } from '../js/games/highrise/replay.js';
import { MODES, TICK_HZ } from '../js/games/highrise/tuning.js';

const N = 200;
const solo = Object.fromEntries(BOT_IDS.map(id => [id, simBot(id, 'solo', N, 't')]));
const match = Object.fromEntries(BOT_IDS.map(id => [id, simBot(id, 'match', N, 't')]));
const line = r => `${r.bot} σ${r.sigma}: ${r.time.med.toFixed(0)} s (${r.time.p10.toFixed(0)}–${r.time.p90.toFixed(0)}) · floor ${r.floor.med} · ≥60 ${(r.r60 * 100).toFixed(0)} % · ≥200 ${(r.r200 * 100).toFixed(0)} %${r.to200 ? ` · to 200 in ${r.to200.med.toFixed(0)} s` : ''}`;

test('THE FOUR BOTS: σ 60 (sloppy) · 40 (casual) · 25 (good) · 10 ms (near-perfect), each from its own seeded rng', () => {
  assert.deepEqual(BOTS, { sloppy: 60, casual: 40, good: 25, nearPerfect: 10 });
  const a = createRun({ seed: 'd', mode: 'solo' }), b = createRun({ seed: 'd', mode: 'solo' });
  assert.deepEqual(playBot(a, gaussBot({ sigmaMs: 25, seed: 'd' })), playBot(b, gaussBot({ sigmaMs: 25, seed: 'd' })), 'the same bot seed = the same run');
  assert.ok(isOver(a));
  console.log(`[highrise-sim] solo, ${N} seeds — ${BOT_IDS.map(id => line(solo[id])).join(' | ')}`);
});

test('THE TARGETS (solo, the survival time): SLOPPY median 30–60 s · GOOD median 2–3 min · CASUAL sensibly between', () => {
  const s = solo.sloppy.time.med, c = solo.casual.time.med, g = solo.good.time.med;
  assert.ok(s >= 30 && s <= 60, `sloppy median ${s.toFixed(1)} s`);
  assert.ok(g >= 120 && g <= 180, `good median ${g.toFixed(1)} s`);
  assert.ok(c > s * 1.25 && c < g * 0.8, `casual median ${c.toFixed(1)} s sits between ${s.toFixed(1)} and ${g.toFixed(1)}`);
  // the bots fall in order — on time and on height, at the median and at both ends
  for (const k of ['med', 'p10', 'p90']) {
    assert.ok(solo.sloppy.time[k] < solo.casual.time[k] && solo.casual.time[k] < solo.good.time[k] && solo.good.time[k] < solo.nearPerfect.time[k], `time ${k} in order`);
    assert.ok(solo.sloppy.floor[k] < solo.casual.floor[k] && solo.casual.floor[k] < solo.good.floor[k] && solo.good.floor[k] < solo.nearPerfect.floor[k], `floor ${k} in order`);
  }
  // nobody is out in the first seconds, and a sloppy run is not a marathon
  assert.ok(solo.sloppy.time.p10 >= 20, `even a poor sloppy run lasts ${solo.sloppy.time.p10.toFixed(0)} s`);
  assert.ok(solo.sloppy.time.p90 <= 75);
  assert.equal(solo.sloppy.r60, 0, 'a sloppy bot never sees the clouds (floor 60)');
  assert.ok(solo.good.r60 >= 0.95, 'a good bot always does');
});

test('THE TARGETS (the near-perfect bot): floor 200 in ≈ 3:00–4:00, MOST of its runs — well inside the match\'s 6:00 and the daily\'s 5:00', () => {
  const np = match.nearPerfect;
  assert.ok(np.r200 >= 0.9, `${(np.r200 * 100).toFixed(0)} % of its runs reach floor 200`);
  assert.ok(np.to200.med >= 180 && np.to200.med <= 240, `floor 200 at ${np.to200.med.toFixed(0)} s`);
  assert.ok(np.to200.p90 <= 240 && np.to200.p10 >= 180);
  assert.ok(np.to200.p90 * TICK_HZ < MODES.daily.capTicks, 'home before the daily\'s cap too');
  assert.equal(np.floor.med, 200, 'a match ends at the finish');
  assert.ok(match.good.r200 <= 0.1, 'floor 200 is a feat: a good bot almost never gets there');
  assert.ok(match.sloppy.r200 === 0 && match.casual.r200 === 0);
  assert.equal(solo.nearPerfect.stopped > 0, true, `(solo is endless: the sim stops a run at floor ${SOLO_STOP})`);
});

test('THE SIMS PLAY THE REAL RULES: every bot log is one THE JUDGE accepts', () => {
  for (const id of BOT_IDS) for (const mode of ['solo', 'match', 'daily']) for (let i = 0; i < 8; i++) {
    const seed = `j-${id}-${mode}-${i}`, run = createRun({ seed, mode }), taps = playBot(run, gaussBot({ sigmaMs: BOTS[id], seed }), { maxFloor: 300 });
    const v = judgeRun({ seed, mode, taps });
    assert.equal(v.ok, true, `${seed}: ${v.why}`);
    if (isOver(run)) assert.deepEqual([v.floor, v.tick, v.cause], [run.floor, run.at, run.st === 'out' ? run.cause : run.st]);
  }
});
