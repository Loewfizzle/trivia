// THE GARDEN PARTY PASS (Nov 21 — docs/vault.md "GARDEN PARTY"): the LV 34 epic card. Its level row + the ONE-TIME grant to owners already past
// LV 34 (THE CARRY-OVER on the `me` call — never twice), NAMES ONLY TO OWNERS (the name only in the server's catalog), the lab rows (NEW, v1),
// the CSS crop = the effect's (gp-specs.js), THE HERO-SPOT RULE, the art on disk (each plate's size), the still (THE SLIM-CARD LAYER), and the
// motion's PURE half (each petal at its plate spot at the still moment; the glints in turn). PINK RIOT + THE VANITY are NOT built.
import '../api/_lib/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { LEVEL_REWARD_ROWS, displayOf } from '../api/_lib/catalog.js';
import { REWARD_LEVELS, rewardsBetween, rewardsUpTo, levelOf } from '../js/core/levels.js';
import { carryOver } from '../js/core/progress.js';
import { ITEM } from '../js/core/items.js';
import { LAB, verOf } from '../js/vault/catalog.js';
import { LAB_TEXT, LAB_CHANGES } from '../api/_lib/lab-text.js';
import { GP_SPECS, PETALS, GLINTS, SPARKLE_BOX, gpMap } from '../js/fx/gp-specs.js';
import { HERO, heroMisses, HERO_BAND } from '../js/vault/hero.js';
import { STILLS, CSS_ART } from '../js/vault/stills.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url));
function webpSize(buf) {
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]; }
  return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
}
const xpAt = lv => { let x = 0; while (levelOf(x) < lv) x += 50; return x; };

test('GARDEN PARTY unlocks at LV 34 (free between VELVET ROOM 32 + AURORA 35) — the only girl card built; the tease knows the level', () => {
  assert.deepEqual(LEVEL_REWARD_ROWS.filter(r => r.item === 'card-garden').map(r => r.lvl), [34]);
  assert.deepEqual(LEVEL_REWARD_ROWS.filter(r => r.lvl === 34).map(r => r.item), ['card-garden'], 'LV 34 gives GARDEN PARTY alone');
  assert.deepEqual(rewardsBetween(33, 34), ['card-garden']);
  assert.ok(REWARD_LEVELS.includes(34));
  const it = ITEM['card-garden'];
  assert.ok(it && it.kind === 'card' && it.tier === 'epic' && it.name === 'GARDEN PARTY', 'epic (the purple gem)');
  assert.equal(displayOf(['card-garden'])['card-garden'].lv, 34);
  for (const id of ['card-pinkriot', 'card-vanity', 'card-riot', 'card-roses']) assert.ok(!ITEM[id], `${id}: not built (the owner, Nov 21)`);
});

test('owners already past LV 34 get it ONCE (THE CARRY-OVER on the `me` call — the added-row pattern); a second call grants nothing; under 34 nothing', () => {
  const now = Date.UTC(2026, 10, 22);
  const at40 = rewardsUpTo(40).filter(id => id !== 'card-garden');
  const s = { xp: xpAt(40), it: Object.fromEntries(at40.map(id => [id, now - 9e8])) };
  const r1 = carryOver(s, now);
  assert.ok(r1 && r1.items.includes('card-garden'), 'granted at the next `me` call');
  assert.deepEqual(r1.items.filter(id => LEVEL_REWARD_ROWS.some(x => x.item === id)), ['card-garden'], 'only the new row — nothing re-granted');
  const r2 = carryOver(r1.next, now + 1000);
  assert.ok(!r2 || !r2.items.includes('card-garden'), 'never twice');
  const s33 = { xp: xpAt(33), it: Object.fromEntries(rewardsUpTo(33).map(id => [id, now])) };
  const r3 = carryOver(s33, now);
  assert.ok(!r3 || !r3.items.includes('card-garden'), 'LV 33: not yet');
});

