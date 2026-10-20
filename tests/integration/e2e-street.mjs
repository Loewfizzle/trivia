// THE STREET end to end (scripts/serve.mjs; no rooms needed): the furniture's layout at phone and desktop sizes (lamps + their
// trees, the shelter, the stop light clear of the blade signs and the door spot), the lamps' photocells around sunset, the
// trees by season, the bus pulling over at the shelter, the near lane queueing at red, the car mix, plows only in snow, the
// golden-hour shadows, wind + shedding, the street's party night (lamp colours, the chase, the party bus), Reduced effects and
// the frame pacing of the heaviest case (a rainy party peak with the bus) at 4× CPU. Grand Rapids.
// node e2e-street.mjs "<browser>" [./shots-street]   (env SHOTS=0 CPU=4 ONLY=layout,lamps,trees,bus,signal,cars,plow,shadows,wind,party,reduced,perf)
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-street').replace(/\/?$/, '/');
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
async function open({ when = '2026-10-21T22:00', qs = '', view = [390, 844], settings = null, wait = 800, ready = true } = {}) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  const slot = `st${n++}`;
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline|CORS/i.test(t)) { errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); } });
  const [w, h] = view, mobile = w < 800;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument((st, s) => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); if (st) localStorage.setItem('na:settings', JSON.stringify(st)); } catch { /* fine */ } }, settings, slot);
  await p.goto(`${BASE}/?emu&slot=${slot}&when=${when}&${GR}${qs ? '&' + qs : ''}`);
  await waitFor(p, ready ? '!!window.__district && window.__district.phase().done && !!window.__district.street() && window.__district.street().shown >= 1' : '!!window.__district && window.__district.phase().done', `${slot} street`, 30000);
  await sleep(wait);
  return { ctx, p, close: () => ctx.close() };
}
const ev = (p, js) => p.evaluate(js);
const street = p => ev(p, 'window.__district.street()');
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(100); }
  throw new Error(`timeout: ${what}`);
}
async function sample(p, js, k, every) { const out = []; for (let i = 0; i < k; i++) { out.push(await ev(p, js)); await sleep(every); } return out; }
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: `${OUT}${name}.png` }); };

