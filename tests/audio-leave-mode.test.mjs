// FIXES R3 — THE SQUEAL ON LEAVING THE HOME-SCREEN APP: the REAL js/audio/engine.js on a fake DOM + a fake AudioContext (the harness of
// audio-standalone.test.mjs). What it proves off the device: (1) THE LEAVE RECORD — every leave signal is in localStorage the moment it
// fires (no await before it: a page iOS freezes right after still has it) and goes out as ONE AUDIO LEAVE row on the return, or at the next
// load when the page never came back; a blur that stays on screen is no leave. (2) THE LEAVE MODES — A sleeps the context between effects
// with the music off (the music's elements told to rest) and the next sound wakes it; B closes the context on the first leave signal and
// builds a fresh one on the return (the master from 0); C1 / C2 set the audio session's type and keep it. (3) MUTED = NOTHING RUNS in every
// mode. What it can't prove: what an iPhone's Core Audio does — the owner's ear + the row in /admin.
import test from 'node:test';
import assert from 'node:assert/strict';

const mkTarget = () => { const L = {}; return { L, addEventListener(t, fn) { (L[t] ||= []).push(fn); }, removeEventListener() {}, fire(t, e = {}) { for (const fn of L[t] || []) fn({ type: t, ...e }); } }; };
const doc = mkTarget(); doc.visibilityState = 'visible'; doc.hidden = false; doc.body = { classList: { contains: () => false } };
const win = mkTarget();
globalThis.document = doc;
globalThis.window = win;
const store = {};
let syncWrites = 0;
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); syncWrites++; }, removeItem: k => { delete store[k]; } };
globalThis.location = { search: '?debug=1' };   // (the row goes out from the owner's phone or &debug=1)
globalThis.matchMedia = q => ({ matches: /coarse/.test(q) });   // a touch phone
const sent = [];
const session = { type: '' };
try { Object.defineProperty(globalThis, 'navigator', { value: { audioSession: session, userAgent: 'iPhone OS 18_7', standalone: true, sendBeacon: (u, b) => { sent.push({ u, b }); return true; } }, configurable: true }); } catch { /* fine */ }
globalThis.Blob = class { constructor(parts) { this.text = parts.join(''); } };

class Param { constructor(v = 1) { this.value = v; } cancelScheduledValues() {} setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } setTargetAtTime(v) { this.value = v; } }
class Node_ { constructor() { this.gain = new Param(1); this.threshold = new Param(); this.knee = new Param(); this.ratio = new Param(); this.attack = new Param(); this.release = new Param(); } connect(x) { return x; } disconnect() {} start() {} stop() {} }
let made = 0;
class FakeAC {
  get currentTime() { const n = performance.now(); if (this.state === 'running') this._t += (n - this._at) / 1000; this._at = n; return this._t; }   // (a clock that MOVES while running — the engine's freeze watch reads it)
  constructor() { made++; this.state = 'running'; this._t = 1; this._at = performance.now(); this.destination = new Node_(); this.onstatechange = null; this.resumes = 0; this.suspends = 0; this.closed = false; }
  createGain() { return new Node_(); } createDynamicsCompressor() { return new Node_(); } createBufferSource() { return new Node_(); } createBuffer() { return {}; }
  set(s) { this.state = s; if (this.onstatechange) this.onstatechange(); }
  resume() { this.resumes++; return new Promise(() => {}); }   // the OS decides: the test says when it runs (set('running'))
  suspend() { this.suspends++; this.set('suspended'); return Promise.resolve(); }
  close() { this.closed = true; this.state = 'closed'; return Promise.resolve(); }
}
win.AudioContext = FakeAC;
const setI = globalThis.setInterval;
globalThis.setInterval = (fn, ms, ...a) => { const t = setI(fn, ms, ...a); if (t && t.unref) t.unref(); return t; };

const E = await import('../js/audio/engine.js');
const R = { ...(await import('../js/audio/leave-report.js')), ...(await import('../js/audio/leave-text.js')) };
const { updateSettings } = await import('../js/audio/settings.js');
E.installAudio();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ctx = () => E.getContext();
const H = () => E.audioHealth();
const vis = v => { doc.visibilityState = v ? 'visible' : 'hidden'; doc.hidden = !v; doc.fire('visibilitychange'); };
const rec = () => JSON.parse(store[R.LEAVE_REC_KEY] || 'null');
const rows = () => sent.map(x => JSON.parse(x.b.text).r);
let rests = [];
E.onMusicRest(on => rests.push(on));
E.soundingHub('media', () => 'voice 1 (silent blob) PLAYING');

