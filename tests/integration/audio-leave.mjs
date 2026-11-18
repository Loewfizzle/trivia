// CITY D — 2, THE LEAVING SQUEAL WITH EFFECTS ON (the owner's iPhone: music off, effects ON, leaving Safari → the glitch again; CITY A fixed only
// muted / everything off). In Chromium as an iPhone-sized touch phone (Playwright's WebKit build on Windows has NO Web Audio — AudioContext is
// undefined there, so Safari's engine can't play a sound on this machine; the graph + the engine's code are the same), three settings:
//   effects on + music off · music on + effects off · both on
// each: a tap (the audio unlocked), a BED running (the neon hum's loop — engine.js#holdBed) + an effect playing, then LEAVING the way iOS does it
// (blur → pagehide → hidden). Recorded from the first line of the page: every scheduled source's start / stop (+ its loop + its end), every
// <audio> element, and AT THE SUSPEND: the master's gain + every source still live (started, not stopped, not past its end) + every element
// still playing. FAILS when anything is live at the suspend, the master isn't 0 there, or the AUDIO log (&debug=1) lacks "the master 0 at once".
// Back on screen: the context runs again, the master ramps up from 0.
//   node tests/integration/audio-leave.mjs "<chromium>"        (scripts/serve.mjs --emu + the emulators)
import { guardUrl } from './kit/live-guard.mjs';
import puppeteer from './kit/puppeteer.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };

