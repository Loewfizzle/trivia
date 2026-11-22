// HIGH RISE DAILY B — THE SCREENS + GO LIVE (docs/games/plan.md "HIGH RISE DAILY B"; the pass log: docs/games/passes/highrise-daily-b.md). PURE.
//   THE RECOLOUR      every ticket's ink (night · day) as the owner set them; five inks told apart in both looks
//   THE MARK ART      JAYWALK + HIGH RISE tickets = the game's own mark in its own colours; a near-white tube navy by day
//   THE TICKET        HIGH RISE in every state: One shot. · DAILY BEST · 112 FLOORS · FLOOR 47 · ONE SHOT + RESUME · 84 FLOORS + the place · NEW DAILY BEST
import test from 'node:test';
import assert from 'node:assert/strict';
import { TICKET_ART, TICKET_INK, TICKET_PATHS, markDay, MARK_NAVY, inkOf, stampInkOf } from '../js/daily/ticket-art.js';
import { ticketState, progLine } from '../js/daily/today-logic.js';
import { MARKS } from '../js/core/marks.js';
import { DAILIES } from '../js/config.js';
import { META } from '../js/games/metas.js';

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const dist = (a, b) => Math.hypot(...hex(a).map((v, i) => v - hex(b)[i]));

test('THE RECOLOUR — the owner\'s inks (night · day); THE PASSWORD unchanged; THE DROP\'s stamp = its ink', () => {
  assert.deepEqual(TICKET_INK.highrise, { night: '#4fd6ff', day: '#007f9e' });
  assert.deepEqual(TICKET_INK.jaywalk, { night: '#ff4058', day: '#d01f35' });
  assert.deepEqual(TICKET_INK.coastclear, { night: '#9cff7a', day: '#2e9a2a' });
  assert.deepEqual(TICKET_INK.drop, { night: '#a77bff', day: '#6a3fd0' });
  assert.deepEqual(TICKET_INK.password, { night: '#ff5ec4', day: '#2f86ff', stampDay: '#1450c0' });
  assert.equal(stampInkOf('drop', 'night'), '#a77bff');
  // WHITE stays free: no ticket's night ink is near-white
  for (const [k, v] of Object.entries(TICKET_INK)) assert.ok(dist(v.night, '#ffffff') > 120, `${k}'s night ink is not white`);
});

test('THE RECOLOUR — the five tickets told apart: every pair of inks far apart, night AND day (THE NIGHT PAIR: THE PASSWORD pink vs JAYWALK red)', () => {
  const keys = DAILIES.map(d => d.ticket);
  assert.equal(new Set(keys).size, 5);
  for (const look of ['night', 'day']) for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
    const d = dist(inkOf(keys[i], look), inkOf(keys[j], look));
    assert.ok(d > 85, `${look}: ${keys[i]} vs ${keys[j]} (${d.toFixed(0)})`);
  }
  // JAYWALK's red reads RED (not pink, not orange): its blue well under its red, its green low
  const [r, g, b] = hex(TICKET_INK.jaywalk.night);
  assert.ok(r === 255 && g < 90 && b < 110, 'a true red');
});

test('THE MARK ART — JAYWALK + HIGH RISE tickets draw their game\'s mark in its own colours; near-white → navy by day; the rest keep the ticket ink', () => {
  for (const key of ['jaywalk', 'highrise']) {
    const art = TICKET_ART[key];
    assert.match(art, /class="mk-svg"/);
    for (const t of MARKS[key].tubes) { assert.ok(art.includes(`--mc:${t.col}`), `${key}: ${t.col}`); assert.ok(art.includes(`--md:${markDay(t.col)}`)); }
    assert.ok(art.includes(TICKET_PATHS[key]), 'the share image draws the same paths');
  }
  assert.equal(markDay('#fff4fa'), MARK_NAVY, 'the sneaker\'s white sole + laces go navy by day');
  assert.equal(markDay('#ff3344'), '#ff3344'); assert.equal(markDay('#35e3ff'), '#35e3ff'); assert.equal(markDay('#ff4fd8'), '#ff4fd8');
  assert.match(TICKET_ART.highrise, /--msw:1\.09/, 'HIGH RISE\'s own tube width (4.5) — its floor lines stay apart');
  assert.equal((TICKET_PATHS.highrise.match(/<path /g) || []).length, MARKS.highrise.tubes.length);
  for (const key of ['password', 'coastclear', 'drop']) assert.match(TICKET_ART[key], /<g class="t">/, `${key}'s art unchanged (the ticket's ink)`);
});

test('THE TICKET — HIGH RISE in every state (ONE SHOT, not allDay)', () => {
  const row = DAILIES.find(d => d.id === 'highrise');
  assert.equal(row.hook, 'One shot.'); assert.equal(row.measure, 'floors'); assert.ok(!row.tries && !row.allDay);
  const lineOf = (id, s) => META.highrise.scoreLine(s);
  const d = { id: 'highrise', hook: 'One shot.', measure: 'floors' }, F = f => f * 1e8 + 32 * 1e5 + 99;
  // PLAY (no best)
  assert.deepEqual(ticketState({ day: 'd2' }, d, { lineOf }), { st: 'waiting', line: { text: 'One shot.' }, act: 'PLAY' });
  // PLAY with a best from an earlier day
  const best = { highrise: { best: { s: F(112), day: 'd1' }, newBest: false } };
  assert.deepEqual(ticketState({ day: 'd2', best }, d, { lineOf }).line, { text: 'DAILY BEST · 112 FLOORS', best: true });
  // a HELD run: FLOOR 47 · ONE SHOT + RESUME (over the DAILY BEST line)
  const held = ticketState({ day: 'd2', best, started: { highrise: true }, prog: { highrise: { f: 47, left: 2 } } }, d, { lineOf });
  assert.deepEqual([held.st, held.line.text, held.act], ['progress', 'FLOOR 47 · ONE SHOT', 'RESUME']);
  // a held run with no progress sent (an old server / a refused log): RESUME + the line it had
  assert.equal(ticketState({ day: 'd2', started: { highrise: true } }, d, { lineOf }).line.text, 'One shot.');
  // DONE: 84 FLOORS + the place + ADMITTED (no act)
  const done = ticketState({ day: 'd2', best, mine: { highrise: F(84) }, place: { highrise: { p: 2, n: 5 } } }, d, { lineOf });
  assert.deepEqual([done.st, done.result, done.line.text, done.act], ['done', '84 FLOORS', '2ND OF 5 PLAYERS', null]);
  // a NEW DAILY BEST: the gold line
  const gold = ticketState({ day: 'd2', best: { highrise: { best: { s: F(131), day: 'd2' }, newBest: true } }, mine: { highrise: F(131) }, place: { highrise: { p: 1, n: 5 } } }, d, { lineOf });
  assert.deepEqual(gold.line, { text: 'NEW DAILY BEST', gold: true });
  assert.equal(progLine({ measure: 'lanes' }, { f: 3 }), '', 'only a floors daily says FLOOR n');
  assert.equal(progLine(d, { f: 1 }), 'FLOOR 1 · ONE SHOT');
});
