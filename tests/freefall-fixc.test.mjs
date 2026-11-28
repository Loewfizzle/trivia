// FREEFALL — THE FIX PASS, PART C (Nov 27 — docs/games/passes/freefall-fixc.md): THE SCORING. S3 THE HOLD (a too-perfect row) · S2 THE
// COPYCAT (a match's twin landings) · S4 a match's END-BURST · S5 a hold's longest · N7 THE RULE-SET LEAF. Pure (the server's half included:
// api/_lib/freefall.js imports no package). The wider sims are in the pass log (200 seeds a bot · 1,680 room pairs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRun, turn, stepTo, isOver, resultOf, logOf, floorNow } from '../js/games/freefall/engine.js';
import { MAX_SPIN, SLICES, MODES } from '../js/games/freefall/tuning.js';
import { sliceStart, wrap, angDiff } from '../js/games/freefall/tower-gen.js';
import { BOT_IDS, makeBot, playBot } from '../js/games/freefall/bot.js';
import { botRun } from '../js/games/freefall/matchsim.js';
import { matchStart, matchRules } from '../js/games/freefall/match.js';
import { gameStandings } from '../js/games/freefall/logic.js';
import { judgeMatch, judgeNode, clockProblem, finalCount, packRange, START_LEAD_MS, HOLD_MAX_MS, END_BURST_MS, RESUME_LEAD_MS } from '../js/games/freefall/proof.js';
import { ffTooPerfect, FF_HOLD, extractMatch } from '../js/core/match-report.js';
import { freefallMatch, copyScore, isCopy, COPY, prefixFloor } from '../api/_lib/freefall.js';

const MS = 1000 / 60, CODE = 'TEST', G0 = 1_800_000_000_000;
/** THE PERFECT SCRIPT (the review's p1): reads the tower, spins toward the nearest gap at `spin` a tick */
function perfectRun(seed, mode, { spin = MAX_SPIN, maxFloor = Infinity } = {}) {
  const run = createRun({ seed, mode }), cap = MODES[mode].capTicks;
  for (let T = 0; !isOver(run) && T < cap && run.floor < maxFloor; T++) {
    const fl = floorNow(run);
    let best = null;
    for (let s = 0; s < SLICES; s++) { if (!((fl.gap >> s) & 1)) continue; const a = wrap(-Math.floor((sliceStart(s) + sliceStart(s + 1)) / 2) - fl.twist), d = angDiff(a, run.a); if (best === null || Math.abs(d) < Math.abs(best)) best = d; }
    if (best) turn(run, T, Math.max(-spin, Math.min(spin, best)));
    stepTo(run, T);
  }
  if (!isOver(run)) stepTo(run, cap);
  return run;
}
const nodeOfBot = (B, S, lagMs = 0, go = S.g0) => ({ go, c: Object.fromEntries(B.chunks.map((k, i) => [i, { s: k.s, at: Math.round(S.playAt + k.at * MS) + lagMs }])), e: B.end.e });

test('S3 THE HOLD: no sim bot is ever held (4 bots × solo + match × 30 seeds); the scripts always are', () => {
  assert.deepEqual(FF_HOLD, { bestRun: 40, from: 100, rate: 0.3 });
  for (const mode of ['solo', 'match']) for (const id of BOT_IDS) for (let i = 0; i < 30; i++) {
    const run = createRun({ seed: `fxh-${mode}-${id}-${i}`, mode });
    playBot(run, makeBot(id, `b${i}`));
    const r = resultOf(run), row = { f: r.floor, b: r.bounces, br: r.bestRun };
    assert.equal(ffTooPerfect(row), false, `${mode} ${id} #${i}: floor ${r.floor} · ${r.bounces} bounces · best run ${r.bestRun} — never held`);
  }
  for (const [spin, why] of [[MAX_SPIN, 'MAX SPIN'], [68, 'a human\'s spin'], [40, 'a slow spin']]) for (let i = 0; i < 6; i++) {
    const r = resultOf(perfectRun(`fxs-${i}`, 'solo', { spin, maxFloor: 400 }));
    if (r.floor < 60) continue;   // (a slow script that died early earns nothing worth holding)
    assert.equal(ffTooPerfect({ f: r.floor, b: r.bounces, br: r.bestRun }), true, `the script at ${why}: floor ${r.floor} · ${r.bounces} bounces · best run ${r.bestRun} — HELD`);
  }
  // held = no board row, no average, no cards — named for /admin; the XP is the step's (not here)
  const game = { id: 'freefall', matchId: 'm1', phase: 'final', mode: 'solo', sv: 1, participants: { u1: true }, settings: {}, results: { u1: { f: 401, t: 7000, w: 'dark', e: 7100, b: 1, br: 401, ft: 'reachedHarbor terminal reachedBottom' } } };
  const ex = extractMatch(game);
  assert.equal(ex.rows.u1.rec && ex.rows.u1.rec.freefall, undefined); assert.equal(ex.rows.u1.f, undefined); assert.equal(ex.rows.u1.av, undefined);
  assert.ok(ex.rejected.some(r => r.uid === 'u1' && r.v === 'held' && r.f === 401 && r.br === 401), JSON.stringify(ex.rejected));
});

