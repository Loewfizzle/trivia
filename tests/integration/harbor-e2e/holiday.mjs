// CITY 2.0 — THE HARBOR end to end: the `holiday` cloud job's groups (holiday, thanks, panelrows, citylife) — tests/integration/harbor-jobs.mjs#CI_JOBS.
// Registered with G() in their original order; run through ../e2e-harbor.mjs (JOB=holiday, or ONLY=<groups>). Shared helpers: ./kit.mjs.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import { OUT, SHOTS, sleep, ok, GR, open, ev, waitFor, tapAt, harborUp, G } from './kit.mjs';

// 11a-1 — THE HOLIDAYS: Halloween's build-up by date (Oct 10 / Oct 27), Halloween night, the come-down into Day of the Dead (Nov 1), the
// procession (Nov 2 at dusk), all gone (Nov 3 evening); the forced moments; reduced motion (docs/harbor/passes/part-11a-1.md)
G('holiday', async () => {
  const P = 'window.__district.harbor()';
  const page = async (slot, when, extra = '', init = null) => { const Q = await open({ slot, qs: `when=${when}${GR}&wx=clear${extra}`, view: [402, 874], init }); await harborUp(Q.page); await sleep(1500); return Q; };
  const sign = Q => ev(Q.page, `[...document.querySelector('.nd-sign').classList].filter(c => c.startsWith('sg-')).join(',')`);
  // ---- OCT 10: early in the build-up — a web part-woven on the sign, its spider, a few pumpkins; the city's own light
  { const Q = await page('hol-o10', '2026-10-10T21:00');
    await waitFor(Q.page, `${P}.dress && ${P}.dress.on && ${P}.dress.webs.length > 0 && ${P}.dress.spider`, 'the dressing + its spider (after the bake)', 15000).catch(() => {});
    const h = await ev(Q.page, `${P}.holiday`), d = await ev(Q.page, `${P}.dress`), wh = await ev(Q.page, `${P}.wheel.schemeId`);
    ok(h.state.id === 'halloween' && h.state.phase === 'build' && h.state.stage > 0.25 && h.state.stage < 0.4 && d && d.on && d.web > 0.25 && d.web < 0.4 && d.spider && h.pieces.pumpkins.length >= 2 && h.pieces.pumpkins.length <= 4 && wh !== 'halloween',   // (Oct 10 2026 is a Saturday: the party's wheel)
      `OCT 10 — THE BUILD-UP BY DATE: stage ${h.state.stage.toFixed(2)}, the web ${d && d.web != null ? d.web.toFixed(2) : '?'} (${d ? d.pieces.join(',') : 'no dressing'}), ${h.pieces.pumpkins.length} pumpkins, the wheel ${wh}`);
    await Q.ctx.close(); }
  // ---- OCT 27: far along — the window scenes, the wheel orange / purple; no night pieces yet
  { const Q = await page('hol-o27', '2026-10-27T21:00');
    const h = await ev(Q.page, `${P}.holiday`), wh = await ev(Q.page, `${P}.wheel.schemeId`);
    ok(h.state.stage > 0.85 && h.state.stage < 0.92 && h.pieces.windows > 0.5 && !h.pieces.trickOrTreat && !h.pieces.ghostShip && wh === 'halloween' && (await sign(Q)) === '',
      `OCT 27 — AS FAR ALONG AS IT SHOULD LOOK: stage ${h.state.stage.toFixed(2)}, the windows' weight ${h.pieces.windows.toFixed(2)}, the wheel ${wh}, the sign still pink`);
    await Q.ctx.close(); }
  // ---- HALLOWEEN NIGHT: everything — the web whole, the sign orange / purple + the pumpkin O, the beam green, the spooky light, the
  // trick-or-treaters on the promenade, the witch + the bats' weight, the haunted wind's input
  { const Q = await page('hol-hn', '2026-10-31T19:30');
    await waitFor(Q.page, `${P}.dress && ${P}.dress.on`, 'the dressing', 12000).catch(() => {});
    await waitFor(Q.page, `${P}.people.hol.trick > 0`, 'the trick-or-treaters', 25000).catch(() => {});
    const h = await ev(Q.page, `${P}.holiday`), d = await ev(Q.page, `${P}.dress`), lh = await ev(Q.page, `${P}.lighthouse.colour`), ppl = await ev(Q.page, `${P}.people.hol`);
    const swapped = await ev(Q.page, `!!document.querySelector('.nd-logo .ndl-3[data-kind="halloween"]')`);
    ok(h.state.eve && d.web === 1 && (await sign(Q)) === 'sg-halloween' && swapped && lh && lh[1] > lh[0] && h.rules.lampFlicker > 0.5 && h.rules.windowTintK > 0.3,
      `HALLOWEEN NIGHT — THE LOOK: the web ${d.web}, the sign ${await sign(Q)} + the pumpkin O ${swapped}, the beam ${lh}, the lamps gutter ${h.rules.lampFlicker}, the windows' tint ${h.rules.windowTintK.toFixed(2)}`);
    ok(ppl.trick > 0, `HALLOWEEN NIGHT — THE TRICK-OR-TREATERS on the promenade: ${JSON.stringify(ppl)}`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}holiday-halloween-night-402x874.png` });
    await Q.ctx.close(); }
  // ---- THE GHOST SHIP (forced on any night) + a window scene on the kit
  { const Q = await page('hol-gs', '2026-10-22T22:00', '&force=ghost-ship,window&moment=ghost');
    await waitFor(Q.page, `${P}.halloweenSky && ${P}.halloweenSky.ship.on && ${P}.halloweenSky.ship.a > 0.05`, 'the ghost ship', 20000).catch(() => {});
    const g = await ev(Q.page, `${P}.halloweenSky`), w = await ev(Q.page, `${P}.speakeasy.life`);
    ok(g && g.ship.on && g.ship.a > 0, `THE GHOST SHIP (forced): ${JSON.stringify(g && g.ship)}`);
    await waitFor(Q.page, `${P}.speakeasy.life.on.some(e => e.id === 'ghost')`, 'the ghost scene', 8000).catch(() => {});
    const w2 = await ev(Q.page, `${P}.speakeasy.life`);
    ok(w2.on.some(e => e.id === 'ghost'), `A GHOST IN THE WINDOW (forced): ${JSON.stringify(w2.on)} (was ${JSON.stringify(w.on)})`);
    await Q.ctx.close(); }
  // ---- NOV 1: Halloween came down overnight — no web, no pumpkins; Day of the Dead's sign + promenade
  { const Q = await page('hol-n1', '2026-11-01T11:00');
    await waitFor(Q.page, `${P}.dress && ${P}.dress.on && ${P}.dress.dotd`, 'the dressing', 12000).catch(() => {});
    const h = await ev(Q.page, `${P}.holiday`), d = await ev(Q.page, `${P}.dress`);
    ok(h.state.id === 'dotd' && !h.pieces.pumpkins && h.pieces.marigolds === 1 && h.pieces.papel === 1 && d && d.dotd && !(d.pieces || []).some(p => /web|spider/.test(p)) && (await sign(Q)) === 'sg-dotd',
      `NOV 1 — DAY OF THE DEAD: ${JSON.stringify({ marigolds: h.pieces.marigolds, papel: h.pieces.papel, petals: h.pieces.petals })}, the sign ${await sign(Q)} (${d ? d.pieces.join(',') : 'none'}) — the web + the pumpkins gone`);
    await Q.ctx.close(); }
  // ---- NOV 2 AT DUSK: the candlelight procession along the waterside road
  { const Q = await page('hol-n2', '2026-11-02T18:20');
    await waitFor(Q.page, `${P}.people.hol.proc > 3`, 'the procession', 20000).catch(() => {});
    const h = await ev(Q.page, `${P}.holiday`), ppl = await ev(Q.page, `${P}.people.hol`);
    ok(h.pieces.procession && ppl.proc > 3, `NOV 2 AT DUSK — THE PROCESSION: ${ppl.proc} walkers (${JSON.stringify(ppl)})`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}holiday-procession-402x874.png` });
    await Q.ctx.close(); }
  // ---- NOV 3 EVENING: all down
  { const Q = await page('hol-n3', '2026-11-03T20:00');
    const h = await ev(Q.page, `${P}.holiday`), wh = await ev(Q.page, `${P}.wheel.schemeId`);
    ok(h.state.id === null && wh !== 'dotd' && (await sign(Q)) === '', `NOV 3 EVENING — ALL DOWN: ${h.state.id}, the wheel ${wh}, the sign ${await sign(Q) || 'its own'}`);
    await Q.ctx.close(); }
  // ---- WIN — THE SPIDER'S TAP ON A TOUCH PHONE (the owner's iPhone: tapping it did nothing — title.js answered every tap inside the
  // logo's rect with a letter buzz before the scene was asked): a real touch tap on the spider bolts it down its thread; a touch tap on a
  // letter beside it still buzzes that letter
  { const Q = await page('hol-tap', '2026-10-31T21:00', '&force=sign-web');
    await waitFor(Q.page, `${P}.dress && ${P}.dress.on && ${P}.dress.spider && ${P}.spiderAt`, 'the spider', 15000).catch(() => {});
    await Q.page.touchscreen.tap(30, 120); await sleep(900);            // (a priming tap: the idle title swallows the first touch after 10 s)
    // (C4d — F10: SP6's twin fix here too — wait till it stands still, read where it IS just before the tap, one more tap if it missed)
    await waitFor(Q.page, `(() => { const s = ${P}.spiders[0]; return s && s.mode === 'still'; })()`, 'the spider still', 8000).catch(() => {});
    let at = await ev(Q.page, `${P}.spiderAt`);
    let dropped = false, onWord = false;
    let dangled = false, landed = false;
    for (let tries = 0; tries < 2 && at && !dropped; tries++) {
      if (tries) { await waitFor(Q.page, `(() => { const s = ${P}.spiders[0]; return s && s.mode === 'still'; })()`, 'the spider still', 8000).catch(() => {}); at = await ev(Q.page, `${P}.spiderAt`); }
      await Q.page.touchscreen.tap(at.x, at.y); dropped = await waitFor(Q.page, `['drop', 'land', 'crawl'].includes(${P}.dress.spider.mode)`, 'the spider dropping', 2500).then(() => true).catch(() => false); }
    if (at && dropped) {
      // (WIN3 — the owner: it DANGLES on its thread — head down, the legs tucked in (the mean reach under half the stance), a slow turn — and
      // lands feet first: the legs still pose-locked (never the full stance in the air) as it settles onto the tubes)
      dangled = await waitFor(Q.page, `(() => { const s = ${P}.dress.spider; return s.mode === 'drop' && s.pose === 'tuck' && s.reach < 0.5 && s.spin > 0.5; })()`, 'the dangle', 2200).then(() => true).catch(() => false);
      landed = await waitFor(Q.page, `(() => { const s = ${P}.dress.spider; return s.mode === 'land' && s.pose === 'reach' && s.reach < 0.9; })()`, 'landing feet first', 2500).then(() => true).catch(() => false);
      // (WIN2: it lands on the SPEAKEASY word's tubes and crawls along them — its y on the word, its x moving)
      onWord = await waitFor(Q.page, `(() => { const s = ${P}.dress.spider; return s.mode === 'crawl' && s.word != null && Math.abs(s.y - s.word) < 1; })()`, 'on the word', 4000).then(() => true).catch(() => false); }
    ok(dangled && landed, `THE DANGLE (WIN3): on the way down it hangs tucked + turning (${dangled}), then lands feet first with its legs still gathered (${landed})`);
    const st = await ev(Q.page, `${P}.dress.spider`), x0 = st && st.x;
    // WIN3 — ON TOP OF THE WORD (the owner: the spiders walk on SPEAKEASY, never behind it): hit-testing follows the paint order — with
    // pointer events switched on for the probe, the dressing's canvas is the TOPMOST element at the spider's point over the word's tubes
    const onTop = await ev(Q.page, `(() => { const s = ${P}.spiderAt, cv = document.querySelector('.nd-dress-cv'), sign = document.querySelector('.nd-sign'); if (!s || !cv || !sign) return null;
      const els = [sign, cv, ...sign.querySelectorAll('.nd-word, .nd-word *, .nd-logo-wrap, .nd-logo-wrap *')], was = els.map(e => e.style.pointerEvents); els.forEach(e => { e.style.pointerEvents = 'auto'; });
      const w = document.querySelector('.nd-word').getBoundingClientRect(), y = Math.max(w.top + 1, Math.min(w.bottom - 1, s.y));
      const st = [...document.elementsFromPoint(s.x, y)], top = st[0], i = st.indexOf(cv), j = st.findIndex(e => e.closest && e.closest('.nd-word'));
      els.forEach((e, k) => { e.style.pointerEvents = was[k]; });
      const cls = e => (e && (typeof e.className === 'string' ? e.className : e.className && e.className.baseVal)) || (e && e.tagName);
      return { top: cls(top), cv: i, word: j, z: [getComputedStyle(cv).zIndex, getComputedStyle(document.querySelector('.nd-logo-wrap')).zIndex] }; })()`);
    ok(onTop && onTop.cv === 0 && onTop.word > 0, `ON TOP OF THE WORD: at the spider's point the dressing canvas is the topmost element (${onTop ? `top ${onTop.top}, the canvas at ${onTop.cv}, the word's tubes at ${onTop.word}, z ${onTop.z.join(' / ')}` : 'no probe'})`);
    // (WIN3: its first run may follow a turn-round at the turn rate — wait for the movement itself, up to 7 s)
    await waitFor(Q.page, `Math.abs(${P}.dress.spider.x - ${x0}) > 2`, 'crawling along', 7000).catch(() => {});
    const st2 = await ev(Q.page, `${P}.dress.spider`), wordPx = await ev(Q.page, `(() => { const w = document.querySelector('.nd-word'); const r = w && w.getBoundingClientRect(); const s = ${P}.spiderAt; return r && s ? { in: s.y > r.top - 6 && s.y < r.bottom + 6 && s.x > r.left && s.x < r.right, sy: s.y, top: r.top, bottom: r.bottom } : null; })()`);
    // (C4d — F10's cause: ITS NERVES — dress-halloween.js#createSpider — turn a crawl into a SKITTER on any flicker near it: the sign's tired
    // tube every ~25 s (title.js#tiredTick), a blink, lightning. Both are the spider walking the word: either passes)
    ok(at && dropped && onWord && st2 && ['crawl', 'skitter'].includes(st2.mode) && Math.abs(st2.x - x0) > 2 && wordPx && wordPx.in, `THE SPIDER'S TAP (touch, ${at ? `${at.x.toFixed(0)},${at.y.toFixed(0)}` : 'no spider'}): it drops to the SPEAKEASY word (${st && st.mode} → ${st2 && st2.mode}, y ${st2 && st2.y} on the word ${st2 && st2.word}; on screen ${wordPx && wordPx.sy} within ${wordPx && wordPx.top}–${wordPx && wordPx.bottom}) and crawls along it (x ${x0} → ${st2 && st2.x})`);
    // THE SECOND SPIDER on the last N's web: its own tap, its own trip; the two never in step
    const at2 = await ev(Q.page, `${P}.spiders[1] || null`);
    let trip2 = false;
    if (at2) { await Q.page.touchscreen.tap(at2.x, at2.y); trip2 = await waitFor(Q.page, `['drop', 'crawl'].includes(${P}.dress.spider2.mode)`, 'the second dropping', 2500).then(() => true).catch(() => false); }
    const s2 = await ev(Q.page, `${P}.dress.spider2`), s1 = await ev(Q.page, `${P}.dress.spider`);
    ok(at2 && trip2 && s2 && s1 && (s1.mode !== s2.mode || Math.abs(s1.x - s2.x) > 40), `THE SECOND SPIDER (touch at ${at2 ? `${at2.x.toFixed(0)},${at2.y.toFixed(0)}` : 'none'}): its own trip (${s2 && s2.mode}), the first still ${s1 && s1.mode} — never in step`);
    // WIN3 — THE CLIMB HOME, the same in reverse: head-up, reeling the line with the front legs, the legs gathered (the mean reach
    // under 0.55), a slow turn; then both home + still (the wait is for the condition, not a fixed pause)
    const reeled = await waitFor(Q.page, `(() => { const s = ${P}.dress.spider; return s.mode === 'climb' && s.pose === 'reel' && s.head === -1 && s.reach < 0.55; })()`, 'the first reeling home', 18000).then(() => true).catch(() => false);
    const bothHome = await waitFor(Q.page, `(() => { const a = ${P}.dress.spider, b = ${P}.dress.spider2; return a && b && !a.trip && !b.trip && a.mode === 'still' && b.mode === 'still'; })()`, 'both home', 24000).then(() => true).catch(() => false);
    ok(reeled && bothHome, `THE CLIMB HOME: head-up, reeling the thread, the legs gathered (${reeled}); both home + still after (${bothHome})`);
    // ITS NERVES: a flicker on the sign (a poke: the race) — both freeze + crouch, eyes flaring, then calm
    const n = await ev(Q.page, `${P}.poke({ kind: 'race', k: 1 })`);
    // (a spider scared by the tired tube's poke in the last 4 s sits that one out — the cooldown; at least one reacts)
    const scared = await waitFor(Q.page, `(() => { const a = ${P}.dress.spider, b = ${P}.dress.spider2; return [a, b].some(s => s && s.scared > 0.8 && s.crouch > 0.4); })()`, 'a spider scared', 1500).then(() => true).catch(() => false);
    const calm = await waitFor(Q.page, `(() => { const a = ${P}.dress.spider, b = ${P}.dress.spider2; return a && b && a.scared === 0 && b.scared === 0 && a.crouch === 0 && b.crouch === 0; })()`, 'both calm', 18000).then(() => true).catch(() => false);   // (SP5: the dash is far + the return slow + wary — up to ~14 s)
    ok(n >= 1 && scared && calm, `ITS NERVES: the race's poke scared ${n} spider(s) — frozen, crouched, eyes flaring (${scared}), calm again within 18 s (${calm})`);
    // a letter beside it: the letter farthest from the spider, tapped — its tube stutters out at once (the night plan: off at 0 ms)
    const letters = await ev(Q.page, `[...document.querySelectorAll('.nd-sign .ndl')].map(l => { const r = l.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, on: l.classList.contains('on') }; })`);
    const far = letters.map((l, i) => ({ ...l, i, d: at ? Math.hypot(l.x - at.x, l.y - at.y) : 999 })).sort((a, b) => b.d - a.d)[0];
    let buzzed = false;
    if (far && far.d > 24) { await Q.page.touchscreen.tap(far.x, far.y); buzzed = await waitFor(Q.page, `!document.querySelectorAll('.nd-sign .ndl')[${far.i}].classList.contains('on')`, 'the letter out', 1500).then(() => true).catch(() => false); }
    ok(far && far.d > 24 && buzzed, `A LETTER TAP BESIDE IT (letter ${far && far.i}, ${far && far.d.toFixed(0)} pt from the spider): it stutters out ${buzzed ? 'at once' : 'NEVER'}`);
    await Q.ctx.close(); }
  // ---- WIN3 — THE SECOND SPIDER BY DATE (the owner: part of the build-up — it arrives Oct 29, so the 30th + 31st have two; Oct 28 has
  // one), both on screen inside the sign and TAPPABLE at 390 + 430 unzoomed: a touch tap on each drops THAT spider (the other untouched)
  for (const [when, view, want] of [['2026-10-28T21:00', [402, 874], 1], ['2026-10-29T21:00', [390, 844], 2], ['2026-10-29T21:00', [430, 932], 2]]) {
    const Q = await open({ slot: `hol-sp${want}${view[0]}`, qs: `when=${when}${GR}&wx=clear`, view }); await harborUp(Q.page); await sleep(1500);
    await waitFor(Q.page, `${P}.dress && ${P}.dress.on && ${P}.spiders.length >= ${want}`, 'the spiders', 15000).catch(() => {});
    const d = await ev(Q.page, `${P}.dress`), sp = await ev(Q.page, `${P}.spiders`), sr = await ev(Q.page, `(() => { const r = document.querySelector('.nd-sign').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; })()`);
    const inSign = s => s && s.x > Math.max(0, sr.x) && s.x < Math.min(view[0], sr.x + sr.w) && s.y > sr.y - 12 && s.y < sr.y + sr.h;
    ok(d && (d.pieces || []).filter(p => /spider/.test(p)).length === want && sp.length === want && sp.every(inSign), `${when.slice(5, 10)} at ${view[0]}: ${sp.length} spider(s) (${((d && d.pieces) || []).join(',')}) — ${want} wanted, all inside the sign (${sp.map(s => `${s.x.toFixed(0)},${s.y.toFixed(0)}`).join(' · ')})`);
    if (want === 2 && sp.length === 2) {
      await Q.page.touchscreen.tap(30, 120); await sleep(900);            // (the priming tap)
      // (SP6 — the cloud's miss at 430: the second spider ROAMS, so on a slow runner the tap landed where it had been. Wait till it stands
      // still, read where it IS just before the tap, and tap once more if the first missed — a person taps again too)
      let t2 = false;
      for (let tries = 0; tries < 2 && !t2; tries++) {
        await waitFor(Q.page, `(() => { const s = ${P}.spiders[1]; return s && s.mode === 'still'; })()`, 'the second still', 8000).catch(() => {});
        const a2 = await ev(Q.page, `${P}.spiders[1]`); await Q.page.touchscreen.tap(a2.x, a2.y);
        t2 = await waitFor(Q.page, `${P}.dress.spider2 && ${P}.dress.spider2.trip === 'drop'`, 'the second dropping', 2500).then(() => true).catch(() => false);
      }
      const s1 = await ev(Q.page, `${P}.dress.spider.trip`);
      // (the cloud's next run: the FIRST one's tap missed at 390 the same way — the same wait-still + read-now + one more tap)
      let t1 = false;
      for (let tries = 0; tries < 2 && !t1; tries++) {
        await waitFor(Q.page, `(() => { const s = ${P}.spiders[0]; return s && s.mode === 'still'; })()`, 'the first still', 8000).catch(() => {});
        const a1 = await ev(Q.page, `${P}.spiders[0]`); await Q.page.touchscreen.tap(a1.x, a1.y);
        t1 = await waitFor(Q.page, `${P}.dress.spider && ${P}.dress.spider.trip === 'drop'`, 'the first dropping', 2500).then(() => true).catch(() => false);
      }
      ok(t2 && s1 === null && t1, `${when.slice(5, 10)} at ${view[0]}: BOTH TAPPABLE — the second drops on its tap (${t2}; the first untouched: ${s1 === null}), the first on its own (${t1})`);
    }
    if (SHOTS && want === 2) await Q.page.screenshot({ path: `${OUT}holiday-spiders-${view[0]}x${view[1]}.png` });
    await Q.ctx.close();
  }
  // ---- WIN add-on — HALLOWEEN SET PIECES: the door's FIVE pumpkins at 390 (a stepped group on the steps + one each side, apart on screen,
  // above the dock) and the three BIG jack-o'-lanterns on the dressing spots (the hydrant, the bench's bale, the lamp post's bale: ≥ 15 pt
  // across, above the dock, drawn), their faces glowing after dark
  { const Q = await open({ slot: 'hol-set', qs: `when=2026-10-27T21:00${GR}&wx=clear&force=giant`, view: [390, 844] });
    await harborUp(Q.page); await sleep(1500);
    await waitFor(Q.page, `${P}.hprops && ${P}.hprops.stat.rects && ${P}.hprops.stat.rects.filter(r => r.big).length >= 2`, 'the big jack-o\'-lanterns drawn', 15000).catch(() => {});
    const hp = await ev(Q.page, `${P}.hprops`), cam = await ev(Q.page, `${P}.cam`), rects = (hp && hp.stat.rects) || [];
    const steps = rects.filter(r => !r.big && !r.decor), bigs = rects.filter(r => r.big);
    const ov = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    let pairs = 0; for (let i = 0; i < steps.length; i++) for (let j = i + 1; j < steps.length; j++) if (ov(steps[i], steps[j]) && Math.abs(steps[i].y + steps[i].h - (steps[j].y + steps[j].h)) < 2) pairs++;
    ok(steps.length === 5 && pairs === 0 && steps.every(r => r.y + r.h < cam.dock.y), `THE DOOR'S PUMPKINS at 390 (Oct 27): ${steps.length} (five), ${pairs} overlapping on one level, all above the dock (${steps.map(r => `${r.w.toFixed(0)}pt@${r.x.toFixed(0)}`).join(' ')})`);
    // (11a-2 — the owner: the giant owns the centre — the bench's piece at its far end, the front corner's retired)
    ok(bigs.length === 2 && bigs.some(r => r.id === 'bench-left') && bigs.some(r => r.id === 'hydrant') && bigs.every(r => r.w >= 15 && r.y + r.h < cam.dock.y), `THE BIG JACK-O'-LANTERNS at 390: ${bigs.map(r => `${r.id} ${r.w.toFixed(0)} pt`).join(', ')} — ≥ 15 pt each, above the dock ${cam.dock.y}`);
    // (WIN2 — the owner: the hydrant's read stretched: every big one at a pumpkin's own proportions — its sprite box no wider than 1.2× its height, never a flat disc)
    ok(bigs.every(r => r.w / r.h <= 1.2 && r.w / r.h >= 0.75), `THE BIG JACK-O'-LANTERNS' PROPORTIONS: ${bigs.map(r => `${r.id} ${(r.w / r.h).toFixed(2)}`).join(', ')} wide : tall (round, never stretched)`);
    ok(hp && hp.stat.bigGlows >= 2, `THEIR FACES GLOW after dark: ${hp && hp.stat.bigGlows} of 2 lit`);
    // 11a-2 — THE GIANT on Oct 27: on its plinth, NOT carved yet (the carvers come in the night into the 28th), so no candle
    // (SP6: the wait is for the GIANT's own first frame — its sliced bake draws after the small jack-o'-lanterns on a slow runner)
    await waitFor(Q.page, `${P}.hprops && ${P}.hprops.giant && ${P}.hprops.giant.drawn > 0`, 'the giant drawn', 20000).catch(() => {});
    { const g = await ev(Q.page, `${P}.hprops && ${P}.hprops.giant`); ok(g && g.drawn > 0 && !g.carved && g.lit === 0 && g.rect && g.rect.y + g.rect.h < cam.dock.y, `THE GIANT on Oct 27: on its plinth (${g && g.drawn} frames), uncarved (${g && g.carved}), unlit (${g && g.lit}), above the dock`); }
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}holiday-setpieces-390x844.png` });
    await Q.ctx.close(); }
  // (C4b: the giant is OFF in the calendar — core/harbor-holiday.js#GIANT_ON; these checks show it with &force=giant)
  // ---- 11a-2 — THE GIANT on the centre circle (the owner: HUGE, the BITCOIN LOGO carved + lit from within), carved overnight into Oct 28:
  // its ₿ lit at night (the light on the cobbles), ~55 pt across at 402, its top under the WAIT / WALK lantern, above the dock; the dance
  // (forced here) RINGS it — the dancers evenly round it, nobody walking through it
  { const Q = await open({ slot: 'hol-giant', qs: `when=2026-10-28T21:00${GR}&wx=clear&force=dance,giant`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.hprops && ${P}.hprops.giant && ${P}.hprops.giant.lit > 0.3`, 'the giant lit', 15000).catch(() => {});
    const g = (await ev(Q.page, `${P}.hprops`)).giant, cam = await ev(Q.page, `${P}.cam`);
    ok(g && g.carved && g.lit > 0.3 && g.pool > 0.1 && g.body.w >= 100 && g.body.w <= 125 && g.rect.y + g.rect.h < cam.dock.y && g.body.top > 600, `THE GIANT on Oct 28 night: carved (${g && g.carved}), its candle lit (${g && g.lit}), the light on the cobbles (${g && g.pool}), ${g && g.body.w} pt across, its stem's top at y ${g && g.body.top}, above the dock ${cam.dock.y}`);
    // (the ₿'s glow: the pixels in the coin's middle hot + bright against the dark skin beside it)
    const px = await ev(Q.page, `(() => { const r = ${P}.hprops.giant.rect, cv = document.querySelector('canvas'); const x = cv.getContext('2d'); const d = window.devicePixelRatio || 1; const at = (u, v) => { const p = x.getImageData(Math.round((r.x + r.w * u) * d), Math.round((r.y + r.h * v) * d), 1, 1).data; return [p[0], p[1], p[2]]; }; return { mid: at(0.5, 0.52), side: at(0.12, 0.55) }; })()`).catch(() => null);
    const L2 = q => (q ? q[0] * 0.3 + q[1] * 0.59 + q[2] * 0.11 : 0);
    ok(!px || L2(px.mid) > L2(px.side) + 40, `THE ₿ GLOWS from within: its middle ${px ? px.mid.join(',') : '(no read)'} vs the skin ${px ? px.side.join(',') : ''}`);
    const seen = await waitFor(Q.page, `${P}.people && ${P}.people.dance && ${P}.people.dance.on && ${P}.people.dance.k > 0.95`, 'the ring formed', 80000).then(() => true).catch(() => false);
    const ring = await ev(Q.page, `(() => { const H = ${P}, ms = (H.people && H.people.members) || []; return ms.filter(x => x.kind === 'dancer').map(x => ({ x: x.x, z: x.z, pose: x.pose })); })()`);
    const med = await ev(Q.page, `${P}.medallion`);
    const rs = med ? ring.filter(d => d.pose === 'wands').map(d => Math.hypot((d.x - med.x) / 6.0, (d.z - med.z + 0.55) / 5.0)) : [];
    ok(seen && (!med || (rs.length >= 3 && rs.every(r => Math.abs(r - 1) < 0.05))), `THE DANCE RINGS THE GIANT: ${seen ? 'formed' : 'never formed'}, ${rs.length} dancers on its oval (${rs.map(r => r.toFixed(2)).join(', ')} of 1)`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}holiday-giant-ring-402x874.png` });
    await Q.ctx.close(); }
  // ---- REDUCED MOTION on Halloween night: no witch, no bats, no window moments; the dressing still there, the spider still
  { const Q = await page('hol-rm', '2026-10-31T21:30', '&force=witch,bats', { fn: () => { try { const k = 'na:settings', s = JSON.parse(localStorage.getItem(k) || '{}'); s.reducedFx = true; localStorage.setItem(k, JSON.stringify(s)); } catch { /* fine */ } }, arg: null });
    await sleep(2500);
    const g = await ev(Q.page, `${P}.halloweenSky`), w = await ev(Q.page, `${P}.speakeasy.life`), d = await ev(Q.page, `${P}.dress`);
    ok((!g || (!g.witch.on && !g.bats.colony)) && w.on.length === 0 && d && d.on, `REDUCED MOTION: no witch (${g ? g.witch.on : 'none'}), no bats, no window moments (${JSON.stringify(w.on)}), the dressing still up`);
    await Q.ctx.close(); }
});
// ================================================================ 11a-2 — THANKSGIVING, THE PARADE + BLACK FRIDAY (ONLY=thanks): the
// November build-up by date, the homecoming party ringing the harvest display, the balloon parade from its start, the amber evening with
// its chimney smoke, Black Friday's crew + strings + tree stand + rush, and the sign never amber after the holiday (City 1.0's calendar)
G('thanks', async () => {
  const P = 'window.__district.harbor()';
  const page = async (slot, when, extra = '') => { const Q = await open({ slot, qs: `when=${when}${GR}&wx=clear${extra}`, view: [402, 874] }); await harborUp(Q.page); await sleep(1500); return Q; };
  const sign = Q => ev(Q.page, `[...document.querySelector('.nd-sign').classList].filter(c => c.startsWith('sg-')).join(',')`);
  // ---- C4c — THE HARVEST DISPLAY AS A 3D MODEL (a test behind its switch): a normal Nov 19 night never fetches the model's sprites (the
  // drawn display); &prop=model draws the baked model on the compass with its Edison bulbs (code) on its ledges
  { const Q = await page('tg-mdl0', '2026-11-19T21:00');
    await waitFor(Q.page, `${P}.hprops && ${P}.hprops.harvest && ${P}.hprops.harvest.drawn > 0`, 'the display drawn', 15000).catch(() => {});
    const h0 = await ev(Q.page, `${P}.hprops && ${P}.hprops.harvest`);
    await Q.ctx.close();
    const Q2 = await page('tg-mdl1', '2026-11-19T21:00', '&prop=model');
    await waitFor(Q2.page, `${P}.hprops && ${P}.hprops.harvest && ${P}.hprops.harvest.model`, 'the model drawn', 20000).catch(() => {});
    const h1 = await ev(Q2.page, `${P}.hprops && ${P}.hprops.harvest`);
    ok(h0 && h0.drawn > 0 && !h0.model && !h0.modelAsked && h1 && h1.model && h1.modelIn && h1.bulbs >= 20 && h1.rect && h1.rect.w > 40, `THE HARVEST DISPLAY's 3D MODEL behind its switch: drawn by default (model ${h0 && h0.model}, its sprites asked ${h0 && h0.modelAsked}); &prop=model → the model (${h1 && h1.model}, ${h1 && h1.rect ? Math.round(h1.rect.w) : 0} pt wide), its ${h1 && h1.bulbs} bulbs lit`);
    await Q2.ctx.close(); }
  // ---- HOTFIX Oct 29 — THE HARVEST MODEL HARDENED FOR iOS (the owner's iPhone drew the hand-made display on both links): its WebPs
  // made to fail (every harvest .webp's src pointed at a missing file — what an iPhone whose WebP decode fails sees) → it loads the PNGs
  // and draws the model; &debug=1's readout names the build on its first line + a `harvest: MODEL (loaded … png (webp error) …)` row
  { const noWebp = () => { const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src'); Object.defineProperty(HTMLImageElement.prototype, 'src', { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, /\/city\/harvest\/[a-z]+\.webp/.test(String(v)) ? String(v).replace('.webp', '.gone.webp') : v); } }); };
    const Q = await open({ slot: 'tg-mdl2', qs: `when=2026-11-19T21:00${GR}&wx=clear&prop=model&debug=1`, view: [402, 660], init: { fn: noWebp } });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.hprops && ${P}.hprops.harvest && ${P}.hprops.harvest.model`, 'the model drawn from its PNGs', 25000).catch(() => {});
    await waitFor(Q.page, `/harvest: MODEL/.test((document.querySelector('.dbg-s[data-id="readout"]') || {}).textContent || '')`, 'the readout row', 8000).catch(() => {});
    const h = await ev(Q.page, `${P}.hprops && ${P}.hprops.harvest`), ro = await ev(Q.page, `(() => { const b = document.querySelector('.dbg-s[data-id="readout"]'); return b ? { head: b.querySelector('.dbg-h').textContent, rows: [...b.querySelectorAll('.dbg-b > div')].map(x => x.textContent) } : null; })()`);
    const row = ro && ro.rows.find(r => r.startsWith('harvest:'));
    ok(h && h.model && h.modelState && /png \(webp error\)/.test(h.modelState.why) && ro && /^(local|[0-9a-f]{7}) · t\d/.test(ro.head) && row && /^harvest: MODEL \(loaded .*png \(webp error\)/.test(row),
      `THE HARVEST MODEL WITHOUT ITS WEBPS (an iPhone's failed decode): drawn from the PNGs (model ${h && h.model}, ${h && h.modelState ? `${h.modelState.state}: ${h.modelState.why}` : 'no state'}); the readout's first line "${ro ? ro.head.slice(0, 28) : 'none'}…", its row "${row || 'none'}"`);
    await Q.ctx.close(); }
  // ---- NOV 10: a third of the way — bales, corn stalks round the lamp posts, the spots' pumpkins; no harvest display, no wreath yet
  { const Q = await page('tg-n10', '2026-11-10T21:00');
    const h = await ev(Q.page, `${P}.holiday`), d = await ev(Q.page, `${P}.dress`);
    ok(h.state.id === 'thanksgiving' && h.state.phase === 'build' && h.pieces.bales && h.pieces.stalks && h.pieces.spots >= 1 && !h.pieces.harvest && !(h.pieces.wreath > 0) && !h.pieces.giant && (await sign(Q)) === '',
      `NOV 10 — THE BUILD-UP: stage ${h.state.stage.toFixed(2)}, bales ${h.pieces.bales}, stalks ${h.pieces.stalks}, spots ${h.pieces.spots}, harvest ${h.pieces.harvest}, wreath ${h.pieces.wreath}, the sign ${(await sign(Q)) || 'its own'}`);
    void d; await Q.ctx.close(); }
  // ---- NOV 20: the harvest display on the centre circle, the wreath going up on the sign
  { const Q = await page('tg-n20', '2026-11-20T21:00');
    await waitFor(Q.page, `${P}.dress && ${P}.dress.on && ${P}.dress.pieces.includes('thanks')`, 'the wreath on the sign', 15000).catch(() => {});
    const h = await ev(Q.page, `${P}.holiday`), d = await ev(Q.page, `${P}.dress`);
    ok(h.pieces.harvest && h.pieces.wreath > 0.4 && d && d.pieces.includes('thanks'), `NOV 20 — THE HARVEST DISPLAY + THE WREATH: harvest ${h.pieces.harvest}, wreath ${h.pieces.wreath.toFixed(2)} (${d ? d.pieces.join(',') : 'no dressing'})`);
    await Q.ctx.close(); }
  // ---- NOV 25, 10 pm: THE HOMECOMING — a party night on a Wednesday (the show on, the dance's circle round the harvest display)
  { const Q = await page('tg-wed', '2026-11-25T22:01:30');
    await waitFor(Q.page, 'window.__district.party().on > 0.5', 'the party on', 20000).catch(() => {});
    const pt = await ev(Q.page, 'window.__district.party()'), h = await ev(Q.page, `${P}.holiday`);
    ok(pt.on > 0.5 && h.pieces.party && h.pieces.harvest, `THE HOMECOMING (Wed Nov 25): the party ${pt.on.toFixed(2)} (${pt.name}), the harvest display ${h.pieces.harvest}`);
    await Q.ctx.close(); }
  // ---- NOV 26, 9:00:30: THE BALLOON PARADE from its start — the band first, then the giant balloons on their ropes, the crowd at the kerb
  { const Q = await page('tg-par', '2026-11-26T09:03:40');
    await waitFor(Q.page, `${P}.parade && ${P}.parade.balloons > 0`, 'a balloon up', 30000).catch(() => {});
    const pa = await ev(Q.page, `${P}.parade`), ms = await ev(Q.page, `(${P}.people && ${P}.people.members || []).map(m => m.kind)`);
    const band = ms.filter(k => k === 'parade').length, crowd = ms.filter(k => k === 'spectator').length;
    ok(pa && pa.balloons >= 1 && pa.ropes >= 3 && band >= 4 && crowd >= 4, `THE PARADE: ${pa ? pa.balloons : 0} balloon(s) on ${pa ? pa.ropes : 0} ropes, ${band} marchers, ${crowd} at the kerb (${pa ? pa.units : 0} units)`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}thanks-parade-402x874.png` });
    // (its SOUNDS once the audio is unlocked: the crowd's bed, the band two blocks away or the balloons' fabric — core/city-sounds.js)
    await tapAt(Q.page, 30, 300);
    const SND = `${P}.sounds`;
    const heard = await waitFor(Q.page, `(() => { const d = ${SND}.debug ? ${SND}.debug() : ${SND}; const b = (d.beds || []).map(x => x.slot), r = (d.runs || []).map(x => x.slot); return b.includes('parade-crowd') && (b.includes('balloon-flap') || r.includes('parade-band')); })()`, 'the parade heard', 20000).then(() => true).catch(() => false);
    const sd = await ev(Q.page, `(() => { const d = ${SND}.debug ? ${SND}.debug() : ${SND}; return { beds: (d.beds || []).map(x => x.slot), runs: (d.runs || []).map(x => x.slot) }; })()`);
    ok(heard, `THE PARADE HEARD: beds ${sd.beds.join(', ')} · runs ${sd.runs.join(', ') || '-'}`);
    await Q.ctx.close(); }
  // ---- NOV 26, 7:30 pm: the day — the sign + the wheel amber / harvest, chimney smoke, no strings yet
  { const Q = await page('tg-eve', '2026-11-26T19:30');
    const wh = await ev(Q.page, `${P}.wheel.schemeId`), ch = await ev(Q.page, `${P}.chimneys`), x = await ev(Q.page, `${P}.xmas`);
    ok((await sign(Q)) === 'sg-thanksgiving' && wh === 'harvest' && ch.k > 0.5 && ch.stacks.length >= 3 && ch.drawn > 10 && !x.lights, `THANKSGIVING EVENING: the sign ${await sign(Q)}, the wheel ${wh}, chimney smoke ${ch.k} from ${ch.stacks.length} stacks (${ch.drawn} puffs), the strings ${x.lights}`);
    await Q.ctx.close(); }
  // ---- NOV 27, 10:40: BLACK FRIDAY — the crew on the rig hanging the strings, the tree stand by the bench, the rush; the sign its own
  { const Q = await page('tg-bf', '2026-11-27T10:40');
    await waitFor(Q.page, `(${P}.people.crew || {}).props && ${P}.people.crew.props.includes('xlights')`, 'the strings going up', 20000).catch(() => {});
    const cr = await ev(Q.page, `${P}.people.crew`), x = await ev(Q.page, `${P}.xmas`), hp = await ev(Q.page, `${P}.hprops`);
    const tree = hp && ((hp.stat && hp.stat.rects) || []).some(r => r.id === 'treestand');
    ok(cr && cr.props.includes('xlights') && cr.props.includes('platform') && x.bf && x.crew === 'during' && x.rush > 0.9 && tree && (await sign(Q)) === '',
      `BLACK FRIDAY morning: the crew's props ${cr ? cr.props.join(',') : '-'}, crew ${x.crew}, rush ${x.rush.toFixed(2)}, the tree stand ${tree}, the sign ${(await sign(Q)) || 'its own'}`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}thanks-blackfriday-402x874.png` });
    await Q.ctx.close(); }
  // ---- NOV 27, 6:30 pm: the first strings ON (the speakeasy's sills + cornice + awning; the roof's café lights in Christmas colours)
  { const Q = await page('tg-bfn', '2026-11-27T18:30');
    await waitFor(Q.page, `${P}.xmas && ${P}.xmas.xlK > 0.3`, 'the strings lit', 15000).catch(() => {});
    const x = await ev(Q.page, `${P}.xmas`), st = await ev(Q.page, `${P}.strings`);
    ok(x.lights === 1 && x.lit && x.xlK > 0.3 && st && st.cfg && st.cfg.scheme === 'christmas', `BLACK FRIDAY evening: the strings up ${x.lights}, lit ${x.lit} (${x.xlK}), the roof's scheme ${st && st.cfg ? st.cfg.scheme : '-'}`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}thanks-blackfriday-night-402x874.png` });
    await Q.ctx.close(); }
});
// ================================================================ WIN3 — THE PANEL'S WINDOW ROWS (ONLY=panelrows; the holiday cloud job)
// The owner (Oct 26): PEEK AT THE STREET + CASH COUNT (and likely the others) did nothing from the preview panel. Every row in
// SPEAKEASY → windows, tapped IN THE REAL SHEET by day (3:14 pm, his case): JUST ME's clock jumps to the moment's OWN hour (its routine's
// `at` / the middle of its hours — core/harbor-remote.js#momentWhen), the moment starts in one of its own windows within a few seconds,
// the pill names it with the time. No emulators needed (JUST ME lives in sessionStorage).
G('panelrows', async () => {
  const R0 = await import('../../../js/core/harbor-remote.js'), M0 = await import('../../../js/core/harbor-moments.js');
  const Q = await open({ slot: 'prow', qs: `when=2026-10-26T15:14${GR}&wx=clear&panel=1`, view: [402, 874] });
  await harborUp(Q.page);
  await waitFor(Q.page, '!!window.__district.remote()', 'the panel', 10000);
  await ev(Q.page, 'window.__district.remote().delay(0)');
  const rows = R0.PANEL_EVENTS.filter(e => e.cat === 'windows' && e.id !== 'window');
  const inHours = (m, h) => { if (!m) return true; if (m.at != null) return Math.abs(h - m.at - 0.25) < 0.15; if (!m.hours) return true; const [a, b] = m.hours; return b >= a ? h >= a && h < b : h >= a || h < b; };
  let fired = 0;
  for (const row of rows) {
    const id = row.id.startsWith('window-') && row.id !== 'window-party' ? row.id.slice(7) : null, m = id ? M0.MOMENT[id] : null;
    await ev(Q.page, 'window.__district.remote().setMine({})'); await sleep(400);
    await ev(Q.page, 'window.__district.remote().open()'); await sleep(500);
    await ev(Q.page, "window.__district.remote().openCats('*')"); await sleep(250);
    const at = await ev(Q.page, `(() => { const b = [...document.querySelectorAll('.hr-sheet .hr-b')].find(b => b.textContent.replace(/☾/g, '').trim() === ${JSON.stringify(row.label)}); if (!b) return null; b.scrollIntoView({ block: 'center' }); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; })()`);
    if (at) await tapAt(Q.page, at.x, at.y);
    await sleep(250);
    await ev(Q.page, 'window.__district.remote().close()');
    const want = id ? `(() => { const L = window.__district.harbor().speakeasy.life; return L.forced === '${id}' && L.on.some(o => o.id === '${id}'); })()` : row.id === 'window-party' ? `(() => { const P = window.__district.harbor().speakeasy.life.party; return !!(P && P.on && P.forced); })()` : `window.__district.harbor().flags.force.includes('${row.id}')`;
    const went = at ? await waitFor(Q.page, want, row.label, 6000).then(() => true).catch(() => false) : false;
    const st = await ev(Q.page, `(() => { const H = window.__district.harbor(), L = H.speakeasy.life, me = JSON.parse(sessionStorage.getItem('nd:hr-me') || '{}').state || {}; return { h: +L.h.toFixed(2), on: L.on.map(o => o.id + '@' + o.win), when: me.when || null, pill: window.__district.remote().debug().what, words: window.__district.remote().debug().words }; })()`);
    const winOk = !m || st.on.some(o => o.startsWith(id + '@') && (m.windows === 'all' || m.windows.includes(o.split('@')[1])));
    const hourOk = inHours(m, st.h), named = st.pill.includes(row.label) && (!m || / \d\d:\d\d$/.test(st.words));   // (9d: what the ADMIN row + the status say — the pill is gone)
    if (went && winOk && hourOk && named) fired++;
    ok(!!at && went && winOk && hourOk && named, `THE ROW ${row.label}: ${at ? 'tapped' : 'NOT FOUND in the sheet'} → ${went ? 'fires' : 'NOTHING'} (${st.on.join(', ') || 'nothing on'}) at ${st.h} (${st.when || 'no jump'}${m ? `, allowed ${m.at != null ? `~${m.at}:00` : m.hours ? m.hours.join('–') : 'any hour'}` : ''}), the pill "${st.pill}"`);
  }
  ok(fired === rows.length && rows.length >= 18, `EVERY WINDOW ROW FIRES from the sheet: ${fired} of ${rows.length}`);
  await Q.ctx.close();
});
// ================================================================ 9e — THE CITY LIFE (ONLY=citylife; the `wild` cloud job): the dead times filled
// THE NIGHT SHIFT (the henchman's flashlight patrol at 3 am), THE WATER WAGON (its passes in the back road's traffic + the road left wet),
// THE MORNING PAPER in a window (late morning), all on their own schedules (the same on every phone)
G('citylife', async () => {
  const P = 'window.__district.harbor()';
  { const Q = await open({ slot: 'cl-night', qs: `when=2026-09-16T03:10${GR}&wx=clear&force=flusher`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${P}.people.traffic.cars.some(c => String(c.id).startsWith('flush.'))`, 'the water wagon on the back road', 30000).catch(() => {});
    const a = await ev(Q.page, `(() => { const p = ${P}.people; return { works: p.crew.works, wagon: p.traffic.cars.some(c => String(c.id).startsWith('flush.')), hench: (p.crew.members || []).find(m => m.kind === 'henchman'), wet: ${P}.snow.work && ${P}.snow.work.flush }; })()`);
    ok(a.works.includes('henchman') && a.hench && a.wagon && a.wet, `9e THE NIGHT SHIFT at 3:10 am: the henchman on his patrol (${a.hench ? `${a.hench.pose} at x ${a.hench.x}` : 'missing'}), the water wagon in the back road's traffic (${a.wagon}, its night: ${a.wet})`);
    await Q.ctx.close(); }
  // 9f — THE JOGGERS (the owner: "the joggers didn't show"): &force=joggers sends one through every ~20 s at any hour (here 3 pm, outside
  // their hours) — two different joggers seen within ~50 s
  { const Q = await open({ slot: 'cl-jog', qs: `when=2026-10-21T15:00${GR}&wx=clear&force=joggers`, view: [402, 874] });
    await harborUp(Q.page);
    await ev(Q.page, `(() => { window.__jog = new Set(); window.__jogI = setInterval(() => { for (const m of ${P}.people.members) if (m.kind === 'jogger') window.__jog.add(m.id); }, 250); })()`);
    await waitFor(Q.page, 'window.__jog.size >= 2', 'two joggers', 60000).catch(() => {});
    const n = await ev(Q.page, 'window.__jog.size');
    ok(n >= 2, `9f THE JOGGERS: &force=joggers sends them through (${n} seen within a minute at 3 pm, outside their hours)`);
    await Q.ctx.close(); }
});
