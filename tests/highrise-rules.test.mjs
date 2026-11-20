// HIGH RISE S4B — THE RULE-SET TABLE (docs/highrise.md "THE RULE-SET TABLE"): every rule number — the start size, the speed curve + its
// wobble, the perfect window, grow-back, too thin, the travel, the fuse, the landing beat, the caps, the solo tightening — lives in ONE
// table (js/games/highrise/rules.js#RULE_SETS); today's only entry = "classic". Every run records its rule set; the judge checks it and
// refuses an unknown one. NOTHING CHANGED IN PLAY: THE GOLDEN DIGESTS below were computed on the engine BEFORE the table (commit aef32d95
// — the numbers still constants in tuning.js) over 720 bot runs (every mode × four bots × 60 seeds: each run's floor, ticks, cause,
// perfects, best streak, taps) + the whole EVENT stream of 36 of them — the same tap logs must still give the same digests, to the tick.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRun, stepTo, tap, isOver, resultOf } from '../js/games/highrise/engine.js';
import { judgeRun, replay } from '../js/games/highrise/replay.js';
import { gaussBot, playBot, BOTS } from '../js/games/highrise/bot.js';
import * as TUNING from '../js/games/highrise/tuning.js';
import { RULE_SETS, RULES_DEFAULT, RULES_ID_MAX, ruleSet, sweepBaseOf, sweepFloorMinOf } from '../js/games/highrise/rules.js';
import { judgeNode, judgeSolo, matchRules, packFrom } from '../js/games/highrise/proof.js';
import { seedOf } from '../js/games/highrise/logic.js';
import { highriseMatch, highriseSolo } from '../api/_lib/highrise.js';
import { scoreMatchNode } from '../js/games/highrise/director.js';

const { BEAT, FLOOR_TICKS_MAX, TICK_HZ } = TUNING;

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
/** FNV-1a over a string → 8 hex digits */
const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); };
const MODES3 = ['solo', 'match', 'daily'], SIG = [BOTS.sloppy, BOTS.casual, BOTS.good, BOTS.nearPerfect];
/** every mode × four bots × 60 seeds: the taps a bot makes + the judge's result of that log */
export function runsDigest(extra = {}) {
  let acc = '', n = 0;
  for (const mode of MODES3) for (const sigma of SIG) for (let k = 0; k < 60; k++) {
    const seed = `gold${k}`, taps = playBot(createRun({ seed, mode, ...extra }), gaussBot({ sigmaMs: sigma, seed: `g${k}` }));
    const j = judgeRun({ seed, mode, taps, ...extra });
    acc += `${mode}|${sigma}|${k}|${taps.length}|${fnv(taps.join('.'))}|${j.ok}|${j.floor}|${j.tick}|${j.end}|${j.cause}|${j.perfects}|${j.maxStreak}|${j.taps};`;
    n++;
  }
  return { n, digest: fnv(acc), len: acc.length };
}
/** the whole EVENT stream (every spawn, drop, perfect, grow, cut, land, out — with its numbers) of 36 runs */
export function eventsDigest(extra = {}) {
  let acc = '', evs = 0;
  for (const mode of MODES3) for (const sigma of SIG) for (let k = 0; k < 3; k++) {
    const seed = `ev${k}`, taps = playBot(createRun({ seed, mode, ...extra }), gaussBot({ sigmaMs: sigma, seed: `e${k}` }));
    const run = createRun({ seed, mode, ...extra }), ev = [];
    for (const t of taps) tap(run, t, ev);
    stepTo(run, (taps.length ? taps[taps.length - 1] : 0) + BEAT + FLOOR_TICKS_MAX, ev);
    const res = resultOf(run); delete res.rules;   // (the result's own name for its rule set came WITH the table: the digest is of what a run DID)
    acc += JSON.stringify(ev) + JSON.stringify(res) + isOver(run);
    evs += ev.length;
  }
  return { evs, digest: fnv(acc) };
}
// THE GOLDEN DIGESTS — computed BEFORE the rule-set table (aef32d95: `node tests/highrise-rules.test.mjs --print` printed them)
export const GOLD = Object.freeze({ runs: '9746d6b1', events: 'd1dc2c63', n: 720 });
if (process.argv.includes('--print')) { console.log(JSON.stringify({ runs: runsDigest(), events: eventsDigest() })); }

test('NOTHING CHANGED IN PLAY: the same tap logs → the same floors, ticks, causes, perfects, streaks — 720 bot runs + the whole event stream of 36, digest for digest as before the table', () => {
  const r = runsDigest(), e = eventsDigest();
  assert.equal(r.n, GOLD.n);
  assert.equal(r.digest, GOLD.runs, 'every run\'s result — to the tick');
  assert.equal(e.digest, GOLD.events, 'every event of every drop');
});

