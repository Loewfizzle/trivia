// HIGH RISE PAD + GO (Nov 24 — docs/games/passes/highrise-pad-go.md): THE CONTROLLER's exact timing · the kit's hand-off · THE SOLO GO's
// tries on a fake line · the pins (lazy, never in a start bundle; the lab's flags only on the test page; the INITIATE message).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { padTime, PAD_SLACK_MS, tickOf } from '../js/games/highrise/logic.js';
import { soloGo, GO_TRIES, GO_TRY_MS, GO_LOOK_MS, GO_WAIT_MS, GO_LATE_MS } from '../js/games/highrise/go.js';
import { createRun, stepTo, tap } from '../js/games/highrise/engine.js';
import { TICK_HZ } from '../js/games/highrise/tuning.js';
import { META } from '../js/games/metas.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('EXACT PAD TIMING (logic.js#padTime): the press counts at the Gamepad\'s own stamp — only between the poll before and now; anything else = the frame it was noticed', () => {
  // the kit polled at 1000 (button up) and at 1016.7 (down): the pad says the press came at 1004.2
  assert.equal(padTime(1004.2, 1000, 1016.7), 1004.2, 'inside the window: the press\'s own time — 12.5 ms before it was noticed');
  assert.equal(padTime(1016.7, 1000, 1016.7), 1016.7, 'stamped this very moment');
  assert.equal(padTime(1000 - PAD_SLACK_MS, 1000, 1016.7), 1000 - PAD_SLACK_MS, 'a report stamped a moment before the poll that missed it: the slack');
  assert.equal(padTime(1000 - PAD_SLACK_MS - 0.1, 1000, 1016.7), 1016.7, 'older than the slack: not this press — now');
  assert.equal(padTime(1016.8, 1000, 1016.7), 1016.7, 'NEVER IN THE FUTURE');
  assert.equal(padTime(0, 1000, 1016.7), 1016.7, 'no stamp (a fake / an old pad): now');
  assert.equal(padTime(undefined, 1000, 1016.7), 1016.7); assert.equal(padTime(NaN, 1000, 1016.7), 1016.7);
  assert.equal(padTime(1004, 0, 1016.7), 1016.7, 'the kit\'s first poll (nothing before it): now');
  // an older Safari stamps in SECONDS on another clock: 98 765.4 "ms" on a page 1 000 s old, or 123.4 — never taken for a time
  assert.equal(padTime(98765.4, 1_000_000, 1_000_016.7), 1_000_016.7); assert.equal(padTime(123.4, 5000, 5016.7), 5016.7);
  // … and the coincidence window is the poll gap + the slack (~50 ms), not a whole second
  assert.equal(padTime(1_000_016.7 - 60, 1_000_000, 1_000_016.7), 1_000_016.7);
  // NEVER BEFORE THE LAST TAP LOGGED (`floor` — that tap's own time)
  assert.equal(padTime(1004.2, 1000, 1016.7, 1010), 1010, 'a press stamped before the last logged tap counts AT it (the engine then reads a landing beat: no drop)');
  assert.equal(padTime(1012, 1000, 1016.7, 1010), 1012); assert.equal(padTime(1012, 1000, 1016.7, 0), 1012);
});

test('… the tick a pad drop is logged at = the press\'s own tick, and THE REPLAY lands on the same tower (REPLAY = LIVE: the log is all the server needs)', () => {
  const seed = 'pad-go', t0 = 5000, live = createRun({ seed }), log = [];
  // a pad player: every press comes 9 ms before the frame that notices it (60 fps: the poll is up to 16.7 ms late)
  let now = t0, drops = 0, ahead = 0;
  for (let i = 0; i < 4000 && drops < 25 && live.st !== 'out'; i++) {
    const prev = now; now += 1000 / 60;
    stepTo(live, tickOf(now, t0));
    if (live.st !== 'slide') continue;
    const mid = t0 + (live.s0 + live.S / 2) * 1000 / TICK_HZ;   // (dead on)
    if (now < mid + 9) continue;
    const stamp = now - 9, at = padTime(stamp, prev, now, log.length ? t0 + log[log.length - 1] * 1000 / TICK_HZ : 0), tk = tickOf(at, t0);
    assert.equal(at, stamp, 'the stamp is inside the poll window');
    if (tickOf(now, t0) > tk) ahead++;
    if (tap(live, tk)) { log.push(tk); drops++; }
  }
  assert.ok(drops >= 20, `the run climbed (${drops} drops)`);
  assert.ok(ahead > 0, `some presses were logged a tick EARLIER than the frame that noticed them (${ahead} of ${drops}) — never a frame behind a finger`);
  for (let i = 1; i < log.length; i++) assert.ok(log[i] > log[i - 1], 'the log only rises');
  const judge = createRun({ seed });
  for (const tk of log) assert.equal(tap(judge, tk), true);
  stepTo(judge, live.t);
  assert.deepEqual({ floor: judge.floor, x0: judge.x0, x1: judge.x1, z0: judge.z0, z1: judge.z1, perfects: judge.perfects }, { floor: live.floor, x0: live.x0, x1: live.x1, z0: live.z0, z1: live.z1, perfects: live.perfects });
});

