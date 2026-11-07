// OVERCLOCK POOLS (OC7) — MISSING LINK's CANDIDATE GENERATOR (a helper for the content author — never run by the build): link words that join
// three everyday words — a ONE-WORD compound in the American dictionary (SUN + FLOWER = sunflower) or a TWO-WORD phrase with its own Wiktionary
// entry that people really write (ICE + CREAM = ice cream) — for a person to READ and pick from. The build re-checks every join it ships
// (parts/85-missinglink.mjs + phrases.mjs).
//   node scripts/oc-pools/ml-gen.mjs <count_1w.txt> <count_2w.txt> --write <n>
// count_1w / count_2w = Peter Norvig's word + word-pair counts (MIT — norvig.com/ngrams): how everyday a word, a compound, a phrase is.
import { readFileSync, writeFileSync } from 'node:fs';
import { dictionaries } from './dict.mjs';
import { onRecord, hasDump } from './phrases.mjs';
import { bannedIn } from './lib.mjs';
import { ML_EXCLUDE } from './hand/ml-exclude.mjs';

// words that never make a clue or an answer (function words, bare verbs and particles: LOOK + UP is no MISSING LINK)
const STOP = new Set(('the of and to in a is for on with as by at from be this that it or are was an not but have has had were will can all one ' +
  'its their his her our your my out up down off over into onto back about after before than then there here what when who how which more most some ' +
  'any each very just also only even get got go goes went make made take took give gave put come came look see saw say said tell told let set ' +
  'way ways thing things time times year years day days new old good best well much many other another own same such like would could should ' +
  'may might must shall being been does did done doing yes no non pre pro sub per via etc inc com www org net').split(' '));

// a piece of a word is no clue (CONT + ACT, MESS + AGE, STAIN + LESS are not compounds): the affix-like pieces never count, and a 3-letter
// word counts only when it's a real, concrete one
const AFFIX = new Set(('less ness able ible ally ship hood ment ward wards wise dom ism ist ity ing ion ions ate est ent ant ary ery ive ous ure age ' +
  'ages ance ence ize ise ful fully ish like ly tion sion ure ers ies ted ting ings inter trans con dis pre pro sub sup uni app imp ins mis non over ' +
  'under out anti auto semi multi mega micro mini tele self cont rel res mes pas tor par per ven ver vers sion super ultra mono para meta poly comm ' +
  'comp demo porno gene aging oral rally ability teen lets sing king ping ware tops backs ends marks books works sets ships lands').split(' '));
// a "compound" that is really a word + an ending (thinking = think + -ing, generally = general + -ly, notebooks = notebook + -s) is no compound
const ENDINGS = ['ing', 'ings', 'ly', 'ally', 'ness', 'ion', 'ions', 'ity', 'ate', 'ed', 'er', 'ers', 'es', 's', 'al', 'ment', 'ive', 'ous', 'ance', 'ence',
  'ant', 'ent', 'ary', 'ory', 'ize', 'ise', 'ful', 'less', 'ism', 'ist', 'ic', 'ical'];
const derived = (w, isWord) => ENDINGS.some(e => w.endsWith(e) && w.length - e.length >= 3 && [w.slice(0, -e.length), `${w.slice(0, -e.length)}e`, w.slice(0, -e.length - 1)].some(b => b.length >= 3 && isWord(b)));
const THREE = new Set(('sun air ice sea bed car day eye egg fan box cup dog cat hat man key pot pan ear arm leg toe lip oil sky bat bus cow fox owl ' +
  'pig rat bee tea pie jam ham bag cap bow bar bin can gum jet lab mat mud net nut pen pin rag rib rod rug saw tag tin top toy tub van wax way wig ' +
  'zoo pea ray hay hen jaw kid log map mop row tap cob ink ivy jar kit lid paw sap tar tip tie yam dew den dot elf fig fin fur gem hut jug keg ' +
  'bell fly cry pop hop mud sand snow star moon wind fire rain boat ship home book foot hand head back side down town land sky ash elm oak bun ' +
  'cub dye fog gas gym hog hum jaw lap leg mug nap oar odd ore owl pad pit pod pub pup ram rib rim rye sky sod sow spy sub tab tot tow tug urn ' +
  'vat vet web wit yak yew zip art age end law war').split(' '));
const realPart = (w, R) => !AFFIX.has(w) && (w.length > 3 ? R(w) <= 12000 : THREE.has(w));

