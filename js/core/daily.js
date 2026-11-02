// THE DAILY CONTRACT (PROGRESSION A), PURE — how a DAILY plugs into the console (PLUG AND PLAY: a cartridge says only how it talks to it).
// The dailies themselves come later (the WORDLE-type, COAST CLEAR, the smallest OVERCLOCK — before launch); this is the slot + the rules:
//   · the DAY = the streak's day (4 am Eastern); the SEED is made on the server from a secret (the puzzle never reaches a phone early)
//   · ONE OFFICIAL TRY per player per day (START is recorded; a refresh continues the same try, its clock still running)
//   · the score is CHECKED on the server (the cartridge's `verify` replays the result against the seed) and stored there only
//   · → the day's PERCENTILE ("better than 72 % today") + the BANDS (PENTHOUSE top 1 % · VIP ROOM 10 % · LOUNGE 25 % · BAR 50 % · FLOOR),
//     the bands shown only from ~50 finishers; YOUR TABLE's TODAY (BOARD 2.0 shows it — friends' scores hidden until you've played)
//   · a daily keeps THE STREAK like a match; no database socket for a solo daily (THE PARKED DATABASE — /api only)
//
// A CARTRIDGE: { id, name, better: 'high' | 'low', buckets (the histogram's size), bucket(score) → 0…buckets−1, verify(seed, result,
//   { startedAt, now }) → a score (a finite number) | null (refused) }. Register with registerDaily(); the server lists its cartridges in
//   api/_lib/dailies.js (+ a TEST-ONLY fake behind DAILY_TEST=1).
export const BAND_MIN = 50;
export const BANDS = [
  { id: 'penthouse', name: 'PENTHOUSE', top: 1 },
  { id: 'vip', name: 'VIP ROOM', top: 10 },
  { id: 'lounge', name: 'LOUNGE', top: 25 },
  { id: 'bar', name: 'BAR', top: 50 },
  { id: 'floor', name: 'FLOOR', top: 100 },
];
export const MAX_DAILIES_A_DAY = 3;   // THE TRIPLE = all of them in one day

const CARTS = new Map();
export function registerDaily(c) {
  if (!c || !/^[a-z0-9-]{2,16}$/.test(c.id) || typeof c.verify !== 'function' || typeof c.bucket !== 'function' || !(c.buckets > 0)) throw new Error('bad daily cartridge');
  CARTS.set(c.id, { better: 'high', ...c });
  return c;
}
export const dailyOf = id => CARTS.get(String(id)) || null;
export const dailyIds = () => [...CARTS.keys()];
export const unregisterDaily = id => CARTS.delete(id);

/** The bucket a score falls in (clamped). */
export const bucketOf = (cart, score) => Math.max(0, Math.min(cart.buckets - 1, Math.floor(cart.bucket(score))));

/**
 * Where a score stands among the day's finishers. hist = { bucket: count } (INCLUDING this score), n = finishers (including it).
 * Buckets are ordered low → high score; for a 'low' daily (fewer is better) the order flips.
 * → { n, better, worse, pct (0–100: the share of the OTHER finishers you beat), top (your place from the top, as a % of n), band | null }
 */
export function standing(cart, hist, n, score) {
  const b = bucketOf(cart, score);
  let above = 0, below = 0;
  for (const [k, c] of Object.entries(hist || {})) {
    const kb = Number(k);
    if (kb > b) above += c; else if (kb < b) below += c;
  }
  const better = cart.better === 'low' ? below : above, worse = cart.better === 'low' ? above : below;
  const pct = n <= 1 ? 100 : Math.round((100 * worse) / (n - 1));
  const top = Math.max(0, Math.min(100, (100 * (better + 1)) / Math.max(1, n)));
  return { n, better, worse, pct, top, band: n >= BAND_MIN ? bandFor(top) : null };
}
export const bandFor = top => BANDS.find(b => top <= b.top) || BANDS[BANDS.length - 1];

/** YOUR TABLE's TODAY for one friend: their score only once YOU have finished that daily (before, a tick). */
export function todayView(mine, theirs) {
  const out = {};
  for (const [g, v] of Object.entries(theirs || {})) out[g] = mine && mine[g] != null ? { score: v } : { done: true };
  return out;
}
