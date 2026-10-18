// RUMRUNNER — rules + whole-match simulations (no network, no Firebase).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GOOD_IDS, DIST_IDS, GOOD, DIST, UPGRADES, START_CASH, START_DEBT, START_CAP, HOME, MS,
  weatherOf, newsOf, pricesOf, firstDay, createState, rollEvents, eventChoices, applyEvent, applyAction, replay, resolveNight,
  standings, verifyDays, matchStory, fortune, tipCost, interestRate, estimateMinutes, stateOnArrival, citySeed, rumoursOf,
} from '../js/games/rum/logic.js';
import { createGame, nextStep } from '../js/games/rum/director.js';
import { playMatch, applyPatch, botDay } from '../js/games/rum/bot.js';
import { extractMatch } from '../js/core/match-report.js';
import * as T from '../js/games/rum/tuning.js';

const P = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));
const SECRET = 's3cret';
const CS = citySeed('m-test', SECRET);
const game0 = (n = 2, days = 20) => createGame({ matchId: 'm-test', participants: P(n), now: 1000, settings: { days, daySec: 45 }, secret: SECRET });

test('the city: prices sit in their ranges with the district tendencies, news moves them, three goods always on sale', () => {
  const g = game0(2, 20);
  for (let d = 1; d <= 20; d++) {
    const w = weatherOf('m-test', d, 20), news = newsOf('m-test', d);
    const p = pricesOf('m-test', d, w, news, {});
    assert.deepEqual(p, pricesOf('m-test', d, w, news, {}), 'deterministic');
    for (const D of DIST_IDS) {
      const on = GOOD_IDS.filter(gd => p[D][gd] > 0);
      assert.ok(on.length >= 3, `${D} day ${d}: at least three goods on sale (${on.length})`);
      for (const gd of GOOD_IDS) {
        if (!p[D][gd]) continue;
        const item = news.find(x => x.dist === D && x.good === gd);
        const lo = GOOD[gd].lo * DIST[D].tend[gd] * (item ? item.m : 1) * 0.8, hi = GOOD[gd].hi * DIST[D].tend[gd] * (item ? item.m : 1) * 1.6;
        assert.ok(p[D][gd] >= lo * 0.9 && p[D][gd] <= hi * 1.1, `${D} ${gd} day ${d}: ${p[D][gd]} within ${lo}–${hi}`);
      }
    }
  }
  assert.equal(weatherOf('m-test', 20, 20), 'dawn', 'the last morning is a dawn');
  assert.ok(g.days[1].at.u0 === HOME && g.days[1].at.u1 === HOME, 'day 1: everyone wakes up in the Old Quarter');
  // the shared market: heavy selling lowers the price, heavy buying raises it, within the clamps
  const w = weatherOf('m-test', 3, 20), news = newsOf('m-test', 3);
  const base = pricesOf('m-test', 3, w, news, {});
  const low = pricesOf('m-test', 3, w, news, { docks: { rum: -0.3 } });
  const high = pricesOf('m-test', 3, w, news, { docks: { rum: 0.3 } });
  const huge = pricesOf('m-test', 3, w, news, { docks: { rum: 9 } });
  assert.ok(low.docks.rum < base.docks.rum && high.docks.rum > base.docks.rum);
  assert.ok(huge.docks.rum <= base.docks.rum * T.MARKET.clampHi + 1, 'clamped');
});

test('weather follows its odds over many days', () => {
  const count = { clear: 0, rain: 0, fog: 0, storm: 0 };
  for (let s = 0; s < 40; s++) for (let d = 1; d < 30; d++) count[weatherOf(`seed${s}`, d, 30)]++;
  const n = 40 * 29;
  for (const w of Object.keys(count)) assert.ok(Math.abs(count[w] / n - T.WEATHER[w].odds) < 0.05, `${w}: ${(count[w] / n).toFixed(2)} vs ${T.WEATHER[w].odds}`);
});

