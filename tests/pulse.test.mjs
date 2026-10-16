// PULSE: judging windows, scoring/combo, strays, chords, rejoin, Echo, director flow, beat maps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  WINDOWS, POINTS, STRAY_PENALTY, multiplier, judgmentFor, createJudge, tap, expire, resume, accuracy,
  echoPattern, echoTimeline, scoreEcho, pickSongs, standings, matchStats, ECHO_ROUNDS,
} from '../js/games/pulse/logic.js';
import { createGame, nextStep, echoPlan, LOAD_MAX_MS, START_LEAD_MS, SONG_GRACE_MS, STANDINGS_MS } from '../js/games/pulse/director.js';

test('judgment windows: PERFECT ±45 ms, GREAT ±90 ms, GOOD ±135 ms', () => {
  assert.equal(judgmentFor(0), 'perfect');
  assert.equal(judgmentFor(0.045), 'perfect');
  assert.equal(judgmentFor(-0.046), 'great');
  assert.equal(judgmentFor(0.09), 'great');
  assert.equal(judgmentFor(0.1), 'good');
  assert.equal(judgmentFor(-0.135), 'good');
  assert.equal(judgmentFor(0.136), null);
  assert.deepEqual(WINDOWS, { perfect: 0.045, great: 0.09, good: 0.135 });
});

test('combo multiplier ×1 → ×4, and a miss breaks it', () => {
  assert.equal(multiplier(0), 1);
  assert.equal(multiplier(9), 1);
  assert.equal(multiplier(10), 2);
  assert.equal(multiplier(30), 4);
  assert.equal(multiplier(500), 4);
  const notes = Array.from({ length: 25 }, (_, i) => [1 + i * 0.5, i % 3]);
  const J = createJudge(notes);
  for (let i = 0; i < 20; i++) tap(J, notes[i][1], notes[i][0]);
  assert.equal(J.st.c, 20);
  assert.equal(J.st.s, 10 * POINTS.perfect + 10 * POINTS.perfect * 2);
  expire(J, notes[20][0] + 0.2); // note 20 sails past
  assert.equal(J.st.c, 0);
  assert.equal(J.st.m, 1);
  assert.equal(J.st.mc, 20);
});

test('taps: early/late within windows, forgiving near-misses, strays cost a little', () => {
  const J = createJudge([[2, 0], [2.5, 1], [3, 2]]);
  assert.equal(tap(J, 0, 2.06).kind, 'great');
  assert.equal(tap(J, 1, 2.5 - 0.12).kind, 'good');
  const early = tap(J, 2, 3 - 0.2);
  assert.equal(early.kind, 'early', 'a touch too early is forgiven, not penalized');
  assert.equal(J.done[2], 0, 'and the note is still there');
  assert.equal(tap(J, 2, 3.01).kind, 'perfect');
  const before = J.st.s;
  assert.equal(tap(J, 0, 9).kind, 'stray');
  assert.equal(J.st.s, before - STRAY_PENALTY);
  assert.equal(J.st.c, 3, 'a stray does not break the combo');
});

test('a tap takes the closest open note of its lane, never one from another lane', () => {
  const J = createJudge([[1, 0], [1.2, 0], [1.2, 2]]);
  const r = tap(J, 0, 1.17);
  assert.equal(r.i, 1, 'closest note in the lane');
  assert.equal(tap(J, 1, 1.2).kind, 'stray', 'no note in lane 1');
  assert.equal(tap(J, 0, 1.02).kind, 'perfect', 'the earlier one is still open');
});

test('chords: two lanes at once are judged independently (multi-touch)', () => {
  const J = createJudge([[4, 0], [4, 2]]);
  assert.equal(tap(J, 0, 4.01).kind, 'perfect');
  assert.equal(tap(J, 2, 3.99).kind, 'perfect');
  assert.equal(J.st.c, 2);
  assert.equal(accuracy(J.st), 1);
});

test('rejoin mid-song: published stats come back, unaccounted earlier notes are misses', () => {
  const notes = Array.from({ length: 40 }, (_, i) => [2 + i * 0.25, i % 3]);
  const J = createJudge(notes);
  // published before the phone locked: 10 notes judged
  const saved = { s: 1500, c: 10, mc: 10, p: 10, g: 0, o: 0, m: 0, n: 10 };
  resume(J, 2 + 20 * 0.25 - 0.001, saved); // back at note 20
  assert.equal(J.st.n, 20);
  assert.equal(J.st.m, 10, 'the 10 notes missed while away');
  assert.equal(J.st.c, 0);
  assert.equal(J.st.s, 1500);
  assert.equal(tap(J, notes[20][1], notes[20][0]).kind, 'perfect', 'play continues from here');
  assert.deepEqual(expire(J, notes[20][0] + 0.01), [], 'nothing double-counted');
});

