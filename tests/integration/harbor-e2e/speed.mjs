// CITY 2.0 — THE HARBOR end to end: THE SPEED PASS (Nov 4 — docs/harbor/passes/speed.md — the owner's LOBBY FIXES notes + the phone's speed).
// Its own cloud job (`speed`).
//   staleroom — out of the room (a disconnect / a leave): the room's figures walk off the city, a host claim for that room never toasts,
//               ONE toast at a time (the newer replaces the older)
// ADDING A GROUP: G('name', …) here + the name in ../harbor-jobs.mjs (CI_JOBS.speed).
import { log, sleep, ok, okT, open, ev, waitFor, harborUp, G, OUT, SHOTS, ON_CI, skipCI, BASE, launchReal, closeReal } from './kit.mjs';
import { dbPatch, dbDel, dbGet, ROOMQ, hostRoom, joinRoom, fakeGuests, settledRoom, startOC, onTitle, podium } from './lobby2.mjs';

const people = p => ev(p, 'window.__district.roomPeople ? window.__district.roomPeople() : null');
const toastsNow = p => ev(p, "[...document.querySelectorAll('.toasts > .toast:not(.out)')].map(t => t.textContent)");

G('staleroom', async () => {
  // ---- a disconnect in the lobby: this phone's own node goes (the room keeps two guests) → the title, the figures walk off
  const A = await hostRoom('sra'), code = A.code;
  await fakeGuests(code, 2, 30000, 'sr');
  await settledRoom(A.p, 3, 30000).catch(() => {});
  const before = await people(A.p);
  await dbDel(`rooms/${code}/players/${A.me}`);
  await waitFor(A.p, '!window.__arcade.state.code', 'out of the room', 15000);
  await sleep(400);
  const t1 = await toastsNow(A.p);
  const t0 = Date.now(), seen = [];
  for (;;) {
    const q = await people(A.p) || [];
    seen.push({ t: Date.now() - t0, n: q.length, walk: q.filter(x => x.s && x.s.pose === 'walk').length, standing: q.filter(x => !x.leaving).length, ring: Math.max(0, ...q.map(x => x.ring)) });
    if (!q.length || Date.now() - t0 > 20000) break;
    await sleep(250);
  }
  const last = seen[seen.length - 1], walked = seen.some(x => x.walk > 0), ringLate = seen.filter(x => x.t > 500 && x.n && x.ring > 0).length;
  ok(before && before.length === 3 && last.n === 0 && walked && seen.every(x => x.standing === 0),
    `OUT OF THE ROOM (a disconnect): the room's ${before && before.length} figures walk off the city (walking seen ${walked}; gone after ${last.t} ms; none left standing)`);
  ok(seen.length > 4 && seen[0].n && ringLate === 0, `… as plain passers-by: their rings fade at once (${ringLate} samples with a ring after 0.5 s, of ${seen.length}; the first ${seen[0].ring})`);
  ok(t1.length === 1 && /DISCONNECTED/.test(t1[0]), `… ONE toast: "${t1.join(' | ')}"`);
  if (SHOTS) await A.p.screenshot({ path: `${OUT}staleroom-out.png` });
  await A.Q.ctx.close().catch(() => {});

  // ---- the owner's case: back on the city after a match (the walk back out still on), then disconnected
  const M = await hostRoom('srm'), codeM = M.code;
  await fakeGuests(codeM, 2, 30000, 'sm');
  await settledRoom(M.p, 3, 30000).catch(() => {});
  await startOC(M.p);
  await waitFor(M.p, `!(${onTitle})`, 'the game', 8000);
  await podium(M.p, codeM, [M.me]);
  await sleep(800);
  await ev(M.p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(M.p, onTitle, 'back on the city', 12000);
  await harborUp(M.p);
  await waitFor(M.p, '(() => { const r = window.__district.roomPeople(); return r && r.length === 3; })()', 'the room back on the city', 15000).catch(() => {});
  await sleep(1500);
  await dbDel(`rooms/${codeM}/players/${M.me}`);
  await waitFor(M.p, '!window.__arcade.state.code', 'out of the room', 15000);
  const tm = Date.now(); let qm = [];
  for (;;) { qm = await people(M.p) || []; if (!qm.length || Date.now() - tm > 25000) break; await sleep(300); }
  ok(!qm.length, `OUT OF THE ROOM right after a match (the walk back out): every figure gone from the city (${qm.length} left${qm.length ? ': ' + JSON.stringify(qm) : ''}; ${Date.now() - tm} ms)`);
  if (SHOTS) await M.p.screenshot({ path: `${OUT}staleroom-aftermatch.png` });
  await M.Q.ctx.close().catch(() => {});

  // ---- a host claim still in flight when the room is left: the claim's toast never fires for a room this phone is no longer in
  const B = await hostRoom('srb'), codeB = B.code;
  const [g] = await fakeGuests(codeB, 1, 60000, 'sh');
  // (the host is the fake guest now, its beat long stale + no connection: this phone may claim — its own loop held, the claim fired by hand)
  await dbPatch(`rooms/${codeB}/meta`, { hostId: g, hostBeat: Date.now() - 60000 });
  await dbPatch(`rooms/${codeB}/presence/${g}`, { online: false, c: null, lastSeen: Date.now() - 60000 });
  await ev(B.p, 'window.__arcade.state.dupTab = true');   // (the host loop idles: identity.js's duplicate-tab switch)
  await sleep(600);
  const claim = await ev(B.p, `import('/js/host.js').then(async m => { const room = await import('/js/room.js'); const pr = m.claimHost('${g}'); room.exitRoom('YOU WERE DISCONNECTED FROM THE ROOM'); await pr; return 1; }).catch(e => 'err ' + e.message)`);
  await sleep(1200);
  await ev(B.p, 'window.__arcade.state.dupTab = false');
  const t2 = await toastsNow(B.p), host = await dbGet(`rooms/${codeB}/meta/hostId`);
  ok(claim === 1 && t2.length === 1 && /DISCONNECTED/.test(t2[0]) && !t2.some(x => /NOW THE HOST/.test(x)),
    `A STALE HOST CLAIM: no "YOU ARE NOW THE HOST" for a room this phone left (toasts: "${t2.join(' | ')}"; the claim ${claim}, host after ${host === B.me ? 'this phone (its node goes with a real disconnect — the others claim)' : host})`);
  // ---- one at a time: a newer toast replaces the older
  await ev(B.p, "import('/js/ui/toast.js').then(m => { m.toast('FIRST', 'info', 4000); m.toast('SECOND', 'warn', 4000); return 1; })");
  await sleep(450);
  const t3 = await toastsNow(B.p);
  ok(t3.length === 1 && /SECOND/.test(t3[0]), `ONE TOAST AT A TIME: the newer replaces the older ("${t3.join(' | ')}")`);
  await B.Q.ctx.close().catch(() => {});
  log('staleroom', 'done');
});

// THE CARD OPENS ON YOURS (the owner, Nov 4 5:55 pm: tapping YOU showed a DIFFERENT card first, then swapped to his own): this device's saved
// profile wears a full card → the first card painted on the YOU page is THAT card (or the blank card shape while it loads) — never the Gilded
G('youcard', async () => {
  const A = await hostRoom('ycd', [402, 874], { qs: `${ROOMQ}&labmarks=all` });
  await waitFor(A.p, "(() => { try { const m = JSON.parse(localStorage.getItem('na:ycd:me') || 'null'); return !!(m && m.pid); } catch { return false; } })()", 'the profile', 20000);
  const me = await ev(A.p, "JSON.parse(localStorage.getItem('na:ycd:me'))");
  const cd = 'card-dev-switchboard';   // (a DEV card: always approved — vault/approved.js — so its full card shows on the emulators)
  await dbPatch(`profiles/${me.pid}`, { cd });
  await ev(A.p, `(() => { const m = JSON.parse(localStorage.getItem('na:ycd:me')); m.profile = { ...(m.profile || {}), cd: '${cd}' }; localStorage.setItem('na:ycd:me', JSON.stringify(m)); return 1; })()`);
  await ev(A.p, `(() => { window.__cards = []; new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1 && n.parentElement && n.parentElement.classList.contains('pf-card-slot')) window.__cards.push((n.className || '').split(' ')[0] + ':' + (n.dataset.card || '')); }).observe(document.body, { childList: true, subtree: true }); return 1; })()`);
  await ev(A.p, "document.querySelector('.rdk-you').click()");
  await waitFor(A.p, `!!document.querySelector('.pf-card-slot .vl-fc[data-card="${cd}"]')`, 'the full card', 15000).catch(() => {});
  await sleep(2500);   // (the server's answer lands: the same card must stay — no second card painted)
  const seq = await ev(A.p, 'window.__cards'), now = await ev(A.p, `(document.querySelector('.pf-card-slot .vl-fc') || {}).className || ''`);
  ok(seq.length >= 1 && (seq[0] === `pf-card-blank:${cd}` || seq[0] === `vl-fc:${cd}`) && !seq.some(x => /^pg-card/.test(x)) && /vl-fc/.test(now),
    `THE CARD OPENS ON YOURS: the YOU page's first card is the equipped ${cd} (painted: ${seq.join(' → ')}); never the Gilded first`);
  ok(seq.filter(x => /^vl-fc/.test(x)).length === 1, `… mounted ONCE — the server's answer doesn't repaint the same card (${seq.filter(x => /^vl-fc/.test(x)).length})`);
  ok(!(await ev(A.p, "!!document.querySelector('.pf-pen')")), '… no ✎ beside the name on the card (EDIT USERNAME in CUSTOMIZE is the one way in)');
  // (THE HOTFIX — the owner's live iPhone: with a NON-Gilded card the YOU page was UNSTYLED — css/progress.css + vault.css loaded only through
  //  the Gilded card's own builder. A fresh tab, his kind of card: the level bar, the goal, the stats + ACCOUNT carry their computed styles)
  await waitFor(A.p, "!!document.querySelector('.pf-overlay .pg-bar') && !!document.querySelector('.pf-overlay .pg-stats') && !!document.querySelector('.pf-overlay .pf-account .pf-gb')", 'the sections', 15000).catch(() => {});
  await sleep(600);
  const sty = await ev(A.p, `(() => { const g = s => document.querySelector('.pf-overlay ' + s), cs = s => g(s) ? getComputedStyle(g(s)) : null;
    const bar = cs('.pg-bar'), goal = cs('.pf-goal-t'), stats = cs('.pg-stats'), btn = cs('.pf-account .pf-gb');
    return { bar: bar && bar.height + ' ' + bar.borderRadius, goal: goal ? goal.borderRadius : 'none', stats: stats && stats.display, btn: btn && btn.borderRadius + ' ' + btn.minHeight,
      sheets: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.href.split('/').pop()).filter(x => /progress|vault/.test(x)) }; })()`);
  ok(sty.bar && !/^0px|\s0px$/.test(sty.bar) && sty.stats === 'grid' && sty.btn === '14px 46px' && (sty.goal === '18px' || sty.goal === 'none') && sty.sheets.length >= 2,
    `THE YOU PAGE STYLED with a non-Gilded card (a fresh tab, 402): the level bar ${sty.bar}, the goal ${sty.goal}, the stats ${sty.stats}, ACCOUNT's buttons ${sty.btn} (sheets: ${sty.sheets.join(', ')})`);
  if (SHOTS) await A.p.screenshot({ path: `${OUT}youcard.png` });
  await A.Q.ctx.close().catch(() => {});
});

// THE GUEST's RING (the owner, Nov 4 6:28 pm: "WAITING FOR LOEWFIZZLE" didn't fit): WAITING / FOR HOST, two lines inside the ring, never the name
G('guestring', async () => {
  const H = await hostRoom('grh');
  await dbPatch(`rooms/${H.code}/players/${H.me}`, { name: 'LOEWFIZZLE12' });
  for (const w of [390, 402, 430]) {
    const G2 = await joinRoom(`gr${w}`, H.code, [w, 844]);
    await sleep(800);
    const r = await ev(G2.p, `(() => { const ring = document.querySelector('.rdk-play .nd-hring').getBoundingClientRect(), cx = ring.left + ring.width / 2, cy = ring.top + ring.height / 2, inner = ring.width * 0.62;
      const box = s => { const b = document.querySelector(s).getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width }; };
      const a = box('.rdk-play .rdk-w1'), b = box('.rdk-play .rdk-w2'), ins = q => q.w > 0 && q.l >= cx - inner / 2 && q.r <= cx + inner / 2 && q.t >= cy - inner / 2 && q.b <= cy + inner / 2;
      return { w1: document.querySelector('.rdk-play .rdk-w1').textContent, w2: document.querySelector('.rdk-play .rdk-w2').textContent, inside: ins(a) && ins(b), two: b.t >= a.b - 1, text: document.querySelector('.rdk-play').textContent, inner: Math.round(inner), widest: Math.round(Math.max(a.w, b.w)) }; })()`);
    ok(r.w1 === 'WAITING' && r.w2 === 'FOR HOST' && r.inside && r.two && !/LOEWFIZZLE/.test(r.text),
      `THE GUEST's RING at ${w}: "${r.w1} / ${r.w2}" — two lines inside the ring (${r.widest} pt in its ${r.inner} pt inner circle), never the host's name`);
    if (SHOTS && w === 402) await G2.p.screenshot({ path: `${OUT}guestring-402.png` });
    await G2.Q.ctx.close().catch(() => {});
  }
  await H.Q.ctx.close().catch(() => {});
});

// THE BANNER PLANE FLIES HIGHER (the owner, Nov 4 6:17 pm: after a match the banner crossed the towers + the NEON PAR / HIGH STAKES signs,
// "…EERS TO LOEWFIZZLE" hard to read): the winner's banner, sampled through its crossing, stays in the open sky — its box clear of the
// skyline's tops (the crowns, the spires, the roof signs) at every sample; 390 / 402 / 430 + 1440 × 900
export async function bannerSky(view, slot, o = {}) {
  const A = await hostRoom(slot, view);
  await fakeGuests(A.code, 2, 30000, `${slot}g`);
  await settledRoom(A.p, 3, 30000).catch(() => {});
  await startOC(A.p);
  await waitFor(A.p, `!(${onTitle})`, 'the game', 8000);
  await podium(A.p, A.code, [A.me]);
  await sleep(800);
  await ev(A.p, "import('/js/host.js').then(m => m.backToLobby())");
  await waitFor(A.p, onTitle, 'back on the city', 12000);
  await harborUp(A.p);
  await waitFor(A.p, '(() => { const s = window.__district.harbor().sky.state; return !!(s && s.banner && s.banner.box); })()', 'the banner flying', 30000).catch(() => {});
  const S = [];
  for (let i = 0; i < 40; i++) {
    const r = await ev(A.p, `(() => { const H = window.__district.harbor(), b = H.sky.state.banner, f = H.skyFloor, tr = H.textRects; if (!b || !b.box || !f) return null;
      const x0 = Math.max(0, b.box.x0), x1 = Math.min(innerWidth, b.box.x1); if (x1 - x0 < 20) return { off: true };
      let floor = 1e9; for (let c = Math.floor(x0 / 4); c <= Math.ceil(x1 / 4) && c < f.length; c++) floor = Math.min(floor, f[c]);
      return { y0: Math.round(b.box.y0), y1: Math.round(b.box.y1), floor, word: tr && tr.word ? Math.round(tr.word.y + tr.word.h) : null }; })()`);
    if (r && !r.off) S.push(r);
    if (o.shot && i === 14 && SHOTS) await A.p.screenshot({ path: `${OUT}bannersky-${view[0]}.png` });
    await sleep(450);
  }
  await A.Q.ctx.close().catch(() => {});
  return S;
}
G('bannersky', async () => {
  for (const [view, slot] of [[[390, 844], 'bs390'], [[402, 874], 'bs402'], [[430, 932], 'bs430'], [[1440, 900], 'bs1440']]) {
    const S = await bannerSky(view, slot, { shot: true });
    const worst = S.length ? Math.min(...S.map(x => x.floor - x.y1)) : null;
    ok(S.length >= 10 && worst >= 4, `THE BANNER PLANE IN THE OPEN SKY (${view[0]}×${view[1]}, after a match): its box clears the skyline's tops on all ${S.length} samples (the closest ${worst} pt above a crown / spire / roof sign; the banner ${S[0] ? `${S[0].y0}–${S[0].y1}` : '—'}, SPEAKEASY's foot ${S[0] ? S[0].word : '—'})`);
  }
});

// FR6 A7 — THE PARTY IN A ROOM (review-6.md A1's missing row): a PREVIEW link keeps its clock + flags in a room (&when= / &force= / &lgnow=),
// so the room is measured on a SATURDAY 22:15 PARTY with a legendary in the sky: 8 in the lines + the guest list's 8 LEGENDARY strips open.
// The rule half is hard (the party on, the legendary up, 8 strips); the speed is the mini PC's (the 2-core runner has no GPU path: skipped)
export const PARTY_Q = `when=2026-11-07T22:15&tz=America/Detroit&at=42.96,-85.67&wx=clear&force=party,ufo&lgnow=1&labmarks=all`;
export async function partyRoom(o = {}) {
  const A = await open({ slot: o.slot || 'prt', qs: PARTY_Q, view: [402, 874], dpr: 3, real: true }), p = A.page;
  await harborUp(p); await sleep(1500);
  await ev(p, "document.querySelector('.nd-hostbtn').click()");
  await waitFor(p, 'window.__arcade.state.code && window.__district.room()', 'hosted', 20000);
  const code = await ev(p, 'window.__arcade.state.code'), me = await ev(p, 'window.__arcade.state.uid');
  await waitFor(p, "(() => { try { const m = JSON.parse(localStorage.getItem('na:' + new URLSearchParams(location.search).get('slot') + ':me') || 'null'); return !!(m && m.pid); } catch { return false; } })()", 'the profile', 20000).catch(() => {});
  const myPid = await ev(p, "(() => { try { return JSON.parse(localStorage.getItem('na:' + new URLSearchParams(location.search).get('slot') + ':me')).pid; } catch { return null; } })()");
  if (myPid) await dbPatch(`profiles/${myPid}`, { cd: 'card-sg-ufo' });
  const now = Date.now(), players = {}, presence = {}, profiles = {}, az = 'abcdefghjkmnpqrstuvwxyz';
  for (let i = 0; i < 7; i++) {
    const u = `pr${i}`, pid = `ppartyroom${az[i]}${az[i + 3]}`;
    players[u] = { name: `P${i}`, color: ['cyan', 'yellow', 'green', 'orange', 'violet', 'red', 'blue'][i], avatar: 'star', joinedAt: now + 200 * i, ln: i % 2 ? 'L' : 'R', pid };
    presence[u] = { online: true, lastSeen: now, v: 2, c: { [`k${i}`]: true } };
    profiles[pid] = { n: `P${i}`, nk: `p${i}`, t: String(2000 + i), a: 'star', c: 'cyan', x: 5000, at: now - 86400000, cd: 'card-sg-ufo', m: 5 };
  }
  await dbPatch('profiles', profiles); await dbPatch(`rooms/${code}/players`, players); await dbPatch(`rooms/${code}/presence`, presence);
  await waitFor(p, '(() => { const r = window.__district.room(); return r && r.people.length === 8 && r.people.every(x => x.s && x.s.pose === "wait"); })()', 'settled', 60000).catch(() => {});
  await ev(p, "document.querySelector('.rdk-guests').click()");
  await waitFor(p, "document.querySelectorAll('.vl-strip[data-card=\"card-sg-ufo\"]').length >= 8", 'the 8 legendary strips', 15000).catch(() => {});
  await sleep(2500);
  const st = await ev(p, `(() => { const H = window.__district.harbor(), pt = window.__district.party(), L = H.legend && H.legend.state; return { party: !!(pt && pt.on), legend: !!(L && L.run), kind: L && L.run ? L.run.kind || String(L.run) : null, strips: document.querySelectorAll('.vl-strip[data-card="card-sg-ufo"]').length, when: new URLSearchParams(location.search).get('when'), force: new URLSearchParams(location.search).get('force') }; })()`);
  const fps = ms => ev(p, `new Promise(res => { const g = []; let l = 0; const t0 = performance.now(); const f = t => { if (l) g.push(t - l); l = t; if (t - t0 < ${ms}) requestAnimationFrame(f); else res({ fps: +(1000 / (g.reduce((a, b) => a + b, 0) / g.length)).toFixed(1), slow: g.filter(x => x > 20).length, n: g.length }); }; requestAnimationFrame(f); })`);
  const f1 = await fps(4000);
  const cdp = await p.target().createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 2 }); await sleep(2000);
  const f2 = await fps(4000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const cost = await ev(p, '(() => { const c = window.__district.cost().slice().sort((a, b) => a - b); return { med: +c[Math.floor(c.length / 2)].toFixed(2), p95: +c[Math.floor(c.length * 0.95)].toFixed(2) }; })()');
  if (SHOTS) await p.screenshot({ path: `${OUT}partyroom.png` });
  await A.ctx.close();
  const k = await import('./kit.mjs'); await k.closeReal().catch(() => {});
  return { st, f1, f2, cost };
}
G('partyroom', async () => {
  const { st, f1, f2, cost } = await partyRoom();
  ok(st.when && /party/.test(st.force || '') && st.party && st.legend && st.strips >= 8, `A7 — A PREVIEW LINK KEEPS ITS CLOCK + FLAGS IN A ROOM: the room's address keeps when=${st.when} force=${st.force}; THE PARTY on (${st.party}), the legendary up (${st.kind}), the guest list's ${st.strips} legendary strips`);
  log('partyroom', `THE PARTY ROOM (A1's missing row): 1× ${f1.fps} fps (${f1.slow}/${f1.n} slow) · 2× ${f2.fps} fps (${f2.slow}/${f2.n} slow) · the city's frame work median ${cost.med} ms, p95 ${cost.p95}`);
  const what = `THE PARTY ROOM at 1× (8 in the lines + the party + a legendary + 8 legendary strips): ${f1.fps} fps (${f1.slow} slow); at 2× CPU ${f2.fps} fps; the city's work median ${cost.med} ms`;
  if (ON_CI) skipCI(what, 'no GPU path on the 2-core runner — the mini PC + the owner\u2019s iPhone measure it');
  else okT(f1.fps >= 55, what);
});

