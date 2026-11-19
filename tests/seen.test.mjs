// CITY I — SECOND ACCOUNTS, the pure half (api/_lib/seen-pure.js): the address key (IPv4 as is, IPv6 by its /64), the HMAC (never the raw
// address), the 14-day window, the 6-h refresh, the groups (accounts linked through any shared address).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addrKey, addrHash, seenPatch, seenGroups, SEEN_MS, SEEN_REFRESH_MS, SEEN_DAYS } from '../api/_lib/seen-pure.js';

const NOW = Date.UTC(2026, 10, 18, 20);
const DAY = 86_400_000;

test('the address key: IPv4 as it is, a mapped IPv4 unwrapped, an IPv6 by its /64 (a phone\'s privacy addresses rotate inside it)', () => {
  assert.equal(addrKey('203.0.113.7'), '203.0.113.7');
  assert.equal(addrKey('::ffff:203.0.113.7'), '203.0.113.7');
  assert.equal(addrKey('2001:db8:aa:bb:1111:2222:3333:4444'), addrKey('2001:0db8:00aa:00bb:9:8:7:6'));
  assert.equal(addrKey('2001:db8::1'), '2001:db8:0:0::/64');
  assert.equal(addrKey(''), '');
});

test('the stored key is an HMAC keyed by the pepper — never the address; another pepper = another key', () => {
  const h = addrHash('203.0.113.7', 'pep');
  assert.match(h, /^[0-9a-f]{24}$/);
  assert.ok(!h.includes('203'));
  assert.equal(h, addrHash('203.0.113.7', 'pep'));
  assert.notEqual(h, addrHash('203.0.113.7', 'other'));
  assert.notEqual(h, addrHash('203.0.113.8', 'pep'));
  assert.equal(addrHash('', 'pep'), '');
});

test(`the window: ${SEEN_DAYS} days kept; a sighting younger than 6 h writes nothing; a stale account is dropped at the next write`, () => {
  assert.deepEqual(seenPatch(null, 'pA', NOW), { pA: { f: NOW, l: NOW } });
  assert.equal(seenPatch({ pA: { f: NOW - DAY, l: NOW - SEEN_REFRESH_MS + 1000 } }, 'pA', NOW), null, 'fresh: nothing to write');
  assert.deepEqual(seenPatch({ pA: { f: NOW - DAY, l: NOW - SEEN_REFRESH_MS - 1 } }, 'pA', NOW), { pA: { f: NOW - DAY, l: NOW } }, 'the first sighting kept');
  assert.deepEqual(seenPatch({ pA: { f: 1, l: NOW - 1000 }, pOld: { f: 1, l: NOW - SEEN_MS - 1 } }, 'pA', NOW), { pOld: null }, 'a 15-day-old account dropped');
});

test('the groups: two accounts on one address = a group; linked through ANY shared address (home + work) = one group; a lone account = none; stale = none', () => {
  const seen = {
    home: { pA: { f: NOW - 5 * DAY, l: NOW - DAY }, pB: { f: NOW - 2 * DAY, l: NOW - 1000 } },
    work: { pB: { f: NOW - 3 * DAY, l: NOW - 2 * DAY }, pC: { f: NOW - DAY, l: NOW - 5000 } },
    cafe: { pD: { f: NOW - DAY, l: NOW - DAY } },
    old: { pE: { f: NOW - 30 * DAY, l: NOW - 20 * DAY }, pF: { f: NOW - 30 * DAY, l: NOW - 20 * DAY } },
    two: { pG: { f: NOW - DAY, l: NOW - DAY }, pH: { f: NOW - 2 * DAY, l: NOW - DAY } },
  };
  const g = seenGroups(seen, NOW);
  assert.equal(g.length, 2);
  assert.deepEqual(g[0].pids, ['pA', 'pB', 'pC'], 'A + B (home) and B + C (work) = one group, oldest first');
  assert.equal(g[0].first.pA, NOW - 5 * DAY);
  assert.equal(g[0].first.pB, NOW - 3 * DAY, 'first seen = the earliest on any address');
  assert.deepEqual(g[1].pids, ['pH', 'pG']);
  assert.ok(!g.some(x => x.pids.includes('pD')), 'a lone account is no group');
  assert.ok(!g.some(x => x.pids.includes('pE')), 'beyond the window: no group');
});

import { dropFlagged, countWithout, placeIn } from '../js/core/every.js';
test('DON\'T COUNT (PURE, js/core/every.js): the flagged rows out of the kept top — the places below move up; the viewer\'s own row stays; the N less the flagged finishers, never below the viewer\'s place', () => {
  const rows = [{ k: 'alt' }, { k: 'real' }, { k: 'third' }];
  const nc = new Set(['alt']);
  assert.equal(placeIn(dropFlagged(rows, nc, 'real'), 'real'), 1);
  assert.equal(placeIn(dropFlagged(rows, nc, 'alt'), 'alt'), 1, 'the flagged viewer keeps its own place');
  assert.deepEqual(dropFlagged(rows, new Set(), 'real'), rows);
  assert.equal(countWithout(3, 1, 1), 2);
  assert.equal(countWithout(3, 0, 1), 3);
  assert.equal(countWithout(1, 3, 1), 1, 'never below the viewer\'s place');
});
