// SHELL 2.0 B1 — the owner's SHELL 2.0 A fixes + the contract + the solo lane (docs/harbor/passes/shell-b1.md). Pure checks; the
// browser halves live in the harbor suite (shell, sheetstack, roomfix, radio, progress) + the games' E2Es.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

// ---- THE RACING CLOUDS (the owner, 8:26 am: last night's tab reopened → the clouds flew): a page open 10 h, the mean wind eases to a
//      new value → every cloud's ON-SCREEN speed stays in the normal range (≤ its speed at the faster wind), and it never jumps
test('THE RACING CLOUDS: 10 hours open, the wind eases 3 → 9 m/s → every cloud moves at its normal speed, never flung', async () => {
  const { cloudDrift, driftAt, driftSpeed } = await import('../js/core/harbor-clouds.js');
  const drift = cloudDrift(), W = 402;
  const d = { x0: 40, w: 160, v: 1.1 };
  const windAt = t => { const t1 = 36000, t2 = 36000 + 90; return t < t1 ? 3 : t > t2 ? 9 : 3 + 6 * (t - t1) / (t2 - t1); };
  let worst = 0, prev = null;
  for (let t = 35900; t < 36300; t += 1 / 30) {
    const x = d.x0 + d.w * 1.04 + d.v * drift.dist(t, windAt(t), 1);     // (unwrapped — the wrap would hide a jump)
    if (prev != null) worst = Math.max(worst, Math.abs(x - prev) * 30);
    prev = x;
    void driftAt;
  }
  const cap = driftSpeed(9) * d.v * 1.001;
  assert.ok(worst <= cap, `the on-screen speed peaked at ${worst.toFixed(2)} pt/s (the fastest normal: ${cap.toFixed(2)})`);
  // (the old formula — x0 + speed × the clock — on the same easing: hundreds of pt/s; proves the test sees the bug)
  let old = 0, po = null;
  for (let t = 35900; t < 36300; t += 1 / 30) { const x = d.v * driftSpeed(windAt(t)) * t; if (po != null) old = Math.max(old, Math.abs(x - po) * 30); po = x; }
  assert.ok(old > 50 * cap, `the old speed × clock flew at ${old.toFixed(0)} pt/s`);
});

test('THE PHASE: the first sight = the clock\'s own formula (phones agree), continuous across a change, starts over when the clock runs back', async () => {
  const { phaseClock } = await import('../js/core/harbor-phase.js');
  const a = phaseClock(), b = phaseClock();
  assert.equal(a.at(1000, 2), 2000); assert.equal(b.at(1000, 2), 2000);
  assert.equal(a.at(1010, 2), 2020);
  assert.equal(a.at(1010, 5), 2020, 'a new speed keeps the position');
  assert.equal(a.at(1012, 5), 2030);
  assert.equal(a.at(1012, 5), 2030, 'the same t + speed twice = the same answer (four draw passes a frame)');
  assert.equal(a.at(10, 5), 50, 'a new block (the clock went back): the clock formula again');
});

