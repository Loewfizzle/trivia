// CITY A — item 29, THE LEAVING SQUEAL (the owner's iPhone, SOUND MUTED, no music: a short high-pitched noise switching from Safari to another
// app — the audio MACHINERY still live: the context running for THE PROBE / the beat analysers, the elements on their silent activation).
// In the browser (Chromium; Web Audio is the same graph WebKit runs):
//   THE GRAPH     every AudioNode.connect() recorded from the first line of the page: ONLY the master reaches ctx.destination (the probe's
//                 silent tap + the unlock blip go through it) — on a muted load AND on an unmuted one
//   MUTED         a load with SOUND muted → taps → the context SUSPENDED, no <audio> element playing, no silent activation loop, the master 0;
//                 the page hidden (leaving Safari) → still nothing running; back → nothing woken
//   UNMUTE        a TAP that unmutes (inside its gesture) → the context runs, the master ramps up FROM 0 (no pop), the music plays again
//   UNMUTED LEAVE the DFIX3 fade still: hidden → the master ramps to 0 on the audio clock → suspended after the fade
//   (+ MUSIC OFF and the effects off = the same hush)
//   node tests/integration/audio-hush.mjs "<chromium>"     (serve.mjs --emu + the emulators)
import { guardUrl } from './kit/live-guard.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const { default: puppeteer } = await import('./kit/puppeteer.mjs');
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };

const INIT = (slot, prefs) => {
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${slot}:profile`, JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); if (prefs) localStorage.setItem('na:settings', JSON.stringify(prefs)); } catch { /* fine */ }
  // every connect(): [from, to] — destination tagged
  const edges = []; window.__edges = edges;
  const C = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (to, ...a) { edges.push([this, to]); return C.call(this, to, ...a); };
  const els = []; window.__els = els;
  const A = window.Audio; window.Audio = function (...a) { const el = new A(...a); els.push(el); return el; }; window.Audio.prototype = A.prototype;
};

async function phone(slot, prefs = null) {
  const ctx = await browser.createBrowserContext();
  const p = await ctx.newPage();
  await p.evaluateOnNewDocument(INIT, slot, prefs);
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&idle=1&debug=1`, 'audio-hush.mjs'));
  await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 45000 });
  return { ctx, p };
}
const H = p => p.evaluate(() => import('/js/audio/engine.js').then(E => {
  const c = E.getContext(), m = E.getMaster(), dest = c && c.destination;
  const direct = (window.__edges || []).filter(([, to]) => to === dest).map(([f]) => (f === m ? 'master' : f.constructor.name));
  const playing = (window.__els || []).filter(e => !e.paused).map(e => (e.src || '').slice(0, 40));
  const looping = (window.__els || []).filter(e => !e.paused && (e.src || '').startsWith('blob:')).length;
  return { ...E.audioHealth(), direct: [...new Set(direct)], playing, looping, els: (window.__els || []).length, log: E.audioEvents().slice(-6).map(x => x.m) };
}));
const vis = (p, st) => p.evaluate(v => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v }); document.dispatchEvent(new Event('visibilitychange')); }, st);
const tapAt = async (p, x = 195, y = 600) => { await p.touchscreen.tap(x, y); };

try {
  // ---- MUTED: the owner's case — SOUND muted, no music
  { const { ctx, p } = await phone('ahm');
    // the device's choice: muted (through the app's own settings — never a test-only path)
    await p.evaluate(() => import('/js/audio/settings.js').then(S => S.updateSettings({ muted: true })));
    for (let i = 0; i < 3; i++) { await tapAt(p, 195, 560 + i * 10); await sleep(500); }
    await sleep(800);
    let h = await H(p);
    ok(h.unlocked && h.hushed && h.state === 'suspended' && h.playing.length === 0 && h.looping === 0, `MUTED + 3 taps: the context ${h.state} (hushed ${h.hushed}), ${h.playing.length} elements playing (${h.playing.join(', ') || 'none'}), ${h.looping} silent loops`);
    ok(h.direct.length <= 1 && h.direct.every(x => x === 'master'), `THE GRAPH (muted): only the master reaches the destination (${h.direct.join(', ') || 'nothing yet'})`);
    await vis(p, 'hidden'); await sleep(700);
    h = await H(p);
    ok(h.state !== 'running' && h.playing.length === 0, `MUTED + LEAVING: nothing runs while hidden (the context ${h.state}, ${h.playing.length} playing)`);
    await vis(p, 'visible'); await sleep(900);
    h = await H(p);
    ok(h.state !== 'running' && h.playing.length === 0, `MUTED + BACK: nothing woken (the context ${h.state}, ${h.playing.length} playing)`);
    // ---- UNMUTE in a tap: resumes + re-activates inside the gesture, the master ramps from 0
    // (the unmute runs INSIDE the gesture — synchronously in the tap's pointerup, as the ☰ menu's switch does in its click)
    await p.evaluate(() => Promise.all([import('/js/audio/settings.js'), import('/js/audio/engine.js')]).then(([S, E]) => { document.addEventListener('pointerup', () => { S.updateSettings({ muted: false }); const ramp = window.__ramp = []; const t0 = performance.now(); (function f() { const m = E.getMaster(), c = E.getContext(); ramp.push({ t: Math.round(performance.now() - t0), m: m ? +m.gain.value.toFixed(3) : null, s: c ? c.state : '' }); if (performance.now() - t0 < 700) requestAnimationFrame(f); })(); }, { once: true, capture: true }); }));
    await tapAt(p, 195, 600);
    await sleep(120);
    const early = null; void early;
    await sleep(1600);
    h = await H(p);
    ok(!h.hushed && h.state === 'running', `UNMUTE (a tap): the context ${h.state}, hushed ${h.hushed} (${h.log.join(' · ')})`);
    { const R = await p.evaluate('window.__ramp || []'), run = R.filter(x => x.s === 'running'), first = run[0], mono = run.every((x, i) => i === 0 || x.m >= run[i - 1].m - 0.001);
      ok(!!first && first.m < 0.6 && run[run.length - 1].m > 0.95 && mono, `UNMUTE: the master ramps up FROM 0 once the context runs — ${run.slice(0, 6).map(x => `${x.t} ms ${x.m}`).join(' → ')} … ${run.length ? run[run.length - 1].m : '?'} (rising: ${mono}; no pop)`); }
    ok(h.direct.every(x => x === 'master'), `THE GRAPH (unmuted, the probe + the voices built): only the master reaches the destination (${h.direct.join(', ')})`);
    // ---- UNMUTED LEAVE: the DFIX3 fade still clean
    await vis(p, 'hidden'); await sleep(60);
    const mid = await H(p);
    await sleep(700);
    h = await H(p);
    ok(h.log.some(m => /fade out/.test(m)) && h.state === 'suspended', `UNMUTED + LEAVING: the fade, then suspended (${mid.master} → ${h.state}; ${h.log.join(' · ')})`);
    await vis(p, 'visible'); await sleep(600);
    await ctx.close(); }
  // ---- MUSIC OFF + EFFECTS OFF = the same hush
  { const { ctx, p } = await phone('aho');
    await p.evaluate(() => import('/js/audio/settings.js').then(S => S.updateSettings({ musicOff: true, sfxOff: true })));
    for (let i = 0; i < 2; i++) { await tapAt(p, 195, 560 + i * 10); await sleep(500); }
    await sleep(800);
    const h = await H(p);
    ok(h.hushed && h.state === 'suspended' && h.playing.length === 0, `MUSIC OFF + EFFECTS OFF: hushed too (the context ${h.state}, ${h.playing.length} playing)`);
    await ctx.close(); }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }

console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
