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

// CITY CONTROLS A — THE RADIO: a room's moments are the SERVER's (api/_lib/radio.js) — its phones read them on the room's socket, nobody
// writes them (not even the host); the queue, the record, the crew, the dial, the hello count: server only (no client read or write)
test('THE RADIO: rooms/{CODE}/radio + radioCrew readable by the room, written by nobody; radio/, city2/showcase, here/ server only', async () => {
  await seed({ ...lobbyRoom(), radio: { q: { m1: { jack: 'ufo' } }, crew: { p1: true } }, city2: { showcase: 'high' }, here: { host: 1 } });
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/radio/m1`), { jack: 'ufo', at: 1, until: 2 }));
  await assertSucceeds(get(ref(db('p2'), `${R}/radio`)));
  for (const u of ['host', 'p2', 'stranger']) {
    await assertFails(set(ref(db(u), `${R}/radio/m2`), { jack: 'tr3b', at: 1, until: 2 }), `${u} writes a room moment`);
    await assertFails(update(ref(db(u), `${R}/radio/m1`), { until: 9e12 }), `${u} edits a room moment`);
    await assertFails(set(ref(db(u), 'radio/q/m9'), { jack: 'ufo' }), `${u} queues a moment`);
    await assertFails(get(ref(db(u), 'radio/q')), `${u} reads the queue`);
    await assertFails(set(ref(db(u), `radio/crew/${u}`), true), `${u} joins the crew`);
    await assertFails(set(ref(db(u), 'city2/showcase'), 'low'), `${u} turns the dial`);
    await assertFails(get(ref(db(u), 'city2/showcase')), `${u} reads the dial by socket (the cached GET carries it)`);
    await assertFails(set(ref(db(u), `here/${u}`), 1), `${u} writes the hello count`);
    // CC-B — THE CREW's lobby node, THE INTERCOM's clips, PRESETS, the push: the server's only
    await assertFails(set(ref(db(u), `${R}/radioCrew/hand`), { uid: u, host: 'host' }), `${u} hands themself the lobby's radio`);
    await assertFails(set(ref(db(u), `${R}/radioCrew/ask`), { uid: u, at: 1 }), `${u} writes an ask`);
    // THE VAULT 1A — THE CARD LAB's marks + their history: the server's only (api/_lib/lab.js)
    for (const n of ['vault/lab', 'vault/labLog']) { await assertFails(get(ref(db(u), n)), `${u} reads ${n}`); await assertFails(set(ref(db(u), `${n}/card-smoke`), { m: 'approve' }), `${u} writes ${n}`); }
    for (const n of ['radio/ic', 'radio/clips', 'radio/presets', 'radio/push/subs']) { await assertFails(get(ref(db(u), n)), `${u} reads ${n}`); await assertFails(set(ref(db(u), `${n}/x1`), { a: 1 }), `${u} writes ${n}`); }
  }
});

// FR6 FIXES A (FR6 C(3)): the server-only nodes with no case of their own — flags/ (THE BOARD's reports), rl/ (the rate limits), results/
// (the exactly-once keys), errlog/ + phonelog/ (the phones' errors + reports), gplay/, wx/ — readable + writable by NOBODY from a client
test('the server-only nodes flags/ rl/ results/ errlog/ phonelog/ gplay/ wx/ — read + written by nobody', async () => {
  await seed({ flags: { f1: { n: 1 } }, rl: { b1: { n: 1, t: 1 } }, results: { k1: true }, errlog: { e1: { m: 'x' } }, phonelog: { p1: { text: 'x' } }, gplay: { g1: 1 }, wx: { w1: 1 } });
  const one = { flags: 'f1', rl: 'b1', results: 'k1', errlog: 'e1', phonelog: 'p1', gplay: 'g1', wx: 'w1' };
  for (const u of ['anyone', null]) for (const node of Object.keys(one)) {
    await assertFails(get(ref(db(u), node)), `${u || 'signed out'} reads ${node}/`);
    await assertFails(get(ref(db(u), `${node}/${one[node]}`)), `${u || 'signed out'} reads one ${node} entry`);
    await assertFails(set(ref(db(u), `${node}/mine`), { n: 0, t: 0 }), `${u || 'signed out'} writes ${node}/`);
  }
});

// THE VAULT 2B — MEMBER NUMBERS + THE DEV CARDS: profiles/{pid}/mn + members/ (the counter) are the SERVER's; nobody sets or changes a
// member number (not their own), nobody reads the counter; a dev card can't be written into anyone's stats
test('THE VAULT 2B: a member number + the counter + the dev cards — written by nobody, the counter read by nobody', async () => {
  await seed({ uids: { me: 'pme' }, profiles: { pme: { n: 'ME', mn: 7 } }, pstats: { pme: { it: {} } }, members: { next: 8, filled: 1 } });
  for (const [path, v] of [['profiles/pme/mn', 1], ['profiles/pme/mn', null], ['profiles/pother/mn', 2], ['members/next', 2], ['members/filled', null], ['members/claim', 1],
    ['pstats/pme/it/card-dev-switchboard', 1], ['pstats/pme/it/card-dev-source', 1], ['profiles/pme/cd', 'card-dev-source']]) {
    await assertFails(set(ref(db('me'), path), v), `the player writes ${path}`);
    await assertFails(set(ref(db('stranger'), path), v), `a stranger writes ${path}`);
  }
  await assertFails(get(ref(db('me'), 'members')), 'the counter is the server only');
  await assertSucceeds(get(ref(db('stranger'), 'profiles/pme')));   // (a profile is readable one at a time — its № with it, like its tag)
});

// PROGRESSION A: XP, levels, the streak, the items, the achievements, the owners' counts, the FOUNDER switch, the dailies, the outage —
// the SERVER's only (a client can't write any of it, not even its own); its own pstats readable by the owner (the profile reads it via /api)
test('PROGRESSION A: pstats (xp · it · ac · st · pa · dl · fv), pcount, progress/founder, dly/, streak/outage — written by nobody', async () => {
  await seed({ uids: { me: 'pme' }, pstats: { pme: { xp: 10, it: { 'card-gilded': 1 }, ac: { 'first-round': 1 }, st: { n: 1, d: 'd20261102' } } }, profiles: { pme: { n: 'ME', x: 10, l: 1 } },
    pcount: { n: 1, i: { 'card-gilded': 1 } }, progress: { founder: { open: false } }, dly: { test: { d20261102: { n: 1, r: { pme: 900 } } } }, streak: { outage: { d20261101: { by: 'x' } } } });
  for (const [path, v] of [['pstats/pme/xp', 99999], ['pstats/pme/it/card-house', 1], ['pstats/pme/ac/kingpin', 1], ['pstats/pme/st', { n: 365, d: 'd20261102' }],
    ['pstats/pme/pa/kn', 1], ['pstats/pme/dl/n', 7], ['pstats/pme/fv', 9], ['profiles/pme/l', 100], ['profiles/pme/x', 45000], ['profiles/pme/s', 365], ['profiles/pme/cd', 'card-house'], ['profiles/pme/fd', true],
    ['pcount/i/card-house', 1], ['pcount/n', 0], ['progress/founder', null], ['dly/test/d20261102/r/pme', 1000], ['dly/test/d20261102/h/100', 50], ['streak/outage/d20261102', { by: 'me' }]]) {
    await assertFails(set(ref(db('me'), path), v), `the player writes ${path}`);
    await assertFails(set(ref(db('stranger'), path), v), `a stranger writes ${path}`);
  }
  await assertSucceeds(get(ref(db('me'), 'pstats/pme')));
  await assertFails(get(ref(db('stranger'), 'pstats/pme')), 'a stranger reads someone\'s stats');
  for (const n of ['pcount', 'progress/founder', 'dly/test', 'streak/outage']) await assertFails(get(ref(db('me'), n)), `a client reads ${n} by socket (/api answers)`);
});

// FRIENDS A: pfr/{pid} (friends, requests in + out, blocks, recently played with, waiting invites) — the SERVER writes it (/api); its owner
// may read it, another player never (not even a friend); the invite notifications' subscriptions (ppriv/{pid}/ps) server-only
test('FRIENDS A: pfr/{pid} — the owner reads their own, another player never; nobody writes it (not even their own)', async () => {
  await seed({ uids: { me: 'pme', pal: 'ppal' }, pfr: { pme: { f: { ppal: 1 }, in: { pxx: 1 }, b: { pzz: 1 }, rp: { ppal: 1 }, inv: { ppal: { r: 'ABCD', ca: 1, at: 1, until: 2 } } }, ppal: { f: { pme: 1 } } },
    ppriv: { pme: { ps: { k: { endpoint: 'https://fcm.googleapis.com/x' } } } } });
  await assertSucceeds(get(ref(db('me'), 'pfr/pme')));
  await assertFails(get(ref(db('pal'), 'pfr/pme')), 'a friend reads my list');
  await assertFails(get(ref(db('stranger'), 'pfr/pme')), 'a stranger reads my list');
  await assertFails(get(ref(db(null), 'pfr/pme')), 'signed out');
  await assertFails(get(ref(db('me'), 'pfr')), 'the whole node');
  await assertFails(get(ref(db('me'), 'ppriv/pme/ps')), 'the subscriptions are server-only');
  for (const [who, path, v] of [['me', 'pfr/pme/f/pnew', 1], ['me', 'pfr/ppal/f/pme', null], ['pal', 'pfr/pme/in/ppal', 1], ['me', 'pfr/pme/b/pzz', null], ['me', 'pfr/pme/inv/ppal', null],
    ['stranger', 'pfr/pme', null], ['me', 'ppriv/pme/ps/k2', { endpoint: 'x' }]]) {
    await assertFails(set(ref(db(who), path), v), `${who} writes ${path}`);
  }
});

