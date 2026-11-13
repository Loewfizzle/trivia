// JAYWALK CARDS (Nov 12 night — docs/harbor/passes/jaywalk-cards.md): SONIC BOOM · CLOSE ENCOUNTER · RIGHT OF WAY — built like REDLINE + PHOTO FINISH.
// The wiring (the lab, the lab text, the CSS crop = the effect's, THE HERO-SPOT RULE, the full card's hero box, the credit), the art on disk (each FX
// plate = half its crop box), the specs' PURE timing (the ring's burst curve, the hop's draw-on), and NOTHING GRANTS THEM (JAYWALK's pass 6 adds the
// achievements — until then no achievement names a card, and the lab shows them NEW).
import '../api/_lib/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { ACH, GAME_ACHIEVEMENTS } from '../js/core/achievements.js';
import { ITEM } from '../js/core/items.js';
import { LAB, verOf } from '../js/vault/catalog.js';
import { LAB_TEXT, LAB_CHANGES } from '../api/_lib/lab-text.js';
import { JW_SPECS, PLATES, jwMap, ringAt, hopAt, RING_EVERY, RING_DUR, HOP_EVERY, HOP_DRAW } from '../js/fx/jw-specs.js';
import { HERO, heroMisses, HERO_BAND } from '../js/vault/hero.js';
import { CREDITS } from '../js/ui/credits.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url));
const CARDS = ['card-sonicboom', 'card-closeencounter', 'card-rightofway'];
const MAT = { 'card-sonicboom': 'sonicboom', 'card-closeencounter': 'closeencounter', 'card-rightofway': 'rightofway' };
/** a WebP's pixel size (VP8 / VP8L / VP8X) */
function webpSize(buf) {
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]; }
  return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
}

test('the lab: three strips + three full cards, numbered 217 → 222 after the highest, NEW (v1, no change line), each with its words', () => {
  const ids = [...CARDS, ...CARDS.map(c => `full-${c}`)];
  ids.forEach((id, i) => {
    const x = LAB.find(r => r.id === id); assert.ok(x, id);
    assert.equal(x.n, 217 + i, `${id}: n`);
    assert.equal(x.tier, id.endsWith('rightofway') ? 'legendary' : 'rare', `${id}: tier`);
    assert.ok(LAB_TEXT[id] && LAB_TEXT[id].motion.length > 60, `${id}: its lab text`);
    assert.equal(verOf(id), 1, `${id}: v1 — NEW in the lab`); assert.ok(!LAB_CHANGES[id], `${id}: no CHANGED line`);
  });
  assert.equal(new Set(LAB.map(r => r.n)).size, LAB.length, 'every lab number once');
  const strip = read('js/vault/strip.js').toString(), fx = read('js/fx/index.js').toString(), lay = read('js/vault/layout.js').toString();
  for (const c of CARDS) {
    assert.ok(ITEM[c] && ITEM[c].kind === 'card', `${c}: a server catalog row`);
    const m = new RegExp(`'${c}': \\{ mat: 'jw-${MAT[c]}', fx: '(jw\\w+)' \\}`).exec(strip);
    assert.ok(m, `${c}: its look`); assert.match(fx, new RegExp(`\\b${m[1]},`), `${c}: its effect registered`);
  }
  assert.match(lay, /const J = JW_SPECS\[card\];/, "layout.js: the full card's hero box");
});

test('the CSS crop = the effect\'s (the strip zoomed out + set right, the full card at 80 % by its width) + the art on disk', () => {
  const css = read('css/vault.css').toString();
  for (const [id, S] of Object.entries(JW_SPECS)) {
    const esc = S.art.replace(/-/g, '\\-');
    const st = new RegExp(`\\.vl-s-jw-${MAT[id]} \\.vl-mat \\{ background: #\\w+ url\\('\\.\\./assets/vault/jw/${esc}\\.webp'\\) (\\d+)% (\\d+)% / (\\d+)% auto`).exec(css);
    assert.ok(st, `${id}: its strip material`); assert.deepEqual([+st[1], +st[2], +st[3] / 100], S.strip, `${id}: the strip's crop = the effect's`);
    const fu = new RegExp(`\\.vl-fcm-jw-${MAT[id]} \\.vl-mat \\{ background: [^;]*url\\('\\.\\./assets/vault/jw/${esc}\\.webp'\\) (\\d+)% (\\d+)% / (\\d+)% auto`).exec(css);
    assert.ok(fu, `${id}: its full material`); assert.deepEqual([+fu[1], +fu[2], +fu[3] / 100, 'w'], S.full, `${id}: the full card's crop = the effect's`);
    const [w, h] = webpSize(read(`assets/vault/jw/${S.art}.webp`)); assert.deepEqual([w, h], [1280, 720], `${S.art}.webp`);
  }
  for (const [n, [, , bw, bh]] of Object.entries(PLATES)) {
    const f = `assets/vault/jw/jw-${n}.webp`; assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), f);
    assert.deepEqual(webpSize(read(f)), [Math.round(bw / 2), Math.round(bh / 2)], `${f} = half its crop box`);
  }
  // (the masters' copies — never the -b backups)
  for (const f of ['sonic-boom', 'close-encounter', 'right-of-way', 'fx-afterburner', 'fx-shockring', 'fx-beam', 'fx-trails', 'fx-hop']) assert.ok(existsSync(new URL(`../art/jaywalk-cards/src/${f}.png`, import.meta.url)), f);
});

