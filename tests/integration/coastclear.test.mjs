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
const DAY_MS = 86_400_000;
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

// ---- CC2 — THE REVEAL + THE REWARDS (GHOST RUN + LIGHTHOUSE from the server's own record on finish; never the phone's claim)
/** play a clean clear for uid: every safe cell dug ~0.5 s apart, the move that FINISHES it made at exactly NOW + endS seconds → the last answer */
async function cleanClear(uid, endS) {
  await A(uid, 'start', NOW);
  const board = await ccBoard(day), counts = countsOf(board), L = new Set(board.lights);
  const open = new Set(board.open), safeN = safeCount(board);
  let t = NOW + 500, last = null;
  for (let i = 0; i < 108 && open.size < safeN; i++) {
    if (L.has(i) || open.has(i)) continue;
    const ends = open.size + flood(board, counts, i, open).length >= safeN;
    last = await A(uid, 'dig', ends ? NOW + endS * 1000 : t, { cell: i });
    for (const [c] of last.cells) open.add(c);
    assert.ok(!last.reveal || last.done, 'the lights are revealed only once the run is over');
    t += 500;
  }
  return { last, board };
}
const awards = f => (f.outcome && f.outcome.ach ? f.outcome.ach.map(x => x.id || x) : []).filter(x => x === 'lighthouse' || x === 'ghost-run').sort();

test('THE REVEAL: the answer that ENDS a run + a start after it carry every light; no answer before the end ever does', async () => {
  await ensure('cc-ivy', 'Ivy');
  await A('cc-ivy', 'start', NOW);
  const board = await ccBoard(day), l = board.lights;
  const a1 = await A('cc-ivy', 'dig', NOW + 1e3, { cell: l[0] });
  const a2 = await A('cc-ivy', 'dig', NOW + 2e3, { cell: l[1] });
  assert.equal(a1.reveal, undefined); assert.equal(a2.reveal, undefined);
  assert.equal((await A('cc-ivy', 'start', NOW + 2500)).run.reveal, undefined, 'a resume mid-run: no reveal');
  const a3 = await A('cc-ivy', 'dig', NOW + 3e3, { cell: l[2] });
  assert.equal(a3.done, true);
  assert.deepEqual(a3.reveal.slice().sort((x, y) => x - y), l.slice().sort((x, y) => x - y), 'the end: every light');
  assert.deepEqual((await A('cc-ivy', 'start', NOW + 4e3)).run.reveal.slice().sort((x, y) => x - y), l.slice().sort((x, y) => x - y));
  const f = await A('cc-ivy', 'finish', NOW + 5e3);
  assert.deepEqual(awards(f), [], 'CAUGHT: no LIGHTHOUSE, no GHOST RUN');
});

test('THE REWARDS: a zero-spot clear AT the GHOST RUN time (50 s) → GHOST RUN + LIGHTHOUSE, once; one second over → LIGHTHOUSE only, a phone\'s faked claim ignored', async () => {
  const { GHOST_S } = await import('../../api/_lib/cc.js');
  assert.equal(GHOST_S, 50);
  // AT the threshold: the finishing dig at exactly NOW + 50 s → score 50
  await ensure('cc-fay', 'Fay');
  const { last } = await cleanClear('cc-fay', GHOST_S);
  assert.equal(last.out, 'clear');
  const f = await A('cc-fay', 'finish', NOW + 60e3);
  assert.equal(f.score, GHOST_S);
  assert.deepEqual(awards(f), ['ghost-run', 'lighthouse'], JSON.stringify(f.outcome && f.outcome.ach));
  const items = (f.outcome.items || []).map(i => i.id || i);
  assert.ok(items.includes('card-ghost-run') && items.includes('emb-lighthouse'), JSON.stringify(items));
  const pid = await pidOf('cc-fay'), ps = await val(`pstats/${pid}`);
  assert.ok(ps.it['card-ghost-run'] && ps.it['emb-lighthouse'] && ps.ac['ghost-run'] && ps.ac.lighthouse && ps.pa.gf['coastclear-clear'] === 1 && ps.pa.gf['coastclear-ghost'] === 1);
  // NEVER TWICE: the finish again → the stored score back, nothing awarded again
  const f2 = await A('cc-fay', 'finish', NOW + 61e3);
  assert.equal(f2.again, true); assert.deepEqual(awards(f2), [], 'never twice');
  // ONE SECOND OVER: score 51 → LIGHTHOUSE only — and a faked claim of a fast run (the phone's result) changes nothing
  await ensure('cc-gus', 'Gus');
  await cleanClear('cc-gus', GHOST_S + 1);
  const g = await A('cc-gus', 'finish', NOW + 70e3, { result: { score: 10, spots: 0 } });
  assert.equal(g.score, GHOST_S + 1, 'scored from the record — the claim ignored');
  assert.deepEqual(awards(g), ['lighthouse']);
  const psg = await val(`pstats/${await pidOf('cc-gus')}`);
  assert.ok(psg.it['emb-lighthouse'] && !psg.it['card-ghost-run'] && !psg.pa.gf['coastclear-ghost']);
});

