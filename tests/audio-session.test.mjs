// CITY G — THE THREE-WAY BUTTON + THE SESSION BY STATE + THE HARD CUT + THE MEDIA CUT (the owner, Nov 16–17), on the REAL js/audio/engine.js
// over a fake DOM + a fake AudioContext (FIXES R3's harness — its leave modes A / B / C1 / C2 are retired). What it proves off the device:
// (1) the button's three states + Settings in step (PURE); (2) the session type per state, switched at once; (3) HEAR THE HARBOR (the music off —
// THE GARDEN PARTY PASS: 'playback', the beds + one-offs + effects, no music, nothing naps) leaves by C2's path: the FIRST leave signal = the master 0 + the beds stopped in ONE step, the zeros held, then the suspend; (4) every media element
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
// THE PROOF PASS (Nov 20 — GitHub's `tests` job, red since REVIEW FIX B's push on "MUSIC OFF = PODCAST MODE": 'running', expected
// 'suspended', 120 ms after the nap was due): the nap is two chained timers (NAP_MS, then the zeros' hold) — the cloud's runner (and this
// machine with the whole suite running beside it) lets a timer slip past a 120 ms margin. THE WAITS RULE (CLAUDE.md): wait for the actual
// condition — after the time the nap SHOULD take, the state is polled a little longer (≤ SETTLE_MS: the runner's speed, a named allowance)
// and the SAME assertion follows: a context that never suspends still fails.
const SETTLE_MS = 4000;
const settle = async (fn, ms = SETTLE_MS) => { const t0 = Date.now(); while (!fn() && Date.now() - t0 < ms) await sleep(15); };
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

test('PURE — THE THREE-WAY BUTTON: on → MUSIC OFF · HEAR THE HARBOR → ALL SOUND OFF → SOUND ON; Settings in step (the music on + the effects off = the plain note, the next tap = all off)', () => {
  let s = { musicOff: false, sfxOff: false, muted: false };
  const seen = [];
  for (let i = 0; i < 3; i++) { const t = R.soundTap(s); s = { ...s, ...t.patch }; seen.push([R.soundState(s), t.say]); }
  assert.deepEqual(seen, [['music', 'MUSIC OFF · HEAR THE HARBOR'], ['all', 'ALL SOUND OFF'], ['on', 'SOUND ON']]);
  assert.equal(R.soundState({ musicOff: false, sfxOff: true }), 'on', 'the music on + the effects off from Settings: the plain note');
  assert.deepEqual(R.soundTap({ musicOff: false, sfxOff: true }).patch, { musicOff: true, sfxOff: true, muted: false }, '… and the next tap = all off');
  assert.equal(R.soundState({ muted: true }), 'all', 'MUTE EVERYTHING (Settings) = the speaker ✕');
  assert.deepEqual(R.soundTap({ muted: true }).patch, { musicOff: false, sfxOff: false, muted: false }, '… and a tap brings everything back');
});

test('PURE — THE SOUND TABLE: MUSIC ON = playback + everything · HEAR THE HARBOR = playback + the beds / one-offs / effects, NO music · ALL OFF = auto (iOS alone), nothing · the mic = play-and-record', () => {
  assert.deepEqual(Object.keys(R.SOUND_TABLE), ['on', 'music', 'all']);
  assert.deepEqual({ ...R.SOUND_TABLE.on }, { name: 'MUSIC ON', session: 'playback', music: true, beds: true, oneOffs: true, effects: true });
  assert.deepEqual({ ...R.SOUND_TABLE.music }, { name: 'HEAR THE HARBOR', session: 'playback', music: false, beds: true, oneOffs: true, effects: true });
  assert.deepEqual({ ...R.SOUND_TABLE.all }, { name: 'ALL OFF', session: '', music: false, beds: false, oneOffs: false, effects: false });
  assert.ok(Object.isFrozen(R.SOUND_TABLE) && Object.isFrozen(R.SOUND_TABLE.music));
  assert.equal(R.sessionFor({ musicOff: false, sfxOff: false }), 'playback');
  assert.equal(R.sessionFor({ musicOff: false, sfxOff: true }), 'playback');
  assert.equal(R.sessionFor({ musicOff: true, sfxOff: false }), 'playback', 'HEAR THE HARBOR: C2\'s no-squeal session, never \'ambient\'');
  assert.equal(R.sessionFor({ musicOff: true, sfxOff: true }), 'auto');
  assert.equal(R.sessionFor({ muted: true }), 'auto');
  assert.equal(R.sessionFor({ musicOff: true }, 1), 'play-and-record');
  assert.ok(R.isLeftSignal('pagehide (persisted)') && R.isLeftSignal('ctx interrupted') && !R.isLeftSignal('blur') && !R.isLeftSignal('ctx running'));
});

