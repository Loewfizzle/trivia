// PART 8a — THE CITY SOUNDS (docs/audio.md#the-city-sounds): the slot registry, the imported recordings, an empty slot is silent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const ROOT = new URL('..', import.meta.url);
const { SLOTS, PARTS, slotOf, takesOf, isFilled, filledSlots, pickTake, checkSlots } = await import('../js/core/city-sounds.js');
const { FILES } = await import('../js/core/city-sounds-files.js');

test('every slot: a unique kebab-case id, a known part, loop | once, a mix level, what it is — the registry\'s own checks', () => {
  assert.deepEqual(checkSlots(), []);
  const ids = SLOTS.map(s => s.id);
  assert.equal(new Set(ids).size, ids.length, 'unique');
  for (const id of ids) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, id);
  for (const p of PARTS) assert.ok(SLOTS.some(s => s.part === p.id), `${p.id}: has slots`);
  // the owner's hunt list (docs/harbor/plan.md) + the plan's examples are all there
  for (const id of ['club-murmur-calm', 'club-murmur-party', 'door-heavy', 'cat-meow', 'tv-murmur', 'police-car-1920s', 'siren-1920s', 'water-lapping',
    'city-hum-day', 'city-hum-night', 'traffic-far', 'car-1920s-pass', 'bus-brake-hiss', 'bus-idle', 'bus-pull-away', 'ships-bell', 'steam-whistle', 'ship-horn',
    'gulls', 'dog-bark', 'market-murmur', 'milk-bottles', 'truck-delivery', 'trash-truck', 'flag-flap', 'birdsong-morning', 'crickets-night', 'wind-leaves',
    'wind-winter', 'snow-hush', 'foghorn', 'rain-pavement', 'rain-water', 'firework-launch', 'firework-burst', 'firework-burst-far', 'firework-crackle',
    'crowd-cheer', 'party-yacht-music', 'helicopter-landing', 'helicopter', 'airliner-far', 'prop-plane', 'jet-flyby', 'balloon-burner', 'geese', 'ufo-hum',
    'ufo-beam', 'tr3b-drone', 'tr3b-crackle', 'tr3b-power-down', 'witch-cackle', 'sleigh-bells', 'tower-siren', 'tower-horn', 'implosion-charges',
    'implosion-rumble', 'hammering', 'crane', 'ghost-ship-creak', 'ghost-bell', 'monster-splash']) assert.ok(slotOf(id), `slot ${id}`);
});

test('the first recordings (Part 8a) fill their slots; everything else is empty', () => {
  assert.deepEqual(filledSlots().sort(), ['car-1920s-pass', 'city-hum-day', 'city-hum-night', 'gulls', 'truck-delivery', 'water-lapping']);
  assert.equal(takesOf('car-1920s-pass').length, 4, 'two Volvo passes + the MG (rare) + the truck');
  assert.equal(takesOf('gulls').length, 4);
  assert.equal(takesOf('truck-delivery')[0].f, 'car-1920s-pass-3.mp3', 'the delivery truck shares the 1945 truck\'s take');
  assert.ok(takesOf('car-1920s-pass').find(t => t.src === 'car-1920s-pass-2').w < 0.3, 'the 1954 MG is a rare take');
});

