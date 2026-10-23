// CITY 2.0 — THE HARBOR, NEON PASS 5: THE BEAT (PURE: no DOM, no audio; tests/harbor.test.mjs). docs/audio.md#the-beat.
//
// The owner: "the way it interacts with the beat just is a little off… not very impressive". Neon Pass 4 counted beats from a
// song's start at a rounded BPM (librosa's tempo bins: 129.2 for a 130 song drifts a beat in ~40 s), with no first-beat offset
// and no downbeats. Now three layers:
//   THE GRID       every mood song is analysed offline (scripts/build-mood-music.py → data/mood-music.json `grid`: the exact bpm,
//                  the first beat t0, which beat is a bar's first) — the clock locks to it: bars, the beat in the bar, the steady
//                  effects (racing laps, sweeps, scene changes) on the real bar lines
//   THE SOUND      an AnalyserNode on the music bus (audio/beat.js) hears the low end (kick + bass); onsetStep() finds the hits.
//                  On the grid's strong beats a measured kick sets how hard the city punches (a loud drop hits hard, a quiet
//                  passage — or a breakdown with no kick at all — calms it); a kick between the strong beats is a small hit of
//                  its own; a song without a grid punches on every real kick
//   HALF-TIME      the pulse punches on beats 1 and 3 (the downbeat hardest), a fast attack, a slightly longer decay — it punches
//                  instead of flickering
// Without music the city keeps a calm 120 bpm pulse of its own (one punch a second).

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const CALM_BPM = 120;
/** the punch's attack (before the strong beat: the light lands ON it) and its decay */
export const ATTACK_S = 0.05, DECAY_S = 0.24;

export function createHarborBeat(seed = 0) {
  return { beats: seed * 4, rate: CALM_BPM / 60, bpm: 0, src: 'calm', locked: 0, bar: 0, barMax: Math.floor(seed), level: 0.7, kick: 0, lastHit: -99, missAt: null, live: false,
    u: 0, T: 0.5, idx: 0, barU: 0, env: 0, strong: 1, punch: 0, hits: { on: 0, off: 0 } };
}

/**
 * The half-time punch at a beat position b (beats; 0 = a downbeat), T = s a beat → { env (0..1), strong (1 the downbeat · 0.72
 * beat 3), unit (the strong beat's index: beat 2·unit) }. The attack runs over the last ~50 ms before the strong beat.
 */
export function halfTime(b, T = 0.5) {
  const x = b / 2, k = Math.floor(x), v = x - k, T2 = 2 * Math.max(0.1, T), a = Math.min(0.3, ATTACK_S / T2);
  let env, unit;
  if (v > 1 - a) { const y = (v - (1 - a)) / a; env = y * y * (3 - 2 * y); unit = k + 1; } else { env = Math.exp(-v * T2 / DECAY_S); unit = k; }
  return { env, strong: ((unit % 2) + 2) % 2 === 0 ? 1 : 0.72, unit, v };
}

/**
 * Advance the clock by dt ms.
 *   song: { bpm, pos (s: the song's position AS HEARD), grid?: { bpm, t0, down }, untrusted? } | null
 *   kick: { hit (0..1: a kick heard this frame, its strength), live (the analyser hears the music) } | null
 * → hb (mutated): beats (continuous; with a grid 0 mod 4 = a downbeat), u (0..1 of the beat), T (s a beat), idx (0..3 in the
 * bar), bar (bars counted — never backwards), barU (0..1 of the bar), punch (0..~1.4), src ('grid'|'tempo'|'kick'|'calm')
 */