test('a day of actions: every trade, payment, deposit, upgrade and tip-off is checked against the state', () => {
  const S = createState();
  const prices = { shine: 20, rum: 100, gin: 0, whiskey: 1000, cigars: 3000, champ: 8000 };
  assert.equal(applyAction(['t', 'gin', 5], S, prices), null, 'not on sale');
  assert.equal(applyAction(['t', 'rum', Math.floor(START_CASH / 100) + 1], S, prices), null, 'more than you can pay');
  assert.equal(applyAction(['t', 'shine', 101], S, prices), null, 'more than the truck carries');
  assert.ok(applyAction(['t', 'shine', 50], S, prices));
  assert.equal(S.cash, START_CASH - 1000); assert.equal(S.cargo.shine, 50); assert.equal(S.cost.shine, 20);
  assert.ok(applyAction(['t', 'rum', 5], S, prices));
  assert.equal(applyAction(['t', 'rum', -6], S, prices), null, 'can\'t sell what you don\'t have');
  const sale = applyAction(['t', 'rum', -5], { ...S, cargo: { ...S.cargo }, cost: { ...S.cost } }, { ...prices, rum: 150 });
  assert.equal(sale.profit, 250, 'profit on the sale from the average cost');
  assert.equal(S.dist, HOME);
  assert.ok(applyAction(['p', 100], S, prices), 'Vale takes a payment at his office');
  assert.equal(S.debt, START_DEBT - 100);
  assert.ok(applyAction(['s', 200], S, prices), 'the stash in the Old Quarter');
  assert.equal(S.stash, 200);
  const before = S.cash;
  assert.ok(applyAction(['s', 5000], S, prices));
  assert.equal(S.stash, 200 + before, 'a deposit is capped at your cash'); assert.equal(S.cash, 0);
  S.dist = 'docks';
  assert.equal(applyAction(['p', 100], S, prices), null, 'no paying Vale from the Docks');
  assert.equal(applyAction(['s', -10], S, prices), null, 'no stash at the Docks without the warehouse');
  S.upg.warehouse = true;
  assert.ok(applyAction(['s', -(200 + before)], S, prices), 'the warehouse: withdraw anywhere');
  assert.equal(S.stash, 0);
  assert.equal(applyAction(['u', 'truck1'], S, prices), null, 'trucks are sold at the Rail Yard');
  S.dist = 'rail'; S.cash = 100000;
  assert.equal(applyAction(['u', 'truck2'], S, prices), null, 'the freight truck needs the bigger truck first');
  assert.ok(applyAction(['u', 'truck1'], S, prices));
  assert.equal(S.cap, START_CAP + 50);
  assert.ok(applyAction(['u', 'truck2'], S, prices));
  assert.equal(S.cap, START_CAP + 150);
  assert.equal(applyAction(['u', 'truck1'], S, prices), null, 'once');
  const ctx = { uid: 'me', participants: { me: true, you: true }, nw: { you: 100000 }, canTip: true, tipped: false };
  assert.equal(applyAction(['x', 'me'], S, prices, ctx), null, 'not yourself');
  assert.equal(applyAction(['x', 'nobody'], S, prices, ctx), null, 'a player in the match');
  const tip = applyAction(['x', 'you'], S, prices, ctx);
  assert.equal(tip.cost, tipCost(100000));
  assert.equal(applyAction(['x', 'you'], S, prices, ctx), null, 'one tip-off a day');
  assert.equal(applyAction(['x', 'you'], S, prices, { ...ctx, tipped: false, canTip: false }), null, 'none on the last day');
  assert.equal(tipCost(0), T.TIPOFF.min); assert.equal(tipCost(1e9), T.TIPOFF.max);
});

