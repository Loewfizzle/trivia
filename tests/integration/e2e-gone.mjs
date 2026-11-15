// CITY A — item 6, NO ROOM WRITES AFTER YOU'RE GONE (the owner's /admin: RULES REFUSED rows on meta/hostBeat, a chat line, presence — a phone
// that had already left / lost the host / seen its room close kept writing). BLACK-BOX: every write frame the phone's Firebase socket SENDS
// (put · merge · onDisconnect put / merge — CDP's WebSocket frames) and every `permission_denied` it gets back, read from the moment each case
// is over for THIS phone:
//   LEAVE        B leaves A's room (+ its socket drops and comes back — the presence re-arm) → B writes NOTHING under rooms/{CODE} or chats/{CODE}
//   LOST HOST    A hands the room to B (MAKE HOST) — and, the hard way, the host moved under A by the server → once A's state says so, no beat, no write
//   THE CLOSE    a SOLO PRISM DROP run to its podium → BACK TO THE CITY (the room closes) → nothing written into the closed room after its removal
//                (the SOLO PODIUM case: the win line, the chat, the presence) · and a two-phone room its host closes: the guest writes nothing
// + every case: 0 permission_denied after the moment, and /admin's errors (errlog) gain NO "RULES REFUSED" row (a late refusal = the quiet count)
//   node tests/integration/e2e-gone.mjs "<chromium>"        (the emulators + node scripts/serve.mjs --emu)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
import { guardUrl } from './kit/live-guard.mjs';
import { val } from '../../api/_lib/fb.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb';
const dbPut = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: JSON.stringify(v) });
const { default: puppeteer } = await import('./kit/puppeteer.mjs');
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const WRITE = new Set(['p', 'm', 'o', 'om']);
const rulesRows = async () => Object.values((await val('errlog')) || {}).filter(e => /RULES REFUSED/.test(e.m || '')).reduce((n, e) => n + (e.c || 1), 0);

