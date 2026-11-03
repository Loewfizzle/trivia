// LEVELS 1–100 (PROGRESSION A): the curve, the bands, the rewards table, the carry-over — and THE YEAR SIM: a regular's year on the
// server's own step (core/progress.js#matchStep, real match XP), proving the bands land where the owner set them (plan.md "THE LEVEL PACE").
import '../api/_lib/catalog.js';   // (THE VAULT 1B: the server-only catalog — names, rewards, achievements)
import test from 'node:test';
import assert from 'node:assert/strict';
import { XP_AT, MAX_LEVEL, BANDS, levelOf, levelInfo, bandOf, emblemRank, levelLabel, LEVEL_REWARDS, rewardsBetween, rewardsUpTo, nextRewardLevel } from '../js/core/levels.js';
import { ITEM } from '../js/core/items.js';
import { matchStep, carryOver } from '../js/core/progress.js';
import { RANKS } from '../js/core/ranks.js';
import { rngFrom } from '../js/core/rng.js';

test('the curve: fitted to the old rank thresholds, every level costs at least the one before', () => {
  assert.equal(XP_AT[1], 0);
  assert.equal(XP_AT[5], 250);      // REGULAR (old)
  assert.equal(XP_AT[20], 2000);    // INSIDER (old)
  assert.equal(XP_AT[40], 7500);    // MADE (old)
  assert.equal(XP_AT[70], 25000);   // LEGEND (old)
  assert.equal(XP_AT[100], 45000);  // OWNER
  for (let L = 2; L < MAX_LEVEL; L++) assert.ok(XP_AT[L + 1] - XP_AT[L] >= XP_AT[L] - XP_AT[L - 1], `level ${L + 1} costs no less than ${L}`);
  assert.ok(XP_AT[2] - XP_AT[1] <= 60, 'the first match levels you up');
  for (const b of BANDS) assert.equal(XP_AT[b.from], b.xp, `${b.name} starts at its XP`);
  // the old ranks' lines are the bands' lines; the emblem index follows the old rank
  for (let i = 0; i < RANKS.length; i++) { assert.equal(BANDS[i].xp, RANKS[i].xp); assert.equal(emblemRank(RANKS[i].xp), i); }
});

test('levelOf / levelInfo / bands', () => {
  assert.equal(levelOf(0), 1); assert.equal(levelOf(39), 1); assert.equal(levelOf(40), 2);
  assert.equal(levelOf(249), 4); assert.equal(levelOf(250), 5); assert.equal(levelOf(1e9), 100);
  assert.equal(bandOf(4).name, 'NEWCOMER'); assert.equal(bandOf(5).name, 'REGULAR'); assert.equal(bandOf(19).name, 'REGULAR');
  assert.equal(bandOf(20).name, 'INSIDER'); assert.equal(bandOf(69).name, 'MADE'); assert.equal(bandOf(99).name, 'LEGEND'); assert.equal(bandOf(100).name, 'OWNER');
  const i = levelInfo(XP_AT[23] + 10);
  assert.equal(i.lvl, 23); assert.equal(i.into, 10); assert.equal(i.need, XP_AT[24] - XP_AT[23] - 10); assert.ok(i.frac > 0 && i.frac < 1);
  assert.deepEqual([levelInfo(60000).lvl, levelInfo(60000).frac, levelInfo(60000).max], [100, 1, true]);
  assert.equal(levelOf(44999), 99); assert.equal(levelOf(45000), 100);
  assert.equal(levelLabel(XP_AT[23]), 'INSIDER · LEVEL 23');
  assert.equal(emblemRank(45000), 4, 'OWNER wears LEGEND’s emblem until THE VAULT');
});

test('the rewards table: ~25–38 rewards (THE VAULT 1A: + HEARTBREAKER at 4 + GLITTER BOMB at 8; 1B: + SMOKE ROOM 12 · FROSTBITE 16 · PRISM 22 · INFERNO 42), every id a real item, the Gilded family at 10 / 25 / 40 / 60, THE HOUSE at 100', () => {
  assert.ok(LEVEL_REWARDS.length >= 25 && LEVEL_REWARDS.length <= 38, `${LEVEL_REWARDS.length} rewards`);
  for (const r of LEVEL_REWARDS) assert.ok(ITEM[r.item], `${r.item} is an item`);
  const at = id => LEVEL_REWARDS.find(r => r.item === id).lvl;
  assert.deepEqual(['card-emerald', 'card-champagne', 'card-rosegold', 'card-sapphire'].map(at), [10, 25, 40, 60]);
  assert.ok(at('card-neonglass') > 10 && at('card-neonglass') < 25 && at('card-velvet') > 25 && at('card-velvet') < 40, 'NEON GLASS + VELVET ROOM between');
  assert.equal(at('card-house'), 100);
  // today's VAULT folded in (the old finishes + glows are level rewards now)
  for (const id of ['card-midnight', 'card-brass', 'card-chrome', 'card-aurora', 'card-gold', 'card-noir', 'card-legend', 'glow-ice', 'glow-neon', 'glow-gold', 'glow-prism']) assert.ok(LEVEL_REWARDS.some(r => r.item === id), id);
  assert.deepEqual(rewardsBetween(9, 10), ['card-emerald']);
  assert.deepEqual(rewardsBetween(10, 10), []);
  assert.ok(rewardsUpTo(1).includes('card-gilded'));
  assert.equal(nextRewardLevel(23), 25); assert.equal(nextRewardLevel(100), null);
});

