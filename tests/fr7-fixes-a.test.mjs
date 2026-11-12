// FR7 FIXES A (Nov 12 — docs/harbor/passes/fr7-fixes-a.md): "what a stranger or a player can hit" — one test (or more) per fix, each failing
// before its fix. The emulator halves (the /api paths) live in tests/integration/server.test.mjs + password.test.mjs ("FR7 FIXES A").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// ---------------------------------------------------------------------------------------------------- Group 1 — THE MUST-FIXES
test('PD1: PRISM DROP\'s test hook (the one-line robot) is installed only on a test page — never on the live site', async () => {
  const src = read('js/games/prism/view.js');
  assert.ok(!/window\.__prism\s*=[^=]/.test(src), 'no bare window.__prism = … (it shipped to every phone)');
  assert.match(src, /installTestHook\('__prism'/, 'through the kit (emu / localhost / a /tests/ preview only)');
  // the playable games' views: every window.__<hook> assignment is behind the kit or an ?emu check
  for (const g of ['prism', 'overclock', 'holdem']) {
    const v = read(`js/games/${g}/view.js`);
    for (const m of v.matchAll(/window\.(__\w+)\s*=[^=]/g)) {
      const before = v.slice(Math.max(0, m.index - 400), m.index);
      assert.ok(/emu\\b/.test(before), `${g}: ${m[1]} is set without a test-page gate`);
    }
  }
  // the gate itself on a live-looking page vs the test pages
  const { installTestHook, testMode } = await import('../js/games/kit/hook.js');
  const was = globalThis.location, w0 = globalThis.window;
  globalThis.window = {};
  try {
    for (const [loc, want] of [
      [{ search: '', hostname: 'neonspeakeasy.com', pathname: '/' }, false],
      [{ search: '?room=ABCD', hostname: 'www.neonspeakeasy.com', pathname: '/' }, false],
      [{ search: '?emu', hostname: '127.0.0.1', pathname: '/' }, true],
      [{ search: '', hostname: 'localhost', pathname: '/' }, true],
      [{ search: '?bot=1', hostname: '192.168.1.20', pathname: '/tests/integration/prism-preview.html' }, true],
    ]) {
      globalThis.location = loc;
      assert.equal(testMode(), want, `${loc.hostname}${loc.pathname}${loc.search}`);
      const api = { bot() {} };
      assert.equal(installTestHook('__prism', api) === api, want);
      delete globalThis.window.__prism;
    }
  } finally { globalThis.location = was; globalThis.window = w0; }
});

test('OC1: OVERCLOCK\'s STANDARD boards take THE SCORING TABLE\'s bound (a forged 6,720 is refused; an honest perfect match is kept)', async () => {
  const { extractMatch } = await import('../js/core/match-report.js');
  const { matchMax, ptsCeiling } = await import('../js/games/overclock/logic.js');
  const { SKILL_TYPES } = await import('../js/games/overclock/challenges.js');
  const order = SKILL_TYPES.slice(0, 12);
  const game = (resultsFor, uids = ['ua', 'ub']) => ({
    id: 'overclock', phase: 'final', matchId: 'm1', participants: Object.fromEntries(uids.map(u => [u, true])), settings: { mode: 'standard' }, total: 12, order,
    results: Object.fromEntries(order.map((t, ci) => [ci, Object.fromEntries(uids.map((u, i) => [u, resultsFor(t, ci, i)]))])),
  });
  const perfect = (t, ci, i) => (i ? { pts: 0, ok: 0, parts: 3 } : { pts: ptsCeiling(t, 3, 3, ci === 11), ok: 3, parts: 3 });
  const g1 = game(perfect);
  const honest = extractMatch(g1);
  assert.ok(honest.rows.ua.rec['overclock-std'] > 0, 'the honest record is kept');
  const rejected = (honest.rejected || []).filter(x => x.board === 'overclock-std');
  assert.equal(rejected.length, 0, `a perfect honest match (${order.reduce((s, t, ci) => s + ptsCeiling(t, 3, 3, ci === 11), 0)} ≤ ${matchMax(order)}) is kept`);
  // the review's forge: 560 a challenge (the old cap) — 6,720
  const forged = extractMatch(game((t, ci, i) => (i ? { pts: 0, ok: 0, parts: 1 } : { pts: 560, ok: 1, parts: 1 })));
  assert.ok((forged.rejected || []).some(x => x.uid === 'ua' && x.board === 'overclock-std'), 'the 6,720 forge is refused');
  // more points than its own ok / parts allow (1 of 3 right and the speed bonus) — refused
  const over = extractMatch(game((t, ci, i) => (i ? { pts: 0, ok: 0, parts: 3 } : { pts: ptsCeiling(t, 1, 3, ci === 11) + 1, ok: 1, parts: 3 })));
  assert.ok((over.rejected || []).some(x => x.uid === 'ua'), 'a result above its ok / parts ceiling is refused');
  // an order that isn't a real one (a type that doesn't exist) — refused
  const bad = game(perfect); bad.order = order.map(() => 'made-up');
  assert.ok((extractMatch(bad).rejected || []).some(x => x.uid === 'ua'), 'a made-up order is refused');
});

test('DY1: every daily overlay loads its stylesheet itself (RESUME YOUR DAILY on a fresh page opens styled) and hides until it is in', () => {
  const src = read('js/screens/daily.js');
  const ov = src.slice(src.indexOf('function overlay('), src.indexOf('function overlay(') + 900);
  assert.match(ov, /dailySheet\(\)/, 'overlay() loads css/daily.css (openRun never went through openScreen)');
  assert.match(ov, /visibility = 'hidden'/, '…and stays hidden until the sheet is in');
  const bn = src.slice(src.indexOf('export function banner('), src.indexOf('export function banner(') + 300);
  assert.match(bn, /dailySheet\(\)/, 'the ROOM WINS banner too');
});

test('DY2: THE PASSWORD\'s guess is IDEMPOTENT — a retry of a lost answer gets the first answer back, never a second guess', async () => {
  const { guessAgain, serverGuess, createRun, recordOf, runView } = await import('../js/games/password/logic.js');
  const answers = ['CRANE', 'PITHY'];
  let run = createRun({});
  const r1 = serverGuess(run, 'SLATE', answers, 1000); run = r1.run;
  const rec = recordOf(run);
  // the phone sent guess 0 (SLATE), the answer was lost; ENTER again → the same k + word = the same answer, from the record
  const a = guessAgain(rec, 'SLATE', 0, answers);
  assert.ok(a && a.again, 'answered again');
  assert.deepEqual(a.again, r1.resp, 'exactly the first answer');
  assert.equal(guessAgain(rec, 'slate', 0, answers).again.n, 1, 'case-blind');
  // the next guess (k = 1) is a new one
  assert.equal(guessAgain(rec, 'MOULD', 1, answers), null, 'k at the end = a new guess');
  // a different word on a filled row, a k past the end, a bad k → out of step (the phone resyncs)
  for (const [w, k] of [['MOULD', 0], ['MOULD', 3], ['MOULD', -1], ['MOULD', 1.5], ['MOULD', 'x']]) assert.deepEqual(guessAgain(rec, w, k, answers), { refused: 'out_of_step' }, `${w} @ ${k}`);
  // the lost answer that OPENED THE FRONT DOOR: the retry is that answer (next: 1), never guess 1 of THE BACK ROOM
  let r2 = createRun({}); r2 = serverGuess(r2, 'SLATE', answers, 1).run; const open = serverGuess(r2, 'CRANE', answers, 2); r2 = open.run;
  const back = guessAgain(recordOf(r2), 'CRANE', 1, answers);
  assert.deepEqual(back.again, open.resp, 'the door-opening answer again');
  assert.equal(runView(recordOf(r2), answers).doors[1].guesses.length, 0, 'THE BACK ROOM untouched');
  // the finishing guess: done + its finish time from the record
  let r3 = r2; const fin = serverGuess(r3, 'PITHY', answers, 5000); r3 = fin.run;
  const again = guessAgain(recordOf(r3), 'PITHY', 2, answers);
  assert.ok(again.again.done && again.again.finishedAt === 5000, 'the last guess again: done, the stored finish');
  // the server's cartridge uses it (+ the client sends k)
  const pw = read('api/_lib/pw.js');
  assert.match(pw, /guessAgain\(record, g, k,/);
  assert.match(read('api/daily.js'), /a\.again/);
  assert.match(read('js/games/password/view.js'), /judge\.guess\(word, run\.doors\.reduce/);
});

test('E1: THE RESET EPOCH — the back-fill rebuilds the boards only from what came after THE LAUNCH RESET', async () => {
  const { sinceReset, rebuildWeekXp, holdemFromRecords } = await import('../js/core/board-fill.js');
  const { weekKey } = await import('../js/core/week.js');
  const T = Date.UTC(2026, 10, 12, 15), wk = weekKey(T);
  const results = {
    old: { at: T - 3600e3, g: 'holdem', src: 'dealer', n: 2, o: { p1: { win: true, xp: { gain: 70 } } } },
    new: { at: T + 60e3, g: 'prism', n: 2, o: { p1: { xp: { gain: 40 } } } },
    bare: { o: { p1: { xp: { gain: 999 } } } },
  };
  const daily = { password: { d20261112: { r: { p1: 7, p2: 9 }, s: { p1: T - 7200e3, p2: T + 5e3 }, x: {} } } };
  // no epoch = everything (the boards as before)
  const all = sinceReset({ results, daily }, 0);
  assert.equal(Object.keys(all.results).length, 3);
  assert.equal(rebuildWeekXp({ results: all.results, daily: all.daily, live: ['password'], wk }).p1, 70 + 40 + 15 + 10, 'the match, the match, the daily + THE SWEEP');
  // the reset at T: only the new match + p2's run (started after)
  const S = sinceReset({ results, daily }, T);
  assert.deepEqual(Object.keys(S.results), ['new']);
  assert.deepEqual(S.daily, { password: { d20261112: { r: { p2: 9 }, s: daily.password.d20261112.s, x: {} } } });
  assert.equal(rebuildWeekXp({ results: S.results, daily: S.daily, live: ['password'], wk }).p1, 40, 'p1: only the match after the reset');
  assert.deepEqual(holdemFromRecords({ results: S.results, wk }), {}, 'the pre-reset tournament win stays gone');
  assert.equal(results.old.at, T - 3600e3, 'the inputs untouched');
  // the server wiring: the reset stamps the epoch in its update, the back-fill reads it, a restore puts the old one back
  const reset = read('api/_lib/reset.js'), fill = read('api/_lib/board-fill.js');
  assert.match(reset, /'progress\/resetAt': now/);
  assert.match(reset, /'progress\/resetAt': B\.ra \|\| null/);
  assert.match(fill, /sinceReset\(\{ results: allResults/);
});
