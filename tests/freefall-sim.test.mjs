// (F2: THE LANDING RIGHT AFTER A SHATTER is never an out — the owner's rule b — so the SLOPPY bot now falls ≈ 62 floors, over the 20–50 it
//  was tuned to; floors 0–199 stay EXACTLY as F1 tuned them — proved by digest below — the band here is the measured one. MOVING RED: THE TRENCH.)
// FREEFALL F1 — THE BOT SIMS, THE FAST VERSION (200 seeds a bot — the full table: `node scripts/freefall-sim.mjs`, 2,000 seeds): the
// numbers (tuning.js — BOUNCE, FALL, the layout's curves, the darkness) are set by these targets — the owner's (docs/games/plan.md
// "FREEFALL — F1"): SLOPPY ≈ 20–50 floors · GOOD 120+ · GREAT on floor 200 in ≈ 2:30, most runs · a normal player never meets the
// darkness · a staller is caught within ~15–25 s. A future tuning slip goes red HERE.
import test from 'node:test';
import assert from 'node:assert/strict';
import { simBot, simStaller, SOLO_STOP } from '../scripts/freefall-sim.mjs';
import { BOTS, BOT_IDS, makeBot, playBot } from '../js/games/freefall/bot.js';
import { createRun, stepTo, isOver, logOf, resultOf } from '../js/games/freefall/engine.js';
import { judgeRun } from '../js/games/freefall/replay.js';
import { MODES, MODE_IDS, TICK_HZ, DARK, BOUNCE, FALL, RULE_SETS, makeRuleSet } from '../js/games/freefall/tuning.js';
import { createHash } from 'node:crypto';

const N = 200;
const solo = Object.fromEntries(BOT_IDS.map(id => [id, simBot(id, 'solo', N, 't')]));
const match = Object.fromEntries(BOT_IDS.map(id => [id, simBot(id, 'match', N, 't')]));
const line = r => `${r.bot}: floor ${r.floor.med} (${r.floor.p10}–${r.floor.p90}) · ${r.time.med.toFixed(0)} s · ≥120 ${(r.r120 * 100).toFixed(0)} % · ≥200 ${(r.r200 * 100).toFixed(0)} %${r.to200 ? ` · to 200 in ${r.to200.med.toFixed(0)} s` : ''} · dark ${r.causes.dark} · saved after a shatter ${(r.saved * 100).toFixed(0)} % of runs · longest stay ${r.stayMax.toFixed(1)} s · TV ${(r.terminal * 100).toFixed(0)} %`;

test('THE FOUR BOTS: SLOPPY · GOOD · GREAT · the HUMAN-PACED one (a 200 ms reaction, 1 turn a second) — each from its own seeded dice, each within MAX SPIN', () => {
  assert.deepEqual(BOT_IDS, ['sloppy', 'good', 'great', 'human']);
  assert.deepEqual([BOTS.human.react, BOTS.human.spin, BOTS.human.ahead, BOTS.human.dare], [12, 68, 0, 0], 'the human-paced bot: 12 ticks = 200 ms, 68 units a tick = 1 turn a second, never ahead of its reaction');
  for (const id of BOT_IDS) assert.ok(BOTS[id].spin < 171 && BOTS[id].aim > 0 && BOTS[id].react > 0);
  assert.ok(BOTS.sloppy.aim > BOTS.good.aim && BOTS.good.aim > BOTS.great.aim && BOTS.sloppy.react > BOTS.good.react && BOTS.good.react > BOTS.great.react && BOTS.sloppy.spin < BOTS.good.spin && BOTS.good.spin < BOTS.great.spin);
  const a = createRun({ seed: 'd', mode: 'solo' }), b = createRun({ seed: 'd', mode: 'solo' });
  playBot(a, makeBot('good', 'd')); playBot(b, makeBot('good', 'd'));
  assert.deepEqual(logOf(a), logOf(b), 'the same bot seed = the same run');
  assert.ok(isOver(a));
  assert.throws(() => makeBot('nobody'), /unknown bot/);
  console.log(`[freefall-sim] match, ${N} seeds — ${BOT_IDS.map(id => line(match[id])).join(' | ')}`);
  console.log(`[freefall-sim] solo — great: floor ${solo.great.floor.med} (${solo.great.floor.p10}–${solo.great.floor.p90}), ${solo.great.stopped} stopped at floor ${SOLO_STOP}`);
});