// ================================================================ THE SPEED PASS B — Group 0: THE OWNER's FOUR (docs/harbor/passes/speed-b.md)
// THE LEAVER DOUBLES (the owner, Nov 4 10:21 pm — his laptop): after LEAVE, on the LEAVER's OWN screen two identical figures waved + walked
// off. Every figure the near pass DRAWS is counted, frame by frame, on the leaver's screen (a desktop + a phone) and on the host's — the
// leaver's look (his room seed) must be drawn ONCE at most, through the whole walk-off; a drop (the socket gone) the same on the host's.
const drawnNow = p => ev(p, 'window.__district.drawnNow ? window.__district.drawnNow() : null');
async function countLeaver(p, uid, ms) {
  // (in the page, every frame: how many drawn figures carry the leaver's room vid or his room seed)
  await ev(p, `(() => { window.__lv = []; const u = ${JSON.stringify(uid)}; const t0 = performance.now(); let seed = null;
    const r0 = (window.__district.drawnNow() || []).find(m => m.room === u); if (r0) seed = r0.seed; window.__lvSeed = seed;
    const tick = () => { const d = window.__district.drawnNow() || []; if (seed == null) { const r1 = d.find(m => m.room === u); if (r1) seed = window.__lvSeed = r1.seed; } const mine = d.filter(m => m.room === u || (seed != null && m.seed === seed));
      window.__lv.push({ t: Math.round(performance.now() - t0), n: mine.length, vids: mine.map(m => m.vid + ':' + m.pose).join(','), waves: d.filter(m => m.room && m.pose === 'wave').length, room: d.filter(m => m.room).length });
      if (performance.now() - t0 < ${ms}) requestAnimationFrame(tick); }; requestAnimationFrame(tick); return seed; })()`);
}
G('leaver', async () => {
  for (const [view, slot] of [[[1440, 900], 'lvd'], [[402, 874], 'lvp']]) {
    const H = await hostRoom(`${slot}h`);
    const N = await joinRoom(`${slot}n`, H.code, view);
    await settledRoom(N.p, 2, 30000).catch(() => {});
    await settledRoom(H.p, 2, 30000).catch(() => {});
    await sleep(700);
    await countLeaver(N.p, N.me, 13000); await countLeaver(H.p, N.me, 13000);
    await ev(N.p, "(() => { import('/js/room.js').then(m => m.leaveRoom()); return 1; })()");
    await sleep(500);
    const tl = await toastsNow(N.p);
    await sleep(12900);
    const sN = await ev(N.p, 'window.__lv') || [], mostWave = Math.max(0, ...sN.map(x => x.waves));
    ok(!tl.some(x => /DISCONNECTED/.test(x)) && mostWave === 1, `A LEAVE IS A LEAVE (${view[0]}×${view[1]}, the leaver's screen): no "DISCONNECTED" (toasts: "${tl.join(' | ')}"); ONE figure waves goodbye — yours (most waving at once ${mostWave}); the host's figure carries on inside`);
    for (const [who, P] of [['the leaver\'s own screen', N.p], ['the host\'s screen', H.p]]) {
      const s = await ev(P, 'window.__lv') || [], seed = await ev(P, 'window.__lvSeed'), max = Math.max(0, ...s.map(x => x.n)), two = s.filter(x => x.n > 1);
      ok(seed != null && s.length > 60 && max === 1 && s.some(x => x.n === 1) && !s[s.length - 1].n,
        `THE LEAVER ONCE (${view[0]}×${view[1]}, ${who}): ONE figure through the wave + the walk-off (most drawn at once ${max}; ${two.length} of ${s.length} frames doubled${two.length ? ' e.g. ' + two[0].vids : ''}; gone at the end ${!s[s.length - 1].n})`);
    }
    if (SHOTS) await N.p.screenshot({ path: `${OUT}leaver-${view[0]}.png` });
    for (const X of [H.Q, N.Q]) await X.ctx.close().catch(() => {});
  }
  // ---- a DROP (the socket gone, never a leave): the host's screen — the lie-down then the leave once the node goes, one figure
  const H = await hostRoom('lvxh');
  const N = await joinRoom('lvxn', H.code);
  await settledRoom(H.p, 2, 30000).catch(() => {});
  await sleep(700);
  await countLeaver(H.p, N.me, 12000);
  await N.Q.ctx.close().catch(() => {});
  await dbDel(`rooms/${H.code}/players/${N.me}`);
  await sleep(12400);
  const s = await ev(H.p, 'window.__lv') || [], seed = await ev(H.p, 'window.__lvSeed'), max = Math.max(0, ...s.map(x => x.n));
  ok(seed != null && s.length > 40 && max === 1, `THE LEAVER ONCE (a drop, the host's screen): one figure (most at once ${max} of ${s.length} frames)`);
  await H.Q.ctx.close().catch(() => {});
});

