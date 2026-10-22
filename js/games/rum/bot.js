// RUMRUNNER — bots (pure): strategies that write a day log from the public day record and their own replayed state, and a
// whole-match simulator on the real rules. Used by the unit tests, the economy sim (scripts/sim-rum.mjs), the preview
// and the E2E (through the view's test hook).
//
// A bot sees what a player sees: today's prices in its own district, its events (rumours included) and the leaderboard.
// The smart ones (trader, careful, gambler, mean) share one engine with different temperaments:
//   · a unit of a good is worth what holding it is worth: an optimal-stopping value over the days left (daily prices are
//     fresh draws), discounted by how fast the bot's money grows otherwise (`grow`)
//   · sell what is priced above that value; buy what is priced well below it (greedy on expected profit, so a cash-poor
//     bot buys cheap goods and a cap-bound one buys champagne)
//   · drive where tomorrow looks best: a few sampled tomorrows per district, played with the same sell/buy rules, minus
//     the road's risk for the load and the Heights' fee, plus rumours and Mr. Balboni
//   · pick the event choice with the best expected value (weighted by the bot's fear of losses)
//   · buy an upgrade when its expected saving (or extra room) over the days left beats its price
import { rngFrom } from '../../core/rng.js';
import * as T from './tuning.js';
import {
  GOOD_IDS, DIST_IDS, GOOD, DIST, START_DEBT, UPGRADES, replay, rollEvents, eventChoices, applyEvent, applyAction, stateOnArrival,
  upgradesHere, upgradePrice, valeHere, defaultChoice, stashHere, units, fortune, tipCost, resolveNight, bribeCost, runOdds, floorOdds, cargoValue,
  interestRate, HOME,
} from './logic.js';
import { createGame } from './director.js';

const mid = g => Math.sqrt(GOOD[g].lo * GOOD[g].hi);
/** What a unit of g is likely worth elsewhere (the best district by tendency, discounted). */
export function expectedElsewhere(g, here) {
  let best = 0;
  for (const D of DIST_IDS) if (D !== here) best = Math.max(best, DIST[D].tend[g] * mid(g) * (DIST[D].fee ? 0.97 : 1));
  return best * 0.9;
}

export const STRATEGIES = ['trader', 'careful', 'gambler', 'random', 'idle', 'mean'];

// temperaments: grow = what a day of the bot's money is worth elsewhere (higher sells sooner); minRatio = the expected
// return it needs to buy; risk = how much the road's losses weigh in its plans; fear = how much a loss weighs in an event;
// reserve = cash it keeps back; trust = how much it believes rumours; upg = how much an upgrade must beat its price by
const PERSONA = {
  trader: { grow: 0.35, quickSell: 1.08, minRatio: 1.06, risk: 0.5, fear: 1.0, reserve: 0, trust: 0.7, upg: 1.3, payAt: 4 },
  careful: { grow: 0.3, quickSell: 1.12, minRatio: 1.12, risk: 1.5, fear: 1.3, reserve: 0.08, trust: 0.5, upg: 1.0, bribeRes: 1.2 },
  gambler: { grow: 0.35, quickSell: 1.05, minRatio: 1.0, risk: 0, fear: 0.7, reserve: 0, trust: 1, upg: 1.6, trucksOnly: true, daring: true, lateVale: true },
  mean: { grow: 0.35, quickSell: 1.08, minRatio: 1.06, risk: 0.5, fear: 1.0, reserve: 0, trust: 0.7, upg: 1.3, payAt: 4 },
};
// the tendency of the districts a bot sells g in: the mean of its two best districts, a little discounted
const TBAR = Object.fromEntries(GOOD_IDS.map(g => { const t = DIST_IDS.map(D => DIST[D].tend[g]).sort((a, b) => b - a); return [g, (t[0] + t[1]) / 2 * 0.97]; }));
const AVAIL = 0.8;                 // the chance a good is on sale where it goes
const AVG_W = Object.values(T.WEATHER).reduce((a, w) => a + w.odds * w.feds, 0);
const AVG_RUN = Object.values(T.WEATHER).reduce((a, w) => a + w.odds * w.run, 0);

