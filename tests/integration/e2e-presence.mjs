// PRESENCE + THE HOST end to end (APP FIXES — Grok 4.4 / 4.5 / 5.1: "I refreshed and the game skipped me").
//   node tests/integration/e2e-presence.mjs "<browser path>" ./shots-presence        (emulators + scripts/serve.mjs --emu)
// Three phones play OVERCLOCK (its director never waits for an offline player; WINDOWS, Nov 1: was LAST SIGNAL — only PRISM DROP +
// OVERCLOCK are playable now):
//   1. THE LOBBY CHAT STRIP: a phone whose lazy chat strip arrives after the lobby has gone (the game started) leaks no strip.
//   2. A GUEST REFRESHES mid-challenge + the OLD page's onDisconnect lands late (online:false, an old lastSeen): the room still
//      sees them online (one child per connection), the challenge waits for them once the other two are done — NOT skipped.
//   3. THE SELF-HEAL: the presence node is wiped to "offline" (the old shape, no connection child) — the phone writes itself
//      back within a few seconds.
//   4. THE HOST REFRESHES mid-challenge + the same late onDisconnect: nobody claims the host while its heartbeat is fresh
//      (client + rules) — the host is NOT deposed.
import { createHarness } from './kit/harness.mjs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, set, update } from 'firebase/database';

const H = await createHarness({ name: 'presence', slot: 'pr', sizes: [[390, 844]] });
const env = await initializeTestEnvironment({ projectId: 'demo-arcade', database: { host: '127.0.0.1', port: 9000 } });
const admin = async fn => { let out; await env.withSecurityRulesDisabled(async ctx => { out = await fn(ctx.database('http://127.0.0.1:9000?ns=demo-arcade-default-rtdb')); }); return out; };
const { log, ok, sleep, evalIn, waitFor, pages, uids } = H;

// the late onDisconnect of a page that is already gone: what the old socket's queued op writes when it finally lands
const lateDisconnect = uid => admin(db => update(ref(db, `rooms/${H.code}/presence/${uid}`), { online: false, lastSeen: Date.now() - 60_000 }));
const onlineOn = (page, uid) => evalIn(page, (s, u) => !!(s.presence[u] && s.presence[u].online), uid);
const phase = page => evalIn(page, s => s.game && s.game.phase);

// a player's challenge filed as done (the room's public flag, written as the admin — what the phone's own write leaves there)
const fileDone = (i, g) => admin(db => set(ref(db, `rooms/${H.code}/oc/${g.matchId}/${g.ck}/${uids[i]}`), { p: 1, ok: 1, n: 1, done: true, at: Date.now() }));
const gameNow = page => evalIn(page, s => s.game && { phase: s.game.phase, ci: s.game.ci, ck: s.game.ck, matchId: s.game.matchId });
async function nextPlay(host, prev) {
  await waitFor(host, (s, p) => s.game && ((s.game.phase === 'play' && s.game.ci > p) || s.game.phase === 'final'), 'the next challenge', 90000, prev);
  return evalIn(host, s => s.game.ci);
}
async function backInRoom(i) {
  await waitFor(pages[i], s => s.code && s.game && s.game.id === 'overclock', `${H.NAMES[i]} back in the game`, 30000);
  await waitFor(pages[i], s => s.connected, `${H.NAMES[i]} connected`, 15000);
}

