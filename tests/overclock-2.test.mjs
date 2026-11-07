// OVERCLOCK update 2 — MISSING LINK, SPELLCHECK, COMPASS, SORT IT, HIGHER OR LOWER (MAKE 24 was cut in OC2):
// bank sanity, seeded identical puzzles, scoring math, the category-spread order,
// and 8-player director runs (rejoin mid-challenge, a new host replaying a transition).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  TYPES, CATEGORY, generate, partsFor, linkAccepts, normWord, compassFace, COMPASS_LENGTHS, COMPASS_SCRIPT_MS,
  SORT_CARDS, SORT_FULL, sortOk, sortWindowMs, HL_PAIRS, hlFair, bankIndex,
} from '../js/games/overclock/challenges.js';
import { buildOrder, categoryClashes, challengeScore, computeResults, standings, MODES, CHALLENGE_MS, standingsMs, REVEAL_STANDINGS_MS } from '../js/games/overclock/logic.js';
import { createGame, nextStep } from '../js/games/overclock/director.js';

const read = f => JSON.parse(readFileSync(f, 'utf8'));
const ML = read('data/oc/missinglink.json').puzzles;
const SP = read('data/oc/spellcheck.json').words;
const ST = read('data/oc/sortit.json').sets;
const HL = read('data/oc/higherlower.json').stats;
const deps = { missinglink: ML, spellcheck: SP, sortit: ST, higherlower: HL };
const NEW = ['missinglink', 'spellcheck', 'compass', 'sortit', 'higherlower'];

