// JAYWALK H4 add-on (the owner, Nov 16) — YOUR BEST LINE + THE NEXT FRIEND'S LINE (js/games/jaywalk/lines.js — PURE; the drawing:
// night.js#setLines / flashLine; the moments: view.js). The data = the SERVER-counted solo bests (YOUR TABLE's read), fetched ONCE at a
// run's start; gold = YOUR BEST alone; ONE friend line at a time, the lowest friend best not yet passed; a match draws YOUR BEST alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BOARD, TABLE_KEEP_MS, LINE_HEX, parseTable, nextFriend, crossedFriends, isRecord, bestText, friendText, linesFor } from '../js/games/jaywalk/lines.js';

const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const code = f => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('THE TABLE → the lines\' data: your own server-counted best + your friends\', the nearest first; junk never becomes a line', () => {
  const T = parseTable([{ n: 'Zed', v: 300 }, { n: 'HOPPER', v: 143, me: true }, { n: 'liam', v: 212 }, { n: 'Ada', v: 150 }, { n: 'Bad', v: 0 }, { n: 'Worse', v: 'x' }, null, { v: 9 }]);
  assert.equal(T.best, 143);
  assert.deepEqual(T.friends, [{ n: 'A FRIEND', v: 9 }, { n: 'ADA', v: 150 }, { n: 'LIAM', v: 212 }, { n: 'ZED', v: 300 }], 'friends: capitals, lowest best first; a nameless row is A FRIEND; 0 / junk dropped');
  assert.deepEqual(parseTable(null), { best: 0, friends: [] });
  assert.deepEqual(parseTable([{ n: 'ONLY', v: 5 }]), { best: 0, friends: [{ n: 'ONLY', v: 5 }] }, 'no row of your own = no best yet');
  assert.equal(BOARD, 'jaywalk-solo', 'the SOLO best — the server\'s board');
  assert.ok(TABLE_KEEP_MS >= 30_000 && TABLE_KEEP_MS <= 300_000);
});

test('YOUR BEST LINE: none on a first-ever run; the words; CROSSING = the first lane past your best — from then on a new record', () => {
  assert.deepEqual(linesFor({ best: 0, friends: [], reached: 0 }), { best: null, friend: null }, 'no best yet: no line');
  assert.deepEqual(linesFor({ best: 143, friends: [], reached: 0 }).best, { lane: 143, text: 'YOUR BEST · 143' });
  assert.equal(bestText(1234), 'YOUR BEST · 1,234');
  assert.equal(isRecord(143, 142), false); assert.equal(isRecord(143, 143), false, 'level with your best is not past it');
  assert.equal(isRecord(143, 144), true); assert.equal(isRecord(0, 5), false, 'no best: nothing to cross');
  // the line stays where it lies after it is crossed (it scrolls away behind) — the best lane never moves during a run
  assert.deepEqual(linesFor({ best: 143, friends: [], reached: 200 }).best, { lane: 143, text: 'YOUR BEST · 143' });
});

test('THE NEXT FRIEND\'S LINE: ONE at a time — the lowest friend best not yet passed; crossing it brings the next; friends behind never show; none in a match', () => {
  const F = parseTable([{ n: 'LIAM', v: 212 }, { n: 'ADA', v: 150 }, { n: 'ZED', v: 30 }, { n: 'ME', v: 100, me: true }]).friends;
  assert.deepEqual(nextFriend(F, 0), { n: 'ZED', v: 30 });
  assert.deepEqual(nextFriend(F, 30), { n: 'ZED', v: 30 }, 'standing ON the friend\'s lane (level): the line is still right ahead');
  assert.deepEqual(nextFriend(F, 31), { n: 'ADA', v: 150 }, 'one lane more: crossed — the next friend above');
  assert.deepEqual(nextFriend(F, 151), { n: 'LIAM', v: 212 });
  assert.equal(nextFriend(F, 213), null, 'past every friend: no line');
  assert.equal(nextFriend([], 0), null, 'no friend bests: no friend lines');
  assert.equal(friendText({ n: 'LIAM', v: 212 }), 'LIAM · 212');
  // exactly one friend line whatever the lane; never a friend the player has passed
  for (let lane = 0; lane < 260; lane++) {
    const L = linesFor({ best: 100, friends: F, reached: lane });
    assert.ok(!L.friend || L.friend.lane >= lane, `lane ${lane}: never a friend behind the player`);
    assert.equal(L.friend ? 1 : 0, lane <= 212 ? 1 : 0);
  }
  // the crossing: the landing that leaves a friend's lane behind
  assert.deepEqual(crossedFriends(F, 30, 31), [{ n: 'ZED', v: 30 }]);
  assert.deepEqual(crossedFriends(F, 29, 30), [], 'landing ON their lane crosses nothing');
  assert.deepEqual(crossedFriends(F, 31, 32), []);
  const two = parseTable([{ n: 'A', v: 40 }, { n: 'B', v: 40 }]).friends;
  assert.deepEqual(crossedFriends(two, 40, 41).map(f => f.n), ['A', 'B'], 'two friends level: both crossed by the one landing');
  // a MATCH: YOUR BEST alone — the real players are the ghosts
  assert.deepEqual(linesFor({ best: 100, friends: F, reached: 0, solo: false }), { best: { lane: 100, text: 'YOUR BEST · 100' }, friend: null });
});

