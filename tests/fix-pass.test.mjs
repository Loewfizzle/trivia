// THE FIX PASS (after THE FABLE REVIEW, Nov 22 — Downloads/NEON/reviews/review-nov22.md): the pure halves of its fixes + the source guards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

test('S2: the stale-room sweep plan — stale + orphan rooms with their side nodes, the word rests (never a solo room\'s), the live stay', async () => {
  const { roomSweepPatch, ROOM_SIDE_NODES } = await import('../js/core/room-logic.js');
  const now = 10e9;
  const { codes, patch } = roomSweepPatch({
    OLDD: { meta: { activeAt: now - 2 * 3600e3 } },
    LIVE: { meta: { activeAt: now - 60e3 } },
    EDGE: { meta: { activeAt: now - 3600e3 - 30e3 } },   // (inside the 60 s grace: kept)
    SOLO: { meta: { activeAt: now - 9e6, settings: { solo: { on: true } } } },
    ORPH: { presence: {} },
    NOAT: { meta: { hostId: 'x' } },                      // (a missing stamp: never on missing data)
  }, now);
  assert.deepEqual(codes.sort(), ['OLDD', 'ORPH', 'SOLO']);
  assert.equal(patch['rooms/OLDD'], null);
  for (const n of ROOM_SIDE_NODES) assert.ok(`${n}/OLDD` in patch, n);
  assert.deepEqual(patch['hush/OLDD'], { closedAt: now });
  assert.ok(!('hush/SOLO' in patch) && !('hush/ORPH' in patch), 'no word for a solo room or an orphan');
});

test('S2: no phone lists rooms any more — the rules say false, the client has no rooms query', () => {
  const rules = JSON.parse(src('database.rules.json'));
  assert.equal(rules.rules.rooms['.read'], false);
  assert.ok(!/cleanupStaleRooms/.test(src('js/room.js')), 'the phone-side sweep is gone');
  assert.ok(!/query\(dbRef\('rooms'\)/.test(src('js/room.js')));
  assert.match(src('api/daily.js'), /sweepRoomsIfDue\(now\)/);
  assert.match(src('api/log.js'), /sweepRoomsIfDue\(meta\.now\)/);
});

test('D1: /admin\'s 30 s poll asks LIVE NOW only (never results/ + profiles/ again), only on screen AND focused', () => {
  const a = src('js/admin/admin.js');
  assert.match(a, /setInterval\(\(\) => \{ if \(liveOnScreen\(\)\) loadLive\(\); \}, LIVE_POLL_MS\);/);
  assert.match(a, /document\.visibilityState === 'visible' && \(typeof document\.hasFocus !== 'function' \|\| document\.hasFocus\(\)\)/);
  assert.match(a, /api\('admin', \{ action: 'live' \}\)/);
  assert.ok(!/setInterval\(\(\) => \{[^}]*loadStats\(/.test(a), 'no timer re-loads the whole STATS');
  assert.match(src('api/admin.js'), /case 'live': return \{ live: liveRooms\(await liveRoomsRead\(now\), now\), at: now \};/);
});

test('D2 + D4: the compaction claims its DAY in the database; the share picture answers ONE canonical query', () => {
  assert.match(src('api/_lib/results-sweep.js'), /if \(!\(await claimDay\('results', today, now\)\)\) return \{ n: 0 \};/);
  assert.ok(!/const DONE = new Set\(\)/.test(src('api/_lib/results-sweep.js')));
  const d = src('api/daily.js');
  assert.match(d, /const canon = shareImgQuery\(code, head\.h\);\s*if \(new URL\(req\.url \|\| '\/', 'http:\/\/x'\)\.search !== canon\) return redirect\(/);
});
