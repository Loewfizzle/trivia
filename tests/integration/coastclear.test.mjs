// COAST CLEAR on the emulators (CC1 — /api, no browser; docs/coastclear.md "The server flow"): the server keeps the board + answers every dig —
// no response ever names an unopened cell, a flood comes whole in ONE answer, a repeated dig is free, the chord with right / wrong buoys, the 3rd
// spot ends it, nothing after the end, one try (a second start = the same run, one finish from the server's record), the pause (+15 s, the clock
// stopped), the board built once a day + stored server-side, production (no DAILY_TEST) refuses 'coastclear'.
//   cd tests/integration && node --test coastclear.test.mjs        (the emulators running)
process.env.FIREBASE_DATABASE_EMULATOR_HOST ||= '127.0.0.1:9000';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';
process.env.GCLOUD_PROJECT ||= 'demo-arcade';
process.env.MATCH_GAP_MS = '20000';
process.env.ADMIN_PIDS = '';
process.env.BOARD_MIN_MATCHES = '1';
process.env.DAILY_TEST = '1';

import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { ref, val, fb } from '../../api/_lib/fb.js';
import { deleteApp } from 'firebase-admin/app';
import { profileAction } from '../../api/profile.js';
import { dailyAction } from '../../api/daily.js';
import { loadDailies } from '../../api/_lib/dailies.js';
import { ccBoard } from '../../api/_lib/cc.js';
import { buildBoard, forgetBoards, unpackBoard } from '../../api/_lib/cc-board.js';
import { unregisterDaily, dailyOf } from '../../js/core/daily.js';
import { streakDay } from '../../js/core/streak.js';
import { countsOf, flood, nbOf, runView, CAUGHT, safeCount } from '../../js/games/coastclear/logic.js';

const NOW = Date.UTC(2026, 10, 10, 1, 0, 0);   // Mon Nov 9 2026, 8 pm Eastern
const NODES = ['profiles', 'uids', 'pstats', 'ppriv', 'pkeys', 'tags', 'rl', 'lb', 'results', 'audit', 'rooms', 'dly', 'pcount', 'streak', 'progress'];
before(async () => { await ref('/').update(Object.fromEntries(NODES.map(n => [n, null]))); forgetBoards(); });
after(async () => { await deleteApp(fb().app); });

const ensure = (uid, name, at = NOW) => profileAction(uid, { action: 'ensure', name, avatar: 'bolt', color: 'cyan' }, '', at);
const rejects = async (p, status, code) => {
  try { await p; } catch (e) { assert.equal(e.status, status, `${code}: status ${e.status} (${e.message})`); if (code) assert.equal(e.code, code); return e; }
  assert.fail(`expected ${status} ${code}`);
};
const A = (uid, action, at, extra = {}) => dailyAction(uid, { action, game: 'coastclear', ...extra }, at);
const day = streakDay(NOW);
const pidOf = uid => val(`uids/${uid}`);
/** EVERY ANSWER names only what the record has opened / spotted (the view rebuilt from the server's own record after the call) */
async function honest(uid, resp, board) {
  const rec = await val(`dly/coastclear/${day}/p/${await pidOf(uid)}`);
  const v = runView(rec, board), open = new Map(v.open), lit = new Set(v.lit);
  const cells = [...(resp.cells || []), ...((resp.run && resp.run.open) || [])];
  for (const [c, n] of cells) assert.ok(open.has(c) && open.get(c) === n, `cell ${c} named but not opened`);
  for (const c of [...(resp.lit || []), ...((resp.run && resp.run.lit) || [])]) assert.ok(lit.has(c), `light ${c} named but not spotted`);
  const s = JSON.stringify(resp);
  for (const k of ['lights"', '"l"', 'board', 'counts', 'mv']) assert.ok(!s.includes(k) || k === 'lights"', `no ${k} in a response`);
  return v;
}

test('START: the opening + the size, no seed, the server clock; the board built ONCE + stored server-side; a second start = the same run', async () => {
  await ensure('cc-ann', 'Ann');
  await rejects(A('cc-ann', 'dig', NOW, { cell: 0 }), 409, 'not_started');
  const s = await A('cc-ann', 'start', NOW);
  assert.equal(s.seed, undefined, 'a judged daily hands out NO seed');
  assert.equal(s.now, NOW); assert.equal(s.startedAt, NOW);
  assert.equal(s.run.w, 9); assert.equal(s.run.h, 12); assert.equal(s.run.lights, 18); assert.equal(s.run.spots, 0); assert.equal(s.run.done, false);
  const stored = await val(`dly/coastclear/${day}/b`);
  assert.ok(stored && stored.v === 1 && typeof stored.l === 'string' && stored.a >= 1, 'the board stored once (server-only)');
  const board = unpackBoard(stored);
  assert.deepEqual(board, buildBoard(day, fb().pepper).board, 'the stored board IS the pepper\'s board for the day');
  assert.deepEqual(s.run.open.map(c => c[0]).sort((a, b) => a - b), board.open, 'the start shows exactly the pre-opened safe area');
  assert.ok(!('lights' in s.run && Array.isArray(s.run.lights)), 'the light count, never their cells');
  // the stored copy wins over a rebuild (built once a day)
  forgetBoards();
  assert.deepEqual(await ccBoard(day), board);
  const s2 = await A('cc-ann', 'start', NOW + 5000);
  assert.equal(s2.startedAt, NOW); assert.deepEqual(s2.run.open, s.run.open);
});

