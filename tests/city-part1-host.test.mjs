// CITY PART 1 — A STALLED CHROMEBOOK KEEPS WRITING AS HOST (/admin Nov 20 9:37–9:45 am): THE WAKE HOLD + THE ONE HOST-WRITE GATE + the quiet
// 'not-host'. The browser reproduction: tests/integration/e2e-stall-host.mjs (the host's page paused + offline past the beat's stale mark).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { quietRoomRefusal, QUIET_WOKE, QUIET_HOST, QUIET_ROOM } from '../js/core/rules-lag.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

test('the quiet rule: a room / chat refusal just after a stall wake = QUIET_WOKE (the not-host count), before the other quiet cases; else as before', () => {
  assert.equal(quietRoomRefusal('rooms/ABCD/meta/go', { woke: () => true }), QUIET_WOKE);
  assert.equal(quietRoomRefusal('chats/ABCD/m/x', { woke: () => true, hostGone: () => true }), QUIET_WOKE);
  assert.equal(quietRoomRefusal('rooms/ABCD/meta', { hostGone: () => true }), QUIET_HOST);
  assert.equal(quietRoomRefusal('rooms/ABCD/players/u', { roomGone: () => true }), QUIET_ROOM);
  assert.equal(quietRoomRefusal('rooms/ABCD/players/u', {}), null, 'a seated, never-stalled phone: the alarm (THE RULES-LAG stands)');
  assert.equal(quietRoomRefusal('profiles/x', { woke: () => true }), null, 'only room / chat paths');
  const fb = read('js/firebase.js');
  assert.match(fb, /if \(quiet === QUIET_WOKE\) quietFor\(\{ kind: 'not-host' \}\); else countGone\(\);/);
  assert.match(read('api/log.js'), /QUIET_KINDS = \[[^\]]*'not-host'/);
});

test('THE WAKE HOLD + THE ONE GATE: a tick gap >= 5 s (or a 5 s hide) holds every host write until a fresh read of meta/hostId + the seat; every host write passes hostWriteOk', () => {
  const h = read('js/host.js');
  assert.match(h, /export const STALL_GAP_MS = 5000, WAKE_QUIET_MS = 30_000;/);
  // (THE FIX PASS — P2: the "fresh read" was a get() the SDK answers from the listener's cache — now ONE WRITE the cache can't answer)
  assert.match(h, /const w = asHost \? update\(dbRef\(`rooms\/\$\{code\}\/meta`\), \{ hostBeat: serverTimestamp\(\) \}\) : update\(dbRef\(`rooms\/\$\{code\}\/presence\/\$\{state\.uid\}`\), \{ lastSeen: serverTimestamp\(\) \}\);/, 'the fresh check: a write (its ack after every earlier event)');
  assert.match(h, /roundTrip\(code, true\)\.then\(r => \{/);
  assert.match(h, /w\.ok = r === true && state\.meta && state\.meta\.hostId === state\.uid && inRoom\(\);/, 'the host + the seat, on the fresh mirror');
  assert.match(h, /if \(idleNow\(\)\) \{ idleClose\(\); return; \}/, 'P3: ROOM IDLE only after the round trip');
  assert.ok(!/get\(dbRef\(`rooms\/\$\{code\}\/meta\/hostId`\)\)/.test(h), 'no cached get() as the proof any more');
  assert.match(h, /if \(state\.meta && state\.meta\.hostId !== wake\.host\) \{ wake = null; return isHost\(\); \}/, 'the mirror moved = fresh');
  assert.ok(h.indexOf('woke(`a stall of') < h.indexOf('if (!state.connected) return;'), 'the wake is seen before the connection check (a dead socket still knows)');
  // every host write: the beat, the director, a dead start's clear, the solo hold, a start, a rematch, the walk back — through the gate
  for (const re of [/if \(!hostWriteOk\(\)\) return;   \/\/ \(THE ERRORS GROUP: checked again right before the write/, /if \(!hostWriteOk\(\)\) return;   \/\/ \(THE ERRORS GROUP: a newer hostId/,
    /clearedGo === go\.m \|\| !hostWriteOk\(\)\) return;/, /!state\.code \|\| !game \|\| !hostWriteOk\(\) \|\| !soloRoom\(game\)/, /if \(!mod \|\| !hostWriteOk\(\)\) return false;/,
    /if \(!hostWriteOk\(\) \|\| !\(state\.game \|\| \(back && back\.g\)\)\) return Promise\.resolve\(false\);/, /export async function backToLobby\(\) \{\n  if \(!hostWriteOk\(\) \|\| !state\.code\) return;/]) assert.match(h, re);
  // the ROOM STAMP self-check: the re-publish blame only for a confirmed host IN the room
  assert.match(h, /if \(justWoke\(\) \|\| !isHost\(\) \|\| !inRoom\(\) \|\| \(wake && wake\.ok === false\)\) \{ lazyImport\(import\('\.\/errlog\.js'\), '\.\/errlog\.js'\)\.then\(m => m\.countQuiet && m\.countQuiet\('not-host'\)\)/);
});
