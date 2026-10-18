// HIGH STAKES question supply, the host's side: the opening bank before the match, then top-ups between rounds.
// Open Trivia DB first (a session token so no question repeats; ≥ 5.2 s between requests; 50 a batch), The Trivia API when
// it fails or is rate-limited, the bundled bank after repeated failures — and synchronously for the director when a round
// would otherwise have no question (fallbackPatch). Everything the bank holds is written to the room, so every phone plays
// the same questions and a new host carries on with the same token.
import { fetchOtdb, fetchTriviaApi, requestOtdbToken } from '../../trivia/sources.js';
import { loadFallback, pickFallback } from '../../trivia/bank.js';
import { addItems, nextWant, roomUsed } from './questions.js';

export const OTDB_GAP_MS = 5200;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

/**
 * One batch of `want` questions from the best source that answers. src: { otdb, tapi, token, fallback } (injectable for tests).
 * → { items, token?, source, code? }
 */
export async function fetchBatch(want, { token = '', fails = 0, seen = {}, otdb = fetchOtdb, tapi = fetchTriviaApi, tokenFn = requestOtdbToken, fallback = null } = {}) {
  let tok = token;
  if (fails < 3) {
    try {
      if (!tok) tok = await withTimeout(tokenFn(), 4000).catch(() => '');
      const r = await withTimeout(otdb({ amount: 50, difficulty: want, token: tok, accept: ['medium', 'hard'] }), 6000);
      if (r.code === 3 || r.code === 4) tok = '';
      if (r.items.length) return { items: r.items, token: tok, source: 'otdb', code: r.code };
    } catch { /* next */ }
    try {
      const items = await withTimeout(tapi({ limit: 30, accept: [want] }), 5000);
      if (items.length) return { items, token: tok, source: 'tapi' };
    } catch { /* next */ }
  }
  const fb = fallback ? fallback(want, seen) : null;
  return { items: fb || [], token: tok, source: 'bank' };
}

const bankPick = (want, seen) => pickFallback(12, { seen, d: want }) || [];

/** The opening bank (≈ one request, never long): a stock of MEDIUM to open on; HARD arrives in the first top-up. */
export async function initialPool({ code, matchId, now, roomSeen = {} }) {
  await loadFallback().catch(() => {});
  const shell = { matchId, trivia: { n: 0, seen: {} } };
  const first = await fetchBatch('medium', { seen: roomSeen, fallback: bankPick });
  let { patch } = addItems(shell, code, first.items, roomSeen);
  let game = applyPatch(shell, patch);
  // never open a match without a few questions of each kind
  for (const d of ['medium', 'hard']) {
    const have = Object.values(game.qmeta || {}).filter(m => m.endsWith(`|${d}`)).length;
    if (have >= 4) continue;
    const extra = addItems(game, code, bankPick(d, { ...roomSeen, ...(game.trivia.seen || {}) }), roomSeen);
    patch = { ...patch, ...extra.patch };
    game = applyPatch(game, extra.patch);
  }
  return {
    bank: game.bank || {}, qmeta: game.qmeta || {},
    trivia: { ...game.trivia, token: first.token || '', lastFetchAt: now, fails: first.source === 'otdb' ? 0 : 1 },
    $room: roomUsed(patch),
  };
}

const inflight = new Set();
/**
 * Between rounds: fetch more of the scarcer difficulty when the match will need it (no-op most ticks).
 * write(patch, $room) writes game/* paths + the room's used-question memory in one update.
 */
export async function topUp(game, code, now, write, roomSeen = {}) {
  const t = game.trivia || {};
  const want = nextWant(game);
  if (!want || inflight.has(game.matchId) || now - (t.lastFetchAt || 0) < OTDB_GAP_MS) return;
  inflight.add(game.matchId);
  try {
    await write({ 'trivia/lastFetchAt': now }, {});
    const b = await fetchBatch(want, { token: t.token, fails: t.fails || 0, seen: { ...roomSeen, ...(t.seen || {}) }, fallback: (d, seen) => ((t.fails || 0) >= 2 ? bankPick(d, seen) : null) });
    const { patch } = addItems(game, code, b.items, roomSeen);
    patch['trivia/token'] = b.token || '';
    patch['trivia/fails'] = b.items.length && b.source !== 'bank' ? 0 : (t.fails || 0) + 1;
    await write(patch, roomUsed(patch));
  } catch (e) { console.warn('stakes top-up', e); } finally { inflight.delete(game.matchId); }
}

/** Synchronous emergency supply for the director: a few bundled questions of difficulty d (null if the bank isn't loaded). */
export function fallbackPatch(game, code, d, roomSeen = {}) {
  const picks = pickFallback(6, { seen: { ...roomSeen, ...((game.trivia && game.trivia.seen) || {}) }, d });
  if (!picks || !picks.length) return null;
  const { patch } = addItems(game, code, picks, {});
  const out = {};
  for (const [k, v] of Object.entries(patch)) out[k] = v;
  out.$room = roomUsed(patch);
  return out;
}

function applyPatch(obj, patch) {
  const o = structuredClone(obj);
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('/');
    let x = o;
    for (const p of parts.slice(0, -1)) x = (x[p] ??= {});
    x[parts.at(-1)] = v;
  }
  return o;
}
