// THE CARD PASS (Nov 7 — docs/harbor/passes/card-pass.md): B1 (an empty solo run never counts), B3 (the solo boards' labels), THE GIFT
// QUEUE's client half, the seven gift cards' wiring + THE SLIM-CARD LONG-NAME STANDARD's table. Pure checks; the server half of the
// queue lives in tests/integration/server.test.mjs, the looks in the harbor suite (cardfit) + the shots.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// ---- B1 — AN EMPTY SOLO RUN NEVER COUNTS (OVERCLOCK's FABLE REVIEW): nothing answered + nothing scored → no solo XP, no streak, no count
const ocSolo = (cell, n = 6) => ({
  id: 'overclock', phase: 'final', mode: 'quick', settings: { mode: 'quick' }, total: n, participants: { s1: true },
  order: Array.from({ length: n }, () => 'truefalse'),
  results: Object.fromEntries(Array.from({ length: n }, (_, ci) => [ci, { s1: cell(ci) }])),
});
test('B1: an empty solo run (0 points, nothing answered) is marked empty and never counts — no XP, no streak, no solo count', async () => {
  const { extractMatch, soloEmpty } = await import('../js/core/match-report.js');
  const { matchStep } = await import('../js/core/progress.js');
  const { T0 } = await import('./fixtures/finals.mjs');
  const empty = ocSolo(() => ({ pts: 0, ok: 0, parts: 3 }));
  const row = extractMatch(empty).rows.s1;
  assert.equal(row.empty, 1, 'the row says empty');
  assert.ok(soloEmpty(empty, 's1', { score: 0 }));
  const r = matchStep(null, { key: 'E_1', gid: 'overclock', row, n: 1, now: T0 });
  assert.equal(r.skip, 'empty', 'skipped: no XP, no streak day, no solo-lane count, nothing written');
  // a run that never even opened a challenge (no results at all) is empty too
  const none = { ...empty, results: {} };
  assert.equal(extractMatch(none).rows.s1.empty, 1);
});
test('B1: a solo run counts with ≥ 1 answered part or a total > 0 — and a multiplayer 0 is never "empty"', async () => {
  const { extractMatch } = await import('../js/core/match-report.js');
  const { matchStep } = await import('../js/core/progress.js');
  const { T0 } = await import('./fixtures/finals.mjs');
  const { SOLO_XP } = await import('../js/core/ranks.js');
  // one right part, 0 points (a part that scored nothing still was answered)
  const onePart = ocSolo(ci => ({ pts: 0, ok: ci === 2 ? 1 : 0, parts: 3 }));
  const a = extractMatch(onePart).rows.s1;
  assert.ok(!a.empty, '≥ 1 answered part counts');
  const ra = matchStep(null, { key: 'P_1', gid: 'overclock', row: a, n: 1, now: T0 });
  assert.ok(!ra.skip); assert.equal(ra.xp.total, SOLO_XP); assert.ok(ra.streak.n >= 1, 'the streak counts');
  assert.equal(ra.next.day.so, 1, 'the solo-lane count');
  // a total > 0
  const pts = ocSolo(ci => ({ pts: ci === 0 ? 40 : 0, ok: 0, parts: 3 }));
  assert.ok(!extractMatch(pts).rows.s1.empty, 'a total > 0 counts');
  // a 2-player match where one player scored 0 still counts for both (B1 is the solo lane only)
  const two = { ...ocSolo(() => ({ pts: 0, ok: 0, parts: 3 })), participants: { s1: true, s2: true } };
  for (const ci of Object.keys(two.results)) two.results[ci].s2 = { pts: 50, ok: 1, parts: 3 };
  const ex = extractMatch(two);
  assert.ok(!ex.rows.s1.empty && !ex.rows.s2.empty);
  assert.ok(!matchStep(null, { key: 'M_2', gid: 'overclock', row: ex.rows.s1, n: 2, now: T0 }).skip);
});

// ---- B3 — THE BOARD's two SOLO BEST labels → QUICK · SOLO and STANDARD · SOLO
test('B3: the two OVERCLOCK solo boards say QUICK · SOLO and STANDARD · SOLO (never two "SOLO BEST")', async () => {
  const { boardDef } = await import('../js/core/boards.js');
  const q = boardDef('overclock-quick-solo'), s = boardDef('overclock-std-solo');
  assert.ok(q && s, 'both solo boards exist');
  assert.equal(q.label, 'QUICK · SOLO');
  assert.equal(s.label, 'STANDARD · SOLO');
  assert.equal(q.short, 'QUICK · SOLO', 'the tab + the column (board/view.js read `short`)');
  assert.equal(s.short, 'STANDARD · SOLO');
  assert.doesNotMatch(read('js/core/boards.js'), /'SOLO BEST'/);
});

// ---- THE GIFT QUEUE (the client half): one card at a time, "GIFT n OF m", seen as each closes, never over a match
test('THE GIFT QUEUE (the phone): the reveal plays the line one card at a time, numbered, each marked seen by its key', () => {
  const src = read('js/profile/gift-reveal.js');
  assert.match(src, /export function playLine/);
  assert.match(src, /GIFT \$\{o\.n\} OF \$\{o\.of\}/, 'GIFT n OF m');
  assert.match(src, /action: 'giftSeen', k: o\.k/, 'each one seen by its key');
  assert.match(src, /NEXT GIFT ›/, 'tap → the next');
  assert.match(src, /inMatch\(\)/, 'never over a match');
  const srv = read('api/_lib/gifts.js');
  assert.match(srv, /ppriv\/\$\{pid\}\/gq/, 'the line lives in ppriv (server-only — no rules change)');
  assert.doesNotMatch(read('database.rules.json'), /"gq"/);
});
