// JAYWALK SMOOTH 4 — WARM START: what a FRESH page does in its first 40 s of play, second by second (`jaywalk-lab.mjs --smooth=warm[:reps:rate]`
// [--webkit] [--tag before|after] [--ab <base>]). A NEW browser a run (the GPU process keeps linked programs, so a second page never shows the
// first-time cost). The page opens as the owner's link does; the player taps 1.5 s after the page is up (or `WARM_WAIT` ms); the bot plays on.
// Per second from the first hop: frames · DROPS (> 20 ms) · BIG (> 33 ms) · the frame's own JS (mean / worst) · shader links · GPU uploads (KB) ·
// the loaders' busy share · the tier. WebKit on the Beelink draws in software (~21 fps): its frame times mean nothing, its JS times do.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { stutterOf } from './frame-report.mjs';

export const WARM_SCENES = {
  'noon autumn': '&tod=noon&weather=clear&date=2026-11-23',
  'dec 24 heavy night': '&tod=night&weather=clear&date=2026-12-24&snow=heavy',
};

/** in the page, before any script: every rAF interval + every GL link / compile / upload, stamped from the page's start */
const spy = () => {
  const S = window.__warm = { on: performance.now() || 1, hop: 0, fr: [], gl: [], ld: [], tr: [], trace: true };
  const P = (window.WebGL2RenderingContext || function () {}).prototype;
  const wrap = (name, size) => { const f = P[name]; if (!f) return; P[name] = function (...a) { const t = performance.now(), r = f.apply(this, a), d = performance.now() - t; S.gl.push([name, Math.round(t - S.on), +d.toFixed(2), size ? size(a) : 0]); return r; }; };
  wrap('compileShader');
  { const f = P.linkProgram; if (f) P.linkProgram = function (pg) { const t = performance.now(), r = f.call(this, pg), d = performance.now() - t; let nm = '?'; try { const src = (this.getAttachedShaders(pg) || []).map(o => this.getShaderSource(o) || '').join(''), m = /#define SHADER_(?:NAME|TYPE) (\S+)/.exec(src), u = (src.match(/uniform \S+ (u[A-Z]\w+)/g) || []).slice(0, 3).map(x => x.split(' ').pop()).join('+'); let h = 0; for (let i = 0; i < src.length; i++) h = (h * 31 + src.charCodeAt(i)) | 0; nm = `${m ? m[1] : 'shader'}${u ? `[${u}]` : ''}${/USE_INSTANCING/.test(src) ? '+inst' : ''}#${(h >>> 0).toString(36).slice(0, 5)}`; } catch { /* a name only */ } S.gl.push(['linkProgram', Math.round(t - S.on), +d.toFixed(2), 0, nm]); if (S.hop && !S.src) { try { S.src = (this.getAttachedShaders(pg) || []).map(o => (this.getShaderSource(o) || '').split('\n').filter(l => !/^(#version|precision|#extension|attribute|in vec|#define (?!SHADER))/.test(l) && !/uniform (mat|vec)\d (model|view|projection|normal)/.test(l)).join('\n').slice(0, 700)).join('\n----\n'); } catch { /* a note only */ } } return r; }; }
  wrap('bufferData', a => (typeof a[1] === 'number' ? a[1] : a[1] ? a[1].byteLength : 0));
  wrap('bufferSubData', a => (a[2] && a[2].byteLength ? a[2].byteLength : 0));
  for (const n of ['texImage2D', 'texSubImage2D', 'texStorage2D', 'texImage3D', 'texSubImage3D']) wrap(n, a => { const v = a[a.length - 1]; return v && v.byteLength ? v.byteLength : v && v.width ? v.width * v.height * 4 : 0; });
  let l = 0; const loop = t => { if (l) S.fr.push([Math.round(t - S.on), +(t - l).toFixed(1)]); l = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
};
/** in the page, once the run is on: the loaders' state four times a second (never in the frame) */
const watch = () => {
  const J = window.__jwLab, S = window.__warm;
  setInterval(() => { try { const i = J.view.info(), v = i.variety || {}, p = i.props || {}; if (S.trace) S.tr.push([Math.round(performance.now() - S.on), `V ${v.loading}/${v.queued}/${v.staged}/${v.drops} [${(v.held || []).length}] P ${p.loading}/${p.queued}/${p.staged}/${p.drops} [${(p.held || []).length}] w${i.warming ? 1 : 0} g${i.stillGot}`]); S.ld.push([Math.round(performance.now() - S.on), (v.loading || 0) + (v.queued || 0) + (v.staged || 0) + (v.drops || 0) + (p.loading || 0) + (p.queued || 0) + (p.staged || 0) + (p.drops || 0), i.tier, J.state().best || 0, i.warming ? 1 : 0, i.programs, i.props ? 1 : 0, J.view.season().pack ? 1 : 0, !!(J.view.season().sp && J.view.season().sp.pileModel) ? 1 : 0]); } catch { /* a page mid-restart */ } }, 250);
};

const sec = (list, at, s) => list.filter(x => x[at] >= s * 1000 && x[at] < (s + 1) * 1000);

/** one fresh page → the raw timeline (all times from the first hop) */
async function onePage({ launch, base, sq, rate, wait, secs, sleep, waitFor }) {
  const { br, p, throttle, again } = await launch();
  try {
    await (p.addInitScript ? p.addInitScript(spy) : p.evaluateOnNewDocument(spy));
    if (throttle) await throttle(rate);
    await p.goto(`${base}/jaywalk-lab?emu&preview=1&seed=perfseed7&zoom=8&angle=straight&cv=2${sq}`, { waitUntil: 'load' });
    await waitFor(p, "!!window.__jwLab && !!document.querySelector('canvas.jw-canvas')", 30000);
    await p.evaluate(() => window.__jwLab.ready);
    await p.evaluate(watch);
    await sleep(wait);
    await p.evaluate(() => { const J = window.__jwLab, F = window.__warm; F.ask = performance.now() - F.on; J.bot(true); const w = setInterval(() => { if (J.state().t > 0) { F.hop = performance.now() - F.on; clearInterval(w); } }, 4); setInterval(() => { if (J.state().over) J.restart('solo', 'perfseed7'); }, 150); });
    await waitFor(p, 'window.__warm.hop > 0', 20000);
    const hop0 = await p.evaluate(() => window.__warm.hop);
    await sleep(secs * 1000 + 600);
    const got = await p.evaluate(({ secs }) => {
      const F = window.__warm, J = window.__jwLab, h = F.hop, end = h + secs * 1000;
      // (the lab's own per-frame JS: its frames() + cost() lists, laid back from now — the last frame ≈ now)
      const fr = J.frames(), co = J.cost(), now = performance.now() - F.on, js = [];
      let t = now; for (let i = fr.length - 1; i >= 0 && t > h - 3000; i--) { js.push([Math.round(t - h), co[i]]); t -= fr[i]; }
      return {
        tap: h, ask: F.ask, src: F.src || '', pre: F.fr.filter(x => x[0] <= h).map(x => x[1]),
        fr: F.fr.filter(x => x[0] > h && x[0] <= end).map(x => [x[0] - h, x[1]]),
        names: F.gl.filter(x => x[1] <= end).map(x => [x[4] || '', x[1] - h, x[2], x[3], x[0]]),   // ([_, t from the hop, ms, bytes, the GL call])
        js: js.reverse(), ld: F.ld.map(x => [x[0] - h, ...x.slice(1)]), tr: F.tr.map(x => [x[0] - h, x[1]]),
      };
    }, { secs });
    // (A WARM PAGE: the same link again in the same browser — its programs linked, its files cached: the tap → first tick it gets, the cold page's bar)
    await p.close();
    const q = await again();
    if (throttle && q.createCDPSession) { const c = await q.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate }); }
    await q.goto(`${base}/jaywalk-lab?emu&preview=1&seed=perfseed7&zoom=8&angle=straight&cv=2${sq}`, { waitUntil: 'load' });
    await waitFor(q, "!!window.__jwLab && !!document.querySelector('canvas.jw-canvas')", 30000);
    await q.evaluate(() => window.__jwLab.ready);
    await sleep(wait);
    got.warmTap = await q.evaluate(() => new Promise(res => { const J = window.__jwLab, t0 = performance.now(); J.bot(true); const w = setInterval(() => { if (J.state().t > 0) { clearInterval(w); res(performance.now() - t0); } }, 4); }));
    return got;
  } finally { await br.close(); }
}

/** a timeline → per-second rows */
function perSecond(r, secs) {
  const rows = [];
  const glRows = r.names.map(x => ({ t: x[1], ms: x[2], kb: x[3] / 1024, name: x[4] }));
  for (let s = 0; s < secs; s++) {
    const f = sec(r.fr, 0, s).map(x => x[1]), S = stutterOf(f), J = sec(r.js, 0, s).map(x => x[1]), G = glRows.filter(x => x.t >= s * 1000 && x.t < (s + 1) * 1000), L = sec(r.ld, 0, s);
    rows.push({ s, n: f.length, drops: S.drops, big: S.big, worst: S.worst, jsMean: J.length ? J.reduce((a, b) => a + b, 0) / J.length : 0, jsWorst: J.length ? Math.max(...J) : 0,
      links: G.filter(x => x.name === 'linkProgram').length, kb: G.reduce((a, x) => a + x.kb, 0), glMs: G.reduce((a, x) => a + x.ms, 0), busy: L.length ? L.filter(x => x[1] > 0).length / L.length : 0, tier: L.length ? L[L.length - 1][2] : null, lane: L.length ? L[L.length - 1][3] : 0, warming: L.some(x => x[4]), progs: L.length ? L[L.length - 1][5] : 0 });
  }
  return rows;
}

export async function warmStart({ what, out, tag = 'after', abBase = null, chromium, webkit = false, sleep, waitFor, errs = [] }) {
  const [, r0, r1] = what.split(':'), reps = Number(r0) || 3, rate = Number(r1) || 4, secs = Number(process.env.WARM_SECS) || 40, wait = Number(process.env.WARM_WAIT) || 1500;
  const base0 = process.env.E2E_BASE || 'http://localhost:5173';
  const { guardUrl } = await import('./live-guard.mjs'); guardUrl(`${base0}/jaywalk-lab`, 'jaywalk-lab');
  let launch;
  if (webkit) {
    const { webkit: W } = await import(pathToFileURL(process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs')).href);
    launch = async () => { const br = await W.launch(); const ctx = await br.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' }); const p = await ctx.newPage(); p.on('pageerror', e => errs.push(String(e.message || e))); return { br, p, throttle: null, again: () => ctx.newPage() }; };
  } else {
    const { default: pptr } = await import('./puppeteer.mjs');
    launch = async () => {
      const br = await pptr.launch({ executablePath: chromium, headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--enable-webgl', '--ignore-gpu-blocklist'] });
      const p = await br.newPage(); p.on('pageerror', e => errs.push(String(e.message || e)));
      await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
      return { br, p, again: () => br.newPage().then(async q => { await q.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); return q; }), throttle: async n => { const c = await p.createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate: n }); } };
    };
  }
  const eng = webkit ? 'webkit' : 'chromium', md = [`# WARM START — ${eng}, ${webkit ? 'no throttle (software GL: frame times not meaningful)' : `${rate}× CPU`}, ${reps} fresh browsers a scene, tag ${tag}`, ''];
  const all = {};
  for (const [name, sq] of Object.entries(WARM_SCENES)) {
    for (const which of abBase ? ['before', 'after'] : [tag]) all[`${name}|${which}`] = [];
    for (let rep = 0; rep < reps; rep++) for (const which of (abBase ? (rep % 2 ? ['after', 'before'] : ['before', 'after']) : [tag])) {
      const r = await onePage({ launch, base: abBase && which === 'before' ? abBase : base0, sq, rate, wait, secs, sleep, waitFor });
      const rows = perSecond(r, secs);
      if (process.env.WARM_SRC && r.src) console.log(`        THE FIRST PROGRAM LINKED IN PLAY:
${r.src}`);
      if (process.env.WARM_TRACE) for (const [t, x] of r.tr) if (t < 9000) console.log(`        ${(t / 1000).toFixed(2)} s  ${x}`);
      all[`${name}|${which}`].push({ r, rows, tapMs: r.tap - r.ask, warmTap: r.warmTap });
      const ten = k => rows.slice(k * 10, k * 10 + 10), sum = (L, f) => L.reduce((a, x) => a + x[f], 0), mean = (L, f) => sum(L, f) / (L.length || 1);
      const tens = [0, 1, 2, 3].map(k => `${k * 10}-${k * 10 + 10}s: ${sum(ten(k), 'drops')} drops ${sum(ten(k), 'big')} big JS ${mean(ten(k), 'jsMean').toFixed(2)} ms up ${sum(ten(k), 'kb').toFixed(0)} KB GL ${sum(ten(k), 'glMs').toFixed(0)} ms busy ${(mean(ten(k), 'busy') * 100).toFixed(0)}%`);
      const preS = stutterOf(r.pre), preG = r.names.filter(x => x[1] <= 0), preL = preG.filter(x => x[4] === 'linkProgram').length, preK = preG.reduce((a, x) => a + x[3], 0) / 1024, inL = r.names.filter(x => x[1] > 0 && x[4] === 'linkProgram');
      console.log(`     WARM ${eng} ${which} ${name} (run ${rep + 1}): tap at ${(r.tap / 1000).toFixed(1)} s (before it: ${preS.n} frames, worst ${preS.worst.toFixed(0)} ms, ${preL} links, ${preK.toFixed(0)} KB up) · links in play ${inL.length}${inL.length ? ` (at ${inL.slice(0, 8).map(x => `${(x[1] / 1000).toFixed(2)} s ${x[0]}`).join(', ')})` : ''} · props in at ${((r.ld.find(x => x[6]) || [NaN])[0] / 1000).toFixed(1)} s · pack ${((r.ld.find(x => x[7] || x[8]) || [NaN])[0] / 1000).toFixed(1)} s · tap → first tick ${(r.tap - r.ask).toFixed(0)} ms (a warm page ${r.warmTap.toFixed(0)} ms) · ${tens.join(' | ')}`);
    }
  }
  // the table: per second, averaged over the runs
  for (const [key, L] of Object.entries(all)) {
    if (!L.length) continue;
    md.push(`## ${key.replace('|', ' — ')}`, '', '| s | frames | DROPS | BIG | worst ms | JS mean ms | JS worst ms | links | uploads KB | GL ms | loaders busy | lane | tier | programs |', '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (let s = 0; s < secs; s++) {
      const R = L.map(x => x.rows[s]), av = f => R.reduce((a, x) => a + x[f], 0) / R.length;
      md.push(`| ${s} | ${av('n').toFixed(0)} | ${av('drops').toFixed(1)} | ${av('big').toFixed(1)} | ${Math.max(...R.map(x => x.worst)).toFixed(0)} | ${av('jsMean').toFixed(2)} | ${Math.max(...R.map(x => x.jsWorst)).toFixed(1)} | ${av('links').toFixed(1)} | ${av('kb').toFixed(0)} | ${av('glMs').toFixed(1)} | ${(av('busy') * 100).toFixed(0)}% | ${av('lane').toFixed(0)} | ${R.map(x => x.tier).join('/')} | ${av('progs').toFixed(0)} |`);
    }
    const tens = [0, 1, 2, 3].map(k => { const R = L.flatMap(x => x.rows.slice(k * 10, k * 10 + 10)); return { d: R.reduce((a, x) => a + x.drops, 0) / L.length, b: R.reduce((a, x) => a + x.big, 0) / L.length, js: R.reduce((a, x) => a + x.jsMean, 0) / R.length }; });
    md.push('', `**tap → first tick:** cold ${L.map(x => x.tapMs.toFixed(0)).join(' / ')} ms · a warm page ${L.map(x => x.warmTap.toFixed(0)).join(' / ')} ms`, '', `**by 10 s:** ${tens.map((t, k) => `${k * 10}–${k * 10 + 10} s: DROPS ${t.d.toFixed(1)} · BIG ${t.b.toFixed(1)} · JS ${t.js.toFixed(2)} ms`).join(' · ')}`, '');
  }
  const text = md.join('\n');
  console.log(text);
  if (out) { const f = join(out, 'warm', `warm-${eng}-${tag}.md`); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, text + '\n'); writeFileSync(join(out, 'warm', `warm-${eng}-${tag}.json`), JSON.stringify(Object.fromEntries(Object.entries(all).map(([k, L]) => [k, L.map(x => ({ tap: x.r.tap, gl: x.r.names, rows: x.rows, tapMs: x.tapMs, warmTap: x.warmTap }))])))); }
  return all;
}
