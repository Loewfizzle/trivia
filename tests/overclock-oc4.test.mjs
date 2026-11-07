// OVERCLOCK PASS 4 (OC4 — docs/overclock.md): THE REAL-GLASS CRACK + THE VISUAL / REFLEX CHALLENGES. Pure parts only (no DOM):
//   THE CRACK — the texture ships small + credited (CC-BY 3.0), it's in the preload (inside the 1.5 MB budget), the tap point rule (the finger,
//     else the left third — never dead centre), the seeded plan (the same tap → the same fracture; a different one → a different one).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, readdirSync } from 'node:fs';
import { impactPoint, crackPlan, CRACK_MS, REVEAL_MS, CRACK_RAYS } from '../js/games/overclock/crack.js';
import { CREDITS } from '../js/ui/credits.js';
import { generate, genOddOne, challengeRng, partsFor } from '../js/games/overclock/challenges.js';
import { ODD_FAMS, ODD_SIZES, GLYPH_PAIRS, ROT_SHAPES, MIRROR_SHAPES, NEON_ODD, ROT_TURNS, ODD_MIN_TURN, oddPool, oddKey, oddGrid, oddToken, oddWhy, oddCatalogSize } from '../js/games/overclock/odd.js';
import { dealMatch, DEALT, keysAt } from '../js/games/overclock/deal.js';
import { createGame, nextStep } from '../js/games/overclock/director.js';
import { levelOf, CHALLENGE_MS } from '../js/games/overclock/logic.js';
import { rngFrom } from '../js/core/rng.js';

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
  const { OC_PRELOAD_BANKS } = await import('../js/games/overclock/index.js').catch(() => ({ OC_PRELOAD_BANKS: ['closest', 'missinglink', 'spellcheck'] }));
  const total = OC_PRELOAD_BANKS.map(t => size(`data/oc/${t}.json`)).reduce((a, b) => a + b, 0)
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

// ---------------------------------------------------------------------------------------------- ODD ONE OUT's FOUR FAMILIES (Group 1 — rules first)
test('ODD ONE OUT: the catalogs — ~60 fair look-alike pairs (no duplicates, three tiers), the shapes, NO colour family', () => {
  assert.ok(GLYPH_PAIRS.length >= 55 && GLYPH_PAIRS.length <= 70, `${GLYPH_PAIRS.length} pairs`);
  const seen = new Set();
  for (const [a, b, t] of GLYPH_PAIRS) {
    assert.notEqual(a, b);
    const k = [a, b].sort().join('|');
    assert.ok(!seen.has(k), `a duplicate pair ${k}`); seen.add(k);
    assert.ok([0, 1, 2].includes(t));
    assert.ok(a.length <= 2 && b.length <= 2, 'a glyph fits a cell');
  }
  for (const t of [0, 1, 2]) assert.ok(GLYPH_PAIRS.filter(p => p[2] === t).length >= 15, `tier ${t} has enough pairs for a long night`);
  assert.deepEqual(ODD_FAMS, ['glyph', 'rot', 'mirror', 'shape'], 'four families — none about colour');
  assert.ok(ROT_SHAPES.length >= 4 && MIRROR_SHAPES.length >= 4 && NEON_ODD.length >= 3);
  // every item has its own night key
  const keys = new Set();
  for (let f = 0; f < 4; f++) for (let i = 0; i < oddCatalogSize(f); i++) { const k = oddKey(f, i); assert.match(k, /^od-[grms][a-z0-9]+$/); assert.ok(!keys.has(k), k); keys.add(k); }
});

test('ODD ONE OUT: every challenge = three grids (4×4 · 5×5 · 6×6) from THREE DIFFERENT families; seeded + deterministic', () => {
  const famsSeen = new Map();
  for (let s = 0; s < 600; s++) {
    for (const level of [0, 0.5, 1]) {
      const args = { seed: `odd${s}`, ci: s % 12, level };
      const o = generate('oddone', args);
      assert.deepEqual(o, generate('oddone', args), 'every phone builds the same grids');
      assert.equal(o.parts, 3); assert.equal(o.parts, partsFor('oddone', level));
      assert.deepEqual(o.grids.map(g => g.size), ODD_SIZES);
      assert.equal(new Set(o.grids.map(g => g.fam)).size, 3, 'a different family per grid');
      for (const g of o.grids) {
        assert.notEqual(g.base, g.odd);
        assert.ok(Number.isInteger(g.idx) && g.idx >= 0 && g.idx < g.size * g.size);
        famsSeen.set(g.fam, (famsSeen.get(g.fam) || 0) + 1);
      }
    }
  }
  for (const f of ODD_FAMS) assert.ok(famsSeen.get(f) > 600, `${f} comes up (${famsSeen.get(f)})`);
});

