// THE BOOT BYTES (SHELL 2.0 B1 — THE CONTRACT's proof): the title's STATIC import graph from js/app.js — every module a fresh tab
// fetches + parses before the first paint can go on (dynamic import() is NOT followed: those load later, on demand). Prints the total,
// the games' share (js/games/**) and the biggest files.   node scripts/boot-bytes.mjs [--json] [--top 20]
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const STATIC = /(?:^|[\s;}])(?:import|export)\s+(?:[\w*{}\s,$]+\s+from\s+)?['"]([^'"]+)['"]/g;
function staticDeps(file) {
  const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const out = [];
  for (const m of src.matchAll(STATIC)) { const s = m[1]; if (!s.startsWith('.') && !s.startsWith('/')) continue; out.push(s.startsWith('/') ? resolve(ROOT, '.' + s) : resolve(dirname(file), s)); }
  return out;
}
export function bootGraph(entry = 'js/app.js') {
  const seen = new Map(), todo = [resolve(ROOT, entry)];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f) || !existsSync(f)) continue;
    seen.set(f, readFileSync(f).length);
    for (const d of staticDeps(f)) todo.push(d);
  }
  const rows = [...seen].map(([f, b]) => ({ f: relative(ROOT, f).replace(/\\/g, '/'), b }));
  const total = rows.reduce((s, r) => s + r.b, 0), games = rows.filter(r => r.f.startsWith('js/games/') && !r.f.startsWith('js/games/kit/'));
  return { total, files: rows.length, games: games.reduce((s, r) => s + r.b, 0), gameFiles: games.length, rows: rows.sort((a, b) => b.b - a.b) };
}
if (process.argv[1] && resolve(process.argv[1]) === resolve(ROOT, 'scripts/boot-bytes.mjs')) {
  const g = bootGraph(), top = Number((process.argv[process.argv.indexOf('--top') + 1]) || 15);
  if (process.argv.includes('--json')) console.log(JSON.stringify({ total: g.total, files: g.files, games: g.games, gameFiles: g.gameFiles }));
  else {
    console.log(`boot graph: ${g.files} modules, ${(g.total / 1024).toFixed(0)} KB — the games' share ${(g.games / 1024).toFixed(0)} KB in ${g.gameFiles} files`);
    for (const r of g.rows.filter(r => r.f.startsWith('js/games/')).slice(0, top)) console.log(`  ${(r.b / 1024).toFixed(1).padStart(6)} KB  ${r.f}`);
  }
}