// FRIENDS B: PASSKEYS — pkc/{pid} (the public keys + counters), pkx/{h} (credential → profile), pkch/{uid} (the one-time challenges) and
// ppriv/{pid}/wh (the WebAuthn user handle) — the SERVER only: no rule names them, the root's deny keeps every phone out (even the owner's,
// even their own device's challenge) — a phone that could write pkx could point a passkey at any card
test('FRIENDS B: PASSKEYS — pkc / pkx / pkch / ppriv wh: read + written by nobody (not even their owner)', async () => {
  await seed({ uids: { me: 'pme' }, pkc: { pme: { h1: { id: 'abc', pk: 'xyz', c: 0, rp: 'localhost', n: 'iPhone', at: 1 } } }, pkx: { h1: 'pme' },
    pkch: { me: { a: { c: 'ch', rp: 'localhost', o: 'http://localhost:5173', x: 9e12 } } }, ppriv: { pme: { wh: 'handle' } } });
  for (const who of ['me', 'stranger', null]) {
    for (const p of ['pkc', 'pkc/pme', 'pkc/pme/h1', 'pkx', 'pkx/h1', 'pkch', 'pkch/me', 'pkch/me/a', 'ppriv/pme/wh']) {
      await assertFails(get(ref(db(who), p)), `${who || 'signed out'} reads ${p}`);
    }
    for (const [p, v] of [['pkc/pme/h2', { id: 'mine', pk: 'k', c: 0 }], ['pkc/pme/h1/c', 0], ['pkx/h9', 'pme'], ['pkx/h1', 'pstranger'], ['pkch/me/a', { c: 'mine', x: 9e12 }], ['ppriv/pme/wh', 'x']]) {
      await assertFails(set(ref(db(who), p), v), `${who || 'signed out'} writes ${p}`);
    }
  }
});

// PROGRESSION B: CITY SIGHTINGS (the counts, the appearances counted, the radio's once-a-day, the pairs), BIRTHDAYS (private), FAVORS, the
// radio's fired-moment record + a room's radio — the SERVER's only: a phone can't claim its own sighting, birthday or favor by socket
test('PROGRESSION B: sightings (pa.sg · sgt · it card-sg-*), ppriv sgk / sgr / bd / bdr, fv, radio/fired, rooms/{CODE}/radio — written by nobody', async () => {
  await seed({ uids: { me: 'pme' }, pstats: { pme: { xp: 10, pa: { sg: { ufo: 1 }, sgt: 1 }, it: { 'card-sg-ufo': 1 }, fv: 1 } }, ppriv: { pme: { bd: { m: 11, d: 3, at: 1 } } },
    rooms: { WISH: { meta: { hostId: 'me', status: 'lobby', createdAt: 1 }, players: { me: { name: 'ME', color: 'cyan', avatar: 'bolt', joinedAt: 1 } } } } });
  for (const [path, v] of [['pstats/pme/pa/sg/tr3b', 1], ['pstats/pme/pa/sgt', 99], ['pstats/pme/it/card-sg-btc', 1], ['pstats/pme/it/emb-sg-btc', 1], ['pstats/pme/fv', 5],
    ['ppriv/pme/sgk/ufo:x', 1], ['ppriv/pme/sgr/radio:2026-11-03', 1], ['ppriv/pme/bd', { m: 1, d: 1, at: 0 }], ['ppriv/pme/bdr/2026-11-03_WISH', 1],
    ['radio/fired/-Nxxxx', { jack: 'ufo', at: 1, role: 'owner', sight: true }], ['rooms/WISH/radio/-Nyyyy', { jack: 'skywrite', text: 'HI', at: 1, until: 2 }]]) {
    await assertFails(set(ref(db('me'), path), v), `the player writes ${path}`);
    await assertFails(set(ref(db('stranger'), path), v), `a stranger writes ${path}`);
  }
  for (const n of ['ppriv/pme', 'ppriv/pme/bd', 'radio/fired']) await assertFails(get(ref(db('me'), n)), `a client reads ${n} by socket (/api answers)`);
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

test('LOBBY 2.0 A — THE LINE: a player writes their own side of the door (L / R) once in, nothing else; never someone else’s', async () => {
  await seed(lobbyRoom());
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2/ln`), 'R'), 'their own line');
  await assertSucceeds(set(ref(db('host'), `${R}/players/host/ln`), 'L'));
  await assertFails(set(ref(db('p2'), `${R}/players/p2/ln`), 'X'), 'only L or R');
  await assertFails(set(ref(db('p2'), `${R}/players/p2/ln`), 1), 'a string');
  await assertFails(set(ref(db('p2'), `${R}/players/host/ln`), 'R'), 'never another player’s');
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2`), { ...player('TWO'), joinedAt: 2, ln: 'L' }), 'in the node itself too');
});

test('DFIX2 — THE MID-DAILY FLAG: a player writes only their OWN rooms/{CODE}/players/{uid}/dy, a boolean, nothing else (the host\'s line reads it live — no poll)', async () => {
  await seed(lobbyRoom());
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2/dy`), true), 'their own flag: a run held / open');
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2/dy`), null), 'cleared (resume / finish / the day turned)');
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2/dy`), false));
  await assertFails(set(ref(db('p2'), `${R}/players/p2/dy`), 1), 'a boolean, never a number');
  await assertFails(set(ref(db('p2'), `${R}/players/p2/dy`), 'coastclear'), 'never WHICH daily');
  await assertFails(set(ref(db('p2'), `${R}/players/host/dy`), true), 'never another player’s');
  await assertFails(set(ref(db('host'), `${R}/players/p2/dy`), true), 'not even the host’s hand');
  await assertFails(set(ref(db('p2'), `${R}/players/p2/dyx`), true), 'no other field');
});

test('LOBBY 2.0 B — THE GAME START + AFTER THE MATCH: meta/go + meta/back stamped by the host at the server\'s now; nobody else', async () => {
  await seed(lobbyRoom());
  await assertSucceeds(update(ref(db('host'), R), { 'meta/go': { at: serverTimestamp(), m: 'm1', g: 'overclock' }, 'meta/back': null, rv: null }), 'the start\'s stamp first (+ the walk-out + the votes cleared)');
  await assertFails(update(ref(db('host'), `${R}/meta`), { go: { at: 12345, m: 'm1', g: 'overclock' } }), 'only the server\'s now');
  await assertFails(update(ref(db('p2'), `${R}/meta`), { go: { at: serverTimestamp(), m: 'm1', g: 'overclock' } }), 'a guest never');
  await assertSucceeds(update(ref(db('host'), R), { 'meta/go': null, 'meta/back': { at: serverTimestamp(), m: 'm1', g: 'overclock', rm: true }, rv: null }), 'the match\'s end');
  await assertSucceeds(update(ref(db('host'), R), { 'meta/back/rm': false, rv: null }), 'the host picks another game: the ring back to PLAY');
  await assertFails(update(ref(db('host'), `${R}/meta/back`), { at: serverTimestamp(), m: 'm1', g: 'overclock', rm: true, x: 1 }), 'nothing else in it');
  await assertFails(update(ref(db('p2'), `${R}/meta/back`), { rm: false }), 'a guest never');
});

test('LOBBY 2.0 B — THE REMATCH VOTE: your own vote for the match just played, only while its REMATCH ring is up; the host clears them all', async () => {
  const r = lobbyRoom();
  r.rooms[CODE].meta.back = { at: now(), m: 'm1', g: 'overclock', rm: true };
  r.rooms[CODE].players.p3 = { name: 'THREE', color: 'yellow', avatar: 'star', joinedAt: 3 };
  await seed(r);
  await assertSucceeds(set(ref(db('p2'), `${R}/rv/p2`), 'm1'), 'a vote: the match just played');
  await assertSucceeds(remove(ref(db('p2'), `${R}/rv/p2`)), 'taken back');
  await assertFails(set(ref(db('p2'), `${R}/rv/p2`), 'm9'), 'never for another match');
  await assertFails(set(ref(db('p2'), `${R}/rv/p3`), 'm1'), 'never someone else\'s vote');
  await assertFails(set(ref(db('outsider'), `${R}/rv/outsider`), 'm1'), 'only a player in the room');
  await assertSucceeds(set(ref(db('p3'), `${R}/rv/p3`), 'm1'));
  await assertFails(set(ref(db('p2'), `${R}/rv`), null), 'a guest can\'t clear the others');
  await assertSucceeds(set(ref(db('host'), `${R}/rv`), null), 'the host clears every vote');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/meta/back/rm`), false));
  await assertFails(set(ref(db('p2'), `${R}/rv/p2`), 'm1'), 'no vote once the host picked another game');
  await env.withSecurityRulesDisabled(ctx => update(ref(ctx.database(), `${R}/meta`), { 'back/rm': true, status: 'playing' }));
  await assertFails(set(ref(db('p2'), `${R}/rv/p2`), 'm1'), 'no vote while a game runs');
});