test('the session type switches AT ONCE with the state (the engine, the real settings)', () => {
  updateSettings({ musicOff: false, sfxOff: false, muted: false });
  assert.equal(session.type, 'playback');
  updateSettings({ musicOff: true });
  assert.equal(session.type, 'playback', 'HEAR THE HARBOR: the same session as the music on (the owner accepted a podcast pausing)');
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
  assert.match(leave[0].text, /^AUDIO LEAVE · ctx at the leave: RUNNING · MUSIC ON · session playback · blur → pagehide \+\d+ ms → hidden \+\d+ ms → freeze/);
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

test('THE LEAVE in HEAR THE HARBOR = C2\'s path (THE GARDEN PARTY PASS — the \'ambient\' hard cut retired): the master RAMPS to 0 from the FIRST signal, the beds stop only after it, the zeros held, then the suspend', async () => {
  updateSettings({ musicOff: true, sfxOff: false, muted: false });
  if (ctx().state !== 'running') ctx().set('running');
  const fx = ctx().createBufferSource(); fx.start();   // (an effect sounding)
  await sleep(450);
  if (H().master !== 1) { win.fire('focus'); await sleep(450); }
  assert.equal(H().state, 'running'); assert.equal(session.type, 'playback');
  bedPaused = false;
  const c = ctx(), s0 = c.suspends;
  delete store[R.LEAVE_REC_KEY];
  win.fire('blur');
  assert.equal(H().master, 0, 'the master to 0 on the first signal (a LEAVE_S ramp — the fake applies it at once)');
  assert.equal(bedPaused, false, 'the beds NOT cut in the same step (never a loop cut while it sounds)');
  await sleep(E.FADE.leaveS * 1000 + 60); await settle(() => bedPaused);
  assert.equal(bedPaused, true, '… stopped once the ramp is done');
  assert.ok(!rec().sig.some(x => /^cut: hard/.test(x.s)), 'no hard cut');
  vis(false);
  assert.equal(c.suspends, s0, 'never suspended before the zeros are held');
  await sleep(E.FADE.leaveSuspendMs + 60); await settle(() => c.suspends === s0 + 1);
  assert.equal(c.suspends, s0 + 1, 'suspended after the ramp + the zeros');
  assert.ok(rec().sig.some(x => /^cut: the master ramped to 0/.test(x.s)), 'the AUDIO LEAVE row: the ramp');
  fx.stop();
  vis(true); win.fire('focus'); c.set('running'); await sleep(500);
  updateSettings({ musicOff: false }); c.set('running');
});

test('HEAR THE HARBOR (THE GARDEN PARTY PASS — retires PODCAST MODE): the music off = the city\'s beds + one-offs + effects on \'playback\', the music RESTING (no element), the context RUNS between effects (no nap), the row\'s name in the AUDIO LEAVE row', async () => {
  updateSettings({ musicOff: false, sfxOff: false, muted: false });
  if (ctx().state !== 'running') { doc.fire('touchend'); ctx().set('running'); }
  await sleep(300);
  updateSettings({ musicOff: true });
  const c = ctx();
  assert.equal(session.type, 'playback'); assert.equal(H().sound, 'HEAR THE HARBOR');
  assert.equal(E.musicResting(), true, 'the music rests (music.js pauses every element)'); assert.equal(H().resting, true); assert.equal(H().hushed, false);
  assert.equal(bedPaused, false, 'the beds RUN with the music off — the water, the hum, the boats are heard');
  assert.equal(E.getMusicBus().gain.value, 0, 'the music bus 0'); assert.ok(E.getSfxBus().gain.value > 0, 'the effects bus up');
  assert.equal(globalThis.__nsSoundRow().oneOffs, true, 'the city\'s one-offs through the hub');
  const fx = c.createBufferSource(); fx.start(); fx.stop();
  await sleep(900);
  assert.equal(c.state, 'running', 'nothing sounding: still RUNNING — no nap, no wake-up lag on the next effect');
  assert.equal(E.isUnlocked(), true, 'THE ONE GATE every effect asks: open');
  assert.match(R.leaveReportText({ first: { ctx: 'running' }, sound: H().sound, sess: session.type, sig: [{ s: 'blur', ms: 0 }] }), /^AUDIO LEAVE · ctx at the leave: RUNNING · HEAR THE HARBOR · session playback · blur/, '/admin\'s AUDIO LEAVE: the ctx up front + the state\'s name');
  updateSettings({ musicOff: false });
  assert.equal(E.musicResting(), false); assert.equal(H().resting, false); assert.equal(bedPaused, false); assert.equal(session.type, 'playback');
});

// THE TOGGLE BUG (the owner's iPhone, Nov 21 ~10 am): load in music-off → ALL OFF → MUSIC ON → MUSIC OFF left the beds running on 'ambient' →
// the leave squealed. Now ONE row is applied whole: every path through the button + Settings from every starting state is checked, after EVERY
// step, against the row's own columns (session · beds · music · effects · the hush) — the state can only ever be a function of the row.
test('EVERY PATH lands on its row: every start state × every order of taps (and Settings\' own switches) → the session, the beds, the music\'s rest, the buses + the hush = THE SOUND TABLE\'s row', async () => {
  const START = { on: { musicOff: false, sfxOff: false, muted: false }, music: { musicOff: true, sfxOff: false, muted: false }, all: { musicOff: true, sfxOff: true, muted: false } };
  const STEPS = { tap: s => R.soundTap(s).patch, mute: () => ({ muted: true }), unmute: () => ({ muted: false }), fxOff: () => ({ sfxOff: true }), fxOn: () => ({ sfxOff: false }), musicOn: () => ({ musicOff: false }), musicOff: () => ({ musicOff: true }) };
  const names = Object.keys(STEPS);
  const paths = [[]];
  for (let n = 0; n < 3; n++) for (const p of paths.slice()) if (p.length === n) for (const k of names) paths.push([...p, k]);
  paths.push(['tap', 'tap', 'tap', 'tap', 'tap', 'tap'], ['tap', 'tap', 'tap', 'tap'], ['mute', 'tap', 'tap', 'tap', 'unmute']);   // (long button walks + the owner's order)
  const want = st => { const r = R.SOUND_TABLE[st]; return { session: r.session || 'auto', beds: r.beds, resting: !r.music && st !== 'all', hushed: st === 'all', music: r.music, effects: r.effects }; };
  const seen = () => { const sfx = E.getSfxBus().gain.value, mus = E.getMusicBus().gain.value; return { session: session.type || 'auto', beds: !bedPaused, resting: H().resting, hushed: H().hushed, music: mus > 0, effects: sfx > 0 }; };
  let checked = 0;
  for (const [st0, s0] of Object.entries(START)) for (const p of paths) {
    updateSettings({ ...s0 });
    let s = { ...s0 };
    const check = where => {
      const st = R.soundState(s);
      const w = want(st), g = seen();
      if (s.sfxOff && st !== 'all') w.effects = false;   // (the ☰ menu's SOUND EFFECTS toggle within a row)
      if (st === 'all') w.beds = g.beds;   // (ALL OFF's beds stop at THE HUSH's suspend, under the master's zeros — checked on its own below)
      assert.deepEqual(g, w, `from ${st0} via [${p.join(' → ')}] at ${where}: state ${st} (${R.SOUND_TABLE[st].name})`);
      checked++;
    };
    check('the load');
    p.forEach((k, i) => { const patch = STEPS[k](s); s = { ...s, ...patch }; updateSettings(patch); check(`step ${i + 1} (${k})`); });
  }
  assert.ok(checked > 1500, `${checked} states checked`);
  // ALL OFF's beds: stopped at THE HUSH's suspend (the master's ramp + its zeros first — never a loop cut while it sounds)
  updateSettings({ ...START.on }); bedPaused = false;
  updateSettings({ ...START.all });
  assert.equal(bedPaused, false, 'not cut at the switch (the master still ramping)');
  await sleep(E.FADE.hushSuspendMs + 80); await settle(() => bedPaused);
  assert.equal(bedPaused, true, 'stopped at the suspend of the hush'); assert.equal(H().master, 0);
  updateSettings({ ...START.on });
  assert.equal(bedPaused, false, 'back with the row');
  // the owner's exact order: music-off → ALL OFF → MUSIC ON → MUSIC OFF = HEAR THE HARBOR on 'playback' (never 'ambient'), the beds running
  updateSettings({ ...START.music }); updateSettings(R.soundTap(START.music).patch);
  updateSettings(R.soundTap(START.all).patch); updateSettings(R.soundTap(START.on).patch);
  assert.equal(R.soundState({ musicOff: true, sfxOff: false }), 'music'); assert.equal(session.type, 'playback'); assert.equal(bedPaused, false); assert.equal(H().sound, 'HEAR THE HARBOR');
  updateSettings({ ...START.on });
});

test('THE HOLD (HIGH RISE S4A) after HEAR THE HARBOR: the lease still records itself + lapses by itself; it changes nothing — the session, the beds, the context, the hush', async () => {
  updateSettings({ musicOff: true, sfxOff: false, muted: false });
  const c = ctx();
  doc.fire('touchend'); if (c.state !== 'running') c.set('running');
  assert.equal(typeof globalThis.__nsHoldAwake, 'function', 'the hub a lazy chunk reaches it through (THE STALE-MODULE RULE)');
  const before = { session: session.type, beds: bedPaused, state: c.state, sus: c.suspends };
  globalThis.__nsHoldAwake(true, 'test');
  assert.equal(H().held, true);
  assert.deepEqual({ session: session.type, beds: bedPaused, state: c.state, sus: c.suspends }, before, 'the hold changes nothing');
  E.holdAwake(false, 'test'); assert.equal(H().held, false);
  E.holdAwake(true, 'test');
  await sleep(E.HOLD_LEASE_MS + 250); await settle(() => !H().held);
  assert.equal(H().held, false, 'not renewed for HOLD_LEASE_MS: the lease lapsed');
  assert.equal(c.state, 'running', 'and nothing napped');
  vis(false); E.holdAwake(true, 'test'); vis(true);
  E.holdAwake(false, 'test');
  updateSettings({ musicOff: false });
});

test('MUTED = NOTHING RUNS: suspended after the ramp; a tap resumes nothing; leaving + coming back wakes nothing', async () => {
  updateSettings({ muted: false, musicOff: false, sfxOff: false });
  if (!ctx() || ctx().state === 'closed') doc.fire('touchend');
  if (ctx().state !== 'running') ctx().set('running');
  updateSettings({ muted: true });
  await sleep(E.FADE.hushSuspendMs + 60); await settle(() => ctx().state === 'suspended');
  const c = ctx();
  assert.equal(c.state, 'suspended'); assert.equal(H().hushed, true);
  const r0 = c.resumes, m0 = made;
  doc.fire('touchend');
  assert.equal(c.resumes, r0, 'a tap resumes nothing'); assert.equal(made, m0, 'no context made');
  vis(false); await sleep(20); vis(true);
  assert.equal(made, m0, 'the return builds nothing'); assert.equal(c.resumes, r0, 'the return resumes nothing');
  updateSettings({ muted: false });
});