// holding value V[k] of one unit of g with k selling days left (optimal stopping on fresh daily prices), per growth rate
const QN = 48;
const VCACHE = new Map();
function holdTable(g, grow) {
  const key = `${g}:${grow}`;
  if (VCACHE.has(key)) return VCACHE.get(key);
  const lo = Math.log(GOOD[g].lo), hi = Math.log(GOOD[g].hi);
  const xs = Array.from({ length: QN }, (_, i) => Math.exp(lo + (i + 0.5) / QN * (hi - lo)) * TBAR[g]);
  const V = [0];
  for (let k = 1; k <= 40; k++) {
    const v = V[k - 1];
    const em = xs.reduce((a, x) => a + Math.max(x, v), 0) / QN;
    V.push((AVAIL * em + (1 - AVAIL) * v) / (1 + grow));
  }
  VCACHE.set(key, V);
  return V;
}
const holdValue = (g, k, P) => holdTable(g, P.grow)[Math.max(0, Math.min(40, k))];

/** Expected share of a load lost (fines included) in one day at district D with upgrades upg. */
function lossRate(D, upg, scale) {
  const keepK = upg.hidden ? T.HIDDEN_KEEP : 1;
  const feds = DIST[D].feds * AVG_W * scale * (upg.cop ? T.UPGRADES.cop.feds : 1);
  const run = Math.min(T.FEDS.runMax, T.FEDS.run + AVG_RUN + (upg.armor ? T.FEDS.armor : 0));
  const runLoss = (1 - run) * (T.FEDS.fineShare + T.FEDS.seize * keepK);
  const bribeLoss = T.FEDS.bribe + (1 - T.FEDS.bribeOdds) * T.FEDS.seize * keepK;
  const floor = Math.min(0.95, T.HIJACK.floor + (upg.armor ? T.HIJACK.armor : 0));
  const hij = DIST[D].hijack * scale * Math.min(T.HIJACK.share, (1 - floor) * 2 * T.HIJACK.share) * keepK;
  return feds * Math.min(runLoss, bribeLoss) + hij;
}
const avgLoss = (upg, scale) => DIST_IDS.reduce((a, D) => a + lossRate(D, upg, scale), 0) / DIST_IDS.length;

/** Greedy buying on expected profit. Returns [[good, n]] and the profit; mutates nothing. */
function planBuys(prices, cash, free, left, P, riskK, rumorK, bk = 0) {
  const out = [];
  let profit = 0;
  const bought = {};
  for (let i = 0; i < 6 && free > 0 && cash > 0; i++) {
    let best = null;
    for (const g of GOOD_IDS) {
      const p = prices[g]; if (!p || bought[g]) continue;
      const exit = holdValue(g, left, P) * riskK * (rumorK[g] || 1);
      if (exit / p < P.minRatio) continue;
      const n = Math.min(free, Math.floor(cash / (p * (1 + bk))));
      if (n < Math.min(3, free)) continue;                 // a unit or two: one bad night (losses round up) takes it all
      const pr = n * (exit - p);
      if (!best || pr > best.pr) best = { g, n, pr, p };
    }
    if (!best) break;
    out.push([best.g, best.n]); bought[best.g] = true;
    profit += best.pr; cash -= best.n * best.p * (1 + bk); free -= best.n;
  }
  return { out, profit };
}

/**
 * One day's log for a bot. game: the public game; logs: the bot's own logs so far; flags (sim only): noUpg, allUpg,
 * noHeights — variants of a strategy that price the upgrades and the Heights.
 */
