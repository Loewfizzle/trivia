// PRISM DROP — THE SKIN SYSTEM (SKINS 1 — docs/prism.md "THE SKINS"; the owner's decisions: docs/games/plan.md "SKINS 1").
// THE CONTRACT: every skin has every hook + readable ink (≥ 4.5:1 on its panel); no skin-specific code path outside skins.js + a skin's own art.
// THE ROTATION (pure): the same pool = the same skin; every skin before a repeat; never the same twice in a row; pins win; an un-owned pin falls
// back to ROTATE; a mid-match look flip keeps k; a refresh / rejoin / host change draw the SAME skin (from the shared game state).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SKINS, SKIN_IDS, HOOKS, POOLS, ROTATE, SK_START, owned, ownedOf, poolOf, skinOf, skinK, dealSkin, soloSkin, phoneOf, skinById, defaultSkin } from '../js/games/prism/skins.js';
import { contrast, JEWEL } from '../js/games/prism/skin-kit.js';
import { PAPERS } from '../js/games/prism/crayon.js';
import { hexRgb, rgbHsl, hueDiff } from '../js/games/prism/neon.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const hue = hex => rgbHsl(hexRgb(hex))[0];

test('THE CONTRACT: every skin has every hook', () => {
  for (const id of SKIN_IDS) {
    const s = SKINS[id];
    assert.equal(s.id, id);
    for (const k of HOOKS.data) assert.ok(s[k] != null && s[k] !== '', `${id}.${k}`);
    for (const k of HOOKS.fn) assert.equal(typeof s[k], 'function', `${id}.${k}() is a hook`);
    assert.ok(s.look === 'day' || s.look === 'night' || s.look === null, `${id}.look`);
    assert.ok(s.unlock === null || Number.isInteger(s.unlock.level), `${id}.unlock = null | { level }`);
    assert.ok(['crayon', 'neon'].includes(s.family), `${id}.family = the CSS family`);
    assert.ok(Number.isInteger(s.variants) && s.variants >= 1, `${id}.variants`);
    assert.ok(typeof s.glow === 'number' && typeof s.pieceGlow === 'number', `${id}: the glow amounts`);
    for (const k of ['light', 'flash', 'bands', 'pulse', 'crumbs', 'holiday']) assert.equal(typeof s[k], 'boolean', `${id}.${k}`);
    assert.ok(s.world === 'page' || s.world === 'shader', `${id}.world`);
    // a PAGE skin brings its page painter; a shader skin has none
    if (s.world === 'page') for (const k of ['ok', 'key', 'files', 'paint']) assert.equal(typeof s.page[k], 'function', `${id}.page.${k}()`);
    else assert.equal(s.page, null, `${id}: no page`);
    // a day skin draws its moments on the board (its fx); the night's are light
    if (s.look === 'day') assert.ok(!s.light && !s.flash, `${id}: a day skin's moments are its own fx on the board`);
    assert.equal(typeof s.sounds, 'object');
    assert.ok(Object.isFrozen(s), `${id} is frozen`);
  }
});

test('THE CONTRACT: readable ink — ink + sub ≥ 4.5:1 on the panel (the crayon: on every paper too)', () => {
  for (const id of SKIN_IDS) {
    const t = SKINS[id].tokens;
    for (const k of ['ink', 'sub', 'panel', 'line']) assert.ok(typeof t[k] === 'string' && t[k], `${id}.tokens.${k}`);
    assert.ok(contrast(t.ink, t.panel) >= 4.5, `${id}: ink ${t.ink} on ${t.panel} = ${contrast(t.ink, t.panel).toFixed(2)}`);
    assert.ok(contrast(t.sub, t.panel) >= 4.5, `${id}: sub ${t.sub} on ${t.panel} = ${contrast(t.sub, t.panel).toFixed(2)}`);
  }
  for (const p of PAPERS) assert.ok(contrast(p.ink, p.base) >= 4.5, `the crayon's ${p.id}: ${contrast(p.ink, p.base).toFixed(2)}`);
});

