// CITY G — THE THREE-WAY BUTTON + THE SESSION BY STATE + THE HARD CUT + THE MEDIA CUT (the owner, Nov 16–17), on the REAL js/audio/engine.js
// over a fake DOM + a fake AudioContext (FIXES R3's harness — its leave modes A / B / C1 / C2 are retired). What it proves off the device:
// (1) the button's three states + Settings in step (PURE); (2) the session type per state, switched at once; (3) 'ambient' (the music off, the
// effects on): the FIRST leave signal = the master 0 + the beds stopped in ONE step, the zeros held, then the suspend; (4) every media element
// paused IN the cut's own step, "media after: all paused" in the AUDIO LEAVE row; (5) THE LEAVE RECORD as before; (6) MUTED = NOTHING RUNS.
// What it can't prove: an iPhone's Core Audio — the owner's phone test (docs/harbor/passes/city-g.md).
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

// (CITY H1 — Param.spec: a phone whose audio thread never runs a quantum — the timeline's events move NOTHING; only the value setter does.
//  The old fake applied setValueAtTime at once, so THE SQUEAL's hard cut passed here while the phone's master stayed 1.000)
class Param { constructor(v = 1) { this._v = v; } get value() { return this._v; } set value(v) { this._v = v; } cancelScheduledValues() {} setValueAtTime(v) { if (!Param.spec) this._v = v; } linearRampToValueAtTime(v) { if (!Param.spec) this._v = v; } setTargetAtTime(v) { if (!Param.spec) this._v = v; } setValueCurveAtTime() {} }
class Node_ { constructor() { this.gain = new Param(1); this.threshold = new Param(); this.knee = new Param(); this.ratio = new Param(); this.attack = new Param(); this.release = new Param(); } connect(x) { return x; } disconnect() {} start() { if (this.buffer && this.buffer.blip) setTimeout(() => this.stop(), 1); } stop() { const f = this._end; this._end = null; if (f) f(); } addEventListener(t, fn) { if (t === 'ended') this._end = fn; } }
let made = 0;
class FakeAC {
  get currentTime() { const n = performance.now(); if (this.state === 'running') this._t += (n - this._at) / 1000; this._at = n; return this._t; }   // (a clock that MOVES while running — the engine's freeze watch reads it)
  constructor() { made++; this.state = 'running'; this._t = 1; this._at = performance.now(); this.destination = new Node_(); this.onstatechange = null; this.resumes = 0; this.suspends = 0; this.closed = false; }
  createGain() { return new Node_(); } createDynamicsCompressor() { return new Node_(); } createBufferSource() { return new Node_(); } createOscillator() { return new Node_(); } createBuffer() { return { blip: true }; }
  set(s) { this.state = s; if (this.onstatechange) this.onstatechange(); }
  resume() { this.resumes++; return new Promise(() => {}); }   // the OS decides: the test says when it runs (set('running'))
  suspend() { this.suspends++; this.set('suspended'); return Promise.resolve(); }
  close() { this.closed = true; this.state = 'closed'; return Promise.resolve(); }
}
win.AudioContext = FakeAC;
const setI = globalThis.setInterval;
globalThis.setInterval = (fn, ms, ...a) => { const t = setI(fn, ms, ...a); if (t && t.unref) t.unref(); return t; };

const E = await import('../js/audio/engine.js');
const R = { ...(await import('../js/audio/sound-state.js')), ...(await import('../js/audio/leave-text.js')) };
const { updateSettings } = await import('../js/audio/settings.js');
E.installAudio();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ctx = () => E.getContext();
const H = () => E.audioHealth();
const vis = v => { doc.visibilityState = v ? 'visible' : 'hidden'; doc.hidden = !v; doc.fire('visibilitychange'); };
const rec = () => JSON.parse(store[R.LEAVE_REC_KEY] || 'null');
const rows = () => sent.map(x => JSON.parse(x.b.text).r);
// a media element the way music.js owns one: playing → paused by its onLeaveCut listener
const el = { paused: false, pause() { this.paused = true; } };
E.soundingHub('media', () => (el.paused ? '—' : 'voice victory3 PLAYING'));
const cuts = [];
E.onLeaveCut((left, why) => { cuts.push({ left, why, bedsStoppedFirst: bedPaused }); if (left) el.pause(); });
let bedPaused = false;
E.holdBed({ pause: () => { bedPaused = true; }, resume: () => { bedPaused = false; } });

