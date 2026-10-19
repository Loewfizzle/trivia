// HUSH WORDS: checks scripts/hushwords/words.txt and writes data/hushwords.json (sorted, one array of words).
//   node scripts/build-hushwords.mjs           → writes the JSON, or lists every problem and writes nothing
//   node scripts/build-hushwords.mjs --check   → only checks (the unit tests run the same checks on the JSON)
// The rules (docs/content.md → HUSH WORDS): exactly 4 letters A–Z, no duplicates, nothing from blocked.txt, no word that
// sounds like another word (homophones.txt).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
const read = p => readFileSync(new URL(p, ROOT), 'utf8');

// one entry per token; '#' starts a comment
export function tokens(text) {
  return text.split('\n').map(l => l.replace(/#.*/, '')).join(' ').split(/\s+/).filter(Boolean).map(w => w.toUpperCase());
}

export function readLists() {
  const words = tokens(read('scripts/hushwords/words.txt'));
  const blocked = new Set(tokens(read('scripts/hushwords/blocked.txt')));
  const groups = read('scripts/hushwords/homophones.txt').split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean)
    .map(l => l.split(/\s+/).map(w => w.toUpperCase()));
  // every word that sounds like another word → what it sounds like
  const homophones = new Map();
  for (const g of groups) for (const w of g) homophones.set(w, [...(homophones.get(w) || []), ...g.filter(x => x !== w)]);
  return { words, blocked, homophones };
}

/** Everything wrong with a word list (an empty array = good). */
export function problems(words, { blocked, homophones }) {
  const out = [];
  const seen = new Set();
  for (const w of words) {
    if (!/^[A-Z]{4}$/.test(w)) out.push(`${w}: not 4 letters A–Z`);
    if (seen.has(w)) out.push(`${w}: listed twice`);
    seen.add(w);
    if (blocked.has(w)) out.push(`${w}: blocked`);
    if (homophones.has(w)) out.push(`${w}: sounds like ${homophones.get(w).join(' / ')}`);
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const lists = readLists();
  const bad = problems(lists.words, lists);
  if (bad.length) { console.error(`${bad.length} problem(s):\n  ` + bad.join('\n  ')); process.exit(1); }
  const words = [...lists.words].sort();
  if (!process.argv.includes('--check')) {
    writeFileSync(new URL('data/hushwords.json', ROOT), JSON.stringify(words) + '\n');
    console.log(`data/hushwords.json: ${words.length} words`);
  } else console.log(`ok: ${words.length} words`);
}
