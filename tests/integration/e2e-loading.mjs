// What a phone downloads, and what it reports back (docs/testing.md):
//   · the title links only the sheets every screen needs — no game's own stylesheet, no match kit;
//   · starting a game loads css/kit.css + css/<game>.css, at their old place in the cascade, before its screen mounts;
//   · the lobby warms a game's sheets when the host opens its options;
//   · an error on a phone reaches /api/log and lands in errlog/ (grouped), noise doesn't, nothing is sent twice.
//   node e2e-loading.mjs "<browser>" [./shots-loading]          (local server with --emu + the emulators)
import { createHarness } from './kit/harness.mjs';

const H = await createHarness({ name: 'loading', slot: 'ld', sizes: [[390, 844]] });
const { ok, log, sleep, waitFor, openPlayer, finish } = H;
const DB = `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST || '127.0.0.1:9000'}`;
const dbGet = async path => (await fetch(`${DB}/${path}.json?ns=demo-arcade-default-rtdb`, { headers: { Authorization: 'Bearer owner' } })).json();
const dbPut = (path, v) => fetch(`${DB}/${path}.json?ns=demo-arcade-default-rtdb`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
const sheets = p => p.evaluate(() => [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => (/\/css\/([\w-]+)\.css/.exec(l.href) || [])[1]).filter(Boolean));
const GAME_SHEETS = ['cipher', 'signal', 'overclock', 'bluff', 'pulse', 'golf', 'agent', 'kit', 'prism', 'slip', 'gridlock', 'stakes', 'rum'];
const ORDER = ['base', 'components', 'screens', 'title', 'cipher', 'signal', 'overclock', 'bluff', 'pulse', 'golf', 'agent', 'kit', 'prism', 'slip', 'gridlock', 'chat', 'board', 'card', 'stakes', 'rum'];
const inOrder = list => list.every((s, i) => i === 0 || ORDER.indexOf(list[i - 1]) <= ORDER.indexOf(s));
// A throw from a same-origin script file (errlog-throw.js), like a bug in our own code. Code that page.evaluate
// injects counts as "not ours" — rightly — so it can't stand in for a real error.
const OWN_THROW = () => {
  const s = document.createElement('script');
  s.src = '/tests/integration/errlog-throw.js';
  return new Promise(r => { s.onload = r; document.head.append(s); });
};

try {
  await dbPut('errlog', null);
  await dbPut('rl', null);

  // ---- 1. the title: no game sheets
  const T = await openPlayer(0);
  await T.waitForSelector('.nd-host', { timeout: 20000 });
  await T.evaluate(OWN_THROW);
  let s = await sheets(T);
  ok(!s.some(x => GAME_SHEETS.includes(x)), `TITLE: no game stylesheets (${s.join(', ')})`);
  ok(['base', 'components', 'screens', 'title', 'chat', 'board', 'card'].every(x => s.includes(x)), 'TITLE: the shared sheets are there');

  // ---- 2. errors from phones
  await T.evaluate(() => {
    window.__ownThrow();
    Promise.reject(Object.assign(new Error('The request is not allowed'), { name: 'NotAllowedError' }));   // noise
    Promise.reject(new TypeError('Failed to fetch'));                                                          // noise
    window.__ownThrow();                                                                                     // a repeat
  });
  await sleep(300);
  const pending = await T.evaluate(() => window.__errlog.pending());
  ok(pending.length === 1 && pending[0].w === 'title' && /e2e: a code error/.test(pending[0].m), `ERRLOG: one report queued, noise and the repeat skipped (${pending.map(p => p.m).join(' | ')})`);
  let entries = null;
  for (let i = 0; i < 20 && !entries; i++) { await sleep(500); const v = await dbGet('errlog'); if (v) entries = Object.values(v); }
  ok(entries && entries.length === 1 && entries[0].n === 1, `ERRLOG: it reached errlog/ (${entries ? entries.map(e => `${e.m} ×${e.n} @ ${e.w}`).join(' | ') : 'nothing'})`);
  ok(entries && entries[0].s === 'tests/integration/errlog-throw.js' && entries[0].l === 2, `ERRLOG: the file and line, as a short path in our code (${entries && `${entries[0].s}:${entries[0].l}`})`);
  // a second phone hitting the same error → the same entry, n = 2
  const T2 = await openPlayer(1);
  await T2.waitForSelector('.nd-host', { timeout: 20000 });
  await T2.evaluate(OWN_THROW);
  await T2.evaluate(() => { window.__ownThrow(); });
  await T2.evaluate(() => new Promise(r => setTimeout(r, 2200)));
  let n2 = 0;
  for (let i = 0; i < 12 && n2 < 2; i++) { await sleep(500); const v = await dbGet('errlog'); n2 = v ? Math.max(...Object.values(v).map(e => e.n)) : 0; }
  ok(n2 === 2, `ERRLOG: the same error from a second phone is counted on the same entry (n = ${n2})`);
  await T2.close();
  await T.close();
  await dbPut('errlog', null);

  // ---- 3. a room: the lobby stays light; the picked game's sheets load with it, in cascade order
  const host = await H.createRoom();
  const g1 = await H.join(1);
  s = await sheets(host);
  ok(!s.some(x => GAME_SHEETS.includes(x)), 'LOBBY: still no game stylesheets');
  await host.evaluate(() => [...document.querySelectorAll('.game-card')].find(c => /OVERCLOCK/i.test(c.textContent))?.click());
  await waitFor(host, () => [...document.querySelectorAll('link[rel="stylesheet"]')].some(l => /overclock\.css/.test(l.href) && l.sheet), 'options warm the sheets', 8000).catch(() => {});
  s = await sheets(host);
  ok(s.includes('overclock') && s.includes('kit'), 'LOBBY: opening a game\'s options warms its sheets');
  await host.keyboard.press('Escape');

  for (const [id, settings] of [['cipher', { rounds: 3 }], ['stakes', {}], ['golf', { mode: 'quick3' }]]) {
    await H.startGame(host, id, settings);
    await waitFor(g1, (st, gid) => st.game && st.game.id === gid, `${id} started`, 20000, id);
    // the screen mounts only once its sheet applies: the first painted frame is already styled
    await waitFor(g1, (st, gid) => document.querySelector('.screen.screen-in') && [...document.querySelectorAll('link[rel="stylesheet"]')].some(l => l.href.endsWith(`/css/${gid}.css`) && l.sheet), `${id} styled`, 20000, id);
    const gs = await sheets(g1);
    ok(gs.includes(id) && gs.includes('kit'), `GAME ${id}: its sheet and the kit's loaded`);
    ok(inOrder(gs), `GAME ${id}: in the old cascade order (${gs.join(' ')})`);
    const kids = await g1.evaluate(() => document.querySelector('.screen.screen-in')?.children.length || 0);
    ok(kids > 0, `GAME ${id}: its screen mounted`);
    await H.shot(g1, `game-${id}`).catch(() => {});
    await H.backToLobby(host);
    await sleep(800);
  }
  const lob = await sheets(g1);
  ok(inOrder(lob) && new Set(lob).size === lob.length, 'AFTER: no duplicate links, order intact');
  await H.shot(host, 'lobby').catch(() => {});
} catch (e) {
  log('FAILED', e.message);
  H.errors.push(e.message);
}
// the errors thrown on purpose above are not failures
for (let i = H.errors.length - 1; i >= 0; i--) if (/e2e: a code error|not allowed|Failed to fetch/i.test(H.errors[i])) H.errors.splice(i, 1);
await finish();
