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
  a 0.7 s fade, no drift / rain motion / showcase drift. Every ~20–40 s one letter gives a tiny flicker.
- **Scene** (`district/scene.js`, Canvas 2D like PULSE): sky + 4 skyline layers far→near (each pre-rendered DARK + LIT, the
  lit one with a baked bloom), haze at each layer's feet, beacons, two searchlights, planes and satellites (aircraft.js), holographic
  billboards cycling the games' own art (one per side per near layer), the wet street with the whole city reflected and
  rippling, light streaks under the billboards and the sign, puddle ripples, two rain layers, a vignette. Once fully on, each
  layer + its haze and the street + its reflection are BAKED into one image each (~35 drawImage calls a frame); every
  gradient is a cached sprite. Parallax: a slow drift + device tilt (deviceorientation, never asks for permission — iOS just
  doesn't send it) + the mouse on desktop. Tiers 2/1/0 (DPR 2/1.5/1, rain layers, shimmer, ripples) step down when
  the p75 frame > 19.5 ms; rendering stops while the tab is hidden; `destroy()` zeroes every canvas when the title leaves
  (the scene element lives on <body>, behind #stage). Measured: 60 fps at every tier at 4× CPU (GPU); 6 title↔setup
  cycles leave one scene and no heap growth.
- **Logo** (`ui/logo.js`): "NEON" as four bent glass tubes (glass, wide + near glow, body, white-hot core, a hairline highlight,
  electrode caps, mounting clips), "SPEAKEASY" in Orbitron with wide tracking, framed by Art Deco rules ending in a diamond (`.nd-word::before/::after`, an inline SVG), the tagline `TAGLINE`. The same markup is used lit
  in the lobby header (small), unlit in the boot screen, and by `brand.html` for the icons (the tube N) and the link preview.
- **THE BOARD** (BOARD in the dock, gold): the global leaderboards (`docs/profiles.md`); YOU in the dock (your emblem) opens the
  membership card; each preview sheet shows the game's top 3 and your rank.
- **Menu** (the dock: THE NEON RING below): HOST (the one glowing element; with a saved profile it opens a room in one tap,
  otherwise the name/avatar screen first), JOIN (one real input under four boxes: native keyboard, auto-caps, paste of a code
  or a whole invite link, auto-join on the 4th letter, a note when I/O are typed, inline errors for no room / full / removed),
  `?room=` pre-fills it (› glows), REJOIN [CODE] when a saved room couldn't be reached on boot (`state.rejoin`), YOU (the card;
  before a profile, setup in `edit` mode: profile only, back to the title), GAMES: a showcase of the games (tap → a preview sheet
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
  the weather (LIVE WEATHER below: real rain, snow, storms, fog, cloud, wind and cold — never made up; a little snow on the
  Christmas nights), and the NYE countdown / finale (the last 10 minutes before the local midnight, the first 5 after).
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

## LIVE WEATHER + the city's life (Oct 19, 2026)
- **Where the weather comes from:** `GET /api/sky` (api/sky.js) reads the visitor's approximate place from Vercel's IP headers
  (`x-vercel-ip-latitude / -longitude / -city`; no permission prompt, the browser never sees it), rounds it to ~0.5° (≈ 35 miles:
  the cache key and all that's kept), asks Open-Meteo (free, no key) and caches per area for 15 minutes (memory + `wx/{area}`,
  server-only). `core/weather.js` (pure) turns WMO codes + cloud cover + visibility + wind + temperature into
  `{ kind, rain, snow, storm, fog, cloud, wind, windDir, temp, lat, lon }`. The page (`district/live-weather.js`) asks after the
  first paint, every 15 minutes and when it comes back to the front; the answer is good for 75 minutes. With it, look() also
  places the sun, moon and stars over the visitor's real area (Grand Rapids sunrises, not New York's). **Without it** (no
  answer yet, local dev, a failed lookup): a dry city with a few fair-weather clouds — the old seeded "rainy evenings" are gone
  for good. Previews never use live weather; `&wx=clear|clouds|overcast|fog|drizzle|rain|storm|snow|sleet|freeze` sets it.
- **Clouds** (`district/weather-fx.js`): fractal-noise shapes (cumulus domes on a flat base, ragged stratus banks low near the
  skyline, a seamless overcast deck) with light marched through them — from above (sun, sky, moon) and from below (the city's
  neon on the bellies at night) — re-coloured as the hour changes; built a little each frame after the opening sequence (never a
  long frame) and faded in; drifting with the real wind. The moon dims behind thick cloud and glows through thin.
- **Rain** (`district/rain.js`, replaced the old tiled rain): drops at three depths slanted by the wind (a fifth of the near ones
  catch the neon at night), veils of rain under distant clouds, splashes (a flat ring + droplets) and rings on the street, a
  low spray in a downpour; the signs' own drops follow it. **Storms:** lightning in clusters — the sky lights up behind the
  skyline (the towers stand out black), the clouds light from inside, a branching bolt now and then (left or right of the sign),
  every raindrop flashes, the street brightens, the glass of HOST / JOIN flickers, and thunder rolls in a few seconds later.
- **Fog:** a veil after each far row (the distance dissolves), noise-shaped banks drifting through the near towers, the sign's
  halo spreading. **Snow:** real snowfall in depth (big soft flakes up close, a warm tint at night), drifting with the wind,
  settling on the rooftops and on the sign's tubes (`title.js#snowOnSign`: an SVG of the tubes' top edges, in over a minute);
  the first snow of each winter (per device) starts with a hush of a few big slow flakes.
