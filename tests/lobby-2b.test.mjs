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

test('THE WINNER\'s BANNER — the words: short (each panel ≤ 24 letters, never a cut name), ten forms in turn (ten games a night never repeat), ties SPLIT THE POT / TIE GAME', async () => {
  const { bannerLines, winnersOf, champLines, PANEL_MAX } = await import('../js/core/room-show.js');
  const seen = new Set();
  for (let i = 0; i < 10; i++) {
    const l = bannerLines(['Ben'], 'Overclock', i);
    assert.ok(l.length >= 1 && l.length <= 3 && l.every(s => s.length <= PANEL_MAX), JSON.stringify(l));
    assert.ok(l.join(' ').includes('BEN') && l.join(' ').includes('OVERCLOCK'));
    seen.add(l.join('|'));
  }
  assert.equal(seen.size, 10, 'ten games a night: ten different lines');
  assert.deepEqual(bannerLines(['Ben'], 'Overclock', 0), ['BEN TAKES OVERCLOCK!']);
  for (let i = 0; i < 10; i++) { const l = bannerLines(['WWWWWWWWWWWWWWWW'], 'DOUBLE AGENT', i); assert.ok(l.every(s => s.length <= PANEL_MAX) && l.some(s => s.includes('WWWWWWWWWWWWWWWW')), `the longest name whole: ${JSON.stringify(l)}`); }
  const ties = [0, 1, 2, 3].map(i => bannerLines(['Ben', 'Sam'], 'Prism Drop', i).join(' '));
  assert.ok(ties.some(t => /SPLIT THE POT/.test(t)) && ties.some(t => /TIE GAME/.test(t)) && ties.every(t => /BEN/.test(t) && /SAM/.test(t)));
  assert.match(bannerLines(['A', 'B', 'C'], 'X', 0).join(' '), /A \+ 2 MORE/);
  assert.deepEqual(winnersOf({ p: { a: 3, b: 3, c: 1 }, n: { a: 'ANN', b: 'BO', c: 'CY' } }).map(w => w.name), ['ANN', 'BO']);
  assert.deepEqual(champLines(['ben']), ['LAST CALL —', 'BEN WINS THE NIGHT']);
  assert.deepEqual(champLines(['ben'], 'last-night'), ["LAST NIGHT'S CHAMPION:", 'BEN']);
  assert.match(champLines(['a', 'b']).join(' '), /A \+ B WIN THE NIGHT/);
});

test('THE REMATCH VOTE — the state: up once the banner flies (everyone back), only this match\'s votes from players still here, gone once the host picks another game or a game runs', async () => {
  const { voteState, bannerAt } = await import('../js/core/room-show.js');
  const players = { h: { joinedAt: 1 }, a: { joinedAt: 2 }, b: { joinedAt: 3 } };
  const meta = { status: 'lobby', hostId: 'h', back: { at: 1000, m: 'm1', g: 'overclock', rm: true } };
  const at = bannerAt(meta, players);
  assert.equal(voteState(meta, {}, players, at - 10).on, false, 'not before the banner');
  const v = voteState(meta, { a: 'm1', b: 'old', gone: 'm1' }, players, at + 10);
  assert.equal(v.on, true); assert.deepEqual(v.voters, ['a']); assert.deepEqual(v.guests, ['a', 'b']); assert.equal(v.total, 3);
  assert.equal(voteState({ ...meta, back: { ...meta.back, rm: false } }, { a: 'm1' }, players, at + 10).on, false, 'another game picked');
  assert.equal(voteState({ ...meta, status: 'playing' }, { a: 'm1' }, players, at + 10).on, false, 'a game running');
});

