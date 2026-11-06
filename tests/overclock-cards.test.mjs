// OVERCLOCK CARDS (Nov 5 night): REDLINE + PHOTO FINISH — the flags from the room's OWN record (core/match-report.js#overclockExtra), the
// achievements that award the cards (server catalog), one unlock however often a match is reported, the cards' wiring (the lab, the looks,
// the CSS crop = the effect's), THE HERO-SPOT RULE, REDLINE's needle (rest → the slam → the shake; the still frame pegged) — + the owner's
// ADD-ON: a SOLO run never counts as hosting a room.
import '../api/_lib/catalog.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractMatch } from '../js/core/match-report.js';
import { matchStep } from '../js/core/progress.js';
import { ACH, GAME_ACHIEVEMENTS, noteMatch } from '../js/core/achievements.js';
import { ITEM } from '../js/core/items.js';
import { finalGame, T0 } from './fixtures/finals.mjs';
import { LAB } from '../js/vault/catalog.js';
import { LAB_TEXT } from '../api/_lib/lab-text.js';
import { OC_SPECS } from '../js/fx/oc-specs.js';
import { HERO, heroMisses } from '../js/vault/hero.js';
import { CREDITS } from '../js/ui/credits.js';

/** an OVERCLOCK final: pts[ci] = { uid: points } */
const oc = (mode, pts, parts = Object.keys(pts[0] || {})) => ({
  id: 'overclock', matchId: `m${Math.random().toString(36).slice(2, 8)}`, phase: 'final', phaseStartAt: T0, participants: Object.fromEntries(parts.map(u => [u, true])),
  settings: { mode }, total: { quick: 6, standard: 12, marathon: 24 }[mode], order: pts.map(() => 'trivia'),
  results: Object.fromEntries(pts.map((r, ci) => [ci, Object.fromEntries(Object.entries(r).map(([u, p]) => [u, { pts: p, ok: p > 0 ? 1 : 0 }]))])),
});
const six = f => Array.from({ length: 6 }, (_, ci) => f(ci));
const flags = (game, uid) => (extractMatch(game).rows[uid] || {}).f || {};

test('REDLINE — sweep: alone on top of EVERY challenge of a QUICK match (2+ players)', () => {
  assert.equal(flags(oc('quick', six(() => ({ a: 150, b: 130, c: 90 }))), 'a').sweep, 1, '6 / 6 alone');
  assert.equal(flags(finalGame('overclock', ['a', 'b'], { mode: 'quick' }), 'a').sweep, 1, 'the fixture: the winner takes all six');
  assert.ok(!flags(oc('quick', six(ci => (ci === 3 ? { a: 100, b: 140 } : { a: 150, b: 130 }))), 'a').sweep, '5 / 6');
  assert.ok(!flags(oc('quick', six(ci => (ci === 2 ? { a: 120, b: 120 } : { a: 150, b: 130 }))), 'a').sweep, 'a TIED challenge is not won');
  assert.ok(!flags(oc('quick', six(ci => (ci === 1 ? { a: 0, b: 0 } : { a: 150, b: 130 }))), 'a').sweep, 'a challenge nobody scored is not won');
  assert.ok(!flags(oc('standard', Array.from({ length: 12 }, () => ({ a: 150, b: 130 }))), 'a').sweep, 'the STANDARD mode');
  assert.ok(!flags(oc('quick', six(() => ({ a: 150 }))), 'a').sweep, 'SOLO: winning every challenge is automatic');
  const short = oc('quick', six(() => ({ a: 150, b: 130 }))); delete short.results[5];
  assert.ok(!flags(short, 'a').sweep, 'not every challenge played');
  assert.ok(!flags(oc('quick', six(() => ({ a: 150, b: 130 }))), 'b').sweep, 'second place never');
});

