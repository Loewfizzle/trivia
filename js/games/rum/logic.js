// RUMRUNNER — the pure rules. No DOM, no Firebase: the same code runs in every phone, in the host's night resolution and in
// the server's result check (core/match-report.js).
//
// The idea: everything that happens to a player is DERIVED by replaying their private day logs against the public day
// records (prices, weather, news, arrivals) with seeded dice. A log says only what the player chose — which option in an
// event, which trades in which order, how much they paid Balboni, what they stashed, what they bought, whom they tipped off,
// where they drive next. The dice for their events are seeded by (match, player, day), so the outcome of "RUN" was decided
// before they chose it, and anyone (another client that became host, the server) replays the same match to the cent.
//
//   day record  game.days[d] = { w, f, news[], p: { dist: { good: price|0 } }, at: { uid: dist }, hot: { uid: true } }
//   day log     rrp/{code}/{m}/{uid}/{d} = { ev: { i: choice }, a: [[type, ...args]], dest, at }
//                 a: ['t', good, ±units] trade · ['p', amount] pay Balboni · ['s', ±amount] stash · ['u', id] upgrade · ['x', uid] tip off
//   state       { cash, stash, debt, cargo: { good: units }, cost: { good: avg paid }, cap, upg: { id: true }, dist }
//
// Two seeds: the CITY seed (matchId + a per-match secret only the host holds until the final — prices, news, weather and
// the rumours the host hands out, so nobody can read tomorrow's spikes in advance) and the MATCH id alone for a player's
// event dice (so each phone can roll and show its own events without the host; a player can read their own dice in
// devtools, which is the price of host-free events — the big edge, future prices, is hidden).
import { rngFrom, hashString } from '../../core/rng.js';
import * as T from './tuning.js';

export const { START_CASH, START_DEBT, START_CAP, LENGTHS, GOODS, DISTRICTS, UPGRADES } = T;
export const GOOD_IDS = GOODS.map(g => g[0]);
export const DIST_IDS = DISTRICTS.map(d => d.id);
export const GOOD = Object.fromEntries(GOODS.map(([id, name, lo, hi]) => [id, { id, name, lo, hi }]));
export const DIST = Object.fromEntries(DISTRICTS.map(d => [d.id, d]));
export const WEATHERS = ['clear', 'rain', 'fog', 'storm'];
export const HOME = 'quarter';                      // day 1: everyone wakes up in the Old Quarter, owing Mr. Balboni
export const DEFAULT_SETTINGS = { days: 20, daySec: 45 };
export const MS = { intro: 5200, dawn: 7200, dawn1: 5200, night: 3600 };
export const MAX_ACTS = 60;                        // actions a day (the rules allow two digits; the view refuses past this)
export const GARAGE_DISCOUNT = T.GARAGE_DISCOUNT;
export const citySeed = (matchId, secret) => `${matchId}:${secret || ''}`;
const IMPORTED = ['rum', 'cigars', 'champ'];        // what a storm delays at the Docks and the Rail Yard

export const sum = o => Object.values(o || {}).reduce((a, b) => a + (b || 0), 0);
export const units = S => sum(S.cargo);
export const fortune = S => S.cash + S.stash - S.debt;
export const interestRate = days => T.INTEREST[days] || T.INTEREST[20];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (r, a, b) => a + r() * (b - a);
const r2 = x => Math.round(x);

export function createState() {
  return { cash: START_CASH, stash: 0, debt: START_DEBT, cargo: {}, cost: {}, cap: START_CAP, upg: {}, dist: HOME };
}

// ---------------------------------------------------------------- the city's day: weather, news, prices (seed only + market)
export function weatherOf(seed, d, days) {
  if (d >= days) return 'dawn';                     // the final morning: a blue-gold dawn
  const r = rngFrom(`${seed}:w:${d}`)();
  let acc = 0;
  for (const w of WEATHERS) { acc += T.WEATHER[w].odds; if (r < acc) return w; }
  return 'clear';
}
export const weatherFx = w => T.WEATHER[w] || { feds: 1.1, run: -0.05 };   // dawn: a clear morning

