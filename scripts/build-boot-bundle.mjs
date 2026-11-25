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
// THE HOUSEKEEPING PASS (Nov 25, the owner's decision — the ONE narrow exception to "no build step"): /boot-bundle.json is NO LONGER COMMITTED
// (6.8 MB rewritten on most deploys — git kept every copy). It is GENERATED AT DEPLOY by scripts/deploy-build.mjs (vercel.json's buildCommand —
// the bundle, index.html's ?v= and THE CARRY's row for it in ONE step, checked against each other; a failure fails the deploy) and, locally, IN
// MEMORY by scripts/serve.mjs (the same code; rebuilt when a boot module changes — never a stale copy). The sources are read with LF line
// endings (what git stores + Vercel builds from): a CRLF working copy builds the SAME bundle. `node scripts/build-boot-bundle.mjs` only writes
// a copy to look at (ignored by git); tests/boot-bundle.test.mjs builds it in the test (deterministic + the whole boot graph).
import { readFileSync, writeFileSync } from 'node:fs';
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
/** PURE: a source with LF line endings (THE CRLF TRAP: git + Vercel hold LF; a Windows working copy may not) */
export const lf = s => (s.includes('\r') ? s.replace(/\r\n/g, '\n') : s);
/** a boot module's source, LF */
export const sourceOf = p => lf(readFileSync(resolve(ROOT, p), 'utf8'));
/** the sources' own hash (what the bundle was built from — its ?v=) */
export function sourcesHash(list = bundleList(), read = sourceOf) {
  const h = createHash('sha256');
  for (const f of list) { h.update(f); h.update('\0'); h.update(read(f)); h.update('\0'); }
  return h.digest('hex').slice(0, 16);
}
export function buildBundle(list = bundleList(), read = sourceOf) {
  const f = list.map(p => [p, rewrite(p, read(p))]);
  // (THE FIX PASS — P7: `z` = the file's own byte length, in its first bytes — the loader projects the finish from the bytes so far)
  const b = { v: sourcesHash(list, read), n: f.length, z: 0, f };
  for (let i = 0; i < 4; i++) b.z = Buffer.byteLength(bundleText(b));
  return b;
}
export const bundleText = b => `${JSON.stringify(b)}\n`;
/** index.html's loader URL → its ?v= (null: none) · the URL set to v */
export const htmlV = html => { const m = /fetch\('boot-bundle\.json(?:\?v=([0-9a-f]+))?'/.exec(html); return m ? m[1] || null : null; };
export const withHtmlV = (html, v) => html.replace(/fetch\('boot-bundle\.json(?:\?v=[0-9a-f]+)?'/, `fetch('boot-bundle.json?v=${v}'`);

// (THE CITY POLISH PASS — the bundle's URL carries its own hash (index.html's loader: boot-bundle.json?v=…) → vercel.json keeps it a year,
//  immutable: a new build = a new URL, never a stale copy. THE HOUSEKEEPING PASS: the COMMITTED index.html names it with NO ?v= — the deploy's
//  step (and the local server, in memory) stamps it; a page that asks for a bundle that is not there boots from the modules)
/** PURE: every `@ns/…` name a bundled module imports statically (the deploy's check: each one must be IN the bundle) */
export const nsImports = src => [...src.matchAll(/\b(?:from|import)\s*['"]@ns\/([^'"\r\n]+)['"]/g)].map(m => m[1]);

if (process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, 'scripts/build-boot-bundle.mjs')) {
  // (a copy to LOOK at — ignored by git; the deploy's is scripts/deploy-build.mjs's, the local server's is in memory)
  const b = buildBundle();
  writeFileSync(resolve(ROOT, BUNDLE_FILE), bundleText(b));
  console.log(`${BUNDLE_FILE}: ${b.n} modules, ${(Buffer.byteLength(bundleText(b)) / 1024).toFixed(0)} KB (${b.v}) — a local copy only (not committed; built at deploy)`);
}
