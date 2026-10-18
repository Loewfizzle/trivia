// HIGH STAKES question supply, the pure part (the host's fetching is in feed.js).
// The room keeps an obfuscated bank (game/bank/{i}, XOR + base64 with a per-match key) and a PUBLIC index of what each
// entry is (game/qmeta/{i} = "science|hard") so the director can plan rounds without reading the questions themselves.
// Sources, in order: Open Trivia DB (session token, ≥ 5 s between requests, 50 a batch) → The Trivia API → the bundled bank.
// MEDIUM and HARD only (never kid-level); questions pass the shared filters (sources.js#acceptable, #tooSpecific).
import { encodeJSON, decodeJSON } from '../../core/obfuscate.js';
import { qHash } from '../../trivia/bank.js';
import { catFromOtdb, catFromTapi, catFromBank } from './logic.js';

export const qKey = (code, matchId, i) => `${code}:${matchId}:hs${i}`;
export const decodeQ = (game, code, i) => (game && game.bank && game.bank[i] != null ? decodeJSON(game.bank[i], qKey(code, game.matchId, i)) : null);

/** The table category of a normalized item ({ q, a, c, cat, d, src, cn }), or null when it doesn't belong at this table. */
export function tableCategory(item) {
  if (!item || !['medium', 'hard'].includes(item.d)) return null;
  if (item.src === 'otdb') return catFromOtdb(item.cn);
  if (item.src === 'tapi') return catFromTapi(item.cn) || 'general';
  return catFromBank(item.cat);
}

/** Appends items to the bank (skipping repeats in this match and this room). → { patch, n, added } */
export function addItems(game, code, items, roomSeen = {}) {
  const t = game.trivia || {};
  let n = t.n || 0;
  const seen = { ...(t.seen || {}) };
  const patch = {};
  let added = 0;
  for (const it of items || []) {
    const cat = tableCategory(it);
    if (!cat) continue;
    const h = qHash(it.q);
    if (seen[h] || roomSeen[h]) continue;
    seen[h] = true;
    patch[`bank/${n}`] = encodeJSON({ q: it.q, a: it.a, c: it.c, cat, d: it.d }, qKey(code, game.matchId, n));
    patch[`qmeta/${n}`] = `${cat}|${it.d}`;
    patch[`trivia/seen/${h}`] = true;
    n++; added++;
  }
  patch['trivia/n'] = n;
  return { patch, n, added };
}

/** Questions still unplayed, by difficulty. */
export function unplayed(game) {
  const used = new Set(Object.values(game.plan || {}).map(p => p.i));
  const out = { medium: 0, hard: 0 };
  for (const [i, m] of Object.entries(game.qmeta || {})) if (!used.has(Number(i))) out[String(m).split('|')[1]] = (out[String(m).split('|')[1]] || 0) + 1;
  return out;
}

/** Which difficulty to fetch next (the scarcer one, against what the rest of the match still needs) — or null when stocked. */
export function nextWant(game) {
  const left = unplayed(game);
  const plan = game.dplan || [];
  const r = game.round || 0;
  const need = { medium: 0, hard: 0 };
  for (let i = r; i < plan.length; i++) need[plan[i]] += 1;
  const shortH = need.hard + 3 - left.hard, shortM = need.medium + 3 - left.medium;
  if (shortH <= 0 && shortM <= 0) return null;
  return shortH >= shortM ? 'hard' : 'medium';
}

/** A room-level record of the questions a patch just added (meta/used/trivia/{hash}), shared with the other trivia games. */
export const roomUsed = patch => Object.fromEntries(Object.keys(patch).filter(k => k.startsWith('trivia/seen/')).map(k => [`meta/used/trivia/${k.slice(12)}`, true]));
