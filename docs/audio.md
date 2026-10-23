# Audio + loading

Audio engine, music system, playlists; loading, PWA, previews, Lighthouse.

## Audio
- `installAudio()` (engine) + `installSettingsPanel()` run at boot. The AudioContext is created/resumed on the first
  pointer/key event (iOS requires a gesture). `navigator.audioSession.type = 'ambient'` (iOS 17+).
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
dropout when the tapped letter goes dark, the power-on + the same fading hum when it lights (0.75; none under Reduced effects):
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
| power-on | 1 → **0.5 (−6 dB)** | 0.35 (−9 dBFS) | the catch: −20.1 LUFS, peak −1 dBFS → **−26.3 LUFS, peak −9.5 dBFS**; a tap (0.75) −28.7 |
| dropout | 1 → **0.5 (−6 dB)** | 0.35 | a tap (0.75): −22.5 → **−28.5 LUFS**; dawn (0.55) −25.2 → **−31.2** |
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
