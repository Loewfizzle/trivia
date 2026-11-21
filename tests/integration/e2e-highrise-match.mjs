// HIGH RISE S4B — THE MATCH end to end, on the emulators + scripts/serve.mjs --emu (NEVER THE LIVE SITE): docs/highrise.md "THE MATCH"
//   · A PLAIN HOST (THE GO-LIVE, Nov 20 — HIGH RISE is playable): the room's game list offers it (no TEST mark) to the host AND a guest;
//     a plain host starts it for the room; the others join + play
//   · 3 · 2 · 1 · GO: the names lined up; every phone writes its own GO; THE FIRST GO picks the seed + tick 0 — the SAME on every phone
//     and in the server's own derivation
//   · THE PROOF: each player's own `hr` node — server-stamped chunks; the RIVALS = everyone's nodes through the same engine: THE
//     PLACE NUMBER (S5 — "2ND / 3": the altimeter is gone from live play), a tape on your tower where an out rival stopped, a right-edge tag for a rival level with / above you
//   · OUT = the cause's words → CALL THE WINNER (the kit's; `k` on your own node) → WATCH: the leader first, a tap = the next player, a
//     tap on a row of WATCH's ranked list = that player; "WATCHING ALICE · 12 · TAP FOR THE NEXT"
//   · the last tower's end → the host's step → the podium on every phone: HIGH RISE · MATCH, the winner, everyone as slim cards with
//     their floor + how their tower ended + their perfects; the results = THE JUDGE's replay — the SERVER's own (highriseMatch) agrees
//     to the floor; the call's game-night points; THE SWITCH IS ON → the match COUNTED for every player (no WOULD COUNT line)
//   · (the full run) ROCK-SOLID: a REFRESH mid-match rejoins from the node · an APP SWITCH re-reads the clock · a SIGNAL DROP (the line
//     cut 10 s: his tower holds (NO SIGNAL — never out), the queued taps land, the run counts in full) · REMATCH in place · a LATE JOINER WATCHES until
//     the next REMATCH deals them in · THE HOST's PHONE DIES mid-match: a new host carries the match to its podium
//   node tests/integration/e2e-highrise-match.mjs "<chromium>" [outDir] [--fast]     (--fast: two phones, one match, no rock-solid part)
if (process.env.GPU === 'off') delete process.env.GPU; else process.env.GPU = process.env.GPU || '1';   // (GPU=off: the software renderer — a machine whose GPU path is down; THE CONSOLE FIX)
const { createHarness } = await import('./kit/harness.mjs');
const { highriseMatch } = await import('../../api/_lib/highrise.js');
const { matchStart, firstGo, GO_LEAD_MS, gameStandings, floorOf } = await import('../../js/games/highrise/logic.js');
const { tapsFromChunks } = await import('../../js/games/highrise/proof.js');
const { goUids, stampOf, GO_WINDOW_MS } = await import('../../js/core/proof.js');   // (THE PROOF PASS: the tree's stamp + its players' nodes)
// THE PROOF PASS — THE SWITCH-OVER: `OLD_RULES=1` = this run is on the rules as published BEFORE the pass (kit/swap-rules.mjs loads them into
// the emulator): the stamp is refused (silently), every GO lands the old way, a chunk after the match ended is refused quietly — the fallback
const OLD_RULES = process.env.OLD_RULES === '1';
const { judgeRun } = await import('../../js/games/highrise/replay.js');
const { callBonus } = await import('../../js/core/playlist.js');

const FAST = process.argv.includes('--fast') || process.env.FAST === '1';
const OUTDIR = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : './shots-highrise-match';
const N = FAST ? 2 : 3;
const H = await createHarness({ name: 'highrise-match', slot: `hm${Date.now() % 10000}x`, hook: '__hiGame', sizes: [[390, 844]], out: OUTDIR, extraArgs: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const { pages, log, ok, sleep, waitFor, evalIn, G, uids, NAMES } = H;
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb', AUTH = { Authorization: 'Bearer owner' };
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: AUTH }).then(r => r.json());
const dbPut = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PUT', headers: AUTH, body: JSON.stringify(v) }).then(r => r.json());
const pidFor = async uid => { for (let i = 0; i < 80; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return pid; await sleep(250); } return null; };
const state = p => G(p, 'window.__hiGame.state()');
const until = async (fn, ms = 30000, step = 150) => { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch { /* busy */ } await sleep(step); } return null; };
const all = (n, fn) => Promise.all(Array.from({ length: n }, (_, i) => fn(pages[i], i)));
/** a bot INSIDE a phone: a pointerdown on the play area at each slab's perfect moment while its tower is under `window.__botTo` floors
 *  (Infinity = it plays on; a number = it stops there and THE FUSE ends it) — the touch path's own handler */
