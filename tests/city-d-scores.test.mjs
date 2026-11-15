// CITY D — GROUP 7: SCORES SHOWS INSTANTLY — the kept scores at once (marked UPDATING, replaced in place after a lift) + the server's serial trips cut
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('the daily screen keeps the last scores it saw today (this player\'s) and paints them at once, marked UPDATING; the fresh answer replaces them after a lift', () => {
  const D = read('js/screens/daily.js');
  assert.match(D, /const SKEY = 'ns:dy:scores';/);
  assert.match(D, /v && \(!pidNow\(\) \|\| v\.pid === pidNow\(\)\)/, 'one player\'s — never another account\'s');
  assert.match(D, /const fresh0 = C0 && C0\.day === dayNow\(\) \? C0 : null;/, 'today\'s only');
  assert.match(D, /if \(!today && fresh0\.today && Array\.isArray\(fresh0\.today\.dailies\)\) today = fresh0\.today;/);
  assert.match(D, /h\('h3\.dy-sub', 'EVERYONE · TODAY', upd\(evCached\)\)/);
  assert.match(D, /const repaint = \(\) => afterTap\(\(\) => \{ if \(!gone\) paint\(\); \}\);/, 'never re-rendered under a finger');
  assert.match(D, /ev, \[\.\.\.evAll\], rev\]\);/, 'a fresh answer over a kept one repaints');
});

test('the server: THE DAY\'S CLOSE + the sweep side by side; `today` + `every` read side by side (one trip where there were several)', () => {
  const C = read('api/_lib/daily-close.js');
  assert.match(C, /jobs\.push\(closeDay\(\{ game, day, now \}\)/);
  assert.match(C, /return \(await Promise\.all\(jobs\)\)\.filter\(Boolean\);/);
  assert.match(C, /await Promise\.all\(\(games \|\| \[\]\)\.map\(async game => \{/);
  const A = read('api/daily.js');
  assert.match(A, /const early = body\.action === 'every' \? \{ pid: mine\(uid\), lb: import\('\.\/_lib\/lb\.js'\) \} : null;/);
  assert.match(A, /let \[v, s0, xg\] = await Promise\.all\(\[val\(`\$\{base\}\/r\/\$\{pid\}`\), val\(`\$\{base\}\/s\/\$\{pid\}`\), val\(`\$\{base\}\/x\/\$\{pid\}`\)\]\);/);
  assert.match(A, /const lsP = Promise\.all\(\[val\(`pstats\/\$\{pid\}\/ls`\), createdAtOf\(pid\)\]\), pfrP = val\(`pfr\/\$\{pid\}`\);/);
});
