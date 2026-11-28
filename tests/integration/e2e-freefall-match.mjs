// FREEFALL F4B — THE MATCH end to end, on the emulators + scripts/serve.mjs --emu (NEVER THE LIVE SITE): e2e-highrise-match.mjs is the
// template; the hooks are e2e-freefall.mjs's. FREEFALL is PLAYABLE since THE GO-LIVE (Nov 28): a PLAIN host starts it (no owner, no flag) and
// THE SWITCH is ON (the code's own): every player's run is COUNTED from the server's replay (results/, XP, the best on freefall-solo, the cards).
//   A (sections 1–5, `--fast` stops after it) — ONE ROOM, three matches:
//     1. A REAL 3-PLAYER MATCH: a plain host starts; 3 · 2 · 1 + the names; every phone writes its GO; THE FIRST GO = the same seed +
//        tick 0 on all; the proof nodes fill with server-stamped chunks; THE GHOSTS (2 rivals a phone, their floors follow the real ones);
//        THE DEPTH RAIL (a dot a player, each rival's NAME beside it — FIX A: no edge markers); an OUT → the cause's words → Call the Winner (`k`) →
//        WATCHING THE LEADER (a tap = the next player); THE FINISH AT THE BOTTOM (floor 200: `made`); the podium FREEFALL · MATCH, the
//        rows = the judge's replay (the server's freefallMatch on the nodes read over REST); COUNTED for all — each best = the judge's
//        floor, ALICE's dive to 200 = ROCK BOTTOM (+ SPLASHDOWN on the way); REMATCH in place (a new match, a new count, a new seed)
//     4. A PHONE THAT LOCKS (the page hidden): no hold in a match — never PAUSED, the run goes on, the proof stays valid; hidden long
//        enough the darkness ends it · A PHONE THAT DROPS SIGNAL (~6 s): the queued chunks land, the run is judged honest
//     5. A REFRESH MID-MATCH: the run taken back from the node (its moves replayed) — or, the darkness having ended it, WATCH
//     2. A LATE JOINER WATCHES (no run of their own), sees the ghosts, is dealt in at the REMATCH
//     3. A HOST CHANGE MID-MATCH (the first host's phone closes): the next phone carries the match to its `final`, the results still the judge's
//   B (section 6) — AN 8-PLAYER MATCH: the start, 7 ghosts a phone, everyone's end, the podium of 8 + THE NETWORK MEASURE (writes, bytes
//     up, bytes down — per player + total, a minute + a 3:00 match)
//   C (section 7, only with `--cap`) — THE 3:00 CAP in real time: two slow players kept alive, the last half minute's clock, TIME'S UP, `cap` rows
//   node tests/integration/e2e-freefall-match.mjs "<chromium>" [outDir] [--fast] [--cap] [--only=a|b|c]
// The summary's lines begin with FAIL / ERR / NET / SECTION (grep -E "^FAIL|^ERR|^NET|^SECTION|checks").
if (process.env.GPU === 'off') delete process.env.GPU; else process.env.GPU = process.env.GPU || '1';
const { mkdirSync, writeFileSync } = await import('node:fs');
const { createHarness, NAMES } = await import('./kit/harness.mjs');
const { guardUrl } = await import('./kit/live-guard.mjs');
const { freefallMatch } = await import('../../api/_lib/freefall.js');
const { matchStart, firstGo, GO_LEAD_MS, IDLE_OUT_MS, DROP_WAIT_MS } = await import('../../js/games/freefall/match.js');
const { gameStandings, END_WORDS } = await import('../../js/games/freefall/logic.js');
const { logFromChunks, chunkTimes } = await import('../../js/games/freefall/proof.js');
const { goUids, stampOf, GO_WINDOW_MS } = await import('../../js/core/proof.js');
const { callBonus } = await import('../../js/core/playlist.js');

const argv = process.argv.slice(2);
const FAST = argv.includes('--fast') || process.env.FAST === '1';
const CAP = argv.includes('--cap');
const ONLY = (argv.find(a => a.startsWith('--only=')) || '').slice(7);
const OUTDIR = (argv[1] && !argv[1].startsWith('--') ? argv[1] : 'C:/Users/benja/Downloads/NEON/freefall-f4b/match-e2e').replace(/\\/g, '/');
mkdirSync(OUTDIR, { recursive: true });
guardUrl(process.env.E2E_BASE || 'http://localhost:5173', 'e2e-freefall-match.mjs');
import { ffTooPerfect, heldId } from '../../js/core/match-report.js';
const DB = 'http://127.0.0.1:9000', NS = 'ns=demo-arcade-default-rtdb', AUTH = { Authorization: 'Bearer owner' };
const dbGet = path => fetch(`${DB}/${path}.json?${NS}`, { headers: AUTH }).then(r => r.json());
const dbPut = (path, v) => fetch(`${DB}/${path}.json?${NS}`, { method: 'PUT', headers: AUTH, body: JSON.stringify(v) }).then(r => r.json());
const sleep = ms => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 30000, step = 150) => { const end = Date.now() + ms; while (Date.now() < end) { try { const v = await fn(); if (v) return v; } catch { /* busy */ } await sleep(step); } return null; };
const R = n => Array.from({ length: n }, (_, i) => i);

// ---- the run's own book: every check with its section; the harness of the room that is open now
const BOOK = { checks: [], errors: [], net: [] };
let H = null, pages = [], uids = [], section = '';
const NET = [], REPORTS = [];   // (… and what /api/report answered each phone: the would-line's source)
const ok = (c, what) => { BOOK.checks.push({ section, what, ok: !!c }); H.log(c ? 'OK  ' : 'FAIL', `[${section}] ${what}`); return !!c; };
const note = (...a) => H.log('    ·', ...a);
const all = (idx, fn) => Promise.all(idx.map(i => fn(pages[i], i)));
const pidFor = async uid => { for (let i = 0; i < 80; i++) { const pid = await dbGet(`uids/${uid}`); if (pid) return pid; await sleep(250); } return null; };

// ---- the hooks (a local emulator page only)
const state = p => p.evaluate('window.__ffGame ? window.__ffGame.state() : null');
const STG = '(s => ({ floor: s.floor, over: s.over, st: s.st, cause: s.cause, started: s.started, held: s.held, holds: s.holds, mode: s.mode, seed: s.seed, cls: s.cls, shown: s.shown, t: s.t, entries: s.entries }))(window.__ffStage.state())';
const stg = p => p.evaluate(`window.__ffStage ? ${STG} : null`);
const floorOf = p => p.evaluate('window.__ffStage ? window.__ffStage.result().floor : -1');
/** the checks' own hand: 'play' (a bounce a floor, then its gap) · 'safe' (stay on safe ground: the darkness ends the run) · 'red' · 'gap' */
const hand = (p, a) => p.evaluate(x => { clearInterval(window.__dv); window.__dv = 0; if (window.__ffStage) window.__ffStage.auto = x; }, a);
/** THE DIVER: the gap whenever it is in reach before the next landing, else 'play' (safe ground, then its gap). The plain 'gap' hand dies
 *  on red in THE DEEP (floors 148 … 195 in three tries on the test page); this one reaches THE BOTTOM in ~70 s. */
const diver = p => p.evaluate(() => { clearInterval(window.__dv); window.__dv = setInterval(() => { const S = window.__ffStage; if (!S) return; const ms = S.msToLanding(); if (ms == null) return; S.auto = Math.abs(S.toGap()) <= 85 * Math.max(0, ms * 60 / 1000 - 1) ? 'gap' : 'play'; }, 8); });
/** THE SLOW ONE (the 3:00 cap): 'play', and a second on safe ground at every 8th floor — alive to the bell, never at THE BOTTOM before it */
const pacer = p => p.evaluate(() => { clearInterval(window.__dv); let last = -1, stay = 0; window.__dv = setInterval(() => { const S = window.__ffStage; if (!S) return; const f = S.result().floor; if (f !== last && f % 8 === 0 && f > 0) stay = performance.now() + 1000; last = f; S.auto = performance.now() < stay ? 'safe' : 'play'; }, 40); });
const hideShow = (p, hidden) => p.evaluate(hd => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (hd ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); }, hidden);
const outCardOf = p => p.evaluate(() => { const c = document.querySelector('.ff-outcard'); return c ? { k: c.querySelector('.ff-outcard-k').textContent, w: c.querySelector('.ff-outcard-w').textContent, n: c.querySelector('.ff-outcard-n').textContent, made: c.classList.contains('is-made') } : null; });
const GH = 'window.__ffStage ? (() => { const s = window.__ffStage.result(), m = window.__ffStage.matchState(); return { floor: s.floor, over: s.over, g: m.ghosts.map(x => ({ uid: x.uid, floor: x.floor, bad: x.bad, lost: x.lost, held: x.held, moves: x.moves, over: x.over, end: x.end })) }; })() : null';
/** the podium as a phone shows it: the header, the winner's line, the players it LISTS (in the order their names stand on it), the body */
const podiumOf = (p, names) => p.evaluate(list => {
  const q = s => document.querySelector(s), root = q('.ff-final');
  if (!root) return null;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), order = [];
  for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (n.parentElement.closest('.winner, .ff-count, .mk-call, .ff-watch')) continue; const t = n.data.toUpperCase(); for (const nm of list) if (t.includes(nm) && !order.includes(nm)) order.push(nm); }
  const txt = s => ((q(s) || {}).textContent || '').replace(/\s+/g, ' ').trim();
  const hd = q('.ff-final .sheet-kicker [role="heading"]');
  return { kicker: `${hd ? hd.getAttribute('aria-label') : ''} · ${txt('.ff-final .sheet-kicker')}`, logo: !!q('.ff-final .sheet-kicker img') && q('.ff-final .sheet-kicker img').naturalWidth > 0, place: txt('.ff-fin .ff-fin-place'), callLine: txt('.ff-fin .ff-fin-call'), win: txt('.ff-final .winner-name'), order, rows: root.querySelectorAll('.lb-row').length, notes: [...root.querySelectorAll('.lb-note')].map(e => e.textContent), cause: txt('.ff-fin .ff-ec-cause'), n: q('.ff-fin .ff-ec-n') ? q('.ff-fin .ff-ec-n').getAttribute('aria-label') : '', would: (q('.ff-fin') || { dataset: {} }).dataset.would || '', you: txt('.eb-you'), ebK: txt('.eb-k'), ebRows: root.querySelectorAll('.eb-list li').length, scroll: q('.ff-final .final') ? q('.ff-final .final').scrollHeight - q('.ff-final .final').clientHeight : -1, ebFits: (e => { const b = q('.ff-final .final-bar'); return !!e && !!b && e.getBoundingClientRect().bottom <= b.getBoundingClientRect().top + 1; })(q('.ff-final .final-eb')), bar: txt('.ff-final .final-bar-t'), text: root.innerText.replace(/\s+/g, ' ').slice(0, 400) };
}, names);
const onPodium = (idx, ms = 60000, what = 'the podium') => all(idx, (p, i) => H.waitFor(p, s => s.game && s.game.phase === 'final' && !!document.querySelector('.ff-final .final'), `${NAMES[i]}: ${what}`, ms));

