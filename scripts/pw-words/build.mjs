// THE PASSWORD's ANSWER LIST (PW1 — docs/password.md "The list build"): SERVER-ONLY, never served, never imported by a page.
//
//   node scripts/pw-words/build.mjs <count_1w.txt> [--candidates]      (count_1w.txt = Peter Norvig's unigram counts — MIT, norvig.com/ngrams)
//
// The same sources docs/content.md's word lists use: ENABLE2K ∩ the Hunspell en_US (SCOWL) BASE WORDS (a lower-case STEM of the dictionary —
// never an expanded inflection, never a name), both committed gzipped in scripts/oc-pools/dict/, ranked by Norvig's frequency (how everyday
// a word is). Five letters. Minus: plurals (-s, with the words that only look plural kept — KEEP_S), past tenses (-ed, -ied), -ing forms of a
// verb (doing, using — "thing", "bring", "swing" stay), comparatives of an everyday adjective (wider, lower — "water", "paper" stay), the
// house blocklist (build-words.mjs's), THE KID-SAFE LIST, and — last — THE REVIEWER's cuts (cuts.json: a separate reviewer over the whole
// candidate list; the build fails if that file is missing, so no list ships unreviewed).
// --candidates writes scripts/pw-words/candidates.json (the list BEFORE the reviewer — what the reviewer reads) and stops.
//
// Output: api/_data/pw/answers.json { v, n, words (alphabetical — the order says nothing about the schedule) } + api/_data/pw/valid-5.json (a
// copy of data/words/valid-5.json — the server's spelling check; tests/password-list.test.mjs proves the two are identical and every answer
// is in it: a word a phone can't type is never an answer).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BLOCK_SUB, BLOCK_WORD, KIDSAFE, COMPARE_STEMS, KEEP_S } from './blocklist.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const HERE = fileURLToPath(new URL('./', import.meta.url));
const DICT = join(ROOT, 'scripts/oc-pools/dict');
const OUT = join(ROOT, 'api/_data/pw');
export const TARGET = 3600;          // candidates before the reviewer (the first 2,400 lost 1,012 to the reviewer → the pool was widened to land near 2,000)
export const LEN = 5;

const freqFile = process.argv.slice(2).find(a => !a.startsWith('--'));
const onlyCandidates = process.argv.includes('--candidates');
if (!freqFile) { console.error('usage: node scripts/pw-words/build.mjs <count_1w.txt> [--candidates]'); process.exit(1); }

const gz = f => gunzipSync(readFileSync(join(DICT, f))).toString('utf8');
const enable = new Set(gz('enable1.txt.gz').split(/\r?\n/).map(w => w.trim()).filter(Boolean));
const dicLines = gz('en_US.dic.gz').split(/\r?\n/).slice(1);
const stems = new Set(dicLines.map(l => l.split('/')[0]).filter(Boolean));
const lowerStems = new Set([...stems].filter(w => /^[a-z]+$/.test(w)));
const isWord = w => lowerStems.has(w);
const freq = readFileSync(freqFile, 'utf8').split(/\r?\n/).map(l => l.split('\t')[0]).filter(Boolean);

const blocked = new Set([...BLOCK_WORD, ...KIDSAFE]);
const isBlocked = w => blocked.has(w) || BLOCK_SUB.some(s => w.includes(s)) || w.startsWith('sex');
const compare = new Set(COMPARE_STEMS.flatMap(s => [`${s}r`, `${s}er`, `${s}${s[s.length - 1]}er`]));

/** why a word is not an answer (null = it may be one) */
export function reject(w) {
  if (w.length !== LEN || !/^[a-z]+$/.test(w)) return 'shape';
  if (!enable.has(w)) return 'not in ENABLE';
  if (!isWord(w)) return 'not a lower-case en_US base word';
  if (isBlocked(w)) return 'blocked';
  if (w.endsWith('s') && !/(ss|us|is|ous|ics)$/.test(w) && !KEEP_S.includes(w)) return 'plural';
  if (w.endsWith('ed') && !/(eed)$/.test(w) && !(w.endsWith('ied') && !isWord(`${w.slice(0, -3)}y`))) return 'past tense';
  if (w.endsWith('ing')) { const st = w.slice(0, -3); if (st.length >= 2 && (isWord(st) || isWord(`${st}e`) || (/(.)\1$/.test(st) && isWord(st.slice(0, -1))))) return '-ing form'; }
  if (compare.has(w)) return 'comparative';
  return null;
}

const picked = [], seen = new Set(), why = {};
for (const w of freq) {
  if (w.length !== LEN || seen.has(w)) continue;
  seen.add(w);
  const r = reject(w);
  if (r) { why[r] = (why[r] || 0) + 1; continue; }
  picked.push(w);
  if (picked.length >= TARGET) break;
}
mkdirSync(HERE, { recursive: true });
if (onlyCandidates) {
  writeFileSync(join(HERE, 'candidates.json'), JSON.stringify({ n: picked.length, words: picked }, null, 0).replace(/","/g, '", "'));
  console.log(`${picked.length} candidates → scripts/pw-words/candidates.json (rejected: ${Object.entries(why).map(([k, v]) => `${k} ${v}`).join(' · ')})`);
  process.exit(0);
}
// THE REVIEWER's cuts: cuts.json (the first 2,400 — one fresh reviewer) + cuts-tail.json (ranks 2,401+ — a second one); the build fails
// without them, so no list ships unreviewed
const cutFiles = ['cuts.json', 'cuts-tail.json'].map(f => join(HERE, f));
for (const f of cutFiles) if (!existsSync(f)) { console.error(`${f} is missing — run --candidates, have THE REVIEWER cut the list, then build`); process.exit(1); }
const cuts = new Set(cutFiles.flatMap(f => JSON.parse(readFileSync(f, 'utf8')).cut.map(w => String(w).toLowerCase())));
const words = picked.filter(w => !cuts.has(w)).sort();
const valid = JSON.parse(readFileSync(join(ROOT, 'data/words/valid-5.json'), 'utf8'));
const validSet = new Set(valid.match(/.{5}/g));
const missing = words.filter(w => !validSet.has(w));
if (missing.length) { console.error(`answers not in data/words/valid-5.json (a phone could never type them): ${missing.join(' ')}`); process.exit(1); }
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'answers.json'), JSON.stringify({ v: 1, n: words.length, words }, null, 0).replace(/","/g, '", "') + '\n');
writeFileSync(join(OUT, 'valid-5.json'), JSON.stringify(valid) + '\n');
console.log(`${words.length} answers → api/_data/pw/answers.json (${picked.length} candidates − ${picked.length - words.length} reviewer cuts; rejected by rule: ${Object.entries(why).map(([k, v]) => `${k} ${v}`).join(' · ')})`);
