// PRISM DROP end to end with N players (default 8), each in their own browser context.
//   node e2e-prism.mjs "<browser path>" ./shots-prism        (env N=8, SHOTS=0, RUSH=0 to skip Score Rush, CPU=4)
// Match A — BATTLE: lobby card + options; the same song / world / piece order on every phone; real touch gestures
//   (drag 3 columns, tap rotate both ways, slow soft drop, flick = hard drop, swipe up = hold); bots play; real junk
//   attacks arrive and land; AUTO-TARGET (PD-2 — no button); refresh mid-battle (board restored); the host's phone dies (a new host
//   carries on); a player gone > 30 s is out; knockouts with KO credit + badges; Call the Winner (a right call earns
//   game-night points); FINAL DUEL; a song change mid-match (world transforms, audio follows); musical SFX in the
//   song's key and on its 16th-note grid; frame pacing at every quality tier under CPU throttling; results.
// Match B — SCORE RUSH: the next song of the room playlist; live leaderboard; a top-out reboots the board (score
//   kept); the finale on the final beat; results by score.
// PD-5A (both paths — soundChecks): THE QUICK START's slices = the whole song's samples (every file); a DAY host + a NIGHT phone on SLOW 3G
//   → the day set, audible at GO from its first slice, then the swap to the whole song (no double play, no re-place); the heard beat.
// PD-2 (both paths): the RISING GHOST ROWS + their tag, BLOCKED! (the cancel), the KO card; then SURVIVAL (everyone still here: the same
//   rows on every phone, no attacks, last one standing), a room of ONE (the options = SCORE RUSH + SURVIVAL), a solo SURVIVAL + a solo
//   SCORE RUSH (SOLO RUN on the podium, never a win).
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-prism').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const FAST = process.env.FAST === '1';   // (SHELL 2.0 B1: two phones, one battle to its end, back to the room — ≈ 1 min)
const N = Number(process.env.N || (FAST ? 2 : 8));
const SHOTS = process.env.SHOTS !== '0';
const CPU = Number(process.env.CPU || 4);
const NAMES = ['ALICE', 'BOB', 'CHARLIE', 'DANA', 'EVE', 'FINN', 'GRACE', 'HAL'];
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
const checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const fail = m => { throw new Error(m); };
const VIEW = { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

const browser = await puppeteer.launch({
  executablePath: BROWSER, headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])],
});
const pages = [];
const ctxs = [];
const dead = new Set();
const uids = [];
let code = '';
const refusedWrites = [];   // (PFIX-B: every write the rules refused — firebase.js#write's "[rules] refused:" line, one per path shape a page)

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'warning' && /game view/.test(m.text())) errors.push(`game view failed to load: ${m.text()}`); });
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message); });
  page.on('console', m => { const t = m.text(); if (/^\[rules\] refused:/.test(t)) { refusedWrites.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} ${t}`); } });
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_|Failed to load resource|favicon|permission_denied|PERMISSION_DENIED|Client is offline|net::/i.test(t)) { errors.push(`${NAMES[i]}: ${t}`); log(`${NAMES[i]} console.error`, t); } });
  await page.setViewport(VIEW);
  await page.goto(`${BASE}/?emu&slot=p${i}${qs ? '&' + qs : ''}`);
  pages[i] = page;
  return page;
}
async function shotBoth(page, name) {
  if (!SHOTS) return;
  for (const [w, h] of [[390, 844], [412, 915]]) {
    await page.setViewport({ ...VIEW, width: w, height: h, deviceScaleFactor: 2 });
    await sleep(450);
    await page.screenshot({ path: `${OUT}${name}-${w}.png` });
  }
  await page.setViewport(VIEW);
  await sleep(150);
}
const shot = (page, name) => (SHOTS ? page.screenshot({ path: `${OUT}${name}-390.png` }) : null);
const evalIn = (page, fn, arg) => page.evaluate(`(async () => { const s = window.__arcade.state; return (${fn})(s, ${JSON.stringify(arg ?? null)}); })()`);
async function waitFor(page, fn, what, timeout = 30000, arg) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await evalIn(page, fn, arg)) return true; } catch { /* busy */ } await sleep(150); }
  fail(`timeout: ${what}`);
}
const alive = () => pages.map((p, i) => i).filter(i => pages[i] && !dead.has(i));
const idx = uid => uids.indexOf(uid);
const anyPage = () => pages[alive()[0]];
const game = page => evalIn(page, s => s.game);
const P = (page, js) => page.evaluate(js);
const engOf = page => P(page, `(() => { const e = window.__prism && window.__prism.engine(); if (!e) return null; return { cur: e.cur, n: e.n, hold: e.hold, over: e.over, lines: e.lines, score: e.score, sent: e.sent, pending: e.pending.reduce((s, q) => s + q.n, 0), board: Array.from(e.cells.slice(0, 200)).join(''), clock: e.clock }; })()`);

async function joinAll() {
  const host = await openPlayer(0);
  await host.waitForSelector('.nd-host', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await host.click('.nd-host').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await host.click('.form-cta .btn-primary');
  await host.waitForSelector('.title-screen.is-room .rdk-dock', { timeout: 20000 });   // (SHELL 2.0 B1: the room in the city)
  code = await evalIn(host, s => s.code);
  log('room', code);
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.nd-go', { timeout: 20000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
    await p.click('.nd-go');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await p.click('.form-cta .btn-primary');
    await p.waitForSelector('.title-screen.is-room', { timeout: 20000 });
  }
  await waitFor(host, (s, n) => Object.keys(s.players).length === n, `${N} players`, 30000, N);
  for (let i = 0; i < N; i++) uids[i] = await evalIn(pages[i], s => s.uid);
  return host;
}

async function hostIdx() {
  for (const i of alive()) { try { if (await evalIn(pages[i], s => s.meta && s.meta.hostId === s.uid)) return i; } catch { /* */ } }
  return alive()[0];
}
const touch = async (page, pts, dtMs) => {
  // a real touch gesture through CDP (pointer events with timestamps)
  // explicit timestamps: the gesture's timing is what a finger would do, however busy the test machine is
  const c = await page.target().createCDPSession();
  const base = Date.now() / 1000;
  let k = 0;
  const ev = (type, [x, y]) => c.send('Input.dispatchTouchEvent', { type, timestamp: base + (k++) * dtMs / 1000, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  await ev('touchStart', pts[0]);
  for (const p of pts.slice(1)) await ev('touchMove', p);
  await ev('touchEnd', pts[pts.length - 1]);
  await c.detach();
  await sleep(120);
};
const BAD = /\bnull\b|\bundefined\b|\bNaN\b|\[object Object\]/;
const cleanText = async (page, where) => {
  const t = await page.evaluate(() => (document.querySelector('.pd') || document.body).innerText);
  const m = t.match(BAD);
  const near = m ? `: …${t.slice(Math.max(0, m.index - 30), m.index + 20).replace(/\s+/g, ' ')}…` : '';
  ok(!m, `TEXT: no stray "null"/"undefined" on screen (${where}${near})`);
};
const touchTap = async page => { const l = await P(page, 'window.__prism.layout()'); await touch(page, [[l.board.x + l.board.width * 0.8, l.board.y + 40], [l.board.x + l.board.width * 0.8, l.board.y + 40]], 30); };
const line = (x0, y0, x1, y1, n) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);

// PFIX-A (FABLE REVIEW finding 5) — A REFRESH NEVER ATTACKS TWICE: a 4-line clear, the page reloaded 400 ms later → the board comes back
// AFTER the clear (the save rides the attack), and replaying that same piece's clear sends nothing (the attack's key = the sender + the
// piece — create-only). The targets' queues hold ONE attack of 4 from it.
async function refreshAttackCheck(ai) {
  const A = pages[ai];
  await P(A, 'window.__prism.stopBot()');
  await sleep(300);
  const setup = `(async () => {
    const E = await import('/js/games/prism/engine.js');
    const e = window.__prism.engine();
    e.pending.length = 0; e.frac = 0; e.combo = -1; e.b2b = false; e.badges = 0;
    e.cells.fill(0);
    for (let y = 0; y < 4; y++) for (let x = 1; x < E.W; x++) e.cells[y * E.W + x] = 8;
    for (let x = 4; x < 7; x++) e.cells[4 * E.W + x] = 8;   // (a few blocks above — a plain 4-line clear, never a perfect clear's 10)
    e.cur = { t: 1, r: 1, x: -2, y: 8 };   // the long piece upright over the one open column
    return e.n;
  })()`;
  // (the receiving side needs an attack already taken: another phone's scripted 4-line clear first — in FAST its only target is this one)
  let oi = null;
  for (const i of alive()) if (i !== ai && (await P(pages[i], 'window.__prism.target()')).target === uids[ai]) { oi = i; break; }   // (a phone whose target it is)
  if (oi != null) { await P(pages[oi], setup.replace('return e.n;', `const E2 = await import('/js/games/prism/engine.js'); E2.hardDrop(e); return e.n;`)); await sleep(1500); }
  const n0 = await P(A, setup);
  await P(A, `(async () => { const E = await import('/js/games/prism/engine.js'); E.hardDrop(window.__prism.engine()); })()`);
  await sleep(400);
  await A.reload();
  await A.waitForFunction(() => window.__prism && window.__prism.engine() && window.__prism.engine().cur, { timeout: 25000 });
  const back = await engOf(A);
  ok(back.n >= n0 + 1 && back.lines >= 4, `REFRESH: ${NAMES[ai]}'s board comes back AFTER the 4-line clear (piece ${n0} → ${back.n}, ${back.lines} lines)`);
  // the same piece's clear again (what a stale save made a player repeat) — refused by its key
  await P(A, setup.replace('return e.n;', `e.n = ${n0}; return e.n;`));
  await P(A, `(async () => { const E = await import('/js/games/prism/engine.js'); E.hardDrop(window.__prism.engine()); })()`);
  await sleep(1500);
  const gq = await game(A);
  const q = await A.evaluate(async (c, m) => { const f = await import('/js/firebase.js'); return (await f.get(f.dbRef(`rooms/${c}/prismq/${m}`))).val() || {}; }, code, gq.matchId);
  const mine = Object.values(q).flatMap(t => Object.entries(t || {})).filter(([k, a]) => a && a.f === uids[ai]);
  const first = mine.find(([k]) => k === `${uids[ai]}-${n0}`);
  const after = first ? mine.filter(([, a]) => a.at >= first[1].at).map(([, a]) => a.n) : [];
  ok(first && first[1].n >= 4 && after.length === 1, `REFRESH: one clear = ONE attack — the queue holds [${after.join(', ')}] from ${NAMES[ai]} (key ${first ? first[0].slice(-6) : 'missing'})`);
  // the RECEIVING side of the same refresh: the attacks this phone had already taken before its save are never taken again
  // (stamped after its clear = after its save: the only attacks the restored board may hold that the save didn't)
  const toMe = Object.values(q[uids[ai]] || {}).filter(a => a && first && a.at > first[1].at).reduce((t, a) => t + (a.n || 0), 0);
  const all = Object.values(q[uids[ai]] || {}).reduce((t, a) => t + ((a && a.n) || 0), 0);
  ok((oi == null || all > 0) && back.pending <= toMe, `REFRESH: the board came back without re-taking the attacks it had taken (pending ${back.pending} ≤ ${toMe} sent after its save; ${all} rows in its queue${oi == null ? ' — no phone was aiming at it' : ''})`);
}

// PFIX-A (FABLE REVIEW finding 2 + question E) — AWAY: a tab hidden 36 s (a second tab brought to the front: the socket stays, presence
// stays online, no frames run) is OUT after 30 s, credited to nobody, never the winner; back on screen its KO card says AWAY
async function awayCheck(vi, wi = null) {
  const V = pages[vi];
  await P(V, 'window.__prism.stopBot()').catch(() => {});
  // (two phones: the other one must still be standing when the 30 s run out — its board is cleared first, the way the host-kill step does)
  if (alive().length === 2) for (const i of alive()) if (i !== vi) await P(pages[i], '(() => { const e = window.__prism.engine(); if (e) { e.cells.fill(0); e.pending.length = 0; } })()').catch(() => {});
  const cover = await ctxs[vi].newPage();
  await cover.bringToFront();
  await sleep(300);
  let how = await V.evaluate(() => document.visibilityState);
  let cdp = null;
  if (how !== 'hidden') { cdp = await V.target().createCDPSession(); await cdp.send('Page.setWebLifecycleState', { state: 'frozen' }); how = 'frozen'; }
  log(`${NAMES[vi]} hidden (${how}) for 36 s`);
  const watch = pages[wi ?? alive().find(i => i !== vi)];
  const t1 = Date.now();
  await waitFor(watch, (st, u) => !!(st.game.out && st.game.out[u]) || st.game.phase !== 'play', `${NAMES[vi]} counted AWAY`, 45000, uids[vi]);
  const secs = (Date.now() - t1) / 1000;
  const g = await game(watch);
  const o = g.out && g.out[uids[vi]];
  if (!o) log('AWAY: the game moved on first', JSON.stringify({ phase: g.phase, out: g.out, winner: g.winner && NAMES[idx(g.winner)], boards: await evalIn(watch, st => Object.fromEntries(Object.entries((st.live && st.live.boards) || {}).map(([u, b]) => [u.slice(-4), { st: b.st, at: b.at, by: b.by && b.by.slice(-4) }]))) }));
  const online = await evalIn(watch, (st, u) => !!(st.presence[u] && st.presence[u].online), uids[vi]);
  ok(o && o.away && !o.by && online, `AWAY: ${NAMES[vi]}'s hidden tab (presence still online: ${online}) is out after ${secs.toFixed(0)} s, credited to nobody (${JSON.stringify(o)})`);
  await sleep(Math.max(0, 36000 - (Date.now() - t1)));
  if (cdp) { await cdp.send('Page.setWebLifecycleState', { state: 'active' }); await cdp.detach(); }
  await V.bringToFront();
  await cover.close();
  await touchTap(V);   // a person picks the phone back up: the first touch brings its sound back (the site's fade on leaving suspended it)
  await V.waitForFunction(() => /AWAY/.test((document.querySelector('.pd-ko') || {}).textContent || ''), { timeout: 15000 }).catch(() => {});
  const ko = await P(V, 'window.__prism.ko()');
  ok(/^KO/.test(ko) && /AWAY/.test(ko), `AWAY: back on screen, ${NAMES[vi]}'s KO card says why ("${ko}")`);
  return o;
}

// PD-2 — SURVIVAL (everyone still in the room: the same rows on every phone, no attacks, last one standing), then a room of ONE: the options
// show SCORE RUSH + SURVIVAL only; a solo SURVIVAL (until you top out — SOLO RUN, the time); a solo start of BATTLE plays SCORE RUSH
async function shiftClock(page, ms) {
  const g = await game(page);
  await page.evaluate(async (c, g0, s) => { const f = await import('/js/firebase.js'); const patch = { songStartAt: g0.songStartAt - s, playStartAt: g0.playStartAt - s }; if (g0.endAt) patch.endAt = g0.endAt - s; await f.update(f.dbRef(`rooms/${c}/game`), patch); }, code, g, ms);
}
// PD-5A — THE SOUND: the quick start's slices, THE HOST's SET (a day host, a night phone), audible at GO on Slow 3G, the swap, the heard beat
async function soundChecks() {
  let hi = await hostIdx();
  let h = pages[hi];
  const gNow = await game(h);
  if (gNow && gNow.phase) { await h.evaluate(() => import('/js/host.js').then(m => m.backToLobby())); await waitFor(h, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000); }
  // (a) a first slice decodes to the SAME samples as the whole song — every song file, two slice lengths (the swap's promise: no seam)
  const same = await h.evaluate(async () => {
    const M = await import('/js/core/mp3-slice.js');
    const S = await import('/js/games/prism/songs.js');
    const dec = ab => new Promise((res, rej) => new OfflineAudioContext(2, 1, 44100).decodeAudioData(ab, res, rej));
    const out = [];
    for (const song of await S.loadManifest()) {
      const bytes = new Uint8Array(await (await fetch(S.songUrl(song.id))).arrayBuffer());
      const full = await dec(bytes.slice().buffer);
      let worst = 0, n = 0;
      for (const want of [12, 30]) {
        const cut = M.prefixCut(bytes, want);
        const part = await dec(bytes.slice(0, cut.end).buffer);
        const k = Math.floor((cut.s - 0.5) * part.sampleRate);
        for (let ch = 0; ch < 2; ch++) { const a = part.getChannelData(ch), b = full.getChannelData(ch); for (let i = 0; i < k; i++) { const d = Math.abs(a[i] - b[i]); if (d > worst) worst = d; } }
        n += k;
      }
      out.push({ id: song.id, worst, n });
    }
    return out;
  });
  // (a2) a CUE-IN's RANGE stream (from a frame just before the cue — the intro never fetched): placed by bufferT0, the same samples too
  const ranged = await h.evaluate(async () => {
    const SS = await import('/js/audio/synced-songs.js');
    const S = await import('/js/games/prism/songs.js');
    const dec = ab => new Promise((res, rej) => new OfflineAudioContext(2, 1, 44100).decodeAudioData(ab, res, rej));
    const out = [];
    for (const song of (await S.loadManifest()).filter(x => x.cue >= 1.5)) {
      const url = S.songUrl(song.id);
      const full = await dec(await (await fetch(url)).arrayBuffer());
      for (const ff of [song.ff || 0, 0]) {   // (one request with the build's first-frame byte; the two-request fallback without)
        const q = await SS.quickWholeForTest(url, song.cue, ff);
        const F = full.getChannelData(0), Q = q.buf.getChannelData(0), off = Math.round(q.t0 * 44100);
        let worst = 0;
        for (let p = Math.round(song.cue * 44100); p < Math.round((song.cue + 20) * 44100); p++) { const d = Math.abs(Q[p - off] - F[p]); if (d > worst) worst = d; }
        out.push({ id: song.id + (ff ? ' (ff)' : ''), mode: q.mode, worst });
      }
    }
    return out;
  });
  ok(ranged.length >= 6 && ranged.every(x => /^range/.test(x.mode) && x.worst < 1e-6), `QUICK START: a cue-in's RANGE stream (its intro never fetched) lands on the whole song's samples (${ranged.map(x => x.id + ' ' + x.mode + ' · ' + x.worst).join(' · ')})`);
  const worstAll = Math.max(...same.map(x => x.worst));
  ok(same.length >= 10 && worstAll < 1e-6 && same.every(x => x.n > 0), `QUICK START: a first slice (12 s / 30 s from byte 0) decodes to the SAME samples as the whole song — all ${same.length} files (the largest difference ${worstAll})`);

  // (b) THE HOST's SET: the host on DAY, the other phone on NIGHT, that phone on SLOW 3G (Chrome's preset: 50 KB/s, 2 s latency)
  const j = alive().find(i => i !== hi);
  const B = pages[j];
  const setLook = (p, l) => p.evaluate(v => { localStorage.setItem('ns:look', v); window.dispatchEvent(new CustomEvent('ns-look', { detail: v })); }, l);
  await setLook(h, 'day');
  await setLook(B, 'night');
  await B.emulateNetworkConditions({ download: 50_000, upload: 50_000, latency: 2000 });
  await h.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'rush' })));
  await waitFor(h, s => s.game && s.game.id === 'prism' && s.game.settings.mode === 'rush' && s.game.phase === 'count', 'the day rush: count', 30000);
  const gD = await game(h);
  // (a day deal with no cue-in at all stores no cu — createGame keeps it only when a song has one)
  ok(gD.set === 'day' && /^prismd\d$/.test(gD.songs[0]) && (!gD.cu || gD.cu.length === gD.songs.length), `THE HOST's SET: a DAY host deals the DAY set (${gD.songs[0]}, cue-in ${gD.cu ? gD.cu[0] : 0} ms)`);
  await waitFor(B, () => !!(window.__prism && window.__prism.clock()), "the night phone's screen", 40000);
  // GO: the song must be sounding on the throttled night phone — from its first slice (the whole file can't have arrived yet)
  await waitFor(B, s => s.game && s.game.phase === 'play', 'GO on the throttled phone', 40000);
  const atGo = await P(B, `(async () => { const f = await import('/js/firebase.js'); const ss = await import('/js/audio/synced-songs.js'); const g = window.__arcade.state.game; const a = window.__prism.audio(); const fl = (ss.songCache().held.find(x => x.url.startsWith(g.songs[0])) || {}).flow; return { late: f.serverNow() - g.playStartAt, goIn: g.playStartAt - g.songStartAt, made: f.serverNow() - g.phaseStartAt, flow: fl, slots: a.slots, parts: a.parts, decoded: a.decoded, swaps: a.swaps, look: document.body.dataset.look, beat: window.__prism.beat() }; })()`);
  // (what else this phone downloaded while the song streamed — the line is shared)
  const others = await P(B, `performance.getEntriesByType('resource').filter(r => r.startTime > performance.now() - 20000 && !/prismd\\d\\.mp3/.test(r.name)).map(r => [r.name.split('/').slice(-2).join('/').slice(0, 60), Math.round(r.transferSize / 1024) + 'KB', Math.round(r.duration) + 'ms']).filter(x => x[1] !== '0KB')`);
  log('the throttled phone also fetched:', JSON.stringify(others));
  const sounding = atGo.slots.filter(x => x.gain > 0.05 && x.id === gD.songs[0]);
  // (THE LINE AS DELIVERED: Chrome's Slow 3G preset asks 50 KB/s, but this harness delivers ~12–36 KB/s to the stream run to run — measured,
  //  nothing else fetched. A line slower than ~1.25× the song's own 14 KB/s can't carry ANY player's song through its opening: judged only
  //  above that — below it the numbers are reported, not judged)
  const fl = atGo.flow || {};
  const rate = fl.n && fl.ago > fl.head ? fl.n / ((fl.ago - fl.head) / 1000) : 0;
  const judged = rate >= 1.25 * 14000;
  ok(atGo.look === 'night' && (sounding.length === 1 || !judged), `SLOW 3G (the line gave ${(rate / 1000).toFixed(1)} KB/s${judged ? '' : ' — under 1.25× the song’s own rate: NOT JUDGED'}):`);
  if (judged) ok(atGo.look === 'night' && sounding.length === 1, `SLOW 3G: the DAY song is AUDIBLE at GO on the NIGHT phone (${Math.round(atGo.late)} ms after GO: ${JSON.stringify(atGo.slots)}; look ${atGo.look}; the stream: ${JSON.stringify(atGo.flow)}, the match made ${atGo.made} ms ago, GO ${atGo.goIn} ms into the song)`);
  if (judged) ok(atGo.parts.length === 1 || atGo.swaps > 0, `QUICK START: it plays from a first slice while the rest streams in (${JSON.stringify({ parts: atGo.parts, decoded: atGo.decoded, swaps: atGo.swaps })})`);
  const b0 = atGo.beat;
  ok(b0 && b0.set === 'day' && b0.id === gD.songs[0] && (b0.origin != null || !judged), `THE HEARD BEAT: the night phone's lights follow the day song's sounding voice (${b0 && b0.title}, pos ${b0 && b0.pos.toFixed(2)} s, lead ${b0 && Math.round(b0.lead * 1000)} ms, unreported ${b0 && Math.round(b0.unreported * 1000)} ms)`);
  // the swap: the throttle lifted — the rest arrives, the voice takes the whole song on one sample (one voice for the song throughout, no re-place)
  await B.emulateNetworkConditions(null);
  let maxVoices = 0, swapped = null;
  for (let k = 0; k < 120 && !swapped; k++) {
    const a = await P(B, 'window.__prism.audio()');
    maxVoices = Math.max(maxVoices, a.slots.filter(x => x.i === 0).length);
    if (a.decoded.length && !a.parts.length && a.swaps > 0) swapped = a;
    else await sleep(250);
  }
  ok((!!swapped || !judged) && maxVoices <= 1 && (!swapped || swapped.restarts === 0), `QUICK START: the slice → the whole song on one sample (${swapped ? `${swapped.swaps} swap(s), ${swapped.restarts} re-place(s)` : 'no swap'}; at most ${maxVoices} voice for the song — no double play)`);
  // the heard beat sits where the room's clock puts it (no jump between the server clock + the voice's own)
  const hb = await P(B, `(async () => { const f = await import('/js/firebase.js'); const g = window.__arcade.state.game; const b = window.__prism.beat(); const L = await import('/js/games/prism/logic.js'); const s = L.songAt(g, f.serverNow()); return { pos: b.pos, srv: (f.serverNow() - s.start) / 1000 + b.cue - b.unreported - b.lead }; })()`);
  ok(Math.abs(hb.pos - hb.srv) < 0.06, `THE HEARD BEAT: the voice's clock and the room's clock agree (${Math.round((hb.pos - hb.srv) * 1000)} ms)`);
  await cleanText(B, 'the day song on a night phone');
  await shot(B, 'pd-5a-day-song-night-phone');
  // back: the looks as before (night), the room
  await setLook(h, 'night');
  await h.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
  await waitFor(h, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000);
  const used = await evalIn(h, s => s.meta && s.meta.used && s.meta.used.prism);
  // PFIX-B (optional 12): an END GAME mid-match still moved the playlist past its first song (at the START) — the next match deals another
  ok(!!(used && used[`dn${(gD.pl0 || 0) + 1}`]), `END GAME: the day playlist moved past ${gD.songs[0]} at the start (dn${(gD.pl0 || 0) + 1} in the night's memory)`);
}

