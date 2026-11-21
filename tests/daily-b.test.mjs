// DAILY B (Nov 18 — docs/games/plan.md "DAILY A / B" + "DAILY B"): THE TICKETS (DAILY BEST · the place · the gold NEW DAILY BEST · JAYWALK's
// tries), THE SWEEP meter, SHARE TODAY's JAYWALK section + its text line, a daily try's CARDS + YOUR BEST (the server's pure step), PRACTICE
// never on the day's seed, and nothing of the daily in JAYWALK's preload graph. PURE — no browser (the screens: e2e-jaywalk-daily-run.mjs).
import '../api/_lib/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ticketState, bestLine, placeLine, sweepState, shareTodayLine, tryEndedLine, NEW_BEST, COUNTS_FROM_TOMORROW } from '../js/daily/today-logic.js';
import { creditTry, JW_BEST_BOARD } from '../api/_lib/jaywalk-credit.js';
import { shareOf, openTry, closeTry } from '../api/_lib/jaywalk-tries.js';
import { jwInputs, barsOf, statOf, shareLine, BARS_W } from '../js/games/jaywalk/daily-share.js';
import { seedOf } from '../js/games/jaywalk/logic.js';
import { PRELOAD } from '../js/games/preload-graph.js';
import { TICKET_ART, TICKET_INK, TICKET_PATHS } from '../js/daily/ticket-art.js';
import { DAILIES } from '../js/config.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const DAY = 'd20261118', OLD = 'd20261110';
const lanes = (l, k = 4000) => l * 1e5 + (99999 - k);
const lineOf = (id, s) => ({ password: `${s} GUESSES`, coastclear: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, jaywalk: `${Math.floor(s / 1e5)} LANES` }[id] || String(s));
const PW = { id: 'password', name: 'THE PASSWORD', hook: 'Two doors. Six guesses each.' };
const JW = { id: 'jaywalk', name: 'JAYWALK', hook: 'Three tries.', tries: 3 };
const tr = (i, l) => ({ i, l, k: 4000, w: 'car' });

test('DAILY B — BEFORE: the hook, or "DAILY BEST · <value>" in the daily\'s own measure once there is a best from an EARLIER day', () => {
  assert.deepEqual(ticketState({ day: DAY }, PW, { lineOf }), { st: 'waiting', line: { text: 'Two doors. Six guesses each.' }, act: 'PLAY' });
  const t = { day: DAY, best: { password: { best: { s: 4, day: OLD }, newBest: false, first: false } } };
  assert.deepEqual(ticketState(t, PW, { lineOf }).line, { text: 'DAILY BEST · 4 GUESSES', best: true });
  assert.equal(ticketState({ ...t, started: { password: true } }, PW, { lineOf }).act, 'RESUME');
  // each daily's measure: fewest guesses · fastest clear · THE DROP's TIME alone (its score packs the lines in) · most lanes
  assert.equal(bestLine('password', 4, lineOf), '4 GUESSES');
  assert.equal(bestLine('coastclear', 72, lineOf), '1:12');
  assert.equal(bestLine('drop', 2210017, lineOf), '3:41');
  assert.equal(bestLine('jaywalk', lanes(168), lineOf), '168 LANES');
});

test('DAILY B — DONE: the result + the place ("2ND OF 5 PLAYERS"); a NEW DAILY BEST (beat an EARLIER day) = the gold line in its place; the FIRST best never gold', () => {
  const base = { day: DAY, mine: { password: 5 }, place: { password: { p: 2, n: 5 } } };
  const d = ticketState(base, PW, { lineOf });
  assert.equal(d.st, 'done'); assert.equal(d.result, '5 GUESSES'); assert.deepEqual(d.line, { text: '2ND OF 5 PLAYERS' }); assert.equal(d.act, null);
  assert.deepEqual(ticketState({ ...base, best: { password: { best: { s: 5, day: DAY }, newBest: true, first: false } } }, PW, { lineOf }).line, { text: NEW_BEST, gold: true });
  assert.deepEqual(ticketState({ ...base, best: { password: { best: { s: 5, day: DAY }, newBest: false, first: true } } }, PW, { lineOf }).line, { text: '2ND OF 5 PLAYERS' }, 'firstBest = the place, never gold');
  assert.equal(placeLine(1, 1), '1ST OF 1 PLAYER');
  // COUNTS FROM TOMORROW wins over the gold + the place
  assert.equal(ticketState({ ...base, gated: { password: true }, best: { password: { best: { s: 5, day: DAY }, newBest: true } } }, PW, { lineOf }).line.text, COUNTS_FROM_TOMORROW);
});

