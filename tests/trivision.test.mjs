// THE TRI-VISION (Nov 12 night — core/harbor-trivision.js): the roof board turns HOLD'EM ↔ JAYWALK. The clock (every gap 45–60 s, the same on every
// phone, alternating faces, &force=trivision's 8 s), JAYWALK's switch (the default ON · COMING SOON, the owner's OPEN DAY — the past stays true, OFF
// = HOLD'EM alone), the billposter stays home while it turns, the slats' ripple + prism look, the timetable rows, the poster's words (COMING SOON
// ~60 % of JAYWALK, on the art's black left), the remote panel rows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { setHoldem, setHoldemForce } from '../js/core/harbor-holdem.js';
import { setJaywalk, setJaywalkForce, jaywalkShow, jaywalkState, triFaces, triKeeps, triClock, turnsBetween, chapterTurns, chapterHash, triKnobs, slatU, slatLook, cleanJaywalk, jaywalkRev } from '../js/core/harbor-trivision.js';
import { workDay } from '../js/core/harbor-workers.js';
import { knob } from '../js/core/harbor-schedule.js';

const reset = () => { setHoldem(null); setHoldemForce(null); setJaywalk(null); setJaywalkForce(null); };
const day0Of = key => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d) / 1000 + 300 * 60; };

test('the timetable rows: billboard.jaywalk (ON from this deploy\'s day, COMING SOON, no open day) + billboard.trivision (every 45–60 s, a 1.2 s turn, readable slats)', () => {
  const J = knob('billboard.jaywalk'), T = knob('billboard.trivision');
  assert.deepEqual([J.on, J.open, J.poster], [true, null, 'jaywalk']); assert.match(J.since, /^2026-11-1[23]$/);
  assert.deepEqual(T.every, [45, 60]); assert.equal(T.turn, 1.2); assert.ok(T.slats >= 10 && T.slats <= 14, `${T.slats} slats`); assert.equal(T.force, 8);
});

test('THE CLOCK: every gap between turns 45–60 s, two a chapter, the faces alternating — the same answer for the same moment (every phone)', () => {
  const K = triKnobs(), T = turnsBetween(1_763_000_000, 1_763_000_000 + 86400 * 2, K);
  assert.ok(T.length > 3000, `${T.length} turns in two days`);
  for (let i = 1; i < T.length; i++) { const g = T[i] - T[i - 1]; assert.ok(g >= 45 - 1e-9 && g <= 60 + 1e-9, `gap ${g}`); }
  // the clock at a turn: the face flips; between two turns it holds
  for (const t of T.slice(0, 40)) {
    const before = triClock(t - 0.01, K), at = triClock(t + 0.01, K), later = triClock(t + K.turn + 0.5, K);
    assert.equal(at.n, before.n + 1, 'one more turn'); assert.notEqual(at.face, before.face, 'the face flips'); assert.ok(at.u > 0 && at.u < 0.05, 'the turn starts');
    assert.equal(later.u, null, 'over after `turn` s'); assert.equal(later.face, at.face);
  }
  // pure: the same moment = the same answer; the chapter's hash is integer maths (no Math.sin)
  assert.deepEqual(triClock(1_763_123_456.7, K), triClock(1_763_123_456.7, K));
  assert.equal(chapterHash(12345, 1924), chapterHash(12345, 1924)); assert.notEqual(chapterHash(12345, 1924), chapterHash(12346, 1924));
  const [a, b] = chapterTurns(100, K); assert.equal(a, 100 * 105); assert.ok(b - a >= 45 && b - a <= 60);
  assert.doesNotMatch(readFileSync(new URL('../js/core/harbor-trivision.js', import.meta.url), 'utf8').replace(/\/\/.*$/gm, ''), /Math\.(sin|random)|Date\.now/, 'the clock never reads a clock or Math.sin / Math.random');
});

test('&force=trivision: a turn every 8 s', () => {
  const K = triKnobs();
  assert.deepEqual(turnsBetween(80, 120, K, 8), [80, 88, 96, 104, 112]);
  assert.notEqual(triClock(83, K, 8).face, triClock(91, K, 8).face);
  assert.ok(triClock(88.6, K, 8).u > 0.4 && triClock(88.6, K, 8).u < 0.6);
});

