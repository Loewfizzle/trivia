// CITY 2.0 — THE HARBOR end to end: THE SPEED PASS (Nov 4 — docs/harbor/passes/speed.md — the owner's LOBBY FIXES notes + the phone's speed).
// Its own cloud job (`speed`).
//   staleroom — out of the room (a disconnect / a leave): the room's figures walk off the city, a host claim for that room never toasts,
//               ONE toast at a time (the newer replaces the older)
// ADDING A GROUP: G('name', …) here + the name in ../harbor-jobs.mjs (CI_JOBS.speed).
import { log, sleep, ok, open, ev, waitFor, harborUp, G, OUT, SHOTS } from './kit.mjs';
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
