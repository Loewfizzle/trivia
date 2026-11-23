// JAYWALK VARIETY B1 (docs/jaywalk.md "VARIETY B1"): THE VARIETY A FIXES (the shadow pops · the skyline snow · the clearer day view · the
// snow-start seam) — all a VIEW.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTiers, CAP_WORK_MS } from '../js/games/kit/tiers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = f => readFileSync(join(ROOT, f), 'utf8');

test('B1 — THE SNOW-START SEAM: the ground\'s noise coordinate never wraps at lane 0 — only on a gateway lane (every 50)', () => {
  const fx = src('js/games/jaywalk/night-fx.js');
  assert.ok(!/mod\(vLane,\s*64\.0\)/.test(fx), 'no mod(lane, 64) left: lane −1 read as 63 — the hard line under the start');
  const m = /float lwOf\(float l\) \{ return l < 50\.0 \? l \+ 50\.0 : mod\(l, 50\.0\); \}/.exec(fx);
  assert.ok(m, 'lwOf is the one wrap');
  const lwOf = l => (l < 50 ? l + 50 : ((l % 50) + 50) % 50);
  // continuous from the lanes behind the start (the camera shows ≥ 9 back) through the whole opening; a jump only INTO a gateway lane
  for (let l = -20; l < 1000; l++) {
    const jump = lwOf(l + 1) - lwOf(l) !== 1;
    assert.equal(jump, (l + 1) % 50 === 0 && l + 1 >= 50, `lane ${l} → ${l + 1}`);
  }
  // (the gateway lane is a landmark's — its own paving + neon trim: a seam there is the kind change it already has)
  assert.equal(src('js/games/jaywalk/tuning.js').match(/export const STRETCH = (\d+);/)[1], '50');
});

test('B1 — THE SHADOW POPS: a CPU-bound phone is NOT a capped one — the probe never jumps it back to the top tier', () => {
  const run = (frameMs, workMs, seconds) => {
    const T = createTiers({ initial: 2, max: 2 });
    let now = 0; const path = [2];
    for (let i = 0; i < seconds * 1000 / frameMs(T.get()); i++) { now += frameMs(T.get()); T.sample(now, workMs(T.get())); T.tick(now); if (T.get() !== path[path.length - 1]) path.push(T.get()); }
    return { path, capped: T.capped() };
  };
  // slow frames at every tier because the CPU is busy (work well over CAP_WORK_MS): steps DOWN, never back up mid-run (the flap: 2 1 0 2 1 0)
  const busy = run(() => 40, () => CAP_WORK_MS + 10, 40);
  assert.deepEqual(busy.path, [2, 1, 0], `a busy CPU steps down and stays: ${busy.path}`);
  assert.equal(busy.capped, false);
  // the Low Power cap (light work, 30 Hz): still read as a cap — back to the top tier and it stays (PD6 unchanged)
  const cap = run(() => 33.3, () => 1.5, 30);
  assert.equal(cap.path[cap.path.length - 1], 2); assert.equal(cap.capped, true);
});

test('B1 — THE SHADOW POPS: the sun shadows FADE (1 s) on a tier change, the depth camera texel-snapped, the angle in whole degrees', () => {
  const n = src('js/games/jaywalk/night.js');
  assert.match(n, /sunF = !sunAble \|\| sunF < 0 \? sunT : sunT > sunF \? Math\.min\(sunT, sunF \+ dt \/ 1000\) : Math\.max\(sunT, sunF - dt \/ 1000\);/);
  assert.match(n, /uShK\.value = sunReal \? GR\.sun \* 0\.9 \* ease\(sunF\) : 0;/, 'the depth shadow by the fade');
  assert.match(n, /sunK = \(1 - ease\(sunF < 0 \? 0 : sunF\)\)/, 'the cheap blob the other way');
  assert.match(n, /Math\.round\(er \/ tx\) \* tx - er/, 'texel-snapped');
  assert.match(n, /const el = Math\.round\(Math\.max\(14, Math\.min\(68, GR\.key\[2\]\)\)\)/);
});