test('DIG: one cell, its number; a 0 floods WHOLE in one answer; a repeat is free (nothing written); a bad cell refused', async () => {
  const board = await ccBoard(day), counts = countsOf(board), opening = new Set(board.open);
  const pid = await pidOf('cc-ann'), P = `dly/coastclear/${day}/p/${pid}`;
  // a numbered safe cell next to the opening
  const num = [...Array(108).keys()].find(i => !opening.has(i) && counts[i] > 0 && nbOf(9, 12)[i].some(j => opening.has(j)));
  const d1 = await A('cc-ann', 'dig', NOW + 10e3, { cell: num });
  assert.deepEqual(d1.cells, [[num, counts[num]]]); assert.deepEqual(d1.lit, []); assert.equal(d1.spots, 0); assert.equal(d1.done, false); assert.equal(d1.now, NOW + 10e3);
  await honest('cc-ann', d1, board);
  const before = await val(P);
  const again = await A('cc-ann', 'dig', NOW + 11e3, { cell: num });
  assert.equal(again.already, true); assert.deepEqual(again.cells, [[num, counts[num]]]);
  assert.deepEqual(await val(P), before, 'a repeated dig writes nothing');
  const op = await A('cc-ann', 'dig', NOW + 11e3, { cell: board.open[0] });
  assert.equal(op.already, true);
  // a zero outside the opening (when the board has one): the whole calm area in one answer
  const open = new Set([...opening, num]);
  const zero = [...Array(108).keys()].find(i => !open.has(i) && counts[i] === 0);
  if (zero != null) {
    const want = flood(board, counts, zero, open).map(c => c[0]).sort((a, b) => a - b);
    const d2 = await A('cc-ann', 'dig', NOW + 12e3, { cell: zero });
    assert.deepEqual(d2.cells.map(c => c[0]).sort((a, b) => a - b), want, 'the flood complete');
    assert.equal(d2.cells[0][0], zero, 'from the tapped cell outward');
    await honest('cc-ann', d2, board);
  } else console.log('# (no zero outside the opening on this board)');
  await rejects(A('cc-ann', 'dig', NOW, { cell: 108 }), 422, 'bad_cell');
  await rejects(A('cc-ann', 'dig', NOW, { cell: 'x' }), 422, 'bad_cell');
  await rejects(A('cc-ann', 'jump', NOW, { cell: 1 }), 400, 'bad_action');
});

test('CHORD: the right buoys open the rest; too few refused at no cost; a WRONG buoy → the hidden light is dug = SPOTTED (+30 s), play goes on', async () => {
  await ensure('cc-bo', 'Bo');
  await A('cc-bo', 'start', NOW);
  const board = await ccBoard(day), counts = countsOf(board), L = new Set(board.lights), nb = nbOf(9, 12);
  const opening = new Set(board.open);
  // an opening number with a light among its unopened neighbours + at least one safe unopened neighbour
  const pick = (need) => board.open.find(i => counts[i] > 0 && need(nb[i].filter(j => !opening.has(j))));
  const at = pick(u => u.some(j => L.has(j)) && u.some(j => !L.has(j)));
  assert.ok(at != null, 'a chordable number in the opening');
  const unk = nb[at].filter(j => !opening.has(j));
  const lights = unk.filter(j => L.has(j)), safe = unk.filter(j => !L.has(j));
  const pid = await pidOf('cc-bo'), P = `dly/coastclear/${day}/p/${pid}`;
  // too few buoys: refused, nothing stored
  await rejects(A('cc-bo', 'chord', NOW + 1e3, { cell: at, buoys: [] }), 422, 'chord_count');
  assert.deepEqual(((await val(P)) || {}).mv || [], []);
  // WRONG: buoy a safe cell instead of one light (the same count) → that light gets dug
  {
    const w = await A('cc-bo', 'chord', NOW + 2e3, { cell: at, buoys: [...lights.slice(1), safe[0]] });
    assert.deepEqual(w.lit, [lights[0]], 'SPOTTED by the light the wrong buoy left'); assert.equal(w.spots, 1); assert.equal(w.done, false);
    await honest('cc-bo', w, board);
  }
  // RIGHT (on a fresh player): the buoys on the lights → every safe neighbour opened
  await ensure('cc-cy', 'Cy');
  await A('cc-cy', 'start', NOW);
  const r = await A('cc-cy', 'chord', NOW + 3e3, { cell: at, buoys: lights });
  assert.deepEqual(r.lit, []); assert.equal(r.spots, 0);
  for (const j of safe) assert.ok(r.cells.some(c => c[0] === j), `safe ${j} opened`);
  await honest('cc-cy', r, board);
  const again = await A('cc-cy', 'chord', NOW + 4e3, { cell: at, buoys: lights });
  assert.equal(again.already, true, 'a chord with nothing left = free');
});

