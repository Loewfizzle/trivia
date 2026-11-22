// Finished matches of every game, shaped like the real `game` nodes at phase 'final' (docs/data-model.md), for the
// profile / board tests. finalGame(id, uids, opts) — uids[0] wins, uids[1] is second, and so on.
import { minBet, payout, START, LOAN } from '../../js/games/stakes/logic.js';
import { playMatch } from '../../js/games/rum/bot.js';
import { encodeWord, secretKey } from '../../js/games/cipher/logic.js';
import { computeResults as ocComputeResults, levelOf as ocLevelOf } from '../../js/games/overclock/logic.js';
import { timesOf as ocTimesOf } from '../../js/games/overclock/director.js';
import { partsFor as ocPartsFor } from '../../js/games/overclock/challenges.js';

export const T0 = Date.UTC(2026, 9, 14, 23, 0, 0); // a Wednesday evening, Eastern

const parts = uids => Object.fromEntries(uids.map(u => [u, true]));

// ---- OVERCLOCK as an honest host leaves it (THE BEFORE-LAUNCH PASS — js/games/overclock/regrade.js re-grades every challenge from these)
export const ocStartAt = ci => T0 + 20_000 + ci * 60_000;
/** challenge ci's boards for the uids that played it: player i (the participants' order) gets parts − i right, done 8 + 1.5·i s in */
export function ocBoardsAt(game, ci, played) {
  const all = Object.keys(game.participants || {}), n = ocPartsFor(game.order[ci], ocLevelOf(ci, game.total)), out = {};
  for (const u of played) { const i = all.indexOf(u), at = ocStartAt(ci) + 8000 + i * 1500; out[u] = { p: n, ok: Math.max(0, n - i), n, done: true, at, doneAt: at }; }
  return out;
}
/** the room's oc/{matchId} tree for those players (every challenge) */
export function ocBoardsFor(game, played) {
  return Object.fromEntries(Array.from({ length: game.total }, (_, ci) => [ci, ocBoardsAt(game, ci, played)]));
}
const byRank = (uids, f) => Object.fromEntries(uids.map((u, i) => [u, f(i, u)]));

