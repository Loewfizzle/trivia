// PLAY NOW (Nov 13 — the owner's notes: "to play solo you have to start your own room") — the dock's PLAY → THE GAMES SHELF → THE GAME CARD
// (PLAY NOW / PLAY WITH FRIENDS / PICK THIS GAME) + THE SOLO ROOM (a private one-seat room: locked, never listed, no hush word shown or
// rested) + THE SOLO START (~2 s). The pure parts + the shape the code must keep; the flow itself: tests/integration/e2e-playnow.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cardActions, playersLine, soloCode, isSoloMeta, soloSettings } from '../js/core/room-logic.js';
import { START, startKind, startOf, newMatchId } from '../js/core/room-show.js';
import * as prism from '../js/games/prism/meta.js';
import * as overclock from '../js/games/overclock/meta.js';
import * as holdem from '../js/games/holdem/meta.js';

const read = f => readFileSync(f, 'utf8');

test('THE GAME CARD\'s buttons: by SOLO, in a room, host / guest', () => {
  assert.deepEqual(cardActions({ solo: true }), { main: { id: 'solo', label: 'PLAY NOW' }, more: [], second: { id: 'friends', label: 'PLAY WITH FRIENDS' }, note: null }, 'a SOLO game: PLAY NOW the pink MAIN, PLAY WITH FRIENDS second');
  assert.deepEqual(cardActions({ solo: false }), { main: { id: 'friends', label: 'PLAY WITH FRIENDS' }, more: [], second: null, note: 'Needs 2+ players' }, 'HOLD\'EM: no PLAY NOW, one quiet line');
  for (const solo of [true, false]) {
    assert.deepEqual(cardActions({ solo, inRoom: true, host: true }), { main: { id: 'pick', label: 'PICK THIS GAME' }, more: [], second: null, note: null }, 'the host in a room: PICK THIS GAME (no PLAY NOW in a room)');
    assert.deepEqual(cardActions({ solo, inRoom: true, host: false }), { main: null, more: [], second: null, note: 'The host picks the game' }, 'a guest');
  }
  // the three playable games' cards
  assert.equal(prism.SOLO, true); assert.equal(overclock.SOLO, true); assert.ok(!holdem.SOLO, 'HOLD\'EM has no SOLO → no PLAY NOW');
  assert.equal(playersLine(true, 2, 8), 'SOLO · 2–8');
  assert.equal(playersLine(false, 2, 8), '2–8');
});

test('a solo run\'s default options = what the cartridge gives a room of one (PRISM DROP: SCORE RUSH · OVERCLOCK: QUICK)', () => {
  assert.equal(soloSettings(prism).mode, 'rush', 'PRISM DROP: BATTLE needs 2 → SCORE RUSH');
  assert.equal(soloSettings(overclock).mode, 'quick');
  assert.deepEqual(soloSettings(null), {});
});

test('THE SOLO ROOM\'s code: 4 letters the rules take, NEVER a hush word (the pool untouched); the flag', () => {
  const words = JSON.parse(read('data/hushwords.json'));
  assert.ok(words.length > 100);
  let r = 0; const rand = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const set = new Set(words.map(w => w.toUpperCase()));
  for (let i = 0; i < 2000; i++) { const c = soloCode(words, rand); assert.match(c, /^[A-Z]{4}$/); assert.ok(!set.has(c), c); }
  // a "random" source that keeps landing on a hush word still gets out of it
  const w0 = words[0].toUpperCase(); let k = 0;
  const stuck = () => { k++; return k <= 4 * 10 ? (w0.charCodeAt((k - 1) % 4) - 65 + 0.5) / 26 : 0.01; };
  assert.notEqual(soloCode(words, stuck), w0);
  assert.equal(isSoloMeta({ settings: { solo: { on: true, g: 'prism' } } }), true);
  assert.equal(isSoloMeta({ settings: { prism: { mode: 'rush' } } }), false);
  assert.equal(isSoloMeta(null), false);
});

test('THE SOLO START: ~2 s (the sign lit at once), its kind in the match id (\'s\'); a full / quick id never starts with \'s\'', () => {
  assert.equal(START.solo.len, 2000); assert.equal(START.solo.sign, 0);
  assert.ok(START.solo.walkAt < START.solo.fadeAt && START.solo.fadeAt < START.solo.len);
  assert.ok(START.solo.len < START.quick.len && START.quick.len < START.full.len);
  for (let i = 0; i < 400; i++) {
    const f = newMatchId(false), q = newMatchId(true), s = newMatchId('solo');
    assert.equal(f.length, 6); assert.ok(f[0] !== 'q' && f[0] !== 's', f); assert.equal(startKind(f), 'full');
    assert.equal(q[0], 'q'); assert.equal(startKind(q), 'quick');
    assert.equal(s[0], 's'); assert.equal(s.length, 6); assert.equal(startKind(s), 'solo'); assert.equal(startOf(s).len, 2000);
  }
});

