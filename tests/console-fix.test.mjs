// THE CONSOLE FIX (Nov 20 — docs/match-kit.md "A LIVE PROVEN RUN IS NEVER TAKEN AWAY BY THE HOST"; the pass log docs/games/passes/
// console-fix.md): the pure rule (core/proof.js#liveGoers + each game's liveOf) is EXACTLY the honest host's own "has it ended?" rule — so an
// honest match never waits for it — plus the cap; the writer's `owes`; the podium's wait (kit/run-hold.js); and the wiring pinned in the
// router, the room, the two screens, the server and the queue.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { liveGoers, lastSeenAt, liveRetryMs, LIVE_RETRY_MIN_MS, LIVE_RETRY_MAX_MS, GO_WINDOW_MS } from '../js/core/proof.js';
import * as JD from '../js/games/jaywalk/director.js';
import * as JL from '../js/games/jaywalk/logic.js';
import * as HM from '../js/games/highrise/match.js';
import * as HL from '../js/games/highrise/logic.js';
import { createProofWriter } from '../js/games/kit/proof-writer.js';
import { createLiveWait, createRouterPing, END_OWED_MS } from '../js/games/kit/run-hold.js';
import { VERIFIED_SOLO } from '../js/core/proof.js';   // (THE FIX PASS — M6)
import { PROOF } from '../js/games/contract.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const T = 1_790_000_000_000;

test('liveGoers: no `e` + moved within the idle-out (+ the drop wait offline) + before the cap; a late GO, the stamp, an ended node are never live', () => {
  const o = { now: T + 30_000, playAt: T + 2000, capAt: T + 362_000, idleMs: 18_000, dropMs: 75_000, graceMs: 4000 };
  const tree = { t0: T, a: { go: T, e: { l: 3 } }, b: { go: T + 40, c: { 0: { s: 'x', at: T + 20_000 } } }, c: { go: T + 90, c: { 0: { at: T + 5000 } } }, late: { go: T + GO_WINDOW_MS + 1, c: { 0: { at: T + 29_000 } } } };
  assert.deepEqual(liveGoers(tree, o).uids, ['b'], 'a ended · b live (moved 10 s ago) · c idled out (25 s) · late = no run');
  assert.equal(liveGoers(tree, o).until, T + 38_000, 'until = when the soonest would idle out with no new chunk');
  assert.deepEqual(liveGoers(tree, { ...o, online: { b: true, c: false } }).uids.sort(), ['b', 'c'], 'offline: THE DROPPED SIGNAL gets its 75 s');
  assert.deepEqual(liveGoers(tree, { ...o, now: T + 366_000, online: { b: true, c: false } }).uids, [], 'the cap + its grace end every wait');
  assert.deepEqual(liveGoers({}, o).uids, [], 'no GO, nothing live'); assert.deepEqual(liveGoers(null, o).uids, []);
  assert.equal(lastSeenAt({ go: T, c: { 0: { at: T + 5 }, 7: { at: T + 9 }, 3: { at: T + 99 } } }, T - 1), T + 9, 'the NEWEST chunk (the highest index) — the host\'s lastSeen');
  assert.equal(liveRetryMs(T + 100, T), LIVE_RETRY_MIN_MS); assert.equal(liveRetryMs(T + 900_000, T), LIVE_RETRY_MAX_MS); assert.equal(liveRetryMs(T + 9000, T), 9500);
});

// THE PROPERTY: for every node, "live" (liveOf) === "not ended" by the honest host's own rule (endedFor) before the cap — 4,000 random
// moments of random matches in each game. So an honest host's `final` (every node endedFor) never meets a live run.
for (const [name, D, L, M] of [['JAYWALK', JD, JL, JD], ['HIGH RISE', null, HL, HM]]) {
  test(`${name}: liveOf = the host's own endedFor (4,000 random moments) — an honest final never waits; past the cap nothing is live`, () => {
    let r = 7;
    const rnd = () => ((r = (r * 1103515245 + 12345) % 2147483648) / 2147483648);
    const endedFor = M.endedFor, cap = M === JD ? (g => JL.capAt({ mode: 'match', playAt: g.playAt })) : (g => HM.capAt(g));
    let live = 0, ended = 0;
    for (let k = 0; k < 4000; k++) {
      const g0 = T + Math.floor(rnd() * 1e6), n = 2 + Math.floor(rnd() * 4), tree = { t0: g0 }, online = {};
      for (let i = 0; i < n; i++) {
        const u = `p${i}`, c = {};
        const chunks = Math.floor(rnd() * 5);
        for (let j = 0; j < chunks; j++) c[j] = { s: 'x', at: g0 + 2000 + Math.floor(rnd() * 400_000) };
        tree[u] = { go: g0 + (i ? Math.floor(rnd() * 4000) : 0), ...(chunks ? { c } : {}), ...(rnd() < 0.3 ? { e: { l: 1 } } : {}) };
        online[u] = rnd() < 0.7;
      }
      const S = L.matchStart('ABCD', 'm1', tree), game = { mode: 'match', playAt: S.playAt, participants: Object.fromEntries(Object.keys(tree).filter(u => u !== 't0').map(u => [u, true])) };
      const now = g0 + Math.floor(rnd() * 480_000);
      const got = new Set(M.liveOf({ code: 'ABCD', matchId: 'm1', tree, now, online }).uids);
      for (const u of Object.keys(game.participants)) {
        const want = now < cap(game) + (M === JD ? JL.END_GRACE_MS : HM.END_GRACE_MS) && !endedFor(game, tree[u], now, online[u]);
        assert.equal(got.has(u), want, `${u} at +${now - g0} ms`);
        if (want) live++; else ended++;
      }
    }
    assert.ok(live > 500 && ended > 500, `both sides seen (${live} live · ${ended} ended)`);
    void D;
  });
}

