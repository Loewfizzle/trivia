// OVERCLOCK pass 5 (OC5) — DUMB LUCK's rules (written BEFORE any pixel): the fixed field, HONEST ODDS + equal-EV payouts (a 200,000-race
// simulation), the picks, THE DRAW (unpredictable until the lock — a new host never re-draws), THE RACE SCRIPT (10,000 scripts), the
// placement (once, never last, never solo), the scoring + the hand-off, whole simulated matches at 2 + 8 players through the server's report.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LUCK, HORSES, ODDS, PAY_UNIT, payout, chanceOf, DL_EV, DL_MAX, LONG_SHOT, DL_PICK_MS, DL_RACE_MS, DL_FINISH_MS, DL_MS,
  dlField, pickOf, pickBoard, lockPicks, dlDraw, dlLock, dlResults, dlOf, dlVerify, dlTickets, dlStage,
  raceScript, posAt, leaderAt, leadChanges, RACE_SAMPLES, SAMPLE_MS, PHOTO_GAP,
} from '../js/games/overclock/luck.js';
import { TYPES, SKILL_TYPES, CATEGORY, INFO, partsFor, generate } from '../js/games/overclock/challenges.js';
import { buildOrder, MODES, CHALLENGE_MS, STANDINGS_MS, standingsMs, roundWin, roundWinOf, awardChips, longShots, COMBO_NEUTRAL, FASTEST_SKIP, challengeMax } from '../js/games/overclock/logic.js';
import { createGame, nextStep } from '../js/games/overclock/director.js';
import { keysAt, typeKey, playedTypes } from '../js/games/overclock/deal.js';
import { extractMatch } from '../js/core/match-report.js';
import { rngFrom } from '../js/core/rng.js';
import { daily, create as dCreate, resumeKey, result as dResult, replay as dReplay, daySetProblems, dailyMatchId, rankOf, DAILY_N } from '../js/games/overclock/daily.js';
import { checkCartridge, DAILY } from '../js/games/cartridge.js';
import { readFileSync } from 'node:fs';

function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}
const uidsOf = n => 'abcdefgh'.slice(0, n).split('');
const P = n => Object.fromEntries(uidsOf(n).map(u => [u, true]));
/** a seed whose QUICK order (2+ players) has DUMB LUCK at challenge `at` and no TRIVIA LIGHTNING (this run has no question bank) */
function seedWithLuck(at, total = 6, tag = 'dl') {
  for (let k = 0; k < 20_000; k++) {
    const o = buildOrder(`${tag}${k}`, total);
    if (o[at] === LUCK && !o.includes('trivia')) return `${tag}${k}`;
  }
  throw new Error('no seed');
}

// ------------------------------------------------------------------------------------------------ THE FIELD + HONEST ODDS
test('THE FIELD: six horses every race — PINK GREEN CYAN YELLOW PURPLE ICE WHITE (no orange), the six odds shuffled per race, seeded', () => {
  assert.deepEqual(HORSES.map(h => h.name), ['PINK', 'GREEN', 'CYAN', 'YELLOW', 'PURPLE', 'ICE WHITE']);
  for (const h of HORSES) {
    const [r, g, b] = [1, 3, 5].map(i => parseInt(h.c.slice(i, i + 2), 16));
    assert.ok(!(r > 200 && g > 70 && g < 170 && b < 90), `${h.name} is not orange (${h.c})`);
  }
  assert.deepEqual([...ODDS], [2, 3, 4, 5, 8, 12]);
  const seen = new Set();
  for (let s = 0; s < 500; s++) {
    const f = dlField(`m${s}`, 3);
    assert.deepEqual([...f].sort((a, b) => a - b), [...ODDS], 'a permutation of the six odds');
    assert.deepEqual(dlField(`m${s}`, 3), f, 'seeded');
    seen.add(f.join());
  }
  assert.ok(seen.size > 300, `the odds move across the colours (${seen.size} different fields)`);
  // the spec every phone builds from the seed (no draw in it — the draw comes after the lock)
  const spec = generate(LUCK, { seed: 'x', ci: 2, level: 0.4 });
  assert.equal(spec.type, LUCK);
  assert.equal(spec.parts, 1);
  assert.equal(spec.field.length, 6);
  assert.ok(spec.field.every((h, i) => h.lane === i && h.pay === payout(h.n) && h.c === HORSES[i].c));
  assert.ok(!('w' in spec) && !('winner' in spec));
});

test('HONEST ODDS: the implied chances normalised to 1 (their ratios kept); payouts make EVERY pick the same expected value; the plan\'s units', () => {
  const ch = ODDS.map(chanceOf);
  assert.ok(Math.abs(ch.reduce((a, b) => a + b, 0) - 1) < 1e-12, 'they sum to 1');
  for (let i = 1; i < ODDS.length; i++) assert.ok(Math.abs(ch[i] / ch[0] - (ODDS[0] + 1) / (ODDS[i] + 1)) < 1e-12, 'ratios kept');
  // the payouts: whole points, 20 × (n + 1)
  assert.deepEqual(ODDS.map(payout), [60, 80, 100, 120, 180, 260]);
  for (const n of ODDS) assert.ok(Number.isInteger(payout(n)));
  // EV exactly equal (within float rounding) for all six
  const ev = ODDS.map(n => chanceOf(n) * payout(n));
  for (const e of ev) assert.ok(Math.abs(e - DL_EV) < 1e-9, `EV ${e} = ${DL_EV}`);
  // in units of one normal challenge (100): ≈ the plan's 0.5 · 0.8 · 1 · 1.2 · 1.8 · 2.5 (honest EV makes the ends 0.6 + 2.6)
  const plan = [0.5, 0.8, 1, 1.2, 1.8, 2.5];
  ODDS.forEach((n, i) => assert.ok(Math.abs(payout(n) / 100 - plan[i]) <= 0.1 + 1e-9, `${n}-1 pays ${payout(n) / 100}× vs the plan's ${plan[i]}×`));
  assert.equal(DL_MAX, 260);
  assert.equal(PAY_UNIT, 20);
  assert.equal(LONG_SHOT, 8);
});

