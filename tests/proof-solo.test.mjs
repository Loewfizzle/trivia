// THE PROOF PASS (Nov 20) — A VERIFIED SOLO RUN IS A COUNTED PLAY (the inbox's Nov 20 2:17 pm entry; docs/progression.md "WHO GETS LISTED"):
// THE BOARD lists a profile from its 3rd COUNTED PLAY — a room match, a counted daily finish, or (new) a SOLO run THE SERVER replayed
// itself from the player's proof node and counted (JAYWALK, HIGH RISE). The pure half: the row's `sv` (core/match-report.js), the count
// (core/progress.js#matchStep), the re-count from the records (core/board-fill.js). The server half: tests/integration/server.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { matchStep, countedPlays, boardHidden } from '../js/core/progress.js';
import { countedPlaysFromRecords } from '../js/core/board-fill.js';
import { extractMatch, VERIFIED_SOLO } from '../js/core/match-report.js';
import { VERIFIED_SOLO as CORE_LIST } from '../js/core/proof.js';
import { jaywalkSolo } from '../api/_lib/jaywalk.js';
import { highriseSolo } from '../api/_lib/highrise.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const T0 = Date.UTC(2026, 10, 20, 20, 0), PROF = { n: 'AVA' }, MIN = 3;
const solo = (s, k, row = {}) => matchStep(s, { key: `s${k}`, gid: 'jaywalk', row: { rank: 1, win: false, c: { p: 1 }, rec: {}, solo: true, ...row }, n: 1, now: T0 + k * 600_000 });