test('PURE — THE THREE-WAY BUTTON: on → MUSIC OFF · EFFECTS ON → ALL SOUND OFF → SOUND ON; Settings in step (the music on + the effects off = the plain note, the next tap = all off)', () => {
  let s = { musicOff: false, sfxOff: false, muted: false };
  const seen = [];
  for (let i = 0; i < 3; i++) { const t = R.soundTap(s); s = { ...s, ...t.patch }; seen.push([R.soundState(s), t.say]); }
  assert.deepEqual(seen, [['music', 'MUSIC OFF · EFFECTS ON'], ['all', 'ALL SOUND OFF'], ['on', 'SOUND ON']]);
  assert.equal(R.soundState({ musicOff: false, sfxOff: true }), 'on', 'the music on + the effects off from Settings: the plain note');
  assert.deepEqual(R.soundTap({ musicOff: false, sfxOff: true }).patch, { musicOff: true, sfxOff: true, muted: false }, '… and the next tap = all off');
  assert.equal(R.soundState({ muted: true }), 'all', 'MUTE EVERYTHING (Settings) = the speaker ✕');
  assert.deepEqual(R.soundTap({ muted: true }).patch, { musicOff: false, sfxOff: false, muted: false }, '… and a tap brings everything back');
});

test('PURE — THE SESSION BY STATE: the music on = playback · the music off + the effects on = ambient · everything off = auto (iOS alone) · the mic = play-and-record', () => {
  assert.equal(R.sessionFor({ musicOff: false, sfxOff: false }), 'playback');
  assert.equal(R.sessionFor({ musicOff: false, sfxOff: true }), 'playback');
  assert.equal(R.sessionFor({ musicOff: true, sfxOff: false }), 'ambient');
  assert.equal(R.sessionFor({ musicOff: true, sfxOff: true }), 'auto');
  assert.equal(R.sessionFor({ muted: true }), 'auto');
  assert.equal(R.sessionFor({ musicOff: true }, 1), 'play-and-record');
  assert.ok(R.isLeftSignal('pagehide (persisted)') && R.isLeftSignal('ctx interrupted') && !R.isLeftSignal('blur') && !R.isLeftSignal('ctx running'));
});

test('the session type switches AT ONCE with the state (the engine, the real settings)', () => {
  updateSettings({ musicOff: false, sfxOff: false, muted: false });
  assert.equal(session.type, 'playback');
  updateSettings({ musicOff: true });
  assert.equal(session.type, 'ambient', 'the music off: another app\'s audio keeps playing');
  updateSettings({ sfxOff: true });
  assert.equal(session.type, 'auto', 'everything off: iOS left alone (set back from the type we had set)');
  updateSettings({ musicOff: false, sfxOff: false });
  assert.equal(session.type, 'playback');
});

test('the first tap: unlocked, running', () => {
  doc.fire('touchend');
  assert.equal(ctx().state, 'running'); assert.equal(H().master, 1);
});

test('THE LEAVE RECORD: each signal in localStorage SYNCHRONOUSLY (before any await) — what was sounding at the first + the media AFTER the cut', () => {
  delete store[R.LEAVE_REC_KEY];
  cuts.length = 0; el.paused = false;
  const w0 = syncWrites;
  win.fire('blur');
  assert.ok(syncWrites > w0 && rec(), 'written in the blur handler itself');
  assert.equal(rec().sig[0].s, 'blur'); assert.equal(rec().first.ctx, 'running'); assert.equal(rec().first.media, 'voice victory3 PLAYING');
  assert.ok(el.paused && cuts.length === 1 && cuts[0].left, 'THE MEDIA CUT: the element paused in the blur\'s own step');
  assert.ok(rec().sig.some(x => x.s === 'media after: all paused'), 'the record: media after — all paused');
  win.fire('pagehide', { persisted: false });
  vis(false);
  doc.fire('freeze');
  const r = rec();
  assert.deepEqual(r.sig.map(x => x.s).filter(x => !/^cut: |^media after/.test(x)).slice(0, 4), ['blur', 'pagehide', 'hidden', 'freeze']);
  assert.equal(r.left, true); assert.equal(r.sess, 'playback');
});