test('THE 200,000-RACE SIMULATION: each horse wins at its chance (tight), every pick\'s average payout is the same — never exploitable', () => {
  const N = 200_000;
  const wins = Object.fromEntries(ODDS.map(n => [n, 0]));
  const paid = Object.fromEntries(ODDS.map(n => [n, 0]));
  const r = rngFrom('the-sim');
  for (let k = 0; k < N; k++) {
    const seed = `s${k % 997}`, ci = k % 23;
    const field = dlField(seed, ci);
    const pk = {};
    for (const u of uidsOf(1 + (k % 8))) pk[u] = Math.floor(r() * 6);
    const lk = 1_700_000_000_000 + Math.floor(r() * 1e9);
    const w = dlDraw(seed, ci, field, pk, lk);
    wins[field[w]]++;
    // a ticket on EVERY horse: what each odds would have paid in this race
    for (let h = 0; h < 6; h++) if (h === w) paid[field[h]] += payout(field[h]);
  }
  for (const n of ODDS) {
    const rate = wins[n] / N, p = chanceOf(n), sd = Math.sqrt((p * (1 - p)) / N);
    assert.ok(Math.abs(rate - p) < 5 * sd, `${n}-1 wins ${(rate * 100).toFixed(2)} % vs ${(p * 100).toFixed(2)} % (5σ = ${(5 * sd * 100).toFixed(2)})`);
    const avg = paid[n] / N, psd = (payout(n) * Math.sqrt(p * (1 - p))) / Math.sqrt(N);
    assert.ok(Math.abs(avg - DL_EV) < 5 * psd, `${n}-1 pays ${avg.toFixed(2)} a race on average vs ${DL_EV.toFixed(2)}`);
  }
  // (the favourite vs the long shot: the same average, very different spread — a risk choice)
  const spread = ODDS.map(n => payout(n) * Math.sqrt(chanceOf(n) * (1 - chanceOf(n))));
  assert.ok(spread[5] > 2 * spread[0]);
});

// ------------------------------------------------------------------------------------------------ THE PICKS
test('PICKS: any number on one horse, one pick each (changeable until the lock), no pick = no ticket (0); a pick rides the board\'s existing fields', () => {
  // the board a phone writes fits the room's EXISTING oc rules: ok ≤ p ≤ n, p ≤ 12, n 1–12 (no rules change for Dumb Luck)
  for (let h = 0; h < 6; h++) {
    const b = pickBoard(h);
    assert.ok(b.ok <= b.p && b.p <= b.n && b.p <= 12 && b.n >= 1 && b.n <= 12 && b.done === false);
    assert.equal(pickOf(b), h);
  }
  assert.equal(pickOf(null), -1);
  assert.equal(pickOf({ p: 3, ok: 3, n: 3, done: true }), -1, 'another challenge\'s board is no pick');
  assert.equal(pickOf({ p: 7, n: 6 }), -1);
  // changeable: the board holds the LATEST pick (the phone overwrites it until the lock)
  let board = pickBoard(1); board = pickBoard(4);
  const parts = P(5);
  const pk = lockPicks(parts, { a: board, b: pickBoard(4), c: pickBoard(4), d: pickBoard(0) });
  assert.deepEqual(pk, { a: 4, b: 4, c: 4, d: 0 }, 'three on one horse; e never picked');
  assert.ok(!('e' in pk));
  // a non-participant's board never counts
  assert.deepEqual(lockPicks(P(2), { a: pickBoard(2), zz: pickBoard(2) }), { a: 2 });
  // the results: winners get the payout, everyone else 0 (e had no ticket)
  const game = { seed: 'pk', participants: parts };
  const field = dlField('pk', 0);
  const res = dlResults(game, 0, { pk, lk: 1, w: 4 });
  assert.equal(res.a.pts, payout(field[4])); assert.equal(res.b.pts, payout(field[4])); assert.equal(res.c.pts, payout(field[4]));
  assert.equal(res.d.pts, 0); assert.equal(res.e.pts, 0);
  assert.deepEqual(Object.keys(res.a).sort(), ['ok', 'parts', 'pts'], 'the record keeps its shape');
});

