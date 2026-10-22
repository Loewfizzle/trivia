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
  (regression test: `tests/integration/audio-resume.mjs`). A missing file marks the track missing and
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
**THE NEON BUZZ** (`ambience.js#neonBuzz({ on, dur, level })`, City 2.0 only — docs/harbor.md cleanup pass 1): the main sign's
sputters at the dusk warm-up and the morning fade, one per flicker — a tube striking: a crisp tick (a 25–75 ms band-passed click + a
sine zap 3.6 → 0.9 kHz in 18 ms) then the gas's buzz (120 Hz saw + 240 square + 60 saw through a 1.4 kHz bandpass and a 220 Hz
highpass, a faint 5 kHz hiss, the level stepping unsteadily, ≤ 1.4 s) for as long as the plan holds the flash; dropping out: a
softer tick. On the SFX bus (the Effects slider, Mute); peaks ~0.03 — under the music, never relied on. **Since NEON PASS 2 it is
the fallback** — City 2.0 plays the recordings below; the synthesized buzz plays only when a file can't load.

**THE RECORDED NEON** (NEON PASS 2, Oct 21 2026; retuned in NEON PASS 3, Oct 22, after the owner listened on her iPhone — City 2.0
only; `ambience.js#neonFlicker / neonDropout / neonCatch / neonHumFade / neonPreload`, driven by `title.js#applyNeon`, `#neonOnSound`,
`#scheduleFlicker` and `#buzz`): real neon in `audio/sfx/` (mono 44.1 kHz 16-bit WAV, ~770 KB in all, nothing fetched until City 2.0 is
up and audio unlocks). **When it sounds (NEON PASS 3):** the golden-hour WARM-UP is SILENT (its sputters were annoying), the dawn's
stutters too — only the very last tube's dropout at dawn sounds, softly (0.55); a RANDOM FLICKER of the lit sign (every 20–40 s,
`scheduleFlicker`) plays a flicker (0.8); THE CATCH plays the power-on and the hum comes up with it and FADES OUT smoothly over the
10 s after the sign is fully on (`neonHumFade`: an equal-power curve, then it stops — no hum all night); TAPPING THE SIGN: the
dropout when the tapped letter goes dark, the power-on + the same fading hum when it lights (0.75; none under Reduced effects):
| file | what | when | level |
| --- | --- | --- | --- |
| `neon-flicker-1…4.wav` (0.6–0.8 s) | a tube striking | the lit sign's rare random flicker — one at random, never the same twice running, ±3 % pitch | −20 LUFS |
| `neon-dropout.wav` (0.75 s) | a tube's buzz cutting out | the last letter dying at dawn (softly); a tapped letter going dark | −20 LUFS |
| `neon-power-on.wav` (2.1 s) | the strike settling into the hum | THE CATCH (all four letters lock on); a tapped letter re-igniting | −20 LUFS |
| `neon-hum-loop.wav` (3.0 s) | the steady mains hum | after a power-on only: up with it, held until the sign is fully on (1.5 s), then faded out over 10 s; cut when the page hides | −24 LUFS |
Cut + levelled by `scripts/build-neon-sfx.py` (BS.1770 K-weighted loudness, a soft peak limiter at −1 dBFS; the hum's loop length
nudged to where its wave lines up, then crossfaded in phase — the level holds through the seam ±0.4 dB). Sources (Freesound, all
**CC0**): 500693 *bolkmar* "neon tube light flickering" (flickers 1–2), 202612 *ludwigmueller* "fxlm neon lights flicker bathroom"
(3–4), 351430 *kinoton* "neon lamp switch on hum" (power-on), 125064 *everydaysounds* "faulty fluorescent light starter hum"
(dropout + hum). On the SFX bus at the files' own level × `NEON_GAIN` (1 — trim them all by ear there).

**Fireworks** (`ambience.js#fireworkBurst({ delay, level })`): the finale's sound on the SFX bus — a soft low thump (a sine
dropping 96 → 42 Hz with a little filtered body) and 10–18 tiny bright crackles over the next 1.5 s, panned about; quiet.

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
