// FREEFALL F4A — THE PROOF (docs/freefall.md "THE PROOF"; js/games/freefall/proof.js — PURE): the chunks a run writes ARE its packed log
// (only FINAL events ever go up), the judge of a node == the live run, THE SPEED CHECK both ways + THE DROPPED SIGNAL, THE HOLDS' own
// clock (a resume stamp a hold), and every hostile node gets its refusal — nothing throws.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, stepTo, turn, hold, isOver, resultOf, logOf } from '../js/games/freefall/engine.js';
import { packRun, judgeRun } from '../js/games/freefall/replay.js';
import { makeBot, playBot } from '../js/games/freefall/bot.js';
import { seedOf } from '../js/games/freefall/logic.js';
import { TICK_HZ } from '../js/games/freefall/tuning.js';
import { finalCount, packRange, logFromChunks, eventsOf, chunkTimes, stampsOf, clockProblem, judgeNode, judgeSolo, CLOCK, START_LEAD_MS, RESUME_LEAD_MS, CHUNKS_PER_SEC, HOLD_STAMPS } from '../js/games/freefall/proof.js';

const MS = 1000 / TICK_HZ, GO = 1_800_000_000_000;
const rng = seed => { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

/**
 * a finished bot log played AGAIN the way a phone plays it: tick by tick, the new FINAL events sent as a chunk every `every` ticks —
 * each stamped with the server time it "arrives" at (its tick's wall time + `lag` ms). `holds` = [{ at: a tick, away: ms }] (solo): the
 * run is held there, the stamp written `away` ms later, the run on RESUME_LEAD_MS after it.
 * → { run, node, chunks: [string] }
 */
function playLive({ seed, mode = 'solo', log, every = 15, lag = 80, holds = [], go = GO, stamp = true }) {
  const run = createRun({ seed, mode }), c = {}, h = {}, chunks = [];
  let sent = 0, i = 0, hi = 0, shift = 0;   // shift: the wall ms the holds added
  const flush = (T, extra = 0) => {
    const n = finalCount(run);
    if (n > sent) { const s = packRange(run, sent, n); c[chunks.length] = { s, at: Math.round(go + START_LEAD_MS + T * MS + shift + lag + extra) }; chunks.push(s); sent = n; }
  };
  const end = 200000;
  for (let T = 0; T < end && !isOver(run); T++) {
    while (i < log.length && log[i].t === T) { const e = log[i++]; const d = ((e.a - run.a + 6144) % 4096) - 2048; assert.equal(turn(run, T, d), d, 'the bot\'s own move is taken as written'); }
    stepTo(run, T);
    if (hi < holds.length && holds[hi].at === T && !isOver(run)) {
      const ok = hold(run, T + 1);
      if (ok) {
        flush(T + 1);   // (the page is hidden: what is final goes up now — the hold with it)
        const away = holds[hi].away;
        if (stamp !== false && !(stamp === 'skip' && hi === 0)) h[run.holds - 1] = Math.round(go + START_LEAD_MS + (T + 1) * MS + shift + away);
        shift += away + RESUME_LEAD_MS;
        T = T + 1;   // (the run goes on AT the hold's tick: the loop's ++ steps past it)
        // (the bot's own moves were made on a clock with no hold: they keep their ticks — a move at / before the hold's tick already counted)
      }
      hi++;
    }
    if (T % every === 0) flush(T);
  }
  flush(run.end);
  return { run, node: { go, c, ...(Object.keys(h).length ? { h } : {}) }, chunks };
}
const botLog = (seed, id = 'great', mode = 'solo', maxFloor = 60) => { const run = createRun({ seed, mode }); playBot(run, makeBot(id, seed), { maxFloor }); return logOf(run); };

test('THE CHUNKS ARE THE PACKED LOG: a phone-like session (moves that arrive with EARLIER event ticks, two at one tick, holds) sends only FINAL events — the chunks, joined, are exactly packRun at the end (400 sessions)', () => {
  for (let k = 0; k < 400; k++) {
    const r = rng(0x9e3779b9 ^ (k * 2654435761)), run = createRun({ seed: `fz-${k}`, mode: 'solo' });
    let F = 0, sent = 0, joined = '';
    const sentAt = [];
    while (!isOver(run) && F < 4000) {
      F += 1 + Math.floor(r() * 2);
      // (a frame's moves: their EVENT ticks lie up to 3 ticks before the frame — FAIR INPUT — never going back)
      let et = Math.max(0, F - 3);
      for (let m = Math.floor(r() * 4); m > 0; m--) { et = Math.min(F, et + Math.floor(r() * 2)); const d = Math.floor((r() - 0.5) * 400); if (d) turn(run, et, d); }
      stepTo(run, F);
      if (r() < 0.004 && !isOver(run)) hold(run, Math.max(F + 1, run.mt));
      if (r() < 0.3) {
        const n = finalCount(run);
        assert.ok(n >= sent, 'the final count never goes back');
        if (n > sent) { joined += packRange(run, sent, n); sent = n; sentAt.push(n); }
      }
    }
    if (!isOver(run)) stepTo(run, 200000);
    const n = finalCount(run);
    assert.equal(n, run.lt.length + run.ht.length, 'a run that is over: every event is final');
    joined += packRange(run, sent, n);
    assert.equal(joined, packRun(run), `session ${k}: the chunks ARE the packed log (nothing sent was ever changed or dropped by the engine)`);
    assert.equal(packRange(run, 0, n), packRun(run));
  }
});

test('finalCount: nothing is final before a landing is decided behind it; every move at / before the last landing or the last hold is; a hold is final at once', () => {
  const run = createRun({ seed: 'fin', mode: 'solo' });
  turn(run, 3, 50); turn(run, 4, 20);
  assert.equal(finalCount(run), 0, 'two moves before the first landing: the last may still merge with a move at its tick');
  stepTo(run, 18);   // (the first landing, tick 18)
  assert.equal(run.ll, 18); assert.equal(finalCount(run), 2);
  turn(run, 20, 30);
  assert.equal(finalCount(run), 2, 'a move after the landing waits for the next one');
  assert.equal(hold(run, 25), true);
  assert.equal(finalCount(run), 4, 'held: the move before the hold + the hold itself');
  assert.equal(packRange(run, 0, 4), packRun(run));
  assert.equal(packRange(run, 2, 4), packRun(run).slice(packRange(run, 0, 2).length));
});

test('THE JUDGE OF A NODE == THE LIVE RUN: honest bot runs written as chunks (every 250 ms, 80 ms on the line) are accepted, floor for floor (solo + match)', () => {
  for (const [id, mode] of [['great', 'solo'], ['good', 'solo'], ['sloppy', 'solo'], ['human', 'match'], ['great', 'match']]) for (let k = 0; k < 12; k++) {
    const seed = `pj-${id}-${k}`, log = botLog(seed, id, mode, 70), P = playLive({ seed, mode, log }), live = resultOf(P.run);
    assert.equal(P.chunks.join(''), packRun(P.run));
    const L = logFromChunks(P.node.c);
    assert.deepEqual(L.log, logOf(P.run)); assert.equal(eventsOf(P.node.c), L.log.length);
    for (const s of P.chunks) assert.ok(s.length <= CLOCK.chunkMax && /^[.+\-!]/.test(s), 'a chunk begins an event, within the rules\' length');
    const v = judgeNode({ seed, mode, node: P.node });
    assert.equal(v.ok, true, `${seed}: ${v.why}`);
    assert.deepEqual([v.floor, v.tick, v.end, v.cause], [live.floor, live.tick, live.end, live.cause]);
    assert.equal(v.cut, undefined);
    assert.deepEqual(judgeRun({ seed, mode, log: L.log }).floor, live.floor);
  }
  // the solo door: the seed is picked from the node's own GO
  const code = 'ABCD', matchId = 'm1', seed = seedOf(code, matchId, GO), P = playLive({ seed, log: botLog(seed, 'good') });
  const v = judgeSolo({ code, matchId, node: P.node });
  assert.equal(v.ok, true); assert.equal(v.floor, resultOf(P.run).floor);
  assert.deepEqual(judgeSolo({ code, matchId, node: null }), { ok: false, why: 'no go' });
  assert.equal(judgeSolo({ code: 'ZZZZ', matchId, node: P.node }).floor === v.floor && judgeSolo({ code: 'ZZZZ', matchId, node: P.node }).tick === v.tick, false, 'another room = another tower: the same log is another run');
  // an EMPTY log is an honest run: floor 0, THE LIGHTS WENT OUT (a report must not count it as a play — match-report.js)
  assert.deepEqual((({ ok, floor, cause }) => ({ ok, floor, cause }))(judgeNode({ seed, node: { go: GO } })), { ok: true, floor: 0, cause: 'dark' });
});

test('THE HOLDS (solo): a held run is judged through its holds — the time away is no lateness, the way back needs its stamp; a match / the daily never holds', () => {
  const seed = 'hold-1', log = botLog(seed, 'great', 'solo', 90);
  // held twice — away 4 s and 3 minutes (far past THE DROPPED SIGNAL's 75 s): honest, counted whole
  const P = playLive({ seed, log, holds: [{ at: 200, away: 4000 }, { at: 700, away: 180_000 }] });
  assert.equal(P.run.holds, 2);
  const v = judgeNode({ seed, node: P.node }), live = resultOf(P.run);
  assert.equal(v.ok, true, v.why); assert.equal(v.cut, undefined);
  assert.deepEqual([v.floor, v.tick, v.end, v.holds], [live.floor, live.tick, live.end, 2]);
  assert.deepEqual(stampsOf(P.node).length, 2);
  // … the SAME log with its holds taken out replays to the same run (THE HOLD = EXACT RESUME)
  assert.equal(judgeRun({ seed, mode: 'solo', log: logOf(P.run).filter(e => !e.k) }).floor, live.floor);
  // F4B — THE PAUSE GAP (the owner, Nov 26: "a pause is granted only after the moves before it are sent + stamped; nothing arrives late").
  // F4A let the chunk that carries a hold — and the 8 s of play before it — arrive at ANY time (the run's clock stood at the hold): the
  // tail a locked phone "could not send" counted minutes later, and so did a modified phone's slow motion. Now the hold's own chunk must
  // ARRIVE within CLOCK.grant (2 s) of the hold's tick — later = no pause was granted: the run is CUT before that chunk.
  const keys = Object.keys(P.node.c).map(Number), T = chunkTimes(P.node.c);
  const hc = keys.find(i => T[i].hn > 0 && T[i].s1 >= 1 && T[i].s0 <= 1);   // the chunk that carries the SECOND hold (tick 701)
  const before = T.slice(0, hc).reduce((n, k) => n + k.n, 0), paused2 = P.node.c[hc].at - 80;   // (playLive: a chunk arrives 80 ms after its tick)
  assert.equal(T[hc].hn, 1);
  const cutAt = n => judgeRun({ seed, mode: 'solo', log: logOf(P.run).slice(0, n) });
  for (const lateMs of [CLOCK.grant * MS + 400, 8000, 180_000 - 50]) {
    const late = structuredClone(P.node);
    late.c[hc].at = Math.round(paused2 + lateMs);   // … the hold's chunk lands late (the last: just before the way back was stamped, 3 minutes on)
    const v = judgeNode({ seed, node: late });
    assert.equal(v.ok, true, `a pause whose chunk came ${Math.round(lateMs)} ms late is never refused whole (${v.why})`);
    assert.deepEqual(v.cut, { why: 'pause', tick: 701 }, 'no pause was granted: the run is CUT before the hold\'s own chunk');
    assert.equal(v.holds, 1, 'the first (granted) pause stays; the late one is not in the judged run');
    assert.deepEqual([v.floor, v.tick], [cutAt(before).floor, cutAt(before).tick], 'counted up to the events before that chunk — the tower standing still after them');
    assert.ok(v.floor <= live.floor);
  }
  // … AN HONEST PAUSE STILL COUNTS: the hold's chunk a network's beat late — up to the grant — is the run whole
  for (const lateMs of [300, 1200, CLOCK.grant * MS - 50]) {
    const ok = structuredClone(P.node); ok.c[hc].at = Math.round(paused2 + lateMs);
    const v = judgeNode({ seed, node: ok });
    assert.equal(v.ok, true, v.why); assert.equal(v.cut, undefined, `${Math.round(lateMs)} ms: granted`); assert.deepEqual([v.floor, v.tick, v.holds], [live.floor, live.tick, 2]);
  }
  // … A PAUSE CAN NO LONGER CARRY LATE MOVES — the modified phone: the 8 s of play before the hold played in SLOW MOTION (a minute for 8 s),
  // every chunk of them sent with the hold when it is done. F4A: counted whole. Now: nothing of the slow part counts — the cut lies at the
  // last ON-TIME event before the silence (an open "dropped signal" is no excuse before a pause that was never granted)
  {
    const slow = structuredClone(P.node), from = keys.find(i => T[i].t1 >= 701 - CLOCK.behind + 30 && i <= hc);
    assert.ok(from < hc, 'several chunks lie in the 8 s before the hold');
    for (let i = from; i <= hc; i++) slow.c[i].at = Math.round(paused2 + 60_000);
    const v = judgeNode({ seed, node: slow }), kept = T.slice(0, from).reduce((n, k) => n + k.n, 0);
    assert.equal(v.ok, true, v.why); assert.deepEqual(v.cut, { why: 'pause', tick: 701 });
    assert.deepEqual([v.floor, v.tick], [cutAt(kept).floor, cutAt(kept).tick], 'the slow-motion moves bought nothing');
    assert.ok(cutAt(kept).floor <= cutAt(before).floor);
  }
  // … and the FIRST hold not granted: none of the run's later segments has a say (the clock never stood: holds 0)
  {
    const h0 = keys.find(i => T[i].hn > 0), late = structuredClone(P.node);
    late.c[h0].at += 5000; for (const i of keys) if (i > h0 && late.c[i].at < late.c[h0].at) late.c[i].at = late.c[h0].at;
    const v = judgeNode({ seed, node: late });
    assert.equal(v.ok, true, v.why); assert.deepEqual(v.cut, { why: 'pause', tick: 201 }); assert.equal(v.holds, undefined);
  }
  // no stamp for the first hold's way back: the run is CUT at that hold (it counts up to it — never refused, never counted past it)
  const P2 = playLive({ seed, log, holds: [{ at: 200, away: 4000 }], stamp: false });
  const v2 = judgeNode({ seed, node: P2.node });
  assert.equal(v2.ok, true); assert.deepEqual(v2.cut, { why: 'hold', tick: 201 });
  const upTo = logOf(P2.run); let n = upTo.findIndex(e => e.k) + 1;
  assert.deepEqual(v2.floor, judgeRun({ seed, mode: 'solo', log: upTo.slice(0, n) }).floor, 'judged through the hold, the tower standing still after it');
  // THE FRESH-EYES REVIEW's HIGH — A STAMP THAT LANDS LATE: the phone got no answer in three counts, went on by its own clock (it says NOT
  // COUNTED PAST THE PAUSE) — and the stamp's write landed when the line was back. The events past the hold are AHEAD of that stamp's
  // clock: the run is CUT at the hold (counted through it — what the phone promised), never refused whole
  for (const lateMs of [4000, 30_000, 600_000]) {
    const late = structuredClone(P2.node), paused = GO + START_LEAD_MS + 201 * MS;
    // (the run went on 4 s + the count after the hold — playLive's own clock for the chunks; the stamp says it began `lateMs` later than that)
    late.h = { 0: Math.round(paused + 4000 + lateMs) };
    const v = judgeNode({ seed, node: late });
    assert.equal(v.ok, true, `a stamp ${lateMs} ms late: never refused (${v.why})`); assert.deepEqual(v.cut, { why: 'hold', tick: 201 });
    assert.equal(v.floor, v2.floor, 'counted through the hold — the same as with no stamp at all');
  }
  // (… a stamp only a touch late — inside the 2 s the clock allows ahead — is the honest one: the run whole)
  { const ok = structuredClone(P2.node); ok.h = { 0: Math.round(GO + START_LEAD_MS + 201 * MS + 4000 + 1500) }; const v = judgeNode({ seed, node: ok }); assert.equal(v.ok, true); assert.equal(v.cut, undefined); assert.equal(v.floor, resultOf(P2.run).floor); }
  // … and AHEAD in the run's FIRST segment stays a refusal (a log made in advance — no hold to cut at): the speed check's own test, below
  // a stamp BEFORE its own hold (the clock would run backwards): refused
  const bad = structuredClone(P.node); bad.h[0] = GO + 100;
  assert.deepEqual(judgeNode({ seed, node: bad }), { ok: false, why: 'hold clock' });
  // a stamp that is not a number ends the list (the hold after it has no clock: cut there)
  const odd = structuredClone(P.node); odd.h[0] = 'soon';
  assert.equal(stampsOf(odd).length, 0); assert.equal(judgeNode({ seed, node: odd }).cut.why, 'hold');
  assert.equal(HOLD_STAMPS, 3);
  // A HOLD IN A NON-SOLO RUN: refused by name — a match / the daily never holds
  for (const mode of ['match', 'daily']) {
    const run = createRun({ seed, mode: 'solo' }); turn(run, 5, 40); stepTo(run, 30); hold(run, 31); turn(run, 40, 20); stepTo(run, 2000);
    const c = { 0: { s: packRun(run), at: GO + START_LEAD_MS + 2100 * MS } };
    assert.deepEqual(judgeNode({ seed, mode, node: { go: GO, c, h: { 0: GO + START_LEAD_MS + 31 * MS + 500 } } }), { ok: false, why: 'too many holds' });
  }
  // a 4th hold in solo: the engine never takes it — a log that claims one is refused
  const hs = i => GO + START_LEAD_MS + 3000 * (i + 1);
  const four = { go: GO, c: { 0: { s: '+1!5!5!5!5', at: hs(2) + RESUME_LEAD_MS + 1000 } }, h: { 0: hs(0), 1: hs(1), 2: hs(2) } };
  assert.deepEqual(judgeNode({ seed, node: four }), { ok: false, why: 'too many holds' });
  // (F4B: … with no stamp at all too — more holds than the mode has is named BEFORE the clock: a cut never makes a shorter honest run of it)
  assert.deepEqual(judgeNode({ seed, node: { go: GO, c: four.c } }), { ok: false, why: 'too many holds' });
  // (… three holds, no stamp: CUT at the first hold — one hold, counted to there. The chunk is ON TIME for its first hold: tick 5)
  assert.deepEqual((v => [v.ok, v.holds, v.cut])(judgeNode({ seed, node: { go: GO, c: { 0: { s: '+1!5!5!5', at: GO + START_LEAD_MS + 500 } } } })), [true, 1, { why: 'hold', tick: 5 }]);
});

test('THE SPEED CHECK: a log made in advance (AHEAD) is refused · slow motion (BEHIND, no silence) is CUT at its last on-time event · THE DROPPED SIGNAL (a silence, then a burst that catches up) is honest', () => {
  const seed = 'clock-1', log = botLog(seed, 'great', 'solo', 80), P = playLive({ seed, log }), live = resultOf(P.run);
  assert.ok(live.floor >= 40);
  const T = chunkTimes(P.node.c), keys = Object.keys(P.node.c).map(Number);
  // AHEAD: the whole log uploaded one second after GO (a perfect run computed offline) — in its 250 ms chunks: more chunks than a second holds
  const fast = structuredClone(P.node); for (const i of keys) fast.c[i].at = GO + 1000 + i;
  assert.deepEqual(judgeNode({ seed, node: fast }), { ok: false, why: 'too many chunks' });
  // … the same log in a FEW full chunks (as a script would send it): ahead of the clock
  const events = P.chunks.join('').match(/(\.[0-9a-z]+)?[+-][0-9a-z]+|![0-9a-z]+/g), big = [];
  for (const e of events) { if (!big.length || big[big.length - 1].length + e.length > CLOCK.chunkMax) big.push(''); big[big.length - 1] += e; }
  assert.equal(big.join(''), packRun(P.run));
  const few = at => ({ go: GO, c: Object.fromEntries(big.map((x, i) => [i, { s: x, at: at(i) }])) });
  const bigT = chunkTimes(few(() => GO + 1).c);
  assert.deepEqual(judgeNode({ seed, node: few(i => GO + 1000 + i) }), { ok: false, why: 'ahead of the clock' });
  // … a run played at double speed
  assert.deepEqual(judgeNode({ seed, node: few(i => Math.round(GO + START_LEAD_MS + bigT[i].t1 * MS / 2 + 80)) }), { ok: false, why: 'ahead of the clock' });
  // (… a full 400-character chunk holds more than 8 s of play: sent whole as its LAST event is played, its first is already too old — an honest phone sends every 250 ms)
  assert.equal(judgeNode({ seed, node: few(i => Math.round(GO + START_LEAD_MS + bigT[i].t1 * MS + 80)) }).cut.why, 'behind');
  // BEHIND: slow motion — every chunk twice as late as its ticks, no silence: cut where it first falls 8 s behind
  const slow = structuredClone(P.node); for (const i of keys) slow.c[i].at = Math.round(GO + START_LEAD_MS + T[i].t1 * MS * 2 + 80);
  const vs = judgeNode({ seed, node: slow });
  assert.equal(vs.ok, true); assert.equal(vs.cut.why, 'behind');
  assert.ok(vs.cut.tick > 8 * TICK_HZ - 60 && vs.cut.tick < 12 * TICK_HZ, `cut near the 8th second of play (tick ${vs.cut.tick})`);
  assert.ok(vs.floor < live.floor, 'it counts only up to its last on-time event');
  // THE DROPPED SIGNAL: 30 s of silence, then the queued chunks land together and the run is back on the clock — honest, whole
  const mid = keys.find(i => T[i].t0 > 600), back = keys.find(i => T[i].t0 > 600 + 30 * TICK_HZ) ?? keys.length;
  if (back < keys.length) {
    const drop = structuredClone(P.node), at = P.node.c[back].at;
    for (let i = mid; i < back; i++) drop.c[i].at = at - (back - i);   // (the burst: milliseconds apart, in order)
    const vd = judgeNode({ seed, node: drop });
    assert.equal(vd.ok, true); assert.equal(vd.cut, undefined); assert.equal(vd.floor, live.floor);
  }
  // the chunks' clock runs backwards: refused · a chunk stamped before GO: refused
  const back2 = structuredClone(P.node); back2.c[3].at = back2.c[2].at - 5;
  assert.deepEqual(judgeNode({ seed, node: back2 }), { ok: false, why: "the chunks' clock" });
  const pre = structuredClone(P.node); pre.c[0].at = GO - 1;
  assert.deepEqual(judgeNode({ seed, node: pre }), { ok: false, why: "the chunks' clock" });
  // (the host's podium reads its own mirror: a chunk in flight carries an estimate — taken as never running backwards; the server stays strict)
  assert.equal(judgeNode({ seed, node: back2, mirror: true }).ok, true);
  assert.deepEqual(clockProblem(0, []), { why: 'go' }); assert.deepEqual(clockProblem(GO, null), { why: 'chunks' });
});

test('HOSTILE NODES — forged, out of order, truncated, too many: every one gets its refusal by name (or is judged as the shorter run it is); nothing throws', () => {
  const seed = 'hostile-1', log = botLog(seed, 'great', 'solo', 60), P = playLive({ seed, log }), live = resultOf(P.run), keys = Object.keys(P.node.c).map(Number);
  const bad = node => judgeNode({ seed, node });
  for (const node of [null, undefined, 5, 'x', {}, { go: 0 }, { go: -5, c: {} }, { go: 'now' }]) assert.deepEqual(bad(node), { ok: false, why: 'no go' });
  // a hole (a chunk missing), a chunk out of its place, a chunk that is not text, an empty one, one over the rules' length
  const hole = structuredClone(P.node); delete hole.c[2]; assert.deepEqual(bad(hole), { ok: false, why: 'chunks' });
  const swap = structuredClone(P.node); [swap.c[2].s, swap.c[3].s] = [swap.c[3].s, swap.c[2].s];
  assert.notDeepEqual((v => [v.ok, v.floor, v.tick])(bad(swap)), [true, live.floor, live.tick], 'two chunks swapped: another log — refused or another (shorter) run, never the honest one');
  for (const s of [5, null, '', 'x'.repeat(401), '12+3', '+', '+0', '.1+5', '+5.', '!', '-zzzz', '+5 ', '\u0000+5', '+5+', '..3+4']) {
    const n = structuredClone(P.node); n.c[1].s = s;
    assert.deepEqual(bad(n), { ok: false, why: 'chunks' }, `chunk ${JSON.stringify(s)}`);
  }
  assert.deepEqual(bad({ go: GO, c: 'oops' }), { ok: false, why: 'chunks' });
  assert.deepEqual(bad({ go: GO, c: { 0: { s: '+5' } } }), { ok: false, why: 'chunks' }, 'a chunk without its timestamp');
  assert.deepEqual(bad({ go: GO, c: { 1: { s: '+5', at: GO + 700 } } }), { ok: false, why: 'chunks' }, 'no chunk 0');
  // a chunk cut INSIDE an event (its digits split over two chunks): never a chunk
  const split = structuredClone(P.node); const s1 = split.c[1].s; split.c[1].s = s1.slice(0, -1); split.c[2].s = s1.slice(-1) + split.c[2].s;
  assert.deepEqual(bad(split), { ok: false, why: 'chunks' });
  // TRUNCATED: the first chunks alone are a valid, SHORTER run — the tower stands still after them (never the full floor)
  const cut = { go: GO, c: Object.fromEntries(keys.slice(0, 6).map(i => [i, P.node.c[i]])) };
  const vc = bad(cut);
  assert.equal(vc.ok, true); assert.ok(vc.floor < live.floor, `the first 6 chunks: floor ${vc.floor} of ${live.floor}`);
  // FORGED: MAX SPIN broken, a move that turns nothing, a move after the end — the judge's own names
  const at = GO + START_LEAD_MS + 500;
  assert.equal(bad({ go: GO, c: { 0: { s: '+4r+4r', at } } }).ok, true);   // (+171 is the most a tick takes: 4r = 171 — tick after tick is fine; one over is not)
  assert.deepEqual(bad({ go: GO, c: { 0: { s: '+4s', at } } }), { ok: false, why: 'spin' });
  const after = { go: GO, c: { 0: { s: `.${(live.end + 30).toString(36)}+5`, at: Math.round(GO + START_LEAD_MS + (live.end + 30) * MS) } } };
  assert.equal(bad(after).ok, false); assert.equal(bad(after).why, 'past the end');
  // TOO MANY CHUNKS for its own clock (2,000 one-move chunks in the first second): refused before a character is unpacked
  const many = { go: GO, c: {} }; for (let i = 0; i < 2000; i++) many.c[i] = { s: '+1', at: GO + 900 };
  assert.deepEqual(bad(many), { ok: false, why: 'too many chunks' });
  assert.ok(CHUNKS_PER_SEC >= Math.ceil(1000 / CLOCK.flushMs), 'the ceiling covers the writer\'s own pace');
  // … and the same text as ONE string longer than any log packs to: refused unread
  assert.deepEqual(bad({ go: GO, c: Object.fromEntries(Array.from({ length: 9000 }, (_, i) => [i, { s: '+1'.repeat(200), at: GO + 600 + i * 1000 }])) }).ok, false);
  // nothing above threw; a prototype's keys are no node
  assert.deepEqual(bad(Object.create({ go: GO })).ok, true, 'an inherited GO is read as a number all the same — and judged as an empty log');
});