// ------------------------------------------------------------------------------------------------ THE DRAW
test('THE DRAW is unpredictable until the picks lock: everything a phone sees before the lock leaves the winner at the posted odds', () => {
  // before the lock a phone knows the seed, the field, every pick and the deadline — NOT the host's exact ms at its tick
  // (the first ≥ 250-ms tick after the deadline + the network). Over that window every horse still comes up at ITS odds.
  const counts = new Array(6).fill(0);
  let flips = 0, pairs = 0, setups = 0;
  for (let s = 0; s < 400; s++) {
    const seed = `pre${s}`, ci = s % 9;
    const field = dlField(seed, ci);
    const pk = Object.fromEntries(uidsOf(1 + (s % 8)).map((u, i) => [u, (s + i) % 6]));
    const deadline = 1_762_000_000_000 + s * 7919;
    const byOdds = new Array(6).fill(0);
    let prev = -1;
    for (let ms = 0; ms < 300; ms++) {
      const w = dlDraw(seed, ci, field, pk, deadline + ms);
      byOdds[ODDS.indexOf(field[w])]++;
      if (prev >= 0) { pairs++; if (w !== prev) flips++; }
      prev = w;
    }
    // no single setup gives the game away: the likeliest horse in the window is never a lock
    const top = Math.max(...byOdds) / 300;
    assert.ok(top < chanceOf(2) + 0.17, `setup ${s}: the window's likeliest horse came up ${(top * 100).toFixed(0)} %`);
    byOdds.forEach((c, i) => { counts[i] += c; });
    setups++;
  }
  const total = setups * 300;
  ODDS.forEach((n, i) => assert.ok(Math.abs(counts[i] / total - chanceOf(n)) < 0.006, `${n}-1 over every window: ${(counts[i] / total * 100).toFixed(2)} %`));
  // one ms later is a fresh draw: the winner changes about as often as two independent draws would (1 − Σp² ≈ 80 %)
  const indep = 1 - ODDS.reduce((s, n) => s + chanceOf(n) ** 2, 0);
  assert.ok(Math.abs(flips / pairs - indep) < 0.02, `adjacent ms differ ${(flips / pairs * 100).toFixed(1)} % (independent: ${(indep * 100).toFixed(1)} %)`);
  // a pick changed at the last moment is a different hash too (nobody can steer it)
  const f = dlField('steer', 0), pkA = { a: 1, b: 2 }, pkB = { a: 3, b: 2 };
  let same = 0;
  for (let ms = 0; ms < 2000; ms++) if (dlDraw('steer', 0, f, pkA, 5e12 + ms) === dlDraw('steer', 0, f, pkB, 5e12 + ms)) same++;
  assert.ok(same / 2000 < 0.3);
  // the order the picks arrive in doesn't matter (sorted) — every phone + the server agree
  assert.equal(dlDraw('o', 1, f, { b: 2, a: 1 }, 77), dlDraw('o', 1, f, { a: 1, b: 2 }, 77));
});

test('THE LOCK: the director locks + draws ONCE when the odds board closes; a replayed step = the same patch; a new host mid-race never re-draws', () => {
  const seed = seedWithLuck(1);
  const game = createGame({ matchId: 'lk', settings: { mode: 'quick' }, participants: P(4), now: 0, seed, bank: {}, trivia: { n: 0 } });
  assert.equal(game.order[1], LUCK);
  const on = P(4);
  let now = game.phaseEndsAt;
  applyPatch(game, nextStep(game, { now, boards: {}, online: on, fallback: () => null }));    // challenge 0 opens
  const parts0 = partsFor(game.order[0], 0);
  now += 4000;
  applyPatch(game, nextStep(game, { now, boards: Object.fromEntries(uidsOf(4).map(u => [u, { p: parts0, ok: parts0, n: parts0, done: true, doneAt: now }])), online: on, fallback: () => null }));
  now = game.phaseEndsAt;
  applyPatch(game, nextStep(game, { now, boards: {}, online: on, fallback: () => null }));    // → ready (DUMB LUCK's rules card)
  assert.equal(game.phase, 'ready');
  now = game.phaseEndsAt;
  const open = nextStep(game, { now, boards: {}, online: on, fallback: () => null });
  assert.equal(open.phase, 'play');
  assert.equal(open.phaseEndsAt - open.playStartAt, DL_MS, 'the race\'s slot: 27 s');
  assert.ok(open.$room[`meta/used/overclock/${typeKey(LUCK)}`], 'the night remembers it was played');
  applyPatch(game, open);
  const boards = { a: pickBoard(0), b: pickBoard(5), c: pickBoard(5) };     // d never picks
  // the odds board is open: nothing happens, even with everyone "done" — it can't end early
  for (const t of [0, 3000, DL_PICK_MS - 1]) assert.equal(nextStep(game, { now: game.playStartAt + t, boards: { ...boards, d: { p: 1, ok: 1, n: 1, done: true } }, online: on, fallback: () => null }), null);
  // the lock: the picks + the lock's ms + the draw, in ONE patch, still 'play'
  const at = game.playStartAt + DL_PICK_MS + 137;
  const lock = nextStep(game, { now: at, boards, online: on, fallback: () => null });
  assert.deepEqual(Object.keys(lock), [`dl/${game.ci}`]);
  const dl = lock[`dl/${game.ci}`];
  assert.deepEqual(dl.pk, { a: 0, b: 5, c: 5 });
  assert.equal(dl.lk, at);
  assert.equal(dl.w, dlDraw(game.seed, game.ci, dlField(game.seed, game.ci), dl.pk, at));
  assert.deepEqual(nextStep(structuredClone(game), { now: at, boards, online: on, fallback: () => null }), lock, 'a replayed step = the same patch');
  applyPatch(game, lock);
  // MID-RACE a NEW HOST (no private state) + the phones' boards changed after the lock: nothing re-draws, nothing ends
  const late = { a: pickBoard(dl.w === 3 ? 2 : 3), b: pickBoard(1), d: pickBoard(dl.w) };
  for (const t of [1, 8000, DL_RACE_MS + DL_FINISH_MS - 1]) assert.equal(nextStep(structuredClone(game), { now: dl.lk + t, boards: late, online: on, fallback: () => null }), null, `${t} ms into the race`);
  // the end: the results from the STORED draw (d's late pick never counts)
  const end = nextStep(structuredClone(game), { now: dl.lk + DL_RACE_MS + DL_FINISH_MS, boards: late, online: on, fallback: () => null });
  assert.equal(end.phase, 'standings');
  assert.equal(end.phaseEndsAt - end.phaseStartAt, STANDINGS_MS, 'the shared flow\'s 8 s after it');
  const want = dlResults(game, game.ci, dl);
  assert.deepEqual(end[`results/${game.ci}`], want);
  assert.equal(end[`results/${game.ci}`].d.pts, 0);
  // still inside CHALLENGE_MS
  assert.ok(DL_PICK_MS + DL_RACE_MS + DL_FINISH_MS <= CHALLENGE_MS && dl.lk + DL_RACE_MS + DL_FINISH_MS - game.playStartAt < CHALLENGE_MS);
});

