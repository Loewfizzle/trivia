// HIGH STAKES — rules + whole-match simulations (no network, no Firebase).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  START, LOAN, ROUNDS, FINAL, minBet, clampBet, payout, ledger, resolveRound, standings, finalOrder, difficultyPlan,
  pickQuestion, catFromOtdb, isDoubleDown, MS, showMs,
} from '../js/games/stakes/logic.js';
import { createGame, nextStep, showPatch } from '../js/games/stakes/director.js';
import { addItems, decodeQ, tableCategory, nextWant, unplayed } from '../js/games/stakes/questions.js';
import { fetchBatch } from '../js/games/stakes/feed.js';
import { setFallbackRows, pickFallback } from '../js/trivia/bank.js';
import { extractMatch } from '../js/core/match-report.js';

setFallbackRows(JSON.parse(readFileSync('data/trivia/fallback.json', 'utf8')).questions);

function apply(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = (o[p] ??= {});
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
  return obj;
}
const CODE = 'HSTK';
const CATS = ['science', 'history', 'geography', 'film', 'music', 'arts', 'tech', 'nature', 'myth', 'general'];
/** A bank with every category at both difficulties (as the feed would build it). */
function bankFor(game, perCell = 3) {
  const items = [];
  for (const cat of CATS) for (const d of ['medium', 'hard']) for (let k = 0; k < perCell; k++) items.push({ q: `${cat} ${d} question number ${k} about something`, a: ['A1', 'B2', 'C3', 'D4'], c: k % 4, cat, d, src: 'fb' });
  // fb items map through the bank's category ids; tag the table categories directly
  const tagged = items.map(it => ({ ...it, src: 'otdb', cn: { science: 'Science & Nature', history: 'History', geography: 'Geography', film: 'Entertainment: Film', music: 'Entertainment: Music', arts: 'Art', tech: 'Science: Computers', nature: 'Animals', myth: 'Mythology', general: 'General Knowledge' }[it.cat] }));
  return addItems(game, CODE, tagged).patch;
}

test('bets: the minimum is 10 % (at least 10), the maximum everything; a timeout bets the minimum', () => {
  assert.equal(minBet(1000), 100);
  assert.equal(minBet(1004), 100);
  assert.equal(minBet(1250), 125);
  assert.equal(minBet(55), 10);
  assert.equal(minBet(10), 10);
  assert.equal(minBet(9), 9, 'under 10: all of it');
  assert.equal(minBet(0), 0);
  assert.equal(clampBet(5, 1000), 100, 'below the minimum → the minimum');
  assert.equal(clampBet(5000, 1000), 1000, 'above the stack → all in');
  assert.equal(clampBet(333.6, 1000), 334);
  assert.equal(clampBet(undefined, 1000), 100, 'no bet → the minimum');
  assert.equal(clampBet(NaN, 600), 60);
});

test('payouts: MEDIUM 1×, HARD 2×, DOUBLE DOWN rounds (4 and 8) double them', () => {
  assert.equal(payout('medium', 0), 1);
  assert.equal(payout('hard', 0), 2);
  assert.ok(isDoubleDown(3) && isDoubleDown(7) && !isDoubleDown(4));
  assert.equal(payout('medium', 3), 2);
  assert.equal(payout('hard', 7), 4);
  assert.equal(payout('hard', FINAL), 2, 'the final is a plain HARD');
  const g = { participants: { a: true, b: true, c: true }, plan: { 3: { d: 'hard' } }, res: {} };
  const r = resolveRound(g, 3, { a: { b: { b: 300 }, a: { a: 2, at: 5000 } }, b: { b: { b: 300 }, a: { a: 1, at: 2000 } } }, 2, 1000);
  assert.deepEqual(r.a, { b: 300, a: 2, ok: true, d: 1200, t: 4000 }, 'HARD on DOUBLE DOWN: +4×');
  assert.deepEqual(r.b, { b: 300, a: 1, ok: false, d: -300, t: 1000 }, 'wrong: loses the bet');
  assert.deepEqual(r.c, { b: 100, a: -1, ok: false, d: -100, t: MS.q }, 'no bet, no answer: the minimum is lost, full time counted');
});

