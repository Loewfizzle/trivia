// NEURAL BLUFF: closeness checks, option building, scoring, reveal timing,
// whole-match simulation (host change, a player who misses WRITE), and the bank.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  normalize, displayText, tooClose, optionKey, buildOptions, scoreRound, revealScript, revealDuration, revealStepAt, standings,
  REVEAL_LEAD_MS, REVEAL_STEP_MS, REVEAL_TRUTH_MS, WRITE_MS, VOTE_MS, INTRO_MS, MODES, POINTS,
} from '../js/games/bluff/logic.js';
import { createGame, nextStep, questionKey, secretKey, optionsKey } from '../js/games/bluff/director.js';
import { setBluffRows, pickQuestion } from '../js/games/bluff/bank.js';
import { decodeJSON } from '../js/core/obfuscate.js';

const rows = JSON.parse(readFileSync('data/bluff/questions.json', 'utf8')).questions;
setBluffRows(rows);

test('normalize strips case, accents, punctuation and leading articles', () => {
  assert.equal(normalize("  The Brad's Drink! "), 'brad s drink');
  assert.equal(normalize('Häagen-Dazs'), 'haagen dazs');
  assert.equal(normalize('A pizza & a beer'), 'pizza and a beer');
});

test('tooClose catches the truth, variants, near-miss spellings and containment — not different answers', () => {
  const a = "Brad's Drink", v = ['brads drink', "brad's", 'brads'];
  assert.ok(tooClose('brads drink', a, v));
  assert.ok(tooClose("BRAD'S DRINK", a, v));
  assert.ok(tooClose('Brads Drnk', a, v), 'one-letter typo');
  assert.ok(tooClose('Brads Drink Soda', a, v), 'contains the truth');
  assert.ok(!tooClose("Caleb's Cola", a, v));
  assert.ok(!tooClose('Bradley Tonic', a, v));
  // short answers: only exact matches count, so "Hull" is a fine lie for "Hell"
  assert.ok(tooClose('hell', 'Hell', ['hell']));
  assert.ok(!tooClose('Hull', 'Hell', ['hell']));
  assert.ok(tooClose('six', 'six', ['6', 'six']));
  assert.ok(!tooClose('seven', 'six', ['6', 'six']));
  assert.ok(!tooClose('', 'six', []));
});

test('buildOptions merges duplicate lies, drops truth-like lies, pads with house lies', () => {
  const truth = { a: 'Pequod', v: ['pequod'] };
  const house = ["Ahab's", 'Nantucket', 'The Harpoon'];
  // 3 players → at least 5 options
  const three = buildOptions({ lies: { a: { t: 'Moby Coffee' }, b: { t: 'moby coffee!' }, c: { t: 'Pequd' } }, truth, house, players: 3, seed: 's' });
  const moby = three.find(o => normalize(o.t) === 'moby coffee');
  assert.deepEqual(moby.authors.sort(), ['a', 'b'], 'duplicates merged');
  assert.ok(!three.some(o => o.authors.includes('c')), 'near-truth lie dropped');
  assert.equal(three.filter(o => o.truth).length, 1);
  assert.equal(three.length, 5, 'truth + 1 merged lie + 3 house lies');
  // 5 players with lies → no padding needed
  const five = buildOptions({ lies: { a: { t: 'One' }, b: { t: 'Two' }, c: { t: 'Three' }, d: { t: 'Four' }, e: { t: 'Five' } }, truth, house, players: 5, seed: 's' });
  assert.equal(five.length, 6);
  assert.ok(!five.some(o => o.house));
  // 5 players but only one wrote → padded to 4
  const sparse = buildOptions({ lies: { a: { t: 'One' } }, truth, house, players: 5, seed: 's' });
  assert.equal(sparse.length, 4);
  // a player lie identical to a house lie stays the player's
  const dup = buildOptions({ lies: { a: { t: 'nantucket' } }, truth, house, players: 2, seed: 's' });
  const n = dup.find(o => normalize(o.t) === 'nantucket');
  assert.deepEqual(n.authors, ['a']);
  assert.equal(n.house, false);
  // seeded shuffle is deterministic
  assert.deepEqual(buildOptions({ lies: {}, truth, house, players: 2, seed: 'x' }), buildOptions({ lies: {}, truth, house, players: 2, seed: 'x' }));
});