// THE HOST LEAVES ON PURPOSE (the owner, Nov 4 10:21 pm — LEAVE, not a drop): the next player in join order is the host at once; ONE toast on
// each phone (the heir "YOU'RE THE HOST NOW", the other "<HEIR> IS THE HOST NOW"); the PLAY ring moves to the heir. Three slots.
const toastLog = async (p, ms) => { await ev(p, `(() => { window.__tl = new Set(); const t0 = performance.now(); const f = () => { for (const t of document.querySelectorAll('.toasts > .toast')) window.__tl.add(t.textContent); if (performance.now() - t0 < ${ms}) setTimeout(f, 100); }; f(); return 1; })()`); };
const ringWord = p => ev(p, "(() => { const w = document.querySelector('.rdk-w1'); return w ? w.textContent : null; })()");
G('hostleave', async () => {
  const H = await hostRoom('hlh');
  const A = await joinRoom('hla', H.code);
  await sleep(400);
  const B = await joinRoom('hlb', H.code);
  await settledRoom(B.p, 3, 30000).catch(() => {});
  await sleep(800);
  const nameA = await ev(A.p, `window.__arcade.state.players[window.__arcade.state.uid].name`);
  for (const X of [A, B]) await toastLog(X.p, 7000);
  const t0 = Date.now();
  await ev(H.p, "(() => { import('/js/room.js').then(m => m.leaveRoom()); return 1; })()");
  await waitFor(A.p, `window.__arcade.state.meta && window.__arcade.state.meta.hostId === window.__arcade.state.uid`, 'the heir is the host', 8000).catch(() => {});
  const dt = Date.now() - t0;
  await sleep(7200);
  const [ta, tb] = [await ev(A.p, '[...window.__tl]'), await ev(B.p, '[...window.__tl]')];
  const host = await dbGet(`rooms/${H.code}/meta/hostId`), gone = !(await dbGet(`rooms/${H.code}/players/${H.me}`));
  ok(host === A.me && gone && dt < 3000, `THE HOST LEAVES ON PURPOSE: the next in join order is the host (${host === A.me ? 'the first guest' : host}) in ${dt} ms; the old host's node gone ${gone}`);
  ok(ta.length === 1 && /YOU.RE THE HOST NOW/.test(ta[0]), `… ONE toast on the heir's phone: "${ta.join(' | ')}"`);
  ok(tb.length === 1 && tb[0].includes(`${String(nameA).toUpperCase()} IS THE HOST NOW`), `… ONE toast on the other phone: "${tb.join(' | ')}" (the heir ${nameA})`);
  const [ra, rb] = [await ringWord(A.p), await ringWord(B.p)];
  ok(ra === 'PLAY' && rb === 'WAITING', `… the PLAY ring moved to the heir (the heir's ring ${ra}; the other's ${rb})`);
  if (SHOTS) await A.p.screenshot({ path: `${OUT}hostleave-heir.png` });
  // ---- a DROP of the host (not a leave): no "IS THE HOST NOW" on the bystander (only the claimer's own line)
  await toastLog(B.p, 36000);
  await A.Q.ctx.close().catch(() => {});
  await sleep(2500);   // (the closed tab's own onDisconnect lands first — then the host's presence + beat made stale)
  await dbPatch(`rooms/${H.code}/presence/${A.me}`, { online: false, c: null, lastSeen: Date.now() - 60000 });
  await dbPatch(`rooms/${H.code}/meta`, { hostBeat: Date.now() - 60000 });
  { const end = Date.now() + 30000; while (Date.now() < end && (await dbGet(`rooms/${H.code}/meta/hostId`)) !== B.me) await sleep(300); }
  await sleep(1500);
  const tc = await ev(B.p, '[...window.__tl]'), hostB = await dbGet(`rooms/${H.code}/meta/hostId`);
  ok(hostB === B.me && tc.length === 1 && /HOST SIGNAL LOST/.test(tc[0]), `… a DROPPED host is still a claim: ONE toast "${tc.join(' | ')}" (host ${hostB === B.me ? 'the claimer' : hostB})`);
  for (const X of [H.Q, B.Q]) await X.ctx.close().catch(() => {});
});

