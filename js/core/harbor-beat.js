// CITY 2.0 — THE HARBOR, NEON PASS 5: THE BEAT (PURE: no DOM, no audio; tests/harbor.test.mjs). docs/audio.md#the-beat.
//
// The owner: "the way it interacts with the beat just is a little off… not very impressive". Neon Pass 4 counted beats from a
// song's start at a rounded BPM (librosa's tempo bins: 129.2 for a 130 song drifts a beat in ~40 s), with no first-beat offset
// and no downbeats. Now:
//   THE GRID       every mood song is analysed offline (scripts/build-mood-music.py → data/mood-music.json `grid`: the exact bpm,
//                  the first beat t0, which beat is a bar's first) — the clock locks to it: bars, the beat in the bar, the steady
//                  effects (racing laps, sweeps, scene changes) on the real bar lines
//   THE SOUND      an AnalyserNode on the music bus (audio/beat.js) hears the low end (kick + bass). ONE SOURCE (the beat-sync pass,
//                  Oct 24): the kicks it hears never drive the lights — they only CALIBRATE the lead (where the song's clock sits
//                  against the sound) and its loudness sets how hard the city punches (a loud drop hits hard, a breakdown calms it).
//                  Before this pass a kick between the beats was a punch of its own and a kick missing from a strong beat calmed the
//                  city: with the sound offset from the song's clock (iOS after the home screen: +237 ms) the lights punched on the
//                  grid AND on every offset kick ("all over the place"), then the offset was declared a SKEW and the kicks dropped
//                  (only beats 1 + 3 left: "a slower rhythm"), then a re-anchor forgot the SKEW and it began again ("lost")
//   EVERY BEAT     the pulse punches on every beat — the downbeat hardest, beat 3 next, 2 + 4 lighter — a fast attack, a slightly
//                  longer decay. (Half-time, beats 1 + 3 only, read as "a slower rhythm" the moment the kicks' little hits on 2 + 4 went.)
// Without music the city keeps a calm 120 bpm pulse of its own (one punch a second).

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const CALM_BPM = 120;
/** the punch's attack (before the beat: the light lands ON it) and its decay */
export const ATTACK_S = 0.05, DECAY_S = 0.24;

/** FP: a gap this big (s) between the lights' grid and the song re-locks at once (the owner: "more than ~30 ms") */
export const DRIFT_SNAP = 0.03;
export function createHarborBeat(seed = 0) {
  return { beats: seed * 4, rate: CALM_BPM / 60, bpm: 0, src: 'calm', locked: 0, bar: 0, barMax: Math.floor(seed), level: 0.7, kick: 0, lastHit: -99, live: false,
    drift: null, songBar: null, songIdx: null, energy: 0,
    u: 0, T: 0.5, idx: 0, barU: 0, env: 0, strong: 1, punch: 0, hits: { on: 0, off: 0 } };
}

/** how hard each beat of the bar punches: the downbeat, beat 2, beat 3, beat 4 */
export const BEAT_WEIGHT = [1, 0.45, 0.72, 0.45];
/**
 * THE PUNCH at a beat position b (beats; 0 mod 4 = a downbeat), T = s a beat → { env (0..1), strong (BEAT_WEIGHT of the beat it
 * belongs to), unit (that beat's index), v (0..1 through the beat) }. The attack runs over the last ~50 ms before each beat (the
 * light lands on it), the decay after it.
 */
export function beatPunch(b, T = 0.5) {
  const k = Math.floor(b), v = b - k, Tb = Math.max(0.1, T), a = Math.min(0.3, ATTACK_S / Tb);
  let env, unit;
  if (v > 1 - a) { const y = (v - (1 - a)) / a; env = y * y * (3 - 2 * y); unit = k + 1; } else { env = Math.exp(-v * Tb / DECAY_S); unit = k; }
  return { env, strong: BEAT_WEIGHT[((unit % 4) + 4) % 4], unit, v };
}
/**
 * (NEON PASS 5's half-time envelope — beats 1 + 3 only — kept for the harbor-show's older previews / tests; the city's lights
 * use beatPunch since the beat-sync pass)
 */
