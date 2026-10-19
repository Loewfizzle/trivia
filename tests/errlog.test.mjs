// Errors from phones (js/errlog.js): what gets reported, what is skipped as noise, and what a report contains.
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeError, ownPath, shortStack, errorKey } from '../js/errlog.js';

const O = 'https://neonspeakeasy.com';

test('our own files become short paths; other sites and extensions are not ours', () => {
  assert.equal(ownPath(`${O}/js/games/golf/view.js?v=3`, O), 'js/games/golf/view.js');
  assert.equal(ownPath('', O), '');
  assert.equal(ownPath('chrome-extension://abc/content.js', O), null);
  assert.equal(ownPath('https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js', O), null);
  assert.equal(ownPath('webkit-masked-url://hidden/', O), null);
});

test('a code error is reported with its message, file, line and a short stack', () => {
  const error = new TypeError("Cannot read properties of undefined (reading 'si')");
  error.stack = `TypeError: Cannot read properties of undefined (reading 'si')\n    at update (${O}/js/games/pulse/view.js?x=1:210:14)\n    at render (${O}/js/app.js:112:30)`;
  const e = normalizeError({ message: 'Uncaught TypeError: ' + error.message, filename: `${O}/js/games/pulse/view.js`, lineno: 210, colno: 14, error }, O);
  assert.equal(e.m, "TypeError: Cannot read properties of undefined (reading 'si')");
  assert.equal(e.s, 'js/games/pulse/view.js');
  assert.equal(e.l, 210);
  assert.equal(e.c, 14);
  assert.ok(e.k.includes('/js/games/pulse/view.js:210:14') && !e.k.includes(O) && !e.k.includes('?x=1'), e.k);
});

test('an unhandled rejection takes its file from the stack', () => {
  const reason = new Error('boom');
  reason.stack = `Error: boom\n    at load (${O}/js/games/lazy-view.js:40:9)`;
  const e = normalizeError({ reason }, O);
  assert.equal(e.m, 'boom');
  assert.equal(e.s, 'js/games/lazy-view.js');
  assert.equal(e.l, 40);
  const plain = normalizeError({ reason: 'just a string' }, O);
  assert.equal(plain.m, 'just a string');
});

test('noise is skipped: audio not allowed, lost connections, extensions, contentless cross-origin errors', () => {
  const skip = [
    { reason: Object.assign(new Error('The request is not allowed by the user agent'), { name: 'NotAllowedError' }) },
    { reason: Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }) },
    { reason: new TypeError('Load failed') },
    { reason: new TypeError('Failed to fetch') },
    { message: 'ResizeObserver loop completed with undelivered notifications.' },
    { message: 'Script error.', filename: '' },
    { message: 'x is not defined', filename: 'chrome-extension://abc/inject.js', lineno: 1 },
  ];
  for (const s of skip) assert.equal(normalizeError(s, O), null, JSON.stringify(s.message || String(s.reason)));
  // a module that failed to load is NOT noise: that game's screen stays blank
  assert.ok(normalizeError({ reason: new TypeError('Importing a module script failed.') }, O));
});

test('fields are clipped and the same error shares a key', () => {
  const long = normalizeError({ message: 'x'.repeat(1000), filename: `${O}/js/app.js`, lineno: 1 }, O);
  assert.ok(long.m.length <= 300);
  const a = normalizeError({ message: 'oops', filename: `${O}/js/app.js`, lineno: 5 }, O);
  const b = normalizeError({ message: 'oops', filename: `${O}/js/app.js`, lineno: 5, colno: 9 }, O);
  assert.equal(errorKey(a), errorKey(b));
  assert.ok(shortStack('a\nb\nc\nd\ne\nf\ng\nh', O).split('\n').length <= 5);
});
