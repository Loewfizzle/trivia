// THE 32 ACHIEVEMENTS + THE AWARD ENGINE (PROGRESSION A): every check (the dormant ones — sightings, dailies, the birthday — with a FAKE
// trigger), the engine's idempotence (a replayed match / event never awards twice), FOUNDER, the game contract, the carry-over.
import '../api/_lib/catalog.js';   // (THE VAULT 1B: the server-only catalog — names, rewards, achievements)
import test from 'node:test';
import assert from 'node:assert/strict';
import { ACHIEVEMENTS, ACH, GAME_ACHIEVEMENTS, LEGENDARIES, noteMatch, noteEvent, awardAll, heldOf } from '../js/core/achievements.js';
import { ITEM } from '../js/core/items.js';
import { matchStep, dailyStep, eventStep, carryOver } from '../js/core/progress.js';
import { dayOf, dayNum } from '../js/core/streak.js';

const T0 = Date.UTC(2026, 10, 11, 1, 0);   // Tue Nov 10, 8 pm Eastern
const H = 3600e3, DAY = 864e5;
const row = (rank, n, f) => ({ rank, win: rank === 1, c: { p: 1, ...(rank === 1 ? { w: 1 } : {}) }, rec: {}, ...(f ? { f } : {}) });
let K = 0;
/** one counted match on the real step → { s, r } */
const play = (s, { at = T0, gid = 'prism', rank = 2, n = 4, f, ctx = {} } = {}) => { const r = matchStep(s, { key: `R_${K++}`, gid, row: row(rank, n, f), n, now: at, ctx }); assert.ok(!r.skip, r.skip); return { s: r.next, r }; };
const has = (s, id) => !!(s.ac && s.ac[id]);

test('thirty-two of them (OVERCLOCK CARDS added REDLINE + PHOTO FINISH; PW2 KEYHOLE + SAFECRACKER), the owner\'s names, every one unlocking a real item, ids unique', () => {
  assert.equal(ACHIEVEMENTS.length, 37, '32 + the HORSESHOE (OC5) + KEYHOLE + SAFECRACKER (PW2) + LIGHTHOUSE + GHOST RUN (CC2)');
  assert.equal(new Set(ACHIEVEMENTS.map(a => a.id)).size, 37);
  for (const a of ACHIEVEMENTS) { assert.ok(ITEM[a.item], `${a.id} → ${a.item}`); assert.ok(a.name && a.line); }
  assert.deepEqual(ACHIEVEMENTS.slice(0, 13).map(a => a.name), ['FIRST ROUND', 'HOUSE WARMING', 'FULL HOUSE', 'THE REGULAR', 'TOP SHELF', 'MADE MAN', 'KINGPIN', 'THE HOST', 'COMEBACK KID', 'LAST CALL', 'PARTY ANIMAL', 'NIGHT OWL', 'THE CREW']);
  assert.equal(ACH['kingpin'].item, 'card-marquee-gold'); assert.equal(ACH['the-host'].item, 'card-marquee');
  assert.deepEqual(GAME_ACHIEVEMENTS, { prism: ['four-on-the-floor'], overclock: ['dead-on', 'overclocked', 'redline', 'photo-finish', 'horseshoe'], password: ['keyhole', 'safecracker'], coastclear: ['lighthouse', 'ghost-run'] });
});

test('PLAYING: first round, hosting, full house, the regular, the wins, last call, party animal, night owl, the crew', () => {
  let { s, r } = play(null, { ctx: { hosted: true, roomKey: 'ABCD_1' } });
  assert.ok(has(s, 'first-round') && has(s, 'house-warming'));
  assert.ok(r.items.includes('glow-ember') && r.items.includes('emb-key'));
  assert.ok(!has(s, 'full-house'));
  ({ s } = play(s, { at: T0 + 10 * 60e3, n: 8 })); assert.ok(has(s, 'full-house'));
  // THE HOST: 25 ROOMS (not matches) of 4+
  let h = null; for (let i = 0; i < 30; i++) ({ s: h } = play(h, { at: T0 + i * 60e3, ctx: { hosted: true, roomKey: 'SAME_1' } }));
  assert.equal(h.pa.h4, 1, 'one room, however many matches');
  for (let i = 0; i < 25; i++) ({ s: h } = play(h, { at: T0 + (40 + i) * 60e3, ctx: { hosted: true, roomKey: `ROOM_${i}` } }));
  assert.ok(has(h, 'the-host'));
  // THE REGULAR: 10 different nights; HODL: 21 in a row
  let n = null; for (let d = 0; d < 21; d++) ({ s: n } = play(n, { at: T0 + d * DAY }));
  assert.ok(has(n, 'the-regular') && has(n, 'hodl'));
  // the wins: 10 · 50 · 250
  let w = null; for (let i = 0; i < 250; i++) ({ s: w } = play(w, { at: T0 + i * 60e3, rank: 1 }));
  assert.ok(has(w, 'top-shelf') && has(w, 'made-man') && has(w, 'kingpin'));
  // LAST CALL: last 10 times
  let l = null; for (let i = 0; i < 10; i++) ({ s: l } = play(l, { at: T0 + i * 60e3, rank: 4, n: 4 }));
  assert.ok(has(l, 'last-call'));
  // PARTY ANIMAL: 5 on ONE party night (Fri / Sat)
  let p = null; for (let i = 0; i < 4; i++) ({ s: p } = play(p, { at: T0 + i * 60e3, ctx: { party: true } }));
  ({ s: p } = play(p, { at: T0 + DAY, ctx: { party: true } }));
  assert.ok(!has(p, 'party-animal'), 'four, then another night');
  for (let i = 1; i < 5; i++) ({ s: p } = play(p, { at: T0 + DAY + i * 60e3, ctx: { party: true } }));
  assert.ok(has(p, 'party-animal'));
  // NIGHT OWL: 2–4 am Eastern
  assert.ok(has(play(null, { ctx: { hourET: 2 } }).s, 'night-owl'));
  assert.ok(!has(play(null, { ctx: { hourET: 4 } }).s, 'night-owl'));
  // THE CREW: the same friend on 10 different nights
  let c = null; for (let d = 0; d < 10; d++) { ({ s: c } = play(c, { at: T0 + d * DAY, ctx: { friends: ['pFRIEND'] } })); ({ s: c } = play(c, { at: T0 + d * DAY + 60e3, ctx: { friends: ['pFRIEND'] } })); }
  assert.equal(c.pa.fr.pFRIEND[0], 10); assert.ok(has(c, 'the-crew'));
});