export function halfTime(b, T = 0.5) {
  const x = b / 2, k = Math.floor(x), v = x - k, T2 = 2 * Math.max(0.1, T), a = Math.min(0.3, ATTACK_S / T2);
  let env, unit;
  if (v > 1 - a) { const y = (v - (1 - a)) / a; env = y * y * (3 - 2 * y); unit = k + 1; } else { env = Math.exp(-v * T2 / DECAY_S); unit = k; }
  return { env, strong: ((unit % 2) + 2) % 2 === 0 ? 1 : 0.72, unit, v };
}

/**
 * WHAT THE BEAT FOLLOWS (7a, simplified in the beat-sync pass — docs/audio.md#the-beat-sync-pass). One of:
 *   'grid'         the song's trusted grid through the Web Audio graph (the kick listener calibrates the lead + sets the strength)
 *   'direct-grid'  the song's trusted grid on THE DIRECT ELEMENT (M4: the graph is dead, the listener hears nothing): the grid
 *                  alone, on the element's own clock, at a steady strength
 *   'tempo'        no trusted grid: a steady pulse at the song's measured tempo on its loose grid's phase — never chasing kicks
 *   'calm'         no song: a calm 120 bpm of its own
 * A song never switches source mid-song: the source depends only on the song's grid and the way it is played.
 * song: { bpm, pos, grid?, untrusted?, loose? (the untrusted grid: its tempo + phase), direct? } | null
 */
export function beatMode(song) {
  if (song && song.pos >= 0) {
    if (song.grid && song.grid.bpm > 0) return song.direct ? 'direct-grid' : 'grid';
    if (song.bpm > 0 || (song.loose && song.loose.bpm > 0)) return 'tempo';
  }
  return 'calm';
}
// ---- 8a — PULSE STRENGTH (the owner: "crank it up higher" — and stop guessing: THE PREVIEW PANEL's LIGHTS → PULSE STRENGTH slider,
// the &pulse=<percent> flag). ONE multiplier on the city's punch at its source (scene.js#partyTick: PT.punch + the ripple's history),
// so every beat-driven light follows it at once — the tubes, the crowns' flare, the signs, the wheel, the sky beams, the pier lamps,
// the string lights, the NEON logo's party glow, SPEAKEASY's rings + word. Above PULSE_KNEE a soft knee eases the scaled punch toward
// PULSE_CAP (the tubes' punch is one extra additive draw at most — 2× lit — so a bigger number holds the peak a little longer, never
// a white wash); the troughs between beats stay where they are (the multiplier only grows the peak: never a full-screen flash).
/** THE DEFAULT — the owner's pick locks in HERE (FP: 1.75 = 175 %, her slider value on her iPhone; 8a's was 1.3) */
export const PULSE_DEFAULT = 1.75;
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

/** the strength a beat settles at when nothing is heard: the grid 0.85, the tempo pulse 0.6, the calm pulse 0.7 */
export const SETTLE = { grid: 0.85, 'direct-grid': 0.85, tempo: 0.6, calm: 0.7 };
/** the strength from the music's loudness (the listener's low-band energy 0..1 against its recent peak): a breakdown 0.45, a drop 1 */
export const levelOf = energy => 0.45 + 0.55 * clamp01(energy);

/**
 * Advance the clock by dt ms.
 *   song: { bpm, pos (s: the song's position AS HEARD), grid?: { bpm, t0, down }, untrusted?, loose?, direct?, snap? } | null
 *   kick: { live (the analyser hears the music), energy (0..1: the low end's loudness against its recent peak), hit? (a kick
 *          heard this frame — counted against the grid for the readout, never a punch) } | null
 * → hb (mutated): beats (continuous; with a grid 0 mod 4 = a downbeat), u (0..1 of the beat), T (s a beat), idx (0..3 in the
 * bar), bar (bars counted — never backwards), barU (0..1 of the bar), punch (0..~1), src (beatMode), level, live, drift (ms)
 */
