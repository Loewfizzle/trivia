// HOLD'EM (HE1) — THE SIMULATIONS: hundreds of whole matches (2–8 players, every speed, CASH) played by THE TEST
// ROBOTS (tests/fixtures/holdem-bots.mjs) on the real engine, THE INVARIANTS checked after EVERY action
// (tests/fixtures/holdem-driver.mjs): chips conserved (+ rebuys + leavers in CASH), no negative or fractional stack,
// every hand ends, only legal actions applied (illegal tries refused + nothing changed), side pots with 3–7 all-ins,
// heads-up rules at 2, one winner + the full order, ledgers sum to 0, publicView never leaks a card, a seed replays.
// The match-LENGTH study is scripts/holdem-sim.mjs (too long for npm test).
import test from 'node:test';
import assert from 'node:assert/strict';
import { runMatch } from './fixtures/holdem-driver.mjs';

const SPEEDS = ['turbo', 'standard', 'deep'];
const STACK = { turbo: 1500, standard: 1500, deep: 3000 };
const total = { hands: 0, actions: 0, rejected: 0, headsUp: 0, timeouts: 0, aways: 0, runouts: 0, splits: 0, allin: {}, maxPots: 0 };
function add(stats) {
  for (const k of ['hands', 'actions', 'rejected', 'headsUp', 'timeouts', 'aways', 'runouts', 'splits']) total[k] += stats[k];
  for (const [n, c] of Object.entries(stats.allinHist)) total.allin[n] = (total.allin[n] || 0) + c;
  total.maxPots = Math.max(total.maxPots, stats.maxPots);
}

function checkTournament(r, n) {
  const s = r.summary;
  assert.ok(r.match.ended, 'the tournament ended');
  assert.ok(s.winner, 'a winner');
  assert.equal(s.places.length, n, 'everyone has a place');
  assert.equal(s.places.filter(p => p.place === 1).length, 1, 'exactly one winner');
  assert.equal(s.places[0].id, s.winner);
  assert.equal(new Set(s.places.map(p => p.id)).size, n);
  for (const p of s.places) assert.ok(p.place >= 1 && p.place <= n);
  const left = r.match.table.seats.filter(x => x.stack > 0);
  assert.deepEqual(left.map(x => x.id), [s.winner], 'the winner holds every chip');
  assert.equal(left[0].stack, n * STACK[r.match.speed], 'n × the starting stack');
}

test('TOURNAMENTS: 2–8 players × TURBO / STANDARD / DEEP × 8 seeds — every invariant after every action', () => {
  const t0 = performance.now();
  let matches = 0;
  for (const speed of SPEEDS) for (let n = 2; n <= 8; n++) for (let k = 0; k < 8; k++) {
    const r = runMatch({ mode: 'tournament', speed, n, seed: `t-${speed}-${n}-${k}`, junk: 0.05, sleepy: 0.03 });
    checkTournament(r, n);
    add(r.stats);
    matches++;
  }
  // a calmer table (more streets, more showdowns): no maniacs, no shovers
  for (let n = 2; n <= 8; n++) for (let k = 0; k < 4; k++) {
    const styles = Array.from({ length: n }, (_, i) => ['tight', 'loose', 'station'][(i + k) % 3]);
    const r = runMatch({ mode: 'tournament', speed: 'turbo', n, seed: `calm-${n}-${k}`, styles, junk: 0.05, sleepy: 0.02 });
    checkTournament(r, n);
    add(r.stats);
    matches++;
  }
  console.log(`# holdem: ${matches} tournaments, ${total.hands} hands, ${total.actions} steps in ${Math.round(performance.now() - t0)} ms`);
  assert.ok(matches >= 190);
});

test('SIDE-POT TABLES: mostly ALL-IN HAPPY robots, 5–8 players, tournament + cash — many all-ins of different sizes', () => {
  for (let n = 5; n <= 8; n++) for (let k = 0; k < 8; k++) {
    const styles = Array.from({ length: n }, (_, i) => (i === k % n ? 'station' : 'jammer'));
    const r = runMatch({ mode: 'tournament', speed: 'turbo', n, seed: `jam-${n}-${k}`, styles, junk: 0.05 });
    checkTournament(r, n);
    add(r.stats);
    const c = runMatch({ mode: 'cash', n, seed: `jamc-${n}-${k}`, styles, cashHands: 40 });
    assert.equal(c.summary.ledger.reduce((a, x) => a + x.net, 0), 0);
    add(c.stats);
  }
});

