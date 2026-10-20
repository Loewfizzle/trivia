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
- **Menu** (the dock: THE FLANK below, Oct 20 2026; before it THE NEON RING): HOST (the one glowing element; with a saved profile it opens a room in one tap,
  otherwise the name/avatar screen first), JOIN (one real input under four boxes: native keyboard, auto-caps, paste of a HUSH WORD
  or a whole invite link, auto-join on the 4th letter, any letter A–Z, inline errors for no room / locked door / full / removed /
  too many wrong words),
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
- **The sign** (`title.js#applyNeon`, THE NEON COMES ALIVE below): dark glass by day; it sputters to life through the golden hour
  and catches when the sun goes behind the rooftops; at dawn it falters and dies letter by letter. On a holiday's full days the tubes change colour per letter (`.sg-<holiday>` in title.css: Halloween orange/violet,
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
- **The living city:** off by day (glass tubes and brackets visible); since Oct 19 2026 each sign is powered on its own by the neon
  plan (`signs.tick(o.signPower)`): one at a time after the catch, one by one off in the dawn twilight (each with its tube-by-tube
  sputter-on / stutter-off); without a plan the old rule (`P.sign`: all on after dusk, at the title's boot). Holidays: orange/violet tubes, Thanksgiving amber, Christmas red/green bulbs
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
- **The camera** (Oct 19): the slow automatic drift (±14 px over ~90 s, each row at its own depth) runs on desktop only — on a phone
  nothing drives it (iOS sends no tilt), and a city drifting by itself read as the buildings wobbling (and moved the towers under the
  sun); the rows are drawn at whole canvas pixels (a fractional offset is resampled differently every frame: a faint shimmer).
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
- **Searchlights are an occasion** (scene.js#searchOn; on PARTY NIGHTS the neon beams below take over): Friday and Saturday nights (fading out toward midnight) and holiday
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

## THE NEON COMES ALIVE (Oct 19, 2026) — `district/neon-ramp.js` (PURE), `sun.js#sunMoments`, `title.js#applyNeon`
- **Not the weather:** everything follows where the sun is drawn (`sunPlace`), never clouds, rain or fog. `sunMoments` finds the
  day's moments on the screen's own layout (the sign + tagline, the buttons, the skyline outline): **catchAt** = the LAST time tonight
  the disc goes fully behind the rooftops before it sets (walked back from 20 min after sunset; the low phone arc can't fire it early),
  **clearAt** = the first time this morning it is fully clear of them, **startAt** = ~10° elevation. Before the layout is known: the
  real sunset / sunrise. Cached per local day and layout; the catch differs per screen size by design (what each player sees).
- **The plan** (`neonPlan`, seeded by the date + the place, so a reload shows the same sputters; `neonState(plan, t)` gives any instant,
  `neonNext` the next change — the title schedules timers, it never polls):
  - EVENING: from startAt single silent sputters (80–150 ms, 20–30 s apart) that grow — more often, longer, sometimes two letters,
    later sometimes holding 1–2 s; in the last few minutes the letters STICK one by one (still dropping out now and then); at
    catchAt THE CATCH — all four lock on with the crackle + hum (the only sound) and a soft bloom (`.is-catch`); then the rare
    random flicker as before. The city's signs answer one at a time, a few minutes apart, within ~15 min.
  - MORNING: the city signs go off one by one 30–10 min before sunrise; the logo stays on until clearAt, then falters for 6–9 min —
    letters drop out and come back, die one by one, the last hangs on alone — then the daytime glass look.
  - Never more than one flash every 0.7 s. ALWAYS NIGHT: lit at all times. Reduced effects: no sputters — the sign fades in over
    the ramp (`.is-fade`, `--rf`) and out in the goodbye; the city signs fade on / off one at a time.
- **The phone sun's timing** (THE BIG ARCH in step with the real sky, Oct 20 2026): it peeks over the rooftops at the real sunrise
  and is fully behind them at the real sunset, so the catch lands at the real sunset (Grand Rapids, 19 Oct, every phone size:
  within 25 s of it) and the morning goodbye starts ~5–25 min after the real sunrise (when the disc first clears every roof: 7–21
  min depending on the size's skyline). Above ~4° it is never hidden, so a tower can't swallow it and let it re-emerge; the walk
  back from after sunset still finds the LAST disappearance (`tests/neon.test.mjs`: four skylines × three cities × three dates).
  Desktop: when its disc sinks behind the skyline.
- **The intro** adapts: after the catch it plays exactly as before; before the catch (and in the morning goodbye) the city boots
  but the sign isn't forced on — it joins its stage. **The dock:** icons dark through the ramp, lit from the catch until the last
  letter dies; HOST never sputters — it brightens at the catch and softens (no flicker) when the last letter dies.
- **Letter taps** still work at every stage (the letter returns to the plan's state after its little show). Holiday decorations
  follow their letters.
- **Preview:** `?when=&tz=` shows the right stage for any time; `&speed=60` runs the clock 60× (test-only: the evening in a minute,
  each sputter at its real length on screen — `neonPlan({ scale })`). Hooks: `__district.neon()`, `neonAt(t)`, `neonSounds()`.
- **Tests:** `tests/neon.test.mjs` (stages, the ramp's growth, ≤ 3 flashes / s, sticking, the city signs one at a time, the morning
  order, seeding, Reduced effects, the catch against the drawn sun on phones and desktop, N + S, summer + winter); e2e-title
  "THE NEON COMES ALIVE" (day, ramp, the catch with its one sound, the city answering, the morning, storms, reload, the intro
  mid-ramp, a letter tap mid-ramp, ALWAYS NIGHT, Reduced effects).

## PARTY NIGHTS (Oct 20, 2026) — `core/party.js` (PURE), `district/party-fx.js`, `district/fireworks.js`, `audio/beat.js`
Friday and Saturday nights the city comes alive on the beat. Built for an iPhone held upright first; a wide screen gets more
(four beams, six fireworks). Only opacity breathes; everything is a baked overlay or a pre-rendered sprite.
- **When** (`partyState`): Fri / Sat 8 pm → 2 am local (the same window as MOOD MUSIC's PARTY mood), starting at 8 pm OR the
  neon catch, whichever is later (never in daylight: a June Friday starts at the catch, ~9:30 pm). ALWAYS NIGHT keeps the window.
  At 2 am it winds down over ~1.5 min (`on` 1 → 0). The late-night window wind-down waits for it: lit until 2 am, out over the
  next hour (`partyLateK` in `core/sky.js#look`). `L.partyNight` carries the window into the look; the ticker rotates
  "IT'S FRIDAY NIGHT" / "IT'S SATURDAY NIGHT" (`sign-logic.js#partyLine`; Sat 1 am is still Friday night).
- **The shape of the night** (`partyEnergy`, blended smoothly): WARM-UP 8–10 pm (0.6 → 0.75), PEAK 10 pm–midnight (1), AFTER
  HOURS midnight–2 am (0.7). The energy scales the breathing, the extra party windows, the searchlights' pace and colour changes.
- **The beat** (`createBeatClock` / `advanceBeat`; the song from `audio/beat.js#beatSource`: the room's synced song in a lobby,
  else this phone's mood song — id, bpm from `data/mood-music.json`, position): a breath per beat up to ~84 bpm, every second
  beat above (never more than ~1.4 breaths / s); the swell rises over the last 14 % of a beat, peaks on it and relaxes
  (`breathShape`). The clock eases its rate (~2 s) and nudges its phase toward the song's — no jump; without a song (before the
  first tap, music off / muted, CLASSIC, a song loading) it breathes once every 3.5 s and eases back the same way.
- **What breathes:** the logo (a soft bloom of the sign's colour behind the letters, `.nd-bloom`, + the canvas halo — never the
  SVG's own blurred glow layers: changing those re-ran the filters every frame), SPEAKEASY's outer glow, both rings together
  (`--hk` from `--pb`), the buildings' neon trims (a beat rippling out through the rows, the near row first), the party windows'
  bloom, the wet street's reflection. The small icons and the corner buttons stay steady. The scene drives it: `partyTick` →
  `S.onParty(PT)` → `title.js#partyFrame` writes `--pb` (the breath), `--pe` (energy, 0 until the start wave has passed), `--psw`
  (the finale's swell) on the title root, once a frame.
- **SPEAKEASY** is real neon on party nights: `.nd-word-g` (a white-hot core in the sign's colour, layered glow via `--pc/--pcb/
  --pcc` from the sign's first letter, set by `title-dock.js#ringColors`) with a shimmer of light sweeping the letters every
  6.5 s (`.nd-word-s`, its own compositor layer). Plain white the rest of the time.
- **Party windows** (`party-fx.js#bake`, seeded by the evening — `partySeed`): about a quarter of each row's lit windows
  (13 % far back → 26 % in front; ×0.85 on wide screens) in the city's neon — pink, cyan, violet, gold — some as whole floors in
  one colour (`pickPartyWindows`), baked per row as coloured glass (two bakes: with / without the peak's extras) + ONE bloom for
  the whole city (every row's tiny bloom, blurred twice) drawn once a frame over the skyline band. At any moment a few turn
  slowly on or off (~3 s each, never a twinkle, at most a tenth off, never a whole floor). Their light in the wet street is a
  baked reflection that pulses with the beat (6 ripple strips on tier 2, one blit below).
- **Neon searchlights** (`party-fx.js#searchlights`; the weekend's plain beams crossfade out as the party fades in): two beams
  on a phone (rooted at 8 % / 92 %), four on a wide screen; each a soft-edged volumetric beam fading with height (a wide veil,
  a brighter core, a white-hot heart, a pool of colour where it catches the haze), in the palette's colours. A new target angle
  every second breath, eased (1.6–4.2 / s): slow graceful leans in the warm-up / after hours, at the peak around the sign's
  heart so they cross behind the NEON letters; a new colour on the big beats (every fourth breath) at the peak, every ~8 otherwise,
  blended quickly by drawing the old and the new palette colour over each other (sprites only per palette colour — a blended
  colour made a new sprite every frame once; two colours added together go muddy halfway, so the blend is short). Each beam comes
  on already leaning, its light rising over ~0.9 s (never a vertical pillar). Behind the skyline, so the towers occlude them;
  never over the sign or the dock. (In stills, a sign with a letter out or half its blade lit is the signs' own flicker — an
  easter egg, not a party bug.)
- **The start:** a wave of colour sweeps left → right over 2.6 s as the party begins (`pfx.wave`: three ribbons of the palette
  and a white edge; the party windows and the bloom switch on as the front passes — a clip). Opening the title mid-party: no wave.
- **The midnight finale** (`startFinale` → `district/fireworks.js`, the same renderer the NYE / Fourth fireworks now use): the
  moment local midnight passes on a party night (`finaleDue`, once a night, never on New Year's Eve — that night has its own) 4
  rockets on a phone (5 / 6 on wide screens) launch 0.36 s apart from behind the skyline and burst — on a phone between the
  tagline and the tower tops (the towers occlude their lower edge: fireworks over the city, never a bloom on the sign), on a wide
  screen in the free sky either side of it: a short flash in the shell's colour, a round shell of 150 sparks (tier 2; 96 / 46
  below) with glowing trails and a white-hot heart, a two-tone core on every second one, a wide colour wash into the haze, drag,
  gravity, glitter in the second half of their life, a few splitting into white pops; the light of each burst on the buildings and
  the wet street (`fw.light()`); the whole city swells (`PT.swell`: the logo's bloom, the rings, the trims, the windows' bloom).
  Sound: `audio/ambience.js#fireworkBurst` on the SFX bus (a soft thump + a sparkle of crackles). `&force=finale` plays it
  2.5 s after the title is up; `__district.finale()` any time.
- **The street:** up to 70 % more traffic at the peak, more cabs; about a third of the cars carry a soft neon underglow in the
  party's colours (and its streak on the wet asphalt), breathing with the city — quiet, it sits just above the dock.
- **Holidays on a party night:** the palette is the holiday's (`PARTY_PALETTES`: Halloween orange / violet, Christmas red /
  green…) for the windows, the searchlights, the finale; SPEAKEASY and HOST follow the sign; JOIN and the corner buttons stay white.
- **Reduced effects:** the colours, calmly — the breath holds at 0.5, no shimmer, no window turn-ons, no start wave, steady
  beams; the midnight moment is a swell of light only (no rockets).
- **Quality tiers:** the full look is tier 2 (phones). Tier 1 drops the beams' veil and haze pool and the reflection ripple; tier
  0 drops the bloom and the party reflection too. At 4× CPU in software-rendered headless Chrome (a very slow phone with no
  GPU) the peak costs about one tier (t2 33 ms, t1 17–33, t0 17 — a plain night 17); the scene steps a tier down by itself.
- **The lobby:** when the title leaves it hands the backdrop the party's light alone (`scene.partyLight()` — the panes, the bloom,
  the reflection); `backdrop.js` lays it over the still (`.nd-bd-light`, screen blend) and breathes its opacity to the room's
  song (`beatSource` → the synced player, so every phone in the room breathes together), slowly on its own before it plays.
- **Previews:** `?when=2026-10-23T21:00&tz=America/Detroit` (a Friday; `&at=42.96,-85.67` for Grand Rapids' sky), `&force=party`
  (any time, at the peak), `&force=finale`, `&speed=`; `?when=` now takes seconds (`T23:59:52`). Test-only: `&force=no-party-css|
  no-party-windows|no-party-lights|no-party-refl`, `no-bloom|no-ringbreath|no-shimmer|no-vars` in the URL (pacing bisects).
  Hooks: `__district.party()` (on, ramp, energy, name, phase, breath, bpm, rate, locked, swell, wave, finale, sparks, bursts,
  beams), `__district.finale()`, `__arcade.beat()`.
- **Tests:** `tests/party.test.mjs` (the window, the phases, 8 pm vs the catch, the 2 am fade, the wind-down through
  `look()`, the finale's moment, the breath, the beat clock easing on and off a song, the palette, the party windows, the
  ticker); `tests/integration/e2e-party.mjs` (timing incl. a June evening, the beat with music / muted / before and after the
  first tap, two lobby phones on the room's song, the beams by phase and size, the street, the finale forced / live at midnight /
  once / not on NYE, Halloween with white JOIN + corners, Reduced effects, pacing at 4× CPU, and the review's videos +
  screenshots: `ONLY=media`).

## THE FLANK — the dock (Oct 20, 2026) — `title.js#buildActions`, `css/title.css` ("THE FLANK")
- **Layout** (an iPhone held upright first): `[ JOIN ring ]  [ glass pill: BOARD · GAMES · YOU ]  [ HOST ring ]` — centred and
  mirrored, two identical rings (76 px; 68 under 360 px wide, 70 on short screens, 86 on wide screens) standing just outside a compact
  smoked-glass pill (58 px tall) with an even 10 px gap each side (`.nd-flank`: `--disc --pill-h --cell --gap`). The pill holds three
  icons only (27 px in 52 × 58 targets; each button named for screen readers: The Board, The games, Your membership card / Create
  your player); the rings are the largest elements. Each ring has its word inside (JOIN / HOST, 9.5 px bold tracked) and its own
  reflection on the wet street below (`.nd-rslot .nd-hrefl`, wearing the ring's colour). Weather on the glass lives on the pill.
- **The rings** (`.nd-ringbtn`): the HOST ring as before (dark glass disc, a neon tube ring in the sign's colours — `ringColors`
  now sets them on its slot `.nd-rslot-host`, so the ring and its reflection share them). **JOIN is the same ring in white neon**
  (`.nd-rslot-join`: a white-hot core in a soft cool-white glow, its glass a cool dark; white all year, holidays too; its halo a
  touch softer, `nd-hbreathe-w`). Both always lit and never sputter (`ringSet` lights both): softer by day (`.is-daylit`),
  brightening together at the catch, softening together when the last letter dies at dawn, flickering on together in the power-on
  (`ringOn`). JOIN's panel open: the ring a touch brighter and a small cyan light under it (`.nd-tab-ind`).
- **The small icons** (BOARD·N, GAMES·E, YOU·O) and **the title's corner buttons** (☰ + music·N) are tubes of the sign
  (`dockLight` / `dockAll`): dark through the day and the sunset ramp, lit at the catch with the logo, lit all night (catching the
  logo's rare flicker), dark at dawn when the last letter dies. Unlit: empty glass with a slightly brighter outline than the old
  dock (easy to find, clearly unlit). ALWAYS NIGHT: lit. Reduced effects: no flicker.
- **The corner buttons on the title only** (`dressCorners`, CSS "THE TITLE'S CORNER BUTTONS"): on mount a white tube icon
  (`.nd-cic`: three bars / an X while the menu is open; the note / a slash through it while the music is off) is added to the
  global ☰ and music buttons and their glass becomes the pill's (the city's tint: `tintGlass` also sets `--dk-tint` on the body);
  lit with `.nd-cl-lit`; white on holidays. Removed on unmount — the lobby, THE BOARD and the games keep their buttons exactly as
  before. The sun behind them (`sunGlass`) works as before (test hook `__district.dock.sunAt(x, y, r)` places a sun to review it).
- Carried over from THE NEON RING (`docs/title-history.md`): the JOIN panel (the four boxes over one real input, auto-join on the 4th
  letter, paste, inline errors, pinned above the iOS keyboard by `fitKeyboard`, an invite link opens it filled in), REJOIN and notes
  above the dock, weather on the glass (`.nd-bar.is-rain / .is-flash`), the power-on (`is-dock`), the at-rest fade, `.nd-noblur`.
- **Files:** `js/screens/title-dock.js` (the markup, the rings, `ringColors`, the lighting, `dressCorners`); `title.js` keeps the
  behaviour (JOIN / HOST / the panel) and hands it in. **Look preview without Firebase:** `tests/integration/title-preview.html`.

## THE REAL SUN (Oct 19, 2026) — `district/sun.js` (replaced fx.js's low-sun glow)
- **Path** (`sunPlace`, PURE; the moon's approach): facing south the sun rises on the LEFT at today's real sunrise and sets on
  the RIGHT at the real sunset (mirrored south of the equator: facing north). Across = `sunArc(ms, tz, lat, lon).u` (core/sky.js:
  0 at sunrise, ½ at solar noon, 1 at sunset, cached per day); height = its real elevation (higher in summer). It never crosses the
  sign or the tagline. **Wide screens:** the full arc, clearing the towers' tops in its first ~10°, lifted gently over the sign
  where it would cross it, under the corner buttons. **Phones** (portrait / < 760 px) — THE BIG ARCH (Oct 20, 2026; `phoneArch`):
  one rainbow over the open sky, IN STEP WITH THE REAL SKY (tuned Oct 20). Height = the real elevation: h (0 at the ends, 1 at the
  top) by t = e / N (e = el + 0.83°, 0 at the real sunrise / sunset; N today's noon e) — a quick, smooth lift to a share rho by
  the time the real sun is ~4° up, then the rest of the height as a quarter sine to solar noon (C1 where they meet), so it keeps
  climbing all morning and sinking all afternoon. rho is fitted once per day and layout (cached, ~5–20 ms): the smallest that has
  the disc fully clear of every roof under the path from ~4° up, and peeking (never fully hidden) from ~0.4° — a 5° sun is low
  but plainly visible over the rooftops. Across: half the clock (cos π·u: sunrise left, noon centred, sunset right) and half the
  place along the half ellipse for that height (x = cx ∓ a·√(1−h²)), so the low curves stay round and it keeps to the time of day.
  Each end sits just hidden under its own rooftops at 7.5 % from the edge, or further in (the same both sides: noon centred) when
  no fit clears the roofs there under the season's top; failing that the top lifts toward SPEAKEASY (real timing wins — on
  skylines whose towers reach the tagline, e.g. 390×844 and 412×915 today, the winter top sits a little higher). The top follows the season (`sunArc().season`: 0 at the
  winter solstice's noon height for this latitude, 1 at the summer's): behind the middle of SPEAKEASY in summer, the tagline (a
  touch below its middle) in winter, smoothly in between; never up into the NEON letters (`fs.textRects`: neon / word / tag, from
  `title.js#textRects`; the sun isn't drawn on a phone until they're measured), never near the corner buttons. The canvas is under
  the DOM: it passes BEHIND the words, the Art Deco rules and the tagline; while it's there `title.js#sunGlass` gives them a soft
  dark edge (`.nd-sunbk`, `--sunk` by distance, every 500 ms; nothing the rest of the time) so every letter stays readable on the
  bright disc. Buildings hide it wherever it passes behind them (rising, setting, the tall right tower), with the rooftop glow.
  Mirrored south of the equator. The moon keeps its arc above the logo. (Before: THE LOW ARC, Oct 19, then the first BIG ARCH, Oct
  20, timed by the clock — hidden behind tall edge towers for ~1 h 40 min after sunrise.) **Preview anywhere:** `&at=42.96,-85.67`
  puts the sky over that place (default: the time zone's city — Detroit for America/Detroit; real players get their real area
  from /api/sky). Should it ever pass behind the corner buttons it stays at full brightness: `title.js#sunGlass`
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