test('DAILY B — JAYWALK\'s ticket: before · BETWEEN TRIES (the last try big, DAILY BEST, TRY AGAIN + n TRIES LEFT) · ADMITTED only with no try left or DONE', () => {
  const before = ticketState({ day: DAY }, JW, { lineOf });
  assert.equal(before.st, 'waiting'); assert.equal(before.act, 'PLAY');
  const one = { day: DAY, mine: { jaywalk: lanes(143) }, tries: { jaywalk: { used: 1, left: 2, tries: [tr(0, 143)] } }, best: { jaywalk: { best: { s: lanes(168), day: OLD } } } };
  const b1 = ticketState(one, JW, { lineOf });
  assert.deepEqual({ st: b1.st, result: b1.result, line: b1.line.text, act: b1.act, under: b1.under }, { st: 'between', result: 'LAST TRY · 143 LANES', line: 'DAILY BEST · 168 LANES', act: 'TRY AGAIN', under: '2 TRIES LEFT' });
  // (no earlier best: today's best)
  assert.equal(ticketState({ ...one, best: {} }, JW, { lineOf }).line.text, 'DAILY BEST · 143 LANES');
  // two tries: the LAST one big (not the best), 1 TRY LEFT
  const two = { ...one, mine: { jaywalk: lanes(143) }, tries: { jaywalk: { used: 2, left: 1, tries: [tr(0, 143), tr(1, 98)] } } };
  const b2 = ticketState(two, JW, { lineOf });
  assert.equal(b2.result, 'LAST TRY · 98 LANES'); assert.equal(b2.under, '1 TRY LEFT'); assert.equal(b2.st, 'between');
  // ADMITTED never shows while tries remain — only DONE (this phone — a generic `tries` row) or none left
  assert.equal(ticketState(two, JW, { lineOf, done: true }).st, 'done');
  // (J3 — THREE TRIES ALL DAY: JAYWALK's row says `allDay` — a DONE kept on this phone is ignored: still between, TRY AGAIN)
  assert.equal(ticketState(two, { ...JW, allDay: true }, { lineOf, done: true }).st, 'between');
  const three = { ...two, place: { jaywalk: { p: 3, n: 7 } }, tries: { jaywalk: { used: 3, left: 0, tries: [tr(0, 143), tr(1, 98), tr(2, 120)] } } };
  const a = ticketState(three, JW, { lineOf });
  assert.deepEqual({ st: a.st, result: a.result, line: a.line.text, act: a.act }, { st: 'done', result: '143 LANES', line: '3RD OF 7 PLAYERS', act: null }, 'ADMITTED: the BEST try is the result');
  // a 3rd try still OPEN (being scored) is not ADMITTED yet
  assert.equal(ticketState({ ...three, tries: { jaywalk: { used: 3, left: 0, tries: [tr(0, 143), tr(1, 98), { i: 2, open: 1 }] } } }, JW, { lineOf }).st, 'between');
  // gold on the ADMITTED ticket: a NEW DAILY BEST from today
  assert.deepEqual(ticketState({ ...three, best: { jaywalk: { best: { s: lanes(143), day: DAY }, newBest: true } } }, JW, { lineOf }).line, { text: NEW_BEST, gold: true });
  // THE ROOM WINS' banner
  assert.equal(tryEndedLine(2), 'TRY ENDED · 2 TRIES LEFT'); assert.equal(tryEndedLine(1), 'TRY ENDED · 1 TRY LEFT'); assert.equal(tryEndedLine(0), 'TRY ENDED');
});

