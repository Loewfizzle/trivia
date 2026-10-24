// CITY 2.0 — THE HARBOR's CITY SOUNDS (Part 8a; docs/audio.md#the-city-sounds): what in the city calls which slot. The scene
// ticks it every frame (it looks ~4× a second); every event that exists today calls its slot, and an EMPTY slot is silent (the
// player does nothing), so a recording dropped in later just starts sounding with its event.
//   THE BED      city-hum-day / city-hum-night crossfading (equal power) on the city's ONE darkness (core/harbor-dark.js: the
//                blue hour — the same input every light reads) LEAD it · water-lapping always, far + soft under the hum (FP).
//                FP: ducked while the music is on (core/city-sounds.js#bedMix); with the music on it waits for the song to sound
//                and fades in slowly — it never starts louder than the music
//   THE SKY      helicopter (a bed while it's up, panned with it) · airliner-far (the loudest plane crossing, panned, faded at
//                its ends) · prop-plane (the banner plane, the skywriters) · drone-swarm (the drone show) · balloon-burner (a
//                burn every ~6–18 s while balloons are up) · geese (honks while a V crosses)
//   THE HARBOR   gulls (by day while gulls fly: mostly one call, now and then two or three in a row, random gaps of ~14–66 s,
//                fewer when there are fewer — core/city-sounds.js#gullCalls / gullGap) · boat-putter (the water taxi
//                crossing) · foghorn (the lighthouse, in real fog: every ~40–80 s)
//   THE API      play(slot, o) / loop(slot, o) — the road's cars (Part 8: play('car-1920s-pass', { pan, gain }) → its handle's
//                `peak` = s after the start when the car is nearest), anything later
// City 2.0's title only (the scene lives there); the Effects slider + Mute rule it (the SFX bus); all of it fails silently.
import { citySound, cityLoop, citySoundsDebug } from '../../audio/city-sound.js';
import { isFilled, bedMix, gullCalls, gullGap, BED_FADE_IN, BED_RAMP } from '../../core/city-sounds.js';
import { isUnlocked } from '../../audio/engine.js';
import { musicSounding } from '../../audio/music.js';
import { settings } from '../../audio/settings.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);

