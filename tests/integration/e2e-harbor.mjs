// CITY 2.0 — THE HARBOR end to end (docs/harbor.md). Needs the emulators + scripts/serve.mjs --emu.
//   node e2e-harbor.mjs "<browser path>" ./shots-harbor        (env SHOTS=0, CPU=4, GPU=1)
// ?city=2 loads the Harbor with no errors and with every title flag (&when &tz &at &wx &force &speed &grid &debug); a normal
// visit (no flag) gets today's city and never loads a harbor file; the flag is never saved (localStorage, sessionStorage,
// cookies) — a reload without it is today's city; the dock: HOST opens a room, JOIN by typing joins it, a knock on the
// speakeasy's door opens JOIN; frame pacing within the City 2.0 budget at 4× CPU; 20 title ↔ setup cycles leave one city, no
// growing heap and the same offscreen memory; a hidden tab stops rendering. Screens at the six review sizes.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-harbor').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS !== '0';
const CPU = Number(process.env.CPU || 4);
const BUDGET_MS = 8;          // City 2.0, tier 2 on a phone: ≤ 8 ms of scene work a frame on average (docs/harbor.md#performance)
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const GR = '&tz=America/Detroit&at=42.96,-85.67';
const NIGHT = `when=2026-10-21T22:00${GR}`;

