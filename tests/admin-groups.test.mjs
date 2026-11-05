// THE SPEED PASS — /ADMIN's GROUPED LOGS (js/admin/groups.js, PURE): one row per kind, its count, "N new" since MARK SEEN, first / last
// seen, newest first; the filter box; the header's count line
import test from 'node:test';
import assert from 'node:assert/strict';
import { groupErrors, groupReports, filterGroups, countLine, errorKind } from '../js/admin/groups.js';

test('errors fold into ONE ROW PER KIND (the message, long numbers folded) — counts, new since seen, first / last, newest first', () => {
  const list = [
    { sig: 'e1', m: 'Cannot read id 48213', s: 'a.js', l: 3, n: 5, seen: 5, first: 100, last: 900 },
    { sig: 'e2', m: 'Cannot read id 99120', s: 'b.js', l: 9, n: 2, first: 300, last: 950 },
    { sig: 'e3', m: 'Boom', s: 'c.js', l: 1, n: 1, first: 50, last: 60 },
  ];
  assert.equal(errorKind('Cannot read id 48213'), 'Cannot read id N');
  const g = groupErrors(list);
  assert.equal(g.length, 2);
  assert.equal(g[0].title, 'Cannot read id N');
  assert.deepEqual([g[0].n, g[0].newN, g[0].first, g[0].last, g[0].items.map(x => x.sig)], [7, 2, 100, 950, ['e2', 'e1']]);
  assert.deepEqual([g[1].n, g[1].newN], [1, 1]);
  assert.equal(countLine(g), '8 · 3 new');
  assert.equal(countLine(groupErrors([{ sig: 'e1', m: 'x', n: 4, seen: 4, last: 1 }])), '4', 'nothing new: no "new" part');
});

test('reports group by kind; the filter keeps a group when its title or any entry holds the words', () => {
  const g = groupReports([{ id: 'r1', kind: 'hang', at: 10, text: 'main thread stopped' }, { id: 'r2', kind: 'tap', at: 20, text: 'looks fine', seen: true }, { id: 'r3', kind: 'hang', at: 30, text: 'again' }]);
  assert.deepEqual(g.map(x => [x.title, x.n, x.newN]), [['HANG', 2, 2], ['TAP', 1, 0]]);
  assert.deepEqual(filterGroups(g, 'STOPPED').map(x => x.title), ['HANG']);
  assert.deepEqual(filterGroups(g, 'tap').map(x => x.title), ['TAP']);
  assert.equal(filterGroups(g, '').length, 2);
  assert.equal(filterGroups(g, 'nothing like it').length, 0);
});

test('/admin: every card collapsible + the jump bar + the grouped logs; no DAY CHART card (THE RADIO has it)', async () => {
  const { readFileSync } = await import('node:fs');
  const a = readFileSync(new URL('../js/admin/admin.js', import.meta.url), 'utf8');
  assert.doesNotMatch(a, /mountDayChart|The day chart|ad-daychart/, 'the day chart card is gone from /admin');
  assert.match(a, /function card\(id, title/); assert.match(a, /localStorage\.setItem\(openKey\(id\)/, 'open / closed remembered per device');
  assert.match(a, /h\('nav\.ad-jump'/, 'the jump bar');
  assert.match(a, /call\('seenLogs'/); assert.match(a, /call\('clearErrors', \{ sigs:/); assert.match(a, /call\('clearReports', \{ ids:/);
  for (const id of ['ad-errors', 'ad-reports', 'ad-tp', 'ad-audit']) assert.match(a, new RegExp(`card\\('${id}', '[^']+', \\{[^}]*open: false`), `${id} collapsed by default`);
});
