// HIGH RISE DAILY B — THE SCREENS + GO LIVE (docs/games/plan.md "HIGH RISE DAILY B"; the pass log: docs/games/passes/highrise-daily-b.md). PURE.
//   THE RECOLOUR      every ticket's ink (night · day) as the owner set them; five inks told apart in both looks
//   THE MARK ART      JAYWALK + HIGH RISE tickets = the game's own mark in its own colours; a near-white tube navy by day
//   THE TICKET        HIGH RISE in every state: One shot. · DAILY BEST · 112 FLOORS · FLOOR 47 · ONE SHOT + RESUME · 84 FLOORS + the place · NEW DAILY BEST
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

import { fiveLayout, FIVE, BIG_FIVE, HEAD, planToday } from '../js/daily/share-today.js';
import { SMALL_MIN } from '../js/daily/share.js';
import * as PWS from '../js/games/password/share.js';
import * as CCS from '../js/games/coastclear/share.js';
import * as DRS from '../js/games/drop/share.js';
import * as JWS from '../js/games/jaywalk/daily-share.js';
import * as HRS from '../js/games/highrise/daily-share.js';
import { runFromShare, HIT, NEAR, MISS } from '../js/games/password/logic.js';

test('THE BIG FIVE — from 5 FINISHED: the 196-unit box (name 70 · big 126 · stat 46), 16 between, ≈ ×0.9 at 5 under the streak header — never scaled up; the 360 floor holds', () => {
  assert.equal(BIG_FIVE, 5);
  assert.deepEqual({ ...FIVE }, { H: 196, gap: 16, nameY: 24, namePx: 70, bigY: 106, bigPx: 126, statY: 178, statPx: 46, COL: 150 });
  const L = fiveLayout(5, HEAD.streak, 1200);
  assert.ok(L.s > 0.88 && L.s < 0.95, `×${L.s.toFixed(3)}`);
  assert.ok(L.ys[4] + FIVE.H * L.s <= 1200 + 0.01 && L.ys[0] >= HEAD.streak);
  assert.equal(fiveLayout(5, 100, 1200).s, 1, 'room to spare: never scaled up');
  // THE 360 FLOOR (DAILY FIX): no name / stat line under ~10 px at a 360-px-wide downscale — 5 AND 6 finished (+ the NOT YET line's lower bottom)
  for (const [n, bottom] of [[5, 1200], [5, 1150], [6, 1200]]) {
    const s = fiveLayout(n, HEAD.streak, bottom).s;
    for (const px of [FIVE.namePx, FIVE.statPx]) assert.ok(px * s * 360 / 1080 >= 10 || px * s >= SMALL_MIN, `${n} at ${bottom}: ${px} → ${(px * s / 3).toFixed(1)} px at 360`);
  }
});

