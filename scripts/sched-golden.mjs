// SCHED — writes / checks THE GOLDEN TABLE (tests/fixtures/sched-golden.mjs): what every timed planner decides over a year, hashed per
// system per month, for 2 time zones × 2 seeds.  node scripts/sched-golden.mjs            → compares with tests/fixtures/sched-golden.json
//                                                  node scripts/sched-golden.mjs --write    → (re)writes it — ONLY before a move or at the
//                                                  start of a pass that changes the schedule ON PURPOSE (say so in the commit)
//                                                  node scripts/sched-golden.mjs --raw <system> [days] → that system's raw values (Detroit, seed 1924)
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { goldenTable, goldenRaw } from '../tests/fixtures/sched-golden.mjs';
const FILE = new URL('../tests/fixtures/sched-golden.json', import.meta.url);
const a = process.argv.slice(2);
if (a[0] === '--raw') { for (const r of goldenRaw(a[1], 0, 1924, +(a[2] || 60))) console.log(r); process.exit(0); }
const t0 = Date.now(), T = goldenTable();
if (a[0] === '--write') { writeFileSync(FILE, JSON.stringify(T, null, 1) + '\n'); console.log(`wrote ${Object.keys(T).length} systems in ${Date.now() - t0} ms`); process.exit(0); }
if (!existsSync(FILE)) { console.log('no golden table yet — --write first'); process.exit(1); }
const G = JSON.parse(readFileSync(FILE, 'utf8')); let bad = 0;
for (const id of new Set([...Object.keys(G), ...Object.keys(T)])) for (const mk of new Set([...Object.keys(G[id] || {}), ...Object.keys(T[id] || {})])) if ((G[id] || {})[mk] !== (T[id] || {})[mk]) { bad++; if (bad < 40) console.log(`DIFF ${id} ${mk}`); }
console.log(bad ? `${bad} month(s) differ` : `the golden table matches (${Object.keys(T).length} systems, ${Date.now() - t0} ms)`); process.exit(bad ? 1 : 0);
