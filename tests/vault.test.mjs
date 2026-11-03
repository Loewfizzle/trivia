// THE VAULT 1A (PURE): THE CARD LAB's catalog + marks, THE PROMINENCE RULE, the strips' looks + the effect library's registry, THE TIER
// TABLE's fx rows, the new items + the pink pair's early level rewards.
import '../api/_lib/catalog.js';   // (THE VAULT 1B: the server-only catalog — names, rewards, achievements)
import { LAB_TEXT } from '../api/_lib/lab-text.js';
import { registerLabText } from '../js/vault/catalog.js';
registerLabText(LAB_TEXT);
import test from 'node:test';
import assert from 'node:assert/strict';
import { LAB, LAB_IDS, MARKS, cleanMark, NOTE_MAX, GUESTS } from '../js/vault/catalog.js';
import { ITEM } from '../js/core/items.js';
import { LEVEL_REWARDS } from '../js/core/levels.js';
import { tierVal } from '../js/core/harbor-tiers.js';

test('THE LAB\'s catalog: the 8 approved samples (1 common · 2 uncommon · 2 rare · 2 epic · 1 legendary) + 2 test emblems, every card a real item', () => {
  const cards = LAB.filter(x => x.kind === 'card' && x.n <= 8);   // (the 1A samples; 1B's launch set: its own test)
  assert.deepEqual(cards.map(x => x.name), ['BRUSHED GOLD', 'SMOKE ROOM', 'FROSTBITE', 'INFERNO', 'PRISM', 'THE MARQUEE', 'GLITTER BOMB', 'I WANT TO BELIEVE']);
  assert.deepEqual(cards.map(x => x.tier), ['common', 'uncommon', 'uncommon', 'rare', 'rare', 'epic', 'epic', 'legendary']);
  for (const c of cards) { assert.ok(ITEM[c.id], `${c.id} is an item`); assert.equal(ITEM[c.id].name, c.name); assert.equal(ITEM[c.id].tier, c.tier, `${c.id}: the item's tier`); }
  assert.deepEqual(LAB.filter(x => x.kind === 'emblem' && x.n < 90).map(x => x.id), ['emb-test-neon', 'emb-test-prism'], "1A's two test emblems (2A's samples: tests/vault-2a.test.mjs)");
  assert.equal(new Set(LAB_IDS).size, LAB_IDS.length); assert.equal(GUESTS.length, 8);
});

test('THE MARKS: approve · fix · cut · null (a clear); notes trimmed, control characters out, capped; anything else refused', () => {
  assert.deepEqual(MARKS, ['approve', 'fix', 'cut']);
  assert.deepEqual(cleanMark('card-smoke', 'fix', '  thicker\nsmoke  '), { m: 'fix', note: 'thicker smoke' });
  assert.deepEqual(cleanMark('card-smoke', null, 'x'), { m: null, note: 'x' });
  assert.equal(cleanMark('card-nope', 'approve'), null); assert.equal(cleanMark('card-smoke', 'love'), null);
  assert.equal(cleanMark('card-smoke', 'fix', 'y'.repeat(999)).note.length, NOTE_MAX);
  assert.equal(cleanMark('card-smoke', 'approve', 42).note, '');
});

test('THE PROMINENCE RULE: the higher tier leads — a still common card + a rare emblem → the emblem leads; a legendary card → it plays quieter', async () => {
  const { prominence } = await import('../js/vault/emblems.js');
  assert.equal(prominence('common', 'rare'), 'lead');
  assert.equal(prominence('common', 'common'), 'even');
  assert.equal(prominence('legendary', 'common'), 'quiet');
  assert.equal(prominence('legendary', 'rare'), 'quiet');
  assert.equal(prominence('epic', 'rare'), 'even');
  assert.equal(prominence('legendary', 'legendary'), 'quiet', '2A: a legendary card always leads (its emblem + glow hold still)');
  assert.equal(prominence('rare', 'epic'), 'lead');
});

test('THE PINK PAIR: HEARTBREAKER (uncommon) + GLITTER BOMB (epic) — EARLY level rewards; no PINK CHAMPAGNE', () => {
  const at = id => (LEVEL_REWARDS.find(r => r.item === id) || {}).lvl;
  assert.equal(at('card-heartbreaker'), 4); assert.equal(at('card-glitter'), 8);
  assert.equal(ITEM['card-heartbreaker'].tier, 'uncommon'); assert.equal(ITEM['card-glitter'].tier, 'epic');
  assert.ok(!Object.keys(ITEM).some(k => /champagne/i.test(k) && ITEM[k].tier === 'rare' && /pink/i.test(ITEM[k].name)), 'no pink champagne card');
  const lv = LEVEL_REWARDS.map(r => r.lvl); assert.deepEqual([...lv].sort((a, b) => a - b), lv, 'the table stays in level order');
});

test('THE TIER TABLE: the effect library\'s rows (a stronger tier never draws less)', () => {
  for (const k of ['fxDpr', 'fxParticles']) { const v = [0, 1, 2].map(t => tierVal(k, t)); assert.ok(v[0] <= v[1] && v[1] <= v[2], `${k} ${v}`); }
  assert.equal(tierVal('fxDpr', 2), 20); assert.equal(tierVal('fxParticles', 2), 100);
});

test('THE STRIPS: every lab card has its look (a material + an effect in the registry, the common STILL), every effect drawable', async () => {
  globalThis.document ??= undefined;
  const { LOOKS } = await import('../js/vault/strip.js').catch(e => ({ LOOKS: null, e }));
  if (!LOOKS) return;   // (the strip module touches the DOM at import in some runtimes — the browser suite covers it)
  const { FX } = await import('../js/fx/index.js');
  for (const c of LAB.filter(x => x.kind === 'card')) {
    const L = LOOKS[c.id]; assert.ok(L && L.mat, `${c.id} has a material`);
    if (c.tier === 'common') assert.equal(L.fx, null, 'COMMONS STAY STILL'); else { assert.ok(FX[L.fx], `${c.id}: ${L.fx} in the registry`); assert.equal(typeof FX[L.fx].draw, 'function'); }
  }
  assert.ok(FX.laser && FX.ufo, 'THE BORDER LASER + the UFO');
});
