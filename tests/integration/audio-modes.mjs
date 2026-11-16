// FIXES R3 — THE LEAVE MODES on the real graph (Chromium as a 390-pt touch phone, the real city on the emulators; Playwright's WebKit on
// Windows has no Web Audio — this proves the GRAPH Safari renders, never iOS's own output buffer: that is the owner's ear + the AUDIO LEAVE row).
// The owner's setting: the music OFF, the effects ON. For each mode (A IDLE SILENCE · B CLOSE AT ONCE · C1 / C2 the session at boot):
//   1. AT AN IDLE CITY MOMENT (no effect for a few seconds): what is ACTUALLY running — the context's state, every music element not paused,
//      the city's loops, the beds (the evidence: before R3 the music's element played on through a 0 bus with the music off)
//   2. AN EFFECT: it sounds (mode A: the sleeping context woken by it, the effect rendered)
//   3. THE LEAVE (blur → pagehide → hidden) with the effects sounding: the leave record in localStorage IN the blur's own turn; the output's
//      tail before the suspend / the close (recorded sample by sample on the master)
//   4. THE RETURN: the AUDIO LEAVE row built (its mode named, the signals in order) — and the sound back
//   node tests/integration/audio-modes.mjs "<chromium>"     (scripts/serve.mjs --emu + the emulators; ONLY=A,B to pick)
import { guardUrl } from './kit/live-guard.mjs';
import puppeteer from './kit/puppeteer.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const browser = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const db = v => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : '−∞') + ' dBFS';

