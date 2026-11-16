// JAYWALK H4B — THE COURSE IS THE SAME FOR EVERYONE (docs/jaywalk.md "THE FIRST GO's PROOF"). A model of the START with a slow phone in
// the room: every phone writes its GO in the count's last 2 s, the server stamps each on arrival, every phone's mirror gets the server's
// events in the server's order after its own delay; the host's director (the REAL pure nextStep) writes the GO patch; every phone reads its
// course + tick 0 through the REAL logic.js#startOf.
//   · H4B: with one phone's GO + listener delayed 0.3–2 s (and 3 s), as the host or a guest, its clock right or behind by its own delay,
//     the GOs arriving in either order — EVERY phone, the host's patch and the server derive the SAME seed + tick 0; no phone ever plays a
//     tick on another course; no phone ever switches course.
//   · THE CAUSE IT RULES OUT (H4's way, kept here as the model's `old` switch): a `set` shows the writer its own ESTIMATE of the server's
//     time at once — a slow phone played from its own GO until an EARLIER one reached it, and a slow host wrote its own estimate's course
//     into the game. The same model with that switch on DOES mismatch — the test has teeth.
import test from 'node:test';
import assert from 'node:assert/strict';
import { matchStart, startOf, firstGo, seedOf, GO_LEAD_MS, COUNT_MS } from '../js/games/jaywalk/logic.js';
import { createGame, nextStep } from '../js/games/jaywalk/director.js';

const CODE = 'ROOM', M = 'm1', T0 = 1_800_000_000_000, GO_EARLY_MS = 1800, WINDOW_MS = 2000, STEP = 5;

/**
 * phones: [{ up, down (ms — its line's delay each way), skew (ms — its serverNow() minus the true server time) }], host = an index.
 * `old` = H4's way: a phone's own GO shows in its own mirror AT ONCE, as its estimate; in `play` a phone takes the game's seed.
 * → { truth, game, phones: [{ adopts: [{ seed, playAt, at }], played: Set(seeds it ran a tick ≥ 0 on), final }] }
 */
function simulate(phones, host, { old = false, until = 16000 } = {}) {
  const ids = phones.map((_, i) => `u${i}`), participants = Object.fromEntries(ids.map(u => [u, true]));
  const server = { game: createGame({ matchId: M, settings: {}, participants, now: T0, seed: 'x' }), nodes: {} };
  const P = phones.map((p, i) => ({ ...p, uid: ids[i], game: { ...server.game }, runs: {}, asked: false, haveGo: false, tries: 0, retryAt: 0, adopted: null, adopts: [], played: new Set(), lastStep: -1e9 }));
  const events = [];                                           // { at, fn } — run in time order, ties in the order they were made
  let seq = 0;
  const later = (at, fn) => events.push({ at, n: seq++, fn });
  /** a server change reaches every phone's mirror after that phone's own delay — in the server's order */
  const push = (t, apply) => P.forEach(p => later(t + p.down, () => apply(p)));
  for (let t = T0; t <= T0 + until; t += STEP) {
    events.sort((a, b) => a.at - b.at || a.n - b.n);
    while (events.length && events[0].at <= t) events.shift().fn(t);
    for (const p of P) {
      const est = t + p.skew, g = p.game;
      // its own GO, in the count's last 2 s (view.js#askGoMatch)
      if (!p.asked && !p.haveGo && est >= p.retryAt && (g.phase === 'play' || (g.phase === 'count' && est >= g.playAt - GO_EARLY_MS))) {
        p.asked = true;
        if (old) p.runs = { ...p.runs, [p.uid]: { go: est } };   // (H4: the local echo — the phone's ESTIMATE, in its own mirror at once)
        later(t + p.up, at => {
          const sg = server.game, open = sg.phase === 'play' || (sg.phase === 'count' && at >= sg.playAt - WINDOW_MS);
          if (open && !server.nodes[p.uid]) {
            server.nodes[p.uid] = { go: at };
            push(at, q => { q.runs = { ...q.runs, [p.uid]: { go: at } }; if (q === p) q.haveGo = true; });
          } else later(at + p.down, () => {                      // (refused — a touch early: looked at, tried again)
            if (old) { const r = { ...p.runs }; delete r[p.uid]; p.runs = r; }
            if (p.tries++ < 7) { p.asked = false; p.retryAt = t + p.skew + 420; }
          });
        });
      }
      // its course + tick 0
      const S = old ? (g.phase !== 'count' ? (g.seed ? { seed: g.seed, playAt: g.playAt } : null) : matchStart(CODE, M, p.runs)) : startOf(g, p.runs, CODE);
      if (S && (!p.adopted || p.adopted.seed !== S.seed || p.adopted.playAt !== S.playAt)) { p.adopted = { seed: S.seed, playAt: S.playAt }; p.adopts.push({ ...p.adopted, at: est - S.playAt }); }
      if (p.adopted && est >= p.adopted.playAt) p.played.add(p.adopted.seed);
      // the host's director, every 250 ms
      if (p === P[host] && t - p.lastStep >= 250) {
        p.lastStep = t;
        const patch = nextStep(g, { now: est, live: { runs: p.runs }, code: CODE, online: participants });
        if (patch && patch.phase === 'play') later(t + p.up, at => {
          if (server.game.phase !== 'count') return;
          server.game = { ...server.game, ...patch };
          const sg = server.game;
          push(at, q => { q.game = { ...sg }; });
        });
      }
    }
  }
  return { truth: matchStart(CODE, M, server.nodes), game: server.game, nodes: server.nodes, phones: P.map(p => ({ adopts: p.adopts, played: p.played, final: p.adopted, haveGo: p.haveGo })) };
}
const FAST = { up: 40, down: 40, skew: 0 };
/** every room the prompt asks for: ONE slow phone (0.3 … 2 s, + 3 s), as the host or a guest, its clock right / behind by its delay /
 *  ahead — the GOs landing in either order */
