// FRIENDS A on the emulators (/api, no browser): request → accept → both friends, decline, cancel, remove, block, the caps + the rate limits,
// a refresh = the same state, RECENTLY PLAYED WITH from verified matches, INVITES THAT WAIT (only friends, only from the room, gone with the
// room), INVITE NOTIFICATIONS' subscriptions.
//   cd tests/integration && node --test friends.test.mjs        (the emulators running)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.ADMIN_PIDS = '';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { noteRecent } from '../../api/_lib/friends.js';
import { FR } from '../../js/core/friends.js';

const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'pfr', 'rooms', 'members', 'radio', 'audit'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); });
after(async () => { await deleteApp(fb().app); });

let clock = Date.UTC(2026, 10, 8, 1, 0, 0);
const tick = (ms = 1000) => (clock += ms);
const ensure = async (uid, name) => (await profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', clock)).pid;
const act = (uid, body) => profileAction(uid, body, '', tick());
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} (${e.message})`); if (code) assert.equal(e.code, code); return; }
  assert.fail(`expected ${status} ${code}`);
};
const names = s => s.map(c => c.n).sort();

test('request → accept → both friends; a refresh shows the same; the badge counts the waiting request', async () => {
  const ann = await ensure('fr-ann', 'Ann'), bob = await ensure('fr-bob', 'Bob');
  const r = await act('fr-ann', { action: 'friendAdd', pid: bob });
  assert.equal(r.rel, 'out'); assert.deepEqual(names(r.state.out), ['Bob']);
  assert.equal((await act('fr-bob', { action: 'me' })).fr.in, 1, 'the badge on Bob\'s profile button');
  const b0 = await act('fr-bob', { action: 'friends' });
  assert.deepEqual(names(b0.in), ['Ann']);
  assert.ok(b0.in[0].bid && !('key' in b0.in[0]), 'a card: the public face + the board id, never a key');
  const acc = await act('fr-bob', { action: 'friendAccept', pid: ann });
  assert.equal(acc.rel, 'friend'); assert.deepEqual(names(acc.state.friends), ['Ann']); assert.deepEqual(acc.state.in, []);
  const a1 = await act('fr-ann', { action: 'friends' }), a2 = await act('fr-ann', { action: 'friends' });
  assert.deepEqual(names(a1.friends), ['Bob']); assert.deepEqual(a1, a2, 'a refresh = the same state');
  assert.equal((await act('fr-bob', { action: 'me' })).fr.in, 0);
  // (the nodes are both sides, server-written)
  assert.ok(await val(`pfr/${ann}/f/${bob}`)); assert.ok(await val(`pfr/${bob}/f/${ann}`));
});

test('decline (quiet), cancel, remove (quiet), block (no more requests; gone from suggestions), unblock', async () => {
  const cy = await ensure('fr-cy', 'Cy'), di = await ensure('fr-di', 'Di');
  await act('fr-cy', { action: 'friendAdd', pid: di });
  await act('fr-di', { action: 'friendDecline', pid: cy });
  assert.deepEqual((await act('fr-di', { action: 'friends' })).in, []);
  assert.deepEqual(names((await act('fr-cy', { action: 'friends' })).out), ['Di'], 'the sender still sees REQUESTED');
  await act('fr-cy', { action: 'friendAdd', pid: di });
  assert.deepEqual((await act('fr-di', { action: 'friends' })).in, [], 'a declined request never comes back by asking again');
  await act('fr-cy', { action: 'friendCancel', pid: di });
  assert.deepEqual((await act('fr-cy', { action: 'friends' })).out, []);
  await act('fr-cy', { action: 'friendAdd', pid: di }); await act('fr-di', { action: 'friendAccept', pid: cy });
  await act('fr-di', { action: 'friendRemove', pid: cy });
  assert.deepEqual((await act('fr-cy', { action: 'friends' })).friends, [], 'remove is both sides');
  // BLOCK
  await noteRecent([cy, di], tick());
  assert.deepEqual(names((await act('fr-di', { action: 'friends' })).recent), ['Cy']);
  const bl = await act('fr-di', { action: 'friendBlock', pid: cy });
  assert.equal(bl.rel, 'blocked'); assert.deepEqual(names(bl.state.blocked), ['Cy']); assert.deepEqual(bl.state.recent, [], 'gone from suggestions');
  const again = await act('fr-cy', { action: 'friendAdd', pid: di });
  assert.equal(again.rel, 'out', 'to the blocked it looks sent');
  assert.deepEqual((await act('fr-di', { action: 'friends' })).in, [], 'it never lands');
  await rejects(act('fr-di', { action: 'friendAdd', pid: cy }), 409, 'blocked');
  await act('fr-di', { action: 'friendUnblock', pid: cy });
  assert.deepEqual((await act('fr-di', { action: 'friends' })).blocked, []);
});

test('the checks: no self-friend, the profile must exist, the 100 cap, the pending caps, the rate limit', async () => {
  const ed = await ensure('fr-ed', 'Ed');
  await rejects(act('fr-ed', { action: 'friendAdd', pid: ed }), 400, 'self');
  await rejects(act('fr-ed', { action: 'friendAdd', pid: 'pzzzzzzzzzzz' }), 404, 'no_profile');
  await rejects(act('fr-ed', { action: 'friendAdd', pid: 'not a pid' }), 404, 'no_profile');
  await rejects(act('fr-ed', { action: 'friendAccept', pid: 'pzzzzzzzzzzz' }), 404, 'no_profile');
  // (the caps — seeded straight into the node: the server reads it)
  const AL = 'abcdefghijkmnpqrstuvwxyz23456789', fake = i => `pq${AL[i >> 5]}${AL[i & 31]}aaaaaaaa`;
  const fl = await ensure('fr-fl', 'Flo');
  await ref(`pfr/${ed}/f`).set(Object.fromEntries(Array.from({ length: FR.max }, (_, i) => [fake(i), clock])));
  await rejects(act('fr-ed', { action: 'friendAdd', pid: fl }), 409, 'your_list_full');
  await ref(`pfr/${ed}/f`).remove();
  await ref(`pfr/${ed}/out`).set(Object.fromEntries(Array.from({ length: FR.outMax }, (_, i) => [fake(i), clock])));
  await rejects(act('fr-ed', { action: 'friendAdd', pid: fl }), 409, 'too_many_out');
  await ref(`pfr/${ed}/out`).remove();
  await ref(`pfr/${fl}/in`).set(Object.fromEntries(Array.from({ length: FR.inMax }, (_, i) => [fake(i), clock])));
  await rejects(act('fr-ed', { action: 'friendAdd', pid: fl }), 409, 'their_requests_full');
  await ref(`pfr/${fl}/in`).remove();
  // the rate limit (an hour's sends)
  await ref(`rl/fr_h_${ed}`).set({ n: FR.reqPerHour, t: clock });
  await rejects(act('fr-ed', { action: 'friendAdd', pid: fl }), 429, 'rate');
  await ref(`rl/fr_h_${ed}`).remove();
  assert.equal((await act('fr-ed', { action: 'friendAdd', pid: fl })).rel, 'out');
});

test('RECENTLY PLAYED WITH: the others from a verified match, newest first, friends + blocks left out', async () => {
  const g = await ensure('fr-g', 'Gus'), h = await ensure('fr-h', 'Hal'), i = await ensure('fr-i', 'Ivy');
  await noteRecent([g, h], tick()); await noteRecent([g, i], tick());
  assert.deepEqual((await act('fr-g', { action: 'friends' })).recent.map(c => c.n), ['Ivy', 'Hal']);
  await noteRecent([g], tick());   // (a solo match: nobody)
  await act('fr-g', { action: 'friendAdd', pid: h }); await act('fr-h', { action: 'friendAccept', pid: g });
  const s = await act('fr-g', { action: 'friends' });
  assert.deepEqual(s.recent.map(c => c.n), ['Ivy'], 'a friend leaves the suggestions');
  assert.equal(s.recent[0].rel, 'none');
});

test('INVITES THAT WAIT: only to a friend, only from the room; the card on the next open; gone with the room / NOT NOW / after 30 min', async () => {
  const jo = await ensure('fr-jo', 'Jo'), kim = await ensure('fr-kim', 'Kim'), lu = await ensure('fr-lu', 'Lu');
  await act('fr-jo', { action: 'friendAdd', pid: kim }); await act('fr-kim', { action: 'friendAccept', pid: jo });
  const meta = { hostId: 'fr-jo', status: 'lobby', createdAt: clock, activeAt: clock };
  await ref('rooms/WAIT').set({ meta, players: { 'fr-jo': { name: 'Jo', pid: jo, joinedAt: clock } } });
  await rejects(act('fr-lu', { action: 'friendInvite', pid: kim, room: 'WAIT' }), 403, 'not_in_room');
  await ref('rooms/WAIT/players/fr-lu').set({ name: 'Lu', pid: lu, joinedAt: clock });
  await rejects(act('fr-lu', { action: 'friendInvite', pid: kim, room: 'WAIT' }), 403, 'not_friends');
  await rejects(act('fr-jo', { action: 'friendInvite', pid: kim, room: 'GONE' }), 404, 'no_room');
  const inv = await act('fr-jo', { action: 'friendInvite', pid: kim, room: 'WAIT' });
  assert.equal(inv.ok, true); assert.equal(inv.sent, 0, 'no push without a subscription');
  assert.equal((await act('fr-jo', { action: 'friendInvite', pid: kim, room: 'WAIT' })).again, true, 'a repeat inside 90 s is not a second invite');
  const c1 = await act('fr-kim', { action: 'inviteCheck' });
  assert.equal(c1.invites.length, 1); assert.equal(c1.invites[0].room, 'WAIT'); assert.equal(c1.invites[0].n, 'Jo');
  // NOT NOW
  await act('fr-kim', { action: 'inviteDismiss', pid: jo });
  assert.equal((await act('fr-kim', { action: 'inviteCheck' })).invites.length, 0);
  // the room closes → gone; a new room on the same hush word never revives it
  tick(100e3);
  await act('fr-jo', { action: 'friendInvite', pid: kim, room: 'WAIT' });
  await ref('rooms/WAIT/meta/createdAt').set(clock + 5);
  assert.equal((await act('fr-kim', { action: 'inviteCheck' })).invites.length, 0, 'the same word, another room');
  assert.equal(await val(`pfr/${kim}/inv/${jo}`), null, 'pruned');
  await ref('rooms/WAIT/meta/createdAt').set(meta.createdAt);
  tick(100e3);
  await act('fr-jo', { action: 'friendInvite', pid: kim, room: 'WAIT' });
  await ref('rooms/WAIT').remove();
  assert.equal((await act('fr-kim', { action: 'inviteCheck' })).invites.length, 0, 'the room closed');
  // after ~30 min
  await ref('rooms/WAIT').set({ meta, players: { 'fr-jo': { name: 'Jo', pid: jo, joinedAt: clock } } });
  tick(100e3);
  await act('fr-jo', { action: 'friendInvite', pid: kim, room: 'WAIT' });
  tick(FR.inviteMs + 1000);
  assert.equal((await act('fr-kim', { action: 'inviteCheck' })).invites.length, 0, 'expired');
  // a block (or a remove) takes the friendship — no invite from them after
  tick(100e3);
  await act('fr-kim', { action: 'friendBlock', pid: jo });
  await rejects(act('fr-jo', { action: 'friendInvite', pid: kim, room: 'WAIT' }), 403, 'not_friends');
  await ref('rooms/WAIT').remove();
});

test('INVITE NOTIFICATIONS: this phone\'s subscription stored privately (≤ 4 phones, the oldest makes room); the push goes to it', async () => {
  const mo = await ensure('fr-mo', 'Mo');
  const st = await act('fr-mo', { action: 'friendPush', op: 'state' });
  assert.ok(st.key, 'the emulators make a VAPID pair'); assert.equal(st.subs, 0);
  await rejects(act('fr-mo', { action: 'friendPush', op: 'sub', sub: { endpoint: 'https://evil.example.com/x', keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } } }), 400, 'bad_sub');
  for (let i = 0; i < 5; i++) await act('fr-mo', { action: 'friendPush', op: 'sub', sub: { endpoint: `https://fcm.googleapis.com/fcm/send/x${i}`, keys: { p256dh: 'B'.repeat(87), auth: 'c'.repeat(22) } } });
  const s5 = await act('fr-mo', { action: 'friendPush', op: 'state', endpoint: 'https://fcm.googleapis.com/fcm/send/x0' });
  assert.equal(s5.subs, FR.pushSubsMax); assert.equal(s5.mine, false, 'the oldest made room');
  await act('fr-mo', { action: 'friendPush', op: 'unsub', endpoint: 'https://fcm.googleapis.com/fcm/send/x4' });
  assert.equal((await act('fr-mo', { action: 'friendPush', op: 'state' })).subs, FR.pushSubsMax - 1);
  assert.ok(await val(`ppriv/${(await val('uids/fr-mo'))}/ps`), 'kept in ppriv (server-only)');
});

