// FP3 — THE MOTORCAR IN SYNC WITH ITS SOUND + THE SKY SOUNDS (docs/audio.md#fp3, #the-sky-sounds): the pure parts — the pass's own
// take, the sound placed on the clock (its peak on the car's centre whatever the wait for its file), the car's speed from the
// take's swell, the pan from its x; the sky's recordings in their slots, levels under the bed, the flybys' chaining.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const CS = await import('../js/core/city-sounds.js');
const { takesOf, slotOf, takeAt, crossFor, carPre, syncStart, panOf, chainDue, CAR_CROSS, CAR_LEAD, CAR_PAN, duckAt, sweepPan, momentCues, MOMENT_CUES,
  barberAt, bellsBetween, BARBER_CYCLE } = CS;
const { cameraFor, harborLayout } = await import('../js/core/harbor-layout.js');
const { roadPassAt, ROAD_PASS, carAt, carSpeed } = await import('../js/core/harbor-promenade.js');

test('FP3 — each car take carries its measured PEAK (the loudest 0.3 s of its RMS envelope) + its SWELL; the car crosses within it', () => {
  const takes = takesOf('car-1920s-pass');
  assert.equal(takes.length, 4);
  // measured (scripts/add-city-sfx.py#swell, on the encoded files): the Volvo passes ~8.6 / 9.4 s, the MG 9.45, the truck 9.35
  const want = { 'car-1920s-pass_1.mp3': 8.65, 'car-1920s-pass_2.mp3': 9.35, 'car-1920s-pass-2.mp3': 9.45, 'car-1920s-pass-3.mp3': 9.35 };
  for (const t of takes) {
    assert.ok(Math.abs(t.peak - want[t.f]) < 0.15, `${t.f}: peak ${t.peak} s (measured ${want[t.f]})`);
    assert.ok(Array.isArray(t.sw) && t.sw[0] < t.peak && t.peak < t.sw[1] && t.sw[1] <= t.d, `${t.f}: its swell ${t.sw} round the peak`);
    const c = crossFor(t);
    assert.ok(c >= CAR_CROSS[0] && c <= CAR_CROSS[1], `${t.f}: crosses in ${c} s`);
  }
  // the Volvo (the everyday take) crosses in ~4 s — its swell; the MG (a quick sporty pass) is clamped up, the truck (a slow, broad
  // swell) clamped down
  assert.ok(Math.abs(crossFor(takes.find(t => t.f === 'car-1920s-pass_1.mp3')) - 4.25) < 0.3);
  assert.equal(crossFor(takes.find(t => t.f === 'car-1920s-pass-2.mp3')), CAR_CROSS[0]);
  assert.equal(crossFor(takes.find(t => t.f === 'car-1920s-pass-3.mp3')), CAR_CROSS[1]);
  assert.equal(crossFor(null), null);
  assert.equal(crossFor({ peak: 3 }), null, 'no swell → the old speed');
});

test('FP3 — takeAt: the pass\'s take from its clock number — the same on every phone, weighted like pickTake', () => {
  const n = new Map();
  for (let i = 0; i < 10000; i++) {
    const u = i / 10000, a = takeAt('car-1920s-pass', u), b = takeAt('car-1920s-pass', u);
    assert.equal(a.i, b.i);
    n.set(a.take.f, (n.get(a.take.f) || 0) + 1);
  }
  const w = takesOf('car-1920s-pass').reduce((s, t) => s + (t.w ?? 1), 0);
  for (const t of takesOf('car-1920s-pass')) assert.ok(Math.abs(n.get(t.f) / 10000 - (t.w ?? 1) / w) < 0.01, `${t.f}: ${n.get(t.f)} of 10000 (weight ${t.w ?? 1})`);
  assert.equal(takeAt('siren-1920s', 0.5), null, 'an empty slot');
  assert.ok(takeAt('car-1920s-pass', 1).i >= 0 && takeAt('car-1920s-pass', -3).i === 0 && takeAt('car-1920s-pass', NaN).i === 0, 'out-of-range numbers still pick');
});

