// HE8 — THE OWNER'S LIVE TEST (docs/holdem.md "HE8"): while HOLD'EM is `playable: false`, ONLY the owner's phone (the radio gate's server
// yes — radioWho, ADMIN_PIDS) gets HOLD'EM in its room's game list (with a TEST tag) + its host start; every other phone sees nothing new.
// The server re-checks the host on every start (api/_lib/holdem-store.js#startOpen — tests/integration/holdem-server.test.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { GAMES, isPlayable, isOwnerTest, setOwnerPhone } from '../js/config.js';

const src = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
function walk(dir, out = []) {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else if (/\.(m?js|html)$/.test(f)) out.push(p.replace(/\\/g, '/')); }
  return out;
}

test('a normal phone: HOLD’EM is not playable, not offered, not a test', () => {
  setOwnerPhone(false);
  const row = GAMES.find(g => g.id === 'holdem');
  assert.equal(row.playable, false, 'HOLD’EM still ships playable: false');
  assert.equal(row.sign, undefined, 'no city sign');
  assert.equal(isPlayable('holdem'), false);
  assert.equal(isOwnerTest('holdem'), false);
  for (const g of GAMES) assert.equal(isOwnerTest(g.id), false, g.id);
});

test('the owner’s phone: HOLD’EM (preview) is his TEST + startable; the other hidden games stay hidden; a playable game is never a TEST', () => {
  setOwnerPhone(true);
  try {
    assert.equal(isOwnerTest('holdem'), true);
    assert.equal(isPlayable('holdem'), true);
    for (const g of GAMES.filter(x => !x.preview)) {
      assert.equal(isOwnerTest(g.id), false, `${g.id} is never a TEST`);
      assert.equal(isPlayable(g.id), !!g.playable, `${g.id} unchanged`);
    }
  } finally { setOwnerPhone(false); }
});

test('only the radio gate sets it (an OWNER role — never the crew); only the room’s HOST game list reads it', () => {
  const files = walk('js');
  const setters = files.filter(f => /setOwnerPhone\(/.test(readFileSync(f, 'utf8')) && !f.endsWith('js/config.js'));
  assert.deepEqual(setters, ['js/screens/harbor/radio-gate.js']);
  assert.match(src('js/screens/harbor/radio-gate.js'), /setOwnerPhone\(role === 'owner'\)/);
  const readers = files.filter(f => /isOwnerTest\(/.test(readFileSync(f, 'utf8')) && !f.endsWith('js/config.js'));
  assert.deepEqual(readers, ['js/screens/room-city.js'], 'no sign, board, catalog, help or city reads it');
  const rc = src('js/screens/room-city.js');
  assert.match(rc, /GAMES\.filter\(g => g\.playable \|\| \(asHost && isOwnerTest\(g\.id\)\)\)/, 'the host’s list only');
  assert.match(rc, /'TEST'/);
});

test('the server gate is the one that counts: the dealer’s start refuses a non-owner host while HOLD’EM isn’t playable', () => {
  const s = src('api/_lib/holdem-store.js');
  assert.match(s, /op === 'start' && !\(await startOpen\(uid\)\)\) throw new ApiError\(403, 'not_open'/);
  assert.match(s, /if \(row && row\.playable\) return true;/);
  assert.match(s, /adminPids\(\)\.includes\(pid\)/);
  assert.match(s, /if \(!emulated\(\)\) return false;/, 'production: nobody else');
});
