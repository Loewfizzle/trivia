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
 * 7a — WHAT THE BEAT FOLLOWS (docs/audio.md#7a-the-beat-in-direct-mode). One of:
 *   'grid'         the song's trusted grid, the kick listener setting how hard it punches
 *   'direct-grid'  the song plays on THE DIRECT ELEMENT (M4: the Web Audio graph is dead, so the kick listener hears nothing): the
 *                  grid alone, on the element's own clock, at a steady strength
 *   'kicks'        no trusted grid: the kicks the listener hears (a song we know nothing about)
 *   'tempo'        no trusted grid and nothing heard (the direct element, a deaf analyser): a gentle steady pulse at the song's tempo
 *   'calm'         no song: a calm 120 bpm of its own
 * song: { bpm, pos, grid?, untrusted?, loose? (the untrusted grid: its tempo + phase, the best guess there is), direct? } | null
 */
export function beatMode(song, kick) {
  const heard = !!(kick && kick.live) && !(song && song.direct);
  if (song && song.pos >= 0) {
    if (song.grid && song.grid.bpm > 0) return song.direct ? 'direct-grid' : 'grid';
    if (song.bpm > 0 && !song.untrusted) return 'tempo';          // (a song with a tempo but no grid at all: as before)
    if (heard) return 'kicks';
    if (song.bpm > 0 || (song.loose && song.loose.bpm > 0)) return 'tempo';
  }
  return heard ? 'kicks' : 'calm';
}
// ---- 8a — PULSE STRENGTH (the owner: "crank it up higher" — and stop guessing: THE PREVIEW PANEL's LIGHTS → PULSE STRENGTH slider,
// the &pulse=<percent> flag). ONE multiplier on the city's punch at its source (scene.js#partyTick: PT.punch + the ripple's history),
// so every beat-driven light follows it at once — the tubes, the crowns' flare, the signs, the wheel, the sky beams, the pier lamps,
// the string lights, the NEON logo's party glow, SPEAKEASY's rings + word. Above PULSE_KNEE a soft knee eases the scaled punch toward
// PULSE_CAP (the tubes' punch is one extra additive draw at most — 2× lit — so a bigger number holds the peak a little longer, never
// a white wash); the troughs between beats stay where they are (the multiplier only grows the peak: never a full-screen flash).
/** THE DEFAULT — the owner's pick locks in HERE (1.3 = 130 % = 7a's punch + 30 %) */
export const PULSE_DEFAULT = 1.3;
export const PULSE_MIN = 0.5, PULSE_MAX = 2.5, PULSE_STEP = 0.05;
export const PULSE_KNEE = 1.2, PULSE_CAP = 2;
/** a pulse value (the panel's percent 50…250, or a multiplier ≤ 5: '1.8') → the multiplier, clamped; missing / junk → the default */
export function pulseGain(v) {
  if (v == null || v === '') return PULSE_DEFAULT;
  let n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return PULSE_DEFAULT;
  if (n > 5) n /= 100;
  n = Math.round(n / PULSE_STEP) * PULSE_STEP;
  return +Math.max(PULSE_MIN, Math.min(PULSE_MAX, n)).toFixed(2);
}
/** the punch p (0..~1.4) × the strength k, with the soft knee: linear up to PULSE_KNEE, then easing toward PULSE_CAP */
export function pulseOut(p, k = PULSE_DEFAULT) {
  const x = Math.max(0, +p || 0) * k;
  if (x <= PULSE_KNEE) return x;
  const o = x - PULSE_KNEE, r = PULSE_CAP - PULSE_KNEE;
  return PULSE_KNEE + o / (1 + o / r);
}

/** the strength a beat settles at when no kick is heard: the grid 0.85, the gentle tempo pulse 0.6, the calm pulse 0.7 */
export const SETTLE = { grid: 0.85, 'direct-grid': 0.85, tempo: 0.6, calm: 0.7, kicks: 0.7 };

/**
 * Advance the clock by dt ms.
 *   song: { bpm, pos (s: the song's position AS HEARD), grid?: { bpm, t0, down }, untrusted?, loose?, direct? } | null
 *   kick: { hit (0..1: a kick heard this frame, its strength), live (the analyser hears the music) } | null
 * → hb (mutated): beats (continuous; with a grid 0 mod 4 = a downbeat), u (0..1 of the beat), T (s a beat), idx (0..3 in the
 * bar), bar (bars counted — never backwards), barU (0..1 of the bar), punch (0..~1.4), src (beatMode: 'grid'|'direct-grid'|
 * 'kicks'|'tempo'|'calm')
 */
export function advanceHarborBeat(hb, dt, song, kick) {
  const sec = Math.min(0.25, Math.max(0, dt / 1000));
  const mode = beatMode(song, kick);
  // (on the direct element the kick listener's graph is dead: whatever it reports is stale — never trusted)
  if (song && song.direct) kick = null;
  // the phase source: the trusted grid; for the gentle tempo pulse the untrusted grid's own tempo + phase when there is one
  const g = mode === 'grid' || mode === 'direct-grid' ? song.grid : mode === 'tempo' && song.loose && song.loose.bpm > 0 ? song.loose : null;
  // (CITY 2.0 MUSIC: a song whose grid the importer couldn't trust — song.untrusted — follows the kicks it hears; heard nothing: its tempo)
  const bpm = g ? g.bpm : mode === 'tempo' ? song.bpm : 0;
  hb.beats += hb.rate * sec;                     // (advance first, then pull toward the song as it sounds NOW: no frame of lead)
  if (bpm && song.pos >= 0) {
    const target = bpm / 60;
    const tb = g ? (song.pos - (g.t0 || 0)) * target - (g.down || 0) : song.pos * target;
    hb.rate += (target - hb.rate) * Math.min(1, sec * 3);
    // the bar's phase, the shortest way round (in beats): a new song or a seek re-locks at once, a small drift is pulled in
    let d = tb - hb.beats; d -= 4 * Math.round(d / 4);
    if (Math.abs(d) > 0.6) hb.beats += d; else hb.beats += d * Math.min(1, sec * 4);
    hb.locked = Math.min(1, hb.locked + sec / 1.5); hb.bpm = bpm;
  } else {
    hb.rate += (CALM_BPM / 60 - hb.rate) * Math.min(1, sec * 0.8);
    hb.locked = Math.max(0, hb.locked - sec / 2.5); hb.bpm = 0;
  }
  hb.src = mode;
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
    hb.level += (SETTLE[mode] - hb.level) * Math.min(1, sec * 1.5);
  }
  hb.punch = bpm || !hb.live ? ht.env * ht.strong * hb.level + hb.kick : hb.kick;
  return hb;
}

