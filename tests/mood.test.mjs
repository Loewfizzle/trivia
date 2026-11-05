// MOOD MUSIC: the shuffle bag, the song file. (The moods' hours: city-music.test.mjs — CITY 1.0 OUT took City 1.0's rule.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nextFromBag, MOODS } from '../js/audio/mood.js';

test('the bag: no repeats until every song has played, and no back-to-back across cycles', () => {
  const ids = ['a', 'b', 'c', 'd', 'e'];
  let bag = null, last = null;
  const seen = [];
  for (let k = 0; k < 50; k++) { const r = nextFromBag(bag, ids, Math.random, last); bag = r.bag; seen.push(r.id); assert.notEqual(r.id, last); last = r.id; }
  for (let c = 0; c < 10; c++) assert.equal(new Set(seen.slice(c * 5, c * 5 + 5)).size, 5, `cycle ${c} plays each once`);
});

test('data/mood-music.json: every song in exactly one mood, 5-8 per mood, keepers marked, files exist', () => {
  const d = JSON.parse(readFileSync(new URL('../data/mood-music.json', import.meta.url)));
  const all = MOODS.flatMap(m => d.moods[m]);
  assert.equal(new Set(all).size, all.length, 'one mood each');
  for (const m of MOODS) assert.ok(d.moods[m].length >= 5 && d.moods[m].length <= 8, `${m}: ${d.moods[m].length}`);
  for (const id of all) { assert.equal(d.songs[id].mood, MOODS.find(m => d.moods[m].includes(id))); readFileSync(new URL(`../audio/music/${id}.mp3`, import.meta.url)); }
  assert.ok(d.songs.late1.keeper && d.songs.late2.keeper, 'the two lo-fi songs are keepers');
  assert.ok(!all.some(id => /^victory/.test(id)), 'no fanfares');
});
