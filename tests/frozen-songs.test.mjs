// FR7 FIXES B — D3 (the owner, Nov 12): THE FROZEN SONGS OUT OF DEPLOYS. .vercelignore drops the ten frozen games' songs; this fails the
// moment a song the LIVE site can play is one of them — City 2.0's mood stations (every deck: the city, the lobby song, HOLD'EM, OVERCLOCK,
// the dailies all play a station), the menu playlist (CLASSIC), the podium's victory list, OVERCLOCK's track, PRISM DROP's two sets, the
// podium + progression sounds — or when a station's deck goes missing (the old City 1.0 decks are only its fallback, and they name the
// frozen songs). A game switched back on: delete its lines in .vercelignore in the same pass.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const ignored = new Set(execSync('git ls-files -i -c --exclude-from=.vercelignore', { encoding: 'utf8' }).split('\n').filter(Boolean));
const shipped = f => fs.existsSync(f) && !ignored.has(f);
const mood = JSON.parse(fs.readFileSync('data/mood-music.json', 'utf8'));
const MOODS = ['morning', 'day', 'evening', 'late', 'party'];
const musicJs = fs.readFileSync('js/audio/music.js', 'utf8');
const FILES = Object.fromEntries([...musicJs.slice(musicJs.indexOf('const FILES = {'), musicJs.indexOf('};', musicJs.indexOf('const FILES = {'))).matchAll(/'?([\w-]+)'?: '([\w-]+)'/g)].map(m => [m[1], m[2]]));

test('every mood has a City 2.0 deck (so the old City 1.0 decks — the frozen songs — are never reached) and every station song ships', () => {
  for (const m of MOODS) {
    const deck = mood.city2 && mood.city2.moods && mood.city2.moods[m];
    assert.ok(Array.isArray(deck) && deck.length >= 3, `the ${m} station has its own deck`);
    for (const id of deck) assert.ok(shipped(`audio/music/${id}.mp3`), `${m}: ${id}.mp3 ships`);
  }
});

test('the live playlists ship: the menu (CLASSIC), the podium\'s victory list, OVERCLOCK\'s track, PRISM DROP\'s night + day sets, the podium sounds', () => {
  const live = ['menu1', 'menu2', 'menu3', 'menu4', 'victory1', 'victory2', 'victory3', 'victory4', 'overclock'];
  for (const id of live) assert.ok(FILES[id] && shipped(`audio/music/${FILES[id]}.mp3`), `${id} (${FILES[id]}.mp3) ships`);
  const prism = JSON.parse(fs.readFileSync('data/prism/manifest.json', 'utf8')).songs;
  assert.ok(prism.length >= 10);
  for (const s of prism) assert.ok(shipped(`audio/music/${s.id}.mp3`), `PRISM DROP ${s.id}.mp3 ships`);
  for (const f of fs.readdirSync('audio/sfx').filter(f => f.startsWith('pg-'))) assert.ok(shipped(`audio/sfx/${f}`), f);
});

test('what is dropped is ONLY the frozen games\' songs (and they are really dropped)', () => {
  const dropped = [...ignored].filter(f => f.startsWith('audio/') && f.endsWith('.mp3'));
  assert.ok(dropped.length >= 25, `${dropped.length} songs out of the deploy`);
  const FROZEN = /^audio\/(pulse\/pulse\d\.mp3|music\/(cipher-breach|last-signal|neural-bluff|golf-[a-z]+|spy\d|high\d|run\d|slip\d)\.mp3)$/;
  for (const f of dropped) assert.match(f, FROZEN, `${f} is a frozen game's song`);
  // (and no live game names one: the three playable games' + the dailies' MUSIC are stations or null)
  for (const g of ['overclock', 'prism', 'holdem', 'password', 'coastclear']) {
    const meta = fs.readFileSync(`js/games/${g}/meta.js`, 'utf8');
    const m = meta.match(/export const MUSIC = ([^;]+);/);
    assert.ok(m && /^(null|'mood:(morning|day|evening|late|party)')/.test(m[1].trim()), `${g}: MUSIC = ${m && m[1]}`);
  }
});
