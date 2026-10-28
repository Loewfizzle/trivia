// Security-rules tests against the Firebase Realtime Database emulator.
//
//   cd tests/integration && npm install
//   npx firebase emulators:exec --only database --project demo-arcade "node --test rules.test.mjs"
//
// (Needs Java for the emulator.) See CLAUDE.md → Testing.
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, get, set, update, remove, query, orderByChild, endAt, limitToFirst, serverTimestamp, runTransaction } from 'firebase/database';

const rules = readFileSync(fileURLToPath(new URL('../../database.rules.json', import.meta.url)), 'utf8');
let env;
const CODE = 'ABCD';
const R = `rooms/${CODE}`;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-arcade',
    database: { rules, host: '127.0.0.1', port: 9000 },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearDatabase(); });

const db = uid => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).database();
const seed = data => env.withSecurityRulesDisabled(ctx => set(ref(ctx.database()), data));
const now = () => Date.now();

function lobbyRoom(extra = {}) {
  return {
    rooms: {
      [CODE]: {
        meta: { hostId: 'host', status: 'lobby', createdAt: now(), activeAt: now(), hostBeat: now() },
        players: {
          host: { name: 'HOST', color: 'cyan', avatar: 'bolt', joinedAt: 1 },
          p2: { name: 'TWO', color: 'magenta', avatar: 'eye', joinedAt: 2 },
        },
        presence: { host: { online: true, lastSeen: now() }, p2: { online: true, lastSeen: now() } },
        ...extra,
      },
    },
  };
}

function playingRoom(phase = 'play') {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'cipher', matchId: 'm1', round: 1, rk: '1', phase, participants: { host: true, p2: true } };
  return r;
}

const player = name => ({ name, color: 'green', avatar: 'hex', joinedAt: serverTimestamp() });

test('unauthenticated users can read nothing', async () => {
  await seed(lobbyRoom());
  await assertFails(get(ref(db(null), R)));
  await assertSucceeds(get(ref(db('anyone'), R)));
  await assertFails(get(ref(db('anyone'), 'rooms')), 'no listing all rooms');
});

test('creating a room: only as yourself, never over an existing room', async () => {
  const meta = uid => ({ hostId: uid, status: 'lobby', createdAt: serverTimestamp(), activeAt: serverTimestamp() });
  await assertFails(set(ref(db('a'), `rooms/WXYZ/meta`), meta('b')));
  await assertSucceeds(set(ref(db('a'), `rooms/WXYZ/meta`), meta('a')));
  await assertFails(set(ref(db('b'), `rooms/WXYZ/meta`), meta('b')), 'cannot hijack an existing room');
  await assertFails(set(ref(db('a'), `rooms/WX10/meta`), meta('a')), 'invalid code chars');
  await assertSucceeds(set(ref(db('a'), `rooms/MINT/meta`), meta('a')), 'hush words use every letter (I, O too)');
  await assertFails(set(ref(db('a'), `rooms/mint/meta`), meta('a')), 'upper case only');
});

test('HUSH WORDS: two hosts claiming the same word at once — exactly one gets it', async () => {
  const meta = uid => ({ hostId: uid, status: 'lobby', createdAt: serverTimestamp(), activeAt: serverTimestamp(), hostBeat: serverTimestamp() });
  // the same transaction as js/room.js#claimRoom
  const claim = uid => runTransaction(ref(db(uid), 'rooms/JAZZ/meta'), cur => (cur == null ? meta(uid) : undefined), { applyLocally: false })
    .then(r => r.committed && r.snapshot.child('hostId').val() === uid).catch(() => false);
  const wins = await Promise.all(['a', 'b', 'c', 'd'].map(claim));
  assert.equal(wins.filter(Boolean).length, 1, `one winner (${wins})`);
  assert.equal(await claim('e'), false, 'a later claim on an open room fails');
});

test('LOCK THE DOOR: host only; new players are refused, players already in rejoin; kicked stay kicked', async () => {
  await seed(lobbyRoom({ kicked: { k1: true } }));
  await assertFails(update(ref(db('p2'), `${R}/meta`), { locked: true }), 'only the host locks');
  await assertFails(update(ref(db('host'), `${R}/meta`), { locked: 'yes' }), 'a boolean');
  await assertSucceeds(update(ref(db('host'), `${R}/meta`), { locked: true }));
  await assertFails(set(ref(db('p3'), `${R}/players/p3`), player('NEW')), 'a new player cannot join a locked room');
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2`), player('TWO')), 'a player already in rewrites their node (refresh / rejoin)');
  await assertSucceeds(update(ref(db('p2'), `${R}/players/p2`), { name: 'TWO B' }), '…and edits it');
  await assertSucceeds(set(ref(db('p2'), `${R}/presence/p2`), { online: true, lastSeen: serverTimestamp() }), '…and comes back online');
  await assertFails(set(ref(db('k1'), `${R}/players/k1`), player('KICKED')), 'kicked stays kicked (locked)');
  await assertSucceeds(update(ref(db('host'), `${R}/meta`), { locked: null }));
  await assertSucceeds(set(ref(db('p3'), `${R}/players/p3`), player('NEW')), 'unlocked: the new player gets in');
  await assertFails(set(ref(db('k1'), `${R}/players/k1`), player('KICKED')), 'kicked stays kicked (unlocked)');
  // leaving a locked room still works
  await assertSucceeds(update(ref(db('host'), `${R}/meta`), { locked: true }));
  await assertSucceeds(update(ref(db('p3'), R), { 'players/p3': null, 'presence/p3': null }), 'leaving a locked room');
});

test('HUSH WORDS: hush/{WORD} only with the room it closes; anyone may sweep entries older than 24 h', async () => {
  await seed(lobbyRoom());
  const closed = { closedAt: serverTimestamp() };
  await assertSucceeds(get(ref(db('anyone'), 'hush')), 'any signed-in phone reads the cooldowns');
  await assertFails(get(ref(db(null), 'hush')));
  await assertFails(set(ref(db('host'), `hush/${CODE}`), closed), 'not while the room is open');
  await assertFails(set(ref(db('evil'), 'hush/MINT'), closed), 'not for a word with no room (cannot cool down words at will)');
  await assertFails(update(ref(db('p2')), { [R]: null, [`hush/${CODE}`]: closed }), 'a player cannot close the host\'s room');
  await assertFails(update(ref(db('host')), { [R]: null, [`hush/${CODE}`]: { closedAt: 5 } }), 'closedAt must be server time');
  await assertFails(update(ref(db('host')), { [R]: null, [`hush/${CODE}`]: { ...closed, x: 1 } }), 'no extra fields');
  await assertSucceeds(update(ref(db('host')), { [R]: null, [`hush/${CODE}`]: closed }), 'the host closes the room and the word rests');
  await assertFails(set(ref(db('host'), `hush/${CODE}`), closed), 'no rewriting it once the room is gone');
  await assertFails(remove(ref(db('anyone'), `hush/${CODE}`)), 'a fresh entry cannot be deleted');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), 'hush/OLDY'), { closedAt: now() - 25 * 3600_000 }));
  await assertSucceeds(update(ref(db('anyone')), { 'hush/OLDY': null }), 'an entry older than 24 h can be swept');
  // an idle room (anyone may close it) records its word too
  const idle = lobbyRoom(); idle.rooms[CODE].meta.activeAt = now() - 2 * 3600_000; await seed(idle);
  await assertSucceeds(update(ref(db('stranger')), { [R]: null, [`hush/${CODE}`]: closed }), 'closing an idle room records its word');
});

test('players write only their own node; host can remove others', async () => {
  await seed(lobbyRoom());
  await assertSucceeds(set(ref(db('p3'), `${R}/players/p3`), player('THREE')));
  await assertFails(set(ref(db('p3'), `${R}/players/p2`), player('EVIL')));
  await assertFails(set(ref(db('p3'), `${R}/players/p3`), { ...player('X'), score: 999 }), 'no extra fields');
  await assertFails(set(ref(db('p3'), `${R}/players/p3`), player('A_NAME_THAT_IS_WAY_TOO_LONG')));
  await assertFails(remove(ref(db('p3'), `${R}/players/p2`)));
  await assertSucceeds(remove(ref(db('host'), `${R}/players/p2`)));
  await assertFails(set(ref(db('p9'), `rooms/QQQQ/players/p9`), player('NOROOM')), 'room must exist');
});

test('kick: host only; kicked players cannot rejoin', async () => {
  await seed(lobbyRoom());
  await assertFails(update(ref(db('p2'), R), { 'kicked/host': true }));
  await assertSucceeds(update(ref(db('host'), R), { 'kicked/p2': true, 'players/p2': null, 'presence/p2': null }));
  await assertFails(set(ref(db('p2'), `${R}/players/p2`), player('BACK')));
});

test('presence: own node only (host may clear)', async () => {
  await seed(lobbyRoom());
  await assertSucceeds(set(ref(db('p2'), `${R}/presence/p2`), { online: false, lastSeen: serverTimestamp() }));
  await assertFails(set(ref(db('p2'), `${R}/presence/host`), { online: false, lastSeen: 0 }));
});

test('game state and meta: host only', async () => {
  await seed(playingRoom());
  await assertFails(update(ref(db('p2'), `${R}/game`), { phase: 'final' }));
  await assertSucceeds(update(ref(db('host'), `${R}/game`), { phase: 'reveal' }));
  await assertFails(update(ref(db('p2'), `${R}/meta`), { status: 'lobby' }));
  await assertSucceeds(update(ref(db('host'), R), { game: null, boards: null, 'meta/status': 'lobby', 'meta/activeAt': serverTimestamp() }));
  await assertFails(update(ref(db('host'), `${R}/meta`), { status: 'banana' }));
});

test('lobby mood music queue (meta/lm): the host writes it, nobody else', async () => {
  await seed(lobbyRoom());
  const lm = { m: 'lm123', t0: 1000, songs: ['late1'], sd: [180000], bag: { mood: 'late', left: ['late2'] } };
  await assertSucceeds(update(ref(db('host'), `${R}/meta/lm`), lm));
  await assertFails(update(ref(db('p2'), `${R}/meta/lm`), { songs: ['menu'] }));
  await assertFails(set(ref(db('host'), `${R}/meta/lm`), { m: 'x' }), 'must be a whole queue');
});

test('boards: own board, current round, play phase, participants only', async () => {
  await seed(playingRoom('play'));
  const board = { g: ['abc='], p: ['01200'], solved: false, done: false, at: serverTimestamp() };
  await assertSucceeds(set(ref(db('p2'), `${R}/boards/m1/1/p2`), board));
  await assertFails(set(ref(db('p2'), `${R}/boards/m1/1/host`), board), 'not someone else');
  await assertFails(set(ref(db('p2'), `${R}/boards/m1/0/p2`), board), 'not an old round');
  await assertFails(set(ref(db('p2'), `${R}/boards/zz/1/p2`), board), 'not another match');
  await assertFails(set(ref(db('p2'), `${R}/boards/m1/1/p2`), { ...board, p: ['xyz'] }), 'pattern format');
  await assertFails(set(ref(db('p2'), `${R}/boards/m1/1/p2`), { ...board, solved: true, solvedAt: 12345 }), 'solve time must be server time');
  await assertSucceeds(set(ref(db('p2'), `${R}/boards/m1/1/p2`), { ...board, p: ['22222'], solved: true, done: true, solvedAt: serverTimestamp() }));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/players/late`), { name: 'LATE', color: 'red', avatar: 'moon', joinedAt: 3 }));
  await assertFails(set(ref(db('late'), `${R}/boards/m1/1/late`), board), 'spectators cannot play');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'reveal'));
  await assertFails(set(ref(db('p2'), `${R}/boards/m1/1/p2`), board), 'round closed');
});

