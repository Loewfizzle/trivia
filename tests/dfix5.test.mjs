// DFIX5 (Nov 14 2026 — docs/coastclear.md "DFIX5", docs/progression.md "EVERYONE ON SCORES"): the pure pieces — the owner's dig readout line,
// the sonar ping's timings, the EVERYONE list (the ranking, the ties, the throwaway gate, the top kept), the spot icons.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { diagLine, PING_MS, SURF_MS, DIAG_N } from '../js/games/coastclear/logic.js';
const LONG_MS = Number(/export const LONG_MS = (\d+)/.exec(readFileSync(new URL('../js/games/coastclear/view.js', import.meta.url), 'utf8'))[1]);

test('the owner\'s readout line: DIG · SERVER · NET · MEDIAN (the lower middle of the last ten); no server time → no SERVER / NET', () => {
  assert.equal(diagLine(148, 9, [148]), 'DIG 148 MS · SERVER 9 MS · NET 139 MS · MEDIAN 148 MS');
  assert.equal(diagLine(200, 12, [100, 300, 200, 150]), 'DIG 200 MS · SERVER 12 MS · NET 188 MS · MEDIAN 150 MS');
  assert.equal(diagLine(90, null, [90, 80]), 'DIG 90 MS · MEDIAN 80 MS');
  assert.equal(diagLine(5, 9, [5]), 'DIG 5 MS · SERVER 9 MS · NET 0 MS · MEDIAN 5 MS', 'never a negative network time');
  assert.equal(DIAG_N, 10);
});

test('THE SONAR PING: quick (~180 ms), well inside the long-press (a buoy is still a long-press); the number surfaces in ~120 ms; transform + opacity only', () => {
  assert.ok(PING_MS >= 150 && PING_MS <= 220, `the rings ${PING_MS} ms`);
  assert.ok(PING_MS < LONG_MS, 'the rings are gone before a press becomes a buoy');
  assert.ok(SURF_MS <= 140);
  const css = readFileSync(new URL('../css/coastclear.css', import.meta.url), 'utf8');
  for (const k of ['cc-ping', 'cc-surf', 'cc-flash']) {
    const at = css.indexOf(`@keyframes ${k} {`);
    assert.ok(at >= 0, `@keyframes ${k}`);
    const open = css.indexOf('{', at);
    let d = 0, end = open;
    for (let i = open; i < css.length; i++) { if (css[i] === '{') d++; else if (css[i] === '}' && --d === 0) { end = i; break; } }
    const props = [...css.slice(open + 1, end).matchAll(/([a-z-]+)\s*:/g)].map(x => x[1]);
    assert.ok(props.every(p => p === 'opacity' || p === 'transform'), `${k} animates only transform + opacity (${props.join(', ')})`);
  }
});

// ---------------------------------------------------------------- EVERYONE ON SCORES — the pure ranking (js/core/every.js)
import { cmpRows, topRows, insertTop, buildTop, placeIn, everyView, everyPlaceLine, TOP_KEEP, TOP_SHOW } from '../js/core/every.js';
import { ordinal } from '../js/daily/today-logic.js';
import { resultMarks, RESULT_MARK, LAMP_SVG, scoreLine } from '../js/games/coastclear/meta.js';

test('the order: the daily\'s number by its `better`; a TIE → the EARLIER finish; no time (before DFIX5) after the timed; then the pid', () => {
  const rows = [{ k: 'c', s: 4, at: 30 }, { k: 'a', s: 4, at: 10 }, { k: 'b', s: 3, at: 50 }, { k: 'z', s: 4 }, { k: 'd', s: 6, at: 1 }];
  assert.deepEqual([...rows].sort(cmpRows('low')).map(r => r.k), ['b', 'a', 'c', 'z', 'd'], 'low (THE PASSWORD\'s guesses, COAST CLEAR\'s time): the fewest first, ties by time');
  assert.deepEqual([...rows].sort(cmpRows('high')).map(r => r.k), ['d', 'a', 'c', 'z', 'b'], 'high (THE DROP\'s packed number): the most first');
});

