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

test('FP — THE BED under the music: the water far + soft (−~10 dB, a low-pass) under the city hum; ducked while the music is on, held until the song sounds (at most a few s), never louder than the music at the start', async () => {
  const { bedMix, BED_DUCK, BED_WAIT_MS, BED_FADE_IN } = await import('../js/core/city-sounds.js');
  const w = slotOf('water-lapping'), day = slotOf('city-hum-day'), night = slotOf('city-hum-night');
  // the water's level into the bus: the file (−24.1 LUFS) + its gain + the low-pass (−4.8 LU, measured with ffmpeg's ebur128) vs 8a's 0.125 unfiltered
  const was = 20 * Math.log10(0.125), now = 20 * Math.log10(w.gain) - 4.8;
  assert.ok(was - now >= 8 && was - now <= 11, `the water ${(now - was).toFixed(1)} dB (8–10 asked)`);
  assert.ok(w.lp >= 1000 && w.lp <= 2500, 'softer highs: a low-pass round 1.6 kHz');
  assert.ok(20 * Math.log10(day.gain) > 20 * Math.log10(w.gain) - 4.8 + 6 && 20 * Math.log10(night.gain) > 20 * Math.log10(w.gain) - 4.8 + 4, 'the city hum LEADS the bed (day + night)');
  assert.equal(slotOf('city-hum-day').lp, undefined, 'only the water is filtered');
  // the duck + the hold
  assert.deepEqual(bedMix({ musicOn: false }), { k: 1, hold: false }, 'music off: the bed is the main sound');
  assert.ok(BED_DUCK < 0.8 && BED_DUCK > 0.5, 'music on: ~−3 dB more');
  assert.deepEqual(bedMix({ musicOn: true, sounding: false, sinceMs: 1000 }), { k: BED_DUCK, hold: true }, 'music on but not sounding yet: wait (never louder than the music before it begins)');
  assert.equal(bedMix({ musicOn: true, sounding: true, sinceMs: 1000 }).hold, false, 'the song sounds: the bed comes in');
  assert.equal(bedMix({ musicOn: true, sounding: false, sinceMs: BED_WAIT_MS + 1 }).hold, false, 'a song that never loads never keeps the city silent');
  assert.equal(bedMix({ musicOn: true, sounding: false, sinceMs: 100, started: true }).hold, false, 'once started, a gap between songs never stops it');
  assert.ok(BED_FADE_IN >= 4, 'it fades in slowly');
  // the whole bed with the music on: ≥ 12 dB under the default music (≈ −34 LUFS out) — the hum −24.1 LUFS file, the Effects slider −6.2
  const out = (lufs, g, extra = 0) => lufs + 20 * Math.log10(g * BED_DUCK) + extra - 6.2;
  const sum = (...l) => 10 * Math.log10(l.reduce((a, v) => a + 10 ** (v / 10), 0));
  const bedOn = sum(out(-24.1, day.gain), out(-24.1, w.gain, -4.8));
  assert.ok(-34 - bedOn >= 12, `the day bed with the music on ${bedOn.toFixed(1)} LUFS out: ${(-34 - bedOn).toFixed(1)} dB under the music`);
  // the car: gentle under the music (8a: ≈ 4 dB under at its nearest with 0.12)
  assert.ok(slotOf('car-1920s-pass').gain <= 0.1, 'the car a step quieter than 8a');
});

test('FP — THE GULLS: mostly one call, now and then two or three in a row, the levels / pitches / gaps uneven — never a pattern', async () => {
  const { gullCalls, gullGap } = await import('../js/core/city-sounds.js');
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = { 1: 0, 2: 0, 3: 0 }, gaps = [], inGaps = new Set();
  for (let i = 0; i < 2000; i++) {
    const c = gullCalls(rnd, 0.2);
    n[c.length]++;
    assert.ok(c.length >= 1 && c.length <= 3 && c[0].delay === 0);
    for (let j = 1; j < c.length; j++) { const d = c[j].delay - c[j - 1].delay; assert.ok(d >= 0.35 && d <= 2.1, `a natural gap ${d}`); inGaps.add(d.toFixed(2)); }
    for (const x of c) assert.ok(x.gain >= 0.5 && x.gain <= 1 && x.rate >= 0.95 && x.rate <= 1.05 && Math.abs(x.pan) <= 0.85);
    gaps.push(gullGap(1, rnd, c.length));
  }
  assert.ok(n[1] > 0.55 * 2000 && n[1] < 0.78 * 2000, `mostly single calls (${n[1]})`);
  assert.ok(n[2] > 0.12 * 2000 && n[3] > 0.04 * 2000 && n[3] < n[2], `now and then two (${n[2]}) or three (${n[3]})`);
  assert.ok(inGaps.size > 50, 'the gaps inside a run never repeat a rhythm');
  const s = gaps.slice().sort((a, b) => a - b);
  assert.ok(s[0] >= 14000 && s[s.length - 1] <= 66000 + 8000, `between moments 14–74 s (${s[0]}…${s[s.length - 1]})`);
  assert.ok(s[s.length >> 1] < 40000, 'skewed toward the shorter end');
  assert.ok(new Set(gaps.map(g => Math.round(g / 1000))).size > 40, 'never a fixed interval');
  assert.ok(gullGap(0.5, () => 0.5) > gullGap(1, () => 0.5), 'fewer gulls, fewer calls');
});

test('FP — THE DEBUG TOOLS: the readout + the AUDIO panel switched on this device (remembered; &debug=1 still shows both; a switch this visit wins)', async () => {
  const mem = new Map();
  globalThis.localStorage = { getItem: k => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)) };
  const T = await import('../js/ui/debug-tools.js');
  assert.deepEqual(T.DEBUG_TOOLS, ['readout', 'audio']);
  assert.equal(T.debugTool('readout', false), false, 'off by default');
  assert.equal(T.debugTool('readout', true), true, '&debug=1 shows it');
  const seen = []; const off = T.onDebugTools((id, on) => seen.push(`${id}:${on}`));
  T.setDebugTool('audio', true);
  assert.equal(T.debugTool('audio', false), true, 'on without the link');
  assert.deepEqual(JSON.parse(mem.get('na:dbgtools')), { audio: true }, 'remembered on this device');
  T.setDebugTool('readout', false);
  assert.equal(T.debugTool('readout', true), false, 'switched off this visit: wins over &debug=1');
  T.setDebugTool('nope', true);
  assert.deepEqual(seen, ['audio:true', 'readout:false'], 'listeners told; unknown ids ignored');
  off();
});