test('ODD ONE OUT: each family\'s difference is real + phone-fair (a clear angle ≥ 20°, a flip, a missing point / pip / a moved gap)', () => {
  for (let s = 0; s < 400; s++) {
    for (let f = 0; f < 4; f++) {
      for (const level of [0, 0.5, 0.9]) {
        const pool = oddPool(f, level, s % 3);
        assert.ok(pool.length > 0);
        const g = oddGrid(rngFrom(`f${f}:${s}`), f, pool[s % pool.length], 6, level, s % 3);
        if (f === 0) { const p = GLYPH_PAIRS[pool[s % pool.length]]; assert.deepEqual([g.base, g.odd].sort(), [p[0], p[1]].sort()); continue; }
        const b = oddToken(g.base), o = oddToken(g.odd);
        assert.ok(b && o, `${g.base} / ${g.odd} parse`);
        assert.equal(b.shape.replace(/\d$/, ''), o.shape.replace(/\d$/, ''), 'the same shape — only the one difference');
        if (f === 1) {
          const d = Math.abs(((o.a - b.a + 540) % 360) - 180);
          assert.ok(d >= ODD_MIN_TURN && d >= 25 && d <= 45, `turned ${d}°`);
          assert.equal(d, Math.abs(g.turn));
          assert.equal(b.m, false); assert.equal(o.m, false);
        }
        if (f === 2) { assert.notEqual(b.m, o.m, 'exactly one is mirrored'); assert.equal(b.a, o.a, 'the same way up'); }
        if (f === 3 && b.shape === 'gap') { const d = Math.abs(((o.a - b.a + 540) % 360) - 180); assert.ok(d >= 90, `the gap moved ${d}° — never a near miss`); }
      }
    }
  }
  assert.ok(ROT_TURNS.flat().every(t => t >= ODD_MIN_TURN && t <= 45));
  assert.ok(Math.min(...ROT_TURNS[0]) > Math.min(...ROT_TURNS[2]), 'early challenges turn further (easier)');
});

test('ODD ONE OUT: THE ANSWER\'s one short line says what made it odd', () => {
  assert.equal(oddWhy({ fam: 'rot', base: 'arrow@0', odd: 'arrow@30', turn: 30 }), 'the arrow turned 30°');
  assert.equal(oddWhy({ fam: 'rot', base: 'key@345', odd: 'key@15', turn: 30 }), 'the key turned 30°');
  assert.equal(oddWhy({ fam: 'mirror', base: 'flag@0', odd: 'flag~@0' }), 'the flag flipped — a mirror image');
  assert.equal(oddWhy({ fam: 'shape', base: 'die6', odd: 'die5' }), 'a 5 among 6s');
  assert.equal(oddWhy({ fam: 'shape', base: 'star5', odd: 'star4' }), 'a star missing a point');
  assert.equal(oddWhy({ fam: 'shape', base: 'gap@0', odd: 'gap@180' }), 'its gap in a different spot');
  assert.equal(oddWhy({ fam: 'glyph', base: 'O', odd: '0' }), 'the 0 among the Os');
  for (let s = 0; s < 200; s++) for (const g of generate('oddone', { seed: `w${s}`, ci: 1, level: s / 200 }).grids) assert.ok(oddWhy(g).length > 6 && oddWhy(g).length <= 40, oddWhy(g));
});

test('ODD ONE OUT + THE NIGHT\'s MEMORY: the host deals each grid\'s family + item, marks them, a rematch gets fresh ones; a stale deal falls back', () => {
  assert.ok(DEALT.includes('oddone'));
  const order = ['oddone', 'math', 'stroop', 'count', 'oddone', 'truefalse'];
  const used = {};
  const all = [];
  for (let m = 0; m < 4; m++) {
    const { deal, dk } = dealMatch({ seed: `night-${m}`, order, total: 6, used });
    for (const ci of [0, 4]) {
      const d = deal[ci];
      assert.equal(d.length, 6);
      assert.equal(new Set([d[0], d[2], d[4]]).size, 3, 'three different families');
      const spec = generate('oddone', { seed: `night-${m}`, ci, level: levelOf(ci, 6), deal: d });
      assert.deepEqual(spec.grids.map(g => g.fam), [d[0], d[2], d[4]].map(f => ODD_FAMS[f]), 'the screen builds what the host dealt');
      const keys = dk[ci].split(' ');
      assert.equal(keys.length, 3);
      for (const k of keys) { assert.ok(!all.includes(k) || m >= 2, `${k} again on the same night`); all.push(k); used[k] = true; }
      assert.deepEqual(keysAt({ order, dk }, ci).slice(1), keys, 'the opening step marks exactly these');
    }
  }
  // a stale / broken deal → the seeded draw (never a crash)
  for (const bad of [[0, 999, 1, 0, 2, 0], [0, 0, 0, 1, 2, 0], [9, 0, 1, 0, 2, 0], 'x', [1, 2]]) {
    const a = generate('oddone', { seed: 'st', ci: 1, level: 0.3, deal: bad });
    assert.deepEqual(a, generate('oddone', { seed: 'st', ci: 1, level: 0.3 }));
  }
});

