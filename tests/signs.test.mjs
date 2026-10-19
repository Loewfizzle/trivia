// The city's signs: every game has a mark, the rotation shows every game within a minute changing one sign at a time,
// the ticker says the right thing for holidays and the New Year countdown.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMES } from '../js/config.js';
import { MARKS, LETTERS, markFor, bladeWord, tubeEnds, scalePath } from '../js/screens/district/marks.js';
import { createRotation, rotate, CHANGE_EVERY, tickerText, holidayLine, nightsTo } from '../js/screens/district/sign-logic.js';

test('every game in the registry has its own neon mark and a blade word the tube alphabet can draw', () => {
  for (const g of GAMES.filter(x => x.playable)) {
    assert.ok(MARKS[g.id], `${g.id} has a mark`);
    assert.ok(MARKS[g.id].tubes.length >= 1);
    const w = bladeWord(g);
    assert.ok(w.length >= 3 && w.length <= 10, `${g.id}: blade word ${w}`);
    for (const ch of w) assert.ok(LETTERS[ch], `${g.id}: letter ${ch}`);
  }
  // a new game without a mark still gets one (its initials)
  const m = markFor({ id: 'newgame', name: 'Moon Dash' });
  assert.equal(m.tubes.length, 2);
  assert.equal(bladeWord({ id: 'newgame', name: 'Moon Dash' }), 'MOONDASH');
});

test('tube geometry: caps at the open ends, none on closed shapes; paths scale', () => {
  assert.equal(tubeEnds(MARKS.pulse.tubes[0].d).ends.length, 2);
  assert.equal(tubeEnds(MARKS.stakes.tubes[0].d).ends.length, 0);
  assert.equal(scalePath('M1 2 L3 4 H5 V6', 2, 10, 20), 'M12 24 L16 28 H20 V32');
});

test('rotation: one sign changes at a time, never to a game already showing, every game within a few minutes', () => {
  const nGames = GAMES.filter(x => x.playable).length;
  for (const nSigns of [3, 4]) {
    let r = createRotation(nSigns, nGames);
    const seen = new Set(r.shown);
    let last = -Infinity, firstAll = null;
    for (let t = 0; t <= 180; t += 0.1) {
      const before = r.shown.slice();
      const out = rotate(r, nGames, t);
      r = out.r;
      const changed = r.shown.filter((g, i) => g !== before[i]).length;
      assert.ok(changed <= 1, 'one sign at a time');
      if (out.change) {
        assert.ok(t - last >= CHANGE_EVERY - 1e-9, 'spaced out');
        last = t;
        assert.equal(new Set(r.shown).size, r.shown.length, 'no game on two signs');
        seen.add(out.change.game);
        if (seen.size === nGames && firstAll == null) firstAll = t;
      }
    }
    assert.ok(firstAll != null && firstAll <= 150, `${nSigns} signs: every game by ${firstAll} s`);
  }
});

test('ticker: build-ups count the nights, full days greet, the countdown stands alone', () => {
  const names = ['PULSE', 'GRIDLOCK'];
  const L = (holiday, local, nye = null) => ({ holiday, local, nye });
  assert.equal(nightsTo('halloween', 2026, 10, 28), 3);
  assert.equal(holidayLine(L({ id: 'halloween', full: false, k: 0.6 }, { y: 2026, m: 10, d: 28 })), '3 NIGHTS TO HALLOWEEN');
  assert.equal(holidayLine(L({ id: 'halloween', full: false, k: 0.8 }, { y: 2026, m: 10, d: 30 })), '1 NIGHT TO HALLOWEEN');
  assert.equal(holidayLine(L({ id: 'halloween', full: true, k: 1 }, { y: 2026, m: 10, d: 31 })), 'HAPPY HALLOWEEN');
  assert.equal(holidayLine(L({ id: 'christmas', full: false, k: 0.4 }, { y: 2026, m: 12, d: 13 })), '12 NIGHTS TO CHRISTMAS');
  assert.equal(holidayLine(L({ id: 'thanksgiving', full: false, k: 0.5 }, { y: 2026, m: 11, d: 24 })), '2 NIGHTS TO THANKSGIVING');
  assert.equal(tickerText(L(null, { y: 2026, m: 10, d: 18 }), names), 'NOW PLAYING: PULSE · GRIDLOCK');
  assert.match(tickerText(L({ id: 'halloween', full: true, k: 1 }, { y: 2026, m: 10, d: 31 }), names), /^HAPPY HALLOWEEN .*NOW PLAYING/);
  assert.equal(tickerText(L({ id: 'nye', full: true, k: 1 }, { y: 2026, m: 12, d: 31 }, { countdown: 151 }), names), '2:31 TO MIDNIGHT');
  assert.equal(holidayLine(L({ id: 'nye', full: true, k: 1 }, { y: 2027, m: 1, d: 1 }, { finale: 30 })), 'HAPPY NEW YEAR');
});

test('rotation: a sign only takes the games it can show (the blade: names that fit)', () => {
  const ok = (sign, g) => sign !== 1 || g % 2 === 0;    // sign 1 takes even games only
  let r = createRotation(3, 12, 0, ok);
  assert.equal(r.shown[1] % 2, 0);
  for (let t = 0; t <= 300; t += 0.5) { r = rotate(r, 12, t, ok).r; assert.equal(r.shown[1] % 2, 0, 'the blade keeps to names that fit'); assert.equal(new Set(r.shown).size, 3); }
});

test('the two blade signs never wear the same colour at once', async () => {
  const { distinctFrom } = await import('../js/screens/district/signs.js');
  const { hexRgb } = await import('../js/screens/district/marks.js');
  const d = (a, b) => { const p = hexRgb(a), q = hexRgb(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  const COLS = ['#3dff8b', '#f3e3bd', '#ff4466', '#ffb627', '#a374ff', '#eafffb', '#e6e9ef', '#d6f0ff', '#ffc46b', '#7fb2ff', '#ffd86b', '#f0c75e', '#ff4f8a', '#2bff86'];
  for (const a of COLS) for (const b of COLS) assert.ok(d(distinctFrom(a, b), b) >= 120, `${a} next to ${b}`);
  assert.equal(distinctFrom('#3dff8b', '#ff4466'), '#3dff8b', 'distinct colours stay their own');
});
