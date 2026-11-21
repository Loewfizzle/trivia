// THE CONSOLE FIX (Nov 20 — docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"; the pass log docs/games/passes/
// console-fix.md) end to end, on the emulators + scripts/serve.mjs --emu (NEVER THE LIVE SITE). Two phones, both games. ALICE is the host;
// her MODIFIED phone is played by this script's own writes to the database (the admin's — anything the rules let a host write):
//   A. THE EARLY FINAL: ALICE is out; BOB still climbs / crosses → `game/phase: 'final'` + her night record → BOB's phone plays on (no
//      podium, his chunks keep landing), ALICE's podium WAITS for him; the server holds the report (still_live); BOB ends → the podium on
//      both phones scored from the nodes, the match counted — BOB wins
//   B. THE KICK: ALICE removes BOB mid-run → his phone plays the run out, writes its end, THEN leaves the room; the match counts — BOB wins
//   C. THE ROOM MOVED ON (a new match id — an early REMATCH): BOB's phone stays on his run, then follows the room to the new match
//   node tests/integration/e2e-console-fix.mjs "<chromium>" [outDir] [--game=jaywalk|highrise]
if (process.env.GPU === 'off') delete process.env.GPU; else process.env.GPU = process.env.GPU || '1';   // (GPU=off: the software renderer — a machine whose GPU path is down)
const { createHarness } = await import('./kit/harness.mjs');

const ONLY = (process.argv.find(a => a.startsWith('--game=')) || '').slice(7);
const OUTDIR = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : './shots-console-fix';
const H = await createHarness({ name: 'console-fix', slot: `cf${Date.now() % 10000}x`, hook: null, sizes: [[390, 844]], out: OUTDIR, extraArgs: ['--enable-webgl', '--ignore-gpu-blocklist'] });
const { pages, log, ok, sleep, waitFor, evalIn, uids, NAMES } = H;
const G = (page, js) => page.evaluate(js);   // (two games: no one hook — each expression names its own)
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb', AUTH = { Authorization: 'Bearer owner' };
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: AUTH }).then(r => r.json());
const dbPatch = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PATCH', headers: AUTH, body: JSON.stringify(v) }).then(r => r.json());
const until = async (fn, ms = 30000, step = 150) => { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch { /* busy */ } await sleep(step); } return null; };
const pidFor = async uid => { for (let i = 0; i < 80; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return pid; await sleep(250); } return null; };
const chunksOf = async (code, node, m, u) => Object.keys((await dbGet(`rooms/${code}/${node}/${m}/${u}/c`)) || {}).length;

// ---- each game's controls on a phone (its own test hooks — local emulator pages only)
const GAMESET = {
  jaywalk: {
    node: 'jw', podium: "!!document.querySelector('.jw-final .final')", rematch: '.jw-final .final-rematch',
    state: p => G(p, 'window.__jwGame.state()'),
    live: s => s.mode === 'run' && !s.over, out: s => s.over, seen: s => !!s,
    /** ALICE: a few hops, then idle (the blackout takes her) — a real player who lost */
    shortRun: async p => { await until(async () => { await G(p, "window.__jwGame.hop('u')"); return (await G(p, 'window.__jwGame.state().hops')) >= 1; }, 15000, 450); },   // (ONE real hop once the clock runs — a GO alone is not a play; the blackout then takes her)
    play: p => G(p, 'window.__jwGame.bot(true, { lazy: true, look: 48 })'),   // (BOB: e2e-jaywalk-match's wall-pacing bot — farther than ALICE's one lane, light on the page)
    stop: p => G(p, 'window.__jwGame.bot(false)'),
    ready: p => waitFor(p, s => s.game && s.game.phase === 'play' && !!window.__jwGame && window.__jwGame.state().proven && window.__jwGame.state().mode === 'run', 'GO', 40000),
    score: (row) => (row ? row.l : 0),
  },
  highrise: {
    node: 'hr', podium: "!!document.querySelector('.hi-final .final')", rematch: '.hi-final .final-rematch',
    state: p => G(p, 'window.__hiGame.state()'),
    live: s => s.stage.started && !s.out, out: s => s.out, seen: s => !!s,
    shortRun: p => bot(p, 2),
    play: p => bot(p, Infinity),
    stop: p => p.evaluate(() => { window.__botTo = 0; }),
    ready: p => waitFor(p, s => s.game && s.game.phase === 'play' && !!window.__hiGame && window.__hiGame.state().adopted && window.__hiGame.state().stage.started && window.__hiGame.state().proven, 'GO', 40000),
    score: row => (row ? row.f : 0),
  },
};
/** HIGH RISE's bot INSIDE a phone (e2e-highrise-match's): a perfect tap while the tower is under `window.__botTo` floors */
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

