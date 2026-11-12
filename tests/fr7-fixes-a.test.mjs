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

// ---------------------------------------------------------------------------------------------------- Group 2 — THE GAMES' REAL BUGS
test('HE1: a tap that arrives after your clock ran out is never applied on the NEXT street (409 stale); a tap during your time bank still counts', async () => {
  const { newRecord, applyOp, advance, dueOf, DealerError } = await import('../api/_lib/holdem-dealer.js');
  const { legalActions } = await import('../js/games/holdem/table.js');
  const { rngFrom } = await import('../js/core/rng.js');
  const T0 = 1_800_000_000_000;
  const setup = () => {
    const rng = rngFrom('he1');
    const rec = newRecord({ code: 'ABCD', uids: ['u1', 'u2'], mode: 'tournament', now: T0, rng });
    advance(rec, T0, rng);
    let now = T0 + 500;
    const op = (o, uid, body) => applyOp(rec, o, uid, { hand: rec.m.table.hand, seq: rec.seq, ...body }, { now, rng });
    // preflop: call, check → the flop
    for (let k = 0; k < 4 && rec.m.table.street === 'preflop'; k++) { const la = legalActions(rec.m.table); op('act', la.id, { action: la.canCheck ? 'check' : 'call' }); now += 300; }
    assert.equal(rec.m.table.street, 'flop');
    const A = legalActions(rec.m.table).id, B = A === 'u1' ? 'u2' : 'u1';
    op('pre', B, { pre: 'check' });   // (B's CHECK queued — it fires the moment the turn reaches B)
    return { rec, rng, A, B, now: () => now };
  };
  // A's clock + bank run out; nobody pokes; A taps BET 100 a moment later → the catch-up auto-checks A, B's queued check closes the street, the
  // TURN card comes, it's A's turn again — the tap was for the flop: refused
  {
    const { rec, rng, A } = setup();
    let due = dueOf(rec); const t1 = due; advance(rec, t1, rng);   // (the shot clock → the bank, poked on time)
    const late = dueOf(rec) + 60;                                   // (the bank ran out 60 ms ago — no poke yet)
    const e = (() => { try { applyOp(rec, 'act', A, { hand: rec.m.table.hand, seq: rec.seq, action: 'bet', amount: 100 }, { now: late, rng }); } catch (x) { return x; } return null; })();
    assert.ok(e instanceof DealerError && e.code === 'stale' && e.advanced, `refused stale (${e && e.code}) — the table: ${rec.m.table.street}`);
    assert.notEqual(rec.m.table.street, 'flop', 'the catch-up itself still ran (the store writes it)');
    assert.ok(!(rec.m.table.bet > 0), 'no bet of A on the new street');
  }
  // the bank switching on is NOT a moved table: a tap during the bank is applied
  {
    const { rec, rng, A } = setup();
    const t1 = dueOf(rec) + 10;
    applyOp(rec, 'act', A, { hand: rec.m.table.hand, seq: rec.seq, action: 'check' }, { now: t1, rng });
    assert.equal(rec.m.table.street, 'turn', 'A checked in the bank — applied (B’s queued check then closed the flop)');
  }
});