// THE FULL CARD PREVIEW LAGS (the owner, Nov 4 8:05 pm — CUSTOMIZE → VIEW FULL on SKY KING: the slim preview's code rain + the grid's
// animated thumbnails kept running under the dim layer). Measured the same way before + after: 4× CPU, the real compositor, 402×874 @3 —
// SKY KING's full card over CUSTOMIZE (wearing THE SOURCE, the dev card's code rain) vs the same card with CUSTOMIZE taken away. Then the
// rule: while a full card is on top EVERYTHING behind it holds still (no fx slot behind drawn, every CSS animation behind paused), resumed
// on CLOSE; the backdrop ≥ 88 % dark; no backdrop-filter behind it.
const FC_URL = '/tests/integration/progress-preview.html?view=profile&labmarks=all&dev=1&dress=1&card=card-dev-source';
const fcFrames = (p, n = 240) => ev(p, `new Promise(res => { const t = []; let last = 0; const f = x => { if (last) t.push(x - last); last = x; if (t.length < ${n}) requestAnimationFrame(f); else res(t); }; requestAnimationFrame(f); })`);
const fcStat = t => { const s = [...t].sort((a, b) => a - b); return { med: +s[s.length >> 1].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), slow: s.filter(x => x > 20).length, n: s.length }; };
// what moves BEHIND the full card: fx slots drawn last frame outside it + running CSS animations outside it
const behindNow = p => ev(p, `(async () => { const R = await import('/js/fx/renderer.js'); const full = document.querySelector('.vl-full');
  const anim = document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.target && !(full && full.contains(a.effect.target))).length;
  const bf = [...document.querySelectorAll('body *')].filter(e => !(full && (full.contains(e) || e === full)) && e.offsetParent !== null && (getComputedStyle(e).backdropFilter || 'none') !== 'none').length;
  return { slotsBehind: R.fxBehind ? R.fxBehind() : -1, anim, bf, bg: full ? getComputedStyle(full).backgroundColor : null }; })()`);
