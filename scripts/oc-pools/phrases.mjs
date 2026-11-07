// OVERCLOCK POOLS (OC7) — MISSING LINK's JOIN CHECK: is "SUN" + "FLOWER" a real word, is "ICE" + "CREAM" a real phrase? Node only.
//   a ONE-WORD join (sep '') — the joined word is in the American dictionary or ENABLE (dict.mjs): SUNFLOWER, FIREWORK
//   a TWO-WORD join (sep ' ') — the phrase has its own entry in WIKTIONARY (its list of entry titles: cache/wikt-raw/, 31 MB, UNCOMMITTED —
//     re-downloaded on a rebuild: https://dumps.wikimedia.org/enwiktionary/latest/enwiktionary-latest-all-titles-in-ns0.gz); every verdict is
//     kept in cache/phrases.json (COMMITTED), so an offline rebuild + the content test give the same answer without the dump.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import { HERE } from './lib.mjs';
import { dictionaries } from './dict.mjs';

const DUMP = join(HERE, 'cache', 'wikt-raw', 'enwiktionary-all-titles-in-ns0.gz');
const VERDICTS = join(HERE, 'cache', 'phrases.json');
export const PHRASE_SRC = 'https://dumps.wikimedia.org/enwiktionary/latest/enwiktionary-latest-all-titles-in-ns0.gz';

let titles = null, verdicts = null, dirty = false;
const loadVerdicts = () => (verdicts ||= existsSync(VERDICTS) ? JSON.parse(readFileSync(VERDICTS, 'utf8')) : {});
function loadTitles() {
  if (titles !== null) return titles;
  titles = false;
  if (!existsSync(DUMP)) return titles;
  const set = new Set();
  for (const t of gunzipSync(readFileSync(DUMP)).toString('utf8').split('\n')) if (/^[a-z]+_[a-z]+$/.test(t)) set.add(t.replace('_', ' '));
  titles = set;
  return titles;
}
/** a two-word phrase ("ice cream") with its own Wiktionary entry? (the verdict cache first, then the dump) */
export function onRecord(phrase) {
  const p = String(phrase).toLowerCase().trim();
  const v = loadVerdicts();
  if (p in v) return v[p];
  const t = loadTitles();
  if (!t) return false;              // no dump + no verdict = not confirmed (never kept on trust)
  v[p] = t.has(p);
  dirty = true;
  return v[p];
}
export const hasDump = () => !!loadTitles();
export function savePhrases() {
  if (!dirty || !verdicts) return;
  const keys = Object.keys(verdicts).sort();
  writeFileSync(VERDICTS, `{\n${keys.map(k => `${JSON.stringify(k)}:${verdicts[k]}`).join(',\n')}\n}\n`);
  dirty = false;
}
process.on('exit', savePhrases);

/** the joined text: SUNFLOWER · FIREWORK · ICE CREAM */
export const joined = (clue, answer, side, sep) => (side === 'before' ? `${answer}${sep}${clue}` : `${clue}${sep}${answer}`);
/** is this join real? (one word: a dictionary word · two words: a Wiktionary entry) */
export function joinOk(clue, answer, side, sep) {
  const j = joined(clue, answer, side, sep).toLowerCase();
  if (sep === '') { const { isWord, enable } = dictionaries(); return isWord(j) || enable.has(j); }
  return onRecord(j);
}
/** the join a clue makes with the answer — [side, sep] or null (one word first; a clue that joins both ways takes 'after') */
export function joinKind(clue, answer) {
  for (const sep of ['', ' ']) for (const side of ['after', 'before']) if (joinOk(clue, answer, side, sep)) return [side, sep];
  return null;
}
