// Finished matches of every game, shaped like the real `game` nodes at phase 'final' (docs/data-model.md), for the
// profile / board tests. finalGame(id, uids, opts) — uids[0] wins, uids[1] is second, and so on.
export const T0 = Date.UTC(2026, 9, 14, 23, 0, 0); // a Wednesday evening, Eastern

const parts = uids => Object.fromEntries(uids.map(u => [u, true]));
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
    case 'overclock': return {
      ...base, settings: { mode: opts.mode || 'standard' }, total: opts.mode === 'quick' ? 6 : 12,
      results: Object.fromEntries(Array.from({ length: opts.mode === 'quick' ? 6 : 12 }, (_, ci) => [ci, byRank(uids, i => ({ pts: opts.ocPts != null && i === 0 ? opts.ocPts : 150 - i * 20, ok: 1, parts: 1 }))])),
    };
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
      return { ...base, settings: { mode: rush ? 'rush' : 'battle' }, sd: [200_000], out, winner: uids[0],
        results: byRank(uids, i => ({ sc: opts.rushScore != null && i === 0 ? opts.rushScore : 40_000 - i * 5000, ln: 60 - i * 5, lv: 7, ko: rush ? 0 : (i === 0 ? n - 1 : 0), sent: 20 - i, bd: 0 })) };
    }
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
    default: throw new Error(`no fixture for ${id}`);
  }
}
