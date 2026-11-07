// OVERCLOCK POOLS (OC6) — THE SOURCE CHECK for the WRITTEN items (the owner's decision 1: every written statement is checked against the
// source it names; anything that can't be confirmed is DROPPED, never guessed). Each written row names an English Wikipedia article (`src`)
// and a PROOF — the words the article must contain for the statement to stand:
//   "eight legs"                 the phrase appears
//   "canberra&capital"           every '&' term appears within one short stretch of the article (WINDOW characters)
//   "8849|8,849"                 any '|' alternative will do
// (case, accents, curly quotes, dashes and thousands commas are ignored on both sides). The article's plain text comes from the Wikipedia API
// (cached UNCOMMITTED under cache/wp-raw/ — a rebuild re-fetches it), and every verdict is kept in cache/checks.json (committed): an offline
// rebuild re-uses the verdicts, so it gives the same pools.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HERE, hash36 } from './lib.mjs';
import { OFFLINE } from './wikidata.mjs';

const RAW = join(HERE, 'cache', 'wp-raw');
const CHECKS = join(HERE, 'cache', 'checks.json');
const UA = 'NeonSpeakeasyPoolBuilder/1.0 (https://neonspeakeasy.com; fact check for a party game)';
export const WINDOW = 400;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** an article title → its URL (the `src` a pool item carries) */
export const wpUrl = title => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2C/g, ',').replace(/%27/g, "'").replace(/%28/g, '(').replace(/%29/g, ')')}`;
export const textNorm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[’‘`]/g, "'").replace(/[“”]/g, '"').replace(/[‐-―−]/g, '-').replace(/(\d),(?=\d{3}\b)/g, '$1').replace(/\s+/g, ' ');

/** does the text prove it? (PURE) */
export function proves(text, proof) {
  const t = textNorm(text);
  return String(proof).split('|').some(alt => {
    const terms = alt.split('&').map(x => textNorm(x).trim()).filter(Boolean);
    if (!terms.length) return false;
    let from = t.indexOf(terms[0]);
    while (from >= 0) {
      const lo = Math.max(0, from - WINDOW), hi = from + terms[0].length + WINDOW;
      const win = t.slice(lo, hi);
      if (terms.slice(1).every(x => win.includes(x))) return true;
      from = t.indexOf(terms[0], from + 1);
    }
    return false;
  });
}

let checks = null;
const loadChecks = () => (checks ||= existsSync(CHECKS) ? JSON.parse(readFileSync(CHECKS, 'utf8')) : {});
export function saveChecks() {
  if (!checks) return;
  const keys = Object.keys(checks).sort();
  writeFileSync(CHECKS, `{\n${keys.map(k => `${JSON.stringify(k)}:${JSON.stringify(checks[k])}`).join(',\n')}\n}\n`);
}

let lastAt = 0;
async function article(title) {
  mkdirSync(RAW, { recursive: true });
  const f = join(RAW, `${hash36(title)}.txt`);
  if (existsSync(f)) return readFileSync(f, 'utf8');
  if (OFFLINE) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const wait = Math.max(0, lastAt + 250 - Date.now());
    if (wait) await sleep(wait);
    lastAt = Date.now();
    const u = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&formatversion=2&titles=${encodeURIComponent(title)}`;
    const res = await fetch(u, { headers: { 'User-Agent': UA } }).catch(() => null);
    if (res && res.ok) {
      const j = await res.json();
      const pg = j.query && j.query.pages && j.query.pages[0];
      const text = pg && !pg.missing && pg.extract ? pg.extract : '';
      writeFileSync(f, text);
      return text;
    }
    await sleep(3000 * (attempt + 1));
  }
  return null;
}

/**
 * Check rows [{ id, title, proof }] → Map(id → { ok, why }). A verdict already on file for the same (article, proof) is re-used (offline too);
 * a new one fetches the article. Nothing that can't be checked passes.
 */
export async function checkRows(rows, { log = true } = {}) {
  const c = loadChecks();
  const out = new Map();
  let fresh = 0;
  for (const r of rows) {
    const k = `${r.title}::${r.proof}`;
    if (!c[k] || c[k].ok === null) {
      const text = await article(r.title);
      if (text == null) { out.set(r.id, { ok: false, why: 'not checked (offline)' }); continue; }
      c[k] = { ok: text.length > 0 && proves(text, r.proof), len: text.length };
      fresh++;
      if (log && fresh % 50 === 0) console.log(`  checked ${fresh} new…`);
    }
    out.set(r.id, { ok: !!c[k].ok, why: c[k].ok ? '' : c[k].len ? 'proof not in the article' : 'no such article' });
  }
  saveChecks();
  return out;
}
