// THE GARDEN PARTY PASS — MUSIC OFF = HEAR THE HARBOR, in the browser (docs/audio.md "HEAR THE HARBOR"): the real app + the real corner button,
// LOADED in each of the three states (MUSIC ON · HEAR THE HARBOR · ALL OFF), then tapped through every order (0 → 4 taps: the button is a
// cycle, so that is every path back to every state), and after EVERY step the page is checked against THE SOUND TABLE's row:
//   the button's face · the engine's row · the session asked (a stand-in navigator.audioSession records what iOS would be told) · the hush ·
//   the music's rest + no song element playing · the beds — and in Chromium (real Web Audio) the context RUNNING with the city's loops
//   SOUNDING in HEAR THE HARBOR, an effect SOUNDING (the output's peak), ALL OFF suspended.
// WebKit: Playwright's WebKit on Windows has NO Web Audio (AudioContext undefined) — a stand-in AudioContext is injected so the engine runs;
// what WebKit proves is Safari's own tap path through the button + the table applied whole (the iPhone's ears: the owner's phone check).
//   node tests/integration/sound-table.mjs "<chromium>"      (scripts/serve.mjs --emu + the emulators; WebKit too when ~/wk is installed)
import { pathToFileURL } from 'node:url';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { guardUrl } from './kit/live-guard.mjs';
import puppeteer from './kit/puppeteer.mjs';

const BASE = process.env.E2E_BASE || 'http://localhost:5173';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fails = [];
let checks = 0;
const ok = (c, what) => { checks++; console.log(c ? 'OK  ' : 'FAIL', what); if (!c) fails.push(what); };
const START = { on: { musicOff: false, sfxOff: false, muted: false }, music: { musicOff: true, sfxOff: false, muted: false }, all: { musicOff: true, sfxOff: true, muted: false } };
const NEXT = { on: 'music', music: 'all', all: 'on' };
const ROW = { on: { name: 'MUSIC ON', session: 'playback', beds: true, music: true }, music: { name: 'HEAR THE HARBOR', session: 'playback', beds: true, music: false }, all: { name: 'ALL OFF', session: 'auto', beds: false, music: false } };

/** before the app: the profile + the settings; a stand-in audioSession (records the type iOS would get); WebKit: a stand-in AudioContext */
function INIT([slot, prefs, fakeAudio]) {
  try { localStorage.setItem('nd:entered', '1'); localStorage.setItem(`na:${slot}:profile`, JSON.stringify({ name: 'AVA', color: 'cyan', avatar: 'bolt' })); localStorage.setItem('na:settings', JSON.stringify(prefs)); } catch { /* fine */ }
  const sess = { type: 'auto', state: 'active', addEventListener() {} };
  try { Object.defineProperty(navigator, 'audioSession', { configurable: true, get: () => sess }); } catch { /* fine */ }
  window.__sess = sess;
  if (!fakeAudio || window.AudioContext) return;
  class P { constructor(v = 1) { this.value = v; } cancelScheduledValues() {} setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } setTargetAtTime(v) { this.value = v; } exponentialRampToValueAtTime(v) { this.value = v; } setValueCurveAtTime() {} }
  class N { constructor(c) { this.context = c; this.gain = new P(1); this.threshold = new P(); this.knee = new P(); this.ratio = new P(); this.attack = new P(); this.release = new P(); this.frequency = new P(440); this.Q = new P(1); this.pan = new P(0); this.detune = new P(0); this.playbackRate = new P(1); this.offset = new P(0); this.delayTime = new P(0); this.fftSize = 2048; this.frequencyBinCount = 1024; } connect(x) { return x; } disconnect() {} start() {} stop() { if (this.onended) setTimeout(() => this.onended && this.onended(), 0); } addEventListener() {} removeEventListener() {} getFloatTimeDomainData(a) { a.fill(0); } getByteFrequencyData(a) { a.fill(0); } getByteTimeDomainData(a) { a.fill(128); } setPeriodicWave() {} }
  class AC { constructor() { this.state = 'suspended'; this.sampleRate = 48000; this.destination = new N(this); this.listener = {}; this._t0 = performance.now(); this.onstatechange = null; this._l = []; }
    get currentTime() { return this.state === 'running' ? (performance.now() - this._t0) / 1000 : 0; }
    _set(s) { if (this.state === s) return; this.state = s; if (this.onstatechange) this.onstatechange(); for (const f of this._l) f(); }
    addEventListener(t, f) { if (t === 'statechange') this._l.push(f); } removeEventListener() {}
    resume() { this._set('running'); return Promise.resolve(); } suspend() { this._set('suspended'); return Promise.resolve(); } close() { this._set('closed'); return Promise.resolve(); }
    createBuffer(ch, len, rate) { return { duration: len / rate, length: len, sampleRate: rate, numberOfChannels: ch, getChannelData: () => new Float32Array(len), copyToChannel() {} }; }
    decodeAudioData(b, ok) { const r = this.createBuffer(2, 48000, 48000); if (ok) ok(r); return Promise.resolve(r); }
    createPeriodicWave() { return {}; } }
  for (const k of ['createGain', 'createDynamicsCompressor', 'createBufferSource', 'createOscillator', 'createBiquadFilter', 'createStereoPanner', 'createAnalyser', 'createMediaElementSource', 'createConvolver', 'createDelay', 'createConstantSource', 'createWaveShaper', 'createChannelMerger', 'createChannelSplitter']) AC.prototype[k] = function () { return new N(this); };
  window.AudioContext = AC;
}

