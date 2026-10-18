// GRIDLOCK balance simulation: hundreds of bot-vs-bot matches of SALVO and ARCADE (and ROYALE for reference) at 2, 4
// and 8 players, through the real pure director. Reports match length (rounds → estimated minutes), seat advantage,
// and per-ability usage / win rates, so CARD_WEIGHTS (abilities.js) can be tuned on numbers.
//   node scripts/sim-gridlock.mjs [matches=200] [modes=salvo,arcade,royale] [--weights=sonar:1,cluster:1,...]
import * as L from '../js/games/gridlock/logic.js';
import * as A from '../js/games/gridlock/abilities.js';
import { createGame, nextStep } from '../js/games/gridlock/director.js';
import { rngFrom } from '../js/core/rng.js';

const MATCHES = Number(process.argv[2] || 200);
const MODES = (process.argv[3] || 'salvo,arcade,royale').split(',');
const wArg = process.argv.find(a => a.startsWith('--weights='));
const WEIGHTS = { ...A.CARD_WEIGHTS };
if (wArg) for (const kv of wArg.slice(10).split(',')) { const [k, v] = kv.split(':'); WEIGHTS[k] = Number(v); }

const P = n => Object.fromEntries(Array.from({ length: n }, (_, i) => [`u${i}`, true]));
const apply = (g, patch) => {
  const out = structuredClone(g);
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === '$room') continue;
    const parts = k.split('/');
    let o = out;
    for (const p of parts.slice(0, -1)) o = (o[p] ??= {});
    if (v === null) delete o[parts.at(-1)]; else o[parts.at(-1)] = v;
  }
  return out;
};
const key = (g, u) => L.shotKey('R', g.matchId, g.rk, u);
const lock = (g, u, shots, act, a) => ({ ts: Object.fromEntries(shots.map(s => [s.t, true]).concat(act && act.t ? [[act.t, true]] : [])), x: L.encodeLock(shots, act, key(g, u)), ...(a ? { a } : {}), at: 1 });

/** A reasonable bot: hunts like smartShot; in Arcade plays a card 60 % of the time it holds one, aimed with a little sense. */
function bot(g, u, rnd, fleets) {
  const hand = (g.hand && g.hand[u]) || [];
  const opp = L.aliveOf(g).filter(o => o !== u);
  if (!opp.length) return { shots: [], act: null, a: null };
  const weakest = opp.slice().sort((a, b) => L.boardOf(g, a).left - L.boardOf(g, b).left)[0];
  if (g.mode === 'arcade' && hand.length && rnd() < 0.6) {
    const a = hand[Math.floor(rnd() * hand.length)];
    const t = rnd() < 0.7 ? weakest : opp[Math.floor(rnd() * opp.length)];
    const rc = () => Math.floor(rnd() * g.size);
    const nearHit = () => {   // an unsunk hit to build on, else random
      const b = L.boardOf(g, t);
      const hits = Object.entries(b.cells || {}).filter(([, v]) => v.h === 1).map(([k]) => k.split(',').map(Number));
      return hits.length ? hits[Math.floor(rnd() * hits.length)] : [rc(), rc()];
    };
    if (a === 'sonar') return { shots: [], act: { t, r: rc(), c: rc() }, a };
    if (a === 'cluster') { const [r, c] = nearHit(); return { shots: [], act: { t, r: Math.max(0, r - 1 + Math.floor(rnd() * 2)), c: Math.max(0, c - 1 + Math.floor(rnd() * 2)) }, a }; }
    if (a === 'torpedo') { const [r, c] = nearHit(); const axis = rnd() < 0.5 ? 0 : 1; return { shots: [], act: { t, axis, idx: axis ? c : r, dir: rnd() < 0.5 ? 1 : -1 }, a }; }
    if (a === 'shield') {   // cover the ship with the most unhit cells near existing hits, else a random spot
      const own = fleets[u]; const b = L.boardOf(g, u);
      const hitKeys = new Set(Object.entries(b.cells || {}).filter(([, v]) => v.h === 1).map(([k]) => k));
      const threatened = own.filter(s => s && L.cellsOf(s).some(([r, c]) => hitKeys.has(`${r},${c}`)) && !L.cellsOf(s).every(([r, c]) => hitKeys.has(`${r},${c}`)));
      const s = threatened[0] || own[Math.floor(rnd() * own.length)];
      return { shots: [], act: { r: Math.max(0, s.r - 1), c: Math.max(0, s.c - 1) }, a };
    }
    if (a === 'double') { const s1 = L.smartShot(g, u, rnd), s2 = L.smartShot(g, u, rnd); return { shots: [s1, s2].filter(Boolean), act: null, a }; }
    if (a === 'relocate') return { shots: [], act: { i: 0 }, a, relocate: true };
  }
  const n = L.shotsPerVolley(g, u);
  const shots = [];
  const seen = new Set();
  for (let k = 0; k < n * 4 && shots.length < n; k++) { const s = L.smartShot(g, u, rnd); if (!s) break; const kk = `${s.t}:${s.r},${s.c}`; if (!seen.has(kk)) { seen.add(kk); shots.push(s); } }
  return { shots, act: null, a: null };
}