async function survivalAndSolo() {
  let hi = await hostIdx();
  let h = pages[hi];
  const gNow = await game(h);
  if (gNow && gNow.phase) { await h.evaluate(() => import('/js/host.js').then(m => m.backToLobby())); await waitFor(h, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000); }
  await h.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'survival' })));
  await waitFor(h, s => s.game && s.game.settings.mode === 'survival' && s.game.phase === 'play', 'SURVIVAL: GO', 40000);
  const players = Object.keys((await game(h)).participants).map(idx).filter(i => alive().includes(i));
  await Promise.all(players.map(i => pages[i].waitForFunction(() => window.__prism.engine() && window.__prism.engine().cur, { timeout: 20000 })));
  for (const i of players) await P(pages[i], `window.__prism.bot({ skill: 0.9, every: 150, seed: ${i + 50} })`);
  await shiftClock(h, 52_000);   // (52 s in: five rows have risen on every board)
  await sleep(2500);
  const sds = await Promise.all(players.map(i => P(pages[i], 'window.__prism.engine().sd')));
  ok(new Set(sds).size === 1 && sds[0] >= 4, `SURVIVAL: the same rows rose on every phone (${sds.join(', ')})`);
  const sent = await Promise.all(players.map(i => P(pages[i], 'window.__prism.engine().sent')));
  ok(sent.every(x => x === 0), `SURVIVAL: no attacks are sent (${sent.join(', ')})`);
  // the next row rises as a ghost in its last 3 s
  let sched = false;
  for (let k = 0; k < 60 && !sched; k++) { sched = await P(pages[players[0]], "(() => { const g = window.__prism.ghost(); return !!(g.bands && g.bands.some(b => b.kind === 'sched')); })()"); if (!sched) await sleep(200); }
  ok(sched, 'SURVIVAL: the next row rises as a ghost before it lands');
  await cleanText(pages[players[0]], 'survival');
  await shotBoth(pages[players[0]], 'pd-19-survival');
  // last one standing: everyone but the host tops out
  for (const i of players.filter(i => i !== hi)) {
    await P(pages[i], 'window.__prism.topOut()');
    await waitFor(h, (s, u) => !!(s.game.out && s.game.out[u]) || s.game.phase !== 'play', `${NAMES[i]} out (SURVIVAL)`, 20000, uids[i]);
  }
  await waitFor(h, s => s.game.phase === 'final', 'SURVIVAL: the results', 30000);
  const gS = await game(h);
  ok(gS.winner === uids[hi] && !Object.values(gS.out).some(o => o.by) && gS.results[uids[hi]].t > 50_000, `SURVIVAL: ${NAMES[hi]} is the last one standing — no KO credit, the time survived recorded (${Math.round(gS.results[uids[hi]].t / 1000)} s)`);
  await sleep(4500);
  await shotBoth(h, 'pd-20-survival-final');
  await h.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
  await waitFor(h, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000);
  // ---- a room of ONE: everyone else leaves
  for (const i of alive().filter(i => i !== hi)) { await pages[i].close(); dead.add(i); }
  await waitFor(h, s => Object.values(s.presence || {}).filter(p => p && p.online !== false).length === 1, 'a room of one', 60000);
  await h.waitForSelector('.rdk-games', { timeout: 20000 });
  await h.evaluate(() => document.querySelector('.rdk-games').click());
  await h.waitForSelector('.rc-games-sheet .rc-game[data-game="prism"]', { timeout: 8000 });
  await h.evaluate(() => document.querySelector('.rc-games-sheet .rc-game[data-game="prism"]').click());
  await h.waitForSelector('.sh.options .opt-row', { timeout: 8000 });
  await sleep(400);
  const modes = await h.evaluate(() => [...document.querySelectorAll('.sh.options .opt-row')].map(b => b.dataset.v));
  ok(modes.join() === 'rush,survival', `SOLO: a room of one sees SCORE RUSH + SURVIVAL only (${modes.join(', ')})`);
  await shotBoth(h, 'pd-21-solo-options');
  await h.evaluate(() => { const x = document.querySelector('.sh:not(.is-out) .sh-x'); if (x) x.click(); });
  await sleep(500);
  // ---- solo SURVIVAL: play until you top out
  await h.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'survival' })));
  await waitFor(h, s => s.game && s.game.settings.mode === 'survival' && s.game.phase === 'play', 'SOLO SURVIVAL: GO', 40000);
  await h.waitForFunction(() => window.__prism.engine() && window.__prism.engine().cur, { timeout: 20000 });
  await P(h, 'window.__prism.bot({ skill: 0.9, every: 150, seed: 61 })');
  await shiftClock(h, 30_000);
  await sleep(2500);
  await P(h, 'window.__prism.topOut()');
  await sleep(400);
  const ko = await P(h, 'window.__prism.ko()');
  ok(/SURVIVED \d+:\d\d/.test(ko), `SOLO SURVIVAL: the KO card shows the time survived ("${ko}")`);
  await waitFor(h, s => s.game.phase === 'final', 'SOLO SURVIVAL: the results', 30000);
  const g1 = await game(h);
  await h.waitForSelector('.final .winner-title', { timeout: 15000 });
  await sleep(4500);
  const head = await h.evaluate(() => ({ w: document.querySelector('.final .winner-title').textContent, n: document.querySelector('.final .winner-name').textContent }));
  ok(!g1.winner && g1.results[uids[hi]].t > 25_000 && head.w === 'SOLO RUN' && /\d+:\d\d/.test(head.n), `SOLO SURVIVAL: no winner — SOLO RUN + the time ("${head.n}")`);
  await shotBoth(h, 'pd-22-solo-survival-final');
  await h.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
  await waitFor(h, s => s.meta.status === 'lobby' && !s.game, 'back in the room', 30000);
  // ---- a solo start of BATTLE plays SCORE RUSH (BATTLE needs 2)
  await h.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'battle' })));
  await waitFor(h, s => s.game && s.game.phase === 'play', 'SOLO SCORE RUSH: GO', 40000);
  const gR = await game(h);
  ok(gR.settings.mode === 'rush' && Object.keys(gR.participants).length === 1, `SOLO: a room of one is dealt SCORE RUSH, never BATTLE (${gR.settings.mode})`);
  await h.waitForFunction(() => window.__prism.engine() && window.__prism.engine().cur, { timeout: 20000 });
  await P(h, 'window.__prism.bot({ skill: 0.9, every: 120, seed: 71 })');
  await sleep(5000);
  const now = await h.evaluate(async () => (await import('/js/firebase.js')).serverNow());
  await shiftClock(h, gR.endAt - (now + 4000));
  await waitFor(h, s => s.game.phase === 'final', 'SOLO SCORE RUSH: the results', 40000);
  const g2 = await game(h);
  ok(!g2.winner && (g2.results[uids[hi]].sc || 0) > 0, `SOLO SCORE RUSH: played to the song's end — a score, never a win (${g2.results[uids[hi]].sc})`);
  await sleep(4500);
  await shotBoth(h, 'pd-23-solo-rush-final');
}