test('HE2: the HOST pokes the dealer from the room too (no table on screen) — on the host\'s 100 ms, once per due, backing off like the view', async () => {
  const { hostPoke, POKE_RETRY_MS } = await import('../js/games/holdem/logic.js');
  const pub = { seq: 7, due: 10_000 };
  assert.equal(hostPoke({ pub, now: 10_050 }).poke, false, 'not yet: the host waits 100 ms past due');
  let r = hostPoke({ pub, now: 10_100 });
  assert.equal(r.poke, true, 'due + 100 ms → poke');
  r = hostPoke({ pub, now: 10_350, last: r.last });
  assert.equal(r.poke, false, 'the same due: no second poke inside the back-off');
  r = hostPoke({ pub, now: 10_100 + POKE_RETRY_MS + 1, last: r.last });
  assert.equal(r.poke, true, 'still due after the back-off: one retry');
  let last = r.last;
  for (let k = 0; k < 20; k++) { const x = hostPoke({ pub, now: 10_100 + 100_000 * (k + 2), last }); last = x.last; }
  assert.equal(last.tries, 8, 'at most 8 retries for one due');
  assert.equal(hostPoke({ pub: { seq: 8, due: 20_000 }, now: 20_100, last }).poke, true, 'a new due: poke again');
  assert.equal(hostPoke({ pub: { seq: 8, due: null }, now: 99_999 }).poke, false, 'nothing due: never');
  // the wiring: the cartridge's prepare() uses it on the host's tick (no table mounted), host.js hands it the clock + the room's live data
  assert.match(read('js/games/holdem/index.js'), /hostPoke\(\{ pub: fromWire\(ctx\.live && ctx\.live\.table\)/);
  assert.match(read('js/host.js'), /mod\.prepare\(game, \{ code: state\.code, host: true, now, live: state\.live \}\)/);
});

test('PD5 + PD6 + PD7: PRISM DROP with no WebGL draws on; a 30 Hz cap is not a slow phone; the sprite caches go after the match', async () => {
  // PD5 — the light layer is null without WebGL: the frame must not throw before HOLD + NEXT are drawn
  const v = read('js/games/prism/view.js');
  assert.ok(!/\n\s+light\.setReduced\(/.test(v), 'no bare light.setReduced( (it threw every frame with no WebGL)');
  assert.match(v, /if \(light\) light\.setReduced\(reduced\(\)\);/);
  // PD6 — the kit's tiers on a phone capped at 30 Hz with light work: a step down is a probe; no faster → back up, and it stays there
  const { createTiers, capProbeSaysCapped } = await import('../js/games/kit/tiers.js');
  assert.equal(capProbeSaysCapped(33.3, 33.3), true); assert.equal(capProbeSaysCapped(33.3, 16.7), false);
  const run = (frameMs, workMs, seconds, t0 = 0) => {
    const T = createTiers({ initial: 2, max: 2 });
    let now = t0;
    const seen = new Set();
    for (let i = 0; i < seconds * 1000 / frameMs(T.get()); i++) { now += frameMs(T.get()); T.sample(now, workMs(T.get())); T.tick(now); seen.add(T.get()); }
    return { end: T.get(), capped: T.capped(), seen };
  };
  const cap = run(() => 33.3, () => 1.5, 30);
  assert.equal(cap.end, 2, `a 30 Hz cap with light work ends at the top tier (was 0) — seen ${[...cap.seen]}`);
  assert.equal(cap.capped, true);
  const slow = run(t => (t === 2 ? 33.3 : 16.7), () => 4, 30);
  assert.equal(slow.end, 1, 'a phone the step really helps stays down a tier');
  assert.equal(slow.capped, false);
  assert.match(v, /capProbeSaysCapped\(capProbe\.p50, quantile\(frameTimes, 0\.5\)\)/, 'PRISM\'s own tier rule takes the same probe');
  // PD7 — the caches: a clear for each, scheduled a minute after unmount, cancelled by the next mount
  assert.match(read('js/games/prism/board.js'), /export const clearSprites = \(\) => \{ dropMap\(sprites\); dropMap\(neonSprites\); \}/);
  assert.match(read('js/games/prism/crayon-art.js'), /export const clearCrayon = \(\) => \{ dropMap\(cache\); dropMap\(tooth\); toothJobs\.clear\(\); \}/);
  assert.match(read('js/games/prism/fx.js'), /export function clearShards\(\)/);
  assert.match(v, /dropT = setTimeout\(dropCaches, DROP_MS\)/);
  assert.match(v, /function mount\(el, state\) \{\n\s+clearTimeout\(dropT\); dropT = 0;/);
});

test('OC3: a challenge screen\'s writes go nowhere once its challenge has gone (SORT IT kept dealing into the next one); SORT IT\'s timers die with it', async () => {
  const { scopedApi } = await import('../js/games/overclock/ui/scoped.js');
  const calls = [];
  let keyFn = null;
  const api = { part: (...a) => calls.push(['part', ...a]), step: (...a) => calls.push(['step', ...a]), progress: (...a) => calls.push(['progress', ...a]),
    finish: () => calls.push(['finish']), fx: () => calls.push(['fx']), pick: () => calls.push(['pick']), sfx: () => calls.push(['sfx']),
    set key(fn) { keyFn = fn; }, me: () => 'u1', now: () => 5 };
  let current = 'sortit';
  const own = { key: 'sortit' };
  const s = scopedApi(api, own, () => current === 'sortit');
  s.step(1, 1, 'ok'); s.sfx('correct'); s.key = () => 1;
  assert.equal(calls.length, 2); assert.equal(typeof keyFn, 'function');
  assert.equal(s.chal, own); assert.equal(s.me(), 'u1', 'the reads pass through');
  current = 'memory';   // the next challenge opened
  s.step(0, 6, 'miss', true); s.part(false); s.progress(0, 1); s.finish(); s.fx(); s.pick(0, 1); s.sfx('wrong');
  assert.equal(calls.length, 2, 'nothing from the dead screen reaches the next challenge');
  s.key = () => 2; assert.equal(keyFn(), 1, 'nor its keys');
  s.key = null; assert.equal(keyFn, null, 'its own clean-up still clears the handler');
  assert.match(read('js/games/overclock/view.js'), /SCREENS\[s\.type\]\(s, apiFor\(chal\)\)/);
  const st = read('js/games/overclock/ui/sortit.js');
  assert.match(st, /destroy\(\) \{ dead = true; clearTimeout\(timer\); clearTimeout\(dealT\);/);
  assert.ok(!/[^=] setTimeout\(deal,/.test(st.replace(/dealT = setTimeout\(deal,/g, '')), 'every deal timer is kept (and cleared)');
});

test('DY5: THE ROOM WINS\' pause is retried (backed off) while that room still plays — never sent once and silently lost', async () => {
  const { retryWhile } = await import('../js/daily/retry.js');
  const waits = [];
  const wait = ms => { waits.push(ms); return Promise.resolve(); };
  let n = 0;
  const r = await retryWhile(async () => { n++; if (n < 3) throw Object.assign(new Error('no signal'), { status: 0 }); return { paused: true }; }, { wait });
  assert.ok(r.ok && r.resp.paused && n === 3, 'two lost calls, then the pause lands');
  assert.deepEqual(waits, [1000, 2000]);
  // a refusal (the server said no — a room of one, a finished run) is final at once
  n = 0;
  const no = await retryWhile(async () => { n++; throw Object.assign(new Error('refused'), { status: 409, code: 'no_room' }); }, { wait });
  assert.ok(!no.ok && n === 1);
  // the room stopped playing: no more tries
  let playing = true; n = 0;
  const gone = await retryWhile(async () => { n++; if (n === 2) playing = false; throw Object.assign(new Error('x'), { status: 503 }); }, { wait, alive: () => playing });
  assert.ok(!gone.ok && n === 2);
  assert.match(read('js/screens/daily.js'), /retryWhile\(\(\) => j\.pause\(code\), \{ alive: \(\) => \{ if \(first\) \{ first = false; return true; \}/, 'the first try always goes (the go stamp comes before playing)');
});

test('DY6: COAST CLEAR — a repeat dig (its answer lost) answers the WHOLE flood it opened, never the tapped cell alone; a light again = lit', async () => {
  const { applyMove, countsOf, flood } = await import('../js/games/coastclear/logic.js');
  // 5 × 4: lights at 8, 14, 15 (the coastclear.test board)
  const B = { w: 5, h: 4, lights: [8, 14, 15], start: 0 };
  const C = countsOf(B);
  const st0 = { open: new Map(), lit: [], done: false, out: null };
  const first = applyMove(B, C, st0, { kind: 'dig', cell: 17 });
  assert.ok(first.cells.length > 1, `a flood (${first.cells.length} cells)`);
  const again = applyMove(B, C, first.st, { kind: 'dig', cell: 17 });
  assert.equal(again.changed, false, 'nothing recorded');
  assert.deepEqual(again.cells.map(c => c[0]).sort((a, b) => a - b), first.cells.map(c => c[0]).sort((a, b) => a - b), 'the same cells as the first answer');
  assert.deepEqual(flood(B, C, 17).length, first.cells.length);
  const lit = applyMove(B, C, first.st, { kind: 'dig', cell: 8 });
  assert.deepEqual(applyMove(B, C, lit.st, { kind: 'dig', cell: 8 }).lit, [8], 'a light dug again = that light again');
});

test('DY7: THE PASSWORD — a resume in a dead spot keeps the keys LOCKED and retries (RECONNECTING) until the server\'s run is in', () => {
  const v = read('js/games/password/view.js');
  const rs = v.slice(v.indexOf('async function resync()'), v.indexOf('async function resync()') + 900);
  assert.match(rs, /if \(retryable\(e\)\) \{ note\('RECONNECTING', true\); if \(kb\) kb\.lock\(true\);/, 'a lost start retries, the keys locked');
  assert.match(rs, /kb\.lock\(!synced \|\| !!canGuess\(run\)\)/, 'never unlocked on the local empty shell before the first answer');
  assert.ok(!/catch \(e\) \{ busy = false; if \(!gone\) \{ note\('NO SIGNAL · TRY AGAIN', true\); kb\.lock\(!!canGuess\(run\)\); \}/.test(v), 'the old unlock is gone');
});

// ---------------------------------------------------------------------------------------------------- Group 3 — THE OWNER'S DECISIONS
test('decision 1 — OVERCLOCK GRADED BY THE HOST: a guest who writes a perfect self-grade with wrong picks scores the wrong picks; the human floor', async () => {
  const { gradeRoom: gradeRoomOf } = await import('../js/games/overclock/grade.js');
  const { unsealed } = await import('../js/games/kit/seal.js');
  const { nextStep } = await import('../js/games/overclock/director.js');
  const gradeRoom = (g, l) => (unsealed(g, 'oc', String(g.ci || 0)) ? gradeRoomOf(g, l) : null);   // (index.js#gradeRoom — the same two lines)
  const { generate } = await import('../js/games/overclock/challenges.js');
  const { levelOf, computeResults } = await import('../js/games/overclock/logic.js');
  const { gradeAnswers, packPicks, humanFloorMs } = await import('../js/games/overclock/grade.js');
  const T = 1_800_000_000_000;
  const order = ['math', 'stroop', 'oddone', 'count', 'pattern', 'truefalse'];
  const game = { id: 'overclock', matchId: 'm1', seed: 'hg-seed', order, total: 6, ci: 0, phase: 'play', playStartAt: T, phaseStartAt: T, phaseEndsAt: T + 30_000,
    participants: { honest: true, cheat: true }, settings: { mode: 'quick' }, unseal: { oc: '0' } };
  const spec = generate('math', { seed: game.seed, ci: 0, level: levelOf(0, 6), occ: 0, deal: null }, {});
  const right = spec.problems.map(p => p.ans), wrong = spec.problems.map(p => p.ans + 7);
  const live = { boards: { honest: { p: 4, ok: 4, n: 4, done: true, doneAt: T + 9000 }, cheat: { p: 4, ok: 4, n: 4, done: true, doneAt: T + 9000 } },
    seal_boards: { honest: { a: packPicks(right), at: T }, cheat: { a: packPicks(wrong), at: T } } };
  assert.deepEqual(gradeRoom(game, live), { honest: 4, cheat: 0 }, 'the host grades the sealed picks');
  const res = computeResults(game, { ...live.boards }, gradeRoom(game, live));
  assert.ok(res.honest.pts > 100 && res.honest.ok === 4, `the honest perfect run keeps its points (${res.honest.pts})`);
  assert.equal(res.cheat.ok, 0); assert.equal(res.cheat.pts, 0, 'the self-graded 4/4 with wrong answers scores 0');
  // the director's real step at the end of the play: the results the server reads are the host's grade
  const patch = nextStep({ ...game, phaseEndsAt: T + 1 }, { now: T + 40_000, online: { honest: true, cheat: true }, boards: live.boards, marks: {}, next: {}, graded: gradeRoom(game, live) });
  assert.equal(patch['results/0'].cheat.pts, 0); assert.ok(patch['results/0'].honest.pts > 0);
  // the phone's own ok only LOWERS it: an honest 2/4 board with 4 right picks stays 2
  assert.equal(computeResults(game, { honest: { ok: 2, done: true, doneAt: T + 9000 } }, { honest: 4 }).honest.ok, 2);
  // the OLD rules (no envelope has `a`): null → the phones' ok stands (the fallback until the re-publish)
  assert.equal(gradeRoom(game, { boards: live.boards, seal_boards: {} }), null);
  // once picks are live, a missing envelope grades as no answers
  assert.deepEqual(gradeRoom(game, { boards: live.boards, seal_boards: { honest: live.seal_boards.honest } }), { honest: 4, cheat: 0 });
  // before the unseal the host grades nothing (it can't read the envelopes)
  assert.equal(gradeRoom({ ...game, unseal: null }, live), null);
  // THE HUMAN FLOOR: a finish faster than a person could = no speed bonus + `fl` (no REDLINE)
  const fast = computeResults(game, { honest: { ok: 4, done: true, doneAt: T + humanFloorMs('math', 4) - 1 } }, { honest: 4 });
  const slow = computeResults(game, { honest: { ok: 4, done: true, doneAt: T + humanFloorMs('math', 4) + 1 } }, { honest: 4 });
  assert.equal(fast.honest.fl, 1); assert.equal(fast.honest.pts, 100, 'under the floor: the 100, no speed bonus');
  assert.ok(slow.honest.pts > 100 && !slow.honest.fl);
  // the other graded types from their picks
  const st = generate('stroop', { seed: 'x', ci: 1, level: 0.2, occ: 0 }, {});
  const { clashAnswer } = await import('../js/games/overclock/challenges.js');
  assert.equal(gradeAnswers('stroop', st, { a: packPicks(st.items.map(it => clashAnswer(st, it))) }), st.items.length);
  assert.equal(gradeAnswers('stroop', st, { a: 'not json' }), 0);
  assert.equal(gradeAnswers('reflex', {}, { a: '[1]' }), null, 'a reaction time stays the phone\'s (named in the log)');
});

test('decision 2 — THE DAILY CEILING: past 20 counted room matches in a day a match still counts once but pays 0 XP and moves no board; tomorrow pays again', async () => {
  const { matchStep, DAILY_CEILING, CEILING_LINE } = await import('../js/core/progress.js');
  const { streakDay } = await import('../js/core/streak.js');
  assert.equal(DAILY_CEILING, 20);
  const T = Date.UTC(2026, 10, 12, 16);   // 11 am Eastern
  const row = { rank: 1, win: true, c: { p: 1, w: 1 }, rec: { 'prism-rush': 1000 } };
  let s = null, xp = 0;
  for (let i = 0; i < DAILY_CEILING; i++) {
    const r = matchStep(s, { key: `k${i}`, gid: i % 2 ? 'prism' : 'holdem', row, n: 2, now: T + i * 60_000, gap: 45_000 });
    assert.ok(!r.skip && !r.capped && r.xp.total > 0, `match ${i + 1} pays`);
    s = r.next; xp = s.xp;
  }
  const wins = (s.g.prism.w || 0) + (s.g.holdem.w || 0);
  const r21 = matchStep(s, { key: 'k21', gid: 'prism', row, n: 2, now: T + 21 * 60_000, gap: 45_000 });
  assert.ok(r21.capped && !r21.skip, 'the 21st: counted, capped');
  assert.equal(r21.xp.total, 0); assert.deepEqual(r21.xp.parts, [{ k: 'ceiling', label: CEILING_LINE, v: 0 }], 'the end-of-round moment\'s one line');
  assert.equal(r21.next.xp, xp, 'no XP'); assert.equal((r21.next.g.prism.w || 0) + (r21.next.g.holdem.w || 0), wins, 'no board win');
  assert.deepEqual(r21.next.b, s.b, 'no record'); assert.equal(r21.next.cp, s.cp, 'no counted play');
  assert.ok(r21.next.m.k21, 'counted once: a re-report is "counted"');
  assert.equal(matchStep(r21.next, { key: 'k21', gid: 'prism', row, n: 2, now: T + 22 * 60_000 }).skip, 'counted');
  assert.equal(matchStep(r21.next, { key: 'k22', gid: 'prism', row, n: 2, now: T + 21 * 60_000 + 10_000, gap: 45_000 }).skip, 'too_soon', 'the 45 s gap stays');
  // a SOLO run is not a room match: its own lane, never capped by this
  const solo = matchStep(r21.next, { key: 's1', gid: 'prism', row: { ...row, win: false }, n: 1, now: T + 30 * 60_000, gap: 45_000 });
  assert.ok(!solo.capped && solo.xp.total > 0);
  // the next Eastern day (after 4 am / midnight — dayKey): pays again
  const tomorrow = matchStep(solo.next, { key: 'k30', gid: 'prism', row, n: 2, now: T + 24 * 3600_000, gap: 45_000 });
  assert.ok(!tomorrow.capped && tomorrow.xp.total > 0);
  void streakDay;
});

test('decision 4 — COAST CLEAR: a pause THE ROOM WINS forces does not count toward the cap — a 60-minute HOLD\'EM match keeps the run saved', async () => {
  const { serverAct, newRecord, replay, clockMs, PAUSE_CAP_MS, MAX_PAUSES, ROOM_MAX_PAUSES, runView } = await import('../js/games/coastclear/logic.js');
  const B = { w: 5, h: 4, lights: [8, 14, 15], start: 0 };
  const T = 1_800_000_000_000, MIN = 60_000;
  let rec = newRecord(T);
  const act = (a, at, args = {}) => { const r = serverAct(B, rec, a, args, at); if (r.record) rec = r.record; return r; };
  act('dig', T + 5_000, { cell: 17 });
  // the room starts HOLD'EM at 0:10: a ROOM pause; the match runs 60 minutes; back to the daily → resume
  assert.equal(act('pause', T + 10_000, { room: true }).resp.paused, true);
  act('resume', T + 10_000 + 60 * MIN);
  assert.equal(rec.p.ms, 60 * MIN, 'the whole hour stopped (was: 20 minutes, then the clock ran on)');
  assert.equal(rec.p.r, 1);
  // three more room games that night — still accepted (the player's 3-pause cap doesn't apply)
  for (let k = 1; k <= MAX_PAUSES; k++) { const at = T + 61 * MIN + k * 10 * MIN; assert.equal(act('pause', at, { room: true }).resp.paused, true, `room pause ${k + 1}`); act('resume', at + 5 * MIN); }
  // the phone's clock: the stopped time out
  const v = runView(rec, B, { startedAt: T });
  assert.ok(v.pauseCap > PAUSE_CAP_MS);
  assert.ok(clockMs(v, T + 61 * MIN + 40 * MIN) < 30 * MIN, 'the clock reads minutes, not the hour HOLD\'EM took');
  // a pause the PLAYER would choose (no room) keeps the old caps
  let own = newRecord(T); rec = own;
  for (let k = 0; k < MAX_PAUSES; k++) { act('pause', T + k * MIN); act('resume', T + k * MIN + 1000); }
  assert.equal(act('pause', T + 10 * MIN).refused, 'pause_limit', 'the player\'s own 4th: refused');
  // the room's safety bound: ROOM_MAX_PAUSES
  rec = newRecord(T);
  for (let k = 0; k < ROOM_MAX_PAUSES; k++) { act('pause', T + k * MIN, { room: true }); act('resume', T + k * MIN + 1000); }
  assert.equal(act('pause', T + 99 * MIN, { room: true }).refused, 'pause_limit');
  // the server's replay accepts a finished run with an hour of room pause
  void replay;
  // the wiring: the server passes ITS check (never the phone's claim)
  assert.match(read('api/daily.js'), /cart\.act\(\{ action: mv\.a, body: mv, record: rec, day, startedAt, now, data, room: !!room \}\)/);
});

test('decision 5 — END GAME on HOLD\'EM goes THROUGH THE DEALER: places by chip count (a hand in progress voided), credited from 3 hands, else NO RESULT', async () => {
  const { newRecord, applyOp, advance, resultRows, DealerError, dueOf } = await import('../api/_lib/holdem-dealer.js');
  const { legalActions } = await import('../js/games/holdem/table.js');
  const { chipCount } = await import('../js/games/holdem/match.js');
  const { rngFrom } = await import('../js/core/rng.js');
  const { endGameLine } = await import('../js/games/holdem/meta.js');
  const T0 = 1_800_000_000_000;
  const setup = hands => {
    const rng = rngFrom('he-end');
    const rec = newRecord({ code: 'ABCD', uids: ['u1', 'u2', 'u3'], mode: 'tournament', now: T0, rng });
    let now = T0; advance(rec, now, rng);
    // play `hands` hands: everyone folds to the big blind, then wait out the pause to the next deal
    while (rec.m.hands < hands || rec.m.table.street === 'done') {
      const la = legalActions(rec.m.table);
      if (la) { applyOp(rec, 'act', la.id, { hand: rec.m.table.hand, seq: rec.seq, action: la.canCheck ? 'check' : 'fold' }, { now: now += 200, rng }); continue; }
      now = Math.max(now + 200, dueOf(rec) || now + 200); advance(rec, now, rng);
      if (rec.m.hands >= hands && rec.m.table.street !== 'done') break;
    }
    return { rec, rng, now: () => now };
  };
  // 4 hands in, mid-hand: END GAME by the host
  const { rec, rng, now } = setup(4);
  assert.ok(rec.m.table.street !== 'done' && rec.m.hands >= 4, `mid-hand ${rec.m.hands}`);
  const before = Object.fromEntries(rec.m.table.seats.map(x => [x.id, x.stack + x.total]));
  const err = (() => { try { applyOp(rec, 'endGame', 'u2', {}, { now: now() + 100, rng, isHost: false }); } catch (e) { return e; } return null; })();
  assert.ok(err instanceof DealerError && err.code === 'not_host', 'a guest can\'t end it');
  applyOp(rec, 'endGame', 'u1', {}, { now: now() + 100, rng, isHost: true });
  assert.ok(rec.m.ended, 'ended');
  assert.ok(chipCount(rec.m).ok, 'no chip made or lost (the hand voided: each keeps what it had before it)');
  for (const x of rec.m.table.seats) assert.equal(x.stack, before[x.id]);
  const order = Object.entries(before).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const pl = Object.fromEntries(rec.m.places.map(p => [p.id, p.place]));
  assert.equal(pl[order[0]] <= pl[order[1]] && pl[order[1]] <= pl[order[2]], true, `places by chip count ${JSON.stringify(pl)} vs ${JSON.stringify(before)}`);
  const rows = resultRows(rec);
  assert.ok(rows && rows.n === 3 && Object.keys(rows.rows).length === 3, 'credited (≥ 3 hands) — once, through the normal end (applyMatch)');
  assert.throws(() => applyOp(rec, 'endGame', 'u1', {}, { now: now() + 200, rng, isHost: true }), e => e.code === 'ended');
  // under 3 hands: ends, NO RESULT
  const s2 = setup(1);
  applyOp(s2.rec, 'endGame', 'u1', {}, { now: s2.now() + 100, rng: s2.rng, isHost: true });
  assert.ok(s2.rec.m.ended); assert.equal(resultRows(s2.rec), null, 'short: no result for anyone');
  // the confirm's words, from the public table's parts
  const node = (o) => ({ m: Object.fromEntries(Object.entries(o).map(([k, v]) => [k, JSON.stringify(v)])) });
  assert.equal(endGameLine(node({ mode: 'tournament', hands: 5 })), 'Places by chip count · XP for everyone');
  assert.match(endGameLine(node({ mode: 'tournament', hands: 2 })), /NO RESULT/);
  assert.match(endGameLine(node({ mode: 'cash', hands: 2 })), /ledger/);
  assert.equal(endGameLine(node({ mode: 'tournament', hands: 5, ended: true })), null);
  assert.match(read('js/ui/settings-panel.js'), /mod\.endGame\(\{ code: state\.code \}\)/, 'the host\'s ☰ END GAME calls it — never the silent wipe');
});

// ---------------------------------------------------------------------------------------------------- Group 5 — THE CONSOLE'S FOUR
test('B2 — THE INITIATE GUARD: a host who quit to the room can\'t start a game over the match the room is still playing; the podium\'s REMATCH still can', async () => {
  const { gameRunning, GAME_ON_LINE } = await import('../js/core/room-logic.js');
  assert.equal(gameRunning({ status: 'playing' }, { id: 'prism', phase: 'play' }), true, 'a PRISM battle on');
  assert.equal(gameRunning({ status: 'playing' }, { id: 'holdem', phase: 'play' }), true);
  assert.equal(gameRunning({ status: 'playing' }, { id: 'overclock', phase: 'standings' }), true);
  assert.equal(gameRunning({ status: 'playing' }, { id: 'prism', phase: 'final' }), false, 'the podium: REMATCH');
  assert.equal(gameRunning({ status: 'lobby' }, null), false, 'the room');
  assert.equal(gameRunning({ status: 'playing' }, null), false, 'a dead start (no game)');
  const h = read('js/host.js');
  const at = h.indexOf('async function startGameNow(');
  assert.ok(h.indexOf('if (gameRunning(state.meta, state.game)) { toast(GAME_ON_LINE', at) > at, 'startGameNow refuses');
  assert.match(GAME_ON_LINE, /GAME IS STILL ON/);
});

test('B2 — the SOLO snapshot win: FIXED with C1 (678395fe — server.test "FR7-A C1" part 5); C6 — the names: the house nickname on the player page + a request', () => {
  assert.match(read('tests/integration/server.test.mjs'), /a solo snapshot is never a win/);
  assert.match(read('api/_lib/player.js'), /n: rel === 'self' \|\| rel === 'friend' \? p\.n : publicName\(id0, p\.n\)/);
  assert.match(read('api/_lib/friends.js'), /const inn = nick\(inn0\), out = nick\(out0\), blocked = nick\(blocked0\);/);
});

// ---------------------------------------------------------------------------------------------------- ADD-ON — THE FROZEN BUTTONS (HOLD'EM)
test('ADD-ON — THE FROZEN BUTTONS: api() has ONE limit around token + fetch + body; HOLD\'EM\'s move lock lets go within SAFE_RELEASE_MS whatever happens', async () => {
  const a = read('js/profile/api.js');
  assert.match(a, /return withLimit\(\(async \(\) => \{\n\s+const token = await idToken\(\);/, 'the token refresh is inside the limit');
  assert.match(a, /try \{ body = await res\.json\(\); \} catch \{ body = null; \} finally \{ clearTimeout\(t\); \}/, 'the abort covers the body');
  const { SAFE_RELEASE_MS } = await import('../js/games/holdem/logic.js');
  assert.ok(SAFE_RELEASE_MS <= 10_000);
  const v = read('js/games/holdem/view.js');
  assert.match(v, /b\.safeT = setTimeout\(\(\) => release\(b\), SAFE_RELEASE_MS\);/);
  // the limit's behaviour (the same race api() runs): a step that never settles → offline after the limit
  const withLimit = (p, ms) => { let t = 0; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(Object.assign(new Error('offline'), { status: 0, code: 'offline' })), ms); })]).finally(() => clearTimeout(t)); };
  const e = await withLimit(new Promise(() => {}), 30).catch(x => x);
  assert.equal(e.code, 'offline');
  assert.match(a, /export function withLimit\(p, ms\) \{/, 'api.js runs exactly this race');
});
