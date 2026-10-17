// DOUBLE AGENT: the word bank, the deal (word + agents from a secret seed), turn order (agent never first), clue
// blocking, the tie rule, the last-chance guess, scoring, and whole 8-player matches through the director — both modes,
// 1 and 2 agents, timeouts, a disconnect on your turn, an agent leaving mid-round, rejoin and host migration.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_SETTINGS, PTS, cleanSettings, norm, wordKey, wordForms, guessRight, clueProblem, deal, turnOrder, tallyVotes,
  scoreRound, standings, totals, INTRO_MS, BRIEF_MS, VOTE_MS, LAST_MS, SCORES_MS,
} from '../js/games/agent/logic.js';
import { createGame, nextStep, dealFor } from '../js/games/agent/director.js';
import { chatLocked } from '../js/chat/logic.js';

const BANK = JSON.parse(readFileSync('data/agent/words.json', 'utf8')).categories;

test('word bank: 40+ categories of 15+ well-formed words, no word twice', () => {
  assert.ok(BANK.length >= 40, `${BANK.length} categories`);
  const all = new Map();
  for (const [cat, words] of BANK) {
    assert.match(cat, /^[A-Z &]+$/, cat);
    assert.ok(words.length >= 15, `${cat}: ${words.length} words`);
    for (const w of words) {
      assert.match(w, /^[A-Za-z][A-Za-z -]*[A-Za-z]$/, `${cat}: "${w}"`);
      assert.ok(w.length <= 18, w);
      const k = wordKey(w);
      assert.ok(!all.has(k), `"${w}" is in ${all.get(k)} and ${cat}`);
      all.set(k, cat);
    }
  }
});

test('settings: 2 agents only with 7+ players; bad values fall back', () => {
  assert.equal(cleanSettings({ agents: 2 }, 6).agents, 1);
  assert.equal(cleanSettings({ agents: 2 }, 7).agents, 2);
  assert.deepEqual(cleanSettings({ rounds: 4, clueSec: 99, debateSec: 1, mode: 'x', passes: 3 }, 5),
    { ...DEFAULT_SETTINGS, rounds: 5, clueSec: 20, debateSec: 90, mode: 'remote', passes: 1 });
  assert.equal(cleanSettings({ mode: 'room' }, 4).mode, 'room');
});

const SEAT8 = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'];

test('the deal: same seed → same deal; agents are seated; used words are skipped; categories vary', () => {
  const counts = {};
  const cats = new Set();
  for (let s = 0; s < 400; s++) {
    const args = { seed: `seed${s}`, round: s % 5, v: 0, seat: SEAT8, agents: s % 2 ? 2 : 1, bank: BANK };
    const d = deal(args);
    assert.deepEqual(deal(args), d, 'deterministic');
    assert.equal(Object.keys(d.agents).length, s % 2 ? 2 : 1);
    for (const a of Object.keys(d.agents)) { assert.ok(SEAT8.includes(a)); counts[a] = (counts[a] || 0) + 1; }
    assert.ok(BANK.find(([c, ws]) => c === d.cat && ws.includes(d.word)));
    cats.add(d.cat);
  }
  for (const u of SEAT8) assert.ok(counts[u] > 40, `${u} is the agent sometimes (${counts[u]})`);
  assert.ok(cats.size >= 35, 'categories spread');
  // used words never come back; the previous category is skipped
  const used = {};
  for (let r = 0; r < 60; r++) {
    const d = deal({ seed: 'night', round: r, seat: SEAT8, bank: BANK, used, lastCat: 'FOOD' });
    assert.ok(!used[wordKey(d.word)], `${d.word} repeated`);
    assert.notEqual(d.cat, 'FOOD');
    used[wordKey(d.word)] = true;
  }
  // a re-deal (v) changes it
  const one = deal({ seed: 'x', round: 1, v: 0, seat: SEAT8, bank: BANK });
  const two = deal({ seed: 'x', round: 1, v: 1, seat: SEAT8, bank: BANK });
  assert.notDeepEqual([one.word, one.agents], [two.word, two.agents]);
});