export function finalGame(id, uids, opts = {}) {
  const base = { id, matchId: opts.matchId || `m${id.slice(0, 3)}${Math.random().toString(36).slice(2, 6)}`, participants: parts(uids), phase: 'final', phaseStartAt: T0 + 600_000 };
  const n = uids.length;
  switch (id) {
    case 'cipher': return {
      ...base, rounds: 3, lengths: [5, 5, 6], roundMs: 120_000, maxGuesses: 6,
      results: Object.fromEntries([0, 1, 2].map(r => [r, byRank(uids, i => (i < n - 1
        ? { pts: 300 - i * 60 - r, solved: true, n: 3 + i, t: opts.fast5 != null && i === 0 ? opts.fast5 : 20_000 + i * 9000 + r * 100, speed: 80, eff: 60 }
        : { pts: 0, solved: false, n: 6, t: 0, speed: 0, eff: 0 }))])),
    };
    case 'signal': {
      // uids[0] survives; the others fall in reverse order, each struck down by the winner
      const out = {}, log = {};
      uids.slice(1).reverse().forEach((u, k) => { out[u] = k + 2; log[k + 2] = { c: 0, ev: [{ t: 'hit', a: uids[0], v: u, d: 30 }, { t: 'out', u }] }; });
      return { ...base, settings: { hp: 100 }, hp: byRank(uids, i => (i ? 0 : 60)), sh: byRank(uids, () => 0), out, q: 20, log };
    }
    case 'overclock': {
      // (FR7 FIXES A — OC1: a real order; the STANDARD bound checks each result against its type's ceiling)
      // (THE BEFORE-LAUNCH PASS — THE SERVER's RE-GRADE: the results are what an HONEST HOST's director writes — computeResults over the
      //  players' own boards (ocBoardsFor: player i gets parts − i right, done 8 + 1.5·i s into a challenge that opened at ocStartAt(ci)) +
      //  the FASTEST clock tm; a player in opts.noProof wrote no board (0 everywhere). opts.ocPts = a FORGED first player's points)
      const total = opts.mode === 'quick' ? 6 : 12;
      const order = ['unscramble', 'memory', 'oddone', 'math', 'pattern', 'trivia', 'stroop', 'reflex', 'count', 'truefalse', 'rewire', 'compass'].slice(0, total);
      const g = { ...base, seed: `fixture-${base.matchId}`, settings: { mode: opts.mode || 'standard' }, total, order, results: {}, tm: {} };
      const silent = new Set(opts.noProof || []);
      for (let ci = 0; ci < total; ci++) {
        const boards = ocBoardsAt(g, ci, uids.filter(u => !silent.has(u)));
        const gc = { ...g, ci, playStartAt: ocStartAt(ci) };
        g.results[ci] = ocComputeResults(gc, boards);
        g.tm[ci] = ocTimesOf(gc, boards);
        if (opts.ocPts != null) g.results[ci][uids[0]] = { ...g.results[ci][uids[0]], pts: opts.ocPts };
      }
      return g;
    }
    case 'bluff': return { ...base, settings: { mode: 'standard' }, rounds: 3, results: Object.fromEntries([0, 1, 2].map(r => [r, byRank(uids, i => ({ pts: 1500 - i * 300, truth: true, fooled: i === 0 ? 2 : 0, likes: 0 }))])) };
    case 'pulse': return {
      ...base, settings: { song: 'pulse1', count: 1, diff: opts.diff || 'normal', echo: 'on' },
      songs: [{ id: opts.song || 'pulse1', title: 'Track 01', bpm: 108, duration: 157.8 }],
      results: { 0: byRank(uids, i => ({ s: opts.pulseScore != null && i === 0 ? opts.pulseScore : 60_000 - i * 9000, c: 0, mc: 80, p: 200, g: 80, o: 20, m: 17, n: 317, e: 0 })) },
    };
    case 'golf': return {
      ...base, settings: { mode: 'full', power: 'on', sabotage: 'on' }, holes: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      results: Object.fromEntries(Array.from({ length: 9 }, (_, hi) => [hi, byRank(uids, i => ({ s: opts.golfStroke != null && i === 0 ? opts.golfStroke : 2 + i + (hi % 2) }))])),
    };
    case 'agent': return {
      ...base, settings: { rounds: 3 }, results: Object.fromEntries([0, 1, 2].map(r => [r, byRank(uids, i => ({ pts: 300 - i * 50, agent: i === 0 && r === 0, escaped: i === 0 && r === 0, spotted: i === 1 }))])),
    };
    case 'prism': {
      const rush = (opts.mode || 'battle') === 'rush';
      const out = rush ? {} : Object.fromEntries(uids.slice(1).map((u, k) => [u, { at: T0 + 100_000 + k, place: k + 2, by: uids[0] }]));
      // (PFIX-B: the play's start + each board's pieces — the award flags are checked against them)
      return { ...base, settings: { mode: rush ? 'rush' : 'battle' }, sd: [200_000], out, winner: uids[0], playStartAt: T0 + 10_000,
        results: byRank(uids, i => ({ sc: opts.rushScore != null && i === 0 ? opts.rushScore : 40_000 - i * 5000, ln: 60 - i * 5, lv: 7, ko: rush ? 0 : (i === 0 ? n - 1 : 0), sent: 20 - i, bd: 0, pn: 160 - i * 10 })) };
    }
    // (JAYWALK H1: the replayed results — lanes, the tick, the cause, the lives left)
    case 'jaywalk': return { ...base, settings: { lives: 3 }, mode: n === 1 ? 'solo' : 'match', seed: 'fixture', playAt: T0,
      results: byRank(uids, i => ({ l: opts.lanes != null && i === 0 ? opts.lanes : 240 - i * 40, t: 9000 - i * 900, w: i ? 'car' : 'taken', lv: i ? 0 : 2 })) };
    // (HIGH RISE S4A: the judged rows — the floor, the perfects, the tick, the cause)
    case 'highrise': return { ...base, settings: {}, mode: n === 1 ? 'solo' : 'match', seed: 'fixture', playAt: T0,
      results: byRank(uids, i => ({ f: opts.floor != null && i === 0 ? opts.floor : 120 - i * 20, p: 80 - i * 15, t: 9000 - i * 900, w: i ? 'miss' : 'made', e: 9100 - i * 900, s: 12 - i })) };
    case 'slip': {
      const out = Object.fromEntries(uids.slice(1).map((u, k) => [u, { at: T0 + 200_000 - k * 1000, place: k + 2, rem: k + 1, d: 2000 - k * 200 }]));
      return { ...base, settings: { lives: 3 }, playStartAt: T0, phaseStartAt: T0 + 240_000, out, winner: uids[0],
        results: byRank(uids, i => ({ d: opts.dist != null && i === 0 ? opts.dist : 2600 - i * 200, bc: 1, fl: 0, ln: 0, cl: 0, bi: 1, rg: 0 })) };
    }
    case 'gridlock': {
      const mode = opts.mode || 'classic';
      const out = Object.fromEntries(uids.slice(1).map((u, k) => [u, { at: T0 + 300_000 - k, place: k + 2, rem: k + 1, by: uids[0] }]));
      return { ...base, mode, settings: { mode, placeSec: 60, turnSec: 20 }, out, winner: uids[0], pts: byRank(uids, i => 900 - i * 100),
        results: byRank(uids, i => ({ pts: 900 - i * 100, sh: 30, hi: 12, sk: i ? 1 : 5, el: i === 0 ? n - 1 : 0, acc: 40, ab: 0, bl: 0, bp: 0 })) };
    }
    case 'stakes': {
      // uids[0] answers right every round, the others wrong; everyone bets the minimum (the real limits and payouts)
      const plan = {}, res = {};
      const stack = Object.fromEntries(uids.map(u => [u, START]));
      for (let r = 0; r <= 10; r++) {
        plan[r] = { i: r, cat: ['science', 'history'][r % 2], d: r % 3 === 1 || r === 10 ? 'hard' : 'medium' };
        res[r] = {};
        uids.forEach((u, i) => {
          const b = minBet(stack[u]);
          const ok = i === 0;
          const d = ok ? b * payout(plan[r].d, r) : -b;
          res[r][u] = { b, a: ok ? 1 : 0, ok, d, t: 3000 + i * 500 };
          stack[u] += d;
          if (stack[u] <= 0) stack[u] += LOAN;
        });
      }
      return { ...base, round: 10, rk: '10', plan, res, reveal: {}, n0: n };
    }
    case 'rum': {
      // a real bot match (the server replays the whole city); the first player is the trader who wins
      const pool = ['trader', 'careful', 'random', 'idle', 'gambler', 'mean', 'trader', 'careful'];
      for (let k = 0; k < 80; k++) {
        const strategies = Object.fromEntries(uids.map((u, i) => [u, i === 0 ? 'trader' : pool[(i + k) % pool.length]]));
        const { game } = playMatch({ matchId: `${base.matchId}${k}`, settings: { days: opts.days || 15, daySec: 45 }, strategies });
        if (game.final[0].uid === uids[0] && game.final[0].nw > 0 && game.final[1].nw < game.final[0].nw) return { ...game, ...base, matchId: game.matchId, phase: 'final' };
      }
      throw new Error('no RUMRUNNER fixture where the first player wins');
    }
    default: throw new Error(`no fixture for ${id}`);
  }
}

