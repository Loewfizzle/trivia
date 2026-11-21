// JAYWALK J3 (Nov 21 — docs/games/plan.md "JAYWALK J3"; docs/jaywalk.md "J3"): THREE TRIES ALL DAY (no STOP, COME BACK LATER, the ticket from
// the SERVER's tries all day) · THE TIME BOARDS (the day's split board — best of 3 per split, the tabs only for 50s reached, ties share a place,
// a refused try never on it, never the points) · the share card's best-time line · THE RED SNEAKER. PURE — no browser (the screens:
// e2e-jaywalk-daily-run.mjs + the preview's &jwt=1).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ticketState, dayTurned } from '../js/daily/today-logic.js';
import { openTry, closeTry, triesView, leftOf, shareOf, scoreTry, TRIES } from '../api/_lib/jaywalk-tries.js';
import { raiseDay, dayFromTries, cleanMap, timeTabs, timeRows, timeView, timeClock, tabLabel, shareBest, bestTimeLine } from '../js/core/jw-times.js';
import * as TEXT from '../js/core/jw-time-text.js';
import { TICK_HZ, SPLIT_EVERY } from '../js/games/jaywalk/tuning.js';
import { jwInputs, timeOf } from '../js/games/jaywalk/daily-share.js';
import { MARKS } from '../js/core/marks.js';
import { DAILIES } from '../js/config.js';
import { PRELOAD } from '../js/games/preload-graph.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
const DAY = 'd20261121';
const lanes = (l, k = 4000) => l * 1e5 + (99999 - k);
const lineOf = (id, s) => `${Math.floor(s / 1e5)} LANES`;
const JW = { ...DAILIES.find(d => d.id === 'jaywalk'), hook: 'Three tries.' };
const H = 3600e3;

// ------------------------------------------------------------------------------------------------ GROUP 1 — THREE TRIES ALL DAY
test('J3 — THREE TRIES ALL DAY: a try, leave, come back HOURS later → TRY AGAIN offered (from the server\'s tries); the 3rd try → ADMITTED', () => {
  assert.equal(JW.allDay, true, 'JAYWALK\'s DAILIES row says allDay'); assert.equal(JW.tries, 3);
  // the server's record (the pure half — a fake clock): try 1 at 9 am, closed; nothing for 7 hours; the next START still opens try 2
  const t0 = Date.UTC(2026, 10, 21, 14);
  let o = openTry(null, { uid: 'u', now: t0, startedAt: t0 }), rec = closeTry(o.record, o.i, { l: 88, k: 3000, s: lanes(88, 3000), w: 'car' }, { now: t0 + 60e3 });
  const afterHours = t0 + 7 * H;
  const today1 = { day: DAY, mine: { jaywalk: lanes(88, 3000) }, tries: { jaywalk: { used: 1, left: leftOf(rec), tries: triesView(rec) } } };
  // (a DONE remembered on this phone from before J3 changes nothing — allDay)
  const t1 = ticketState(today1, JW, { lineOf, done: true });
  assert.deepEqual({ st: t1.st, act: t1.act, under: t1.under }, { st: 'between', act: 'TRY AGAIN', under: '2 TRIES LEFT' }, 'between tries, hours later, on any phone');
  o = openTry(rec, { uid: 'u', now: afterHours });
  assert.equal(o.i, 1, 'the next START hours later = try 2'); assert.ok(!o.refused);
  rec = closeTry(o.record, 1, { l: 120, k: 5000, s: lanes(120, 5000), w: 'water' }, { now: afterHours + 90e3 });
  o = openTry(rec, { uid: 'u', now: afterHours + 2 * H });
  rec = closeTry(o.record, 2, { l: 40, k: 2000, s: lanes(40, 2000), w: 'train' }, { now: afterHours + 2 * H + 30e3 });
  assert.equal(leftOf(rec), 0);
  assert.deepEqual(openTry(rec, { uid: 'u', now: afterHours + 3 * H }), { refused: 'no_tries' }, 'a 4th is refused');
  const t3 = ticketState({ day: DAY, mine: { jaywalk: lanes(120, 5000) }, place: { jaywalk: { p: 2, n: 9 } }, tries: { jaywalk: { used: 3, left: 0, tries: triesView(rec) } } }, JW, { lineOf });
  assert.deepEqual({ st: t3.st, result: t3.result, act: t3.act }, { st: 'done', result: '120 LANES', act: null }, 'ADMITTED after the 3rd try — the BEST try is the result');
  // 4 am: the answer from yesterday is stale → re-read (a new day = a fresh record: three new tries)
  assert.equal(dayTurned({ day: DAY }, 'd20261122'), true);
  assert.equal(openTry(null, { uid: 'u', now: t0 + 24 * H }).i, 0);
  assert.equal(TRIES, 3);
});

