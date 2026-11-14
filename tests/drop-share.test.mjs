// THE DROP B — THE SHARE CARD's PURE half (js/games/drop/share.js): every junk row drawn SOLID (the day's holes never reach a picture), the card's
// only inputs, the time + the line; THE TICKET's per-id ink table (js/daily/ticket-art.js) — THE DROP told apart from the other two.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solidJunk, dropInputs, timeOf, shareLine, SHARE_KEYS } from '../js/games/drop/share.js';
import { TICKET_ART, TICKET_INK, inkOf, stampInkOf } from '../js/daily/ticket-art.js';
import { dailyRow } from '../js/core/daily.js';

const rows = list => list.slice().reverse().join('');   // (top → bottom as drawn → the board string, bottom row first)

test('solidJunk: a row with a junk cell is drawn solid (its hole filled); a piece row keeps its gaps; the board stays 10 wide', () => {
  const b = rows(['1100033300', '0600000700', '8888088888', '8808888888']);
  const s = solidJunk(b).match(/.{10}/g);
  assert.deepEqual(s, ['8888888888', '8888888888', '0600000700', '1100033300']);
  assert.equal(solidJunk(''), '');
  assert.equal(solidJunk('88880888'), '88888888', 'a short last row is still filled');
  assert.ok(solidJunk('8'.repeat(400)).length <= 200, 'never past the visible board');
});

test('dropInputs: only the card\'s keys, cleaned; the board\'s holes always filled — whatever the caller passes', () => {
  const I = dropInputs({ t: 312400, ln: 17, b: rows(['8888088888']), day: 'd20261113', pid: 'P_secret', name: 'BEN', log: 'X' });
  assert.deepEqual(Object.keys(I).sort(), [...SHARE_KEYS].sort());
  assert.equal(I.b, '8888888888');
  assert.equal(dropInputs({ t: 9e9 }).t, 480000, 'the time capped at THE END');
  assert.equal(dropInputs({ day: 'tomorrow' }).day, null);
});

test('the time + the plain line: 5:12.4 · THE END at 8:00 · no emoji, the site', () => {
  assert.equal(timeOf(312400), '5:12.4');
  assert.equal(timeOf(480000), '8:00');
  assert.equal(shareLine({ t: 312400, ln: 17, day: 'd20261113' }), 'THE DROP · FRI NOV 13 · 5:12.4 · 17 LINES · https://neonspeakeasy.com');
  assert.equal(shareLine({ t: 480000, ln: 1, day: 'd20261113' }), 'THE DROP · FRI NOV 13 · 8:00 · THE END · 1 LINE · https://neonspeakeasy.com');
});

test('THE TICKET: THE DROP has its own art (the prism + the split light) + its own ink, night and day, distinct from THE PASSWORD + COAST CLEAR', () => {
  assert.equal(dailyRow('drop').ticket, 'drop');
  assert.ok(TICKET_ART.drop && /class="sp"/.test(TICKET_ART.drop), 'the prism\'s spectral tubes');
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const far = (a, b) => Math.hypot(...hex(a).map((v, i) => v - hex(b)[i])) > 90;
  for (const look of ['night', 'day']) for (const other of ['password', 'coastclear']) assert.ok(far(inkOf('drop', look), inkOf(other, look)), `${look}: THE DROP's ink vs ${other}'s`);
  assert.equal(stampInkOf('drop', 'night'), TICKET_INK.drop.stamp);
  assert.equal(stampInkOf('drop', 'day'), TICKET_INK.drop.day);
  assert.equal(inkOf('nope', 'night'), '#ff6fc8', 'an unknown key = the house pink');
});
