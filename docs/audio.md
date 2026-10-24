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
  grid (bars on the real downbeats, a new song re-locks at once, the bar count never runs backwards); the pulse HALF-TIME (beats 1 +
  3, the downbeat hardest, a 50 ms attack, a 0.24 s decay); a kick heard on a strong beat sets how hard the city punches (a quiet
  passage or a breakdown with no kick calms it), a kick between them is a small hit of its own; a song with no grid punches on
  every real kick; no music: a calm 120 bpm of its own. Checked on real songs in headless Chrome (overclock, late2, slip5): locked
  to the grid, the analyser live 97–100 %, 63–78 % of the kicks it hears within ±0.15 beat of the grid's beats (chance: ~30 %).
  The `&debug=1` readout shows `beat grid 130.0 · bar 12 · 3/4 · kick 0.86` on a party night. NEON PASS 6: when it's calm it says
  why (`beatWhy()`: `beat calm — music off` / `muted` / `tap for sound` / `classic music` / `songs loading` / `no song`), and
  `· kick unheard` when a song is followed but the analyser hears nothing. **iOS**: an `<audio>` element's `currentTime` may move in
  coarse steps — `beatSource` carries the position forward on the frame clock between its steps (`dequantize`), so the clock never
  jerks with them. The racing lights take only the TEMPO from it (their speed), never the phase (docs/harbor.md#neon-pass-6).
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
  | `kicks` | no trusted grid, the listener hears the music | every real kick |
  | `tempo` | no trusted grid, nothing heard (the direct element, a deaf analyser) | a gentle steady 0.6 at the song's tempo, on its loose grid's phase |
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
  a full-screen flash; the troughs stay put). **The default: `PULSE_DEFAULT = 1.3`** (7a + 30 %) — the owner's pick locks in there.
  Live: THE PREVIEW PANEL → LIGHTS → PULSE STRENGTH (JUST ME live, EVERYONE via SEND; `core/harbor-remote.js` `pulse`, validated by
  `/api/admin` too), or `&pulse=180` on a link.
- **Tests:** `tests/harbor.test.mjs` "8a — PULSE STRENGTH" (parse, clamp, the knee, the remote's validation); e2e-harbor `music` §10 (a
  party night: the plain return; WebKit's dropped rAF with no hidden event — "running", no frame — restarted; no event at all — the
  watchdog; a `pageshow` only; the punch swinging after each; the AUDIO panel's city row; 50 % vs 250 % live) + `panel` (the slider).

## THE CITY SOUNDS (PART 8a, Oct 23 2026; City 2.0's title) — `core/city-sounds.js`, `audio/city-sound.js`, `screens/harbor/sounds.js`, `scripts/add-city-sfx.py`
ONE registry of every sound the city will ever make (the owner's CITY SOUNDS hunt list, docs/harbor/plan.md), each a named SLOT; the first
recordings imported into theirs; every event that exists today calls its slot; an EMPTY slot is simply silent.
- **The slots** (`core/city-sounds.js#SLOTS`, PURE): `{ id (kebab-case, stable), part, kind: 'loop' | 'once', gain (its mix level), what, by (what calls
  it today) }` — 65 slots. A one-shot may hold several TAKES (one slot, one picked at random, weighted, never the same twice running — `pickTake`);
  the alternative (a slot per take) would make every caller pick, and a fourth car would mean code changes. FILLED = it has takes in the GENERATED
  `core/city-sounds-files.js` (no network probe); `checkSlots()` guards ids / parts / kinds / gains / the takes' shape.
  | part | slots (**filled**) |
  | --- | --- |
  | 7 · the speakeasy + the raid | club-murmur-calm, club-murmur-party, door-heavy, door-knock, cat-meow, tv-murmur, police-car-1920s, siren-1920s |
  | 8 · the promenade + the city schedule | **water-lapping**, **city-hum-day**, **city-hum-night**, traffic-far, **car-1920s-pass** (4 takes), bus-brake-hiss, bus-idle, bus-pull-away, ships-bell, steam-whistle, ship-horn, **gulls** (4 takes), dog-bark, market-murmur, milk-bottles, **truck-delivery**, trash-truck, flag-flap, boat-putter |
  | 9 · seasons + weather | birdsong-morning, crickets-night, wind-leaves, wind-winter, snow-hush, foghorn, rain-pavement, rain-water |
  | 9 · the construction tower | tower-siren, tower-horn, implosion-charges, implosion-rumble, hammering, crane |
  | 10 · party nights + fireworks | firework-launch, firework-burst, firework-burst-far, firework-crackle, crowd-cheer, party-yacht-music, helicopter-landing |
  | 6b + the sky | helicopter, airliner-far, prop-plane, jet-flyby, balloon-burner, geese, drone-swarm, ufo-hum, ufo-beam, tr3b-drone, tr3b-crackle, tr3b-power-down, witch-cackle, sleigh-bells |
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
- **THE CARS — wired in 8a** (`screens/harbor/roadlight.js`: a pass on the implied road plays a take as it starts; the headlights peak at the take's `peak`). **The API:** `harbor().sounds.play('car-1920s-pass', { pan, gain })` (in scene.js: `snd.play(…)`; anywhere:
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
- **Size:** +144.5 MB in git (the repo's music was 97 MB) — see the owner's decision in the Oct 23 handoff (docs/harbor.md#m).
