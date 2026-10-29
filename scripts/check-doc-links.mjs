// C4d — THE DOCS' LINKS (docs/harbor.md was split into docs/harbor/passes/ — every pointer into it had to move): every
// `docs/<file>.md` (+ `#anchor`) written anywhere in the repo's text files, and every relative `<file>.md(#anchor)` link inside docs/,
// must name a file that exists and, with an anchor, a heading in it that the anchor starts (the repo's short form: `#c4c` names the
// "## C4c — …" section; a dash run counts as one). node scripts/check-doc-links.mjs → the broken ones (exit 1); tests/doc-links.test.mjs
// runs the same check in the unit suite.
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const headCache = new Map();
function headsOf(file) {
  if (!headCache.has(file)) {
    const out = []; let code = false;
    for (const l of readFileSync(join(ROOT, file), 'utf8').split('\n')) { if (l.startsWith('```')) code = !code; if (!code) { const m = /^#{1,6} (.*)$/.exec(l); if (m) out.push(norm(m[1])); } }
    headCache.set(file, out);
  }
  return headCache.get(file);
}
export function checkDocLinks() {
  const files = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => /\.(md|js|mjs|html|py|yml|css)$/.test(f));
  const bad = [];
  for (const f of files) {
    if (!existsSync(join(ROOT, f))) continue;
    const src = readFileSync(join(ROOT, f), 'utf8'), refs = [];
    for (const m of src.matchAll(/\bdocs\/[A-Za-z0-9_\/.-]*?\.md(?:#[A-Za-z0-9_-]+)?/g)) refs.push({ path: m[0].split('#')[0], anchor: m[0].split('#')[1] || null });
    // (inside docs/: relative markdown links — [x](harbor/passes/c4c.md#…), [x](../../harbor.md))
    if (f.startsWith('docs/') && f.endsWith('.md')) for (const m of src.matchAll(/\]\(((?!https?:|#)[A-Za-z0-9_\/.-]+\.md)(#[A-Za-z0-9_-]+)?\)/g)) refs.push({ path: relative(ROOT, normalize(join(ROOT, dirname(f), m[1]))).replace(/\\/g, '/'), anchor: m[2] ? m[2].slice(1) : null });
    for (const r of refs) {
      if (!existsSync(join(ROOT, r.path))) { bad.push(`${f}: ${r.path} — no such file`); continue; }
      if (!r.anchor) continue;
      const a = norm(r.anchor);
      if (!headsOf(r.path).some(h => h === a || h.startsWith(a + '-'))) bad.push(`${f}: ${r.path}#${r.anchor} — no heading starts so`);
    }
  }
  return [...new Set(bad)];
}
if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const bad = checkDocLinks();
  console.log(bad.length ? bad.join('\n') : 'every docs link resolves');
  process.exit(bad.length ? 1 : 0);
}
