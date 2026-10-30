# Audio + loading

Audio engine, music system, playlists; loading, PWA, previews, Lighthouse.

## Audio
- `installAudio()` (engine) + `installSettingsPanel()` run at boot. The AudioContext is created/resumed on the first
  pointer/key event (iOS requires a gesture). `navigator.audioSession.type` (iOS 17+) = `'playback'` while the music is on (plays with the
  silent switch on, like YouTube), `'ambient'` with the music off / muted (M4 below). A dead graph never silences the music: the song falls
  back to a plain `<audio>` element (THE DIRECT PATH, M4).
- Music: `app.js` render calls `playMusic(track, fallback)` for the current state (menu for title/setup/lobby,
  `module.MUSIC` in a game, `'victory'` on the final phase with the game track as fallback). Same track = no-op (never
  restarts). Tracks load lazily (`prefetch` when the host opens a game's options or a match starts). Three `<audio>`
  voices -> MediaElementSource -> per-voice gain -> music bus; they are activated inside the unlock gesture so iOS lets
  them play later. Loops crossfade 1.8 s into a fresh copy before the end. iOS often refuses
  resumes after an app switch or pauses the track around the system keyboard: `engine.js` retries on every
  tap/keystroke/focus/pageshow and fires `onResume`; `music.js#watchLoop` restarts a current track the OS paused
  (regression test: `tests/integration/audio-resume.mjs`). M2: a context iOS won't give back is REBUILT in the next tap — below. A missing file marks the track missing and
  falls back or stays silent, with no errors.
- SFX: `sfx(name, opts)`, names in `SOUNDS` (tap, key, select, lock, join, playerJoined, flip{state,i}, correct, present,
  absent, solve, invalid, tick{last}, roundEnd, shimmer, strike, hit, shieldBreak, eliminate, challenge, ocCorrect, ocWrong,
  node{i}, victory). Buttons get a soft `tap` automatically; add `data-sfx="none"` to opt out.
- `window.__arcade.musicDebug()` exposes music state (the E2E asserts crossfades with it).
- To replace music: drop an MP3 with the same name into `audio/music/` (≈128 kbps, < 4 MB). Browsers cache `/audio/` for a week
  (vercel.json), so **bump that file's number in `music.js#REV`** (it adds `?v=N`) or phones keep playing the old copy.
- **Menu music (CLASSIC setting)** is a playlist of four tracks (`menu1..4` = files menu, menu2, menu3, menu4), shuffled fresh on every page load
  (`PLAYLISTS.menu`); it keeps its place during a game and carries on in the lobby.
- **Victory music** (every podium) is a playlist of four short fanfares (`victory1..4` = victory, victory2-4), shuffled per page
  load; `FRESH_EACH_TIME` makes each new podium start on the next one. A fallback may be a playlist (NEON PAR → menu).
- **Playlists:** `PLAYLISTS = { spy: ['spy1','spy2','spy3'], menu: shuffled }` — `playMusic('spy')` plays them in order with crossfades and
  keeps going across rounds (same id = no-op). `duckMusic(level, seconds)` lowers the music bus for a moment (DOUBLE AGENT's
  unmasking); a track change resets it.


## THE BEAT (PARTY NIGHTS, Oct 20 2026) — `js/audio/beat.js`
`beatSource()` → `{ id, bpm, pos }` for the song sounding on this phone right now: in a lobby the room's synced song
(`lobby-music.js#lobbyNow`, the synced player's loudest voice), else this phone's mood song (`music.js#nowPlaying`); bpm from
`data/mood-music.json`. null when nothing can be followed (music off or muted, CLASSIC menu music, not unlocked yet, a song
loading) — the city then breathes slowly on its own. The title's scene polls it every frame; the lobby backdrop too.

**NEON PASS 5 (City 2.0 — the owner: "the way it interacts with the beat just is a little off… not very impressive")** — three layers:
- **THE GRID** (`scripts/build-mood-music.py`, `grid()`; `--grid-only [--only a,b]` rebuilds just the grids): every mood song's
  exact tempo + first beat + downbeat from PULSE's beat tracker (`build-beatmaps.py#beat_grid`: tempo to 0.005 BPM + phase on the
  percussive part, kept in 90–180) and the kick band's strongest of the four beats → `data/mood-music.json` `songs[id].grid =
  { bpm, t0 (s), down (0..3), steady, drift }`. The old `bpm` (librosa's coarse tempo bins, no offset) was WRONG for many songs —
  measured as the onset energy on the beats vs between them: the grid 4–100× (e.g. spy2 133.33 BPM: 13.6×), the old value ~1.0, no
  better than chance (spy2's stored 99.4). `beatSource()` now returns `{ id, bpm, pos, grid }` with `pos` AS HEARD (minus the
  context's `outputLatency + baseLatency`, ≤ 0.35 s). The lobby's synced song uses the same grid on the server clock.
- **THE SOUND** (`beatKick()`): the music bus → a 150 Hz low-pass → an AnalyserNode → a silent gain → the destination (WebKit only
  runs nodes that reach it), built the first time a party asks. Each frame the RMS of its last window → `core/harbor-beat.js#
  onsetStep` (spectral-flux style: the rise vs the recent rises' mean + 1.5 σ, ≥ 0.18 s apart, ≥ 30 % of the peak of the last ~45 s)
  → a kick and its strength, released after the output latency (the light lands when the sound does). `{ hit, live }` or null
  (music off / muted / no Web Audio).
- **THE CLOCK** (`core/harbor-beat.js#advanceHarborBeat`, City 2.0 only — City 1.0 keeps `core/party.js#advanceBeat`): locks to the
  grid (bars on the real downbeats, a new song re-locks at once, the bar count never runs backwards); ~~the pulse HALF-TIME (beats 1 +
  3, the downbeat hardest, a 50 ms attack, a 0.24 s decay); a kick heard on a strong beat sets how hard the city punches (a quiet
  passage or a breakdown with no kick calms it), a kick between them is a small hit of its own; a song with no grid punches on
  every real kick~~ — **since THE BEAT-SYNC PASS (Oct 24, below): EVERY beat punches from the grid alone, the kicks only calibrate the
  lead and the loudness sets the strength**; no music: a calm 120 bpm of its own. Checked on real songs in headless Chrome (overclock, late2, slip5): locked
  to the grid, the analyser live 97–100 %, 63–78 % of the kicks it hears within ±0.15 beat of the grid's beats (chance: ~30 %).
  The `&debug=1` readout shows `beat grid 130.0 · bar 12 · 3/4 · kick 0.86` on a party night. NEON PASS 6: when it's calm it says
  why (`beatWhy()`: `beat calm — music off` / `muted` / `tap for sound` / `classic music` / `songs loading` / `no song`), and
  `· kick unheard` when a song is followed but the analyser hears nothing. **iOS**: an `<audio>` element's `currentTime` may move in
  coarse steps — `beatSource` carries the position forward on the frame clock between its steps (`dequantize`), so the clock never
  jerks with them. The racing lights take only the TEMPO from it (their speed), never the phase (docs/harbor/passes/neon-pass-6.md).
**THE NEON BUZZ** (`ambience.js#neonBuzz({ on, dur, level })`, City 2.0 only — docs/harbor.md cleanup pass 1): the main sign's
sputters at the dusk warm-up and the morning fade, one per flicker — a tube striking: a crisp tick (a 25–75 ms band-passed click + a
sine zap 3.6 → 0.9 kHz in 18 ms) then the gas's buzz (120 Hz saw + 240 square + 60 saw through a 1.4 kHz bandpass and a 220 Hz
highpass, a faint 5 kHz hiss, the level stepping unsteadily, ≤ 1.4 s) for as long as the plan holds the flash; dropping out: a
softer tick. On the SFX bus (the Effects slider, Mute); peaks ~0.03 — under the music, never relied on. **Since NEON PASS 2 it is
the fallback** — City 2.0 plays the recordings below; the synthesized buzz plays only when a file can't load.

