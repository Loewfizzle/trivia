// CITY G — the pass's pins (the browser proofs: harbor `trivision-rebuild`, `keypop`, `roomchat`, `mediacut`; e2e-rematch.mjs; wk-press.mjs's
// CONFIRM row; e2e-daily / wk-press's DAILY_TEST probe — docs/harbor/passes/city-g.md)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compactRecord, compactOutcome, toCompact, RESULTS_KEEP_DAYS } from '../js/core/results-compact.js';
import { summarize } from '../js/core/insights.js';
import { countedPlaysFromRecords, holdemFromRecords, rebuildWeekXp } from '../js/core/board-fill.js';
import { weekKey } from '../js/core/week.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const DAY = 86_400_000, NOW = Date.parse('2026-11-18T15:00:00Z');
// a realistic outcome — api/_lib/stats.js's shape (the podium's whole payload)
const outcome = (i, solo) => ({ gid: solo ? 'jaywalk' : 'holdem', rank: i + 1, win: i === 0, n: solo ? 1 : 3, xp: { gain: 40 + i, parts: [{ k: 'played', label: 'MATCH PLAYED', v: 30 }, { k: 'win', label: 'VICTORY', v: 52 }], from: 1200, to: 1290 },
  rk: { from: 4, to: 5 }, lv: { from: 13, to: 14, up: true }, items: ['card-x'], ach: ['first-win', 'night-owl'], pbs: [{ b: 'jw-lanes', v: 88, was: 70 }], ranks: [{ b: 'jw-lanes', r: 12, top: 50 }],
  hidden: false, played: 41, streak: 5, st: { n: 5, d: '2026-10-30' }, sev: 'kept', bests: { 'jw-lanes': 88 }, nx: 15 });
const rec = (at, n, g = n === 1 ? 'jaywalk' : 'holdem') => ({ st: 'done', at, g, mode: g === 'holdem' ? 'tournament' : 'match', n, src: g === 'holdem' ? 'dealer' : 'snap', by: 'u'.repeat(28), rej: null,
  ...(g === 'holdem' ? { ko: { p1: 1 } } : {}), o: Object.fromEntries(Array.from({ length: n }, (_, i) => [`p${i}`, outcome(i, n === 1)])) });

test('CITY G — RESULTS COMPACTED past 14 days: every long-term reader answers the SAME before + after; a pending (retry / busy) record never touched; the bytes', () => {
  const results = {};
  for (let d = 0; d < 40; d++) { results[`SOLO_s${d}aaaa`] = rec(NOW - d * DAY - 3600e3, 1); if (d % 3 === 0) results[`ROOM_r${d}aaaa`] = rec(NOW - d * DAY - 7200e3, 3); }
  results.KEEP_retry1 = { st: 'retry', at: NOW - 30 * DAY, g: 'jaywalk', o: { p0: outcome(0, true) }, xs: '{"ex":{}}' };
  results.KEEP_busy1 = { st: 'busy', at: NOW - 30 * DAY, by: 'x' };
  const keys = toCompact(results, NOW, { max: 1000 });
  assert.ok(keys.length > 0 && keys.every(k => results[k].at < NOW - RESULTS_KEEP_DAYS * DAY && results[k].st === 'done'), 'only done records past the keep');
  assert.ok(!keys.includes('KEEP_retry1') && !keys.includes('KEEP_busy1'), 'a retry (THE LOST RUN\'s extract) / a busy claim: never');
  const after = { ...results };
  let b0 = 0, b1 = 0;
  for (const k of keys) { after[k] = compactRecord(results[k]); b0 += JSON.stringify(results[k]).length; b1 += JSON.stringify(after[k]).length; }
  // the readers — /admin's history, THE BOARD's back-fill (counted plays, this week's XP, HOLD'EM's all-time) — answer the same
  const S0 = summarize({ results, now: NOW }), S1 = summarize({ results: after, now: NOW });
  assert.deepEqual(S1, S0, '/admin\'s STATS history unchanged');
  assert.deepEqual(countedPlaysFromRecords({ results: after }), countedPlaysFromRecords({ results }));
  const wk = weekKey(NOW);
  assert.deepEqual(holdemFromRecords({ results: after, wk }), holdemFromRecords({ results, wk }));
  assert.deepEqual(rebuildWeekXp({ results: after, wk }), rebuildWeekXp({ results, wk }));
  assert.ok(toCompact(after, NOW, { max: 1000 }).length === 0, 'compacted once (c: 1)');
  assert.ok(b1 < b0 * 0.25, `the old records shrink to < 25 % (${b0} → ${b1} bytes, ${keys.length} records)`);
  console.log(`  results compaction: ${keys.length} old records ${b0} → ${b1} bytes (${Math.round(100 - 100 * b1 / b0)} % smaller); a solo record ${JSON.stringify(results.SOLO_s20aaaa).length} → ${JSON.stringify(after.SOLO_s20aaaa).length} B`);
  assert.deepEqual(compactOutcome({}), { k: 1 }, 'never an empty object (no node)');
  // run by THE DAY'S CLOSE, never waited on (no idle poll, no new schedule)
  assert.match(read('api/daily.js'), /compactResults\(\{ now \}\)\.catch\(\(\) => null\);/);
});

test('CITY G — the small bugs\' pins: STATS never appends null · ONE dailies chart · a confirm control presses · the double close asks first · a root room write is judged as the room\'s · SAVE YOUR KEY re-checked after its imports', () => {
  const sv = read('js/admin/stats-view.js');
  assert.doesNotMatch(sv, /\.append\([^;]*: null\)/, 'never append(…, null) — DOM append prints "null"');
  assert.match(sv, /export function dailyChart\(name, days, today/);
  assert.match(read('js/admin/admin.js'), /\.\.\.dailyChart\(d\.name, d\.days, S\.day\)/, '/admin draws the SAME chart');
  assert.match(read('js/ui/components.js'), /export function confirmTap\(el, text, run, \{ ms = 2500 \} = \{\}\) \{[\s\S]{0,400}el\.dataset\.press = '';/);
  assert.match(read('js/room.js'), /there = \(await get\(dbRef\(`\$\{R\(code\)\}\/meta`\)\)\)\.exists\(\)/, 'the close asks if the room is still there');
  assert.match(read('js/firebase.js'), /refPath\(r\) === '\/' && keys\.length \? \(Object\.keys\(patch\)\.find/);
  const kp = read('js/profile/keypop.js');
  assert.match(kp, /if \(blocked\(busy\)\) \{ clearTimeout\(waitT\); waitT = setTimeout/, 're-checked after the lazy imports');
  assert.match(kp, /\.sg-big, \.dy-run';/);
  assert.match(read('css/chat.css'), /\.sh\.chat-sheet\.is-in \.sh-panel\.is-settled \{ transform: none; bottom: var\(--lift\); transition: none; \}/, 'the settled chat: no transform');
});
