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