test('THE LIST: the games whose runs the SERVER replays itself — JAYWALK + HIGH RISE (= api/report.js#PROOF_GAMES); one list, core/proof.js', () => {
  assert.deepEqual([...VERIFIED_SOLO], ['jaywalk', 'highrise']); assert.equal(VERIFIED_SOLO, CORE_LIST);
  const rep = (read('api/report.js') + read('api/_lib/trust-lists.js'));
  for (const g of VERIFIED_SOLO) assert.ok(new RegExp(`\\n  ${g}: Object\\.freeze\\(\\{ node: (?:'\\w+'|PROOF_NODES\\.\\w+), solo: \\w+, match: \\w+, live: \\w+ \\}\\),`).test(rep), `${g} is a PROOF GAME on the server`);
  assert.equal((rep.slice(rep.indexOf('export const PROOF_GAMES'), rep.indexOf('});', rep.indexOf('export const PROOF_GAMES'))).match(/Object\.freeze\(\{ node:/g) || []).length, VERIFIED_SOLO.length, 'no proof game missing from the list, none extra');
});

test('THE COUNT (matchStep): a solo run counts ONLY with the row\'s `sv` — three verified runs = listed; a solo run without it (a game the host grades) never; the same run never twice', () => {
  let s = null;
  for (let k = 1; k <= 2; k++) s = solo(s, k, { sv: 1 }).next;
  assert.equal(countedPlays(s), 2); assert.equal(boardHidden(PROF, s, MIN), 'matches', '2 verified runs: not listed');
  assert.equal(solo(s, 2, { sv: 1 }).skip, 'counted', 'the same run again: skipped — exactly once');
  for (let k = 3; k <= 6; k++) s = solo(s, k).next;                       // (four host-graded solo runs)
  assert.equal(countedPlays(s), 2, 'a solo run without `sv` never counts');
  s = solo(s, 7, { sv: true }).next; assert.equal(countedPlays(s), 2, '`sv` is the server\'s 1 — nothing else');
  s = solo(s, 8, { sv: 1 }).next;
  assert.equal(countedPlays(s), 3); assert.equal(boardHidden(PROF, s, MIN), false, 'the 3rd verified solo run: LISTED');
  assert.equal(boardHidden({ n: 'AVA', h: 1 }, s, MIN), 'opt', 'the opt-out / the admin\'s hide still hides (DON\'T COUNT is applied at read — api/_lib/nocount.js)');
  assert.equal(solo(s, 9, { sv: 1, empty: 1 }).skip, 'empty', 'an EMPTY run (the server refused it / nothing done) is skipped before any count');
  // a room match still counts as ever; its rows carry `sv` too (harmless: a room match counts by being one)
  const m = matchStep(s, { key: 'm1', gid: 'jaywalk', row: { rank: 2, win: false, c: { p: 1 }, rec: {}, sv: 1 }, n: 3, now: T0 + 20 * 600_000 }).next;
  assert.equal(countedPlays(m), 4);
});

test('THE MARK (extractMatch): `sv` only on a match THE SERVER built from a proof node (`game.sv`), of a proof game, not refused, not empty — never from a room\'s own game blob', () => {
  const ok = { id: 'jaywalk', matchId: 'sabc12', phase: 'final', mode: 'solo', sv: 1, participants: { u: true }, settings: {}, results: { u: { l: 14, t: 900, w: 'car', e: 950 } } };
  assert.equal(extractMatch(ok, {}).rows.u.sv, 1, 'a verified JAYWALK solo run');
  assert.equal(extractMatch({ ...ok, results: { u: { l: 0, t: 0, w: '', e: -1, bad: 'ahead of the clock' } } }, {}).rows.u.sv, undefined, 'a REFUSED run: no mark (and it is empty)');
  assert.equal(extractMatch({ ...ok, results: { u: { l: 0, t: 0, w: 'wall', e: 400 } } }, {}).rows.u.sv, undefined, 'an EMPTY run (no lane reached): no mark');
  assert.equal(extractMatch({ ...ok, sv: undefined }, {}).rows.u.sv, undefined, 'a room\'s own blob of the same game (the host wrote it): no mark');
  assert.equal(extractMatch({ ...ok, sv: true }, {}).rows.u.sv, undefined, '`sv` is exactly 1');
  const hr = { id: 'highrise', matchId: 'sabc13', phase: 'final', mode: 'solo', sv: 1, participants: { u: true }, settings: {}, results: { u: { f: 22, p: 9, t: 1800, w: 'miss', e: 1850, s: 4 } } };
  assert.equal(extractMatch(hr, {}).rows.u.sv, 1, 'a verified HIGH RISE solo run');
  // the server's own builders make exactly such a game (a node with no GO → refused: no mark)
  assert.equal(jaywalkSolo({ code: 'ROOM', matchId: 'sabc12', uid: 'u', node: null }).game.sv, 1); assert.equal(highriseSolo({ code: 'ROOM', matchId: 'sabc13', uid: 'u', node: null }).game.sv, 1);
  assert.equal(extractMatch(jaywalkSolo({ code: 'ROOM', matchId: 'sabc12', uid: 'u', node: null }).game, {}).rows.u.sv, undefined);
  // a game the HOST grades can never carry it — whatever its blob says
  const src = read('js/core/match-report.js');
  assert.ok(src.includes("if (game.sv === 1 && VERIFIED_SOLO.includes(game.id) && !((game.results || {})[row.uid] || {}).bad && !o.empty) o.sv = 1;"));
  // … and a proof game's MATCH with ONE real player (the solo rule) keeps the mark: its run was the server's replay
  assert.ok((read('api/report.js') + read('api/_lib/trust-lists.js')).includes("export const asSoloRow = row => ({ rank: (row && row.rank) || 1, win: false, solo: true, c: { p: 1 }, rec: {}, ...(row && row.sv === 1 ? { sv: 1 } : {}) });"));
  assert.ok(read('js/core/progress.js').includes('next.cp = countedPlays(s) + (solo ? (row && row.sv === 1 ? 1 : 0) : 1);'));
});

test('THE RE-COUNT (the back-fill — core/board-fill.js#countedPlaysFromRecords): a counted SOLO record of a proof game counts; a skipped one, a solo record of any other game: never; twice = the same', () => {
  const o = (pid, extra = {}) => ({ [pid]: { gid: 'x', rank: 1, ...extra } });
  const results = {
    r1: { st: 'done', g: 'jaywalk', n: 1, o: o('pA') },
    r2: { st: 'done', g: 'highrise', n: 1, o: o('pA') },
    r3: { st: 'done', g: 'jaywalk', n: 1, o: o('pA', { skip: 'empty' }) },          // (refused / empty: never)
    r4: { st: 'done', g: 'overclock', n: 1, o: o('pA') },                           // (a host-graded solo run: never)
    r5: { st: 'done', g: 'prism', n: 1, o: o('pA') },
    r6: { st: 'done', g: 'jaywalk', n: 1, o: o('pA', { skip: 'too_soon' }) },
    r7: { st: 'done', g: 'jaywalk', n: 1, o: o('pA') },
    r8: { st: 'done', g: 'prism', n: 4, o: { ...o('pB'), ...o('pC') } },            // (a room match: as ever)
    r9: { st: 'done', n: 1, o: o('pB') },                                           // (a solo record with no game on it: never)
    ra: { st: 'retry', g: 'jaywalk', n: 1, o: o('pC') },                            // (counted so far for pC — the outcome is not a skip)
  };
  const a = countedPlaysFromRecords({ results, daily: {} });
  assert.deepEqual(a, { pA: 3, pB: 1, pC: 2 });
  assert.deepEqual(countedPlaysFromRecords({ results, daily: {} }), a, 'the same records → the same counts (the back-fill SETS the count: max(live, re-counted) — a second run changes nothing)');
  assert.ok(read('api/_lib/board-fill.js').includes('const cpOf = (cur, pid) => Math.max(Number(cur && cur.cp) || 0, plays[pid] || 0);'), 'never an increment: idempotent');
  // a daily finish (THE DROP, JAYWALK's daily, …) was a counted play already
  assert.deepEqual(countedPlaysFromRecords({ results: {}, daily: { drop: { d20261120: { r: { pA: 900, pB: 500 }, x: { pB: 1 } } } } }), { pA: 1 });
});