test('every take points at a real, small file whose content matches its cache key; loops carry their loop + tail', () => {
  for (const [id, takes] of Object.entries(FILES)) {
    const s = slotOf(id);
    for (const t of takes) {
      const u = new URL(`audio/city/${t.f}`, ROOT);
      assert.ok(existsSync(u), `${t.f} exists`);
      const bytes = readFileSync(u);
      assert.ok(bytes.length < 1.5e6, `${t.f}: ${(bytes.length / 1e6).toFixed(2)} MB ≤ 1.5 MB`);
      assert.equal(createHash('md5').update(bytes).digest('hex').slice(0, 8), t.v, `${t.f}: ?v= is its content (re-run the importer after replacing a file)`);
      assert.ok(t.lufs < -18 && t.lufs > -27, `${t.f}: levelled (${t.lufs} LUFS)`);
      if (s.kind === 'loop') {
        assert.ok(t.loop >= 30 && t.xf >= 2 && t.xf <= 3, `${t.f}: a 30 s+ loop with a 2–3 s seam`);
        assert.ok(Math.abs(t.loop + t.xf - t.d) < 0.1, `${t.f}: the file is the loop + its tail`);
      } else assert.ok(t.peak >= 0 && t.peak <= t.d, `${t.f}: its loudest moment is inside it`);
    }
  }
  const total = Object.values(FILES).flat().filter((t, i, a) => a.findIndex(x => x.f === t.f) === i).reduce((n, t) => n + statSync(new URL(`audio/city/${t.f}`, ROOT)).size, 0);
  assert.ok(total < 4e6, `audio/city/ ${(total / 1e6).toFixed(2)} MB`);
  // the cuts left out what had to go: the night hum starts after the church bells (≤ 63 s), the car passes are the clean ones
  assert.ok(takesOf('city-hum-night')[0].from[0] > 70, 'no church bells in the night hum');
  assert.ok(takesOf('city-hum-night')[0].from[1] < 190, '… nor the chirps at 193–203 s');
});

test('pickTake: weighted, never the same take twice running; an empty slot gives nothing', () => {
  assert.equal(pickTake('cat-meow'), null);
  assert.equal(pickTake('no-such-slot'), null);
  assert.deepEqual(takesOf('cat-meow'), []);
  assert.equal(isFilled('cat-meow'), false);
  let last = -1, n = 0;
  const seen = new Map();
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 4000; i++) {
    const p = pickTake('car-1920s-pass', rnd, last);
    assert.notEqual(p.i, last, 'never the same twice running');
    seen.set(p.take.src, (seen.get(p.take.src) || 0) + 1);
    last = p.i; n++;
  }
  assert.ok(seen.get('car-1920s-pass') > seen.get('car-1920s-pass-3') && seen.get('car-1920s-pass-3') > seen.get('car-1920s-pass-2'), `weighted: ${JSON.stringify([...seen])}`);
  assert.equal(pickTake('water-lapping').i, 0, 'a single take');
});

test('an EMPTY slot is silent: citySound → null, cityLoop → a handle that does nothing; a filled slot with audio locked → null, no throw', async () => {
  const { citySound, cityLoop, cityPreview, citySoundsDebug } = await import('../js/audio/city-sound.js');
  assert.equal(citySound('cat-meow'), null);
  assert.equal(citySound('nope'), null);
  const h = cityLoop('club-murmur-calm', { gain: 1 });
  assert.equal(h.silent, true);
  assert.doesNotThrow(() => { h.set({ gain: 0.5, pan: 0.2 }); h.stop(1); });
  assert.equal(h.playing(), false);
  assert.equal(cityPreview('cat-meow').why, 'empty');
  // (node: no AudioContext — the engine was never unlocked)
  assert.equal(citySound('gulls'), null, 'locked: nothing, quietly');
  const l = cityLoop('water-lapping');
  assert.doesNotThrow(() => { l.set({ gain: 0.3 }); l.stop(0.1); });
  assert.match(cityPreview('gulls').why, /tap|locked/);
  assert.deepEqual(citySoundsDebug().loops, []);
});

test('the importer reads the same slot ids as the registry (scripts/add-city-sfx.py#read_slots)', () => {
  const src = readFileSync(new URL('js/core/city-sounds.js', ROOT), 'utf8');
  const ids = [...src.matchAll(/S\('([a-z0-9-]+)',\s*'([^']+)',\s*'(loop|once)'/g)].map(m => m[1]);
  assert.deepEqual(ids, SLOTS.map(s => s.id));
});
