// THE BEFORE-LAUNCH PASS — HOST TRUST, the pure halves (docs/match-kit.md "WHAT THIS DOES NOT CLOSE", docs/prism.md + docs/overclock.md
// "HOST TRUST"): PRISM DROP's board cap / the bound's lost place / a live board put out (core/match-report.js#prismVerify), OVERCLOCK's
// server re-grade (games/overclock/regrade.js), THE REPORT LOCK (core/room-logic.js) + the snapshot path's move-on stamp. The server's
// end-to-end cases (a modified host / rival on the emulators): tests/integration/server.test.mjs "THE BEFORE-LAUNCH PASS".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { finalGame, ocBoardsFor, ocStartAt } from './fixtures/finals.mjs';
import { prismVerify, maxRushScore, PRISM_FRESH_MS, movedOnAt } from '../js/core/match-report.js';
import { ocRegrade } from '../js/games/overclock/regrade.js';
import { computeResults, levelOf } from '../js/games/overclock/logic.js';
import { timesOf } from '../js/games/overclock/director.js';
import { generate } from '../js/games/overclock/challenges.js';
import { staleProofPaths, reportLocked, REPORT_LOCK_NODES, PROOF_LOCK_MS } from '../js/core/room-logic.js';
import { readFileSync } from 'node:fs';

const U = ['ua', 'ub', 'uc'];
const clone = o => JSON.parse(JSON.stringify(o));

test('PRISM DROP SCORE RUSH — THE BOARD CAP: a host above his own board gets his board; an honest final is untouched', () => {
  const g = finalGame('prism', U, { mode: 'rush' });
  const boards = Object.fromEntries(U.map(u => [u, { st: 'out', at: 1, sc: g.results[u].sc, ln: g.results[u].ln }]));
  const honest = prismVerify(g, boards);
  assert.equal(honest.game, g, 'nothing changed'); assert.equal(honest.bad, null); assert.deepEqual(honest.capped, []);
  // the host (ua is first already) — make ub the host: ub writes himself 99,999 over his board's 35,000
  const f = clone(g); f.results.ub.sc = 99_999;
  const v = prismVerify(f, boards);
  assert.deepEqual(v.capped, ['ub']);
  assert.equal(v.game.results.ub.sc, boards.ub.sc, 'capped at his own board');
  assert.equal(f.results.ub.sc, 99_999, 'the room\'s own game never mutated');
  // a board that a slow mirror saw lower than the end (the host copied less): never raised — the cap only lowers
  const low = clone(g); low.results.uc.sc = 100;
  assert.equal(prismVerify(low, boards).game, low);
});

test('PRISM DROP SCORE RUSH — PAST THE BOUND LOSES THE PLACE: a modified rival\'s board past THE RUSH BOUND is ranked with 0, the honest winner wins', () => {
  const g = finalGame('prism', U, { mode: 'rush' });
  const big = maxRushScore(60, 200) + 1;
  g.results.uc = { ...g.results.uc, sc: big };   // (uc's own board says so too: the rules' own bound is looser)
  const boards = Object.fromEntries(U.map(u => [u, { st: 'out', at: 1, sc: g.results[u].sc, ln: g.results[u].ln }]));
  const v = prismVerify(g, boards);
  assert.deepEqual(v.voided, ['uc']);
  assert.equal(v.game.results.uc.sc, 0);
  assert.ok(v.game.results.ua.sc > 0 && v.game.results.ua.sc === g.results.ua.sc);
});

