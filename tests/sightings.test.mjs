// PROGRESSION B — CITY SIGHTINGS: the PURE verifier (core/sightings.js) + the MATCHED PAIRS through the award engine. Every legendary
// found on its real timetable and claimed; forged times, a &force= preview's time, the zone, the queue; the radio: the owner's once a day,
// JUST ME + the crew never.
import '../api/_lib/catalog.js';   // (THE VAULT 1B: the server-only catalog — names, rewards, achievements)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verifySighting, skyWindows, balloonFlights, SIGHTINGS, SIGHTING_IDS, QUEUE_MS, nth, localDay } from '../js/core/sightings.js';
import { LEGENDARIES } from '../js/core/achievements.js';
import { eventStep } from '../js/core/progress.js';
import { ITEM } from '../js/core/items.js';
import { legendsTonight } from '../js/core/harbor-showcase.js';
import { ghostShipTimes } from '../js/core/harbor-holiday.js';
import { auroraNight2 } from '../js/core/harbor-sky.js';
import { fireballOf } from '../js/core/harbor-fireball.js';
import { kindsOf } from '../js/core/harbor-balloon-kinds.js';
import { localParts } from '../js/core/sky.js';
import { CHASE } from '../js/core/harbor-legend.js';

const TZ = 'America/Detroit', GR = { lat: 43, lon: -85.5 };
/** the absolute ms of an evening's local hour h (25 = 1 am) in TZ */
function evMs(y, m, d, h) {
  let g = Date.UTC(y, m - 1, d, 0, 0, 0) + h * 3600e3;
  for (let i = 0; i < 3; i++) g = Date.UTC(y, m - 1, d, 0, 0, 0) + h * 3600e3 - localParts(g, TZ).off * 60e3;
  return g;
}
/** the first evening from a date with a legendary of `kind` → its start (ms) */
function findLegend(kind, from = [2026, 11, 1]) {
  for (let i = 0; i < 400; i++) {
    const dt = new Date(Date.UTC(from[0], from[1] - 1, from[2]) + i * 864e5), y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate();
    const L = legendsTonight(y, m, d, 'high').find(x => x.kind === kind);
    if (L) return { at: evMs(y, m, d, L.h), L, y, m, d };
  }
  throw new Error(`no ${kind}`);
}
const claim = (id, t, extra = {}) => verifySighting({ id, t, tz: TZ }, { now: t + 1500, ipTz: TZ, place: GR, level: 'high', ...extra });

test('every sighting has its row, its LEGENDARIES id, its MATCHED PAIR in the catalog (legendary card + emblem)', () => {
  assert.deepEqual([...SIGHTING_IDS].sort(), [...LEGENDARIES].sort());
  for (const s of SIGHTINGS) {
    assert.ok(ITEM[s.card] && ITEM[s.card].kind === 'card' && ITEM[s.card].tier === 'legendary', s.card);
    assert.ok(ITEM[s.emblem] && ITEM[s.emblem].kind === 'emblem', s.emblem);
    assert.equal(s.name, undefined, 'THE VAULT 1B: no names in the site code — the card item (server-only) carries it');
  }
  assert.equal(ITEM['card-sg-btc'].name, 'FIX THE MONEY, FIX THE WORLD');
});

for (const kind of ['ufo', 'tr3b', 'blackbird', 'flyby']) {
  test(`THE TIMETABLE: a tap on tonight's ${kind} counts while it's up — and not 5 min after, not before`, () => {
    const id = kind === 'flyby' ? 'f22' : kind, { at, L } = findLegend(kind);
    const r = claim(id, at + 3000);
    assert.equal(r.ok, true, JSON.stringify(r)); assert.equal(r.via, 'sky');
    assert.equal(claim(id, at + 3000).key, r.key, 'the same appearance = the same key (counted once)');
    assert.equal(claim(id, at + L.len * 1000 + 300e3).ok, false);
    assert.equal(claim(id, at - 120e3).why, 'not_on_screen');
  });
}

test('the F-22s + the Blackbird in the TR-3B\'s chase count; the F-22s before the chase do not', () => {
  const { at } = findLegend('tr3b');
  assert.equal(claim('f22', at + (CHASE.t0 + 1) * 1000).ok, true);
  assert.equal(claim('blackbird', at + (CHASE.t0 + 2) * 1000).ok, true);
  assert.equal(claim('f22', at + 5000).ok, false, 'the craft alone is crossing: no jets yet');
});