test('Echo: patterns grow each round, are deterministic, and scoring rewards timing + lanes', () => {
  const p = [0, 1, 2].map(r => echoPattern('seed', 0, r));
  assert.deepEqual(p.map(x => x.notes.length), [4, 6, 8]);
  assert.deepEqual(echoPattern('seed', 0, 1), p[1]);
  assert.notDeepEqual(echoPattern('other', 0, 1), p[1]);
  for (const x of p) {
    assert.equal(x.notes[0].beat, 0);
    for (let i = 1; i < x.notes.length; i++) assert.ok(x.notes[i].beat > x.notes[i - 1].beat);
  }
  const bpm = 120;
  const exact = p[1].notes.map(n => ({ t: n.beat * 0.5, lane: n.lane }));
  assert.equal(scoreEcho(p[1], bpm, exact).pts, 600);
  const sloppy = exact.map(x => ({ ...x, t: x.t + 0.1 }));
  assert.equal(scoreEcho(p[1], bpm, sloppy).pts, 300, 'late but inside ±150 ms = half');
  const wrongLane = exact.map(x => ({ ...x, lane: (x.lane + 1) % 3 }));
  assert.equal(scoreEcho(p[1], bpm, wrongLane).hits, 0);
  assert.equal(scoreEcho(p[1], bpm, [...exact, { t: 3, lane: 0 }, { t: 3.2, lane: 1 }]).pts, 580, 'spam costs');
  const tl = echoTimeline(bpm, p);
  assert.equal(tl.rounds.length, ECHO_ROUNDS);
  assert.ok(tl.rounds.every(r => r.cardAt < r.patternAt && r.patternAt < r.repeatAt && r.repeatAt < r.closeAt && r.closeAt < r.endAt));
  assert.equal(tl.rounds[1].cardAt, tl.rounds[0].endAt);
});

test('song choice: host pick first, then distinct random songs', () => {
  const m = ['pulse1', 'pulse2', 'pulse3'].map(id => ({ id }));
  assert.deepEqual(pickSongs('s', m, 'pulse2', 1), ['pulse2']);
  const two = pickSongs('s', m, 'pulse2', 2);
  assert.equal(two[0], 'pulse2');
  assert.notEqual(two[1], 'pulse2');
  const r = pickSongs('s', m, 'random', 2);
  assert.equal(new Set(r).size, 2);
  assert.deepEqual(pickSongs('s', m, 'random', 2), r, 'deterministic from the seed');
});

