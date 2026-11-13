// PLAY NOW — Group 2: WHO'S ON (js/core/whos-on.js — PURE; the server's list: api/_lib/radio.js#whosOnNow, tested in server.test.mjs). The
// builder: the rooms from the rooms (online members), the city + the dailies from the hellos inside the window, one row an account (the most
// telling place), guests counted; the lines the sheet shows; the UI refreshes only while open (no new idle poll — THE CITY'S IDLE POLLS).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { whosOn, whereLine, agoLine, guestLine, hereEntry, cleanWhere } from '../js/core/whos-on.js';

const NOW = 1_800_000_000_000, live = { v: 2, c: { a: NOW } };

test('the list: a room\'s ONLINE members from the room, a solo run, a daily (its own record), the city; sorted; one row an account', () => {
  const here = {
    u1: { at: NOW - 60e3, pid: 'pAAA', w: { k: 'city' } },
    u2: { at: NOW - 30e3, pid: 'pBBB', w: { k: 'daily', d: 'password' } },
    u3: { at: NOW - 30e3, pid: 'pCCC', w: { k: 'daily', d: 'coastclear' } },   // (its record says done → the city)
    u4: { at: NOW - 10e3, w: { k: 'city' } },                                   // a guest
    u5: NOW - 20e3,                                                             // the OLD shape (a bare time), a guest
    u6: { at: NOW - 30 * 60e3, pid: 'pOLD', w: { k: 'city' } },                // outside the window
    u7: { at: NOW - 5e3, pid: 'pDDD', w: { k: 'room' } },                       // in a room (the room decides — below)
    u9: { at: NOW - 5e3, pid: 'pAAA', w: { k: 'city' } },                       // AAA's second device
  };
  const rooms = {
    MINT: { meta: { status: 'playing', activeAt: NOW - 90e3 }, players: { u7: { pid: 'pDDD' }, u8: { pid: 'pEEE' }, g1: {} }, presence: { u7: live, u8: { v: 2 }, g1: live }, game: { id: 'prism' } },
    QZXJ: { meta: { status: 'playing', activeAt: NOW, settings: { solo: { on: true, g: 'overclock' } } }, players: { s1: { pid: 'pFFF' } }, presence: { s1: live }, game: { id: 'overclock' } },
    LOBB: { meta: { status: 'lobby', activeAt: NOW }, players: { l1: { pid: 'pGGG' } }, presence: { l1: { online: true } } },
  };
  const L = whosOn({ here, rooms, now: NOW, hereMs: 360e3, midDaily: (pid, d) => pid === 'pBBB' && d === 'password' });
  assert.equal(L.rows.length, 6, `six with a card (${L.rows.map(r => r.pid).join(', ')})`);
  const by = Object.fromEntries(L.rows.map(r => [r.pid, r]));
  assert.deepEqual(by.pDDD.where, { k: 'room', code: 'MINT', g: 'prism', p: 'playing' });
  assert.deepEqual(by.pGGG.where, { k: 'room', code: 'LOBB', g: null, p: 'lobby' }, 'a lobby: no game yet');
  assert.deepEqual(by.pFFF.where, { k: 'solo', g: 'overclock' });
  assert.deepEqual(by.pBBB.where, { k: 'daily', d: 'password' });
  assert.deepEqual(by.pCCC.where, { k: 'city' }, 'a daily whose record says done = the city');
  assert.ok(!by.pEEE, 'an OFFLINE room member is not on');
  assert.ok(!by.pOLD, 'outside the window');
  assert.equal(L.rows.filter(r => r.pid === 'pAAA').length, 1, 'one row an account (two devices)');
  assert.equal(by.pAAA.at, NOW - 5e3, 'the latest check-in of its devices');
  const order = L.rows.map(r => r.where.k);
  assert.deepEqual(order, [...order].sort((a, b) => ({ room: 0, solo: 0, daily: 1, city: 2 })[a] - ({ room: 0, solo: 0, daily: 1, city: 2 })[b]), 'rooms first, then the dailies, then the city');
  assert.deepEqual(L.guests, { city: 2, rooms: 1, daily: 0, n: 3 }, 'the guests counted (the city 2, a room 1) — never listed');
});