test('PRISM DROP BATTLE / SURVIVAL — A LIVE BOARD IS NEVER PUT OUT: a fresh `play` board out = refused; topped out / quiet 30 s / solo = fine', () => {
  const g = finalGame('prism', U, {});   // battle: ub + uc out at T0 + 100 s
  const at = g.out.ub.at;
  const ok = { ua: { st: 'play', at: at + 60_000 }, ub: { st: 'out', at }, uc: { st: 'play', at: at - 31_000 } };
  assert.equal(prismVerify(g, ok).bad, null, 'topped out + quiet 31 s: an honest director');
  const bad = { ...ok, uc: { st: 'play', at: at - PRISM_FRESH_MS + 500 } };
  assert.match(prismVerify(g, bad).bad, /live board/);
  assert.equal(prismVerify({ ...g, participants: { ua: true }, out: { ua: { at, place: 1 } } }, { ua: { st: 'play', at } }).bad, null, 'a solo run is its own host');
  const surv = { ...g, settings: { mode: 'survival' } };
  assert.match(prismVerify(surv, bad).bad, /live board/, 'SURVIVAL too');
});

const T0 = Date.UTC(2026, 9, 14, 23, 0, 0);
const bank = () => ({});
test('OVERCLOCK — THE SERVER\'s RE-GRADE: an honest host\'s final passes, QUICK + STANDARD', () => {
  for (const mode of ['quick', 'standard']) {
    const g = finalGame('overclock', U, { mode });
    assert.deepEqual(ocRegrade(g, { oc: ocBoardsFor(g, U), seal: {}, bank }), { ok: true }, mode);
  }
});

test('OVERCLOCK — a forged final is refused: his own points up · a rival\'s right answers down · a dropped challenge · two starts · a rival\'s speed taken', () => {
  const g = finalGame('overclock', U, { mode: 'quick' }), oc = ocBoardsFor(g, U);
  const up = clone(g); up.results[2].ub.pts += 40;
  assert.equal(ocRegrade(up, { oc, bank }).why, 'the points');
  const down = clone(g); down.results[3].ua = { ...down.results[3].ua, ok: 1 };
  assert.equal(ocRegrade(down, { oc, bank }).why, 'the right answers');
  const gone = clone(g); delete gone.results[5];
  assert.equal(ocRegrade(gone, { oc, bank }).why, 'a challenge with no results');
  const clocks = clone(g); clocks.tm[1].ub += 4000;
  assert.equal(ocRegrade(clocks, { oc, bank }).why, 'the clock (two starts)');
  const slow = clone(g); slow.results[0].ua.pts -= 30;   // (ua's speed bonus taken away)
  assert.equal(ocRegrade(slow, { oc, bank }).why, 'the points');
  const ghost = clone(g); const oc2 = clone(oc); delete oc2[2].uc;   // (uc never wrote a board in challenge 3 — the host credited its 1 right)
  assert.equal(ocRegrade(ghost, { oc: oc2, bank }).why, 'the right answers');
});

test('OVERCLOCK — THE SEALED PICKS are graded: a modified rival\'s board says 4 / 4, its picks 2 — the honest host\'s 2 passes, the board\'s 4 is refused', () => {
  const g = finalGame('overclock', U, { mode: 'quick' }), oc = ocBoardsFor(g, U);
  const ci = 3;   // (QUICK MATH — no pool: the seed builds it)
  const spec = generate('math', { seed: g.seed, ci, level: levelOf(ci, g.total), occ: 0, deal: null }, {});
  const right = spec.problems.map(p => p.ans);
  const seal = { [ci]: { ua: { a: JSON.stringify(right), at: oc[ci].ua.doneAt }, ub: { a: JSON.stringify(right.map((v, i) => (i < 2 ? v : v + 1))), at: oc[ci].ub.doneAt }, uc: { a: JSON.stringify(right), at: oc[ci].uc.doneAt } } };
  oc[ci].ub = { ...oc[ci].ub, ok: 4, p: 4 };   // (the rival's phone claims every part)
  const graded = { ua: 4, ub: 2, uc: 4 };
  const honest = clone(g); honest.results[ci] = computeResults({ ...g, ci, playStartAt: ocStartAt(ci) }, oc[ci], graded); honest.tm[ci] = timesOf({ ...g, ci, playStartAt: ocStartAt(ci) }, oc[ci]);
  assert.deepEqual(ocRegrade(honest, { oc, seal, bank }), { ok: true }, 'the host\'s grade of the picks');
  const lazy = clone(g); lazy.results[ci] = computeResults({ ...g, ci, playStartAt: ocStartAt(ci) }, oc[ci], null); lazy.tm[ci] = honest.tm[ci];
  assert.equal(ocRegrade(lazy, { oc, seal, bank }).why, 'the right answers', 'the board\'s own 4 (picks ignored)');
  // THE ONE RACE ALLOWED: the old phone's picks write came AFTER its board's done — the host that saw the board first graded one part lower
  const seal2 = clone(seal); seal2[ci].ub.at = oc[ci].ub.doneAt + 40;
  const raced = clone(g); raced.results[ci] = computeResults({ ...g, ci, playStartAt: ocStartAt(ci) }, oc[ci], { ...graded, ub: 1 }); raced.tm[ci] = honest.tm[ci];
  assert.deepEqual(ocRegrade(raced, { oc, seal: seal2, bank }), { ok: true });
  assert.equal(ocRegrade(raced, { oc, seal, bank }).why, 'the right answers', '…never when the picks landed with the board');
});