test('THE PUSH: an invite reaches the friend\'s subscribed phone (a local receiver), opening /?room=CODE&inv=1; a gone phone is dropped', async () => {
  const { createServer } = await import('node:http');
  const { createECDH, randomBytes } = await import('node:crypto');
  const got = [];
  let status = 201;
  const srv = createServer((req, res) => { let n = 0; req.on('data', c => { n += c.length; }); req.on('end', () => { got.push({ url: req.url, auth: req.headers.authorization || '', enc: req.headers['content-encoding'], ttl: req.headers.ttl, n }); res.statusCode = status; res.end(); }); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const port = srv.address().port;
  try {
    const pa = await ensure('fr-pa', 'Pat'), qu = await ensure('fr-qu', 'Quinn');
    await act('fr-pa', { action: 'friendAdd', pid: qu }); await act('fr-qu', { action: 'friendAccept', pid: pa });
    const e = createECDH('prime256v1'); e.generateKeys();
    const sub = { endpoint: `http://127.0.0.1:${port}/push/q1`, keys: { p256dh: e.getPublicKey().toString('base64url'), auth: randomBytes(16).toString('base64url') } };
    await act('fr-qu', { action: 'friendPush', op: 'sub', sub });
    await ref('rooms/PUSH').set({ meta: { hostId: 'fr-pa', status: 'lobby', createdAt: clock, activeAt: clock }, players: { 'fr-pa': { name: 'Pat', pid: pa, joinedAt: clock } } });
    const r = await act('fr-pa', { action: 'friendInvite', pid: qu, room: 'PUSH' });
    assert.equal(r.sent, 1, 'one phone got it');
    assert.equal(got.length, 1); assert.match(got[0].auth, /^vapid t=.+, k=/); assert.equal(got[0].enc, 'aes128gcm'); assert.equal(Number(got[0].ttl), FR.inviteMs / 1000, 'the push lives as long as the invite'); assert.ok(got[0].n > 100, 'an encrypted payload');
    // a gone phone (410) is dropped from the list
    status = 410; tick(100e3);
    await act('fr-pa', { action: 'friendInvite', pid: qu, room: 'PUSH' });
    assert.equal((await act('fr-qu', { action: 'friendPush', op: 'state' })).subs, 0, 'the gone subscription removed');
    await ref('rooms/PUSH').remove();
  } finally { srv.close(); }
});

test('THE CREW INTERCOM: the owner\'s switch (default OFF); ON → the crew talks to THEIR room only, holding its radio, ≤ 15 s, a few a night; OFF refuses again', async () => {
  const { adminAction } = await import('../../api/admin.js');
  const boss = await ensure('ci-boss', 'Boss'), cr = await ensure('ci-crew', 'Crewy'), pl = await ensure('ci-pl', 'Plain');
  process.env.ADMIN_PIDS = boss;
  try {
    const clip = Buffer.alloc(3000, 7).toString('base64'), T = clock;
    await ref('radio').remove();
    await ref(`radio/crew/${cr}`).set({ at: T, by: boss, n: 'Crewy', t: '0001' });
    await ref('rooms/CRIC').set({ meta: { hostId: 'ci-crew', status: 'lobby', createdAt: T, activeAt: T }, players: { 'ci-crew': { name: 'CREWY', color: 'cyan', avatar: 'bolt', joinedAt: 1 }, 'ci-pl': { name: 'PLAIN', color: 'pink', avatar: 'star', joinedAt: 2 } } });
    await ref('rooms/OTHR').set({ meta: { hostId: 'ci-pl', status: 'lobby', createdAt: T, activeAt: T }, players: { 'ci-pl': { name: 'PLAIN', color: 'pink', avatar: 'star', joinedAt: 2 } } });
    const send = (uid, extra = {}) => adminAction(uid, { action: 'radioIntercom', aud: 'room', room: 'CRIC', mime: 'audio/mp4', dur: 6, b64: clip, ...extra }, tick());
    // OFF (the default): the crew's desk doesn't show it, the server refuses
    assert.deepEqual((await adminAction('ci-crew', { action: 'radioState', room: 'CRIC' }, T)).crewIc, { on: false });
    await rejects(send('ci-crew'), 403, 'crew_ic_off');
    // only the owner flips it (audited)
    await rejects(adminAction('ci-crew', { action: 'radioCrewIntercom', on: true }, T), 403, 'not_owner');
    await rejects(adminAction('ci-pl', { action: 'radioCrewIntercom', on: true }, T), 403, 'not_radio');
    assert.equal((await adminAction('ci-boss', { action: 'radioCrewIntercom', on: true }, T)).crewIc.on, true);
    assert.equal((await val('radio/crewIc')).on, true);
    assert.equal((await adminAction('ci-boss', { action: 'radioState' }, T)).crewIc.on, true, 'the owner\'s desk shows the switch');
    // ON: their room, NOW, no headline, ≤ 15 s
    const st = await adminAction('ci-crew', { action: 'radioState', room: 'CRIC' }, T);
    assert.equal(st.crewIc.on, true); assert.equal(st.crewIc.maxS, 15); assert.equal(st.crewIc.left, 4);
    await rejects(send('ci-crew', { dur: 20 }), 400, 'bad_length');
    await rejects(send('ci-crew', { aud: 'everyone' }), 403, 'not_your_audience');
    await rejects(send('ci-crew', { room: 'OTHR' }), 403, 'not_in_room');
    await rejects(send('ci-crew', { when: 'in10' }), 400, 'bad_time');
    await rejects(send('ci-pl'), 403, 'not_radio');
    const ic = (await send('ci-crew', { head: 'shout', dur: 14.9 })).intercom;
    assert.equal(ic.head, null, 'no headline from the crew'); assert.equal(ic.aud, 'room');
    assert.equal((await val(`rooms/CRIC/radio/${ic.id}`)).kind, 'intercom', 'the room\'s phones get it (its node)');
    assert.equal((await adminAction('ci-crew', { action: 'radioState', room: 'CRIC' }, tick())).intercom.length, 1, 'their own clip on their desk');
    await rejects(adminAction('ci-crew', { action: 'radioUnsend', id: ic.id }, tick()), 403, 'not_owner');
    // the per-room-per-night limit (4)
    for (let i = 0; i < 3; i++) await send('ci-crew');
    await rejects(send('ci-crew'), 429, 'ic_limit');
    // the clips go after the hour
    const { clipOf } = await import('../../api/_lib/radio.js');
    assert.ok(await clipOf(ic.id, clock + 1000));
    assert.equal(await clipOf(ic.id, clock + 3700e3), null, 'gone after an hour');
    // OFF again → refused
    await adminAction('ci-boss', { action: 'radioCrewIntercom', on: false }, tick());
    await ref('radio/limits').remove();
    await rejects(send('ci-crew'), 403, 'crew_ic_off');
    const aud = Object.values((await val('audit')) || {}).filter(a => a.act === 'crewIcOn' || a.act === 'crewIcOff');
    assert.equal(aud.length, 2, 'both flips audited');
  } finally { process.env.ADMIN_PIDS = ''; await ref('rooms/CRIC').remove(); await ref('rooms/OTHR').remove(); }
});
