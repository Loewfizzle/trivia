// LAST SIGNAL: damage math, shields, eliminations, targeting, rankings, and
// whole-battle simulations including a host change mid-battle.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  multiplier, strikeDamage, burnDamage, resolveQuestion, resolveTarget, aliveUids, rankings, isOver, decay,
  QUESTION_MS, REVEAL_MS, INTRO_MS, MAX_QUESTIONS, START_SHIELDS,
} from '../js/games/signal/logic.js';
import { createGame, nextStep } from '../js/games/signal/director.js';
import { appendPatch, decodeQuestion, fallbackPatch } from '../js/trivia/bankdata.js';
import { setFallbackRows } from '../js/trivia/bank.js';

setFallbackRows(JSON.parse(readFileSync('data/trivia/fallback.json', 'utf8')).questions);

test('escalation multiplier steps every 5 questions', () => {
  assert.equal(multiplier(0), 1);
  assert.equal(multiplier(4), 1);
  assert.equal(multiplier(5), 1.25);
  assert.equal(multiplier(10), 1.5);
  assert.equal(multiplier(34), 2.5);
});

test('strike damage: 30 instant → 10 at the buzzer, scaled by multiplier', () => {
  assert.equal(strikeDamage(0), 30);
  assert.equal(strikeDamage(QUESTION_MS), 10);
  assert.equal(strikeDamage(QUESTION_MS / 2), 20);
  assert.equal(strikeDamage(-500), 30, 'clamped');
  assert.equal(strikeDamage(99999), 10, 'clamped');
  assert.equal(strikeDamage(0, 1.5), 45);
  assert.equal(strikeDamage(QUESTION_MS, 1.25), 13); // 12.5 rounds up
  assert.equal(burnDamage(1), 10);
  assert.equal(burnDamage(1.5), 15);
});

const base = (extra = {}) => ({
  id: 'signal', matchId: 'm', q: 0, qStartAt: 1000,
  participants: { a: true, b: true, c: true },
  hp: { a: 100, b: 100, c: 100 }, sh: { a: 2, b: 2, c: 2 },
  ...extra,
});

test('correct answer strikes the chosen target; wrong breaks a shield; no shields burns HP', () => {
  const game = base({ sh: { a: 2, b: 0, c: 1 } });
  const r = resolveQuestion(game, {
    correct: 2,
    answers: { a: { c: 2, at: 1000 }, b: { c: 0, at: 2000 } /* c silent */ },
    targets: { a: 'b' },
  });
  assert.equal(r.hp.b, 100 - 30 - 10, 'b hit for 30 and burned 10 (no shields)');
  assert.equal(r.hp.a, 100);
  assert.equal(r.sh.c, 0, 'silence costs a shield');
  assert.equal(r.hp.c, 100);
  assert.deepEqual(r.events.map(e => e.t).sort(), ['burn', 'hit', 'shield']);
  assert.deepEqual(r.eliminated, []);
});

test('multiple attackers stack on one victim; simultaneous eliminations', () => {
  const game = base({ hp: { a: 100, b: 25, c: 20 }, sh: { a: 0, b: 0, c: 0 } });
  const r = resolveQuestion(game, {
    correct: 1,
    answers: { a: { c: 1, at: 1000 }, b: { c: 1, at: 1000 }, c: { c: 3, at: 1000 } },
    targets: { a: 'c', b: 'c' },
  });
  // c takes 30 + 30 and burns 10 → dead; b untouched
  assert.equal(r.hp.c, 20 - 60 - 10);
  assert.deepEqual(r.eliminated, ['c']);
  // everyone wiped in the same question
  const g2 = base({ hp: { a: 10, b: 10, c: 10 }, sh: { a: 0, b: 0, c: 0 } });
  const r2 = resolveQuestion(g2, { correct: 0, answers: {}, targets: {} });
  assert.deepEqual(r2.eliminated.sort(), ['a', 'b', 'c']);
});

test('invalid/dead targets fall back to a deterministic living rival', () => {
  const game = base({ out: { c: 0 }, hp: { a: 100, b: 100, c: 0 } });
  assert.equal(resolveTarget(game, 'a', { a: 'c' }), 'b', 'dead target redirected');
  assert.equal(resolveTarget(game, 'a', { a: 'a' }), 'b', 'self-target redirected');
  const four = base({ participants: { a: true, b: true, c: true, d: true }, hp: { a: 1, b: 1, c: 1, d: 1 } });
  const t1 = resolveTarget(four, 'a', {});
  assert.equal(resolveTarget(four, 'a', {}), t1, 'deterministic');
  assert.notEqual(t1, 'a');
});

