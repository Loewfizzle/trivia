// JAYWALK JT2 — TOUCH-UP (docs/games/passes/jaywalk-jt2.md): THE MATCH FLAKE's root (the steady bot) · THE FRIEND LINE's fade · THE BOARD's
// AVERAGE (the pure step, the stats step, the board's definition) · the room freed (the notes moved, behaviour unchanged).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { createRun, step, isOver } from '../js/games/jaywalk/engine.js';
import { createCourse } from '../js/games/jaywalk/course.js';
import { greedyBot, steadyBot, playBot } from '../js/games/jaywalk/bot.js';
import { friendFade, FADE_FAR, FADE_NEAR } from '../js/games/jaywalk/lines.js';
import { avgStep, avgOf, avgLabel, AVG_DAYS, AVG_MIN } from '../js/core/board-avg.js';
import { boardDef } from '../js/core/boards.js';
import { matchStep } from '../js/core/progress.js';
import { extractMatch } from '../js/core/match-report.js';
import { PRELOAD } from '../js/games/preload-graph.js';

// ---- GROUP 1 — THE MATCH FLAKE (the root: the E2E's lazy bots died by luck — the call / watch section's cascade)
test('THE MATCH FLAKE — the old lazy bot dies inside 45 s on many courses; THE STEADY BOT on none (the same courses)', () => {
  let lazy = 0, steady = 0;
  for (let i = 0; i < 60; i++) {
    const seed = `jt2-${i}`, course = createCourse(seed, { cv: 2 });
    const a = createRun({ seed, mode: 'match' }); playBot(a, course, greedyBot({ seed, lazy: true }), 2700); if (isOver(a)) lazy++;
    const b = createRun({ seed, mode: 'match' }); playBot(b, course, steadyBot({ seed }), 2700); if (isOver(b)) steady++;
  }
  assert.ok(lazy >= 5, `the lazy bot (the E2E's old players) was out inside 45 s on ${lazy} of 60 courses — the luck the call step leaned on`);
  assert.equal(steady, 0, `THE STEADY BOT: out on ${steady} of 60 courses inside 45 s`);
});

test('THE MATCH FLAKE — the bot is asked once a TICK: a phone that stalls (a frame of many ticks) makes the SAME moves', () => {
  const seed = 'jt2-stall', course = createCourse(seed, { cv: 2 });
  const drive = frameTicks => {   // (view.js#tick: the bot asked at every tick the catch-up steps — however many a frame holds)
    const run = createRun({ seed, mode: 'match' }), bot = steadyBot({ seed }), log = [];
    for (let t = 0; t < 1800 && !isOver(run);) { for (let k = 0; k < frameTicks && !isOver(run); k++, t++) { const d = bot(run, course) || ''; if (d) log.push(`${run.t}${d}`); step(run, course, d); } }
    return { log: log.join(' '), y: run.y, over: isOver(run) };
  };
  const smooth = drive(1), stalled = drive(37);
  assert.equal(stalled.log, smooth.log, 'the same hops at the same ticks');
  assert.ok(!smooth.over && smooth.y > 5, `… and it lives (lane ${smooth.y})`);
});

