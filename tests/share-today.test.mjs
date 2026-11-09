// BOARD 2.0 B — SHARE TODAY = ONE CARD FROM EACH DAILY's OWN PIECES (the owner's add-on): the plan (which dailies get a section, NOT YET, ONE daily =
// its own card) + THE PASSWORD's share data (marks + counts, NEVER a word or a letter) — js/daily/share-today.js#planToday, js/games/password/logic.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { planToday } from '../js/daily/share-today.js';
import { createRun, serverGuess, shareRunOf, runFromShare, scoreOf, HIT } from '../js/games/password/logic.js';

const D = [{ id: 'password', name: 'THE PASSWORD' }, { id: 'coastclear', name: 'COAST CLEAR' }];
test('both finished → two sections in the dailies\' order, no NOT YET line, not a single card', () => {
  const p = planToday({ dailies: D, mine: { password: 5, coastclear: 132 } }, { password: {}, coastclear: {} });
  assert.deepEqual(p.sections.map(s => [s.id, s.own]), [['password', true], ['coastclear', true]]);
  assert.deepEqual(p.notYet, []);
  assert.equal(p.single, null);
});
test('one finished → that daily\'s OWN card; the other reads NOT YET', () => {
  const p = planToday({ dailies: D, mine: { coastclear: 132 } }, { coastclear: {} });
  assert.equal(p.single, 'coastclear');
  assert.deepEqual(p.notYet, ['THE PASSWORD']);
});
test('no share data (or no painter) → a plain section (its name + its line), never its own card', () => {
  const p = planToday({ dailies: [...D, { id: 'nightcap', name: 'THE NIGHTCAP' }], mine: { password: 5, nightcap: 3 } }, {});
  assert.deepEqual(p.sections.map(s => [s.id, s.own]), [['password', false], ['nightcap', false]]);
  assert.equal(p.single, null);
});
test('up to 6 dailies (MAX_ROWS)', () => {
  const many = Array.from({ length: 8 }, (_, i) => ({ id: `d${i}`, name: `D${i}` }));
  const p = planToday({ dailies: many, mine: Object.fromEntries(many.map(d => [d.id, 1])) }, {});
  assert.equal(p.sections.length, 6);
});
test('THE PASSWORD\'s share data: the marks + the counts only — never a word, never a letter; back to the same score', () => {
  const answers = ['CRANE', 'GHOST'];
  let run = createRun({ day: 'd20261109', startedAt: 1000 });
  for (const w of ['SLATE', 'CRANE', 'GHOUL', 'GHOST']) run = serverGuess(run, w, answers, 99000).run;
  const s = shareRunOf(run);
  const json = JSON.stringify(s);
  for (const w of ['SLATE', 'CRANE', 'GHOUL', 'GHOST']) assert.ok(!json.includes(w), `no word ${w}`);
  assert.ok(!/"[A-Z]{1,5}"/.test(json.replace(/"(state|marks|n|done|door|startedAt|finishedAt|doors|solved|failed|open)"/g, '')), 'no letters as strings');
  assert.ok(s.doors.every(d => d.marks.every(r => r.length === 5)));
  const back = runFromShare(s);
  assert.deepEqual(scoreOf(back), scoreOf(run));
  assert.equal(back.doors[1].marks.at(-1).every(m => m === HIT), true);
  assert.equal(shareRunOf(createRun({ day: 'd20261109' })), null, 'an unfinished run shares nothing');
});
