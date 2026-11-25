// THE BEFORE-LAUNCH PASS — THE FIRST-VISIT BUNDLE (the owner approved ONE generated file, the preload-graph pattern — docs/harbor.md
// "THE FIRST-VISIT BUNDLE"). A first visit (no service worker in charge of the page: a new phone, a cleared cache) asked for ~300 boot modules
// one request each; it now asks for ONE file — /boot-bundle.json, every module of THE BOOT PRELOAD's list (js/app.js + its ENTRIES' static
// graphs, scripts/build-boot-preload.mjs#preloadList) — and index.html's loader runs them from blob URLs through ONE import map:
//   · each module keeps its OWN identity: the map names it twice — `@ns/<path>` (what the bundled modules import) and its real URL (what a
//     LAZY chunk, fetched from the network as ever, imports): one module, one instance, whoever asks;
//   · the rewrites (here, at build time — the source files are never touched): a static relative import → `@ns/<path>`; `import.meta.url` →
//     the module's REAL URL (`__nsMeta`: its assets resolve as before); a dynamic `import(x)` → `__nsI(x)` (a relative x resolved against
//     the real URL — a blob URL is no base);
//   · a returning visitor (the service worker in charge), an old browser (no import maps), `?nobundle`, or ANY failure of the bundle (its
//     fetch, its parse) = the modules exactly as before (+ THE BOOT PRELOAD's modulepreloads). THE CARRY + ONE DEPLOY AT A TIME: unchanged
//     (the bundle sits outside js/ — never a build cache's copy; it is this deploy's own files, generated with them).
// GENERATED — run `node scripts/build-boot-bundle.mjs` after ANY boot module changes (tests/boot-bundle.test.mjs fails when stale, like the
// preload graph's). `--check` = exit 1 when stale (no write).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, posix } from 'node:path';
import { createHash } from 'node:crypto';
import { preloadList } from './build-boot-preload.mjs';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
export const BUNDLE_FILE = 'boot-bundle.json';
/** the modules in the bundle, in THE BOOT PRELOAD's order (js/app.js first) */
export const bundleList = () => ['js/app.js', ...preloadList()];

const STATIC = /(\b(?:from|import)\s*)(['"])(\.{1,2}\/[^'"\r\n]+?)\2/g;
const DYNAMIC = /(?<![.\w$])import\s*\(/g;
/** one module's source → its bundled form (PURE) */
export function rewrite(path, src) {
  const dir = posix.dirname(path);
  let out = src.replace(STATIC, (m, pre, q, spec) => `${pre}${q}@ns/${posix.normalize(posix.join(dir, spec))}${q}`);
  out = out.replace(/\bimport\.meta\.url\b/g, '__nsMeta');
  out = out.replace(DYNAMIC, '__nsI(');
  // (the prelude: the real URL, a resolver for a dynamic import's relative name, the dynamic import itself — on the FIRST line, so a stack's
  //  line numbers are the file's own)
  const pre = `const __nsMeta = globalThis.__nsRoot + ${JSON.stringify(path)}, __nsR = s => (typeof s === 'string' && /^\\.{1,2}\\//.test(s) ? new URL(s, __nsMeta).href : s), __nsI = s => import(__nsR(s));`;
  return `${pre} ${out}`;
}
/** the sources' own hash (what the bundle was built from — the staleness check) */
export function sourcesHash(list = bundleList()) {
  const h = createHash('sha256');
  for (const f of list) { h.update(f); h.update('\0'); h.update(readFileSync(resolve(ROOT, f))); h.update('\0'); }
  return h.digest('hex').slice(0, 16);
}
export function buildBundle(list = bundleList()) {
  const f = list.map(p => [p, rewrite(p, readFileSync(resolve(ROOT, p), 'utf8'))]);
  // (THE FIX PASS — P7: `z` = the file's own byte length, in its first bytes — the loader projects the finish from the bytes so far)
  const b = { v: sourcesHash(list), n: f.length, z: 0, f };
  for (let i = 0; i < 4; i++) b.z = Buffer.byteLength(bundleText(b));
  return b;
}
export const bundleText = b => `${JSON.stringify(b)}\n`;
/** index.html's loader URL → its ?v= (null: none) · the URL set to v */
export const htmlV = html => { const m = /fetch\('boot-bundle\.json(?:\?v=([0-9a-f]+))?'/.exec(html); return m ? m[1] || null : null; };
export const withHtmlV = (html, v) => html.replace(/fetch\('boot-bundle\.json(?:\?v=[0-9a-f]+)?'/, `fetch('boot-bundle.json?v=${v}'`);

if (process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, 'scripts/build-boot-bundle.mjs')) {
  const file = resolve(ROOT, BUNDLE_FILE);
  const want = sourcesHash();
  const have = existsSync(file) ? (() => { try { return JSON.parse(readFileSync(file, 'utf8')).v; } catch { return null; } })() : null;
  const html = resolve(ROOT, 'index.html'), htmlNow = readFileSync(html, 'utf8');
  if (process.argv.includes('--check')) { if (have !== want || htmlV(htmlNow) !== want) { console.error(`${BUNDLE_FILE} (or index.html's ?v=) is stale — run node scripts/build-boot-bundle.mjs`); process.exit(1); } console.log(`${BUNDLE_FILE} current (${want})`); process.exit(0); }
  const b = buildBundle();
  writeFileSync(file, bundleText(b));
  // (THE CITY POLISH PASS — the bundle's URL carries its own hash (index.html's loader: boot-bundle.json?v=…) → vercel.json keeps it a year,
  //  immutable: a new build = a new URL, never a stale copy)
  const htmlNew = withHtmlV(htmlNow, b.v);
  if (htmlNew !== htmlNow) writeFileSync(html, htmlNew);
  console.log(`${BUNDLE_FILE}: ${b.n} modules, ${(Buffer.byteLength(bundleText(b)) / 1024).toFixed(0)} KB (${want})`);
}