test('OVERCLOCK — the server reads the same pools the phones fetch (api/_lib/oc-banks.js names every banks.js file by its literal URL)', () => {
  const src = readFileSync(new URL('../api/_lib/oc-banks.js', import.meta.url), 'utf8');
  for (const f of ['trivia', 'truefalse', 'timeline', 'closest', 'missinglink', 'spellcheck', 'sortit', 'higherlower']) assert.ok(src.includes(`new URL('../../data/oc/${f}.json', import.meta.url)`), f);
  const view = readFileSync(new URL('../js/games/overclock/view.js', import.meta.url), 'utf8');
  assert.ok(/w\[`seal\/\$\{st\.code\}\/\$\{path\}\/a`\] = a/.test(view), 'the picks ride the board\'s own write');
});

test('THE REPORT LOCK: a host-graded match\'s boards stay 10 min after its night record; the prune skips them (never one refused path)', () => {
  const now = T0 + 3600_000;
  assert.deepEqual([...REPORT_LOCK_NODES], ['prism', 'oc', 'ocm']);
  assert.ok(reportLocked({ at: now - 60_000 }, now));
  assert.ok(!reportLocked({ at: now - PROOF_LOCK_MS - 31_000 }, now));
  assert.ok(!reportLocked(null, now), 'no night record: nothing pending');
  const trees = { prism: { m1: {}, m2: {}, m3: {} }, oc: { m4: {} } };
  const night = { m2: { at: now - 60_000 }, m3: { at: now - 3600_000 }, m4: { at: now - 1000 } };
  assert.deepEqual(staleProofPaths(trees, ['m1'], { nodes: [], uid: 'h', now, reportNodes: REPORT_LOCK_NODES, night }), { 'prism/m3': null });
  const rules = JSON.parse(readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8')).rules.rooms.$code;
  for (const n of REPORT_LOCK_NODES) {
    assert.equal(rules[n]['.write'], undefined, `${n}: no whole-node delete`);
    assert.match(rules[n].$match['.write'], /game\/matchId'\)\.val\(\) !== \$match/, `${n}: never the room's own match`);
    assert.match(rules[n].$match['.write'], /night\/' \+ \$match \+ '\/at'\)\.val\(\) > now - 600000/, `${n}: the night record's 10 minutes`);
  }
});

test('THE SNAPSHOT PATH\'s move-on stamp: the walk back, a rematch\'s start — the server\'s own times', () => {
  assert.equal(movedOnAt('m1', null, { back: { m: 'm1', at: 500 } }), 500);
  assert.equal(movedOnAt('m1', { matchId: 'm2', go: 700 }, {}), 700);
  assert.equal(movedOnAt('m1', null, { go: { m: 'm2', at: 800 } }), 800);
  assert.equal(movedOnAt('m1', { matchId: 'm1' }, {}), null);
  assert.equal(movedOnAt('m1', null, { back: { m: 'm0', at: 5 } }), null, 'another match\'s walk back');
});