export function newsOf(seed, d) {
  const r = rngFrom(`${seed}:n:${d}`);
  const n = T.NEWS.perDay[Math.floor(r() * T.NEWS.perDay.length)];
  const out = [];
  for (let i = 0; i < n; i++) {
    const dist = DIST_IDS[Math.floor(r() * DIST_IDS.length)];
    const good = GOOD_IDS[Math.floor(r() * GOOD_IDS.length)];
    if (out.some(x => x.dist === dist && x.good === good)) continue;
    const spike = r() < T.NEWS.spikeShare;
    const m = spike ? rnd(r, T.NEWS.spike[0], T.NEWS.spike[1]) : rnd(r, T.NEWS.crash[0], T.NEWS.crash[1]);
    out.push({ dist, good, k: spike ? 'spike' : 'crash', m: Math.round(m * 100) / 100 });
  }
  return out;
}

/** Today's prices everywhere. mkt: { dist: { good: impact } } (the shared market, from yesterday's trades). */
export function pricesOf(seed, d, w, news, mkt = {}) {
  const p = {};
  const base = {};
  for (const g of GOOD_IDS) { const r = rngFrom(`${seed}:p:${d}:${g}`)(); base[g] = Math.exp(lerp(Math.log(GOOD[g].lo), Math.log(GOOD[g].hi), r)); }
  const fx = weatherFx(w);
  for (const D of DISTRICTS) {
    const row = {};
    const r = rngFrom(`${seed}:a:${d}:${D.id}`);
    const on = {};
    for (const g of GOOD_IDS) on[g] = r() < D.avail;
    const wild = D.wild ? GOOD_IDS.map(() => Math.exp(rnd(r, -D.wild, D.wild))) : null;
    for (const item of news) if (item.dist === D.id) on[item.good] = true;
    // never a dead market: at least three goods on sale (the cheapest first)
    let k = 0;
    for (const g of GOOD_IDS) { if (GOOD_IDS.filter(x => on[x]).length >= 3) break; on[g] = true; k++; }
    GOOD_IDS.forEach((g, i) => {
      if (!on[g]) { row[g] = 0; return; }
      let v = base[g] * D.tend[g];
      if (wild) v *= wild[i];
      if (fx.delay && IMPORTED.includes(g) && (D.id === 'docks' || D.id === 'rail')) v *= fx.delay;
      for (const item of news) if (item.dist === D.id && item.good === g) v *= item.m;
      const imp = (mkt[D.id] && mkt[D.id][g]) || 0;
      v *= clamp(1 + imp, T.MARKET.clampLo, T.MARKET.clampHi);
      row[g] = Math.max(1, r2(v));
    });
    p[D.id] = row;
  }
  return p;
}

/** The rumours the host hands out on day d (whispers about day d+1's news), one per player; true RUMOR_TRUE of the time. */
export function rumoursOf(seed, d, days, participants) {
  if (d >= days) return {};
  const tomorrow = newsOf(seed, d + 1);
  if (!tomorrow.length) return {};
  const out = {};
  for (const uid of Object.keys(participants || {})) {
    const r = rngFrom(`${seed}:r:${uid}:${d}`);
    const real = tomorrow[Math.floor(r() * tomorrow.length)];
    let rum = { dist: real.dist, good: real.good, k: real.k };
    if (r() >= T.RUMOR_TRUE) {
      rum = { dist: DIST_IDS[Math.floor(r() * DIST_IDS.length)], good: GOOD_IDS[Math.floor(r() * GOOD_IDS.length)], k: r() < 0.5 ? 'spike' : 'crash' };
      if (rum.dist === real.dist && rum.good === real.good) rum.k = real.k === 'spike' ? 'crash' : 'spike';
    }
    out[uid] = rum;
  }
  return out;
}

/** The first day record (everyone at home, nothing moved yet). seed: citySeed(matchId, secret). */
export function firstDay(seed, days, participants) {
  const w = weatherOf(seed, 1, days);
  const news = newsOf(seed, 1);
  return { w, f: weatherOf(seed, 2, days), news, p: pricesOf(seed, 1, w, news, {}), at: Object.fromEntries(Object.keys(participants).map(u => [u, HOME])), hot: {}, m: {}, rum: rumoursOf(seed, 1, days, participants) };
}

