// RAINBOWS end to end (scripts/serve.mjs; no rooms needed): the after-rain trigger through the real path (&rained= sets the
// weather's wetAt, as /api/sky does), which bow by time / moon / party, overcast and rain blocking it, the fades (in, out, the
// neon powering off), never over the sun, behind the towers at every size, under the text, the neon's sputter and breathing,
// Reduced effects, the preview flags, frame pacing at 4× CPU, and the review's screenshots (Grand Rapids).
// node e2e-rainbow.mjs "<browser>" ./shots-rainbow   (env SHOTS=0 CPU=4 ONLY=trigger,choice,fade,sun,place,neon,reduced,flags,perf,media)
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-rainbow').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS !== '0', CPU = Number(process.env.CPU || 4);
const ONLY = new Set((process.env.ONLY || '').split(',').filter(Boolean));
const on = g => !ONLY.size || ONLY.has(g);
const GR = 'tz=America/Detroit&at=42.96,-85.67';
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--mute-audio'] });

let n = 0;
async function open({ when = '2026-10-19T17:15', qs = '', view = [390, 844], settings = null, wait = 1200, guest = false } = {}) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  const slot = `rb${n++}`;
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline|CORS/i.test(t)) { errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); } });
  const [w, h] = view, mobile = w < 800;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument((st, s, g) => { try { localStorage.setItem('nd:entered', '1'); if (!g) localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); if (st) localStorage.setItem('na:settings', JSON.stringify(st)); } catch { /* fine */ } }, settings, slot, guest);
  await p.goto(`${BASE}/?emu&slot=${slot}&when=${when}&${GR}${qs ? '&' + qs : ''}`);
  await waitFor(p, '!!window.__district && window.__district.phase().done && !!window.__district.rainbow().geo', `${slot} title`, 25000);
  await sleep(wait);
  return { ctx, p, close: () => ctx.close() };
}
const ev = (p, js) => p.evaluate(js);
const rb = p => ev(p, 'window.__district.rainbow()');
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(100); }
  throw new Error(`timeout: ${what}`);
}
async function sample(p, js, k, every) { const out = []; for (let i = 0; i < k; i++) { out.push(await ev(p, js)); await sleep(every); } return out; }
// the neon bow's state every ~40 ms until it holds (it powers on a few seconds after a forced bow starts fading in)
async function untilOn(p) { const out = []; for (let i = 0; i < 300; i++) { const r = await rb(p); out.push(r); if (r.neon === 'on' && out.length > 2) break; await sleep(40); } return out; }
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: `${OUT}${name}.png` }); };
const target = async (when, qs, o = {}) => { const X = await open({ when, qs, ...o }); const r = await rb(X.p); await X.close(); return r.target; };

