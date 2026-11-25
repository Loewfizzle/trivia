// THE HOUSEKEEPING + AUDIO PASS (Nov 25) — THE AUDIO FIXES (docs/audio.md "THE AUDIO FIXES (Nov 25)"), on the REAL js/audio/engine.js,
// music.js, sfx-kit.js and both games' sfx.js over a fake DOM + AudioContext (the audio-session / fix-pass-audio pattern):
//   1. onUnlock is ONE-SHOT: asked after the unlock it is called at once and NOTHING is kept; the set is let go once the first tap fired;
//      ten JAYWALK / HIGH RISE plays while MUTED decode nothing and keep no listener; while SUSPENDED = ONE wait for the context's return;
//      ten plays asked before a decode lands = ONE decode a file
//   2. THE LEAVE CUT ORDER: the master's ramp is scheduled FIRST, the DIRECT element is paused at t = 0, the ROUTED voices only after
//      LEAVE_S and only while the page is still left; the loops after them; the record says both moments
//   3. a failed load is not kept for the session (source pins — the four modules)      4. THE LATE CUES: ONE lead-in helper, both games
//   5. JAYWALK after iOS's context rebuild      6. JAYWALK's gain + panner leave the graph when a voice ends
//   7. the first tap blips ONCE (and still asks the context to run); the lobby song through the music's input; OVERCLOCK's loop; THE SONG CAP
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const settle = async (fn, ms = 4000) => { const t0 = Date.now(); while (!fn() && Date.now() - t0 < ms) await sleep(10); return fn(); };

// ---- the fake page
const mkTarget = () => { const L = {}; return { L, addEventListener(t, fn) { (L[t] ||= []).push(fn); }, removeEventListener() {}, fire(t, e = {}) { for (const fn of L[t] || []) fn({ type: t, ...e }); } }; };
const doc = mkTarget(); doc.visibilityState = 'visible'; doc.hidden = false; doc.body = { classList: { contains: () => false } }; doc.querySelectorAll = () => [];
const win = mkTarget();
globalThis.document = doc; globalThis.window = win;
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
globalThis.location = { search: '?debug=1' };
globalThis.matchMedia = q => ({ matches: /coarse/.test(q) });   // a touch phone
try { Object.defineProperty(globalThis, 'navigator', { value: { audioSession: { type: '' }, userAgent: 'iPhone OS 18_7', standalone: true, sendBeacon: () => true }, configurable: true }); } catch { /* fine */ }
globalThis.Blob = class { constructor(parts) { this.parts = parts; } };
URL.createObjectURL = () => 'blob:silent';

