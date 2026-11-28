// CITY 2.0 — THE HARBOR end to end: LOBBY 2.0 A (Nov 3 — docs/harbor/passes/lobby-2a.md). `billboard`: THE ANNOUNCEMENT BILLBOARD's
// cross-fade (the owner: his message "snaps on"). More groups of this pass join here (the room in the city, the dock, the guest list…).
// ADDING A GROUP: G('name', …) in its job's file + the name in ../harbor-jobs.mjs (CI_JOBS).
import { BASE, log, sleep, ok, okT, NIGHT, open, ev, waitFor, harborUp, G, OUT, SHOTS, ON_CI, skipCI, skipNoDisplay } from './kit.mjs';
import { displayAttached } from '../kit/puppeteer.mjs';

const RM = { fn: () => { const mm = window.matchMedia.bind(window); window.matchMedia = q => (/prefers-reduced-motion/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q)); }, arg: null };

G('billboard', async () => {
  // a fresh load MID-MESSAGE (a link's &force=billboard-hints keeps the hint up): the message is simply there — nothing fades
  { const Q = await open({ slot: 'bx0', qs: `${NIGHT}&wx=clear&force=billboard-hints&hint=fireworks`, view: [402, 874] }), p = Q.page;
    // (the link's hint loops 20 s on / 10 s off from the load — a slow load on a busy machine must not reach the off spell: look soon)
    await harborUp(p); await sleep(1500);
    const x = await ev(p, 'window.__district.boardXf()');
    ok(x && x.n === 0, `THE BILLBOARD — a fresh load mid-message: the message is simply there, no fade (${x && x.n} fades)`);
    await Q.ctx.close(); }
  // the panel's JUST ME switch (the same path as the owner's message on the board): the game → the hint at once, then the hint → the game
  const run = async (slot, rm, dpr = 0) => {
    const Q = await open({ slot, qs: `${NIGHT}&wx=clear&hint=fireworks`, view: [402, 874], dpr, init: rm ? RM : null }), p = Q.page;
    await harborUp(p); await sleep(2500);
    await waitFor(p, '!!window.__district.remote()', 'the panel', 10000);
    const n0 = (await ev(p, 'window.__district.boardXf()')).n;
    await ev(p, "window.__district.remote().setMine({ force: ['billboard-hints'] })");
    await waitFor(p, `window.__district.boardXf().n > ${n0}`, 'the board swaps (the game → the hint)', 8000);
    const xs = [];
    for (let i = 0; i < 16; i++) { xs.push(await ev(p, '(() => { const x = window.__district.boardXf(); return { a: x.a, t: performance.now() }; })()')); await sleep(70); }
    const x1 = await ev(p, 'window.__district.boardXf()');
    await Q.ctx.close();
    return { xs, x1 };
  };
  { const { xs, x1 } = await run('bx', false);
    const first = xs.find(s => s.a > 0), lastOn = [...xs].reverse().find(s => s.a > 0), mono = xs.every((s, i) => i === 0 || s.a <= xs[i - 1].a + 0.001);
    ok(x1.ms === 900 && first && first.a > 0.4 && mono && xs[xs.length - 1].a === 0, `THE BILLBOARD CROSS-FADES (the day's game → the message): the old board's copy fades out over ${x1.ms} ms on the ${x1.layer} layer — ${xs.map(s => s.a.toFixed(2)).join(' ')}`);
    okT(lastOn && first && lastOn.t - first.t < 1100, `the fade ends within ~0.9 s (${lastOn && first ? Math.round(lastOn.t - first.t) : '—'} ms of it seen)`); }
  { const { xs, x1 } = await run('bx3', false, 3);
    ok(x1.layer === 'crisp' && xs.some(s => s.a > 0.3) && xs[xs.length - 1].a === 0, `THE BILLBOARD at 3× (an iPhone): the fade on the CRISP layer (${x1.layer}) — ${xs.map(s => s.a.toFixed(2)).join(' ')}`); }
  { const { xs, x1 } = await run('bxr', true);
    ok(x1.ms === 250 && xs[xs.length - 1].a === 0, `THE BILLBOARD — reduced motion: a quick plain fade (${x1.ms} ms)`); }
  log('billboard', 'done');
});