let fatal = null;
try {
  const host = await H.joinAll(2);
  const code = H.code, [A, B] = [pages[0], pages[1]];
  const pids = [await pidFor(uids[0]), await pidFor(uids[1])];
  ok(pids.every(Boolean), 'both phones have their profile');
  await dbPatch('', { testHighriseCounts: null });
  const GAMES_RUN = ONLY ? [ONLY] : ['jaywalk', 'highrise'];
  for (const gid of GAMES_RUN) {
    const X = GAMESET[gid];
    /** a fresh match of `gid` on both phones, both live; ALICE's short run over → { m } */
    let prev = '';
    const startBoth = async first => {   // (first: from the room · false: the podium's REMATCH)
      if (first) ok(await H.startGame(host, gid, {}), `${gid}: the host starts it from the room`);
      else { await host.evaluate(sel => document.querySelector(sel).click(), X.rematch); }   // (REMATCH on the podium)
      const m = await until(async () => { const g = await evalIn(host, (s, o) => s.game && s.game.id === o.gid && s.game.matchId !== o.prev ? s.game.matchId : null, { gid, prev }); return g; }, 40000);
      ok(!!m, `${gid}: a new match (${m})`);
      prev = m;
      for (const p of [A, B]) { try { await X.ready(p); } catch (e) { log('STATE', JSON.stringify(await X.state(p).catch(() => null)).slice(0, 900), JSON.stringify(await evalIn(p, s => ({ ph: s.game && s.game.phase, m: s.game && s.game.matchId, r: window.__arcade.route() })))); throw e; } }
      await X.play(B); await X.shortRun(A);
      const aOut = await until(async () => X.out(await X.state(A)), 40000);
      if (!aOut) for (const p of [A, B]) log('STATE', JSON.stringify(await X.state(p).catch(e => String(e))).slice(0, 1500), JSON.stringify(await evalIn(p, s => ({ ph: s.game && s.game.phase, m: s.game && s.game.matchId, r: window.__arcade.route() }))));
      ok(aOut, `${gid}: ALICE's short run is over (out)`);
      ok(X.live(await X.state(B)), `${gid}: BOB still going`);
      ok(await until(async () => X.score((await dbGet(`rooms/${code}/${X.node}/${m}/${uids[0]}/e`)) || null) > 0, 20000), `${gid}: ALICE PLAYED (a move landed) — a real player who lost`);
      return { m };
    };
    // ---- A. THE EARLY FINAL
    const { m: m1 } = await startBoth(true);
    const c0 = await chunksOf(code, X.node, m1, uids[1]);
    await dbPatch(`rooms/${code}`, { 'game/phase': 'final', 'game/phaseStartAt': { '.sv': 'timestamp' }, 'game/results': { [uids[0]]: { l: 999, f: 999, t: 1, w: 'cap', e: 1 } }, [`night/${m1}`]: { g: gid, at: { '.sv': 'timestamp' }, p: { [uids[0]]: 3, [uids[1]]: 1 }, n: { [uids[0]]: 'A', [uids[1]]: 'B' } } });
    log(`${gid}: THE ATTACK — game/phase 'final' written while BOB plays`);
    await sleep(5000);
    const sb = await X.state(B), sa = await X.state(A), podB = await B.evaluate(X.podium), podA = await A.evaluate(X.podium);
    ok(sb.holds && X.live(sb) && !podB && !sb.final, `${gid} A: BOB's phone plays on 5 s after the host's \`final\` — no podium over his live run (holds ${sb.holds})`);
    ok(!podA && !sa.final, `${gid} A: ALICE's own podium WAITS for BOB's live run (the honest phone's code)`);
    const c1 = await chunksOf(code, X.node, m1, uids[1]);
    ok(c1 > c0, `${gid} A: BOB's chunks keep LANDING after \`final\` (${c0} → ${c1})`);
    const r1 = await dbGet(`results/${code}_${m1}`);
    ok(!r1 || r1.st !== 'done', `${gid} A: the server has NOT counted the match while BOB's run is live (results: ${r1 ? r1.st : 'none'})`);
    await H.shot(B, `${gid}-a-plays-on`);
    await X.stop(B);
    ok(await until(async () => X.out(await X.state(B)), 60000), `${gid} A: BOB's run ends on its own (the fuse / the blackout)`);
    ok(await until(() => B.evaluate(X.podium), 30000) && await until(() => A.evaluate(X.podium), 30000), `${gid} A: THEN the podium — on both phones`);
    const sa2 = await X.state(A);
    ok(sa2.liveWaited, `${gid} A: ALICE's podium was held back for the live run, then scored from the nodes`);
    const far = async m => { const t = await dbGet(`rooms/${code}/${X.node}/${m}`); return X.score(t[uids[1]] && t[uids[1]].e) > X.score(t[uids[0]] && t[uids[0]].e); };
    ok(await far(m1), `${gid} A: BOB's run (played out after the host's \`final\`) went FARTHER than ALICE's — the honest winner`);
    const done1 = await until(async () => { const r = await dbGet(`results/${code}_${m1}`); return r && r.st === 'done' ? r : null; }, 90000, 1000);
    ok(!!done1 && done1.o && done1.o[pids[1]] && done1.o[pids[1]].win && !(done1.o[pids[0]] && done1.o[pids[0]].win), `${gid} A: COUNTED once BOB's run ended — BOB WINS, never the host who wrote \`final\` early`);
    await H.shot(A, `${gid}-a-podium`);
    // ---- C. THE ROOM MOVED ON (an early REMATCH: a new match id)
    const { m: m3 } = await startBoth(false);
    const g3 = await dbGet(`rooms/${code}/game`);
    await dbPatch(`rooms/${code}`, { [`night/${m3}`]: { g: gid, at: { '.sv': 'timestamp' }, p: { [uids[0]]: 3, [uids[1]]: 1 }, n: {} }, game: { ...g3, matchId: `${m3.slice(0, 10)}zz`, phase: 'count', phaseStartAt: Date.now(), playAt: Date.now() + 3000, seed: '', results: null } });
    log(`${gid}: THE MOVE — the room on a new match id while BOB plays`);
    await host.evaluate((c, g) => import('/js/profile/queue.js').then(q => { q.queueReport(c, g); return q.flush(true); }), code, g3);   // (the modified host reports at once)
    await sleep(4000);
    const mb = await X.state(B), route = await B.evaluate(() => window.__arcade.route());
    ok(mb.holds && X.live(mb) && route.endsWith(`:${m3}`), `${gid} C: BOB's phone stays on HIS match's run (${route})`);
    await X.stop(B);
    ok(await until(async () => X.out(await X.state(B)), 60000), `${gid} C: BOB's run ends on its own`);
    ok(await until(async () => !(await B.evaluate(() => window.__arcade.route())).endsWith(`:${m3}`), 30000), `${gid} C: THEN his phone follows the room (${await B.evaluate(() => window.__arcade.route())})`);
    const done3 = await until(async () => { const r = await dbGet(`results/${code}_${m3}`); return r && r.st === 'done' ? r : null; }, 120000, 1000);
    ok(!!done3 && done3.o && done3.o[pids[1]] && done3.o[pids[1]].win, `${gid} C: counted (the moved-on path) — BOB WINS`);
    await host.evaluate(() => import('/js/host.js').then(h => h.backToLobby()));
    await until(async () => evalIn(host, s => s.meta && s.meta.status === 'lobby'), 30000);
    await until(async () => evalIn(B, s => s.meta && s.meta.status === 'lobby'), 60000);
    // ---- B. THE KICK mid-run (BOB leaves the room at its end: the last case of a run — one game a run: --game=jaywalk / --game=highrise)
    if (gid !== GAMES_RUN[GAMES_RUN.length - 1]) continue;
    const { m: m2 } = await startBoth(true);
    await dbPatch(`rooms/${code}`, { [`kicked/${uids[1]}`]: true, [`players/${uids[1]}`]: null, [`presence/${uids[1]}`]: null });
    log(`${gid}: THE KICK — BOB removed mid-run`);
    await sleep(4000);
    const kb = await X.state(B), kcode = await evalIn(B, s => s.code);
    ok(kb.holds && X.live(kb) && kcode === code, `${gid} B: BOB's phone plays on after the kick (still in the room on this phone until his run ends)`);
    const k0 = await chunksOf(code, X.node, m2, uids[1]);
    await X.stop(B);
    ok(await until(async () => (await dbGet(`rooms/${code}/${X.node}/${m2}/${uids[1]}/e`)) != null, 60000), `${gid} B: his run ends on its own + its end LANDED (${k0} chunks before the stop)`);
    ok(await until(() => evalIn(B, s => !s.code), 30000), `${gid} B: THEN BOB's phone leaves the room (the kick, after his run)`);
    const done2 = await until(async () => { const r = await dbGet(`results/${code}_${m2}`); return r && r.st === 'done' ? r : null; }, 120000, 1000);
    ok(!!done2 && done2.o && done2.o[pids[1]] && done2.o[pids[1]].win, `${gid} B: counted — the kicked BOB (a proven player, seated or not) WINS`);
    ok(await until(async () => evalIn(host, s => s.game && s.game.phase === 'final'), 60000), `${gid} B: the match's own podium on the host`);
  }
} catch (e) { fatal = e; }
await H.finish(fatal);