test('THE TABLE: every rule number in ONE row — "classic" = S1 / S2\'s numbers, to the unit; tuning.js only NAMES that row (never a second copy); the engine + the judge hold no rule number of their own', () => {
  const C = RULE_SETS.classic;
  assert.deepEqual(Object.keys(RULE_SETS), ['classic'], 'today\'s only rule set'); assert.equal(RULES_DEFAULT, 'classic');
  assert.deepEqual({ ...C, sweep: C.sweep.map(k => [...k]), tight: { ...C.tight }, modes: JSON.parse(JSON.stringify(C.modes)) }, {
    id: 'classic', start: 10000, perfect: 500, grow: 400, growStreak: 6, thin: 500, travel: 15000, fuseSweeps: 2, beat: 12,
    sweep: [[1, 140], [120, 84]], wobble: 3, tight: { from: 200, every: 10, by: 3, min: 24 },
    modes: { solo: { finish: null, capTicks: null }, match: { finish: 200, capTicks: 21600 }, daily: { finish: 200, capTicks: 18000 } },
    sweepMax: 140, sweepMin: 84, floorTicksMax: 292,
  }, 'the start size · the perfect window · grow-back · too thin · the travel · the fuse · the landing beat · the speed curve + its wobble · the solo tightening · the caps');
  assert.ok(Object.isFrozen(C) && Object.isFrozen(C.sweep) && Object.isFrozen(C.sweep[0]) && Object.isFrozen(C.tight) && Object.isFrozen(C.modes) && Object.isFrozen(C.modes.match), 'a row can not be changed in place');
  // tuning.js = the classic row BY NAME
  const T = TUNING;
  assert.deepEqual([T.START, T.PERFECT, T.GROW, T.GROW_STREAK, T.THIN, T.TRAVEL, T.FUSE_SWEEPS, T.BEAT, T.WOBBLE, T.SWEEP_MAX, T.SWEEP_MIN, T.FLOOR_TICKS_MAX], [C.start, C.perfect, C.grow, C.growStreak, C.thin, C.travel, C.fuseSweeps, C.beat, C.wobble, C.sweepMax, C.sweepMin, C.floorTicksMax]);
  assert.ok(T.SWEEP === C.sweep && T.TIGHT === C.tight && T.MODES === C.modes, 'the SAME objects — read out of the table');
  for (const f of [1, 2, 60, 119, 120, 200, 201, 209, 210, 300, 399, 400, 900]) { assert.equal(T.sweepBase(f), sweepBaseOf(C, f)); assert.equal(T.sweepFloorMin(f), sweepFloorMinOf(C, f)); }
  const tun = read('js/games/highrise/tuning.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');
  assert.doesNotMatch(tun, /= (?:10000|15000|500|400|140|84)\b/, 'no rule number is written in tuning.js any more');
  // the engine + the replay + the judge: no rule constant imported — they read the run's own row
  for (const f of ['engine.js', 'replay.js']) {
    const src = read(`js/games/highrise/${f}`), imp = (src.match(/import \{([^}]*)\} from '\.\/tuning\.js';/) || [, ''])[1];
    assert.doesNotMatch(imp, /\b(START|PERFECT|GROW|GROW_STREAK|THIN|TRAVEL|FUSE_SWEEPS|BEAT|WOBBLE|SWEEP|SWEEP_MAX|SWEEP_MIN|TIGHT|MODES|FLOOR_TICKS_MAX|sweepBase|sweepFloorMin)\b/, `${f} imports no rule number`);
    assert.match(src, /from '\.\/rules\.js';/);
  }
  assert.doesNotMatch(read('js/games/highrise/rules.js'), /^import /m, 'rules.js imports nothing');
});

