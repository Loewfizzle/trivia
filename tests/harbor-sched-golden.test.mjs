// SCHED — THE GOLDEN TABLE (tests/fixtures/sched-golden.mjs): every timed planner's decisions over a year (2 zones × 2 seeds, hashed per
// month) must match the fixture written before its knobs moved into THE CITY TIMETABLE — a move is never a behaviour change.
// A difference: `node scripts/sched-golden.mjs` names the system + month, `--raw <system>` prints its values to compare.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { goldenTable } from './fixtures/sched-golden.mjs';

test('THE GOLDEN TABLE: every planner decides the same year as the fixture', () => {
  const G = JSON.parse(readFileSync(new URL('./fixtures/sched-golden.json', import.meta.url), 'utf8')), T = goldenTable(), diff = [];
  for (const id of new Set([...Object.keys(G), ...Object.keys(T)])) for (const mk of new Set([...Object.keys(G[id] || {}), ...Object.keys(T[id] || {})])) if ((G[id] || {})[mk] !== (T[id] || {})[mk]) diff.push(`${id} ${mk}`);
  assert.deepEqual(diff.slice(0, 20), [], `${diff.length} month(s) differ — node scripts/sched-golden.mjs`);
});
