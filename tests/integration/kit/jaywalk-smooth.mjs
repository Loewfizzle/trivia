// JAYWALK SMOOTH — the meter + measure checks (tests/integration/jaywalk-lab.mjs `--smooth=hud|gpu` [--tag before|after] [--ab <base>]).
//   hud — GROUP 1: THE FRAME METER at 390 / 402 / 430 (+ 1440): it reads, it stays off the lanes' middle, its 10 S TEST records + reports, and
//         without &hud=1 the page never fetches it
//   gpu — GROUP 3: what the sun's depth pass + the main pass cost on the GPU (timer queries, per render target) and in the frame's JS
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

export const SCENES = {
  noon: '&tod=noon&weather=clear&date=2026-07-15',
  golden: '&tod=golden&weather=clear&date=2026-07-15',
  night: '&tod=night&weather=clear&date=2026-07-15',
  snow: '&tod=noon&weather=clear&date=2026-12-24&snow=heavy',
};

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

export async function looksSmooth({ open, up, ok, sleep, waitFor, out, what = '', errs = [], tag = 'after', abBase = null }) {
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
      rows.push(row);
      console.log(`     GPU ${tag} ${name.padEnd(6)} t${tier}: main ${row.gpuMain.toFixed(2)} (p95 ${row.gpuMainP95.toFixed(2)}) · target passes ${row.gpuRt.toFixed(2)} (p95 ${row.gpuRtP95.toFixed(2)}, ${row.rtPerFrame.toFixed(1)} a frame) ms · their JS ${row.sunJs.toFixed(2)} · frame work ${row.work.toFixed(2)} (p95 ${row.workP95.toFixed(2)}) · ${row.calls} calls ${row.tris} tris`);
      errs.push(...o.errs); await o.close();
    }
    if (out) { const f = join(out, 'gpu', `gpu-${tag}.json`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, JSON.stringify(rows, null, 1)); }
  }
}
