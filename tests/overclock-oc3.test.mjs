// OVERCLOCK PASS 3 (OC3 — docs/overclock.md): THE TYPING CHALLENGES' RULES. The only rules change: PATTERN LOCK's FIRST sequence in a match
// is always an EASY one (a plain +n / −n step, small numbers) — deterministic from the seed, everything else the old generator's exactly
// (the second sequence, a later Pattern Lock in a longer match, every other challenge). Each sequence carries its RULE in one short line
// (`say` — THE ANSWER + the demo show it). The kit pads' pure reducers for the five (the "−" key, the "." key, the letter keyboard).
import test from 'node:test';
import assert from 'node:assert/strict';
import { generate, partsFor, challengeRng, genPattern, patternSay, linkAccepts, normWord } from '../js/games/overclock/challenges.js';
import { createGame, nextStep } from '../js/games/overclock/director.js';
import { levelOf, buildOrder, MODES, CHALLENGE_MS } from '../js/games/overclock/logic.js';
import { numpadReduce, numpadNumber } from '../js/games/kit/numpad.js';
import { keyboardReduce } from '../js/games/kit/keyboard.js';
import { randInt, pick, shuffle } from '../js/core/rng.js';

// ---------------------------------------------------------------------------------------------- the OLD generator, frozen (pre-OC3)
const OLD_RULES = {
  arith: (r, d) => { const a = randInt(r, 3, 40); const k = randInt(r, 3, 12 + Math.round(10 * d)); return i => a + k * i; },
  geo: r => { const a = randInt(r, 2, 6); const k = pick(r, [2, 3]); return i => a * k ** i; },
  incDiff: r => { const a = randInt(r, 1, 20); const k = randInt(r, 1, 4); return i => a + k * i + (i * (i - 1)) / 2; },
  squares: r => { const o = randInt(r, -3, 10); const s = randInt(r, 1, 6); return i => (s + i) ** 2 + o; },
  fib: r => { const a = randInt(r, 1, 5); const b = randInt(r, a + 1, a + 6); const memo = [a, b]; return i => { while (memo.length <= i) memo.push(memo[memo.length - 1] + memo[memo.length - 2]); return memo[i]; }; },
  alt: r => { const a = randInt(r, 10, 40); const p = randInt(r, 5, 12); const m = randInt(r, 2, 6); return i => a + Math.ceil(i / 2) * p - Math.floor(i / 2) * m; },
  doublePlus: r => { const a = randInt(r, 1, 6); const c = randInt(r, 1, 4); return i => { let t = a; for (let j = 0; j < i; j++) t = 2 * t + c; return t; }; },
};
const OLD_EASY = ['arith', 'geo', 'alt', 'incDiff'];
function oldPattern(rand, level) {
  const pool = level < 0.3 ? OLD_EASY : Object.keys(OLD_RULES);
  const rules = shuffle(rand, pool).slice(0, 2);
  return rules.map(name => { const f = OLD_RULES[name](rand, level); return { rule: name, shown: [0, 1, 2, 3, 4].map(f), ans: f(5) }; });
}
const SEEDS = Array.from({ length: 400 }, (_, i) => `oc3-seed-${i}`);
const strip = s => ({ rule: s.rule, shown: s.shown, ans: s.ans });

test('PATTERN LOCK: the match\'s FIRST sequence is a plain +n / −n step with small numbers, at every level and position', () => {
  let minus = 0;
  for (const seed of SEEDS) {
    for (const ci of [0, 2, 5, 11]) {
      const level = levelOf(ci, 12);
      const p = generate('pattern', { seed, ci, level, occ: 0 });
      const s = p.seqs[0];
      assert.equal(s.rule, 'easy');
      const d = s.shown[1] - s.shown[0];
      assert.ok(d !== 0 && Math.abs(d) <= 9, `a small step (${d})`);
      [...s.shown, s.ans].forEach((v, i, all) => { if (i) assert.equal(v - all[i - 1], d, 'one plain step every time'); });
      assert.ok([...s.shown, s.ans].every(v => Number.isInteger(v) && v >= 1 && v <= 99), `small numbers: ${s.shown} → ${s.ans}`);
      assert.equal(s.say, `${d > 0 ? '+' : '−'}${Math.abs(d)} each time`);
      if (d < 0) minus++;
    }
  }
  assert.ok(minus > 100 && minus < 1300, `both directions turn up (${minus} downward of 1600)`);
});