// ---------------------------------------------------------------- a player's day
export const cargoValue = (S, prices) => GOOD_IDS.reduce((a, g) => a + (S.cargo[g] || 0) * (prices && prices[g] ? prices[g] : Math.sqrt(GOOD[g].lo * GOOD[g].hi)), 0);
export const tipCost = targetFortune => clamp(Math.round(Math.max(0, targetFortune) * T.TIPOFF.share), T.TIPOFF.min, T.TIPOFF.max);
export const upgradePrice = (id, discount = 0) => Math.round(UPGRADES[id].price * (1 - discount));
export const canBuyHere = (S, id, dist) => !!UPGRADES[id] && !S.upg[id] && UPGRADES[id].at.includes(dist) && (!UPGRADES[id].needs || !!S.upg[UPGRADES[id].needs]);
export const upgradesHere = (S, dist) => Object.keys(UPGRADES).filter(id => canBuyHere(S, id, dist));
export const valeHere = S => S.dist === HOME;
export const stashHere = S => S.dist === HOME || !!S.upg.warehouse;

/**
 * The events waiting for a player as they arrive on day d (≤ 2), with their dice already rolled.
 * Pure in (seed, uid, d, state on arrival, the day record, the match length, tomorrow's news for rumours).
 */
export function rollEvents(seed, uid, d, S, day, days) {
  const r = rngFrom(`${seed}:e:${uid}:${d}`);
  const rumour = day.rum && day.rum[uid];
  const scale = T.EVENTS.scale[days] || 1;
  const out = [];
  const dice = () => [r(), r(), r()];
  const D = DIST[S.dist];
  const fx = weatherFx(day.w);
  const carrying = units(S) > 0;
  // Mr. Balboni's men: the debt is too high, or overdue
  const V = T.EVENTS.vale;
  const overdue = S.debt > 0 && (S.debt > V.over * START_DEBT || d > Math.ceil(days * V.overdue));
  const rv = r();
  if (overdue && rv < V.chance) out.push({ t: 'vale', dice: dice() });
  // the feds (only with something to find)
  let feds = D.feds * fx.feds * scale * (S.upg.cop ? T.UPGRADES.cop.feds : 1) + ((day.hot && day.hot[uid]) ? T.EVENTS.tip : 0);
  const rf = r();
  if (carrying && d > 1 && rf < feds) out.push({ t: 'feds', dice: dice() });
  // hijackers
  const rh = r();
  if (carrying && d > 1 && rh < D.hijack * scale && out.length < T.EVENTS.maxPerDay) out.push({ t: 'hijack', dice: dice() });
  // one of the softer ones
  const rs = r();
  if (out.length < T.EVENTS.maxPerDay) {
    const pFind = T.EVENTS.find * scale, pRum = rumour && d < days ? T.EVENTS.rumor * scale : 0, pGar = T.EVENTS.garage * scale;
    if (rs < pFind) {
      const wheel = [['shine', 0.35], ['rum', 0.3], ['gin', 0.2], ['whiskey', 0.1], ['cigars', 0.04], ['champ', 0.01]];
      let x = r(), good = 'shine';
      for (const [g, w] of wheel) { x -= w; if (x <= 0) { good = g; break; } }
      out.push({ t: 'find', good, n: Math.round(rnd(r, T.FIND.units[0], T.FIND.units[1])), dice: dice() });
    } else if (rs < pFind + pRum) {
      out.push({ t: 'rumor', dist: rumour.dist, good: rumour.good, k: rumour.k, dice: dice() });
    } else if (rs < pFind + pRum + pGar) {
      const pool = Object.keys(UPGRADES).filter(id => !S.upg[id] && (!UPGRADES[id].needs || S.upg[UPGRADES[id].needs]));
      if (pool.length) out.push({ t: 'garage', id: pool[Math.floor(r() * pool.length)], dice: dice() });
    }
  }
  return out.slice(0, T.EVENTS.maxPerDay);
}