test('THE CITY: the knock, the watcher, the real weather (events) — and a second time is nothing', () => {
  let r = eventStep(null, { k: 'knock' }, T0);
  assert.deepEqual(r.ach, ['knock-knock']); assert.deepEqual(r.items, ['emb-peephole']);
  assert.equal(eventStep(r.next, { k: 'knock' }, T0 + 1), null, 'idempotent');
  assert.deepEqual(eventStep(null, { k: 'watch' }, T0).ach, ['patience-pays']);
  assert.deepEqual(eventStep(null, { k: 'storm' }, T0).ach, ['rainmaker']);
  assert.deepEqual(eventStep(null, { k: 'snow' }, T0).ach, ['snowed-in']);
  assert.equal(eventStep(null, { k: 'nonsense' }, T0), null);
});

test('SIGHTINGS (dormant until PROGRESSION B) — a fake trigger: stargazer · frequent flyer · the witness', () => {
  let s = null, all = [];
  for (let i = 0; i < 25; i++) { const r = eventStep(s, { k: 'sighting', id: LEGENDARIES[i % LEGENDARIES.length] }, T0 + i); s = r.next; all.push(...r.ach); }
  assert.deepEqual(all, ['stargazer', 'the-witness', 'frequent-flyer']);
  assert.equal(eventStep(null, { k: 'sighting', id: 'not-a-legend' }, T0), null);
  assert.ok(ACH['stargazer'].dormant === 'sightings');
});

test('DAILIES (dormant until the first daily) — the contract\'s step: daily bread · the triple · early bird · penthouse suite', () => {
  let s = null; const got = [];
  for (let d = 0; d < 7; d++) { const r = dailyStep(s, { game: 'a', day: dayOf(dayNum('d20261110') + d), now: T0 + d * DAY, hourET: d === 3 ? 6 : 20 }); s = r.next; got.push(...r.ach); }
  assert.ok(got.includes('daily-bread') && got.includes('early-bird'));
  let t = null; for (const g of ['a', 'b', 'c']) { const r = dailyStep(t, { game: g, day: 'd20261110', now: T0 }); t = r.next; if (g === 'c') assert.ok(r.ach.includes('the-triple')); }
  assert.ok(dailyStep(null, { game: 'a', day: 'd20261110', now: T0, top: 1, n: 60 }).ach.includes('penthouse-suite'));
  assert.ok(!dailyStep(null, { game: 'a', day: 'd20261110', now: T0, top: 1, n: 49 }).ach.includes('penthouse-suite'));
});

test('PW2 — THE PASSWORD\'s rewards through the daily step: KEYHOLE on any crack, SAFECRACKER at the threshold (the flags from the SERVER\'s record), never twice, nothing without a flag', () => {
  // a crack in 7: KEYHOLE only (the emblem granted); the card not
  let r = dailyStep(null, { game: 'password', day: 'd20261110', now: T0, flags: { crack: 1 } });
  assert.deepEqual(r.ach, ['keyhole']); assert.ok(r.items.includes('emb-keyhole') && !r.items.includes('card-safecracker'));
  assert.equal(r.next.pa.gf['password-crack'], 1);
  // the next night, both in 6: SAFECRACKER (the card) — KEYHOLE held already, not again
  r = dailyStep(r.next, { game: 'password', day: 'd20261111', now: T0 + DAY, flags: { crack: 1, safe: 1 } });
  assert.deepEqual(r.ach, ['safecracker']); assert.ok(r.items.includes('card-safecracker') && !r.items.includes('emb-keyhole'));
  // a third crack in 6: nothing new (idempotent); a replay of the same day: skipped
  const r3 = dailyStep(r.next, { game: 'password', day: 'd20261112', now: T0 + 2 * DAY, flags: { crack: 1, safe: 1 } });
  assert.deepEqual(r3.ach, []); assert.ok(!r3.items.includes('card-safecracker'));
  assert.equal(dailyStep(r3.next, { game: 'password', day: 'd20261112', now: T0 + 2 * DAY + 1, flags: { crack: 1, safe: 1 } }).skip, 'counted');
  // a held door (no flags) → nothing; another game's 'crack' flag is not THE PASSWORD's
  assert.deepEqual(dailyStep(null, { game: 'password', day: 'd20261110', now: T0, flags: null }).ach, []);
  assert.deepEqual(dailyStep(null, { game: 'test', day: 'd20261110', now: T0, flags: { crack: 1, safe: 1 } }).ach, []);
  assert.ok(Object.keys(dailyStep(null, { game: 'password', day: 'd20261110', now: T0, flags: { crack: 1 } }).next.pa.gf).every(k => !k.includes('.')), 'no dot in a database key');
});