test('the solo room: flagged at its first write, locked once seated, no hush word anywhere, its close rests no word, never listed', () => {
  const room = read('js/room.js');
  assert.match(room, /settings: \{ solo: \{ on: true, g: String\(gameId \|\| ''\)\.slice\(0, 16\) \} \}/, 'flagged from the claim');
  assert.match(room, /await writePlayer\(code, profile, \{\}\);[\s\S]{0,400}await update\(dbRef\(`\$\{R\(code\)\}\/meta`\), \{ locked: true \}\)/, 'LOCKED once its one seat is taken (the rules refuse a player write into a locked room)');
  assert.match(room, /for \(let i = 0; i < 6 && !code; i\+\+\) \{ const c = soloCode\(words\);/);
  assert.match(room, /if \(solo\) await remove\(dbRef\(R\(code\)\)\);/, 'the close writes NO hush/ entry');
  assert.match(room, /await closeRoom\(code, isSoloMeta\(state\.meta\)\); \/\/ last one out/);
  assert.match(room, /if \(!solo && !soloRejoin\(code\)\) setUrlRoom\(code\);/, 'no ?room= in the address bar');
  const soloFn = room.slice(room.indexOf('export const createSoloRoom'), room.indexOf('// CC-B'));
  assert.ok(!/roomPushLater|cleanupHush|hush\//.test(soloFn), 'no A ROOM JUST OPENED, no hush/ touched');
  assert.match(soloFn, /await claimSeatFor\(null\);/, 'ONE ACCOUNT, ONE ROOM (MOVE HERE)');
  // the rules take it as it is (no rules change): meta's settings take any key, locked a boolean
  const rules = JSON.parse(read('database.rules.json')).rules.rooms.$code;
  assert.equal(rules['.validate'], '$code.matches(/^[A-Z]{4}$/)');
  assert.ok(rules.meta.settings.$game && rules.meta.locked, 'settings/solo + locked are allowed');
  // never listed: the radio's open rooms skip it; the room never shows the code
  assert.match(read('api/_lib/radio.js'), /if \(r\.meta\.settings && r\.meta\.settings\.solo && r\.meta\.settings\.solo\.on === true\) continue;/);
  const rc = read('js/screens/room-city.js');
  assert.match(rc, /scene\.hush\(soloRoom\(\) \? null : st\.code\)/, 'no hush word on the door');
  assert.match(rc, /if \(hostCard \|\| destroyed \|\| !isHost\(\) \|\| !st\.meta \|\| !code\(\) \|\| soloRoom\(\)\) return;/, 'no YOUR ROOM IS OPEN card');
  assert.match(read('js/screens/title.js'), /soloRejoin\(state\.rejoin\)/, 'the REJOIN offer says RESUME, never the code');
});

test('PLAY NOW → playSolo: the room, this phone its host + online, the default solo options, THE SOLO START; a failed start closes it', () => {
  const host = read('js/host.js');
  const fn = host.slice(host.indexOf('async function playSoloNow'), host.indexOf('// (PLAY NOW — the podium'));
  assert.match(fn, /setState\(\{ view: 'setup', setupMode: 'solo', setupGame: gameId, setupSolo: settings \|\| null \}\)/, 'a guest without a name sets one up first');
  assert.match(fn, /await createSoloRoom\(prof, gameId\)/);
  assert.match(fn, /startGame\(gameId, soloSettings\(meta, settings\), \{ solo: true \}\)/);
  assert.match(fn, /if \(!ok\) \{ await leaveRoom\(\)/);
  assert.match(host, /const kind = solo \|\| isSoloMeta\(state\.meta\) \? 'solo' : quick;/, 'every start in a solo room is THE SOLO START (PLAY AGAIN too)');
  assert.match(host, /globalThis\.__nsPlayNow = Object\.freeze\(\{ isSolo: \(\) => isSoloMeta\(state\.meta\), again: \(\) => rematch\(\), leave: \(\) => soloLeave\(\) \}\)/);
  // (THE DROP A Group 0 (c) — THE LOST RUN: BACK TO THE CITY settles this match's report (≤ 3 s, the queue lazy) BEFORE the room is closed)
  assert.match(host, /async function soloLeave\(\) \{[\s\S]{0,400}q\.settle\(q\.matchKey\(code, m\), 3000\)[\s\S]{0,200}return leaveRoom\(\);/);
  // THE STALE-MODULE RULE: the podium (a lazy chunk) reads the hub — never a new export
  const fin = read('js/ui/final.js');
  assert.match(fin, /const PN = globalThis\.__nsPlayNow;/);
  assert.ok(!/isSoloMeta|playSolo/.test(fin.replace(/\/\/.*$/gm, '')), 'final.js imports no PLAY NOW export');
  assert.match(fin, /h\('span', 'PLAY AGAIN'\)/); assert.match(fin, /h\('span', 'BACK TO THE CITY'\)/);
});

test('the dock\'s GAMES → PLAY (same spot, 4 icons the max); the signs + the blade open the card; the sign\'s own gestures untouched', () => {
  const dock = read('js/screens/title-dock.js');
  assert.match(dock, /tab\('nd-tab-play\.nd-tab-games\.nd-link-games', 'Play a game', ICON\.play, 'PLAY', on\.games\)/);
  const taps = read('js/screens/title-taps.js');
  assert.match(taps, /if \(hit\.kind === 'sign'\) \{ const g = GAMES\.find\(x => x\.id === hit\.id\); if \(g && !g\.playable\) \{ toast\(`\$\{g\.name\} — coming soon`, 'info'\); return; \} if \(g\) gameCard\(g\); \}/);
  // the letters' tap / race / surge are answered BEFORE any city hit (logoRect) — a card never steals them
  const tapFn = taps.slice(taps.indexOf('function onCityTap'), taps.indexOf('function buzz'));
  assert.ok(tapFn.indexOf('buzz(Math.max(0') < tapFn.indexOf('T.scene.hit(x, y)'));
  const sc = read('js/screens/harbor/scene.js');
  assert.match(sc, /\{ const bs = bladeHit\(x, y\); if \(bs\) return bs; \}/);
  assert.match(sc, /if \(dr && x >= dr\.x && x <= dr\.x \+ dr\.w && y >= dr\.y && y <= dr\.y \+ dr\.h\) return null;/, 'the door\'s knock wins over the blade');
});

// PD-6 — TWO SOLO BUTTONS (general): a cartridge's SOLO_RUNS → one tube per entry, the first the pink MAIN; no list → the single PLAY NOW
test('PD-6 TWO SOLO BUTTONS: no list / one / two — each a solo run with its mode; in a room nothing changes', () => {
  const one = [{ mode: 'rush', label: 'SCORE RUSH', sub: 'ONE SONG' }];
  const two = [...one, { mode: 'survival', label: 'SURVIVAL', sub: 'UNTIL YOU TOP OUT' }];
  assert.deepEqual(cardActions({ solo: true, runs: null }).main, { id: 'solo', label: 'PLAY NOW' }, 'no list: the single PLAY NOW');
  assert.deepEqual(cardActions({ solo: true, runs: one }), { main: { id: 'solo', label: 'SCORE RUSH', sub: 'ONE SONG', mode: 'rush' }, more: [], second: { id: 'friends', label: 'PLAY WITH FRIENDS' }, note: null, equal: true });
  assert.equal(cardActions({ solo: true, runs: null }).equal, undefined, 'THE DROP B add-on: no list = the single pink PLAY NOW (not equal)');
  const t = cardActions({ solo: true, runs: two });
  assert.equal(t.equal, true, 'THE DROP B add-on: a solo list = EQUAL buttons (no pink MAIN on that card)');
  assert.deepEqual([t.main.label, ...t.more.map(a => a.label), t.second.label], ['SCORE RUSH', 'SURVIVAL', 'PLAY WITH FRIENDS'], 'the first the MAIN, then the rest, then PLAY WITH FRIENDS');
  assert.deepEqual(t.more[0], { id: 'solo', label: 'SURVIVAL', sub: 'UNTIL YOU TOP OUT', mode: 'survival' });
  assert.equal(cardActions({ solo: false, runs: two }).main.id, 'friends', 'a list on a game that is not SOLO is ignored');
  assert.equal(cardActions({ solo: true, runs: two, inRoom: true, host: true }).main.id, 'pick', 'in a room: PICK THIS GAME as ever');
  // PRISM DROP's list (THE DROP — the planned daily — never a button here); OVERCLOCK keeps the single PLAY NOW
  assert.deepEqual(prism.SOLO_RUNS, two);
  assert.ok(!('SOLO_RUNS' in overclock), 'OVERCLOCK lists none — the single PLAY NOW');
  assert.ok(!prism.SOLO_RUNS.some(r => /drop/i.test(r.label + r.mode)), 'THE DROP stays a daily');
  // each button's mode through the one-player rules (soloSettings(meta, want)) — never a mode one player can't play
  assert.equal(soloSettings(prism, { mode: 'survival' }).mode, 'survival');
  assert.equal(soloSettings(prism, { mode: 'rush' }).mode, 'rush');
  assert.equal(soloSettings(prism, { mode: 'battle' }).mode, 'rush', 'BATTLE alone → SCORE RUSH');
  // the card draws them + passes the mode; host.js cleans it; a guest's setup keeps it
  const taps = read('js/screens/title-taps.js');
  assert.match(taps, /cardActions\(\{ solo: m\.solo, runs: m\.runs/);
  assert.match(taps, /playSolo\(g\.id, mode \? \{ settings: \{ mode \} \} : \{\}\)/);
  assert.match(read('js/host.js'), /startGame\(gameId, soloSettings\(meta, settings\), \{ solo: true \}\)/);
  assert.match(read('js/screens/setup.js'), /m\.playSolo\(game, want \? \{ settings: want \} : \{\}\)/);
});
