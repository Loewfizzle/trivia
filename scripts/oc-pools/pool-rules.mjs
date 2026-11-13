// OVERCLOCK POOLS — THE POOL RULES (THE POOL FIXES, Nov 13 — the owner's 8 builder rules from the fact-check reviews; docs/overclock.md
// "THE POOL RULES"). Each rule is a CHECK the build runs on every row (build.mjs drops + counts a row that breaks one) and the content test
// runs again on every shipped + reserved item (tests/overclock-pool-rules.test.mjs) — so the next build can't regress:
//   1. MISSING LINK joins are REAL compounds / phrases (both halves): a coincidental letter run (LEG+END, TAPE+RED, REST+ORE) is out
//   2. US-ONLY joins + spellings: no British-only compound (COASTGUARD, COTTON WOOL, POWER POINT …), a one-word join in the AMERICAN dictionary
//   3. an answer's IRREGULAR PLURAL is in `accept` (MAN → MEN, FLY → FLIES, KNIFE → KNIVES) — plus any other word that joins all three clues
//   4. THE KID-SAFE FILTER on every bank (kidsafe.mjs)
//   5. "CAME OUT" = the RELEASE year (hand/pool-fixes.mjs#FACT_FIX — the deliveries, the opening; never the unveil or the start of work)
//   6. a NATIONAL PARK's year = its NATIONAL PARK designation (hand/pool-fixes.mjs#NP_YEAR — the only source of a park's year)
//   7. a SHARED TITLE carries its YEAR in the prompt (a decade question about one is out — its year IS the answer)
//   8. an AREA / HEIGHT question names its MEASURE (total area incl. water · above sea level · to the architectural top / the tip)
// Node only (the build + the tests); never shipped.
import { norm } from './lib.mjs';
import { unsafeIn } from './kidsafe.mjs';
import { dictionaries } from './dict.mjs';
import { joinOk, joined } from './phrases.mjs';
import { SHARED_TITLES, SHARED_BOOKS, SHARED_PAINTINGS } from './hand/pool-fixes.mjs';

export { unsafeIn };

// ---------------------------------------------------------------- RULE 1 — REAL COMPOUNDS
/** joins the dictionary holds but that are NOT the two words put together (a coincidental letter run) — always out */
export const FALSE_COMPOUNDS = new Set(['tapered', 'legend', 'restore', 'restart', 'reinvest', 'reinforce', 'hammock', 'carpet', 'season',
  'button', 'pantry', 'pirate', 'portion', 'mandate', 'bandage', 'cabinet', 'canteen', 'cartoon', 'catalog', 'kidney', 'pigment', 'washer', 'bargain',
  'scarf', 'heroin', 'ottoman', 'manage', 'message', 'passage', 'office', 'tendon', 'warden', 'penname']);
/** joins the heuristic flags (a prefix / suffix reading — FIRE·FIGHTER vs FIREFIGHT·ER) that ARE real compounds of the two words — read by hand */
export const COMPOUND_OK = new Set(['tiebreaker', 'crossroads', 'henpecked', 'steamroller', 'hamburger', 'prizefighter', 'caseworker', 'proofreader',
  'lipreader', 'firefighter', 'bullfighter', 'foretelling', 'eyeglasses', 'lamplighter', 'highlighter', 'hamstring', 'backstairs']);
const PFX = ['re', 'un', 'de', 'dis', 'mis', 'pre', 'in', 'im', 'en', 'ex', 'con', 'com', 'pro', 'sub', 'per'];
const SFX = ['ed', 'er', 'ing', 's', 'es', 'ly', 'y', 'en', 'ish', 'ness', 'ment', 'ion', 'ity', 'al', 'ate'];
/**
 * RULE 1: is a ONE-WORD join a real compound of its two halves? → null, or why not. The halves are the clue + the answer (k = the first
 * half's length). A join that reads more naturally as PREFIX + word (RE·START) or word + SUFFIX (TAPER·ED) at a DIFFERENT cut is suspect —
 * out unless read by hand (COMPOUND_OK); a known false compound is always out.
 */