// ---- THE NETWORK MEASURE: every WebSocket frame a phone sends / receives (the database's line is ONE socket), by CDP
async function netWatch(page, i) {
  const n = NET[i] = { rx: 0, tx: 0, rxN: 0, txN: 0 };
  const c = await page.createCDPSession();
  await c.send('Network.enable');
  c.on('Network.webSocketFrameReceived', e => { n.rx += e.response.payloadData.length; n.rxN++; });
  c.on('Network.webSocketFrameSent', e => { n.tx += e.response.payloadData.length; n.txN++; });
}
const netSnap = () => NET.map(n => ({ ...n }));
async function treeStat(code, m, ids) {
  const t = (await dbGet(`rooms/${code}/ff/${m}`)) || {};
  return { at: Date.now(), bytes: JSON.stringify(t).length, per: ids.map(u => { const n = t[u] || {}, c = n.c ? Object.values(n.c) : []; return { chunks: c.length, chars: c.reduce((a, v) => a + String((v && v.s) || '').length, 0), json: JSON.stringify(n.c || {}).length, other: (n.go ? 1 : 0) + (n.e ? 1 : 0) + (n.k ? 1 : 0) }; }) };
}
/** two snapshots → the numbers a minute (per player, on average + in total) and a 3:00 match of them */
function measure(label, idx, a, b, na, nb) {
  const secs = (b.at - a.at) / 1000, k = 60 / secs, P = idx.length;
  const sum = f => idx.reduce((s, i, j) => s + f(i, j), 0);
  const writes = sum((i, j) => b.per[j].chunks - a.per[j].chunks + b.per[j].other - a.per[j].other), chars = sum((i, j) => b.per[j].chars - a.per[j].chars), json = sum((i, j) => b.per[j].json - a.per[j].json);
  const tx = sum(i => nb[i].tx - na[i].tx), rx = sum(i => nb[i].rx - na[i].rx), rxN = sum(i => nb[i].rxN - na[i].rxN);
  const row = { label, players: P, secs: +secs.toFixed(1), perMin: { writes: Math.round(writes * k), chunkChars: Math.round(chars * k), chunkJson: Math.round(json * k), up: Math.round(tx * k), down: Math.round(rx * k), framesDown: Math.round(rxN * k), tree: Math.round((b.bytes - a.bytes) * k) } };
  row.perPlayerMin = { writes: Math.round(writes * k / P), chunkChars: Math.round(chars * k / P), up: Math.round(tx * k / P), down: Math.round(rx * k / P) };
  row.match3min = { writes: row.perMin.writes * 3, upKB: +(row.perMin.up * 3 / 1024).toFixed(1), downKB: +(row.perMin.down * 3 / 1024).toFixed(1), downPerPlayerKB: +(row.perPlayerMin.down * 3 / 1024).toFixed(1), treeKB: +(row.perMin.tree * 3 / 1024).toFixed(1) };
  row.spark = { matchesPerMonthOn10GB: Math.floor(10 * 1024 * 1024 / Math.max(1, row.match3min.downKB)) };
  row.downBy = idx.map(i => Math.round((nb[i].rx - na[i].rx) * k));
  BOOK.net.push(row);
  H.log(`NET ${label}: ${P} players over ${row.secs} s — A MINUTE: ${row.perMin.writes} writes (${row.perPlayerMin.writes} a player), chunk text ${row.perMin.chunkChars} chars, up ${row.perMin.up} B (${row.perPlayerMin.up} a player), down ${row.perMin.down} B total (${row.perPlayerMin.down} a player; ${row.downBy.join(' / ')}), the tree +${row.perMin.tree} B — A 3:00 MATCH: ${row.match3min.writes} writes, up ${row.match3min.upKB} KB, down ${row.match3min.downKB} KB total (${row.match3min.downPerPlayerKB} KB a phone)`);
  return row;
}

/** a room: its own browser, a PLAIN host (FREEFALL is playable — THE GO-LIVE), n − 1 guests */
async function openRoom(name, n) {
  NET.length = 0;
  H = await createHarness({ name, slot: `${name}${Date.now() % 10000}x`, hook: '__ffGame', sizes: [[390, 844]], out: OUTDIR, extraArgs: ['--enable-webgl', '--ignore-gpu-blocklist'], beforeLoad: netWatch });
  pages = H.pages; uids = H.uids;
  await dbPut('testFreefallCounts', null);   // (the code's own ON — never a flip a failed suite left behind)
  const host = await H.joinAll(n);
  REPORTS.length = 0;
  pages.forEach((p, i) => p.on('response', r => { if (/\/api\/report/.test(r.url())) r.text().then(t => REPORTS.push(`${NAMES[i]} ${r.status()} ${t.slice(0, 260)}`), () => {}); }));
  const pids = [];
  for (let i = 0; i < n; i++) pids[i] = await pidFor(uids[i]);
  ok(pids.every(Boolean), `a room of ${n}: every phone has its profile`);
  // THE GO-LIVE (Nov 28): no owner, no flag — the host is a plain phone; FREEFALL is in the room's games list on the host's AND a guest's phone
  await until(() => host.evaluate("!document.getElementById('boot') && !!window.__nsBoot && !!window.__nsBoot.mode && !!(window.__arcade && window.__arcade.state.ready && window.__arcade.state.uid && window.__arcade.state.meta)"), 60000);
  ok((await all(R(n), p => p.evaluate("import('/js/config.js').then(c => c.isPlayable('freefall') && !c.isOwnerTest('freefall'))"))).every(Boolean), 'every phone: FREEFALL is PLAYABLE — no owner, never a TEST');
  await H.waitFor(host, (s, k) => s.meta && s.meta.hostId === s.uid && Object.keys(s.players || {}).length === k, 'the room is on the host\'s phone', 30000, n);
  return { host, code: H.code, pids };
}
async function closeRoom(fatal) {
  if (fatal) { BOOK.checks.push({ section, what: `FATAL ${fatal.stack || fatal.message || fatal}`, ok: false }); H.log('FATAL', fatal.stack || fatal.message); }
  for (const e of H.errors) if (!/^check failed/.test(e)) BOOK.errors.push(`[${section}] ${e}`);
  await H.browser.close().catch(() => {});
}