test('JAYWALK\'s switch: the default ON · COMING SOON from its day; the owner\'s OPEN DAY → NOW OPEN from that day (the past stays true); OFF = HOLD\'EM alone, no turning', () => {
  reset();
  assert.equal(jaywalkState().src, 'default');
  assert.equal(jaywalkShow('2026-11-11'), null, 'before its day: none');
  assert.equal(jaywalkShow('2026-11-14'), 'jaywalk');
  assert.deepEqual(triFaces('2026-11-14'), ['jaywalk', 'holdem-open'], 'both up → the board turns (CITY PART 1: the newest first — HIGH RISE → JAYWALK → HOLD\'EM; HIGH RISE not live yet on the 14th)');
  const r0 = jaywalkRev();
  setJaywalk({ on: true, bar: 'soon', open: '2026-12-01', since: '2026-11-12' });
  assert.ok(jaywalkRev() > r0, 'a change bumps the revision');
  assert.equal(jaywalkShow('2026-11-30'), 'jaywalk', 'the day before it opens: COMING SOON');
  assert.equal(jaywalkShow('2026-12-01'), 'jaywalk-open', 'NOW OPEN from its open day');
  assert.equal(jaywalkShow('2026-12-1'), 'jaywalk-open', 'the city\'s unpadded day keys too');
  setJaywalk({ on: true, bar: 'open' }); assert.equal(jaywalkShow('2026-11-14'), 'jaywalk-open', 'NOW OPEN at once');
  setJaywalk({ on: false }); assert.equal(triFaces('2026-11-14'), null, 'OFF: HOLD\'EM alone'); assert.equal(triKeeps('2026-11-14'), false);
  setJaywalk(null); setHoldem({ on: false }); assert.equal(triFaces('2026-11-14'), null, 'HOLD\'EM off: no turning either');
  assert.deepEqual(cleanJaywalk({ on: 'x', bar: 'nope', open: 'tomorrow' }), { on: true, bar: 'soon', open: null, since: null }, 'a bad value is cleaned');
  assert.equal(cleanJaywalk(null), null);
  setJaywalkForce({ since: '2026-11-20', bar: 'open' }); assert.equal(jaywalkShow('2026-11-20'), 'jaywalk-open', '&force=billboard-jaywalk&jaywalk=open');
  reset();
});

test('THE BILLPOSTER stays home while the board turns (the turning board is the motion); off → the HOLD\'EM rule as before', () => {
  reset();
  const kinds = key => workDay(key, { seed: 1924, day0: day0Of(key), off: -300 }).map(w => w.kind);
  for (const k of ['2026-11-13', '2026-11-20', '2026-12-04']) { assert.equal(triKeeps(k), true); assert.ok(!kinds(k).includes('billposter'), `${k}: no billposter`); }
  // (the tri-vision's own rule: HOLD'EM switched on from a day — HOLD'EM's rule alone would send him to paste it — the turning board keeps him home)
  setHoldem({ on: true, bar: 'open', since: '2026-11-18' });
  assert.equal(triKeeps('2026-11-18'), true); assert.ok(!kinds('2026-11-18').includes('billposter'), 'the first day of the turning board: no paste');
  setJaywalk({ on: false }); assert.ok(kinds('2026-11-18').includes('billposter'), "JAYWALK off (before HIGH RISE's go-live): HOLD'EM's rule — he pastes it once");
  // (CITY PART 1: from HIGH RISE's go-live its face turns with HOLD'EM's — JAYWALK off, the board still turns: he stays home)
  setHoldem({ on: true, bar: 'open', since: '2026-11-25' });
  assert.equal(triKeeps('2026-11-25'), true); assert.ok(!kinds('2026-11-25').includes('billposter'), 'HIGH RISE + HOLD’EM turn: no paste');
  reset();
});