export function advanceHarborBeat(hb, dt, song, kick) {
  const sec = Math.min(0.25, Math.max(0, dt / 1000));
  const mode = beatMode(song);
  // (on the direct element the kick listener's graph is dead: whatever it reports is stale — never trusted)
  if (song && song.direct) kick = null;
  // the phase source: the trusted grid; for the tempo pulse the untrusted grid's own tempo + phase when there is one
  const g = mode === 'grid' || mode === 'direct-grid' ? song.grid : mode === 'tempo' && song.loose && song.loose.bpm > 0 ? song.loose : null;
  const bpm = g ? g.bpm : mode === 'tempo' ? song.bpm : 0;
  hb.beats += hb.rate * sec;                     // (advance first, then pull toward the song as it sounds NOW: no frame of lead)
  if (bpm && song.pos >= 0) {
    const target = bpm / 60;
    const tb = g ? (song.pos - (g.t0 || 0)) * target - (g.down || 0) : song.pos * target;
    // the bar's phase, the shortest way round (in beats): a new song, a seek, a re-anchored song clock (song.snap) or a drift beyond
    // ~30 ms re-locks at once (FP: the lights never ease toward the beat for half a second after a return); a smaller one is pulled in.
    // The TEMPO is the song's from the first locked frame (a new song: at once; it never eases, never follows anything heard)
    let d = tb - hb.beats; d -= 4 * Math.round(d / 4);
    if (song.snap || hb.bpm !== bpm || Math.abs(d) * 60 / bpm > DRIFT_SNAP) { hb.beats += d; hb.rate = target; } else hb.beats += d * Math.min(1, sec * 4);
    hb.locked = Math.min(1, hb.locked + sec / 1.5); hb.bpm = bpm;
    // (the readout: the song's own bar + beat from its grid, and how far the lights' grid sits from the song as heard — ms)
    let d2 = tb - hb.beats; d2 -= 4 * Math.round(d2 / 4);
    hb.drift = d2 * 60 / bpm * 1000; hb.songBar = Math.floor(tb / 4) + 1; hb.songIdx = ((Math.floor(tb) % 4) + 4) % 4;
  } else {
    hb.rate += (CALM_BPM / 60 - hb.rate) * Math.min(1, sec * 0.8);
    hb.locked = Math.max(0, hb.locked - sec / 2.5); hb.bpm = 0;
    hb.drift = null; hb.songBar = null; hb.songIdx = null;
  }
  hb.src = mode;
  const b = hb.beats, T = 1 / Math.max(0.2, hb.rate), fb = Math.floor(b);
  hb.T = T; hb.u = b - fb; hb.idx = ((fb % 4) + 4) % 4;
  const bi = Math.floor(b / 4);
  if (bi > hb.barMax) { hb.bar += 1; hb.barMax = bi; }
  hb.barU = b / 4 - bi;
  const be = beatPunch(b, T);
  hb.env = be.env; hb.strong = be.strong;
  // THE SOUND sets only HOW HARD the city punches — from the music's loudness (never from when a kick lands: a kick heard between
  // the beats, or missing from one, changes nothing about the timing)
  hb.kick = 0;
  hb.live = !!(kick && kick.live);
  if (hb.live && kick.hit > 0) { hb.lastHit = b; if (bpm) { if (Math.abs(b - Math.round(b)) < 0.15) hb.hits.on++; else hb.hits.off++; } }   // (the readout + the tests: do the kicks land on the grid?)
  if (hb.live && mode === 'grid') {
    hb.energy = kick.energy == null ? 1 : clamp01(kick.energy);
    hb.level += (levelOf(hb.energy) - hb.level) * Math.min(1, sec * 2);
  } else {
    // (the tempo pulse of a song without a trusted grid, the calm pulse, the direct element: a steady strength — never chasing the sound)
    hb.level += (SETTLE[mode] - hb.level) * Math.min(1, sec * 1.5);
  }
  hb.punch = be.env * be.strong * hb.level;
  return hb;
}