const opts = () => [
  { k: 'T', t: 'truth', truth: true, house: false, authors: [] },
  { k: 'L1', t: 'lie one', truth: false, house: false, authors: ['a'] },
  { k: 'L2', t: 'lie two', truth: false, house: false, authors: ['b', 'c'] },
  { k: 'H', t: 'house', truth: false, house: true, authors: [] },
];
const parts = { a: true, b: true, c: true, d: true };

test('scoring: truth 1000, fooling 500 per victim (each merged author), likes 100, house lies pay nobody', () => {
  const votes = {
    a: { k: 'T', like: 'L2' },      // finds truth, likes b+c's lie
    b: { k: 'L1', like: 'L1' },     // fooled by a, likes a
    c: { k: 'H' },                  // fooled by the house: nobody scores
    d: { k: 'L2', like: 'T' },      // fooled by b+c; liking the truth does nothing
  };
  const r = scoreRound({ options: opts(), votes, participants: parts });
  assert.equal(r.a.pts, POINTS.truth + POINTS.fooled + POINTS.like);
  assert.equal(r.b.pts, POINTS.fooled + POINTS.like);
  assert.equal(r.c.pts, POINTS.fooled + POINTS.like);
  assert.equal(r.d.pts, 0);
  assert.equal(r.a.truth, true);
  assert.equal(r.b.fooled, 1);
});

test('own lies: voting for or liking your own lie is ignored; final round is ×3', () => {
  const r = scoreRound({ options: opts(), votes: { a: { k: 'L1', like: 'L1' }, b: { k: 'T' } }, participants: parts, final: true });
  assert.equal(r.a.pts, 0);
  assert.equal(r.a.picked, null);
  assert.equal(r.b.pts, 3 * POINTS.truth);
});

test('reveal script: fooled-most last among lies, then the truth; timing maps to steps', () => {
  const votes = { a: { k: 'L2' }, b: { k: 'L1' }, d: { k: 'L2' }, c: { k: 'T' } };
  const s = revealScript(opts(), votes);
  assert.deepEqual(s.steps.map(x => x.k), ['L1', 'L2', 'T']);
  assert.deepEqual(s.steps[1].voters, ['a', 'd']);
  assert.deepEqual(s.unpicked.map(x => x.k), ['H']);
  assert.equal(revealStepAt(s, 0), -1);
  assert.equal(revealStepAt(s, REVEAL_LEAD_MS + 10), 0);
  assert.equal(revealStepAt(s, REVEAL_LEAD_MS + REVEAL_STEP_MS + 10), 1);
  assert.equal(revealStepAt(s, REVEAL_LEAD_MS + 2 * REVEAL_STEP_MS + 10), 2, 'truth');
  assert.equal(revealStepAt(s, REVEAL_LEAD_MS + 2 * REVEAL_STEP_MS + REVEAL_TRUTH_MS + 10), 3, 'tally');
  assert.ok(revealDuration(s) > REVEAL_LEAD_MS + 2 * REVEAL_STEP_MS + REVEAL_TRUTH_MS);
});

// ---------- match simulation ----------
const CODE = 'BLUF';
function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (k === '$room') continue;
    const p = k.split('/');
    let o = obj;
    for (const part of p.slice(0, -1)) o = o[part] ??= {};
    if (v === null) delete o[p.at(-1)]; else o[p.at(-1)] = structuredClone(v);
  }
}
const ctxFor = (game, now, lies, votes, online, roomUsed = {}) => ({
  code: CODE, now, online, lies, votes, pickQuestion, roomUsed,
  decode: g => {
    const q = decodeJSON(g.qx, questionKey(CODE, g.matchId, g.round));
    const hx = decodeJSON(g.hx, secretKey(CODE, g.matchId, g.round));
    return q && hx ? { q, house: hx.lies } : null;
  },
  decodeOptions: g => decodeJSON(g.ox, optionsKey(g)),
});

