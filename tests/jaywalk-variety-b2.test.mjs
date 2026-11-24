// JAYWALK VARIETY B2 (docs/jaywalk.md "VARIETY B2"): THE B1 FIXES (white paint by day · the taps · slimmer downloads) · THE AREA TREES · THE
// EDGE DECORATION · THE WINTER TRUCKS — all a VIEW.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createVariety, PUMP, varietyAt, setWinterTraffic, areaWants, areaIds, AREA_SETS, VARIETY, VARIETY_LINES, VARIETY_REV } from '../js/games/jaywalk/variety.js';
import { TREES, TREE_SETS, DECO_SETS, DECO, treeOf, propIds, dress } from '../js/games/jaywalk/props-plan.js';
import { COLS } from '../js/games/jaywalk/tuning.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = f => readFileSync(join(ROOT, f), 'utf8');
const kb = f => statSync(join(ROOT, f)).size / 1024;
const graph = entry => {
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
  const seen = new Set(), todo = [join(ROOT, entry)];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    let t = ''; try { t = readFileSync(f, 'utf8'); } catch { continue; }
    for (const m of strip(t).matchAll(/(?:from\s+|import\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g)) todo.push(resolve(dirname(f), m[1]));
  }
  return [...seen].map(f => f.slice(ROOT.length + 1).replace(/\\/g, '/'));
};

