// CITY 2.0 MUSIC (docs/audio.md#city-20-music): the Harbor's own mood rule, the MUSIC MOOD setting in both cities, the City 2.0 decks
// (data/mood-music.json `city2`), shared songs, and the shuffle across moods.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

const mem = new Map();
globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: k => mem.delete(k) };

const { cityMoodAt, MOOD_IDS } = await import('../js/core/city-mood.js');
const { city, setCityClock, isCity2, cityFailed } = await import('../js/core/city.js');
const { moodNow, fixedMood, songsFor, setMoodData, nextForDevice, MOODS, MOOD_CHOICES } = await import('../js/audio/mood.js');
const { settings } = await import('../js/audio/settings.js');
const { skyClock, look } = await import('../js/core/sky.js');

const data = JSON.parse(readFileSync(new URL('../data/mood-music.json', import.meta.url), 'utf8'));
const ROOT = new URL('../', import.meta.url);

// the preview links' place: Grand Rapids (&tz=America/Detroit&at=42.96,-85.67)
const cityAt = when => {
  const c = skyClock(new URLSearchParams(`when=${when}&tz=America/Detroit&at=42.96,-85.67`));
  setCityClock({ now: () => c.now(), tz: () => c.tz, wx: () => c.wx, q: () => null });
  return c;
};
const asCity2 = () => { city.two = true; settings.musicMood = 'auto'; };
const asCity1 = () => { city.two = false; city.clock = null; settings.musicMood = 'auto'; };

test('CITY 2.0 mood rule: dawn → 11 am MORNING · DAY · golden hour → 11 pm EVENING · 11 pm → dawn LATE NIGHT (by the sun)', () => {
  const L = (dow, h, mi = 0) => ({ dow, h, mi, s: 0 });
  // a mid-week autumn day at 43° N: dawn ≈ sun at -6°, golden hour = sun at 10°
  assert.equal(cityMoodAt(L(2, 0), -40), 'late');
  assert.equal(cityMoodAt(L(2, 5, 30), -12), 'late');
  assert.equal(cityMoodAt(L(2, 6, 30), -7), 'late', 'still before dawn');
  assert.equal(cityMoodAt(L(2, 7, 0), -5.9), 'morning', 'dawn: the sun back above -6°');
  assert.equal(cityMoodAt(L(2, 10, 59), 30), 'morning');
  assert.equal(cityMoodAt(L(2, 11, 0), 30), 'day');
  assert.equal(cityMoodAt(L(2, 14, 0), 12), 'day');
  assert.equal(cityMoodAt(L(2, 15, 30), 10), 'evening', 'golden hour: the sun at 10°');
  assert.equal(cityMoodAt(L(2, 19, 0), -6), 'evening');
  assert.equal(cityMoodAt(L(2, 22, 59), -40), 'evening');
  assert.equal(cityMoodAt(L(2, 23, 0), -40), 'late');
  assert.equal(cityMoodAt(L(2, 23, 59), -40), 'late');
  // the evening's golden hour never starts before noon, the morning never before 3 am (a sun that doesn't set)
  assert.equal(cityMoodAt(L(2, 11, 30), 5), 'day');
  assert.equal(cityMoodAt(L(2, 1, 0), 5), 'late');
  // no sun known: fixed hours
  assert.equal(cityMoodAt(L(2, 5, 0), null), 'late');
  assert.equal(cityMoodAt(L(2, 6, 0), null), 'morning');
  assert.equal(cityMoodAt(L(2, 18, 0), null), 'evening');
});

test('CITY 2.0 PARTY: the party show\'s hours (Fri + Sat 8 pm → 2 am), once the city has powered up', () => {
  const L = (dow, h, mi = 0) => ({ dow, h, mi, s: 0 });
  assert.equal(cityMoodAt(L(5, 19, 59), -20), 'evening');
  assert.equal(cityMoodAt(L(5, 20, 0), -20), 'party');
  assert.equal(cityMoodAt(L(6, 0, 30), -40), 'party', 'after midnight, Friday night');
  assert.equal(cityMoodAt(L(6, 1, 59), -40), 'party');
  assert.equal(cityMoodAt(L(6, 2, 0), -40), 'late', 'the party is over at 2 am');
  assert.equal(cityMoodAt(L(0, 1, 0), -40), 'party', 'Saturday night, after midnight');
  assert.equal(cityMoodAt(L(0, 22, 0), -40), 'evening', 'Sunday night: no party');
  assert.equal(cityMoodAt(L(4, 22, 0), -40), 'evening', 'Thursday: no party');
  // a long summer dusk at 9 pm: the sun is still up — no party music before the city has lit (harbor-dark partyReady)
  assert.equal(cityMoodAt(L(6, 21, 0), -2), 'evening');
  assert.equal(cityMoodAt(L(6, 21, 40), -8), 'party');
});