- **Deep freeze** (`district/frost.js`, real cold only: from −4 °C / 25 °F, full by −12 °C / 10 °F): fern-like frost creeping in from
  the screen's corners and edges (baked once, kept clear of the sign and the buttons), icicles under the nearer roof lines,
  rime on the roofs, frosted glass on the lit windows.
- **The glass of the dock** (`title.js#tintGlass`, `--dk-glow / --dk-tint`): the sign's neon after dark (the holiday colour on its
  days), amber at golden hour, rose at dawn, cool frosted daylight; rain beads and runs down it while it rains. Labels unchanged.
- **Birds** (`district/wildlife.js`): GEESE in V formations in the migrations (Mar–Apr flying north: out of the haze toward us;
  Sep–Nov south: away into the distance), wingbeats rippling down the arms, sometimes a straggler; SWIFTS round the rooftops on
  summer evenings; PIGEONS on a roof at one side by day (bobbing, pecking, turning) — tap them and they burst up, wheel round
  and land again (they also go on their own every few minutes); a rare HERON crossing near the moon on warm nights.
- **The street** (`district/street.js`): traffic at the towers' feet following the clock (`trafficAt`: the 8 am and 6 pm rush,
  weekend evenings, a stray cab at 3 am) — head lights one way, tail lights the other, their light streaked on the wet street, small
  cars (and cabs) by day; an ELEVATED TRAIN above the low middle roofs of the near row every few minutes (`trainGap`: more in the
  rush, none 1:30–5 am) with lit windows, a headlight and the odd blue spark; STEAM from roof vents and a manhole when it's cold.
- **The sky:** the PLANETS (Venus, Mars, Jupiter, Saturn — JPL elements, `core/sky.js#planetsAt`) where they really are, steady,
  Venus from dusk; LUNAR ECLIPSES on their real dates (`ECLIPSES`, `eclipseAt`) when the moon is up: the shadow crossing, the moon
  copper-red in totality.
- **Loading + cost:** these modules load 0.4 s after the first paint (the title never waits); clouds build in ≤ 2 ms slices;
  every sprite is baked; test-only `&force=no-clouds,no-road,no-birds,no-rain` switches parts off for performance checks.
- **Preview:** `&force=lightning,geese,swifts,pigeons,heron,train,steam,rush,eclipse,freeze` (+ `&wx=` above).

## The title, Oct 2026 redesign: the city is the showcase
- **No game row.** Under the tagline, one line: `N PARTY GAMES · ONE PHONE EACH` (N = the playable games in `GAMES`, so it
  updates itself). The city's billboards (bigger now) cycle the game art; **tapping one opens that game's HOW TO PLAY**.
- **The dock:** THE NEON RING (below) — it replaced the HOST / JOIN pills, the links and the welcome line (Oct 19, 2026).
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
  - satellites: see AIR TRAFFIC + SATELLITES below (the old satellite train was replaced).
  - Force them in a preview: `&force=ufo,cat,satellites`.
- **Christmas lights** are now rooflines outlined in bulbs, strings down corners and between close roofs (5 buildings on
  Dec 1 → 18 on the 24th), baked once into a canvas with a few bulbs twinkling on top.