test('SPOTTED ×3 = CAUGHT: the run ends, nothing after; finish scores from the record (caught below every finished run); one finish only', async () => {
  await ensure('cc-dee', 'Dee');
  await A('cc-dee', 'start', NOW);
  const board = await ccBoard(day);
  const l = board.lights;
  const a = await A('cc-dee', 'dig', NOW + 1e3, { cell: l[0] });
  assert.deepEqual(a.lit, [l[0]]); assert.equal(a.spots, 1); assert.equal(a.done, false);
  const rep = await A('cc-dee', 'dig', NOW + 1e3, { cell: l[0] });
  assert.equal(rep.already, true, 'the same light again: free (still one spot)'); assert.equal(rep.spots, 1);
  await rejects(A('cc-dee', 'finish', NOW + 2e3), 409, 'not_done');
  await A('cc-dee', 'dig', NOW + 2e3, { cell: l[1] });
  const c = await A('cc-dee', 'dig', NOW + 3e3, { cell: l[2] });
  assert.equal(c.done, true); assert.equal(c.out, 'caught'); assert.equal(c.spots, 3); assert.equal(c.finishedAt, NOW + 3e3);
  await rejects(A('cc-dee', 'dig', NOW + 4e3, { cell: board.open[0] }), 409, 'finished');
  await rejects(A('cc-dee', 'pause', NOW + 4e3), 409, 'finished');
  const s = await A('cc-dee', 'start', NOW + 5e3);
  assert.equal(s.run.done, true); assert.equal(s.run.out, 'caught'); assert.deepEqual(s.run.lit.sort(), l.slice(0, 3).sort());
  await honest('cc-dee', s, board);
  const f = await A('cc-dee', 'finish', NOW + 6e3, { result: { score: 1 } });
  assert.equal(f.score, CAUGHT + safeCount(board) - board.open.length, 'scored from the record — the claim ignored');
  const f2 = await A('cc-dee', 'finish', NOW + 7e3);
  assert.equal(f2.score, f.score); assert.equal(f2.again, true, 'one try: the stored score back');
});

test('A CLEAN CLEAR with a PAUSE: the clock stops while paused (+15 s), a dig resumes it; finish = time + 15; every answer honest', async () => {
  await ensure('cc-eve', 'Eve');
  await A('cc-eve', 'start', NOW);
  const board = await ccBoard(day), counts = countsOf(board), L = new Set(board.lights);
  const pid = await pidOf('cc-eve'), P = `dly/coastclear/${day}/p/${pid}`;
  const open = new Set(board.open);
  let t = NOW + 1000, last = null, calls = 0, paused = false;
  for (let i = 0; i < 108; i++) {
    if (L.has(i) || open.has(i)) continue;
    if (!paused && calls === 5) {
      const p = await A('cc-eve', 'pause', t); assert.equal(p.paused, true); assert.equal(p.pauses, 1);
      assert.equal((await A('cc-eve', 'pause', t + 1000)).already, true, 'a second pause while paused = free');
      t += 60_000; paused = true;   // a minute away (the room played a game)
    }
    last = await A('cc-eve', 'dig', t, { cell: i }); calls++;
    if (paused && calls === 6) assert.equal(last.resumed, true, 'the first move after a pause resumes the clock');
    for (const [c] of last.cells) open.add(c);
    await honest('cc-eve', last, board);
    t += 1000;
  }
  assert.equal(last.done, true); assert.equal(last.out, 'clear');
  const rec = await val(P);
  assert.equal(rec.p.n, 1); assert.equal(rec.p.ms, 60_000); assert.equal(rec.o, 'clear');
  const f = await A('cc-eve', 'finish', t + 5000);
  const ms = rec.e - NOW - 60_000;
  assert.equal(f.score, Math.round(ms / 1000) + 15);
  assert.ok(f.stand && f.stand.n >= 1);
  void counts;
});

test('production (no DAILY_TEST) refuses coastclear: no cartridge, 404 no_daily', async () => {
  unregisterDaily('coastclear');
  const was = process.env.DAILY_TEST;
  delete process.env.DAILY_TEST;
  loadDailies();
  assert.equal(dailyOf('coastclear'), null);
  await rejects(A('cc-ann', 'start', NOW), 404, 'no_daily');
  await rejects(A('cc-ann', 'dig', NOW, { cell: 0 }), 404, 'no_daily');
  process.env.DAILY_TEST = was;
  loadDailies();
  assert.ok(dailyOf('coastclear'));
});
