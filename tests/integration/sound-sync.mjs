// THE SOUND SYNC (HIGH RISE S4A — docs/highrise.md "THE SOUND SYNC"; docs/audio.md "THE HOLD"): the owner — "sometimes the sound isn't in
// sync with the blocks" (MUSIC OFF, the phone's speaker). The cause: PODCAST MODE (CITY I) naps the audio context 150 ms after each sound,
// so in a game EVERY effect had to wake it first. The fix: a game HOLDS THE CONTEXT AWAKE while a run is LIVE (audio/engine.js#holdAwake —
// a lease the game renews from its frame loop) and HIGH RISE asks a drop's sounds in the TOUCH itself.
// THE MEASURE, in a real browser, BOTH games, MUSIC ON and MUSIC OFF (HEAR THE HARBOR), with REAL touches:
//   each landing event (HIGH RISE: drop / perfect / slice · JAYWALK: hop / a landing on a log) → the moment its sound was asked (the game's
//   own `syncs`) → the audio engine's own record of that source's start (`voiceStarts`: at + how long it waited for a sleeping context)
//   → the GAP = asked → the source's scheduled start. EVERY gap ≤ 20 ms; no sound waits for a sleeping context; after the run the hold is
//   let go + the context keeps running (THE GARDEN PARTY PASS: HEAR THE HARBOR retired the nap); the session type never changes; HIGH RISE:
//   no sound through the late path.
//   `--before` = the same run with the hold switched OFF in the page (the old behaviour) — the pass log's BEFORE numbers; never a check.
//   node tests/integration/sound-sync.mjs "<chromium>" [--before]      (scripts/serve.mjs on :5173 — the two unlisted pages, zero server calls)
import puppeteer from './kit/puppeteer.mjs';
import { guardUrl } from './kit/live-guard.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const argv = process.argv.slice(2), BEFORE = argv.includes('--before');
const b = await puppeteer.launch({ executablePath: argv[0], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const GAP_MAX = 20;

async function open(path, musicOff) {
  const ctx = await b.createBrowserContext(), p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push(String(e.message || e)));
  const cdp = await p.createCDPSession();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.evaluateOnNewDocument(off => { try { localStorage.setItem('na:settings', JSON.stringify({ musicOff: off })); } catch { /* fine */ } }, musicOff);
  await p.goto(guardUrl(`${BASE}${path}`, 'sound-sync'), { waitUntil: 'load' });
  const waitFor = async (js, ms = 20000) => { const end = Date.now() + ms; while (Date.now() < end) { try { if (await p.evaluate(js)) return true; } catch { /* loading */ } await sleep(50); } return false; };
  const tapAt = async (x, y) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  /** a REAL swipe (JAYWALK: a step sideways) */
  const swipe = async (x, y, dx) => { const pt = (px) => [{ x: px, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }]; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x) }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x + dx / 2) }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x + dx) }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const audio = () => p.evaluate(() => import('/js/audio/engine.js').then(E => ({ h: E.audioHealth(), starts: E.voiceStarts(), session: E.sessionType(), log: E.audioEvents().map(x => x.m) })));
  if (BEFORE) await p.evaluate(() => { Object.defineProperty(globalThis, '__nsHoldAwake', { get: () => () => {}, set() {}, configurable: true }); });   // (the hold OFF: the old behaviour)
  return { p, errs, waitFor, tapAt, swipe, audio, close: () => ctx.close() };
}
/** each asked sound → its source's start in the engine's record (the nearest one at / after it) → the gap; `wait` −1 = it never ran */
function gapsOf(syncs, starts) {
  const out = [];
  for (const s of syncs) {
    let best = null;
    for (const r of starts) { const d = r.at - s.at; if (d >= -0.5 && (!best || d < best.d)) best = { d, wait: r.wait }; }
    out.push({ e: s.e, gap: best ? (best.wait < 0 ? Infinity : Math.max(0, best.d) + best.wait) : Infinity, woke: !!best && best.wait !== 0 });
  }
  return out;
}
const stat = g => { const v = g.map(x => x.gap).filter(Number.isFinite).sort((a, c) => a - c); return v.length ? `p50 ${v[Math.floor(v.length / 2)].toFixed(1)} ms · max ${v[v.length - 1].toFixed(1)} ms` : 'none'; };
const report = [];