test('LOCK THE DOOR: host only; new players are refused, players already in rejoin; kicked stay kicked', async () => {
  await seed(lobbyRoom({ kicked: { k1: true } }));
  await assertFails(update(ref(db('p2'), `${R}/meta`), { locked: true }), 'only the host locks');
  await assertFails(update(ref(db('host'), `${R}/meta`), { locked: 'yes' }), 'a boolean');
  await assertSucceeds(update(ref(db('host'), `${R}/meta`), { locked: true }));
  await assertFails(set(ref(db('p3'), `${R}/players/p3`), player('NEW')), 'a new player cannot join a locked room');
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2`), { ...player('TWO'), joinedAt: 2 }), 'a player already in rewrites their node (refresh / rejoin — joinedAt kept)');
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

// APP FIXES (Grok 5.1): ONE CHILD PER CONNECTION — c/{connId}, removed by its own socket's onDisconnect
test('presence: one child per connection — your own only; the old shape still accepted; no player row or kicked = no presence', async () => {
  await seed(lobbyRoom());
  await assertSucceeds(update(ref(db('p2'), `${R}/presence/p2`), { online: true, lastSeen: serverTimestamp(), 'c/k1abc': serverTimestamp() }));
  await assertSucceeds(update(ref(db('p2'), `${R}/presence/p2`), { 'c/k2def': serverTimestamp() }), 'a second tab / the refreshed page');
  await assertSucceeds(remove(ref(db('p2'), `${R}/presence/p2/c/k1abc`)), 'the old socket removes only its own child');
  assert.ok((await get(ref(db('p2'), `${R}/presence/p2/c/k2def`))).exists(), 'the new connection stays');
  await assertFails(update(ref(db('p2'), `${R}/presence/host`), { 'c/evil': serverTimestamp() }), 'never another player\'s');
  await assertFails(remove(ref(db('p2'), `${R}/presence/host/c/x`)), 'never remove another player\'s connection');
  await assertFails(update(ref(db('p2'), `${R}/presence/p2`), { 'c/k3': 'yes' }), 'a timestamp, not a string');
  await assertSucceeds(update(ref(db('p2'), `${R}/presence/p2`), { v: 2 }), 'the shape marker');
  await assertFails(update(ref(db('p2'), `${R}/presence/p2`), { v: 3 }), 'only v 2');
  await assertSucceeds(set(ref(db('p2'), `${R}/presence/p2`), { online: true, lastSeen: serverTimestamp() }), 'the old shape (older clients) still writes');
  await assertFails(set(ref(db('outsider'), `${R}/presence/outsider`), { online: true, lastSeen: serverTimestamp() }), 'no player row, no presence');
  await assertSucceeds(update(ref(db('host'), R), { 'kicked/p2': true, 'players/p2': null, 'presence/p2': null }));
  await assertFails(set(ref(db('p2'), `${R}/presence/p2`), { online: false, lastSeen: serverTimestamp() }), 'a kicked phone\'s late onDisconnect can\'t write it back');
});

test('joinedAt: written once at the server clock — a player can\'t rewrite it to sort first (host claims go in join order)', async () => {
  await seed(lobbyRoom());
  await assertFails(set(ref(db('p2'), `${R}/players/p2`), { name: 'TWO', color: 'magenta', avatar: 'eye', joinedAt: 0 }), 'rewrite to 0 refused');
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2`), { name: 'TWO!', color: 'magenta', avatar: 'eye', joinedAt: 2 }), 'a profile edit keeps it');
  await assertFails(set(ref(db('p3'), `${R}/players/p3`), { name: 'THREE', color: 'green', avatar: 'hex', joinedAt: 1 }), 'a new seat can\'t pick an old time');
  await assertSucceeds(set(ref(db('p3'), `${R}/players/p3`), player('THREE')), 'a new seat at server time');
});

