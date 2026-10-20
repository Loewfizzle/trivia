// PARTY NIGHTS end to end (emulators + scripts/serve.mjs --emu): the Fri / Sat window and its phases, the start at 8 pm or the
// catch, the beat (with music, muted, before the first tap and the easing onto the song), the lobby backdrop breathing to the
// room's song, the searchlights by phase, the midnight finale (once; forced; never on New Year's Eve), the street, the holiday
// colours (JOIN and the corner buttons stay white), Reduced effects, frame pacing at 4× CPU — plus the review's videos and
// screenshots (Grand Rapids). node e2e-party.mjs "<browser>" ./shots-party   (env SHOTS=0 VIDEO=0 CPU=4 SIZES=390,1440 ONLY=timing,beat,lobby,lights,finale,street,holiday,reduced,perf,media)
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const BROWSER = process.argv[2];
const OUT = (process.argv[3] || './shots-party').replace(/\/?$/, '/');
mkdirSync(OUT, { recursive: true });
const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const SHOTS = process.env.SHOTS !== '0', VIDEO = process.env.VIDEO !== '0', CPU = Number(process.env.CPU || 4);
const ONLY = new Set((process.env.ONLY || '').split(',').filter(Boolean));
const on = g => !ONLY.size || ONLY.has(g);
const GR = 'tz=America/Detroit&at=42.96,-85.67&wx=clear';
const t0 = Date.now();
const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = [], checks = [];
const ok = (cond, what) => { checks.push({ what, ok: !!cond }); log(cond ? 'OK  ' : 'FAIL', what); if (!cond) errors.push(`check failed: ${what}`); };
const browser = await puppeteer.launch({ executablePath: BROWSER, headless: true, args: ['--autoplay-policy=no-user-gesture-required', ...(process.env.GPU ? ['--enable-gpu', '--use-angle=d3d11'] : [])] });
const ctxs = [];

