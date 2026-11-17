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
const { CAUSE_LINES, DAY_LINES } = await import('../../js/games/jaywalk/causes.js');

const { installLag, setLag } = await import('./kit/lag.mjs');
const { matchStart } = await import('../../js/games/jaywalk/logic.js');
// (H6A — step 8c: a scripted finished match whose owner is still in at THE MOTHERSHIP's tick — the pure engine, in Node)
const JW = { ...(await import('../../js/games/jaywalk/logic.js')), ...(await import('../../js/games/jaywalk/course.js')), ...(await import('../../js/games/jaywalk/engine.js')), ...(await import('../../js/games/jaywalk/bot.js')), packLog: (await import('../../js/games/jaywalk/replay.js')).packLog, T: await import('../../js/games/jaywalk/tuning.js') };

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
const CAUSES = new Set([...Object.values(CAUSE_LINES), ...Object.values(DAY_LINES)]);   // (H5B: by day the wall's line is the fog's)
const isCause = t => CAUSES.has(t) || /^(YOU )?MADE IT TO THE MOTHERSHIP$/.test(t) || t === 'OUT';

/** start a JAYWALK match from the host's phone and wait for every phone's game screen */
async function start(host, n) {
  ok(await H.startGame(host, 'jaywalk', {}), 'the OWNER (host) starts JAYWALK');
  for (let i = 0; i < n; i++) await waitFor(pages[i], s => s.game && s.game.id === 'jaywalk' && !!window.__jwGame && !!document.querySelector('.jw-game canvas.jw-canvas'), `${NAMES[i]}: the match screen`, 40000);
}
const all = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(pages[i], i)));

