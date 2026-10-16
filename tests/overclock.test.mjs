// OVERCLOCK: seeded generation identical across clients, order/scoring rules,
// director flow, trivia fallback, and resuming mid-challenge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TYPES, generate, partsFor, unscrambleAccepts, memoryLength, STROOP_COLORS, reflexCredit, TF_FACTS } from '../js/games/overclock/challenges.js';
import { buildOrder, challengeScore, computeResults, standings, levelOf, CHALLENGE_MS, MODES, BRIEF_MS, READY_MS, STANDINGS_MS } from '../js/games/overclock/logic.js';
import { createGame, nextStep, triviaNeeded } from '../js/games/overclock/director.js';
import { setLists, answersFor, isValidGuess } from '../js/games/cipher/words.js';
import { appendPatch, decodeQuestion, fallbackPatch } from '../js/trivia/bankdata.js';
import { setFallbackRows } from '../js/trivia/bank.js';

for (const n of [5, 6, 7]) setLists(n, JSON.parse(readFileSync(`data/words/answers-${n}.json`, 'utf8')), JSON.parse(readFileSync(`data/words/valid-${n}.json`, 'utf8')));
setFallbackRows(JSON.parse(readFileSync('data/trivia/fallback.json', 'utf8')).questions);
const BANKS = {
  lexicon: JSON.parse(readFileSync('data/oc/lexicon.json', 'utf8')).sets,
  timeline: JSON.parse(readFileSync('data/oc/timeline.json', 'utf8')).sets,
  closest: JSON.parse(readFileSync('data/oc/closest.json', 'utf8')).questions,
};

test('every challenge type is identical for every client given the same seed (Math.random is never used)', () => {
  const trivia = [{ q: 'a?', a: ['1', '2', '3', '4'], c: 0 }, { q: 'b?', a: ['1', '2', '3', '4'], c: 1 }, { q: 'c?', a: ['1', '2', '3', '4'], c: 2 }];
  const realRandom = Math.random;
  try {
    for (const type of TYPES) {
      for (let ci = 0; ci < 24; ci++) {
        const args = { seed: 'room-seed-42', ci, level: ci / 23 };
        Math.random = () => 0.123;
        const clientA = JSON.stringify(generate(type, args, { answersFor, triviaItems: trivia, ...BANKS }));
        Math.random = () => 0.987;
        const clientB = JSON.stringify(generate(type, args, { answersFor, triviaItems: trivia, ...BANKS }));
        assert.equal(clientA, clientB, `${type} #${ci}`);
        assert.notEqual(clientA, 'null', `${type} generated`);
      }
    }
  } finally { Math.random = realRandom; }
  // different seeds differ
  assert.notEqual(JSON.stringify(generate('math', { seed: 'x', ci: 0, level: 0 })), JSON.stringify(generate('math', { seed: 'y', ci: 0, level: 0 })));
});

test('generated challenges are well-formed', () => {
  for (let ci = 0; ci < 60; ci++) {
    const level = (ci % 12) / 11;
    const args = { seed: `s${ci}`, ci, level };
    const u = generate('unscramble', args, { answersFor });
    assert.equal(u.letters.length, u.word.length);
    assert.equal([...u.letters].sort().join(''), [...u.word].sort().join(''));
    assert.notEqual(u.letters.join(''), u.word, 'actually scrambled');
    const m = generate('memory', args);
    assert.equal(m.seq.length, memoryLength(level));
    assert.ok(m.seq.every((v, i) => v >= 0 && v <= 8 && v !== m.seq[i - 1]));
    const o = generate('oddone', args);
    o.grids.forEach(g => { assert.notEqual(g.base, g.odd); assert.ok(g.idx < g.size * g.size); });
    const q = generate('math', args);
    q.problems.forEach(p => assert.ok(Number.isInteger(p.ans) && p.ans > 0, p.text));
    const p = generate('pattern', args);
    p.seqs.forEach(s => assert.ok(Number.isInteger(s.ans) && s.shown.length === 5));
    for (const t of TYPES) if (t !== 'trivia') assert.equal(generate(t, args, { answersFor, ...BANKS }).parts, partsFor(t, level));
  }
  assert.equal(generate('trivia', { seed: 's', ci: 0, level: 0 }, { triviaItems: [null, null, null] }), null, 'waits for questions');
  assert.equal(generate('unscramble', { seed: 's', ci: 0, level: 0 }, { answersFor: () => null }), null, 'waits for word lists');
});