test('insertTop: a counting finish in, a retry = the same node, cut at TOP_KEEP; a broken node reads as empty', () => {
  let n = null;
  for (let i = 0; i < TOP_KEEP + 5; i++) n = insertTop(n, { k: `p${i}`, s: 100 + i, at: i }, 'low');
  assert.equal(n.rows.length, TOP_KEEP); assert.equal(n.v, 1);
  assert.equal(n.rows[0].k, 'p0'); assert.equal(n.rows.at(-1).k, `p${TOP_KEEP - 1}`);
  const again = insertTop(n, { k: 'p3', s: 103, at: 3 }, 'low');
  assert.deepEqual(again, n, 'a retried finish: the same node');
  const better = insertTop(n, { k: 'new', s: 1, at: 99 }, 'low');
  assert.equal(better.rows[0].k, 'new'); assert.equal(better.rows.length, TOP_KEEP);
  assert.deepEqual(topRows({ rows: 'junk' }), []); assert.deepEqual(topRows(null), []);
  assert.deepEqual(insertTop(null, { k: '', s: 3 }), { v: 1, rows: [] }, 'a row with no pid never enters');
  assert.deepEqual(topRows({ rows: { 0: { k: 'a', s: 2 }, 1: { k: 'b', s: 1 } } }, 'low').map(r => r.k), ['b', 'a'], 'the database\'s object form of an array reads too');
});

test('buildTop (the backfill): the day\'s scores less THE THROWAWAY GATE\'s x/ (and a run before the reset epoch — x/ too)', () => {
  const b = buildTop({ a: 5, b: 3, c: 4, gate: 1, bad: 'x' }, { gate: 1 }, { c: { sp: 1 } }, 'low');
  assert.deepEqual(b.rows.map(r => r.k), ['b', 'c', 'a']);
  assert.deepEqual(b.rows[1].e, { sp: 1 });
});

test('everyView: the first rows + YOU below them; scores only once played; friends marked (never you); hidden left out, places kept', () => {
  const rows = Array.from({ length: 14 }, (_, i) => ({ k: `p${i}`, s: 10 + i, at: i, ...(i === 2 ? { e: { sp: 2 } } : {}) }));
  const v = everyView(rows, { pid: 'p12', friends: new Set(['p1', 'p12']), played: true, hidden: new Set(['p3']), limit: TOP_SHOW });
  assert.equal(v.list.length, TOP_SHOW);
  assert.deepEqual(v.list.map(r => r.rank).slice(0, 4), [1, 2, 3, 5], 'p3 hidden — the places never re-ranked');
  assert.equal(v.list[1].f, 1); assert.ok(!v.list[0].f);
  assert.deepEqual(v.list[2].e, { sp: 2 });
  assert.deepEqual(v.mine, { k: 'p12', rank: 13, s: 22, me: 1 }, 'YOU below the shown rows: your place; never marked a friend');
  assert.equal(v.more, 13);
  const before = everyView(rows, { pid: 'p0', played: false });
  assert.ok(before.list.every(r => r.s == null && r.e == null), 'before you play: no score, no extra');
  assert.equal(before.list[0].me, 1);
  assert.equal(everyView(rows, { pid: 'p5', played: true }).mine, null, 'YOU inside the top: no extra row');
  assert.equal(placeIn(rows, 'p4'), 5); assert.equal(placeIn(rows, 'nobody'), null);
});

test('the ticket line: "4TH OF 12 TODAY" (never "OF" a smaller number than the place)', () => {
  assert.equal(everyPlaceLine(4, 12, ordinal), '4TH OF 12 TODAY');
  assert.equal(everyPlaceLine(1, 1, ordinal), '1ST OF 1 TODAY');
  assert.equal(everyPlaceLine(23, 20, ordinal), '23RD OF 23 TODAY');
  assert.equal(everyPlaceLine(0, 12, ordinal), '');
});

test('THE SPOT ICONS: one searchlight per spot on a CLEAR (0–2), none on CAUGHT; the server\'s count; drawn, never an emoji', () => {
  assert.equal(resultMarks(108, { sp: 0 }), 0);
  assert.equal(resultMarks(138, { sp: 1 }), 1);
  assert.equal(resultMarks(168, { sp: 2 }), 2);
  assert.equal(resultMarks(10004, { sp: 3 }), 0, 'CAUGHT stays CAUGHT');
  assert.equal(resultMarks(138, null), 0, 'no extra (the server sent none) → no icons');
  assert.equal(scoreLine(138), '2:18');
  assert.equal(RESULT_MARK.label(1), '1 spot'); assert.equal(RESULT_MARK.label(2), '2 spots');
  assert.ok(/<path/.test(LAMP_SVG) && !/\p{Extended_Pictographic}/u.test(LAMP_SVG));
  const view = readFileSync(new URL('../js/games/coastclear/view.js', import.meta.url), 'utf8');
  assert.ok(/const LAMP = LAMP_SVG/.test(view), 'ONE lamp: the game\'s status row draws the same path');
});