test('host migration: denied while host is alive', async () => {
  await seed(lobbyRoom());
  // same transaction shape as js/host.js claimHost (cold cache => cur is null on first run)
  await assertFails(runTransaction(ref(db('p2'), `${R}/meta/hostId`), cur => (cur === 'host' || cur == null ? 'p2' : undefined)));
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

test('host migration: allowed when host offline > 8s', async () => {
  const room = lobbyRoom();
  room.rooms[CODE].presence.host = { online: false, lastSeen: now() - 9000 };
  await seed(room);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'someone-else'), 'must claim for yourself');
  await assertFails(set(ref(db('outsider'), `${R}/meta/hostId`), 'outsider'), 'must be a player');
  await assertSucceeds(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

test('host migration: not allowed when host only just dropped', async () => {
  const room = lobbyRoom();
  room.rooms[CODE].presence.host = { online: false, lastSeen: now() - 1000 };
  await seed(room);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

test('host migration: allowed when host left the room', async () => {
  const room = lobbyRoom();
  delete room.rooms[CODE].players.host;
  await seed(room);
  await assertSucceeds(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

test('host migration: frozen host (stale heartbeat) during a game', async () => {
  const room = playingRoom();
  room.rooms[CODE].meta.hostBeat = now() - 9000;
  await seed(room);
  await assertSucceeds(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
  // heartbeat ignored in lobby
  const lobby = lobbyRoom();
  lobby.rooms[CODE].meta.hostBeat = now() - 60000;
  await env.clearDatabase();
  await seed(lobby);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

test('stale-room cleanup: query + delete only rooms idle > 1h (no game for an hour)', async () => {
  const old = now() - 61 * 60_000;
  await seed({
    rooms: {
      OLDD: { meta: { hostId: 'x', status: 'lobby', createdAt: old, activeAt: old } },
      NEWW: { meta: { hostId: 'x', status: 'lobby', createdAt: now(), activeAt: now() } },
      ORPH: { presence: { ghost: { online: false, lastSeen: 1 } } },
    },
  });
  const me = db('cleaner');
  const cutoff = now() - 3600_000 - 30_000;
  const snap = await assertSucceeds(get(query(ref(me, 'rooms'), orderByChild('meta/activeAt'), endAt(cutoff), limitToFirst(20))));
  const found = Object.keys(snap.val() || {}).sort();
  assert.deepEqual(found, ['OLDD', 'ORPH']);
  await assertFails(get(query(ref(me, 'rooms'), orderByChild('meta/activeAt'), limitToFirst(500))), 'bounded listing only');
  await assertFails(get(query(ref(me, 'rooms'), orderByChild('meta/hostId'), limitToFirst(5))), 'only by activeAt');
  await assertSucceeds(remove(ref(me, 'rooms/OLDD')));
  await assertSucceeds(remove(ref(me, 'rooms/ORPH')));
  await assertFails(remove(ref(me, 'rooms/NEWW')));
  await assertSucceeds(remove(ref(db('x'), 'rooms/NEWW')), 'host can close their room');
});

// ---------- Stage 2: LAST SIGNAL / OVERCLOCK paths ----------
function signalRoom(phase = 'question') {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'signal', matchId: 'm2', q: 4, qk: '4', phase, participants: { host: true, p2: true }, out: {} };
  return r;
}

test('signal answers: own, once, current question, alive participants only', async () => {
  await seed(signalRoom());
  const ans = { c: 2, at: serverTimestamp() };
  await assertSucceeds(set(ref(db('p2'), `${R}/answers/m2/4/p2`), ans));
  await assertFails(set(ref(db('p2'), `${R}/answers/m2/4/p2`), { c: 1, at: serverTimestamp() }), 'no changing an answer');
  await assertFails(set(ref(db('p2'), `${R}/answers/m2/4/host`), ans), 'not for someone else');
  await assertFails(set(ref(db('host'), `${R}/answers/m2/3/host`), ans), 'not an old question');
  await assertFails(set(ref(db('host'), `${R}/answers/m2/4/host`), { c: 7, at: serverTimestamp() }), 'choice 0-3');
  await assertFails(set(ref(db('host'), `${R}/answers/m2/4/host`), { c: 1, at: 123 }), 'server time only');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/out/host`), 2));
  await assertFails(set(ref(db('host'), `${R}/answers/m2/4/host`), ans), 'eliminated players cannot answer');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'reveal'));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/out/host`), null));
  await assertFails(set(ref(db('host'), `${R}/answers/m2/4/host`), ans), 'question closed');
});

test('signal targets: own node, must name another participant', async () => {
  await seed(signalRoom());
  await assertSucceeds(set(ref(db('p2'), `${R}/targets/m2/p2`), 'host'));
  await assertFails(set(ref(db('p2'), `${R}/targets/m2/p2`), 'p2'), 'not yourself');
  await assertFails(set(ref(db('p2'), `${R}/targets/m2/p2`), 'stranger'), 'must be a participant');
  await assertFails(set(ref(db('p2'), `${R}/targets/m2/host`), 'p2'), 'not someone else\'s target');
  await assertSucceeds(update(ref(db('host'), R), { answers: null, targets: null }), 'host clears');
});

test('overclock progress: own board during play, consistent counts, locked once done', async () => {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'overclock', matchId: 'm3', ci: 2, ck: '2', phase: 'play', participants: { host: true, p2: true } };
  await seed(r);
  const prog = (p, ok, done) => ({ p, ok, n: 4, done, at: serverTimestamp(), ...(done ? { doneAt: serverTimestamp() } : {}) });
  await assertSucceeds(set(ref(db('p2'), `${R}/oc/m3/2/p2`), prog(1, 1, false)));
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/p2`), prog(2, 3, false)), 'ok cannot exceed p');
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/1/p2`), prog(1, 1, false)), 'not an old challenge');
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/host`), prog(1, 1, false)), 'not someone else');
  // the newer challenges' extra fields: Lexicon best word, Timeline order, Closest Call guess, Rewire turns
  await assertSucceeds(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(2, 2, false), w: 'compact' }));
  await assertSucceeds(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(2, 2, false), rw: '0123012301230123' }));
  await assertSucceeds(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(2, 2, false), g: 305.5 }));
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(2, 2, false), w: 'COMPACT!' }), 'lowercase letters only');
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(2, 2, false), w: 'abcdefghij' }), '9 letters max');
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(2, 2, false), o: '0124' }), 'order uses 0–3');
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(2, 2, false), g: -5 }), 'no negative guesses');
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(2, 2, false), rw: '4' }), 'turns are 0–3');
  await assertSucceeds(set(ref(db('p2'), `${R}/oc/m3/2/p2`), { ...prog(4, 4, true), o: '2031' }));
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/p2`), prog(4, 4, true)), 'finished boards are locked');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'standings'));
  await assertFails(set(ref(db('host'), `${R}/oc/m3/2/host`), prog(1, 1, false)), 'challenge closed');
  await assertSucceeds(update(ref(db('host'), R), { oc: null }));
});

