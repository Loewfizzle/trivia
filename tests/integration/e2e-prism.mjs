// PRISM DROP end to end with N players (default 8), each in their own browser context.
//   node e2e-prism.mjs "<browser path>" ./shots-prism        (env N=8, SHOTS=0, RUSH=0 to skip Score Rush, CPU=4)
// Match A — BATTLE: lobby card + options; the same song / world / piece order on every phone; real touch gestures
//   (drag 3 columns, tap rotate both ways, slow soft drop, flick = hard drop, swipe up = hold); bots play; real junk
//   attacks arrive and land; targeting modes; refresh mid-battle (board restored); the host's phone dies (a new host
//   carries on); a player gone > 30 s is out; knockouts with KO credit + badges; Call the Winner (a right call earns
//   game-night points); FINAL DUEL; a song change mid-match (world transforms, audio follows); musical SFX in the
//   song's key and on its 16th-note grid; frame pacing at every quality tier under CPU throttling; results.
// Match B — SCORE RUSH: the next song of the room playlist; live leaderboard; a top-out reboots the board (score
//   kept); the finale on the final beat; results by score.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-prism').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const N = Number(process.env.N || 8);
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

async function openPlayer(i, qs = '') {
  const ctx = ctxs[i] || (ctxs[i] = await browser.createBrowserContext());
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'warning' && /game view/.test(m.text())) errors.push(`game view failed to load: ${m.text()}`); });
  page.on('pageerror', e => { errors.push(`${NAMES[i]} pageerror: ${e.message}`); log(`${NAMES[i]} PAGEERROR`, e.message); });
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
  await host.waitForSelector('.title-actions .btn-primary', { timeout: 20000 });
  for (let k = 0; k < 5 && !(await host.$('.setup-screen input.input')); k++) {
    await host.click('.title-actions .btn-primary').catch(() => {});
    await host.waitForSelector('.setup-screen input.input', { timeout: 6000 }).catch(() => {});
  }
  await host.type('.setup-screen input.input', NAMES[0]);
  await host.click('.form-cta .btn-primary');
  await host.waitForSelector('.lobby-screen .room-code', { timeout: 20000 });
  code = await evalIn(host, s => s.code);
  log('room', code);
  for (let i = 1; i < N; i++) {
    const p = await openPlayer(i, `room=${code}`);
    await p.waitForSelector('.invite-card', { timeout: 20000 });
    await p.waitForFunction(() => !document.getElementById('boot'), { timeout: 15000 });
    await p.click('.invite-card');
    await p.waitForSelector('.input-code');
    await p.type('.setup-screen input.input:not(.input-code)', NAMES[i]);
    await p.click('.form-cta .btn-primary');
    await p.waitForSelector('.lobby-screen', { timeout: 20000 });
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

async function perfRun(p) {
  // a mid-range phone stand-in: ${CPU}× CPU throttle, phone pixel density, every tier (the auto-step-down is
  // switched off by setting the tier by hand; each tier is measured over ~3 s of play)
  const cdp = await p.target().createCDPSession();
  await p.setViewport({ ...VIEW, deviceScaleFactor: process.env.GPU ? 2.75 : 1 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const perf = [];
  for (const t of [2, 1, 0]) {
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

  // ---------------------------------------------------------------- lobby card + options
  await host.evaluate(() => document.querySelector('.game-card[data-theme="prism"]').scrollIntoView({ block: 'center' }));
  await sleep(500);
  await shotBoth(host, 'pd-00-lobby-card');
  await host.evaluate(() => document.querySelector('.game-card[data-theme="prism"]').click());
  await host.waitForSelector('.modal .sheet.options', { timeout: 8000 });
  await sleep(500);
  await shotBoth(host, 'pd-01-options');
  await host.evaluate(() => document.querySelector('.modal .btn-text.btn-block').click());
  await sleep(400);

  // ================================================================ MATCH A — BATTLE
  await host.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'battle' })));
  await waitFor(host, s => s.game && s.game.id === 'prism' && s.game.phase === 'count', 'count phase');
  const gA = await game(host);
  log('songs', gA.songs.join(','), 'go in', gA.playStartAt - gA.songStartAt, 'ms of song');
  ok(gA.songs.length >= 2 && gA.songs.every(Boolean), 'BATTLE: a playlist of songs is dealt for the match');
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
  const hard0 = await P(A, "window.__prism.synthLog().filter(x => x.name === 'hard').length");
  await touch(A, line(bx, by - 80, bx + 4, by - 80 + cell * 4, 5), 12);
  const e5 = await engOf(A);
  const hard1 = await P(A, "window.__prism.synthLog().filter(x => x.name === 'hard').length");
  ok(hard1 === hard0 + 1, `GESTURE: a fast flick down hard-drops (${hard1 - hard0})`);
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

  // ---------------------------------------------------------------- bots + battle
  // CHARLIE plays best (the test lets them win and calls it); everyone else is human-ish
  const skills = [0.85, 0.8, 0.98, 0.7, 0.6, 0.75, 0.65, 0.55];
  // human-ish pace (a few moves a second), so the battle lasts long enough to test knockouts and calls
  for (const i of alive()) await P(pages[i], `window.__prism.bot({ skill: ${skills[i]}, every: ${i === 0 ? 160 : 220 + i * 15}, seed: ${i + 1} })`);
  // targeting modes
  await P(pages[1], "window.__prism.setTargetMode('danger')");
  await P(pages[2], "window.__prism.setTargetMode('attackers')");
  await sleep(9000);
  const tgt = await P(pages[1], 'window.__prism.target()');
  ok(tgt.mode === 'danger' && tgt.target, `TARGET: DANGER mode picks someone (${tgt.target && NAMES[idx(tgt.target)]})`);
  // a junk attack: wait until someone has sent lines and someone received them
  await waitFor(host, s => Object.values((s.live && s.live.boards) || {}).some(b => (b.se || 0) > 0), 'someone sent junk', 90000);
  ok(true, 'BATTLE: line clears send junk');
  const recv = await Promise.all(alive().map(i => P(pages[i], `(() => { const l = window.__prism.synthLog(); return l.some(x => x.name === 'incoming'); })()`)));
  ok(recv.some(Boolean), 'BATTLE: incoming junk reaches a phone (warning sound + meter)');
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
  await pages[hk].close();
  dead.add(hk);
  await waitFor(anyPage(), (s, old) => s.meta.hostId && s.meta.hostId !== old, 'new host', 40000, uids[hk]);
  ok(true, `HOST: a new host took over after ${NAMES[hk]}'s phone died`);
  // > 30 s gone in battle = out
  await waitFor(anyPage(), (s, u) => !!(s.game.out && s.game.out[u]) || s.game.phase !== 'play', `${NAMES[hk]} counted out`, 60000, uids[hk]);
  const outHk = (await game(anyPage())).out[uids[hk]];
  ok(outHk && outHk.gone, `DISCONNECT: ${NAMES[hk]}, gone > 30 s, is out (no KO credit)`);

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
      await pages[victim].evaluate(name => { const b = [...document.querySelectorAll('.pd-call-pick')].find(x => x.textContent.includes(name)); b.click(); }, NAMES[keepA]);
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
  { const gd = await game(anyPage()); for (const u of Object.keys(gd.participants).filter(u => !(gd.out && gd.out[u]))) if (alive().includes(idx(u))) await P(pages[idx(u)], `window.__prism.bot({ skill: 1, every: 120, seed: 41 })`); }
  ok(!!(await game(anyPage())).duelAt, 'FINAL DUEL: triggered when two are left');
  await pages[keepA].waitForSelector('.pd-title', { timeout: 6000 }).catch(() => {});
  await sleep(300);
  await shot(pages[keepA], 'pd-08-duel-title');
  await sleep(2600);
  await cleanText(pages[keepA], 'duel');
  await shotBoth(pages[keepA], 'pd-09-duelist');
  if (caller != null) await shotBoth(pages[caller], 'pd-10-spectator-duel');
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
  await pages[keepA].evaluate(() => document.querySelector('.pd-res').scrollIntoView({ block: 'center' }));
  await sleep(400);
  await shotBoth(pages[keepA], 'pd-13-results');

  // ================================================================ MATCH B — SCORE RUSH
  if (process.env.RUSH !== '0') {
    const plBefore = await evalIn(anyPage(), s => s.meta.prism);
    const h = pages[await hostIdx()];
    await h.evaluate(() => import('/js/host.js').then(m => m.backToLobby()));
    await waitFor(h, s => s.meta.status === 'lobby', 'lobby', 15000);
    await h.evaluate(() => import('/js/host.js').then(m => m.startGame('prism', { mode: 'rush' })));
    await waitFor(h, s => s.game && s.game.phase === 'count' && s.game.settings.mode === 'rush', 'rush count');
    const gR = await game(h);
    const expect = await h.evaluate(async (seed, n) => { const L = await import('/js/games/prism/logic.js'); const S = await import('/js/games/prism/songs.js'); const ids = (await S.loadManifest()).map(x => x.id); return L.playlistAt(seed, n, ids); }, plBefore.seed, plBefore.n);
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

  // ---------------------------------------------------------------- the settings sheet (controls)
  const s0 = anyPage();
  await s0.evaluate(() => document.querySelector('.gear').click());
  await sleep(500);
  await s0.evaluate(() => document.querySelector('.settings .set-sub') && [...document.querySelectorAll('.set-sub')].find(x => x.textContent.includes('PRISM')).scrollIntoView({ block: 'center' }));
  await sleep(300);
  await shotBoth(s0, 'pd-18-settings');
} catch (e) {
  if (e.message !== 'PERF_ONLY done') errors.push(`FATAL ${e.message}`);
  log('FAILED', e.message);
}

const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed`);
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
writeFileSync(`${OUT}result.json`, JSON.stringify({ checks, errors }, null, 1));
await browser.close();
process.exit(errors.length ? 1 : 0);