test('THE CONTRACT: a top-out shard keeps each piece in its COLOUR FAMILY (hue within ±20° of its JEWEL hue) in every skin', () => {
  for (const id of SKIN_IDS) for (let t = 1; t <= 7; t++) {
    const c = SKINS[id].shard(t, null);
    assert.match(c, /^#[0-9a-f]{6}$/i, `${id}.shard(${t})`);
    assert.ok(Math.abs(hueDiff(hue(JEWEL[t]), hue(c))) <= 20, `${id}: piece ${t} ${c} vs ${JEWEL[t]}`);
  }
});

test('THE CONTRACT: no skin-specific code path — view.js / board.js / rail.js / victory.js never name a skin or test a look', () => {
  const ids = SKIN_IDS.join('|');
  for (const f of ['js/games/prism/view.js', 'js/games/prism/board.js', 'js/games/prism/rail.js', 'js/games/prism/victory.js']) {
    const code = read(f).split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).map(l => l.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '')).join('\n');
    // (THE GAME LOOK's own 'day' / 'night' is not a skin: only a skin's / a family's NAME is a skin-specific branch)
    assert.doesNotMatch(code, new RegExp(`\\b(look|family)\\s*[!=]==\\s*'(${ids})'`), `${f}: no look === '<a skin>' branch`);
    assert.doesNotMatch(code, new RegExp(`skin(\\.id)?\\s*[!=]==\\s*'(${ids})'`), `${f}: no skin.id === '<id>' branch`);
    assert.doesNotMatch(code, new RegExp(`SKINS\\.(${ids.replace('|glass', '')})\\b`), `${f}: never reaches for one skin by name`);
    assert.doesNotMatch(code, /from '\.\/(crayon-art|crayonfx|neon-art|glass-art|water-art|paper-art)\.js'/, `${f}: imports no skin's art`);
  }
});

test('THE POOLS: DAY + NIGHT in the registry\'s order; the glass is in neither; a look\'s default = its first', () => {
  assert.equal(POOLS.day[0], 'crayon');
  assert.equal(POOLS.night[0], 'neon');
  assert.ok(!POOLS.day.includes('glass') && !POOLS.night.includes('glass'));
  for (const id of [...POOLS.day, ...POOLS.night]) assert.ok(SKINS[id], id);
  assert.equal(defaultSkin('day').id, 'crayon');
  assert.equal(defaultSkin('night').id, 'neon');
  assert.equal(skinById('crayon').id, 'crayon');   // (the share cards' looks, by name)
  assert.equal(skinById('neon').id, 'neon');
  assert.equal(skinById('nope').id, 'glass');
  // the FIRST skin of each look is everyone's (a phone that owns nothing else still draws)
  assert.equal(SKINS[POOLS.day[0]].unlock, null);
  assert.equal(SKINS[POOLS.night[0]].unlock, null);
});

const phone = (day = ROTATE, night = ROTATE, grants = null) => ({ pin: { day, night }, grants });

test('ROTATION: the same pool = the same skin on every phone; every skin before a repeat; never the same twice in a row', () => {
  for (const look of ['day', 'night']) {
    const n = poolOf(look, phone()).length;
    for (let k0 = 0; k0 < 7; k0++) {
      const seq = Array.from({ length: n * 3 }, (_, i) => skinOf({ sk: k0 + i }, look, phone()).id);
      // two phones with the same pool
      assert.deepEqual(seq, Array.from({ length: n * 3 }, (_, i) => skinOf({ sk: k0 + i }, look, phone()).id));
      // every skin once in each run of n
      for (let i = 0; i + n <= seq.length; i++) assert.equal(new Set(seq.slice(i, i + n)).size, n, `${look}: every skin before a repeat (from ${i})`);
      if (n > 1) for (let i = 1; i < seq.length; i++) assert.notEqual(seq[i], seq[i - 1], `${look}: never twice in a row`);
    }
  }
});

test('ROTATION: the HOST\'s deal — the counter +1 a match from the night\'s memory (sk<k>); the first of a night from the seed', () => {
  let used = {};
  const a = dealSkin('seed-a', used);
  assert.ok(Number.isInteger(a.k) && a.k >= 0 && a.k < SK_START);
  assert.equal(a.key, `sk${a.k}`);
  assert.deepEqual(dealSkin('seed-a', {}), a, 'the same seed, the same first counter (a replayed start = the same deal)');
  const ks = [a.k];
  for (let i = 0; i < 12; i++) { used = { ...used, [`sk${ks[ks.length - 1]}`]: true, [`pp${i}-${i % 4}`]: true }; ks.push(dealSkin(`s${i}`, used).k); }
  for (let i = 1; i < ks.length; i++) assert.equal(ks[i], ks[i - 1] + 1, 'the counter climbs by one a match, whatever the seed');
  // the paper's keys + junk in the memory are not counters
  assert.equal(dealSkin('x', { 'pp3-1': true, skx: true, sk: true }).k, dealSkin('x', {}).k);
  // different rooms don't all open on the same skin
  const firsts = new Set(Array.from({ length: 40 }, (_, i) => dealSkin(`room${i}`, {}).k % 3));
  assert.equal(firsts.size, 3, 'a night can open on any skin');
  // a game from before SKINS 1 (no counter) = the look's first skin
  assert.equal(skinK({}), 0); assert.equal(skinK(null), 0); assert.equal(skinK({ sk: -2 }), 0); assert.equal(skinK({ sk: 1.5 }), 0);
  assert.equal(skinOf({}, 'day', phone()).id, 'crayon');
  assert.equal(skinOf({}, 'night', phone()).id, 'neon');
});