/**
 * ONSETS in the low end (kick + bass): e = the low band's level now (RMS, linear), t = s. Spectral-flux style: the rise since
 * the last reading against an adaptive threshold (the recent rises' mean + 1.5 σ), at least 0.18 s apart, at least 30 % of the
 * recent peak. → the hit's strength (0..1, against the peak of the last ~45 s: a quiet passage hits softly) or 0.
 */
// ---- THE ELEMENT'S LEAD (M2, checked in M3 — docs/audio.md#m3-the-learned-lead). A mood song is an <audio> element; the samples that
// reach the graph can run ahead of (lead < 0) or behind (lead > 0) its currentTime. A kick the listener hears at element-clock `at`
// entered the graph `lag` earlier (the listener's own delay), so at − lag − the beat = the lead. Heard = at − the output − the lead.
// (Her iPhone: −42 ms with Safari's own outputLatency 18 ms — WebKit taps an element's audio ahead of its player clock; the sign is
// right: the lights land 24 ms before the element's clock reaches a beat, i.e. when the beat is heard.)
export const KICK_LAG = 0.024;              // the listener at 60 frames a second (offline replay of the party songs: 15–37 ms per song)
export const LEAD_MIN = -0.08, LEAD_MAX = 0.12;   // a sane element lead; anything outside is a bad reading, never applied
/** the listener's delay at this frame interval (s): it samples once a frame, so a slower frame hears a kick later (30 Hz: +8 ms) */
export const kickLag = frameS => KICK_LAG + Math.max(0, Math.min(0.03, ((frameS || 1 / 60) - 1 / 60) / 2));
/**
 * A strong kick heard at element-clock `at` on a trusted grid → its distance from the nearest beat (the lead), or null when it isn't
 * a beat's kick: only within ±min(80 ms, a fifth of a beat) — a 16th-note bass hit (a quarter beat away: 117 ms at 128 BPM) or a
 * syncopated kick never teaches the lead.
 */
export function kickErr(at, grid, lag = KICK_LAG) {
  if (!grid || !(grid.bpm > 0)) return null;
  const p = 60 / grid.bpm, x = at - lag - (grid.t0 || 0), err = x - Math.round(x / p) * p;
  return Math.abs(err) <= Math.min(0.08, 0.2 * p) ? err : null;
}
const clampLead = v => Math.max(LEAD_MIN, Math.min(LEAD_MAX, +v || 0));
/** a lead being learned: v (s, applied), n (readings behind it), errs (the last 32) — a saved value starts it (clamped) */
export function createLead(saved = null) { return saved == null ? { v: 0, n: 0, errs: [] } : { v: clampLead(saved), n: 12, errs: [] }; }
/** one reading → true when the lead changed: the median of the last 32 once ≥ 12 agree (their middle half within 50 ms), clamped */
export function learnLead(c, err) {
  c.errs.push(err); if (c.errs.length > 32) c.errs.shift();
  if (c.errs.length < 12) return false;
  const s = c.errs.slice().sort((a, b) => a - b), med = s[s.length >> 1];
  if (s[Math.floor(s.length * 0.75)] - s[Math.floor(s.length * 0.25)] > 0.05) return false;   // (not consistent yet: keep what we had)
  c.v = clampLead(med); c.n = c.errs.length;
  return true;
}
/** the song's position AS HEARD: the element's clock − the output latency − the element's lead */
export const heardPos = (at, out, lead) => Math.max(0, at - out - lead);

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
