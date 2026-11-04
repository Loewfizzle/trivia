// CITY 2.0 — THE HARBOR end to end: LOBBY 2.0 B (Nov 4 — docs/harbor/passes/lobby-2b.md). Its own cloud job (`room2`): two phones in a room.
//   roomfix  — Group 0: THE TAP AREA (the whole person, ≥ 44 pt, the nearest wins), THE LAYER STACK (CUSTOMIZE on top of the profile from the
//              title dock AND the room dock; VIEW FULL on top of CUSTOMIZE; Esc = one step), RESTORE in cyan, "1 OF 1" + THE TOP LINE NEVER CLIPS
// ADDING A GROUP: G('name', …) here + the name in ../harbor-jobs.mjs (CI_JOBS.room2).
import { log, sleep, ok, okT, NIGHT, open, ev, waitFor, harborUp, G, OUT, SHOTS, tapAt } from './kit.mjs';

const DBH = 'http://127.0.0.1:9000', NS = 'demo-arcade-default-rtdb';
export const dbPatch = (path, v) => fetch(`${DBH}/${path}.json?ns=${NS}`, { method: 'PATCH', headers: { Authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify(v) });
export const dbDel = path => fetch(`${DBH}/${path}.json?ns=${NS}`, { method: 'DELETE', headers: { Authorization: 'Bearer owner' } });
export const dbGet = path => fetch(`${DBH}/${path}.json?ns=${NS}`, { headers: { Authorization: 'Bearer owner' } }).then(r => r.json());
export const ROOMQ = `${NIGHT}&wx=clear`;

/** host a room on a fresh page → { Q, p, code, me } */
export async function hostRoom(slot, view = [402, 874], o = {}) {
  const Q = await open({ slot, qs: o.qs || ROOMQ, view, init: o.init || null, dpr: o.dpr || 0 }), p = Q.page;
  await harborUp(p); await sleep(900);
  await ev(p, "document.querySelector('.nd-hostbtn').click()");
  await waitFor(p, 'window.__arcade.state.code && window.__district.room()', 'hosted + the room on the city', 20000);
  return { Q, p, code: await ev(p, 'window.__arcade.state.code'), me: await ev(p, 'window.__arcade.state.uid') };
}
/** a second phone joins by the invite link → { Q, p, me } */
export async function joinRoom(slot, code, view = [402, 874], o = {}) {
  const Q = await open({ slot, qs: `${o.qs || ROOMQ}&room=${code}`, view }), p = Q.page;
  await harborUp(p); await sleep(900);
  await ev(p, "(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); })()");
  await waitFor(p, `window.__arcade.state.code === '${code}' && window.__district.room()`, `${slot} in the room`, 20000);
  return { Q, p, me: await ev(p, 'window.__arcade.state.uid') };
}
/** fake guests straight into the room's nodes (n of them, joined `ago` ms before now) */
export async function fakeGuests(code, n, ago = 30000, pre = 'fg') {
  const now = Date.now() - ago, players = {}, presence = {}, cols = ['cyan', 'yellow', 'green', 'orange', 'violet', 'red', 'blue'], av = ['diamond', 'crown', 'star', 'moon', 'heart', 'wave', 'bolt'];
  for (let i = 0; i < n; i++) { const u = `${pre}${i}`; players[u] = { name: `${pre.toUpperCase()}${i}`, color: cols[i % 7], avatar: av[i % 7], joinedAt: now + i * 50, ln: i % 2 ? 'L' : 'R' }; presence[u] = { online: true, lastSeen: Date.now(), v: 2, c: { [`k${i}`]: true } }; }
  await dbPatch(`rooms/${code}/players`, players); await dbPatch(`rooms/${code}/presence`, presence);
  return Object.keys(players);
}
export const settledRoom = (p, n, ms = 30000) => waitFor(p, `(() => { const r = window.__district.room(); return r && r.people && r.people.length === ${n} && r.people.every(x => x.s && x.s.pose === 'wait'); })()`, `${n} settled`, ms);
/** which layer is on top at the screen's middle (the newest pop-up must be) */
export const roomOf = p => ev(p, 'window.__district && window.__district.room ? window.__district.room() : null');
export const topAt = p => ev(p, `(() => { const e = document.elementFromPoint(innerWidth / 2, innerHeight * 0.45); if (!e) return null; const L = e.closest('.vl-full, .vl-dress, .pfs, .pf-overlay, .pg-moment, .modal'); return L ? (L.classList.contains('pf-overlay') ? 'pf-overlay' : L.classList.contains('pfs') ? 'sheet:' + [...L.classList].filter(c => c !== 'pfs' && c !== 'is-in').join('.') : L.classList[0]) : 'none:' + e.className; })()`);

G('roomfix', async () => {
  // ---- THE TAP AREA: the whole person opens their card (the figure + its ring + the emblem, ≥ 44 pt); the nearest to the finger wins
  { const { Q, p, code } = await hostRoom('rfx');
    await fakeGuests(code, 5);
    await settledRoom(p, 6, 40000).catch(() => {});
    await sleep(600);
    const d = await ev(p, 'window.__district.room().hits');
    const ids = Object.keys(d).filter(u => d[u]);
    const sizes = ids.map(u => [d[u].x1 - d[u].x0, d[u].y1 - d[u].y0]);
    ok(ids.length === 6 && sizes.every(([w, hh]) => w >= 44 && hh >= 44), `THE TAP AREA: every player's hit box ≥ 44 × 44 pt (${sizes.map(([w, hh]) => `${w}×${hh}`).join(' ')})`);
    // a tap on the LOWER BODY (near the feet — far below the emblem) opens THAT player's card
    const u = ids.find(x => x !== 'fg0' && /^fg/.test(x)) || ids[1], r = d[u];
    const name = await ev(p, `window.__arcade.state.players['${u}'].name`);
    await tapAt(p, (r.x0 + r.x1) / 2, r.y1 - 10);
    const got = await waitFor(p, "!!document.querySelector('.rc-card-sheet:not(.is-out), .vl-full')", 'a card', 5000).then(() => ev(p, "(document.querySelector('.rc-card-sheet .pfs-t b') || {}).textContent || 'full'"), () => null);
    ok(got && got.toUpperCase() === name.toUpperCase(), `THE TAP AREA: a tap on ${name}'s LOWER BODY (${Math.round(r.y1 - 10 - r.y0)} pt under the top of the emblem) opens THEIR card ("${got}")`);
    if (SHOTS) await p.screenshot({ path: `${OUT}room2-tap-card.png` });
    await ev(p, "(() => { const b = document.querySelector('.rc-card-sheet .pfs-back'); if (b) b.click(); })()"); await sleep(500);
    // overlapping neighbours: a point inside TWO hit boxes goes to the figure whose centre is nearer
    const pair = ids.flatMap(a => ids.map(b => [a, b])).find(([a, b]) => a < b && d[a].x0 < d[b].x1 && d[b].x0 < d[a].x1 && d[a].y0 < d[b].y1 && d[b].y0 < d[a].y1);
    if (pair) {
      const [a, b] = pair, A = d[a], B = d[b];
      const ox0 = Math.max(A.x0, B.x0), ox1 = Math.min(A.x1, B.x1), oy = (Math.max(A.y0, B.y0) + Math.min(A.y1, B.y1)) / 2;
      const ax = (A.x0 + A.x1) / 2, bx = (B.x0 + B.x1) / 2, x = Math.abs(ox0 - ax) < Math.abs(ox1 - ax) ? ox0 + 2 : ox1 - 2;   // (the overlap's edge nearest a)
      const want = Math.abs(x - ax) <= Math.abs(x - bx) ? a : b;
      const res = await ev(p, `window.__district.roomNearest(${x}, ${oy})`);
      ok(res === want, `THE TAP AREA — overlapping neighbours (${a} + ${b}): a tap in both boxes goes to the NEAREST figure (${res}, want ${want})`);
    } else ok(true, 'THE TAP AREA — no two hit boxes overlap at this size (the nearest rule has nothing to break)');
    // ---- THE LAYER STACK from the ROOM dock: YOU → the profile overlay → CUSTOMIZE ON TOP (the owner's brother's bug) → VIEW FULL on top
    await ev(p, "document.querySelector('.rdk-you').click()");
    await waitFor(p, "!!document.querySelector('.pf-overlay')", 'the room profile', 8000);
    const cz = await waitFor(p, "!!document.querySelector('.pf-overlay .vl-dp-go')", 'CUSTOMIZE', 15000).then(() => true, () => false);
    if (cz) {
      await ev(p, "document.querySelector('.pf-overlay .vl-dp-go').click()");
      await waitFor(p, "!!document.querySelector('.vl-dress.is-in')", 'the dress screen', 8000).catch(() => {});
      await sleep(400);
      const t1 = await topAt(p);
      ok(t1 === 'vl-dress', `THE LAYER STACK (the room dock): YOU → CUSTOMIZE YOUR CARD opens ON TOP of the room's profile (top: ${t1})`);
      if (SHOTS) await p.screenshot({ path: `${OUT}room2-customize-room.png` });
      await ev(p, "document.querySelector('.vl-dress .vl-dr-view').click()");
      await waitFor(p, "!!document.querySelector('.vl-full')", 'the full card', 8000).catch(() => {});
      await sleep(300);
      const t2 = await topAt(p);
      await p.keyboard.press('Escape'); await sleep(400);
      const t3 = await topAt(p);
      ok(t2 === 'vl-full' && t3 === 'vl-dress', `…VIEW FULL › opens on top of CUSTOMIZE (${t2}); Esc closes ONE step — back to CUSTOMIZE (${t3})`);
      await ev(p, "document.querySelector('.vl-dress .vl-dr-back').click()"); await sleep(400);
      const t4 = await topAt(p);
      ok(t4 === 'pf-overlay', `…‹ on CUSTOMIZE = one step back: the room's profile (${t4})`);
    } else ok(false, 'THE LAYER STACK (the room dock): the profile shows CUSTOMIZE YOUR CARD');
    await Q.ctx.close(); }

  // ---- THE LAYER STACK from the TITLE dock: YOU → the profile → CUSTOMIZE on top
  { const Q = await open({ slot: 'rft', qs: ROOMQ, view: [402, 874] }), p = Q.page;
    await harborUp(p); await sleep(900);
    await ev(p, "document.querySelector('.nd-tab-you').click()");
    const cz = await waitFor(p, "!!document.querySelector('.vl-dp-go')", 'CUSTOMIZE', 15000).then(() => true, () => false);
    if (cz) {
      await ev(p, "document.querySelector('.vl-dp-go').click()");
      await waitFor(p, "!!document.querySelector('.vl-dress.is-in')", 'the dress screen', 8000).catch(() => {});
      await sleep(400);
      const t1 = await topAt(p);
      ok(t1 === 'vl-dress', `THE LAYER STACK (the title dock): YOU → CUSTOMIZE opens on top (${t1})`);
      // RESTORE YOUR ACCOUNT stands out: a cyan edge + title + the key icon (USE THIS CARD ON ANOTHER DEVICE stays glass)
      await ev(p, "document.querySelector('.vl-dress .vl-dr-back').click()"); await sleep(400);
      const rs = await ev(p, "(() => { const r = document.querySelector('.pf-restore'), u = document.querySelector('.pf-elsewhere'); if (!r) return null; r.scrollIntoView({ block: 'center' }); const b = getComputedStyle(r.querySelector('b')); return { color: b.color, key: !!r.querySelector('.pf-key-ic svg'), shadow: /63, 240, 255/.test(getComputedStyle(r).boxShadow), other: u ? /63, 240, 255/.test(getComputedStyle(u).boxShadow) : null }; })()");
      ok(rs && /\b111, 246, 255\b/.test(rs.color) && rs.key && rs.shadow && rs.other === false, `RESTORE YOUR ACCOUNT stands out: a neon-CYAN edge + glow, the title in cyan, a small key (${JSON.stringify(rs)}); USE THIS CARD ON ANOTHER DEVICE stays glass`);
      if (SHOTS) { await sleep(400); await p.screenshot({ path: `${OUT}room2-restore.png` }); }
    } else ok(false, 'THE LAYER STACK (the title dock): the profile shows CUSTOMIZE YOUR CARD');
    await Q.ctx.close(); }

  // ---- "1 OF 1" + THE TOP LINE NEVER CLIPS: every full card's top line (NEON SPEAKEASY · FOUNDER / · № n + its pill) whole at 390 / 402 / 430
  { const Q = await open({ slot: 'rfc', qs: ROOMQ, view: [390, 844] }), p = Q.page;
    const res = [];
    for (const [w, hh, k] of [[390, 844, 1], [402, 874, 1], [430, 932, 1], [390, 844, 0.72]]) {
      await p.setViewport({ width: w, height: hh, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      res.push(await ev(p, `(async () => {
        const V = await import('/js/vault/full.js'), S = await import('/js/vault/strip.js'), L = await import('/js/progress/look.js');
        await Promise.all([S.vaultSheet(), L.pgSheet()]); await document.fonts.ready;
        const box = document.createElement('div'); box.style.cssText = 'position:fixed;left:16px;top:0;width:${Math.round((w - 32) * k)}px;z-index:99999;'; document.body.append(box);
        const out = [];
        for (const id of Object.keys(S.LOOKS)) {
          box.replaceChildren(); const el = V.fullCardEl({ card: id, who: { name: 'WWWWWWWWWWWW', fd: true, no: '0001', lv: 42 } }); box.append(el);
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const top = el.querySelector('.vl-fc-top'), hs = top.querySelector('.vl-fc-house'), pill = top.querySelector('.vl-tier'), T = top.getBoundingClientRect(), H = hs.getBoundingClientRect(), P = pill.getBoundingClientRect();
          const rg = document.createRange(); rg.selectNodeContents(hs); const W = rg.getBoundingClientRect();
          const clip = W.right > P.left - 1 || W.left < T.left - 1 || P.right > T.right + 1 || P.left < T.left;
          out.push({ id, clip, fit: top.dataset.fit || '', pill: pill.textContent });
        }
        box.remove();
        return { w: '${w}' + (${k} < 1 ? ' (the viewer, 72 %)' : ''), n: out.length, bad: out.filter(x => x.clip).map(x => x.id), dev: out.filter(x => /dev/.test(x.id)).map(x => x.pill + ':' + x.fit), tight: out.filter(x => x.fit && x.fit !== 'css').length };
      })()`));
    }
    ok(res.every(r => r.dev.every(x => /^1 OF 1:/.test(x))), `THE DEV PILL reads just "1 OF 1" (${res[0].dev.join(' · ')})`);
    ok(res.every(r => r.n > 30 && !r.bad.length), `THE TOP LINE NEVER CLIPS: every full card (${res[0].n}) with FOUNDER + № at 390 / 402 / 430 (+ a 72 % viewer) — the words + the pill side by side, whole (${res.map(r => `${r.w}: ${r.bad.length ? r.bad.join(',') : 'ok'} · ${r.tight} tightened`).join(' | ')})`);
    await Q.ctx.close(); }
  log('roomfix', 'done');
});
void okT;

// ---- Group 1 — THE GAME START (the owner: 2–3 s MAX, every phone at once from the host's tap): the sign powers down, the game's logo lights
// under TONIGHT, the two lines file in through the side door (the host first), the view pushes through the door → the game; the game's own
// clock starts after it; a host change mid-start; a late joiner after it → straight in
export const startOC = p => ev(p, "import('/js/host.js').then(m => m.startGame('overclock', {}))");
export const onTitle = "!!document.querySelector('.title-screen:not(.screen-out)')";
G('gamestart', async () => {
  const { Q: A, p, code, me } = await hostRoom('gsa');
  const { Q: B, p: q, me: meB } = await joinRoom('gsb', code);
  await fakeGuests(code, 3);
  await settledRoom(p, 5, 40000).catch(() => {}); await settledRoom(q, 5, 40000).catch(() => {});
  const t0 = Date.now();
  await startOC(p);
  // both phones: the start shows (the sign swap) — the same match's stamp
  const seen = await Promise.all([p, q].map(x => waitFor(x, "!!document.querySelector('.nd-sign.rc-go .rc-tonight')", 'the start on this phone', 3000).then(() => Date.now() - t0, () => null)));
  const go = await ev(p, 'window.__arcade.state.meta.go');
  ok(seen.every(v => v != null && v < 1500) && go && go.g === 'overclock', `THE GAME START on BOTH phones from the host's tap (${seen.join(' / ')} ms after it): the NEON sign powers down, OVERCLOCK's tube logo under TONIGHT (meta/go: ${go && go.g})`);
  const shots = [];
  // (LOBBY FIXES: the full start — the sign at 0.56 s, the walk-in from 1.5 s, the fade at 4.3 s)
  for (const at of [350, 2300, 3000, 4200]) { await waitFor(p, `window.__arcade.serverNow() - window.__arcade.state.meta.go.at >= ${at}`, 'the show at ' + at, 6000).catch(() => {});
    const r = await ev(p, "(() => { const r = window.__district.room(); return r ? r.people.map(x => ({ uid: x.uid, goIn: x.goIn, inside: x.inside || !x.s, pose: x.s && x.s.pose, z: x.s && x.s.z })) : null; })()");
    shots.push({ at, r }); if (SHOTS) await p.screenshot({ path: `${OUT}room2-start-${at}.png` }); }
  const first = shots[0].r || [], mid = shots[1].r || [];
  const host = mid.find(x => x.uid === me);
  const h0 = first.find(x => x.uid === me);
  ok(first.length === 5 && first.every(x => x.goIn) && host && (host.pose === 'walk' || host.inside || (h0 && Math.abs(host.z - h0.z) > 0.15)), `THE FILE-IN: all 5 on their way in (${first.filter(x => x.goIn).length}/5), the HOST first — walking to the door at 2.3 s, under the lit sign (${host && host.pose})`);
  const gone = (shots[3].r || []).filter(x => x.inside).length;
  okT(gone >= 1, `…through the side door: by the fade, ${gone} of 5 already inside (the rest go straight in with it)`);
  const routed = await Promise.all([p, q].map(x => waitFor(x, `!(${onTitle})`, 'the game screen', 7000).then(() => Date.now() - t0, () => null)));
  ok(routed.every((v, i) => v != null && v - seen[i] >= 4100 && v - seen[i] <= 5800), `…a clean fade into the GAME on both phones ${routed.map((v, i) => v - seen[i]).join(' / ')} ms after the start showed there (the full start: 5 s from the stamp)`);
  const g = await ev(p, '({ s: window.__arcade.state.game.phaseStartAt, go: window.__arcade.state.meta.go.at })');
  ok(Math.abs(g.s - g.go - 5000) < 400, `THE GAME's OWN CLOCK starts after the walk inside (its first phase at the tap + ${g.s - g.go} ms)`);
  // a HOST CHANGE mid-start (the next one): B takes the room the moment the start begins — the start still ends in the game, the match runs
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(p, onTitle, 'A back on the city', 10000); await waitFor(q, onTitle, 'B back on the city', 10000);
  await sleep(1500);
  const t1 = Date.now(); await startOC(p);
  await waitFor(q, "!!document.querySelector('.nd-sign.rc-go')", 'B sees the start', 3000).catch(() => {});
  await dbPatch(`rooms/${code}/meta`, { hostId: meB });
  const r2 = await waitFor(q, `!(${onTitle})`, 'B in the game', 8000).then(() => Date.now() - t1, () => null);
  const ph0 = await ev(q, 'window.__arcade.state.game.phase');
  const adv = await waitFor(q, `window.__arcade.state.game.phase !== '${ph0}' || (window.__arcade.state.game.ci || 0) > 0`, 'the match moves on', 25000).then(() => true, () => false);
  ok(r2 != null && r2 < 6400 && adv, `A HOST CHANGE MID-START: the new host's phone still lands in the game (${r2} ms) and the match runs on from the room's data (${ph0} → moved on: ${adv})`);
  // a LATE JOINER after the start: straight into the game (spectating), no walk
  const C = await open({ slot: 'gsc', qs: `${ROOMQ}&room=${code}`, view: [402, 874] }), c = C.page;
  await harborUp(c).catch(() => {}); await ev(c, "(() => { const b = document.querySelector('.nd-go'); if (b) b.click(); })()");
  const late = await waitFor(c, `window.__arcade.state.code === '${code}' && !(${onTitle})`, 'C in the game', 20000).then(() => true, () => false);
  ok(late, 'A LATE JOINER (after the start): straight into the game, no walk');
  await A.ctx.close(); await B.ctx.close(); await C.ctx.close();
  log('gamestart', 'done');
});

// ---- Group 1 — THE CITY PAUSE: while a match is on screen the city STOPS drawing + FREES its memory (its canvases, its caches — the memory
// guard's count) and its sounds stop; after the match it comes back caught up to the real time (rebuilt from the server clock). Measured at an
// iPhone's 3× (402 × 874): the city's canvases + the JS heap in the room → during the match → back in the room
const memNow = async (p, cdp) => {
  await cdp.send('HeapProfiler.collectGarbage').catch(() => {}); await sleep(300);
  const m = await cdp.send('Performance.getMetrics'); const heap = (m.metrics.find(x => x.name === 'JSHeapUsedSize') || {}).value || 0;
  const cv = await ev(p, "import('/js/ui/canvas-safe.js').then(m => m.canvasMb())");
  return { heap: +(heap / 1e6).toFixed(1), canvas: cv.mb, n: cv.n };
};
G('citypause', async () => {
  const { Q: A, p, code } = await hostRoom('cpa', [402, 874], { dpr: 3 });
  const { Q: B } = await joinRoom('cpb', code);
  await settledRoom(p, 2, 40000).catch(() => {}); await sleep(2500);
  const cdp = await p.target().createCDPSession(); await cdp.send('Performance.enable');
  const m0 = await memNow(p, cdp);
  const CK = "import('/js/core/city.js').then(m => ({ c: m.cityClock().now(), d: Date.now() }))";
  const k0 = await ev(p, CK);
  await startOC(p);
  await waitFor(p, `!(${onTitle})`, 'the game', 8000);
  await sleep(5000);
  const m1 = await memNow(p, cdp);
  const st = await ev(p, "({ city: !!window.__district, scene: !!document.querySelector('.nd-scene'), canvases: [...document.querySelectorAll('canvas')].filter(c => c.width * c.height > 1).length })");
  ok(!st.city && !st.scene, `THE CITY PAUSE: during the match the city is GONE from the page — it draws nothing, its sounds stopped with it (the scene: ${st.scene}, its hooks: ${st.city}; ${st.canvases} canvases on the page are the game's)`);
  ok(m1.canvas < m0.canvas * 0.5, `…and its MEMORY is freed — canvases ${m0.canvas} MB (${m0.n}) in the room → ${m1.canvas} MB (${m1.n}) in the match; the JS heap ${m0.heap} → ${m1.heap} MB (an iPhone's 3×, 402 × 874)`);
  log('citypause', `MEMORY room ${JSON.stringify(m0)} → match ${JSON.stringify(m1)}`);
  // back in the room: the city rebuilt, caught up (its clock = now), the room on it again
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(p, onTitle, 'back on the city', 10000); await harborUp(p);
  await sleep(6000);
  const m2 = await memNow(p, cdp);
  const k1 = await ev(p, CK), R = await roomOf(p);
  const back = { people: R && R.people.length, off: Math.round(Math.abs((k1.c - k0.c) - (k1.d - k0.d))) };
  ok(back.people === 2 && back.off < 3000, `…and it COMES BACK after the match: the city rebuilt CAUGHT UP — its clock ran on through the match (off by ${back.off} ms), the room on it (${back && back.people} people) — canvases ${m2.canvas} MB (${m2.n}), heap ${m2.heap} MB`);
  log('citypause', `MEMORY back ${JSON.stringify(m2)}`);
  await A.ctx.close(); await B.ctx.close();
});

// ---- Group 2 — AFTER THE MATCH: everyone WALKS BACK OUT through the side door to the same places, THE WINNER's BANNER PLANE (the same on
// every phone at once; a refresh mid-flight), THE REMATCH VOTE (the host's ring REMATCH, a guest's ring = a vote, the dots, the pill, the 👍,
// take it back, clear on a start / another game; nothing auto-starts)
export const podium = async (p, code, winners) => {
  const g = await ev(p, '({ m: window.__arcade.state.game.matchId, players: window.__arcade.state.players })');
  const pts = {}, n = {};
  Object.keys(g.players).forEach((u, i) => { pts[u] = winners.includes(u) ? 3 : i % 3; n[u] = g.players[u].name; });
  await dbPatch(`rooms/${code}/night/${g.m}`, { g: 'overclock', p: pts, n, at: { '.sv': 'timestamp' } });
  return g.m;
};
const lastBanner = x => ev(x, '(() => { const r = window.__district && window.__district.roomBanner && window.__district.roomBanner(); return r && r.last ? r.last : null; })()');
G('afterparty', async () => {
  const { Q: A, p, code, me } = await hostRoom('apa');
  const { Q: B, p: q, me: meB } = await joinRoom('apb', code);
  const fakes = await fakeGuests(code, 3);
  await settledRoom(p, 5, 40000).catch(() => {}); await settledRoom(q, 5, 40000).catch(() => {});
  const slots0 = Object.fromEntries((await roomOf(p)).people.map(x => [x.uid, x.slot]));
  await startOC(p);
  await waitFor(p, `!(${onTitle})`, 'the game', 8000); await waitFor(q, `!(${onTitle})`, 'B in the game', 8000);
  const m = await podium(p, code, [me]);
  await sleep(800);
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await Promise.all([p, q].map(x => waitFor(x, onTitle, 'back on the city', 12000)));
  await harborUp(p);
  // WALKING BACK OUT: through the side door, the host first — some still inside, someone stepping out
  await waitFor(p, '(() => { const r = window.__district.room(); return r && r.people && r.people.some(x => x.s && x.s.pose === "walk"); })()', 'someone walking out', 8000).catch(() => {});
  const w = await roomOf(p);
  const walking = ((w && w.people) || []).filter(x => x.s && x.s.pose === 'walk').length, hidden = ((w && w.people) || []).filter(x => !x.s || x.inside).length;
  ok(walking >= 1, `WALKING BACK OUT: through the side door after the match (${walking} walking, ${hidden} still inside the club)`);
  if (SHOTS) await p.screenshot({ path: `${OUT}room2-walkout.png` });
  await settledRoom(p, 5, 30000).catch(() => {});
  const slots1 = Object.fromEntries((await roomOf(p)).people.map(x => [x.uid, x.slot]));
  ok(JSON.stringify(slots1, Object.keys(slots0).sort()) === JSON.stringify(slots0, Object.keys(slots0).sort()), `…to THE SAME PLACES they left (${Object.values(slots1).join(' ')})`);
  // THE WINNER's BANNER PLANE: on both phones at once, the winner's name, ~2 s after everyone is back
  const fl = await Promise.all([p, q].map(x => waitFor(x, '(() => { const r = window.__district && window.__district.roomBanner && window.__district.roomBanner(); return !!(r && r.last && r.last.how); })()', 'the banner', 25000).then(() => lastBanner(x), () => lastBanner(x))));
  ok(fl.every(f => f && f.how === 'flown' && f.m === m) && Math.abs(fl[0].firedAt - fl[1].firedAt) < 1200 && JSON.stringify(fl[0].lines) === JSON.stringify(fl[1].lines) && /AVA/.test(fl[0].lines.join(' ')),
    `THE WINNER's BANNER PLANE on BOTH phones at once (${fl.map(f => f && f.how).join(' / ')}, ${fl[0] && fl[1] && fl[0].firedAt && fl[1].firedAt ? Math.abs(fl[0].firedAt - fl[1].firedAt) : '—'} ms apart): "${fl[0] && fl[0].lines.join(' | ')}"`);
  ok(await ev(p, 'window.__district.bannerOn()'), "the city's own banner plane is in the sky");
  await sleep(3500); if (SHOTS) await p.screenshot({ path: `${OUT}room2-banner-402.png` });
  // a REFRESH mid-flight: the plane where it is now
  await q.reload(); await harborUp(q);
  await waitFor(q, '(() => { const r = window.__district.roomBanner && window.__district.roomBanner(); return !!(r && r.last && r.last.how); })()', 'B banner after refresh', 15000).catch(() => {});
  const rf = await lastBanner(q);
  ok(rf && rf.how === 'flown' && (await ev(q, 'window.__district.bannerOn()')), `A REFRESH MID-BANNER: the plane is still up, mid-flight (${rf && rf.how})`);
  // THE REMATCH VOTE: the host's ring REMATCH, the guest's REMATCH · VOTE
  await waitFor(p, "document.querySelector('.rdk-play').classList.contains('rdk-rm')", 'the REMATCH ring', 10000).catch(() => {});
  await waitFor(q, "document.querySelector('.rdk-play').classList.contains('rdk-rm')", 'B REMATCH ring', 10000).catch(() => {});
  const ringA = await ev(p, "({ w: document.querySelector('.rdk-play .nd-host-label').textContent, pips: document.querySelectorAll('.rdk-pip').length, lit: document.querySelectorAll('.rdk-pip.is-on').length })");
  const ringB = await ev(q, "({ w: document.querySelector('.rdk-play .nd-host-label').textContent, wait: document.querySelector('.rdk-play').classList.contains('rdk-wait') })");
  ok(ringA.w === 'REMATCH' && ringA.pips === 0 && ringA.lit === 0 && /REMATCH\s*VOTE/.test(ringB.w) && !ringB.wait, `THE REMATCH RING: the host's reads ${ringA.w} — no empty dots (LOBBY FIXES: v2); the guest's own ring reads "${ringB.w}" (not greyed)`);
  // the word FITS inside the ring (the real font)
  // (LOBBY FIXES — the owner: REMATCH must sit INSIDE the ring, never on the tube: within the tube's inner circle — 0.62 of the ring's width)
  const fit = await ev(p, "(() => { const l = document.querySelector('.rdk-play .rdk-w1'), r = document.querySelector('.rdk-play .nd-hring').getBoundingClientRect(), b = l.getBoundingClientRect(), cx = r.left + r.width / 2, inner = r.width * 0.62; return { lw: Math.round(b.width), rw: Math.round(r.width), inside: b.left >= cx - inner / 2 && b.right <= cx + inner / 2 }; })()");
  ok(fit.inside, `…the word REMATCH sits INSIDE the ring's tube (${fit.lw} pt in its ${Math.round(fit.rw * 0.62)} pt inner circle)`);
  // B votes: a dot lights in B's colour on BOTH phones, the pill, the 👍 over B
  await ev(q, "document.querySelector('.rdk-play').click()");
  await waitFor(p, "document.querySelectorAll('.rdk-pip.is-on').length === 1", 'a dot lit on A', 6000).catch(() => {});
  await dbPatch(`rooms/${code}/rv`, { [fakes[0]]: m });
  await waitFor(p, "document.querySelectorAll('.rdk-pip.is-on').length === 2", 'two dots', 6000).catch(() => {});
  await sleep(400);
  const v = await ev(p, `({ lit: document.querySelectorAll('.rdk-pip.is-on').length, pill: document.querySelector('.rdk-votes').hidden ? '' : document.querySelector('.rdk-votes').textContent, thumb: !!document.querySelector('.rc-thumb, .rc-tag.is-voted') })`);
  const vB = await ev(q, "({ w: document.querySelector('.rdk-play .nd-host-label').textContent, lit: document.querySelectorAll('.rdk-pip.is-on').length, pill: document.querySelector('.rdk-votes').textContent })");
  ok(v.lit === 2 && /^\s*want a rematch\s*$/.test(v.pill) && !v.thumb && vB.lit === 2 && /✓ VOTED/.test(vB.w), `THE VOTES: 2 dots lit on both phones, "${v.pill}" — no 👍 over the people (the TIDY: ${!v.thumb}); the guest's ring: "${vB.w}"`);
  // THE TIDY (the owner, Nov 4 9:25 am): the dots in ONE row right above the ring — on screen, never over the dock's pill; the pill above the row
  const lay = await ev(p, "(() => { const R = e => e.getBoundingClientRect(), ring = R(document.querySelector('.rdk-play')), pill = R(document.querySelector('.nd-pill, .rdk-pill')), votes = R(document.querySelector('.rdk-votes')), dots = [...document.querySelectorAll('.rdk-votes .rdk-pip')].map(R); return { inPill: dots.length === 2 && dots.every(d => d.left >= votes.left && d.right <= votes.right), above: votes.bottom <= ring.top + 2, onScreen: votes.right <= innerWidth && votes.left >= 0, clearPill: votes.bottom <= pill.top || votes.left >= pill.right }; })()");
  ok(Object.values(lay).every(Boolean), `LOBBY FIXES v2: ONE small pill right above the ring — only the lit voters' dots + "want a rematch", fully on screen, clear of the dock's pill (${JSON.stringify(lay)})`);
  if (SHOTS) { await p.screenshot({ path: `${OUT}room2-vote-host-402.png` }); await q.screenshot({ path: `${OUT}room2-vote-guest-402.png` }); }
  // take it back
  await ev(q, "document.querySelector('.rdk-play').click()");
  const back = await waitFor(p, "document.querySelectorAll('.rdk-pip.is-on').length === 1", 'one dot', 6000).then(() => true, () => false);
  ok(back, 'TAP AGAIN = the vote taken back (the dot goes dark on every phone)');
  // nothing auto-starts (the room stays in the lobby with votes in)
  await sleep(2500);
  ok((await ev(p, 'window.__arcade.state.meta.status')) === 'lobby', 'NOTHING AUTO-STARTS: votes in, the room still waits for the host');
  // the host's REMATCH: the same game, everyone in (the walk inside again); the votes cleared
  await ev(p, "document.querySelector('.rdk-play').click()");
  const rs = await waitFor(p, "window.__arcade.state.meta.status === 'playing'", 'the rematch', 10000).then(() => ev(p, '({ g: window.__arcade.state.game.id, rv: window.__arcade.state.rv, back: window.__arcade.state.meta.back || null, parts: Object.keys(window.__arcade.state.game.participants).length })'), () => null);
  ok(rs && rs.g === 'overclock' && !Object.keys(rs.rv || {}).length && !rs.back && rs.parts === 5, `THE HOST's REMATCH: the same game (${rs && rs.g}), everyone in (${rs && rs.parts}), the votes + the ring cleared`);
  // back again (a TIE this time) → the host picks ANOTHER game (GAMES): the ring back to PLAY, the votes clear
  await waitFor(p, `!(${onTitle})`, 'the game', 8000);
  await podium(p, code, [meB, fakes[1]]);
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(p, onTitle, 'back', 12000); await harborUp(p);
  await waitFor(p, '(() => { const r = window.__district.roomBanner && window.__district.roomBanner(); return !!(r && r.last && r.last.lines); })()', 'the tie banner', 25000).catch(() => {});
  const tie = await lastBanner(p);
  ok(tie && /\+/.test(tie.lines.join(' ')), `A TIE: "${tie && tie.lines.join(' | ')}"`);
  await waitFor(p, "document.querySelector('.rdk-play').classList.contains('rdk-rm')", 'REMATCH', 15000).catch(() => {});
  await dbPatch(`rooms/${code}/rv`, { [fakes[0]]: await ev(p, 'window.__arcade.state.meta.back.m') });
  await ev(p, "document.querySelector('.rdk-games').click()");
  await waitFor(p, "document.querySelectorAll('.rc-games-sheet .rc-game').length >= 2", 'the games', 8000).catch(() => {});
  await ev(p, "document.querySelector('.rc-games-sheet .rc-game[data-game=\"prism\"]').click()");
  const pick = await waitFor(p, "!document.querySelector('.rdk-play').classList.contains('rdk-rm') && !Object.keys(window.__arcade.state.rv || {}).length", 'PLAY again', 8000).then(() => true, () => false);
  ok(pick, 'THE HOST PICKS ANOTHER GAME: the ring goes back to PLAY, every vote clears');
  await ev(p, "(() => { const m = document.querySelector('.modal'); if (m) m.click(); })()");
  ok(!(await ev(p, "!!document.querySelector('.lobby-screen')")) && !(await ev(q, "!!document.querySelector('.lobby-screen')")), 'THE OLD LOBBY SCREEN never shows in City 2.0 (from the join to the podium and back)');
  // THE NIGHT's CHAMPION: B leaves after 2 games → B's own city flies LAST CALL — <the night's leader> WINS THE NIGHT
  await ev(q, "import('/js/room.js').then(m => m.leaveRoom())");
  await waitFor(q, "import('/js/screens/room-banner.js').then(m => { const c = m.champDebug(); return !!(c && c.how); })", 'the champion banner (after the last winner banner clears the sky)', 45000).catch(() => {});
  const ch = await ev(q, "import('/js/screens/room-banner.js').then(m => m.champDebug())");
  ok(ch && ch.kind === 'last-call' && ch.how === 'flown' && /LAST CALL/.test(ch.lines.join(' ')) && /THE NIGHT/.test(ch.lines.join(' ')), `THE NIGHT's CHAMPION: leaving after 2 games, this phone's city flies "${ch && ch.lines.join(' | ')}" (${ch && ch.how})`);
  if (SHOTS) { await sleep(3000); await q.screenshot({ path: `${OUT}room2-lastcall-402.png` }); }
  const again = await ev(q, "import('/js/screens/room-banner.js').then(m => m.champBanner(null, 'last-night'))");
  ok(again === null, 'once a night a device: no second champion banner (the record is marked shown)');
  await A.ctx.close(); await B.ctx.close();
  log('afterparty', 'done');
});

// ---- Group 3 — THE CARTRIDGE PLUG in a real page: checkCartridge on every registered module (the playable ones must pass; the hidden ones
// are EXEMPT — counted, not failed), the view warmable, the chat asking the game for its lock
G('cartridge', async () => {
  const Q = await open({ slot: 'cart', qs: ROOMQ, view: [402, 874] }), p = Q.page;
  const r = await ev(p, `(async () => {
    const [R, C, M, K] = await Promise.all([import('/js/games/registry.js'), import('/js/games/cartridge.js'), import('/js/screens/district/marks.js'), import('/js/config.js')]);
    const out = {};
    for (const [id, mod] of Object.entries(R.GAME_MODULES)) {
      const g = K.GAMES.find(x => x.id === id);
      out[id] = { playable: !!(g && g.playable), problems: C.checkCartridge(id, mod, { marks: M.MARKS, game: g }), warm: !!(mod.createView && mod.createView.warm), lock: typeof mod.chatLocked === 'function' };
    }
    return out;
  })()`);
  const play = Object.entries(r).filter(([, x]) => x.playable), hidden = Object.entries(r).filter(([, x]) => !x.playable);
  ok(play.length === 2 && play.every(([, x]) => !x.problems.length && x.warm && x.lock), `THE CARTRIDGE PLUG: the playable games meet the contract in a real page (${play.map(([id, x]) => `${id}: ${x.problems.length ? x.problems.join('; ') : 'ok'}`).join(' · ')}) — warmable views, their own chat locks`);
  ok(hidden.length === 10, `the ${hidden.length} hidden games are EXEMPT until each comes back (${hidden.map(([id, x]) => `${id} ${x.problems.length}`).join(', ')} gaps — frozen)`);
  await Q.ctx.close();
});

// ---- THE ADD-ON (the owner, Nov 4 8:14 am) — THE CREW's BLACKBIRD "didn't fly": the cause — the server wrote the crew's LOBBY ONLY moments to
// rooms/{CODE}/radio all along, but the room's phones only ever played the intercom from there (the sky moments were left "until LOBBY 2.0").
// Now: a crew moment (the server's own shape) flies ONCE on every phone in that room; a phone outside the room never sees it
G('crewsky', async () => {
  const { Q: A, p, code } = await hostRoom('csa', [402, 874], { qs: `when=2026-11-03T21:00${'&tz=America/Detroit&at=42.96,-85.67'}&wx=clear` });
  const { Q: B, p: q } = await joinRoom('csb', code, [402, 874], { qs: `when=2026-11-03T21:00${'&tz=America/Detroit&at=42.96,-85.67'}&wx=clear` });
  const O = await open({ slot: 'cso', qs: `when=2026-11-03T21:00${'&tz=America/Detroit&at=42.96,-85.67'}&wx=clear`, view: [402, 874] }), o = O.page;
  await harborUp(o); await sleep(2500);
  const at = (await ev(p, 'window.__arcade.serverNow()')) + 2500, id = 'e2ecrew' + Date.now().toString(36);
  await dbPatch(`rooms/${code}/radio/${id}`, { jack: 'blackbird', at, until: at + 25000, aud: 'room', state: 'q', by: 'crew' });
  const flies = x => waitFor(x, `(() => { const r = window.__district.radio && window.__district.radio(); const m = r && r.moments.find(y => y.id === '${id}'); return !!(m && m.played === 'on'); })()`, 'the blackbird plays', 15000).then(() => true, () => false);
  const [fa, fb] = await Promise.all([flies(p), flies(q)]);
  const out = await ev(o, `(() => { const r = window.__district.radio && window.__district.radio(); return !!(r && r.moments.some(y => y.id === '${id}')); })()`);
  ok(fa && fb && !out, `THE CREW's BLACKBIRD flies on EVERY phone in the room (host ${fa}, guest ${fb}) — never outside it (${out})`);
  // (and the jet itself crosses: the Blackbird's own state on the host's phone — after its tell)
  const jet = await waitFor(p, '(() => { const b = window.__district.harbor().blackbird; return !!(b && b.on); })()', 'the SR-71 in the sky', 20000).then(() => true, () => false);
  ok(jet, 'THE SR-71 crosses the sky on the room phone (its own state: on)');
  if (SHOTS) await p.screenshot({ path: `${OUT}room2-crew-blackbird.png` });
  // ONCE: the same moment re-fed (a room update) never starts it again
  const n0 = await ev(p, `window.__district.radio().moments.filter(y => y.id === '${id}').length`);
  await dbPatch(`rooms/${code}/radio/${id}`, { state: 'run' }); await sleep(1200);
  const again = await ev(p, `window.__district.radio().moments.find(y => y.id === '${id}').played`);
  ok(n0 === 1 && again === 'on', `…ONCE: one moment, still the same play after the room updates it (${again})`);
  await A.ctx.close(); await B.ctx.close(); await O.ctx.close();
});

// ---- THE ADD-ON — LEAVE ROOM up front: the TOP of the ☰ menu (red-edged, a second tap = SURE?) + the foot of GUESTS; leaving = the wave +
// the walk off on the other phones
G('leaveroom', async () => {
  const { Q: A, p, code } = await hostRoom('lra');
  const { Q: B, p: q, me: meB } = await joinRoom('lrb', code);
  await settledRoom(p, 2, 40000).catch(() => {});
  // ☰ → LEAVE ROOM is the first row, red-edged; one tap arms it (SURE?), the second leaves
  await ev(q, "document.querySelector('.menu-btn').click()"); await waitFor(q, "!!document.querySelector('.gm-panel .gm-item')", 'the menu', 5000);
  const m = await ev(q, "(() => { const f = document.querySelector('.gm-panel .gm-item'); return { first: f.querySelector('b').textContent, red: f.classList.contains('gm-leave'), edge: getComputedStyle(f).borderTopColor }; })()");
  if (SHOTS) await q.screenshot({ path: `${OUT}room2-menu-leave.png` });
  await ev(q, "document.querySelector('.gm-panel .gm-leave').click()");
  const armed = await ev(q, "document.querySelector('.gm-panel .gm-leave b').textContent");
  const still = await ev(q, '!!window.__arcade.state.code');
  await ev(q, "document.querySelector('.gm-panel .gm-leave').click()");
  const left = await waitFor(q, '!window.__arcade.state.code', 'B left', 8000).then(() => true, () => false);
  const wave = await waitFor(p, `(() => { const r = window.__district.room(); const x = r && r.people.find(y => y.uid === '${meB}'); return !!(x && x.leaving); })()`, 'the wave on A', 6000).then(() => true, () => false);
  ok(m.first === 'LEAVE ROOM' && m.red && /SURE/.test(armed) && still && left && wave, `LEAVE ROOM — the TOP of the ☰ menu (${m.first}, red-edged ${m.red}); one tap = "${armed}" (still in: ${still}); the second leaves (${left}) — the other phone sees them wave + walk off (${wave})`);
  // GUESTS → LEAVE ROOM at the foot (B back in first)
  const { Q: C, p: c, me: meC } = await joinRoom('lrc', code);
  await settledRoom(p, 2, 40000).catch(() => {});
  await ev(c, "document.querySelector('.rdk-guests').click()"); await waitFor(c, "!!document.querySelector('.rg-sheet .rg-leave')", 'the guest list', 10000);
  const pos = await ev(c, "(() => { const b = document.querySelector('.rg-sheet .rg-leave'), body = document.querySelector('.rg-sheet .pfs-body'); return { last: body.lastElementChild === b, txt: b.textContent }; })()");
  await ev(c, "document.querySelector('.rg-sheet .rg-leave').scrollIntoView({ block: 'center' })"); await sleep(300);
  if (SHOTS) await c.screenshot({ path: `${OUT}room2-guests-leave.png` });
  await ev(c, "document.querySelector('.rg-sheet .rg-leave').click()");
  const arm2 = await ev(c, "document.querySelector('.rg-sheet .rg-leave').textContent");
  await ev(c, "document.querySelector('.rg-sheet .rg-leave').click()");
  const left2 = await waitFor(c, '!window.__arcade.state.code', 'C left', 8000).then(() => true, () => false);
  const wave2 = await waitFor(p, `(() => { const r = window.__district.room(); const x = r && r.people.find(y => y.uid === '${meC}'); return !!(x && x.leaving); })()`, 'the wave on A', 6000).then(() => true, () => false);
  ok(pos.last && pos.txt === 'LEAVE ROOM' && /SURE/.test(arm2) && left2 && wave2, `LEAVE ROOM — the foot of GUESTS (the last thing in the sheet: ${pos.last}); "${arm2}" → left (${left2}); the wave on the other phone (${wave2})`);
  await A.ctx.close(); await B.ctx.close(); await C.ctx.close();
});

// ---- THE ADD-ON — ONE SHEET STACK: whatever opens from a sheet opens ON TOP of it (the newest is what the finger sees); ‹ closes one step
G('sheetstack', async () => {
  // THE ROOM DOCK
  const { Q: A, p, code } = await hostRoom('ssa');
  const fakes = await fakeGuests(code, 2);
  const { Q: B, p: q } = await joinRoom('ssb', code);
  await settledRoom(q, 4, 40000).catch(() => {});
  const steps = [];
  // GUESTS → a guest's card
  await ev(q, "document.querySelector('.rdk-guests').click()"); await waitFor(q, "document.querySelectorAll('.rg-sheet .rg-row').length >= 3", 'guests', 10000);
  await ev(q, `(() => { const r = [...document.querySelectorAll('.rg-sheet .rg-row')].find(x => x.dataset.uid === '${fakes[0]}') || document.querySelectorAll('.rg-sheet .rg-row')[1]; (r.querySelector('button, .vl-strip') || r).click(); })()`);
  await sleep(700);
  steps.push(['GUESTS → a card', await topAt(q)]);
  await ev(q, "(() => { const b = [...document.querySelectorAll('.pfs:not(.is-out) .pfs-back')].pop(); if (b) b.click(); else { const x = document.querySelector('.vl-full-x'); if (x) x.click(); } })()"); await sleep(500);
  steps.push(['‹ → GUESTS again', await topAt(q)]);
  await ev(q, "document.querySelector('.rg-sheet .pfs-back').click()"); await sleep(400);
  // GAMES (a guest) → HOW TO PLAY over the games sheet
  await ev(q, "document.querySelector('.rdk-games').click()"); await waitFor(q, "document.querySelectorAll('.rc-games-sheet .rc-game').length >= 2", 'games', 8000);
  await ev(q, "document.querySelector('.rc-games-sheet .rc-game').click()"); await sleep(700);
  steps.push(['GAMES → HOW TO PLAY', await topAt(q)]);
  await ev(q, "(() => { const m = [...document.querySelectorAll('.modal:not(.out)')].pop(); if (m) m.click(); })()"); await sleep(500);
  steps.push(['… closed → GAMES again', await topAt(q)]);
  await ev(q, "document.querySelector('.rc-games-sheet .pfs-back').click()"); await sleep(400);
  // YOU → CUSTOMIZE → VIEW FULL (the room's profile overlay)
  await ev(q, "document.querySelector('.rdk-you').click()");
  const czR = await waitFor(q, "!!document.querySelector('.pf-overlay .vl-dp-go')", 'CUSTOMIZE', 15000).then(() => true, () => false);
  if (czR) { await ev(q, "document.querySelector('.pf-overlay .vl-dp-go').click()"); await sleep(600); steps.push(['YOU → CUSTOMIZE', await topAt(q)]);
    await ev(q, "document.querySelector('.vl-dress .vl-dr-view').click()"); await sleep(700); steps.push(['… → VIEW FULL', await topAt(q)]);
    await ev(q, "document.querySelector('.vl-full-x').click()"); await sleep(400); steps.push(['… close → CUSTOMIZE', await topAt(q)]);
    await ev(q, "document.querySelector('.vl-dress .vl-dr-back').click()"); await sleep(400);
    await ev(q, "(() => { const b = document.querySelector('.pf-overlay .bar button, .pf-overlay .pf-back'); if (b) b.click(); })()"); await sleep(400); }
  // a player tap in the room → their card
  const d = await ev(q, 'window.__district.room().hits'), u = Object.keys(d).find(x => x === fakes[1]);
  if (u) { const r = d[u]; await tapAt(q, (r.x0 + r.x1) / 2, r.y1 - 12); await sleep(700); steps.push(['a player tap → their card', await topAt(q)]); }
  await ev(q, "(() => { const b = [...document.querySelectorAll('.pfs:not(.is-out) .pfs-back')].pop(); if (b) b.click(); })()"); await sleep(400);
  const want = { 'GUESTS → a card': /sheet:rc-card-sheet|vl-full/, '‹ → GUESTS again': /sheet:rg-sheet/, 'GAMES → HOW TO PLAY': /^modal/, '… closed → GAMES again': /sheet:rc-games-sheet/,
    'YOU → CUSTOMIZE': /^vl-dress$/, '… → VIEW FULL': /^vl-full$/, '… close → CUSTOMIZE': /^vl-dress$/, 'a player tap → their card': /sheet:rc-card-sheet|vl-full/ };
  ok(steps.length === 8 && steps.every(([k, v]) => want[k].test(String(v))), `ONE SHEET STACK (the room dock): the newest on top every step — ${steps.map(([k, v]) => `${k} [${v}]`).join(' · ')}`);
  await A.ctx.close(); await B.ctx.close();
  // THE TITLE DOCK: YOU → the profile → CUSTOMIZE → VIEW FULL → closed → CUSTOMIZE's NAME row → the name sheet on top → ‹ one step
  const T = await open({ slot: 'sst', qs: ROOMQ, view: [402, 874] }), t = T.page;
  await harborUp(t); await sleep(900);
  await ev(t, "document.querySelector('.nd-tab-you').click()");
  const ts = [];
  if (await waitFor(t, "!!document.querySelector('.vl-dp-go')", 'the profile', 15000).then(() => true, () => false)) {
    await ev(t, "document.querySelector('.vl-dp-go').click()"); await sleep(600); ts.push(await topAt(t));
    await ev(t, "document.querySelector('.vl-dress .vl-dr-view').click()"); await sleep(700); ts.push(await topAt(t));
    // (LOBBY FIXES — the owner's ADD-ON 3: NAME + COLOUR are rows at CUSTOMIZE's top — its NAME sheet opens ON TOP of CUSTOMIZE, ‹ one step back)
    await ev(t, "document.querySelector('.vl-full-x').click()"); await sleep(400); ts.push(await topAt(t));
    await ev(t, "document.querySelector('.vl-dress .vl-yr-name').click()"); await sleep(700); ts.push(await topAt(t));
    await ev(t, "[...document.querySelectorAll('.pfs:not(.is-out) .pfs-back')].pop().click()"); await sleep(500); ts.push(await topAt(t));
  }
  ok(ts.length === 5 && ts[0] === 'vl-dress' && ts[1] === 'vl-full' && ts[2] === 'vl-dress' && /^sheet:pf-name-sheet/.test(ts[3]) && ts[4] === 'vl-dress', `ONE SHEET STACK (the title dock): CUSTOMIZE [${ts[0]}] → VIEW FULL [${ts[1]}] → closed [${ts[2]}] → its NAME row → the name sheet ON TOP [${ts[3]}] → ‹ one step back [${ts[4]}]`);
  await T.ctx.close();
});

// ---- THE OWNER's REAL-PHONE BUG (Nov 4 10:37 am): two iPhones on the new code, NONE of the show — the live database still had the OLD rules
// (meta/go + meta/back refused) and the room went on silently. SERIAL (it swaps the shared emulator's rules): with the OLD rules loaded, the show
// MUST still run — the sign + the game's logo, the walk inside, the walk back out, THE WINNER's BANNER — then the rules are restored.
// ---- FR6 FIXES A — THE CONSOLE's FLOWS (review-6.md B1–B7), two real phones on the emulators:
//   B1  a guest's CUSTOMIZE (on the room's profile) + HOW TO PLAY + the ☰ menu open when the host starts → ALL gone; the guest lands in the game
//   B4  REMATCH fired twice at once (the ring's double-tap on a slow line) → ONE match (one stamp, one match id on every phone)
//   B2  a start that DIES (the stamp up, nobody preparing it) → the host takes it down, BOTH phones say THE START DIDN'T GO THROUGH, the room
//       back (lobby, no veil)
//   B6  BACK TO THE ROOM with OVERCLOCK's done-timer pending → no page error
const OPEN_NOW = `({ dress: !!document.querySelector('.vl-dress'), overlay: !!document.querySelector('.pf-overlay:not(.screen-out)'), modal: !!document.querySelector('.modal:not(.out)'), menu: !!document.querySelector('.gm:not(.out)'), game: !!document.querySelector('.screen.oc') })`;
G('gameflows', async () => {
  const { Q: A, p, code, me } = await hostRoom('gfa');
  const { Q: B, p: q } = await joinRoom('gfb', code);
  const errs = []; q.on('pageerror', e => errs.push(String(e.message || e))); p.on('pageerror', e => errs.push(String(e.message || e)));
  await settledRoom(p, 2, 40000).catch(() => {}); await settledRoom(q, 2, 40000).catch(() => {});
  // B1 — the guest opens YOU → CUSTOMIZE (over the room's profile), then HOW TO PLAY, then the ☰ menu
  await ev(q, "document.querySelector('.rdk-you').click()");
  await waitFor(q, "!!document.querySelector('.pf-overlay .vl-dp-go')", 'B: CUSTOMIZE', 15000).catch(() => {});
  await ev(q, "(() => { const b = document.querySelector('.pf-overlay .vl-dp-go'); if (b) b.click(); })()");
  await waitFor(q, "!!document.querySelector('.vl-dress.is-in')", 'B: the dress screen', 8000).catch(() => {});
  await ev(q, "import('/js/ui/help.js').then(m => m.openHelp('overclock'))");
  await waitFor(q, "!!document.querySelector('.modal:not(.out)')", 'B: HOW TO PLAY', 5000).catch(() => {});
  await ev(q, "(() => { const b = document.querySelector('.menu-btn'); if (b) b.click(); })()");
  await sleep(300);
  const before = await ev(q, OPEN_NOW);
  await startOC(p);
  await waitFor(q, `!(${onTitle})`, 'B in the game', 8000).catch(() => {});
  await sleep(800);
  const after = await ev(q, OPEN_NOW);
  ok(before.dress && before.overlay && before.modal && !after.dress && !after.overlay && !after.modal && !after.menu && after.game,
    `B1 — A SHEET OPEN AT THE START IS GONE: the guest's CUSTOMIZE + the room's profile + HOW TO PLAY${before.menu ? ' + ☰' : ''} (${JSON.stringify(before)}) → at the start, all closed, the match on screen (${JSON.stringify(after)})`);
  // B6 — back to the room mid-challenge (OVERCLOCK's timers pending) → no page error
  await waitFor(p, "window.__arcade.state.game && window.__arcade.state.game.phase !== 'intro'", 'the match running', 15000).catch(() => {});
  await podium(p, code, [me]);
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await Promise.all([p, q].map(x => waitFor(x, onTitle, 'back in the room', 12000)));
  await harborUp(p); await harborUp(q);
  // B4 — two starts at once (the ring's double-tap on a slow line reaches host.js#startGame twice — every start path goes through it: the
  //  ring's rematch(), INITIATE, the podium's REMATCH) → ONE match: the second caller gets the first one's promise (without the guard: two
  //  stamps + two whole matches a second apart)
  await ev(q, "(() => { window.__mids = new Set(); window.__gos = new Set(); setInterval(() => { const s = window.__arcade.state; if (s.game && s.game.matchId) window.__mids.add(s.game.matchId); if (s.meta && s.meta.go) window.__gos.add(s.meta.go.m); }, 40); })()");
  await waitFor(p, '!!(window.__arcade.state.meta && window.__arcade.state.meta.back)', 'the back stamp', 8000).catch(() => {});
  const two = await ev(p, "import('/js/host.js').then(m => Promise.all([m.startGame('overclock', {}), m.startGame('overclock', {})]))");
  await waitFor(q, `!(${onTitle})`, 'B in the rematch', 8000).catch(() => {});
  await sleep(2500);
  const ids = await ev(q, '({ m: [...window.__mids], g: [...window.__gos] })');
  ok(two.every(Boolean) && ids.m.length === 1 && ids.g.length <= 1, `B4 — A DOUBLE REMATCH = ONE MATCH (both taps answered ${JSON.stringify(two)}; the guest saw match ids ${ids.m.join(', ')} · start stamps ${ids.g.join(', ') || '—'})`);
  await podium(p, code, [me]);
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await Promise.all([p, q].map(x => waitFor(x, onTitle, 'back again', 12000)));
  await harborUp(p); await harborUp(q); await sleep(800);
  // B2 — a start that dies: the stamp goes up (as the host's first write does), nobody prepares it (the host that stamped it is gone)
  const t0 = Date.now();
  await dbPatch(`rooms/${code}/meta`, { go: { at: { '.sv': 'timestamp' }, m: 'dead01', g: 'overclock' } });
  await waitFor(q, "!!document.querySelector('.rc-veil')", 'B: the veil up', 4000).catch(() => {});
  const said = await Promise.all([p, q].map(x => waitFor(x, `[...document.querySelectorAll('.toasts > *')].some(t => /START DIDN.T GO THROUGH/.test(t.textContent))`, 'the note', 12000).then(() => Date.now() - t0, () => null)));
  await sleep(600);
  const room = await ev(q, "({ go: window.__arcade.state.meta.go || null, status: window.__arcade.state.meta.status, veil: !!document.querySelector('.rc-veil'), title: !!document.querySelector('.title-screen:not(.screen-out)') })");
  ok(said.every(v => v != null) && !room.go && room.status === 'lobby' && !room.veil && room.title, `B2 — A START THAT DIES SAYS SO: THE START DIDN'T GO THROUGH on both phones (${said.join(' / ')} ms), the stamp down, the room back (${JSON.stringify(room)})`);
  ok(!errs.length, `no page error through the flows (B6: back to the room with OVERCLOCK's timers pending)${errs.length ? ` — ${errs.slice(0, 3).join(' | ')}` : ''}`);
  await A.ctx.close(); await B.ctx.close();
});

const RULES_URL = `${DBH}/.settings/rules.json?ns=${NS}`;
async function putRules(text) { const r = await fetch(RULES_URL, { method: 'PUT', headers: { Authorization: 'Bearer owner' }, body: text }); if (!r.ok) throw new Error(`rules PUT ${r.status}`); }
G('oldrules', async () => {
  const { readFileSync } = await import('node:fs');
  // (FR6 FIXES A — G6: the base is THE RULES AS PUBLISHED (tests/fixtures/rules-live.json — a pass that changes the rules runs this group
  //  on what the live database really has), minus LOBBY 2.0 B's three nodes: the standing proof that the show never needs a re-publish)
  const cur = readFileSync(new URL('../../../database.rules.json', import.meta.url), 'utf8');
  const R = JSON.parse(readFileSync(new URL('../../fixtures/rules-live.json', import.meta.url), 'utf8')), room = R.rules.rooms.$code;
  delete room.meta.go; delete room.meta.back; delete room.rv;   // (the live site's rules before 2B's re-publish)
  await putRules(JSON.stringify(R));
  try {
    const { Q: A, p, code, me } = await hostRoom('ora');
    const { Q: B, p: q } = await joinRoom('orb', code);
    await settledRoom(p, 2, 40000).catch(() => {}); await settledRoom(q, 2, 40000).catch(() => {});
    const refused = await ev(p, `import('/js/firebase.js').then(F => F.update(F.dbRef('rooms/${code}/meta'), { go: { at: F.serverTimestamp(), m: 'x', g: 'y' } }).then(() => 'written', e => String(e.message || e)))`);
    await startOC(p);
    const sign = await Promise.all([p, q].map(x => waitFor(x, "!!document.querySelector('.nd-sign.rc-go .rc-tonight')", 6000).then(() => true, () => false)));
    const walk = await Promise.all([p, q].map(x => waitFor(x, '(() => { const r = window.__district.room(); return !!(r && r.people.some(y => y.goIn)); })()', 4000).then(() => true, () => false)));
    // (FR6 FIXES A — G6: the refusal is REPORTED through the one write path — once per path shape, ids masked — never silent)
    const rep = await ev(p, "import('/js/firebase.js').then(F => F.refusals())");
    ok(rep.some(x => x.startsWith('update rooms/*/meta')) && !rep.some(x => x.includes(code)), `THE ONE WRITE PATH: the refused stamp was REPORTED to /admin (${rep.join(' · ')}) — no room code in it`);
    ok(/PERMISSION_DENIED/i.test(refused) && sign.every(Boolean) && walk.every(Boolean), `THE OLD RULES (meta/go refused: ${refused.slice(0, 30)}): THE GAME START still runs on BOTH phones — the sign + the game's logo (${sign}), the walk inside (${walk})`);
    await Promise.all([p, q].map(x => waitFor(x, `!(${onTitle})`, 'the game', 8000)));
    await podium(p, code, [me]);
    await sleep(600);
    await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
    await Promise.all([p, q].map(x => waitFor(x, onTitle, 'back', 12000)));
    await harborUp(p); await harborUp(q);
    const back = await ev(p, 'window.__arcade.state.meta.back || null');
    const out = await Promise.all([p, q].map(x => waitFor(x, '(() => { const r = window.__district.room(); return !!(r && r.people.some(y => (y.s && y.s.pose === "walk") || !y.s || y.inside)); })()', 6000).then(() => true, () => false)));
    const ban = await Promise.all([p, q].map(x => waitFor(x, '(() => { const r = window.__district.roomBanner && window.__district.roomBanner(); return !!(r && r.last && r.last.how); })()', 30000).then(() => ev(x, 'window.__district.roomBanner().last.how'), () => null)));
    ok(back === null && out.every(Boolean) && ban.every(h => h === 'flown'), `THE OLD RULES (meta/back refused: ${back === null}): THE WALK BACK OUT (${out}) + THE WINNER's BANNER PLANE (${ban.join(' / ')}) still run on both phones`);
    await A.ctx.close(); await B.ctx.close();
  } finally { await putRules(cur); }
});