function INIT(slot, mode) {
  try {
    localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${slot}:profile`, JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' }));
    localStorage.setItem('na:settings', JSON.stringify({ musicOff: true })); localStorage.setItem('ns:leavemode', mode); localStorage.removeItem('ns:audioleave');
  } catch { /* fine */ }
  window.__sus = []; window.__closes = [];
  const sus = AudioContext.prototype.suspend, cl = AudioContext.prototype.close;
  AudioContext.prototype.suspend = function () { window.__sus.push({ t: this.currentTime, at: performance.now() }); return sus.call(this); };
  AudioContext.prototype.close = function () { window.__closes.push({ t: this.currentTime, at: performance.now() }); return cl.call(this); };
}
// the recorder on the master (a ScriptProcessor into a zero gain → the destination) — every rendered sample, |max| of the channels
const ATTACH = () => import('/js/audio/engine.js').then(E => {
  const c = E.getContext(), m = E.getMaster();
  const rec = { d: [], sr: c.sampleRate };
  const sp = c.createScriptProcessor(256, 2, 1), z = c.createGain(); z.gain.value = 0;
  sp.onaudioprocess = e => { const a = e.inputBuffer.getChannelData(0), b = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : a; const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = Math.max(Math.abs(a[i]), Math.abs(b[i])); rec.d.push({ t: e.playbackTime, d: o }); };
  m.connect(sp); sp.connect(z); z.connect(c.destination);
  window.__rec = rec;
  return true;
});
const VIS = v => {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'visible' : 'hidden') });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => !v });
  document.dispatchEvent(new Event('visibilitychange'));
};

async function run(mode) {
  const bctx = await browser.createBrowserContext();
  const slot = `am${mode.toLowerCase()}`;
  const p = await bctx.newPage();
  await p.evaluateOnNewDocument(INIT, slot, mode);
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  p.on('pageerror', e => { console.log(`[${mode}] PAGEERROR`, e.message); fails.push(`${mode}: page error ${e.message}`); });
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&idle=1&debug=1`, 'audio-modes.mjs'));
  await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 60000 });
  for (let i = 0; i < 3; i++) { await p.touchscreen.tap(195, 560 + i * 12); await sleep(400); }
  // 1. AN IDLE CITY MOMENT: nothing played for a while — what runs?
  await sleep(4500);
  const idle = await p.evaluate(() => import('/js/audio/engine.js').then(E => ({ h: E.audioHealth(), s: window.__audioLeave.sounding() })));
  console.log(`  · ${mode} at an idle moment (music off, effects on): ${Object.entries(idle.s).map(([k, v]) => `${k} ${v}`).join(' · ')} · mode ${idle.h.mode}`);
  ok(idle.h.mode === mode, `${mode}: the switch's mode read at boot (${idle.h.mode})`);
  if (mode === 'A') {
    ok(idle.h.resting && /none playing/.test(idle.s.media) && idle.s.songs === 'none' && idle.s.city === 'no loops', `A: with the music off NOTHING CONTINUOUS runs — no music element (${idle.s.media}), no station song (${idle.s.songs}), no city bed (${idle.s.city})`);
    // (the city's own one-shots come every ~0.7 s, so the city is rarely silent for IDLE_MS: with them quiet — the effects slider near 0 —
    //  the context goes to sleep; the next effect wakes it)
    const asleep = await p.evaluate(() => Promise.all([import('/js/audio/engine.js'), import('/js/audio/settings.js')]).then(([E, S]) => { S.updateSettings({ sfx: 0.005 }); return new Promise(res => setTimeout(() => res(E.audioHealth()), 2600)); }));
    ok(asleep.state === 'suspended' && asleep.idle, `A: silent for ${1500} ms → the context ASLEEP (${asleep.state}, idle ${asleep.idle})`);
    await p.evaluate(() => import('/js/audio/settings.js').then(S => S.updateSettings({ sfx: 0.7 })));
  } else ok(idle.s.ctx === 'running' && idle.s.songs !== 'none', `${mode}: as before R3, with the music OFF the context runs AND a station song plays on through the 0 music bus (songs ${idle.s.songs}; city ${idle.s.city}; media ${idle.s.media})`);
  // 2. AN EFFECT — it plays (mode A: it wakes the context first)
  const fx = await p.evaluate(() => Promise.all([import('/js/audio/engine.js'), import('/js/audio/sfx.js')]).then(([E, X]) => new Promise(res => { X.sfx('select'); setTimeout(() => res({ state: E.getContext().state, m: E.getMaster().gain.value, idle: E.audioHealth().idle }), 350); })));
  ok(fx.state === 'running' && fx.m > 0.99 && !fx.idle, `${mode}: an effect plays — the context ${fx.state}, the master ${fx.m.toFixed(2)}${mode === 'A' ? ' (woken by the effect)' : ''}`);
  // 3. THE LEAVE with the effects sounding
  await p.evaluate(ATTACH);
  await p.evaluate(() => import('/js/audio/sfx.js').then(X => { window.__shots = setInterval(() => { try { X.sfx('select'); } catch { /* fine */ } }, 120); }));
  await sleep(900);
  const lv = await p.evaluate(() => import('/js/audio/engine.js').then(E => {
    const t = { t: E.getContext().currentTime, at: performance.now() };
    window.dispatchEvent(new Event('blur'));
    t.recAtBlur = localStorage.getItem('ns:audioleave');          // (read IN the same turn as the blur: written synchronously?)
    return new Promise(res => setTimeout(() => {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      clearInterval(window.__shots);
      setTimeout(() => res(t), 900);
    }, 60));
  }));
  ok(!!lv.recAtBlur && JSON.parse(lv.recAtBlur).sig[0].s === 'blur', `${mode}: THE LEAVE RECORD in localStorage IN the blur's own turn (${lv.recAtBlur ? JSON.parse(lv.recAtBlur).sig.map(x => x.s).join(' → ') : 'none'})`);
  const after = await p.evaluate(() => ({ sus: window.__sus, closes: window.__closes, rec: window.__rec.d.map(c => ({ t: c.t, d: Array.from(c.d) })), sr: window.__rec.sr, stored: JSON.parse(localStorage.getItem('ns:audioleave') || 'null') }));
  const stop = mode === 'B' ? after.closes.find(x => x.at >= lv.at) : after.sus.find(x => x.at >= lv.at);
  ok(!!stop, `${mode}: the context ${mode === 'B' ? 'CLOSED' : 'suspended'} after the leave (${stop ? `${Math.round(stop.at - lv.at)} ms after the blur` : 'never'})`);
  const samples = []; for (const ch of after.rec) for (let i = 0; i < ch.d.length; i++) samples.push({ t: ch.t + i / after.sr, v: ch.d[i] });
  const before = samples.filter(x => x.t >= lv.t - 0.5 && x.t < lv.t), tail = stop ? samples.filter(x => x.t >= stop.t - 0.02 && x.t < stop.t) : [];
  const peak = a => a.reduce((m, x) => Math.max(m, x.v), 0);
  console.log(`  · ${mode} the leave: the effects before it ${db(peak(before))} · the last 20 ms before the ${mode === 'B' ? 'close' : 'suspend'} ${db(peak(tail))} · the record: ${after.stored ? after.stored.sig.map(x => `${x.s} +${x.ms}`).join(' → ') : 'none'}`);
  ok(peak(before) > 1e-3, `${mode}: the effects SOUNDING before the leave (${db(peak(before))})`);
  if (mode !== 'B') ok(peak(tail) < 1e-4, `${mode}: THE TAIL — the last 20 ms rendered before the suspend are silent (${db(peak(tail))})`);
  else console.log(`  · B closes at once (the owner's spec: the master to 0 AT ONCE + close — no ramp): the tail ${db(peak(tail))} is what a close leaves`);
  // 4. THE RETURN
  await p.evaluate(VIS, true);
  await p.evaluate(() => window.dispatchEvent(new Event('focus')));
  await p.touchscreen.tap(195, 600);
  await sleep(1800);
  const back = await p.evaluate(() => import('/js/audio/engine.js').then(E => ({ last: window.__audioLeave.last(), state: E.getContext() ? E.getContext().state : 'none', m: E.getMaster() ? E.getMaster().gain.value : null, made: E.audioHealth().made })));
  ok(!!back.last && new RegExp(`^AUDIO LEAVE · mode ${mode} `).test(back.last.text) && /blur → /.test(back.last.text) && /back after/.test(back.last.text), `${mode}: THE AUDIO LEAVE row built on the return (${back.last ? back.last.text.split('\n')[0] : 'none'})`);
  await p.evaluate(() => import('/js/audio/sfx.js').then(X => X.sfx('select')));
  await sleep(400);
  const snd = await p.evaluate(() => import('/js/audio/engine.js').then(E => ({ state: E.getContext() ? E.getContext().state : 'none', m: E.getMaster() ? E.getMaster().gain.value : null, made: E.audioHealth().made })));
  ok(snd.state === 'running' && snd.m > 0.9, `${mode}: back — an effect plays again (the context ${snd.state}, the master ${snd.m == null ? '?' : snd.m.toFixed(2)}${mode === 'B' ? `, contexts made ${snd.made} — a fresh one` : ''})`);
  if (back.last) console.log(`    ${back.last.text.split('\n').slice(1).join('\n    ')}`);
  await bctx.close();
}

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : ['A', 'B', 'C1', 'C2'];
try { for (const m of ONLY) await run(m); } catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
