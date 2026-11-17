// JAYWALK H5A — THE AREAS' LOOK (docs/jaywalk.md "THE AREAS"): the view's side of the 8 areas — a table per area, what stands where
// (obstacles only where the RULES have one; everything else in the two dim edge columns), the signature pieces (never on a flight path
// or a gateway; the solid ones only on ground lanes; the crane + the bridge's towers straddle), the gateway, the ground. PURE where it
// can be (areas.js#dressLane + sigOf run in node through a stub of three); the rest reads the source. (The rules' side — the mixes,
// fairness, determinism: tests/jaywalk-sim.test.mjs. The pictures: tests/integration/jaywalk-lab.mjs --h5.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as T from '../js/games/jaywalk/tuning.js';
import { createCourse, area, gateName } from '../js/games/jaywalk/course.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(`js/games/jaywalk/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
const A = code('areas.js'), N = code('night.js'), FX = read('js/games/jaywalk/night-fx.js'), V = code('view.js');

/** areas.js's two PURE functions, run here without three.js: the tables + dressLane + sigOf are cut out of the source (they read
 *  COLS, STRETCH, area alone) */
const pure = (() => {
  const src = read('js/games/jaywalk/areas.js');
  const cut = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
  const body = [cut('export const LOOKS', '// ---- THE PIECES'), cut('export const PIECE', '/** the scene\'s context')].join('\n').replace(/export /g, '');
  return new Function('COLS', 'STRETCH', 'area', `${body}\nreturn { LOOKS, lookAt, PIECE, BIG, dressLane, sigOf };`)(T.COLS, T.STRETCH, area);
})();
const hsh = (a, b) => { let x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

test('THE AREAS\' TABLE (the view): 8 looks in the rules\' own order, each its own ground + accent + sky tint; every piece it names is one the scene can draw', () => {
  const { LOOKS } = pure;
  assert.equal(LOOKS.length, T.AREAS.length);
  assert.deepEqual(LOOKS.map(l => l.id), ['docks', 'fish', 'yard', 'bridge', 'downtown', 'canal', 'lighthouse', 'airfield']);
  assert.equal(new Set(LOOKS.map(l => l.accent)).size, 8, 'each gateway its own neon'); assert.equal(new Set(LOOKS.map(l => l.sky)).size, 8, 'each its own tint on the skyline band');
  const built = [...A.matchAll(/G\.(\w+) = build\(/g)].map(m => m[1]);
  const kenney = ['tree', 'barricade', 'bush-planter', 'traffic-cone', 'trash-dumpster'], big = ['container', 'stall', 'shop', 'house', 'rail'];
  for (const L of LOOKS) {
    for (const k of L.obs) assert.ok(built.includes(k) || kenney.includes(k), `${L.id}: an obstacle "${k}" the scene draws`);
    for (const k of L.obs) assert.ok(!big.includes(k), `${L.id}: "${k}" is edge dressing, never an obstacle on a play cell`);
    for (const k of L.edge) assert.ok(built.includes(k) || kenney.includes(k) || big.includes(k), `${L.id}: an edge piece "${k}"`);
    for (const [what, off] of L.sig) { assert.ok(['crane', 'boat', 'fish', 'pylons', 'lighthouse', 'tower', 'hangar'].includes(what), `${L.id}: ${what}`); assert.ok(off >= 5 && off <= 46, 'clear of both gateways'); }
  }
  // the pieces the owner asked for, where he asked for them
  const sig = id => LOOKS.find(l => l.id === id).sig.map(q => q[0]);
  assert.ok(sig('docks').includes('crane') && sig('docks').includes('boat')); assert.ok(sig('fish').includes('fish') && sig('fish').includes('boat'));
  assert.ok(sig('bridge').every(w => w === 'pylons')); assert.ok(sig('lighthouse').includes('lighthouse')); assert.ok(sig('airfield').includes('tower') && sig('airfield').includes('hangar')); assert.ok(sig('canal').includes('boat'));
  assert.ok(LOOKS.find(l => l.id === 'yard').gantry && LOOKS.find(l => l.id === 'yard').edge.includes('container'), 'THE RAIL YARD: signal gantries + freight containers');
  assert.ok(LOOKS.find(l => l.id === 'downtown').edge.includes('shop') && LOOKS.find(l => l.id === 'canal').edge.includes('house') && LOOKS.find(l => l.id === 'canal').footbridge);
  // the ground: one branch an area in the shader, each its own colour — never the asphalt's, never the water's
  const g = FX.slice(FX.indexOf('vec3 areaGround('), FX.indexOf('void main()', FX.indexOf('vec3 areaGround(')));
  assert.equal((g.match(/ar < \d\.5/g) || []).length, 7, '8 grounds (7 thresholds + the last)');
  // (H5B — every ground has its NIGHT colour and its DAY colour: DN(night, day))
  const both = [...g.matchAll(/c = DN\(vec3\(([\d.]+), ([\d.]+), ([\d.]+)\), vec3\(([\d.]+), ([\d.]+), ([\d.]+)\)\) \*/g)].map(m => m.slice(1).map(Number));
  const cols = both.map(c => c.slice(0, 3)), days = both.map(c => c.slice(3));
  assert.ok(cols.length >= 7);
  for (const c of cols) assert.ok(Math.max(...c) >= 0.1 && !(c[2] > c[0] * 2 && c[2] > 0.15), `a ground of its own (${c}) — lit, not water-blue`);
  for (const c of days) assert.ok(Math.max(...c) >= 0.6 && !(c[2] > c[0] * 1.5), `… and its own by day (${c}) — sunlit, never the water's blue`);
  assert.doesNotMatch(g, /c = vec3\(/, 'no ground is left night-only');
  assert.match(FX, /if \(ar > 0\.5\) c = areaGround\(ar, x, z, seed, vLane\);/); assert.match(N, /ground\.lay\(gi\+\+, i, kindOf\(L\)[^;]*, AR \+ 1\);/, 'each lane tells the ground its area (0 = the opening)');
});

test('WHAT STANDS WHERE: an obstacle is drawn ONLY where the rules have one; every other piece stands in the two dim edge columns; a gateway lane carries nothing but its arch', () => {
  const { LOOKS, dressLane, BIG } = pure;
  let obs = 0, edge = 0, lamps = 0;
  for (let s = 0; s < 40; s++) {
    const course = createCourse(`dress${s}`);
    for (let i = 50; i < 850; i++) {
      const L = course.lane(i);
      if (L.type !== 'grass') continue;
      const d = { obs: [], tufts: [], lamp: 0 };
      dressLane(d, LOOKS[area(i).index], i, L, (a, b) => hsh(i * (131 + b * 46), a));
      for (const q of d.obs) {
        if (q.edge) { edge++; assert.ok(q.c === -1 || q.c === T.COLS, `lane ${i}: edge dressing in column ${q.c}`); }
        else { obs++; assert.ok(q.c >= 0 && q.c < T.COLS && L.obs[q.c] === 1, `lane ${i}: a drawn obstacle where the rules have one (column ${q.c})`); assert.ok(!BIG[q.k], 'never a big piece on a play cell'); }
      }
      assert.equal(d.obs.filter(q => !q.edge).length, L.obs.filter(Boolean).length, `lane ${i}: EVERY obstacle of the rules is drawn — nothing blocking is invisible`);
      if (L.mark) assert.equal(d.obs.length + Math.abs(d.lamp), 0, 'a gateway lane: calm, clear');
      if (d.lamp) { lamps++; assert.ok(!d.obs.some(q => q.edge && q.k !== 'rail' && q.c === (d.lamp > 0 ? T.COLS : -1)), 'a lamp never shares its corner'); }
    }
  }
  assert.ok(obs > 2000 && edge > 4000 && lamps > 500, `${obs} obstacles, ${edge} edge pieces, ${lamps} lamps laid`);
  // the scene: a big / built piece is drawn BEFORE the tree fallback (a crate is never a tree); an edge piece is half-lit
  assert.match(N, /if \(q\.big\) drawBig\(q, X\(q\.c \+ 0\.5\), z, \{ K, A: AK, lt, on: on && !day, day, ek: EK \}\);\s*else if \(AK\[q\.k\]\) \{[^}]*\}\s*else if \(q\.k === 'tree'/);
  assert.match(N, /dim = lt \* \(q\.c < 0 \|\| q\.c >= COLS \? EK : 1\)/, 'the edge columns stay dim'); assert.match(N, /EK = day \? 0\.8 : 0\.5,/, '… half-lit by night, a step dimmer by day (H5B)');
});

test('THE SIGNATURE PIECES: never on a flight path, and on a gateway ONLY its own HERO pieces (H5B — the landmark moment at the gate: the gate lane\'s two edge columns); the solid ones (the lighthouse, the tower, the hangars, the stalls, the boats) only on GROUND lanes; the crane + the bridge\'s towers straddle on thin legs; every area gets its own', () => {
  const { LOOKS, sigOf } = pure;
  const count = {};
  for (let s = 0; s < 60; s++) {
    const course = createCourse(`sig${s}`);
    for (let st = 1; st <= 16; st++) {
      const all = sigOf(course, st, (a, b) => hsh(a * 7919 + s, b)), list = all.filter(P => !P.hero), heroes = all.filter(P => P.hero);
      // H5B — THE HERO PIECES: on the gate lane itself (a ground lane the rules keep calm + clear), in its edge columns — one a side
      // (the bridge: its pair of towers), each a piece the area's table names; the crane straddles, never over a flight path
      const want = LOOKS[(st - 1) % 8].hero;
      assert.ok(heroes.length >= 1 && heroes.length <= 2, `the gate's hero pieces: ${heroes.length}`);
      for (const P of heroes) {
        count[`hero:${P.what}`] = (count[`hero:${P.what}`] || 0) + 1;
        assert.equal(P.y0, st * 50, 'beside the gate'); assert.ok(course.lane(P.y0).mark && course.lane(P.y0).type === 'grass', 'the gate lane: marked ground');
        assert.ok(want.includes(P.what) || (P.what === 'boat' && want.includes('crane')), `${P.what} is this area's`);
        if (P.what === 'crane') assert.notEqual(course.lane(P.y0 + 1).type, 'flight');
      }
      assert.equal(new Set(heroes.map(P => P.side)).size, 2 > heroes.length ? heroes.length : 2, 'one a side');
      for (const P of list) {
        count[P.what] = (count[P.what] || 0) + 1;
        assert.ok(P.y0 > st * 50 + 1 && P.y0 < st * 50 + 48 && (P.side === -1 || P.side === 1));
        const lanes = P.what === 'crane' ? [P.y0, P.y0 + 1] : [P.y0];
        for (const y of lanes) { const L = course.lane(y); assert.ok(L.type !== 'flight' && !L.mark, `${P.what} at ${y}: never on a flight path / a gateway`); }
        if (P.what !== 'crane' && P.what !== 'pylons') assert.equal(course.lane(P.y0).type, 'grass', `${P.what} at ${P.y0}: a solid piece stands on a ground lane`);
        assert.equal(area(P.y0).index, (st - 1) % 8, 'inside its own area');
      }
      const solid = list.filter(P => P.what !== 'pylons');
      assert.equal(new Set(solid.map(P => P.y0)).size, solid.length, 'two pieces never share a lane');
      const pyl = list.filter(P => P.what === 'pylons');
      for (const P of pyl) assert.ok(pyl.some(Q => Q.y0 === P.y0 && Q.side === -P.side), 'the bridge\'s towers stand in pairs');
      assert.deepEqual(sigOf(course, st, (a, b) => hsh(a * 7919 + s, b)), all, 'the same pieces on every phone (the seed + the course)');
    }
  }
  for (const w of ['crane', 'boat', 'fish', 'pylons', 'lighthouse', 'tower', 'hangar']) assert.ok(count[w] > 60, `${w}: ${count[w]} placed over 60 courses × 2 laps`);
  assert.ok(count.lighthouse >= 115, `THE LIGHTHOUSE stands in (almost) every lighthouse stretch: ${count.lighthouse} of 120`);
  assert.equal(count['hero:lighthouse'], 120, 'THE LIGHTHOUSE stands beside its own gate in EVERY lighthouse stretch');
  for (const w of ['crane', 'fish', 'stack', 'pylons', 'block', 'row', 'tower', 'hangar', 'boat']) assert.ok(count[`hero:${w}`] >= 100, `the gates' heroes: ${w} × ${count[`hero:${w}`]}`);
  // the straddlers' legs stand on the lane lines; nothing of them is laid over a play column
  assert.match(A, /A\.crane\.put\(x, 0, zc, 0\.75, 0\.82, 1\.1, s < 0 \? Math\.PI : 0,/, 'THE CRANE: over two lanes, its boom reaching OUT (away from the play)');
  assert.match(A, /A\.pylon\.put\(x, 0, z, 0\.9, 0\.95, 1\.47, 0,/, 'a bridge tower: its legs 1 lane apart — on the lane lines');
  assert.match(A, /const leg = \(x, z\) => \(\{ g: box\(0\.2, 3\.1, 0\.2\)/, 'thin legs');
  assert.match(N, /if \(q\.edge && \(q\.c < 0 \? sgL : sgR\)\) continue;/, 'a signature piece takes its side of the lane (no dressing under it)');
  assert.match(A, /return \{ beam: \[x, 0\.1 \+ 3\.9 \* 0\.86, z\] \};/); assert.match(N, /const \[bx, bh, bz\] = beam\.at, sw = reduce \? 0\.25 : Math\.sin\(clock \/ 2300\) \* 0\.95/, 'THE LIGHTHOUSE\'s beam SWEEPS across the lanes — still with reduce motion');
  assert.match(N, /K\.flat\.put\(bx \+ Math\.cos\(ang\) \* len \/ 2, 0\.075,/, '… light on the ground only: it covers nothing');
});

test('THE ARRIVAL GATEWAY: a neon arch on every area\'s first lane — posts in the edge columns, a see-through tube, the area\'s NAME big on the lane (the loop\'s laps named); crossing it = the landmark sound + the name flashing once', () => {
  assert.match(N, /if \(L\.mark && AR >= 0\) \{/); assert.match(N, /const hex = LOOKS\[AR\]\.accent, xl = X\(-0\.55\), xr = X\(COLS \+ 0\.55\)/, 'its posts stand in the two edge columns');
  assert.match(N, /writeGate\(G, gateName\(i\), hex, LOOKS\[AR\]\.paint\);/, 'the name = the rules\' own (course.js#gateName), in the area\'s neon (night) / on its painted board (day)');
  // H5C — THE NAME STANDS ON THE GATE's ARCH (never on the lane, under the kid): an upright sign on the crossbar, facing the camera
  assert.match(N, /const GATE_W = 5\.9, GATE_H = 1\.014, GATE_Y = 3\.14;/); assert.match(N, /const gateGeo = new THREE\.PlaneGeometry\(GATE_W, GATE_H\);/, 'an UPRIGHT plane (not laid on the lane): all of it on screen at ZOOM 8');
  assert.match(N, /G\.m\.position\.set\(0, gy, zf\); G\.m\.quaternion\.copy\(cam\.quaternion\);/, 'it stands on the crossbar, facing the camera');
  assert.match(N, /thru = clamp01\(\(i \+ 1\.3 - ky\) \/ 0\.5\)/, 'gone once he has hopped on through the gate (it never hangs over the lanes he plays next)');
  assert.doesNotMatch(N, /G\.m\.position\.set\(0, 0\.07, z\)/, 'the name no longer lies on the gate\'s lane');
  const arch = N.slice(N.indexOf('if (L.mark && AR >= 0) {'), N.indexOf('const PL = AR >= 0'));
  assert.doesNotMatch(arch, /AK\.|KM\[|K\.trees|K\.barricades/, 'no solid thing is laid across the lane: the posts + light only');
  assert.match(arch, /K\.bill\.put\(0, 3\.04, zf, \(xr - xl\) \* 1\.04, 0\.34, 1, 0, hex, 1, 4,/, 'the crossbar\'s neon tube');
  assert.equal(gateName(450), 'THE DOCKS · LAP 2');
  assert.match(V, /markEl\.textContent = gateName\(e\.lane\); markUntil = performance\.now\(\) \+ 2600;/); assert.match(V, /markEl\.classList\.add\('is-flash'\);/);
  assert.match(V, /if \(sndOn\) \{ try \{ SFX\.play\('area-arrive'\); \}/, 'THE AREA ARRIVAL (H5C — it replaced the landmark ping)');
  const css = read('css/jaywalk.css'), kf = css.slice(css.indexOf('@keyframes jw-gate')).split('\n')[0];
  assert.match(css, /\.jw-mark\.is-flash \{ animation: jw-gate 0\.62s ease-out 1; \}/, 'ONCE'); assert.doesNotMatch(kf, /box-shadow|filter|width|height|left|top|color/, 'transform + opacity only');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{ \.jw-mark\.is-flash \{ animation: none; \} \}/);
  assert.match(css, /\.jw-sky-tint \{[^}]*opacity: 0; transition: opacity/, 'the skyline band\'s tint: opacity only');
  assert.match(code('lab.js'), /mark\.textContent = gateName\(e\.lane\);/, 'the lab shows the same name');
  // a line's words step off a gateway lane (its own name is written there)
  assert.match(N, /const wz = Z\(Ln\.lane \+ \(both \? 1\.42 : 0\.42\) - \(L\.mark \? 1 : 0\)\);/);
});

test('A VIEW: areas.js reads the rules (course.js#area) and never the other way; no rule file knows it; no fetch, no clock of its own, no storage', () => {
  for (const f of ['engine.js', 'course.js', 'replay.js', 'tuning.js', 'logic.js', 'director.js']) assert.doesNotMatch(code(f), /areas\.js/, `${f} never knows the areas' look`);
  assert.match(A, /import \{ area \} from '\.\/course\.js';/);
  for (const bad of [/fetch\(/, /localStorage/, /Date\.now|performance\.now/, /from '[^']*firebase\.js'/, /Math\.random/]) assert.doesNotMatch(A, bad, `areas.js: ${bad}`);
  assert.doesNotMatch(A + N, /PointLight|SpotLight|castShadow/, 'still no real light: the lighthouse\'s beam, the neon are quads');
  assert.match(N, /for \(const g of Object\.values\(AGEO\)\) g\.dispose\(\);/, 'THE LONG NIGHT\'s RULE: the areas\' geometries are freed with the scene');
});
