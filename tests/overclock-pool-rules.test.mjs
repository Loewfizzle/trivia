// THE POOL FIXES (Nov 13 — docs/games/passes/pool-fixes.md, docs/overclock.md "THE POOL RULES"): the owner's 8 builder rules, checked on
// EVERY shipped + reserved item (data/oc/ + api/_data/oc-reserve/) — and the fact-check review's own finds, one by one, so a rebuild can
// never bring one back. The build runs the same checks (scripts/oc-pools/build.mjs + pool-rules.mjs); this proves the files agree.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { unsafeIn, mlBreaks, irregularPlurals, sharedTitleNoYear, measureMissing, compareMeasureMissing, falseCompound, notAmerican } from '../scripts/oc-pools/pool-rules.mjs';
import { FACT_FIX, NP_YEAR, REAL_WORDS, ML_ACCEPT_ADD, SORT_CARD_DROP, REVIEW_DROP } from '../scripts/oc-pools/hand/pool-fixes.mjs';
import { KIDSAFE } from '../scripts/oc-pools/kidsafe.mjs';
import { joined } from '../scripts/oc-pools/phrases.mjs';

const J = p => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const both = (f, key) => [...J(`data/oc/${f}`)[key], ...J(`api/_data/oc-reserve/${f}`)[key]];
const TV = both('trivia.json', 'items'), TF = both('truefalse.json', 'items'), CC = both('closest.json', 'questions');
const ML = both('missinglink.json', 'puzzles'), SP = both('spellcheck.json', 'words'), SO = both('sortit.json', 'sets');
const HL = both('higherlower.json', 'stats'), TL = both('timeline.json', 'themes');
const BUILD = readFileSync(new URL('../scripts/oc-pools/build.mjs', import.meta.url), 'utf8');
const itemsOf = (groups, id) => groups.filter(g => g.id === id || g.id === `wd-${id}`).flatMap(g => g.items);

test('RULE 4 — THE KID-SAFE FILTER: no text in any bank (questions, answers, statements, labels, cards, clues, JOINS, spellings) carries a term', () => {
  const texts = [
    ...TV.flatMap(r => [r.q, r.a, ...r.w]), ...TF.flatMap(r => [r.t, r.f]), ...CC.map(r => r.q),
    ...ML.flatMap(p => [p.answer, ...p.clues.map(c => c[0]), ...p.clues.map(([w, side, sep]) => joined(w, p.answer, side, sep))]),
    ...SP.flatMap(r => [r.right, ...r.wrong]), ...SO.flatMap(s => [s.left, s.right, ...s.L, ...s.R]),
    ...HL.flatMap(s => s.items.map(i => i[0])), ...TL.flatMap(t => t.items.map(i => i[0])),
  ];
  assert.ok(texts.length > 30000);
  assert.deepEqual(texts.filter(t => unsafeIn(t).length), []);
  // the review's finds are ON the list (so they can't come back) — and gone
  for (const t of ['Protocols of the Elders of Zion', 'Fifty Shades of Grey', 'Lolita', 'Courbet', 'El retorno del hijo gey', 'Squaw Valley', 'HOOKUP', 'BAREBACK', 'slutty'])
    assert.ok(unsafeIn(t).length, `${t} is caught`);
  assert.ok(!unsafeIn('The parrot gave a squawk.').length, 'whole words only (squawk is not squaw)');
  assert.ok(KIDSAFE.length >= 20);
  assert.match(BUILD, /unsafeIn\(s\)/, 'the build runs it on every text');
});

test('RULE 1 + 2 — every MISSING LINK join is a real compound of its halves + American (no TAPERED, LEGEND, RESTORE, COASTGUARD, COTTON WOOL)', () => {
  const bad = ML.map(p => [p.id, mlBreaks(p)]).filter(([, w]) => w.length);
  assert.deepEqual(bad, []);
  for (const [j, k] of [['tapered', 4], ['legend', 3], ['restore', 4], ['restart', 4], ['reinvest', 4]]) assert.ok(falseCompound(j, k), j);
  for (const [j, k] of [['firefighter', 4], ['proofreader', 5], ['tiebreaker', 3], ['sunflower', 3]]) assert.equal(falseCompound(j, k), null, j);
  for (const [j, sep] of [['coastguard', ''], ['cotton wool', ' '], ['power point', ' '], ['plughole', ''], ['puppy fat', ' '], ['newsreader', ''], ['minicab', '']]) assert.ok(notAmerican(j, sep), j);
  assert.equal(notAmerican('lifeguard', ''), null);
  const by = Object.fromEntries(ML.map(p => [p.id, p]));
  // the review's rewrites ship as written: COAST GUARD · PEN NAME · RED TAPE · BOOKEND · DRIFTWOOD · CHEESECLOTH · ARMREST · CLOCK RADIO · DILL PICKLE …
  const joins = id => by[id].clues.map(([w, side, sep]) => joined(w, by[id].answer, side, sep));
  assert.ok(joins('m-guard').includes('COAST GUARD') && joins('m-name').includes('PEN NAME') && joins('m-tape').includes('RED TAPE'));
  assert.ok(joins('m-end').includes('BOOKEND') && joins('m-rest').includes('ARMREST') && !joins('m-rest').includes('RESTORE'));
  assert.ok(joins('m-radio').includes('CLOCK RADIO') && joins('m-pickle').includes('DILL PICKLE') && joins('m-root').includes('SQUARE ROOT'));
  for (const id of ['m-castle', 'm-wool', 'm-stairs', 'm-cab', 'm-rein']) assert.ok(!by[id], `${id} dropped`);
});

