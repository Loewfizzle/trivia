// PROGRESSION B on the emulators (/api, no browser): CITY SIGHTINGS (the server's verdict, one count per appearance, the MATCHED PAIR, the
// radio's owner-fired once a day, the crew never), BIRTHDAYS (private, once a year, MANY HAPPY RETURNS on the day only, the room's dormant
// skywrite), CALL IN A FAVOR (the token spent only when the radio accepts).
//   cd tests/integration && node --test sightings.test.mjs        (the emulators running)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.ADMIN_PIDS = '';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { pushPrefix } from '../../api/_lib/sightings.js';
import { legendsTonight } from '../../js/core/harbor-showcase.js';
import { localParts } from '../../js/core/sky.js';

const TZ = 'America/New_York';
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'pcount', 'progress', 'radio', 'city2'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); await ref('city2/showcase').set('high'); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} (${e.message})`); if (code) assert.equal(e.code, code); return; }
  assert.fail(`expected ${status} ${code}`);
};
/** an evening's local hour h in TZ → ms */
function evMs(y, m, d, h) { let g = Date.UTC(y, m - 1, d) + h * 3600e3; for (let i = 0; i < 3; i++) g = Date.UTC(y, m - 1, d) + h * 3600e3 - localParts(g, TZ).off * 60e3; return g; }
function firstLegend(kind) {
  for (let i = 0; i < 200; i++) { const dt = new Date(Date.UTC(2026, 10, 1) + i * 864e5), y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate(); const L = legendsTonight(y, m, d, 'high').find(x => x.kind === kind); if (L) return evMs(y, m, d, L.h); }
  throw new Error(kind);
}
const claim = (uid, id, t, now = t + 2000, extra = {}) => profileAction(uid, { action: 'sighting', id, t, tz: TZ, ipTz: TZ, ...extra }, '', now);

test('CITY SIGHTINGS: a tap the timetable agrees with counts ONCE per appearance + unlocks the MATCHED PAIR; a forged one never', async () => {
  const at = firstLegend('ufo');
  const a = await ensure('sg-ann', 'Ann', at - 3600e3);
  const r = await claim('sg-ann', 'ufo', at + 4000);
  assert.equal(r.ok, true, JSON.stringify(r)); assert.equal(r.counted, true); assert.equal(r.first, true); assert.equal(r.n, 1);
  assert.ok(r.items.includes('card-sg-ufo') && r.items.includes('emb-sg-ufo'));
  const st = await val(`pstats/${a.pid}`);
  assert.ok(st.it['card-sg-ufo'] && st.it['emb-sg-ufo']); assert.equal(st.pa.sg.ufo, 1);
  assert.equal(await val('pcount/i/card-sg-ufo'), 1, 'X% counted');
  // the same UFO tapped again: a reaction, never a second count
  const again = await claim('sg-ann', 'ufo', at + 9000);
  assert.equal(again.ok, true); assert.equal(again.counted, false); assert.equal(again.again, true);
  assert.equal((await val(`pstats/${a.pid}/pa/sg/ufo`)), 1);
  // forged: off the timetable / from the future / an unknown id
  assert.equal((await claim('sg-ann', 'tr3b', at + 4000)).why, 'not_on_screen');
  assert.equal((await claim('sg-ann', 'ufo', at + 120e3, at + 4000)).why, 'future');
  assert.equal((await claim('sg-ann', 'moon', at)).why, 'unknown');
  assert.equal((await claim('sg-ann', 'ufo', at + 4000, at + 4000, { tz: 'Asia/Tokyo' })).why, 'place');
  // the client never wrote any of it (the rules test proves it can't): the counts are the server's
  assert.ok(await val(`ppriv/${a.pid}/sgk`));
});

test('THE RADIO: the OWNER\'s moment counts once a day per player; the CREW\'s never; JUST ME never', async () => {
  const t = evMs(2026, 11, 4, 13);      // (a weekday lunchtime: nothing on the timetable)
  const b = await ensure('sg-bob', 'Bob', t - 3600e3);
  const fire = (id, o) => ref(`radio/fired/${pushPrefix(t - 3000)}${id}`).set({ jack: 'flyby', at: t - 2000, until: t + 20000, len: 22, made: t - 3000, aud: 'everyone', room: null, role: 'owner', by: 'pOWNER', sight: true, ...o });
  await fire('AAAA', {});
  const r = await claim('sg-bob', 'f22', t);
  assert.equal(r.ok, true, JSON.stringify(r)); assert.equal(r.via, 'radio'); assert.equal(r.first, true);
  await fire('BBBB', { jack: 'blackbird', at: t + 60e3, until: t + 85e3, made: t + 1000 });
  assert.equal((await claim('sg-bob', 'blackbird', t + 65e3)).why, 'radio_today', 'once a day');
  await ref('radio/fired').remove();
  await fire('CCCC', { role: 'crew', sight: false, aud: 'room', room: 'BEAR' });
  await ref('rooms/BEAR/players/sg-bob').set({ name: 'Bob', color: 'cyan', avatar: 'bolt', joinedAt: t });
  assert.equal((await claim('sg-bob', 'f22', t + 2 * 864e5, t + 2 * 864e5 + 1000)).ok, false);
  const crew = await claim('sg-bob', 'f22', t);
  assert.equal(crew.ok === true && crew.via === 'radio', false, 'the crew\'s moment never counts');
  await ref('radio/fired').remove();
  await fire('DDDD', { aud: 'me', sight: false });
  assert.equal((await claim('sg-bob', 'f22', t + 1000)).ok === true && false, false);
  assert.equal(b.pid.length > 4, true);
});

test('BIRTHDAYS: month + day, private, once a year; MANY HAPPY RETURNS only on the day; the room\'s skywrite once a day (dormant)', async () => {
  const now = Date.UTC(2026, 10, 3, 18);   // Nov 3, 1 pm in New York
  const c = await ensure('sg-cat', 'Cat', now - 864e5);
  const s = await profileAction('sg-cat', { action: 'birthday', m: 11, d: 3 }, '', now);
  assert.deepEqual(s.bd, { m: 11, d: 3 });
  assert.deepEqual(await val(`ppriv/${c.pid}/bd/m`), 11);
  assert.equal((await val(`profiles/${c.pid}`)).bd, undefined, 'never on the public profile');
  await rejects(profileAction('sg-cat', { action: 'birthday', m: 12, d: 25 }, '', now + 864e5), 429, 'once_a_year');
  await rejects(profileAction('sg-cat', { action: 'birthday', m: 2, d: 30 }, '', now), 400, 'bad_day');
  const me = await profileAction('sg-cat', { action: 'me' }, '', now);
  assert.deepEqual(me.priv.bd, { m: 11, d: 3 }); assert.ok(me.priv.bdAt > now);
  // not the day → nothing
  const no = await profileAction('sg-cat', { action: 'event', ev: 'birthday', tz: TZ, ipTz: TZ }, '', now - 3 * 864e5);
  assert.equal(no.why, 'not_today');
  const yes = await profileAction('sg-cat', { action: 'event', ev: 'birthday', tz: TZ, ipTz: TZ }, '', now);
  assert.ok(yes.ach.includes('many-happy-returns'), JSON.stringify(yes));
  // the room's copy (rooms/{CODE}/radio — written by the server; the lobby plays it once LOBBY 2.0 makes it the live city)
  await ref('rooms/WISH').set({ meta: { hostId: 'sg-cat', status: 'lobby', createdAt: now }, players: { 'sg-cat': { name: 'Cat', color: 'cyan', avatar: 'bolt', joinedAt: now } } });
  const rm = await profileAction('sg-cat', { action: 'birthdayRoom', room: 'WISH', tz: TZ, ipTz: TZ }, '', now);
  assert.equal(rm.ok, true); assert.equal(rm.moment.text, 'HAPPY BDAY CAT');
  const radio = await val('rooms/WISH/radio');
  assert.equal(Object.values(radio).length, 1);
  assert.equal((await profileAction('sg-cat', { action: 'birthdayRoom', room: 'WISH', tz: TZ, ipTz: TZ }, '', now + 60e3)).again, true, 'once a day a room');
  await rejects(profileAction('sg-cat', { action: 'birthdayRoom', room: 'NOPE', tz: TZ, ipTz: TZ }, '', now), 403, 'not_in_room');
});

test('CALL IN A FAVOR: no token → refused; a token fires one crew jack for the room + is spent; a refusal hands it back', async () => {
  const now = Date.UTC(2026, 10, 10, 1, 0);   // 8 pm in New York (after dark)
  const d = await ensure('sg-dan', 'Dan', now - 864e5);
  await ref('rooms/PART').set({ meta: { hostId: 'sg-dan', status: 'lobby', createdAt: now }, players: { 'sg-dan': { name: 'Dan', color: 'cyan', avatar: 'bolt', joinedAt: now } } });
  await rejects(profileAction('sg-dan', { action: 'favor', jack: 'fireworks', room: 'PART' }, '', now), 409, 'no_favor');
  await ref(`pstats/${d.pid}/fv`).set(1);
  // a jack the crew doesn't have → refused, the token back
  await rejects(profileAction('sg-dan', { action: 'favor', jack: 'party', room: 'PART' }, '', now), 403, 'not_your_jack');
  assert.equal(await val(`pstats/${d.pid}/fv`), 1, 'handed back');
  await rejects(profileAction('sg-dan', { action: 'favor', jack: 'fireworks', room: 'NONE' }, '', now), 404, 'no_room');
  assert.equal(await val(`pstats/${d.pid}/fv`), 1);
  const r = await profileAction('sg-dan', { action: 'favor', jack: 'fireworks', room: 'PART' }, '', now);
  assert.equal(r.spent, true); assert.equal(r.moment.role, 'favor'); assert.equal(r.moment.aud, 'room');
  assert.equal(await val(`pstats/${d.pid}/fv`), 0);
  const pub = Object.values(await val('rooms/PART/radio'));
  assert.equal(pub.length, 1); assert.equal(pub[0].by, 'favor');
  // (FR6 FIXES A: THIS favor's own record — radio/fired keeps the earlier RADIO test's owner moment too, so [0] read the wrong one)
  const rec = await val(`radio/fired/${r.moment.id}`);
  assert.equal(rec.role, 'favor'); assert.equal(rec.sight, false, 'never a sighting');
});
