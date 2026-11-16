// A quick look at an ARCADE match under bots: prints the phase every few seconds so a stall shows where it sits.
//   node gl-arcade-probe.mjs "<browser>" ./shots-probe   (env N=2, SECS=150, MODE=arcade)
import { createHarness, PHONE_SIZES } from './kit/harness.mjs';

const H = await createHarness({ name: 'glprobe', slot: 'q', hook: '__gridlock', sizes: PHONE_SIZES });
const { pages, log, sleep, evalIn, waitFor, G, alive, hostIdx } = H;
const N = Number(process.env.N || 2), SECS = Number(process.env.SECS || 150), MODE = process.env.MODE || 'arcade';
let fatal = null;
try {
  const host = await H.joinAll(N);
  await H.startGame(host, 'gridlock', { mode: MODE, placeSec: 45, turnSec: 15 });
  await waitFor(host, s => s.game && s.game.phase === 'place', 'placement');
  await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__gridlock && window.__gridlock.fleet(), { timeout: 20000 })));
  for (const i of alive()) await G(pages[i], 'window.__gridlock.autoPlace(); window.__gridlock.setReady(); window.__gridlock.bot({ delay: 200, seed: ' + (i + 40) + ' })');
  const t0 = Date.now();
  let last = '';
  while (Date.now() - t0 < SECS * 1000) {
    await sleep(2500);
    const hi = await hostIdx();
    const snap = await evalIn(pages[hi], s => ({ ph: s.game.phase, round: s.game.round, rk: s.game.rk, shots: Object.keys((s.live && s.live.shots) || {}).length, res: Object.keys((s.live && s.live.res) || {}).length, acts: s.game.acts && Object.fromEntries(Object.entries(s.game.acts).map(([u, a]) => [u.slice(0, 4), a.a])), fire: s.game.fire && Object.fromEntries(Object.entries(s.game.fire).map(([u, l]) => [u.slice(0, 4), l.length])), out: Object.keys(s.game.out || {}).length, hands: s.game.hand && Object.fromEntries(Object.entries(s.game.hand).map(([u, h]) => [u.slice(0, 4), h.join('/')])) }));
    const plans = [];
    for (const i of alive()) plans.push(await pages[i].evaluate(() => { const p = window.__gridlock.plan(); return p && { a: p.a, n: p.shots.length, act: !!p.act, reloc: !!p.reloc }; }));
    const line = JSON.stringify({ ...snap, plans });
    if (line !== last) { log(line); last = line; }
    if (snap.ph === 'final') { log('FINAL at', Math.round((Date.now() - t0) / 1000), 's'); break; }
  }
} catch (e) { fatal = e; }
await H.finish(fatal);
