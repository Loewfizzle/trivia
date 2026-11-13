// THE TRI-VISION (Nov 12 night — core/harbor-trivision.js): the roof board turns HOLD'EM ↔ JAYWALK. The clock (every gap 45–60 s, the same on every
// phone, alternating faces, &force=trivision's 8 s), JAYWALK's switch (the default ON · COMING SOON, the owner's OPEN DAY — the past stays true, OFF
// = HOLD'EM alone), the billposter stays home while it turns, the slats' ripple + prism look, the timetable rows, the poster's words (COMING SOON
// ~60 % of JAYWALK, on the art's black left), the remote panel rows.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  assert.deepEqual(triFaces('2026-11-14'), ['holdem-open', 'jaywalk'], 'both up → the board turns');
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
  setHoldem({ on: true, bar: 'open', since: '2026-11-25' });
  assert.equal(triKeeps('2026-11-25'), true); assert.ok(!kinds('2026-11-25').includes('billposter'), 'the first day of the turning board: no paste');
  setJaywalk({ on: false }); assert.ok(kinds('2026-11-25').includes('billposter'), "JAYWALK off: HOLD'EM's rule — he pastes it once");
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
  assert.match(sc, /if \(F && !tri\.warmed && shownAt >= 0 && performance\.now\(\) >= tri\.retryAt\) \{ tri\.warmed = true; lazyImport\(import\('\.\/jaywalk-art\.js'\)/, 'the poster module + its art load only after the reveal (never the boot graph)');
  // (PLAY NOW 0c — THE ROOF BOARD STOPPED TURNING: a failed art / painter is asked again on a backoff + reported, never left for good)
  assert.match(sc, /tri\.retryAt = performance\.now\(\) \+ \[3e3, 15e3, 60e3, 300e3\]\[Math\.min\(tri\.fails - 1, 3\)\]/);
  assert.match(sc, /m\.warmJaywalk\(\(\) => \{[^}]*\}, why => \{ if \(!destroyed\) triWarmFailed\(/);
  assert.match(sc, /reportError\(new Error\(`THE TRI-VISION: JAYWALK's \$\{what\} failed to load/);
  assert.match(readFileSync('js/screens/harbor/jaywalk-art.js', 'utf8'), /img\.onerror = \(\) => \{ if \(img === me\) img = null; if \(onFail\) onFail\('the image failed'\); \};/);
  const signs = readFileSync(new URL('../js/screens/harbor/signs.js', import.meta.url), 'utf8');
  assert.doesNotMatch(signs + sc, /^import [^\n]*jaywalk-art\.js/m, 'no static import of the poster');
  assert.match(sc, /if \(tri\.lastN == null\) \{ tri\.lastN = C\.n; return F; \}/, 'the first frame it is up starts no turn (THE WINDOW RULE)');
  assert.match(sc, /id: 'roofboard-tri', z: 4/, 'the slats over every poster copy');
  assert.match(sc, /if \(!S\.motion \|\| document\.visibilityState !== 'visible'\) \{ tri\.turn = null; return F; \}/, 'reduced motion: a cut');
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
  assert.match(r, /'holdem', 'jaywalk'\];/);
});