test('THE TARGETS (the floors): SLOPPY ≈ 50–80 (F1: 20–50 — before the landing after a shatter was made safe) · GOOD 120+ · the bots fall in order — and nobody is out in the first ten floors (no red there)', () => {
  const s = match.sloppy, g = match.good, h = match.human, G = match.great;
  assert.ok(s.floor.med >= 50 && s.floor.med <= 80, `sloppy: ${s.floor.med} floors`);
  assert.ok(s.floor.p10 >= 10 && s.floor.p90 <= 115, `sloppy's spread: ${s.floor.p10}–${s.floor.p90}`);
  assert.ok(s.r120 <= 0.03, 'a sloppy bot almost never sees the harbor');
  assert.ok(g.floor.med >= 120 && g.floor.med <= 160, `good: ${g.floor.med} floors`);
  assert.ok(g.r120 >= 0.55, `${(g.r120 * 100).toFixed(0)} % of the good runs reach floor 120`);
  assert.ok(g.r200 <= 0.05, 'the bottom is a feat: a good bot almost never gets there');
  for (const k of ['med', 'p10', 'p90']) assert.ok(s.floor[k] < g.floor[k] && g.floor[k] <= G.floor[k], `floors ${k} in order`);
  assert.ok(h.floor.med > s.floor.med && h.floor.med < 200, `the human-paced bot: ${h.floor.med} floors`);
  for (const id of BOT_IDS) assert.ok(match[id].floor.p10 >= 10, `${id}: nobody is out before the first red (floor 10)`);
});

test('THE TARGETS (GREAT): floor 200 in ≈ 2:30, MOST of its runs — inside the 3:00 cap', () => {
  const G = match.great;
  assert.ok(G.r200 >= 0.6, `${(G.r200 * 100).toFixed(0)} % of its runs make the bottom`);
  assert.ok(G.to200.med >= 135 && G.to200.med <= 165, `floor 200 at ${G.to200.med.toFixed(0)} s (≈ 2:30)`);
  assert.ok(G.to200.p90 * TICK_HZ < MODES.match.capTicks && G.to200.p10 >= 120, `… ${G.to200.p10.toFixed(0)}–${G.to200.p90.toFixed(0)} s`);
  assert.equal(G.floor.med, 200, 'a match ends at the finish');
  assert.equal(G.causes.cap, 0, 'the cap never stops a great run');
  assert.ok(G.perFloor > 0.5 && G.perFloor < 1.1, `about a bounce a floor (${G.perFloor.toFixed(2)})`);
  // SOLO goes on past the bottom: THE TRENCH ends a great run a few dozen floors in (the layout alone — the bounce + the fall never change)
  assert.ok(solo.great.floor.med > 200 && solo.great.floor.med < 400, `solo: floor ${solo.great.floor.med}`);
  assert.ok(solo.great.stopped <= N * 0.02, `${solo.great.stopped} of ${N} great runs were still falling at floor ${SOLO_STOP}`);
  assert.deepEqual([solo.sloppy.floor.med, solo.good.floor.med], [match.sloppy.floor.med, match.good.floor.med], 'above the bottom solo + match are the same game');
});