test('THE TIMES: odds board 7 s → race 16 s → finish 4 s = 27 s, inside the 30-s CHALLENGE_MS; the after-screen is the shared 8 s', () => {
  assert.equal(DL_PICK_MS, 7000); assert.equal(DL_RACE_MS, 16000); assert.equal(DL_FINISH_MS, 4000); assert.equal(DL_MS, 27000);
  assert.ok(DL_MS < CHALLENGE_MS);
  assert.equal(standingsMs(LUCK), STANDINGS_MS);
  // the stage a refresh lands on: pick → (the off: waiting for the host's lock) → race → finish → done
  const game = { seed: 'st', playStartAt: 1000, dl: {} };
  assert.equal(dlStage(game, 0, 1000 + 3000).stage, 'pick');
  assert.equal(dlStage(game, 0, 1000 + DL_PICK_MS + 50).stage, 'off');
  game.dl[0] = { pk: {}, lk: 1000 + DL_PICK_MS + 120, w: 2 };
  assert.deepEqual(dlStage(game, 0, game.dl[0].lk + 5000), { stage: 'race', ms: 5000 });
  assert.deepEqual(dlStage(game, 0, game.dl[0].lk + DL_RACE_MS + 900), { stage: 'finish', ms: 900 });
  assert.equal(dlStage(game, 0, game.dl[0].lk + DL_RACE_MS + DL_FINISH_MS + 1).stage, 'done');
});

// ------------------------------------------------------------------------------------------------ THE RACE SCRIPT
test('THE RACE SCRIPT: 10,000 races — the drawn winner first at the line, nobody teleports or runs backwards, lead changes in most, some photo finishes', () => {
  let changed = 0, photos = 0, faderLed = 0, maxStep = 0;
  const dramas = {};
  const pace = 1 / RACE_SAMPLES;
  for (let k = 0; k < 10_000; k++) {
    const seed = `race${k}`, ci = k % 17, w = k % 6;
    const S = raceScript(seed, ci, w);
    assert.equal(S.order[0], w);
    assert.equal(posAt(S, w, DL_RACE_MS), 1, 'the winner\'s nose on the line at the end');
    for (let h = 0; h < 6; h++) {
      if (h !== w) assert.ok(posAt(S, h, DL_RACE_MS) < 1, `${k}: lane ${h} behind`);
      const row = S.x[h];
      assert.equal(row.length, RACE_SAMPLES + 1);
      assert.equal(row[0], 0, 'out of the gate together');
      for (let i = 1; i < row.length; i++) {
        const d = row[i] - row[i - 1];
        assert.ok(d >= 0, `${k}: lane ${h} ran backwards at ${i}`);
        if (d > maxStep) maxStep = d;
      }
    }
    // the finishing order is the gaps' order
    for (let j = 1; j < 6; j++) assert.ok(S.gaps[S.order[j]] >= S.gaps[S.order[j - 1]]);
    if (leadChanges(S) >= 1) changed++;
    if (S.photo) photos++;
    if (leaderAt(S, 5000) === S.fader || leaderAt(S, 7000) === S.fader) faderLed++;
    dramas[S.drama] = (dramas[S.drama] || 0) + 1;
    if (k < 50) assert.deepEqual(raceScript(seed, ci, w), S, 'deterministic: every phone draws the same race');
  }
  assert.ok(maxStep < pace * 2.2, `the biggest step ${(maxStep / pace).toFixed(2)}× the pace — no teleports`);
  assert.ok(changed / 10_000 >= 0.9, `lead changes in ${(changed / 100).toFixed(1)} % of races`);
  assert.ok(photos / 10_000 > 0.15 && photos / 10_000 < 0.35, `photo finishes in ${(photos / 100).toFixed(1)} %`);
  assert.ok(faderLed / 10_000 > 0.5, `the early leader fades (it led early in ${(faderLed / 100).toFixed(1)} %)`);
  assert.ok(dramas.closer > 3500 && dramas.duel > 2000 && dramas.wire > 1500, JSON.stringify(dramas));
  // a refresh mid-race = the same frame: the position is a pure function of the script + the ms
  const S = raceScript('r', 3, 2);
  assert.equal(posAt(S, 4, 7777), posAt(raceScript('r', 3, 2), 4, 7777));
  assert.equal(SAMPLE_MS * RACE_SAMPLES, DL_RACE_MS);
  assert.ok(PHOTO_GAP > 0.002 && PHOTO_GAP < 0.01);
});

