// CITY D — GROUP 4: NO MESSAGES A SOLO PLAYER NEVER NEEDED + A SILENT RECONNECT STAYS SILENT
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('a SOLO room (PLAY NOW\'s one seat — the player never saw a room) leaves without a word; real rooms keep their messages', () => {
  const R = read('js/room.js');
  assert.match(R, /const solo = !!code && \(isSoloMeta\(state\.meta\) \|\| soloRejoin\(code\)\);/);
  assert.match(R, /if \(reason && !solo\) toast\(reason, kind, 3500\);/, 'every exitRoom message (ROOM CLOSED, DISCONNECTED, a leave\'s reason) skipped for a solo room');
  assert.equal((R.match(/toast\(/g) || []).filter(Boolean).length >= 1, true);
  const A = read('js/app.js');
  assert.match(A, /const wasSolo = !!\(saved && saved\.code\) && soloRejoin\(saved\.code\);/);
  assert.match(A, /if \(!wasSolo\) toast\('YOUR ROOM CLOSED AFTER AN HOUR WITHOUT A GAME'/);
  assert.match(A, /inviteExpired: wasSolo \? '' : saved\.code/);
});

test('SIGNAL LOST only after 1.5 s gone; SIGNAL RESTORED only when SIGNAL LOST was on screen ≥ 1.5 s', () => {
  const A = read('js/app.js');
  assert.match(A, /const LOST_GRACE_MS = 1500, RESTORED_AFTER_MS = 1500;/);
  assert.match(A, /lostT = setTimeout\(\(\) => \{\s*lostT = 0; lostAt = performance\.now\(\);/);
  assert.match(A, /if \(lostAt && performance\.now\(\) - lostAt >= RESTORED_AFTER_MS\) \{[\s\S]{0,120}'SIGNAL RESTORED'/);
  assert.match(A, /\} else netBadge\.classList\.remove\('is-on', 'is-back'\);/, 'a drop that healed before it showed: silent');
});
