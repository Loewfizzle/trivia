// FIXES R1 — THE SQUEAL IN THE HOME-SCREEN APP + THE REVIEW A7 / A15: the REAL js/audio/engine.js driven by a fake DOM + a fake AudioContext
// through the signal orders a saved home-screen app (standalone) gets from iOS — often NO blur, a late or missing visibilitychange, the
// context INTERRUPTED as the app goes and RESUMED by the OS before the page's JS runs again. What it proves: the master is 0 (and every bed
// stopped) from the first leave signal; nothing sounds while the page is away; back on screen the master ramps up from 0 only once the context
// RUNS, the beds with it. What it can't prove: what a real iPhone's Core Audio does with its own buffers — that is the device check.
// (the browser twin, Chromium: tests/integration/audio-leave.mjs — Playwright's WebKit on Windows has no Web Audio at all)
import test from 'node:test';
import assert from 'node:assert/strict';

const mkTarget = () => { const L = {}; return { L, addEventListener(t, fn) { (L[t] ||= []).push(fn); }, removeEventListener() {}, fire(t, e = {}) { for (const fn of L[t] || []) fn({ type: t, ...e }); } }; };
const doc = mkTarget(); doc.visibilityState = 'visible'; doc.hidden = false;
const win = mkTarget();
globalThis.document = doc;
globalThis.window = win;
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
globalThis.location = { search: '' };
globalThis.matchMedia = q => ({ matches: /coarse/.test(q) });   // a touch phone
try { Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true }); } catch { /* fine */ }

class Param { constructor(v = 1) { this.value = v; } cancelScheduledValues() {} setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } setTargetAtTime(v) { this.value = v; } }
class Node_ { constructor() { this.gain = new Param(1); this.threshold = new Param(); this.knee = new Param(); this.ratio = new Param(); this.attack = new Param(); this.release = new Param(); } connect(x) { return x; } disconnect() {} start() {} stop() {} }
class FakeAC {
  constructor() { this.state = 'running'; this.currentTime = 1; this.destination = new Node_(); this.onstatechange = null; this.resumes = 0; this.suspends = 0; }
  createGain() { return new Node_(); } createDynamicsCompressor() { return new Node_(); } createBufferSource() { return new Node_(); } createBuffer() { return {}; }
  set(s) { this.state = s; if (this.onstatechange) this.onstatechange(); }
  resume() { this.resumes++; return new Promise(() => {}); }   // the OS decides: the test says when it runs (set('running'))
  suspend() { this.suspends++; this.set('suspended'); return Promise.resolve(); }
  close() { return Promise.resolve(); }
}
win.AudioContext = FakeAC;
// (the engine's clock watch is a setInterval: unref'd here, so the test process ends)
const setI = globalThis.setInterval;
globalThis.setInterval = (fn, ms, ...a) => { const t = setI(fn, ms, ...a); if (t && t.unref) t.unref(); return t; };

const E = await import('../js/audio/engine.js');
const { updateSettings } = await import('../js/audio/settings.js');
E.installAudio();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ctx = () => E.getContext();
const master = () => E.audioHealth().master;
const vis = v => { doc.visibilityState = v ? 'visible' : 'hidden'; doc.hidden = !v; doc.fire('visibilitychange'); };
let bed = 'playing';
E.holdBed({ pause() { bed = 'stopped'; }, resume() { bed = ctx() && ctx().state === 'running' ? 'playing' : 'NOT RESTARTED'; } });

test('the first tap: unlocked, running, the master at 1', () => {
  doc.fire('touchend');
  assert.equal(ctx().state, 'running'); assert.equal(master(), 1);
});

test('THE REVIEW A7 — a blur, the OS interrupts meanwhile, the context runs again: the master back to 1 + the bed back (it stayed at 0)', async () => {
  win.fire('blur');
  assert.equal(master(), 0, 'the blur: silent at once');
  assert.equal(bed, 'stopped');
  ctx().set('interrupted');
  await sleep(450);                         // (BLUR_BACK_MS → blurBack: the context isn't running — the fade stays PENDING, a resume asked)
  assert.equal(master(), 0, 'still silent while the OS holds it');
  win.fire('focus');
  ctx().set('running');
  await sleep(30);
  assert.equal(master(), 1, 'the master ramps back once it runs');
  assert.equal(bed, 'playing', 'the bed back with it');
});

test('THE HOME-SCREEN APP LEAVING: the INTERRUPTION comes first (no blur, no hidden yet) → silent at once + the bed stopped; no resume fought on the way out', async () => {
  const c = ctx(), r0 = c.resumes;
  c.set('interrupted');
  assert.equal(master(), 0, 'the master 0 at the interruption itself');
  assert.equal(bed, 'stopped');
  vis(false);                               // (the late visibilitychange)
  await sleep(450);
  assert.equal(c.resumes, r0, 'no resume asked while the app went away');
  assert.equal(master(), 0);
});

test('THE OS RESUMES IT IN THE BACKGROUND (before the page is back): silenced + suspended at once — nothing sounds off screen', async () => {
  const c = ctx(), s0 = c.suspends;
  c.set('running');
  assert.equal(master(), 0, 'silent'); assert.equal(c.suspends, s0 + 1, 'suspended at once'); assert.equal(c.state, 'suspended');
  assert.equal(bed, 'stopped', 'the beds stay stopped');
});

test('COMING BACK: the master stays at 0 until the context RUNS, then ramps up from 0 — the bed with it (no burst)', async () => {
  const c = ctx(), r0 = c.resumes;
  vis(true);
  assert.ok(c.resumes > r0, 'a resume asked on the return');
  assert.equal(master(), 0, 'nothing before it runs');
  assert.equal(bed, 'stopped');
  c.set('running');
  await sleep(10);
  assert.equal(master(), 1); assert.equal(bed, 'playing');
});

test('a return signalled ONLY by focus (no visibilitychange — the app got a blur alone): the fade still waits for running', async () => {
  win.fire('blur'); ctx().set('interrupted');
  assert.equal(master(), 0);
  win.fire('focus');                        // (blurBack at once: the context isn't running → pending + a resume)
  assert.equal(master(), 0);
  ctx().set('running');
  await sleep(10);
  assert.equal(master(), 1); assert.equal(bed, 'playing');
});

test('THE REVIEW A15 — a context that runs while HUSHED (muted) is hushed again: NOTHING RUNS', async () => {
  updateSettings({ muted: true });
  await sleep(150);                         // (the hush: the master to 0, the suspend after its ramp)
  const c = ctx();
  if (c.state !== 'suspended') c.set('suspended');
  c.set('running');                         // (Chrome / Android: a context that starts itself)
  await sleep(150);
  assert.equal(master(), 0, 'silent');
  assert.equal(c.state, 'suspended', 'suspended again');
  updateSettings({ muted: false });
});
