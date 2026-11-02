// SCHED Group 4 — THE BILLBOARD's HINTS (core/harbor-billboard.js; the timetable's billboard.* queue — the owner, Nov 2: "short, whole
// board"): the right hint in its window, two short lines that fit the ~70-pt board, never naming a legendary before it comes, the Sunday
// postcard, the cycle (a spell of `show` s every `every` s, then the day's game).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hintsAt, hintAt, billboardRows } from '../js/core/harbor-billboard.js';
import { legendsTonight } from '../js/core/harbor-showcase.js';
import { knob } from '../js/core/harbor-schedule.js';

const lc = (y, m, d, h, mi = 0) => ({ y, m, d, h, mi, s: 0 });
test('the queue: every hint a timetable row with its lines, window, priority + cycle', () => {
  const ids = billboardRows().map(r => r.id).sort();
  assert.deepEqual(ids, ['billboard.fireworks', 'billboard.lookup', 'billboard.party', 'billboard.postcard']);
  for (const r of billboardRows()) assert.ok(r.every > r.show && r.show > 0 && r.prio != null, r.id);
});
test('FIREWORKS / TONIGHT 9:30 on a weeknight evening until the show — never on a party night', () => {
  const ids = h => hintsAt(h).map(x => x.id);
  assert.ok(ids(lc(2026, 11, 4, 19)).includes('billboard.fireworks'));
  assert.deepEqual(hintsAt(lc(2026, 11, 4, 19)).find(x => x.id === 'billboard.fireworks').lines, ['FIREWORKS', 'TONIGHT 9:30']);
  assert.ok(!ids(lc(2026, 11, 4, 21, 40)).includes('billboard.fireworks'), 'gone once the show starts');
  assert.ok(!ids(lc(2026, 11, 6, 19)).includes('billboard.fireworks'), 'a party night has the party show');
});
test('the party days: STREET PARTY / FROM 8 (Friday), FULL SHOW / AT 10 (Saturday)', () => {
  assert.deepEqual(hintsAt(lc(2026, 11, 6, 15)).find(x => x.id === 'billboard.party').lines, ['STREET PARTY', 'FROM 8']);
  assert.deepEqual(hintsAt(lc(2026, 11, 7, 19)).find(x => x.id === 'billboard.party').lines, ['FULL SHOW', 'AT 10']);
});
test('LOOK UP — a few minutes before each of tonight’s legendaries, NEVER naming it, the top priority', () => {
  for (const [y, m, d] of [[2026, 11, 3], [2026, 11, 4], [2026, 11, 6]]) for (const L of legendsTonight(y, m, d)) {
    const h = L.h - 2 / 60, at = h >= 24 ? (() => { const p = new Date(Date.UTC(y, m - 1, d) + 864e5); return lc(p.getUTCFullYear(), p.getUTCMonth() + 1, p.getUTCDate(), Math.floor(h - 24), Math.round(((h - 24) % 1) * 60)); })() : lc(y, m, d, Math.floor(h), Math.round((h % 1) * 60));
    const top = hintsAt(at)[0];
    assert.equal(top.id, 'billboard.lookup', `${y}-${m}-${d} ${L.kind}`);
    assert.ok(!/BLACKBIRD|SAUCER|UFO|TR-3B|F-22/.test(top.lines.join(' ')), 'never names it');
  }
});
test('THE SUNDAY POSTCARD: last week’s legendary (its silhouette + its name) on a Sunday by day only', () => {
  const h = hintsAt(lc(2026, 11, 8, 13)).find(x => x.id === 'billboard.postcard');
  assert.ok(h && h.art && h.lines[0] === 'LAST WEEK' && h.lines[1].length <= 12);
  assert.ok(!hintsAt(lc(2026, 11, 9, 13)).some(x => x.id === 'billboard.postcard'), 'not on a Monday');
});
test('every line fits the board (≤ 12 letters) + the cycle: a spell on, then the game back', () => {
  for (const [y, m, d] of [[2026, 11, 3], [2026, 11, 6], [2026, 11, 7], [2026, 11, 8]]) for (let h = 10; h < 24; h += 0.25) for (const x of hintsAt(lc(y, m, d, Math.floor(h), Math.round((h % 1) * 60)))) for (const s of x.lines) assert.ok(s.length <= 12, s);
  const F = knob('billboard.fireworks'); let on = 0;
  for (let s = 0; s < F.every; s += 5) if (hintAt(lc(2026, 11, 4, 19, 0), 0) && hintAt({ ...lc(2026, 11, 4, 19, 0), s }, 0)) on++;
  const w = F.every / 5, frac = [...Array(w).keys()].filter(i => { const t = i * 5; return hintAt({ y: 2026, m: 11, d: 4, h: 19, mi: Math.floor(t / 60), s: t % 60 }, 0); }).length / w;
  assert.ok(Math.abs(frac - F.show / F.every) < 0.05, `on ${(frac * 100).toFixed(0)} % of the cycle`);
});