// ---------- Stage 3: NEURAL BLUFF + game night ----------
function bluffRoom(phase) {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'bluff', matchId: 'm4', round: 2, rk: '2', phase, participants: { host: true, p2: true } };
  return r;
}

test('bluff lies: own, during write only, current round, length-limited', async () => {
  await seed(bluffRoom('write'));
  const lie = t => ({ t, at: serverTimestamp() });
  await assertSucceeds(set(ref(db('p2'), `${R}/lies/m4/2/p2`), lie('Calebs Cola')));
  await assertSucceeds(set(ref(db('p2'), `${R}/lies/m4/2/p2`), lie('Edited lie')), 'can edit while writing');
  await assertFails(set(ref(db('p2'), `${R}/lies/m4/2/host`), lie('x')), 'not someone else');
  await assertFails(set(ref(db('p2'), `${R}/lies/m4/1/p2`), lie('x')), 'not an old round');
  await assertFails(set(ref(db('p2'), `${R}/lies/m4/2/p2`), lie('x'.repeat(41))), 'max 40 chars');
  await assertFails(set(ref(db('stranger'), `${R}/lies/m4/2/stranger`), lie('x')), 'participants only');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'vote'));
  await assertFails(set(ref(db('p2'), `${R}/lies/m4/2/p2`), lie('late')), 'writing closed');
});

test('bluff votes: own, during vote only, optional like', async () => {
  await seed(bluffRoom('vote'));
  await assertSucceeds(set(ref(db('p2'), `${R}/votes/m4/2/p2`), { k: 'oabc', like: 'odef', at: serverTimestamp() }));
  await assertSucceeds(set(ref(db('p2'), `${R}/votes/m4/2/p2`), { k: 'oxyz', at: serverTimestamp() }), 'can change vote');
  await assertFails(set(ref(db('p2'), `${R}/votes/m4/2/host`), { k: 'o1', at: serverTimestamp() }));
  await assertFails(set(ref(db('p2'), `${R}/votes/m4/2/p2`), { k: 'o1', at: serverTimestamp(), extra: 1 }), 'no extra fields');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'reveal'));
  await assertFails(set(ref(db('p2'), `${R}/votes/m4/2/p2`), { k: 'o1', at: serverTimestamp() }), 'voting closed');
  await assertSucceeds(update(ref(db('host'), R), { lies: null, votes: null }), 'host clears');
});

test('game night scoreboard and question history: host only', async () => {
  await seed(lobbyRoom());
  const entry = { g: 'bluff', p: { host: 3, p2: 2 }, n: { host: 'HOST', p2: 'TWO' }, at: serverTimestamp() };
  await assertFails(set(ref(db('p2'), `${R}/night/m9`), entry));
  await assertSucceeds(set(ref(db('host'), `${R}/night/m9`), entry));
  await assertSucceeds(update(ref(db('host'), `${R}/meta`), { 'used/bluff/q123': true }));
  await assertFails(update(ref(db('p2'), `${R}/meta`), { 'used/bluff/q999': true }));
  await assertFails(update(ref(db('host'), `${R}/meta`), { 'used/bluff/q1': 'yes' }), 'boolean only');
});

function pulseRoom() {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'pulse', matchId: 'm5', si: 1, sk: '1', phase: 'song', participants: { host: true, p2: true } };
  return r;
}

test('pulse stats: own node only, current song, bounded numbers, host wipes', async () => {
  await seed(pulseRoom());
  const stats = { k: 1, ready: true, s: 12345, c: 12, mc: 40, p: 30, g: 5, o: 2, m: 3, n: 40, e: 300, er: 1, at: serverTimestamp() };
  await assertSucceeds(set(ref(db('p2'), `${R}/pulse/m5/p2`), stats));
  await assertFails(set(ref(db('p2'), `${R}/pulse/m5/host`), stats), 'not someone else');
  await assertFails(set(ref(db('p2'), `${R}/pulse/m4/p2`), stats), 'old match');
  await assertFails(set(ref(db('p2'), `${R}/pulse/m5/p2`), { ...stats, k: 0 }), 'stale song index');
  await assertFails(set(ref(db('p2'), `${R}/pulse/m5/p2`), { ...stats, s: -5 }), 'no negative scores');
  await assertFails(set(ref(db('p2'), `${R}/pulse/m5/p2`), { ...stats, s: 99999999 }), 'bounded');
  await assertFails(set(ref(db('p2'), `${R}/pulse/m5/p2`), { ...stats, hack: 1 }), 'no extra fields');
  await assertFails(set(ref(db('p3'), `${R}/pulse/m5/p3`), stats), 'spectators do not write');
  await assertFails(remove(ref(db('p2'), `${R}/pulse`)), 'players cannot wipe');
  await assertSucceeds(remove(ref(db('host'), `${R}/pulse`)), 'host wipes on start/end');
});

function golfRoom(phase = 'play') {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'golf', matchId: 'm7', hi: 2, hk: '2', phase, participants: { host: true, p2: true } };
  return r;
}

test('golf balls: own node, current hole, play phase only, locked scores and one sabotage per hole', async () => {
  await seed(golfRoom());
  const node = { h: 2, s: 1, x: 1.5, y: 10.25, st: 'roll', pu: 'magnet', pk: 1, ls: 1700000000000, le: 0,
    sh: { x: 0, y: 2, a: 1.5708, p: 0.5, t: 12.5, pu: '' }, b: { x: 1.5, y: 10.25, z: 0, vx: 0.5, vy: 8, t: 1700000001000 },
    ball: { c: '#2ff5d2', f: 'neon', t: 'ribbon' }, at: serverTimestamp() };
  const P = `${R}/golf/m7/p2`;
  await assertSucceeds(set(ref(db('p2'), P), node));
  await assertFails(set(ref(db('p2'), `${R}/golf/m7/host`), node), 'not someone else');
  await assertFails(set(ref(db('p2'), `${R}/golf/m6/p2`), node), 'old match');
  await assertFails(set(ref(db('p2'), P), { ...node, h: 1 }), 'stale hole');
  await assertFails(set(ref(db('p2'), P), { ...node, st: 'won' }), 'known states only');
  await assertFails(set(ref(db('p2'), P), { ...node, pu: 'nuke' }), 'known power-ups only');
  await assertFails(set(ref(db('p2'), P), { ...node, sh: { ...node.sh, p: 3 } }), 'power is 0..1');
  await assertFails(set(ref(db('p2'), P), { ...node, hack: 1 }), 'no extra fields');
  await assertFails(set(ref(db('p2'), P), { ...node, s: 3, f: 2 }), 'final score = strokes (or 7)');
  await assertSucceeds(set(ref(db('p2'), P), { ...node, s: 3, f: 3, st: 'done' }));
  await assertFails(set(ref(db('p2'), P), { ...node, s: 2, f: 2, st: 'done' }), 'a final score is locked');
  await seed(golfRoom());
  await assertSucceeds(set(ref(db('p2'), P), { ...node, s: 6, f: 7, st: 'done', ball: { c: '#ff4fa3', f: 'glass', t: 'pixels' } }), 'maxed out = 7');
  // sabotage: a participant target, never yourself, and it can't be re-aimed on the same hole
  await seed(golfRoom());
  const sab = { h: 2, to: 'host', k: 'fog', at: 1700000000000 };
  await assertFails(set(ref(db('p2'), P), { ...node, sab: { ...sab, to: 'p2' } }), 'not yourself');
  await assertFails(set(ref(db('p2'), P), { ...node, sab: { ...sab, to: 'p9' } }), 'participants only');
  await assertFails(set(ref(db('p2'), P), { ...node, sab: { ...sab, k: 'bomb' } }), 'known effects only');
  await assertSucceeds(set(ref(db('p2'), P), { ...node, sab }));
  await assertSucceeds(set(ref(db('p2'), P), { ...node, s: 2, sab }), 'unchanged sabotage rides along');
  await assertFails(set(ref(db('p2'), P), { ...node, sab: { ...sab, k: 'shake' } }), 'one sabotage per hole');
  await assertFails(set(ref(db('p3'), `${R}/golf/m7/p3`), node), 'spectators do not write');
  await assertFails(remove(ref(db('p2'), `${R}/golf`)), 'players cannot wipe');
  await seed(golfRoom('card'));
  await assertFails(set(ref(db('p2'), P), node), 'no writes during the scorecard');
  await assertSucceeds(remove(ref(db('host'), `${R}/golf`)), 'host wipes on start/end');
});