test('turn order: everyone once, random, and an agent never goes first', () => {
  const firsts = new Set();
  for (let s = 0; s < 1000; s++) {
    const seat = SEAT8.slice(0, 4 + (s % 5));
    const d = deal({ seed: `t${s}`, round: 0, seat, agents: seat.length >= 7 && s % 2 ? 2 : 1, bank: BANK });
    const o = turnOrder({ seed: `t${s}`, round: 0, seat, agents: d.agents });
    assert.deepEqual([...o].sort(), [...seat].sort());
    assert.ok(!d.agents[o[0]], 'agent first');
    firsts.add(o[0]);
  }
  assert.equal(firsts.size, 8, 'anyone innocent can open');
});

test('clue rules: one word, letters and hyphens, ≤ 20; never the word, its plural, a word containing it, or a repeat', () => {
  assert.equal(clueProblem('cheese', 'pizza'), null);
  assert.equal(clueProblem('Mozzarella', 'pizza', ['dough']), null);
  assert.equal(clueProblem('deep-dish', 'pizza'), null);
  assert.match(clueProblem('pizza', 'pizza'), /gives the word away/);
  assert.match(clueProblem('PIZZAS', 'pizza'), /gives the word away/);
  assert.equal(clueProblem('pizzeria', 'pizza'), null, 'pizzeria does not contain pizza: allowed');
  assert.match(clueProblem('pepperonipizza', 'pizza'), /gives the word away/);
  assert.match(clueProblem('berries', 'berry'), /gives the word away/);
  assert.match(clueProblem('guineapig', 'guinea pig'), /gives the word away/);
  assert.match(clueProblem('dough', 'pizza', ['Dough']), /already said/);
  assert.match(clueProblem('hot dog', 'pizza'), /One word/);
  assert.match(clueProblem('pi22a', 'pizza'), /Letters only/);
  assert.match(clueProblem('a'.repeat(21), 'pizza'), /20/);
  assert.match(clueProblem('', 'pizza'), /Type/);
  assert.equal(clueProblem('pizza', null), null, 'the agent does not know the word');
});

test('last chance: the word in any case, with spaces or as a plural', () => {
  assert.ok(guessRight('Pizza', 'pizza'));
  assert.ok(guessRight('  PIZZAS ', 'pizza'));
  assert.ok(guessRight('guineapig', 'guinea pig'));
  assert.ok(guessRight('Guinea-Pigs', 'guinea pig'));
  assert.ok(guessRight('wolves', 'wolf'));
  assert.ok(!guessRight('pizzeria', 'pizza'));
  assert.ok(!guessRight('', 'pizza'));
  assert.ok(wordForms('cherry').has('CHERRIES'));
  assert.equal(norm('Yo-yo'), 'YOYO');
});

test('the vote: most votes is accused; a tie accuses nobody; with 2 agents the top two; self and outsiders ignored', () => {
  const seat = SEAT8;
  const v = obj => Object.fromEntries(Object.entries(obj).map(([k, s]) => [k, { s }]));
  assert.deepEqual(tallyVotes(v({ a1: 'b2', c3: 'b2', d4: 'e5' }), seat, 1).accused, { b2: true });
  assert.deepEqual(tallyVotes(v({ a1: 'b2', c3: 'e5' }), seat, 1).accused, {}, 'tie = the agent escapes');
  assert.deepEqual(tallyVotes(v({ a1: 'a1', zz: 'b2', c3: 'b2' }), seat, 1).tally, { b2: 1 }, 'self vote and non-player ignored');
  assert.deepEqual(tallyVotes({}, seat, 1).accused, {});
  // two agents: top two unmasked; a tie for the second slot leaves it empty
  assert.deepEqual(tallyVotes(v({ a1: 'b2', c3: 'b2', d4: 'e5', f6: 'e5', g7: 'h8' }), seat, 2).accused, { b2: true, e5: true });
  assert.deepEqual(tallyVotes(v({ a1: 'b2', c3: 'b2', d4: 'e5', f6: 'h8' }), seat, 2).accused, { b2: true });
  assert.deepEqual(tallyVotes(v({ a1: 'b2', c3: 'e5', d4: 'h8' }), seat, 2).accused, {});
});