async function engines() {
  const out = [{ name: 'chromium', launch: async () => { const b = await puppeteer.launch({ executablePath: process.argv[2], headless: true, args: ['--autoplay-policy=no-user-gesture-required'] }); return { b, page: async () => { const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); return { p, init: (a) => p.evaluateOnNewDocument(INIT, a), close: () => ctx.close() }; } }; } }];
  const at = process.env.WK_PLAYWRIGHT || join(homedir(), 'wk', 'node_modules', 'playwright', 'index.mjs');
  if (existsSync(at)) out.push({ name: 'webkit', fake: true, launch: async () => { const { webkit } = await import(pathToFileURL(at).href); const b = await webkit.launch(); return { b, page: async () => { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); return { p, init: (a) => p.addInitScript(INIT, a), close: () => ctx.close() }; } }; } });
  else console.log('  · WebKit: not installed here (~/wk) — Chromium only');
  return out;
}

const read = p => p.evaluate(() => import('/js/audio/engine.js').then(E => {
  const h = E.audioHealth(), sn = E.soundingNow(), b = document.querySelector('.music-btn');
  return { btn: b ? b.dataset.sound : null, name: h.sound, want: h.want, type: window.__sess ? window.__sess.type : null, hushed: h.hushed, resting: E.musicResting(), restOn: h.resting,
    bedsOff: /stopped/.test(String(sn.beds)), state: E.getContext() ? E.getContext().state : 'none', city: String(sn.city || ''), media: String(sn.media || ''),
    playing: [...document.querySelectorAll('audio, video')].filter(e => !e.paused).length, mus: E.getMusicBus() ? E.getMusicBus().gain.value : null, fx: E.getSfxBus() ? E.getSfxBus().gain.value : null };
}));
const tapBtn = async p => { const r = await p.evaluate(() => { const b = document.querySelector('.music-btn'); const q = b.getBoundingClientRect(); return { x: q.left + q.width / 2, y: q.top + q.height / 2 }; }); await p.touchscreen.tap(r.x, r.y); };