test('chat: members only (kicked lose it at once), own messages, server time, ≤ 300 chars, rate limit, host moderation', async () => {
  await seed(lobbyRoom({ kicked: { gone: true } }));
  const C = `chats/${CODE}`;
  const msg = (uid, t = 'hello') => ({ [`m/k${Math.random().toString(36).slice(2, 8)}`]: { u: uid, t, at: serverTimestamp() }, [`rate/${uid}`]: serverTimestamp() });
  await assertSucceeds(get(ref(db('p2'), `${C}/m`)), 'members read');
  await assertFails(get(ref(db('stranger'), `${C}/m`)), 'outsiders can’t read');
  await assertFails(get(ref(db('gone'), `${C}/m`)), 'kicked players can’t read');
  await assertFails(get(ref(db(null), `${C}/m`)), 'signed-out');
  await assertSucceeds(update(ref(db('p2'), C), msg('p2', 'gg 🔥')));
  await assertFails(update(ref(db('stranger'), C), msg('stranger')), 'outsiders can’t write');
  await assertFails(update(ref(db('p2'), C), msg('host')), 'only as yourself');
  await new Promise(r => setTimeout(r, 900));
  await assertFails(update(ref(db('p2'), C), { 'm/x1': { u: 'p2', t: 'no rate stamp', at: serverTimestamp() } }), 'must stamp the rate node');
  await assertFails(update(ref(db('p2'), C), { 'm/x2': { u: 'p2', t: 'old', at: 5 }, 'rate/p2': serverTimestamp() }), 'server time only');
  await assertFails(update(ref(db('p2'), C), msg('p2', '')), 'not empty');
  await assertFails(update(ref(db('p2'), C), msg('p2', 'x'.repeat(301))), '≤ 300 chars');
  await assertFails(update(ref(db('p2'), C), { 'm/x3': { u: 'p2', t: 'hi', at: serverTimestamp(), color: 'red' }, 'rate/p2': serverTimestamp() }), 'no extra fields');
  await assertFails(update(ref(db('p2'), C), { 'm/x4': { s: 'join', x: 'fake system line', at: serverTimestamp() }, 'rate/p2': serverTimestamp() }), 'players can’t write system lines');
  await assertSucceeds(update(ref(db('p2'), C), msg('p2', 'one')));
  await assertFails(update(ref(db('p2'), C), msg('p2', 'two, too fast')), 'rate limit: 800 ms between messages');
  await assertSucceeds(set(ref(db('host'), `${C}/m/sys1`), { s: 'join', x: 'TWO joined', at: serverTimestamp() }), 'host writes system lines');
  await assertFails(remove(ref(db('p2'), `${C}/m/sys1`)), 'players can’t delete');
  await assertSucceeds(remove(ref(db('host'), `${C}/m/sys1`)), 'host prunes');
  // typing: own node, server time, removable
  await assertSucceeds(set(ref(db('p2'), `${C}/typing/p2`), serverTimestamp()));
  await assertFails(set(ref(db('p2'), `${C}/typing/host`), serverTimestamp()), 'not for others');
  await assertFails(set(ref(db('gone'), `${C}/typing/gone`), serverTimestamp()), 'kicked can’t type');
  await assertSucceeds(remove(ref(db('p2'), `${C}/typing/p2`)));
  await assertFails(remove(ref(db('p2'), `${C}/m`)), 'players can’t clear');
  await assertSucceeds(remove(ref(db('host'), `${C}/m`)), 'host clears the chat');
  // kicked mid-session: access ends immediately
  await env.withSecurityRulesDisabled(ctx => update(ref(ctx.database(), `rooms/${CODE}`), { 'kicked/p2': true, 'players/p2': null }));
  await assertFails(get(ref(db('p2'), `${C}/m`)));
  await new Promise(r => setTimeout(r, 900));
  await assertFails(update(ref(db('p2'), C), msg('p2', 'still here?')));
});

// ---------------------------------------------------------------- DOUBLE AGENT
function agentRoom(game) {
  const r = lobbyRoom();
  const room = r.rooms[CODE];
  room.meta.status = 'playing';
  room.players.p3 = { name: 'THREE', color: 'green', avatar: 'hex', joinedAt: 3 };
  room.players.p4 = { name: 'FOUR', color: 'yellow', avatar: 'hex', joinedAt: 4 };
  room.game = { id: 'agent', matchId: 'm1', round: 0, rk: '0-0', participants: { host: true, p2: true, p3: true, p4: true }, ...game };
  r.spy = { [CODE]: {
    key: { m1: { seed: 'supersecretseed01' } },
    card: { host: { m: 'm1', rk: '0-0', cat: 'FOOD', word: 'pizza', agent: false }, p2: { m: 'm1', rk: '0-0', cat: 'FOOD', agent: true } },
  } };
  return r;
}

