// OVERCLOCK PASS 4 (OC4 — docs/overclock.md): THE REAL-GLASS CRACK + THE VISUAL / REFLEX CHALLENGES. Pure parts only (no DOM):
//   THE CRACK — the texture ships small + credited (CC-BY 3.0), it's in the preload (inside the 1.5 MB budget), the tap point rule (the finger,
//     else the left third — never dead centre), the seeded plan (the same tap → the same fracture; a different one → a different one).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { impactPoint, crackPlan, CRACK_MS, REVEAL_MS, CRACK_RAYS } from '../js/games/overclock/crack.js';
import { CREDITS } from '../js/ui/credits.js';

const CREDIT_LINE = 'RadialCracksB by Keith333 (https://opengameart.org/users/keith333), licensed under CC-BY 3.0';

test('THE CRACK: the texture — small, credited on the site + in the repo, loaded by Overclock only', async () => {
  for (const [f, max] of [['crack.webp', 200 * 1024], ['crack-glow.webp', 16 * 1024]]) {
    const n = statSync(`assets/overclock/${f}`).size;
    assert.ok(n > 1000 && n <= max, `${f}: ${n} bytes`);
  }
  assert.ok(CREDITS.some(c => c.by === CREDIT_LINE), 'the credit line, word for word, in the site credits');
  assert.ok(readFileSync('assets/overclock/CREDITS.md', 'utf8').includes(CREDIT_LINE), 'the credit in the repo');
  // never the CG ball or the Pexels shards
  assert.deepEqual(readdirSync('assets/overclock').filter(f => /\.(png|webp|jpe?g)$/.test(f)).sort(), ['crack-glow.webp', 'crack.webp']);
  // only Overclock loads it: no file outside its own folder / stylesheet names it
  const idx = readFileSync('js/games/overclock/index.js', 'utf8');
  assert.match(idx, /OC_CRACK_FILES = \['crack\.webp', 'crack-glow\.webp'\]/);
  for (const f of ['js/app.js', 'index.html', 'sw.js', 'css/components.css', 'css/base.css']) assert.ok(!readFileSync(f, 'utf8').includes('crack.webp'), f);
});

test('THE CRACK: the preload stays inside its 1.5 MB budget with the textures in it', async () => {
  const { PRELOAD_BUDGET } = await import('../js/games/cartridge.js');
  const { OC1_FILES } = await import('../js/games/overclock/sfx.js');
  const { OC_FONT_FILES, OC_CRACK_FILES } = await import('../js/games/overclock/index.js').catch(() => ({}));
  const fonts = OC_FONT_FILES || ['barlow-condensed-900i', 'barlow-condensed-800i', 'chakra-petch-700', 'chakra-petch-500'];
  const crack = OC_CRACK_FILES || ['crack.webp', 'crack-glow.webp'];
  const size = f => statSync(f).size;
  const total = readdirSync('data/oc').map(f => size(`data/oc/${f}`)).reduce((a, b) => a + b, 0)
    + [5, 6, 7].flatMap(n => [`answers-${n}`, `valid-${n}`]).map(f => size(`data/words/${f}.json`)).reduce((a, b) => a + b, 0)
    + OC1_FILES.map(f => size(`audio/sfx/overclock/${f}.mp3`)).reduce((a, b) => a + b, 0)
    + fonts.map(f => size(`assets/fonts/overclock/${f}.woff2`)).reduce((a, b) => a + b, 0)
    + crack.map(f => size(`assets/overclock/${f}`)).reduce((a, b) => a + b, 0);
  assert.ok(total <= PRELOAD_BUDGET, `${Math.round(total / 1024)} KB`);
});

test('THE CRACK: the tap point — the finger when it landed on the tile, else the left third (never dead centre)', () => {
  assert.deepEqual(impactPoint(340, 58, { x: 250, y: 20 }), { x: 250, y: 20, tap: true });
  for (let i = 0; i < 200; i++) {
    const r = (() => { let s = i * 7919 + 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (const pt of [null, { x: -5, y: 10 }, { x: 400, y: 10 }, { x: 10, y: 90 }]) {
      const p = impactPoint(340, 58, pt, r);
      assert.equal(p.tap, false);
      assert.ok(p.x >= 340 * 0.17 && p.x <= 340 * 0.29 + 1e-9, `x ${p.x} in the left third`);
      assert.ok(p.y > 58 * 0.4 && p.y < 58 * 0.6);
    }
  }
});

test('THE CRACK: the seeded plan — the same tap is the same fracture; its pieces + shards in their ranges; the motion ≤ 0.45 s', () => {
  assert.deepEqual(crackPlan(340, 58, 'pv|1:2:'), crackPlan(340, 58, 'pv|1:2:'));
  const seen = new Set();
  for (let i = 0; i < 120; i++) {
    const P = crackPlan(340, 58, `m|${i}`);
    seen.add(P.rot);
    assert.ok(P.k >= 0.92 && P.k <= 1.1, 'a slight scale');
    assert.ok(P.size >= 230 && P.size <= 490);
    assert.equal(P.pieces.length, 3, 'the label splits in three along the crack lines');
    assert.equal(Math.round(P.pieces.reduce((a, p) => a + p.span, 0)), 360, 'the wedges cover the whole label');
    for (const p of P.pieces) { const d = Math.hypot(p.dx, p.dy); assert.ok(d >= 0.99 && d <= 2.01, `offset ${d} px`); }
    assert.ok(P.shards.length >= 3 && P.shards.length <= 5);
    for (const s of P.shards) assert.ok(s.dur + s.delay <= CRACK_MS, 'every shard gone inside the crack\'s time');
  }
  assert.ok(seen.size > 60, 'random rotations');
  assert.ok(CRACK_MS <= 450 && REVEAL_MS >= 100 && REVEAL_MS <= 140);
  assert.ok(CRACK_RAYS.length >= 3);
});

test('THE CRACK: every wrong feedback goes through it — no hand-drawn hairline crack left', () => {
  const fx = readFileSync('js/games/overclock/fx.js', 'utf8');
  assert.match(fx, /crackAt\(tile/);
  assert.ok(!/CRACK_D|oc-crack-core/.test(fx), 'the old SVG hairlines are gone');
  const css = readFileSync('css/overclock.css', 'utf8');
  assert.ok(!/\.oc-crack[\s{,]/.test(css), 'the old crack styles are gone');
  assert.match(css, /\.oc-gc \{/);
});