test('house loans: 200 at zero, as many as needed, subtracted from the final total; ties go to the faster player', () => {
  const g = { participants: { a: true, b: true }, plan: {}, res: {} };
  g.res[0] = { a: { b: 1000, a: 0, ok: false, d: -1000, t: 5000 }, b: { b: 100, a: 1, ok: true, d: 100, t: 9000 } };
  let L = ledger(g);
  assert.equal(L.a.stack, LOAN, 'busted → the house loans 200');
  assert.equal(L.a.loans, 200);
  assert.equal(L.a.net, 0, 'chips minus loans');
  g.res[1] = { a: { b: 200, a: 0, ok: false, d: -200, t: 5000 }, b: { b: 110, a: 1, ok: false, d: -110, t: 9000 } };
  L = ledger(g);
  assert.equal(L.a.loanN, 2, 'a second loan');
  assert.equal(L.a.stack, 200);
  assert.equal(L.a.net, -200, 'two loans: playing deeper in the red');
  g.res[2] = { a: { b: 200, a: 0, ok: true, d: 800, t: 1000 }, b: { b: 99, a: 1, ok: true, d: 0, t: 1000 } };
  L = ledger(g);
  assert.equal(L.a.stack, 1000);
  assert.equal(L.a.net, 600, 'a big win on credit still owes the house');
  assert.equal(L.a.best, 800, 'biggest single-round win');
  // ties: equal net → the lower total answer time wins
  const t = { participants: { x: true, y: true }, plan: {}, res: { 0: { x: { b: 100, a: 0, ok: true, d: 100, t: 9000 }, y: { b: 100, a: 0, ok: true, d: 100, t: 4000 } } } };
  const s = standings(t);
  assert.deepEqual(s.map(r => [r.uid, r.rank]), [['y', 1], ['x', 2]]);
});

test('ALL IN: the showdown reveals from last place to first', () => {
  const g = { participants: { a: true, b: true, c: true }, plan: {}, res: { 0: { a: { d: 500, t: 1 }, b: { d: -50, t: 1 }, c: { d: 100, t: 1 } } } };
  assert.deepEqual(finalOrder(g), ['b', 'c', 'a']);
});

test('the difficulty plan: ~half HARD, never three alike in a row, opens MEDIUM, the final HARD', () => {
  for (let s = 0; s < 300; s++) {
    const d = difficultyPlan(`m${s}`);
    assert.equal(d.length, ROUNDS + 1);
    assert.equal(d[0], 'medium');
    assert.equal(d[FINAL], 'hard');
    const hard = d.slice(0, ROUNDS).filter(x => x === 'hard').length;
    assert.ok(hard >= 4 && hard <= 6, `${hard} hard`);
    for (let i = 2; i < ROUNDS; i++) assert.ok(!(d[i] === d[i - 1] && d[i] === d[i - 2]));
  }
});

test('categories: Open Trivia DB names map to the table; unsuitable ones are dropped; easy questions never get in', () => {
  assert.equal(catFromOtdb('Science: Computers'), 'tech');
  assert.equal(catFromOtdb('Science: Gadgets'), 'tech');
  assert.equal(catFromOtdb('Animals'), 'nature');
  assert.equal(catFromOtdb('Mythology'), 'myth');
  assert.equal(catFromOtdb('Science & Nature'), 'science');
  assert.equal(catFromOtdb('Entertainment: Film'), 'film');
  assert.equal(catFromOtdb('Entertainment: Video Games'), null);
  assert.equal(catFromOtdb('Entertainment: Japanese Anime & Manga'), null);
  assert.equal(tableCategory({ d: 'easy', src: 'otdb', cn: 'History' }), null);
  assert.equal(tableCategory({ d: 'hard', src: 'tapi', cn: 'food_and_drink' }), 'general');
  assert.equal(tableCategory({ d: 'medium', src: 'fb', cat: 'screen' }), 'film');
  const g = { matchId: 'mx', trivia: { n: 0, seen: {} } };
  const { patch } = addItems(g, CODE, [
    { q: 'Which planet is known as the red planet?', a: ['Mars', 'Venus', 'Jupiter', 'Saturn'], c: 0, d: 'medium', src: 'otdb', cn: 'Science & Nature' },
    { q: 'Which planet is known as the red planet?', a: ['Mars', 'Venus', 'Jupiter', 'Saturn'], c: 0, d: 'medium', src: 'tapi', cn: 'science' },
    { q: 'A video game question nobody at this table wants', a: ['1', '2', '3', '4'], c: 0, d: 'hard', src: 'otdb', cn: 'Entertainment: Video Games' },
  ]);
  apply(g, patch);
  assert.equal(g.trivia.n, 1, 'duplicates and unsuitable categories skipped');
  assert.equal(g.qmeta[0], 'science|medium');
  assert.ok(!JSON.stringify(g.bank).includes('Mars'), 'the question is obfuscated in the room');
  assert.equal(decodeQ(g, CODE, 0).a[0], 'Mars');
});

