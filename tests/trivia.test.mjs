// Trivia layer: entity decoding, normalization, source parsing (mocked fetch),
// obfuscation, and the fallback bank.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { decodeEntities, normalize, acceptable, tooSpecific, fetchOtdb, fetchTriviaApi } from '../js/trivia/sources.js';
import { setFallbackRows, pickFallback, qHash } from '../js/trivia/bank.js';
import { appendPatch, decodeQuestion, fallbackPatch, roomUsedPatch } from '../js/trivia/bankdata.js';
import { encodeJSON, decodeJSON } from '../js/core/obfuscate.js';
import { selectedCategories } from '../js/trivia/categories.js';
import { rngFrom } from '../js/core/rng.js';

const rows = JSON.parse(readFileSync('data/trivia/fallback.json', 'utf8')).questions;
setFallbackRows(rows);

test('HTML entities from Open Trivia DB decode cleanly', () => {
  assert.equal(decodeEntities('Who wrote &quot;Hamlet&quot;?'), 'Who wrote "Hamlet"?');
  assert.equal(decodeEntities('Beyonc&eacute; &amp; Jay-Z&#039;s &ldquo;tour&rdquo;'), 'Beyoncé & Jay-Z\'s “tour”');
  assert.equal(decodeEntities('&#x00E9;t&eacute;  \n spaced'), 'été spaced');
  assert.equal(decodeEntities('Unknown &bogus; stays'), 'Unknown &bogus; stays');
});

test('normalize shuffles answers and tracks the correct index', () => {
  for (let s = 0; s < 20; s++) {
    const n = normalize({ q: 'Q?', correct: 'right', wrong: ['w1', 'w2', 'w3'], cat: 'general', d: 'hard' }, rngFrom(`n${s}`));
    assert.equal(n.a.length, 4);
    assert.equal(n.a[n.c], 'right');
  }
});

test('acceptable() filters awkward questions', () => {
  const ok = { q: 'What is the capital of Peru?', correct: 'Lima', wrong: ['Quito', 'Bogotá', 'La Paz'] };
  assert.ok(acceptable(ok));
  assert.ok(!acceptable({ ...ok, wrong: ['Quito', 'Lima', 'La Paz'] }), 'duplicate answers');
  assert.ok(!acceptable({ ...ok, wrong: ['Quito'] }), 'not 4 options');
  assert.ok(!acceptable({ ...ok, q: 'x'.repeat(250) }), 'too long for a phone');
});

const mockFetch = body => async () => ({ status: 200, ok: true, json: async () => body });

test('Open Trivia DB results are decoded, normalized, and only medium questions kept', async () => {
  const res = await fetchOtdb({
    fetchFn: mockFetch({
      response_code: 0,
      results: [
        { category: 'Science &amp; Nature', type: 'multiple', difficulty: 'medium', question: 'What is &quot;H2O&quot;?', correct_answer: 'Water', incorrect_answers: ['Salt', 'Air', 'Fire'] },
        { category: 'Entertainment: Film', type: 'multiple', difficulty: 'easy', question: 'Too easy question?', correct_answer: 'A', incorrect_answers: ['B', 'C', 'D'] },
        { category: 'Sports', type: 'multiple', difficulty: 'hard', question: 'Too hard question?', correct_answer: 'A', incorrect_answers: ['B', 'C', 'D'] },
      ],
    }),
  });
  assert.equal(res.code, 0);
  assert.equal(res.items.length, 1);
  assert.equal(res.items[0].q, 'What is "H2O"?');
  assert.equal(res.items[0].cat, 'science');
  assert.equal(res.items[0].a[res.items[0].c], 'Water');
  const limited = await fetchOtdb({ fetchFn: async () => ({ status: 429, json: async () => ({}) }) });
  assert.equal(limited.code, 5);
});

test('The Trivia API results are normalized', async () => {
  const items = await fetchTriviaApi({
    fetchFn: mockFetch([
      { category: 'history', difficulty: 'medium', question: { text: 'Who was the first Roman emperor?' }, correctAnswer: 'Augustus', incorrectAnswers: ['Nero', 'Caligula', 'Tiberius'] },
    ]),
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].cat, 'history');
  assert.equal(items[0].a[items[0].c], 'Augustus');
});

test('obfuscation round-trips unicode and hides the answer text', () => {
  const item = { q: 'Which city is “Brasília”?', a: ['Brasília', 'São Paulo', 'Rio', 'Huế'], c: 0 };
  const enc = encodeJSON(item, 'ROOM:m:q0');
  assert.ok(!enc.includes('Bras'));
  assert.deepEqual(decodeJSON(enc, 'ROOM:m:q0'), item);
  assert.equal(decodeJSON(enc, 'ROOM:m:q1'), null, 'wrong key does not decode');
});