test('S2 THE COPYCAT: the review\'s probes — a copy 400 ms behind, a copy 1.5 s behind (+ the copy + ONE landing: the pass log) — are refused as `copy` (still PLAYED); honest rooms never', () => {
  for (let m = 0; m < 6; m++) {
    const matchId = `cp${m}`, S = matchStart(CODE, matchId, { A: { go: G0 } });
    const A = botRun(S.seed, 1, { bot: 'great' }), nodeA = nodeOfBot(A, S);
    const copy = { go: G0 + 30, c: Object.fromEntries(Object.entries(nodeA.c).map(([i, k]) => [i, { s: k.s, at: k.at + 400 }])) };
    const M = freefallMatch({ code: CODE, matchId, uids: ['A', 'B'], nodes: { A: nodeA, B: copy } });
    assert.equal(M.game.results.B.bad, 'copy', `room ${m}: the copy is refused`); assert.ok(!M.game.results.A.bad);
    assert.ok(M.played.includes('B'), '… it still PLAYED (prefixFloor)'); assert.equal(gameStandings(M.game)[0].uid, 'A');
    // a copy of A's moves 1.5 s behind on its own clock: the same landings — refused
    const late = { go: G0 + 30, c: Object.fromEntries(Object.entries(nodeA.c).map(([i, k]) => [i, { s: k.s, at: k.at + 1500 }])) };
    assert.equal(freefallMatch({ code: CODE, matchId, uids: ['A', 'B'], nodes: { A: nodeA, B: late } }).game.results.B.bad, 'copy');
  }
  // honest rooms (8 bots, the same tower): no pair is a copy — the pass's sims ran 60 rooms / 1,680 pairs (most alike: 17 in a row, 73 %)
  for (let m = 0; m < 6; m++) {
    const matchId = `hn${m}`, S = matchStart(CODE, matchId, { b0: { go: G0 } }), nodes = {}, uids = [];
    for (let k = 0; k < 8; k++) { const B = botRun(S.seed, k, { bot: ['great', 'great', 'good', 'human', 'great', 'good', 'human', 'sloppy'][k] }); nodes[B.uid] = nodeOfBot(B, S, 0, G0 + k); uids.push(B.uid); }
    const M = freefallMatch({ code: CODE, matchId, uids, nodes });
    for (const u of uids) assert.notEqual(M.game.results[u].bad, 'copy', `room ${m}: ${u} is never called a copy`);
  }
  assert.deepEqual(COPY, { run: 30, tol: 24, min: 60, share: 0.9 });
  // the score itself: a ±1-unit jitter changes nothing; a different landing breaks the row
  const L = Array.from({ length: 40 }, (_, i) => [i, i * 30, (i * 97) % 4096]);
  assert.equal(isCopy(copyScore(L, L.map(([f, t, a]) => [f, t, (a + 1) % 4096]))), true);
  assert.equal(isCopy(copyScore(L, L.map(([f, t, a], i) => [f, t, i % 20 === 19 ? (a + 900) % 4096 : a]))), false, 'a landing far off every 20: no row of 30, and the shorter is under 60');
  assert.equal(typeof prefixFloor, 'function');
});

