// The games' neon marks (core/marks.js — the Harbor's signs, the tube logos, the game start's sign): every game has one, and the tubes'
// geometry. (CITY 1.0 OUT: City 1.0's sign rotation, ticker + blade colours went with them.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMES } from '../js/config.js';
import { MARKS, LETTERS, markFor, bladeWord, tubeEnds, scalePath } from '../js/core/marks.js';

test('every game in the registry has its own neon mark and a blade word the tube alphabet can draw', () => {
  for (const g of GAMES) {   // (WINDOWS: every game — hidden ones keep their marks for their return)
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