/** The choices an event offers, given the state (what you can afford). */
export function eventChoices(ev, S, prices) {
  switch (ev.t) {
    case 'vale': return ['pay', 'stall'];
    case 'feds': {
      const c = ['run'];
      if (S.cash >= bribeCost(S, prices)) c.push('bribe');
      c.push('dump');
      return c;
    }
    case 'hijack': return ['hand', 'floor'];
    case 'find': return ['take'];
    case 'rumor': return ['noted'];
    case 'garage': return S.cash >= upgradePrice(ev.id, T.GARAGE_DISCOUNT) ? ['buy', 'pass'] : ['pass'];
    default: return ['ok'];
  }
}
export function defaultChoice(ev, S, prices) {
  const c = eventChoices(ev, S, prices);
  if (ev.t === 'feds') return c.includes('bribe') ? 'bribe' : 'run';
  if (ev.t === 'garage') return 'pass';
  return c[0];
}
export const bribeCost = (S, prices) => Math.max(T.FEDS.bribeMin, Math.round(cargoValue(S, prices) * T.FEDS.bribe));
export const runOdds = (S, w) => clamp(T.FEDS.run + weatherFx(w).run + (S.upg.armor ? T.FEDS.armor : 0), 0.05, T.FEDS.runMax);
export const floorOdds = S => clamp(T.HIJACK.floor + (S.upg.armor ? T.HIJACK.armor : 0), 0.05, 0.95);

function loseCargo(S, share) {
  const lost = {};
  for (const g of GOOD_IDS) {
    const n = S.cargo[g] || 0; if (!n) continue;
    const k = Math.min(n, Math.ceil(n * share));
    if (k) { lost[g] = k; S.cargo[g] = n - k; if (!S.cargo[g]) { delete S.cargo[g]; delete S.cost[g]; } }
  }
  return lost;
}
const keep = S => (S.upg.hidden ? T.HIDDEN_KEEP : 1);

/** Applies one event with the player's choice (validated); returns what happened (for the scene and the newspaper). */
export function applyEvent(ev, choice, S, day, prices) {
  const [d1, d2] = ev.dice;
  const choices = eventChoices(ev, S, prices);
  if (!choices.includes(choice)) choice = defaultChoice(ev, S, prices);
  const out = { t: ev.t, choice };
  switch (ev.t) {
    case 'vale': {
      const V = T.EVENTS.vale;
      if (choice === 'pay') { const pay = Math.min(S.cash, S.debt); S.cash -= pay; S.debt -= pay; out.paid = pay; }
      else if (d1 < 0.5) { out.slide = true; }
      else { const take = Math.min(S.cash, Math.max(500, Math.round(S.cash * V.take))); S.cash -= take; S.debt = Math.round(S.debt * 1.1); out.took = take; }
      break;
    }
    case 'feds': {
      const value = cargoValue(S, prices);
      if (choice === 'dump') { out.lost = loseCargo(S, 1); break; }
      if (choice === 'bribe') {
        const cost = bribeCost(S, prices); S.cash -= cost; out.bribe = cost;
        if (d1 < T.FEDS.bribeOdds) { out.ok = true; break; }
        out.lost = loseCargo(S, T.FEDS.seize * keep(S)); out.caught = true; break;
      }
      out.odds = runOdds(S, day.w);
      if (d1 < out.odds) { out.ok = true; break; }
      out.caught = true;
      out.fine = Math.min(S.cash, Math.round(T.FEDS.fineBase + value * T.FEDS.fineShare)); S.cash -= out.fine;
      out.lost = loseCargo(S, T.FEDS.seize * keep(S));
      break;
    }
    case 'hijack': {
      if (choice === 'hand') { out.lost = loseCargo(S, T.HIJACK.share * keep(S)); break; }
      out.odds = floorOdds(S);
      if (d1 < out.odds) { out.ok = true; break; }
      out.lost = loseCargo(S, T.HIJACK.share * 2 * keep(S)); out.caught = true;
      break;
    }
    case 'find': {
      const free = Math.max(0, S.cap - units(S));
      const n = Math.min(free, ev.n);
      if (n > 0) { addCargo(S, ev.good, n, 0); out.got = n; out.good = ev.good; } else out.full = true;
      break;
    }
    case 'garage': {
      if (choice === 'buy') { const price = upgradePrice(ev.id, T.GARAGE_DISCOUNT); S.cash -= price; grant(S, ev.id); out.bought = ev.id; out.price = price; }
      break;
    }
    default: break;
  }
  void d2;
  return out;
}

function addCargo(S, g, n, price) {
  const have = S.cargo[g] || 0;
  S.cost[g] = have + n > 0 ? ((S.cost[g] || 0) * have + price * n) / (have + n) : 0;
  S.cargo[g] = have + n;
}
function grant(S, id) { S.upg[id] = true; if (UPGRADES[id].cap) S.cap += UPGRADES[id].cap; }