const bot = (page, to = Infinity) => page.evaluate(target => {
  window.__botTo = target;
  if (window.__botOn) return;
  window.__botOn = true;
  (function poll() {
    const L = window.__hiStage;
    if (!L || !document.querySelector('.hi-play')) { window.__botOn = false; return; }
    const m = L.phase() === 1 && !L.watching() && L.result().floor < window.__botTo ? L.soon() : -9999;
    if (m !== -9999 && m <= 5) { document.querySelector('.hi-play').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', pointerId: 7 })); return setTimeout(poll, 150); }
    setTimeout(poll, m !== -9999 && m > 14 ? Math.min(30, m - 8) : 4);
  })();
}, to);
const PODIUM = "!!document.querySelector('.hi-final .final')";

/** the host starts HIGH RISE and every phone stands on the match's own screen */
async function start(host, n) {
  ok(await H.startGame(host, 'highrise', {}), 'the host (a plain one — no owner set-up) starts HIGH RISE for the room');
  for (let i = 0; i < n; i++) await waitFor(pages[i], s => s.game && s.game.id === 'highrise' && !!window.__hiGame && !!document.querySelector('.hi-stage.hi-game canvas.hi-canvas'), `${NAMES[i]}: the match screen`, 40000);
}
/** every phone at GO: the count ran, the run adopted, live */
const atGo = n => all(n, (p, i) => waitFor(p, st => st.game && st.game.phase === 'play' && window.__hiGame.state().adopted && window.__hiGame.state().stage.started, `${NAMES[i]}: GO`, 30000));

let fatal = null;
try {
  const host = await H.joinAll(N);
  const code = H.code;
  await dbPut('testHighriseCounts', null);   // (the code's own ON — never a flip a failed suite left behind)
  // ---- 1. A PLAIN HOST (THE GO-LIVE — HIGH RISE is playable for everyone): the room's game list offers it, no TEST mark, no owner set-up
  const pids = [];
  for (let i = 0; i < N; i++) pids[i] = await pidFor(uids[i]);
  ok(pids.every(Boolean), 'every phone has its profile');
  ok((await all(N, p => p.evaluate(() => import('/js/config.js').then(c => c.isPlayable('highrise') && !c.isOwnerTest('highrise'))))).every(Boolean), 'every phone: HIGH RISE is playable — never a TEST');
  for (const [p, who] of [[host, 'the host'], [pages[1], 'a guest']]) {
    await p.waitForSelector('.rdk-games', { timeout: 20000 });
    await p.evaluate(() => document.querySelector('.rdk-games').click());
    await p.waitForSelector('.rc-games-sheet .rc-game[data-game="highrise"]', { timeout: 8000 });
    ok(await p.evaluate(() => !document.querySelector('.rc-games-sheet .rc-game[data-game="highrise"] .rc-game-test') && !/TEST/.test(document.querySelector('.rc-games-sheet .rc-game[data-game="highrise"]').textContent)), `THE ROOM's GAME LIST (${who}): HIGH RISE, no TEST mark`);
    if (p === host) { await sleep(500); await H.shot(host, 'room-games'); }
    await p.keyboard.press('Escape');
    await p.waitForFunction(() => !document.querySelector('.rc-games-sheet.is-in'), { timeout: 8000 }).catch(() => {});
  }
  // ---- 2. 3 · 2 · 1 · GO — the same seed + clock on every phone
  await start(host, N);
  const counts = await until(async () => { const c = await all(N, async p => (await state(p)).hud); return c.every(h => h && (/^[123]$/.test(h.count) || h.count === 'GET READY' || h.count === 'GO')) ? c : null; }, 8000, 60);
  ok(!!counts && counts.every(h => h.roster.length === N), `3 · 2 · 1: the count is up on every phone, the ${N} names lined up (${counts ? counts[0].roster.join(' · ') : '—'})`);
  ok(await all(N, p => p.evaluate("getComputedStyle(document.querySelector('.hi-start-foot')).display === 'none'")).then(a => a.every(Boolean)), 'no TAP TO START in a match: it starts on the count');
  await H.shot(pages[0], 'match-count');
  await atGo(N);
  const m = await evalIn(host, s => s.game.matchId), game = await dbGet(`rooms/${code}/game`), nodes0 = await dbGet(`rooms/${code}/hr/${m}`);
  const SV = matchStart(code, m, nodes0), sts = await all(N, p => state(p));
  const goers = goUids(nodes0), T0S = stampOf(nodes0);
  ok(goers.length === N, `every phone wrote its own GO (${goers.map(u => nodes0[u].go - firstGo(nodes0)).join(' / ')} ms after the first)`);
  if (OLD_RULES) ok(T0S === 0 && goers.length === N, 'THE SWITCH-OVER (the OLD rules): the stamp was refused, silently — every GO landed the old way');
  else ok(T0S > 0 && T0S <= firstGo(nodes0) && goers.every(u => nodes0[u].go <= T0S + GO_WINDOW_MS), `THE PROOF PASS — THE STAMP: the tree's first write (t0, ${firstGo(nodes0) - T0S} ms before THE FIRST GO); every GO within ${GO_WINDOW_MS} ms of it`);
  ok(game.mode === 'match' && game.seed === SV.seed && game.playAt === SV.playAt && game.playAt === firstGo(nodes0) + GO_LEAD_MS, 'THE FIRST GO picked the seed + tick 0 (the step count → play wrote them)');
  ok(sts.every(s => s.isMatch && s.seed === SV.seed && s.playAt === SV.playAt && s.haveGo && s.stage.seed === SV.seed && s.stage.mode === 'match'), `the SAME seed + the SAME clock on all ${N} phones = the server's own derivation (${SV.seed})`);
  ok(await until(async () => (await all(N, p => state(p))).every(s => s.proven), 5000), '… each phone PROVEN');
  ok(await all(N, p => p.evaluate("!!document.querySelector('.menu-btn') && !!document.querySelector('.music-btn')")).then(a => a.every(Boolean)), 'the console\'s corner buttons are on the match screen');
  // each phone its own look (the console's GAME LOOK — per phone, read live)
  if (N > 2) {
    // (REVIEW FIX A — the review's daytime red: by day AUTO is DAY on every phone, so "his alone" was false — ALEX is pinned to NIGHT first)
    await pages[0].evaluate(() => import('/js/games/kit/look.js').then(k => k.saveLook('night')));
    await until(async () => (await state(pages[0])).stage.look === 'night', 6000);
    await pages[2].evaluate(() => import('/js/games/kit/look.js').then(k => k.saveLook('day')));
    ok(await until(async () => (await state(pages[2])).stage.look === 'day', 6000) && (await state(pages[0])).stage.look === 'night', 'EACH PHONE ITS OWN LOOK: ALEX on NIGHT, CHARLIE switches to DAY mid-match — his screen alone (at any hour)');
  }
  // ---- 3. THE RIVALS — everyone's proof nodes through the same engine
  await bot(pages[0]); await bot(pages[1], 5); if (N > 2) await bot(pages[2]);
  ok(await until(async () => (await all(N, p => state(p))).every(s => s.rivals.length === N - 1 && s.rivals.every(r => r.floor >= 3) && s.stage.floor >= 3), 30000), `each phone sees the ${N - 1} other tower${N > 2 ? 's' : ''} climb — their own taps through the same engine`);
  const hud0 = (await state(pages[0])).hud;
  ok(hud0.alt.length === 0 && new RegExp(`^[1-${N}](ST|ND|RD) / ${N}$`).test(hud0.place), `THE PLACE NUMBER on ALICE's phone ("${hud0.place}") — no altimeter while she climbs (S5)`);
  ok(hud0.tags.length >= 1 && /^(BOB|CHARLIE)( \+\d)?( ▲\d+| · LEVEL)$/.test(hud0.tags[0].text), `a rival level with / over her = a right-edge tag ("${hud0.tags.map(t => t.text).join('" · "')}")`);
  const geo = await pages[0].evaluate(() => { const V = window.__hiStage.view, sh = innerHeight, a = document.querySelector('.hi-place').getBoundingClientRect(), t = [...document.querySelectorAll('.hi-rtag:not([hidden])')].map(e => e.getBoundingClientRect()); return { zone: V.restZone() * sh, alt: a.bottom, altW: a.width, tags: t.map(r => r.bottom), hud: document.querySelector('.hi-hud').getBoundingClientRect().bottom }; });
  ok(geo.alt > 0 && geo.alt <= geo.zone && geo.tags.every(b => b <= geo.zone + 1) && geo.altW <= 130, `THE TAPES NEVER BLOCK THE PLAY: THE PLACE NUMBER ends at ${geo.alt.toFixed(0)}, the tags at ${geo.tags.map(b => b.toFixed(0)).join(' / ')} — all above THE DROP ZONE's upper edge (${geo.zone.toFixed(0)} — as the camera rests; the pixel test samples it live: highrise-rivals.mjs)`);
  await H.shot(pages[0], 'match-rivals');
  // ---- 4. BOB out first → the cause's words → Call the Winner → WATCH
  ok(await until(async () => (await state(pages[1])).out, 30000), 'BOB stops at floor 5 → THE FUSE: out');
  const bobFloor = (await state(pages[1])).stage.floor;
  const oc = await until(() => pages[1].evaluate(() => { const c = document.querySelector('.hi-outcard'); return c ? { k: c.querySelector('.hi-outcard-k').textContent, w: c.querySelector('.hi-ec-cause').textContent, n: c.querySelector('.hi-outcard-n').textContent } : null; }), 6000);
  ok(oc && oc.k === 'OUT' && oc.w === 'TOO SLOW' && oc.n === `${bobFloor} FLOORS`, `the cause's words over the scene: ${oc && `${oc.k} · ${oc.w} · ${oc.n}`}`);
  await H.shot(pages[1], 'match-out');
  if (N > 2) {
    ok(await until(async () => (await state(pages[1])).call, 8000), 'CALL THE WINNER opens (two towers still climbing)');
    await H.shot(pages[1], 'match-call');
    ok(await pages[1].evaluate(() => { const b = [...document.querySelectorAll('.mk-call-pick')].find(x => /ALICE/.test(x.textContent)); if (!b) return false; b.click(); return true; }), 'BOB calls ALICE');
    const call = await until(async () => { const n = await dbGet(`rooms/${code}/hr/${m}/${uids[1]}/k`); return n && n.w ? n : null; }, 6000);
    ok(call && call.w === uids[0] && typeof call.at === 'number', 'the call is on BOB\'s own proof node (k = { w, at: the server\'s time })');
    ok(await until(async () => /YOUR CALL · ALICE/.test((await state(pages[1])).hud.watch), 6000), `… the watcher's line: "${(await state(pages[1])).hud.watch}"`);
  } else ok(!(await state(pages[1])).call, 'one tower left: no call to make');
  const LEAD = N > 2 ? '(ALICE|CHARLIE)' : 'ALICE';
  let sb = await until(async () => { const s = await state(pages[1]); return s.watching && new RegExp(`^WATCHING ${LEAD} · \\d+`).test(s.hud.watch) ? s : null; }, 12000);
  const wi = sb ? uids.indexOf(sb.watching) : 0;
  ok(!!sb && (wi === 0 || wi === 2) && sb.stage.seed === SV.seed, `OUT = WATCH: THE LEADER first — "${sb && sb.hud.watch}"`);
  const f1 = (await state(pages[1])).stage.floor; await sleep(2500); const f2 = (await state(pages[1])).stage.floor, wNow = (await state(pages[wi])).stage.floor;
  ok(f2 > f1 && Math.abs(f2 - wNow) <= 2, `BOB's screen shows ${NAMES[wi]}'s own tower climbing (floor ${f1} → ${f2}; theirs: ${wNow}) — the big number is the watched tower's`);
  ok((await state(pages[1])).stage.st === 'slide' || (await until(async () => (await state(pages[1])).stage.st === 'slide', 3000)), '… its slab is seen SLIDING (the entry is the seed\'s own — never a tap assumed)');
  ok(await pages[1].evaluate("getComputedStyle(document.querySelector('.hi-alt li')).height === '44px' && getComputedStyle(document.querySelector('.hi-alt')).pointerEvents === 'auto'"), 'watching: every row of THE RANKED LIST is a 44 pt tap target');
  if (N > 2) {
    await until(() => pages[1].evaluate(() => !document.querySelector('.mk-call')), 4000);
    await pages[1].touchscreen.tap(195, 600);
    ok(await until(async () => (await state(pages[1])).watching === uids[wi === 0 ? 2 : 0], 5000), `a tap anywhere = the next player still in ("${(await state(pages[1])).hud.watch}")`);
    const row = await pages[1].evaluate(u => { const r = document.querySelector(`.hi-alt li[data-uid="${u}"]`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, uids[0]);
    await pages[1].touchscreen.tap(row[0], row[1]);
    ok(await until(async () => (await state(pages[1])).watching === uids[0], 5000), 'a tap on a player in THE RANKED LIST = jump to them (ALICE)');
  }
  await H.shot(pages[1], 'match-watch');
  // on ALICE's phone: BOB is marked out (a cross + a struck name), his tape lies on her tower at his floor, the lane said so
  const ha = await until(async () => { const h = (await state(pages[0])).hud; return (await state(pages[0])).rivals.some(r => r.name === 'BOB' && r.end === 'out') && h.tapes.some(t => t.floor === bobFloor && t.on) ? h : null; }, 8000);
  ok(!!ha, `on ALICE's phone: BOB is OUT and HIS HEIGHT TAPE lies round her tower at floor ${bobFloor}`);
  ok(!!ha && ha.calls.some(c => c === `BOB IS OUT · ${bobFloor}`), `the announcer (the match kit's) called it: ${ha ? ha.calls.join(' · ') : ''}`);
  await H.shot(pages[0], 'match-tape');

  if (!FAST) {
    // ---- 5. ROCK-SOLID: an APP SWITCH · a SIGNAL DROP · a REFRESH — each rejoins from the shared state
    // (a) ALICE switches apps for 1.5 s: back, the clock is read again — the run is where the SERVER's clock says
    await bot(pages[0], 0);
    const other = await pages[0].browserContext().newPage(); await other.bringToFront();
    await pages[0].evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(1500);
    await pages[0].evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' }); document.dispatchEvent(new Event('visibilitychange')); });
    await pages[0].bringToFront(); await other.close();
    await bot(pages[0]);
    const fa = (await state(pages[0])).stage.floor;
    ok(await until(async () => { const s = await state(pages[0]); return !s.stage.over && s.stage.floor >= fa + 2 && s.proven; }, 12000), 'AN APP SWITCH (1.5 s away): back, ALICE\'s run goes on — on the same clock, still proven');
    // (b) A SIGNAL DROP: CHARLIE's line is cut for ~12 s while he climbs on — the others see his tower stop and read NO
    // SIGNAL (never OUT); back, the queued taps land together and his run counts IN FULL (the dropped signal is never held against it).
    // (A guest's line: the HOST's own, cut for 10 s, hands the room to a guest — who can not start a game being built: the owner's
    //  REMATCH would wait for MAKE HOST. Named in the pass log.)
    const fb = (await state(pages[2])).stage.floor;
    await pages[2].evaluate("import('/js/firebase.js').then(f => f.goOffline())");
    const silent = await until(async () => { const r = (await state(pages[0])).rivals.find(x => x.name === 'CHARLIE'); return r && r.silent ? r : null; }, 16000);
    ok(!!silent && !silent.over, 'A SIGNAL DROP: on ALICE\'s phone CHARLIE\'s tower holds still — NO SIGNAL (a hollow bar in WATCH\'s list) — never OUT');
    await pages[2].evaluate("import('/js/firebase.js').then(f => f.goOnline())");
    const fc = (await state(pages[2])).stage.floor;
    ok(fc > fb + 3 && await until(async () => { const r = (await state(pages[0])).rivals.find(x => x.name === 'CHARLIE'); return r && r.floor >= fc && !r.bad; }, 12000), `… back on the line: his queued taps land together — ALICE's screen catches up to floor ${fc} (he climbed ${fc - fb} floors offline)`);
    ok((await evalIn(host, s2 => s2.meta.hostId === s2.uid)), '… the owner is still the host');
    // (c) CHARLIE refreshes mid-match: his run is taken back from his node (the fuse ended it while the page reloaded) — he watches
    const cFloor0 = (await state(pages[2])).stage.floor;
    ok(cFloor0 >= 10 && !(await state(pages[2])).out, `CHARLIE is still climbing (floor ${cFloor0})`);
    await H.refresh(pages[2]);
    await waitFor(pages[2], s => s.game && s.game.id === 'highrise' && !!window.__hiGame && window.__hiGame.state().adopted, 'CHARLIE is back in the match after a refresh', 40000);
    const sc = await until(async () => { const s = await state(pages[2]); return s.out && s.seed === SV.seed ? s : null; }, 20000);
    const cNode = await dbGet(`rooms/${code}/hr/${m}/${uids[2]}`), cJ = judgeRun({ seed: SV.seed, mode: 'match', taps: tapsFromChunks(cNode.c) });
    ok(!!sc && sc.stage.floor >= cFloor0 && sc.stage.floor === cJ.floor && !!cNode.e, `A REFRESH mid-match: CHARLIE's tower is taken back from his own node — floor ${sc && sc.stage.floor} (the judge's replay: ${cJ.floor}); THE FUSE ended it while the page was away`);
    ok(await until(async () => (await state(pages[2])).watching === uids[0], 12000), '… and he WATCHES ALICE');
    // (d) BOB — out long since, watching — refreshes too: a rejoin AFTER his own end goes straight back to watching (no second call)
    await H.refresh(pages[1]);
    await waitFor(pages[1], s => s.game && s.game.id === 'highrise' && !!window.__hiGame && window.__hiGame.state().adopted, 'BOB is back in the match after a refresh', 40000);
    const sb2 = await until(async () => { const s = await state(pages[1]); return s.watching === uids[0] && s.out ? s : null; }, 20000);
    ok(!!sb2 && sb2.stage.floor >= bobFloor && !sb2.call && sb2.wroteE, `A REFRESH after your own end: BOB is straight back to WATCHING ALICE ("${sb2 && sb2.hud.watch}") — no second call, nothing written again`);
  }

  // ---- 6. the last tower's end → the podium on every phone; the judge's rows; the server agrees; WOULD COUNT
  await until(async () => (await state(pages[0])).stage.floor >= 18, 30000);
  await bot(pages[0], 0);
  await all(N, (p, i) => waitFor(p, s => s.game && s.game.phase === 'final' && !!document.querySelector('.hi-final .final'), `${NAMES[i]}: the podium`, 60000));
  const fin = await dbGet(`rooms/${code}/game`), nodes = await dbGet(`rooms/${code}/hr/${m}`);
  const srv = highriseMatch({ code, matchId: m, uids: uids.slice(0, N), nodes });
  ok(uids.slice(0, N).every(u => !nodes[u] || !nodes[u].go || nodes[u].rs === 'classic'), `S4B: every proven node names its RULE SET (${uids.slice(0, N).map(u => (nodes[u] && nodes[u].rs) || '-').join(' ')}) — the match is judged on ONE`);
  ok(srv.game && uids.slice(0, N).every(u => srv.game.results[u].f === fin.results[u].f && srv.game.results[u].p === fin.results[u].p && srv.game.results[u].t === fin.results[u].t && srv.game.results[u].w === fin.results[u].w), `the podium's rows = THE JUDGE's replay of each node — THE SERVER's own count agrees to the floor (${uids.slice(0, N).map((u, i) => `${NAMES[i]} ${fin.results[u].f} ${fin.results[u].w}`).join(' · ')})`);
  const st = gameStandings(fin);
  ok(st[0].uid === uids[0] && fin.results[uids[0]].f > fin.results[uids[1]].f && fin.results[uids[1]].f === bobFloor, 'THE RANKING: ALICE built the tallest; BOB\'s row = the 5 floors he dropped');
  if (!FAST) ok(!fin.results[uids[2]].cut && !fin.results[uids[2]].bad && fin.results[uids[2]].f >= 14, `THE DROPPED SIGNAL was never held against CHARLIE: his row counts in full (floor ${fin.results[uids[2]].f}, no cut)`);
  const pod = await all(N, p => p.evaluate(() => { const q = s => document.querySelector(s); return { k: q('.hi-final .sheet-kicker').textContent, win: (q('.hi-final .winner-name') || {}).textContent || '', cause: (q('.hi-fin .hi-ec-cause') || {}).textContent || '', line: (q('.hi-fin .hi-fin-place') || {}).textContent || '', call: (q('.hi-fin .hi-fin-call') || {}).textContent || '', rows: [...document.querySelectorAll('.hi-final .lb-row, .hi-final .leaderboard > *')].length, notes: [...document.querySelectorAll('.hi-final .lb-note, .hi-final .sb-note')].map(e => e.textContent), bar: (q('.hi-final .final-bar-t') || {}).textContent || '', hudGone: getComputedStyle(q('.hi-alt')).display === 'none' }; }));
  ok(pod.every(x => x.k === 'HIGH RISE · MATCH' && /ALICE BUILT THE TALLEST/.test(x.win) && x.hudGone), `the podium on every phone: HIGH RISE · MATCH — "${pod[0].win}" (the match's HUD is gone)`);
  ok(pod[0].cause && /YOU FINISHED 1ST/.test(pod[0].line) && /YOU FINISHED 2ND|YOU FINISHED 3RD/.test(pod[1].line) && pod[1].cause === 'TOO SLOW', `each player's own body: ALICE "${pod[0].cause} · ${pod[0].line}" · BOB "${pod[1].cause} · ${pod[1].line}"`);
  ok(pod[0].bar === 'REMATCH' && /REMATCH|WAITING/.test(pod[1].bar), 'the universal footer in a match: REMATCH (the host starts it; a guest votes)');
  if (N > 2) {
    ok(fin.calls && fin.calls[uids[1]] && fin.calls[uids[1]].ok && fin.calls[uids[1]].bonus === callBonus(2) && /YOUR CALL WAS RIGHT/.test(pod[1].call), `BOB's call was right: +${callBonus(2)} game-night points ("${pod[1].call}")`);
    const night = await until(async () => { const nr = await dbGet(`rooms/${code}/night/${m}`); return nr && nr.b ? nr : null; }, 8000);
    ok(night && night.b[uids[1]] === callBonus(2), 'the bonus is on the night record');
  }
  await H.shot(pages[0], 'match-podium-winner'); await H.shot(pages[1], 'match-podium');
  // THE SWITCH IS ON (THE GO-LIVE): the server judged the match from every node and COUNTED it for every player — no WOULD COUNT line
  const res = await until(async () => { const r = await dbGet(`results/${code}_${m}`); return r && r.st === 'done' ? r : null; }, 30000);
  ok(!!res && pids.every(pid => res.o && res.o[pid]), `the match is COUNTED for all ${N} (${res ? Object.keys(res.o || {}).length : 0} outcomes — a plain host + ${N - 1} guest${N > 2 ? 's' : ''})`);
  { const bs = await Promise.all(pids.map(pid => dbGet(`pstats/${pid}/b/highrise-solo`)));
    ok(bs.every((b2, i) => b2 && floorOf(b2.a) === fin.results[uids[i]].f), `… each player's best on TALLEST TOWER = the judge's floor (${bs.map(b2 => b2 && floorOf(b2.a)).join(' / ')}) — a counted match raises YOUR BEST`); }
  ok(await until(async () => (await all(N, p => p.evaluate("(document.querySelector('.hi-fin-would') || {}).textContent || ''"))).every(t => t === ''), 5000), 'no WOULD COUNT line on any end screen');
  if (!FAST) {
    // ---- 7. REMATCH in place · a LATE JOINER WATCHES · the next REMATCH deals them in · THE HOST's PHONE DIES mid-match
    await host.evaluate(() => document.querySelector('.hi-final .final-rematch').click());
    const onNew = old => all(N, p => p.evaluate(o => { const s = window.__arcade.state, g = s.game; return { m: g && g.matchId, phase: g && g.phase, hi: window.__hiGame ? window.__hiGame.state().matchId : null, quit: s.quit || '', stage: (document.querySelector('.hi-stage') || {}).className || 'none', ok: !!g && g.id === 'highrise' && g.matchId !== o && !!window.__hiGame && window.__hiGame.state().matchId === g.matchId }; }, old));
    const r2 = await until(async () => { const a = await onNew(m); return a.every(x => x.ok) ? a : null; }, 40000);
    if (!r2) log('  (the rematch, as each phone has it)', JSON.stringify(await onNew(m)));
    ok(!!r2, 'REMATCH in place: every phone stands on the rematch\'s own screen');
    const m2 = await evalIn(host, s => s.game.matchId);
    await atGo(N);
    const g2 = await dbGet(`rooms/${code}/game`);
    ok(g2.matchId !== m && g2.seed && g2.seed !== SV.seed && (await all(N, p => state(p))).every(s => s.seed === g2.seed && !s.out), 'REMATCH in place: a new match, a new seed (a new first GO) — the same on every phone');
    ok(!!(await dbGet(`rooms/${code}/hr/${m}/${uids[0]}/go`)), '… the finished match\'s proof nodes are still there (a late report still finds them)');
    await all(N, p => bot(p, 6));
    // a LATE JOINER: DANA walks in mid-match — she WATCHES (never a tower of her own)
    await H.join(3);
    await waitFor(pages[3], s => s.game && s.game.id === 'highrise' && !!window.__hiGame && window.__hiGame.state().adopted, 'DANA (a late joiner) is on the match screen', 40000);
    const sd = await until(async () => { const s = await state(pages[3]); return s.watching ? s : null; }, 15000);
    const dNode = await dbGet(`rooms/${code}/hr/${m2}/${uids[3]}`);
    ok(!!sd && sd.hud.alt.length === N && !sd.proven && !sd.haveGo && !dNode && !g2.participants[uids[3]], `A LATE JOINER WATCHES until the REMATCH: DANA sees the ${N} towers ("${sd && sd.hud.watch}"), has none of her own, writes nothing`);
    await H.shot(pages[3], 'match-late-joiner');
    await all(4, (p, i) => waitFor(p, s => s.game && s.game.phase === 'final' && !!document.querySelector('.hi-final .final'), `${NAMES[i]}: the rematch's podium`, 60000));
    // the next REMATCH deals DANA in
    await host.evaluate(() => document.querySelector('.hi-final .final-rematch').click());
    await all(4, (p, i) => waitFor(p, (s, old) => s.game && s.game.id === 'highrise' && s.game.matchId !== old && !!window.__hiGame && window.__hiGame.state().matchId === s.game.matchId, `${NAMES[i]}: the third match`, 40000, m2));
    await all(4, (p, i) => waitFor(p, st2 => st2.game && st2.game.phase === 'play' && window.__hiGame.state().adopted && window.__hiGame.state().stage.started, `${NAMES[i]}: GO`, 30000));
    const g3 = await dbGet(`rooms/${code}/game`);
    ok(Object.keys(g3.participants).length === 4 && g3.participants[uids[3]] && (await state(pages[3])).haveGo, 'the next REMATCH deals DANA in: four towers, her own GO');
    // THE HOST's PHONE DIES mid-match: a new host claims and carries the match on (her tower: the fuse — the room waits the dropped signal's time, then ends without her end)
    await all(4, p => bot(p, 4));
    await until(async () => (await state(pages[1])).stage.floor >= 2, 15000);
    const m3 = g3.matchId, t0 = Date.now();
    const hi = await H.killHost({ timeout: 60000 });
    ok(hi !== 0, `THE HOST's PHONE DIES mid-match: ${NAMES[hi]} is the host now (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
    for (const i of [1, 2, 3]) await waitFor(pages[i], s => s.game && s.game.phase === 'final' && !!document.querySelector('.hi-final .final'), `${NAMES[i]}: the podium, from the new host's step`, 150000);
    const g4 = await dbGet(`rooms/${code}/game`), n4 = await dbGet(`rooms/${code}/hr/${m3}`), s4 = highriseMatch({ code, matchId: m3, uids: uids.slice(0, 4), nodes: n4 });
    ok(g4.matchId === m3 && g4.phase === 'final' && uids.slice(0, 4).every(u => s4.game.results[u].f === g4.results[u].f && s4.game.results[u].w === g4.results[u].w), `the new host's podium = the judge's replay of every node — the dead phone's tower too (ALICE: floor ${g4.results[uids[0]].f}, ${g4.results[uids[0]].w}); the server agrees (${((Date.now() - t0) / 1000).toFixed(0)} s after her phone died)`);
  }
} catch (e) { fatal = e; }
await H.finish(fatal);
