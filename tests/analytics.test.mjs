// VERCEL WEB ANALYTICS (Nov 12 night): Vercel's PLAIN script, injected by js/ui/analytics.js AFTER the page is up — on index (after THE CITY's
// reveal), board + 404 only; never in the boot preload / THE BOOT BUDGET; skipped on localhost, the emulators, &test=1, tests/ pages + robots;
// the service worker never keeps /_vercel/*.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyticsAllowed, VA_SRC } from '../js/ui/analytics.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const at = (o = {}) => analyticsAllowed({ host: 'neonspeakeasy.com', search: '', path: '/', webdriver: false, ua: IPHONE, ...o });

test('the gate: the live pages for real visitors only', () => {
  assert.equal(at(), true, 'the title');
  assert.equal(at({ path: '/board' }), true); assert.equal(at({ path: '/board.html' }), true); assert.equal(at({ path: '/no-such-page' }), true, 'the 404');
  for (const host of ['localhost', '127.0.0.1', '[::1]', 'neon.localhost', 'app.test']) assert.equal(at({ host }), false, host);
  assert.equal(at({ search: '?emu' }), false, 'the emulators'); assert.equal(at({ search: '?city=2&test=1' }), false, '&test=1');
  for (const path of ['/tests/integration/title-preview.html', '/admin', '/admin.html', '/lab', '/daychart', '/x-preview.html']) assert.equal(at({ path }), false, path);
  assert.equal(at({ webdriver: true }), false, 'navigator.webdriver');
  assert.equal(at({ ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36' }), false, 'a robot');
  assert.equal(VA_SRC, '/_vercel/insights/script.js');
});

test('loaded AFTER the page is up, on index / board / 404 only — never a tag in a head, never the boot preload; the worker passes /_vercel/*', () => {
  assert.match(read('js/screens/title.js'), /\/\/ \(VERCEL WEB ANALYTICS[^\n]*\n    setTimeout\(\(\) => lazyImport\(import\('\.\.\/ui\/analytics\.js'\)/, 'the title: after the reveal');
  const t = read('js/screens/title.js'), r = t.indexOf('  function reveal() {'), a = t.indexOf("import('../ui/analytics.js')");
  assert.ok(a > r && a < r + 2400, 'inside reveal()');
  assert.match(read('js/board/public.js'), /lazyImport\(import\('\.\.\/ui\/analytics\.js'\), '\.\.\/ui\/analytics\.js'\)\.then\(m => m\.loadAnalytics\(\)\)/);
  const nf = read('404.html');
  assert.match(nf, /<script>addEventListener\('load', function \(\) \{ try \{[^]*?navigator\.webdriver[^]*?e\.src = '\/_vercel\/insights\/script\.js'; document\.head\.appendChild\(e\);/, 'the 404: a plain loader after load (THE WRONG DOOR has no modules)');
  for (const f of ['index.html', 'board.html', 'admin.html', 'js/vault/lab.html', 'daychart.html']) {
    let s = ''; try { s = read(f); } catch { continue; }
    assert.doesNotMatch(s, /_vercel\/insights/, `${f}: no analytics tag in the page itself`);
  }
  for (const f of ['admin.html', 'daychart.html']) { let s = ''; try { s = read(f); } catch { continue; } assert.doesNotMatch(s, /analytics\.js/, `${f}: no loader`); }
  assert.doesNotMatch(read('index.html'), /js\/ui\/analytics\.js/, 'never in THE BOOT PRELOAD');
  assert.match(read('sw.js'), /url\.pathname\.startsWith\('\/_vercel\/'\)/);
});
