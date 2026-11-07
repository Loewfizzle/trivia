// OVERCLOCK POOLS — SORT IT (OC6): three kinds of set, every card on exactly one side beyond argument.
//   COMPUTED  number / word sets whose rule is code (sortcheck.mjs — the tests re-compute every card)               src 'computed'
//   DATA      sides from Wikidata facts (a continent, a year, a size) — a MARGIN around every cut-off: a card within it is never dealt
//   WRITTEN   hand/sortit-written.json — category sets, each with the article it was checked against
import { join } from 'node:path';
import { HERE, readJSON, seeded, shuffled, slug } from '../lib.mjs';
import { SORT_CHECKS, isPrime } from '../sortcheck.mjs';
import { showUS } from '../../../js/games/overclock/units.js';

// simple words a kid can read (the word sets — never a word list's whole dictionary)
const WORDS = ['apple', 'happy', 'river', 'tiger', 'pizza', 'cloud', 'bread', 'sunny', 'puppy', 'zebra', 'grass', 'lemon', 'ocean', 'robot', 'candy',
  'eagle', 'smile', 'chair', 'table', 'piano', 'horse', 'kitten', 'rabbit', 'garden', 'yellow', 'orange', 'purple', 'window', 'pencil', 'rocket',
  'bubble', 'button', 'cookie', 'dragon', 'jungle', 'monkey', 'spoon', 'beach', 'storm', 'light', 'music', 'dance', 'train', 'plane', 'truck',
  'house', 'mouse', 'moose', 'goose', 'sheep', 'queen', 'quiet', 'quick', 'zipper', 'jazz', 'fizz', 'buzz', 'fox', 'box', 'six', 'wax', 'lizard',
  'pizza', 'puzzle', 'frozen', 'dozen', 'squid', 'quilt', 'otter', 'igloo', 'umbrella', 'island', 'arrow', 'acorn', 'insect', 'octopus', 'echo',
  'elbow', 'unicorn', 'apron', 'orbit', 'bagel', 'carrot', 'muffin', 'pepper', 'kettle', 'ladder', 'mitten', 'balloon', 'coffee', 'cherry',
  'banana', 'tomato', 'planet', 'comet', 'magic', 'wagon', 'castle', 'pirate', 'sailor', 'guitar', 'violin', 'trumpet', 'drum', 'flute', 'harp',
  'shell', 'pebble', 'puddle', 'snowman', 'sled', 'skate', 'ski', 'kite', 'marble', 'crayon', 'eraser', 'ruler', 'glue', 'paper'];

