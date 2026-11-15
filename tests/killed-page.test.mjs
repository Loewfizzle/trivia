// CITY D — 1, A KILLED-PAGE MARKER (js/errlog.js): the screen a page is on, kept in session storage while it's on screen, cleared on a clean exit;
// a load that finds it sends ONE quiet report ('killed' — a row in /admin's phone reports, grouped + counted, never a toast).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { killedText } from '../js/errlog.js';
import { cleanReport } from '../api/_lib/log-pure.js';   // (FIXES R1: the pure half — api/log.js reaches fb.js / firebase-admin)
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('killedText: a fresh note → "PAGE KILLED (likely memory) · screen · device · build"; none / stale / junk → nothing', () => {
  const now = 1_800_000_000_000;
  const t = killedText({ s: 'title · daily screen › SCORES › ALL TIME', b: 'b993f1b', d: 'iPhone 18.6', at: now - 5000, at0: now - 42_000 }, now);
  assert.match(t, /^PAGE KILLED \(likely memory\) · title · daily screen › SCORES › ALL TIME · iPhone 18\.6 · build b993f1b\n/);
  assert.match(t, /on that screen 42 s/);
  assert.equal(killedText(null, now), null);
  assert.equal(killedText({ s: 'x', at: now - 2 * 864e5 }, now), null, 'a day-old tab is not a kill report');
  assert.equal(killedText({ at: now }, now), null);
  assert.equal(killedText('junk', now), null);
});

test('the server keeps a killed report as its own kind; /admin names it; the marker clears on every clean exit', () => {
  assert.equal(cleanReport({ kind: 'killed', text: 'PAGE KILLED …' }).kind, 'killed');
  assert.match(read('js/admin/groups.js'), /r\.kind === 'killed' \? 'PAGE KILLED'/);
  const e = read('js/errlog.js');
  assert.match(e, /window\.addEventListener\('pagehide', clearAlive\);/);
  assert.match(e, /if \(document\.visibilityState === 'hidden'\) clearAlive\(\); else writeAlive\(\);/, 'a hidden tab iOS evicts is not a crash');
  assert.match(e, /if \(!text \|\| BOT\) return;/, 'no robot reports');
  assert.match(read('js/app.js'), /markScreen\(`\$\{screenNow\(\)\}/);
});