test('THE WRITER: `owes` while the end is asked for and not acknowledged — never once it landed, never on a dead / closed writer', async () => {
  let endRes = null;
  const io = { now: () => 0, timer: () => {}, chunk: () => Promise.resolve(), end: () => new Promise(r => { endRes = r; }), read: () => Promise.resolve({}) };
  const W = createProofWriter({ count: () => 0, pack: () => '', entriesOf: () => 0, chunkMax: 400, chunks: 100, flushMs: () => 0, io });
  assert.equal(W.owes(), false, 'no end asked');
  W.end({ l: 1 });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(W.owes(), true, 'asked, in the air');
  endRes(); await new Promise(r => setTimeout(r, 0));
  assert.equal(W.owes(), false, 'acknowledged');
  const W2 = createProofWriter({ count: () => 0, pack: () => '', entriesOf: () => 0, chunkMax: 400, chunks: 100, flushMs: () => 0, io: { ...io, end: () => new Promise(() => {}) } });
  W2.end({ l: 1 }); W2.close();
  assert.equal(W2.owes(), false, 'a closed writer owes nothing (the view is gone)');
  assert.ok(END_OWED_MS >= 4000 && END_OWED_MS <= 15_000, 'a dead line holds the phone a few seconds at most');
});

test('THE PODIUM\'s WAIT (kit/run-hold.js): the live rivals (never this phone itself), read at most twice a second, `waited` once held; the router ping only while held', () => {
  let calls = 0, live = ['me', 'b'];
  const W = createLiveWait(() => { calls++; return { uids: live, until: 0 }; });
  const args = { code: 'ABCD', matchId: 'm1', runs: { me: {}, b: {} }, presence: { b: { online: true } }, now: T, skip: 'me' };
  assert.deepEqual(W.wait(args), ['b']); assert.equal(W.waited(), true);
  live = [];
  assert.deepEqual(W.wait(args), ['b'], 'the last answer within LIVE_CHECK_MS'); assert.equal(calls, 1);
  W.reset(); assert.deepEqual(W.wait(args), []); assert.equal(W.waited(), false);
  assert.deepEqual(W.wait({ ...args, runs: null }), [], 'no mirror yet: nothing to wait for');
  let checks = 0;
  globalThis.__nsRunHold = { on: false, wait: false, check: () => checks++ };
  const ping = createRouterPing();
  ping(); assert.equal(checks, 0, 'not held: never');
  globalThis.__nsRunHold.on = true; ping(); ping(); assert.equal(checks, 1, 'held: once, then at most twice a second');
  delete globalThis.__nsRunHold;
});

