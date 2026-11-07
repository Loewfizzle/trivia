// OVERCLOCK pass 7 (OC7 — docs/overclock.md "OC7"): QUESTIONS B — OVERCLOCK's OWN trivia bank, CLOSEST CALL, MISSING LINK, SPELLCHECK.
// GROUP 0 — THE SHAPES + THE IDS (tests first): the four files' shapes, every item dealt + remembered BY ID, TRIVIA LIGHTNING off the live
// Trivia API (OVERCLOCK only — the shared js/trivia/ feed stays exactly as it was for HIGH STAKES, LAST SIGNAL, BLUFF …), the daily's day set
// by ids. (Every content rule — sources, dictionaries, lengths, duplicates — is tests/overclock-content.test.mjs.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { generate, closestAnswer, mlJoined, TRIVIA_CATS, TRIVIA_LEVELS, ML_SIDES, linkAccepts } from '../js/games/overclock/challenges.js';
import { dealMatch, keysAt, tvPick, DEALT } from '../js/games/overclock/deal.js';
import { BANK_TYPES, BANK_FILES } from '../js/games/overclock/banks.js';
import { createGame, nextStep } from '../js/games/overclock/director.js';
import { daySetProblems, create as dCreate } from '../js/games/overclock/daily.js';
import { BRIEF_MS, MODES, buildOrder } from '../js/games/overclock/logic.js';
import { rngFrom } from '../js/core/rng.js';
import { BANKS } from './fixtures/oc-banks.mjs';

const J = p => JSON.parse(readFileSync(p, 'utf8'));
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const OC7 = { trivia: 'items', closest: 'questions', missinglink: 'puzzles', spellcheck: 'words' };

// ---------------------------------------------------------------------------------------------- THE SHAPES
test('THE SHAPES: trivia { id, cat, d, q, a, w×3, src } · closest { id, cat, q, value, unit, src } · missinglink { id, clues: [[WORD, side, sep]×3], answer, accept, src } · spellcheck { id, right, wrong×3, hard, src }', () => {
  for (const [type, key] of Object.entries(OC7)) {
    assert.deepEqual(BANK_FILES[type], { file: `${type}.json`, key }, `banks.js loads ${type} from its key`);
    for (const dir of ['data/oc', 'api/_data/oc-reserve']) {
      const rows = J(`${dir}/${type}.json`)[key];
      assert.ok(Array.isArray(rows) && rows.length, `${dir}/${type}.json`);
      const ids = new Set();
      for (const r of rows) {
        assert.match(String(r.id), ID, `${type} id ${r.id}`);
        assert.ok(!ids.has(r.id), `${type} id twice: ${r.id}`);
        ids.add(r.id);
        assert.equal(typeof r.src, 'string', `${type} ${r.id} src`);
        if (type === 'trivia') {
          assert.deepEqual(Object.keys(r), ['id', 'cat', 'd', 'q', 'a', 'w', 'src']);
          assert.ok(TRIVIA_CATS[r.cat], r.cat); assert.ok(TRIVIA_LEVELS.includes(r.d), r.d);
          assert.equal(r.w.length, 3); assert.ok(![...r.w].includes(r.a));
        } else if (type === 'closest') {
          assert.deepEqual(Object.keys(r), ['id', 'cat', 'q', 'value', 'unit', 'src']);
          assert.ok(typeof r.value === 'number' && r.value > 0);
        } else if (type === 'missinglink') {
          assert.deepEqual(Object.keys(r), ['id', 'clues', 'answer', 'accept', 'src']);
          assert.equal(r.clues.length, 3);
          for (const [w, side, sep] of r.clues) { assert.match(w, /^[A-Z]+$/); assert.ok(ML_SIDES.includes(side), `${r.id} side`); assert.ok(sep === '' || sep === ' '); }
        } else {
          assert.deepEqual(Object.keys(r), ['id', 'right', 'wrong', 'hard', 'src']);
          assert.equal(r.wrong.length, 3);
          assert.ok(r.hard.length && r.hard.every(i => Number.isInteger(i) && i >= 0 && i < r.right.length));
        }
      }
    }
  }
});

