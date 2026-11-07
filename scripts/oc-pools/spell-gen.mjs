// OVERCLOCK POOLS (OC7) — SPELLCHECK's CANDIDATE GENERATOR (a helper for the content author — never run by the build): everyday words that
// people misspell + their believable misspellings, for a person to READ and pick from. The build itself only checks what was picked
// (parts/90-spellcheck.mjs: right in the American dictionary, no wrong one a word anywhere — dict.mjs).
//   node scripts/oc-pools/spell-gen.mjs <count_1w.txt> <misspellings.txt> > candidates.txt
// count_1w.txt = Peter Norvig's word counts (MIT — https://norvig.com/ngrams/count_1w.txt): how everyday a word is.
// misspellings.txt = Wikipedia's "Lists of common misspellings/For machines" (wrong->right lines): the misspellings people really make.
import { readFileSync } from 'node:fs';
import { dictionaries } from './dict.mjs';
import { bannedIn } from './lib.mjs';
import { editOps } from './spell-rules.mjs';
import { writeFileSync } from 'node:fs';
import { SPELL_EXCLUDE } from './hand/spell-exclude.mjs';

/** the believable mistakes for a word: [{ w, kind, weight }] — the kinds people really make, heaviest first */
// a wrong option never carries a rude run of letters its right word doesn't (pissword)
export const RUDE = ['piss', 'shit', 'fuck', 'fuk', 'cunt', 'dick', 'cock', 'ass', 'tit', 'cum', 'fag', 'nig', 'sex', 'porn', 'poo', 'butt', 'damn', 'hell',
  'crap', 'slut', 'whore', 'bitch', 'rape', 'anal', 'anus', 'arse', 'boob', 'vagin', 'penis', 'dildo', 'turd', 'fart', 'pee', 'kill', 'nazi', 'gay', 'homo', 'jew'];
export const rudeIn = (wrong, right) => RUDE.some(r => wrong.includes(r) && !right.includes(r));
export function misspellings(word) {
  const out = new Map();
  const put = (w, kind, weight) => { if (w !== word && w.length >= 3 && (!out.has(w) || out.get(w).weight < weight)) out.set(w, { w, kind, weight }); };
  const V = 'aeiou';
  for (let i = 1; i < word.length; i++) {
    // a double letter written single (accommodate → accomodate) · a single one doubled (until → untill)
    if (word[i] === word[i - 1] && !V.includes(word[i])) put(word.slice(0, i) + word.slice(i + 1), 'double→single', 9);
    // (a single one doubled only where people double it: before a vowel — occasion → occassion — or a final l — until → untill)
    else if (!V.includes(word[i]) && word[i] !== word[i - 1] && word[i] !== word[i + 1] && /[bcdfglmnprstz]/.test(word[i]) && V.includes(word[i - 1]) && ((word[i + 1] && V.includes(word[i + 1])) || (i === word.length - 1 && word[i] === 'l'))) put(word.slice(0, i) + word[i] + word.slice(i), 'single→double', 7);
  }
  // ie ↔ ei (receive → recieve)
  for (let i = 0; i < word.length - 1; i++) {
    const two = word.slice(i, i + 2);
    if (two === 'ie' || two === 'ei') put(word.slice(0, i) + (two === 'ie' ? 'ei' : 'ie') + word.slice(i + 2), 'ie/ei', 9);
  }
  // the endings people mix up
  const ENDS = [['able', 'ible'], ['ible', 'able'], ['ance', 'ence'], ['ence', 'ance'], ['ant', 'ent'], ['ent', 'ant'], ['ary', 'ery'], ['ery', 'ary'],
    ['ous', 'ious'], ['ious', 'ous'], ['ar', 'er'], ['er', 'or'], ['or', 'er'], ['sion', 'tion'], ['tion', 'sion'], ['cede', 'ceed'], ['ceed', 'cede'],
    ['ate', 'ite'], ['ite', 'ate'], ['ise', 'ice'], ['ice', 'ise'], ['ful', 'full'], ['ly', 'ley'], ['ally', 'aly'], ['ely', 'ly'], ['ence', 'ense'], ['ense', 'ence'],
    ['ment', 'ement'], ['ible', 'eble'], ['cy', 'sy'], ['sy', 'cy'], ['ize', 'ise']];
  for (const [a, b] of ENDS) if (word.endsWith(a)) put(word.slice(0, -a.length) + b, `-${a}/-${b}`, 8);
  // silent letters dropped (knowledge → nowledge is too silly: only inside the word) · letters people add (argument → arguement)
  const SILENT = [['rh', 'r'], ['gh', 'g'], ['mb', 'm'], ['mn', 'm'], ['sc', 's'], ['wr', 'r'], ['ps', 's'], ['gn', 'n'], ['bt', 't'], ['dge', 'ge'], ['tch', 'ch'], ['ght', 't']];
  for (const [a, b] of SILENT) { let i = word.indexOf(a, 1); while (i > 0) { put(word.slice(0, i) + b + word.slice(i + a.length), 'silent letter', 8); i = word.indexOf(a, i + 1); } }
  // a sound spelled another way: c/s, s/c, ph/f, k/c, x/cks, ture/cher …
  // (a soft c written s: necessary → nesessary · ph/f · ck/k · y → i · ea/ee …; never an s turned c — "becauce" is no one's mistake)
  // (never f → ph or x → cks: "efphective" and "eckspress" are nobody's mistake)
  const SOUND = [['ce', 'se'], ['ci', 'si'], ['ph', 'f'], ['ck', 'k'], ['sc', 'c'], ['ch', 'tch'], ['y', 'i'], ['ou', 'ow'], ['au', 'aw'], ['ea', 'ee'], ['ee', 'ea'], ['oo', 'ou']];
  for (const [a, b] of SOUND) { let i = word.indexOf(a, 1); while (i > 0) { put(word.slice(0, i) + b + word.slice(i + a.length), 'sound', 5); i = word.indexOf(a, i + 1); } }
  // an unstressed vowel written as another (separate → seperate, definite → definate)
  // (the schwa vowels only — a / e / i — and never one that makes a double vowel: "saarch")
  const SWAP = { a: 'ei', e: 'ai', i: 'ae' };
  // (never the first vowel — usually the stressed one: shipping → shapping is nobody's mistake — never inside -ing / -ed / -er / -ly)
  const firstV = [...word].findIndex(ch => V.includes(ch));
  const tail = (word.match(/(ing|ed|er|ly|es)$/) || [''])[0].length;
  for (let i = firstV + 2; i < word.length - 1 - tail; i++) if (SWAP[word[i]] && !V.includes(word[i - 1]) && !V.includes(word[i + 1])) for (const v of SWAP[word[i]]) put(word.slice(0, i) + v + word.slice(i + 1), 'vowel', 4);
  // a letter people add or drop (a silent e kept: truly → truely; one dropped: government → goverment)
  // (a letter people drop: an n or r before another consonant — government → goverment, library → libary)
  for (let i = 2; i < word.length - 1; i++) if ((word[i] === 'n' && word[i + 1] === 'm') || (word[i] === 'r' && word[i + 1] === 'p' && i < 4)) put(word.slice(0, i) + word.slice(i + 1), 'dropped letter', 6);
  if (/br/.test(word.slice(1))) { const i = word.indexOf('br', 1); put(word.slice(0, i + 1) + word.slice(i + 2), 'dropped letter', 6); }
  for (const suf of ['ly', 'ment', 'ful', 'ty', 'ry']) if (word.endsWith(suf)) { const s = word.slice(0, -suf.length); if (!s.endsWith('e')) put(`${s}e${suf}`, 'added e', 6); }
  return [...out.values()];
}