test('scoring: escape 200, steal 150, caught + miss → innocents 100, right vote 50', () => {
  const seat = ['a', 'b', 'c', 'd'];
  const votes = { a: { s: 'd' }, b: { s: 'd' }, c: { s: 'a' }, d: { s: 'a' } };
  let r = scoreRound({ seat, agents: { d: true }, caught: {}, stolen: {}, votes });
  assert.deepEqual([r.a.pts, r.b.pts, r.c.pts, r.d.pts], [50, 50, 0, 200]);
  r = scoreRound({ seat, agents: { d: true }, caught: { d: true }, stolen: { d: true }, votes });
  assert.deepEqual([r.a.pts, r.b.pts, r.c.pts, r.d.pts], [50, 50, 0, 150]);
  r = scoreRound({ seat, agents: { d: true }, caught: { d: true }, stolen: {}, votes });
  assert.deepEqual([r.a.pts, r.b.pts, r.c.pts, r.d.pts], [150, 150, 100, 0]);
  // two agents: one escapes, one caught and misses
  r = scoreRound({ seat: [...seat, 'e', 'f', 'g'], agents: { d: true, e: true }, caught: { d: true }, stolen: {}, votes: { ...votes, f: { s: 'e' } } });
  assert.equal(r.e.pts, PTS.escape);
  assert.equal(r.d.pts, 0);
  assert.equal(r.f.pts, PTS.innocentCatch + PTS.rightVote);
  assert.equal(r.c.pts, PTS.innocentCatch);
});

test('chat: locked while files are read and clues given; REMOTE debates in chat; SAME ROOM talks out loud', () => {
  const g = (phase, mode = 'remote') => ({ id: 'agent', phase, settings: { mode }, participants: { u: true } });
  assert.equal(chatLocked(g('briefing'), 'u'), true);
  assert.equal(chatLocked(g('clues'), 'u'), true);
  assert.equal(chatLocked(g('debate'), 'u'), false);
  assert.equal(chatLocked(g('vote'), 'u'), false);
  assert.equal(chatLocked(g('debate', 'room'), 'u'), true);
  assert.equal(chatLocked(g('scores', 'room'), 'u'), false);
  assert.equal(chatLocked(g('clues'), 'spectator'), false);
});

// ---------------------------------------------------------------- whole matches through the director
function applyPatch(obj, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = obj;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
}

/**
 * Runs a match. script(game, d) per phase decides what the players do. Returns the finished game + a log.
 * opts: { players, settings, seed, leaveAt: { round, phase, who: 'agent' }, offlineTurn: true, rejoinEvery: true }
 */