test('ROTATION: pins win; an un-owned pin (or one of the other look, or a retired id) falls back to ROTATE', () => {
  for (const id of POOLS.day) {
    assert.deepEqual(poolOf('day', phone(id)), [id], `a DAY pin on ${id}`);
    for (let k = 0; k < 9; k++) assert.equal(skinOf({ sk: k }, 'day', phone(id)).id, id);
    // the night's row is its own: a day pin never touches it
    assert.deepEqual(poolOf('night', phone(id)), poolOf('night', phone()));
  }
  assert.deepEqual(poolOf('day', phone('neon')), poolOf('day', phone()), 'a pin of the other look = ROTATE');
  assert.deepEqual(poolOf('day', phone('nope')), poolOf('day', phone()), 'a retired id = ROTATE');
  assert.deepEqual(poolOf('day', phone('glass')), poolOf('day', phone()), 'the glass is in no pool');
  assert.deepEqual(poolOf('day', null), poolOf('day', phone()), 'no settings = ROTATE');
  // OWNERSHIP: unlock null = everyone; a level unlock = the server's grant
  const locked = { id: 'gold', unlock: { level: 20 } };
  assert.equal(owned(SKINS.crayon, null), true);
  assert.equal(owned(locked, phone()), false);
  assert.equal(owned(locked, phone(ROTATE, ROTATE, { gold: true })), true);
  assert.equal(owned(null, phone()), false);
  for (const look of ['day', 'night']) assert.ok(ownedOf(look, phone()).length >= 1);
  // settings → the phone
  assert.deepEqual(phoneOf({ prismSkinDay: 'crayon' }).pin, { day: 'crayon', night: ROTATE });
  assert.deepEqual(phoneOf({}).pin, { day: ROTATE, night: ROTATE });
  assert.deepEqual(phoneOf(null).pin, { day: ROTATE, night: ROTATE });
});

test('ROTATION: a mid-match look flip keeps k (the other pool, the same counter); a refresh / rejoin / host change draw the SAME skin', () => {
  for (let k = 0; k < 12; k++) {
    const game = { sk: k, seed: 'm', matchId: 'x' };
    const day = skinOf(game, 'day', phone()), night = skinOf(game, 'night', phone());
    assert.equal(day.id, POOLS.day[k % POOLS.day.length]);
    assert.equal(night.id, POOLS.night[k % POOLS.night.length]);
    // flip there and back: the same skins (nothing local, nothing remembered)
    assert.equal(skinOf(game, 'day', phone()), day);
    // a refresh / a rejoin / a new host read the SAME game from the database (a JSON round trip) → the same skin
    const again = JSON.parse(JSON.stringify(game));
    assert.equal(skinOf(again, 'day', phone()).id, day.id);
    assert.equal(skinOf(again, 'night', phone()).id, night.id);
  }
  // skinOf reads nothing but the game + the phone's settings
  const src = read('js/games/prism/skins.js');
  const fn = src.slice(src.indexOf('export function skinOf('), src.indexOf('export function dealSkin('));
  assert.doesNotMatch(fn, /Math\.random|Date\.now|localStorage|document\./);
});

test('ROTATION: the PLAYER\'s own counter (a solo run + THE DROP): +1 a run, from this phone\'s settings', () => {
  assert.deepEqual(soloSkin(undefined), { k: 0, next: 1 });
  assert.deepEqual(soloSkin(4), { k: 4, next: 5 });
  assert.deepEqual(soloSkin(-3), { k: 0, next: 1 });
  assert.deepEqual(soloSkin('7'), { k: 0, next: 1 });
  let cur, seen = [];
  for (let i = 0; i < 6; i++) { const r = soloSkin(cur); seen.push(skinOf({ sk: r.k }, 'day', phone()).id); cur = r.next; }
  const n = POOLS.day.length;
  for (let i = 0; i + n <= seen.length; i++) assert.equal(new Set(seen.slice(i, i + n)).size, n, 'every day skin before a repeat, run after run');
});