test('eliminated players are ignored; resolution is replay-safe', () => {
  const game = base({ out: { c: 1 }, hp: { a: 50, b: 50, c: -5 }, q: 3 });
  const inputs = { correct: 0, answers: { a: { c: 0, at: 1000 }, c: { c: 0, at: 1000 } }, targets: { a: 'b' } };
  const r1 = resolveQuestion(game, inputs);
  const r2 = resolveQuestion(game, inputs);
  assert.deepEqual(r1, r2);
  assert.equal(r1.hp.b, 50 - 30);
  assert.ok(!r1.events.some(e => e.a === 'c' || e.u === 'c'), 'dead players do nothing');
});

test('rankings: survivors by HP, then the fallen by how late they fell', () => {
  const game = base({
    participants: { a: true, b: true, c: true, d: true },
    hp: { a: 40, b: -10, c: -3, d: -20 }, sh: { a: 1, b: 0, c: 0, d: 0 },
    out: { b: 7, c: 7, d: 3 }, q: 7,
  });
  const r = rankings(game);
  assert.deepEqual(r.map(x => x.uid), ['a', 'c', 'b', 'd']);
  assert.deepEqual(r.map(x => x.rank), [1, 2, 3, 4]);
  assert.equal(r[1].hp, 0, 'display HP clamps at 0');
  assert.ok(isOver(game));
  assert.equal(decay(game), 1);
  assert.equal(decay(base()), 0);
});

test('35-question safety cap ends the match', () => {
  assert.ok(isOver(base({ q: MAX_QUESTIONS - 1 })));
  assert.ok(!isOver(base({ q: MAX_QUESTIONS - 2 })));
});

// ---------- battle simulation ----------
const CODE = 'SGNL';
function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}
function makeGame(uids, hp = 100, nQuestions = 40, now = 0) {
  const shell = { matchId: 'mx', trivia: { n: 0, seen: {} } };
  const items = Array.from({ length: nQuestions }, (_, i) => ({ q: `Question number ${i}?`, a: ['w', 'x', 'y', 'z'], c: i % 4, cat: 'general', d: 'medium' }));
  const { patch } = appendPatch(shell, CODE, items);
  const bank = {}; const seen = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k.startsWith('bank/')) bank[k.slice(5)] = v;
    if (k.startsWith('trivia/seen/')) seen[k.slice(12)] = true;
  }
  const participants = Object.fromEntries(uids.map(u => [u, true]));
  return createGame({ matchId: 'mx', settings: { hp, cats: [] }, participants, now, bank, trivia: { n: patch['trivia/n'], seen, cats: [] } });
}
const ctxFor = (game, now, answers, targets, online) => ({
  now, online, answers, targets,
  correctOf: q => { const it = decodeQuestion(game, CODE, q); return it ? it.c : null; },
  fallback: n => fallbackPatch(game, CODE, n),
});

test('full battle: runs to a single survivor with escalating damage', () => {
  const uids = ['p1', 'p2', 'p3', 'p4'];
  const online = Object.fromEntries(uids.map(u => [u, true]));
  let now = 0;
  const game = makeGame(uids, 75);
  assert.equal(game.sh.p1, START_SHIELDS);
  now += INTRO_MS;
  applyPatch(game, nextStep(game, ctxFor(game, now, {}, {}, online)));
  assert.equal(game.phase, 'question');
  let guard = 0;
  while (game.phase !== 'final' && guard++ < 200) {
    const q = game.q;
    const correct = decodeQuestion(game, CODE, q).c;
    // p1 always right & fast, p2 right slowly, p3 always wrong, p4 silent. Everyone targets p3, p3 targets p1.
    const answers = {};
    const alive = aliveUids(game);
    if (alive.includes('p1')) answers.p1 = { c: correct, at: game.qStartAt + 1000 };
    if (alive.includes('p2')) answers.p2 = { c: correct, at: game.qStartAt + 12000 };
    if (alive.includes('p3')) answers.p3 = { c: (correct + 1) % 4, at: game.qStartAt + 3000 };
    const targets = { p1: 'p3', p2: 'p4', p3: 'p1', p4: 'p1' };
    now = game.qStartAt + QUESTION_MS + 800;
    const step = nextStep(game, ctxFor(game, now, answers, targets, online));
    applyPatch(game, step);
    assert.equal(game.phase, 'reveal');
    assert.equal(game.log[q].c, correct);
    now += REVEAL_MS;
    applyPatch(game, nextStep(game, ctxFor(game, now, {}, targets, online)));
  }
  assert.equal(game.phase, 'final');
  const r = rankings(game);
  assert.equal(r[0].uid, 'p1', 'the fast, accurate player survives');
  assert.ok(aliveUids(game).length <= 1);
  assert.ok(game.q < MAX_QUESTIONS);
});