test('a full short match: write → vote → reveal → standings, final ×3, one player always misses WRITE but still votes', () => {
  const participants = { a: true, b: true, c: true };
  const online = { a: true, b: true, c: true };
  let now = 0;
  const game = createGame({ code: CODE, matchId: 'mb', settings: { mode: 'short' }, participants, now, pickQuestion });
  assert.equal(game.rounds, MODES.short);
  const seenIds = new Set();
  for (let r = 0; r < game.rounds; r++) {
    const q = decodeJSON(game.qx, questionKey(CODE, 'mb', r));
    assert.ok(q && q.q.includes('____'));
    assert.ok(!seenIds.has(q.id), 'no repeated questions');
    seenIds.add(q.id);
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, ctxFor(game, now, {}, {}, online)));
    assert.equal(game.phase, 'write');
    // a and b lie; c (online) is idle so WRITE runs to the clock
    const lies = { a: { t: `alpha lie ${r}` }, b: { t: `bravo lie ${r}` } };
    assert.equal(nextStep(game, ctxFor(game, now + 5000, lies, {}, online)), null, 'waits for c');
    now += WRITE_MS + 900;
    applyPatch(game, nextStep(game, ctxFor(game, now, lies, {}, online)));
    assert.equal(game.phase, 'vote');
    assert.ok(game.options.length >= 5, '3 players → padded to ≥5 options');
    assert.ok(!JSON.stringify(game.options).includes('"truth"'), 'authorship hidden while voting');
    const options = decodeJSON(game.ox, optionsKey(game));
    const truthK = options.find(o => o.truth).k;
    const aK = options.find(o => o.authors.includes('a')).k;
    // c (missed WRITE) finds the truth; b falls for a's lie; a falls for a house lie and likes a's own lie (ignored)
    const houseK = options.find(o => o.house).k;
    const votes = { c: { k: truthK }, b: { k: aK, like: aK }, a: { k: houseK, like: aK } };
    applyPatch(game, nextStep(game, ctxFor(game, now + 2000, lies, votes, online)));
    assert.equal(game.phase, 'reveal', 'everyone voted → early reveal');
    const res = game.results[r];
    const mult = r === game.rounds - 1 ? 3 : 1;
    assert.equal(res.c.pts, 1000 * mult);
    assert.equal(res.a.pts, (500 + 100) * mult);
    assert.equal(res.b.pts, 0);
    now = game.phaseEndsAt;
    applyPatch(game, nextStep(game, ctxFor(game, now, lies, votes, online, Object.fromEntries([...seenIds].map(i => [i, true])))));
    if (r < game.rounds - 1) {
      assert.equal(game.phase, 'standings');
      now = game.phaseEndsAt;
      applyPatch(game, nextStep(game, ctxFor(game, now, {}, {}, online, Object.fromEntries([...seenIds].map(i => [i, true])))));
      assert.equal(game.phase, 'intro');
    }
  }
  assert.equal(game.phase, 'final');
  const s = standings(game);
  assert.equal(s[0].uid, 'c');
});

test('host change mid-vote: replaying the vote → reveal transition from a stale copy yields identical results', () => {
  const participants = { h: true, p2: true, p3: true, p4: true };
  const online = { h: true, p2: true, p3: true, p4: true };
  const game = createGame({ code: CODE, matchId: 'mh', settings: { mode: 'standard' }, participants, now: 0, pickQuestion });
  let now = INTRO_MS;
  applyPatch(game, nextStep(game, ctxFor(game, now, {}, {}, online)));
  const lies = { h: { t: 'host lie' }, p2: { t: 'second lie' }, p3: { t: 'third lie' }, p4: { t: 'fourth lie' } };
  applyPatch(game, nextStep(game, ctxFor(game, now + 3000, lies, {}, online)));
  const options = decodeJSON(game.ox, optionsKey(game));
  const votes = { p2: { k: options.find(o => o.authors.includes('h')).k }, p3: { k: options.find(o => o.truth).k }, p4: { k: options.find(o => o.authors.includes('p2')).k } };
  const stale = structuredClone(game);
  // host froze; p2 takes over and closes voting (h offline isn't waited for)
  now += VOTE_MS + 1000;
  applyPatch(game, nextStep(game, ctxFor(game, now, lies, votes, { h: false, p2: true, p3: true, p4: true })));
  const first = structuredClone(game.results);
  applyPatch(game, nextStep(stale, ctxFor(stale, now + 5000, lies, votes, online)));
  assert.deepEqual(game.results, first);
  assert.equal(game.results[0].h.pts, 500);
  assert.equal(game.results[0].p3.pts, 1000);
});