test('a kick stops game writes: a kicked participant can\'t write their board', async () => {
  await seed(playingRoom('play'));
  const board = { g: ['abc='], p: ['01200'], solved: false, done: false, at: serverTimestamp() };
  await assertSucceeds(update(ref(db('host'), R), { 'kicked/p2': true, 'players/p2': null, 'presence/p2': null }));
  await assertFails(set(ref(db('p2'), `${R}/boards/m1/1/p2`), board), 'kicked (still in participants) — refused');
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

test('host migration: allowed when host offline > 10s (the client\'s HOST_TIMEOUT_MS); refused at 9 s', async () => {
  const early = lobbyRoom();
  early.rooms[CODE].presence.host = { online: false, lastSeen: now() - 9000 };
  await seed(early);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'), '9 s is under the client\'s 10 s');
  await env.clearDatabase();
  const room = lobbyRoom();
  room.rooms[CODE].presence.host = { online: false, lastSeen: now() - 11000 };
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
  const fresh = playingRoom();
  fresh.rooms[CODE].meta.hostBeat = now() - 9000;
  await seed(fresh);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'), 'a 9-s-old beat is not stale yet');
  await env.clearDatabase();
  const room = playingRoom();
  room.rooms[CODE].meta.hostBeat = now() - 11000;
  await seed(room);
  await assertSucceeds(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
  // heartbeat ignored in lobby
  const lobby = lobbyRoom();
  lobby.rooms[CODE].meta.hostBeat = now() - 60000;
  await env.clearDatabase();
  await seed(lobby);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

// APP FIXES (Grok 4.4): a refresh left the host's presence "offline" (a late onDisconnect) — a fresh beat must block the claim
test('host migration: a FRESH heartbeat blocks a claim during a game, whatever presence says', async () => {
  const room = playingRoom();
  room.rooms[CODE].meta.hostBeat = now() - 1000;
  room.rooms[CODE].presence.host = { online: false, lastSeen: now() - 60000 };
  await seed(room);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

test('host migration: the host\'s live connection beats a stale online:false (one child per connection, lobby)', async () => {
  const room = lobbyRoom();
  room.rooms[CODE].presence.host = { online: false, lastSeen: now() - 60000, c: { k9: now() } };
  await seed(room);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

test('host migration: a v-2 host with no connection left is gone once its lastSeen is 10 s old', async () => {
  const room = lobbyRoom();
  room.rooms[CODE].presence.host = { online: true, lastSeen: now() - 11000, v: 2 };
  await seed(room);
  await assertSucceeds(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'));
});

test('host migration: the claimer must be online (old shape or a live connection)', async () => {
  const room = lobbyRoom();
  room.rooms[CODE].presence.host = { online: false, lastSeen: now() - 60000 };
  room.rooms[CODE].presence.p2 = { online: false, lastSeen: now() - 60000 };
  await seed(room);
  await assertFails(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'), 'an offline claimer is refused');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/presence/p2`), { online: false, lastSeen: now(), c: { k1: now() } }));
  await assertSucceeds(set(ref(db('p2'), `${R}/meta/hostId`), 'p2'), 'a live connection is online');
});

// APP FIXES (Grok 4.1) — THE SEAL: in-round secrets out of rooms/ (readable by any signed-in user)
function sealRoom(phase = 'write') {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'bluff', matchId: 'm1', round: 1, rk: '1', phase, participants: { host: true, p2: true } };
  return r;
}
test('THE SEAL (bluff): a lie lives in your envelope — nobody else reads it, the host only once the round is unsealed, no writes after', async () => {
  await seed(sealRoom('write'));
  const E = `seal/${CODE}/lies/m1/1`;
  await assertSucceeds(update(ref(db('p2'), '/'), { [`${E}/p2`]: { t: 'A MOOSE', at: serverTimestamp() }, [`${R}/lies/m1/1/p2`]: { done: true, at: serverTimestamp() } }), 'the envelope + the public flag in one write');
  await assertSucceeds(get(ref(db('p2'), `${E}/p2`)), 'the owner reads their own');
  await assertFails(get(ref(db('stranger'), `${E}/p2`)), 'a stranger can\'t');
  await assertFails(get(ref(db('host'), `${E}/p2`)), 'the host can\'t read a lie while players are still writing');
  await assertFails(get(ref(db('host'), E)), '…nor the round\'s envelopes');
  await assertFails(set(ref(db('host'), `${E}/p2`), { t: 'FORGED', at: serverTimestamp() }), 'nobody writes your envelope');
  await assertFails(set(ref(db('p2'), `${E}/p2`), { t: 'x'.repeat(41), at: serverTimestamp() }), 'length-limited');
  assert.equal((await get(ref(db('stranger'), `${R}/lies/m1/1/p2`))).val().t, undefined, 'the room shows only that p2 filed');
  await assertSucceeds(set(ref(db('host'), `${R}/lies/m1/1/host`), { t: 'OLDER CLIENT', at: serverTimestamp() }), 'the old shape is still accepted this pass');
  // pencils down: the host unseals the round
  await assertSucceeds(update(ref(db('host'), `${R}/game`), { 'unseal/lies': '1' }));
  await assertSucceeds(get(ref(db('host'), E)), 'unsealed: the host reads the round\'s envelopes');
  await assertFails(get(ref(db('p2'), E)), '…a player still can\'t read the round');
  await assertFails(set(ref(db('p2'), `${E}/p2`), { t: 'TOO LATE', at: serverTimestamp() }), 'no writes after pencils down');
  await assertSucceeds(remove(ref(db('host'), `seal/${CODE}`)), 'the host wipes the envelopes between matches');
});

test('THE SEAL (bluff votes, signal answers, overclock answers): the same envelope rules', async () => {
  const vote = sealRoom('vote');
  await seed(vote);
  const V = `seal/${CODE}/votes/m1/1`;
  await assertSucceeds(update(ref(db('p2'), '/'), { [`${V}/p2`]: { k: 'abc', like: 'def', at: serverTimestamp() }, [`${R}/votes/m1/1/p2`]: { done: true, at: serverTimestamp() } }));
  await assertFails(get(ref(db('host'), `${V}/p2`)), 'the host can\'t see a vote while voting runs');
  await assertSucceeds(update(ref(db('host'), `${R}/game`), { 'unseal/votes': '1' }));
  await assertSucceeds(get(ref(db('host'), V)));
  await env.clearDatabase();
  await seed(signalRoom('question'));
  const A = `seal/${CODE}/answers/m2/4`;
  await assertSucceeds(update(ref(db('p2'), '/'), { [`${A}/p2`]: { c: 2, at: serverTimestamp() }, [`${R}/answers/m2/4/p2`]: { done: true, at: serverTimestamp() } }));
  await assertFails(set(ref(db('p2'), `${A}/p2`), { c: 3, at: serverTimestamp() }), 'one answer');
  await assertFails(get(ref(db('host'), `${A}/p2`)), 'the host can\'t peek before the question closes');
  await assertFails(set(ref(db('p2'), `${R}/answers/m2/4/host`), { done: true, at: serverTimestamp() }), 'never a flag for someone else');
  await assertSucceeds(update(ref(db('host'), `${R}/game`), { 'unseal/answers': '4' }));
  assert.equal((await assertSucceeds(get(ref(db('host'), A)))).val().p2.c, 2);
  await env.clearDatabase();
  const oc = lobbyRoom();
  oc.rooms[CODE].meta.status = 'playing';
  oc.rooms[CODE].game = { id: 'overclock', matchId: 'm3', ci: 2, ck: '2', phase: 'play', participants: { host: true, p2: true } };
  await seed(oc);
  const O = `seal/${CODE}/oc/m3/2`;
  await assertSucceeds(update(ref(db('p2'), '/'), { [`${O}/p2`]: { g: 1234, at: serverTimestamp() }, [`${R}/oc/m3/2/p2`]: { p: 1, ok: 1, n: 1, done: true, at: serverTimestamp(), doneAt: serverTimestamp() } }));
  await assertFails(get(ref(db('host'), `${O}/p2`)), 'the closest guess stays hidden while others still guess');
  await assertFails(set(ref(db('p2'), `${O}/p2`), { g: 'x', at: serverTimestamp() }), 'shape checked');
  await assertSucceeds(update(ref(db('host'), `${R}/game`), { 'unseal/oc': '2' }));
  await assertSucceeds(get(ref(db('host'), O)));
  await assertFails(set(ref(db('p2'), `${O}/p2`), { g: 999, at: serverTimestamp() }), 'pencils down');
});

test('LAST SIGNAL targets: never in the final, never once you are out; PULSE boards only while a song loads / plays / echoes', async () => {
  const s = signalRoom('question');
  await seed(s);
  await assertSucceeds(set(ref(db('p2'), `${R}/targets/m2/p2`), 'host'));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/out/p2`), 3));
  await assertFails(set(ref(db('p2'), `${R}/targets/m2/p2`), 'host'), 'out: no more targeting');
  await env.withSecurityRulesDisabled(ctx => update(ref(ctx.database(), `${R}/game`), { out: null, phase: 'final' }));
  await assertFails(set(ref(db('p2'), `${R}/targets/m2/p2`), 'host'), 'final: no more targeting');
  await env.clearDatabase();
  const pr = lobbyRoom();
  pr.rooms[CODE].meta.status = 'playing';
  pr.rooms[CODE].game = { id: 'pulse', matchId: 'm4', si: 0, phase: 'song', participants: { host: true, p2: true } };
  await seed(pr);
  const board = { k: 0, ready: true, s: 100, c: 1, mc: 1, p: 1, g: 0, o: 0, m: 0, n: 1, e: 0, er: 0, at: serverTimestamp() };
  await assertSucceeds(set(ref(db('p2'), `${R}/pulse/m4/p2`), board));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'standings'));
  await assertFails(set(ref(db('p2'), `${R}/pulse/m4/p2`), { ...board, s: 999999 }), 'no score after the song');
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
  await assertFails(get(query(ref(me, 'rooms'), orderByChild('meta/activeAt'), limitToFirst(20))), 'an end is required (APP FIXES)');
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

test('overclock OC1: the combo marks during play + the READY tap after a challenge — your own, this challenge, its phase only', async () => {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'overclock', matchId: 'm3', ci: 2, ck: '2', phase: 'play', participants: { host: true, p2: true } };
  await seed(r);
  const mk = s => ({ s, at: serverTimestamp() });
  await assertSucceeds(set(ref(db('p2'), `${R}/ocm/m3/2/p2`), mk('110h-')), 'marks: 1 0 h -');
  await assertSucceeds(set(ref(db('p2'), `${R}/ocm/m3/2/p2`), mk('1101')), 'rewritten as the challenge goes');
  await assertFails(set(ref(db('p2'), `${R}/ocm/m3/2/p2`), mk('12')), 'only 1 0 h -');
  await assertFails(set(ref(db('p2'), `${R}/ocm/m3/2/p2`), mk('1'.repeat(25))), '24 at most');
  await assertFails(set(ref(db('p2'), `${R}/ocm/m3/2/p2`), { s: '1', at: 5 }), 'the server\'s now');
  await assertFails(set(ref(db('p2'), `${R}/ocm/m3/2/p2`), { ...mk('1'), x: 1 }), 'nothing else');
  await assertFails(set(ref(db('p2'), `${R}/ocm/m3/2/host`), mk('1')), 'not someone else\'s');
  await assertFails(set(ref(db('p2'), `${R}/ocm/m3/1/p2`), mk('1')), 'not an old challenge');
  await assertFails(set(ref(db('p2'), `${R}/ocnext/m3/2/p2`), { at: serverTimestamp() }), 'READY only after the challenge');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'standings'));
  await assertFails(set(ref(db('p2'), `${R}/ocm/m3/2/p2`), mk('1')), 'marks close with the challenge');
  await assertSucceeds(set(ref(db('p2'), `${R}/ocnext/m3/2/p2`), { at: serverTimestamp() }), 'READY');
  await assertFails(set(ref(db('p2'), `${R}/ocnext/m3/2/host`), { at: serverTimestamp() }), 'not for someone else');
  await assertFails(set(ref(db('p2'), `${R}/ocnext/m3/2/p2`), { at: serverTimestamp(), x: 1 }), 'nothing else');
  await assertFails(set(ref(db('p2'), `${R}/ocnext/m3/1/p2`), { at: serverTimestamp() }), 'not an old screen');
  await assertFails(update(ref(db('p2'), R), { ocnext: null }), 'a guest never clears it');
  await assertSucceeds(update(ref(db('host'), R), { ocm: null, ocnext: null }), 'the host clears both');
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
  // APP FIXES (Grok 2.2): the record's time is the server's (/api/report age-caps every match by it)
  await assertFails(set(ref(db('host'), `${R}/night/m8`), { ...entry, at: 9e15 }), 'a record from the future (never "too old") is refused');
  await assertFails(set(ref(db('host'), `${R}/night/m8`), { g: 'bluff', p: { host: 3 } }), 'a record with no time is refused');
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
  room.game = { id: 'prism', matchId: 'm1', phase: 'play', settings: { mode: 'battle' }, participants: { host: true, p2: true, p3: true }, playStartAt: now() - 60_000, ...game };
  // (FR7 FIXES A — PD3: each board saved with its pieces — an attack's `i` is checked against the sender's sv/n)
  room.prism = { m1: Object.fromEntries(['host', 'p2', 'p3'].map(u => [u, { st: 'play', at: now(), sv: { b: '', n: 40, st: [40, 0, 0, 0] } }])) };
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
  await assertSucceeds(update(ref(db('p2'), `${N}/p2`), { sv: { b: '1111', n: 12, ak: '-Nabc', h: 3, sc: 5, pd: [[2, 4, 'p3', '-Nk']], st: [12, 0, 0, 0] } }), 'full save');
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
  await assertSucceeds(set(ref(db('p2'), `${Q}/p3/p2-1`), atk('p2', { i: 1 })));
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-1`), atk('p2', { i: 1 })), 'written once');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-2`), atk('host', { i: 2 })), 'cannot forge the sender');
  await assertFails(set(ref(db('p2'), `${Q}/p2/p2-3`), atk('p2', { i: 3 })), 'not at yourself');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-4`), atk('p2', { i: 4, n: 99  })), 'at most 30 rows');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-5`), atk('p2', { i: 5, g: 10  })), 'gap column 0-9');
  await assertFails(set(ref(db('outsider'), `${Q}/p3/outsider-6`), atk('outsider', { i: 6 })));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/out/p2`), { at: now(), place: 3, rem: 2 }));
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-7`), atk('p2', { i: 7 })), 'knocked out players can\'t attack');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/settings/mode`), 'rush'));
  await assertFails(set(ref(db('p3'), `${Q}/host/p3-8`), atk('p3', { i: 8 })), 'no attacks in Score Rush');
});