test('FP3 — syncStart: the take\'s peak sounds on the clock whatever the wait for its file; joined part-way when late, silent when too late', () => {
  const t = { peak: 9, d: 18.5 };
  assert.deepEqual(syncStart(t, 12), { delay: 3, offset: 0, fade: 0 }, 'early: waits, plays from its start');
  assert.deepEqual(syncStart(t, 9), { delay: 0, offset: 0, fade: 0 }, 'exactly on time');
  assert.deepEqual(syncStart(t, 6), { delay: 0, offset: 3, fade: 0.8 }, 'late by 3 s: joins 3 s in, faded in');
  assert.equal(syncStart(t, 0.5), null, 'the peak under a second away: silent (never out of sync)');
  assert.equal(syncStart(t, -4), null, 'the car has passed: silent');
  // pre: only the last `pre` s before the peak (the sound starts just before the car enters)
  assert.deepEqual(syncStart(t, 9, { pre: 3.6 }), { delay: 5.4, offset: 5.4, fade: 0.8 });
  assert.deepEqual(syncStart(t, 2, { pre: 3.6 }), { delay: 0, offset: 7, fade: 0.8 });
  // THE BUG (the owner's iPhone): the old player started the take whenever its file was ready — every second of waiting put the
  // peak (the car's sound at its nearest) that much after the car. Now, for any wait, the peak lands on the centre (or it's silent)
  const center = 9;                                                   // s after the pass is first seen
  for (const take of takesOf('car-1920s-pass')) {
    for (let wait = 0; wait <= 12; wait += 0.25) {
      const peakIn = center - wait, pre = carPre(crossFor(take)), p = syncStart(take, peakIn, { pre });
      const oldPeakAt = wait + take.peak;
      if (wait > 1.5) assert.ok(oldPeakAt - center > 1, 'the old way: late by the wait');
      if (!p) { assert.ok(peakIn < 1, `${take.f}: silent only when the peak is < 1 s away (wait ${wait})`); continue; }
      const peakAt = wait + p.delay + (take.peak - p.offset);
      assert.ok(Math.abs(peakAt - center) < 1e-3, `${take.f}, ${wait} s late: its peak at ${peakAt.toFixed(3)} s, the car's centre ${center}`);
      assert.ok(take.peak - p.offset <= pre + 1e-9, 'never more than `pre` before the peak');
    }
  }
  assert.equal(syncStart(null, 3), null);
  assert.equal(syncStart(t, NaN), null);
});

test('FP3 — the car crosses the visible street WITHIN its take\'s swell, nearest at the centre; the sound starts just before it enters', () => {
  for (const [W, H] of [[390, 844], [402, 874], [430, 932], [1440, 900]]) {
    const cam = cameraFor(W, H, {}, { top: 62, bottom: 34 }), st = harborLayout(cam).impliedRoad.street;
    for (const take of takesOf('car-1920s-pass')) {
      const cross = crossFor(take), pass = roadPassAt(0, () => 12, { force: true }), center = pass.t0 + ROAD_PASS.peak;
      let first = null, last = null;
      for (let ms = center - 10e3; ms <= center + 10e3; ms += 10) if (carAt(pass, center, ms, cam, st, cross).on) { if (first == null) first = ms; last = ms; }
      const on = (last - first) / 1000;
      assert.ok(Math.abs(on - cross) < 0.05, `${W}x${H} ${take.f}: on screen ${on.toFixed(2)} s = its crossing ${cross} s`);
      assert.ok(Math.abs((first + last) / 2 - center) < 15, 'nearest (mid-crossing) at the centre — the take\'s peak');
      const enter = (center - first) / 1000, pre = carPre(cross);
      assert.ok(Math.abs(pre - enter - CAR_LEAD) < 0.05, `the sound begins ${CAR_LEAD} s before the car enters (${pre.toFixed(2)} s before the peak)`);
      const z = (pass.dir < 0 ? st.lanes[0] : st.lanes[1]).z;
      assert.ok(Math.abs(carAt(pass, center, center + 1000, cam, st, cross).speed - carSpeed(cam, z, cross)) < 1e-9);
    }
    // an empty slot (no take): FP2's speed, unchanged
    const pass = roadPassAt(0, () => 12, { force: true }), z = st.lanes[1].z;
    assert.ok(Math.abs(carAt(pass, 0, 0, cam, st).speed - (cam.hw(z) + 14) * 2 / 9) < 1e-9);
  }
});