export function falseCompound(join, k) {
  const j = String(join).toLowerCase();
  if (FALSE_COMPOUNDS.has(j)) return `${j}: not a compound of its halves`;
  if (COMPOUND_OK.has(j)) return null;
  const { isWord } = dictionaries();
  for (const x of PFX) if (j.startsWith(x) && x.length !== k && j.length - x.length >= 3 && isWord(j.slice(x.length))) return `${j}: reads as ${x}+${j.slice(x.length)}`;
  for (const x of SFX) {
    const stem = j.slice(0, -x.length);
    if (j.endsWith(x) && stem.length !== k && stem.length >= 3 && isWord(stem) && stem !== j.slice(0, k)) return `${j}: reads as ${stem}+${x}`;
  }
  return null;
}

// ---------------------------------------------------------------- RULE 2 — US-ONLY
/** British-only compounds + phrases (Cambridge / Collins / M-W "chiefly British") — never a join */
export const BRITISH_ONLY = new Set(['coastguard', 'cotton wool', 'power point', 'plughole', 'minicab', 'newsreader', 'beetroot', 'puppy fat',
  'bouncy castle', 'firelighter', 'shop window', 'cabstand', 'dustbin', 'dustman', 'lorry', 'motorway', 'carriageway', 'postbox', 'postcode',
  'roundabout', 'petrol station', 'car park', 'chemist shop', 'tea towel', 'washing up', 'football pitch', 'jumble sale', 'cashpoint', 'number plate',
  'zebra crossing', 'high street', 'fairy cake', 'ice lolly', 'candyfloss', 'biro', 'sellotape', 'hoover', 'fringe benefit']);
/** ONE-WORD joins only ENABLE holds (not the American dictionary) that are everyday AMERICAN words — read by hand */
export const ENABLE_US_OK = new Set(['hotdog', 'roundtable', 'pinecone', 'drumroll', 'nametag', 'countertop', 'henhouse', 'bodysurf', 'eyeshade',
  'candleholder', 'sightsee', 'lowlight', 'crewneck', 'kneesock', 'heartstring', 'whistleblower', 'clamshell', 'hatrack', 'boathook']);
/** RULE 2: an American join? → null, or why not */
export function notAmerican(join, sep) {
  const j = String(join).toLowerCase();
  if (BRITISH_ONLY.has(j)) return `${j}: British`;
  if (sep === '') {
    const { isWord, gb, us } = dictionaries();
    if (!isWord(j) && !ENABLE_US_OK.has(j)) return `${j}: not in the American dictionary`;
    if (!us.has(j) && [...gb].some(w => w.toLowerCase() === j) && !ENABLE_US_OK.has(j)) return `${j}: British spelling`;
  }
  return null;
}

// ---------------------------------------------------------------- RULE 3 — IRREGULAR PLURALS (+ every other answer that fits)
const IRREGULAR = { man: 'men', woman: 'women', child: 'children', foot: 'feet', tooth: 'teeth', goose: 'geese', mouse: 'mice', person: 'people',
  ox: 'oxen', leaf: 'leaves', knife: 'knives', life: 'lives', wife: 'wives', wolf: 'wolves', half: 'halves', shelf: 'shelves', loaf: 'loaves',
  calf: 'calves', thief: 'thieves', elf: 'elves', self: 'selves', scarf: 'scarves', hoof: 'hooves', die: 'dice', cactus: 'cacti', fungus: 'fungi',
  crisis: 'crises', cookie: 'cookies' };