// PFIX-B (FABLE REVIEW findings 6 + 7) — THE CHEAP BOUNDS: every forged write the review proved ALLOWED is refused; the honest writes still go
const realSave = (extra = {}) => ({ b: '1111000000', n: 40, h: 3, hd: 0, lv: 2, ln: 12, sc: 4200, cb: -1, mc: 2, bb: 0, bc: 0, se: 6, fr: 0.25,
  pd: [[2, 4, 'p3', 'p3-17', 820, 180]], sd: 0, best: 'triple', st: [40, 0, 1, 0], ct: 5, pk: 9, ak: '@1731200000000', ...extra });

test('PFIX-B prism boards: the honest writes — a publish, a full save, a top-out — still go', async () => {
  await seed(prismRoom());
  const N = `${R}/prism/m1/p2`;
  await assertSucceeds(set(ref(db('p2'), N), pnode({ sv: realSave() })), 'the first save');
  await assertSucceeds(update(ref(db('p2'), N), { b: '1111110000', h: 1, p: '2,0,4,18', sc: 4300, ln: 12, lv: 2, mc: 2, se: 6, best: 'triple', pd: 2, tg: 'p3', st: 'play', at: serverTimestamp() }), 'a publish');
  await assertSucceeds(update(ref(db('p2'), N), { sv: realSave({ pd: null, n: 41, st: [41, 0, 1, 0] }), st: 'play', at: serverTimestamp() }), 'a save with nothing pending');
  await assertSucceeds(update(ref(db('p2'), N), { best: 'quad', ln: 16, st: 'play', at: serverTimestamp() }), 'a real four-line best');
  await assertSucceeds(update(ref(db('p2'), N), { st: 'out', by: 'p3', at: serverTimestamp(), b: '1'.repeat(200), sv: realSave() }), 'the top-out');
});

test('PFIX-B prism boards: sv is CLOSED + bounded; the stats bounded by the play clock', async () => {
  await seed(prismRoom());
  const N = `${R}/prism/m1/p2`;
  await assertSucceeds(set(ref(db('p2'), N), pnode({ sv: realSave() })));
  const sv = extra => update(ref(db('p2'), N), { sv: realSave(extra), st: 'play', at: serverTimestamp() });
  await assertFails(sv({ st: [1, 1, 1, 99], ln: 0, mc: 0, se: 0 }), 'more perfect clears than pieces');
  await assertFails(sv({ st: [1, 9, 0, 0], ln: 0, mc: 0, se: 0 }), 'more four-line clears than pieces');
  await assertFails(sv({ st: [99999, 0, 0, 0] }), 'more pieces than a minute of play allows');
  await assertSucceeds(sv({ st: [1, 1, 0, 0], ln: 4, mc: 0, se: 4 }), 'one piece, one four-line clear (the junk rows) — allowed');
  await assertFails(sv({ st: [1, 0, 0], ln: 0, mc: 0, se: 0 }), 'four counts');
  await assertFails(sv({ st: [1, 0, 0, 0, 5], ln: 0, mc: 0, se: 0 }), 'four counts, no more');
  await assertFails(sv({ pk: 41 }), 'the peak 0–40');
  await assertFails(sv({ ln: 500 }), 'lines: at most four a piece');
  await assertFails(sv({ x: 'x'.repeat(1_000_000) }), 'no 1 MB string — no extra fields');
  await assertFails(sv({ sc: 999_999_999 }), 'the save\'s score bounded');
  await assertFails(sv({ pd: [[40, 4, 'p3', 'k', 0, 0]] }), 'a pending attack ≤ 30 rows');
  await assertFails(sv({ pd: [[2, 4, 'p3', 'k', 0, 0, 'extra']] }), 'a pending row: six fields');
  await assertFails(sv({ h: 9 }), 'the hold: a piece 0–7');
  await assertFails(sv({ fr: 3 }), 'the attack fraction 0–1');
  const top = extra => update(ref(db('p2'), N), { st: 'play', at: serverTimestamp(), ...extra });
  await assertFails(top({ sc: 999_999_999 }), 'sc: 999 999 999');
  await assertFails(top({ sc: 5_000_000 }), 'a score a minute of play can\'t make');
  await assertFails(top({ ln: 5000 }), 'lines a minute of play can\'t clear');
  await assertFails(top({ best: 'quad', ln: 1 }), 'a four-line best with one line');
  await assertFails(top({ x: 'x'.repeat(1000) }), 'no extra fields on the board');
  await assertFails(update(ref(db('p2'), N), { st: 'play', at: now() - 5000 }), 'at = the server\'s clock, never the phone\'s');
});

test('PFIX-B prism boards: FROZEN once out (the top-out or the director) and outside play', async () => {
  await seed(prismRoom());
  const N = `${R}/prism/m1`;
  await assertSucceeds(set(ref(db('p2'), `${N}/p2`), pnode({ sv: realSave() })));
  await assertSucceeds(update(ref(db('p2'), `${N}/p2`), { st: 'out', by: 'p3', at: serverTimestamp() }));
  await assertFails(update(ref(db('p2'), `${N}/p2`), { st: 'out', by: 'host', at: serverTimestamp() }), 'the credit rewritten after the KO');
  await assertFails(update(ref(db('p2'), `${N}/p2`), { sc: 99_000, st: 'out', at: serverTimestamp() }), 'the score rewritten after the KO');
  await assertFails(update(ref(db('p2'), `${N}/p2`), { sv: realSave({ st: [40, 0, 0, 3] }), st: 'out', at: serverTimestamp() }), 'the save rewritten after the KO');
  // the director's own out (gone / away) freezes the board too
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/out/p3`), { at: now(), place: 3, rem: 2, gone: true, away: true }));
  await assertFails(update(ref(db('p3'), `${N}/p3`), pnode()), 'out by the director: no more writes');
  // the END phase of a BATTLE: nothing
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/phase`), 'end'));
  await assertFails(update(ref(db('host'), `${N}/host`), pnode()), 'not in a battle\'s END');
  // the countdown: only from GO (− 2 s — GO lands before the host's tick)
  await seed(prismRoom({ phase: 'count', playStartAt: now() + 10_000 }));
  await assertFails(set(ref(db('p2'), `${N}/p2`), pnode({ sc: 0, ln: 0, se: 0, best: '' })), 'not before GO');
  await seed(prismRoom({ phase: 'count', playStartAt: now() - 500 }));
  await assertSucceeds(set(ref(db('p2'), `${N}/p2`), pnode({ sc: 0, ln: 0, se: 0, best: '' })), 'GO has passed — the host just hasn\'t ticked yet');
  // SCORE RUSH: its final save in the END phase, never long after the song
  await seed(prismRoom({ phase: 'end', settings: { mode: 'rush' }, endAt: now() - 1000 }));
  await assertSucceeds(set(ref(db('p2'), `${N}/p2`), pnode({ sv: realSave() })), 'the rush\'s final save, just after the end');
  await seed(prismRoom({ phase: 'end', settings: { mode: 'rush' }, endAt: now() - 10_000 }));
  await assertFails(set(ref(db('p2'), `${N}/p2`), pnode()), 'not 10 s after the song');
  await seed(prismRoom({ phase: 'play', settings: { mode: 'rush' }, endAt: now() - 10_000 }));
  await assertFails(set(ref(db('p2'), `${N}/p2`), pnode()), 'not 10 s after the song while the host is away either');
});

