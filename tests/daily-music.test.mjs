// TWO SONGS AT ONCE (the inbox, Nov 26 2026 — the owner saw it on his iPhone: city music → THE DAILIES → start a daily → the daily's song starts AND
// the city's song keeps playing). The cause: js/app.js#musicTick gated the synced city radio only on `!state.code` and the room's synced
// song only on the lobby — a daily RUN (state.daily = { v: 'run', id }) keeps state.code null (or a lobby up), so both played on under the
// track musicFor() gives the run. The fix (app.js only): `inDailyRun` — musicTick's three gates + a stop AT ONCE in render(). ONE song at
// a time (docs/audio.md). The browser run: tests/integration/daily-music.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

test('TWO SONGS AT ONCE — a daily RUN rests BOTH synced players: the city radio\'s gate, the lobby song\'s gate, the warm-up; the host\'s duty to the room\'s queue goes on; the stop is AT ONCE in render(), before the run\'s own track starts', () => {
  assert.match(code, /const inDailyRun = st => !!\(dailyOn\(st\) && st\.daily\.v === 'run'\);/);
  assert.match(code, /const run = inDailyRun\(state\);/);
  assert.match(code, /lobbySynced = lobbyMusicTick\(state, moodOn\(\) && lob && !run, lob\);/, 'the room\'s synced song: not ACTIVE on this phone in a run — its third argument (the host keeps the room\'s queue going) is the lobby\'s as ever');
  assert.match(code, /partySynced = partyMusicTick\(!!cc && moodOn\(\) && !state\.code && !run, /, 'the city\'s synced radio: off in a run');
  assert.match(code, /document\.visibilityState === 'visible' && !state\.code && !run && !settings\.musicOff && !settings\.muted;/, 'nothing is warmed ahead for a radio that rests');
  const stop = code.indexOf('if (inDailyRun(st)) { if (partySynced) partySynced = partyMusicTick(false, false, false); if (lobbySynced) lobbySynced = lobbyMusicTick(st, false, false); }');
  const play = code.indexOf('const [track, fallback] = musicFor(st); playMusic(track, fallback);');
  assert.ok(stop > 0 && play > stop && play - stop < 260, 'render(): the synced players stop NOW, right before the run\'s own track is asked for (not at the next 250-ms tick)');
  // the run's track itself is untouched: the day deck by day, the evening deck by night, a row with its own music silent
  assert.match(code, /if \(dailyOn\(st\) && st\.daily\.v === 'run'\) return \(DAILIES\.find\(d => d\.id === st\.daily\.id\) \|\| gameRow\(st\.daily\.id\) \|\| \{\}\)\.ownMusic \? \[null\] : \[document\.body\.dataset\.look === 'day' \? 'mood:day' : 'mood:evening', 'menu'\];/);
});

test('inDailyRun — the truth table (the three one-line rules as app.js writes them): a RUN outside a room + in a room\'s lobby = yes; THE PICKER, no daily, a room match being played = no', () => {
  const line = name => { const m = code.match(new RegExp(`const ${name} = st => ([^\\n]+);`)); assert.ok(m, `app.js still has ${name}`); return m[1]; };
  const make = new Function(`const roomGameOn = st => ${line('roomGameOn')}; const dailyOn = st => ${line('dailyOn')}; const inDailyRun = st => ${line('inDailyRun')}; return { roomGameOn, dailyOn, inDailyRun };`);
  const { inDailyRun, roomGameOn } = make();
  const lobby = { code: 'WORD', meta: { status: 'lobby' } }, playing = { code: 'WORD', meta: { status: 'playing' }, game: { matchId: 'm1' } };
  assert.equal(inDailyRun({ daily: { v: 'run', id: 'password' } }), true, 'from the city');
  assert.equal(inDailyRun({ ...lobby, daily: { v: 'run', id: 'coastclear' } }), true, 'from a room\'s lobby (the room\'s song rests too)');
  assert.equal(inDailyRun({ ...playing, quit: 'm1', daily: { v: 'run', id: 'password' } }), true, 'a match this phone left: its daily plays');
  assert.equal(inDailyRun({ daily: { v: 'screen', tab: 'today' } }), false, 'THE PICKER keeps the radio');
  assert.equal(inDailyRun({ daily: null }), false); assert.equal(inDailyRun({}), false);
  assert.equal(roomGameOn(playing), true); assert.equal(inDailyRun({ ...playing, daily: { v: 'run', id: 'password' } }), false, 'a room match being played wins: the game\'s own music');
});