test('the modes: A is the default; the switch cycles A → B → C1 → C2 → A; an unknown value reads as the default', () => {
  assert.equal(R.LEAVE_DEFAULT, 'A');
  assert.equal(E.getLeaveMode(), 'A');
  assert.deepEqual(['A', 'B', 'C1', 'C2'].map(R.nextLeaveMode), ['B', 'C1', 'C2', 'A']);
  assert.equal(R.leaveModeOf('Z'), 'A'); assert.equal(R.leaveModeOf('C2'), 'C2');
  assert.ok(R.isLeftSignal('pagehide (persisted)') && R.isLeftSignal('ctx interrupted') && !R.isLeftSignal('blur') && !R.isLeftSignal('ctx running'));
});

test('the first tap: unlocked, running', () => {
  E.setLeaveMode('C1');   // (a mode without the idle sleep for the record's own cases)
  doc.fire('touchend');
  assert.equal(ctx().state, 'running'); assert.equal(H().master, 1);
});

test('THE LEAVE RECORD: each signal in localStorage SYNCHRONOUSLY (before any await) — what was sounding at the first', () => {
  delete store[R.LEAVE_REC_KEY];
  const w0 = syncWrites;
  win.fire('blur');
  assert.ok(syncWrites > w0 && rec(), 'written in the blur handler itself');
  assert.equal(rec().sig[0].s, 'blur'); assert.equal(rec().first.ctx, 'running'); assert.equal(rec().first.media, 'voice 1 (silent blob) PLAYING');
  win.fire('pagehide', { persisted: false });
  vis(false);
  doc.fire('freeze');
  const r = rec();
  assert.deepEqual(r.sig.map(x => x.s).filter(x => !/^cut: /.test(x)).slice(0, 4), ['blur', 'pagehide', 'hidden', 'freeze']);
  assert.equal(r.left, true); assert.equal(r.mode, 'C1');
  assert.ok(r.sig.some(x => /^cut: /.test(x.s)), 'the cut noted in the same record');
});