// ------------------------------------------------------------------------------------------------ PLACEMENT
test('PLACEMENT: at most once a match, NEVER the last challenge, NEVER in SOLO; it joins Quick / Standard / Marathon like any type', () => {
  assert.ok(TYPES.includes(LUCK) && !SKILL_TYPES.includes(LUCK) && SKILL_TYPES.length === 18);
  assert.equal(CATEGORY[LUCK], 'luck');
  assert.equal(INFO[LUCK].name, 'DUMB LUCK');
  assert.equal(partsFor(LUCK, 0), 1);
  const freq = {};
  for (const [mode, total] of Object.entries(MODES)) {
    let n = 0;
    for (let s = 0; s < 1500; s++) {
      const o = buildOrder(`pl${mode}${s}`, total);
      const k = o.filter(t => t === LUCK).length;
      assert.ok(k <= 1, `${mode}: once at most`);
      assert.notEqual(o[total - 1], LUCK, `${mode}: never the last`);
      n += k;
      const solo = buildOrder(`pl${mode}${s}`, total, [], { luck: false });
      assert.ok(!solo.includes(LUCK), `${mode}: never solo`);
    }
    freq[mode] = n / 1500;
  }
  assert.ok(freq.quick > 0.2 && freq.quick < 0.4, `QUICK deals it in ${(freq.quick * 100).toFixed(0)} % of matches`);
  assert.ok(freq.standard > 0.5, `STANDARD ${(freq.standard * 100).toFixed(0)} %`);
  assert.equal(freq.marathon, 1, 'MARATHON: every type once');
  // SOLO through createGame: one participant → no Dumb Luck, ever
  for (let s = 0; s < 400; s++) {
    for (const mode of ['quick', 'standard', 'marathon']) {
      const g = createGame({ matchId: `so${s}`, settings: { mode }, participants: { me: true }, now: 0, seed: `solo${s}`, bank: {}, trivia: { n: 0 } });
      assert.ok(!g.order.includes(LUCK), `solo ${mode}`);
    }
  }
  // THE ROOM's NIGHT MEMORY: played tonight → the rematch favours the others (DUMB LUCK included)
  let again = 0, fresh = 0;
  for (let s = 0; s < 1500; s++) {
    if (buildOrder(`nm${s}`, 6, [LUCK, 'math', 'memory']).includes(LUCK)) again++;
    if (buildOrder(`nm${s}`, 6, ['math', 'memory']).includes(LUCK)) fresh++;
  }
  assert.ok(again * 3 < fresh, `played tonight: ${again} vs fresh ${fresh}`);
  // its key marks the night when it opens
  const g = createGame({ matchId: 'k', settings: { mode: 'quick' }, participants: P(2), now: 0, seed: seedWithLuck(0), bank: {}, trivia: { n: 0 } });
  assert.deepEqual(keysAt(g, 0), [typeKey(LUCK)]);
  assert.deepEqual(playedTypes({ [typeKey(LUCK)]: true }), [LUCK]);
});

// ------------------------------------------------------------------------------------------------ SCORING + THE HAND-OFF
test('SCORING + THE HAND-OFF: one winner = a sole round win; shared tickets = no sole win (the server\'s rule); nobody = THE HOUSE WINS', () => {
  const parts = P(4), seed = 'ho';
  const field = dlField(seed, 2);
  const base = { seed, participants: parts, order: ['math', 'math', LUCK, 'math'], results: {} };
  const race = (pk, w) => { const g = structuredClone(base); g.dl = { 2: { pk, lk: 99, w } }; g.results[2] = dlResults(g, 2, g.dl[2]); return g; };
  // a sole ticket
  let g = race({ a: 3, b: 1, c: 0 }, 3);
  assert.deepEqual(roundWinOf(g, 2), { kind: 'win', uid: 'a', uids: ['a'], pts: payout(field[3]) });
  assert.deepEqual(dlTickets(g, 2).uids, ['a']);
  // WINNING TICKETS: YOU · LEO — two on the winner: a tie for the top (no sole round win — REDLINE never counts it)
  g = race({ a: 3, b: 3, c: 0 }, 3);
  assert.equal(roundWinOf(g, 2).kind, 'tie');
  assert.deepEqual(dlTickets(g, 2).uids, ['a', 'b']);
  // THE HOUSE WINS: nobody backed it
  g = race({ a: 1, b: 2 }, 5);
  assert.equal(roundWin(g.results[2], Object.keys(parts)).kind, 'none');
  assert.deepEqual(dlTickets(g, 2).uids, []);
  // DUMB LUCK is chance: the combo neither adds nor breaks; FASTEST ignores it
  assert.ok(COMBO_NEUTRAL.has(LUCK) && FASTEST_SKIP.has(LUCK));
  // the server's per-challenge ceiling knows its longest payout
  assert.equal(challengeMax(LUCK, false), 260);
  // LONG SHOT! (an 8-1 / 12-1 ticket) = the victory's first award chip
  const longLane = field.indexOf(12);
  g = race({ c: longLane, a: field.indexOf(2) }, longLane);
  assert.ok(dlTickets(g, 2).long);
  assert.deepEqual(longShots(g), [{ uid: 'c', n: 12, ci: 2 }]);
  assert.deepEqual(awardChips(g)[0], { k: 'longshot', uid: 'c', v: 12 });
  assert.ok(awardChips(g).length <= 2);
  g = race({ c: field.indexOf(2) }, field.indexOf(2));
  assert.equal(dlTickets(g, 2).long, false);
  assert.ok(!awardChips(g).some(c => c.k === 'longshot'));
});