test('THE KIT (kit/gamepad.js): a() / b() get the pad\'s timestamp + the poll before it; the first frame only CONNECTS; nothing is mapped to Start, the triggers or the sticks\' clicks', async () => {
  const frames = [], said = [], calls = [];
  let clock = 100;
  const b = () => ({ pressed: false, value: 0 });
  const pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, b) };
  const keep = { raf: globalThis.requestAnimationFrame, caf: globalThis.cancelAnimationFrame, doc: globalThis.document, add: globalThis.addEventListener, rem: globalThis.removeEventListener, perf: globalThis.performance.now };
  globalThis.requestAnimationFrame = fn => frames.push(fn); globalThis.cancelAnimationFrame = () => {};
  globalThis.document = { visibilityState: 'visible', querySelectorAll: () => [] };
  globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
  Object.defineProperty(globalThis.navigator, 'getGamepads', { configurable: true, value: () => [pad, null, null, null] });
  globalThis.performance.now = () => clock;
  try {
    const { wirePad } = await import('../js/games/kit/gamepad.js');
    const off = wirePad({ a: (...x) => calls.push(['a', ...x]), b: (...x) => calls.push(['b', ...x]), dir: d => calls.push(['dir', d]), say: t => said.push(t) });
    const frame = at => { clock = at; frames.shift()(); };
    pad.buttons[0] = { pressed: true, value: 1 };
    frame(100);
    assert.deepEqual(said, ['🎮 CONNECTED']); assert.deepEqual(calls, [], 'the first frame CONNECTS — the held button is learned, never a move');
    pad.buttons[0] = b(); frame(116);
    pad.buttons[0] = { pressed: true, value: 1 }; pad.timestamp = 121.5; frame(132);
    assert.deepEqual(calls, [['a', 121.5, 116]], 'A → a(the pad\'s own timestamp, the time of the poll before this one)');
    frame(148); assert.equal(calls.length, 1, 'held: no repeat');
    pad.buttons[0] = b(); pad.buttons[1] = { pressed: true, value: 1 }; pad.timestamp = 160; frame(164);
    assert.deepEqual(calls[1], ['b', 160, 148]);
    // Start (9), Back (8), the bumpers + triggers (4–7), the sticks' clicks (10, 11), Home (16): NOT MAPPED
    pad.buttons[1] = b(); frame(180);
    for (const i of [4, 5, 6, 7, 8, 9, 10, 11, 16]) { pad.buttons[i] = { pressed: true, value: 1 }; frame(clock + 16); pad.buttons[i] = b(); frame(clock + 16); }
    assert.equal(calls.length, 2, 'Start + the rest do nothing');
    off();
  } finally {
    globalThis.requestAnimationFrame = keep.raf; globalThis.cancelAnimationFrame = keep.caf; globalThis.document = keep.doc; globalThis.addEventListener = keep.add; globalThis.removeEventListener = keep.rem; globalThis.performance.now = keep.perf;
    delete globalThis.navigator.getGamepads;
  }
  const k = read('js/games/kit/gamepad.js');
  assert.match(k, /if \(r\.a\) \{ const el = padControl\('a'\); if \(el\) el\.click\(\); else if \(a\) a\(gp\.timestamp, prev\); \}/, 'an end card\'s [data-pad] control first, else the game\'s a()');
  assert.doesNotMatch(k, /highrise|jaywalk/i, 'the kit knows no game');
  // JAYWALK's use is untouched: its a() takes no argument
  assert.match(read('js/games/jaywalk/view.js'), /offPad = P\.wirePad\(\{ dir: d => hop\(d\), a: \(\) => \{ if \(watching\) nextFollow\(\); else hop\('u'\); \}, say: t => padSay\(t, P\.SAY_MS\) \}\);/);
});

