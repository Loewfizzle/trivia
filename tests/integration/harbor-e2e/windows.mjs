// CITY 2.0 — THE HARBOR end to end: the `windows` cloud job's groups (windows, snow, doors, blackout) — tests/integration/harbor-jobs.mjs#CI_JOBS.
// Registered with G() in their original order; run through ../e2e-harbor.mjs (JOB=windows, or ONLY=<groups>). Shared helpers: ./kit.mjs.
// ADDING A GROUP: G('name', …) in its job's file (harbor-e2e/<job>.mjs) + the name in ../harbor-jobs.mjs (CI_JOBS).
import { OUT, SHOTS, t0, sleep, ok, okF, okT, GR, open, ev, waitFor, tap, harborUp, G } from './kit.mjs';

// ================================================================ PART 7b — THE SPEAKEASY'S LIFE (ONLY=windows; docs/harbor/passes/part-7b.md)
G('windows', async () => {
  const px = (p, X, Y) => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; res(Array.from(cv.getContext('2d').getImageData(Math.round(${X} * k), Math.round(${Y} * k), 1, 1).data).slice(0, 3)); }))`);
  // a region's mean colour over a grid of 5 × 5 points (pt rect, fractions of it)
  const area = async (p, r, fx0 = 0.2, fx1 = 0.85, fy0 = 0.1, fy1 = 0.9) => { const s = [0, 0, 0]; let n = 0; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const c = await px(p, r.x + r.w * (fx0 + (fx1 - fx0) * i / 4), r.y + r.h * (fy0 + (fy1 - fy0) * j / 4)); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; n++; } return s.map(v => v / n); };
  const lum = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const life = p => ev(p, 'window.__district.harbor().speakeasy.life');
  const wins = async p => Object.fromEntries((await ev(p, 'window.__district.harbor().speakeasy.windows()')).map(w => [w.id, w.rect]));
  const lit = p => waitFor(p, 'window.__district.harbor().speakeasy.k > 0.9 && !window.__district.harbor().pending', 'the rooms lit', 25000);
  // SP4 (the owner: the upper panes rendered non-uniform — the middle ~110 device px, the right ~85, by day at 402): the PAINTED panes
  // measured along a scanline through each upper row — by day the glass's blue runs, at night the lit rooms' bright runs — the fully
  // visible panes (bar / jazz, back / apartment) within 2 % of each other, the two rows alike, at 402 / 390 / 430
  for (const [when, mode] of [['2026-10-22T13:00', 'day'], ['2026-10-22T21:30', 'night']]) {
    const Q = await open({ slot: `wu-${mode}`, qs: `when=${when}${GR}`, view: [402, 874] });
    await harborUp(Q.page); if (mode === 'night') await lit(Q.page); else await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 20000).catch(() => {});
    const runsAt = () => ev(Q.page, `(() => { const hb = window.__district.harbor(), ws = hb.speakeasy.windows(), cv = document.querySelector('.nd-scene canvas'), x = cv.getContext('2d'), k = cv.width / cv.clientWidth, day = ${mode === 'day'};
      const rows = [...new Set(ws.map(q => q.rect.y))].sort((a, b) => a - b);
      return { W: hb.cam.W, rects: ws.map(q => ({ id: q.id, x: +q.rect.x.toFixed(2), y: +q.rect.y.toFixed(2), w: +q.rect.w.toFixed(2), h: +q.rect.h.toFixed(2) })), rows: rows.map(ry => { const r0 = ws.find(q => q.rect.y === ry).rect, y = Math.round((ry + r0.h * 0.5) * k), x1 = Math.round(Math.min(innerWidth, 140) * k), d = x.getImageData(0, y, x1, 1).data, runs = []; let cur = null;
        for (let i = 0; i < x1; i++) { const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], olive = (r > 55 && r < 135 && g > 48 && g < 130 && b < 115 && Math.abs(r - g) < 30 && r >= b - 4) || (r > 165 && g > 140 && b > 100 && r > b + 22 && r >= g - 4), pane = day ? ((b > r + 25 && b > 90) || olive) : (0.2126 * r + 0.7152 * g + 0.0722 * b > 70 && !(r > g + 30 && r > b + 30 && r < 160)); if (pane) { if (!cur) cur = { a: i, b: i }; else cur.b = i; } else if (cur) { if (cur.b - cur.a > 6 * k) runs.push(cur); cur = null; } }
        if (cur && cur.b - cur.a > 6 * k) runs.push(cur);
        return runs.map(q => ({ x: +(q.a / k).toFixed(1), w: +((q.b - q.a + 1) / k).toFixed(1) })).filter(q => q.x > 2); }) }; })()`);
    // (at night the rooms' own content — a dark back room, the people, the TV — breaks a brightness run: the night measure is the rects
    // the rooms are painted into (paintRoom(glassOf(w)) — the same for every window) + their gaps; by day the painted glass itself)
    // (C4d — F12, never passing on CI: the runs are in device px (0.5 pt steps at dpr 2) — 2 % of ~26 pt is ONE device px, so an edge's
    // rounding at each end failed it: a 1-pt allowance (two device px); the rects the rooms are painted into checked by day too; the
    // viewport change waits for the re-bake itself (never a fixed sleep) — then HARD again)
    const rectJudge = (o) => { { const rs = o.rects.slice().sort((p, q) => p.y - q.y || p.x - q.x), rows = [...new Set(rs.map(r => r.y))].map(y => rs.filter(r => r.y === y)); const ws = rs.map(r => r.w), hs = rs.map(r => r.h), mn = Math.min(...ws), mx = Math.max(...ws); const gaps = rows.map(r => r.slice(1).map((q, i) => +(q.x - (r[i].x + r[i].w)).toFixed(1))).flat(); const gmn = Math.min(...gaps), gmx = Math.max(...gaps); return { ok: (mx - mn) / mx <= 0.02 && (gmx - gmn) / gmx <= 0.02 && (Math.max(...hs) - Math.min(...hs)) / Math.max(...hs) <= 0.02, mn, mx, gaps, ws }; } };
    const judge = (o) => { const R = rectJudge(o); if (mode === 'night') return R;
      const rs = o.rows.map(r => r.slice(-2)); const ws = rs.flat().map(r => r.w);
      // (SP5: by day the boss's pane is his DRAWN SHADE — 9c: the cream linen blind (was olive) instead of blue glass: the predicate above counts it)
      if (ws.length < 4) return { ok: false, why: `only ${ws.length} panes seen` }; const mn = Math.min(...ws), mx = Math.max(...ws); const gaps = rs.map(r => r.length === 2 ? +(r[1].x - (r[0].x + r[0].w)).toFixed(1) : null); return { ok: R.ok && mx - mn <= Math.max(0.02 * mx, 1.01), mn, mx, gaps, ws, rects: R.ok }; };
    const seen = [];
    for (const [w, h] of [[402, 874], [390, 844], [430, 932]]) {
      if (w !== 402) { await Q.page.setViewport({ width: w, height: h, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await waitFor(Q.page, `window.__district.harbor().cam.W === ${w}`, 'the re-layout', 8000).catch(() => {}); await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'the re-bake done', 20000).catch(() => {}); }
      // (C4d — F12's real cause: just after the scene reports settled the canvas is still the reveal's black — one cream blind visible,
      // "only 1 pane seen"; ~3 s later every pane reads. Wait for the panes themselves: four painted runs on the two rows, ≤ 12 s)
      // (+ the cloud's next run: four runs read MID-FADE at 402 — "20–27 pt": the panes counted only once two reads 400 ms apart agree)
      let o = await runsAt(), prev = null;
      const sig = q => JSON.stringify(q.rows.map(r => r.slice(-2)));
      for (const t0 = Date.now(); Date.now() - t0 < 15000 && (o.rows.map(r => r.slice(-2)).flat().length < 4 || sig(o) !== prev); ) { prev = sig(o); await new Promise(r => setTimeout(r, 400)); o = await runsAt(); }
      seen.push({ w: o.W, ...judge(o) });
    }
    ok(seen.every(s => s.ok), `THE UPPER PANES EQUAL ON SCREEN (${mode}): ${seen.map(s => `${s.w}: ${s.ok ? 'ok' : 'UNEVEN'} ${s.ws ? `${s.mn}–${s.mx} pt (gaps ${s.gaps.join('/')})` : s.why}`).join(' · ')}`);
    await Q.ctx.close();
  }
  // ---- an ordinary night (Thu 9:30 pm): the schedule runs — something on, or about to start, every ~10–30 s; the rooms' states
  { const Q = await open({ slot: 'w1', qs: `when=2026-10-22T21:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const L0 = await life(Q.page);
    ok(L0.states.bar === 'open' && L0.states.apartment === 'lamp' && L0.states.shop === 'closed' && !L0.forced, `THE ROOMS AT 9:30 PM: the bar open, the apartment's lamp, the shop closed (${JSON.stringify(L0.states)})`);
    ok(L0.on.length > 0 || (L0.next && L0.next.in <= 30), `THE SCHEDULE at night: ${L0.on.length ? `on now: ${L0.on.map(e => `${e.id} in ${e.win}`).join(', ')}` : `the next (${L0.next && L0.next.id}) in ${L0.next && L0.next.in} s`}`);
    // SP3 — ONE STAR WINDOW AT A TIME + THE BIGGER PANES: over ~12 s never two moments (other than a room's routine) at once; the four
    // upper windows equal (2.2 × 2.25 units)
    { const tr = await ev(Q.page, `new Promise(res => { let worst = 0; const t0 = performance.now(); (function lp() { const L = window.__district.harbor().speakeasy.life; worst = Math.max(worst, L.on.filter(e => !['wake', 'shop-open', 'bartender', 'lights-out'].includes(e.id)).length); if (performance.now() - t0 < 12000) setTimeout(lp, 200); else res(worst); })(); })`);
      const W0 = await wins(Q.page), up = ['bar', 'jazz', 'back', 'apartment'].map(id => W0[id]), same = up.every(r => Math.abs(r.w - up[0].w) < 0.6 && Math.abs(r.h - up[0].h) < 0.6);
      ok(tr <= 1 && same, `ONE STAR WINDOW AT A TIME (at most ${tr} moment on at once); the four upper windows equal (${up.map(r => `${r.w.toFixed(1)}×${r.h.toFixed(1)}`).join(', ')} pt)`); }
    // the wall-washers: the pier between the bar + the jazz room lit warm (light on the brick, never the windows)
    // (SP2: the soft V's hot spot under the lamp, the pier between the back room + the apartment — the brightest of a few points down its
    // middle, against the same pier a floor lower where no washer reaches)
    const W = await wins(Q.page), x = (W.back.x + W.back.w + W.apartment.x) / 2, hot = [];
    for (const f of [0.1, 0.18, 0.26, 0.34, 0.42]) hot.push(await px(Q.page, x, W.apartment.y + W.apartment.h * f));
    const pier = hot.reduce((a, b) => (b[0] > a[0] ? b : a)), warm = Math.max(...hot.map(c => c[0] - c[2])), low = await px(Q.page, x, W.jazz.y + W.jazz.h * 0.5);
    okF(pier[0] > low[0] + 12 && warm > Math.max(12, low[0] - low[2] + 6), `THE WALL-WASHERS: the pier lit warm under its lamp (brightest rgb ${pier.join(',')}, warmest +${warm}) vs the same pier a floor down (rgb ${low.join(',')})`);
    // the marquee: its bulbs lit (a warm-white bulb on the blade's frame)
    const mq = await ev(Q.page, 'window.__district.harbor().speakeasy.marquee'), mb = [];
    for (const b of mq.slice(0, 12)) mb.push(lum(await px(Q.page, b.x, b.y)));
    ok(mq.length >= 10 && Math.max(...mb) > 200, `THE MARQUEE: ${mq.length} bulbs on the blade's crest + foot, lit (the brightest of 12: ${Math.max(...mb).toFixed(0)})`);
    const st = await ev(Q.page, 'window.__district.harbor().strings');
    ok(st.on && st.bulbs >= 8 && st.bulbs <= 12, `THE CAFÉ LIGHTS on the roof: ${st.bulbs} bulbs on ${st.runs} swags`);
    // a TAP on the jazz room's window answers (a head peeks out) — the window's kind
    const tap = await ev(Q.page, `window.__district.harbor().speakeasy.hit(${W.jazz.x + W.jazz.w / 2}, ${W.jazz.y + W.jazz.h / 2})`);
    ok(tap && tap.kind === 'window' && tap.id === 'jazz' && tap.tap === 'peek', `A TAP on a window: ${JSON.stringify(tap)}`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}windows-night-402x874.png` });
    await Q.ctx.close(); }
  // ---- a forced moment (the preview link): the dance — the jazz room's shade changes as the couple crosses it (motion, not a still)
  { const Q = await open({ slot: 'w2', qs: `when=2026-10-22T21:30${GR}&force=window&moment=dance`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'dance')", 'the dance on', 15000);
    const r = (await wins(Q.page)).jazz, a = [];
    for (let i = 0; i < 5; i++) { a.push(await area(Q.page, r)); await sleep(900); }
    const ls = a.map(lum), swing = Math.max(...ls) - Math.min(...ls);
    ok(swing > 4, `THE DANCE (forced): the jazz room's shade changes as they cross it (its mean light ${ls.map(v => v.toFixed(0)).join(' → ')})`);
    const L = await life(Q.page);
    ok(L.forced === 'dance' && L.on.every(e => e.id === 'dance'), `THE PREVIEW: only the forced moment plays (${L.on.map(e => e.id).join(', ') || 'between loops'})`);
    await Q.ctx.close(); }
  // ---- the cat on the back room's sill (SP5: never the boss's — the apartment): a large dark silhouette in the lit window; a tap → it leaps off
  { const Q = await open({ slot: 'w3', qs: `when=2026-10-22T21:30${GR}&force=window&moment=cat`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'cat' && e.el > 4 && e.el < 18)", 'the cat settled', 20000);
    const r = (await wins(Q.page)).back, c = await area(Q.page, r, 0.62, 0.78, 0.65, 0.85);
    ok(lum(c) < 60, `THE CAT on the sill: a dark silhouette against the lamp-lit room (rgb ${c.map(v => v.toFixed(0)).join(',')})`);
    const tap = await ev(Q.page, `window.__district.harbor().speakeasy.hit(${r.x + r.w * 0.7}, ${r.y + r.h * 0.75})`);
    await sleep(1200);
    const c2 = await area(Q.page, r, 0.62, 0.78, 0.65, 0.85);
    ok(tap && tap.kind === 'cat' && lum(c2) > lum(c) + 25, `A TAP on the cat: it leaps off (${lum(c).toFixed(0)} → ${lum(c2).toFixed(0)})`);
    await Q.ctx.close(); }
  // ---- 11:30 pm: THE TV GLOW upstairs (blue, irregular), the lone late TVs across the skyline
  { const Q = await open({ slot: 'w4', qs: `when=2026-10-22T23:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const L = await life(Q.page), r = (await wins(Q.page)).apartment, a = [];
    for (let i = 0; i < 8; i++) { a.push(await area(Q.page, r, 0.2, 0.8, 0.3, 0.9)); await sleep(350); }
    // (on average: now and then a WARM scene on the TV — real TV light isn't always blue)
    const mean = [0, 1, 2].map(i => a.reduce((t, c) => t + c[i], 0) / a.length), blue = mean[2] > mean[0] + 12, ls = a.map(lum), swing = Math.max(...ls) - Math.min(...ls);
    ok(L.states.apartment === 'tv' && blue, `THE TV GLOW (11:30 pm): the apartment blue (mean rgb ${mean.map(v => v.toFixed(0)).join(',')})`);
    okT(swing > 3, `THE TV GLOW flickers (its light ${ls.map(v => v.toFixed(0)).join(' ')})`);
    const w = await ev(Q.page, 'window.__district.harbor().windows');
    ok(w.lateTvs >= 4 && w.lateK > 0.9, `THE LATE TVs: ${w.lateTvs} lone windows flickering blue across the skyline (level ${w.lateK})`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}windows-tv-402x874.png` });
    await Q.ctx.close(); }
  // ---- 3:30 am: NEVER FULLY DARK — the bar's last light + the sweeping, the edge window's lamp; SP3: the TV room dark (the owner)
  { const Q = await open({ slot: 'w5', qs: `when=2026-10-22T03:30${GR}`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const L = await life(Q.page), W = await wins(Q.page), ap = await area(Q.page, W.apartment), bar = await area(Q.page, W.bar);
    ok(L.states.apartment === 'dark' && L.states.bar === 'last' && ap[0] < 40 && bar[0] > 60 && bar[0] > bar[2] + 25, `NEVER FULLY DARK (3:30 am) — SP3: the TV room DARK after its TV (rgb ${ap.map(v => v.toFixed(0)).join(',')}), the bar's last light (rgb ${bar.map(v => v.toFixed(0)).join(',')}) + the edge window's lamp`);
    await Q.ctx.close(); }
  // ---- the hidden mirror door (forced, 10:30 pm): the shop window glows amber while it stands open
  { const Q = await open({ slot: 'w6', qs: `when=2026-10-22T22:30${GR}&force=window&moment=mirror`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const shop = await ev(Q.page, '(() => { const s = window.__district.harbor().speakeasy, p = s.poleRect, k = window.__district.harbor().cam.F / 600; return { x: p.x - 34 * k, y: p.y + p.h * 0.1, w: 24 * k, h: p.h * 0.3 }; })()');   // (8P: the glass ABOVE the hush word sign)
    await waitFor(Q.page, '!window.__district.harbor().speakeasy.life.on.length', 'between the loops (shut)', 15000);
    const shut = await area(Q.page, shop);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'mirror' && e.el > 2.5 && e.el < 5.5)", 'the mirror open', 15000);
    const open1 = await area(Q.page, shop);
    ok(lum(open1) > lum(shut) + 8 && open1[0] > open1[2] + 40, `THE MIRROR DOOR: the shop glows amber while it stands open (${lum(shut).toFixed(0)} → ${lum(open1).toFixed(0)})`);
    await Q.ctx.close(); }
  // ---- by day (12:30): the shop open (the barber at work), the bar closed
  { const Q = await open({ slot: 'w7', qs: `when=2026-10-22T12:30${GR}`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, '!window.__district.harbor().pending', 'settled', 20000);
    // (11a-1: on a slow runner the life's first frame can land after 'settled' — its states were read empty once in the cloud)
    await waitFor(Q.page, '!!(window.__district.harbor().speakeasy.life.states || {}).shop', "the rooms' states", 10000).catch(() => {});
    const L = await life(Q.page);
    ok(L.states.shop === 'open' && L.states.bar === 'closed', `BY DAY: the barbershop open, the bar closed (${JSON.stringify(L.states)})`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}windows-day-402x874.png` });
    await Q.ctx.close(); }
  // ================================================================ WIN — THE WINDOW BUGS (the owner's SP4 phone review)
  // the moments' motion trace: every rAF — the drawn count, the 60-fps reason, every window figure (windows.js#TRACE: window, waist, arms)
  const winTrace = secs => `new Promise(res => { const D = window.__district, out = [], t0 = performance.now();
    (function loop() { const h = D.harbor(), lp = D.loop(), L = h.speakeasy.life;
      out.push({ t: performance.now(), drawn: lp ? lp.drawn : 0, fast: h.rate ? h.rate.fast : '', on: L.on.map(e => e.id + '@' + e.win), figs: L.figs });
      if (performance.now() - t0 < ${secs * 1000}) requestAnimationFrame(loop); else res(out); })(); })`;
  // ---- THE TOAST AT 60 FPS with nobody walking (measured: the saver's 30 fps + its 30 ↔ 60 flips were the choppiness — now a window
  // moment is a 60-fps reason), and its arms EASED: no stepped updates, no snap inside a cycle
  { const Q = await open({ slot: 'w-fps', qs: `when=2026-10-22T21:30${GR}&force=window,no-people,no-wildlife&moment=toast`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'toast' && e.el < 1)", 'a toast starting', 25000);
    const fr = await ev(Q.page, winTrace(6));
    const drawn = fr.filter((f, i) => i > 0 && f.drawn !== fr[i - 1].drawn), onFrames = fr.filter(f => f.on.length);
    const fastShare = onFrames.filter(f => f.fast).length / Math.max(1, onFrames.length), why = [...new Set(onFrames.map(f => f.fast))];
    const drawnShare = drawn.length / Math.max(1, fr.length - 1);
    // (the reason may read 'window' or whatever else kept the city fast that second — the neon, the sky — what matters is EVERY frame was)
    ok(fr.length > 60 && fastShare >= 0.95, `THE TOAST KEEPS 60 FPS with nobody walking: ${Math.round(fastShare * 100)} % of its frames fast (${why.join(', ') || 'none'})`);
    okT(drawnShare >= 0.9, `THE TOAST IS DRAWN EVERY FRAME: ${drawn.length} of ${fr.length - 1} rAF frames drawn (${Math.round(drawnShare * 100)} %)`);
    // the arms: per drawn frame, each figure's biggest arm move (dt-normalised to 60 fps), inside one cycle (the same figures in the window)
    // (judged PER FIGURE: each one's own series — a stop-then-double frame is one under a quarter of ITS median beside one over 1.5×)
    let maxStep = 0, judder = 0, n = 0, total = 0; const series = new Map(), meds = [];
    for (let i = 1; i < drawn.length; i++) {
      const a = drawn[i - 1], b = drawn[i]; if (!a.figs || !b.figs || a.figs.length !== b.figs.length || !a.on.length || !b.on.length) continue;
      const dt = Math.max(0.5, (b.t - a.t) / 16.7);
      for (let k = 0; k < b.figs.length; k++) { const p = a.figs[k], q = b.figs[k]; if (!p.arms || !q.arms || p.w !== q.w || Math.abs(p.x - q.x) > 0.3 || p.s !== q.s || Math.abs(p.d - q.d) > 0.1) continue; /* (WIN2: the same figure — its size + its depth; the walk-in re-sorts the list) */ const d = Math.max(...[0, 1].flatMap(j => [Math.abs(q.arms[j][0] - p.arms[j][0]), Math.abs(q.arms[j][1] - p.arms[j][1])])) / dt; (series.get(k) || series.set(k, []).get(k)).push(d); }   // (the biggest single JOINT move, like PEO's dancers)
    }
    for (const steps of series.values()) {
      const moving = steps.filter(v => v > 0.004).sort((a, b) => a - b); if (moving.length < 20) continue;
      const med = moving[Math.floor(moving.length / 2)]; meds.push(med); n += moving.length; total += steps.length; maxStep = Math.max(maxStep, moving[moving.length - 1]);
      for (let i = 1; i < steps.length - 1; i++) if (steps[i] < med * 0.25 && (steps[i - 1] > med * 1.5 || steps[i + 1] > med * 1.5)) judder++;
    }
    // (WIN2: the biggest single step is a TIMING check — the runner read 0.20 then 0.31 rad a frame on the walk-in's blends at its slow
    // frame rate; the judder count (a stop then a double step: the real snap) stays a hard check)
    okT(maxStep < 0.25, `THE TOAST'S BIGGEST ARM STEP ${maxStep.toFixed(4)} rad a frame (${(maxStep * 60).toFixed(1)} rad/s) under 0.25`);
    ok(n > 60 && judder <= Math.max(3, total * 0.03), `THE TOAST'S ARMS ARE EASED: ${series.size} figures, ${n} moving frames, median joint moves of ${meds.map(v => v.toFixed(3)).join(' / ')} rad/frame, the biggest ${maxStep.toFixed(4)} (${(maxStep * 60).toFixed(1)} rad/s — never a snap), ${judder} stop-then-double frames of ${total}`);
    await Q.ctx.close(); }
  // ---- ONE WINDOW AT A TIME — the tango (legendary, 'all' windows): its figures cross ONE pane at a time; no passer-by elsewhere while it plays
  { const Q = await open({ slot: 'w-one', qs: `when=2026-10-22T21:30${GR}&force=window,no-people,no-wildlife&moment=tango`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'tango' && e.el > 0.5)", 'the tango on', 25000);
    const fr = await ev(Q.page, winTrace(12));
    // a window MOVES in a frame when one of its figures stands where none stood the frame before (the steady ones — the bartender, the
    // patron, the sax player — keep their x; a crossing couple changes it every frame)
    let worst = 0, total = 0; const seen = new Set();
    for (let i = 1; i < fr.length; i++) {
      if (!fr[i].on.length || fr[i].drawn === fr[i - 1].drawn) continue;
      const prev = new Map(); for (const g of fr[i - 1].figs || []) (prev.get(g.w) || prev.set(g.w, []).get(g.w)).push(g.x);
      const moving = new Set();
      for (const g of fr[i].figs || []) { const xs = prev.get(g.w) || []; if (!xs.some(x => Math.abs(x - g.x) < 0.0015)) moving.add(g.w); }
      worst = Math.max(worst, moving.size); total++; for (const w of moving) seen.add(w);
    }
    ok(total > 100 && worst <= 1 && seen.size >= 2, `ONE WINDOW AT A TIME through the tango: at most ${worst} window with moving figures in any of ${total} frames (it visited ${[...seen].join(', ')})`);
    await Q.ctx.close(); }
  // ---- THE HUSH SIGN NEVER OUTLIVES ITS FORCE (the owner's "JAZZ over the sax solo": a stale JUST ME &force=hushsign): the panel forces
  // it, then clears it — the word + its overlay go at once
  { const Q = await open({ slot: 'w-hush', qs: `when=2026-10-22T22:30${GR}&force=window&moment=sax&panel=1`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, '!!window.__district.remote()', 'the panel', 10000);
    await ev(Q.page, "window.__district.remote().setMine({ force: ['hushsign', 'window-sax'] })");
    await waitFor(Q.page, "window.__district.harbor().speakeasy.hush().text === 'JAZZ'", 'the forced JAZZ', 8000);
    await ev(Q.page, "window.__district.remote().setMine({ force: ['window-sax'] })");
    const gone = await waitFor(Q.page, "(() => { const h = window.__district.harbor().speakeasy.hush(); return !h.text && !h.overlay; })()", 'the sign gone', 4000).then(() => true).catch(() => false);
    const hs = await ev(Q.page, 'window.__district.harbor().speakeasy.hush()');
    ok(gone, `THE HUSH SIGN CLEARS WITH ITS FORCE: forced JAZZ, then the force dropped → text ${hs.text}, overlay ${hs.overlay}`);
    await Q.ctx.close(); }
  // ---- THE GHOST'S EYES: two big hollow eyes + a mouth — dark holes inside the pale sheet, readable at 402
  { const Q = await open({ slot: 'w-ghost', qs: `when=2026-10-22T22:00${GR}&force=window&moment=ghost`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'ghost' && e.el > 4.6 && e.el < 6.4)", 'the ghost at the glass', 30000);
    const win = (await ev(Q.page, 'window.__district.harbor().speakeasy.life.on[0].win')), r = (await wins(Q.page))[win];
    const holes = await ev(Q.page, `(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, x0 = Math.round(${r.x} * k), y0 = Math.round(${r.y} * k), w = Math.round(${r.w} * k), h = Math.round(${r.h} * k);
      const d = cv.getContext('2d').getImageData(x0, y0, w, h).data, L = (i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      let bx0 = 1e9, bx1 = -1, by0 = 1e9, by1 = -1, bright = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (L(i) > 150 && d[i + 1] > d[i] - 10) { bright++; bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); } }
      if (bright < 40) return { bright, holes: 0 };
      // the holes: dark pixels inside the sheet's box whose row + column both hold bright pixels on BOTH sides (inside the pale cloth)
      let holes = 0; const rows = [], cols = [];
      for (let y = by0; y <= by1; y++) { let a = -1, b = -1; for (let x = bx0; x <= bx1; x++) { const i = (y * w + x) * 4; if (L(i) > 150) { if (a < 0) a = x; b = x; } } rows[y] = [a, b]; }
      for (let x = bx0; x <= bx1; x++) { let a = -1, b = -1; for (let y = by0; y <= by1; y++) { const i = (y * w + x) * 4; if (L(i) > 150) { if (a < 0) a = y; b = y; } } cols[x] = [a, b]; }
      for (let y = by0; y <= by1; y++) for (let x = bx0; x <= bx1; x++) { const i = (y * w + x) * 4; if (L(i) < 80 && rows[y][0] >= 0 && x > rows[y][0] + 1 && x < rows[y][1] - 1 && cols[x][0] >= 0 && y > cols[x][0] + 1 && y < cols[x][1] - 1) holes++; }
      return { bright, holes, box: [bx1 - bx0, by1 - by0], k }; })()`);
    ok(holes.bright >= 40 && holes.holes >= 24, `THE GHOST'S EYES + MOUTH: ${holes.holes} dark device px of holes inside the pale sheet (${holes.bright} px of sheet, ${holes.box ? holes.box.join('×') : '?'} at ${holes.k}×) in the ${win} window`);
    await Q.ctx.close(); }
  // ---- WIN — 2.5D ROOMS: the people at DEPTH — in the bar the bartender stands deeper (0.55) than the patrons at the counter (0.28): the
  // trace carries each figure's depth; a deeper figure is drawn through a smaller scale (the box's scale(t)); the rooms' boxes exist
  { const Q = await open({ slot: 'w-deep', qs: `when=2026-10-22T21:30${GR}&force=window,no-people,no-wildlife&moment=toast`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'toast' && e.el > e.len * 0.3 && e.el < e.len * 0.7)", 'the toast on (walked in)', 25000);   // (WIN2: after the friends' walk-in)
    const figs = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => res(window.__district.harbor().speakeasy.life.figs)))`);
    const bar = (figs || []).filter(g => g.w === 'bar'), depths = [...new Set(bar.map(g => g.d))].sort((a, b) => a - b);
    const deepest = bar.reduce((a, g) => (g.d > a.d ? g : a), { d: -1 }), nearest = bar.reduce((a, g) => (g.d < a.d ? g : a), { d: 9 });
    ok(bar.length >= 3 && depths.length >= 2 && deepest.d > nearest.d && deepest.d >= 0.5 && nearest.d <= 0.3, `PEOPLE AT DEPTH in the bar: ${bar.length} figures at depths ${depths.join(' / ')} — the deepest (${deepest.d}: the bartender) behind the nearest (${nearest.d}: the patrons)`);
    const box = await ev(Q.page, 'window.__district.harbor().speakeasy.life.box');
    ok(box && box.faces && box.faces.includes('floor') && box.faces.includes('left') && !box.faces.includes('ceiling') && box.k < 1, `THE BOX: the bar's room shows its ${box && box.faces.join(' + ')}, the back wall at ${box && box.k} of the glass (${box && box.floorU} units of floor, ${box && box.leftU} of left wall)`);
    await Q.ctx.close(); }
  // ---- WIN — THE TV ROOM LIT BY THE UNSEEN SET: the room blue, REAL flicker (irregular jumps, a wide swing over 6 s), the set never drawn
  // (no bright rectangle on the back wall — the brightest run of the pane is its lower right, where the light comes from)
  { const Q = await open({ slot: 'w-tv', qs: `when=2026-10-22T23:10${GR}&force=smoke`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const r = (await wins(Q.page)).apartment, lv = [];
    for (let i = 0; i < 24; i++) { lv.push(lum(await area(Q.page, r, 0.25, 0.75, 0.2, 0.8))); await sleep(250); }
    const jumps = lv.filter((v, i) => i && Math.abs(v - lv[i - 1]) > 6).length, swing = Math.max(...lv) - Math.min(...lv);
    ok(swing > 8 && jumps >= 1, `THE TV ROOM FLICKERS (SP5: calmer — the owner's nudge): its light swings ${swing.toFixed(0)} over 6 s with ${jumps} hard jumps (${lv.map(v => v.toFixed(0)).join(' ')})`);
    const c = await area(Q.page, r, 0.3, 0.7, 0.3, 0.7);
    ok(c[2] > c[0] + 12 && c[2] > c[1], `THE ROOM IS BLUE (rgb ${c.map(v => v.toFixed(0)).join(',')})`);
    // WIN3 — THE BOSS's ROOM (the owner: you never saw the person — the mystery is the point): NO FIGURE in the apartment over 3 s of frames;
    // the light comes from BELOW THE SILL — the pane's upper band (the ceiling + the back wall's top) brighter than the band at the sill
    { const fr = await ev(Q.page, winTrace(3)), inApt = fr.reduce((n, f) => n + ((f.figs || []).filter(g => g.w === 'apartment').length), 0);
      const up = lum(await area(Q.page, r, 0.35, 0.95, 0.05, 0.3)), low = lum(await area(Q.page, r, 0.35, 0.95, 0.85, 1)), tv = await ev(Q.page, 'window.__district.harbor().speakeasy.life.tv');
      ok(fr.length >= 12 && inApt === 0 && up > low + 10 && tv && tv.k > 0 && !tv.off, `THE BOSS's ROOM: nobody in it over ${fr.length} frames (${inApt} figures), the glow thrown UP from below the sill (the upper band ${up.toFixed(0)} vs the sill's ${low.toFixed(0)}), the set's light ${tv && tv.k}`); }
    // the set is not drawn: the pane's brightest 5 × 5 cell is never a bright rectangle in the UPPER half (where the old set stood)
    const grid = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, x0 = Math.round(${r.x} * k), y0 = Math.round(${r.y} * k), w = Math.round(${r.w} * k), h = Math.round(${r.h} * k), d = cv.getContext('2d').getImageData(x0, y0, w, h).data, out = [];
      for (let j = 0; j < 5; j++) { const row = []; for (let i = 0; i < 5; i++) { let s = 0, n = 0; for (let y = Math.floor(j * h / 5); y < Math.floor((j + 1) * h / 5); y++) for (let x = Math.floor(i * w / 5); x < Math.floor((i + 1) * w / 5); x++) { const q = (y * w + x) * 4; s += 0.2126 * d[q] + 0.7152 * d[q + 1] + 0.0722 * d[q + 2]; n++; } row.push(s / n); } out.push(row); } res(out); }))`);
    // (no bright rectangle anywhere — the old set read ~150+ at the back wall's centre; the light lands low right, where the unseen set is)
    const cells = grid.flat(), maxC = Math.max(...cells), meanC = cells.reduce((a, b) => a + b, 0) / cells.length;
    okF(maxC < 175 && maxC < meanC * 3.2,   // (11a-2: the set brighter + a lighter blue at the owner's ask — 140 → 175; never a bright screen: the ratio holds)
      `THE SET IS NEVER SEEN (WIN2: option B — the viewers' lit faces read ~120, the set stays below the sill): the pane's brightest 5×5 cell ${maxC.toFixed(0)} against its mean ${meanC.toFixed(0)} — never a bright screen on the wall (the old set read 150+)`);
    await Q.ctx.close(); }
  // ---- WIN — COUNTING THE CASH (forced): the back room green under the banker's lamp, a lit figure, the pane changing as he counts
  { const Q = await open({ slot: 'w-cash', qs: `when=2026-10-22T23:10${GR}&force=window&moment=cash`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'cash' && e.el > 7.5)", 'the count on (SP5: after the walk-up)', 36000);
    const r = (await wins(Q.page)).back, c = await area(Q.page, r, 0.1, 0.9, 0.1, 0.9), figs = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => res(window.__district.harbor().speakeasy.life.figs)))`);
    const man = (figs || []).find(g => g.w === 'back' && !g.sil);
    ok(c[1] > c[0] + 4 && c[1] > c[2] + 6 && !!man && man.s >= 1.3, `THE CASH COUNT: the back room green (rgb ${c.map(v => v.toFixed(0)).join(',')}), a lit close-up figure (s ${man && man.s} at depth ${man && man.d})`);
    const a = [], L0 = await ev(Q.page, 'window.__district.harbor().speakeasy.life');
    for (let i = 0; i < 5; i++) { a.push(await area(Q.page, r, 0.3, 0.9, 0.1, 0.45)); await sleep(400); }
    const ls = a.map(lum), moved = Math.max(...ls) - Math.min(...ls);
    okT(moved > 1.5, `THE BILLS MOVE: the table's light changes as he counts (${ls.map(v => v.toFixed(1)).join(' → ')}) — ${JSON.stringify(L0.on)}`);
    // SP5 — THE WALK-UP FIRST (the owner: he snapped in), THEN THE CLOSE-UP with ONE PAIR OF ARMS (the owner: four arms — the kit's + the
    // counting hands): at el < 1.2 s of the next loop the figure is deep in the room (its trace d ≥ 0.45, small); by el ~7 s he is at the
    // table (d ≈ 0.24, s 1.7) with the kit's hands OFF (one rig: cash.phase past 'walk'); NATURAL HANDS on a rhythm — the flicks counted, a
    // lick, the square-up, the band, the brick set aside
    await waitFor(Q.page, "(() => { const e = window.__district.harbor().speakeasy.life.on.find(o => o.id === 'cash'); return e && e.el > 0.5 && e.el < 1.8; })()", 'the next loop', 32000);
    const first = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => requestAnimationFrame(() => res({ figs: window.__district.harbor().speakeasy.life.figs, cash: window.__district.harbor().speakeasy.life.cash }))))`);
    const deep0 = (first.figs || []).find(g => g.w === 'back' && g.d >= 0.45);
    await waitFor(Q.page, "(() => { const e = window.__district.harbor().speakeasy.life.on.find(o => o.id === 'cash'); return e && e.el > 6.5; })()", 'at the table', 12000);
    const atT = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => res({ figs: window.__district.harbor().speakeasy.life.figs, cash: window.__district.harbor().speakeasy.life.cash })))`);
    const big = (atT.figs || []).find(g => g.w === 'back' && g.s >= 1.6 && g.d < 0.3), nBack = (atT.figs || []).filter(g => g.w === 'back').length;
    const phases = new Set(); let flicks0 = atT.cash ? atT.cash.flicks : 0, flicksN = flicks0;
    const tEnd = Date.now() + 20000; while (Date.now() < tEnd) { const cs = await ev(Q.page, 'window.__district.harbor().speakeasy.life.cash'); if (cs) { phases.add(cs.phase); flicksN = Math.max(flicksN, cs.flicks); } await sleep(120); }
    ok(!!deep0 && !!big && nBack === 1 && first.cash && first.cash.phase === 'walk' && atT.cash && atT.cash.phase !== 'walk' && flicksN - flicks0 >= 20 && ['count', 'lick', 'square', 'band', 'aside'].every(ph => phases.has(ph)), `THE WALK-UP, THEN THE CLOSE-UP: deep in the room at el ${first.cash && first.cash.el} (d ${deep0 && deep0.d}, ${first.cash && first.cash.phase}), at the table by 7 s (s ${big && big.s}, d ${big && big.d}, ${atT.cash && atT.cash.phase}; ${nBack} figure in the room — one rig), the hands on a rhythm: ${flicksN - flicks0} bills flicked in 20 s, the phases ${[...phases].join(' → ')}`);
    await Q.ctx.close(); }
  // ================================================================ WIN2 — THE WINDOWS READ AS-IS (judged unzoomed at 402)
  // ---- THE TOAST's WALK-IN: the two friends come up through the room's depth (their depth falling from ~0.78 toward 0.14 over the first
  // quarter — never a cut: no frame jumps more than 0.06 of depth), raise both arms high, and drift back the same way
  { const Q = await open({ slot: 'w2-walk', qs: `when=2026-10-22T21:30${GR}&force=window,no-people,no-wildlife&moment=toast`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'toast' && e.el < 0.4)", 'a toast starting', 25000);
    const fr = await ev(Q.page, winTrace(3.2)), ds = [];
    // (the friends: the two figures sharing ONE depth in the frame — the bartender keeps his own)
    for (const f of fr) { const g = (f.figs || []).filter(q => q.w === 'bar' && !q.sil), cnt = new Map(); for (const q of g) cnt.set(q.d, (cnt.get(q.d) || 0) + 1); const pair = [...cnt.entries()].find(([, n]) => n >= 2); if (pair) ds.push(pair[0]); }
    let jump = 0; for (let i = 1; i < ds.length; i++) jump = Math.max(jump, Math.abs(ds[i] - ds[i - 1]));
    ok(ds.length > 60 && ds[0] > 0.6 && ds[ds.length - 1] < 0.3 && jump < 0.06, `THE TOAST WALKS IN: the friends' depth ${ds[0] && ds[0].toFixed(2)} → ${ds.length && ds[ds.length - 1].toFixed(2)} over 3 s, the biggest step ${jump.toFixed(3)} (never a cut)`);
    await Q.ctx.close(); }
  // ---- WIN3 — THE BOSS's ROOM LATE (~1 am): the flicker IRREGULAR in the light's own trace (jumps at uneven gaps, never a pulse), the
  // late mode on (the channel flipping comes in bursts); the room still blue, still nobody
  { const Q = await open({ slot: 'w3-late', qs: `when=2026-10-23T01:12${GR}&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const ks = []; const t0 = Date.now();
    while (Date.now() - t0 < 9000) { const tv = await ev(Q.page, 'window.__district.harbor().speakeasy.life.tv'); if (tv) ks.push(tv.k); await sleep(60); }
    const iv = []; { let last = -1; ks.forEach((v, i) => { if (i && Math.abs(v - ks[i - 1]) > 0.2) { if (last >= 0) iv.push(i - last); last = i; } }); }
    const jumps = iv.length + 1, mean = iv.reduce((p, q) => p + q, 0) / Math.max(1, iv.length), sd = Math.sqrt(iv.reduce((p, q) => p + (q - mean) ** 2, 0) / Math.max(1, iv.length));
    const late = await ev(Q.page, 'window.__district.harbor().speakeasy.life.tv.late'), figs = await ev(Q.page, winTrace(1.5));
    ok(ks.length > 100 && jumps >= 3 && sd / mean > 0.4 && late && figs.every(f => !(f.figs || []).some(g => g.w === 'apartment')), `THE FLICKER IS IRREGULAR (1 am): ${jumps} jumps in 9 s, the gaps' spread ${(sd / mean).toFixed(2)} of their mean (never periodic), the late mode ${late}, still nobody`);
    await Q.ctx.close(); }
  // (NIGHT-C: the parked rooms' panes are DARK DRAWN BLINDS now — the cloth + its hem a touch above a black pane: < 40)
  // ---- WIN3 — A QUIET NIGHT (Oct 21 2026 is one): by 1:30 am every other room has gone to bed — the bar, the jazz club, the back room and
  // both edge windows dark — and the boss's blue glow is the ONLY light on the building; a normal night keeps its life around it
  { const Q = await open({ slot: 'w3-quiet', qs: `when=2026-10-22T01:30${GR}&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page); await sleep(1200);
    const L = await ev(Q.page, 'window.__district.harbor().speakeasy.life'), W = await wins(Q.page);
    const lums = {}; for (const id of ['bar', 'jazz', 'back', 'edge2', 'edge3', 'apartment']) if (W[id]) lums[id] = lum(await area(Q.page, W[id], 0.15, 0.85, 0.15, 0.85));
    const others = ['bar', 'jazz', 'back', 'edge2', 'edge3'].filter(id => lums[id] != null);
    ok(L.quiet && L.bed && others.every(id => L.bed[id] === 0) && others.every(id => lums[id] < (['bar', 'jazz', 'back'].includes(id) ? 40 : 30)) && lums.apartment > Math.max(...others.map(id => lums[id])) + 12 && L.states.apartment === 'tv',
      `A QUIET NIGHT at 1:30: quiet ${L.quiet}, the beds ${JSON.stringify(L.bed)}, the panes ${Object.entries(lums).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(' · ')} — the TV the only light on`);
    await Q.ctx.close();
    const N = await open({ slot: 'w3-norm', qs: `when=2026-10-23T01:30${GR}&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(N.page); await lit(N.page);
    const L2 = await ev(N.page, 'window.__district.harbor().speakeasy.life');
    // (NIGHT-C — THE QUIET BUILDING: on every non-party night the bar, the jazz room + the back room are PARKED behind their blinds, their
    // lamps out one by one by ~1:30 — a quiet night is now the night the side rooms go to bed too)
    ok(!L2.quiet && L2.bed && L2.bed.edge2 === 1 && L2.bed.edge3 === 1 && L2.parkOn && ['bar', 'jazz', 'back'].every(id => L2.park[id] === 1), `A NORMAL NIGHT at 1:30: quiet ${L2.quiet}, the side rooms awake, the rest parked (${JSON.stringify(L2.bed)} · parked ${JSON.stringify(L2.park)})`);
    await N.ctx.close(); }
  // ---- SP5 — THE BOSS's ROOM BY DAY (the owner: the shade drawn all day — the one window that never opens to the daylight; never a person):
  // at 1 pm the apartment's pane is the PALE drawn linen blind (9c — the owner's pick: the building's cream blind; was a dark olive) beside the back room's glass, its day plan runs (a peek / the cigar smoke / a shadow), no figure
  { const Q = await open({ slot: 'w-bossday', qs: `when=2026-10-27T13:00${GR}&wx=clear`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1200);
    const W = await wins(Q.page), apt = lum(await area(Q.page, W.apartment, 0.2, 0.8, 0.25, 0.85)), back = lum(await area(Q.page, W.back, 0.2, 0.8, 0.25, 0.85));
    const B = await ev(Q.page, 'window.__district.harbor().speakeasy.life.boss'), fr = await ev(Q.page, winTrace(2)), inApt = fr.reduce((n, f) => n + ((f.figs || []).filter(g => g.w === 'apartment').length), 0);
    ok(B && B.signal === 0 && !B.party && apt > back + 12 && inApt === 0, `THE BOSS's ROOM BY DAY: the shade drawn (its pane ${apt.toFixed(0)} vs the back room's ${back.toFixed(0)}), no tell on a Tuesday (${B && B.signal}), nobody in it (${inApt} figures over ${fr.length} frames)`);
    // NIGHT-A2 (the owner: "he's a night owl" — the blind FULLY DOWN all day): the pane's foot, just above the sill, is the same linen —
    // no dark strip (C4a … NIGHT-A: a 10 % gap at the sill read as an open hole)
    { const sill = lum(await area(Q.page, W.apartment, 0.2, 0.8, 0.84, 0.9));   // (the pane runs 0.05–0.93 of the box; the old strip: its bottom 10 %)
      ok(sill > back + 12 && sill > apt - 45, `THE BOSS's BLIND FULLY DOWN BY DAY: the pane's foot ${sill.toFixed(0)} — the linen (the blind's middle ${apt.toFixed(0)}), never the dark strip (the back room's glass ${back.toFixed(0)})`); }
    await Q.ctx.close(); }
  // ---- SP5 — THE BOOTLEGGERS' TELL: Saturday 5:30 pm (the big delivery at ~6:30) — the violet lamp + the spade behind the shade (the pane
  // VIOLET: blue over red over green), the pane's middle darker than its sides (the spade); the same hour on a Tuesday: no violet
  { const Q = await open({ slot: 'w-tell', qs: `when=2026-10-24T17:30${GR}&wx=clear`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1200);
    const W = await wins(Q.page), c = await area(Q.page, W.apartment, 0.15, 0.85, 0.3, 0.8), mid = lum(await area(Q.page, W.apartment, 0.4, 0.6, 0.42, 0.62)), side = lum(await area(Q.page, W.apartment, 0.05, 0.2, 0.42, 0.62));
    const B = await ev(Q.page, 'window.__district.harbor().speakeasy.life.boss');
    ok(B && B.signal === 1 && c[2] > c[1] + 25 && c[0] > c[1] + 8 && mid < side - 8, `THE TELL (Saturday 5:30 pm): lit ${B && B.signal}, the pane violet (rgb ${c.map(v => v.toFixed(0)).join(',')}), the spade dark in its middle (${mid.toFixed(0)} vs ${side.toFixed(0)} at the side)`);
    await Q.ctx.close();
    const Q2 = await open({ slot: 'w-notell', qs: `when=2026-10-27T17:30${GR}&wx=clear`, view: [402, 874] });
    await harborUp(Q2.page); await sleep(1200);
    const W2 = await wins(Q2.page), c2 = await area(Q2.page, W2.apartment, 0.15, 0.85, 0.3, 0.8), B2 = await ev(Q2.page, 'window.__district.harbor().speakeasy.life.boss');
    ok(B2 && B2.signal === 0 && !(c2[2] > c2[1] + 25 && c2[0] > c2[1] + 8), `NO TELL on a Tuesday at 5:30 pm (signal ${B2 && B2.signal}, rgb ${c2.map(v => v.toFixed(0)).join(',')})`);
    await Q2.ctx.close(); }
  // ---- SP5 — THE BOSS AT THE SHADE (a party night: the window party on; his shade all the way down glowing with the set's light, his
  // shadow standing against it now + then with the cigar's ember — forced here so a stand comes within the wait)
  { const Q = await open({ slot: 'w-watch', qs: `when=2026-10-24T22:30${GR}&wx=clear&force=window-party,boss-watch`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    // (11a-2: he WALKS UP — the shadow sharpening as he nears the shade — then stands; the demo cycle from the flag)
    const walk = []; { const t0 = Date.now(); while (Date.now() - t0 < 25000) { const B = await ev(Q.page, 'window.__district.harbor().speakeasy.life.boss'); const w = B && B.watch; if (w) walk.push({ ph: w.phase, n: w.near }); if (w && w.phase === 'stand' && w.a > 0.95) break; await sleep(150); } }
    const ups = walk.filter(w => w.ph === 'up');
    ok(ups.length >= 3 && ups.some(w => w.n < 0.6) && ups.every((w, i) => !i || w.n >= ups[i - 1].n - 1e-6) && walk.some(w => w.ph === 'stand'), `THE BOSS WALKS UP to the shade: ${ups.length} frames walking (near ${ups.map(w => w.n.toFixed(2)).slice(0, 6).join(' → ')}…), then he stands`);
    const seen = await waitFor(Q.page, '(() => { const B = window.__district.harbor().speakeasy.life.boss; return B && B.party && B.watch && B.watch.a > 0.95; })()', 'his shadow at the shade', 90000).then(() => true).catch(() => false);
    const B = await ev(Q.page, 'window.__district.harbor().speakeasy.life.boss'), W = await wins(Q.page);
    const col = await area(Q.page, W.apartment, 0.05, 0.2, 0.3, 0.7), midL = lum(await area(Q.page, W.apartment, Math.max(0, (B && B.watch ? B.watch.x : 0.5) - 0.08), Math.min(1, (B && B.watch ? B.watch.x : 0.5) + 0.08), 0.35, 0.6)), sideL = lum(col);
    const fr = await ev(Q.page, winTrace(1.5)), inApt = fr.reduce((n, f) => n + ((f.figs || []).filter(g => g.w === 'apartment').length), 0);
    ok(seen && B && B.party && B.watch && midL < sideL - 6 && inApt === 0, `THE BOSS AT THE SHADE: the shade down on the party (${B && B.party}), his shadow stands against the glow (${B && B.watch ? `a ${B.watch.a}, at ${B.watch.x}` : 'no stand'}: ${midL.toFixed(0)} under it vs ${sideL.toFixed(0)} beside), only ever a shadow (${inApt} figures)`);
    await Q.ctx.close(); }
  // ---- WIN3 — THE RAID CUTS THE TV: a forced raid — the set snaps off as the siren starts (life.raidS ≥ 0 → tvOff), and stays off
  { const Q = await open({ slot: 'w3-raid', qs: `when=2026-10-22T23:30${GR}&force=raid,no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const before = await ev(Q.page, 'window.__district.harbor().speakeasy.life.tv');
    const cut = await waitFor(Q.page, '(() => { const L = window.__district.harbor().speakeasy.life; return L.raidS != null && L.raidS >= 0 && L.tvOff; })()', 'the TV cut by the siren', 20000).then(() => true).catch(() => false);
    const after = await ev(Q.page, 'window.__district.harbor().speakeasy.life');
    ok(cut && after.tvOff && after.tv && after.tv.off === 'raid', `THE RAID CUTS THE TV: on before (${before && before.k}), off as the siren starts (raidS ${after.raidS}, ${after.tv && after.tv.off})`);
    await Q.ctx.close(); }
  // ---- WIN3 — THE PARTY IN THE WINDOWS (forced): the rooms go up ONE AT A TIME (~every 8–13 s, a seeded order), each in its OWN colour
  // (never two alike), dark silhouettes jumping on the beat in the full rooms, the colour POOLED on the cobbles; the boss's room never joins
  { const Q = await open({ slot: 'w3-party', qs: `when=2026-10-24T23:00${GR}&force=window-party,no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const P0 = await ev(Q.page, 'window.__district.harbor().speakeasy.life.party');
    const ups = []; const t0 = Date.now(); let lastN = -1;
    while (Date.now() - t0 < 60000) { const P = await ev(Q.page, 'window.__district.harbor().speakeasy.life.party'); const n = P ? Object.values(P.k).filter(v => v > 0.99).length : 0; if (n !== lastN) { ups.push({ s: P ? P.s : null, n }); lastN = n; } if (n >= 5) break; await sleep(200); }
    const P1 = await ev(Q.page, 'window.__district.harbor().speakeasy.life.party'), W = await wins(Q.page);
    const steps = ups.filter((u, i) => i && u.n === ups[i - 1].n + 1), gaps = steps.slice(1).map((u, i) => u.s - steps[i].s);
    ok(P0 && P0.forced && P0.k.apartment == null && steps.length >= 4 && gaps.every(g => g >= 6 && g <= 15), `THE ROOMS GO UP ONE AT A TIME: ${ups.map(u => `${u.n}@${u.s}s`).join(' → ')} (the gaps ${gaps.map(g => g.toFixed(0)).join(' / ')} s), the TV room never (${P1 && P1.order.join(', ')})`);
    const cols = P1 ? Object.values(P1.col).map(c => c.join()) : [], panes = {};
    for (const id of ['bar', 'jazz', 'back']) panes[id] = await area(Q.page, W[id], 0.2, 0.8, 0.2, 0.8);
    const tinted = id => { const c = panes[id], col = P1.col[id], dom = col.indexOf(Math.max(...col)); return c[dom] >= Math.max(...c) - 2 && Math.max(...c) - Math.min(...c) > 25; };
    ok(new Set(cols).size === cols.length && ['bar', 'jazz', 'back'].every(tinted), `EACH ROOM ITS OWN COLOUR: ${P1 ? Object.entries(P1.col).map(([k, v]) => `${k} ${v.join(',')}`).join(' · ') : 'no party'} — the panes read ${Object.entries(panes).map(([k, v]) => `${k} rgb ${v.map(x => x.toFixed(0)).join(',')}`).join(' · ')}`);
    const fr = await ev(Q.page, winTrace(2.5)), dancers = fr.map(f => (f.figs || []).filter(g => ['bar', 'jazz', 'back'].includes(g.w) && g.sil));
    const ys = dancers.map(d => d.length ? d.reduce((a, g) => a + g.y, 0) / d.length : null).filter(v => v != null), bob = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
    ok(dancers.length > 10 && dancers.every(d => d.length >= 6) && bob > 0.02, `THE CROWD: ${dancers[0] && dancers[0].length} silhouettes a frame across the full rooms, jumping (the mean waist moves ${bob.toFixed(3)} over 2.5 s)`);
    // SP5 — THE HALF-CUT EDGE WINDOWS JOIN (the owner): one or two dancers each during the party only; DEPTH: one dancer BEHIND each full room's
    // group (its trace d ≥ 0.7), smaller + dimmer, never crowding the front row
    { const fr2 = await ev(Q.page, winTrace(1.5)), all = fr2.flatMap(f => f.figs || []);
      const edgeN = ['edge2', 'edge3'].map(id => Math.max(0, ...fr2.map(f => (f.figs || []).filter(g => g.w === id).length))), deepRooms = ['bar', 'jazz', 'back'].filter(id => all.some(g => g.w === id && g.d >= 0.7)), frontMax = Math.max(0, ...['bar', 'jazz', 'back'].map(id => Math.max(0, ...fr2.map(f => (f.figs || []).filter(g => g.w === id && g.d < 0.7).length))));
      ok(edgeN.every(n => n >= 1 && n <= 2) && deepRooms.length === 3 && frontMax <= 4, `THE EDGE WINDOWS DANCE TOO: edge2 ${edgeN[0]}, edge3 ${edgeN[1]} silhouettes (1–2 each); ONE BEHIND EACH GROUP: ${deepRooms.join(', ')} have a dancer at depth ≥ 0.7, the front rows ≤ ${frontMax}`); }
    // (the pools: the cobbles are warm — the proof is the SHIFT from the surround toward the room's colour at the pool's centre; the back
    // room's window stands over the bar's, so their pools stack: one read per distinct spot, against the colour of the room nearest the ground)
    const pools = await ev(Q.page, 'window.__district.harbor().partyPools'), reads = [], seen = [];
    for (const q of pools) { if (seen.some(x => Math.abs(x - q.x) < 12)) continue; seen.push(q.x);
      const c = await area(Q.page, { x: q.x - 8, y: q.y - 3, w: 16, h: 6 }, 0, 1, 0, 1), o = await area(Q.page, { x: q.x + q.r * 1.6, y: q.y - 3, w: 16, h: 6 }, 0, 1, 0, 1);
      const d = c.map((v, i) => v - o[i]), dom = q.col.indexOf(Math.max(...q.col)), dim = q.col.indexOf(Math.min(...q.col));
      // (NIGHT-A2 — the new light is the default: its pools TINT the brighter lit cobbles (source-over) instead of adding — a magenta
      // tint over warm cobbles lowers green a lot + red a little; the proof is then the SHIFT's direction: toward the room's colour from
      // the surround (cosine > 0.5, > 8 levels) — the old light's additive rule kept as the other way to pass)
      const to = q.col.map((v, i) => v - o[i]), dot = d.reduce((s, v, i) => s + v * to[i], 0), nd = Math.hypot(...d), nt = Math.hypot(...to) || 1;
      reads.push({ id: q.id, ok: (d[dom] > 6 && d[dom] >= d[dim] + 4) || (nd > 8 && dot / (nd * nt) > 0.5), c, d }); }
    ok(reads.length >= 2 && reads.every(r => r.ok), `THE COLOUR ON THE COBBLES: ${pools.length} pools (${reads.length} spots) in front of the windows — ${reads.map(r => `${r.id} rgb ${r.c.map(v => v.toFixed(0)).join(',')} (shift ${r.d.map(v => (v > 0 ? '+' : '') + v.toFixed(0)).join(',')} vs the cobbles beside it)`).join(' · ')} — each shifted toward its room's colour`);
    await Q.ctx.close(); }
  // ---- WIN3 — A RAID CUTS THE WINDOW PARTY: the lights snap off, the dancers scatter, the blinds drop (a 1.6-s tail), dead for the night
  { const Q = await open({ slot: 'w3-pcut', qs: `when=2026-10-24T23:00${GR}&force=window-party,no-people,no-wildlife&panel=1`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const on = await waitFor(Q.page, '(() => { const P = window.__district.harbor().speakeasy.life.party; return !!(P && P.on && !P.cut && Object.values(P.k).filter(v => v > 0.99).length >= 2); })()', 'the party on (two rooms up)', 30000).then(() => true).catch(() => false);
    await waitFor(Q.page, '!!window.__district.remote()', 'the panel', 10000);
    await ev(Q.page, "window.__district.remote().setMine({ force: ['window-party', 'raid', 'no-people', 'no-wildlife'] })");   // (the raid called in while the party is up: its siren ~2 s on)
    const cut = await waitFor(Q.page, '(() => { const P = window.__district.harbor().speakeasy.life.party; return !!(P && P.cut); })()', 'the cut', 20000).then(() => true).catch(() => false);
    const dead = await waitFor(Q.page, '(() => { const L = window.__district.harbor().speakeasy.life; return !L.party && L.raidS >= 0; })()', 'dead after the tail', 6000).then(() => true).catch(() => false);
    ok(on && cut && dead, `A RAID CUTS THE PARTY: on (${on}), cut as the siren starts (${cut}), gone after the blinds drop (${dead})`);
    await Q.ctx.close(); }
  // ---- THE EDGE WINDOWS' MOODS: light + shadow only (no figures in them), a seeded mood each — never the same two — and the two panes
  // really differ in colour; the next night's moods differ from tonight's
  { const Q = await open({ slot: 'w2-mood', qs: `when=2026-10-22T22:30${GR}&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    const L1 = await ev(Q.page, 'window.__district.harbor().speakeasy.life'), W = await wins(Q.page);
    const figs = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => res(window.__district.harbor().speakeasy.life.figs)))`), inEdge = (figs || []).filter(g => g.w === 'edge2' || g.w === 'edge3').length;
    const a = await area(Q.page, W.edge2, 0.55, 0.95, 0.2, 0.8), b = await area(Q.page, W.edge3, 0.55, 0.95, 0.2, 0.8), dc = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    ok(L1.moods && L1.moods.edge2 !== L1.moods.edge3 && inEdge === 0 && (dc > 18 || Math.abs(lum(a) - lum(b)) > 10), `THE EDGE WINDOWS' MOODS tonight: ${L1.moods && L1.moods.edge2} / ${L1.moods && L1.moods.edge3} — light + shadow only (${inEdge} figures), the panes differ (rgb ${a.map(x => x.toFixed(0)).join(',')} vs ${b.map(x => x.toFixed(0)).join(',')})`);
    // SP5 — THE ROLLER SHADES (the owner: no curtains in the half-cut windows): tonight's seeded heights, the two never alike; the shade
    // drawn: a straight hem — the pane's upper part (cloth) differs in luminance from its lower part (the room's light) on a half / down night
    { const SH = await ev(Q.page, 'window.__district.harbor().speakeasy.life.shades'), W2 = await wins(Q.page);
      const probe = async id => { const r = W2[id]; if (!r) return null; const top = lum(await area(Q.page, r, 0.55, 0.95, 0.6, 0.9)), low = lum(await area(Q.page, r, 0.55, 0.95, 0.12, 0.4)); return { top: +top.toFixed(0), low: +low.toFixed(0) }; };
      const p2 = await probe('edge2'), p3 = await probe('edge3');
      ok(SH && ['up', 'half', 'down'].includes(SH.edge2) && ['up', 'half', 'down'].includes(SH.edge3) && SH.edge2 !== SH.edge3 && p2 && p3, `THE ROLLER SHADES tonight: edge2 ${SH && SH.edge2} (cloth ${p2 && p2.top} / below ${p2 && p2.low}), edge3 ${SH && SH.edge3} (${p3 && p3.top} / ${p3 && p3.low}) — never the same height`); }
    await Q.ctx.close(); }
  // ---- THE EYES IN THE HAZE (forced): one full window goes dark with two red glows in it; nothing else in that window
  { const Q = await open({ slot: 'w2-eyes', qs: `when=2026-10-22T23:30${GR}&force=window&moment=eyes`, view: [402, 874] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, "window.__district.harbor().speakeasy.life.on.some(e => e.id === 'eyes' && e.el > 8)", 'the eyes on (faded in)', 40000);   // (the room fades in over the first 6 s)
    const L2 = await ev(Q.page, 'window.__district.harbor().speakeasy.life'), win = L2.on[0].win, r = (await wins(Q.page))[win];
    const reds = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth, d = cv.getContext('2d').getImageData(Math.round(${r.x} * k), Math.round(${r.y} * k), Math.round(${r.w} * k), Math.round(${r.h} * k)).data; let red = 0, dark = 0, n = 0, mx = [0, 0, 0]; for (let i = 0; i < d.length; i += 4) { n++; if (d[i] > 120 && d[i] > d[i + 1] * 1.6 && d[i] > d[i + 2] * 1.6) red++; if (d[i] + d[i + 1] + d[i + 2] < 90) dark++; if (d[i] > mx[0]) mx = [d[i], d[i + 1], d[i + 2]]; } res({ red, dark, n, mx }); }))`);
    const figs = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => res(window.__district.harbor().speakeasy.life.figs)))`), inWin = (figs || []).filter(g => g.w === win).length;
    ok(reds.red >= 12 && reds.dark / reds.n > 0.5 && inWin === 0 && ['bar', 'jazz', 'back', 'apartment'].includes(win), `THE EYES IN THE HAZE (forced) in the ${win}: ${reds.red} red device px of eyes in a dark pane (${Math.round(reds.dark / reds.n * 100)} % dark; the reddest ${reds.mx.join(',')}), no figure (${inWin})`);
    await Q.ctx.close(); }
  // ---- THE RIGHT PIER's WALL-WASHER OFF while the lobby sign is lit (the hush word grows): the pier's top under the cornice is darker
  // with the sign than without, and the sign's caps read ~17 pt
  { const Q = await open({ slot: 'w2-wash', qs: `when=2026-10-22T22:30${GR}&force=hushsign&hush=JAZZ`, view: [402, 874] }), P = 'window.__district.harbor()';
    await harborUp(Q.page); await lit(Q.page); await waitFor(Q.page, `!${P}.pending && !${P}.fading`, 'settled', 20000).catch(() => {});
    // (the washer's lamp + its warm cone sit in the pier's top band: the RED channel there — the lit sign's plate + cyan tubes take its place)
    const hs = await ev(Q.page, `${P}.speakeasy.hush()`), pier = hs.pier, probe = async p => (await area(p, { x: pier.x, y: pier.y, w: pier.w, h: pier.h * 0.12 }, 0.15, 0.85, 0.05, 0.95))[0];
    const withSign = await probe(Q.page);
    const O = await open({ slot: 'w2-washb', qs: `when=2026-10-22T22:30${GR}`, view: [402, 874] });
    await harborUp(O.page); await lit(O.page); await waitFor(O.page, `!${P}.pending && !${P}.fading`, 'settled', 20000).catch(() => {});
    const without = await probe(O.page);
    // (the swap is in the facade's bake context: hushLit in its key → the re-bake without the corner pier's washer — the look is the
    // reviewed A/B shot; the pixel band is reported, not judged: the plate + the tubes sit where the lamp was)
    const scA = await ev(Q.page, "window.__district.speakCtx()"), scB = await ev(O.page, "window.__district.speakCtx()");   // (the scene object: beside tiering())
    ok(hs.capPt >= 16 && scA.hushLit === true && scB.hushLit === false && scA.key !== scB.key, `THE WASHER OFF WHILE THE SIGN IS LIT: the facade baked with the sign (${scA.key}: no corner washer) vs without (${scB.key}), the caps ${hs.capPt} pt (the pier's top band red ${withSign.toFixed(0)} vs ${without.toFixed(0)})`);
    await O.ctx.close(); await Q.ctx.close(); }
  // ---- WIN — PLAY ALL SCENES (the panel's sequencer, this phone): it cycles the whole catalogue — every window moment once, in its own
  // window, the forced moment following the chip; skip steps it; ✕ restores what was on before
  { const Q = await open({ slot: 'w-play', qs: `when=2026-10-22T21:30${GR}&panel=1`, view: [390, 844] });
    await harborUp(Q.page); await lit(Q.page);
    await waitFor(Q.page, '!!window.__district.remote()', 'the panel', 10000);
    await ev(Q.page, "window.__district.remote().setMine({ force: ['hushsign'] })");
    await ev(Q.page, "window.__district.remote().playAll('windows')");
    const p0 = await ev(Q.page, 'window.__district.remote().playing()');
    const seen = [p0 && p0.id];
    for (let i = 0; i < 3; i++) { await ev(Q.page, 'window.__district.remote().playSkip()'); await sleep(300); const p = await ev(Q.page, 'window.__district.remote().playing()'); seen.push(p && p.id); }
    const pN = await ev(Q.page, 'window.__district.remote().playing()');
    const follows = await waitFor(Q.page, `window.__district.harbor().speakeasy.life.forced === '${pN && pN.id.slice(7)}'`, 'the forced moment follows the chip', 6000).then(() => true).catch(() => false);
    const chip = await ev(Q.page, `(() => { const c = document.querySelector('.hr-pa'); return c ? { n: c.querySelector('.hr-pa-n').textContent, l: c.querySelector('.hr-pa-l').textContent, w: c.getBoundingClientRect().width } : null; })()`);
    ok(p0 && pN && pN.n >= 18 && p0.i === 0 && pN.i === 3 && new Set(seen).size === 4 && follows && chip && chip.n === '4 / ' + pN.n, `PLAY ALL SCENES: ${pN && pN.n} moments in the loop, skipped ${seen.join(' → ')}, the forced moment follows (${follows}), the chip says ${chip && chip.n} · ${chip && chip.l} (${chip && chip.w.toFixed(0)} pt wide at 390)`);
    // WIN2 — PLAY ALL ON ITS OWN CLOCK: the item's wall time is its own hour; the city's clock followed it (the life's hour) before the moment
    const own = await ev(Q.page, 'window.__district.remote().playing()');
    const hourOk = !!(own && own.when && Math.abs((+own.when.slice(11, 13) + (+own.when.slice(14, 16)) / 60) - own.hour) < 0.02);
    const followed = await waitFor(Q.page, `Math.abs(window.__district.harbor().speakeasy.life.h - ${own && own.hour}) < 0.75`, "the clock at the moment's hour", 12000).then(() => true).catch(() => false);
    const chip2 = await ev(Q.page, `(() => { const c = document.querySelector('.hr-pa'); return c ? c.querySelector('.hr-pa-l').textContent : ''; })()`);
    ok(hourOk && followed && / · \d\d:\d\d$/.test(chip2), `PLAY ALL ON ITS OWN CLOCK: ${own && own.id} at ${own && own.when} (its hour ${own && own.hour}), the city's clock followed; the chip "${chip2}"`);
    await ev(Q.page, 'window.__district.remote().playStop()');
    const after = await ev(Q.page, '({ play: window.__district.remote().playing(), mine: window.__district.remote().debug().mine })');
    ok(!after.play && (after.mine.force || []).join() === 'hushsign' && !after.mine.when, `✕ STOPS THE LOOP + restores what was on before, the real clock back (${JSON.stringify(after.mine)})`);
    await Q.ctx.close(); }
});
G('blackout', async () => {
  const P = 'window.__district.harbor()';
  // ---- C4c — THE BLACKOUT, FOR REAL (the owner, Oct 29 7:54 am: mid-drain on a late-October night the cab bench, the MUM by the hydrant +
  // the right maple's autumn crown stayed lit — C4b's probe ran on a plain September night at 2×, where the benches' 3× overlays don't
  // exist + no prop stands): the TR-3B at the blackout's depth on a late-October, a Thanksgiving build-up + a December night (+ the plain
  // one), at the iPhone's 3× (the sharp overlays on), probes on every holiday piece drawn, both benches, every tree's crown, the hydrant
  // corner — nothing in the foreground brighter than the dark city round it (a ring 14 pt out: in ≤ ring × 1.25 + 8)
  // (NIGHT-A: + the NEW night light on the late-October night — its wash, base + the cab stand's lamp taken down with the rest)
  for (const [tag, when, xq = ''] of [['oct', '2026-10-29T22:00'], ['oct-new', '2026-10-29T22:00', '&light=new'], ['tg', '2026-11-20T22:00'], ['dec', '2026-12-10T22:00'], ['sep', '2026-09-23T22:00']]) {
    const Q = await open({ slot: `lgb${tag}`, qs: `when=${when}${GR}&wx=clear&force=tr3b&lgs=15${xq}`, view: [402, 874], dpr: 3 });
    await harborUp(Q.page);
    await waitFor(Q.page, `(() => { const k = ${P}.legend.dark(); return k.far && k.near; })()`, 'the dark city baked', 25000).catch(() => {});
    await waitFor(Q.page, `${P}.speakeasy.power() < 0.05`, 'the speakeasy dark', 15000).catch(() => {});
    if (tag !== 'sep') await waitFor(Q.page, `${P}.hprops && ${P}.hprops.stat && (${P}.hprops.stat.rects || []).length > 0`, 'the holiday pieces drawn', 15000).catch(() => {});
    await sleep(600);
    const pr = await ev(Q.page, `${P}.promenade`), hp = await ev(Q.page, `${P}.hprops`), H = 874;
    const zones = [['cab bench', pr.cabStand ? [pr.cabStand[0] - 26, pr.cabStand[1] - 22, pr.cabStand[0] + 26, pr.cabStand[1]] : null], ['water bench', [pr.bench[0] - 20, pr.bench[1] - 18, pr.bench[0] + 20, pr.bench[1]]],
      ['hydrant', pr.hydrant ? [pr.hydrant[0] - 16, pr.hydrant[1] - 30, pr.hydrant[0] + 16, pr.hydrant[1] + 2] : null],
      ...pr.trees.filter(t => t.crown && t.crown[1] > 0 && t.crown[1] < H).map((t, i) => [`${t.kind} ${i} crown`, [Math.max(1, t.crown[0] - t.r * 0.7), t.crown[1] - t.r * 0.45, Math.min(401, t.crown[0] + t.r * 0.7), t.crown[1] + t.r * 0.45]]),
      ...((hp && hp.stat && hp.stat.rects) || []).filter(r => r.w > 4 && r.h > 4 && r.y < H && r.y + r.h > 0).map(r => [`prop ${r.id || '?'}`, [Math.max(1, r.x), Math.max(1, r.y), Math.min(401, r.x + r.w), Math.min(H - 1, r.y + r.h)]])].filter(z => z[1]);
    const lum = await ev(Q.page, `new Promise(res => requestAnimationFrame(() => { const d = devicePixelRatio || 1, cs = [...document.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 0), o = document.createElement('canvas'); o.width = innerWidth * d; o.height = innerHeight * d; const x = o.getContext('2d');
      for (const c of cs) { const r = c.getBoundingClientRect(); if (r.width < 1) continue; try { x.drawImage(c, r.left * d, r.top * d, r.width * d, r.height * d); } catch { /* tainted */ } }
      const Lm = (x0, y0, x1, y1, ex) => { const X0 = Math.max(0, Math.round(Math.min(x0, x1) * d)), Y0 = Math.max(0, Math.round(Math.min(y0, y1) * d)), X1 = Math.min(o.width, Math.round(Math.max(x0, x1) * d)), Y1 = Math.min(o.height, Math.round(Math.max(y0, y1) * d)); if (X1 <= X0 || Y1 <= Y0) return 0; const im = x.getImageData(X0, Y0, X1 - X0, Y1 - Y0).data, w = X1 - X0; let s = 0, n = 0; const all = [];
        for (let i = 0; i < im.length; i += 4) { const px = (i / 4) % w + X0, py = Math.floor(i / 4 / w) + Y0; if (ex && px >= ex[0] * d && px <= ex[2] * d && py >= ex[1] * d && py <= ex[3] * d) continue; const v = 0.2126 * im[i] + 0.7152 * im[i + 1] + 0.0722 * im[i + 2]; s += v; n++; if (!ex) all.push(v); } if (!ex) { all.sort((p, q) => p - q); Lm.p90 = all.length ? all[Math.floor(all.length * 0.9)] : 0; } return n ? s / n : 0; };
      res(${JSON.stringify(zones)}.map(([id, b]) => { const g = 14, xa = Math.min(b[0], b[2]), ya = Math.min(b[1], b[3]), xb = Math.max(b[0], b[2]), yb = Math.max(b[1], b[3]); const iv = +Lm(xa, ya, xb, yb).toFixed(1), p90 = +Lm.p90.toFixed(1); return { id, in: iv, p90, ring: +Lm(xa - g, ya - g, xb + g, yb + g, [xa, ya, xb, yb]).toFixed(1) }; })); }))`);
    const hot = lum.filter(z => z.in > z.ring * 1.25 + 8 || (/crown/.test(z.id) && z.p90 > z.ring * 1.6 + 12)), props = lum.filter(z => z.id.startsWith('prop')).length;
    ok(lum.length >= 5 && (tag === 'sep' || props > 0) && !hot.length, `C4c THE BLACKOUT ON ${tag.toUpperCase()} (${when}, 3×): ${lum.length} zones (${props} holiday pieces) — ${lum.map(z => `${z.id} ${z.in}/${z.ring}${/crown/.test(z.id) ? ` (p90 ${z.p90})` : ''}`).join(' · ')}${hot.length ? ` — STILL LIT: ${hot.map(z => z.id).join(', ')}` : ''}`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}legend-blackout-${tag}-402x874.png` });
    await Q.ctx.close();
  }
});
// ================================================================ 9b — WINTER: the climate fallback, the snowpack's stages on the city, the
// falling snow, the plow, the sign's snow, the January snowman (phone-sized pages; the look itself is reviewed in screenshots)
G('snow', async () => {
  const P = 'window.__district.harbor()', SNW = `${P}.snow`;
  // the plaza's mean brightness (an 8-pt patch average at a few points in front of the shop + by the inlay): snow reads as light
  const plaza = p => ev(p, `(() => { const cv = document.querySelector('.nd-scene canvas'), x = cv.getContext('2d'), hb = window.__district.harbor(), k = cv.width / cv.clientWidth;
    const y = hb.cam.H * 0.845; let s = 0, n = 0; for (const f of [0.35, 0.5, 0.65, 0.8]) { const d = x.getImageData(Math.round((hb.cam.W * f - 4) * k), Math.round((y - 4) * k), Math.round(8 * k), Math.round(8 * k)).data; for (let i = 0; i < d.length; i += 4) { s += (d[i] + d[i + 1] + d[i + 2]) / 3; n++; } } return Math.round(s / n); })()`);
  // ---- THE CLIMATE FALLBACK (&force=climate): a January afternoon in Grand Rapids — the readout's source + snow on the ground from it
  { const Q = await open({ slot: 'sn-cl', qs: `when=2027-01-20T13:00${GR}&force=climate&debug=1`, view: [402, 874] });
    await harborUp(Q.page); await sleep(800);
    const s = await ev(Q.page, SNW), line = await ev(Q.page, `(document.querySelector('.dbg-col') || document.body).textContent`);   // (9e: textContent — the strips start folded; their rows are kept up to date while hidden)
    ok(s && s.src === 'the climate fallback' && s.stage !== 'none', `CLIMATE FALLBACK: a January in Grand Rapids has snow on the ground (${s && s.stage} · ${s && s.why} · ${s && s.src})`);
    ok(/climate fallback/.test(line || ''), 'CLIMATE FALLBACK: the readout names it');
    await Q.ctx.close(); }
  // ---- NO SNOW where there is none: an early-November afternoon (the climate's ground on a preview clock) — nothing white baked
  let bare = 0;
  { const Q = await open({ slot: 'sn-0', qs: `when=2026-11-05T13:00${GR}`, view: [402, 874] });
    await harborUp(Q.page); await sleep(800);
    const s = await ev(Q.page, SNW); bare = await plaza(Q.page);
    ok(s && s.stage === 'none' && !s.key, `NO SNOW in early November (${s && s.stage}; the plaza ${bare})`);
    await Q.ctx.close(); }
  // ---- THE STAGES (&snow=…) by day: each reads as itself; FRESH whitens the plaza; THE THAW wets the street
  for (const st of ['fresh', 'older', 'banks', 'thaw', 'spring']) {
    const Q = await open({ slot: `sn-${st}`, qs: `when=2026-11-05T13:00${GR}&snow=${st}`, view: [402, 874] });
    await harborUp(Q.page); await waitFor(Q.page, `${P}.bakes >= 1 && !${P}.pending`, 'baked', 10000).catch(() => {}); await sleep(600);
    const s = await ev(Q.page, SNW), lum = await plaza(Q.page), w = await ev(Q.page, `${P}.weather`);
    ok(s && s.stage === st && s.key, `SNOW — ${st.toUpperCase()}: the stage + its bake key (${s && s.why} · ${s && s.key})`);
    if (st === 'fresh') ok(lum > bare + 35, `SNOW — FRESH: the plaza reads white (${bare} → ${lum})`);
    if (st === 'spring') ok(lum < bare + 60, `SNOW — SPRING: patches, mostly dark ground (${bare} → ${lum})`);
    if (st === 'thaw') ok(w && w.wet > 0.4, `SNOW — THAW: the melt wets the street (wet ${w && w.wet})`);
    await Q.ctx.close();
  }
  // ---- FALLING SNOW at night + THE PLOW: the flakes fall; the plow truck crosses the waterside road (the road white ahead of it)
  { const Q = await open({ slot: 'sn-fall', qs: `when=2027-01-14T22:30${GR}&force=snowfall,plow&snow=fresh`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${SNW}.fall.flakes > 60`, 'the snowfall', 12000).catch(() => {});
    const s = await ev(Q.page, SNW), w = await ev(Q.page, `${P}.weather`);
    ok(w && w.state === 'snow' && s.fall.flakes > 60, `FALLING SNOW: the state + the flakes (${w && w.state} · ${s && s.fall.flakes} flakes)`);
    let plow = null;
    await waitFor(Q.page, `${P}.people.cars.some(c => c.model === 'plow')`, 'the plow on the road', 15000).then(async () => { plow = await ev(Q.page, `${P}.people.cars.find(c => c.model === 'plow')`); }).catch(() => {});
    ok(plow && plow.lane === 'near', `THE PLOW: on the waterside road's near lane (${plow ? `x ${plow.x}, ${plow.speed} u/s` : 'never came'}) · the road ${s && s.road}`);
    await Q.ctx.close(); }
  // ---- THE SIGN: snow heaped on the tubes by day (the sign off); lit at night most of it has melted (joined)
  { const D = await open({ slot: 'sn-sd', qs: `when=2027-01-15T13:00${GR}&snow=fresh`, view: [402, 874] });
    await harborUp(D.page); await sleep(1500);
    const a = await ev(D.page, SNW);
    const N = await open({ slot: 'sn-sn', qs: `when=2027-01-15T21:30${GR}&snow=fresh&temp=-6`, view: [402, 874] });
    await harborUp(N.page); await sleep(1500);
    const b = await ev(N.page, SNW);
    ok(a && b && a.sign > 0.6 && b.sign < 0.4 && b.icicles > 0.2, `SNOW ON THE NEON: by day ${a && a.sign} · lit at night ${b && b.sign} (melted) + icicles ${b && b.icicles}`);
    await D.ctx.close(); await N.ctx.close(); }
  // ---- 9c → 9d — THE FROST (the owner, DECIDED: City 1.0's frozen PANE only): a deep freeze grows the PANE (kept clear of the sign + the
  // dock + the buttons) and never any frost on the buttons
  for (const [mode, paneOn, glassOn] of [['pane', true, false]]) {
    const Q = await open({ slot: `sn-fr-${mode}`, qs: `when=2027-01-20T22:00${GR}&snow=older&temp=-14`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${SNW}.pane.grown > 0.3`, 'the pane forming', 20000).catch(() => {});
    const s = await ev(Q.page, SNW);
    ok(s && (s.pane.grown > 0.3) === paneOn && s.pane.clear >= 2 && s.pane.alpha > 0.5 && (s.gwx.frost > 0.05) === glassOn, `9c FROST ${mode.toUpperCase()}: the pane ${s && s.pane.grown} at ${s && s.pane.alpha} (${s && s.pane.clear} clear holes), the buttons' frost ${s && s.gwx.frost}`);
    // (9e — THE FROST LINK SHOWED NOTHING on the iPhone: the hairline pane vanished on the lit city + the corner buttons' holes erased the
    //  top corners. Now bold + no corner holes: the four corners must read — bright pixels in each corner of the real picture)
    const fr = await ev(Q.page, `(() => { const c = document.querySelector('.nd-scene canvas') || [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; const x = document.createElement('canvas'); x.width = 40; x.height = 87; const g = x.getContext('2d'); g.drawImage(c, 0, 0, 40, 87); const d = g.getImageData(0, 0, 40, 87).data; const L = (i) => d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11; const m = (x0, y0) => { let s = 0; for (let y = y0; y < y0 + 8; y++) for (let x1 = x0; x1 < x0 + 6; x1++) s += L(y * 40 + x1); return s / 48; }; return [m(0, 0), m(34, 0), m(0, 79), m(34, 79)].map(v => Math.round(v)); })()`);
    ok(fr.every(v => v > 38), `9e THE FROST READS in all four corners (mean light ${fr.join(' · ')} of 255)`);
    await Q.ctx.close();
  }
  // ---- 9e — SNOW LANDS ON THE SIGN (the owner: "the snowflakes have to land on it and stop falling"): in a night snowfall flakes stop on
  // the tubes' tops (sitting = still dots), on the LIT tubes they melt into beads; nearer flakes fall past in front
  { const Q = await open({ slot: 'sn-land', qs: `when=2027-01-14T21:30${GR}&snow=fresh&wx=snow&temp=-6`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `${SNW}.gwx.landed >= 4 && ${SNW}.gwx.sitting >= 1`, 'flakes landing on the sign', 20000).catch(() => {});
    const g = await ev(Q.page, `${SNW}.gwx`);
    ok(g.landed >= 4 && g.sitting >= 1 && g.passers >= 1 && g.beads > 0, `9e SNOW LANDS ON THE SIGN: ${g.landed} landed, ${g.sitting} sitting now, ${g.passers} nearer ones falling past, ${g.beads} beads (the lit tubes melt them)`);
    await Q.ctx.close(); }
  // ---- 9c — THE CRISP LAYER (the owner: the blade blurry next to the logo): on an iPhone-like DPR 3 by day the blade's board, the date
  // stone + the roof poster ride full-dpr overlays; at night the blade's lit letters + bulbs; at DPR 2 (the canvas's own) none at all
  // (SKY-A: wx=clear — the roof signs' crisp copies yield to the city's in rain / fog by design; the live weather made this a coin toss)
  { const D = await open({ slot: 'cr-d', qs: `when=2026-10-27T13:00${GR}&wx=clear`, view: [402, 874], dpr: 3 });
    await harborUp(D.page); await waitFor(D.page, `${SNW}.crisp.items.length >= 3`, 'the crisp items', 10000).catch(() => {});
    const a = await ev(D.page, `${SNW}.crisp`), ids = a.items.map(i => i.id).sort().join(',');
    ok(a.on && a.dpr === 3 && ids.replace(/,?still-(street|water)/g, '').replace(/,?rs-(body|lit)-n-roof[AB]/g, '') === 'blade-board,datestone,roofboard' && ['still-street', 'still-water'].every(id => ids.includes(id)) && ['rs-body-n-roofA', 'rs-lit-n-roofA', 'rs-body-n-roofB', 'rs-lit-n-roofB'].every(id => ids.includes(id)) &&   /* (PROM: + the two benches; NIGHT-C: + the two roof signs — housing + light — at 3×) */ a.items.every(i => i.w > 20), `9c THE CRISP LAYER by day at DPR 3: ${ids} (${a.items.map(i => `${i.w}×${i.h}`).join(', ')})`);
    const n = await ev(D.page, `document.querySelectorAll('canvas.hc-crisp').length`);
    await D.ctx.close();
    const N = await open({ slot: 'cr-2', qs: `when=2026-10-27T13:00${GR}`, view: [402, 874], dpr: 2 });
    await harborUp(N.page); await sleep(800);
    const b = await ev(N.page, `${SNW}.crisp`);
    ok(n >= 3 && !b.on && b.items.length === 0, `9c THE CRISP LAYER off where it gains nothing (DPR 2): ${b.on} · ${b.items.length} items (DPR 3 had ${n} overlays)`);
    await N.ctx.close();
    // (9e — THE BLADE STAYS SHARP AT EVERY TIER: the low-power tier 0 keeps the layer — the owner's busy holiday night stepped down + went soft)
    const Z = await open({ slot: 'cr-0', qs: `when=2026-10-27T21:30${GR}`, view: [402, 874], dpr: 3 });
    await harborUp(Z.page); await ev(Z.page, 'window.__district.setTier(0)');
    await waitFor(Z.page, `${SNW}.crisp.on && ${SNW}.crisp.items.some(i => i.id.startsWith('blade'))`, 'the crisp blade at tier 0', 10000).catch(() => {});
    const z = await ev(Z.page, `${SNW}.crisp`);
    ok(z.on && z.dpr === 3 && z.items.some(i => i.id.startsWith('blade')), `9e THE BLADE SHARP AT TIER 0: the crisp layer ${z.on} at dpr ${z.dpr} (${z.items.map(i => i.id).join(', ')})`);
    await Z.ctx.close(); }
  // ---- 9c — THE CENTREPIECE's SHOW LIGHTING (the owner: the uncarved giant sat dark, brown on brown): floodlit at night; dimmed to a
  // low fill once the carved ₿'s fire is lit; nothing by day
  { const fl = {};
    for (const [k, when] of [['dark', '2026-10-27T21:30'], ['carved', '2026-10-29T21:30'], ['day', '2026-10-27T13:00']]) {
      const Q = await open({ slot: `fl-${k}`, qs: `when=${when}${GR}&force=giant`, view: [402, 874] });
      await harborUp(Q.page); await sleep(1800);
      fl[k] = await ev(Q.page, `(${P}.hprops && ${P}.hprops.floods) ? ${P}.hprops.floods.k : -1`);
      await Q.ctx.close();
    }
    ok(fl.dark > 0.6 && fl.carved > 0.05 && fl.carved < 0.45 && fl.day === 0, `9c THE FLOODS on the giant: the uncarved night ${fl.dark} · carved + lit ${fl.carved} (a fill) · by day ${fl.day}`); }
  // ---- 9c — WINDOW SCENES NEVER POP IN (the owner's rule): a moment that doesn't walk in gets the blind — down + held in its ONE window
  // before the scene, up on it (the preview row: &force=window&moment=peek)
  { const Q = await open({ slot: 'w-blind', qs: `when=2026-10-27T21:00${GR}&force=window&moment=peek`, view: [402, 874] });
    await harborUp(Q.page);
    await waitFor(Q.page, `Object.values(${P}.speakeasy.life.blinds || {}).some(v => v > 0.95)`, 'the blind down', 6000).catch(() => {});
    const a = await ev(Q.page, `${P}.speakeasy.life.blinds`);
    await waitFor(Q.page, `!Object.keys(${P}.speakeasy.life.blinds || {}).length`, 'the blind up on the scene', 9000).catch(() => {});
    const b = await ev(Q.page, `${P}.speakeasy.life.blinds`);
    ok(Object.keys(a).length === 1 && Object.values(a)[0] > 0.95 && !Object.keys(b).length, `9c THE BLIND CYCLE: down in one window before the scene (${JSON.stringify(a)}), up on it (${JSON.stringify(b)})`);
    await Q.ctx.close(); }
  // ---- THE JANUARY SNOWMAN: Jan 31 (the climate's January) stands done on the inlay; &snowman=base the forced stage
  { const Q = await open({ slot: 'sn-man', qs: `when=2027-01-31T13:00${GR}`, view: [402, 874] });
    await harborUp(Q.page); await sleep(600);
    const m = await ev(Q.page, `${P}.snowman`), c = await ev(Q.page, `${P}.centrepiece.active()`);
    ok(m && m.standing && m.progress >= 0.9 && c, `THE SNOWMAN on Jan 31: ${m && m.stage} ${m && m.progress} (${m && m.why}) on the inlay (${c})`);
    // (9e — "people walking behind the snowman snapped in front of him": the piece sorts in with the near pass at the inlay's depth)
    const cz = await ev(Q.page, `({ z: ${P}.centrepiece.z, mz: ${P}.medallion && ${P}.medallion.z })`);
    ok(cz.z != null && (cz.mz == null || Math.abs(cz.z - cz.mz) < 0.05), `9e THE SNOWMAN's DEPTH: sorted in with the walkers at z ${cz.z} (the inlay ${cz.mz})`);
    await Q.ctx.close(); }
  { const Q = await open({ slot: 'sn-man2', qs: `when=2026-07-15T13:00${GR}&snowman=base`, view: [402, 874] });
    await harborUp(Q.page); await sleep(400);
    const m = await ev(Q.page, `${P}.snowman`);
    ok(m && m.stage === 'base', `THE SNOWMAN — &snowman=base (${m && m.stage})`);
    await Q.ctx.close(); }
});
// ================================================================ 9d — THE DOORS NEVER SNAP (ONLY=doors; the `street` cloud job)
// The owner: "it still just kind of snaps at the end". The side door at night (&force=doors: someone every 24 s) watched EVERY frame at an
// iPhone's DPR: the door's box read back each frame, the pixels changed since the last one counted. At the latch (the frames round k → 0)
// nothing may jump beyond what was already moving there (people passing in front): never more than the frames before + a small margin.
// (Before 9d the live leaf was a plain amber board that turned into the baked door at k = 0 — thousands of pixels in one frame.)
G('doors', async () => {
  for (const L of [{ id: 'side', when: '2026-10-21T22:00' }, { id: 'shop', when: '2026-10-21T13:00' }]) {
    const P = await open({ slot: `dr${L.id}`, qs: `when=${L.when}&wx=clear&force=doors,no-planes${GR}`, view: [402, 874], dpr: 3 });
    await harborUp(P.page);
    await ev(P.page, `(() => {
      const sp = window.__district.harbor().speakeasy, cv = document.querySelector('canvas'), x = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const R = window.__dr = { rows: [], rect: null, prev: null, s: cv.width / cv.clientWidth };
      const tick = () => { if (!window.__dr) return; requestAnimationFrame(tick);
        const d = sp.doors(), k = d['${L.id}'], r = d.rects['${L.id}'];
        if (r && !R.rect) { R.rect = { x: Math.floor((r.x - 4) * R.s), y: Math.floor((r.y - 4) * R.s), w: Math.ceil((r.w + 8) * R.s), h: Math.ceil((r.h + 8) * R.s) }; x.canvas.width = R.rect.w; x.canvas.height = R.rect.h; }
        if (!R.rect) return;
        x.clearRect(0, 0, R.rect.w, R.rect.h); x.drawImage(cv, R.rect.x, R.rect.y, R.rect.w, R.rect.h, 0, 0, R.rect.w, R.rect.h);
        const px = x.getImageData(0, 0, R.rect.w, R.rect.h).data; let n = 0;
        if (R.prev) for (let i = 0; i < px.length; i += 4) if (Math.abs(px[i] - R.prev[i]) + Math.abs(px[i + 1] - R.prev[i + 1]) + Math.abs(px[i + 2] - R.prev[i + 2]) > 40) n++;
        R.prev = px; R.rows.push([k, n]); };
      requestAnimationFrame(tick); })()`);
    await waitFor(P.page, `(() => { const r = window.__dr.rows; let n = 0; for (let i = 30; i < r.length; i++) if (r[i - 1][0] > 0 && r[i][0] === 0) n++; return n >= 1 && r.length > 0 && r[r.length - 1][0] === 0 && r.slice(-12).every(q => q[0] === 0); })()`, `${L.id}: a door swung shut`, 60000);
    const rows = await ev(P.page, '(() => { const r = window.__dr.rows; window.__dr = null; return r; })()');
    // (C4b: only a close watched from its swing — the doorman's hold may be under way when the page opens: the first 30 frames skipped)
    const ends = []; for (let i = 30; i < rows.length; i++) if (rows[i - 1][0] > 0 && rows[i][0] === 0) ends.push(i);
    // (the baseline: what moves there anyway — the frames before the latch AND after it (a guest walking off in front of the shop door
    // keeps changing ~100 px a frame on its own); a snap is a one-frame spike far above both)
    const medOf = a => { const v = a.map(q => q[1]).sort((x, y) => x - y); return v[v.length >> 1] || 0; };
    const res = ends.map(e => { const med = Math.max(medOf(rows.slice(Math.max(1, e - 24), e - 4)), medOf(rows.slice(e + 3, e + 12))), latch = Math.max(...rows.slice(e - 4, e + 3).map(q => q[1])); return { med, latch }; });
    const worst = res.reduce((a, q) => (q.latch - 2.5 * q.med - 60 > a.latch - 2.5 * a.med - 60 ? q : a), res[0]);
    const swung = rows.filter(q => q[0] > 0.3).length;
    ok(swung >= 5 && worst && worst.latch <= 2.5 * worst.med + 60, `THE DOORS NEVER SNAP (${L.id}, ${L.when.slice(11)}): at the latch ≤ ${worst ? worst.latch : '?'} pixels changed in a frame (what moves there anyway, the frames round it: ${worst ? worst.med : '?'}; ${ends.length} closes, ${swung} frames swung open)`);
    await P.ctx.close();
  }
});

// ================================================================ NIGHT-C — THE QUIET BUILDING (ONLY=quietbuilding; the `show` cloud job — the
// lightest). The owner (Oct 29 5:52 pm): at night only the boss's TV room + the two cut-off side rooms stay live; the bar, the jazz room + the
// upper middle (the shadowboxer's — SKY) are PARKED behind drawn blinds, a mix of warm-lit + dark, going out one by one; party nights + the
// day unchanged. On a 3× phone the live rooms are on the crisp layer at night.
G('quietbuilding', async () => {
  const LIFE = 'window.__district.harbor().speakeasy.life', PARKED = ['bar', 'jazz', 'back'];
  const px = (p, X, Y) => ev(p, `new Promise(res => requestAnimationFrame(() => { const cv = document.querySelector('.nd-scene canvas'), k = cv.width / cv.clientWidth; res(Array.from(cv.getContext('2d').getImageData(Math.round(${X} * k), Math.round(${Y} * k), 1, 1).data).slice(0, 3)); }))`);
  const lum = async (p, r) => { let s = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const c = await px(p, r.x + r.w * (0.25 + 0.25 * i), r.y + r.h * (0.25 + 0.25 * j)); s += 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; } return s / 9; };
  // ---- 1. a plain Tuesday at 9 pm: parked + the mix, no moment in a parked room for 12 s (the side rooms + the boss's keep theirs)
  { const Q = await open({ slot: 'qb1', qs: `when=2026-10-27T21:00${GR}&wx=clear&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await waitFor(Q.page, `${LIFE}.parkOn && ${PARKED.map(id => `${LIFE}.park.${id} === 1`).join(' && ')}`, 'parked', 20000).catch(() => {});
    const L = await ev(Q.page, LIFE), W = Object.fromEntries((await ev(Q.page, 'window.__district.harbor().speakeasy.windows()')).map(w => [w.id, w.rect]));
    const litN = PARKED.filter(id => L.parked && L.parked.lit[id]).length, seen = new Set();
    for (let i = 0; i < 24; i++) { for (const e of (await ev(Q.page, `${LIFE}.on`)) || []) seen.add(e.win); await sleep(500); }
    const lums = {}; for (const id of PARKED) lums[id] = await lum(Q.page, W[id]);
    const litL = PARKED.filter(id => L.parked.lit[id]).map(id => lums[id]), darkL = PARKED.filter(id => !L.parked.lit[id]).map(id => lums[id]);
    ok(L.parkOn && PARKED.every(id => L.park[id] === 1) && litN >= 1 && litN <= 2, `THE QUIET BUILDING (Tue 9 pm): the bar, the jazz room + the upper middle parked (${JSON.stringify(L.park)}), ${litN} of 3 warm-lit behind the blind`);
    ok(![...seen].some(id => PARKED.includes(id)), `…THEIR MOMENTS SLEEP: 12 s of the night's moments only in ${[...seen].join(', ') || 'no window'} (never a parked room)`);
    ok(Math.min(...litL) > Math.max(...darkL) + 12, `…A MIX OF WARM-LIT + DARK BLINDS: lit ${litL.map(v => v.toFixed(0)).join(' / ')} vs dark ${darkL.map(v => v.toFixed(0)).join(' / ')} (luma)`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}quietbuilding-9pm-402x874.png` });
    await Q.ctx.close(); }
  // ---- 2. the same night later: the lit ones going out one by one (by 1:40 all three dark behind their blinds)
  { const Q = await open({ slot: 'qb2', qs: `when=2026-10-28T01:40${GR}&wx=clear&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1500);
    const L = await ev(Q.page, LIFE), outs = Object.values(L.parked ? L.parked.out : {});
    ok(L.parkOn && PARKED.every(id => L.bed[id] === 0) && outs.length >= 1 && outs.every(s => s < 1.6 * 3600), `THE LIGHTS GO OUT ONE BY ONE: at 1:40 every parked lamp out (${JSON.stringify(L.bed)}; their times ${outs.map(s => `${Math.floor((s / 3600 + 24) % 24)}:${String(Math.floor(((s / 60) % 60 + 60) % 60)).padStart(2, '0')}`).join(', ')})`);
    await Q.ctx.close(); }
  // ---- 3. unchanged: a PARTY night (the window party) + the DAY; 4. a Thursday 8 pm — not the boxer's night: his window parked (SKY-B)
  for (const [when, what, want] of [['2026-10-24T22:30', 'a party night', false], ['2026-10-27T13:00', 'the day', false], ['2026-10-29T20:00', 'Thursday 8 pm (not his night)', true]]) {
    const Q = await open({ slot: `qb-${want ? 'p' : 'u'}`, qs: `when=${when}${GR}&wx=clear&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1500);
    const L = await ev(Q.page, LIFE);
    ok(!!L.parkOn === want && (want ? L.park.back === 1 : PARKED.every(id => !L.park[id])), `${what}: ${want ? 'the upper middle (the boxer’s) parked like its neighbours' : 'unchanged — nothing parked'} (${JSON.stringify(L.park)})`);
    await Q.ctx.close();
  }
  // ---- 5. THE LIVE WINDOWS AT 3× (a 3× phone at night): the boss's room + the two side rooms on the crisp layer
  { const Q = await open({ slot: 'qb3x', qs: `when=2026-10-27T22:40${GR}&wx=clear&force=no-people,no-wildlife`, view: [402, 874], dpr: 3 });
    await harborUp(Q.page); await waitFor(Q.page, `(window.__district.harbor().liveCrisp || []).length === 3 && window.__district.harbor().liveCrisp.every(w => w.k === 1)`, 'the live windows crisp', 20000).catch(() => {});
    const lc = await ev(Q.page, 'window.__district.harbor().liveCrisp'), cv = await ev(Q.page, `[...document.querySelectorAll('canvas.hc-crisp')].filter(c => c.style.display !== 'none' && +c.style.opacity > 0.5 && !c.style.mixBlendMode).map(c => +(c.width / parseFloat(c.style.width)).toFixed(2))`);
    ok(lc.length === 3 && lc.every(w => w.k === 1) && cv.filter(r => Math.abs(r - 3) < 0.05).length >= 3, `THE LIVE WINDOWS AT 3×: ${lc.map(w => `${w.id} ${w.k}`).join(', ')} — on the crisp layer at ${cv.join(' / ')}×`);
    await Q.ctx.close(); }
});

// ================================================================ SKY-B — THE SHADOWBOXER (ONLY=boxer; the `show` cloud job): Mon / Wed / Fri
// 7 → 11 pm in the upper middle window — the blind up, the amber room, the bulb, the bag; a Tuesday stays parked; the panel's preview on the
// bag (hits that swing it); a Friday wrap-up walks out at 8:30; on a 3× phone his room is on the crisp layer
G('boxer', async () => {
  const LIFE = 'window.__district.harbor().speakeasy.life';
  // ---- 1. a Monday at 8:05 pm: he's in (a round or a rest), the blind up — at 3× his room on the crisp layer
  { const Q = await open({ slot: 'bx1', qs: `when=2026-10-26T20:05${GR}&wx=clear&force=no-people,no-wildlife`, view: [402, 874], dpr: 3 });
    await harborUp(Q.page); await waitFor(Q.page, `!!(${LIFE}.boxer)`, 'the boxer in', 20000).catch(() => {});
    const B = await ev(Q.page, `${LIFE}.boxer`);
    ok(B && ['round', 'rest'].includes(B.phase) && B.blind === 0 && B.lamp === 1, `THE SHADOWBOXER (Mon 8:05 pm): in his room — ${B ? `${B.phase} ${B.round} of set ${B.set + 1}, ${B.kind || ''} (the blind up)` : 'nobody'}`);
    await waitFor(Q.page, `(window.__district.harbor().snow.crisp.items || []).some(i => i.id === 'win-back')`, 'his room on the crisp layer', 8000).catch(() => {});
    const cr = await ev(Q.page, `window.__district.harbor().snow.crisp.items || []`);
    ok(cr.some(i => i.id === 'win-back'), `…HIS ROOM AT 3× on the crisp layer (${cr.map(i => i.id).join(', ')})`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}boxer-mon-8pm-402x874.png` });
    await Q.ctx.close(); }
  // ---- 2. a Tuesday at 8:05 pm: not his night — the upper middle parked like its neighbours
  { const Q = await open({ slot: 'bx2', qs: `when=2026-10-27T20:05${GR}&wx=clear&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page); await sleep(1500);
    const L = await ev(Q.page, LIFE);
    ok(!L.boxer && L.park && L.park.back > 0.9, `NOT HIS NIGHT (Tue 8:05 pm): the upper middle parked (blind ${L.park && L.park.back})`);
    await Q.ctx.close(); }
  // ---- 3. THE PREVIEW (&force=boxer&round=2 — a bag round): the blind up first, then his hits swing the bag
  { const Q = await open({ slot: 'bx3', qs: `when=2026-10-27T13:00${GR}&wx=clear&force=boxer,no-people,no-wildlife&round=2`, view: [402, 874] });
    await harborUp(Q.page);
    let up = 0, hits = 0, kinds = new Set(), t0 = Date.now();
    while (Date.now() - t0 < 14000) { const B = await ev(Q.page, `${LIFE}.boxer`); if (B) { if (B.phase === 'blind-up') up++; if (B.kind) kinds.add(B.kind); if (B.hit != null && B.hit < 0.4) hits++; } await sleep(120); }
    ok(up > 0 && kinds.has('bag') && hits > 0, `THE PREVIEW (WINDOWS → THE SHADOWBOXER, ROUND 2): the blind up first (${up}), then on the heavy bag — ${hits} hits seen landing (any day, any hour)`);
    if (SHOTS) await Q.page.screenshot({ path: `${OUT}boxer-preview-402x874.png` });
    await Q.ctx.close(); }
  // ---- 4. a FRIDAY he wraps up (Nov 6): out at 8:30 as the party warms up — the towel, the walk out, his blind down
  { const Q = await open({ slot: 'bx4', qs: `when=2026-11-06T20:30:02${GR}&wx=clear&force=no-people,no-wildlife`, view: [402, 874] });
    await harborUp(Q.page);
    const seen = new Set(); const t0 = Date.now();
    while (Date.now() - t0 < 14000) { const B = await ev(Q.page, `${LIFE}.boxer`); seen.add(B ? B.phase : 'gone'); await sleep(200); }
    ok(seen.has('done') && seen.has('out'), `A FRIDAY HE WRAPS UP (Nov 6, 8:30 pm): he finishes, towels off + walks out, the blind comes down (${[...seen].join(' → ')})`);
    await Q.ctx.close(); }
});
