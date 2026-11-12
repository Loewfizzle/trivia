// THE DEPLOY'S SIZE (FR7 FIXES B — D3): what a Vercel deploy uploads = every committed file minus .vercelignore's patterns (Vercel builds
// from the git checkout). Prints the total, the file count and the biggest folders.   node scripts/deploy-size.mjs [--list]
import { execSync } from 'node:child_process';
import { statSync } from 'node:fs';

const git = a => execSync(`git ${a}`, { encoding: 'utf8', maxBuffer: 64 << 20 }).split('\n').filter(Boolean);
const tracked = git('ls-files');
const ignored = new Set(git('ls-files -i -c --exclude-from=.vercelignore'));
let total = 0, n = 0;
const byDir = new Map();
for (const f of tracked) {
  if (ignored.has(f)) continue;
  let s = 0; try { s = statSync(f).size; } catch { continue; }
  total += s; n++;
  const d = f.split('/').slice(0, 2).join('/');
  byDir.set(d, (byDir.get(d) || 0) + s);
}
const mib = b => (b / 1048576).toFixed(1);
console.log(`the deploy: ${n} files · ${mib(total)} MiB`);
for (const [d, s] of [...byDir].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${mib(s).padStart(7)} MiB  ${d}`);
if (process.argv.includes('--json')) console.log(JSON.stringify({ files: n, bytes: total }));
