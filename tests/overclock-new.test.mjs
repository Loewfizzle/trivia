// OVERCLOCK's four newer challenges — LEXICON, TIMELINE, CLOSEST CALL, REWIRE — and their banks:
// seeded identical puzzles, always-possible letter sets, always-solvable circuits, scoring math, bank sanity.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  generate, LEXICON_PARTS, lexiconOk, timelineCorrect, closestCredit, rewirePower, rewireOk, rotMask, REWIRE_SHAPES, bankIndex, partsFor,
} from '../js/games/overclock/challenges.js';
import { challengeScore, computeResults, buildOrder, standingsMs, REVEAL_STANDINGS_MS, STANDINGS_MS } from '../js/games/overclock/logic.js';

const LEX = JSON.parse(readFileSync('data/oc/lexicon.json', 'utf8')).sets;
const TL = JSON.parse(readFileSync('data/oc/timeline.json', 'utf8')).sets;
const CC = JSON.parse(readFileSync('data/oc/closest.json', 'utf8')).questions;
const deps = { lexicon: LEX, timeline: TL, closest: CC };
const counts = w => [...w].reduce((m, ch) => ((m[ch] = (m[ch] || 0) + 1), m), {});
const formable = (word, letters) => { const have = counts(letters); return Object.entries(counts(word)).every(([ch, n]) => (have[ch] || 0) >= n); };

test('LEXICON: every letter set has a 7+ word; its words really fit the 9 tiles; scoring by length', () => {
  assert.ok(LEX.length >= 200);
  for (const [letters, max, best, all] of LEX) {
    assert.equal(letters.length, 9);
    assert.ok(max >= 7 && max <= 8, `${letters}: longest ${max}`);
    const words = all.split(' ');
    assert.ok(words.length >= 35);
    for (const w of best.split(' ')) { assert.equal(w.length, max); assert.ok(words.includes(w)); }
    assert.ok(words.every(w => w.length >= 3 && w.length <= max && formable(w, letters)), letters);
    assert.equal(Math.max(...words.map(w => w.length)), max);
  }
  assert.equal(lexiconOk(7, 7), LEXICON_PARTS);
  assert.equal(lexiconOk(6, 7), 5);
  assert.equal(lexiconOk(3, 8), 1);
  assert.equal(lexiconOk(2, 8), 0);
  // speed bonus only for the longest possible word (= ok reaches parts)
  assert.equal(challengeScore({ parts: 6, ok: 6, doneAt: 15000, startAt: 0 }), 130);
  assert.equal(challengeScore({ parts: 6, ok: 5, doneAt: 1000, startAt: 0 }), 83);
});

test('TIMELINE: 150+ fair sets; never shown pre-sorted; partial credit per position', () => {
  assert.ok(TL.length >= 150, `${TL.length} sets`);
  for (const [title, ask, dir, items] of TL) {
    assert.ok(title && ask && /→/.test(dir));
    assert.equal(items.length, 4);
    assert.equal(new Set(items.map(i => i[0])).size, 4);
    assert.ok(items.every(([label, shown]) => label && shown));
  }
  for (let ci = 0; ci < 200; ci++) {
    const t = generate('timeline', { seed: `t${ci}`, ci, level: 0.5 }, deps);
    assert.notDeepEqual(t.shown, [0, 1, 2, 3], 'never already in order');
    const perfect = [0, 1, 2, 3].map(pos => t.shown.indexOf(pos));
    assert.equal(timelineCorrect(t, perfect), 4);
  }
  const t = { shown: [2, 0, 3, 1] };
  assert.equal(timelineCorrect(t, [1, 3, 0, 2]), 4);
  assert.equal(timelineCorrect(t, [3, 1, 0, 2]), 2);
  assert.equal(challengeScore({ parts: 4, ok: 3, doneAt: 1000, startAt: 0 }), 75, 'no speed bonus unless perfect');
});