/** One action of the day, validated against the state; returns a record or null (invalid → ignored). */
export function applyAction(a, S, prices, ctx) {
  if (!Array.isArray(a)) return null;
  const [k, x, y] = a;
  switch (k) {
    case 't': {
      const g = x, q = Math.trunc(Number(y));
      if (!GOOD[g] || !Number.isFinite(q) || q === 0) return null;
      const price = prices[g] || 0;
      if (!price) return null;
      if (q > 0) {
        if (q > S.cap - units(S) || price * q > S.cash) return null;
        S.cash -= price * q; addCargo(S, g, q, price);
        return { k: 't', g, q, price };
      }
      const n = -q;
      if (n > (S.cargo[g] || 0)) return null;
      const profit = Math.round((price - (S.cost[g] || 0)) * n);
      S.cash += price * n; S.cargo[g] -= n;
      if (!S.cargo[g]) { delete S.cargo[g]; delete S.cost[g]; }
      return { k: 't', g, q, price, profit };
    }
    case 'p': {
      if (!valeHere(S)) return null;
      const amt = Math.min(S.cash, S.debt, Math.trunc(Number(x)));
      if (!(amt > 0)) return null;
      S.cash -= amt; S.debt -= amt;
      return { k: 'p', amt };
    }
    case 's': {
      if (!stashHere(S)) return null;
      let amt = Math.trunc(Number(x));
      if (!Number.isFinite(amt) || amt === 0) return null;
      if (amt > 0) { amt = Math.min(amt, S.cash); if (amt <= 0) return null; S.cash -= amt; S.stash += amt; }
      else { amt = -Math.min(-amt, S.stash); if (amt >= 0) return null; S.cash -= amt; S.stash += amt; }
      return { k: 's', amt };
    }
    case 'u': {
      if (!canBuyHere(S, x, S.dist)) return null;
      const price = upgradePrice(x);
      if (S.cash < price) return null;
      S.cash -= price; grant(S, x);
      return { k: 'u', id: x, price };
    }
    case 'x': {
      if (!ctx || !ctx.canTip || x === ctx.uid || !ctx.participants || !ctx.participants[x] || ctx.tipped) return null;
      const cost = tipCost(ctx.nw && ctx.nw[x] != null ? ctx.nw[x] : fortune(createState()));
      if (S.cash < cost) return null;
      S.cash -= cost; ctx.tipped = true;
      return { k: 'x', to: x, cost };
    }
    default: return null;
  }
}

/**
 * Replays a player's whole match. days: game.days (1-based records); logs: { d: log }; nwByDay: { d: { uid: fortune } }
 * (what the leaderboard showed that day, for tip-off prices) — pass game.nwh.
 * Returns { S, hist: [{ d, dist, events[], acts[], dest, fee, interest, cop, nw, valid }], valid, invalid: n }.
 */
export function replay(game, uid, logs = {}, upto = null) {
  const seed = game.matchId, days = game.settings.days;
  const S = createState();
  const hist = [];
  let invalid = 0;
  const last = upto == null ? lastDay(game) : upto;
  for (let d = 1; d <= last; d++) {
    const day = game.days && game.days[d];
    if (!day) break;
    const log = logs[d] || {};
    const H = { d, events: [], acts: [], valid: true };
    arrive(S, game, uid, d, H);
    const prices = (day.p && day.p[S.dist]) || {};
    const evs = rollEvents(seed, uid, d, S, day, days);
    evs.forEach((ev, i) => H.events.push({ ...applyEvent(ev, log.ev && log.ev[i], S, day, prices), ev }));
    const ctx = { uid, participants: game.participants, nw: (game.nwh && game.nwh[d - 1]) || null, canTip: d < days, tipped: false };
    for (const a of Array.isArray(log.a) ? log.a.slice(0, MAX_ACTS) : []) {
      const rec = applyAction(a, S, prices, ctx);
      if (rec) H.acts.push(rec); else { invalid++; H.valid = false; }
    }
    if (d < days) {
      let dest = log.dest;
      if (!DIST[dest] || (DIST[dest].fee && dest !== S.dist && S.cash < DIST[dest].fee)) dest = S.dist;
      H.dest = dest;
    }
    H.nw = fortune(S);
    H.S = snapshot(S);
    hist.push(H);
  }
  return { S, hist, valid: invalid === 0, invalid };
}
/** Day d's arrival bookkeeping on state S: interest, the drive (and the Heights' fee), the crooked cop's fee. */
export function arrive(S, game, uid, d, H = {}) {
  const day = game.days[d];
  if (d > 1) {
    H.interest = Math.round(S.debt * interestRate(game.settings.days)); S.debt += H.interest;
    const to = (day.at && day.at[uid]) || S.dist;
    if (to !== S.dist && DIST[to] && DIST[to].fee) { H.fee = Math.min(S.cash, DIST[to].fee); S.cash -= H.fee; }
    if (DIST[to]) S.dist = to;
    if (S.upg.cop) { H.cop = Math.min(S.cash, UPGRADES.cop.fee); S.cash -= H.cop; }
  }
  H.dist = S.dist;
  return S;
}
/** The state a player has on arrival on day d (before today's events), from their logs of the days before. */
export function stateOnArrival(game, uid, logs, d) {
  const R = replay(game, uid, logs, d - 1);
  const S = snapshot(R.S);
  const H = {};
  arrive(S, game, uid, d, H);
  return { S, H };
}
export const snapshot = S => ({ ...S, cargo: { ...S.cargo }, cost: { ...S.cost }, upg: { ...S.upg } });
export const lastDay = game => Math.max(...Object.keys(game.days || { 1: 1 }).map(Number));