let failed = false;
try {
  const N = process.argv.includes('--four') ? 4 : 3;   // (H5C — `--four`: a 4-PHONE match (DANA joins, by night); the cloud's run stays three)
  const host = await H.joinAll(N);
  const code = await evalIn(host, s => s.code);
  for (let i = 0; i < N; i++) await pages[i].setViewport({ ...H.VIEW, deviceScaleFactor: 2 });   // (the shots at @2)
  // H5B — THE REFUSED CHAT WRITE ("set chats/*/m/*" ×2 on game:jaywalk/final): every write the rules refuse on any phone, from here on
  const refused = [];
  pages.slice(0, N).forEach((p, i) => p.on('console', m => { const t = m.text(); if (/\[rules\] refused|permission_denied/i.test(t)) refused.push(`${NAMES[i]}: ${t.slice(0, 120)}`); }));
  // ---- 1. THE OWNER'S LIVE TEST: only the owner's phone may start it; the guests' phones never offer it
  const pids = await Promise.all(uids.slice(0, N).map(pidFor));
  ok(pids.every(Boolean), 'every phone has its profile');
  ok(await host.evaluate(() => import('/js/host.js').then(m => m.startGame('jaywalk', {})).then(v => !v, () => true)) && !(await evalIn(host, s => s.game)), 'a plain host can NOT start JAYWALK (being built: never offered)');
  await dbPut(`testAdmins/${pids[0]}`, true);
  await host.evaluate(() => sessionStorage.clear());
  await host.reload();
  await waitFor(host, (s, k) => s.ready && !!s.code && !!s.players && Object.keys(s.players).length === k, 'the host is back in the room', 40000, N);
  ok(await until(() => host.evaluate(() => import('/js/config.js').then(c => c.isOwnerTest('jaywalk'))), 25000), 'THE OWNER\'s phone: the server\'s yes → JAYWALK is his to host');
  ok(!(await pages[1].evaluate(() => import('/js/config.js').then(c => c.isOwnerTest('jaywalk') || c.isPlayable('jaywalk')))), '… a guest\'s phone: nothing changes (no JAYWALK anywhere)');
  // H5B — THE DAY LOOK in a match: the site's GAME LOOK is PER PHONE (☰ → Settings: AUTO · DAY · NIGHT — no lock): the host + BOB
  // play by DAY, CHARLIE by NIGHT — the same course, the same clock, the same rules; CHARLIE switches mid-match (below)
  await all(N, (p, i) => p.evaluate(l => import('/js/games/kit/look.js').then(m => m.saveLook(l)), i < 2 ? 'day' : 'night'));
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
  ok(g0.mode === 'match' && g0.n === N, `a room of three = THE MATCH (${g0.m}); the course is not known at the start (seed "${g0.seed || ''}")`);
  ok(await until(async () => /^[123]$|^GO$/.test((await state(pages[1])).count), 8000), `the count is on a guest's screen ("${(await state(pages[1])).count}")`);
  await H.shot(pages[1], 'match-count');
  // H5B's add-on — THE NAMES AT THE START: through the count every player's name is lined up ONCE (yours first); no ghost carries a tag
  { const ros = await until(async () => { const s = await state(pages[1]); return s.roster.length === N ? s : null; }, 6000);
    ok(!!ros && ros.roster[0] === 'BOB' && ['ALICE', 'CHARLIE'].every(n => ros.roster.includes(n)), `THE NAMES AT THE START: lined up through the count (${ros ? ros.roster.join(' · ') : 'none'})`);
    ok(!!ros && ros.ghosts.every(q => !q.shown), '… and no name tag sits on the start square');
    await H.shot(pages[1], 'ghosts-1-the-count');
    if (await until(async () => (await state(pages[1])).count === 'GO', 8000)) await H.shot(pages[1], 'ghosts-2-go'); }
  await all(N, (p, i) => waitFor(p, s => s.game.phase === 'play' && window.__jwGame.state().mode === 'run' && window.__jwGame.state().t >= 0, `${NAMES[i]}: GO`, 20000));
  const m = g0.m, game = await evalIn(host, s => s.game), nodes0 = await dbGet(`rooms/${code}/jw/${m}`);
  const first = firstGo(nodes0);
  ok(Object.keys(nodes0 || {}).length === N && first > 0, `every phone wrote its own GO (${Object.keys(nodes0 || {}).length} proof nodes)`);
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
  ok(await until(async () => (await all(N, p => state(p))).every(s => s.ghosts.length === N - 1 && s.ghosts.every(q => q.hops > 0 && q.best > 0)), 25000), 'each phone sees TWO GHOSTS — the others\' hop logs through the same engine (they hop)');
  await sleep(1500);
  // H5B's add-on — THE GHOSTS STOP BLOCKING YOU, sampled on every phone for 3 s of play: the roster is gone after GO · a ghost NEAR you
  // is faint and carries no tag · the tags on screen are exactly the groups' leaders (ghosts on the same / touching squares share ONE
  // tag: the leader's name + "+N") — ghosts.js#tagGroups, the same function
  { const { tagGroups } = await import('../../js/games/jaywalk/ghosts.js');
    let n = 0, bad = [], faint = 0, merged = 0, lone = 0, roster = 0;
    for (let k = 0; k < 20; k++) {
      for (const s of await all(N, p => state(p))) {
        n++; if (s.roster.length) roster++;
        for (const q of s.ghosts) { if (q.fade > 0.5) { faint++; if (q.shown) bad.push(`a faint ghost with a tag (${q.name}, ${q.fade})`); } }
        const want = new Map(tagGroups(s.ghosts.filter(q => q.tag).map(q => ({ id: q.uid, x: q.x, y: q.y, best: q.best, name: q.name }))).map(g => [g.lead, g]));
        for (const q of s.ghosts) { const g = want.get(q.uid); if (!!g !== q.shown) bad.push(`${q.name}: tag ${q.shown ? 'shown' : 'hidden'}, wanted ${g ? 'shown' : 'hidden'}`); else if (g) { if (q.text !== g.text) bad.push(`${q.name}: "${q.text}" for "${g.text}"`); if (g.ids.length > 1) merged++; else lone++; } }
      }
      await sleep(150);
    }
    ok(roster === 0, 'the names\' line-up is gone after GO');
    ok(bad.length === 0 && n === 20 * N, `THE GHOSTS STOP BLOCKING YOU — ${n} samples on the ${N} phones: a ghost near you is faint + has no tag (${faint} faint ghost-samples), the tags = the groups' leaders (${lone} single, ${merged} merged "NAME +N")${bad.length ? ` — ${bad.slice(0, 3).join(' | ')}` : ''}`); }
  const tags = await pages[0].evaluate(() => [...document.querySelectorAll('.jw-tag')].map(e => ({ t: e.textContent, on: getComputedStyle(e).opacity !== '0' })));
  ok((N === 3 ? tags.length === 2 : tags.length >= 1 && tags.length <= N - 1) && tags.every(t => /^(BOB|CHARLIE|DANA)( \+\d)?$/.test(t.t)), `the ghosts carry their names (${tags.map(t => t.t).join(' · ')})`);
  let s0 = await state(pages[0]);
  ok(s0.order.length === N && s0.order.some(r => /ALICE/.test(r)) && s0.order.some(r => /BOB/.test(r)) && s0.order.some(r => /CHARLIE/.test(r)) && s0.outs === 0, `THE LIVE ORDER: ${s0.order.join(' | ')}`);
  ok(!(await pages[0].evaluate(() => /LIVES/i.test(document.querySelector('.jw-game').textContent))), 'no lives HUD anywhere (ONE LIFE)');
  await H.shot(pages[0], 'match-ghosts');
  // H5B — each phone's own look: the scene, the stage's words, the console's body all agree; the ghosts + the order as by night
  const lookOf = p => p.evaluate(() => ({ body: document.body.dataset.look, stage: document.querySelector('.jw-game').dataset.look, scene: window.__jwGame.state().info.look, band: document.querySelector('.jw-skyline').dataset.look }));
  const lk = await all(N, lookOf);
  ok(lk.every((q, i) => q.scene === (i < 2 ? 'day' : 'night') && q.body === q.scene && q.stage === q.scene && q.band === q.scene), `THE DAY LOOK in a match: ALICE (host) ${lk[0].scene} · BOB ${lk[1].scene} · CHARLIE ${lk[2].scene} — each phone its own GAME LOOK`);
  await pages[2].evaluate(() => import('/js/games/kit/look.js').then(m => m.saveLook('day')));
  ok(await until(async () => { const q = await lookOf(pages[2]); return q.scene === 'day' && q.stage === 'day' && q.band === 'day'; }, 6000), '… CHARLIE switches to DAY mid-match: his screen re-themes at once (read live)');
  ok((await all(N, p => state(p))).every(s => s.ghosts.length === N - 1 && s.seed === game.seed), '… the same match on all three: the look is a view');
  await H.shot(pages[2], 'match-day-ghosts');
  // ---- 4. BOB out first (two still in) → the cause words → Call the Winner → WATCHING the leader
  await H.shot(pages[0], 'ghosts-3-two-seconds-in');
  // (H5C — the step's own race: BOB's bot was switched off wherever he stood — on a ROAD lane a car flattened him before ALICE was two
  //  lanes ahead, and Call the Winner's window had passed by the time the script looked. He now stops on a GROUND lane: he stands
  //  until the wall takes him, as the step means)
  await until(() => pages[1].evaluate(async () => { const J = window.__jwGame, s = J.state(), C = await import('/js/games/jaywalk/course.js'); if (s.st === 'idle' && C.createCourse(s.seed).lane(s.y).type === 'grass') { J.bot(false); return true; } return false; }), 20000, 40);
  await G(pages[1], 'window.__jwGame.bot(false)');
  // H5B's add-on, in the real match: BOB stands still — on ALICE's phone his ghost falls behind her: AWAY from her, itself again, its
  // own tag "BOB"; on BOB's phone ALICE + CHARLIE hop on ahead on the same squares: ONE tag — the leader's name + "+1"
  { const [away, mg] = await Promise.all([   // (both at once: ALICE + CHARLIE are off BOB's screen within a few seconds)
      until(async () => { const s = await state(pages[0]), q = s.ghosts.find(x => x.name === 'BOB'); return q && q.shown && q.text === 'BOB' && q.fade < 0.2 ? q : null; }, 12000, 60),
      until(async () => { const on = (await state(pages[1])).ghosts.filter(x => x.shown); const mg = on.find(x => /^(ALICE|CHARLIE|DANA) \+\d$/.test(x.text)); return mg && (N > 3 || on.length === 1) ? mg.text : null; }, 12000, 60)]);
    if (!away || !mg) { const [a, b] = await Promise.all([state(pages[0]), state(pages[1])]); log('  (the tags, as the two phones have them) ALICE y ' + a.y + ': ' + JSON.stringify(a.ghosts.map(q => [q.name, q.y, q.tag, q.shown, q.fade, q.text, q.st])) + ' · BOB y ' + b.y + ': ' + JSON.stringify(b.ghosts.map(q => [q.name, q.y, q.tag, q.shown, q.fade, q.text, q.st]))); }
    ok(!!away, 'a ghost AWAY from you is itself again and carries its own name (BOB, behind ALICE)');
    ok(!!mg, `STACKED TAGS MERGE: two ghosts on the same / touching squares share ONE tag on BOB's phone — "${mg || 'none seen'}"`);
    await H.shot(pages[1], 'ghosts-4-merged-tag'); }
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
  ok(sb.watching && !!sb.follow && /WATCHING (ALICE|CHARLIE|DANA)/.test(sb.watch), `OUT = SPECTATE: the camera follows the leader — "${sb.watch}"`);
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
  if (N > 3) { await G(pages[3], 'window.__jwGame.bot(false)'); ok(await until(async () => (await state(pages[3])).over, 40000), 'DANA (the 4th phone) out'); }
  await G(pages[2], 'window.__jwGame.bot(false)');
  ok(await until(async () => (await state(pages[2])).over, 40000), 'CHARLIE out');
  ok(await until(async () => { const s = await state(pages[2]); return s.watching && (s.follow === uids[0] || (N > 3 && (await state(pages[0])).over)) && !s.call; }, 8000), '… CHARLIE watches ALICE (one player in: no call to make)');
  // (no bot is sure to outlive the others: if ALICE's went out right behind CHARLIE, the last player out has already ended it)
  const stillOn = await evalIn(host, s => s.game.phase) === 'play';
  ok(stillOn || (await state(pages[0])).over, stillOn ? 'the match goes on while one player is in' : 'ALICE went out right behind CHARLIE this run: the last player out ended the match');
  const aliceLive = await state(pages[0]);
  await G(pages[0], 'window.__jwGame.bot(false)');
  await all(N, (p, i) => waitFor(p, s => s.game && s.game.phase === 'final' && !!document.querySelector('.jw-final .final'), `${NAMES[i]}: the podium`, 60000));
  await sleep(3200);
  const fin = await evalIn(host, s => s.game), nodes = await dbGet(`rooms/${code}/jw/${m}`);
  const rank = Object.entries(fin.results).sort((a, b) => b[1].l - a[1].l || a[1].t - b[1].t).map(([u]) => u);
  ok(fin.phase === 'final' && Object.keys(fin.results).length === N && fin.results[uids[1]].l === bobEnd.best, `THE END: the last player out ends it — BOB ${fin.results[uids[1]].l} · CHARLIE ${fin.results[uids[2]].l} · ALICE ${fin.results[uids[0]].l} lanes (the replay of each log; BOB's = his own phone's ${bobEnd.best})`);
  ok(fin.results[uids[0]].l >= aliceLive.best, '… ALICE\'s lanes are her whole run');
  // H4B — THE GHOSTS IN STEP WITH THE WORLD: every frame of the whole match, on every phone, each drawn ghost checked against the world it
  // was drawn in (view.js#probe — course.js's own tests at the world's tick): never in a vehicle's box, never standing on open water
  const ends = await all(N, p => state(p));
  ends.forEach((s, i) => log(`  ${NAMES[i]} saw: ${JSON.stringify(s.seen)}`));
  ok(ends.every(s => s.seen.n > 300 && s.seen.car === 0 && s.seen.water === 0), `H4B — the ghosts were NEVER drawn inside a vehicle or on open water (${ends.map(s => s.seen.n).join(' / ')} ghost-frames checked on the three phones; ${ends.reduce((a, s) => a + s.seen.logs, 0)} of them riding a log — on it)`);
  ok(ends.every(s => s.seen.air > 0) && ends.every(s => s.seen.undead === 0), `H4B — a late hop catches up in a quick hop (${ends.map(s => s.seen.air).join(' / ')} frames in the air); no death ever un-happened`);
  ok(ends.every((s, i) => s.ghosts.length === N - 1 && s.ghosts.every(q => q.done && q.st !== 'idle' && q.st !== 'hop' && q.best === fin.results[q.uid].l)), `H4B — every ghost's final lanes = that player's own, on every phone (${ends[1].ghosts.map(q => q.best).join(' · ')} on BOB's)`);
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
  ok(pod.notes.length === N && pod.notes.every(isCause), `… everyone in order with their cause line: ${pod.notes.join(' · ')}`);
  ok(pod.foot.length === 1 && /BACK TO THE ROOM/.test(pod.foot[0]) && pod.share && parseFloat(pod.radius) <= 12, `… the foot: ${pod.foot.join(' · ')} + SHARE MY RUN; the buttons are the non-pill tube (radius ${pod.radius})`);
  // (a right call = the player called finished first — alone or level for first: logic.js#scoreCalls)
  const right = fin.results[uids[0]].l === fin.results[rank[0]].l && fin.results[uids[0]].t === fin.results[rank[0]].t;
  ok(!!fin.calls && fin.calls[uids[1]] && fin.calls[uids[1]].w === uids[0] && fin.calls[uids[1]].ok === right, `BOB's call: ${fin.calls && fin.calls[uids[1]] ? (fin.calls[uids[1]].ok ? `RIGHT (+${fin.calls[uids[1]].bonus})` : 'missed') : 'none'} — "${pod.callLine}"`);
  const night = await dbGet(`rooms/${code}/night/${m}`);
  ok(night && night.g === 'jaywalk' && Object.keys(night.p || {}).length === N && (!right || (night.b && night.b[uids[1]] === fin.calls[uids[1]].bonus)), 'the night record: three placings' + (right ? ' + the call\'s game-night points' : ''));
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
  // ---- 7b. H5B — THE REFUSED CHAT WRITE: nothing was refused on the way to the final screen (the host + both guests) — and the two
  // ways the winner's keyed line used to be written a SECOND time ("set chats/*/m/*" refused): the host back on the final screen with a
  // fresh page (SHARE → the share sheet → iOS reloads the tab), and a guest who becomes the host there
  ok((await all(N, p => p.evaluate(() => !!document.querySelector('.jw-final .final')))).every(Boolean), 'the host + both guests are on JAYWALK\'s final screen');
  ok((await pages[0].evaluate(() => document.querySelector('.jw-final .sheet-kicker').textContent)) === 'JAYWALK · MATCH', 'THE HEADER: JAYWALK · MATCH');
  ok(!!(await dbGet(`chats/${code}/m/s-win-${m}`)), 'the winner\'s line is in the chat (written once, by the host)');
  ok(refused.length === 0, `0 refused writes on the way to the final screen (${refused.join(' | ') || 'none'})`);
  await host.reload({ waitUntil: 'load' });
  await waitFor(host, s => s.game && s.game.phase === 'final' && s.meta && s.meta.hostId === s.uid && !!window.__chat && !!document.querySelector('.jw-final .final'), 'the host is back on the final screen with a fresh page (still the host)', 40000);
  await sleep(3500);   // (the host's tick: 250 ms — the winner's line would have been asked for many times over)
  ok(refused.length === 0, `the HOST back with a fresh page: 0 refused writes (${refused.join(' | ') || 'none'})`);
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
  ok(kept && Object.keys(kept).length === N && uids.slice(0, N).every(u => kept[u].go > 0), '… the finished match\'s proof nodes are still there (a late report still finds them)');
  await all(N, (p, i) => waitFor(p, s => s.game && s.game.phase === 'final', `${NAMES[i]}: the rematch ends (nobody hops: the blackout takes all three)`, 60000));
  const fin2 = await evalIn(host, s => s.game);
  ok(Object.values(fin2.results).every(r => r.l === 0 && r.w === 'wall'), 'three silent-but-present players: each has a run (the blackout\'s), 0 lanes');

  // ---- 8b. H5B — THE REFUSED CHAT WRITE, the guest's side: the host's phone GOES AWAY on the final screen (the share sheet, a locked
  // phone) → a guest claims the room there (MAKE HOST is not for a match) → its own first look at this match's winner line: never a
  // second write of the key
  ok(refused.length === 0, `the rematch to its final screen: 0 refused writes (${refused.join(' | ') || 'none'})`);
  const hostUrl = host.url(), m2win = await dbGet(`chats/${code}/m/s-win-${m2}`);
  await host.goto('about:blank');
  const nh = await until(async () => { for (const i of [1, 2]) if (await evalIn(pages[i], s => !!s.meta && s.meta.hostId === s.uid)) return i; return 0; }, 45000);
  ok(!!nh, `the host's phone went away on the final screen → ${NAMES[nh || 1]} (a guest) is the host`);
  await sleep(3500);
  ok(refused.length === 0, `a GUEST who became the host on JAYWALK's final screen: 0 refused writes (${refused.join(' | ') || 'none'})${m2win ? ' — the winner\'s line was already there' : ''}`);
  await host.goto(hostUrl, { waitUntil: 'load' });
  await waitFor(host, s => s.game && s.game.phase === 'final' && !!document.querySelector('.jw-final'), 'the owner is back on the final screen', 40000);
  await H.backToLobby(pages[nh || 1]);
  await waitFor(pages[nh || 1], s => s.meta && s.meta.status === 'lobby', 'the room again', 30000);
  await waitFor(host, s => s.meta && s.meta.status === 'lobby', 'the owner sees the room', 30000);
  ok(await until(() => pages[nh || 1].evaluate(u => import('/js/room.js').then(r => r.makeHost(u)).then(v => v === true), uids[0]), 20000, 800), 'MAKE HOST (in the room): the owner hosts again');
  await waitFor(host, s => s.meta && s.meta.hostId === s.uid, 'the owner hosts again', 20000);
  ok(refused.length === 0, `… and nothing refused on the way back (${refused.join(' | ') || 'none'})`);

  // ---- 8c. H6A — THE MOTHERSHIP's FINISH + THE CARDS + YOUR BEST ANYWHERE, on the real screens: a 6-minute match can't be played here, so
  // a FINISHED one is scripted as the phones would leave it (e2e-profiles' pattern): every player's proof node — the owner's a real PACED
  // bot log on the course this room's first GO picked, still in at the cap — the game (final; its rows = THE JUDGE's, as the host's step
  // writes them) + the night record. The server replays the nodes itself: the feats → the cards, revealed on the podium; the match run =
  // the owner's NEW BEST; her end screen = the gold finish; the others read her line in the list.
  {
    await H.backToLobby(host).catch(() => {});
    await waitFor(host, s => s.meta && s.meta.status === 'lobby', 'in the room (before the scripted match)', 30000);
    const g0 = Date.now() - 420_000, { T } = JW;
    let pick = null;
    for (let k = 0; k < 2500 && !(pick && pick.n === 4) && !(pick && k > 600); k++) for (const K of [2, 3, 4]) {
      const matchId = `h6a${k.toString(36)}${(g0 % 1e5).toString(36)}`.slice(0, 12), S = JW.matchStart(code, matchId, { a: { go: g0 } }), course = JW.createCourse(S.seed), run = JW.createRun({ seed: S.seed, mode: 'match' }), bot = JW.greedyBot({ seed: `ship${k}` }), lg = [];
      let last = -9;
      while (!JW.isOver(run) && run.t <= T.MODES.match.cap + 5) {
        const L = course.lane(run.y);
        let d = run.st === 'idle' && L.type === 'grass' && !L.ufo && run.y - run.wall / T.FP > K ? '' : bot(run, course);
        if (d && run.t - last < T.MIN_INPUT_GAP) d = '';
        if (d) { lg.push({ t: run.t, d }); last = run.t; }
        JW.step(run, course, d);
      }
      if (run.st !== 'taken') continue;
      const live = JW.resultOf(run), n = Object.values(live.feats).filter(Boolean).length;
      if (!pick || n > pick.n) pick = { matchId, S, log: lg, live, n };
    }
    ok(!!pick, `a paced run still in at THE MOTHERSHIP's tick on this room's course (${pick ? `lane ${pick.live.lanes}, feats "${JW.featsOf(pick.live)}"` : 'none found'})`);
    const { matchId: sm, S } = pick, chunks = lg => { const c = {}; let from = 0, k = 0; while (from < lg.length) { const edge = (Math.floor(lg[from].t / 30) + 1) * 30; let to = from; while (to < lg.length && lg[to].t < edge) to++; c[k++] = { s: JW.packLog(lg.slice(0, to), from), at: S.playAt + Math.ceil(edge * 1000 / 60) + 140 }; from = to; } return c; };
    const snodes = { [uids[0]]: { go: g0, c: chunks(pick.log), e: { l: pick.live.lanes, t: pick.live.tick, w: 'taken' } } };
    for (let i = 1; i < N; i++) {
      const course = JW.createCourse(S.seed), run = JW.createRun({ seed: S.seed, mode: 'match' }), lg = JW.playBot(run, course, JW.greedyBot({ seed: S.seed + i }), 300 + i * 500);
      while (!JW.isOver(run)) JW.step(run, course, '');
      snodes[uids[i]] = { go: g0 + i * 29, ...(lg.length ? { c: chunks(lg) } : {}), e: { l: run.best, t: run.bestT, w: run.cause } };
    }
    const results = Object.fromEntries(uids.slice(0, N).map(u => [u, JW.scoreNode({ seed: S.seed, mode: 'match', node: snodes[u], t0: S.playAt, from: S.g0 })]));
    ok(results[uids[0]].x === 1 && /mothership/.test(results[uids[0]].f) && !results[uids[0]].bad, `THE JUDGE on the scripted log: ${results[uids[0]].l} lanes, still in at the cap, feats "${results[uids[0]].f}"`);
    const pidsS = await Promise.all(uids.slice(0, N).map(pidFor));
    const before = (await dbGet(`pstats/${pidsS[0]}/b/jaywalk-solo`)) || {};
    for (const pid of pidsS) await dbPut(`pstats/${pid}/last`, null);   // (the server's 45-s gap between counted matches)
    await dbPut(`rooms/${code}/jw/${sm}`, snodes);
    const sgame = { id: 'jaywalk', matchId: sm, phase: 'final', mode: 'match', seed: S.seed, playAt: S.playAt, g0: S.g0, participants: Object.fromEntries(uids.slice(0, N).map(u => [u, true])), settings: {}, phaseStartAt: Date.now(), results };
    await host.evaluate(async (c, gm, us) => { const fb = await import('/js/firebase.js'); await fb.update(fb.dbRef(`rooms/${c}`), { game: gm, 'meta/status': 'playing', [`night/${gm.matchId}`]: { g: 'jaywalk', at: fb.serverTimestamp(), p: Object.fromEntries(us.map((u, i) => [u, Math.max(0, 3 - i)])), n: Object.fromEntries(us.map(u => [u, 'N'])) } }); }, code, sgame, uids.slice(0, N));
    await all(N, (p, i) => waitFor(p, s => s.game && s.game.phase === 'final' && !!document.querySelector('.jw-final .final'), `${NAMES[i]}: the scripted match's podium`, 40000));
    // the server's own count: the feats → the four cards' achievements, the match run = the owner's best
    const sres = await until(async () => { const r = await dbGet(`results/${code}_${sm}`); return r && r.st === 'done' ? r : null; }, 40000);
    const oa = sres && sres.o && sres.o[pidsS[0]], ACHS = { boom: 'sonic-boom', ufo: 'close-encounter', airfield: 'right-of-way', mothership: 'beam-me-up' }, want = Object.keys(ACHS).filter(k => pick.live.feats[k]).map(k => ACHS[k]).sort();
    ok(!!oa && want.every(x => (oa.ach || []).includes(x)) && (oa.items || []).includes('card-beammeup'), `THE SERVER's replay grants the cards: ${oa ? (oa.ach || []).filter(x => Object.values(ACHS).includes(x)).join(' · ') : 'no outcome'} (the run's feats: ${want.join(' · ')})`);
    const after = (await dbGet(`pstats/${pidsS[0]}/b/jaywalk-solo`)) || {};
    ok(after.a === pick.live.lanes && (before.a || 0) < after.a, `YOUR BEST ANYWHERE: the MATCH run raised ALICE's best ${before.a || 0} → ${after.a}`);
    // the podium's end-of-round moment reveals them (the console's CARD REVEAL — the real cards' tiles)
    await host.waitForSelector('.pg-moment', { timeout: 30000 });
    await sleep(700); await H.shot(host, 'h6a-reveal-1-the-moment');
    const tapM = () => host.evaluate(() => document.querySelector('.pg-moment').dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    await tapM(); await sleep(1200);
    for (let i = 0; i < 4 && await host.$('.pg-up.is-on'); i++) { await H.shot(host, `h6a-reveal-2-step-${i + 1}`); await tapM(); await sleep(900); }
    await host.waitForSelector('.pg-moment.is-end', { timeout: 8000 }).catch(() => {});
    await host.evaluate(() => { const m = document.querySelector('.pg-more'); if (m) m.click(); });
    await sleep(1600);
    const rv = await host.evaluate(() => [...document.querySelectorAll('.pg-ach')].map(r => ({ id: r.dataset.id, name: (r.querySelector('div > b') || {}).textContent, card: !!r.querySelector('.pg-sw .pg-sw-card') || /is-card/.test((r.querySelector('.pg-sw') || {}).className || '') })));
    // (the console's moment lists at most THREE achievements a match — a run that earned all four shows three here + the fourth's card among its UNLOCKED rows)
    ok(want.filter(x => rv.some(r => r.id === x && r.card)).length >= Math.min(3, want.length), `THE CARD REVEAL on the podium: ${rv.filter(r => Object.values(ACHS).includes(r.id)).map(r => r.name).join(' · ')} — each with its card's tile`);
    await H.shot(host, 'h6a-reveal-3-the-cards');
    await host.evaluate(() => { const b = document.querySelector('.pg-moment .pg-btn'); if (b) b.click(); });
    await host.waitForFunction(() => !document.querySelector('.pg-moment'), { timeout: 6000 }).catch(() => {});
    await sleep(900);
    // (a first counted match offers SAVE YOUR KEY over the podium: LATER — the shots are the end screen's)
    for (const pg of [host, pages[1]]) await pg.evaluate(() => { const b = document.querySelector('.kp-later'); if (b) b.click(); });
    await sleep(700);
    // her end screen: the gold finish (never "TAKEN") + NEW BEST; a guest's podium reads her line in the list
    const gold = await host.evaluate(() => { const f = document.querySelector('.jw-final .jw-fin'); return { ship: !!f && f.classList.contains('is-ship'), crown: !!document.querySelector('.jw-final .jw-fin-crown'), cause: (document.querySelector('.jw-final .jw-fin-cause') || {}).textContent, big: (document.querySelector('.jw-final .jw-fin-n b') || {}).textContent, best: [...document.querySelectorAll('.jw-final .jw-fin-best')].map(e => e.textContent), text: document.querySelector('.jw-final').innerText }; });
    ok(gold.ship && gold.crown && gold.cause === 'YOU MADE IT TO THE MOTHERSHIP' && Number(String(gold.big).replace(/\D/g, '')) === pick.live.lanes, `THE GOLD FINISH: "${gold.cause}" · ${gold.big} LANES + the crown`);
    ok(gold.best.some(t => /^NEW BEST/.test(t)), `NEW BEST on a MATCH end screen: ${gold.best.join(' | ')}`);
    ok(!/TAKEN/.test(gold.text), 'nothing on the end screen says TAKEN');
    await H.shot(host, 'h6a-ship-gold-finish');
    // (the guest's own end-of-round moment — a level-up, an unlock — is tapped away: the shot is their podium)
    for (let i = 0; i < 6 && await pages[1].$('.pg-moment'); i++) { await pages[1].evaluate(() => { const m = document.querySelector('.pg-moment'), b = m && m.querySelector('.pg-btn'); if (b && m.classList.contains('is-end')) b.click(); else if (m) m.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); }); await sleep(900); }
    const guest = await pages[1].evaluate(() => ({ notes: [...document.querySelectorAll('.jw-final .lb-note, .jw-final .leaderboard .note')].map(e => e.textContent), text: document.querySelector('.jw-final').innerText, ship: !!document.querySelector('.jw-final .jw-fin.is-ship') }));
    ok(/MADE IT TO THE MOTHERSHIP/.test(guest.text) && !guest.ship && !/TAKEN/.test(guest.text), 'a guest who went out earlier keeps their own cause line; the list reads MADE IT TO THE MOTHERSHIP beside the owner');
    await H.shot(pages[1], 'h6a-ship-podium-guest');
    await H.backToLobby(host);
    await waitFor(host, s => s.meta && s.meta.status === 'lobby', 'back in the room (after the scripted match)', 30000);
  }

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