function rooms() {
  const out = [];
  for (const lag of [300, 600, 1000, 1500, 2000, 3000]) for (const hostSlow of [true, false]) for (const skew of [0, -lag, -lag / 2, 150]) {
    for (const dir of ['both', 'up', 'down']) {
      const slow = { up: dir === 'down' ? 40 : lag, down: dir === 'up' ? 40 : lag, skew };
      out.push({ name: `${hostSlow ? 'the HOST' : 'a guest'} ${lag} ms slow (${dir}), its clock ${skew >= 0 ? '+' : ''}${skew} ms`, phones: hostSlow ? [slow, FAST, { ...FAST, up: 70, down: 55 }] : [FAST, slow, { ...FAST, up: 70, down: 55 }], host: 0, slow: hostSlow ? 0 : 1 });
    }
  }
  // two slow phones, and a room where the SLOW phone's GO is the first to land (its clock ahead: it writes early)
  out.push({ name: 'two slow phones', phones: [{ up: 900, down: 1400, skew: -700 }, { up: 1800, down: 600, skew: 0 }, FAST], host: 0, slow: 0 });
  out.push({ name: 'the slow phone writes first (its clock 190 ms ahead)', phones: [FAST, { up: 250, down: 1900, skew: 190 }, { ...FAST, skew: -160 }], host: 0, slow: 1 });
  out.push({ name: 'everyone fast', phones: [FAST, FAST, FAST], host: 0, slow: 0 });
  return out;
}

test('H4B — THE SAME COURSE FOR EVERYONE: one phone\'s GO + listener delayed 0.3–3 s (host or guest, the GOs in either order) — every phone, the host\'s patch and the server derive the SAME seed + tick 0; nobody plays a tick on another course, nobody switches', () => {
  let n = 0, slowFirst = 0, slowLast = 0, lateStart = 0;
  for (const R of rooms()) {
    const S = simulate(R.phones, R.host);
    assert.ok(S.truth && Object.keys(S.nodes).length === R.phones.length, `${R.name}: every phone's GO landed`);
    assert.equal(S.truth.seed, seedOf(CODE, M, firstGo(S.nodes))); assert.equal(S.truth.playAt, S.truth.g0 + GO_LEAD_MS);
    assert.deepEqual([S.game.phase, S.game.seed, S.game.playAt, S.game.g0], ['play', S.truth.seed, S.truth.playAt, S.truth.g0], `${R.name}: the host's GO patch = THE FIRST GO's course + clock (what the server derives)`);
    S.phones.forEach((p, i) => {
      assert.deepEqual(p.final, { seed: S.truth.seed, playAt: S.truth.playAt }, `${R.name}: phone ${i} is on the server's course + tick 0`);
      assert.deepEqual([...p.played], [S.truth.seed], `${R.name}: phone ${i} never played a tick on another course`);
      assert.equal(p.adopts.length, 1, `${R.name}: phone ${i} took its course ONCE — never a switch`);
      assert.ok(p.haveGo);
    });
    const slowGo = S.nodes[`u${R.slow}`].go;
    if (slowGo === S.truth.g0) slowFirst++; else slowLast++;
    if (S.phones[R.slow].adopts[0].at > 0) lateStart++;
    n++;
  }
  assert.ok(n > 140 && slowFirst > 0 && slowLast > 100, `${n} rooms — the slow phone's GO was THE FIRST in ${slowFirst}, a later one in ${slowLast} (either order)`);
  assert.ok(lateStart > 0, `a very slow phone learns the course after tick 0 (${lateStart} rooms) — it starts late on the RIGHT course, never early on a wrong one`);
});

