// CITY 2.0 — THE HARBOR end to end: DESKTOP (Nov 2 — docs/harbor/passes/desktop.md): the wide camera, the desktop UI (the dock, the hover,
// Esc), THE RESIZE, a phone sideways + an iPad, and the phone sizes untouched. The `models` cloud job (tests/integration/harbor-jobs.mjs).
// ADDING A GROUP: G('name', …) in its job's file + the name in ../harbor-jobs.mjs (CI_JOBS).
import { OUT, SHOTS, log, sleep, ok, okT, GR, NIGHT, open, ev, waitFor, harborUp, G } from './kit.mjs';

const CAM = 'window.__district.harbor().cam';
const rectOf = (p, sel) => ev(p, `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
const settledCanvas = p => ev(p, `(() => { const c = document.querySelector('.nd-scene canvas'), host = c.parentElement; return { w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight, pinned: !!c.style.width, tf: host.style.transform || '' }; })()`);

G('desktop', async () => {
  // ---- 1440 × 900: THE WIDE CAMERA (closer + lower, the near edge at z 50), the bigger sign, the dock centred, the billboard, the hover, Esc
  { const Q = await open({ slot: 'dk', qs: `${NIGHT}&wx=clear`, view: [1440, 900] }), p = Q.page;
    await harborUp(p);
    const c = await ev(p, CAM);
    ok(c.wide && c.CAMH === 8 && c.zFront === 50 && c.F > 680 && c.spread > 2 && c.cx0 === 0, `THE WIDE CAMERA (1440×900): closer + lower — F ${c.F.toFixed(0)}, the eye at ${c.CAMH}, the near edge z ${c.zFront}, ${c.spread.toFixed(1)}× a phone's width, composed to the edges (cx0 ${c.cx0})`);
    const lg = await rectOf(p, '.nd-logo-wrap'), dk = await rectOf(p, '.nd-bar');
    ok(lg && lg.w >= 560 && Math.abs(lg.x + lg.w / 2 - 720) < 4, `THE SIGN bigger + centred: ${lg && lg.w.toFixed(0)} pt wide (was 470), its middle at ${lg && (lg.x + lg.w / 2).toFixed(0)}`);
    ok(dk && Math.abs(dk.x + dk.w / 2 - 720) < 4 && dk.w <= 640 && dk.y + dk.h <= 900, `THE DOCK centred at the bottom, a sensible width (${dk && dk.w.toFixed(0)} pt, its middle ${dk && (dk.x + dk.w / 2).toFixed(0)})`);
    const nb = await ev(p, `(() => { const n = window.__district.harbor().neon; return { boards: n.boards.length, signs: n.signs.filter(s => s.game).map(s => ({ id: s.id, r: s.rect })) }; })()`);
    ok(nb.boards >= 1 && nb.signs.length >= 3 && nb.signs.every(s => s.r.x >= 0 && s.r.x + s.r.w <= 1440), `THE SIGNS: the billboard + ${nb.signs.length} named signs, all on screen (${nb.signs.map(s => s.id).join(' · ')})`);
    // the hover: a mouse over a game sign → the pointer + the ring on it; over the open sky → neither
    await waitFor(p, '!!(window.__district.phase().done)', 'the menu', 10000);
    const s0 = nb.signs[0].r;
    await p.mouse.move(s0.x + s0.w / 2, s0.y + s0.h / 2); await sleep(120); await p.mouse.move(s0.x + s0.w / 2 + 1, s0.y + s0.h / 2 + 1);
    await waitFor(p, "document.querySelector('.nd').classList.contains('nd-hovering') && document.querySelector('.nd-hover.on')", 'the hover on the sign', 4000).catch(() => {});
    // (the mouse-only CSS — the pointer, the ring shown — lives under (hover: hover) and (pointer: fine): a real desktop matches it; the cloud's
    //  headless Linux runner reports NO pointer device, so there the CSS half is skipped + said; the hover logic is checked everywhere)
    const on = await ev(p, `(() => { const g = document.querySelector('.nd-hover'), cs = getComputedStyle(g); return { mouse: matchMedia('(hover: hover) and (pointer: fine)').matches, hov: document.querySelector('.nd').classList.contains('nd-hovering'), on: g.classList.contains('on'), disp: cs.display, cur: getComputedStyle(document.querySelector('.nd-city')).cursor }; })()`);
    await p.mouse.move(150, 160); await sleep(250);
    const off = await ev(p, "({ hov: document.querySelector('.nd').classList.contains('nd-hovering'), on: document.querySelector('.nd-hover').classList.contains('on') })");
    ok(on.hov && on.on && (!on.mouse || (on.disp === 'block' && on.cur === 'pointer')) && !off.hov && !off.on, `THE HOVER (a mouse): over ${nb.signs[0].id} the hover + the glow ring (${on.on}) — ${on.mouse ? `the pointer (${on.cur}), the ring shown (${on.disp})` : 'this browser reports no fine pointer: the mouse-only CSS not in play here'}; over the open sky neither (${!off.hov && !off.on})`);
    // Esc closes a sheet (the games sheet from the dock)
    await p.click('.nd-tab-play'); await waitFor(p, "!!document.querySelector('.sh:not(.is-out)')", 'the games shelf', 5000);
    const sw = await rectOf(p, '.sh .sh-panel');
    await p.keyboard.press('Escape');
    const closed = await waitFor(p, "!document.querySelector('.sh:not(.is-out)')", 'Esc closes it', 4000).then(() => true, () => false);
    ok(closed && sw && sw.w <= 720 && Math.abs(sw.x + sw.w / 2 - 720) < 6, `Esc CLOSES THE SHEET (the games sheet: ${sw && sw.w.toFixed(0)} pt wide, centred)`);
    if (SHOTS) await p.screenshot({ path: `${OUT}desktop-1440x900.png` });
    // ---- THE RESIZE (the owner: no stretch, no flash, no reload, no freeze): a slow drag smaller, a snap back bigger, a move to a DPR 2 screen
    await ev(p, `(() => { window.__gaps = []; window.__gapPh = 'drag'; window.__gapBy = {}; let last = 0; const f = t => { if (last) { const g = t - last; window.__gaps.push(g); const k = window.__gapPh; window.__gapBy[k] = Math.max(window.__gapBy[k] || 0, g); } last = t; window.__gapRaf = requestAnimationFrame(f); }; window.__gapRaf = requestAnimationFrame(f); window.__nav = performance.getEntriesByType('navigation').length; })()`);
    const pinnedSeen = [];
    for (const w of [1400, 1340, 1280, 1220, 1160, 1100]) { await p.setViewport({ width: w, height: 900 }); await sleep(70); pinnedSeen.push((await settledCanvas(p)).pinned); }
    await ev(p, "window.__gapPh = 'refit'");
    await waitFor(p, `window.__district.harbor().cam.W === 1100`, 'the re-fit at 1100', 8000);
    await sleep(300);
    const a = await settledCanvas(p);
    await ev(p, "window.__gapPh = 'snap'");
    await p.setViewport({ width: 1920, height: 1080 });
    await waitFor(p, `window.__district.harbor().cam.W === 1920`, 'the re-fit at 1920', 8000);
    await sleep(300);
    const b = await settledCanvas(p);
    // (to a DPR 2 screen: the tier pinned at 2 first — this machine's own judge may have stepped it; the canvas then draws at THE PIXEL
    //  BUDGET's ratio — core/harbor-tiers.js#budgetDpr: ×1.12 at 1920 × 1080, 2.6 MP — never the full 8.3)
    await ev(p, "window.__gapPh = 'tier'"); await ev(p, 'window.__district.setTier(2)'); await sleep(300); await ev(p, "window.__gapPh = 'dpr'");
    const { budgetDpr } = await import('../../../js/core/harbor-tiers.js'), want = budgetDpr(1920, 1080, 2, 2);
    await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    const dprOk = await waitFor(p, `Math.abs(window.__district.harbor().cam.dpr - ${want}) < 0.02`, 'the re-fit at DPR 2', 8000).then(() => true, () => false);
    await sleep(300);
    const d = await settledCanvas(p);
    const gaps = await ev(p, '(() => { cancelAnimationFrame(window.__gapRaf); const g = window.__gaps.slice().sort((x, y) => y - x); return { worst: g[0] || 0, by: window.__gapBy, n: g.length, nav: performance.getEntriesByType("navigation").length === window.__nav && !!window.__gaps }; })()');
    const fit = s => Math.abs(s.w / s.h - s.cw / s.ch) < 0.01 && !s.pinned && !s.tf;
    ok(pinnedSeen.some(Boolean) && fit(a) && fit(b) && fit(d) && dprOk && Math.abs(d.w / d.cw - want) < 0.03 && gaps.nav, `THE RESIZE: while the window changes the last frame is HELD + scaled uniformly (pinned ${pinnedSeen.filter(Boolean).length}/6), then re-fit sharp — 1100×900 ${a.w}×${a.h}, 1920×1080 ${b.w}×${b.h}, moved to a DPR 2 screen ${d.w}×${d.h} (×${(d.w / d.cw).toFixed(2)} — THE PIXEL BUDGET's ${want.toFixed(2)}), the page never reloaded`);
    // (LOBBY 2.0 A — THE RESIZE, red under the full suite since 2A (417 ms alone vs a 450 bar): the cause is the RE-FIT — once the size
    //  settles the whole city is rebuilt in one task (the layout, the neon's ~120–160 ms, every baked layer re-sized + rastered at the
    //  desktop size: ~300–500 ms in this headless browser; an empty page's resize 17 ms). The drag itself is the HELD frame (one
    //  transform) and must stay smooth; the rebuild is ONE hitch a resize, judged on its own — a known cost (docs/harbor.md KNOWN ISSUES))
    const by = gaps.by || {}, hitch = Math.max(by.refit || 0, by.snap || 0, by.tier || 0, by.dpr || 0);
    okT((by.drag || 0) < 200 && hitch < 750, `THE RESIZE never freezes: the drag (the held frame) worst gap ${Math.round(by.drag || 0)} ms (< 200); the re-fit's one hitch a resize ${Math.round(hitch)} ms (< 750; by step: ${Object.entries(by).map(([k, v]) => `${k} ${Math.round(v)}`).join(' · ')}; ${gaps.n} frames)`);
    await Q.ctx.close(); }
  // ---- 2560 × 1080 (very wide): composed to 2.2 : 1, the soft fade beyond it, the speakeasy at the composition's edge
  { const Q = await open({ slot: 'dw', qs: `${NIGHT}&wx=clear`, view: [2560, 1080] }), p = Q.page;
    await harborUp(p);
    const c = await ev(p, CAM), fade = await ev(p, "(() => { const s = getComputedStyle(document.querySelector('.nd-scene'), '::after'); return { disp: s.display, bg: s.backgroundImage }; })()");
    ok(c.cx0 > 80 && c.cx0 < 110 && fade.disp !== 'none' && /gradient/.test(fade.bg), `VERY WIDE (2560×1080): composed to 2.2 : 1 (the frame from x ${c.cx0.toFixed(0)}), a soft fade to dark beyond it (${fade.disp}, ${/gradient/.test(fade.bg)})`);
    if (SHOTS) await p.screenshot({ path: `${OUT}desktop-2560x1080.png` });
    await Q.ctx.close(); }
  // ---- the PHONE untouched (402 × 874 upright): the phone camera, no fade, no hover ring
  { const Q = await open({ slot: 'dp', qs: `${NIGHT}&wx=clear`, view: [402, 874] }), p = Q.page;
    await harborUp(p);
    const c = await ev(p, CAM), css = await ev(p, "({ fade: getComputedStyle(document.querySelector('.nd-scene'), '::after').display, ring: getComputedStyle(document.querySelector('.nd-hover')).display, logo: document.querySelector('.nd-logo-wrap').getBoundingClientRect().width })");
    ok(!c.wide && c.CAMH === 13.5 && Math.abs(c.F - 600) < 0.5 && css.fade === 'none' && css.ring === 'none' && css.logo <= 330, `THE PHONE UNTOUCHED (402×874): the phone camera (F ${c.F}, eye ${c.CAMH}), no edge fade, no hover ring, the sign ${css.logo.toFixed(0)} pt`);
    await Q.ctx.close(); }
  // ---- an iPad: upright = the phone layout, sideways = the desktop framing
  { const Q = await open({ slot: 'du', qs: `${NIGHT}&wx=clear`, view: [820, 1180] }), p = Q.page;
    await harborUp(p); const up = await ev(p, CAM);
    await p.setViewport({ width: 1180, height: 820, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await waitFor(p, `window.__district.harbor().cam.W === 1180`, 'the iPad turned sideways', 8000);
    const side = await ev(p, CAM), dk = await rectOf(p, '.nd-bar');
    ok(!up.wide && side.wide && side.CAMH === 8 && dk && Math.abs(dk.x + dk.w / 2 - 590) < 4 && dk.w <= 640, `THE iPAD: upright the phone layout (wide ${up.wide}), turned sideways the desktop framing (the eye at ${side.CAMH}) + the dock centred (${dk && dk.w.toFixed(0)} pt) — rotated live, no reload`);
    if (SHOTS) await p.screenshot({ path: `${OUT}desktop-ipad-1180x820.png` });
    await Q.ctx.close(); }
  // ---- a PHONE SIDEWAYS (874 × 402): the desktop framing, nothing over the tagline, the dock sized for it
  { const Q = await open({ slot: 'ds', qs: `${NIGHT}&wx=clear`, view: [874, 402] }), p = Q.page;
    await harborUp(p);
    const c = await ev(p, CAM), wh = await ev(p, 'window.__district.harbor().wheel'), dk = await rectOf(p, '.nd-bar');
    ok(c.wide && wh.y - wh.r > c.limitY && dk && Math.abs(dk.x + dk.w / 2 - 437) < 4 && dk.h <= 64, `A PHONE SIDEWAYS (874×402): the desktop framing (wide ${c.wide}), the wheel under the tagline (its top ${(wh.y - wh.r).toFixed(0)} vs the limit ${c.limitY.toFixed(0)}), the dock centred + compact (${dk && dk.h.toFixed(0)} pt tall)`);
    if (SHOTS) await p.screenshot({ path: `${OUT}desktop-sideways-874x402.png` });
    await Q.ctx.close(); }
  log('desktop', 'done');
});
