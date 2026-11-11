// HOLD'EM's look review (HE3): every preview state (tests/integration/holdem-preview.html) through shots.mjs --page, at the review sizes.
//   node tests/integration/holdem-shots.mjs "<browser>" [--out ./shots-holdem] [--sizes 390x844,402x874,430x932] [--only myturn,flop] [--tag r1]
//     [--skin casino,cabin,apartment]   (HE6: every state in each skin — &skin=<id> on the page, the skin in the shot's name)
// (E2E_BASE = the server: a plain `node scripts/serve.mjs 5190` is enough — the preview needs no emulators.)
import { spawnSync } from 'node:child_process';
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const browser = process.argv[2];
const out = arg('out', './shots-holdem'), sizes = arg('sizes', '390x844,402x874,430x932'), tag = arg('tag', 'he');
const skins = arg('skin', '') ? arg('skin').split(',') : [null];
const STATES = [
  ['waiting', 'state=waiting&n=6'], ['myturn-8', 'state=myturn&n=8'], ['myturn-2', 'state=myturn&n=2'], ['preflop-6', 'state=preflop&n=6'],
  ['flop-5', 'state=flop&n=5'], ['turn-4', 'state=turn&n=4'], ['river-3', 'state=river&n=3'], ['allin-6', 'state=allin&n=6'],
  ['showdown-4', 'state=showdown&n=4'], ['foldwin-5', 'state=foldwin&n=5'], ['away-6', 'state=away&n=6'], ['slider-8', 'state=slider&n=8'],
  ['cash-6', 'state=preflop&n=6&mode=cash'], ['cash-broke', 'state=away&n=5&mode=cash&broke=1'], ['classic-7', 'state=flop&n=7&deck=two'], ['final-8', 'state=final&n=8'],
  // HE4 (a third field = the wait after the page is ready: the staged states play their last step live — the shot lands on the moment)
  ['he4-headsup', 'state=headsup'], ['he4-raised-3', 'state=raised&n=3'], ['he4-raised-4', 'state=raised&n=4'], ['he4-split-4', 'state=split&n=4'],
  ['he4-sidepots-6', 'state=sidepots&n=6', 7300], ['he4-levelup-5', 'state=levelup&n=5', 1300], ['he4-ko-6', 'state=ko&n=6', 6600],
  ['he4-spectate-6', 'state=spectate&n=6'], ['he4-out-6', 'state=out&n=6', 6300], ['he4-leave-5', 'state=leave&n=5', 900],
  ['he4-ledger-8', 'state=ledger&n=8', 3200], ['he4-final-8', 'state=final&n=8', 3200],
  // HE5 — LEAVE IS ALWAYS THERE (CASH) · an SE-height phone (no notch: the safe areas 20 / 0)
  ['he5-leaveafter-5', 'state=leaveafter&n=5'], ['he5-leavequeued-5', 'state=leavequeued&n=5'],
  ['he5-se-myturn-8', 'state=myturn&n=8&st=20&sb=0'], ['he5-se-allin-6', 'state=allin&n=6&st=20&sb=0'], ['he5-se-flop-5', 'state=flop&n=5&st=20&sb=0'],
  // HE6 — THE REAL CARDS' proof (your number / face / ace cards, the board flop + river, an 8-player showdown)
  ['he6-hand-num', 'state=myturn&n=4&hand=9h7h'], ['he6-hand-face', 'state=myturn&n=4&hand=KsQd'], ['he6-hand-ace', 'state=myturn&n=4&hand=AsJc'],
  ['he6-showdown-8', 'state=showdown&n=8'],
];
const only = arg('only', '') ? arg('only').split(',') : null;
// (HE7: an SE size — 667 or 375 wide, or 375 / 320 tall on its side — has no notch: its own safe areas, one size a run)
const seSize = s => /^(667x|375x)/.test(s);
const groups = [sizes.split(',').filter(s => !seSize(s)).join(','), ...sizes.split(',').filter(seSize)].filter(Boolean);
for (const skin of skins) for (const [name, qs, wait] of STATES) for (const sz of groups) {
  if (only && !only.some(o => name.startsWith(o))) continue;
  const se = seSize(sz) && !/[?&]st=/.test(qs) && sz.startsWith('375x') ? '&st=20&sb=0' : '';   // (the SE on its side: the preview's own default)
  const page = `tests/integration/holdem-preview.html?${qs}${skin ? `&skin=${skin}` : ''}${se}`, nm = `${tag}${skin ? `-${skin}` : ''}-${name}`;
  const r = spawnSync(process.execPath, ['tests/integration/shots.mjs', browser, '--page', page, '--sizes', sz, '--name', nm, '--out', out, ...(wait ? ['--wait', String(wait)] : [])], { stdio: 'inherit', env: process.env });
  if (r.status) process.exitCode = r.status;
}
