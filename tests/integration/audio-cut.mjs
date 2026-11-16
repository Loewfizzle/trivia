// FIXES R2 — GROUP 0, THE SQUEAL IS THE CUT (the owner's tests, Nov 15 7:27 pm, iOS 18.7: ALL sound off → leaving = no squeal; music ON +
// effects OFF → no squeal; and SWITCHING THE SOUND EFFECTS TOGGLE OFF squeals by itself — no leaving needed). So the squeal is made by THE
// EFFECTS BEING CUT. This RECORDS THE REAL OUTPUT of the app's audio graph (Chromium as a 390-pt touch phone, the real city on the emulators):
// a ScriptProcessor tapped on the MASTER (what reaches the speaker) and on the SFX BUS, every rendered sample, while the city's effects play
// (a looping bed through its low-pass — the water — + the neon hum's loop + one-shots), then:
//   A  SOUND EFFECTS → OFF with the music off   (= THE HUSH: the master to 0, then the context suspended)
//   B  SOUND EFFECTS → OFF with the music on    (the effects bus alone to 0; the context keeps running)
//   C  MUTE                                     (the hush, from full sound)
//   D  LEAVING (blur → pagehide → hidden) with the effects on + the music off
// Each FAILS on: a BURST (a sample-to-sample jump after the cut bigger than anything the sound itself made in the second before — a step /
// a node cut mid-buffer: broadband, what a phone's speaker plays as a click or a squeal), a NON-SILENT TAIL (anything above −80 dBFS in the
// last 20 ms rendered before the suspend — iOS's output keeps the last buffer it was given), a loop source stopped while the effects bus was
// still sounding, or the context suspended while the master wasn't 0 yet. Back on: the context runs, the master ramps back from 0.
// Playwright's WebKit on Windows has no Web Audio: this proves the GRAPH (the same graph Safari renders), not iOS's own output buffer.
//   node tests/integration/audio-cut.mjs "<chromium>"        (scripts/serve.mjs --emu + the emulators)
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
  window.__sus = []; window.__stops = [];
  const sus = AudioContext.prototype.suspend;
  AudioContext.prototype.suspend = function () {
    const m = window.__probe && window.__probe.master();
    window.__sus.push({ t: this.currentTime, at: performance.now(), master: m == null ? null : m });
    return sus.call(this);
  };
  // every looping source's stop: the effects bus's level AT that moment (a loop cut while the bus still sounds = a click into the mix)
  const stop = AudioBufferSourceNode.prototype.stop;
  AudioBufferSourceNode.prototype.stop = function (when = 0) {
    if (this.loop && window.__probe) { const sx = window.__probe.sfx(), m = window.__probe.master(); window.__stops.push({ at: performance.now(), when: Math.max(this.context.currentTime, when || 0), now: this.context.currentTime, sfx: sx, master: m, lvl: sx == null || m == null ? null : sx * m }); }
    return stop.call(this, when);
  };
}

// the recorder: a ScriptProcessor on the master + one on the SFX bus (each sample, ch 0 + 1 → max), into a zero gain → the destination
const ATTACH = () => import('/js/audio/engine.js').then(E => {
  const c = E.getContext(), m = E.getMaster(), sb = E.getSfxBus();
  const rec = { master: [], sfx: [], sr: c.sampleRate };
  const tap = (node, into) => {
    const sp = c.createScriptProcessor(256, 2, 1), z = c.createGain(); z.gain.value = 0;
    sp.onaudioprocess = e => { const a = e.inputBuffer.getChannelData(0), b = e.inputBuffer.numberOfChannels > 1 ? e.inputBuffer.getChannelData(1) : a; const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = Math.abs(a[i]) > Math.abs(b[i]) ? a[i] : b[i]; into.push({ t: e.playbackTime, d: o }); };
    node.connect(sp); sp.connect(z); z.connect(c.destination);
  };
  tap(m, rec.master); tap(sb, rec.sfx);
  window.__rec = rec;
  window.__probe = { master: () => { const g = E.getMaster(); return g ? g.gain.value : null; }, sfx: () => { const g = E.getSfxBus(); return g ? g.gain.value : null; } };
  return { state: c.state, sr: c.sampleRate };
});

// the city's effects, playing: the water's loop (its low-pass), the neon hum's loop (a bed), one-shots every 120 ms
const PLAY = () => Promise.all([import('/js/audio/city-sound.js'), import('/js/audio/ambience.js'), import('/js/audio/sfx.js')]).then(([C, A, X]) => {
  window.__water = C.cityLoop('water-lapping', { gain: 4, fadeIn: 0.2, start: 1 });
  A.neonHumFade({ hold: 30, fade: 30, fadeIn: 0.2 });
  window.__shots = setInterval(() => { try { X.sfx('select'); } catch { /* fine */ } }, 120);
});