function computed() {
  const sets = [];
  const r = seeded('oc6-sort-computed');
  const nums = (lo, hi, n) => shuffled(r, Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n);
  const mk = (left, right, cards, minEach = 9, maxEach = 18) => {
    const f = SORT_CHECKS[left];
    const L = [...new Set(cards.filter(c => f(c)).map(String))].slice(0, maxEach), R = [...new Set(cards.filter(c => !f(c)).map(String))].slice(0, maxEach);
    if (L.length >= minEach && R.length >= minEach) sets.push({ id: `c-${slug(left)}`, left, right, L, R, src: 'computed' });
  };
  // numbers: half the cards on each side, picked from a range a phone shows easily
  const balanced = (left, pool) => { const f = SORT_CHECKS[left]; const yes = shuffled(r, pool.filter(x => f(x))); const no = shuffled(r, pool.filter(x => !f(x))); return [...yes.slice(0, 16), ...no.slice(0, 16)]; };
  const range = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  mk('SQUARE NUMBER', 'NOT A SQUARE', balanced('SQUARE NUMBER', range(2, 400).filter(n => !(n % 1))));
  mk('CUBE NUMBER', 'NOT A CUBE', [1, 8, 27, 64, 125, 216, 343, 512, 729, 1000, ...nums(2, 999, 60).filter(n => ![1, 8, 27, 64, 125, 216, 343, 512, 729].includes(n))]);
  for (const k of [3, 4, 5, 6, 8, 9, 11, 12, 15, 25]) mk(`MULTIPLE OF ${k}`, `NOT A MULTIPLE OF ${k}`, balanced(`MULTIPLE OF ${k}`, range(10, k >= 11 ? 300 : 150)));
  for (const k of [60, 100, 72, 36, 48]) mk(`FACTOR OF ${k}`, `NOT A FACTOR OF ${k}`, balanced(`FACTOR OF ${k}`, range(1, k)));
  const sums = Array.from({ length: 80 }, () => `${2 + Math.floor(r() * 40)} + ${2 + Math.floor(r() * 40)}`);
  mk('EVEN ANSWER', 'ODD ANSWER', sums);
  const tens = [...Array.from({ length: 9 }, (_, i) => `${i + 1} + ${9 - i}`), ...Array.from({ length: 40 }, () => { const a = 1 + Math.floor(r() * 9); let b = 1 + Math.floor(r() * 9); if (a + b === 10) b = b === 9 ? 8 : b + 1; return `${a} + ${b}`; })];
  mk('ADDS UP TO 10', "DOESN'T ADD TO 10", tens);
  const prods = Array.from({ length: 80 }, () => `${3 + Math.floor(r() * 12)} × ${3 + Math.floor(r() * 12)}`).filter(x => { const [a, b] = x.split(' × ').map(Number); return Math.abs(a * b - 100) >= 8; });
  mk('MORE THAN 100', 'LESS THAN 100', prods);
  const diffs = Array.from({ length: 80 }, () => `${1 + Math.floor(r() * 20)} − ${1 + Math.floor(r() * 20)}`).filter(x => { const [a, b] = x.split(' − ').map(Number); return a !== b; });
  mk('BELOW ZERO', 'ABOVE ZERO', diffs);
  const fr = []; for (let b = 2; b <= 9; b++) for (let a = 1; a <= 14; a++) if (a !== b && a / b !== 1 && Math.abs(a / b - 1) >= 0.1) fr.push(`${a}/${b}`);
  mk('MORE THAN 1', 'LESS THAN 1', shuffled(r, fr));
  const dec = shuffled(r, ['0.6', '0.75', '0.51', '0.55', '0.9', '0.505', '0.7', '0.8', '0.65', '0.501', '0.99', '0.58', '0.45', '0.4', '0.05', '0.49', '0.25', '0.3', '0.499', '0.09', '0.1', '0.35', '0.405', '0.2', '0.15']);
  mk('MORE THAN 0.5', 'LESS THAN 0.5', dec);
  mk('LEAP YEAR', 'NOT A LEAP YEAR', [1900, 2000, 2100, 1600, 1800, ...nums(1880, 2096, 60)]);
  const roman = n => { const T = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, c] of T) while (n >= v) { s += c; n -= v; } return s; };
  mk('OVER 100', 'UNDER 100', nums(40, 220, 70).filter(n => n !== 100).map(roman));
  const words = [...new Set(WORDS)];
  mk('DOUBLE LETTER', 'NO DOUBLE LETTER', shuffled(r, words));
  mk('STARTS WITH A VOWEL', 'STARTS WITH A CONSONANT', shuffled(r, words));
  mk('NO REPEATED LETTER', 'REPEATS A LETTER', shuffled(r, words));
  mk('FIVE LETTERS', 'NOT FIVE LETTERS', shuffled(r, words));
  mk('HAS AN X, Z OR Q', 'NO X, Z OR Q', shuffled(r, words));
  return sets;
}

/** two sides from data: cards within the margin of the cut-off are left out (never a near call) */
function split(id, left, right, items, side, src) {
  const L = [], R = [], seen = new Set();
  for (const x of items) {
    const s = side(x);
    if (s == null || seen.has(x.label.toLowerCase())) continue;
    seen.add(x.label.toLowerCase());
    (s ? L : R).push(x.label);
  }
  return { id, left, right, L: L.slice(0, 22), R: R.slice(0, 22), src };
}

