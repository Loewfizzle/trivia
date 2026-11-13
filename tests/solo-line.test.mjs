// PD-6 ADD-ON — THE SOLO PODIUM SAYS WHAT IT PAID (Ben, Nov 13 4:30 pm): the server's step counts the streak day's solo runs, the outcome carries
// it as `so` = { n, max }, and the podium's ONE line is drawn from that outcome only (js/core/solo-line.js) — never a guess.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchStep } from '../js/core/progress.js';
import { SOLO_XP, SOLO_DAY_XP } from '../js/core/ranks.js';
import { soloXpText } from '../js/core/solo-line.js';
import { T0 } from './fixtures/finals.mjs';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('the step: a solo run says its place in the day\'s solo count; a room match says nothing', () => {
  const row = { rank: 1, win: false, solo: true, c: { p: 1 }, rec: {} };
  let s = null; const lines = [];
  for (let i = 0; i < SOLO_DAY_XP + 2; i++) {
    const r = matchStep(s, { key: `S_${i}`, gid: 'prism', row, n: 1, now: T0 + i * 10 * 60e3 });
    s = r.next;
    assert.deepEqual(r.solo, { n: i + 1, max: SOLO_DAY_XP });
    lines.push(soloXpText({ xp: { gain: r.xp.total }, so: r.solo }));
  }
  assert.deepEqual(lines, [1, 2, 3, 4].map(k => `+${SOLO_XP} XP · SOLO RUN · ${k} OF 4 TODAY`).concat(['TODAY’S SOLO XP DONE · MORE AT 4 AM', 'TODAY’S SOLO XP DONE · MORE AT 4 AM']));
  const room = matchStep(null, { key: 'M_1', gid: 'prism', row: { rank: 1, win: true, c: { p: 1 }, rec: {} }, n: 2, now: T0 });
  assert.equal(room.solo, undefined, 'a room match carries no solo count');
  // the next streak day starts again at 1
  const nd = matchStep(s, { key: 'S_next', gid: 'prism', row, n: 1, now: T0 + 26 * 3600e3 });
  assert.deepEqual(nd.solo, { n: 1, max: SOLO_DAY_XP });
});

test('the line: from the SERVER\'s count only — no count, a skipped outcome or nothing yet = no line', () => {
  assert.equal(soloXpText(null), null, 'the outcome hasn\'t arrived (offline / queued)');
  assert.equal(soloXpText({ xp: { gain: 15 } }), null, 'an older server (no count) — never a guess');
  assert.equal(soloXpText({ skip: 'busy', so: { n: 1, max: 4 } }), null);
  assert.equal(soloXpText({ xp: { gain: 15 }, so: { n: 3, max: 4 } }), '+15 XP · SOLO RUN · 3 OF 4 TODAY');
  assert.equal(soloXpText({ xp: { gain: 0 }, so: { n: 5, max: 4 } }), 'TODAY’S SOLO XP DONE · MORE AT 4 AM');
  // the server passes it on; the podium reads it (callouts.js) in place of the XP box
  assert.match(read('api/_lib/stats.js'), /res\.solo \? \{ so: res\.solo \}/);
  const co = read('js/profile/callouts.js');
  assert.match(co, /from '\.\.\/core\/solo-line\.js'/);
  assert.match(co, /o\.xp\.gain && !sl/, 'the solo line replaces the XP box');
  assert.doesNotMatch(read('js/core/solo-line.js'), /^import /m, 'PURE — no imports (a new module: never a stale boot module)');
});