test('THE BIG FIVE — each daily\'s ONE line (big · stat) from the server\'s spoiler-free inputs; a failed run\'s fail word big', () => {
  const pw = { done: true, door: 1, startedAt: 1000, finishedAt: 175000, doors: [{ state: 'solved', marks: [[MISS, NEAR, MISS, MISS, HIT], [HIT, HIT, HIT, HIT, HIT]], n: 2 }, { state: 'solved', marks: [[NEAR, MISS, MISS, HIT, MISS], [HIT, HIT, NEAR, MISS, MISS], [HIT, HIT, HIT, HIT, HIT]], n: 3 }] };
  assert.deepEqual(PWS.fiveLine({ run: runFromShare(pw) }), { big: '5 GUESSES', stat: '2:54' });
  const lost = { ...pw, finishedAt: 420000, doors: [pw.doors[0], { state: 'failed', marks: Array.from({ length: 6 }, () => [NEAR, MISS, HIT, MISS, MISS]), n: 6 }] };
  assert.equal(PWS.fiveLine({ run: runFromShare(lost) }).big, 'LOCKED OUT');
  assert.deepEqual(CCS.fiveLine({ inputs: { head: 'COAST CLEAR', caught: false, time: '2:18', line: '1 SPOTTED · +30 s', spots: 1 } }), { big: '2:18', stat: '1 SPOTTED' });
  assert.deepEqual(CCS.fiveLine({ inputs: { head: 'CAUGHT', caught: true, time: null, line: '3 SPOTTED · 1:58', spots: 3 } }), { big: 'CAUGHT', stat: '3 SPOTTED' });
  assert.deepEqual(DRS.fiveLine({ inputs: { t: 158900, ln: 101, day: 'd20261121' } }), { big: '2:38.9', stat: '101 LINES' });
  assert.deepEqual(JWS.fiveLine({ inputs: { t: [143, 120, null], b: 0, hs: { at: 100, t: 4560 } } }), { big: '143 LANES', stat: 'BEST OF 3' });
  assert.deepEqual(HRS.fiveLine({ inputs: { f: 84, p: 32, w: [], x: [], pf: [] } }), { big: '84 FLOORS', stat: 'ONE SHOT · 32 PERFECTS' });
  assert.deepEqual(HRS.fiveLine({ inputs: { f: 1, p: 1 } }), { big: '1 FLOOR', stat: 'ONE SHOT · 1 PERFECT' });
});

test('HIGH RISE\'s SECTION — THE TOWER: every floor bottom-up where it landed (~124 units at a full slab), filling the box; perfect floors lit; the inputs cleaned', () => {
  const I = HRS.hrInputs({ f: 3, p: 1, w: [1, 0.8, 0.5], x: [0, 0.1, -0.15], pf: [1, 0, 0], seed: 'nope', k: 99, c: 'miss' });
  assert.deepEqual(Object.keys(I).sort(), ['c', 'day', 'f', 'nb', 'p', 'pf', 'w', 'x']);
  const T = HRS.towerOf(I, { cx: 540, bottom: 300, h: 120 });
  assert.equal(T.length, 3);
  assert.ok(Math.abs(T[0].w - HRS.TOWER_W) < 1e-9 && T[0].lit && !T[1].lit, 'the base a full slab, lit (a perfect)');
  assert.ok(T[0].y > T[1].y && T[1].y > T[2].y, 'bottom-up');
  assert.ok(Math.abs(T[1].x + T[1].w / 2 - (540 + 0.1 * HRS.TOWER_W)) < 1e-9, 'where it landed (its centre offset)');
  // a short tower is not stretched into fat bricks; a tall one fills the box
  assert.ok(T[0].h <= HRS.SLAB_MAX);
  const tall = HRS.towerOf({ f: 120, w: Array(120).fill(0.6), x: Array(120).fill(0), pf: [] }, { bottom: 300, h: 120 });
  assert.ok(Math.abs(300 - tall[119].y - 120) < 1e-6, 'the top floor at the box\'s top');
  assert.equal(HRS.hrInputs({ c: 'hack' }).c, null, 'an unknown end word dropped');
  // the plan: HIGH RISE alone = its OWN card (THE POSTER); five finished = five sections
  const t = { day: 'd1', dailies: ['password', 'coastclear', 'drop', 'jaywalk', 'highrise'].map(id => ({ id, name: id })), mine: { highrise: 1 } };
  assert.equal(planToday(t, { highrise: { f: 1 } }).single, 'highrise');
  assert.equal(planToday({ ...t, mine: { password: 1, coastclear: 1, drop: 1, jaywalk: 1, highrise: 1 } }, {}).sections.length, 5);
});

import { rowOpenOn, schedOf, goLiveDay, nextLiveDay } from '../js/core/daily.js';

