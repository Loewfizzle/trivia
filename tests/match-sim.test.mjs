// Simulates whole CIPHER BREACH matches against an in-memory "database",
// including a host that vanishes mid-round and a player who refreshes mid-round.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame, nextStep } from '../js/games/cipher/director.js';
import { evaluateGuess, decodeWord, secretKey, standings, PHASE_MS, PLAY_GRACE_MS, asArray } from '../js/games/cipher/logic.js';
import { setLists, pickWord, isValidGuess } from '../js/games/cipher/words.js';
import { shouldClaimHost } from '../js/core/room-logic.js';
import { HOST_TIMEOUT_MS } from '../js/config.js';

for (const n of [5, 6, 7]) {
  setLists(n, JSON.parse(readFileSync(`data/words/answers-${n}.json`, 'utf8')), JSON.parse(readFileSync(`data/words/valid-${n}.json`, 'utf8')));
}

// Applies a patch with "a/b" path keys the way RTDB update() does.
function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}

function makeDb(code) {
  return { code, game: null, boards: {} };
}

function play(db, uid, guess, now) {
  const g = db.game;
  assert.equal(g.phase, 'play');
  const answer = decodeWord(g.secret, secretKey(db.code, g.matchId, g.round));
  const b = db.boards[g.round] ??= {};
  const mine = b[uid] ??= { g: [], p: [], solved: false, done: false };
  const p = evaluateGuess(guess, answer);
  mine.g.push(guess); mine.p.push(p);
  if (p === '2'.repeat(answer.length)) { mine.solved = true; mine.solvedAt = now; }
  mine.done = mine.solved || mine.p.length >= 6;
  return answer;
}

// One director tick for whoever is host.
function tick(db, now, online) {
  const step = nextStep(db.game, { code: db.code, now, boards: db.boards[db.game.round] || {}, online, pickWord });
  if (step && step.lobby) { db.game = null; return 'lobby'; }
  if (step) applyPatch(db.game, step);
  return step;
}

test('a full 5-round match runs to the podium and back to the lobby', () => {
  const db = makeDb('WXYZ');
  let now = 1_000_000;
  const participants = { a: true, b: true, c: true };
  const online = { a: true, b: true, c: true };
  db.game = createGame({ code: db.code, matchId: 'm1', settings: { rounds: 5, roundSec: 120 }, participants, now, pickWord });
  assert.equal(db.game.phase, 'intro');
  assert.ok(!JSON.stringify(db.game).includes(decodeWord(db.game.secret, secretKey('WXYZ', 'm1', 0))), 'answer not stored in plain text');

  const answers = [];
  for (let round = 0; round < 5; round++) {
    assert.equal(db.game.round, round);
    assert.equal(tick(db, now + 100, online), null, 'intro holds until its timer');
    now += PHASE_MS.intro;
    tick(db, now, online);
    assert.equal(db.game.phase, 'play');

    // a solves in 2, b fails, c solves first try later.
    now += 10_000;
    const answer = play(db, 'a', 'x'.repeat(db.game.lengths[round]), now);
    answers.push(answer);
    assert.equal(answer.length, [5, 5, 6, 6, 7][round]);
    play(db, 'a', answer, now);
    for (let i = 0; i < 6; i++) play(db, 'b', 'z'.repeat(answer.length), now);
    assert.equal(tick(db, now, online), null, 'c still playing');
    now += 20_000;
    play(db, 'c', answer, now);
    tick(db, now, online); // everyone done -> reveal early
    assert.equal(db.game.phase, 'reveal');
    assert.equal(db.game.reveal, answer);
    const res = db.game.results[round];
    assert.ok(res.c.pts > 0 && res.a.pts > 0 && res.b.pts === 0);
    now += PHASE_MS.reveal;
    tick(db, now, online);
    if (round < 4) {
      assert.equal(db.game.phase, 'standings');
      now += PHASE_MS.standings;
      tick(db, now, online);
    }
  }
  assert.equal(db.game.phase, 'final');
  assert.equal(new Set(answers).size, 5, 'no repeated words');
  const s = standings(db.game);
  assert.equal(s.at(-1).uid, 'b');
  assert.equal(s.at(-1).score, 0);
  now += PHASE_MS.final;
  assert.equal(tick(db, now, online), 'lobby');
});