// ---- HIGH RISE (the test page — the SAME stage the cartridge mounts): START + real touches at the slab's perfect moment, some early (a cut)
async function highrise(musicOff) {
  const tag = `HIGH RISE · MUSIC ${musicOff ? 'OFF (HEAR THE HARBOR)' : 'ON'}`;
  const t = await open('/highrise-play?look=night&seed=sync1', musicOff), { p } = t;
  ok(await t.waitFor("!!window.__hiPlay && !!window.__hiPlay.sfx && window.__hiPlay.state().info.warmed > 0"), `${tag}: the page is up, its sounds on the shared engine`);
  await t.tapAt(195, 600);                                         // START (a first-ever tap: also the audio's unlock)
  ok(await t.waitFor('window.__hiPlay.state().started', 4000), `${tag}: START — the run begins once every sound is decoded (≤ 0.6 s)`);
  const dec = await p.evaluate(() => ({ ready: window.__hiPlay.sfx.ready(), n: window.__hiPlay.sfx.decoded().length }));
  ok(dec.ready && dec.n === 9, `${tag}: every sound is decoded BEFORE the first drop (${dec.n} of 9)`);
  const a0 = await t.audio();
  let drops = 0;
  for (let i = 0; i < 14; i++) {
    const lead = i % 4 === 3 ? 95 : 22;                             // (every fourth drop early: a CUT — the slice + the falling piece)
    const r = await p.evaluate(ld => new Promise(res => { const t0 = performance.now(); (function poll() { const L = window.__hiPlay; if (L.state().over) return res('over'); const m = L.msToPerfect(); if (m != null && m <= ld) return res('go'); if (performance.now() - t0 > 9000) return res('timeout'); setTimeout(poll, m != null && m - ld > 12 ? Math.min(40, m - ld - 6) : 1); })(); }), lead);
    if (r !== 'go') break;
    await t.tapAt(195, 600); drops++;
    await sleep(260);                                               // (past the landing beat)
  }
  const mid = await t.audio(), s1 = await p.evaluate(() => ({ st: window.__hiPlay.state(), syncs: window.__hiPlay.syncs() }));
  const G = gapsOf(s1.syncs, mid.starts), kinds = [...new Set(G.map(x => x.e))].sort().join(' · '), worst = Math.max(...G.map(x => x.gap));
  report.push(`${tag}: ${G.length} landing sounds (${kinds}) over ${drops} real taps — gap ${stat(G)} · woke ${G.filter(x => x.woke).length} · held ${mid.h.held} · ctx ${mid.h.state}`);
  if (!BEFORE) {
    ok(drops >= 10 && G.length >= drops && G.some(x => x.e === 'perfect') && G.some(x => x.e === 'cut'), `${tag}: ${drops} real taps → ${G.length} landing sounds asked (drop · perfect · slice)`);
    ok(worst <= GAP_MAX, `${tag}: EVERY landing sound starts within ${GAP_MAX} ms of its event (${stat(G)})`);
    ok(!G.some(x => x.woke), `${tag}: no sound waited for a sleeping context during the live run (${G.filter(x => x.woke).length} of ${G.length} — HEAR THE HARBOR: nothing naps)`);
    ok(mid.h.state === 'running' && (!musicOff || mid.h.held), `${tag}: the context is running${musicOff ? ' — the lease of the run recorded (THE HOLD)' : ''}`);
    ok(s1.st.lates === 0, `${tag}: no sound took the late path in play (${s1.st.lates})`);
    ok(mid.session === a0.session, `${tag}: the audio session type never changed (${mid.session || 'none here'})`);
    // the run ends (the fuse) → the end card → the hold is let go (HEAR THE HARBOR: the context keeps running — the harbor's beds play on)
    ok(await t.waitFor('window.__hiPlay.state().shown', 15000), `${tag}: the run ends (THE FUSE) → the end card`);
    await sleep(900);   // (the OUT sound plays out first)
    const end = await t.audio();
    ok(!end.h.held && end.h.state === 'running', `${tag}: on the end card the hold is let go; the context running (${end.h.state} · ${end.h.sound})`);
    // hidden mid-run: the hold is dropped at once (the leave path stays as it is)
    await t.tapAt(195, 700); await t.waitFor('window.__hiPlay.state().started && !window.__hiPlay.state().shown', 4000); await sleep(1200);
    const live = await t.audio();
    await p.evaluate(() => import('/js/audio/engine.js').then(E => E.simulateVisible(false)));
    const hid = await t.audio();
    ok((!musicOff || live.h.held) && !hid.h.held, `${tag}: a leave mid-run drops the hold at once (held ${live.h.held} → ${hid.h.held})`);
    await p.evaluate(() => import('/js/audio/engine.js').then(E => E.simulateVisible(true)));
  }
  ok(t.errs.length === 0, `${tag}: no page error (${t.errs.join(' | ')})`);
  await t.close();
}

