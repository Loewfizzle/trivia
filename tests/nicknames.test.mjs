// BNAME — THE HOUSE NICKNAMES (js/core/nicknames.js): ~200 of them, every word through the board-name filter, none a first
// name, the same id → the same nickname, junk → a fixed one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { NICK_ADJ, NICK_NOUN, houseNick, isBoardId } from '../js/core/nicknames.js';
import { isOffensive } from '../js/core/names.js';

test('every nickname passes the names filter; ~200 of them; no duplicates', () => {
  assert.ok(NICK_ADJ.length * NICK_NOUN.length >= 200);
  assert.equal(new Set(NICK_ADJ).size, NICK_ADJ.length);
  assert.equal(new Set(NICK_NOUN).size, NICK_NOUN.length);
  for (const a of NICK_ADJ) for (const n of NICK_NOUN) {
    assert.ok(!isOffensive(`${a} ${n}`), `${a} ${n}`);
    assert.ok(!isOffensive(`${a}${n}`), `${a}${n}`);
    assert.ok(`${a} ${n}`.length <= 16, 'fits the row');
  }
  // never a real-name look: no common first names among the words
  for (const w of [...NICK_ADJ, ...NICK_NOUN]) assert.ok(!['jack', 'max', 'rose', 'ruby', 'frank', 'ray', 'bill', 'joe', 'lucy'].includes(w.toLowerCase()), w);
});

test('the same board id → the same nickname; the ids spread over the list', () => {
  const id = 'a3f09c11be7d4402';
  assert.ok(isBoardId(id));
  assert.deepEqual(houseNick(id), houseNick(id));
  assert.match(houseNick(id).t, /^\d{4}$/);
  assert.ok(!isBoardId('A3F09C11BE7D4402') && !isBoardId('pmike0000000') && !isBoardId(''));
  assert.deepEqual(houseNick('junk'), houseNick('0000000000000000'));
  const seen = new Set();
  for (let i = 0; i < 2000; i++) seen.add(houseNick((i * 2654435761 >>> 0).toString(16).padStart(8, '0') + (i * 40503 >>> 0).toString(16).padStart(8, '0').slice(0, 8)).n);
  assert.ok(seen.size > 150, `spread: ${seen.size}`);
});