test('THE LEAVE RECORD: sent as ONE AUDIO LEAVE row on the return (kind leave) — the mode, the order, the time away', async () => {
  sent.length = 0;
  await sleep(30);
  vis(true);
  await sleep(1600);
  const leave = rows().filter(r => r.kind === 'leave');
  assert.equal(leave.length, 1);
  assert.match(leave[0].text, /^AUDIO LEAVE · mode C1 \(SESSION AMBIENT\) · blur → pagehide \+\d+ ms → cut: the master ramped to 0 \+\d+ ms → hidden \+\d+ ms → freeze/);
  assert.match(leave[0].text, /back after \d+\.\d s \(visible/);
  assert.match(leave[0].text, /media: voice 1 \(silent blob\) PLAYING/);
  assert.equal(rec(), null, 'cleared once sent');
});

test('a page that NEVER CAME BACK (frozen / killed): its record goes out at the next load', async () => {
  sent.length = 0;
  store[R.LEAVE_REC_KEY] = JSON.stringify({ mode: 'A', at: Date.now() - 60e3, dev: 'iPhone 18.7 · home-screen app', session: 'ambient/active', vis: 'visible', first: { ctx: 'running', master: 1 }, sig: [{ s: 'blur', ms: 0, st: 'running', m: 1 }], left: false });
  await window.__audioLeave.send();
  assert.equal(rows().length, 0, 'a blur alone is no leave');
  store[R.LEAVE_REC_KEY] = JSON.stringify({ mode: 'A', at: Date.now() - 60e3, dev: 'iPhone', first: { ctx: 'running' }, sig: [{ s: 'blur', ms: 0, st: 'running', m: 1 }, { s: 'hidden', ms: 20, st: 'running', m: 0 }], left: true });
  await window.__audioLeave.send();
  assert.equal(rows().length, 1); assert.equal(rows()[0].kind, 'leave');
  assert.match(rows()[0].text, /NEVER CAME BACK/);
});

test('a blur that stays on screen (a share sheet, an alert) is no leave: nothing sent, the record cleared', async () => {
  sent.length = 0;
  win.fire('blur');
  assert.ok(rec());
  win.fire('focus');
  await sleep(500);
  assert.equal(rec(), null); assert.equal(rows().filter(r => r.kind === 'leave').length, 0);
});

test('C1 / C2: the audio session type fixed from the switch (and the boot), whatever the music setting', () => {
  updateSettings({ musicOff: false, muted: false, sfxOff: false });
  E.setLeaveMode('C1'); assert.equal(session.type, 'ambient');
  E.setLeaveMode('C2'); assert.equal(session.type, 'playback');
  updateSettings({ musicOff: true });
  assert.equal(session.type, 'playback', 'C2 keeps playback with the music off');
  updateSettings({ musicOff: false });
});

test('A — IDLE SILENCE: the music off → the music rests; the context asleep after the idle wait; the next sound wakes it (never the OS-took-it resume)', async () => {
  E.setLeaveMode('A');
  rests = [];
  updateSettings({ musicOff: true, sfxOff: false, muted: false });
  assert.deepEqual(rests, [true], 'the music told to rest (its elements stopped + released)');
  const c = ctx(); const s0 = c.suspends, r0 = c.resumes;
  await sleep(1500 + 80 + 100 + 400);
  assert.equal(c.state, 'suspended'); assert.equal(c.suspends, s0 + 1); assert.equal(H().idle, true);
  assert.equal(c.resumes, r0, 'our own sleep is never fought (no resume asked by the statechange)');
  assert.equal(E.isUnlocked(), true, 'asleep counts as unlocked — an effect may play');
  c.createBufferSource();                                   // (an effect: its source made on the context)
  assert.equal(H().idle, false); assert.equal(c.resumes, r0 + 1, 'woken: a resume asked'); assert.equal(H().master, 1);
  c.set('running');
  assert.equal(E.audioLive(c), true);
  updateSettings({ musicOff: false });
  assert.deepEqual(rests, [true, false], 'the music on → awake again');
});

test('B — CLOSE AT ONCE: the first leave signal closes the context (the master 0); the return builds a FRESH one, from 0', async () => {
  E.setLeaveMode('B');
  updateSettings({ musicOff: false, sfxOff: false, muted: false });
  const old = ctx(), m0 = made;
  win.fire('blur');
  assert.equal(old.closed, true); assert.equal(ctx(), null); assert.equal(H().fresh, true);
  assert.ok(rec().sig.some(x => x.s === 'closed (mode B)'));
  vis(false);
  await sleep(20);
  vis(true);
  assert.equal(made, m0 + 1, 'a fresh context made on the return');
  assert.notEqual(ctx(), old); assert.equal(H().fresh, false);
  assert.equal(H().master, 1, 'the fresh one ran at once: faded in from 0');
  await sleep(1600);
  assert.match(rows().filter(r => r.kind === 'leave').pop().text, /mode B \(CLOSE AT ONCE\).*closed \(mode B\)/s);
});

test('B: a blur that stays on screen gets a fresh context back too', async () => {
  const old = ctx(), m0 = made;
  win.fire('blur');
  assert.equal(old.closed, true);
  await sleep(450);                                         // (BLUR_BACK_MS: still visible)
  assert.equal(made, m0 + 1); assert.ok(ctx() && ctx().state !== 'closed');
});

for (const mode of ['A', 'B', 'C1', 'C2']) {
  test(`MUTED = NOTHING RUNS in mode ${mode}: suspended after the ramp; a tap resumes nothing; leaving + coming back wakes nothing`, async () => {
    E.setLeaveMode(mode);
    updateSettings({ muted: false, musicOff: false, sfxOff: false });
    if (!ctx() || ctx().state === 'closed') doc.fire('touchend');
    if (ctx().state !== 'running') ctx().set('running');
    updateSettings({ muted: true });
    await sleep(E.FADE.hushSuspendMs + 60);
    const c = ctx();
    assert.equal(c.state, 'suspended'); assert.equal(H().hushed, true);
    const r0 = c.resumes, m0 = made;
    doc.fire('touchend');
    assert.equal(c.resumes, r0, 'a tap resumes nothing'); assert.equal(made, m0, 'no context made');
    vis(false); await sleep(20); vis(true);
    assert.equal(made, m0, 'the return builds nothing'); assert.equal(c.resumes, r0, 'the return resumes nothing');
    assert.equal(E.musicResting(), false, 'hushed: the hush holds the music, not the rest');
    updateSettings({ muted: false });
  });
}