test('double agent secrets: your file is yours alone; only the host reads the seed and writes the files', async () => {
  await seed(agentRoom({ phase: 'briefing' }));
  const S = `spy/${CODE}`;
  await assertSucceeds(get(ref(db('p2'), `${S}/card/p2`)));
  await assertFails(get(ref(db('p2'), `${S}/card/host`)), 'cannot read another player\'s file');
  await assertFails(get(ref(db('p3'), `${S}/card/p2`)), 'cannot learn who the agent is');
  await assertFails(get(ref(db('p3'), `${S}/card`)), 'cannot list the files');
  await assertFails(get(ref(db('p3'), `${S}`)));
  await assertFails(get(ref(db('p3'), `${S}/key/m1`)), 'players cannot read the seed');
  await assertSucceeds(get(ref(db('host'), `${S}/key/m1`)), 'the host can');
  await assertFails(get(ref(db('outsider'), `${S}/card/p2`)));
  await assertFails(set(ref(db('p3'), `${S}/card/p3`), { m: 'm1', rk: '0-0', cat: 'X', word: 'y', agent: false }), 'players cannot forge a file');
  await assertFails(set(ref(db('p3'), `${S}/key/m1`), { seed: 'mine-mine-mine-mine' }));
  await assertSucceeds(set(ref(db('host'), `${S}/card/p3`), { m: 'm1', rk: '0-0', cat: 'FOOD', word: 'pizza', agent: false }));
  // a new host takes over: now they can read the seed, the old host can't
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/meta/hostId`), 'p3'));
  await assertSucceeds(get(ref(db('p3'), `${S}/key/m1`)));
  await assertFails(get(ref(db('host'), `${S}/key/m1`)));
  // cleanup: the host (or anyone once the room is gone) may delete it all
  await assertFails(remove(ref(db('p2'), S)));
  await assertSucceeds(remove(ref(db('p3'), S)));
});

test('double agent clues: only on your turn, the current pass, once, one clean word', async () => {
  await seed(agentRoom({ phase: 'clues', cur: 'p2', pass: 0, turn: 1, order: ['host', 'p2', 'p3', 'p4'] }));
  const C = `${R}/agclue/m1/0-0`;
  const clue = t => ({ t, at: serverTimestamp() });
  await assertFails(set(ref(db('p3'), `${C}/0/p3`), clue('cheese')), 'not your turn');
  await assertFails(set(ref(db('p3'), `${C}/0/p2`), clue('cheese')), 'not your node');
  await assertFails(set(ref(db('p2'), `${C}/1/p2`), clue('cheese')), 'wrong pass');
  await assertFails(set(ref(db('p2'), `${C}/0/p2`), clue('two words')), 'one word');
  await assertFails(set(ref(db('p2'), `${C}/0/p2`), clue('x'.repeat(21))), '20 max');
  await assertSucceeds(set(ref(db('p2'), `${C}/0/p2`), clue('deep-dish')));
  await assertFails(set(ref(db('p2'), `${C}/0/p2`), clue('again')), 'once');
  await assertFails(set(ref(db('p2'), `${R}/agclue/m1/9-0/0/p2`), clue('old')), 'not another round');
});

test('double agent ready, pins and votes: phase-gated, own node, never yourself, locked votes stay locked', async () => {
  await seed(agentRoom({ phase: 'debate' }));
  const P = `${R}/agpin/m1/0-0`, V = `${R}/agvote/m1/0-0`, RD = `${R}/agready/m1/0-0`;
  await assertSucceeds(set(ref(db('p2'), `${P}/p2`), 'p3'));
  await assertSucceeds(remove(ref(db('p2'), `${P}/p2`)), 'unpin');
  await assertFails(set(ref(db('p2'), `${P}/p2`), 'p2'), 'not yourself');
  await assertFails(set(ref(db('p2'), `${P}/p2`), 'stranger'), 'a player in the game');
  await assertFails(set(ref(db('p3'), `${P}/p2`), 'p4'), 'own pin only');
  await assertSucceeds(set(ref(db('p2'), `${RD}/p2`), { b: true, d: true }));
  await assertFails(set(ref(db('p2'), `${V}/p2`), { s: 'p3', at: serverTimestamp() }), 'not voting yet');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'vote'));
  await assertSucceeds(set(ref(db('p2'), `${V}/p2`), { s: 'p3', lock: false, at: serverTimestamp() }));
  await assertSucceeds(set(ref(db('p2'), `${V}/p2`), { s: 'p4', lock: true, at: serverTimestamp() }), 'change, then lock');
  await assertFails(set(ref(db('p2'), `${V}/p2`), { s: 'p3', lock: true, at: serverTimestamp() }), 'locked');
  await assertFails(set(ref(db('p3'), `${V}/p3`), { s: 'p3', at: serverTimestamp() }), 'not yourself');
  await assertFails(set(ref(db('p2'), `${RD}/p2`), { b: true }), 'no ready flag during the vote');
});

test('double agent last chance: only a caught agent, once, in the last phase', async () => {
  await seed(agentRoom({ phase: 'last', caught: { p2: true } }));
  const G = `${R}/agguess/m1/0-0`;
  await assertFails(set(ref(db('p3'), `${G}/p3`), { t: 'pizza', at: serverTimestamp() }), 'not caught');
  await assertSucceeds(set(ref(db('p2'), `${G}/p2`), { t: 'pizza', at: serverTimestamp() }));
  await assertFails(set(ref(db('p2'), `${G}/p2`), { t: 'pasta', at: serverTimestamp() }), 'one guess');
  await assertSucceeds(remove(ref(db('host'), `${R}/agguess`)), 'host wipes');
});

// ---------------------------------------------------------------- PRISM DROP
function prismRoom(game = {}) {
  const r = lobbyRoom();
  const room = r.rooms[CODE];
  room.meta.status = 'playing';
  room.players.p3 = { name: 'THREE', color: 'green', avatar: 'hex', joinedAt: 3 };
  room.game = { id: 'prism', matchId: 'm1', phase: 'play', settings: { mode: 'battle' }, participants: { host: true, p2: true, p3: true }, ...game };
  return r;
}
const pnode = (extra = {}) => ({ st: 'play', at: serverTimestamp(), b: '1111000000', h: 1, p: '3,0,4,18', sc: 120, ln: 1, lv: 1, mc: 0, se: 0, pd: 0, best: 'single', tg: 'p3', ...extra });

test('prism boards: own node during the match; out is final; sizes checked', async () => {
  await seed(prismRoom());
  const N = `${R}/prism/m1`;
  await assertSucceeds(set(ref(db('p2'), `${N}/p2`), pnode()));
  await assertFails(set(ref(db('p2'), `${N}/p3`), pnode()), 'not someone else\'s board');
  await assertFails(set(ref(db('outsider'), `${N}/outsider`), pnode()), 'not a participant');
  await assertFails(set(ref(db('p2'), `${N}/p2`), pnode({ b: '12x' })), 'board string: digits 0-8 only');
  await assertFails(set(ref(db('p2'), `${N}/p2`), pnode({ b: '1'.repeat(401) })), 'board string length');
  await assertFails(set(ref(db('p2'), `${N}/p2`), pnode({ hack: 1 })), 'no extra fields');
  await assertSucceeds(update(ref(db('p2'), `${N}/p2`), { sv: { b: '1111', n: 12, ak: '-Nabc', h: 3, sc: 5, pd: [[2, 4, 'p3', '-Nk']] } }), 'full save');
  // topping out: credit must name another participant; out can't be undone
  await assertFails(update(ref(db('p2'), `${N}/p2`), { st: 'out', by: 'p2', at: serverTimestamp() }), 'no self credit');
  await assertSucceeds(update(ref(db('p2'), `${N}/p2`), { st: 'out', by: 'p3', at: serverTimestamp() }));
  await assertFails(update(ref(db('p2'), `${N}/p2`), { st: 'play', at: serverTimestamp() }), 'cannot come back after topping out');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'final'));
  await assertFails(update(ref(db('p3'), `${N}/p3`), pnode()), 'not after the match');
});

test('prism junk: only from yourself, to another live participant, during a battle, once', async () => {
  await seed(prismRoom());
  const Q = `${R}/prismq/m1`;
  const atk = (from, extra = {}) => ({ f: from, n: 2, g: 4, at: serverTimestamp(), ...extra });
  await assertSucceeds(set(ref(db('p2'), `${Q}/p3/k1`), atk('p2')));
  await assertFails(set(ref(db('p2'), `${Q}/p3/k1`), atk('p2')), 'written once');
  await assertFails(set(ref(db('p2'), `${Q}/p3/k2`), atk('host')), 'cannot forge the sender');
  await assertFails(set(ref(db('p2'), `${Q}/p2/k3`), atk('p2')), 'not at yourself');
  await assertFails(set(ref(db('p2'), `${Q}/p3/k4`), atk('p2', { n: 99 })), 'at most 30 rows');
  await assertFails(set(ref(db('p2'), `${Q}/p3/k5`), atk('p2', { g: 10 })), 'gap column 0-9');
  await assertFails(set(ref(db('outsider'), `${Q}/p3/k6`), atk('outsider')));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/out/p2`), { at: now(), place: 3, rem: 2 }));
  await assertFails(set(ref(db('p2'), `${Q}/p3/k7`), atk('p2')), 'knocked out players can\'t attack');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/settings/mode`), 'rush'));
  await assertFails(set(ref(db('p3'), `${Q}/host/k8`), atk('p3')), 'no attacks in Score Rush');
});

test('prism call the winner: once, only when out, within the window, a live player', async () => {
  await seed(prismRoom({ out: { p2: { at: now() - 2000, place: 3, rem: 2 } } }));
  const C = `${R}/prismcall/m1`;
  await assertFails(set(ref(db('p3'), `${C}/p3`), { w: 'host', at: serverTimestamp() }), 'still alive: no call');
  await assertFails(set(ref(db('p2'), `${C}/p2`), { w: 'p2', at: serverTimestamp() }), 'not yourself');
  await assertSucceeds(set(ref(db('p2'), `${C}/p2`), { w: 'host', at: serverTimestamp() }));
  await assertFails(set(ref(db('p2'), `${C}/p2`), { w: 'p3', at: serverTimestamp() }), 'locked once made');
  // too late
  await seed(prismRoom({ out: { p2: { at: now() - 20_000, place: 3, rem: 2 } } }));
  await assertFails(set(ref(db('p2'), `${C}/p2`), { w: 'host', at: serverTimestamp() }), 'after the 10 s window');
  // can't pick someone already out
  await seed(prismRoom({ out: { p2: { at: now() - 1000, place: 3, rem: 2 }, p3: { at: now() - 500, place: 2, rem: 1 } } }));
  await assertFails(set(ref(db('p2'), `${C}/p2`), { w: 'p3', at: serverTimestamp() }), 'pick a player still in');
});

test('prism room playlist: host only', async () => {
  await seed(prismRoom());
  await assertSucceeds(update(ref(db('host'), `${R}/meta`), { prism: { seed: 'abc123', n: 2 } }));
  await assertFails(update(ref(db('p2'), `${R}/meta`), { prism: { seed: 'mine', n: 0 } }));
  await assertFails(update(ref(db('host'), `${R}/meta`), { prism: { seed: 'abc', n: 2, x: 1 } }), 'no extra fields');
});

// ---------------------------------------------------------------- SLIPSTREAM
function slipRoom(game = {}) {
  const r = prismRoom();
  r.rooms[CODE].game = { id: 'slip', matchId: 'm1', phase: 'play', settings: { lives: 2 }, participants: { host: true, p2: true, p3: true }, ...game };
  return r;
}
const snode = (extra = {}) => ({ st: 'ride', t: 12.5, x: 210.4, y: -3.2, a: 0.31, g: 1, v: 18.2, n: 1, l: 2, i: 0, c: 3, rd: 'bw', d: 210, bc: 4, fl: 9, ln: 10, cl: 9, bi: 1, rg: 2, ...extra });

test('slip riders: own node while riding; fields checked; out needs a time and is final', async () => {
  await seed(slipRoom());
  const N = `${R}/slip/m1`;
  await assertSucceeds(set(ref(db('p2'), `${N}/p2`), snode()));
  await assertSucceeds(update(ref(db('p2'), `${N}/p2`), { st: 'rewind', x: 205, l: 1 }), 'partial updates');
  await assertFails(set(ref(db('p2'), `${N}/p3`), snode()), 'not someone else\'s rider');
  await assertFails(set(ref(db('outsider'), `${N}/outsider`), snode()), 'not a participant');
  await assertFails(set(ref(db('p2'), `${N}/p2`), snode({ l: 7 })), 'lives 0-3');
  await assertFails(set(ref(db('p2'), `${N}/p2`), snode({ g: 0 })), 'gravity ±1');
  await assertFails(set(ref(db('p2'), `${N}/p2`), snode({ rd: 'xx' })), 'ride code');
  await assertFails(set(ref(db('p2'), `${N}/p2`), snode({ hack: 1 })), 'no extra fields');
  await assertFails(update(ref(db('p2'), `${N}/p2`), { st: 'out' }), 'out needs a time');
  await assertSucceeds(update(ref(db('p2'), `${N}/p2`), { st: 'out', at: serverTimestamp(), l: 0, d: 400 }));
  await assertFails(update(ref(db('p2'), `${N}/p2`), { st: 'ride', l: 2 }), 'out is final');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'final'));
  await assertFails(set(ref(db('p3'), `${N}/p3`), snode()), 'not after the match');
});

test('slip call the winner: once, only when out, within the window, a live rider', async () => {
  await seed(slipRoom({ out: { p2: { at: now() - 2000, place: 3, rem: 2 } } }));
  const C = `${R}/slipcall/m1`;
  await assertFails(set(ref(db('p3'), `${C}/p3`), { w: 'host', at: serverTimestamp() }), 'still riding: no call');
  await assertSucceeds(set(ref(db('p2'), `${C}/p2`), { w: 'host', at: serverTimestamp() }));
  await assertFails(set(ref(db('p2'), `${C}/p2`), { w: 'p3', at: serverTimestamp() }), 'locked once made');
  await seed(slipRoom({ out: { p2: { at: now() - 20_000, place: 3, rem: 2 } } }));
  await assertFails(set(ref(db('p2'), `${C}/p2`), { w: 'host', at: serverTimestamp() }), 'after the window');
  await assertFails(set(ref(db('p2'), `${R}/prismcall/m1/p2`), { w: 'host', at: serverTimestamp() }), 'prism calls are for prism');
});

test('slip room playlist: host only', async () => {
  await seed(slipRoom());
  await assertSucceeds(update(ref(db('host'), `${R}/meta`), { slip: { seed: 'abc123', n: 4 } }));
  await assertFails(update(ref(db('p2'), `${R}/meta`), { slip: { seed: 'mine', n: 0 } }));
});

// ---------------------------------------------------------------- GRIDLOCK
function glRoom(game = {}) {
  const r = prismRoom();
  r.rooms[CODE].game = { id: 'gridlock', matchId: 'm1', phase: 'place', rk: '0', size: 8, settings: { mode: 'royale' }, participants: { host: true, p2: true, p3: true }, ...game };
  return r;
}

test('gridlock fleets are private: only the owner (and the host) can read; owner writes while placing, host only fills a gap', async () => {
  await seed(glRoom());
  const F = `fleets/${CODE}/m1`;
  const fleet = { s: '0,0,4,0;2,0,3,1;5,5,3,0;7,0,2,0', at: serverTimestamp() };
  await assertSucceeds(set(ref(db('p2'), `${F}/p2`), fleet));
  await assertFails(set(ref(db('p2'), `${F}/p3`), fleet), 'not someone else\'s fleet');
  await assertFails(set(ref(db('p2'), `${F}/p2`), { s: 'bad', at: serverTimestamp() }), 'shape checked');
  await assertFails(set(ref(db('p2'), `${F}/p2`), { s: '0,0,4,0;2,0,3,1;5,5,3,0;7,0,2,0', at: serverTimestamp(), extra: 1 }), 'no extra fields');
  await assertSucceeds(get(ref(db('p2'), `${F}/p2`)), 'owner reads own fleet');
  await assertFails(get(ref(db('p3'), `${F}/p2`)), 'another player can\'t read it');
  await assertSucceeds(get(ref(db('host'), `${F}/p2`)), 'the host can (to resolve shots for an absent owner)');
  await assertSucceeds(get(ref(db('host'), F)), 'the host reads them all at once');
  await assertFails(get(ref(db('p2'), F)), 'nobody else reads them all');
  await assertFails(set(ref(db('host'), `${F}/p2`), fleet), 'the host can\'t overwrite a fleet that exists');
  await assertSucceeds(set(ref(db('host'), `${F}/p3`), fleet), 'the host fills in a missing one (auto-place)');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'aim'));
  await assertFails(set(ref(db('p2'), `${F}/p2`), fleet), 'no re-placing once the match is under way');
  await assertSucceeds(remove(ref(db('host'), `fleets/${CODE}`)), 'the host wipes fleets for a new match');
});

test('gridlock shots: your turn only (Classic); everyone alive while aiming (Royale), once, at a living opponent', async () => {
  await seed(glRoom({ phase: 'turn', rk: '3', cur: 'p2', settings: { mode: 'classic' } }));
  const S = `${R}/glshot/m1/3`;
  await assertFails(set(ref(db('p3'), `${S}/p3`), { t: 'p2', r: 1, c: 1, at: serverTimestamp() }), 'not your turn');
  await assertFails(set(ref(db('p2'), `${S}/p2`), { t: 'p2', r: 1, c: 1, at: serverTimestamp() }), 'not yourself');
  await assertFails(set(ref(db('p2'), `${R}/glshot/m1/2/p2`), { t: 'p3', r: 1, c: 1, at: serverTimestamp() }), 'wrong volley');
  await assertSucceeds(set(ref(db('p2'), `${S}/p2`), { t: 'p3', r: 1, c: 1, at: serverTimestamp() }));
  await assertFails(set(ref(db('p2'), `${S}/p2`), { t: 'p3', r: 2, c: 2, at: serverTimestamp() }), 'one shot');
  await seed(glRoom({ phase: 'aim', rk: '4', out: { p3: { at: 1, place: 3, rem: 2 } } }));
  const A = `${R}/glshot/m1/4`;
  await assertSucceeds(set(ref(db('p2'), `${A}/p2`), { t: 'host', x: 'abcdef==', at: serverTimestamp() }), 'an obfuscated aim');
  await assertFails(set(ref(db('host'), `${A}/host`), { t: 'p3', x: 'abcdef==', at: serverTimestamp() }), 'not at an eliminated player');
  await assertFails(set(ref(db('p3'), `${A}/p3`), { t: 'host', x: 'abcdef==', at: serverTimestamp() }), 'eliminated players don\'t fire');
});

test('gridlock Part 2: the simultaneous lock-in (ts + x, a card only in Arcade), sonar answers private to the shooter, a relocate rewrites your fleet only with the card in hand', async () => {
  await seed(glRoom({ phase: 'aim', rk: '4', mode: 'salvo', settings: { mode: 'salvo' } }));
  const A = `${R}/glshot/m1/4`;
  await assertSucceeds(set(ref(db('p2'), `${A}/p2`), { ts: { host: true, p3: true }, x: 'abcdef==', at: serverTimestamp() }), 'a Salvo lock-in: who, never where');
  await assertFails(set(ref(db('p3'), `${A}/p3`), { ts: { p3: true }, x: 'abcdef==', at: serverTimestamp() }), 'not yourself');
  await assertFails(set(ref(db('host'), `${A}/host`), { ts: { p2: true }, x: 'abcdef==', a: 'torpedo', at: serverTimestamp() }), 'no cards outside Arcade');
  await assertFails(set(ref(db('host'), `${A}/host`), { ts: { p2: true }, at: serverTimestamp() }), 'the payload is required');
  await seed(glRoom({ phase: 'aim', rk: '4', mode: 'arcade', settings: { mode: 'arcade' }, hand: { host: ['sonar', 'relocate'], p2: ['shield'], p3: ['double'] } }));
  await assertSucceeds(set(ref(db('host'), `${A}/host`), { ts: { p2: true }, x: 'abcdef==', a: 'sonar', at: serverTimestamp() }), 'a sonar lock-in');
  await assertSucceeds(set(ref(db('p2'), `${A}/p2`), { x: 'abcdef==', a: 'shield', at: serverTimestamp() }), 'a shield targets nobody');
  await assertFails(set(ref(db('p3'), `${A}/p3`), { ts: { p2: true }, x: 'abcdef==', a: 'nuke', at: serverTimestamp() }), 'unknown card');
  // a relocate: the owner rewrites the fleet while aiming, only with the card and before locking in
  const F = `fleets/${CODE}/m1`;
  const fleet = { s: '0,0,4,0;2,0,3,1;5,5,3,0;7,0,2,0', at: serverTimestamp() };
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${F}/host`), fleet));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${F}/p2`), fleet));
  await assertFails(set(ref(db('host'), `${F}/host`), { s: '1,0,4,0;2,0,3,1;5,5,3,0;7,0,2,0', at: serverTimestamp() }), 'already locked in this volley');
  await assertFails(set(ref(db('p2'), `${F}/p2`), { s: '1,0,4,0;2,0,3,1;5,5,3,0;7,0,2,0', at: serverTimestamp() }), 'no relocate card');
  await env.withSecurityRulesDisabled(ctx => remove(ref(ctx.database(), `${A}/host`)));
  await assertSucceeds(set(ref(db('host'), `${F}/host`), { s: '1,0,4,0;2,0,3,1;5,5,3,0;7,0,2,0', at: serverTimestamp() }), 'relocate in hand, not locked in yet');
  // sonar answers: written by the scanned player (or the host) while resolving, readable by the shooter alone
  await seed(glRoom({ phase: 'resolve', rk: '4', mode: 'arcade', settings: { mode: 'arcade' }, acts: { host: { a: 'sonar', t: 'p2', r: 1, c: 1 } }, fire: { p3: [{ t: 'p2', r: 0, c: 0 }] } }));
  const S = `glsonar/${CODE}/m1/host/4`;
  await assertFails(set(ref(db('p3'), S), { n: 2, at: serverTimestamp() }), 'a bystander can\'t answer');
  await assertSucceeds(set(ref(db('p2'), S), { n: 2, at: serverTimestamp() }), 'the scanned player answers');
  await assertFails(set(ref(db('p2'), S), { n: 3, at: serverTimestamp() }), 'once');
  await assertSucceeds(get(ref(db('host'), S)), 'the shooter reads it');
  await assertFails(get(ref(db('p2'), S)), 'nobody else does');
  await assertFails(get(ref(db('p3'), `glsonar/${CODE}/m1/host`)), 'not even the whole branch');
});

test('gridlock resolutions: the target or the host, once, while resolving; calls as in PRISM DROP', async () => {
  await seed(glRoom({ phase: 'resolve', rk: '4', fire: { p2: [{ t: 'host', r: 1, c: 1 }] } }));
  const X = `${R}/glres/m1/4`;
  const res = { r: { p2: [{ h: 1, s: 0 }] }, k: { 0: '1,1,2,0' }, at: serverTimestamp() };
  await assertFails(set(ref(db('p3'), `${X}/host`), res), 'a bystander can\'t resolve someone\'s board');
  await assertSucceeds(set(ref(db('host'), `${X}/host`), res), 'the owner resolves their own board');
  await assertFails(set(ref(db('host'), `${X}/host`), res), 'once');
  await assertSucceeds(set(ref(db('host'), `${X}/p2`), { ...res, by: 'host' }), 'the host resolves for an absent owner');
  await assertFails(set(ref(db('p2'), `${X}/p3`), res), 'p2 is not the host');
  await seed(glRoom({ phase: 'show', rk: '4', out: { p3: { at: now() - 2000, place: 3, rem: 2 } } }));
  await assertSucceeds(set(ref(db('p3'), `${R}/glcall/m1/p3`), { w: 'host', at: serverTimestamp() }));
  await assertFails(set(ref(db('p2'), `${R}/glcall/m1/p2`), { w: 'host', at: serverTimestamp() }), 'still in: no call');
});

test('CITY 2.0 preview panel: city2/live is read by signed-in visitors, written by the server only', async () => {
  const live = { v: 1, kind: 'preview', state: { force: ['banner'], text: 'HI' }, params: { force: 'banner', text: 'HI' }, label: 'BANNER PLANE “HI”', startAt: now(), until: now() + 1800000, by: 'pmike0000000' };
  await seed({ city2: { live } });
  await assertSucceeds(get(ref(db('anyone'), 'city2/live')));
  await assertFails(get(ref(db(null), 'city2/live')), 'not without signing in');
  await assertFails(get(ref(db('anyone'), 'city2')), 'only the live node is readable');
  for (const [path, v] of [['city2/live', { ...live, state: { force: ['drones'], text: 'PWNED' } }], ['city2/live/state/text', 'PWNED'], ['city2/live/until', now() + 9e9], ['city2/live', null], ['city2/other', 1]]) {
    await assertFails(set(ref(db('anyone'), path), v), path);
  }
  await assertFails(remove(ref(db('anyone'), 'city2/live')));
});

test('profiles + boards: public profiles, private stats and keys, nothing a client can write', async () => {
  await seed({
    ...lobbyRoom(),
    profiles: { pmike0000000: { n: 'Mike', nk: 'mike', t: '4821', a: 'bolt', c: 'cyan', x: 300, r: 1, at: 1 } },
    uids: { host: 'pmike0000000' },
    pstats: { pmike0000000: { xp: 300, g: { cipher: { p: 3, w: 1 } } } },
    ppriv: { pmike0000000: { kh: 'abc', nameAt: 0 } },
    pkeys: { abc: 'pmike0000000' },
    tags: { mike: { 4821: 'pmike0000000' } },
    lb: { 'cipher-wins': { all: { pmike0000000: 1 } } },
    results: { ABCD_m1: { st: 'done' } },
    audit: { a1: { act: 'hide' } },
  });
  // public: names, tags, emblems (the lobby and chat show them)
  await assertSucceeds(get(ref(db('p2'), 'profiles/pmike0000000')));
  // BNAME: one profile at a time, signed in; never the whole list (a dump of every typed name), never signed out
  await assertFails(get(ref(db(null), 'profiles/pmike0000000')), 'not without signing in');
  await assertFails(get(ref(db('p2'), 'profiles')), 'never the whole list');
  await assertFails(get(ref(db(null), 'profiles')), 'never the whole list, signed out');
  // private: the device link and the stats are the owner's; keys, tags, private fields, results and the audit log nobody's
  await assertSucceeds(get(ref(db('host'), 'uids/host')));
  await assertFails(get(ref(db('p2'), 'uids/host')));
  await assertSucceeds(get(ref(db('host'), 'pstats/pmike0000000')), 'the owner reads their stats');
  await assertFails(get(ref(db('p2'), 'pstats/pmike0000000')), 'nobody else does');
  for (const path of ['flags', 'ppriv/pmike0000000', 'pkeys', 'pkeys/abc', 'tags/mike', 'lb', 'lb/cipher-wins/all', 'results/ABCD_m1', 'audit', 'rl']) {
    await assertFails(get(ref(db('host'), path)), `read ${path}`);
  }
  // server-write only: no client writes a profile, stats, XP, rank, board entry or link
  const writes = [
    ['profiles/pmike0000000/x', 99999], ['profiles/pmike0000000/r', 4], ['profiles/pmike0000000/n', 'Mikey'], ['profiles/pnew00000000', { n: 'X', t: '1111' }],
    ['uids/host', 'pother000000'], ['uids/p2', 'pmike0000000'], ['pstats/pmike0000000/xp', 1e9], ['pstats/pmike0000000/g/cipher/w', 50],
    ['lb/cipher-wins/all/pmike0000000', 999], ['lb/slip-dist/all/pmike0000000', 1e7], ['pkeys/zzz', 'pmike0000000'], ['ppriv/pmike0000000/opt', true],
    ['tags/mike/1234', 'pmike0000000'], ['results/ABCD_m2', { st: 'done' }], ['audit/x', { act: 'x' }],
  ];
  for (const [path, v] of writes) await assertFails(set(ref(db('host'), path), v), `write ${path}`);
  // a room player node may carry the player's OWN profile id, and nobody else's
  await assertSucceeds(set(ref(db('host'), `${R}/players/host`), { ...player('HOST'), pid: 'pmike0000000' }));
  await assertFails(set(ref(db('p2'), `${R}/players/p2`), { ...player('TWO'), pid: 'pmike0000000' }), 'claiming someone else\'s profile');
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2`), player('TWO')), 'no profile id is fine (the server may be down)');
});