/** a whole simulated match through the director: each phone answers / picks; DUMB LUCK locks, races, finishes; a NEW HOST mid-race */
function playMatch({ n, mode = 'quick', seed, pick, perfect = () => true, hostSwapMidRace = true }) {
  const parts = P(n), on = P(n);
  const game = createGame({ matchId: `pm-${seed}`, settings: { mode }, participants: parts, now: 0, seed, bank: {}, trivia: { n: 0 } });
  let now = 0;
  for (let ci = 0; ci < game.total; ci++) {
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, { now, boards: {}, online: on, fallback: () => null }));
    assert.equal(game.phase, 'play');
    const type = game.order[ci];
    if (type === LUCK) {
      const boards = Object.fromEntries(uidsOf(n).map((u, i) => [u, pick(u, i)]).filter(([, h]) => h >= 0).map(([u, h]) => [u, pickBoard(h)]));
      applyPatch(game, nextStep(game, { now: game.playStartAt + DL_PICK_MS + 40, boards, online: on, fallback: () => null }));
      const dl = dlOf(game, ci);
      assert.ok(dl);
      // the race is running: a refresh / a new host from a COPY of the state lands on the same race, never re-draws
      if (hostSwapMidRace) {
        const copy = structuredClone(game);
        assert.equal(nextStep(copy, { now: dl.lk + 9000, boards: {}, online: on, fallback: () => null }), null);
        assert.deepEqual(dlOf(copy, ci), dl);
      }
      now = dl.lk + DL_RACE_MS + DL_FINISH_MS;
      applyPatch(game, nextStep(structuredClone(game), { now, boards: {}, online: on, fallback: () => null }));
    } else {
      const parts1 = partsFor(type, ci / (game.total - 1));
      now = game.playStartAt + 5000;
      const boards = Object.fromEntries(uidsOf(n).map((u, i) => { const ok = perfect(u, ci) ? parts1 : Math.max(0, parts1 - 1 - (i % 2)); return [u, { p: parts1, ok, n: parts1, done: true, doneAt: now + i * 300 }]; }));
      applyPatch(game, nextStep(game, { now, boards, online: on, fallback: () => null }));
    }
    if (ci < game.total - 1) {
      assert.equal(game.phase, 'standings');
      now = game.phaseEndsAt;
      applyPatch(game, nextStep(game, { now, boards: {}, online: on, fallback: () => null }));
    }
  }
  assert.equal(game.phase, 'final');
  return game;
}

test('WHOLE MATCHES at 2 + 8 players: Dumb Luck dealt, raced, scored into the same record; a host change mid-race changes nothing', () => {
  for (const n of [2, 8]) {
    for (let k = 0; k < 12; k++) {
      const seed = seedWithLuck(k % 5, 6, `wm${n}-${k}-`);
      const game = playMatch({ n, seed, pick: (u, i) => (i === n - 1 ? -1 : (i + k) % 6) });   // the last player never picks
      const ci = game.order.indexOf(LUCK);
      const t = dlTickets(game, ci);
      for (const u of uidsOf(n)) {
        const r = game.results[ci][u];
        assert.deepEqual(Object.keys(r).sort(), ['ok', 'parts', 'pts']);
        assert.equal(r.pts, t.uids.includes(u) ? t.pay : 0);
      }
      assert.ok(!t.uids.includes(uidsOf(n)[n - 1]), 'no pick = no ticket');
      // the record the server reads keeps its shape: results[ci][uid].pts, total, settings.mode — and the race replays
      assert.equal(game.total, 6); assert.equal(game.settings.mode, 'quick');
      const v = dlVerify(game, ci);
      assert.ok(v.ok, 'the server replays the race');
      assert.deepEqual(v.winners, t.uids);
      const ex = extractMatch(game);
      assert.deepEqual(ex.rejected, []);
      for (const u of uidsOf(n)) assert.equal(!!(ex.rows[u].f && ex.rows[u].f.horseshoe), t.uids.includes(u), `${u}: the horseshoe = backed the winner`);
    }
  }
});

test('REDLINE still needs a SOLE top score in all six — Dumb Luck included (a shared ticket breaks the sweep)', () => {
  // 'a' aces every skill challenge, the others are behind; Dumb Luck at challenge 2 — over a few seeds + lanes we meet both cases
  let swept = 0, shared = 0, lost = 0;
  for (let k = 0; k < 40 && !(swept && shared && lost); k++) {
    const seed = seedWithLuck(2, 6, `rl${k}-`);
    for (let h = 0; h < 6; h++) {
      const g1 = playMatch({ n: 3, seed, pick: (u, i) => (i === 0 ? h : -1), perfect: u => u === 'a', hostSwapMidRace: false });
      const f1 = extractMatch(g1).rows.a.f || {};
      if (dlOf(g1, 2).w === h) { assert.equal(f1.sweep, 1, 'a sole winning ticket + the five skill wins = REDLINE'); assert.equal(f1.horseshoe, 1); swept++; }
      else { assert.ok(!f1.sweep, 'a losing ticket: no sweep'); assert.ok(!f1.horseshoe); lost++; }
      const g2 = playMatch({ n: 3, seed, pick: (u, i) => (i <= 1 ? h : -1), perfect: u => u === 'a', hostSwapMidRace: false });
      if (dlOf(g2, 2).w === h) { const f2 = extractMatch(g2).rows; assert.ok(!(f2.a.f || {}).sweep, 'a SHARED ticket = no sole round win → no REDLINE'); assert.equal(f2.a.f.horseshoe, 1); assert.equal(f2.b.f.horseshoe, 1); shared++; }
    }
  }
  assert.ok(swept && shared && lost, `swept ${swept} · shared ${shared} · lost ${lost}`);
});