- THE BOARD plays menu3.mp3 (app.js#musicFor).
- **The moon's place** (fx.js#moonPlace): its real path, framed. How far along its arc comes from how far it is between
  tonight's real moonrise and moonset (core/sky.js#moonArc: 0 at the left edge → 1 at the right; mirrored in the south), how high from the true elevation, mapped into the open sky above the rooftops
  (desktop: the full arc, passing over the sign, never behind it). On phones (any portrait screen, or narrower than 760 px — not judged by the sign's size, which shrinks on short screens) the moon keeps to
  the band above it, below the notch, moving left to right through the night and fading in / out at moonrise / moonset, clear of the corner
  buttons. It glides to a new spot instead of jumping.

## The city's signs (Oct 2026) — replaced the billboards
Files: `district/signs.js` (drawing, placement, power, holidays, taps), `district/marks.js` (each game's neon mark + a
single-stroke tube alphabet), `district/sign-logic.js` (pure: the rotation + the ticker's message; `tests/signs.test.mjs`).
- **Four kinds**, all in the main sign's language (glass tube, white-hot core, two blurred glow layers, electrode caps,
  mounting clips, brackets):
  - **Marquee** (the showpiece): an art-deco crown on a near tower — sunburst fan, stepped pediment, "NOW PLAYING" in red
    neon, a theater letter board with the game's name, chasing bulbs all round. A change runs like a split-flap board: cells cascade left to right, each top half folding down on its hinge.
  - **Blade**: a lacquered vertical cabinet off the edge of a near tower on brackets, a border tube and the game's word in
    stacked tube letters (`MARKS[id].blade`).
  - **Icon**: the game's mark (`MARKS[id].tubes`, a 0..100 box) mounted on a mid-skyline wall, with a little transformer.
  - **Ticker**: a dot-matrix band (5×7 font in signs.js) across a building: holiday build-ups ("3 NIGHTS TO HALLOWEEN"),
    greetings, the New Year countdown (alone in the last minutes), then "NOW PLAYING: …" — never leaderboard content.
- **How many / where:** phones 4 (marquee, blade, icon, ticker), wide screens 5 (+ a far icon). Placed each layout around
  the clear zones the title reports (`scene.set({ clear })`: the sign + tagline + 34 px, the dock, the corner buttons): the
  marquee crowns a near tower to one side, the blade hangs on the other, the icon sits near the middle, the ticker and the
  far icon go wherever spreads them out most. Never overlapping each other, a clear zone or a nearer building; each sign
  tries a few sizes and takes the largest that fits. Only the marquee and the blade are bright and close; the rest sit
  back in the haze (`NEAR_ALPHA`). Re-placed only when the screen or a zone changes by ~40 px.
- **Rotation:** one sign changes every 12 s, round-robin, always to a game not already showing (each game holds its sign
  for half a minute or more). The blade only takes names that fit at a readable size (about 15 px tall on a phone; longer
  names show on the marquee, the icon and the ticker); its letters have a softer glow so they read on a phone. Icons and blades power down and buzz back tube by tube; the marquee flips; the ticker just scrolls.
- **The living city:** off by day (glass tubes and brackets visible), tube by tube on at dusk (and at the title's boot),
  off together at dawn. Holidays: orange/violet tubes, Thanksgiving amber, Christmas red/green bulbs
  (more each December day), New Year's gold + the countdown on the ticker, Valentine's rose tubes, St. Patrick's green,
  Easter pastels, the Fourth red/white/blue. Light spills on the walls and into the wet street; rain streaks catch it;
  a rare small flicker. Reduced effects: no chase, no flicker, plain fades.
- **Taps:** every sign (thumb-sized areas, pointer events) opens that game's HOW TO PLAY; on the ticker, the name under the
  finger (or the nearest one scrolling by).
- **A new game:** add its mark to `MARKS` (else it gets its initials in tube letters) — it joins the rotation by itself.
- **Performance:** each sign is drawn once into offscreen canvases (the unlit sign; one canvas per tube); a frame blends
  those plus ~40 bulbs and the ticker's scroll. 60 fps at 4× CPU on the top tier.
- **Dock cleanup (same pass, since replaced by THE NEON RING):** the rank moved into the welcome line; the explainer line shows only before a profile exists. The window easter
  egg is gone. On phones the moon arches over the sign (rising beside it at the left edge, setting at the right).
- **The rain sound** plays only while it rains on screen (title.js#rainSound: in over ~3 s, out over 4 s); clear, snowy and
  daytime skies are silent.
- **Phones:** the buildings run further down the screen, so the city meets the dock and the blade has room for readable names.
  Since Oct 19, 2026 (all mobile, portrait): the street comes down to just above THE NEON RING (`dockTop` from the bottom safe area,
  measured by title.js → `scene.safeBottom`; a 56–64 px strip for the road, the cars and their reflection), the rooftops come down
  only 3.6 % of the height (`drop`), so the towers are ~40 px taller; the far rows dip in the middle (a valley for the sun's low arc). Wide screens with no room for a blade get a third icon.
- **Rain** falls in about one 4-hour block in four (sky.js#rainOf), random by date, the same for everyone; not the real weather.
- **No marquee (Oct 2026):** it looked out of place in the neon city. Phones now get two neon blades (one each side), an icon
  and the ticker; each blade's tower has its roofline and blade-side edge lined in neon in the blade's colour. Wide screens:
  as many blades as fit plus icons, five signs. The ticker's dots are bigger, bolder and brighter (full brightness wherever
  it sits). The marquee code is still in signs.js but nothing places it.
- **Short Safari screens:** a blade may start lower on its tower (below the clear zone around the tagline) and use slightly
  smaller letters (12.5 px), so phones with the browser bars showing still get both blades.
- **The city winds down:** windows go out one by one from about 10 pm (≈90% at 10:30, 70% near midnight, 50% at 12:30, a
  third from 2 am until dawn) — sky.js lateK + palette LATE.win.
- **The phone moon** rides a wide arch over the sign: rising beside the first N (it may slip partly past the screen edge),
  over the top, setting beside the last N. It may pass behind the corner buttons; while it does, it isn't tappable.
- **Rooftop billboard:** on top of the left blade's tower (else the right one's) a framed panel on steel legs with a catwalk
  and two lamps shows the game's neon mark, its edge lit in the mark's colour. On phones it replaces the wall icon (which
  stays as the fallback when no rooftop has room). It rotates and is tappable like the other signs.
- **Christmas lights on the sign** (title.js#xmasWrapSvg): a wire wound round the sign's own tubes (traced from the live SVG
  with getPointAtLength), crossing in front of the glass and behind it; a glass C9 bulb hangs off the side at every other turn,
  drooping a little; swags with bulbs between the letters. More lit each December night (holiday k), all from Christmas Eve;
  a few twinkle (opacity only); unlit bulbs hang dark.
- The neon trims on the blade towers and the rooftop billboard's edge use soft wide strokes, never a per-frame shadow blur
  (that cost 50 ms frames at 4× CPU).
- **The night sky** (district/stars.js): the real brightest stars (~85, with the real constellations), ~780 faint ones (denser
  along the galactic plane) and the Milky Way band (galactic longitude samples, brightest toward Sagittarius, a dust lane),
  turned to the player's estimated place and time and projected facing south (north in the south). Re-rendered every 20 s
  (the sky turns 15°/h — never visibly), a few bright stars twinkle. The Milky Way shows every clear night, richer late,
  washed by a bright moon, hidden by rain; stars fade by day (palette stars). Tested in tests/sky.test.mjs.
- **More neon on the buildings:** every row now carries some (near 55%, far 22%): full outlines, corner + roof, roof lines,
  vertical strips, double bands; thinner and softer further back.
- No EDIT button on the title (the card has EDIT PROFILE).
- **Searchlights are an occasion** (scene.js#searchOn): Friday and Saturday nights (fading out toward midnight) and holiday
  nights; never while the Milky Way is strong. Rooted near the sides, nearly upright and swaying, never across the sign;
  holiday colours (Christmas red/green, Halloween orange/violet, the Fourth red/blue…). Preview: `&force=searchlights`.
- **Neon on the buildings is seeded random** (the same city for everyone; widths depend on the screen): each building rolls
  a chance per row (far 45%, near 55%) and a style; in the far rows most are full outlines so they read at a distance.
- The Halloween / St. Patrick's rooftop neon sign sits on a roof near the middle (the sides hold the blades and billboard).
- **Neon outlines get their own pass** (each layer's `neon` canvas, drawn after its fog) so far buildings show whole outlines,
  not just a roof line; and the neon stays at full strength when the windows wind down at night (it had been tied to them).
- **The O dresses up** (title.js#swapO): on Halloween's full days it becomes a neon jack-o'-lantern (gold face, green stem), on
  St. Patrick's a four-leaf clover — bent in the same tube recipe as the letters, so they power on and flicker with the sign.
  Glows are filtered as one group (a filter per small path clips into visible boxes).

## THE NEON RING — the dock (Oct 19, 2026) — `title.js#buildActions`, `css/title.css` (end)
- **One floating bar** of smoked glass near the bottom (14 px from a phone's sides; centred, max 420 px wide on desktop), above the
  home indicator / Safari's toolbar (`max(safe-b + 6px, 20px)`): a blur of the city behind it (`.nd-bar-glass`, the sky's colour from
  `tintGlass`), a hairline catching the city's light along the top, a darker bottom edge, 26 px corners, a soft drop shadow on its
  own layer (`.nd-bar-shadow`). Five slots: JOIN · BOARD · [HOST] · GAMES · YOU (grid). Weather on the glass carries over (rain
  beads and runs, lightning's flicker: `.nd-bar.is-rain / .is-flash`).
- **Icons:** custom neon line icons (`ICON` in title.js), each drawn twice — the tube in its colour, glowing, and a thin white-hot
  core: JOIN a door (soft white), BOARD a trophy (gold), GAMES a 2×2 of rounded tiles (cyan), YOU the player's own emblem in their
  colour (`avatar()`; before a profile a neutral outline emblem). Labels in the tagline's type (8.5 px mono, wide tracking). Every
  slot is ≥ 44 px; a press is a soft pool of the icon's light and a small scale (Reduced effects: none).
- **HOST** (`.nd-hostbtn`, also `.nd-host` for the tests): a raised dark-glass disc (70 px) sitting in a cradle cut out of the
  bar's top edge (a mask on the glass + a rim), with a neon tube ring built like the logo's letters (glass tube, two glows, body,
  white-hot core, highlight, two mounting clips) and HOST inside. **Its colours come from the sign's own tubes**
  (`ringColors`: the computed glow / body / core of the four letters → `--hg1..4 --hb1..4 --hc1..4` on the button, re-read whenever
  `dressSign` changes the sign), so every holiday — and any added later — matches by itself; a multi-colour sign (Christmas,
  Halloween, Easter, the Fourth) makes the ring four tubes, N·E·O·N clockwise from the top, joined by electrode caps. The colours
  are registered (`@property`), so a change blends over 1.4 s. **Always lit:** off (glass) until the power-on, then it flickers on a
  beat behind the first N (`ringOn`) and never switches off; by day softer (`.is-daylit`: `--hk`), like a small OPEN sign. A barely
  noticeable breathing of its glow (`.nd-hglow`, in front of the glass so the blur never re-renders; Reduced effects: still).
  Its reflection on the wet street under the bar (`.nd-hrefl`, static: it's behind the glass). Busy (opening a room): the glow
  pulses faster. Same behaviour as before: a saved profile opens a room in one tap, else the name screen.
- **JOIN** opens a glass panel just above the bar ("ENTER THE CODE"; `.nd-actions.is-join`, a cyan light under JOIN): the four
  boxes over one real input (native keyboard, auto-caps, paste of a code or an invite link, auto-join on the 4th letter, the I/O
  note, inline errors). Closes by JOIN again, a tap outside, a swipe down, Escape. With the iOS keyboard up the panel is pinned just
  above it (`fitKeyboard`: the visual viewport). The panel's glass is its own layer (`::before`; a blur on the panel itself rendered
  unevenly behind the animated caret). An invite link (`?room=`) opens it filled in, › ready, no keyboard.
- **Above the bar:** REJOIN [CODE] as a glass pill with a cyan light; notes (a room that couldn't open, an expired invite) as a
  pill that fades after a few seconds (tap to dismiss). The bar itself never moves. Each piece is rebuilt only when its own data
  changes (a button replaced between a touch-down and its click loses the click).
- **Power-on:** the bar and its tabs come up with the sign (`is-dock`); at rest it fades with the menu.
- **The icons are tubes of the same sign** (Oct 19): each answers a letter (JOIN·N, BOARD·E, GAMES·O, YOU·N) through `dockLight(i, on)`
  / `dockAll` — they stutter on a beat behind their letters in the power-on, go dark with them when the sign shuts off at dawn, re-light
  at dusk, and catch the sign's rare flicker (not letter taps). By day / unlit: empty glass tubes (a pale tube and a thin highlight,
  no glow; the YOU emblem desaturated); the labels never change. HOST follows the sign's timing but not its off state: softly lit by
  day, its brighten / soften eases over 2.4 s (`--hk`, registered).
- **Lowest quality tier:** `.nd-noblur` (the scene's `tier()` = 0): slightly more opaque glass, no blur.
- **Tests:** e2e-title.mjs "THE NEON RING" (targets, colours vs the sign incl. a blend and four holidays, by day, the intro flicker,
  Reduced effects, the JOIN panel's opening / closing / keyboard, BOARD, GAMES, YOU). Test-only hook: `__district.dock`
  (`join`, `note`, `preview(state)`, `recolor`, `ring`).

## THE REAL SUN (Oct 19, 2026) — `district/sun.js` (replaced fx.js's low-sun glow)
- **Path** (`sunPlace`, PURE; the moon's approach): facing south the sun rises on the LEFT at today's real sunrise and sets on
  the RIGHT at the real sunset (mirrored south of the equator: facing north). Across = `sunArc(ms, tz, lat, lon).u` (core/sky.js:
  0 at sunrise, ½ at solar noon, 1 at sunset, cached per day); height = its real elevation (higher in summer). It never crosses the
  sign or the tagline. **Wide screens:** the full arc, clearing the towers' tops in its first ~10°, lifted gently over the sign
  where it would cross it, under the corner buttons. **Phones** (portrait / < 760 px) — THE LOW ARC (Oct 19, 2026): the
  skyline is a valley (tall towers at the sides, low in the middle); the sun crosses the band of open sky between the middle rooftops
  and the tagline, a little higher toward noon (closer to the tagline in summer: `noonEl`), and rises out of / sets into the tall
  side towers moving sideways behind their bodies (where it goes in and out: the nearest x where the disc at the band's bottom is
  fully behind the roofs, from scene.js's skyline outline `fs.skyline` → `roof(x)`); never behind a roof in the open middle, never
  near the corner buttons; the moon keeps its arc above the logo. (Before: up the left edge beside the sign, across the strip above
  it, down the right edge past the buttons.) Should it ever pass behind the corner buttons it stays at full brightness: `title.js#sunGlass`
  paints its light into their glass where it is behind them, in its colour and as strong as the overlap (`--sun-x/y/c/k/r`, every
  500 ms), with the glass a touch darker and a tight dark edge on the icon (≥ 4.5:1); the rest of the time the buttons are unchanged
  (the ☰ button gets no backdrop blur on the title: it cost a frame in two at 4× CPU). Eased at 6 % a frame: never a jump.
  ALWAYS NIGHT: no sun.
- **Look:** colour by elevation (`sunColor`: deep red-orange → orange → gold → a soft warm white), larger and a little squashed
  near the horizon (`sunShape`); a soft-limbed disc and two smooth blooms (no rays, no flare) — all cached sprites, a frame is a
  few drawImage calls. Drawn in the sky layer, so the clouds, the planes' sky, every row of towers and the sign are in front:
  at sunrise / sunset it sits behind the skyline, clipped by the rooftops, with a halo spilling over the far rows (`halo`).
  Low sun: a warm rim light on the sun-facing tower edges (east in the morning, west in the evening), a sparse fixed few windows
  on that side glinting gold (scene.js compose); barely-there beams at golden hour, clear or partly cloudy only (`rays`).
- **Weather:** clouds drift in front; through thin cloud it glows (`through`, using `wfx.coverAt`), overcast hides the disc and
  leaves a brighter patch; no sun in rain or heavy fog, a faint warm glow in light fog.
- **Solar eclipses, real:** `solarEclipse(ms, lat, lon)` (core/sky.js) — the sun (NOAA) against the moon from Meeus' full lunar
  series (ch. 47, ~10″, ΔT applied), topocentric (the moon's ~1° parallax), the sun's size by the earth's distance. No table:
  on a real eclipse at the visitor's place the moon covers what it really covers (Indianapolis 8 Apr 2024: 225 s of totality vs
  the real 226 s; New York 0.91). A partial (rebuilt Oct 19): a crisp white-hot crescent, its glow baked from its own shape
  (shadowBlur, per shape), the glare around the sun weakening as the sliver thins, the moon a faint dark silhouette against that
  glare; past ~70 % the light goes flat, dimmer and a little steely (`dim`). Totality: a black disc, a pearly corona with fine
  streamers, the whole scene darkened. `&force=eclipse-sun`: the moon glides in at a slant, ~85 % at the deepest (12 s in), 100 s loop.
- **Reduced effects:** no rays; the sun still moves and changes colour. **Performance:** golden hour at 4× CPU, 60 fps.
- **Preview:** `?when=&tz=` shows the sun there and then; `&force=eclipse-sun` (a partial now, the moon gliding across),
  `&force=totality`. Tests: `tests/sun.test.mjs` (rise / noon / set for N + S cities in summer and winter, the path against the
  sign / buttons, smoothness, colour + size, eclipses, ALWAYS NIGHT), the sun checks in `tests/integration/e2e-sky.mjs`.

## AIR TRAFFIC + SATELLITES (Oct 19, 2026) — `district/aircraft.js` (replaced the flying light streaks and the old satellite train)
- **Planes**, simulated (no flight data, no network): every couple of minutes, by the local hour (`trafficRate`: busiest in the
  evening (≈ 1.5 min), steady by day (≈ 2.5 min), quieter late, very rare 2–5 am; ≥ 30 s apart; the first within ~6–18 s); 1–2 on screen on a phone, up to 3 on a
  desktop (1 at the lowest tier). Each flies its own straight path, never level (climbing or descending a little), either way,
  at its own height (high = small, faint, slow: 20–40 s to cross), some drifting toward or away from us; now and then (≈ 1 in 8,
  6 am–11:30 pm) an APPROACH, bigger and descending, landing lights on.
- **Where:** anywhere in the sky, like the birds — in the sky layer, so behind the clouds, the skyline, the sign and the
  tagline (the page sits in front of the sky; a plane crossing behind the NEON letters is what you would see) — from under the
  status bar / notch down to the towers' tops (below that they would only be hidden). Satellites the same.
  Every path stays above the real skyline all the way across (scene.js bakes the roofs' outline, `fs.skyline`; an approach may
  sink behind the towers in its last quarter) — on a portrait phone the side towers reach up beside the tagline.
- **Look:** night — lights only: red on the left wingtip, green on the right (as seen for its direction, `navLights`: the near
  wingtip a little higher), a white strobe double-flashing about once a second, a slow red beacon; small crisp points on soft
  glows. Sunset / dawn — a small dark silhouette, a contrail catching the pink-gold light; day — sunlit SILVER up in the deep
  blue (a dark speck vanished there on phones), a dark silhouette only low in the pale haze, a glint of sun, a white
  contrail; a little larger on phones; contrails form a little behind the plane, spread and fade over ~25 s and drift with the wind. Weather: behind the
  clouds; rain — fewer, lights only and faint; fog — softer, blurred lights; no contrails in rain or under overcast (and nothing
  seen by day above an overcast).
- **The Milky Way** (stars.js, revised Oct 19): seen from a city — a faint, smooth glow plus ~2,600 tiny faint stars crowded
  along the band (thickest toward the galactic centre) and a fine dust lane; washed out over the lowest ~35° of sky by the
  city glow (it used to read as a bright white streak near the skyline). Mars shows orange-red, Jupiter cream-white.
- **Satellites:** only in the twilight hours (`satTwilight`: the sun 6–18° down — a dark sky, satellites still sunlit), clear
  skies: a single faint steady point every 5–10 min; on about one evening / morning in four or five (`starlinkNight`, seeded by
  the date: the same nights for everyone) a STARLINK TRAIN once — 20–40 evenly spaced steady points on a straight gentle
  diagonal, fading into the earth's shadow partway across in the evening (out of it before dawn); hidden where they cross the moon.
- **Reduced effects:** fewer planes, steady lights (no strobe), contrails that don't spread; satellites as usual.
- **Preview:** `&force=planes` (a plane every ~9 s), `&force=approach`, `&force=satellites` (a train now), `&force=sat`;
  `&force=no-planes` switches them off (performance checks). Tests: `tests/aircraft.test.mjs`, `tests/integration/e2e-sky.mjs`.