test('HIGH STAKES: bets and answers are hidden until the showdown, once each, in their phase', async () => {
  const base = lobbyRoom();
  base.rooms[CODE].players.p3 = { name: 'THREE', color: 'cyan', avatar: 'bolt', joinedAt: 3 };
  base.rooms[CODE].presence.p3 = { online: true, lastSeen: now() };
  base.rooms[CODE].meta.status = 'playing';
  const room = phase => { const r = structuredClone(base); r.rooms[CODE].game = { id: 'stakes', matchId: 'm1', round: 2, rk: '2', phase, participants: { host: true, p2: true, p3: true } }; return r; };
  const B = `hsbet/${CODE}/m1/2`;
  const LK = `${R}/hslock/m1/2`;
  await seed(room('bet'));
  await assertFails(set(ref(db('p2'), `${LK}/p2/b`), serverTimestamp()), 'no lock without the hidden bet behind it');
  await assertSucceeds(set(ref(db('p2'), `${B}/p2/b`), { b: 250, at: serverTimestamp() }), 'a bet, privately');
  await assertFails(set(ref(db('p2'), `${B}/p2/b`), { b: 999, at: serverTimestamp() }), 'once');
  await assertFails(set(ref(db('p3'), `${B}/p2/b`), { b: 1, at: serverTimestamp() }), 'not for someone else');
  await assertFails(set(ref(db('p2'), `${B}/p2/a`), { a: 1, at: serverTimestamp() }), 'no answer while betting');
  await assertSucceeds(set(ref(db('p2'), `${LK}/p2/b`), serverTimestamp()), 'the public lock flag (no amount)');
  await assertFails(set(ref(db('p2'), `${LK}/p2/b`), 250), 'a lock flag carries no amount');
  await assertSucceeds(get(ref(db('p2'), `${B}/p2`)), 'the owner reads their bet');
  await assertFails(get(ref(db('p3'), `${B}/p2`)), 'another player can\'t');
  await assertFails(get(ref(db('host'), B)), 'nor the host, before the showdown');
  await assertFails(get(ref(db('p3'), `${R}/game`)).then(() => get(ref(db('p3'), `hsbet/${CODE}`))), 'nobody reads the whole node');
  await seed(room('q'));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${B}/p2/b`), { b: 250, at: 1 }));
  await assertFails(set(ref(db('p2'), `${B}/p2/a`), { a: 7, at: serverTimestamp() }), 'answers are 0–3');
  await assertSucceeds(set(ref(db('p2'), `${B}/p2/a`), { a: 2, at: serverTimestamp() }), 'an answer, privately');
  await assertFails(set(ref(db('p2'), `${B}/p2/a`), { a: 1, at: serverTimestamp() }), 'one tap locks it');
  await assertFails(set(ref(db('p3'), `${B}/p3/b`), { b: 100, at: serverTimestamp() }), 'too late to bet');
  await assertFails(get(ref(db('host'), B)), 'still hidden from the host while answering');
  await seed(room('show'));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${B}/p2`), { b: { b: 250, at: 1 }, a: { a: 2, at: 2 } }));
  await assertSucceeds(get(ref(db('host'), B)), 'the host reads the round to resolve the showdown');
  await assertFails(get(ref(db('p3'), `${B}/p2`)), 'players still can\'t (the results are published in the room)');
  await assertFails(set(ref(db('outsider'), `hsbet/${CODE}/m1/2/outsider/b`), { b: 1, at: serverTimestamp() }), 'not in the match');
});