test('THE WIRING (pinned): the router holds a game screen that holds a run — never against this phone\'s own way out; a kick waits; both screens answer holdsRun; the server holds both paths; the queue never runs out', () => {
  const app = read('js/app.js'), room = read('js/room.js'), rep = read('api/report.js'), q = read('js/profile/queue.js'), host = read('js/host.js');
  assert.match(app, /globalThis\.__nsRunHold = RUN_HOLD;/);
  assert.match(app, /if \(!st\.code \|\| movedByMe\(\)\) return false;/, 'a LEAVE (no room) + this phone\'s own move are never held');
  assert.match(app, /st\.quit !== heldQuit/, 'a QUIT while held is the player\'s own way out');
  assert.match(app, /renderConnection\(st0\);/, 'SIGNAL LOST reads the real state');
  for (const f of ['startGame', 'playSolo', 'rematch', 'backToLobby']) assert.match(host, new RegExp(`export (async )?function ${f}\\([^)]*\\) \\{[^\\n]*\\n(  [^\\n]*\\n){0,3}  markMove\\(\\);`), `${f} marks this phone's own move`);
  assert.match(room, /const HELD_HOWS = \['kick', 'lost', 'closed'\];/, 'a kick / a lost seat / a meta-only close waits for the run; a leave never');
  assert.match(room, /if \(!game && heldExit && heldExit\.code === code && heldExit\.opts\.how === 'closed'\) \{ runHoldDone\(\); return; \}/, 'a room really deleted lets the held exit go at once');
  assert.match(host, /if \(idleNow\(\)\) \{ idleClose\(\); return; \}/); assert.match(host, /const idleNow = \(\) => roomIdle\(state\.meta, serverNow\(\) - \(isHost\(\) \? 0 : 90_000\)\) && !\(globalThis\.__nsRunHold && globalThis\.__nsRunHold\.held\(\)\);/, 'the idle close never while a run is held (a host’s meta/activeAt in the past) — THE FIX PASS P3: asked again after the round trip');
  assert.match(app, /\(ownNode && ownNode\.go > 0\)/, 'a phone with its own GO in the tree reports the match, named or not');
  assert.match(rep, /for \(const u of proven\) if \(!names\.has\(u\)\) \{ await wreck\(key, uid, now, 'a dropped player'\)\.catch\(\(\) => \{\}\); throw new ApiError\(409, 'mismatch'/, 'DROP_GUARD: seated or not (THE BEFORE-LAUNCH PASS: + the sealed wreck)');
  // (THE FIX PASS — M6: EVERY proof game — core/proof.js#VERIFIED_SOLO — through the contract's PROOF block, never a literal list of two)
  // (FREEFALL F4A — THE HIDDEN CARTRIDGE: its view is THE SOLO RUN only — THE MATCH (the run hold, the live wait, the match GO) is F4B's: the ONE
  //  named wait; the day its view writes a match GO this check comes back for it)
  const MATCH_WAITS = {};   // (FREEFALL F4B: THE MATCH is built — its view answers every check below)
  for (const id of Object.keys(MATCH_WAITS)) assert.doesNotMatch(read(`js/games/${id}/${PROOF.VIEW_FILE}`), /writeMatchGo\(/, `${id}: its match is built — take it off MATCH_WAITS (${MATCH_WAITS[id]})`);
  for (const v of VERIFIED_SOLO.filter(id => !MATCH_WAITS[id]).map(id => `js/games/${id}/${PROOF.VIEW_FILE}`)) {
    const s = read(v);
    assert.match(s, /\n    holdsRun,\n    update\(state\)/, `${v}: the screen answers holdsRun`);
    assert.match(s, /createLiveWait\(liveOf\)/, `${v}: the podium waits for the live rivals`);
    assert.match(s, /RH\.on \|\| RH\.wait\) && !holdsRun\(\)\) pingRouter\(\)/, `${v}: the run over + written → follow the room`);
    assert.match(s, /createFinal\(\{ game: g,/, `${v}: the podium shows the game as scored here`);
    assert.match(s, /proven = !lateGo && \(\(haveGo && !g\.unproven && mine\(g\)\) \|\| everProven\);/, `${v}: once proven, the host's participants / unproven can not take it back`);
    assert.match(s, /writeMatchGo\(treePath\(\), uid, '\w+', runs\)/, `${v}: the GO skips the stamp when the mirror shows the tree begun`);
  }
  assert.equal((rep.match(/await holdLive\(\);/g) || []).length, 2, 'the server holds the in-room path AND the moved-on path');
  assert.match(rep, /throw new ApiError\(425, 'still_live'/);
  assert.match(q, /r\.code === 'still_live'\) throw Object\.assign\(new Error\(r\.code\), \{ status: 425, after: Math\.min\(60_000, r\.retryAfter\), live: true \}\)/);
  assert.match(q, /if \(!e\.live\) x\.w = \(x\.w \|\| 0\) \+ 1;/, 'a still_live answer never uses up the tries (the server\'s cap ends the wait)');
});

test('THE TREE CAP (Group 3): the rules\' counter = the phones\' TREE_CAP; the stamp only WITH the counter, the counter only WITH a new stamp; the GO behind the stamp', () => {
  const rules = JSON.parse(read('database.rules.json')).rules.rooms.$code, io = read('js/games/kit/proof-io.js');
  const cap = Number((/export const TREE_CAP = (\d+);/.exec(io) || [])[1]);
  assert.equal(cap, 1000);
  assert.ok(rules.pt['.validate'].includes(`newData.child('n').val() <= ${cap} &&`), 'the rules cap = TREE_CAP');
  assert.match(rules.pt['.validate'], /=== \(data\.child\('n'\)\.isNumber\(\) \? data\.child\('n'\)\.val\(\) : 0\) \+ 1/, 'one step at a time');
  assert.match(rules.pt['.validate'], /child\('t0'\)\.val\(\) === now && !data\.parent\(\)/, '… only with a NEW stamp of a tree that did not exist');
  assert.equal(rules.pt['.write'], 'auth != null && newData.exists()', 'never deleted (the host can only close the whole room)');
  for (const n of ['jw', 'hr']) assert.ok(rules[n].$match.t0['.write'].includes("child('pt/m').val() === $match"), `${n}: the stamp needs the counter in the same write`);
  assert.match(io, /pt: \{ n: \(Number\(snap\.val\(\)\) \|\| 0\) \+ 1, m, g: node \}/, 'the phone writes the next count with its stamp');
  assert.match(io, /\.catch\(\(\) => plain\(\)\)/, 'refused (the rules before THE CONSOLE FIX, a race) → the plain stamp as before');
});
