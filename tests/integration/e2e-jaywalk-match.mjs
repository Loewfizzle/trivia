// JAYWALK H4 — THE MATCH end to end, on the emulators + scripts/serve.mjs --emu (NEVER THE LIVE SITE): three phones, ONE LIFE each.
//   · THE OWNER'S LIVE TEST: the owner hosts (the server's own yes — on the emulators testAdmins/{pid}); his guests play normally — they
//     can't start it, and they ARE counted
//   · 3 · 2 · 1 · GO: every phone writes its own GO; THE FIRST GO picks the course + tick 0 — the same seed + clock on all three
//   · THE GHOSTS: each phone steps the others' hop logs through the same engine — see-through kids, name tags; a ghost's run = that player's
//   · THE LIVE ORDER (the top corner) · two out early → the cause words → Call the Winner → WATCHING the leader (a tap = the next player)
//   · the last out ends it (the host's step) → the podium: the WINNER, everyone in order with their lanes + their cause line
//   · the results = THE JUDGE's replay — the SERVER's own (api/_lib/jaywalk.js#jaywalkMatch) agrees to the lane; the report is counted for
//     ALL THREE (the guests included); the call's game-night points on the night record
//   · a REMATCH: a new match, a new course; the finished match's proof nodes are still there
//   · --perf: a 4-player match (3 ghosts) at 390 × 844 @3 under a 4× CPU throttle
//   node tests/integration/e2e-jaywalk-match.mjs "<chromium>" [outDir] [--perf]
process.env.GPU = process.env.GPU || '1';   // (three.js: the real GPU path, as e2e-jaywalk)
const { createHarness } = await import('./kit/harness.mjs');
const { jaywalkMatch } = await import('../../api/_lib/jaywalk.js');
const { seedOf, firstGo, GO_LEAD_MS } = await import('../../js/games/jaywalk/logic.js');
const { CAUSE_LINES } = await import('../../js/games/jaywalk/causes.js');

const { installLag, setLag } = await import('./kit/lag.mjs');
const { matchStart } = await import('../../js/games/jaywalk/logic.js');

const PERF = process.argv.includes('--perf');
// H4B — `--lag[=ms]`: ONE phone on a slow line (every database frame held that long, each way): CHARLIE through the first match — his GO
// + his listener late, his hops late on the others' screens, theirs late on his — then THE HOST through the rematch's start.
const LAGARG = process.argv.find(a => /^--lag(=\d+)?$/.test(a)), LAG = LAGARG ? Number(LAGARG.split('=')[1] || 900) : 0;
// H4B — `--start`: THE START's measure — BOB's phone at 390 × 844 @3 under a 4× CPU throttle from the count to 3 s after GO (a cold scene)
const START = process.argv.includes('--start');
const OUTDIR = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : './shots-jaywalk-match';
const H = await createHarness({ name: 'jaywalk-match', slot: `jm${Date.now() % 10000}x`, hook: '__jwGame', sizes: [[390, 844]], out: OUTDIR, extraArgs: ['--enable-webgl', '--ignore-gpu-blocklist'], beforeLoad: installLag });
const { pages, log, ok, sleep, waitFor, evalIn, G, uids, NAMES } = H;
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb', AUTH = { Authorization: 'Bearer owner' };
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: AUTH }).then(r => r.json());
const dbPut = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PUT', headers: AUTH, body: JSON.stringify(v) }).then(r => r.json());
const pidFor = async uid => { for (let i = 0; i < 80; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return pid; await sleep(250); } return null; };
const state = p => G(p, 'window.__jwGame.state()');
const until = async (fn, ms = 30000, step = 150) => { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch { /* busy */ } await sleep(step); } return null; };
/** H4B's add-on — THE SHARE = THE PICTURE ONLY: tap `sel` with the share sheet stubbed → what was shared + the link's page + its picture */
async function shareLink(page, sel) {
  await page.evaluate(() => { window.__shared = []; navigator.share = async d => { window.__shared.push(d); }; navigator.canShare = () => true; });
  await page.evaluate(q => document.querySelector(q).click(), sel);
  let out = null;
  for (let i = 0; i < 100 && !(out && out.length); i++) { out = await page.evaluate(() => window.__shared); if (!(out && out.length)) await new Promise(r => setTimeout(r, 150)); }
  const d = (out && out[0]) || {}, url = d.url || '';
  const html = url ? await fetch(url, { redirect: 'manual' }).then(r => r.text()).catch(() => '') : '';
  const meta = k => (new RegExp(`<meta property="${k}" content="([^"]*)"`).exec(html) || [])[1] || '';
  const img = meta('og:image').replace(/&amp;/g, '&');
  const png = img ? Buffer.from(await fetch(img).then(r => r.arrayBuffer())) : Buffer.alloc(0);
  return { keys: Object.keys(d).sort(), url, code: (/[?&]s=([A-Za-z0-9_-]{12})/.exec(url) || [])[1] || '', title: meta('og:title'), img, go: (/url=([^"]*)"/.exec(html) || [])[1] || '',
    png: png.length > 24 && png.toString('latin1', 1, 4) === 'PNG' ? { w: png.readUInt32BE(16), h: png.readUInt32BE(20), bytes: png.length } : null, buf: png };
}
/** (the emulator stays clean for the other suites: every run card these phones uploaded — the end screens warm one each — is removed) */
async function dropRunCards(pids) {
  await new Promise(r => setTimeout(r, 2500));   // (an upload still on its way lands first)
  const all = (await dbGet('shr')) || {};
  for (const [code, c] of Object.entries(all)) if (c && pids.includes(c.p) && c.k === 'run') { await dbPut(`shr/${code}`, null); if (c.d) await dbPut(`shrx/${c.d}/${code}`, null); }
  for (const pid of pids) await dbPut(`shrp/${pid}:jaywalk`, null);
}
const CAUSES = new Set(Object.values(CAUSE_LINES));
const isCause = t => CAUSES.has(t) || /^TAKEN AT LANE \d+$/.test(t) || t === 'OUT';

/** start a JAYWALK match from the host's phone and wait for every phone's game screen */
async function start(host, n) {
  ok(await H.startGame(host, 'jaywalk', {}), 'the OWNER (host) starts JAYWALK');
  for (let i = 0; i < n; i++) await waitFor(pages[i], s => s.game && s.game.id === 'jaywalk' && !!window.__jwGame && !!document.querySelector('.jw-game canvas.jw-canvas'), `${NAMES[i]}: the match screen`, 40000);
}
const all = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(pages[i], i)));

