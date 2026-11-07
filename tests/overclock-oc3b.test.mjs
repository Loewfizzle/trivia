// OVERCLOCK PASS 3B (OC3B — docs/overclock.md): THE CARD + LIST CHALLENGES (Spellcheck, Higher or Lower, Timeline, Sort It) rebuilt in the
// OVERDRIVE look. NO RULES CHANGE: the scoring, the answer checks, the deal and the record the server reads are the old ones — this file pins
// what the new screens lean on (pure parts only, no DOM):
//   SPELLCHECK's letters — THE ANSWER underlines the letters people usually get wrong (spell.js#trickyLetters) + marks YOUR PICK's wrong
//     letters (wrongLetters): readable on the real bank (every row marks something, never the whole word).
//   HIGHER OR LOWER — the screen asks "is the hidden one HIGHER or LOWER" (ui/higherlower.js#hlRightDir): exactly one call is right for every
//     pair the deal can make (never equal), and it's the bigger value's side whatever the stat's winner ('max' / 'min').
//   THE SCREENS' OWN STEP TIMES — unchanged (the owner: "DO NOT CHANGE ANY TIMING"): read from the screens' source.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spellAlign, trickyLetters, wrongLetters, spellRuns } from '../js/games/overclock/spell.js';
import { hlPick, hlPair, HL_PAIRS, sortWindowMs, SORT_CARDS, challengeRng } from '../js/games/overclock/challenges.js';

const marked = (w, m) => [...w].filter((_, i) => m[i]).join('');
// (OC7: { id, right, wrong, hard, src } → the old [right, the common misspelling, wrong, wrong] row these checks read)
const SPELL = JSON.parse(readFileSync('data/oc/spellcheck.json', 'utf8')).words.map(r => [r.right, ...r.wrong]);
const HL = JSON.parse(readFileSync('data/oc/higherlower.json', 'utf8')).stats;   // (OC6: { id, stat, ask, unit, win, items })

test('SPELLCHECK: the tricky letters of the right spelling', () => {
  assert.equal(marked('accommodate', trickyLetters('accommodate', 'accomodate')), 'mm', 'a doubled letter reads as its pair');
  assert.equal(marked('achieve', trickyLetters('achieve', 'acheive')), 'ie', 'a swap: the two letters');
  assert.equal(marked('separate', trickyLetters('separate', 'seperate')), 'a', 'a substitution: the one letter');
  assert.equal(marked('argument', trickyLetters('argument', 'arguement')), 'u', 'an added letter in the misspelling: the letter before it');
  assert.equal(marked('acquire', trickyLetters('acquire', 'aquire')), 'c');
  assert.deepEqual(trickyLetters('cat', 'cat'), [false, false, false]);
});

test('SPELLCHECK: a wrong pick — its wrong letters + the missing ones', () => {
  const a = wrongLetters('accomodate', 'accommodate');
  assert.ok(a.bad.every(x => !x) && a.miss.filter(Boolean).length === 1 && a.miss[5], 'one m missing, marked where it goes');
  const b = wrongLetters('seperate', 'separate');
  assert.equal(marked('seperate', b.bad), 'e');
  assert.ok(b.miss.every(x => !x), 'a substitution marks only the wrong letter (no caret beside it)');
  const c = wrongLetters('arguement', 'argument');
  assert.equal(marked('arguement', c.bad), 'e');
  assert.deepEqual(spellRuns('seperate', b.bad, b.miss), [{ t: 'sep', mark: false }, { t: 'e', mark: true }, { t: 'rate', mark: false }]);
  assert.deepEqual(spellRuns('accomodate', a.bad, a.miss).map(r => (r.gap ? '^' : r.t)).join(''), 'accom^odate');
});