test('PFIX-B prism junk: the server\'s clock, ONE attack per piece, neither side out', async () => {
  await seed(prismRoom());
  const Q = `${R}/prismq/m1`;
  const atk = (from, extra = {}) => ({ f: from, n: 2, g: 4, at: serverTimestamp(), ...extra });
  await assertSucceeds(set(ref(db('p2'), `${Q}/p3/p2-14`), atk('p2', { i: 14 })), 'an attack keyed by its piece');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-15`), atk('p2', { i: 15, at: now() - 59_000  })), 'back-dated (due at once) — refused');
  await assertFails(set(ref(db('p2'), `${Q}/p3/-NpushKey`), atk('p2')), 'a push key — not one per piece');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p3-16`), atk('p2', { i: 16 })), 'a key in someone else\'s name');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-x`), atk('p2')), 'the piece is a number');
  // the target already out — on its own board, or in the director's record
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/prism/m1/p3`), { st: 'out', at: now() }));
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-17`), atk('p2', { i: 17 })), 'at a target whose board says out');
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/prism/m1/p3`), null));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/game/out/p3`), { at: now(), place: 3, rem: 2 }));
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-18`), atk('p2', { i: 18 })), 'at a target the director put out');
  await assertSucceeds(set(ref(db('p2'), `${Q}/host/p2-18`), atk('p2', { i: 18 })), 'the one still standing can still be hit');
  // the sender's own board says out (before the director's next tick)
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/prism/m1/p2`), { st: 'out', at: now() }));
  await assertFails(set(ref(db('p2'), `${Q}/host/p2-19`), atk('p2', { i: 19 })), 'from a board that says out');
  // the countdown + SURVIVAL — still refused
  await seed(prismRoom({ phase: 'count' }));
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-20`), atk('p2', { i: 20 })), 'not in the countdown');
  await seed(prismRoom({ settings: { mode: 'survival' } }));
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-21`), atk('p2', { i: 21 })), 'not in SURVIVAL');
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
  // APP FIXES (Grok 4.3): a fleet is CREATED only while placing (after that only the host fills a gap) and never deleted by its owner
  await env.withSecurityRulesDisabled(ctx => remove(ref(ctx.database(), `${F}/p3`)));
  await assertFails(set(ref(db('p3'), `${F}/p3`), fleet), 'no fleet created after placement (laid out where the shots missed)');
  await assertFails(remove(ref(db('p2'), `${F}/p2`)), 'the owner never deletes it');
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
  await assertFails(set(ref(db('host'), `${F}/host`), { s: '1,0,4,0;2,0,3,1;5,5,3,0', at: serverTimestamp() }), 'a relocate keeps every ship (the same count)');
  await assertSucceeds(set(ref(db('host'), `${F}/host`), { s: '1,0,4,0;2,0,3,1;5,5,3,0;7,0,2,0', at: serverTimestamp() }), 'relocate in hand, not locked in yet');
  // sonar answers: written by the HOST (APP FIXES — the scanned player could have answered any number) while resolving, readable
  // by the shooter alone
  await seed(glRoom({ phase: 'resolve', rk: '4', mode: 'arcade', settings: { mode: 'arcade' }, acts: { p3: { a: 'sonar', t: 'p2', r: 1, c: 1 } }, fire: { host: [{ t: 'p2', r: 0, c: 0 }] } }));
  const S = `glsonar/${CODE}/m1/p3/4`;
  await assertFails(set(ref(db('p2'), S), { n: 0, at: serverTimestamp() }), 'THE SCANNED PLAYER can\'t answer (a lie: 0)');
  await assertFails(set(ref(db('p3'), S), { n: 2, at: serverTimestamp() }), 'the shooter can\'t answer itself');
  await assertSucceeds(set(ref(db('host'), S), { n: 2, at: serverTimestamp() }), 'the host answers');
  await assertFails(set(ref(db('host'), S), { n: 3, at: serverTimestamp() }), 'once');
  await assertSucceeds(get(ref(db('p3'), S)), 'the shooter reads it');
  await assertFails(get(ref(db('p2'), S)), 'nobody else does');
  await assertFails(get(ref(db('host'), `glsonar/${CODE}/m1/p3`)), 'not even the whole branch');
});

// APP FIXES (Grok 4.2): a target's phone could answer "miss" to a hit — the HOST writes every result (it reads the fleets)
test('gridlock resolutions: the HOST only, once, while resolving; calls as in PRISM DROP', async () => {
  await seed(glRoom({ phase: 'resolve', rk: '4', fire: { host: [{ t: 'p2', r: 1, c: 1 }], p2: [{ t: 'host', r: 1, c: 1 }] } }));
  const X = `${R}/glres/m1/4`;
  const res = { r: { p2: [{ h: 1, s: 0 }] }, k: { 0: '1,1,2,0' }, at: serverTimestamp() };
  const miss = { r: { host: [{ h: 0, s: 0 }] }, at: serverTimestamp() };
  await assertFails(set(ref(db('p3'), `${X}/host`), res), 'a bystander can\'t resolve someone\'s board');
  await assertFails(set(ref(db('p2'), `${X}/p2`), miss), 'THE TARGET can\'t write its own result (a lie: "miss")');
  await assertSucceeds(set(ref(db('host'), `${X}/p2`), { ...res, by: 'host' }), 'the host resolves p2\'s board');
  await assertFails(set(ref(db('host'), `${X}/p2`), res), 'once');
  await assertSucceeds(set(ref(db('host'), `${X}/host`), res), 'the host resolves its own board too (from its fleet, like any other)');
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
  await assertSucceeds(set(ref(db('host'), `${R}/players/host`), { ...player('HOST'), joinedAt: 1, pid: 'pmike0000000' }));
  await assertFails(set(ref(db('p2'), `${R}/players/p2`), { ...player('TWO'), joinedAt: 2, pid: 'pmike0000000' }), 'claiming someone else\'s profile');
  await assertSucceeds(set(ref(db('p2'), `${R}/players/p2`), { ...player('TWO'), joinedAt: 2 }), 'no profile id is fine (the server may be down)');
});

// LOBBY FIXES — ONE ACCOUNT, ONE ROOM: seats/{pid} is the profile's own (its devices read + write it, as themselves); a player node carrying
// the pid is refused while ANOTHER device holds the seat — MOVE HERE takes it, then the old device can't sit back down with the card
test('ONE ACCOUNT, ONE ROOM: the seat is the profile’s own, and one device holds it', async () => {
  const room = lobbyRoom();
  room.uids = { host: 'pmike0000000', phone2: 'pmike0000000', p2: 'pother000000' };
  await seed(room);
  const seat = (uid, code = CODE) => ({ code, uid, at: serverTimestamp() });
  await assertSucceeds(set(ref(db('host'), 'seats/pmike0000000'), seat('host')), 'the profile’s device takes its seat');
  await assertSucceeds(get(ref(db('phone2'), 'seats/pmike0000000')), 'another device of the same profile reads it');
  await assertFails(get(ref(db('p2'), 'seats/pmike0000000')), 'nobody else reads it');
  await assertFails(set(ref(db('p2'), 'seats/pmike0000000'), seat('p2')), 'nobody else takes it');
  await assertFails(set(ref(db('phone2'), 'seats/pmike0000000'), seat('host')), 'a device writes only itself into the seat');
  await assertFails(set(ref(db('host'), 'seats/pmike0000000'), { code: 'ab', uid: 'host', at: serverTimestamp() }), 'a room code is 4 letters');
  await assertFails(set(ref(db('host'), 'seats/pmike0000000'), { ...seat('host'), x: 1 }), 'nothing else in a seat');
  await assertSucceeds(set(ref(db('host'), `${R}/players/host`), { ...player('HOST'), joinedAt: 1, pid: 'pmike0000000' }), 'the seat holder sits with the card');
  // the second device: refused with the card while the seat is the first one's; MOVE HERE = it takes the seat, then sits
  await assertFails(set(ref(db('phone2'), `${R}/players/phone2`), { ...player('LAPTOP'), joinedAt: serverTimestamp(), pid: 'pmike0000000' }), 'a second seat for one profile');
  await assertSucceeds(set(ref(db('phone2'), 'seats/pmike0000000'), seat('phone2')), 'MOVE HERE');
  await assertSucceeds(set(ref(db('phone2'), `${R}/players/phone2`), { ...player('LAPTOP'), joinedAt: serverTimestamp(), pid: 'pmike0000000' }));
  await assertFails(set(ref(db('host'), `${R}/players/host`), { ...player('HOST'), joinedAt: 1, pid: 'pmike0000000' }), 'the old device can’t sit back down with the card');
  await assertSucceeds(remove(ref(db('phone2'), 'seats/pmike0000000')), 'leaving gives the seat back');
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

// SHELL 2.0 B2 — MAKE HOST: the host hands meta/hostId to a LIVE, ONLINE, UNKICKED player of the room (+ meta/hostBy = who handed it);
// a hand-off to an offline / kicked / non-player refused; a non-host can't hand it at all; the old self-claims + the room's creation unchanged
test('MAKE HOST: the host hands the room to a live online player only; never to an offline, kicked or outside uid; a non-host never', async () => {
  const room = lobbyRoom({ players: {
    host: { name: 'HOST', color: 'cyan', avatar: 'bolt', joinedAt: 1 }, p2: { name: 'TWO', color: 'magenta', avatar: 'eye', joinedAt: 2 },
    p3: { name: 'THREE', color: 'green', avatar: 'hex', joinedAt: 3 }, p4: { name: 'FOUR', color: 'green', avatar: 'hex', joinedAt: 4 }, p5: { name: 'FIVE', color: 'green', avatar: 'hex', joinedAt: 5 } } });
  room.rooms[CODE].presence = { host: { online: true, lastSeen: now(), v: 2, c: { a: true } }, p2: { online: true, lastSeen: now(), v: 2, c: { b: true } },
    p3: { online: false, lastSeen: now() - 60000, v: 2 }, p4: { online: true, lastSeen: now(), v: 2, c: { d: true } }, p5: { online: true, lastSeen: now() } };
  room.rooms[CODE].kicked = { p4: true };
  await seed(room);
  const M = `${R}/meta`;
  await assertFails(update(ref(db('host'), M), { hostId: 'p3', hostBy: 'host' }), 'to an OFFLINE player');
  await assertFails(update(ref(db('host'), M), { hostId: 'p4', hostBy: 'host' }), 'to a KICKED player');
  await assertFails(update(ref(db('host'), M), { hostId: 'stranger', hostBy: 'host' }), 'to someone NOT in the room');
  await assertFails(update(ref(db('p2'), M), { hostId: 'p5', hostBy: 'p2' }), 'a non-host hands it on');
  await assertFails(set(ref(db('p2'), `${M}/hostId`), 'p5'), '… or writes it for someone else');
  await assertSucceeds(update(ref(db('host'), M), { hostId: 'p5', hostBy: 'host' }), 'the old presence shape, online');
  await assertSucceeds(update(ref(db('p5'), M), { hostId: 'p2', hostBy: 'p5' }), 'the new host hands it on to a live connection');
  await assertFails(update(ref(db('p2'), M), { hostBy: 7 }), 'hostBy is a uid');
  // the gift lock is the server's: a client reads + writes nothing under gifts/
  await assertFails(get(ref(db('p2'), 'gifts/card-gift-enforcer')), 'gifts/ unreadable');
  await assertFails(set(ref(db('p2'), 'gifts/card-gift-enforcer'), { pid: 'x' }), 'gifts/ unwritable');
  await assertFails(set(ref(db('p2'), 'rooms/' + CODE + '/radioCrew/role/p2'), { on: true, at: 1 }), 'the crew stamp is the server\'s');
});

// ---------------------------------------------------------------------------------------------- HE2 — THE HOLD'EM DEALER
// rooms/{CODE}/holdem = the public table (any signed-in reader, written by the server only); hole/{CODE}/{uid} = a seat's own two cards
// (that uid only, never once kicked; server-written); hrec/{CODE} = the server's record — the deck, every card (no rule: the default deny)
function holdemRoom(extra = {}) {
  const r = playingRoom();
  r.rooms[CODE].players.p3 = { name: 'THREE', color: 'green', avatar: 'hex', joinedAt: 3 };
  r.rooms[CODE].holdem = { seq: 3, at: now(), m: { id: '"habc"' }, t: { board: JSON.stringify(['Kc', 'Qd', '5s']) } };   // (HE3 — THE LEAN WIRE's parts)
  r.hole = { [CODE]: { host: { h: 1, c: ['As', 'Ah'] }, p2: { h: 1, c: ['7c', '2d'] }, p3: { h: 1, c: ['9h', '9s'] } } };
  r.hrec = { [CODE]: { seq: 3, due: now() + 20000, j: JSON.stringify({ deck: ['Jh', 'Tc'] }) } };
  Object.assign(r, extra);
  return r;
}

test('HE2 — HOLD\'EM: a phone reads ONLY its own two cards — never another seat\'s, the room\'s whole node, the whole tree or the record', async () => {
  await seed(holdemRoom());
  await assertSucceeds(get(ref(db('p2'), `hole/${CODE}/p2`)));
  await assertFails(get(ref(db('p2'), `hole/${CODE}/host`)), 'another seat\'s cards');
  await assertFails(get(ref(db('p2'), `hole/${CODE}/p3`)));
  await assertFails(get(ref(db('p2'), `hole/${CODE}`)), 'the room\'s private node whole');
  await assertFails(get(ref(db('p2'), 'hole')), 'the whole private tree');
  await assertFails(get(ref(db('host'), `hole/${CODE}/p2`)), 'the host holds no cards');
  await assertFails(get(ref(db('stranger'), `hole/${CODE}/p2`)));
  await assertFails(get(ref(db(null), `hole/${CODE}/p2`)));
  for (const who of ['host', 'p2', 'stranger']) {
    await assertFails(get(ref(db(who), `hrec/${CODE}`)), `${who} reads the server's record`);
    await assertFails(get(ref(db(who), 'hrec')));
    await assertFails(get(ref(db(who), `hrec/${CODE}/due`)));
  }
  // the public table: the room's players + any signed-in spectator (like every room), never signed out
  await assertSucceeds(get(ref(db('p2'), `${R}/holdem`)));
  await assertSucceeds(get(ref(db('stranger'), `${R}/holdem`)));
  await assertFails(get(ref(db(null), `${R}/holdem`)));
  // reading the whole room tree never reaches the private cards (they live outside rooms/)
  const room = (await get(ref(db('p2'), R))).val();
  assert.ok(!JSON.stringify(room).includes('"As"') && !JSON.stringify(room).includes('"9h"'), 'no other seat\'s card in the room tree');
});