// ---- JAYWALK (the lab — the SAME sounds module + engine as the game): real swipes = steps on the start lane (calm ground: the run stays
// live; a step is a hop to the rules + the sounds — a landing on a log goes through the same play())
async function jaywalk(musicOff) {
  const tag = `JAYWALK · MUSIC ${musicOff ? 'OFF (HEAR THE HARBOR)' : 'ON'}`;
  const t = await open('/jaywalk-lab?emu&seed=sync1', musicOff), { p } = t;
  ok(await t.waitFor('!!window.__jwLab && !!window.__jwLab.sfx', 20000), `${tag}: the lab is up, its sounds on the shared engine`);
  await t.tapAt(195, 500); await sleep(700);                        // (the first touch: the audio's unlock + the run's start + the first hop)
  await t.waitFor("window.__jwLab.sfx.played().length > 0 || window.__jwLab.sfx.wanted().length > 0", 3000);
  await sleep(700);                                                 // (every sound decoded)
  const a0 = await t.audio(), n0 = (await p.evaluate(() => window.__jwLab.syncs().length));
  let taps = 0;
  for (let i = 0; i < 16; i++) {
    if (await p.evaluate(() => !!window.__jwLab.state().cause)) break;
    await t.swipe(195, 500, i % 2 ? 70 : -70); taps++;
    await sleep(330);
  }
  const mid = await t.audio(), syncs = (await p.evaluate(() => window.__jwLab.syncs())).slice(n0);
  const G = gapsOf(syncs, mid.starts), worst = G.length ? Math.max(...G.map(x => x.gap)) : Infinity;
  report.push(`${tag}: ${G.length} hop sounds over ${taps} real swipes — gap ${stat(G)} · woke ${G.filter(x => x.woke).length} · held ${mid.h.held} · ctx ${mid.h.state}`);
  if (!BEFORE) {
    ok(G.length >= 10 && (!musicOff || mid.h.held), `${tag}: ${taps} real swipes → ${G.length} hop sounds asked${musicOff ? ' — the context HELD AWAKE by the run' : ''}`);
    ok(worst <= GAP_MAX, `${tag}: EVERY hop sound starts within ${GAP_MAX} ms of its event (${stat(G)})`);
    ok(!G.some(x => x.woke), `${tag}: no sound waited for a sleeping context during the live run (${G.filter(x => x.woke).length} of ${G.length} — HEAR THE HARBOR: nothing naps)`);
    ok(mid.session === a0.session, `${tag}: the audio session type never changed (${mid.session || 'none here'})`);
    // the run ends → the hold is let go
    await p.evaluate(() => { const L = window.__jwLab, r = L.raw().run; r.wall = (r.y + 2) * 1000; });   // (the blackout takes the kid: the run is over)
    ok(await t.waitFor("!!window.__jwLab.state().cause", 8000), `${tag}: the run ends`);
    await sleep(1200);
    const end = await t.audio();
    ok(!end.h.held && end.h.state === 'running', `${tag}: after the run the hold is let go; the context running (${end.h.state} · ${end.h.sound})`);
  }
  ok(t.errs.length === 0, `${tag}: no page error (${t.errs.join(' | ')})`);
  await t.close();
}

for (const off of [true, false]) { await highrise(off); await jaywalk(off); }
await b.close();
console.log(`\n${BEFORE ? 'BEFORE (the hold switched off in the page — the old behaviour)' : 'AFTER (the hold)'}:`);
for (const l of report) console.log('  ' + l);
console.log(`\n${checks - fails.length}/${checks} checks passed`);
if (fails.length) { console.log('FAILED:\n  ' + fails.join('\n  ')); process.exit(1); }
