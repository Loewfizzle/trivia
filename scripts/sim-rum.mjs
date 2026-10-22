// RUMRUNNER economy simulation: hundreds of bot matches on the real pure rules (js/games/rum/bot.js#playMatch), per match
// length, reporting what js/games/rum/tuning.js should be balanced against.
//   node scripts/sim-rum.mjs [--days 15|20|30|all] [--n 200]
// Each match seats six bots (trader, careful, gambler, random, idle, mean). The trader's seat is replayed with variants on
// the same seeds (no upgrades / every upgrade / never the Heights / never pays Mr. Balboni) to price those choices; a set of
// 8-player matches measures the first-to-last spread.
import { playMatch } from '../js/games/rum/bot.js';
import { replay, GOOD_IDS, DIST_IDS, units, cargoValue } from '../js/games/rum/logic.js';
import * as T from '../js/games/rum/tuning.js';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const DAYS = (arg('--days', 'all') === 'all' ? [15, 20, 30] : [Number(arg('--days'))]);
const N = Number(arg('--n', 200));
const SEATS = ['trader', 'careful', 'gambler', 'random', 'idle', 'mean'];
const VARIANTS = { base: {}, noupg: { noUpg: true }, allupg: { allUpg: true }, noheights: { noHeights: true }, nopay: { noPay: true } };

const q = (a, p) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };
const med = a => q(a, 0.5);
const k = x => { if (!Number.isFinite(x)) return '—'; const a = Math.abs(x); const s = x < 0 ? '-' : ''; return a >= 1e6 ? `${s}${(a / 1e6).toFixed(2)}M` : a >= 1e3 ? `${s}${(a / 1e3).toFixed(1)}k` : `${s}${Math.round(a)}`; };
const pct = x => Number.isFinite(x) ? `${Math.round(x * 100)}%` : '—';
const pad = (s, n) => String(s).padEnd(n);
const lpad = (s, n) => String(s).padStart(n);

function analyse(game, logs) {
  // per player: events, upgrades, visits, carrying days, fortune curve
  const out = {};
  for (const uid of Object.keys(game.participants)) {
    const R = replay(game, uid, logs[uid]);
    const s = { feds: 0, caught: 0, hijack: 0, hijackLoss: 0, carryDays: 0, upg: Object.keys(R.S.upg), visits: {}, debt: R.S.debt, nw: R.hist.at(-1).nw, curve: R.hist.map(H => H.nw + cargoValue(H.S, game.days[H.d].p[H.dist])), valeTook: 0, fedLoss: 0 };
    R.hist.forEach((H, i) => {
      s.visits[H.dist] = (s.visits[H.dist] || 0) + 1;
      if (i > 0 && units(R.hist[i - 1].S) > 0) s.carryDays++;
      for (const e of H.events) {
        if (e.t === 'feds') { s.feds++; if (e.caught) s.caught++; }
        if (e.t === 'hijack') { s.hijack++; if (e.lost && Object.keys(e.lost).length) s.hijackLoss++; }
        if (e.t === 'vale' && e.took) s.valeTook += e.took;
      }
    });
    out[uid] = s;
  }
  return out;
}