test('FP3 — the pan follows the car: smooth, gentle (±0.6), left → right with a car driving right', () => {
  assert.equal(panOf(0, 10), 0);
  let prev = -1;
  for (let x = -40; x <= 40; x += 0.5) { const p = panOf(x, 10); assert.ok(p >= prev && Math.abs(p) <= CAR_PAN + 1e-9); prev = p; }
  assert.ok(panOf(10, 10) > 0.4 && panOf(10, 10) < 0.5, 'at the screen\'s edge ~0.46');
  assert.ok(panOf(1e6, 10) <= 0.6 && panOf(-1e6, 10) >= -0.6, 'never past ±0.6');
  assert.equal(panOf(-5, 10), -panOf(5, 10));
  // a car driving right (dir +1) pans from left to right over its pass
  const cam = cameraFor(402, 874, {}, { top: 62, bottom: 34 }), st = harborLayout(cam).impliedRoad.street;
  const pass = { ...roadPassAt(0, () => 12, { force: true }), dir: 1 };
  const cross = crossFor(takesOf('car-1920s-pass')[2]), z = st.lanes[1].z, at = ms => panOf(carAt(pass, 0, ms, cam, st, cross).x, cam.hw(z));
  assert.ok(at(-4000) < -0.45 && at(0) === 0 && at(4000) > 0.45, `${at(-4000)} → ${at(0)} → ${at(4000)}`);
});

test('THE SKY SOUNDS: every recording in its slot, cut as measured — flybys are one-shots, the hums seamless loops, nothing modern left in', () => {
  const one = id => takesOf(id), f = id => one(id).map(t => t.f).sort();
  assert.deepEqual(f('helicopter'), ['heli-flyby-2.mp3', 'heli-flyby.mp3']);
  assert.deepEqual(f('airliner-far'), ['airliner-high.mp3']);
  assert.deepEqual(f('prop-plane'), ['prop-plane.mp3']);
  assert.deepEqual(f('jet-flyby'), ['jets-formation.mp3']);
  assert.equal(one('balloon-burner').length, 5, 'the burner\'s five bursts');
  assert.deepEqual(f('geese'), ['geese.mp3']);
  for (const id of ['drone-swarm', 'ufo-hum', 'tr3b-drone']) assert.equal(slotOf(id).kind, 'loop', id);
  for (const id of ['helicopter', 'airliner-far', 'prop-plane', 'jet-flyby', 'balloon-burner', 'geese', 'ufo-beam', 'tr3b-power-down']) assert.equal(slotOf(id).kind, 'once', id);
  // the cuts (source seconds): the airliner before the leaves + wind took over; the jets' formation, not the lone jet before it;
  // the geese's flock overhead; the TR-3B's turbine CUT (134.75 s), not the rotor wash at 12–32 s
  assert.ok(one('airliner-far')[0].from[0] >= 4 && one('airliner-far')[0].from[1] <= 50);
  assert.ok(one('jet-flyby')[0].from[0] >= 10 && one('jet-flyby')[0].from[1] <= 40);
  assert.ok(one('geese')[0].from[0] >= 5 && one('geese')[0].from[1] <= 34);
  const pd = one('tr3b-power-down')[0];
  assert.ok(pd.from[0] < 134.75 && pd.from[1] > 150 && Math.abs(pd.from[0] + pd.hit - 134.75) < 0.1, `the blackout's hit on the turbine's clunk (${pd.from[0]} + ${pd.hit})`);
  assert.ok(Math.abs(pd.peak - pd.hit) < 0.3, 'the thump is the loudest moment');
  // the loops: a 30 s+ body + a 3 s crossfade, from the windows asked (the TR-3B: 30–120 s; the UFO: 20–80 s; the swarm: 3–73 s)
  const tr = one('tr3b-drone')[0], ufo = one('ufo-hum')[0], sw = one('drone-swarm')[0];
  assert.ok(tr.from[0] >= 30 && tr.from[1] <= 120 && ufo.from[0] >= 20 && ufo.from[1] <= 80 && sw.from[0] >= 3);
  // decoded small: the low / distant ones at 16 kHz (half the memory; nothing much above ~6 kHz in them)
  for (const id of ['helicopter', 'airliner-far', 'prop-plane', 'geese', 'drone-swarm', 'ufo-hum', 'tr3b-drone']) for (const t of one(id)) assert.equal(t.r, 16000, `${t.f} decodes at 16 kHz`);
  for (const id of ['helicopter', 'airliner-far', 'prop-plane', 'jet-flyby', 'geese', 'balloon-burner']) for (const t of one(id)) assert.ok(t.d <= 45, `${t.f}: ${t.d} s`);
});