test('events: who they find, what the choices cost, and that the dice were cast before the choice', () => {
  const g = game0(2, 20);
  const seed = g.matchId;
  // day 1, empty truck: never the feds or hijackers
  for (let i = 0; i < 40; i++) {
    const evs = rollEvents(seed, `p${i}`, 1, createState(), g.days[1], 20);
    assert.ok(!evs.some(e => e.t === 'feds' || e.t === 'hijack'), 'nobody is tailed on an empty first morning');
  }
  // a loaded truck at the Docks on a clear night gets tailed fairly often; the same seed always the same events
  const day = { ...g.days[1], w: 'clear', hot: {} };
  let feds = 0;
  for (let i = 0; i < 400; i++) {
    const S = { ...createState(), dist: 'docks', cargo: { rum: 40 }, cost: { rum: 100 } };
    const evs = rollEvents(seed, `q${i}`, 5, S, day, 20);
    assert.deepEqual(evs, rollEvents(seed, `q${i}`, 5, S, day, 20));
    assert.ok(evs.length <= T.EVENTS.maxPerDay);
    if (evs.some(e => e.t === 'feds')) feds++;
  }
  const pFeds = Math.min(1, DIST.docks.feds * T.WEATHER.clear.feds * (T.EVENTS.scale[20] || 1));
  assert.ok(Math.abs(feds / 400 - pFeds) < 0.08, `the feds found ${feds} of 400 loaded trucks at the Docks on a clear night (tuned to ${(pFeds * 100).toFixed(0)} %)`);
  // choices and outcomes
  const prices = g.days[1].p.docks;
  const S = { ...createState(), dist: 'docks', cargo: { rum: 40 }, cost: { rum: 100 }, cash: 50 };
  const ev = { t: 'feds', dice: [0.99, 0.5, 0.5] };
  assert.deepEqual(eventChoices(ev, S, prices), ['run', 'dump'], 'no bribe you can\'t pay');
  let out = applyEvent(ev, 'run', { ...S, cargo: { rum: 40 } }, { w: 'clear' }, prices);
  const seized = Math.ceil(40 * T.FEDS.seize);
  assert.ok(out.caught && out.lost.rum === seized && out.fine >= 0, 'a failed run: a fine and most of the load seized');
  out = applyEvent(ev, 'run', { ...S, cargo: { rum: 40 }, upg: { hidden: true } }, { w: 'clear' }, prices);
  assert.equal(out.lost.rum, Math.ceil(40 * T.FEDS.seize * T.HIDDEN_KEEP), 'hidden compartments: half as much seized');
  out = applyEvent({ t: 'feds', dice: [0.01, 0, 0] }, 'run', { ...S, cargo: { rum: 40 } }, { w: 'fog' }, prices);
  assert.ok(out.ok && !out.lost, 'a clean getaway in the fog');
  const rich = { ...S, cash: 100000, cargo: { rum: 40 } };
  out = applyEvent({ t: 'feds', dice: [0.5, 0, 0] }, 'bribe', rich, { w: 'clear' }, prices);
  assert.ok(out.ok && out.bribe >= T.FEDS.bribeMin && rich.cash === 100000 - out.bribe, 'a bribe that works');
  const dumped = { ...S, cargo: { rum: 40, shine: 5 } };
  out = applyEvent(ev, 'dump', dumped, { w: 'clear' }, prices);
  assert.deepEqual(dumped.cargo, {}, 'dumped it all');
  // hijackers
  out = applyEvent({ t: 'hijack', dice: [0.9, 0, 0] }, 'hand', { ...S, cargo: { rum: 40 } }, day, prices);
  assert.equal(out.lost.rum, Math.ceil(40 * T.HIJACK.share));
  out = applyEvent({ t: 'hijack', dice: [0.9, 0, 0] }, 'floor', { ...S, cargo: { rum: 40 } }, day, prices);
  assert.ok(out.caught && out.lost.rum === Math.ceil(40 * T.HIJACK.share * 2));
  // Vale's men
  const owing = { ...createState(), cash: 10000, debt: 20000 };
  out = applyEvent({ t: 'vale', dice: [0.9, 0, 0] }, 'stall', owing, day, prices);
  const take = Math.max(500, Math.round(10000 * T.EVENTS.vale.take));
  assert.ok(out.took === take && owing.cash === 10000 - take && owing.debt === 22000, 'stalling badly: a share of the cash and 10 % on the debt');
  const payer = { ...createState(), cash: 10000, debt: 4000 };
  out = applyEvent({ t: 'vale', dice: [0.9, 0, 0] }, 'pay', payer, day, prices);
  assert.ok(out.paid === 4000 && payer.debt === 0);
  // a lucky find never overfills the truck
  const full = { ...createState(), cargo: { shine: 95 } };
  out = applyEvent({ t: 'find', good: 'rum', n: 20, dice: [0, 0, 0] }, 'take', full, day, prices);
  assert.equal(out.got, 5);
  // the garage: a discount, only if you can pay
  const poor = { ...createState(), cash: 100 };
  assert.deepEqual(eventChoices({ t: 'garage', id: 'armor' }, poor, prices), ['pass']);
  const buyer = { ...createState(), cash: 100000 };
  out = applyEvent({ t: 'garage', id: 'truck1', dice: [0, 0, 0] }, 'buy', buyer, day, prices);
  assert.equal(out.price, Math.round(UPGRADES.truck1.price * (1 - T.GARAGE_DISCOUNT)));
  assert.equal(buyer.cap, 150);
});