test('THE RIPPLE: the slats turn left → right inside the turn; each a prism going round 120° (the old face to the left, the new from the right)', () => {
  const n = 12;
  assert.equal(slatU(0, n, 0), 0); assert.equal(slatU(n - 1, n, 1), 1);
  assert.ok(slatU(0, n, 0.3) > slatU(n - 1, n, 0.3), 'the left slats first');
  for (let i = 0; i < n; i++) assert.equal(slatU(i, n, 1), 1, `slat ${i} done at the end`);
  const s0 = slatLook(0), s1 = slatLook(1), sm = slatLook(0.5);
  assert.deepEqual([s0.a, s0.b], [1, 0]); assert.ok(Math.abs(s1.b - 1) < 1e-9 && s1.a < 1e-9);
  assert.ok(Math.abs(sm.a - 0.5) < 1e-9 && Math.abs(sm.a + sm.b - 1) < 1e-9 && sm.la < 1 && sm.lb < 1, 'mid-turn: both faces, both shaded');
});

test('the scene: the tri-vision\'s pieces (the warm after the reveal, the swap under the slats, the crisp z 4, reduced motion = a cut, the click quiet)', () => {
  const sc = readFileSync(new URL('../js/screens/harbor/scene.js', import.meta.url), 'utf8');
  // (CITY B: only when a JAYWALK face is up — needJw; THE DROP's painter the same way — needDr)
  // (CITY H2: after the reveal — except the ONE face the board opens on (early(f): the pick), never the boot graph either way)
  assert.match(sc, /const early = f => shownAt >= 0 \|\| tri\.pick === f;/);
  assert.match(sc, /if \(needSoon && !tri\.warmed && early\('jaywalk'\) && performance\.now\(\) >= tri\.retryAt\) \{ tri\.warmed = true; lazyImport\(import\('\.\/jaywalk-art\.js'\)/, 'the poster module + its art: lazy, after the reveal unless it is the pick');
  // (CITY F — THE OPEN NOW BILLBOARD: from the OPEN DAY the owner's poster warms instead — after the reveal, a face only once ITS picture decoded)
  assert.match(sc, /if \(needOpen && !tri\.openWarmed && early\('jaywalk-open'\) && performance\.now\(\) >= tri\.retryAt\) \{ tri\.openWarmed = true; lazyImport\(import\('\.\/jaywalk-art\.js'\)/);
  assert.match(sc, /const G = F\.filter\(f => \(f !== 'jaywalk' \|\| tri\.jw\) && \(f !== 'jaywalk-open' \|\| tri\.jwOpen\)/);
  assert.match(sc, /if \(needDr && !tri\.drWarm && early\('drop'\) && performance\.now\(\) >= tri\.drRetry\) \{ tri\.drWarm = true; lazyImport\(import\('\.\/drop-art\.js'\)/);
  // (PLAY NOW 0c — THE ROOF BOARD STOPPED TURNING: a failed art / painter is asked again on a backoff + reported, never left for good)
  assert.match(sc, /tri\.retryAt = performance\.now\(\) \+ \[3e3, 15e3, 60e3, 300e3\]\[Math\.min\(tri\.fails - 1, 3\)\]/);
  assert.match(sc, /m\.warmJaywalk\(\(\) => \{[^}]*\}, why => \{ if \(!destroyed\) triWarmFailed\(/);
  assert.match(sc, /reportError\(new Error\(`THE TRI-VISION: \$\{\/HIGH RISE\/\.test\(what\) \? '' : 'JAYWALK’s '\}\$\{what\} failed to load/);   // (CITY PART 1: HIGH RISE's face reports by its own name)
  assert.match(readFileSync('js/screens/harbor/jaywalk-art.js', 'utf8'), /me\.onerror = \(\) => \{ if \(L\.img === me\) L\.img = null; flush\(false, `\$\{what\} failed`\); \};/);
  const signs = readFileSync(new URL('../js/screens/harbor/signs.js', import.meta.url), 'utf8');
  assert.doesNotMatch(signs + sc, /^import [^\n]*jaywalk-art\.js/m, 'no static import of the poster');
  // (CITY H2 — ONE FACE FROM THE FIRST FRAME: the PICK from all of today's faces (never the face that warmed first); before the reveal a CUT (no
  //  painted frame shows another face), after it (the pick's picture late) a TURN — its own motion (THE WINDOW RULE)
  assert.match(sc, /if \(F && tri\.lastN == null\) tri\.pick = F\[newestFace\(F, faceDates\(\)\)\];/);
  assert.match(sc, /let o = F\.indexOf\(tri\.pick\);/);
  assert.match(sc, /if \(o !== tri\.shown && shownAt >= 0 && [^\n]*triTurnTo\(F, o,/, 'after the reveal the opening TURNS (THE WINDOW RULE)');
  assert.match(sc, /boardGame: bt \? \(tri\.faces && tri\.faces\[tri\.shown\]\) \|\| boardWant\(/, 'a neon re-layout keeps the tri-vision face (the 4:03 pm flash)');
  assert.match(sc, /id: 'roofboard-tri', z: 4/, 'the slats over every poster copy');
  assert.match(sc, /if \(!S\.motion \|\| document\.visibilityState !== 'visible'\) \{ tri\.turn = null; return; \}/, 'reduced motion: a cut');
  assert.match(sc, /snd\.play\('radio-tick', \{ gain,/, 'the click on the city\'s SFX bus');
  const art = readFileSync(new URL('../js/screens/harbor/jaywalk-art.js', import.meta.url), 'utf8');
  assert.doesNotMatch(art, /FontFace|@font-face|fonts\.googleapis/, 'no font load — the lettering is path data');
});

test('THE JAYWALK POSTER READS (FR7 FIXES C — the owner, Nov 13): in HOLD\'EM\'s own poster box, JAYWALK\'s cap ≥ HOLD\'EM\'s, its band\'s words ≥ NOW OPEN\'s, the word ~92 % of the width, the art never stretched', async () => {
  const { wordsOf, coverOf, capsOf, JW_ASPECT } = await import('../js/screens/harbor/jaywalk-art.js').catch(() => ({}));
  const { holdemCaps, POSTER_ASPECT } = await import('../js/screens/harbor/holdem-art.js').catch(() => ({}));
  if (!wordsOf || !holdemCaps) return;   // (a runtime without the DOM's Path2D at import: the browser suite covers it)
  const { JW_GLYPHS: G } = await import('../js/screens/harbor/jaywalk-glyphs.js');
  assert.equal(JW_ASPECT, POSTER_ASPECT, 'the same poster box as HOLD\'EM');
  for (const R of [{ x: 0, y: 0, w: 70, h: 38 }, { x: 10, y: 5, w: 85, h: 46 }, { x: 0, y: 0, w: 150, h: 81 }, { x: 0, y: 0, w: 300, h: 166 }]) {
    for (const bar of ['soon', 'open']) {
      const J = capsOf(R, bar), Hc = holdemCaps(R, 'open');
      assert.ok(J.word >= Hc.word - 1e-9, `JAYWALK ${J.word.toFixed(2)} ≥ HOLD'EM ${Hc.word.toFixed(2)} pt (${R.w} wide)`);
      assert.ok(J.bar >= Hc.bar - 1e-9, `the band ${J.bar.toFixed(2)} ≥ NOW OPEN ${Hc.bar.toFixed(2)} pt`);
      const W = wordsOf(R, bar), ww = G.jaywalk.w * W.jc / G.jaywalk.cap;
      assert.ok(ww >= W.B.W * 0.78 && ww <= W.B.W * 0.95, `JAYWALK across ~80–92 % of the poster (${(ww / W.B.W * 100).toFixed(0)} %)`);
      assert.ok(W.jb < W.bandY && W.bb <= R.y + R.h + 1e-9, 'the word above the band, the band\'s words inside the board');
    }
    const C = coverOf(R);
    assert.ok(Math.abs(C.dw / C.dh - 848 / 448) < 1e-9 && C.dw >= R.w - 1e-9 && C.dh >= R.h - 1e-9, 'COVER — the art\'s own 848 : 448');
  }
});

test('the remote panel: &force=billboard-jaywalk (+ &jaywalk=) + &force=trivision each have a row', () => {
  const r = readFileSync(new URL('../js/core/harbor-remote.js', import.meta.url), 'utf8');
  assert.match(r, /\{ id: 'billboard-jaywalk', [^\n]*inputs: \['jaywalk'\]/);
  assert.match(r, /\{ id: 'trivision', /);
  assert.match(r, /'holdem', 'jaywalk'[,\]]/);   // (CITY B: the blade look's inputs follow)
});

// CITY A — item 7, THE BILLBOARD FLASH: the slats HOLD the new face until its bake has landed (no fixed 3 s); N faces (CITY B's THE DROP)
import { triProgress, triClock as triClock2, triKnobs as triKnobs2 } from '../js/core/harbor-trivision.js';
test('CITY A — the turn holds the NEW face until the city\'s re-bake has landed (the old face never shows again); the cap is a timetable knob', () => {
  assert.equal(triProgress(0.6, 1.2, true), 0.5);
  assert.equal(triProgress(1.3, 1.2, true), 1, 'turned, the bake still out: the new face held');
  assert.equal(triProgress(1.2 + 6, 1.2, true), 1, 'a slow phone\'s bake 6 s late: STILL held (it let go at 3 s — the flash)');
  assert.equal(triProgress(1.3, 1.2, false), null, 'landed: the slats go, the city shows the new face');
  assert.equal(triProgress(1.2 + 20, 1.2, true, 20), null, 'the safety cap (holdMax) only');
  assert.equal(triKnobs2().holdMax, 20, 'THE CITY TIMETABLE row billboard.trivision carries holdMax');
  const src = readFileSync(new URL('../js/screens/harbor/scene.js', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /e < T\.dur \+ 3\)/, 'no fixed 3-s hold');
  assert.match(src, /triProgress\(e, T\.dur, baking, triKnobs\(\)\.holdMax \|\| 20\)/);
});
test('CITY A — the turn works for N faces: the turns\' TIMES never change, only which face each lands on', () => {
  const K = triKnobs2();
  for (const t of [1794364216, 1794364224.5, 1800000000]) {
    const a = triClock2(t, K, 8, 2), b = triClock2(t, K, 8, 3);
    assert.equal(a.at, b.at); assert.equal(a.n, b.n); assert.equal(a.face, a.n % 2); assert.equal(b.face, b.n % 3);
  }
  assert.equal(triClock2(1794364216, K, 8).face, triClock2(1794364216, K, 8, 2).face, 'two faces = as before');
  assert.match(readFileSync(new URL('../js/screens/harbor/scene.js', import.meta.url), 'utf8'), /triClock\(clock\.now\(\) \/ 1000, K, triForce\(\), F\.length\)/);
});

test('CITY F — THE OPEN NOW BILLBOARD: the owner\'s poster on the NOW OPEN face only — whole, its words baked in (no lettering drawn), a small lazy WebP', () => {
  const art = readFileSync('js/screens/harbor/jaywalk-art.js', 'utf8');
  assert.match(art, /const OPEN_SRC = new URL\('\.\.\/\.\.\/\.\.\/assets\/city\/jaywalk\/open-now\.webp', import\.meta\.url\)\.href;/);
  const i = art.indexOf("if (bar === 'open' && OPEN.ready && OPEN.img) {"), seg = art.slice(i, art.indexOf('x.restore(); return;', i));
  assert.ok(i > 0 && /drawImage\(openImg/.test(seg) && !/word\(|fillText/.test(seg), 'the open face: the picture alone, no lettering over it');
  const size = statSync('assets/city/jaywalk/open-now.webp').size;
  assert.ok(size > 5000 && size <= 200 * 1024, `the poster ${size} B (≤ 200 KB)`);
  // (never in the boot graph: only the lazy jaywalk-art.js names it)
  assert.doesNotMatch(readFileSync('js/screens/harbor/scene.js', 'utf8') + readFileSync('js/screens/harbor/signs.js', 'utf8'), /open-now\.webp/);
});

// CITY G — THE ROOF BOARD's LOADER (the owner's /admin, Nov 17: JAYWALK ON, yet the board turned only HOLD'EM → THE DROP): the city is rebuilt on every
// game start / return while the picture lives at module level — EVERY caller must be answered, the scene that asked first may be gone
test('CITY G — the poster loader answers EVERY waiting caller (a scene destroyed mid-load never takes the answer with it); a failure answers all + the next call starts afresh', async () => {
  const made = [];
  globalThis.Image = class { constructor() { made.push(this); } set src(v) { this._src = v; } };
  const { artLoader } = await import('../js/screens/harbor/jaywalk-art.js');
  const L = artLoader('x.webp');
  const got = [];
  L.warm(() => got.push('old scene'));            // the first scene asks …
  L.warm(() => got.push('new scene'));            // … is destroyed; the rebuilt scene asks while the picture still loads
  assert.equal(made.length, 1, 'one picture, one request');
  made[0].onload(); await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(got, ['old scene', 'new scene'], 'both answered — the rebuilt scene shows the face');
  L.warm(() => got.push('later'));
  assert.equal(got.at(-1), 'later', 'once ready: answered at once');
  const F = artLoader('y.webp'), fails = [];
  F.warm(null, w => fails.push(`a ${w}`)); F.warm(null, w => fails.push(`b ${w}`));
  made.at(-1).onerror();
  assert.deepEqual(fails, ['a the image failed', 'b the image failed'], 'a failure answers every waiter (the live scene retries on its backoff)');
  F.warm(() => fails.push('retry ok'));
  assert.equal(made.length, 3, 'the next call starts a fresh load');
  made.at(-1).onload(); await new Promise(r => setTimeout(r, 0));
  assert.equal(fails.at(-1), 'retry ok');
  delete globalThis.Image;
});

test('CITY G — THE DROP\'s font wait answers EVERY waiting caller too', async () => {
  let res; const gate = new Promise(r => { res = r; }); globalThis.document = { fonts: { load: () => gate } };
  const { warmDrop } = await import('../js/screens/harbor/drop-art.js');
  const got = [];
  warmDrop(() => got.push('old')); warmDrop(() => got.push('new'));
  res(); await new Promise(r => setTimeout(r, 0));
  assert.deepEqual(got, ['old', 'new']);
  delete globalThis.document;
});

// CITY H1 — THE BOARD OPENS ON THE NEWEST GAME (the owner): on load the board turns to the face switched on most recently (the latest of its
// since / OPEN DAY — /admin stamps them), then the shared rotation
import { newestFace, faceDates, setDrop } from '../js/core/harbor-trivision.js';
test('CITY H1 — newestFace: the face whose switch went on most recently (today JAYWALK, OPEN DAY 11-17), ties to the later face, no dates = face 0', () => {
  const F = ['holdem-open', 'jaywalk-open', 'drop'];
  assert.equal(newestFace(F, { 'holdem-open': ['2026-11-08', null], 'jaywalk-open': ['2026-11-12', '2026-11-17'], drop: [null] }), 1, 'JAYWALK — its OPEN DAY 11-17 is the latest');
  assert.equal(newestFace(F, { 'holdem-open': ['2026-11-08'], 'jaywalk-open': ['2026-11-12', '2026-11-17'], drop: ['2026-11-20'] }), 2, 'THE DROP live 11-20: the newest');
  assert.equal(newestFace(F, { 'holdem-open': ['2026-11-17'], 'jaywalk-open': ['2026-11-17'] }), 1, 'a tie → the later face');
  assert.equal(newestFace(F, {}), 0, 'no dates → the first face');
  assert.equal(newestFace(['holdem', 'jaywalk'], { holdem: ['bad'], jaywalk: ['2026-11-12'] }), 1);
  // the live state: the owner's switches as /admin writes them
  setHoldemForce(null); setJaywalkForce(null); setDrop(null);
  setHoldem({ on: true, bar: 'open', since: '2026-11-08' });
  setJaywalk({ on: true, bar: 'soon', open: '2026-11-17', since: '2026-11-12' });
  const d = faceDates();
  assert.equal(newestFace(['holdem-open', 'jaywalk-open'], d), 1, `today's switches open on JAYWALK (${JSON.stringify(d)})`);
  // (CITY H2 — the 4:03 pm entry: the LIVE state — JAYWALK NOW OPEN with no OPEN DAY stored (switched Nov 17), THE DROP live 11-15 → JAYWALK)
  setJaywalk({ on: true, bar: 'open', open: null, since: '2026-11-12' }); setDrop({ live: '2026-11-15', mode: 'on' });
  assert.equal(newestFace(['holdem-open', 'jaywalk-open', 'drop'], faceDates()), 1, `NOW OPEN without a day = from 11-17: newer than THE DROP's 11-15 (${JSON.stringify(faceDates())})`);
  setDrop(null); setHoldem(null); setJaywalk(null);
});