test('THE DROP\'s counter: the player\'s own, ONE a day — a refresh / a resume of the day\'s run keeps its skin; a new day takes the next', async () => {
  const { dropSkin } = await import('../js/games/prism/skin-deal.js');
  const s = { prismSkinK: 4 };
  const a = dropSkin(s, '2026-11-14');
  assert.deepEqual(a, { k: 4, patch: { prismSkinK: 5, prismSkinDrop: { d: '2026-11-14', k: 4 } } });
  Object.assign(s, a.patch);
  assert.deepEqual(dropSkin(s, '2026-11-14'), { k: 4, patch: null }, 'the same day: the same skin, nothing saved again');
  const b = dropSkin(s, '2026-11-15');
  assert.equal(b.k, 5); assert.equal(b.patch.prismSkinK, 6);
  assert.deepEqual(dropSkin({}, 'd'), { k: 0, patch: { prismSkinK: 1, prismSkinDrop: { d: 'd', k: 0 } } });
  assert.deepEqual(dropSkin(null, 'd').k, 0);
});

test('THE HOST\'s deal is wired: start() stores game.sk + its key in the night\'s memory; a solo run takes the phone\'s counter; THE DROP its day\'s', () => {
  const idx = read('js/games/prism/index.js');
  assert.match(idx, /import \{ dealSkin, soloSkin \} from '\.\/skin-deal\.js'/, 'the leaf — the cartridge loads no skin art to deal');
  assert.match(idx, /if \(soloRun\) \{ const r = soloSkin\(phoneSettings\.prismSkinK\); sk = r\.k; updateSettings\(\{ prismSkinK: r\.next \}\); \}/);
  assert.match(idx, /else \{ const d = dealSkin\(seed, \(used && used\.prism\) \|\| \{\}\); sk = d\.k; skKey = d\.key; \}/);
  assert.match(idx, /pp: paper\.i, sk \}/);
  assert.match(idx, /markUsed\('prism', skKey \? \[paper\.key, skKey\] : \[paper\.key\]\)/);
  const drop = read('js/games/drop/view.js');
  assert.match(drop, /const sk = dropSkin\(settings, r\.day\);\s+if \(sk\.patch\) updateSettings\(sk\.patch\);/);
  assert.match(drop, /sk: sk\.k, id: 'prism'/);
  // the settings: this phone only, ROTATE by default
  const st = read('js/audio/settings.js');
  assert.match(st, /prismSkinDay: 'rotate', prismSkinNight: 'rotate', prismSkinK: 0/);
  // the view reads the skin from the game + the pins — never a local guess
  const v = read('js/games/prism/view.js');
  assert.match(v, /const matchSkin = lk => skinOf\(game, lk, phoneOf\(settings\)\);/);
  // the settings sheet: the rows come from the picker, lazily; a look with one owned skin has no row
  assert.match(read('js/ui/settings-panel.js'), /lazyImport\(import\('\.\.\/games\/prism\/picker\.js'\), '\.\.\/games\/prism\/picker\.js'\)/);
  assert.match(read('js/games/prism/picker.js'), /if \(ids\.length < 2\) continue;/);
});

test('ONLY THE SHOWN SKIN\'s FILES: a page lists its own texture(s) and nothing else; enter() loads only its own', async () => {
  const P = await import('../js/games/prism/skin-pages.js');
  const files = id => SKINS[id].page.files({ paper: PAPERS[0] }).map(u => u.split('/').pop());
  assert.deepEqual(files('watercolor'), ['watercolor.webp']);
  assert.deepEqual(files('paper'), ['kraft.webp']);
  assert.deepEqual(files('crayon'), [PAPERS[0].file], 'the crayon: the match\'s paper only');
  assert.match(P.WATER_TEX, /assets\/prism\/paper\/watercolor\.webp$/);
  assert.match(P.KRAFT_TEX, /assets\/prism\/paper\/kraft\.webp$/);
  const src = read('js/games/prism/skins.js');
  const body = id => { const a = src.indexOf(`const ${id} = {`); return src.slice(a, src.indexOf('\n};', a)); };
  assert.match(body('watercolor'), /enter\(\) \{ loadImg\(WATER_TEX\); loadMarker\(\); \}/);
  assert.doesNotMatch(body('watercolor'), /KRAFT_TEX|warmDay/);
  assert.match(body('paper'), /enter\(\) \{ loadImg\(KRAFT_TEX\); loadMarker\(\); \}/);
  assert.doesNotMatch(body('paper'), /WATER_TEX|warmDay/);
  assert.doesNotMatch(body('neon'), /loadImg|loadMarker|warmDay/, 'the night loads no paper + no marker font');
  // the textures are small (the cartridge's preload budget is the JS; these load only when their skin shows)
  const { statSync } = await import('node:fs');
  for (const f of ['watercolor.webp', 'kraft.webp']) assert.ok(statSync(new URL(`../assets/prism/paper/${f}`, import.meta.url)).size < 60 * 1024, `${f} < 60 KB`);
});