await H.run(async () => {
  // ---------------------------------------------------------------- 1. the lobby's chat strip arriving late
  const host = await H.createRoom();
  await H.join(1);
  // CHARLIE joins on a slow line: the chat UI module (the menu imports it at boot, the lobby's strip waits for it) is HELD
  // from the first paint until his lobby is gone
  const ctx = await H.browser.createBrowserContext();
  H.ctxs[2] = ctx;
  const p = await ctx.newPage();
  p.on('pageerror', e => { H.errors.push(`CHARLIE pageerror: ${e.message}`); });
  await p.setViewport(H.VIEW);
  let held = null;
  await p.setRequestInterception(true);
  p.on('request', r => { if (/\/js\/chat\/ui\.js/.test(r.url()) && !held) { held = r; return; } r.continue().catch(() => {}); });
  await p.goto(`${H.BASE}/?emu&slot=pr2&room=${H.code}`);
  pages[2] = p;
  await p.waitForSelector('.nd-go', { timeout: 20000 });
  await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
  await p.click('.nd-go');
  await p.waitForSelector('.input-code');
  await p.type('.setup-screen input.input:not(.input-code)', H.NAMES[2]);
  await p.click('.form-cta .btn-primary');
  await p.waitForSelector('.lobby-screen', { timeout: 20000 });
  uids[2] = await evalIn(p, s => s.uid);
  await waitFor(host, s => Object.keys(s.players).length === 3, '3 players');
  await waitFor(p, () => true, 'settle');
  ok(!!held, 'LOBBY STRIP: the chat strip\'s module is held while the lobby is up');
  const started = await H.startGame(host, 'overclock', { mode: 'quick' }).then(v => String(v), e => String(e && e.message || e));
  if (started !== 'true') log('presence', JSON.stringify(await admin(db => import('firebase/database').then(m => m.get(ref(db, `rooms/${H.code}/presence`))).then(x => x.val()))), JSON.stringify(await evalIn(host, s => s.presence)));
  if (started !== 'true') log('toasts', await host.evaluate(() => [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' / ')));
  log('startGame', started, JSON.stringify(await evalIn(host, s => s.game && s.game.phase)));
  // the lobby unmounts on the game's first state; release the module inside the screen's 380-ms fade-out
  await p.waitForFunction(() => window.__arcade.state.game, { polling: 'raf', timeout: 20000 });
  if (held) held.continue().catch(() => {});
  await p.setRequestInterception(false);
  await sleep(1500);
  const strips = await p.evaluate(() => globalThis.__chatStrips || 0);
  ok(strips === 0, `LOBBY STRIP: a lobby left before its chat strip loaded leaves no strip running (${strips} alive)`);

  // ---------------------------------------------------------------- 2. a guest refreshes mid-challenge
  let q = await nextPlay(host, -1);
  ok(q === 0, 'OVERCLOCK: the first challenge');
  pages[1].on('console', m => { if (/presence|heal/i.test(m.text())) log('BOB console', m.type(), m.text().slice(0, 200)); });
  log('BOB refreshes mid-challenge');
  await H.refresh(pages[1]);
  await backInRoom(1);
  await sleep(500);
  await lateDisconnect(uids[1]);
  await sleep(1500);
  ok(await onlineOn(host, uids[1]), "REFRESH: after the old page's late onDisconnect the host still sees BOB online");
  ok(await onlineOn(pages[2], uids[1]), 'REFRESH: …and so does CHARLIE');
  const g0 = await gameNow(host);
  if (g0.phase === 'play' && g0.ci === q) {
    await fileDone(0, g0); await fileDone(2, g0);
    await sleep(2500);
    const still = await evalIn(host, (s, prev) => s.game.phase === 'play' && s.game.ci === prev, q);
    ok(still, 'REFRESH: the challenge WAITS for BOB (not skipped as offline) after the other two are done');
    await fileDone(1, g0);
    await waitFor(host, (s, prev) => !(s.game.phase === 'play' && s.game.ci === prev), 'the challenge resolves once BOB is done', 20000, q);
    ok(true, "REFRESH: BOB's board closes the challenge");
  } else ok(false, `REFRESH: the challenge was still open after BOB came back (phase ${g0.phase}, ci ${g0.ci})`);

  // ---------------------------------------------------------------- 3. the self-heal
  await admin(db => set(ref(db, `rooms/${H.code}/presence/${uids[1]}`), { online: false, lastSeen: Date.now() - 60_000 }));
  await sleep(300);
  let healed = false;
  for (let k = 0; k < 40 && !healed; k++) { healed = await onlineOn(host, uids[1]); if (!healed) await sleep(250); }
  ok(healed, 'SELF-HEAL: a presence node wiped to "offline" while BOB is connected comes back online by itself');
  if (!healed) log('SELF-HEAL diag', JSON.stringify(await admin(db => import('firebase/database').then(m => m.get(ref(db, `rooms/${H.code}/presence/${uids[1]}`))).then(x => x.val()))), JSON.stringify(await evalIn(pages[1], s => ({ c: s.connected, net: s.net, code: s.code, p: s.presence }))));

  // ---------------------------------------------------------------- 4. the host refreshes mid-question
  q = await nextPlay(host, q);
  if ((await phase(host)) !== 'play') { ok(false, 'HOST REFRESH: a challenge to refresh in'); return; }
  const hostUid = uids[0];
  // the client side alone (the rules refuse a claim anyway): no phone may even TRY while the host's beat is fresh
  const claims = [];
  for (const i of [1, 2]) pages[i].on('console', m => { if (/claim host/.test(m.text())) claims.push(`${H.NAMES[i]}: ${m.text().slice(0, 120)}`); });
  log('ALICE (host) refreshes mid-challenge');
  await H.refresh(pages[0]);
  await backInRoom(0);
  await sleep(500);
  await lateDisconnect(hostUid);
  // the client's timeout is 10 s (+ 4 s a rank): watch 15 s
  let deposed = null;
  for (let k = 0; k < 30; k++) {
    const id = await evalIn(pages[1], s => s.meta && s.meta.hostId);
    if (id && id !== hostUid) { deposed = id; break; }
    await sleep(500);
  }
  if (process.env.DIAG) log('HOST diag', JSON.stringify(await evalIn(pages[2], (s, h) => ({ me: s.uid, conn: s.connected, dup: s.dupTab, meta: s.meta && { hostId: s.meta.hostId, status: s.meta.status, beat: s.meta.hostBeat }, now: window.__arcade.serverNow(), pres: s.presence }), hostUid)));
  ok(!deposed, `HOST REFRESH: the refreshed host is NOT deposed while its heartbeat is fresh (${deposed ? 'claimed by ' + H.nameOf(deposed) : 'still ALICE'})`);
  ok(!claims.length, `HOST REFRESH: no phone even tried to claim the host (${claims.join(' · ') || 'none'})`);
  ok(await onlineOn(pages[1], hostUid), 'HOST REFRESH: …and the room sees the host online');
  ok(await evalIn(pages[0], s => s.meta.hostId === s.uid), 'HOST REFRESH: ALICE\'s page runs the room again');
  await env.cleanup().catch(() => {});
});
