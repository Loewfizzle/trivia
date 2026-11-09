// THE BTC CARD (Nov 8 late night — docs/harbor/passes/btc-card.md): the ₿ balloon card's premium art + THE BURNER FLARE — the wiring (the effect,
// the strip's look, the CSS crop = the spec's, the hero boxes in their band, the standard full-card layout), THE LAB (v2 + its CHANGED line + the
// motion text), the credit, the baked layers on disk, and the burns (bursts of 0.6–1.2 s a few seconds apart, never metronomic; a BLOCK burn + the
// ring every 10 s), the sway + the reveal + the still frame (the LIT frame).
import '../api/_lib/catalog.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { BTC, BURNS, BURN_LOOP, burnAt, btcMap } from '../js/fx/btc-specs.js';
import { HERO, HERO_BAND, GEM_BOX, overlaps, heroMisses } from '../js/vault/hero.js';
import { heroBox } from '../js/vault/layout.js';
import { verOf } from '../js/vault/catalog.js';
import { LAB_TEXT, LAB_CHANGES } from '../api/_lib/lab-text.js';
import { CREDITS } from '../js/ui/credits.js';
import { SIGHTING } from '../js/core/sightings.js';
import { ITEM } from '../js/core/items.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('THE BTC CARD — the wiring: legendary, its line + emblem unchanged, the new effect, the CSS crop = the spec, the standard full-card layout', async () => {
  assert.equal(ITEM['card-sg-btc'].tier, 'legendary');
  assert.equal(ITEM['card-sg-btc'].line, 'The ₿ balloon. Tick tock, next block.');
  assert.equal(SIGHTING.btc.card, 'card-sg-btc'); assert.equal(SIGHTING.btc.emblem, 'emb-sg-btc');
  assert.deepEqual(SIGHTING.btc.kind, ['bitcoin', 'btc-orange'], 'THE UNLOCK unchanged: any ₿ balloon');
  assert.match(read('js/vault/strip.js'), /'card-sg-btc': { mat: 'sg-btc', fx: 'btcCard' }/);   // (strip.js needs a page — read as text)
  const idx = read('js/fx/index.js'); assert.match(idx, /import \{ btcCard \} from '\.\/btc-card\.js'/); assert.match(idx, /^\s+btcCard,$/m);
  const css = read('css/vault.css');
  assert.ok(css.includes(`.vl-s-sg-btc .vl-mat { background: #0a0716 url('../assets/vault/btc/btc.webp') ${BTC.strip[0]}% ${BTC.strip[1]}% / cover no-repeat; }`), 'the strip crop = btc-specs strip');
  assert.ok(css.includes(`url('../assets/vault/btc/btc.webp') ${BTC.full[0]}% ${BTC.full[1]}% / cover no-repeat; }`), 'the full crop = btc-specs full');
  assert.match(read('js/vault/full.js'), /ART_SIGHTINGS = new Set\(\['card-sg-btc'\]\)/);
});

test('THE BTC CARD — THE HERO-SPOT RULE: the envelope 0.60–0.84 across on the strip, clear of the gem; the full card keeps the plate off the balloon', () => {
  const [b] = HERO['card-sg-btc'], cx = b[0] + b[2] / 2;
  assert.ok(cx >= HERO_BAND[0] && cx <= HERO_BAND[1], `the envelope's centre ${cx.toFixed(3)}`);
  assert.ok(Math.abs(cx - 0.715) < 0.01, 'the balloon ≈ 71.5 % across (measured)');
  assert.ok(!overlaps(b, GEM_BOX)); assert.ok(!heroMisses().includes('card-sg-btc'));
  const W = 358, H = W / 1.586, hb = heroBox('card-sg-btc', W, H);
  assert.ok(hb && hb[0] / W > 0.55 && (hb[0] + hb[2]) / W < 0.9 && (hb[1] + hb[3]) / H < 0.8, JSON.stringify(hb));
  // the strip's own band: art y 144 → 374 at the nominal strip (the ₿ inside it)
  const M = btcMap(358, 64, BTC.strip), y0 = -M.oy / M.k, y1 = y0 + 64 / M.k;
  assert.ok(Math.abs(y0 - 144) < 2 && Math.abs(y1 - 373) < 3, `${y0}–${y1}`);
  assert.ok(BTC.btc[1] > y0 + 40 && BTC.btc[1] < y1 - 40, 'the ₿ well inside the band');
});

