// JAYWALK SMOOTH — the meter + measure checks (tests/integration/jaywalk-lab.mjs `--smooth=hud|gpu` [--tag before|after] [--ab <base>]).
//   hud — GROUP 1: THE FRAME METER at 390 / 402 / 430 (+ 1440): it reads, it stays off the lanes' middle, its 10 S TEST records + reports, and
//         without &hud=1 the page never fetches it
//   gpu — GROUP 3: what the sun's depth pass + the main pass cost on the GPU (timer queries, per render target) and in the frame's JS
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { stutterOf, stutterLine } from './frame-report.mjs';

export const SCENES = {
  noon: '&tod=noon&weather=clear&date=2026-07-15',
  golden: '&tod=golden&weather=clear&date=2026-07-15',
  night: '&tod=night&weather=clear&date=2026-07-15',
  snow: '&tod=noon&weather=clear&date=2026-12-24&snow=heavy',
};
/** SMOOTH 2 — every season's look for THE SAME PICTURE (`--smooth=same:<names>`, against the code before with `--ab <base>`) */
export const SEASON_SCENES = {
  ...SCENES,
  autumn: '&tod=noon&weather=clear&date=2026-11-23', autumnNight: '&tod=night&weather=clear&date=2026-11-23', autumnGolden: '&tod=golden&weather=clear&date=2026-11-25',
  snowNight: '&tod=night&weather=clear&date=2026-12-24&snow=heavy', lightSnow: '&tod=noon&weather=clear&date=2027-01-20&snow=light', lightNight: '&tod=night&weather=clear&date=2027-01-20&snow=light',
  eve: '&tod=night&weather=clear&date=2026-12-31&clock=21:00',
  // (SMOOTH 3: every tinted look, the band's blend layer)
  sunrise: '&tod=sunrise&weather=clear&date=2026-07-15', sunset: '&tod=sunset&weather=clear&date=2026-07-15', overcast: '&tod=noon&weather=overcast&date=2026-07-15',
  dec1: '&tod=noon&weather=clear&date=2026-12-01', dec1Night: '&tod=night&weather=clear&date=2026-12-01',
  dec3: '&tod=noon&weather=clear&date=2026-12-03', dec3Night: '&tod=night&weather=clear&date=2026-12-03',   // (LAST MILE — THE WINTER GROUND)
  snowGolden: '&tod=golden&weather=clear&date=2026-12-24&snow=heavy', snowOvercast: '&tod=noon&weather=overcast&date=2026-12-24&snow=heavy',
};
const seasonIn = '(() => { const s = window.__jwLab.view.season(); return !!(s.pack || (s.sp && s.sp.pileModel)); })()';

/** in the page: every GPU pass timed by the render target it drew to (`main` = the canvas), + the JS time between binding a target and leaving it */
const installTimers = () => {
  const cv = document.querySelector('canvas.jw-canvas'), gl = cv.getContext('webgl2'), X = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const T = window.__gt = { ok: !!X, done: { main: [], rt: [] }, js: [], on: false };
  if (!X) return false;
  const pend = [];
  let cur = null, jsAt = 0;
  const stop = () => { if (cur) { gl.endQuery(X.TIME_ELAPSED_EXT); pend.push(cur); cur = null; } };
  const go = label => { stop(); if (!T.on) return; const q = gl.createQuery(); gl.beginQuery(X.TIME_ELAPSED_EXT, q); cur = { q, label }; };
  const bind = gl.bindFramebuffer.bind(gl);
  gl.bindFramebuffer = (t, fb) => { bind(t, fb); if (t !== gl.FRAMEBUFFER && t !== gl.DRAW_FRAMEBUFFER) return; if (fb) { jsAt = performance.now(); go('rt'); } else { if (jsAt) { if (T.on) T.js.push(performance.now() - jsAt); jsAt = 0; } go('main'); } };
  const poll = () => {
    for (let i = pend.length - 1; i >= 0; i--) {
      const P = pend[i];
      if (!gl.getQueryParameter(P.q, gl.QUERY_RESULT_AVAILABLE)) continue;
      if (!gl.getParameter(X.GPU_DISJOINT_EXT)) T.done[P.label].push(gl.getQueryParameter(P.q, gl.QUERY_RESULT) / 1e6);
      gl.deleteQuery(P.q); pend.splice(i, 1);
    }
  };
  // (a query never spans the idle gap between two frames: the frame's first clear opens it, the end of the frame closes it)
  const clear = gl.clear.bind(gl);
  gl.clear = m => { if (!cur && T.on) go('main'); clear(m); };
  const loop = () => { stop(); poll(); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  return true;
};
const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };

export async function looksSmooth({ open, up, ok, sleep, waitFor, out, what = '', b, errs = [], tag = 'after', abBase = null }) {
  const all = !what;
  if (all || what === 'hud') {
    for (const [w, hh] of [[390, 844], [402, 874], [430, 932], [1440, 900]]) {
      const o = await open(w, hh, w > 500 ? 1 : 3, `&preview=1&seed=look3&tier=2&zoom=8&angle=straight&cv=2&hud=1${SCENES.noon}`);
      await up(o.p);
      ok(await waitFor(o.p, "!!document.querySelector('.jw-meter') && /FPS/.test(document.querySelector('.jw-m-big').textContent)"), `THE METER shows at ${w}`);
      const r = await o.p.evaluate(() => { const b = document.querySelector('.jw-meter').getBoundingClientRect(), L = [...document.querySelectorAll('.jw-m-l')].map(e => e.scrollWidth - e.clientWidth), t = document.querySelector('.jw-m-btn').getBoundingClientRect(), J = window.__jwLab, kid = J.state().kidY; return { l: b.left, r: b.right, top: b.top, bot: b.bottom, over: Math.max(...L), bh: t.height, bw: t.width, kid: kid * innerHeight, W: innerWidth, H: innerHeight }; });
      ok(r.r <= r.W / 2 - 22 && r.l >= 0, `… left of the lane counter at ${w} (right edge ${r.r.toFixed(0)} of ${r.W})`);
      ok(r.bot < r.kid - 80, `… well above the kid's lane at ${w} (bottom ${r.bot.toFixed(0)}, kid ${r.kid.toFixed(0)})`);
      ok(r.over <= 0, `… no line cut off at ${w} (${r.over} px over)`);
      ok(r.bh >= 44, `… the 10 S TEST button is a 44 pt target at ${w} (${r.bh.toFixed(0)} px)`);
      if (out) { const f = join(out, 'hud', `hud-${w}.png`); mkdirSync(dirname(f), { recursive: true }); await o.p.screenshot({ path: f }); }
      if (w === 390) {
        const hops = await o.p.evaluate(() => window.__jwLab.state().hops);
        const c = await o.p.createCDPSession(), box = await o.p.evaluate(() => { const b = document.querySelector('.jw-m-btn').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
        await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box[0], y: box[1], id: 1 }] }); await sleep(40); await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await c.detach();
        ok(await waitFor(o.p, "/RECORDING/.test(document.querySelector('.jw-m-btn').textContent)", 3000), 'THE 10 S TEST starts on a real touch');
        ok(await o.p.evaluate(h0 => window.__jwLab.state().hops === h0, hops), '… and that touch is no hop');
        ok(await waitFor(o.p, "/DROPS/.test(document.querySelector('.jw-m-res').textContent)", 16000), '… and leaves its summary line after 10 s');
        const line = await o.p.evaluate(() => document.querySelector('.jw-m-res').textContent);
        console.log(`     THE 10 S LINE: ${line}`);
        if (out) await o.p.screenshot({ path: join(out, 'hud', 'hud-390-test.png') });
      }
      errs.push(...o.errs); await o.close();
    }
    const o = await open(390, 844, 3, '&preview=1&seed=look3&tier=2&cv=2');
    await up(o.p); await sleep(800);
    ok(!o.reqs.some(u => u.includes('lab-hud')) && !(await o.p.evaluate(() => !!document.querySelector('.jw-meter'))), 'without &hud=1 the meter is never fetched or shown');
    errs.push(...o.errs); await o.close();
  }

  // tiers — GROUP 2: 45 s of hopping at 10× / 6× / 4× CPU, the new rule against &smooth=0, every tier change logged: never a flap
  if (what === 'tiers' || what.startsWith('tiers:')) {
    const rates = what.startsWith('tiers:') ? what.slice(6).split('+').map(Number) : [10, 6, 4];
    for (const rate of rates) for (const smooth of [1, 0]) {
      const o = await open(390, 844, 3, `&preview=1&seed=look3&zoom=8&angle=straight&cv=2${SCENES.noon}${smooth ? '' : '&smooth=0'}`);
      await up(o.p);
      const cdp = await o.p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'look3'); J.bot(true); window.__tl = []; let last = -1; const t0 = performance.now(); setInterval(() => { const t = J.view.tier(); if (t !== last) { window.__tl.push([Math.round(performance.now() - t0), t]); last = t; } if (J.state().st === 'out') J.restart('solo'); }, 100); });
      await sleep(45000);
      const tl = await o.p.evaluate(() => window.__tl);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const ups = tl.filter((r, i) => i && r[1] > tl[i - 1][1]).length;
      console.log(`     TIER LOG ${smooth ? 'NEW' : 'OLD'} at ${rate}× CPU: ${tl.map(([t, k]) => `${(t / 1000).toFixed(1)} s → ${k}`).join(' · ')}`);
      if (smooth) ok(ups <= 1 && tl.length <= 4, `TIERS at ${rate}× CPU: no flap (${tl.map(r => r[1]).join(' → ')}; ${ups} back up)`);
      errs.push(...o.errs); await o.close();
    }
  }

  // same — GROUP 3's proof: frozen frames, this pass against &smooth=0 (the same seed, tick, camera, reduce motion so the shaders' clocks stand
  // still): every pixel compared, 390 @3 — six ticks in a row on a moving car, every look, tier 2 + 1, four areas
  if (what === 'same' || what.startsWith('same:')) {
    const looks = what.startsWith('same:') ? what.slice(5).split('+') : ['noon', 'golden', 'night', 'snow'], LANES = [['downtown', 252], ['docks', 60], ['canal', 310], ['airfield', 410]];
    const cmpCtx = await b.createBrowserContext(), cmp = await cmpCtx.newPage();
    const diff = (A, B) => cmp.evaluate(async (a, c) => { const load = async u => { const i = new Image(); i.src = u; await i.decode(); const v = new OffscreenCanvas(i.width, i.height), x = v.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; }; const P = await load(a), Q = await load(c); let n = 0, big = 0; for (let k = 0; k < P.length; k += 4) { const d = Math.max(Math.abs(P[k] - Q[k]), Math.abs(P[k + 1] - Q[k + 1]), Math.abs(P[k + 2] - Q[k + 2])); if (d > 2) n++; if (d > big) big = d; } return { pct: 100 * n / (P.length / 4), big }; }, `data:image/png;base64,${A}`, `data:image/png;base64,${B}`);
    const frozen = async (sq, tier, smooth, lane, t) => { const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=straight&cv=2${sq}${smooth || abBase ? '' : '&smooth=0'}`, { reduce: true, ...(!smooth && abBase ? { base: abBase } : {}) }); await up(o.p); if (/snow=|date=2026-1[12]-(0[13]|2[3-5]|31)/.test(sq)) await waitFor(o.p, seasonIn, 30000); await o.p.evaluate(l => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.warp(J.find('grass', l)); }, lane); await waitFor(o.p, '(() => { const i = window.__jwLab.view.info(), v = i.variety, p = i.props; return v && !v.loading && !v.queued && !v.staged && !v.drops && p && !p.loading && !p.queued && !p.staged && !p.drops; })()', 30000); await sleep(1400); return o; };
    const grab = async (o, t) => { await o.p.evaluate(tt => { const J = window.__jwLab; J.freeze(false); J.setT(tt); J.freeze(true); }, t); await sleep(1250); return o.p.screenshot({ encoding: 'base64' }); };
    // (SMOOTH 3: the tinted bands now blend in their own group: 8-bit rounding moves a few pixels by at most 3 / 255, which is the allowance, on under 0.05 % of them)
    let worst = 0, count = 0;
    for (const lk of looks) for (const tier of [2, 1]) for (const [an, lane] of tier === 2 ? LANES : LANES.slice(0, 1)) {
      const A = await frozen(SEASON_SCENES[lk], tier, true, lane), B = await frozen(SEASON_SCENES[lk], tier, false, lane);
      const ticks = tier === 2 && an === 'downtown' ? [2400, 2401, 2402, 2403, 2404, 2405] : [2400, 3100];
      let w = 0, big = 0;
      for (const t of ticks) { const a = await grab(A, t), c = await grab(B, t), d = await diff(a, c); count++; if (d.pct > w) w = d.pct; if (d.big > big) big = d.big; if (out && (t === ticks[0] || process.env.SAME_ALL)) { const f = join(out, 'same', `${lk}-t${tier}-${an}${t === ticks[0] ? '' : `-${t}`}.png`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, Buffer.from(a, 'base64')); } }
      if (w > worst) worst = w;
      ok(w < 0.01 || (w < 0.05 && big <= 3), `THE SAME PICTURE ${lk} tier ${tier} ${an}: ${ticks.length} frozen frames, at most ${w.toFixed(4)} % of pixels differ (largest difference ${big} / 255)`);
      errs.push(...A.errs, ...B.errs); await A.close(); await B.close();
    }
    await cmpCtx.close();
    console.log(`     THE SAME PICTURE: ${count} frames compared, worst ${worst.toFixed(4)} %`);
  }

  // table — GROUP 5: THE BEFORE / AFTER at a throttle where a frame has no slack (6× CPU, 390 @3, 8 kids): every look × DOWNTOWN standing + an area's
  // models all arriving × tier 2 + 1, this code against &smooth=0, interleaved, `table:<reps>` runs each
  if (what === 'table' || what.startsWith('table:')) {
    const reps = what.startsWith('table:') ? Number(what.slice(6)) : 2, RATE = 6, got = {};
    for (let rep = 0; rep < reps; rep++) for (const [name, sq] of Object.entries(SCENES)) for (const tier of [2, 1]) for (const where of ['downtown', 'area']) for (const smooth of rep % 2 ? [0, 1] : [1, 0]) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=straight&cv=2${sq}${smooth ? '' : '&smooth=0'}`);
      await up(o.p);
      if (/snow=/.test(sq)) await waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);
      await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.ghosts(7); J.warp(J.find('grass', 252)); });
      await waitFor(o.p, '(() => { const i = window.__jwLab.view.info(), v = i.variety, p = i.props; return v && !v.loading && !v.queued && !v.staged && !v.drops && (!p || (!p.loading && !p.queued && !p.staged && !p.drops)); })()', 30000);
      await sleep(1200);
      const cdp = await o.p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
      await sleep(800);
      await o.p.evaluate(a => { const J = window.__jwLab; J.clearFrames(); if (a) { setTimeout(() => J.view.varietyAgain(), 1000); setTimeout(() => J.view.varietyAgain(), 4600); } }, where === 'area');
      await sleep(8000);
      const r = await o.p.evaluate(() => ({ fr: window.__jwLab.frames(), co: window.__jwLab.cost() }));
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const S = stutterOf(r.fr), k = `${name}|${where}|${tier}|${smooth}`;
      (got[k] = got[k] || []).push({ ...S, work: q(r.co, 0.5), workP95: q(r.co, 0.95) });
      console.log(`     TABLE ${smooth ? 'after ' : 'before'} ${name} ${where} t${tier} (run ${rep + 1}): ${stutterLine(S)} · work ${q(r.co, 0.5).toFixed(1)} ms`);
      errs.push(...o.errs); await o.close();
    }
    const avg = (L, f) => L.reduce((a, x) => a + x[f], 0) / L.length, top = (L, f) => Math.max(...L.map(x => x[f]));
    const lines = ['| look | where | tier | dropped a run | big a run | p95 ms | worst ms | frame work ms |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
    for (const name of Object.keys(SCENES)) for (const where of ['downtown', 'area']) for (const tier of [2, 1]) {
      const B = got[`${name}|${where}|${tier}|0`], A = got[`${name}|${where}|${tier}|1`];
      if (!A || !B) continue;
      const pair = (f, d = 1) => `${avg(B, f).toFixed(d)} → ${avg(A, f).toFixed(d)}`;
      lines.push(`| ${name} | ${where === 'area' ? 'area change' : 'DOWNTOWN'} | ${tier} | ${pair('drops')} | ${pair('big')} | ${pair('p95')} | ${top(B, 'worst').toFixed(0)} → ${top(A, 'worst').toFixed(0)} | ${pair('work', 2)} |`);
    }
    console.log(lines.join('\n'));
    if (out) { const f = join(out, 'table', 'before-after.md'); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, lines.join('\n') + '\n'); writeFileSync(join(out, 'table', 'before-after.json'), JSON.stringify(got, null, 1)); }
  }

  // season — SMOOTH 2 (Group 5): a played run (the bot) in every season, by day + by night, tiers 2 + 1, `season:<reps>:<rate>` — a season may not add BIG
  // frames (> 33 ms) over SUMMER's, the same look + tier, interleaved. The cloud has no GPU: it only reports.
  if (what === 'season' || what.startsWith('season:')) {
    const [, r0, r1] = what.split(':'), reps = Number(r0) || 2, rate = Number(r1) || 4, SECS = Number(process.env.SMOOTH_SECS) || 12;
    const DAYS = { summer: '&date=2026-07-15', autumn: '&date=2026-11-23', 'dec 24 heavy': '&date=2026-12-24&snow=heavy', 'jan 20 light': '&date=2027-01-20&snow=light', 'dec 31 finale': '&date=2026-12-31&clock=23:58' };
    const LOOKS = { noon: '&tod=noon&weather=clear', night: '&tod=night&weather=clear' }, got = {};
    for (let rep = 0; rep < reps; rep++) for (const [ln, lq] of Object.entries(LOOKS)) for (const tier of [2, 1]) {
      const names = Object.keys(DAYS), order = rep % 2 ? [...names].reverse() : names;
      for (const dn of order) {
        const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=straight&cv=2${lq}${DAYS[dn]}`);
        await up(o.p);
        if (dn !== 'summer') await waitFor(o.p, "(() => { const s = window.__jwLab.view.season(); return !!(s.pack || (s.sp && (s.sp.pileModel || s.sp.fw))); })()", 30000);
        await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.bot(true); window.__seaT = setInterval(() => { if (J.state().over) J.restart('solo', 'perfseed7'); }, 150); });
        await sleep(3500);   // (V8 has optimized the frame's code before the throttle)
        const cdp = await o.p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate });
        await sleep(600); await o.p.evaluate(() => window.__jwLab.clearFrames());
        await sleep(SECS * 1000);
        const r = await o.p.evaluate(() => ({ fr: window.__jwLab.frames(), co: window.__jwLab.cost(), sp: window.__jwLab.view.season().sp }));
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
        const S = stutterOf(r.fr), k = `${ln}|${tier}|${dn}`;
        (got[k] = got[k] || []).push({ ...S, work: q(r.co, 0.5), workP99: q(r.co, 0.99), sparks: r.sp && r.sp.fw ? r.sp.fw.bursts : 0 });
        console.log(`     SEASON ${ln} t${tier} ${dn} (run ${rep + 1}): ${stutterLine(S)} · work ${q(r.co, 0.5).toFixed(1)} (p99 ${q(r.co, 0.99).toFixed(1)}) ms`);
        errs.push(...o.errs); await o.close();
      }
    }
    const avg = (L, f) => L.reduce((a, x) => a + x[f], 0) / L.length, top = (L, f) => Math.max(...L.map(x => x[f]));
    const lines = ['| look | tier | season | frames | BIG a run | dropped a run | p99 ms | worst ms | frame work ms (p50 / p99) |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- |'];
    for (const ln of Object.keys(LOOKS)) for (const tier of [2, 1]) {
      const base = got[`${ln}|${tier}|summer`];
      for (const dn of Object.keys(DAYS)) {
        const L = got[`${ln}|${tier}|${dn}`];
        lines.push(`| ${ln} | ${tier} | ${dn} | ${Math.round(avg(L, 'n'))} | ${avg(L, 'big').toFixed(1)} | ${avg(L, 'drops').toFixed(1)} | ${avg(L, 'p99').toFixed(1)} | ${top(L, 'worst').toFixed(0)} | ${avg(L, 'work').toFixed(1)} / ${avg(L, 'workP99').toFixed(1)} |`);
        if (dn !== 'summer' && !process.env.CI) ok(avg(L, 'big') <= avg(base, 'big') + 3, `${dn} adds no BIG frames over summer (${ln}, tier ${tier}: ${avg(L, 'big').toFixed(1)} a run, summer ${avg(base, 'big').toFixed(1)})`);
      }
    }
    console.log(lines.join('\n'));
    if (out) { const f = join(out, 'season', `season-${tag}.md`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, lines.join('\n') + '\n'); writeFileSync(join(out, 'season', `season-${tag}.json`), JSON.stringify(got, null, 1)); }
  }

  // ab — one scene, several URL variants, interleaved, each page's frame work + drops at 6× CPU (`ab:<look>:<tier>:<reps>`; SMOOTH_AB = variants split by |)
  if (what.startsWith('ab:')) {
    const [, look, tier, reps] = what.split(':'), V = (process.env.SMOOTH_AB || '|&smooth=0').split('|'), got = V.map(() => []);
    for (let rep = 0; rep < Number(reps); rep++) for (let vi = 0; vi < V.length; vi++) {
      const k = (vi + rep) % V.length;
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=straight&cv=2${SCENES[look]}${V[k]}`);
      await up(o.p);
      if (look === 'snow') await waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);
      await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.ghosts(7); J.warp(J.find('grass', 252)); });
      await waitFor(o.p, '(() => { const i = window.__jwLab.view.info(), v = i.variety, p = i.props; return v && !v.loading && !v.queued && !v.staged && !v.drops && (!p || (!p.loading && !p.queued && !p.staged && !p.drops)); })()', 30000);
      await sleep(Number(process.env.SMOOTH_WARM) || 1200);   // (how long the page runs unthrottled first: V8 must have optimized the frame's code, or the throttle freezes it cold)
      const cdp = await o.p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
      await sleep(800);
      await o.p.evaluate(() => window.__jwLab.clearFrames());
      if (process.env.SMOOTH_PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); }
      await sleep(6000);
      const prof = process.env.SMOOTH_PROFILE ? (await cdp.send('Profiler.stop')).profile : null;
      const r = await o.p.evaluate(() => ({ fr: window.__jwLab.frames(), co: window.__jwLab.cost(), i: window.__jwLab.view.info() }));
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const S = stutterOf(r.fr);
      if (prof) {
        const self = new Map(), byId = new Map(prof.nodes.map(n => [n.id, n])), dt = prof.timeDeltas;
        prof.samples.forEach((id, i) => { const c = byId.get(id).callFrame, key = `${c.functionName || '(anon)'} ${c.url.split('/').pop().split('?')[0]}:${c.lineNumber + 1}`; self.set(key, (self.get(key) || 0) + (dt[i] || 0)); });
        const top = [...self].filter(([k]) => !/^\(idle\)|^\(program\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 9).map(([k, v]) => `${(v / 1000 / Math.max(1, S.n)).toFixed(2)} ${k}`);
        const lines = new Map(); for (const n of prof.nodes) if (n.callFrame.functionName === 'frame' && n.callFrame.url.includes('lab.js')) for (const t of n.positionTicks || []) lines.set(t.line, (lines.get(t.line) || 0) + t.ticks);
        const totalMs = [...self].filter(([key]) => !/^\(idle\)/.test(key)).reduce((a, x) => a + x[1], 0) / 1000 / Math.max(1, S.n);
        console.log(`     LINES [${V[k] || 'default'}] run ${rep + 1}: busy ${totalMs.toFixed(1)} ms a frame · frame()'s ticks by line: ${[...lines].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([l, c]) => `${l}:${c}`).join('  ')}`);
        console.log(`     PROFILE [${V[k] || 'default'}] run ${rep + 1}: work ${q(r.co, 0.5).toFixed(1)} ms, ${S.drops} drops — ms a frame: ${top.join(' | ')}`);
      }
      got[k].push({ work: q(r.co, 0.5), drops: S.drops, n: S.n, calls: r.i.calls, tris: r.i.tris, held: r.i.variety.held.length, props: r.i.props ? r.i.props.kinds : 0 });
      errs.push(...o.errs); await o.close();
    }
    V.forEach((v, k) => console.log(`     AB ${look} t${tier} [${v || 'default'}]: work ${got[k].map(x => x.work.toFixed(1)).join(' ')} · drops ${got[k].map(x => x.drops).join(' ')} · calls ${got[k][0].calls} · tris ${got[k][0].tris} · models ${got[k][0].held} + ${got[k][0].props}`));
  }

  // passes — SMOOTH 3: the compositor's render passes a frame in every look (Chromium's viz trace, 390 @3, a played run), `--ab <base>` = the code before
  // beside it. A look with no tint draws ONE pass; NO look may draw a screen-sized group besides the root (that group is the 3D canvas pulled into a blend).
  if (what === 'passes') {
    const LOOKS = { noon: '&tod=noon&weather=clear&date=2026-07-15', sunrise: '&tod=sunrise&weather=clear&date=2026-07-15', golden: '&tod=golden&weather=clear&date=2026-07-15', sunset: '&tod=sunset&weather=clear&date=2026-07-15', overcast: '&tod=noon&weather=overcast&date=2026-07-15', night: '&tod=night&weather=clear&date=2026-07-15', 'autumn noon': '&tod=noon&weather=clear&date=2026-11-23', 'snow noon': '&tod=noon&weather=clear&date=2026-12-24&snow=heavy', 'snow golden': '&tod=golden&weather=clear&date=2026-12-24&snow=heavy', 'snow night': '&tod=night&weather=clear&date=2026-12-24&snow=heavy' };
    const TINTED = /sunrise|golden|sunset|overcast/;
    const measure = async (sq, base) => {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=2&zoom=8&angle=straight&cv=2${sq}`, base ? { base } : {});
      await up(o.p);
      if (/date=2026-1[12]/.test(sq)) await waitFor(o.p, seasonIn, 30000);
      await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.bot(true); window.__passT = setInterval(() => { if (J.state().over) J.restart('solo', 'perfseed7'); }, 150); });
      await sleep(2500);
      await o.p.tracing.start({ categories: ['viz', 'cc', 'gpu', 'disabled-by-default-viz.quads'] });
      await sleep(2000);
      const ev = JSON.parse(Buffer.from(await o.p.tracing.stop()).toString('utf8')).traceEvents || [];
      const count = n => ev.filter(e => e.name === n && (e.ph === 'X' || e.ph === 'B')).length;
      const shots = ev.filter(e => e.name === 'LayerTreeHostImpl:snapshot' && e.args && e.args.snapshot && e.args.snapshot.frame && (e.args.snapshot.frame.render_passes || []).length);
      const rects = shots.length ? shots[shots.length - 1].args.snapshot.frame.render_passes.map(r => r.output_rect) : [];
      errs.push(...o.errs); await o.close();
      return { passes: count('DirectRenderer::DrawRenderPass') / Math.max(1, count('DirectRenderer::DrawFrame')), groups: rects.slice(0, -1).filter(r => r[3] >= 844 * 0.9).length, sizes: rects.slice(0, -1).map(r => `${r[2]}×${r[3]}`).join(' + ') || 'none' };
    };
    const lines = ['| look | passes a frame, before | screen-sized groups, before | passes a frame, after | screen-sized groups, after | the extra passes, after |', '| --- | --- | --- | --- | --- | --- |'];
    for (const [name, sq] of Object.entries(LOOKS)) {
      const B = abBase ? await measure(sq, abBase) : null, A = await measure(sq);
      lines.push(`| ${name} | ${B ? B.passes.toFixed(2) : '—'} | ${B ? B.groups : '—'} | ${A.passes.toFixed(2)} | ${A.groups} | ${A.sizes} |`);
      ok(A.groups === 0, `${name}: the 3D canvas is in no blend group (${A.groups} screen-sized groups; extra passes: ${A.sizes})`);
      if (!TINTED.test(name)) ok(Math.round(A.passes) === 1, `${name}: ONE compositor pass a frame (${A.passes.toFixed(2)})`);
    }
    console.log(lines.join('\n'));
    if (out) { const f = join(out, 'passes', `passes-${tag}.md`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, lines.join('\n') + '\n'); }
  }

  // first — SMOOTH 3 (WINTER WARM-UP): a FRESH page (empty cache) straight into a run, the first 10 s: every frame + every shader link, compile and GPU upload,
  // when it happened. `first:<reps>:<rate>`, `--ab <base>` = the code before, interleaved.
  // gl — JAYWALK FINAL (Grok's review): the GL calls a frame (kit/gl-count.mjs) — bufferSubData + KB, draws, program switches — per look, tier 2,
  // the bot playing DOWNTOWN + THE DOCKS; with `--ab <base>` the code before on its own server, side by side (`gl:<look>+<look>`)
  if (what === 'gl' || what.startsWith('gl:')) {
    const { glCount, glReset, glRead, glLine } = await import('./gl-count.mjs');
    const looks = what.startsWith('gl:') ? what.slice(3).split('+') : ['noon', 'autumn', 'night', 'snowNight'], lines = ['| look | area | code | bufferSubData a frame | KB a frame | draws | useProgram |', '| --- | --- | --- | --- | --- | --- | --- |'];
    for (const lk of looks) for (const [an, lane] of [['downtown', 252], ['docks', 60]]) for (const which of abBase ? ['before', 'after'] : ['after']) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=2&zoom=8&angle=straight&cv=2${SEASON_SCENES[lk]}`, which === 'before' ? { base: abBase } : {});
      await up(o.p); if (/snow=|date=2026-1[12]/.test(SEASON_SCENES[lk])) await waitFor(o.p, seasonIn, 30000);
      await o.p.evaluate(l => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.bot(true); J.warp(J.find('grass', l)); }, lane);
      await sleep(2500); await glCount(o.p); await glReset(o.p); await sleep(5000);
      const g = await glRead(o.p);
      console.log(`     GL ${lk} ${an} ${which}: ${glLine(g)}`);
      lines.push(`| ${lk} | ${an} | ${which} | ${g.sub} | ${g.subKB} | ${g.draws} | ${g.progs} |`);
      errs.push(...o.errs); await o.close();
    }
    console.log(lines.join('\n'));
    if (out) { const f = join(out, 'gl', `gl-${tag}.md`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, lines.join('\n') + '\n'); }
    return;
  }
  // snap — JAYWALK FINAL (THE LOAD SNAP): a cold page per look, every painted frame logged (the cover · the pack applied · a fade running); the scene
  // is never seen before its final look, and a pack held 3 s (`slow`) eases in, never a one-frame snap. Shots of the first uncovered frame → snap/
  if (what === 'snap' || what.startsWith('snap:')) {
    const SNAP = { autumnNoon: '&tod=noon&weather=clear&date=2026-11-24', golden: '&tod=golden&weather=clear&date=2026-11-24', snowDay: '&tod=noon&weather=clear&date=2026-12-24&snow=heavy', snowNight: '&tod=night&weather=clear&date=2026-12-24&snow=heavy', summer: '&tod=noon&weather=clear&date=2026-07-15' };
    const names = what.startsWith('snap:') ? what.slice(5).split('+') : [...Object.keys(SNAP), 'slow:autumnNoon', 'slow:snowNight'];
    for (const nm of names) {
      const slow = nm.startsWith('slow:'), key = slow ? nm.slice(5) : nm, inSeason = key !== 'summer';
      const pre = async p => {
        await p.evaluateOnNewDocument(() => { const L = window.__snap = []; const t0 = performance.now(); const loop = () => { const J = window.__jwLab; if (J && J.view && J.view.info) { const i = J.view.info(), s = J.view.season(); L.push([Math.round(performance.now() - t0), i.cover ? 1 : 0, s.winter > 0 || s.autumn > 0 ? 1 : 0, document.querySelector('.jw-fadelook') ? 1 : 0, i.kid ? 1 : 0]); } requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
        if (slow) { await p.setRequestInterception(true); p.on('request', r => { if (/seasonal|\/winter\/|\/autumn\//.test(r.url())) setTimeout(() => r.continue().catch(() => {}), 3000); else r.continue().catch(() => {}); }); }
      };
      const o = await open(390, 844, 3, `&preview=1&seed=look3&tier=2&zoom=8&angle=straight&cv=2${SNAP[key]}`, { pre });
      await up(o.p);
      await waitFor(o.p, '!window.__jwLab.view.info().cover', 6000);
      await sleep(400);   // (the cover's own fade)
      if (out) { const f = join(out, 'snap', `${nm.replace(':', '-')}-reveal.png`); mkdirSync(dirname(f), { recursive: true }); await o.p.screenshot({ path: f }); }
      await sleep(slow ? 9000 : 1500);
      const L = await o.p.evaluate(() => window.__snap);
      const first = L.findIndex(r => !r[1]), rev = first >= 0 ? L[first] : null;
      const snapped = L.slice(Math.max(1, first)).some((r, k, A) => { const prev = k ? A[k - 1] : L[first - 1]; return prev && !prev[1] && !r[1] && prev[2] !== r[2] && !r[3] && !prev[3]; });
      const faded = L.some(r => r[3]);
      if (process.env.SNAP_LOG) console.log("     ROWS", JSON.stringify(L.filter((r, k) => k && (r[1] !== L[k - 1][1] || r[2] !== L[k - 1][2] || r[3] !== L[k - 1][3]))));
      console.log(`     SNAP ${nm}: uncovered at ${rev ? rev[0] : '—'} ms · models in ${rev ? !!rev[4] : '—'} · pack at the reveal ${rev ? !!rev[2] : '—'} · a fade ran ${faded} · the pack in by the end ${!!(L.length && L[L.length - 1][2])}`);
      ok(!!rev && rev[0] <= 2600 && !!rev[4], `THE LOAD SNAP ${nm}: the scene shows once its models are in, ${rev ? rev[0] : '—'} ms after the page (≤ 2 s after the scene)`);
      if (inSeason && !slow) ok(!!rev && !!rev[2], `… ${nm}: in its season at the reveal (never plain first)`);
      if (slow) ok(!!rev && !rev[2] && faded, `… ${nm} with the pack held 3 s: shown without it, then EASED in (a fade ran)`);
      ok(!snapped, `… ${nm}: no one-frame snap of the season after the reveal`);
      errs.push(...o.errs); await o.close();
    }
    return;
  }
  // tier — LAST MILE (TIER SWITCHES ONLY AT QUIET MOMENTS): a tier step forced MID-RUN the way the rule makes one (kit/tiers.js#ask) waits — the
  // canvas untouched, no long frame — and is made at the next quiet moment (the start line); a step back UP links nothing in play (tier 2's
  // programs kept warm). `&tierq=0` = the step at once (the code before): its stall, for the before / after. `tier:<scene>+<scene>`
  if (what === 'tier' || what.startsWith('tier:')) {
    const TS = { noon: SCENES.noon, night: SCENES.night, snowNight: '&tod=night&weather=clear&date=2026-12-24&snow=heavy' };
    const names = what.startsWith('tier:') ? what.slice(5).split('+') : ['noon', 'snowNight'];
    const pre = p => p.evaluateOnNewDocument(() => { const L = window.__links = [], P = WebGL2RenderingContext.prototype, f = P.linkProgram; P.linkProgram = function (...a) { L.push(performance.now()); return f.apply(this, a); }; });
    const J = 'window.__jwLab';
    const worst = async (p, from, to) => p.evaluate((a, b) => { const f = window.__jwLab.frames().slice(a, b); return { n: f.length, worst: f.length ? Math.max(...f) : 0, over40: f.filter(x => x > 40).length, big: f.filter(x => x > 25).length }; }, from, to);
    const len = p => p.evaluate(`${J}.frames().length`), links = p => p.evaluate('window.__links.length');
    const play = async (p, ms) => { await p.evaluate(`${J}.bot(true)`); await waitFor(p, `${J}.state().started && ${J}.state().t > 30`, 8000); await sleep(ms); };
    const toStart = async p => { await p.evaluate(`${J}.bot(false); ${J}.restart()`); await waitFor(p, `!${J}.state().started`, 4000); await sleep(250); await waitFor(p, `!${J}.view.startBusy()`, 6000); };
    for (const nm of names) {
      const o = await open(390, 844, 3, `&preview=1&seed=look3&zoom=8&angle=straight&cv=2${TS[nm]}`, { pre });
      await up(o.p); await waitFor(o.p, `!${J}.view.startBusy()`, 8000);
      await play(o.p, 4000);
      const i0 = await o.p.evaluate(`${J}.view.info()`), n0 = await len(o.p);
      await o.p.evaluate(`${J}.askTier(1)`);
      await sleep(3000);
      const i1 = await o.p.evaluate(`${J}.view.info()`), pend1 = await o.p.evaluate(`${J}.tierPending()`), w1 = await worst(o.p, n0, await len(o.p));
      ok(i0.tier === 2 && i1.tier === 2 && i1.dpr === i0.dpr && i1.w === i0.w && pend1 === 1, `QUIET TIERS ${nm}: a step asked mid-run WAITS (tier ${i0.tier} → ${i1.tier}, dpr ${i0.dpr} → ${i1.dpr}, waiting for ${pend1})`);
      ok(w1.worst <= 40, `… ${nm}: no frame over 40 ms in the 3 s after the ask (worst ${w1.worst.toFixed(1)} ms of ${w1.n}, ${w1.big} over 25)`);
      await toStart(o.p);
      const i2 = await o.p.evaluate(`${J}.view.info()`), pend2 = await o.p.evaluate(`${J}.tierPending()`);
      ok(i2.tier === 1 && pend2 === -1, `… ${nm}: made at the next quiet moment — the start line (tier ${i2.tier}, dpr ${i2.dpr}, waiting ${pend2})`);
      const n2 = await len(o.p), l2 = await links(o.p);
      await play(o.p, 3000);
      const w2 = await worst(o.p, n2, await len(o.p)), l2b = await links(o.p);
      ok(l2b - l2 === 0, `… ${nm}: the run after the step down links nothing in play (${l2b - l2} links; worst frame ${w2.worst.toFixed(1)} ms, ${w2.over40} over 40)`);
      // back UP: asked mid-run, made at the start line, and the run after it compiles nothing (the glow + the sun's depth programs were kept warm)
      await o.p.evaluate(`${J}.askTier(2)`); await sleep(1200);
      const i3 = await o.p.evaluate(`${J}.view.info()`);
      await toStart(o.p);
      const i4 = await o.p.evaluate(`${J}.view.info()`), n4 = await len(o.p), l4 = await links(o.p);
      await play(o.p, 3000);
      const w4 = await worst(o.p, n4, await len(o.p)), l4b = await links(o.p), i5 = await o.p.evaluate(`${J}.view.info()`);
      ok(i3.tier === 1 && i4.tier === 2, `… ${nm}: a step UP asked mid-run waits too, then is made at the start line (tier ${i3.tier} → ${i4.tier}; ${nm === 'noon' ? `the sun map ${i5.sunMap}` : `the glow ${i5.bloom}`})`);
      ok(l4b - l4 === 0, `… ${nm}: stepping up links NOTHING in play (${l4b - l4} links in the first 3 s; worst frame ${w4.worst.toFixed(1)} ms, ${w4.over40} over 40)`);
      console.log(`     TIER ${nm} [${tag}]: at the ask worst ${w1.worst.toFixed(1)} ms · the run after the step down worst ${w2.worst.toFixed(1)} ms · the run after the step up worst ${w4.worst.toFixed(1)} ms · the tier path ${(await o.p.evaluate(`${J}.tierPath()`)).join('→')}`);
      errs.push(...o.errs); await o.close();
      // the A/B: the step made AT ONCE mid-run (`&tierq=0` — the code before): the stall it costs
      const q = await open(390, 844, 3, `&preview=1&seed=look3&zoom=8&angle=straight&cv=2&tierq=0${TS[nm]}`, { pre });
      await up(q.p); await waitFor(q.p, `!${J}.view.startBusy()`, 8000);
      await play(q.p, 4000);
      const m0 = await len(q.p); await q.p.evaluate(`${J}.askTier(1)`); await sleep(1500);
      const x1 = await worst(q.p, m0, await len(q.p)), m1 = await len(q.p), k1 = await links(q.p);
      await q.p.evaluate(`${J}.askTier(2)`); await sleep(1500);
      const x2 = await worst(q.p, m1, await len(q.p)), k2 = await links(q.p);
      console.log(`     TIER ${nm} AT ONCE (&tierq=0, as before): the step down mid-run worst ${x1.worst.toFixed(1)} ms · the step up mid-run worst ${x2.worst.toFixed(1)} ms, ${k2 - k1} links`);
      errs.push(...q.errs); await q.close();
    }
    return;
  }
  // warm — SMOOTH 4 (WARM START): a fresh page's first 40 s of play, second by second (kit/jaywalk-warm.mjs; `--webkit` = Playwright WebKit's JavaScriptCore)
  if (what === 'warm' || what.startsWith('warm:')) { const W = await import('./jaywalk-warm.mjs'); await W.warmStart({ what, out, tag, abBase, chromium: process.argv[2], webkit: process.argv.includes('--webkit'), sleep, waitFor, errs }); return; }
  if (what === 'first' || what.startsWith('first:')) {
    // (JAYWALK FINAL: `first:<reps>:<rate>:<tap ms>:<scene>+<scene>` — a FAST tap (e.g. 150 ms after the page is up) + the tap → first tick)
    const [, r0, r1, r2, r3] = what.split(':'), reps = Number(r0) || 3, rate = Number(r1) || 4, TAP_MS = r2 ? Number(r2) : 1500, SECS = 10;
    const ALL = { 'summer night': '&tod=night&weather=clear&date=2026-07-15', 'dec 24 heavy night': '&tod=night&weather=clear&date=2026-12-24&snow=heavy', 'dec 24 heavy noon': '&tod=noon&weather=clear&date=2026-12-24&snow=heavy', 'autumn noon': '&tod=noon&weather=clear&date=2026-11-23' };
    const KEYS = { summerNight: 'summer night', dec24Night: 'dec 24 heavy night', dec24Noon: 'dec 24 heavy noon', autumnNoon: 'autumn noon' };
    const FIRST = r3 ? Object.fromEntries(r3.split('+').map(k => [KEYS[k] || k, ALL[KEYS[k] || k]])) : { 'summer night': ALL['summer night'], 'dec 24 heavy night': ALL['dec 24 heavy night'], 'dec 24 heavy noon': ALL['dec 24 heavy noon'] };
    const spy = () => {
      const S = window.__first = { on: performance.now() || 1, hop: 0, fr: [], gl: [] }, P = WebGL2RenderingContext.prototype;
      const wrap = (name, size) => { const f = P[name]; P[name] = function (...a) { const t = performance.now(), r = f.apply(this, a), d = performance.now() - t; if (S.on) S.gl.push([name, Math.round(t - S.on), +d.toFixed(2), size ? size(a) : 0]); return r; }; };
      for (const n of ['linkProgram', 'compileShader', 'getProgramParameter']) wrap(n);
      wrap('bufferData', a => (typeof a[1] === 'number' ? a[1] : a[1] ? a[1].byteLength : 0));
      for (const n of ['texImage2D', 'texSubImage2D', 'texStorage2D']) wrap(n, a => { const v = a[a.length - 1]; return v && v.byteLength ? v.byteLength : 0; });
      // (what a tiled phone GPU builds at a draw: a pipeline per program + target + blend + cull + depth write. A combination first drawn DURING the run is a stall there)
      S.seen = new Map(); S.pre = 0; S.late = [];
      const names = new WeakMap(); let pg = null, tg = 'main', bl = 0, cu = 0, dm = 1, bf = '';
      const nameOf = (gl, x) => { if (!x) return 'none'; let n = names.get(x); if (!n) { try { const v = gl.getAttachedShaders(x) || [], src = v.map(o => gl.getShaderSource(o) || '').join(''), m = /#define SHADER_NAME (\S+)/.exec(src); let h = 0; for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) | 0; n = `${m ? m[1] : 'shader'}#${(h >>> 0).toString(36).slice(0, 4)}`; } catch { n = '?'; } names.set(x, n); } return n; };
      const hook = (name, after) => { const f = P[name]; P[name] = function (...a) { after.call(this, a); return f.apply(this, a); }; };
      hook('useProgram', function (a) { pg = nameOf(this, a[0]); });
      hook('bindFramebuffer', function (a) { if (a[0] !== this.READ_FRAMEBUFFER) tg = a[1] ? 'target' : 'main'; });
      hook('enable', function (a) { if (a[0] === this.BLEND) bl = 1; if (a[0] === this.CULL_FACE) cu = 1; });
      hook('disable', function (a) { if (a[0] === this.BLEND) bl = 0; if (a[0] === this.CULL_FACE) cu = 0; });
      hook('blendFunc', function (a) { bf = a.join(','); }); hook('blendFuncSeparate', function (a) { bf = a.join(','); }); hook('depthMask', function (a) { dm = a[0] ? 1 : 0; });
      for (const d of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) hook(d, function () { const k = `${pg} ${tg} ${bl ? `blend ${bf}` : 'opaque'} cull${cu} z${dm}`; if (S.seen.has(k)) return; S.seen.set(k, 1); if (S.on) S.late.push([Math.round(performance.now() - S.on), k]); else S.pre++; });
      let l = 0; const loop = t => { if (S.on && l) S.fr.push([Math.round(t - S.on), +(t - l).toFixed(1)]); l = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
    };
    // (a NEW BROWSER a run: the GPU process keeps linked programs in memory, so a second page in one browser never shows the first-time cost. The page opens as the
    //  owner's link does; the first hop comes 1.5 s after it is ready, as a player's first tap would)
    const { default: pptr } = await import('./puppeteer.mjs'), { guardUrl } = await import('./live-guard.mjs');
    const one = async (sq, base) => {
      const br = await pptr.launch({ executablePath: process.argv[2], headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
      let r;
      try {
        const p = await br.newPage();
        p.on('pageerror', e => errs.push(String(e.message || e)));
        await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
        await p.evaluateOnNewDocument(spy);
        const c = await p.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate });
        await p.goto(guardUrl(`${base || process.env.E2E_BASE || 'http://localhost:5173'}/jaywalk-lab?emu&preview=1&seed=perfseed7&tier=2&zoom=8&angle=straight&cv=2${sq}`, 'jaywalk-lab'), { waitUntil: 'load' });
        await up(p);
        await sleep(TAP_MS);
        await p.evaluate(() => { const J = window.__jwLab, F = window.__first; F.tap = performance.now() - F.on; J.bot(true); const w = setInterval(() => { if (J.state().t > 0) { F.hop = performance.now() - F.on; clearInterval(w); } }, 8); setInterval(() => { if (J.state().over) J.restart('solo', 'perfseed7'); }, 150); });
        await waitFor(p, 'window.__first.hop > 0', 8000);   // (play = the run's first tick: the first tap waits for the warm-up)
        await sleep(8800);
        r = await p.evaluate(() => { const F = window.__first, i = window.__jwLab.view.info(), end = F.hop + 8500; return { fr: F.fr.filter(x => x[0] <= end), inPlay: F.fr.filter(x => x[0] > F.hop && x[0] <= end).map(x => x[1]), gl: F.gl.filter(x => x[1] <= end), late: F.late.filter(x => x[0] > F.hop), pre: F.pre, held: i.warmHeld || 0, pack: !!window.__jwLab.view.season().pack, tapHop: F.hop - F.tap, startHeld: window.__jwLab.state().heldMs }; });
      } finally { await br.close(); }
      const dts = r.fr.map(x => x[1]), S = stutterOf(dts), sum = n => r.gl.filter(x => x[0] === n), kb = r.gl.filter(x => /^(bufferData|tex)/.test(x[0])).reduce((a, x) => a + x[3], 0) / 1024;
      const glMs = r.gl.reduce((a, x) => a + x[2], 0), worstGl = r.gl.reduce((w, x) => (x[2] > w[2] ? x : w), ['', 0, 0, 0]);
      const P = stutterOf(r.inPlay);
      return { ...S, playN: P.n, playBig: P.big, playDrops: P.drops, playWorst: P.worst, held: r.held, tapHop: r.tapHop, startHeld: r.startHeld, late: r.late, pre: r.pre, links: sum('linkProgram').length, compiles: sum('compileShader').length, kb, glMs, worstGl, bigAt: r.fr.filter(x => x[1] > 33.4).map(x => `${(x[0] / 1000).toFixed(1)}s:${x[1].toFixed(0)}`).slice(0, 12).join(' ') };
    };
    const lines = [`(the tap ${TAP_MS} ms after the page is up, ${rate}× CPU, ${reps} new browsers a scene)`, '| scene | code | worst frame from page load, ms | BIG from page load | BIG in play (first hop on) | worst in play, ms | pipelines first drawn in play | tap → first tick, ms |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
    for (const [name, sq] of Object.entries(FIRST)) {
      const got = { before: [], after: [] };
      for (let rep = 0; rep < reps; rep++) for (const which of (abBase ? (rep % 2 ? ['after', 'before'] : ['before', 'after']) : ['after'])) {
        const R = await one(sq, which === 'before' ? abBase : null);
        got[which].push(R);
        console.log(`     FIRST ${which} ${name} (run ${rep + 1}): ${stutterLine(R)} · links ${R.links} · uploads ${R.kb.toFixed(0)} KB · GL ${R.glMs.toFixed(0)} ms (worst ${R.worstGl[0]} ${R.worstGl[2]} ms at ${(R.worstGl[1] / 1000).toFixed(1)} s) · BIG at ${R.bigAt || '—'} · held ${R.held} · IN PLAY: ${R.playBig} big, worst ${R.playWorst.toFixed(0)} ms · pipelines first drawn in play ${R.late.length} · TAP → FIRST TICK ${R.tapHop.toFixed(0)} ms (held ${R.startHeld} ms)`);
        if (process.env.FIRST_LIST) for (const [t, k] of R.late) console.log(`        LATE ${(t / 1000).toFixed(2)} s  ${k}`);
      }
      for (const which of ['before', 'after']) { const L = got[which]; if (!L.length) continue; const av = f => L.reduce((a, x) => a + x[f], 0) / L.length; lines.push(`| ${name} | ${which} | ${Math.max(...L.map(x => x.worst)).toFixed(0)} | ${av('big').toFixed(1)} | ${av('playBig').toFixed(1)} | ${Math.max(...L.map(x => x.playWorst)).toFixed(0)} | ${(L.reduce((c, x) => c + x.late.length, 0) / L.length).toFixed(1)} | ${L.map(x => x.tapHop.toFixed(0)).join(' · ')} |`); }
    }
    console.log(lines.join('\n'));
    if (out) { const f = join(out, 'first', `first-${tag}.md`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, lines.join('\n') + '\n'); }
  }

  // dec1 — SMOOTH 3 (THE DEC 1 CHECK): one page open on Nov 30's last autumn run, the run after the turn on Dec 1, by night + by day at 4× CPU, the switch itself inside
  // the measured frames: winter on by itself, autumn's pile released, every winter piece seen, no stall. The shots = the same page with the day's heaviest fall.
  if (what === 'dec1') {
    const WD = 'd20261201';
    for (const [look, lq] of [['night', '&tod=night&weather=clear'], ['day', '&tod=noon&weather=clear']]) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=2&zoom=8&angle=straight&cv=2&date=2026-11-30${lq}`);
      await up(o.p);
      ok(await waitFor(o.p, '(() => { const s = window.__jwLab.view.season(); return s.autumn > 0 && !!s.sp && s.sp.pileModel; })()', 30000), `${look}: Nov 30 is autumn, its leaf pile in`);
      ok(await o.p.evaluate(() => !window.__jwLab.view.season().pack), `${look}: no winter model on an autumn day`);
      const cdp = await o.p.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await o.p.evaluate(async d => {
        const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.clearFrames();
        await J.view.prepSeason(d); J.view.setSeason(d, {});
        window.__dec = { xmas: 0, prints: 0, fall: 0, line: null };
        setInterval(() => { const p = J.view.season().sp || {}, D = window.__dec; if (!D.line && J.state().t > 0) { D.line = [...J.frames()]; J.clearFrames(); } D.xmas = Math.max(D.xmas, p.xmas || 0); D.prints = Math.max(D.prints, p.prints || 0); D.fall = Math.max(D.fall, p.fall || 0); if (J.state().over) { J.restart('solo', 'perfseed7'); J.view.setSeason(d, {}); } }, 60);
        J.bot(true);
      }, WD);
      await sleep(9000);
      const r = await o.p.evaluate(() => { const J = window.__jwLab, s = J.view.season(), v = J.view.info().variety; let trucks = 0; for (let i = 50; i < 450; i++) for (const it of J.items(i).items || []) if (it.what === 'plow' || it.what === 'salt') trucks++; return { fr: J.frames(), s: { winter: s.winter, christmas: s.christmas, autumn: s.autumn, snowfall: s.snowfall, pack: s.pack, hat: s.sp.hat, pile: s.sp.pileModel }, D: window.__dec, trucks, held: v.held }; });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
      const F = stutterOf(r.fr), L = stutterOf(r.D.line || []); delete r.D.line;
      console.log(`     DEC 1 ${look} — at the start line (the switch): ${L.n} frames, ${L.big} BIG, worst ${L.worst.toFixed(0)} ms · in play: ${stutterLine(F)} · ${JSON.stringify(r.s)} · ${JSON.stringify(r.D)} · ${r.trucks} winter trucks on the course`);
      ok(r.s.winter > 0 && r.s.christmas > 0 && r.s.autumn === 0 && r.s.pack, `${look}: winter + Christmas on by themselves, autumn off (${JSON.stringify(r.s)})`);
      ok(r.s.pile === false, `${look}: the autumn pile is released`);
      ok(r.s.hat === 'santa', `${look}: the Santa hat is on`);
      ok(r.D.xmas > 0, `${look}: Christmas trees drawn (up to ${r.D.xmas})`);
      ok(r.D.prints > 0, `${look}: footprints in the snow (up to ${r.D.prints} pairs)`);
      ok(r.trucks > 0, `${look}: snowplows + salt trucks on the course (${r.trucks})`);
      ok(F.big <= 3 && F.worst < 120, `${look}: no stall in play after the switch (${F.big} BIG, worst ${F.worst.toFixed(0)} ms; the start line took ${L.worst.toFixed(0)} ms at worst)`);
      // (the shots: Dec 1's own fall, on the opening's grass + among THE CANAL's trees — the ground's snow + the Christmas trees in view)
      for (const [where, from] of [['grass', 6], ['trees', 312]]) {
        await o.p.evaluate((d, l) => { const J = window.__jwLab; J.bot(false); J.restart('solo', 'perfseed7'); J.view.setSeason(d, {}); J.warp(J.find('grass', l)); }, WD, from);
        await sleep(2600);
        if (out) { const f = join(out, 'dec1', `dec1-${look}-${where}-390.png`); mkdirSync(dirname(f), { recursive: true }); await o.p.screenshot({ path: f }); }
        console.log(`     DEC 1 shot ${look} ${where}: ${await o.p.evaluate(() => { const p = window.__jwLab.view.season().sp; return `${p.xmas} Christmas trees drawn, ${p.fall} flakes, sky snow ${p.skySnow || 'none'}`; })}`);
      }
      errs.push(...o.errs); await o.close();
    }
  }

  // casters — what the sun's depth pass actually draws: every instanced draw into the map (triangles a model × instances), biggest first
  if (what === 'casters') {
    for (const [name, sq] of [['noon', SCENES.noon], ['snow', SCENES.snow]]) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=2&zoom=8&angle=straight&cv=2${sq}`);
      await up(o.p);
      if (/snow=/.test(sq)) await waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);
      await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.ghosts(7); J.warp(J.find('grass', 252)); });
      await waitFor(o.p, '(() => { const v = window.__jwLab.view.info().variety; return v && v.loading === 0 && v.queued === 0 && !v.staged; })()', 30000);
      await sleep(1500);
      console.log('     VIEW', JSON.stringify(await o.p.evaluate(() => { const J = window.__jwLab, i = J.view.info(), y = J.state().y, L = []; for (let k = 4; k <= 30; k += 2) L.push([k, +J.project(4.5, y + k)[1].toFixed(3)]); return { y, sunCut: i.sunCut, fog: i.fog, foot: i.foot, zoom: i.zoom, lanes: L }; })));
      const r = await o.p.evaluate(() => new Promise(res => {
        const gl = document.querySelector('canvas.jw-canvas').getContext('webgl2'), bind = gl.bindFramebuffer.bind(gl), draw = gl.drawElementsInstanced.bind(gl);
        let inRt = false, L = [], main = 0;
        gl.bindFramebuffer = (t, fb) => { bind(t, fb); inRt = !!fb; };
        gl.drawElementsInstanced = (m, c, ty, off, n) => { if (inRt) L.push([c / 3, n]); else main += c / 3 * n; draw(m, c, ty, off, n); };
        let k = 0; const f = () => { if (++k === 2) { L = []; main = 0; } if (k === 3) { res({ L, main }); return; } requestAnimationFrame(f); }; requestAnimationFrame(f);
      }));
      const rows = r.L.map(([t, n]) => ({ t, n, all: t * n })).sort((a, b) => b.all - a.all), tot = rows.reduce((a, x) => a + x.all, 0);
      console.log(`     CASTERS ${name}: ${rows.length} draws, ${tot} tris into the map (main pass ${r.main}) · biggest: ${rows.slice(0, 12).map(x => `${x.t}×${x.n}`).join('  ')}`);
      errs.push(...o.errs); await o.close();
    }
  }

  if (all || what === 'gpu') {
    const rows = [];
    for (const [name, sq] of Object.entries(SCENES)) for (const tier of [2, 1]) {
      const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=straight&cv=2${sq}`, abBase ? { base: abBase } : {});
      await up(o.p);
      if (/snow=/.test(sq)) await waitFor(o.p, 'window.__jwLab.view.season().pack', 30000);
      await o.p.evaluate(() => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.ghosts(7); J.warp(J.find('grass', 252)); });
      await waitFor(o.p, '(() => { const v = window.__jwLab.view.info().variety; return v && v.loading === 0 && v.queued === 0 && !v.staged; })()', 30000);
      await sleep(1500);
      const can = await o.p.evaluate(installTimers);
      if (!can) { console.log('     (no GPU timer on this browser: EXT_disjoint_timer_query_webgl2 missing)'); errs.push(...o.errs); await o.close(); return; }
      await sleep(300);
      await o.p.evaluate(() => { window.__gt.on = true; window.__jwLab.clearFrames(); });
      await sleep(6000);
      const r = await o.p.evaluate(() => { const T = window.__gt; T.on = false; const J = window.__jwLab, i = J.view.info(); return { main: T.done.main, rt: T.done.rt, js: T.js, cost: J.cost(), frames: J.frames(), calls: i.calls, tris: i.tris, sun: i.sunMap }; });
      const n = r.frames.length, row = { name, tier, tag, n, sun: r.sun, calls: r.calls, tris: r.tris, gpuMain: q(r.main, 0.5), gpuMainP95: q(r.main, 0.95), gpuRt: q(r.rt, 0.5), gpuRtP95: q(r.rt, 0.95), rtPerFrame: r.rt.length / Math.max(1, r.main.length), sunJs: q(r.js, 0.5), work: q(r.cost, 0.5), workP95: q(r.cost, 0.95) };
      // (what the ground's four sun-map samples cost: the same scene with the ground not reading the map)
      if (tier === 2 && name !== 'night' && await o.p.evaluate(() => !!window.__jwLab.view.sunSampleOff)) {
        await o.p.evaluate(() => { const T = window.__gt; T.done.main.length = 0; T.on = true; window.__jwLab.view.sunSampleOff(true); });
        await sleep(4000);
        const m = await o.p.evaluate(() => { const T = window.__gt; T.on = false; window.__jwLab.view.sunSampleOff(false); return T.done.main; });
        row.gpuMainNoSample = q(m, 0.5);
        console.log(`     … ${name}: the main pass without the ground's sun samples ${row.gpuMainNoSample.toFixed(2)} ms (with: ${row.gpuMain.toFixed(2)})`);
      }
      rows.push(row);
      console.log(`     GPU ${tag} ${name.padEnd(6)} t${tier}: main ${row.gpuMain.toFixed(2)} (p95 ${row.gpuMainP95.toFixed(2)}) · target passes ${row.gpuRt.toFixed(2)} (p95 ${row.gpuRtP95.toFixed(2)}, ${row.rtPerFrame.toFixed(1)} a frame) ms · their JS ${row.sunJs.toFixed(2)} · frame work ${row.work.toFixed(2)} (p95 ${row.workP95.toFixed(2)}) · ${row.calls} calls ${row.tris} tris`);
      errs.push(...o.errs); await o.close();
    }
    if (out) { const f = join(out, 'gpu', `gpu-${tag}.json`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(rows, null, 1)); }
  }
}