test('THE SKY SOUNDS (8P — the owner, after SP2: louder again, the F-16s REALLY loud, the animals unchanged): +6 / +4 / +3 dB on SP2\'s levels', () => {
  const lvl = id => { const t = takesOf(id)[0]; return t.lufs + 20 * Math.log10(slotOf(id).gain); };
  const bed = lvl('city-hum-day');
  // SP2's gains → 8P's: the jets +6 dB, the helicopter + the burner +4, the airliners, the banner plane + the drone hum +3
  const sp2 = { 'jet-flyby': [0.07, 6], helicopter: [0.074, 4], 'balloon-burner': [0.07, 4], 'airliner-far': [0.036, 3], 'prop-plane': [0.05, 3], 'drone-swarm': [0.045, 3] };
  for (const [id, [g, db]] of Object.entries(sp2)) assert.ok(Math.abs(20 * Math.log10(slotOf(id).gain / g) - db) < 0.15, `${id}: ${(20 * Math.log10(slotOf(id).gain / g)).toFixed(2)} dB (asked ${db})`);
  assert.equal(slotOf('geese').gain, 0.075, 'the geese unchanged');
  assert.equal(slotOf('gulls').gain, 0.11, 'the gulls unchanged');
  assert.ok(lvl('jet-flyby') - bed >= 5, `the jets ${lvl('jet-flyby').toFixed(1)} LUFS: well over the hum (${bed.toFixed(1)})`);
  for (const id of ['helicopter', 'balloon-burner']) assert.ok(lvl(id) - bed >= 2 && lvl(id) - bed <= 6, `${id} ${lvl(id).toFixed(1)} LUFS: a little over the hum`);
  assert.ok(bed - lvl('airliner-far') >= 2, 'an airliner far up: still under the hum');
  assert.ok(lvl('drone-swarm') < lvl('helicopter'), 'the swarm a faint hum');
  // the jets' peak (≤ −2 dBFS in the file) × their gain stays under the player's cap knee (0.15 linear): never clipped, never a startle
  assert.ok(10 ** (-2 / 20) * slotOf('jet-flyby').gain < 0.15);
});

