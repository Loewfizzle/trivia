// CITY B — GROUP 6: GLITTER BOMB TO LEVEL 50 (api/_lib/catalog.js#LEVEL_REWARD_ROWS — it was LV 8). The reward table takes two rewards at one
// level (70 + 100 already do), so it stands at 50 beside GLOW GOLD. A player who already owns it keeps it (grant never takes an item away);
// nothing is re-granted; the level-up + the vault's "unlocks at" read the table (displayOf's `lv`); THE VAGUE TEASE drops level 8.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_REWARD_ROWS, displayOf } from '../api/_lib/catalog.js';
import { rewardsBetween, rewardsUpTo, REWARD_LEVELS, XP_AT, levelOf } from '../js/core/levels.js';
import { grant, carryOver } from '../js/core/progress.js';

test('CITY B: GLITTER BOMB unlocks at LV 50 beside GLOW GOLD — no longer at 8', () => {
  assert.deepEqual(LEVEL_REWARD_ROWS.filter(r => r.item === 'card-glitter').map(r => r.lvl), [50]);
  assert.deepEqual(LEVEL_REWARD_ROWS.filter(r => r.lvl === 50).map(r => r.item).sort(), ['card-glitter', 'glow-gold']);
  assert.ok(!rewardsBetween(7, 8).includes('card-glitter'), 'reaching LV 8 gives nothing now');
  assert.deepEqual(rewardsBetween(49, 50).sort(), ['card-glitter', 'glow-gold'], 'reaching LV 50 gives both');
  assert.equal(displayOf(['card-glitter'])['card-glitter'].lv, 50, 'the vault + the level-up read the new level');
  // THE VAGUE TEASE: exactly the table's levels (8 out, 50 in)
  assert.deepEqual([...REWARD_LEVELS], [...new Set(LEVEL_REWARD_ROWS.map(r => r.lvl))].sort((a, b) => a - b));
});

test('CITY B: an owner keeps GLITTER BOMB (never taken away) + nothing is re-granted; a new LV 8–49 player no longer gets it', () => {
  const xp20 = XP_AT ? XP_AT[20] : null;
  const had = { xp: xp20 || 0, it: { 'card-glitter': 111, 'card-gilded': 100 } };
  const next = { ...had }, got = grant(next, rewardsUpTo(levelOf(had.xp)), 999);
  assert.equal(next.it['card-glitter'], 111, 'kept, with its own date (not re-granted)');
  assert.ok(!got.includes('card-glitter'));
  const c = carryOver(had, 999);
  assert.equal(((c && c.next.it) || had.it)['card-glitter'], 111);
  if (xp20) assert.ok(!rewardsUpTo(levelOf(xp20)).includes('card-glitter'), 'a level-20 newcomer does not get it until 50');
});
