// CITY 2.0 — THE HARBOR end to end: LOBBY 2.0 A (Nov 3 — docs/harbor/passes/lobby-2a.md). `billboard`: THE ANNOUNCEMENT BILLBOARD's
// cross-fade (the owner: his message "snaps on"). More groups of this pass join here (the room in the city, the dock, the guest list…).
// ADDING A GROUP: G('name', …) in its job's file + the name in ../harbor-jobs.mjs (CI_JOBS).
import { log, sleep, ok, okT, NIGHT, open, ev, waitFor, harborUp, G, OUT, SHOTS } from './kit.mjs';

const RM = { fn: () => { const mm = window.matchMedia.bind(window); window.matchMedia = q => (/prefers-reduced-motion/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q)); }, arg: null };

G('billboard', async () => {
  // a fresh load MID-MESSAGE (a link's &force=billboard-hints keeps the hint up): the message is simply there — nothing fades
  { const Q = await open({ slot: 'bx0', qs: `${NIGHT}&wx=clear&force=billboard-hints&hint=fireworks`, view: [402, 874] }), p = Q.page;
    await harborUp(p); await sleep(4000);
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
  const dB = await ev(q, "({ wait: document.querySelector('.rdk-play').classList.contains('rdk-wait'), txt: document.querySelector('.rdk-play .nd-host-label').textContent, inv: document.querySelector('.rdk-invite .nd-host-label').textContent })");
  ok(dB.wait && /WAITING\s*FOR AVA/.test(dB.txt) && dB.inv === 'INVITE', `A GUEST's dock: INVITE (everyone) + the PLAY ring greyed — ${dB.txt} (${JSON.stringify(dB)})`);
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
  await waitFor(p, "document.querySelectorAll('.rg-sheet .rg-row').length >= 6", 'the guest list', 10000).catch(() => {});
  const gl = await ev(p, "({ rows: document.querySelectorAll('.rg-sheet .rg-row').length, strips: document.querySelectorAll('.rg-sheet .vl-strip').length, dot: !document.querySelector('.rdk-guests .rdk-dot').hidden, host: [...document.querySelectorAll('.rg-sheet .vl-lv')].some(l => /HOST/.test(l.textContent)) })");
  ok(gl.rows === 6 && gl.strips === 6 && !gl.dot && gl.host, `THE GUEST LIST: everyone as their SLIM CARD STRIP (${gl.strips}), the host marked; GUESTS' dot cleared on open (${!gl.dot})`);
  if (SHOTS) await p.screenshot({ path: `${OUT}lobby-guests.png` });
  await ev(p, "document.querySelector('.rg-sheet .pfs-back').click()"); await sleep(400);
  await ev(q, "import('/js/chat/chat.js').then(m => m.send('hello from B'))");
  const cd = await waitFor(p, "!document.querySelector('.rdk-chat .rdk-dot').hidden", 'CHAT dot', 10000).then(() => true, () => false);
  ok(cd, 'CHAT: a message from another phone lights the unread dot');
  await ev(p, "document.querySelector('.rdk-you').click()");
  const you = await waitFor(p, "!!document.querySelector('.pf-overlay')", 'YOU → the card', 8000).then(() => true, () => false);
  ok(you, 'YOU → the profile + CUSTOMIZE (over the city)');
  // INVITE (everyone — a guest here): the phone's share sheet with the hush word + the link
  await ev(p, "(() => { window.__shared = null; navigator.share = async d => { window.__shared = d; }; document.querySelector('.rdk-invite').click(); })()");
  const sh = await waitFor(p, '!!window.__shared', 'shared', 5000).then(() => ev(p, 'window.__shared'), () => null);
  ok(sh && sh.url && sh.url.includes(`room=${code}`) && sh.text.includes(code), `INVITE: the share sheet with the hush word + the link (${sh && sh.text})`);
  // PLAY (the host — B since the host change): the playable games → one → its options → INITIATE = today's game start
  await ev(q, "document.querySelector('.rdk-play').click()");
  await waitFor(q, "document.querySelectorAll('.rc-games-sheet .rc-game').length >= 2", 'the games', 8000).catch(() => {});
  const gs = await ev(q, "({ n: document.querySelectorAll('.rc-games-sheet .rc-game').length, t: (document.querySelector('.rc-games-sheet .pfs-t b') || {}).textContent })");
  if (SHOTS) await q.screenshot({ path: `${OUT}lobby-games.png` });
  await ev(q, "document.querySelector('.rc-games-sheet .rc-game[data-game=\"overclock\"]').click()");
  await waitFor(q, "!!document.querySelector('.modal .sheet.options')", 'the options', 8000).catch(() => {});
  await ev(q, "document.querySelector('.modal .sheet.options .btn-primary').click()");
  const started = await waitFor(q, "window.__arcade.state.meta && window.__arcade.state.meta.status === 'playing'", 'the game starts', 15000).then(() => true, () => false);
  ok(gs.n === 2 && gs.t === 'PICK A GAME' && started, `PLAY (the host): PICK A GAME (${gs.n} playable) → its options → INITIATE — today's start path (${started ? 'playing' : 'not started'})`);
  await A.ctx.close(); await B.ctx.close();
  log('room', 'done');
});

// ---- LOBBY 2.0 A — THE FULL-ROOM SPEED CHECK (8 players walking in + the guest list's 8 strips) at 4× CPU on the real compositor: the
// room's OWN cost (the city's frame work with the room vs without it — this machine's throttled city alone is the floor, not 60 fps
// here) + 60 fps at 1× (the phone's own speed is the bench's job: &bench=1)
G('roomperf', async () => {
  const A = await open({ slot: 'rpf', qs: ROOMQ, view: [402, 874], dpr: 3, real: true }), p = A.page;
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
  okT(f1.fps >= 55 && f2.fps >= 55, `THE FULL ROOM at 1×: ${f1.fps} fps (${f1.slow} slow) alone → ${f2.fps} fps (${f2.slow} slow) with 8 in the lines + the guest list open`);
  okT(cW - c0 < 9 && cS - c0 < 3 && cG - c0 < 4, `THE ROOM's OWN COST at 4× CPU (the city's frame work): ${c0} ms alone → ${cW} ms while 7 walk in → ${cS} standing → ${cG} with the guest list's 8 strips`);
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
  const h0 = await ev(q, "document.querySelector('.chat-sheet').getBoundingClientRect().height");
  await q.focus('.chat-sheet .chat-input'); await q.keyboard.type('on my way', { delay: 40 });
  const bub = await waitFor(p, `document.querySelector('.rc-tag[data-uid="${meB}"]').classList.contains('is-typing')`, 'the bubble', 8000).then(() => true, () => false);
  const bt = await ev(p, `(() => { const t = document.querySelector('.rc-tag[data-uid="${meB}"] .rc-bubble'), r = t.getBoundingClientRect(), dock = document.querySelector('.rdk-dock').getBoundingClientRect(); return { text: t.textContent, w: r.width, h: r.height, bottom: r.bottom, dockTop: dock.top, op: getComputedStyle(t).opacity }; })()`);
  ok(bub && bt.text === '' && bt.w >= 24 && bt.bottom < bt.dockTop - 20, `TYPING BUBBLES: B typing → a "…" bubble over B's figure on A's phone (no words; ${Math.round(bt.w)}×${Math.round(bt.h)} pt, clear of the dock by ${Math.round(bt.dockTop - bt.bottom)} pt)`);
  if (SHOTS) await p.screenshot({ path: `${OUT}lobby-typing-390.png` });
  // THE CHAT FIX: a 336-pt keyboard → the sheet keeps its height, slides up as one piece, the field above the keyboard
  await ev(q, '(() => { window.__fakeVV = { height: 844 - 336, offsetTop: 0 }; window.__chatLayout(); })()'); await sleep(400);
  const kb = await ev(q, "(() => { const s = document.querySelector('.chat-sheet').getBoundingClientRect(), f = document.querySelector('.chat-form').getBoundingClientRect(), c = document.querySelector('.chat-chips').getBoundingClientRect(); return { h: s.height, top: s.top, form: f.bottom, chips: c.bottom <= f.top + 1 && c.height > 30 }; })()");
  ok(Math.abs(kb.h - h0) < 1 && kb.form <= 844 - 336 + 1 && kb.top >= 0 && kb.chips, `THE CHAT KEYBOARD: ONE size (${Math.round(h0)} → ${Math.round(kb.h)} pt) slid up as one piece — the field above the keyboard (bottom ${Math.round(kb.form)} ≤ 508), the top on screen (${Math.round(kb.top)}), the quick replies just above the field`);
  if (SHOTS) await q.screenshot({ path: `${OUT}lobby-chat-kb-390.png` });
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
