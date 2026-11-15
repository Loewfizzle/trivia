// CITY A — item 14, THE PHONE KEEPS ITS FILES (NO BUILD STEP KEPT): after a deploy a phone downloaded EVERY file again — the worker's cache is
// one per build (sw.js — ONE DEPLOY AT A TIME), and a new build started empty. This writes /file-hashes.json: every static file the worker keeps
// (js/ css/ assets/ data/ — never /audio, /api) → a short hash of its BYTES. The worker fetches the new build's list once, compares it with the
// list it stored for the old build, and CARRIES every unchanged file from the old build's cache into the new one — only the changed files come
// over the network. The site still ships plain files: this is a committed list, like js/games/preload-graph.js.
//   node scripts/build-file-hashes.mjs          (tests/file-hashes.test.mjs fails when the list is stale — run it after changing any file)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join, relative } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
export const DIRS = ['js', 'css', 'assets', 'data'];
export const OUT = 'file-hashes.json';
const SKIP = /(^|\/)\.|\.map$|(^|\/)Thumbs\.db$/;

/** every kept file under DIRS → its path ('/js/app.js') */
export function files() {
  const out = [];
  const walk = d => { for (const n of readdirSync(d).sort()) { const f = join(d, n), rel = relative(ROOT, f).split('\\').join('/'); if (SKIP.test(rel)) continue; if (statSync(f).isDirectory()) walk(f); else out.push(rel); } };
  for (const d of DIRS) walk(resolve(ROOT, d));
  return out.sort();
}
/** PURE: a file's bytes → its short hash (12 hex of a SHA-1 — a content id, not a secret) */
export const hashOf = buf => createHash('sha1').update(buf).digest('hex').slice(0, 12);
export function render() {
  const map = {};
  for (const f of files()) map[`/${f}`] = hashOf(readFileSync(resolve(ROOT, f)));
  return `${JSON.stringify({ v: 1, n: Object.keys(map).length, files: map })}\n`;
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, 'scripts/build-file-hashes.mjs')) {
  const s = render();
  writeFileSync(resolve(ROOT, OUT), s);
  console.log(`${OUT}: ${JSON.parse(s).n} files, ${(s.length / 1024).toFixed(1)} KB`);
}
