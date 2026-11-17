// CITY F — A QUEUED REPORT's PROOF (the go-live review's audit #8): a report still in the console's queue (/api down) keeps its proof —
// PLAY AGAIN's pruning (games/kit/again.js#pruneRuns) never takes a queued run's proof nodes, and BACK TO THE CITY's last-one-out (room.js)
// KEEPS the room while a report of it is queued, closing it once the queue has answered (profile/queue.js → room.js#sweepKeptRooms).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
// (again.js imports the database: its PURE pruning is loaded from its own source — the unit job installs nothing)
const src = read('js/games/kit/again.js');
const fnSrc = src.slice(src.indexOf('export function pruneRuns'), src.indexOf('\n}\n', src.indexOf('export function pruneRuns')) + 2).replace('export function', 'function');
const pruneRuns = new Function(`const KEEP_RUNS = 4; ${fnSrc}; return pruneRuns;`)();

test('PLAY AGAIN keeps the last four runs\' proofs — and NEVER a proof whose report is still queued', () => {
  let list = ['m1', 'm2', 'm3', 'm4', 'm5'];
  assert.deepEqual(pruneRuns('C', list, () => false), ['m1'], 'nothing queued: the oldest past four goes');
  assert.deepEqual(list, ['m2', 'm3', 'm4', 'm5']);
  list = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
  const q = new Set(['m1']);
  assert.deepEqual(pruneRuns('C', list, m => q.has(m)), ['m2'], 'm1 queued: kept; the next oldest goes instead');
  assert.deepEqual(list, ['m1', 'm3', 'm4', 'm5', 'm6']);
  // (the report lands: the next run prunes it)
  q.clear(); list.push('m7');
  assert.deepEqual(pruneRuns('C', list, m => q.has(m)), ['m1', 'm3']);
  assert.deepEqual(list, ['m4', 'm5', 'm6', 'm7']);
  // (every old one still queued: nothing goes)
  list = ['a', 'b', 'c', 'd', 'e', 'f'];
  assert.deepEqual(pruneRuns('C', list, () => true), []);
  assert.equal(list.length, 6);
});

test('BACK TO THE CITY: the last one out KEEPS a room whose report is queued; the queue\'s answer closes it', () => {
  const room = read('js/room.js'), queue = read('js/profile/queue.js');
  assert.match(room, /if \(loadQueue\(\)\.some\(x => x\.code === code\)\) \{ keptRooms\(KEPT\.concat\(code\)\);[\s\S]{0,300}exitRoom\(reason, 'info', \{ keepSeat, how: 'leave' \}\); return; \}\n\s*await closeRoom\(code, isSoloMeta\(state\.meta\)\);/);
  assert.match(room, /export async function sweepKeptRooms\(\) \{[\s\S]{0,200}KEPT\.filter\(c => !q\.some\(x => x\.code === c\) && c !== state\.code\)/);
  assert.match(queue, /saveQueue\(loadQueue\(\)\.filter\(x => x\.k !== k\)\);\n[^\n]*\n\s*if \(globalThis\.__nsSweepKept\) globalThis\.__nsSweepKept\(\);/);
  // (host.js's soloLeave still settles the report first — ≤ 3 s; only what is STILL queued after it keeps the room)
  assert.match(read('js/host.js'), /q\.settle\(q\.matchKey\(code, m\), 3000\)/);
  assert.match(read('js/games/kit/again.js'), /pruneRuns\(code, recent, m => pending\(matchKey\(code, m\)\)\)/);
});