test('arrival: interest compounds, the Heights charge a fee, the crooked cop takes his cut; an unaffordable destination keeps you put', () => {
  let g = game0(1, 20);
  g = applyPatch(g, { 'days/2': { ...g.days[1], at: { u0: 'heights' } } });
  const { S, H } = stateOnArrival(g, 'u0', { 1: { a: [['u', 'cop']] } }, 2);
  // the cop isn't sold in the Old Quarter? it is (quarter, uptown): bought on day 1 for 1500
  assert.equal(H.interest, Math.round(START_DEBT * interestRate(20)));
  assert.equal(H.fee, DIST.heights.fee);
  const left = Math.max(0, START_CASH - UPGRADES.cop.price - DIST.heights.fee);
  assert.equal(H.cop, Math.min(UPGRADES.cop.fee, left), 'the cop takes his fee (or what is left)');
  assert.equal(S.cash, left - Math.min(UPGRADES.cop.fee, left));
  assert.equal(S.dist, 'heights');
  // dest validation in the replay: the Heights need the fee in hand
  const poorLog = { 1: { a: [['p', START_CASH - 100]], dest: 'heights' } };   // paid Vale almost everything
  const R = replay(g, 'u0', poorLog, 1);
  assert.equal(R.hist[0].dest, HOME, 'can\'t afford the drive up the hill: stays');
});

test('the night: arrivals, the market, tip-offs, the books on the last day; replaying it twice writes the same thing', () => {
  let g = game0(3, 15);
  g = { ...g, day: 1, phase: 'night' };
  const p = g.days[1].p.quarter;
  const logs = {
    u0: { 1: { a: [['t', 'shine', 60]], dest: 'docks' } },
    u1: { 1: { a: [['t', 'shine', 60], ['x', 'u0']], dest: 'uptown' } },
    u2: { 1: { a: [], dest: 'nowhere' } },
  };
  const patch = resolveNight(g, logs, SECRET);
  assert.deepEqual(patch, resolveNight(g, logs, SECRET), 'idempotent');
  const d2 = patch['days/2'];
  assert.deepEqual(d2.at, { u0: 'docks', u1: 'uptown', u2: HOME });
  assert.deepEqual(d2.hot, { u0: true }, 'the tipped-off player is hot tomorrow');
  assert.ok(d2.m.quarter.shine > 0, 'heavy buying pushes tomorrow\'s moonshine up in the Old Quarter');
  assert.ok(d2.p.quarter.shine >= pricesOf(CS, 2, d2.w, d2.news, {}).quarter.shine);
  assert.deepEqual(d2.rum, rumoursOf(CS, 2, 15, g.participants), 'the host hands out the rumours');
  assert.equal(patch.nw.u0, fortune(replay(g, 'u0', logs.u0).S));
  assert.equal(patch.nw.u1, START_CASH - 60 * p.shine - tipCost(START_CASH - START_DEBT) - START_DEBT, 'a tip-off costs its price; cargo counts for nothing until it is sold');
  // the final night writes the books and the standings
  let gl = { ...game0(2, 15), day: 15, phase: 'night' };
  for (let d = 2; d <= 15; d++) gl = applyPatch(gl, { [`days/${d}`]: { ...gl.days[1], at: { u0: HOME, u1: HOME }, hot: {}, m: {} } });
  const end = resolveNight(gl, { u0: {}, u1: {} }, SECRET);
  assert.ok(end.books && end.final && end.final.length === 2 && end.final[0].rank === 1 && end.secret === SECRET, 'the books, the standings and the secret, now public');
  assert.equal(end['days/16'], undefined);
});