test('RUMRUNNER: a day log is the owner\'s secret until night, written only during that day; the public flags carry no detail', async () => {
  const base = lobbyRoom();
  base.rooms[CODE].players.p3 = { name: 'THREE', color: 'cyan', avatar: 'bolt', joinedAt: 3 };
  base.rooms[CODE].presence.p3 = { online: true, lastSeen: now() };
  base.rooms[CODE].meta.status = 'playing';
  const room = (phase, day = 4) => { const r = structuredClone(base); r.rooms[CODE].game = { id: 'rum', matchId: 'm1', day, dk: String(day), phase, participants: { host: true, p2: true, p3: true } }; return r; };
  const L = `rrp/${CODE}/m1`;
  const PUB = `${R}/rrpub/m1/4`;
  const log = { ev: { 0: 'bribe' }, a: [['t', 'rum', 20], ['p', 500], ['x', 'p3']], dest: 'docks', at: serverTimestamp() };
  await seed(room('dawn'));
  await assertFails(set(ref(db('p2'), `${L}/p2/4`), log), 'nothing before the day starts');
  await seed(room('day'));
  await assertSucceeds(set(ref(db('p2'), `${L}/p2/4`), log), 'a day log, privately');
  await assertSucceeds(set(ref(db('p2'), `${L}/p2/4`), { ...log, a: [...log.a, ['s', 200]] }), 'rewritten as the day goes on');
  await assertFails(set(ref(db('p2'), `${L}/p2/5`), log), 'not tomorrow\'s');
  await assertFails(set(ref(db('p2'), `${L}/p2/3`), log), 'not yesterday\'s');
  await assertFails(set(ref(db('p3'), `${L}/p2/4`), log), 'not for someone else');
  await assertFails(set(ref(db('p2'), `${L}/p2/4`), { ...log, cash: 1e9 }), 'no made-up fields');
  await assertFails(set(ref(db('p2'), `${L}/p2/4`), { ...log, at: 5 }), 'stamped by the server');
  await assertFails(set(ref(db('outsider'), `${L}/outsider/4`), log), 'not in the match');
  await assertSucceeds(get(ref(db('p2'), `${L}/p2`)), 'the owner reads their own logs (rejoin)');
  await assertFails(get(ref(db('p3'), `${L}/p2`)), 'another player can\'t');
  await assertFails(get(ref(db('host'), L)), 'nor the host, during the day');
  await assertFails(get(ref(db('host'), `${L}/p2/4`)), 'not even one log');
  await assertSucceeds(update(ref(db('p2'), `${PUB}/p2`), { nw: 100 }), 'the net worth alone, as the day goes on');
  await assertSucceeds(set(ref(db('p2'), `${PUB}/p2`), { nw: 12345, done: serverTimestamp() }), 'DONE + the net worth, publicly');
  await assertSucceeds(update(ref(db('p2'), `${PUB}/p2`), { nw: 200 }), 'a later net worth keeps the DONE flag');
  await assertSucceeds(get(ref(db('p3'), `${PUB}/p2/done`)).then(s => { if (!s.exists()) throw new Error('DONE erased'); }), 'DONE is still there');
  const SEC = `rrsec/${CODE}/m1`;
  await assertFails(set(ref(db('p2'), SEC), 'shh'), 'only the host seeds the city');
  await assertSucceeds(set(ref(db('host'), SEC), 'shh'), 'the host writes the city secret once');
  await assertFails(set(ref(db('host'), SEC), 'other'), 'once');
  await assertFails(get(ref(db('p2'), SEC)), 'players never read it');
  await assertSucceeds(get(ref(db('host'), SEC)), 'the host (or a new host) reads it');
  await assertFails(set(ref(db('p2'), `${PUB}/p2`), { nw: 12345, done: serverTimestamp(), dest: 'docks' }), 'the flag never carries the destination');
  await assertFails(set(ref(db('p3'), `${PUB}/p2`), { nw: 1, done: serverTimestamp() }), 'own flag only');
  await assertSucceeds(get(ref(db('p3'), PUB)), 'everyone sees who is done');
  await seed(room('night'));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${L}/p2/4`), { ...log, at: 1 }));
  await assertFails(set(ref(db('p2'), `${L}/p2/4`), log), 'too late to change the day');
  await assertSucceeds(get(ref(db('host'), L)), 'at night the host reads every log to write tomorrow');
  await assertFails(get(ref(db('p3'), `${L}/p2`)), 'players still can\'t');
  await seed(room('final', 20));
  await assertSucceeds(get(ref(db('host'), L)), 'and after the match, for the books');
  await assertFails(set(ref(db('p2'), `${L}/p2/20`), log), 'no writing after the match');
});