export function botDay(game, uid, logs, strategy, seedExtra = '', flags = {}) {
  flags = flags || {};
  const d = game.day, days = game.settings.days, day = game.days[d];
  const r = rngFrom(`${game.matchId}:bot:${uid}:${d}:${seedExtra}`);
  const { S } = stateOnArrival(game, uid, logs, d);
  const prices = (day.p && day.p[S.dist]) || {};
  const evs = rollEvents(game.matchId, uid, d, S, day, days);
  const log = { ev: {}, a: [], dest: S.dist };
  if (strategy === 'idle') { evs.forEach((ev, i) => { log.ev[i] = defaultChoice(ev, S, prices); applyEvent(ev, log.ev[i], S, day, prices); }); return log; }
  const P = flags.persona ? { ...(PERSONA[strategy] || PERSONA.trader), ...flags.persona } : PERSONA[strategy] || PERSONA.trader;
  const scale = T.EVENTS.scale[days] || 1;
  const left = days - d;                                     // selling days after today
  const rumors = [];
  const wantsUpg = (id, cash) => {
    if (flags.noUpg) return false;
    if (flags.allUpg) return true;
    if (P.trucksOnly && !id.startsWith('truck')) return false;
    return upgradeWorth(id, S, cash, left, P, scale) > 0;
  };
  evs.forEach((ev, i) => {
    const c = eventChoices(ev, S, prices);
    let pick = c[0];
    if (strategy === 'random') pick = c[Math.floor(r() * c.length)];
    else if (ev.t === 'feds') {
      // what each choice is expected to cost: the load at what holding it is worth, the fine, the bribe
      const v = GOOD_IDS.reduce((a, g) => a + (S.cargo[g] || 0) * Math.max(prices[g] || 0, holdValue(g, left, P)), 0);
      const k = S.upg.hidden ? T.HIDDEN_KEEP : 1, cv = cargoValue(S, prices);
      const odds = runOdds(S, day.w);
      const run = (1 - odds) * (Math.min(S.cash, T.FEDS.fineBase + cv * T.FEDS.fineShare) + v * T.FEDS.seize * k) * P.fear;
      const bribe = c.includes('bribe') ? bribeCost(S, prices) + (1 - T.FEDS.bribeOdds) * v * T.FEDS.seize * k * P.fear : Infinity;
      if (P.daring) pick = 'run';
      else pick = bribe < run ? 'bribe' : run < v ? 'run' : 'dump';
    } else if (ev.t === 'vale') {
      // paying moves cash onto the debt (the fortune is unchanged); stalling risks a cut of the cash and 10 % more debt
      if (flags.noPay) pick = 'stall';
      else if (strategy === 'careful') pick = 'pay';
      else if (P.lateVale) pick = d > days * 0.6 && S.cash >= S.debt ? 'pay' : 'stall';
      else pick = S.cash >= S.debt * 1.2 || left <= 2 ? 'pay' : 'stall';
    } else if (ev.t === 'hijack') {
      const k = S.upg.hidden ? T.HIDDEN_KEEP : 1;
      const floor = (1 - floorOdds(S)) * 2 * T.HIJACK.share * k * P.fear;
      pick = P.daring || floor < T.HIJACK.share * k ? 'floor' : 'hand';
    } else if (ev.t === 'garage') {
      pick = c.includes('buy') && wantsUpg(ev.id, S.cash - upgradePrice(ev.id, T.GARAGE_DISCOUNT)) ? 'buy' : 'pass';
    } else if (ev.t === 'rumor') rumors.push(ev);
    log.ev[i] = pick;
    applyEvent(ev, pick, S, day, prices);
  });
  const ctx = { uid, participants: game.participants, nw: (game.nwh && game.nwh[d - 1]) || null, canTip: d < days, tipped: false };
  const act = a => { const rec = applyAction(a, S, prices, ctx); if (rec) log.a.push(a); return rec; };
  if (strategy === 'random') {
    for (let i = 0; i < 3; i++) {
      const g = GOOD_IDS[Math.floor(r() * 6)];
      if (r() < 0.5 && S.cargo[g]) act(['t', g, -Math.ceil(S.cargo[g] * r())]);
      else if (prices[g]) act(['t', g, Math.max(1, Math.floor(Math.min(S.cap - units(S), S.cash / prices[g]) * r()))]);
    }
    if (valeHere(S) && r() < 0.5) act(['p', Math.floor(S.cash * r())]);
    log.dest = DIST_IDS[Math.floor(r() * 6)];
    return log;
  }
  // a rumoured spike tomorrow (wherever) makes a good worth more to hold; a crash, less
  const rumorK = {};
  for (const x of rumors) rumorK[x.good] = x.k === 'spike' ? 1 + P.trust * 0.6 : 1;
  // sell: whatever is priced above what holding it is worth
  for (const g of GOOD_IDS) {
    const n = S.cargo[g] || 0; if (!n || !prices[g]) continue;
    const quick = P.quickSell && S.cost[g] > 0 && prices[g] >= S.cost[g] * P.quickSell;   // thin margins: any profit will do
    if (quick || prices[g] >= holdValue(g, left, P) * (left ? rumorK[g] || 1 : 1)) act(['t', g, -n]);
  }
  // Mr. Balboni (at home): pay once the cash can spare it, and before his men come calling
  const overdueAt = Math.ceil(days * T.EVENTS.vale.overdue);
  if (valeHere(S) && S.debt > 0 && !flags.noPay) {
    let pay = 0;
    if (strategy === 'careful') pay = S.cash >= S.debt ? S.debt : d >= 3 ? Math.floor(S.cash * 0.6) : 0;
    else if (P.lateVale) pay = d > days * 0.6 ? S.cash : 0;
    else if (S.cash >= S.debt * (P.payAt || 2) || left <= 1 || (d >= overdueAt - 1 && S.cash >= S.debt)) pay = S.debt;
    if (pay > 0) act(['p', Math.min(S.debt, pay)]);
  }
  // upgrades
  for (const id of upgradesHere(S, S.dist)) {
    const price = upgradePrice(id);
    if (S.cash >= price && wantsUpg(id, S.cash - price)) act(['u', id]);
  }
  // the stash: the careful bot banks some of what it has (out of reach of fines and Balboni's men)
  if (strategy === 'careful' && stashHere(S)) {
    if (d < days && S.cash > 40000) act(['s', Math.floor(S.cash * 0.2)]);
    if (d >= days && S.stash > 0) act(['s', -S.stash]);
  }
  // the mean bot tips off the feds on the leader
  if (strategy === 'mean' && ctx.nw && d < days) {
    const lead = Object.entries(ctx.nw).filter(([u]) => u !== uid).sort((a, b) => b[1] - a[1])[0];
    if (lead && lead[1] > (ctx.nw[uid] || 0) && S.cash > tipCost(lead[1]) * 8) act(['x', lead[0]]);
  }
  // buy (never on the last day: unsold cargo is worth nothing)
  if (d < days) {
    const fee = (S.upg.cop ? UPGRADES.cop.fee : 0) + (S.cash > 3000 ? DIST.heights.fee : 0);
    const reserve = Math.min(S.cash * P.reserve, 8000) + fee;
    const riskK = 1 - avgLoss(S.upg, scale) * P.risk;
    // a bribe needs cash on hand when the feds pull you over: the cautious keep it back from the buying
    const bk = (P.bribeRes || 0) * T.FEDS.bribe;
    const budget = S.cash - reserve - (bk ? Math.max(T.FEDS.bribeMin, bk * cargoValue(S, prices)) : 0) - (P.keepMin || 0);
    const plan = planBuys(prices, budget, S.cap - units(S), left, P, riskK, rumorK, bk);
    for (const [g, n] of plan.out) act(['t', g, n]);
    log.dest = destination(S, left, P, rumors, scale, days, d, flags, r, wantsUpg);
  }
  return log;
}