test('THE BANNER PLANE obeys the sky: scene.roomBanner refuses during a legendary / its traffic hold / another banner (the room waits, then flies or skips); the night\'s champion once a night, after 2+ games', () => {
  const sc = read('js/screens/harbor/scene.js');
  assert.match(sc, /roomBanner: \(lines, o = \{\}\) => \{ try \{ const H = trafficHoldNow\(\); if \(\(legends && legends\.active\(\)\) \|\| \(H && H\.on\) \|\| \(sky\.listen\(\)\.banner\)\) return false;/);
  const rb = read('js/screens/room-banner.js');
  assert.match(rb, /WAIT_TRIES = 30, WAIT_MS = 2000/);
  assert.match(rb, /rec\.shown \|\| rec\.games < 2/);
  assert.match(rb, /if \(reducedMotion\(\)\) \{ stillCard\(lines\)/);
});

test('THE ADD-ON: LEAVE ROOM up front (the ☰ menu\'s first row in a room — red-edged, a second tap; the foot of GUESTS); the crew\'s LOBBY ONLY moments PLAY on the room\'s phones; ONE SHEET STACK for every pop-up', () => {
  const sp = read('js/ui/settings-panel.js');
  assert.match(sp, /if \(inRoom && !inGame\) rows\.push\(armed\('LEAVE ROOM', 'SURE\? TAP AGAIN'/);
  assert.ok(sp.indexOf("armed('LEAVE ROOM'") < sp.indexOf("item('YOUR CARD'"), 'the first row');
  const rg = read('js/screens/room-guests.js');
  assert.match(rg, /body: \[h\('div\.rg-h', count\), list, lockRow, night, leave\]/);
  // the cause of "the Blackbird didn't fly": rooms/{CODE}/radio's sky moments were never handed to the city — now they are
  const rm = read('js/room.js');
  assert.match(rm, /setState\(\{ roomRadio: all\.filter\(x => x\.kind !== 'intercom' && x\.jack\) \}\)/);
  assert.match(read('js/screens/harbor/remote.js'), /\.\.\.radioLocal, \.\.\.radioRoom\]/);
  assert.match(read('js/screens/title.js'), /const list = state && state\.code \? state\.roomRadio \|\| \[\] : \[\]/);
  assert.doesNotMatch(read('js/screens/harbor/radio.js'), /play once lobbies are in the city|play once the lobby is the live city/);
  // ONE SHEET STACK: every pop-up on <body> takes the next layer (the older .modal sheets too); the app's Esc closes a modal only when on top
  const L = read('js/ui/layers.js');
  assert.match(L, /const POPUPS = '\.modal, \.pfs, \.vl-dress, \.vl-full'/);
  assert.match(read('js/app.js'), /watchLayers\(\);/);
  assert.match(read('js/app.js'), /if \(modal && isTopLayer\(modal\)\)/);
});

test('THE STAMPS NEVER DEPEND ON A RULES RE-PUBLISH (the owner\'s real-phone test, Nov 4 10:37 am): the start from game.go, the end from activeAt + the night\'s entry; a refused stamp is reported', async () => {
  const { goOf, backOf, startShow, backShow, bannerAt, BACK_FALLBACK_MS } = await import('../js/core/room-show.js');
  // the start: meta/go wins; refused → the match's own game.go
  const game = { id: 'overclock', matchId: 'm1', go: 5000 };
  assert.deepEqual(goOf({ go: { at: 4000, m: 'm1', g: 'overclock' } }, game), { at: 4000, m: 'm1', g: 'overclock' });
  assert.deepEqual(goOf({}, game), { at: 5000, m: 'm1', g: 'overclock', inGame: true });
  assert.equal(startShow({ status: 'playing' }, game, 6000).on, true, 'the show runs without meta/go');
  assert.equal(startShow({ status: 'playing', go: { at: 1, m: 'old', g: 'x' } }, game, 6000).on, true, 'a stale meta/go never blocks the match\'s own');
  // the end: meta/back wins; refused → activeAt right after a finished match (its night entry), never otherwise
  const night = { m1: { g: 'overclock', p: { a: 3 }, at: 100000 } };
  assert.equal(backOf({ status: 'lobby', activeAt: 160000 }, night).m, 'm1');
  assert.equal(backOf({ status: 'lobby', activeAt: 160000 }, night).rm, false, 'no vote without the new rules');
  assert.equal(backOf({ status: 'lobby', activeAt: 100000 + BACK_FALLBACK_MS + 1 }, night), null, 'KEEP OPEN later never replays it');
  assert.equal(backOf({ status: 'lobby', activeAt: 160000 }, {}), null, 'no finished match = no walk-out');
  assert.equal(backOf({ status: 'playing', activeAt: 160000 }, night), null);
  assert.equal(backShow({ status: 'lobby', hostId: 'a', activeAt: 160000 }, { a: { joinedAt: 1 } }, 161000, night).on, true);
  assert.ok(bannerAt({ status: 'lobby', activeAt: 160000 }, { a: {} }, night) > 160000);
  const h = read('js/host.js');
  assert.match(h, /game: \{ \.\.\.game, go: serverTimestamp\(\) \}/);
  assert.match(h, /\.catch\(e => stampRefused\('go', e\)\)/); assert.match(h, /\.catch\(e => stampRefused\('back', e\)\)/);
  assert.match(h, /reportError\(new Error\(`ROOM STAMP REFUSED/);
});

// FR6 FIXES A (B2 + B3): a start's stamp with the room still waiting for its match — its age; the veil holds that long, at most GO_DEAD_MS,
// and a host that isn't preparing it takes it down after GO_ORPHAN_MS
test('goWaiting: the stamp up + the room still lobby with no match → its age; otherwise null', async () => {
  const { goWaiting, GO_DEAD_MS, GO_ORPHAN_MS, START_MS } = await import('../js/core/room-show.js');
  const meta = { status: 'lobby', go: { at: 1000, m: 'm1', g: 'overclock' } };
  assert.equal(goWaiting(meta, null, 4000), 3000);
  assert.equal(goWaiting({ ...meta, status: 'playing' }, { matchId: 'm1' }, 4000), null, 'the match landed');
  assert.equal(goWaiting(meta, { matchId: 'm1' }, 4000), null);
  assert.equal(goWaiting({ status: 'lobby' }, null, 4000), null, 'no stamp');
  assert.ok(GO_DEAD_MS >= 12000 + START_MS, 'the veil outlasts the worst slow start measured (12 s)');
  assert.ok(GO_ORPHAN_MS < GO_DEAD_MS);
});