test('question closes early once every connected survivor has answered; offline players are not waited for', () => {
  const uids = ['a', 'b', 'c'];
  const game = makeGame(uids);
  let now = INTRO_MS;
  applyPatch(game, nextStep(game, ctxFor(game, now, {}, {}, {})));
  const correct = decodeQuestion(game, CODE, 0).c;
  const answers = { a: { c: correct, at: now + 2000 } };
  // b online and still thinking → wait
  assert.equal(nextStep(game, ctxFor(game, now + 3000, answers, {}, { a: true, b: true, c: false })), null);
  // b answers → resolve (c is offline, not waited for)
  answers.b = { c: 0, at: now + 3500 };
  const step = nextStep(game, ctxFor(game, now + 4000, answers, {}, { a: true, b: true, c: false }));
  assert.equal(step.phase, 'reveal');
  // nobody alive online → run the full clock
  const g2 = makeGame(uids);
  applyPatch(g2, nextStep(g2, ctxFor(g2, INTRO_MS, {}, {}, {})));
  assert.equal(nextStep(g2, ctxFor(g2, INTRO_MS + 1000, {}, {}, {})), null);
});

test('host migration mid-battle: a new host resumes from DB state and replaying a transition changes nothing', () => {
  const uids = ['host', 'p2', 'p3'];
  const online = { host: true, p2: true, p3: true };
  const game = makeGame(uids);
  let now = INTRO_MS;
  applyPatch(game, nextStep(game, ctxFor(game, now, {}, {}, online)));
  const correct = decodeQuestion(game, CODE, 0).c;
  const answers = { host: { c: correct, at: now + 1000 }, p2: { c: correct, at: now + 2000 }, p3: { c: correct, at: now + 3000 } };
  const targets = { host: 'p2', p2: 'p3', p3: 'host' };
  const snapshot = structuredClone(game);          // what the frozen old host last saw
  // host freezes; p2 takes over and resolves with host offline
  now += QUESTION_MS + 800;
  const stepNew = nextStep(game, ctxFor(game, now, answers, targets, { host: false, p2: true, p3: true }));
  applyPatch(game, stepNew);
  const after = structuredClone({ hp: game.hp, sh: game.sh, log: game.log });
  // stale replay from the old host's snapshot yields identical absolute values
  const stepOld = nextStep(snapshot, ctxFor(snapshot, now + 200, answers, targets, online));
  applyPatch(game, stepOld);
  assert.deepEqual({ hp: game.hp, sh: game.sh, log: game.log }, after);
  assert.equal(game.hp.p2, 100 - strikeDamage(1000)); // host struck p2 one second in
});

test('when the API bank runs dry the director waits briefly, then pulls from the fallback bank', () => {
  const game = makeGame(['a', 'b'], 100, 1);
  let now = INTRO_MS;
  applyPatch(game, nextStep(game, ctxFor(game, now, {}, {}, {})));
  now += QUESTION_MS + 800;
  applyPatch(game, nextStep(game, ctxFor(game, now, {}, {}, {})));
  assert.equal(game.phase, 'reveal');
  now = game.phaseEndsAt;
  assert.equal(nextStep(game, ctxFor(game, now, {}, {}, {})), null, 'waits for a top-up first');
  now += 2600;
  const step = nextStep(game, ctxFor(game, now, {}, {}, {}));
  assert.ok(step && step.phase === 'question' && step.q === 1);
  applyPatch(game, step);
  const q1 = decodeQuestion(game, CODE, 1);
  assert.ok(q1 && q1.a.length === 4 && q1.c >= 0, 'fallback question decodes');
});