test('EVERY RUN RECORDS ITS RULE SET; THE JUDGE CHECKS IT + REFUSES AN UNKNOWN ONE: the run · its result · the judge\'s answer · the proof node\'s `rs` (none = classic) · a match = ONE rule set (THE FIRST GO\'s)', () => {
  const run = createRun({ seed: 'rs1', mode: 'solo' });
  assert.equal(run.rules, 'classic'); assert.equal(run.R, RULE_SETS.classic); assert.equal(resultOf(run).rules, 'classic');
  assert.equal(createRun({ seed: 'rs1', mode: 'match', rules: 'classic' }).rules, 'classic');
  assert.throws(() => createRun({ seed: 'rs1', mode: 'solo', rules: 'turbo' }), /unknown rule set/);
  for (const bad of ['turbo', '', 'constructor', '__proto__', 'toString', 'Classic', 'classic ', 'x'.repeat(RULES_ID_MAX + 1), 7, {}, []]) assert.equal(ruleSet(bad), null, `not a rule set: ${JSON.stringify(bad)}`);
  assert.equal(ruleSet('classic'), RULE_SETS.classic);
  // THE JUDGE: the same log, named or not → the same answer, and it names the set; an unknown set → refused, never judged as classic
  const seed = 'rs-judge', taps = playBot(createRun({ seed, mode: 'solo' }), gaussBot({ sigmaMs: 25, seed: 'rs' }), { maxFloor: 40 });
  const a = judgeRun({ seed, mode: 'solo', taps }), b = judgeRun({ seed, mode: 'solo', taps, rules: 'classic' });
  assert.ok(a.ok && a.rules === 'classic'); assert.deepEqual(b, a, 'no set named = classic');
  for (const bad of ['turbo', 'constructor', '', 5]) assert.deepEqual(judgeRun({ seed, mode: 'solo', taps, rules: bad }), { ok: false, why: 'rules' }, `an unknown rule set is REFUSED: ${JSON.stringify(bad)}`);
  assert.equal(replay({ seed, mode: 'solo', taps, rules: 'classic' }).rules, 'classic');
  // THE PROOF NODE: `rs` = the run's rule set (written once behind GO); none = classic; unknown = refused
  const CODE = 'MOON', M = 'srs1', GO = 1_800_000_000_000, ns = seedOf(CODE, M, GO), nt = playBot(createRun({ seed: ns, mode: 'solo' }), gaussBot({ sigmaMs: 25, seed: 'n' }), { maxFloor: 20 });
  const c = {}; nt.forEach((t, i) => { c[i] = { s: packFrom(nt, i, i + 1), at: GO + Math.round(t * 1000 / TICK_HZ) + 250 }; });
  const plain = judgeSolo({ code: CODE, matchId: M, node: { go: GO, c } }), named = judgeSolo({ code: CODE, matchId: M, node: { go: GO, c, rs: 'classic' } });
  assert.ok(plain.ok && plain.rules === 'classic' && plain.floor >= 20); assert.deepEqual(named, plain);
  assert.deepEqual(judgeSolo({ code: CODE, matchId: M, node: { go: GO, c, rs: 'turbo' } }), { ok: false, why: 'rules' }, 'a node on an unknown rule set: refused');
  const sv = highriseSolo({ code: CODE, matchId: M, uid: 'u1', node: { go: GO, c, rs: 'turbo' } });
  assert.equal(sv.game.results.u1.bad, 'rules', 'the server\'s own row says why'); assert.equal(sv.game.results.u1.f, 0);
  // A MATCH = ONE rule set: THE FIRST GO's; a node that names another is refused (the others are judged as ever)
  const nodes = { u1: { go: GO + 40, c, rs: 'classic' }, u2: { go: GO, c }, u3: { go: GO + 90, c, rs: 'turbo' } };
  assert.equal(matchRules(nodes), 'classic', 'the first GO\'s player named none: classic'); assert.equal(matchRules({}), 'classic');
  // THE CLOSE's REVIEW: a set NOBODY KNOWS is never the match's — the first GO's player naming "zz" voided EVERYONE's tower (a draw at
  // will). The match stays classic; the one refused is the player who named it. Two GOs in one millisecond: the lowest uid's.
  for (const bad of ['x1', 'zz', 'constructor', '', 7]) assert.equal(matchRules({ a: { go: 5, rs: bad }, b: { go: 9, rs: 'classic' } }), 'classic', `an unknown set is never the match's: ${JSON.stringify(bad)}`);
  assert.equal(matchRules({ b: { go: 5, rs: 'zz' }, a: { go: 5 } }), 'classic'); assert.equal(matchRules({ a: { go: 5 }, b: { go: 5, rs: 'zz' } }), 'classic');
  assert.ok(read('js/games/highrise/proof.js').includes('(first === null || u < first)'), 'a tied first GO: the LOWEST uid — never the order the keys came in');
  const grief = { u1: { go: GO, c, rs: 'zz' }, u2: { go: GO + 40, c, rs: 'classic' }, u3: { go: GO + 90, c } };
  const gs = highriseMatch({ code: CODE, matchId: M, uids: ['u1', 'u2', 'u3'], nodes: grief });
  assert.equal(gs.game.results.u1.bad, 'rules', 'the griefer\'s own node is the one refused');
  assert.ok(gs.game.results.u2.bad !== 'rules' && gs.game.results.u3.bad !== 'rules', '… never the honest towers');
  assert.equal(scoreMatchNode({ seed: gs.game.seed, playAt: gs.game.playAt }, grief.u2, matchRules(grief)).bad === 'rules', false, 'the host\'s podium agrees');
  assert.equal(judgeNode({ seed: ns, mode: 'match', node: { ...nodes.u1, go: GO + 2000 }, rules: 'classic' }).ok !== undefined, true);
  const srv = highriseMatch({ code: CODE, matchId: M, uids: ['u1', 'u2', 'u3'], nodes });
  assert.equal(srv.game.results.u3.bad, 'rules', 'another rule set in the same match: no tower'); assert.ok(!srv.game.results.u1.bad && !srv.game.results.u2.bad || srv.game.results.u1.bad !== 'rules');
  const g = { seed: srv.game.seed, playAt: srv.game.playAt };
  assert.equal(scoreMatchNode(g, nodes.u3, 'classic').bad, 'rules', 'the host\'s podium agrees with the server');
});