// ---- THE SOLO GO on a fake line
/** a fake clock + line: `lat(t)` = a write's / a read's way there (ms; Infinity = never) · `refuse(n, t)` = the rules refuse write n */
function line({ lat = () => 60, refuse = () => false, node = null, stale = () => false } = {}) {
  let t = 0, seq = 0;
  const q = [], writes = [], reads = [];
  const timer = (fn, ms) => q.push({ at: t + ms, fn, n: seq++ });
  const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
  const L = {
    node, writes, reads,
    io: {
      now: () => t, timer, stale: () => stale(t),
      write: () => new Promise((res, rej) => { const n = writes.push(t), d = lat(t, 'write'); if (d === Infinity) return; timer(() => { if (refuse(n, t)) rej(new Error('refused')); else { if (!L.node) L.node = { go: 1_700_000_000_000 + t }; res(); } }, d); }),
      read: () => new Promise((res, rej) => { reads.push(t); const d = lat(t, 'read'); if (d === Infinity) { timer(() => rej(new Error('offline')), 3000); return; } timer(() => res(L.node), d); }),
    },
    async run(ms) {
      const end = t + ms;
      await flush();
      for (;;) {
        q.sort((a, b) => a.at - b.at || a.n - b.n);
        if (!q.length || q[0].at > end) break;
        const x = q.shift(); t = x.at; x.fn(); await flush();
      }
      t = end;
    },
    now: () => t,
  };
  return L;
}
const settled = async (L, p, ms) => { let v; p.then(x => { v = x; }); await L.run(ms); return v; };

test('THE SOLO GO (go.js#soloGo): a quick answer proves at once — ONE write, the server\'s copy read back', async () => {
  const L = line();
  const r = await settled(L, soloGo(L.io), 200);
  assert.deepEqual(r, { go: L.node.go, c: null }); assert.equal(L.writes.length, 1); assert.equal(L.reads.length, 1);
  assert.deepEqual([GO_TRIES, GO_TRY_MS, GO_WAIT_MS], [7, 420, 9000], 'the match\'s pattern (7 tries, 420 ms apart) inside 9 s — not one 4 s wait');
  assert.ok(GO_WAIT_MS >= 8000 && GO_WAIT_MS <= 10000);
});

test('… A LATE ANSWER STILL PROVES THE RUN: the line dead for 5.5 s — the ONE write lands when it is back, never sent twice; the old 4 s wait would have gone on unproven', async () => {
  // (the write waits in the SDK's queue and lands when the line is back; a read on a dead line is given up after 3 s — the SDK's own)
  const back = 5500, L = line({ lat: (t, k) => (t >= back ? 80 : k === 'write' ? back - t + 80 : Infinity) });
  const p = soloGo(L.io);
  assert.equal(await settled(L, p, 4000), undefined, 'at 4 s (the old wait): still waiting — not unproven');
  const r = await settled(L, p, 2000);
  assert.ok(r && r.go > 0, 'proven');
  assert.ok(L.reads[L.reads.length - 1] <= back + 200, `the write's own answer is read back AT ONCE — never behind an older look still hanging (${L.reads.join(' · ')})`);
  assert.equal(L.writes.length, 1, 'a write in the air is never sent again (a second GO would be refused + confuse the mirror)');
  assert.ok(L.reads.length >= 2, 'the server\'s copy was looked at again while the answer was owed');
});

test('… A DEAD LINE: nothing comes back → "no answer" at GO_WAIT_MS — still ONE write; reads every GO_LOOK_MS at most', async () => {
  const L = line({ lat: () => Infinity });
  const p = soloGo(L.io);
  assert.equal(await settled(L, p, GO_WAIT_MS - 100), undefined);
  assert.deepEqual(await settled(L, p, 600), { why: 'no answer' });
  assert.equal(L.writes.length, 1);
  for (let i = 1; i < L.reads.length; i++) assert.ok(L.reads[i] - L.reads[i - 1] >= GO_LOOK_MS, 'never a storm of reads');
});

test('… A REFUSAL is looked at and tried again (the match\'s pattern): refused twice, taken the third time → proven; every try refused → "refused" after 7 tries (~3 s), never a 9 s wait', async () => {
  const A = line({ refuse: n => n <= 2 });
  const r = await settled(A, soloGo(A.io), 3000);
  assert.ok(r && r.go > 0); assert.equal(A.writes.length, 3);
  assert.ok(A.writes[1] - A.writes[0] >= GO_TRY_MS && A.writes[1] - A.writes[0] <= GO_TRY_MS * 2, `the tries are ~${GO_TRY_MS} ms apart (${A.writes.join(' · ')})`);
  const B = line({ refuse: () => true });
  const p = soloGo(B.io);
  const rb = await settled(B, p, 5000);
  assert.deepEqual(rb, { why: 'refused' }); assert.equal(B.writes.length, GO_TRIES, 'seven tries, no more');
  assert.ok(B.now() <= 5000 && B.writes[GO_TRIES - 1] < 4000, 'the rules\' refusal is known in ~3 s');
});