try {
  for (const eng of await engines()) {
    const { b, page } = await eng.launch();
    try {
      for (const [st0, prefs] of Object.entries(START)) {
        const { p, init, close } = await page();
        const errs = []; p.on('pageerror', e => errs.push(String(e && e.message || e)));
        await init([`st${st0}`, prefs, !!eng.fake]);
        await p.goto(guardUrl(`${BASE}/?emu&slot=st${st0}&city=2&idle=1&debug=1`, 'sound-table.mjs'));
        await p.waitForFunction('!!(window.__district && window.__district.harbor() && window.__district.harbor().shown)', { timeout: 90000 });
        await p.touchscreen.tap(195, 560);   // (the first tap on the city: the audio unlocked)
        await sleep(400);
        let st = st0;
        for (let i = 0; i <= 4; i++) {
          if (i) {
            const was = st;
            await tapBtn(p); st = NEXT[st];
            // (WebKit's stand-in context never sounds a song: from MUSIC ON the button's tap is THE MUSIC RESCUE (music.js#musicNeedsRescue —
            //  "the music meant on but quiet: the tap brings it back, no change") — every time, since no song sounds here: that one step applies
            //  the button's own patch; Chromium (real audio) taps it for real)
            if (eng.fake && was === 'on') { await sleep(900); if ((await read(p)).name === 'MUSIC ON') { console.log(`  · ${eng.name}: the tap from MUSIC ON was THE MUSIC RESCUE (no song ever sounds in the stand-in) — the button's own patch applied (sound-state.js#soundTap)`); await p.evaluate(() => Promise.all([import('/js/audio/settings.js'), import('/js/audio/sound-state.js')]).then(([S, R]) => S.updateSettings(R.soundTap(S.settings).patch))); } }
          }
          await sleep(eng.fake ? 900 : 1800);   // (WebKit: two taps closer than ~350 ms are one double-tap to Safari)   // (Chromium: the city's loops + the hush's ramp have time to arrive)
          const g = await read(p), w = ROW[st];
          const where = `${eng.name} · loaded ${ROW[st0].name}${i ? ` + ${i} tap(s)` : ''} → ${w.name}`;
          ok(g.btn === st && g.name === w.name, `${where}: the button (${g.btn}) + the engine's row (${g.name})`);
          ok(g.want === w.session && g.type === w.session,`${where}: the session asked ${g.want} · iOS told ${g.type}`);
          ok(g.hushed === (st === 'all') && g.resting === !w.music && g.restOn === (st === 'music'), `${where}: hushed ${g.hushed} · the music resting ${g.resting} (outside the hush ${g.restOn})`);
          ok(w.music || (g.playing === 0 && !/PLAYING/.test(g.media)), `${where}: ${w.music ? 'the music may play' : `no song element playing (${g.playing} · music.js: ${g.media})`}`);
          ok(g.bedsOff === !w.beds || (st === 'all'), `${where}: the beds ${g.bedsOff ? 'stopped' : 'on'}`);
          if (!eng.fake) {
            if (st === 'all') ok(g.state === 'suspended', `${where}: NOTHING RUNS — the context ${g.state}`);
            else {
              ok(g.state === 'running' && g.fx > 0.05 && (w.music ? true : g.mus === 0), `${where}: the context ${g.state}, the effects bus ${g.fx && g.fx.toFixed(2)}, the music bus ${g.mus && g.mus.toFixed(2)}`);
              if (st === 'music') {
                // (HEAR THE HARBOR — what the owner asked for: the water / the hum / the boats are HEARD — a city loop sounding + an effect's peak)
                const loopOk = await p.waitForFunction("import('/js/audio/engine.js').then(E => !/no loops/.test(String(E.soundingNow().city)))", { timeout: 12000 }).then(() => true, () => false);
                const city = (await read(p)).city;
                ok(loopOk, `${where}: the city's loops SOUND with the music off (${city})`);
                const pk = await p.evaluate(async () => { const [E, X] = await Promise.all([import('/js/audio/engine.js'), import('/js/audio/sfx.js')]); const c = E.getContext(), an = c.createAnalyser(); an.fftSize = 2048; E.getMaster().connect(an); X.sfx('select'); let peak = 0; const d = new Float32Array(2048); for (let k = 0; k < 12; k++) { await new Promise(r => setTimeout(r, 25)); an.getFloatTimeDomainData(d); for (const v of d) peak = Math.max(peak, Math.abs(v)); } return { peak: +peak.toFixed(4), state: c.state }; });
                ok(pk.peak > 0.001 && pk.state === 'running', `${where}: an effect SOUNDS (the output's peak ${pk.peak}, ${pk.state})`);
              }
            }
          }
        }
        ok(errs.length === 0, `${eng.name} · loaded ${ROW[st0].name}: no page error (${errs.slice(0, 2).join(' | ')})`);
        await close();
      }
    } finally { await b.close(); }
  }
} catch (e) { console.log('CRASH', e && e.stack || e); fails.push(String(e && e.message)); }
console.log(`\n${checks - fails.length}/${checks} checks passed${fails.length ? `\nFAILED:\n - ${fails.join('\n - ')}` : ''}`);
process.exit(fails.length ? 1 : 0);