test('S4 A MATCH\'s END-BURST: a run that ends inside a burst counts it only after ≤ 20 s of silence; a solo keeps the old rule', () => {
  assert.equal(END_BURST_MS, 20000);
  const S = matchStart(CODE, 'eb1', { A: { go: G0 } });
  const B = botRun(S.seed, 2, { bot: 'great' }), honest = nodeOfBot(B, S);
  const whole = judgeMatch({ seed: S.seed, node: honest, playAt: S.playAt });
  assert.ok(whole.ok && !whole.cut, whole.why);
  // the last 10 s of play arrive together, `silence` ms after the chunk before them
  const keys = Object.keys(honest.c).map(Number), endAt = honest.c[keys[keys.length - 1]].at, from = endAt - 10000;
  const burst = gap => { const c = {}; let first = null; for (const k of keys) { const v = honest.c[k]; if (v.at < from) c[k] = v; else { if (first === null) first = k; c[k] = { s: v.s, at: honest.c[first - 1].at + gap }; } } return { ...honest, c }; };
  const short = judgeMatch({ seed: S.seed, node: burst(14000), playAt: S.playAt });
  assert.ok(short.ok && short.floor === whole.floor, `a 14 s silence, then the burst: taken whole (${short.floor} of ${whole.floor}, ${JSON.stringify(short.cut)})`);
  const long = judgeMatch({ seed: S.seed, node: burst(40000), playAt: S.playAt });
  assert.ok(long.ok && long.cut && long.cut.why === 'behind' && long.floor < whole.floor, `a 40 s silence: CUT where it began (${long.floor} of ${whole.floor})`);
  // a SOLO never cuts a burst at its end (endBurst 0 — the old rule)
  const lastTimes = [{ at: G0 + START_LEAD_MS + 100, n: 1, t0: 1, t1: 1, s0: 0, s1: 0, hn: 0 }, { at: G0 + START_LEAD_MS + 60000, n: 1, t0: 600, t1: 600, s0: 0, s1: 0, hn: 0 }];
  assert.equal(clockProblem(G0, lastTimes), null); assert.equal(clockProblem(G0, lastTimes, [], [], END_BURST_MS).why, 'behind');
});

test('S5 A HOLD\'s LONGEST: a way back stamped more than 10 min after the hold = the run is CUT at that hold', () => {
  assert.equal(HOLD_MAX_MS, 600000);
  // (the judge's own path: judgeNode with a hold in the log is the proof tests' business — here the clock rule alone)
  const go = G0, holdTicks = [600], paused = go + START_LEAD_MS + 600 * MS, at = paused + 500;
  const times = [{ at, n: 1, t0: 600, t1: 600, s0: 0, s1: 0, hn: 1 }, { at: paused + 11 * 60000 + RESUME_LEAD_MS + 1000, n: 2, t0: 610, t1: 620, s0: 1, s1: 1, hn: 0 }];
  const ok = clockProblem(go, [times[0], { ...times[1], at: paused + 9 * 60000 + RESUME_LEAD_MS + 1000 }], holdTicks, [paused + 9 * 60000]);
  assert.equal(ok, null, 'a 9-minute hold: its way back has a clock');
  const cut = clockProblem(go, times, holdTicks, [paused + 11 * 60000]);
  assert.deepEqual(cut && [cut.why, cut.tick], ['hold', 600], 'an 11-minute hold: no way back — cut at the hold');
});