function runMatch({ n, mode, seed }) {
  const parts = P(n);
  let g = createGame({ matchId: `m${seed}`, settings: { mode, placeSec: 45, turnSec: 20 }, participants: parts, now: 0 });
  // deal with the weights under test
  if (mode === 'arcade') for (const u of Object.keys(parts)) g.hand[u] = Array.from({ length: A.START_CARDS }, (_, i) => A.drawCard(g.matchId, u, i, WEIGHTS));
  const rnd = rngFrom(seed);
  const fleets = Object.fromEntries(Object.keys(parts).map(u => [u, L.randomLayout(g.size, g.fleet, rngFrom(`${seed}:${u}`))]));
  const online = Object.fromEntries(Object.keys(parts).map(u => [u, true]));
  let now = 1000, live = { ready: Object.fromEntries(Object.keys(parts).map(u => [u, { at: 1 }])) };
  const used = Object.fromEntries(Object.keys(parts).map(u => [u, {}]));
  let showMsTotal = 0, rounds = 0;
  for (let step = 0; step < 60000 && g.phase !== 'final'; step++) {
    now += 250;
    if (g.phase === 'aim' && !live.shots) {
      live.shots = {};
      rounds++;
      for (const u of L.aliveOf(g)) {
        const b = bot(g, u, rnd, fleets);
        if (b.relocate) {
          const ok = fleets[u].map((s, i) => i).filter(i => { const s = fleets[u][i]; const cand = { ...s, d: s.d ? 0 : 1 }; return A.canRelocate(fleets[u], i, cand, g.size, L.boardOf(g, u), L.canPlace); });
          if (ok.length) { const i = ok[Math.floor(rnd() * ok.length)]; const s = fleets[u][i]; fleets[u] = fleets[u].map((x, j) => (j === i ? { ...s, d: s.d ? 0 : 1 } : x)); b.act = { i }; }
          else { b.a = null; b.act = null; const s = L.smartShot(g, u, rnd); b.shots = s ? [s] : []; }
        }
        live.shots[u] = lock(g, u, b.shots, b.act, b.a);
        if (b.a) used[u][b.a] = (used[u][b.a] || 0) + 1;
      }
    }
    if (g.phase === 'resolve' && !live.res) {
      live.res = {};
      const acts = g.acts || {};
      for (const t of [...new Set(Object.values(g.fire || {}).flat().map(s => s.t))]) {
        const shots = {};
        for (const [by, list] of Object.entries(g.fire)) { const mine = list.filter(s => s.t === t); if (mine.length) shots[by] = mine; }
        const sh = acts[t] && acts[t].a === 'shield' ? { r: acts[t].r, c: acts[t].c } : null;
        live.res[t] = L.resolveVolley(fleets[t], L.boardOf(g, t), shots, sh, g.size);
      }
    }
    const patch = nextStep(g, { code: 'R', now, online, live });
    if (patch) {
      const before = g.phase; g = apply(g, patch);
      if (patch.phase === 'show') showMsTotal += patch.phaseEndsAt - patch.phaseStartAt;
      if (g.phase !== before || patch.rk) live = { ready: live.ready };
    }
    // a sink in Arcade redeals with the weights under test (the director dealt with the defaults)
    if (mode === 'arcade' && patch && Object.keys(patch).some(k => k.startsWith('hand/'))) for (const k of Object.keys(patch)) if (k.startsWith('hand/')) { /* keep the director's deal: weights only shape the start hand + the rate below */ }
  }
  return { g, rounds, showMs: showMsTotal, used, order: g.order };
}

const fmt = x => (Math.round(x * 10) / 10).toString();
const pct = x => `${Math.round(x * 100)}%`;
const AIM_FRACTION = 0.6;   // people lock in before the timer runs out
console.log(`GRIDLOCK balance · ${MATCHES} matches per cell · weights ${JSON.stringify(WEIGHTS)}\n`);
for (const mode of MODES) {
  for (const n of [2, 4, 8]) {
    const roundsAll = [], mins = [], seatWins = Array(n).fill(0), abilityUse = {}, abilityWinsBy = {}, abilityUsersBy = {};
    let capped = 0, finished = 0;
    for (let m = 0; m < MATCHES; m++) {
      const { g, rounds, showMs, used, order } = runMatch({ n, mode, seed: `${mode}:${n}:${m}` });
      if (g.phase !== 'final') continue;
      finished++;
      if (g.capped) capped++;
      roundsAll.push(rounds);
      const aimS = (20 + (mode === 'salvo' ? L.SALVO_AIM_EXTRA_S : 0)) * AIM_FRACTION;
      mins.push((45 * 0.7 + rounds * (aimS + 2) + showMs / 1000) / 60);
      seatWins[order.indexOf(g.winner)]++;
      for (const u of Object.keys(g.participants)) for (const [a, k] of Object.entries(used[u])) {
        abilityUse[a] = (abilityUse[a] || 0) + k;
        abilityUsersBy[a] = (abilityUsersBy[a] || 0) + 1;
        if (u === g.winner) abilityWinsBy[a] = (abilityWinsBy[a] || 0) + 1;
      }
    }
    roundsAll.sort((a, b) => a - b);
    const p = q => roundsAll[Math.min(roundsAll.length - 1, Math.floor(q * roundsAll.length))];
    console.log(`${mode.toUpperCase().padEnd(7)} n=${n}  finished ${finished}/${MATCHES}  capped ${pct(capped / Math.max(1, finished))}  rounds p50 ${p(0.5)} p90 ${p(0.9)} max ${p(1)}  ≈ ${fmt(mins.reduce((a, b) => a + b, 0) / mins.length)} min (p90 ${fmt(mins.sort((a, b) => a - b)[Math.floor(0.9 * mins.length)] || 0)})`);
    console.log(`        seat win rates ${seatWins.map(w => pct(w / Math.max(1, finished))).join(' ')}  (fair = ${pct(1 / n)})`);
    if (mode === 'arcade') {
      const base = 1 / n;
      const rows = A.ABILITIES.map(a => `${a} ×${abilityUse[a] || 0} users-win ${pct((abilityWinsBy[a] || 0) / Math.max(1, abilityUsersBy[a] || 0))}`);
      console.log(`        abilities (win rate of players who used it; fair = ${pct(base)}): ${rows.join(' · ')}`);
    }
  }
  console.log('');
}