test('… A REJOIN: the GO is already there (the write is refused) → the node is taken from THE SERVER, its chunks with it; a node with its end is no run', async () => {
  const c = { 0: { s: '2s.1c', at: 5 } };
  const L = line({ refuse: () => true, node: { go: 1_700_000_000_123, c } });
  assert.deepEqual(await settled(L, soloGo(L.io), 400), { go: 1_700_000_000_123, c });
  assert.equal(L.writes.length, 1);
  const E = line({ refuse: () => true, node: { go: 5, e: { f: 3 } } });
  assert.deepEqual(await settled(E, soloGo(E.io), 5000), { why: 'refused' }, 'an ended node is never adopted');
});

test('… A REFUSAL THAT TOOK TOO LONG is the rules\' 5 s window after THE STAMP (the write sat behind a dead line): never tried again, never the re-publish alarm — "no answer"', async () => {
  const L = line({ lat: (t, k) => (k === 'write' && t < 100 ? GO_LATE_MS + 500 : 60), refuse: () => true });
  const p = soloGo(L.io);
  assert.deepEqual(await settled(L, p, GO_WAIT_MS + 500), { why: 'no answer' });
  assert.equal(L.writes.length, 1, 'the tree is stamped: a second GO would be refused for good');
});

test('… THE GO GUARD: the run stopped waiting (the player left, another match) → "left", nothing more written', async () => {
  const L = line({ lat: () => Infinity, stale: t => t >= 1000 });
  assert.deepEqual(await settled(L, soloGo(L.io), 2000), { why: 'left' });
  assert.equal(L.writes.length, 1);
});

