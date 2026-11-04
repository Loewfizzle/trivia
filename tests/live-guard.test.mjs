// FR6 FIXES A (G7) — THE LIVE-SITE GUARD + THE TEST FLAG (the owner, Nov 4: LOBBY 2.0 B's repros opened real rooms on neonspeakeasy.com —
// real pushes to his phone + watch, five throwaway players with real member numbers). Tests + repros run on the emulators; the live site
// only with LIVE=1 on purpose, and then every page carries &test=1 (no profile, no member number, a silent push).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { isLocalUrl, guardUrl, withTestFlag } from './integration/kit/live-guard.mjs';

const root = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, root), 'utf8');

test('local hosts pass; the live site is refused without LIVE=1, and carries &test=1 with it', () => {
  for (const u of ['http://localhost:5173/?emu', 'http://127.0.0.1:5174/', 'http://[::1]:5173/', 'http://app.localhost:3000/', 'https://neon.test/', 'about:blank', 'data:text/html,hi'])
    assert.equal(guardUrl(u, 't', {}), u, u);
  for (const u of ['https://neonspeakeasy.com/', 'https://www.neonspeakeasy.com/?room=MOVE', 'https://games.loewfizzle.com/'])
    assert.throws(() => guardUrl(u, 't', {}), /LIVE-SITE GUARD/, u);
  const live = guardUrl('https://www.neonspeakeasy.com/?slot=2', 't', { LIVE: '1' });
  assert.equal(new URL(live).searchParams.get('test'), '1');
  assert.equal(new URL(live).searchParams.get('slot'), '2');
  assert.equal(withTestFlag('https://x.com/?test=1'), 'https://x.com/?test=1');
  assert.ok(isLocalUrl('/relative'));
});

test('every test browser page goes through the guard (kit/puppeteer.mjs patches page.goto; wk-room guards its own)', () => {
  const kit = read('tests/integration/kit/puppeteer.mjs');
  assert.match(kit, /proto\.goto = function/);
  assert.match(kit, /guardUrl\(url/);
  const wk = read('tests/integration/wk-room.mjs');
  assert.match(wk, /guardUrl\(PROD \?/);
});

test('no test or script DEFAULTS to the live site (an address only by naming it)', () => {
  const files = [];
  const walk = dir => { for (const e of readdirSync(new URL(dir, root), { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('shots')) continue;
    const p = `${dir}${e.name}`;
    if (e.isDirectory()) walk(`${p}/`); else if (/\.(mjs|js)$/.test(e.name)) files.push(p);
  } };
  walk('tests/'); walk('scripts/');
  const bad = files.filter(f => /\|\|\s*['"`]https:\/\/(www\.)?neonspeakeasy\.com/.test(read(f)));
  assert.deepEqual(bad, [], `these default to the live site: ${bad.join(', ')}`);
});

test('THE TEST FLAG: a test tab makes no profile (no member Nº), keeps the flag across the URL rewrite, and its room push is silent', () => {
  const id = read('js/identity.js'), me = read('js/profile/me.js'), room = read('js/room.js'), radio = read('api/_lib/radio.js');
  assert.match(id, /export const testMode = /);
  assert.match(id, /if \(testMode\) p\.set\('test', '1'\)/, 'setUrlRoom keeps &test=1');
  assert.match(me, /\|\| testMode\) return Promise\.resolve\(null\)/, 'syncMe: no profile in a test tab');
  assert.match(room, /testMode \? \{ silent: true \}/, 'the room push says silent');
  assert.match(radio, /body\.silent === true\) return \{ ok: true, sent: 0, silent: true \}/, 'the server honours it');
});