const order = [];                       // what happened, in order (the cut's ONE ORDER)
const T0 = performance.now(), at = () => Math.round(performance.now() - T0);
class Param { constructor(v = 1, name = '') { this._v = v; this.name = name; } get value() { return this._v; } set value(v) { this._v = v; } cancelScheduledValues() {} setValueAtTime(v) { this._v = v; } linearRampToValueAtTime(v) { if (this.name === 'master' && v === 0) order.push({ w: 'master ramp → 0', t: at() }); this._v = v; } setTargetAtTime(v) { this._v = v; } setValueCurveAtTime(c) { this._v = c[c.length - 1]; } exponentialRampToValueAtTime(v) { this._v = v; } }
const nodes = [];
class Node_ {
  constructor(kind, ctx) { this.kind = kind; this.ctx = ctx; this.outs = []; this.gain = new Param(1); this.pan = new Param(0); this.frequency = new Param(0); this.Q = new Param(0); this.playbackRate = new Param(1); this.threshold = new Param(); this.knee = new Param(); this.ratio = new Param(); this.attack = new Param(); this.release = new Param(); this.fftSize = 2048; this.context = ctx; nodes.push(this); }
  connect(x) { this.outs.push(x); return x; } disconnect() { this.gone = true; }
  start(...a) { this.started = a; } stop() { this.stopped = true; this.end(); }
  end() { const f = this._end; this._end = null; if (f) f(); if (this.onended) this.onended({ target: this }); }
  addEventListener(t, fn) { if (t === 'ended') this._end = fn; }
  getFloatTimeDomainData() {}
}
let decodes = 0, decodeMs = 0, blips = 0, ctxMade = 0;
const LEAD_SAMPLES = 960;                // 20 ms of silence at 48 kHz — an MP3's lead-in
const mkBuf = () => { const d = new Float32Array(24000); for (let i = LEAD_SAMPLES; i < d.length; i++) d[i] = 0.5; return { duration: 0.5, sampleRate: 48000, length: 24000, numberOfChannels: 1, getChannelData: () => d }; };
class FakeAC {
  get currentTime() { const n = performance.now(); if (this.state === 'running') this._t += (n - this._at) / 1000; this._at = n; return this._t; }
  constructor() { this.n = ++ctxMade; this.state = FakeAC.born; this._t = 1; this._at = performance.now(); this.destination = new Node_('dest', this); this.onstatechange = null; this.resumes = 0; this.suspends = 0; this.sampleRate = 48000; this._L = []; this.masterSeen = false; }
  createGain() { const g = new Node_('gain', this); if (!this.masterSeen) { this.masterSeen = true; g.gain.name = 'master'; } return g; }   // (engine.js#createContext makes the master first)
  createDynamicsCompressor() { return new Node_('comp', this); } createBufferSource() { return new Node_('src', this); } createOscillator() { return new Node_('osc', this); }
  createBuffer() { blips++; return { blip: true }; }
  createWaveShaper() { return new Node_('ws', this); } createStereoPanner() { return new Node_('pan', this); } createBiquadFilter() { return new Node_('bq', this); } createAnalyser() { return new Node_('an', this); }
  createMediaElementSource(el) { const n = new Node_('mes', this); n.el = el; return n; }
  decodeAudioData(ab, ok, err) { decodes++; const b = mkBuf(); if (FakeAC.failDecode) { const p = new Promise((_, rej) => setTimeout(() => { if (err) err(new Error('bad')); rej(new Error('bad')); }, decodeMs)); p.catch(() => {}); return p; } return new Promise(res => setTimeout(() => { if (ok) ok(b); res(b); }, decodeMs)); }
  addEventListener(t, fn) { this._L.push(fn); } removeEventListener(t, fn) { this._L = this._L.filter(f => f !== fn); }
  set(s) { this.state = s; if (this.onstatechange) this.onstatechange(); for (const fn of [...this._L]) fn(); }
  resume() { this.resumes++; return new Promise(() => {}); }   // (the OS decides: the test says when it runs)
  suspend() { this.suspends++; this.set('suspended'); return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
}
FakeAC.born = 'suspended';               // a context born asleep, as on a phone: the first tap must ASK it to run
win.AudioContext = FakeAC;
const setI = globalThis.setInterval;
globalThis.setInterval = (fn, ms, ...a) => { const t = setI(fn, ms, ...a); if (t && t.unref) t.unref(); return t; };

// the media elements, the way music.js makes them (the routed voices carry crossOrigin; the direct one never does)
const els = [];
globalThis.Audio = class { constructor() { this.paused = true; this.src = ''; this.pauses = []; els.push(this); } addEventListener() {} removeEventListener() {} play() { this.paused = false; return Promise.resolve(); } pause() { if (!this.paused) this.pauses.push(at()); this.paused = true; } load() {} setAttribute() {} removeAttribute() {} getAttribute() { return this.src || null; } };
const fetched = [];
globalThis.fetch = async u => { fetched.push(String(u)); if (globalThis.__failFetch && globalThis.__failFetch.test(String(u))) return { ok: false, status: 503, arrayBuffer: async () => new ArrayBuffer(0) }; return { ok: true, status: 200, headers: { get: () => null }, body: null, arrayBuffer: async () => new ArrayBuffer(64), json: async () => ({}), blob: async () => ({}) }; };

const R = new URL('../', import.meta.url).href;
const E = await import(R + 'js/audio/engine.js');
const { updateSettings } = await import(R + 'js/audio/settings.js');
const K = await import(R + 'js/audio/sfx-kit.js');
E.installAudio();
updateSettings({ musicOff: false, sfxOff: false, muted: false });

// ============================================================ 1 · onUnlock + 7 · the first tap
test('1 + 7: onUnlock is ONE-SHOT — before the tap it waits (an unsubscribe works); the FIRST tap asks the context to run, blips ONCE, calls every waiter once and lets the set go; asked after it: called at once, NOTHING kept', async () => {
  const calls = [];
  const offA = E.onUnlock(() => calls.push('a'));
  E.onUnlock(() => calls.push('b'));
  E.onUnlock(() => calls.push('c'));
  assert.equal(typeof offA, 'function', 'onUnlock returns its unsubscribe');
  assert.equal(E.unlockWaiters() >= 3, true, 'three wait for the first tap');
  const before = E.unlockWaiters();
  offA();
  assert.equal(E.unlockWaiters(), before - 1, 'an unsubscribed waiter is gone');
  assert.equal(E.audioUnlocked(), false);
  blips = 0;
  doc.fire('touchend');                                       // THE FIRST TAP — the context is born suspended
  const c = E.getContext();
  assert.ok(c && c.resumes >= 1, 'the first tap still ASKS the context to run (the guard is on the blip, never on the ask)');
  assert.equal(blips, 1, 'the first tap blips ONCE (it was twice: the resume\'s + the unlock\'s)');
  assert.deepEqual(calls, ['b', 'c'], 'every waiter once, the unsubscribed one never');
  assert.equal(E.unlockWaiters(), 0, 'the set is let go once the first tap fired');
  c.set('running'); await sleep(20);
  assert.equal(E.isUnlocked(), true);
  // after the unlock: ten asks = ten calls at once, nothing kept (each used to stay in the set for good)
  let n = 0;
  for (let i = 0; i < 10; i++) { const off = E.onUnlock(() => { n++; }); assert.equal(typeof off, 'function'); off(); }
  assert.equal(n, 10, 'called at once, each time');
  assert.equal(E.unlockWaiters(), 0, 'NOTHING is kept after the unlock');
  // a later tap that finds the context asleep: its one blip (the resume's)
  c.set('suspended'); blips = 0;
  doc.fire('touchend');
  assert.equal(blips, 1, 'a later tap on a sleeping context: one blip');
  c.set('running'); await sleep(20);
  const src = read('js/audio/engine.js');
  assert.match(src, /else if \(ctx\.state !== 'running'\) \{ ask\(e \? e\.type : 'tap'\); if \(unlocked\) blip\(\); \}/);
  assert.match(src, /export function onUnlock\(fn\) \{\s*if \(unlocked\) \{ fn\(\); return \(\) => \{\}; \}\s*unlockListeners\.add\(fn\);\s*return \(\) => unlockListeners\.delete\(fn\);\s*\}/);
});

// ============================================================ the shared kit (PURE)
test('sfx-kit — lateGate: ONE wait, never one a call — the first tap before it, the context\'s return after it, NO wait while hushed; the latest sound wins; the listener is taken back', () => {
  const eng = { run: false, unlocked: false, hushed: false, un: [], re: [], isUnlocked() { return this.run && this.unlocked; }, audioUnlocked() { return this.unlocked; }, audioHushed() { return this.hushed; },
    onUnlock(fn) { this.un.push(fn); return () => { this.un = this.un.filter(f => f !== fn); }; }, onResume(fn) { this.re.push(fn); return () => { this.re = this.re.filter(f => f !== fn); }; } };
  const E2 = { isUnlocked: () => eng.isUnlocked(), audioUnlocked: () => eng.audioUnlocked(), audioHushed: () => eng.audioHushed(), onUnlock: fn => eng.onUnlock(fn), onResume: fn => eng.onResume(fn) };
  const g = K.lateGate(E2), ran = [];
  for (let i = 0; i < 10; i++) g.when(() => ran.push(`tap${i}`));          // before the first tap
  assert.deepEqual([eng.un.length, eng.re.length, g.waiting()], [1, 0, 1], 'ten asks before the tap = ONE unlock listener');
  eng.unlocked = true; eng.un[0]();
  assert.deepEqual(ran, ['tap9'], 'the LATEST sound only');
  assert.deepEqual([eng.un.length, g.waiting()], [0, 0], 'the listener is taken back');
  for (let i = 0; i < 10; i++) g.when(() => ran.push(`sus${i}`));          // unlocked, the context suspended / interrupted
  assert.deepEqual([eng.un.length, eng.re.length, g.waiting()], [0, 1, 2], 'ten asks while suspended = ONE onResume listener, none on onUnlock');
  eng.run = true; eng.re[0]();
  assert.deepEqual(ran, ['tap9', 'sus9']);
  assert.deepEqual([eng.re.length, g.waiting()], [0, 0], 'taken back after it fired');
  g.when(() => ran.push('now'));                                          // running: at once, nothing waits
  assert.deepEqual([ran.at(-1), eng.un.length, eng.re.length], ['now', 0, 0]);
  eng.run = false; eng.hushed = true;                                      // MUTED / ALL OFF — NOTHING RUNS
  for (let i = 0; i < 10; i++) g.when(() => ran.push('hushed'));
  assert.deepEqual([eng.un.length, eng.re.length, g.waiting(), ran.includes('hushed')], [0, 0, 0, false], 'hushed: no listener, no wait, the sound is dropped');
});

test('sfx-kit — leadOf / leadIn: the first audible sample less a millisecond, measured ONCE a buffer; decodeOnce: a decode in flight is shared, a failure is forgotten', async () => {
  const b = mkBuf();
  assert.ok(Math.abs(K.leadOf(b) - (LEAD_SAMPLES / 48000 - 0.001)) < 1e-6, `20 ms of lead-in → ${K.leadOf(b)}`);
  let scans = 0; const counted = { sampleRate: 48000, getChannelData: () => { scans++; return b.getChannelData(); } };
  assert.equal(K.leadIn(counted), K.leadIn(counted)); assert.equal(K.leadIn(counted), K.leadOf(b));
  assert.equal(scans, 1, 'a play reads the remembered number — the buffer is scanned once');
  assert.equal(K.leadOf({ sampleRate: 48000, getChannelData: () => new Float32Array(48000) }), 0, 'silence all through the window: from its start');
  const loud = new Float32Array(100).fill(0.9); assert.equal(K.leadOf({ sampleRate: 48000, getChannelData: () => loud }), 0, 'no lead-in: from its start');
  assert.equal(K.leadIn(null), 0); assert.equal(K.leadOf({}), 0, 'an odd buffer: from its start, never a throw');
  assert.deepEqual([K.LEAD_AT, K.LEAD_MAX], [0.003, 0.08]);
  // decodeOnce
  let n = 0, lands = 0;
  const ctx = { decodeAudioData(a, ok) { n++; setTimeout(() => ok(b), 15); } }, inFlight = new Map(), bytes = Promise.resolve(new ArrayBuffer(8));
  const ps = []; for (let i = 0; i < 10; i++) ps.push(K.decodeOnce(ctx, 'hop', bytes, inFlight, () => { lands++; }));
  const out = await Promise.all(ps);
  assert.deepEqual([n, lands, inFlight.size, out.every(x => x === b)], [1, 1, 0, true], 'ten asks while it runs = ONE decodeAudioData, landed once');
  let had = null;
  const bad = { decodeAudioData(a, ok, err) { n++; err(new Error('bad')); } };
  assert.equal(await K.decodeOnce(bad, 'x', bytes, inFlight, (buf, h) => { had = [buf, h]; }), null);
  assert.deepEqual([had, inFlight.size], [[null, true], 0], 'a failed decode: null, HAD bytes (the caller drops them), nothing kept in flight');
  assert.equal(await K.decodeOnce(bad, 'y', Promise.resolve(null), inFlight, (buf, h) => { had = [buf, h]; }), null);
  assert.deepEqual(had, [null, false], 'no bytes: no decode asked');
});

// ============================================================ 1 · the two games' sounds, muted / suspended / before a decode lands
const JW = await import(R + 'js/games/jaywalk/sfx.js');
const HR = await import(R + 'js/games/highrise/sfx.js');
const srcs = () => nodes.filter(x => x.kind === 'src' && x.started);

test('1: ten JAYWALK hops + ten HIGH RISE drops while MUTED decode NOTHING and keep NO listener; SUSPENDED = ONE wait a game; back = the files decoded ONCE; ten asks before a decode lands = ONE decode a file', async () => {
  const c = E.getContext();
  // -- the first fetch + decode (the unlock already happened: fetchSounds decodes at once)
  decodeMs = 0;
  JW.fetchSounds(); HR.fetchSounds();
  await settle(() => JW.decoded().length >= 10 && HR.ready());
  const jwFiles = JW.decoded().length, hrFiles = HR.decoded().length;
  assert.ok(jwFiles >= 10 && hrFiles >= 5, `decoded once: ${jwFiles} JAYWALK takes, ${hrFiles} HIGH RISE files`);
  const hrId = HR.SOUNDS[0].id;
  // -- MUTED: the context suspended by THE HUSH; the buffers are let go first (a fresh page that was muted before its first run)
  updateSettings({ muted: true });
  await settle(() => c.state === 'suspended');
  JW.release();
  let d0 = decodes, w0 = E.unlockWaiters();
  for (let i = 0; i < 10; i++) { JW.play('hop'); JW.onEvent({ e: 'hop' }); HR.play(hrId); }
  await sleep(60);
  assert.equal(decodes - d0, 0, `MUTED: 30 plays → 0 decodeAudioData (it was ${jwFiles} a call: 10 hops = ${jwFiles * 10})`);
  assert.deepEqual([E.unlockWaiters() - w0, JW.waiting(), HR.waiting()], [0, 0, 0], 'MUTED: no listener kept, nothing waits (NOTHING RUNS)');
  // -- UNMUTED but the context still asleep (interrupted — Siri, a call): ONE wait a game for its return
  updateSettings({ muted: false });
  c.set('interrupted'); await sleep(10);
  assert.equal(E.isUnlocked(), false);
  d0 = decodes; w0 = E.unlockWaiters();
  for (let i = 0; i < 10; i++) { JW.play('hop'); HR.play(hrId); }
  await sleep(40);
  assert.deepEqual([E.unlockWaiters() - w0, JW.waiting(), HR.waiting()], [0, 2, 2], 'suspended: nothing on onUnlock; each game waits ONCE on the context\'s return');
  assert.equal(decodes - d0, 0, 'nothing decoded while it waits');
  // -- it runs again: the wait fires ONCE — JAYWALK's files (let go above) are decoded ONCE each, never ×10
  decodeMs = 30;
  c.set('running');
  await settle(() => JW.decoded().length === jwFiles);
  await sleep(60);
  assert.equal(decodes - d0, jwFiles, `back: ${jwFiles} decodes — once a file (HIGH RISE's were still decoded)`);
  assert.deepEqual([JW.waiting(), HR.waiting()], [0, 0], 'the waits are gone');
  // -- ten hops asked BEFORE a decode lands (running, the buffers let go): ONE decode a file
  JW.release(); d0 = decodes;
  for (let i = 0; i < 10; i++) JW.play('hop');
  await settle(() => JW.decoded().length === jwFiles);
  assert.equal(decodes - d0, jwFiles, `ten hops before the decode lands: ${decodes - d0} decodes = one a file (it was ten a file)`);
  // -- and with everything ready: ten hops = ten sources, no decode, no wait
  await sleep(60); JW.stopAll();                               // (the late hops above each started — still fresh: let them end)
  decodeMs = 0; d0 = decodes; const s0 = srcs().length;
  for (let i = 0; i < 10; i++) JW.play('hop');
  assert.deepEqual([srcs().length - s0 >= 1, decodes - d0, JW.waiting()], [true, 0, 0]);
  JW.stopAll();
  const js = read('js/games/jaywalk/sfx.js'), hs = read('js/games/highrise/sfx.js');
  for (const [n, s] of [['jaywalk', js], ['highrise', hs]]) {
    assert.ok(!/lockWait/.test(s), `${n}: the per-call onUnlock wait is gone`);
    assert.equal((s.match(/onUnlock\(/g) || []).length, n === 'highrise' ? 2 : 1, `${n}: onUnlock only for the first decode${n === 'highrise' ? ' + whenReady (which takes its waiter back)' : ''}`);
    assert.match(s, /decodeOnce\(ctx, k, p, decoding,/, `${n}: ONE decode a file a context`);
  }
  assert.match(hs, /if \(audioUnlocked\(\) && audioHushed\(\)\) return;\s*lateId = id;/, 'HIGH RISE: muted = nothing made (no closure a drop)');
});

test('1: HIGH RISE\'s whenReady takes its waiter back — a call that times out before the first tap leaves nothing behind', () => {
  const hs = read('js/games/highrise/sfx.js');
  assert.match(hs, /const done = \(\) => \{ clearTimeout\(t\); if \(off\) \{ try \{ off\(\); \} catch \{ \/\* gone \*\/ \} off = null; \} res\(\); \};\s*const t = setTimeout\(done, ms\);\s*try \{ off = onUnlock\(/);
});

// ============================================================ 4 · THE LATE CUES + 6 · the nodes leave the graph
test('4 + 6: JAYWALK starts every sound at its first audible sample (the ONE helper, HIGH RISE\'s too); a voice\'s gain + panner LEAVE the graph when it ends', async () => {
  const c = E.getContext();
  if (c.state !== 'running') { c.set('running'); await sleep(20); }
  await settle(() => JW.decoded().length >= 10);
  const want = LEAD_SAMPLES / 48000 - 0.001;
  assert.ok(JW.decoded().every(x => Math.abs(x.lead - want) < 1e-3), 'every decoded take has its lead-in measured at the decode');
  const n0 = nodes.length;
  const h = JW.play('horn', { pan: -0.6 });
  assert.ok(h, 'the sound started');
  const mine = nodes.slice(n0), src = mine.find(x => x.kind === 'src'), g = mine.find(x => x.kind === 'gain'), pn = mine.find(x => x.kind === 'pan');
  assert.ok(src && g && pn, 'a source, its gain, its panner');
  assert.equal(src.started[0], 0, 'now');
  assert.ok(Math.abs(src.started[1] - want) < 1e-6, `started ${Math.round(src.started[1] * 1000)} ms in — past the MP3's lead-in (it was 0: the cue sounded late)`);
  assert.ok(!g.gone && !pn.gone, 'wired while it sounds');
  assert.equal(JW.sounding(), 1);
  src.end();                                                   // the sound ends
  assert.deepEqual([JW.sounding(), !!g.gone, !!pn.gone, !!src.gone], [0, true, true, true], 'its gain + its panner are out of the graph (they stayed wired to the limiter for the page\'s life)');
  // HIGH RISE through the same helper
  await settle(() => HR.ready());
  const n1 = nodes.length;
  assert.equal(HR.play(HR.SOUNDS[0].id), true);
  const hsrc = nodes.slice(n1).find(x => x.kind === 'src');
  assert.ok(Math.abs(hsrc.started[1] - want) < 1e-6, 'HIGH RISE: the same lead-in, the same helper');
  HR.stopAll();
  const js = read('js/games/jaywalk/sfx.js'), hs = read('js/games/highrise/sfx.js');
  assert.match(js, /import \{ leadIn, lateGate, decodeOnce \} from '\.\.\/\.\.\/audio\/sfx-kit\.js';/);
  assert.match(hs, /import \{ leadOf, leadIn, LEAD_AT, LEAD_MAX, lateGate, decodeOnce \} from '\.\.\/\.\.\/audio\/sfx-kit\.js';/);
  assert.ok(!/function leadOf/.test(hs) && !/function leadOf/.test(js), 'ONE leadOf (audio/sfx-kit.js) — no game keeps its own');
  assert.match(js, /src\.start\(0, lead\);/); assert.match(hs, /src\.start\(t \+ delay, leadIn\(buf\)\);/);
  assert.equal(HR.leadOf, K.leadOf, 'HIGH RISE re-exports the shared one');
  // (zero garbage kept: the play path of both games makes nothing for the lead-in — a WeakMap read)
  assert.match(read('js/audio/sfx-kit.js'), /const leads = new WeakMap\(\);/);
});

// ============================================================ 2 · THE LEAVE CUT ORDER (engine.js + the real music.js)
const M = await import(R + 'js/audio/music.js');
test('2: THE LEAVE CUT ORDER — the ramp scheduled FIRST; the DIRECT element paused at t = 0; the ROUTED voices only after LEAVE_S, under silence; the loops after them; back before that = never paused; the record says both moments', async () => {
  updateSettings({ musicOff: false, sfxOff: false, muted: false });
  const c = E.getContext();
  if (c.state !== 'running') { c.set('running'); }
  await sleep(450);                                             // (a blur is honoured as a leave once the page has been up a moment)
  doc.fire('touchend'); await sleep(30);                        // music.js's voices are made at the unlock / a tap
  const routed = els.filter(e => e.crossOrigin === 'anonymous'), direct = els.filter(e => e.crossOrigin !== 'anonymous');
  assert.ok(routed.length === 3 && direct.length === 1, `music.js made 3 routed voices + the direct element (${routed.length} + ${direct.length})`);
  assert.deepEqual([E.FADE.leaveS, E.MEDIA_LATE_MS], [0.025, 30], 'LEAVE_S 25 ms; the routed voices 5 ms after it');
  const play = (el, src) => { el.src = src; el.paused = false; el.pauses.length = 0; };
  const song = 'http://localhost/audio/music/c2-evening2.mp3';
  let bedAt = -1;
  const offBed = E.holdBed({ pause: () => { if (bedAt < 0) bedAt = at(); order.push({ w: 'beds', t: at() }); }, resume: () => {} });
  const seen = [];
  const offCut = E.onLeaveCut((left, why, late) => { seen.push({ left, late: !!late, t: at() }); order.push({ w: left ? (late ? 'media: routed' : 'media: direct') : 'media: back', t: at() }); });

  // ---- a leave (a touch phone's blur), the song on a ROUTED voice + the direct element playing too
  play(routed[0], song); play(direct[0], song); play(routed[1], 'blob:silent');
  order.length = 0; seen.length = 0; bedAt = -1;
  const t0 = at();
  win.fire('blur');
  // … in the blur's own step:
  assert.deepEqual(order.slice(0, 2).map(x => x.w), ['master ramp → 0', 'media: direct'], 'the master\'s ramp is scheduled BEFORE the media cut');
  assert.equal(direct[0].paused, true, 'the DIRECT element is paused at once (iOS ignores its volume: a pause is its only clean stop)');
  assert.equal(routed[1].paused, true, 'a voice on its silent blob too (nothing to click)');
  assert.equal(routed[0].paused, false, 'the ROUTED voice is NOT paused yet — the master is still ramping (a pause under full gain is a click)');
  assert.deepEqual(E.mediaCutState().late, true);
  assert.match(E.mediaCutState().after, /UNDER THE RAMP/, 'the record names it: under the ramp, never "PLAYING"');
  await settle(() => routed[0].paused, 1000);
  assert.equal(routed[0].paused, true, 'paused once the ramp has run');
  const lateAt = routed[0].pauses[0] - t0;
  assert.ok(lateAt >= E.FADE.leaveS * 1000 - 1, `the routed voice paused ${lateAt} ms after the cut — never before LEAVE_S (${E.FADE.leaveS * 1000} ms)`);
  await settle(() => bedAt >= 0, 1000);
  assert.ok(bedAt - t0 >= lateAt - 1, `the loops stop after the routed voices (${bedAt - t0} ms ≥ ${lateAt} ms)`);
  assert.deepEqual(seen.filter(x => x.left).map(x => x.late), [false, true], 'the listeners are told twice: at once, then after the ramp');
  assert.equal(E.mediaCutState().after, 'all paused');
  const rec = JSON.parse(store['ns:audioleave'] || 'null');
  if (rec) {
    const sigs = rec.sig.map(x => x.s);
    assert.ok(sigs.some(s => /^media after: .*UNDER THE RAMP/.test(s)) && sigs.includes('media after the ramp: all paused'), `THE LEAVE RECORD has both moments (${sigs.filter(s => /^media/.test(s)).join(' | ')})`);
  }
  win.fire('focus'); await sleep(450);                           // back on screen

  // ---- a blur that comes straight back (the share sheet, an alert): the routed voice is NEVER paused
  play(routed[0], song); seen.length = 0;
  win.fire('blur');
  assert.equal(routed[0].paused, false);
  win.fire('focus');                                             // back within the 30 ms
  await sleep(120);
  assert.deepEqual(routed[0].pauses, [], 'back before the ramp ran: the routed voice was never paused by the cut');
  assert.deepEqual(seen.map(x => (x.left ? (x.late ? 'late' : 'cut') : 'back')), ['cut', 'back'], 'no late step after a return');

  // ---- hidden (the real leave): the same order, then the zeros, then the suspend
  await sleep(450);
  play(routed[0], song); play(direct[0], song); order.length = 0;
  const s0 = c.suspends, th = at();
  doc.visibilityState = 'hidden'; doc.hidden = true; doc.fire('visibilitychange');
  assert.equal(direct[0].paused, true); assert.equal(routed[0].paused, false);
  await settle(() => c.suspends > s0, 2000);
  const tSusp = at() - th;
  assert.equal(routed[0].paused, true);
  assert.ok(routed[0].pauses[0] - th >= 24 && routed[0].pauses[0] - th < tSusp, `ramp → routed voices (${routed[0].pauses[0] - th} ms) → the suspend (${tSusp} ms)`);
  assert.ok(tSusp >= E.FADE.leaveSuspendMs - 2, `THE ZEROS FIRST: the suspend ${tSusp} ms after the cut (≥ ${E.FADE.leaveSuspendMs})`);
  const names = order.map(x => x.w), iR = names.indexOf('master ramp → 0'), iD = names.indexOf('media: direct'), iL = names.indexOf('media: routed'), iB = names.indexOf('beds');
  assert.ok(iR === 0 && iD > iR && iL > iD && iB > iL, `THE CUT IN ONE ORDER: ${names.join(' → ')}`);
  doc.visibilityState = 'visible'; doc.hidden = false; doc.fire('visibilitychange'); c.set('running'); await sleep(50);
  offBed(); offCut();
  // MUTED = NOTHING RUNS is untouched: the hush still pauses every element at once
  const ms = read('js/audio/music.js'), es = read('js/audio/engine.js');
  assert.match(ms, /if \(!late && !x\.direct && !blob\) continue;/, 'music.js: a routed voice with a song waits for the late step');
  assert.match(es, /quiet\(c, LEAVE_S\);\s*mediaCut\(true, why\);/, 'fadeOut: the ramp, then the media cut');
  assert.match(es, /if \(master && ctx\.state === 'running'\) \{ quiet\(ctx, LEAVE_S\); cutStart\('leave'\); audioLog\('blur — the master 0 at once'\); \}\s*mediaCut\(true, 'blur'\);/, 'onBlur: the ramp, then the media cut');
  assert.match(es, /if \(!mediaCutOn\) return;/, 'the late step only while the page is still left');
});

test('2: the AUDIO LEAVE row names both moments — "media after: … UNDER THE RAMP → after the ramp: all paused"; one moment when they agree', async () => {
  const T = await import(R + 'js/audio/leave-text.js');
  const base = { at: 1, sess: 'playback', sound: 'MUSIC ON', first: { ctx: 'running' }, left: true };
  const two = T.leaveReportText({ ...base, sig: [{ s: 'blur', ms: 0 }, { s: 'media after: voice m:x UNDER THE RAMP (routed — paused once the master is 0)', ms: 0 }, { s: 'media after the ramp: all paused', ms: 30 }, { s: 'hidden', ms: 40 }] });
  assert.match(two.split('\n')[0], /media after: voice m:x UNDER THE RAMP \(routed — paused once the master is 0\) → after the ramp: all paused$/);
  assert.match(two.split('\n')[0], /blur → hidden \+40 ms/, 'the media notes are not signals in the order');
  const one = T.leaveReportText({ ...base, sig: [{ s: 'blur', ms: 0 }, { s: 'media after: all paused', ms: 0 }, { s: 'media after the ramp: all paused', ms: 30 }] });
  assert.match(one.split('\n')[0], /media after: all paused$/);
  const frozen = T.leaveReportText({ ...base, sig: [{ s: 'hidden', ms: 0 }, { s: 'media after: voice m:x UNDER THE RAMP (routed — paused once the master is 0)', ms: 0 }] });
  assert.match(frozen.split('\n')[0], /UNDER THE RAMP[^→]*$/, 'a page frozen before the late step: the first moment, as it was');
});

// ============================================================ 5 · iOS's context rebuild
test('5: JAYWALK after iOS\'s context REBUILD — its voices stopped + let go, the bus / the buffers / the loop handles the new context\'s; the bell comes back; HIGH RISE\'s voices are free again', async () => {
  const c0 = E.getContext();
  if (c0.state !== 'running') { c0.set('running'); await sleep(20); }
  await settle(() => JW.decoded().length >= 10 && HR.ready());
  const h = JW.play('horn');
  JW.onCue({ cue: 'bell-on' });                                 // the train's bell: ONE loop held while the signals flash
  HR.play(HR.SOUNDS[0].id);
  assert.ok(h && JW.sounding() >= 2 && HR.sounding() >= 1, 'voices sounding on the old context');
  const oldSrcs = nodes.filter(x => x.kind === 'src' && x.ctx === c0 && x.started && !x.stopped);
  // the context goes bad: asked to resume, never does → stuck → the next tap replaces it (engine.js#rebuild)
  E.simulateStuck('interrupted');
  await settle(() => E.audioStuck(), 3000);
  assert.equal(E.audioStuck(), true);
  const d0 = decodes; decodeMs = 0;
  doc.fire('touchend');                                         // the tap: a fresh AudioContext
  const c1 = E.getContext();
  assert.notEqual(c1, c0, 'a new context');
  assert.equal(JW.sounding(), 0, 'JAYWALK: nothing counted as sounding (the old context\'s voices would never end — the cap filled for good)');
  assert.equal(HR.sounding(), 0, 'HIGH RISE: every voice free again');
  assert.ok(oldSrcs.filter(x => x.ctx === c0 && x.gone).length >= 2, 'JAYWALK\'s old voices are out of the graph (the closed context is silent: let go, never a dead stop)');
  c1.set('running');
  await settle(() => JW.decoded().length >= 10 && HR.ready());
  assert.ok(decodes - d0 >= 10, 'decoded again for the new context');
  await sleep(30);
  // the bell's signals were still flashing: it is back, on the NEW context
  const bells = nodes.filter(x => x.kind === 'src' && x.ctx === c1 && x.started && x.loop);
  assert.ok(bells.length >= 1, 'the bell loop restarted on the new context (its handle pointed at a dead source)');
  const n0 = nodes.length;
  assert.ok(JW.play('horn'), 'a sound plays on the new context');
  const mine = nodes.slice(n0);
  assert.ok(mine.find(x => x.kind === 'src').ctx === c1 && mine.every(x => x.ctx === c1), 'every node of it is the new context\'s');
  JW.onCue({ cue: 'bell-off' }); JW.stopAll(); HR.stopAll();
  assert.match(read('js/games/jaywalk/sfx.js'), /onRebuild\(\(\) => \{\s*for \(const v of \[\.\.\.live\]\) \{[^\n]*unwire\(v\); \}[^\n]*\n\s*live\.clear\(\); bus = null; busCtx = null; bufs\.clear\(\); decoding\.clear\(\); gate\.reset\(\); bufCtx = null;\s*bell = null; tick = null;/);
});

// ============================================================ 3 · a failed load is not kept for the session
test('3: a FAILED fetch / decode is forgotten (the next ask loads again) — flyers, the city\'s ambience, the dailies, OVERCLOCK; decoded from a copy where the bytes are kept', async () => {
  const fl = read('js/games/jaywalk/flyers.js'), am = read('js/audio/ambience.js'), dl = read('js/daily/sfx.js'), oc = read('js/games/overclock/sfx.js');
  assert.match(fl, /\.then\(a => \{ if \(!a\) sndRetry\(bytes, n, p\); return a; \}\)/, 'flyers: a failed fetch');
  assert.match(fl, /\.then\(b => \{ if \(!b\) \{ sndRetry\(bufs, n, p\); sndRetry\(bytes, n, bytes\.get\(n\)\); \} return b \|\| null; \}\)/, 'flyers: a failed decode (its bytes too)');
  assert.match(am, /function loadOnce\(map, name, ctx, url\) \{[\s\S]{0,420}if \(!b\) setTimeout\(\(\) => \{ if \(map\.get\(name\) === p\) map\.delete\(name\); \}, RETRY_MS\);/, 'ambience: ONE loader for the neon + the weather');
  assert.equal((am.match(/loadOnce\(/g) || []).length, 3, 'ambience: both caches through it');
  assert.ok(!/\.then\(b => ctx\.decodeAudioData\(b\)\)\.catch\(\(\) => null\)\)/.test(am), 'ambience: no null cached for good');
  for (const [n, s] of [['the dailies', dl], ['OVERCLOCK', oc]]) {
    assert.match(s, /if \(!a\) retryLater\(/, `${n}: a failed fetch`);
    assert.match(s, /if \(!b\) \{ retryLater\(bufs, file, null\); retryLater\(/, `${n}: a failed decode`);
    assert.match(s, /ctx\.decodeAudioData\(a\.slice\(0\), res, rej\)/, `${n}: decoded from a copy (the bytes are kept for the next context)`);
    assert.ok(!/bufs\.set\(file, null\); return null; \}\)/.test(s), `${n}: the old "null for the session" is gone`);
  }
  for (const s of [fl, am, dl, oc]) assert.match(s, /RETRY_MS = 8000/, 'forgotten 8 s later — never a request a frame while a file is missing');
  // behaviour, on the dailies' engine (a factory: a fresh one here): the file fails, then loads once the line is back
  const D = await import(R + 'js/daily/sfx.js');
  assert.equal(typeof D.createDailySfx, 'function');
});

// ============================================================ 7 · the small ones
test('7: the lobby song joins the music\'s ONE input; OVERCLOCK\'s loop reads the live context on a restart + its gain leaves the graph', () => {
  const lm = read('js/audio/lobby-music.js'), pm = read('js/audio/party-music.js'), oc = read('js/games/overclock/sfx.js');
  assert.match(lm, /g\.connect\(musicInput\(\) \|\| getMusicBus\(\)\); return g; \}/, 'lobby-music: musicInput(), the bus = the fallback');
  assert.match(pm, /outGain\.connect\(musicInput\(\) \|\| getMusicBus\(\)\)/, '… as party-music.js');
  assert.match(lm, /import \{ nowPlaying, handoffFade, musicInput \} from '\.\/music\.js';/);
  assert.match(oc, /const live = getContext\(\);\s*if \(live && live !== ctx\) \{ try \{ g\.disconnect\(\); \} catch \{ \/\* the old context \*\/ \} ctx = live; g = ctx\.createGain\(\);/, 'ocLoop: the context read again on a (re)start');
  assert.match(oc, /setTimeout\(\(\) => \{ try \{ gg\.disconnect\(\); \} catch \{ \/\* gone \*\/ \} \}, ms \+ 250\);/, 'ocLoop: its gain out of the graph after the fade');
});

test('7: THE SONG CAP (sw.js) — the songs kept are capped, least recently USED out first; the newest three always stay (the song playing + the station\'s next); the effects are never counted', () => {
  const sw = read('sw.js');
  const body = /function audioEvictions\(index, max, keep\) \{[\s\S]*?\n\}/.exec(sw);
  assert.ok(body, 'the PURE rule is in sw.js');
  const evict = new Function(`${body[0]}; return audioEvictions;`)();
  const MB = 1048576, idx = {};
  for (let i = 0; i < 20; i++) idx[`/audio/music/s${i}.mp3?v=1`] = { t: 1000 + i, z: 5 * MB };   // 20 songs × 5 MB = 100 MB, s19 the newest
  const out = evict(idx, 60 * MB, 3);
  assert.equal(out.length, 8, '100 MB of songs under a 60 MB cap: the 8 oldest go (12 × 5 MB stay)');
  assert.deepEqual(out.slice().sort(), Array.from({ length: 8 }, (_, i) => `/audio/music/s${i}.mp3?v=1`).sort(), 'the LEAST recently used');
  assert.deepEqual(evict(idx, 60 * MB, 3).includes('/audio/music/s19.mp3?v=1'), false);
  // a use (the song playing: every range request) moves a song to the front
  idx['/audio/music/s0.mp3?v=1'].t = 5000;
  assert.equal(evict(idx, 60 * MB, 3).includes('/audio/music/s0.mp3?v=1'), false, 'a song just USED is kept');
  // the newest three stay whatever their size
  const big = { a: { t: 3, z: 50 * MB }, b: { t: 2, z: 50 * MB }, c: { t: 1, z: 50 * MB }, d: { t: 0, z: 1 * MB } };
  assert.deepEqual(evict(big, 60 * MB, 3), ['d'], 'the three most recently used are never evicted, even over the cap');
  assert.deepEqual(evict({}, 60 * MB, 3), []); assert.deepEqual(evict(idx, 1e12, 3), [], 'under the cap: nothing goes');
  assert.deepEqual(evict({ x: { t: 1 }, y: {} }, 10, 0), [], 'a row with no size yet weighs nothing (audioTrim fills it from Content-Length first)');
  // the wiring
  assert.match(sw, /const SONG_RE = \/\^\\\/audio\\\/music\\\/\/;/, 'the SONGS only (/audio/music/) — the effects are each game\'s small set');
  assert.match(sw, /let AUDIO_SONG_MAX = 60 \* 1048576, AUDIO_KEEP_NEWEST = 3;/);
  assert.match(sw, /if \(SONG_RE\.test\(url\.pathname\)\) event\.waitUntil\(audioTouch\(url\.href, 0\)\);/, 'a hit is a use');
  assert.match(sw, /if \(SONG_RE\.test\(url\.pathname\)\) \{ await audioTouch\(url\.href, size\); await audioTrim\(c\); \}/, 'a kept song is a use + the cap applied');
  assert.match(sw, /for \(const h of audioEvictions\(A, AUDIO_SONG_MAX, AUDIO_KEEP_NEWEST\)\) \{ await c\.delete\(h\); delete A\[h\]; stats\.audioEvicted\+\+; \}/);
  assert.match(sw, /d\.t === 'ns:test-audio-cap' && \/\^\(localhost\|127\\\.0\\\.0\\\.1\)\$\/\.test\(self\.location\.hostname\)/, 'the test rig only on a local host');
});