/** The expected value of buying upgrade id now (positive: worth it), for a bot with `cash` left after paying. */
function upgradeWorth(id, S, cash, left, P, scale) {
  const U = UPGRADES[id], price = upgradePrice(id);
  if (left < 2 || id === 'warehouse') return -1;              // a stash anywhere: only Balboni's men and fines care
  const load = Math.max(0, cash) + cargoValue(S, null);       // what the truck carries, roughly
  if (U.cap && P.truckAt) return cash >= price * (P.truckAt - 1) ? 1 : -1;
  if (U.cap) {
    // more room pays once the money outgrows the truck: each new slot carries a unit worth load/cap, earning ~ a
    // quarter of its value per round trip (every other day)
    const perUnit = Math.min(load / S.cap, mid('champ'));
    return U.cap * perUnit * 0.25 * (left / 2) * Math.min(1, perUnit / mid('whiskey')) - price * P.upg;
  }
  const with_ = { ...S.upg, [id]: true };
  const carried = Math.min(load, S.cap * mid('champ'));
  const saved = (avgLoss(S.upg, scale) - avgLoss(with_, scale)) * carried * left * 0.8;
  return saved - (U.fee || 0) * left - price * P.upg;
}

/** Where to drive tonight: a few sampled tomorrows per district, played with the bot's own rules. */
function destination(S, left, P, rumors, scale, days, d, flags, r, wantsUpg) {
  const k1 = left - 1;                                        // selling days after tomorrow
  const held = GOOD_IDS.reduce((a, g) => a + (S.cargo[g] || 0) * holdValue(g, left, P), 0);
  const riskK = 1 - avgLoss(S.upg, scale) * P.risk;
  const K = 10;
  let best = S.dist, bestV = -Infinity;
  for (const D of DIST_IDS) {
    if (flags.noHeights && D === 'heights') continue;
    const Dd = DIST[D];
    if (Dd.fee && D !== S.dist && S.cash < Dd.fee) continue;  // the fee must be payable tonight
    let tot = 0;
    for (let s = 0; s < K; s++) {
      const prices = {};
      for (const g of GOOD_IDS) {
        const u = (s + r()) / K;                               // stratified draws
        let p = Math.exp(Math.log(GOOD[g].lo) + u * Math.log(GOOD[g].hi / GOOD[g].lo)) * Dd.tend[g];
        for (const x of rumors) if (x.dist === D && x.good === g && r() < P.trust) p *= x.k === 'spike' ? 4 : 0.33;
        prices[g] = r() < Dd.avail ? p : 0;
      }
      let cash = S.cash - (Dd.fee && D !== S.dist ? Dd.fee : 0), free = S.cap - units(S), v = 0;
      for (const g of GOOD_IDS) {
        const n = S.cargo[g] || 0; if (!n || !prices[g]) continue;
        const hv = holdValue(g, k1, P);
        if (prices[g] >= hv) { v += n * (prices[g] - hv); cash += n * prices[g]; free += n; }
      }
      if (k1 >= 1) v += planBuys(prices, cash, free, k1, P, riskK, {}, (P.bribeRes || 0) * T.FEDS.bribe).profit;
      tot += v;
    }
    let v = tot / K;
    v -= lossRate(D, S.upg, scale) * held * P.risk;           // the road's risk for the load
    if (Dd.fee && D !== S.dist) v -= Dd.fee;
    // Mr. Balboni: a visit home once his men are due and the cash can cover him
    if (D === HOME && S.debt > 0 && !flags.noPay && !(P.lateVale && d < days * 0.55)) {
      const overdueAt = Math.ceil(days * T.EVENTS.vale.overdue);
      const liquid = S.cash + held;
      if (d + 1 >= overdueAt - 1 && liquid >= S.debt) v += S.debt * 0.1 + liquid * 0.06 * Math.min(left, 4);
      else if (liquid >= S.debt * (P.payAt || 2)) v += S.debt * interestRate(days) * Math.min(left, 5);
    }
    // a garage worth visiting: an upgrade the bot wants and can pay for tomorrow
    if (D !== S.dist && left >= 3) {
      for (const id of upgradesHere(S, D)) {
        const price = upgradePrice(id);
        if (S.cash + held * 0.9 >= price * 1.3 && wantsUpg(id, S.cash + held * 0.9 - price)) { v += price * 0.5; break; }
      }
    }
    if (D === S.dist) v *= v > 0 ? 0.92 : 1.08;                // today's market is picked over
    if (v > bestV) { bestV = v; best = D; }
  }
  return best;
}