function playMatch(opts) {
  const players = opts.players;
  const participants = Object.fromEntries(players.map(u => [u, true]));
  let now = 1_000_000;
  const game = createGame({ matchId: 'm1', settings: opts.settings, participants, now });
  const present = Object.fromEntries(players.map(u => [u, true]));
  const online = Object.fromEntries(players.map(u => [u, true]));
  const usedRoom = {};
  const seed = opts.seed || 'secret-seed';
  const live = { clues: {}, ready: {}, pins: {}, votes: {}, guess: {} };
  let rk = game.rk;
  const log = { phases: [], deals: [], voids: 0, skips: 0, agentFirst: false, clues: 0, blockedTries: 0, wordOnBoard: 0 };
  const ctx = () => ({ now, online, present, live, seed, bank: BANK, usedRoom });
  const stepIt = () => {
    const before = structuredClone(game);
    const p = nextStep(game, ctx());
    if (!p) return false;
    if (p.lobby) { game.phase = 'lobby'; return true; }
    // host migration: a fresh host computing the same step from the same state writes the same thing
    assert.deepEqual(nextStep(structuredClone(before), ctx()), p);
    if (p.$room) for (const [k, v] of Object.entries(p.$room)) if (v) usedRoom[k.split('/').pop()] = true;
    applyPatch(game, p);
    if (game.rk !== rk) { rk = game.rk; for (const k of Object.keys(live)) live[k] = {}; }
    return true;
  };
  let guard = 0;
  while (game.phase !== 'lobby' && guard++ < 5000) {
    const d = dealFor(game, { seed, bank: BANK, usedRoom });
    if (log.phases.at(-1) !== `${game.round}:${game.phase}`) log.phases.push(`${game.round}:${game.phase}`);
    if (opts.leaveAt && game.round === opts.leaveAt.round && game.phase === opts.leaveAt.phase && !log.left && d) {
      const agent = Object.keys(d.agents)[0];
      delete present[agent]; online[agent] = false; log.left = agent; log.voids++;
    }
    if (game.phase === 'briefing' && d) {
      log.deals.push({ round: game.round, word: d.word, agents: Object.keys(d.agents) });
      for (const u of game.seat) if (online[u]) live.ready[u] = { b: true };
      now += 3_100;
    } else if (game.phase === 'clues') {
      if (game.turn === 0 && d && d.agents[game.order[0]]) log.agentFirst = true;
      const u = game.cur;
      if (opts.offlineTurn && game.round === 0 && game.turn === 1 && online[u]) { online[u] = false; log.offline = u; }
      else if (online[u] && !(game.turn % 5 === 4)) {
        const word = d.agents[u] ? null : d.word;
        let clue = `clue${game.turn}x`.replace(/\d/g, m => 'abcdefghij'[m]);
        if (game.turn === 2 && word) { clue = word.replace(/[^A-Za-z]/g, ''); log.blockedTries++; } // tries to say the word: the host blocks it
        live.clues[game.pass] = { ...(live.clues[game.pass] || {}), [u]: { t: clue } };
        log.clues++;
      } else { now = game.turnEndsAt + 800; log.skips++; } // a slow player times out
      if (log.offline && game.cur !== log.offline && !online[log.offline] && game.turn > 2) online[log.offline] = true; // back next turn
    } else if (game.phase === 'debate') {
      now = game.phaseEndsAt + 800;
    } else if (game.phase === 'vote') {
      // everyone votes for the first agent (round 0: split the vote → tie)
      const agents = Object.keys(d.agents);
      game.seat.forEach((u, i) => {
        if (!online[u]) return;
        let s = opts.splitRound === game.round ? game.seat[(game.seat.indexOf(u) + 1) % game.seat.length] : agents[0];
        if (s === u) s = game.seat.find(x => x !== u && !d.agents[x]);
        live.votes[u] = { s, lock: true };
      });
    } else if (game.phase === 'last') {
      for (const u of Object.keys(game.caught)) live.guess[u] = { t: opts.agentGuessesRight ? d.word.toUpperCase() : 'nope' };
    } else if (['intro', 'unmask', 'scores', 'final'].includes(game.phase)) {
      now = game.phaseEndsAt + 1;
    }
    if (!stepIt()) now += 400;
    if (game.board && d) for (const p of Object.values(game.board)) for (const c of Object.values(p || {})) if (c && norm(c).includes(norm(d.word))) log.wordOnBoard++;
  }
  assert.ok(guard < 5000, 'match finished');
  return { game, log, usedRoom };
}

test('8 players, REMOTE, 1 agent: a whole match — the agent is never first, blocked clues and timeouts skip, scores add up', () => {
  const players = SEAT8;
  const { game, log, usedRoom } = playMatch({ players, settings: { rounds: 3, mode: 'remote', agents: 1 }, offlineTurn: true });
  assert.ok(!log.agentFirst, 'agent never opens');
  assert.equal(Object.keys(game.results).length, 3);
  assert.equal(Object.keys(usedRoom).length, 3, 'three words marked used in the room');
  assert.ok(log.skips > 0, 'timeouts happened');
  assert.ok(log.offline, 'someone dropped on their turn and was skipped');
  // every round: all agents voted out (everyone voted for the agent) and missed the guess → innocents +100 +50
  for (const r of Object.values(game.results)) {
    const agents = Object.entries(r).filter(([, x]) => x.agent);
    assert.equal(agents.length, 1);
    assert.equal(agents[0][1].pts, 0);
    const innocents = Object.entries(r).filter(([, x]) => !x.agent);
    assert.ok(innocents.every(([, x]) => x.pts === PTS.innocentCatch + PTS.rightVote || x.pts === PTS.innocentCatch));
  }
  const s = standings(game);
  assert.equal(s.length, 8);
  assert.equal(Object.values(totals(game)).reduce((a, b) => a + b, 0), Object.values(game.results).flatMap(r => Object.values(r)).reduce((a, x) => a + x.pts, 0));
  // a clue that gave the word away was blocked by the host (it became NO SIGNAL): the board never showed a secret word
  assert.ok(log.blockedTries > 0, 'players tried to say the word');
  assert.equal(log.wordOnBoard, 0);
  assert.ok(log.phases.includes('0:last'), 'the caught agent got a last chance');
});