test('THE BTC CARD — THE LAB: v2 + its CHANGED line + the new motion text; the credit; the baked layers on disk (small)', () => {
  assert.equal(verOf('card-sg-btc'), 2); assert.equal(verOf('full-card-sg-btc'), 3);   // (BOARD 2.0 A: the full card's v3 — the name, the sighting line, the rise-in)
  assert.ok(LAB_CHANGES['full-card-sg-btc'].at(-1).v === 3 && /one line.*sighting line back.*rise-in fixed/i.test(LAB_CHANGES['full-card-sg-btc'].at(-1).what), 'the v3 CHANGED line');
  for (const id of ['card-sg-btc', 'full-card-sg-btc']) {
    assert.ok(LAB_CHANGES[id] && LAB_CHANGES[id][0].v === 2 && /premium art \+ the burner flare/i.test(LAB_CHANGES[id][0].what), id);
    assert.match(LAB_TEXT[id].motion, /burn/i);
  }
  assert.ok(CREDITS.some(c => /balloon card/.test(c.title) && /Card art created with Grok/.test(c.by)));
  let total = 0;
  for (const n of ['btc', 'btc-clean', 'btc-balloon', 'btc-lit', 'btc-mark', 'btc-sheen', 'btc-bloom', 'btc-coins', 'btc-flame', 'btc-glints', 'btc-water']) {
    const s = statSync(new URL(`../assets/vault/btc/${n}.webp`, import.meta.url)).size; total += s;
    assert.ok(s > 2000 && s < 120e3, `${n}.webp ${s}`);
  }
  assert.ok(total < 400e3, `the card's art ${Math.round(total / 1024)} KB`);
  assert.equal(BTC.coins.length, 5, 'the five coins measured on the master');
});

test('THE FLARE — bursts of 0.6–1.2 s a few seconds apart, never metronomic; a BLOCK burn every 10 s (the ring with it); off a burn = dark', () => {
  const blocks = BURNS.filter(b => b[3]).map(b => b[0]);
  assert.deepEqual(blocks, [0, 10, 20]); assert.equal(BURN_LOOP, 30);
  const len = BURNS.map(b => b[1]); assert.ok(len.every(l => l >= 0.6 && l <= 1.2), JSON.stringify(len));
  const gaps = BURNS.map((b, i) => { const n = BURNS[(i + 1) % BURNS.length]; return n[0] + (i + 1 === BURNS.length ? BURN_LOOP : 0) - (b[0] + b[1]); });
  assert.ok(gaps.every(g => g >= 1.5 && g <= 4.5), `the gaps ${gaps.map(g => g.toFixed(2))}`);
  assert.ok(new Set(gaps.map(g => g.toFixed(1))).size >= 5, 'never metronomic');
  // the burn's light: on in a burn (≥ 0.6 at its middle), dark between
  for (const [s, l] of BURNS) { assert.ok(burnAt(s + l / 2).b > 0.55, `burn at ${s}`); }
  for (let i = 0; i < BURNS.length; i++) { const [s, l] = BURNS[i], mid = s + l + 0.5 + gaps[i] / 2 - 0.25; if (gaps[i] > 1.2) assert.equal(burnAt(mid).b, 0, `dark at ${mid}`); }
  assert.ok(burnAt(10.3).blockAge < 0.5 && burnAt(10.3).b > 0.5, 'a block burn at 10 s with the ring');
  assert.ok(Math.abs(burnAt(37).b - burnAt(7).b) < 1e-9, 'a 30-s loop');
});

test('THE SWAY + THE REVEAL + THE STILL: the balloon bobs a few px; a full card rises in then burns big; reduced motion = the lit frame', async () => {
  const { btcState } = await import('../js/fx/btc-card.js');
  const full = { opts: { full: true } };
  assert.ok(btcState(full, 0, false).rise > 0.95, 'starts below');
  assert.ok(btcState(full, 1.95, false).rise < 0.01, 'risen');
  assert.ok(btcState(full, 2.2, false).b > 0.8, 'the big first burn');
  const st = btcState({ opts: {} }, 0, true); assert.ok(st.b > 0.85 && st.blockAge < 2.2 && !st.dx && !st.rot, 'the lit still');
  let mx = 0; for (let t = 0; t < 60; t += 0.1) { const s = btcState({ opts: {} }, t, false); mx = Math.max(mx, Math.hypot(s.dx, s.dy)); }
  assert.ok(mx > 2 && mx < 8, `the sway ${mx.toFixed(1)} art px`);
});
