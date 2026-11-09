// PRISM DROP — THE HEARD BEAT (PD-5A — PURE: no DOM, no audio; tests/prism-sync.test.mjs). docs/prism.md "THE BEAT FIX".
//
// Before PD-5A the beat-timed visuals (the world's pulse, the countdown's numbers) ran on the SERVER clock — (serverNow − the song's
// start) — while the song plays on the AUDIO clock, and what the browser can't see sits between the two: an iPhone reports no output
// latency (its speaker ~20 ms; Bluetooth far more), and SETTINGS → SPEAKER DELAY moved the song earlier but not the lights. So the
// lights ran AHEAD of what you hear. Now every beat-timed thing reads ONE position — the song AS HEARD:
//
//   heard = (the audio clock's heard time − the playing voice's origin) − speaker (SPEAKER DELAY) − unreported − lead
//
//   origin       the ctx time at which the voice plays file position 0 (synced-songs.js — the voice that is actually sounding, so a
//                voice re-placed after a suspension is followed exactly; the song's cue-in is inside it)
//   speaker      SETTINGS → SPEAKER DELAY (s): the song is played that much EARLIER into the speaker; the lights hold back the same
//   unreported   the delay after the graph the browser reports nothing about (an iPhone's built-in speaker: 20 ms — the city's figure)
//   lead         THE CITY's MEASURED LEAD (core/harbor-beat.js): a listener on PRISM's song chain hears the kicks; each strong kick's
//                distance from the grid calibrates where the sound sits against the analysed beats (a trusted grid ALWAYS punches —
//                the kicks only move this one number, slowly, bounded)
//
// The musical SFX land on the HEARD beat by scheduling on the SAME clock as the song: at = origin + songT + lead (both go through the
// same speaker after that — no speaker term).
export const IOS_OUT = 0.02;

/** the delay after the graph the browser's clock map does NOT include (s): 0 when it reports one (outputLatency, or an output
 *  timestamp that lags the context's clock), else an iPhone's built-in speaker (WebKit) — 0 elsewhere */
export function unreportedOut({ outputLatency = 0, stamp = 0, webkit = false } = {}) {
  return outputLatency > 0 || stamp > 0.003 ? 0 : webkit ? IOS_OUT : 0;
}

/** the song's position (file seconds) AS HEARD — see the top */
export function heardSongPos({ heardCtx, origin, speaker = 0, unreported = 0, lead = 0 }) {
  return heardCtx - origin - speaker - unreported - lead;
}

/** the same, from the server clock alone (no voice sounding yet — the song still loading): the song's place on the room's clock
 *  (serverMs − startMs, + its cue-in) − unreported − lead (the speaker delay cancels: the song is played that much earlier) */
export function serverSongPos({ serverMs, startMs, cue = 0, unreported = 0, lead = 0 }) {
  return (serverMs - startMs) / 1000 + cue - unreported - lead;
}

/** the ctx time to schedule a sound at song time songT (file s) so it lands on the beat AS HEARD (the song's own clock + the lead) */
export const ctxForSongTime = ({ origin, songT, lead = 0 }) => origin + songT + lead;

/** THE BEAT PULSE (the world's flash, PRISM's light): 0..1 — a hard hit ON the beat, decaying over it; the downbeat full, the rest 0.6.
 *  clk: songs.js#beatClock, pos: the heard position (s) */
export function beatPulse(clk, pos) {
  if (!clk || !(pos >= 0)) return { v: 0, down: false, idx: 0, ph: 0 };
  const bi = clk.indexAt(pos);
  const ph = (pos - clk.timeOf(bi)) / clk.period;
  const down = ((bi - clk.phase) % 4 + 4) % 4 === 0;
  return { v: Math.exp(-Math.max(0, ph) * 5) * (down ? 1 : 0.6), down, idx: bi, ph };
}

/** a kick the listener heard at graph position `graphPos` (s, the voice's own clock), `lag` s after it entered → its distance from the
 *  nearest grid beat (s, within ± half a beat) — the input of core/harbor-beat.js#leadKick (with the grid { bpm, t0 }) */
export function kickErr(clk, graphPos, lag) {
  if (!clk || !(clk.period > 0)) return null;
  const x = graphPos - lag;
  const b = clk.timeOf(clk.indexAt(x));
  let e = x - b;
  if (e > clk.period / 2) e -= clk.period;
  return e;
}
/** the grid leadKick wants, for this song (its tempo; t0 = 0 — kickErr already measured from the nearest beat) */
export const leadGrid = clk => (clk && clk.period > 0 ? { bpm: 60 / clk.period, t0: 0 } : null);