test('B2 — WHITE VEHICLES BY DAY: the roll-off + the off-white are the VEHICLES\' paint only, and an exact no-op at night (DAY_ROLL 0)', () => {
  const fx = src('js/games/jaywalk/night-fx.js'), n = src('js/games/jaywalk/night.js');
  assert.match(fx, /vColor \*= 1\.0 - 0\.2 \* uRoll \* smoothstep\(0\.42, 0\.82, jwMn\);/, 'the off-white: × 1 at uRoll 0');
  assert.match(fx, /if \(uRoll > 0\.0\) \{ float jwPk = max\(outgoingLight\.r, max\(outgoingLight\.g, outgoingLight\.b\)\); if \(jwPk > 0\.58\) outgoingLight \*= mix\(1\.0, /, 'the roll-off: skipped at night, hue kept (one factor)');
  assert.match(n, /DAY_ROLL\.value = day \? 1 : 0;/);
  assert.equal((n.match(/roll: true/g) || []).length, 3, 'the plain cars, the variety vehicles, the box truck — nothing else (the kid never)');
});

test('B2 — THE TAPS: the loader takes ONE step a call (a parse OR a kind made OR a drop), none in a busy frame, one anyway after PUMP.starve', async () => {
  const log = [], bufs = new Map();
  globalThis.fetch = async u => ({ ok: true, arrayBuffer: async () => { const id = String(u).match(/\/([a-z-]+)\.glb/)[1]; bufs.set(id, 1); return id; } });
  const V = createVariety({ parseGlb: b => { log.push(`parse ${b}`); return { dispose() {} }; }, add: id => log.push(`add ${id}`), drop: id => log.push(`drop ${id}`), ids: ar => (ar === 1 ? ['a', 'b'] : ['c']), url: id => `x/${id}.glb` });
  V.want([1]);
  await new Promise(r => setTimeout(r, 5));
  assert.equal(V.pump(0), true); assert.deepEqual(log, ['parse a'], 'a frame parses ONE model');
  assert.equal(V.pump(0), true); assert.deepEqual(log.slice(1), ['add a'], '… and makes its kind in the NEXT frame');
  assert.equal(V.pump(Infinity), false, 'the frame a hop starts in: nothing');
  for (let k = 1; k < PUMP.starve - 1; k++) assert.equal(V.pump(PUMP.budget + 1), false, `a busy frame (${k}): nothing`);
  assert.equal(V.pump(PUMP.budget + 1), true, 'after PUMP.starve skipped frames: one step anyway');
  V.pump(0);
  assert.deepEqual(V.info().held, ['a', 'b']);
  V.want([2]);   // (the area passed: both let go — ONE a step, never both in one frame)
  const n0 = log.length;
  await new Promise(r => setTimeout(r, 5));
  V.pump(0); V.pump(0);
  assert.deepEqual(log.slice(n0, n0 + 2), ['drop a', 'drop b']);
  V.want([1]);
  assert.ok(V.info().loading >= 1, 'wanted again: fetched again');
  assert.match(src('js/games/jaywalk/night.js'), /if \(!VL\.pump\(busy\) && PR\) PR\.pump\(busy\);/, 'the scene: ONE step a frame across both loaders, at the END of the frame');
  delete globalThis.fetch;
});

test('B2 — SLIMMER DOWNLOADS: every area\'s traffic set under its line (the opening / DOWNTOWN ≈ 200 KB — it was 350)', () => {
  const setKb = ar => areaIds(ar).reduce((a, id) => a + kb(`assets/jaywalk/variety/${id}.glb`), 0);
  const LINE = { '-1': 205, 4: 205, 0: 130, 1: 130, 2: 100, 3: 105, 5: 95, 6: 95, 7: 125 };
  for (const [ar, max] of Object.entries(LINE)) assert.ok(setKb(Number(ar)) < max, `area ${ar}: ${setKb(Number(ar)).toFixed(1)} KB < ${max}`);
  assert.equal(VARIETY_REV, 3, 'the files replaced: the rev bumped (JAYWALK FINAL: the dump truck turned, the snowplow rebuilt)');
});

test('B2 — THE AREA TREES: a tree cell stays ONE tree cell — only WHICH model draws it; every model + file exists', () => {
  for (const [ar, T] of Object.entries(TREE_SETS)) { assert.ok(Math.abs(T.tree.reduce((a, e) => a + e[1], 0) - 1) < 1e-9, `area ${ar}: the mix sums to 1`); for (const [id] of T.tree) assert.ok(TREES[id], id); }
  for (let ar = -1; ar < 8; ar++) for (const id of propIds(ar)) assert.ok(existsSync(join(ROOT, `assets/jaywalk/${id[0] === 't' ? 'trees' : 'edge'}/${id.slice(2)}.glb`)), id);
  assert.equal(treeOf(-1, 45, 0.5), 'palm', 'the opening by THE DOCKS\' gate: palms');
  assert.equal(treeOf(6, 380, 0.1), 'palm'); assert.equal(treeOf(5, 320, 0.99), 'thin');
  const W = { thin: 0.46, oak: 0.6, palm: 0.45, tall: 0.41 };   // (each file's widest across at a height of 1 — the builder's print)
  for (const [id, T] of Object.entries(TREES)) assert.ok(T.code || T.xz * W[id] * (1.02 / 0.87) <= 0.98, `${id}: its crown stays inside its ONE cell at its largest (${(T.xz * W[id] * 1.02 / 0.87).toFixed(2)})`);
});

test('B2 — THE GAMEPLAY LOCK of the dressing: dress() never adds, moves or removes a PLAY cell\'s prop; edge pieces only in an EMPTY edge slot', () => {
  let rnd = 7; const R = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };
  for (let k = 0; k < 4000; k++) {
    const ai = Math.floor(R() * 9) - 1, i = Math.floor(R() * 400) + 1;
    const obs = Array.from({ length: COLS }, () => R() < 0.3);
    const kinds = ['tree', 'bush-planter', 'hydrant', 'crate', 'rock'];
    const d = { obs: [], lamp: R() < 0.25 ? (R() < 0.5 ? -1 : 1) : 0 };
    for (let c = 0; c < COLS; c++) if (obs[c]) d.obs.push({ c, k: kinds[Math.floor(R() * kinds.length)] });
    for (const c of [-1, COLS]) if (R() < 0.5) d.obs.push({ c, k: R() < 0.3 ? 'hydrant' : 'tree', edge: true });
    const before = d.obs.map(q => `${q.c}:${q.k}`), play0 = d.obs.filter(q => q.c >= 0 && q.c < COLS).map(q => `${q.c}:${q.k}`);
    const h = (a, b) => ((Math.sin((i * 131 + a * 17 + b * 7) * 12.9898) * 43758.5453) % 1 + 1) % 1;
    dress(d, i, { mark: '' }, ai, h);
    assert.deepEqual(d.obs.filter(q => q.c >= 0 && q.c < COLS).map(q => `${q.c}:${q.k}`), play0, 'the play cells: the same props, the same cells');
    for (const q of d.obs) if (q.deco) { assert.ok(q.c === -1 || q.c === COLS, 'an edge piece: only an edge column'); assert.ok(d.lamp !== (q.c < 0 ? -1 : 1), 'never on a lamp\'s side'); }
    for (const c of [-1, COLS]) assert.ok(d.obs.filter(q => q.c === c).length <= Math.max(1, before.filter(s => s.startsWith(`${c}:`)).length), 'an edge slot holds one piece');
    for (const q of d.obs) if (q.tk) assert.ok(TREES[q.tk], q.tk);
  }
  for (const [ar, D] of Object.entries(DECO_SETS)) for (const id of D.ids) assert.ok(id === 'bollard' || id.startsWith('t-') || DECO[id], `area ${ar}: ${id} has its size`);
});

test('B2 — THE WINTER TRUCKS: only on a winter run, only in the van slot\'s plain share; named as drawn; their files exist', () => {
  setWinterTraffic(false);
  for (let u = 0; u < 1; u += 0.001) for (const ar of [-1, 0, 1, 2, 3, 4, 5, 6, 7]) for (const s of [1, 2, 3]) assert.ok(!['plow', 'salt'].includes(varietyAt(ar, s, u)), 'never off a winter run');
  setWinterTraffic(true);
  for (const ar of [-1, 0, 1, 2, 3, 4, 5, 6, 7]) {
    const L = (AREA_SETS[ar] || {})[2] || [];
    assert.ok(L.reduce((a, e) => a + e[1], 0) < 0.9, `area ${ar}: the winter tenth was a PLAIN van`);
    assert.equal(varietyAt(ar, 2, 0.92), 'plow'); assert.equal(varietyAt(ar, 2, 0.97), 'salt');
    assert.notEqual(varietyAt(ar, 1, 0.97), 'plow'); assert.notEqual(varietyAt(ar, 3, 0.97), 'salt');
    assert.ok(areaWants(ar).includes('plow') && areaWants(ar).includes('salt'));
  }
  setWinterTraffic(false);
  assert.ok(!areaWants(4).includes('plow'));
  for (const id of ['plow', 'salt']) { assert.equal(VARIETY[id].slot, 2); assert.equal(VARIETY[id].light, 'beacon'); assert.ok(VARIETY_LINES[id].length <= 26); assert.ok(existsSync(join(ROOT, `assets/jaywalk/variety/${id}.glb`))); }
  const n = src('js/games/jaywalk/night.js');
  assert.match(n, /if \(V\.light === 'beacon'\) \{[^\n]*\n\s+if \(day && TL\.cars <= 0\.6\) return;/, 'the beacons: unlit by day');
  assert.match(n, /if \(V\.spray && !reduce\) spray\(/, 'the spray: none with reduce motion');
  assert.match(n, /const wt = SZ\.winter > 0; if \(wt !== winterT\) \{ winterT = wt; setWinterTraffic\(wt\);/, 'set by the run\'s own season (the pack\'s day)');
});

test('B2 — THE GAMEPLAY LOCK: the rules, the replay, the director, the server never reach the props or the winter trucks; none of it in the start bundle', () => {
  for (const e of ['js/games/jaywalk/course.js', 'js/games/jaywalk/engine.js', 'js/games/jaywalk/replay.js', 'js/games/jaywalk/logic.js', 'js/games/jaywalk/director.js', 'js/games/jaywalk/tuning.js', 'js/games/jaywalk/versions.js', 'api/_lib/jaywalk.js']) {
    const g = graph(e);
    for (const f of ['js/games/jaywalk/props.js', 'js/games/jaywalk/props-plan.js', 'js/games/jaywalk/variety.js']) assert.ok(!g.includes(f), `${e} never reaches ${f}`);
  }
  const pg = src('js/games/preload-graph.js');
  assert.ok(!/props\.js|props-plan\.js|assets\/jaywalk\/(trees|edge)/.test(pg), 'the trees + edge pieces: never the start bundle (lazy, per area)');
});

test('B2 — THE TAPS: the extra passes see the same lights (three never re-resolves every program every frame); the review\'s three', () => {
  const n = src('js/games/jaywalk/night.js'), p = src('js/games/jaywalk/props.js');
  assert.match(n, /for \(const l of \[hemi, key, rim\]\) l\.layers\.enableAll\(\);/, 'the occluder, bloom + sun passes keep the light state');
  assert.match(n, /const RWN = o\.rwNight === true;\n\s+setWinterTraffic\(false\);/, 'a new scene never inherits the last one\'s winter trucks');
  assert.match(n, /VL\.destroy\(\); if \(PR\) PR\.destroy\(\); if \(winterT\) setWinterTraffic\(false\);/, 'the teardown stops both loaders + the winter flag');
  assert.match(p, /sw = P\.sway && !A\.reduce \?/, 'the windsock holds still with reduce motion');
});

test('B2 — THE DOCKS + THE FISH MARKET get green: some EDGE crates are palms; a play-cell crate never is; THE BRIDGE unchanged', () => {
  assert.deepEqual(DECO_SETS[0].palm.from, ['crate']); assert.deepEqual(DECO_SETS[1].palm.from, ['crate', 'icecrate']); assert.equal(DECO_SETS[3], undefined);
  let palms = 0, kept = 0;
  for (let i = 1; i < 2000; i++) for (const ai of [0, 1]) {
    const h = (a, b) => ((Math.sin((i * 131 + a * 17 + b * 7) * 12.9898) * 43758.5453) % 1 + 1) % 1;
    const d = { obs: [{ c: 3, k: 'crate' }, { c: -1, k: 'crate', edge: true }, { c: COLS, k: ai ? 'icecrate' : 'crate', edge: true }], lamp: 0 };
    dress(d, i, { mark: '' }, ai, h);
    assert.equal(d.obs.find(q => q.c === 3).k, 'crate', 'a play cell keeps its crate');
    assert.equal(d.obs.length, 3, 'one piece a slot');
    for (const q of d.obs) if (q.c !== 3) { if (q.tk === 'palm') { palms++; assert.equal(q.k, 'tree'); } else kept++; }
  }
  const share = palms / (palms + kept);
  assert.ok(share > 0.4 && share < 0.7, `about half the edge crates (${share.toFixed(2)})`);
});