test('whole matches: 2 and 8 players at 15, 20 and 30 days — standings sorted, the server\'s check passes, forged books fail', () => {
  const strategies8 = { a: 'trader', b: 'careful', c: 'gambler', d: 'random', e: 'idle', f: 'mean', g: 'trader', h: 'careful' };
  for (const days of [15, 20, 30]) {
    for (const strategies of [{ a: 'trader', b: 'careful' }, strategies8]) {
      const { game, fortunes } = playMatch({ matchId: `sim-${days}-${Object.keys(strategies).length}`, settings: { days }, strategies });
      const ranks = game.final.map(r => r.nw);
      for (let i = 1; i < ranks.length; i++) assert.ok(ranks[i - 1] >= ranks[i], 'sorted by fortune');
      assert.ok(verifyDays(game), `${days} days: the public records match the books`);
      if (fortunes.e != null) assert.ok(fortunes.a > fortunes.e || fortunes.b > fortunes.e, 'traders beat idling');
      const story = matchStory(game);
      for (const uid of Object.keys(strategies)) assert.equal(story[uid].fortune, fortunes[uid]);
      // the report: every fortune a record; a tampered book is rejected
      const ex = extractMatch({ ...game, phase: 'final' });
      assert.deepEqual(ex.rejected, []);
      for (const r of game.final) if (r.nw > 0) assert.equal(ex.rows[r.uid].rec[`rum-f${days}`], r.nw);
      const forged = structuredClone(game);
      forged.books.a[3] = { a: [['t', 'champ', -50]], dest: HOME };   // selling champagne it never had
      const ex2 = extractMatch({ ...forged, phase: 'final' });
      assert.ok(ex2.rejected.length >= 1, 'a forged book: rejected');
      const lie = structuredClone(game);
      lie.final[0].nw += 1;
      assert.ok(extractMatch({ ...lie, phase: 'final' }).rejected.length >= 1, 'a forged standing: rejected');
      const hush = structuredClone(game);
      delete hush.secret;
      assert.ok(!verifyDays(hush), 'no secret published: nothing verifies');
    }
  }
});

test('the director: intro → dawn → day → night → … → final; the day ends early when everyone is done; the night waits for the host', () => {
  let g = game0(3, 15);
  const live = { pub: {} };
  const step = (now, online) => nextStep(g, { now, live, online });
  assert.equal(step(1000), null);
  g = applyPatch(g, step(1000 + MS.intro));
  assert.equal(g.phase, 'dawn');
  g = applyPatch(g, step(g.phaseEndsAt));
  assert.equal(g.phase, 'day');
  assert.equal(g.phaseEndsAt - g.phaseStartAt, 45000);
  assert.equal(step(g.phaseStartAt + 1000), null, 'the day runs');
  live.pub = { u0: { done: 1, nw: 0 }, u1: { done: 1, nw: 0 } };
  assert.equal(step(g.phaseStartAt + 1000), null, 'u2 hasn\'t tapped DONE');
  assert.equal(step(g.phaseStartAt + 1000, { u2: false }).phase, 'night', 'an offline player isn\'t waited for');
  live.pub.u2 = { done: 1, nw: 0 };
  g = applyPatch(g, step(g.phaseStartAt + 1000));
  assert.equal(g.phase, 'night');
  assert.equal(step(g.phaseEndsAt + 5000), null, 'nothing until the host wrote tomorrow');
  g = applyPatch(g, resolveNight(g, {}, SECRET));
  assert.equal(step(g.phaseStartAt + 100), null, 'the city sleeps for a beat');
  g = applyPatch(g, step(g.phaseEndsAt));
  assert.equal(g.phase, 'dawn'); assert.equal(g.day, 2); assert.equal(g.dk, '2');
  // to the end
  for (let d = 2; d <= 15; d++) {
    g = applyPatch(g, step(g.phaseEndsAt));
    assert.equal(g.phase, 'day');
    g = applyPatch(g, step(g.phaseEndsAt));
    assert.equal(g.phase, 'night');
    g = applyPatch(g, resolveNight(g, {}, SECRET));
    g = applyPatch(g, step(g.phaseEndsAt));
    assert.equal(g.phase, d < 15 ? 'dawn' : 'final');
  }
  assert.ok(g.final && g.books, 'books and standings written');
  assert.equal(standings(g).length, 3);
  assert.equal(step(1e12), null, 'final is final');
});

test('bots play legal days; estimates are sane', () => {
  const g = { ...game0(2, 20), phase: 'day' };
  for (const s of ['trader', 'careful', 'gambler', 'random', 'idle', 'mean']) {
    const log = botDay(g, 'u0', {}, s);
    const R = replay(g, 'u0', { 1: log }, 1);
    assert.ok(R.valid, `${s}: a legal day`);
  }
  assert.ok(estimateMinutes({ days: 20, daySec: 45 }) >= 12 && estimateMinutes({ days: 20, daySec: 45 }) <= 20);
  assert.ok(estimateMinutes({ days: 15, daySec: 30 }) < estimateMinutes({ days: 30, daySec: 60 }));
});