test('J3 — the phone: NO STOP (no button, no confirm, no CSS), COME BACK LATER never marks the day done, TRY AGAIN · n TRIES LEFT stays', () => {
  const R = code('js/games/jaywalk/daily-run.js');
  assert.doesNotMatch(R, /STOP'|dy-jw-stop|addStop|confirm:/, 'no STOP anywhere in the run');
  assert.doesNotMatch(R, /markTriesDone/, 'COME BACK LATER marks nothing');
  assert.match(R, /tubeButton\('COME BACK LATER', \{ kind: 'secondary'[^}]*\}[^;]*onClick: \(\) => \{ if \(ctx\.onBack\) ctx\.onBack\(false\); \}/);
  assert.match(R, /foot\.replaceChildren\(again, h\('div\.dy-jw-left', `\$\{left\} \$\{left === 1 \? 'TRY' : 'TRIES'\} LEFT`\), later\)/);
  assert.match(R, /tubeButton\('BACK TO THE DAILIES'/, 'after the 3rd try: ADMITTED + BACK TO THE DAILIES (as before)');
  assert.doesNotMatch(read('css/daily.css'), /dy-jw-stop/);
  // hiding / leaving / a refresh still END the try (no peeking at the course)
  assert.match(R, /if \(document\.visibilityState === 'hidden'\) endTry\('away'\)/);
  assert.match(R, /addEventListener\('pagehide', onHide\)/);
  // the ticket: allDay ignores the old per-phone DONE (kept for a generic `tries` row)
  assert.match(code('js/screens/daily.js'), /allDay: !!\(d\.allDay \|\| row\.allDay\)/);
  assert.match(code('js/daily/today-logic.js'), /\(left === 0 \|\| \(done && !d\.allDay\)\)/);
});

// ------------------------------------------------------------------------------------------------ GROUP 2 — THE TIME BOARDS
test('J3 — THE DAY\'s SPLIT BOARD: each player\'s best per split from ANY of the 3 tries (the server\'s splits); a refused try never on it', () => {
  // try 1 reaches 100, try 2 is faster to 50 only, try 3 reaches 150 slower → [best 50, best 100, 150]
  let cur = raiseDay(null, [2000, 4600]);
  assert.deepEqual(cur, [2000, 4600]);
  cur = raiseDay(cur, [1800]) || cur;
  assert.deepEqual(cur, [1800, 4600], 'a faster 50 from another try');
  cur = raiseDay(cur, [2100, 4700, 7200]) || cur;
  assert.deepEqual(cur, [1800, 4600, 7200], 'a farther split from a slower try still counts');
  assert.equal(raiseDay(cur, [1900, 4700]), undefined, 'nothing faster → nothing written');
  assert.equal(raiseDay(null, []), undefined, 'no split reached → nothing');
  // THE BUILD from the record (a day older than the board): closed, proven tries only
  assert.deepEqual(dayFromTries([{ i: 0, e: 1, sp: [2000, 4600] }, { i: 1, e: 2, bad: 'ahead', sp: [10, 20] }, { i: 2, open: 1, sp: [5] }, { i: 2, e: 3, sp: [1800] }]), [1800, 4600]);
  // a refused log has NO splits at all (scoreTry's `bad`) — it can't reach the board
  const bad = scoreTry({ seed: 'd123', go: 1000, node: { c: { 0: { s: 'zz', at: 'forged' } } } });
  assert.ok(bad.bad && !bad.sp);
  assert.deepEqual(cleanMap({ a: [100, 200], b: 'x', c: [300, 200], d: null }), { a: [100, 200], c: [300] });
});

test('J3 — THE TABS: one per 50 anyone in the scope reached (none for a split nobody reached); EQUAL TIMES SHARE A PLACE; the cut + your place', () => {
  const map = { a: [1800, 4000], b: [1700], c: [1800, 4100, 7000], d: [1900], me: [2500, 4500] };
  assert.deepEqual(timeTabs(map), [0, 1, 2], '50 · 100 · 150 — not 200');
  assert.deepEqual(timeTabs({ x: [1900] }), [0]);
  assert.deepEqual(timeTabs({}), []);
  assert.deepEqual(timeRows(map, 0).map(r => [r.k, r.rank]), [['b', 1], ['a', 2], ['c', 2], ['d', 4], ['me', 5]], 'a + c tie at 1800 = both 2ND, the next is 4TH');
  const V = timeView(map, { pid: 'me', friends: new Set(['c']), limit: 3 });
  assert.deepEqual(V.tabs, [50, 100, 150]);
  assert.deepEqual(V.b[50].list.map(r => r.k), ['b', 'a', 'c']); assert.equal(V.b[50].list[2].f, 1, 'a friend marked');
  assert.deepEqual(V.b[50].mine, { k: 'me', t: 2500, rank: 5, me: 1 }, 'YOU below the cut, with your real place');
  assert.equal(V.b[100].mine, null, 'YOU inside the cut (3rd of 3 at 100)'); assert.equal(V.b[100].list[2].me, 1);
  assert.equal(V.b[150].more, 1); assert.equal(V.b[150].mine, null, 'YOU never reached 150: no row there');
  // a hidden profile (the boards' opt-out) leaves the list WITHOUT re-ranking around it
  const Hd = timeView(map, { pid: 'me', hidden: new Set(['b']), limit: 10 });
  assert.deepEqual(Hd.b[50].list.map(r => [r.k, r.rank]), [['a', 2], ['c', 2], ['d', 4], ['me', 5]]);
  // a gated YOU (THE THROWAWAY GATE): shown, NOT COUNTED, no place — the others ranked without you
  const G = timeView(map, { pid: 'me', unranked: true, limit: 10 });
  assert.deepEqual(G.b[50].mine, { k: 'me', t: 2500, me: 1, gated: 1 }); assert.ok(!G.b[50].list.some(r => r.k === 'me'));
});

test('J3 — the words: m:ss.t (tenths floored), FASTEST TO 50 then TO 100 …; the phone\'s tiny module agrees with JAYWALK\'s tuning', () => {
  assert.equal(timeClock(4464), '1:14.4'); assert.equal(timeClock(59), '0:00.9'); assert.equal(timeClock(60), '0:01.0'); assert.equal(timeClock(3599), '0:59.9');
  assert.equal(tabLabel(50, true), 'FASTEST TO 50'); assert.equal(tabLabel(100), 'TO 100');
  assert.equal(TEXT.TICK_HZ, TICK_HZ); assert.equal(TEXT.SPLIT_EVERY, SPLIT_EVERY);
  // the daily screen + the share card import ONLY the tiny text module (never tuning.js through jw-times.js)
  assert.match(read('js/screens/daily.js'), /from '\.\.\/core\/jw-time-text\.js'/); assert.doesNotMatch(read('js/screens/daily.js'), /jw-times\.js/);
  assert.match(read('js/games/jaywalk/daily-share.js'), /from '\.\.\/\.\.\/core\/jw-time-text\.js'/);
  assert.doesNotMatch(read('js/core/jw-time-text.js'), /^import /m);
});

test('J3 — THE SHARE CARD\'s line: the HIGHEST 50 reached today + its best time ("TO 100 · 1:14"); none when no 50 was reached; spoiler-free', () => {
  let rec = null;
  for (const [i, l, sp] of [[0, 143, [1900, 4500]], [1, 168, [1700, 4440, 7400]], [2, 30, null]]) { const o = openTry(rec, { uid: 'u', now: 1000 * (i + 1), startedAt: 1000 }); rec = closeTry(o.record, o.i, { l, k: 4000, s: lanes(l), w: 'car', ...(sp ? { sp } : {}) }, { now: 2000 * (i + 1) }); }
  const S = shareOf(rec, { day: DAY });
  assert.deepEqual(S.hs, { at: 150, t: 7400 }); assert.deepEqual(Object.keys(S).sort(), ['b', 'day', 'hs', 'nb', 't'], 'no seed, no course, no hop');
  assert.equal(bestTimeLine(S.hs), 'TO 150 · 2:03');
  assert.equal(timeOf(jwInputs(S)), 'TO 150 · 2:03');
  assert.deepEqual(shareBest([{ i: 0, e: 1, sp: [1900, 4400] }, { i: 1, e: 2, sp: [1800, 4600] }]), { at: 100, t: 4400 }, 'the best time to the highest 50, from any try');
  assert.equal(shareOf(openTry(null, { uid: 'u', now: 1, startedAt: 1 }).record, { day: DAY }).hs, undefined, 'no 50 reached → no line');
  assert.equal(timeOf(jwInputs({ t: [12, null, null], b: 0 })), '');
  assert.equal(jwInputs({ t: [1], hs: { at: 75, t: 10 } }).hs, null, 'a split must be a whole 50');
  assert.match(read('js/games/jaywalk/daily-share.js'), /if \(tl\) paintStat\(c, look, tl, cx, R\.artY \+ 14/);
});

test('J3 — the time boards are a VIEW: the lanes result, the points, ALL TIME + DAILY BEST never read them; every close raises the board', () => {
  for (const f of ['js/core/daily-points.js', 'js/core/daily-best.js', 'js/core/progress.js', 'js/core/every.js', 'api/_lib/jaywalk-credit.js', 'api/_lib/lb.js']) assert.doesNotMatch(read(f), /jw-times|\/sp\/|jaywalk-times/, `${f} never reads the time boards`);
  const A = read('api/daily.js');
  assert.match(A, /o && o\.cart && o\.cart\.splits \? daySplits\(o\)/, 'creditQuiet (every close: FINISH · START · THE ROOM WINS · today · THE DAY\'S CLOSE) raises the board');
  assert.equal((A.match(/creditQuiet\(\{ pid, cart, day, now, closed/g) || []).length, 3);
  assert.match(A, /const times = cart\.splits && played \? await timesFor\(/, 'EVERYONE\'s time boards only once YOU have played');
  assert.match(A, /games\.filter\(g => mineScores\[g\] != null && dailyOf\(g\) && dailyOf\(g\)\.splits\)/, 'YOUR TABLE\'s too');
  assert.match(A, /!nc\.has\(k\) && !gated\.has\(k\)/, 'DON\'T COUNT + THE THROWAWAY GATE out of EVERYONE\'s time boards');
  assert.match(read('api/_lib/jaywalk-daily.js'), /splits: true,/);
  const T = read('api/_lib/jaywalk-times.js');
  assert.match(T, /if \(!pid \|\| !closed \|\| closed\.bad \|\| !closed\.sp\) return null;/, 'a refused / unproven try writes nothing');
  // nothing of the time boards in JAYWALK's room preload graph (its budget untouched)
  for (const f of ['js/core/jw-times.js', 'js/core/jw-time-text.js', 'js/screens/daily.js']) assert.ok(!PRELOAD.jaywalk.includes(f), `${f} stays out of JAYWALK's preload graph`);
});

// ------------------------------------------------------------------------------------------------ GROUP 3 — THE RED SNEAKER
test('J3 — THE RED SNEAKER: the mark\'s upper is a NEON RED (not pink, not orange); the sole / laces white + the cyan speed lines unchanged', () => {
  const [upper, sole, speed] = MARKS.jaywalk.tubes;
  const [r, g, b] = [1, 3, 5].map(i => parseInt(upper.col.slice(i, i + 2), 16));
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let hue = mx === r ? ((g - b) / d) * 60 : mx === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  if (hue < 0) hue += 360;
  assert.ok(hue >= 345 || hue <= 8, `a red hue (${hue.toFixed(1)}° — pink is ~322°, orange ~25°+)`);
  assert.ok(d / mx > 0.7 && mx > 240, `saturated + bright enough to glow (${upper.col})`);
  assert.equal(upper.col, '#ff3344');
  assert.equal(sole.col, '#fff4fa'); assert.equal(speed.col, '#35e3ff');
});
