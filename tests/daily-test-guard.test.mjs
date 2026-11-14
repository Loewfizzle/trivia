// PFIX-3 — THE ADD-ON (Nov 14 4:14 pm): A TEST / FAKE DAILY CAN NEVER REACH A REAL CARD OR THE LIVE SITE.
// The test-only dailies (THE FAKE daily "THE TEST DAILY", a registerTestDaily one, an OFF row DAILY_TEST_OFF names) exist only where
// api/_lib/dailies.js#testing() is true — DAILY_TEST=1 AND not on Vercel (VERCEL / VERCEL_ENV are set on every deployment, production and
// preview). The phone's list of dailies is the server's `today` answer — never config.js, never a query — so a daily the server does not
// register cannot be on TODAY, in SCORES or in SHARE TODAY. This file pins the guard + that nothing else opens a test daily.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const src = read('api/_lib/dailies.js');
// (the guard itself, taken from the source and run — the module also loads the database client, which a unit test never does)
const m = src.match(/export const testingEnv = \(env = process\.env\) => ([^;]+);/);

test('the test switch is honoured ONLY off Vercel — a deployment never opens a test daily, whatever its environment says', () => {
  assert.ok(m, 'the guard is ONE pure line');
  const testingEnv = new Function('env', `return (${m[1]});`);
  assert.equal(testingEnv({ DAILY_TEST: '1' }), true, 'the emulators + the local test server');
  assert.equal(testingEnv({}), false);
  assert.equal(testingEnv({ DAILY_TEST: '0' }), false);
  assert.equal(testingEnv({ DAILY_TEST: '1', VERCEL: '1' }), false, 'any Vercel deployment');
  assert.equal(testingEnv({ DAILY_TEST: '1', VERCEL_ENV: 'production' }), false, 'the live site');
  assert.equal(testingEnv({ DAILY_TEST: '1', VERCEL_ENV: 'preview' }), false, 'a preview deployment too');
  assert.equal(testingEnv({ DAILY_TEST: '1', VERCEL: '1', VERCEL_ENV: 'production', DAILY_TEST_OFF: 'drop' }), false);
});

test('every door a test daily comes through asks that ONE guard — the fake, a registered test daily, a test row, an OFF row opened early', () => {
  assert.match(src, /const testing = \(\) => testingEnv\(process\.env\);/);
  assert.equal((src.match(/process\.env\.DAILY_TEST\b(?!_OFF)/g) || []).length, 0, 'nothing reads DAILY_TEST past the guard');
  assert.match(src, /if \(!testing\(\)\) throw new Error\('registerTestDaily: DAILY_TEST=1 only'\);/);
  assert.match(src, /if \(testing\(\)\) want\.set\(FAKE_DAILY\.id, FAKE_DAILY\);/, 'THE FAKE daily: only while testing');
  assert.match(src, /const testOff = id => testing\(\) && /, 'an OFF row (THE DROP before its go-live) opens early only while testing');
  assert.match(src, /if \(!row \|\| \(row\.test && !testing\(\)\)\)/);
  // no other server file switches a test daily on
  for (const f of [...readdirSync(new URL('../api/', import.meta.url)).filter(x => x.endsWith('.js')).map(x => `api/${x}`), ...readdirSync(new URL('../api/_lib/', import.meta.url)).filter(x => x.endsWith('.js') && x !== 'dailies.js').map(x => `api/_lib/${x}`)]) {
    const code = read(f).split('\n').filter(l => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
    assert.doesNotMatch(code, /process\.env\.DAILY_TEST/, `${f}: reads no test switch of its own`);
  }
});

test('the phone never names a daily by itself: its list is the server\'s `today` — the shipped site holds no test daily row', () => {
  const cfg = read('js/config.js');
  const rows = cfg.slice(cfg.indexOf('export const DAILIES'));
  assert.doesNotMatch(rows.slice(0, rows.indexOf('];') + 2), /id: 'test'|THE TEST DAILY|test: true/, 'config.js#DAILIES: real dailies only');
  for (const f of ['js/daily/share-today.js', 'js/screens/daily.js', 'js/daily/today.js', 'js/daily/today-logic.js']) assert.doesNotMatch(read(f), /THE TEST DAILY|FAKE_DAILY/, f);
  assert.match(read('js/daily/share-today.js'), /const ds = \(today\.dailies \|\| \[\]\)\.slice\(0, MAX_ROWS\);/, 'SHARE TODAY draws the server\'s list');
  assert.match(read('js/daily/today.js'), /api\('daily', \{ action: 'today' \}\)/);
});
