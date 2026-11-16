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

// HE10 (Nov 11 2026 — Ben): HOLD'EM IS ON FOR EVERYONE. The gate's code stays (for the next game being built) — and stops mattering for it:
test('HE10 — HOLD’EM is ON: playable for every phone, never a TEST (the tag disappears), its city sign since HOLD’EM IN THE CITY', () => {
  const row = GAMES.find(g => g.id === 'holdem');
  for (const owner of [false, true]) {
    setOwnerPhone(owner);
    try {
      assert.equal(row.playable, true, 'HOLD’EM ships playable: true');
      assert.ok(row.playable === true, 'its city sign comes from signRoster (playable) — FIXES R2: the `sign` flag is gone');
      assert.equal(isPlayable('holdem'), true);
      assert.equal(isOwnerTest('holdem'), false, 'never a TEST once playable');
      for (const g of GAMES) {
        // (JAYWALK H1: a game IS being built again — `preview`: a TEST on the owner's phone only, never playable for anyone else)
        assert.equal(isOwnerTest(g.id), owner && !!g.preview && !g.playable, `${g.id}: a TEST only while it is being built, only on the owner's phone`);
        assert.equal(isPlayable(g.id), !!g.playable || (owner && !!g.preview), `${g.id}: the one switch (+ the owner's live test of a game being built)`);
      }
    } finally { setOwnerPhone(false); }
  }
});

test('only the radio gate sets it (an OWNER role — never the crew); only the room’s HOST game list reads it', () => {
  const files = walk('js');
  const setters = files.filter(f => /setOwnerPhone\(/.test(readFileSync(f, 'utf8')) && !f.endsWith('js/config.js'));
  assert.deepEqual(setters, ['js/screens/harbor/radio-gate.js']);
  assert.match(src('js/screens/harbor/radio-gate.js'), /setOwnerPhone\(role === 'owner'\)/);
  const readers = files.filter(f => /isOwnerTest\(/.test(readFileSync(f, 'utf8')) && !f.endsWith('js/config.js'));
  // (JAYWALK H3: + the title's own PLAY shelf + the game's sign → its CARD with PLAY NOW — on the owner's phone only; nobody else's list, sign or card changes)
  assert.deepEqual(readers, ['js/screens/room-city.js', 'js/screens/title-taps.js'], 'no board, catalog or help reads it');
  const taps = src('js/screens/title-taps.js');
  assert.equal((taps.match(/isOwnerTest\(/g) || []).length, 3, 'the shelf\'s list, its · TEST mark, the sign\'s tap — nothing else');
  const rc = src('js/screens/room-city.js');
  assert.match(rc, /GAMES\.filter\(g => g\.playable \|\| \(asHost && isOwnerTest\(g\.id\)\)\)/, 'the host’s list only');
  assert.match(rc, /'TEST'/);
});

test('the server gate is the one that counts (kept for a game being built): the dealer’s start refuses a non-owner host while the game isn’t playable', () => {
  const s = src('api/_lib/holdem-store.js');
  assert.match(s, /op === 'start' && !\(await startOpen\(uid\)\)\) throw new ApiError\(403, 'not_open'/);
  assert.match(s, /if \(row && row\.playable\) return true;/);
  assert.match(s, /adminPids\(\)\.includes\(pid\)/);
  assert.match(s, /if \(!emulated\(\)\) return false;/, 'production: nobody else');
});
