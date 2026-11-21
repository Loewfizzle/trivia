// CITY PART 1 — A STALLED CHROMEBOOK KEEPS WRITING AS HOST (/admin Nov 20 9:37–9:45 am: a 7-minute stall, then a burst of RULES REFUSED +
// "ROOM STAMP REFUSED — re-publish"). The reproduction: three phones in an OVERCLOCK match; the HOST's page STALLS — its JavaScript paused
// (CDP Debugger.pause: no timer, no socket handler runs) and its line cut — for longer than the host-beat's stale mark (10 s); another phone
// claims the room and directs on; the old host WAKES (resumed, back online) with a mirror as old as the stall. It must NOT write as the host
// (THE WAKE HOLD — host.js#hostWriteOk: a fresh read first), must FOLLOW the new host, and its alarm list (firebase.js#refusals — what
// /admin's RULES REFUSED rows come from) must stay EMPTY; the match goes on under the new host. CPU 4× on every phone (the harness).
//   node tests/integration/e2e-stall-host.mjs "<chromium>"      (the emulators + scripts/serve.mjs --emu)
import { createHarness } from './kit/harness.mjs';

const H = await createHarness({ name: 'stall-host', slot: 'sh', sizes: [[390, 844]] });
const { ok, log, sleep, waitFor, evalIn, pages } = H;
const STALL_MS = Number(process.env.STALL_MS || 16000);

await H.run(async () => {
  await H.joinAll(3);
  const [A, B, C] = pages;
  await H.startGame(A, 'overclock', { mode: 'quick' });
  for (const p of pages) await waitFor(p, s => s.game && s.game.id === 'overclock' && s.meta.status === 'playing', 'the match on every phone', 40000);
  await sleep(2500);
  const uidA = await evalIn(A, s => s.uid), m0 = await evalIn(A, s => s.game.matchId);
  ok(await evalIn(A, s => s.meta.hostId === s.uid), 'ALICE hosts the match');
  // THE STALL: no JavaScript runs on ALICE's page + her line is cut
  const cdp = await A.target().createCDPSession();
  await cdp.send('Debugger.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await cdp.send('Debugger.pause');
  log(`ALICE stalled for ${STALL_MS / 1000} s`);
  const newHost = await B.waitForFunction(u => { const s = window.__arcade.state; return s.meta && s.meta.hostId && s.meta.hostId !== u ? s.meta.hostId : null; }, { timeout: STALL_MS + 30000, polling: 250 }, uidA).then(h => h.jsonValue(), () => null);
  ok(!!newHost, `another phone claimed the room while ALICE stalled (${newHost ? 'the new host claimed' : 'nobody claimed'})`);
  const ph0 = await evalIn(B, s => `${s.game.phase}|${s.game.ci}`);
  await sleep(Math.max(0, STALL_MS - 12000));
  // THE WAKE: resumed + back online — her mirror still says "you are the host"
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await cdp.send('Debugger.resume');
  log('ALICE woke');
  await sleep(1200);
  const w = await A.evaluate(() => import('/js/host.js').then(h => ({ held: h.wakeState(), woke: h.justWoke() })));
  ok(w.woke, `ALICE's host loop knows it just woke (${w.held ? `held: ${w.held.why}` : 'the hold already answered'})`);
  ok(await waitFor(A, (s, u) => s.meta && s.meta.hostId === u, 'ALICE follows the new host (her mirror catches up)', 30000, newHost).then(() => true, () => false), 'ALICE FOLLOWS the new host — never claims it back over a live host');
  await sleep(6000);   // (HOST_SETTLE_MS + room for any late refusal to be judged)
  const ref = await A.evaluate(() => import('/js/firebase.js').then(m => ({ alarm: m.refusals(), quiet: m.hostRefusals() })));
  const q = await A.evaluate(() => import('/js/errlog.js').then(m => m.quietCounts()));
  ok(ref.alarm.length === 0, `0 RULES REFUSED rows from the woken phone (the alarm list: ${JSON.stringify(ref.alarm)}; quiet: ${JSON.stringify(ref.quiet)}; not-host ${q['not-host'] || 0} · gone ${q.gone || 0})`);
  // the match went on under the new host — the same match, a later step
  const ph1 = await evalIn(B, s => `${s.game.phase}|${s.game.ci}`);
  ok(await evalIn(B, (s, m) => s.game && s.game.matchId === m, m0) && ph1 !== ph0, `the match went ON under the new host (${ph0} → ${ph1})`);
  ok(await evalIn(A, (s, m) => s.game && s.game.matchId === m && !!s.players[s.uid], m0), 'ALICE is still in the room, on the same match');
  ok(await evalIn(C, (s, h) => s.meta.hostId === h, newHost), 'CHARLIE agrees on the host');
});