const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : [])] });
async function open({ slot = 'h', qs = '', city = true, view = [390, 844], profile = true } = {}) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  const files = [];
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline/i.test(t)) { errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); } });
  p.on('request', r => files.push(r.url()));
  const [w, h] = view, mobile = w < 1000;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument((slotName, prof) => {
    try { localStorage.setItem('nd:entered', '1'); if (prof) localStorage.setItem(`na:${slotName}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); } catch { /* fine */ }
  }, slot, profile);
  await p.goto(`${BASE}/?emu&slot=${slot}&${qs}${city ? '&city=2' : ''}`);
  await waitFor(p, '!!window.__district && window.__district.phase().done', `title ${slot}`, 25000);
  return { ctx, page: p, files };
}
const ev = (p, js) => p.evaluate(js);
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(100); }
  throw new Error(`timeout: ${what}`);
}
async function tapAt(p, x, y) {
  const c = await p.target().createCDPSession();
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await c.detach();
}
async function tap(p, sel) {
  const r = await p.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
  if (!r) throw new Error(`no ${sel}`);
  await tapAt(p, r.x, r.y);
}
const harborUp = p => waitFor(p, '!!(window.__district.harbor() && window.__district.harbor().shown)', 'the harbor baked', 15000);

try {
  // ================================================================ 1. ?city=2: the Harbor, no errors, every size
  const A = await open({ slot: 'ha', qs: NIGHT });
  await harborUp(A.page);
  const d = await ev(A.page, 'window.__district.scene()');
  const hb = await ev(A.page, 'window.__district.harbor()');
  ok(d.city === 2 && hb && hb.shown && hb.bakes >= 1, `CITY 2: ?city=2 shows the Harbor (baked ${hb && hb.bakes}×, ${hb && hb.mem.mb} MB of ${hb && hb.mem.budget} MB)`);
  ok(hb.mem.mb <= hb.mem.budget, `MEMORY BUDGET: the baked layers fit the tier's budget (${hb.mem.mb} ≤ ${hb.mem.budget} MB; main canvas ${hb.main.mb} MB)`);
  ok(hb.mem.layers.every(l => l.dpr <= 2), 'MEMORY: baked layers capped at DPR 2 on a phone');
  ok(A.files.some(u => /\/js\/screens\/harbor\/scene\.js/.test(u)), 'CITY 2: the harbor modules load with the flag');
  if (SHOTS) for (const [w, h] of [[390, 844], [402, 874], [412, 915], [430, 932], [874, 402], [1440, 900]]) {
    await A.page.setViewport({ width: w, height: h, deviceScaleFactor: w < 1000 ? 2 : 1, isMobile: w < 1000, hasTouch: w < 1000 });
    await sleep(1500);
    await A.page.screenshot({ path: `${OUT}night-${w}x${h}.png` });
  }
  await A.page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await sleep(800);

  // ================================================================ 1b. the lanes (real rects); a re-layout never blanks the city
  { const h1 = await ev(A.page, 'window.__district.harbor()'), sc = await ev(A.page, 'window.__district.scene()');
    const tr = sc.textRects || {}, corners = (sc.clear || []).filter(r => r.w < 70 && r.h < 70);
    // (the tagline lane IS the tagline's band: the slot later parts bring a line back in — it is checked against the rest)
    const hit = Object.entries(h1.lanes).filter(([n, r]) => [tr.neon, tr.word, n === 'tagline' ? null : tr.tag, ...corners].some(z => z && r.x < z.x + z.w && z.x < r.x + r.w && r.y < z.y + z.h && z.y < r.y + r.h)).map(([n]) => n);
    ok(!!tr.neon && hit.length === 0 && h1.lanes['sky-high'].h >= 40 && h1.lanes['sky-low'].h >= 24, `LANES: ${Object.keys(h1.lanes).length} lane rects, clear of the real sign + corner buttons (sky-high ${Math.round(h1.lanes['sky-high'].h)} pt, sky-low ${Math.round(h1.lanes['sky-low'].h)} pt${hit.length ? `; over: ${hit}` : ''})`); }
  { const D = await open({ slot: 'hd', qs: `when=2026-10-21T13:00${GR}` });
    await harborUp(D.page);
    await waitFor(D.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 15000);
    // every frame from just before setTier(1) until the new bake has landed and faded: the speakeasy's wall (stage band) and
    // the bottom of the sky, sampled after the scene drew
    const run = await ev(D.page, `new Promise(res => {
      const cv = document.querySelector('.nd-scene canvas'), d = window.__district.door(), hb = window.__district.harbor();
      const f = d.w / 1.5, px = d.x - 6.3 * f, py = d.y - 1.5 * f, sy = hb.cam.VPY - 30;
      const x = cv.getContext('2d');
      const read = (X, Y) => { const k = cv.width / cv.clientWidth; return Array.from(x.getImageData(Math.round(X * k), Math.round(Y * k), 1, 1).data).slice(0, 3); };
      const before = read(px, py), sky = read(4, sy), out = [];
      let n = 0, sawPending = false;
      const bakes0 = hb.bakes;
      const tick = () => {
        out.push(read(px, py)); n++;
        if (n === 3) window.__district.setTier(1);
        const h = window.__district.harbor();
        if (n >= 3 && h.pending) sawPending = true;
        if ((n > 6 && h.bakes > bakes0 && !h.pending && !h.fading) || n > 900) return res({ before, sky, out, n, sawPending, baked: h.bakes > bakes0 && !h.pending, tier: window.__district.scene().tier });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    })`);
    const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const worst = Math.max(...run.out.map(p => dist(p, run.before))), nearSky = run.out.filter(p => dist(p, run.sky) < 12).length, black = run.out.filter(p => p[0] + p[1] + p[2] < 24).length;
    ok(run.baked && run.tier <= 1 && worst < 60 && !nearSky && !black, `RE-LAYOUT: setTier(1) mid-session (then t${run.tier}: the per-frame reads slow it, so the scene may step down again) — over ${run.n} frames (bake + crossfade) the stage-band pixel never went blank (worst Δ ${Math.round(worst)} from rgb(${run.before}); bare sky ${nearSky}×, black ${black}×)`);
    await D.ctx.close(); }

  // ================================================================ 2. the flag is never saved; a normal visit is today's city
  const stored = await ev(A.page, `JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie`);
  ok(!/city/i.test(stored), 'NEVER SAVED: ?city=2 leaves nothing in localStorage, sessionStorage or cookies');
  { const files = []; A.page.on('request', r => files.push(r.url()));
    await A.page.goto(`${BASE}/?emu&slot=ha&${NIGHT}`);
    await waitFor(A.page, '!!window.__district && window.__district.phase().done', 'reload without the flag');
    const d2 = await ev(A.page, 'window.__district.scene()');
    ok(d2.city !== 2 && d2.signs.length >= 4 && (await ev(A.page, 'window.__district.harbor()')) === null && !files.some(u => /\/harbor\//.test(u)), 'NO FLAG: a reload without ?city=2 is today\'s city (its signs up, no harbor file loaded)'); }
  await A.ctx.close();
  { const N = await open({ slot: 'hn', qs: NIGHT, city: false });
    ok(!N.files.some(u => /\/harbor\//.test(u)) && (await ev(N.page, 'window.__district.scene()')).city !== 2, 'NORMAL VISIT: the default city, no harbor module requested');
    await N.ctx.close(); }

  // ================================================================ 3. every title flag works with ?city=2
  { const X = await open({ slot: 'hf', qs: `when=2026-10-14T13:00${GR}&wx=rain&speed=60&force=demo&grid=1&debug=1` });
    await harborUp(X.page);
    const s = await ev(X.page, 'window.__district.scene()'), h2 = await ev(X.page, 'window.__district.harbor()');
    const sp = await ev(X.page, 'window.__district.neon().now');
    await sleep(1200);
    const sp2 = await ev(X.page, 'window.__district.neon().now');
    ok(s.rain > 0 && Math.abs(s.w.day - 1) < 0.5 && h2.events.some(e => e.id === 'demo') && sp2 - sp > 30000,
      `FLAGS: &when &tz &at (day), &wx=rain (rain ${s.rain}), &speed=60 (+${Math.round((sp2 - sp) / 1000)} s of clock in ~1.2 s), &force=demo (the demo event in lane ${h2.events.map(e => e.lanes).join()}), &grid=1, &debug=1 — no errors`);
    if (SHOTS) await X.page.screenshot({ path: `${OUT}flags-grid-390x844.png` });
    await X.ctx.close(); }

  // ================================================================ 3b. Part 2: the tagline fades, the words, the searchlights, the wheel
  { const T = await open({ slot: 'h7', qs: `${NIGHT}&tagms=1500&force=spell,searchlights&text=2027` });
    // (the city laid out on the title's REAL text rects before the first reading: a sub-pt re-layout after it is not the bug)
    await harborUp(T.page);
    await waitFor(T.page, '(() => { const h = window.__district.harbor(), tr = window.__district.scene().textRects; return h && !h.pending && tr && Math.abs(h.cam.limitY - (tr.tag.y + tr.tag.h + 10)) < 1; })()', 'the city laid out on the real text rects', 9000);
    const h0 = await ev(T.page, 'window.__district.harbor()');
    await waitFor(T.page, `(() => { const t = document.querySelector('.nd-tag'); return t && getComputedStyle(t).opacity < 0.05 && window.__district.harbor().cam.tagGone; })()`, 'the tagline gone', 9000);
    await sleep(600);
    const h1 = await ev(T.page, 'window.__district.harbor()');
    // the real bug (fixed in Part 4): a re-layout forgetting the faded tagline — cam.tagGone off again, the lane shrunk back.
    // The positions get 1 pt (a sub-pt re-layout on a slow machine); the tagline's band is ≥ 10 pt, so the lane's move is clear.
    ok(h1.cam.tagGone && h1.lanes['sky-low'].y < h0.lanes['sky-low'].y - 8 && Math.abs(h1.cam.limitY - h0.cam.limitY) < 1 && Math.abs(h1.cam.VPY - h0.cam.VPY) < 1,
      `TAGLINE: fades out on its timer and stays gone; nothing in the city moves (limit ${h0.cam.limitY.toFixed(1)} → ${h1.cam.limitY.toFixed(1)}, horizon ${h0.cam.VPY.toFixed(1)} → ${h1.cam.VPY.toFixed(1)}), the freed band joins sky-low (${Math.round(h0.lanes['sky-low'].y)} → ${Math.round(h1.lanes['sky-low'].y)})`);
    await waitFor(T.page, '!!(window.__district.harbor().windows.spelling)', 'the word', 9000);
    await sleep(1500);
    const h2 = await ev(T.page, 'window.__district.harbor()');
    ok(h2.windows.spelling.text === '2027' && h2.windows.spelling.cells > 30 && h2.beams > 0.3 && h2.windows.share > 0.9,
      `WORDS + SEARCHLIGHTS: "${h2.windows.spelling.text}" lit on ${h2.windows.spelling.towers} (${h2.windows.spelling.cells} windows), beams ${h2.beams}, the night's share ${h2.windows.share}`);
    const w = h2.wheel, sp = await ev(T.page, 'window.__district.door()');
    ok(w.legs[0] > 0 && w.deck > w.y && h2.mem.layers.some(l => l.name === 'nearLit') && h2.mem.mb <= h2.mem.budget,
      `WHEEL + LIT LAYER: the wheel's legs at ${Math.round(w.legs[0])}–${Math.round(w.legs[1])} pt, deck ${Math.round(w.deck)}; lit windows baked in their own layers (${h2.mem.mb} of ${h2.mem.budget} MB)`);
    if (SHOTS) await T.page.screenshot({ path: `${OUT}part2-words-390x844.png` });
    void sp;
    await T.ctx.close();
  }
  // ================================================================ 3c. Part 3: the neon — signs, outlines, billboards, beacons, the scroll, moments
  { const N = await open({ slot: 'h8', qs: NIGHT });
    await waitFor(N.page, '(() => { const n = window.__district.harbor().neon; return n.items > 20 && n.built >= n.items && !n.queued; })()', 'the neon built', 15000);
    await sleep(5000);
    const h = await ev(N.page, 'window.__district.harbor()'), sc = await ev(N.page, 'window.__district.scene()');
    const games = h.neon.signs.filter(s => s.game).map(s => s.game);
    ok(new Set(games).size === 12 && h.neon.signs.filter(s => s.kind === 'named').length === 4 && h.neon.signs.every(s => s.on),
      `SIGNS: all 12 games in the skyline (${h.neon.signs.filter(s => s.kind === 'named').map(s => s.game).join(', ')} named tonight; the rest as tube icons), every sign lit at night`);
    ok(h.neon.outlines.length >= 12 && h.neon.outlines.some(o => o.id === 'needle') && h.neon.led === 2 && h.beacons.length >= 10,
      `NEON OUTLINES: ${h.neon.outlines.length} buildings outlined (the needle, the heroes…), the 2 glass towers' LED facades, ${h.beacons.length} aircraft beacons`);
    const sg = h.neon.signs.find(s => s.game), hit = await ev(N.page, `window.__district.hit(${sg.rect.x + sg.rect.w / 2}, ${sg.rect.y + sg.rect.h / 2})`);
    ok(hit && hit.kind === 'sign' && hit.id === sg.game, `A TAP ON A SIGN: ${sg.id} → ${hit && hit.kind} ${hit && hit.id} (its HOW TO PLAY)`);
    const sigs = await ev(N.page, '(window.__district.scene().signPower || []).length');
    ok(sigs === h.neon.items, `THE NEON PLAN: one power state per sign + outline (${sigs} of ${h.neon.items})`);
    const scroll = await ev(N.page, "(() => { const hb = window.__district.harbor(); const okk = hb.spell('HAPPY BIRTHDAY SAMANTHA', { style: 'scroll' }); return okk && window.__district.harbor().windows.spelling; })()");
    ok(scroll && scroll.style === 'scroll' && scroll.towers[0] === 'wordA', `THE SCROLL: a long message tickers across ${scroll && scroll.towers}`);
    await ev(N.page, "window.__district.harbor().moment('flash', { game: 'pulse' }), window.__district.harbor().billboard('bb-left', { game: 'rum' })");
    await sleep(300);
    const h2 = await ev(N.page, 'window.__district.harbor()');
    ok(h2.neon.moment.flash && h2.neon.boards[0].show === 'RUMRUNNER', `MOMENTS + BILLBOARDS: a game's flash sweeps the skyline; a billboard shows ${h2.neon.boards[0].show}`);
    ok(h2.mem.mb + h2.neon.mb <= h2.mem.budget, `MEMORY (neon): the sprites ${h2.neon.mb} MB + the baked layers ${h2.mem.mb} MB ≤ ${h2.mem.budget}`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part3-neon-390x844.png` });
    void sc;
    await N.ctx.close();
  }
  { const D = await open({ slot: 'h9', qs: `when=2026-10-21T13:00${GR}` });
    await sleep(3000);
    const h = await ev(D.page, 'window.__district.harbor()');
    ok(h.neon.signs.every(s => !s.on), 'BY DAY: the neon is off (the signs + outlines as unlit glass)');
    await D.ctx.close();
  }

  // ================================================================ 3d. Part 4: the water — the mirror, the light columns, the wind, the paths
  { const N = await open({ slot: 'hw', qs: `${NIGHT}&wind=0.5` });
    await harborUp(N.page);
    await waitFor(N.page, 'window.__district.harbor().neon.signs.every(s => s.on)', 'the neon on', 15000);
    await sleep(800);
    const h = await ev(N.page, 'window.__district.harbor()');
    ok(h.water.strips > 30 && h.water.copies > 0, `THE WATER: the mirror rippled row by row (${h.water.strips} rows), the lights' columns at night (${h.water.copies} copies)`);
    ok(h.water.rough < 0.05, `A CALM NIGHT (wind 0.5 m/s): a glassy mirror (roughness ${h.water.rough})`);
    // the HOTEL's red neon shows in the water below it (its mirror image: as far under the waterline as the sign is above it)
    const hot = h.neon.signs.find(s => s.id === 'hotel');
    const red = await ev(N.page, `(() => { const cv = document.querySelector('canvas'), x = cv.getContext('2d'), k = cv.width / innerWidth, y0 = ${h.water.y0}, y1 = ${h.water.y1};
      const cx = ${hot.rect.x + hot.rect.w / 2}, my = Math.min(y1 - 4, 2 * y0 - (${hot.rect.y + hot.rect.h * 0.8}));
      let best = 0; for (let dx = -4; dx <= 4; dx += 2) for (let dy = -8; dy <= 8; dy += 2) { const d = x.getImageData((cx + dx) * k, (my + dy) * k, 1, 1).data; best = Math.max(best, d[0] - Math.max(d[1], d[2]) * 0.5); }
      return best; })()`);
    ok(red > 40, `THE NEON IN THE WATER: the HOTEL's red mirrored under it (red excess ${Math.round(red)})`);
    ok(await ev(N.page, "['reflect', 'light', 'wake', 'set'].every(k => typeof window.__district.harbor().water[k] === 'function')"), 'THE HOOKS: reflect (boats, Part 5), light (fireworks, Part 10), wake (Part 5), set (rain + fog, Part 9)');
    ok(h.mem.mb + h.neon.mb <= h.mem.budget, `MEMORY (the water): ${h.mem.layers.find(l => /mirror/.test(l.name)).mb} MB in the ${h.mem.mb} MB of layers + the neon ${h.neon.mb} MB ≤ ${h.mem.budget}`);
    await ev(N.page, 'window.__district.setTier(0)'); await sleep(2500);
    const h0 = await ev(N.page, 'window.__district.harbor()');
    ok(h0.water.tier === 0 && h0.water.strips > 0, `TIER 0: the calm baked mirror (${h0.water.strips} rows, re-drawn once a second)`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part4-water-calm-390x844.png` });
    await N.ctx.close();
  }
  { const N = await open({ slot: 'hx', qs: `${NIGHT}&wind=13` });
    await harborUp(N.page); await sleep(1500);
    const h = await ev(N.page, 'window.__district.harbor()');
    ok(h.water.rough > 0.85 && h.water.copies >= 8, `A WINDY NIGHT (13 m/s): choppy (roughness ${h.water.rough}), longer broken columns (${h.water.copies} copies)`);
    if (SHOTS) await N.page.screenshot({ path: `${OUT}part4-water-windy-390x844.png` });
    await N.ctx.close();
  }
  { const G = await open({ slot: 'hy', qs: `when=2026-10-20T18:30${GR}&wind=3` });
    await harborUp(G.page); await sleep(1500);
    const g = await ev(G.page, 'window.__district.harbor().water');
    ok(/sun/.test(g.paths), `GOLDEN HOUR: the sun's gold path on the water (${g.paths})`);
    await G.ctx.close();
    const D = await open({ slot: 'hz', qs: `when=2026-10-21T13:00${GR}` });
    await harborUp(D.page); await sleep(1500);
    const d = await ev(D.page, 'window.__district.harbor().water');
    ok(/glints/.test(d.paths) && d.copies === 0, `BY DAY: sun glints on the water, no light columns (${d.paths}; ${d.copies} copies)`);
    await D.ctx.close();
  }

  // ================================================================ 4. the dock: HOST, JOIN, the knock on the door
  const H = await open({ slot: 'hh', qs: NIGHT });
  await harborUp(H.page);
  await tap(H.page, '.nd-hostbtn');
  await waitFor(H.page, '!!window.__arcade.state.code && !!document.querySelector(".lobby-screen")', 'lobby after HOST', 20000);
  const code = await ev(H.page, 'window.__arcade.state.code');
  ok(!!code, `HOST (city 2): one tap opens room ${code}`);
  ok(/[?&]city=2(&|$)/.test(await ev(H.page, 'location.search')) && /room=/.test(await ev(H.page, 'location.search')), `THE FLAG IN THE URL: the room's address keeps city=2 (${await ev(H.page, 'location.search')})`);
  await H.page.reload();
  await waitFor(H.page, '!!window.__arcade && window.__arcade.state.code === ' + JSON.stringify(code), 'rejoin after a refresh', 20000);
  ok(/[?&]city=2(&|$)/.test(await ev(H.page, 'location.search')), 'THE FLAG IN THE URL: a refresh in the lobby rejoins and stays on city=2');
  const B = await open({ slot: 'hb', qs: NIGHT, view: [402, 874] });
  await harborUp(B.page);
  const door = await ev(B.page, 'window.__district.door()');
  const blocked = await ev(B.page, `(() => { const d = ${JSON.stringify(door.rect)}; return [...document.querySelectorAll('.nd-ringbtn, .nd-tab, .nd-bar, .menu-btn, .music-btn')].map(e => e.getBoundingClientRect()).filter(r => r.width && d.x < r.right && d.x + d.w > r.left && d.y < r.bottom && d.y + d.h > r.top).length; })()`);
  ok(door.rect.w >= 44 && door.rect.h >= 44 && !blocked, `THE DOOR: a ${Math.round(door.rect.w)}×${Math.round(door.rect.h)} pt tap target, clear of the dock and the corner buttons`);
  await tapAt(B.page, door.rect.x + door.rect.w / 2, door.rect.y + door.rect.h / 2);
  await waitFor(B.page, "document.querySelector('.nd-actions').classList.contains('is-join')", 'JOIN from the knock', 4000).catch(() => {});
  ok((await ev(B.page, "document.querySelector('.nd-actions').classList.contains('is-join')")) && (await ev(B.page, 'window.__district.street().people.knocks')) === 1, 'KNOCK (city 2): a tap on the speakeasy\'s door opens JOIN');
  await tap(B.page, '.nd-codebox'); await sleep(250);
  await B.page.keyboard.type(code.toLowerCase(), { delay: 90 });
  await waitFor(B.page, '!!window.__arcade.state.code', 'B joined', 20000);
  ok((await ev(B.page, 'window.__arcade.state.code')) === code, 'JOIN (city 2): typing the hush word joins the room');
  await H.ctx.close(); await B.ctx.close();

  // ================================================================ 5. frame pacing at 4× CPU, memory over 20 cycles, a hidden tab
  const Q = await open({ slot: 'hq', qs: `when=2026-10-24T23:00${GR}` });   // a Saturday at the party's peak
  await harborUp(Q.page);
  await Q.page.bringToFront();
  const cdp = await Q.page.target().createCDPSession();
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const perf = [];
  for (const t of [2, 1, 0]) {
    await ev(Q.page, `window.__district.setTier(${t})`);
    await waitFor(Q.page, '!window.__district.harbor().pending', 're-bake', 15000);
    await sleep(6000);
    const cost = await ev(Q.page, 'window.__district.cost()'), fr = [...await ev(Q.page, 'window.__district.frames()')].sort((a, b) => a - b);
    perf.push({ tier: t, now: await ev(Q.page, 'window.__district.scene().tier'), cost: +(cost.reduce((a, b) => a + b, 0) / cost.length).toFixed(2), p50: +fr[Math.floor(fr.length / 2)].toFixed(1) });
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  writeFileSync(`${OUT}perf.json`, JSON.stringify(perf, null, 1));
  ok(perf.every(p => p.cost <= BUDGET_MS && p.p50 <= 18), `PERF (city 2, party peak, ${CPU}× CPU): scene work ${perf.map(p => `t${p.tier}: ${p.cost} ms/frame, p50 ${p.p50}`).join(' · ')} (budget ${BUDGET_MS} ms)`);
  await setTierBack();
  async function setTierBack() { await ev(Q.page, 'window.__district.setTier(2)'); await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 're-bake', 15000); }
  const mem0 = (await ev(Q.page, 'window.__district.harbor()')).mem.mb;
  await cdp.send('HeapProfiler.collectGarbage');
  const q0 = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  for (let i = 0; i < 20; i++) {
    await Q.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'setup', setupMode: 'host' })));
    await sleep(600);
    await Q.page.evaluate(() => import('/js/store.js').then(m => m.setState({ view: 'title' })));
    await sleep(700);
  }
  await waitFor(Q.page, '!!window.__district && !!window.__district.harbor() && window.__district.harbor().shown', 'back on the title', 15000);
  await sleep(800);
  await waitFor(Q.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled (the memory is read between crossfades)', 15000);
  await cdp.send('HeapProfiler.collectGarbage');
  const q1 = (await cdp.send('Runtime.getHeapUsage')).usedSize;
  const mem1 = (await ev(Q.page, 'window.__district.harbor()')).mem.mb;
  const scenes = await ev(Q.page, `document.querySelectorAll('.nd-scene').length`);
  ok(scenes === 1 && q1 - q0 < 6e6 && Math.abs(mem1 - mem0) < 0.01, `MEMORY: 20 title↔setup cycles leave one city, heap ${Math.round((q1 - q0) / 1e5) / 10} MB, offscreen ${mem0} → ${mem1} MB`);
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === false, 'HIDDEN TAB (city 2): the Harbor stops rendering');
  await Q.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(300);
  ok((await ev(Q.page, 'window.__district.scene()')).running === true, 'VISIBLE AGAIN: it resumes');

  // ================================================================ 5b. BATTERY (cleanup pass 1): a calm night draws every other frame; a hidden page draws none
  { const C = await open({ slot: 'hc', qs: `${NIGHT}&force=no-planes,no-birds` });
    await harborUp(C.page);
    await waitFor(C.page, '!window.__district.harbor().pending && !window.__district.harbor().fading', 'settled', 15000);
    await waitFor(C.page, "window.__district.harbor().rate.fast === ''", 'the city calm (the neon booted)', 20000);   // (the boot's sputters count as motion)
    await sleep(500);
    const r0 = await ev(C.page, 'window.__district.harbor().rate'); await sleep(3000); const r1 = await ev(C.page, 'window.__district.harbor().rate');
    const fps = (r1.drawn - r0.drawn) / 3;
    ok(r1.fast === '' && fps > 22 && fps < 40, `BATTERY: a calm night draws ${fps.toFixed(0)} frames a second (every other rAF; fast: '${r1.fast || 'calm'}')`);
    await C.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(400); const h0 = await ev(C.page, 'window.__district.harbor().rate'); await sleep(600); const h1 = await ev(C.page, 'window.__district.harbor().rate');
    ok(h1.drawn === h0.drawn && h1.running === false, `BATTERY: hidden, nothing is drawn (${h0.drawn} → ${h1.drawn})`);
    await C.page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await sleep(600); const v = await ev(C.page, 'window.__district.harbor().rate');
    ok(v.running && v.drawn > h1.drawn + 20 && v.fast !== '', `BATTERY: visible again, it resumes at 60 fps for a moment (fast: ${v.fast})`);
    await C.ctx.close(); }
  await Q.ctx.close();
} catch (e) {
  errors.push(`FATAL ${e.message}`);
  log('FAILED', e.message);
}
const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed`);
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
writeFileSync(`${OUT}result.json`, JSON.stringify({ checks, errors }, null, 1));
await browser.close();
process.exit(errors.length ? 1 : 0);