export function advanceHarborBeat(hb, dt, song, kick) {
  const sec = Math.min(0.25, Math.max(0, dt / 1000));
  const g = song && song.grid && song.grid.bpm > 0 ? song.grid : null;
  // (CITY 2.0 MUSIC: a song whose grid the importer couldn't trust — song.untrusted — has no tempo either: the kicks lead, like no song)
  const bpm = g ? g.bpm : song && song.bpm > 0 && !song.untrusted ? song.bpm : 0;
  hb.beats += hb.rate * sec;                     // (advance first, then pull toward the song as it sounds NOW: no frame of lead)
  if (bpm && song.pos >= 0) {
    const target = bpm / 60;
    const tb = g ? (song.pos - (g.t0 || 0)) * target - (g.down || 0) : song.pos * target;
    hb.rate += (target - hb.rate) * Math.min(1, sec * 3);
    // the bar's phase, the shortest way round (in beats): a new song or a seek re-locks at once, a small drift is pulled in
    let d = tb - hb.beats; d -= 4 * Math.round(d / 4);
    if (Math.abs(d) > 0.6) hb.beats += d; else hb.beats += d * Math.min(1, sec * 4);
    hb.locked = Math.min(1, hb.locked + sec / 1.5); hb.bpm = bpm; hb.src = g ? 'grid' : 'tempo';
  } else {
    hb.rate += (CALM_BPM / 60 - hb.rate) * Math.min(1, sec * 0.8);
    hb.locked = Math.max(0, hb.locked - sec / 2.5); hb.bpm = 0; hb.src = kick && kick.live ? 'kick' : 'calm';
  }
  const b = hb.beats, T = 1 / Math.max(0.2, hb.rate), fb = Math.floor(b);
  hb.T = T; hb.u = b - fb; hb.idx = ((fb % 4) + 4) % 4;
  const bi = Math.floor(b / 4);
  if (bi > hb.barMax) { hb.bar += 1; hb.barMax = bi; }
  hb.barU = b / 4 - bi;
  const ht = halfTime(b, T);
  hb.env = ht.env; hb.strong = ht.strong;
  // THE SOUND: the measured kicks set the strength (fast toward a hit; a strong beat with no kick calms it)
  hb.kick *= Math.exp(-sec / DECAY_S);
  if (kick && kick.live) {
    hb.live = true;
    if (kick.hit > 0) {
      hb.lastHit = b;
      if (bpm) { if (Math.abs(b - Math.round(b)) < 0.15) hb.hits.on++; else hb.hits.off++; }   // (the readout + the tests: do the kicks land on the grid?)
      const nb = Math.round(b), onStrong = Math.abs(b - nb) < 0.22 && ((nb % 2) + 2) % 2 === 0;
      if (bpm && onStrong) hb.level += (clamp01(kick.hit) - hb.level) * 0.65;
      else hb.kick = Math.max(hb.kick, clamp01(kick.hit) * (bpm ? 0.38 : 1));
    }
    if (bpm && ht.v > 0.3 && ht.v < 0.5 && hb.missAt !== ht.unit) {
      hb.missAt = ht.unit;
      if (hb.lastHit < 2 * ht.unit - 0.25) hb.level = Math.max(0.25, hb.level * 0.8);
    }
  } else {
    hb.live = false;
    hb.level += ((bpm ? 0.85 : 0.7) - hb.level) * Math.min(1, sec * 1.5);
  }
  hb.punch = bpm || !hb.live ? ht.env * ht.strong * hb.level + hb.kick : hb.kick;
  return hb;
}

/**
 * ONSETS in the low end (kick + bass): e = the low band's level now (RMS, linear), t = s. Spectral-flux style: the rise since
 * the last reading against an adaptive threshold (the recent rises' mean + 1.5 σ), at least 0.18 s apart, at least 30 % of the
 * recent peak. → the hit's strength (0..1, against the peak of the last ~45 s: a quiet passage hits softly) or 0.
 */
export function createOnsets() { return { prev: 0, h: [], peak: 1e-4, last: -9, t: null, level: 0 }; }
export function onsetStep(o, e, t) {
  const dt = o.t == null ? 0 : Math.max(0, Math.min(0.25, t - o.t)); o.t = t;
  const flux = Math.max(0, e - o.prev); o.prev = e;
  o.peak = Math.max(e, o.peak * Math.exp(-dt / 45), 1e-4);              // (a quiet passage stays calmer for ~45 s)
  o.level += (e - o.level) * Math.min(1, dt / 2);
  o.h.push(flux); if (o.h.length > 45) o.h.shift();
  let m = 0; for (const v of o.h) m += v; m /= o.h.length;
  let s = 0; for (const v of o.h) s += (v - m) * (v - m); s = Math.sqrt(s / o.h.length);
  const thr = m + 1.5 * s + 0.04 * o.peak;
  if (flux > thr && e > 0.3 * o.peak && t - o.last > 0.18) { o.last = t; return clamp01(Math.pow(e / o.peak, 0.8)); }
  return 0;
}