**THE RECORDED NEON** (NEON PASS 2, Oct 21 2026; retuned in NEON PASS 3 + 4, Oct 22, after the owner listened on her iPhone — City 2.0
only; `ambience.js#neonFlicker / neonDropout / neonCatch / neonHumFade / neonPreload`, driven by `title.js#applyNeon`, `#warmFlicker`,
`#neonOnSound`, `#scheduleFlicker` and `#buzz`): real neon in `audio/sfx/` (mono 44.1 kHz 16-bit WAV, ~770 KB in all, nothing fetched
until City 2.0 is up and audio unlocks). **When it sounds (NEON PASS 3 + 4):** the golden-hour WARM-UP is SILENT (its sputters were
annoying) **except its LAST 30 s** (NEON PASS 4, `title.js#warmFlicker`): from 30 s (on the plan's clock) before THE CATCH each tube
striking plays a flicker, building toward it — level 0.3 → 0.8, never closer than 4 s → 1.2 s apart in real time (4–9 of them, median
7, over the plan's seeds); the dawn's stutters are silent — only the very last tube's dropout at dawn sounds, softly (0.55); a RANDOM FLICKER of the lit sign (every 20–40 s,
`scheduleFlicker`) plays a flicker (0.8); THE CATCH plays the power-on and the hum comes up with it and FADES OUT smoothly over the
10 s after the sign is fully on (`neonHumFade`: an equal-power curve, then it stops — no hum all night); TAPPING THE SIGN: the
dropout when the tapped letter goes dark, the power-on + the same fading hum when it lights (0.75 → **0.5625 since Part 8a**, the owner: ~25 %
quieter, ≈ −2.5 dB — `title.js#NEON_TAP_LEVEL`; THE CATCH + the first-tap surge keep their level; none under Reduced effects):
| file | what | when | level |
| --- | --- | --- | --- |
| `neon-flicker-1…4.wav` (0.6–0.8 s) | a tube striking | the lit sign's rare random flicker; the warm-up's last 30 s — one at random, never the same twice running, ±3 % pitch | −20 LUFS |
| `neon-dropout.wav` (0.75 s) | a tube's buzz cutting out | the last letter dying at dawn (softly); a tapped letter going dark | −20 LUFS |
| `neon-power-on.wav` (2.1 s) | the strike settling into the hum | THE CATCH (all four letters lock on); a tapped letter re-igniting | −20 LUFS |
| `neon-hum-loop.wav` (3.0 s) | the steady mains hum | after a power-on only: up with it, held until the sign is fully on (1.5 s), then faded out over 10 s; cut when the page hides | −24 LUFS |
Cut + levelled by `scripts/build-neon-sfx.py` (BS.1770 K-weighted loudness, a soft peak limiter at −1 dBFS; the hum's loop length
nudged to where its wave lines up, then crossfaded in phase — the level holds through the seam ±0.4 dB). Sources (Freesound, all
**CC0**): 500693 *bolkmar* "neon tube light flickering" (flickers 1–2), 202612 *ludwigmueller* "fxlm neon lights flicker bathroom"
(3–4), 351430 *kinoton* "neon lamp switch on hum" (power-on), 125064 *everydaysounds* "faulty fluorescent light starter hum"
(dropout + hum).

**The levels (NEON PASS 4, Oct 22 — the owner's iPhone: the flickers were heard over the music and could startle with it off).** Each
one-shot plays at the file's level × `NEON_GAIN` (1, the master trim) × `NEON_GAINS[sound]` × the caller's level, **fades in over 6 ms**
(`NEON_ATTACK`: no click on the first sample), **−3 dB more while the music is off** (`NEON_NO_MUSIC` 0.71: settings.musicOff or the
music slider at 0 — nothing to sit under), then through a shared chain per kind into the SFX bus (the Effects slider, Mute): a soft
**PEAK CAP** (a WaveShaper: linear up to half the cap, a tanh knee above — an absolute ceiling whatever the level or the music) and, for
the flickers, a **4.5 kHz low-pass** (Q 0.707). Measured on the files (BS.1770, before the Effects slider; the default slider 0.7 is
another −6 dB):
| sound | gain (was → now) | cap | the lit sign / the catch, was → now |
| --- | --- | --- | --- |
| flickers | 1 → **0.28 (−11 dB)** × a per-file trim 1.6 / 1.15 / 1.15 / 1.05 (1–2 are bright: the low-pass takes more from them) | 0.08 (**−22 dBFS**) + the low-pass | at 0.8: −21.9 LUFS, peaks −4 … −6 dBFS → **−33.7 … −35.1 LUFS, peaks ≤ −22 dBFS** (≈ −12 dB); the warm-up's quietest (0.3) ≈ −41 LUFS |
| power-on | 1 → **0.5 (−6 dB)** | 0.35 (−9 dBFS) | the catch: −20.1 LUFS, peak −1 dBFS → **−26.3 LUFS, peak −9.5 dBFS**; a tap (0.75) −28.7 → 8a (0.5625) **−31.2** |
| dropout | 1 → **0.5 (−6 dB)** | 0.35 | a tap (0.75): −22.5 → **−28.5 LUFS** → 8a (0.5625) **−31.0**; dawn (0.55) −25.2 → **−31.2** |
| hum | 1 (unchanged) | — (its own fade, no chain) | −24 LUFS × the caller's level, as before |
The synthesized fallbacks (`neonBuzz`, a file that can't load) play at half the caller's level. `ambience.js#neonLog` keeps the last
40 one-shots `{ name, kind, gain, at }` and `__district.neonWarmSounds()` counts the warm-up's flickers (for tests).

**Fireworks** (`ambience.js#fireworkBurst({ delay, level })`): the finale's sound on the SFX bus — a soft low thump (a sine
dropping 96 → 42 Hz with a little filtered body) and 10–18 tiny bright crackles over the next 1.5 s, panned about; quiet.

## M2 — THE MUSIC COMES BACK (Oct 23 2026; both cities) — `audio/engine.js`, `audio/music.js`, `ui/settings-panel.js`, `board/public.js`
The owner's iPhone: after switching away from Safari the music was off, the music button didn't bring it back, sometimes only a reload did.
- **The engine asks, then checks:** every resume we ask for (back on screen, a bfcache `pageshow`, `focus`, `navigator.audioSession`'s statechange
  (iOS 17+), the OS taking the context while we're on screen — a call, Siri, another app's audio) is checked 1.5 s later. A context still not
  running is **stuck**, and the NEXT TAP anywhere **rebuilds** it: a fresh AudioContext (+ the buses + the limiter), created and started inside
  that tap (which iOS always allows), the old one closed. `onRebuild` listeners move over: `music.js` re-makes its voices IN THE SAME TAP (a new
  element may only start in a gesture) and carries the song on from its place; `synced-songs.js` (the lobby's room song, PRISM, SLIPSTREAM) drops
  its dead voices at once and re-places the song on the room's clock as soon as the new context runs; `pulse/clock.js` re-samples the new clock
  (and never samples a suspended one — its stopped clock mapped the wrong time); `sfx.js` rebuilds its reverb chain; the games' audio modules
  already key their nodes to `getContext()`. Every tap also runs `onGesture` listeners (things only a gesture may restart).
- **The music player heals:** back on screen it plays the song again (from the saved place); a song element that ERRORS (a lost connection while
  the phone slept, a decode hiccup) is no longer marked "missing" for the visit — a HEAD request decides: only a real 404 / 410 is missing,
  anything else is reloaded at its place; a STALL (playing but its clock still for 5 s) reloads from there; a play() the OS refuses marks
  "needs a tap"; THE PROBE (a small analyser after the voices, before the bus — so mute / MUSIC OFF don't matter) sees a voice whose clock runs
  but which sends digital silence (WebKit's element → Web Audio link after the lock screen): the next tap re-makes the voices, same song, same
  place. The silent wav that activates a new element in the gesture never pauses a song that took it meanwhile.
- **The music button:** if the music is meant to be ON but isn't sounding (or the tap just found the audio stopped), the tap means PLAY —
  it rescues the music inside the tap, toasts MUSIC ON and leaves the setting on; with music playing it switches off as before; switching it
  ON also makes sure it plays. (A second tap within 1.5 s of a rescue is the same "play".) THE BOARD's button does the same.
- **Debug:** `__arcade.musicDebug().health` → `{ sounding, needTap, dead, heals, last, peak, state, stuck, rebuilds, why, unlocked, visible }`;
  test hooks `engine.js#simulateStuck(state)` (resume() never settles — the iOS case) and `music.js#musicSimulateDead()`.
- **Tests:** e2e-harbor `music` (leave + come back; a stuck context + one tap; the music button while stuck; a network error; the OS pausing it;
  a bfcache restore; a dead voice), e2e-lobbysong (a joiner's stuck audio → one tap → the room's song at the room's place from its first moment),
  audio-resume.mjs (City 1.0).
- **What the owner should try on her iPhone** (`?city=2&debug=1`, music on): leave Safari for another app and come back; lock the screen for
  a minute and unlock; take a call (or ask Siri something) mid-song; play a podcast in another app, stop it, come back; go back / forward to
  the page. Each time: the music back by itself, or after ONE tap anywhere — and a tap on the music button must give music, never silence.

## M2 — WHEN THE BEAT IS HEARD (Oct 23 2026; City 2.0's party) — `audio/beat.js`
Two delays sit between a song's clock and the ear. (1) **Output** (the graph → the speaker): Chrome reports `outputLatency`; **Safari does not**
(only a tiny `baseLatency`), so on an iPhone the lights ran a little early — now the context's output timestamp (`getOutputTimestamp`: how far the
graph runs ahead of what is heard), else ~20 ms for an iPhone's speaker (`IOS_OUT`). (2) **The element's lead**: the mood song is an `<audio>`
element whose `currentTime` can run ahead of (or behind) the samples reaching the graph; nothing reports it, so **each phone measures it**: every
strong kick the kick listener hears on a song with a TRUSTED grid whose kicks land on it (`agree` ≥ 0.5) gives the element's clock minus that
beat, minus the listener's own lag (`KICK_LAG` 24 ms — measured offline on the party songs: 15–37 ms per song); the median of the last 32 (once
≥ 12 agree within 60 ms) is the lead, saved per device (`na:beatcal`), applied to the grid's position; the lobby's synced song (decoded buffers
on the audio clock) learns its own (`buf`, ≈ 0). Chrome here: lead 1–2 ms (the method checks out). The readout's `sync` line:
`sync out 59 ms · lead 2 ms (32 kicks)` (`(est)` when Safari gave nothing, `(stamp)` from the output timestamp).
**party3** (untrusted) re-checked with a full tempo + phase scan: its strongest "lock" (142.5 BPM) is a dense 16th-note artifact; the real
tempo is 106.9 with its kicks off the beat — it stays untrusted (the city follows the kicks it hears).

## M3 — THE MUSIC ON THE IPHONE, for real (Oct 23 2026; both cities) — `audio/engine.js`, `audio/music.js`, `audio/diag.js`
The owner's iPhone after M2: the music STILL didn't come back after leaving Safari, even when she tapped. WebKit can't run on this machine, so
this pass first EMULATED iOS's rule in the test (e2e-harbor `music` §7 — `play()` and `resume()` refused, a new AudioContext kept silent,
unless called inside `touchend` / `click` / `keydown` / a mouse's `pointerdown`), which reproduced her report exactly on the M2 code: the first
tap after a load never started the music, a stuck context + one tap ended "rebuilt, running, needs a tap" (silence), and a tap on the music
button toasted MUSIC ON in silence.
- **What was wrong:** (1) the engine did its work in **`pointerdown`** — the first event of a tap, and NOT a gesture for media on iOS (a
  touch's pointerdown = touchstart). The rebuild + the voices' activation + the song's `play()` ran there and were refused; the `touchend`
  that followed saw "nothing to rescue" (the song was waiting for the new context to report running) and did nothing, so the song started a
  moment later OUTSIDE any gesture and was refused again. (2) `apply()` only started a song once the context said `running` — never inside the
  tap that had just asked it to run. (3) A context that SAYS `running` while its clock has stopped (a WebKit bug after the background) counted
  as sounding: the music button switched the music OFF. (4) The music button, after the tap's own rescue, returned at once ("rescued") — a
  silent "MUSIC ON".
- **The fix:** the gestures are `touchend`, `click`, `keydown` (+ a mouse's `pointerdown`), document-level, capture phase, every tap, never
  removed; a touch's `pointerdown` only asks for a resume. Inside a gesture (`inGesture()`, ≤ 60 ms) a song may START even before the
  (fresh / resumed) context reports running (`canStart()`), so `play()` is always called synchronously in the tap. A tap REBUILDS the context
  at once when it is `closed`, stuck (a resume not honoured after 1.5 s), `interrupted` (≥ 0.4 s after coming back), FROZEN (says running,
  its clock still for 1.5 s — `watchClock`), or when a resume asked in an earlier TAP never ran. Voices whose activation iOS refused are
  activated again in the next tap (`armed`); a song element with no source left (`networkState` 3) or stuck still while "playing" is
  re-`load()`ed + played in the tap. Every tap whose music isn't sounding rescues it (no "already tried" flag); the music button rescues again
  inside its own click while it still isn't sounding, so it always ends in sound. `musicSounding()` now also needs the context's clock and
  the song's clock moving.
- **THE DIAGNOSTIC** (`&debug=1`, both cities, any screen — `audio/diag.js`, a panel top-left under the safe area, clear of the corner
  buttons; tap its title to fold it): `ctx` state + its clock ▲ moving / ■ stopped + rebuilds (why) + `navigator.audioSession` type/state;
  `el` the song element: playing / PAUSED, readyState, networkState, error code, its clock ▲ / ■, its gain, BROKEN / STILL; `src` the file,
  voices (armed), the probe's level; `want` what should play (music off / muted), sounding yes / NO, NEEDS TAP, DEAD VOICE, heals; then the
  LAST 8 EVENTS with times: visibility, pagehide / pageshow (persisted), blur / focus, each tap (+ the context's state then), every resume()
  (ok / ✗ + the error's name), every song play() (ok / ✗ NotAllowedError … · in tap), rebuilds, the clock frozen / moving again, stills,
  rescues. `engine.js#audioLog / audioEvents` keep the last 24; `music.js#musicDiag()` is the panel's data.
- **What the owner should do** (iPhone, Safari, `neonspeakeasy.com/?city=2&debug=1`, music ON): tap once so the music plays; leave Safari for
  another app (or lock the phone) for ~30 s; come back. If it isn't playing: tap once on the city (not a button). Still silent → take ONE
  screenshot of the AUDIO panel (it shows where it died); then tap the ♪ button and take a second one.
- **Tests:** e2e-harbor `music` §7 (the emulated iOS rule: the first tap, stuck + one tap, the music button, a frozen clock, the panel), the
  M2 scenarios unchanged; e2e-lobbysong; audio-resume.mjs (City 1.0).

## M3 — THE LEARNED LEAD, checked (Oct 23 2026; City 2.0's party) — `core/harbor-beat.js`, `audio/beat.js`
Her readout: `sync out 18 ms · lead −42 ms (22 kicks)` — no `(est)` / `(stamp)`, so Safari now reports its own `outputLatency`.
- **The sign is right** (the maths moved to `core/harbor-beat.js#kickErr / learnLead / heardPos`, with a test that runs a song with a known
  lead through it): a kick heard at element-clock x entered the graph a listener's delay earlier, so x − lag − the beat = the lead; heard =
  x − out − lead. −42 ms = the samples reaching Web Audio run 42 ms AHEAD of the element's `currentTime` (WebKit taps an element's audio
  before its player clock — plausible); with 18 ms of output the lights land 24 ms before the element's clock reaches each beat, i.e. when
  the beat is heard.
- **The right kicks:** strong hits only (≥ 0.6 of the recent peak, was 0.5) within ±min(80 ms, a fifth of a beat) of a beat — the old ±141 ms
  at 128 BPM let a 16th-note bass hit (117 ms off) teach the lead; the 150 Hz low-pass already keeps the hi-hats out. Consistency: the middle
  half within 50 ms (was 60).
- **Clamped** to −80 … +120 ms (was −100 … +250), the saved value too.
- **The detector on iOS:** its delay (`KICK_LAG` 24 ms, measured offline at 60 frames a second) now follows the frame rate (`kickLag`: +8 ms
  at 30 Hz — low-power mode; never less at 120 Hz); the 1024-sample window is 21 ms at the iPhone's 48 kHz vs 23 ms at 44.1 (≈ 1 ms).
- **When it's heard:** a heard kick (the punches between beats, a song with no trusted grid) was released an extra listener's delay late —
  now at detection − lag + the output. The readout: `sync out 18 ms · lead −42 ms (22 kicks) · lag 24 ms`.

## M4 — THE SESSION + THE DIRECT PATH (Oct 23 2026; both cities) — `audio/engine.js`, `audio/music.js`, `audio/diag.js`, `screens/harbor/remote.js`
The owner's iPhone after M3, this time with the AUDIO panel's evidence (two taps, 8 s apart, after leaving Safari and coming back):
`ctx running FROZEN · t 0.00 · rebuilds 5 → 6 (frozen clock) · session ambient/?` — `el … playing · t 45.2 → 53.6 · gain 0.00` — `probe 0.000`;
each tap: `rebuild #6 (frozen clock) · new voices · rescue (tap) · resume ok (new context) · ctx → running · play ok (start) · clock frozen at
0.00 s`. **What it says:** the song element really plays (iOS's own media pipeline advances it), but every NEW AudioContext — made inside a
real `touchend`, its `resume()` resolved — never renders a single quantum: its clock stays at 0.00, the probe (an analyser inside the graph)
hears digital silence, and the music gain is 0 only because its fade is a ramp scheduled on a clock that never moves (a symptom, not a cause).
The element's sound exists only inside that dead graph (a MediaElementSource captures it for the element's life). Six contexts, none started.
- **The hypotheses, against the code + the numbers** — (1) **THE AUDIO SESSION — the cause the evidence fits.** A context that is "started"
  (`AudioOutputUnitStart` returned success, so WebKit resolves `resume()` and reports `running`) but whose render callback is never called is
  exactly what Core Audio does while the app's AVAudioSession is not ACTIVE. The page set `navigator.audioSession.type = 'ambient'` on every
  context since Stage 2 (iOS 17+): the AMBIENT category is deactivated the moment the app leaves the foreground, gets no "resume" hint after
  another app's audio, and WebKit re-activates the session for a media element's playback — not for Web Audio alone (and the element here is
  routed through the graph, so its play counts for the element, not the graph). It fits every number: `resume ok` + `running` + `t 0.00` on
  a fresh context, the element advancing, the probe at 0, the first context of the visit fine (the session was fresh then). Not provable
  without WebKit on this machine, so it is fixed AND covered by (4). (2) **Too many contexts** — ruled out as the cause: WebKit refuses a
  context beyond its limit by THROWING on `new AudioContext` (the log shows `rebuild #6` made + `resume ok`); but it is real waste (a real-time
  thread + an output unit per live graph; her readout showed 5–6 % slow frames in this state), so: the old context is closed FIRST, the
  panel counts the ones alive (made − close() resolved), a failed `new AudioContext` is logged with its error name, and the rebuild loop is
  capped (below). (3) **Gain stuck at 0** — a symptom: the fade is `linearRampToValueAtTime` on the frozen clock. Now a ramp asked on a
  clock that is frozen or still at 0 (a fresh context) sets the value straight (`music.js#fade`, `engine.js#applyVolumes`). (4) **The media
  element is captured** — true, and the basis of the fallback below. (5) Nothing else fits `running` + `t 0.00` + the element advancing.
- **The session type** (`engine.js#setSession`): `'playback'` while the music is ON (the category every music app uses: it survives the
  background, is re-activated with the element, and **plays with the ring / silent switch on silent** — like YouTube in Safari — and stops
  other apps' music while ours plays), `'ambient'` only while the music is OFF or muted (effects only: mixes with other apps, respects the
  switch). Set BEFORE the context is made and re-asserted inside every tap, on the way back on screen, on the session's `statechange` and
  when the setting changes; the panel's `set` row says which, when and why.
- **THE DIRECT PATH** (`music.js`): one more `<audio>` element, never connected to Web Audio — iOS's own pipeline plays it — activated with
  the silent wav in the first gesture like the voices (so it may start later without a tap), re-armed in every tap if that failed. When the
  graph is dead (a `running` context whose clock is seen stopped: the old one after the background, or the rebuilt one that never started)
  the song moves onto it at its place — at once when it is armed (`onFrozen`), inside the tap otherwise. On it: no crossfades (a cut between
  songs), the slider / ducks only where an element's volume works (not iOS), mute + MUSIC OFF mute the element, the beat follows the song's
  grid (the kick listener hears nothing: `beatKick` reports `live: false` and `core/harbor-beat.js` falls back to the grid / calm). The
  music button on it works as usual (a frozen context is not "silence" when the song sounds). At the next tap with the graph seen running
  for 2 s (`engine.js#graphOk`) the song moves back onto a voice at its place (`backToGraph`: the fades, the kick listener again).
- **Frozen, faster; the loop capped** (`engine.js`): a context that never started (clock 0.00 after 0.7 s of `running`) is frozen at once
  (was 1.5 s); a tap looks at the clock itself (`running`, not past the watcher's sample of ≥ 300 ms ago, the page on screen ≥ 500 ms = frozen
  NOW — the owner's tap right after coming back did nothing before). A rebuilt context that freezes too is NOT rebuilt again for 20 s
  (`REBUILD_GAP`): the direct element plays meanwhile; after that one more try (with the session type re-asserted). So: one rebuild per
  return, not one per tap.
- **The panel** (`audio/diag.js`): `alive N (made M, closed K)`, `session type/state` (`n/a` when Safari has no `state`), a `set` row (the type
  asked for, when, why), an `out` row (`WEB AUDIO` / `DIRECT ELEMENT`, the direct element armed or not), `DIRECT` in the title, the events
  `session → playback (tap)`, `direct element (frozen clock) from 45.2 s`, `back to web audio (tap)`, `rebuild #n (why) · alive k`,
  `new context ✗ QuotaExceededError` if iOS ever refuses one. It repaints only when its text changed (a fixed layer over the canvas).
- **The preview panel's MUSIC row** (`screens/harbor/remote.js`): the owner's test session read "music MORNING" all day — her phone's own
  MUSIC MOOD setting was forcing it while the panel's AUTO chip was on. The row now says where the mood comes from (`PLAYING MORNING — THE
  MUSIC MOOD SETTING ON THIS PHONE` / `THIS PANEL` / `AUTO · THE CITY'S CLOCK`), and the panel's AUTO + CLEAR ALL also put that setting
  back to AUTO (a toast says so); AUTO then follows the city's (preview) clock (`audio/mood.js#fixedMoodFrom`).
- **Tests:** e2e-harbor `music` §8 THE EVIDENCE — on §7's gesture rule, every context made after "leaving" has a clock pinned at 0 (while
  `running`, `resume` ok) and `navigator.audioSession` exists: back + one tap → the direct element within ~2 s, the same song from its place,
  ONE rebuild (the new one seen frozen within a second), a second tap makes no third context, the old ones closed, the panel's rows, the
  music button OFF → 'ambient' / ON → 'playback', the clock moving again + a tap → back on a voice at its place; §7 reworked for the
  direct path + the rebuild cap; the M2 scenarios unchanged (76 checks); audio-resume.mjs (City 1.0); smoke.
- **What the owner should do** (iPhone, Safari, `neonspeakeasy.com/?city=2&debug=1`, music ON): tap once so the music plays; leave Safari for
  another app for ~30 s; come back; tap once on the city. Also: lock the phone for a minute; play a podcast in another app, stop it, come
  back. Each time the music should be back within a second or two of the tap (the panel's title says `DIRECT` if the graph was dead and the
  element took over; a later tap moves it back). Still silent → ONE screenshot of the expanded AUDIO panel (it now shows the session type
  set, the contexts alive, the output path, the direct element armed or not, and the last events).
- **Known issues:** the lobby's synced song (decoded buffers on the audio clock) has no direct path: with a dead graph it waits for the
  rebuild (with the session type fixed it should run; if her panel ever shows `DIRECT` in a lobby, that is the next piece). e2e-lobbysong's
  STUCK check ("from its first moment back … at the room's place": 9.5 s here vs 16.1 s on the host) fails the same way on the commit before
  this pass — not from this pass; to look at next. The direct element's volume is iOS's (the slider / ducks don't apply there).

## 7a — THE BEAT IN DIRECT MODE (Oct 23 2026; City 2.0's party) — `core/harbor-beat.js`, `audio/beat.js`, `audio/diag.js`
The owner's iPhone after M4: back from the home screen the music came back on THE DIRECT ELEMENT, but the city's lights "seemed not to
pulse any more".
- **What was wrong:** the beat clock DID get the song (`nowPlaying()` reads `current.voice.el` — the direct element — so `beatSource()`
  returned it with the element's `currentTime`, the grid and all). The kick listener was the problem: a graph whose clock has stopped keeps
  its AnalyserNode's LAST window for ever (the music playing when the phone left), so `beatKick()` saw a steady RMS > 0 = "live" with no
  kicks. The clock read that as a breakdown (a strong beat with no kick: the level × 0.8 a beat, floor 0.25) and the city calmed to about a
  quarter. Reproduced in e2e-harbor `music` §9 on the old code (the frozen graph's analyser repeating its last window, as WebKit's
  RealtimeAnalyser does with no render thread): no tap → level 0.28, `live true`, the punch's peak 0.85 → 0.42. After a tap the REBUILT
  context's analyser (silent from birth) is not live, so it partly came back — her "seemed" fits. Also: the direct path used the graph's
  output latency + the learned lead (the graph tap's offset) on the direct element's clock (≈ +24 ms late on her phone), and an untrusted
  song (party3's kind) fell to the calm 120 bpm whenever nothing was heard.
- **The fix:** `core/harbor-beat.js#beatMode(song, kick)` (PURE, tested) chooses what the beat follows; `advanceHarborBeat` sets `hb.src` from
  it and ignores the kick report while `song.direct` (a "live" report there is stale by definition). `audio/beat.js`: `beatSource()` marks
  `direct` (`music.js#musicOut() === 'direct'`, not in a lobby) and then takes the element's own clock **as heard: output 0, no lead**
  (`DIRECT_OUT` — iOS's media pipeline plays it; AVFoundation's clock follows the audio device and compensates its output latency, the way
  video stays in sync, Bluetooth included; if anything this errs toward the light a hair early, the side the eye forgives). `beatKick()`
  reports `{ hit: 0, live: false }` on the direct element or a frozen clock (`engine.js#clockFrozen`), and treats 8 frames of the
  identical RMS as a deaf listener (a real signal never repeats to 1e-7). An untrusted grid is passed as `loose` (its tempo + phase: the
  best guess there is) for the gentle tempo pulse.
- **The sources** (the `&debug=1` readout's beat line, `scene.js#beatLine`, `harbor().beatLine`; `__district.party().src`):
  | src | when | strength |
  | --- | --- | --- |
  | `grid` | a trusted grid through the graph | the kicks heard set it (0.25–1); nothing heard: 0.85 |
  | `direct-grid` | a trusted grid on the direct element | steady 0.85 (no listener) |
  | ~~`kicks`~~ | ~~no trusted grid, the listener hears the music~~ — gone in THE BEAT-SYNC PASS (never chase kicks) | ~~every real kick~~ |
  | `tempo` | no trusted grid (whatever the listener hears) | a gentle steady 0.6 at the song's tempo, on its loose grid's phase |
  | `calm` | no song (`— music off` / `muted` / `tap for sound` …) | a calm 120 bpm, 0.7 |
  e.g. `beat direct-grid 128.0 · bar 12 · 3/4 · pulse 0.87`; `· kick 0.86` only while the listener hears; `· kick unheard` only on `grid`
  (8a: `· pulse` = the punch the lights got, its peak over the last ½ s — 0 means they aren't pulsing; `×1.80` when PULSE STRENGTH
  isn't the default — see 8a below).
- **THE PULSE A STEP STRONGER** (the owner: "close", not obvious enough on her iPhone): the punch's peak light ~+30 %, most on the dominant
  pieces, no new draws (the same passes; a few more wheel bulbs cross their bloom threshold on the beat) — the buildings' tubes
  `1 − 0.2·amp + 0.9·pe` → `1.15·pe` (steady quarter 0.35 → 0.45), the crowns' flare `min(1.4, 1.3k)` → `min(1.9, 1.7k)`, the signs
  `0.9 + 0.55p` → `0.72p`, tier 0's whole neon `0.85 + 0.5p` → `0.65p`, the racing light `0.84 + 0.36p` → `0.48p` (head 0.22 → 0.3), the
  wheel `0.82 + 0.45p` → `0.6p` (hub 0.7 → 0.92, rim sets 0.45 → 0.6, hub ring 0.6 → 0.8), the sky beams `0.55 + 0.75p` → `0.5 + 1.0p`
  (width swing 0.2 → 0.3, the root flare 5p → 7p, its alpha 0.45p → 0.6p), the NEON logo's party glow `min(0.8, 0.78p)` → `min(0.95,
  1.02p)`, SPEAKEASY's rings 0.95p → 1.2p, its party word 1.15p → 1.45p.
- **MUSIC OFF, TRUTHFULLY** (SP4, Oct 26 — the owner's screenshot said "sounding · el playing" with the ♪ slashed): music off MUTES the element (it keeps playing, silent, so the next tap brings the song straight back) — `audioStatus` now answers `music off — silent (the element plays MUTED)` (or `paused`) BEFORE any "sounding", and the header says `el playing muted`.
- **THE AUDIO PANEL'S ONE STATUS** (`diag.js#audioStatus`; the owner saw the header say "sounding" over a row saying "sounding NO · locked
  (no tap yet)" — the header counted "nothing wanted yet" as fine): the header and the `want` row print the same verdict: `sounding` /
  `sounding DIRECT` / `silent (music off | muted | nothing to play)` / `LOCKED (no tap yet)` / `NEEDS TAP` / `DEAD VOICE` / `NOT SOUNDING`.
- **Tests:** `tests/harbor.test.mjs` "7a — THE BEAT IN DIRECT MODE" (the source chosen in every case; the stale-listener bug through the
  graph vs direct-grid at full strength, on the grid's bars and tempo; the gentle tempo pulse); e2e-harbor `music` §9 (a party night,
  §8's dead graph + the frozen analyser: before leaving `grid`; back with no tap and after a tap `direct-grid`, the punch swinging as
  before, the readout's line; an untrusted grid → `tempo` at the song's bpm, gentler; the panel's header + want row agreeing: LOCKED
  before a tap, sounding, sounding DIRECT).
- **What the owner should try** (iPhone, `?city=2&debug=1` on a party night — Fri / Sat after 9 pm, or the preview panel's party): music
  on, tap once; leave for the home screen ~30 s, come back WITHOUT tapping: the lights should keep punching; the readout's beat line says
  `beat direct-grid …` (or `tempo` on an untrusted song) and the AUDIO panel's header `sounding DIRECT`. Then tap once: still
  `direct-grid` until the graph runs again, then `grid · kick …` after a later tap.

## 8a — THE PULSE AFTER RETURNING (the lights side) + PULSE STRENGTH (Oct 23 2026; City 2.0) — `screens/harbor/scene.js`, `core/harbor-beat.js`, `audio/diag.js`
- **What the owner saw** (iPhone, after 7a): back from the home screen the AUDIO panel said Web Audio recovered (ctx running, clock ▲,
  out WEB AUDIO, sounding) and the readout's beat line `grid 100.0 · bar 30 · kick 0.66` — yet the lights didn't pulse. The beat clock
  was fine; the readout is drawn BY the city's frame loop, so a stopped loop freezes it — numbers and all — on its last frame, while
  the AUDIO panel (DOM, its own timer) stays live. That matches every number she read.
- **The cause (the lights side):** the loop had ONE way back — a `visibilitychange` to visible while it thought it was stopped. On iOS a
  return can come without that: the hidden event missed / coalesced (`start()` then saw `running` still true and did nothing) while WebKit
  dropped the rAF pending across the process suspension; a page restored with a `pageshow` only; the fail-stop after 30 failed frames
  (out of canvas memory in the background). Also a negative first `dt` (a rAF timestamp before `start()`'s clock) ran the dt-driven
  envelopes backwards (`PT.swell − dt/3800` jumped UP: the party's DOM lights held at full).
- **The fix:** a WATCHDOG (`scene.js#wakeLoop`): on visible, `pageshow`, `focus`, any tap and once a second, a visible page whose loop
  is stopped — or "running" with no frame for 1.5 s (`STALL_MS`, counted from the last real frame) — is restarted; a fail-stopped loop
  gets a fresh chance when the page comes back; `dt` never negative. `__district.loop()` / `scene.loop()`: `{ running, ago, drawn,
  restarts, stalls, why }`. The AUDIO panel's new `city` row: `city running · last frame 0.0 s ago · restarts 2 (last: visible)` —
  `STOPPED` / `STALLED` in red if it happens again (then the watchdog didn't help: tell Claude the row).
- **PULSE STRENGTH** (the owner: "crank it up higher" — no more guessing): ONE multiplier on the punch at its source (`scene.js#partyTick`:
  `PT.punch` + the ripple's history), so every beat-driven light follows it — the tubes, the crowns' flare, the signs, the wheel, the sky
  beams, the pier lamps, the string lights, the NEON logo's party glow, SPEAKEASY's rings + word. `core/harbor-beat.js#pulseGain`
  (the panel's percent or a multiplier, clamped 50–250 % in 5 % steps) and `pulseOut` (linear to 1.2, then a soft knee toward 2.0:
  the tubes' punch is one extra additive draw at most, so a bigger number holds the peak a little longer — never a white wash, never
  a full-screen flash; the troughs stay put). **The default: `PULSE_DEFAULT = 1.3`** (7a + 30 %) — the owner's pick locks in there (FP: her pick, **1.75** = 175 %).
  Live: THE PREVIEW PANEL → LIGHTS → PULSE STRENGTH (JUST ME live, EVERYONE via SEND; `core/harbor-remote.js` `pulse`, validated by
  `/api/admin` too), or `&pulse=180` on a link.
- **Tests:** `tests/harbor.test.mjs` "8a — PULSE STRENGTH" (parse, clamp, the knee, the remote's validation); e2e-harbor `music` §10 (a
  party night: the plain return; WebKit's dropped rAF with no hidden event — "running", no frame — restarted; no event at all — the
  watchdog; a `pageshow` only; the punch swinging after each; the AUDIO panel's city row; 50 % vs 250 % live) + `panel` (the slider).

## THE CITY SOUNDS (PART 8a, Oct 23 2026; City 2.0's title) — `core/city-sounds.js`, `audio/city-sound.js`, `screens/harbor/sounds.js`, `scripts/add-city-sfx.py`
ONE registry of every sound the city will ever make (the owner's CITY SOUNDS hunt list, docs/harbor/plan.md), each a named SLOT; the first
recordings imported into theirs; every event that exists today calls its slot; an EMPTY slot is simply silent.
- **The slots** (`core/city-sounds.js#SLOTS`, PURE): `{ id (kebab-case, stable), part, kind: 'loop' | 'once', gain (its mix level), what, by (what calls
  it today) }` — 134 slots (116 filled, Oct 29) (8b2: duck-quack + raccoon-chitter removed with their animals). A one-shot may hold several TAKES (one slot, one picked at random, weighted, never the same twice running — `pickTake`);
  the alternative (a slot per take) would make every caller pick, and a fourth car would mean code changes. FILLED = it has takes in the GENERATED
  `core/city-sounds-files.js` (no network probe); `checkSlots()` guards ids / parts / kinds / gains / the takes' shape.
  | part | slots (**filled**) |
  | --- | --- |
  | 7 · the speakeasy + the raid | club-murmur-calm, club-murmur-party, door-heavy, door-knock, cat-meow, tv-murmur, police-car-1920s, siren-1920s |
  | 8 · the promenade + the city schedule | **water-lapping**, **city-hum-day**, **city-hum-night**, traffic-far, **car-1920s-pass** (4 takes), bus-brake-hiss, bus-idle, bus-pull-away, ships-bell, steam-whistle, ship-horn, **gulls** (4 takes), dog-bark, market-murmur, milk-bottles, **truck-delivery**, trash-truck, flag-flap, boat-putter |
  | 9 · seasons + weather | birdsong-morning, crickets-night, wind-leaves, wind-winter, snow-hush, foghorn, rain-pavement, rain-water |
  | 9 · the construction tower | tower-siren, tower-horn, implosion-charges, implosion-rumble, hammering, crane |
  | 10 · party nights + fireworks | firework-launch, firework-burst, firework-burst-far, firework-crackle, crowd-cheer, party-yacht-music, helicopter-landing |
  | 6b + the sky | **helicopter** (2 takes), **airliner-far**, **prop-plane**, **jet-flyby**, **balloon-burner** (5 takes), **geese**, **drone-swarm**, **ufo-hum**, **ufo-beam**, **tr3b-drone**, tr3b-crackle, **tr3b-power-down**, witch-cackle, sleigh-bells (Oct 24 — THE SKY SOUNDS below) |
  | legendary | ghost-ship-creak, ghost-bell, monster-splash |
  Not on the hunt list, added for events that already exist: `door-knock` (tapping the door), `boat-putter` (the water taxi), `drone-swarm` (the drone
  show). Thunder (audio/weather/) and the neon (audio/sfx/) keep their own recordings.
- **What calls them today** (`screens/harbor/sounds.js`, ticked by the scene ~4× a second; `skyfx.js#listen` says what's up): THE BED — water-lapping
  always, the two hums crossfading (below); THE SKY — helicopter (a bed while it's up, panned with it, louder hovering), airliner-far (the loudest
  plane crossing: faded in / out at its ends, nearer = louder, panned), prop-plane (the banner plane, skywriting / skytyping), drone-swarm (the drone
  show), balloon-burner (a burn every ~6–18 s while balloons fly), geese (a honk every ~2.5–7 s while a V crosses); THE HARBOR — gulls (by day while
  gulls fly: a call every ~20–60 s, fewer with fewer gulls, none at night — `birds.debug().who.gulls`), boat-putter (the water taxi crossing), foghorn
  (real fog > 0.45: every ~40–80 s, from the lighthouse's side); `ambience.js#knock` → door-knock and `#fireworkBurst` → firework-burst once filled (the
  synthesized ones until then). Waiting for their events (Parts 7–11): the rest — e.g. ships-bell / steam-whistle / ship-horn are the CITY SCHEDULE's.
- **THE CARS — wired in 8a** (`screens/harbor/roadlight.js`: a pass on the implied road plays a take as it starts; the headlights peak at the take's `peak`
  — **superseded by FP3 below**: the pass's own take, placed on the clock). **The API:** `harbor().sounds.play('car-1920s-pass', { pan, gain })` (in scene.js: `snd.play(…)`; anywhere:
  `audio/city-sound.js#citySound`) → `{ take, peak, dur, stop(fade) }` or null. `peak` = seconds after the start when the car is NEAREST (the
  loudest 400 ms: 8.6–9.4 s) — start the sound `peak` s before the headlights sweep the middle; `pan` −1…1 follows the direction; `gain` × the slot's
  0.12. Takes: the two 1929 Volvo passes (weight 1 each), the 1945 Mercedes truck (0.35), the 1954 MG (0.15, rare).
- **The player** (`audio/city-sound.js`): `citySound(slot, { gain, pan, rate, delay, take })` (a one-shot, ±3 % pitch), `cityLoop(slot, { gain, pan,
  fadeIn })` → `{ set({ gain, pan }, ramp), stop(fade) }`, `cityPreview(slot)` (the panel). Everything → CITY_GAIN (1: the one knob) → a soft PEAK CAP
  (a WaveShaper, −10.5 dBFS ceiling) → the SFX bus (the Effects slider, Mute). **Silent, never an error:** an empty slot (null / a do-nothing handle),
  audio locked (no tap yet), Effects at 0 or Mute (a loop's voices stop; it comes back faded in), a missing file / a decode error (tried again
  later), a FROZEN graph (nothing scheduled), a REBUILT context (`onRebuild`: every loop restarts on the new one, faded in), a hidden page (the
  engine suspends the context: the loops pause with it). **LOOPS, seamless whatever the MP3's padding:** the file is the loop + a TAIL (the 2.5 s that
  followed it in the recording); every pass is a fresh voice started `loop` s after the last, the old voice's tail crossfaded into it (equal-power
  sin / cos curves) — scheduled ~2.5 s ahead on the context's own clock; the first pass starts at a random place, faded in over 2 s. **Memory:**
  the MP3s decode through an OfflineAudioContext at 32 kHz (the hums at 16 kHz: nothing above ~6 kHz in them — `r` in the registry), mono: the day
  bed (water + hum) is **12.6 MB** decoded (at the phone's 48 kHz it would be 26 MB); a hum not heard for 60 s is stopped and its buffer freed; the
  one-shots' buffers are kept LRU up to 10 MB. Nothing is fetched before the first tap, and only what plays.
- **The mix** (the files: loops −24 LUFS, one-shots −20; × the slot's gain; then the Effects slider — default 0.7 = −6.2 dB; the music at its default
  0.35 sits at ≈ −34 LUFS out): water 0.125 → **−42.5 LUFS into the bus / −48.7 out**; the day hum 0.11 → −43.6 / −49.8; the night hum 0.09 → −45.3 /
  −51.5 ("never silent, just calmer"); **the bed ≈ −46 LUFS out by day, −47 at night — ~12 dB under the music** (felt more than heard); a gull call
  (gain 0.55–1) −42 … −48 out at its loudest moment; a car at its nearest ≈ −38 out for a moment (≈ 4 dB under the music), −41 over 3 s. With the
  music OFF the same ambience plays (Part 12 builds the full soundscape) — it is all there is then, and it is what the owner will hear when she listens.
- **Day ↔ night:** on the city's ONE darkness (`core/harbor-dark.js#darkness` — the blue hour on the real sun, ALWAYS NIGHT = 1): `w = smoothstep(0.12,
  0.88, dark)`, day = cos(w·π/2), night = sin(w·π/2) (equal power: the bed never dips), each gain ramped over 2.5 s.
- **THE PREVIEW PANEL — SOUNDS** (`core/harbor-remote.js#CATS`, `screens/harbor/remote.js`, `css/harbor-remote.css` `.hr-snd*`): every slot by part —
  ▶ (on the filled ones), its id, LOOP / ONE-SHOT + what it is + what calls it, FILLED (`LOOP 60 S`, `4 TAKES`, `1.8 S`) or EMPTY; ▶ plays it on THIS
  phone only (a one-shot once, a loop ~8 s, at twice its city level so it's heard over the music); a SOUNDING NOW line (the beds + their gains, the MB
  decoded, the last one-shot).
- **Adding a sound (one folder + one command):** drop `<slot>.wav` into `~/Downloads/city-sfx/` (any of wav / flac / mp3 / m4a / ogg / aif; more takes
  of a one-shot: `<slot>-2.wav`, `<slot>-3.wav` …), and its credits in that folder's `credits.txt` (a block per file: its name at the start of a line,
  the details indented), then `~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/add-city-sfx.py` (`--dry-run` first; `--only a,b`). It reads the
  slot ids from `core/city-sounds.js`, decodes the original read-only (ffmpeg), cuts it (a row in its `CUTS` table for hand-picked cut points / weights /
  a shared slot / a decode rate; without one: a loop = the whole file less 1 s at each end, a one-shot = the whole file trimmed at −45 dB of its peak),
  mono 32 kHz, a 2nd-order LOW CUT (120 Hz default; + an optional presence lift at 2.5 kHz), levels it (BS.1770, the neon builder's meter; a soft
  limiter at −2 dBFS), a loop's start nudged ±5 s to where its head and tail match best (level + low/high balance), a one-shot's raised-cosine fades,
  MP3 64 kbps → `audio/city/`, registers the takes (`core/city-sounds-files.js`: file, `v` = its content hash for the `?v=` cache key, length, LUFS,
  loop + xf / peak, the source span, weight, decode rate) and the credits (`audio/city/sources.json` + `audio/city/CREDITS.md`; a block naming no CC0 /
  Sonniss / royalty-free licence is flagged). Re-importing a file replaces its takes. Then `node --test tests/city-sounds.test.mjs` and commit
  `audio/city/` + `js/core/city-sounds-files.js`. A NEW slot = one row in `SLOTS` (and, if an event should call it, a line in `screens/harbor/sounds.js`).
- **The first recordings** (the owner, Oct 23 — measured, not listened to: per-second band energies, spectrograms, spectral flux for onsets, narrow-band
  peaks for horns / bells / voices / sirens; all MD5s match `credits.txt`). All mono 32 kHz MP3, 64 kbps — **2.36 MB in all**:
  | slot | source → kept | length · size · loudness | what was cut, and why |
  | --- | --- | --- | --- |
  | water-lapping | water-lapping.wav (2:03, 96k/24) → **9.4–69.4 s** + a 2.5 s tail | loop 60 s · 489 KB · −24.4 LUFS (peak −2.4 dBFS) | the steadiest of all, no tonal events; 0–3 s fades in in the source; 60 s is plenty for water (memory); low cut 110 Hz; the seam head vs tail 0.0 dB |
  | city-hum-day | city-hum-day.wav (1:57, 48k/24) → **3.5–73.5 s** + tail | loop 70 s · 567 KB · −24.4 | a steady wash under 2 kHz + a faint steady 266 Hz drone (a distant engine — "city hum"); **no horns, sirens or voices found**; left out: a louder rumble at 65–82 s + 99–115 s and a bright click at 87 s; low cut 120 Hz; seam −1.1 dB; decodes at 16 kHz |
  | city-hum-night | city-hum-night.wav (4:17, 96k/24) → **98.8–168.8 s** + tail | loop 70 s · 567 KB · −24.4 | **CHURCH BELLS 4–42 s** (partials 1.5 / 2.0 / 2.4 / 2.9 / 3.4 kHz) **and one more strike at ~63 s** (the credits said "first ~12 s": they ring longer); low swells at 81–95 s + 207 s; faint whistle-like chirps at 193–203 s — all outside; very bass-heavy (−12 dB of mids vs the lows): low cut 140 Hz + a +3 dB lift at 2.5 kHz so it reads on a phone; seam +1.4 dB; 16 kHz |
  | car-1920s-pass ×2 | car-1920s-pass.wav (3:10, a 1929 Volvo PV4, two slow passes) → **13.0–31.5 s** and **127.0–146.5 s** | 18.5 s / 19.5 s · 145 / 153 KB · −20.4 | the two passes (digital silence 41–106 s between); its own engine note (a 590 Hz whine) is the car; nearest at 8.6 / 9.1 s; fades 0.6 s in, 1.8 s out |
  | car-1920s-pass (rare) | car-1920s-pass-2.wav (0:31, a 1954 MG TF) → **9.0–27.0 s** | 18 s · 141 KB · −20.5 | a quick, sporty pass, nearest at 9.4 s — newer than the era: kept as a RARE take (weight 0.15) rather than dropped (nothing modern in it: no horn, no voices) |
  | car-1920s-pass + truck-delivery | car-1920s-pass-3.wav (7:01 mono, a 1945 Mercedes L3750 truck) → **283.0–306.5 s** | 23.5 s · 184 KB · −20.4 | the clean distant drive-by (the file's other takes are starts, reverses, stops); slow + heavy: weight 0.35 among the cars, and the dawn DELIVERY TRUCK's take |
  | gulls ×4 | gulls.flac (0:52, the lossless Freesound original) → **0.15–1.95, 2.05–3.65, 3.7–5.2 (weight 0.6), 6.85–8.6 s** | 1.5–1.8 s · 13–15 KB each · −20.4 | single calls with clean harmonic arches at a ~1.1–1.3 kHz fundamental (gull "kyow"s), each with its natural tail; from 13 s on the whole colony chatters at once (no single calls); broadband clicks at 5.4 / 6.75 / 12.25 s left out; crow-like noisy caws not used; a city rumble under it: low cut 350 Hz; fades 0.08 s in, 0.6–0.7 s out |
- **Credits** (all CC0 or royalty-free; credits kept anyway — `audio/city/CREDITS.md` has every source's full block + MD5): water-lapping — TS Sound,
  "AMB_EXT_Fort_McAllister_Water_Lapping_Boat_Ramp" (Savannah, GA Ambiences), Sonniss GDC 2016 · city-hum-day — Federica Vairani, "24_Roosvelt
  Island_water_air_birds_distant traffic" (Water in Different Shapes), Sonniss GDC 2023 · city-hum-night — Sonocaine, "SON_Quad_City_Berlin_027 —
  Rooftop At Night…" (Quad City Berlin), Sonniss GDC 2017 · car-1920s-pass — Pole Position Production, "volvo_pv4_t2_ext_slow_by_twice" (Volvo PV4
  1929), Sonniss GDC 2018 · car-1920s-pass-2 — On The Fly Audio, "MG TF1500-Roadside-Pass By Fast 02", Sonniss GDC 2020 · car-1920s-pass-3 — Pole
  Position Production, "Mercedes_L3750_t1_Ext_…_Distant_MKH416" (Mercedes L3750 1945), Sonniss GDC 2020 · gulls — TRP, "Seagulls distant urban St John
  190529", Freesound 574388, **CC0 1.0** (the imported file IS that lossless FLAC, 48 kHz / 24-bit, not the Pixabay MP3 named in credits.txt). The
  Sonniss GDC Bundle licence: royalty-free, commercial use, no attribution required, the raw files not redistributed standalone (only these cut,
  filtered, re-encoded excerpts ship). Other credits: the neon (Freesound CC0) — THE RECORDED NEON above + `scripts/build-neon-sfx.py`.
- **Tests:** `tests/city-sounds.test.mjs` (the registry's checks, every hunt-list slot present, the filled ones + their takes, every file real / small /
  matching its `?v=` hash / levelled, loops = loop + tail, the night hum clear of the bells, weighted takes never repeating, an EMPTY slot silent + a
  locked one quiet, the importer's id regex = the registry); e2e-harbor `ONLY=sounds` (silent before the tap; by day the water + the DAY hum, the night
  one not loaded; 12.6 MB decoded; the car + gull one-shots; empty slots silent; THE SEAM's voices 1 → 2 → 1; Effects off / on; the panel's SOUNDS
  rows + ▶; at night the NIGHT hum; the neon tap at 0.28125 = 0.5 × 0.5625).

**POLISH 5 — two sounds SYNTHESIZED** (no Grok batch): `python -I scripts/build-synth-sfx.py` writes `hydrant-spray.wav` (a loop: the
stream's hiss 2.2–7 kHz with a slow uneven flutter over a dense rain of droplet grains 400 Hz–2.6 kHz + a soft wash) and `periscope-ping.wav`
(a 1.25 kHz sonar ping, a 3.6 s dark underwater echo + two discrete returns, band-passed 450 Hz–4.2 kHz for a phone) into
~/Downloads/city-sfx-synth/ with a CC0 credits.txt; then `add-city-sfx.py --src ~/Downloads/city-sfx-synth --only hydrant-spray,periscope-ping`
imports them like recordings. The spray follows the hydrant's spray level (`sounds.js#tick: hydrant`, panned to it); the ping plays DUCKED
(`sounds.periscope()`: the music to 50 % for 1.6 s, back over 3.2 s) when the periscope's legendary lands. The wake moment's sash
cues are gone with the window box (its blind's roll stays).

## THE WEATHER SOUNDS (PART 9a, Oct 25 2026; City 2.0) — `screens/harbor/sounds.js` (THE WEATHER), `scripts/add-city-sfx.py` CUTS
Ten of Grok's weather recordings (~/Downloads/city-sfx, credits.txt "Weather + party + holiday sounds"; all Pixabay / Mixkit / CC0) imported
into their slots — four NEW: `rain-drizzle`, `rain-awning`, `thunder-far` (2 takes), `gutter-drip`; filled: `rain-pavement`, `rain-water`,
`wind-leaves`, `foghorn` (3 blasts), `crickets-night`, `birdsong-morning`. Checked by MEASUREMENT (no ears here): each file's loudness
envelope (steady windows for the beds; wind-leaves' first 9 s carry a tonal hum — cut after it), its spectral centroid + a tonality share
(no words, no melody found); the thunder's two rolls + three separate foghorn blasts cut out. Grok's chain where the script has it: a low
cut, distance by low-pass (the water 5.2 kHz, the thunder 2.6–3.2, the foghorn 2.4), the phone's saturation on the low ones (`sat`); lean
encodes (22 kHz for the rain + the insects, 16 kHz for the low-passed ones, 40–48 kbps — 1.8 MB in all; the `audio/city` budget 11 → 13 MB).
The lossless originals stay out of the repo.
**The mix** (`sounds.js#tick` → `weather` from the scene's WXS): the rain's BEDS by intensity + by where you stand — `rain-drizzle` (light
rain), `rain-pavement` (the street round you, from moderate rain), `rain-awning` (close, panned LEFT: the speakeasy's awning), `rain-water`
(far, panned RIGHT: the harbor, heavy rain); `gutter-drip` after the rain (the drips' level, gone as it dries); `wind-leaves` on a windy day
(the gusts); `crickets-night` on warm summer nights (≥ 16 °C, Jun–Sep, no rain); `birdsong-morning` on spring / summer mornings (~5:15 →
9:45); `foghorn` in real fog (the existing 40–80 s gaps). THE THUNDER: `sounds.thunder(ev)` — the lightning's strike → `thunder-far` after
the time sound takes from its distance (3–16 s), never two rolls on top of each other. Everything under the music (the bed's duck); City
1.0's rain loop + recorded thunder are off in City 2.0. The AUDIO panel's `weather <state> · beds …` line names what sounds.

## 7b — THE SPEAKEASY'S SLOTS (Oct 24 2026; City 2.0) — `screens/harbor/windows.js`, `screens/harbor/sounds.js#speakeasy`
The speakeasy's life calls five Part 7 slots — all EMPTY today, so all silent; a recording dropped in starts sounding with its event
(8P: filled, + the moments' own cues, the barbershop, the broom — tv-murmur stays empty; see 8P below):
- `club-murmur-calm` / `club-murmur-party` — a BED while the bar is open at night (the party take on a party night), `tv-murmur` — a BED during
  the TV hours upstairs (~10 pm → 3 am). The speakeasy reports `{ club, tv, party }` each frame (`speak.beds()`); `sounds.js#speakeasy` keeps them
  with the city's other beds — ducked by `bedMix` under the music, held until the music sounds, panned left (−0.55 / −0.6: the speakeasy's corner).
- `door-heavy` — once when the hidden MIRROR DOOR swings open (a moment of loud jazz); `cat-meow` — once when the cat jumps up onto a sill, and on a
  tap on the cat. One-shots through the scene's `snd.play` (none under Reduced motion: no moments run).
- `door-knock` (tapping the side door) is unchanged; `police-car-1920s` / `siren-1920s` wait for the raid (8b).

## FP — THE BEAT FROM THE SONG'S POSITION (Oct 23 2026; City 2.0) — `core/harbor-beat.js`, `audio/beat.js`, `audio/music.js`, `screens/harbor/scene.js`
- **The owner's evidence** (after returning from the home screen, the lights on "random beats"): `c2-party7 · ctx t 71.77 · el t 70.4 → bar 43 ·
  3/4`, `c2-party4 · ctx t 38.27 · el t 37.0 → bar 20 · 4/4`. **What it showed:** the beat already followed the ELEMENT (`nowPlaying()` →
  `el.currentTime`); the readout's `bar` was `hbeat.bar` — the bars COUNTED since the scene started, ≈ the context's age, which is why it
  matched `ctx t`. On the real grids (party7 t0 0.197 · down 1; party4 t0 0.009 · down 2) party4's `4/4` is the element's beat (the context's
  would be `2/4`); party7's is `3/4` either way. The ~1.3 s between the two clocks is most likely how long the song took to start after the
  context was made. So the stated cause was a misread — but the off-beat lights still need explaining: this pass makes the clock sturdier and
  makes the readout say where it goes wrong.
- **THE SONG CLOCK** (`createSongClock`, `songClockStep`, PURE): an anchor (the element's time + the frame's time) run forward at the playback
  rate, each fresh `currentTime` reading compared with it — within 30 ms eased in; past 250 ms re-anchored at once; between, re-anchored when
  two readings in a row agree (iOS's coarse steps never jerk it). Every EVENT re-anchors at once: the element's play / playing / pause /
  seeking / seeked / waiting / stalled / ratechange, `visibilitychange`, `pageshow`, the engine's `onRebuild` + `onResume` (`audio/beat.js`
  wires them lazily on the element `nowPlaying()` returns — it now also returns `el` + `rate`). A `currentTime` that stops moving while the
  song plays runs on for 2 s at most, then holds, flagged `stuck` after 0.6 s. `dequantize` is gone (`songPos()`: one value per frame for
  every caller). The output latency + the learned lead still apply through Web Audio; the direct element keeps 0 + 0.
- **The lights jump onto it:** `advanceHarborBeat` snaps to the beat when the song clock re-anchors or the gap passes 30 ms (`DRIFT_SNAP`)
  instead of easing in over ~½ s; `hb.drift` (ms), `hb.songBar`, `hb.songIdx`.
- **THE HEARD OFFSET** (`kickErrWide`, `createHeard`, `heardStep`, `heardSkew`): the median of the last 24 strong kicks against the grid within
  ± half a beat, judged once there are 8. Steady and > 80 ms from the learned lead = `SKEW` — the sound through Web Audio is off the element's
  clock (the plausible WebKit cause after a return, beyond the lead's ±80…120 ms clamp). It is SHOWN, never applied to the lights' timing;
  while `SKEW` the kicks are ignored (consistently-off kicks would add off-beat punches AND make the strong beats look kick-less and calm the
  city — both read as "random beats"): the grid runs alone at its steady strength. Reset on a song change or a re-anchor.
- **The readout** (`scene.js#beatLine`, `beat.js#clockLine`): `beat grid 100.0 · bar 1 · 2/4 · drift −2 ms · pulse 1.20 · kick 0.62` (the SONG's
  bar + beat from its grid) and under `sync` a new `clock el +3 ms · anchors 6 (seeking)` (`STUCK` when the element's time stops), `· heard
  −45 ms` once 8 kicks are heard (`~` while not steady, ` SKEW` when the kicks are ignored). `beatDebug()` has `clock` + `heard`;
  `harbor().clock`.
- **What the owner should look at** (a party night, `&debug=1` — or the panel's TOOLS → READOUT; leave for the home screen, come back): `drift`
  within ~±30 ms; a big / jumping `clock el` or `STUCK` = iOS's `currentTime` misbehaving; `heard ±N ms SKEW` = the sound through Web Audio
  offset from the element — the next fix (applying that offset) would follow from that number.
- **Tests:** `harbor.test.mjs` "FP — THE SONG CLOCK" (250 ms iOS steps: < 20 ms off, never backwards; the element paused while the context runs;
  the context frozen / the page hidden 40 s while the element plays; a seek with no event; a stuck reading; a 30–250 ms drift needing two
  readings; an event re-anchor — each ending with the lights' beat index on the song's grid beat) + "FP — THE HEARD OFFSET"; e2e-harbor
  `music` §11 (playing 0.009 beats off; the element paused 2 s → 0.024; the context suspended 2 s → 0.029; a 17 s seek → 0.012; the readout
  + clock lines) and §9's line now with `drift`.

## FP2 — THE LEAD RE-MEASURED AFTER A RETURN (Oct 24 2026; City 2.0's party) — `core/harbor-beat.js`, `audio/beat.js`
- **The owner's readout** (back from the home screen, c2-party7 @ 140 BPM, grid trusted, WEB AUDIO): `drift −0 ms` but `anchors … (jump) ·
  heard +107 ms SKEW`, `lead −39 ms (29 kicks)`, `lag 24 ms`. The song clock was right (FP's fix holds); what she HEARD was off it by ~¼ beat.
- **What moved:** the kick listener taps the graph BEFORE the speaker, so `heard` measures the element → graph offset — the lead itself
  (the same formula: the kick's element time − the listener's lag − the beat). It went from −39 to +107 ms: iOS rebuilt the session's route /
  buffer on the return. The lead could never follow: the learning took only kicks within ±80 ms OF A BEAT (+107 is outside), so it kept −39
  and the lights ran ~146 ms early on the sound. (A change in the speaker's own latency, after the graph, can't be heard by the listener —
  only Safari's `outputLatency` tells; it is read live every frame, and now its jumps count as a route change.)
- **The fix — a RE-MEASURE** (`leadRefresh`, `leadKick`, PURE + tested): started on every context resume, rebuild, page return (`visible`,
  `pageshow`), output route change (`mediaDevices` `devicechange`, or the reported `outputLatency` jumping > 15 ms) — and on a SKEW seen on
  its own (`heardSkew` steady, whatever caused it). The strong kicks within ± half a beat are gathered; once 6 agree (their middle half
  within 50 ms) the lead moves to their median in smoothed steps (half the gap a kick, ≤ 60 ms a kick), bounded to the LIVE range −150 …
  +250 ms (a saved device value stays clamped to M3's −80 … +120). It ends when it has caught up (≤ 6 ms) or after 32 kicks (then: gave up,
  unchanged); a re-measure that finds the old lead right changes nothing. The ordinary learning then carries on, its ±80 ms window CENTRED on
  the current lead (it was centred on the beat). The output timestamp estimate starts over on each re-measure. While the kicks read as SKEW
  the grid runs alone (FP); as the lead catches up the SKEW clears and the kicks count again.
- **How fast** (the pure test, her song, ±6 ms jitter, every 5th hit a 16th-note bass hit): +100 ms → 10 kicks (≈ 2½ bars at 140 BPM, ~4 s;
  the lead −39 → +12 → +37 → +50 → +57 → +63); +146 ms (her case) → 10 kicks to +104; on the SKEW alone (no event) ~16 kicks.
- **The readout's `sync` line:** `lead −39 → +50 ms (re-measuring · 8 kicks · visible)` while it converges, then `lead +104 ms (re-measured −39 →
  +104 · 3 s ago)` for 20 s, then `lead +104 ms (12 kicks)`. `beatDebug().remeasure` + `.base` (Safari's `baseLatency`).
- **What the owner should look at:** leave + return on a party night: the `sync` line shows `re-measuring` then `re-measured −39 → +N`, and the
  `clock` line's `heard` lands near the new lead (no SKEW) within a few bars.
- **Tests:** `harbor.test.mjs` "FP2 — THE LEAD RE-MEASURED" (a +100 ms shift: stuck without the re-measure; on the event ≤ 16 kicks, no
  overshoot, settled, heard = the beat; on the SKEW alone; no shift = no change; scattered kicks give up; bounded).

## THE BEAT-SYNC PASS (Oct 24 2026; City 2.0's party) — `core/harbor-beat.js`, `audio/beat.js`, `screens/harbor/scene.js`, `core/harbor-show.js`
Three passes (FP, FP2, 7a) had patched the sync and the owner's iPhone still said no: "kind of all over the place — slightly off beat, then it
comes back into beat but at a SLOWER rhythm (half time?), kind of on beat, then it gets lost again"; "when it works it looks great". Her
readouts: before leaving (c2-party5, 106 BPM, grid trusted) `heard −34 ms`, `re-measure GAVE UP`, `anchors 5 (jump)`, drift −0; back from the home
screen (~30 s) `heard +237 ms SKEW`, `lead → −27 ms (re-measuring · 8 kicks)`, `anchors 8 (jump)`, drift +0, the tier 2→1→2 with 38 slow frames;
earlier on c2-party7 (140 BPM) `heard +107 ms SKEW`. This pass REASONED from those numbers and replaced the layers with one simple design.
- **The causes, ranked (the code as it was):**
  1. **Two sources mixed, flipping mid-song.** With a trusted grid the lights punched on the grid AND on every kick heard off the strong beats
     (`advanceHarborBeat`: `hb.kick = max(…, hit × 0.38)` — a punch of its own between beats), and a strong beat with no kick within ±0.22 beat
     calmed the city toward 0.25 (`missAt`). With the sound +237 ms off the element's clock (0.42 beat at 106 BPM) every kick was an off-beat
     punch and every strong beat looked kick-less: "all over the place" + fading. Once 8 kicks agreed, `heardSkew` flagged SKEW and the kicks
     were dropped: the grid alone, HALF-TIME (beats 1 + 3 only — NEON PASS 5's design) = "a slower rhythm". Then every song-clock re-anchor
     (`anchors 5 → 8 (jump)`: iOS's `currentTime` jumping > 250 ms mid-song) cleared `heard` (`beat.js`: `heardAnch !== sclock.anchors`), the
     SKEW flag dropped, the off-beat kicks counted again for 8 kicks… = "gets lost again". The cycle repeated on every jump.
  2. **The re-measure could not measure her case.** FP2 gathered kicks only within `±min(0.4 beat, 0.3 s)` of a beat (`leadKick`: `|wide| ≤ 0.4p`)
     — at 106 BPM that is ±226 ms, so a +237 ms offset was excluded from the very window meant to find it: 32 kicks seen, < 6 gathered,
     `re-measure GAVE UP`, the lead stuck at −34 → −27 (the few readings that fell inside were biased, so it crept). At 140 BPM (±171 ms) +107 was
     inside, which is why FP2's test passed and her 140 BPM song did re-converge.
  3. **Converging slowly by design:** 6 agreeing kicks before any move, then ≤ 60 ms a kick, and the ordinary learning's ±80 ms window
     could never follow a shift on its own.
  4. **Half / double tempo:** no lock as such — the `kicks` source (no trusted grid through the graph) punched on raw kicks with no tempo at
     all, and the half-time envelope read as "half tempo" whenever the 2 + 4 kick hits went. Her songs were trusted, so cause 1 explains it.
  5. **Is `heard +237` real?** Yes, as far as the lights are concerned: the listener taps the graph that the speaker plays, so a steady offset of
     the kicks from the element's clock IS the sound's offset at the ear (the speaker's own latency after the graph is Safari's `outputLatency`,
     read live). WebKit re-buffers the element's audio into the graph after the home screen; the amount varies (+107, +237) — so it has to be
     measured live and followed, not clamped to a device constant. It is measured modulo one beat (a +240 ms shift on a 128 BPM song reads
     −229: the lights land on the beat either way, a beat along).
  6. **The tier drop:** the frames right after a return (the audio session rebuilt, the song clock re-anchored, a resize from the toolbar, a
     step-down's own re-bake) were judged like steady frames: p75 > 19.5 ms → 2→1 → a probe → back to 2.
- **THE DESIGN — ONE SOURCE OF TRUTH** (`core/harbor-beat.js`, PURE, tested):
  - **The lights follow ONLY the song's grid**, positioned from the song's time (FP's song clock, unchanged: `drift 0` proved it right) minus
    ONE lead. `beatMode(song)` depends on the song alone: `grid` / `direct-grid` / `tempo` / `calm` — the `kicks` source is gone; a song never
    changes source mid-song, and its tempo is the grid's from the first locked frame (set, never eased; never touched by anything heard).
  - **EVERY BEAT punches** (`beatPunch`, `BEAT_WEIGHT = [1, 0.45, 0.72, 0.45]`): the downbeat hardest, beat 3 next, 2 + 4 lighter but there — the
    look she liked "when it worked" was the grid's strong beats + the kicks' little hits on 2 + 4; now it is deterministic. (`halfTime` stays
    exported for the old previews; `harbor-show.js` uses `beatPunch`.)
  - **The kicks only CALIBRATE the lead** (`createLead`, `leadKick`, `leadFast`, `leadAnchor`, `leadState`, `leadToSave`): one estimator, always
    running. Each strong kick on a trusted grid (`agree ≥ 0.5`) gives its distance from the nearest beat AS THE LIGHTS PLACE IT (wrapped ± half a
    beat round the current lead: no window can exclude the answer any more); the median of the last 24, once 6 agree (middle half within 60
    ms), is the residual. SETTLING (after every resume / rebuild / page return / route change — `leadFast`): the lead steps to the residual, half
    the gap a kick, ≤ 80 ms a kick → +240 ms is absorbed in ~5 agreeing kicks after the first 6 (the test: ≤ 16 kicks at 106 BPM ≈ 4 bars; the
    whole chain through a +237 ms return lands within 25 ms of the sound in < 4 bars). It ends LOCKED when the residual ≤ 6 ms, or quietly
    after 40 s (the lead as it was — never "gives up" into a wrong value). LOCKED: nudges ≤ 10 ms a kick; the last 6 kicks agreeing among
    themselves > 80 ms off (the sound moved with no event) start a settle on their own. Scattered kicks never move it. Bounded −250 … +350 ms
    live; the device saves only the steady-state value within −80 … +120. A song-clock re-anchor forgets the residuals, never the lead. The
    kicks never change the tempo, the beat index or the source.
  - **The default lead** with nothing learned: iOS −40 ms (`IOS_LEAD`, her phone's steady −34…−42), elsewhere 0; re-settled on every return.
  - **THE STRENGTH** comes from the music's LOUDNESS, not from when kicks land (`onsetEnergy`: the smoothed low-band level against its 45 s
    peak → `levelOf`: a breakdown 0.45, a drop 1). Nothing heard: the steady 0.85. The `tempo` pulse (no trusted grid: c2-party3 and the other
    untrusted songs) is steady at 0.6 on the loose grid's phase — never chasing kicks.
  - **RETURNING** (`scene.js`): the song clock re-anchors at once (FP), the lead re-settles (`leadFast('visible')`), and a return NEVER costs a
    tier — `returnGrace()`: the frame window is emptied and nothing steps for 3 s after `visible` / `pageshow` / a watchdog restart
    (`__district.tiering().returns`, `.holdMs`); a resize that changed nothing (iOS fires one on the way back) no longer re-bakes the city.
- **The readout** (`&debug=1`): `music PARTY · c2-party5 106.0 · grid trusted (lock 1.15)` (`music DAY (setting)` / `(panel)` when the mood is a
  CHOICE and not the clock's — then the party pulses to a non-party song by design; the mood and the party show read the SAME clock, the
  Harbor's, `&when=` included); `beat grid 106.0 · bar 12 · 3/4 · drift −0 ms · pulse 1.18 · level 0.86` (`level steady` when nothing is heard);
  `sync out 18 ms · lead −40 ms (default)` → `lead −34 ms (locked · 22 kicks)` → after a return `lead −34 → +180 ms (settling · visible · 8 kicks)` →
  `lead +237 ms (settled −34 → +237 · 4 s ago)` (`kept` when a settle timed out without agreement); `clock el +3 ms · anchors 8 (jump) · heard +12 ms`
  — `heard` is now the RESIDUAL (how far the kicks sit from where the lights land: in sync ≈ 0; `~` while the last kicks don't agree).
  `beatDebug().cal` / `.res` / `.energy`.
- **Tests:** `harbor.test.mjs` "THE BEAT-SYNC PASS" ×5 (every beat; the strength from loudness, kicks half a beat off = the same punches as kicks on
  the beat = no kicks; ONE SOURCE through six listener reports incl. half-tempo kicks — the source, the tempo and the beat index never move; the
  lead: +100 / +146 ms at 140 and +240 / +271 ms at 106 BPM absorbed in ≤ 14 / 16 kicks with no overshoot, a shift with no event in ≤ 16, no shift
  = locked unchanged, scattered kicks time out quietly; THE WHOLE CHAIN: song clock + lead + beat clock through a +237 ms return → within 25 ms
  of the sound in < 4 bars) + the lead's basics (M3's, rewritten); e2e-harbor `music` §10 "RETURN never costs a tier". The CI's timing checks
  are warnings there (`okT`; docs/testing.md).
- **What the owner should look at** (iPhone, a party night or the panel's party, `&debug=1`): tap so the music plays; ~20 s: `beat grid … · drift
  ±0–30 ms`, `heard` within ~±30 ms, `lead … (locked)`; home screen ~30 s, back WITHOUT tapping; ~20 s: the lights keep the same every-beat
  rhythm (never a slower one), `lead −34 → +N ms (settling · visible …)` then `(settled …)` within a few bars, `heard` back near 0, the tier line
  unchanged (`t2`, no `2→1`). Then skip to another song (the panel's MUSIC row): the same. If `heard` stays large with `lead … (locked)` for more
  than ~8 bars, send the three lines — that is the one case this design doesn't cover (kicks that agree among themselves yet never settle).

## FP — THE SOUNDS (Oct 23 2026; the owner listened on her iPhone) — `core/city-sounds.js`, `audio/city-sound.js`, `screens/harbor/sounds.js`
The owner: the water FAR too loud ("like you're right next to a lake", noticeable over the music); the gulls good but patterned; the cars fine.
- **THE WATER** — a harbor quay heard from the promenade, not a beach: its gain 0.125 → **0.07** and a new per-slot low-pass (`lp`, loops only,
  200–16000 Hz, checked by `checkSlots`): **`lp: 1600`** — the filter sits between the loop's gain and its panner (`city-sound.js#pumpOne`,
  freed on drop / stop, `debug().lp`). The low-pass alone takes 4.8 LU off (−24.1 → −28.9 LUFS, ffmpeg ebur128): ≈ **−9.8 dB** in all. The
  CITY HUM now leads the bed.
- **THE BED UNDER THE MUSIC** (`bedMix({ musicOn, sounding, sinceMs, started })`, PURE): with the music on (not off, not muted, slider > 0.01)
  the whole bed (water + both hums) × **`BED_DUCK` 0.71 (−3 dB)**; it never starts louder than the music — before it has ever started it waits
  for the song to really sound (`musicSounding()`, at most `BED_WAIT_MS` 6 s), then fades in over `BED_FADE_IN` 5 s; the music on ↔ off eases
  it over `BED_RAMP` 3 s. The bed starts only after audio unlocks; the panel's SOUNDING line shows `k` + `hold`.
  | (the music at its default ≈ −34 LUFS out; "out" = after the Effects slider's −6.2 dB) | music OFF: into the bus / out | music ON: into / out | 8a |
  | --- | --- | --- | --- |
  | water (0.07 + the 1.6 kHz low-pass) | −52.0 / −58.2 | −55.0 / −61.2 | −42.5 / −48.7 |
  | the day hum (0.11) | −43.3 / −49.5 | −46.3 / −52.5 | the same |
  | the night hum (0.09) | −45.2 / −51.4 | −48.2 / −54.4 | the same |
  | the whole bed by day | ≈ −49.0 out | ≈ −52.0 out (**~18 dB under the music**) | ≈ −46 out |
  | the whole bed at night | ≈ −50.6 out | ≈ −53.6 out | ≈ −47 out |
  | a car at its nearest (0.12 → 0.1, −1.6 dB) | ≈ −39.6 out (−42.6 over 3 s) | the same (not ducked) — ~5.6 dB under the music | ≈ −38 out |
- **THE GULLS** (`gullCalls(rnd, pan)`, `gullGap(g, rnd, calls)`): a moment is ONE call 66 % of the time, two 24 %, three 10 % — each call its own
  take (never the same twice running), level 0.5–1, pitch 0.95–1.05, pan; the gaps inside a run 0.35–~2 s, uneven; between moments 14–66 s
  (leaning short, longer with fewer gulls, + 8 s after a run of three) — never a pattern.
- **Tests:** `city-sounds.test.mjs` (the bed's levels + duck / hold, the gulls' pattern, the debug switches); e2e-harbor `sounds` (the water
  through its 1.6 kHz low-pass under the day hum, the bed × 0.71 with the music on, × 1 with it off).
- **Known issues:** only the bed ducks (the sky loops — helicopter, airliner — and the one-shots don't); levels by LUFS arithmetic, not by ear
  (the owner's ear decides); the wait-for-the-music hold is unit-tested only (in headless Chrome the music sounds at once). (Oct 24: the sky now
  ducks with the bed — THE SKY SOUNDS below.)

## FP3 — THE CAR AND ITS SOUND IN SYNC (Oct 24 2026; the owner's iPhone) — `core/city-sounds.js`, `audio/city-sound.js`, `screens/harbor/roadlight.js`, `core/harbor-promenade.js#carAt`
The owner: a car crossed the street under the resting dock and its sound came **~5–6 s after it had passed**.
- **The cause** (measured, not the recordings): the car is drawn on the CITY'S CLOCK — nearest at the pass's centre, t0 + 9 s (`ROAD_PASS.peak`);
  its sound was started by `citySound` **whenever its file had been fetched + decoded** (`load()` → `e.p.then(start now)`), and the centre was
  taken as t0 + the take's peak — so every second of that wait put the sound's loudest moment a second behind the car. The wait was real on a
  phone: nothing was fetched ahead; `pickTake` never repeats a take, so most passes asked for a file not yet decoded (the one-shots' buffers are
  LRU, 10 MB, and each car take is ~2.3 MB decoded); `/audio` passes the service worker (a network fetch the first time, a week's HTTP cache
  after) + iOS's decode — and a playback-rate jitter (±3 %) shifted the peak ±0.3 s on top. **The recordings' peaks were right** (re-measured
  as the loudest 0.3 s of the RMS envelope: 8.65 / 9.35 / 9.45 / 9.35 s vs the stored 8.6 / 9.12 / 9.36 / 9.22 — within 0.25 s).
- **The fix — the sound placed ON THE CLOCK:** `citySound(slot, { take, sync: { peakIn, pre, fade, late } })` asks `peakIn()` (s from now to the
  car's centre) **when its buffer is ready** and places the take with `syncStart` (PURE): its PEAK lands on the centre — the start delayed when
  early; joined part-way (an offset into the take, a 0.8 s fade-in) when late; **silent when the centre is under 1 s away** (never out of sync).
  A synced sound plays at exactly rate 1 (no jitter). The NEXT pass's take is fetched + decoded ~12 s ahead (`cityPrefetch`), so normally there
  is no wait at all. Measured in Chrome with an artificial 2.5 s delay on every car file: the sound's peak −0.13 … +0.01 s from the car's
  mid-crossing (it was 2.5 s + the decode behind before).
- **The pass's own take** (`takeAt(slot, pass.take)`: weighted like `pickTake`, but a pure function of the clock's pass — the same take, the
  same car, the same timing on every phone). **The car's speed from its take** (`crossFor(take)` → `carSpeed(cam, z, cross)`): it crosses the
  visible street (entering → leaving) in the take's SWELL — where its RMS envelope stays within 15 dB of the peak (`sw`, measured by the
  importer), clamped to 2.6–7 s: the Volvo passes 4.25 / 3.95 s, the MG (a quick sporty pass, 1.5 s of swell) 2.6 s, the truck (a broad
  swell) 7 s. Mid-crossing = the centre = the take's peak. **The sound starts just before the car enters:** `carPre(cross)` = cross / 2 +
  `CAR_LEAD` 1.5 s of the take before its peak (the far approach before that is skipped, faded in over 0.8 s).
- **The pan follows the car** (`panOf(x, half)` = 0.6 · tanh(x / half), x the car's world x, half the visible street's half-width at its lane):
  smooth, ±0.6 at most (~0.46 at the screen's edge), left → right for a car driving right; updated ~8× a second with a 0.15 s ramp
  (`handle.set({ pan })`; a StereoPannerNode, or an equal-power PannerNode where there's none). It pans on after the next pass begins (the
  sound keeps its own pass's timing).
- **Kept:** while the dock covers the street the sound alone plays (a car passing behind); the headlight sweeps / the day shadow (the implied
  light) use the same centre + speed (`xAt` in roadlight.js), so light, car and sound agree. `&force=road-pass` passes (every 13 s, the centre
  3 s into the slot) now sound too — joined part-way (they never did: the old rule only played a pass caught in its first 1.5 s).
- **Debug:** `harbor().road.pass` `{ id, dir, center, take, cross }`, `.sound` `{ take, started, late }`; the player's `cityLog` rows carry
  `off` (s into the take) + `wait` (s until it starts), or `late: true`.
- **Tests:** `tests/harbor-sounds.test.mjs` — the takes' measured peaks + swells; `takeAt` deterministic + weighted; `syncStart` (early / on time /
  late / too late / `pre`) and, for every take and every wait 0–12 s, the peak lands on the centre or the sound is silent (the old way: late
  by the wait); the car on screen exactly `cross` s, mid-crossing at the centre, the sound starting 1.5 s before it enters (four screens); the
  empty-slot speed unchanged; the pan smooth, ±0.6, left → right.

## THE SKY SOUNDS (Oct 24 2026; 6b's sky + today's events) — `scripts/add-city-sfx.py`, `core/city-sounds.js`, `screens/harbor/sounds.js`
The owner's sky folder (`~/Downloads/city-sfx`, the "SKY SOUNDS" block of its `credits.txt`: every file CC0 or Sonniss GDC; four are the Pixabay
MP3 copies of CC0 Freesound originals — noted in the credits; drop the lossless originals in under the same names and re-run to upgrade). Her
notes were picked by measurement, not by ear: **every trim was CONFIRMED by analysis** — per-second band energies (< 80 Hz, 80–300, 300 Hz–3 kHz,
3–8 kHz), the 0.3 s RMS envelope, spectrograms (0–4 kHz for voices / PA / crowd: formant movement, syllabic 3–8 Hz bursts; 0–12 kHz for the
turbine), narrow-band peaks for drones. MD5s match `credits.txt`. **+3.19 MB** (16 files; `audio/city/` 5.54 MB in all), the same encode (mono
32 kHz MP3 64 kbps); the low / distant ones decode at 16 kHz (`r`: half the memory).
- **The importer's RECIPE** (a `CUTS` row's extras): `lp` (a low-pass: distance), `notch` [Hz] (a modern drone's lines), `lowmid` (+dB at 300 Hz),
  `layers` [(offset s, rate, gain)] (a loop built from detuned, offset copies), `blackout` (s: the mains hum cut + a thump → `hit`); `ALIAS` maps
  a source named after what it is to its slot. A one-shot's `peak` is now the RMS envelope's (0.3 s) and it carries its swell `sw`.
  | slot | source → kept | length · size | processing | what was cut, and why |
  | --- | --- | --- | --- | --- |
  | helicopter (take 1) | heli-flyby.mp3 (0:44) → **1.0–44.0 s** | 43 s · 337 KB | low cut 100 Hz, fades 2 / 2 s | ~all of its energy is wind rumble under 80 Hz: the chop (100 Hz–1.5 kHz) is the sound; no voices |
  | helicopter (take 2) | heli-flyby-2.wav (0:36) → **whole** | 35.6 s · 279 KB | 90 Hz, fades 2.5 / 3 s | a clean closer swell (8–18 s), a ground-reflection comb; nothing else |
  | airliner-far | airliner-high.wav (1:11) → **4.5–46.0 s** | 41.5 s · 325 KB | 90 Hz, fades 3.5 / 4 s | its swell 5–35 s (peak 26 s); from ~36 s leaves + wind (3–8 kHz) take over — cut after 46 s |
  | prop-plane | prop-plane.mp3 (0:41, "a vintage plane at an airshow") → **1.0–40.0 s** | 39 s · 305 KB | 90 Hz, fades 2 / 3 s | two swells (4–12 s, 19–35 s), engine harmonics only: **no PA, crowd or voices found** (no formants, no syllabic bursts) — nothing to cut |
  | jet-flyby | jets-formation.wav (0:40, F-16s right → left) → **11.0–34.0 s** | 23 s · 180 KB | 90 Hz, fades 1.5 / 4 s | a lone jet at 4–9 s left out; THE FORMATION 12–23 s + its roar fading to 34 s; silence after |
  | balloon-burner ×5 | balloon-burner.mp3 (0:49, LOUD, clipped) → **0–5.6, 5.85–10.9, 11.3–14.6, 15.75–21.5, 22.45–32.0 s** | 3.3–9.6 s · 26–75 KB | 100 Hz + **low-pass 2.2 kHz** (far off), fades 0.1–0.15 / 0.7–1 s | the bursts found on the envelope (> −24 dB): the notes' "6–14 s" is two bursts (a 1.1 s gap) — two takes; "22–37 s" — the long 22.7–31.5 s burn, the little gusts after it left out; the rare long ones weighted down |
  | geese | geese.mp3 (1:38, Brent geese) → **12.0–34.0 s** | 22 s · 173 KB | 100 Hz + **notches 285.3 / 297.5 / 387 Hz** | **a MODERN engine drone** under the whole recording (lines +13–21 dB over the floor, loudest 9–20 s) — notched out (gone after: no line above the noise); the far chatter + the flock overhead (22–33 s); the notes' 5–12 s left out so the flyover lines up with a V's ~30 s crossing |
  | drone-swarm (loop) | drone-swarm.wav (1:10, ONE quadcopter, a coil mic) → **3–40 s ×5 layers** + a 3 s tail | 40 s · 337 KB | 110 Hz + **low-pass 1.4 kHz**; five copies offset 0 / 5.5 / 11 / 16.5 / 22 s, rates 1 / 0.968 / 1.034 / 0.955 / 1.021, gains 1–0.5 | a 50 Hz mains line (+37 dB: the coil mic) under the low cut; the whine (400 Hz–1 kHz) kept, nothing above 2.5 kHz (−93 dB): **a soft hum, never a mosquito**; seam −0.3 dB |
  | ufo-hum (loop) | ufo-hum.wav (2:39) → **41.0–71.0 s** + tail | 30 s · 259 KB | 80 Hz + low-pass 2.5 kHz | the best seam inside the notes' 20–80 s (scanned; longer windows never closed on themselves: the pad evolves); seam +0.0 dB. **Its key:** partials at 41.5 Hz (≈ E1), 70.8 Hz (between C♯2 and D2), 729 / 791 / 883 Hz — no one key: kept low + soft-topped; **6b should duck + low-pass it under the music** (the loop slot's `lp` exists) |
  | ufo-beam | ufo-beam.wav (0:18, a riser) → **3.0–17.0 s** | 14 s · 110 KB | 90 Hz, fades 0.4 / 1.5 s | the rise to its peak (6.65 s in) + the reverb tail; decodes at 32 kHz (its sheen) |
  | tr3b-drone (loop) | tr3b-drone.wav (3:00, 104 MB — **never copied**) → **68.0–108.0 s** + tail | 40 s · 337 KB | **no low cut** (a 25 Hz subsonic only) + **+3 dB at 300 Hz** | flat 20–400 Hz: the low-mids kept (a phone's speaker still hears it); seam searched ±10 s → +0.2 dB |
  | tr3b-power-down | tr3b-powerdown.wav (2:46, a Black Hawk's turbine) → **131.5–162.0 s** | 30.5 s · 239 KB | 25 Hz + **low-pass 6 kHz** + **THE BLACKOUT** | **the notes' 0:12–0:32 is only the rotor wash thinning — no wind-down**; the TURBINE CUTS at 134.75 s (a clunk, then its whine gliding ~10 → 1 kHz for 30 s): that's the power-down. Built on it: the city's 60 Hz mains hum (+ harmonics) under the roar until the clunk, cut dead (8 ms) with a LOW THUMP (55 → 38 Hz + harmonics to ~170 Hz, 0.35 s) — `hit: 3.25` s into the take (= its peak) |
- **Loops checked by analysis:** the runtime crossfade simulated (body → the equal-power seam → the next pass): the level jump across every seam
  within the body's own variation (drone-swarm 0.8 / ufo-hum 1.8 / tr3b-drone 0.6 dB vs the body's max 0.9 / 1.8 / 0.8), the low/high balance
  steady.
- **The mix — LOUDER (SP2, Oct 24 — the owner: "clearly heard over the music", still distant; was "well under the bed")** (each file's LUFS ×
  its slot gain; the day hum −43.6): +6 dB — helicopter 0.074 → −43 · jet-flyby 0.07 → −43.5 · balloon-burner 0.07 → −43.5 (+ its low-pass);
  +3.5 dB — airliner-far 0.036 → **−49.3** · prop-plane 0.05 → −46.5 · geese 0.075 → −43.3 · drone-swarm 0.045 → −51.4. Peaks stay capped by the
  player (`audio/city-sound.js#CAP`, −10.5 dBFS into the SFX bus); the takes keep their low-pass (distant). (Before SP2: 0.037 / 0.035 / 0.035 ·
  0.024 / 0.033 / 0.05 / 0.03.) **The sky now ducks with the bed** under the music (× bedMix's `k` 0.71). The flybys' peaks run ~5–6 dB over their integrated level: an
  airliner at its nearest still under the hum.
- **The wiring** (`screens/harbor/sounds.js`; `run(slot, gain, pan)` = the FLYBYS: a slot's takes chained while their thing is up — each take its
  own swell, the next one (never the same twice running) starting when the playing one has 2.5 s left (`chainDue`), level + pan ramped with the
  thing, faded out when it's gone): **helicopter** (`air.debug().heli`: hover 1 / flying 0.75, panned with its x) · **airliner-far** (the loudest
  plane crossing: `sin(πk)` × its size, from the START of its crossing — the take's swell peaks ~22 s in, mid-crossing on a phone — panned) ·
  **prop-plane** (`banner.on()` / `smoke.on()`) · **geese** (`birds.debug().geese` + the new `geeseX`: ONE flyover a V — it was a honk every
  2.5–7 s — panned with the V, faded as it leaves) · **drone-swarm** (a bed while `drones.on()`) · **balloon-burner** (a burn every 6–18 s while
  `balloons.on()`). jet-flyby / ufo-hum / ufo-beam / tr3b-drone / tr3b-power-down are filled for 6b (no event yet). Debug: `harbor().sounds.runs`.
- **Tests:** `tests/harbor-sounds.test.mjs` — every file in its slot; the kinds; the cuts (the airliner before the leaves, the formation not the lone
  jet, the geese, the blackout's `hit` on the turbine's clunk = its peak); the loops' windows; the 16 kHz decodes; the flybys ≤ 45 s; the levels
  under the bed; `chainDue`. `city-sounds.test.mjs` — the filled slots, every file real / matching its hash / levelled, the folder < 6 MB.
- **Known issues:** levels by LUFS arithmetic, not by ear; the burner / geese / heli-flyby / prop-plane are the lossy Pixabay copies (the lossless
  CC0 originals: credits.txt's Freesound links); the airliner's take starts with its crossing, so a crossing longer than ~40 s (a wide desktop)
  chains a second take.

## 8P — THE SPEAKEASY + PEOPLE SOUNDS, THE JETS' DUCK (Oct 24 2026; City 2.0) — `scripts/add-city-sfx.py`, `core/city-sounds.js`, `audio/city-sound.js`, `screens/harbor/sounds.js`
Grok's speakeasy + people folder (`~/Downloads/city-sfx`, credits.txt "Speakeasy + people sounds": Sonniss GDC, Mixkit, Pixabay — the
Pixabay ones mostly copies of CC0 Freesound originals, noted in CREDITS.md; every MD5 matches; no newer copies in the folder) and the
owner's "sky sounds louder again". Grok measured, didn't listen; **every trim here was confirmed by analysis**: the 0.05–0.5 s RMS
envelope + onsets, band energies, **speech** = the 2–8 Hz modulation of the 300–3400 Hz envelope (one clear talker ≈ 0.5–1.1, a crowd's
babble ≈ 0.1–0.3), **music** = tonal lines held ≥ 0.45 s within ±1.5 % (a note holds its pitch; a voice glides). **83 slots, 42 filled;
`audio/city/` 7.19 MB (+1.65 MB: 43 new files, the low-passed beds at 40 kbps; the aircraft re-encoded at the same size).**
**Who calls them (8P — `screens/harbor/people.js`):** `snd.step` on the nearest walker's footfalls (its stride's step count changing; heels for
a woman, cobbles otherwise; gain by nearness), `snd.laugh` from a pair chatting (≤ one a 6 s, by chance), `snd.cart({ on })` while the vendor's
there, `snd.line(level)` while the lobby line stands, `snd.rooftop(level)` while ≥ 3 guests are up on the roof, `snd.bus(…)` driven by the bus's
own timetable (arrive with `stopIn` = the seconds to its stop → idle → the door open / shut → depart, the pan following it, gone).
- **The importer's new recipe keys:** `presence` (dB, Hz: a broad Q 0.7 lift), `gainenv` [(t0, t1, dB)] (a creak softened, a slam taken
  down), `gate` (a soft 1:2 expander under the loudest 10 ms − n dB: the hiss between quiet snips / steps), `seq` (a take ASSEMBLED from
  pieces, other files of the folder included — credited too), `mark` (s into the take → `hit`: where its event lands), `to` (one source,
  several slots), `name`, `kbps`; `SKIP` = the folder's files never imported (below). The licence check now knows Mixkit + Pixabay.
- **The player:** `citySound(slot, { sync: { peakIn, mark: 'hit' | 'start' } })` — the take's `hit` (or its start) lands on the clock
  instead of its peak (the moments' cues, the bus's stop); the handle carries `hit` + its take `t`.

| slot | source → kept | processing | what the analysis found |
| --- | --- | --- | --- |
| club-murmur-calm / -party (loops) | club-murmur.wav (2:57, a party of 50 indoors) → **85.9 + 40 s** / **24.1 + 40 s** | low cut 90, a 120 Hz notch (mains), +3 dB at 300 Hz, **low-pass 1 kHz / 1.4 kHz** (THROUGH A WALL), 40 kbps, 16 kHz | babble throughout (0.10–0.25), no note held but the mains hum; 0–72 s the livelier half (the party), 75–165 s the calmer; seams +0.3 / −0.4 dB; after the wall: modulation 0.17, nothing above 2 kHz |
| door-heavy | mirror-door.wav (8.4 s Sonniss) → **0.15–2.25 s** | 90 Hz, low-pass 7 kHz | the latch at 0.2 s, a short creak 0.75–1.4 s (Grok's 0.2–1.5 + the after-creak to 2.1) |
| door-heavy-close | the same → **2.85–6.3 s**, `hit` 1.8 s | 90 Hz, low-pass 6 kHz, **the creak −6 dB** | the "spooky" part is the close's long creak (19–24 tonal peaks a frame at 3.8–4.2 s): softened under the thud (4.65 s in the source); the Mixkit + PMSFX "haunted" files not used |
| bar-open | bar-ambience-close.mp3 (4:24) → **62–70 s** (a one-shot, ~7 s) | 120 Hz + notch, low-pass 3 kHz, fades 1 / 1.8 s | the bar through the open mirror door: babble (0.19–0.24), no note; clear talkers elsewhere in the file (0.59 at 32 s, 0.72 at 136 s, 0.62 at 192 s) avoided |
| line-murmur (loop) | the same → **163.5 + 24 s** | low-pass **1.3 kHz**, 40 kbps, gain 0.05 | THE LINE (no street-crowd file): the file's quietest babble (0.18–0.31), ending before the clear talker at 192 s — no word readable |
| rooftop-party (loop) | rooftop-party.mp3 (2:22) → **40 + 21 s** | low-pass 2.4 kHz, notches 144.5 / 165.8 / 289 / 331.6 Hz, 40 kbps | **MUSIC from 89 s to the end** (a melody on C4 / A♭3 / F3 / E♭3 / C3 + F6 / A♭6, ±0.3–1 %) and notes at 20.7–29 s, 69.6 s, 82.8 s — all outside; two recurring low lines (166 / 144.5 Hz, 0.5 s every ~5–6 s: a distant bass line or a machine) notched; a nearer voice at 36.5–39 s (0.46) left out; what's left: voices' pitches (178–214 Hz, ±1–3 %) |
| glasses-clink ×3 | glasses-clink / -2 / -3.wav (Mixkit) | 400 Hz | one clink · a table's three (0 / 0.24 / 0.35 s) · a wine glass; the held lines are the glass ringing |
| shop-bell ×3 | shop-bell.mp3 (12.3 s) → **1.3–3.85, 3.9–6.35, 6.5–9.35 s** | 400 Hz (a 230 Hz spring line under it) | the bell's partials 1.2 / 3.55 / 4.4 kHz; three jingles |
| scissors-snip ×4 | scissors-snip.wav (5.2 s, peaks −45 dBFS) → 2–4 snips each | 400 Hz, **gate −32 dB**, +45 dB of gain | 11 snips found; the takes sit at ≈ −28 LUFS (all transient: the limiter stops them) → slot gain 0.08 |
| broom-sweep (loop) | broom-sweep.mp3 (49 s) → **16.7 + 24 s** | 180 Hz (low thumps out), low-pass 4 kHz (through the glass), 48 kbps | steady strokes, no tonal content |
| window-sash-up | window-sash.mp3 (25.9 s) → **17.0–21.3 s**, `hit` 3.83 | 150 Hz | the long JUDDERING push (stick-slip onsets every ~0.1–0.3 s), a soft stop at 20.83 s, no thud — a weighted sash pushed up |
| window-sash-down | the same → **12.75–14.4 s**, `hit` 0.9 | 150 Hz, **the thud −8 dB** | a short slide onto the sill: THE THUD at 13.65 s (−10 dB) — a sash let down lands |
| roller-blind | roller-blind.mp3 → 0.12–1.05 s | 150 Hz | the tug + the roll's snap |
| cat-meow · cat-land | cat-meow.wav → 0–0.85 s · cat-land.mp3 → 0–0.7 s (`hit` 0.06) | 250 / 120 Hz | one meow (the room noise after it cut) · a soft landing (a stand-in) |
| door-knock | secret-knock.wav (five knocks at 0.03 / 0.32 / 0.58 / 0.88 / 1.20 s) + **door-slot.wav** → THE SECRET KNOCK, 3.3 s | `seq`: knock … knock-knock … knock (0 / 0.62 / 0.84 / 1.46 s), the slot −5 dB at 2.36 s; 80 Hz, +4 dB at 300 Hz, +3 dB at 2.5 kHz | measured back: onsets 0.02 / 0.60 / 0.79 / 1.44, the slot 2.34 s; a heavy door is mostly < 150 Hz, lifted where a phone plays |
| footsteps-cobble ×6 · -heels ×6 | footsteps-cobble.wav (Mixkit, a step every ~0.6 s + gravel) · footsteps-heels.wav (clean, every ~0.59 s) | 120 / 150 Hz, gate −36 dB | single steps from just before their onsets (0.37–0.58 s each) |
| laugh-distant ×2 | laugh-distant.wav (Mixkit, a crowd laugh) → 0–2.75, 2.8–4.12 s | 200 Hz, low-pass 3.5 kHz | modulation 0.28–0.34 over 2–4 s (a crowd); the held lines are the "ha"s (213–229 Hz) — no words |
| cart-bell | cart-bell.wav (a hand bell, 6 s decay) → 0–3.6 s | 400 Hz | one ring (1.24 kHz + 2.47 / 2.67 / 3.19 kHz) |
| bus-arrive | car-1920s-pass-3.wav ("…Up_Stop_Off") → **397–417.6 s**, `hit` 17.0 | 70 Hz, +3 dB at 300 Hz, +3 dB at 1.5 kHz, 16 kHz | far (−61 dB) → near (−43 at 410 s) → settled into its stop idle at 414.0 s (64 Hz); the engine off at 418.5 left out |
| bus-idle (loop) | the same → **414.3 + 2.6 s** | the same | the ARRIVAL's own idle looped (seam +0.4 dB): the hand-over keeps its pitch (take 1's 67 Hz idle drifted 2 dB) |
| bus-pull-away | the same ("Start_Slow_Away") → **10.4–30.4 s** | the same, fade-out 4 s | revs to −40 dB at 12–19 s, then a steady 80 Hz note fading with distance |
| bus-door | bus-door.mp3 (an old truck door, HOT) | 120 Hz | a stand-in |

- **Not imported (`SKIP`):** `tv-murmur.mp3` — **the TV slot stays EMPTY**: music in it (G4 / E5 / G5 held 1–1.9 s at 26–41 s, a
  recurring 392.8 Hz) and one clear talker (modulation 0.5–1.1); `bus-idle.mp3` / `bus-depart.mp3` (the diesel stand-ins — the
  1945 truck instead); `mirror-door-open` / `-close` (the haunted alternatives); `door-slot` (inside the knock). `bus-brake-hiss` stays
  empty (an air brake is post-1920s).
- **The mix** (into the bus, before the Effects slider; the day hum −43.6): the knock (the player's own tap) −38.8 · the bus −38.8
  (arrival / pull-away), its idle −44.4 · the club −44.4 / −42.8 party (ducked with the bed under the music) · the mirror door −40.4,
  its close −42.1, the bar through it −40.4 · a clink −44 · the shop bell −44.9 · the sash −46.5 / −47.3, the blind −46.3, the cat
  −40.4 / landing −46.6 · the broom −47.5 · the rooftop −48.8 · a laugh −48.4 · the cart bell −46.5 · the snips −49.5 · the line −50.4 ·
  a footstep −51 / −53 (× the caller's gain: very soft). The speakeasy's beds, the line + the rooftop duck with the bed (bedMix's k).
- **THE MOMENTS HEARD** (`core/city-sounds.js#MOMENT_CUES`, `momentCues`; `sounds.js#life`): a moment seen for the first time queues
  its cues, each handed to the player ~2.5 s ahead and placed on the clock by its mark (late by > 0.3 s = silent): the toast's clink
  (p 0.38, its hit) · the wake's blind (p 0.02), the sash up (its stop at p 0.62) and down (on the sill at p 0.9) · the cat landing on
  the sill (p 0.07) + behind it (p 0.98) · the mirror: the bar (from p 0.06) + the door's thud shut (p 0.95) · the barbershop's opening
  (the bell p 0.48, snips p 0.77 / 0.9). The moments' first sounds stay `windows.js#sound`'s (the mirror's `door-heavy`, the cat's
  `cat-meow`). **THE BARBERSHOP'S DAY** (`barberAt`, `bellsBetween` — windows.js#barberDay's own 480 s cycle): the bell as each customer
  comes in (0.6 s) + goes out (345 s), a few snips every 6–15 s while he cuts; by day, while open. **THE 3 AM BROOM**: a bed while the
  bar's last light burns (3 → 4 am, night). Needs the windows' frame: `speakeasy({ …beds, fr, k, motion })`.
- **THE API** (the scene's `snd` = `createCitySounds()`; all silent when empty / locked / muted):
  `bus('arrive', { pan, gain, stopIn })` (stopIn = s until it halts: the take's stop lands there; without it, it halts 17 s in) →
  `bus('idle')` at the curb → `bus('door')` (each open / close) → `bus('depart')` → `bus('pan', { pan })` to follow it → `bus('gone')`;
  `step('cobble' | 'heels', { pan, gain })` per footfall of the nearest walker (< 0.18 s apart dropped); `laugh({ pan, gain })` (≥ 6 s
  apart); `cartBell({ pan })` once / `cart({ on, pan })` per frame (a ring 8–30 s after it's out, then every 40–110 s); `line(level, { pan })`
  and `rooftop(level, { pan })` (beds 0..1, kept by tick); `jets({ gain, dir, width })`.
- **SKY SOUNDS LOUDER AGAIN** (the owner, after SP2's +6 / +3.5 dB): the gains — the jets **0.07 → 0.14 (+6 dB)**, the helicopter
  0.074 → 0.117 + the burner 0.07 → 0.111 (+4 dB), the airliners 0.036 → 0.051, the banner plane 0.05 → 0.071, the drone hum
  0.045 → 0.064 (+3 dB); the geese, gulls + every animal unchanged. **PHONE PRESENCE**, baked in by the importer (re-encoded from the
  originals; levelled to the same LUFS, so the lows give way): +5 dB at 2 kHz (Q 0.7) on the flybys, +3 dB at 1.6 kHz on the burner and
  1.1 kHz on the swarm (under their low-passes). Measured, the 1–4 kHz band (what a phone plays) before → after, with the gains:
  helicopter +6.3 / +7.5 dB · airliner +6.3 · banner plane +6.0 · **jets +8.8** · burner +6.1 · swarm +4.3 — with the level asked for
  +3…+6. The jets' peak (−2 dBFS × 0.14) stays under the player's cap knee: no limiting, no startle.
- **FP3b — THE JETS LOUDER STILL** (the owner's 8P note 10: "sound great — a bit louder still, a slightly deeper music dip"): the gain
  **0.14 → 0.198 (+3 dB)** and the duck **0.66 → 0.56 (−3.6 → −5 dB)**; the peak (−2 dBFS × 0.198 ≈ 0.157) reaches just into the
  player's soft-cap knee (0.15 — the top ~0.4 dB rounded off, far under its 0.3 ceiling): loud, never clipped. (tests/harbor-sounds.test.mjs)
- **FP3b — THE STREET DOOR** (empty slots → silent until recordings are imported): `street-door` (the speakeasy's side door swinging open
  as someone walks through: a latch + a creak) and `street-door-close`; at night the open door lets out `bar-open`'s burst of the club;
  the barbershop's door rings `shop-bell` (people.js#doorSounds — on the swing, never inside a painter).
- **THE JETS' DUCK** (`duck: 0.66` on the slot — −3.6 dB; FP3b: 0.56, −5 dB; `duckAt`, `sweepPan`; `sounds.js#jets` / `ducking`): the music eased down from
  1.4 s before the take's peak (over 0.8 s), held to 1.2 s after it, eased back over 2 s (≈ 3 s under) through `duckMusic` ~4× a
  second; the pass panned right → left over its swell (the recording's own direction); released on destroy. There is no air-show event
  yet: 6b calls `snd.jets()` (or puts `jets` in `sky.listen()` — tick plays it).
- **Tests:** `harbor-sounds.test.mjs` — the sky's +6 / +4 / +3 dB on SP2 (the animals unchanged), the duck's shape + the pan, every 8P
  slot's cut + marks against the source (the thud at 4.65 s, the sash's stop / thud, the bus's stop at 414 s + its idle before the
  engine off), the cues + the barbershop's bells; `city-sounds.test.mjs` — the filled list (tv-murmur + bus-brake-hiss empty), the
  smaller beds' minimum lengths, the folder < 8 MB.
- **Known issues:** levels by LUFS arithmetic, not by ear; the moment cues need the speakeasy to pass its frame (one line in
  speakeasy.js); `door-slot`, `cat-land` + `bus-door` are stand-ins; the rooftop's remaining 178–214 Hz lines read as voices, not notes
  — the owner's ear decides.

## 6b — THE LIFE + WORKERS + WILDLIFE SOUNDS IMPORTED (Oct 24 2026; City 2.0) — `scripts/add-city-sfx.py`, `core/city-sounds.js`, `screens/harbor/people.js`
Grok's third folder (`~/Downloads/city-sfx`, credits.txt "Life + workers + wildlife sounds (added Sat Oct 24 2026)": Sonniss GDC, Mixkit,
Pixabay — 30 files, **every MD5 matches**; no CC-BY, no credit lines required; CREDITS.md carries each block + MD5, the Pixabay copies of
CC0 Freesound originals noted). Grok screened by speech-to-text + a music detector and named no trims for this set: **every cut here
comes from the analysis** — the 0.1–1 s RMS envelope in five bands (< 120 Hz, 120–400, 400–1500, 1.5–4 k, 4–15 k), onsets, **VOICING**
(the 300–3400 Hz signal's autocorrelation peak at 2.5–12 ms lags > 0.6 = a voiced frame: a talker's vowels, a whoop, a coo, a howl),
held tonal lines (music: ≥ 0.45 s within ±1.5 %), the 2–8 Hz speech modulation. Same encode (mono 32 kHz MP3, 64 kbps; the low-passed
beds + the siren 40 kbps; the low / distant ones decode at 16 kHz). **102 slots, 70 filled; `audio/city/` 9.24 MB (+2.05 MB: 54 new
files — the two long police passes 0.5 MB of it).** Importer: `--only <the new slots>`; the Volvo's road takes re-encoded byte-identical.
| slot (part) | source → kept | processing · slot gain (≈ LUFS into the bus) | what the analysis found |
| --- | --- | --- | --- |
| street-door ×3 · street-door-close ×4 (7) | street-door.wav (22.7 s, a house's front door opened + closed far + soft, ×4) → opens **0.5–1.65 / 4.45–5.55 / 9.6–10.75 s** (`hit` = the latch), closes **1.85–3.0 / 6.85–8.0 / 12.55–13.8 / 19.0–20.1 s** (`hit` = the thud; the last w 0.6) | 70–80 Hz, +3–4 dB at 300 Hz, +3 dB at 1.5 kHz, gate −32 / −34 · 0.08 / 0.07 (× 0.8 / 0.75 from people.js ≈ −44) | peaks −21 dBFS; the thuds are mostly < 120 Hz (lifted where a phone plays); a rattly fourth open (15–16.2 s) left out |
| police-car-1920s ×2 (7) | **car-1920s-pass.wav (the 1929 Volvo — the owner's pick)** → the WHOLE passes **7.0–38.0 / 116.0–148.5 s** | fades 2.5 / 3 s · 0.14 → **0.1** (−40: a car's) | roll in from far (22 / 36 dB under the peak), by, away: 31–32 s vs the road's 18 s takes. Grok's `police-car-1920s.wav` (Fox Audio, a short pass of an unknown old car) not used |
| siren-1920s ×2 (7) | siren-1920s.wav (48 s, a manual fire siren, HOT) → **0.5–15.0 s** (one wail) + **14.5–46.5 s** (the long one, w 0.6) | 250 Hz, **low-pass 1.8 kHz**, 16 kHz, 40 kbps · 0.08 → **0.045** (−47) | FAR + SOFT: up 0–4 s, held 4–9, down to −28 dB at 14.5, up again, held 19–29, a long fall to 46 s |
| police-whistle (7, new) | police-whistle.wav (Mixkit, a pea whistle) → **0.05–1.3 s** | 400 Hz, low-pass 4.5 kHz · **0.035** (−49) | one blast, its ~3.5 kHz fundamental kept, the upper partials gone (far) |
| dog-bark ×2 (8) | dog-bark.wav (a small dog far off) → **0–1.25** (the double bark) + **0.24–1.25 s** (the single, w 0.7) | 300 Hz · 0.1 → **0.06** (−44) | two barks at 0.05 / 0.3 s + their echo |
| market-murmur (8, loop) | market-murmur.wav (1:38, a Chilean village market) → **62.5 + 22 s** + a 2 s tail (≤ 86.5 s) | 150 Hz, **low-pass 1.4 kHz**, 16 kHz, 40 kbps · 0.1 → **0.06** (−48) | voices + steps on sand throughout, no music; voiced frames lowest in 64–87 s (0.00–0.08 a second); **never 88–98 s** (the owner); after the low-pass no word readable |
| milk-bottles ×2 (8) | milk-bottles.mp3 → **0–0.98 / 0.98–3.05 s** | 300 Hz · 0.1 → **0.05** (−46) | four clink groups |
| trash-can-lid (8, new) | trash-can-lid.mp3 (HOT, clipped in places) → **0.05–3.3 s** | 150 Hz · **0.05** | the rattle 0.1–2.5 s, the lid's ring (922 / 859 / 422 Hz) after |
| crates-clink ×3 (8, new) | crates-clink.mp3 (27 s) → **1.5–4.0 / 5.7–7.3 / 13.7–15.6 s** | 250 Hz · **0.05** | three busy stretches of a bottle crate |
| newspaper-rustle (8, new) | newspaper-rustle.wav → whole (0.78 s) | 200 Hz · **0.04** (−48) | one opening |
| ladder-clank ×2 (8, new) | ladder-clank.mp3 (9.1 s) → **4.3–6.5** (the big clank at 4.4) + **0.35–2.1 s** (small ones, w 0.8) | 150 Hz · **0.05** | |
| squeegee ×4 (8, new) | squeegee.mp3 (50 s, 13 strokes between digital silences) → the squeaks **0–2.2 / 3.9–5.4 / 21.3–23.8 / 25.4–27.9 s** | 250 Hz · **0.04** | 1.5–4 kHz on top (centroid ~3.5 kHz); the sponge's wipes (400–1500 Hz) + a filtered 14–19 s stretch left out |
| jogger-trip (8, new) | jogger-trip.wav (a body-fall, feet first) → **0.05–1.0 s**, `hit` 0.06 | 90 Hz, +3 dB at 300 Hz · **0.05** | the hit at 0.1 s + its scuff; no voice (voiced 0.00) |
| ships-bell (8) | ships-bell.mp3 → whole (one ring, 4.3 s) | 300 Hz · 0.14 (unchanged) | the bell's partials (437 / 875 / 1172 / 1594 / 1828 … Hz) held 1–4 s — the bell, not music |
| steam-whistle (8) | steam-whistle.wav (12 s, a Royal Hudson from the cab) → **1.7–4.9 s** | 250 Hz, low-pass 3.5 kHz · 0.16 (unchanged) | 0–2 s the engine's noise (no tone), **the whistle 2.0–4.3 s** (437.5 Hz held), then the engine chuffing to the end |
| ship-horn (8) | ship-horn.mp3 → **0–6.4 s** | 80 Hz, 16 kHz · 0.16 (unchanged) | one blast on 109.4 Hz + harmonics, the echo to 5.8 s |
| boat-putter (8, loop) | boat-putter.mp3 (1:39, a narrow boat's engine) → **11.4 + 30 s** + tail | 100 Hz, **low-pass 1.8 kHz**, 16 kHz, 40 kbps · 0.09 → **0.07** (−47.5) | steady (±2 dB); seam +0.4 dB — **the water taxi now putters across** (sounds.js already keeps it while it crosses) |
| pigeon-flutter · pigeon-coo ×2 (8, new) | pigeon-flutter.wav → whole · pigeon-coo.wav → **0.4–3.6 / 4.0–6.1 s** | 300 / 150 Hz · **0.04** | quiet sources (−46 / −43 LUFS); no voice |
| duck-quack ×3 (8, new) | duck-quack.mp3 (57 s of a pond) → **5.8–8.1 / 0.1–2.5 / 23.9–26.6 s** | 300 Hz (a low rumble under them cut) · **0.04** | the liveliest stretches |
| squirrel-chatter (8, new) | squirrel-chatter.wav → **7.4–10.4 s** | 400 Hz · **0.035** | the chatter (−31 dB over a −60 floor); a softer bout at 11–13.5 s left out |
| coyote-howl ×2 (8, new) | coyote-howl.wav (1:25, very quiet: −57 LUFS) → **24.5–34.6 / 35.4–40.9 s** | **350 Hz–2.8 kHz**, 16 kHz · **0.04** | the howls (voiced 0.3–0.55) ~13 dB over the floor there; band-passed so the hiss stays under them |
| coyote-yip ×3 (8, new) | coyote-yip.wav (a close coyote, noise-reduced) → **15.9–17.7 / 32.9–36.0 / 46.4–48.7 s** | 350 Hz, low-pass 3.5 kHz (made distant) · **0.035** | the three most voiced bursts (0.31–0.37) |
| glow-wand-swish ×4 (10, new) | glow-wand-swish.wav (four wooden-stick swishes, HOT) → each **~0.37 s** | 200 Hz · **0.03** (× 0.5–0.8 ≈ −53) | 0.1 / 2.0 / 3.9 / 6.1 s, digital silence between |
| crowd-clap ×3 (10, new) | crowd-clap.mp3 (30 s, a crowd cheering + clapping) → **9–15 / 14.5–20.5 / 20–26 s** | 200 Hz, **low-pass 3 kHz**, 16 kHz · **0.04** | **no voiced frames** (≤ 0.07: no chant, no words), no held line; the steady middle, faded 0.8 / 1.8 s |
| crowd-whoop (10, new) | crowd-whoop.wav → **0–4.6 s** | 200 Hz, low-pass 4 kHz · **0.04** | the whoops 0–1.5 s (voiced 0.67–0.92: "whoo"s, no words), applause after |
| tr3b-crackle (sky) | tr3b-crackle.wav (an electric arc + its reverb) → **0–3.6 s** | 60 Hz, +3 dB at 2 kHz · 0.1 (unchanged) | energy mostly < 400 Hz (the presence lift for a phone). **Not wired here** — the TR-3B's event calls it |

- **Left EMPTY (`SKIP`, each with its reason in the slot's `what`):** `traffic-far` — MODERN traffic (the owner); `trash-truck` — a modern
  ZIL diesel STANDING STILL (start, revs at −20…−28 dB, the dips between them, the stop at ~128 s): there is no arrival or departure in it to cut, so
  8b builds the visit from its own pieces (the lid + the crates are in); `raccoon-chitter` (new slot) — the file is a hiss + growl ATTACK: **not
  one voiced frame in 83 s**, broadband — scary, so no; `tv-murmur` still empty (no retry file); `police-car-1920s.wav` not imported (the Volvo
  instead). `bus-brake-hiss` stays empty.
- **New slots** (19): police-whistle (7) · trash-can-lid, crates-clink, newspaper-rustle, ladder-clank, squeegee, jogger-trip, pigeon-flutter,
  pigeon-coo, duck-quack, squirrel-chatter, coyote-howl, coyote-yip, raccoon-chitter (8) · glow-wand-swish, crowd-clap, crowd-whoop (10).
- **WIRED (only events that exist):** the side door — `people.js#doorSounds` already played `street-door` on the swing open + `street-door-close`
  as it swings back (FP3b): filling the slots makes them sound. The water taxi — `sounds.js` already keeps `boat-putter` while it crosses.
  **THE DANCE CIRCLE** (`people.js#danceSounds`, run from `tick` — never inside a painter): on each beat crossing (the wands' own beat: the party's
  song clock, else 120 bpm) during a BIG move — the swing's cross + the signal's swap (the arms' fastest moment: wands.js#danceMoves), a spin as it
  starts — 30 % of the time one dancer's `glow-wand-swish` (panned to them, × 0.5–0.8, ≥ 0.9 s apart: ~1 every 3–4 s); while watchers are in their
  'clap' pose (1–2 of the 3–5), a `crowd-clap` take 3–9 s after they start, then every 18–40 s (× 0.55–0.8, × 0.75 with a single clapper, panned to
  the circle); on a new phrase (every 8 beats) a 6 % chance of a `crowd-whoop` (≥ 90 s apart). Checked in node on a forced circle (6 dancers, 4
  watchers, one of them clapping): 120 s → 35 swishes, 6 clap bursts, 1 whoop. The ship's bell, the noon whistle, the 7 pm horn, the dog, the market, the workers +
  the wildlife have no event yet: filled, silent until 8b / the city schedule calls them.
- **Tests:** `city-sounds.test.mjs` — the 70 filled; traffic-far / trash-truck / raccoon-chitter / tv-murmur / bus-brake-hiss empty; the police
  cars from the Volvo; the market's window ≤ 88 s; the siren + whistle soft (+ the siren at 16 kHz); the market's 20 s loop minimum; the folder
  < 10 MB; the empty-slot examples are `witch-cackle` now (also `harbor-sounds.test.mjs#takeAt` + e2e-harbor's EMPTY SLOTS line).
- **Known issues:** levels by LUFS arithmetic, not by ear; Grok's "readable words" screen was speech-to-text, mine voicing + modulation —
  the market (low-passed) and the crowd-clap (no voiced frames) are the ones for the owner's ear; crowd-clap is a big crowd made distant (no
  small-group file); `duck-quack`, `milk-bottles`, `trash-can-lid`, `ladder-clank`, `crates-clink`, `ships-bell`, `ship-horn`, `boat-putter` are
  the lossy Pixabay copies (the lossless CC0 originals: credits.txt's Freesound links — drop them in under the same names and re-run).

## 6b — THE LEGENDARY SKY, HEARD + THE TAPE STOP (Oct 24 2026; City 2.0's title) — `screens/harbor/sounds.js#legendSounds`, `audio/music.js#bendMusic`
The legendary events (docs/harbor/passes/part-6b.md) report their state through `legends.listen()` (the scene hands it to `snd.tick` as `legend`):
- **THE ABDUCTION:** `ufo-hum` (a bed, panned with the saucer, up as it comes in, out as it leaves), `ufo-beam` once (its riser's peak —
  6.65 s into the take — lands as he leaves the ground, ~10.6 s in). The music DIPS (to ~0.42) and is MUFFLED (a low-pass down to ~900 Hz)
  while it's here, eased back after (`ufoAt().music`).
- **THE TR-3B:** `tr3b-drone` (a bed, louder as it passes overhead), `tr3b-power-down` once (its thump — `hit` 3.25 s in — as the city under
  it dies, ~6 s in), `tr3b-crackle` (Grok's, now filled) every ~1.6–4.2 s while the drain pulls, panned near it; THE CHASE: `jet-flyby` through
  the existing `jets()` pass (panned along their direction, the music ducked round its peak — the 8P duck), started ~30.2 s in so its peak
  lands as the jets cross the middle. THE MUSIC POWERS DOWN: a TAPE STOP — `bendMusic(rate, s)` ramps the playing element's speed (the pitch
  sagging with it: `preservesPitch` off while bent) to 0.42, a low-pass to ~380 Hz, the level to ~0.1; after the jets it powers back up
  (the speed to 1 over 1.5 s, the filter opening, the level back). The time the song fell behind while bent is COUNTED and skipped when the
  speed is back at 1 — a lobby's synced song is on the room's clock again (no drift). A new track resets it; music off: only the sounds play.
- **THE AIR SHOW / THE MISSING MAN:** `jet-flyby` on each pass (skyfx `listen().jets`); **THE BARNSTORMER:** the `prop-plane` run while it flies.
- Never left bent / muffled / ducked: the scene's destroy restores the filter, the rate and the duck.

## POLISH 4 — THE JETS IN SYNC, THE DRONES HEARD (Oct 25 2026; City 2.0's title) — `core/city-sounds.js#JET_SYNC`, `jetPan`, `audio/city-sound.js` (`sync.at`), `screens/harbor/sounds.js#jets`, `#legendSounds`
- **WHY IT LAGGED ~5 s** (the owner, the TR-3B's chase + the air show): `jet-flyby`'s 23 s take (`jets-formation.mp3`) was never fetched ahead
  and never placed on the clock — `citySound()` started it whenever its file had loaded (on a phone: seconds after they'd gone).
- **NOW**: the take is FETCHED as the event starts (`cityPrefetch('jet-flyby')` — the TR-3B's run, the air show's start) and STARTED with a
  `sync` (`{ peakIn, at, pre, fade, late }`): its roar's MIDDLE — `JET_SYNC.at` 4.8 s into the take (measured in Chrome: the loudness
  plateau 3.8 → 5.6 s in 0.2 s windows; the importer's stored `peak` 5.5 sits at its end) — lands as the formation's middle crosses the
  screen's centre (the TR-3B: `harbor-legend.js#chasePeakS`; the air show / the missing man / the surprise flyby: `jets.js` `listen().peakIn`
  per pass, once per pass). Its quiet head is trimmed (`pre` 2.2 s kept: it starts ~0.6 s before they come in), joined part-way with a
  0.25 s fade if the file came late, SILENT under 0.35 s from the peak (a roar after they've gone is worse than none). `audio/city-sound.js`:
  `sync.at` = a moment of the take's own placed on the clock instead of its measured peak (new, general).
- **PANNED WITH THEM**: `jetPan(x)` from the jets' real place on the screen each tick (±0.85, gentle at the edges) instead of the recording's
  own right → left sweep; the music's duck round the same peak (`duckAt` on the take with `peak: JET_SYNC.at`).
- **THE DRONE SHOW's HUM** (`drone-swarm`, "a soft swarm hum, five quadcopters layered + detuned, low-passed"): it was wired (`keep('drone-
  swarm', …)`) but ~51.5 LUFS down and under the bed's duck — never heard; its gain 0.064 → 0.15 (+7.4 dB), still under the helicopter;
  plays while the show flies (now a message — docs/harbor/passes/polish-4.md).
- **THE BARNSTORMER's prop** (`prop-plane`) follows the plane's own flight (`barn.flying()`), not its smoke lingering ~10 s after.
- **THE TR-3B's TAPE STOP, HEARD** (the owner's iPhone): the sag now happens while the music is LOUD (never under 0.5 × — iOS mutes a media
  element below half speed), the fade after it; coming back, the volume first, then a slow spin-up; the lost time made up by a seek while
  silent (`musicCatchUp()`, new) + the rest drained at 1.05 × with the pitch kept (`bendMusic`: no end-of-bend skip) — docs/harbor/passes/polish-4.md.

## Weather sounds (LIVE WEATHER, Oct 19 2026) — `js/audio/ambience.js`
- **Rain** (`startRain(level)` → `stop(fade)`, `stop.level(l)`): only while it really rains on the title (`title.js#rainSound`,
  level = rain + 0.25 in a storm). A breathing bed of filtered noise, a low roar that only a downpour brings, and droplet ticks
  (tiny pitched clicks panned across, more as it pours). Felt more than heard: the bed sits at ~0.008 on the SFX bus.
- **Thunder** (`thunder({ near, delay, level })`): fired by each lightning strike (weather-fx → `scene.set({ onFlash })`), a few
  seconds after the flash (light outruns sound: near 0.5–2 s, far 2.5–7.5 s). **Recorded since Oct 20, 2026:**
  `audio/weather/thunderstrike.mp3` (11 s) and `thunderstrike2.mp3` (15 s, ~7 dB louder — levelled by `REC_GAIN`), one at random
  per strike: a close strike as recorded, a distant one through a 520–780 Hz low-pass and quieter (far thunder loses its crack);
  a random pan and ±5 % pitch so repeats differ; at most two sounding at once (a storm never piles up). RUMRUNNER's storm uses
  the same (`games/rum/audio.js#thunder`: mostly distant, `level` 0.7 under the music). **The synthesized thunder** (a tearing
  crack, a sizzle and a low thump when near; 3–6 swells of brown-noise rumble through a 4 s dark stereo space) plays when a file
  can't load or no recordings are listed.
- **Recorded sounds (optional):** royalty-free recordings beat synthesis. Put them in `audio/weather/` and list them in
  `RECORDED` (ambience.js): `thunderNear` / `thunderFar` (one picked at random per strike) and `rainLoop` (replaces the
  synthesized bed; the roar and droplets stay under it). Empty lists = the synthesized versions; nothing is requested until listed.

## Loading, PWA, previews (Lighthouse mobile: 98–99 performance / 100 accessibility / 100 best practices / 100 SEO)
- `index.html` inlines the boot screen styles, so it paints right after the HTML. **All stylesheets are non-blocking**
  (`media=print` + onload swap); the three core sheets call `__cssDone()` and the page keeps everything except `#boot`
  hidden until `html.css-ready` — no flash of unstyled content. chat.css, board.css and card.css (reachable from the menus) load
  the same way, without gating. **Each game's own sheet and css/kit.css load with its screen** (`games/lazy-view.js`, Oct 2026:
  the first visit no longer downloads twelve games' styles): the view mounts only once both the module and its sheets are in,
  each sheet is inserted at its old place in the cascade (`ORDER`), and the lobby warms a game's sheets when the host opens its
  options. **Anything two games share belongs in components.css** (the shared keyframes `pop shake win count-tick q-in`,
  `.screen .is-hidden`, the `[data-text]` glitch layers) — a rule in cipher.css stops existing for OVERCLOCK once sheets are lazy.
  `tests/integration/e2e-loading.mjs` checks it.
- **Caching:** our code, styles and `/data` revalidate on every load (`max-age=0, must-revalidate`; an unchanged file is a
  quick 304), so a deploy never pairs new code with an old question bank or song list. Only `/audio` is cached for a week —
  bump `music.js#REV` when replacing a song.
- `app.js#dismissBoot` fades the boot screen once core CSS is in and fonts are loaded (≤0.7 s wait for new visitors, so TAP
  TO ENTER is up within ~1 s; 1.5 s when resuming a room). Players **without** a
  saved session get the title screen first and the Firebase SDK starts loading right after it paints (`setup.js` awaits
  `firebaseReady` on submit). Players resuming a room wait on the boot screen until they're reconnected.
- The boot screen is the district before the lights come on: the unlit NEON sign (inline SVG, glass tubes only, generated by
  `scripts/build-boot-logo.mjs`) + "SPEAKEASY" in a system font (with the Deco ornaments) — the page's LCP element, painted with the first frame.
  It sits exactly where the title's sign sits, so the hand-off doesn't jump. title.css is the fourth core sheet.
- Game views are lazy (`games/lazy-view.js`): each `index.js` exports `createView = lazyView(() => import('./view.js'), gameSheets('<id>'))`,
  so only directors/logic load at startup. PULSE's song list loads when the page is idle.
- Music never downloads before the first tap (it can't play anyway) — see `audio/music.js#playMusic`.
- Keep hidden-but-rendered text out of the initial DOM (e.g. the connection banner starts empty) or Lighthouse picks
  it as the LCP element.
- Service worker registers only on https non-localhost. It is network-first with cache fallback, skips cross-origin,
  `/audio/` and range requests. Bump `CACHE` in `sw.js` only if you need to purge old offline copies.
- Link previews use absolute URLs to `https://neonspeakeasy.com/assets/og.png?v=2` — update if the domain changes, and bump `?v=` when
  the image changes (iMessage / WhatsApp / Slack cache previews by URL).
- Re-render icons/preview after design changes: `cd tests/integration && node render-assets.mjs "<browser path>"` (needs
  scripts/serve.mjs; renders `tests/integration/brand.html`: the real city + logo). `assets/icon.svg` is the tube N on night blue.


## Music
RUMRUNNER's `run1-4` (the owner's, 112 kbps; playlist `rum`: a seeded calm pair then the driving pair, see docs/rum.md), HIGH STAKES' `high1-3` (lo-fi, the owner's, 112 kbps; playlist `stakes`, seeded per room) and NEON PAR's three zone tracks (`golf-rooftops`, `golf-cyber`, `golf-arcade`), DOUBLE AGENT's `spy1-3` and PRISM DROP's `prism1-5` are the owner's, re-encoded at 112 kbps stereo.
Six tracks supplied by the owner, re-encoded with ffmpeg (`-vn -map_metadata -1 -ar 44100 -ac 2 -b:a 128k`; overclock at
120k to stay under 4 MB). The originals stay out of the repo.


## MOOD MUSIC (Oct 2026) — the menu music follows the time of day
Files: `js/audio/mood.js` (the moods + the per-device shuffle bag), `js/audio/lobby-music.js` (the room's synced song),
`data/mood-music.json` (THE song list), `scripts/build-mood-music.py` (import + analysis + sorting), `tests/mood.test.mjs`,
`tests/integration/e2e-mood.mjs`.
- **Where:** every screen except a game and its podium: the title (silent until TAP TO ENTER, then it starts with the city),
  setup, the lobby, THE BOARD, the card and sheets over them, and the public `/board` (starts on the visitor's first tap; its own
  music button). `/admin` has no audio. A game plays its own music; after the podium the lobby's song comes back.
- **Moods** (local time; real sunrise / sunset from `core/sky.js`): LATE NIGHT midnight → sunrise · MORNING sunrise → 11 am ·
  DAY 11 am → sunset · EVENING sunset → midnight · PARTY Fri and Sat 8 pm → 2 am (into Sat / Sun morning; beats evening and
  late). `mood.js#moodAt` is pure and tested at every boundary. The `?when=&tz=` preview switch drives it.
- **Outside a room** (`app.js`): `playMusic('mood')`, a provider list in `music.js` (`setListProvider`): the next song is chosen
  ≈ 45 s before the current one ends, from the mood at that moment — a mood change never cuts a song, it finishes and then
  crossfades into the new mood. A shuffle bag per mood in localStorage (`nd:moodbag:<mood>`): no repeats until every song in
  the mood has played, never the same song twice in a row across cycles. Only the playing song (and, near its end, the next)
  downloads.
- **In a lobby** (`lobby-music.js`): the HOST's clock decides. The host keeps a queue in `rooms/{code}/meta/lm` = { m, t0,
  songs, sd, bag } and appends the next song ≈ 40 s before the last one ends (from its mood then; the room's own bag). Every
  phone plays the queue with the synced-songs player on the server clock — the same song at the same moment; late joiners land
  in the right spot; a new host just keeps appending (the song playing finishes). While no queue exists (e.g. the rules not
  yet published) phones fall back to their own mood shuffle. **The rules have a new `meta/lm` child: re-publish
  database.rules.json in the Firebase console.**
- **The song doesn't change when entering a lobby** (Oct 20, 2026; `core/lobby-song.js` PURE, `lobby-music.js`, `room.js#createRoom`):
  a new room's queue is SEEDED with the song the host is already hearing (`music.js#nowPlaying`), `t0 = server now − its position`
  (`seedQueue`), so title → setup → lobby continues with no change at all. A phone whose own player is already on the room's
  current song within 2.5 s of the room's place keeps playing it (`rideDecision`: nothing restarts) and the synced player only takes
  the songs after it (`setMinIndex`): at the next song it crossfades in on the server clock while this phone's player fades out over
  the same 4 s (`handoffFade`). A joiner on a different song crossfades into the room's song at the room's place once it is decoded
  (the synced player's `joinFade` 1.8 s, this phone's player out over 1.8 s — the old song keeps playing until the new one sounds).
  The next song still comes from the host's mood ≈ 40 s before the current one ends (a mood change waits). Nothing to carry over
  (music off, CLASSIC, not unlocked yet, within 5 s of its end) → the room picks its own song as before. Tests:
  `tests/lobby-song.test.mjs`, `tests/integration/e2e-lobbysong.mjs` (real audio in headless Chrome: the host's song continuous,
  a joiner's crossfade at the right place, a joiner on the same song not restarting, the CLASSIC fallback).
- **Settings:** MENU MUSIC: TIME OF DAY (default) / CLASSIC (`settings.menuMusic`; CLASSIC = the old menu playlist, THE BOARD's
  menu3). The music button, MUSIC toggle and volume work as before (everything goes through the music bus).
- **The song list** (`data/mood-music.json`): `moods` (id lists) + `songs` (mood, keeper, bpm, loudness, brightness, busyness,
  key, per-mood fit scores). **Move a song:** change its `mood` and move its id to that list (or ask). `keeper: true` = the
  owner picked it for this system (never retired). Everything else is TEMPORARY (the existing game / menu tracks, until the owner
  supplies more). Fanfares, files under 75 s and duplicate files (high2 = golf-rooftops) are left out.
- **Scoring** (features normalised across the pool to 0..1; each song to ONE mood by an optimal assignment that keeps every
  mood at 5–8 songs):

  | mood | score |
  | --- | --- |
  | late | 0.42 calm (low loudness) + 0.28 dark (low centroid) + 0.2 slow + 0.1 sparse |
  | morning | 0.34 bright + 0.28 major + 0.2 mid tempo + 0.18 gentle (mid loudness) |
  | day | 0.4 loud + 0.25 bright + 0.2 fast + 0.15 busy |
  | evening | 0.32 minor + 0.26 mid-high loudness + 0.22 not too bright + 0.2 mid tempo |
  | party | 0.36 loud + 0.26 busy + 0.2 fast + 0.18 major |

- **Adding the owner's songs:** drop files into ~/Downloads named by mood and number, continuing each mood's numbering:
  `late3.mp3 …`, `morn1.mp3 …`, `day1.mp3 …`, `eve1.mp3 …`, `party1.mp3 …` (mp3 / m4a / wav / ogg / flac), and ask to "add the
  new mood songs". That runs `~/.cache/neural-arcade/pyenv/Scripts/python scripts/build-mood-music.py` — it re-encodes them into
  audio/music/ (stereo 44.1 kHz 112 kbps), adds them to their mood as KEEPERS and re-sorts the temporary songs around them.
  `--retire-temporary <mood>` drops the temporary picks from a mood once it has enough keepers; `--keep-assignments` leaves every
  song where it is and only places new ones. Then `node --test tests/mood.test.mjs` and commit `audio/music/` + `data/mood-music.json`.
- The dev server (`scripts/serve.mjs`) now answers byte ranges like Vercel, so a song can be sought in tests.


## CITY 2.0 MUSIC (Oct 23 2026) — the owner's mood songs, City 2.0's own day, the MUSIC MOOD setting
Files: `core/city.js` (which city is showing + the clock it runs on), `core/city-mood.js` (PURE: City 2.0's mood rule), `audio/mood.js`
(`moodNow`, `fixedMood`, `songsFor`), `audio/music.js#switchNow`, `app.js#moodWatch`, `ui/settings-panel.js#moodRow`, the preview panel's MUSIC section
(`screens/harbor/remote.js`, `core/harbor-remote.js` → `mood`), `scripts/add-city2-music.py`, `tests/city-music.test.mjs`, `tests/integration/e2e-harbor.mjs` (group `music`).
- **The songs** (`data/mood-music.json`): `city2.moods` = City 2.0's five decks (ids → `songs[id]`, files `audio/music/c2-<name>.mp3`); City 1.0's `moods` are
  untouched (its AUTO is exactly as before). `city2.sources[md5]` records what was imported from where, `city2.shared` which songs sit in more than one deck.
  The owner's folders in ~/Downloads, Oct 23: **morning 11 · day 11 · evening 14 · late 11 · party 9 = 56 files → 51 songs stored + 1 reused**:
  morning4–7 are byte-identical to day4–7 (stored once, as `c2-morning4…7`, listed in MORNING **and** DAY); the owner's first sharing, `c2-morning10`, is in MORNING
  **and** LATE NIGHT (one file); `evening3` is the repo's `slip8.mp3` (the same audio at the same timing — found by cross-correlation) — **M2: dropped** (the owner:
  City 2.0 never plays City 1.0 songs); `city2.sources` marks that file `skipped` so the importer never lists it again, and `--reuse` refuses a City 1.0 song
  (`city-music.test.mjs` checks no City 2.0 deck holds one). The decks: MORNING 11 (33 min) · DAY 11 (31) · EVENING 13 (46) · LATE NIGHT 12 (39+) · PARTY 9 (35).
  The victory + neon folders are ignored (City 1.0 / the games keep their own music).
- **Format + loudness:** stereo 44.1 kHz **112 kbps MP3** (the repo's music format), leading / trailing silence trimmed (only what is below −60 dBFS peak — never
  re-cut musically; e.g. late4 lost 6.5 s of digital silence at the start), levelled to **−16 LUFS integrated** (BS.1770; the older repo songs range −6…−21, they were never
  levelled) with a **true peak ≤ −1 dBTP** (a −2.2 dBFS limiter only on songs that had to come UP, such as morning7 −21.3 → −16.1). 51 songs, 172 min, **144.5 MB** added.
  Originals in Downloads are untouched.
- **City 2.0's AUTO** (`core/city-mood.js#cityMoodAt`, on the Harbor's own clock — `?when= &speed=` and the preview panel move the music with the light):
  LATE NIGHT 11 pm → dawn (the sun back above −6°) · MORNING dawn → 11 am · DAY 11 am → golden hour (the sun at 10° and falling, never before noon) · EVENING golden hour → 11 pm ·
  **PARTY** on the party show's hours (Fri + Sat 8 pm → 2 am) once the city has powered up (`harbor-dark.js#partyReady` — a long summer dusk is still EVENING). The party wins over
  LATE NIGHT: Friday 11:45 pm is PARTY (the late-night preview link is a Thursday: `&when=2026-10-22T23:45`).
- **Shuffle:** `nextForDevice` — a bag per mood and per city (`nd:moodbag:c2:<mood>`): every song once before any repeats, never the same song twice in a row (across a
  reshuffle, and across moods that share songs). The next song is chosen ≈ 45 s before the current one ends, from the mood at that moment, and preloads quietly; songs stream
  on demand and never block the title's first paint. **A natural change** (evening → late night) never cuts: the song finishes. **A forced change** — the listener picks a
  mood (setting / panel) or City 2.0's party starts — crossfades over 4 s after the new song has downloaded (`switchNow`; a song that is also in the new deck just plays on).
  A lobby's room song waits for the song to end (the host's queue appends the next song from the HOST's mood — guests never decide).
- **MUSIC MOOD** (settings, both cities; `settings.musicMood`, saved per device): AUTO (default) / MORNING / DAY / EVENING / LATE NIGHT / PARTY. A chosen mood plays that mood's deck in the
  city that's showing (City 1.0: its own lists). In a lobby the room follows the host's. The preview panel's MUSIC section: the mood buttons (part of the panel's state, so EVERYONE ON
  CITY 2 follows; a link's `&mood=` does the same and wins over the saved setting), SKIP TO THE NEXT SONG (this phone), and the song playing with its beat grid's status.
  `&debug=1`'s readout has a `music` line (`music PARTY · c2-party9 100.0 · grid trusted (lock 5.46)`).
- **Beat grids:** every song has `grid` (`bpm, t0, down, steady, drift`) from PULSE's tracker like the older ones, plus `lock` (onset energy on the grid's beats ÷ between them),
  `agree` (the share of the kicks the city's kick listener — the 150 Hz analyser + `onsetStep` replayed offline — hears that land within ±0.15 beat of the grid; chance ≈ 0.3; City 1.0's songs
  read 0.2–0.93) and `kicks`. **`grid.trusted`** = steady for the whole song AND (agree ≥ 0.5 OR lock ≥ 3). A song that isn't trusted keeps its grid out of the beat clock
  (`beat.js` returns `untrusted`, `harbor-beat.js` ignores its tempo): **the kick listener leads** — the city punches on the kicks it hears, like with no song.
  I could not listen on this machine; "by ear" was replaced by that offline replay of the real listener (and e2e-harbor checks the runtime picks the right branch per song).
  **Not trusted (15 of 51):** c2-morning2, c2-morning3, c2-morning7 (the tempo drifts 24 ms in the last quarter), c2-morning8, c2-morning11, c2-evening4, c2-evening7, c2-evening11,
  c2-evening14, c2-late1, c2-late2, c2-late4, c2-late8 (tempo changes), c2-late10 (tempo changes), c2-party3. Re-check one with `--regrid --only <id>`; flip it by hand in the JSON if the owner's ear disagrees.
- **Adding songs later (one folder drop + one command):** put the files in `~/Downloads/{morning,day,evening,late,party}/` (any name, mp3/m4a/wav/ogg/flac) and run
  `~/.cache/neural-arcade/pyenv/Scripts/python -I scripts/add-city2-music.py` (`--dry-run` first if you like). It skips what is already imported (by bytes), stores identical files in
  several folders once and lists them in each mood, levels + trims + encodes the new ones, builds their grids (+ lock / agree / trusted) and writes the JSON. A song that should also play in
  another mood: add its id to `city2.moods[mood]` by hand (and `city2.shared`). A file that IS an existing repo song: `--reuse evening/evening3.mp3=slip8`. Interrupted: `--resume`.
  `--regrid [--only a,b]` / `--retrust` redo the beat numbers. Then `node --test tests/city-music.test.mjs` (the decks, files, levels, trust list in this doc) and commit `audio/music/` + the JSON.
- **Hook, not built:** once a deck reaches ~30 songs, play one half of it each week (`mood.js#deckForNow`, `HALVES_FROM`). Seasonal songs later.
- **Size:** +144.5 MB in git (the repo's music was 97 MB) — see the owner's decision in the Oct 23 handoff (docs/harbor/passes/m.md).

## 8b1 — Grok's second-try sounds + the TR-3B heard on a phone (Oct 25 2026; docs/harbor/passes/part-8b1.md)
- **Imported** (`scripts/add-city-sfx.py` CUTS; analysed, not heard — per-second loudness, voiced frames, tonal peaks, the low-end share):
  `tv-murmur` ← tv-murmur-2 (an indistinct walla: ≤ 20 % voiced frames in any second, no held tone; 16.3–31.3 s loop + 2 s tail, 300 Hz–1.8 kHz
  "through glass", 16 kHz — the first cut 3–31 s had a 5.5 dB seam) · `trash-truck-arrive` (the old truck's pull-out 80–96.5 s REVERSED —
  coming in, winding down — crossfaded into its idle 3–14 s; `hit` 16 s = stopped) + `trash-truck-depart` (58–96.9 s: idle → revs → away;
  `hit` 15 s = the pull-out), LPF 5 kHz · `tr3b-presence` (1.5–30 s loop + 2 s, HPF 90 Hz, `sat` (6, 2.6, 160 Hz) + `dup` (180 Hz, +4 dB)) ·
  `power-failure` (the whole 9.35 s spin-down, levelled from −13.4) · `power-restore` (0–9 s, `sat` (8, 1.4, 170) + `dup` (180, +6)).
  NOT imported: traffic-far-2 (a continuous wash, a 15 dB swing in 100 s, never a gap — modern density; its cut is ready in CUTS, the stem in
  SKIP) · raccoon-chitter (still the hiss: empty). New recipe steps: `sat`, `dup`, `seq` pieces with `rev` + an equal-power `xf`.
- **THE PHONE-SPEAKER CHECK** (each file through HPF 200 Hz + LPF 4 kHz, × its slot gain, × the Effects default −6.2 dB; the music at its
  default ≈ −34 LUFS out, a party song): the music LOUD on a phone ≈ −39.7 · DRAINED (½ volume, 900 Hz) ≈ −49 (the old drain, 12 % + 380 Hz:
  −66, i.e. silent) · `tr3b-presence` 0.22 → **−46.0** on a phone (the saturation cut its phone loss 5.3 → 2.2 LU: ~3 dB over the drained
  song) · `power-failure` 0.2 → **−40.6** (≈ the music, as the lights die) · `power-restore` 0.2 → **−40.7** (phone loss 10.6 → 0.1 LU) ·
  for scale the jets −41.7 · `trash-truck-*` 0.12 → −45.6 / −45.9 · `tv-murmur` 0.08 → −52.4 (felt, through the glass).
- **THE DRAIN** (`core/harbor-legend.js#tr3bAt` music + `DRAIN_M`; `screens/harbor/sounds.js#legendSounds`): deep (~0.56 ×, the pitch with it)
  + a heavy warble (a wow ± 5.5 % at 0.55 Hz + a flutter ± 2.2 % at 1.9 Hz, never under 0.5 × — iOS's floor), a 900 Hz low-pass, held at ½
  volume overhead, near silent under the jets (31 → 38.6 s: the catch-up seek), then the volume back, the slow spin-up, the filter open.
- **THE BEAT's SAFETY RULE** + **a forced show plays a party song**: docs/harbor/passes/part-8b1.md (Group 0).

## 8b1 — the workers, the wildlife + the harbor's timetable, heard (Oct 25 2026; docs/harbor/passes/part-8b1.md)
Every one through its slot (silent while empty), quiet — felt more than heard:
- **THE WORKERS** (`screens/harbor/people.js#workSounds`, by pose change): `milk-bottles` (the milkman sets his carrier down, the barber takes
  it in), `newspaper-rustle` (the bundles dropped, a paper sold), `trash-can-lid` (the lid off, the can tipped into the truck), `crates-clink`
  (a crate lifted off a truck / set down at the cellar hatch), `broom-sweep` (every ~2.4 s while sweeping), `squeegee` (every ~5 s on the
  platform), `ladder-clank` (a ladder raised against the wall, taken down), `police-whistle` (the beat cop, now + then at the crossing), the
  trucks — `trash-truck-arrive` / `trash-truck-depart` (the dump truck: Group 0's cuts of trash-truck-2), `truck-delivery` (the vans; the
  bootleggers' stake truck at a quarter level — a quiet truck).
- **THE WILDLIFE** (Group 2 — docs/harbor/passes/part-8b1.md#group-2): pigeon-coo, pigeon-flutter, gulls, squirrel-chatter, coyote-yip / -howl, trash-can-lid
  (the raccoon — 8b2: the raccoon + the ducks removed, their slots too), cat-meow, dog-bark.
- **THE HARBOR'S TIMETABLE** (`scene.js#harborClock`, on the city clock — a jump never fires a burst): `ships-bell` every hour (one ring, under the
  music, no dip; not at noon), `steam-whistle` at noon and `ship-horn` for the 7 pm dinner cruise WITH THE MUSIC DIPPED (`sounds.js#ducked`: to
  0.5 / 0.55 over 0.6 s, held 3.5 s, eased back over 5 s — plan.md's "the big moments duck the music"; a few a day), `ship-horn` at 0.7 with no
  dip as Rosie casts off at 10, 2 + 6. Previews: `&force=ships-bell / steam-whistle / dinner-horn` (every 30 s).

## 8b2 — the drain you can hear, the raid + the cabs heard (Oct 25 2026; docs/harbor/passes/part-8b2.md)
- **THE TR-3B's DRAIN, AUDIBLE** (the owner's iPhone: the AUDIO panel read NOT SOUNDING through it): `core/harbor-legend.js#DRAIN_M` — the speed
  + pitch sag to ~0.6 × (never under `floor` 0.58; `audio/music.js#bendMusic` floors any bend at `BEND_FLOOR` 0.55 — iOS Safari mutes a media
  element near half speed), a gentle warped-record WARBLE (a 0.55 Hz wow ± 2 % + a 1.9 Hz flutter ± 0.7 %), a LIGHT duck (0.72 ≈ −3 dB overhead;
  0.55 under the jets' roar, where the lost time is made up by a seek) and a PARTIAL low-pass (2.6 kHz). Slow, deep + wrong, clearly there; it
  spins back up after the jets. Not verified on WebKit here (no Mac) — the owner's AUDIO panel decides.
- **THE BOAT WHISTLE +1 dB**: `steam-whistle` + `ship-horn` 0.16 → 0.18.
- **THE RAID** (`scene.js#raidSounds`, on the city clock — once each): `siren-1920s` far as they come (0.75, panned left) and again as they go,
  `police-car-1920s` (the engines rolling by) + a `car-1920s-pass`, `police-whistle` at the stop (soft); the CLUB's murmur (the speakeasy's bed)
  × the raid's `club` — cut to ~4 % the instant the cars show, creeping back over ~12 s after the lights, up to 1.35 × on a party night.
- **THE CABS**: the cab's engine is the back road's car sound (no slot of its own yet — a `cab-door` slot is a candidate for the owner's next
  hunt list).

## THE TAPE STOP IN WEB AUDIO (Oct 25 2026; City 2.0's TR-3B) — `audio/tape-stop.js`, `core/mp3-slice.js`, `core/tape-math.js`, `audio/music.js#bendMusic`, `audio/diag.js`
**The real cause** (the owner's iPhone, 11:29–11:36 am, 8b2's raised-floor bend already live): looping the TR-3B from the panel the AUDIO panel
read NOT SOUNDING, the song clock still (96.6 → 98.4 s), the probe 0.000, 13 heals (reload (stalled)) all failing; with the TR-3B off + a
reload: sounding, probe 0.224, heals 0. So the music system was healthy and THE BEND ALONE killed the song: **changing an `<audio>` element's
`playbackRate` on iOS Safari stalls / silences it** — at any rate, not only under ½ × (8b2's floor was the wrong theory) — and a reload keeps
the bent rate, so every heal stalled again. DECIDED (plan.md, Oct 25 part 2): **the element's playbackRate is never touched again.**
- **THE TAPE STOP NOW** (`tape-stop.js`): `prepareBend()` as the craft arrives (~3 s before the sag) fetches the song's bytes (the cache has
  them: `prefetch()` fetched the file before it played), walks its MP3 frames (`core/mp3-slice.js`: every file in audio/music is CBR with a
  44-byte ID3 tag + a Xing frame — `tests/mp3-slice.test.mjs` walks all 91) and decodes the frames covering the next ~42 s of the song from
  where the element is into an AudioBuffer (~15 MB, dropped after the run; placed to one frame = 26 ms). The first `bendMusic(rate < 1)`
  starts an AudioBufferSourceNode at the element's exact song time through a gain into the voice's own level (so the ducks + the low-pass
  still apply), crossfades it in over 0.35 s against the element's new `elGain` (the same audio: a linear fade sums flat) and PAUSES the
  element. The source's `playbackRate` is ramped (speed + pitch together, no iOS floor: the drain sags to ~0.5 ×), and two oscillators on
  that param make THE WARBLE in the audio thread (a 0.55 Hz wow ± 2.5 % + a 1.9 Hz flutter ± 0.8 % — `core/harbor-legend.js#tr3bAt` now
  gives `rate` as the BASE and `wow` / `flutter` as depths; `sounds.js#legendSounds` sends a ramp when the base moves > 2 % + every 2 s while
  bent). The song position is the EXACT integral of the rate schedule (`core/tape-math.js`), so `nowPlaying()` / `musicClock()` / the beat
  still read a song clock, slowed. `bendMusic(1)` ramps back to 1; then the element is SEEKED to where the tape got to (+ 0.22 s, its start
  latency), played, and once its clock is SEEN MOVING (nudged once if it landed > 0.12 s off, while still silent) the fade back; the source
  stops. A room-clocked song (`setMusicClocked(true)` — nobody sets it yet; the lobby's synced song is `synced-songs.js`, not an element)
  makes up the lost time instead (`musicCatchUp()`); the title's mood music goes on from where the tape got to — no skip.
- **THE WATCHDOG**: the element's clock not moving within 1 s of play() → a fresh load at the right time (`reloadVoice`, `heals` "tape:
  reload"); still not within 1.5 s more → the fade back happens anyway and the health watch takes over (its reloads work now: the rate is 1).
  A frozen graph, the page hidden, a new context, a new song or the direct path ABORT the bend at once: the element resumes at the tape's
  time, no fade, and no new bend on that run until the rate is asked back to 1. On THE DIRECT PATH nothing is bent (iOS's own pipeline,
  no graph) — the legend's duck is the only dip (and iOS ignores an element's volume: the song simply plays on there).
- **THE PANEL**: the `el` row reads `ON THE TAPE 0.50× (bent) · song 97.3 ▲ · behind 12.1 s · el paused at 96.6 · rate 1` while it carries
  the song and the status stays `sounding`; after it `tape 2 runs, 1 reload`; the events: `tape ready`, `tape on`, `tape nudge`, `tape
  watchdog … loaded again`, `tape off`, `tape aborted (why)`. `RATE n` on the el row means something set the element's rate (nothing does).
- **Proof**: `tests/tape-stop.test.mjs` on a fake AudioContext + element (the element's `playbackRate` setter throws; a stalled element is
  reloaded at the tape's time; back to back + a bend asked mid-release; a clocked song ends on the room's clock; aborts; the direct path;
  a slice too short); `tests/mp3-slice.test.mjs`; e2e-harbor `tape` (Chrome: a whole TR-3B with the music on — the rate setter trapped
  on every media element (0 writes), sounding + the panel's text through the drain, the song clock at ×0.5, the probe hearing the slice,
  the element back with its clock moving after a swallowed play(), a second run back to back, 13 checks); the browser rig without the
  city: `tests/integration/tape-preview.html` (RUN: a compressed drain you can hear). **WebKit**: Playwright's WebKit download stalled
  twice on this machine (224 KB of ~100 MB); not run here — the owner's AUDIO panel decides (the test link in docs/harbor.md).

- **9f — THE TAPE ON THE DRAIN** (the owner: "the audio slowdown effect was lagging"): measured 2 s behind the lights. The sag is now
  the blackout's own curve (`tr3bAt`'s `sag` = `smooth(BLACK.die0 − sput, die0 + dieSpan + 0.9)`), `sounds.js` engages the tape at
  0.998 × just before the first dip and aims each ramp `BEND_AHEAD` (0.6 s) ahead on the envelope at every 1 % step, and the slice's
  prepare retries until the song is playing (a load-forced run's only try used to come before the first tap). Lights 2.67 s → the tape
  2.88 s (was 4.71); e2e `tape`: `9f — THE TAPE ON THE DRAIN` / `ON TIME`.

## 11a-1 — THE HOLIDAY SOUNDS (Oct 26 2026; City 2.0 — docs/harbor/passes/part-11a-1.md)
- **Imported** from ~/Downloads/city-sfx (credits.txt "Weather + party + holiday sounds"; the importer's levels): `witch-cackle` (4.65 s,
  −20.4 LUFS — once as the witch crosses the moon: witch.js), `ghost-bell` (3.1 s, −20.5 LUFS — twice a crossing), `ghost-ship-creak`
  (a 28.5 s loop + its 2.5 s seam, −24.3 LUFS, 22 kHz / 40 kbps, a low-pass at 7 kHz — as the ship materialises), `haunted-wind` (a 24 s
  loop, −24.4 LUFS, 16 kHz / 40 kbps, LP 6 kHz — a BED under Halloween night: sounds.js `keep('haunted-wind', hween…)`, the scene's
  `hween` = the spooky light × the night, under the music like every bed). The `-lossless` originals stay out of the repo (only the
  encoded MP3s land in audio/city/). audio/city/ is 12.84 MB (the test's 13 MB cap holds: the two loops lean like the weather beds).
- **Synthesized** (no hiss in the folder): `cat-hiss` — scripts/build-synth-sfx.py#hiss: a sharp breathy spit, a held 2.4–7.5 kHz hiss with
  a fast flutter, a throaty growl under it (0.95 s, −20.4 LUFS) — the black cat tapped (scene.js HOOK-HIT-D).
- New slots in core/city-sounds.js: PART 11 · THE HOLIDAYS (`haunted-wind`, `cat-hiss`); the witch + the ghost ship's were 8a's empty
  slots, filled now. The trick-or-treaters' treats use the doors' own sounds.

## 11a-2 — THE THANKSGIVING + PARADE SOUNDS (Oct 26 2026; City 2.0 — imported + WIRED, see the end of this section) — `scripts/add-city-sfx.py` CUTS, `core/city-sounds.js`
- **From** ~/Downloads/city-sfx (credits.txt "Thanksgiving + parade sounds"; MD5s match), processed per Grok's brief (cozy, far: across the street
  / two blocks away; a low-pass + a hall, never brighter) — **measured, not listened to**. The lossless originals stay out of the repo; only the
  encoded MP3s land in audio/city/ (**13.93 MB** now; the test's cap 13 → 14.5 MB). `leaves-rake-2.wav` (the indoor foley) was not in the folder.
- **The importer's new recipe keys** (docstring): `af` an ffmpeg filter chain at DECODE (a 5.1 file's own fold, a 78's `adeclick,anlmdn`);
  `deess` (dB, lo, hi) a soft dynamic cut of a band's peaks over its own median; `mixin` {f, at, lu, hp, lp} another recording laid under a
  LOOP, read continuously for the loop + its tail (the seam stays seamless), `lu` against the main one; `verb` (wet, pre-delay, RT60, lp) a simple
  hall — a seeded-noise impulse decaying to −60 dB at RT60, low-passed, pre-delayed, mixed at the dry's RMS. Credits: `CREDIT_BLOCK` holds the
  two Freesound downloads credits.txt lists only as links (leaves-rake.wav, parade-crowd-2.wav, both CC0). A fix: a loop starting within its
  1 s pre-roll + search of the file's start searched a negative window (its start drifted) — it now searches without the pre-roll.
- **Levels: the house's** (loops −24 LUFS, one-shots −20 — the test + every other bed), the brief's quieter beds (−30 LUFS-I) are the **slot
  gains**: the beds 0.05 = 10 dB under the cheer's 0.1, the brief's own bed-to-one-shot gap (≈ −50 LUFS into the bus: the market's / the line's
  family); the band (a −20 LUFS one-shot) 0.032 = the beds' −50; the geese ~4 dB under the cheer (the brief's "−24 since it's ambient").

| slot | kind · gain | source → cut + recipe | measured (the shipped MP3) |
| --- | --- | --- | --- |
| `geese-v` (sky) | once · 0.06 | geese-v.wav (5.2 s Mixkit) → the whole file, fades 1.5 s in / 2 s out, HPF 200, LPF 4 kHz, hall 25 % (30 ms, RT 1.6 s) | 5.22 s · −20.4 LUFS-I (S-max −19.3) · −3.3 dBTP · centroid 1281 Hz · 2–5 kHz 1.6 % / > 5 kHz 0 % · 31 KB |
| `parade-crowd` | loop · 0.05 | parade-crowd.mp3 (31 s Pixabay, kids cheering + clapping) 0.5 → 27.8 s + a 2 s tail (ends 29.8 s: the "Bye!" past 30 s out), HPF 150, de-essed 2.5–6 kHz (≤ 6 dB), LPF 6 kHz, + `mixin` parade-crowd-2.wav (57 s Freesound CC0, a large outdoor reception) from 0.0 s **4.5 LU under**, HPF 150, LPF **3 kHz** (the brief said 5: no word readable), hall 15 % (25 ms, RT 1.0) — ONE loop | loop 27.3 s + 2 · −24.4 LUFS-I · −7.0 dBTP · centroid 1073 Hz · 2–5 kHz 8.5 % · seam (the runtime's sin/cos crossfade simulated): max 50 ms step 4.4 dB vs the body's p95 3.5 / max 6.3, 3 s before vs after −0.1 dB · 172 KB |
| `parade-cheer` | once · 0.1 | parade-cheer.flac (10.9 s Sonniss, 5.1 / 96 kHz in FILM order L C R Ls Rs LFE — channel 6 measured as the −54 dB LFE, so ffmpeg's default fold (FL FR FC LFE BL BR) would have dropped a surround + mixed the LFE in): `af` `pan=mono|0.5 L + 0.707 C + 0.5 R + 0.354 Ls + 0.354 Rs` (= L + 0.707 C, R + 0.707 C, surrounds −3 dB, LFE dropped, then mono), 1.0–9.5 s, 1.5 s fade-out, HPF 120, LPF 6 kHz, hall 20 % | 8.5 s · −20.4 LUFS-I (S-max −19.1) · −6.1 dBTP · centroid 1019 Hz (already dark: 93 % at 400–1500 Hz) · 2–5 kHz 2.9 % · 50 KB |
| `parade-band` | **once** · 0.032 | marching-band-far.mp3 (the US Marine Band, "Washington Post March", Edison 1923, a FLAT 78 transfer: 40 % of its energy rumble < 150 Hz, the hiss 6 dB over the band's mids, dense crackle; held notes in 55–93 % of frames past 20 s) → **2–92 s**, 2 s in / 4 s out; `af` mono, `adeclick` (default) + `anlmdn=s=7` (400–3000 Hz floor −8.9 dB, the music's peaks −2.3, ~⅔ of the crackle impulses left: the trace; `afftdn` didn't engage below `nf=-40`, `adeclick=t=1` ran 81 s per 30 s), HPF 150, the 1.8–4.5 kHz peaks de-essed 6 dB, LPF **3 kHz**, an outdoor hall 30 % (35 ms, RT 1.2) | 90 s · −20.4 LUFS-I (S-max −17.2) · −1.7 dBTP · centroid 1413 Hz · **2–5 kHz 24 %** (52 % at the brief's LPF 3.5 kHz alone — the crackle + hiss, harsh on a phone) · the strains −21…−24 dB, the softer trio from ~72 s −26…−28 · 440 KB |
| `balloon-flap` | loop · 0.05 | balloon-flap.mp3 (79 s Pixabay, a big flag) → 1.6 → 49.6 s + a 3 s tail (inside the brief's 0–72 s, the louder gust from 75 s out; 48 s not 72: size + memory), HPF 120, LPF 7 kHz, hall 12 % | loop 48 s + 3 · −25.2 LUFS-I (gusty: the limiter takes 1.2 dB) · −1.5 dBTP · centroid 744 Hz · 2–5 kHz 2.1 % · seam step 14.1 dB vs the body's p95 9.6 / max 15.8 (the flaps' own), +1.7 dB · 249 KB |
| `leaves-rake` | loop · 0.05 | leaves-rake.wav (21.8 s Freesound CC0) → 2.35 → 20.65 s + a 1 s tail (gap to gap between strokes: the ~1.5 s beat holds across the seam), HPF 150, 2–5 kHz peaks de-harshed 4 dB (57 → 42 %; the accepted broom is 82 %, the squeegee 47–82 %), LPF 7 kHz, a short street hall 15 % (15 ms, RT 0.6) | loop 18.3 s + 1 · −24.3 LUFS-I · −4.0 dBTP · centroid 3963 Hz · > 5 kHz 36 % · seam step 8.6 dB vs the body's p95 6.6 / max 19.3 (the tail is the file's own fade into a gap) · 114 KB |

- **Words** (the 300–3400 Hz band per 0.5 s: the voiced share of 40 ms frames, ONE voice's F0 held within 8 %, the 3–6 Hz syllabic share of
  its envelope — word-like = all three high): the kids' file 0 of 62 windows (its voiced bursts at 1.5 + 16–17 s are one held "yaaay",
  syllabic 0.12–0.26), the murmur 1 of 115 (30.0 s: kept outside the layer), the cheer 0 of 21 (one held "woo" at 6–7 s), the shipped crowd
  0 / 58, the cheer 0 / 17, the band 0 / 180 (instrumental). The geese flag 4 of 10 — honks are voiced at ~4 Hz: a goose, not a word.
- **Skipped:** nothing of what was in the folder — the band was the closest call (a flat 78: see its row; the owner can drop it by putting
  `marching-band-far` in SKIP and re-running). `leaves-rake-2.wav` wasn't there (add it + a CUTS row with a longer hall for its indoor foley).
- **How a caller plays them** (the main session wires them with the parade, the raker + the V — `screens/harbor/sounds.js`): the beds with
  `keep('parade-crowd', k * bm.k, pan, { ramp, linger, fadeIn })` (0 fades it out, freed after `linger` s; `bm.k` = the duck under the music),
  likewise `balloon-flap`, `leaves-rake`; the cheer as a float passes: `play('parade-cheer', { gain, pan })`; THE BAND (a 90 s pass) chained
  while the parade runs: `run('parade-band', k, pan, { chain: true })` (the next pass starts 2.5 s before one ends — a band finishing, the next
  striking up), or one pass with `citySound`; THE V: `run('geese-v', k, panX(x, W), { chain: false })` — its pan follows the V's x each tick
  (ramped), or `const h = citySound('geese-v', { pan: -0.7 })` then, once `h.started()`, `h.set({ pan: 0.7 }, h.dur)` (a ramp: before the
  file has loaded a `set` only changes the start pan).
- **WIRED (the main session, Oct 27 — `screens/harbor/sounds.js#tick`, its inputs from `scene.js`):** the scene hands `parade: { units: [{ kind,
  i, x }] }` (the units on screen, x 0..1 of the width — `scene.js#paraSound`, the same pure clock as the marchers) + `raker: { pan }` (the
  groundskeeper standing still with his rake — `people.positions()`):
  - `parade-crowd` — a bed at 1 while any unit is on screen, faded in over 3 s, out over 2.5 s (freed 10 s later);
  - `parade-cheer` — ONCE per balloon as its middle crosses the screen's middle (x 0.42–0.6), panned to it (±0.6), gain 0.7–1;
  - `parade-band` — `run(…, { chain: true })` while a BAND unit is on screen, panned to the nearest band (±0.85): the 90 s pass chained;
  - `balloon-flap` — a bed while a balloon is up, louder near the middle (1 → 0.4 at the edges), panned to the nearest balloon;
  - `leaves-rake` — a bed while the raker stands raking, panned to him;
  - `geese-v` — one take a V (`chain: false`), its pan following the V's x (with the older `geese` flyover under it).


## 9g — THE UFO's REAL SOUNDS, THE IMPLOSION's ONE CRASH, THE RIVET BURSTS (Oct 28 2026; City 2.0 — docs/harbor/passes/9g.md) — `scripts/add-city-sfx.py` CUTS, `core/city-sounds.js`
- **From** ~/Downloads/city-sfx (credits.txt "UFO sounds" + "UFO sounds - Ben's extra picks"; the originals untouched), processed per
  Grok's brief — **MEASURED, NOT LISTENED TO** (by anyone). Before: `ufo-hum` at 0.06 ≈ −56 dB into the bus in a phone's band (its energy
  under 150 Hz — inaudible on a phone) + one riser.
- **The importer's new recipe keys** (docstring): `gainpre` dB at the decode (ufo-beam-3's +2.5 dBTP overs lowered first), `speed` (a
  one-shot faster, the pitch with it), `bend` (r0, r1: the rate glided across the take — the lift RISES), `air` (dB, lo, hi: band noise on
  the take's own envelope — an airy top), `chorus` (ms, depth, Hz, mix: a slight warble — a beam, not a force field). A file laid inside
  another take (a `seq` / `mixin` piece) now keeps its own slots + credit in sources.json (footsteps-cobble).
- **The takes** (mono; the phone band 300 Hz–8 kHz vs the full level; × the slot gain = into the bus, phone band):

  | slot | file (source, cut) | kind | KB | into the bus (phone) |
  | --- | --- | --- | --- | --- |
  | `ufo-hum` A (default) | ufo-hum-2.mp3 (the hover engine, loop 5.02 → 40.1 s, a 0.2 s seam, +3 dB @ 1.2 kHz) | loop 35.1 s | 277 | −41 dB |
  | `ufo-hum` B (`&hum=b`) | ufo-hum-3.mp3 (BlueZone's 1 Hz throb, loop 2.5 → 31.5 s, harmonics made (`sat`), low-passed + a distance hall) | loop 27 s | 227 | −43 dB |
  | `ufo-hum-up` / `-down` | hum-2's own start-up (0–5.2 s) / shut-down (41–49 s) | once | 41 / 63 | −41 / −44 dB |
  | `ufo-beam-on` / `-idle` / `-off` | ufo-beam-3 (activation 0–4.2 s · the idle LOOPED 5.5 → 30.5 s · the stop 31.6–36 s), high-passed 140 Hz, harmonics, a 4.6 Hz warble | once / loop 25 s / once | 34 / 208 / 35 | −43 / −45 / −43 dB |
  | `ufo-lift` | ufo-lift-2 (the 5.95 s riser bent 1.0 → 1.25 ×, an airy layer, a 0.3 s fade-out) | once 5.3 s | 42 | −42 dB |
  | `ufo-depart` A (default) | ufo-depart.mp3 (the falling flyby 0.8–4.8 s, 12 % faster) | once 3.6 s | 29 | −36 dB |
  | `ufo-depart` B (`&depart=b`) | ufo-depart-2.mp3 (the fast pass-by 0–3.2 s, high-passed + harmonics) | once 3.2 s | 26 | −41 dB |
  | `crowd-flee` | crowd-flee.mp3 2.0–14.0 s + footsteps-cobble 15 dB under (a `seq`), low-passed 3.8 kHz | once 12 s | 83 | −42 dB |

  `&depart=layered` plays A + B together (B at 0.75). The whole new set ≈ 1.1 MB (24 kHz decode, 56–64 kbps). Not imported: ufo-beam-2,
  ufo-lift (the brief's "ignore"). The Oct 24 ufo-hum / ufo-beam takes stay registered (the old riser no longer called).
- **The tower:** `tower-siren` 0.07 → 0.16 (−37 dB, phone band) and the music ducked under it; `tower-horn` C = **tower-horn-3.mp3**
  synthesized (`scripts/build-synth-sfx.py#horn`: two horns a fifth apart ~154 + 231 Hz, each a detuned saw + square pair, the air
  horn's bend up at the start + a sag at the valve, a tanh drive, formants at ~550 + 1300 Hz, an air-noise breath, a 2.2 s room + distance
  IR; three blasts short-short-long, 7.4 s) — a BACKUP take (weight 0) like B (warning-horn): only `&horn=` plays them;
  `implosion-rumble` re-cut as ONE crash (the collapse 0–6.3 s + the file's own settling from 15.5 s, 9 dB under, crossfaded) — one
  onset at 0.5–1 s, smooth to silence by 12.7 s; `rivet-gun` a ONE-SHOT now — rivet-gun-1…4.mp3 (1.8–4.2 s, cut at the recording's own
  gaps) at 0.075 (+2.9 dB over the hammering bed in the phone band).
- **The picks:** `core/city-sounds.js#SOUND_PICKS` + `pickTakes(kind, v)` (by the take's source — the registry's order follows the
  imports); `cityLoop(slot, { take })` (a loop's take; by default the first that isn't a BACKUP); the panel's inputs `horn` / `hum` /
  `depart` (core/harbor-remote.js: validated server-side too).

## PROM — THE LEGENDARIES' SOUNDS LOADED AHEAD, THE IMPLOSION's NEW TIMELINE, THE PICKS' DEFAULTS (Oct 28 2026; City 2.0 — docs/harbor/passes/prom.md)
- **Loaded ahead** (the owner: the UFO's first spin-up was silent after opening the link): `screens/harbor/sounds.js#prefetchLegend` +
  `legendReady`, `audio/city-sound.js#cityPrefetch(slot, i, { hold })` (PINNED out of the one-shots' LRU for the legendary's span) +
  `cityReady(slot, i)`; scene.js#legendSoundsWarm asks every ½ s for a held link, tonight's due / running legendary + the implosion's
  countdown. A link's start waits up to 4 s more for the key takes, a JUST ME preview up to 3 s; the hover's spin-up is placed on the run's
  own clock (`sync: { mark: 'start' }`) — a late file joins part-way, never late over the loop.
- **The implosion**: the siren's slot 0.16 → 0.176 (+10 %); the timeline (core/harbor-tower.js#IMPLODE): the siren → 10 s after it ends
  HORN B's three blasts → 5 s after the last one the charges + the ONE crash (−42.6 / −22.1 −15.9 −9.7 / 0 s).
- **The picks' defaults** (`core/city-sounds.js#SOUND_PICKS.def`): HORN **B** (warning-horn — the owner's pick), HUM **A** (ufo-hum-2),
  DEPART **LAYERED** (Claude's picks — "your pick, they both sound good"); every other take stays a panel alternate.

## NIGHT-A2 — A TRUSTED GRID ALWAYS PUNCHES + A SAVED LEAD PER OUTPUT (Oct 29 2026; City 2.0 — docs/harbor/passes/night-a2.md)
The owner's iPhone (party mode, the SPEAKER): c2-party4 punched only after 24 kicks confirmed the lead; on a fresh load c2-party9 read
`lead +120 → +120 (settling · resume · 0 kicks)` / `lights BREATHE · settling after resume (bar 21)` — no pulse for the whole song.
- **THE RULE** (`core/harbor-beat.js#stepSafety`, `safePunch`): a TRUSTED GRID ALWAYS PUNCHES — from the song's first bar at HALF
  strength (`SAFE.half` 0.5, eased in over ~0.4 s) on the best lead it has (the saved one, else the platform default), FULL once the
  kicks confirm the lead (or within `SAFE.hold` 8 bars of it). A settle after a return, a song whose kicks are off its beats, a deaf
  listener, a breakdown past the hold: HALF on the grid, never the breath. The kicks only refine the lead + lift it to full. THE BREATH
  stays for 'tempo' (an untrusted grid) + the direct element; no song = the calm punch. The readout: `lights PUNCH HALF 50 % · half · the
  saved lead · confirming (3/6 kicks, bar 2) · 1st punch bar 0` → `lights PUNCH FULL · lead confirmed · 14 kicks · 1st punch bar 0, full bar 5`.
- **THE SAVED LEAD** (`leadToSave`): never a CLAMPED value (his +156 ms was saved as +120 = LEAD_MAX, so every later visit started 120 ms off);
  never one learned after a return / a restart / a context rebuild / a route change / a skew (`leadFast(c, why)` marks `c.visit` for
  any why but `'start'` — the page's first unlock: `beat.js` names its first context resume `'start'`); `pageshow` re-settles only when
  the page came back from the back/forward cache (it fires on every load: before, every fresh load began "settling").
- **PER OUTPUT** (`outputKey(outputLatency, baseLatency)`: `bt` ≥ 90 ms · `wired` (the speaker, wired headphones) · `unknown` — the browser
  reports nothing: iOS Safari), stored as `na:beatlead` `{ v: 2, out: { bt | wired | unknown: { el, buf, at } }, last }` (`readLeads`): a
  Bluetooth visit never poisons the speaker's value; a change of bucket loads that output's value at once (a named output learns + saves
  its own; `unknown` keeps the confirm-before-save rule). The old `na:beatcal` migrates once, only from INSIDE the range (his clamped +120:
  dropped). `sync` readout line: `… · wired` / `… · unknown · not saved (after resume)`.
- **SEND REPORT + /admin** (`beat.js#beatReport`, scene.js#reportText): `beat:` the lights' rule + the clock, `beat lead:` the output, the
  lead's state, saveable or why not, the kicks heard, the saved leads per output, then the last 40 events (load, song, settle + why, locked,
  saved, route) with the lead at each.
- **THE KICK TABLE** (`tests/integration/kick-table.mjs "<browser>" [--deck party|evening…] [--songs id,id]`): the listener's exact chain
  (decode → the 150 Hz biquad → a 1024-sample RMS at 60 fps → onsetStep) + the lead learner replayed on every song of a deck — the table
  in docs/harbor/passes/night-a2.md.

## THE STREET PARTY's CROWD (NIGHT-B, Oct 29 2026; City 2.0 — docs/harbor/passes/night-b.md)
The owner's party-crowd folder (`~/Downloads/Grok/city-sfx/party-crowd/`: 29 files + `credits.txt` + Grok's brief — READ, never edited) →
the files used COPIED into `~/Downloads/city-sfx-party/` under their slot names (+ a `credits.txt` naming each copy's original), imported
with `add-city-sfx.py --src ~/Downloads/city-sfx-party` (its CUTS rows: `party-*`). **1.1 MB** shipped (the budget ≤ 1.5 MB):
- **THE BEDS** (loops, 16 kHz, 40 kbps, high-passed 110 Hz, low-passed 2.8 kHz — across the street, no word readable): `party-walla` =
  walla-5 (a real outdoor patio party, CC0) 92–154 s (steady −37…−46 dB; its German phrase at ~1:07 left out; seam −0.4 dB);
  `party-walla-b` = walla-1 (Sonniss, an exterior crowd of adults) 3–61 s (seam +2.9 dB — crossfaded).
- **THE ONE-SHOTS**: `party-laugh` ×6 (laugh-1, -2, -3, -4, -6, laugh-8's 0–3.6 s; 4 kHz), `party-cheer` ×2 (cheer-1; cheer-2's crescendo
  16–20.5 s; 4 kHz), `party-clink` ×3 (clink-1, -3, -2; bright, 7 kHz), `party-group` ×2 (group-1 4–11 s, group-2 2–10 s — the closer
  talk; 3 kHz so no word reads). Levelled like every city sound (one-shots −20 LUFS, loops −24) × the slot's gain (0.035–0.06).
- **NOT USED** (and why): walla-2 (indoors, possible music — unchecked), walla-3 (the loudest, possible clear English), walla-4 (city rumble,
  maybe a car), walla-6 (through a wall — an "inside" sound, the street can't hear it), walla-7 (UK English, Christmas talk possible),
  laugh-5 (very quiet, −36 LUFS), laugh-7 (9 s, a near duplicate of the kept laughs), laugh-9 (clapping, theatrical), laugh-10 (performed
  for a play), cheer-3 (a close whistle), cheer-4 ("woo-hoo": modern), cheer-5 (a spoken "Cheers!": one clear word), cheer-6 (a stage
  show's applause), clink-4 (18 s of shot glasses — three clinks were enough). **Not listen-checked here** (no speakers on this machine —
  the cuts were chosen by their loudness envelopes): the group takes are the ones to judge by ear first.
- **THE MIX** (`screens/harbor/people.js#crowdSounds` → `sounds.js#crowd`): the WALLA under the pockets — its level the mingling heads
  drawn (÷ 16) × the party's curve, panned to their centre, the second bed at the peak only where the tier table gives `crowdBeds` 2;
  ducked under the music like every bed. ONE-SHOTS from the pockets' own places (pan by x, louder nearer): a laugh every ~4–12 s (6–14 s
  in a break), clinks in clusters of 1–3 from a drinker (~8–22 s), the nearest pocket's group take (~26–48 s, not in a break); never
  more at once than `crowdVoices` (1 / 3 / 5). THE CHEERS RISE as a break starts (three, staggered over ~2.5 s, the loudest in the middle).
  Muted / locked audio = silent; an empty slot = silent (nothing breaks). ☰ → CREDITS: a SOUND EFFECTS section (15 lines from credits.txt).

## THE PARTY SONG IN SYNC (NIGHT-C, Oct 30 2026; City 2.0 — docs/harbor/passes/night-c.md)
The owner (Oct 30 12:36 am): "the same party song on every phone". On a PARTY NIGHT (+ the preview panel's PARTY and `&force=dance`) the
City 2.0 PARTY deck plays as ONE timeline every phone computes the same way, on the SERVER clock:
- **The timeline** (`core/party-deck.js`, PURE): seeded shuffle CYCLES of the deck (every song once a cycle, never the same song twice in a
  row), back to back with the music's crossfade (`core/playlist.js#XF_MS`), from an ANCHOR — a party night's 8 pm (THE CITY TIMETABLE's
  `party.songs.from`, seeded by the evening), the force moment for `&force=dance`, a fixed epoch for the panel's PARTY. A cycle's length is
  the same for every cycle, so the song at any moment is found in O(n). The scene hands it to the audio through the city clock
  (`cityClock().partyLine()` + `partyDeck()` — `core/harbor-streetparty.js#partyTimeline`), the SAME timeline its dance breaks are planned
  on: one song = one break, its start the song's start.
- **The live city runs on the server clock** (`core/sky.js#setRealNow(serverNow)` — the saved offset while parked: no socket is opened for
  it, THE PARKED DATABASE holds), so the music and the breaks agree on every phone whatever its own clock says.
- **Two players, one song** (`audio/party-music.js`): this phone's own player starts the timeline's song AT ITS PLACE (app.js's mood
  provider asks `partyCue()` — so the music is right at once, on THE DIRECT PATH, with a locked context); the SYNCED player
  (`audio/synced-songs.js`: decoded buffers, sample-accurate on the server clock — the lobby's) takes over: it rides along while this
  phone's own player is within 0.12 s of the timeline (it takes the NEXT song), else it joins (0.35 s on the same song, the lobby's 1.8 s
  crossfade from another). A late joiner lands mid-song in place. Its window is a block of 25 cycles (a party night is ~12) — it never
  restarts mid-evening.
- **When it yields** (the song goes back to this phone's own player at its place): a DEAD GRAPH (iOS after the lock screen — the context
  frozen / closed: THE DIRECT PATH plays it); a LEGENDARY's TAPE STOP (`cityClock().musicHold()` — the TR-3B due or heard: the tape bends
  the song element; its release lands where the song WOULD be: `setMusicClocked`); a sped-up preview (`&speed`). The city's dips + its
  low-pass reach the synced voices (`music.js#onMusicDuck`, `musicInput()` — the same low-pass every song voice plugs into).
- **The beat** follows the synced song like the lobby's (`beat.js`: lobby || party = a decoded buffer — its own lead, never the direct path).
- `synced-songs.js` fix (the lobby's too): a song queued to start LATER (decoded ahead of its crossfade) no longer reports as sounding — its
  gain read 1 before its first scheduled value, so `now()` named the wrong song and the beat followed it.
- The &debug=1 readout's party line: `party NIGHT · c2-party4 1:23 / 4:53 · SYNCED (server clock) · next in 3:30 · break CONGA (this song)`
  — SYNCED = the synced player; `riding (own player, on the clock)`; `own player (not synced yet)` = decoding / a locked context / the
  direct path / a legendary's hold; `music off — the clock runs` (the breaks still follow the timeline).
- TOOLS → NO PARTY SYNC (`&force=no-party-sync`): each phone its own party songs again (A/B) — the breaks keep the deck.
- Checks: `tests/party-deck.test.mjs`; e2e `partysync` (each phone within ~100 ms of the clock, the break on the heard song, three live
  phones + a late joiner within ~50 ms of each other).