// APP FIXES: /api/report re-grades a CIPHER final against its players' signed boards — this builds them (+ game.sx, every round's
// obfuscated word) so a fixture final is checkable like a real one
// a CIPHER final as the real clients leave it: game.sx (every round's word, obfuscated) + boards/{m}/{r}/{uid} whose guesses give
// exactly the results (solved at guess n, or n misses)
const WORDS = { 5: 'crane', 6: 'planet', 7: 'kitchen', 4: 'moon' };
export function cipherSigned(game, code) {
  game.sx = {};
  const boards = {};
  for (const [r, res] of Object.entries(game.results || {})) {
    const L = game.lengths[r], word = WORDS[L], sk = secretKey(code, game.matchId, Number(r));
    game.sx[r] = encodeWord(word, sk);
    boards[r] = {};
    for (const [uid, x] of Object.entries(res)) {
      const miss = 'z'.repeat(L), guesses = x.solved ? [...Array(Math.max(0, x.n - 1)).fill(miss), word] : Array(x.n).fill(miss);
      boards[r][uid] = { g: guesses.map(w => encodeWord(w, sk)), p: guesses.map(() => '0'.repeat(L)), solved: !!x.solved, done: true };
    }
  }
  game.round = Math.max(...Object.keys(game.results || { 0: 1 }).map(Number));
  game.secret = game.sx[game.round];
  return { boards };
}
