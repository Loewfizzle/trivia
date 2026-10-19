# The title screen (NEON SPEAKEASY)

Deep-dive for the title screen: the opening sequence, the district scene, the logo, the menu.

## The title screen (NEON SPEAKEASY)
NEON SPEAKEASY is the bar behind an unmarked door in a neon district at night; every game is a room inside. The title is
the street outside: the district, the sign over the door.
- **Sequence** (`title.js`): FIRST VISIT on a device (`localStorage nd:entered`): the dark district + rain + TAP TO ENTER (the tap
  unlocks audio — iPhone needs it — and starts menu.mp3 through the normal music system) → POWER-ON: windows light up in a
  wave from the street up (ease-out, ≈1.6 s), billboards boot, the haze takes the colour, a low swell (`ambience.js#cityPowerOn`)
  → the SIGN: each tube letter flickers on with crackles + a mains hum, then holds → the menu eases in (staggered). ≈3.4 s.
  Every later visit plays the same full boot without the gate; stepping back from the name / profile screen gets a quick
  ≈1.2 s re-light (`sessionStorage nd:back`, set by setup.js). The boot screen never takes taps (`#boot { pointer-events: none }`).
  A tap anywhere skips. REDUCED EFFECTS (settings, now global: `settings.reducedFx`, also PRISM DROP) or prefers-reduced-motion:
  a 0.7 s fade, no drift / rain motion / vehicles / showcase drift. Every ~20–40 s one letter gives a tiny flicker.
- **Scene** (`district/scene.js`, Canvas 2D like PULSE): sky + 4 skyline layers far→near (each pre-rendered DARK + LIT, the
  lit one with a baked bloom), haze at each layer's feet, beacons, two searchlights, flying-vehicle light trails, holographic
  billboards cycling the games' own art (one per side per near layer), the wet street with the whole city reflected and
  rippling, light streaks under the billboards and the sign, puddle ripples, two rain layers, a vignette. Once fully on, each
  layer + its haze and the street + its reflection are BAKED into one image each (~35 drawImage calls a frame); every
  gradient is a cached sprite. Parallax: a slow drift + device tilt (deviceorientation, never asks for permission — iOS just
  doesn't send it) + the mouse on desktop. Tiers 2/1/0 (DPR 2/1.5/1, rain layers, shimmer, vehicles, ripples) step down when
  the p75 frame > 19.5 ms; rendering stops while the tab is hidden; `destroy()` zeroes every canvas when the title leaves
  (the scene element lives on <body>, behind #stage). Measured: 60 fps at every tier at 4× CPU (GPU); 6 title↔setup
  cycles leave one scene and no heap growth.
- **Logo** (`ui/logo.js`): "NEON" as four bent glass tubes (glass, wide + near glow, body, white-hot core, a hairline highlight,
  electrode caps, mounting clips), "SPEAKEASY" in Orbitron with wide tracking, framed by Art Deco rules ending in a diamond (`.nd-word::before/::after`, an inline SVG), the tagline `TAGLINE`. The same markup is used lit
  in the lobby header (small), unlit in the boot screen, and by `brand.html` for the icons (the tube N) and the link preview.
- **THE BOARD** (the third door, under JOIN, gold light): the global leaderboards (`docs/profiles.md`); "Welcome back, NAME" carries
  the rank emblem and opens the membership card; each preview sheet shows the game's top 3 and your rank.
- **Menu:** HOST GAME (the one glowing element: glass with a slow light sheen; with a saved profile it opens a room in one tap,
  otherwise the name/avatar screen first), JOIN (one real input under four boxes: native keyboard, auto-caps, paste of a code
  or a whole invite link, auto-join on the 4th letter, a note when I/O are typed, inline errors for no room / full / removed),
  `?room=` pre-fills it (› glows), REJOIN [CODE] when a saved room couldn't be reached on boot (`state.rejoin`), "Welcome back,
  NAME" + EDIT (setup in `edit` mode: profile only, back to the title), a drifting showcase of the games (tap → a preview sheet
  with art, blurb, player count from MIN_PLAYERS, length from `estimateMinutes(DEFAULT_SETTINGS)`, HOW TO PLAY). No version on the title (it lives in the settings sheet footer).
- Wide screens: the skyline sits lower and wider, the sign larger, the showcase shows every game; the menu stays a 400 px column.


## LIVING CITY (Oct 2026): time of day, seasons, holidays, sky events
- **The sky** (`js/core/sky.js`, pure, tested in `tests/sky.test.mjs`): the player's own time zone (Intl) → a representative
  lat/lon (`ZONES`, else the UTC offset + the region; never a location prompt) → the real sun (NOAA algorithm; sunrise/sunset
  within a few minutes) and moon (phase + position). `look(ms, tz, { alwaysNight })` returns time-of-day weights driven by
  the sun's elevation (`night`, `late` (00:30–05:00), `dawn` (mornings), `day`, `golden` (evenings)), the season (blended at
  the edges, flipped in the south), the holiday with its build-up (`holidayOf`: Halloween, Thanksgiving, Christmas (all of
  December builds up), New Year's Eve, Valentine's, St. Patrick's, Easter (computed), the Fourth), meteor showers on their
  peaks (±1 day) and a rare single star on any clear night, aurora on about one night in five, any time of year (seeded by date: the same for everyone),
  rainy hours (seeded per 4-hour block), snow in winter (and always on the Christmas nights), and the NYE countdown / finale
  (the last 10 minutes before the local midnight, the first 5 after).
- **The palette** (`district/palette.js`): a full colour set per look (night, late, dawn, a hazy matinee day, golden hour),
  blended by the weights, then tinted by the season and the holiday. **The effects** (`district/fx.js`): the sun's disc and
  glow (low sun only), the moon at its phase with a halo (kept clear of the sign), aurora curtains low over the skyline,
  shooting stars, fireworks (NYE, the Fourth; a finale after midnight), the sleigh across the moon (very rare, Christmas
  nights), Christmas string lights (more as December goes on), glowing window glyphs (pumpkins, hearts, eggs), the neon
  pumpkin / shamrock rooftop signs, snow, spring petals, autumn leaves, summer fireflies, Halloween bats (a small flock every
  2.5–5 min). Particle caps per tier; Reduced effects stops what moves (the colours stay).
- **The scene** (`district/scene.js`) asks for the look every 2.5 s; when its key changes it repaints the sky and rebuilds
  the reflection; each skyline layer's composite (the hour's tint on the silhouettes, the sun-side rim light, frosted roofs,
  the windows lit right now — they switch on/off one by one with the hour — the trims after dark) is cached by that key.