// ---- 8b1 — THE SAFETY RULE (the owner, "THE BEAT SYNC IS STILL OFF"): the lights PUNCH on the trusted grid only while the heard
// offset (the lead the kicks calibrate — leadKick) is CONFIRMED: the strong kicks agree among themselves AND land within SAFE.tol of
// where the lights put the beat. Until then — a new song, a re-anchor, a settle after a return / a resume / a route change — the
// punch is allowed for SAFE.grace bars only when this device already knows its lead (a saved value, nothing settling); past that, or
// with nothing to confirm with (no trusted grid, the direct element's deaf listener, nothing heard), the city falls back to a gentle
// BREATHING pulse — one slow swell a bar, no attack — never a hard punch that may land off the beat. Once confirmed the punch holds
// through a breakdown (kicks scattered or quiet) for SAFE.hold bars, then breathes again until the kicks confirm it anew.
// The switch is a crossfade over ~a bar (k). PURE (tests/harbor.test.mjs).
export const SAFE = Object.freeze({ grace: 4, tol: 0.045, hold: 8, fade: 1.2, breathe: 0.32 });
export function createSafety() { return { mode: 'breathe', why: 'starting', k: 0, startBar: 0, okBar: null, key: '', n: 0 }; }
/**
 * One frame: x = { src (beatMode), bar (bars counted — hb.bar), song (its id | null), anchors (the song clock's re-anchors), live (the
 * listener hears the music), cal: { res (the agreed residual, s | null), fast (settling: { why } | null), n, seen, errs }, saved (this
 * device has a lead from an earlier visit) }, dt (ms) → sf (mutated): mode 'punch' | 'breathe', why (the readout), k (0..1 the punch's
 * share — eased), bars (bars since the song / the re-anchor / the settle began)
 */
export function stepSafety(sf, x, dt = 16) {
  const cal = x.cal || {}, src = x.src, bar = x.bar || 0;
  // (a new song, a re-anchored song clock or a settle starting: what was confirmed before is history)
  const key = `${x.song || ''}|${x.anchors || 0}|${cal.fast ? cal.fast.why || 'fast' : ''}`;
  if (key !== sf.key) { sf.key = key; sf.startBar = bar; sf.okBar = null; }
  const bars = Math.max(0, bar - sf.startBar);
  let mode = 'breathe', why = '';
  if (src === 'calm') { mode = 'punch'; why = 'no song — the city’s own 120'; }
  else if (src === 'tempo') why = 'no trusted grid — nothing to confirm';
  else if (src === 'direct-grid') why = 'direct element — the listener can’t hear it';
  else if (src === 'grid') {
    const confirmed = !cal.fast && cal.res != null && Math.abs(cal.res) <= SAFE.tol;
    if (confirmed) { sf.okBar = bar; mode = 'punch'; why = `lead confirmed · ${cal.errs || cal.n || 0} kicks`; }
    else if (!cal.fast && sf.okBar != null && bar - sf.okBar <= SAFE.hold) { mode = 'punch'; why = `confirmed ${bar - sf.okBar} bar${bar - sf.okBar === 1 ? '' : 's'} ago`; }
    else if (!cal.fast && x.saved && bars < SAFE.grace) { mode = 'punch'; why = `the saved lead — confirming (bar ${bars + 1}/${SAFE.grace})`; }
    else why = !x.live ? 'nothing heard (the listener is deaf)'
      : cal.fast ? `settling after ${cal.fast.why || 'a change'} (bar ${bars + 1})`
      : (cal.errs || 0) < LEAD_N ? `no kicks confirmed yet (bar ${bars + 1})`
      : cal.res == null ? 'the kicks don’t agree'
      : `heard ${Math.round(cal.res * 1000)} ms off the lights`;
  } else why = 'no beat';
  sf.mode = mode; sf.why = why; sf.bars = bars;
  sf.k += ((mode === 'punch' ? 1 : 0) - sf.k) * Math.min(1, Math.max(0, dt / 1000) * SAFE.fade);
  return sf;
}
/** the light's pulse now: the punch (the grid's) crossfaded with the breath — a gentle swell once a bar, peaking on its downbeat (a
 *  raised cosine: no attack, never a hard edge); b: hb.beats, level: hb.level */
