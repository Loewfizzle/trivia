// LOBBY 2.0 B (Nov 4 — docs/harbor/passes/lobby-2b.md): the pure parts + the wiring. THE GAME START + THE WALK BACK OUT on the server clock
// (core/room-show.js), THE LAYER STACK, the stamps in host.js, the rules, the dev pill, RESTORE, the tap area.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startShow, fileInOrder, backShow, bannerAt, walkOutMs, START_MS, PUSH_AT_MS, IN_GAP, OUT_GAP, OUT_LEAD, BANNER_GAP_MS } from '../js/core/room-show.js';

const read = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const P = { h: { joinedAt: 1 }, a: { joinedAt: 2, ln: 'R' }, b: { joinedAt: 3, ln: 'L' }, c: { joinedAt: 4, ln: 'R' } };

test('THE GAME START on the server clock: 2–3 s max, on from the stamp — while the host prepares the match AND once it is written — never for another match', () => {
  assert.ok(START_MS >= 2000 && START_MS <= 3000 && PUSH_AT_MS < START_MS);
  const go = { at: 10000, m: 'abc', g: 'overclock' };
  // the host's stamp goes up first: the room still in the lobby, no game yet → on
  assert.equal(startShow({ status: 'lobby', go }, null, 10100).on, true);
  // the match written → on, the same age
  const s = startShow({ status: 'playing', go }, { matchId: 'abc' }, 11000);
  assert.equal(s.on, true); assert.equal(s.age, 1000); assert.equal(s.g, 'overclock'); assert.equal(s.push, 0);
  // the push in its last part; done at START_MS (a refresh / a late joiner past it → straight in the game)
  assert.ok(startShow({ status: 'playing', go }, { matchId: 'abc' }, 10000 + PUSH_AT_MS + 100).push > 0);
  const end = startShow({ status: 'playing', go }, { matchId: 'abc' }, 10000 + START_MS);
  assert.equal(end.on, false); assert.equal(end.done, true);
  // another match's stamp (a stale one) → never
  assert.equal(startShow({ status: 'playing', go }, { matchId: 'zzz' }, 10500).on, false);
  assert.equal(startShow({ status: 'playing' }, { matchId: 'abc' }, 10500).on, false);
  // the same answer on every phone for the same server time (a refresh mid-start lands on the same frame)
  assert.deepEqual(startShow({ status: 'playing', go }, { matchId: 'abc' }, 11234), startShow({ status: 'playing', go }, { matchId: 'abc' }, 11234));
});

test('THE FILE-IN order: the host first, then the lines alternating (L0 R0 L1 R1 …), IN_GAP apart', () => {
  const o = fileInOrder(P, 'h');
  assert.deepEqual(o.map(x => x.uid), ['h', 'a', 'b', 'c']);
  assert.deepEqual(o.map(x => x.slot), ['L0', 'R0', 'L1', 'R1']);
  assert.deepEqual(o.map(x => +x.at.toFixed(2)), [0, IN_GAP, 2 * IN_GAP, 3 * IN_GAP].map(v => +v.toFixed(2)));
});

test('THE WALK BACK OUT + THE BANNER\'s moment: from meta/back, the host first, the same on every phone; the banner ~2 s after everyone is back', () => {
  const meta = { status: 'lobby', hostId: 'h', back: { at: 50000, m: 'abc', g: 'overclock', rm: true } };
  const b = backShow(meta, P, 51000);
  assert.equal(b.on, true); assert.equal(b.age, 1000);
  assert.deepEqual(b.order.map(x => x.uid), ['h', 'a', 'b', 'c']);
  assert.equal(b.order[0].at, OUT_LEAD); assert.equal(+(b.order[1].at - b.order[0].at).toFixed(3), OUT_GAP);
  assert.equal(backShow(meta, P, 50000 + walkOutMs(4)).on, false);           // (over → everyone standing: a refresh after it)
  assert.equal(backShow({ ...meta, status: 'playing' }, P, 51000).on, false);  // (a rematch started → no walk-out)
  assert.equal(bannerAt(meta, P), 50000 + walkOutMs(4) + BANNER_GAP_MS);
  assert.ok(walkOutMs(8) > walkOutMs(2));
  assert.equal(bannerAt({ status: 'lobby' }, P), null);
});