test('8P — THE JETS\' DUCK: the music dips ~3.6 dB round the pass\'s peak — eased in, held, eased back (~3 s); the pan right → left', () => {
  const t = takesOf('jet-flyby')[0], d = slotOf('jet-flyby').duck;
  assert.ok(d >= 0.6 && d <= 0.72, `the duck ${(20 * Math.log10(d)).toFixed(1)} dB (3–4 asked)`);
  assert.equal(duckAt(0, t, d), 1, 'not before');
  assert.equal(duckAt(t.peak, t, d), d, 'full at the peak');
  assert.equal(duckAt(t.peak + 4, t, d), 1, 'back after');
  let prev = 1, low = 0;
  for (let el = 0; el <= t.d; el += 0.05) { const v = duckAt(el, t, d); assert.ok(v >= d - 1e-9 && v <= 1); if (v < 1) low += 0.05; if (el < t.peak) assert.ok(v <= prev + 1e-9, 'eased down'); prev = v; }
  assert.ok(low > 2.5 && low < 5, `the music dipped for ${low.toFixed(1)} s`);
  assert.equal(duckAt(3, null, d), 1); assert.equal(duckAt(3, t, 1), 1);
  assert.ok(sweepPan(t.sw[0], t) > 0.5 && sweepPan(t.sw[1], t) < -0.5 && Math.abs(sweepPan((t.sw[0] + t.sw[1]) / 2, t)) < 0.01, 'right → left over its swell');
  assert.equal(slotOf('helicopter').duck, undefined, 'only the jets duck the music');
});

test('8P — THE SPEAKEASY + PEOPLE SOUNDS: each slot holds its cut; marks where their events land; nothing modern / spoken / musical kept', () => {
  const f = id => takesOf(id).map(t => t.f).sort(), one = id => takesOf(id)[0];
  assert.deepEqual(f('door-heavy'), ['door-heavy.mp3']);
  assert.deepEqual(f('glasses-clink'), ['glasses-clink-2.mp3', 'glasses-clink-3.mp3', 'glasses-clink.mp3']);
  assert.equal(takesOf('shop-bell').length, 3); assert.equal(takesOf('scissors-snip').length, 4);
  assert.equal(takesOf('footsteps-cobble').length, 6); assert.equal(takesOf('footsteps-heels').length, 6); assert.equal(takesOf('laugh-distant').length, 2);
  for (const id of ['footsteps-cobble', 'footsteps-heels']) for (const t of takesOf(id)) assert.ok(t.d < 0.7, `${t.f}: one step (${t.d} s)`);
  // the mirror door: the open from its latch; the close's thud (its frame) at `hit` — the cut inside the source's 2.85–6.3 s
  assert.ok(one('door-heavy').from[0] < 0.3 && one('door-heavy').from[1] <= 2.3);
  const cl = one('door-heavy-close');
  assert.ok(Math.abs(cl.from[0] + cl.hit - 4.65) < 0.1, `the thud at ${cl.from[0] + cl.hit} s in the source (measured 4.65)`);
  // the sash: UP = the long juddering push (17–21.3 s, its stop at 20.83), DOWN = the slide onto the sill (the thud at 13.65)
  const up = one('window-sash-up'), dn = one('window-sash-down');
  assert.ok(Math.abs(up.from[0] + up.hit - 20.83) < 0.05 && Math.abs(dn.from[0] + dn.hit - 13.65) < 0.05);
  // the knock: assembled (knock … knock-knock … knock + the slot) — 3.3 s
  assert.ok(one('door-knock').d > 3 && one('door-knock').d < 3.6);
  // the beds: the club through a wall (from the louder half for the party, the calmer half for the calm), the line's murmur clear of
  // the bar recording's clear talker at 192 s, the rooftop inside the music-free stretch (music from 89 s; notes at 20.7–29 s)
  assert.ok(one('club-murmur-calm').from[0] >= 75 && one('club-murmur-party').from[1] <= 72);
  assert.ok(one('line-murmur').from[1] < 192);
  assert.ok(one('rooftop-party').from[0] > 29 && one('rooftop-party').from[1] < 69);
  assert.ok(one('bar-open').from[0] >= 60 && one('bar-open').from[1] <= 71);
  for (const id of ['club-murmur-calm', 'club-murmur-party', 'line-murmur', 'rooftop-party']) assert.equal(one(id).r, 16000, `${id}: low-passed, decoded at 16 kHz`);
  // THE BUS: the 1945 truck's own takes — the arrival's stop (`hit`) = its engine settling at 414 s; the idle = that same stop idle
  const ar = one('bus-arrive'), idle = one('bus-idle'), away = one('bus-pull-away');
  assert.ok(ar.src === 'car-1920s-pass-3' && idle.src === 'car-1920s-pass-3' && away.src === 'car-1920s-pass-3', 'not the diesel stand-ins');
  assert.ok(Math.abs(ar.from[0] + ar.hit - 414) < 0.1 && idle.from[0] >= 414 && idle.from[1] <= 418.3, 'the idle loops the arrival\'s own stop idle (before the engine off at 418.5)');
  assert.ok(away.from[0] >= 10 && away.from[1] <= 31, 'the slow pull-away of take 1');
  assert.deepEqual(f('bus-door'), ['bus-door.mp3']);
});

