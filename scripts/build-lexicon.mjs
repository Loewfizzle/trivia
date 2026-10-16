// Builds data/oc/lexicon.json — the letter sets for OVERCLOCK's LEXICON challenge.
//
//   node scripts/build-lexicon.mjs <sourceDir>
//
// <sourceDir> must contain enable1.txt and count_1w.txt (same sources and URLs as scripts/build-words.mjs).
//
// Dictionary = ENABLE words of 3–9 letters that also appear in Norvig's 333k list — the same rule as
// Cipher Breach's valid guesses (data/words/valid-N.json), extended to 3–9 letters.
// Each set = a common 7-letter word (data/words/answers-7.json) + 2 extra letters, so a 7+ letter word
// is always possible. A set is kept only if its longest words are 7 or 8 letters long, every longest
// word is reasonably well known (Norvig rank < 60k, nothing offensive), and it has plenty of words.
// Output: { format, sets: [[letters(9), maxLen, "longest words", "every valid word (3+)"], …] }
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/build-lexicon.mjs <sourceDir>'); process.exit(1); }
const lines = file => readFileSync(join(src, file), 'utf8').split(/\r?\n/);

const enable = new Set(lines('enable1.txt').map(w => w.trim()).filter(Boolean));
const rank = new Map();
lines('count_1w.txt').forEach((l, i) => { const w = l.split('\t')[0]; if (w && !rank.has(w)) rank.set(w, i); });
// same offensive / grim filters as build-words.mjs
const BLOCK_SUB = ['fuck', 'shit', 'cunt', 'nigg', 'porn', 'slut', 'whore', 'bitch', 'dildo', 'penis', 'vagin',
  'orgasm', 'masturb', 'sperm', 'semen', 'rapist', 'nazi', 'faggot', 'pussy', 'boob', 'jizz', 'wank', 'twat', 'cocks'];
const BLOCK_WORD = new Set(`anal anus arse asses bastard bimbo blowjob bondage booty boner breast breasts butt butts
crap crappy damn damned dick dicks dyke erotic erotica escort fetish gonad groin hooker horny hussy incest kinky
lesbo lust lusty milf moron morons negro nipple nipples nude nudes nudity orgy panties piss pissed queer rape raped
rapes raping retard scrotum sexed sexes sexier sexily sexing sexism sexist sexual sexy slave slaves spank spanked
strip stripper tits titty vulva weiner wiener whores zits homo homos hooters jihad suicide murder killer killed
corpse dildos crotch thong thongs pimp pimps pervert perverts bigot bigots harlot gypsy gyp
hell bloody heroin cocaine opium pantie panty junkie homicide lymphoma tumor cancer fetus`.split(/\s+/));
const blocked = w => BLOCK_WORD.has(w) || BLOCK_SUB.some(s => w.includes(s)) || w.startsWith('sex');

const dict = [...enable].filter(w => w.length >= 3 && w.length <= 9 && /^[a-z]+$/.test(w) && rank.has(w));
const counts = w => { const c = new Array(26).fill(0); for (const ch of w) c[ch.charCodeAt(0) - 97]++; return c; };
const dictC = dict.map(w => [w, counts(w)]);

// seeded RNG (mulberry32) so the file is reproducible
let s = 0x5eed1e;
const rand = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const EXTRA = 'eeeeaaaiioouttrrnnsslldcmph';
const VOWELS = new Set([...'aeiou']);

const seedsRaw = JSON.parse(readFileSync('data/words/answers-7.json', 'utf8'));
const seeds = [];
for (let i = 0; i < seedsRaw.length; i += 7) seeds.push(seedsRaw.slice(i, i + 7));

const out = [];
const usedLetters = new Set();
for (const seed of seeds.sort(() => rand() - 0.5)) {
  if (out.length >= 320) break;
  if (blocked(seed)) continue;
  for (let attempt = 0; attempt < 3; attempt++) {
    const extra = [EXTRA[Math.floor(rand() * EXTRA.length)], EXTRA[Math.floor(rand() * EXTRA.length)]];
    const letters = [...seed, ...extra];
    const vowels = letters.filter(ch => VOWELS.has(ch)).length;
    if (vowels < 3 || vowels > 4) continue;
    if (Object.values(letters.reduce((m, ch) => ((m[ch] = (m[ch] || 0) + 1), m), {})).some(n => n > 2)) continue; // no triple letters
    const key = [...letters].sort().join('');
    if (usedLetters.has(key)) continue;
    const have = counts(letters.join(''));
    const words = dictC.filter(([, c]) => c.every((n, k) => n <= have[k])).map(([w]) => w);
    const max = Math.max(...words.map(w => w.length));
    const best = words.filter(w => w.length === max);
    if (max < 7 || max > 8) continue;
    if (best.some(w => blocked(w) || rank.get(w) > 60000)) continue;
    if (words.length < 35) continue;
    usedLetters.add(key);
    // shuffle the tiles so the seed word isn't spelled out
    for (let i = letters.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [letters[i], letters[j]] = [letters[j], letters[i]]; }
    out.push([letters.join(''), max, best.sort().join(' '), words.sort((a, b) => b.length - a.length || (a < b ? -1 : 1)).join(' ')]);
    break;
  }
}
mkdirSync('data/oc', { recursive: true });
writeFileSync('data/oc/lexicon.json', JSON.stringify({ format: '[letters (9 tiles), longest length, "longest words", "every valid word, 3+ letters"]', sets: out }));
const sevens = out.filter(x => x[1] === 7).length;
console.log(`${out.length} sets (${sevens} with max 7, ${out.length - sevens} with max 8); sample:`, out.slice(0, 3).map(x => `${x[0]} → ${x[2]} (${x[3].split(' ').length} words)`));
