// THE CARD LAB → the next pass: reads the owner's marks from the live site (GET /api/admin?lab=export — ids + marks + notes, no names)
// and writes docs/vault-lab-marks.md, which the next VAULT prompt reads FIRST (THE VAULT 1B builds the full cards + the rest from it).
//   node scripts/lab-export.mjs [https://www.neonspeakeasy.com]
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LAB } from '../js/vault/catalog.js';

const base = (process.argv[2] || 'https://www.neonspeakeasy.com').replace(/\/$/, '');
const r = await fetch(`${base}/api/admin?lab=export`, { cache: 'no-store' });
if (!r.ok) { console.error(`the export answered ${r.status}`); process.exit(1); }
const { marks = {}, at } = await r.json();
const when = t => (t ? new Date(t).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '—');
const lines = [
  '# THE CARD LAB — the owner\'s marks (read this FIRST in the next VAULT pass)',
  '',
  `Exported ${when(at)} from ${base} by scripts/lab-export.mjs. APPROVE = ships as it is (the full card follows its strip) · FIX = rework it to the note · CUT = drop it. Unmarked = not looked at yet.`,
  '',
  '| # | item | tier | mark | note | when |',
  '| --- | --- | --- | --- | --- | --- |',
  ...LAB.map(x => { const m = marks[x.id] || {}; return `| ${x.n} | ${x.name} (\`${x.id}\`) | ${x.tier} | ${m.m ? m.m.toUpperCase() : '—'} | ${(m.note || '').replace(/\|/g, '/').replace(/\n/g, ' ')} | ${when(m.at)} |`; }),
  '',
];
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'vault-lab-marks.md');
writeFileSync(out, lines.join('\n'));
console.log(`${Object.keys(marks).length} marks → ${out}`);
