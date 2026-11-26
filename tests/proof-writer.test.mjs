// THE PROOF PASS (Nov 20) — THE PROOF WRITER (js/games/kit/proof-writer.js — JAYWALK's + HIGH RISE's ONE copy; docs/match-kit.md "THE PROOF
// WRITER"; the review's MUST 2 a — THE LEAF WRITES, step 1: "the phone sends one chunk at a time, re-sends a refused one, never drops
// taps on the mirror alone"). PURE: a fake database with a clock of its own — every write lands (or is refused) `lat` ms later.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createProofWriter, STALL_MS, STALL_FLUSH_MS, LATE_TRIES, GIVE_UP_MS, RETRY_MS } from '../js/games/kit/proof-writer.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const tick = () => new Promise(r => setImmediate(r));

/** a fake proof node on a fake line: `refuse(kind, i, now)` → true = the rules refuse that write; `lat(now)` = its way there (ms); `down(now)` = no answer at all */
function world({ refuse = () => false, lat = () => 40, down = () => false, readable = true, flushMs = 120, pipe = false, chunkMax = 400 } = {}) {
  let now = 0, seq = 0;
  const moves = [], timers = [], wire = [], srv = { c: {}, e: null, log: [] }, said = { late: [], dead: [] };
  let left = false;
  const io = {
    now: () => now,
    timer: (fn, ms) => { timers.push({ at: now + ms, fn }); },
    chunk: (i, s) => new Promise((res, rej) => wire.push({ n: seq++, at: now + lat(now), kind: 'c', i, s, res, rej })),
    end: e => new Promise((res, rej) => wire.push({ n: seq++, at: now + lat(now), kind: 'e', e, res, rej })),
    read: () => new Promise((res, rej) => wire.push({ n: seq++, at: now + lat(now), kind: 'r', res, rej })),
  };
  const W = createProofWriter({
    count: () => moves.length, pack: (a, b) => moves.slice(a, b).join('.'),
    entriesOf: c => { if (c == null) return 0; const ks = Object.keys(c).map(Number).sort((a, b) => a - b); let n = 0; for (let i = 0; i < ks.length; i++) { if (ks[i] !== i) return -1; n += c[i].s.split('.').length; } return n; },
    chunkMax, chunks: 10000, flushMs: () => flushMs, left: () => left, onLate: w => said.late.push(w), onDead: w => said.dead.push(w), io, pipe,
  });
  /** the line: every write whose time has come lands IN THE ORDER IT WAS SENT (one client's writes never overtake each other) */
  async function deliver() {
    for (;;) {
      const w = wire[0];
      if (!w || w.at > now || down(now)) break;
      wire.shift();
      if (w.kind === 'r') { if (readable) w.res(Object.keys(srv.c).length ? JSON.parse(JSON.stringify(srv.c)) : null); else w.rej(new Error('permission_denied')); }
      else if (w.kind === 'c') {
        if (refuse('c', w.i, now) || srv.c[w.i] || srv.e) { srv.log.push(`x${w.i}`); w.rej(new Error('permission_denied')); }
        else { srv.c[w.i] = { s: w.s, at: now }; srv.log.push(`c${w.i}`); w.res(); }
      } else if (refuse('e', -1, now) || srv.e) { srv.log.push('xe'); w.rej(new Error('permission_denied')); }
      else { srv.e = { ...w.e, at: now }; srv.log.push('e'); w.res(); }
      await tick();
    }
  }
  /** `ms` of the run: `each(now)` is the game's frame (a move now and then, W.flush(false) every frame) */
  async function run(ms, each = () => {}) {
    for (const end = now + ms; now < end;) {
      now += 10;
      each(now);
      await deliver();
      for (let i = 0; i < timers.length; i++) if (timers[i].at <= now) { const t = timers.splice(i--, 1)[0]; t.fn(); }
      await tick(); await deliver();
    }
  }
  const all = () => { const ks = Object.keys(srv.c).map(Number).sort((a, b) => a - b); return ks.map(k => srv.c[k].s).join('.'); };
  const contiguous = () => Object.keys(srv.c).map(Number).sort((a, b) => a - b).every((k, i) => k === i);
  return { W, io, moves, srv, said, run, all, contiguous, setLeft: v => { left = v; }, now: () => now, wire };
}
/** a player: a move every `every` ms, the frame's own flush */
const player = (w, every = 150) => t => { if (t % every === 0) w.moves.push(`m${w.moves.length}`); w.W.flush(false); };

