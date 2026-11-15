// CITY D — 7, SCORES SHOWS INSTANTLY (the owner: DAILIES → SCORES took ~5 s on the morning's first open). Where the server's half goes:
// /api/daily `every` (+ `today` + `points`, what SCORES asks) timed COLD (a fresh process: the module + firebase-admin + the first database
// trips) and WARM (the same process again), by the handler's own marks (api/_lib/timing.js — the Server-Timing header's numbers).
//   node tests/integration/scores-timing.mjs     (the emulators)   RTT_MS=40 = every database read waits 40 ms first (the serial trips show)
//   (spawns itself once per cold sample: --child)
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ME = fileURLToPath(import.meta.url);
const env = { ...process.env, FIREBASE_DATABASE_EMULATOR_HOST: process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000', GCLOUD_PROJECT: 'demo-arcade', FIREBASE_DATABASE_URL: 'http://127.0.0.1:9000?ns=demo-arcade-default-rtdb', DAILY_TEST: '1' };
if (process.argv.includes('--child')) {
  const t0 = performance.now();
  const { dailyAction } = await import('../../api/daily.js');
  const { ref } = await import('../../api/_lib/fb.js');
  const { timing } = await import('../../api/_lib/timing.js');
  const tImport = performance.now() - t0;
  // (RTT_MS: every database READ waits that long first — a stand-in for the function ↔ Firebase round trip the emulator doesn't have: the
  //  number of SERIAL trips is then what the timing shows)
  const RTT = Number(process.env.RTT_MS || 0);
  if (RTT) { const P = Object.getPrototypeOf(ref('x')), once = P.once; P.once = async function (...a) { await new Promise(r => setTimeout(r, RTT)); return once.apply(this, a); }; }
  const uid = 'u-scores-timing', pid = 'pscorestimng';
  await ref().update({ [`uids/${uid}`]: pid, [`profiles/${pid}`]: { n: 'TIMER', x: 900, a: 'bolt', c: 'cyan', at: Date.now() - 864e6 }, [`ppriv/${pid}/at`]: Date.now() - 864e6, 'progress/dailies': { on: true, at: Date.now() - 864e6 } });
  const tSetup = performance.now();
  const call = async action => { const T = timing(); const a = performance.now(); await dailyAction(uid, { action }, Date.now(), T); return { ms: Math.round(performance.now() - a), st: T.header() }; };
  const out = { import: Math.round(tImport), every1: await call('every'), every2: await call('every'), today: await call('today'), today2: await call('today') };
  void tSetup;
  console.log(JSON.stringify(out));
  process.exit(0);
}
const rows = [];
for (let i = 0; i < 3; i++) {
  const r = spawnSync(process.execPath, [ME, '--child'], { env, encoding: 'utf8' });
  const line = (r.stdout || '').trim().split('\n').pop();
  try { rows.push(JSON.parse(line)); } catch { console.log('child failed', r.stderr.slice(0, 400)); }
}
for (const r of rows) console.log(`cold process: import ${r.import} ms · every (first) ${r.every1.ms} ms [${r.every1.st}] · every (warm) ${r.every2.ms} ms · today ${r.today.ms} ms · today (warm) ${r.today2.ms} ms`);
const avg = k => Math.round(rows.reduce((a, r) => a + (k(r) || 0), 0) / Math.max(1, rows.length));
console.log(`AVERAGE${process.env.RTT_MS ? ` (a ${process.env.RTT_MS}-ms database trip)` : ''} — import ${avg(r => r.import)} ms · every COLD ${avg(r => r.every1.ms)} ms · every WARM ${avg(r => r.every2.ms)} ms · today ${avg(r => r.today.ms)} ms · today WARM ${avg(r => r.today2.ms)} ms`);