function INIT(slot, prefs) {
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${slot}:profile`, JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); localStorage.setItem('na:settings', JSON.stringify(prefs)); } catch { /* fine */ }
  const srcs = []; window.__srcs = srcs;
  // (WebKit has no AudioScheduledSourceNode global: each source type's own start / stop)
  for (const K of [window.AudioBufferSourceNode, window.OscillatorNode, window.ConstantSourceNode].filter(Boolean)) {
  const S = K.prototype, start = S.start, stop = S.stop;
  S.start = function (when = 0, off = 0, dur) {
    const c = this.context, w = Math.max(c.currentTime, when || 0);
    let end = Infinity;
    if (this instanceof AudioBufferSourceNode && this.buffer && !this.loop) end = w + (dur != null ? dur : (this.buffer.duration - (off || 0)) / Math.max(0.01, this.playbackRate.value));
    const r = { n: this, end, stopAt: Infinity, kind: this.constructor.name, loop: !!this.loop };
    srcs.push(r); this.addEventListener('ended', () => { r.ended = true; });
    return this instanceof AudioBufferSourceNode ? start.call(this, when, off, ...(dur != null ? [dur] : [])) : start.call(this, when);
  };
  S.stop = function (when = 0) { const r = srcs.find(x => x.n === this); if (r) r.stopAt = Math.min(r.stopAt, Math.max(this.context.currentTime, when || 0)); return stop.call(this, when); };
  }
  const els = []; window.__els = els;
  const A = window.Audio; window.Audio = function (...a) { const el = new A(...a); els.push(el); return el; }; window.Audio.prototype = A.prototype;
  window.__atSuspend = [];
  const sus = AudioContext.prototype.suspend;
  AudioContext.prototype.suspend = function () {
    const t = this.currentTime;
    const alive = srcs.filter(r => r.n.context === this && !r.ended && r.stopAt > t + 0.005 && (r.loop || r.n.loop || r.end > t + 0.005));
    const loops = alive.filter(r => r.n.loop || r.kind !== 'AudioBufferSourceNode').map(r => r.kind + (r.n.loop ? ' (loop)' : ''));
    let peak = null; try { if (window.__an) { const d = new Float32Array(window.__an.fftSize); window.__an.getFloatTimeDomainData(d); peak = 0; for (const v of d) peak = Math.max(peak, Math.abs(v)); } } catch { /* fine */ }
    const live = alive.map(r => `${r.kind}${r.n.loop ? ' (loop)' : ''}${r.n.buffer ? ` ${r.n.buffer.duration.toFixed(1)} s${r.end < Infinity ? ` ends in ${(r.end - t).toFixed(1)}` : ''}` : ''}`);
    const m = window.__master ? window.__master() : null;
    window.__atSuspend.push({ t: +t.toFixed(3), master: m == null ? null : +m.toFixed(4), live, loops, peak, playing: els.filter(e => !e.paused && !String(e.src).startsWith('blob:')).length });
    return sus.call(this);
  };
}

const CASES = [
  ['effects on + music off', { musicOff: true }],
  ['music on + effects off', { sfxOff: true }],
  ['both on', {}],
];
try {
  for (const [name, prefs] of CASES) {
    const ctx = await browser.createBrowserContext();
    const slot = `wa${CASES.findIndex(c => c[0] === name)}`;
    const p = await ctx.newPage();
    await p.evaluateOnNewDocument(INIT, slot, prefs);
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    p.on('pageerror', e => console.log(`[${name}] PAGEERROR`, e.message));
    await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&idle=1&debug=1`, 'wk-audio-leave.mjs'));
    await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 60000 });
    await p.evaluate(() => import('/js/audio/engine.js').then(E => { window.__master = () => { const m = E.getMaster(); return m ? m.gain.value : null; }; }));
    for (let i = 0; i < 3; i++) { await p.touchscreen.tap(195, 560 + i * 12); await sleep(450); }
    await sleep(1200);
    // (THE OUTPUT: an analyser on the master's output — what reaches the speaker; an analyser pulls itself, it needs no path to the destination)
    await p.evaluate(() => import('/js/audio/engine.js').then(E => { const c = E.getContext(), m = E.getMaster(); if (c && m) { const an = c.createAnalyser(); an.fftSize = 2048; m.connect(an); window.__an = an; } }));
    // a BED (the neon hum's loop, held 30 s) + an effect, then the leave — blur first (a touch phone), then pagehide + hidden, as iOS sends them
    const before = await p.evaluate(async () => {
      const [E, A, X] = await Promise.all([import('/js/audio/engine.js'), import('/js/audio/ambience.js'), import('/js/audio/sfx.js')]);
      A.neonHumFade({ hold: 30, fade: 30 }); X.sfx('select');
      // (CITY H2 — MUSIC OFF = ONLY THE MUSIC OFF: the beds run as with the music on; + a 3-s one-off effect — the leave lands mid-sound)
      const EOn = (await import('/js/audio/settings.js')).settings.musicOff;
      if (EOn) { const c = E.getContext(), b = c.createBuffer(1, c.sampleRate * 3, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.sin(i / 9) * 0.05; const o = c.createBufferSource(), g = c.createGain(); o.buffer = b; o.connect(g).connect(E.getSfxBus()); o.start(); }   // (a 3-s one-shot effect: the leave lands mid-sound)
      await new Promise(r => setTimeout(r, EOn ? 400 : 900));
      let peak = 0; if (window.__an) { const d = new Float32Array(window.__an.fftSize); window.__an.getFloatTimeDomainData(d); for (const v of d) peak = Math.max(peak, Math.abs(v)); }
      return { state: E.getContext() && E.getContext().state, beds: E.bedCount(), bedsOn: E.audioHealth().bedsOn, master: window.__master(), peak: +peak.toFixed(4) };
    });
    await p.evaluate(() => {
      window.dispatchEvent(new Event('blur'));
      setTimeout(() => {
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      }, 60);
    });
    await sleep(900);
    const at = await p.evaluate(() => import('/js/audio/engine.js').then(E => ({ s: window.__atSuspend.slice(), state: E.getContext() && E.getContext().state, log: E.audioEvents().slice(-8).map(x => x.m) })));
    const sus = at.s[at.s.length - 1];
    console.log(`  · ${name}: before the leave — the context ${before.state}, ${before.beds} bed(s), master ${before.master}; the log: ${at.log.join(' · ')}`);
    ok(before.state === 'running' && (prefs.sfxOff ? true : before.beds >= 1 && before.bedsOn >= 1) && before.peak > 0, `${name}: the audio running + SOUNDING before the leave (${before.state}, ${before.beds} bed(s), ${before.bedsOn} on, the output's peak ${before.peak})`);
    // (CITY G: with the music off — the 'ambient' session — the earliest signal is THE HARD CUT: "the master 0 + the beds in one step")
    ok(at.log.some(m => /the master 0 at once|the master 0 \+ the beds in one step/.test(m)), `${name}: the AUDIO log — "the master 0 at once" (ambient: the hard cut) on the earliest signal (${at.log.filter(m => /blur|fade out|suspended/.test(m)).join(' · ')})`);
    ok(!!sus && at.state === 'suspended', `${name}: suspended after the leave (${at.state})`);
    ok(!!sus && sus.master === 0, `${name}: the master is 0 AT the suspend (${sus ? sus.master : '?'})`);
    ok(!!sus && sus.loops.length === 0 && sus.playing === 0, `${name}: NO bed / loop and no <audio> element running at the suspend (${sus ? `${sus.loops.length} loops${sus.loops.length ? `: ${sus.loops.join(', ')}` : ''} · ${sus.playing} elements playing` : 'no suspend seen'})`);
    ok(!!sus && sus.peak === 0, `${name}: THE OUTPUT is SILENT at the suspend — the peak after the master ${sus ? sus.peak : '?'} (${sus ? sus.live.length : 0} one-shots still scheduled under it — the city's long takes / the synced song keep their place on the clock: ${sus ? sus.live.join(', ') || 'none' : ''})`);
    // back on screen: runs again, the master up from 0
    await p.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));
    });
    await p.touchscreen.tap(195, 600);
    await sleep(1200);
    const back = await p.evaluate(() => import('/js/audio/engine.js').then(E => ({ state: E.getContext() && E.getContext().state, h: E.audioHealth().state, master: window.__master(), log: E.audioEvents().slice(-4).map(x => x.m) })));
    ok(back.state === 'running' && back.master > 0.9, `${name}: back on screen — the context ${back.h}, the master ${back.master && back.master.toFixed(2)} (${back.log.join(' · ')})`);
    await ctx.close();
  }
  // CITY H2 (the 4:03 pm entry) — MUSIC OFF AT LOAD: the FIRST tap on the city unlocks + resumes the audio; an effect then SOUNDS (the effects
  // bus live, the context running) — H1's sleeping engine left the effects dead until the button was cycled
  {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.evaluateOnNewDocument(INIT, 'wam', { musicOff: true });
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(guardUrl(`${BASE}/?emu&slot=wam&city=2&idle=1&debug=1`, 'wk-audio-leave.mjs'));
    await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 60000 });
    await p.touchscreen.tap(195, 560);
    await sleep(900);
    const r = await p.evaluate(async () => {
      const [E, X] = await Promise.all([import('/js/audio/engine.js'), import('/js/audio/sfx.js')]);
      const c = E.getContext(), m = E.getMaster(), an = c.createAnalyser(); an.fftSize = 2048; m.connect(an);
      X.sfx('select');
      let peak = 0; const d = new Float32Array(an.fftSize);
      for (let k = 0; k < 12; k++) { await new Promise(r => setTimeout(r, 25)); an.getFloatTimeDomainData(d); for (const v of d) peak = Math.max(peak, Math.abs(v)); }
      return { state: c.state, fx: E.getSfxBus().gain.value, master: m.gain.value, peak: +peak.toFixed(4), bedsOn: E.audioHealth().bedsOn, session: E.audioHealth().session };
    });
    ok(r.state === 'running' && r.fx > 0.05 && r.master > 0.9 && r.peak > 0.001, `MUSIC OFF AT LOAD → one tap → an effect SOUNDS (ctx ${r.state}, the effects bus ${r.fx.toFixed(2)}, master ${r.master.toFixed(2)}, the output's peak ${r.peak}, session ${r.session})`);
    await ctx.close();
  }
  // A BLUR THAT COMES BACK (the share sheet — still on screen): silent for a moment, then everything back, never suspended
  {
    const ctx = await browser.createBrowserContext();
    const p = await ctx.newPage();
    await p.evaluateOnNewDocument(INIT, 'wab', {});
    await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await p.goto(guardUrl(`${BASE}/?emu&slot=wab&city=2&idle=1&debug=1`, 'wk-audio-leave.mjs'));
    await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 60000 });
    await p.evaluate(() => import('/js/audio/engine.js').then(E => { window.__master = () => { const m = E.getMaster(); return m ? m.gain.value : null; }; }));
    for (let i = 0; i < 3; i++) { await p.touchscreen.tap(195, 560 + i * 12); await sleep(450); }
    await sleep(1000);
    await p.evaluate(() => window.dispatchEvent(new Event('blur')));
    await sleep(120);
    const mid = await p.evaluate(() => window.__master());
    await sleep(900);
    const after = await p.evaluate(() => import('/js/audio/engine.js').then(E => ({ state: E.getContext().state, master: window.__master(), sus: window.__atSuspend.length })));
    ok(mid === 0 && after.state === 'running' && after.master > 0.9 && after.sus === 0, `A BLUR, STILL ON SCREEN: silent at once (${mid}), back after ~400 ms (the master ${after.master && after.master.toFixed(2)}, ${after.state}, ${after.sus} suspends)`);
    await ctx.close();
  }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
