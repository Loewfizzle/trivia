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

test('the first recordings (Part 8a) + the sky (Oct 24) + the speakeasy + people (8P) + the life + workers + wildlife (6b) fill their slots; everything else is empty', () => {
  assert.deepEqual(filledSlots().sort(), ['airliner-far', 'balloon-burner', 'bar-open', 'boat-putter', 'broom-sweep', 'bus-arrive', 'bus-door', 'bus-idle', 'bus-pull-away', 'car-1920s-pass',
    'cart-bell', 'cat-land', 'cat-meow', 'city-hum-day', 'city-hum-night', 'club-murmur-calm', 'club-murmur-party', 'coyote-howl', 'coyote-yip', 'crates-clink', 'crowd-clap',
    'crowd-whoop', 'dog-bark', 'door-heavy', 'door-heavy-close', 'door-knock', 'drone-swarm', 'footsteps-cobble', 'footsteps-heels', 'geese', 'glasses-clink',
    'glow-wand-swish', 'gulls', 'helicopter', 'hydrant-spray', 'jet-flyby', 'jogger-trip', 'ladder-clank', 'laugh-distant', 'line-murmur', 'market-murmur', 'milk-bottles', 'newspaper-rustle', 'periscope-ping',
    'pigeon-coo', 'pigeon-flutter', 'police-car-1920s', 'police-whistle', 'power-failure', 'power-restore', 'prop-plane', 'roller-blind', 'rooftop-party', 'scissors-snip', 'ship-horn', 'ships-bell', 'shop-bell',
    'siren-1920s', 'squeegee', 'squirrel-chatter', 'steam-whistle', 'street-door', 'street-door-close', 'tr3b-crackle', 'tr3b-drone', 'tr3b-power-down', 'tr3b-presence', 'trash-can-lid',
    'trash-truck-arrive', 'trash-truck-depart', 'truck-delivery', 'tv-murmur', 'ufo-beam', 'ufo-hum', 'water-lapping', 'window-sash-down', 'window-sash-up',
    // (9a — THE WEATHER's sounds)
    'birdsong-morning', 'crickets-night', 'foghorn', 'gutter-drip', 'rain-awning', 'rain-drizzle', 'rain-pavement', 'rain-water', 'thunder-far', 'wind-leaves',
    // (11a-1 — HALLOWEEN: the witch, the ghost ship, the haunted wind + the black cat's synthesized hiss)
    'cat-hiss', 'ghost-bell', 'ghost-ship-creak', 'haunted-wind', 'witch-cackle',
    // (11a-2 — THANKSGIVING + THE PARADE: the crowd (kids + the adult murmur, one loop), the cheer, the band (a one-shot pass), the
    // balloon's fabric, the raker, a short V of geese)
    'parade-crowd', 'parade-cheer', 'parade-band', 'balloon-flap', 'leaves-rake', 'geese-v',
    // (9b — WINTER: the snow's hush at night, the shovel)
    'snow-hush', 'snow-shovel',
    // (9e — SUNDAY's BELLS + THE CONSTRUCTION TOWER's crane, hammering, the implosion's rumble + the warning horn)
    'church-bells', 'crane', 'hammering', 'implosion-rumble', 'tower-horn',
    // (9f — the tower's CC0 alternates: the siren's own wail, the rivet gun + the crane lift layered over the beds)
    'crane-lift', 'rivet-gun', 'tower-siren',
    // (9g — THE UFO's REAL SOUNDS: the hover's spin-up + down, the beam's on / idle / off, the lift, the departure, the crowd fleeing)
    'ufo-hum-up', 'ufo-hum-down', 'ufo-beam-on', 'ufo-beam-idle', 'ufo-beam-off', 'ufo-lift', 'ufo-depart', 'crowd-flee'].sort());
  assert.ok(takesOf('tower-horn')[0].src === 'tower-horn-2' && takesOf('tower-horn').some(x => x.w === 0), '9f: the new horn the default, the old one a BACKUP take (weight 0)');
  for (let i = 0; i < 20; i++) assert.equal(pickTake('tower-horn', Math.random, 0).take.src, 'tower-horn-2', '9f: a backup take is never picked');
  // 11a-2: the crowd's loop + tail end before the kids' "Bye!" (30 s); the band is a one-shot pass that stops well before the disc's end
  // thump (~241 s); the murmur is laid inside the crowd, never a take; the 5.1 cheer + the 78 were decoded through their own `af`
  assert.ok(takesOf('parade-crowd')[0].from[1] <= 30.0, '11a-2: the crowd loop never reaches the "Bye!"');
  assert.ok(slotOf('parade-band').kind === 'once' && takesOf('parade-band')[0].from[1] < 200, '11a-2: the band, a one-shot far from the end thump');
  assert.ok(Object.values(FILES).flat().every(t => t.src !== 'parade-crowd-2'), '11a-2: the murmur is a layer, not a take');
  for (const id of ['parade-crowd', 'balloon-flap', 'leaves-rake']) assert.ok(slotOf(id).gain <= 0.05, `11a-2: ${id} a quiet bed (the brief's −30 LUFS)`);
  // (8b1 — Grok's second try: the TV window's walla (indistinct, through glass), the old truck's arrival + departure, the TR-3B heard on a phone)
  assert.ok(takesOf('tv-murmur')[0].src === 'tv-murmur-2' && takesOf('tv-murmur')[0].r === 16000, '8b1: the second try fills the TV window');
  assert.ok(takesOf('trash-truck-arrive')[0].hit > 10 && takesOf('trash-truck-depart')[0].hit > 10, '8b1: the truck stops / pulls out at its `hit`');
  assert.equal(isFilled('bus-brake-hiss'), false, 'an air brake is post-1920s');
  // 6b: the owner's calls — modern traffic, a standing modern diesel (no arrival / departure in it): left empty
  for (const id of ['traffic-far', 'trash-truck']) assert.equal(isFilled(id), false, `6b: ${id} left empty`);
  assert.ok(takesOf('police-car-1920s').length === 2 && takesOf('police-car-1920s').every(t => t.src === 'car-1920s-pass'), '6b: the police cars are the 1929 Volvo’s whole passes');
  assert.ok(takesOf('market-murmur')[0].from[1] <= 88, '6b: the market never uses 88–98 s (voices)');
  assert.ok(slotOf('siren-1920s').gain < 0.06 && slotOf('police-whistle').gain < 0.06 && takesOf('siren-1920s').every(t => t.r === 16000), '6b: the siren + the whistle far + soft');
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
      // (8P: the scissors' snips are all transient — the limiter stops them at ≈ −28 LUFS; their slot gain makes up for it)
      assert.ok(t.lufs < -18 && t.lufs > (s.kind === 'once' ? -30 : -27), `${t.f}: levelled (${t.lufs} LUFS)`);
      if (s.kind === 'loop') {
        // (beds 30 s+; 8P's smaller beds — heard less often or under the music — 20 s+; the bus's idle a short engine loop)
        const min = { 'ufo-beam-idle': 24, 'ufo-hum': 26, 'bus-idle': 2, 'broom-sweep': 20, 'line-murmur': 20, 'rooftop-party': 20, 'market-murmur': 20, 'tv-murmur': 15, 'tr3b-presence': 28, 'birdsong-morning': 24, 'wind-leaves': 20, 'gutter-drip': 25, 'haunted-wind': 24, 'ghost-ship-creak': 28, 'parade-crowd': 27, 'leaves-rake': 18, 'rivet-gun': 28, 'snow-hush': 20 }[id] ?? 30;   // (11a-2: the kids' file is 31 s, the rake's 22 s)   // (9a: the birdsong's source is 32 s, the leaves' clean stretch 24 s, the drips 33 s)   // (8b1: the TV's steady half + the TR-3B's 33 s hum)
        // (9f: the rivet gun's seam sat in natural gaps — the owner's 100–200 ms; 9g: the UFO hover A's 0.2 s seam on its pulse (Grok's
        // 0.1–0.2 s), the beam's idle 1.5 s)
        const xfMin = { 'ufo-hum-2.mp3': 0.15, 'ufo-beam-idle.mp3': 1.0 }[t.f] ?? (min < 20 ? 0.5 : 2);
        assert.ok(t.loop >= min && t.xf >= xfMin && t.xf <= 3,
           `${t.f}: a ${min} s+ loop with its seam (${t.loop} + ${t.xf})`);
        assert.ok(Math.abs(t.loop + t.xf - t.d) < 0.1, `${t.f}: the file is the loop + its tail`);
      } else assert.ok(t.peak >= 0 && t.peak <= t.d, `${t.f}: its loudest moment is inside it`);
    }
  }
  const total = Object.values(FILES).flat().filter((t, i, a) => a.findIndex(x => x.f === t.f) === i).reduce((n, t) => n + statSync(new URL(`audio/city/${t.f}`, ROOT)).size, 0);
  // (8a's bed + car + gulls 2.35 MB; the sky +3.19 MB — 16 files, the same lean encode: mono 32 kHz 64 kbps; 8P +1.65 MB — 43 files,
  // the low-passed beds at 40 kbps: 7.2 MB in all; 6b's life + workers + wildlife +2.05 MB — 54 files, the long police passes + the
  // siren the biggest: 9.2 MB. Only what plays is ever fetched)
  // (8b1: + the second-try set 1.0 MB → 10.3 MB)
  // (9a: 11 → 13 MB — the weather's 1.8 MB (lean: 22 / 16 kHz, 40–48 kbps); every slot is fetched only when its event plays)
  // (11a-1: + Halloween's five, lean like the weather: 12.84 MB)
  // (11a-2: + Thanksgiving + the parade, lean — 16 kHz decode, 40–48 kbps; the band's 90 s pass the biggest at 440 KB: 13.93 MB)
  // (9e: + Sunday's bells + the tower's crane, hammering, rumble + horn — 24 kHz, 40–56 kbps, ~0.96 MB: 15.23 MB; fetched only when they play)
  // (9f: + the tower's CC0 alternates — the siren, the horn, the rivet gun's loop, the crane lift (16 kHz / 40 kbps) ~0.6 MB: ~15.85 MB)
  // (9g: + THE UFO SET — the hover A + B + its spin-up / down, the beam's three, the lift, the departure A + B, the crowd (24 kHz / 64 kbps)
  // ~1.1 MB, the brief's ~2 MB budget; the rivet's four bursts replace its loop; HORN C: ~16.8 MB)
  assert.ok(total < 17.2e6, `audio/city/ ${(total / 1e6).toFixed(2)} MB`);
  // the cuts left out what had to go: the night hum starts after the church bells (≤ 63 s), the car passes are the clean ones
  assert.ok(takesOf('city-hum-night')[0].from[0] > 70, 'no church bells in the night hum');
  assert.ok(takesOf('city-hum-night')[0].from[1] < 190, '… nor the chirps at 193–203 s');
});

test('pickTake: weighted, never the same take twice running; an empty slot gives nothing', () => {
  assert.equal(pickTake('sleigh-bells'), null);
  assert.equal(pickTake('no-such-slot'), null);
  assert.deepEqual(takesOf('sleigh-bells'), []);
  assert.equal(isFilled('sleigh-bells'), false);
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
  assert.equal(citySound('sleigh-bells'), null);
  assert.equal(citySound('nope'), null);
  const h = cityLoop('traffic-far', { gain: 1 });
  assert.equal(h.silent, true);
  assert.doesNotThrow(() => { h.set({ gain: 0.5, pan: 0.2 }); h.stop(1); });
  assert.equal(h.playing(), false);
  assert.equal(cityPreview('sleigh-bells').why, 'empty');
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
