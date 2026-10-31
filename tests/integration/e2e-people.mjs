// THE STREET, Part 2 end to end (scripts/serve.mjs; no rooms needed): the speakeasy's door (visits, the hint, the party line and
// its thinning, by day an ordinary door), the people by the hour, umbrellas and spray in the rain, the cab hail start to finish,
// boarding the bus, the holidays (Halloween kids, the New Year line's sparklers, July 4th, the wreath), Reduced effects, and the
// pacing of the worst real case (a rainy party peak: the bus, the chase, the line, umbrellas, spray, a hail) at 4× CPU.
// (The knock → JOIN and the dock-buttons-still-work checks live in e2e-title.mjs, group "knock".)
// node e2e-people.mjs "<browser>" [./shots-people]   (env SHOTS=0 CPU=4 ONLY=door,line,peds,rain,hail,bus,holidays,reduced,perf)
import puppeteer from './kit/puppeteer.mjs'; // (+ --mute-audio, the 60 fps fix: kit/puppeteer.mjs)
import { mkdirSync } from 'node:fs';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-people').replace(/\/?$/, '/');
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
async function open({ when = '2026-10-21T22:00', qs = '', view = [390, 844], settings = null, wait = 600, ready = true } = {}) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  const slot = `pp${n++}`;
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline|CORS/i.test(t)) { errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); } });
  const [w, h] = view, mobile = w < 800;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument((st, s) => { try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); if (st) localStorage.setItem('na:settings', JSON.stringify(st)); } catch { /* fine */ } }, settings, slot);
  await p.goto(`${BASE}/?emu&slot=${slot}&when=${when}&${GR}${qs ? '&' + qs : ''}`);
  await waitFor(p, ready ? '!!window.__district && window.__district.phase().done && !!window.__district.street() && !!window.__district.street().people && !!window.__district.door()' : '!!window.__district && window.__district.phase().done', `${slot} ready`, 30000);
  await sleep(wait);
  return { ctx, p, close: () => ctx.close() };
}
const ev = (p, js) => p.evaluate(js);
const ppl = p => ev(p, 'window.__district.street().people');
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(150); }
  throw new Error(`timeout: ${what}`);
}
const until = (p, js, what, ms) => waitFor(p, js, what, ms).then(() => true).catch(() => false);
async function sample(p, js, k, every) { const out = []; for (let i = 0; i < k; i++) { out.push(await ev(p, js)); await sleep(every); } return out; }
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: `${OUT}${name}.png` }); };

