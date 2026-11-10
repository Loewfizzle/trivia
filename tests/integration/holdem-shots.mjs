// HOLD'EM's look review (HE3): every preview state (tests/integration/holdem-preview.html) through shots.mjs --page, at the review sizes.
//   node tests/integration/holdem-shots.mjs "<browser>" [--out ./shots-holdem] [--sizes 390x844,402x874,430x932] [--only myturn,flop] [--tag r1]
// (E2E_BASE = the server: a plain `node scripts/serve.mjs 5190` is enough — the preview needs no emulators.)
import { spawnSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const browser = process.argv[2];
const out = arg('out', './shots-holdem'), sizes = arg('sizes', '390x844,402x874,430x932'), tag = arg('tag', 'he');
const STATES = [
  ['waiting', 'state=waiting&n=6'], ['myturn-8', 'state=myturn&n=8'], ['myturn-2', 'state=myturn&n=2'], ['preflop-6', 'state=preflop&n=6'],
  ['flop-5', 'state=flop&n=5'], ['turn-4', 'state=turn&n=4'], ['river-3', 'state=river&n=3'], ['allin-6', 'state=allin&n=6'],
  ['showdown-4', 'state=showdown&n=4'], ['foldwin-5', 'state=foldwin&n=5'], ['away-6', 'state=away&n=6'], ['slider-8', 'state=slider&n=8'],
  ['cash-6', 'state=preflop&n=6&mode=cash'], ['cash-broke', 'state=away&n=5&mode=cash&broke=1'], ['classic-7', 'state=flop&n=7&deck=two'], ['final-8', 'state=final&n=8'],
];
const only = arg('only', '') ? arg('only').split(',') : null;
for (const [name, qs] of STATES) {
  if (only && !only.some(o => name.startsWith(o))) continue;
  const r = spawnSync(process.execPath, ['tests/integration/shots.mjs', browser, '--page', `tests/integration/holdem-preview.html?${qs}`, '--sizes', sizes, '--name', `${tag}-${name}`, '--out', out], { stdio: 'inherit', env: process.env });
  if (r.status) process.exitCode = r.status;
}
