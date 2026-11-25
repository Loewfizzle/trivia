// THE HOUSEKEEPING PASS (Nov 25) — THE DEPLOY BUILD: the ONE narrow exception to "no build step" (the owner's decision, Nov 24 —
// docs/harbor.md "THE FIRST-VISIT BUNDLE": the 6.8 MB /boot-bundle.json was committed and rewritten on most deploys; git kept every copy).
// Vercel runs this ONCE per deploy (vercel.json's buildCommand: `node scripts/deploy-build.mjs --prune`); the site's files are still the
// repo's plain files — this only GENERATES, into the repo root (the served output), the three things that must match each other:
//   1. /boot-bundle.json      the boot graph in one file (scripts/build-boot-bundle.mjs — the same code as ever)
//   2. /index.html            THE BOOT PRELOAD's list (already committed + unit-tested current: written again from the same graph) and the
//                             loader's `boot-bundle.json?v=<the bundle's own hash>` (the committed page names it with no ?v=)
//   3. /file-hashes.json      THE CARRY's list, hashed from THIS checkout's own bytes, + the bundle's row
// then CHECKS them against each other (checkDeploy) BEFORE and AFTER writing — anything wrong = exit 1 = THE DEPLOY FAILS (Vercel keeps the
// last good deployment live; never a half deploy). A page whose bundle is missing or refused still boots from the modules (index.html's
// loader: any failure of the bundle = the modules — Safari always takes that path).
// Locally nothing is written: scripts/serve.mjs serves the SAME three files from memory through deployFiles() (rebuilt when a boot module
// changes), so the working tree stays clean and a test page never runs a stale bundle. tests/integration/deploy-sim.mjs = Vercel's step on a
// clean copy of the tracked files (.vercelignore applied), end to end.
//   --prune   remove scripts/ from the output afterwards (the deploy keeps only these builders in scripts/ — .vercelignore; they never ship)
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildBundle, bundleText, bundleList, withHtmlV, htmlV, nsImports, lf, BUNDLE_FILE } from './build-boot-bundle.mjs';
import { withPreload, preloadBlock } from './build-boot-preload.mjs';
import { render, withFile, hashOf, BUNDLE_PATH, OUT } from './build-file-hashes.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const HTML = 'index.html';

/** the deploy's three generated files (their text) from the page's text + the hash list's text (the bundle: built from this checkout) */
export function deployFiles(html, listText, list = bundleList()) {
  const bundle = buildBundle(list), text = bundleText(bundle);
  return { [BUNDLE_FILE]: text, [HTML]: withHtmlV(withPreload(lf(html), preloadBlock(list.slice(1))), bundle.v), [OUT]: withFile(listText, BUNDLE_PATH, text) };
}

/** PURE: the three files against each other + the boot list → the problems (none = [] — the deploy may ship) */
export function checkDeploy(files, list = bundleList()) {
  const bad = [], text = files[BUNDLE_FILE], html = files[HTML];
  let b = null, h = null;
  try { b = JSON.parse(text); } catch (e) { bad.push(`${BUNDLE_FILE} does not parse: ${e.message}`); }
  try { h = JSON.parse(files[OUT]); } catch (e) { bad.push(`${OUT} does not parse: ${e.message}`); }
  if (b) {
    const names = (b.f || []).map(x => x[0]), have = new Set(names);
    if (!names.length || b.n !== names.length) bad.push(`${BUNDLE_FILE}: n ${b.n} ≠ its ${names.length} modules`);
    if (names[0] !== 'js/app.js') bad.push(`${BUNDLE_FILE}: js/app.js is not first`);
    if (names.join('\n') !== list.join('\n')) bad.push(`${BUNDLE_FILE}: its modules are not the boot list (${names.length} of ${list.length})`);
    if (b.z !== Buffer.byteLength(text)) bad.push(`${BUNDLE_FILE}: z ${b.z} ≠ its ${Buffer.byteLength(text)} bytes`);
    if (typeof b.v !== 'string' || !/^[0-9a-f]{16}$/.test(b.v)) bad.push(`${BUNDLE_FILE}: no hash`);
    for (const [p, src] of b.f || []) {
      if (typeof src !== 'string' || !src.startsWith('const __nsMeta = ')) { bad.push(`${p}: not rewritten`); continue; }
      if (/(\b(?:from|import)\s*)(['"])\.{1,2}\//.test(src)) bad.push(`${p}: a relative static import left`);
      for (const d of nsImports(src)) if (!have.has(d)) bad.push(`${p} imports ${d} — NOT in the bundle (a missing file?)`);
    }
    if (htmlV(html) !== b.v) bad.push(`${HTML} asks for ${BUNDLE_FILE}?v=${htmlV(html)} — the bundle is ${b.v}`);
    if (h && (h.files || {})[BUNDLE_PATH] !== hashOf(Buffer.from(text, 'utf8'))) bad.push(`${OUT}: the bundle's row is not the bundle's hash`);
  }
  if (h && (!h.files || h.n !== Object.keys(h.files).length || h.n < 100)) bad.push(`${OUT}: ${h.n} rows`);
  if (!/window\.__nsGo\(\);/.test(html)) bad.push(`${HTML}: the loader's start is gone`);
  return bad;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, 'scripts/deploy-build.mjs')) {
  const t0 = Date.now(), at = f => resolve(ROOT, f), fail = bad => { console.error(`THE DEPLOY BUILD FAILED — nothing ships:\n  ${bad.join('\n  ')}`); process.exit(1); };
  let files;
  try { files = deployFiles(readFileSync(at(HTML), 'utf8'), render()); } catch (e) { fail([String((e && e.stack) || e)]); }
  let bad = checkDeploy(files);
  if (bad.length) fail(bad);
  for (const [f, text] of Object.entries(files)) writeFileSync(at(f), text);
  // (what was WRITTEN is what was checked: read back from the disk)
  bad = checkDeploy(Object.fromEntries(Object.keys(files).map(f => [f, readFileSync(at(f), 'utf8')])));
  if (bad.length) fail(bad);
  const b = JSON.parse(files[BUNDLE_FILE]);
  if (process.argv.includes('--prune')) rmSync(at('scripts'), { recursive: true, force: true });
  console.log(`THE DEPLOY BUILD: ${BUNDLE_FILE} ${b.n} modules, ${(b.z / 1024).toFixed(0)} KB (v ${b.v}) · ${HTML} asks for ?v=${b.v} · ${OUT} ${JSON.parse(files[OUT]).n} files (the bundle's row in) · ${Date.now() - t0} ms`);
}
