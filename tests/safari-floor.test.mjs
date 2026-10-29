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
