// THE HOUSEKEEPING PASS (Nov 25) — VERCEL'S DEPLOY STEP, SIMULATED (no preview deploy is available): a CLEAN COPY of the tracked files →
// .vercelignore applied (what never reaches Vercel's build) → vercel.json's buildCommand run in it, exactly as written → the output checked:
//   · /boot-bundle.json is there, parses, holds the boot list; the page asks for it by ITS hash; /file-hashes.json carries ITS row
//   · EVERY row of the output's /file-hashes.json = the hash of the output's own bytes (a deploy can never ship a list that lies)
//   · scripts/ is gone from the output (--prune); tests/ docs/ *.md never were in it
//   · A BROKEN CHECKOUT (a boot module missing) → the command exits non-zero and has written NOTHING (never a half deploy)
// then serve the folder as it is and run the browser checks against it:
//   node tests/integration/deploy-sim.mjs [--out <dir>]          (from the repo root or anywhere; prints the folder)
//   node scripts/serve.mjs 5197 --emu --root <dir>               (the output, served raw — its own /api through a node_modules junction)
//   E2E_BASE=http://localhost:5197 node tests/integration/e2e-bundle.mjs "<chromium>"   ·   … e2e-smoke.mjs
// What it does NOT do: Vercel's `npm install` (the /api's packages: a junction to this checkout's node_modules instead), Vercel's own
// routing (cleanUrls, headers — kit/line-proxy.mjs `prod` has those), the functions' bundling.
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync, rmdirSync, symlinkSync, readdirSync, statSync, lstatSync, unlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { hashOf } from '../../scripts/build-file-hashes.mjs';
import { htmlV } from '../../scripts/build-boot-bundle.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const OUT = resolve(opt('out', join(tmpdir(), 'ns-deploy-sim')));
const git = cmd => execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 << 20 });
const fails = [];
const ok = (c, m) => { console.log(`${c ? 'OK  ' : 'FAIL'} ${m}`); if (!c) fails.push(m); };

// 1. a clean folder (a node_modules junction of an earlier run is unlinked first — never followed)
if (existsSync(OUT)) {
  const nm = join(OUT, 'node_modules');
  try { if (lstatSync(nm).isSymbolicLink()) { try { rmdirSync(nm); } catch { unlinkSync(nm); } } } catch { /* none */ }
  rmSync(OUT, { recursive: true, force: true });
}
mkdirSync(OUT, { recursive: true });
// 2. the tracked files (the working tree's bytes — a clean tree = the commit) minus what .vercelignore names
const dirty = git('status --porcelain').split('\n').filter(l => l && !/^(\?\?| A)/.test(l) && !/^\?\?/.test(l));
const tracked = git('ls-files -z').split('\0').filter(Boolean);
const ignored = new Set(git('ls-files -z -i -c --exclude-from=.vercelignore').split('\0').filter(Boolean));
let n = 0, bytes = 0;
for (const f of tracked) {
  if (ignored.has(f) || !existsSync(join(ROOT, f))) continue;
  const to = join(OUT, f);
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(join(ROOT, f), to); n++; bytes += statSync(to).size;
}
console.log(`the deploy's upload: ${n} of ${tracked.length} tracked files (${(bytes / 1048576).toFixed(0)} MB; .vercelignore drops ${ignored.size}) → ${OUT}${dirty.length ? `   [the working tree has ${dirty.length} uncommitted change(s) — copied as they are]` : '   [a clean tree = the commit]'}`);
ok(!existsSync(join(OUT, 'boot-bundle.json')), 'the upload has NO boot-bundle.json (never committed)');
ok(!existsSync(join(OUT, 'tests')) && !existsSync(join(OUT, 'docs')) && !existsSync(join(OUT, 'CLAUDE.md')), 'tests/ docs/ *.md are not in the build');
const scr = existsSync(join(OUT, 'scripts')) ? readdirSync(join(OUT, 'scripts')).sort() : [];
ok(scr.join(' ') === 'boot-bytes.mjs build-boot-bundle.mjs build-boot-preload.mjs build-file-hashes.mjs deploy-build.mjs', `scripts/ in the build = the step + its imports only (${scr.join(' ')})`);

const cmd = JSON.parse(readFileSync(join(OUT, 'vercel.json'), 'utf8')).buildCommand;
ok(typeof cmd === 'string' && cmd.length > 0, `vercel.json's buildCommand: ${cmd}`);
const run = () => spawnSync(cmd, { cwd: OUT, shell: true, encoding: 'utf8', env: { ...process.env, VERCEL: '1', CI: '1' } });