test('THE LIVE LOCK (the rules gap jw + hr shared): the host deletes ONE match\'s proof tree only once HIS OWN GO in it is 10 min old — the rules say so without reading `game`; the host\'s prune + PLAY AGAIN\'s sweep never ask for a held one', async () => {
  const rules = JSON.parse(read('database.rules.json')).rules.rooms.$code;
  for (const [node, gid] of [['jw', 'jaywalk'], ['hr', 'highrise']]) {
    assert.equal(rules[node]['.write'], undefined, `${node}: the WHOLE node is never the host's to delete (it was — refused only by game/phase, which the host writes)`);
    const w = rules[node].$match['.write'];
    assert.ok(w.endsWith(" && (!data.exists() || (data.child(auth.uid).child('go').isNumber() && data.child(auth.uid).child('go').val() < now - 600000))"), `${node}: THE LOCK — his own GO, 10 min, or a tree that is not there`);
    assert.ok(w.includes(`newData.parent().parent().child('game/id').val() === '${gid}'`) && w.includes('!newData.exists()') && w.includes("/meta/hostId').val() === auth.uid"), `${node}: … on top of what it always asked (the host, a delete, not the live match)`);
    for (const leaf of ['go', 'c', 'e', 'k']) assert.ok(rules[node].$match.$uid[leaf], `${node}/${leaf} untouched`);
  }
  const rs = rules.hr.$match.$uid.rs;
  assert.ok(rs['.write'].includes('auth.uid === $uid') && rs['.write'].includes('newData.exists() && !data.exists()') && rs['.write'].includes("'/go').exists()") && rs['.write'].includes("!newData.parent().child('e').exists() && !newData.parent().child('c').exists()"), 'rs: own uid, once, after GO, before the end AND before the log\'s first chunk (never in one write with either)');
  assert.equal(rs['.validate'], 'newData.isString() && newData.val().length >= 1 && newData.val().length <= 16 && newData.val().matches(/^[a-z0-9-]+$/)'); assert.equal(RULES_ID_MAX, 16);
  // the client: only what the rules allow is ever asked (one refused path would take the whole prune down)
  const { staleProofPaths, proofUnlocked, PROOF_LOCK_MS, PROOF_LOCK_SLACK_MS } = await import('../js/core/room-logic.js');
  const { LOCKED_PROOF_NODES, PROOF_NODE_LIST } = await import('../js/games/registry.js');
  assert.equal(PROOF_LOCK_MS, 600000, 'the rules\' own number'); assert.equal(PROOF_LOCK_SLACK_MS, 30000);
  assert.deepEqual([...LOCKED_PROOF_NODES], ['jw', 'hr']); assert.ok(LOCKED_PROOF_NODES.every(n => PROOF_NODE_LIST.includes(n)));
  const NOW = 1_800_000_000_000, old = NOW - PROOF_LOCK_MS - PROOF_LOCK_SLACK_MS - 1, young = NOW - PROOF_LOCK_MS;   // (young = old enough for the rules, NOT for the phone's clock: the slack)
  assert.equal(proofUnlocked({ h: { go: old } }, 'h', NOW), true); assert.equal(proofUnlocked({ h: { go: young } }, 'h', NOW), false);
  for (const t of [null, {}, { p: { go: old } }, { h: {} }, { h: { go: 0 } }, { h: { go: 'x' } }]) assert.equal(proofUnlocked(t, 'h', NOW), false, `no GO of the host's: never (${JSON.stringify(t)})`);
  const trees = { jw: { a: { h: { go: old }, p: { go: old } }, b: { h: { go: young } }, c: { p: { go: old } }, keep: { h: { go: old } } }, hr: { d: { h: { go: old } }, e: { h: { go: NOW - 5000 } } }, prism: { f: { p: { st: 'out' } }, keep: {} }, oc: null };
  assert.deepEqual(staleProofPaths(trees, ['keep'], { nodes: LOCKED_PROOF_NODES, uid: 'h', now: NOW }), { 'jw/a': null, 'hr/d': null, 'prism/f': null }, 'the held trees wait for a later start; the other games\' proofs as ever');
  assert.deepEqual(staleProofPaths(trees, ['keep']), { 'jw/a': null, 'jw/b': null, 'jw/c': null, 'hr/d': null, 'hr/e': null, 'prism/f': null }, 'no lock named: as before (FR7 FIXES B\'s own test)');
  const host = read('js/host.js'), again = read('js/games/kit/again.js');
  assert.ok(host.includes('const gone = staleProofPaths(trees, keep, { nodes: LOCKED_PROOF_NODES, uid: state.uid, now: serverNow() });'), 'host.js#pruneProofs asks with the lock');
  assert.ok(!host.includes('clearNewNodes(code)') && !host.includes('clearNewNodes(state.code)'), 'the proof nodes are never cleared whole (keepProof on every call)');
  assert.ok(again.includes('const held = m => serverNow() - (endedAt.get(m) || 0) < PROOF_LOCK_MS + PROOF_LOCK_SLACK_MS;') && again.includes('pruneRuns(code, recent, m => pending(matchKey(code, m)) || held(m))'), 'PLAY AGAIN keeps a run inside the lock in its list — as a queued one');
});

