// HUSH WORDS (PURE): which word a new room gets, and the light guard against guessing words.
// The room's code IS its hush word (rooms/{WORD}). A word is free when no open room has it (the claim — a transaction on
// rooms/{WORD}/meta — decides that) and no room with it closed in the last 24 h (hush/{WORD}.closedAt). docs/data-model.md
export const HUSH_COOL_MS = 24 * 60 * 60 * 1000;
export const HUSH_TRIES = 25;          // free words tried before falling back to the oldest-cooled ones
export const MISS_MAX = 5;             // wrong words in MISS_WINDOW_MS on one device…
export const MISS_WINDOW_MS = 60_000;
export const MISS_COOLDOWN_MS = 30_000; // …and the door stays shut this long

export const cooling = (entry, now) => !!entry && typeof entry.closedAt === 'number' && now - entry.closedAt < HUSH_COOL_MS;

function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * The words to try, in order: up to `tries` random free words (never one closed in the last 24 h, never one already tried),
 * then every cooled word, the longest-cooled first — so a room is always created, even if every word were taken.
 * @param {string[]} words  the list (data/hushwords.json)
 * @param {object}   hush   hush/ — { WORD: { closedAt } }
 */
export function hushCandidates(words, hush, now, { rand = Math.random, tried = new Set(), tries = HUSH_TRIES } = {}) {
  hush = hush || {};
  const free = shuffle(words.filter(w => !tried.has(w) && !cooling(hush[w], now)), rand).slice(0, tries);
  const cooled = words.filter(w => !tried.has(w) && cooling(hush[w], now)).sort((a, b) => hush[a].closedAt - hush[b].closedAt);
  return [...free, ...cooled];
}

/** hush/ entries older than 24 h (the cleanup deletes them; capped so one write stays small). */
export function staleHush(hush, now, max = 50) {
  return Object.keys(hush || {}).filter(w => !cooling(hush[w], now)).slice(0, max);
}

/** Tries each candidate with `claim(word) → Promise<boolean>` (atomic) until one sticks; null if none did. */
export async function claimFirst(candidates, claim) {
  for (const w of candidates) {
    let ok = false;
    try { ok = await claim(w); } catch { ok = false; }
    if (ok) return w;
  }
  return null;
}

// ---- guessing guard: a device that keeps typing wrong words waits a little (the rules can't count misses; this is light)
/** Misses still inside the window (timestamps, oldest first). */
export const recentMisses = (misses, now) => (Array.isArray(misses) ? misses : []).filter(t => typeof t === 'number' && now - t < MISS_WINDOW_MS + MISS_COOLDOWN_MS);

/** ms left before this device may try another word (0 = go ahead). */
export function missCooldown(misses, now) {
  const m = recentMisses(misses, now);
  for (let i = m.length - 1; i >= MISS_MAX - 1; i--) {
    // the MISS_MAX-th miss inside one window shuts the door for MISS_COOLDOWN_MS from that miss
    if (m[i] - m[i - (MISS_MAX - 1)] <= MISS_WINDOW_MS) return Math.max(0, m[i] + MISS_COOLDOWN_MS - now);
  }
  return 0;
}
