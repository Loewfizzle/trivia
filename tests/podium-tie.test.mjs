// HOLD'EM IN THE CITY — B4 (HE9's Fable review): EVERYONE TIED → ALL TIED, nobody 1st — the same truth on the podium, the game-night table and
// the server. ONE rule for every game (core/night.js#nightPoints): a FULL TIE is a DRAW — everyone 2nd-place points, nobody 1st's, nobody a
// night win; the server credits every one rank 1, no win (api/report.js#placingsOnly reads the entry back the same). A PARTIAL tie (two share
// 1st) stays as it was: 3 points + a win each.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nightPoints, isAllTied, nightStandings, NIGHT_POINTS } from '../js/core/night.js';
import { placingsOnly } from '../api/report.js';
import { winnersOf, bannerLines } from '../js/core/room-show.js';

test('the rule: a full tie = a draw (2 each, nobody 1st); a partial tie stays 3 + 3; a solo run 0; a clear winner as ever', () => {
  assert.deepEqual(NIGHT_POINTS, { 1: 3, 2: 2, 3: 1 });
  assert.equal(isAllTied([{ uid: 'a', rank: 1 }, { uid: 'b', rank: 1 }]), true);
  assert.equal(isAllTied([{ uid: 'a', rank: 1 }]), false, 'one player is never a tie');
  assert.equal(isAllTied([{ uid: 'a', rank: 1 }, { uid: 'b', rank: 1 }, { uid: 'c', rank: 3 }]), false);
  assert.deepEqual(nightPoints([{ uid: 'a', rank: 1 }, { uid: 'b', rank: 1 }, { uid: 'c', rank: 1 }]), { a: 2, b: 2, c: 2 });
  assert.deepEqual(nightPoints([{ uid: 'a', rank: 1 }, { uid: 'b', rank: 1 }, { uid: 'c', rank: 3 }]), { a: 3, b: 3, c: 1 }, 'a partial tie: as today');
  assert.deepEqual(nightPoints([{ uid: 'a', rank: 1 }, { uid: 'b', rank: 2 }]), { a: 3, b: 2 });
  assert.deepEqual(nightPoints([{ uid: 'a', rank: 1 }], { solo: true }), { a: 0 });
});

test('the same truth everywhere: the night table counts no win, the banner plane flies nothing, the server credits rank 1 + no win', () => {
  const draw = { g: 'overclock', p: nightPoints([{ uid: 'a', rank: 1 }, { uid: 'b', rank: 1 }]), n: { a: 'ANN', b: 'BOB' }, at: 1 };
  const st = nightStandings({ m1: draw });
  assert.ok(st.every(r => r.wins === 0 && r.points === 2 && r.rank === 1 && !r.leader), JSON.stringify(st));
  assert.deepEqual(winnersOf(draw), [], 'no winner on the banner plane');
  assert.deepEqual(bannerLines(winnersOf(draw).map(w => w.name), 'OVERCLOCK'), [], 'no lines → no banner');
  const s = placingsOnly(draw);
  assert.ok(Object.values(s.rows).every(r => r.rank === 1 && r.win === false && !r.c.w), JSON.stringify(s.rows));
  // an entry from before B4 (everyone 3) reads the same; a partial tie still credits both 1sts a win
  assert.ok(Object.values(placingsOnly({ g: 'overclock', p: { a: 3, b: 3 } }).rows).every(r => r.rank === 1 && !r.win));
  const part = placingsOnly({ g: 'overclock', p: { a: 3, b: 3, c: 1 } }).rows;
  assert.ok(part.a.win && part.b.win && !part.c.win && part.c.rank === 3);
});

test('the podium: ALL TIED + NOBODY TAKES FIRST, no winner sting / buzz / confetti; OVERCLOCK + PRISM bodies name no winner on a full tie', () => {
  const fin = readFileSync(new URL('../js/ui/final.js', import.meta.url), 'utf8');
  assert.ok(/allTied \? 'ALL TIED'/.test(fin) && /allTied \? 'NOBODY TAKES FIRST'/.test(fin));
  assert.ok(fin.indexOf("if (allTied) return;") > 0 && fin.indexOf("if (allTied) return;") < fin.indexOf("pgSfx('victory')"), 'the draw returns before the winner sting');
  const host = readFileSync(new URL('../js/host.js', import.meta.url), 'utf8');
  assert.ok(/nightPoints\(ranks, \{ solo \}\)/.test(host), 'the host writes the night through the one rule');
  const oc = readFileSync(new URL('../js/games/overclock/victory.js', import.meta.url), 'utf8');
  assert.ok(/'ALL TIED'/.test(oc) && oc.indexOf("'ALL TIED'") < oc.indexOf("ocSfx('fanfare')"), 'OVERCLOCK: ALL TIED before the fanfare branch');
  assert.ok(/const tie = rows\.length >= 2 && rows\.every\(r => r\.rank === 1\)/.test(readFileSync(new URL('../js/games/prism/victory.js', import.meta.url), 'utf8')));
});