test('PATTERN LOCK: deterministic from the seed — every phone builds the same easy opener', () => {
  for (const seed of SEEDS.slice(0, 50)) {
    const a = generate('pattern', { seed, ci: 3, level: 0.6, occ: 0 }), b = generate('pattern', { seed, ci: 3, level: 0.6, occ: 0 });
    assert.deepEqual(a, b);
  }
  const all = new Set(SEEDS.map(seed => JSON.stringify(generate('pattern', { seed, ci: 1, level: 0.2, occ: 0 }).seqs[0].shown)));
  assert.ok(all.size > 120, `the openers vary (${all.size} different of 400)`);
});

test('PATTERN LOCK: the rest of the difficulty curve is UNCHANGED — the 2nd sequence, a later Pattern Lock, the old rules', () => {
  for (const seed of SEEDS) {
    for (const [ci, total] of [[0, 6], [3, 6], [5, 6], [7, 12], [20, 24]]) {
      const level = levelOf(ci, total);
      const old = oldPattern(challengeRng(seed, ci, 'pattern'), level);
      const first = generate('pattern', { seed, ci, level, occ: 0 });
      assert.deepEqual(strip(first.seqs[1]), old[1], 'the second sequence = the old second');
      for (const occ of [1, 2]) {
        const later = generate('pattern', { seed, ci, level, occ });
        assert.deepEqual(later.seqs.map(strip), old, 'a later Pattern Lock = the old one, both sequences');
      }
    }
  }
  // the old generator's own export, called without the match's position, is the old one too (a direct caller keeps its numbers)
  for (const seed of SEEDS.slice(0, 40)) assert.deepEqual(genPattern(challengeRng(seed, 2, 'pattern'), 0.5).seqs.map(strip), oldPattern(challengeRng(seed, 2, 'pattern'), 0.5));
  assert.equal(partsFor('pattern', 0.5), 2, 'still two sequences');
});

test('PATTERN LOCK: every sequence carries its RULE in one short line (THE ANSWER + the demo)', () => {
  const seen = new Set();
  for (const seed of SEEDS) {
    for (const occ of [0, 1]) {
      const p = generate('pattern', { seed, ci: 8, level: 0.9, occ });
      for (const s of p.seqs) {
        assert.equal(typeof s.say, 'string');
        assert.ok(s.say.length >= 4 && s.say.length <= 30, `short: "${s.say}"`);
        seen.add(s.rule);
        if (s.rule === 'arith') assert.equal(s.say, `+${s.shown[1] - s.shown[0]} each time`);
        if (s.rule === 'geo') assert.equal(s.say, `×${s.shown[1] / s.shown[0]} each time`);
        if (s.rule === 'fib') assert.equal(s.say, 'add the two before');
      }
    }
  }
  for (const r of ['easy', 'arith', 'geo', 'incDiff', 'squares', 'fib', 'alt', 'doublePlus']) assert.ok(seen.has(r), `${r} turns up`);
  assert.equal(patternSay('squares', { s: 3, o: 0 }), 'square numbers: 3², 4², 5²…');
  assert.equal(patternSay('squares', { s: 2, o: -3 }), 'square numbers − 3');
  assert.equal(patternSay('alt', { p: 7, m: 3 }), '+7, −3, +7, −3…');
});

