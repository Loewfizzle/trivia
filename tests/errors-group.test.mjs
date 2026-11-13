// THE ERRORS GROUP (Nov 12 night — from the owner's /admin): (1) THE BLACK HELICOPTER's lights lived in drawHeli's drawn-chopper path, reading
// drawModel's `black` / th / lerpP / lamp ("Can't find variable: black" ×6) — moved into drawModel; (2) STALE-HOST WRITES are "no longer the host",
// never the re-publish alarm; (3) BOTS OUT OF /admin (real UA strings — a real phone is never dropped); (4) the two LOST TAPs (the SCORES tab's 44 pt
// + its answers' repaints after the tap; the full card's CLOSE on its own pointer-up). The live proofs: harbor `heli` + `makehost` + `oldrules`,
// e2e-taps.mjs (ENGINE=webkit).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isBotUA, dropAsBot, quietBot } from '../js/core/bot-ua.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const fnBody = (src, name) => { const i = src.indexOf(`function ${name}(`); let d = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++) { if (src[k] === '{') d++; else if (src[k] === '}' && !--d) return src.slice(j, k + 1); } return ''; };

test('THE BLACK HELICOPTER: drawHeli names no variable of drawModel\'s (black · th · lerpP · lamp — the ReferenceError); drawModel draws the black one\'s own lights', () => {
  const air = read('js/screens/harbor/air.js'), heli = fnBody(air, 'drawHeli').replace(/\/\/.*$/gm, ''), model = fnBody(air, 'drawModel');
  assert.ok(heli.length > 1000 && model.length > 1000, 'both read');
  for (const v of ['black', 'th', 'lerpP', 'lamp']) assert.doesNotMatch(heli, new RegExp(`(?<![.\\w$'"])${v}(?![\\w$:'"])`), `drawHeli reads \`${v}\``);
  assert.match(model, /const lightA = black \? Math\.max\(0\.55/, 'the black one\'s lights in drawModel');
  assert.match(model, /WHITE STROBE/); assert.match(model, /for \(const \[rx, ry0, col, a\] of refl\)/, 'its reflections on the harbor');
});

test('STALE-HOST WRITES: a room / chat write refused while this phone has JUST lost the host = "no longer the host" (quiet), never the alarm; the host writes check again first', () => {
  const fb = read('js/firebase.js'), host = read('js/host.js'), lm = read('js/audio/lobby-music.js');
  assert.match(fb, /if \(\/\^\\\/\?\(rooms\|chats\)\\\/\/\.test\(refPath\(r\)\)\) \{ setTimeout\(\(\) => \{ if \(safeGone\(\)\) \{/, 'a room write waits HOST_SETTLE_MS, then asks');
  assert.match(fb, /console\.info\('\[rules\] no longer the host/);
  assert.match(host, /setHostGone\(lostHostRecently\);/);
  assert.match(host, /if \(isHost\(\)\) \{\n    wasHostAt = Date\.now\(\); wasHostCode = state\.code;/);
  assert.match(host, /if \(!isHost\(\)\) return;   \/\/ \(THE ERRORS GROUP: checked again right before the write\)/, 'the beat');
  assert.match(host, /if \(!isHost\(\)\) return;   \/\/ \(THE ERRORS GROUP: a newer hostId may have landed during the step\)/, 'the director');
  assert.match(lm, /if \(!\(store\.meta && store\.meta\.hostId === store\.uid\)\) return;/, 'the lobby song');
});

test('BOTS OUT OF /admin: HeadlessChrome, Vercel\'s screenshot robot, Lighthouse dropped — a real iPhone / Android / desktop browser never', () => {
  const BOTS = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 vercel-screenshot/1.0',
    'Mozilla/5.0 (compatible; Vercelbot/0.1; +https://vercel.com)',
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  ];
  const REAL = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',   // Safari iOS
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',   // Chrome iOS
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',   // Chrome Android
    'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; CUBOT X30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',   // ("…BOT" inside a model name)
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/470.0.0.40.104]',   // Facebook's in-app
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  ];
  for (const u of BOTS) assert.equal(isBotUA(u), true, u);
  for (const u of REAL) assert.equal(isBotUA(u), false, u);
  // the server drops only when DEPLOYED (a local server keeps the test browsers' reports)
  assert.equal(dropAsBot(BOTS[0], {}), false, 'local: kept'); assert.equal(dropAsBot(BOTS[0], { VERCEL_ENV: 'production' }), true); assert.equal(dropAsBot(REAL[0], { VERCEL_ENV: 'production' }), false);
  // the phone: a robot browser sends nothing — except on a local / emulator page
  assert.equal(quietBot({ ua: REAL[0], webdriver: true, host: 'neonspeakeasy.com', search: '' }), true, 'navigator.webdriver');
  assert.equal(quietBot({ ua: BOTS[0], host: 'neonspeakeasy.com' }), true);
  assert.equal(quietBot({ ua: BOTS[0], host: 'localhost', search: '?emu' }), false, 'the tests\' own pages still report');
  assert.equal(quietBot({ ua: REAL[2], host: 'neonspeakeasy.com' }), false);
  assert.match(read('api/log.js'), /if \(dropAsBot\(meta\.ua, process\.env\)\) \{ send\(res, 200, \{ kept: 0, bot: true \}\); return; \}/);
  assert.match(read('js/errlog.js'), /if \(BOT\) \{ queue = \[\]; return; \}/);
});

test('THE LOST TAPS: the SCORES tab\'s tap area 44 pt + every answer\'s repaint waits for the tap; the full card\'s CLOSE acts on its own pointer-up, once', () => {
  assert.match(read('css/daily.css'), /\.dy-scope-b::after \{ content: ''; position: absolute; left: 0; right: 0; top: -5px; bottom: -5px; \}/);
  const d = read('js/screens/daily.js');
  assert.match(d, /const repaint = \(\) => afterTap\(\(\) => \{ if \(!gone\) paint\(\); \}\);/);
  assert.doesNotMatch(d, /\.finally\(\(\) => \{ if \(!gone\) paint\(\); \}\)/, 'no answer repaints at once');
  const f = read('js/vault/full.js');
  assert.match(f, /xb\.addEventListener\('pointerup', e => \{/); assert.match(f, /tapHandled\(\); close\(\);/);
  assert.match(f, /const close = \(\) => \{ if \(closed\) return; closed = true;/, 'close() runs once (the pointer-up + the click)');
});