test('FORGED: a time in the future, a stale queue, a bad zone, a zone far from the IP\'s, an unknown id', () => {
  const { at } = findLegend('ufo');
  assert.equal(verifySighting({ id: 'ufo', t: at + 60e3, tz: TZ }, { now: at, ipTz: TZ }).why, 'future');
  assert.equal(verifySighting({ id: 'ufo', t: at + 3000, tz: TZ }, { now: at + QUEUE_MS + 60e3, ipTz: TZ }).why, 'stale');
  assert.equal(verifySighting({ id: 'ufo', t: at + 3000, tz: 'Mars/Olympus' }, { now: at + 4000 }).why, 'tz');
  assert.equal(verifySighting({ id: 'ufo', t: at + 3000, tz: 'Asia/Tokyo' }, { now: at + 4000, ipTz: TZ }).why, 'place');
  assert.equal(verifySighting({ id: 'ufo', t: at + 3000, tz: 'America/Chicago' }, { now: at + 4000, ipTz: TZ }).ok, false, 'Chicago\'s UFO is an hour later');
  assert.equal(verifySighting({ id: 'moon', t: at, tz: TZ }, { now: at }).why, 'unknown');
  // a QUEUED claim (offline) within the queue's 12 h still counts
  assert.equal(verifySighting({ id: 'ufo', t: at + 3000, tz: TZ }, { now: at + 6 * 3600e3, ipTz: TZ }).ok, true);
});

test('A &force= / &lgnow= PREVIEW never counts: the timetable says nothing was there', () => {
  // (a forced UFO at noon on a weekday: whatever the page showed, the server finds nothing)
  const t = evMs(2026, 11, 4, 12.5);
  assert.equal(claim('ufo', t).why, 'not_on_screen');
  assert.equal(claim('tr3b', t).why, 'not_on_screen');
});

test('THE GHOST SHIP: Halloween night\'s two crossings only', () => {
  const [h] = ghostShipTimes(2026), at = evMs(2026, 10, 31, h);
  assert.equal(claim('ghostship', at + 30e3).ok, true);
  assert.equal(claim('ghostship', at - 600e3).ok, false);
  assert.equal(claim('ghostship', evMs(2026, 11, 1, h) + 30e3).ok, false, 'Nov 1: none');
});

test('THE AURORA: its seeded nights after dark (+ a real Kp ≥ 7 storm), never by day', () => {
  let n = null;
  for (let i = 0; i < 200 && !n; i++) { const dt = new Date(Date.UTC(2026, 10, 1) + i * 864e5); if (auroraNight2(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())) n = [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()]; }
  assert.ok(n);
  assert.equal(claim('aurora', evMs(...n, 23)).ok, true);
  assert.equal(claim('aurora', evMs(...n, 14)).ok, false, 'by day');
  // a storm night: any night, from NOAA's blocks
  const t = evMs(2026, 11, 3, 23), plain = claim('aurora', t);
  const kp = [[t - 3600e3, 7.7]];
  if (!plain.ok) assert.equal(claim('aurora', t, { kp }).ok, true);
});

test('THE FIREBALL: its seeded minute (a few nights a year), the same in every phone of a zone', () => {
  let f = null, ev = null;
  for (let i = 0; i < 1000 && !f; i++) { const dt = new Date(Date.UTC(2026, 10, 1) + i * 864e5); ev = [dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()]; f = fireballOf(...ev); }
  assert.ok(f);
  const at = evMs(...ev, f.h);
  assert.equal(claim('fireball', at + 1500).ok, true);
  assert.equal(claim('fireball', at + 60e3).ok, false);
  let n = 0; for (let i = 0; i < 3650; i++) { const dt = new Date(Date.UTC(2026, 0, 1) + i * 864e5); if (fireballOf(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())) n++; }
  assert.ok(n / 10 > 1 && n / 10 < 6, `${n / 10} a year`);
});

test('THE BALLOONS: the scheduler replayed at the place — a flight with a ₿ / the skull counts while it flies; one without does not', () => {
  let found = { skull: null, btc: null }, miss = null;
  for (let day = 0; day < 120 && (!found.skull || !found.btc || !miss); day++) for (const h of [7.5, 8.5, 9.5, 19.5]) {
    const t = evMs(2026, 6, 1 + day, h); const fl = balloonFlights(t, TZ, GR);
    for (const f of fl) {
      const k = kindsOf(f.seed, f.festival), at = f.start + 120e3;
      if (!found.skull && k.includes('skull')) found.skull = at;
      if (!found.btc && k.some(x => x === 'bitcoin' || x === 'btc-orange')) found.btc = at;
      if (!miss && !k.includes('skull') && !k.includes('bitcoin') && !k.includes('btc-orange')) miss = at;
    }
  }
  assert.ok(found.skull && found.btc && miss, JSON.stringify(found));
  assert.equal(claim('skull', found.skull).ok, true);
  assert.equal(claim('btc', found.btc).ok, true);
  if (!balloonFlights(miss, TZ, GR).some(f => kindsOf(f.seed, f.festival).includes('skull'))) assert.equal(claim('skull', miss).ok, false);
  assert.equal(claim('skull', evMs(2026, 12, 15, 3)).ok, false, 'no flight at 3 am in December');
});

