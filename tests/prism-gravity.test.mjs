// PFIX-3 (FABLE REVIEW 2 — S6) — GRAVITY IS A TABLE: THE DROP rests on the phone and the server stepping BIT-IDENTICALLY, and Safari's engine
// computes Math.pow with different last bits than node's (8 of THE DROP's 12 levels, 1–3 bits). js/games/prism/engine.js#GRAVITY_MS holds
// node's exact values; this pins every BIT — the table = the old formula on this machine (the server's results are unchanged), and the
// literal bit patterns below never move (a table edited by hand, or a JS engine that parses a literal differently, goes red).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gravityMs, GRAVITY_MS, TICK } from '../js/games/prism/engine.js';
import { battleLevel } from '../js/games/prism/logic.js';
import { createDropRun, input, stepTo, replay } from '../js/games/prism/drop.js';
import { dropKey } from '../js/games/prism/bot.js';
import { rngFrom } from '../js/core/rng.js';

const bits = v => new BigUint64Array(new Float64Array([v]).buffer)[0].toString(16).padStart(16, '0');
const BITS = ['408f400000000000', '4088c80000000000', '40834e5e353f7cee', '407d8baa8da7f3d0', '407633269e3e32db', '4070600e8a6bff2d', '4067b5abfe676c94', '4060d782ea330604',
  '40577876c41ba19c', '405009b39167495c', '40457cf608291bb3', '403c37b9bb7d44ec', '403227408a17f3b6',
  '4030aaaaaaaaaaab', '4030aaaaaaaaaaab', '4030aaaaaaaaaaab', '4030aaaaaaaaaaab', '4030aaaaaaaaaaab', '4030aaaaaaaaaaab', '4030aaaaaaaaaaab'];

test('the table\'s 20 values, bit for bit — and equal to the old Math.pow formula in node (nothing changes on the server)', () => {
  assert.equal(GRAVITY_MS.length, 20);
  for (let l = 1; l <= 20; l++) {
    assert.equal(bits(gravityMs(l)), BITS[l - 1], `level ${l}`);
    assert.equal(bits(gravityMs(l)), bits(Math.max(1000 * Math.pow(0.8 - (l - 1) * 0.007, l - 1), 1000 / 60)), `level ${l} = the formula in node`);
  }
  assert.equal(gravityMs(0), GRAVITY_MS[0]); assert.equal(gravityMs(99), GRAVITY_MS[19], 'clamped 1 … 20');
  assert.ok(Object.isFrozen(GRAVITY_MS));
  // THE DROP's levels are whole numbers 1 … 12 — always the table, never the formula
  for (let t = 0; t <= 480_000; t += 5000) { const l = battleLevel(t); assert.ok(Number.isInteger(l) && l >= 1 && l <= 12, `battleLevel(${t}) = ${l}`); }
  assert.match(String(gravityMs), /Number\.isInteger\(l\) \? GRAVITY_MS\[l - 1\]/);
});

test('a whole DROP run still replays to the same tick, lines and pieces through the table', () => {
  const run = createDropRun('424242'); let plan = null; const rnd = rngFrom('grav');
  for (let k = 0; !run.over && k < 57_600; k += 9) { stepTo(run, k); if (run.over) break; const x = dropKey(run.eng, plan, { rnd }); plan = x.plan; if (x.code) input(run, x.code); }
  if (!run.over) stepTo(run, 57_600);
  const R = replay(run.log, '424242', { to: run.k, final: true });
  assert.ok(R.ok, R.refused);
  assert.equal(R.k, run.k); assert.equal(R.lines, run.eng.lines); assert.equal(R.pieces, run.eng.stats.pieces);
  assert.ok(run.k * TICK > 20_000, 'a real run');
});