test('RULE 3 — an answer\'s IRREGULAR plural is accepted; the review\'s second answers too (MEN · FLIES · KNIVES · SOFT · WRITING · WARD · BALL · HIGH)', () => {
  for (const p of ML) for (const pl of irregularPlurals(p.answer)) assert.ok(p.accept.includes(pl), `${p.id}: ${pl}`);
  const by = Object.fromEntries(ML.map(p => [p.id, p]));
  for (const [id, w] of [['m-man', 'MEN'], ['m-fly', 'FLIES'], ['m-knife', 'KNIVES'], ['m-hard', 'SOFT'], ['m-writer', 'WRITING'], ['m-town', 'WARD'], ['m-brow', 'BALL'], ['m-low', 'HIGH']])
    assert.ok(by[id].accept.includes(w), `${id} accepts ${w}`);
  for (const [id, add] of Object.entries(ML_ACCEPT_ADD)) for (const w of add) assert.ok(by[id].accept.includes(w), `${id}: ${w}`);
  assert.deepEqual(irregularPlurals('HUMAN'), [], 'never a made-up plural (HUMEN)');
  for (const p of ML) assert.ok(!p.accept.includes(p.answer) && p.accept.every(x => /^[A-Z]+$/.test(x)), p.id);
});

test('RULE 5 — "came out" / "opened" = the RELEASE: every fixed fact ships with its fixed value in every pool that holds it', () => {
  let seen = 0;
  for (const [stat, fixes] of Object.entries(FACT_FIX)) {
    for (const [q, [v]] of Object.entries(fixes)) {
      for (const it of [...itemsOf(HL, stat), ...itemsOf(TL, stat)].filter(i => i[3] === q)) {
        seen++;
        const want = stat.endsWith('-pop') ? Number(v.toPrecision(3)) : v;
        assert.ok(Math.abs(it[1] - want) / want < 0.002, `${stat} ${it[0]}: ${it[1]} (want ${want})`);
      }
    }
  }
  assert.ok(seen >= 20, `${seen} fixed items found`);
  const find = (label, id) => [...itemsOf(HL, id), ...itemsOf(TL, id)].find(i => i[0] === label);
  assert.equal(find('Tesla Cybertruck', 'car-year')[1], 2023);
  assert.equal(find('TurboGrafx-16', 'console-year')[1], 1989);
  assert.equal(find('Millau Viaduct', 'bridge-year')[1], 2004);
  const louis = CC.find(r => r.id === 'c-city-pop-Q43668');
  assert.equal(louis.value, 633045, 'CLOSEST CALL reads the same fixed Louisville');
  assert.equal(CC.find(r => r.id === 'c-lake-depth-Q35342').value, 281);
  assert.equal(CC.find(r => r.id === 'c-runtime-Q103372692').value, 102);
});

test('RULE 6 — a NATIONAL PARK\'s year is its national-park designation (NP_YEAR only): Badlands 1978, Capitol Reef 1971, Acadia 1919; no Chiricahua', () => {
  const parks = [...itemsOf(HL, 'park-year'), ...itemsOf(TL, 'park-year')];
  assert.ok(parks.length >= 40);
  for (const [label, v, , q] of parks) assert.equal(v, NP_YEAR[q], `${label}`);
  const y = l => (parks.find(p => p[0] === l) || [])[1];
  assert.equal(y('Badlands National Park'), 1978); assert.equal(y('Capitol Reef National Park'), 1971); assert.equal(y('Acadia National Park'), 1919);
  assert.ok(!parks.some(p => /Chiricahua/.test(p[0])));
});

test('RULE 7 — a SHARED TITLE carries its year; a decade question about one is out (Lilo & Stitch, The Avengers, Hercules, Inferno …)', () => {
  assert.deepEqual([...TV.map(r => r.q), ...TF.flatMap(r => [r.t, r.f])].filter(t => sharedTitleNoYear(t)), []);
  for (const re of [/decade did the movie Lilo & Stitch/, /decade did the movie The Avengers/, /book Inferno first/, /^Hercules came out/, /^The Jungle Book came out/])
    assert.ok(!TV.some(r => re.test(r.q)) && !TF.some(r => re.test(r.t)), String(re));
  assert.ok(sharedTitleNoYear('Aladdin was directed by Guy Ritchie.'));
  assert.equal(sharedTitleNoYear('The 2019 film Aladdin was directed by Guy Ritchie.'), null);
  assert.equal(sharedTitleNoYear('Who wrote Charlotte\'s Web?'), null, 'a book question is about the book');
  for (const t of TF.filter(r => /(Sherlock Holmes|Aladdin|Alice in Wonderland) was directed by|directed (Sherlock Holmes|Aladdin|Alice in Wonderland)/.test(r.t))) assert.match(t.t, /\b(19|20)\d\d\b/);
});