test('THE CAUSE IT RULES OUT (H4\'s way — the GO echoed locally as the phone\'s own estimate): the same rooms DO mismatch — a slow phone plays on its own estimate\'s course, a slow host writes it into the game', () => {
  let played = 0, switched = 0, patch = 0, n = 0;
  for (const R of rooms()) {
    const S = simulate(R.phones, R.host, { old: true });
    if (S.game.seed !== S.truth.seed) patch++;
    for (const p of S.phones) { if ([...p.played].some(s => s !== S.truth.seed)) played++; if (p.adopts.length > 1) switched++; }
    n++;
  }
  assert.ok(switched > n, `the old way: a phone took a course and then SWITCHED ${switched} times in ${n} rooms (its estimate, then the server's value)`);
  assert.ok(played > 10, `… ${played} phones played ticks on a course the server never picked`);
  assert.ok(patch > 5, `… and in ${patch} rooms the host's GO patch carried a course that is not THE FIRST GO's`);
});

test('startOf — THE NODES ARE THE TRUTH: the first GO among the nodes wins in the count AND in play; the game\'s own only with no node to read (an UNPROVEN match, the mirror not there yet); the final patch scores on it', () => {
  const runs = { a: { go: T0 + 1500 }, b: { go: T0 + 1320 } }, S = matchStart(CODE, M, runs);
  const count = createGame({ matchId: M, settings: {}, participants: { a: true, b: true }, now: T0, seed: 'x' });
  assert.equal(count.playAt, T0 + COUNT_MS);
  assert.equal(startOf(count, {}, CODE), null, 'the count, no GO yet: nothing — the count holds');
  assert.equal(startOf(count, null, CODE), null);
  assert.deepEqual(startOf(count, runs, CODE), S, 'the count: THE FIRST GO');
  const play = { ...count, phase: 'play', seed: S.seed, playAt: S.playAt, g0: S.g0 };
  assert.deepEqual(startOf(play, runs, CODE), S); assert.deepEqual(startOf(play, null, CODE), S, 'the mirror not there yet: the game\'s own (the same)');
  // a game that says otherwise (a host that picked from a later GO): the nodes win — as on the server
  const wrong = { ...play, seed: seedOf(CODE, M, T0 + 1500), playAt: T0 + 1500 + GO_LEAD_MS, g0: T0 + 1500 };
  assert.deepEqual(startOf(wrong, runs, CODE), S, 'the nodes win over the game');
  // an UNPROVEN match: its stand-in course, whatever nodes there are
  const un = { ...count, phase: 'play', seed: 'stand-in', playAt: T0 + 7000, unproven: 1 };
  assert.deepEqual(startOf(un, runs, CODE), { g0: 0, playAt: T0 + 7000, seed: 'stand-in' });
  assert.equal(startOf({ ...count, mode: 'solo', phase: 'play', seed: '' }, runs, CODE), null, 'never a solo run\'s (its own GO picks its course)');
  // the final patch: scored on THE FIRST GO's course + clock, and the game is put right
  const ended = { a: { go: T0 + 1500, e: { l: 0, t: 0 } }, b: { go: T0 + 1320, e: { l: 0, t: 0 } } };
  const fin = nextStep(wrong, { now: T0 + 60000, live: { runs: ended }, code: CODE });
  assert.deepEqual([fin.phase, fin.seed, fin.playAt, fin.g0], ['final', S.seed, S.playAt, S.g0]);
  const fin2 = nextStep(play, { now: T0 + 60000, live: { runs: ended }, code: CODE });
  assert.ok(fin2.phase === 'final' && !('seed' in fin2), 'a game that agrees with its nodes: nothing to put right');
});