test('CLOSEST CALL: 150+ clean questions; smooth relative-error curve; the closest guess takes the bonus', () => {
  assert.ok(CC.length >= 150, `${CC.length} questions`);
  const seen = new Set();
  for (const [cat, q, answer, unit] of CC) {
    assert.ok(cat && unit && q.endsWith('?'), q);
    assert.ok(typeof answer === 'number' && answer > 0, q);
    assert.ok(!seen.has(q), `duplicate: ${q}`);
    seen.add(q);
  }
  assert.equal(closestCredit(100, 100), 1);
  assert.equal(closestCredit(104, 100), 1, 'within 5% is perfect');
  assert.ok(closestCredit(120, 100) > closestCredit(140, 100));
  assert.ok(closestCredit(80, 100) > 0.6 && closestCredit(80, 100) < 1);
  assert.equal(closestCredit(161, 100), 0, '60%+ off scores nothing');
  assert.equal(closestCredit(NaN, 100), 0);
  // the closest player(s) get the 60 bonus, nobody else gets a time bonus
  const game = { order: ['closest', 'closest'], ci: 0, total: 2, participants: { a: true, b: true, c: true }, playStartAt: 0 };
  const res = computeResults(game, { a: { ok: 0.9, p: 1, done: true, doneAt: 1000 }, b: { ok: 1, p: 1, done: true, doneAt: 29000 }, c: { ok: 0, p: 1, done: true, doneAt: 500 } });
  assert.equal(res.b.pts, 160);
  assert.equal(res.a.pts, 90);
  assert.equal(res.c.pts, 0);
  const tie = computeResults({ ...game, ci: 1 }, { a: { ok: 0.5 }, b: { ok: 0.5 }, c: {} });
  assert.equal(tie.a.pts, (50 + 60) * 2, 'ties share it; the final challenge doubles');
  assert.equal(tie.c.pts, 0);
});

test('REWIRE: every circuit is solvable and starts unsolved; power flow, partial credit, rotation', () => {
  for (let i = 0; i < 1500; i++) {
    const r = generate('rewire', { seed: `r${i}`, ci: i % 12, level: 0.5 });
    assert.equal(r.puzzles.length, 2);
    assert.deepEqual(r.puzzles.map(p => p.n), [3, 4]);
    for (const pz of r.puzzles) {
      assert.ok(rewirePower(pz, pz.solution).solved, 'solvable');
      assert.ok(!rewirePower(pz, pz.start).solved, 'scrambled');
    }
  }
  assert.equal(rotMask(REWIRE_SHAPES.I, 1), 2 | 8, 'a straight piece turned once runs east–west');
  assert.equal(rotMask(REWIRE_SHAPES.L, 4), REWIRE_SHAPES.L);
  assert.equal(rewireOk(0, 0.5), 0.3);
  assert.equal(rewireOk(1, 0.5), 1.3);
  assert.equal(rewireOk(2, 0), 2);
  assert.equal(challengeScore({ parts: 2, ok: 2, doneAt: 15000, startAt: 0 }), 130, 'speed bonus for solving both');
  assert.equal(challengeScore({ parts: 2, ok: 1.3, doneAt: 1000, startAt: 0 }), 65);
});

test('identical for every phone; bank entries never repeat inside a match; reveals hold the leaderboard longer', () => {
  for (const type of ['lexicon', 'timeline', 'closest', 'rewire']) {
    for (let ci = 0; ci < 24; ci++) {
      const a = JSON.stringify(generate(type, { seed: 'same', ci, level: ci / 23 }, deps));
      const b = JSON.stringify(generate(type, { seed: 'same', ci, level: ci / 23 }, deps));
      assert.equal(a, b);
      assert.equal(JSON.parse(a).parts, partsFor(type, ci / 23));
    }
  }
  for (let s = 0; s < 200; s++) {
    for (const [type, size] of [['lexicon', LEX.length], ['timeline', TL.length], ['closest', CC.length]]) {
      assert.notEqual(bankIndex(`m${s}`, type, 0, size), bankIndex(`m${s}`, type, 1, size), 'a second appearance gets a new entry');
    }
  }
  assert.equal(generate('lexicon', { seed: 's', ci: 0, level: 0 }, {}), null, 'waits for its bank');
  assert.equal(standingsMs('closest'), REVEAL_STANDINGS_MS);
  assert.equal(standingsMs('math'), STANDINGS_MS);
  // a 12-challenge match deals 12 different types
  assert.equal(new Set(buildOrder('x', 12)).size, 12);
});
