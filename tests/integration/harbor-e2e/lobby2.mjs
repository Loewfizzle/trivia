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
export const topAt = p => ev(p, `(() => { const e = document.elementFromPoint(innerWidth / 2, innerHeight * 0.45); if (!e) return null; const L = e.closest('.vl-full, .vl-dress, .pfs, .pf-overlay, .pg-moment'); return L ? (L.classList.contains('pf-overlay') ? 'pf-overlay' : L.classList.contains('pfs') ? 'sheet:' + [...L.classList].filter(c => c !== 'pfs' && c !== 'is-in').join('.') : L.classList[0]) : 'none:' + e.className; })()`);

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
  for (const at of [350, 900, 1500, 1930]) { await waitFor(p, `window.__arcade.serverNow() - window.__arcade.state.meta.go.at >= ${at}`, 'the show at ' + at, 4000).catch(() => {});
    const r = await ev(p, "(() => { const r = window.__district.room(); return r ? r.people.map(x => ({ uid: x.uid, goIn: x.goIn, inside: x.inside || !x.s, pose: x.s && x.s.pose, z: x.s && x.s.z })) : null; })()");
    shots.push({ at, r }); if (SHOTS) await p.screenshot({ path: `${OUT}room2-start-${at}.png` }); }
  const first = shots[0].r || [], mid = shots[1].r || [];
  const host = mid.find(x => x.uid === me);
  ok(first.length === 5 && first.every(x => x.goIn) && host && host.pose === 'walk', `THE FILE-IN: all 5 on their way in (${first.filter(x => x.goIn).length}/5), the HOST first — walking to the door at 0.9 s (${host && host.pose})`);
  const gone = (shots[3].r || []).filter(x => x.inside).length;
  okT(gone >= 1, `…through the side door: by the push, ${gone} of 5 already inside (the rest go straight in with the cut)`);
  const routed = await Promise.all([p, q].map(x => waitFor(x, `!(${onTitle})`, 'the game screen', 4000).then(() => Date.now() - t0, () => null)));
  ok(routed.every((v, i) => v != null && v - seen[i] >= 1700 && v - seen[i] <= 2900), `…the view pushes through the door into the GAME on both phones ${routed.map((v, i) => v - seen[i]).join(' / ')} ms after the start showed there (2.6 s from the stamp; ≤ 3 s)`);
  const g = await ev(p, '({ s: window.__arcade.state.game.phaseStartAt, go: window.__arcade.state.meta.go.at })');
  ok(Math.abs(g.s - g.go - 2600) < 400, `THE GAME's OWN CLOCK starts after the walk inside (its first phase at the tap + ${g.s - g.go} ms)`);
  // a HOST CHANGE mid-start (the next one): B takes the room the moment the start begins — the start still ends in the game, the match runs
  await ev(p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(p, onTitle, 'A back on the city', 10000); await waitFor(q, onTitle, 'B back on the city', 10000);
  await sleep(1500);
  const t1 = Date.now(); await startOC(p);
  await waitFor(q, "!!document.querySelector('.nd-sign.rc-go')", 'B sees the start', 3000).catch(() => {});
  await dbPatch(`rooms/${code}/meta`, { hostId: meB });
  const r2 = await waitFor(q, `!(${onTitle})`, 'B in the game', 5000).then(() => Date.now() - t1, () => null);
  const ph0 = await ev(q, 'window.__arcade.state.game.phase');
  const adv = await waitFor(q, `window.__arcade.state.game.phase !== '${ph0}' || (window.__arcade.state.game.ci || 0) > 0`, 'the match moves on', 25000).then(() => true, () => false);
  ok(r2 != null && r2 < 3600 && adv, `A HOST CHANGE MID-START: the new host's phone still lands in the game (${r2} ms) and the match runs on from the room's data (${ph0} → moved on: ${adv})`);
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
  ok(ringA.w === 'REMATCH' && ringA.pips === 4 && ringA.lit === 0 && /REMATCH\s*VOTE/.test(ringB.w) && !ringB.wait, `THE REMATCH RING: the host's reads ${ringA.w} with ${ringA.pips} faint dots (one a guest); the guest's own ring reads "${ringB.w}" (not greyed)`);
  // the word FITS inside the ring (the real font)
  const fit = await ev(p, "(() => { const l = document.querySelector('.rdk-play .rdk-w1'), r = document.querySelector('.rdk-play').getBoundingClientRect(), b = l.getBoundingClientRect(); return { lw: Math.round(b.width), rw: Math.round(r.width), inside: b.left >= r.left + 6 && b.right <= r.right - 6 }; })()");
  ok(fit.inside, `…the word REMATCH FITS inside the ring in the real font (${fit.lw} of ${fit.rw} pt)`);
  // B votes: a dot lights in B's colour on BOTH phones, the pill, the 👍 over B
  await ev(q, "document.querySelector('.rdk-play').click()");
  await waitFor(p, "document.querySelectorAll('.rdk-pip.is-on').length === 1", 'a dot lit on A', 6000).catch(() => {});
  await dbPatch(`rooms/${code}/rv`, { [fakes[0]]: m });
  await waitFor(p, "document.querySelectorAll('.rdk-pip.is-on').length === 2", 'two dots', 6000).catch(() => {});
  await sleep(400);
  const v = await ev(p, `({ lit: document.querySelectorAll('.rdk-pip.is-on').length, pill: document.querySelector('.rdk-votes').hidden ? '' : document.querySelector('.rdk-votes').textContent, thumb: document.querySelector('.rc-tag[data-uid="${meB}"]').classList.contains('is-voted') })`);
  const vB = await ev(q, "({ w: document.querySelector('.rdk-play .nd-host-label').textContent, lit: document.querySelectorAll('.rdk-pip.is-on').length, pill: document.querySelector('.rdk-votes').textContent })");
  ok(v.lit === 2 && /2 of 5 want a rematch/.test(v.pill) && v.thumb && vB.lit === 2 && /✓ VOTED/.test(vB.w), `THE VOTES: 2 dots lit on both phones, "${v.pill}", a 👍 over the guest who voted (${v.thumb}); the guest's ring: "${vB.w}"`);
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