test('"+0 XP" SAYS WHY: it is the day\'s XP cap (THE SOLO LANE pays a streak day\'s first 4 solo runs — every solo game\'s; a room match stops at THE DAILY CEILING) — the WOULD COUNT line says DAILY CAP', async () => {
  const { wouldLine } = await import('../js/games/highrise/final.js');
  const { soloXp, SOLO_DAY_XP, SOLO_XP } = await import('../js/core/ranks.js');
  assert.deepEqual([soloXp(SOLO_DAY_XP - 1).total, soloXp(SOLO_DAY_XP).total], [SOLO_XP, 0], 'the 5th solo run of the day pays 0 — by the rules, not a fault');
  assert.equal(wouldLine({ floor: 85, xp: 15, so: { n: 1, max: 4 } }), 'WOULD COUNT · FLOOR 85 · +15 XP');
  assert.equal(wouldLine({ floor: 85, xp: 15, so: { n: 4, max: 4 }, best: true }), 'WOULD COUNT · FLOOR 85 · +15 XP · NEW BEST', 'the 4th still pays');
  assert.equal(wouldLine({ floor: 85, xp: 0, so: { n: 5, max: 4 } }), 'WOULD COUNT · FLOOR 85 · +0 XP · DAILY CAP', 'the day\'s 5th solo run: the line says why');
  assert.equal(wouldLine({ floor: 85, xp: 0, so: { n: 9, max: 4 }, best: true, cards: ['clouds'] }), 'WOULD COUNT · FLOOR 85 · +0 XP · DAILY CAP · NEW BEST · 1 CARD', 'a capped run still counts for the board + the cards');
  assert.equal(wouldLine({ floor: 120, xp: 0, cap: 1 }), 'WOULD COUNT · FLOOR 120 · +0 XP · DAILY CAP', 'a match past THE DAILY CEILING (the server\'s flag)');
  assert.equal(wouldLine({ floor: 3, xp: 0 }), 'WOULD COUNT · FLOOR 3 · +0 XP', 'no cap named: never a guess');
  assert.equal(wouldLine({ floor: 0, skip: 'empty' }), 'WOULD NOT COUNT · EMPTY');
  // the server: `cap` from the SAME pure step's answer (stats.js#wouldApply → report.js#wouldAward) — read as text (a unit test loads no server file)
  const rep = read('api/report.js'), st = read('api/_lib/stats.js');
  assert.ok(rep.includes('const cap = !(w.xp > 0) && (!!w.capped || !!(w.solo && w.solo.n > w.solo.max));') && rep.includes('...(cap ? { cap: 1 } : {})'));
  assert.ok(st.includes('solo: res.solo || null, ...(res.capped ? { capped: true } : {}) };'));
});