test('THE PINS: the pad is the STAGE\'s one wiring (the cartridge, the daily + the test page), lazy — never in a start bundle; the mark is on; touch is untouched', () => {
  const st = read('js/games/highrise/stage.js'), v = read('js/games/highrise/view.js'), d = read('js/games/highrise/daily-run.js');
  assert.equal(META.highrise.CONTROLLER, true);
  assert.match(st, /lazyImport\(import\('\.\.\/kit\/gamepad\.js'\), '\.\.\/kit\/gamepad\.js'\)\.then\(P => \{\s*if \(gone\) return;\s*offPad = P\.wirePad\(\{ a: padPress, say: t => padSay\(t, P\.SAY_MS\) \}\);/, 'A = a tap; no dir, no b: the D-pad, the stick + B do nothing in a run');
  assert.match(st, /addEventListener\('gamepadconnected', padOn, sig\);\s*try \{ if \(navigator\.getGamepads && \[\.\.\.navigator\.getGamepads\(\)\]\.some\(Boolean\)\) padOn\(\); \}/, 'on the first pad this page sees (or one already there)');
  for (const f of ['js/games/highrise/stage.js', 'js/games/highrise/view.js', 'js/games/highrise/daily-run.js', 'js/games/highrise/play.js', 'js/games/highrise/index.js']) assert.doesNotMatch(read(f), /^import [^\n]*gamepad\.js/m, `${f}: never a static import of the kit's pad`);
  assert.doesNotMatch(read('boot-bundle.json'), /kit\/gamepad\.js/, 'not in THE FIRST-VISIT BUNDLE');
  assert.doesNotMatch(read('js/games/preload-graph.js'), /kit\/gamepad\.js/, 'not in any cartridge\'s preload graph');
  // the pad's press goes through `touch` itself — the SAME path as a finger, which is byte for byte what it was
  assert.match(st, /function padPress\(stamp, prev\) \{\s*if \(watchW \|\| document\.visibilityState === 'hidden' \|\| \(o\.padOk && !o\.padOk\(\)\)\) return;/, 'WATCHING / hidden / a sheet open: a pad does nothing');
  assert.match(st, /const ts = padTime\(stamp, prev, now, t0 != null && n0 \? t0 \+ taps\[n0 - 1\] \* TICK_MS : 0\);\s*touch\(ts\);/);
  assert.match(st, /function touch\(ts\) \{\s*if \(sheetOpen\) return;\s*const now = performance\.now\(\);\s*if \(!\(ts > 0 && ts <= now \+ 4 && now - ts < 1000\)\) ts = now;/);
  assert.match(st, /const tk = tickOf\(ts, t0\);\s*if \(tap\(run, tk, ev\)\) taps\.push\(tk\);/);
  assert.match(st, /play\.addEventListener\('pointerdown', e => \{ if \(e\.pointerType === 'mouse' && e\.button !== 0\) return; touch\(e\.timeStamp\); \}\);/);
  // the end cards: the stage's own way out = B · the daily's BACK TO THE DAILIES = B · the podium's marks wait before a press counts
  assert.match(v, /leaveBtn = h\('button\.hi-leave', \{ type: 'button', 'data-press': '', 'data-pad': 'b',/);
  assert.match(d, /tubeButton\('BACK TO THE DAILIES', \{ kind: 'main', block: true, attrs: \{ 'data-press': true, 'data-pad': 'b' \}, onClick: \(\) => ctx\.onBack && ctx\.onBack\(true\) \}\)/);
  assert.match(v, /export const PAD_ARM_MS = 600;/); assert.match(v, /padArm = setTimeout\(\(\) => \{ for \(const \[el, k\] of marks\) if \(el\.isConnected\) el\.setAttribute\('data-pad', k\); \}, PAD_ARM_MS\);/);
  assert.match(v, /padOk: \(\) => layersOpen\(\) === 0,/); assert.match(d, /padOk: \(\) => layersOpen\(\) <= layers0,/, 'the daily: its own overlay is a layer — nothing NEW over it');
  // nothing in the daily is mapped to a pad button but the stage's A: a hold is never spent by a button
  assert.doesNotMatch(d, /wirePad|getGamepads/);
  assert.doesNotMatch(d, /soloGo|from '\.\/go\.js'/, 'THE DAILY’s GO is untouched (the server’s START — never the solo GO’s tries)');
  const css = read('css/highrise-play.css');
  assert.ok(css.includes(".hi-lines { position: absolute; z-index: 7; left: 56px; right: 56px; top: calc(env(safe-area-inset-top, 0px) + 22px);"), 'the two quiet lines — the start + the end screens: the free row between the corner buttons');
  assert.ok(css.includes(".hi-stage.is-live:not(.is-ended) .hi-lines { left: 14px; right: auto; top: calc(env(safe-area-inset-top, 0px) + 164px); max-width: 104px; text-align: left; }"), '… in a run: at the left, under the number, the SIGNAL LOST banner, the band + the announcer — narrow (clear of a three-digit floor)');
});

test('THE PINS: the lab\'s flags are the TEST PAGE\'s only (&dpr=2 · &stutter=1) — the cartridge + the daily never pass them; an empty range is not uploaded', () => {
  const st = read('js/games/highrise/stage.js'), n = read('js/games/highrise/night.js');
  assert.match(read('js/games/highrise/play.js'), /dpr: Number\(Q\.get\('dpr'\)\) \|\| 0, stutter: Q\.get\('stutter'\) === '1',/);
  assert.match(st, /const DPR_MAX = PAGE && o\.dpr > 0 \? Math\.max\(1, Math\.min\(3, Number\(o\.dpr\)\)\) : 0;/);
  assert.match(st, /initial: pin == null \? 2 : pin, stutter: PAGE && !!o\.stutter \}\);/);
  assert.match(n, /const devDpr = Math\.min\(window\.devicePixelRatio \|\| 1, o\.dprMax > 0 \? o\.dprMax : 3\);/);
  for (const f of ['js/games/highrise/view.js', 'js/games/highrise/daily-run.js']) assert.doesNotMatch(read(f), /\bdpr\b|stutter/, `${f}: the live defaults are unchanged`);
  assert.match(n, /const upRange = \(a, off, cnt\) => \{ if \(cnt <= 0\) return;/);
});

test('THE INITIATE MESSAGE (game-options.js): a start that comes back false having said nothing says COULDN’T START — TAP PLAY AGAIN (INITIATE + MOST WANTED\'s one tap); PLAY NOW has no silent leave', () => {
  const g = read('js/screens/game-options.js'), hst = read('js/host.js');
  assert.match(g, /export const COULDNT_START = 'COULDN’T START — TAP PLAY AGAIN';/);
  assert.match(g, /function saidNothing\(before\) \{ const now = msgNow\(\); if \(!now \|\| now === before\) toast\(COULDNT_START, 'err'\); \}/, 'only when host.js showed no message of its own (THE MESSAGE is one at a time)');
  assert.match(g, /if \(ok\) closeAllSheets\(\); else saidNothing\(before\);/);
  assert.match(g, /else \{ startBtn\.classList\.remove\('is-busy'\); startBtn\.firstChild\.textContent = 'INITIATE'; saidNothing\(before\); \}/);
  assert.match(hst, /toast\('COULDN’T START — TAP PLAY AGAIN', 'err'\); if \(state\.code === room\) await leaveRoom\(\)\.catch\(\(\) => \{\}\);/, 'PLAY NOW: the same line before its leave');
});