// ------------------------------------------------------------------------------------------------- the candidates (when run as a script)
if (process.argv[1] && process.argv[1].endsWith('spell-gen.mjs')) {
  const [freqFile, missFile] = process.argv.slice(2);
  const { us, anyWord } = dictionaries();
  const lower = new Set([...us].filter(w => /^[a-z]+$/.test(w)));
  const cap = new Set([...us].filter(w => /^[A-Z]/.test(w)).map(w => w.toLowerCase()));
  const attested = new Map();
  for (const line of readFileSync(missFile, 'utf8').split('\n')) { const m = /^\s*([a-z]+)->([a-z]+)\s*$/.exec(line); if (m) (attested.get(m[2]) || attested.set(m[2], new Set()).get(m[2])).add(m[1]); }
  const rank = new Map();
  readFileSync(freqFile, 'utf8').split('\n').forEach((l, i) => { const w = l.split('\t')[0]; if (w && !rank.has(w)) rank.set(w, i); });
  const TWO_WAYS = new Set(['judgment', 'theater', 'gray', 'canceled', 'traveled', 'catalog', 'fulfill', 'acknowledgment', 'barbecue', 'minuscule', 'liquefy',
    'jewelry', 'aging', 'likable', 'toward', 'afterward', 'dialog', 'analog', 'adviser', 'advisor', 'donut', 'mustache', 'pajamas', 'plow', 'skeptic', 'disk',
    'disc', 'ax', 'axe', 'okay', 'traveler', 'counselor', 'canceling', 'modeling', 'labeled', 'fueled', 'focused', 'benefited', 'appall', 'enroll', 'install',
    'installment', 'distill', 'instill', 'judgement', 'ageing', 'catsup', 'ketchup', 'cozy', 'esthetic', 'aesthetic', 'archaeology', 'archeology', 'mold',
    'smolder', 'omelet', 'omelette', 'sulfur', 'sulphur', 'yogurt', 'yoghurt', 'tire', 'curb', 'check', 'program', 'gauge', 'gage', 'licorice', 'pretense',
    'offense', 'defense', 'license', 'practice', 'practise', 'savior', 'saviour', 'whiskey', 'manoeuvre', 'maneuver', 'encyclopedia', 'fetus', 'anesthesia',
    'pediatric', 'hemoglobin', 'leukemia', 'esophagus', 'orthopedic']);
  // (a base word only: no plural, no -ies / -ied, no past or -ing form, no -est)
  const isBase = w => !((w.endsWith('ies') && lower.has(`${w.slice(0, -3)}y`)) || (w.endsWith('ied') && lower.has(`${w.slice(0, -3)}y`)) || (w.endsWith('est') && (lower.has(w.slice(0, -3)) || lower.has(w.slice(0, -4)))) || (w.endsWith('s') && lower.has(w.slice(0, -1))) || (w.endsWith('es') && lower.has(w.slice(0, -2))) || (w.endsWith('ed') && (lower.has(w.slice(0, -2)) || lower.has(w.slice(0, -1)))) || (w.endsWith('ing') && (lower.has(w.slice(0, -3)) || lower.has(`${w.slice(0, -3)}e`))) || (w.endsWith('ly') && lower.has(w.slice(0, -2)) && w.length > 8));
  const rows = [];
  for (const [w, r] of rank) {
    if (r > 40000 || w.length < 6 || w.length > 14 || !lower.has(w) || cap.has(w) || !isBase(w) || TWO_WAYS.has(w) || SPELL_EXCLUDE.has(w) || bannedIn(w).length) continue;
    const cands = misspellings(w).filter(c => !anyWord(c.w) && c.w.length <= 16 && !rudeIn(c.w, w));
    const att = attested.get(w) || new Set();
    for (const c of cands) if (att.has(c.w)) c.weight += 10;
    // (Wikipedia's list RANKS the rule-made ones — it also holds keyboard typos, so it never adds one of its own)
    void editOps;
    cands.sort((a, b) => b.weight - a.weight || a.w.localeCompare(b.w));
    // three wrong ones, each a different kind of mistake where it can be (the common one first)
    const pick = [];
    for (const c of cands) { if (pick.length >= 3) break; if (!pick.some(p => p.kind === c.kind) || cands.length < 6) pick.push(c); }
    for (const c of cands) { if (pick.length >= 3) break; if (!pick.includes(c)) pick.push(c); }
    // a word with no REAL TRAP (a double letter, ie/ei, the -able/-ible kind of ending, a silent letter — or one people are on record missing) is
    // no SPELLCHECK word: "number" → "numbor" fools nobody
    const REAL = ['double→single', 'ie/ei', '-able/-ible', '-ible/-able', '-ance/-ence', '-ence/-ance', '-ant/-ent', '-ent/-ant', '-ary/-ery', '-ery/-ary', 'silent letter', '-cede/-ceed', '-ceed/-cede', 'dropped letter', 'added e'];
    if (pick.length < 3 || !(pick.some(p => att.has(p.w)) || REAL.includes(pick[0].kind))) continue;
    rows.push([w, r, pick.map(p => p.w), pick.map(p => p.kind), pick.filter(p => att.has(p.w)).length]);
  }
  for (const [w, r, ws, ks, a] of rows) console.log(`${w}\t${r}\t${ws.join(' ')}\t${ks.join(',')}\t${a}`);
  console.error(`${rows.length} candidates`);
  // --write <n>: the n best NEW words (attested traps first, then the most everyday) → hand/spellcheck-picked.json (the rows a person read)
  const wi = process.argv.indexOf('--write');
  if (wi > 0) {
    const n = Number(process.argv[wi + 1]) || 1100;
    const legacy = new Set(JSON.parse(readFileSync(new URL('./hand/legacy-spellcheck.json', import.meta.url), 'utf8')).words.map(r => r[0]));
    const picked = rows.filter(r => !legacy.has(r[0])).sort((a, b) => (b[4] > 0) - (a[4] > 0) || a[1] - b[1]).slice(0, n).sort((a, b) => a[0].localeCompare(b[0]));
    writeFileSync(new URL('./hand/spellcheck-picked.json', import.meta.url), `{"note":"OVERCLOCK SPELLCHECK — new words (OC7): [right, the most common misspelling, wrong, wrong]. Made by spell-gen.mjs from everyday words with a real trap, READ by hand (hand/spell-exclude.mjs = what was cut); the build checks every row against the dictionaries (parts/90-spellcheck.mjs).","words":[\n${picked.map(r => JSON.stringify([r[0], ...r[2]])).join(',\n')}\n]}\n`);
    console.error(`wrote ${picked.length} to hand/spellcheck-picked.json`);
  }
}