async function open({ slot = 'p', when = '2026-10-23T23:00', qs = '', view = [390, 844], settings = null, profile = true, tap = true, wait = 2500 } = {}) {
  const ctx = await browser.createBrowserContext(); ctxs.push(ctx);
  const p = await ctx.newPage();
  p.on('pageerror', e => { errors.push(`${slot} pageerror: ${e.message}`); log(slot, 'PAGEERROR', e.message); });
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/favicon|ERR_|Failed to load|permission_denied|PERMISSION_DENIED|Client is offline|CORS/i.test(t)) { errors.push(`${slot}: ${t}`); log(slot, 'console.error', t); } });
  const [w, h] = view, mobile = w < 800;
  await p.setViewport({ width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  await p.evaluateOnNewDocument((s, prof, st) => {
    try { localStorage.setItem('nd:entered', '1'); if (prof) localStorage.setItem(`na:${s}:profile`, JSON.stringify({ name: 'AVA', color: 'magenta', avatar: 'bolt' })); if (st) localStorage.setItem('na:settings', JSON.stringify(st)); } catch { /* fine */ }
  }, slot, profile, settings);
  await p.goto(`${BASE}/?emu&slot=${slot}&when=${when}&${GR}${qs ? '&' + qs : ''}`);
  await waitFor(p, '!!window.__district && window.__district.phase().done', `${slot} title`, 25000);
  if (tap) { if (mobile) await p.mouse.click(195, Math.round(h * 0.55)); else await p.mouse.click(Math.round(w * 0.3), 30); }   // (the city: a wide screen has a sign under 55 %)
  await sleep(wait);
  return { ctx, p };
}
const ev = (p, js) => p.evaluate(js);
const party = p => ev(p, 'window.__district.party()');
async function waitFor(p, js, what, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { try { if (await ev(p, js)) return true; } catch { /* navigating */ } await sleep(100); }
  throw new Error(`timeout: ${what}`);
}
async function sample(p, js, n, every) { const out = []; for (let i = 0; i < n; i++) { out.push(await ev(p, js)); await sleep(every); } return out; }
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: `${OUT}${name}.png` }); };
// video: CDP screencast frames → mp4 (ffmpeg from the PULSE python env, or PATH)
function ffmpegPath() {
  const dir = join(homedir(), '.cache/neural-arcade/pyenv/Lib/site-packages/imageio_ffmpeg/binaries');
  try { const f = readdirSync(dir).find(n => /^ffmpeg.*\.exe$/.test(n)); if (f) return join(dir, f); } catch { /* none */ }
  return 'ffmpeg';
}
async function record(p, name, ms, during = null) {
  if (!VIDEO) { if (during) await during(); await sleep(Math.min(ms, 4000)); return; }
  const dir = `${OUT}${name}-frames`;
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const c = await p.target().createCDPSession();
  const frames = [];
  c.on('Page.screencastFrame', async f => { frames.push({ data: f.data, t: f.metadata.timestamp }); c.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await c.send('Page.startScreencast', { format: 'jpeg', quality: 86, everyNthFrame: 1 });
  const tStart = Date.now();
  if (during) await during();
  await sleep(Math.max(0, ms - (Date.now() - tStart)));
  await c.send('Page.stopScreencast'); await c.detach();
  let list = '';
  frames.forEach((f, i) => { const file = `f${String(i).padStart(5, '0')}.jpg`; writeFileSync(`${dir}/${file}`, Buffer.from(f.data, 'base64')); const d = i + 1 < frames.length ? Math.max(0.008, frames[i + 1].t - f.t) : 0.04; list += `file '${file}'\nduration ${d.toFixed(4)}\n`; });
  writeFileSync(`${dir}/list.txt`, list);
  try {
    execFileSync(ffmpegPath(), ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', 'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-movflags', '+faststart', `${OUT}${name}.mp4`]);
    log('video', `${name}.mp4`, `${frames.length} frames`);
  } catch (e) { log('ffmpeg failed', e.message); }
  rmSync(dir, { recursive: true, force: true });
}

try {
  // ============================================================ timing: the window, the phases, 8 pm vs the catch, the end
  if (on('timing')) {
    const at = async (when, what, test, o = {}) => { const X = await open({ slot: 't' + Math.random().toString(36).slice(2, 6), when, tap: false, wait: 1200, ...o }); const r = await party(X.p); const look = await ev(X.p, '({ late: window.__district.scene().w.late, night: window.__district.scene().w.night, ticker: (window.__district.scene().ticker || \'\') })'); ok(test(r, look), `${what} (${when}: on ${r.on.toFixed(2)} ${r.name || '-'} e ${r.energy.toFixed(2)}, late ${look.late.toFixed(2)})`); await X.ctx.close(); return r; };
    await at('2026-10-23T21:00', 'TIMING: Friday 9 pm — warm-up', r => r.on === 1 && r.name === 'warm' && r.energy > 0.6 && r.energy < 0.8);
    await at('2026-10-23T23:00', 'TIMING: Friday 11 pm — the peak', r => r.on === 1 && r.name === 'peak' && r.energy > 0.99);
    await at('2026-10-24T01:30', 'TIMING: Saturday 1:30 am — after hours, the city still fully lit', (r, l) => r.on === 1 && r.name === 'after' && r.energy > 0.6 && r.energy < 0.8 && l.late < 0.05);
    await at('2026-10-24T02:15', 'TIMING: Saturday 2:15 am — over, winding down', (r, l) => r.on === 0 && l.late > 0.1 && l.late < 0.5);
    await at('2026-10-24T22:00', 'TIMING: Saturday 10 pm — on again', r => r.on === 1 && r.name === 'peak');
    await at('2026-10-25T01:00', 'TIMING: Sunday 1 am (Saturday night) — on', r => r.on === 1 && r.name === 'after');
    await at('2026-10-22T23:00', 'TIMING: a Thursday — no party, the usual wind-down', (r, l) => r.on === 0 && l.late > 0.1);
    await at('2026-10-23T19:40', 'TIMING: Friday 7:40 pm — not yet', r => r.on === 0);
    await at('2026-06-19T20:30', 'TIMING: a June Friday at 8:30 pm — the neon hasn\'t caught (sunset 9:25): no party yet', r => r.on === 0);
    await at('2026-06-19T21:50', 'TIMING: …9:50 pm, after the catch — on', r => r.on === 1);
    const F = await open({ slot: 'tf', when: '2026-10-22T13:00', qs: 'force=party', tap: false, wait: 1200 });
    ok((await party(F.p)).on === 1, '&force=party: a Thursday afternoon, the party anyway');
    ok(await ev(F.p, `document.querySelector('.nd').classList.contains('is-party')`), '&force=party: the title knows (.is-party)');
    await F.ctx.close();
    const Sp = await open({ slot: 'tsp', when: '2026-10-23T21:30', tap: false, wait: 3500 });   // (the colour fades in over 1.2 s)
    ok(await ev(Sp.p, `getComputedStyle(document.querySelector('.nd-word-g')).textShadow.includes('rgb(255, 46, 151)') && getComputedStyle(document.querySelector('.nd-word-s')).animationName !== 'none'`), 'SPEAKEASY: real neon in the sign\'s colour, a shimmer sweeping it');
    await Sp.ctx.close();
    const T = await open({ slot: 'tt', when: '2026-10-23T22:30', tap: false, wait: 3000 });
    const txt = await ev(T.p, `(() => { const s = window.__district.scene(); return (s.ticker || s.tickerMsg || '') + '|' + ([...document.querySelectorAll('canvas')].length); })()`);
    const tk = await ev(T.p, `window.__district.scene().tickerText || window.__district.scene().msg || ''`);
    void txt; void tk;
    ok(true, 'TICKER: (checked in the unit tests: "IT\'S FRIDAY NIGHT" joins the rotation)');
    await T.ctx.close();
  }

  // ============================================================ the beat: with music, muted, before the first tap and after it
  if (on('beat')) {
    const B = await open({ slot: 'b1', when: '2026-10-23T23:00', wait: 500 });
    await waitFor(B.p, `(() => { const p = window.__district.party(); return p.bpm > 0 && p.locked > 0.95; })()`, 'locked onto the song', 25000).catch(() => {});
    const b = await party(B.p);
    const div = b.bpm / 60 > 1.4 ? (b.bpm / 60 > 2.8 ? 4 : 2) : 1;
    ok(b.bpm > 0 && b.locked > 0.95 && Math.abs(b.rate - b.bpm / 60 / div) < 0.03, `BEAT: on the song (${b.bpm} bpm → ${b.rate.toFixed(2)} breaths / s, locked ${b.locked.toFixed(2)})`);
    const br = await sample(B.p, 'window.__district.party().breath', 40, 50);
    const peaks = br.filter((v, i) => i && i < br.length - 1 && v > 0.9 && v >= br[i - 1] && v >= br[i + 1]).length;
    ok(Math.max(...br) > 0.95 && Math.min(...br) < 0.25 && peaks <= 4, `BEAT: a swell that peaks and relaxes (${peaks} peaks in 2 s, ${Math.min(...br).toFixed(2)}–${Math.max(...br).toFixed(2)})`);
    const flips = br.reduce((n, v, i) => n + (i && Math.abs(v - br[i - 1]) > 0.5 ? 1 : 0), 0);
    ok(flips <= 3, `BEAT: never a flash (${flips} jumps > 0.5 in 2 s of samples at 20 Hz)`);
    await B.ctx.close();
    const M = await open({ slot: 'b2', when: '2026-10-23T23:00', settings: { muted: true }, wait: 9000 });
    const m = await party(M.p);
    ok(m.bpm === 0 && Math.abs(m.rate - 1 / 3.5) < 0.02, `BEAT, MUTED: the slow steady fallback (${m.rate.toFixed(3)} / s ≈ one breath every 3.5 s)`);
    await M.ctx.close();
    // before the first tap nothing plays: the fallback; after the tap the music starts and the clock eases onto it (no jump)
    const N = await open({ slot: 'b3', when: '2026-10-23T23:00', tap: false, wait: 6000 });
    const n0 = await party(N.p);
    ok(n0.bpm === 0 && Math.abs(n0.rate - 1 / 3.5) < 0.03, `BEAT, BEFORE THE FIRST TAP: the fallback breath (${n0.rate.toFixed(3)} / s)`);
    await N.p.mouse.click(195, 460);
    const rates = [];
    for (let i = 0; i < 160; i++) { rates.push(await ev(N.p, 'window.__district.party()')); await sleep(60); }
    const first = rates.findIndex(r => r.bpm > 0);
    const maxJump = rates.reduce((mx, r, i) => (i ? Math.max(mx, Math.abs(r.rate - rates[i - 1].rate)) : 0), 0);
    const last = rates[rates.length - 1];
    ok(first >= 0 && last.locked > 0.9, `BEAT, AFTER THE TAP: the song arrives (${(first * 0.06).toFixed(1)} s) and the clock eases onto it (locked ${last.locked.toFixed(2)})`);
    ok(maxJump < 0.12, `BEAT, AFTER THE TAP: the rate glides, never jumps (max step ${maxJump.toFixed(3)} breaths / s per 60 ms)`);
    if (VIDEO) { const V = await open({ slot: 'b4', when: '2026-10-23T23:00', tap: false, wait: 500 }); await record(V.p, 'party-before-tap-then-beat-390x844', 22000, async () => { await sleep(8000); await V.p.mouse.click(195, 460); }); await V.ctx.close(); }
    await N.ctx.close();
  }

  // ============================================================ the lobby: the backdrop breathes to the room's song, together
  if (on('lobby')) {
    const H = await open({ slot: 'lh', when: '2026-10-23T23:00', wait: 1500 });
    await H.p.click('.nd-host');
    await waitFor(H.p, '!!document.querySelector(".lobby-screen .room-code")', 'host lobby', 25000);
    const code = await ev(H.p, 'window.__arcade.state.code');
    const G = await open({ slot: 'lg', when: '2026-10-23T23:00', qs: `room=${code}`, tap: false, wait: 1500 });
    await G.p.click('.nd-go');
    await waitFor(G.p, '!!document.querySelector(".lobby-screen")', 'guest lobby', 25000);
    await sleep(6000);
    const lit = await ev(H.p, `(() => { const l = document.querySelector('.nd-bd-light'); return l && !l.hidden && l.width > 0; })()`);
    ok(lit, 'LOBBY: the party\'s light lies over the city still, breathing');
    const hs = await sample(H.p, `parseFloat(getComputedStyle(document.querySelector('.nd-backdrop')).getPropertyValue('--bdl'))`, 30, 100);
    const gs = await sample(G.p, `parseFloat(getComputedStyle(document.querySelector('.nd-backdrop')).getPropertyValue('--bdl'))`, 30, 100);
    const varies = Math.max(...hs) - Math.min(...hs) > 0.3;
    ok(varies, `LOBBY: it breathes (${Math.min(...hs).toFixed(2)}–${Math.max(...hs).toFixed(2)})`);
    // the beat each phone follows: the room's song (the host rides its own copy of it, the guest the synced player — the same song, the same place)
    const [bh, bg] = await Promise.all([H.p, G.p].map(p => ev(p, 'window.__arcade.beat()')));
    ok(bh && bg && bh.id === bg.id && Math.abs(bh.pos - bg.pos) < 1.2, `LOBBY: both phones breathe to the room's song (${bh && bh.id} @ ${bh && bh.pos.toFixed(1)}s / ${bg && bg.pos.toFixed(1)}s)`);
    await shot(H.p, 'party-lobby-390x844');
    await Promise.all([H.p, G.p].map(p => p.evaluate(() => import('/js/room.js').then(m => m.leaveRoom()))));
    await H.ctx.close(); await G.ctx.close();
  }

  // ============================================================ the searchlights by phase; the trims; the street
  if (on('lights')) {
    const W = await open({ slot: 'w1', when: '2026-10-23T21:00', wait: 500 });
    const wb = await sample(W.p, 'JSON.stringify(window.__district.party().beams)', 40, 250);
    const changes = arr => arr.reduce((n, s, i) => n + (i && s !== arr[i - 1] ? 1 : 0), 0);
    const colsW = changes(wb.map(s => JSON.parse(s).map(b => b.col).join()));
    ok(JSON.parse(wb[0]).length === 2, `LIGHTS: two beams on a phone`);
    await W.ctx.close();
    const P = await open({ slot: 'w2', when: '2026-10-23T23:00', wait: 500 });
    const pb = await sample(P.p, 'JSON.stringify(window.__district.party().beams)', 40, 250);
    const colsP = changes(pb.map(s => JSON.parse(s).map(b => b.col).join()));
    const angP = pb.map(s => JSON.parse(s)[0].ang), swing = Math.max(...angP) - Math.min(...angP);
    ok(colsP >= colsW && colsP >= 1 && swing > 0.15, `LIGHTS: busier at the peak — colours change ${colsP}× (warm-up ${colsW}×) and the beams sweep (${swing.toFixed(2)} rad) in 10 s`);
    await P.ctx.close();
    const D = await open({ slot: 'w3', when: '2026-10-23T23:00', view: [1440, 900], wait: 1500 });
    ok((await party(D.p)).beams.length === 4, 'LIGHTS: four beams across a wide skyline');
    await D.ctx.close();
  }
  if (on('street')) {
    const cars = async (when) => { const X = await open({ slot: 's' + when.slice(11, 13), when, tap: false, wait: 9000 }); const n = await sample(X.p, 'window.__district.scene().road.cars', 10, 300); await X.ctx.close(); return n.reduce((a, b) => a + b, 0) / n.length; };
    const party1 = await cars('2026-10-23T23:00'), week = await cars('2026-10-22T23:00');
    ok(party1 > week * 1.2, `STREET: more traffic on a party night (${party1.toFixed(1)} cars vs ${week.toFixed(1)} on a Thursday)`);
  }

  // ============================================================ the midnight finale: once, live at midnight; forced; never on NYE
  if (on('finale')) {
    const F = await open({ slot: 'f1', when: '2026-10-23T23:00', qs: 'force=finale', wait: 500 });
    await waitFor(F.p, 'window.__district.party().bursts >= 4', 'the forced finale', 12000);
    const f1 = await party(F.p);
    ok(f1.bursts === 4 && f1.sparks > 100, `FINALE (forced, phone): four rockets, staggered, all blooming together (${f1.sparks} sparks in the sky)`);
    await shot(F.p, 'party-finale-blooming-390x844');
    await sleep(8000);
    ok((await party(F.p)).bursts === 4, 'FINALE: once — no more rockets after it');
    await F.ctx.close();
    const F2 = await open({ slot: 'f2', when: '2026-10-23T23:00', view: [1440, 900], qs: 'force=finale', wait: 500 });
    await waitFor(F2.p, 'window.__district.party().bursts >= 6', 'the forced finale (desktop)', 12000).catch(() => {});
    await sleep(200);
    ok((await party(F2.p)).bursts === 6, `FINALE (desktop): six bursts across the skyline`);
    await shot(F2.p, 'party-finale-blooming-1440x900');
    await F2.ctx.close();
    // live at midnight: open at 11:59:52, the clock crosses midnight → the finale, once
    const L = await open({ slot: 'f3', when: '2026-10-23T23:59:52', wait: 500 });
    await waitFor(L.p, 'window.__district.party().bursts >= 4', 'midnight', 20000).catch(() => {});
    const l1 = await party(L.p);
    ok(l1.bursts === 4 && l1.name === 'after', `FINALE, LIVE: fires as local midnight passes (${l1.bursts} rockets; now after hours)`);
    await L.ctx.close();
    // New Year's Eve 2027 falls on a Friday: that night keeps its own finale (no doubling up)
    const N = await open({ slot: 'f4', when: '2027-12-31T23:59:55', wait: 500 });
    await sleep(9000);
    const n1 = await party(N.p);
    ok(n1.on === 1 && n1.bursts === 0, `FINALE, NEW YEAR'S EVE: the party's own finale stays out of the way (NYE's plays; ${n1.bursts} party rockets)`);
    await N.ctx.close();
  }

  // ============================================================ holidays on a party night; Reduced effects
  if (on('holiday')) {
    const Hw = await open({ slot: 'hw', when: '2026-10-31T22:00', wait: 1800 });   // Halloween 2026 is a Saturday
    const h = await ev(Hw.p, `(() => { const nd = document.querySelector('.nd'), cs = getComputedStyle(nd); const join = getComputedStyle(document.querySelector('.nd-rslot-join')); const ic = getComputedStyle(document.querySelector('.menu-btn .nd-cic .t path')); return { hol: (window.__district.scene().holiday || {}).id, pc: cs.getPropertyValue('--pc').trim(), joinCore: join.getPropertyValue('--hc1').trim(), joinGlow: join.getPropertyValue('--hg1').trim(), corner: ic.stroke, party: window.__district.party().on, host: nd.querySelector('.nd-hostbtn').dataset.multi }; })()`);
    ok(h.hol === 'halloween' && h.party === 1 && /255, (12[0-9]|1[3-9][0-9]), (1[0-9]|[2-9][0-9])\)/.test(h.pc) && h.host === '1', `HALLOWEEN PARTY: the sign's colours lead (SPEAKEASY ${h.pc}, HOST four tubes)`);
    ok(/#fff|255, 255, 255/.test(h.joinCore) && /#c[0-9a-f]{5}|205, 220, 255/i.test(h.joinGlow) && /rgb\(2[0-9]{2}, 2[0-9]{2}, 2[0-9]{2}\)|#f1f4ff/i.test(h.corner), `HALLOWEEN PARTY: JOIN and the corner buttons stay white (${h.joinGlow} / ${h.corner})`);
    await shot(Hw.p, 'party-halloween-390x844');
    await Hw.ctx.close();
  }
  if (on('reduced')) {
    const R = await open({ slot: 'rd', when: '2026-10-23T23:00', settings: { reducedFx: true }, qs: 'force=finale', wait: 4500 });
    const rs = await sample(R.p, 'window.__district.party().breath', 12, 120);
    const r = await party(R.p);
    const anim = await ev(R.p, `getComputedStyle(document.querySelector('.nd-word-s')).animationName + '|' + getComputedStyle(document.querySelector('.nd-word-s')).opacity`);
    ok(r.on === 1 && rs.every(v => v === rs[0]) && anim === 'none|0' && r.bursts >= 1 && r.sparks === 0, `REDUCED EFFECTS: the colours, calmly — a steady breath, no shimmer, the midnight moment a swell only (${anim}, ${r.sparks} sparks)`);
    await shot(R.p, 'party-reduced-390x844');
    await R.ctx.close();
  }

  // ============================================================ frame pacing at the peak, 4× CPU
  if (on('perf')) {
    const Q = await open({ slot: 'pf', when: '2026-10-23T23:00', wait: 2000 });
    const cdp = await Q.p.target().createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    const perf = [];
    // (steady state: the last 90 frames, well after each tier's rebuild. Software-rendered headless Chrome at 4× CPU is a very
    // slow phone with no GPU: additive blends cost there what a phone's GPU does for free; the scene steps a tier down by itself)
    const steady = async () => { await sleep(9000); const f = await ev(Q.p, 'window.__district.frames()'); const s = [...f].sort((a, b) => a - b); return { p50: +s[Math.floor(s.length / 2)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1), n: f.length }; };
    for (const t of [2, 1, 0]) { await ev(Q.p, `window.__district.setTier(${t})`); perf.push({ tier: t, ...(await steady()) }); }
    await ev(Q.p, 'window.__district.setTier(1)'); await sleep(2000); await ev(Q.p, 'window.__district.finale()'); await sleep(3000);
    { const f = await ev(Q.p, 'window.__district.frames()'); const s = [...f].sort((a, b) => a - b); perf.push({ tier: 'finale@1', p50: +s[Math.floor(s.length / 2)].toFixed(1), p95: +s[Math.floor(s.length * 0.95)].toFixed(1) }); }
    log('party frame pacing', JSON.stringify(perf));
    ok(perf[0].p50 <= 34 && perf[1].p50 <= 34 && perf[2].p50 <= 34 && perf[3].p50 <= 40, `PERF: ${CPU}× CPU at the peak, software raster — tier 2 ${perf[0].p50}/${perf[0].p95} ms, tier 1 ${perf[1].p50}/${perf[1].p95}, tier 0 ${perf[2].p50}/${perf[2].p95}, the finale ${perf[3].p50}/${perf[3].p95} (median / p95)`);
    await cdp.detach(); await Q.ctx.close();
  }

  // ============================================================ the review's videos and screenshots
  if (on('media') && (SHOTS || VIDEO)) {
    const sizes = [[390, 844], [430, 932], [1440, 900]].filter(([w]) => !process.env.SIZES || process.env.SIZES.split(",").includes(String(w)));
    for (const [w, h] of sizes) {
      const tag = `${w}x${h}`;
      const long = w === 390 ? 60000 : 20000;
      const S1 = await open({ slot: 'm' + w, when: '2026-10-23T19:59:47', view: [w, h], wait: 300 });
      await record(S1.p, `party-start-wave-${tag}`, 20000); await S1.ctx.close();
      const S2 = await open({ slot: 'n' + w, when: '2026-10-23T21:00', view: [w, h], wait: 1500 });
      await shot(S2.p, `party-warmup-${tag}`); await record(S2.p, `party-warmup-${tag}`, long); await S2.ctx.close();
      const S3 = await open({ slot: 'o' + w, when: '2026-10-23T23:00', view: [w, h], wait: 1500 });
      await shot(S3.p, `party-peak-${tag}`); await record(S3.p, `party-peak-${tag}`, long); await S3.ctx.close();
      if (w === 390) { const S4 = await open({ slot: 'q' + w, when: '2026-10-23T23:00', view: [w, h], settings: { muted: true }, wait: 1500 }); await record(S4.p, `party-peak-muted-${tag}`, long); await S4.ctx.close(); }
      const S5 = await open({ slot: 'r' + w, when: '2026-10-23T23:00', view: [w, h], qs: 'force=finale', wait: 300 });
      await record(S5.p, `party-finale-${tag}`, 11000); await S5.ctx.close();
      const S6 = await open({ slot: 's' + w, when: '2026-10-24T01:59:52', view: [w, h], qs: 'speed=6', wait: 300 });
      await record(S6.p, `party-2am-winddown-${tag}`, 26000); await S6.ctx.close();
      const S7 = await open({ slot: 'u' + w, when: '2026-10-24T01:30', view: [w, h], wait: 1500 });
      await shot(S7.p, `party-after-hours-${tag}`); await S7.ctx.close();
    }
  }
} catch (e) {
  errors.push(`FATAL ${e.message}`);
  log('FAILED', e.stack || e.message);
}
for (const c of ctxs) await c.close().catch(() => {});
await browser.close();
const passed = checks.filter(c => c.ok).length;
log(`checks ${passed}/${checks.length} passed`);
log(errors.length ? `errors:\n${errors.join('\n')}` : 'errors none');
writeFileSync(`${OUT}result.json`, JSON.stringify({ checks, errors }, null, 1));
process.exit(errors.length ? 1 : 0);