const POLL = "(() => { const a = window.__arcade && window.__arcade.state, g = a && a.game, G = window.__ffGame, s = G && g ? G.state() : null; return { m: g ? g.matchId : '', phase: g ? g.phase : '', on: !!s && s.matchId === g.matchId, count: s && s.hud ? s.hud.hud.count : '', names: s && s.hud ? s.hud.hud.names : 0, adopted: !!s && s.adopted }; })()";
/** 3 · 2 · 1 as each phone shows it, from the start's tap to GO — polled 15 times a second. → [{ seen: [the count's words], names }] */
async function watchCount(idx, old, shotName) {
  const seen = idx.map(() => ({ seen: [], names: 0, on: false })), end = Date.now() + 50000;
  let shot = !shotName;
  for (;;) {
    const sts = await all(idx, p => p.evaluate(POLL).catch(() => null));
    sts.forEach((s, k) => { if (!s || !s.on || s.m === old) return; seen[k].on = true; if (s.count && !seen[k].seen.includes(s.count)) seen[k].seen.push(s.count); if (s.names > seen[k].names) seen[k].names = s.names; });
    if (!shot && sts[0] && sts[0].m !== old && /^[123]$/.test(sts[0].count)) { shot = true; await H.shot(pages[idx[0]], shotName); }
    if (sts.every(s => s && s.on && s.m !== old && s.phase === 'play' && s.adopted && !s.count)) break;
    if (Date.now() > end || (Date.now() > end - 38000 && sts.every(s => !s || !s.m || s.m === old))) break;   // (no new match 12 s after the tap: the start failed)
    await sleep(60);
  }
  return seen;
}
/** GO: every phone's own GO, THE STAMP, THE FIRST GO's seed + tick 0 — in the database, on every phone, in the server's own derivation */
async function goChecks(idx, code, seen, what) {
  const n = idx.length;
  ok(seen.every(s => s.on && s.seen.some(c => /^[123]$/.test(c)) && s.names === n), `${what}3 · 2 · 1 on every phone + the ${n} names lined up (${seen.map(s => `${s.seen.join(' ') || '—'} · ${s.names}`).join(' | ')})`);
  const m = await H.evalIn(pages[idx[0]], s => s.game.matchId), game = await dbGet(`rooms/${code}/game`), tree = await dbGet(`rooms/${code}/ff/${m}`);
  const SV = matchStart(code, m, tree) || {}, goers = goUids(tree), T0 = stampOf(tree), sts = await all(idx, state);
  ok(goers.length === n && idx.every(i => goers.includes(uids[i])), `${what}every phone wrote its own GO (${goers.map(u => tree[u].go - firstGo(tree)).join(' / ')} ms after the first)`);
  ok(T0 > 0 && T0 <= firstGo(tree) && goers.every(u => tree[u].go <= T0 + GO_WINDOW_MS), `${what}THE STAMP first (t0, ${firstGo(tree) - T0} ms before THE FIRST GO); every GO within ${GO_WINDOW_MS} ms of it`);
  ok(game.mode === 'match' && game.seed === SV.seed && game.playAt === SV.playAt && SV.playAt === firstGo(tree) + GO_LEAD_MS, `${what}THE FIRST GO picked the seed + tick 0 = that GO + ${GO_LEAD_MS} ms (the host's step count → play wrote them: ${game.seed})`);
  ok(sts.every(s => s && s.isMatch && s.seed === SV.seed && s.playAt === SV.playAt && s.haveGo && s.stage.seed === SV.seed), `${what}the SAME seed + the SAME tick 0 on all ${n} phones = the server's own derivation`);
  ok(await until(async () => (await all(idx, state)).every(s => s.proven && !s.lateGo && !s.missed), 6000), `${what}each phone PROVEN (nobody late, nobody missed the start)`);
  return { m, SV, game };
}
/** the rivals' ghosts against the rivals' REAL floors, sampled for `secs` → the worst distance (a 'play' rival · the diver), the ghosts seen bad / lost */
async function ghostTrack(idx, secs, diverIdx = -1) {
  const out = { play: 0, dive: 0, bad: 0, lost: 0, n: 0 }, end = Date.now() + secs * 1000;
  while (Date.now() < end) {
    const snap = await all(idx, p => p.evaluate(GH));
    snap.forEach(s => { if (!s) return; for (const g of s.g) { const j = uids.indexOf(g.uid), b = idx.indexOf(j); if (b < 0 || !snap[b] || snap[b].over) continue; const d = Math.abs(g.floor - snap[b].floor); if (j === diverIdx) out.dive = Math.max(out.dive, d); else out.play = Math.max(out.play, d); if (g.bad) out.bad++; if (g.lost) out.lost++; out.n++; } });
    await sleep(350);
  }
  return out;
}
/** a finished match: the game's rows against THE SERVER's own replay of every node (freefallMatch on the nodes as the emulator holds them) */
async function judged(code, m, ids) {
  const fin = await dbGet(`rooms/${code}/game`), nodes = await dbGet(`rooms/${code}/ff/${m}`), srv = freefallMatch({ code, matchId: m, uids: ids, nodes });
  const eq = u => { const a = srv.game.results[u], b = fin.results[u]; return !!a && !!b && a.f === b.f && a.t === b.t && a.w === b.w && a.e === b.e && !!a.bad === !!b.bad; };
  const same = !!srv.game && fin && fin.results && ids.every(eq);
  // (THE GO-LIVE: FIX C's COPYCAT is the SERVER's alone — test phones playing ONE hand on ONE tower land alike and the later nodes are refused
  //  'copy'; the host's podium cannot know it. `copies` = those uids; `sameHonest` = every other row agrees)
  const copies = srv.game ? ids.filter(u => srv.game.results[u] && srv.game.results[u].bad === 'copy') : [];
  const sameHonest = !!srv.game && fin && fin.results && ids.every(u => copies.includes(u) || eq(u));
  const st = fin && fin.results ? gameStandings(fin) : [];
  const sorted = st.every((r, i) => i === 0 || st[i - 1].floor > r.floor || (st[i - 1].floor === r.floor && st[i - 1].tick <= r.tick));
  const line = ids.map(u => { const r = (fin.results || {})[u] || {}; return `${NAMES[uids.indexOf(u)]} ${r.f} ${r.w || (r.bad ? `bad:${r.bad}` : '-')}${r.cut ? ' CUT' : ''}`; }).join(' · ');
  return { fin, nodes, srv, same, sameHonest, copies, st, sorted, line };
}
async function snap(pids, code, m) {
  const out = {};
  for (let i = 0; i < pids.length; i++) for (const k of ['pstats', 'profiles', 'ppriv']) { const v = await dbGet(`${k}/${pids[i]}`); if (k === 'ppriv' && v) delete v.co; out[`${k}/${NAMES[i]}`] = JSON.stringify(v); }   // (ppriv/co = the city-open stamp — the radio's hello at every boot: never a match's write)
  out['lb/freefall-solo'] = JSON.stringify(await dbGet('lb/freefall-solo'));
  out['results/this match'] = JSON.stringify(m ? await dbGet(`results/${code}_${m}`) : null);
  return out;
}
/** what differs between two snapshots: '' = nothing */
const snapDiff = (a, b) => Object.keys(a).filter(k => a[k] !== b[k]).map(k => { let i = 0; while (i < a[k].length && a[k][i] === b[k][i]) i++; return `${k}: …${a[k].slice(Math.max(0, i - 30), i + 50)}… → …${b[k].slice(Math.max(0, i - 30), i + 50)}…`; }).join(' || ');
/** the host's start: the count watched from the tap; a start that fails says why (the toast, the cartridge's own import) and ends the part */
async function ownerStart(host, idx, shotName, what) {
  const said = [], hear = m => { if (/warn|error/.test(m.type())) said.push(m.text().slice(0, 300)); };
  host.on('console', hear);
  const started = H.startGame(host, 'freefall', {});
  const quick = await Promise.race([started, sleep(1500).then(() => 'going')]);
  const seen = quick ? await watchCount(idx, '', shotName) : null;
  const yes = quick && await started;
  ok(yes, what);
  if (!yes) {
    note('the start failed:', JSON.stringify(await host.evaluate(async () => {
      const s = window.__arcade.state, C = await import('/js/config.js'), Hm = await import('/js/host.js'), Rg = await import('/js/games/registry.js');
      let load = 'ok'; try { const m = await Rg.loadGame('freefall'); if (!m) load = 'null'; } catch (e) { load = String((e && e.message) || e); }
      return { loadGame: load, toast: ((document.querySelector('.sh-msgs') || {}).innerText || '').replace(/\s+/g, ' ').trim(), playable: C.isPlayable('freefall'), hostWriteOk: Hm.hostWriteOk ? Hm.hostWriteOk() : '?', host: s.meta && s.meta.hostId === s.uid, status: s.meta && s.meta.status, go: s.meta && s.meta.go, game: s.game ? s.game.id : null, players: Object.keys(s.players || {}).length, online: Object.keys(s.presence || {}).filter(u => s.presence[u] && s.presence[u].online).length };
    })));
    note('… the console of the host:', said.join(' | ') || '(nothing)');
    throw new Error('FREEFALL did not start');
  }
  host.off('console', hear);
  return seen;
}
const rematchTap = p => p.evaluate(() => { const b = document.querySelector('.ff-final .final-rematch'); if (!b) return false; b.click(); return true; });

