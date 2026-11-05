// THE SPEED PASS add-on — THE PROGRESS RESET's rules (js/core/reset.js, PURE): progress goes, every reward stays
import test from 'node:test';
import assert from 'node:assert/strict';
import { resetStats, resetProfile, resetCost, previewLine, nextUnownedLevel, RESET_STATS } from '../js/core/reset.js';

const S = {
  xp: 12340, g: { overclock: { p: 9, w: 4 } }, gw: { overclock: { p: 2 } }, wk: 'w20261102', b: { 'overclock-score': { a: 900 } }, day: { k: 'd20261104', g: {} },
  gd: 'w20261102', pa: { wins: 4 }, ac: { 'first-round': 1 }, dl: { n: 3 }, st: { n: 5, d: 'd20261104', b: 7, f: 2, h: {} },
  it: { 'card-gilded': 1, 'card-founder': 2, 'card-dev-switchboard': 3, 'glow-ember': 4 }, fv: 1, m: { k1: 1 }, ov: [{ c: 'X' }], fd: 1, last: 99, zz: 'a future field',
};

test('progress goes: XP, mastery + per-match counters, the week, records, achievements, dailies, the streak (its freezes stay)', () => {
  const r = resetStats(S);
  for (const k of RESET_STATS) if (k !== 'st') assert.equal(r[k], undefined, `${k} cleared`);
  assert.deepEqual(r.st, { f: 2 }, 'the streak starts again with the freezes held');
  assert.equal(resetStats({ ...S, st: { n: 3, f: 0 } }).st, undefined, 'no freezes → no streak node');
});

test('every reward stays: items (the 1-of-1s + FOUNDING MEMBER), favors, the counted-match keys, the founder flag, unknown fields', () => {
  const r = resetStats(S);
  assert.deepEqual(r.it, S.it); assert.equal(r.fv, 1); assert.deepEqual(r.m, S.m); assert.deepEqual(r.ov, S.ov); assert.equal(r.fd, 1); assert.equal(r.last, 99); assert.equal(r.zz, 'a future field');
  assert.equal(resetStats(null), null);
  assert.deepEqual(resetProfile(), { x: 0, l: 1, r: 0, s: null, sd: null, m: 0 });
});

test('a second reset changes nothing; the preview line; the next level with a reward NOT owned', () => {
  const once = resetStats(S);
  assert.deepEqual(resetStats(once), once, 'idempotent');
  assert.deepEqual(resetCost(once), { xp: 0, records: 0, achievements: 0, streak: 0, items: 0 });
  assert.equal(previewLine({ profiles: 46, xp: 12340, records: 9, achievements: 31, streaks: 4, items: 0 }), '46 profiles · 12,340 XP · 9 board records · 31 achievements · 4 streaks will be reset; 0 items removed');
  const L = [{ lvl: 3, item: 'a' }, { lvl: 5, item: 'b' }, { lvl: 8, item: 'c' }];
  assert.equal(nextUnownedLevel(L, 1, { a: 1, b: 1 }), 8, 'levels 3 + 5 already owned → the tease names 8');
  assert.equal(nextUnownedLevel(L, 1, {}), 3);
  assert.equal(nextUnownedLevel(L, 8, {}), null);
});