test('RULE 8 — an AREA / HEIGHT names its measure: CLOSEST CALL (total area incl. water · surface area · to the architectural top / tip) + TRIVIA\'s comparisons', () => {
  assert.deepEqual(CC.filter(r => measureMissing(r.q, r.unit, r.id.split('-')[1])).map(r => r.q), []);
  assert.deepEqual(TV.filter(r => compareMeasureMissing(r.q)).map(r => r.q), []);
  const q = id => (CC.find(r => r.id === id) || {}).q || '';
  assert.match(q('c-state-area-Q782'), /total area of the state of Hawaii, including water/);
  assert.match(q('c-tall-Q29294'), /Willis Tower to its architectural top/);
  assert.match(q('c-tall-Q243'), /Eiffel Tower to its tip/);
  assert.match(q('c-span-Q44057'), /London's Millennium Bridge/);
  assert.match(q('c-country-area-Q27'), /Republic of Ireland/);
  assert.ok(TV.some(r => r.q === 'Which of these mountains is the highest above sea level?'));
  assert.ok(!TV.some(r => r.q === 'Which of these lakes is the largest?'));
});

test('THE REVIEW, item by item: the drops are gone, the fixes ship (presidents, Soccer ≠ Football, SORT IT\'s cards, SPELLCHECK\'s real words)', () => {
  const ids = new Set([...TV, ...TF, ...CC, ...ML].map(r => r.id));
  for (const id of Object.keys(REVIEW_DROP)) assert.ok(!ids.has(id), id);
  // the president: nobody in office that year is a wrong answer
  for (const [id, no] of [['t-president-Q11613', 'Franklin D. Roosevelt'], ['t-president-Q8612', 'Abraham Lincoln'], ['t-president-Q34597', 'Chester A. Arthur'], ['t-president-Q11881', 'William Henry Harrison']]) {
    const r = TV.find(x => x.id === id);
    if (r) assert.ok(!r.w.includes(no), `${id}: ${no} offered`);
  }
  for (const r of TV.filter(x => x.id.startsWith('t-athlete-'))) assert.ok(!(r.a === 'Soccer' && r.w.includes('Football')) && !(r.a === 'Football' && r.w.includes('Soccer')), r.id);
  const cards = s => [...s.L, ...s.R];
  for (const s of SO) {
    for (const c of SORT_CARD_DROP['*']) assert.ok(!cards(s).includes(c), `${s.id}: ${c}`);
    for (const c of SORT_CARD_DROP[s.id] || []) assert.ok(!cards(s).includes(c), `${s.id}: ${c}`);
    assert.ok(!cards(s).includes('Palomino'), `${s.id}: Palomino (a coat colour)`);
  }
  for (const r of SP) assert.ok(!r.wrong.some(w => REAL_WORDS.has(w)), r.id);
  assert.ok(!SP.some(r => r.right === 'slutty'));
  // the written rewrites (a few): the fox's wrong answers, the octopus, the checkers board, the hail
  const tv = q => TV.find(r => r.q === q);
  assert.deepEqual(tv('What is a baby fox called?').w, ['A calf', 'A foal', 'A joey']);
  assert.ok(!tv('Which sea animal has eight arms with suckers?').w.includes('The squid'));
  assert.ok(tv('How many squares are on an American checkers board?'));
  assert.ok(tv('What are the balls of ice that fall from thunderstorms called?'));
  assert.ok(!TV.some(r => r.w.includes('Squaw Valley')));
});

test('THE BUILD runs every rule (a regression can\'t ship): the checks are in build.mjs, the fixes at their sources', () => {
  for (const re of [/mlBreaks\(/, /irregularPlurals\(r\.answer\)/, /otherAnswers\(r\.clues/, /sharedTitleNoYear\(r\.q\)/, /sharedTitleNoYear\(r\.t\)/, /measureMissing\(r\.q/,
    /compareMeasureMissing\(r\.q\)/, /REAL_WORDS\.has/, /REVIEW_DROP\[r\.id\]/, /SORT_CARD_DROP/]) assert.match(BUILD, re);
  const hl = readFileSync(new URL('../scripts/oc-pools/parts/20-wd-hl.mjs', import.meta.url), 'utf8');
  assert.match(hl, /FACT_FIX\[id\]/); assert.match(hl, /NP_YEAR\[x\.q\]/);
});