test('CITY 2.0 follows the Harbor\'s clock: the preview links (Grand Rapids)', () => {
  asCity2();
  const at = when => { cityAt(when); return moodNow(); };
  assert.equal(at('2026-10-23T08:00'), 'morning');
  assert.equal(at('2026-10-23T13:00'), 'day');
  assert.equal(at('2026-10-23T19:30'), 'evening', 'Friday 7:30 pm: before the party');
  assert.equal(at('2026-10-22T23:45'), 'late', 'a Thursday 11:45 pm');
  assert.equal(at('2026-10-23T23:45'), 'party', 'a Friday 11:45 pm is a PARTY night — the party wins over LATE NIGHT');
  assert.equal(at('2026-10-24T23:00'), 'party');
  assert.equal(at('2026-10-24T03:00'), 'late', 'Saturday 3 am: the party ended at 2');
  assert.equal(at('2026-10-25T14:00'), 'day');
  asCity1();
});

test('previews move the music: &speed= runs the Harbor\'s clock, so the mood follows', () => {
  asCity2();
  const c = skyClock(new URLSearchParams('when=2026-10-22T10:59&tz=America/Detroit&at=42.96,-85.67&speed=3600'));
  let t = c.now();
  setCityClock({ now: () => t, tz: () => c.tz, wx: () => c.wx, q: () => null });
  assert.equal(moodNow(), 'morning');
  t += 2 * 60_000;
  assert.equal(moodNow(), 'day', 'two minutes later it is 11:01');
  asCity1();
});

test('City 1.0\'s AUTO is unchanged (sunrise / 11 am / sunset / midnight; the Fridays\' 11:45 pm is a party too)', () => {
  asCity1();
  const m = s => { const k = skyClock(new URLSearchParams(`when=${s}&tz=America/New_York`)); return moodNow(k, k.now(), k.tz); };
  assert.equal(m('2026-10-20T03:00'), 'late');
  assert.equal(m('2026-10-20T08:30'), 'morning');
  assert.equal(m('2026-10-20T14:00'), 'day');
  assert.equal(m('2026-10-20T21:00'), 'evening');
  assert.equal(m('2026-10-23T21:00'), 'party');
  assert.equal(m('2026-10-24T01:00'), 'party');
});

test('MUSIC MOOD: a chosen mood wins in both cities; AUTO follows the clock; a preview\'s &mood= wins over the saved setting', () => {
  for (const two of [false, true]) {
    if (two) asCity2(); else asCity1();
    cityAt('2026-10-22T13:00');
    for (const v of MOOD_CHOICES.filter(x => x !== 'auto')) { settings.musicMood = v; assert.equal(moodNow(), v, `${two ? 'City 2.0' : 'City 1.0'}: ${v}`); assert.equal(fixedMood(), v); }
    settings.musicMood = 'auto';
    assert.equal(fixedMood(), null);
    settings.musicMood = 'nonsense';
    assert.equal(fixedMood(), null, 'an unknown value is AUTO');
  }
  asCity2(); cityAt('2026-10-22T13:00');
  setCityClock({ now: () => Date.UTC(2026, 9, 22, 17), tz: () => 'America/Detroit', wx: () => null, q: k => (k === 'mood' ? 'late' : null) });
  settings.musicMood = 'party';
  assert.equal(moodNow(), 'late', 'the panel\'s mood wins over the setting');
  setCityClock({ now: () => Date.UTC(2026, 9, 22, 17), tz: () => 'America/Detroit', wx: () => null, q: () => 'bogus' });
  assert.equal(moodNow(), 'party', 'an unknown preview mood is ignored');
  asCity1();
  assert.deepEqual(MOOD_CHOICES, ['auto', 'morning', 'day', 'evening', 'late', 'party']);
  assert.deepEqual([...MOODS].sort(), [...MOOD_IDS].sort(), 'the audio and the pure rule speak the same moods');
});

