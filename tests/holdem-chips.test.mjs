// HOLD'EM (HE5) — THE REAL CHIPS' arithmetic (chips.js, PURE): the fewest chips in the six colours, a bet ≤ 3 stacks of ≤ 6, the pot capped too,
// the art shipped small (12 WebPs) + read by the preload.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { chipStacks, chipCount, DENOMS, BET, POT, COLORS } from '../js/games/holdem/chips.js';

const value = st => st.reduce((n, s) => n + s.n * s.value, 0);

test('THE COLOURS: 5 red · 25 green · 100 black · 500 purple · 1K yellow · 5K orange; the fewest chips (the biggest first)', () => {
  assert.deepEqual(DENOMS.map(([v, c]) => `${v}:${c}`), ['5000:orange', '1000:yellow', '500:purple', '100:black', '25:green', '5:red']);
  assert.deepEqual(chipStacks(20), [{ color: 'red', value: 5, n: 4 }]);
  assert.deepEqual(chipStacks(175).map(s => [s.color, s.n]), [['black', 1], ['green', 3]]);
  assert.deepEqual(chipStacks(1500).map(s => [s.color, s.n]), [['yellow', 1], ['purple', 1]]);
  assert.deepEqual(chipStacks(0), []);
  assert.deepEqual(chipStacks(3), [{ color: 'red', value: 5, n: 1 }], 'a tiny amount still shows a chip');
  for (const a of [5, 30, 95, 120, 640, 1325, 2995, 4995]) { const s = chipStacks(a, { maxStacks: 9, maxPer: 99 }); assert.equal(value(s), a, `${a} exactly when uncapped`); }
});

test('THE CAPS: a bet ≤ 3 stacks of ≤ 6 (a seat: 2 — the rail\'s room); the pot ≤ 3 of ≤ 8; a big value splits into more stacks', () => {
  for (let a = 5; a < 60000; a += 35) {
    const b = chipStacks(a, BET), p = chipStacks(a, POT);
    assert.ok(b.length <= 3 && b.every(s => s.n <= 6), `bet ${a}`);
    assert.ok(p.length <= 3 && p.every(s => s.n <= 8), `pot ${a}`);
    assert.ok(chipStacks(a, { ...BET, maxStacks: 2 }).length <= 2);
  }
  assert.deepEqual(chipStacks(45000, BET).map(s => [s.color, s.n]), [['orange', 6], ['orange', 3]], '9 orange → 6 + 3');
  assert.equal(chipCount(chipStacks(45000, BET)), 9);
});

test('THE ART: 12 small WebPs (a top + a side per colour, ≤ 50 KB in all), preloaded with the cartridge', () => {
  const files = readdirSync('assets/holdem/chips');
  assert.deepEqual(files.sort(), COLORS.flatMap(c => [`chip-${c}-side.webp`, `chip-${c}-top.webp`]).sort());
  const total = files.reduce((n, f) => n + statSync(`assets/holdem/chips/${f}`).size, 0);
  assert.ok(total < 50_000, `${total} B`);
  assert.match(readFileSync('js/games/holdem/index.js', 'utf8'), /chips\/chip-\$\{c\}-top\.webp/);
});
