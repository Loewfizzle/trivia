// PD-5B — PRISM DROP's THREE CARDS: FIRST KO (common) · PERFECT CLEAR (rare) · COMEBACK (epic). The flags come from the room's OWN record of the
// match (core/match-report.js#prismExtra — PD-2's results: ko, pc, dz + the eliminations in game.out), the achievements award the cards (the
// server's catalog), one unlock however often a match is reported, COMEBACK never raises COMEBACK KID, the cards' wiring (the lab, the looks,
// the hero-spot rule) and the effect's pure geometry.
import '../api/_lib/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractMatch } from '../js/core/match-report.js';
import { matchStep } from '../js/core/progress.js';
import { ACH, GAME_ACHIEVEMENTS } from '../js/core/achievements.js';
import { ITEM } from '../js/core/items.js';
import { finalGame, T0 } from './fixtures/finals.mjs';
import { LAB, verOf, labStatus } from '../js/vault/catalog.js';
import { LAB_TEXT, LAB_CHANGES } from '../api/_lib/lab-text.js';
import { HERO, heroMisses, HERO_BAND, GEM_BOX, overlaps } from '../js/vault/hero.js';
import { PD_SPECS, PD_CARDS, pdMap, pdHero, PD_W, PD_H } from '../js/fx/pd-specs.js';

const flags = (game, uid) => (extractMatch(game).rows[uid] || {}).f || {};
/** a PRISM final (the fixture), its results tweaked per player */
const prism = (uids, opts, tweak = {}) => {
  const g = finalGame('prism', uids, opts);
  for (const [u, x] of Object.entries(tweak)) g.results[u] = { ...g.results[u], ...x };
  return g;
};

test('FIRST KO — firstko: a BATTLE KO, credited in the room\'s own record (2+ players)', () => {
  const g = prism(['a', 'b', 'c']);
  assert.equal(flags(g, 'a').firstko, 1, 'the winner knocked out both');
  assert.ok(!flags(g, 'b').firstko, 'no KO, no flag');
  assert.ok(!flags(prism(['a', 'b'], { mode: 'rush' }, { a: { ko: 2 } }), 'a').firstko, 'SCORE RUSH: a KO count there is never a KO');
  const fake = prism(['a', 'b', 'c'], {}, { b: { ko: 1 } });
  assert.ok(!flags(fake, 'b').firstko, 'a KO count with no elimination by them in game.out = no flag');
  assert.ok(!flags(prism(['a', 'b'], {}, { a: { ko: 9 } }), 'a').firstko, 'more KOs than opponents = no flag');
  const surv = prism(['a', 'b']); surv.settings.mode = 'survival';
  assert.ok(!flags(surv, 'a').firstko, 'SURVIVAL has no KOs');
});

test('PERFECT CLEAR — pc: ≥ 1 perfect clear, any mode; never more perfect clears than lines', () => {
  assert.equal(flags(prism(['a', 'b'], {}, { b: { pc: 1 } }), 'b').pc, 1, 'BATTLE, the loser too');
  assert.equal(flags(prism(['a', 'b'], { mode: 'rush' }, { a: { pc: 2 } }), 'a').pc, 1, 'SCORE RUSH');
  assert.ok(!flags(prism(['a', 'b'], {}, { a: { pc: 0 } }), 'a').pc, 'none');
  assert.ok(!flags(prism(['a', 'b'], {}, { a: { pc: 3, ln: 2 } }), 'a').pc, 'more perfect clears than lines = no flag');
  // (the solo lane hands its rows' flags to the award engine — a solo SCORE RUSH perfect clear counts)
  const solo = prism(['a'], { mode: 'rush' }, { a: { pc: 1 } });
  assert.equal(flags(solo, 'a').pc, 1, 'a solo run');
  const r = matchStep(null, { key: 'S_pc', gid: 'prism', row: extractMatch(solo).rows.a, n: 1, now: T0 });
  assert.ok(r.items.includes('card-perfect-clear'), 'the solo lane awards it');
});

test('COMEBACK — comeback: WON a BATTLE (2+) after reaching the danger zone; never COMEBACK KID', () => {
  assert.equal(flags(prism(['a', 'b'], {}, { a: { dz: 1 } }), 'a').comeback, 1, 'the winner, from the danger zone');
  assert.ok(!flags(prism(['a', 'b'], {}, { b: { dz: 1 } }), 'b').comeback, 'dz without the win');
  assert.ok(!flags(prism(['a', 'b']), 'a').comeback, 'the win without dz');
  assert.ok(!flags(prism(['a', 'b'], { mode: 'rush' }, { a: { dz: 1 } }), 'a').comeback, 'SCORE RUSH');
  const solo = prism(['a'], {}, { a: { dz: 1 } }); solo.settings.mode = 'survival'; delete solo.winner;
  assert.ok(!flags(solo, 'a').comeback, 'a solo "win" is never a win');
  const other = prism(['a', 'b'], {}, { a: { dz: 1 } }); other.winner = 'b';
  assert.ok(!flags(other, 'a').comeback, 'the room\'s record names another winner');
  const row = extractMatch(prism(['a', 'b'], {}, { a: { dz: 1 } })).rows.a;
  const s = matchStep(null, { key: 'ROOM_cb', gid: 'prism', row, n: 2, now: T0 });
  assert.ok(s.ach.includes('comeback') && s.items.includes('card-comeback'));
  assert.ok(!s.ach.includes('comeback-kid'), 'PRISM\'s danger-zone win is not OVERCLOCK\'s COMEBACK KID');
  assert.ok(!(s.next.pa.gf || {}).comeback, 'the generic flag stays OVERCLOCK\'s');
});