async function phone(slot, qs = '') {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: s.toUpperCase(), color: 'cyan', avatar: 'bolt' })); } catch { /* fine */ } }, slot);
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  // every frame on the database socket: { t, dir, a, path, nul, denied }
  const frames = [], cdp = await p.target().createCDPSession();
  await cdp.send('Network.enable');
  const parse = (dir, s) => {
    let m; try { m = JSON.parse(s); } catch { return; }
    if (!m || m.t !== 'd' || !m.d) return;
    const d = m.d, b = d.b || {};
    if (dir === 'out' && d.a) frames.push({ t: Date.now(), dir, a: d.a, path: String(b.p || ''), nul: b.d === null || (b.d && typeof b.d === 'object' && Object.values(b.d).every(v => v === null)), r: d.r });
    if (dir === 'in' && b.s && b.s !== 'ok') frames.push({ t: Date.now(), dir, denied: b.s, r: d.r });
  };
  cdp.on('Network.webSocketFrameSent', e => parse('out', e.response.payloadData));
  cdp.on('Network.webSocketFrameReceived', e => parse('in', e.response.payloadData));
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&idle=1&when=2026-11-10T20:30${qs}`, 'e2e-gone.mjs'));
  const ev = js => p.evaluate(js);
  const waitFor = async (js, ms = 30000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* navigating */ } await sleep(100); } return false; };
  if (!await waitFor('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown && window.__arcade && window.__arcade.state.uid)', 45000)) throw new Error(`${slot}: the city never came up`);
  /** the writes + refusals since t, under the room's paths */
  const since = (t, code) => {
    const mine = frames.filter(f => f.t >= t);
    const under = f => f.path.includes(`/${code}`) && /^\/?(rooms|chats|fleets|glsonar|spy|hsbet|rrp|seal|hole|hush)\//.test(f.path);
    return { writes: mine.filter(f => f.dir === 'out' && WRITE.has(f.a) && under(f)), denied: mine.filter(f => f.dir === 'in' && f.denied) };
  };
  const offline = async on => { await cdp.send('Network.emulateNetworkConditions', { offline: on, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); };
  return { ctx, p, ev, waitFor, errs, frames, since, offline, close: () => ctx.close() };
}
const show = list => list.slice(0, 4).map(f => f.dir === 'out' ? `${f.a} ${f.path.replace(/\/[A-Z]{4}\b/, '/CODE').replace(/\/[A-Za-z0-9]{20,}/g, '/…')}` : f.denied).join(' | ') || 'none';
const host = async A => { await A.ev("document.querySelector('.nd-hostbtn') ? document.querySelector('.nd-hostbtn').click() : import('/js/room.js').then(m => m.createRoom && m.createRoom())"); if (!await A.waitFor('!!(window.__arcade.state.code && window.__district.room())', 20000)) throw new Error('HOST failed'); return A.ev('window.__arcade.state.code'); };
const join = async (code, slot) => { const B = await phone(slot, `&room=${code}`); await B.ev("(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); })()"); if (!await B.waitFor(`window.__arcade.state.code === '${code}' && !!(window.__arcade.state.players || {})[window.__arcade.state.uid]`, 30000)) throw new Error(`${slot}: the join failed`); return B; };

try {
  const rows0 = await rulesRows();
  // ---------------------------------------------------------------- 1. LEAVE (+ the socket drops and comes back: no re-arm)
  { const A = await phone('gna'), code = await host(A), B = await join(code, 'gnb');
    await A.waitFor('Object.keys(window.__arcade.state.players || {}).length === 2', 20000);
    await sleep(2500);   // (B's presence armed, a few beats)
    await B.ev("import('/js/room.js').then(m => m.leaveRoom())");
    await B.waitFor('!window.__arcade.state.code', 10000);
    const t0 = Date.now() + 300; await sleep(5500);
    await B.offline(true); await sleep(2500); await B.offline(false); await sleep(7000);
    const s = B.since(t0, code);
    ok(s.writes.length === 0 && s.denied.length === 0, `LEAVE: after B left (+ its socket dropped + came back, 15 s): ${s.writes.length} writes under the room (${show(s.writes)}), ${s.denied.length} refused (${show(s.denied)})`);
    // ---------------------------------------------------------------- 2. LOST HOST — MAKE HOST, then the server moving it
    const B2 = await join(code, 'gnc');
    const bu = await B2.ev('window.__arcade.state.uid');
    await A.waitFor(`!!(window.__arcade.state.players || {})['${bu}']`, 20000); await sleep(2000);
    const r = await A.ev(`import('/js/room.js').then(m => m.makeHost('${bu}'))`);
    await A.waitFor(`window.__arcade.state.meta && window.__arcade.state.meta.hostId === '${bu}'`, 10000);
    const t1 = Date.now(); await sleep(9000);
    const s1 = A.since(t1, code), beats = s1.writes.filter(f => /\/meta/.test(f.path));
    ok(r === true && beats.length === 0 && s1.denied.length === 0, `LOST HOST (MAKE HOST → ${r}): once A's state says B is the host, 9 s: ${beats.length} meta writes / ${s1.writes.length} room writes (${show(s1.writes)}), ${s1.denied.length} refused`);
    // the hard way: the server moves the host back to A, then to B under A's feet (the beat already in flight is the race the quiet count takes)
    await dbPut(`rooms/${code}/meta/hostId`, await A.ev('window.__arcade.state.uid'));
    await A.waitFor(`window.__arcade.state.meta && window.__arcade.state.meta.hostId === window.__arcade.state.uid`, 10000); await sleep(4500);
    await dbPut(`rooms/${code}/meta/hostId`, bu);
    await A.waitFor(`window.__arcade.state.meta && window.__arcade.state.meta.hostId === '${bu}'`, 10000);
    const t2 = Date.now(); await sleep(8000);
    const s2 = A.since(t2, code);
    ok(s2.writes.filter(f => /\/meta/.test(f.path)).length === 0 && s2.denied.length === 0, `LOST HOST (moved by the server): once A knows, 8 s: ${s2.writes.length} room writes (${show(s2.writes)}), ${s2.denied.length} refused`);
    // ---------------------------------------------------------------- 3a. THE CLOSE — the host closes a two-phone room: the guest writes nothing
    await dbPut(`rooms/${code}/meta/hostId`, await A.ev('window.__arcade.state.uid'));
    await A.waitFor('window.__arcade.state.meta && window.__arcade.state.meta.hostId === window.__arcade.state.uid', 10000);
    await B2.ev("import('/js/room.js').then(m => m.leaveRoom())"); await B2.waitFor('!window.__arcade.state.code', 10000);
    const C = await join(code, 'gnd'); await A.waitFor('Object.keys(window.__arcade.state.players || {}).length === 2', 20000); await sleep(2000);
    await A.ev("import('/js/room.js').then(m => m.leaveRoom())");   // (A is the host with a guest: the hand-off; then the guest leaves = the close)
    await C.waitFor('window.__arcade.state.meta && window.__arcade.state.meta.hostId === window.__arcade.state.uid', 15000);
    await C.ev("import('/js/room.js').then(m => m.leaveRoom())"); await C.waitFor('!window.__arcade.state.code', 10000);
    const tc = Date.now() + 300; await sleep(8000);
    const sc = C.since(tc, code), sa = A.since(tc, code);
    ok(sc.writes.length + sa.writes.length === 0 && sc.denied.length + sa.denied.length === 0, `THE CLOSE (the last one out): after the room went, 8 s: ${sc.writes.length + sa.writes.length} writes (${show([...sc.writes, ...sa.writes])}), ${sc.denied.length + sa.denied.length} refused`);
    ok(!(await val(`rooms/${code}`)) && !(await val(`chats/${code}`)), 'THE CLOSE: the room + its chat are gone — nothing wrote them back');
    await A.close(); await B.close(); await B2.close(); await C.close(); }

  // ---------------------------------------------------------------- 3b. THE SOLO PODIUM — PLAY NOW → a SOLO PRISM DROP run → its podium → BACK TO THE CITY
  { const P = await phone('gns');
    await P.ev("document.querySelector('.nd-tab-play').click()");
    await P.waitFor("!!document.querySelector('.nd-shelf-sheet.is-in .nd-shelf-row')", 6000);
    await P.ev(`document.querySelector('.nd-shelf-row[data-game="prism"]').click()`);
    await P.waitFor(`!!document.querySelector('.nd-card-sheet.is-in .nd-card-solo')`, 6000);
    await P.ev("document.querySelector('.nd-card-solo').click()");
    if (!await P.waitFor("window.__arcade.state.code && window.__arcade.state.game && window.__arcade.state.game.id === 'prism' && window.__arcade.state.game.phase !== 'final'", 30000)) throw new Error('the solo run never started');
    const code = await P.ev('window.__arcade.state.code');
    await sleep(6000);
    await P.ev(`(async () => { const s = window.__arcade.state, f = await import('/js/firebase.js'), g = s.game, n = f.serverNow(), sh = (g.endAt || n) - n + 2000;
      const patch = {}; for (const k of ['songStartAt', 'playStartAt', 'endAt', 'startAt', 'at']) if (typeof g[k] === 'number') patch[k] = g[k] - sh;
      await f.update(f.dbRef('rooms/' + s.code + '/game'), patch); })()`).catch(() => {});
    const podium = await P.waitFor("window.__arcade.state.game && window.__arcade.state.game.phase === 'final' && !!document.querySelector('.final .final-city')", 60000);
    ok(podium, 'THE SOLO PODIUM: the run reached its podium');
    await sleep(1500);
    await P.ev("document.querySelector('.final .final-city').click()");
    await P.waitFor('!window.__arcade.state.code', 15000);
    // (from the frame that REMOVED the room: anything after it that writes a value into the room / its chat is a write into a closed room)
    // (the LAST one — a solo room's code is the player's own: PLAY NOW clears an old one at the start too)
    const gone = P.frames.filter(f => f.dir === 'out' && WRITE.has(f.a) && f.nul && new RegExp(`^/?rooms/${code}$`).test(f.path)).pop();
    const tg = gone ? gone.t : Date.now();
    await sleep(8000);
    const s = P.since(tg, code), live = s.writes.filter(f => !f.nul);
    ok(!!gone && live.length === 0 && s.denied.length === 0, `THE SOLO PODIUM → BACK TO THE CITY: after the room's removal (${gone ? 'seen' : 'NOT SEEN'}), ${live.length} writes into it (${show(live)}), ${s.denied.length} refused (${show(s.denied)})`);
    ok(!(await val(`rooms/${code}`)) && !(await val(`chats/${code}`)), 'THE SOLO PODIUM: the solo room + its chat stay gone');
    ok(!P.errs.length, `no page error (${P.errs.slice(0, 2).join(' | ') || 'none'})`);
    await P.close(); }

  await sleep(1500);
  const rows1 = await rulesRows();
  ok(rows1 === rows0, `/admin's errors: no new "RULES REFUSED" row over every case (${rows0} → ${rows1})`);
} catch (e) {
  console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message));
} finally { await browser.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