test('THE TIERS: a page skin drops its world silhouettes on the lower tiers (lite); the fx keep fewer particles under the low tiers\' cap', async () => {
  const P = await import('../js/games/prism/skin-pages.js');
  assert.equal(P.WATER_PAGE.lite, true); assert.equal(P.PAPER_PAGE.lite, true);
  assert.match(read('js/games/prism/view.js'), /lite: !!\(pg && pg\.lite\) && tier <= 1/);
  for (const f of ['waterfx.js', 'paperfx.js']) assert.match(read(`js/games/prism/${f}`), /const lean = \(\) => cap <= 100;/, `${f}: the lower tiers' cap (tiers.js sparks 40 / 90) keeps fewer`);
  const { TIERS } = await import('../js/games/prism/tiers.js');
  assert.ok(TIERS[0].sparks <= 100 && TIERS[1].sparks <= 100 && TIERS[2].sparks > 100 && TIERS[3].sparks > 100);
});

test('THE CLEAR\'s HOLD: a skin\'s clear may ask for a beat with the cleared rows EMPTY (the peel) — the crayon + the watercolor ask for none', async () => {
  const mk = () => ({ e: 'clear', lines: 2, rows: [0, 1], cells: [Array(10).fill(1), Array(10).fill(2)], combo: 0, pc: false });
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true }) }) };
  try {
    const { createPaperFx, GAP_MS, STAGGER_MS } = await import('../js/games/prism/paperfx.js');
    const p = createPaperFx();
    assert.deepEqual(p.event(mk(), { px: 30, reduced: false }), { hold: GAP_MS + STAGGER_MS, gap: true });
    assert.equal(createPaperFx().event(mk(), { px: 30, reduced: true }), null, 'reduced effects: no hold, nothing flies');
    assert.equal(p.event({ e: 'lock', t: 1, cells: [[0, 0]] }, { px: 30, reduced: false }), null);
    const { createWaterFx } = await import('../js/games/prism/waterfx.js');
    assert.equal(createWaterFx().event(mk(), { px: 30, reduced: false }) || null, null);
    const { createCrayonFx } = await import('../js/games/prism/crayonfx.js');
    assert.equal(createCrayonFx().event(mk(), { px: 30, reduced: false }) || null, null);
  } finally { delete globalThis.document; }
  const v = read('js/games/prism/view.js');
  assert.match(v, /if \(ask\.gap\) for \(const y of ev\.rows\) if \(y >= 0 && \(y \+ 1\) \* E\.W <= pre\.length\) pre\.fill\(0, y \* E\.W, \(y \+ 1\) \* E\.W\);/);
});

test('PAPER CUT-OUT: the world\'s corner cut-out is a LIGHT paper — the top line\'s ink keeps ≥ 4.5:1 where it crosses it; every world has its layers', async () => {
  const { WORLD_CUTS } = await import('../js/games/prism/skin-pages.js');
  for (const w of ['sunset', 'city', 'crystal', 'nebula', 'aurora']) {
    const C = WORLD_CUTS[w];
    assert.ok(C && C.papers.length === 3 && C.shapes.length === 3, `${w}: three layers`);
    assert.ok(contrast('#33230f', C.disc.col) >= 4.5, `${w}: the top line's ink on its cut-out ${C.disc.col} = ${contrast('#33230f', C.disc.col).toFixed(2)}`);
    for (const f of C.shapes) for (let u = 0; u <= 1; u += 0.1) assert.ok(Number.isFinite(f(u)));
  }
  // the top line on the kraft board itself
  assert.ok(contrast('#33230f', '#c6a576') >= 4.5);
});
