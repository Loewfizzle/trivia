// Builds data/words/*.json from open word lists.
//
//   node scripts/build-words.mjs <sourceDir>
//
// <sourceDir> must contain:
//   enable1.txt   — ENABLE2K word list (public domain)
//                   https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt
//   count_1w.txt  — Peter Norvig's unigram counts (MIT)
//                   https://norvig.com/ngrams/count_1w.txt
//   en_US.dic     — SCOWL-derived Hunspell en_US dictionary (permissive SCOWL license)
//                   https://github.com/en-wl/wordlist/releases (hunspell-en_US-*.zip)
//
// valid-N.json   = ENABLE words of length N that also appear in Norvig's 333k list
//                  (drops the most obscure Scrabble-only entries, keeps files small).
// answers-N.json = the most frequent ENABLE words of length N that are also lowercase
//                  base words in Hunspell en_US (no names: a word that also appears
//                  capitalized is skipped), minus plurals, most past tenses and
//                  anything offensive. Hand-tuned blocklist below.
//
// Each file is a JSON string of fixed-width words concatenated together
// ("aboutabove...") — the smallest format that still parses instantly.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/build-words.mjs <sourceDir>'); process.exit(1); }

const LENGTHS = [5, 6, 7];
const ANSWERS_PER_LENGTH = { 5: 1400, 6: 1400, 7: 1300 };
const lines = file => readFileSync(join(src, file), 'utf8').split(/\r?\n/);

const enable = new Set(lines('enable1.txt').map(w => w.trim()).filter(Boolean));
const dicStems = lines('en_US.dic').slice(1).map(l => l.split('/')[0]);
const capitalized = new Set(dicStems.filter(w => /^[A-Z]/.test(w)).map(w => w.toLowerCase()));
const common = new Set(dicStems.filter(w => /^[a-z]+$/.test(w) && !capitalized.has(w)));
const freq = lines('count_1w.txt').map(l => l.split('\t')[0]).filter(Boolean);

// Substrings that disqualify a word anywhere it appears.
const BLOCK_SUB = ['fuck', 'shit', 'cunt', 'nigg', 'porn', 'slut', 'whore', 'bitch', 'dildo', 'penis', 'vagin',
  'orgasm', 'masturb', 'sperm', 'semen', 'rapist', 'nazi', 'faggot', 'pussy', 'boob', 'jizz', 'wank', 'twat', 'cocks'];
// Whole words that are excluded (offensive, crude, or too grim for a party game).
const BLOCK_WORD = new Set(`anal anus arse asses bastard bimbo blowjob bondage booty boner breast breasts butt butts
crap crappy damn damned dick dicks dyke erotic erotica escort fetish gonad groin hooker horny hussy incest kinky
lesbo lust lusty milf moron morons negro nipple nipples nude nudes nudity orgy panties piss pissed queer rape raped
rapes raping retard scrotum sexed sexes sexier sexily sexing sexism sexist sexual sexy slave slaves spank spanked
strip stripper tits titty vulva weiner wiener whores zits homo homos hooters jihad suicide murder killer killed
corpse dildos crotch thong thongs pimp pimps pervert perverts bigot bigots harlot gypsy gyp
hell bloody heroin cocaine opium pantie panty junkie homicide lymphoma tumor cancer fetus`.split(/\s+/));

const isBlocked = w => BLOCK_WORD.has(w) || BLOCK_SUB.some(s => w.includes(s)) || w.startsWith('sex');

// Plural / inflection heuristics so answers feel like Wordle answers.
function looksInflected(w) {
  if (w.endsWith('s') && !/(ss|us|is|ous|ics)$/.test(w)) return true;
  if (w.endsWith('ed') && w.length >= 6 && !/(eed|ied)$/.test(w)) return true;
  return false;
}

mkdirSync('data/words', { recursive: true });
const report = [];
for (const n of LENGTHS) {
  const valid = [];
  const answers = [];
  const seen = new Set();
  for (const w of freq) {
    if (w.length !== n || !/^[a-z]+$/.test(w) || !enable.has(w) || seen.has(w)) continue;
    seen.add(w);
    valid.push(w);
    if (answers.length < ANSWERS_PER_LENGTH[n] && common.has(w) && !isBlocked(w) && !looksInflected(w)) answers.push(w);
  }
  valid.sort();
  answers.sort();
  writeFileSync(`data/words/valid-${n}.json`, JSON.stringify(valid.join('')));
  writeFileSync(`data/words/answers-${n}.json`, JSON.stringify(answers.join('')));
  report.push(`${n}: ${answers.length} answers, ${valid.length} valid`);
}
console.log(report.join('\n'));