/** RULE 3: the answer's IRREGULAR plural(s) — a player may type them, so `accept` holds them (MAN → MEN, FLY → FLIES, KNIFE → KNIVES) */
export function irregularPlurals(answer) {
  const a = String(answer).toLowerCase(), out = new Set();
  if (IRREGULAR[a]) out.add(IRREGULAR[a]);
  for (const [s, p] of Object.entries(IRREGULAR)) if (s.length >= 3 && a.endsWith(s) && a !== s && !IRREGULAR[a]) out.add(a.slice(0, -s.length) + p);   // SNOWMAN → SNOWMEN
  if (/[^aeiou]y$/.test(a)) out.add(`${a.slice(0, -1)}ies`);                 // FLY → FLIES
  if (/man$/.test(a) && !IRREGULAR[a]) out.add(`${a.slice(0, -3)}men`);       // POSTMAN → POSTMEN
  const { isWord } = dictionaries();
  return [...out].filter(x => isWord(x)).map(x => x.toUpperCase()).filter(x => x !== String(answer).toUpperCase());   // (a real word only — never HUMEN)
}
/**
 * THE ONE-ANSWER RULE, SIDE-AWARE + WITH PHRASES (rule 3's other half — the review's WARD for TOWN, HIGH for LOW, BALL for BROW, SOFT for
 * HARD, WRITING for WRITER): any OTHER everyday word that joins ALL THREE clues — each on its own side, as one word OR a phrase on record —
 * goes in `accept` too. Candidates come from each clue's one-word compounds (the dictionary index); a candidate must be a plain word.
 * → the extra accepted words (upper case, sorted)
 */
let INDEX = null;
function compoundIndex() {
  if (INDEX) return INDEX;
  const { us } = dictionaries();
  const words = new Set([...us].filter(w => /^[a-z]{3,10}$/.test(w)));
  const after = new Map(), before = new Map();   // clue → the words X with clue+X (after) / X+clue (before) a word
  for (const w of us) {
    if (!/^[a-z]{6,20}$/.test(w)) continue;
    for (let i = 3; i <= w.length - 3; i++) {
      const a = w.slice(0, i), b = w.slice(i);
      if (!words.has(a) || !words.has(b)) continue;
      (after.get(a) || after.set(a, new Set()).get(a)).add(b);
      (before.get(b) || before.set(b, new Set()).get(b)).add(a);
    }
  }
  return (INDEX = { after, before, words });
}
export function otherAnswers(clues, answer) {
  const { after, before, words } = compoundIndex();
  const a = String(answer).toLowerCase();
  const cand = new Set();
  // (candidates from the ONE-WORD clues only — the compound index; a puzzle of three phrases gets no search: its second answers, if any, are
  //  hand-read into ML_ACCEPT_ADD — so a phrase is only ever looked up for a word that already fits a one-word clue)
  //  (…and it needs TWO one-word clues to narrow on: with one, every word that fits it would cost a phrase lookup)
  if (clues.filter(c => !c[2]).length < 2) return [];
  for (const [w, side, sep] of clues) if (!sep) for (const x of ((side === 'after' ? after : before).get(w.toLowerCase()) || [])) cand.add(x);
  const out = [];
  const { isWord } = dictionaries();
  const stem = w => w.replace(/(ings?|ers?|ed|es|s|e)$/, '');
  // (a join counts as one AMERICAN word — en_US, not ENABLE's oddities — or a phrase on record; an inflection of the answer or an -ED / -ING
  //  form is never "another answer": MAKING for MAKER, BALLED for BROW's BALL)
  //  — and a clue the puzzle joins as ONE word takes a one-word join only (TAKE + OUT / OFF / OVER never accepts "took over")
  const joins = (w, x, side, sep) => isWord(joined(w, x, side, '')) || (sep === ' ' && joinOk(w, x, side, ' '));
  const cheapFirst = clues.slice().sort((p, q) => (p[2] || '').length - (q[2] || '').length);
  for (const x of [...cand].sort()) {
    if (x === a || stem(x) === stem(a) || /(ed|ing)$/.test(x) || !words.has(x)) continue;
    // (the one-word clues first: a phrase is looked up — and its verdict cached in cache/phrases.json — only for a candidate that already fits them)
    if (cheapFirst.every(([w, side, sep]) => joins(w.toLowerCase(), x, side, sep || ''))) out.push(x.toUpperCase());
  }
  return out;
}
/** RULES 1 + 2 + 4 on one MISSING LINK puzzle → [why, …] (empty = it passes) */
export function mlBreaks(p) {
  const why = [];
  for (const [w, side, sep] of p.clues) {
    const j = joined(w, p.answer, side, sep || '').toLowerCase();
    const k = (side === 'before' ? p.answer : w).length;
    if (!sep) { const f = falseCompound(j, k); if (f) why.push(`rule 1 — ${f}`); }
    const b = notAmerican(j, sep || '');
    if (b) why.push(`rule 2 — ${b}`);
    if (unsafeIn(j).length) why.push(`rule 4 — ${j}`);
  }
  return why;
}

