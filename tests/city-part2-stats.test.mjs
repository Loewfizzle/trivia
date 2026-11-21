// CITY PART 2 — STATS → MATCHES PER DAY GETS A PLAYERS LINE (the owner, Nov 20): the DIFFERENT accounts that played ANYTHING a day — room
// matches + verified solo runs (results/…/o) + daily finishes — DON'T COUNT + removed test accounts left out; ONE snapshot (statsSnap v 3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { playersPerDay, summarize, lastDays } from '../js/core/insights.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const NOW = Date.UTC(2026, 10, 20, 18);   // (Nov 20, 1 pm ET)
const D = lastDays(NOW, 30), today = D[29], yday = D[28];

test('the per-day DISTINCT count: an account once a day however much it played; matches + solo runs + daily finishes; DON\'T COUNT + no profile left out', () => {
  const at = Date.UTC(2026, 10, 20, 17), at1 = at - 864e5;
  const done = [{ at, o: { a: 1, b: 2 } }, { at, o: { a: 1 } }, { at: at1, o: { c: 1 } }, { at, o: { gone: 1 } }, { at, o: { nc: 1 } }];
  const profiles = { a: {}, b: {}, c: {}, d: {}, nc: {} };
  const P = playersPerDay(done, { [today]: ['a', 'd'], [yday]: ['c'] }, profiles, { nc: { at: 1 } }, D);
  assert.equal(P[today], 3, 'a + b (matches) + d (a daily finish); a once; gone (no profile) + nc (DON\'T COUNT) out');
  assert.equal(P[yday], 1, 'c played a match AND finished a daily: once');
  assert.equal(P[D[0]], 0);
});

test('summarize hands the line out with the bars (games.daily[i].p) — one scale, the same 30 days; the sheet draws it, the snapshot is v 3', () => {
  const S = summarize({ results: { r1: { st: 'done', at: Date.UTC(2026, 10, 20, 17), g: 'prism', o: { a: 1, b: 1 } } }, profiles: { a: {}, b: {} }, now: NOW, dailyFin: { [today]: ['a'] } });
  const last = S.games.daily.at(-1);
  assert.deepEqual([last.k, last.n, last.p], [today, 1, 2]);
  assert.equal(S.games.daily.length, 30);
  const v = read('js/admin/stats-view.js');
  assert.ok(v.includes("h('div.st-pl'") && v.includes("D[i].p === 1 ? 'PLAYER' : 'PLAYERS'"), 'the pink line + the tap\'s two numbers');
  assert.ok(read('api/admin.js').includes("set({ v: 3, at: now, data: clean })") && read('api/admin.js').includes('dailyFin: fin, skip: nc || {}'));
});