test('CASH: 2–8 players × 10 seeds — rebuys, late joiners, leavers (mid-hand too), END SESSION; Σ net = 0', () => {
  const t0 = performance.now();
  let hands = 0, rebuys = 0, joins = 0, leaves = 0;
  for (let n = 2; n <= 8; n++) for (let k = 0; k < 10; k++) {
    const r = runMatch({ mode: 'cash', n, seed: `c-${n}-${k}`, junk: 0.05, cashHands: 70 });
    assert.ok(r.match.ended, 'the session closed');
    const L = r.summary.ledger;
    assert.equal(L.reduce((a, x) => a + x.net, 0), 0, 'THE LEDGER sums to 0');
    for (const x of L) assert.equal(x.net, x.final - x.buyins);
    assert.ok(L.every(x => x.buyins >= 1000 && x.buyins % 1000 === 0));
    add(r.stats);
    hands += r.stats.hands; rebuys += r.stats.rebuys; joins += r.stats.joins; leaves += r.stats.leaves;
  }
  console.log(`# holdem: 70 cash sessions, ${hands} hands (${rebuys} rebuys, ${joins} joins, ${leaves} leaves) in ${Math.round(performance.now() - t0)} ms`);
  assert.ok(rebuys > 0 && joins > 0 && leaves > 0);
});

test('THE COVERAGE across every sim: thousands of hands, side pots with 3–7 all-ins, heads-up, the clock, AWAY, splits', () => {
  assert.ok(total.hands >= 5000, `${total.hands} hands`);
  for (let n = 3; n <= 7; n++) assert.ok(total.allin[n] > 0, `a hand with ${n} players all in (${JSON.stringify(total.allin)})`);
  assert.ok(total.maxPots >= 4, 'a main pot + 3 side pots at least once');
  assert.ok(total.headsUp > 500, 'heads-up hands');
  assert.ok(total.timeouts > 50 && total.aways > 5, `timeouts ${total.timeouts}, aways ${total.aways}`);
  assert.ok(total.runouts > 100 && total.splits > 10, `run-outs ${total.runouts}, splits ${total.splits}`);
  assert.ok(total.rejected > 1000, `${total.rejected} illegal tries refused`);
  console.log(`# holdem: all-ins per hand ${JSON.stringify(total.allin)}, most pots in a hand ${total.maxPots}`);
});

test('THE SAME SEED REPLAYS to the same match — every chip, every card, every event', () => {
  for (const opts of [
    { mode: 'tournament', speed: 'turbo', n: 6, seed: 'replay-a', junk: 0.05, sleepy: 0.05 },
    { mode: 'tournament', speed: 'deep', n: 3, seed: 'replay-b' },
    { mode: 'cash', n: 5, seed: 'replay-c', cashHands: 40, junk: 0.05 },
  ]) {
    const a = runMatch(opts), b = runMatch(opts);
    assert.equal(JSON.stringify(a.match), JSON.stringify(b.match));
    assert.deepEqual(a.summary, b.summary);
    const c = runMatch({ ...opts, seed: `${opts.seed}-other` });
    assert.notEqual(JSON.stringify(a.match.table.log), JSON.stringify(c.match.table.log), 'another seed, another match');
  }
});

test('the engine never reaches for a clock or Math.random', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  for (const f of readdirSync('js/games/holdem')) {
    const src = readFileSync(`js/games/holdem/${f}`, 'utf8').replace(/\/\/.*$/gm, '');
    assert.ok(!/Math\.random|Date\.now|performance\.now|new Date/.test(src), `${f} reads a clock or Math.random`);
    assert.ok(!/\$|cash ?out|\bowes?\b/i.test(src.replace(/\$\{/g, '')), `${f}: a money word`);
  }
});