test('B1 — MORE CLEAR VIEW UP TOP: the DAY looks\' haze starts later (still full at the sea wall\'s foot), night unchanged', () => {
  const n = src('js/games/jaywalk/night.js');
  const m = /HAZE_LANES = ([\d.]+), HAZE_DAY = ([\d.]+);/.exec(n);
  assert.ok(m && Number(m[1]) === 4.4 && Number(m[2]) < 4.4 && Number(m[2]) >= 1.5, 'night 4.4 lanes (unchanged), day shorter — a soft edge kept');
  assert.match(n, /const hz = day && VA \? HAZE_DAY : HAZE_LANES/);
  assert.match(n, /f = 24\.5 \* k \+ \(footAt - 24\.5 \* k\) \* reveal/, 'the far edge (full haze) unchanged: no lane pops in at the top');
});

test('B1 — THE SKYLINE SNOW: one compositor layer in the winter pack, transform-only motion, still with reduce motion, hidden at rest', () => {
  const s = src('js/games/jaywalk/sky-snow.js');
  assert.match(s, /@keyframes jw-sky-fall \{ from \{ transform: translate3d\(0, 0, 0\); \} to \{ transform: translate3d\(-120px, 360px, 0\); \} \}/);
  assert.ok(!/@keyframes[^}]*\b(top|left|margin|background-position)\b/.test(s), 'transform only');
  assert.match(s, /prefers-reduced-motion: reduce\) \{ \.jw-sky-snow i \{ animation: none; \} \}/);
  // the tile moves exactly a whole number of tiles a loop (seamless): near 120 px tile × 3 down / 1 across; far 80 × 3 / 1
  assert.match(s, /background-size: 120px 120px/); assert.match(s, /background-size: 80px 80px/);
  assert.match(s, /translate3d\(-80px, 240px, 0\)/);
  for (const [w, h] of [...s.matchAll(/background-size: (\d+)px (\d+)px/g)].map(m => [Number(m[1]), Number(m[2])])) assert.ok((w === 120 || w === 80) && (w === 120 ? 360 % h === 0 : 240 % h === 0) && (w === 120 ? 120 % w === 0 : 80 % w === 0), `the ${w} × ${h} tile divides its loop`);
  // never in the start bundle
  assert.ok(!/sky-snow/.test(src('js/games/jaywalk/night.js')), 'the start bundle never imports it');
});

test('B1 — ONE PACK PER SEASON: autumn + winter live, spring + Halloween ready (off); the day’s pack only — an autumn day never fetches a winter file', async () => {
  const { PACKS, packOf, seasonOf } = await import('../js/games/jaywalk/season.js');
  assert.deepEqual(Object.keys(PACKS), ['autumn', 'winter', 'spring', 'halloween']);
  assert.deepEqual(Object.entries(PACKS).filter(e => e[1].live).map(e => e[0]), ['autumn', 'winter']);
  for (const P of Object.values(PACKS)) assert.equal(P.cap, 150);
  assert.equal(packOf(seasonOf('2026-11-25')), 'autumn'); assert.equal(packOf(seasonOf('2026-12-24')), 'winter'); assert.equal(packOf(seasonOf('2027-01-01')), 'winter');
  assert.equal(packOf(seasonOf('2027-02-10')), 'winter'); assert.equal(packOf(seasonOf('2026-07-15')), '');
  const sp = src('js/games/jaywalk/seasonal.js');
  assert.match(sp, /lazyImport\(import\('\.\/sky-snow\.js'\), '\.\/sky-snow\.js'\)/, 'the skyline snow: the winter pack’s own chunk, on a snow day only');
  assert.ok(!/from '\.\/sky-snow\.js'/.test(sp), 'never a static import');
  assert.match(sp, /if \(modelsDay\(s\)\) ps\.push\(loadModels\(\)\);\n\s*if \(s\.autumn > 0\) ps\.push\(loadPile\(\)\);/, 'the winter models on a winter day, the pile on an autumn day');
});