export function createCitySounds() {
  let lastT = 0, born = performance.now(), dead = false;
  const beds = new Map();               // slot → { h, zeroAt }
  const next = { gulls: born + rnd(8000, 25000), burner: 0, geese: 0, fog: born + rnd(6000, 20000) };
  let mix = { dark: 0, day: 0, night: 0, k: 1, hold: false };
  let unlockedAt = 0, bedOn = false, bedK = -1;

  /** keep a bed at this gain (0 = fade it out; stopped after `linger` s at zero: its buffer is freed) */
  function keep(slot, gain, pan = 0, { ramp = 1.5, linger = 20, fadeIn = 2 } = {}) {
    if (!isFilled(slot)) return;
    let b = beds.get(slot);
    if (gain > 0.002) {
      if (!b) { b = { h: cityLoop(slot, { gain, pan, fadeIn }), zeroAt: 0, g: gain, p: pan }; beds.set(slot, b); }
      else if (Math.abs(b.g - gain) > 0.01 || Math.abs(b.p - pan) > 0.02 || b.zeroAt) { b.h.set({ gain, pan }, ramp); b.g = gain; b.p = pan; }
      b.zeroAt = 0;
    } else if (b) {
      if (!b.zeroAt) { b.zeroAt = performance.now(); b.h.set({ gain: 0 }, ramp); b.g = 0; }
      else if (performance.now() - b.zeroAt > linger * 1000) { b.h.stop(0.5); beds.delete(slot); }
    }
  }
  const panX = (x, W) => clamp((x / Math.max(1, W)) * 2 - 1, -0.85, 0.85);

  function tick(fs, { dark = 0, sky = null, boats = false, W = 1 } = {}) {
    if (dead) return;
    const t = performance.now();
    if (t - lastT < 250) return;
    lastT = t;
    const L = fs && fs.L;
    // ---- THE BED: the hum by the darkness (day → night over the blue hour, equal power) + the water, far under it; ducked under
    // the music while it's on, and (music on) held until the song really sounds — then a slow fade-in (FP)
    if (!unlockedAt && isUnlocked()) unlockedAt = t;
    const musicOn = !settings.musicOff && !settings.muted && settings.music > 0.01;
    const bm = bedMix({ musicOn, sounding: musicOn && musicSounding(), sinceMs: unlockedAt ? t - unlockedAt : 0, started: bedOn });
    const w = smooth(0.12, 0.88, clamp(dark, 0, 1));
    mix = { dark: +dark.toFixed(3), day: +Math.cos(w * Math.PI / 2).toFixed(3), night: +Math.sin(w * Math.PI / 2).toFixed(3), k: bm.k, hold: bm.hold };
    if (!bm.hold && unlockedAt) {
      // (a change of the duck — the music switched on / off — eases over BED_RAMP s; the hum's own day ↔ night over 2.5 s)
      const r = bedK >= 0 && Math.abs(bedK - bm.k) > 0.01 ? BED_RAMP : 2.5;
      bedK = bm.k;
      const fi = bedOn ? 2 : BED_FADE_IN;
      keep('water-lapping', bm.k, 0, { linger: 5, ramp: r, fadeIn: fi });
      keep('city-hum-day', mix.day * bm.k, 0, { ramp: r, linger: 60, fadeIn: fi });
      keep('city-hum-night', mix.night * bm.k, 0, { ramp: r, linger: 60, fadeIn: fi });
      bedOn = bedOn || beds.size > 0;
    }
    // ---- THE SKY (skyfx.listen(): what's up there now)
    const s = sky && sky.listen ? sky.listen() : null;
    if (s) {
      const heli = s.air && s.air.heli;
      keep('helicopter', heli ? (heli.hover ? 1 : 0.75) : 0, heli ? panX(heli.x, W) : 0, { ramp: 0.6, linger: 4 });
      // the loudest airliner: fading in / out at the ends of its crossing, the bigger (nearer) ones louder, panned with it
      let best = null, bl = 0;
      for (const p of (s.air && s.air.planes) || []) {
        const k = clamp(p.k, 0, 1), l = Math.sin(Math.PI * k) * (p.approach ? 1 : clamp(p.len / 26, 0.35, 1));
        if (l > bl) { bl = l; best = p; }
      }
      keep('airliner-far', bl, best ? panX(best.x0 + (best.x1 - best.x0) * clamp(best.k, 0, 1), W) : 0, { ramp: 0.8, linger: 6 });
      keep('prop-plane', s.banner || s.smoke ? 1 : 0, 0, { ramp: 1.2, linger: 6 });
      keep('drone-swarm', s.drones ? 1 : 0, 0, { ramp: 2, linger: 6 });
      if (s.balloons && t > next.burner) { if (next.burner) citySound('balloon-burner', { pan: rnd(-0.6, 0.6), gain: rnd(0.6, 1) }); next.burner = t + rnd(6000, 18000); }
      if (!s.balloons) next.burner = 0;
      const geese = s.birds && s.birds.geese;
      if (geese && t > next.geese) { if (next.geese) citySound('geese', { pan: rnd(-0.5, 0.5), gain: rnd(0.6, 1) }); next.geese = t + rnd(2500, 7000); }
      if (!geese) next.geese = 0;
      // the gulls: by day while gulls fly over the harbor — a distant call now and then (fewer gulls, fewer calls)
      const g = s.birds && s.birds.who ? s.birds.who.gulls || 0 : 0;
      // (FP: mostly one call, now and then two or three in a row — different takes, levels, pitches — at random gaps: never a pattern)
      if (g > 0.15 && s.birds.gulls > 0 && dark < 0.5 && t > next.gulls) {
        const calls = gullCalls(Math.random, rnd(-0.6, 0.6));
        for (const c of calls) citySound('gulls', c);
        next.gulls = t + gullGap(g, Math.random, calls.length);
      } else if (t > next.gulls) next.gulls = t + rnd(5000, 15000);
    }
    // ---- THE HARBOR: the water taxi's engine while it crosses; the foghorn in real fog
    keep('boat-putter', boats ? 1 : 0, 0, { ramp: 1.5, linger: 8 });
    if (L && (L.fog || 0) > 0.45 && t > next.fog) { citySound('foghorn', { pan: 0.35, gain: rnd(0.8, 1) }); next.fog = t + rnd(40000, 80000); }
  }

  return {
    tick,
    /** a one-shot from a slot (the road's cars: play('car-1920s-pass', { pan, gain }) → { peak, dur, stop } or null) */
    play: (slot, o) => citySound(slot, o),
    /** a bed from a slot → { set({ gain, pan }), stop(fade) } (an empty slot: a handle that does nothing) */
    loop: (slot, o) => cityLoop(slot, o),
    debug: () => ({ mix, beds: [...beds.entries()].map(([slot, b]) => ({ slot, zero: !!b.zeroAt, ...(b.h.debug ? b.h.debug() : {}) })), next: Object.fromEntries(Object.entries(next).map(([k, v]) => [k, v ? Math.round((v - performance.now()) / 1000) : null])), player: citySoundsDebug() }),
    destroy() { dead = true; for (const b of beds.values()) b.h.stop(1.2); beds.clear(); },
  };
}