test('GOES LIVE BY ITSELF — the row\'s own liveFrom (set to the first 4 am after the deploy): closed the day before, open from that 4 am turn; the owner\'s /admin schedule wins', () => {
  const row = DAILIES.find(d => d.id === 'highrise');
  assert.equal(row.on, false, 'the row still ships OFF — only its day opens it');
  assert.match(row.liveFrom, /^d\d{8}$/);
  const from = row.liveFrom, before = `d${String(Number(from.slice(1)) - 1)}`;
  assert.equal(rowOpenOn(row, null, before), false, 'the day before (until 4 am Eastern): 4 tickets');
  assert.equal(rowOpenOn(row, null, from), true, 'from its 4 am turn: 5');
  assert.equal(rowOpenOn(row, null, 'd20991231'), true);
  assert.deepEqual(schedOf(row, null), { from, code: true });
  assert.deepEqual(schedOf(row, { from: 'd20261130' }), { from: 'd20261130' }, 'an /admin schedule wins');
  assert.equal(rowOpenOn(row, { from: 'd20261130' }, from), false);
  assert.equal(goLiveDay({ row, switchOn: true, sched: null, today: before }), from, 'the roof board / the go-live day reads it too');
  assert.equal(goLiveDay({ row, switchOn: false, sched: null, today: from }), null, 'THE GO-LIVE SWITCH still gates everything');
  // a row with no liveFrom is unchanged (JAYWALK / THE DROP — the owner's schedules in the database)
  for (const id of ['jaywalk', 'drop']) { const r = DAILIES.find(d => d.id === id); assert.equal(r.liveFrom, undefined); assert.equal(rowOpenOn(r, null, 'd20991231'), false); }
  // the day picked = the first 4 am AFTER the deploy (this pass deploys on Nov 21 Eastern, before midnight)
  assert.equal(nextLiveDay(Date.parse('2026-11-21T20:30:00-05:00')), 'd20261122');
  assert.equal(nextLiveDay(Date.parse('2026-11-22T02:30:00-05:00')), 'd20261122', 'a deploy after midnight but before 4 am still opens at that 4 am');
});

import { roomFree, roomKey } from '../js/games/highrise/held.js';

test('THE FRESH-EYES REVIEW — THE ROOM WINS\' FREE hold: ONE per REAL game start (its id), started after the open leg\'s GO, an OTHER player with a counted profile', () => {
  const rec = { l: { 0: { u: 'a', go: 10_000, z: 9e9, t: 0 } } };
  assert.equal(roomFree(rec, null), 'no_room_game');
  assert.equal(roomFree(rec, { key: 'm1', at: 20_000, others: 0 }), 'no_room_game', 'a room one player made alone (no counted other)');
  assert.equal(roomFree(rec, { key: '', at: 20_000, others: 2 }), 'no_room_game', 'no game start id');
  assert.equal(roomFree(rec, { key: 'm1', at: 20_000, others: 1 }), '', 'a real start, a real party');
  assert.equal(roomFree({ ...rec, rk: { [roomKey('m1')]: 1 } }, { key: 'm1', at: 20_000, others: 1 }), 'room_used', 'the same start never pays twice');
  assert.equal(roomFree(rec, { key: 'm2', at: 1_000, others: 1 }), 'room_old', 'a start from before this leg — not an interruption of it');
  assert.equal(roomKey('a.b/c[d]#$'), 'a_b_c_d___');
  const S = readFileSync(new URL('../api/_lib/highrise-daily.js', import.meta.url), 'utf8');
  assert.match(S, /const why = roomFree\(record, roomProof\);/);
  assert.match(S, /if \(node && Number\.isFinite\(node\.e\) && !node\.x\) \{ await endRun\(\{ pid, day, now, why: 'fin' \}\); return \{ ended: 'fin' \}; \}/, 'a START after the phone\'s own end ends the run (never a hold)');
  assert.match(S, /await ref\(path\)\.transaction\(cur => \(cur && cur\.e != null \? undefined : \{ \.\.\.\(cur \|\| \{\}\), x: why, e: now \}\)\)/, 'x + e in ONE transaction, only on an open leg');
});