test('N7 THE RULE-SET LEAF: a node\'s `rs` (none = classic); unknown → refused; a match refuses a node naming another set; the rules file holds the leaf', () => {
  const S = matchStart(CODE, 'rs1', { A: { go: G0 } });
  const B = botRun(S.seed, 1, { bot: 'good' }), node = nodeOfBot(B, S);
  assert.equal(matchRules({ A: { go: G0 } }), 'classic'); assert.equal(matchRules({ A: { go: G0, rs: 'zz' } }), 'classic', 'a set nobody knows is never the match\'s');
  assert.equal(S.rs, 'classic');
  assert.ok(judgeMatch({ seed: S.seed, node, playAt: S.playAt, rules: 'classic' }).ok);
  assert.ok(judgeMatch({ seed: S.seed, node: { ...node, rs: 'classic' }, playAt: S.playAt, rules: 'classic' }).ok);
  assert.deepEqual(judgeMatch({ seed: S.seed, node: { ...node, rs: 'turbo' }, playAt: S.playAt, rules: 'classic' }), { ok: false, why: 'rules' });
  assert.equal(judgeNode({ seed: 's', mode: 'solo', node: { go: G0, rs: 'zz', c: {} } }).why, 'rules', 'a set the table does not hold');
  const rules = readFileSync('database.rules.json', 'utf8');
  assert.match(rules, /"ff": \{[\s\S]*"rs": \{\s*"\.write": "auth != null && auth\.uid === \$uid && newData\.exists\(\) && !data\.exists\(\) && root\.child\('rooms\/' \+ \$code \+ '\/ff\/'/);
  const view = readFileSync('js/games/freefall/view.js', 'utf8');
  assert.match(view, /dbSet\(dbRef\(path\), RULES_DEFAULT\)/);
});

test('GROUP 3 — THE TEST PAGE: the bot match (botmatch.js — lazy, page only; rivals ≤ MATCH_MAX − 1), &room=1 the old room, ☰ HOW TO PLAY through the one opener, SHARE on a click, lab.js lets its document listeners go', async () => {
  const { RIVALS_MAX, COUNT_MS } = await import('../js/games/freefall/botmatch.js');
  const { MATCH_MAX } = await import('../js/games/freefall/match.js');
  assert.equal(RIVALS_MAX, MATCH_MAX - 1); assert.equal(COUNT_MS, 3600);
  const play = readFileSync('js/games/freefall/play.js', 'utf8'), stage = readFileSync('js/games/freefall/stage.js', 'utf8'), lab = readFileSync('js/games/freefall/lab.js', 'utf8');
  assert.match(play, /const BOT_MATCH = MODE === 'match' && !Q\.has\('room'\) && \(OPTS\.rivals > 0 \|\| Q\.get\('spectate'\) === '1'\);/);
  assert.match(play, /lazyImport\(import\('\.\/botmatch\.js'\), '\.\/botmatch\.js'\)/);
  assert.doesNotMatch(readFileSync('js/games/freefall/index.js', 'utf8') + readFileSync('js/games/freefall/view.js', 'utf8'), /botmatch/, 'never in the cartridge');
  assert.match(stage, /lazyImport\(import\('\.\.\/\.\.\/ui\/help-open\.js'\), '\.\.\/\.\.\/ui\/help-open\.js'\)\.then\(m => m\.openHelp\('freefall', \{ only: true \}\)\)/);
  assert.ok(lab.includes("document.removeEventListener('keydown', onKeyDown); document.removeEventListener('keyup', onKeyUp);"));
  assert.match(readFileSync('js/ui/help.js', 'utf8'), /'A MATCH never pauses\.'/, 'N5');
});

test('GROUP 4 — THE FINISH CARD: bigger coloured bursts (gold + cyan by night, gold + teal by day) where the words are not, a dark vignette by day — fixed shapes, only on THE BOTTOM\'s gold card', () => {
  return import('../js/games/freefall/card.js').then(({ BURSTS }) => {
    assert.deepEqual(BURSTS.night, ['#ffc83c', '#00f0ff', '#ffc83c']); assert.deepEqual(BURSTS.day, ['#ffc83c', '#14d6cf', '#ffc83c']);
    for (const [fx, fy, fr] of BURSTS.at) assert.ok(fy - fr * 0.8 >= 0 && fy + fr <= 0.75 && !(fx < 0.55 && fy < 0.3), `a burst at ${fx}, ${fy} keeps clear of the cause's tab + the floors`);
    const src = readFileSync('js/games/freefall/card.js', 'utf8');
    assert.match(src, /if \(gold\) celebrate\(c, box, shot\);/); assert.doesNotMatch(src.slice(src.indexOf('function celebrate'), src.indexOf('/** the middle')), /Math\.random/);
  });
});