async function perfRun(p) {
  // a mid-range phone stand-in: ${CPU}× CPU throttle, phone pixel density, every tier (the auto-step-down is
  // switched off by setting the tier by hand; each tier is measured over ~3 s of play)
  const cdp = await p.target().createCDPSession();
  await p.setViewport({ ...VIEW, deviceScaleFactor: process.env.GPU ? 2.75 : 1 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  // (FR7 FIXES B — FR7-B's perfRun line: THE GAME LOOK PINNED to NIGHT — by day a calm phone CLIMBS 0 → 3 by design (tiers.js#stepTier), so a
  //  morning run read tier 0 back as 3 and the check went red on the test, not the game; night = the costliest look, measured as meant)
  await P(p, "import('/js/games/kit/look.js').then(m => m.saveLook('night'))");
  await P(p, "new Promise(r => setTimeout(r, 600))");
  const perf = [];
  for (const t of [3, 2, 1, 0]) {   // (PD-3: four tiers — the light steps down first, the board's 3× last)
    await P(p, `window.__prism.setTier(${t})`);
    await sleep(4200);
    const f = await P(p, 'window.__prism.fps()');
    const s2 = [...f].sort((a, b) => a - b);
    perf.push({ tier: t, after: await P(p, 'window.__prism.tier()'), p50: +s2[Math.floor(s2.length * 0.5)].toFixed(1), p95: +s2[Math.floor(s2.length * 0.95)].toFixed(1), n: s2.length });
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  log('frame pacing', JSON.stringify(perf));
  log('audio', JSON.stringify(await P(p, 'window.__prism.audio()')));
  writeFileSync(`${OUT}perf.json`, JSON.stringify(perf, null, 1));
  ok(perf.every(x => x.p50 <= 17.5 && x.after === x.tier), `PERF: ${CPU}× CPU — 60 fps median at every tier, no step-down (${perf.map(x => `t${x.tier}: p50 ${x.p50} / p95 ${x.p95} ms`).join(' · ')})`);
}

try {
  const host = await joinAll();
  if (process.env.PERF_ONLY) {
    await host.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'battle' })));
    await waitFor(host, s => s.game && s.game.phase === 'play', 'GO', 40000);
    await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__prism.engine() && window.__prism.engine().cur, { timeout: 15000 })));
    for (const i of alive()) await P(pages[i], `window.__prism.bot({ skill: 0.9, every: 140, seed: ${i + 3} })`);
    await sleep(Number(process.env.WARM || 3000));
    await perfRun(pages[alive().length - 1]);
    throw new Error('PERF_ONLY done');
  }

  // ---------------------------------------------------------------- the room dock's GAMES → PRISM DROP → its options (THE ROOM IN THE CITY)
  await host.waitForSelector('.rdk-games', { timeout: 20000 });
  await host.evaluate(() => document.querySelector('.rdk-games').click());
  await host.waitForSelector('.rc-games-sheet .rc-game[data-game="prism"]', { timeout: 8000 });
  await sleep(500);
  await shotBoth(host, 'pd-00-games');
  await host.evaluate(() => document.querySelector('.rc-games-sheet .rc-game[data-game="prism"]').click());
  await host.waitForSelector('.sh.options', { timeout: 8000 });
  await sleep(500);
  ok(await host.evaluate(() => !!document.querySelector('.sh.options .btn-primary') && /PRISM/i.test(document.querySelector('.sh.options .sh-t b').textContent)), 'THE ROOM: GAMES → PRISM DROP opens its options (INITIATE)');
  await shotBoth(host, 'pd-01-options');
  await host.evaluate(() => { const x = document.querySelector('.sh:not(.is-out) .sh-x'); if (x) x.click(); });
  await sleep(500);

  // ================================================================ MATCH A — BATTLE
  await host.evaluate(() => { localStorage.setItem('ns:look', 'night'); window.dispatchEvent(new CustomEvent('ns-look', { detail: 'night' })); });   // (PD-5A: the night set — AUTO would follow this machine's clock)
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'battle' })));
  await waitFor(host, s => s.game && s.game.id === 'prism' && s.game.phase === 'count', 'count phase');
  const gA = await game(host);
  log('songs', gA.songs.join(','), 'go in', gA.playStartAt - gA.songStartAt, 'ms of song');
  ok(gA.songs.length >= 2 && gA.songs.every(Boolean), 'BATTLE: a playlist of songs is dealt for the match');
  ok(gA.set === 'night' && gA.songs.every(id => /^prism\d$/.test(id)) && !gA.cu, `THE HOST's SET: a NIGHT host deals the night set — unchanged (${gA.set}: ${gA.songs.join(', ')})`);
  await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__prism && window.__prism.world() && window.__prism.clock() && window.__prism.clock().doc, { timeout: 20000 }).catch(async e => {
    const d = await pages[i].evaluate(() => { try { const p = window.__prism; return p ? { world: p.world(), clock: !!p.clock(), doc: !!(p.clock() && p.clock().doc), audio: p.audio() } : 'no hook'; } catch (err) { return 'ERR ' + err.message; } });
    throw new Error(`${NAMES[i]}: world not ready ${JSON.stringify(d)}`);
  })));
  const worlds = await Promise.all(alive().map(i => P(pages[i], 'JSON.stringify(window.__prism.world())')));
  ok(new Set(worlds).size === 1, `BATTLE: every phone shows the same world + variant (${worlds[0]})`);
  await sleep(1200);
  await cleanText(host, 'countdown');
  await shotBoth(host, 'pd-02-count');
  // the 3-2-1 lands on beats
  await waitFor(host, s => s.game.phase === 'play', 'GO', 30000);
  await Promise.all(alive().map(i => pages[i].waitForFunction(() => window.__prism.engine() && window.__prism.engine().cur, { timeout: 15000 })));
  const firstQ = await Promise.all(alive().map(i => P(pages[i], '(() => { const e = window.__prism.engine(); return [e.cur.t, ...Array.from({length: 5}, (_, k) => 0)].join() + "|" + e.seed; })()')));
  ok(new Set(firstQ).size === 1, 'BATTLE: identical first piece + seed on every phone');
  const seqs = await Promise.all(alive().map(i => P(pages[i], `(async () => { const E = await import('/js/games/prism/engine.js'); const e = window.__prism.engine(); return Array.from({ length: 40 }, (_, k) => E.pieceAt(e.seed, k)).join(''); })()`)));
  ok(new Set(seqs).size === 1, 'BATTLE: the 7-bag sequence is identical across clients');
  const logA = await P(host, 'window.__prism.synthLog()');
  const go = logA.filter(x => x.name === 'count' || x.name === 'go');
  const ctxState = await P(host, `import('/js/audio/engine.js').then(m => m.getContext() && m.getContext().state)`);
  ok(go.length >= 1, `AUDIO: countdown ticks scheduled (${go.map(x => x.name).join(',')}; audio ${ctxState}; log ${logA.length})`);

  // ---------------------------------------------------------------- real gestures on ALICE's phone
  const A = host;
  const lay = await P(A, 'window.__prism.layout()');
  const cell = lay.cell;
  const bx = lay.board.x + lay.board.width / 2, by = lay.board.y + lay.board.height * 0.45;
  let e0 = await engOf(A);
  // drag right three columns at a natural pace
  await touch(A, line(bx - 30, by, bx - 30 + cell * 0.95 * 3, by, 12), 14);
  let e1 = await engOf(A);
  ok(e1.n === e0.n && e1.cur.x - e0.cur.x === 3, `GESTURE: a drag of 3 cells moves the piece exactly 3 columns (${e1.cur.x - e0.cur.x})`);
  // tap right half = clockwise, left half = counter-clockwise
  await touch(A, [[300, by], [300, by]], 30);
  const e2 = await engOf(A);
  ok(e2.cur.r === (e1.cur.r + 1) % 4 || e2.cur.t === 2, 'GESTURE: tap on the right half rotates clockwise');
  await touch(A, [[80, by], [80, by]], 30);
  const e3 = await engOf(A);
  ok(e3.cur.r === e1.cur.r || e3.cur.t === 2, 'GESTURE: tap on the left half rotates back (counter-clockwise)');
  // slow drag down: soft drop, no hard drop
  const yBefore = e3.cur.y;
  await touch(A, line(bx, by - 60, bx, by - 60 + cell * 3.2, 24), 45);
  const e4 = await engOf(A);
  ok(e4.n === e3.n && yBefore - e4.cur.y >= 2, `GESTURE: a slow drag down soft-drops (${yBefore - e4.cur.y} rows), no hard drop`);
  // flick down: hard drop (counted from the hard-drop sound: the soft-dropped piece may have landed on its own by now)
  // (SHELL 2.0 B1: since 9acac61 the flick SLAMS only with SWIPE-DOWN SLAM on (settings.prismFlick — off by default: the SLAM button
  //  drops); this check had never run on the new default — the E2E stopped at the old lobby. By default a flick never hard-drops; on, it does.)
  const hardN = () => P(A, "window.__prism.synthLog().filter(x => x.name === 'hard').length");
  const hard00 = await hardN();
  await touch(A, line(bx, by - 80, bx + 4, by - 80 + cell * 4, 5), 12);
  const hardOff = (await hardN()) - hard00;
  await P(A, "import('/js/audio/settings.js').then(m => { m.updateSettings({ prismFlick: true }); return 1; })");
  await sleep(150);
  const hard0 = await hardN();
  await touch(A, line(bx, by - 80, bx + 4, by - 80 + cell * 4, 5), 12);
  const e5 = await engOf(A);
  const hard1 = await hardN();
  await P(A, "import('/js/audio/settings.js').then(m => { m.updateSettings({ prismFlick: false }); return 1; })");
  ok(hardOff === 0 && hard1 === hard0 + 1, `GESTURE: a fast flick down never slams by default (${hardOff}); with SWIPE-DOWN SLAM on it hard-drops (${hard1 - hard0})`);
  // swipe up: hold
  await touch(A, line(bx, by + 40, bx + 2, by + 40 - cell * 3.2, 6), 16);
  const e6 = await engOf(A);
  ok(e6.hold && e6.hold === e5.cur.t, 'GESTURE: a swipe up holds the piece');
  // sideways swipes with downward drift: never a hard drop (counted from the hard-drop sound, so a piece that
  // simply lands on its own doesn't count; starts from a fresh piece at the top)
  await P(A, "window.__prism.act({ a: 'hard' })");
  await sleep(150);
  const hards = () => P(A, "window.__prism.synthLog().filter(x => x.name === 'hard').length");
  let accidental = 0;
  for (let k = 0; k < 8; k++) {
    const before = await hards();
    const dir = k % 2 ? -1 : 1;
    await touch(A, line(bx - dir * 50, by, bx + dir * 70, by + 26, 7), 9);
    if ((await hards()) !== before) accidental++;
  }
  ok(accidental === 0, `GESTURE: 8 fast sideways swipes with downward drift, ${accidental} accidental hard drops`);
  await shotBoth(A, 'pd-03-play');
  // (PD-1 — THE MAX BOARD: the board under the corner row, the rail beside it (one tile per opponent), the red SLAM at the rail's foot clear of the board, HOLD + NEXT inside its top corners)
  {
    const L = await P(A, 'window.__prism.layout()');
    const vw = await A.evaluate(() => innerWidth);
    const inside = (a, b) => a && b && a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1;
    ok(L.board.top >= 52 && L.rail.left >= L.board.right + 4 && L.rail.right <= vw && L.tiles.length === N - 1, `LAYOUT: board + rail (${L.tiles.length} tiles), cell ${L.cell.toFixed(2)} pt at ${L.dpr}×`);
    ok(L.slamBtn && L.slamBtn.left >= L.board.right + 3 && L.slamBtn.bottom <= L.board.bottom + 4 && L.slamBtn.width >= 36, `LAYOUT: SLAM at the rail's foot, clear of the board (${JSON.stringify(L.slamBtn && { l: Math.round(L.slamBtn.left), w: Math.round(L.slamBtn.width) })})`);
    ok(inside(L.hold, L.board) && inside(L.next, L.board) && L.hold.right < L.next.left, "LAYOUT: HOLD + NEXT float inside the board's top corners");
    await P(A, "import('/js/audio/settings.js').then(m => { m.updateSettings({ prismSlam: 'left' }); return 1; })");
    await sleep(200);
    const L2 = await P(A, 'window.__prism.layout()');
    await P(A, "import('/js/audio/settings.js').then(m => { m.updateSettings({ prismSlam: 'right' }); return 1; })");
    ok(L2.slam === 'left' && L2.rail.right <= L2.board.left - 4 && L2.slamBtn.right <= L2.board.left - 3, "LAYOUT: the LEFT setting mirrors the rail + SLAM to the board's left");
    await sleep(200);
    const L3 = await P(A, 'window.__prism.layout()');
    const sx = L3.slamBtn.left + L3.slamBtn.width / 2, sy = L3.slamBtn.top + L3.slamBtn.height / 2;
    const h0 = await P(A, "window.__prism.synthLog().filter(x => x.name === 'hard').length");
    await touch(A, [[sx, sy], [sx, sy]], 40);
    await sleep(150);
    const h1 = await P(A, "window.__prism.synthLog().filter(x => x.name === 'hard').length");
    ok(h1 === h0 + 1, `SLAM: a tap on the red button hard-drops the piece (${h1 - h0})`);
  }

  // ---------------------------------------------------------------- PD-2: AUTO-TARGET, THE RISING GHOST ROWS, BLOCKED!
  {
    const clean = await A.evaluate(() => ({ btn: !!document.querySelector('.pd [class*="target"]:not(.pd-tile)'), bar: !!document.querySelector('.pd-meter'), word: /TARGET/i.test(document.querySelector('.pd').innerText) }));
    ok(!clean.btn && !clean.bar && !clean.word, `AUTO-TARGET: no target button, no target word, no red bar (${JSON.stringify(clean)})`);
    await P(A, `window.__prism.incoming(3, ${JSON.stringify(uids[1])}, 60000)`);
    await sleep(400);
    const gh = await P(A, 'window.__prism.ghost()');
    ok(gh.rows >= 1 && /^INCOMING 3 · BOB$/.test(gh.tag) && gh.bands && gh.bands[0].kind === 'junk' && !gh.bands[0].hot, `GHOST ROWS: incoming junk rises as ghost rows + its tag ("${gh.tag}", ${gh.rows} row(s) shown)`);
    await shotBoth(A, 'pd-03b-incoming');
    await P(A, 'window.__prism.counter(3)');
    await sleep(250);
    const co = await P(A, 'window.__prism.callouts()');
    const gh2 = await P(A, 'window.__prism.ghost()');
    ok(co.some(t => /^BLOCKED!/.test(t)) && !gh2.tag && !gh2.bands, `CALLOUTS: a clear that cancels incoming → BLOCKED! + the ghost rows go (${co.slice(-2).join(' | ')})`);
  }

  // ---------------------------------------------------------------- PD-3 + PD-4: THE GAME LOOK switched LIVE on one phone: NIGHT = the neon tubes + the
  // light layer (a SLAM + a 4-line clear light it), DAY = THE CRAYON LOOK (PD-4: the page on, the world + the light layer off, the crayon moments); both
  // switches smooth (no frame over 100 ms); THE PAPER = the host's deal, the SAME page on every phone of the match
  {
    const setLook = l => A.evaluate(v => { localStorage.setItem('ns:look', v); window.dispatchEvent(new CustomEvent('ns-look', { detail: v })); }, l);
    await setLook('night');
    await waitFor(A, () => document.body.dataset.look === 'night' && window.__prism.look().look === 'neon', 'the night look');
    const n0 = await P(A, 'window.__prism.look()');
    const dom = await A.evaluate(() => ({ look: document.querySelector('.pd').dataset.look, edge: getComputedStyle(document.querySelector('.pd')).getPropertyValue('--pd-edge').trim(), canvas: !!document.querySelector('.pd-light') }));
    await P(A, 'window.__prism.fire("slam")');
    await P(A, 'window.__prism.fire("clear", { lines: 4, combo: 2 })');
    await sleep(120);
    const n1 = await P(A, 'window.__prism.look()');
    ok(n0.light && dom.look === 'neon' && dom.canvas && /^#/.test(dom.edge) && n1.lit > 0 && n1.visible, `NIGHT LOOK: neon tubes in the world's palette (${n0.pal}, edge ${dom.edge}) + the light layer lit by a SLAM + a 4-line clear (${n1.lit} light(s), ${n1.size && n1.size.join('×')})`);
    await sleep(900);
    // night → day, live: the longest frame across the switch
    await waitFor(A, () => window.__prism.look().warm, 'the crayon sprites warmed', 15000);
    await P(A, 'window.__prism.record(true)');
    await setLook('day');
    await waitFor(A, () => document.body.dataset.look === 'day' && window.__prism.look().look === 'crayon', 'the day look');
    await sleep(700);
    const swD = await P(A, 'window.__prism.record(false)');
    const d1 = await P(A, 'window.__prism.look()');
    const dd = await A.evaluate(() => { const r = document.querySelector('.pd'), cs = n => getComputedStyle(document.querySelector(n)); return { look: r.dataset.look, page: cs('.pd-page').display, world: cs('.pd-world').visibility, paper: r.dataset.paper, ink: getComputedStyle(r).getPropertyValue('--pd-ink').trim() }; });
    ok(d1.look === 'crayon' && !d1.visible && dd.page === 'block' && dd.world === 'hidden' && /^#/.test(dd.ink) && d1.paper === dd.paper,
      `DAY LOOK: THE CRAYON LOOK live — the page on (${dd.paper}), the world + the light layer off (${JSON.stringify({ look: d1.look, page: dd.page, world: dd.world, light: d1.visible })})`);
    const worst = a => Math.max(0, ...a);
    ok(worst(swD.f) <= 100, `DAY LOOK: the switch night → day is smooth (the longest frame ${worst(swD.f).toFixed(0)} ms over ${swD.f.length} frames)`);
    await P(A, 'window.__prism.fire("slam")');
    await P(A, 'window.__prism.fire("clear", { lines: 4, combo: 2 })');
    await sleep(100);
    const d2 = await P(A, 'window.__prism.look()');
    ok(d2.crayonBusy && !d2.visible, `DAY LOOK: a SLAM + a 4-line clear play the crayon moments on the board (the light layer stays off)`);
    await shotBoth(A, 'pd-04-day');
    // the paper: the host's deal — the same page on every phone of the match
    const papers = [];
    for (const i of alive()) papers.push(await pages[i].evaluate(() => { const g = window.__arcade.state.game; return { pp: g && g.pp, el: document.querySelector('.pd') && document.querySelector('.pd').dataset.paper }; }));
    const PIDS = ['notepad', 'graph', 'construction', 'coloring'];
    ok(papers.every(x => Number.isInteger(x.pp) && x.pp === papers[0].pp && x.el === PIDS[x.pp]), `THE PAPER: the host dealt ${PIDS[papers[0].pp]} — the same page on all ${papers.length} phones (${papers.map(x => x.el).join(', ')})`);
    // day → night, live
    await sleep(600);
    await P(A, 'window.__prism.record(true)');
    await setLook('night');
    await waitFor(A, () => window.__prism.look().look === 'neon', 'the night look again');
    await sleep(700);
    const swN = await P(A, 'window.__prism.record(false)');
    ok(worst(swN.f) <= 100, `NIGHT LOOK: the switch day → night is smooth (the longest frame ${worst(swN.f).toFixed(0)} ms over ${swN.f.length} frames)`);
  }

  // ---------------------------------------------------------------- FAST=1 (SHELL 2.0 B1): two phones — the battle to its end, the
  // results, the walk back out to the ROOM IN THE CITY (the full path below needs 8: the host killed, the late joiner, the call)
  if (FAST) {
    await P(A, 'window.__prism.bot({ skill: 0.95, every: 140, seed: 1 })');
    await P(pages[1], 'window.__prism.bot({ skill: 0.4, every: 260, seed: 2 })');
    await sleep(6000);
    const tA = await P(A, 'window.__prism.target()');
    ok(tA.target === uids[1], `AUTO-TARGET: two players — ALICE's attacks go to BOB with no button (${tA.target && NAMES[idx(tA.target)]})`);
    await refreshAttackCheck(1);
    await awayCheck(1);
    const ko = await P(pages[1], 'window.__prism.ko()');
    ok(/^KO/.test(ko) && /2ND PLACE/.test(ko), `KO CARD: on BOB's board — KO, how, the place ("${ko}")`);
    await waitFor(A, s => s.game.phase === 'end' || s.game.phase === 'final', 'FAST: the battle over', 60000);
    await waitFor(A, s => s.game.phase === 'final', 'FAST: the results', 30000);
    const gF = await game(A);
    ok(gF.winner === uids[0], `FAST: ${NAMES[0]} is the last one standing (2 phones)`);
    await A.waitForSelector('.final .pd-fs', { timeout: 15000 }).catch(() => {});
    // (PD-1 — THE CONSOLE'S PODIUM: the frame's BACK TO THE ROOM + PRISM's body only — the winning board + the top 3 as slim cards, the frame's list from 4th)
    const fin = await A.evaluate(() => ({ back: !!document.querySelector('.final .final-back'), body: !!document.querySelector('.final .pd-fs .pd-fs-moment'), top: document.querySelectorAll('.final .pd-fs .pd-fs-top > li').length, accent: document.querySelector('.final.has-accent') ? getComputedStyle(document.querySelector('.final')).getPropertyValue('--fin').trim() : '' }));
    ok(fin.back && fin.body && fin.top === 2 && /8fd8ff/i.test(fin.accent), `FAST: the podium = the console's frame + PRISM's body (${JSON.stringify(fin)})`);
    ok(Object.values(gF.results).every(r => typeof r.pc === 'number' && typeof r.ko === 'number'), `RESULTS: every row records KOs + perfect clears for PD-5's cards (${JSON.stringify(Object.values(gF.results).map(r => ({ ko: r.ko, pc: r.pc, dz: r.dz || 0 })))})`);
    await cleanText(A, 'final');
    await A.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
    await waitFor(A, s => s.meta.status === 'lobby' && !s.game, 'FAST: back in the room', 30000);
    await A.waitForSelector('.title-screen.is-room .rdk-dock', { timeout: 30000 });
    ok(true, 'FAST: back in THE ROOM IN THE CITY (the room dock)');
    await soundChecks();
    await survivalAndSolo();
    throw new Error('FAST done');
  }

  // ---------------------------------------------------------------- bots + battle
  // CHARLIE plays best (the test lets them win and calls it); everyone else is human-ish
  const skills = [0.85, 0.8, 0.98, 0.7, 0.6, 0.75, 0.65, 0.55];
  // human-ish pace (a few moves a second), so the battle lasts long enough to test knockouts and calls
  for (const i of alive()) await P(pages[i], `window.__prism.bot({ skill: ${skills[i]}, every: ${i === 0 ? 160 : 220 + i * 15}, seed: ${i + 1} })`);
  // AUTO-TARGET (PD-2): a living opponent with no button — and whoever hits you is who you hit back
  await sleep(9000);
  const tgt = await P(pages[1], 'window.__prism.target()');
  ok(tgt.target && tgt.target !== uids[1], `AUTO-TARGET: BOB's attacks have a target with no button (${tgt.target && NAMES[idx(tgt.target)]})`);
  // a junk attack: wait until someone has sent lines and someone received them
  await waitFor(host, s => Object.values((s.live && s.live.boards) || {}).some(b => (b.se || 0) > 0), 'someone sent junk', 90000);
  ok(true, 'BATTLE: line clears send junk');
  const recv = await Promise.all(alive().map(i => P(pages[i], `(() => { const l = window.__prism.synthLog(); return l.some(x => x.name === 'incoming'); })()`)));
  ok(recv.some(Boolean), 'BATTLE: incoming junk reaches a phone (warning sound + ghost rows)');
  {
    // whoever was hit last hits back: the most recent attacker still alive is the target
    const gT = await game(anyPage());
    const back = await Promise.all(alive().map(i => P(pages[i], 'window.__prism.target()')));
    const hit = back.map((t, k) => ({ t, k })).filter(x => x.t.hitBy && x.t.hitBy.length);
    const right = hit.filter(({ t }) => { const a = t.hitBy.find(u => !(gT.out && gT.out[u])); return !a || t.target === a; });
    ok(hit.length >= 1 && right.length === hit.length, `AUTO-TARGET: a phone that was hit targets its most recent attacker still alive (${right.length}/${hit.length})`);
  }
  await cleanText(pages[1], 'battle');
  await shotBoth(pages[1], 'pd-04-battle');

  // musical SFX: in the song's key, clears on the 16th grid
  const keyCheck = await P(host, `(async () => {
    const log = window.__prism.synthLog(); const c = window.__prism.clock(); const sc = window.__prism.scale();
    const notes = log.filter(x => ['move', 'rotate', 'lock', 'clear', 'count', 'hold', 'twist', 'level'].includes(x.name)).flatMap(x => x.notes.map(n => ({ n, key: x.key, mode: x.mode })));
    const S = { major: [0,2,4,5,7,9,11], minor: [0,2,3,5,7,8,10] };
    const bad = notes.filter(o => !S[o.mode].map(s => (o.key + s) % 12).includes(((o.n % 12) + 12) % 12));
    const clk = c.clk; const q = clk.period / 4;
    const clears = log.filter(x => x.name === 'clear' && x.songAt != null);
    const off = clears.map(x => { const bi = clk.indexAt(x.songAt + 1e-6); const d = (x.songAt - clk.timeOf(bi)) / q; return Math.abs(d - Math.round(d)) * q * 1000; });
    return { notes: notes.length, bad: bad.length, clears: clears.length, maxOffMs: off.length ? Math.max(...off) : 0, key: sc };
  })()`);
  ok(keyCheck.notes > 10 && keyCheck.bad === 0, `AUDIO: ${keyCheck.notes} musical notes, all in the song's key (${['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][keyCheck.key.tonic]} ${keyCheck.key.mode})`);
  ok(keyCheck.clears === 0 || keyCheck.maxOffMs < 2, `AUDIO: line-clear phrases land on the song's 16th notes (${keyCheck.clears} clears, max ${keyCheck.maxOffMs.toFixed(2)} ms off grid)`);
  const audio = await P(host, 'window.__prism.audio()');
  log('audio', JSON.stringify(audio));
  ok(audio.ready && audio.slots.some(s => s.id === gA.songs[0] && !s.paused), 'AUDIO: the match song plays through the PRISM chain');

  // ---------------------------------------------------------------- refresh mid-battle (BOB)
  const B = pages[1];
  await P(B, 'window.__prism.stopBot()');
  await sleep(3800); // a full save lands every 3 s
  const beforeB = await engOf(B);
  await B.reload();
  await B.waitForFunction(() => window.__prism && window.__prism.engine() && window.__prism.engine().cur, { timeout: 25000 });
  await touchTap(B); // a person picks the phone back up: the first touch unlocks its audio again
  const afterB = await engOf(B);
  ok(afterB.board === beforeB.board && afterB.score === beforeB.score && afterB.lines === beforeB.lines, `REJOIN: BOB's board, score and lines come back after a refresh (n ${beforeB.n} → ${afterB.n})`);
  await refreshAttackCheck(1);
  await P(B, 'window.__prism.bot({ skill: 0.85, every: 110, seed: 9 })');

  // ---------------------------------------------------------------- a song change mid-match (world transforms)
  const h0 = await hostIdx();
  const g1 = await game(pages[h0]);
  const w0 = await P(pages[h0], 'window.__prism.world()');
  const nextSong = await pages[h0].evaluate(async (c, g) => {
    const f = await import('/js/firebase.js'); const L = await import('/js/games/prism/logic.js');
    const now = f.serverNow(); const cur = L.songAt(g, now).i; const st = L.songStarts(g);
    await f.update(f.dbRef(`rooms/${c}/game`), { songStartAt: g.songStartAt - (st[cur + 1] - (now + 2000)) });
    return cur + 1;
  }, code, g1);
  await sleep(7500);
  const w1s = await Promise.all(alive().map(i => P(pages[i], '(() => { const w = window.__prism.world(); return JSON.stringify({ id: w.id, variant: w.variant }); })()')));
  const w1 = JSON.parse(w1s[0]);
  ok(new Set(w1s).size === 1 && (w1.id !== w0.id || w1.variant !== w0.variant || w1.mixing), `SONGS: the second song transforms the world on every phone (${w0.id}/${w0.variant} → ${w1.id}/${w1.variant})`);
  const a2 = await P(pages[h0], 'window.__prism.audio()');
  ok(a2.slots.some(s => s.id === g1.songs[nextSong] && s.t > 0 && s.gain > 0.3), `SONGS: the next song crossfades in (${JSON.stringify(a2.slots.map(s => [s.id, s.gain, s.t]))})`);
  await shotBoth(pages[3], 'pd-05-new-world');

  // ---------------------------------------------------------------- the host's phone dies
  const hk = await hostIdx();
  log('killing the host', NAMES[hk]);
  // (PD-5A: the bots' junk could top the host out in the instant before its phone "dies" — then it's out by a KO, not gone, and the check
  //  below never gets its case: its bot stops + its board is cleared first, so the 30-s disconnect is the only way out)
  await P(pages[hk], '(() => { window.__prism.stopBot(); const e = window.__prism.engine(); if (e) { e.cells.fill(0); e.pending.length = 0; } })()').catch(() => {});
  await sleep(400);
  // (PFIX-A — AWAY, in the same 30 s: a player who is neither the host nor the test's winner hides their tab while the host's phone is dead)
  let awayP = null;
  {
    const gNow = await game(anyPage());
    const awayV = alive().filter(i => i !== hk && i > 2 && !(gNow.out && gNow.out[uids[i]])).at(-1);
    const watchI = alive().find(i => i !== hk && i !== awayV);
    if (awayV != null && gNow.phase === 'play') awayP = awayCheck(awayV, watchI);
  }
  await pages[hk].close();
  dead.add(hk);
  await waitFor(anyPage(), (s, old) => s.meta.hostId && s.meta.hostId !== old, 'new host', 40000, uids[hk]);
  ok(true, `HOST: a new host took over after ${NAMES[hk]}'s phone died`);
  // > 30 s gone in battle = out
  await waitFor(anyPage(), (s, u) => !!(s.game.out && s.game.out[u]) || s.game.phase !== 'play', `${NAMES[hk]} counted out`, 60000, uids[hk]);
  const outHk = (await game(anyPage())).out[uids[hk]];
  ok(outHk && outHk.gone, `DISCONNECT: ${NAMES[hk]}, gone > 30 s, is out (no KO credit)`);
  if (awayP) await awayP;

  // ---------------------------------------------------------------- knockouts, Call the Winner, FINAL DUEL
  // let the bots fight; then knock players out until two are left, keeping CHARLIE (the caller's pick) alive
  const keepA = alive().find(i => i !== hk && i !== 1) ?? alive()[0];
  const keepB = alive().find(i => i !== keepA && i !== hk);
  let caller = null;
  for (let round = 0; round < 12; round++) {
    const g = await game(anyPage());
    if (g.phase !== 'play') break;
    const left = Object.keys(g.participants).filter(u => !(g.out && g.out[u]));
    if (left.length <= 2) break;
    const victim = left.map(idx).find(i => i !== keepA && alive().includes(i) && (left.length > 2));
    if (victim == null) break;
    await P(pages[victim], 'window.__prism.topOut()');
    await waitFor(anyPage(), (s, u) => !!(s.game.out && s.game.out[u]), `${NAMES[victim]} out`, 20000, uids[victim]);
    if (!caller) {
      caller = victim;
      await pages[victim].waitForSelector('.pd-call-pick', { timeout: 6000 });
      await sleep(300);
      await shot(pages[victim], 'pd-06-call');
      // call the player we'll let win
      const picks = await pages[victim].evaluate(name => { const all = [...document.querySelectorAll('.pd-call-pick')]; const b = all.find(x => x.textContent.includes(name)); if (b) { b.click(); return null; } return all.map(x => x.textContent); }, NAMES[keepA]);
      if (picks) log(`CALL: ${NAMES[keepA]} is not on ${NAMES[victim]}'s picker`, JSON.stringify(picks), JSON.stringify((await game(anyPage())).out));
      await sleep(600);
      const call = await evalIn(pages[victim], (s, u) => s.live && s.live.calls && s.live.calls[u], uids[victim]);
      ok(call && call.w === uids[keepA], `CALL THE WINNER: ${NAMES[victim]} called ${NAMES[keepA]} (locked in)`);
      await shotBoth(pages[victim], 'pd-07-spectate');
      // refresh after being knocked out: still out, spectating, the call still locked in (no second picker)
      await pages[victim].reload();
      await pages[victim].waitForSelector('.pd-spec-head', { timeout: 25000 });
      await sleep(1200);
      const head = await pages[victim].evaluate(() => document.querySelector('.pd-spec-head').textContent);
      const picker = await pages[victim].$('.pd-call-pick');
      ok(/YOUR CALL/.test(head) && head.includes(NAMES[keepA]) && !picker, `REJOIN: a knocked-out player who refreshes keeps spectating with their call ("${head}")`);
    }
    await sleep(800);
  }
  ok(caller != null, 'CALL THE WINNER: a knocked-out player got the picker (the battle was still on)');
  const gK = await game(anyPage());
  const kos = Object.values(gK.ko || {}).reduce((a, b) => a + b, 0);
  ok(kos === Object.values(gK.out).filter(o => o.by).length, `KO: credit recorded for every knockout with an attacker (${kos})`);
  const bdSum = Object.entries(gK.bd || {});
  ok(bdSum.every(([u, n]) => n >= (gK.ko[u] || 0)), `BADGES: every KO earned at least one badge (${JSON.stringify(gK.bd)})`);
  // the duel
  await waitFor(anyPage(), s => !!s.game.duelAt || s.game.phase !== 'play', 'FINAL DUEL', 20000);
  // both duelists play their best for a while, so the duel lasts long enough to look at
  // (PD-5A: two skill-1 bots made the duel a coin flip — it could end before the test's own top-out with the other winner; the test's winner
  //  plays its best, the other a little weaker + slower, so the duel lasts + ends the way the checks below expect)
  { const gd = await game(anyPage()); for (const u of Object.keys(gd.participants).filter(u => !(gd.out && gd.out[u]))) if (alive().includes(idx(u))) await P(pages[idx(u)], idx(u) === keepA ? `window.__prism.bot({ skill: 1, every: 120, seed: 41 })` : `window.__prism.bot({ skill: 0.7, every: 240, seed: 42 })`); }
  ok(!!(await game(anyPage())).duelAt, 'FINAL DUEL: triggered when two are left');
  // (PD-5A: the spectator's view read AT the duel's start — two skill-1 bots can end a duel in ~6 s, and a reading after the shots below
  //  found "CHARLIE WINS" instead: a race in the test, the view itself right; waits up to 3 s for it while the battle is still on)
  let spDuel = null;
  if (caller != null) {
    for (let k = 0; k < 15; k++) {
      spDuel = await P(pages[caller], 'window.__prism.spec()');
      if (spDuel.on && spDuel.lead.length === 2 && /DUEL SOON/.test(spDuel.head)) break;
      if ((await game(anyPage())).phase !== 'play') break;
      await sleep(200);
    }
  }
  await pages[keepA].waitForSelector('.pd-title', { timeout: 6000 }).catch(() => {});
  await sleep(300);
  await shot(pages[keepA], 'pd-08-duel-title');
  await sleep(2600);
  await cleanText(pages[keepA], 'duel');
  await shotBoth(pages[keepA], 'pd-09-duelist');
  if (caller != null) {
    await shotBoth(pages[caller], 'pd-10-spectator-duel');
    const sp = spDuel;
    ok(sp.on && sp.lead.length === 2 && /DUEL SOON/.test(sp.head), `SPECTATE: the two left BIG side by side + DUEL SOON ("${sp.head}", ${sp.field} more on the line)`);
  }
  const lift = await P(pages[keepA], 'window.__prism.audio()');
  ok(lift.lift > 1.05, `FINAL DUEL: the music lifts (${lift.lift})`);
  // end it: the other duelist tops out -> keepA wins
  const gD = await game(anyPage());
  const other = Object.keys(gD.participants).find(u => !(gD.out && gD.out[u]) && u !== uids[keepA]);
  if (other && alive().includes(idx(other))) await P(pages[idx(other)], 'window.__prism.topOut()');
  await waitFor(anyPage(), s => s.game.phase === 'end' || s.game.phase === 'final', 'battle over', 30000);
  await sleep(900);
  await shotBoth(pages[keepA], 'pd-11-victory');
  await waitFor(anyPage(), s => s.game.phase === 'final', 'results', 30000);
  const gF = await game(anyPage());
  ok(gF.winner === uids[keepA], `BATTLE: ${NAMES[keepA]} is the last one standing`);
  if (caller != null) ok(gF.calls && gF.calls[uids[caller]] && gF.calls[uids[caller]].ok && gF.calls[uids[caller]].bonus > 0, `CALL THE WINNER: the right call earns ${gF.calls[uids[caller]] && gF.calls[uids[caller]].bonus} game-night points`);
  const night = await evalIn(anyPage(), (s, m) => s.night && s.night[m], gF.matchId);
  if (caller != null) ok(night && night.b && Object.keys(night.b).length >= 1, `GAME NIGHT: the bonus is on the scoreboard (${JSON.stringify(night && night.b)})`);
  await sleep(3200);
  await shotBoth(pages[keepA], 'pd-12-final');
  await pages[keepA].evaluate(() => { const x = document.querySelector('.final .final-back'); if (x) x.scrollIntoView({ block: 'center' }); });
  await sleep(400);
  await shotBoth(pages[keepA], 'pd-13-results');

  // ================================================================ MATCH B — SCORE RUSH
  if (process.env.RUSH !== '0') {
    const plBefore = await evalIn(anyPage(), s => s.meta.prism);
    const h = pages[await hostIdx()];
    await h.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
    await waitFor(h, s => s.meta.status === 'lobby', 'lobby', 15000);
    // (PD-5A: the host may have changed — its look picks the set; pinned to NIGHT here: this checks the night playlist moving on after Match A)
    await h.evaluate(() => { localStorage.setItem('ns:look', 'night'); window.dispatchEvent(new CustomEvent('ns-look', { detail: 'night' })); });
    await h.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'rush' })));
    await waitFor(h, s => s.game && s.game.phase === 'count' && s.game.settings.mode === 'rush', 'rush count');
    const gR = await game(h);
    ok(gR.set === 'night', `THE HOST's SET: the NEW host's look picks the next match's set (${gR.set})`);
    const expect = await h.evaluate(async (seed, n) => { const L = await import('/js/games/prism/logic.js'); const S = await import('/js/games/prism/songs.js'); const ids = (await S.loadManifest()).filter(x => L.setOfSong(x) === 'night').map(x => x.id); return L.playlistAt(seed, n, ids); }, plBefore.seed, plBefore.n);
    ok(gR.songs[0] === expect && gR.songs[0] !== gA.songs[1], `PLAYLIST: the next match plays the next song of the room playlist (${gR.songs[0]}, position ${plBefore.n})`);
    ok(gR.endAt - gR.songStartAt > 60_000, `SCORE RUSH: the match is one song long (${Math.round((gR.endAt - gR.songStartAt) / 1000)} s, ends on its final beat)`);
    await waitFor(h, s => s.game.phase === 'play', 'rush GO', 30000);
    for (const i of alive()) await P(pages[i], `window.__prism.bot({ skill: ${skills[i]}, every: 120, seed: ${i + 20} })`);
    await sleep(8000);
    await cleanText(h, 'score rush');
    await shotBoth(h, 'pd-14-rush');
    // a top out reboots the board, the score stays
    const r = pages[alive()[1]];
    const sc0 = (await engOf(r)).score;
    await P(r, 'window.__prism.stopBot(); window.__prism.topOut()');
    await sleep(500);
    await shot(r, 'pd-15-reboot');
    await sleep(1600);
    const re = await engOf(r);
    ok(!re.over && re.score >= sc0 && re.cur, `SCORE RUSH: a top-out reboots the board and keeps the score (${sc0} → ${re.score})`);
    await P(r, 'window.__prism.bot({ skill: 0.8, every: 120, seed: 77 })');
    // jump to the end of the song (host moves the clock), so the test doesn't wait a whole song
    const hr = pages[await hostIdx()];
    await touchTap(hr); // this phone's player has touched the screen (sound unlocks on the first tap)
    const gNow = await game(hr);
    const now = await hr.evaluate(async () => (await import('/js/firebase.js')).serverNow());
    const shift = gNow.endAt - (now + 9000);
    await hr.evaluate(async (c, g, s) => { const f = await import('/js/firebase.js'); await f.update(f.dbRef(`rooms/${c}/game`), { songStartAt: g.songStartAt - s, playStartAt: g.playStartAt - s, endAt: g.endAt - s }); }, code, gNow, shift);
    await waitFor(hr, s => s.game.phase === 'end', 'rush end', 30000);
    const fin = await P(hr, `window.__prism.synthLog().some(x => x.name === 'finale')`);
    ok(fin, 'SCORE RUSH: the finale plays on the final beat');
    await sleep(600);
    await shotBoth(hr, 'pd-16-finale');
    await waitFor(hr, s => s.game.phase === 'final', 'rush results', 20000);
    const gRF = await game(hr);
    const rows = await hr.evaluate(async g => (await import('/js/games/prism/logic.js')).standings(g), gRF);
    ok(rows.every((x, i) => i === 0 || rows[i - 1].score >= x.score), `SCORE RUSH: results by score (${rows.map(x => x.score).join(' > ')})`);
    await sleep(3200);
    await shotBoth(hr, 'pd-17-rush-final');
  }

  await soundChecks();
  await survivalAndSolo();

  // ---------------------------------------------------------------- the settings sheet (controls)
  const s0 = anyPage();
  await s0.evaluate(() => document.querySelector('.gear').click());
  await sleep(500);
  await s0.evaluate(() => document.querySelector('.settings .set-sub') && [...document.querySelectorAll('.set-sub')].find(x => x.textContent.includes('PRISM')).scrollIntoView({ block: 'center' }));
  await sleep(300);
  await shotBoth(s0, 'pd-18-settings');
} catch (e) {
  // (PFIX-B — optional 22: the FAST / PERF_ONLY end is the run's planned stop, not a failure — no "FAILED FAST done" on a pass)
  if (e.message !== 'PERF_ONLY done' && e.message !== 'FAST done') { errors.push(`FATAL ${e.message}`); log('FAILED', e.message); }
}

// PFIX-B — THE NEW RULES: an honest phone never sends a board write the rules refuse (the view writes only inside their window — boardWritable);
// the only refused attack is the REFRESH step's deliberate replay of one piece
{
  const board = refusedWrites.filter(t => /rooms\/\*\/prism\/|prismcall/.test(t));
  ok(board.length === 0, `THE RULES: no board write refused (${board.length ? board.join(' · ') : 'none'}; refused attacks: ${refusedWrites.filter(t => /prismq/.test(t)).length} — the REFRESH replay)`);
}
const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed`);
log(errors.length || passed < checks.length ? 'FAILED' : 'PASSED');
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
writeFileSync(`${OUT}result.json`, JSON.stringify({ checks, errors }, null, 1));
await browser.close();
process.exit(errors.length ? 1 : 0);