test('appendPatch skips repeats and decodeQuestion reads them back', () => {
  const game = { matchId: 'm', trivia: { n: 0, seen: {} } };
  const items = [
    { q: 'One?', a: ['a', 'b', 'c', 'd'], c: 1 },
    { q: 'one', a: ['a', 'b', 'c', 'd'], c: 2 }, // same text after normalization → skipped
    { q: 'Two?', a: ['a', 'b', 'c', 'd'], c: 3 },
  ];
  const { patch, n } = appendPatch(game, 'ROOM', items);
  assert.equal(n, 2);
  const g = { matchId: 'm', bank: { 0: patch['bank/0'], 1: patch['bank/1'] } };
  assert.equal(decodeQuestion(g, 'ROOM', 1).q, 'Two?');
});

test('fallback bank: ≥300 medium/hard questions, unique, picks respect categories and avoid repeats', () => {
  assert.ok(rows.length >= 300, `${rows.length}`);
  assert.equal(new Set(rows.map(r => qHash(r[2]))).size, rows.length);
  assert.ok(rows.every(r => r.length === 7 && ['medium', 'hard'].includes(r[1])));
  const cats = new Set(rows.map(r => r[0]));
  for (const c of selectedCategories([])) assert.ok(cats.has(c.id), `fallback has ${c.id}`);
  const picks = pickFallback(10, { cats: ['history'], rand: rngFrom('p') });
  assert.equal(picks.length, 10);
  assert.ok(picks.every(p => p.cat === 'history' && p.a[p.c]));
  const seen = Object.fromEntries(picks.map(p => [qHash(p.q), true]));
  const more = pickFallback(10, { cats: ['history'], seen, rand: rngFrom('p') });
  assert.ok(more.every(p => !seen[qHash(p.q)]), 'no repeats');
});

// Reported: Overclock's trivia repeated a lot across rematches. Questions used by earlier matches in
// the room (meta/used/trivia) are skipped by every way a question can enter the bank.
test('room memory: appendPatch skips questions earlier matches in the room already used', () => {
  const items = [{ q: 'Alpha?', c: 0, a: ['a', 'b', 'c', 'd'] }, { q: 'Bravo?', c: 0, a: ['a', 'b', 'c', 'd'] }];
  const roomSeen = { [qHash('Alpha?')]: true };
  const { patch, n } = appendPatch({ matchId: 'm', trivia: { n: 0, seen: {} } }, 'ROOM', items, roomSeen);
  assert.equal(n, 1);
  assert.ok(patch[`trivia/seen/${qHash('Bravo?')}`] && !patch[`trivia/seen/${qHash('Alpha?')}`]);
  assert.deepEqual(roomUsedPatch(patch), { [`meta/used/trivia/${qHash('Bravo?')}`]: true });
});

test('room memory: fallbackPatch prefers unseen questions, records them for the room, never stalls', () => {
  setFallbackRows(rows);
  const all = Object.fromEntries(rows.map(r => [qHash(r[2]), true]));
  const fresh = fallbackPatch({ matchId: 'm', trivia: { n: 0, seen: {}, cats: [] } }, 'ROOM', 5, {});
  const added = Object.keys(fresh).filter(k => k.startsWith('trivia/seen/'));
  assert.equal(added.length, 5);
  assert.equal(Object.keys(fresh.$room).length, 5, 'the room remembers what was dealt');
  // a night so long that every bundled question was used: repeats beat a frozen game
  const late = fallbackPatch({ matchId: 'm2', trivia: { n: 0, seen: {}, cats: [] } }, 'ROOM', 3, all);
  assert.equal(late['trivia/n'], 3);
});

test('room memory: a night of back-to-back matches never repeats a question while unseen ones remain', async () => {
  setFallbackRows(rows);
  const realFetch = globalThis.fetch;
  globalThis.fetch = () => Promise.reject(new Error('offline')); // APIs down: everything comes from the bundled bank
  try {
    globalThis.location ??= { search: '', hostname: 'test', protocol: 'https:', href: 'https://test/', pathname: '/' };
    const { initialBank } = await import('../js/trivia/feed.js');
    const roomSeen = {};
    const dealt = [];
    for (let m = 0; m < 20; m++) {
      const { trivia, $room } = await initialBank({ code: 'ROOM', matchId: `m${m}`, cats: [], now: 0, min: 12, roomSeen });
      assert.equal(trivia.n, 12);
      dealt.push(...Object.keys(trivia.seen));
      for (const k of Object.keys($room)) roomSeen[k.split('/').pop()] = true; // what host.js writes to meta/used/trivia
    }
    assert.equal(new Set(dealt).size, dealt.length, `${dealt.length - new Set(dealt).size} repeats across 20 matches`);
  } finally {
    globalThis.fetch = realFetch;
  }
});