test('PHOTO FINISH — photo: the win, ALONE in first, by exactly ONE point (any mode, 2+ players)', () => {
  const by = d => oc('standard', Array.from({ length: 12 }, (_, ci) => (ci === 0 ? { a: 100 + d, b: 100, c: 40 } : { a: 50, b: 50, c: 10 })));
  assert.equal(flags(by(1), 'a').photo, 1, 'by 1');
  assert.ok(!flags(by(1), 'b').photo, 'the runner-up never');
  assert.ok(!flags(by(2), 'a').photo, 'by 2');
  assert.ok(!flags(by(0), 'a').photo && !flags(by(0), 'b').photo, 'tied for first: nobody');
  assert.equal(flags(oc('quick', six(ci => (ci ? { a: 10, b: 10 } : { a: 11, b: 10 }))), 'a').photo, 1, 'the quick mode too');
  assert.ok(!flags(oc('quick', six(() => ({ a: 1 }))), 'a').photo, 'SOLO: no win');
});

test('the achievements award the cards (server catalog), the ids unique; ONE unlock however often the match is reported', () => {
  assert.equal(ACH.redline.item, 'card-redline'); assert.equal(ACH['photo-finish'].item, 'card-photofinish');
  assert.equal(ITEM['card-redline'].tier, 'legendary'); assert.equal(ITEM['card-photofinish'].tier, 'rare');
  assert.equal(ITEM['card-redline'].line, 'Six for six. Pinned in the red.'); assert.equal(ITEM['card-photofinish'].line, 'Won by a nose. One point.');
  assert.deepEqual(GAME_ACHIEVEMENTS.overclock, ['dead-on', 'overclocked', 'redline', 'photo-finish', 'horseshoe']);   // (+ OC5's HORSESHOE)
  const g = oc('quick', six(ci => (ci ? { a: 150, b: 130 } : { a: 131, b: 130 })));   // (a sweep AND a photo? no — a is far ahead: sweep only)
  const row = extractMatch(g).rows.a;
  const r1 = matchStep(null, { key: `ROOM_${g.matchId}`, gid: 'overclock', row, n: 2, now: T0 });
  assert.ok(r1.ach.includes('redline') && r1.items.includes('card-redline'));
  assert.equal(matchStep(r1.next, { key: `ROOM_${g.matchId}`, gid: 'overclock', row, n: 2, now: T0 + 60e3 }).skip, 'counted', 'the same match twice: skipped');
  const r2 = matchStep(r1.next, { key: 'ROOM_other', gid: 'overclock', row, n: 2, now: T0 + 30 * 60e3 });
  assert.ok(!r2.ach.includes('redline') && !r2.items.includes('card-redline'), 'a second sweep grants nothing new');
  const p = extractMatch(oc('standard', Array.from({ length: 12 }, (_, ci) => (ci ? { a: 50, b: 50 } : { a: 61, b: 60 })))).rows.a;
  assert.ok(matchStep(null, { key: 'ROOM_p', gid: 'overclock', row: p, n: 2, now: T0 }).items.includes('card-photofinish'));
});

test('the cards\' wiring: the lab (strip + full card), the lab text, the CSS crop = the effect\'s, the hero-spot rule, the credit', () => {
  for (const id of ['card-redline', 'card-photofinish', 'full-card-redline', 'full-card-photofinish']) { assert.ok(LAB.find(x => x.id === id), id); assert.ok(LAB_TEXT[id] && LAB_TEXT[id].motion.length > 40, `${id}: its lab text`); }
  const css = readFileSync(new URL('../css/vault.css', import.meta.url), 'utf8');
  for (const [id, S] of Object.entries(OC_SPECS)) {
    const m = new RegExp(`\\.vl-s-oc-${S.art} \\.vl-mat \\{ background: #\\w+ url\\('\\.\\./assets/vault/oc/${S.art}\\.webp'\\) (\\d+)% (\\d+)% / cover`).exec(css);
    assert.ok(m, `${id}: its material`); assert.deepEqual([+m[1], +m[2]], S.strip, `${id}: the strip's crop = the effect's`);
    assert.ok(HERO[id], `${id}: a hero box`);
  }
  assert.deepEqual(heroMisses(), []);
  assert.ok(CREDITS.some(c => /Card art created with Grok/.test(c.by)), 'the Grok credit');
});