// ---------------------------------------------------------------- the night (host): tomorrow from everyone's logs
/**
 * Resolves day d from every player's logs → the patch for the next day (or the final). logsByUid: { uid: { d: log } }.
 * nwh (net-worth history) feeds tip-off prices and the leaderboard; m is the market impact carried into tomorrow.
 */
export function resolveNight(game, logsByUid, secret = game.secret) {
  const d = game.day, days = game.settings.days, seed = citySeed(game.matchId, secret);
  const today = game.days[d];
  const at = {}, hot = {}, nw = {}, net = {};
  const tips = [];
  const reps = {};
  for (const uid of Object.keys(game.participants || {})) {
    const R = replay(game, uid, logsByUid[uid] || {}, d);
    reps[uid] = R;
    const H = R.hist[d - 1];
    nw[uid] = H ? H.nw : fortune(R.S);
    at[uid] = H && H.dest ? H.dest : R.S.dist;
    if (!H) continue;
    const dist = H.dist;
    for (const a of H.acts) {
      if (a.k === 't') { net[dist] = net[dist] || {}; net[dist][a.g] = (net[dist][a.g] || 0) + a.q; }
      if (a.k === 'x') { hot[a.to] = true; tips.push({ from: uid, to: a.to, d }); }
    }
  }
  const patch = { [`nwh/${d}`]: nw, nw };
  if (d >= days) {
    // the books are public once the match is over: the newspaper and the server's check are written from them
    patch.books = Object.fromEntries(Object.keys(game.participants || {}).map(u => [u, logsByUid[u] || {}]));
    patch.final = standingsFrom(nw, game);
    patch.secret = secret || '';   // now public: anyone (the server first) can recompute the whole city
    return patch;
  }
  // the shared market: yesterday's impact fades, today's net buying moves tomorrow's prices
  const m = {};
  for (const D of DIST_IDS) {
    for (const g of GOOD_IDS) {
      const prev = (today.m && today.m[D] && today.m[D][g]) || 0;
      const v = prev * T.MARKET.fade + ((net[D] && net[D][g]) || 0) / T.MARKET.depth;
      if (Math.abs(v) > 0.004) { m[D] = m[D] || {}; m[D][g] = Math.round(v * 1000) / 1000; }
    }
  }
  const nd = d + 1;
  const w = weatherOf(seed, nd, days), news = newsOf(seed, nd);
  patch[`days/${nd}`] = { w, f: weatherOf(seed, nd + 1, days), news, p: pricesOf(seed, nd, w, news, m), at, hot, m, rum: rumoursOf(seed, nd, days, game.participants) };
  return patch;
}

export function standingsFrom(nw, game) {
  const uids = Object.keys(game.participants || {});
  const order = uids.slice().sort((a, b) => (nw[b] || 0) - (nw[a] || 0) || (a < b ? -1 : 1));
  return order.map((uid, i) => ({ uid, rank: i + 1, nw: nw[uid] || 0 }));
}
/** Standings for the podium / the boards: from game.final when the match is over, else from the latest net worths. */
export function standings(game) {
  if (game.final) return game.final.map(r => ({ ...r, score: r.nw }));
  return standingsFrom(game.nw || {}, game).map(r => ({ ...r, score: r.nw }));
}