// Reported: questions felt ridiculously specific, sports especially. These are real Open Trivia DB
// questions (hard/medium sports) that must never reach a party game, next to fair ones that must.
test('tooSpecific(): drops pub-quiz-final questions, keeps party trivia', () => {
  const q = (cat, text, correct, wrong) => ({ cat, q: text, correct, wrong });
  const out = [
    q('sports', 'Who scored the injury time winning goal in the 1999 UEFA Champions League final between Manchester United and Bayern Munich?', 'Ole Gunnar Solskjaer', ['Teddy Sheringham', 'Dwight Yorke', 'Andy Cole']),
    q('sports', 'The AHL affiliate team of the Boston Bruins is named what?', 'Providence Bruins', ['Hershey Bears', 'Rochester Americans', 'Hartford Wolf Pack']),
    q('sports', 'Which player holds the NHL record of 2,857 points?', 'Wayne Gretzky', ['Mario Lemieux', 'Jaromir Jagr', 'Gordie Howe']),
    q('sports', 'In the 2014 FIFA World Cup, what was the final score in the match Brazil - Germany?', '1-7', ['0-3', '2-5', '1-4']),
    q('sports', 'In 2016, who won the Formula 1 World Constructor\'s Championship for the third time in a row?', 'Mercedes-AMG Petronas', ['Red Bull', 'Ferrari', 'McLaren']),
    q('screen', 'Who won the 2018 Academy Award for Best Supporting Actor for playing Dr. Donald Shirley?', 'Mahershala Ali', ['Sam Elliott', 'Adam Driver', 'Richard E. Grant']),
    q('history', 'In which year did the Battle of Hastings take place?', '1066', ['1086', '1166', '1016']),
  ];
  const keep = [
    q('sports', 'With which sport is Rafael Nadal associated?', 'Tennis', ['Golf', 'Squash', 'Cricket']),
    q('sports', 'In what sport is a "shuttlecock" used?', 'Badminton', ['Tennis', 'Squash', 'Table tennis']),
    q('sports', 'Which Grand Slam tennis tournament is played on grass?', 'Wimbledon', ['US Open', 'French Open', 'Australian Open']),
    q('science', 'What is the chemical symbol for gold?', 'Au', ['Ag', 'Go', 'Gd']),
    q('geography', 'How many continents are there?', '7', ['5', '6', '8']),
    q('screen', 'Which actor played Vito Corleone in The Godfather?', 'Marlon Brando', ['Al Pacino', 'Robert De Niro', 'James Caan']),
  ];
  for (const it of out) assert.ok(tooSpecific(it), `should drop: ${it.q}`);
  for (const it of keep) assert.ok(!tooSpecific(it), `should keep: ${it.q}`);
});

test('the APIs are asked for medium only, and specific questions are filtered out of it', async () => {
  let url = '';
  await fetchTriviaApi({ fetchFn: async u => { url = u; return { ok: true, json: async () => [] }; } });
  assert.match(url, /difficulties=medium(&|$)/);
  const res = await fetchOtdb({
    fetchFn: async () => ({ status: 200, json: async () => ({ response_code: 0, results: [
      { category: 'Sports', type: 'multiple', difficulty: 'medium', question: 'Edson Arantes do Nascimento is the full name of which footballer?', correct_answer: 'Pele', incorrect_answers: ['Ronaldo', 'Zico', 'Garrincha'] },
      { category: 'Sports', type: 'multiple', difficulty: 'medium', question: 'Which soccer team won the Copa America Centenario 2016?', correct_answer: 'Chile', incorrect_answers: ['Argentina', 'Mexico', 'USA'] },
      { category: 'Sports', type: 'multiple', difficulty: 'easy', question: 'In what sport is a shuttlecock used?', correct_answer: 'Badminton', incorrect_answers: ['Tennis', 'Squash', 'Golf'] },
      { category: 'Science: Computers', type: 'multiple', difficulty: 'hard', question: 'What does the acronym SCSI stand for?', correct_answer: 'Small Computer System Interface', incorrect_answers: ['A', 'B', 'C'] },
    ] }) }),
  });
  assert.deepEqual(res.items.map(i => i.a[i.c]), [], 'Open Trivia DB sports never pass (club-nickname / stat trivia even at medium)');
});