// ---- GROUP 3 — THE AREA TRAFFIC (variety.js — cosmetic: which model draws the rules' slot)
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

test('B1 — THE AREA TRAFFIC: every vehicle\'s slot + its line; the long ones in the 3-cell slot (the school bus in the box truck\'s); emergency bars on police · ambulance · fire truck', async () => {
  const V = await import('../js/games/jaywalk/variety.js');
  assert.deepEqual(V.VARIETY_IDS.filter(id => V.VARIETY[id].slot === 3).sort(), ['bendy', 'schoolbus', 'semi']);
  assert.deepEqual(V.VARIETY_IDS.filter(id => V.VARIETY[id].light).sort(), ['ambulance', 'firetruck', 'police']);
  const { CAUSE_LINES, VEHICLES, causeLine } = await import('../js/games/jaywalk/causes.js');
  for (const id of V.VARIETY_IDS) {
    const l = CAUSE_LINES[`car:${id}`];
    assert.ok(l && /^[A-Z ]+$/.test(l) && l.length <= 26 && !/TAKEN|\bA CAR\b/.test(l), `${id}: "${l}" — capitals, ≤ 26 letters, its own name`);
    assert.ok(VEHICLES.includes(id));
    assert.equal(causeLine({ cause: 'car', vehicle: id }), l);
  }
  assert.equal(CAUSE_LINES['car:schoolbus'], 'FLATTENED BY A SCHOOL BUS');
});

test('B1 — THE AREA SETS: the owner\'s list; plain cars the majority (a 1-cell slot ≥ 2/3 plain everywhere); more TYPES, never more vehicles', async () => {
  const V = await import('../js/games/jaywalk/variety.js');
  const ids = ar => V.areaIds(ar).sort();
  assert.deepEqual(ids(-1), ['bendy', 'citybus', 'delivery', 'police', 'sports', 'suv']); assert.deepEqual(ids(4), ids(-1));
  assert.deepEqual(ids(0), ['delivery', 'forklift', 'garbage', 'semi', 'tanker']); assert.deepEqual(ids(1), ids(0));
  assert.deepEqual(ids(2), ['dump', 'garbage', 'semi']);
  assert.deepEqual(ids(3), ['citybus', 'semi', 'suv', 'tanker']);
  assert.deepEqual(ids(5), ['ambulance', 'schoolbus', 'suv']); assert.deepEqual(ids(6), ids(5));
  assert.deepEqual(ids(7), ['delivery', 'firetruck', 'tanker', 'tug']);
  for (const [ar, S] of Object.entries(V.AREA_SETS)) for (const [slot, L] of Object.entries(S)) {
    const share = L.reduce((a, e) => a + e[1], 0);
    assert.ok(share < 1, `area ${ar} slot ${slot}: some plain left`);
    if (slot === '1') assert.ok(share <= 1 / 3, `area ${ar}: the 1-cell slot keeps ≥ 2/3 plain cars (${share})`);
    for (const [id] of L) assert.equal(V.VARIETY[id].slot, Number(slot), `${id} only in its own slot`);
  }
  assert.equal(V.varietyAt(4, 1, 0.05), 'police'); assert.equal(V.varietyAt(4, 1, 0.99), ''); assert.equal(V.varietyAt(2, 1, 0.01), '', 'THE RAIL YARD: no 1-cell variety');
});

