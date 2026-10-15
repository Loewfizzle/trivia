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

test('stale-room cleanup: query + delete only rooms idle > 6h', async () => {
  const old = now() - 7 * 3600_000;
  await seed({
    rooms: {
      OLDD: { meta: { hostId: 'x', status: 'lobby', createdAt: old, activeAt: old } },
      NEWW: { meta: { hostId: 'x', status: 'lobby', createdAt: now(), activeAt: now() } },
      ORPH: { presence: { ghost: { online: false, lastSeen: 1 } } },
    },
  });
  const me = db('cleaner');
  const cutoff = now() - 6 * 3600_000 - 60_000;
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
  await assertSucceeds(set(ref(db('p2'), `${R}/oc/m3/2/p2`), prog(4, 4, true)));
  await assertFails(set(ref(db('p2'), `${R}/oc/m3/2/p2`), prog(4, 4, true)), 'finished boards are locked');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'standings'));
  await assertFails(set(ref(db('host'), `${R}/oc/m3/2/host`), prog(1, 1, false)), 'challenge closed');
  await assertSucceeds(update(ref(db('host'), R), { oc: null }));
});