test('ONE BURST AT A TIME: the next chunk leaves only once the one before it is ACKNOWLEDGED — a later chunk never lands before an earlier one', async () => {
  const w = world({ lat: () => 300 });
  w.W.reset();
  await w.run(3000, player(w, 100));
  assert.ok(w.contiguous() && w.all() === w.moves.slice(0, w.all().split('.').length).join('.'), 'the log on the server = the moves in order, no hole');
  assert.ok(Object.keys(w.srv.c).length <= 11, `a chunk a round trip (300 ms): ${Object.keys(w.srv.c).length} chunks in 3 s — never one a move`);
  const ats = Object.values(w.srv.c).map(c => c.at);
  assert.ok(ats.every((a, i) => !i || a >= ats[i - 1] + 300), 'each chunk lands a whole round trip after the one before: it was sent behind its acknowledgement');
  assert.ok(Object.values(w.srv.c).slice(1).some(c => c.s.split('.').length >= 3), 'the moves made meanwhile ride together in the next chunk');
  w.W.end({ f: 1 });
  await w.run(1500);
  assert.equal(w.all(), w.moves.join('.'), 'every move is there');
  assert.equal(w.srv.log.at(-1), 'e', 'the end is the LAST write — behind the last chunk\'s acknowledgement');
  assert.equal(w.W.state().end, 3);
});

test('hole (a) — A HOST FLIPS THE PHASE: a REFUSED chunk is read back + SENT AGAIN at the same index; the log never has a hole, whatever the flips (300 random matches)', async () => {
  // one clear case: refused twice, then it lands — the same index, the moves of the meantime with it
  const flip = { from: 500, to: 1400 };
  const w = world({ refuse: (k, i, now) => now >= flip.from && now < flip.to });
  w.W.reset();
  await w.run(4000, player(w));
  assert.ok(w.srv.log.includes('x3') || w.srv.log.some(x => x[0] === 'x'), 'chunks were refused during the flip');
  assert.ok(w.contiguous(), 'no hole');
  w.W.end({ l: 1 });
  await w.run(1000);
  assert.equal(w.all(), w.moves.join('.'), 'every move landed — the refused ones too');
  assert.equal(w.srv.e.l, 1);
  assert.deepEqual(w.said.dead, []);
  // … and at random: flips of 100 … 2500 ms at any moment, lines of 20 … 600 ms, sometimes unreadable nodes
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let m = 0; m < 300; m++) {
    const flips = Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => { const a = Math.floor(rnd() * 6000); return [a, a + 100 + Math.floor(rnd() * 2400)]; });
    const lag = 20 + Math.floor(rnd() * 580), x = world({ refuse: (k, i, now) => flips.some(([a, b]) => now >= a && now < b), lat: () => lag, readable: rnd() > 0.2 });
    x.W.reset();
    await x.run(7000, player(x, 100 + Math.floor(rnd() * 5) * 50));
    x.W.end({ l: 2 });
    await x.run(9000);
    assert.ok(x.contiguous(), `match ${m}: no hole (flips ${JSON.stringify(flips)}, line ${lag} ms)`);
    assert.equal(x.all(), x.moves.join('.'), `match ${m}: every move landed`);
    assert.equal(x.srv.log.at(-1), 'e', `match ${m}: the end last`);
    const idx = x.srv.log.filter(l => l[0] === 'c').map(l => Number(l.slice(1)));
    assert.ok(idx.every((v, i) => v === i), `match ${m}: the chunks landed in index order`);
  }
});