test('unscramble accepts the word or another valid anagram, nothing else', () => {
  assert.ok(unscrambleAccepts('stale', 'stale', isValidGuess));
  assert.ok(unscrambleAccepts('least', 'stale', isValidGuess));
  assert.ok(!unscrambleAccepts('steal', 'stall', isValidGuess), 'different letters');
  assert.ok(!unscrambleAccepts('aelst', 'stale', isValidGuess), 'not a word');
});

test('order: no repeats — all different types up to 14; Marathon at most twice each, never back to back, spread out', () => {
  assert.equal(TYPES.length, 14);
  for (const total of [3, 6, 12, 14]) {
    for (let s = 0; s < 300; s++) {
      const o = buildOrder(`seed${s}:${total}`, total);
      assert.equal(o.length, total);
      assert.equal(new Set(o).size, total, `all different (${total})`);
      assert.ok(o.every(t => TYPES.includes(t)));
      assert.deepEqual(buildOrder(`seed${s}:${total}`, total), o, 'deterministic');
    }
  }
  const seenFirst = new Set();
  for (let s = 0; s < 500; s++) {
    const o = buildOrder(`marathon${s}`, MODES.marathon);
    assert.equal(o.length, 24);
    seenFirst.add(o[0]);
    const count = {};
    o.forEach(t => { count[t] = (count[t] || 0) + 1; });
    assert.ok(Object.values(count).every(n => n <= 2), 'at most twice');
    assert.equal(Object.keys(count).length, 14, 'every type shows up in a Marathon');
    for (let i = 1; i < o.length; i++) assert.notEqual(o[i], o[i - 1], 'never back to back');
    for (const t of Object.keys(count)) {
      const at = o.map((x, k) => (x === t ? k : -1)).filter(k => k >= 0);
      if (at.length === 2) assert.ok(at[1] - at[0] >= 8, `${t} spread out (${at})`);
    }
    assert.ok(count.trivia <= 2, 'trivia is just another type now');
  }
  assert.ok(seenFirst.size >= 12, 'the opener varies');
  // standard: 12 different types of 14, trivia at most once
  for (let s = 0; s < 300; s++) assert.ok(buildOrder(`std${s}`, MODES.standard).filter(t => t === 'trivia').length <= 1);
});

test('scoring: partial credit, speed bonus only when perfect, final doubles', () => {
  assert.equal(challengeScore({ parts: 4, ok: 4, doneAt: 0, startAt: 0 }), 160);
  assert.equal(challengeScore({ parts: 4, ok: 4, doneAt: CHALLENGE_MS, startAt: 0 }), 100);
  assert.equal(challengeScore({ parts: 4, ok: 4, doneAt: 15000, startAt: 0 }), 130);
  assert.equal(challengeScore({ parts: 4, ok: 3, doneAt: 1000, startAt: 0 }), 75);
  assert.equal(challengeScore({ parts: 4, ok: 0 }), 0);
  assert.equal(challengeScore({ parts: 3, ok: 3, doneAt: 0, startAt: 0, final: true }), 320);
  assert.equal(challengeScore({ parts: 3, ok: 3, startAt: 0 }), 100, 'not marked done → no speed bonus');
});

// ---------- director simulation ----------
const CODE = 'OVCK';
function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}
function bankOf(n) {
  const items = Array.from({ length: n }, (_, i) => ({ q: `Lightning question ${i}?`, a: ['a', 'b', 'c', 'd'], c: i % 4, cat: 'general', d: 'hard' }));
  const { patch } = appendPatch({ matchId: 'mo', trivia: { n: 0, seen: {} } }, CODE, items);
  const bank = {}; const seen = {};
  for (const [k, v] of Object.entries(patch)) {
    if (k.startsWith('bank/')) bank[k.slice(5)] = v;
    if (k.startsWith('trivia/seen/')) seen[k.slice(12)] = true;
  }
  return { bank, trivia: { n: patch['trivia/n'], seen, cats: [] } };
}
const ctx = (game, now, boards, online) => ({ now, boards, online, fallback: n => fallbackPatch(game, CODE, n) });