test('THE SPECS the screens read: trivia → { q, a: [4], c, cat, d } · closest in the US unit the question names · missinglink with each clue\'s side · spellcheck with `hard`', () => {
  const tv = generate('trivia', { seed: 's', ci: 0, level: 0 }, { trivia: BANKS.trivia });
  assert.equal(tv.questions.length, 3);
  for (const q of tv.questions) {
    const row = BANKS.trivia.find(r => r.id === q.id);
    assert.equal(q.q, row.q); assert.equal(q.a[q.c], row.a);
    assert.deepEqual(q.a.slice().sort(), [row.a, ...row.w].sort());
  }
  // CLOSEST CALL: metric in the data, the US unit on the pad
  assert.deepEqual(closestAnswer('m', 8848.86), { answer: 29032, unit: 'ft' });
  assert.deepEqual(closestAnswer('km', 6650), { answer: 4132, unit: 'mi' });
  assert.deepEqual(closestAnswer('km2', 17098246), { answer: 6601670, unit: 'sq mi' });
  assert.deepEqual(closestAnswer('kmh', 110), { answer: 68, unit: 'mph' });
  assert.deepEqual(closestAnswer('bones', 206), { answer: 206, unit: 'bones' });
  assert.deepEqual(closestAnswer('m', 2.43), { answer: 8, unit: 'ft' });
  assert.deepEqual(closestAnswer('km', 4.2), { answer: 2.6, unit: 'mi' });
  const cc = generate('closest', { seed: 's', ci: 0, level: 0 }, { closest: BANKS.closest });
  const row = BANKS.closest.find(r => r.id === cc.id);
  assert.deepEqual({ answer: cc.answer, unit: cc.unit }, closestAnswer(row.unit, row.value));
  // MISSING LINK: words[i] + joins[i] = the clue + its side (shuffled together)
  const ml = generate('missinglink', { seed: 's', ci: 0, level: 0 }, { missinglink: BANKS.missinglink });
  for (const pz of ml.puzzles) {
    const r = BANKS.missinglink.find(x => x.id === pz.id);
    assert.equal(pz.words.length, 3); assert.equal(pz.joins.length, 3);
    pz.words.forEach((w, i) => { const c = r.clues.find(x => x[0] === w); assert.deepEqual([pz.joins[i].side, pz.joins[i].sep], [c[1], c[2]]); });
    assert.ok(linkAccepts(r.answer, pz));
  }
  assert.equal(mlJoined('SUN', 'FLOWER', 'after', ''), 'SUNFLOWER');
  assert.equal(mlJoined('WORK', 'FIRE', 'before', ''), 'FIREWORK');
  assert.equal(mlJoined('ICE', 'CREAM', 'after', ' '), 'ICE CREAM');
  // SPELLCHECK: the right one, the common misspelling, its hard letters
  const sp = generate('spellcheck', { seed: 's', ci: 0, level: 0 }, { spellcheck: BANKS.spellcheck });
  for (const it of sp.items) {
    const r = BANKS.spellcheck.find(x => x.id === it.id);
    assert.equal(it.options[it.ans], r.right); assert.equal(it.word, r.right); assert.equal(it.common, r.wrong[0]); assert.deepEqual(it.hard, r.hard);
  }
});