test('director: load waits for every online phone (or times out), then a synced start 5 s ahead', () => {
  const songs = [{ id: 'a', bpm: 120, duration: 60 }, { id: 'b', bpm: 100, duration: 30 }];
  const parts = { x: true, y: true, z: true };
  const online = { x: true, y: true, z: false };
  const g = createGame({ matchId: 'm', settings: { echo: 'on' }, participants: parts, now: 0, seed: 's', songs });
  const apply = (game, patch) => {
    for (const [k, v] of Object.entries(patch)) {
      const parts2 = k.split('/'); let o = game;
      for (const p of parts2.slice(0, -1)) o = (o[p] ??= {});
      o[parts2.at(-1)] = v;
    }
    return game;
  };
  assert.equal(nextStep(g, { now: 1000, boards: { x: { k: 0, ready: true } }, online }), null, 'y not ready');
  const s1 = nextStep(g, { now: 2000, boards: { x: { k: 0, ready: true }, y: { k: 0, ready: true } }, online });
  assert.equal(s1.phase, 'song', 'offline z is not waited for');
  assert.equal(s1.songStartAt, 2000 + START_LEAD_MS);
  apply(g, s1);
  // a slow phone never reports ready: the load phase still ends
  const g2 = createGame({ matchId: 'm2', settings: {}, participants: parts, now: 0, seed: 's', songs });
  assert.equal(nextStep(g2, { now: LOAD_MAX_MS, boards: {}, online }).phase, 'song');
  // song end → results snapshot → echo
  const endAt = g.songStartAt + 60_000 + SONG_GRACE_MS;
  assert.equal(nextStep(g, { now: endAt - 1, boards: {}, online }), null);
  const boards = { x: { k: 0, s: 900, c: 3, mc: 9, p: 8, g: 1, o: 0, m: 1, n: 10 }, y: { k: 1, s: 5 } };
  const s2 = nextStep(g, { now: endAt, boards, online });
  assert.equal(s2.phase, 'echo');
  assert.equal(s2['results/0'].x.s, 900);
  assert.equal(s2['results/0'].y.s, 0, 'stale board from another song is ignored');
  assert.equal(s2.phaseEndsAt, s2.echoStartAt + echoPlan(g).total);
  apply(g, s2);
  const s3 = nextStep(g, { now: g.phaseEndsAt, boards: { x: { k: 0, e: 420 } }, online });
  assert.equal(s3['results/0/x/e'], 420);
  assert.equal(s3.phase, 'standings');
  apply(g, s3);
  const s4 = nextStep(g, { now: g.phaseStartAt + STANDINGS_MS, boards: {}, online });
  assert.equal(s4.phase, 'load');
  assert.equal(s4.si, 1);
  apply(g, s4);
  assert.deepEqual(standings(g).map(r => [r.uid, r.score]), [['x', 1320], ['y', 0], ['z', 0]]);
  assert.equal(Math.round(matchStats(g).x.acc * 100), Math.round(((8 + 0.7) / 10) * 100));
});

test('director replay is harmless: the same transition from a stale copy writes the same results', () => {
  const songs = [{ id: 'a', bpm: 120, duration: 10 }];
  const g = createGame({ matchId: 'm', settings: { echo: 'off' }, participants: { x: true }, now: 0, seed: 's', songs });
  g.phase = 'song'; g.songStartAt = 5000; g.phaseEndsAt = 5000 + 10_000 + SONG_GRACE_MS;
  const boards = { x: { k: 0, s: 700, n: 7, p: 7 } };
  const a = nextStep(g, { now: g.phaseEndsAt, boards, online: { x: true } });
  const b = nextStep(structuredClone(g), { now: g.phaseEndsAt + 900, boards, online: { x: true } });
  assert.deepEqual(a['results/0'], b['results/0']);
  assert.equal(a.phase, 'final', 'Echo off and one song → straight to the podium');
});

test('beat maps: every song has notes on the grid, three difficulties, sane density, playable lanes', () => {
  const manifest = JSON.parse(readFileSync('data/pulse/manifest.json', 'utf8'));
  assert.ok(manifest.songs.length >= 5);
  for (const s of manifest.songs) {
    const m = JSON.parse(readFileSync(s.map, 'utf8'));
    assert.ok(m.bpm >= 80 && m.bpm <= 180, `${s.id} bpm`);
    assert.ok(m.duration > 90 && m.duration <= 200, `${s.id} length`);
    const period = (m.beats.at(-1) - m.beats[0]) / (m.beats.length - 1); // exact (the bpm field is rounded)
    const eighth = period / 2;
    assert.equal(m.energy.length, m.beats.length);
    let prevCount = 0;
    for (const d of ['easy', 'normal', 'hard']) {
      const notes = m.notes[d];
      assert.ok(notes.length > prevCount, `${s.id} ${d} denser than the level below`);
      prevCount = notes.length;
      const last = [-9, -9, -9];
      for (let i = 0; i < notes.length; i++) {
        const [t, lane] = notes[i];
        assert.ok(lane >= 0 && lane <= 2);
        assert.ok(t >= 1.9 && t <= m.duration, `${s.id} ${d} note inside the song`);
        if (i) assert.ok(t >= notes[i - 1][0], 'sorted');
        // on the beat grid (quarter / eighth)
        const k = (t - m.beats[0]) / eighth;
        assert.ok(Math.abs(k - Math.round(k)) * eighth < 0.004, `${s.id} ${d} note at ${t} off the grid`);
        assert.ok(t - last[lane] >= eighth - 0.004, `${s.id} ${d} same-lane repeat too fast at ${t}`);
        last[lane] = t;
      }
      if (d !== 'hard') assert.equal(new Set(notes.map(n => n[0])).size, notes.length, 'chords only on hard');
    }
  }
});