test('full standard gauntlet: rules card on first appearance, standings between, final doubles, back to lobby', () => {
  const { bank, trivia } = bankOf(12);
  const participants = { a: true, b: true };
  let now = 0;
  const game = createGame({ matchId: 'mo', settings: { mode: 'standard' }, participants, now, seed: 'sim-seed', bank, trivia });
  assert.equal(game.total, 12);
  assert.equal(triviaNeeded(game), game.order.filter(t => t === 'trivia').length * 3);
  assert.ok(triviaNeeded(game) <= 3, 'Trivia Lightning at most once in Standard');
  const briefs = [];
  for (let ci = 0; ci < game.total; ci++) {
    assert.equal(game.phase, 'ready');
    briefs.push(game.brief);
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, ctx(game, now, {}, {})));
    assert.equal(game.phase, 'play');
    const type = game.order[ci];
    const parts = partsFor(type, levelOf(ci, game.total));
    if (type === 'trivia') {
      const start = game.tq[ci];
      for (let i = 0; i < 3; i++) assert.ok(decodeQuestion(game, CODE, start + i), 'lightning questions present');
    }
    // a: perfect & fast. b: half right, done late.
    const boards = {
      a: { p: parts, ok: parts, n: parts, done: true, doneAt: now + 5000 },
      b: { p: parts, ok: Math.floor(parts / 2), n: parts, done: true, doneAt: now + 25000 },
    };
    applyPatch(game, nextStep(game, ctx(game, now + 6000, boards, { a: true, b: true })));
    const r = game.results[ci];
    assert.ok(r.a.pts > r.b.pts);
    if (ci === game.total - 1) {
      assert.equal(game.phase, 'final');
      assert.ok(r.a.pts > 160, 'final challenge doubled');
    } else {
      assert.equal(game.phase, 'standings');
      now = game.phaseEndsAt;
      applyPatch(game, nextStep(game, ctx(game, now, {}, {})));
    }
  }
  // brief shows exactly once per type
  const seenTypes = new Set();
  game.order.forEach((t, i) => { assert.equal(briefs[i], !seenTypes.has(t), `brief at ${i}`); seenTypes.add(t); });
  assert.equal(standings(game)[0].uid, 'a');
  now = game.phaseEndsAt;
  assert.deepEqual(nextStep(game, ctx(game, now, {}, {})), { lobby: true });
});

test('challenge ends early when every connected player is done; times out otherwise', () => {
  const { bank, trivia } = bankOf(12);
  const game = createGame({ matchId: 'mo', settings: { mode: 'standard' }, participants: { a: true, b: true, c: true }, now: 0, seed: 's2', bank, trivia });
  applyPatch(game, nextStep(game, ctx(game, BRIEF_MS, {}, {})));
  const t0 = game.playStartAt;
  const boards = { a: { p: 1, ok: 1, n: 1, done: true, doneAt: t0 + 1000 } };
  assert.equal(nextStep(game, ctx(game, t0 + 2000, boards, { a: true, b: true, c: false })), null, 'b still working');
  boards.b = { p: 1, ok: 0, n: 1, done: true, doneAt: t0 + 3000 };
  const step = nextStep(game, ctx(game, t0 + 3500, boards, { a: true, b: true, c: false }));
  assert.equal(step.phase, 'standings', 'c is offline, not waited for');
  assert.equal(step[`results/0`].c.pts, 0);
});

test('rejoin mid-challenge: stored progress is all that matters for scoring', () => {
  const { bank, trivia } = bankOf(12);
  const game = createGame({ matchId: 'mo', settings: { mode: 'standard' }, participants: { a: true }, now: 0, seed: 's3', bank, trivia });
  // force a 4-part math challenge
  game.order[0] = 'math';
  applyPatch(game, nextStep(game, ctx(game, BRIEF_MS, {}, {})));
  const t0 = game.playStartAt;
  // a solved 2 of 4, refreshed, regenerates the identical challenge, resumes at part 2 and finishes
  const before = generate('math', { seed: game.seed, ci: 0, level: 0 });
  const after = generate('math', { seed: game.seed, ci: 0, level: 0 });
  assert.deepEqual(after, before);
  const boards = { a: { p: 4, ok: 4, n: 4, done: true, doneAt: t0 + 12000 } };
  const step = nextStep(game, ctx(game, t0 + 12500, boards, { a: true }));
  assert.equal(step['results/0'].a.ok, 4);
  assert.ok(step['results/0'].a.pts > 100);
});