export function safePunch(sf, punch, b, level = 0.7) {
  const u = ((b / 4) % 1 + 1) % 1, breath = SAFE.breathe * level * (0.5 + 0.5 * Math.cos(2 * Math.PI * u));
  return sf.k * punch + (1 - sf.k) * breath;
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
/** the music's loudness right now, 0..1: the smoothed low-band level against the recent peak (a drop ≈ 1, a breakdown ≈ 0.2) */
export const onsetEnergy = o => clamp01(o.level / (0.6 * Math.max(1e-4, o.peak)));

// ---- THE LEAD (M2 → the beat-sync pass, Oct 24 2026 — docs/audio.md#the-beat-sync-pass). A mood song is an <audio> element; the
// samples that reach the Web Audio graph (and the speaker after it) can run ahead of (lead < 0) or behind (lead > 0) its currentTime.
// Nothing reports it, so each phone MEASURES it: a kick the listener hears at element-clock `at` entered the graph `lag` earlier (the
// listener's own delay), so at − lag − the beat = the lead. Heard = at − the output − the lead. On iOS it MOVES: her phone read −34…−42
// ms in a fresh session and +107 / +237 ms after coming back from the home screen (WebKit re-buffers the element's audio on the way
// into the graph) — so the lead is ONE estimator that is always running:
//   · every strong kick on a trusted grid gives its distance from the nearest beat AS THE LIGHTS PLACE IT (wrapped to ± half a beat
//     round the current lead); the median of the last LEAD_KEEP, once LEAD_N agree (their middle half within LEAD_SPREAD), is the
//     residual — how far the sound sits from the lights
//   · SETTLING (leadFast: after a resume / rebuild / page return / route change): the lead moves to the residual in bounded steps
//     (half the gap a kick, ≤ FAST_STEP) — a +240 ms shift is absorbed in ~5 agreeing kicks after the first LEAD_N; it ends when the
//     residual is within LEAD_DONE (locked), or quietly after FAST_S s (the lead stays where it is: never a wrong value)
//   · LOCKED: small nudges only (≤ SLOW_STEP a kick toward the residual); a residual steadily past SKEW_S (the sound moved with no
//     event) starts a settle on its own
//   · scattered kicks (the middle half past LEAD_SPREAD) never move it; the lead is bounded to LIVE_MIN…LIVE_MAX; the value SAVED per
//     device stays within LEAD_MIN…LEAD_MAX (a return's shift is this visit's)
//   · the kicks never change the tempo, the beat index or the source — only this one number, slowly
// (Her iPhone: −42 ms with Safari's own outputLatency 18 ms — WebKit taps an element's audio ahead of its player clock; the sign is
// right: the lights land 24 ms before the element's clock reaches a beat, i.e. when the beat is heard.)
export const KICK_LAG = 0.024;              // the listener at 60 frames a second (offline replay of the party songs: 15–37 ms per song)
export const LEAD_MIN = -0.08, LEAD_MAX = 0.12;   // the range a SAVED device lead may take (a sane steady-state element lead)
export const LIVE_MIN = -0.25, LIVE_MAX = 0.35;   // the range the live lead may take (a return can move it a quarter beat and more)
export const LEAD_N = 6, LEAD_KEEP = 24, LEAD_SPREAD = 0.06, LEAD_DONE = 0.006;
export const FAST_STEP = 0.08, SLOW_STEP = 0.01, FAST_S = 40, SKEW_S = 0.08;
/** the listener's delay at this frame interval (s): it samples once a frame, so a slower frame hears a kick later (30 Hz: +8 ms) */
export const kickLag = frameS => KICK_LAG + Math.max(0, Math.min(0.03, ((frameS || 1 / 60) - 1 / 60) / 2));
const clampSaved = v => Math.max(LEAD_MIN, Math.min(LEAD_MAX, +v || 0));
const clampLive = v => Math.max(LIVE_MIN, Math.min(LIVE_MAX, +v || 0));
const wrap = (e, p) => e - p * Math.round(e / p);
/**
 * a lead estimator: v (s, applied), n (kicks behind the current value), errs (the last LEAD_KEEP residuals, relative to v), res (the
 * agreed residual or null), fast ({ why, at, from } while settling), last (the last settle: the readout), def (the platform default).
 * saved: the device's stored lead (clamped to the saved range) or null; def: the platform default when nothing is saved (iOS: −40 ms).
 */
export function createLead(saved = null, def = 0) {
  const v = saved == null ? clampLive(def) : clampSaved(saved);
  return { v, n: saved == null ? 0 : LEAD_N, errs: [], res: null, fast: null, last: null, def: clampLive(def), seen: 0 };
}
/** start SETTLING (why: 'resume' | 'rebuild' | 'visible' | 'pageshow' | 'route' | 'skew'; now: ms) — the kicks before it are history */
export function leadFast(c, why = '', now = 0) {
  c.fast = { why, at: now, from: c.v };
  c.errs = []; c.res = null;
  return c;
}
/** the song clock re-anchored (a jump, a seek, an event): the residuals measured before it are history; the lead stays */
export function leadAnchor(c) { c.errs = []; c.res = null; return c; }
/** a strong kick heard at element-clock `at` → its distance from the nearest grid beat (s, within ± half a beat), or null with no grid */
export function kickErrWide(at, grid, lag = KICK_LAG) {
  if (!grid || !(grid.bpm > 0)) return null;
  const p = 60 / grid.bpm, x = at - lag - (grid.t0 || 0);
  return x - Math.round(x / p) * p;
}
/**
 * One strong kick on a trusted grid, its wide error (kickErrWide) → what it did: 'wait' (gathering), 'scatter' (the kicks don't
 * agree: nothing moves), 'fast' (settling: the lead stepped), 'locked' (a settle finished), 'learn' (a locked lead nudged), 'ok'
 * (agreed, nothing to move), null (no grid).
 */
export function leadKick(c, wide, grid, now = 0) {
  if (wide == null || !grid || !(grid.bpm > 0)) return null;
  const p = 60 / grid.bpm;
  if (c.fast && now - c.fast.at > FAST_S * 1000) { c.last = { why: c.fast.why, from: c.fast.from, to: c.v, at: now, ok: false }; c.fast = null; }
  // (the kick's distance from where the LIGHTS land — the residual — wrapped round the current lead: a +280 ms and a −280 ms reading
  // at 106 BPM are the same 6 ms apart)
  const e = wrap(wide - c.v, p);
  c.errs.push(e); if (c.errs.length > LEAD_KEEP) c.errs.shift();
  c.seen++;
  if (c.errs.length < LEAD_N) { c.res = null; return 'wait'; }
  const stats = arr => { const s = arr.slice().sort((a, b) => a - b); return { med: s[s.length >> 1], spread: s[Math.floor(s.length * 0.75)] - s[Math.floor(s.length * 0.25)] }; };
  const move = step => { const v2 = clampLive(c.v + step), d = v2 - c.v; c.v = v2; for (let i = 0; i < c.errs.length; i++) c.errs[i] -= d; if (c.res != null) c.res -= d; c.n = c.errs.length; };
  // (the sound moved with no event we saw — iOS re-buffering mid-song: the LAST LEAD_N kicks agree among themselves, steadily past
  // SKEW_S from where the lights land, while the older residuals sit near 0. Settle on the new ones: the old are history)
  if (!c.fast && c.errs.length >= LEAD_N + 2) {
    const r = stats(c.errs.slice(-LEAD_N));
    if (r.spread <= LEAD_SPREAD && Math.abs(r.med) > SKEW_S) { c.fast = { why: 'skew', at: now, from: c.v }; c.errs = c.errs.slice(-LEAD_N); }
  }
  const { med, spread } = stats(c.errs);
  if (spread > LEAD_SPREAD) { c.res = null; return 'scatter'; }
  c.res = med;
  if (c.fast) {
    if (Math.abs(med) <= LEAD_DONE) { c.last = { why: c.fast.why, from: c.fast.from, to: c.v, at: now, ok: true }; c.fast = null; c.n = c.errs.length; return 'locked'; }
    move(Math.sign(med) * Math.min(FAST_STEP, Math.max(0.004, Math.abs(med) * 0.5)));
    return 'fast';
  }
  if (Math.abs(med) > 0.004) { move(Math.sign(med) * Math.min(SLOW_STEP, Math.abs(med) * 0.25)); return 'learn'; }
  c.n = c.errs.length;
  return 'ok';
}
/** the lead for the readout: { state: 'default' | 'settling' | 'locked' | 'settled', ms, from?, why?, n, ago? } */
export function leadState(c, now = 0) {
  const ms = v => Math.round(v * 1000);
  if (c.fast) return { state: 'settling', ms: ms(c.v), from: ms(c.fast.from), why: c.fast.why, n: c.errs.length };
  if (c.last && now - c.last.at < 20000) return { state: 'settled', ms: ms(c.v), from: ms(c.last.from), why: c.last.why, ok: c.last.ok, n: c.errs.length, ago: Math.round((now - c.last.at) / 1000) };
  if (!c.n) return { state: 'default', ms: ms(c.v), n: 0 };
  return { state: 'locked', ms: ms(c.v), n: c.n };
}
/** the value to SAVE for this device (the steady-state lead, within the saved range) — or null while settling / with nothing learned */
export const leadToSave = c => (c.fast || !c.n ? null : +clampSaved(c.v).toFixed(3));
/** the song's position AS HEARD: the element's clock − the output latency − the element's lead */
export const heardPos = (at, out, lead) => Math.max(0, at - out - lead);

// ---- FP — THE SONG CLOCK (the owner, Oct 23: after the home screen "the lights pulse to random beats"). The beat's position comes
// from the SONG — the media element's currentTime — never from a clock started with the music. currentTime is read every frame but
// may move in coarse steps (iOS), stick for a moment, or jump (a seek, a stall, a return from the background); so the clock keeps an
// ANCHOR (the element's time, the frame time it was read) and runs it forward at the playback rate. Each FRESH reading (the value
// changed) is compared with the run-forward position:
//   within SC_SLEW (30 ms)        slewed in gently (a frame's jitter: never a visible hitch)
//   beyond SC_JUMP (250 ms)       re-anchored at once (a seek, a stall, the background — a discontinuity)
//   30…250 ms                     re-anchored when TWO fresh readings in a row agree (a real drift, not one late update)
// Re-anchored at once on any event (song change, play / pause / resume, seek, stall / waiting, ratechange, the page back on screen, a
// new audio context): `why`. A reading that stops changing while the element plays is run forward for SC_HOLD s at most (a stalled
// element isn't advancing the sound either), flagged `stuck` after SC_STUCK s.
export const SC_SLEW = 0.03, SC_JUMP = 0.25, SC_STUCK = 0.6, SC_HOLD = 2;
export function createSongClock() {
  return { id: null, at: 0, perf: 0, raw: -1, rawPerf: 0, rate: 1, err: 0, pend: 0, stuck: false, anchors: 0, why: '', pos: -1, snap: false };
}
/**
 * One frame: r = { id, t (the element's currentTime, s), rate? (playbackRate), paused? } | null, now (ms), why (an event since the
 * last frame: re-anchor) → the song's position (s), or −1 (nothing playing). sc.snap = this frame re-anchored (the beat clock jumps
 * with it instead of easing); sc.err = the last fresh reading vs the run-forward clock (s); sc.stuck.
 */
export function songClockStep(sc, r, now, why = '') {
  sc.snap = false;
  if (!r || !r.id || r.paused || !(r.t >= 0)) { if (sc.id) { sc.id = null; sc.why = r && r.paused ? 'pause' : 'stop'; } sc.pos = -1; return -1; }
  const rate = r.rate > 0 ? r.rate : 1;
  const anchor = w => { sc.at = r.t; sc.perf = now; sc.raw = r.t; sc.rawPerf = now; sc.err = 0; sc.pend = 0; sc.stuck = false; sc.anchors++; sc.why = w; sc.snap = true; sc.rate = rate; return (sc.pos = r.t); };
  if (r.id !== sc.id) { const w = why || (sc.id === null && (sc.why === 'pause' || sc.why === 'stop') ? 'resume' : 'song'); sc.id = r.id; return anchor(w); }
  if (why) return anchor(why);
  if (rate !== sc.rate) return anchor('rate');
  const run = ms => sc.at + Math.max(0, ms - sc.perf) / 1000 * sc.rate;
  if (r.t !== sc.raw) {
    const e = r.t - run(now);
    sc.raw = r.t; sc.rawPerf = now; sc.stuck = false; sc.err = e;
    const a = Math.abs(e);
    if (a > SC_JUMP) return anchor('jump');
    if (a > SC_SLEW) {
      if (sc.pend && Math.sign(sc.pend) === Math.sign(e)) return anchor('drift');
      sc.pend = e;
    } else {
      sc.pend = 0;
      // (slew: move the anchor a quarter of the way to the reading — a 16 ms jitter shifts the clock by 4 ms)
      sc.at = run(now) + e * 0.25; sc.perf = now;
    }
  } else if ((now - sc.rawPerf) / 1000 > SC_STUCK) sc.stuck = true;
  // (a reading that stopped changing: run forward SC_HOLD s past it at most — then hold)
  return (sc.pos = run(Math.min(now, sc.rawPerf + SC_HOLD * 1000)));
}