G('fullcard', async () => {
  const ctx = await (await launchReal()).createBrowserContext(), p = await ctx.newPage();
  await p.setViewport({ width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await p.goto(`${BASE}${FC_URL}`);
  await waitFor(p, `!!document.querySelector('.vl-dress .vl-dt')`, 'CUSTOMIZE', 20000);
  await sleep(1500);
  const cd = await p.target().createCDPSession(); await cd.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const openIt = () => ev(p, `import('/js/vault/full.js').then(m => m.openFullCard('card-sg-blackbird', { name: 'TESTER', avatar: 'diamond', color: 'magenta' })).then(() => 1)`);
  await openIt(); await sleep(2500);
  const b0 = await behindNow(p);
  const over = fcStat(await fcFrames(p));
  if (SHOTS) await p.screenshot({ path: `${OUT}fullcard-over-customize.png` });
  // the same card, CUSTOMIZE taken away (display none) — the full card alone
  await ev(p, `(() => { const d = document.querySelector('.vl-dress'); (d.closest('.modal, .vl-dress-wrap') || d).style.display = 'none'; return 1; })()`);
  await sleep(1500);
  const alone = fcStat(await fcFrames(p));
  log('fullcard', JSON.stringify({ over, alone, behind: b0 }));
  okT(over.med <= alone.med + 1.5 && over.slow <= alone.slow + 12, `THE FULL CARD over CUSTOMIZE (4× CPU, 402 @3, SKY KING over THE SOURCE's code rain): median ${over.med} ms / p95 ${over.p95} / ${over.slow} of ${over.n} slow — vs ALONE ${alone.med} / ${alone.p95} / ${alone.slow} slow (what's behind costs ~nothing)`);
  const alpha = (b0.bg || '').match(/rgba\([^)]*,\s*([\d.]+)\)/);
  ok(b0.slotsBehind === 0 && b0.anim === 0 && b0.bf === 0 && alpha && +alpha[1] >= 0.88,
    `… EVERYTHING BEHIND IT HOLDS STILL: ${b0.slotsBehind} fx slots drawn behind, ${b0.anim} CSS animations running behind, ${b0.bf} backdrop-filters behind; the backdrop ${b0.bg}`);
  // CLOSE: everything behind moves again
  await ev(p, `(() => { const d = document.querySelector('.vl-dress'); (d.closest('.modal, .vl-dress-wrap') || d).style.display = ''; document.querySelector('.vl-full-x').click(); return 1; })()`);
  await sleep(1200);
  const b1 = await ev(p, `(async () => { const R = await import('/js/fx/renderer.js'); return { slots: R.fxStats.slots, anim: document.getAnimations().filter(a => a.playState === 'running').length }; })()`);
  ok(b1.slots > 0 && b1.anim > 0, `… on CLOSE everything behind moves again (${b1.slots} fx slots drawn, ${b1.anim} CSS animations running)`);
  await ctx.close(); await closeReal();
});

// MULTIPLE TABS (the owner, Nov 4 8:56 pm): the HOST with a SECOND TAB of the same player open — in the room + mid-match: ONE director
// (only one tab writes the beat + the steps; the other stays quiet), the tab ON SCREEN is the one that acts (a hidden one goes quiet until
// shown), and ONE song (the quiet tab's music off for that page only). Two pages of one slot in one browser context.
const setVis = (p, vis) => ev(p, `(() => { Object.defineProperty(document, 'hidden', { value: ${!vis}, configurable: true }); Object.defineProperty(document, 'visibilityState', { value: '${vis ? 'visible' : 'hidden'}', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); return 1; })()`);
const tabNow = p => ev(p, `(async () => { const H = await import('/js/host.js'), S = await import('/js/audio/settings.js'); return { beats: H.hostStats.beats, steps: H.hostStats.steps, dup: !!window.__arcade.state.dupTab, quiet: S.pageQuiet(), musicOff: !!S.settings.musicOff, code: window.__arcade.state.code }; })()`);
async function writesOver(P, ms) { const a = await Promise.all(P.map(tabNow)); await sleep(ms); const b = await Promise.all(P.map(tabNow)); return b.map((x, i) => ({ ...x, w: x.beats - a[i].beats + x.steps - a[i].steps, st: x.steps - a[i].steps })); }
G('twotabs', async () => {
  const H = await hostRoom('ttb');
  await fakeGuests(H.code, 1, 30000, 'tt');
  await sleep(800);
  // ---- the second tab: the same player (the same slot, the same browser), back into the same room
  const p2 = await H.Q.ctx.newPage();
  await p2.setViewport({ width: 402, height: 874, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p2.goto(`${BASE}/?emu&slot=ttb&${ROOMQ}&city=2`);
  await waitFor(p2, `window.__arcade && window.__arcade.state.code === '${H.code}'`, 'the 2nd tab in the room', 25000);
  await sleep(3500);
  // (both "on screen" (headless): the older tab plays, the second yields — the room)
  let r = await writesOver([H.p, p2], 5000);
  // (headless puts the first page in the background when the second opens: the one ON SCREEN plays — either way exactly ONE)
  const act = r.findIndex(x => !x.dup), quiet = 1 - act;
  ok(act >= 0 && r[act].w > 0 && r[quiet].w === 0 && r[quiet].dup && r[quiet].quiet && r[quiet].musicOff && !r[act].musicOff,
    `TWO TABS in the room: ONE acts — tab ${act + 1} (${r[act] && r[act].w} host writes), tab ${quiet + 1} ${r[quiet] && r[quiet].w} (yielded ${r[quiet] && r[quiet].dup}); ONE song — the quiet tab's music off for that page (${r[quiet] && r[quiet].musicOff}), the other's on`);
  // ---- mid-match: the second tab brought ON SCREEN, the first hidden → the second acts, the first quiet
  await startOC(H.p);
  await waitFor(H.p, `window.__arcade.state.meta && window.__arcade.state.meta.status === 'playing'`, 'the match', 15000).catch(() => {});
  await sleep(2500);
  await setVis(H.p, false); await setVis(p2, true);
  await sleep(1500);
  r = await writesOver([H.p, p2], 6000);
  ok(r[1].w > 0 && r[0].w === 0 && r[0].dup && !r[1].dup && r[0].musicOff && !r[1].musicOff,
    `TWO TABS mid-match, the second ON SCREEN: it directs (${r[1].w} writes, ${r[1].st} steps), the hidden first is quiet (${r[0].w} writes, yielded ${r[0].dup}, music off ${r[0].musicOff})`);
  // ---- back to the first tab: it acts again, the second goes quiet; the match still runs on one director
  await setVis(p2, false); await setVis(H.p, true);
  await sleep(1500);
  r = await writesOver([H.p, p2], 6000);
  const g = await ev(H.p, 'window.__arcade.state.game && window.__arcade.state.game.phase');
  ok(r[0].w > 0 && r[1].w === 0 && !r[0].dup && r[1].dup && r[1].musicOff && !r[0].musicOff && !!g,
    `… shown again, the first tab acts (${r[0].w} writes), the second quiet (${r[1].w}); the match goes on (phase ${g})`);
  // ---- the device's own music choice is never overwritten by the quiet tab
  const saved = await ev(p2, `JSON.parse(localStorage.getItem('na:settings') || '{}').musicOff || false`);
  ok(saved === false, `… the quiet tab never saves "music off" for the device (saved musicOff ${saved})`);
  await p2.close().catch(() => {});
  await H.Q.ctx.close().catch(() => {});
});
