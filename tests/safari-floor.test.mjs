// The Safari floor (docs/harbor/passes/cleanup-c15.md): what must stay parseable / guarded on older iPhones.
// - No top-level await anywhere in js/ (iOS 14 can't parse one: the whole app would die at module load, every game included).
// - City 2.0 (js/screens/harbor/) gets its 2D contexts through canvas-safe.js#ctx2d (a null context out of iOS canvas memory
//   must skip a layer, never throw every frame).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import vm from 'node:vm';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const walk = dir => readdirSync(dir).flatMap(n => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
const FILES = walk(join(ROOT, 'js'));

// A module's body, turned into a classic script: the import / export syntax removed, so the only thing left that a script
// can't hold at its top is an `await` there (vm.Script throws "await is only valid in async functions …").
function asScript(src) {
  return src
    .replace(/^import\s+[^'"`;]*?\s+from\s+['"][^'"]+['"];?/gms, '')
    .replace(/^import\s+['"][^'"]+['"];?/gm, '')
    .replace(/^export\s+\{[^}]*\}(\s+from\s+['"][^'"]+['"])?;?/gm, '')
    .replace(/^export\s+\*\s+from\s+['"][^'"]+['"];?/gm, '')
    .replace(/^export\s+default\s+/gm, 'void ')
    .replace(/^export\s+(?=(async\s+)?function|const|let|var|class)/gm, '')
    .replace(/import\.meta/g, '({})');
}

test('no top-level await in js/ (iOS 14 / Safari 14 must still parse every module)', () => {
  assert.ok(FILES.length > 100, `found the modules (${FILES.length})`);
  const bad = [];
  for (const f of FILES) {
    try { new vm.Script(asScript(readFileSync(f, 'utf8')), { filename: f }); }
    catch (e) { bad.push(`${relative(ROOT, f)}: ${e.message}`); }
  }
  assert.deepEqual(bad, []);
});

test('the TLA check itself catches one', () => {
  assert.throws(() => new vm.Script(asScript("import { a } from './a.js';\nconst m = await import('./b.js');\nexport const x = 1;\n")));
  assert.doesNotThrow(() => new vm.Script(asScript("import { a } from './a.js';\nexport async function f() { await 1; }\nexport default 3;\n")));
});

test('City 2.0 never calls getContext directly (ctx2d() guards a null context)', () => {
  const dir = join(ROOT, 'js', 'screens', 'harbor');
  const bad = [];
  for (const f of walk(dir)) {
    readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (/\.getContext\(/.test(l) && !/^\s*\/\//.test(l)) bad.push(`${relative(ROOT, f)}:${i + 1}`); });
  }
  assert.deepEqual(bad, []);
});

test('safeCtx: a refused context draws nothing, never throws, and is counted', async () => {
  const { safeCtx, starvedCount, ctx2d } = await import('../js/ui/canvas-safe.js');
  const n0 = starvedCount();
  for (const cv of [{ getContext: () => null, width: 8, height: 8 }, { getContext: () => { throw new Error('no memory'); }, width: 8, height: 8 }]) {
    const x = safeCtx(cv);
    assert.equal(x.canvas, cv);
    x.setTransform(2, 0, 0, 2, 0, 0); x.globalAlpha = 0.5; x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 4); x.drawImage(cv, 0, 0);
    const g = x.createRadialGradient(0, 0, 0, 1, 1, 1); g.addColorStop(0, '#fff');
    const img = x.createImageData(4, 3); assert.equal(img.data.length, 48);
    assert.equal(x.getImageData(0, 0, 2, 2).data.length, 16);
    assert.equal(x.measureText('A').width, 0);
    assert.equal(ctx2d(cv), null);
  }
  assert.equal(starvedCount(), n0 + 2);
  const real = { ok: true }, cv = { getContext: () => real };
  assert.equal(safeCtx(cv), real);
  assert.equal(starvedCount(), n0 + 2);
});

// LOAD FIX 4 — Grok's boot audit #5: the Harbor's floor is iOS 16 — what Safari 16.0 can't PARSE (a SyntaxError at the module's load: the city
// dead on that phone) and a grep can catch. Checked: a regex LOOKBEHIND (Safari 16.4 — chat/logic.js's profanity filter had one, in the city's
// graph), a class STATIC BLOCK (16.4), IMPORT ATTRIBUTES / ASSERTIONS (17.2 / never), the regex `v` flag (17).
const codeOf = src => src.replace(/\/\*[\s\S]*?\*\//g, ' ').split('\n').map(l => l.replace(/^\s*\/\/.*$/, '')).join('\n');
test('Safari 16.0 parses every module: no regex lookbehind, no static block, no import attributes, no regex v flag', () => {
  const bad = [];
  for (const f of FILES) {
    const t = codeOf(readFileSync(f, 'utf8')), rel = relative(ROOT, f);
    if (/\(\?<[=!]/.test(t)) bad.push(`${rel}: a regex lookbehind (Safari 16.4+)`);
    if (/^\s*static\s*\{/m.test(t)) bad.push(`${rel}: a class static block (Safari 16.4+)`);
    if (/\bfrom\s+['"][^'"]+['"]\s+(with|assert)\s*\{/.test(t) || /import\([^)]*,\s*\{\s*(with|assert)\b/.test(t)) bad.push(`${rel}: import attributes (Safari 17.2+)`);
    if (/new RegExp\([^)]*,\s*['"`][a-z]*v[a-z]*['"`]\)/.test(t) || /[=(,:]\s*\/(?:[^/\\\n]|\\.)+\/[dgimsuy]*v[dgimsuy]*\b/.test(t)) bad.push(`${rel}: the regex v flag (Safari 17+)`);
  }
  assert.deepEqual(bad, []);
});
test('the profanity filter without lookbehind masks EXACTLY as the lookbehind one did (a corpus of edges)', async () => {
  const { maskProfanity, hasProfanity } = await import('../js/chat/logic.js');
  const src = readFileSync(join(ROOT, 'js', 'chat', 'logic.js'), 'utf8');
  const words = Function(`return ${src.slice(src.indexOf('const WORDS = [') + 'const WORDS = '.length, src.indexOf('];', src.indexOf('const WORDS = [')) + 1)}`)();
  const OLD = new RegExp(`(?<![\\p{L}\\p{N}_'’-])(?:${words.join('|')})(?![\\p{L}\\p{N}_'’-])`, 'giu');   // (node has lookbehind: the reference)
  const oldMask = t => String(t).replace(OLD, w => w[0] + w.slice(1).replace(/[^\s]/g, '*'));
  const roots = ['fuck', 'Fucking', 'shit', 'ass', 'asses', 'bitch', 'son of a bitch', 'piss', 'wtf', 'fuuuck', 'cunts', 'dumbass', 'ASSHOLE'];
  const edges = ['', ' ', 'x', '-', "'", '’', '_', '1', '.', ',', '!', 'é', '\n', '(', '"'];
  const innocent = ['Scunthorpe', 'assassin', 'class', 'cocktail', 'Dickens', 'therapist', 'Moby-Dick', "Hell's", 'passage', 'bass', 'mass-produced', 'shitake'];
  const cases = [...innocent, 'what the fuck', 'fuck fuck', 'ass,ass', 'ass ass ass', 'a fuck-up', 'FUCK!', 'shit\nshit'];
  for (const r of roots) for (const a of edges) for (const b of edges) cases.push(`${a}${r}${b}`, `go ${a}${r}${b} now`, `${r}${b}${r}`);
  let hits = 0;
  for (const c of cases) {
    assert.equal(maskProfanity(c), oldMask(c), `the same mask for ${JSON.stringify(c)}`);
    OLD.lastIndex = 0; const h = OLD.test(c); OLD.lastIndex = 0;
    assert.equal(hasProfanity(c), h, `the same hit for ${JSON.stringify(c)}`); if (h) hits++;
  }
  assert.ok(cases.length > 2000 && hits > 300, `${cases.length} cases, ${hits} hits`);
});

// FR7 FIXES C2 — THE SUPPORTED FLOOR (the owner's /admin, Nov 13: two BOOT HANGs from a bot's "Mac Chrome 83"): the PURE copy
// (js/core/browser-floor.js — the server's) and the INLINE copy (index.html's watchdog — the phone's; ES5) give the same verdict on real UAs.
const UAS = [
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.97 Safari/537.36', true, 'the bot (Mac Chrome 83)'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', false, 'Windows Chrome 131'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', true, 'Chrome 91'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36', false, 'Chrome 92 (the floor)'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1', false, "the owner's iPhone (iOS 18.7)"],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1', false, 'iOS 16.0'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.6 Mobile/15E148 Safari/604.1', true, 'iOS 15.8'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1', false, 'Chrome on iOS 17'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 15_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1', true, 'Chrome on iOS 15 (WebKit decides)'],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22B83 [FBAN/FBIOS;FBAV/490.0]', false, 'Facebook in-app on iOS 18'],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', false, 'an iPad asking for the desktop site'],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15', true, 'Mac Safari 15.6'],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15', false, 'Mac Safari 17.5'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0', true, 'Firefox 89'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0', false, 'Firefox 132'],
  ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36', false, 'Android Chrome 120'],
  ['Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36', false, 'Samsung Internet 23'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0', false, 'Edge 120'],
  ['curl/8.4.0', null, 'unknown — never old'],
];
function inlineFloor() {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
  const f0 = html.indexOf('    var FLOOR = {'), f1 = html.indexOf('\n    }\n', html.indexOf('    function floorOf(ua) {'));
  assert.ok(f0 > 0 && f1 > f0, 'index.html holds the inline floor');
  return { fn: new vm.Script(`${html.slice(f0, f1 + 6)}\n({ floorOf, FLOOR })`).runInNewContext({}), src: html.slice(f0, f1 + 6) };
}
test('THE SUPPORTED FLOOR: the PURE + the INLINE copy agree on real browsers (the bot old, every current browser not, an unknown never)', async () => {
  const { browserFloor, tooOld, FLOOR } = await import('../js/core/browser-floor.js');
  const { fn } = inlineFloor();
  assert.deepEqual({ ...fn.FLOOR }, { ...FLOOR }, 'the same floor numbers');
  for (const [ua, old, what] of UAS) {
    const a = browserFloor(ua), b = fn.floorOf(ua);
    assert.equal(a ? a.old : null, old, `PURE: ${what}`);
    assert.equal(b ? b.old : null, old, `INLINE: ${what}`);
    assert.equal(tooOld(ua), !!old);
  }
});
test('THE SUPPORTED FLOOR covers what the code needs (Array#at → Chrome 92 / Firefox 90; the Harbor\'s iOS 16) + the inline copy is ES5', async () => {
  const { FLOOR } = await import('../js/core/browser-floor.js');
  const usesAt = FILES.some(f => /\.at\(-?\w/.test(readFileSync(f, 'utf8')));
  if (usesAt) assert.ok(FLOOR.chrome >= 92 && FLOOR.firefox >= 90 && FLOOR.safari >= 15 && FLOOR.ios >= 15, 'Array#at needs Chrome 92 · Firefox 90 · Safari 15.4');
  assert.ok(FLOOR.ios >= 16 && FLOOR.safari >= 16, "the Harbor's written floor: iOS 16");
  const { src } = inlineFloor();
  assert.doesNotMatch(src, /=>|\bconst\b|\blet\b|`|\?\.|\?\?/, 'the inline floor is ES5 (an old engine runs it)');
});