test('DAILY B — THE SWEEP meter: one segment per LIVE daily (3 until JAYWALK goes live, then 4), lit as each is done', () => {
  const ds = ['password', 'coastclear', 'drop'].map(id => ({ id }));
  assert.equal(sweepState({ dailies: ds, mine: { password: 4 } }).segs.length, 3);
  const four = sweepState({ dailies: [...ds, { id: 'jaywalk' }], mine: { password: 4, jaywalk: lanes(12) } });
  assert.deepEqual(four.segs.map(s => s.done), [true, false, false, true]);
  assert.equal(four.of, 4); assert.equal(four.swept, false);
  // the screen draws each segment in its daily's ink + no "n OF m" words (the meter IS the count)
  const D = read('js/screens/daily.js');
  assert.match(D, /h\(`span\.dy-seg\$\{s\.done \? '\.is-done' : ''\}`, \{ style: \{ '--i': i, \.\.\.inkVars\(s\.id\) \}/);
  assert.doesNotMatch(D, /`\$\{sw\.done\} OF \$\{sw\.of\}`\), ' · THE SWEEP'/);
});

test('DAILY B — JAYWALK\'s ticket art + ink: its mark (core/marks.js — CITY H2: THE SNEAKER, its tubes scaled into the 24 box), the owner\'s orange both looks; the share card draws the same paths', () => {
  assert.deepEqual(TICKET_INK.jaywalk, { night: '#ffa53a', day: '#e0661c' });
  assert.equal((TICKET_PATHS.jaywalk.match(/<path /g) || []).length, 3, 'the mark\'s three tubes');
  assert.ok(TICKET_PATHS.jaywalk.includes('<path d="M4.82 8.69'), 'MARKS.jaywalk × 0.24');
  const row = DAILIES.find(d => d.id === 'jaywalk');
  assert.equal(row.on, false, 'JAYWALK\'s row still ships OFF'); assert.equal(row.tries, 3); assert.equal(row.ticket, 'jaywalk');
  assert.ok(!row.ownMusic, 'its music = JAYWALK\'s own (the look\'s mood station — index.js#musicFor) through the console: no ownMusic (its view plays no songs of its own)');
});

test('DAILY B — SHARE TODAY: the JAYWALK section\'s inputs (spoiler-free), its bars, its stat, the text line', () => {
  // the server's inputs from the record: each CLOSED try's lanes, the best, never the course
  let rec = null;
  for (const [i, l] of [[0, 143], [1, 168]]) { const o = openTry(rec, { uid: 'u', now: 1000 * (i + 1), startedAt: 1000 }); rec = closeTry(o.record, o.i, { l, k: 4000, s: lanes(l), w: 'car' }, { now: 2000 * (i + 1) }); }
  const S = shareOf(rec, { day: DAY, nb: true });
  assert.deepEqual(S, { t: [143, 168, null], b: 1, nb: 1, day: DAY });
  assert.deepEqual(Object.keys(S).sort(), ['b', 'day', 'nb', 't'], 'only these keys — no seed, no course, no hop (J3: + `hs` once a 50 was reached — tests/jaywalk-j3.test.mjs)');
  const I = jwInputs(S);
  assert.equal(statOf(I), 'BEST OF 3 · NEW DAILY BEST'); assert.equal(statOf({ ...I, nb: false }), 'BEST OF 3');
  const bars = barsOf(S);
  assert.deepEqual(bars.map(b => b.kind), ['try', 'best', 'empty'], 'the best bar amber, the other dim, an unplayed try an empty outline');
  assert.equal(bars[1].len, BARS_W); assert.ok(Math.abs(bars[0].len - BARS_W * 143 / 168) < 1e-6, 'a bar = its lanes against the best');
  assert.equal(shareLine(S), 'JAYWALK · BEST OF 3 · 168 LANES · neonspeakeasy.com');
  // SHARE TODAY's plain line names a tries daily the same way
  const t = { dailies: [{ id: 'password', name: 'THE PASSWORD' }, { id: 'jaywalk', name: 'JAYWALK', tries: 3 }], mine: { password: 4, jaywalk: lanes(143) } };
  assert.match(shareTodayLine(t, lineOf), /JAYWALK · BEST OF 3 · 143 LANES/);
  // registered in SECTIONS (lazy) — share-today.js lays 1–6 sections out evenly
  assert.match(read('js/daily/share-today.js'), /jaywalk: \{ load: \(\) => lazyImport\(import\('\.\.\/games\/jaywalk\/daily-share\.js'\)/);
});

test('DAILY B — a daily try\'s CARDS + YOUR BEST: the try\'s REPLAYED feats → the match\'s own flags, its lanes → the jaywalk-solo record (a counted result only)', () => {
  const s0 = { xp: 100, b: {}, pa: {} };
  const r = creditTry(s0, { lanes: 212, feats: 'boom mothership', now: Date.UTC(2026, 10, 18, 15) });
  assert.equal(r.next.b[JW_BEST_BOARD].a, 212, 'YOUR BEST raised');
  assert.equal(r.pbs.length, 1);
  assert.ok(r.next.pa.gf['jaywalk-boom'] && r.next.pa.gf['jaywalk-mothership'], 'the feats are the cards\' flags (THE MOTHERSHIP counts: the daily is capped)');
  assert.ok(r.ach.includes('sonic-boom') && r.ach.includes('beam-me-up'), `the cards' achievements awarded: ${r.ach.join(' ')}`);
  assert.ok(r.items.includes('card-sonicboom') && r.items.includes('card-beammeup'));
  // a worse try changes nothing; a feat already held changes nothing
  assert.equal(creditTry(r.next, { lanes: 100, feats: 'boom', now: Date.UTC(2026, 10, 18, 16) }), null);
  // a better one raises it again; junk feats are ignored
  assert.equal(creditTry(r.next, { lanes: 230, feats: 'hacked', now: Date.UTC(2026, 10, 18, 16) }).next.b[JW_BEST_BOARD].a, 230);
  // the server wires it on EVERY close (FINISH · START · THE ROOM WINS · today · THE DAY'S CLOSE), counted only, from the record's try
  const A = read('api/daily.js');
  assert.match(A, /if \(\(Number\(resetAt\) > 0 && Number\(startedAt\) < Number\(resetAt\)\) \|\| !countsOn\(createdAt, day\)\) return null;/);
  assert.equal((A.match(/creditQuiet\(\{ pid, cart, day, now, closed/g) || []).length, 3, 'finishTry (FINISH + THE ROOM WINS) · START\'s prior · settleRun (today + THE DAY\'S CLOSE)');
  assert.match(read('api/_lib/jaywalk-tries.js'), /const f = featsOf\(r\);/, 'the try\'s feats come from the SERVER\'s replay');
});

test('DAILY B — PRACTICE never uses the day\'s seed; the daily lives OUTSIDE JAYWALK\'s preload graph (its budget untouched)', () => {
  // a solo / match course = seedOf(code, matchId, go) — 'g…' — never the day's 'd…' (api/_lib/jaywalk-daily.js#jwDay)
  for (let i = 0; i < 200; i++) assert.match(seedOf(`CODE${i}`, `m${i}`, 1.7e12 + i * 977), /^g/);
  assert.match(read('api/_lib/jaywalk-daily.js'), /seed: `d\$\{seed\}`/);
  // the view takes a daily seed ONLY through the daily adapter (state.jwDaily → D.start → adopt(…, r.seed)); a solo run's seed stays seedOf's
  const V = read('js/games/jaywalk/view.js');
  assert.match(V, /D\.start\(\)\.then\(r => \{ if \(!gone && r\) adopt\(r\.go, null, true, r\.seed, r\.cv === 2 \? 2 : 1\); \}/);
  assert.match(V, /run = createRun\(\{ seed, mode: ds \? 'daily' : 'solo' \}\)/);
  assert.match(V, /D = state\.jwDaily \|\| null; isMatch = !D &&/);
  // nothing of the daily in the preload graph (the room's cartridge never imports it)
  for (const f of ['js/games/jaywalk/daily-run.js', 'js/games/jaywalk/daily-share.js', 'js/daily/today-logic.js', 'js/daily/ticket-art.js']) assert.ok(!PRELOAD.jaywalk.includes(f), `${f} stays out of JAYWALK's preload graph`);
  assert.doesNotMatch(read('js/games/jaywalk/index.js'), /daily-run|daily-share/);
  assert.match(read('js/screens/daily.js'), /const DAILY_RUNS = \{ jaywalk: \(\) => lazyImport\(import\('\.\.\/games\/jaywalk\/daily-run\.js'\)/);
});

test('DAILY B — THE RUN\'s rules on the phone: no pause, no RESUME; (J3) NO STOP; hidden / leaving / a refresh END the try; the end shows the SERVER\'s lanes', () => {
  const R = read('js/games/jaywalk/daily-run.js');
  assert.doesNotMatch(R.replace(/\/\/[^\n]*/g, ''), /TAP AGAIN TO STOP|dy-jw-stop|addStop/, 'J3 — THREE TRIES ALL DAY: no STOP button (a try ends by a hit or THE MOTHERSHIP)');
  assert.match(R, /if \(document\.visibilityState === 'hidden'\) endTry\('away'\)/);
  assert.match(R, /addEventListener\('pagehide', onHide\)/);
  assert.match(R, /api\('daily', \{ action: 'finish', game: GAME_ID, \.\.\.\(day \? \{ day \} : \{\}\) \}, \{ keepalive: true \}\)/);
  assert.match(R, /const lanes = mine \? Math\.floor\(Number\(mine\.l\) \|\| 0\) : jwLanes\(r\.score\);/, 'the end card = the server\'s answer (its try / its score)');
  assert.doesNotMatch(R.replace(/\/\/[^\n]*/g, ''), /RESUME|holdRun|ppause/, 'never a resume, a hold or a pause (the code — its comments say so)');
  const D = read('js/screens/daily.js');
  assert.match(D, /if \(r\.tries\) banner\(tryEndedLine\(r\.left\(\)\)\);\n\s+else \{ holdRun\(r\.id, r\.day\(\)\); banner\(\); \}/, 'THE ROOM WINS on a tries daily: TRY ENDED · n TRIES LEFT, never held');
});