let failed = false;
try {
  const N = 3;
  const host = await H.joinAll(N);
  const code = await evalIn(host, s => s.code);
  for (let i = 0; i < N; i++) await pages[i].setViewport({ ...H.VIEW, deviceScaleFactor: 2 });   // (the shots at @2)
  // ---- 1. THE OWNER'S LIVE TEST: only the owner's phone may start it; the guests' phones never offer it
  const pids = await Promise.all(uids.slice(0, N).map(pidFor));
  ok(pids.every(Boolean), 'every phone has its profile');
  ok(await host.evaluate(() => import('/js/host.js').then(m => m.startGame('jaywalk', {})).then(v => !v, () => true)) && !(await evalIn(host, s => s.game)), 'a plain host can NOT start JAYWALK (being built: never offered)');
  await dbPut(`testAdmins/${pids[0]}`, true);
  await host.evaluate(() => sessionStorage.clear());
  await host.reload();
  await waitFor(host, s => s.ready && !!s.code && !!s.players && Object.keys(s.players).length === 3, 'the host is back in the room', 40000);
  ok(await until(() => host.evaluate(() => import('/js/config.js').then(c => c.isOwnerTest('jaywalk'))), 25000), 'THE OWNER\'s phone: the server\'s yes → JAYWALK is his to host');
  ok(!(await pages[1].evaluate(() => import('/js/config.js').then(c => c.isOwnerTest('jaywalk') || c.isPlayable('jaywalk')))), '… a guest\'s phone: nothing changes (no JAYWALK anywhere)');
  // ---- 2. THE START: 3 · 2 · 1 · GO — THE FIRST GO picks the course + tick 0
  if (LAG) { await setLag(pages[2], LAG, LAG); log(`CHARLIE's line is slow from here: ${LAG} ms each way`); }
  let cdpB = null;
  if (START) {
    await pages[1].setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    cdpB = await pages[1].target().createCDPSession();
    await cdpB.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  }
  ok(await H.startGame(host, 'jaywalk', {}), 'the OWNER (host) starts JAYWALK');
  if (START && process.argv.includes('--profile')) {   // (from the moment the match is in the room's state: the walk inside + the count + 1 s)
    await waitFor(pages[1], st => st.game && st.game.id === 'jaywalk', 'BOB: the match is in the state', 20000);
    await cdpB.send('Profiler.enable'); await cdpB.send('Profiler.setSamplingInterval', { interval: 500 }); await cdpB.send('Profiler.start');
  }
  for (let i = 0; i < N; i++) await waitFor(pages[i], st => st.game && st.game.id === 'jaywalk' && !!window.__jwGame && !!document.querySelector('.jw-game canvas.jw-canvas'), `${NAMES[i]}: the match screen`, 40000);
  const g0 = await evalIn(host, s => ({ m: s.game.matchId, mode: s.game.mode, phase: s.game.phase, seed: s.game.seed, n: Object.keys(s.game.participants).length }));
  ok(g0.mode === 'match' && g0.n === 3, `a room of three = THE MATCH (${g0.m}); the course is not known at the start (seed "${g0.seed || ''}")`);
  ok(await until(async () => /^[123]$|^GO$/.test((await state(pages[1])).count), 8000), `the count is on a guest's screen ("${(await state(pages[1])).count}")`);
  await H.shot(pages[1], 'match-count');
  await all(N, (p, i) => waitFor(p, s => s.game.phase === 'play' && window.__jwGame.state().mode === 'run' && window.__jwGame.state().t >= 0, `${NAMES[i]}: GO`, 20000));
  const m = g0.m, game = await evalIn(host, s => s.game), nodes0 = await dbGet(`rooms/${code}/jw/${m}`);
  const first = firstGo(nodes0);
  ok(Object.keys(nodes0 || {}).length === 3 && first > 0, `every phone wrote its own GO (${Object.keys(nodes0 || {}).length} proof nodes)`);
  ok(game.g0 === first && game.playAt === first + GO_LEAD_MS && game.seed === seedOf(code, m, first), `THE FIRST GO (${first}) picked the course (${game.seed}) + tick 0 = that time + ${GO_LEAD_MS} ms`);
  const sts = await all(N, p => state(p));
  ok(sts.every(s => s.seed === game.seed && s.go === game.playAt && s.proven && s.isMatch), 'the SAME course + the SAME clock on all three phones, each proven');
  // H4B — THE SAME COURSE FOR EVERYONE, proven on the real line: each phone's own seed + tick 0, the server's own derivation, never a switch
  const SV0 = matchStart(code, m, nodes0);
  sts.forEach((s, i) => log(`  ${NAMES[i]}: seed ${s.seed} · tick 0 ${s.go} · took it ${s.adopts.map(a => `${a.at} ms from tick 0`).join(', ')}${LAG && i === 2 ? ` (a ${LAG} ms line)` : ''}`));
  log(`  the server: seed ${SV0.seed} · tick 0 ${SV0.playAt} · GOs ${Object.values(nodes0).map(n => n.go - first).join(' / ')} ms after the first`);
  ok(sts.every(s => s.seed === SV0.seed && s.go === SV0.playAt), `H4B — every phone's seed + tick 0 = the server's own (matchStart of the proof nodes)${LAG ? ` — one phone ${LAG} ms slow` : ''}`);
  ok(sts.every(s => s.adopts.length === 1 && s.adopts[0].t === 0 && s.adopts[0].hops === 0), 'H4B — each phone took its course ONCE, before it had played a tick (never a switch)');
  // ---- 3. THE GHOSTS + THE LIVE ORDER
  await all(N, p => G(p, 'window.__jwGame.bot(true, { lazy: true })'));
  if (START) {
    // THE START's measure: BOB's phone (@3, 4× CPU, a cold scene) from the count to 3 s after GO — the worst frame of each part
    await until(async () => (await state(pages[1])).t > 200, 12000);
    if (process.argv.includes('--profile')) {
      // (where the count's long frames go: the CPU profile's heaviest functions, by their own time)
      const { profile } = await cdpB.send('Profiler.stop'), dtv = profile.timeDeltas, self = new Map(), byId = new Map(profile.nodes.map(n => [n.id, n]));
      profile.samples.forEach((id, i) => { const n = byId.get(id), f = n.callFrame, k = `${f.functionName || '(anon)'} ${String(f.url).split('/').slice(-2).join('/')}:${f.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dtv[i] || 0) / 1000); });
      log('PROFILE (ms of own time, 4× CPU)', [...self.entries()].sort((x, y) => y[1] - x[1]).slice(0, 28).map(([k, v]) => `${v.toFixed(0)} ${k}`).join(' | '));
    }
    const tl = await G(pages[1], 'window.__jwGame.timeline()');
    const part = (a, b) => tl.filter(f => f[0] >= a && f[0] < b), worst = fs => fs.reduce((w, f) => (f[1] > w[1] ? f : w), [0, 0, 0]), slow = fs => fs.filter(f => f[1] > 34);
    const cnt = part(-3000, 0), go = part(0, 3000), w1 = worst(cnt), w2 = worst(go);
    log('START', JSON.stringify({ count: { frames: cnt.length, worst: w1[1], at: w1[0], work: w1[2], over34: slow(cnt).map(f => `${f[0]}:${f[1]}/${f[2]}`) }, first3s: { frames: go.length, worst: w2[1], at: w2[0], work: w2[2], over34: slow(go).map(f => `${f[0]}:${f[1]}/${f[2]}`) } }));
    ok(go.length > 120 && w2[1] <= 50, `THE START (BOB: 390 × 844 @3, 4× CPU, a cold scene): the first 3 s after GO — worst frame ${w2[1]} ms at +${w2[0]} ms (${go.length} frames, ${slow(go).length} over 34 ms); the count's worst ${w1[1]} ms at ${w1[0]} ms`);
    await cdpB.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await pages[1].setViewport({ ...H.VIEW, deviceScaleFactor: 2 });
  }
  ok(await until(async () => (await all(N, p => state(p))).every(s => s.ghosts.length === 2 && s.ghosts.every(q => q.hops > 0 && q.best > 0)), 25000), 'each phone sees TWO GHOSTS — the others\' hop logs through the same engine (they hop)');
  await sleep(1500);
  const tags = await pages[0].evaluate(() => [...document.querySelectorAll('.jw-tag')].map(e => ({ t: e.textContent, on: getComputedStyle(e).opacity !== '0' })));
  ok(tags.length === 2 && tags.every(t => /^(BOB|CHARLIE)$/.test(t.t)), `the ghosts carry their names (${tags.map(t => t.t).join(' · ')})`);
  let s0 = await state(pages[0]);
  ok(s0.order.length === 3 && s0.order.some(r => /ALICE/.test(r)) && s0.order.some(r => /BOB/.test(r)) && s0.order.some(r => /CHARLIE/.test(r)) && s0.outs === 0, `THE LIVE ORDER: ${s0.order.join(' | ')}`);
  ok(!(await pages[0].evaluate(() => /LIVES/i.test(document.querySelector('.jw-game').textContent))), 'no lives HUD anywhere (ONE LIFE)');
  await H.shot(pages[0], 'match-ghosts');
  // ---- 4. BOB out first (two still in) → the cause words → Call the Winner → WATCHING the leader
  await G(pages[1], 'window.__jwGame.bot(false)');
  ok(await until(async () => (await state(pages[1])).over, 40000), 'BOB stops hopping → ONE LIFE: out');
  const bobEnd = await state(pages[1]);
  ok(await until(() => pages[1].evaluate(() => { const c = document.querySelector('.jw-outcard .jw-fin-cause'); return c ? c.textContent : null; }), 6000).then(t => !!t && isCause(t)), 'the cause in neon words over the scene');
  ok(await until(async () => (await state(pages[1])).call, 8000), 'CALL THE WINNER opens (two players still in)');
  await H.shot(pages[1], 'match-out-call');
  ok(await pages[1].evaluate(() => { const b = [...document.querySelectorAll('.mk-call-pick')].find(x => /ALICE/.test(x.textContent)); if (!b) return false; b.click(); return true; }), 'BOB calls ALICE');
  ok(await until(async () => /YOUR CALL · ALICE/.test((await state(pages[1])).watch), 6000), `… the watcher's line: "${(await state(pages[1])).watch}"`);
  const call = await until(async () => { const n = await dbGet(`rooms/${code}/jw/${m}/${uids[1]}/k`); return n && n.w ? n : null; }, 6000);
  ok(call && call.w === uids[0] && typeof call.at === 'number', 'the call is on BOB\'s own proof node (k = { w, at: the server\'s time })');
  let sb = await state(pages[1]);
  ok(sb.watching && !!sb.follow && /WATCHING (ALICE|CHARLIE)/.test(sb.watch), `OUT = SPECTATE: the camera follows the leader — "${sb.watch}"`);
  const f0 = sb.follow;
  await until(() => pages[1].evaluate(() => !document.querySelector('.mk-call')), 4000);   // (the call card is gone: the play takes the touch again)
  await pages[1].touchscreen.tap(195, 560);
  const under = await pages[1].evaluate(() => { const e = document.elementFromPoint(195, 560); return e ? `${e.tagName}.${e.className}` : 'nothing'; });
  ok(await until(async () => { const s = await state(pages[1]); return s.follow && s.follow !== f0; }, 5000), `a tap = the next player still in (the tap lands on ${under}; ghosts ${JSON.stringify((await state(pages[1])).ghosts.map(q => q.st))})`);
  sb = await state(pages[1]);
  ok(sb.outs === 1 && sb.order.some(r => /BOB/.test(r) && /OUT/.test(r)), `the order marks BOB out (a cross + a struck name — never colour alone): ${sb.order.join(' | ')}`);
  await H.shot(pages[1], 'match-spectate');
  // H4B — SPECTATING stays smooth: BOB's phone following the leader for 3 s (the watched kid's late hops catch up — never a teleport)
  await G(pages[1], 'window.__jwGame.clearFrames()');
  await sleep(3000);
  const spec = await pages[1].evaluate(() => { const f = window.__jwGame.frames().slice().sort((a, b) => a - b); return { n: f.length, avg: f.reduce((a, b) => a + b, 0) / f.length, p95: f[Math.floor(f.length * 0.95)], worst: f[f.length - 1] }; });
  ok(spec.n > 120 && spec.p95 < 34, `H4B — spectating is smooth: ${(1000 / spec.avg).toFixed(1)} fps, p95 ${spec.p95.toFixed(1)} ms, worst ${spec.worst.toFixed(1)} ms over 3 s of watching`);
  await H.shot(pages[1], 'match-spectate-2');
  // ---- 5. CHARLIE out → only ALICE left; then ALICE → the match ends on the host's step
  await G(pages[2], 'window.__jwGame.bot(false)');
  ok(await until(async () => (await state(pages[2])).over, 40000), 'CHARLIE out');
  ok(await until(async () => { const s = await state(pages[2]); return s.watching && s.follow === uids[0] && !s.call; }, 8000), '… CHARLIE watches ALICE (one player in: no call to make)');
  // (no bot is sure to outlive the others: if ALICE's went out right behind CHARLIE, the last player out has already ended it)
  const stillOn = await evalIn(host, s => s.game.phase) === 'play';
  ok(stillOn || (await state(pages[0])).over, stillOn ? 'the match goes on while one player is in' : 'ALICE went out right behind CHARLIE this run: the last player out ended the match');
  const aliceLive = await state(pages[0]);
  await G(pages[0], 'window.__jwGame.bot(false)');
  await all(N, (p, i) => waitFor(p, s => s.game && s.game.phase === 'final' && !!document.querySelector('.jw-final .final'), `${NAMES[i]}: the podium`, 60000));
  await sleep(3200);
  const fin = await evalIn(host, s => s.game), nodes = await dbGet(`rooms/${code}/jw/${m}`);
  const rank = Object.entries(fin.results).sort((a, b) => b[1].l - a[1].l || a[1].t - b[1].t).map(([u]) => u);
  ok(fin.phase === 'final' && Object.keys(fin.results).length === 3 && fin.results[uids[1]].l === bobEnd.best, `THE END: the last player out ends it — BOB ${fin.results[uids[1]].l} · CHARLIE ${fin.results[uids[2]].l} · ALICE ${fin.results[uids[0]].l} lanes (the replay of each log; BOB's = his own phone's ${bobEnd.best})`);
  ok(fin.results[uids[0]].l >= aliceLive.best, '… ALICE\'s lanes are her whole run');
  // H4B — THE GHOSTS IN STEP WITH THE WORLD: every frame of the whole match, on every phone, each drawn ghost checked against the world it
  // was drawn in (view.js#probe — course.js's own tests at the world's tick): never in a vehicle's box, never standing on open water
  const ends = await all(N, p => state(p));
  ends.forEach((s, i) => log(`  ${NAMES[i]} saw: ${JSON.stringify(s.seen)}`));
  ok(ends.every(s => s.seen.n > 300 && s.seen.car === 0 && s.seen.water === 0), `H4B — the ghosts were NEVER drawn inside a vehicle or on open water (${ends.map(s => s.seen.n).join(' / ')} ghost-frames checked on the three phones; ${ends.reduce((a, s) => a + s.seen.logs, 0)} of them riding a log — on it)`);
  ok(ends.every(s => s.seen.air > 0) && ends.every(s => s.seen.undead === 0), `H4B — a late hop catches up in a quick hop (${ends.map(s => s.seen.air).join(' / ')} frames in the air); no death ever un-happened`);
  ok(ends.every((s, i) => s.ghosts.length === 2 && s.ghosts.every(q => q.done && q.st !== 'idle' && q.st !== 'hop' && q.best === fin.results[q.uid].l)), `H4B — every ghost's final lanes = that player's own, on every phone (${ends[1].ghosts.map(q => q.best).join(' · ')} on BOB's)`);
  // … and the hops went up AT ONCE: the write count stays modest
  const rate = uids.slice(0, N).map(u => { const c = Object.values((nodes[u] || {}).c || {}), hops = c.reduce((a, v) => a + (v.s.match(/[UDLR]/g) || []).length, 0), ms = c.length ? c[c.length - 1].at - nodes[u].go : 1; return { chunks: c.length, hops, perMin: c.length / (ms / 60000) }; });
  log(`  the proof's writes: ${rate.map((r, i) => `${NAMES[i]} ${r.chunks} chunks for ${r.hops} hops (${r.perMin.toFixed(0)} a minute)`).join(' · ')}`);
  ok(rate.every(r => r.chunks > 0 && r.perMin <= 500), `H4B — hops go up at once and the write count stays modest: ${rate.map(r => `${r.perMin.toFixed(0)}`).join(' / ')} writes a minute a player (the cap: ${Math.round(60000 / 120)})`);
  // the server's own replay of the same proof nodes agrees to the lane
  const SV = jaywalkMatch({ code, matchId: m, uids: uids.slice(0, N), nodes });
  ok(!!SV.game && uids.slice(0, N).every(u => SV.game.results[u].l === fin.results[u].l && SV.game.results[u].t === fin.results[u].t && !SV.game.results[u].bad && !SV.game.results[u].cut), 'THE SERVER\'s OWN replay of the proof nodes = the host\'s results, lane for lane (nothing the host wrote is read)');
  const pod = await pages[1].evaluate(() => ({ word: (document.querySelector('.jw-final .winner-title') || {}).textContent, shown: !!document.querySelector('.jw-final .winner') && getComputedStyle(document.querySelector('.jw-final .winner')).display !== 'none', name: (document.querySelector('.jw-final .winner-name') || {}).textContent,
    cause: (document.querySelector('.jw-final .jw-fin-cause') || {}).textContent, n: (document.querySelector('.jw-final .jw-fin-best') || {}).textContent, rows: [...document.querySelectorAll('.jw-final .leaderboard > li, .jw-final .lb-row')].length, notes: [...document.querySelectorAll('.jw-final .lb-note')].map(e => e.textContent),
    foot: [...document.querySelectorAll('.jw-final .final-actions button')].map(b => b.textContent.trim()), share: !!document.querySelector('.jw-final .jw-fin-share'), radius: getComputedStyle(document.querySelector('.jw-final .final-actions .btn')).borderRadius, callLine: (document.querySelector('.jw-fin-call') || {}).textContent || '' }));
  const tie = fin.results[rank[0]].l === fin.results[rank[1]].l && fin.results[rank[0]].t === fin.results[rank[1]].t;
  ok(pod.shown && (tie || (pod.word === 'WINNER' && /WENT THE FARTHEST/.test(pod.name))), `THE PODIUM: ${pod.word} — ${pod.name}`);
  ok(isCause(pod.cause) && new RegExp(`^${fin.results[uids[1]].l} LANES? · YOU FINISHED [0-9](ST|ND|RD|TH)$`).test(pod.n), `… BOB's own end on his podium: "${pod.cause}" · ${pod.n}`);
  ok(pod.notes.length === 3 && pod.notes.every(isCause), `… everyone in order with their cause line: ${pod.notes.join(' · ')}`);
  ok(pod.foot.length === 1 && /BACK TO THE ROOM/.test(pod.foot[0]) && pod.share && parseFloat(pod.radius) <= 12, `… the foot: ${pod.foot.join(' · ')} + SHARE MY RUN; the buttons are the non-pill tube (radius ${pod.radius})`);
  // (a right call = the player called finished first — alone or level for first: logic.js#scoreCalls)
  const right = fin.results[uids[0]].l === fin.results[rank[0]].l && fin.results[uids[0]].t === fin.results[rank[0]].t;
  ok(!!fin.calls && fin.calls[uids[1]] && fin.calls[uids[1]].w === uids[0] && fin.calls[uids[1]].ok === right, `BOB's call: ${fin.calls && fin.calls[uids[1]] ? (fin.calls[uids[1]].ok ? `RIGHT (+${fin.calls[uids[1]].bonus})` : 'missed') : 'none'} — "${pod.callLine}"`);
  const night = await dbGet(`rooms/${code}/night/${m}`);
  ok(night && night.g === 'jaywalk' && Object.keys(night.p || {}).length === 3 && (!right || (night.b && night.b[uids[1]] === fin.calls[uids[1]].bonus)), 'the night record: three placings' + (right ? ' + the call\'s game-night points' : ''));
  await H.shot(pages[1], 'match-podium');
  await H.shot(pages[0], 'match-podium-winner');
  // ---- 6. the report: counted for ALL THREE — the guests in the owner's room included
  const res = await until(async () => { const r = await dbGet(`results/${code}_${m}`); return r && r.st === 'done' ? r : null; }, 30000);
  ok(!!res && pids.every(pid => res.o && res.o[pid]), `the report is COUNTED for all three (${res ? Object.keys(res.o || {}).length : 0} outcomes — the owner + his two guests)`);
  // ---- 7. the share image: the frame of the moment BOB went out (H4B's add-on: THE FRAME IS THE HERO, the cause ONCE)
  const card = await pages[1].evaluate(async () => {
    const s = window.__arcade.state, [S, T] = await Promise.all([import('/js/games/jaywalk/share.js'), import('/js/games/jaywalk/shot.js')]);
    const shot = T.shotFor(s.game.matchId), me = s.players[s.uid], c = S.jwRunCard(s.game, { uid: s.uid, name: me.name });
    const cv = S.drawJwCard(s.game, { uid: s.uid, name: me.name, code: s.code });
    return { shot: !!shot, w: cv && cv.width, h: cv && cv.height, line: shot && shot.line, result: c.result, url: cv ? cv.toDataURL('image/png') : null };
  });
  ok(card.shot && card.w === 1080 && card.h === 1350 && isCause(card.line) && card.result === '', `THE SHARE IMAGE: BOB's real frame + "${card.line}" — ONCE (no result line) (${card.w} × ${card.h})`);
  // H4B's add-on — THE SHARE = THE PICTURE ONLY: SHARE MY RUN sends ONLY THE LINK; its preview IS BOB's card; a guest of the owner's match has one too
  const LK = await shareLink(pages[1], '.jw-final .jw-fin-share');
  ok(JSON.stringify(LK.keys) === '["url"]' && /\/api\/daily\?s=[A-Za-z0-9_-]{12}$/.test(LK.url), `H4B — SHARE MY RUN sends ONLY THE LINK (${JSON.stringify(LK.keys)} — no text, no file): ${LK.url}`);
  ok(/BOB · JAYWALK · /.test(LK.title) && LK.go === '/' && !!LK.png && LK.png.w === 540 && LK.png.h === 675 && LK.png.bytes <= 300 * 1024, `… the link's preview IS the card (og:image ${LK.png ? `${LK.png.w} × ${LK.png.h}, ${Math.round(LK.png.bytes / 1024)} KB` : 'none'}; "${LK.title}") and a tap opens the site`);
  if (LK.png) { const { writeFileSync } = await import('node:fs'); writeFileSync(`${OUTDIR.replace(/\/?$/, '/')}share-link-match-540.png`, LK.buf); }
  if (card.url) { const { writeFileSync } = await import('node:fs'); writeFileSync(`${OUTDIR.replace(/\/?$/, '/')}share-card-match.png`, Buffer.from(card.url.split(',')[1], 'base64')); }
  // ---- 8. A REMATCH: a new match, a new course — the finished match's proof nodes stay
  await H.backToLobby(host);
  await waitFor(host, s => s.meta && s.meta.status === 'lobby', 'back in the room', 30000);
  // (H4B — the rematch's start with THE HOST on the slow line: his GO + his listener late, his GO patch late)
  if (LAG) { await setLag(pages[2], 0, 0); await setLag(host, LAG, LAG); log(`THE HOST's line is slow from here: ${LAG} ms each way`); }
  await start(host, N);
  const m2 = await evalIn(host, s => s.game.matchId);
  await all(N, (p, i) => waitFor(p, s => s.game.phase === 'play' && window.__jwGame.state().mode === 'run', `${NAMES[i]}: the rematch is on`, 25000));
  const game2 = await evalIn(host, s => s.game), kept = await dbGet(`rooms/${code}/jw/${m}`);
  ok(m2 !== m && game2.seed && game2.seed !== game.seed, `A REMATCH: a new match (${m2}) on a new course`);
  const SV2 = matchStart(code, m2, await dbGet(`rooms/${code}/jw/${m2}`)), sts2 = await all(N, p => state(p));
  sts2.forEach((s, i) => log(`  ${NAMES[i]}: seed ${s.seed} · tick 0 ${s.go} · took it ${s.adopts.filter(a => a.seed === s.seed).map(a => `${a.at} ms from tick 0`).join(', ')}${LAG && i === 0 ? ` (a ${LAG} ms line)` : ''}`));
  ok(!!SV2 && game2.seed === SV2.seed && game2.playAt === SV2.playAt && sts2.every(s => s.seed === SV2.seed && s.go === SV2.playAt && s.adopts.filter(a => a.seed !== game.seed).length === 1), `H4B — the rematch: every phone + the host's GO patch = the server's own seed + tick 0, each took it once${LAG ? ` — THE HOST ${LAG} ms slow` : ''}`);
  if (LAG) await setLag(host, 0, 0);
  ok(kept && Object.keys(kept).length === 3 && uids.slice(0, N).every(u => kept[u].go > 0), '… the finished match\'s proof nodes are still there (a late report still finds them)');
  await all(N, (p, i) => waitFor(p, s => s.game && s.game.phase === 'final', `${NAMES[i]}: the rematch ends (nobody hops: the blackout takes all three)`, 60000));
  const fin2 = await evalIn(host, s => s.game);
  ok(Object.values(fin2.results).every(r => r.l === 0 && r.w === 'wall'), 'three silent-but-present players: each has a run (the blackout\'s), 0 lanes');

  // ---- 9. PERFORMANCE: a 4-player match (3 ghosts), 390 × 844 @3, 4× CPU — the host's phone
  if (PERF) {
    await H.backToLobby(host);
    await waitFor(host, s => s.meta && s.meta.status === 'lobby', 'back in the room', 30000);
    await H.join(3);
    await waitFor(host, s => Object.keys(s.players).length === 4, '4 players', 30000);
    await host.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await start(host, 4);
    await all(4, (p, i) => waitFor(p, s => s.game.phase === 'play' && window.__jwGame.state().mode === 'run', `${NAMES[i]}: on`, 25000));
    await all(4, p => G(p, 'window.__jwGame.bot(true, { lazy: true })'));
    const cdp = await host.target().createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    for (const tier of [2, 1, 0]) {
      await G(host, `window.__jwGame.setTier(${tier})`);
      await sleep(1500);
      await G(host, 'window.__jwGame.clearFrames()');
      await sleep(6000);
      const r = await host.evaluate(() => { const J = window.__jwGame, f = J.frames().slice().sort((a, b) => a - b), c = J.cost().slice().sort((a, b) => a - b), q = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))], avg = f.reduce((a, b) => a + b, 0) / f.length, s = J.state(); return { n: f.length, fps: 1000 / avg, avg, p95: q(f, 0.95), worst: f[f.length - 1], work: c.reduce((a, b) => a + b, 0) / c.length, calls: s.info.calls, dpr: s.info.dpr, tier: s.info.tier, ghosts: s.ghosts.filter(x => x.st !== 'out').length, over: s.over }; });
      log('PERF', JSON.stringify({ tier, fps: +r.fps.toFixed(1), frame: +r.avg.toFixed(1), p95: +r.p95.toFixed(1), worst: +r.worst.toFixed(1), work: +r.work.toFixed(2), calls: r.calls, dpr: r.dpr, ghosts: r.ghosts }));
      ok(r.tier === tier && r.n > 150 && r.fps > 50, `4 players (3 ghosts), 4× CPU, tier ${tier} (@${r.dpr}): ${r.fps.toFixed(1)} fps · ${r.avg.toFixed(1)} ms a frame (p95 ${r.p95.toFixed(1)}, worst ${r.worst.toFixed(1)}) · ${r.work.toFixed(2)} ms of work · ${r.calls} draw calls`);
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
} catch (e) { failed = true; log('THREW', e && e.stack || e); }
const errs = H.errors || [];
await H.browser.close().catch(() => {});
try { await dropRunCards((await Promise.all(uids.map(u => dbGet(`uids/${u}`)))).filter(Boolean)); } catch { /* the emulator is gone */ }
const checks = H.checks || [];
const bad = checks.filter(c => !c.ok);
console.log(`\n${checks.length - bad.length}/${checks.length} checks — ${bad.length || failed ? `FAILED:\n  ${bad.map(c => c.what).join('\n  ')}${failed ? '\n  (threw)' : ''}` : 'all green'}${errs.length ? `\nerrors: ${errs.slice(0, 6).join(' | ')}` : ''}`);
process.exit(bad.length || failed ? 1 : 0);