// ---------------------------------------------------------------------------------------------- THE IDS
test('THE DEAL by ID: trivia [3] · closest [1] · missinglink [2] · spellcheck [5] — the keys tv- / cc- / ml- / sp- + the id; every phone builds the same from it', () => {
  for (const t of ['trivia', 'closest', 'missinglink', 'spellcheck']) assert.ok(DEALT.includes(t), `${t} is remembered`);
  const order = ['trivia', 'closest', 'missinglink', 'spellcheck'];
  const { deal, dk } = dealMatch({ seed: 'oc7', order, total: 4, banks: BANKS });
  const want = { trivia: [3, 'tv'], closest: [1, 'cc'], missinglink: [2, 'ml'], spellcheck: [5, 'sp'] };
  order.forEach((t, ci) => {
    const [n, pre] = want[t];
    assert.equal(deal[ci].length, n, t);
    assert.ok(deal[ci].every(id => typeof id === 'string' && BANKS[t].some(r => r.id === id)), `${t} deals ids`);
    assert.deepEqual(dk[ci].split(' '), deal[ci].map(id => `${pre}-${id}`));
    const spec = generate(t, { seed: 'oc7', ci, level: ci / 3, deal: deal[ci] }, BANKS);
    const got = t === 'trivia' ? spec.questions.map(q => q.id) : t === 'closest' ? [spec.id] : t === 'missinglink' ? spec.puzzles.map(p => p.id) : spec.items.map(i => i.id);
    assert.deepEqual(got, deal[ci], `${t} builds what was dealt`);
  });
  const g = createGame({ matchId: 'm', settings: { mode: 'quick' }, participants: { a: true }, now: 0, seed: 'oc7', order: [...order, 'math', 'memory'], deal, dk });
  assert.deepEqual(keysAt(g, 0), ['t-trivia', ...deal[0].map(id => `tv-${id}`)]);
});

test('TRIVIA LIGHTNING\'s three: an easy one, a medium one, then medium or hard (~40/40/20) — three categories — fresh tonight; a used-up bank reshuffles', () => {
  const bank = BANKS.trivia;
  const levels = { easy: 0, medium: 0, hard: 0 };
  let distinctCats = 0;
  for (let s = 0; s < 300; s++) {
    const idx = tvPick(rngFrom(`tv${s}`), bank, () => false);
    assert.equal(new Set(idx).size, 3);
    idx.forEach(i => { levels[bank[i].d]++; });
    if (new Set(idx.map(i => bank[i].cat)).size === 3) distinctCats++;
  }
  const has = d => bank.some(r => r.d === d);
  if (has('easy') && has('hard')) assert.ok(levels.easy > 0 && levels.hard > 0, JSON.stringify(levels));
  assert.ok(distinctCats >= 270, `${distinctCats} of 300 deals with three categories`);
  // fresh tonight: what the room saw is never dealt while fresh ones are left
  const used = new Set(bank.slice(0, bank.length - 5).map(r => r.id));
  const fresh = tvPick(rngFrom('fresh'), bank, i => used.has(bank[i].id));
  assert.ok(fresh.every(i => !used.has(bank[i].id)), 'the five fresh ones first');
  // a bank the night used up still deals three (never stalls)
  assert.equal(tvPick(rngFrom('all'), bank, () => true).length, 3);
});