test('THE REWARDS: a FAST clear with ONE spot → LIGHTHOUSE only (GHOST RUN needs zero); a finish before the run is over → refused, nothing awarded', async () => {
  await ensure('cc-hal', 'Hal');
  await A('cc-hal', 'start', NOW);
  const board = await ccBoard(day);
  await A('cc-hal', 'dig', NOW + 500, { cell: board.lights[0] });
  await rejects(A('cc-hal', 'finish', NOW + 600, { result: { score: 5 } }), 409, 'not_done');
  assert.equal(await val(`pstats/${await pidOf('cc-hal')}/it/emb-lighthouse`), null, 'a faked finish: nothing awarded');
  const counts = countsOf(board), L = new Set(board.lights), open = new Set(board.open), safeN = safeCount(board);
  let t = NOW + 700;
  for (let i = 0; i < 108 && open.size < safeN; i++) { if (L.has(i) || open.has(i)) continue; const r = await A('cc-hal', 'dig', t, { cell: i }); for (const [c] of r.cells) open.add(c); t += 200; }
  const f = await A('cc-hal', 'finish', t + 100);
  assert.ok(f.score < 50 + 30 + 10, `fast (${f.score} with the +30)`);
  assert.deepEqual(awards(f), ['lighthouse'], 'one spot: never GHOST RUN');
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

// ---- DFIX1 — A RUN KEEPS ITS OWN DAY (the 4 am turn) + THE PAUSE CAPS + THE CLEAN ERRORS
const TURN = Date.UTC(2026, 11, 2, 9, 0, 0);   // Wed Dec 2 2026, 4:00 am Eastern (EST)
const AD = (uid, action, at, d, extra = {}) => dailyAction(uid, { action, game: 'coastclear', day: d, ...extra }, at);
/** dig every safe cell left (on `d`'s board), `step` ms apart from t → { last, t } */
async function digAll(uid, d, t, step = 500) {
  const board = await ccBoard(d), counts = countsOf(board), L = new Set(board.lights), safeN = safeCount(board);
  const rec = await val(`dly/coastclear/${d}/p/${await pidOf(uid)}`);
  const open = new Set([...board.open, ...new Map(runView(rec, board).open).keys()]);
  let last = null;
  for (let i = 0; i < 108 && open.size < safeN; i++) {
    if (L.has(i) || open.has(i)) continue;
    last = await AD(uid, 'dig', t, d, { cell: i });
    for (const [c] of last.cells) open.add(c);
    t += step;
  }
  void counts;
  return { last, t };
}

test('DFIX1 — the 4 am turn: start 3:58, a dig, a PAUSE at 3:59 → RESUME at 4:00:20, digs after 4:00 on the OLD board, finish → the start\'s day', async () => {
  await ensure('cc-tom', 'Tom', TURN - 3 * DAY_MS);
  const d0 = streakDay(TURN - 120e3), d1 = streakDay(TURN + 30e3);
  assert.equal(d0, 'd20261201'); assert.equal(d1, 'd20261202');
  const s = await A('cc-tom', 'start', TURN - 120e3);
  assert.equal(s.day, d0);
  const b0 = await ccBoard(d0), b1 = await ccBoard(d1);
  assert.notDeepEqual(b0.lights, b1.lights, 'the two days are different harbors');
  const L = new Set(b0.lights), opening = new Set(b0.open);
  const first = [...Array(108).keys()].find(i => !L.has(i) && !opening.has(i));
  await AD('cc-tom', 'dig', TURN - 110e3, d0, { cell: first });
  assert.equal((await AD('cc-tom', 'pause', TURN - 60e3, d0)).paused, true);
  // an old phone (no day) after the turn is out of step — today has no start for it
  await rejects(A('cc-tom', 'dig', TURN + 10e3, { cell: first }), 409, 'not_started');
  // a refresh across the turn resumes the old run (the paused one), nothing opened on the new day
  const back = await AD('cc-tom', 'start', TURN + 15e3, d0);
  assert.equal(back.day, d0); assert.equal(back.startedAt, TURN - 120e3); assert.equal(back.run.paused, true);
  assert.equal(await val(`dly/coastclear/${d1}/s/${await pidOf('cc-tom')}`), null);
  const r = await AD('cc-tom', 'resume', TURN + 20e3, d0);
  assert.equal(r.paused, false); assert.equal(r.pausedMs, 80e3); assert.equal(r.day, d0);
  const { last, t } = await digAll('cc-tom', d0, TURN + 25e3);
  assert.equal(last.done, true); assert.equal(last.out, 'clear'); assert.equal(last.day, d0);
  const rec = await val(`dly/coastclear/${d0}/p/${await pidOf('cc-tom')}`);
  const f = await AD('cc-tom', 'finish', t + 1000, d0);
  assert.equal(f.day, d0);
  assert.equal(f.score, Math.round((rec.e - (TURN - 120e3) - 80e3) / 1000) + 15, 'the clock + the pause (+15 s), from the record');
  assert.deepEqual(awards(f), ['lighthouse']);
  const pid = await pidOf('cc-tom'), ps = await val(`pstats/${pid}`);
  assert.equal(await val(`dly/coastclear/${d0}/r/${pid}`), f.score, 'recorded on the start\'s day');
  assert.equal(ps.st.d, d0); assert.ok(ps.it['emb-lighthouse']);
  // one try: a start asking for the scored run gets TODAY's fresh harbor; a move on the old day is refused
  const s1 = await AD('cc-tom', 'start', t + 2000, d0);
  assert.equal(s1.day, d1); assert.equal(s1.done, null); assert.equal(s1.run.done, false); assert.equal(s1.run.spots, 0);
  await rejects(AD('cc-tom', 'dig', t + 3000, d0, { cell: first }), 409, 'finished');
  await rejects(AD('cc-tom', 'dig', t + 3000, 'd20261130', { cell: first }), 400, 'bad_day');
  await rejects(AD('cc-tom', 'pause', t + 3000, 'd20261203'), 400, 'bad_day');
});

test('DFIX1 — THE PAUSE CAPS on the server: 3 pauses a run, then 409 pause_limit with the clock running; 20 minutes in all; an open pause past it closed at the cap', async () => {
  const MIN = 60_000;
  // the count
  await ensure('cc-pam', 'Pam');
  await A('cc-pam', 'start', NOW);
  for (let k = 0; k < 3; k++) {
    assert.equal((await A('cc-pam', 'pause', NOW + (2 * k + 1) * MIN)).pauses, k + 1);
    await A('cc-pam', 'resume', NOW + (2 * k + 2) * MIN);
  }
  const e = await rejects(A('cc-pam', 'pause', NOW + 7 * MIN), 409, 'pause_limit');
  assert.match(e.message, /clock is running/);
  const P = `dly/coastclear/${day}/p/${await pidOf('cc-pam')}`;
  let rec = await val(P);
  assert.equal(rec.p.n, 3); assert.equal(rec.p.ms, 3 * MIN); assert.equal(rec.p.at ?? null, null, 'a refused pause never stops the clock');
  // the total: an open pause past 20 minutes — the next call (a pause) closes it AT THE CAP and is refused
  await ensure('cc-ron', 'Ron');
  await A('cc-ron', 'start', NOW);
  await A('cc-ron', 'pause', NOW + MIN);
  await rejects(A('cc-ron', 'pause', NOW + 30 * MIN), 409, 'pause_limit');
  rec = await val(`dly/coastclear/${day}/p/${await pidOf('cc-ron')}`);
  assert.equal(rec.p.ms, 20 * MIN); assert.equal(rec.p.at ?? null, null, 'auto-resumed: the clock runs from the cap');
  await rejects(A('cc-ron', 'pause', NOW + 31 * MIN), 409, 'pause_limit');
  // a DIG after a long pause resumes at the cap; the finish counts the time past it
  await ensure('cc-sal', 'Sal');
  await A('cc-sal', 'start', NOW);
  await A('cc-sal', 'pause', NOW + 1000);
  const { last, t } = await digAll('cc-sal', day, NOW + 1000 + 45 * MIN);
  assert.equal(last.done, true);
  rec = await val(`dly/coastclear/${day}/p/${await pidOf('cc-sal')}`);
  assert.equal(rec.p.ms, 20 * MIN);
  const f = await A('cc-sal', 'finish', t + 1000);
  assert.equal(f.score, Math.round((rec.e - NOW - 20 * MIN) / 1000) + 15);
  assert.ok(f.score > 25 * 60, `the 25 minutes past the cap ran on the clock (${f.score})`);
});

test('DFIX1 — clean errors: a GUESS sent to COAST CLEAR (it owns no guess) → 400 bad_action, never a 500', async () => {
  await rejects(A('cc-ann', 'guess', NOW, { word: 'CRANE' }), 400, 'bad_action');
  await rejects(A('cc-ann', 'shoot', NOW), 400, 'bad_action');
  await rejects(A('cc-ann', 'dig', NOW, { day: 12345, cell: 3 }), 400, 'bad_day');
  await rejects(A('cc-ann', 'dig', NOW, { cell: { x: 1 } }), 422);
});
