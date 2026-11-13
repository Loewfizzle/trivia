// FR7 FIXES C2 — THE LEDGER WOULDN'T OPEN: NOW PLAYING imports NOTHING (a stale player module can never stop the LEDGER linking) and reads
// the players through ONE shared hub; its text never throws.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nowPlayingNow, nowPlayingText, mss, NP_HUB } from '../js/audio/now-playing.js';

const src = p => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const imports = s => [...s.matchAll(/^\s*import\s[^;]*?from\s+['"]([^'"]+)['"]/gm)].map(m => m[1]);

test('now-playing.js imports nothing; the LEDGER imports no audio player', () => {
  assert.deepEqual(imports(src('js/audio/now-playing.js')), [], 'now-playing.js must import NOTHING (the hub only)');
  const led = imports(src('js/screens/harbor/radio-ledger.js'));
  const players = led.filter(u => /audio\/(music|party-music|lobby-music|engine|settings|synced-songs|mood)\.js$/.test(u));
  assert.deepEqual(players, [], 'radio-ledger.js must not import an audio player (a lazy chunk + a stale player = a link error)');
});

test('each player registers its reader on the hub', () => {
  for (const [f, k] of [['js/audio/music.js', 'H.music'], ['js/audio/music.js', 'H.off'], ['js/audio/party-music.js', 'H.party'], ['js/audio/lobby-music.js', 'H.lobby']]) {
    const s = src(f);
    assert.ok(s.includes(`globalThis.${NP_HUB}`) && s.includes(`${k} = `), `${f} registers ${k} on globalThis.${NP_HUB}`);
  }
});

test('nowPlayingNow: the order — off, the room song, the station / deck, the plain player; a throwing reader is skipped', () => {
  assert.deepEqual(nowPlayingNow(null), { unknown: true });
  assert.deepEqual(nowPlayingNow({}), { unknown: true });
  assert.deepEqual(nowPlayingNow({ off: () => true, music: () => ({ file: 'x.mp3' }) }), { off: true });
  const hub = {
    off: () => false,
    lobby: () => null,
    party: () => ({ source: 'STATION · EVENING', file: 'c2-evening7.mp3', left: 35.4 }),
    music: () => ({ source: 'MOOD MUSIC', file: 'm.mp3', left: 10 }),
  };
  assert.deepEqual(nowPlayingNow(hub), { source: 'STATION · EVENING', file: 'c2-evening7.mp3', left: 35.4 });
  hub.lobby = () => ({ source: 'THE ROOM’S SONG', file: 'lobby3.mp3', left: null });
  assert.deepEqual(nowPlayingNow(hub), { source: 'THE ROOM’S SONG', file: 'lobby3.mp3', left: null });
  hub.lobby = () => { throw new Error('boom'); };
  hub.party = () => { throw new Error('boom'); };
  assert.equal(nowPlayingNow(hub).file, 'm.mp3');
  hub.music = () => null;
  assert.deepEqual(nowPlayingNow(hub), { idle: true });
  hub.off = () => { throw new Error('boom'); };
  assert.deepEqual(nowPlayingNow(hub), { idle: true });
});

test('nowPlayingText never throws; mss', () => {
  assert.equal(nowPlayingText({ unknown: true }), 'NOW PLAYING · —');
  assert.equal(nowPlayingText(null), 'NOW PLAYING · —');
  assert.equal(nowPlayingText({ off: true }), 'NOW PLAYING · MUSIC OFF');
  assert.match(nowPlayingText({ idle: true }), /^NOW PLAYING · nothing sounding/);
  assert.equal(nowPlayingText({ source: 'STATION · DAY', file: 'a.mp3', left: 95 }), 'NOW PLAYING · STATION · DAY · a.mp3 · 1:35 left');
  assert.equal(nowPlayingText({ get off() { throw new Error('x'); } }), 'NOW PLAYING · —');
  assert.equal(typeof nowPlayingText(), 'string');
  assert.equal(mss(0), '0:00'); assert.equal(mss(61.6), '1:02'); assert.equal(mss(NaN), '0:00');
});
