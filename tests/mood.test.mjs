// MOOD MUSIC: mood boundaries (sunrise, 11 am, sunset, midnight, the weekend party window), the shuffle bag, the song file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { moodAt, nextFromBag, moodNow, MOODS } from '../js/audio/mood.js';
import { skyClock } from '../js/core/sky.js';

const at = (dow, h, mi = 0) => moodAt({ dow, h, mi }, 7.2, 18.4);   // sunrise 7:12, sunset 6:24 pm

test('mood boundaries: sunrise, 11 am, sunset, midnight', () => {
  assert.equal(at(2, 0, 0), 'late');
  assert.equal(at(2, 7, 11), 'late');
  assert.equal(at(2, 7, 13), 'morning');
  assert.equal(at(2, 10, 59), 'morning');
  assert.equal(at(2, 11, 0), 'day');
  assert.equal(at(2, 18, 23), 'day');
  assert.equal(at(2, 18, 25), 'evening');
  assert.equal(at(2, 23, 59), 'evening');
});

test('the party window: Friday and Saturday 8 pm to 2 am (into Saturday and Sunday mornings)', () => {
  assert.equal(at(5, 19, 59), 'evening');
  assert.equal(at(5, 20, 0), 'party');
  assert.equal(at(5, 23, 30), 'party');
  assert.equal(at(6, 1, 59), 'party');      // Friday night, after midnight
  assert.equal(at(6, 2, 0), 'late');
  assert.equal(at(6, 14, 0), 'day');
  assert.equal(at(6, 20, 0), 'party');
  assert.equal(at(0, 1, 30), 'party');      // Saturday night, after midnight
  assert.equal(at(0, 2, 1), 'late');
  assert.equal(at(0, 21, 0), 'evening');    // Sunday night: no party
  assert.equal(at(4, 22, 0), 'evening');    // Thursday
});

test('moodNow follows the preview clock (real sunrise / sunset)', () => {
  const c = s => skyClock(new URLSearchParams(`when=${s}&tz=America/New_York`));
  const m = s => { const k = c(s); return moodNow(k, k.now(), k.tz); };
  assert.equal(m('2026-10-20T03:00'), 'late');
  assert.equal(m('2026-10-20T08:30'), 'morning');
  assert.equal(m('2026-10-20T14:00'), 'day');
  assert.equal(m('2026-10-20T21:00'), 'evening');
  assert.equal(m('2026-10-23T21:00'), 'party');   // a Friday
  assert.equal(m('2026-10-24T01:00'), 'party');   // Saturday 1 am
});

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