test('question sources: Open Trivia DB, then The Trivia API, then the bundled bank', async () => {
  const item = d => ({ q: `q-${d}`, a: ['a', 'b', 'c', 'd'], c: 0, d, src: 'x' });
  let r = await fetchBatch('hard', { otdb: async () => ({ code: 0, items: [item('hard')] }), tapi: async () => [], tokenFn: async () => 'TOK' });
  assert.equal(r.source, 'otdb');
  assert.equal(r.token, 'TOK');
  r = await fetchBatch('hard', { otdb: async () => { throw new Error('down'); }, tapi: async () => [item('hard')], tokenFn: async () => 'TOK' });
  assert.equal(r.source, 'tapi');
  r = await fetchBatch('hard', { otdb: async () => ({ code: 5, items: [] }), tapi: async () => { throw new Error('429'); }, tokenFn: async () => 'TOK', fallback: (d, seen) => pickFallback(5, { d, seen }) });
  assert.equal(r.source, 'bank');
  assert.ok(r.items.length >= 1 && r.items.every(x => x.d === 'hard'), 'bundled HARD questions');
  r = await fetchBatch('medium', { otdb: async () => ({ code: 4, items: [] }), tapi: async () => [], tokenFn: async () => 'OLD', token: 'OLD', fallback: () => [] });
  assert.equal(r.token, '', 'an exhausted token is dropped (a fresh one next time)');
});

/** Plays a whole match. players: uids; brain(uid, round, q) → { bet, answer | -1 | null } */
function playMatch(players, brain, { offline = [], migrateAt = 4 } = {}) {
  let now = 1_000_000;
  const participants = Object.fromEntries(players.map(u => [u, true]));
  const game = createGame({ matchId: `sim${players.length}`, participants, now });
  apply(game, bankFor(game));
  const hidden = {};
  const lock = {};
  const online = Object.fromEntries(players.map(u => [u, !offline.includes(u)]));
  const fallback = (g, d) => { const picks = pickFallback(3, { d, seen: g.trivia.seen }); return picks ? addItems(g, CODE, picks).patch : null; };
  const cats = [];
  let ticks = 0;
  while (game.phase !== 'final' && ticks++ < 5000) {
    // players act
    if (game.phase === 'bet') {
      const L = ledger(game, game.round);
      for (const u of players) {
        if (!online[u] || (lock[game.rk] && lock[game.rk][u])) continue;
        const { bet } = brain(u, game.round, null, L[u]);
        (hidden[game.rk] ??= {})[u] = { b: { b: bet } };
        (lock[game.rk] ??= {})[u] = { b: now };
      }
    }
    if (game.phase === 'q') {
      const q = decodeQ(game, CODE, game.plan[game.round].i);
      for (const u of players) {
        if (!online[u] || (lock[game.rk][u] && lock[game.rk][u].a)) continue;
        const { answer } = brain(u, game.round, q);
        if (answer == null) continue;
        hidden[game.rk][u].a = { a: answer, at: now + 1500 };
        lock[game.rk][u].a = now + 1500;
      }
    }
    if (game.phase === 'show' && !game.res[game.round]) {
      const q = decodeQ(game, CODE, game.plan[game.round].i);
      apply(game, showPatch(game, hidden[game.rk], q.c, now));
    }
    const ctx = { code: CODE, now, live: { lock: lock[game.rk] || {} }, online, fallback };
    const step = nextStep(game, ctx);
    if (step) {
      // host migration: a new host computes the same step from the same state (no double-scoring)
      if (game.round === migrateAt && game.phase === 'stand') assert.deepEqual(nextStep(structuredClone(game), ctx), step);
      apply(game, step);
      if (step.phase === 'cat') cats.push(game.plan[game.round].cat);
    }
    now += 900;
  }
  return { game, cats };
}