test('the achievements award the cards (tiers, lines, the game\'s list); ONE unlock however often the match is reported', () => {
  assert.deepEqual(GAME_ACHIEVEMENTS.prism, ['four-on-the-floor', 'first-ko', 'perfect-clear', 'comeback']);
  for (const [a, card, tier] of [['first-ko', 'card-first-ko', 'common'], ['perfect-clear', 'card-perfect-clear', 'rare'], ['comeback', 'card-comeback', 'epic']]) {
    assert.equal(ACH[a].item, card); assert.equal(ITEM[card].tier, tier); assert.ok(ITEM[card].line.length > 10);
  }
  const g = prism(['a', 'b', 'c'], {}, { a: { pc: 1, dz: 1 } });
  const row = extractMatch(g).rows.a;
  const r1 = matchStep(null, { key: `ROOM_${g.matchId}`, gid: 'prism', row, n: 3, now: T0 });
  for (const c of ['card-first-ko', 'card-perfect-clear', 'card-comeback']) assert.ok(r1.items.includes(c), c);
  assert.equal(matchStep(r1.next, { key: `ROOM_${g.matchId}`, gid: 'prism', row, n: 3, now: T0 + 60e3 }).skip, 'counted');
  const r2 = matchStep(r1.next, { key: 'ROOM_again', gid: 'prism', row, n: 3, now: T0 + 30 * 60e3 });
  assert.deepEqual(r2.items.filter(c => /card-(first-ko|perfect-clear|comeback)/.test(c)), [], 'a second time grants nothing new');
  // (the keys the server writes stay database-safe — no dots)
  assert.deepEqual(Object.keys(r1.next.pa.gf).filter(k => /[.#$/[\]]/.test(k)), []);
});

test('the cards\' wiring: the lab (strip + full card, NEW), the lab text, the hero-spot rule, the words never used', async () => {
  for (const id of PD_CARDS) for (const lid of [id, `full-${id}`]) {
    const x = LAB.find(l => l.id === lid); assert.ok(x, lid); assert.equal(x.tier, ITEM[id].tier, `${lid}: its tier`);
    assert.ok(LAB_TEXT[lid] && LAB_TEXT[lid].motion.length > 40, `${lid}: its lab text`);
    // (THE LAB 2.0: a NEW item is version 1 with no change line — it waits in NEEDS YOU as NEW until Ben marks it)
    assert.equal(verOf(lid), 1, `${lid}: v1`); assert.ok(!LAB_CHANGES[lid], `${lid}: no change line yet`); assert.equal(labStatus(lid, null), 'new');
    assert.ok(HERO[id], `${id}: a hero box`);
  }
  assert.deepEqual(heroMisses(), []);
  const { readFileSync } = await import('node:fs');
  for (const f of ['js/fx/pd-cards.js', 'js/fx/pd-specs.js', 'api/_lib/lab-text.js', 'api/_lib/catalog.js']) {
    assert.ok(!/tetris|tetromino|t-spin/i.test(readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')), `${f}: never the banned words`);
  }
});

test('THE SLIM-CARD LONG-NAME STANDARD: every strip\'s hero centred 0.75–0.85 across, clear of the gem; the full card\'s hero right of the name', () => {
  for (const id of PD_CARDS) {
    const [b] = HERO[id], cx = b[0] + b[2] / 2;
    assert.ok(cx >= 0.75 && cx <= 0.85, `${id}: its hero centred at ${cx.toFixed(3)}`);
    assert.ok(cx >= HERO_BAND[0] && cx <= HERO_BAND[1]);
    assert.ok(!overlaps(b, GEM_BOX), `${id}: clear of the gem`);
    // the full card (390 × 246 — the card's own ratio): the hero starts past the left 45 % (the name's side)
    const M = pdMap(390, 246, true), [x] = pdHero(id, true);
    assert.ok(M.ox + x * M.k > 390 * 0.45, `${id}: the full card's hero right of the name`);
  }
  assert.equal(PD_W / PD_H > 1.4, true);
  assert.ok(Object.keys(PD_SPECS).every(id => PD_CARDS.includes(id)));
});

test('the cards keep the night\'s colour families (pd-specs PD_COL = games/prism/neon.js NEON_BASE), the spectrum = the seven by hue', async () => {
  const { NEON_BASE } = await import('../js/games/prism/neon.js');
  const { PD_COL, SPECTRUM } = await import('../js/fx/pd-specs.js');
  assert.deepEqual(PD_COL.slice(1), NEON_BASE.slice(1, 8));
  assert.equal(new Set(SPECTRUM).size, 7);
});
