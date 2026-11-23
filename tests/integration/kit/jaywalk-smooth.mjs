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
    const frozen = async (sq, tier, smooth, lane, t) => { const o = await open(390, 844, 3, `&preview=1&seed=perfseed7&tier=${tier}&zoom=8&angle=straight&cv=2${sq}${smooth || abBase ? '' : '&smooth=0'}`, { reduce: true, ...(!smooth && abBase ? { base: abBase } : {}) }); await up(o.p); if (/snow=|date=2026-1[12]-(2[3-5]|31)/.test(sq)) await waitFor(o.p, seasonIn, 30000); await o.p.evaluate(l => { const J = window.__jwLab; J.restart('solo', 'perfseed7'); J.warp(J.find('grass', l)); }, lane); await waitFor(o.p, '(() => { const i = window.__jwLab.view.info(), v = i.variety, p = i.props; return v && !v.loading && !v.queued && !v.staged && !v.drops && p && !p.loading && !p.queued && !p.staged && !p.drops; })()', 30000); await sleep(1400); return o; };
    const grab = async (o, t) => { await o.p.evaluate(tt => { const J = window.__jwLab; J.freeze(false); J.setT(tt); J.freeze(true); }, t); await sleep(1250); return o.p.screenshot({ encoding: 'base64' }); };
    let worst = 0, count = 0;
    for (const lk of looks) for (const tier of [2, 1]) for (const [an, lane] of tier === 2 ? LANES : LANES.slice(0, 1)) {
      const A = await frozen(SEASON_SCENES[lk], tier, true, lane), B = await frozen(SEASON_SCENES[lk], tier, false, lane);
      const ticks = tier === 2 && an === 'downtown' ? [2400, 2401, 2402, 2403, 2404, 2405] : [2400, 3100];
      let w = 0, big = 0;
      for (const t of ticks) { const a = await grab(A, t), c = await grab(B, t), d = await diff(a, c); count++; if (d.pct > w) w = d.pct; if (d.big > big) big = d.big; if (out && t === ticks[0]) { const f = join(out, 'same', `${lk}-t${tier}-${an}.png`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, Buffer.from(a, 'base64')); } }
      if (w > worst) worst = w;
      ok(w < 0.01, `THE SAME PICTURE ${lk} tier ${tier} ${an}: ${ticks.length} frozen frames, at most ${w.toFixed(4)} % of pixels differ (largest difference ${big} / 255)`);
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