function runLength(days) {
  const t0 = Date.now();
  const res = {};                       // variant → seat → [stats]
  const ranks = { base: {} };
  const pair = {};                      // 'a>b' → [wins, n]
  const spread = {};                    // good → [ratios]
  const marketImp = [];
  for (const v of Object.keys(VARIANTS)) res[v] = Object.fromEntries(SEATS.map(s => [s, []]));
  for (let m = 0; m < N; m++) {
    for (const [v, fl] of Object.entries(VARIANTS)) {
      if (v !== 'base' && m % 2) continue;                       // variants on half the seeds (time)
      const strategies = Object.fromEntries(SEATS.map((s, i) => [`${s}${i}`, s]));
      const flags = { trader0: fl };
      const { game, logs, standings } = playMatch({ matchId: `sim${days}-${m}`, settings: { days }, strategies, flags });
      const A = analyse(game, logs);
      for (const [uid, s] of Object.entries(A)) res[v][strategies[uid]].push(s);
      if (v !== 'base') continue;
      const winner = strategies[standings[0].uid];
      ranks.base[winner] = (ranks.base[winner] || 0) + 1;
      for (const a of SEATS) for (const b of SEATS) if (a !== b) {
        const key = `${a}>${b}`; pair[key] ??= [0, 0];
        pair[key][1]++; if (A[`${a}${SEATS.indexOf(a)}`].nw > A[`${b}${SEATS.indexOf(b)}`].nw) pair[key][0]++;
      }
      for (let d = 1; d <= days; d++) {
        const p = game.days[d].p;
        for (const g of GOOD_IDS) {
          const xs = DIST_IDS.map(D => p[D][g]).filter(x => x > 0);
          if (xs.length >= 2) (spread[g] ??= []).push(Math.max(...xs) / Math.min(...xs));
        }
        for (const D of Object.keys(game.days[d].m || {})) for (const g of Object.keys(game.days[d].m[D])) marketImp.push(game.days[d].m[D][g]);
      }
    }
  }
  // 8-player matches: first vs last place
  const eight = [];
  const EIGHT = ['trader', 'trader', 'careful', 'careful', 'gambler', 'gambler', 'mean', 'random'];
  for (let m = 0; m < Math.max(20, N / 5); m++) {
    const strategies = Object.fromEntries(EIGHT.map((s, i) => [`p${i}`, s]));
    const { standings } = playMatch({ matchId: `sim8-${days}-${m}`, settings: { days }, strategies });
    eight.push({ first: standings[0].nw, last: standings.at(-1).nw, lastSmart: standings.filter(r => strategies[r.uid] !== 'random').at(-1).nw });
  }

  const B = res.base;
  console.log(`\n=================== ${days} DAYS — ${N} matches × 6 bots (${((Date.now() - t0) / 1000).toFixed(1)} s) ===================`);
  console.log(`${pad('strategy', 9)} ${lpad('p10', 8)} ${lpad('median', 8)} ${lpad('p90', 8)} ${lpad('win', 5)} ${lpad('<0', 5)} ${lpad('paid', 5)} ${lpad('feds', 5)} ${lpad('caught', 6)} ${lpad('d/fed', 6)} ${lpad('hijk', 5)} ${lpad('vale$', 7)}   upgrades bought`);
  for (const s of SEATS) {
    const xs = B[s], nw = xs.map(x => x.nw);
    const feds = xs.reduce((a, x) => a + x.feds, 0), caught = xs.reduce((a, x) => a + x.caught, 0), carry = xs.reduce((a, x) => a + x.carryDays, 0);
    const upg = {}; for (const x of xs) for (const u of x.upg) upg[u] = (upg[u] || 0) + 1;
    console.log(`${pad(s, 9)} ${lpad(k(q(nw, 0.1)), 8)} ${lpad(k(med(nw)), 8)} ${lpad(k(q(nw, 0.9)), 8)} ${lpad(pct((ranks.base[s] || 0) / N), 5)} ${lpad(pct(nw.filter(x => x < 0).length / xs.length), 5)} ${lpad(pct(xs.filter(x => x.debt <= 0).length / xs.length), 5)} ${lpad((feds / xs.length).toFixed(1), 5)} ${lpad(pct(caught / Math.max(1, feds)), 6)} ${lpad(feds ? (carry / feds).toFixed(1) : '—', 6)} ${lpad((xs.reduce((a, x) => a + x.hijackLoss, 0) / xs.length).toFixed(2), 5)} ${lpad(k(xs.reduce((a, x) => a + x.valeTook, 0) / xs.length), 7)}   ${Object.entries(upg).map(([u, n]) => `${u} ${pct(n / xs.length)}`).join(' ')}`);
  }
  const P = (a, b) => pct(pair[`${a}>${b}`][0] / pair[`${a}>${b}`][1]);
  console.log(`head-to-head (row beats column):`);
  console.log(`${pad('', 9)} ${SEATS.map(s => lpad(s.slice(0, 7), 8)).join('')}`);
  for (const a of SEATS) console.log(`${pad(a, 9)} ${SEATS.map(b => lpad(a === b ? '·' : P(a, b), 8)).join('')}`);
  const rnd = B.random.map(x => x.nw), trMed = med(B.trader.map(x => x.nw));
  console.log(`random below trader's median: ${pct(rnd.filter(x => x < trMed).length / rnd.length)}`);
  const smart = ['trader', 'careful', 'gambler', 'mean'].flatMap(s => B[s]);
  const caughtOnce = smart.filter(x => x.caught > 0), clean = smart.filter(x => !x.caught);
  console.log(`smart bots with no fed event all match: ${pct(smart.filter(x => !x.feds).length / smart.length)} · caught at least once: ${pct(caughtOnce.length / smart.length)} (median ${k(med(caughtOnce.map(x => x.nw)))} vs ${k(med(clean.map(x => x.nw)))} never caught; ${pct(caughtOnce.filter(x => x.nw < 0).length / Math.max(1, caughtOnce.length))} of them end negative)`);
  // net-worth curve
  console.log(`net worth incl. cargo (median at 25 / 50 / 75 / 100 %):`);
  for (const s of SEATS) {
    const at = f => k(med(B[s].map(x => x.curve[Math.max(0, Math.round(f * days) - 1)])));
    console.log(`  ${pad(s, 9)} ${[0.25, 0.5, 0.75, 1].map(at).map(x => lpad(x, 8)).join('')}`);
  }
  // trader variants (same seeds, even matches only)
  const tv = v => res[v].trader.map(x => x.nw);
  const baseEven = B.trader.filter((_, i) => i % 2 === 0).map(x => x.nw);
  console.log(`trader variants (same seeds): ${Object.keys(VARIANTS).map(v => `${v} ${k(med(v === 'base' ? baseEven : tv(v)))}`).join(' · ')}`);
  for (const v of ['noupg', 'allupg', 'noheights', 'nopay']) {
    const a = baseEven, b = tv(v);
    // log of (fortune + a cushion) so busts count without dominating; mean ± standard error over the seeds
    const L = x => Math.log(Math.max(2000, x + 25000)), dl = a.map((x, i) => L(x) - L(b[i]));
    const m = dl.reduce((s, x) => s + x, 0) / dl.length, se = Math.sqrt(dl.reduce((s, x) => s + (x - m) ** 2, 0) / dl.length / dl.length);
    console.log(`  base vs ${pad(v, 9)} better in ${lpad(pct(dl.filter(x => x > 0).length / dl.length), 4)}, worse in ${lpad(pct(dl.filter(x => x < 0).length / dl.length), 4)} of seeds · log-fortune edge ${m >= 0 ? '+' : ''}${m.toFixed(2)} ± ${se.toFixed(2)}`);
  }
  // upgraded vs not, across all smart bots
  for (const u of ['truck1', 'truck2', 'armor', 'hidden', 'cop', 'warehouse']) {
    const pool = ['trader', 'careful', 'gambler', 'mean'].flatMap(s => B[s].map(x => ({ ...x, s })));
    const yes = pool.filter(x => x.upg.includes(u)).map(x => x.nw), no = pool.filter(x => !x.upg.includes(u)).map(x => x.nw);
    process.stdout.write(`${u} ${pct(yes.length / pool.length)} (${k(med(yes))} vs ${k(med(no))})  `);
  }
  console.log();
  // visits
  const vis = {}; let tot = 0;
  for (const s of ['trader', 'careful', 'gambler', 'mean']) for (const x of B[s]) for (const [D, n] of Object.entries(x.visits)) { vis[D] = (vis[D] || 0) + n; tot += n; }
  console.log(`district visits (smart bots): ${DIST_IDS.map(D => `${D} ${pct((vis[D] || 0) / tot)}`).join(' · ')}`);
  console.log(`daily price spread across districts (median max/min): ${GOOD_IDS.map(g => `${g} ${med(spread[g]).toFixed(2)}`).join(' · ')}`);
  const neg = marketImp.filter(x => x < 0), pos = marketImp.filter(x => x > 0);
  console.log(`market impact: ${marketImp.length / N | 0} moves/match, dips median ${pct(med(neg))} (p10 ${pct(q(neg, 0.1))}), rises median ${pct(med(pos))} (p90 ${pct(q(pos, 0.9))})`);
  console.log(`8 players (${eight.length}): first median ${k(med(eight.map(e => e.first)))}, last smart median ${k(med(eight.map(e => e.lastSmart)))}, last median ${k(med(eight.map(e => e.last)))}`);
}

// the shared market, by its formula: n players dump 100 units of one good in one district
const dip = n => Math.max(T.MARKET.clampLo, 1 - n * 100 / T.MARKET.depth);
const dip2 = n => Math.max(T.MARKET.clampLo, 1 - n * 100 / T.MARKET.depth * T.MARKET.fade);
console.log(`market: n players dump 100 units in one district → next day ×${[1, 2, 3, 4].map(n => `${n}: ${dip(n).toFixed(2)}`).join(' · ')} (the day after: ×${dip2(3).toFixed(2)} for 3)`);
for (const d of DAYS) runLength(d);