test('a lightning round with an empty bank waits, then uses the fallback bank', () => {
  const game = createGame({ matchId: 'mo', settings: { mode: 'standard' }, participants: { a: true }, now: 0, seed: 's4', bank: {}, trivia: { n: 0, seen: {}, cats: [] } });
  game.order[0] = 'trivia';
  game.tq = { 0: 0 };
  game.tUsed = 3;
  assert.equal(nextStep(game, ctx(game, BRIEF_MS, {}, {})), null);
  const step = nextStep(game, ctx(game, BRIEF_MS + 2600, {}, {}));
  assert.equal(step.phase, 'play');
  applyPatch(game, step);
  for (let i = 0; i < 3; i++) assert.ok(decodeQuestion(game, CODE, i));
});

test('standings → ready assigns lightning question indices and timing', () => {
  const { bank, trivia } = bankOf(30);
  const game = createGame({ matchId: 'mo', settings: { mode: 'marathon' }, participants: { a: true }, now: 0, seed: 's5', bank, trivia });
  let now = 0;
  const starts = [];
  for (let ci = 0; ci < game.total - 1; ci++) {
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, ctx(game, now, {}, {})));
    applyPatch(game, nextStep(game, ctx(game, now + CHALLENGE_MS + 800, {}, { a: false })));
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, ctx(game, now, {}, {})));
    assert.equal(game.phase, 'ready');
    assert.equal(game.phaseEndsAt - now, game.brief ? BRIEF_MS : READY_MS);
    if (game.order[game.ci] === 'trivia') starts.push(game.tq[game.ci]);
  }
  const all = (game.order[0] === 'trivia' ? [0] : []).concat(starts);
  assert.deepEqual(all, all.map((_, i) => i * 3), 'consecutive, non-overlapping question blocks');
  assert.ok(STANDINGS_MS > 0);
});

test('new challenges: color clash, signal lock, quick count, true or false are well-formed', () => {
  for (let ci = 0; ci < 60; ci++) {
    const level = (ci % 12) / 11;
    const args = { seed: `n${ci}`, ci, level };
    const st = generate('stroop', args);
    assert.equal(st.items.length, 8);
    for (const it of st.items) {
      assert.ok(STROOP_COLORS[it.ink] && STROOP_COLORS[it.word]);
      assert.equal(it.order.length, 4);
      assert.ok(it.order.includes(it.ink) && it.order.includes(it.word), 'the answer is always a button');
    }
    assert.ok(st.items.filter(it => it.word !== it.ink).length >= 4, 'mostly mismatched');
    const rx = generate('reflex', args);
    assert.equal(rx.delays.length, 5);
    assert.ok(rx.delays.every(d => d >= 1100 && d <= 2600));
    const qc = generate('count', args);
    for (const it of qc.items) {
      assert.equal(it.cells.length, it.size * it.size);
      assert.equal(it.cells.filter(c => c === it.target).length, it.ans, 'the grid really has ans targets');
      assert.equal(it.options.length, 4);
      assert.ok(it.options.includes(it.ans) && new Set(it.options).size === 4 && it.options.every(v => v > 0));
    }
    const tf = generate('truefalse', args);
    assert.equal(tf.items.length, 8);
    for (const it of tf.items.filter((_, i) => i % 2 === 0)) {
      // math statements: evaluate them and check the label
      const m = it.text.replace(/×/g, '*').replace(/÷/g, '/').replace(/(\d+)²/g, '($1**2)').replace(/(\d+)% of (\d+)/, '($1*$2/100)').replace(/ = /, ' === ');
      assert.equal(Function(`return (${m})`)(), it.truth, it.text);
    }
  }
  assert.ok(TF_FACTS.every(([t, f]) => t && f && t !== f));
});

test('signal lock: reaction-time credit and scoring on the same 160-point scale', () => {
  assert.equal(reflexCredit(200), 1);
  assert.equal(reflexCredit(230), 1);
  assert.ok(reflexCredit(400) < 1 && reflexCredit(400) > reflexCredit(600));
  assert.equal(reflexCredit(5000), 0.1, 'a slow tap still beats a miss');
  assert.equal(reflexCredit(NaN), 0);
  assert.equal(challengeScore({ type: 'reflex', parts: 5, ok: 5, final: false }), 160);
  assert.equal(challengeScore({ type: 'reflex', parts: 5, ok: 2.5, final: true }), 160);
  // fractional credit (quick count halves) flows through the normal scoring
  const game = { order: ['count'], ci: 0, total: 1, participants: { a: true }, playStartAt: 0 };
  assert.equal(computeResults(game, { a: { ok: 3.5, p: 4, done: true, doneAt: 30_000 } }).a.pts, Math.round(100 * 3.5 / 4) * 2);
});
