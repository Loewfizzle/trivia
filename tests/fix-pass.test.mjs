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

test('S3 a: THE CHUNK CEILING — the review\'s 2,000-chunk burst is refused by both judges before anything is unpacked; an honest max-rate node is not', async () => {
  const { chunkCeiling, overChunkCeiling, CHUNK_SLACK } = await import('../js/core/proof.js');
  const jw = await import('../js/games/jaywalk/logic.js');
  const hr = await import('../js/games/highrise/proof.js');
  const { CLOCK } = await import('../js/games/jaywalk/tuning.js');
  const go = 1_800_000_000_000;
  // the rates are the writers' own bounds (a match: each move within the flush interval, stop-and-wait)
  assert.equal(jw.CHUNKS_PER_SEC, Math.ceil(1000 / CLOCK.flushMatchMs));
  assert.match(src('js/games/highrise/view.js'), /export const FLUSH_MATCH_MS = 150;/);
  assert.ok(hr.CHUNKS_PER_SEC >= Math.ceil(1000 / 150));
  const burst = { go, c: {} };   // (2,000 chunks in ONE write, 5 s after GO — every stamp the same server now)
  let poked = 0;
  for (let i = 0; i < 2000; i++) burst.c[i] = { get s() { poked++; return '1'; }, at: go + 5000 };
  assert.equal(chunkCeiling(burst, 7), 5 * 7 + CHUNK_SLACK);
  assert.ok(overChunkCeiling(burst, 7));
  assert.equal(hr.judgeNode({ seed: 'x', mode: 'solo', node: burst }).why, 'too many chunks');
  const row = jw.scoreNode({ seed: 'x', mode: 'solo', node: burst, t0: go });
  assert.equal(row.bad, 'too many chunks');
  assert.equal(poked, 0, 'no chunk string was read');
  // an honest node at the writer's very bound: one chunk every flush for 60 s → under the ceiling
  for (const [rate, ms] of [[jw.CHUNKS_PER_SEC, CLOCK.flushMatchMs], [hr.CHUNKS_PER_SEC, 150]]) {
    const n = { go, c: {} };
    for (let i = 0, t = 0; t <= 60_000; i++, t += ms) n.c[i] = { s: '1', at: go + t };
    assert.ok(!overChunkCeiling(n, rate), `${Object.keys(n.c).length} chunks in 60 s at ${ms} ms each — under ${chunkCeiling(n, rate)}`);
  }
  assert.ok(!overChunkCeiling({ go, c: null }, 7) && !overChunkCeiling(null, 7) && chunkCeiling({ go: 0, c: {} }, 7) === Infinity);
});

test('S3 b: /api/report has a per-uid CALL BUDGET (api/daily.js\'s, ONE helper)', () => {
  const r = src('api/report.js');
  assert.match(r, /const reportBudget = callBudget\('rp', REPORT_CALLS\);/);
  assert.match(r, /if \(!reportBudget\(uid, Date\.now\(\)\)\) throw new ApiError\(429, 'slow_down'/);
  assert.match(src('api/daily.js'), /const budget = callBudget\('dc', CALLS\);/);
});