test('THE MATCH FLAKE — the view asks the bot inside tick(), the E2E plays the steady bot + reads the merged tag the phone SHOWED', () => {
  const v = readFileSync('js/games/jaywalk/view.js', 'utf8'), e = readFileSync('tests/integration/e2e-jaywalk-match.mjs', 'utf8');
  assert.match(v, /function tick\(\) \{\n {4}let d = '';\n {4}if \(bot && !queue\.length\) \{ const b = bot\(run, course\); if \(b\) queue\.push\(b\); \}/);
  assert.doesNotMatch(v, /if \(bot && !queue\.length && !isOver\(run\) && c\.t >= 0\)/, 'never once a FRAME again');
  assert.match(e, /bot\(true, \{ steady: true \}\)/);
  assert.match(e, /\(await state\(pages\[1\]\)\)\.merged/);
});

// ---- GROUP 2 — THE FRIEND LINE
test('THE FRIEND LINE fades as the kid comes: full ≥ 4 lanes ahead, gone at ~1, smooth between', () => {
  assert.equal(FADE_FAR, 4); assert.equal(FADE_NEAR, 1);
  assert.equal(friendFade(10), 1); assert.equal(friendFade(4), 1); assert.equal(friendFade(1), 0); assert.equal(friendFade(0), 0); assert.equal(friendFade(-3), 0);
  let prev = 0;
  for (let a = 1; a <= 4.0001; a += 0.05) { const f = friendFade(a); assert.ok(f >= prev - 1e-12 && f <= 1, `rising at ${a}`); prev = f; }
  assert.ok(Math.abs(friendFade(2.5) - 0.5) < 1e-9, 'half way at 2.5 lanes');
});

test('THE FRIEND LINE: thinner + half strength ON the ground (under the traffic), its words under the traffic too — YOUR BEST unchanged', () => {
  const s = readFileSync('js/games/jaywalk/night.js', 'utf8');
  assert.match(s, /const fr = k === 'friend', fd = fr \? friendFade\(Ln\.lane - ky \+ 0\.5\) : 1;/);
  assert.match(s, /K\.flat\.put\(0, 0\.06, z, 9\.06, 1, \(day \? 0\.26 : 0\.22\) \+ fl \* 0\.3, 0, hex, 1, 4, \(0\.5 \* fd \+ fl \* 1\.2\) \* ll\);/, 'the friend tape: on the ground, thin, half strength');
  assert.match(s, /K\.flat\.put\(0, 0\.36, z, 9\.06, 1, \(day \? 0\.62 : 0\.5\) \+ fl \* 0\.25, 0, hex, 1, 4, \(0\.95 \+ fl \* 0\.4\) \* ll\);/, 'YOUR BEST\'s tape as before');
  assert.match(s, /depthTest: k === 'friend'/, 'the friend\'s words: behind a vehicle (depth tested)');
  assert.match(s, /lab\.m\.material\.opacity = Math\.min\(1, ll\) \* fd;/);
});

// ---- GROUP 5 — THE BOARD's AVERAGE
const D = n => `d202611${String(n).padStart(2, '0')}`;
test('THE BOARD\'s AVERAGE — the box keeps the 14 most recent PLAYED days; a break never empties it', () => {
  let box = {};
  for (let d = 1; d <= 20; d++) box = avgStep(box, D(d), 100 + d);
  assert.equal(Object.keys(box).length, AVG_DAYS);
  assert.deepEqual(Object.keys(box).sort()[0], D(7), 'the oldest days dropped');
  const later = avgStep(box, 'd20261230', 300);   // (a month off — then one run: 13 old days + the new one)
  assert.equal(Object.keys(later).length, 14);
  assert.deepEqual(avgStep(later, D(2), 5), later, 'a late run older than all 14 days: unchanged');
  box = avgStep(avgStep({}, D(1), 200), D(1), 100);
  assert.deepEqual(box[D(1)], [2, 300], 'one day: [runs, lanes]');
});

test('THE BOARD\'s AVERAGE — shown from 5 runs (else null = a dash), one decimal; the label', () => {
  let box = {};
  for (const v of [296, 200, 180, 210]) box = avgStep(box, D(3), v);
  assert.equal(avgOf(box).avg, null, '4 runs: a dash');
  box = avgStep(box, D(4), 239);
  assert.deepEqual(avgOf(box), { avg: 225, runs: 5, days: 2 });
  assert.equal(avgOf(avgStep(box, D(4), 0)).avg, 187.5, 'a 0-lane run counts too');
  assert.equal(AVG_MIN, 5);
  assert.equal(avgLabel(225.4), 'AVG 225'); assert.equal(avgLabel(1234.5), 'AVG 1,235'); assert.equal(avgLabel(null), 'AVG —'); assert.equal(avgLabel(undefined), 'AVG —');
  assert.deepEqual(avgOf({ x: [1, 2], d20261101: { 0: 5, 1: 500 } }), { avg: 100, runs: 5, days: 1 }, 'RTDB\'s { 0, 1 } read back; junk keys ignored');
});

test('THE BOARD\'s AVERAGE — only JAYWALK turns it on (a record board MAY carry one); the numbers = board-avg.js\'s', () => {
  assert.deepEqual(boardDef('jaywalk-solo').avg, { days: AVG_DAYS, min: AVG_MIN });
  for (const b of ['highrise-solo', 'prism-rush', 'overclock-quick', 'xp', 'daily']) assert.ok(!boardDef(b).avg, `${b}: no average`);
});

const jwSolo = (l, { sv = 1, bad = null } = {}) => ({ id: 'jaywalk', matchId: 'm1', phase: 'final', mode: 'solo', sv, participants: { u1: true }, settings: {}, results: { u1: { l, t: 600, w: 'car', e: 10, go: 1, ...(bad ? { bad } : {}) } } });
test('THE BOARD\'s AVERAGE — a COUNTED solo run (the server\'s replay, sv) adds its lanes on its streak day; a match / a refused run never', () => {
  const T0 = Date.UTC(2026, 10, 22, 20);   // (Nov 22, 3 pm ET)
  let s = null, at = T0;
  const run = (l, o) => { const ex = extractMatch(jwSolo(l, o)); const r = matchStep(s, { key: `K${at}`, gid: 'jaywalk', row: ex.rows.u1, n: 1, now: at, at }); at += 60_000; if (!r.skip) s = r.next; return r; };
  const r1 = run(296);
  assert.deepEqual(s.av['jaywalk-solo'], { d20261122: [1, 296] });
  assert.deepEqual(r1.av, { 'jaywalk-solo': null }, 'one run: no average yet');
  for (const l of [200, 180, 210]) run(l);
  const r5 = run(239);
  assert.deepEqual(r5.av, { 'jaywalk-solo': 225 });
  const bad = run(400, { bad: 'forged' });
  assert.ok(!bad.av, 'a refused run adds nothing');
  assert.deepEqual(s.av['jaywalk-solo'], { d20261122: [5, 1125] });
  // (a MATCH run raises the best — never the solo average)
  const m = { id: 'jaywalk', matchId: 'm2', phase: 'final', mode: 'match', sv: 1, participants: { u1: true, u2: true }, settings: {}, results: { u1: { l: 50, t: 600, w: 'car', e: 10 }, u2: { l: 10, t: 600, w: 'car', e: 10 } } };
  const ex = extractMatch(m);
  assert.ok(!ex.rows.u1.av, 'a match row carries no average');
});

// ---- GROUP 0 — ROOM
test('ROOM — JAYWALK\'s own preload graph stays under 530 KB (VARIETY A: 480 → 520 for THE TIMES OF DAY + THE DAY LOOK · VARIETY B1: 520 → 530 for THE AREA TRAFFIC table + loader, its models never in it — the game line is 610; 515 before JT2 — the notes moved to docs/games/jaywalk-notes.md)', () => {
  const kb = PRELOAD.jaywalk.reduce((a, f) => a + statSync(f).size, 0) / 1024;
  assert.ok(kb < 530, `${kb.toFixed(1)} KB`);
  assert.match(readFileSync('docs/games/jaywalk-notes.md', 'utf8'), /^# JAYWALK — THE NOTES/);
});

// ---- THE ADD-ONS (the owner, mid-pass) — THE FINAL SCREEN's MEMORY with THE SEASONAL PACK · THE GRAVESTONES read clearly
test('THE FINAL SCREEN\'s MEMORY: the scene\'s rest() reaches the pack — the fall off, the footprints + burst piles let go, the fireworks\' canvas FREED (made again after)', () => {
  const n = readFileSync('js/games/jaywalk/night.js', 'utf8'), sp = readFileSync('js/games/jaywalk/seasonal.js', 'utf8'), fw = readFileSync('js/games/jaywalk/fireworks.js', 'utf8');
  assert.match(n, /rest\(on\) \{[\s\S]{0,400}?if \(SP\) SP\.rest\(on\);/, 'night.js#rest → the pack');
  assert.match(sp, /rest\(on\) \{ resting = !!on; (?:if \(SKS\) SKS\.rest\(on\); )?if \(on\) \{ fall\.show\(0\); prN = 0; burst\.clear\(\); \} if \(FW\) FW\.rest\(on\); \}/);
  assert.match(fw, /rest\(on\) \{ resting = !!on; if \(on\) \{ clear\(\); n = 0; pending\.length = 0; cv\.width = cv\.height = 0; \} else if \(!cv\.width && W\) \{ cv\.width = W; cv\.height = H; \} \}/);
  assert.match(fw, /if \(!resting\) \{ cv\.width = W; cv\.height = H; \}/, 'a resize behind a final screen never makes the freed canvas again (the Dec 31 MOTHERSHIP final held 900 × 304 before)');
  assert.match(n, /SP = M\.createSeasonal\(SPAPI\); if \(resting\) SP\.rest\(true\);/, 'a pack that lands behind a final screen rests at once');
  assert.match(sp, /if \(SZ\.fireworks\) FW\.on\(SZ\.fireworks\); if \(resting\) FW\.rest\(true\);/, '… and its fireworks');
  assert.match(sp, /const falling = !resting && SZ\.snowfall !== 'none', leaves = !resting && /, 'the fall never re-shown in the frames the scene draws into its still');
  const k = readFileSync('tests/integration/kit/jaywalk-mem.mjs', 'utf8');
  assert.match(k, /const seasonRest = !sp \|\| \(sp\.resting === true && !sp\.fall && !sp\.prints && !sp\.bursts && !sp\.skySnow && \(!fw \|\| \(fw\.px === 0 && fw\.sparks === 0\)\)\);/, 'the E2Es\' guard: nothing seasonal alive behind a final screen');
  for (const f of ['tests/integration/e2e-jaywalk.mjs', 'tests/integration/e2e-jaywalk-match.mjs']) assert.match(readFileSync(f, 'utf8'), /seasonRest/, `${f} checks it`);
  assert.match(readFileSync('tests/integration/kit/jaywalk-mem.mjs', 'utf8'), /export const JW_FINAL_BUDGET_MB = 20;/, 'the budget never raised');
});
