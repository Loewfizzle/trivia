// THE CITY POLISH PASS — THE PLAY BOUNCE (Nov 24): the host loop's stall clock was module-global — the time a phone spent on the title (no room:
// tick() returns early) was read as a STALL at the next solo room's first tick → THE WAKE HOLD held the start → PLAY NOW left the room SILENTLY.
// The browser proof: tests/integration/e2e-play-bounce.mjs (red on the old code). These pin the source: the clock never compares across codes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const h = readFileSync(new URL('../js/host.js', import.meta.url), 'utf8');

test('the stall clock is the ROOM\'s: a new code (or none) resets lastTickWall before any compare; a wake for another room is dropped', () => {
  const fn = h.slice(h.indexOf('function syncStallClock()'), h.indexOf('export const justWoke'));
  assert.match(fn, /if \(state\.code === tickCode\) return;/);
  assert.match(fn, /tickCode = state\.code; lastTickWall = 0;/);
  assert.match(fn, /if \(wake && wake\.code !== state\.code\) \{ wake = null;/);
  const tick = h.slice(h.indexOf('function tick() {'), h.indexOf('// SPEED PASS B — THE HOST LEAVES ON PURPOSE'));
  const sync = tick.indexOf('syncStallClock();'), early = tick.indexOf('if (!state.code || !state.meta || !state.uid) return;'), cmp = tick.indexOf('w - lastTickWall');
  assert.ok(sync > 0 && sync < early, 'synced BEFORE the no-room early return (time on the title resets the clock)');
  assert.ok(cmp > early, 'the compare only in a room, after the sync');
  // every write of lastTickWall: the declaration, the reset in syncStallClock, the tick's own stamp — nothing else carries it across rooms
  const writes = [...h.matchAll(/lastTickWall = /g)].length;
  assert.equal(writes, 3, 'lastTickWall written only at its declaration, the per-room reset and the tick');
  // the hide clock too: a hide that began outside a room never counts as a wake inside one
  assert.match(h, /hiddenAt = state\.code \? Date\.now\(\) : 0;/);
});

test('a start held ONLY by a pending wake waits for the round trip (one retry); PLAY NOW never bounces silently', () => {
  assert.match(h, /const wakePending = \(\) => !!\(wake && wake\.code === state\.code && wake\.ok == null && isHost\(\) && inRoom\(\)\);/);
  const w = h.slice(h.indexOf('async function writeOkSoon()'), h.indexOf('/** THE ONE HOST-WRITE GATE'));
  assert.match(w, /for \(let round = 0; round < 2; round\+\+\)/, 'two rounds of ~3 s');
  assert.match(w, /if \(!wakePending\(\)\) return false;/, 'not the host (or the wake answered "no") → no wait');
  assert.match(h, /if \(!mod\) return false;\n  if \(!hostWriteOk\(\) && !\(await writeOkSoon\(\)\)\) return false;/);
  assert.match(h, /toast\('COULDN’T START — TAP PLAY AGAIN', 'err'\); if \(state\.code === room\) await leaveRoom\(\)\.catch\(\(\) => \{\}\);\n      if \(!GAME_MODULES\[gameId\]\) await reloadNowIfQueued\(\)/, 'the toast FIRST, then the leave, then a deploy\'s queued reload');
  const li = readFileSync(new URL('../js/ui/lazy-import.js', import.meta.url), 'utf8');
  const fn = li.slice(li.indexOf('export async function reloadNowIfQueued()'), li.indexOf('// PLAY NOW — Group 0a: ONE BUILD PER PAGE'));
  assert.match(fn, /if \(holding \|\| gated\) return false;/, 'never mid-match, never with a sheet open or a finger down');
  assert.match(fn, /doReload\(\);/, 'the ONE reload (sessionStorage — never a loop) + its /admin line');
});

test('THE SCHOOL CHROMEBOOKS: a low-core desktop Chrome starts one tier lower on its first visit; never a phone / iPhone / Mac', async () => {
  const { lowCoreDesk } = await import('../js/core/harbor-tiers.js');
  const cros = { userAgent: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', hardwareConcurrency: 4, deviceMemory: 8, maxTouchPoints: 10 };
  assert.equal(lowCoreDesk(cros, 1), true, "the school's Chromebook (4 cores, dpr 1, a touch screen)");
  assert.equal(lowCoreDesk({ ...cros, hardwareConcurrency: 8 }, 1), false, '8 cores: tier 2 as before');
  assert.equal(lowCoreDesk(cros, 2), false, 'a sharp screen (dpr 2): untouched');
  assert.equal(lowCoreDesk({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36', hardwareConcurrency: 4 }, 1), false, 'never a phone');
  assert.equal(lowCoreDesk({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1', hardwareConcurrency: 4 }, 1), false, 'never an iPhone');
  assert.equal(lowCoreDesk({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', hardwareConcurrency: 4, maxTouchPoints: 0 }, 1), true, 'a 4-core Windows laptop at dpr 1');
  const sc = readFileSync(new URL('../js/screens/harbor/scene.js', import.meta.url), 'utf8');
  assert.match(sc, /const lowDesk = !weak && !tierMem && /, 'the FIRST visit only (a remembered tier wins)');
  assert.match(sc, /if \(lowDesk && tier0 > 1\) \{ tier0 = 1;/);
});