test('8P — THE MOMENTS HEARD: each cue where its painter shows it; cues already past are dropped; the barbershop\'s bells in + out', () => {
  // the cues name filled slots + moments that exist
  for (const [id, cs] of Object.entries(MOMENT_CUES)) for (const c of cs) { assert.ok(takesOf(c.slot).length, `${id}: ${c.slot} filled`); assert.ok(c.p > 0 && c.p < 1); }
  // (FP3a: + the heavy door as the mirror swings open — it was played from windows.js's painter; the cat's meow likewise)
  const m = momentCues('mirror', 0, 8.5);
  assert.deepEqual(m.map(c => c.slot), ['door-heavy', 'bar-open', 'door-heavy-close']);
  assert.ok(Math.abs(m[2].in - 0.95 * 8.5) < 1e-6 && m[2].mark === 'hit', 'the thud on the shut (p 0.95)');
  assert.equal(momentCues('cat', 0, 12)[0].slot, 'cat-meow', 'the cat meows as it appears');
  assert.deepEqual(momentCues('mirror', 4, 8.5).map(c => c.slot), ['door-heavy-close'], 'the bar\'s burst is past 4 s in');
  assert.deepEqual(momentCues('toast', 0, 7)[0], { slot: 'glasses-clink', in: 2.66, mark: 'hit', gain: 0.9, pan: -0.5 });
  assert.deepEqual(momentCues('dance', 0, 9), [], 'no sound');
  assert.equal(momentCues('wake', 0.84 + 0.2, 42).length, 3, 'a cue 0.2 s late still plays (joined)');
  assert.equal(momentCues('wake', 0.84 + 0.5, 42).length, 2, '… 0.5 s late: dropped');
  // the barbershop: the same cycle as windows.js#barberDay (a customer every 480 s from the opening's end − 40 s)
  const open = 9 * 3600 + 120, at = ph => open + 44 - 40 + ph;
  assert.deepEqual(barberAt(at(100), open), { n: 0, ph: 100, cutting: true });
  assert.equal(barberAt(at(400), open).cutting, false, 'between customers: the barber reads');
  assert.equal(bellsBetween(null, barberAt(at(1), open)), 0, 'no bell on the first look');
  assert.equal(bellsBetween(barberAt(at(0.2), open), barberAt(at(0.9), open)), 1, 'in');
  assert.equal(bellsBetween(barberAt(at(344.8), open), barberAt(at(345.1), open)), 1, 'out');
  assert.equal(bellsBetween(barberAt(at(479.8), open), barberAt(at(BARBER_CYCLE + 0.7), open)), 1, 'the next customer in');
  assert.equal(bellsBetween(barberAt(at(10), open), barberAt(at(3000), open)), 0, 'a jump: nothing rung for what was missed');
});

test('THE SKY\'s flybys chain: the next take starts as the playing one fades (its last 2.5 s)', () => {
  assert.equal(chainDue(10, 40), false);
  assert.equal(chainDue(37.4, 40), false);
  assert.equal(chainDue(37.5, 40), true);
  assert.equal(chainDue(0.2, 1), false, 'a very short take: never back to back in a frame');
  assert.equal(chainDue(0.6, 1), true);
});