test('SPECIALS: many happy returns (a fake birthday trigger — PROGRESSION B), season\'s greetings (3 holidays)', () => {
  assert.deepEqual(eventStep(null, { k: 'birthday' }, T0).ach, ['many-happy-returns']);
  let s = null;
  for (const [i, hol] of ['halloween', 'thanksgiving', 'christmas'].entries()) ({ s } = play(s, { at: T0 + i * DAY, ctx: { holiday: hol } }));
  assert.ok(has(s, 'seasons-greetings'));
});

test('GAME-SPECIFIC: the flags a game\'s report sets — four on the floor, dead on, comeback kid; overclocked', () => {
  assert.ok(has(play(null, { gid: 'prism', f: { quad: 1 } }).s, 'four-on-the-floor'));
  assert.ok(!has(play(null, { gid: 'overclock', f: { quad: 1 } }).s, 'four-on-the-floor'), 'a flag is per game');
  assert.ok(has(play(null, { gid: 'overclock', f: { exact: 1 } }).s, 'dead-on'));
  assert.ok(has(play(null, { gid: 'overclock', rank: 1, f: { comeback: 1 } }).s, 'comeback-kid'));
  let o = null; for (let i = 0; i < 10; i++) ({ s: o } = play(o, { gid: 'overclock', rank: 1, at: T0 + i * 60e3 }));
  assert.ok(has(o, 'overclocked'));
});

test('THE ENGINE: idempotent (a replayed report is skipped, nothing awarded twice), FOUNDER while the window is open', () => {
  const a = matchStep(null, { key: 'X_1', gid: 'prism', row: row(1, 4), n: 4, now: T0, ctx: { founderOpen: true } });
  assert.ok(a.items.includes('card-founder')); assert.equal(a.next.fd, 1);
  assert.equal(matchStep(a.next, { key: 'X_1', gid: 'prism', row: row(1, 4), n: 4, now: T0 + 60e3, ctx: { founderOpen: true } }).skip, 'counted');
  const b = matchStep(a.next, { key: 'X_2', gid: 'prism', row: row(1, 4), n: 4, now: T0 + 60e3, ctx: { founderOpen: true } });
  assert.ok(!b.items.includes('card-founder') && !b.ach.includes('first-round'), 'held things are never granted again');
  assert.ok(!matchStep(null, { key: 'X_3', gid: 'prism', row: row(1, 4), n: 4, now: T0, ctx: { founderOpen: false } }).items.includes('card-founder'), 'closed: no founder');
  // awardAll on its own: nothing new → nothing
  const again = awardAll({ ...b.next }, T0 + 2);
  assert.deepEqual(again, { ach: [], items: [] });
  assert.deepEqual(heldOf(b.next.ac).map(x => x.id).slice(-1), ['first-round']);
});

test('THE CARRY-OVER: a profile from before PROGRESSION A gets what its stats already prove (+ FOUNDER while open)', () => {
  const old = { xp: 9000, g: { prism: { p: 120, w: 55 }, overclock: { p: 20, w: 12 } }, st: { n: 22, d: 'd20261101' } };
  const c = carryOver(old, T0, { founderOpen: true });
  for (const id of ['first-round', 'top-shelf', 'made-man', 'overclocked', 'hodl']) assert.ok(c.ach.includes(id), id);
  assert.ok(!c.ach.includes('kingpin'));
  assert.ok(c.items.includes('card-founder') && c.items.includes('card-marble') && c.items.includes('card-rosegold'));
  assert.equal(carryOver(c.next, T0 + 1, { founderOpen: true }), null, 'twice: nothing');
});

test('noteMatch / noteEvent are pure (the inputs never change)', () => {
  const pa = Object.freeze({ nt: 1, nd: 'd20261101', fr: Object.freeze({}) });
  const p = noteMatch(pa, { gid: 'prism', rank: 4, n: 4, night: 'd20261102', friends: ['a'] });
  assert.equal(p.nt, 2); assert.equal(p.lc, 1); assert.equal(pa.nt, 1);
  assert.equal(noteEvent(Object.freeze({ kn: 1 }), { k: 'knock' }), null);
});