test('REDLINE\'s needle: rest → faster + faster → the slam past the peg → bounces back into the red + never stops shaking; still = pegged', async () => {
  const { needleAt } = await import('../js/fx/oc-cards.js').catch(() => ({}));
  if (!needleAt) return;   // (a runtime where the fx kit can't load: the browser suite covers it)
  const S = OC_SPECS['card-redline'];
  assert.equal(needleAt(S, 0, 100, false).a, S.rest);
  const a1 = needleAt(S, 0.5, 100, false).a, a2 = needleAt(S, 0.8, 100, false).a;
  assert.ok(a1 > S.rest && a2 > a1 && a2 - a1 > a1 - S.rest, 'it revs up faster + faster');
  assert.ok(Math.abs(needleAt(S, 0.98, 100, false).a - S.over) < 0.5, 'the slam: the overshoot');
  const late = Array.from({ length: 200 }, (_, i) => needleAt(S, 5 + i * 0.013, 5 + i * 0.013, false).a);
  assert.ok(late.every(a => a > S.peg - 9 && a < S.peg + 9), 'pegged in the red');
  assert.ok(Math.max(...late) - Math.min(...late) > 1, 'still shaking');
  assert.deepEqual(needleAt(S, 0, 0, true).a, S.peg, 'reduced motion: the still frame is pegged');
});

test('the ADD-ON — a SOLO run never counts as HOSTING a room (ho / h4 unchanged); a 2-player room does; HOUSE WARMING stays with who has it', () => {
  const solo = noteMatch({}, { gid: 'overclock', rank: 0, win: false, n: 1, night: 'd1', hosted: true, roomKey: 'SOLO_1' });
  assert.equal(solo.ho, undefined); assert.equal(solo.h4, undefined);
  const had = noteMatch({ ho: 3, hk: 'X' }, { gid: 'overclock', rank: 0, win: false, n: 1, night: 'd1', hosted: true, roomKey: 'SOLO_2' });
  assert.equal(had.ho, 3, 'ho unchanged by a solo run');
  assert.equal(noteMatch({}, { gid: 'overclock', rank: 1, win: true, n: 2, night: 'd1', hosted: true, roomKey: 'DUO_1' }).ho, 1);
  const r = matchStep(null, { key: 'S_1', gid: 'overclock', row: { rank: 1, win: false, solo: true, c: { p: 1 }, rec: {} }, n: 1, now: T0, ctx: { hosted: true, roomKey: 'SOLO_3' } });
  assert.ok(!r.ach.includes('house-warming'), 'a solo run: no HOUSE WARMING');
  const kept = matchStep(r.next.ac ? { ...r.next, ac: { ...r.next.ac, 'house-warming': T0 } } : { ...r.next, ac: { 'house-warming': T0 } }, { key: 'S_2', gid: 'overclock', row: { rank: 1, win: false, solo: true, c: { p: 1 }, rec: {} }, n: 1, now: T0 + 60e3, ctx: { hosted: true, roomKey: 'SOLO_4' } });
  assert.ok(kept.next.ac['house-warming'], 'already held: kept');
});

test('THE FLAGS ARE DATABASE-SAFE (found here: the counters kept `overclock.exact` — a dot — and the database refused the whole transaction, so a match that raised ANY game flag was never counted)', () => {
  const bad = []; const walk = (o, at) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (!k || /[.#$/[\]]/.test(k)) bad.push(`${at}/${k}`); walk(v, `${at}/${k}`); } };
  let s = null;
  for (const [gid, f] of [['overclock', { exact: 1, sweep: 1, photo: 1, comeback: 1 }], ['prism', { quad: 1 }]]) {
    const r = matchStep(s, { key: `K_${gid}`, gid, row: { rank: 1, win: true, c: { p: 1, w: 1 }, rec: {}, f }, n: 2, now: T0 + (gid === 'prism' ? 3600e3 : 0) });
    assert.ok(!r.skip, r.skip); s = r.next;
  }
  walk(s, 'pstats'); assert.deepEqual(bad, [], 'every key the server writes from a match');
  for (const id of ['dead-on', 'redline', 'photo-finish', 'four-on-the-floor', 'comeback-kid']) assert.ok(s.ac && s.ac[id], `${id}: awarded from its flag`);
});