try {
  if (on('trigger')) {
    // the real path: the weather says when the rain stopped (&rained = minutes before the clock's start; /api/sky's wetAt)
    const just = await target('2026-10-19T17:15', 'wx=clear&rained=12');
    ok(just.day > 0.6 && just.wet && just.env === 1, `RAIN JUST ENDED (12 min ago), late afternoon: the day bow is due (target ${just.day}, env ${just.env})`);
    const raining = await target('2026-10-19T17:15', 'wx=rain&rained=0');
    ok(raining.day === 0 && raining.moon === 0 && raining.neon === 0, 'STILL RAINING: no bow');
    const dry = await target('2026-10-19T17:15', 'wx=clear');
    ok(dry.day === 0 && dry.wet === null, 'DRY ALL DAY: no rain to follow, no bow (never invented)');
    const long = await target('2026-10-19T17:15', 'wx=clear&rained=60');
    ok(long.day === 0, 'AN HOUR AFTER THE RAIN: gone');
    const over = await target('2026-10-19T17:15', 'wx=overcast&rained=12');
    ok(over.day === 0, 'THICK OVERCAST after the rain: hidden');
  }

  if (on('choice')) {
    const noon = await target('2026-06-21T13:30', 'wx=clear&rained=12');
    ok(noon.day === 0, 'A SUMMER NOON (sun ~70°): no rainbow is possible');
    const moon = await target('2026-10-26T22:00', 'wx=clear&rained=12');
    ok(moon.moon > 0.5 && moon.day === 0 && moon.neon === 0, `A BRIGHT MOON after the rain: the moonbow (${moon.moon})`);
    const thin = await target('2026-10-12T22:00', 'wx=clear&rained=12');
    ok(thin.moon === 0 && thin.neon === 0, 'A THIN MOON: no moonbow');
    const P = await open({ when: '2026-10-23T22:30', qs: 'wx=clear&rained=12' });
    await waitFor(P.p, "window.__district.rainbow().neon === 'on'", 'party neon on', 15000);
    const pr = await rb(P.p);
    ok(pr.target.neon > 0.8 && pr.target.moon === 0, `A PARTY NIGHT after the rain: the neon bow instead of the moonbow (${pr.target.neon})`);
    await P.close();
    const an = await target('2026-10-19T17:15', 'wx=clear&rained=12', { settings: { alwaysNight: true } });
    ok(an.day === 0, 'ALWAYS NIGHT in the afternoon: never the day bow');
    const anm = await target('2026-10-26T22:00', 'wx=clear&rained=12', { settings: { alwaysNight: true } });
    ok(anm.moon > 0.5, 'ALWAYS NIGHT: the moonbow rules as at night');
  }

  if (on('fade')) {
    const F = await open({ when: '2026-10-19T17:15', qs: 'wx=clear&rained=12', wait: 0 });
    const s = await sample(F.p, 'window.__district.rainbow().day', 40, 150);
    let mono = true, maxStep = 0;
    for (let i = 1; i < s.length; i++) { if (s[i] < s[i - 1] - 1e-6) mono = false; maxStep = Math.max(maxStep, s[i] - s[i - 1]); }
    ok(mono && s[s.length - 1] > s[0] + 0.3 && maxStep < 0.05, `FADES IN: smoothly, never a pop (${s[0]} → ${s[s.length - 1]}, largest step ${maxStep.toFixed(3)})`);
    await F.close();
    // the end of the appearance at 60× (the clock runs on): the neon bow powers off gently, the day bow fades away
    const E = await open({ when: '2026-10-23T22:30', qs: 'wx=clear&rained=12&speed=60', wait: 0 });
    await waitFor(E.p, "window.__district.rainbow().neon === 'on'", 'neon on before the end', 15000);
    await waitFor(E.p, "window.__district.rainbow().neon === 'off'", 'neon powering off', 60000);
    const lv = await sample(E.p, 'window.__district.rainbow().neonLevel', 12, 200);
    let down = true; for (let i = 1; i < lv.length; i++) if (lv[i] > lv[i - 1] + 1e-6) down = false;
    await waitFor(E.p, "window.__district.rainbow().neon === 'none'", 'neon off', 10000);
    ok(down && lv[0] > lv[lv.length - 1], `ENDS: the neon bow powers off gently over a couple of seconds (${lv[0].toFixed(2)} → ${lv[lv.length - 1].toFixed(2)})`);
    await E.close();
    const D = await open({ when: '2026-10-19T17:15', qs: 'wx=clear&rained=12&speed=60', wait: 0 });
    await waitFor(D.p, 'window.__district.rainbow().day > 0.3', 'day bow up', 20000);
    await waitFor(D.p, 'window.__district.rainbow().target.day === 0', 'day bow due off', 60000);
    const dv = await sample(D.p, 'window.__district.rainbow().day', 10, 300);
    let dd = true; for (let i = 1; i < dv.length; i++) if (dv[i] > dv[i - 1] + 1e-6 || dv[i - 1] - dv[i] > 0.02) dd = false;
    ok(dd && dv[0] > dv[dv.length - 1], `ENDS: the day bow fades away, never a pop (${dv[0]} → ${dv[dv.length - 1]})`);
    await D.close();
  }

  if (on('sun')) {
    // 17:15 on a phone: the sun's arch runs right across the bow's top — it must open around the disc
    const S = await open({ when: '2026-10-19T17:15', qs: 'force=rainbow', wait: 9000 });
    const r = await rb(S.p);
    const sun = await ev(S.p, 'window.__district.sun ? window.__district.sun() : null');
    ok(r.hole, `NEVER OVER THE SUN: the bow opens softly around the disc (sun ${sun ? `${sun.x},${sun.y}` : '?'}; arc top ${r.geo.top})`);
    await shot(S.p, 'rainbow-sun-hole-390x844');
    await S.close();
  }

  if (on('place')) {
    for (const [view, guest] of [[[390, 844]], [[430, 932]], [[412, 915]], [[1440, 900]], [[390, 844], true]]) {
      const X = await open({ when: '2026-10-19T17:15', qs: 'force=rainbow', view, wait: 1500, guest });
      const r = await rb(X.p);
      const rects = await ev(X.p, "(() => { const b = s => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return q.height ? { y: q.top, b: q.bottom } : null; }; const t = b('.nd-tag'), s = b('.nd-sub'); return { tag: s && s.b > t.b ? s : t, sub: !!s, neon: b('.nd-logo') || b('.nd-sign svg') }; })()");
      if (guest) ok(rects.sub, 'a first visit shows the subline under the tagline (the case below)');
      const behind = r.edges.every(g => g.every(e => e.y > e.roof));
      ok(behind, `${view.join('x')}: BEHIND THE TOWERS — every bow meets the screen's edges below the roofs there (${JSON.stringify(r.edges.map(g => g.map(e => `${e.y}>${e.roof}`)))})`);
      if (view[0] < 760) ok(r.geo.top > rects.tag.b && r.ngeo.top > r.geo.top, `${view.join('x')}${guest ? ' (first visit)' : ''}: UNDER THE TEXT — the arc tops out under the tagline (top ${r.geo.top} > ${Math.round(rects.tag.b)}); the neon bow lower (${r.ngeo.top})`);
      else ok(r.geo.top + r.geo.band < rects.neon.y, `${view.join('x')}: a wide screen's bow arches over the sign, never across a letter (band ${r.geo.top}–${r.geo.top + r.geo.band} < ${Math.round(rects.neon.y)})`);
      await X.close();
    }
  }

  if (on('neon')) {
    const N = await open({ when: '2026-10-23T22:30', qs: 'force=neonbow', wait: 0 });
    const seq = await untilOn(N.p);
    const sput = seq.filter(s => s.neon === 'sputter');
    const staggered = sput.some(s => s.tubes[0] > 0 && s.tubes[5] === 0);
    const flick = seq.some((s, i) => i > 0 && s.tubes.some((v, j) => v > 0 && v < seq[i - 1].tubes[j] - 0.2));
    ok(sput.length > 3 && staggered && flick && seq[seq.length - 1].neon === 'on', `POWERS ON like the sign: a sputter, tube by tube (red first), then it holds (${sput.length} sputter frames; staggered ${staggered}, flickers ${flick})`);
    const al = await sample(N.p, 'window.__district.rainbow().neonAlpha', 40, 80);
    const mx = Math.max(...al), mn = Math.min(...al);
    ok(mx - mn > 0.015 && mx <= 0.8 + 1e-6, `BREATHES with the party's beat, a touch dimmer than the sign (${mn.toFixed(3)}–${mx.toFixed(3)})`);
    await shot(N.p, 'neonbow-on-390x844');
    await N.close();
  }

  if (on('reduced')) {
    const R = await open({ when: '2026-10-23T22:30', qs: 'force=neonbow', settings: { reducedFx: true }, wait: 0 });
    const seq = await untilOn(R.p);
    await sleep(1800);
    const al = (await sample(R.p, 'window.__district.rainbow().neonAlpha', 20, 80));
    ok(!seq.some(s => s.neon === 'sputter') && seq[seq.length - 1].neon === 'on' && Math.max(...al) - Math.min(...al) < 0.003, 'REDUCED EFFECTS: the neon bow fades on (no sputter) and holds steady (no breathing)');
    await shot(R.p, 'neonbow-reduced-390x844');
    await R.close();
    const RD = await open({ when: '2026-10-19T17:15', qs: 'force=rainbow', settings: { reducedFx: true }, wait: 0 });
    const d = await sample(RD.p, 'window.__district.rainbow().day', 30, 200);
    ok(d[d.length - 1] > 0.5 && d.every((v, i) => !i || v >= d[i - 1] - 1e-6), 'REDUCED EFFECTS: the day bow fades in gently');
    await RD.close();
  }

  if (on('flags')) {
    const f = async q => { const X = await open({ when: q === 'neonbow' ? '2026-10-23T22:30' : q === 'moonbow' ? '2026-10-26T22:00' : '2026-10-19T17:15', qs: `force=${q}`, wait: 3000 }); const r = await rb(X.p); await X.close(); return r; };
    const a = await f('rainbow'), b = await f('rainbow2'), c = await f('moonbow'), d = await f('neonbow');
    ok(a.target.forced === 'day' && !a.secondary && b.secondary && c.target.moon > 0 && d.target.neon > 0, 'PREVIEW FLAGS: &force=rainbow, rainbow2 (with the secondary), moonbow, neonbow');
  }

  if (on('perf')) {
    // the cost of a bow at 4× CPU: the same scene with it drawn and with it off (steady state; tier 2, the phone's look)
    const pace = async (when, qs) => {
      const X = await open({ when, qs, wait: 2500 });
      const c = await X.p.target().createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate: CPU });
      await ev(X.p, 'window.__district.setTier(2)'); await sleep(9000);
      const f = await ev(X.p, 'window.__district.frames()'); const s = [...f].sort((x, y) => x - y);
      await X.close();
      return { p50: +s[Math.floor(s.length / 2)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1) };
    };
    const nOff = await pace('2026-10-23T22:30', 'force=neonbow,no-rainbow'), nOn = await pace('2026-10-23T22:30', 'force=neonbow');
    const dOff = await pace('2026-10-19T17:15', 'force=rainbow2,no-rainbow'), dOn = await pace('2026-10-19T17:15', 'force=rainbow2');
    log('pacing', JSON.stringify({ nOff, nOn, dOff, dOn }));
    ok(nOn.p50 <= Math.max(nOff.p50 * 1.1, 34) && dOn.p50 <= Math.max(dOff.p50 * 1.1, 34), `PERF at ${CPU}× CPU (software raster): the neon bow ${nOn.p50}/${nOn.p95} ms vs ${nOff.p50}/${nOff.p95} without; the day bow ${dOn.p50}/${dOn.p95} vs ${dOff.p50}/${dOff.p95}`);
  }

  if (on('media') && SHOTS) {
    for (const view of [[390, 844], [430, 932], [412, 915], [1440, 900]]) {
      const tag = view.join('x');
      for (const [name, when, q] of [['rainbow-late-afternoon', '2026-10-19T17:15', 'force=rainbow'], ['rainbow-secondary', '2026-10-19T17:15', 'force=rainbow2'], ['moonbow', '2026-10-26T22:00', 'force=moonbow'], ['neonbow-friday', '2026-10-23T22:30', 'force=neonbow']]) {
        const X = await open({ when, qs: q, view, wait: 0 });
        if (q === 'force=neonbow') await waitFor(X.p, "window.__district.rainbow().neon === 'sputter' && window.__district.rainbow().tubes[2] > 0", 'sputter', 15000);
        else await waitFor(X.p, `window.__district.rainbow().${q === 'force=moonbow' ? 'moon' : 'day'} > 0.35`, 'fading in', 15000);
        await shot(X.p, `${name}-fading-in-${tag}`);
        await waitFor(X.p, q === 'force=neonbow' ? "window.__district.rainbow().neon === 'on'" : `window.__district.rainbow().${q === 'force=moonbow' ? 'moon' : 'day'} > 0.99`, 'full', 20000);
        await sleep(600);
        await shot(X.p, `${name}-${tag}`);
        await X.close();
      }
    }
    log('screenshots in', OUT);
  }
} catch (e) { errors.push(`crash: ${e && e.stack || e}`); log('CRASH', e && e.message); }

await browser.close();
log(`checks ${checks.filter(c => c.ok).length}/${checks.length} passed`);
log(errors.length ? `errors:\n  ${errors.join('\n  ')}` : 'errors none');
process.exit(errors.length ? 1 : 0);