test('THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE (F3 — 3 s · a floor every 2 s · lead 3): NO bot run ends in the dark — GREAT, GOOD, the human, even SLOPPY (its longest stay on one floor is under the 6 s a stopped ball has); a run nobody touches is caught in 9 s, a ball that stops mid-run in ~6 s', () => {
  for (const id of BOT_IDS) {
    assert.equal(match[id].causes.dark, 0, `${id}: no run ends in the dark`);
    assert.equal(solo[id].causes.dark, 0);
    assert.ok(match[id].stayMax < DARK.lead * DARK.pace / TICK_HZ, `${id}: the longest stay on one floor ${match[id].stayMax.toFixed(1)} s — under the 6 s a stopped ball has`);
    if (id !== 'sloppy') assert.ok(match[id].stayMax < DARK.lead * DARK.pace / TICK_HZ / 2, `${id}: … and under half of it (${match[id].stayMax.toFixed(1)} s): the darkness is pressure, never a trap, for a player who plays`);
  }
  assert.equal(DARK.lead * DARK.pace / TICK_HZ, 6, 'a ball that stops moving has 6 s (JAYWALK\'s wall: ~8 s)');
  for (const mode of MODE_IDS) {
    const st = simStaller(40, mode, 't');
    assert.equal(st.dark, 40, 'every staller is taken by the darkness');
    assert.ok(st.lo >= 6 && st.hi <= 12, `${mode}: caught between ${st.lo} s and ${st.hi} s`);
  }
  // a mid-run staller: a good bot plays 40 floors, then lets go — caught 15 s after its last floor (± the bounces)
  for (let i = 0; i < 10; i++) {
    const run = createRun({ seed: `st${i}`, mode: 'match' });
    playBot(run, makeBot('great', `st${i}`), { maxFloor: 40 });
    if (isOver(run)) continue;
    const at = run.at;
    stepTo(run, MODES.match.capTicks);
    // (it may still drop a floor or two by itself — a gap under the ball, the blaze — then it stands: 15 s after its last floor)
    assert.ok(['dark', 'red'].includes(resultOf(run).cause));
    if (run.cause === 'dark') assert.equal(run.end, run.at + DARK.lead * DARK.pace, `seed st${i}: out exactly lead × pace after its last floor`);
    assert.ok((run.end - at) / TICK_HZ <= 25);
  }
});

test('THE BLAZE + TERMINAL VELOCITY in the sims: every bot lights the blaze; the feat (15 floors without a bounce) is a DARING player\'s — the careful bots almost never get it, a daring one often does', () => {
  for (const id of BOT_IDS) assert.ok(match[id].blazes >= 1, `${id}: ${match[id].blazes.toFixed(1)} blazes a run`);
  assert.ok(match.sloppy.terminal <= 0.03 && match.good.terminal <= 0.1 && match.great.terminal <= 0.2);
  const daring = simBot('great', 'match', 120, 't', undefined, { ...BOTS, great: { ...BOTS.great, dare: 900 } });
  assert.ok(daring.terminal >= 0.25, `a great bot that dares the far gaps: ${(daring.terminal * 100).toFixed(0)} % of its runs earn TERMINAL VELOCITY`);
  assert.ok(daring.to200.med < match.great.to200.med, 'and it is faster to the bottom');
  // (F2 — the owner's rule b: the landing RIGHT AFTER A SHATTER is never an out. How often it saves a run: the careless far more than the careful)
  assert.ok(match.sloppy.saved > 0.3 && match.sloppy.saved > 5 * match.great.saved, `saved by the shatter rule: sloppy ${(match.sloppy.saved * 100).toFixed(0)} % of runs · great ${(match.great.saved * 100).toFixed(0)} %`);
  for (const id of BOT_IDS) assert.equal(match[id].afterShatter, 0, 'nobody is out on the floor a shatter dropped them to without a bounce there first');
  assert.equal(BOUNCE > FALL, true);
});

test('THE SIMS PLAY THE REAL RULES: every bot log is one THE JUDGE accepts', () => {
  for (const id of BOT_IDS) for (const mode of MODE_IDS) for (let i = 0; i < 6; i++) {
    const seed = `j-${id}-${mode}-${i}`, run = createRun({ seed, mode });
    playBot(run, makeBot(id, seed), { maxFloor: 300 });
    stepTo(run, MODES[mode].capTicks);
    const v = judgeRun({ seed, mode, log: logOf(run) });
    assert.equal(v.ok, true, `${seed}: ${v.why}`);
    assert.deepEqual([v.floor, v.tick, v.cause], [run.floor, run.at, run.st === 'out' ? run.cause : run.st]);
  }
});