test('THE WATCHER\'s Blackbird: 55 min on the server\'s clock, once a day', () => {
  const t = evMs(2026, 11, 4, 15);
  assert.equal(claim('blackbird', t, { watchStart: t - 20 * 60e3 }).ok, false);
  const r = claim('blackbird', t, { watchStart: t - 62 * 60e3 });
  assert.equal(r.ok, true); assert.match(r.key, /watcher@/);
});

test('THE RADIO: the OWNER\'s moment to EVERYONE / a room the player is in counts (once a day); JUST ME + the CREW never', () => {
  const t = evMs(2026, 11, 4, 13);           // (a weekday lunchtime: nothing on the timetable)
  const f = (o) => ({ id: '-Nabc', jack: 'flyby', at: t - 2000, until: t + 20000, len: 22, made: t - 3000, aud: 'everyone', role: 'owner', sight: true, ...o });
  const r = claim('f22', t, { fired: [f()] });
  assert.equal(r.ok, true); assert.equal(r.via, 'radio'); assert.equal(r.day, `radio:${localDay(t, TZ)}`);
  assert.equal(claim('f22', t, { fired: [f({ aud: 'room', room: 'BEAR' })] }).ok, false, 'a room the player isn\'t in');
  assert.equal(claim('f22', t, { fired: [f({ aud: 'room', room: 'BEAR' })], rooms: ['BEAR'] }).ok, true);
  assert.equal(claim('f22', t, { fired: [f({ aud: 'me', sight: false })] }).why, 'preview');
  assert.equal(claim('f22', t, { fired: [f({ role: 'crew', sight: false, aud: 'room', room: 'BEAR' })], rooms: ['BEAR'] }).why, 'crew');
  assert.equal(claim('ufo', t, { fired: [f()] }).ok, false, 'a flyby is not a UFO');
  // AT A TIME: the viewer's own local hour
  const lc = localParts(t, TZ);
  assert.equal(claim('f22', t + 5000, { fired: [f({ at: t + 9e6, until: t + 9e6 + 22e3, local: { h: lc.h, mi: lc.mi } })] }).ok, true);
  // the radio's balloons fly the everyday line-up of seed 3: no ₿ / skull from the radio
  assert.equal(claim('btc', t, { fired: [f({ jack: 'balloons', len: 600 })] }).ok, kindsOf(3, false).some(k => k === 'bitcoin' || k === 'btc-orange'));
});

test('THE AWARD: a first sighting → its MATCHED PAIR; again → counted, nothing new; STARGAZER at 3, FREQUENT FLYER at 25, THE WITNESS at all', () => {
  let s = { g: { cipher: { p: 1 } } }, now = 1e12;
  const a = eventStep(s, { k: 'sighting', id: 'ufo' }, now);
  assert.ok(a.items.includes('card-sg-ufo') && a.items.includes('emb-sg-ufo'), a.items.join());
  s = a.next;
  const b = eventStep(s, { k: 'sighting', id: 'ufo' }, now + 1);
  assert.deepEqual(b.items, []); assert.equal(b.next.pa.sg.ufo, 2); s = b.next;
  s = eventStep(s, { k: 'sighting', id: 'tr3b' }, now + 2).next;
  const c = eventStep(s, { k: 'sighting', id: 'aurora' }, now + 3);
  assert.ok(c.ach.includes('stargazer')); s = c.next;
  for (let i = 0; i < 25; i++) s = eventStep(s, { k: 'sighting', id: 'ufo' }, now + 10 + i).next;
  assert.ok(s.ac['frequent-flyer']);
  let last = null; for (const id of LEGENDARIES) { last = eventStep(s, { k: 'sighting', id }, now + 100); s = last.next; }
  assert.ok(s.ac['the-witness'] && s.it['card-witness']);
  for (const id of LEGENDARIES) assert.ok(s.it[`card-sg-${id}`] && s.it[`emb-sg-${id}`], id);
});

test('nth', () => { assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(nth), ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st']); });
