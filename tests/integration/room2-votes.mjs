// LOBBY 2.0 B — THE REMATCH VOTE, TIDIED (the owner, Nov 4 9:25 am): a full room (8 — the host + 7 guests) after a match, 1 · 4 · 7 votes, at
// 390 / 402 / 430 — the host's phone (the dots row + the pill) and a guest's (✓ VOTED). Screenshots only (the checks live in `afterparty`).
// `node tests/integration/room2-votes.mjs "<browser>" ./shots-votes` — on the emulators + serve.mjs --emu.
import { ev, waitFor, harborUp, sleep, log, OUT } from './harbor-e2e/kit.mjs';
import { hostRoom, joinRoom, fakeGuests, settledRoom, startOC, onTitle, dbPatch, podium } from './harbor-e2e/lobby2.mjs';

for (const [w, hh] of [[390, 844], [402, 874], [430, 932]]) {
  const { Q: A, p, code, me } = await hostRoom(`vh${w}`, [w, hh], { dpr: 3 });
  const { Q: B, p: q, me: meB } = await joinRoom(`vg${w}`, code, [w, hh]);
  const fakes = await fakeGuests(code, 6);
  await settledRoom(p, 8, 50000).catch(() => {});
  await startOC(p);
  await waitFor(p, `!(${onTitle})`, 'the game', 8000);
  await podium(p, code, [me]);
  await sleep(600);
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(p, onTitle, 'back', 12000); await harborUp(p);
  await waitFor(p, "document.querySelector('.rdk-play').classList.contains('rdk-rm')", 'REMATCH', 40000).catch(() => {});
  await waitFor(q, "document.querySelector('.rdk-play').classList.contains('rdk-rm')", 'REMATCH (guest)', 20000).catch(() => {});
  const m = await ev(p, 'window.__arcade.state.meta.back.m');
  const voters = [meB, ...fakes];
  for (const n of [1, 4, 7]) {
    await dbPatch(`rooms/${code}`, { rv: Object.fromEntries(voters.slice(0, n).map(u => [u, m])) });
    await waitFor(p, `document.querySelectorAll('.rdk-pip.is-on').length === ${n}`, `${n} lit`, 8000).catch(() => {});
    await sleep(500);
    await p.screenshot({ path: `${OUT}votes-${w}-${n}-host.png` });
    if (n === 4) await q.screenshot({ path: `${OUT}votes-${w}-${n}-guest.png` });
  }
  log('votes', w, 'done');
  await A.ctx.close(); await B.ctx.close();
}
process.exit(0);