async function data(ctx) {
  const W = ctx.wd || {};
  const sets = [];
  const year = (sid, cut, margin) => x => (Math.abs(x.v - cut) < margin ? null : x.v < cut);
  const byFame = list => (list || []).slice().sort((a, b) => b.sl - a.sl);
  sets.push(split('d-film-1990', 'MOVIE BEFORE 1990', 'MOVIE SINCE 1990', byFame(W['film-year']), year('', 1990, 3), 'wikidata'));
  sets.push(split('d-game-2000', 'GAME BEFORE 2000', 'GAME SINCE 2000', byFame(W['game-year']), year('', 2000, 3), 'wikidata'));
  sets.push(split('d-book-1900', 'BOOK BEFORE 1900', 'BOOK SINCE 1900', byFame(W['novel-year']), year('', 1900, 5), 'wikidata'));
  sets.push(split('d-album-1980', 'ALBUM BEFORE 1980', 'ALBUM SINCE 1980', byFame(W['album-year']), year('', 1980, 3), 'wikidata'));
  sets.push(split('d-song-1980', 'SONG BEFORE 1980', 'SONG SINCE 1980', byFame(W['song-year']), year('', 1980, 3), 'wikidata'));
  sets.push(split('d-state-1850', 'STATE BEFORE 1850', 'STATE AFTER 1850', byFame(W.statehood), year('', 1850, 4), 'wikidata'));
  const born = W.born || [];
  sets.push(split('d-born-1800', 'BORN BEFORE 1800', 'BORN AFTER 1800', byFame(born), year('', 1800, 10), 'wikidata'));
  sets.push(split('d-animated-2000', 'CARTOON MOVIE PRE-2000', 'CARTOON MOVIE 2000+', byFame(W['animated-year']), year('', 2000, 3), 'wikidata'));
  // sizes, said in US units (the cut-off + a margin of 15–25% each side)
  const over = (cut, m) => x => (x.v > cut * (1 + m) ? true : x.v < cut / (1 + m) ? false : null);
  sets.push(split('d-mountain-20000ft', 'OVER 20,000 FT', 'UNDER 20,000 FT', byFame(W['mountain-height']), over(20000 / 3.2808399, 0.15), 'wikidata'));
  sets.push(split('d-tower-1000ft', 'OVER 1,000 FT', 'UNDER 1,000 FT', byFame([...(W['skyscraper-height'] || []), ...(W['tower-height'] || [])]), over(1000 / 3.2808399, 0.12), 'wikidata'));
  sets.push(split('d-country-100m', 'OVER 100 MILLION PEOPLE', 'UNDER 100 MILLION', byFame(W['country-pop']), over(1e8, 0.3), 'wikidata'));
  sets.push(split('d-country-texas', 'BIGGER THAN TEXAS', 'SMALLER THAN TEXAS', byFame(W['country-area']), over(695662, 0.25), 'wikidata'));
  sets.push(split('d-river-2000mi', 'OVER 2,000 MILES LONG', 'UNDER 2,000 MILES', byFame(W['river-length']), over(2000 / 0.621371, 0.2), 'wikidata'));
  sets.push(split('d-state-big', 'BIGGER THAN 100,000 SQ MI', 'SMALLER THAN 100,000 SQ MI', byFame(W['state-area']), over(258998.8, 0.15), 'wikidata'));
  // continents (one-continent UN members only — parts/30's query, cached)
  const conts = ctx.continents || [];   // (parts/30's answer — one question, one cache file)
  const by = new Map();
  for (const x of conts) { if (!by.has(x.item)) by.set(x.item, { label: x.label, cs: new Set(), sl: x.sl }); by.get(x.item).cs.add(x.c); }
  const NAME = { Q46: 'EUROPE', Q48: 'ASIA', Q15: 'AFRICA', Q49: 'NORTH AMERICA', Q18: 'SOUTH AMERICA', Q55643: 'OCEANIA', Q538: 'OCEANIA' };
  const one = [...by.values()].filter(x => x.cs.size === 1 && NAME[[...x.cs][0]]).map(x => ({ label: x.label, c: NAME[[...x.cs][0]], sl: x.sl })).sort((a, b) => b.sl - a.sl);
  for (const [a, b] of [['AFRICA', 'ASIA'], ['EUROPE', 'AFRICA'], ['NORTH AMERICA', 'SOUTH AMERICA'], ['ASIA', 'OCEANIA'], ['EUROPE', 'SOUTH AMERICA'], ['EUROPE', 'NORTH AMERICA'], ['ASIA', 'SOUTH AMERICA'], ['AFRICA', 'OCEANIA']]) {
    const pick = one.filter(x => x.c === a || x.c === b);
    sets.push(split(`d-in-${slug(a)}-${slug(b)}`, `IN ${a}`, `IN ${b}`, pick, x => x.c === a, 'wikidata'));
  }
  return sets;
}

export default async function sortit(ctx) {
  for (const s of computed()) ctx.so.push(s);
  for (const s of await data(ctx)) ctx.so.push(s);
  const W = readJSON(join(HERE, 'hand', 'sortit-written.json'));
  for (const s of W.sets) ctx.so.push({ id: `w-${slug(`${s.left} ${s.right}`, 50)}`, left: s.left, right: s.right, L: s.L, R: s.R, src: s.src });
  ctx.log.push(`SORT IT: computed + data + ${W.sets.length} written sets`);
  void isPrime; void showUS;
}