test('a room beats a daily beats the city for one account; the hello says only city / daily (a room is read from the rooms)', () => {
  const L = whosOn({ here: { a: { at: NOW, pid: 'pX', w: { k: 'daily', d: 'password' } } }, rooms: { ROOM: { meta: { status: 'lobby', activeAt: NOW }, players: { b: { pid: 'pX' } }, presence: { b: live } } }, now: NOW, midDaily: () => true });
  assert.equal(L.rows.length, 1); assert.equal(L.rows[0].where.k, 'room');
  assert.deepEqual(cleanWhere({ k: 'daily', d: 'password' }), { k: 'daily', d: 'password' });
  assert.deepEqual(cleanWhere({ k: 'daily', d: 'NOPE!' }), { k: 'city' });
  assert.deepEqual(cleanWhere({ k: 'room', code: 'MINT' }), { k: 'room' }, 'a phone never names its room — the rooms do');
  assert.deepEqual(cleanWhere(null), { k: 'city' });
  assert.deepEqual(hereEntry(5), { at: 5, pid: null, w: null }, 'the old bare time still reads');
  assert.equal(hereEntry({ pid: 'x' }), null);
});

test('the sheet\'s lines', () => {
  const N = { prism: 'PRISM DROP', overclock: 'OVERCLOCK', password: 'THE PASSWORD' };
  assert.equal(whereLine({ k: 'city' }, N), 'THE CITY');
  assert.equal(whereLine({ k: 'room', code: 'MINT', g: 'prism', p: 'playing' }, N), 'ROOM MINT · PRISM DROP');
  assert.equal(whereLine({ k: 'room', code: 'MINT', g: null, p: 'lobby' }, N), 'ROOM MINT · IN THE LOBBY');
  assert.equal(whereLine({ k: 'solo', g: 'overclock' }, N), 'SOLO · OVERCLOCK');
  assert.equal(whereLine({ k: 'daily', d: 'password' }, N), 'THE DAILY · THE PASSWORD');
  assert.equal(agoLine(NOW - 20e3, NOW), 'now'); assert.equal(agoLine(NOW - 3 * 60e3, NOW), '3 min ago'); assert.equal(agoLine(NOW - 2 * 3600e3, NOW), '2 h ago');
  assert.equal(guestLine({ city: 3, rooms: 0, daily: 0, n: 3 }), '+ 3 guests — 3 in the city');
  assert.equal(guestLine({ city: 0, rooms: 1, daily: 0, n: 1 }), '+ 1 guest — 1 in a room');
  assert.equal(guestLine({ n: 0 }), null);
});

test('no new idle poll: the list refreshes every 30 s ONLY while it is open + on screen; the hello carries where (the same call)', () => {
  const ui = readFileSync('js/ui/whos-on.js', 'utf8');
  assert.match(ui, /export const WHO_REFRESH_MS = 30e3;/);
  assert.match(ui, /if \(!el\.isConnected\) \{ destroy\(\); return; \}/, 'the timer ends with the block');
  assert.match(ui, /if \(onScreen\(\)\) refresh\(\);/);
  assert.match(ui, /onClose: \(\) => B\.destroy\(\)/);
  assert.match(readFileSync('js/screens/harbor/radio-ledger.js', 'utf8'), /h\('button\.rd-who'[\s\S]{0,300}m\.openWhosOn\(\{ api, openSheet \}\)/, 'IN THE CITY → WHO\'S ON');
  assert.match(readFileSync('js/admin/admin.js', 'utf8'), /m\.whosOnBlock\(\{ api \}\)/, '/admin STATS: the same builder');
  const radio = readFileSync('api/_lib/radio.js', 'utf8');
  assert.match(radio, /if \(body\.action === 'radioWhosOn'\) \{ need\(rolePower\(role, 'whoson'\), 'not_owner'\); return whosOnNow\(now\); \}/, 'the owner ROLE checked on the server');
  assert.match(radio, /card: publicRow\(r\.pid, profs\[i\]\)/, 'THE BOARD\'s public fields — never a pid');
});