test('a failed Harbor load falls back to City 1.0 (decks and rule)', () => {
  asCity2(); assert.ok(isCity2());
  cityFailed(); assert.ok(!isCity2());
  asCity1();
});

// ---------------------------------------------------------------- the decks
const c2 = data.city2;

test('data: City 2.0 has five decks of the owner\'s songs; City 1.0\'s lists are untouched', () => {
  assert.ok(c2 && c2.moods && c2.sources, 'city2 block');
  for (const m of MOODS) assert.ok(c2.moods[m].length >= 9, `${m}: ${c2.moods[m].length} songs`);
  const before = ['late', 'morning', 'day', 'evening', 'party'];
  for (const m of before) assert.ok(data.moods[m].length >= 5 && data.moods[m].length <= 8, `City 1.0 ${m} stays 5-8`);
  for (const id of before.flatMap(m => data.moods[m])) assert.ok(!data.songs[id].c2, `${id} is City 1.0's`);
  assert.deepEqual(data.moods.late.slice(0, 2), ['late1', 'golf-rooftops'], 'City 1.0\'s late deck as it was');
});

test('data: every deck song exists, is in the song list with a grid, no repeats within a deck, no fanfares', () => {
  for (const m of MOODS) {
    assert.equal(new Set(c2.moods[m]).size, c2.moods[m].length, `${m}: no song twice`);
    for (const id of c2.moods[m]) {
      const s = data.songs[id];
      assert.ok(s, `${id} in songs`);
      assert.ok(existsSync(new URL(`audio/music/${id}.mp3`, ROOT)), `${id}.mp3 exists`);
      assert.ok(s.dur > 60 && s.bpm > 0, `${id}: dur ${s.dur} bpm ${s.bpm}`);
      assert.ok(s.grid && s.grid.bpm >= 90 && s.grid.bpm < 181 && s.grid.t0 >= 0 && [0, 1, 2, 3].includes(s.grid.down), `${id}: grid`);
      assert.ok(!/^victory/.test(id));
    }
  }
});

test('data: the owner\'s shared songs are ONE file in several decks (morning10 in MORNING + LATE NIGHT; morning4-7 in MORNING + DAY)', () => {
  assert.ok(c2.moods.morning.includes('c2-morning10') && c2.moods.late.includes('c2-morning10'), 'morning10: MORNING and LATE NIGHT');
  for (const n of [4, 5, 6, 7]) assert.ok(c2.moods.morning.includes(`c2-morning${n}`) && c2.moods.day.includes(`c2-morning${n}`), `morning${n} + day${n}: one file, both decks`);
  assert.ok(!existsSync(new URL('audio/music/c2-day4.mp3', ROOT)) && !existsSync(new URL('audio/music/c2-late-morning10.mp3', ROOT)), 'never stored twice');
  assert.ok(!existsSync(new URL('audio/music/c2-evening3.mp3', ROOT)), 'evening3 (= City 1.0\'s slip8) is never stored');
});

test('data: no City 2.0 deck holds a City 1.0 song (the owner: City 2.0 never uses City 1.0 songs)', () => {
  const city1 = new Set(Object.values(data.moods).flat());
  for (const m of MOODS) for (const id of c2.moods[m]) {
    assert.ok(data.songs[id].c2 === true, `${m}: ${id} is a City 2.0 song`);
    assert.ok(!city1.has(id), `${m}: ${id} is not in a City 1.0 list`);
  }
  assert.ok(!c2.moods.evening.includes('slip8'), 'evening3 = slip8: dropped');
  assert.ok(Object.values(c2.sources).some(s => !s.id && s.files.includes('evening/evening3.mp3')), 'the importer remembers to skip evening3');
});

