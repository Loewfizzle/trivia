// PRESENCE + THE HOST end to end (APP FIXES — Grok 4.4 / 4.5 / 5.1: "I refreshed and the game skipped me").
//   node tests/integration/e2e-presence.mjs "<browser path>" ./shots-presence        (emulators + scripts/serve.mjs --emu)
// Three phones play LAST SIGNAL (its director never waits for an offline player):
//   1. THE LOBBY CHAT STRIP: a phone whose lazy chat strip arrives after the lobby has gone (the game started) leaks no strip.
//   2. A GUEST REFRESHES mid-question + the OLD page's onDisconnect lands late (online:false, an old lastSeen): the room still
//      sees them online (one child per connection), the question waits for their answer — they are NOT skipped.
//   3. THE SELF-HEAL: the presence node is wiped to "offline" (the old shape, no connection child) — the phone writes itself
//      back within a few seconds.
//   4. THE HOST REFRESHES mid-question + the same late onDisconnect: nobody claims the host while its heartbeat is fresh
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

async function answer(i) {
  const page = pages[i];
  await page.waitForSelector('.ls-opt', { timeout: 15000 });
  await page.evaluate(() => { const b = document.querySelector('.ls-opt[data-i="0"]'); if (b) b.click(); });
}
async function pickTarget(i, target) {
  await pages[i].evaluate(u => { const c = document.querySelector(`.ls-card[data-uid="${u}"]`); if (c) c.click(); }, target);
}
async function nextQuestion(host, prev) {
  await waitFor(host, (s, p) => s.game && ((s.game.phase === 'question' && s.game.q > p) || s.game.phase === 'final'), 'the next question', 60000, prev);
  return evalIn(host, s => s.game.q);
}
async function backInRoom(i) {
  await waitFor(pages[i], s => s.code && s.game && s.game.id === 'signal', `${H.NAMES[i]} back in the game`, 30000);
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
  const started = await H.startGame(host, 'signal', {}).then(v => String(v), e => String(e && e.message || e));
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

  // ---------------------------------------------------------------- 2. a guest refreshes mid-question
  let q = await nextQuestion(host, -1);
  ok(q === 0, 'SIGNAL: the first question');
  // everyone targets the next player round the table (q 0 asks for it)
  for (let i = 0; i < 3; i++) await pickTarget(i, uids[(i + 1) % 3]);
  pages[1].on('console', m => { if (/presence|heal/i.test(m.text())) log('BOB console', m.type(), m.text().slice(0, 200)); });
  log('BOB refreshes mid-question');
  await H.refresh(pages[1]);
  await backInRoom(1);
  await sleep(500);
  await lateDisconnect(uids[1]);
  await sleep(1500);
  ok(await onlineOn(host, uids[1]), 'REFRESH: after the old page\'s late onDisconnect the host still sees BOB online');
  ok(await onlineOn(pages[2], uids[1]), 'REFRESH: …and so does CHARLIE');
  const qNow = await evalIn(host, s => s.game.q);
  if ((await phase(host)) === 'question' && qNow === q) {
    await answer(0); await answer(2);
    await sleep(2500);
    const still = await evalIn(host, (s, prev) => s.game.phase === 'question' && s.game.q === prev, q);
    ok(still, 'REFRESH: the question WAITS for BOB (not skipped as offline) after the other two answered');
    await pickTarget(1, uids[2]);
    await answer(1);
    await waitFor(host, (s, prev) => !(s.game.phase === 'question' && s.game.q === prev), 'the question resolves once BOB answers', 20000, q);
    ok(true, 'REFRESH: BOB\'s answer closes the question');
  } else ok(false, `REFRESH: the question was still open after BOB came back (phase ${await phase(host)}, q ${qNow})`);

  // ---------------------------------------------------------------- 3. the self-heal
  await admin(db => set(ref(db, `rooms/${H.code}/presence/${uids[1]}`), { online: false, lastSeen: Date.now() - 60_000 }));
  await sleep(300);
  let healed = false;
  for (let k = 0; k < 40 && !healed; k++) { healed = await onlineOn(host, uids[1]); if (!healed) await sleep(250); }
  ok(healed, 'SELF-HEAL: a presence node wiped to "offline" while BOB is connected comes back online by itself');
  if (!healed) log('SELF-HEAL diag', JSON.stringify(await admin(db => import('firebase/database').then(m => m.get(ref(db, `rooms/${H.code}/presence/${uids[1]}`))).then(x => x.val()))), JSON.stringify(await evalIn(pages[1], s => ({ c: s.connected, net: s.net, code: s.code, p: s.presence }))));

  // ---------------------------------------------------------------- 4. the host refreshes mid-question
  q = await nextQuestion(host, q);
  if ((await phase(host)) !== 'question') { ok(false, 'HOST REFRESH: a question to refresh in'); return; }
  const hostUid = uids[0];
  // the client side alone (the rules refuse a claim anyway): no phone may even TRY while the host's beat is fresh
  const claims = [];
  for (const i of [1, 2]) pages[i].on('console', m => { if (/claim host/.test(m.text())) claims.push(`${H.NAMES[i]}: ${m.text().slice(0, 120)}`); });
  log('ALICE (host) refreshes mid-question');
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