- **The sign** (`title.js#watchSky`): lit after dusk, dark glass by day; it flickers off at dawn and comes back tube by tube
  at dusk. On a holiday's full days the tubes change colour per letter (`.sg-<holiday>` in title.css: Halloween orange/violet,
  Christmas red/green, NYE gold, Valentine's rose, St. Patrick's green, Easter pastels, Thanksgiving amber, the Fourth red/white/blue)
  and the scene's sign light follows (`scene.set({ signCol })`). Halloween: an orb web with dew beads in the corner and a spider
  that drops from the E on its silk and climbs back; Christmas: a velvet Santa hat on the N; NYE: the countdown in the tagline.
- **Rare flyers** (fx.js): bat flocks in a random neon (sometimes mixed); a witch on her broom with a spark trail (Halloween
  nights, every 6–11 min); Santa's sleigh with Rudolph's nose and a gold trail above the sign (Christmas nights, every 7–17 min).
  Force them in a preview: `&force=bats,witch,sleigh`.
- **ALWAYS NIGHT** (settings, off by default): the classic night look all day; seasons, holidays, the moon and sky events stay.
- **Where:** the title; the menus' backdrop and THE BOARD's windows show the still the title leaves behind (same hour).
- **Preview switch** (any page, test only): `?when=2026-10-31T21:30&tz=America/New_York` starts the clock at that local
  time; `&force=bats,witch,meteor,aurora,sleigh,fireworks` makes the rare moments happen now.

## The title, Oct 2026 redesign: the city is the showcase
- **No game row.** Under the tagline, one line: `N PARTY GAMES · ONE PHONE EACH` (N = the playable games in `GAMES`, so it
  updates itself). The city's billboards (bigger now) cycle the game art; **tapping one opens that game's HOW TO PLAY**.
- **The dock:** HOST and JOIN as clear glass pills (`.nd-host`, `.nd-joinbtn`); JOIN turns the dock into the four code boxes
  (`.nd-door.is-join`; ‹ goes back). An invite link opens it with the code filled in (› ready, no keyboard popping up).
  Under it the quiet links: THE BOARD, YOUR CARD (emblem + step), GAMES (a sheet of every game → its preview sheet).
- **At rest:** after 15 s without a touch the menu, the tagline, the explainer and the corner buttons fade out (1.8 s),
  leaving the sign and the living city. Any touch brings them back and presses nothing (the waking tap is swallowed); on
  desktop moving the mouse wakes it. Not while a sheet is open, the code boxes are open or a room is being made. Local test
  runs (`?emu`) only fade when asked (`&idle=1` or `__district.idle()`).
- **Easter eggs** (taps on the city — from pointerdown/pointerup, not click, which iOS never sends to the city — `scene.hit(x, y)` → `fx.hit`; the moon is silent):
  - windows: tap one to switch its light on or off (it stays that way);
  - the sign: tap a letter and that tube stutters (by day it sparks to life for a moment);
  - the moon: a soft swell of light and circling sparkles; three taps in five seconds send a shooting star off it;
  - the cat: about one night in three (the same for everyone) a cat sits on a rooftop, tail swishing, eyes catching the
    neon; tap it and it springs away (back in a few minutes);
  - the UFO: on clear nights every 8–18 min a polished saucer glides in, hovers over a rooftop and lowers a beam (motes
    drift up it), then zips off with afterimages; tap it and it leaves at once;
  - a satellite train: rarely (every 15–30 min on clear nights) a line of points glides across the sky, each fading in and
    out of the earth's shadow.
  - Force them in a preview: `&force=ufo,cat,satellites`.
- **Christmas lights** are now rooflines outlined in bulbs, strings down corners and between close roofs (5 buildings on
  Dec 1 → 18 on the 24th), baked once into a canvas with a few bulbs twinkling on top.
- THE BOARD plays menu3.mp3 (app.js#musicFor).
- **The moon's place** (fx.js#moonPlace): its real path, framed. How far along its arc comes from the true azimuth (rising
  left, setting right; mirrored in the south), how high from the true elevation, mapped into the open sky above the rooftops
  (desktop: the full arc, passing over the sign, never behind it). On phones (any portrait screen, or narrower than 760 px — not judged by the sign's size, which shrinks on short screens) the moon keeps to
  the band above it, below the notch, moving left to right through the night and fading in / out at moonrise / moonset, clear of the corner
  buttons. It glides to a new spot instead of jumping.