const row = (rank, n) => ({ rank, win: rank === 1, c: { p: 1, ...(rank === 1 ? { w: 1 } : {}) }, rec: {} });

test('matchStep: levels + their rewards, idempotent, the carry-over', () => {
  const now = Date.UTC(2026, 10, 3, 1, 0);
  const a = matchStep(null, { key: 'ABCD_m1', gid: 'prism', row: row(1, 4), n: 4, now });
  assert.ok(a.xp.total > 40);
  assert.ok(a.lv.to >= 2, 'the first match levels you up');
  assert.ok(a.items.includes('card-gilded'));
  assert.ok(!a.xp.parts.some(p => p.k === 'streak'), 'no streak XP any more');
  assert.equal(matchStep(a.next, { key: 'ABCD_m1', gid: 'prism', row: row(1, 4), n: 4, now: now + 60e3 }).skip, 'counted');
  // a profile from before levels: 8,000 XP, no items → the first match grants every reward up to its level
  const old = { xp: 8000, g: { prism: { p: 90, w: 30 } } };
  const b = matchStep(old, { key: 'ABCD_m2', gid: 'prism', row: row(3, 4), n: 4, now });
  for (const id of rewardsUpTo(levelOf(8000))) assert.ok(b.next.it[id], `carried over ${id}`);
  // … and the `me` call does the same without a match; twice is a no-op
  const c = carryOver(old, now);
  assert.ok(c && c.items.includes('card-chrome') && c.items.includes('card-rosegold'));
  assert.equal(carryOver(c.next, now), null);
});

// THE YEAR SIM — "a year of ~3 matches a night" (the owner). REGULAR PLAY = 3 matches a night EVERY OTHER NIGHT (~3.5 nights a week), the
// two playable games alternating, 4-player rooms (placings drawn fairly), a personal best now and then — on the server's own step.
test('THE YEAR SIM: the bands land where the owner set them', () => {
  const rnd = rngFrom(20261102);
  let s = null, k = 0;
  const reached = {};
  const t0 = Date.UTC(2026, 10, 3, 0, 30);   // Mon Nov 2, 7:30 pm Eastern
  for (let day = 0; day < 450; day++) {
    if (day % 2) continue;
    for (let m = 0; m < 3; m++) {
      const gid = m % 2 ? 'overclock' : 'prism';
      const rank = 1 + Math.floor(rnd() * 4);
      const rec = rnd() < 0.15 ? { [gid === 'prism' ? 'prism-rush' : 'overclock-std']: 1000 + k * 7 } : {};
      const r = matchStep(s, { key: `ROOM_m${k++}`, gid, row: { ...row(rank, 4), rec }, n: 4, now: t0 + day * 864e5 + m * 15 * 60e3 });
      s = r.next;
      const lvl = levelOf(s.xp);
      for (const b of BANDS) if (lvl >= b.from && reached[b.name] == null) reached[b.name] = day;
    }
  }
  console.log('  THE YEAR SIM — the first day in each band:', Object.entries(reached).map(([b, d]) => `${b} day ${d}`).join(' · '), `· XP after 450 days ${s.xp}`);
  assert.equal(reached.NEWCOMER, 0);
  assert.ok(reached.REGULAR <= 2, `REGULAR on night one or two (day ${reached.REGULAR})`);
  assert.ok(reached.INSIDER >= 10 && reached.INSIDER <= 35, `INSIDER after the first couple of weeks (day ${reached.INSIDER})`);
  assert.ok(reached.MADE >= 45 && reached.MADE <= 110, `MADE after ~2–3 months (day ${reached.MADE})`);
  assert.ok(reached.LEGEND >= 150 && reached.LEGEND <= 230, `LEGEND at ~5–7.5 months (day ${reached.LEGEND})`);
  assert.ok(reached.OWNER >= 300 && reached.OWNER <= 420, `OWNER at ~a year (day ${reached.OWNER})`);
});
