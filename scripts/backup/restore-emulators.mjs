// CITY E — THE NIGHTLY BACKUP's RESTORE, step 1: a backup folder → the EMULATORS ONLY (docs/backup.md). It checks every part against the folder's
// checksums.sha256 first (a mismatch → nothing written), then writes each durable node back whole (its slices merged). The LIVE database is
// never restored by a script — that is the owner's Firebase-console Import, node by node, after this check on the emulators.
//   (the emulators up: cd tests/integration && npm run emulators)   node scripts/backup/restore-emulators.mjs "C:\Users\benja\NeonBackups\2026-11-15"
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/backup/restore-emulators.mjs <backup folder>'); process.exit(2); }
if (!/^(127\.0\.0\.1|localhost):\d+$/.test(process.env.FIREBASE_DATABASE_EMULATOR_HOST)) { console.error('the EMULATORS only'); process.exit(2); }
const sums = Object.fromEntries(readFileSync(join(dir, 'checksums.sha256'), 'utf8').trim().split(/\r?\n/).map(l => { const [h, ...n] = l.trim().split(/\s+/); return [n.join(' '), h]; }));
const parts = {};
for (const f of readdirSync(dir).filter(f => f.endsWith('.json.gz'))) {
  const buf = readFileSync(join(dir, f)), h = createHash('sha256').update(buf).digest('hex');
  if (sums[f] !== h) { console.error(`CHECKSUM MISMATCH: ${f} — nothing restored`); process.exit(1); }
  parts[f.replace(/\.json\.gz$/, '')] = buf;
}
const missing = Object.keys(sums).filter(f => !parts[f.replace(/\.json\.gz$/, '')]);
if (missing.length) { console.error(`MISSING PARTS: ${missing.join(', ')} — nothing restored`); process.exit(1); }
// --json <out folder>: no database at all — the checked parts written as ONE plain <node>.json per node (a split node's slices merged): the files
// the owner imports in the Firebase console, node by node (docs/backup.md "Restore")
const ji = process.argv.indexOf('--json');
if (ji > 0) {
  const { mkdirSync, writeFileSync } = await import('node:fs');
  const { unpackPart } = await import('../../api/_lib/backup.js');
  const out = process.argv[ji + 1]; mkdirSync(out, { recursive: true });
  const nodes = {};
  for (const [name, buf] of Object.entries(parts)) { const [node] = name.split('@'); const v = unpackPart(buf); nodes[node] = name.includes('@') ? { ...(nodes[node] || {}), ...(v || {}) } : v; }
  for (const [node, v] of Object.entries(nodes)) writeFileSync(join(out, `${node}.json`), JSON.stringify(v));
  console.log(`${Object.keys(nodes).length} node files (every checksum OK) -> ${out} — import each at its node in the Firebase console`);
  process.exit(0);
}
const { restoreToEmulators } = await import('../../api/_lib/backup.js');
const nodes = await restoreToEmulators(parts);
console.log(`restored to the emulators: ${nodes.length} nodes (${Object.keys(parts).length} parts, every checksum OK) — ${nodes.join(' ')}`);
process.exit(0);
