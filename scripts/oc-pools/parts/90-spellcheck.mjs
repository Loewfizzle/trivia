// OVERCLOCK POOLS (OC7 Group 2) — SPELLCHECK's NEW WORDS (hand/spellcheck-picked.json: [right, the most common misspelling, wrong, wrong] — made
// by spell-gen.mjs from everyday words with a real trap, READ by hand; hand/spell-exclude.mjs = what was cut). Every row is CHECKED here:
//   the right spelling is a plain American word — Hunspell en_US from SCOWL (dict.mjs: lower case, never only a name)
//   no wrong one is a word ANYWHERE — en_US, en_GB (a British spelling is never "wrong"), ENABLE (calender, florescent …)
//   no wrong one carries a rude run of letters its right word doesn't (spell-gen.mjs#rudeIn)
//   the word isn't one with two accepted American spellings (the variant forms are tried against en_US)
// A row that fails one is DROPPED. hard = the letters the most common misspelling gets wrong (spell-rules.mjs#hardLetters).
import { join } from 'node:path';
import { HERE, readJSON } from '../lib.mjs';
import { dictionaries } from '../dict.mjs';
import { hardLetters } from '../spell-rules.mjs';
import { rudeIn } from '../spell-gen.mjs';
import { SPELL_EXCLUDE } from '../hand/spell-exclude.mjs';

// a second accepted American spelling (judgment / judgement, traveled / travelled …): these swaps tried against the American dictionary
const VARIANTS = [[/ment$/, 'ement'], [/ement$/, 'ment'], [/er$/, 're'], [/re$/, 'er'], [/or$/, 'our'], [/ize$/, 'ise'], [/og$/, 'ogue'], [/ogue$/, 'og'],
  [/l(ed|ing|er)$/, 'll$1'], [/ll(ed|ing|er)$/, 'l$1'], [/e$/, ''], [/ae/, 'e'], [/oe/, 'e'], [/ful$/, 'full'], [/ward$/, 'wards'], [/ey$/, 'y']];

export default async function spellcheck(ctx) {
  const { isWord, anyWord } = dictionaries();
  const rows = readJSON(join(HERE, 'hand', 'spellcheck-picked.json')).words;
  let kept = 0;
  const why = {};
  const no = (w, k) => { why[k] = (why[k] || 0) + 1; ctx.drop('sp', `written: ${k}`, w); };
  for (const [right, ...wrong] of rows) {
    if (SPELL_EXCLUDE.has(right)) { no(right, 'excluded by hand'); continue; }
    if (!isWord(right)) { no(right, 'not in the American dictionary'); continue; }
    const bad = wrong.filter(w => anyWord(w));
    if (bad.length) { no(`${right} (${bad.join(', ')})`, 'a wrong option is a word'); continue; }
    if (wrong.some(w => rudeIn(w, right))) { no(right, 'a rude wrong option'); continue; }
    const alt = VARIANTS.map(([re, to]) => (re.test(right) ? right.replace(re, to) : null)).filter(v => v && v !== right && isWord(v));
    if (alt.length) { no(`${right} (${alt.join(', ')})`, 'two accepted spellings'); continue; }
    ctx.sp.push({ id: `s-${right}`, right, wrong, hard: hardLetters(right, wrong[0]), src: `https://en.wiktionary.org/wiki/${right}` });
    kept++;
  }
  ctx.log.push(`SPELLCHECK (new): ${rows.length} picked · ${kept} kept · ${rows.length - kept} dropped (${Object.entries(why).map(([k, v]) => `${k} ${v}`).join(' · ') || 'none'})`);
}