// ---- F2 — THE PROOF: FLOORS 0–199 DID NOT MOVE (docs/games/passes/freefall-f2.md "THE SIMS PROOF"). The digests were taken on F1's last
// commit (639f7fca) BEFORE any rule changed: the four bots × 60 seeds, every log + every result, tick for tick.
const plainRow = () => { const p = JSON.parse(JSON.stringify(RULE_SETS.classic)); delete p.reach; delete p.hop; return p; };
function digest(mode, rules, maxFloor) {
  const g = createHash('sha256');
  for (const id of BOT_IDS) for (let k = 0; k < 60; k++) {
    const seed = `p${k}`, run = createRun({ seed, mode, rules });
    if (maxFloor) { playBot(run, makeBot(id, seed), { maxFloor }); g.update(JSON.stringify([logOf(run).filter(e => !e.k), run.floor, run.at, run.st, run.cause, run.bounces, run.shatters, run.blazes, run.maxNb])); continue; }
    playBot(run, makeBot(id, seed));
    stepTo(run, run.R.modes[mode].capTicks);
    const r = resultOf(run); delete r.rules; delete r.holds;
    g.update(JSON.stringify([logOf(run).filter(e => !e.k), r]));
  }
  return g.digest('hex').slice(0, 16);
}
test('F2 — THE PROOF, floors 0–199 did not move: on a row WITHOUT the shatter rule every bot run of F1 replays TICK FOR TICK (match · daily · solo down to floor 200 — F1\'s digests); the rule itself is the only thing that moves a run above THE TRENCH; MOVING RED never touches a match', () => {
  const f1 = makeRuleSet({ ...plainRow(), id: 'f1', shatterSafe: false });
  assert.equal(digest('match', f1), '4ec096827cfbf061', 'MATCH: F1, tick for tick (240 bot runs)');
  assert.equal(digest('daily', f1), '4ec096827cfbf061', 'DAILY: F1, tick for tick');
  assert.equal(digest('solo', f1, 200), '4ea09f57d0694530', 'SOLO down to floor 200: F1, tick for tick');
  // MOVING RED changes nothing in a match / the daily / solo above the trench: a row without it = the classic row, tick for tick
  const still = makeRuleSet({ ...plainRow(), id: 'still', gen: { ...plainRow().gen, move: null } });
  for (const [mode, to] of [['match', 0], ['daily', 0], ['solo', 200]]) assert.equal(digest(mode, still, to), digest(mode, undefined, to), `${mode}: the moving red is THE TRENCH's alone`);
  assert.notEqual(digest('match', undefined), '4ec096827cfbf061', 'the shatter rule itself does change runs (that is its point)');
});

test('F2 — THE TRENCH KEEPS GETTING HARDER (solo, the GREAT bot — the only one that lives there): with MOVING RED its runs end sooner in the trench than on F1\'s static layout, and almost nobody is still falling at floor 600', () => {
  const still = makeRuleSet({ ...plainRow(), id: 'still', gen: { ...plainRow().gen, move: null } });
  const a = simBot('great', 'solo', 300, 't'), b = simBot('great', 'solo', 300, 't', still);
  console.log(`[freefall-sim] THE TRENCH, great solo, 300 seeds — moving red: floor ${a.floor.med} (${a.floor.p10}–${a.floor.p90}), ${a.trench.toFixed(0)} trench floors a run, ${a.stopped} at floor ${SOLO_STOP} · static (F1's layout): floor ${b.floor.med} (${b.floor.p10}–${b.floor.p90}), ${b.trench.toFixed(0)} trench floors a run, ${b.stopped} at floor ${SOLO_STOP}`);
  assert.equal(a.r200, b.r200, 'the same runs reach THE BOTTOM (nothing moved above it)');
  assert.ok(a.trench < b.trench * 0.92, `trench floors a run: ${a.trench.toFixed(0)} with moving red · ${b.trench.toFixed(0)} without`);
  assert.ok(a.floor.p90 < b.floor.p90, `the deepest tenth: floor ${a.floor.p90} · ${b.floor.p90}`);
  assert.ok(a.stopped <= b.stopped && a.stopped <= 2);
});