// ------------------------------------------------------------------------------------------------ THE DAILY PLUG-IN (ships OFF)
const TRIV = [{ q: 'Which planet is closest to the sun?', a: ['Venus', 'Mercury', 'Mars', 'Earth'], c: 1, cat: 'general', d: 'easy' },
  { q: 'How many sides does a hexagon have?', a: ['5', '6', '7', '8'], c: 1, cat: 'general', d: 'easy' },
  { q: 'What gas do plants take in?', a: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], c: 2, cat: 'general', d: 'easy' }];
/** a day set as THE DAILY MODULE would hand it over (its seed from a server secret — opaque here) */
const DAY = (o = {}) => ({ v: 1, day: '2026-11-07', seed: 'k3J9xQ0-sealed-by-the-module', order: ['unscramble', 'math', 'memory', 'oddone', 'trivia', 'stroop'], trivia: TRIV, ...o });

test('THE DAILY PLUG-IN: on: false; the contract shape; checkCartridge passes; never switches itself on', () => {
  assert.equal(daily.on, false);
  for (const [k, t] of Object.entries(DAILY)) assert.equal(typeof daily[k], t, `daily.${k}`);
  const stub = { start() {}, prepare() {}, step() {}, livePaths() {}, createView() {}, DEFAULT_SETTINGS: { mode: 'quick' }, OPTIONS: [], estimateMinutes() {}, finalRanks() {}, MUSIC: null, daily };
  assert.ok(!checkCartridge('overclock', stub).some(x => /daily/.test(x)), checkCartridge('overclock', stub).join());
  assert.match(readFileSync('js/games/overclock/index.js', 'utf8'), /export \{ daily \} from '\.\/daily\.js'/);
});

test('THE DAY SET: six skill challenges, one per brain category (a knowledge one), NEVER DUMB LUCK, an opaque seed (never the date), own-bank trivia', () => {
  assert.deepEqual(daySetProblems(DAY()), []);
  const bad = [
    [DAY({ order: ['unscramble', 'math', 'memory', 'oddone', 'dumbluck', 'stroop'] }), /never DUMB LUCK/],
    [DAY({ order: ['unscramble', 'missinglink', 'memory', 'oddone', 'trivia', 'stroop'] }), /same brain category/],
    [DAY({ order: ['unscramble', 'math', 'memory', 'oddone', 'reflex', 'stroop'] }), /same brain category|knowledge/],
    [DAY({ order: ['unscramble', 'math', 'memory', 'oddone', 'trivia'] }), /exactly 6/],
    [DAY({ seed: 'daily-2026-11-07-x' }), /date/],
    [DAY({ seed: 'short' }), /seed/],
    [DAY({ trivia: [] }), /three questions/],
    [DAY({ v: 2 }), /v must be/],
  ];
  for (const [ds, re] of bad) assert.match(daySetProblems(ds).join(' · '), re);
  assert.throws(() => dCreate({ date: '2026-11-07', uid: 'a', now: 0, daySet: DAY({ order: ['dumbluck'] }) }), /DUMB LUCK|exactly/);
  assert.throws(() => dCreate({ date: '2026-11-08', uid: 'a', now: 0, daySet: DAY() }), /another day/);
});

test('THE SAME DAY SET → THE SAME RUN on two phones; fully deterministic (no Math.random, no clock but now, no network)', () => {
  const real = Math.random;
  Math.random = () => { throw new Error('Math.random in a daily'); };
  let a, b;
  try {
    a = dCreate({ date: '2026-11-07', uid: 'phoneA', now: 1000, daySet: DAY() });
    b = dCreate({ date: '2026-11-07', uid: 'phoneB', now: 1000, daySet: DAY() });
  } finally { Math.random = real; }
  assert.equal(a.matchId, b.matchId);
  assert.equal(a.matchId, dailyMatchId(DAY()));
  assert.deepEqual(a.order, DAY().order);
  assert.ok(!a.order.includes('dumbluck'));
  assert.equal(a.total, DAILY_N);
  assert.deepEqual({ ...a, participants: null }, { ...b, participants: null }, 'the two phones build the same match');
  assert.deepEqual(Object.keys(a.participants), ['phoneA']);
  // every challenge's content is the same on both (the generators run from the day set's seed + its deal)
  for (let ci = 0; ci < DAILY_N; ci++) {
    const t = a.order[ci];
    if (t === 'trivia' || t === 'unscramble') continue;   // (trivia = the day set's own questions; unscramble = the word lists + the deal)
    assert.deepEqual(generate(t, { seed: a.seed, ci, level: ci / 5 }), generate(t, { seed: b.seed, ci, level: ci / 5 }), t);
  }
  // the own-bank questions are IN the match (encoded like any room's bank) — no top-up from the live Trivia API is ever needed
  assert.equal(a.trivia.n, 3);
  assert.equal(Object.keys(a.bank).length, 3);
  // another day's set → another run
  const c = dCreate({ date: '2026-11-08', uid: 'phoneA', now: 1000, daySet: DAY({ day: '2026-11-08', seed: 'another-sealed-seed-x7' }) });
  assert.notEqual(c.matchId, a.matchId);
});