/** the recording, in node: [from, to) in context seconds → the samples */
function window_(chunks, sr, from, to) {
  const out = [];
  for (const ch of chunks) for (let i = 0; i < ch.d.length; i++) { const t = ch.t + i / sr; if (t >= from && t < to) out.push(ch.d[i]); }
  return out;
}
const maxAbs = a => a.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const maxJump = a => { let m = 0; for (let i = 1; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - a[i - 1])); return m; };
const db = v => (v > 0 ? (20 * Math.log10(v)).toFixed(1) : '−∞') + ' dBFS';

async function run(name, prefs, cut, { stream = 'master', suspends = true }) {
  const bctx = await browser.createBrowserContext();
  const slot = `ac${name.charCodeAt(0)}`;
  const p = await bctx.newPage();
  await p.evaluateOnNewDocument(INIT, slot, prefs);
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  p.on('pageerror', e => console.log(`[${name}] PAGEERROR`, e.message));
  await p.goto(guardUrl(`${BASE}/?emu&slot=${slot}&city=2&idle=1&debug=1`, 'audio-cut.mjs'));
  await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 60000 });
  for (let i = 0; i < 3; i++) { await p.touchscreen.tap(195, 560 + i * 12); await sleep(400); }
  await sleep(800);
  const a = await p.evaluate(ATTACH);
  await p.evaluate(PLAY);
  await p.waitForFunction('window.__water && window.__water.playing()', { timeout: 20000 }).catch(() => {});
  await sleep(1200);
  const t0 = await p.evaluate(`(${cut})()`);
  await sleep(1100);
  const r = await p.evaluate(() => { clearInterval(window.__shots); return import('/js/audio/engine.js').then(E => ({ rec: { master: window.__rec.master.map(c => ({ t: c.t, d: Array.from(c.d) })), sfx: window.__rec.sfx.map(c => ({ t: c.t, d: Array.from(c.d) })) }, sus: window.__sus, stops: window.__stops, state: E.getContext().state, log: E.audioEvents().slice(-10).map(x => x.m), cut: window.__audioCut ? window.__audioCut.last() : null })); });
  const sr = a.sr, chunks = r.rec[stream];
  const end = chunks.length ? chunks[chunks.length - 1].t + chunks[chunks.length - 1].d.length / sr : 0;
  const before = window_(chunks, sr, t0.t - 1.0, t0.t), after = window_(chunks, sr, t0.t, end);
  const steadyPeak = maxAbs(before), steadyJump = maxJump(before), aft = [before[before.length - 1] || 0, ...after], cutJump = maxJump(aft);
  let jAt = 0; for (let i = 1; i < aft.length; i++) if (Math.abs(aft[i] - aft[i - 1]) === cutJump) { jAt = i; break; }
  const lastBit = window_(chunks, sr, end - 0.02, end), settled = window_(chunks, sr, t0.t + 0.25, end);
  console.log(`  · ${name}: the ${stream} before the cut — peak ${db(steadyPeak)}, the biggest jump ${steadyJump.toFixed(5)}; after — the biggest jump ${cutJump.toFixed(5)} (${(jAt / sr * 1000).toFixed(1)} ms after the cut), rendered ${(end - t0.t).toFixed(3)} s after the cut`);
  console.log(`    the log: ${r.log.join(' · ')}`);
  ok(steadyPeak > 1e-3, `${name}: the effects SOUNDING before the cut (the ${stream}'s peak ${db(steadyPeak)})`);
  ok(cutJump <= steadyJump * 1.05 + 1e-5, `${name}: NO BURST at the cut — the biggest sample jump after it ${cutJump.toFixed(5)} ≤ the sound's own ${steadyJump.toFixed(5)}`);
  ok(maxAbs(settled) < 1e-4, `${name}: SILENT from 250 ms after the cut on (the ${stream}'s peak there ${db(maxAbs(settled))})`);
  const loopStops = r.stops.filter(s => s.at >= t0.at);
  ok(loopStops.every(s => s.lvl != null && s.lvl < 1e-4), `${name}: every LOOP stopped only once it was SILENT — the effects bus × the master at its stop (${loopStops.length ? loopStops.map(s => `bus ${s.sfx == null ? '?' : s.sfx.toFixed(3)} × master ${s.master == null ? '?' : s.master.toFixed(3)}`).join(', ') : 'none stopped'})`);
  if (suspends) {
    const s = r.sus.filter(x => x.at >= t0.at);
    ok(r.state === 'suspended' && s.length > 0, `${name}: suspended after the cut (${r.state}; ${s.length} suspend${s.length === 1 ? '' : 's'}, ${s.length ? `${Math.round(s[0].at - t0.at)} ms after it` : '—'})`);
    ok(s.length > 0 && s.every(x => x.master === 0), `${name}: the master was 0 AT every suspend (${s.map(x => x.master == null ? '?' : x.master.toFixed(4)).join(', ') || '—'})`);
    // (THE ZEROS FIRST: the output exactly 0 for the 100 ms before the suspend was asked — what a phone's output holds then is silence)
    const held = s.map(x => maxAbs(window_(chunks, sr, x.t - 0.1, x.t - 0.012)));
    ok(s.length > 0 && held.every(v => v < 1e-4), `${name}: THE ZEROS FIRST — the output silent for the 100 ms before each suspend was asked (${held.map(db).join(', ') || '—'})`);
    ok(maxAbs(lastBit) < 1e-4, `${name}: THE TAIL — the last 20 ms rendered before the suspend are silent (${db(maxAbs(lastBit))})`);
  }
  return { p, bctx, r };
}

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const want = k => !ONLY || ONLY.includes(k);
try {
  // A — SOUND EFFECTS → OFF, the music off: the hush
  if (want('A')) {
    const { p, bctx, r } = await run('A effects OFF (music off)', { musicOff: true }, () => import('/js/audio/engine.js').then(E => import('/js/audio/settings.js').then(S => { const t = { t: E.getContext().currentTime, at: performance.now() }; S.updateSettings({ sfxOff: true }); return t; })), { stream: 'master' });
    ok(!!r.cut && /effects off/.test(r.cut.text) && /master 0\.000/.test(r.cut.text), `A: THE PHONE'S REPORT ROW built (${r.cut ? r.cut.text.split('\n')[0] : 'none'})`);
    // back on: a tap turns the effects on — the context runs, the master ramps from 0
    await p.evaluate(() => import('/js/audio/settings.js').then(S => S.updateSettings({ sfxOff: false })));
    await p.touchscreen.tap(195, 600); await sleep(900);
    const back = await p.evaluate(() => import('/js/audio/engine.js').then(E => ({ state: E.getContext().state, m: E.getMaster().gain.value })));
    ok(back.state === 'running' && back.m > 0.9, `A: effects back ON — the context ${back.state}, the master back to ${back.m.toFixed(2)}`);
    await bctx.close();
  }
  // B — SOUND EFFECTS → OFF with the music on: the effects bus alone fades out, the context keeps running
  if (want('B')) {
    const { bctx, r } = await run('B effects OFF (music on)', {}, () => import('/js/audio/engine.js').then(E => import('/js/audio/settings.js').then(S => { const t = { t: E.getContext().currentTime, at: performance.now() }; S.updateSettings({ sfxOff: true }); return t; })), { stream: 'sfx', suspends: false });
    ok(r.state === 'running', `B: the context keeps running for the music (${r.state})`);
    await bctx.close();
  }
  // C — MUTE from full sound
  if (want('C')) {
    const { bctx } = await run('C MUTE', {}, () => import('/js/audio/engine.js').then(E => import('/js/audio/settings.js').then(S => { const t = { t: E.getContext().currentTime, at: performance.now() }; S.updateSettings({ muted: true }); return t; })), { stream: 'master' });
    await bctx.close();
  }
  // D — LEAVING with the effects on (music off): blur → pagehide → hidden, as iOS sends them
  if (want('D')) {
    const { p, bctx, r } = await run('D LEAVING (effects on)', { musicOff: true }, () => import('/js/audio/engine.js').then(E => {
      const t = { t: E.getContext().currentTime, at: performance.now() };
      window.dispatchEvent(new Event('blur'));
      setTimeout(() => {
        window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        document.dispatchEvent(new Event('visibilitychange'));
      }, 60);
      return t;
    }), { stream: 'master' });
    ok(!!r.cut && /leave/.test(r.cut.text), `D: the leave's report row kept for the return (${r.cut ? r.cut.text.split('\n')[0] : 'none'})`);
    await p.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));
    });
    await p.touchscreen.tap(195, 600); await sleep(1000);
    const back = await p.evaluate(() => import('/js/audio/engine.js').then(E => ({ state: E.getContext().state, m: E.getMaster().gain.value })));
    ok(back.state === 'running' && back.m > 0.9, `D: back on screen — the context ${back.state}, the master ramped back to ${back.m.toFixed(2)}`);
    await bctx.close();
  }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
finally { await browser.close(); }
console.log(`\n${checks - fails.length}/${checks} checks${fails.length ? ` — FAILED:\n  ${fails.join('\n  ')}` : ' — all green'}`);
process.exit(fails.length ? 1 : 0);