// 3. A BROKEN CHECKOUT first: a boot module missing → the step fails and writes nothing
{
  const victim = join(OUT, 'js/store.js'), keep = readFileSync(victim), before = ['index.html', 'file-hashes.json'].map(f => hashOf(readFileSync(join(OUT, f))));
  rmSync(victim);
  const r = run();
  ok(r.status !== 0, `a boot module missing → the build command exits ${r.status} (non-zero = the deploy FAILS, the last good one stays live)`);
  ok(/THE DEPLOY BUILD FAILED/.test(r.stderr || '') && /js\/store\.js/.test(r.stderr || ''), `… and says why (${String(r.stderr || '').split('\n').slice(0, 2).join(' / ').slice(0, 160)})`);
  ok(!existsSync(join(OUT, 'boot-bundle.json')) && ['index.html', 'file-hashes.json'].every((f, i) => hashOf(readFileSync(join(OUT, f))) === before[i]) && existsSync(join(OUT, 'scripts')), '… and wrote NOTHING (no bundle, the page + the list untouched, nothing pruned): never a half deploy');
  writeFileSync(victim, keep);
}
// 4. the real step
const t0 = Date.now(), r = run();
console.log(String(r.stdout || '').trim() || String(r.stderr || '').trim());
ok(r.status === 0, `the build command exits 0 (${Date.now() - t0} ms)`);
if (r.status === 0) {
  const text = readFileSync(join(OUT, 'boot-bundle.json'), 'utf8'), b = JSON.parse(text), html = readFileSync(join(OUT, 'index.html'), 'utf8'), list = JSON.parse(readFileSync(join(OUT, 'file-hashes.json'), 'utf8'));
  ok(b.n === b.f.length && b.n > 250 && b.f[0][0] === 'js/app.js' && b.z === Buffer.byteLength(text), `boot-bundle.json: ${b.n} modules, ${(b.z / 1024).toFixed(0)} KB, js/app.js first, z = its size`);
  ok(htmlV(html) === b.v, `index.html asks for boot-bundle.json?v=${htmlV(html)} = the bundle's own hash`);
  ok(list.files['/boot-bundle.json'] === hashOf(Buffer.from(text, 'utf8')), `file-hashes.json carries the bundle's row (${list.files['/boot-bundle.json']})`);
  // every row = the output's own bytes
  const wrong = Object.entries(list.files).filter(([p, h]) => { try { return hashOf(readFileSync(join(OUT, p))) !== h; } catch { return true; } });
  ok(wrong.length === 0, `EVERY row of the output's file-hashes.json (${list.n}) = the hash of the output's own file${wrong.length ? ` — wrong: ${wrong.slice(0, 5).map(x => x[0]).join(', ')}` : ''}`);
  // every bundled module = the output's own source file, rewritten (the bundle can not be another build's)
  const { rewrite, lf } = await import('../../scripts/build-boot-bundle.mjs');
  const other = b.f.filter(([p, src]) => rewrite(p, lf(readFileSync(join(OUT, p), 'utf8'))) !== src);
  ok(other.length === 0, `every bundled module = the output's own /js file, rewritten (${b.n - other.length} of ${b.n})`);
  ok(!existsSync(join(OUT, 'scripts')), 'scripts/ is gone from the output (--prune): the builders never ship');
  // the committed page differs from the shipped one ONLY by the ?v=
  ok(html.replace(`boot-bundle.json?v=${b.v}`, 'boot-bundle.json') === readFileSync(join(ROOT, 'index.html'), 'utf8').replace(/\r\n/g, '\n'), 'the shipped page = the committed page + the ?v= (nothing else rewritten)');
  const top = readdirSync(OUT).sort();
  console.log(`the output's top level (${top.length}): ${top.join(' ')}`);
  // 5. the /api's packages (Vercel's own `npm install`): a junction to this checkout's node_modules — removed by the next run / by hand
  try { symlinkSync(join(ROOT, 'node_modules'), join(OUT, 'node_modules'), 'junction'); } catch (e) { console.log(`(no node_modules junction: ${e.message})`); }
  console.log(`\nserve it:   node scripts/serve.mjs 5197 --emu --root "${OUT}"`);
}
console.log(fails.length ? `\n${fails.length} FAILED` : '\ndeploy-sim: all green');
process.exit(fails.length ? 1 : 0);
