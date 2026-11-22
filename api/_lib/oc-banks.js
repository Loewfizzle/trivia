// THE BEFORE-LAUNCH PASS — OVERCLOCK's pools for THE SERVER's RE-GRADE (js/games/overclock/regrade.js): the same BUILT files the phones fetch
// (js/games/overclock/banks.js — data/oc/*.json, each under its key), read from this deployment's own copy, once per warm function.
// Each file by its own literal URL (Vercel's file tracing follows `new URL('<literal>', import.meta.url)` — a computed name it can't see).
import { readFileSync } from 'node:fs';
import { BANK_FILES } from '../../js/games/overclock/banks.js';

const URLS = {
  trivia: new URL('../../data/oc/trivia.json', import.meta.url),
  truefalse: new URL('../../data/oc/truefalse.json', import.meta.url),
  timeline: new URL('../../data/oc/timeline.json', import.meta.url),
  closest: new URL('../../data/oc/closest.json', import.meta.url),
  missinglink: new URL('../../data/oc/missinglink.json', import.meta.url),
  spellcheck: new URL('../../data/oc/spellcheck.json', import.meta.url),
  sortit: new URL('../../data/oc/sortit.json', import.meta.url),
  higherlower: new URL('../../data/oc/higherlower.json', import.meta.url),
};
const cache = {};
/** the pool a type deals from ({} for a type with none) — null when the file can't be read (the re-grade then refuses nothing it can't check) */
export function ocBank(type) {
  if (!BANK_FILES[type]) return {};
  if (cache[type] !== undefined) return cache[type];
  try { const d = JSON.parse(readFileSync(URLS[type], 'utf8')); cache[type] = d[BANK_FILES[type].key] || null; } catch (e) { console.warn('oc bank', type, e.message); cache[type] = null; }
  return cache[type];
}