test('THE LOOKS: gold is YOUR BEST alone; a friend is NEON PINK — never gold, never blue / cyan / teal (H5B\'s add-on: blue on the ground = water)', () => {
  const rgb = h => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const [r, g, b] = rgb(LINE_HEX.best), [fr, fg, fb] = rgb(LINE_HEX.friend);
  assert.ok(r > 230 && g > 150 && g < 225 && b < 110, `gold (${LINE_HEX.best.toString(16)})`);
  assert.equal(LINE_HEX.friend, 0xff4fd8);
  assert.ok(fr > 240 && fg < 120 && fb > 180 && fb < fr, `neon pink (${LINE_HEX.friend.toString(16)}) — red-led, never blue-led, never gold`);
});

test('THE SOURCES: the lines come from the server\'s table, asked ONCE a run; drawn on any lane kind; the crossing\'s burst + sound + the counter; PURE', () => {
  const lines = code('js/games/jaywalk/lines.js'), view = code('js/games/jaywalk/view.js'), night = code('js/games/jaywalk/night.js'), css = read('css/jaywalk.css');
  assert.doesNotMatch(lines, /^import /m, 'lines.js: PURE — no imports');
  assert.doesNotMatch(lines, /document|window|localStorage|Date\.now|performance|Math\.random/, 'no DOM, no clock, no storage');
  // the data: the server's own table (the board jaywalk-solo), through the ONE loader — kept a short while, never asked during a run
  assert.match(view, /A\.api\('profile', \{ action: 'table', b: BOARD \}\)\)\.then\(d => parseTable\(d && d\.rows\)\)/);
  assert.equal((view.match(/action: 'table'/g) || []).length, 1, 'ONE place asks for the table');
  assert.match(view, /if \(table && table\.uid === uid && performance\.now\(\) - table\.at < TABLE_KEEP_MS\) return table\.p;/, 'kept: PLAY AGAIN a second later asks nothing');
  assert.equal((view.match(/loadTable\(uid\)\.then/g) || []).length, 1, 'asked from ONE place — the run\'s start (reset)');
  const reset = view.slice(view.indexOf('function reset()'), view.indexOf('const refused'));
  assert.match(reset, /loadTable\(uid\)\.then\(T => \{/, 'at the run\'s start');
  assert.doesNotMatch(view.slice(view.indexOf('function frame(now)'), view.indexOf('// ---- the end')), /loadTable|\.api\(/, 'nothing is asked in the frame loop');
  assert.match(reset, /lines = \{ best: Math\.floor\(Number\(getPref\('best', '0'\)\) \|\| 0\), friends: \[\] \};/, 'until the answer lands: the best the SERVER last told this phone (never a local count); no friends');
  // the moments
  assert.match(view, /if \(!record && isRecord\(lines\.best, lane\)\) \{\s*record = true;\s*night\.flashLine\('best', lines\.best\);/);
  assert.match(view, /lanesEl\.classList\.add\('is-record'\);/); assert.match(view, /SFX\.play\('new-best'\)/, 'the new-best sound at the crossing');
  assert.match(view, /if \(!isMatch\) for \(const f of crossedFriends\(lines\.friends, lane - 1, lane\)\) \{\s*night\.flashLine\('friend', f\.v\);/, 'a friend\'s line: solo runs only');
  assert.match(view, /SFX\.play\('landmark', \{ vol: 0\.4, rate: 1\.3 \}\)/, 'a quiet chime');
  assert.match(view, /linesFor\(\{ best: lines\.best, friends: lines\.friends, reached: run\.best, solo: !isMatch \}\)/);
  assert.match(view, /drawLines\(mine\(g\) && drawRun === run\);/, 'your lines on YOUR run — never over a player you watch');
  // the drawing: across the whole lane on any kind — buoys on water — + the words on the ground + the burst
  assert.match(night, /import \{ LINE_HEX \} from '\.\/lines\.js';/);
  assert.match(night, /if \(L\.type === 'water'\) \{/); assert.match(night, /for \(let c = -1\.5; c <= COLS \+ 1\.5; c \+= 0\.75\)/, 'a row of glowing buoys on water');
  assert.match(night, /K\.flat\.put\(0, 0\.066, z, 13, 1,/, 'a band across the whole lane (13 cells: past both edges of the view)');
  assert.match(night, /setLines\(v\) \{/); assert.match(night, /flashLine\(k, lane\) \{/);
  assert.match(night, /new THREE\.PlaneGeometry\(7\.6, 0\.95\)\.rotateX\(-Math\.PI \/ 2\)/, 'the words: BIG on the ground — 7.6 cells wide, the letters over half a lane tall');
  assert.match(night, /L\.tex\.dispose\(\); L\.cv\.width = 0;/, 'freed with the scene');
  assert.match(css, /\.jw-lanes\.is-record \{[^}]*#ffc53a/); assert.match(css, /\.jw-lanes\.is-flash \{ animation: jw-record/);
  assert.match(css, /@keyframes jw-record \{[^@]*transform: scale[^@]*opacity/, 'the flash: transform + opacity only');
});
