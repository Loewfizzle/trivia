// THE POOL FIXES (Nov 13 — docs/games/passes/pool-fixes.md): THE PASSWORD's answers after the fact-check review —
//   the four verified cuts are out AND in the build's own list (a rebuild keeps them out), THE KID-SAFE FILTER runs on the answers too,
//   THE PICK can't be predicted from the list's (alphabetical) order, and a list edit moves no answer already played, nor TODAY's or
//   TOMORROW's (pw-day.js#KEEP_AHEAD).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { POOL_FIXES_CUTS, KEEP_S } from '../scripts/pw-words/blocklist.mjs';
import { unsafeIn } from '../scripts/oc-pools/kidsafe.mjs';
import { dayWords, freezeSchedule, extendSchedule, reconcileSchedule, frozenWords, KEEP_AHEAD, SCHEDULE_EPOCH } from '../api/_lib/pw-day.js';
import { dayOf } from '../js/core/streak.js';

const ROOT = new URL('../', import.meta.url);
const LIST = JSON.parse(readFileSync(new URL('api/_data/pw/answers.json', ROOT), 'utf8'));

test('the review\'s four (befit · cupid · kudos · owlet) are out, cut BY THE BUILD (POOL_FIXES_CUTS), kudos no longer kept as "not a plural"', () => {
  assert.deepEqual(POOL_FIXES_CUTS, ['befit', 'cupid', 'kudos', 'owlet']);
  for (const w of POOL_FIXES_CUTS) assert.ok(!LIST.words.includes(w), w);
  assert.ok(!KEEP_S.includes('kudos'));
  const build = readFileSync(new URL('scripts/pw-words/build.mjs', ROOT), 'utf8');
  assert.match(build, /\.\.\.POOL_FIXES_CUTS\]/, 'applied with the reviewer\'s cuts');
  assert.match(build, /unsafeIn\(w\)/, 'THE KID-SAFE FILTER in the build');
  assert.equal(LIST.n, LIST.words.length);
  assert.equal(LIST.n, 1398);
});

test('THE KID-SAFE FILTER passes every answer', () => {
  assert.deepEqual(LIST.words.filter(w => unsafeIn(w).length), []);
});

test('THE PICK is not the list\'s order: the file is alphabetical, the schedule a keyed shuffle — yesterday\'s word never tells today\'s', () => {
  const words = LIST.words, pos = new Map(words.map((w, i) => [w.toUpperCase(), i]));
  assert.deepEqual(words, words.slice().sort(), 'the file IS alphabetical (the review\'s note)');
  // 60 days in a row with a test pepper: the gap between one day's first word and the next day's, in the alphabetical list, is all over the place
  const gaps = [];
  let prev = null;
  for (let k = 0; k < 60; k++) {
    const [a] = dayWords(dayOf(SCHEDULE_EPOCH + k), words, 'a-test-pepper');
    if (prev != null) gaps.push(pos.get(a) - prev);
    prev = pos.get(a);
  }
  assert.ok(new Set(gaps).size >= 55, 'no fixed step from one day to the next');
  assert.ok(gaps.filter(g => Math.abs(g) <= 2).length <= 3, 'the next day is not the alphabetical neighbour');
  // …and without the server's secret the date alone decides nothing: another pepper, another schedule
  let same = 0;
  for (let k = 0; k < 60; k++) if (dayWords(dayOf(SCHEDULE_EPOCH + k), words, 'pepper-a').join() === dayWords(dayOf(SCHEDULE_EPOCH + k), words, 'pepper-b').join()) same++;
  assert.ok(same <= 1);
});

test('a list edit keeps TODAY\'s and TOMORROW\'s pairs (KEEP_AHEAD) — a cut word already on tomorrow still plays tomorrow; the day after slides', () => {
  assert.equal(KEEP_AHEAD, 1);
  const words = LIST.words, P = 'a-test-pepper', today = 12;
  const rec0 = extendSchedule(freezeSchedule(words, P), words, P, today + 5);
  const tomorrow = rec0.s[2 * (today + 1)], after = rec0.s[2 * (today + 2)];
  const cut = words.filter(w => ![tomorrow, after].includes(w.toUpperCase()));
  const rec = reconcileSchedule(rec0, cut, P, today);
  for (let k = 0; k <= today + 1; k++) assert.deepEqual(frozenWords(rec, k), frozenWords(rec0, k), `day ${k} unchanged (the past, today, tomorrow)`);
  assert.equal(frozenWords(rec, today + 1)[0], tomorrow, 'tomorrow keeps its word even though it was cut');
  assert.ok(!frozenWords(rec, today + 2).includes(after), 'the day after tomorrow: the cut word skipped');
});