function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}
test('a WHOLE simulated match with two PATTERN LOCKs (2 + 8 players): only the first opens easy; the director scores + ends it as before; a replayed step = the same patch', () => {
  const order = ['pattern', 'math', 'pattern', 'oddone', 'closest', 'truefalse'];
  for (const n of [2, 8]) {
    const uids = Array.from({ length: n }, (_, i) => `p${i}`);
    let now = 1_000_000;
    const game = createGame({ matchId: 'oc3', settings: { mode: 'quick' }, participants: Object.fromEntries(uids.map(u => [u, true])), now, seed: `oc3-sim-${n}`, bank: {}, trivia: { n: 99 }, order });
    assert.equal(game.total, MODES.quick);
    const online = Object.fromEntries(uids.map(u => [u, true]));
    const specs = {};
    while (game.phase !== 'final') {
      now = game.phaseEndsAt;
      applyPatch(game, nextStep(game, { now, boards: {}, online, fallback: () => null }));
      assert.equal(game.phase, 'play');
      const type = game.order[game.ci];
      const occ = game.order.slice(0, game.ci).filter(t => t === type).length;
      if (type === 'pattern') specs[game.ci] = generate('pattern', { seed: game.seed, ci: game.ci, level: levelOf(game.ci, game.total), occ });
      const parts = partsFor(type, levelOf(game.ci, game.total));
      const boards = Object.fromEntries(uids.map((u, i) => [u, { p: parts, ok: Math.max(0, parts - (i % 3)), n: parts, done: true, doneAt: game.playStartAt + 6000 + i * 700 }]));
      now = game.playStartAt + CHALLENGE_MS + 1000;
      const ctx = { now, boards, online, marks: {}, fallback: () => null };
      const patch = nextStep(game, ctx);
      assert.deepEqual(nextStep(structuredClone(game), { ...structuredClone({ ...ctx, fallback: null }), fallback: () => null }), patch, 'a new host replaying the close writes the same patch');
      applyPatch(game, patch);
      if (game.phase === 'standings') { now = game.phaseEndsAt; applyPatch(game, nextStep(game, { now, boards: {}, online, fallback: () => null })); }
    }
    assert.equal(specs[0].seqs[0].rule, 'easy', 'the first Pattern Lock opens easy');
    assert.notEqual(specs[2].seqs[0].rule, 'easy', 'only the match\'s FIRST Pattern Lock opens easy');
    assert.equal(Object.keys(game.results).length, 6, 'six results — the record the server reads');
    assert.ok(uids.every(u => typeof game.results[0][u].pts === 'number'));
    assert.equal(game.settings.mode, 'quick');
  }
  assert.ok(typeof buildOrder === 'function');
});

// ---------------------------------------------------------------------------------------------- the kit pads (the five's input)
test('THE NUMBER PAD: QUICK MATH\'s "−", CLOSEST CALL\'s ".", PATTERN LOCK — the values the screens check', () => {
  const type = (keys, o) => keys.reduce((v, k) => numpadReduce(v, k, o), '');
  assert.equal(numpadNumber(type(['−', '1', '2'], { extra: '−' })), -12);
  assert.equal(numpadNumber(type(['1', '2', '−'], { extra: '−' })), -12, 'the − toggles the sign whenever it is pressed');
  assert.equal(numpadNumber(type(['3', '.', '5'], { extra: '.' })), 3.5);
  assert.equal(type(['.', '5'], { extra: '.' }), '0.5');
  assert.ok(Number.isNaN(numpadNumber(type(['4', '.'], { extra: '.' }))), 'a trailing dot is not an answer yet');
  assert.equal(type(['0', '7'], { extra: null }), '7', 'no leading zeros');
  assert.equal(type(['9', '9', '9'], { maxLen: 2 }), '99');
});

test('THE LETTER KEYBOARD: MISSING LINK\'s typing + the auto-accept stays', () => {
  const type = s => [...s].reduce((v, k) => keyboardReduce(v, k, 12), '');
  assert.equal(type('CHEESE'), 'CHEESE');
  assert.equal(keyboardReduce('CHEE', '⌫'), 'CHE');
  assert.equal(keyboardReduce('ABC', '1'), 'ABC', 'letters only');
  const pz = { words: ['COTTAGE', 'SWISS', 'CAKE'], answer: 'CHEESE', alt: [] };
  assert.ok(linkAccepts(type('CHEESE'), pz));
  assert.equal(normWord('che ese!'), 'CHEESE');
});