// ---------------------------------------------------------------- RULE 7 — SHARED TITLES carry their year
const SHARED = { screen: new Set(SHARED_TITLES.map(norm)), book: new Set(SHARED_BOOKS.map(norm)), painting: new Set(SHARED_PAINTINGS.map(norm)) };
const YEAR = /\b(1[0-9]{3}|20[0-9]{2})\b/;
// where a prompt names a WORK (trivia + true-or-false templates — the title slot only, so "It" or "Heat" never match a plain word)
const TITLE_SLOTS = [
  ['screen', /^In which decade did the (?:movie|video game|cartoon) (.+?) (?:first )?(?:come out|air)\?$/],
  ['book', /^In which decade was the book (.+?) first published\?$/],
  ['screen', /^In which decade did (?:the )?(.+?) (?:first come out|open)\?$/],
  ['book', /^Who wrote (.+?)(?: \(\d{4}\))?\?$/],
  ['painting', /^Who painted (.+?)(?: \(\d{4}\))?\?$/],
  ['screen', /^Who directed (?:the movie )?(.+?)(?: \(\d{4}\))?\?$/],
  ['screen', /^(?:The \d{4} (?:film|movie|game) )?(.+?) (?:came out|first aired) in the \d{4}s\.$/],
  ['screen', /^(?:The \d{4} film )?(.+?) was directed by .+\.$/], ['book', /^(?:The \d{4} book )?(.+?) was written by .+\.$/],
  ['painting', /^(?:The \d{4} painting )?(.+?) was painted by .+\.$/],
  ['screen', /^.+? directed (?:the \d{4} film )?(.+?)\.$/], ['book', /^.+? wrote (?:the \d{4} book )?(.+?)\.$/],
  ['painting', /^.+? painted (?:the \d{4} painting )?(.+?)\.$/],
];
/** the shared title a prompt names WITHOUT its year → that title, or null */
export function sharedTitleNoYear(text) {
  const t = String(text);
  if (YEAR.test(t.replace(/\b(?:the )?\d{4}s\b/g, ''))) return null;   // ("the 1990s" is a decade, not the title's year)
  for (const [kind, re] of TITLE_SLOTS) {
    const m = re.exec(t);
    if (m && SHARED[kind].has(norm(m[1]))) return m[1];
  }
  return null;
}
export const isShared = (title, kind = 'screen') => SHARED[kind].has(norm(title));

// ---------------------------------------------------------------- RULE 8 — the measure named
/** RULE 8 on a CLOSEST CALL question (unit km2 → an area; a building / tower height) → null, or what's missing */
export function measureMissing(q, unit, stat) {
  if (unit === 'km2' && !/\b(total area|land area|surface area|area of land)\b/i.test(q)) return 'an area question must say total / land / surface area';
  if (stat === 'tall' && !/\b(architectural top|to its tip|to the tip|roof|including its antenna|not counting)\b/i.test(q)) return 'a height question must say to the architectural top or to the tip';
  return null;
}
/** RULE 8 on a TRIVIA comparison ("Which of these … is the largest / highest / tallest …") */
export function compareMeasureMissing(q) {
  if (!/^Which of these /.test(q)) return null;
  if (/\b(largest|biggest|smallest)\b/.test(q) && !/\b(by total area|by surface area|by land area|by area)\b/.test(q)) return 'a size comparison names its measure';
  if (/\bhighest\b/.test(q) && /mountain|peak/.test(q) && !/above sea level/.test(q)) return 'a mountain comparison says "above sea level"';
  if (/\btallest\b/.test(q) && !/(architectural|tip|roof)/.test(q)) return 'a height comparison names its measure';
  return null;
}