test('round ends on the timer when someone never finishes; offline players are not waited for', () => {
  const db = makeDb('ABCD');
  let now = 5_000;
  db.game = createGame({ code: db.code, matchId: 'm2', settings: { rounds: 3, roundSec: 60 }, participants: { a: true, b: true, c: true }, now, pickWord });
  now += PHASE_MS.intro; tick(db, now, { a: true, b: true, c: true });
  const answer = play(db, 'a', 'crane', now + 1000);
  play(db, 'a', answer, now + 2000);
  // b is online and thinking; c is offline. Not everyone done:
  assert.equal(tick(db, now + 3000, { a: true, b: true, c: false }), null);
  // b drops offline too -> only online players count -> round closes early
  tick(db, now + 4000, { a: true, b: false, c: false });
  assert.equal(db.game.phase, 'reveal');

  // Next round: nobody finishes -> closes after timer + grace
  now = db.game.phaseEndsAt; tick(db, now, {}); // -> standings
  now = db.game.phaseEndsAt; tick(db, now, {}); // -> intro r1
  now = db.game.phaseEndsAt; tick(db, now, { a: true }); // -> play
  const end = db.game.phaseEndsAt;
  assert.equal(tick(db, end, { a: true }), null, 'grace period');
  tick(db, end + PLAY_GRACE_MS, { a: true });
  assert.equal(db.game.phase, 'reveal');
  assert.equal(db.game.results[1].a.pts, 0);
});

test('host migration mid-round: new host resumes from stored state with no double scoring', () => {
  const db = makeDb('HJKL');
  let now = 50_000;
  const participants = { host: true, p2: true };
  db.game = createGame({ code: db.code, matchId: 'm3', settings: { rounds: 3, roundSec: 120 }, participants, now, pickWord });
  now += PHASE_MS.intro; tick(db, now, { host: true, p2: true });
  const answer = play(db, 'p2', 'slate', now + 5000);
  play(db, 'p2', answer, now + 6000);

  // Host phone locks: heartbeat stops, presence still "online" for a while.
  const meta = { hostId: 'host', status: 'playing', hostBeat: now + 6000 };
  const players = { host: { joinedAt: 1 }, p2: { joinedAt: 2 } };
  const presence = { host: { online: true }, p2: { online: true } };
  assert.equal(shouldClaimHost({ meta, players, presence, now: now + 7000, me: 'p2' }), false);
  const t = now + 6000 + HOST_TIMEOUT_MS;
  assert.equal(shouldClaimHost({ meta, players, presence, now: t, me: 'p2' }), true);
  meta.hostId = 'p2';

  // The frozen host's last cached snapshot, from before the takeover.
  const stale = structuredClone(db.game);

  // p2 is now the director. Host is considered offline for "everyone done".
  tick(db, t, { p2: true, host: false });
  assert.equal(db.game.phase, 'reveal');
  const firstResults = structuredClone(db.game.results);

  // The old host wakes up and (wrongly) replays the same transition from its stale copy.
  // (Security rules would reject the write; even if not, results are keyed by round.)
  const replay = nextStep(stale, { code: db.code, now: t + 50, boards: db.boards[0], online: { p2: true }, pickWord });
  applyPatch(db.game, replay);
  assert.deepEqual(db.game.results, firstResults);
  assert.equal(standings(db.game)[0].uid, 'p2');
});

test('rejoining mid-round restores the board from stored state', () => {
  const db = makeDb('MNPQ');
  let now = 0;
  db.game = createGame({ code: db.code, matchId: 'm4', settings: { rounds: 3, roundSec: 120 }, participants: { a: true, b: true }, now, pickWord });
  now += PHASE_MS.intro; tick(db, now, { a: true, b: true });
  play(db, 'a', 'crane', now + 1000);
  play(db, 'a', 'stomp', now + 2000);
  // "refresh": a reloads; everything it needs lives in db.boards / db.game
  const restored = db.boards[db.game.round].a;
  assert.deepEqual(asArray(restored.g), ['crane', 'stomp']);
  assert.equal(restored.done, false);
  assert.equal(db.game.phase, 'play');
});

test('word lists: answers are valid guesses, lowercase, fixed width, no repeats', () => {
  for (const n of [5, 6, 7]) {
    const a = JSON.parse(readFileSync(`data/words/answers-${n}.json`, 'utf8'));
    assert.equal(a.length % n, 0);
    assert.match(a, /^[a-z]+$/);
    const words = a.match(new RegExp(`.{${n}}`, 'g'));
    assert.ok(words.length >= 1000, `${n}: ${words.length} answers`);
    assert.equal(new Set(words).size, words.length);
    for (const w of words) assert.ok(isValidGuess(w));
  }
  assert.ok(isValidGuess('crane'));
  assert.ok(!isValidGuess('xqzvb'));
  for (const w of ['bitch', 'whore', 'nigger', 'penis']) assert.ok(!JSON.parse(readFileSync(`data/words/answers-${w.length}.json`, 'utf8')).match(new RegExp(`.{${w.length}}`, 'g')).includes(w));
});