test('THE HERO-SPOT RULE: each strip\'s hero ≈ 0.78 across (THE SLIM-CARD LONG-NAME STANDARD 0.75–0.85), clear of the gem; the full card\'s hero right of a 12-letter plate', () => {
  for (const id of CARDS) {
    const b = HERO[id][0], cx = b[0] + b[2] / 2;
    assert.ok(cx >= 0.75 && cx <= 0.85 && cx >= HERO_BAND[0], `${id}: centre ${cx.toFixed(3)}`);
    const S = JW_SPECS[id], F = jwMap(358, 226, S.full), fx0 = (F.ox + S.heroFull[0] * F.k) / 358; assert.ok(fx0 > 0.55, `${id}: the full card's hero starts right of the plate (${fx0.toFixed(2)})`);
  }
  assert.deepEqual(heroMisses(), []);
  // the map = the CSS: a strip's art is Z × its width, set right (the right edge on the strip's right edge)
  const M = jwMap(358, 64, JW_SPECS['card-rightofway'].strip); assert.ok(Math.abs(M.ox + 1280 * M.k - 358) < 1e-6 && Math.abs(1280 * M.k - 0.7 * 358) < 1e-6);
});

test('the motion\'s timing (PURE): SONIC BOOM\'s ring bursts 0.6 → 1.15, bright → gone, every 4 s; RIGHT OF WAY\'s hop draws on in 0.8 s, then the puff, every 5 s', () => {
  assert.equal(RING_EVERY, 4); assert.ok(RING_DUR > 0.7 && RING_DUR < 1.1);
  const r0 = ringAt(0, false), rEnd = ringAt(RING_DUR - 1e-3, false);
  assert.ok(Math.abs(r0.scale - 0.6) < 1e-9 && Math.abs(rEnd.scale - 1.15) < 0.01, 'the scale 0.6 → 1.15');
  assert.ok(r0.a === 1 && rEnd.a < 0.02, 'bright → gone');
  assert.ok(r0.flash === 1 && ringAt(0.3, false).flash === 0, 'a SHORT white flash');
  const us = Array.from({ length: 20 }, (_, i) => ringAt(i * RING_DUR / 20, false));
  assert.ok(us.every((r, i) => !i || (r.scale > us[i - 1].scale && r.a < us[i - 1].a)), 'it only grows + fades');
  assert.ok(ringAt(RING_DUR + 0.2, false).u === -1 && ringAt(3.5, false).u === -1, 'calm between bursts');
  assert.ok(Math.abs(ringAt(RING_EVERY + 0.2, false).scale - ringAt(0.2, false).scale) < 1e-9, 'every 4 s');
  assert.ok(ringAt(0, true).u >= 0, 'reduced motion: a still frame mid-burst');
  assert.equal(HOP_EVERY, 5); assert.equal(HOP_DRAW, 0.8);
  assert.equal(hopAt(0, false).draw, 0); assert.ok(hopAt(0.4, false).draw > 0.3 && hopAt(0.4, false).draw < 0.7); assert.equal(hopAt(HOP_DRAW, false).draw, 1);
  assert.equal(hopAt(0.3, false).puff, 0, 'no puff before the arc lands');
  assert.ok(hopAt(HOP_DRAW + 0.2, false).puff > 0.9, 'the puff blooms as it lands');
  assert.ok(hopAt(HOP_EVERY - 0.1, false).a < 0.01 && hopAt(HOP_EVERY - 0.1, false).puff < 0.01, 'then everything fades before the next hop');
  const st = hopAt(0, true); assert.ok(st.draw === 1 && st.puff > 0, 'reduced motion = the arc full + the puff');
});

test('NOTHING GRANTS THEM: no achievement names a JAYWALK card, no jaywalk achievements yet — pass 6\'s marked place is there', () => {
  for (const a of Object.values(ACH)) assert.ok(!CARDS.includes(a.item), `${a.id} grants ${a.item}`);
  assert.ok(!GAME_ACHIEVEMENTS.jaywalk || !GAME_ACHIEVEMENTS.jaywalk.length, 'no jaywalk achievements');
  const cat = read('api/_lib/catalog.js').toString();
  assert.match(cat, /\/\/ JAYWALK pass 6 — the three feat flags from the server's replay → these cards/);
  for (const c of CARDS) assert.ok(!new RegExp(`A\\([^\\n]*'${c}'`).test(cat), `${c}: no A(…) row`);
});

test('the credit: ONE row for JAYWALK — card art + billboard art, "created with Grok"', () => {
  const rows = CREDITS.filter(c => /JAYWALK/.test(c.title));
  assert.equal(rows.length, 1); assert.equal(rows[0].title, 'JAYWALK — card art + billboard art'); assert.match(rows[0].by, /Card art created with Grok \(Grok Imagine, xAI\)/);
});