try {
  if (on('door')) {
    const X = await open({ qs: 'force=door', wait: 0 });
    const visited = await until(X.p, 'window.__district.street().people.visits >= 1', 'a visit', 30000);
    const opened = await until(X.p, 'window.__district.street().people.door.open > 0.4', 'the door opens', 30000);
    ok(visited && opened, 'DOOR: someone walks up, the peephole checks, the door opens a crack and they slip in');
    await shot(X.p, 'door-visit-390x844');
    await X.close();
    const H = await open({ qs: 'speed=10', wait: 0 });
    ok(await until(H.p, 'window.__district.street().people.hints >= 1', 'the hint', 20000), 'DOOR, THE HINT: resting a while, the peephole flicks open on its own');
    await H.close();
    const D = await open({ when: '2026-10-21T13:00', wait: 2000 });
    const dd = await ppl(D.p);
    ok(dd.line === 0 && dd.door.screen, 'DOOR, BY DAY: an ordinary dark door (no line; sconce and doorman off)');
    await shot(D.p, 'door-day-390x844');
    await D.close();
    const S = await open({ when: '2026-10-21T22:00', view: [1440, 900] });
    const sd = await ev(S.p, 'window.__district.door()');
    ok(sd && sd.rect && sd.rect.w >= 44, `DOOR: its screen position is exposed for the lobby (desktop: ${Math.round(sd.x)}, ${Math.round(sd.y)})`);
    await S.close();
  }

  if (on('line')) {
    const X = await open({ when: '2026-10-23T23:15', wait: 4000 });
    const l = (await ppl(X.p)).line;
    ok(l >= 3 && l <= 5, `PARTY LINE: posts, a velvet rope, ${l} waiting at the peak (phone: 3–5)`);
    await shot(X.p, 'party-line-390x844');
    await X.close();
    const A = await open({ when: '2026-10-24T01:45', wait: 4000 });
    const la = (await ppl(A.p)).line;
    ok(la < l, `PARTY LINE: after hours it thins (${la})`);
    await A.close();
    const W = await open({ when: '2026-10-21T23:15', wait: 3000 });
    ok((await ppl(W.p)).line === 0, 'PARTY LINE: none on an ordinary night');
    await W.close();
  }

  if (on('peds')) {
    const count = async (when) => { const X = await open({ when, qs: 'speed=3', wait: 0 }); const s = await sample(X.p, 'window.__district.street().people.walking', 24, 500); await X.close(); return Math.max(...s); };
    const ev1 = await count('2026-10-21T21:00'), sm = await count('2026-10-22T03:30');
    ok(ev1 >= 1 && ev1 <= 4, `PEOPLE: a few on an evening (${ev1})`);
    ok(sm <= 1, `PEOPLE: almost nobody in the small hours (${sm})`);
  }

  if (on('rain')) {
    const X = await open({ qs: 'wx=rain&force=peds', wait: 0 });
    const umb = await until(X.p, 'window.__district.street().people.umbrellas >= 1', 'umbrellas', 20000);
    const spray = await until(X.p, 'window.__district.street().road.spray > 0', 'spray', 20000);
    ok(umb, 'RAIN: umbrellas come out — coloured domes, their colour in the wet street');
    ok(spray, 'RAIN: the wheels throw a soft spray through the wet street');
    await shot(X.p, 'rain-umbrellas-390x844');
    await X.close();
    const C = await open({ qs: 'wx=clear&force=peds', wait: 6000 });
    const cc = await ppl(C.p), cs = (await ev(C.p, 'window.__district.street().road.spray'));
    ok(cc.umbrellas === 0 && cs === 0, 'RAIN: none of it in the dry');
    await C.close();
    const N = await open({ when: '2027-01-15T19:00', qs: 'wx=snow&force=peds', wait: 0 });
    ok(await until(N.p, 'window.__district.street().people.prints > 0', 'footprints', 20000), 'SNOW: hoods, slower steps, footprints fading on the sidewalk');
    await N.close();
  }

  if (on('hail')) {
    const X = await open({ qs: 'force=hail', wait: 0 });
    const asked = await until(X.p, "window.__district.street().people.hail.state === 'waiting'", 'someone hails', 40000);
    const stopped = await until(X.p, "window.__district.street().people.hail.cab === 'stopped'", 'the cab pulls over', 40000);
    await shot(X.p, 'hail-390x844');
    const gone = await until(X.p, "window.__district.street().people.hail.id === null", 'they leave together', 30000);
    ok(asked && stopped && gone, `HAIL: someone steps to the curb, a cab pulls over (hazards, the door light), they get in, it pulls away (${asked}/${stopped}/${gone})`);
    await X.close();
  }

  if (on('bus')) {
    const X = await open({ when: '2026-10-21T19:00', qs: 'force=bus,peds&speed=2', wait: 0 });
    ok(await until(X.p, 'window.__district.street().people.boarded >= 1', 'boarding', 70000), 'BUS: someone waiting at the shelter boards when it stops');
    await X.close();
  }

  if (on('holidays')) {
    const K = await open({ when: '2026-10-31T19:30', qs: 'force=halloween-kids', wait: 0 });
    ok(await until(K.p, 'window.__district.street().people.kids >= 2', 'trick-or-treaters', 30000), 'HALLOWEEN: trick-or-treaters with glowing jack-o\'-lanterns');
    await sleep(3000); await shot(K.p, 'halloween-kids-390x844');
    await K.close();
    const Y = await open({ when: '2027-01-01T00:01', wait: 4000 });
    const y = await ppl(Y.p);
    ok(y.line >= 3 && y.sparklers >= 1, `NEW YEAR: the line at the door, sparklers at midnight (line ${y.line})`);
    await shot(Y.p, 'nye-sparklers-390x844');
    await Y.close();
    const J = await open({ when: '2026-07-04T23:00', wait: 0 });
    ok(await until(J.p, 'window.__district.street().people.sparklers >= 1', 'July 4th', 40000), 'JULY 4TH: sparklers on the sidewalk after dark');
    await J.close();
    const C = await open({ when: '2026-12-22T21:00', wait: 1000 });
    ok((await ppl(C.p)).wreath, 'CHRISTMAS WEEK: a wreath on the door with a few warm bulbs');
    await C.close();
  }

  if (on('reduced')) {
    const R = await open({ qs: 'wx=rain&force=peds,door', settings: { reducedFx: true }, wait: 0 });
    const walked = await until(R.p, 'window.__district.street().people.walking >= 1', 'people walk', 20000);
    const opened = await until(R.p, 'window.__district.street().people.door.open > 0.4', 'the door opens', 90000);
    const sp = await ev(R.p, 'window.__district.street().road.spray');
    ok(walked && opened && sp === 0, 'REDUCED EFFECTS: people still walk (slowly), the door still opens, no spray');
    await R.close();
  }

  if (on('perf')) {
    // the worst real case: a rainy party peak with the bus, the chase, the line, umbrellas, spray, a hail — tier 2, 4× CPU,
    // after a warm-up page; against the same scene without the street (absolute numbers move with the machine)
    { const Wm = await open({ when: '2026-10-23T23:00', wait: 3000, ready: false }); await Wm.close(); }
    const pace = async qs => {
      const X = await open({ when: '2026-10-23T23:00', qs, wait: 1500, ready: !qs.includes('no-street') });
      const c = await X.p.target().createCDPSession(); await c.send('Emulation.setCPUThrottlingRate', { rate: CPU });
      await ev(X.p, 'window.__district.setTier(2)'); await sleep(9000);
      const f = await ev(X.p, 'window.__district.frames()'); const s = [...f].sort((a, b) => a - b);
      const cs = await ev(X.p, 'window.__district.cost()'); const draw = cs.reduce((a, b) => a + b, 0) / Math.max(1, cs.length);
      const st = await ev(X.p, 'window.__district.street()');
      await X.close();
      return { p50: +s[Math.floor(s.length / 2)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), draw: +draw.toFixed(2), peds: st && st.people ? st.people.peds : 0, line: st && st.people ? st.people.line : 0, spray: st && st.road ? st.road.spray : 0 };
    };
    // (alternated, two of each: the first page measured after the warm-up still runs slow — order alone moved it ~20 ms)
    const runs = [];
    for (const q of ['wx=rain&force=partybus,no-street', 'wx=rain&force=partybus,chase,line,umbrellas,hail,spray', 'wx=rain&force=partybus,no-street', 'wx=rain&force=partybus,chase,line,umbrellas,hail,spray']) runs.push(await pace(q));
    const avg = (a, b) => ({ ...b, p50: +((a.p50 + b.p50) / 2).toFixed(1), p95: +((a.p95 + b.p95) / 2).toFixed(1), draw: +((a.draw + b.draw) / 2).toFixed(2) });
    const off = avg(runs[0], runs[2]), all = avg(runs[1], runs[3]);
    log('pacing', JSON.stringify({ off, all }));
    // (frame intervals are quantised to 16.7 ms ticks; the yardstick is the draw's own cost, averaged over ~90 frames)
    ok(all.draw <= off.draw * 1.25 + 1, `PERF at ${CPU}× CPU, the worst real case (${all.peds} people, a line of ${all.line}, ${all.spray} spray): drawing ${all.draw} ms a frame vs ${off.draw} without the street (frames ${all.p50}/${all.p95} vs ${off.p50}/${off.p95} ms)`);
  }
} catch (e) { errors.push(`crash: ${e && e.stack || e}`); log('CRASH', e && e.message); }

await browser.close();
log(`checks ${checks.filter(c => c.ok).length}/${checks.length} passed`);
log(errors.length ? `errors:\n  ${errors.join('\n  ')}` : 'errors none');
process.exit(errors.length ? 1 : 0);