test('8 players, SAME ROOM, 2 agents: two unmasked, a split vote lets them escape, a right guess steals', () => {
  const { game } = playMatch({ players: SEAT8, settings: { rounds: 3, mode: 'room', agents: 2, passes: 2 }, splitRound: 0, agentGuessesRight: true });
  assert.equal(game.settings.agents, 2);
  assert.equal(game.settings.passes, 2);
  const r0 = Object.values(game.results[0]);
  assert.equal(r0.filter(x => x.agent).length, 2);
  assert.ok(r0.filter(x => x.agent).every(x => x.pts === PTS.escape), 'split vote: both agents escape');
  const r1 = Object.values(game.results[1]);
  assert.ok(r1.filter(x => x.agent).some(x => x.pts === PTS.steal), 'a caught agent named the word and stole');
});

test('an agent leaves the room mid-round: the round is void and dealt again; the match carries on', () => {
  const { game, log } = playMatch({ players: SEAT8.slice(0, 6), settings: { rounds: 3 }, leaveAt: { round: 0, phase: 'clues' } });
  assert.equal(log.voids, 1);
  assert.equal(game.voided, 1);
  assert.ok(game.burned && Object.keys(game.burned).length === 1, 'the leaked word is burned');
  assert.ok(!game.seat.includes(log.left), 'the leaver is out of the seat');
  assert.equal(Object.keys(game.results).length, 3);
  for (const r of Object.values(game.results)) assert.ok(!r[log.left], 'no score for the leaver');
});

test('rejoin + host migration: the director only reads the room state; nothing is lost between steps', () => {
  // the playMatch harness already replays every step on a cloned state (= a new host) and asserts the same patch;
  // a rejoining phone re-reads the same game object, so here we just check a fresh game is fully described by its state
  const g1 = createGame({ matchId: 'mx', settings: { rounds: 3 }, participants: { a: true, b: true, c: true, d: true }, now: 0 });
  const g2 = JSON.parse(JSON.stringify(g1));
  const ctx = { now: INTRO_MS + 1, online: { a: true, b: true, c: true, d: true }, present: { a: true, b: true, c: true, d: true }, live: {}, seed: 's', bank: BANK };
  assert.deepEqual(nextStep(g1, ctx), nextStep(g2, ctx));
  // without the secret seed (a new host still loading it), the director waits instead of guessing
  const brief = { ...g1, phase: 'briefing', phaseStartAt: 0, phaseEndsAt: BRIEF_MS };
  assert.equal(nextStep(brief, { ...ctx, now: BRIEF_MS + 5000, seed: null }), null);
  assert.ok(nextStep(brief, { ...ctx, now: BRIEF_MS + 5000 }), 'with the seed it moves on');
  // the public game state never contains the word or the agents before the reveal
  const { game } = playMatch({ players: SEAT8.slice(0, 5), settings: { rounds: 1 } });
  assert.ok(game.word && game.agents, 'revealed at the end');
  const fresh = createGame({ matchId: 'my', settings: {}, participants: { a: true, b: true, c: true, d: true }, now: 0 });
  assert.ok(!('word' in fresh) && !('agents' in fresh) && !JSON.stringify(fresh).includes('seed'));
  assert.ok(VOTE_MS && LAST_MS && SCORES_MS);
});

test('fewer than 3 left: straight to the podium', () => {
  const g = createGame({ matchId: 'mz', settings: {}, participants: { a: true, b: true, c: true, d: true }, now: 0 });
  const p = nextStep(g, { now: 10, online: { a: true, b: true }, present: { a: true, b: true }, live: {}, seed: 's', bank: BANK });
  assert.equal(p.phase, 'final');
});