test('NEVER DROPPED ON THE MIRROR ALONE: a mirror that says "the match moved on" (the host\'s word) drops nothing while the rules still take the chunks; the moves go only after LATE_TRIES refusals in that state — a quiet count', async () => {
  // the host flips the phase the phone SEES (not what the rules read — the re-published rules read nothing of his): everything still lands
  const a = world();
  a.W.reset();
  await a.run(1000, player(a));
  a.setLeft(true);
  await a.run(2000, player(a));
  a.W.end({ l: 3 });
  await a.run(600);
  assert.equal(a.all(), a.moves.join('.'), 'the mirror said "left": nothing dropped');
  assert.ok(a.said.late.includes('seen') && !a.said.late.includes('dropped'), 'each write was only marked EXPECTED-if-refused');
  assert.equal(a.srv.e.l, 3, 'the end too');
  // the match REALLY is over (the old rules: every chunk refused once it left `play`): LATE_TRIES more tries, then dropped — once
  const b = world({ refuse: (k, i, now) => now >= 1000 });
  b.W.reset();
  await b.run(990, player(b));
  const before = b.all();
  b.setLeft(true);
  await b.run(12000, player(b));
  const refused = b.srv.log.filter(l => l[0] === 'x').length;
  assert.equal(refused, LATE_TRIES + 1, `${LATE_TRIES + 1} refusals (the first + ${LATE_TRIES} more) — then no more writes`);
  assert.deepEqual(b.said.late.filter(x => x === 'dropped'), ['dropped'], 'dropped once: one quiet count');
  assert.equal(b.all(), before, 'what had landed stays');
  assert.equal(b.W.state().dead, 'late');
  b.W.end({ l: 1 });
  await b.run(3000);
  assert.equal(b.srv.log.filter(l => l === 'xe').length, 1, 'the end of an over match: tried once, never again');
});

test('A DEAD LINE (THE DROPPED SIGNAL): no answer for STALL_MS → the new moves queue behind the unanswered chunk once a second and land TOGETHER, in order, when the line is back — the end with them', async () => {
  const w = world({ down: now => now >= 1000 && now < 31000 });
  w.W.reset();
  await w.run(20000, player(w, 200));
  assert.ok(w.wire.filter(x => x.kind === 'c').length >= 15, `the moves of the silence are queued on the line (${w.wire.length}) — not held back on the phone`);
  assert.ok(w.wire.filter(x => x.kind === 'c').length <= 20, 'about one chunk a second while the line is dead');
  w.W.end({ l: 9 });
  await w.run(10900);
  assert.ok(!w.srv.e, 'still silent');
  const n0 = w.now();
  await w.run(200);
  const landed = Object.values(w.srv.c).filter(c => c.at >= n0);
  assert.ok(landed.length >= 15 && landed.every(c => c.at - landed[0].at < 20), 'the queued chunks all landed in the same instant: a burst, each less late than the one before — what THE JUDGE wants of a dropped signal');
  assert.equal(w.all(), w.moves.join('.')); assert.ok(w.contiguous());
  assert.equal(w.srv.e.l, 9, 'the end rode behind them');
  assert.equal(w.srv.log.at(-1), 'e');
  assert.equal(STALL_MS, 1500); assert.equal(STALL_FLUSH_MS, 1000);
});

test('A REJOIN: the chunks are read fresh from the SERVER before the first write — an index already there is never sent again; the tree deleted under the run → the writer starts over (the rules then refuse a node with no GO)', async () => {
  const w = world();
  for (let i = 0; i < 6; i++) w.moves.push(`m${i}`);
  w.srv.c = { 0: { s: 'm0.m1', at: 1 }, 1: { s: 'm2.m3', at: 2 }, 2: { s: 'm4', at: 3 } };   // (a chunk more than this phone's mirror showed)
  w.W.reset({ sent: 4, next: 2, verify: true });
  await w.run(800, () => w.W.flush(false));
  assert.deepEqual(Object.keys(w.srv.c), ['0', '1', '2', '3'], 'index 2 was there: the next one written is 3');
  assert.equal(w.all(), 'm0.m1.m2.m3.m4.m5'); assert.equal(w.srv.log.filter(l => l[0] === 'x').length, 0, 'no refused write at all');
  // an unreadable node (JAYWALK's daily never reads): it simply goes on from what the phone knows
  const u = world({ readable: false });
  for (let i = 0; i < 3; i++) u.moves.push(`m${i}`);
  u.srv.c = { 0: { s: 'm0', at: 1 } };
  u.W.reset({ sent: 1, next: 1, verify: true });
  await u.run(600, () => u.W.flush(false));
  assert.equal(u.all(), 'm0.m1.m2');
  // a hole on the server (a chunk landed behind a missing one — it can not be repaired: the chunks' clock would run backwards)
  const h = world();
  for (let i = 0; i < 4; i++) h.moves.push(`m${i}`);
  h.srv.c = { 0: { s: 'm0', at: 1 }, 2: { s: 'm2', at: 3 } };
  h.W.reset({ sent: 1, next: 1, verify: true });
  await h.run(600, () => h.W.flush(false));
  assert.deepEqual(h.said.dead, ['hole'], 'said once — the run can not count'); assert.deepEqual(Object.keys(h.srv.c), ['0', '2'], 'nothing more is written into it');
});