try {
  if (on('layout')) {
    for (const view of [[390, 844], [412, 915], [1440, 900]]) {
      const X = await open({ view });
      const s = await street(X.p);
      const blades = await ev(X.p, "window.__district.scene().signs.filter(x => x.type === 'blade')");
      const rings = await ev(X.p, "[...document.querySelectorAll('.nd-ringbtn')].map(e => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width }; })");
      const phone = view[0] < 760, K = s.K;
      ok(phone ? s.lamps.length >= 3 && s.lamps.length <= 4 && s.trees.length >= 2 && s.trees.length <= 3 && s.signals.length === 1 : s.lamps.length >= 7 && s.trees.length >= 5 && s.signals.length === 2,
        `${view.join('x')}: ${s.lamps.length} lamps, ${s.trees.length} trees, ${s.signals.length} stop light(s), a shelter at ${s.shelter && s.shelter.x}`);
      ok(s.trees.every(t => s.lamps[t.lamp] && s.lamps[t.lamp].tree === s.trees.indexOf(t)), `${view.join('x')}: every tree beside its own lamp`);
      const clear = blades.every(b => b.y + b.h <= s.HZ - 48 * K || (s.lamps.every(l => l.x < b.x - 2 || l.x > b.x + b.w + 2) && s.trees.every(t => t.x + t.w / 2 < b.x || t.x - t.w / 2 > b.x + b.w)));
      ok(clear, `${view.join('x')}: the lamps and trees keep clear of the blade signs' bottoms`);
      if (phone) {
        const g = s.signals[0].x;
        ok(g > view[0] * 0.52 && Math.abs(g - view[0] / 2) > view[0] * 0.05, `${view.join('x')}: the stop light off the middle, toward the right (${g})`);
        ok(s.lamps.every(l => Math.abs(l.x - s.door.x) > s.door.w / 2), `${view.join('x')}: the door spot near the middle stays clear (${s.door.x})`);
        void rings;
      }
      await shot(X.p, `street-layout-${view.join('x')}`);
      await X.close();
    }
  }

  if (on('lamps')) {
    // sunset at 60×: the lamps come on one by one (a photocell each), before the night
    const X = await open({ when: '2026-10-21T18:25', qs: 'speed=40', wait: 0 });
    const seq = await sample(X.p, 'window.__district.street().lamps.map(l => l.lit > 0.5)', 170, 250);
    const firstOn = seq[0].map((_, i) => seq.findIndex(s => s[i]));
    const distinct = new Set(firstOn.filter(v => v >= 0)).size;
    ok(firstOn.every(v => v >= 0) && distinct >= 2 && seq[0].some(v => !v), `LAMPS: on one by one around sunset (first lit at samples ${firstOn.join(', ')})`);
    await X.close();
    const D = await open({ when: '2026-10-21T13:00' });
    ok((await street(D.p)).lamps.every(l => l.lit < 0.05), 'LAMPS: unlit by day');
    await D.close();
  }

  if (on('trees')) {
    const at = async (when, test, what, qs = '') => { const X = await open({ when, qs }); const s = await street(X.p); ok(test(s.trees.map(t => t.state), s), `${what} (${JSON.stringify(s.trees.map(t => ({ leaf: t.state.leaf, b: t.state.blossom, l: t.state.lights })))})`); await shot(X.p, `street-${what.split(':')[0].toLowerCase().replace(/\W+/g, '-')}`); await X.close(); };
    await at('2026-10-24T16:30', ts => ts.some(t => t.mix.green < 0.5), 'AUTUMN: the trees have turned');
    await at('2026-12-18T19:00', ts => ts.every(t => t.bare && t.lights), 'WINTER: bare, with string lights');
    await at('2026-04-05T20:30', (ts, s) => s.trees.some(t => t.cherry && t.state.blossom > 0.8), 'SPRING: the cherry in blossom at Easter');
    await at('2026-07-15T21:45', ts => ts.every(t => t.leaf === 1 && t.mix.green === 1), 'SUMMER: full, deep green');
    const F = await open({ when: '2026-07-15T22:30' });
    const flies = await waitFor(F.p, 'window.__district.street().flies > 0', 'fireflies', 8000).catch(() => false);
    const fx = await ev(F.p, 'window.__district.scene().fx');
    ok(flies && !('flies' in fx) && !('leaves' in fx) && !('petals' in fx), 'SUMMER NIGHT: fireflies only by the trees (the screen-wide leaves, petals and fireflies are gone)');
    await F.close();
  }

  if (on('bus')) {
    const X = await open({ when: '2026-10-20T11:00', qs: 'force=bus', wait: 0 });
    await waitFor(X.p, '!!window.__district.street().bus', 'a bus', 20000);
    await waitFor(X.p, "window.__district.street().bus && window.__district.street().bus.state === 'dwell'", 'the bus at its stop', 40000);
    const s = await street(X.p);
    ok(Math.abs(s.bus.x - s.shelter.x) < 6, `BUS: pulls over at the shelter (bus ${Math.round(s.bus.x)}, shelter ${s.shelter.x}) — ${s.bus.route}`);
    await shot(X.p, 'street-bus-at-stop-390x844');
    await waitFor(X.p, "window.__district.street().bus && window.__district.street().bus.state === 'leave'", 'pulls away', 12000);
    ok(true, 'BUS: waits, then pulls away');
    await X.close();
    // the timetable at 60×: a few buses in a rush-hour minute of real time, never two on screen
    const R = await open({ when: '2026-10-20T17:20', qs: 'speed=60', wait: 0 });
    const buses = await sample(R.p, '[window.__district.street().road.buses, window.__district.street().bus ? 1 : 0]', 50, 500);
    ok(buses[buses.length - 1][0] >= 2, `BUS: on the clock (${buses[buses.length - 1][0]} buses in ~25 minutes of rush hour)`);
    await R.close();
    const N = await open({ when: '2026-10-21T03:00', qs: 'speed=30', wait: 0 });
    await sleep(8000);
    ok((await street(N.p)).road.buses === 0, 'BUS: none in the small hours');
    await N.close();
    const O = await open({ when: '2026-10-22T01:10', qs: 'force=owl', wait: 0 });
    await waitFor(O.p, '!!window.__district.street().bus', 'the owl', 20000);
    const ob = (await street(O.p)).bus;
    ok(ob.owl, `BUS: the night owl around 1 am (${ob.route})`);
    await shot(O.p, 'street-owl-390x844');
    await O.close();
  }

  if (on('signal')) {
    const X = await open({ when: '2026-10-21T17:40', qs: 'force=red,rush', wait: 0 });
    await sleep(14000);
    const s = await street(X.p);
    ok(s.signals.every(g => g.state === 'red') && s.road.queued >= 1, `SIGNAL: on red the near lane queues (${s.road.queued} stopped, ${s.road.braking} braking)`);
    await X.close();
    const G = await open({ when: '2026-10-21T17:40', qs: 'force=green,rush', wait: 0 });
    await sleep(10000);
    ok((await street(G.p)).road.queued === 0, 'SIGNAL: on green the traffic flows');
    await G.close();
    const L = await open({ when: '2026-10-22T02:30', wait: 0 });
    const states = new Set((await sample(L.p, 'window.__district.street().signals[0].state', 12, 250)));
    ok(states.has('flash') && !states.has('red'), `SIGNAL: flashing yellow late at night (${[...states]})`);
    await L.close();
  }

  if (on('cars')) {
    const seen = async (qs, k) => { const X = await open({ when: '2026-10-21T08:15', qs, wait: 0 }); const kinds = {}; for (let i = 0; i < k; i++) { const s = await street(X.p); for (const [n, v] of Object.entries(s.road.kinds)) kinds[n] = Math.max(kinds[n] || 0, v); await sleep(700); } await shot(X.p, `street-cars-${qs.replace(/\W+/g, '-')}-390x844`); await X.close(); return kinds; };
    const natural = await seen('force=rush', 30);
    ok(Object.keys(natural).length >= 4, `CARS: the morning rush brings a mix of kinds on its own (${JSON.stringify(natural)})`);
    const forced = await seen('force=rush,moto,truck', 16);
    ok(forced.moto && forced.truck, `CARS: &force=moto,truck brings them (${JSON.stringify(forced)})`);
  }

  if (on('plow')) {
    const X = await open({ when: '2027-01-15T19:00', qs: 'wx=snow&force=plow', wait: 0 });
    await waitFor(X.p, "!!window.__district.street().road.kinds.plow", 'a plow', 30000);
    await sleep(3000);
    const s = await street(X.p);
    ok(s.road.plowLanes >= 1 && s.snowCover > 0.3, `PLOW: in real snow, a darker wet lane behind it, snow on the branches (${s.snowCover})`);
    await shot(X.p, 'street-plow-390x844');
    await X.close();
    const C = await open({ when: '2027-01-15T19:00', qs: 'wx=clear&speed=30', wait: 0 });
    await sleep(9000);
    ok(!(await street(C.p)).road.kinds.plow, 'PLOW: never in clear weather');
    await C.close();
  }

  if (on('shadows')) {
    const X = await open({ when: '2026-10-20T18:15' });
    const s = await street(X.p);
    ok(s.shadow > 0.3 && s.shadowDir === -1, `SHADOWS: long at golden hour, pointing away from the evening sun (left) (${s.shadow}, ${s.shadowDir})`);
    await shot(X.p, 'street-golden-390x844');
    await X.close();
    const M = await open({ when: '2026-10-20T08:25' });
    const m = await street(M.p);
    ok(m.shadow > 0.1 && m.shadowDir === 1, `SHADOWS: in the morning they point right (${m.shadow}, ${m.shadowDir})`);
    await M.close();
    const N = await open({ when: '2026-10-20T13:00' });
    ok((await street(N.p)).shadow === 0, 'SHADOWS: none at midday');
    await N.close();
  }

  if (on('wind')) {
    const W = await open({ when: '2026-10-24T16:30', qs: 'wind=12&force=gust', wait: 0 });
    const fall = await sample(W.p, 'window.__district.street().falling', 30, 250);
    const Wmax = Math.max(...fall);
    await shot(W.p, 'street-autumn-windy-390x844');
    await W.close();
    const C = await open({ when: '2026-10-24T16:30', qs: 'wind=0', wait: 0 });
    const calm = Math.max(...(await sample(C.p, 'window.__district.street().falling', 30, 250)));
    await C.close();
    ok(Wmax > calm && Wmax >= 3, `WIND: leaves fly on a windy day (${Wmax} falling) and only now and then when calm (${calm})`);
    const S = await open({ when: '2026-11-20T15:00', qs: 'wind=8', wait: 0 });
    await sleep(9000);
    ok((await street(S.p)).grounded > 0, 'WIND: fallen leaves settle on the sidewalk and the street');
    await S.close();
  }

  if (on('party')) {
    const X = await open({ when: '2026-10-23T23:00', qs: 'force=chase', wait: 0 });
    await sleep(5000);
    const s = await street(X.p);
    const warm = [255, 206, 142];
    const coloured = s.lamps.filter(l => Math.abs(l.col[0] - warm[0]) + Math.abs(l.col[1] - warm[1]) + Math.abs(l.col[2] - warm[2]) > 60).length;
    const boosts = await sample(X.p, 'Math.max(...window.__district.street().lamps.map(l => l.boost))', 40, 100);
    ok(coloured >= s.lamps.length - 1, `PARTY: the lamps in the party's colours at the peak (${coloured}/${s.lamps.length})`);
    ok(Math.max(...boosts) > 0.8 && s.chases >= 1, `PARTY: the chase runs lamp to lamp; the lamps breathe (peak boost ${Math.max(...boosts).toFixed(2)}, ${s.chases} chases)`);
    await shot(X.p, 'street-party-peak-390x844');
    await X.close();
    const B = await open({ when: '2026-10-23T23:00', qs: 'force=partybus', wait: 0 });
    await waitFor(B.p, '!!window.__district.street().bus', 'the party bus', 20000);
    const pb = (await street(B.p)).bus;
    ok(pb.party && /PARTY|AFTER|DANCE|NEON/.test(pb.route), `PARTY: the PARTY BUS (${pb.route})`);
    await sleep(2500); await shot(B.p, 'street-party-bus-390x844');
    await B.close();
    const E = await open({ when: '2026-10-21T21:00', wait: 1500 });
    const e = await street(E.p);
    ok(e.lamps.every(l => Math.abs(l.col[0] - warm[0]) + Math.abs(l.col[1] - warm[1]) + Math.abs(l.col[2] - warm[2]) < 6), 'PARTY: an ordinary night keeps the warm white');
    await E.close();
    const M = await open({ when: '2026-10-23T23:00', wait: 1500 });
    await ev(M.p, 'window.__district.finale()');
    const mb = await sample(M.p, 'window.__district.street().lamps.map(l => l.boost)', 20, 60);
    const firstPeak = mb[0].map((_, i) => mb.findIndex(s => s[i] > 0.8));
    ok(firstPeak.every(v => v >= 0) && firstPeak[0] <= firstPeak[Math.floor(firstPeak.length / 2)], `PARTY: at midnight the lamps flash in sequence toward the middle (${firstPeak.join(', ')})`);
    await M.close();
  }

  if (on('reduced')) {
    const R = await open({ when: '2026-10-24T16:30', qs: 'wind=12&force=gust', settings: { reducedFx: true }, wait: 3000 });
    const r = await street(R.p);
    await R.close();
    const P = await open({ when: '2026-10-23T23:00', qs: 'force=chase', settings: { reducedFx: true }, wait: 3000 });
    const pb = await sample(P.p, 'Math.max(...window.__district.street().lamps.map(l => l.boost))', 20, 150);
    const ps = await street(P.p);
    await P.close();
    ok(r.falling === 0 && Math.max(...pb) === 0 && ps.chases === 0 && ps.lamps.some(l => l.col[2] > 160 || l.col[0] < 220), 'REDUCED EFFECTS: no falling leaves, no chase, no breathing — the party colours stay, steady');
  }

  if (on('perf')) {
    // the heaviest case: a rainy party peak with the bus on screen, tier 2 (the phone's look), 4× CPU
    const pace = async qs => {
      const X = await open({ when: '2026-10-23T23:00', qs, wait: 1500, ready: !qs.includes('no-street') });
      const c = await X.p.target().createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate: CPU });
      await ev(X.p, 'window.__district.setTier(2)'); await sleep(9000);
      const f = await ev(X.p, 'window.__district.frames()'); const s = [...f].sort((a, b) => a - b);
      const cs = await ev(X.p, 'window.__district.cost()'); const draw = cs.reduce((a, b) => a + b, 0) / Math.max(1, cs.length);
      const st = await street(X.p); const bus = !!(st && st.bus);
      await X.close();
      return { p50: +s[Math.floor(s.length / 2)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), draw: +draw.toFixed(2), bus };
    };
    // (a warm-up page, then alternated, two of each, compared by the draw's own cost: frame intervals are quantised to 16.7 ms
    // ticks, and the first page measured after a warm-up runs slow — the same yardstick as e2e-people)
    { const Wm = await open({ when: '2026-10-23T23:00', wait: 3000, ready: false }); await Wm.close(); }
    const r = [];
    for (const q of ['wx=rain&force=partybus,no-street', 'wx=rain&force=partybus,chase', 'wx=rain&force=partybus,no-street', 'wx=rain&force=partybus,chase']) r.push(await pace(q));
    const avg = (a, b) => ({ p50: +((a.p50 + b.p50) / 2).toFixed(1), p95: +((a.p95 + b.p95) / 2).toFixed(1), draw: +((a.draw + b.draw) / 2).toFixed(2), bus: a.bus || b.bus });
    const off = avg(r[0], r[2]), onS = avg(r[1], r[3]);
    log('pacing', JSON.stringify({ off, on: onS }));
    ok(onS.draw <= off.draw * 1.25 + 1, `PERF at ${CPU}× CPU, a rainy party peak with the bus (${onS.bus ? 'on screen' : 'passing'}): drawing ${onS.draw} ms a frame with the street vs ${off.draw} without (frames ${onS.p50}/${onS.p95} vs ${off.p50}/${off.p95} without`);
  }
} catch (e) { errors.push(`crash: ${e && e.stack || e}`); log('CRASH', e && e.message); }

await browser.close();
log(`checks ${checks.filter(c => c.ok).length}/${checks.length} passed`);
log(errors.length ? `errors:\n  ${errors.join('\n  ')}` : 'errors none');
process.exit(errors.length ? 1 : 0);