// ---- THE TRI-VISION (Nov 12 night — core/harbor-trivision.js): the roof board turns HOLD'EM ↔ JAYWALK by THE CITY TIMETABLE's clock — two pages on
// the live clock show the SAME face at the same server moment; the first JAYWALK face arrives BY A TURN (the board held HOLD'EM until JAYWALK's art
// had decoded — never a pop-in); the slats run on the crisp layer; reduced motion = a cut. &force=trivision = a turn every 8 s.
G('trivision', async () => {
  const qs = 'wx=clear&force=trivision,no-hints';
  const A = await open({ slot: 'tva', qs, view: [402, 874], dpr: 3 }), B = await open({ slot: 'tvb', qs, view: [390, 844] });
  await Promise.all([harborUp(A.page), harborUp(B.page)]);
  const tri = p => ev(p, 'window.__district.tri()');
  const t0 = await tri(A.page);
  // (CITY H2 — ONE FACE FROM THE FIRST FRAME: the board is ON the newest game (JAYWALK) at the reveal — its picture warmed under the boot screen,
  //  a CUT before any frame was painted, never an opening turn after it; then the shared clock's turns)
  // (CITY PART 2 — the cloud's red after CITY PART 1: the rotation is HIGH RISE → JAYWALK → HOLD'EM now, and &force=trivision dates JAYWALK
  //  yesterday — the newest face is whichever the page's own dates say (core/harbor-trivision.js#newestFace), not a fixed JAYWALK)
  const want0 = await ev(A.page, "import('/js/core/harbor-trivision.js').then(m => { const t = window.__district.tri(); return t && t.faces ? t.faces[m.newestFace(t.faces, m.faceDates())] : null; })");
  ok(t0 && want0 && t0.opened === want0 && (t0.board === want0 || ((t0.turns || [])[0] || {}).from === want0) && !(t0.turns || []).some(x => /^o/.test(x.id)), `THE TRI-VISION — at the reveal the board is ALREADY on the newest game (${t0 && t0.board}; opened ${t0 && t0.opened}, the newest ${want0}; the picture warmed: ${t0 && t0.warmed})`);
  await waitFor(A.page, '(() => { const t = window.__district.tri(); return t && t.turns.length >= 1; })()', 'a turn', 30000).catch(() => {});
  const t1 = await tri(A.page), first = t1.turns[0];
  ok(first && /^c|^f/.test(first.id) && first.from === t0.opened, `the first turn is the CLOCK's, from the opening face (${first ? `${first.id}: ${first.from} → ${first.to}` : 'no turn'})`);
  // mid-turn: the slats on the crisp layer (an iPhone's 3×), then the board holds the new face
  await waitFor(A.page, '(() => { const t = window.__district.tri(); return t && t.turn && t.turn.u > 0.1 && t.turn.u < 0.9; })()', 'mid-turn', 20000).catch(() => {});
  const mid = await ev(A.page, "(() => { const t = window.__district.tri(); const cv = [...document.querySelectorAll('canvas.hc-crisp')].length; return { u: t.turn && t.turn.u, cv }; })()");
  ok(mid.u > 0 && mid.u < 1 && mid.cv > 0, `the slats turn on the crisp layer (u ${mid.u && mid.u.toFixed(2)}, ${mid.cv} crisp canvases)`);
  await waitFor(A.page, '(() => { const t = window.__district.tri(); return t && !t.turn && t.shown === t.clock && t.board === (t.turns.at(-1) || {}).to; })()', 'the turn lands', 10000).catch(() => {});
  const t2 = await tri(A.page);
  ok(!t2.turn && t2.board === (t2.turns.at(-1) || {}).to, `after the turn the board HOLDS the new face (${t2.board}) — the overlay gone once its bake landed`);
  // the same face at the same server moment on two pages (B joins the clock at its own next turn)
  await waitFor(B.page, '(() => { const t = window.__district.tri(); return t && t.turns.length >= 1 && !t.turn; })()', 'B turned', 30000).catch(() => {});
  let same = null;
  for (let i = 0; i < 6 && !same; i++) {
    const [a, b] = await Promise.all([tri(A.page), tri(B.page)]);
    if (!a.turn && !b.turn && a.n === b.n) same = { a, b };
    else await sleep(900);
  }
  ok(same && same.a.shown === same.b.shown && same.a.board === same.b.board && same.a.clock === same.a.shown, `TWO PAGES, ONE FACE: turn ${same && same.a.n} — A shows ${same && same.a.board}, B ${same && same.b.board} (the clock's face ${same && same.a.clock})`);
  // FR7 FIXES C — THE JAYWALK POSTER READS (the owner, Nov 13): on the LIVE board at 390 / 402 / 430, JAYWALK's lettering ≥ HOLD'EM's (the word's cap
  // + the band's words vs NOW OPEN — the faces' own layout functions on the board's real rect, in pt)
  { const C = await open({ slot: 'tvc', qs, view: [430, 932] }); await harborUp(C.page);
    const capsOn = p => ev(p, "(async () => { const b = window.__district.harbor().neon.boards[0]; if (!b || !b.rect) return null; const R = b.rect; const J = await import('/js/screens/harbor/jaywalk-art.js'), H = await import('/js/screens/harbor/holdem-art.js'); return { w: +R.w.toFixed(1), h: +R.h.toFixed(1), jw: J.capsOf(R, 'soon'), he: H.holdemCaps(R, 'open') }; })()");
    const rows = [];
    for (const [phone, p] of [[390, B.page], [402, A.page], [430, C.page]]) { const c = await capsOn(p); if (c) rows.push({ phone, ...c }); }
    const f = v => v.toFixed(1);
    ok(rows.length === 3 && rows.every(r => r.jw.word >= r.he.word - 0.01 && r.jw.bar >= r.he.bar - 0.01),
      `THE JAYWALK POSTER READS — the lettering's cap height in pt, JAYWALK ≥ HOLD'EM: ${rows.map(r => `${r.phone}: JAYWALK ${f(r.jw.word)} ≥ HOLD'EM ${f(r.he.word)} · COMING SOON ${f(r.jw.bar)} ≥ NOW OPEN ${f(r.he.bar)} (the board ${r.w}×${r.h})`).join(' | ')}`);
    await C.ctx.close(); }
  await A.ctx.close(); await B.ctx.close();
  // reduced motion: a cut at the turn — no slats
  { const R = await open({ slot: 'tvr', qs, view: [402, 874], init: RM }); await harborUp(R.page);
    await waitFor(R.page, '(() => { const t = window.__district.tri(); return t && t.ready && t.lastN != null && t.shown !== 0; })()', 'a cut', 30000).catch(() => {});
    const r = await tri(R.page);
    ok(r.shown !== 0 && !r.turns.length && !r.turn, `reduced motion: a CUT at the turn (the face ${r.board}, no slats: ${r.turns.length} turns drawn)`);
    await R.ctx.close(); }
  log('trivision', 'done');
});

// ---- CITY G — THE ROOF BOARD's LOADER (the owner's /admin, Nov 17 7:26 pm: HOLD'EM ON · JAYWALK ON · THE DROP KEEP ON, yet the board turned only
// HOLD'EM → THE DROP): the city is destroyed + rebuilt on every game start / return, the posters live at module level — a scene destroyed while its
// picture was still loading took the answer with it and the REBUILT scene never showed the face. Here: the JAYWALK picture held back 5 s, the city
// destroyed + rebuilt mid-load (the title → a menu → the title: the same teardown a game start takes) → all THREE faces turn within a cycle; the same
// with the OPEN DAY forced (the OPEN NOW poster).
// CITY H2 — the 4:03 pm entry, THE ROOF BOARD FLICKERS (the owner's iPhone: THE DROP → a flash of HOLD'EM → THE DROP): ONE face from the first
// painted frame until the next real turn. The live feed as the owner's site has it (JAYWALK NOW OPEN with no OPEN DAY stored — switched Nov 17 —
// THE DROP live since 11-15); every frame from the reveal for 10 s records what the board shows: exactly ONE face, JAYWALK's, no opening turn
G('trionce', async () => {
  const live = await (await fetch(`${BASE}/api/admin?live=1`)).json().catch(() => ({}));
  const rd = live.radio || {}, feed = JSON.stringify({ ...live, at: Date.now(), radio: { ...rd, base: { ...(rd.base || {}), jaywalk: { on: true, bar: 'open', open: null, since: '2026-11-12' } }, drop: { live: '2026-11-15', mode: 'on' } } });
  // (390: a FIRST visit — the timetable's default until the feed; 402 at 4× CPU: a RETURNING phone — the last feed kept in its localStorage)
  for (const [w, h, cpu, back] of [[390, 844, 1, false], [402, 874, 4, true]]) {
    const Q = await open({ slot: `tro${w}`, qs: 'wx=clear&when=2026-11-18T20:30&force=no-hints', view: [w, h], cpu, wait: false,
      init: { fn: ([back, feed]) => { const f0 = window.fetch; window.fetch = function (u, o) { return /\/api\/admin\?live=1/.test(String(u)) ? Promise.resolve(new Response(feed, { status: 200, headers: { 'Content-Type': 'application/json' } })) : f0.call(this, u, o); };   // (the page's own fetch: the service worker would pass an intercept by)
        if (back) { try { localStorage.setItem('nd:jaywalk', JSON.stringify({ on: true, bar: 'open', open: null, since: '2026-11-12' })); localStorage.setItem('nd:drop', JSON.stringify({ live: '2026-11-15', mode: 'on' })); } catch { /* fine */ } } const rec = window.__triRec = []; let last = ''; const tick = () => { try { const d = window.__district, sh = !!(d && d.harbor() && d.harbor().shown), t = d && d.tri ? d.tri() : null;
        if (t) { const k = `${sh ? '' : '(pre) '}${t.board || '—'}${t.turn ? ` turning ${t.turn.id}` : ''}${t.warmed ? ' w' : ''}${t.ready ? ' r' : ''}`; if (k !== last) { last = k; rec.push({ k, at: Math.round(performance.now()), board: t.board, turn: t.turn && t.turn.id, sh }); } } } catch { /* the city not up yet */ } requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, arg: [back, feed] } }), p = Q.page;
    await harborUp(p);
    await sleep(10000);
    const r = await ev(p, '({ rec: window.__triRec.slice(), t: window.__district.tri() })'), js = await ev(p, "import('/js/core/harbor-trivision.js').then(m => JSON.stringify({ s: m.jaywalkState(), d: m.dropState(), ls: localStorage.getItem('nd:jaywalk') }))");
    const shown = r.rec.filter(x => x.sh), until = shown.findIndex(x => x.turn && !/^o/.test(x.turn)), seen = (until < 0 ? shown : shown.slice(0, until));
    // (THE FREEFALL CITY PASS — the housekeeping pass's carried cloud red "holdem-open → jaywalk-open" at 402 × 4× CPU: by design a phone whose
    //  pick's picture has not decoded by the reveal waits on the BASE face (HOLD'EM) ≤ 4 s and then CUTS to the pick (scene.js triFrame) — that
    //  prefix is allowed; what this guards (the owner's H2 flicker) is any OTHER face once the pick is up: pick → base → pick, or an opening turn)
    const want = f => (back ? f === 'jaywalk-open' : /^jaywalk/.test(f || '')), first = seen.findIndex(x => want(x.board));
    const pre = first < 0 ? seen : seen.slice(0, first), post = first < 0 ? [] : seen.slice(first);
    const faces = [...new Set(seen.map(x => x.board))], opening = seen.some(x => x.turn && /^o/.test(x.turn));
    const baseOnly = pre.every(x => /^holdem/.test(x.board || '') || !x.board), afterOne = new Set(post.map(x => x.board)).size === 1;
    ok(first >= 0 && baseOnly && afterOne && !opening, `THE ROOF BOARD at ${w}${cpu > 1 ? ` (${cpu}× CPU)` : ''}${back ? ', a returning phone' : ', a first visit'}: ONE face from the reveal for 10 s — ${faces.join(' → ') || 'nothing'}${opening ? ' (an OPENING TURN after the reveal)' : ''} (the pick ${r.t.opened}; ${js}; ${r.rec.map(x => `${x.at} ${x.k}`).join(' · ')})`);
    await Q.ctx.close();
  }
  log('trionce', 'done');
});
G('trivision-rebuild', async () => {
  for (const open_ of [false, true]) {
    const qs = `wx=clear&force=trivision,billboard-jaywalk,billboard-drop,no-hints${open_ ? '&jaywalk=open' : ''}`;
    const Q = await open({ slot: open_ ? 'trbo' : 'trb', qs, view: [390, 844], intercept: u => (/assets\/city\/jaywalk\/(billboard|open-now)\.webp/.test(u) ? { delay: 5000 } : null) }), p = Q.page;
    await harborUp(p);
    const warmKey = open_ ? 'openWarmed' : 'warmed';
    await waitFor(p, `(() => { const t = window.__district.tri(); return t && t.${warmKey}; })()`, 'the poster warming', 20000).catch(() => {});
    // (the picture's request must be IN FLIGHT when the city goes — the old loader's silent return needs a load already started)
    const pic = open_ ? /open-now\.webp/ : /jaywalk\/billboard\.webp/;
    for (let i = 0; i < 100 && !Q.files.some(u => pic.test(u)); i++) await sleep(100);
    const w0 = await ev(p, 'window.__district.tri()'), inFlight = Q.files.some(u => pic.test(u));
    await ev(p, "import('/js/store.js').then(m => m.setState({ view: 'profile' }))");
    await waitFor(p, "!document.querySelector('.nd-scene')", 'the city destroyed', 15000);
    await sleep(600);
    await ev(p, "import('/js/store.js').then(m => m.setState({ view: 'title' }))");
    await waitFor(p, "!!(window.__district && window.__district.harbor && window.__district.harbor() && document.querySelector('.nd-scene'))", 'the city rebuilt', 25000);
    await harborUp(p);
    const want = open_ ? 'jaywalk-open' : 'jaywalk';
    // the forced clock turns every 8 s: three faces = one 24 s cycle once the picture lands (5 s after the first ask)
    await waitFor(p, `(() => { const t = window.__district.tri(); const seen = new Set([t.board, ...t.turns.map(x => x.to)]); return seen.has('${want}') && seen.has('highrise') && [...seen].some(f => /^holdem/.test(f)); })()`, 'all three faces', 45000).catch(() => {});
    const t = await ev(p, 'window.__district.tri()');
    const seen = [...new Set([t.board, ...t.turns.map(x => x.to)])];
    ok(w0[warmKey] && inFlight && (t.faces || []).length === 3 && seen.includes(want) && seen.includes('highrise') && seen.some(f => /^holdem/.test(f)),   // (CITY PART 1: HIGH RISE replaced THE DROP's face)
      `THE ROOF BOARD after a rebuild mid-load${open_ ? ' (OPEN DAY — the OPEN NOW poster)' : ''}: the faces ${(t.faces || []).join(' · ') || 'none'} — turned to ${t.turns.map(x => x.to).join(' → ') || 'nothing'} (the first scene's picture request in flight at the teardown: ${inFlight})`);
    await Q.ctx.close();
  }
  log('trivision-rebuild', 'done');
});

// ---- LOBBY 2.0 A — THE ROOM IN THE CITY (room-city.js · people.js · core/harbor-room.js + room-lines.js): HOST → the live city stays, the
// players in TWO LINES OF 4 at the door (the host first), walking in from the edge, the same on two phones, a refresh = in place, lost
// signal = down + up again, a leave waves off, a kick walks off, the lines are SOLIDS, the room dock (INVITE for all, PLAY host-only +
// WAITING, the host change, GUESTS' yellow dot, CHAT's dot, YOU → the card)
const DBH = 'http://127.0.0.1:9000', NS = 'demo-arcade-default-rtdb';
const dbPatch = (path, v) => fetch(`${DBH}/${path}.json?ns=${NS}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify(v) });
const dbDel = path => fetch(`${DBH}/${path}.json?ns=${NS}`, { method: 'DELETE', headers: { Authorization: 'Bearer owner' } });
const ROOMQ = `${NIGHT}&wx=clear`;
const roomOf = p => ev(p, 'window.__district.room ? window.__district.room() : null');
const posOf = (R, uid) => (R && R.people ? R.people.find(x => x.uid === uid) : null);

G('room', async () => {
  const A = await open({ slot: 'rma', qs: ROOMQ, view: [402, 874] }), p = A.page;
  await harborUp(p); await sleep(1200);
  await ev(p, "document.querySelector('.nd-hostbtn').click()");
  await waitFor(p, 'window.__arcade.state.code && window.__district.room()', 'hosted + the room on the city', 20000);
  const code = await ev(p, 'window.__arcade.state.code'), me = await ev(p, 'window.__arcade.state.uid');
  const scr = await ev(p, "({ title: !!document.querySelector('.title-screen.is-room'), lobby: !!document.querySelector('.lobby-screen'), rdk: !!document.querySelector('.rdk-dock'), flank: getComputedStyle(document.querySelector('.nd-flank:not(.rdk-dock)')).display })");
  ok(scr.title && !scr.lobby && scr.rdk && scr.flank === 'none', `HOST → THE ROOM IN THE CITY: the live city stays (no lobby screen), the room dock in the title dock's place (${JSON.stringify(scr)})`);
  await waitFor(p, `(() => { const r = window.__district.room(); const q = r && r.people.find(x => x.uid === '${me}'); return q && q.s && q.s.pose === 'walk'; })()`, 'the host walks in', 5000).then(() => ok(true, 'THE ARRIVAL: the host (just joined) WALKS IN from the edge'), () => ok(false, 'THE ARRIVAL: the host walks in from the edge'));
  await waitFor(p, `JSON.stringify(window.__district.harbor().speakeasy.hush()).includes('${code}')`, 'the hush word lit', 15000).catch(() => {});
  const hs = await ev(p, 'window.__district.harbor().speakeasy.hush()');
  ok(hs && JSON.stringify(hs).includes(code), `THE HUSH WORD in neon on the speakeasy (${JSON.stringify(hs).slice(0, 80)}); no room pill under the logo (${!(await ev(p, "!!document.querySelector('.nd-roompill')"))})`);
  // 6 more players (+ a real second phone below = 8): the lines fill from the door, the host first
  const now = Date.now(), names = ['MAYA', 'JAKE', 'WWWWWWWWWWWW', 'RIO', 'LILY', 'SAM'], cols = ['cyan', 'yellow', 'green', 'orange', 'violet', 'red'], av = ['diamond', 'crown', 'star', 'moon', 'heart', 'wave'];
  const players = {}, presence = {};
  names.forEach((n, i) => { const u = `rf${i}`; players[u] = { name: n, color: cols[i], avatar: av[i], joinedAt: now + 600 + i * 900, ln: i % 2 ? 'L' : 'R' }; presence[u] = { online: true, lastSeen: now, v: 2, c: { [`k${i}`]: true } }; });
  await dbPatch(`rooms/${code}/players`, players); await dbPatch(`rooms/${code}/presence`, presence);
  await waitFor(p, '(() => { const r = window.__district.room(); return r && r.people.length === 7 && r.people.every(x => x.s && x.s.pose === "wait"); })()', 'all 7 in their places', 45000).catch(() => {});
  let R = await roomOf(p);
  const slots = Object.fromEntries(R.people.map(x => [x.uid, x.slot]));
  ok(slots[me] === 'L0' && ['R0', 'L1', 'R1', 'L2', 'R2', 'L3'].every((s, i) => slots[`rf${i}`] === s), `TWO LINES OF 4: the host at L0 (by the door), then each in their own line from the door (${JSON.stringify(slots)})`);
  const L = R.people.filter(x => x.slot[0] === 'L'), Rr = R.people.filter(x => x.slot[0] === 'R');
  ok(R.people.every(x => x.s.pose === 'wait') && Math.max(...L.map(x => x.s.x)) < Math.min(...Rr.map(x => x.s.x)), `everyone STANDS in place: the left line left of the door, the right line right of it (${R.people.map(x => `${x.slot} ${x.s.x}`).join(' · ')})`);
  // THE SOLIDS: the city's own people never inside the two lines (sampled over 8 s)
  let hits = [];
  for (let i = 0; i < 16; i++) { const r = await roomOf(p); hits = hits.concat(r.solidHits || []); await sleep(500); }
  ok(!hits.length, `THE LINES ARE SOLIDS: none of the city's people inside them over 8 s (${hits.length ? JSON.stringify(hits.slice(0, 3)) : 'none'})`);
  // the tags: an emblem over each head, the GUESTS dot (new guests since the host last looked)
  const tg = await ev(p, "({ n: document.querySelectorAll('.rc-tag').length, vis: [...document.querySelectorAll('.rc-tag')].filter(t => +t.style.opacity > 0.5).length, dot: !document.querySelector('.rdk-guests .rdk-dot').hidden, play: !document.querySelector('.rdk-play').classList.contains('rdk-wait') })");
  ok(tg.n === 7 && tg.vis === 7 && tg.dot && tg.play, `THE TAGS: 7 emblems over 7 heads; GUESTS' YELLOW DOT for the new guests; the host sees PLAY (${JSON.stringify(tg)})`);
  if (SHOTS) await p.screenshot({ path: `${OUT}lobby-room-7.png` });
  // a real second phone joins (by the invite link): it walks in from its line's edge; the same lines on both phones
  const B = await open({ slot: 'rmb', qs: `${ROOMQ}&room=${code}`, view: [402, 874] }), q = B.page;
  await harborUp(q); await sleep(1200);
  await ev(q, "(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); })()");
  await waitFor(q, 'window.__district.room() && window.__district.room().people.length === 8', 'B in the room', 20000);
  const meB = await ev(q, 'window.__arcade.state.uid');
  await waitFor(p, `(() => { const r = window.__district.room(); const x = r && r.people.find(y => y.uid === '${meB}'); return x && x.s && x.s.pose === 'walk'; })()`, 'B walks in on A', 8000).then(() => ok(true, 'THE ARRIVAL on another phone: the new guest WALKS IN from the edge (their strip goes in the list at once)'), () => ok(false, 'THE ARRIVAL on another phone: the new guest walks in'));
  await waitFor(p, '(() => { const r = window.__district.room(); return r.people.length === 8 && r.people.every(x => x.s && x.s.pose === "wait"); })()', 'all 8 settled', 45000).catch(() => {});
  await waitFor(q, '(() => { const r = window.__district.room(); return r.people.length === 8 && r.people.every(x => x.s && x.s.pose === "wait"); })()', 'all 8 settled on B', 45000).catch(() => {});
  const sA = Object.fromEntries((await roomOf(p)).people.map(x => [x.uid, `${x.slot}`])), sB = Object.fromEntries((await roomOf(q)).people.map(x => [x.uid, `${x.slot}`]));
  ok(JSON.stringify(sA, Object.keys(sA).sort()) === JSON.stringify(sB, Object.keys(sA).sort()) && sA[meB] === 'R3', `THE SAME LINES ON TWO PHONES (${Object.values(sA).join(' ')}; the new guest at ${sA[meB]})`);
  const dB = await ev(q, "({ wait: document.querySelector('.rdk-play').classList.contains('rdk-wait'), txt: document.querySelector('.rdk-play .nd-host-label').textContent, inv: document.querySelector('.rdk-leave .nd-host-label').textContent })");
  // (THE SPEED PASS — the owner: the ring reads WAITING / FOR HOST, never the host's name)
  ok(dB.wait && /WAITING\s*FOR HOST/.test(dB.txt) && !/AVA/.test(dB.txt) && dB.inv === 'LEAVE', `A GUEST's dock: LEAVE (CITY H1 — the left ring) + the PLAY ring greyed — ${dB.txt} (${JSON.stringify(dB)})`);
  if (SHOTS) { await p.screenshot({ path: `${OUT}lobby-room-8-host.png` }); await q.screenshot({ path: `${OUT}lobby-room-8-guest.png` }); }
  // a refresh: everyone already in place (no walk-in replay)
  await sleep(12500 - 0);   // (B's own join is older than FRESH_MS by now)
  await q.reload(); await harborUp(q);
  await waitFor(q, 'window.__district.room() && window.__district.room().people.length === 8', 'B back in the room', 20000);
  const rb = await roomOf(q);
  ok(rb.people.every(x => x.s && x.s.pose === 'wait'), `A REFRESH = everyone straight back in place, no walk-in replay (${rb.people.map(x => x.s && x.s.pose).join(' ')})`);
  // LOST SIGNAL: down where they stand (dimmed), up again on reconnect
  await dbDel(`rooms/${code}/presence/rf3/c`); await dbPatch(`rooms/${code}/presence/rf3`, { online: false });
  const down = await waitFor(p, "document.querySelector('.rc-tag[data-uid=\"rf3\"]').classList.contains('is-down')", 'rf3 down', 8000).then(() => true, () => false);
  await dbPatch(`rooms/${code}/presence/rf3`, { online: true, c: { k9: true } });
  const up = await waitFor(p, "!document.querySelector('.rc-tag[data-uid=\"rf3\"]').classList.contains('is-down')", 'rf3 up', 8000).then(() => true, () => false);
  ok(down && up, `LOST SIGNAL: RIO LIES DOWN where they stood (the emblem dimmed) — then STANDS RIGHT BACK UP on reconnect (${down}/${up})`);
  // LEAVING: a wave, then a walk off to the nearest edge; the ones behind in that line step up
  await dbDel(`rooms/${code}/players/rf1`);
  await waitFor(p, `(() => { const r = window.__district.room(); const x = r.people.find(y => y.uid === 'rf1'); return x && x.leaving && x.s && x.s.pose === 'wave'; })()`, 'rf1 waves', 6000).then(() => ok(true, 'LEAVING: they WAVE, then walk off'), () => ok(false, 'LEAVING: a wave first'));
  await waitFor(p, `(() => { const r = window.__district.room(); const x = r.people.find(y => y.uid === 'rf1'); return x && x.s && x.s.pose === 'walk'; })()`, 'rf1 walks off', 6000).catch(() => {});
  const stepped = await waitFor(p, `(() => { const r = window.__district.room(); const x = r.people.find(y => y.uid === 'rf3'); return x && x.slot === 'L1'; })()`, 'L2 → L1', 6000).then(() => true, () => false);
  const gone = await waitFor(p, `!window.__district.room().people.some(y => y.uid === 'rf1') && !document.querySelector('.rc-tag[data-uid="rf1"]')`, 'rf1 gone', 40000).then(() => true, () => false);
  ok(stepped && gone, `…the one behind in THEIR line steps up (L2 → L1: ${stepped}); the leaver walks off the edge + their tag goes (${gone})`);
  // A KICK: no wave — straight off
  await dbPatch(`rooms/${code}/kicked`, { rf4: true }); await dbDel(`rooms/${code}/players/rf4`);
  const kick = await waitFor(p, `(() => { const r = window.__district.room(); const x = r.people.find(y => y.uid === 'rf4'); return x && x.leaving && x.s && x.s.pose === 'walk'; })()`, 'rf4 walks off', 6000).then(() => true, () => false);
  ok(kick, 'A KICK: they walk straight off (no wave)');
  // THE HOST CHANGE: PLAY changes hands
  await dbPatch(`rooms/${code}/meta`, { hostId: meB });
  const hc = await waitFor(q, "!document.querySelector('.rdk-play').classList.contains('rdk-wait')", 'B gets PLAY', 8000).then(() => true, () => false);
  const hcA = await waitFor(p, "document.querySelector('.rdk-play').classList.contains('rdk-wait')", 'A waits', 8000).then(() => true, () => false);
  ok(hc && hcA, `THE HOST CHANGE: PLAY moves to the new host, the old one now sees WAITING FOR … (${hc}/${hcA})`);
  // GUESTS: the sheet (8 → 6 strips), the dot cleared on open; CHAT: the unread dot; YOU → the card
  await ev(p, "document.querySelector('.rdk-guests').click()");
  await waitFor(p, "document.querySelectorAll('.rg-sheet .vl-strip').length >= 6", 'the guest list', 10000).catch(() => {});   // (CITY C 0d: the names at once, the strips one per frame)
  const gl = await ev(p, "({ rows: document.querySelectorAll('.rg-sheet .rg-row').length, strips: document.querySelectorAll('.rg-sheet .vl-strip').length, dot: !document.querySelector('.rdk-guests .rdk-dot').hidden, host: [...document.querySelectorAll('.rg-sheet .vl-lv')].some(l => /HOST/.test(l.textContent)) })");
  ok(gl.rows === 6 && gl.strips === 6 && !gl.dot && gl.host, `THE GUEST LIST: everyone as their SLIM CARD STRIP (${gl.strips}), the host marked; GUESTS' dot cleared on open (${!gl.dot})`);
  if (SHOTS) await p.screenshot({ path: `${OUT}lobby-guests.png` });
  await ev(p, "document.querySelector('.rg-sheet .sh-back').click()"); await sleep(400);
  await ev(q, "import('/js/chat/chat.js').then(m => m.send('hello from B'))");
  const cd = await waitFor(p, "!document.querySelector('.rdk-chat .rdk-dot').hidden", 'CHAT dot', 10000).then(() => true, () => false);
  ok(cd, 'CHAT: a message from another phone lights the unread dot');
  await ev(p, "document.querySelector('.rdk-you').click()");
  const you = await waitFor(p, "!!document.querySelector('.pf-overlay')", 'YOU → the card', 8000).then(() => true, () => false);
  ok(you, 'YOU → the profile + CUSTOMIZE (over the city)');
  // INVITE (everyone — a guest here; CITY H1: at the top of GUESTS): the phone's share sheet with the hush word + the link
  await ev(p, "(() => { window.__shared = null; navigator.share = async d => { window.__shared = d; }; document.querySelector('.rdk-guests').click(); })()");
  await waitFor(p, "!!document.querySelector('.rg-sheet .rg-invite-btn')", 'GUESTS → INVITE', 10000).catch(() => {});
  const invTop = await ev(p, "(() => { const b = document.querySelector('.rg-sheet .sh-body'); return !!b && b.firstElementChild && b.firstElementChild.classList.contains('rg-invite') && (b.querySelector('.rg-inv-w') || {}).textContent; })()");
  ok(invTop === code, `INVITE at the TOP of GUESTS with the room's word (${invTop})`);
  await ev(p, "document.querySelector('.rg-sheet .rg-invite-btn').click()");
  const sh = await waitFor(p, '!!window.__shared', 'shared', 5000).then(() => ev(p, 'window.__shared'), () => null);
  ok(sh && sh.url && sh.url.includes(`room=${code}`) && sh.text.includes(code), `INVITE: the share sheet with the hush word + the link (${sh && sh.text})`);
  // PLAY (the host — B since the host change): the playable games → one → its options → INITIATE = today's game start
  await ev(q, "document.querySelector('.rdk-play').click()");
  await waitFor(q, "document.querySelectorAll('.rc-games-sheet .rc-game').length >= 2", 'the games', 8000).catch(() => {});
  const gs = await ev(q, "({ n: document.querySelectorAll('.rc-games-sheet .rc-game').length, t: (document.querySelector('.rc-games-sheet .sh-t b') || {}).textContent })");
  if (SHOTS) await q.screenshot({ path: `${OUT}lobby-games.png` });
  await ev(q, "document.querySelector('.rc-games-sheet .rc-game[data-game=\"overclock\"]').click()");
  await waitFor(q, "!!document.querySelector('.sh.options')", 'the options', 8000).catch(() => {});
  await ev(q, "document.querySelector('.sh.options .btn-primary').click()");
  const started = await waitFor(q, "window.__arcade.state.meta && window.__arcade.state.meta.status === 'playing'", 'the game starts', 15000).then(() => true, () => false);
  ok(gs.n === 6 && gs.t === 'PICK A GAME' && started,   // (THE GO-LIVE PASS: + JAYWALK · HIGH RISE's GO-LIVE: + HIGH RISE · FREEFALL's GO-LIVE: + FREEFALL — six playable)
  `PLAY (the host): PICK A GAME (${gs.n} playable) → its options → INITIATE — today's start path (${started ? 'playing' : 'not started'})`);
  await A.ctx.close(); await B.ctx.close();
  log('room', 'done');
});

// ---- LOBBY 2.0 A — THE FULL-ROOM SPEED CHECK (8 players walking in + the guest list's 8 strips) at 4× CPU on the real compositor: the
// room's OWN cost (the city's frame work with the room vs without it — this machine's throttled city alone is the floor, not 60 fps
// here) + 60 fps at 1× (the phone's own speed is the bench's job: &bench=1)
G('roomperf', async () => {
  // (FRIENDS C — GREEN MEANS GREEN, (d) + (e): on a machine with NO DISPLAY the real compositor falls back to SOFTWARE — the frame rate is
  //  then the software path's (skipped with its reason: the display rule, SHELL 2.0 B2), and the city's own frame work grew too (a 2D canvas
  //  rasterised on the CPU: the known 39 → 48 ms red). So with no display the page is the GPU-pinned headless one (kit/puppeteer.mjs — the
  //  Radeon by its LUID): THE ROOM's OWN COST is measured there, as on a phone's GPU — a real number, never a skip)
  const disp = ON_CI ? { attached: false, reason: 'CI' } : await displayAttached();
  const A = await open({ slot: 'rpf', qs: ROOMQ, view: [402, 874], dpr: 3, real: !!disp.attached }), p = A.page;
  await harborUp(p); await sleep(1500);
  await ev(p, "document.querySelector('.nd-hostbtn').click()");
  await waitFor(p, 'window.__arcade.state.code', 'hosted', 20000);
  const code = await ev(p, 'window.__arcade.state.code'); await sleep(4000);
  const cdp = await p.target().createCDPSession();
  const cost = () => ev(p, '(() => { const c = window.__district.cost().slice().sort((a, b) => a - b); return +c[Math.floor(c.length / 2)].toFixed(2); })()');
  const fps = ms => ev(p, `new Promise(res => { const g = []; let l = 0; const t0 = performance.now(); const f = t => { if (l) g.push(t - l); l = t; if (t - t0 < ${ms}) requestAnimationFrame(f); else res({ fps: +(1000 / (g.reduce((a, b) => a + b, 0) / g.length)).toFixed(1), slow: g.filter(x => x > 25).length }); }; requestAnimationFrame(f); })`);
  const f1 = await fps(3000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await sleep(5500); const c0 = await cost();
  const now = Date.now(), players = {}, presence = {};
  for (let i = 0; i < 7; i++) { players[`pp${i}`] = { name: `P${i}`, color: ['cyan', 'yellow', 'green', 'orange', 'violet', 'red', 'blue'][i], avatar: 'star', joinedAt: now + 200 * i, ln: i % 2 ? 'L' : 'R' }; presence[`pp${i}`] = { online: true, lastSeen: now, v: 2, c: { k: true } }; }
  await dbPatch(`rooms/${code}/players`, players); await dbPatch(`rooms/${code}/presence`, presence);
  await sleep(3500); const cW = await cost();
  await waitFor(p, '(() => { const r = window.__district.room(); return r && r.people.length === 8 && r.people.every(x => x.s && x.s.pose === "wait"); })()', 'settled', 60000).catch(() => {});
  await sleep(5500); const cS = await cost();
  await ev(p, "document.querySelector('.rdk-guests').click()"); await sleep(5500); const cG = await cost();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await sleep(1500);
  const f2 = await fps(3000);
  // (THE SPEED PASS — G4: the 2-core runner has no GPU path — these warned in every cloud run (31–35 fps "alone"): skipped there with the
  //  reason; the mini PC + the owner's iPhone answer them. The party night's room: speed.mjs#partyroom — FR6 A7)
  const w1 = `THE FULL ROOM at 1×: ${f1.fps} fps (${f1.slow} slow) alone → ${f2.fps} fps (${f2.slow} slow) with 8 in the lines + the guest list open`, w2 = `THE ROOM's OWN COST at 4× CPU (the city's frame work): ${c0} ms alone → ${cW} ms while 7 walk in → ${cS} standing → ${cG} with the guest list's 8 strips`;
  if (ON_CI) { skipCI(w1, 'no GPU path on the 2-core runner'); skipCI(w2, 'no GPU path on the 2-core runner'); }
  else { if (disp.attached) okT(f1.fps >= 55 && f2.fps >= 55, w1); else skipNoDisplay(w1, disp.reason); okT(cW - c0 < 9 && cS - c0 < 3 && cG - c0 < 4, `${w2}${disp.attached ? '' : ' (the GPU-pinned headless page — no display)'}`); }
  await A.ctx.close(); await closeRealSafe();
});
const closeRealSafe = async () => { try { const k = await import('./kit.mjs'); await k.closeReal(); } catch { /* fine */ } };

// ---- LOBBY 2.0 A — TYPING BUBBLES + THE CHAT FIX: a guest typing → a "…" bubble over their figure on the other phone (no words), gone when
// they send; the chat sheet keeps ONE size + slides up as one piece onto the keyboard (a fake 336-pt iOS keyboard); QUICK-REPLY CHIPS send
G('roomchat', async () => {
  const A = await open({ slot: 'rca', qs: ROOMQ, view: [390, 844] }), p = A.page;
  await harborUp(p); await sleep(1000);
  await ev(p, "document.querySelector('.nd-hostbtn').click()");
  await waitFor(p, 'window.__arcade.state.code && window.__district.room()', 'hosted', 20000);
  const code = await ev(p, 'window.__arcade.state.code');
  const B = await open({ slot: 'rcb', qs: `${ROOMQ}&room=${code}`, view: [390, 844] }), q = B.page;
  await harborUp(q); await sleep(1000);
  await ev(q, "(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); })()");
  await waitFor(q, 'window.__district.room() && window.__district.room().people.length === 2', 'B in', 20000);
  const meB = await ev(q, 'window.__arcade.state.uid');
  await waitFor(p, `(() => { const r = window.__district.room(); const x = r && r.people.find(y => y.uid === '${meB}'); return x && x.s && x.s.pose === 'wait'; })()`, 'B settled', 40000).catch(() => {});
  // B opens the chat from the dock + types
  await ev(q, "document.querySelector('.rdk-chat').click()");
  await waitFor(q, "!!document.querySelector('.chat-sheet .chat-input')", 'the chat sheet', 8000);
  const h0 = await ev(q, "document.querySelector('.chat-sheet .sh-panel').getBoundingClientRect().height");
  await q.focus('.chat-sheet .chat-input'); await q.keyboard.type('on my way', { delay: 40 });
  const bub = await waitFor(p, `document.querySelector('.rc-tag[data-uid="${meB}"]').classList.contains('is-typing')`, 'the bubble', 8000).then(() => true, () => false);
  const bt = await ev(p, `(() => { const t = document.querySelector('.rc-tag[data-uid="${meB}"] .rc-bubble'), r = t.getBoundingClientRect(), dock = document.querySelector('.rdk-dock').getBoundingClientRect(); return { text: t.textContent, w: r.width, h: r.height, bottom: r.bottom, dockTop: dock.top, op: getComputedStyle(t).opacity }; })()`);
  ok(bub && bt.text === '' && bt.w >= 24 && bt.bottom < bt.dockTop - 20, `TYPING BUBBLES: B typing → a "…" bubble over B's figure on A's phone (no words; ${Math.round(bt.w)}×${Math.round(bt.h)} pt, clear of the dock by ${Math.round(bt.dockTop - bt.bottom)} pt)`);
  if (SHOTS) await p.screenshot({ path: `${OUT}lobby-typing-390.png` });
  // THE CHAT FIX: a 336-pt keyboard → the sheet keeps its height, slides up as one piece, the field above the keyboard
  await ev(q, '(() => { window.__fakeVV = { height: 844 - 336, offsetTop: 0 }; window.__chatLayout(); })()'); await sleep(400);
  const kb = await ev(q, "(() => { const s = document.querySelector('.chat-sheet .sh-panel').getBoundingClientRect(), f = document.querySelector('.chat-form').getBoundingClientRect(), c = document.querySelector('.chat-chips').getBoundingClientRect(); return { h: s.height, top: s.top, form: f.bottom, chips: c.bottom <= f.top + 1 && c.height > 30 }; })()");
  ok(Math.abs(kb.h - h0) < 1 && kb.form <= 844 - 336 + 1 && kb.top >= 0 && kb.chips, `THE CHAT KEYBOARD: ONE size (${Math.round(h0)} → ${Math.round(kb.h)} pt) slid up as one piece — the field above the keyboard (bottom ${Math.round(kb.form)} ≤ 508), the top on screen (${Math.round(kb.top)}), the quick replies just above the field`);
  if (SHOTS) await q.screenshot({ path: `${OUT}lobby-chat-kb-390.png` });
  // CITY G — THE CHAT CURSOR: settled (no new keyboard size for 320 ms) → NO transform left on the text box's ancestors (the same lift by
  // `bottom`), the box in the same place, still focused (the keyboard stays up)
  await sleep(500);
  const cur = await ev(q, "(() => { const i = document.querySelector('.chat-sheet .chat-input'); const tr = []; for (let e = i; e && e !== document.body; e = e.parentElement) { const t = getComputedStyle(e).transform; if (t && t !== 'none') tr.push(e.className); } const f = document.querySelector('.chat-form').getBoundingClientRect(); return { tr, form: f.bottom, focus: document.activeElement === i, settled: document.querySelector('.chat-sheet .sh-panel').classList.contains('is-settled') }; })()");
  ok(cur.settled && !cur.tr.length && Math.abs(cur.form - kb.form) < 1.5 && cur.focus, `THE CHAT CURSOR: settled — no transform on the box's ancestors (${cur.tr.join(', ') || 'none'}), the field where it was (${Math.round(kb.form)} → ${Math.round(cur.form)}), still focused (${cur.focus})`);
  await ev(q, '(() => { delete window.__fakeVV; window.__chatLayout(); })()');
  // send → the bubble goes; a chip sends its words
  await q.keyboard.press('Enter');
  const gone = await waitFor(p, `!document.querySelector('.rc-tag[data-uid="${meB}"]').classList.contains('is-typing')`, 'bubble gone', 10000).then(() => true, () => false);
  await sleep(1300);   // (the room's one-message-a-second rule)
  await ev(q, "[...document.querySelectorAll('.chat-chip')].find(b => b.textContent === 'GG').click()");
  const gg = await waitFor(q, "import('/js/chat/chat.js').then(m => m.chat.msgs.some(x => x.t === 'GG'))", 'GG sent', 8000).then(() => true, () => false);
  const chips = await ev(q, "[...document.querySelectorAll('.chat-chip')].map(b => b.textContent).join(' ')");
  ok(gone && gg && chips === 'GG NO WAY REMATCH? 🔥 😂 👏', `SENT → the bubble goes (${gone}); QUICK-REPLY CHIPS (${chips}) — GG sent (${gg})`);
  await A.ctx.close(); await B.ctx.close();
});

// ---- LOBBY 2.0 A — THE SAVE-YOUR-KEY POP-UP (the owner's ADD-ON — profile/keypop.js): a returning player whose key isn't saved → shown ONCE;
// saved → never; LATER → no pop again + the YOU dot until saved; COPY marks it saved; a NEW player → right after their first counted match
const KP = (slot, notesV) => ({ fn: (s, n) => { try { localStorage.setItem(`na:${s}:pkey`, JSON.stringify('NEON-7K2Q-PX4M-9WDA')); localStorage.setItem(`na:${s}:pnotes`, JSON.stringify(n)); } catch { /* fine */ } }, arg: undefined, slot, notesV });
async function kpOpen(slot, notesV, view = [402, 874]) {
  const Q = await open({ slot, qs: ROOMQ, view, init: { fn: new Function('a', `try { if (!localStorage.getItem('kp:seeded')) { localStorage.setItem('na:${slot}:pkey', JSON.stringify('NEON-7K2Q-PX4M-9WDA')); localStorage.setItem('na:${slot}:pnotes', a); localStorage.setItem('kp:seeded', '1'); } } catch (e) {}`), arg: JSON.stringify(notesV) } });
  await harborUp(Q.page);
  return Q;
}
G('keypop', async () => {
  void KP;
  // a RETURNING player (2 counted matches), not saved: the pop-up once, a moment after the reveal — their card + the line + COPY · SHARE · LATER
  { const Q = await kpOpen('kp1', { games: 2 }), p = Q.page;
    const shown = await waitFor(p, "!!document.querySelector('.kp-sheet:not(.is-out)')", 'the pop-up', 9000).then(() => true, () => false);
    const k = await ev(p, "(() => { const s = document.querySelector('.kp-sheet'); return s ? { line: (s.querySelector('.kp-line') || {}).textContent, card: !!s.querySelector('.pg-card'), acts: [...s.querySelectorAll('[data-act]')].map(b => b.dataset.act), later: !!s.querySelector('.kp-later') } : null; })()");
    ok(shown && k && /Save your key so you never lose your card/.test(k.line) && k.card && k.acts.includes('copy') && k.later, `THE SAVE-YOUR-KEY POP-UP: a returning player (key not saved) meets it on the city — their card, "${k && k.line}", ${k && k.acts.join(' · ')} · LATER`);
    if (SHOTS) for (const [w, hh] of [[390, 844], [402, 874], [430, 932]]) { await p.setViewport({ width: w, height: hh, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await sleep(500); await p.screenshot({ path: `${OUT}lobby-keypop-${w}.png` }); }
    await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ev(p, "document.querySelector('.kp-sheet .kp-later').click()"); await sleep(600);
    const dot = await ev(p, "(() => { const d = document.querySelector('.nd-tab-you .kp-dot'); return !!d && !d.hidden; })()");
    await p.reload(); await harborUp(p); await sleep(4500);
    const again = await ev(p, "!!document.querySelector('.kp-sheet:not(.is-out)')"), dot2 = await ev(p, "(() => { const d = document.querySelector('.nd-tab-you .kp-dot'); return !!d && !d.hidden; })()");
    ok(dot && !again && dot2, `LATER: no pop-up again (after a reload: ${!again}) — a small dot on YOU until it's saved (${dot}/${dot2})`);
    await Q.ctx.close(); }
  // COPY marks it saved: the pop-up closes, no dot
  { const Q = await kpOpen('kp2', { games: 1 }), p = Q.page;
    await p.browserContext().overridePermissions(new URL(p.url()).origin, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']).catch(() => {});
    await waitFor(p, "!!document.querySelector('.kp-sheet:not(.is-out)')", 'the pop-up', 9000).catch(() => {});
    await ev(p, "document.querySelector('.kp-sheet [data-act=\"copy\"]').click()"); await sleep(800);
    const st = await ev(p, "({ saved: JSON.parse(localStorage.getItem('na:kp2:pnotes') || '{}').saved, open: !!document.querySelector('.kp-sheet:not(.is-out)'), dot: (() => { const d = document.querySelector('.nd-tab-you .kp-dot'); return !!d && !d.hidden; })() })");
    ok(st.saved === true && !st.open && !st.dot, `COPY marks the key SAVED: the pop-up closes, no dot (${JSON.stringify(st)})`);
    await Q.ctx.close(); }
  // SAVED already → never
  { const Q = await kpOpen('kp3', { games: 4, saved: true }), p = Q.page;
    await sleep(5000);
    const st = await ev(p, "({ open: !!document.querySelector('.kp-sheet'), dot: (() => { const d = document.querySelector('.nd-tab-you .kp-dot'); return !!d && !d.hidden; })() })");
    ok(!st.open && !st.dot, `SAVED: never the pop-up, no dot (${JSON.stringify(st)})`);
    await Q.ctx.close(); }
  // a NEW player (no counted match yet): nothing on the city; right after their FIRST counted match (back from the game) → the pop-up
  { const Q = await kpOpen('kp4', { games: 0 }), p = Q.page;
    await sleep(4500);
    const before = await ev(p, "!!document.querySelector('.kp-sheet')");
    await ev(p, "document.querySelector('.nd-hostbtn').click()");
    await waitFor(p, 'window.__arcade.state.code && window.__district.room()', 'hosted', 20000);
    const code = await ev(p, 'window.__arcade.state.code');
    await dbPatch(`rooms/${code}/meta`, { status: 'playing' }); await sleep(800);
    await ev(p, "import('/js/profile/me.js').then(m => m.countMatch())");   // (the podium counts the match — profile/queue.js)
    await dbPatch(`rooms/${code}/meta`, { status: 'lobby' });
    const after = await waitFor(p, "!!document.querySelector('.kp-sheet:not(.is-out)')", 'the pop-up after the match', 9000).then(() => true, () => false);
    ok(!before && after, `A NEW PLAYER: nothing before a counted match (${!before}); right after the FIRST one, back in the room → the pop-up (${after})`);
    if (SHOTS) await p.screenshot({ path: `${OUT}lobby-keypop-room.png` });
    await Q.ctx.close(); }
  // CITY G — never over a RUNNING DAILY (the Nov 16 5:55 pm entry: .dy-run joins KEYPOP_COVERED) + never over what began DURING its lazy imports
  // (the e2e-rematch find: a game started in that gap got the sheet over its end screen): the pop-up waits, then shows once it's clear
  { const Q = await kpOpen('kp5', { games: 2 }), p = Q.page;
    await ev(p, "document.querySelectorAll('.kp-sheet').forEach(e => e.remove())");
    const run = await ev(p, "(async () => { const d = document.createElement('section'); d.className = 'screen dy-overlay dy-run kp-test'; document.body.append(d); const m = await import('/js/profile/keypop.js'); return { sel: m.KEYPOP_COVERED.includes('.dy-run'), asked: m.maybeKeyPop({ why: 'test' }) }; })()");
    await sleep(1200);
    const overRun = await ev(p, "!!document.querySelector('.kp-sheet:not(.is-out)')");
    await ev(p, "document.querySelector('.kp-test').remove()");
    const afterRun = await waitFor(p, "!!document.querySelector('.kp-sheet:not(.is-out)')", 'the pop-up once the run is gone', 9000).then(() => true, () => false);
    ok(run.sel && run.asked === false && !overRun && afterRun, `SAVE YOUR KEY never over a RUNNING DAILY (.dy-run): held while the run is up (${!overRun}), shown once it's gone (${afterRun})`);
    await Q.ctx.close(); }
  { const Q = await kpOpen('kp6', { games: 2 }), p = Q.page;
    await ev(p, "document.querySelectorAll('.kp-sheet').forEach(e => e.remove())");
    // (its check passes, then a game's end screen arrives in the same moment — before the sheet's lazy imports land)
    const asked = await ev(p, "(async () => { const m = await import('/js/profile/keypop.js'); const r = m.maybeKeyPop({ why: 'test' }); const d = document.createElement('div'); d.className = 'final kp-test'; document.body.append(d); return r; })()");
    await sleep(1500);
    const over = await ev(p, "!!document.querySelector('.kp-sheet:not(.is-out)')");
    await ev(p, "document.querySelector('.kp-test').remove()");
    const later = await waitFor(p, "!!document.querySelector('.kp-sheet:not(.is-out)')", 'the pop-up once clear', 9000).then(() => true, () => false);
    ok(asked === true && !over && later, `SAVE YOUR KEY re-checks after its lazy imports: a game's end screen that arrived in the gap holds it (${!over}), shown once clear (${later})`);
    await Q.ctx.close(); }
});

// ================================================================ HOLD'EM IN THE CITY — B2: THE CORNER BUTTONS' 44 PT (HE9's Fable review)
// ☰ + the music button (+ THE BOARD's ‹, the daily's ‹) on the city, THE BOARD, the games and the dailies at 390 + 1440: the REAL hit area,
// probed by elementFromPoint (kit/corner-probe.mjs) — 44 × 44 or more on every one; the old 4 pt inset (measured from the padding box) read 42
G('tapfit', async () => {
  const { PROBE, CORNER_SEL } = await import('../kit/corner-probe.mjs');
  const { launch, BASE } = await import('./kit.mjs');
  const br = await launch();
  const PAGES = [['THE CITY', 'tests/integration/title-preview.html'], ['THE BOARD', 'tests/integration/board-preview.html?mode=app&g=holdem'],
    ['PRISM DROP', 'tests/integration/prism-preview.html'], ['OVERCLOCK', 'tests/integration/overclock-preview.html'], ['THE DAILY', 'tests/integration/daily-preview.html'],
    ['COAST CLEAR', 'tests/integration/coastclear-preview.html'], ['THE PASSWORD', 'tests/integration/password-preview.html']];
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const [name, url] of PAGES) {
    const ctx = await br.createBrowserContext(), p = await ctx.newPage();
    try {
      await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 900, hasTouch: w < 900 });
      await p.goto(`${BASE}/${url}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const sel = JSON.stringify(CORNER_SEL.join(','));
      await waitFor(p, `[...document.querySelectorAll(${sel})].some(e => e.getBoundingClientRect().width > 0)`, `${name}'s corner buttons`, 20000).catch(() => {});
      await sleep(600);   // (a sheet's or a screen's entry settles — the probe reads where a finger lands)
      const got = await p.evaluate(PROBE, CORNER_SEL);
      ok(got.length >= 1 && got.every(x => x.w >= 44 && x.h >= 44), `B2 — THE CORNER BUTTONS' TAP AREA ≥ 44 × 44 pt · ${name} ${w}×${h}: ${got.map(x => `${x.sel} ${x.w}×${x.h}${x.covered ? ' (covered)' : ''}`).join(' · ') || 'none found'}`);
    } finally { await ctx.close(); }
  }
  // CITY PART 1 — NOTHING UNDER A CORNER BUTTON's TAP AREA (the owner's LOST TAP, Nov 20 9:06 am: the radio's tap went to ☰ — their 44 × 44 areas
  // met edge to edge): on the title + the room's dock (act=room), with the radio button on the page (its real CSS — the owner's + the crew's
  // phones have it), every tappable's own tap area (its box grown to 44 × 44 where smaller) never shares a point with ☰'s or the music's
  // 44 × 44 area, at 390 / 375 / 1440
  for (const [w, h] of [[390, 844], [375, 667], [1440, 900]]) for (const act of ['', 'room']) {
    const ctx = await br.createBrowserContext(), p = await ctx.newPage();
    try {
      await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 900, hasTouch: w < 900 });
      await p.goto(`${BASE}/tests/integration/title-preview.html${act ? `?act=${act}` : ''}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitFor(p, "!!document.querySelector('.menu-btn') && document.querySelector('.menu-btn').getBoundingClientRect().width > 0", 'the corner buttons', 30000).catch(() => {});
      await sleep(1500);
      // (the radio's own sheet, as the radio gate loads it — screens/harbor/radio.js)
      await p.evaluate(() => new Promise(res => { if (document.querySelector('link[href$="radio.css"]')) return res(); const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/css/radio.css'; l.onload = l.onerror = () => res(); document.head.append(l); setTimeout(res, 4000); }));
      const r = await p.evaluate(() => {
        if (!document.querySelector('.rd-btn')) { const b = document.createElement('button'); b.className = 'rd-btn'; b.type = 'button'; b.setAttribute('aria-label', 'The radio'); document.body.append(b); }
        const vis = el => { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
        const area = el => { const b = el.getBoundingClientRect(), W = Math.max(44, b.width), H = Math.max(44, b.height), cx = b.left + b.width / 2, cy = b.top + b.height / 2; return { x0: cx - W / 2, y0: cy - H / 2, x1: cx + W / 2, y1: cy + H / 2 }; };
        const corners = [...document.querySelectorAll('.menu-btn, .music-btn')].filter(vis).map(el => ({ el, a: area(el), n: el.className.split(' ')[0] }));
        const taps = [...document.querySelectorAll('button, a[href], [role="button"], [data-press]')].filter(el => vis(el) && !corners.some(c => c.el === el || c.el.contains(el) || el.contains(c.el)));
        const bad = [];
        for (const t of taps) { const a = area(t); for (const c of corners) if (a.x0 <= c.a.x1 && c.a.x0 <= a.x1 && a.y0 <= c.a.y1 && c.a.y0 <= a.y1) bad.push(`${(t.className || t.tagName).toString().split(' ')[0]} ↔ ${c.n}`); }
        const rd = document.querySelector('.rd-btn'), m = document.querySelector('.menu-btn');
        return { n: taps.length, corners: corners.length, bad: [...new Set(bad)], gap: rd && m ? Math.round(area(rd).y0 - area(m).y1) : null };
      });
      ok(r.corners >= 1 && r.n >= 3 && r.gap >= 8 && r.bad.length === 0, `CITY PART 1 — NOTHING UNDER A CORNER BUTTON's 44 × 44 · the ${act ? 'room dock' : 'title'} ${w}×${h}: ${r.n} tappables, ${r.corners} corner buttons, the radio's area ${r.gap} pt below ☰'s${r.bad.length ? ` — SHARED: ${r.bad.join(' · ')}` : ''}`);
    } finally { await ctx.close(); }
  }
  // THE BOARD's TOP REDONE (the owner's iPhone at 390, Nov 12 — "the whole top is messed up"): NO ☰ on THE BOARD (THE PROFILE's rule — ‹ BACK alone in
  // the top-left corner), the title on its own row, the SEVEN tabs on ONE row (THE GO-LIVE PASS: + JAYWALK · HIGH RISE's GO-LIVE: + HIGH RISE) — the title box, the tab row + the corner buttons never overlap, at the
  // phones' widths (+ 390 × 664: Safari with its bars) and the desktop, on the app's board + the public /board
  for (const [w, h] of [[360, 780], [390, 844], [390, 664], [402, 874], [430, 932], [1440, 900]]) for (const mode of ['app', 'public']) {   // (HIGH RISE's GO-LIVE: + 360 — the seventh tab, JAYWALK's go-live checked 360 too)
    const ctx = await br.createBrowserContext(), p = await ctx.newPage();
    try {
      await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: w < 900, hasTouch: w < 900 });
      await p.goto(`${BASE}/tests/integration/board-preview.html?mode=${mode}&g=holdem`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await waitFor(p, "!!document.querySelector('.bd-tabs .bd-tab') && !!document.querySelector('.bd-name')", 'the board', 20000).catch(() => {});
      await sleep(700);
      const g = await p.evaluate(() => {
        const R = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden' ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; };
        const rg = document.createRange(), nm = document.querySelector('.bd-name'); rg.selectNodeContents(nm); const tr = rg.getBoundingClientRect();
        const tabs = [...document.querySelectorAll('.bd-tabs .bd-tab')].map(R).filter(Boolean);
        return { title: { x: tr.left, y: tr.top, w: tr.width, h: tr.height }, row: R(document.querySelector('.bd-tabs')), tops: [...new Set(tabs.map(t => Math.round(t.y)))], n: tabs.length, clipped: [...document.querySelectorAll('.bd-tabs .bd-tab')].filter(el => { const r = document.createRange(); r.selectNodeContents(el.querySelector('span') || el); const t = r.getBoundingClientRect(), b = el.getBoundingClientRect(); return t.left < b.left - 0.5 || t.right > b.right + 0.5; }).map(el => el.textContent.trim()),
          corners: [['back', R(document.querySelector('.bd-back'))], ['music', R(document.querySelector('.music-btn'))], ['menu', R(document.querySelector('.menu-btn'))]].filter(c => c[1]) };
      });
      const hit = (a, b) => a && b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      const bad = [];
      if (hit(g.title, g.row)) bad.push('the title over the tabs');
      for (const [k, c] of g.corners) { if (k === 'menu') bad.push('a ☰ on THE BOARD'); if (hit(c, g.title)) bad.push(`${k} over the title`); if (hit(c, g.row)) bad.push(`${k} over the tabs`); }
      if (g.tops.length !== 1 || g.n !== 8) bad.push(`the tabs on ${g.tops.length} rows (${g.n})`);   // (FREEFALL's GO-LIVE: EIGHT — one row that scrolls, the right edge faded)
      if (g.clipped.length) bad.push(`a tab's words clipped (${g.clipped.join(', ')})`);   // (HIGH RISE's GO-LIVE: seven tabs — every label whole)
      if (SHOTS && mode === 'app') await p.screenshot({ path: `${OUT}board-top-${w}x${h}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 360) } });
      const back = g.corners.find(c => c[0] === 'back');
      if (!back || back[1].x > 20 || back[1].y > 24) bad.push(`‹ BACK not in the corner (${back ? `${Math.round(back[1].x)}, ${Math.round(back[1].y)}` : 'none'})`);
      ok(!bad.length, `THE BOARD's TOP · ${mode} ${w}×${h}: the title (${Math.round(g.title.y)}–${Math.round(g.title.y + g.title.h)}) above the tabs (${g.row ? Math.round(g.row.y) : '—'}, one row of ${g.n}), ‹ BACK in the corner, no ☰${bad.length ? ` — ${bad.join(' · ')}` : ''}`);
    } finally { await ctx.close(); }
  }
});
