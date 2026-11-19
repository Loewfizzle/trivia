// CITY I — THE CLOSE IS IDEMPOTENT (the Chromebook's double room-close, re-checked on the weak tier): an IDLE room (no game for over an hour) is
// closed by whoever next types its word — two phones typing it at the SAME moment both close it (a cross-device double close), and one phone
// asking twice at once (its idle close + a second call) closes it once. At 4× CPU (the Chromebook's tier). Checks: the room gone, its word resting
// ONCE (hush/{WORD} written by the first close only), NO RULES REFUSED row on either phone (a refusal from the other phone's win = a quiet line +
// the 'gone' count), no page error.
//   node tests/integration/e2e-close-twice.mjs "<chromium>"        (the emulators + scripts/serve.mjs --emu)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { ref, get, set } from 'firebase/database';

const BROWSER = process.argv[2], BASE = process.env.E2E_BASE || 'http://localhost:5173', CPU = Number(process.env.CPU || 4);
const t0 = Date.now(), log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const checks = [], errors = [];
const ok = (c, what) => { checks.push(!!c); log(c ? 'OK  ' : 'FAIL', what); if (!c) errors.push(what); };
const env = await initializeTestEnvironment({ projectId: 'demo-arcade', database: { host: '127.0.0.1', port: 9000 } });
const admin = async fn => { let out; await env.withSecurityRulesDisabled(async ctx => { out = await fn(ctx.database('http://127.0.0.1:9000?ns=demo-arcade-default-rtdb')); }); return out; };
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio'] });

async function phone(slot) {
  const ctx = await browser.createBrowserContext(), p = await ctx.newPage();
  const errs = [], info = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (/\[rules\]/.test(m.text())) info.push(m.text()); });
  await p.evaluateOnNewDocument(s => { try { localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: s.toUpperCase(), color: 'cyan', avatar: 'bolt' })); localStorage.setItem('nd:entered', '1'); } catch { /* fine */ } }, slot);
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const cdp = await p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}`, 'e2e-close-twice.mjs'));
  await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 90000 });
  await p.evaluate(() => import('/js/firebase.js').then(m => m.firebaseReady));
  return { ctx, p, errs, info };
}
const idleRoom = async word => {
  const old = Date.now() - 2 * 3600_000;
  await admin(db => set(ref(db, `rooms/${word}`), { meta: { hostId: 'ghostHost000', status: 'lobby', createdAt: old, activeAt: old }, players: { ghostHost000: { name: 'GHOST', color: 'cyan', avatar: 'bolt', joinedAt: old } } }));
  await admin(db => set(ref(db, `hush/${word}`), null));
};
const refusedRows = p => p.evaluate(() => (window.__errlog ? window.__errlog.pending().concat(window.__errlog.seen()) : []).map(x => (typeof x === 'string' ? x : x.m || '')).filter(x => /RULES REFUSED/.test(x)));
const JOIN = w => `import('/js/room.js').then(m => m.joinRoom('${w}', { name: 'X', color: 'cyan', avatar: 'bolt' })).then(() => 'joined', e => 'err: ' + e.message)`;

try {
  const A = await phone('ctwa'), B = await phone('ctwb');
  // ---- two phones, one idle room, the same moment
  const W = 'ZEPH';
  await idleRoom(W);
  const [ra, rb] = await Promise.all([A.p.evaluate(JOIN(W)), B.p.evaluate(JOIN(W))]);
  await new Promise(r => setTimeout(r, 4000));   // (the refusal's quiet-or-alarm judgement settles in HOST_SETTLE_MS)
  const room = await admin(db => get(ref(db, `rooms/${W}`)).then(s => s.val()));
  const hush = await admin(db => get(ref(db, `hush/${W}`)).then(s => s.val()));
  const refused = [...(await refusedRows(A.p)), ...(await refusedRows(B.p))];
  log('  joins:', ra, '|', rb, '· rules lines:', [...A.info, ...B.info].join(' || ') || 'none');
  ok(!room || !room.players || !room.players.ghostHost000, `TWO PHONES, ONE IDLE ROOM AT ONCE: the idle room closed (${room ? `a new room now: ${Object.keys(room.players || {}).length} player(s)` : 'gone'})`);
  ok(hush && typeof hush.closedAt === 'number', `…its word rests ONCE (hush/${W}.closedAt ${hush && hush.closedAt})`);
  ok(refused.length === 0, `…NO RULES REFUSED row on either phone (${refused.length ? refused.join(' | ') : 'none'})`);
  ok(!A.errs.length && !B.errs.length, `…no page error (${[...A.errs, ...B.errs].join(' | ') || 'none'})`);
  await A.p.evaluate(() => import('/js/room.js').then(m => m.leaveRoom()).catch(() => {}));
  await B.p.evaluate(() => import('/js/room.js').then(m => m.leaveRoom()).catch(() => {}));
  // ---- one phone asking twice at once
  const C = await phone('ctwc');
  const W2 = 'QUIP';
  await idleRoom(W2);
  const [r1, r2] = await C.p.evaluate(w => Promise.all([0, 1].map(() => import('/js/room.js').then(m => m.joinRoom(w, { name: 'C', color: 'cyan', avatar: 'bolt' })).then(() => 'joined', e => 'err: ' + e.message))), W2);
  await new Promise(r => setTimeout(r, 4000));
  const h2 = await admin(db => get(ref(db, `hush/${W2}`)).then(s => s.val()));
  const ref2 = await refusedRows(C.p);
  log('  joins:', r1, '|', r2, '· rules lines:', C.info.join(' || ') || 'none');
  ok(h2 && typeof h2.closedAt === 'number' && ref2.length === 0 && !C.errs.length, `ONE PHONE, TWICE AT ONCE: closed once, the word resting, no RULES REFUSED (${ref2.length}), no page error (${C.errs.length})`);
  ok(!C.info.some(x => /refused/.test(x)), `…the second close never even writes (CITY G's code sent it + the rules refused it — now ONE close: ${C.info.join(' | ') || 'no rules line'})`);
  await C.p.evaluate(() => import('/js/room.js').then(m => m.leaveRoom()).catch(() => {}));
} catch (e) { errors.push(String(e && e.stack || e)); log('ERROR', e); }
await browser.close();
await env.cleanup();
log(`${checks.filter(Boolean).length}/${checks.length} checks`);
if (errors.length) { console.log('\nFAILED:\n' + errors.join('\n')); process.exit(1); }
