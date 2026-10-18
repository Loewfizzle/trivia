# PULSE (rhythm game)

Deep-dive for PULSE: timing engine, judging, calibration, renderer, beat maps, adding songs. Part of the NEON SPEAKEASY developer docs (see CLAUDE.md).

## PULSE (rhythm game)
**Timing engine (`clock.js`) — never use Date/setTimeout for game timing.** `heard(perfMs)` maps a performance-clock
time to the AudioContext time *being heard* (`getOutputTimestamp`, median-smoothed; falls back to currentTime −
outputLatency). Song position heard = `heard(perf) − origin`, where `origin` = ctx time of song position 0 =
`ctxAtServer(songStartAt)`. Judged/drawn time subtracts the device calibration. Taps use the pointer event's own
`timeStamp`. Scheduled sound (song start, countdown ticks, Echo tones) is **never** calibration-shifted — only what the
player perceives (visuals, taps) is.
- Sync: the host ends `load` when every online participant reports `ready` (song decoded + sound unlocked + calibrated
  or skipped) or after 30 s, then sets `songStartAt = now + 5 s` (server time). Each phone schedules its own AudioBuffer
  so position 0 is heard at that server instant (`playSong`). Late / refreshed / back-from-background phones start
  mid-song at the right offset; `resume()` restores published stats and counts unaccounted earlier notes as misses.
- Judging (`logic.js`): PERFECT ±45 ms, GREAT ±90, GOOD ±135, else MISS (`expire`). A tap with no note of that lane
  within 250 ms is a stray (−10, combo kept); a near-miss just outside GOOD is forgiven. Points 100/70/40 × multiplier
  (×1 +1 per 10 combo, max ×4). Chords = two notes at one time; each lane is judged independently (multi-touch).
- Calibration (`calibrate.js`): 100 BPM clicks, 4 count-in + 10 taps, median of (tap heard − click heard); MAD > 70 ms
  = retry. Stored in `localStorage['na:pulse:calib']` with the output latency at the time; a different latency or a
  `devicechange` event suggests recalibrating. The highway pauses while the overlay is up.
- Renderer (`render.js`): sky + 2–4 parallax skyline layers (procedural, seeded), haze, horizon glow, wet road with
  baked reflections, edge glow, lane flashes, streetlights, notes (+ reflections), pads, particles, rain, bokeh —
  all pre-rendered once per resize/tier; a frame is drawImage + a few polygons. Tiers (high/mid/low: DPR 2/1.5/1, rain,
  bokeh, particles, reflections, layers) step down when the p75 frame time > 19.5 ms. Music-reactive via the beat map's
  `energy` (city brightness, haze colour) and the beat phase (windows, holo signs, edge lights). Preview without a game:
  `tests/integration/pulse-preview.html?t=34&tier=2&combo=60&fx=1&song=pulse2&diff=hard`.
- Measured: the renderer alone holds 60 fps at every tier on a 4× CPU-throttled desktop; the full game too (p95 16.8 ms).
- Hit sounds: `settings.pulseHits` (off by default). Song volume = music bus (Music slider). Menu music fades out for
  the whole match (`MUSIC = null`); the podium plays the victory track.

**Beat maps (`scripts/build-beatmaps.py`).** The map is computed from the *encoded* file decoded back (so note times
match exactly what browsers play — verified 0 ms offset in Chromium). Grid: librosa's tracker seeds a search over tempo
(±4 %, 0.005 BPM) and phase that maximises onset energy over the whole song; a per-quarter drift check falls back to
the tracked beats for genuinely variable tempo; `ONSET_BIAS` (11 ms) corrects the onset curve's lag — measured with
`scripts/check-beatgrid.py` (synthetic drums at known times: |error| < 1 ms at 98–165 BPM). Notes sit only on quarter /
eighth slots, picked per bar by drum strength (HPSS percussive part, low/mid/high band flux) with density scaled by the
section energy; lanes follow the dominant band (kick left, snare centre, hats right) with a balancing nudge, no 4-in-a-
row on one lane, no same-lane repeats faster than an eighth (a beat on Easy); chords (Hard) on strong high-energy beats.
Trims songs > 3:15 to their most energetic ~2:50 (fade in/out), skips intros > 12 s before the beat, 2 s note lead-in.

**Adding PULSE songs** (the owner drops `pulse6.mp3`, `pulse7.mp3`, … into ~/Downloads and asks to "add the new PULSE songs"):
1. One-time setup (if `~/.cache/neural-arcade/pyenv` is gone): `py -m venv ~/.cache/neural-arcade/pyenv` then
   `~/.cache/neural-arcade/pyenv/Scripts/python -m pip install librosa imageio-ffmpeg mutagen soundfile`.
2. `~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-beatmaps.py` — builds only new/changed songs (any
   `pulse<N>` / `pulse-<N>` mp3/m4a/wav/ogg/flac in ~/Downloads; `--src DIR`, `--only 6,7`, `--force`). It prints BPM,
   length, trim, steadiness (per-quarter drift should be within a few ms) and how many notes sit on a clear hit.
3. `node --test tests/pulse.test.mjs` (every map: on the grid, playable lanes, Easy < Normal < Hard).
4. Look at the song in `pulse-preview.html?song=pulse6` and play it once (an E2E: `SONG=pulse6 N=2 node e2e-pulse.mjs …`).
5. Commit `audio/pulse/`, `data/pulse/` and push. Titles/artists come from ID3 tags, else "Track 06"; to rename, edit
   `title`/`artist` in `data/pulse/manifest.json` **and** `data/pulse/pulse6.json` (a rebuild overwrites them).