test('HE2 — HOLD\'EM: no client writes the public table, a private node or the record — the host and the owner included', async () => {
  await seed(holdemRoom());
  const fake = { seq: 99, at: now(), j: '{}' };
  for (const who of ['host', 'p2', 'stranger']) {
    await assertFails(set(ref(db(who), `${R}/holdem`), fake), `${who} writes the table`);
    await assertFails(update(ref(db(who), `${R}/holdem`), { seq: 100 }));
    await assertFails(set(ref(db(who), `${R}/holdem/t/turn`), '3'));
    await assertFails(set(ref(db(who), `hole/${CODE}/${who}`), { h: 1, c: ['As', 'Ad'] }), `${who} writes their own cards`);
    await assertFails(set(ref(db(who), `hole/${CODE}/p3`), null));
    await assertFails(set(ref(db(who), `hrec/${CODE}`), { j: '{}' }), `${who} writes the record`);
    await assertFails(set(ref(db(who), `hrec/${CODE}/due`), 0));
  }
  await assertFails(update(ref(db('host'), R), { holdem: fake }), 'the host\'s room update can\'t carry the table');
  await assertFails(update(ref(db('host'), '/'), { [`${R}/game/x`]: 1, [`${R}/holdem`]: fake }), 'nor a multi-path update');
});