test('the stamps in host.js: meta/go FIRST (the walk starts at the tap), the game\'s clock = the stamp + START_MS, a failed start takes it down; meta/back at the match\'s end', () => {
  const h = read('js/host.js');
  const go = h.indexOf("'meta/go': { at: serverTimestamp(), m: matchId, g: gameId }"), start = h.indexOf('await mod.start(');
  assert.ok(go > 0 && start > go, 'the stamp before the match is prepared');
  assert.match(h, /now: tGo \+ START_MS/);
  assert.match(h, /update\(dbRef\(`rooms\/\$\{state\.code\}\/meta`\), \{ go: null \}\)/);
  assert.match(h, /'meta\/back': g && g\.matchId \? \{ at: serverTimestamp\(\), m: g\.matchId, g: g\.id, rm: isPlayable\(g\.id\) \}/);
  const a = read('js/app.js');
  assert.match(a, /startShow\(st\.meta, st\.game, serverNow\(\)\)\.on\) \{ goTimer\(st\); return 'title'; \}/);
});

test('THE RULES: meta/go + meta/back stamped at the server\'s now; rv/{uid} = your own vote for the match just played, only while its REMATCH ring is up', () => {
  const R = JSON.parse(read('database.rules.json')).rules.rooms.$code;
  assert.match(R.meta.go.at['.validate'], /=== now/);
  assert.ok(R.meta.back.rm && R.meta.back.$other);
  assert.match(R.rv.$uid['.write'], /auth\.uid === \$uid/);
  assert.match(R.rv.$uid['.write'], /meta\/back\/rm'\)\.val\(\) === true/);
  assert.match(R.rv.$uid['.validate'], /meta\/back\/m/);
  assert.match(R.rv['.write'], /!newData\.exists\(\)/);
});

test('THE GAME START\'s look: every part an animation at a negative delay (the show\'s age), transform + opacity only, reduced motion a plain fade', () => {
  const c = read('css/title.css'), part = c.slice(c.indexOf('LOBBY 2.0 B — THE GAME START'));
  for (const k of part.matchAll(/@keyframes [\w-]+ \{([^@]*?)\}\s*(?=\n|@|\.)/g)) assert.doesNotMatch(k[1], /(?:width|height|top|left|filter|box-shadow)\s*:/, 'keyframes animate transform / opacity only');
  assert.match(part, /var\(--rc-age, 0ms\)/);
  assert.match(part, /prefers-reduced-motion/);
  const rc = read('js/screens/room-city.js');
  assert.match(rc, /scene\.dimSign\('room-start', \{ logo: 0/);   // (the city's own parts of the sign — THE SIGN-DIM HOOK)
  assert.match(rc, /gameLogoSvg\(g,/);
});

test('THE LAYER STACK: the profile\'s sheets, CUSTOMIZE + the full card take the next layer (the newest on top) and Esc closes the top one only', () => {
  for (const f of ['js/profile/sheets.js', 'js/vault/dress.js', 'js/vault/full.js']) { const s = read(f); assert.match(s, /takeLayer\(/, f); assert.match(s, /isTopLayer\(/, f); }
  const c = read('css/components.css');
  assert.match(c, /\.toasts \{\n  position: fixed;\n  z-index: 8500;/);
});

test('the owner\'s 2A review: the dev pill reads just "1 OF 1"; RESTORE in neon cyan + a key; THE TAP AREA ≥ 44 pt, the nearest wins', async () => {
  const { ONE_OF_ONE } = await import('../js/core/dev-cards.js');
  assert.equal(ONE_OF_ONE, '1 OF 1');
  assert.match(read('css/progress.css'), /\.pf-restore \{[^}]*#3ff0ff/);
  const rc = read('js/screens/room-city.js');
  assert.match(rc, /const HIT_MIN = 44/);
  assert.match(rc, /openPlayerCard\(nearestAt\(e\.clientX, e\.clientY\) \|\| uid\)/);
});
