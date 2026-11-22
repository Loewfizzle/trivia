// THE FIX PASS (Nov 22 — THE FABLE REVIEW's P4 + P5) on the REAL js/audio/engine.js + synced-songs.js over a fake DOM + AudioContext (the
// review's own harness, agent-audio/harness.mjs — the audio-session.test.mjs pattern). P5: the music off (HEAR THE HARBOR, ALL OFF) = NO song
// fetched, NO decode; the music on = the window loaded. P4: an ON-SCREEN interruption (Siri, a call banner) then 'running' again — the next
// real leave still runs THE MEDIA CUT in its own step (the latch is cleared).
import test from 'node:test';
import assert from 'node:assert/strict';

function setup({ timeline = false } = {}) {
  const mkTarget = () => { const L = {}; return { L, addEventListener(t, fn) { (L[t] ||= []).push(fn); }, removeEventListener() {}, fire(t, e = {}) { for (const fn of L[t] || []) fn({ type: t, ...e }); } }; };
  const doc = mkTarget(); doc.visibilityState = 'visible'; doc.hidden = false; doc.body = { classList: { contains: () => false } };
  doc.querySelectorAll = () => [];
  const win = mkTarget();
  globalThis.document = doc; globalThis.window = win;
  const store = {};
  globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  globalThis.location = { search: '' };
  globalThis.matchMedia = q => ({ matches: /coarse/.test(q) });
  const sessLog = [];
  const session = { _t: '', get type() { return this._t; }, set type(v) { sessLog.push({ to: v, ctx: cur ? cur.state : 'none', master: masterOf ? masterOf() : null }); this._t = v; } };
  let cur = null, masterOf = null;
  try { Object.defineProperty(globalThis, 'navigator', { value: { audioSession: session, userAgent: 'iPhone OS 18_7', standalone: true, sendBeacon: () => true }, configurable: true }); } catch { /* fine */ }
  globalThis.Blob = class { constructor(parts) { this.text = parts.join(''); } };
  const nodes = [];
  class Param { constructor(v = 1) { this._v = v; } get value() { return this._v; } set value(v) { this._v = v; } cancelScheduledValues() {} setValueAtTime(v) { this._v = v; } linearRampToValueAtTime(v) { this._v = v; } setTargetAtTime(v) { this._v = v; } setValueCurveAtTime(c) { this._v = c[c.length - 1]; } exponentialRampToValueAtTime(v) { this._v = v; } }
  class Node_ { constructor(kind) { this.kind = kind; this.outs = []; this.gain = new Param(1); this.pan = new Param(0); this.frequency = new Param(0); this.Q = new Param(0); this.playbackRate = new Param(1); this.threshold = new Param(); this.knee = new Param(); this.ratio = new Param(); this.attack = new Param(); this.release = new Param(); nodes.push(this); }
    connect(x) { this.outs.push(x); return x; } disconnect() { this.gone = true; } start() { this.started = true; } stop() { this.stopped = true; const f = this._end; this._end = null; if (f) f(); if (this.onended) this.onended(); } addEventListener(t, fn) { if (t === 'ended') this._end = fn; } }
  class FakeAC {
    get currentTime() { const n = performance.now(); if (this.state === 'running') this._t += (n - this._at) / 1000; this._at = n; return this._t; }
    constructor() { this.state = 'running'; this._t = 1; this._at = performance.now(); this.destination = new Node_('dest'); this.onstatechange = null; this.resumes = 0; this.suspends = 0; this.sampleRate = 48000; cur = this; this._L = []; }
    createGain() { return new Node_('gain'); } createDynamicsCompressor() { return new Node_('comp'); } createBufferSource() { return new Node_('src'); } createOscillator() { return new Node_('osc'); } createBuffer() { return { blip: true }; }
    createWaveShaper() { return new Node_('ws'); } createStereoPanner() { return new Node_('pan'); } createBiquadFilter() { return new Node_('bq'); } createAnalyser() { return new Node_('an'); }
    decodeAudioData(ab, ok) { const b = { duration: 60, length: 60 * 32000, numberOfChannels: 1, sampleRate: 32000 }; if (ok) ok(b); return Promise.resolve(b); }
    addEventListener(t, fn) { this._L.push(fn); } removeEventListener() {}
    set(s) { this.state = s; if (this.onstatechange) this.onstatechange(); for (const fn of this._L) fn(); }
    resume() { this.resumes++; return new Promise(() => {}); }
    suspend() { this.suspends++; this.set('suspended'); return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
  }
  win.AudioContext = FakeAC;
  const setI = globalThis.setInterval;
  globalThis.setInterval = (fn, ms, ...a) => { const t = setI(fn, ms, ...a); if (t && t.unref) t.unref(); return t; };
  return { doc, win, session, sessLog, nodes, store, setMaster: f => { masterOf = f; } };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

const { doc, win } = setup();
globalThis.Audio = class { constructor() { this.paused = true; } addEventListener() {} removeEventListener() {} play() { return Promise.resolve(); } pause() {} load() {} setAttribute() {} removeAttribute() {} };
const fetched = [];
let decodes = 0;
globalThis.fetch = async u => { fetched.push(String(u).split('/').pop()); return { ok: true, status: 200, headers: { get: () => null }, body: null, arrayBuffer: async () => new ArrayBuffer(2_500_000), blob: async () => ({}) }; };
win.OfflineAudioContext = class { decodeAudioData(ab, ok) { decodes++; ok({ duration: 180, length: 180 * 44100, numberOfChannels: 2, sampleRate: 44100 }); } };
const R = new URL('../', import.meta.url).href;
const E = await import(R + 'js/audio/engine.js');
const { updateSettings } = await import(R + 'js/audio/settings.js');
const S = await import(R + 'js/audio/synced-songs.js');
const M = await import(R + 'js/audio/music.js');
const { serverNow } = await import(R + 'js/firebase.js');
E.installAudio();
updateSettings({ musicOff: false, sfxOff: false, muted: false });
doc.fire('touchend');
await sleep(350);

async function songsWith(prefs, tag) {
  fetched.length = 0; decodes = 0;
  updateSettings({ musicOff: false, sfxOff: false, muted: false, ...prefs });
  await sleep(50);
  const player = S.createSyncedSongs({ urlFor: id => `/audio/music/${id}.mp3`, label: 'station', connect: ctx => ctx.createGain() });
  player.setGame({ matchId: `w-${tag}`, songs: [`${tag}-a`, `${tag}-b`], sd: [180000, 180000], songStartAt: serverNow() - 150000 });
  for (let i = 0; i < 8; i++) { player.tick(); await sleep(40); }
  const pre = M.prefetch('lobby');
  await sleep(30);
  player.stop(0);
  return { fetches: fetched.filter(f => f.endsWith('.mp3')).length, decodes, pre };
}

test('P5: the music OFF (HEAR THE HARBOR, ALL OFF) = no song fetched or decoded; the music ON loads the window', async () => {
  const on = await songsWith({}, 'on');
  assert.ok(on.fetches >= 1 && on.decodes >= 1, `the music on: ${on.fetches} fetches, ${on.decodes} decodes`);
  for (const [name, prefs] of [['HEAR THE HARBOR', { musicOff: true }], ['ALL OFF', { musicOff: true, sfxOff: true }]]) {
    const r = await songsWith(prefs, name.replace(/\W/g, '').slice(0, 5));
    assert.deepEqual({ fetches: r.fetches, decodes: r.decodes, pre: r.pre }, { fetches: 0, decodes: 0, pre: null }, `${name}: no song downloaded, none decoded, no prefetch`);
  }
  updateSettings({ musicOff: false, sfxOff: false, muted: false });
});

test('P4: after an ON-SCREEN interruption comes back, the next real leave still runs THE MEDIA CUT in its own step', async () => {
  updateSettings({ musicOff: false, sfxOff: false, muted: false });
  doc.visibilityState = 'visible'; doc.hidden = false; doc.fire('visibilitychange');
  const c = E.getContext();
  c.set('running'); await sleep(450);
  const cuts = [];
  const off = E.onLeaveCut(left => cuts.push(left ? 'CUT' : 'BACK'));
  c.set('interrupted');                       // Siri / a call banner, the page still on screen
  assert.equal(E.mediaCutState().on, true, 'the interruption cuts the media');
  c.set('running'); await sleep(50);          // the OS gives it back — no blur, no hide
  assert.equal(E.mediaCutState().on, false, 'P4: the latch is cleared once it runs again on screen');
  cuts.length = 0;
  win.fire('blur');                           // a REAL leave
  assert.deepEqual(cuts, ['CUT'], 'the leave-cut listeners run in the blur’s own step');
  win.fire('focus'); await sleep(450);
  off();
});