test('a whole match with 2 players: 10 rounds + ALL IN, DOUBLE DOWN on 4 and 8, the right money', () => {
  // a: always bets half and is always right; b: bets the minimum and is always wrong
  const { game, cats } = playMatch(['a', 'b'], (u, r, q, L) => (q ? { answer: u === 'a' ? q.c : (q.c + 1) % 4 } : { bet: u === 'a' ? Math.round(L.stack / 2) : 0 }));
  assert.equal(game.phase, 'final');
  assert.equal(Object.keys(game.res).length, ROUNDS + 1);
  for (let i = 1; i < cats.length; i++) assert.notEqual(cats[i], cats[i - 1], `round ${i + 1} repeats the category`);
  assert.equal(game.plan[FINAL].d, 'hard', 'the final is HARD');
  // replay a's money by hand
  let stack = START;
  for (let r = 0; r <= FINAL; r++) {
    const bet = Math.max(Math.round(stack / 2), Math.max(10, Math.round(stack * 0.1)));
    assert.equal(game.res[r].a.b, bet, `round ${r + 1} bet`);
    stack += bet * payout(game.plan[r].d, r);
  }
  const s = standings(game);
  assert.equal(s[0].uid, 'a');
  assert.equal(s[0].net, stack);
  assert.ok(ledger(game).b.loans === 0 || ledger(game).b.net < START);
  assert.deepEqual(game.order, finalOrder({ ...game, res: Object.fromEntries(Object.entries(game.res).filter(([k]) => Number(k) < FINAL)) }));
});

test('8 players, one offline, early ends when everyone locks in, loans, leaderboard reporting', () => {
  const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'];
  const { game } = playMatch(players, (u, r, q, L) => {
    const k = Number(u.slice(1));
    if (q) return { answer: (r + k) % 3 === 0 ? q.c : (q.c + 1) % 4 };
    return { bet: k === 8 ? 1e9 : Math.round(L.stack * (k / 10)) };     // p8 always goes all in
  }, { offline: ['p7'] });
  assert.equal(game.phase, 'final');
  const L = ledger(game);
  assert.ok(L.p7.played === ROUNDS + 1 && L.p7.right === 0, 'the offline player loses the minimum each round');
  assert.ok(Object.values(L).some(o => o.loanN > 0), 'somebody needed the house');
  for (const o of Object.values(L)) assert.equal(o.net, o.stack - o.loans);
  // the boards get wins, the best final total and the biggest single-round win
  const ex = extractMatch(game, {});
  const top = standings(game)[0];
  assert.ok(ex.rows[top.uid].win);
  assert.equal(ex.rows[top.uid].rec['stakes-chips'], Math.max(0, top.net) || undefined);
  const big = Object.entries(L).sort((a, b) => b[1].best - a[1].best)[0];
  if (big[1].best > 0) assert.equal(ex.rows[big[0]].rec['stakes-big'], big[1].best);
  assert.deepEqual(ex.rejected, []);
});

test('the bet phase ends early once everyone connected has locked; offline players are not waited for', () => {
  const now = 5_000;
  const g = { ...createGame({ matchId: 'e', participants: { a: true, b: true, c: true }, now }), phase: 'bet', phaseStartAt: now, phaseEndsAt: now + MS.bet };
  const online = { a: true, b: true, c: false };
  assert.equal(nextStep(g, { now: now + 1000, live: { lock: { a: { b: now + 100 } } }, online }), null);
  assert.equal(nextStep(g, { now: now + 1000, live: { lock: { a: { b: now + 100 }, b: { b: now + 900 } } }, online }), null, 'a short beat after the last lock');
  assert.equal(nextStep(g, { now: now + 1700, live: { lock: { a: { b: now + 100 }, b: { b: now + 900 } } }, online }).phase, 'q');
  assert.equal(nextStep(g, { now: now + MS.bet, live: { lock: {} }, online }).phase, 'q', 'the timer runs out');
});

test('a forged result (a bet bigger than the stack) is rejected by the boards', () => {
  const { game } = playMatch(['a', 'b'], (u, r, q, L) => (q ? { answer: q.c } : { bet: L.stack }));
  game.res[2].a = { ...game.res[2].a, d: 999_999 };
  const ex = extractMatch(game, {});
  assert.ok(ex.rejected.some(r => r.uid === 'a'), 'impossible money is refused');
  assert.equal(ex.rows.a.rec['stakes-chips'], undefined);
});

test('the question supply asks for what the rest of the match still needs', () => {
  const g = createGame({ matchId: 'need', participants: { a: true }, now: 0 });
  const need = d => g.dplan.filter(x => x === d).length;
  assert.equal(nextWant(g), need('hard') >= need('medium') ? 'hard' : 'medium', 'nothing yet: the difficulty the match needs most');
  apply(g, bankFor(g, 4));
  assert.equal(nextWant(g), null, 'stocked');
  assert.equal(unplayed(g).hard, 40);
  assert.ok(showMs(8, true) > showMs(8));
  assert.ok(pickQuestion(g, FINAL).d === 'hard');
});
