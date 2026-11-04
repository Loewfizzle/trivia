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