// =====================================================================================================================================
// A — ONE ROOM, THREE MATCHES (sections 1 · 4 · 5 · 2 · 3)
async function partA() {
  section = '1 the match';
  const { host, code, pids } = await openRoom('fm', 3);
  const I = R(3), ids = () => I.map(i => uids[i]);
  // ---- 1. the host starts; 3 · 2 · 1; GO
  // THE LOOK LOCK (FIX A — the review's M1): the HOST's look on every phone, whatever each phone's own Game look (the host NIGHT, the guests DAY)
  const setLk = (p, l) => p.evaluate(v => import('/js/games/kit/look.js').then(L => L.saveLook(v)), l);
  await setLk(host, 'night'); await all(I.slice(1), p => setLk(p, 'day'));
  const seen = await ownerStart(host, I, 'match-count', 'a PLAIN host starts FREEFALL for the room (THE GO-LIVE)');
  const { m, SV } = await goChecks(I, code, seen, '');
  const lk0 = await H.evalIn(host, s => s.game && s.game.look);
  const lks = await all(I, p => p.evaluate(() => { const e = document.querySelector('.ff-stage'), S = window.__ffStage; return e ? `${e.dataset.look}/${S && S.state ? S.state().look : '?'}` : ''; }));
  ok(lk0 === 'night' && lks.every(l => /^night\//.test(l)), `THE LOOK LOCK: the host stamped the match's look (game.look ${lk0}) — every phone plays it, the guests' own DAY setting aside (${lks.join(' · ')})`);
  ok((await all(I, p => p.evaluate("!!document.querySelector('.ff-stage.ff-game.is-match canvas.ff-canvas') && !!document.querySelector('.menu-btn') && !!document.querySelector('.music-btn')"))).every(Boolean), 'the match screen on every phone: the stage in the console\'s frame, the corner buttons on it');
  ok((await all(I, stg)).every(s => s && s.mode === 'match' && s.started && !s.held), 'a MATCH starts on its COUNT (never a drag): every stage is live in MATCH mode');
  // ALICE dives (THE FINISH is hers); BOB plays; CHARLIE stays a moment on safe ground, then plays (a floor or two behind BOB)
  await diver(pages[0]); await hand(pages[1], 'play'); await hand(pages[2], 'safe');
  const na = netSnap(), ta = await treeStat(code, m, ids());
  await sleep(1500); await hand(pages[2], 'play');
  // ---- THE PROOF + THE GHOSTS + THE RAIL
  ok(await until(async () => (await all(I, p => p.evaluate(GH))).every(s => s && s.floor >= 3 && s.g.length === 2 && s.g.every(g => g.moves > 0 && g.floor >= 2)), 30000), 'THE GHOSTS: each phone has its 2 rivals — their own moves landing, their floors passing');
  const tree1 = await dbGet(`rooms/${code}/ff/${m}`);
  const logs = ids().map(u => logFromChunks(tree1[u].c)), times = ids().map((u, k) => chunkTimes(tree1[u].c, logs[k]));
  ok(logs.every(L => L && L.log.length > 0) && times.every(T => T && T.length >= 1 && T.every(k => typeof k.at === 'number' && k.at >= SV.playAt - 600 && Math.abs(k.at - Date.now()) < 120000)), `THE PROOF: each player's own node fills with server-stamped chunks (rooms/{CODE}/ff/{matchId}/{uid}/c/{i} = { s, at } — ${times.map(T => (T ? T.length : 0)).join(' / ')} chunks, ${logs.map(L => (L ? L.log.length : 0)).join(' / ')} moves)`);
  const lag = times.flat().map(k => k.at - (SV.playAt + k.t1 * 1000 / 60));
  ok(Math.max(...lag) < 2500 && Math.min(...lag) > -300, `… each chunk on the match's clock: its last move ${Math.round(Math.min(...lag))} … ${Math.round(Math.max(...lag))} ms before its arrival`);
  const hud0 = await all(I, async p => (await state(p)).hud);
  ok(hud0.every(h => h.on && !h.spect && h.hud.rail && h.hud.dots.length === 3 && h.ghosts.every(g => h.hud.dots.some(d => d.uid === g.uid)) && h.hud.dots.some(d => d.uid === 'me')), `THE DEPTH RAIL on every phone: a dot a player (${hud0.map(h => `${h.on ? 'on' : 'OFF'}${h.spect ? ' SPECT' : ''} rail ${h.hud.rail} · ${h.hud.dots.length} dots`).join(' | ')})`);
  ok(hud0.every(h => h.layer.ghosts === 2), `the ghost layer draws 2 on every phone (${JSON.stringify(hud0[1].layer)})`);
  await H.shot(pages[2], 'match-ghosts');
  const gt = await ghostTrack(I, 6, 0);
  ok(gt.n > 0 && gt.bad === 0 && gt.play <= 2, `the ghosts follow the rivals' REAL floors: a playing rival's ghost at most ${gt.play} floor${gt.play === 1 ? '' : 's'} off (${gt.n} samples), never a refused move`);
  ok(gt.dive <= 6, `… the DIVER's ghost (3 floors a second) at most ${gt.dive} floors off${gt.lost ? ` (${gt.lost} samples NOT DRAWN — no news)` : ''}`);
  // ---- THE RAIL's NAMES (FIX A — the edge markers are gone): every rival's name beside its dot on BOB's phone, never two over each other
  const mk = await until(async () => { const h = (await state(pages[1])).hud.hud; const ns = h.dots.filter(d => d.name); return ns.length === 2 && ns.some(d => d.name === 'ALICE') && ns.some(d => d.name === 'CHARLIE') ? h : null; }, 20000);
  const gaps = mk ? mk.dots.filter(d => d.name).map(d => d.ny).sort((a, b) => a - b) : [];
  ok(!!mk && gaps.every((y, k) => !k || y - gaps[k - 1] >= 13.5), `THE RAIL's NAMES on BOB's phone — his two rivals by their dots, apart: ${mk ? mk.dots.filter(d => d.name).map(d => `${d.name} @${d.ny}`).join(' · ') : '—'}`);
  ok(!!mk && !('down' in mk), 'no edge marker is drawn');
  await H.shot(pages[1], 'match-marker');
  // THE NETWORK MEASURE, 3 players — all three still falling
  await until(() => Date.now() - ta.at > 14000, 15000, 100);
  measure('3 players, all three falling (match 1)', I, ta, await treeStat(code, m, ids()), na, netSnap());
  // ---- BOB out (the red) → the cause's words → Call the Winner → WATCHING THE LEADER
  await hand(pages[1], 'red');
  ok(await until(async () => (await state(pages[1])).out, 20000), 'BOB turns onto the red: OUT');
  const bob = await stg(pages[1]);
  const oc = await until(() => outCardOf(pages[1]), 4000, 60);
  ok(oc && oc.k === 'OUT' && oc.w === END_WORDS.red && oc.n === `${bob.floor} ${bob.floor === 1 ? 'FLOOR' : 'FLOORS'}`, `the OUT card over the scene: ${oc && `${oc.k} · ${oc.w} · ${oc.n}`}`);
  await H.shot(pages[1], 'match-out');
  ok(await until(async () => (await state(pages[1])).call, 8000), 'CALL THE WINNER opens (two still falling)');
  await sleep(350); await H.shot(pages[1], 'match-call');
  ok(await pages[1].evaluate(() => { const b = [...document.querySelectorAll('.mk-call-pick')].find(x => /ALICE/.test(x.textContent)); if (!b) return false; b.click(); return true; }), 'BOB calls ALICE');
  const call = await until(async () => { const n = await dbGet(`rooms/${code}/ff/${m}/${uids[1]}/k`); return n && n.w ? n : null; }, 6000);
  ok(call && call.w === uids[0] && typeof call.at === 'number', 'the call is on BOB\'s own proof node (k = { w, at: the server\'s time })');
  let sb = await until(async () => { const s = await state(pages[1]); return s.watching && /^WATCHING (ALICE|CHARLIE) · \d+/.test(s.hud.hud.watching) ? s : null; }, 12000);
  // (TWO SHORT LINES since the first run of this test: who + their floor, then your call + the hint — one long line wrapped to three at 390)
  ok(!!sb && sb.watching === uids[0] && /^WATCHING ALICE · \d+\nYOUR CALL · ALICE · TAP: NEXT$/.test(sb.hud.hud.watching), `OUT = WATCHING THE LEADER (ALICE, the deepest): "${sb && String(sb.hud.hud.watching).replace('\n', ' / ')}"`);
  await until(() => pages[1].evaluate(() => !document.querySelector('.mk-call')), 4000);
  await pages[1].touchscreen.tap(195, 600);
  sb = await until(async () => { const s = await state(pages[1]); return s.watching === uids[2] ? s : null; }, 5000);
  ok(!!sb, `a tap = the next player (CHARLIE): "${sb ? sb.hud.hud.watching : (await state(pages[1])).hud.hud.watching}"`);
  await sleep(2600);
  const wf = (await state(pages[1])).hud.watchFloor, cf = await floorOf(pages[2]), big = await pages[1].evaluate("window.__ffStage.state().num");
  ok(Math.abs(wf - cf) <= 3 && String(big) === String(wf), `BOB's screen shows CHARLIE's own run, played back 1.5 s behind (floor ${wf}; his real floor ${cf}) — the big number is the watched run's (${big})`);
  await H.shot(pages[1], 'match-watch');
  const ha = await until(async () => { const h = (await state(pages[0])).hud; const g = h.ghosts.find(x => x.uid === uids[1]); return g && g.over && g.end === 'out' && h.hud.dots.some(d => d.uid === uids[1] && d.cls === 'is-out') ? h : null; }, 8000);
  ok(!!ha && /2 PLAYING$/.test(ha.top) && ha.ghosts.find(x => x.uid === uids[1]).floor === bob.floor, `on ALICE's phone: BOB's ghost is OUT at his floor (${bob.floor}), his dot on the rail crossed, "${ha && ha.top}"`);
  // ---- CHARLIE: the darkness (he stays on safe ground) — one still falling: no call to make
  await hand(pages[2], 'safe');
  ok(await until(async () => (await state(pages[2])).out, 20000), 'CHARLIE stays on safe ground: THE LIGHTS GO OUT — OUT');
  const cha = await stg(pages[2]), oc2 = await until(() => outCardOf(pages[2]), 4000, 60);
  ok(cha.cause === 'dark' && oc2 && oc2.k === 'OUT' && oc2.w === END_WORDS.dark, `the OUT card: ${oc2 && `${oc2.k} · ${oc2.w} · ${oc2.n}`}`);
  const sc = await until(async () => { const s = await state(pages[2]); return s.watching === uids[0] && /^WATCHING ALICE · \d+$/.test(s.hud.hud.watching) ? s : null; }, 10000);
  ok(!!sc && !sc.call && !(await pages[2].evaluate("!!document.querySelector('.mk-call')")), `one ball still falling: no call to make — CHARLIE watches her ("${sc ? sc.hud.hud.watching : (await state(pages[2])).hud.hud.watching}")`);
  // ---- THE FINISH AT THE BOTTOM: ALICE reaches floor 200
  const made = await until(async () => (await outCardOf(pages[0])) || ((await pages[0].evaluate("!!document.querySelector('.ff-final')")) ? { none: true } : null), 150000, 60);
  const ali = await stg(pages[0]);
  ok(ali.st === 'made' && ali.floor === 200, `THE FINISH AT THE BOTTOM: ALICE dives to floor ${ali.floor} — ${ali.st} (tick ${ali.t}: ${(ali.t / 60).toFixed(1)} s)`);
  ok(made && made.k === 'THE BOTTOM' && made.w === 'YOU HIT THE BOTTOM' && made.n === '200 FLOORS' && made.made, `her card: ${made && !made.none ? `${made.k} · ${made.w} · ${made.n}` : 'never seen'}`);
  await H.shot(pages[0], 'match-made');
  await onPodium(I, 60000);
  // ---- the podium = the judge's replay; the server agrees; the call's points; COUNTED for all
  const J = await judged(code, m, ids());
  ok(ids().every(u => J.nodes[u] && J.nodes[u].e && typeof J.nodes[u].e.f === 'number'), '… each node carries its end (e = { f, t, w } — a signal, never a score)');
  ok(J.same, `the podium's rows = THE JUDGE's replay of each node — THE SERVER's own freefallMatch agrees to the floor + the tick (${J.line})`);
  ok(J.sorted && J.st[0].uid === uids[0] && J.fin.results[uids[0]].w === 'made' && J.fin.results[uids[0]].f === 200 && J.fin.results[uids[1]].f === bob.floor && J.fin.results[uids[1]].w === 'red' && J.fin.results[uids[2]].w === 'dark', `THE RANKING: the deepest first, then the earlier tick (${J.st.map(r => `${NAMES[uids.indexOf(r.uid)]} ${r.floor}`).join(' > ')})`);
  await sleep(900);
  const pod = await all(I, p => podiumOf(p, NAMES.slice(0, 3)));
  ok(pod.every(x => x && /^Freefall, match · MATCH$/.test(x.kicker) && x.logo && /ALICE FELL THE DEEPEST/.test(x.win)), `the podium on every phone: THE LOGO (its heading: "${pod[0] && pod[0].kicker}"${pod.every(x => x && x.logo) ? ', the picture loaded' : ', THE PICTURE DID NOT LOAD'}) — "${pod[0] && pod[0].win}"`);
  const myPlace = i => J.st.find(r => r.uid === uids[i]).rank, ORD = ['', '1ST', '2ND', '3RD'];
  // (F5B — THE FINAL SHAPE: each body = the cause + THE NUMBER + FLOORS + YOUR BEST; the place shows in THIS MATCH's top 3 — the YOU line only from 4th down)
  ok(pod.every((x, i) => x.n === String(J.fin.results[uids[i]].f) && !x.place && !x.you && x.ebK === 'THIS MATCH' && x.ebRows === 3 && (x.scroll <= 1 || x.ebFits)) && pod[0].cause === END_WORDS.made && pod[1].cause === END_WORDS.red && pod[2].cause === END_WORDS.dark, `each player's own body: ${pod.map((x, i) => `"${x.cause} · ${x.n} FLOORS" (${ORD[myPlace(i)]}; ${x.ebK} ${x.ebRows} rows, ${x.scroll} px over)`).join(' | ')}`);
  ok(pod[1].callLine === `YOUR CALL WAS RIGHT · +${callBonus(2)} POINTS` && !pod[0].callLine && !pod[2].callLine, `BOB's call on his own screen: "${pod[1].callLine}"`);
  const want = J.st.map(r => NAMES[uids.indexOf(r.uid)]).join(' ');
  ok(pod.every(x => x && x.order.join(' ') === want), `the podium LISTS every player, in the ranking's order (${want}) — the phones list: ${pod.map(x => (x ? x.order.join(' ') || 'nobody' : '—')).join(' | ')}`);
  ok((await all(I, async p => (await state(p)).hud.hud)).every(h => !h.outCard && !h.watching && !h.count), 'the match\'s own pieces are put away under the podium (the OUT card, the WATCHING line, the count)');
  ok(pod[0].bar === 'REMATCH' && pod.slice(1).every(x => /REMATCH|WAITING/.test(x.bar)), `the universal footer in a match: REMATCH (${pod.map(x => x.bar).join(' | ')})`);
  ok(J.fin.calls && J.fin.calls[uids[1]] && J.fin.calls[uids[1]].ok && J.fin.calls[uids[1]].bonus === callBonus(2), `BOB's call was right: +${callBonus(2)} game-night points`);
  const night = await until(async () => { const nr = await dbGet(`rooms/${code}/night/${m}`); return nr && nr.p ? nr : null; }, 8000);
  ok(night && night.g === 'freefall' && night.b && night.b[uids[1]] === callBonus(2) && night.p[uids[0]] > night.p[uids[1]], `the night record: FREEFALL, ALICE first, the call's bonus on it (${JSON.stringify(night && night.p)})`);
  await H.shot(pages[0], 'match-podium-winner'); await H.shot(pages[1], 'match-podium');
  // THE SWITCH ON (the code's own): the match is COUNTED — every player's best = the judge's floor; ALICE's 200 = ROCK BOTTOM (+ SPLASHDOWN)
  const done = await until(async () => { const d = await dbGet(`results/${code}_${m}`); return d && d.st === 'done' ? d : null; }, 45000);
  if (!done) note('what /api/report answered:', REPORTS.join(' || ').slice(0, 1200) || '(no report was sent)');
  ok(!!done && done.g === 'freefall' && done.n === 3, `THE SWITCH ON — the match is COUNTED (results/ done, ${done && done.n} verified players)`);
  const ps = await all(I, (p, k) => dbGet(`pstats/${pids[k]}`));
  // (FIX C's HOLD — THE DIVER reads the tower: a dive to 200 with almost no bounce is TOO PERFECT for a human → HELD: XP paid, no win, no
  //  best / average / card — its row waits on /admin's HELD list for the owner's RELEASE; the judge's own numbers decide, never a guess)
  const aliceHeld = ffTooPerfect(J.fin.results[uids[0]]);
  note(`ALICE's dive: ${J.fin.results[uids[0]].f} floors · ${J.fin.results[uids[0]].b} bounces · best no-bounce run ${J.fin.results[uids[0]].br} → ${aliceHeld ? 'HELD (too perfect)' : 'counted'}`);
  ok(ps.every((x, k) => (k === 0 && aliceHeld) ? !(x && x.b && x.b['freefall-solo']) : x && x.b && x.b['freefall-solo'] && x.b['freefall-solo'].a === J.fin.results[uids[k]].f), `… each player's best on freefall-solo = the judge's floor${aliceHeld ? ' — ALICE\'s HELD: no best' : ''} (${ps.map((x, k) => `${NAMES[k]} ${x && x.b && x.b['freefall-solo'] ? x.b['freefall-solo'].a : '—'}`).join(' · ')})`);
  ok(ps.every((x, k) => x && done.o && done.o[pids[k]] && done.o[pids[k]].xp && done.o[pids[k]].xp.gain > 0), '… XP for all three (a held run is paid its XP)');
  ok(aliceHeld ? !done.o[pids[0]].win && !done.o[pids[1]].win && !done.o[pids[2]].win : !!done.o[pids[0]].win && !done.o[pids[1]].win && !done.o[pids[2]].win, aliceHeld ? '… the win: nobody (the deepest run is HELD — never handed to the next one)' : '… the win: ALICE alone (the deepest)');
  if (aliceHeld) {
    const hn = await until(() => dbGet(`ffheld/${heldId(`${code}_${m}`, pids[0])}`), 15000);
    ok(!!hn && hn.pid === pids[0] && hn.f === 200 && hn.so === 0 && /bottom/.test(hn.ff) && /harbor/.test(hn.ff) && /THE LINE/.test(hn.why), `… ALICE's run waits on /admin's HELD list: ${hn ? `${hn.f} floors · MATCH · "${hn.why}" · cards waiting: ${hn.ff}` : 'NOT RECORDED'}`);
    ok(!(ps[0].it && ps[0].it['card-rockbottom']), '… ROCK BOTTOM waits for the owner\'s RELEASE (server.test proves the RELEASE awards it)');
  } else ok(ps[0].it && ps[0].it['card-rockbottom'] && ps[0].it['card-splashdown'] && ps[0].pa && ps[0].pa.gf && ps[0].pa.gf['freefall-bottom'] === 1, `ROCK BOTTOM awarded to ALICE (floor 200, a match) — the card + SPLASHDOWN on the way (items ${Object.keys(ps[0].it || {}).filter(k => /splash|rock|terminal/.test(k)).join(' ')})`);
  ok(!(ps[1].it && ps[1].it['card-rockbottom']) && !(ps[2].it && ps[2].it['card-rockbottom']), '… nobody else: the cards come from each player\'s OWN replay');
  ok(await all(I, p => p.evaluate("!document.querySelector('.ff-fin[data-would]')")).then(x => x.every(Boolean)), '… no WOULD COUNT on any phone');
  await sleep(400); await H.shot(pages[0], 'golive-counted-match-podium');
  // ---- REMATCH in place: a new match, a new count, a new seed
  ok(await rematchTap(host), 'the host taps REMATCH');
  const seen2 = await watchCount(I, m, null);
  const G2 = await goChecks(I, code, seen2, 'REMATCH in place — a new match: ');
  const m2 = G2.m;
  ok(m2 !== m && G2.SV.seed !== SV.seed && (await all(I, state)).every(s => s.matchId === m2 && !s.out && !s.final) && !(await pages[0].evaluate("!!document.querySelector('.ff-final')")), `… a new matchId (${m} → ${m2}), a new seed (a new first GO), nobody out, the podium gone`);
  ok(!!(await dbGet(`rooms/${code}/ff/${m}/${uids[0]}/go`)), '… the finished match\'s proof nodes are still there (a late report still finds them)');

  // =================================================================================================================================
  // MATCH 2 — a phone that LOCKS · a phone that DROPS SIGNAL · a REFRESH · a LATE JOINER
  section = '4 lock + signal';
  await all(I, p => hand(p, 'play'));
  await until(async () => (await all(I, floorOf)).every(f => f >= 4), 30000);
  // (a) CHARLIE's phone LOCKS for 3 s on safe ground: NO hold in a match — never PAUSED, the run goes on, he is back in time
  await hand(pages[2], 'safe'); await sleep(900);
  const c0 = await stg(pages[2]);
  await hideShow(pages[2], true);
  const hid = [];
  for (let k = 0; k < 6; k++) { await sleep(500); hid.push(await pages[2].evaluate(`(() => { const s = ${STG}, h = document.querySelector('.ff-hold'); return { held: s.held, holds: s.holds, cls: s.cls, paused: !!h && !h.hidden, over: s.over }; })()`)); }
  ok(hid.every(x => !x.held && x.holds === 0 && !x.paused && !/is-held/.test(x.cls)), 'A PHONE THAT LOCKS mid-match (the page hidden 3 s): NO hold — never PAUSED, no 3 · 2 · 1, nothing held');
  const gh = (await state(pages[0])).hud.ghosts.find(x => x.uid === uids[2]);
  ok(gh && !gh.over && !gh.bad, `… on ALICE's phone his ghost is still in the match while he is away (floor ${gh && gh.floor}${gh && gh.lost ? ', not drawn — no news' : ''})`);
  await hideShow(pages[2], false);
  await hand(pages[2], 'play');
  const c1 = await until(async () => { const s = await stg(pages[2]); return s.over || s.floor >= c0.floor + 3 ? s : null; }, 15000);
  ok(!!c1 && !c1.over && c1.holds === 0 && (await state(pages[2])).proven, `… back in time: the run went on behind the hidden page and goes on (floor ${c0.floor} → ${c1 && c1.floor}${c1 && c1.over ? ` — OUT: ${c1.cause}` : ''}), still proven`);
  // (b) BOB's phone DROPS SIGNAL for ~6 s while he plays on: the others never see him out; back, the queued chunks land together
  section = '4 lock + signal';
  const chunksOf = async u => { const c = await dbGet(`rooms/${code}/ff/${m2}/${u}/c`); return c ? Object.keys(c).length : 0; };
  const eventsOn = async u => { const L = logFromChunks(await dbGet(`rooms/${code}/ff/${m2}/${u}/c`)); return L ? L.log.length : -1; };
  const b0 = await stg(pages[1]);
  let how = 'CDP offline (page.setOfflineMode)';
  await pages[1].setOfflineMode(true);
  await sleep(1200);
  const k1 = await chunksOf(uids[1]); await sleep(1800); const k2 = await chunksOf(uids[1]);
  if (k2 > k1) { how = 'the database client\'s own goOffline (CDP\'s offline mode does not cut an open WebSocket here)'; await pages[1].setOfflineMode(false); await pages[1].evaluate("import('/js/firebase.js').then(f => f.goOffline())"); await sleep(600); }
  const k3 = await chunksOf(uids[1]); await sleep(3000); const k4 = await chunksOf(uids[1]);
  const bStg = await stg(pages[1]), ev4 = await eventsOn(uids[1]);
  ok(k4 === k3 && !bStg.over && bStg.floor > b0.floor && bStg.entries > ev4 + 5, `A PHONE THAT DROPS SIGNAL (${how}): BOB plays on (floor ${b0.floor} → ${bStg.floor}) — nothing of it reaches the room (${k4} chunks / ${ev4} moves there, ${bStg.entries} moves made on the phone)`);
  const gb = (await state(pages[0])).hud.ghosts.find(x => x.uid === uids[1]);
  ok(gb && !gb.over && !gb.bad && gb.floor < bStg.floor, `… on ALICE's phone his ghost is never OUT: it waits where his news ended (floor ${gb && gb.floor}${gb && gb.lost ? ', not drawn' : gb && gb.held ? ', held' : ''})`);
  if (/goOffline/.test(how)) await pages[1].evaluate("import('/js/firebase.js').then(f => f.goOnline())"); else await pages[1].setOfflineMode(false);
  const back = await until(async () => { const s = await state(pages[1]), k = await chunksOf(uids[1]); return k > k4 && s.acked === s.sent && s.acked > ev4 + 5 ? { k, s } : null; }, 30000, 250);
  const bNow = await floorOf(pages[1]);
  const gb2 = await until(async () => { const g = (await state(pages[0])).hud.ghosts.find(x => x.uid === uids[1]); return g && !g.bad && !g.lost && Math.abs(g.floor - (await floorOf(pages[1]))) <= 3 ? g : null; }, 15000);
  ok(!!back && !!gb2, `… back on the line: the queued chunks land together (${k4} → ${back ? back.k : await chunksOf(uids[1])} chunks) and ALICE's screen catches his ghost up (floor ${gb2 ? gb2.floor : '?'}; his: ${bNow})`);
  ok(await H.evalIn(host, s => s.meta.hostId === s.uid), '… the first host is still the host');

  // ---- 2. A LATE JOINER: DANA walks in mid-match — she WATCHES
  section = '2 late joiner';
  await H.join(3);
  await H.waitFor(pages[3], s => s.game && s.game.id === 'freefall' && !!window.__ffGame && window.__ffGame.state().adopted, 'DANA (a late joiner) is on the match screen', 40000);
  const sd = await until(async () => { const s = await state(pages[3]); return s.watching && s.hud.ghosts.length === 3 && s.hud.ghosts.some(g => g.moves > 0) ? s : null; }, 15000);
  const dNode = await dbGet(`rooms/${code}/ff/${m2}/${uids[3]}`), g2 = await dbGet(`rooms/${code}/game`);
  ok(!!sd && sd.hud.spect && !sd.proven && !sd.haveGo && !sd.out && !dNode && !g2.participants[uids[3]], `A LATE JOINER WATCHES: DANA has no run of her own (a spectator), writes nothing, is not in the match ("${sd && sd.hud.hud.watching}")`);
  ok(!!sd && sd.hud.layer.ghosts === 3 && sd.hud.hud.dots.length === 3 && /^WATCHING (ALICE|BOB|CHARLIE) · \d+/.test(sd.hud.hud.watching), `… she sees the three ghosts + their three dots on the rail, WATCHING THE LEADER (${sd && sd.hud.ghosts.map(g => `${g.name} ${g.floor}`).join(' · ')})`);
  const d1 = (await state(pages[3])).hud.watchFloor; await sleep(2500); const d2 = (await state(pages[3])).hud.watchFloor;
  ok(d2 > d1, `… the watched run falls on her screen (floor ${d1} → ${d2})`);
  await H.shot(pages[3], 'match-late-joiner');

  // ---- 5. A REFRESH mid-match: BOB reloads — his run is taken back up from his own node
  section = '5 refresh';
  const r0 = await stg(pages[1]), rNode = await dbGet(`rooms/${code}/ff/${m2}/${uids[1]}`), rLog = logFromChunks(rNode.c);
  ok(!r0.over && rLog && rLog.log.length > 0, `BOB is still falling (floor ${r0.floor}, ${rLog ? rLog.log.length : 0} moves in his node)`);
  await hand(pages[1], 'safe'); await sleep(700);
  const tR = Date.now();
  await H.refresh(pages[1]);
  await H.waitFor(pages[1], s => s.game && s.game.id === 'freefall' && !!window.__ffGame && window.__ffGame.state().adopted && !!window.__ffStage, 'BOB is back in the match after a refresh', 40000);
  const tBack = Date.now() - tR;
  const r1 = await state(pages[1]), r1s = await stg(pages[1]);
  ok(r1.seed === G2.SV.seed && r1.playAt === G2.SV.playAt && r1.haveGo && r1.proven && !r1.missed, `A REFRESH mid-match (${(tBack / 1000).toFixed(1)} s away): the same match, the same seed + clock, his own GO still his — proven`);
  let alive = !r1s.over;
  if (alive) {
    ok(r1s.entries >= rLog.log.length && r1s.floor >= r0.floor && r1.sent >= rLog.log.length, `… HIS RUN IS TAKEN BACK UP from his node: the ${rLog.log.length} moves of before replayed (floor ${r0.floor} → ${r1s.floor}), still falling`);
    await hand(pages[1], 'play');
    const r2 = await until(async () => { const s = await stg(pages[1]); return s.over || s.floor >= r1s.floor + 3 ? s : null; }, 15000);
    const kA = await chunksOf(uids[1]);
    ok(!!r2 && !r2.over && kA > Object.keys(rNode.c).length, `… and goes on: floor ${r2 && r2.floor}, new chunks behind the old ones (${Object.keys(rNode.c).length} → ${kA})`);
    alive = !!r2 && !r2.over;
  } else {
    const w = await until(async () => { const s = await state(pages[1]); return s.wroteE && s.watching ? s : null; }, 12000);
    ok(!!w && r1s.floor >= r0.floor, `… the darkness ended his ball while the page was away (floor ${r1s.floor}, ${r1s.cause}): his end is written, he WATCHES ("${w && w.hud.hud.watching}")`);
  }
  note(`the refresh: BOB ${alive ? 'TOOK HIS RUN BACK UP and fell on' : 'came back to a run the darkness had ended — he watches'}`);

  // ---- 4 (c). CHARLIE's phone locks for 10 s: the darkness ends his run behind the hidden page — never a pause
  section = '4 lock + signal';
  await hand(pages[2], 'safe'); await sleep(600);
  const c2 = await stg(pages[2]);
  if (!c2.over) {
    await hideShow(pages[2], true);
    await sleep(10000);
    const c3h = await pages[2].evaluate(`(() => { const s = ${STG}, h = document.querySelector('.ff-hold'); return { held: s.held, holds: s.holds, paused: !!h && !h.hidden }; })()`);
    await hideShow(pages[2], false);
    const c3 = await until(async () => { const s = await stg(pages[2]); return s.over ? s : null; }, 6000);
    ok(!c3h.held && !c3h.paused && !!c3 && c3.cause === 'dark' && c3.holds === 0, `A PHONE LOCKED 10 s: the run went on behind the hidden page and THE LIGHTS WENT OUT (floor ${c3 && c3.floor}, ${c3 && c3.cause}) — never PAUSED`);
    const cw = await until(async () => { const s = await state(pages[2]); return s.wroteE && s.out ? s : null; }, 8000);
    ok(!!cw, '… back: his end is written, he is OUT (the watcher\'s view follows)');
  } else ok(false, `CHARLIE was already out before the long lock (${c2.cause} at floor ${c2.floor})`);
  // the end of match 2: BOB + ALICE onto the red
  if (alive) await hand(pages[1], 'red');
  await hand(pages[0], 'red');
  await onPodium(R(4), 90000, 'match 2\'s podium');
  const J2 = await judged(code, m2, ids());
  ok(J2.same && J2.sorted, `match 2's podium = THE JUDGE's replay of each node; the server agrees (${J2.line})`);
  const rb = J2.fin.results[uids[1]], rc = J2.fin.results[uids[2]], sb2 = J2.srv.game ? J2.srv.game.results[uids[1]] : {};
  ok(!rb.bad && !sb2.bad && rb.f >= bStg.floor, `THE DROPPED SIGNAL was not held against BOB: his run is judged ${rb.cut || sb2.cut ? `CUT (${JSON.stringify(sb2.cut || rb.cut)})` : 'HONEST, in full'} — floor ${rb.f}, ${rb.w} (the host's row + the strict server's)`);
  note(`the signal drop: BOB's row ${rb.cut || sb2.cut ? 'was CUT' : 'counts in full — no cut'} (host: ${JSON.stringify(rb)} · server: ${JSON.stringify(sb2)})`);
  ok(!rc.bad && !rc.cut && rc.w === 'dark' && !(J2.srv.game.results[uids[2]] || {}).bad, `THE LOCKED PHONE's proof stayed valid: CHARLIE's row floor ${rc.f}, ${rc.w} — no cut, nothing refused`);
  ok(!J2.fin.participants[uids[3]] && !J2.fin.results[uids[3]] && (await podiumOf(pages[3], NAMES.slice(0, 4))).order.indexOf('DANA') < 0, 'DANA (who only watched) sees the podium too — she has no row on it');

  // ---- the next REMATCH deals DANA in
  section = '2 late joiner';
  ok(await rematchTap(host), 'the host taps REMATCH again');
  const I4 = R(4), seen3 = await watchCount(I4, m2, null);
  const G3 = await goChecks(I4, code, seen3, 'the next REMATCH deals DANA in — four balls: ');
  const m3 = G3.m, g3 = await dbGet(`rooms/${code}/game`);
  ok(Object.keys(g3.participants).length === 4 && g3.participants[uids[3]] && (await state(pages[3])).haveGo && !(await state(pages[3])).hud.spect, '… DANA is a player now: her own GO, her own ball');

  // ---- 3. THE HOST's PHONE DIES mid-match: the next phone carries the match on to its `final`
  section = '3 host change';
  await all(I4, p => hand(p, 'play'));
  await until(async () => (await all(I4, floorOf)).every(f => f >= 3), 30000);
  const aFloor = await floorOf(pages[0]), t0 = Date.now();
  const hi = await H.killHost({ timeout: 60000 });
  ok(hi !== 0, `THE HOST's PHONE DIES mid-match (floor ${aFloor}): ${NAMES[hi]} is the host now (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  const L3 = [1, 2, 3];
  ok((await all(L3, stg)).every(s => s && !s.over) && (await all(L3, state)).every(s => s.matchId === m3 && !s.final), '… the match goes on on the three phones left (nobody thrown out, no podium yet)');
  await hand(pages[1], 'red'); await hand(pages[2], 'safe');
  await sleep(6000);
  await hand(pages[3], 'red');
  const wl = await until(async () => { const t = (await state(pages[1])).hud.hud.watching; return /WAITING FOR ALICE/.test(t) ? t : null; }, 30000, 300);
  ok(!!wl, `… everyone seen is out: the room waits for the dead phone's end, and says so ("${wl || (await state(pages[1])).hud.hud.watching}")`);
  await onPodium(L3, (IDLE_OUT_MS + DROP_WAIT_MS) + 60000, 'the podium, from the new host\'s step');
  const J3 = await judged(code, m3, I4.map(i => uids[i]));
  ok(J3.fin.matchId === m3 && J3.fin.phase === 'final' && J3.same && J3.sorted, `the new host's podium = the judge's replay of every node — the dead phone's too (${J3.line}); the server agrees (${((Date.now() - t0) / 1000).toFixed(0)} s after her phone died)`);
  ok(J3.fin.results[uids[0]].f >= aFloor - 1 && !J3.fin.results[uids[0]].bad, `… ALICE's row = what her phone had sent: floor ${J3.fin.results[uids[0]].f}, ${J3.fin.results[uids[0]].w || '—'}`);
  await H.shot(pages[hi], 'match-podium-new-host');
  // REMATCH on a PLAIN host's phone (the old host gone): FREEFALL is playable — a new match (THE GO-LIVE; it was "Coming soon" while hidden)
  const bar3 = (await podiumOf(pages[hi], NAMES.slice(0, 4))).bar;
  ok(await rematchTap(pages[hi]), `the new host taps ${bar3}`);
  const m4 = await until(async () => { const g = await H.evalIn(pages[hi], s => s.game && s.game.matchId); return g && g !== m3 ? g : null; }, 20000);
  ok(!!m4, `REMATCH on ${NAMES[hi]}'s phone (a plain host) starts a NEW match (${m3} → ${m4})`);
}

// =====================================================================================================================================
// B — AN 8-PLAYER MATCH + THE NETWORK MEASURE
async function partB() {
  section = '6 eight players';
  let N = 8, room = null;
  try { room = await openRoom('fe', N); } catch (e) { note(`8 phones did not come up on this machine: ${e.message}`); throw e; }
  const { host, code } = room, I = R(N), ids = I.map(i => uids[i]);
  const seen = await ownerStart(host, I, 'eight-count', `the host starts FREEFALL for a room of ${N}`);
  const { m } = await goChecks(I, code, seen, `${N} players — `);
  const n0 = netSnap(), t0 = await treeStat(code, m, ids);
  await all(I, (p, i) => (i % 2 ? hand(p, 'play') : (async () => { await hand(p, 'safe'); await sleep(600 + 250 * i); await hand(p, 'play'); })()));
  const up = await until(async () => { const s = await all(I, p => p.evaluate(GH)); return s.every(x => x && x.floor >= 3 && x.g.length === N - 1 && x.g.every(g => g.moves > 0)) ? s : null; }, 40000);
  const huds = await all(I, async p => (await state(p)).hud);
  ok(!!up && huds.every(h => h.layer.ghosts === N - 1 && h.ghosts.length === N - 1), `${N - 1} GHOSTS on every phone (the layer: ${JSON.stringify(huds[0].layer)})`);
  ok(huds.every(h => h.hud.dots.length === N && h.hud.dots.some(d => d.uid === 'me') && h.ghosts.every(g => !g.bad)), `THE DEPTH RAIL: ${N} dots on every phone; no ghost's move refused`);
  await H.shot(pages[0], 'eight-ghosts'); await H.shot(pages[5], 'eight-ghosts-2');
  // THE NETWORK MEASURE — a steady window with all eight falling
  const na = netSnap(), ta = await treeStat(code, m, ids);
  const gt = await ghostTrack(I, 40);
  const tb = await treeStat(code, m, ids), nb = netSnap();
  const aliveNow = (await all(I, stg)).filter(s => s && !s.over).length;
  ok(aliveNow === N, `all ${N} still falling over the measured window (${aliveNow})`);
  ok(gt.bad === 0 && gt.play <= 3, `the ${N - 1} ghosts a phone follow the rivals' real floors (at most ${gt.play} off over ${gt.n} samples${gt.lost ? `; ${gt.lost} samples not drawn` : ''})`);
  measure(`${N} players, all falling`, I, ta, tb, na, nb);
  const fr = await pages[0].evaluate("(() => { const f = window.__ffStage.frames(), s = f.reduce((a, b) => a + b, 0); return { fps: Math.round(1000 * f.length / s), worst: Math.round(Math.max(...f)) }; })()");
  note(`ALICE's phone with ${N - 1} ghosts (one of ${N} headless pages on this machine's GPU): ${fr.fps} fps, worst frame ${fr.worst} ms`);
  // everyone's end: the red for six, the darkness for two
  for (const i of I) { await hand(pages[i], i < 2 ? 'safe' : 'red'); await sleep(250); }
  await onPodium(I, 60000);
  const tz = await treeStat(code, m, ids), nz = netSnap();
  const whole = measure(`${N} players, the WHOLE match as played (${((tz.at - t0.at) / 1000).toFixed(0)} s, GO → the podium)`, I, t0, tz, n0, nz);
  note(`the whole ${N}-player match as played: ${tz.per.reduce((a, p) => a + p.chunks + p.other, 0)} writes into the proof tree (${tz.per.map(p => p.chunks).join(' / ')} chunks), the tree ${tz.bytes} B, up ${nz.reduce((a, x, i) => a + x.tx - n0[i].tx, 0)} B, down ${nz.reduce((a, x, i) => a + x.rx - n0[i].rx, 0)} B over ${whole.secs} s`);
  const J = await judged(code, m, ids);
  ok(J.sameHonest && J.sorted && Object.keys(J.fin.results).length === N, `everyone's end → the podium: ${N} rows = the judge's replay; the server agrees (${J.line})${J.copies.length ? ` — ${J.copies.length} test phone(s) playing the SAME hand refused 'copy' by the server's COPYCAT (FIX C — the server's alone): ${J.copies.map(u => NAMES[uids.indexOf(u)]).join(', ')}` : ''}`);
  if (J.copies.length) note(`THE COPYCAT in the 8-phone fixture: ${J.copies.length} of ${N} nodes refused 'copy' (the test's one hand on one tower — a real room never lands alike)`);
  await sleep(900);
  const pod = await all(I, p => podiumOf(p, NAMES.slice(0, N)));
  const want = J.st.map(r => NAMES[uids.indexOf(r.uid)]).join(' ');
  // (F5B — THE FINAL SHAPE: THIS MATCH's TOP 3 on every phone, in the ranking's order; a player 4th or lower reads "YOU · 5TH · 49 FLOORS")
  const top3 = want.split(' ').slice(0, 3).join(' '), ordN = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH'}`;
  // (F5C — a SHARED place: a phone whose player shares the 3rd place but is 4th in the list sees ITSELF in that slot — ui/end-board.js#pickRows)
  const topOf = i => { const t = J.st.slice(0, 3), me = J.st.find(q => q.uid === uids[i]); if (me && !t.includes(me) && me.rank <= 3) { const k = t.map(q => q.rank).lastIndexOf(me.rank); if (k >= 0) t[k] = me; } return t.map(q => NAMES[uids.indexOf(q.uid)]).join(' '); };
  ok(pod.every(x => x && /^Freefall, match · MATCH$/.test(x.kicker)) && pod.every((x, i) => x.ebRows === 3 && x.order.slice(0, 3).join(' ') === topOf(i)), `the podium on all ${N} phones: THIS MATCH's TOP 3 in the ranking's order (${top3}; a shared 3rd place shows the phone's own player) — ${pod.map(x => (x ? x.order.slice(0, 3).join(' ') : '—')).join(' | ')}`);
  const yous = pod.map((x, i) => { const r = J.st.find(q => q.uid === uids[i]); return { want: r.rank >= 4 ? `YOU · ${ordN(r.rank)} · ${J.fin.results[uids[i]].f} FLOORS` : '', got: x.you }; });
  ok(yous.every(y => y.got === y.want) && pod.every(x => x.scroll <= 1), `… the YOU line from 4th down only (${yous.map(y => y.got || '—').join(' | ')}); nothing scrolls`);
  await H.shot(pages[0], 'eight-podium'); await H.shot(pages[3], 'eight-podium-2');
}

// =====================================================================================================================================
// C — THE 3:00 CAP, in real time (`--cap`)
async function partC() {
  section = '7 the cap';
  const { host, code } = await openRoom('fc', 2), I = R(2), ids = I.map(i => uids[i]);
  const seen = await ownerStart(host, I, null, 'the host starts FREEFALL for two');
  const { m, SV } = await goChecks(I, code, seen, '2 players — ');
  const n0 = netSnap(), t0 = await treeStat(code, m, ids);
  await pacer(pages[0]); await sleep(2500); await pacer(pages[1]);
  const left = () => SV.playAt + 180000 - Date.now();
  ok(await until(async () => (await all(I, async p => (await state(p)).hud.hud.clock)).every(c => c === ''), 5000), 'no clock on screen in the first two and a half minutes');
  await until(() => left() < 31500, 200000, 500);
  const mid = await all(I, stg);
  ok(mid.every(s => !s.over), `two and a half minutes in, both still falling (floors ${mid.map(s => s.floor).join(' / ')})`);
  const tm = await treeStat(code, m, ids), nm = netSnap();
  measure('2 players, 2:30 of a real 3:00 match', I, t0, tm, n0, nm);
  const clk = await until(async () => { const c = await all(I, async p => (await state(p)).hud.hud.clock); return c.every(x => /^0:[0-2]\d$/.test(x)) ? c : null; }, 12000, 100);
  ok(!!clk, `THE LAST HALF MINUTE's clock is up on both phones ("${clk ? clk.join('" · "') : (await all(I, async p => (await state(p)).hud.hud.clock)).join('" · "')}", ${(left() / 1000).toFixed(1)} s left)`);
  await H.shot(pages[0], 'cap-clock');
  const cards = await until(async () => { const c = await all(I, outCardOf); return c.every(Boolean) ? c : null; }, 45000, 60);
  const end = await all(I, stg);
  ok(end.every(s => s.st === 'cap' && s.t === 180 * 60), `AT 3:00 — TIME'S UP for both, where they stand (floors ${end.map(s => s.floor).join(' / ')}, tick ${end.map(s => s.t).join(' / ')})`);
  ok(!!cards && cards.every(c => c.k === 'THE BELL' && c.w === END_WORDS.cap), `the card: ${cards ? `${cards[0].k} · ${cards[0].w} · ${cards[0].n}` : 'never seen'}`);
  await H.shot(pages[1], 'cap-bell');
  await onPodium(I, 30000);
  const J = await judged(code, m, ids);
  ok(J.same && J.sorted && ids.every(u => J.fin.results[u].w === 'cap' && J.srv.game.results[u].w === 'cap'), `the podium: \`cap\` rows from the judge — the server agrees (${J.line})`);
  const tz = await treeStat(code, m, ids), nz = netSnap();
  measure('2 players, a REAL 3:00 match (GO → the podium)', I, t0, tz, n0, nz);
  await H.shot(pages[0], 'cap-podium');
}


// =====================================================================================================================================
// D — FIX B (docs/games/passes/freefall-fixb.md): G2 A YIELDED DUPLICATE TAB never writes proof, then TAKES OVER · S15 THE CLOCK AFTER A LOCK
// (the page's clock slept) · S6 (a) a deliberate LEAVE writes `e` · the podium comes at once after them · S9 THE PODIUM's FALLBACK
async function partD() {
  section = 'D fix b';
  const { host, code } = await openRoom('fd', 3), I = R(3), ids = I.map(i => uids[i]);
  // (S9: CHARLIE's shared end-board block is taken away the moment it appears — as ui/final.js does when its import fails)
  await pages[2].evaluateOnNewDocument(() => { new MutationObserver(() => { for (const e of document.querySelectorAll('.final-eb')) e.remove(); }).observe(document, { childList: true, subtree: true }); });
  await pages[2].evaluate(() => { new MutationObserver(() => { for (const e of document.querySelectorAll('.final-eb')) e.remove(); }).observe(document, { childList: true, subtree: true }); });
  const seen = await ownerStart(host, I, null, 'the host starts FREEFALL for three');
  const { m } = await goChecks(I, code, seen, '3 players — ');
  await all(I, p => hand(p, 'play'));
  await until(async () => (await all(I, floorOf)).every(f => f >= 3), 30000);
  // ---- G2: BOB opens the game AGAIN in a second tab (the same slot): the new tab yields — it WATCHES, writes nothing
  const url = pages[1].url(), tab2 = await H.ctxs[1].newPage();
  tab2.on('pageerror', e => BOOK.errors.push(`[${section}] BOB tab 2 pageerror: ${e.message}`));
  await tab2.setViewport({ width: 390, height: 844 });
  await tab2.goto(url);
  await pages[1].bringToFront();   // (THE TAB YOU LOOK AT PLAYS — identity.js: the first tab stays on screen, the new one yields behind it)
  const y = await until(async () => { const d = await tab2.$('.dup-tab'), s = await tab2.evaluate('window.__ffGame ? window.__ffGame.state() : null'); return d && s && s.adopted ? s : null; }, 40000);
  const nodeA = await dbGet(`rooms/${code}/ff/${m}/${uids[1]}`);
  await sleep(2500);
  const y2 = await tab2.evaluate('window.__ffGame.state()'), nodeB = await dbGet(`rooms/${code}/ff/${m}/${uids[1]}`);
  ok(!!y && y2.dupSeen && y2.dup && !y2.proven && y2.sent === y.sent && y2.chunks === y.chunks && !y2.end && !y2.stranded && y2.hud.spect, `G2 — A YIELDED DUPLICATE TAB: adopted as a WATCHER, writes nothing (dupSeen ${y2.dupSeen} · proven ${y2.proven} · its writer still at the node's ${y2.sent} moves / ${y2.chunks} chunks · end ${y2.end} · stranded ${y2.stranded}) — "${y2.hud.hud.watching}"`);
  ok(!nodeB.e && Object.keys(nodeB.c || {}).length >= Object.keys(nodeA.c || {}).length, `… BOB's run goes on from his FIRST tab (${Object.keys(nodeA.c || {}).length} → ${Object.keys(nodeB.c || {}).length} chunks, no end)`);
  await H.shot(tab2, 'fixb-dup-tab');
  // … THE SECOND TAB ON SCREEN: it TAKES OVER — as a refresh: his own moves replayed from the node, proven, writing on
  await hand(pages[1], 'safe'); await sleep(900);
  await tab2.bringToFront();   // (the yielded tab brought on screen takes over — the owner's rule; USE THIS TAB does the same)
  const took = await until(async () => { const s = await tab2.evaluate('window.__ffGame.state()'); return !s.dup && !s.dupSeen && s.adopted && s.proven && !s.hud.spect ? s : null; }, 20000);
  const old = await until(async () => { const s = await pages[1].evaluate('window.__ffGame.state()'); return s.dup ? s : null; }, 15000);
  ok(!!took && !!old, `… brought on screen, the second tab TAKES OVER (proven ${took && took.proven}, a player again, ${took && took.sent} moves taken back up from the node) — the first one yields (dup ${old && old.dup})`);
  await tab2.evaluate(() => { if (window.__ffStage) window.__ffStage.auto = 'play'; });
  const c0 = Object.keys((await dbGet(`rooms/${code}/ff/${m}/${uids[1]}`)).c || {}).length;
  const grew = await until(async () => { const n = await dbGet(`rooms/${code}/ff/${m}/${uids[1]}`); return n && !n.e && Object.keys(n.c || {}).length > c0 + 1 ? n : null; }, 15000);
  const oldW = await pages[1].evaluate('window.__ffGame.state()');
  ok(!!grew, `… his run's chunks now come from the second tab (${c0} → ${grew ? Object.keys(grew.c).length : '?'}); the yielded first tab sends nothing more (proven ${oldW.proven})`);
  await pages[1].close(); pages[1] = tab2;
  // ---- S15 THE CLOCK AFTER A LOCK: CHARLIE's phone locks on safe ground and its PAGE CLOCK sleeps 20 s (iOS) — back, the ball is where
  //      the match's clock says (the darkness has had him), never where it hung
  await hand(pages[2], 'safe'); await sleep(500);
  const s0 = await stg(pages[2]);
  await hideShow(pages[2], true); await sleep(400);
  await pages[2].evaluate(() => { const real = performance.now.bind(performance), raf = window.requestAnimationFrame.bind(window); performance.now = () => real() - 20000; window.requestAnimationFrame = cb => raf(t => cb(t - 20000)); });
  await hideShow(pages[2], false);
  const s1 = await until(async () => { const s = await stg(pages[2]); return s.over ? s : null; }, 3000, 50);
  ok(!!s1 && s1.cause === 'dark', `S15 — 20 s of a SLEPT page clock on safe ground: back, the run is OUT at once (THE LIGHTS WENT OUT — ${s1 ? `${s1.cause} @${s1.floor}` : `still falling @${(await stg(pages[2])).floor}`}; floor ${s0.floor} before)`);
  // ---- S6 (a) A DELIBERATE LEAVE: BOB leaves the room mid-run → his END is written at once (w: 'left')
  const b0 = await stg(pages[1]);
  ok(!b0.over, `BOB is still falling (floor ${b0.floor})`);
  const tL = Date.now();
  await pages[1].evaluate(() => import('/js/room.js').then(r => r.leaveRoom()));
  const eL = await until(async () => { const n = await dbGet(`rooms/${code}/ff/${m}/${uids[1]}`); return n && n.e ? n.e : null; }, 10000, 100);
  ok(!!eL && eL.w === 'left', `S6 (a) — A LEAVE mid-run writes BOB's END at once (${eL ? `${JSON.stringify(eL)}, ${((Date.now() - tL) / 1000).toFixed(1)} s` : 'never'}) — the others never wait 18 + 75 s`);
  // ---- … ALICE goes out: the podium comes now (every run has ended), not 93 s later
  await hand(pages[0], 'red');
  const tA = Date.now();
  await onPodium([0, 2], 30000, 'the podium after the leaver');
  ok(Date.now() - tA < 20000, `… ALICE out → the podium in ${((Date.now() - tA) / 1000).toFixed(1)} s (BOB left, CHARLIE out)`);
  // ---- S9 THE PODIUM's FALLBACK: CHARLIE's shared block never came → a plain three-line list names the winner
  const pl = await until(async () => pages[2].evaluate(() => { const l = document.querySelector('.ff-final .ff-fin-plain'); return l ? [...l.querySelectorAll('li')].map(li => li.textContent) : null; }), 8000);
  const g = await dbGet(`rooms/${code}/game`), first = gameStandings(g)[0], nm = n => NAMES[uids.indexOf(n)];
  ok(!!pl && pl.length === 3 && pl[0].startsWith('1') && (first.uid === uids[1] || pl[0].includes(nm(first.uid))) && !(await pages[2].$('.final-eb')), `S9 — no end-board block on CHARLIE's podium → THE PLAIN LIST: ${pl ? pl.join(' / ') : 'none'} (the winner ${nm(first.uid)})`);
  ok(!(await pages[0].$('.ff-final .ff-fin-plain')) && !!(await pages[0].$('.ff-final .eb.has-rows')), '… ALICE\'s block came: no plain list there');
  await H.shot(pages[2], 'fixb-podium-fallback');
}


// E — FIX B S8: A NON-PARTICIPANT in a solo-mode room (back after the start): no GO, no run — "PLAYING — WAIT FOR THE REMATCH"
async function partE() {
  section = 'E fix b S8';
  const { host, code } = await openRoom('fe', 2);
  const url = pages[1].url();
  await pages[1].close();   // (BOB's phone is away at the start: the room's game is the owner's SOLO run)
  await until(async () => { const pr = await dbGet(`rooms/${code}/presence/${uids[1]}`); return !pr || !pr.c; }, 20000);
  ok(await H.startGame(host, 'freefall', {}), 'the host starts FREEFALL with BOB away');
  const g = await until(async () => { const x = await dbGet(`rooms/${code}/game`); return x && x.id === 'freefall' ? x : null; }, 20000);
  ok(!!g && g.mode === 'solo' && !g.participants[uids[1]], `the room's game is the owner's SOLO run (${g && g.mode}, ${g && Object.keys(g.participants).length} participant)`);
  await hand(host, 'play');
  await host.evaluate(() => { const S = window.__ffStage; if (S && S.begin) S.begin(); });
  // … BOB comes back mid-run
  const b = await H.ctxs[1].newPage(); pages[1] = b;
  b.on('pageerror', e => BOOK.errors.push(`[${section}] BOB pageerror: ${e.message}`));
  await b.setViewport({ width: 390, height: 844 }); await b.goto(url);
  const on = await until(async () => b.evaluate("(() => { const n = document.querySelector('.ff-stage .ff-note'); return window.__ffStage && n && !n.hidden ? n.textContent : null; })()"), 40000);
  ok(on === 'PLAYING — WAIT FOR THE REMATCH', `S8 — BOB is back after the start: "${on}"`);
  await b.mouse.move(195, 600); await b.mouse.down(); await b.mouse.move(260, 600, { steps: 4 }); await b.mouse.up(); await sleep(1500);
  const bs = await stg(b), bn = await dbGet(`rooms/${code}/ff/${g.matchId}/${uids[1]}`), gs = await state(b);
  ok(!bs.started && !bn && gs && !gs.proven && gs.sent === 0, `… a drag starts NOTHING: no run (started ${bs.started}), no proof node (${bn ? 'written!' : 'none'}), nothing sent`);
  await H.shot(b, 'fixb-not-here');
}

const PARTS = [['a', partA, true], ['b', partB, !FAST], ['c', partC, CAP], ['d', partD, true], ['e', partE, true]];
for (const [id, fn, on] of PARTS) {
  if (ONLY ? !ONLY.split(',').includes(id) : !on) continue;
  let fatal = null;
  try { await fn(); } catch (e) { fatal = e; }
  await closeRoom(fatal);
}
await dbPut('testFreefallCounts', null);
// ---- the summary
const secs = [...new Set(BOOK.checks.map(c => c.section))];
console.log('');
for (const s of secs) { const c = BOOK.checks.filter(x => x.section === s); console.log(`SECTION ${s}: ${c.filter(x => x.ok).length}/${c.length}`); }
for (const r of BOOK.net) console.log(`NET ${JSON.stringify(r)}`);
for (const c of BOOK.checks) if (!c.ok) console.log(`FAIL [${c.section}] ${c.what}`);
for (const e of BOOK.errors) console.log(`ERR ${e}`);
const passed = BOOK.checks.filter(c => c.ok).length;
console.log(`${passed}/${BOOK.checks.length} checks passed${BOOK.errors.length ? ` · ${BOOK.errors.length} page errors` : ''}`);
writeFileSync(`${OUTDIR}/result.json`, JSON.stringify(BOOK, null, 1));
process.exit(passed === BOOK.checks.length && !BOOK.errors.length ? 0 : 1);
