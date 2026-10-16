// Trivia sources: Open Trivia DB (primary), The Trivia API (secondary).
// Everything is normalized to { q, a: [4 answers], c: correctIndex, cat, d, src }.
// fetchFn is injectable so tests can run without the network.
import { categoryFromOtdbName, categoryFromTapi } from './categories.js';
import { shuffle } from '../core/rng.js';

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', shy: '',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', ndash: '–', mdash: '—',
  eacute: 'é', Eacute: 'É', egrave: 'è', ecirc: 'ê', euml: 'ë', aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', aring: 'å', Aring: 'Å',
  iacute: 'í', icirc: 'î', iuml: 'ï', oacute: 'ó', ograve: 'ò', ocirc: 'ô', ouml: 'ö', Ouml: 'Ö', oslash: 'ø', Oslash: 'Ø',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü', Uuml: 'Ü', ntilde: 'ñ', ccedil: 'ç', szlig: 'ß', aelig: 'æ',
  deg: '°', micro: 'µ', pi: 'π', Pi: 'Π', sup2: '²', sup3: '³', frac12: '½', frac14: '¼', times: '×', divide: '÷',
  trade: '™', reg: '®', copy: '©', euro: '€', pound: '£', yen: '¥', laquo: '«', raquo: '»', prime: '′', Prime: '″',
};

export function decodeEntities(str) {
  return String(str ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+\d?);/gi, (m, name) => (name in NAMED ? NAMED[name] : m))
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalize({ q, correct, wrong, cat, d, src }, rand = Math.random) {
  const answers = shuffle(rand, [correct, ...wrong]);
  return { q, a: answers, c: answers.indexOf(correct), cat, d, src };
}

// Questions that read badly on a phone or as multiple choice are skipped.
export function acceptable(item) {
  if (!item || !item.q || item.q.length > 190 || item.q.length < 12) return false;
  if (!Array.isArray(item.wrong) || item.wrong.length !== 3) return false;
  const all = [item.correct, ...item.wrong].map(s => String(s).trim().toLowerCase());
  if (new Set(all).size !== 4 || all.some(s => !s || s.length > 70)) return false;
  if (/\b(which of these|all of the above|none of the above)\b/i.test(item.q) && /above/i.test(all.join(' '))) return false;
  return true;
}

// Party trivia, not a pub-quiz final: drop questions that are pure memorisation or hyper-specific.
// (Open Trivia DB's harder sports questions are mostly seasons, scores and draft picks.)
const YEAR = /\b(1[5-9]\d\d|20\d\d)\b/;
const NUMERIC = /^[\s\d.,:%-]+(?:m|km|kg|cm|mph|km\/h|%|points?|years?)?\s*$/i;
export function tooSpecific(item) {
  const answers = [item.correct, ...(item.wrong || [])].map(a => String(a).trim());
  // every option a year / big number ("In what year…", "How many… 2,857")
  if (answers.every(a => NUMERIC.test(a) && /\d{3,}/.test(a.replace(/[.,\s]/g, '')))) return true;
  // "Who won the 2016…", "…in the 1999 final" — dated results, any category
  if (YEAR.test(item.q) && /\b(won|win|winner|winning|champion|championship|cup|final|scored|award|medal|trophy|season)\b/i.test(item.q)) return true;
  if (item.cat === 'sports') {
    if (/\b(scored|top ?scorer|seasons?|drafted|draft pick|jersey|squad number|affiliate|final score|career (?:goals|points|wins)|holds the record|record of)\b/i.test(item.q)) return true;
    if (/\d{3,}/.test(item.q.replace(/,/g, ''))) return true; // stats in the question itself
  }
  return false;
}

export async function requestOtdbToken(fetchFn = fetch) {
  const r = await fetchFn('https://opentdb.com/api_token.php?command=request');
  const j = await r.json();
  if (j.response_code !== 0 || !j.token) throw new Error('otdb token');
  return j.token;
}

// Returns { code, items }. code mirrors OTDB's response_code (0 ok, 1 no results,
// 3/4 token invalid/exhausted, 5 rate limited).
export async function fetchOtdb({ amount = 20, difficulty, category, token, fetchFn = fetch, rand = Math.random }) {
  const p = new URLSearchParams({ amount: String(amount), type: 'multiple' });
  if (difficulty) p.set('difficulty', difficulty);
  if (category) p.set('category', String(category));
  if (token) p.set('token', token);
  const r = await fetchFn(`https://opentdb.com/api.php?${p}`);
  if (r.status === 429) return { code: 5, items: [] };
  const j = await r.json();
  const items = (j.results || [])
    .map(x => ({
      q: decodeEntities(x.question),
      correct: decodeEntities(x.correct_answer),
      wrong: (x.incorrect_answers || []).map(decodeEntities),
      cat: categoryFromOtdbName(x.category),
      d: x.difficulty,
      src: 'otdb',
    }))
    // its sports pool is club nicknames and stat trivia even at medium: sports come from The Trivia API / the bank
    .filter(x => x.d === 'medium' && x.cat !== 'sports' && acceptable(x) && !tooSpecific(x))
    .map(x => normalize(x, rand));
  return { code: j.response_code, items };
}

export async function fetchTriviaApi({ limit = 20, categories = [], fetchFn = fetch, rand = Math.random }) {
  const p = new URLSearchParams({ limit: String(limit), difficulties: 'medium', types: 'text_choice' });
  if (categories.length) p.set('categories', categories.join(','));
  const r = await fetchFn(`https://the-trivia-api.com/v2/questions?${p}`);
  if (!r.ok) throw new Error(`trivia api ${r.status}`);
  const j = await r.json();
  return (Array.isArray(j) ? j : [])
    .map(x => ({
      q: decodeEntities(x.question && x.question.text),
      correct: decodeEntities(x.correctAnswer),
      wrong: (x.incorrectAnswers || []).map(decodeEntities),
      cat: categoryFromTapi(x.category),
      d: x.difficulty,
      src: 'tapi',
    }))
    .filter(x => x.d === 'medium' && acceptable(x) && !tooSpecific(x))
    .map(x => normalize(x, rand));
}