test('SPELLCHECK: every bank row reads — the answer marks some letters (never all), every wrong option marks something', () => {
  for (const row of SPELL) {
    const [word, common] = row;
    const t = trickyLetters(word, common);
    const n = t.filter(Boolean).length;
    assert.ok(n >= 1 && n < word.length, `${word} vs ${common}: ${marked(word, t)}`);
    for (const w of row.slice(1)) {
      const { bad, miss } = wrongLetters(w, word);
      assert.ok(bad.some(Boolean) || miss.some(Boolean), `${w} (for ${word}) marks nothing`);
      assert.equal(bad.length, w.length);
      assert.equal(miss.length, w.length + 1);
    }
    // the alignment is symmetric in what it keeps (the same longest common run both ways)
    const x = spellAlign(word, common), y = spellAlign(common, word);
    assert.equal(word.length - x.extra.filter(Boolean).length, common.length - y.extra.filter(Boolean).length);
  }
});

test('HIGHER OR LOWER: one right call for every pair the deal can make — the bigger value\'s side, whatever the winner', async () => {
  const { hlRightDir, statParts } = await import('../js/games/overclock/ui/higherlower.js');
  let n = 0;
  for (let s = 0; s < 300; s++) {
    const rand = challengeRng(`oc3b-${s}`, 0, 'higherlower');
    for (const t of hlPick(rand, HL)) {
      const P = hlPair(HL, t);
      assert.ok(P && P.a.v !== P.b.v, 'never equal — exactly one call is right');
      const win = HL[t[0]].win;
      // the winner (spec ans) is unchanged: B wins on a 'max' stat when it's bigger, on a 'min' stat when it's smaller
      assert.equal(P.ans === 1, win === 'max' ? P.b.v > P.a.v : P.b.v < P.a.v);
      assert.equal(hlRightDir(P), P.b.v > P.a.v ? 'up' : 'down');
      n++;
    }
  }
  assert.equal(n, 300 * HL_PAIRS);
  // (OC6 — US units on screen: the pools store metric — units.js)
  assert.deepEqual(statParts({ unit: 'm' }, { v: 828 }), ['2,717', 'ft']);
  assert.deepEqual(statParts({ unit: 'people' }, { v: 1.44e9 }), ['1.44', 'billion']);
  assert.deepEqual(statParts({ unit: 'year' }, { v: 1876 }), ['1876', '']);
  assert.deepEqual(statParts({ unit: 'year' }, { v: -2560, shown: 'c. 2560 BC' }), ['c. 2560 BC', '']);
  assert.deepEqual(statParts({ unit: 'km2' }, { v: 17100000 }), ['6.6', 'million sq mi']);
  assert.deepEqual(statParts({ unit: 'km' }, { v: 6650 }), ['4,132', 'mi']);
});

test('THE SCREENS\' OWN STEP TIMES are the old ones (the owner: no timing changes)', () => {
  const src = f => readFileSync(`js/games/overclock/ui/${f}.js`, 'utf8');
  assert.match(src('spellcheck'), /right \? 480 : 1100\)/, 'SPELLCHECK: 480 ms after a right word, 1100 after a wrong one');
  const hl = src('higherlower');
  assert.match(hl, /api\.step\(k, k \+ 1, 'miss', true, 1700\)/, 'HIGHER OR LOWER: a miss ends the run, 1700 ms to the done screen');
  assert.match(hl, /api\.step\(k, k, 'ok', k >= N, 1200\)/, 'HIGHER OR LOWER: 1200 ms after the last pair');
  assert.match(hl, /show\(\); \}, 1250\)/, 'HIGHER OR LOWER: the next pair after 1250 ms');
  assert.match(src('timeline'), /api\.progress\(right, 4, \{ o: picks\.join\(''\) \}, true, 2200\)/, 'TIMELINE: 2200 ms after LOCK IT IN');
  const so = src('sortit');
  assert.match(so, /setTimeout\(deal, 230\)/, 'SORT IT: the next card 230 ms after a sort');
  assert.match(so, /setTimeout\(deal, 300\)/, 'SORT IT: the first card 300 ms in');
  assert.match(so, /sortWindowMs\(i\)/, 'SORT IT: each card\'s window from sortWindowMs');
  assert.match(so, /api\.step\(sortOk\(loc\.right, loc\.wrong\), i, ok \? 'ok' : 'miss', i >= s\.cards\.length, 600\)/);
  assert.deepEqual(Array.from({ length: SORT_CARDS }, (_, i) => sortWindowMs(i)), [2600, 2473, 2345, 2218, 2091, 1964, 1836, 1709, 1582, 1455, 1327, 1200]);
});
