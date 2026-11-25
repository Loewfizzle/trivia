// THE CITY POLISH PASS — THE QUIET KINDS LEAK (the owner's Nov 24 2:36 pm inbox entry): 'not-host', 'slow-boot' and empty-text reports arrived
// as TAP rows in THE PHONE LOG — cleanReport turned every kind it didn't list into 'tap' before the quiet check saw it. ONE list now
// (js/core/quiet-kinds.js) for the server (api/_lib/log-pure.js → api/log.js) and the phone (js/errlog.js); every quiet kind only COUNTS.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { QUIET_KINDS, visibleText } from '../js/core/quiet-kinds.js';
import { reportRoute, cleanReport, QUIET_KINDS as SERVER_KINDS } from '../api/_lib/log-pure.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('every quiet kind only COUNTS — with text, without, whatever the phone sent; never a TAP row', () => {
  assert.equal(SERVER_KINDS, QUIET_KINDS, 'the server reads THE list');
  for (const k of QUIET_KINDS) {
    for (const text of [k, '', '   ', 'a long note']) assert.equal(reportRoute({ kind: k, text }), 'count', `${k} (text ${JSON.stringify(text)})`);
    assert.notEqual(cleanReport({ kind: k, text: k }).kind, 'tap', `${k} never becomes a tap`);
  }
  for (const k of ['not-host', 'slow-boot', 'late-vote', 'dead', 'late-proof']) assert.ok(QUIET_KINDS.includes(k), `${k} (the leak's kinds) on the list`);
});

test('no empty-text row ever: a report with nothing to read is dropped (spaces, newlines, invisible marks)', () => {
  for (const text of ['', ' ', '\n\n', '​', '​ ﻿', null, undefined, 42]) assert.equal(reportRoute({ kind: 'tap', text }), null, JSON.stringify(text));
  assert.equal(reportRoute({ kind: 'tap', text: 'A LOST TAP …' }), 'row');
  assert.equal(reportRoute({ kind: 'mystery', text: 'something' }), 'row', 'an unknown kind with text stays a (tap) row, as before');
  assert.equal(visibleText(' x '), true);
});

test('the phone and the server share the list (no copy of it anywhere else)', () => {
  const er = read('js/errlog.js'), lg = read('api/log.js');
  assert.match(er, /import \{ QUIET_KINDS \} from '\.\/core\/quiet-kinds\.js';/);
  assert.match(er, /const QUIET = new Set\(QUIET_KINDS\)/);
  assert.match(lg, /export \{ QUIET_KINDS \} from '\.\/_lib\/log-pure\.js';/);
  assert.ok(!/\[\s*'old',\s*'gone'/.test(er + lg + read('api/_lib/log-pure.js')), 'no second literal list');
});