// ---------- banks ----------
test('MISSING LINK bank: 200+ puzzles, one answer each, answers unique and never one of the clues', () => {
  assert.ok(ML.length >= 200, `${ML.length} puzzles`);
  const answers = new Set();
  for (const row of ML) {
    assert.equal(row.length, 5, JSON.stringify(row));
    const [a, b, c, ans, alt] = row;
    for (const w of [a, b, c]) assert.match(w, /^[A-Z][A-Z'-]*$/, `clue ${w}`);
    assert.match(ans, /^[A-Z]{2,10}$/, ans);
    assert.equal(typeof alt, 'string');
    assert.equal(new Set([a, b, c]).size, 3, `repeated clue: ${row}`);
    assert.ok(![a, b, c].includes(ans), `answer is a clue: ${row}`);
    assert.ok(!answers.has(ans), `answer used twice: ${ans}`);
    answers.add(ans);
  }
});

test('MISSING LINK: case, spaces and plurals are accepted; near misses are not', () => {
  const pz = { answer: 'CHEESE', alt: [] };
  for (const g of ['cheese', 'CHEESE', ' Cheese ', 'cheeses']) assert.ok(linkAccepts(g, pz), g);
  for (const g of ['chees', 'cheesy', 'cake', '', 'cheesecake']) assert.ok(!linkAccepts(g, pz), g);
  assert.ok(linkAccepts('berries', { answer: 'BERRY', alt: [] }), 'y → ies');
  assert.ok(linkAccepts('boxes', { answer: 'BOX', alt: [] }));
  assert.ok(linkAccepts('grey', { answer: 'GRAY', alt: ['GREY'] }), 'listed variant');
  assert.equal(normWord("crow's-nest"), 'CROWSNEST');
});

test('SPELLCHECK bank: 200+ words, four different lowercase spellings, the correct one first', () => {
  assert.ok(SP.length >= 200, `${SP.length} words`);
  const seen = new Set();
  // words that have two accepted spellings must never be in this bank (as the answer or as a "wrong" option)
  const TWO_WAYS = ['judgment', 'judgement', 'theater', 'theatre', 'gray', 'grey', 'canceled', 'cancelled', 'traveled', 'travelled', 'catalog',
    'catalogue', 'fulfill', 'fulfil', 'acknowledgment', 'acknowledgement', 'barbecue', 'barbeque', 'supersede', 'supercede', 'minuscule', 'miniscule',
    'liquefy', 'liquify', 'memento', 'momento', 'jewelry', 'jewellery', 'aging', 'ageing', 'likable', 'likeable', 'calender', 'florescent', 'publically'];
  for (const row of SP) {
    assert.equal(row.length, 4, JSON.stringify(row));
    assert.equal(new Set(row).size, 4, `repeated option: ${row}`);
    for (const w of row) assert.match(w, /^[a-z]+$/, w);
    for (const w of row) assert.ok(!TWO_WAYS.includes(w), `two accepted spellings: ${w}`);
    assert.ok(!seen.has(row[0]), `duplicate word ${row[0]}`);
    seen.add(row[0]);
  }
});

test('COMPASS: 3 → 7 turns, the right final heading, and a script that leaves time to answer', () => {
  assert.deepEqual(COMPASS_LENGTHS, [3, 4, 5, 6, 7]);
  assert.equal(compassFace(0, 'R'), 1);
  assert.equal(compassFace(0, 'L'), 3);
  assert.equal(compassFace(1, 'A'), 3);
  assert.equal(compassFace(3, 'RRRR'), 3);
  assert.equal(compassFace(2, 'LAR'), 0);
  for (let s = 0; s < 300; s++) {
    const g = generate('compass', { seed: `c${s}`, ci: 3, level: 0.5 });
    assert.deepEqual(g.rounds.map(r => r.turns.length), COMPASS_LENGTHS);
    for (const r of g.rounds) {
      assert.match(r.turns, /^[LRA]+$/);
      assert.ok(!/AA/.test(r.turns), 'no double about-turn');
      assert.equal(r.ans, compassFace(r.start, r.turns));
    }
  }
  assert.ok(COMPASS_SCRIPT_MS <= 24_000, `script ${COMPASS_SCRIPT_MS} ms leaves ≥ 6 s for five answers`);
  // speed bonus counts only the answering time
  const t = COMPASS_SCRIPT_MS;
  assert.equal(challengeScore({ type: 'compass', parts: 5, ok: 5, startAt: 0, doneAt: t }), 160);
  assert.equal(challengeScore({ type: 'compass', parts: 5, ok: 5, startAt: 0, doneAt: CHALLENGE_MS }), 100);
  assert.equal(challengeScore({ type: 'compass', parts: 5, ok: 4, startAt: 0, doneAt: t }), 80, '20 a round, no bonus unless perfect');
});

// (OC6: the computed sets' rules live in ONE place — scripts/oc-pools/sortcheck.mjs — the build makes the sets from them, the tests re-compute)
import { SORT_CHECKS as CHECK } from '../scripts/oc-pools/sortcheck.mjs';
import { existsSync } from 'node:fs';
const ST_ALL = [...ST, ...(existsSync('api/_data/oc-reserve/sortit.json') ? read('api/_data/oc-reserve/sortit.json').sets : [])];

test('SORT IT bank (OC6: 150+ sets, party + reserve): 25+ items each, nothing on both sides; the number/word pairs are recomputed', () => {
  assert.ok(ST.length >= 100, `${ST.length} party sets`);
  for (const { id, left: l, right: r, L, R } of ST) {
    assert.ok(id && l && r && l !== r);
    assert.ok(L.length + R.length >= 25, `${l}: ${L.length + R.length} items`);
    assert.ok(L.length >= 7 && R.length >= 7, `${l}: each side needs 7+ (a challenge deals up to 7)`);
    const all = [...L, ...R].map(x => x.toLowerCase());
    assert.equal(new Set(all).size, all.length, `${l}: an item is listed twice or on both sides`);
    for (const x of [...L, ...R]) assert.ok(x.length >= 1 && x.length <= 32, `${l}: "${x}" fits a card`);
    if (CHECK[l]) {
      for (const x of L) assert.ok(CHECK[l](x), `${l}: ${x}`);
      for (const x of R) assert.ok(!CHECK[l](x), `${r}: ${x}`);
    }
  }
  // OC1–OC5's six computed pairs are all still there (party or the daily reserve)
  for (const k of ['PRIME', 'MULTIPLE OF 7', 'MORE THAN 50', 'MORE THAN ½', 'PALINDROME', 'LETTERS IN A–Z ORDER']) assert.ok(ST_ALL.some(s => s.left === k), k);
});

test('SORT IT: 12 cards from both sides, faster and faster; wrong sorts cost half; 10 net = 100; perfect = speed bonus', () => {
  for (let s = 0; s < 300; s++) {
    const g = generate('sortit', { seed: `s${s}`, ci: s % 12, level: 0.5 }, deps);
    assert.equal(g.cards.length, SORT_CARDS);
    const set = ST.find(x => x.left === g.left && x.right === g.right);
    const sides = g.cards.map(c => c.s);
    assert.ok(sides.filter(x => x === 0).length >= 5 && sides.filter(x => x === 1).length >= 5);
    for (const c of g.cards) assert.ok((c.s ? set.R : set.L).includes(c.t), `${c.t} is really on side ${c.s}`);
    assert.equal(new Set(g.cards.map(c => c.t)).size, SORT_CARDS);
  }
  for (let i = 1; i < SORT_CARDS; i++) assert.ok(sortWindowMs(i) < sortWindowMs(i - 1), 'speeds up');
  assert.equal(sortWindowMs(0), 2600);
  assert.equal(sortWindowMs(SORT_CARDS - 1), 1200);
  assert.equal(sortOk(10, 2), 9);
  assert.equal(sortOk(1, 5), 0, 'never below zero');
  const sc = (ok, doneAt) => challengeScore({ type: 'sortit', parts: SORT_CARDS, ok, startAt: 0, doneAt });
  assert.equal(SORT_FULL, 10);
  assert.equal(sc(sortOk(SORT_CARDS, 0), 15_000), 130, 'all 12 right: 100 + speed');
  assert.equal(sc(sortOk(11, 1), 15_000), 100, 'a strong run reaches 100, no bonus with a mistake');
  assert.equal(sc(sortOk(9, 3), 15_000), 75);
  assert.equal(sc(sortOk(5, 0), 15_000), 50);
});

test('HIGHER OR LOWER bank: 300+ items, stable values, grouped by stat', () => {
  const items = HL.reduce((n, s) => n + s.items.length, 0);
  assert.ok(items >= 300, `${items} items`);
  for (const { stat, ask, unit, win, items: list, gap } of HL) {
    assert.ok(stat && ask.endsWith('?') && typeof unit === 'string', stat);
    assert.ok(win === 'max' || win === 'min', stat);
    assert.ok(list.length >= 8, `${stat}: ${list.length} items`);
    assert.equal(new Set(list.map(x => x[0])).size, list.length, `${stat}: duplicate item`);
    for (const [name, v, shown] of list) {
      assert.ok(name && typeof v === 'number' && Number.isFinite(v), `${stat}: ${name}`);
      if (unit === 'year') assert.ok(Number.isInteger(v), `${name}: whole years`);
      else if (unit !== 'c') assert.ok(v > 0, `${name}: positive`);   // (°C may be below zero — OC6's temperatures)
      if (shown != null) assert.equal(typeof shown, 'string');
    }
    // every item can be dealt (has at least one fair partner)
    for (const [name, v] of list) assert.ok(list.some(([n2, w]) => n2 !== name && hlFair(unit, v, w, gap)), `${stat}: ${name} has no fair partner`);
  }
});

test('HIGHER OR LOWER: ten fair pairs, no item twice in a run, the winner follows the question', () => {
  for (let s = 0; s < 400; s++) {
    const g = generate('higherlower', { seed: `h${s}`, ci: s % 12, level: 0.5 }, deps);
    assert.equal(g.pairs.length, HL_PAIRS);
    const used = new Set();
    for (const p of g.pairs) {
      assert.ok(p, 'pair dealt');
      assert.ok(hlFair(p.unit, p.a.v, p.b.v), `${p.a.name} vs ${p.b.name}`);
      const stat = HL.find(x => x.stat === p.stat && x.ask === p.ask);
      const winner = stat.win === 'max' ? (p.a.v > p.b.v ? 0 : 1) : (p.a.v < p.b.v ? 0 : 1);
      assert.equal(p.ans, winner);
      for (const n of [p.a.name, p.b.name]) { assert.ok(!used.has(`${p.stat}:${n}`), `repeat ${n}`); used.add(`${p.stat}:${n}`); }
    }
  }
  assert.equal(hlFair('m', 100, 119), false);
  assert.equal(hlFair('m', 100, 120), true);
  assert.equal(hlFair('year', 1900, 1909), false);
  assert.equal(hlFair('year', 1900, 1910), true);
});

// ---------- every phone builds the same challenge ----------
test('the six new challenges are identical on every phone (Math.random is never used) and wait for their banks', () => {
  const real = Math.random;
  try {
    for (const type of NEW) {
      for (let ci = 0; ci < 24; ci++) {
        const args = { seed: 'room-seed-7', ci, level: ci / 23, occ: ci % 2 };
        Math.random = () => 0.11;
        const a = JSON.stringify(generate(type, args, deps));
        Math.random = () => 0.93;
        const b = JSON.stringify(generate(type, args, deps));
        assert.equal(a, b, `${type} #${ci}`);
        assert.equal(JSON.parse(a).parts, partsFor(type, ci / 23));
      }
    }
  } finally { Math.random = real; }
  for (const type of NEW.filter(t => t !== 'compass')) assert.equal(generate(type, { seed: 's', ci: 0, level: 0 }, {}), null, `${type} waits for its bank`);
  for (const t of NEW) assert.ok(partsFor(t, 0.5) <= 12, `${t}: the rules allow at most 12 parts`);
  // a type that comes twice in a Marathon deals new entries
  for (let s = 0; s < 100; s++) {
    const a = generate('missinglink', { seed: `x${s}`, ci: 2, level: 0, occ: 0 }, deps).puzzles.map(p => p.answer);
    const b = generate('missinglink', { seed: `x${s}`, ci: 14, level: 0, occ: 1 }, deps).puzzles.map(p => p.answer);
    assert.equal(new Set([...a, ...b]).size, 4);
    assert.notEqual(bankIndex(`x${s}`, 'sortit', 0, ST.length), bankIndex(`x${s}`, 'sortit', 1, ST.length));
  }
  for (const t of NEW) assert.equal(standingsMs(t), REVEAL_STANDINGS_MS, `${t} has a reveal`);
});

// ---------- the order ----------
test('order over many matches: no repeats, Marathon ≤ 2 and spread, categories never back to back', () => {
  assert.equal(TYPES.length, 19, '18 skill challenges + DUMB LUCK (OC5)');
  const cats = new Set(Object.values(CATEGORY));
  assert.deepEqual([...cats].sort(), ['knowledge', 'luck', 'memory', 'numbers', 'reflex', 'visual', 'words']);
  for (const t of TYPES) assert.ok(CATEGORY[t], `${t} has a category`);
  const firsts = new Set();
  for (let s = 0; s < 1500; s++) {
    for (const total of [3, 6, MODES.standard, 18, MODES.marathon]) {
      const o = buildOrder(`m${s}`, total);
      assert.equal(o.length, total);
      assert.deepEqual(buildOrder(`m${s}`, total), o, 'seeded');
      assert.equal(categoryClashes(o), 0, `${total}: ${o.join(' ')}`);
      const count = {};
      o.forEach(t => { count[t] = (count[t] || 0) + 1; });
      assert.ok((count.dumbluck || 0) <= 1 && o[total - 1] !== 'dumbluck', 'DUMB LUCK: at most once, never last');
      if (total <= 19) assert.equal(new Set(o).size, total, 'all different');
      else {
        assert.equal(Object.keys(count).length, 19, 'every type in a Marathon');
        assert.ok(Object.values(count).every(n => n <= 2));
        for (const t of Object.keys(count)) {
          const at = o.map((x, k) => (x === t ? k : -1)).filter(k => k >= 0);
          if (at.length === 2) assert.ok(at[1] - at[0] >= 8, `${t} at ${at}`);
        }
      }
    }
    firsts.add(buildOrder(`m${s}`, 12)[0]);
  }
  assert.ok(firsts.size >= 19, 'any type can open (DUMB LUCK too)');
  // the new six actually come up in Standard games
  const seen = {};
  for (let s = 0; s < 500; s++) for (const t of buildOrder(`q${s}`, 12)) seen[t] = (seen[t] || 0) + 1;
  for (const t of NEW) assert.ok(seen[t] > 200, `${t} appears in ${seen[t]}/500 standard games`);
});

// ---------- scoring ----------
test('scoring: 50 a link, 20 a spelling or heading, 10 a streak pick; speed bonus only when perfect; final ×2', () => {
  const base = { startAt: 0, doneAt: 15_000 };
  assert.equal(challengeScore({ ...base, type: 'missinglink', parts: 2, ok: 1 }), 50);
  assert.equal(challengeScore({ ...base, type: 'missinglink', parts: 2, ok: 2 }), 130);
  assert.equal(challengeScore({ ...base, type: 'missinglink', parts: 2, ok: 2, final: true }), 260);
  assert.equal(challengeScore({ ...base, type: 'spellcheck', parts: 5, ok: 3 }), 60);
  assert.equal(challengeScore({ ...base, type: 'spellcheck', parts: 5, ok: 5 }), 130);
  assert.equal(challengeScore({ ...base, type: 'higherlower', parts: 10, ok: 7 }), 70);
  assert.equal(challengeScore({ ...base, type: 'higherlower', parts: 10, ok: 10 }), 130);
  assert.equal(challengeScore({ type: 'higherlower', parts: 10, ok: 10, startAt: 0, doneAt: 3000 }), 154);
});

// ---------- 8 players through the director ----------
const P8 = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`p${i}`, true]));
const ONLINE = Object.fromEntries(Object.keys(P8).map(u => [u, true]));
function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}