test('data: every City 2.0 song is levelled to ~ -16 LUFS with a true peak under -1 dBTP, 112 kbps stereo, at most 4.3 MB', () => {
  for (const [id, s] of Object.entries(data.songs)) {
    if (!s.c2) continue;
    assert.ok(Math.abs(s.loud + 16) <= 0.5, `${id}: ${s.loud} LUFS`);
    assert.ok(s.tp <= -1.0, `${id}: true peak ${s.tp}`);
    assert.ok(statSync(new URL(`audio/music/${id}.mp3`, ROOT)).size < 4.3e6 * (s.dur > 300 ? 2 : 1), `${id}: size`);
  }
});

test('data: every City 2.0 song says whether its beat grid can be trusted (the untrusted ones are listed in docs/audio.md)', () => {
  for (const [id, s] of Object.entries(data.songs)) if (s.c2) assert.equal(typeof s.grid.trusted, 'boolean', `${id}: trusted`);
  const bad = Object.entries(data.songs).filter(([, s]) => s.c2 && !s.grid.trusted).map(([id]) => id);
  const doc = readFileSync(new URL('docs/audio.md', ROOT), 'utf8');
  for (const id of bad) assert.ok(doc.includes(id), `${id} (grid not trusted) is named in docs/audio.md`);
});

test('songsFor: City 2.0 plays its own deck, City 1.0 its own; a mood with no City 2.0 deck falls back to City 1.0\'s', () => {
  setMoodData(data);
  asCity1();
  assert.deepEqual(songsFor('late'), data.moods.late);
  asCity2();
  assert.deepEqual(songsFor('late'), c2.moods.late);
  assert.deepEqual(songsFor('party'), c2.moods.party);
  setMoodData({ ...data, city2: { moods: { ...c2.moods, party: [] } } });
  assert.deepEqual(songsFor('party'), data.moods.party, 'an empty City 2.0 deck → City 1.0\'s');
  setMoodData(null);
  assert.deepEqual(songsFor('late'), [], 'no list loaded yet');
  asCity1();
});

test('the shuffle: each song once before any repeats, never the same song twice in a row — across reshuffles AND across moods that share songs', () => {
  setMoodData(data);
  asCity2();
  mem.clear();
  for (const m of MOODS) {
    const ids = c2.moods[m], seen = [];
    let last = null;
    for (let k = 0; k < ids.length * 4; k++) { const id = nextForDevice(m, last); assert.notEqual(id, last, `${m}: ${id} twice running`); seen.push(id); last = id; }
    for (let c = 0; c < 3; c++) assert.equal(new Set(seen.slice(c * ids.length, (c + 1) * ids.length)).size, ids.length, `${m}: cycle ${c} plays every song once`);
  }
  // morning → day: the shared songs (morning4-7) never follow themselves when the mood changes at a song's end
  let last = 'c2-morning5';
  for (let k = 0; k < 300; k++) { const m = k % 3 === 0 ? 'morning' : 'day'; const id = nextForDevice(m, last); assert.notEqual(id, last); last = id; }
  assert.ok(mem.has('nd:moodbag:c2:morning') && !mem.has('nd:moodbag:morning'), 'City 2.0 keeps its own bags');
  asCity1();
  setMoodData(null);
});

test('MUSIC_BASE: the songs\' location is one setting (js/config.js); empty = this site\'s audio/music/', async () => {
  const { musicUrl } = await import('../js/audio/music-url.js');
  const { MUSIC_BASE } = await import('../js/config.js');
  assert.equal(MUSIC_BASE, '', 'shipped with the songs in the repo');
  assert.ok(musicUrl('c2-morning1').endsWith('/audio/music/c2-morning1.mp3'));
  assert.ok(musicUrl('menu2', '?v=2').endsWith('/audio/music/menu2.mp3?v=2'));
  const src = readFileSync(new URL('../js/audio/music-url.js', import.meta.url), 'utf8') + readFileSync(new URL('../js/audio/music.js', import.meta.url), 'utf8') + readFileSync(new URL('../js/audio/lobby-music.js', import.meta.url), 'utf8');
  assert.ok(!/new URL\(`[^`]*audio\/music\/\$\{(FILES\[id\]|id)\}/.test(src.replace(/music-url[^]*?\n\n/, '')), 'no player builds a music URL by itself');
});
