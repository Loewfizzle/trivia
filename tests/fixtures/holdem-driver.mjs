// HOLD'EM (HE1) — THE SIM DRIVER: plays whole matches with THE TEST ROBOTS (holdem-bots.mjs) on the real pure engine,
// checking THE INVARIANTS after EVERY action (tests/holdem-sim.test.mjs) or timing them like real people
// (scripts/holdem-sim.mjs — the match-length study). Deterministic: one seed → one match, every time.
import assert from 'node:assert/strict';
import { rngFrom } from '../../js/core/rng.js';
import { createMatch, nextHand, act, rebuy, join, leave, endSession, chipCount, summary } from '../../js/games/holdem/match.js';
import { legalActions, running, seatAt } from '../../js/games/holdem/table.js';
import { publicView, seatView } from '../../js/games/holdem/views.js';
import { decide, junkAction, STYLES } from './holdem-bots.mjs';

/** THE PACE (the length study): a deal, each street's reveal, the end of a hand, a decision. */
export const PACE = { deal: 4000, street: 1500, end: 4000, showdown: 6000, thinkMin: 3000, thinkMax: 8000 };

/** Every string anywhere in a value (keys + values), for the leak scan. */
function strings(v, out = []) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) for (const x of v) strings(x, out);
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { out.push(k); strings(x, out); }
  return out;
}

/** publicView must never hold an unshown hole card or the deck (the views' contract). */
export function assertNoLeak(table) {
  const hidden = new Set(table.seats.filter(x => !x.shown).flatMap(x => x.cards));
  const v = publicView(table);
  assert.equal(v.deck, undefined, 'the deck in a public view');
  for (const s of strings(v)) if (hidden.has(s)) assert.fail(`publicView leaks the hidden card ${s} (hand ${table.hand}, ${table.street})`);
}

export function assertSane(m) {
  const c = chipCount(m);
  assert.ok(c.ok, `chips not conserved: ${JSON.stringify(c)}`);
  for (const x of m.table.seats) {
    assert.ok(x.stack >= 0 && x.bet >= 0 && x.total >= 0, `negative chips at ${x.id}`);
    assert.ok(Number.isInteger(x.stack) && Number.isInteger(x.total), `a fraction of a chip at ${x.id}`);
  }
}

/**
 * runMatch(opts) → { match, summary, stats }
 *   mode 'tournament' | 'cash', speed, n players, seed, styles (per seat; default a seeded mix),
 *   check (the invariants every action), junk (0..1 — an illegal try before an action), sleepy (0..1 — a robot
 *   lets the clock run out: tournament), paced (the PACE timing), cashHands (CASH: end the session after N hands),
 *   maxHands (a safety stop).
 */