function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}
test('a WHOLE simulated match with two ODD ONE OUTs (2 + 8 players): dealt by the host, marked as each opens, scored + ended as before; a replayed step = the same patch', () => {
  const order = ['oddone', 'math', 'reflex', 'count', 'oddone', 'stroop'];
  for (const n of [2, 8]) {
    const uids = Array.from({ length: n }, (_, i) => `p${i}`);
    let now = 2_000_000;
    const { deal, dk } = dealMatch({ seed: `oc4-sim-${n}`, order, total: 6, used: {} });
    const game = createGame({ matchId: 'oc4', settings: { mode: 'quick' }, participants: Object.fromEntries(uids.map(u => [u, true])), now, seed: `oc4-sim-${n}`, bank: {}, trivia: { n: 99 }, order, deal, dk });
    const online = Object.fromEntries(uids.map(u => [u, true]));
    const marked = {};
    while (game.phase !== 'final') {
      now = game.phaseEndsAt;
      const open = nextStep(game, { now, boards: {}, online, fallback: () => null });
      Object.assign(marked, open.$room || {});
      applyPatch(game, open);
      const type = game.order[game.ci];
      if (type === 'oddone') {
        const spec = generate('oddone', { seed: game.seed, ci: game.ci, level: levelOf(game.ci, game.total), deal: game.deal[game.ci] });
        assert.equal(new Set(spec.grids.map(g => g.fam)).size, 3);
        for (const k of game.dk[game.ci].split(' ')) assert.ok(Object.keys(marked).some(p => p.endsWith(`/${k}`)), `${k} marked as it opened`);
      }
      const parts = partsFor(type, levelOf(game.ci, game.total));
      const boards = Object.fromEntries(uids.map((u, i) => [u, { p: parts, ok: Math.max(0, parts - (i % 3)), n: parts, done: true, doneAt: game.playStartAt + 5000 + i * 600 }]));
      now = game.playStartAt + CHALLENGE_MS + 1000;
      const ctx = { now, boards, online, marks: {}, fallback: () => null };
      const patch = nextStep(game, ctx);
      assert.deepEqual(nextStep(structuredClone(game), { ...structuredClone({ ...ctx, fallback: null }), fallback: () => null }), patch, 'a new host replaying the close writes the same patch');
      applyPatch(game, patch);
      if (game.phase === 'standings') { now = game.phaseEndsAt; applyPatch(game, nextStep(game, { now, boards: {}, online, fallback: () => null })); }
    }
    assert.equal(Object.keys(game.results).length, 6, 'six results — the record the server reads');
    assert.ok(uids.every(u => typeof game.results[0][u].pts === 'number' && typeof game.results[4][u].pts === 'number'));
    assert.ok(game.results[0][uids[0]].pts > game.results[0][uids[1]].pts, 'more right = more points (scoring unchanged)');
    assert.equal(game.settings.mode, 'quick');
  }
  assert.ok(typeof genOddOne === 'function' && typeof challengeRng === 'function');
});