/** Plays a whole match on the pure rules. strategies: { uid: name }; flags: { uid: { noUpg|allUpg|noHeights } } (sim). */
export function playMatch({ matchId = 'sim', settings = {}, strategies, seedExtra = '', flags = {}, secret = 'sim-secret' }) {
  const participants = Object.fromEntries(Object.keys(strategies).map(u => [u, true]));
  let game = createGame({ matchId, participants, now: 0, settings, secret });
  const logs = Object.fromEntries(Object.keys(strategies).map(u => [u, {}]));
  for (let d = 1; d <= game.settings.days; d++) {
    game = { ...game, day: d, phase: 'day' };
    for (const [uid, strat] of Object.entries(strategies)) logs[uid][d] = botDay(game, uid, logs[uid], strat, seedExtra, flags[uid]);
    game = { ...game, phase: 'night' };
    game = applyPatch(game, resolveNight(game, logs, secret));
  }
  game = { ...game, phase: 'final' };
  return { game, logs, standings: game.final, fortunes: Object.fromEntries(game.final.map(r => [r.uid, r.nw])) };
}

export function applyPatch(obj, patch) {
  const out = structuredClone(obj);
  for (const [k, v] of Object.entries(patch)) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = out;
    for (const p of parts.slice(0, -1)) o = (o[p] ??= {});
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = structuredClone(v);
  }
  return out;
}
export { fortune, replay, START_DEBT };