export function runMatch({
  mode = 'tournament', speed = 'turbo', n = 6, seed = 'sim', styles, check = true, junk = 0, sleepy = 0,
  paced = false, cashHands = 60, maxHands = 5000, start = 1_800_000_000_000, levelMs = null,
} = {}) {
  const rng = rngFrom(`${seed}:table`), deckRng = rngFrom(`${seed}:deck`);
  const ids = Array.from({ length: n }, (_, i) => `p${i + 1}`);
  const style = {};
  ids.forEach((id, i) => { style[id] = styles?.[i] || STYLES[Math.floor(rng() * STYLES.length)]; });
  const brains = {};
  const brain = id => (brains[id] ||= rngFrom(`${seed}:${id}`));
  let now = start;
  let m = createMatch({ mode, speed, players: ids, now });
  if (levelMs) m.levelMs = levelMs;                       // the length study's "what if" (scripts/holdem-sim.mjs --turbo)
  const stats = { hands: 0, actions: 0, rejected: 0, maxAllins: 0, allinHist: {}, maxPots: 0, headsUp: 0, timeouts: 0, aways: 0, runouts: 0, splits: 0, rebuys: 0, joins: 0, leaves: 0, satOut: 0 };
  const step = r => {
    assert.equal(r.error, undefined, `refused: ${r.error}`);
    m = r.match;
    stats.actions++;
    for (const e of r.events) {
      if (e.t === 'street' && paced) now += PACE.street;
      if (e.t === 'timeout') stats.timeouts++;
      if (e.t === 'away') stats.aways++;
      if (e.t === 'runout') stats.runouts++;
      if (e.t === 'pot' && e.winners.length > 1) stats.splits++;
    }
    if (check) { assertSane(m); assertNoLeak(m.table); }
  };
  let nextJoin = n + 1;
  const doze = {};
  while (!m.ended && stats.hands < maxHands) {
    if (mode === 'cash') {
      if (stats.hands >= cashHands) { step(endSession(m, now)); break; }
      for (const x of m.table.seats) if (x.stack === 0 && rng() < 0.7) { step(rebuy(m, x.id, now)); stats.rebuys++; }
      if (m.table.seats.length < 8 && rng() < 0.06) { step(join(m, `p${nextJoin++}`, now)); stats.joins++; }
      if (m.table.seats.length > 2 && rng() < 0.03) { step(leave(m, m.table.seats[Math.floor(rng() * m.table.seats.length)].id, now)); stats.leaves++; }
      if (m.table.seats.filter(x => x.stack > 0).length < 2) { step(endSession(m, now)); break; }
      // (HE2 — CASH: AWAY = SAT OUT; a table with fewer than 2 dealable waits — here someone sits back at once)
      if (m.table.seats.filter(x => x.stack > 0 && !x.away).length < 2) for (const x of m.table.seats) if (x.away && x.stack > 0) { step(act(m, { id: x.id, type: 'back' }, now)); break; }
    }
    if (paced) now += PACE.deal;
    const h = nextHand(m, { rng: deckRng, now });
    step(h);
    stats.hands++;
    const t0 = m.table;
    // (HE2 — CASH: a SAT OUT seat is never dealt in + never posts)
    for (const x of t0.seats) if (x.status === 'sitout' && x.away) {
      stats.satOut++;
      assert.ok(!t0.log.some(e => (e.t === 'posted' && e.id === x.id) || (e.t === 'dealt' && e.ids.includes(x.id))), `sat-out ${x.id} was dealt / posted`);
    }
    if (h.events.find(e => e.t === 'dealt')?.heads) {
      stats.headsUp++;
      assert.equal(t0.sbSeat, t0.button, 'HEADS-UP: the button posts the small blind');
      if (t0.turn != null && seatAt(t0, t0.button).status === 'in' && seatAt(t0, t0.bbSeat).status === 'in') assert.equal(t0.turn, t0.button, 'HEADS-UP: the button acts first before the flop');
    }
    let guard = 0;
    while (running(m.table)) {
      assert.ok(++guard < 400, 'a hand that never ends');
      const L = legalActions(m.table);
      assert.ok(L, 'a running hand with nobody to act');
      if (mode === 'cash' && rng() < 0.002) {             // a player leaves mid-hand
        step(leave(m, m.table.seats[Math.floor(rng() * m.table.seats.length)].id, now)); stats.leaves++;
        continue;
      }
      if (mode === 'cash' && rng() < 0.001) {             // the host ends the session mid-hand
        step(endSession(m, now, { voidHand: rng() < 0.5 }));
        if (!m.ended) {                                   // pending: it closes when the hand ends — play it out
          assert.ok(m.ending);
          while (running(m.table)) { const L2 = legalActions(m.table); step(act(m, decide(seatView(m.table, L2.id), L2, brain(L2.id), style[L2.id]), now += 1000)); }
          assert.ok(m.ended, 'a pending end closes with its hand');
        }
        break;
      }
      if (junk && rng() < junk) {
        const bad = junkAction(seatView(m.table, L.id), L, rng);
        const r = act(m, bad, now);
        assert.ok(r.error, `an illegal action was applied: ${JSON.stringify(bad)}`);
        assert.equal(r.match, m, 'a refusal returns the same match');
        stats.rejected++;
      }
      if (m.table.clock && sleepy && (doze[L.id] > 0 || rng() < sleepy)) {   // a robot dozes off for a few turns
        if (!(doze[L.id] > 0)) doze[L.id] = 2 + Math.floor(rng() * 4);
        doze[L.id] -= 1;
        now = Math.max(now, m.table.deadline);                       // the clock runs out (the bank first, once)
        step(act(m, { type: 'timeout' }, now));
        continue;
      }
      now += paced ? PACE.thinkMin + Math.floor(brain(L.id)() * (PACE.thinkMax - PACE.thinkMin)) : 1000;
      if (m.table.clock && now > m.table.deadline) now = m.table.deadline;   // a real player acts inside the clock
      step(act(m, decide(seatView(m.table, L.id), L, brain(L.id), style[L.id]), now));
    }
    if (m.ended) break;
    const t = m.table;
    if (t.result) {
      const allins = new Set(t.log.filter(e => e.t === 'allin' || (e.t === 'posted' && e.allin)).map(e => e.id)).size;
      stats.maxAllins = Math.max(stats.maxAllins, allins);
      stats.allinHist[allins] = (stats.allinHist[allins] || 0) + 1;
      stats.maxPots = Math.max(stats.maxPots, t.result.pots.length);
      if (paced) now += t.result.byFold ? PACE.end : PACE.showdown;
    }
    // an AWAY player comes back now and then
    for (const x of t.seats) if (x.away && rng() < 0.3) step(act(m, { id: x.id, type: 'back' }, now));
  }
  if (!m.ended && mode === 'cash') step(endSession(m, now, { voidHand: true }));
  return { match: m, summary: summary(m), stats, ms: now - start, styles: style };
}