// ---------------------------------------------------------------------------------------------- Group 3 — the timings + THE EXACT FLASH
const ui = f => readFileSync(`js/games/overclock/ui/${f}.js`, 'utf8');
test('QUICK COUNT — THE EXACT FLASH: 1800 − level × 600 ms, the shapes INSTANT at full brightness, the clock starting only once they have painted', async () => {
  const { generate: gen } = await import('../js/games/overclock/challenges.js');
  for (const level of [0, 0.25, 0.5, 0.75, 1]) for (const it of gen('count', { seed: `qc${level}`, ci: 1, level }).items) assert.equal(it.flashMs, Math.round(1800 - level * 600));
  const src = ui('count');
  // the timer to the question is set INSIDE afterPaint (two animation frames after the grid is in the page) — never before
  const show = src.slice(src.indexOf('const show = () => {'), src.indexOf('const ask = it =>'));
  assert.match(show, /stopPaint = afterPaint\(\(\) => \{[\s\S]*timer = setTimeout\(\(\) => ask\(it\), it\.flashMs\);[\s\S]*\}\);/);
  assert.ok(show.indexOf('afterPaint(') < show.indexOf('setTimeout(() => ask(it), it.flashMs)'));
  assert.match(src, /export const afterPaint = fn => \{ let a = requestAnimationFrame\(\(\) => \{ a = requestAnimationFrame\(fn\); \}\);/);
  // nothing on the flash's grid animates or fades in (CSS): the grid, its cells + the shapes have no animation / transition / starting opacity
  const css = readFileSync('css/overclock.css', 'utf8');
  for (const m of css.matchAll(/^\.oc-qc-(grid|cell|shape)[^{]*\{([^}]*)\}/gm)) assert.doesNotMatch(m[2], /animation|transition|opacity/, `.oc-qc-${m[1]}: ${m[2]}`);
  assert.doesNotMatch(show, /q-in|pulseClass/, 'no entrance animation on the flash');
});

test('NO TIMING CHANGED (the owner): the seven screens\' own step times + the challenge constants', async () => {
  const C = await import('../js/games/overclock/challenges.js');
  assert.equal(C.REFLEX_TIMEOUT_MS, 1200);
  for (const level of [0, 0.5, 1]) assert.equal(C.genMemory(rngFrom(`m${level}`), level).stepMs, Math.round(620 - level * 180));
  assert.deepEqual([C.COMPASS_STEP_MS, C.COMPASS_GAP_MS, C.COMPASS_START_MS, C.COMPASS_FLASH_MS], [[760, 700, 640, 590, 550], 80, [1000, 500, 500, 500, 500], 450]);
  const mem = ui('memory');
  assert.match(mem, /MEM_START_MS = 700/); assert.match(mem, /MEM_TURN_MS = 150/);
  assert.match(mem, /glow\(n, s\.stepMs \* 0\.75\)/); assert.match(mem, /MEM_START_MS \+ k \* s\.stepMs/); assert.match(mem, /MEM_START_MS \+ N \* s\.stepMs \+ MEM_TURN_MS/); assert.match(mem, /glow\(i, 260\)/);
  assert.match(ui('stroop'), /right \? 220 : 650/);
  assert.match(ui('oddone'), /right \? 350 : 750/);
  assert.match(ui('count'), /credit === 1 \? 420 : 900/);
  const rx = ui('reflex');
  assert.match(rx, /RX_FIRST_MS = 900, RX_NEXT_MS = 950/); assert.match(rx, /later\(go, s\.delays\[chal\.p\]\)/); assert.match(rx, /REFLEX_TIMEOUT_MS\);/);
  const rw = ui('rewire');
  assert.match(rw, /\}, 400\);/); assert.match(rw, /build\(\); \}, 1100\);/); assert.match(rw, /api\.progress\(2, 2, \{ rw: '' \}, true, 1300\)/);
  const cp = ui('compass');
  assert.match(cp, /later\(round, 350\)/); assert.match(cp, /later\(round, COMPASS_FLASH_MS\)/); assert.match(cp, /t \+= COMPASS_STEP_MS\[r\]/); assert.match(cp, /t \+= COMPASS_GAP_MS/);
  // the surge + the reveals' animations fit inside the existing times
  const { surgeStep, RW_SURGE_MAX } = await import('../js/games/overclock/ui/rewire.js');
  for (let far = 0; far <= 15; far++) assert.ok((far + 1) * surgeStep(far) <= RW_SURGE_MAX && RW_SURGE_MAX + 300 <= 1100, `the surge reaches the core in time (a path ${far + 1} long)`);
});

test('THE SCORING + THE RECORD are unchanged: Color Clash keeps its four colours only; the record the server reads', async () => {
  const C = await import('../js/games/overclock/challenges.js');
  for (let s = 0; s < 300; s++) for (const level of [0, 0.6, 1]) for (const it of C.generate('stroop', { seed: `cc${s}`, ci: 2, level }).items) {
    for (const c of [it.ink, it.word, ...it.order]) assert.ok(C.CLASH_COLORS.includes(c), c);
    assert.equal(new Set(it.order).size, 4);
  }
  assert.deepEqual([...C.CLASH_COLORS].sort(), ['blue', 'green', 'red', 'yellow']);
  assert.equal(C.reflexCredit(230), 1); assert.equal(C.reflexCredit(530), 0.5); assert.equal(C.rewireOk(1, 0.5), 1.3);
});