// ---------------------------------------------------------------------------------------------- NO LIVE TRIVIA SERVICE (OVERCLOCK ONLY)
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : []; });
test('NO LIVE TRIVIA SERVICE IN OVERCLOCK: nothing in js/games/overclock/ imports js/trivia/ (the feed, the APIs, the bundled bank); start() deals the bank; prepare() tops nothing up', () => {
  for (const f of walk('js/games/overclock')) {
    const src = readFileSync(f, 'utf8');
    assert.doesNotMatch(src, /^\s*import[^\n]*['"][./]*\/?trivia\//m, `${f} imports the shared trivia feed`);
    assert.doesNotMatch(src, /the-trivia-api|opentdb\.com|fetchTriviaApi|fetchOtdb|initialBank|topUp\(|fallbackPatch|decodeQuestion/, `${f} touches the live trivia service`);
  }
  const idx = readFileSync('js/games/overclock/index.js', 'utf8');
  assert.match(idx, /export function prepare\(\) \{\}/);
  assert.ok(BANK_TYPES.includes('trivia'));
  // the director never waits for questions: a lightning round opens on time
  const g = createGame({ matchId: 'm', settings: { mode: 'quick' }, participants: { a: true }, now: 0, seed: 's', order: ['trivia', 'math', 'memory', 'oddone', 'count', 'stroop'] });
  assert.equal(nextStep(g, { now: BRIEF_MS, boards: {}, online: {} }).phase, 'play');
  // every match deals its lightning round from the bank: 50 Standard nights, every trivia slot dealt by id
  for (let s = 0; s < 50; s++) {
    const order = buildOrder(`tvn${s}`, MODES.standard);
    const { deal } = dealMatch({ seed: `tvn${s}`, order, total: MODES.standard, banks: BANKS });
    order.forEach((t, ci) => { if (t === 'trivia') assert.equal(deal[ci].length, 3); });
  }
});

// THE SHARED FEED — byte for byte what it was before OC7 (HIGH STAKES, LAST SIGNAL, BLUFF … keep The Trivia API → Open Trivia DB → the bundled
// bank). A later pass that changes the shared feed ON PURPOSE updates these hashes (and runs those games' E2Es).
const SHARED = {
  'js/trivia/bank.js': '45f810b67c419c9b', 'js/trivia/bankdata.js': 'c23ea8940fc87801', 'js/trivia/categories.js': '8587d40074895e6e',
  'js/trivia/feed.js': 'f943c4b73e2a1ee7', 'js/trivia/sources.js': 'c34221ce38dbdc6f', 'data/trivia/fallback.json': '159ded25345307bf',
};
test('THE OTHER GAMES KEEP THEIR FEEDS: js/trivia/ + data/trivia/fallback.json unchanged; HIGH STAKES, LAST SIGNAL + BLUFF still import them; the feed still asks The Trivia API then Open Trivia DB', () => {
  for (const [f, h] of Object.entries(SHARED)) assert.equal(createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 16), h, `${f} changed`);
  const uses = (f, re) => assert.match(readFileSync(f, 'utf8'), re, f);
  uses('js/games/stakes/feed.js', /trivia\/(feed|sources|bank)/);
  uses('js/games/signal/index.js', /trivia\/feed\.js/);
  uses('js/games/bluff/bank.js', /trivia\//);
  const feed = readFileSync('js/trivia/feed.js', 'utf8');
  assert.match(feed, /fetchTriviaApi\(/); assert.match(feed, /fetchOtdb\(/); assert.match(feed, /pickFallback\(/);
});

// ---------------------------------------------------------------------------------------------- THE DAILY BY IDS
test('THE DAILY: TRIVIA LIGHTNING\'s three are ids in the day set\'s deal (own bank or reserve) — never question texts; create() puts no question bank in the match', () => {
  const reserve = J('api/_data/oc-reserve/trivia.json').items;
  const ds = { v: 1, day: '2026-11-07', seed: 'opaque-module-seed-oc7', order: ['unscramble', 'math', 'memory', 'oddone', 'trivia', 'stroop'], deal: { 4: reserve.slice(0, 3).map(r => r.id) } };
  assert.deepEqual(daySetProblems(ds), []);
  assert.match(daySetProblems({ ...ds, deal: {} }).join(), /three question ids/);
  assert.match(daySetProblems({ ...ds, trivia: [{ q: 'x?', a: ['a', 'b', 'c', 'd'], c: 0 }], deal: {} }).join(), /three question ids/);
  const g = dCreate({ date: ds.day, uid: 'me', now: 0, daySet: ds });
  assert.deepEqual(g.deal[4], ds.deal[4]);
  assert.equal(g.bank, undefined);
  const spec = generate('trivia', { seed: g.seed, ci: 4, level: 0.8, deal: g.deal[4] }, { trivia: reserve });
  assert.deepEqual(spec.questions.map(q => q.q), reserve.slice(0, 3).map(r => r.q));
});

test('THE PRELOAD carries no pool: every bank (OC6 four + OC7 four) loads only for a match that deals it', async () => {
  const src = readFileSync('js/games/overclock/index.js', 'utf8');
  assert.match(src, /OC_LAZY_POOLS = Object\.freeze\(\[\.\.\.BANK_TYPES\]\)/);
  const m = await import('../js/games/overclock/banks.js');
  assert.deepEqual(m.BANK_TYPES.slice().sort(), ['closest', 'higherlower', 'missinglink', 'sortit', 'spellcheck', 'timeline', 'trivia', 'truefalse']);
});
