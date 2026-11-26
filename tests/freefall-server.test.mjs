// FREEFALL F1 — THE JUDGE, THE SERVER HALF (api/_lib/freefall.js — PURE, NOT an endpoint, NOT wired): it imports the SAME js/games/freefall
// modules the phone runs. It accepts honest bot logs, refuses every forged one BY NAME, never throws, and its result == the live engine's.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { judgeRun, judgePacked, serverRow } from '../api/_lib/freefall.js';
import { createRun, stepTo, turn, hold, isOver, resultOf, logOf } from '../js/games/freefall/engine.js';
import { packLog, packRun, unpackLog, logProblem, seedProblem, maxEntries, replay, rulesOf } from '../js/games/freefall/replay.js';
import { angDiff } from '../js/games/freefall/tower-gen.js';
import { BOT_IDS, makeBot, playBot } from '../js/games/freefall/bot.js';
import { MODES, MODE_IDS, MAX_SPIN, TURN, DARK, MAX_LOG, SEED_MAX, RULE_SETS } from '../js/games/freefall/tuning.js';
import { hashString } from '../js/core/rng.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
/** a bot's whole run → { log, live: the LIVE engine's result } (an endless solo run is stopped at `maxFloor`, then left alone: the darkness ends it — as the judge will see it) */
function botRun(seed, mode, id, maxFloor = 260) {
  const run = createRun({ seed, mode });
  playBot(run, makeBot(id, seed), { maxFloor });
  stepTo(run, MODES[mode].capTicks);
  return { log: logOf(run), live: resultOf(run), run };
}
const STALL = DARK.grace + DARK.lead * DARK.pace;