test('IT GIVES UP ONLY WHEN NOTHING MORE CAN COUNT: GIVE_UP_MS of refusals while the mirror still says `play` → said once; the retries back off 0.4 · 0.8 · 1.6 · 3 s', async () => {
  const w = world({ refuse: (k, i, now) => now >= 500, chunkMax: 100000 });
  w.W.reset();
  await w.run(GIVE_UP_MS + 8000, player(w, 500));
  const xs = w.srv.log.filter(l => l[0] === 'x').length;
  assert.ok(xs >= 25 && xs <= 40, `a try every ~3 s for ${GIVE_UP_MS / 1000} s (${xs}) — never a flood`);
  assert.deepEqual(w.said.dead, ['refused']);
  assert.deepEqual([...RETRY_MS], [400, 800, 1600, 3000]);
  assert.equal(GIVE_UP_MS, 90_000, 'a chunk that lands later than THE DROPPED SIGNAL\'s 75 s can not count any more');
});

test('`pipe` (JAYWALK\'s DAILY — its own node + rules): the old way, exactly — every chunk at once, none sent again; a long chunk is split under the rules\' 400 characters; close() sends what is logged and stops', async () => {
  const p = world({ pipe: true, lat: () => 500, refuse: (k, i) => i === 1 });
  p.W.reset();
  await p.run(2000, player(p, 100));
  assert.ok(p.srv.log.filter(l => l === 'x1').length === 1, 'the refused chunk is not sent again');
  assert.ok(Object.keys(p.srv.c).length >= 10, 'a chunk a flush, never waiting for an answer');
  // the 400-character bound
  const s = world({ chunkMax: 40 });
  for (let i = 0; i < 60; i++) s.moves.push(`m${i}`);
  s.W.reset();
  await s.run(3000, () => s.W.flush(false));
  assert.ok(Object.values(s.srv.c).every(c => c.s.length <= 40) && s.all() === s.moves.join('.'), 'split under the bound, all of it there');
  // close(): a QUIT mid-run
  const q = world({ lat: () => 400 });
  q.W.reset();
  await q.run(300, player(q, 100));
  q.moves.push('last');
  q.W.close();
  await q.run(1500, () => q.W.flush(true));
  assert.equal(q.all(), q.moves.join('.'), 'what was logged left at the quit');
  q.moves.push('after');
  await q.run(1000, () => q.W.flush(true));
  assert.ok(!q.all().includes('after'), 'nothing after close()');
});