test('HE2 — HOLD\'EM: a kicked player reads nothing new — their own private node closes the moment they are kicked', async () => {
  await seed(holdemRoom());
  await assertSucceeds(get(ref(db('p3'), `hole/${CODE}/p3`)));
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/kicked/p3`), true));
  await assertFails(get(ref(db('p3'), `hole/${CODE}/p3`)), 'kicked → their cards closed');
  await assertFails(get(ref(db('p3'), `hole/${CODE}/p2`)));
  await assertSucceeds(get(ref(db('p2'), `hole/${CODE}/p2`)), 'the others are untouched');
});

// ====================================================================================== FR7 FIXES A — Group 4: THE RULES PASS (one re-publish)
test('FR7 FIXES A — C3: meta/activeAt is required + never in the future (a room nobody could delete, all 798 hush words held)', async () => {
  const meta = (extra = {}) => ({ hostId: 'h1', status: 'lobby', createdAt: serverTimestamp(), activeAt: serverTimestamp(), hostBeat: serverTimestamp(), ...extra });
  await assertSucceeds(set(ref(db('h1'), 'rooms/WXYZ/meta'), meta()), 'the honest create (every stamp the server\'s now)');
  await assertFails(set(ref(db('h2'), 'rooms/WXYA/meta'), meta({ hostId: 'h2', activeAt: 4102444800000 })), 'an activeAt in 2100');
  const { activeAt: _a, ...noActive } = meta({ hostId: 'h3' }); void _a;
  await assertFails(set(ref(db('h3'), 'rooms/WXYB/meta'), noActive), 'no activeAt at all');
  await assertFails(update(ref(db('h1'), 'rooms/WXYZ/meta'), { activeAt: now() + 3600_000 }), 'pushed into the future later');
  await assertSucceeds(update(ref(db('h1'), 'rooms/WXYZ/meta'), { activeAt: serverTimestamp() }), 'the host\'s stamp at the server\'s now');
});

// (FR7 FIXES A — C4 NOT DONE: the emulator never evaluates `query.endAt` as a comparable value (number or string — probed), so a "stale rooms
// only" rule can't be proved here; an unproved rule could break the idle sweep on the live database. docs/harbor/passes/fr7-fixes-a.md)

test('FR7 FIXES A — C5: what a rule CAN cap — the night record\'s shape, settings + the night memory\'s entries', async () => {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  await seed(r);
  const N = `${R}/night/m9`;
  await assertSucceeds(set(ref(db('host'), N), { g: 'prism', at: serverTimestamp(), p: { host: 3, p2: 2 }, n: { host: 'HOST', p2: 'TWO' }, b: { p2: 1 } }), 'the honest record');
  await assertFails(set(ref(db('host'), `${R}/night/m8`), { g: 'prism', at: serverTimestamp(), p: { host: 99 } }), 'night points 0–3');
  await assertFails(set(ref(db('host'), `${R}/night/m8`), { g: 'prism', at: serverTimestamp(), p: { host: 3 }, junk: 'x'.repeat(5000) }), 'no extra fields');
  await assertFails(set(ref(db('host'), `${R}/night/m8`), { g: 'prism', at: serverTimestamp(), p: { host: 3 }, n: { host: 'x'.repeat(200) } }), 'a name ≤ 24');
  await assertSucceeds(update(ref(db('host'), `${R}/meta/settings`), { overclock: { mode: 'quick' }, holdem: { mode: 'tournament', speed: 'turbo' } }), 'the honest settings');
  await assertSucceeds(update(ref(db('host'), `${R}/meta/settings`), { signal: { hp: 100, cats: { 0: 'music' } } }), 'a list one level down');
  await assertFails(update(ref(db('host'), `${R}/meta/settings`), { prism: { mode: 'x'.repeat(5000) } }), 'a value ≤ 64');
  await assertFails(update(ref(db('host'), `${R}/meta/settings`), { prism: { a: { b: { c: 1 } } } }), 'no deeper nesting');
  await assertSucceeds(update(ref(db('host'), `${R}/meta/used/overclock`), { 'tv-123': true }), 'the night memory');
  await assertFails(update(ref(db('host'), `${R}/meta/used/overclock`), { ['k'.repeat(100)]: true }), 'a key ≤ 64');
});

test('FR7 FIXES A — PD3: an attack\'s key = the sender + its piece `i`, and `i` ≤ the sender\'s saved pieces + 15 — no board, no attacks', async () => {
  await seed(prismRoom());
  const Q = `${R}/prismq/m1`;
  const atk = (i, extra = {}) => ({ f: 'p2', n: 3, g: 4, at: serverTimestamp(), i, ...extra });
  await assertSucceeds(set(ref(db('p2'), `${Q}/p3/p2-41`), atk(41)), 'a real piece (the save says 40 — a save trails a fast player)');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-42`), atk(41)), 'the key and its i must agree');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-56`), atk(56)), 'past the saved pieces + 15');
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-30`), { f: 'p2', n: 3, g: 4, at: serverTimestamp() }), 'no i (an old phone) — refused once re-published (its fallback is THE OLD RULES only)');
  // the review's repro: a participant with NO board writes 200 attacks — refused from the first
  await env.withSecurityRulesDisabled(ctx => set(ref(ctx.database(), `${R}/prism/m1/p2`), null));
  await assertFails(set(ref(db('p2'), `${Q}/p3/p2-0`), atk(0)), 'no board, no attacks');
});

test('FR7 FIXES A — OC2 + HOST-GRADED: `doneAt` only together with `done`; the sealed picks `a` (≤ 400)', async () => {
  const r = lobbyRoom();
  r.rooms[CODE].meta.status = 'playing';
  r.rooms[CODE].game = { id: 'overclock', matchId: 'm3', ci: 2, ck: '2', phase: 'play', participants: { host: true, p2: true } };
  await seed(r);
  const B = `${R}/oc/m3/2/p2`;
  await assertFails(set(ref(db('p2'), B), { p: 0, ok: 0, n: 3, done: false, at: serverTimestamp(), doneAt: serverTimestamp() }), 'the review\'s kept stamp: a doneAt at the start, not done');
  await assertSucceeds(set(ref(db('p2'), B), { p: 1, ok: 1, n: 3, done: false, at: serverTimestamp() }));
  await assertSucceeds(set(ref(db('p2'), B), { p: 3, ok: 3, n: 3, done: true, at: serverTimestamp(), doneAt: serverTimestamp() }), 'the honest finish');
  const O = `seal/${CODE}/oc/m3/2/p2`;
  await assertSucceeds(update(ref(db('p2'), O), { a: '[3,1,0]', at: serverTimestamp() }), 'the picks, sealed');
  await assertFails(update(ref(db('p2'), O), { a: 'x'.repeat(401), at: serverTimestamp() }), 'picks ≤ 400');
  await assertFails(get(ref(db('host'), O)), 'the host reads them only after the unseal');
});

test('FR7 FIXES A — THE RULES-LAG: on THE RULES AS PUBLISHED (the old rules) every new write keeps a working fallback', async () => {
  const old = await initializeTestEnvironment({ projectId: 'demo-oldrules-fr7a', database: { rules: readFileSync(fileURLToPath(new URL('../fixtures/rules-live.json', import.meta.url)), 'utf8'), host: '127.0.0.1', port: 9000 } });
  try {
    const odb = uid => old.authenticatedContext(uid).database();
    const oseed = data => old.withSecurityRulesDisabled(ctx => set(ref(ctx.database()), data));
    // OVERCLOCK: the board + the envelope land; the picks (their own write) are refused alone → the host keeps the phones' ok
    const r = lobbyRoom();
    r.rooms[CODE].meta.status = 'playing';
    r.rooms[CODE].game = { id: 'overclock', matchId: 'm3', ci: 2, ck: '2', phase: 'play', participants: { host: true, p2: true } };
    await oseed(r);
    await assertSucceeds(update(ref(odb('p2'), '/'), { [`${R}/oc/m3/2/p2`]: { p: 1, ok: 1, n: 3, done: false, at: serverTimestamp() }, [`seal/${CODE}/oc/m3/2/p2/g`]: 5, [`seal/${CODE}/oc/m3/2/p2/at`]: serverTimestamp() }), 'the board + the envelope, one path a field');
    await assertFails(update(ref(odb('p2'), `seal/${CODE}/oc/m3/2/p2`), { a: '[1]', at: serverTimestamp() }), 'the picks: refused on the old rules (alone)');
    // PRISM: an attack with `i` refused; the same attack without it lands (view.js#sendAttack's retry)
    await oseed(prismRoom());
    const atk = { f: 'p2', n: 2, g: 4, at: serverTimestamp() };
    await assertFails(set(ref(odb('p2'), `${R}/prismq/m1/p3/p2-12`), { ...atk, i: 12 }));
    await assertSucceeds(set(ref(odb('p2'), `${R}/prismq/m1/p3/p2-12`), atk), 'the fallback lands');
  } finally { await old.cleanup(); }
});

// FR7 FIXES B — A RE-START KEEPS THE LAST MATCH's PROOF: the host may delete ONE match's proof node (prism / oc / ocm / {m}) — a new start keeps
// the previous match's for a late report; nobody else may; a write that isn't a delete is refused
test('FR7 FIXES B — the host deletes ONE match\'s proof node (prism / oc / ocm), keeping the others; a guest never', async () => {
  const proof = { prism: { mA: { p2: { st: 'out', at: 1 } }, mZ: { p2: { st: 'out', at: 1 } } }, oc: { mA: { 0: { p2: { done: true } } }, mZ: { 0: { p2: { done: true } } } }, ocm: { mZ: { 0: { p2: '1' } } } };
  await seed(lobbyRoom(proof));
  for (const n of ['prism', 'oc', 'ocm']) {
    await assertFails(update(ref(db('p2'), `${R}`), { [`${n}/mZ`]: null }), `a guest deletes ${n}/mZ`);
    await assertSucceeds(update(ref(db('host'), `${R}`), { [`${n}/mZ`]: null }), `the host deletes ${n}/mZ`);
    await assertFails(set(ref(db('host'), `${R}/${n}/mA`), { x: 1 }), `the host writes into ${n}/mA`);
  }
  const left = await env.withSecurityRulesDisabled(ctx => get(ref(ctx.database(), `${R}/prism`)));
  assert.ok(left.val().mA && !left.val().mZ, 'the previous match kept, the older one gone');
});