test('8 players play all five newer challenges through the director; a rejoin and a new host change nothing', () => {
  let now = 1_000_000;
  const game = createGame({ matchId: 'm8', settings: { mode: 'standard' }, participants: P8, now, seed: 'eight', bank: {}, trivia: { n: 0 } });
  game.order = [...NEW, ...game.order.filter(t => !NEW.includes(t))].slice(0, game.total);
  game.seen = { [game.order[0]]: true };
  const ctx = boards => ({ now, boards, online: ONLINE, fallback: () => null });
  for (let ci = 0; ci < NEW.length; ci++) {
    const type = game.order[ci];
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, ctx({})));
    assert.equal(game.phase, 'play', type);
    assert.equal(game.brief === undefined || typeof game.brief === 'boolean', true);
    const spec = generate(type, { seed: game.seed, ci, level: ci / (game.total - 1), occ: 0 }, deps);
    const parts = spec.parts;
    // player i gets i parts right (capped), player 0 nothing; everyone but p7 finishes by 20 s
    const boards = {};
    for (let i = 0; i < 8; i++) {
      const ok = Math.min(parts, i * Math.ceil(parts / 6));
      boards[`p${i}`] = i === 7 ? { p: Math.min(parts, 1), ok: Math.min(parts, 1), n: parts, done: false } : { p: parts, ok, n: parts, done: true, doneAt: game.playStartAt + 20_000 };
    }
    // halfway through, p3 refreshes: their saved node is all the director needs
    now = game.playStartAt + 10_000;
    assert.equal(nextStep(game, ctx(boards)), null, 'waits while someone is still playing');
    now = game.playStartAt + CHALLENGE_MS + 1000;
    const patch = nextStep(game, ctx(boards));
    // a new host computing the same transition from the same DB state writes the same thing
    assert.deepEqual(nextStep(structuredClone(game), ctx(structuredClone(boards))), patch, 'replaying is harmless');
    applyPatch(game, patch);
    assert.equal(game.phase, 'standings');
    assert.equal(game.phaseEndsAt - game.phaseStartAt, REVEAL_STANDINGS_MS, `${type} holds the reveal`);
    const res = game.results[ci];
    assert.equal(Object.keys(res).length, 8);
    for (let i = 0; i < 8; i++) {
      const b = boards[`p${i}`];
      const want = challengeScore({ type, parts, ok: b.ok, startAt: game.playStartAt, doneAt: b.done ? b.doneAt : undefined, final: false });
      assert.equal(res[`p${i}`].pts, want, `${type} p${i}`);
    }
    assert.equal(res.p0.pts, 0);
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, ctx({})));
    assert.equal(game.phase, 'ready');
  }
  const table = standings(game);
  assert.equal(table.length, 8);
  assert.ok(table[0].score >= table[7].score);
});