test('BOTH GAMES USE THE ONE WRITER — and the screens never write a chunk themselves; the kit\'s GO stamps the tree first', () => {
  const jw = read('js/games/jaywalk/view.js'), hr = read('js/games/highrise/view.js'), io = read('js/games/kit/proof-io.js'), wr = read('js/games/kit/proof-writer.js');
  for (const [name, v] of [['jaywalk', jw], ['highrise', hr]]) {
    assert.ok(v.includes(name === 'jaywalk' ? "import { createProofWriter, goBehind } from '../kit/proof-writer.js';" : "import { createProofWriter } from '../kit/proof-writer.js';") && v.includes("import { proofIo, stampT0, writeMatchGo } from '../kit/proof-io.js';"), `${name}: the kit's writer`);
    assert.doesNotMatch(v, /\/c\/\$\{/, `${name}: no chunk path of its own`);
    assert.doesNotMatch(v, /dbUpdate|runTransaction/, `${name}: the end + the GO transaction are the kit's`);
    // (JAYWALK FINAL — THE FIRST-TAP HOLD: JAYWALK's solo GO waits for the stamp AND the scene's warm-up gate — the stamp still first, at the tap)
    const soloGo = name === 'jaywalk' ? v.includes("goBehind({ stamp: () => stampT0(treePath(), 'jaywalk'), gate: startGate,") && v.includes('write: () => dbSet(dbRef(path), serverTimestamp()), read: () => dbGet(dbRef(path)) })') && wr.includes('return Promise.all([stamp(), gate()]).then(() => { if (!waiting()) return null; rearm(); return Promise.resolve(write()).then(read); });') : v.includes(`stampT0(treePath(), '${name}').then(() => (stale() ? Promise.reject(new Error('the run stopped waiting')) : dbSet(dbRef(path), serverTimestamp())))`);   // (HIGH RISE PAD + GO: inside go.js#soloGo's write — the stamp still first, the GO only while the run still waits)
    assert.ok(soloGo && v.includes(`writeMatchGo(treePath(), uid, '${name}', runs)`), `${name}: the stamp ahead of a solo GO; the kit's GO in a match`);
    assert.ok(v.includes('W.close();'), `${name}: the writer is closed with the view`);
  }
  assert.ok(jw.includes('io: proofIo(nodePath), pipe: !!D,'), 'JAYWALK\'s daily keeps the old way');
  assert.doesNotMatch(wr, /^import /m, 'the writer is PURE: no imports (the unit job installs nothing)');
  assert.ok(io.includes("expectRefusal(path, `${label} t0: the tree is already stamped or begun, or the rules are not re-published yet`, 8000, 'none');"), 'a refused stamp is EXPECTED and silent (no quiet count of its own)');
  assert.ok(io.includes("return stamp.then(() => runTransaction(dbRef(path), cur => (cur == null ? serverTimestamp() : undefined), { applyLocally: false }))"), "the GO goes up behind the stamp's answer (THE CONSOLE FIX: the stamp needs the tree empty)");
});

// FREEFALL F4B — THE PAUSE GAP: a hold is GRANTED only if its own chunk ARRIVES within 2 s of the hold (js/games/freefall/proof.js CLOCK.grant).
// A phone being locked may not live to see the chunk in the air answered — `flush('now')` sends what is logged AT ONCE, behind it.
test("flush('now') (FREEFALL's pause): what is logged leaves AT ONCE even behind a chunk in the air — in order, no hole; a refusal among them is still found + sent again; flush(true) still waits", async () => {
  // a slow line (a 600 ms round trip): a chunk is in the air when the page hides
  const w = world({ lat: () => 600 });
  w.W.reset();
  w.moves.push('a0', 'a1'); w.W.flush(true);
  await w.run(100);
  assert.equal(w.W.state().flights, 1, 'the first chunk is in the air');
  w.moves.push('hold');
  w.W.flush(true);   // (the old path: it waits for the answer)
  assert.equal(w.W.state().flights, 1, 'flush(true) sends nothing behind an unanswered chunk');
  const sentAt = w.now();
  w.W.flush('now');
  assert.equal(w.W.state().flights, 2, 'flush("now") sends the hold\'s chunk at once');
  await w.run(1500);
  assert.equal(w.all(), 'a0.a1.hold'); assert.ok(w.contiguous());
  assert.ok(w.srv.c[1].at - sentAt <= 620, `the hold's chunk arrived one WAY after the hide (${w.srv.c[1].at - sentAt} ms) — not a round trip + a way`);
  assert.deepEqual(w.srv.log, ['c0', 'c1']);
  // … the chunk in the air is REFUSED (the rules' hiccup): the one sent behind it is refused with it (a hole), both go again — nothing lost, nothing twice
  let hiccup = true;
  const w2 = world({ lat: () => 200, refuse: (kind, i) => kind === 'c' && (hiccup || !!(i > 0 && !w2.srv.c[i - 1])) });
  w2.W.reset();
  w2.moves.push('a0'); w2.W.flush(true);
  await w2.run(50);
  w2.moves.push('hold'); w2.W.flush('now');
  await w2.run(400); hiccup = false;
  await w2.run(6000, () => w2.W.flush(false));
  assert.equal(w2.all(), 'a0.hold', 'both are there after the refusal — in order'); assert.ok(w2.contiguous());
  assert.equal(w2.said.dead.length, 0);
});