if (process.argv[1] && process.argv[1].endsWith('ml-gen.mjs')) {
  const [f1, f2] = process.argv.slice(2);
  const { isWord } = dictionaries();
  if (!hasDump()) console.error('(no Wiktionary dump — two-word phrases are judged by the verdict cache only)');
  const rank = new Map();
  readFileSync(f1, 'utf8').split('\n').forEach((l, i) => { const w = l.split('\t')[0]; if (w && !rank.has(w)) rank.set(w, i); });
  const R = w => (rank.has(w) ? rank.get(w) : 1e9);
  const okWord = (w, max) => /^[a-z]{3,9}$/.test(w) && R(w) <= max && isWord(w) && !STOP.has(w) && !bannedIn(w).length && !ML_EXCLUDE.has(w) && realPart(w, R);
  // joins: Map(answer → [{ clue, side, sep, score }]) and, for the ambiguity check, Map(word → Set(words it joins either way))
  const joins = new Map(), pairs = new Map();
  const link = (a, b, sep, score) => {          // a + b (a first)
    for (const [ans, clue, side] of [[b, a, 'after'], [a, b, 'before']]) {
      if (!joins.has(ans)) joins.set(ans, []);
      joins.get(ans).push({ clue, side, sep, score });
    }
    (pairs.get(a) || pairs.set(a, new Set()).get(a)).add(b);
    (pairs.get(b) || pairs.set(b, new Set()).get(b)).add(a);
  };
  // ONE WORD: every common dictionary word that splits into two common words
  let closed = 0;
  for (const [w, r] of rank) {
    if (r > 80000 || !/^[a-z]{6,16}$/.test(w) || !isWord(w) || /(ies|ings|ers|ed)$/.test(w) || derived(w, isWord)) continue;
    for (let i = 3; i <= w.length - 3; i++) {
      const a = w.slice(0, i), b = w.slice(i);
      if (okWord(a, 30000) && okWord(b, 30000)) { link(a, b, '', 12 - Math.log10(r + 10)); closed++; }
    }
  }
  // TWO WORDS: a frequent word pair with its own Wiktionary entry
  let open = 0;
  for (const line of readFileSync(f2, 'utf8').split('\n')) {
    const m = /^([a-z]+) ([a-z]+)\t(\d+)$/.exec(line);
    if (!m || Number(m[3]) < 250000) continue;
    const [, a, b, n] = m;
    if (!okWord(a, 30000) || !okWord(b, 30000) || isWord(a + b)) continue;
    if (!onRecord(`${a} ${b}`)) continue;
    link(a, b, ' ', Math.log10(Number(n)) - 1.5); open++;
  }
  console.error(`${closed} one-word joins · ${open} two-word joins`);
  // a puzzle: an answer + three clues (the best-known joins, three different clue words, no clue a form of another or of the answer) that no
  // OTHER word joins all three of
  const stem = w => w.replace(/(ies|es|s|ed|ing|er|ers)$/, '');
  const out = [];
  for (const [ans, list] of joins) {
    if (!okWord(ans, 20000)) continue;
    const by = new Map();
    for (const j of list) if (j.clue !== ans && stem(j.clue) !== stem(ans) && okWord(j.clue, 25000) && (!by.has(j.clue) || by.get(j.clue).score < j.score)) by.set(j.clue, j);
    const cands = [...by.values()].sort((a, b) => b.score - a.score).slice(0, 8);
    if (cands.length < 3) continue;
    let pick = null;
    for (let i = 0; i < cands.length && !pick; i++) for (let j = i + 1; j < cands.length && !pick; j++) for (let k = j + 1; k < cands.length && !pick; k++) {
      const three = [cands[i], cands[j], cands[k]];
      if (new Set(three.map(t => stem(t.clue))).size < 3) continue;
      const others = [...(pairs.get(three[0].clue) || [])].filter(x => x !== ans && (pairs.get(three[1].clue) || new Set()).has(x) && (pairs.get(three[2].clue) || new Set()).has(x));
      if (!others.length) pick = three;
    }
    if (!pick) continue;
    out.push({ ans, clues: pick, score: pick.reduce((s, t) => s + t.score, 0) / 3, n: cands.length });
  }
  out.sort((a, b) => b.score - a.score);
  for (const p of out) console.log(`${p.ans.toUpperCase()}\t${p.clues.map(c => `${c.clue.toUpperCase()}${c.side === 'after' ? '+' : '-'}${c.sep ? '_' : ''}`).join(' ')}\t${p.score.toFixed(2)}`);
  console.error(`${out.length} puzzles`);
  const wi = process.argv.indexOf('--write');
  if (wi > 0) {
    const n = Number(process.argv[wi + 1]) || 800;
    const legacy = new Set(JSON.parse(readFileSync(new URL('./hand/legacy-missinglink.json', import.meta.url), 'utf8')).puzzles.map(r => r[3]));
    const picked = out.filter(p => !legacy.has(p.ans.toUpperCase())).slice(0, n).sort((a, b) => a.ans.localeCompare(b.ans));
    writeFileSync(new URL('./hand/missinglink-picked.json', import.meta.url), `{"note":"OVERCLOCK MISSING LINK — new puzzles (OC7): [ANSWER, [CLUE, side (where the ANSWER goes), sep] × 3]. Made by ml-gen.mjs from everyday compounds + Wiktionary phrases, READ by hand (hand/ml-exclude.mjs = what was cut); the build re-checks every join + the one-answer rule (parts/85-missinglink.mjs).","puzzles":[\n${picked.map(p => JSON.stringify([p.ans.toUpperCase(), p.clues.map(c => [c.clue.toUpperCase(), c.side, c.sep])])).join(',\n')}\n]}\n`);
    console.error(`wrote ${picked.length} to hand/missinglink-picked.json`);
  }
}