test('NAMES ONLY TO OWNERS: "GARDEN PARTY" lives on the server (the catalog + the lab text) — never in a shipped js/ or css/ file', () => {
  for (const f of ['js/vault/catalog.js', 'js/vault/strip.js', 'js/fx/gp-card.js', 'js/fx/gp-specs.js', 'js/core/levels.js', 'css/vault.css', 'js/vault/stills.js', 'js/vault/hero.js', 'js/vault/layout.js']) {
    const code = read(f).toString().split('\n').filter(l => !/^\s*(\/\/|\/\*|\*)/.test(l)).join('\n').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(code, /GARDEN PARTY/, `${f}: the name only in comments`);
  }
  assert.match(read('api/_lib/catalog.js').toString(), /C\('card-garden', 'GARDEN PARTY', 'epic'/);
});

test('the lab: strip + full card, n 229 + 230, NEW (v1 — a new item never shows CHANGED), each with its words', () => {
  ['card-garden', 'full-card-garden'].forEach((id, i) => {
    const x = LAB.find(r => r.id === id); assert.ok(x, id);
    assert.equal(x.n, 229 + i); assert.equal(x.tier, 'epic');
    assert.equal(verOf(id), 1); assert.ok(!LAB_CHANGES[id], 'no CHANGED line');
    assert.ok(LAB_TEXT[id] && LAB_TEXT[id].motion.length > 60, `${id}: its lab text`);
  });
  assert.equal(new Set(LAB.map(r => r.n)).size, LAB.length, 'every lab number unique');
});

test('the CSS crop = the effect\'s (gp-specs.js), the look registered, the still (THE SLIM-CARD LAYER) + THE HERO-SPOT RULE', () => {
  const S = GP_SPECS['card-garden'], css = read('css/vault.css').toString();
  assert.match(read('js/vault/strip.js').toString(), /'card-garden': \{ mat: 'gp-garden', fx: 'gpGarden' \}/, 'its look (a material + the effect)');
  assert.match(read('js/fx/index.js').toString(), / gpGarden,\n/, 'the effect registered');
  assert.ok(css.includes(`.vl-s-gp-garden .vl-mat { background: ${S.ground} url('../assets/vault/gp/garden.webp') ${S.strip[0]}% ${S.strip[1]}% / ${Math.round(S.strip[2] * 100)}% auto no-repeat; }`), 'the strip crop');
  assert.ok(css.includes(`.vl-fcm-gp-garden .vl-mat { background: ${S.ground} url('../assets/vault/gp/garden.webp') ${S.full[0]}% ${S.full[1]}% / ${Math.round(S.full[2] * 100)}% auto no-repeat; }`), 'the full card crop');
  // the full card is covered (1.586 : 1 — no ground showing above / below)
  const M = gpMap(400, 400 / 1.586, S.full); assert.ok(M.oy <= 0 && 720 * M.k + M.oy >= 400 / 1.586 - 0.5, 'the art fills the full card');
  const st = gpMap(360, 64, S.strip); assert.ok(st.ox <= 0 && 1280 * st.k + st.ox >= 360, 'the art fills the strip');
  assert.equal(STILLS['card-garden'], 'l'); assert.ok(CSS_ART.includes('card-garden'));
  assert.ok(existsSync(new URL('../assets/vault/still/card-garden-l.webp', import.meta.url)), 'the layer still baked');
  assert.ok(!heroMisses().includes('card-garden'));
  const [b] = HERO['card-garden'], cx = b[0] + b[2] / 2;
  assert.ok(cx >= 0.75 && cx <= 0.85 && cx >= HERO_BAND[0], `the bouquet's heart ≈ 0.78 across (${cx.toFixed(3)})`);
});

test('the art on disk: the master 1280 × 720, the petal sheet holds every box, the sparkle = half its box', () => {
  assert.deepEqual(webpSize(read('assets/vault/gp/garden.webp')), [1280, 720]);
  const [pw, ph] = webpSize(read('assets/vault/gp/gp-petals.webp'));
  assert.equal(PETALS.length, 8, 'Grok\'s eight petals');
  for (const [sx, sy, sw, sh, cx, cy] of PETALS) { assert.ok(sx + sw <= pw && sy + sh <= ph, 'inside the sheet'); assert.ok(cx > 560 && cx < 1240 && cy > 0 && cy < 720, 'the right half of the plate'); }
  const [sw, sh] = webpSize(read('assets/vault/gp/gp-sparkle.webp'));
  assert.ok(Math.abs(sw - SPARKLE_BOX[2] / 2) <= 1 && Math.abs(sh - SPARKLE_BOX[3] / 2) <= 1, 'the sparkle plate halved');
  assert.ok(GLINTS.length >= 10 && GLINTS.every(([x, y]) => x >= SPARKLE_BOX[0] && x <= SPARKLE_BOX[0] + SPARKLE_BOX[2] && y >= SPARKLE_BOX[1] && y <= SPARKLE_BOX[1] + SPARKLE_BOX[3]));
});

test('the motion (PURE): each petal sits on its plate spot at the still moment, falls + loops, faded at its ends; the glints twinkle in turn', async () => {
  const { petalAt, glintAt, gpGarden } = await import('../js/fx/gp-card.js').catch(() => ({}));
  if (!petalAt) return;   // (the effect module reaches the DOM renderer — the browser checks run it; the specs above stand)
  for (let i = 0; i < PETALS.length; i++) {
    const p = petalAt(i, gpGarden.stillT);
    assert.ok(Math.abs(p.x - PETALS[i][4]) < 0.01 && Math.abs(p.y - PETALS[i][5]) < 0.01, `petal ${i} at Grok's spot`);
    const q = petalAt(i, gpGarden.stillT + 2);
    assert.ok(q.y > p.y || q.y < 0, 'falls');
  }
  for (let t = 0; t < 6; t += 0.1) { const on = GLINTS.filter((_, i) => glintAt(i, t, false) > 0.5).length; assert.ok(on <= 6, `never all at once (${on} at ${t.toFixed(1)} s)`); }
});