test('questions are not repeated across games in the same room session', () => {
  const used = {};
  for (let i = 0; i < 40; i++) {
    const g = createGame({ code: CODE, matchId: `m${i}`, settings: { mode: 'short' }, participants: { a: true, b: true }, now: 0, pickQuestion, roomUsed: used });
    const id = Object.keys(g.used)[0];
    assert.ok(!used[id], 'fresh question');
    used[id] = true;
    assert.ok(g.$room[`meta/used/bluff/${id}`], 'room-level history is written');
  }
});

test('question bank: ≥300 strange-but-true questions, blanks, short answers, house lies never match the truth', () => {
  assert.ok(rows.length >= 300, `${rows.length}`);
  const seen = new Set();
  for (const [cat, q, a, v, lies] of rows) {
    assert.ok(q.includes('____'), q);
    assert.ok(a.split(/\s+/).length <= 4, a);
    assert.equal(lies.length, 3, q);
    assert.ok(!seen.has(q));
    seen.add(q);
    for (const l of lies) assert.ok(!tooClose(l, a, v), `house lie too close to truth: ${q} → ${l}`);
    assert.ok(tooClose(a, a, v));
    assert.ok(cat);
  }
  assert.equal(new Set(rows.map(r => optionKey(r[1]))).size, rows.length);
});

// Reported exploit: the truth came from the bank in lowercase ("wallpaper cleaner") while phones
// auto-capitalize lies, and lies carried articles/periods the truth didn't. Every option must look alike.
const looksUniform = t => !/[a-z]/.test(t) && !/^(A|AN|THE) /.test(t) && !/[.,;:!?…"“”']$/.test(t) && t === t.trim();

test('display: truth, lies and house lies are formatted identically (no case / article / punctuation tells)', () => {
  assert.equal(displayText('wallpaper cleaner'), 'WALLPAPER CLEANER');
  assert.equal(displayText('Wallpaper cleaner.'), 'WALLPAPER CLEANER');
  assert.equal(displayText('A pride'), displayText('pride'));
  assert.equal(displayText('a group of lions'), 'GROUP OF LIONS');
  assert.equal(displayText('the Bronx'), 'BRONX');
  assert.equal(displayText('“An old sock!”'), 'OLD SOCK');
  assert.equal(displayText('Twelve'), displayText('12'));
  assert.equal(displayText('twenty-five cents'), '25 CENTS');
  assert.equal(displayText('one eye open'), '1 EYE OPEN');
  assert.equal(displayText('no one'), 'NO ONE');
  assert.equal(displayText('The'), 'THE');
  // the same lie typed differently merges into one option
  assert.equal(optionKey('A pride.'), optionKey('pride'));
  assert.equal(optionKey('twelve'), optionKey('12'));
});

test('display: across the whole bank, a phone-typed lie can never be told apart from the truth by formatting', () => {
  for (const [, q, a, v, house] of rows) {
    // what a phone sends: auto-capitalized, often with an article and a full stop
    const typed = { p1: { t: 'Totally made up thing.' }, p2: { t: 'A strange invention' }, p3: { t: 'the third one' } };
    const opts = buildOptions({ lies: typed, truth: { a, v }, house, players: 3, seed: q });
    for (const o of opts) assert.ok(looksUniform(o.t), `${q} → "${o.t}"`);
    // "an ____" gives away that the truth starts with a vowel
    assert.ok(!/\ban ____/i.test(q), `"an ____" hints at the answer: ${q}`);
  }
});