test('QUICK mode: 6 different challenges, categories spread, the 6th is the ×2 final', () => {
  assert.equal(MODES.quick, 6);
  // (the option list is checked as text — meta.js since SHELL 2.0 B1)
  const idx = readFileSync('js/games/overclock/meta.js', 'utf8');   // (SHELL 2.0 B1: the options live in the thin meta)
  assert.match(idx, /value: 'quick'[\s\S]*value: 'standard'[\s\S]*value: 'marathon'/,'QUICK · STANDARD · MARATHON in the options');
  for (let s = 0; s < 500; s++) {
    const game = createGame({ matchId: `q${s}`, settings: { mode: 'quick' }, participants: P8, now: 0, seed: `quick${s}`, bank: {}, trivia: { n: 0 } });
    assert.equal(game.total, 6);
    assert.equal(game.order.length, 6);
    assert.equal(new Set(game.order).size, 6);
    assert.equal(categoryClashes(game.order), 0);
  }
  // play one through: standings after 1–5, then the final; the last challenge doubles
  let now = 0;
  // (a seed whose six have no TRIVIA LIGHTNING: this run has no question bank — the lightning wait is overclock.test.mjs's)
  let seedQ = 'quick-run';
  for (let k = 1; buildOrder(seedQ, 6, [], { luck: false }).includes('trivia'); k++) seedQ = `quick-run-${k}`;   // (one player: no DUMB LUCK)
  const game = createGame({ matchId: 'qq', settings: { mode: 'quick' }, participants: { a: true }, now, seed: seedQ, bank: {}, trivia: { n: 0 } });
  for (let ci = 0; ci < 6; ci++) {
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, { now, boards: {}, online: { a: true }, fallback: () => null }));
    assert.equal(game.phase, 'play');
    const parts = partsFor(game.order[ci], ci / 5);
    now = game.playStartAt + 5000;
    applyPatch(game, nextStep(game, { now, boards: { a: { p: parts, ok: parts, n: parts, done: true, doneAt: now } }, online: { a: true }, fallback: () => null }));
    assert.equal(game.phase, ci === 5 ? 'final' : 'standings');
    if (ci === 5) assert.ok(game.results[5].a.pts >= 200, 'final counts double');
    else { now = game.phaseEndsAt; applyPatch(game, nextStep(game, { now, boards: {}, online: { a: true }, fallback: () => null })); }
  }
});
