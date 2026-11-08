// NOTHING SECRET IN THE REPO (DM1 ADD-ON — Ben, Nov 8: the dailies go ON while the repo is PUBLIC): THE PASSWORD's frozen schedule, a stored
// day's words or board, THE DAILY SECRET — server-only database paths (dsched/, dly/, dsecret/), never a committed file. This reads every file
// git tracks and fails on anything that looks like one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' }).split('\0').filter(Boolean);
const TEXT = /\.(js|mjs|cjs|json|html|md|txt|csv|yml|yaml)$/i;

test('no committed file is a schedule, a stored day or a daily secret', () => {
  const answers = JSON.parse(readFileSync(new URL('api/_data/pw/answers.json', ROOT), 'utf8')).words.map(w => w.toUpperCase());
  const ans = new Set(answers);
  const bad = [];
  for (const f of tracked) {
    // (a daily schedule / secret by name — the city's timetable fixture, tests/fixtures/sched-golden.json, is not one)
    if (/(dsched|dsecret|(pw|password|daily|dailies)[-_]?(sched|secret))[^/]*\.(json|txt|csv)$/i.test(f)) bad.push(`${f}: a daily-schedule / secret data file`);
    if (!TEXT.test(f)) continue;
    let s;
    try { if (statSync(new URL(f, ROOT)).size > 8e6) continue; s = readFileSync(new URL(f, ROOT), 'utf8'); } catch { continue; }
    // THE FROZEN SCHEDULE's stored form: a long comma-joined run of upper-case answer words
    for (const m of s.matchAll(/(?:[A-Z]{5},){39,}[A-Z]{5}/g)) if (m[0].split(',').filter(w => ans.has(w)).length >= 30) bad.push(`${f}: a run of ${m[0].split(',').length} answer words`);
    // a stored day: THE PASSWORD's pair record ({ v: 1, w: 'ABOUT,CRANE' }) or a packed COAST CLEAR board ({ … l: '3,17,…' } — 18 lights)
    if (/"w"\s*:\s*"[A-Z]{5},[A-Z]{5}"/.test(s)) bad.push(`${f}: a stored PASSWORD pair`);
    if (/"l"\s*:\s*"\d{1,3}(?:,\d{1,3}){17}"/.test(s)) bad.push(`${f}: a packed COAST CLEAR board`);
    // THE DAILY SECRET's value (a 64-hex key under dsecret / DAILY_SECRET)
    if (/DAILY_SECRET\s*[=:]\s*["']?[0-9a-f]{32,}/i.test(s) || /"d0{8}"\s*:\s*"[0-9a-f]{32,}"/.test(s)) bad.push(`${f}: a daily secret`);
  }
  assert.deepEqual(bad, []);
});

test('THE PASSWORD\'s server data = the list (alphabetical — no schedule order) + the spelling list, nothing else', () => {
  const pw = tracked.filter(f => f.startsWith('api/_data/pw/')).sort();
  assert.deepEqual(pw, ['api/_data/pw/answers.json', 'api/_data/pw/valid-5.json']);
  const words = JSON.parse(readFileSync(new URL('api/_data/pw/answers.json', ROOT), 'utf8')).words;
  assert.deepEqual(words, [...words].sort(), 'the answer list stays alphabetical (an order in the file would be a schedule)');
});

test('the days come from THE DAILY SECRET, never the pepper (the code)', () => {
  const src = f => readFileSync(new URL(f, ROOT), 'utf8');
  for (const f of ['api/_lib/pw.js', 'api/_lib/cc.js', 'api/_lib/dailies.js']) {
    assert.doesNotMatch(src(f), /fb\(\)\.pepper/, `${f}: no pepper`);
    assert.match(src(f), /dailySecret\(/, `${f}: the daily secret`);
  }
});