test('THE LEAVE RECORD: sent as ONE AUDIO LEAVE row on the return (kind leave) — the session, the order, the time away, media after', async () => {
  sent.length = 0;
  await sleep(30);
  vis(true);
  await sleep(1600);
  const leave = rows().filter(r => r.kind === 'leave');
  assert.equal(leave.length, 1);
  assert.match(leave[0].text, /^AUDIO LEAVE · ctx at the leave: RUNNING · session playback · blur → pagehide \+\d+ ms → hidden \+\d+ ms → freeze/);
  assert.match(leave[0].text, /back after \d+\.\d s \(visible/);
  assert.match(leave[0].text, /media after: all paused/);
  assert.equal(rec(), null, 'cleared once sent');
});

test('a page that NEVER CAME BACK (frozen / killed): its record goes out at the next load; a blur alone is no leave', async () => {
  sent.length = 0;
  store[R.LEAVE_REC_KEY] = JSON.stringify({ sess: 'ambient', at: Date.now() - 60e3, dev: 'iPhone', first: { ctx: 'running' }, sig: [{ s: 'blur', ms: 0, st: 'running', m: 1 }], left: false });
  await window.__audioLeave.send();
  assert.equal(rows().length, 0, 'a blur alone is no leave');
  store[R.LEAVE_REC_KEY] = JSON.stringify({ sess: 'ambient', at: Date.now() - 60e3, dev: 'iPhone', first: { ctx: 'running' }, sig: [{ s: 'blur', ms: 0, st: 'running', m: 1 }, { s: 'hidden', ms: 20, st: 'running', m: 0 }], left: true });
  await window.__audioLeave.send();
  assert.equal(rows().length, 1); assert.equal(rows()[0].kind, 'leave');
  assert.match(rows()[0].text, /NEVER CAME BACK/);
});

test('a blur that stays on screen (a share sheet, an alert) is no leave: nothing sent, the record cleared — the media told it is back', async () => {
  sent.length = 0; cuts.length = 0;
  win.fire('blur');
  assert.ok(rec());
  win.fire('focus');
  await sleep(500);
  assert.equal(rec(), null); assert.equal(rows().filter(r => r.kind === 'leave').length, 0);
  assert.deepEqual(cuts.map(c => c.left), [true, false], 'the media cut, then back (music.js heals the song)');
});

test('THE SQUEAL, FOR REAL (CITY H1): on a phone whose audio thread never runs, the master VALUE is 0 within one task of the first leave signal — the beds stopped in the SAME step, the zeros held, then the suspend', async () => {
  updateSettings({ musicOff: true, sfxOff: false, muted: false });
  if (ctx().state !== 'running') ctx().set('running');
  const fx = ctx().createBufferSource(); fx.start();   // (an effect sounding)
  await sleep(450);
  if (H().master !== 1) { win.fire('focus'); await sleep(450); }
  assert.equal(H().state, 'running');
  Param.spec = true;
  bedPaused = false;
  const c = ctx(), s0 = c.suspends;
  delete store[R.LEAVE_REC_KEY];
  win.fire('blur');
  assert.equal(H().master, 0, 'the master\'s VALUE 0 in the blur\'s own task (the old cut only scheduled it: 1.000 on the phone)');
  assert.equal(bedPaused, true, 'the beds stopped in the SAME step');
  const cutLine = rec().sig.find(x => /^cut: hard/.test(x.s));
  assert.ok(cutLine && cutLine.m === 0, `the AUDIO LEAVE row's cut line reads m 0.000 (${cutLine && cutLine.m})`);
  assert.equal(c.suspends, s0, 'never suspended before the zeros are held');
  await sleep(E.FADE.zeroHoldMs + 40);
  assert.equal(c.suspends, s0 + 1, 'suspended after the zeros');
  Param.spec = false;
  fx.stop();
  win.fire('focus'); c.set('running'); await sleep(500);
  updateSettings({ musicOff: false }); c.set('running');
});

test('MUSIC OFF = PODCAST MODE (CITY I — the owner\'s option 3): no beds; the context SUSPENDED between effects (never pretending); a tap resumes it IN the tap; an effect wakes it; one no tap follows is dropped; a leave finds it suspended; the music back = awake + the beds', async () => {
  updateSettings({ musicOff: false, sfxOff: false, muted: false });
  ctx().set('running');
  await sleep(300);
  bedPaused = false;
  updateSettings({ musicOff: true });
  assert.equal(E.podcastNow(), true, 'music off + effects on = PODCAST MODE');
  assert.equal(bedPaused, true, 'the beds paused at the switch');
  const c = ctx(), s0 = c.suspends;
  await sleep(150 + E.FADE.zeroHoldMs + 120);
  assert.equal(c.state, 'suspended', 'nothing sounding: SUSPENDED (ctx.state says so — no pretending)');
  assert.equal(c.suspends, s0 + 1); assert.equal(H().napping, true); assert.equal(H().master, 0, 'the master 0 before the suspend (THE ZEROS FIRST)');
  // (the H1 load bug must not come back: the first tap resumes it IN the gesture)
  let r0 = c.resumes;
  doc.fire('touchend');
  assert.ok(c.resumes > r0, 'a tap asks the napping context to run, inside the tap');
  c.set('running');
  assert.equal(H().napping, false); assert.equal(H().master, 1, 'running again at full level');
  await sleep(150 + E.FADE.zeroHoldMs + 120);
  assert.equal(c.state, 'suspended', 'asleep again ~250 ms after the tap (no effect played)');
  // an effect with NO tap (a timer's): asks once, dropped if the context isn't running WAKE_WAIT_MS later — never played late
  r0 = c.resumes;
  const lone = c.createBufferSource(); let loneEnded = false; lone.start(); const end0 = lone._end; lone._end = () => { loneEnded = true; if (end0) end0(); };
  assert.ok(c.resumes > r0, 'an effect started while napping asks the context to run');
  assert.equal(H().voices >= 1, true);
  await sleep(380);
  assert.equal(loneEnded, true, 'no tap followed + the context never ran: the effect was DROPPED (stopped), never queued for later');
  // an effect IN a tap: it plays (the context runs), then the nap follows its end
  doc.fire('touchend');
  const fx = c.createBufferSource(); fx.start();
  c.set('running');
  await sleep(320);
  assert.equal(c.state, 'running', 'an effect sounding: awake');
  fx.stop();
  await sleep(150 + E.FADE.zeroHoldMs + 120);
  assert.equal(c.state, 'suspended', '…its end → suspended again');
  // a leave while napping: nothing to cut
  const s1 = c.suspends; delete store[R.LEAVE_REC_KEY];
  win.fire('blur');
  assert.equal(c.state, 'suspended'); assert.equal(c.suspends, s1, 'a leave finds it suspended — nothing cut, nothing suspended again');
  assert.equal(rec().first.ctx, 'suspended', 'THE LEAVE RECORD notes "ctx at the leave: suspended" up front');
  win.fire('focus'); await sleep(500);
  assert.equal(c.state, 'suspended', 'the return wakes nothing');
  // the music back ON (a tap): awake at once + the beds back
  doc.fire('touchend');
  updateSettings({ musicOff: false });
  assert.equal(E.podcastNow(), false); assert.equal(bedPaused, false, 'the beds back with the music');
  c.set('running');
  await sleep(150 + E.FADE.zeroHoldMs + 120);
  assert.equal(c.state, 'running', 'music on: never napping');
});

test('THE HOLD (HIGH RISE S4A — THE SOUND SYNC): a LIVE run holds the napping context AWAKE — a lease the game renews; let go / lapsed / hidden → the nap is back; the session type, the music, the hush + the leave are untouched', async () => {
  updateSettings({ musicOff: true, sfxOff: false, muted: false });
  const c = ctx();
  doc.fire('touchend'); c.set('running');
  await sleep(150 + E.FADE.zeroHoldMs + 120);
  assert.equal(c.state, 'suspended', 'podcast mode, nothing sounding: asleep');
  assert.equal(session.type, 'ambient');
  assert.equal(typeof globalThis.__nsHoldAwake, 'function', 'the hub a lazy chunk reaches it through (THE STALE-MODULE RULE)');
  // the run starts (the START tap): the hold asks the context to run AT ONCE; awake, it stays awake — no nap between two effects
  doc.fire('touchend');   // (the START tap — its own silent blip is the tap's, not an effect's)
  const n0 = H().naps, w0 = H().wakes, r0 = c.resumes;
  globalThis.__nsHoldAwake(true, 'test');
  assert.ok(c.resumes > r0 || c.state === 'running', 'the hold wakes a napping context (inside the START tap)');
  c.set('running');
  assert.equal(H().held, true); assert.equal(H().napping, false); assert.equal(H().master, 1);
  for (let i = 0; i < 3; i++) { const fx = c.createBufferSource(); fx.start(); assert.equal(c.state, 'running', 'an effect finds the context RUNNING — on its moment'); fx.stop(); await sleep(320); E.holdAwake(true, 'test'); }
  assert.equal(c.state, 'running', 'a second of silence between drops: still awake');
  assert.equal(H().naps, n0, 'no nap while held'); assert.equal(H().wakes, w0, 'no effect had to wake it');
  assert.ok(E.voiceStarts().slice(-3).every(r => r.wait === 0), 'the engine\'s own record: each source started on a running context (wait 0)');
  assert.equal(session.type, 'ambient', 'the session type never changed: the phone\'s podcast keeps playing');
  assert.equal(E.podcastNow(), true, 'still PODCAST MODE (no music, no beds)'); assert.equal(bedPaused, true);
  // let go (the end card): the nap comes back
  E.holdAwake(false, 'test');
  assert.equal(H().held, false);
  await sleep(150 + E.FADE.zeroHoldMs + 120);
  assert.equal(c.state, 'suspended', 'released → asleep again between effects');
  // A LEASE, never a latch: a game that stops renewing (a crash, an unmount) loses the hold by itself
  doc.fire('touchend'); E.holdAwake(true, 'test'); c.set('running');
  assert.equal(H().held, true);
  await sleep(E.HOLD_LEASE_MS + 250 + 150 + E.FADE.zeroHoldMs + 150);
  assert.equal(H().held, false, 'not renewed for HOLD_LEASE_MS: the lease lapsed');
  assert.equal(c.state, 'suspended', '… and the context naps again by itself');
  // hidden mid-run: the hold is dropped at once, the leave suspends as ever; back on screen nothing is woken until a tap / an effect
  doc.fire('touchend'); E.holdAwake(true, 'test'); c.set('running');
  vis(false);
  assert.equal(H().held, false, 'a leave drops the hold');
  await sleep(E.FADE.zeroHoldMs + 400);
  assert.equal(c.state, 'suspended', 'hidden: suspended (the leave path as it was)');
  vis(true); await sleep(300);
  assert.equal(c.state, 'suspended', 'back on screen: nothing woken');
  // MUTED = NOTHING RUNS, held or not
  doc.fire('touchend'); c.set('running');
  updateSettings({ muted: true });
  await sleep(E.FADE.outS * 1000 + E.FADE.zeroHoldMs + 200);
  const r1 = c.resumes;
  E.holdAwake(true, 'test');
  assert.equal(c.resumes, r1, 'muted: the hold resumes nothing'); assert.equal(c.state, 'suspended');
  E.holdAwake(false, 'test');
  // the music ON: the hold changes nothing (the context runs anyway — never napping)
  doc.fire('touchend');
  updateSettings({ muted: false, musicOff: false, sfxOff: false });
  c.set('running');
  E.holdAwake(true, 'test'); E.holdAwake(false, 'test');
  await sleep(150 + E.FADE.zeroHoldMs + 120);
  assert.equal(c.state, 'running'); assert.equal(session.type, 'playback'); assert.equal(E.podcastNow(), false);
});

test('MUTED = NOTHING RUNS: suspended after the ramp; a tap resumes nothing; leaving + coming back wakes nothing', async () => {
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
  updateSettings({ muted: false });
});