// the same data after a trip through Firebase: keys sorted, empty objects gone — compare canonically
function canon(x) {
  if (Array.isArray(x)) return x.map(canon);
  if (x && typeof x === 'object') { const o = {}; for (const k of Object.keys(x).sort()) { const v = canon(x[k]); if (v !== undefined && v !== null && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) o[k] = v; } return o; }
  return x;
}
export const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

/** The server's check: recompute every public day record from the seed and the books; true when the host wrote the truth. */
export function verifyDays(game) {
  if (typeof game.secret !== 'string') return false;
  const seed = citySeed(game.matchId, game.secret), days = game.settings.days;
  const books = game.books || {};
  const nwh = {};
  const g2 = { ...game, nwh };
  for (let d = 1; d <= days; d++) {
    const day = game.days && game.days[d];
    if (!day) return false;
    const w = weatherOf(seed, d, days), news = newsOf(seed, d);
    if (day.w !== w || !same(day.news || [], news)) return false;
    const p = pricesOf(seed, d, w, news, day.m || {});
    if (!same(p, day.p)) return false;
    if (!same(day.rum || {}, rumoursOf(seed, d, days, game.participants))) return false;
    if (d === 1) { if (!same(day.m || {}, {})) return false; for (const u of Object.keys(game.participants)) if (day.at[u] !== HOME) return false; }
    // tomorrow from today's logs
    const patch = resolveNight({ ...g2, day: d }, books, game.secret);
    nwh[d] = patch[`nwh/${d}`];
    if (d < days) {
      const next = patch[`days/${d + 1}`], real = game.days[d + 1];
      if (!real || !same(next.at, real.at || {}) || !same(next.hot || {}, real.hot || {}) || !same(next.m || {}, real.m || {})) return false;
    } else if (!same(patch.final, game.final)) return false;
  }
  return true;
}

// ---------------------------------------------------------------- the story of a match (the newspaper's raw material)
export function matchStory(game) {
  const books = game.books || {};
  const out = {};
  for (const uid of Object.keys(game.participants || {})) {
    const R = replay(game, uid, books[uid] || {});
    const s = { uid, fortune: fortune(R.S), cash: R.S.cash, stash: R.S.stash, debt: R.S.debt, best: null, raids: 0, caught: 0, hijacked: 0, paid: 0, tipsSent: [], upgrades: Object.keys(R.S.upg), visited: {}, peak: -Infinity, low: Infinity, trades: 0, bribes: 0, dumped: 0, finds: 0, leftover: units(R.S) };
    for (const H of R.hist) {
      s.visited[H.dist] = (s.visited[H.dist] || 0) + 1;
      s.peak = Math.max(s.peak, H.nw); s.low = Math.min(s.low, H.nw);
      for (const e of H.events) {
        if (e.t === 'feds') { s.raids++; if (e.caught) s.caught++; if (e.choice === 'bribe') s.bribes++; if (e.choice === 'dump') s.dumped++; }
        if (e.t === 'hijack' && e.lost && Object.keys(e.lost).length) s.hijacked++;
        if (e.t === 'vale' && e.paid) s.paid += e.paid;
        if (e.t === 'find' && e.got) s.finds++;
      }
      for (const a of H.acts) {
        if (a.k === 't') { s.trades++; if (a.q < 0 && (!s.best || a.profit > s.best.profit)) s.best = { good: a.g, profit: a.profit, d: H.d, dist: H.dist, units: -a.q }; }
        if (a.k === 'p') s.paid += a.amt;
        if (a.k === 'x') s.tipsSent.push({ to: a.to, d: H.d, cost: a.cost });
      }
    }
    out[uid] = s;
  }
  return out;
}

export function estimateMinutes(settings = {}, n = 4) {
  const days = settings.days || DEFAULT_SETTINGS.days, sec = settings.daySec || DEFAULT_SETTINGS.daySec;
  return Math.round(days * (sec * 0.72 + (MS.dawn + MS.night) / 1000) / 60);
}

export const seedOf = (game, ...parts) => hashString([game.matchId, ...parts].join(':'));