test('every speed × clock drift in the city goes through the phase (clouds + deck, the water\'s wavelets, the fog\'s wisps)', () => {
  const c = read('js/screens/harbor/clouds.js'), w = read('js/screens/harbor/water.js'), f = read('js/screens/harbor/waterfog.js');
  assert.match(c, /const drift = cloudDrift\(\)/); assert.doesNotMatch(c, /driftSpeed\(wind\) \* wx \* d\.v \* \(motion \? tSec/); assert.doesNotMatch(c, /driftX\(d, motion \? tSec/);
  assert.match(w, /ph1\.at\(t, 3 \+ 9 \* rough\)/); assert.doesNotMatch(w, /t \* \(3 \+ 9 \* rough\)/);
  assert.match(f, /ph\.at\(s\.t, v\)/); assert.doesNotMatch(f, /tt \* v \* sp/);
});

// ---- THE CONTRACT — the kit's READY helper + the room-night path (the Overclock chat's asks a + b)
test('THE READY HELPER: connected players only, a min time, a dropped player never blocks, a max time moves on, nobody connected → goes', async () => {
  const { readyState } = await import('../js/games/kit/ready.js');
  const players = ['a', 'b', 'c'], on = { a: true, b: true, c: true };
  assert.equal(readyState({ taps: { a: 1, b: 1, c: 1 }, players, online: on, since: 0, now: 500, minMs: 1500 }).ready, false, 'held by the min time');
  assert.deepEqual(readyState({ taps: { a: 1, b: 1, c: 1 }, players, online: on, since: 0, now: 1600 }), { ready: true, n: 3, of: 3, waiting: [], why: 'all' });
  const w = readyState({ taps: { a: 1 }, players, online: on, since: 0, now: 5000 });
  assert.equal(w.ready, false); assert.deepEqual(w.waiting, ['b', 'c']);
  assert.equal(readyState({ taps: { a: 1, b: 1 }, players, online: { a: true, b: true, c: false }, since: 0, now: 2000 }).ready, true, 'C dropped: never blocks');
  assert.equal(readyState({ taps: {}, players, online: on, since: 0, now: 9000, maxMs: 8000 }).why, 'time');
  assert.equal(readyState({ taps: {}, players, online: () => false, since: 0, now: 2000 }).why, 'nobody');
  assert.equal(readyState({ taps: { a: false }, players: ['a'], online: on, since: 0, now: 2000 }).ready, false, 'a false tap is no tap');
  const r1 = readyState({ taps: { a: 1 }, players: { a: true, b: true }, online: u => u === 'a', since: 10, now: 2000 });
  assert.deepEqual(r1, readyState({ taps: { a: 1 }, players: { a: true, b: true }, online: u => u === 'a', since: 10, now: 2000 }), 'pure: the same in, the same out');
});
test('THE ROOM-NIGHT PATH: meta/used/<game>/<key> — game-scoped, database-safe keys, the rules already allow a boolean there', async () => {
  const { usedOf, markUsed, cleanKey } = await import('../js/games/kit/night.js');
  assert.deepEqual(markUsed('overclock', ['q1', 'a.b/c']), { 'meta/used/overclock/q1': true, 'meta/used/overclock/a_b_c': true });
  assert.deepEqual(usedOf({ used: { overclock: { q1: true } } }, 'overclock'), { q1: true });
  assert.deepEqual(usedOf({}, 'prism'), {}); assert.equal(cleanKey('#$[]'), '____');
  const rules = JSON.parse(read('database.rules.json'));
  const used = rules.rules.rooms.$code.meta.used;
  assert.ok(used && used.$game && used.$game.$id && /isBoolean/.test(used.$game.$id['.validate']), 'rooms/$code/meta/used/$game/$id: a boolean');
});
test('MUSIC BY MOOD: a cartridge may say MUSIC: "mood:<mood>" — every mood has a station provider; a fallback while the decks load', () => {
  const app = read('js/app.js'), pm = read('js/audio/party-music.js');
  assert.match(app, /for \(const md of MOODS\) setListProvider\(`mood:\$\{md\}`/);
  assert.match(app, /track\.startsWith\('mood:'\) \? 'menu'/);
  assert.match(pm, /export function stationCue\(mood, prev = null\)/);
});

// ---- THE SOLO LANE (D3 — the owner, Nov 5 6:56 am): a room of ONE counts for a SOLO cartridge — the STREAK + a SMALL, CAPPED XP; never a
//      win / a placing / night points; its records on the solo boards; credited once
test('THE SOLO LANE (the server): a SOLO cartridge alone counts — no win, no placing, its record on the SOLO board; a non-solo game alone does not', async () => {
  const { finalGame } = await import('./fixtures/finals.mjs');
  const { extractMatch, unreportable, SOLO_OK } = await import('../js/core/match-report.js');
  assert.deepEqual(SOLO_OK, { overclock: true, prism: true });   // (PD-2: PRISM DROP's SCORE RUSH + SURVIVAL went solo)
  const oc = finalGame('overclock', ['solo1']);
  assert.equal(unreportable(oc), null, 'OVERCLOCK alone is reportable');
  const ex = extractMatch(oc);
  assert.equal(ex.solo, true); assert.equal(ex.n, 1);
  const r = ex.rows.solo1;
  assert.equal(r.win, false, 'never a win'); assert.equal(r.solo, true); assert.ok(!r.c.w, 'no win counter');
  assert.ok(!('overclock-std' in r.rec), 'never the multiplayer board');
  for (const b of Object.keys(r.rec)) assert.match(b, /-solo$/);
  assert.equal(unreportable(finalGame('prism', ['solo1'])), null, 'PRISM DROP alone is reportable (PD-2)');
  assert.equal(unreportable(finalGame('gridlock', ['solo1'])), 'too few players', 'a non-solo game alone is not');
  assert.equal(unreportable({ ...oc, participants: {} }), 'too few players');
  const two = extractMatch(finalGame('overclock', ['a', 'b']));
  assert.equal(two.solo, false); assert.ok(Object.values(two.rows).some(x => x.win), 'two players: a winner as before');
});
test('THE SOLO LANE (the XP): small (less than a LOST multiplayer match), capped a day, the streak still counts, credited once', async () => {
  const { matchStep } = await import('../js/core/progress.js');
  const { XP, SOLO_XP, SOLO_DAY_XP } = await import('../js/core/ranks.js');
  const { T0 } = await import('./fixtures/finals.mjs');
  assert.ok(SOLO_XP < XP.played, 'a solo run pays less than the least a lost multiplayer match pays');
  const row = { rank: 1, win: false, solo: true, c: { p: 1 }, rec: {} };
  let s = null, total = 0; const got = [];
  for (let i = 0; i < SOLO_DAY_XP + 2; i++) {
    const r = matchStep(s, { key: `S_${i}`, gid: 'overclock', row, n: 1, now: T0 + i * 10 * 60e3 });
    assert.ok(!r.skip, r.skip); s = r.next; total += r.xp.total; got.push(r.xp.total);
    assert.ok(r.xp.parts.every(p => p.k === 'solo'), 'no win / place / PB / new-game / goal XP');
    assert.ok(r.streak.n >= 1, 'the streak counts');
  }
  assert.deepEqual(got, [...Array(SOLO_DAY_XP).fill(SOLO_XP), 0, 0], 'capped a day');
  assert.equal(total, SOLO_XP * SOLO_DAY_XP);
  assert.equal(matchStep(s, { key: 'S_0', gid: 'overclock', row, n: 1, now: T0 + 3e6 }).skip, 'counted', 'credited once');
  const lost = matchStep(null, { key: 'M_1', gid: 'overclock', row: { rank: 2, win: false, c: { p: 1 }, rec: {} }, n: 2, now: T0 });
  assert.ok(lost.xp.total > SOLO_XP, `a lost 2-player match (${lost.xp.total}) out-earns a solo run (${SOLO_XP})`);
  // the next day: the cap resets
  const nd = matchStep(s, { key: 'S_next', gid: 'overclock', row, n: 1, now: T0 + 26 * 3600e3 });
  assert.equal(nd.xp.total, SOLO_XP);
});
test('THE SOLO LANE (the room): the host writes 0 night points for a room of one (no banner, no champion); the server expects 0', () => {
  const host = read('js/host.js'), rep = read('api/report.js');
  // (HOLD'EM IN THE CITY — B4: the host + the server through the ONE rule — core/night.js#nightPoints: a solo run 0, a full tie a draw)
  assert.match(host, /nightPoints\(ranks, \{ solo \}\)/);
  assert.match(host, /mod\.nightBonus && !solo/);
  assert.match(rep, /nightPoints\(ranks, \{ solo: ex\.solo \}\)/);
});

// ---- THE ROOM's LOOK SWITCH → SHELL 2.0 B2's GAME LOOK (a Settings row, no lock): tests/shell-b2.test.mjs
// ---- COLOUR-BLIND (the dailies chat): one row → body[data-cb] swaps the two tokens; OVERCLOCK reads them; on the profile too
test('COLOUR-BLIND: --good / --close in :root, swapped under body[data-cb]; OVERCLOCK right / close read them; the setting + the profile copy', () => {
  const base = read('css/base.css'), oc = read('css/overclock.css');
  assert.match(base, /--good: #3dff8b; --close: #ffd23d;/);
  assert.match(base, /body\[data-cb\] \{ --good: #3ea6ff; --close: #ff8f2e; --bad: #ff8f2e; \}/);
  assert.match(base, /--bad: #ff5468;/);   // (HE5: a loss / down — HOLD'EM's ledger; the colour-blind set swaps it too)
  for (const l of oc.split('\n').filter(l => /is-right|is-correct|is-ok\b/.test(l))) assert.doesNotMatch(l, /var\(--green\)|61, 255, 139/, `still its own green: ${l.slice(0, 80)}`);
  assert.match(oc, /\.oc-qc-close \{[^}]*border: 2px solid var\(--close\)/);   // (OC4: QUICK COUNT's off-by-one tile)
  assert.match(read('js/ui/settings-panel.js'), /toggle\('Colour-blind colours', 'colorBlind'\)/);
  assert.match(read('js/audio/settings.js'), /colorBlind: false/);
  assert.match(read('js/ui/colorblind.js'), /document\.body\.dataset\.cb = '1'/);
  assert.match(read('api/profile.js'), /case 'prefs':/); assert.match(read('api/_lib/profiles.js'), /ppriv\/\$\{pid\}\/cb/);
});