test('THE SERVER HALF is PURE and NOT WIRED: no fb.js, the SAME engine modules as the phone; /api still has 8 functions and none of them knows FREEFALL', () => {
  const src = read('api/_lib/freefall.js');
  const imports = [...src.matchAll(/^import [^\n]* from '([^']+)';$/gm)].map(m => m[1]);
  assert.deepEqual(imports, ['../../js/games/freefall/replay.js', '../../js/games/freefall/logic.js', '../../js/games/freefall/tuning.js'], 'it imports the phone\'s own modules — nothing else');
  assert.doesNotMatch(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1'), /fb\.js|firebase|export default|\breq\b|\bres\./);
  const fns = readdirSync(new URL('../api/', import.meta.url)).filter(f => f.endsWith('.js'));
  assert.equal(fns.length, 8, `the function count stays 8 (${fns.join(' ')})`);
  for (const f of fns) assert.doesNotMatch(read(`api/${f}`), /freefall/i, `api/${f}: no endpoint wiring`);
  for (const f of readdirSync(new URL('../api/_lib/', import.meta.url)).filter(n => n.endsWith('.js') && n !== 'freefall.js')) assert.doesNotMatch(read(`api/_lib/${f}`), /freefall/i, `api/_lib/${f} does not reach it`);
});

test('THE JUDGE accepts honest bot logs — all four bots, every mode — and returns the run\'s own numbers; the packed log judges the same', () => {
  const causes = {};
  for (const mode of MODE_IDS) for (const id of BOT_IDS) for (let i = 0; i < 5; i++) {
    const seed = `ok-${mode}-${id}-${i}`, { log, live } = botRun(seed, mode, id);
    const v = judgeRun({ seed, mode, log });
    assert.equal(v.ok, true, `${seed}: ${v.why}`);
    assert.deepEqual([v.floor, v.tick, v.end, v.cause, v.made, v.bounces, v.shatters, v.blazes, v.bestRun, v.moves], [live.floor, live.tick, live.end, live.cause, live.made, live.bounces, live.shatters, live.blazes, live.bestRun, log.length]);
    assert.deepEqual(v.feats, { reachedHarbor: live.floor >= 120, terminal: live.bestRun >= 15, reachedBottom: live.floor >= 200 });
    assert.equal(v.rules, 'classic');
    assert.deepEqual(judgePacked({ seed, mode, log: packLog(log) }), v, 'the packed log judges the same');
    assert.deepEqual(judgeRun({ seed, mode, log, rules: 'classic' }), v, 'the rule set named = the default');
    causes[v.cause] = (causes[v.cause] || 0) + 1;
    assert.ok(['red', 'dark', 'made', 'cap'].includes(v.cause));
  }
  assert.ok(causes.red >= 20 && causes.made >= 2, `outs and finishes both judged: ${JSON.stringify(causes)}`);
  // an empty log is an honest run too: nobody touched the screen — THE LIGHTS WENT OUT
  for (const mode of MODE_IDS) {
    const idle = judgeRun({ seed: 'idle', mode, log: [] });
    assert.deepEqual([idle.ok, idle.floor, idle.cause, idle.tick, idle.end, idle.moves], [true, 0, 'dark', 0, STALL, 0]);
    assert.deepEqual(serverRow(idle), { f: 0, t: 0, w: 'dark', e: STALL });
    assert.deepEqual(judgePacked({ seed: 'idle', mode, log: '' }), idle);
  }
  const top = botRun('ok-match-great-0', 'match', 'great');
  const best = [0, 1, 2, 3, 4, 5, 6, 7].map(i => botRun(`top${i}`, 'match', 'great')).find(r => r.live.made);
  assert.ok(best, 'a great bot makes the bottom within a few seeds');
  const vb = judgeRun({ seed: best.run.seed, mode: 'match', log: best.log });
  assert.deepEqual([vb.ok, vb.floor, vb.cause, vb.made], [true, 200, 'made', true]);
  assert.deepEqual(serverRow(vb), { f: 200, t: vb.tick, w: 'made', e: vb.end, ft: vb.feats.terminal ? 'reachedHarbor terminal reachedBottom' : 'reachedHarbor reachedBottom' });
  assert.deepEqual(serverRow({ ok: false, why: 'ticks not rising' }), { f: 0, t: 0, w: '', e: -1, bad: 'ticks not rising' });
  assert.deepEqual(serverRow(null), { f: 0, t: 0, w: '', e: -1, bad: 'refused' });
  void top;
});

test('THE JUDGE == THE LIVE ENGINE for 500 bot runs across all three modes (floors, tick, end, cause, every count, the feats — to the tick)', () => {
  let n = 0, entries = 0;
  const causes = {};
  for (let i = 0; i < 500; i++) {
    const mode = MODE_IDS[i % 3], id = BOT_IDS[i % 4], seed = `eq${i}`;
    const { log, live } = botRun(seed, mode, id);
    const v = judgeRun({ seed, mode, log });
    assert.equal(v.ok, true, `${seed}: ${v.why}`);
    const { ok, ...mine } = v; void ok;
    const { over, ...theirs } = live;
    assert.equal(over, true);
    assert.deepEqual(mine, theirs, seed);
    causes[`${mode}:${v.cause}`] = (causes[`${mode}:${v.cause}`] || 0) + 1; n++; entries += log.length;
  }
  assert.equal(n, 500);
  assert.ok(causes['match:made'] > 10 && causes['daily:made'] > 10 && causes['solo:red'] > 100, `every mode, both ends: ${JSON.stringify(causes)}`);
  assert.ok(!causes['solo:made'], 'a solo run never ends on floor 200');
  assert.ok(entries > 500000, `${entries} log entries replayed`);
});

test('EVERY REFUSAL, BY NAME: rules · mode · seed · log · too many entries · entry · ticks not rising · past the cap · no change · spin · past the end — and nothing throws', () => {
  const { log, run } = botRun('forge', 'match', 'good'), seed = 'forge', mode = 'match';
  assert.equal(judgeRun({ seed, mode, log }).ok, true);
  assert.ok(log.length > 200 && run.cause === 'red');
  const why = input => { const v = judgeRun(input); assert.equal(v.ok, false, JSON.stringify(v).slice(0, 120)); assert.deepEqual(Object.keys(v), ['ok', 'why']); return v.why; };
  const with_ = (i, e) => log.map((x, k) => (k === i ? e : x));
  // rules
  for (const rules of ['zz', 'constructor', '__proto__', 'CLASSIC', 5, {}, [], '', RULE_SETS.classic]) assert.equal(why({ seed, mode, log, rules }), 'rules');
  assert.equal(rulesOf(undefined), RULE_SETS.classic); assert.equal(rulesOf(null), RULE_SETS.classic); assert.equal(rulesOf('nope'), null);
  // mode — REQUIRED
  for (const m of [undefined, null, '', 'Solo', 'constructor', '__proto__', 'toString', 5, ['solo'], {}]) assert.equal(why({ seed, mode: m, log }), 'mode');
  assert.equal(why({ seed, log }), 'mode', 'a missing mode is never quietly judged as solo');
  // seed
  for (const s of [undefined, null, '', 5, 'a b', 'tab\tseed', 'é', 'x'.repeat(SEED_MAX + 1), '\u0000', 'a​b', ['a'], {}]) assert.equal(why({ seed: s, mode, log }), 'seed');
  assert.equal(seedProblem('x'.repeat(SEED_MAX)), null); assert.equal(seedProblem('~!09az'), null);
  // log
  for (const l of [undefined, null, 'abc', 5, {}, { length: 2 }, new Set()]) assert.equal(why({ seed, mode, log: l }), 'log');
  // too many entries — named by its length alone, before an entry is read
  const cap = MODES.match.capTicks;
  assert.equal(maxEntries('match'), cap); assert.equal(maxEntries('solo'), MAX_LOG + MODES.solo.holds); assert.equal(maxEntries('nope'), MAX_LOG);   // (F2: a solo log = its moves + its holds)
  assert.equal(why({ seed, mode, log: new Array(cap + 1).fill(null) }), 'too many entries');
  assert.equal(why({ seed, mode, log: new Array(cap).fill(null) }), 'entry');
  // entry
  for (const e of [null, undefined, 5, 'x', [], [3, 4], {}, { t: 5 }, { a: 5 }, { t: '5', a: 5 }, { t: 5, a: '5' }, { t: 5.5, a: 5 }, { t: 5, a: 5.5 }, { t: -1, a: 5 }, { t: 5, a: -1 }, { t: 5, a: TURN }, { t: NaN, a: 5 }, { t: 5, a: Infinity }, { t: 2 ** 53, a: 5 }, { t: true, a: 5 }]) {
    assert.equal(why({ seed, mode, log: [e] }), 'entry', JSON.stringify(e));
  }
  // ticks not rising
  assert.equal(why({ seed, mode, log: with_(5, { t: log[4].t, a: log[5].a }) }), 'ticks not rising');
  assert.equal(why({ seed, mode, log: with_(5, { t: log[4].t - 1, a: log[5].a }) }), 'ticks not rising');
  assert.equal(why({ seed, mode, log: [log[1], log[0]] }), 'ticks not rising');
  // past the cap
  assert.equal(why({ seed, mode, log: [{ t: cap, a: 5 }] }), 'past the cap');
  assert.equal(why({ seed, mode, log: [{ t: cap + 9999, a: 5 }] }), 'past the cap');
  assert.equal(why({ seed: 'idle', mode: 'solo', log: [{ t: cap, a: 5 }] }), 'past the end', 'a solo run has its own (30:00) cap: tick 10800 is not past it — this idle run was simply over by then');
  assert.equal(why({ seed: 'idle', mode: 'solo', log: [{ t: MODES.solo.capTicks, a: 5 }] }), 'past the cap');
  // no change — the log holds the CHANGES only
  assert.equal(why({ seed, mode, log: [{ t: 3, a: 0 }] }), 'no change');
  assert.equal(why({ seed, mode, log: with_(5, { t: log[5].t, a: log[4].a }) }), 'no change');
  // spin
  assert.equal(why({ seed, mode, log: [{ t: 3, a: MAX_SPIN + 1 }] }), 'spin');
  assert.equal(why({ seed, mode, log: [{ t: 3, a: 2048 }] }), 'spin');
  assert.equal(why({ seed, mode, log: with_(9, { t: log[9].t, a: (log[8].a + MAX_SPIN + 1) % TURN }) }), 'spin');
  // past the end — a move after the run was over (the replay itself finds it)
  assert.equal(why({ seed, mode, log: [...log, { t: run.end + 1, a: (log[log.length - 1].a + 1) % TURN }] }), 'past the end');
  assert.equal(why({ seed: 'idle', mode, log: [{ t: STALL + 1, a: 5 }] }), 'past the end', 'a move after the lights went out');
  assert.equal(judgeRun({ seed: 'idle', mode, log: [{ t: STALL, a: 5 }] }).ok, true, 'a move AT the tick the run ends on is still inside it');
  // the bounds alone (no replay)
  assert.equal(logProblem(log, mode), null); assert.equal(logProblem(log, 'nope'), 'mode'); assert.equal(logProblem('x', mode), 'log');
  // NOTHING THROWS: whatever comes in
  for (const x of [undefined, null, 0, 1, '', 'x', [], [1], true, () => 1, Symbol.iterator, { seed: {}, mode: {}, log: {} }, { seed: 's', mode: 'solo', log: [[]] }, { seed: 's', mode: 'solo', log: [{ t: {}, a: [] }] }, { seed: 's', mode: 'match', log: { 0: 1 } }, { seed: 's', mode: 'solo', log: [Object.create(null)] }, Object.create(null)]) {
    const v = judgeRun(x), p = judgePacked(x);
    assert.equal(v.ok, false); assert.equal(typeof v.why, 'string'); assert.equal(p.ok, false); assert.equal(typeof p.why, 'string');
  }
});

test('THE PACKED JUDGE: the rule set + the mode + the seed are named before the log is read · a string that is not a canonical log = "log" · longer than the MODE\'s log can pack to = "log", unread', () => {
  const { log } = botRun('pk', 'match', 'human'), s = packLog(log);
  assert.equal(judgePacked({ seed: 'pk', mode: 'match', log: s }).ok, true);
  assert.deepEqual(judgePacked({ seed: 'pk', mode: 'nope', log: s }), { ok: false, why: 'mode' });
  assert.deepEqual(judgePacked({ seed: 'p k', mode: 'match', log: s }), { ok: false, why: 'seed' });
  assert.deepEqual(judgePacked({ seed: 'pk', mode: 'match', log: s, rules: 'zz' }), { ok: false, why: 'rules' });
  for (const bad of [undefined, null, 5, log, `${s}.`, `${s}+0`, `.1${s}`, s.toUpperCase() === s ? 'X' : s.toUpperCase(), ` ${s}`, `${s}\n`]) assert.deepEqual(judgePacked({ seed: 'pk', mode: 'match', log: bad }), { ok: false, why: 'log' });
  assert.deepEqual(judgePacked({ seed: 'pk', mode: 'match', log: '+4s' }), { ok: false, why: 'spin' }, 'a canonical string of a forged log: the judge names what is wrong with the log');
  assert.deepEqual(judgePacked({ seed: 'pk', mode: 'match', log: '+1.2-1' }).ok, true);
  // a run scored as it stands (`until`) through the packed door too; a bad one named before the log is read
  const asOf = judgePacked({ seed: 'pk', mode: 'match', log: s, until: 300 });
  assert.deepEqual([asOf.ok, asOf.over, asOf.tick <= 300], [true, false, true]);
  assert.deepEqual(judgePacked({ seed: 'pk', mode: 'match', log: s, until: -3 }), { ok: false, why: 'until' });
  assert.deepEqual(judgeRun({ seed: 'pk', mode: 'match', log, until: 2.5 }), { ok: false, why: 'until' });
  // the mode's own bound: 9 characters an entry × the entries its cap allows
  const over = '+1-1'.repeat(9 * MODES.match.capTicks / 4 + 1);
  assert.ok(over.length > 9 * MODES.match.capTicks && over.length < 9 * MAX_LOG);
  const t0 = process.hrtime.bigint();
  assert.deepEqual(judgePacked({ seed: 'pk', mode: 'match', log: over }), { ok: false, why: 'log' });
  assert.ok(Number(process.hrtime.bigint() - t0) < 5e6, 'refused before it is read');
  assert.notEqual(unpackLog(over), null, '… the same string is a (long) solo log');
  assert.deepEqual(judgePacked({ seed: 'pk', mode: 'solo', log: over }), { ok: false, why: 'past the end' }, '… read, replayed, refused for what it is: a hand still wiggling long after the lights went out');
});

test('A FORGED LOG NEVER BUYS A FLOOR: 3,000 honest logs with one thing changed — the judge refuses it, or plays it out to exactly what the LIVE engine makes of the same input', () => {
  let refused = 0, played = 0, better = 0;
  const whys = {}, bases = new Map();
  for (let n = 0; n < 3000; n++) {
    let x = hashString(`mut${n}`);
    const rnd = m => { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x % m; };
    const seed = `mu${n % 60}`, mode = MODE_IDS[n % 3];
    if (!bases.has(n % 60)) bases.set(n % 60, botRun(seed, mode, BOT_IDS[n % 4], 140));   // (60 honest runs, each changed 50 ways)
    const base = bases.get(n % 60);
    if (base.log.length < 4) continue;
    const log = base.log.map(e => ({ ...e })), i = rnd(log.length), k = rnd(7);
    if (k === 0) log[i].a = (log[i].a + 1 + rnd(40)) % TURN;                       // a different angle
    else if (k === 1) log[i].t += 1 + rnd(3);                                      // a later tick
    else if (k === 2) log.splice(i, 1);                                            // a move taken out
    else if (k === 3) log.splice(i + 1);                                           // the log cut short
    else if (k === 4) log.splice(i, 0, { t: log[i].t - 1, a: (log[i].a + rnd(300)) % TURN });   // a move put in
    else if (k === 5) log[i].a = (log[i].a + 400 + rnd(3000)) % TURN;              // a jump no hand can make
    else log.push({ t: log[log.length - 1].t + 1 + rnd(900), a: (log[log.length - 1].a + 1 + rnd(MAX_SPIN)) % TURN });   // a move added at the end
    const v = judgeRun({ seed, mode, log });
    if (!v.ok) { refused++; whys[v.why] = (whys[v.why] || 0) + 1; continue; }
    played++;
    // the LIVE engine, fed the same entries as moves at their ticks
    const live = createRun({ seed, mode });
    for (const e of log) { if (isOver(live)) break; turn(live, e.t, angDiff(e.a, live.a)); }
    stepTo(live, MODES[mode].capTicks);
    const { over, ...theirs } = resultOf(live), { ok, ...mine } = v; void over; void ok;
    assert.deepEqual(mine, theirs, `mut${n}: the judge's verdict is the engine's own run of that input`);
    assert.deepEqual(logOf(live), log, 'the live engine logs exactly the entries it was fed');
    if (v.floor > base.live.floor) better++;
  }
  assert.ok(refused > 600 && played > 600, `${refused} refused (${JSON.stringify(whys)}), ${played} played out`);
  assert.ok(whys.spin > 100 && whys['ticks not rising'] > 20 && whys['no change'] >= 1 && whys['past the end'] > 20);
  assert.ok(better < played / 2, `a changed log is a different RUN (it may even go deeper — ${better} did): it is judged as what it is, never as what it claims`);
});

test('A RUN SCORED AS IT STANDS (`until` — a match scored live): the floors + the tick as of that tick; a bad `until` counts nothing', () => {
  const { log, live } = botRun('until', 'match', 'great');
  const whole = replay({ seed: 'until', mode: 'match', log });
  assert.deepEqual([whole.floor, whole.over, whole.used, whole.bad], [live.floor, true, log.length, -1]);
  let last = -1;
  for (const u of [0, 60, 600, 1800, 3600, live.end - 1, live.end, live.end + 500]) {
    const r = replay({ seed: 'until', mode: 'match', log, until: u });
    assert.ok(r.floor >= last && r.floor <= live.floor, `as of tick ${u}: floor ${r.floor}`); last = r.floor;
    assert.equal(r.over, u >= live.end);
    assert.ok(r.tick <= u);
    // the same as a live run stepped to that tick
    const run = createRun({ seed: 'until', mode: 'match' });
    for (const e of log) { if (e.t > u) break; turn(run, e.t, angDiff(e.a, run.a)); }
    stepTo(run, u);
    assert.deepEqual([r.floor, r.tick, r.end, r.cause], [run.floor, run.at, run.end, resultOf(run).cause]);
  }
  for (const bad of [NaN, -5, 12.5, '600', {}, Infinity]) assert.deepEqual([replay({ seed: 'until', mode: 'match', log, until: bad }).floor, replay({ seed: 'until', mode: 'match', log, until: bad }).over], [0, false]);
});

test('F2 — THE HOLD through the server half: a held solo run (its holds in the log) is judged to the tick — list + packed; the answer carries `holds`; a 4th hold, a hold in a match, a hold out of order = refused by name; the shatter rule + the moving red are the judge\'s too', () => {
  let saves = 0, moved = 0;
  for (let k = 0; k < 40; k++) {
    const seed = `sh-${k}`, run = createRun({ seed, mode: 'solo' }), bot = makeBot(k % 2 ? 'great' : 'human', seed);
    for (const stop of [400 + k * 7, 2000 + k * 11, 5000 + k * 13]) {
      while (!isOver(run) && run.t < stop) playBot(run, bot, { maxFloor: run.floor + 1 });
      if (!isOver(run)) assert.equal(hold(run, Math.max(run.t + 1, run.mt)), true);
    }
    playBot(run, bot, { maxFloor: 260 });
    stepTo(run, MODES.solo.capTicks);
    saves += run.saves; if (run.floor > 215) moved++;
    const live = resultOf(run), log = logOf(run), v = judgeRun({ seed, mode: 'solo', log });
    assert.equal(v.ok, true, `${seed}: ${v.why}`);
    assert.deepEqual([v.floor, v.tick, v.end, v.cause, v.bounces, v.shatters, v.blazes, v.bestRun, v.moves, v.holds || 0], [live.floor, live.tick, live.end, live.cause, live.bounces, live.shatters, live.blazes, live.bestRun, live.moves, run.holds]);
    const p = judgePacked({ seed, mode: 'solo', log: packRun(run) });
    assert.deepEqual(p, v, 'the packed log judges the same');
    assert.equal(packLog(log), packRun(run));
    // the same log as a MATCH's: its holds are refused (a match never holds)
    if (run.holds) assert.deepEqual(judgeRun({ seed, mode: 'match', log }), { ok: false, why: 'too many holds' });
    // one more hold than the mode has
    if (run.holds === 3) assert.deepEqual(judgeRun({ seed, mode: 'solo', log: [...log, { k: 'hold', t: live.end + 5 }] }), { ok: false, why: 'too many holds' });
  }
  assert.ok(moved >= 3, `${moved} of the runs went deep into THE TRENCH (the judge replays its moving red)`);
  assert.ok(saves >= 0);
  assert.deepEqual(judgePacked({ seed: 'x', mode: 'solo', log: '!5!4!1!1' }), { ok: false, why: 'too many holds' });
  assert.deepEqual(judgePacked({ seed: 'x', mode: 'solo', log: '+5!0!0' }), { ok: false, why: 'log' }, 'not a canonical log');
  assert.equal(judgePacked({ seed: 'x', mode: 'solo', log: '.5+5!0+1' }).holds, 1);
  assert.deepEqual(serverRow(judgeRun({ seed: 'x', mode: 'solo', log: [{ k: 'hold', t: 50 }] })), { f: 0, t: 0, w: 'dark', e: 1140 + (50 - 18) }, 'a held empty run: the lights still go out — the hold gave back exactly the 32 ticks of the bounce it started over (the first landing was at tick 18)');
});
