// Host-side question supply for trivia games.
//
// Questions live in the room at game/bank/{i} (obfuscated), with bookkeeping in
// game/trivia { n, token, lastFetchAt, turn, fails, cats, seen }. Because all of
// it is in the database, a newly promoted host keeps topping up the same bank
// with the same Open Trivia DB session token.
//
// Medium difficulty only. Order of preference: The Trivia API (categories mixed within each batch,
// better curated) → Open Trivia DB (session token, ≥5 s between requests) → bundled fallback bank.
// Both APIs pass through sources.js#tooSpecific (no seasons / scores / "who won in 2016…").
import { dbRef, update, serverNow } from '../firebase.js';
import { selectedCategories } from './categories.js';
import { fetchOtdb, fetchTriviaApi, requestOtdbToken } from './sources.js';
import { loadFallback, pickFallback } from './bank.js';
import { appendPatch, roomUsedPatch } from './bankdata.js';
export { bankKey, decodeQuestion, appendPatch, fallbackPatch, roomUsedPatch } from './bankdata.js';

export const OTDB_GAP_MS = 5200;
const BATCH = 20;

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

function otdbPlan(trivia) {
  const all = selectedCategories(trivia.cats).flatMap(c => c.otdb);
  const ids = all.filter(id => id !== 21).length ? all.filter(id => id !== 21) : all; // never ask it for sports
  const turn = trivia.turn || 0;
  return { difficulty: 'medium', category: ids[Math.floor(turn / 2) % ids.length] };
}


// Builds the opening bank before a match starts (≈ one request; never blocks long).
// roomSeen = questions earlier matches in this room already used: they're skipped, and the
// returned `$room` patch records this match's questions so the next one skips them too.
export async function initialBank({ code, matchId, cats, now, min = 12, roomSeen = {} }) {
  // Start at a random category/difficulty: always opening on the same one meant every match
  // drew its first (often only) batch from the same small pool.
  const turn0 = Math.floor(Math.random() * Math.max(1, selectedCategories(cats).flatMap(c => c.otdb).length) * 2);
  const shell = { matchId, trivia: { n: 0, cats: cats || [], turn: turn0, fails: 0, seen: {} } };
  let items = [];
  try {
    items = await withTimeout(fetchTriviaApi({ limit: BATCH, categories: selectedCategories(cats).map(c => c.tapi) }), 4500);
  } catch { /* fall through */ }
  if (items.length < min) {
    try {
      const res = await withTimeout(fetchOtdb({ amount: BATCH, ...otdbPlan(shell.trivia) }), 4500);
      items = items.concat(res.items);
    } catch { /* fall through */ }
  }
  await loadFallback().catch(() => {});
  const game = { ...shell };
  const first = appendPatch(game, code, items, roomSeen);
  let bank = {};
  let seen = {};
  for (const [k, v] of Object.entries(first.patch)) {
    if (k.startsWith('bank/')) bank[k.slice(5)] = v;
    if (k.startsWith('trivia/seen/')) seen[k.slice(12)] = true;
  }
  let n = first.n;
  // Top up from the bundled bank: questions this room hasn't seen first, then (a very long night) anything unused this match.
  for (const avoidRoom of [true, false]) {
    if (n >= min) break;
    const skip = avoidRoom ? { ...roomSeen, ...seen } : seen;
    const picks = pickFallback(min - n, { cats: selectedCategories(cats).map(c => c.id), seen: skip }) || [];
    const extra = appendPatch({ matchId, trivia: { n, seen } }, code, picks, avoidRoom ? roomSeen : {});
    for (const [k, v] of Object.entries(extra.patch)) {
      if (k.startsWith('bank/')) bank[k.slice(5)] = v;
      if (k.startsWith('trivia/seen/')) seen[k.slice(12)] = true;
    }
    n = extra.n;
  }
  const $room = Object.fromEntries(Object.keys(seen).map(h => [`meta/used/trivia/${h}`, true]));
  return { bank, trivia: { n, cats: cats || [], turn: turn0 + 1, fails: 0, seen, lastFetchAt: now, token: '' }, $room };
}

const inflight = new Set();

// Keeps at least `want` questions in the bank. Call from the host loop (cheap no-op most ticks).
// getRoomSeen() returns the room's used-question hashes (skipped, and extended with what's added).
// getGame() returns the latest mirrored game so appends never clobber questions the
// director added from the fallback bank while this request was in flight.
export async function topUp(getGame, code, want, getRoomSeen = () => ({})) {
  const game = getGame();
  const t = game.trivia;
  if (!t || (t.n || 0) >= want || inflight.has(game.matchId)) return;
  const now = serverNow();
  if (now - (t.lastFetchAt || 0) < OTDB_GAP_MS) return;
  inflight.add(game.matchId);
  const ref = dbRef(`rooms/${code}/game`);
  try {
    await update(ref, { 'trivia/lastFetchAt': now });
    let items = [];
    const patch = {};
    // 1) The Trivia API
    try {
      items = await withTimeout(fetchTriviaApi({ limit: BATCH, categories: selectedCategories(t.cats).map(c => c.tapi) }), 5000);
    } catch { /* next */ }
    patch['trivia/fails'] = items.length ? 0 : (t.fails || 0) + 1;
    // 2) Open Trivia DB (its session token prevents repeats across batches; fetched on first use)
    if (!items.length && (t.fails || 0) < 4) {
      try {
        let token = t.token;
        if (!token) { token = await withTimeout(requestOtdbToken(), 4000).catch(() => ''); if (token) patch['trivia/token'] = token; }
        const res = await withTimeout(fetchOtdb({ amount: BATCH, token, ...otdbPlan(t) }), 5000);
        if (res.code === 3 || res.code === 4) patch['trivia/token'] = '';
        if (res.code !== 5) patch['trivia/turn'] = (t.turn || 0) + 1;
        items = res.items;
        if (items.length) patch['trivia/fails'] = 0;
      } catch { /* next */ }
    }
    // 3) the bundled bank, once the APIs keep failing
    if (!items.length && (t.fails || 0) >= 2) {
      await loadFallback().catch(() => {});
      items = pickFallback(10, { cats: selectedCategories(t.cats).map(c => c.id), seen: { ...getRoomSeen(), ...(t.seen || {}) } }) || [];
    }
    const latest = getGame();
    if (!latest || latest.matchId !== game.matchId) return;
    Object.assign(patch, appendPatch(latest, code, items, getRoomSeen()).patch);
    // one atomic room write: the game's bank + the room's memory of used questions
    const roomWrite = roomUsedPatch(patch);
    for (const [k, v] of Object.entries(patch)) roomWrite[`game/${k}`] = v;
    await update(dbRef(`rooms/${code}`), roomWrite);
  } catch (e) {
    console.warn('trivia top-up', e);
  } finally {
    inflight.delete(game.matchId);
  }
}