test('B1 — THE NAMES ARE THE DRAWN ONES: vehicleAt names an area model only once it is in on this page (else the plain vehicle — what the slot draws); the slot, the length + the rules untouched', async () => {
  const V = await import('../js/games/jaywalk/variety.js');
  const { vehicleAt, plainAt } = await import('../js/games/jaywalk/causes.js');
  const { createCourse } = await import('../js/games/jaywalk/course.js').then(m => ({ createCourse: m.createCourse || m.makeCourse || m.courseOf }));
  assert.ok(createCourse, 'the course builder');
  const course = createCourse('b1-names');
  const pick = () => { const o = []; for (let i = 250; i < 300; i++) { const L = course.lane(i); if (L.type === 'road') for (let j = 0; j < L.items.length; j++) o.push([i, j, vehicleAt(course, i, j), plainAt(course, i, j), L.items[j].len]); } return o; };
  V.knowAll(false);
  const before = pick();
  assert.ok(before.length > 10 && before.every(r => r[2] === r[3]), 'no model in → every slot named (and drawn) plain');
  V.knowAll(true);
  const after = pick();
  assert.ok(after.some(r => V.VARIETY[r[2]]), 'DOWNTOWN with its models in: some area vehicles');
  for (const r of after) {
    const v = V.VARIETY[r[2]], slot = r[3] === 'truck' ? 3 : r[3] === 'van' ? 2 : 1;
    if (v) assert.equal(v.slot, slot, `${r[2]} drawn in a ${slot}-cell slot (the rule's length ${r[4]})`);
  }
  assert.deepEqual(after.map(r => [r[0], r[1], r[3], r[4]]), before.map(r => [r[0], r[1], r[3], r[4]]), 'the slots + their lengths are the same course: a VIEW');
  V.knowAll(false);
});

test('B1 — EXACTLY THE SLOT\'S LENGTH: a variety model is scaled to the rule\'s length (0.96 · 1.9 · len − 0.1, as the plain car · van · box truck); emergency bars flash by night only, steady with reduce motion; the taxi\'s checker + its TAXI sign', () => {
  const n = src('js/games/jaywalk/night.js');
  assert.match(n, /const bodyL = V\.slot === 3 \? len - 0\.1 : V\.slot === 2 \? 1\.9 : 0\.96, sz = bodyL \/ B\.l/);
  assert.match(n, /const bodyL = len < 1\.5 \? 0\.96 : 1\.9/, 'the plain car + van the same lengths');
  assert.match(n, /const truck = what === 'truck', tz = \(len - 0\.1\) \/ TRUCK\.len;/, 'the box truck: len − 0.1');
  assert.match(n, /if \(V\.light && \(!day \|\| TL\.cars > 0\.6\)\)/, 'the light bar: at night (or with the lights on) — unlit by day');
  assert.match(n, /f = reduce \? 0\.5 : \(clock \/ 190 \+ ph \* 4\) % 2 < 1 \? 1 : 0/, 'flashing — steady with reduce motion');
  assert.match(n, /K\.taxiSign = kind\(/); assert.match(n, /fillText\('TAXI', 64, 26\)/); assert.match(n, /K\.checker\.put\(/);
  assert.match(n, /const NEON = \[(0x[0-9a-f]{6}, ){10}0x[0-9a-f]{6}\];/, 'a wider palette (11)');
  assert.match(n, /if \(V && !vq\) what = plainAt\(course, i, j\);/, 'a model not in: the plain one drawn');
  assert.doesNotMatch(n, /from '\.\.\/\.\.\/\.\.\/assets/, 'no model file in the start bundle');
});

test('B1 — THE GAMEPLAY LOCK: the rules, the replay, the director, the server never reach variety.js; its models never in the preload graph', async () => {
  for (const e of ['js/games/jaywalk/course.js', 'js/games/jaywalk/engine.js', 'js/games/jaywalk/replay.js', 'js/games/jaywalk/logic.js', 'js/games/jaywalk/director.js', 'js/games/jaywalk/tuning.js', 'js/games/jaywalk/versions.js', 'api/_lib/jaywalk.js']) {
    const g = graph(e);
    assert.ok(!g.includes('js/games/jaywalk/variety.js') && !g.includes('js/games/jaywalk/causes.js'), `${e} never reaches the area traffic`);
  }
  const pg = src('js/games/preload-graph.js');
  assert.ok(!/assets\/jaywalk\/variety/.test(pg), 'no variety model in the preload graph');
});
