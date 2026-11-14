// PRISM DROP — THE SKIN COUNTER (SKINS 1 — docs/prism.md "THE SKINS"; the owner's rule: docs/games/plan.md "SKINS 1 — ROTATION"). PURE + a LEAF:
// the cartridge's index.js (the host's deal at start()) + THE DROP's view take it without loading a skin's art (skins.js re-exports it).
// A match carries ONE counter k (`game.sk`); every phone draws pool[k % its pool size] (skins.js#skinOf) — the same pool = the same skin, every
// skin before a repeat, never the same twice in a row. A ROOM's k = the host's, +1 a match, from the night's memory; a SOLO run's + THE DROP's
// = the PLAYER's own (this phone's settings, +1 a run).
//   skinK(game) · dealSkin(seed, used) → { k, key } · soloSkin(cur) → { k, next } · dropSkin(settings, day) → { k, patch } · SK_START

/** the match's skin counter: the host's deal (`game.sk`); a game from before SKINS 1 (no counter) = 0 — the look's first skin */
export const skinK = game => (game && Number.isInteger(game.sk) && game.sk >= 0 ? game.sk : 0);
/**
 * THE HOST's deal at start(): the room's skin counter, +1 a match — remembered in THE NIGHT'S MEMORY (meta/used/prism: `sk<k>` = a match
 * tonight drew counter k; no rules change — kit/night.js, like the paper's `pp<k>-<i>`). The night's first match starts from the match's seed
 * (a room's first skin isn't always the same one). → { k, key } (key → `markUsed('prism', [key])`)
 */
export function dealSkin(seed, used = {}) {
  const past = Object.keys(used || {}).map(k => /^sk(\d+)$/.exec(k)).filter(Boolean).map(m => Number(m[1]));
  const k = past.length ? Math.max(...past) + 1 : hash(String(seed)) % SK_START;
  return { k, key: `sk${k}` };
}
/** the first counter of a night is under this (a multiple of every pool size up to 6 — every skin is as likely to open a night) */
export const SK_START = 60;
/** THE PLAYER's OWN COUNTER (a solo run + THE DROP — this phone's settings, +1 a run): cur = settings.prismSkinK → { k, next } */
export function soloSkin(cur) {
  const k = Number.isInteger(cur) && cur >= 0 ? cur : 0;
  return { k, next: (k + 1) % 1_000_000 };
}
/**
 * THE DROP's counter: the player's own, ONE a day's run — a refresh / a resume of the same day's run draws the SAME skin (settings.prismSkinDrop
 * = { d: the day, k }); a new day takes the next. → { k, patch } (patch = what to save: null when this day's k is already kept)
 */
export function dropSkin(settings, day) {
  const kept = settings && settings.prismSkinDrop;
  if (kept && kept.d === day && Number.isInteger(kept.k) && kept.k >= 0) return { k: kept.k, patch: null };
  const r = soloSkin(settings && settings.prismSkinK);
  return { k: r.k, patch: { prismSkinK: r.next, prismSkinDrop: { d: day, k: r.k } } };
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
