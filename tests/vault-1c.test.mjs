// THE VAULT 1C (PURE): the 8 sighting cards + the held-back cards — every new card a real item at its tier, earned somewhere (a level, a
// streak milestone, an achievement, a sighting), its art registered (a LOOK with an effect in THE EFFECT LIBRARY), its strip + its full
// card in THE CARD LAB with the server's names; the lab's order (the sighting cards first); the three still held back stay plain.
import '../api/_lib/catalog.js';
import { LAB_TEXT } from '../api/_lib/lab-text.js';
import { ITEM_ROWS, ACH_ROWS, LEVEL_REWARD_ROWS, MILESTONE_ITEMS } from '../api/_lib/catalog.js';
import { registerLabText, LAB } from '../js/vault/catalog.js';
registerLabText(LAB_TEXT);
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ITEM } from '../js/core/items.js';
import { SIGHTINGS } from '../js/core/sightings.js';

const SIGHT = ['tr3b', 'blackbird', 'f22', 'ghostship', 'aurora', 'fireball', 'skull', 'btc'].map(k => `card-sg-${k}`);
const HELD = ['zebra', 'camo', 'velvet', 'aurora', 'rosegold', 'gold', 'flame30', 'marble', 'neoncamo', 'carbon', 'confetti', 'circuit', 'noir', 'sapphire', 'legend', 'century', 'marquee-gold', 'penthouse', 'wildfire', 'eternal', 'witness'].map(k => `card-${k}`);
const STILL_HELD = ['card-platinum', 'card-house', 'card-founder'];
const read = p => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** every id something EARNS: a level reward, a streak milestone, an achievement's item, a sighting's card */
function earned() {
  const s = new Set();
  for (const r of LEVEL_REWARD_ROWS) if (r.item) s.add(r.item);
  for (const v of Object.values(MILESTONE_ITEMS || {})) for (const id of [].concat(v)) if (typeof id === 'string') s.add(id); else if (id && id.item) s.add(id.item);
  for (const a of ACH_ROWS) if (a.item) s.add(a.item);
  for (const x of SIGHTINGS) if (x.card) s.add(x.card);
  return s;
}

test('every new card is a real item at its tier, earned somewhere', () => {
  const E = earned(), rows = new Map(ITEM_ROWS.map(r => [r.id, r]));
  for (const id of [...SIGHT, ...HELD]) {
    assert.ok(ITEM[id] && rows.has(id), `${id}: an item`);
    assert.ok(E.has(id), `${id}: earned somewhere (a level, a milestone, an achievement, a sighting)`);
    const lab = LAB.find(x => x.id === id);
    assert.ok(lab, `${id}: in THE CARD LAB`); assert.equal(lab.tier, ITEM[id].tier, `${id}: the lab's tier = the item's`);
  }
  for (const id of SIGHT) assert.equal(ITEM[id].tier, 'legendary', `${id}: a sighting card is LEGENDARY`);
});

test('every new card\'s art is registered: a LOOK with an effect in THE EFFECT LIBRARY + a material in the stylesheet', async () => {
  // (the looks + the registry import browser modules lazily — their source is read, never run, here)
  const strip = read('js/vault/strip.js'), index = read('js/fx/index.js'), css = read('css/vault.css');
  for (const id of [...SIGHT, ...HELD]) {
    const m = new RegExp(`'${id}': \\{ mat: '([^']+)', fx: '([^']+)'`).exec(strip);
    assert.ok(m, `${id}: a LOOK`);
    const [, mat, fx] = m;
    assert.match(index, new RegExp(`\\b${fx}\\b`), `${id}: its effect ${fx} is in the registry`);
    assert.ok(css.includes(`.vl-s-${mat}`), `${id}: its material .vl-s-${mat}`);
  }
});

test('THE CARD LAB: each new card\'s strip + its FULL card (its own mark), the server\'s names, the sighting cards FIRST', () => {
  for (const id of [...SIGHT, ...HELD]) {
    const full = LAB.find(x => x.id === `full-${id}`);
    assert.ok(full && full.of === id && full.kind === 'full', `${id}: its full card in the lab`);
    assert.equal(LAB_TEXT[id].name, ITEM[id].name, `${id}: the lab's name is the item's`);
    assert.equal(LAB_TEXT[`full-${id}`].name, `${ITEM[id].name} · FULL CARD`);
    assert.ok(LAB_TEXT[id].motion.length > 20, `${id}: what it does`);
  }
  const strips = LAB.filter(x => x.kind !== 'full');
  assert.deepEqual(strips.slice(0, 8).map(x => x.id), SIGHT, 'the 8 sighting cards first');
  assert.equal(new Set(LAB.map(x => x.n)).size, LAB.length, 'every lab number its own');
});

test('the three still held back stay plain (no LOOK, not in the lab) — listed, never shipped weak', () => {
  const strip = read('js/vault/strip.js');
  for (const id of STILL_HELD) { assert.ok(ITEM[id], `${id}: still an item`); assert.ok(!strip.includes(`'${id}':`), `${id}: no look yet`); assert.ok(!LAB.find(x => x.id === id), `${id}: not in the lab`); }
});

test('THE SIGHTING CARDS draw the city\'s own models: the hero bakes ship, the city\'s painters are exported (never a second version)', () => {
  for (const f of ['sr71-hero.webp', 'sr71.json', 'f22-hero.webp', 'f22.json']) assert.ok(fs.existsSync(new URL(`../assets/vault/sg/${f}`, import.meta.url)), f);
  const m = JSON.parse(read('assets/vault/sg/sr71.json'))['sr71-hero'];
  assert.equal(m.pts.length, 3, 'the SR-71 bake reports its two nacelles + the tail');
  assert.match(read('js/screens/harbor/legends.js'), /export \{ tr3bSprite, tr3bCorners, circuit, along, HUB_R, EDGE_LAMPS \}/);
  assert.match(read('js/screens/harbor/ghostship.js'), /export function ghostArt\(k, dpr\)/);
  assert.match(read('js/screens/harbor/aurora.js'), /export const AURORA_LOOKS = LOOKS/);
  for (const [f, re] of [['js/fx/sg-tr3b.js', /screens\/harbor\/legends\.js/], ['js/fx/sg-ghost.js', /screens\/harbor\/ghostship\.js/], ['js/fx/sg-aurora.js', /screens\/harbor\/aurora\.js/], ['js/fx/sg-balloons.js', /screens\/harbor\/balloons\.js/]])
    assert.match(read(f), re, `${f} lazy-loads the city's own painter`);
});