/** play a daily through the director (solo): ok(ci, parts) right answers, finished at t(ci) ms; stopAt = stop once this many have closed */
function playDaily(g, uid, { ok = (ci, p) => p, t = ci => 4000 + ci * 1100, stopAt = DAILY_N } = {}) {
  let now = g.phaseStartAt;
  for (let guard = 0; guard < 60 && g.phase !== 'final'; guard++) {
    if (g.phase === 'ready') { now = g.phaseEndsAt; applyPatch(g, nextStep(g, { now, boards: {}, online: { [uid]: true }, fallback: () => null })); continue; }
    if (g.phase === 'play') {
      const parts = partsFor(g.order[g.ci], g.ci / (g.total - 1));
      now = g.playStartAt + t(g.ci);
      applyPatch(g, nextStep(g, { now, boards: { [uid]: { p: parts, ok: ok(g.ci, parts), n: parts, done: true, doneAt: now } }, online: { [uid]: true }, fallback: () => null }));
      continue;
    }
    if (g.phase === 'standings') { if (g.ci + 1 >= stopAt) break; now = g.phaseEndsAt; applyPatch(g, nextStep(g, { now, boards: {}, online: { [uid]: true }, fallback: () => null })); }
  }
  return g;
}

test('ONE TRY, RESUMED: a lock / a refresh mid-run picks up from the stored run (resumeKey) — the same result as a run never interrupted', () => {
  assert.equal(resumeKey('2026-11-07', 'pid9'), 'overclock:daily:2026-11-07:pid9');
  assert.notEqual(resumeKey('2026-11-07', 'pid9'), resumeKey('2026-11-08', 'pid9'));
  const ok = (ci, p) => Math.max(0, p - (ci % 3 === 1 ? 1 : 0));
  const straight = playDaily(dCreate({ date: '2026-11-07', uid: 'me', now: 5000, daySet: DAY() }), 'me', { ok });
  assert.equal(straight.phase, 'final');
  // the same run, the phone locked after challenge 3: the module stored the game under resumeKey; the refresh reads it back + the director goes on
  const stored = JSON.stringify(playDaily(dCreate({ date: '2026-11-07', uid: 'me', now: 5000, daySet: DAY() }), 'me', { ok, stopAt: 3 }));
  assert.equal(JSON.parse(stored).phase, 'standings');
  const resumed = playDaily(JSON.parse(stored), 'me', { ok });
  assert.equal(resumed.phase, 'final');
  assert.deepEqual(resumed.results, straight.results);
  assert.deepEqual(dResult(resumed, 'me'), dResult(straight, 'me'));
  // a second create() for the day is the SAME match (never a fresh deal) — the module keeps the stored one
  assert.equal(dCreate({ date: '2026-11-07', uid: 'me', now: 99999, daySet: DAY() }).matchId, straight.matchId);
});

test('ONE COMPARABLE SCORE: the normal Overclock points (incl. the speed bonus) + a tie-break (the total answer time, lower wins); the server replay', () => {
  const fast = playDaily(dCreate({ date: '2026-11-07', uid: 'me', now: 0, daySet: DAY() }), 'me', { t: ci => 3000 + ci * 500 });
  const slow = playDaily(dCreate({ date: '2026-11-07', uid: 'me', now: 0, daySet: DAY() }), 'me', { t: ci => 9000 + ci * 500 });
  const rf = dResult(fast, 'me'), rs = dResult(slow, 'me');
  assert.equal(rf.score, Object.values(fast.results).reduce((s, r) => s + r.me.pts, 0), 'the normal Overclock score');
  assert.ok(rf.score > rs.score, 'the speed bonus counts');
  assert.ok(rf.time < rs.time);
  assert.equal(rf.time, Object.values(fast.tm).reduce((s, x) => s + x.me, 0));
  // the tie-break: the same points, the faster run ranks higher; more points always beat a faster run
  assert.ok(rankOf(500, 40_000) > rankOf(500, 41_000));
  assert.ok(rankOf(501, 179_000) > rankOf(500, 0));
  // THE SERVER's REPLAY: the record re-scored from the scoring table = the same result; a padded / impossible record = null
  const rec = { results: fast.results, tm: fast.tm };
  assert.deepEqual(dReplay(DAY(), rec, 'me'), rf);
  const padded = structuredClone(rec); padded.results[2].me.pts += 10;
  assert.equal(dReplay(DAY(), padded, 'me'), null);
  const tooMany = structuredClone(rec); tooMany.results[0].me.ok = tooMany.results[0].me.parts + 1;
  assert.equal(dReplay(DAY(), tooMany, 'me'), null);
  const late = structuredClone(rec); late.tm[1].me = 31_000;
  assert.equal(dReplay(DAY(), late, 'me'), null);
  assert.equal(dReplay(DAY({ order: ['dumbluck', 'math', 'memory', 'oddone', 'trivia', 'stroop'] }), rec, 'me'), null, 'never a Dumb Luck day');
});
