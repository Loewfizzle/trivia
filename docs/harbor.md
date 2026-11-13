# CITY 2.0 — THE HARBOR (the bible)

The title's city — THE ONLY CITY since **CITY 1.0 OUT** (Nov 5 2026: City 1.0, "the district" — `js/screens/district/` — deleted; its
time capsule in `Downloads\NEON\museum`, its code at the git tag **`city-1.0-final`**; the older tag `city-1.0` = Oct 20, before the
Harbor began). A once-only, never-redo build with an uncompromising quality bar. **Every later part follows this file.** The default
address since WINDOWS (Nov 1); an old `?city=2` or `?city=1` link lands here too.

**THE MASTER PLAN: [`docs/harbor/plan.md`](harbor/plan.md)** — the owner's decisions for every part (the big picture: what each
part builds and what comes later). Every part reads it first. It is a READ-ONLY reference: each part builds only what its own
prompt asks, leaves room for what comes later and never contradicts it; if the prompt and the plan disagree, the prompt wins —
then tell the owner. The rules (size rules, hero pieces, the floor-not-ceiling reference, budgets) stay in this file.

## The vision
A 1920s Art Deco city in heavy neon, across a harbor, that is LIVE to the player's own place and time — their real sun, moon,
stars, weather, seasons, holidays, party nights — and **we never tell them; they discover it.** Weather effects only when it is
really happening.

- **iPhone held upright is the baseline and the majority.** Design every pixel for 390–430 pt wide first. Desktop is a minority
  but must look just as good: a wider panorama with more to see, never a stretched phone.
- **Quality bar: STUNNING.** Nothing may look cheap, day or night. DAY and NIGHT must feel like two different cities — the same
  city, two totally different vibes. At golden hour, rays of sunlight stream between the buildings as the sun passes behind
  them; real shadows and textures everywhere. Night neon is a show-stopper, party nights jaw-dropping, holiday details insanely good.
- The Harbor is **its own city** — not tied to or branded off any one game (RUMRUNNER included).
- Keep **ALWAYS NIGHT** (seasons + holidays still show). Keep the **audio logic exactly as it is** (MOOD MUSIC by time of day, the
  lobby's synced song, each game's music); the music + menu buttons stay where they are.

## The owner's decisions (Oct 20 2026)
- **THE REFERENCE IS THE FLOOR, NOT THE CEILING.** `docs/harbor/ref/` (`city2-harbor.png` night + day, `city2-harbor-closeup.png`,
  `river2.js` — the approved mockup renderer, city "harbor2") locks the layout, camera, proportions and mood. Every piece in the
  real build must clearly beat its mockup version in craft, detail, texture and light — never match it and stop. Port the
  NUMBERS only: never import, copy-paste or serve anything from `docs/harbor/ref/` (it is in `.vercelignore`); use the app's real
  fonts. The mockup's numbers are CSS pt at 402×874.
- **Layout:** the skyline across the harbor (lots of sky above for the sun's arch, moon, stars); a pier with a Ferris wheel on the
  left; a lighthouse in open water on the right with a keeper's cottage; boats (the riverboat "Rosie" with bulbs, a water taxi, a
  tug, sailboats by day); then the near STAGE: a waterside road (two stop lights, a bus, cars) behind a promenade nearest the
  viewer (lamp + tree pairs incl. trees at the front corners, a bench, planters, a seasonal vendor cart, people), and the
  SPEAKEASY on our side bleeding off the left edge (windows you can see into, the unmarked door, a crafted awning "EST. 1924", a
  visible rooftop with planters and string lights). The promenade at night needs rich lamp light (it was too dark in the mockup).
  The skyline has real gaps and varied heights along the sun's path so golden-hour rays can stream between buildings (planned now:
  `SUN_GAPS`).
- **The skyline vs the sign (asked + decided Oct 20 2026):** with the real sign, the mockup's tallest towers would rise 23–63 pt
  into the tagline. The camera stays the mockup's (so the water, road, promenade and the size rules are exactly as approved) and
  the skyline is SQUEEZED: the tall towers shrink more than the low ones so the skyline keeps its dramatic peaks and never looks
  squat or flat-topped; the landmark towers stay the tallest; the tallest crown stops 10 pt under the tagline; the freed sky is
  the sun's arch.
- **A phone sideways (asked + decided):** the whole city, smaller (the wide camera; people ~9 pt). The size rules are for the phone
  held upright.
- **SIZE RULES** on a ~402 pt-wide iPhone: people ~20 pt tall (hats, scarves, coats readable by shape + colour), cars ~50–60 pt
  long, the bus ~110 pt, lamps ~45–55 pt, tree canopies ~40 pt, stop lights ~55 pt (heads 1.3× real size, bright, with glow +
  wet reflection). Far skyline windows are glitter (no detail expected; distant brick and blinds must never read as lit windows by
  day); the near stage is where life happens; **nothing alive under the dock**; every new feature gets a size check (pt on a real
  phone) before it is built. **"If it would look flat in a photo, it isn't done":** every surface gets texture, relief and shadow.
- **HERO PIECES = everything that draws the eye, no exceptions:** everything that moves (planes, the banner plane, helicopters,
  jets, birds / gulls / wildlife, the UFO, satellites, boats, the bus, cars, trucks, plows, people) plus the landmarks (the
  speakeasy, the Ferris wheel, the lighthouse, the pier, the landmark towers) and every sign and billboard. Each is crafted like an
  illustration (real shading, detail, light) and reviewed up close by day and by night. The existing sky systems keep their
  behaviour (flight paths, schedules, real-sky timing); their ARTWORK is rebuilt to this standard in Part 6.
- **SIGNS:** built like the NEON logo (`ui/logo.js` — bent glass tubes: glass body, near + wide glow, white-hot core, highlight,
  electrode caps, clips), real cabinets with depth, brackets, chaser bulbs; each game has its own neon sign in the city (and its own
  tube logo, reused later by the lobby's sign swap); beautiful unlit by day (clear glass, sun glints, weathered paint, cast shadows).
- **Depth + contrast so neon pops:** 4–5 skyline depth layers with atmospheric haze, dark mid-ground silhouettes, a horizon glow,
  floodlit crowns, reflections in the harbor, bloom.
- **Holidays:** the US set (Halloween, Thanksgiving, Christmas, NYE, Valentine's, St. Patrick's, Easter, July 4th) + Memorial Day
  and Veterans Day (American flags in windows and on buildings — also for July 4th — and a Veterans Day flyover) + Day of the Dead.
  **Party nights** (Fri/Sat) build all night: classy warm-up → spectacle at the peak → the midnight finale. **Hidden tappable easter
  eggs**, never explained, from common to legendary (some once a year), incl. a few subtle, rare nods to the owner's home town,
  Grand Rapids.
- **Sound:** nothing may rely on a subtle sound (the music is loud) — important moments use a music change, a short duck, or crisp
  on-beat hits, always with a strong visual. With the music OFF, a premium, relaxing city soundscape plays instead (a distant
  foghorn, gulls, an occasional far-off honk, light traffic, a soft city hum; a night version) — never cheap (Part 12).
- **Accessibility + modes:** respect prefers-reduced-motion (a calm, still-beautiful version); Low Power / low tiers degrade
  gracefully (fewer moving things, never a broken or ugly city); the Dynamic Island / notch and home-indicator safe areas; a phone
  turned sideways (the wide camera; never a broken layout).
- **Future growth** (room designed now, built later): parades, a rooftop party / summer rooftop garden at the speakeasy, the
  banner plane (daily challenges, holiday messages, game announcements, July 4th F-16s), a party yacht with a helicopter landing,
  a snowman through a snowy day, the player's own figure walking into the speakeasy, the city "remembering" the day; **LOBBY 2.0**
  (the live city IS the lobby: guests as figures on the promenade outside the speakeasy door; on start the sign swaps to the
  game's neon logo and everyone walks inside), **BOARD 2.0** (the bar inside the speakeasy, its windows looking out on the live
  Harbor), **PROGRESSION 2.0** (levels 1–100, a wardrobe whose pieces turn neon at night, entrances), a future single-player mode /
  daily challenges (keep a doorway for them: the events system's lanes). Every future addition meets the same quality bar.

## The 12 parts
| # | part | what |
| --- | --- | --- |
| 1 | **foundation + blockout** ✅ | the flag, the projector + per-size camera, the layout, baking + the memory budget, lanes + events, the &grid overlay, a grey box of the whole approved layout, tests, this file |
| 2 | **skyline** ✅ | the composition (hero towers, word towers, clusters, the newer city's glass), the far bands, the facades (real stone / terracotta / brick / glass by day, glitter at night), the haze, the landmark towers' full craft + floodlit crowns, the golden-hour rays through the sun gaps, addressable windows + words in the windows, the searchlights, the sun's + the moon's arches re-fit, the tagline fade |
| 3 | **neon + signs + billboards** ✅ | the tube signs (each game's own), the hotel's blade, JAZZ, billboards; the neon outlines on the buildings + the NEON NEEDLE + the LED facades; the premium NEON logo + its anchors; each game's tube logo; unlit by day |
| 4 | **water** ✅ | reflections in perspective, ripples, the lights' smears, the quay lamps in the water (+ Part 3 touch-ups); wakes: hooks for 5 |
| 5 | **harbor hero pieces** ✅ | the Ferris wheel (turning, bulbs), the lighthouse (the beam), the pier, the boats (Rosie and her bulbs, the taxi, the tug, the sailboats) — the landmark towers moved to Part 2 |
| 6a | **the everyday sky** ✅ | planes (capped contrails), the banner plane, skywriting + skytyping, the helicopter, birds (gulls, swifts, geese, bats), hot air balloons, the sun's haze + the moon's art, a real aurora, THE DRONE SHOW, the holiday sky table; section 0: the tier on iPhones, the wheel at night, signs off the hero towers |
| 6b | the special-occasion sky | jets + the air show, the UFO, skydivers, the witch, Santa's sleigh — the existing systems' behaviour, new artwork |
| 7 | **the speakeasy** ✅ 7a + 7b | the facade, rooms you can see into, the door + the knock, the awning "EST. 1924", the rooftop (planters, string lights, people) — 7a the look, 7b THE LIFE (the window moments) |
| 8 | the stage | the promenade, lamps, trees, bench, planters, the cart, people who walk, the road, the bus, cars, stop lights (cycle, wet reflections) |
| 9 | seasons + weather | the trees through the year, snow on everything, rain and puddles, fog, frost; the city's materials in each |
| 10 | holidays + the banner plane | every holiday in the list, flags, the Veterans Day flyover; the banner plane's messages |
| 11 | party nights | the warm-up → the peak → the midnight finale on the Harbor; `partyLight()` for the lobby's still |
| 12 | easter eggs + sounds + memory + desktop + switch-over | the eggs (common → legendary), the music-off soundscape, the city remembering the day, the desktop pass, the switch to default + the backdrop (menus' still) |

## The flag (history — CITY 1.0 OUT, Nov 5: there is no flag any more; an old `?city=1` / `?city=2` link is the Harbor, `?city=2` kept
on the address bar by `identity.js#setUrlRoom`, read by nothing. title.js imports the Harbor on every visit — a failed load is tried once
more, then THE CITY COULDN'T LOAD + RELOAD (title.js#cityDown). What follows is how the flag worked until then.)
- `?city=2` is a plain URL flag only. It is read once in `js/screens/title.js` (one top-level line: the harbor module is imported
  only when the flag is in the URL — a normal visit never requests a harbor file) and the scene is created with one gated line:
  `scene = (createHarbor || createDistrict)(…)`. Never saved to localStorage, cookies, the profile or Firebase; never in a menu;
  kept in the address bar by `identity.js#setUrlRoom` (like `pdperf`), so a dev session stays on the Harbor across a refresh, a
  rejoin and back to the title;
  the service worker caches files by URL and never a default path (`sw.js` is network-first, no precache list — nothing to change).
- Every title flag works with it: `&when &tz &at &wx &rained &wind &speed &force` (core/sky.js#skyClock), `&intro &idle` (under `?emu`).
- Harbor-only flags: **`&grid=1`** (the dev overlay: the safe areas, the sign + tagline, the skyline limit + the squeeze, the
  sun's arch band + the roofline + the sun now, the sun gaps, the eight lane rects (dashed, named), the door's tap target,
  size boxes: a 20 pt person at z 47 and a 110 pt bus at z 60), Part 6a's sky previews (`&force=banner|skywrite|skytype|drones|helicopter|
  balloons|balloon-festival|aurora…&text=…`: docs below, Part 6a), **`&debug=1`** (logs the camera, the layout and every bake with the
  memory per layer; Part 5: an ON-SCREEN FRAME-TIME READOUT top left — the tier + DPR, frames drawn a second, the scene's work
  per drawn frame mean / p95, the frame interval + the share over 20 ms, what keeps 60 fps, "water quiet" — for checking the
  real speed on a real phone; C1.5: + THE SESSION line — slow frames since the city showed, of how many, the longest run, the
  longest frame: read it after a minute, one honest number; DT1: the readout sits at the BOTTOM, just above the dock, + an `after 10 s` twin of
  the session line — the count without the load), **`&force=demo`** (the demo event, end to end), **`&scene=<name>`** (NEON PASS 3: holds one of the
  party show's scenes on a party night or with `&force=neon-party` — `climb%2Bcrowns`, `call%2Bchase`, `sweep%2Bfins` …).
- **THE PREVIEW PANEL** (Oct 22): the owner's TEST pill (admins only) switches every one of these live, on her phone or on every
  phone on `?city=2` (`city2/live`) — see the section below; `&panel=1` shows it without an admin under `?emu` / on `/tests/` pages.
- Previews: `tests/integration/title-preview.html?city=2&…` (no Firebase); shots: `node shots.mjs "<browser>" --preview --city 2
  --safe --sizes harbor --scenes day,golden,night,party,rain,snow` (`--crop stage`); perf: `node title-perf.mjs "<browser>" --city 2`.

## Working on the Harbor (every later prompt — NEON PASS 5 + 6)
- **Tests while working:** `node --test tests/harbor.test.mjs` (seconds) + `ONLY=<the groups the task touches> node e2e-harbor.mjs
  "<browser>" ./shots-harbor` (every group + which cloud job runs it: `tests/integration/harbor-jobs.mjs`); **the whole suite
  once before the commit** (no ONLY: three parallel shards + panel + perf alone — docs/testing.md). Then the unit suite + a quick
  default-city check.
- **Safari:** WebKit can't be installed on this machine (NEON PASS 5 + 6 + THE DAY PASS's Known issues) — every canvas effect takes the Safari-safe path
  (`js/ui/canvas-safe.js`: no `ctx.filter` without `blurWorks()`, source rects through `blit()`, sprites through `ctx2d()`), and the
  tiering never treats a capped frame rate (iOS Low Power Mode's 30 Hz) as a slow city. **The owner's iPhone decides** (`&debug=1`).
- **Perf (C1.5 — THE GATE IS RELATIVE; the owner's iPhone decides):** a `git worktree` of the commit before served on :5174
  (`node scripts/serve.mjs 5174`) vs the working tree on :5173, then ONE run of `node title-perf.mjs "<browser>" --city 2 --ab
  http://localhost:5174 --scenes np-night,np-party --size 402x874` — it interleaves A B B A A B itself (the page not measured is
  hidden: its city stops), waits for a settled city, throws away a window whose tier moved, judges FRAME PACING first (the
  interval p95 + the share over 20 ms) then work, against the windows' own noise: `same` / `faster` / `SLOWER` (exit 1). The
  absolute budgets (8 / 6 / 4 ms) print as WARNINGS only. A flag's cost: `--scenes np-party --vs n4-punch`. Tier 2 on a party
  night needs `--cpu 1–2` (at 4× without a GPU it steps itself down); tier 0 at 4×. Then the owner's `&debug=1` session line.
- **No look change, proved:** `node pixdiff.mjs "<browser>" --scenes night,party,noon,golden` (A = :5174, B = :5173: still frames,
  reduced motion + a seeded random, an A-vs-A noise floor; `--burst 8 --gap 250` for side-by-side moving frames).

## The architecture (Part 1)
```
js/core/harbor-layout.js   PURE  the projector, the camera per screen, the SIZE table, the squeeze, the sun gaps, the whole layout, screen boxes, the roofline, the lane rects
js/core/harbor-events.js   PURE  lanes + events, the stateful scheduler (anchor + replay, budgets, rarity, heavy events → density), the built-in events
js/core/harbor-windows.js  PURE  (Part 2) every window's dice + the light timeline (City 1.0's), the pixel font, layoutText (words on the word towers)
js/screens/harbor/scene.js        createHarbor(): the district's API; the frame; the sky modules wired in; rainbows + party rules; the dock's rects
js/screens/harbor/bake.js         the baker: two sets of canvases, chunked steps, the crossfade, the memory budget
js/screens/harbor/tones.js        the day / golden / night tints (from the real sky's weights), the haze by depth, the real sun's side + height (sunLook)
js/screens/harbor/shapes.js       world-space drawing: boxes (the faces the camera sees), people, vehicles (the crowns: blocks.js)
js/screens/harbor/blocks.js       (Part 2) a skyline building crafted: materials, Deco piers + spandrels, cornices, setbacks, weathering, the glass,
                                  the sun's side + cast shadows, the street's glow, floodlights, every crown; cellRect (a window's pane on screen)
js/screens/harbor/skyline.js      (Part 2) the two skyline groups ('far', 'near'), far → near, with their veils; the facades' bake steps
js/screens/harbor/lights.js       (Part 2) THE LIT WINDOWS: their own bake (the light key) + what changes every frame (glitter, TVs, a light switched
                                  off / on, the beacons, the words: spell / set)
js/screens/harbor/rays.js searchlights.js   (Part 2) the golden-hour rays through the sun gaps; the rooftop searchlights (hardware + beams)
js/core/harbor-neon.js     PURE  (Part 3) the neon palette (roles + schemes), the outlines, the sign spots + their checks, tonight's pick
js/core/tube-path.js       PURE  (Part 3) SVG paths → tube polylines, the uneven light along a tube (shared with ui/logo.js)
js/screens/harbor/tubes.js       (Part 3) THE TUBE: lit (glows, body, core, highlight) + unlit glass, caps, clips; sprites
js/screens/harbor/signs.js       (Part 3) the signs' art (cabinets, icons, HOTEL, JAZZ) + the billboards
js/screens/harbor/neon.js        (Part 3) the manager: spots → signs, outlines projected + cut, sprites built a few a frame, power, moments
js/screens/harbor/sky.js          the sky's gradient + horizon glow (the real sky on it = the district's sky modules)
js/screens/harbor/water.js        (Part 4) THE WATER: the base (baked) + the live mirror of the frame above it, the light columns, the ripples
                                  on the real wind, the paths, the edge; hooks reflect / light / wake / set
js/core/harbor-boats.js    PURE  (Part 5) the boats' routes on the clock (never through the pier; day / night per cycle), boatAt, boatSpeed
js/screens/harbor/wheel.js        (Part 5) THE FERRIS WHEEL: the turning steel, the gondolas, the bulb show + schemes, the A-frames, cached 20×/s
js/screens/harbor/quay.js pier.js lighthouse.js boats.js road.js speakeasy.js stage.js foreground.js   the layers, far → near
                                  (Part 5: pier.js the crafted pier + platform; lighthouse.js the crafted lighthouse + THE BEAM;
                                  boats.js Rosie, the taxi, the tug, the sailboats, wakes, reflections)
js/screens/harbor/grid.js         the &grid=1 overlay
js/core/harbor-sky.js      PURE  (Part 6a) the aurora's nights (seeded + Kp storms), the moon's look, what may fly (the weather gates, balloon hours),
                                  sky messages (skytyping lines, skywriting strokes, banner panels), the birds' calendar, THE HOLIDAY SKY
                                  table (SKY_HOLIDAYS + setSkyHoliday), the drone show's shapes + timeline
js/screens/harbor/skyfx.js        (Part 6a) THE EVERYDAY SKY's manager: events → pieces, the holiday sky on the clock, &force= previews,
                                  free lanes for the planes, the heavy pieces' quiet, the API (harbor().sky)
js/core/harbor-show.js     PURE  (NEON PASS 3) THE PARTY SHOW's director (scenes on the beat → per building: its tubes ×, its party colour,
                                  a live effect — climb, fins, chase, a crown's flash; the drops; the searchlights' + the wheel's cues) +
                                  THE EVERYDAY MOTION's pick (a sign spells on, one blinks, an icon cycles its colour, slow chasers)
js/core/harbor-beat.js    PURE  (NEON PASS 5) THE BEAT: the clock locked to the song's grid (real bars), the kicks heard (onsetStep), half-time
                                  punch (audio/beat.js: the grid + the AnalyserNode; docs/audio.md#the-beat)
js/ui/canvas-safe.js             (NEON PASS 5) Safari-safe canvas: blurWorks() (ctx.filter tested by its pixels), blit() (clipped source
                                  rects), ctx2d() (no throw out of iOS canvas memory); C1.5: safeCtx() (every Harbor context: a refused one
                                  draws nothing + is counted — the scene steps its tier down), starvedCount()
js/core/harbor-dark.js    PURE  (C1.5) ONE "HOW DARK IS IT" INPUT: darkness() (DT1: THE DUSK CURVE on the sun's elevation + cloud / storm / eclipse
                                  terms, all 0 today) + the named ramps every lighting decision reads (litK) + (DT1) THE BLUE-HOUR POWER-UP: power(),
                                  tonight's order (powerOrder), the windows' share + bias
js/core/harbor-signdim.js PURE  (C1.5) THE SIGN-DIM HOOK: sky messages dim the logo + fade the tagline (createSignDim; title.js applies it)
js/core/harbor-speakeasy.js PURE (7a) THE SPEAKEASY's plan: the facade's heights (SPEAK_V), the rooms behind its windows (ROOMS, roomLight by the
                                  hour), the weekly ghost ad (ghostAdGame), the corner turn (CORNER_TURN) — drawn by screens/harbor/speakeasy.js
                                  (walls painted flat + projected; createSpeakeasy: the rooms lit, the pole, the ad's / the blade's lamps; 7b's hooks)
js/screens/harbor/waterfront.js  (NEON PASS 2) the storefront strip at the water's edge (shapes, not words)
js/screens/harbor/skybeams.js strings.js   (NEON PASS 4) the party's sky beams (one shape table, a sprite per colour); the string lights
js/screens/harbor/clouds.js dayfx.js       (THE DAY PASS) THE CLOUDS (real cover + wind, KINDS + set() for Part 9); the day's motion (flags, glints)
js/core/harbor-wind.js PURE  (ATM-A) THE WIND AS ONE SYSTEM: the input (live / &wind= / &force=windy|gale / a calm fallback) → ONE state a frame —
                                  the level + lean, GUSTS AS SEEDED WAVES rolling from the upwind edge (at(u), v(u)); every reader shares it
js/core/harbor-weather.js PURE  (9a) THE WEATHER MODEL: the live / forced answer → ONE city state (cityWeather), its soft transitions
                                  (stepWeather: the rain builds, the drips, the street drying), wetFrom, the previews (WX_FORCE)
js/screens/harbor/rainfx.js lightning.js waterfog.js wetground.js glasswx.js   (9a) THE RAIN (depth, the wind's slant, lit by the tubes +
                                  the lamps, rings + splashes) · THE LIGHTNING (capped) · THE FOG ON THE WATER · THE WET PROMENADE (puddles
                                  drying patch by patch, the lamps' wet streaks, the awning's drips, the speakeasy's wet glass) · THE WEATHER
                                  ON THE SIGN + THE GLASS (the beads on the tubes, the glaze + icicles, the dock's + the corner buttons' rain + frost)
js/core/harbor-remote.js  PURE  THE PREVIEW PANEL's registry: every &force= preview, the scenes, times, weather, holidays; validation
                                  (shared with /api/admin), the state → the URL flags, the status line
js/screens/harbor/remote.js       THE PREVIEW PANEL: the city2/live listener (everyone on ?city=2), the owner's TEST pill + sheet
js/screens/harbor/air.js banner.js smoke.js birds.js balloons.js drones.js moon.js   (Part 6a) the airliners + satellites + the
                                  helicopter · the banner plane · skywriting + skytyping · the birds · balloons · the drone show +
                                  its barge · the moon, the golden-hour haze, the aurora
```
- **The public API City 1.0's `createDistrict` had** (title.js + title-neon / title-taps / title-dock use it; `screens/backdrop.js`
  keeps a still of it for the menus): `set, look, hit, signOn, palette, signCol, refresh, safeTop, safeBottom, state, setTier, tier(), sun, neonMoments,
  signCount, now, speed, skyline, frames, cost, party, finale, partyLight, street, knock, door, rainbow, debug, destroy` +
  `harbor()` (City 2.0 only; `__district.harbor()`) + `wake(ms)` / `hold(ms)` (cleanup pass 1: keep 60 fps / don't step the tier).
- **The sky modules City 1.0 shared** (moved into `screens/harbor/` + `core/` by CITY 1.0 OUT): `stars, fx (back + front), sun (draw,
  through, halo, dim, moments — the rays are the Harbor's own, rays.js), aircraft (the pure half), weather-fx (sky, fogLayer, flash,
  moonVeil), frost (pane), fireworks-2d, rainbow (update, sky), live-weather` + `core/palette.js`. They get `resize(W, H, HZ)` with HZ =
  the far quay's waterline and the same frame object (`fs`) City 1.0 built, incl. `skyline` (the Harbor's roofline: the sun fits its arch to it, the planes
  keep above it).
- **Draw order:** the sky (gradient, stars, the moon + sky fx, the sun, planes, clouds, rain veils, the rainbow, birds,
  fireworks) → **far** (haze band, far band + the glass towers, mid band + the middle tier) → **farLit** + glitter → the far NEON (Part 3: the middle tier, the threads, the LED facades, the far icons) → the sun's
  halo + the rays (behind), swifts, fog → **near** (the hand-placed towers, the near band, hero blocks, the searchlights'
  hardware, the quay + its lamps) → **nearLit** + the TVs, switched lights, words → the near NEON (Part 3) → the quay lamps (Part 4: lit) → the beacons → the rays' veil → fog → the
  searchlights' beams → **water** (the base) → THE WATER (Part 4: the frame above the waterline mirrored, rippled; water.js) → **harbor** (pier, wheel, breakwater, lighthouse, cottage) → boats → **road** → traffic →
  **stage** (promenade, stop lights, speakeasy, lamps, trees, bench, planters, cart) → people → lights (lamps, stop lights, the
  knock) → rain drops, snow, the flash, frost, the eclipse → the vignette → &grid. **Bold** = baked.
- **Baking:** each baked layer is a full-width band of the screen (only its rows), drawn per LOOK KEY (Part 1: the tone weights in
  sixths + the camera) in small steps — `TIERS[tier].bakeMs` (2 / 3 / 4 ms) a frame, never a blocked frame (the very first bake, while
  only the sky draws, takes 3× + 2 ms, and the lit layer's first bake 2×) — into the second set,
  then crossfaded in over 1.2 s and swapped. Progressive start: the sky draws from the first frame; the city fades in (0.7 s)
  when its first bake is done (≈ 6–10 frames). A moved rect (the title reports the sign's and the dock's real rects a frame after
  mount and every 500 ms), a resize or a tier change re-lays the city. **A re-layout never blanks it:** `plan()` keeps each
  group's current canvas and `ready`, with the band it was baked for (`show`); the scene draws that stale layer — in its old band
  when the pixel size is unchanged, stretched into the new band after a resize or a tier change — until the new bake swaps in,
  then the crossfade (from `prev`). Only `next` (the bake target) is resized, when a bake starts; `settle()` gives the spare
  canvas its group's size again after the crossfade (and after the first bake), so the steady state is two sets at the current
  size. A bake never starts during a crossfade (its source is `next`): the look's rebake waits, a re-layout's bake is queued
  (`wantBake`). The sign or the corner buttons moving without the city moving only re-computes the lanes (no bake).
- **Memory budget** (`bake.js#MEM_BUDGET_MB`): the baked layers (both sets, the facades' + the lit windows') ≤ **24 / 40 / 64 MB** at tier
  0 / 1 / 2; the water's canvases and the neon's sprites are reported next to them (`harbor().mem`, `harbor().neon.mb`) and the E2E holds
  their sum under the same figure; the sky canvas, the vignette, the quay-lamp sprite and the stars (~3 MB at DPR 2) are small and outside it. Baked layers
  are capped at DPR 2 (the main canvas's own DPR: tier 2 = 2, so DPR 3 bakes would be downsampled anyway; a DPR-3 stage is possible
  later only together with a DPR-3 main canvas — measure first). Over budget, the tallest layers step down to DPR 1.5, then 1.
  Measured: 15.6 MB at 390×844 tier 2 (+ the main canvas 5.3 MB), 13.3 MB at 1440×900. Canvases are reused on a re-bake, never
  more than two sets, and `destroy()` sets every Harbor canvas to 0×0 (+ the stars', since cleanup pass 1). The E2E proves 20 title ↔ setup cycles leave the same MB and no
  growing heap.

## The camera + the layout (Part 1 numbers)
World units: x right, y up, z away; the camera at x = 0, CAMH up, level. `sx = VPX + F·x/z`, `sy = VPY + F·(CAMH − y)/z`.
- **The mockup (402×874):** VPY 540, CAMH 13.5, F 600. Visible half-width = 0.335·z. Ground: y = 540 + 8100/z.
- **Upright phone:** F = 600 · W / 402 (390–430 keep the same composition), CAMH 13.5, VPY = dock top − 4 − F·CAMH/36.5 (the
  front row stands 4 pt above the dock). The squeeze limit = tagline bottom + 10. Measured (real title, iPhone safe areas):

| size | F | VPY | squeeze s | person | bus |
| --- | --- | --- | --- | --- | --- |
| 390×844 | 582 | 509 | 0.65 | 19.2 pt | 107 pt |
| 402×874 | 600 | 532 | 0.65 | 19.8 pt | 110 pt |
| 412×915 | 615 | 568 | 0.65 | 20.3 pt | 113 pt |
| 430×932 | 642 | 575 | 0.65 | 21.1 pt | 118 pt |
| 874×402 (sideways) | 270 | 262 | 0.33 | 8.9 pt | 50 pt |
| 1440×900 | 604 | 566 | 0.65 | 19.9 pt | 111 pt |

(The 874×402 + 1440×900 rows are Part 1's; since DESKTOP (Nov 2) every wide screen runs THE DESKTOP CAMERA below — 1440×900: F 725, the eye
at 8, squeeze 0.66, people ~33 pt.)

(Squeeze: Part 2 numbers. Part 1 measured 0.55 / 0.52 / 0.76 / 0.66 / 0.28 / 0.52 — very different drama per phone.)

- **Wide (desktop, an iPad sideways, a phone sideways) — THE DESKTOP CAMERA (DESKTOP, Nov 2; the owner's desktop questions, "go with your
  recs"; passes/desktop.md):** room = dock top − 4 − tagline bottom − 10; F = max(600 · room / 411, people ≥ 9 pt) × **DESK.kF 1.4** (easing
  back to ×1 when the room is under ~220 pt — a phone sideways), CAMH = min(13.5, 0.55 (0.4 short) · room · 36.5 / F, **DESK.camh 8**), the
  near edge (the line above the dock) at **z DESK.zFront 50** (a phone: 36.5) — closer + LOWER: the water + the skyline the picture, the
  promenade a shallow band that runs on past the dock's top to the screen's foot (the dock floats over its middle). The numbers were picked by
  the feasibility check: the skyline keeps the phone's own squeeze (~0.66) + the word towers' faces exactly the phone's (WORD_FACES: a quay
  hero in front trimmed ≤ 12 %) — 1.65× had flattened it to 0.45 + cost the faces 7 rows. **COMPOSED up to DESK.wMax 2.2 : 1**: wider, the
  composition frame starts at cam.cx0 (the speakeasy at its left edge) and a soft fade to dark covers the rest (css/title.css .nd-scene::after,
  0 wide at ≤ 2.2 : 1). Everything that enters (people, cars, boats) spawns past the REAL screen edge (cam.hw / cam.W), so it comes in
  through the fade. Wide-only fixes: the billboard on a taller frame clear of the roof's guests + the string pole (the low eye looks UP at
  the roof), the EMPIRE kept second, the wheel by the phone's rule (just right of the speakeasy — off the word face), the billboard wins
  over a panorama sign. The sign ~1.25× bigger on a desktop (the wide media query); a phone sideways: the sign smaller + the dock scaled
  0.8 (the landscape-short query). The panorama (towers further out, the promenade to the right edge) is Part 1's, still generated.
- **THE RESIZE (DESKTOP):** while the window changes the last frame is HELD at its built size + the whole layer scaled uniformly (cover,
  anchored bottom-centre — scene.js#pinResize); the debounced re-fit (180 ms) lays out + draws in one frame + lets go; a pixel-ratio change
  (another monitor) is caught by a per-frame devicePixelRatio read + the media query. THE PIXEL BUDGET (harbor-tiers sceneMp: 1.6 / 2.0 /
  2.6 MP — measured: 60 fps at 1920×1080 on a DPR 2 screen) caps the scene + fireworks canvases' ratio on a big monitor — a phone never reaches it.
- **DESKTOP COMES FREE (the standing rule, CLAUDE.md):** phone-first always; every pass checks ONE desktop size (1440×900, shots.mjs `--sizes
  pass`) beside the three phone widths; sideways + iPad only in a desktop pass + FR6 (`--sizes desk-pass`); e2e-harbor `desktop` proves the
  camera, the dock, the hover, Esc, the resize, the iPad, a phone sideways + a phone untouched.
- **The squeeze** (`squeeze(cam, yMax)`): above a knee (55 % of the way from the limit down to the horizon; lower for a short
  strip of sky) the height above the knee is scaled by s with a soft start, so the highest top (crown included) lands on the limit.
  Monotonic (taller stays taller), low roofs untouched. **Part 2 (the owner's call, Oct 21 2026: "same skyline, extra sky"):** an
  upright phone uses the REFERENCE phone's squeeze (`REF_TITLE`, 402×874 — the tightest) — the composition is placed by screen
  fraction (`fxAt(f, z)`), so every phone shows exactly the same skyline scaled to its width, s = 0.65 everywhere; a roomier phone
  (412×915: ~30 pt) keeps more sky above the crowns; a phone tighter than the reference falls back to its own limit (min of
  the two). A wide screen fits its own.
- **Depths:** haze band z 620–820; far band 380–560; mid band 300–360; landmarks 255–290 (+14 deep, tiers step in 26 % and back
  1.3); near band 232–250; hero blocks + the far quay 230 (top 0.4, foot −1.2; lamps every 11); water 64–230; railing z 64 (y 1.1);
  road z 54–64 (lane at 59); promenade z 30–54; the speakeasy z 44–60, 10.5 tall, 11.2 wide, its x0 28 pt past the left edge.
- **The towers** (Part 2, `TOWERS`: screen fraction f, z, width, height + crown, before the squeeze): the two dominant ones —
  the SUNBURST 0.622/258/12.5/96+17 (the city's one gold crown) and the EMPIRE 0.105/266/15/90+15 (five setbacks, the mooring
  mast; our own design) — and the slimmer NEEDLE 0.49/286/8.5/80+18; the WORD towers wordA 0.765/247 (19 cols × 1.25, rows 1.95)
  and wordB 0.94/247 (15 cols) side by side for horizontal words (Part 3: wordA 0.759 + wordB 0.928, pitch 1.1 — both whole on
  screen with the lighthouse in the slot between them), wordV 0.25/258 (5 cols × 2.0, rows 1.95) for vertical ones; the
  middle tier in clusters (m-edge −0.012, m-dome 0.395, m-twin 0.44, m-step 0.565, m-right 0.99; 46–62 tall); the newer city's
  glass glassL 0.364/470 and glassR 0.79/540 (far, hazy). Forms (tiers + insets): sunburst, empire, needle, deco, slab, stepped,
  dome, modern. On screen above the waterline (402×874): sunburst 222 pt · EMPIRE 205 · wordV 205 · needle 187 · glass 160–168 ·
  word towers 154–160 · middle tier 103–143 · the bands ≤ 142. A panorama adds towers both sides (forms cycle, every fourth a
  glass tower), with corridors between them on screen. **Hero blocks:** hotel 10..24 z230 h36 (blade sign; Part 2 moved it 2 left,
  clear of the corridor beside the sunburst) · PULSE −14..2 z233 h28 · NEON PAR 38..56 z234 h30 · JAZZ −50..−38 z230 h30 (roof tubes).
- **The bands** (haze z 620–820 h 52–96 · far 380–560 h 44–80 · mid 300–360 h 26–46 · near 232–250 h 20–34, packed: neighbours
  overlap 0.6), shaped by the middle tier's clusters (f 0.03, 0.4, 0.56, 0.98); brick only in the near band.
- **Harbor:** THE WHEEL STANDS ON ITS PIER OVER WATER (Part 2, the owner's review): z 132, r 12.6, its hub r + 5.4 up, its A-frame
  legs ±0.42 r; on a phone its x is the first where the left leg is ≥ 12 pt clear of the speakeasy's back corner (≈ 45 % across:
  the speakeasy hides the water left of ~36 %); its deck lands ~10 pt below the speakeasy's roofline, never level with it (tested
  at six sizes); a wide screen keeps it at −30·k (z-scaled). The pier runs under it from z 118 to the quay (7 wide: pilings,
  planks, a railing, lamps); **Part 5:** it widens into a PLATFORM under the wheel (`pier.head`: x ± (leg · r + 1.4), z ± 6) so
  the A-frames (± 1.7 in z) stand on its deck. Clear of the word towers and the hero crowns. Breakwater around the lighthouse z 150; lighthouse x 46 z 150 h 26 (r 2.4 → 1.7, bands at 25–38 % and
  60–73 %, gallery, lantern, dome); the keeper's cottage beside it. **Part 3:** on a phone it stands at f 0.8502 (z 150), in the
  slot between the two horizontal word towers (its gallery 2.3 wide fits between their faces; `lighthouseBoxes()` counts in the
  faces' cover, tested); a wide screen keeps x 46·k. Boats (Part 2: re-spaced so the harbor stays open around the pier; by screen fraction):
  Rosie 0.73 z 142 (24 long), the taxi 0.88 z 94, the tug at night / a sailboat by day 0.585 z 214, a second sailboat by day 0.92 z 205. **Part 5:**
  they sail on the clock (`core/harbor-boats.js`; these x are only their home marks): the tug 9.5 long, the sailboats 6.5 × 10.
- **Stage** (positions relative to the speakeasy's right face, −5.6 on the phone): stop lights at +2.6 (dir 1) and +18.1 (dir −1),
  z 54.6; the bus +13.6 z 60; cars +20.1 z 57.5, −2.4 z 57, −9.4 z 61; lamps +2 / +11 / +18.2 z 47 and +14.2 z 37; trees +4.4 / +15.4
  z 47.3, the front corners at z 37.4 (right: 84 % of the half-width; left: −6); bench +12.8 z 47.8; planters +0.2 / +6 z 43; the
  cart +9.2 z 37.6; people: at the cart, the doorman by the door, a couple, a dog walker, the cab hail, a stroller, a walker.
- **The SIZE table** (`SIZE`, pt at the reference phone at the thing's usual depth → `units(name)` world units): person 20 @ z 47
  (1.57 u), car 55 @ 58, bus 110 @ 60 (11 u), lamp 50 @ 47, canopy 40 @ 47, stop light 55 @ 54.6.
- **The sun gaps** (`SUN_GAPS`, Part 2, screen fraction / width pt × the city's scale): 0.046/6, 0.19/9, 0.322/8 (sunrise side) ·
  0.669/6, 0.84/6 (sunset side; Part 3: 0.851 → 0.84, between the word towers) — chosen against the WHOLE silhouette: no tower tier, landmark, hero crown or panorama tower
  stands in one (tested at six sizes, side faces included); a panorama adds corridors midway between its towers. Below a
  corridor's FLOOR the city stays one dense wall: a band's block there is CLIPPED (split; the piece in the corridor lowered to
  its band's floor: near 78, mid 84, far 100, haze 122 ref pt above the waterline — the farther bands stand higher behind), never
  dropped (tested: no hole through the base); a hero block may stand under one only if its roof is at the floor (JAZZ).
- **The door:** the front face's u 9.05–10.55, 2.6 tall; the tap target ≥ 44 × 44 pt around it (on screen, clear of the dock and
  the corner buttons — tested at every size).

## Lanes + events (`js/core/harbor-events.js`)
- **Lanes:** `sky-high, sky-low, skyline, water, road, promenade, windows, rooftop` — each a PLACE: `core/harbor-layout.js#laneRects`
  gives every lane a screen rect (`L.lanes`, pt), where its events draw:

| lane | rect | 390×844 (iPhone safe areas) |
| --- | --- | --- |
| `sky-high` | safe top + 4 .. the neon's top − 4, stopping 4 pt left of the music button and (7a §0, the split corners) starting 4 pt right of the ☰ (`cam.cornerL`) — the banner plane's strip | ≈ 52,66 · 278×76 (the sign 24 pt higher) |
| `sky-low` | the tagline's bottom + 4 .. the roofline's median (things here pass BEHIND the taller roofs); once the tagline has faded (`cam.tagGone`, Part 2) from the word's bottom + 4 (`y0NoTag`): the freed band joins the lane (banner plane, fireworks, the moon) | 0,329 · 390×≈80 |
| `tagline` | the tagline's own band ± 3 pt: THE TAGLINE SLOT (Part 2) — later parts bring a line back there briefly (holidays, the countdown) with `S.tagSlot(text, ms)` (title.js); their events claim this lane | the tag's rect |
| `skyline` | the skyline limit .. the far quay | full width |
| `water` | the tallest boat's top .. the railing | full width |
| `road` | a bus's top on the far lane .. the near kerb | full width |
| `promenade` | a float two people tall at the far edge .. the dock's top (never under it) | full width |
| `windows` / `rooftop` | the speakeasy's upper front face / the space over its roof (clipped to the screen) | — |

  The lanes overlap where one lane's things stand in front of the next (boats over the skyline's feet, floats over the road).
  `LANE_MIN` / `laneMin(cam, id)`: sky-high ≥ 40 pt, sky-low ≥ 24 (screen pt); the world lanes scale with the city (a phone
  sideways: smaller). Tested at the six sizes: on screen, tall enough, clear of the neon, the word, the tagline, the corner
  buttons and the dock; the E2E checks them against the real sign. The sign's rects come from the title (`textRects`, the
  corner buttons from `clear`); when they move and the city doesn't, only the lanes are re-computed (no bake).
- **An event:** `{ id, lanes, when(ctx), rarity: common | weekly | rare | legendary, duration (≤ 8 slots), cost (ms/frame), heavy?, seed }`
  — `defineEvent()` checks it. ctx = `ctxAt(ms)` — **a function of ms only** (the replay asks it about the past): Part 1.5 has
  `{ ms, force }`; Part 6 adds the sun / season / holiday at that moment from core/sky.js.
- **The scheduler is STATE** (`createScheduler(events, ctxAt, { seed, forced, anchor })`): time is cut into 90 s slots; each slot
  rolls its own dice from the slot number + the seed. What slot n admits depends on what still runs from earlier slots, so the
  past is decided ONCE: the scene makes one scheduler when it first reads the look, anchored at **the local midnight one day
  back** (`anchorFor(ms, LK.local)`), replays to now once (≤ 1920 slots, a fraction of a ms per slot), then `at(clock.now())`
  every 500 ms decides only the new slots (`&speed` just decides them faster; a jump of more than two days starts over a day
  back). Schedulers with different anchors (a session that crossed midnight vs. a fresh load) agree from the first slot both find
  the lanes free — tested: identical an hour after midnight. `schedule(events, ms, ctxAt)` is the from-scratch form (tests,
  previews; anchor = the UTC midnight a day back). Rules per slot: an eligible event starts with chance `slot / period`
  (common: every ~4 slots; weekly: once a week; rare: once a month; legendary: once a year). Rarer first; never two events in
  one lane at once; one of each at a time; the frame budget `BUDGET` (2.5 ms in all, 1.5 per lane) holds; only one heavy event
  at a time. Forced ids (previews) start in every slot, first.
- **Heavy events thin the others:** a heavy event quiets every lane it does not use (`quiet`); the scene turns that into
  `fs.density` (`densityOf`: 1, or `QUIET` = 0.3 in a quiet lane). The district's modules read it when the scene passes it (the
  default city never does, so nothing changes there): the planes (`aircraft.js`: max planes × density — no new plane in a quiet
  sky), the geese + the heron (no new flock while the sky is quiet), the swifts (the skyline lane), the cars (`drawTraffic`: that
  share of the cars; the bus stays).
- **Part 1's only event:** `demo` (lane `sky-low`, debug-only, `&force=demo`) — a labelled lantern crossing the middle of the
  sky-low rect, proving the pipeline end to end (scene → scheduler → `harbor().events` → drawn in its lane).
- **Part 2's events:** `searchlights` (lane `skyline`, rare — a "grand opening" night, 12 min; `&force=searchlights`) and `spell`
  (lane `windows`, weekly, 6 min: a word from `SPELL_WORDS` — ♥, ★, HI, JAZZ, NEON, JOY; `&force=spell&text=…`). Both night only:
  the scene's `ctxAt(ms)` now carries `night` (the real sun under −6° at that moment, `sunPosition` — a function of ms only;
  ALWAYS NIGHT: always). The `windows` lane now means every addressable window (the skyline's + the speakeasy's).
- **Part 6a's events** (the everyday sky; the ctx now carries the sun's `el` + `az`, the `month`, `south` — functions of ms only):
  `banner` (sky-high, a new rarity `daily` = a third of a day's period, by daylight), `helicopter` (sky-low, daily), `balloons` (sky-low,
  daily, only in the balloon hours: `harbor-sky.js#balloonTime`), `balloon-festival` (both sky lanes, rare, HEAVY). The live weather is
  checked when a piece starts (`skyfx.js`), never in `when()` (the replay can't know the past's wind). Skywriting, skytyping and the
  drone show are NOT scheduler events (the owner's call): the API + THE HOLIDAY SKY on the clock. The sky's own pieces report their
  lanes (the planes keep off them) and a heavy piece's quiet (`skyfx.quiet()`, merged into `fs.density`).
- Tests (`tests/harbor.test.mjs`): `schedule(t)` and `schedule(t − SLOT_MS)` agree on every event spanning both; the stateful
  scheduler sampled every 30 s for 3000 slots of a contended case (5 sky events of 4 slots, 5 water events of 6, 3 heavy
  parade-length events of 8 in the promenade) never pops an event in or drops one, and matches a fresh replay; anchors a day
  apart agree; lanes, budget, heavy, rarity, `when()`, forced.

## Performance

**THE CITY's LONG NIGHT (Nov 12 night — passes/jaywalk-cards.md Group 4):** the city is destroyed + rebuilt on every room / game / menu trip
(THE CITY PAUSE), so **every module the scene creates is destroyed in `scene.js#destroy()`**, and a module's teardown frees its canvases AT ONCE
(`ui/canvas-safe.js#freeCanvases` — WebKit keeps a dropped canvas's pixels until its next GC); the title STOPS the city at once (`scene.halt()`), its
teardown after the 420-ms fade — never a frame after the unmount. A NEW module with canvases = a destroy that frees them + its call in destroy()
(`tests/longnight.test.mjs`). Proof: the harbor `longnight` group (Chromium) + `tests/integration/wk-longnight.mjs` (WebKit, 30 + 10 trips — the night's
peak of live canvases 457 → 266, its MB 79 → 62).
- **THE EDGE CACHE — DEFERRED to THE LAUNCH (FR7 FIXES B, Nov 12 — the owner checks every deploy on his iPhone at once):** today the worker is
network-first + `no-cache` (every file re-asked on a repeat visit — 356 requests warm, measured) and `/js` `/css` `/assets` carry no cache header. The
built + proven change (5 min at the edge + the worker's ONE COPY PER DEPLOY by `/api/time`'s build id — 15 requests warm) ships with THE LAUNCH:
docs/launch.md step 8 (`git revert` of "THE EDGE CACHE out"; proof `wk-edge.mjs`). Every Cache Storage wait in today's worker is bounded (the
activation 2 s, the offline reads 0.8 s) — Safari's storage can stop answering with two tabs open (THE TWO-TAB HANG; `wk-twotabs.mjs`).
- **THE LOAD GATE (FP3a, FREV B1 — the iPhone's "shrinks, enlarges, snaps" on load):** the city is held DARK until its first full frame
  is ready and revealed with ONE fade; Safari's bar changes in the load window are coalesced into one build; a baked layer is never
  stretched; no tier step during load. The detail: FP3a §5 below; tested by the `load` group (the `city` job). POLISH 5: THE LOAD LOG
  (&debug=1) + the causes that still moved the picture after the reveal fixed — docs/harbor/passes/polish-5.md §0.
  **THE LOAD FIX (Nov 6 — the owner's iPhone: doubled lettering, chunks, the top-centre "toggle", a stray screen; passes/load-fix.md):**
  (1) **THE BOOT SCREEN HOLDS UNTIL THE CITY's REVEAL** (`app.js#dismissBoot` → `title.js#cityShown`, ≤ 9 s; the Harbor's module ≤ 30 s): under
  it the city reveals AT ONCE (`.nd-scene.is-now`, the scene's `revealInstant` — no fade of its own) and the boot screen's 0.5 s fade is
  the ONE fade — never THE DARK TITLE (the sign + the dock over black) between them; the boot screen's unlit sign + SPEAKEASY sit EXACTLY
  on the title's (index.html `#boot` = css/title.css `.nd-sign` — keep the two in step: a cross-fade ghosts the sign otherwise).
  (2) **ONE CAMERA ON SCREEN** (`scene.js#holdStart` / `holdTick`): any camera change after the reveal holds the last frame AS SEEN (every
  canvas of the layer, the crisp lettering mapped the way the pin shows it — `holdShoot`) over the city until the new camera is baked
  (the city + the lit windows, no crossfade under it, the bigger slices), then CUTS to it in one frame (≤ 4 s) — never the old bake under
  the new live layers + crisp lettering; never a dissolve between two cameras (that IS two copies). A bar move keeps the city for ALL
  the title's rects (the dock AND the tagline — `cam.tagBase`), and a viewport size the resize handler hasn't seen yet counts as the bars
  moving. A ResizeObserver on the layer pins a box change before it paints; the sign's halo is drawn through the pin (`pinT`).
  (3) **THE #net PILL** hidden from the first frame (index.html: `.net { opacity: 0 }` + no transition before css-ready) — it shows only
  for a real lost signal. (4) A late reveal waits ≤ 2 s more while its bake stands at another camera. Proof: the harbor `load` group's
  four THE LOAD FIX checks (kit/load-probe.mjs) + `tests/integration/wk-load.mjs` (THE BOOT IN WEBKIT, `--safari` = the bars).
- **THE BOOT BUDGET (LOAD FIX 2, Nov 9 — the owner's iPhone: "slow to load, EVERY time"; passes/load-fix-2.md):** what a phone fetches
  before the city's reveal is BUDGETED in `tests/integration/boot-budget.json` — **310 modules / 6500 KB** of module source (the static
  check: `tests/boot-budget.test.mjs`, THE BOOT PRELOAD's list) and **360 requests / 2900 KB on the wire, NO AUDIO** (the harbor `load`
  group's THE BOOT BUDGET — the real boot, cold, 402×874 @3). Set from this pass (298 modules / 6191 KB; 328–342 requests / ~2640 KB) + a
  small margin; **raising a number is a decision a pass names in its summary** (like PERF_BASELINE). The rules under it:
  (1) **THE BOOT PRELOAD** (`scripts/build-boot-preload.mjs` → index.html, GENERATED; `tests/boot-preload.test.mjs` fails when stale —
  re-run it after a module's imports change): every module the first picture needs asked for at once (`modulepreload`) once the four core
  sheets are in — never the import waterfall (the boot graph + the city's graph were ~22 round trips deep, every file revalidated on every
  load). A new dynamic import every load makes before the reveal → its entry in `ENTRIES`.
  (2) **NOTHING BEFORE THE REVEAL THAT THE FIRST PICTURE DOESN'T NEED** — the station's song waits for the first tap (`party-music.js`),
  the preview panel preloaded + started at the city's start, in the hidden frames (`title.js` — evaluated after the reveal it hitched a
  frame in view); no /api call holds the reveal but the weather (≤ 2.5 s, only with nothing
  kept on the device).
  (3) **`lookAt = 0` FORCES the look's read** (`scene.js#refreshLook`) — it once couldn't before the page was 2.5 s old (THE LOOK TRAP).
  (4) Hidden frames before the reveal feed the bake (22 ms), the lit windows (12) + the clouds' first set (22) bigger slices.
  **How to measure (the one command):** `node tests/integration/boot-time.mjs "<browser>" --runs 3 [--cpu 4 --net wifi] [--warm]
  [--trace]` — the boot screen, THE REVEAL, the first tap, the requests + bytes + long tasks before the reveal (and after it); `E2E_BASE`
  for a worktree (A/B); `LIVE=1 … --live --base https://neonspeakeasy.com --tap 0` = a read-only timing of the live site. WebKit:
  `wk-load.mjs --scene grey,night --bars none --runs 3 --log` (the LOAD LOG's reveal line names when each gate opened + what held it).
- **THE BOOT SAFETY NET (LOAD FIX 3, Nov 10 — the owner's iPhone: "the site sometimes freezes completely while loading"; passes/load-fix-3.md):**
  THE FREEZE was ONE failed or never-answered request among the boot's ~310 module files: the app's graph never ran, so nothing could notice
  — the boot screen held forever. Now: **THE BOOT WATCHDOG** (inline in index.html — a classic script ahead of every module; `window.__boot`):
  the app's graph failing to load / link → at once; no reveal after **12 s ON SCREEN** → a **BOOT HANG** report (/admin → Reports from phones:
  the stage, the modules that never arrived, the errors) → the app reveals what is ready (`app.js#__bootOut`) or **ONE reload** (never two
  without a reveal between), then TAP TO TRY AGAIN; a link error (two deploys' files) re-fetches the boot's modules first. **THE HANG WATCH
  starts at boot** (its worker made there; the scene feeds it — `harbor/report.js`). The core sheets counted once each + a failed one asked
  for again; the city's module tried 3 times; the service worker tries the network twice. Proof: the `load` group's THE BOOT SAFETY NET (six
  faults forced once → revealed + the first tap answered) + `tests/integration/wk-freeze.mjs` (WebKit, THE LINE — `kit/line-proxy.mjs`:
  Vercel's ETags, a phone's line, drop / fail / stall / mangle / the deploy switch) + `tests/boot-watchdog.test.mjs`. The reveal unchanged
  (1.33 s Chromium).
- **LOAD FIX 4 — GROK'S BOOT AUDIT (Nov 10; passes/load-fix-4.md + the audit):** **THE REJOIN LIMIT** — the boot's uplink (the gstatic SDK, the
  auth restore, the room resume) waits ≤ 8 s ON SCREEN, then the title + the city come up with REJOIN (the seat kept, the socket still trying); the
  late resume = a normal rejoin; ONE attempt (`room.js#pendingResume` — a REJOIN tap joins it; `cancelResume` — a HOST / another JOIN wins).
  **THE SKEW WRAPPER** — every dynamic import through `js/ui/lazy-import.js` (a link error / failed fetch → `/api/time`'s deploy id `v` vs the page's
  first → changed = ONE reload per deploy, held while a match is played here; the same deploy = the caller's own handling); the city's graph:
  a link error skips the 3 tries → `__boot.reload(why, { skew: true })` (the boot's files re-fetched, then the one reload). **THE BOOT'S GATES IN
  VISIBLE TIME** (`js/ui/onscreen.js` — the scene's REVEAL_MAX / WX_WAIT / FONT_WAIT, the title's 7.5 s, app.js's 9 s + 30 s, the 8 s above).
  Also: no regex lookbehind (iOS 16.0–16.3 — the profanity filter), a core sheet failing TWICE → the watchdog's reload, the hang watch's full
  snapshot every 5 s, the service worker writing only changed copies (one per page, no throwaway query, ≤ 700), the load log 60 + 60 rows.
  Proof: the `load` group (THE REJOIN LIMIT, a sheet failed twice), `wk-skew.mjs`, `wk-hidden.mjs`, `sw-cache.mjs`. The reveal 1.32 s (unchanged).
- **THE LOST LOOK — THE BLANK CITY AFTER BEING AWAY (FR7 FIXES A's add-on, Nov 12 — a tester's iPhone: back to a tab that sat in the background, blank sky + black ground, the crisp lettering + the DOM signs still there; a refresh fixed it):** iOS can discard a canvas's backing store in the background. Every canvas through `ui/canvas-safe.js` is WATCHED (the 2D `contextlost` / `contextrestored` events; `anyLost()` = `isContextLost()` on a return) and the scene keeps a SENTINEL — one opaque pixel of a finished bake, picked by the once-a-second look (never in a frame). On every return (visible · pageshow · focus) + on a lost event: a lost context or a blank sentinel → THE ONE RE-FIT PATH: the DARK held over the city (`holdStart` with a dark picture — the old one IS the blank), the sky + every layer re-painted (`build` → `layout` → the bakers re-planned), the hold lets go when the new bake is in — ONE cut; `reportLost` tells the effect library (THE VAULT's cards drop their sprites, a lost surface gets a fresh canvas). At most once every 5 s. Proof: `kit/two-cameras.mjs` path `lost-hidden` (every canvas wiped while hidden, as iOS does it with no event → whole again in ~0.5 s in WebKit, one camera, no refresh; with the look switched off: never). `__district.lost()` says what happened.
- **LOAD FIX 5 — THE DOUBLED CITY + NO TWO CAMERAS (Nov 11 — the owner's iPhone, the first open of the day: the billboard, EST. 1924 + the
  blade each TWICE, for good; passes/load-fix-5.md):** the city's box is `100lvh` and can change with NO window `resize` (Safari settling its
  large viewport while it reloads the tab it restores at launch). **THE BOX GATE** (`scene.js` — `boxSeen` / `boxOff` / `boxCheck` / `boxLook`):
  ONE question on every path — *is the city BUILT for the box it is shown in?* — and ONE answer, the re-fit path that already existed
  (`onResize` → the pin after the reveal → the debounced `build()` → `layout()` → `holdStart`). Who asks it: the layer's ResizeObserver
  **from the first frame** (it returned before the reveal — the hole: the canvas stayed CSS cover-fitted 1.08× into the new box under the
  crisp lettering, and nothing compared the two again); **the reveal** (`ready` needs a city built for its box + ONE last look in the frame
  that would reveal; a late reveal waits ≤ 2 s more); **THE NET** — a look once a second + at every return to the screen (the loop
  watchdog's interval, `visibilitychange`, `pageshow` — one layout read, never in a frame). LIKE FOR LIKE: the canvas's own box, only while
  the stylesheet lays it out (a twice-failed `css/title.css` leaves the canvas's box following its buffer — never compared).
  **THE HELD PICTURE'S SAFETY** (`HOLD_MAX` 4 s) counts time ON SCREEN (`ui/onscreen.js`): a camera change that landed while the tab was
  hidden stays held, bakes under the picture and cuts once back (on the wall clock the first frame back let it go unbaked — ~2 s doubled).
  **A NEW PATH THAT CHANGES THE CAMERA / THE BOX** (a new resize source, a new layer placed in px over the city) goes through `onResize` /
  `layout()` — never its own canvas resize — and gets its row in `kit/two-cameras.mjs`.
  **THE GUARD — NO TWO CAMERAS** (ONE runner, `tests/integration/kit/two-cameras.mjs`, both engines): every path that can change the camera,
  the box or the bake — the box before the reveal (the owner's), shrinking, after the reveal, while hidden, a restored tab (BACK), a bfcache
  return, a frozen tab resumed, hours hidden (the phone's + the server's clock +10 h), the viewport changing while hidden, the late weather,
  Safari's bars, a resize, a tier step, a box no observer reported — each fails if ANY painted frame has the bake / the lit windows at another
  camera's geometry than the city's now or the canvas CSS-fitted to a box it was not built for with no pin (`kit/load-probe.mjs#CAM_REC` +
  `camJudge`), if the billboard's face / EST. 1924 / the blade has a second copy in the PIXELS at a steady moment (the crisp layer hidden
  for one screenshot — `crisp.js` names its canvases, `data-item`), or if more than ONE scene / frame loop is alive (`loadProbe().live`).
  **THE ONE COMMAND:** `node tests/integration/wk-double.mjs` (Safari's engine, 402 × 659 @3, the owner's morning — 21 paths, ~5 min;
  `--paths a,b` `--shots DIR` `--log`); in the suite: the harbor **`cameras`** group (`ONLY=cameras`, Chromium, 11 paths three pages at a
  time, ~85 s — the `lobby` job). Before the fix: 9 of 19 paths red in WebKit, 7 of 11 in the group. The reveal 1.32 s (unchanged).
- **NOTHING IN THE SKY CHANGES BY A CUT AFTER THE REVEAL (LOAD FIX 2):** a cloud re-plan never frees a set on screen (a new field waits
  while a blend shows both sets; an unbaked incoming set is replaced while the old one keeps showing); every set after the reveal blends
  over 6 s (a late reveal's first set too); any new weather answer after the reveal blends the sky + the bake; a clock jump the real time
  doesn't explain (≤ 15 min) is taken out of the clouds' time. Proof: the `load` group's THE SKY AFTER THE REVEAL (two loads — a late
  answer + a second one inside its blend; the server's clock 5 min ahead, late) + `tests/integration/sky-snap.mjs` (seven cases, `--cpu 4`
  the slow phone) — both on `kit/load-probe.mjs#skyJudge` (a CUT, the shown clouds falling > 25 % in a frame, one cloud jumping > 4 pt).
- **Baseline: today's city** (`title-perf.mjs`, 390×844 at DPR 3 capped to the tier, Chrome, 4× CPU, Oct 20 2026), the scene's own
  draw cost per frame (mean / p50 / p95): **party peak** t2 8.9 / 8.8 / 10.7 ms · t1 10.3 / 10.2 / 12.7 · t0 6.4 / 6.2 / 8.0;
  night t2 6.6 · t1 6.0 · t0 5.4; day t2 4.4 · t1 5.7 · t0 5.4. Frames held 16.7 ms everywhere.
- **REAL PHONES DECIDE (Part 6a, the owner's rule):** the laptop's 4×-CPU, no-GPU bench is an EARLY WARNING, not the verdict. On the
  owner's iPhone (Oct 21 2026, a party night, `&debug=1`) the Harbor used **1–3 ms of work a frame at a steady 60 fps with 0 % slow
  frames** — while the bench said ~6.4 ms for the same scene. So: measure once while building + ONE careful A-B-B-A round at the end
  (only the scenes that changed); if the bench says over, one fix attempt + one re-measure, then report the numbers and let the owner
  check her phone (`&debug=1`) — never quietly lower the look.
- **THE TIER ON MODERN iPHONES (Part 6a):** that same iPhone ran **tier 1** (DPR 1.5). The cause: `title.js` started every DPR-3 screen
  reporting ≤ 4 cores at tier 1 — and iOS Safari caps `navigator.hardwareConcurrency` (privacy), so EVERY modern iPhone started there,
  and nothing ever stepped back up. Now the Harbor starts every phone at **tier 2** (DPR 2, visibly sharper); the automatic
  step-down still protects a slow phone (p75 frame > 19.5 ms, never in the first 2.5 s after the city shows — the first bakes and the
  power-on are a transient); and a stepped-down city steps back UP after 20 s at a steady 60 fps with light work (p75 ≤ 17.5 ms, ≤ 5 %
  of frames over 20 ms, mean work ≤ 4.5 ms, p95 ≤ 8) — at most twice a session, never after a step-down that followed a step-up,
  never after `setTier()` from outside (tests + perf runs keep their tier). City 1.0 keeps its old start. The readout (`&debug=1`)
  shows the tier + DPR top left.
- **Budgets for City 2.0** (C1.5: WARNINGS, never the gate — the gate is the relative A/B + the owner's iPhone; why: the five-run
  noise table in docs/harbor/review-2.md §1a) (phone, 4× CPU): **tier 2 ≤ 8 ms** of scene work a frame on average, 60 fps; **tier 1 ≤ 6 ms** (DPR
  1.5, fewer moving things, no bloom passes over the whole screen); **tier 0 ≤ 4 ms** (DPR 1, the calm city: the baked layers +
  the lights; moving things thinned to a few, effects off — never broken, never ugly). The scene steps down a tier when the
  75th-percentile frame passes 19.5 ms (like the district). Each later part measures before it builds and keeps these.
- **Part 1 measured:** t2 3.2 ms · t1 3.1 · t0 2.9 (party), 3.0 / 2.8 / 2.7 (day) on the same bench; the E2E's party peak at 4×
  CPU: t2 4.5 · t1 3.9 · t0 3.7 ms — 60 fps at every tier.
- **Part 2 measured** (`title-perf.mjs --city 2`, 390×844, 4× CPU, `&force=no-planes` — see Known issues), mean ms of scene work
  t2 / t1 / t0: party 3.2 / 3.6 / 3.5 · night 3.2 / 3.2 / 2.9 · day 2.6 / 2.7 / 2.5 · golden (the rays) 4.0 / 3.8 / 3.4 ·
  searchlights 3.6 / 3.8 / 3.5 · searchlights + a word 3.8 / 4.2 / 3.2 — within 8 / 6 / 4 everywhere, frames 16.7 ms. The E2E's
  party peak: t2 4.7 · t1 4.1 · t0 4.3. Memory: 22.9 MB of 64 at 390×844 tier 2 (the lit windows' two layers ≈ 2.3 MB of it).
  The rays thin out by tier (tier 0: the shafts behind the city only, 3 per corridor); the lit windows bake on the light key
  only (a few times an hour at dusk / bedtime), never in a frame that bakes a facade step.
- **First visit** (ROADMAP "First-visit speed"): profiled Oct 20 2026 — TAP TO ENTER is up at **0.49 s** cold in e2e-title (the
  1.5 s target is met; the ~2.2 s noted on Oct 20 does not reproduce — the commits of that week note absolute timings moving with
  the machine's load). At 4× CPU a cold start: today's city 1.40 s (its first build + frame is one 645 ms task), the Harbor 1.21 s
  (372 ms: the layout + the sky + the first frame; the city itself bakes in small steps AFTER the first frame). The rest is the
  browser's own work (style, layout, paint, compile ~1 s at 4×). `core/sky.js#localParts` (Intl formatToParts, ~60 ms at 4×) is
  the biggest JS item in both; caching its formatter did not help (the parts call dominates) and was not kept. City 2.0 never
  blocks the first frame on the city.

## Stubs — to come in Part N
| API / piece | Part 1 | built in |
| --- | --- | --- |
| ~~`signCount()` → 0, `debug().signs` [], `hit` never returns `sign`~~ — done in Part 3 (`neon.count()`: signs + billboards + outlines; `hit` → `{ kind: 'sign', id }`) | | ✅ 3 |
| the word towers' faces carry no signs; the searchlights' party / holiday use, holiday windows (`set()`), party windows | the API + the events | 10, 11 |
| ~~the sky's artwork (the moon's art: Part 2 only fits its path)~~ — done in Part 6a (`moon.js`) | | ✅ 6a |
| ~~the hero blocks' signs~~ — done in Part 3 | | ✅ 3 |
| ~~the neon's REFLECTIONS in the harbor~~ — done in Part 4 (the water mirrors the frame itself; `reflections()` stays for later parts) | | ✅ 4 |
| holiday schemes on the outlines + the sign dressings (`moment('scheme', id)`; `LOGO_ANCHORS`) | hooks + previews | 11a–c |
| ~~party nights' neon~~ — done in NEON PASS 3 (THE PARTY SHOW: `core/harbor-show.js`; Part 10 keeps the midnight finale + fireworks on its hooks: `f.finale`, `PT.drop` / `PT.big`) | | ✅ NP3 |
| a game's colours across the skyline at its start (`moment('flash', { game })`), the sign swap (`gameLogoSvg`) | hooks | Lobby 2.0 |
| a billboard's content, a skyline scheme (`billboard(id, show)`, `moment('scheme', …)`) | hooks | CITY CONTROL |
| ~~the water: a flat band~~ — done in Part 4 (the live mirror, the columns, the ripples, the paths) | | ✅ 4 |
| ~~the hero pieces' reflections + wakes~~ — done in Part 5 (the wheel, the boats, the beam reflect through `water.reflect`; the lighthouse from the baked layer; wakes drawn per frame from each boat's own path — `water.wake()` stays unused) | | ✅ 5 |
| ~~the fog over the water~~ — done in 9a (`waterfog.js`); rain RINGS on the water (`water.set({ rain })` roughens the mirror) | hooks | ATM |
| fireworks doubled in the harbor (low ones reflect already; high ones: `water.light()`), the ghost ship's glow (11a) | hooks | 10, 11a |
| ~~the wheel, the lighthouse, the pier, the boats~~ — done in Part 5 | | ✅ 5 |
| the wheel's / the beam's / Rosie's holiday + party colours (`wheel.scheme`, `lighthouse.set({ colour })`, `boats.set({ rosie })`), the lit boat parade, the ghost ship, the party yacht + helicopter (new routes in `core/harbor-boats.js`), the eggs (the 3-tap spin is built; a gondola rocking, a boat's horn) | hooks + previews | 10, 11a–c, 12 |
| the elevated train | not built (the owner's call — Part 5's notes) | ? |
| the waterfront's shops: people walking in / out, a door opening, holiday dressings on the awnings (`SHOPS`, `storefronts(L)`) | lit storefronts, no people | 8, 11a–c |
| the drone show's hold-as-one-image fallback (only if it's over budget on the owner's iPhone) | colours + waves built | on the owner's call |
| CITY CONTROL's drone colour picker (`harbor().sky.drones(specs, { colour, colours, by, cycle, wave })`) | the API | CITY CONTROL |
| ~~the sky's artwork: planes, birds~~ — done in Part 6a (the Harbor's own `air.js`, `birds.js`; the district's aircraft + wildlife are no longer loaded) | | ✅ 6a |
| the UFO, the jets + the air show, skydivers, the witch, Santa's sleigh (`fx.mid` is not called: the cat / UFO / window glyphs don't show; the witch + the sleigh are still the district's art in `fx.back`) | the district's art | 6b |
| ~~the speakeasy's look~~ — done in 7a; ~~its LIFE~~ — done in 7b (the moments catalogue + the starter ten, the mirror door, the TV glow, never fully dark, taps, the wall-washers, the marquee, the string lights). Still to come on its hooks: THE RAID (+ its police cars), the rooftop's party guests + garden, weather on the glass, holiday window scenes, the password sign | ✅ 7a + 7b | 8b · 9 · 11 · Lobby 2.0 |
| ~~`street()` → the stage's layout; people + traffic~~ — done in 8a + 8P + 8b1 / 8b2 (the people, the bus, the cabs, the back road's traffic) | | ✅ 8b |
| ~~seasons on the trees~~ — done in 8a (four seasons by the real date; `&force=season-*` — C4d dropped `&season=`); ~~snow on the city + the branches, puddles + the wet sheen~~ — done in 9a + 9b | | ✅ 9 |
| storm / rain / snow / fog SKIES on the clouds (DT2: `clouds.KINDS` — add `nimbus`, `fog`; `cloudMix`'s recipe; `harbor().clouds.set({ grey, dark, base })`), the sky messages BETWEEN the cloud layers (`clouds.draw(c, fs, sun, 'back' \| 'front')`) | the hooks | ATM |
| holidays (the sky fx's holiday pieces already run) | — | 10 |
| `partyLight()` → null (the lobby's still); the real midnight finale (NEON PASS 3 built the party windows, the searchlights at the peak and THE PARTY SHOW) | rules + the show | 10 |
| ~~the menus' backdrop~~ — `screens/backdrop.js` keeps the Harbor's still (CITY 1.0 OUT: no still = the plain dark backdrop) | | ✅ |
| the music-off soundscape, the easter eggs, the switch-over | — | 12 |

## THE PREVIEW PANEL (Oct 22 2026) — the owner's test remote: JUST ME / EVERYONE ON CITY 2
The seed of Part 13's CITY CONTROL: every `&force=` preview, the party show's scenes, time, weather and the holiday looks from one
sheet on the owner's phone — on that phone only (JUST ME) or on every phone on `?city=2` at once (EVERYONE). City 1.0 never loads
or listens to any of it (the E2E checks: no `remote.js` request, no pill, no listener without the flag).

**CONN (Oct 28) — EVERYONE WITHOUT A SOCKET:** the free database plan allows 100 simultaneous connections, so a visitor on the title no
longer listens to `city2/live`. Every NON-admin phone polls `GET /api/admin?live=1` (edge-cached 15 s; `remote.js#poll`, every ~5 min
while the page is visible AND focused — THE CDN HOTFIX, Nov 12: was ~45 s; at once when it comes back if the last read is ≥ 60 s old) — an
EVERYONE preview (+ a radio moment, the intercom, the billboard's messages) reaches the other phones within ~5 min (~2.5 min on average), the DELAY's startAt still lines them up (`serverNow()` keeps the last known offset per device while the database is parked).
Each answer carries the server time it was read (`at`); an older answer (a cached copy after a newer one) is ignored. An ADMIN keeps the
live listener (`want('admin')`, from the moment `whoami` says so until the title goes; parked like any tab after 2 min hidden) — SEND
and its countdown are instant on the owner's phone. The E2E reads every 1.5 s under `?emu`.

**THE LOBBY GETS IT LIVE (Nov 12 night — passes/jaywalk-cards.md Group 3):** THE RADIO's EVERYONE / city moments start **10 s** after FIRE
(`radio.lead.city` 45 → 10; the intercom's `lead.everyone` 50 → 10) and the server ALSO writes each into every OPEN room's `rooms/{CODE}/radio/{id}`
(the LOBBY ONLY moments' public shape — `api/_lib/radio.js#fire`; the rooms kept on the queue's record as `rooms`, so STOP / CLEAR ALL / the planner's
moves update the copies — only rooms still open: a closed room's path is never written). A phone IN a room gets it live over its room socket (lobby
or mid-match — no new socket, no new poll; a phone on the title stays parked); its feed merges the poll's copy + the room's by id (`remote.js#feedRadio`)
→ ONE moment, played once (`scene-radio.js`). A phone only on the city picks it up at its 5-min check-in (a long moment joins mid-way, a short one
may be over). While a match is on screen the city is paused — a sky moment shows only for the room's phones in the lobby. Proof: the harbor `crew`
group (both lobby phones ~150 ms after FIRE; the poll + the room = 1 moment; the intercom on two room phones 0 ms apart, the clip fetched ahead) +
`server.test.mjs` (copies in two open rooms, none in a room idle > 1 h, STOP reaches them, never a stray node in a room closed since).

**C2 (Oct 25) — REWORKED** (the owner: "very busy and unorganized"; the old sheet's notes below still hold for the registry, the sync
and the server): **FULL SCREEN** (inside the safe areas; a centred 820 px sheet on desktop). Pinned at the top: the title + a coloured
line — **JUST ME — ONLY THIS PHONE** (green) / **EVERYONE — EVERY PHONE ON CITY 2** (pink; the mode's colour also on the sheet's edge,
the switched-on rows, the countdown, the pill), the mode switch, the status + CLEAR ALL, a **SEARCH** box (every row's label, hint,
keywords, group + section; each typed word must start a word: "f22", "police", "milk truck"; 16 px, a 44 pt ✕) and **START: NOW / 3 S
/ 5 S** (remembered: `nd:hr-delay`, default 3). **THE DELAY:** in JUST ME taps QUEUE while the sheet is open (a yellow QUEUED line);
closing it starts a small **3-2-1 chip** in the pill's row ("3 JUST ME · AURORA · RAIN"), then the whole queued state starts at
once; reopening during the countdown CANCELS it (the queue stays — closing again restarts it). Instruments start at once (CLEAR
ALL, the pill's ✕, READOUT / AUDIO PANEL, SKIP SONG, the ▶ sound previews). In EVERYONE, SEND passes `delay` → the server sets
`startAt = now + delay` and every phone counts down + starts together (closing without sending keeps the draft: "NOT SENT — DRAFT
KEPT"). **RECENT:** the last 6 rows fired (`nd:hr-recent`), one tap fires again (EVERYONE: adds to the draft). **NINE SECTIONS**
(`R.SECTIONS` over the unchanged areas `CATS` + `cat`; `AREA_SECTION`, per-event `sec`): SKY · LEGENDARY · PEOPLE + WORKERS ·
WILDLIFE · HARBOR · WEATHER · TIME · LIGHTS + MUSIC · TOOLS; 2-up 52 pt rows (4-up on desktop), 3-up 46 pt for short options. Hooks:
`remote().search(q)`, `.delay(v)`, `.previewCountdown()`, `openCats` takes a section id or an old area id; `setMine` still applies at
once (the other groups' tests). Shots: `--scenes panel-legend,panel-lights` (+ `--qs panel=1`).

### Who sees what
- **Everyone on `?city=2`:** `title.js` imports `screens/harbor/remote.js` 1.5 s after the city starts (never in the title's first
  second). It listens to `city2/live` once Firebase is up (signed-in read; only the server writes it) and plays it.
- **9d — THE ADMIN ROW (the pill is gone from the screen):** for an admin the ☰ menu gets an **ADMIN** row at its bottom
  (`ui/settings-panel.js#setMenuExtra`) that opens the panel; while a preview is on, a small dot on ☰ (green JUST ME, pink EVERYONE —
  `setMenuCue`) and the row reads "JUST ME · 10/27 22:30" with a **CLEAR** beside it. The countdown + PLAY ALL chips keep their spot
  beside the ☰ while they run. (Below: the pill as it was, Oct 22 → 9c.)
- **The owner (an admin profile):** the module asks `/api/admin {action:'whoami'}` once (cached 6 h in sessionStorage) and, for an
  admin, adds a small **TEST pill** top left under the safe area (a 44 pt target, a dot: green = JUST ME on, pink = EVERYONE on;
  it steps under the `&debug=1` readout and under a dev slot's TEST SLOT tag). Tap → the glass bottom sheet (`css/harbor-remote.css`,
  loaded only then). The sheet is two thirds of the screen at most with a light veil, so the city stays in view above it.
- **On her iPhone:** open `https://neonspeakeasy.com/?city=2` with her own profile (the one in `ADMIN_PIDS`) → ☰ → ADMIN (9d).

### The sheet
- **MODE:** JUST ME (default; every tap applies at once, live, no reload — kept for the tab in sessionStorage, so a refresh keeps
  it like a preview link) / EVERYONE ON CITY 2 (taps build a draft; **FOR 15 / 30 / 60 / 120 MIN** + **SEND TO EVERYONE**, a bar that
  stays at the bottom). Sending clears her own JUST ME state, so her phone shows what everyone sees.
- **The status** (one block at the top): what's on for JUST ME, what's on for EVERYONE + until when (and "hidden here by JUST ME"),
  a yellow NOT SENT line for an EVERYONE draft.
- **EVENTS:** every `&force=` preview by group (SKY, BIRDS, RAINBOWS, WEATHER FX, CITY, HARBOR; ☾ = only shows at night). An event
  with inputs (the drone show: text, shapes, colours, one colour / by word / by letter, drift; the banner, skywriting, skytyping, the
  words in the windows: text, style, tower; the neon flash: game; the schemes) shows them at the TOP of EVENTS while it is on. Inputs
  are shared like the links' flags (one `text` for every text event that's on — the shortest limit wins); an event switched off
  remembers its inputs.
- **PARTY SHOW:** PARTY NIGHT AUTO / ON / OFF (`&force=party` / `no-party` — OFF holds a real party night dark: harbor only) and
  HOLD A SCENE (the show's own list, `SHOW_SCENES`; a held scene brings `neon-party` unless the party is ON) or LET IT RUN.
- **TIME:** DAWN · MORNING · NOON · AFTERNOON · GOLDEN HOUR · DUSK · NIGHT · 3 AM — from the real sun at the city's place that day
  (`timeAt`: dawn = sunrise − 22 min, golden = sunset − 40, dusk = sunset + 16, night 22:30); a date + time field; CLOCK SPEED
  1× / 20× / 60×; BACK TO NOW.
- **WEATHER:** REAL · CLEAR · CLOUDS · RAIN · STORM · SNOW · FOG (`&wx=`). **HOLIDAY:** the looks that exist (`holidayOf` + the holiday
  sky's own days) → the holiday's next date at the picked time (else 21:00). **TOOLS:** READOUT (`&debug=1`), GRID (`&grid=1`),
  CLEAR ALL (JUST ME: this phone back to the real city; EVERYONE: `cityClear`).

### ONE REGISTRY (`js/core/harbor-remote.js`, PURE — the panel, the scene and `/api/admin` share it)
`EVENTS` (id, label, group, inputs, text limit, night, oneShot), `INPUTS`, `SHOW_SCENE_LIST`, `TIMES`, `SPEEDS`, `WEATHER`, `HOLIDAYS`,
`DURATIONS`; `cleanRemote(raw)` → `{ state, bad }` (plain values only: ids from the lists, upper-case text from a small alphabet,
hex colours, a `YYYY-MM-DDTHH:MM` wall time, 1/20/60 — the server refuses anything it had to drop); `toParams(state)` → the preview
links' URL flags; `describe(state)` → the status line; `timeAt`, `holidayDay`. **A new `&force=` preview = one row in `EVENTS`** —
it appears in the sheet and the server accepts it. `harbor.test.mjs` scans the Harbor's modules (+ the district sky modules it reuses)
for every `force.has('…')` and fails on a preview missing from the registry, or a row nothing reads.

### How the city applies it — live, no reload (`createHarbor().remote(params, { at, srv })`, `scene.js#applyRemote`)
The preview links' flags are swapped in place: the page's own URL minus the remote's keys (`REMOTE_KEYS`) plus the state's; a new
`skyClock()` from that, copied INTO the scene's clock object (the `&force=` Set is mutated in place — every module holds that Set),
the scene's `qp` refilled (the flags are read where they're used: the word, the scheme, the scene, the drones' shapes). Then what a
preview that went off leaves behind is put back (the word cleared, the wheel / Rosie / the neon back to their schemes, the beam's
colour, the held scene, the burnout, the neon party's chasers; the scheduler re-made when searchlights / demo change; the taxi
re-laid; the rainbow restarted), and the look refreshes at once. `params` null = the page's own flags again.
- **Sync:** a time jump runs from `at` on the server clock (`clock.now = when + (serverNow() − at) × speed`) — every phone shows the
  same minute (E2E: two phones 13–55 ms apart, one arriving late). A sky piece the state switches on (banner, skywriting,
  skytyping, the drone show, the helicopter, balloons, the festival) flies its FIRST flight from `at` (`skyfx.remote`: a late
  arrival lands mid-flight; E2E: the banner's start equal on both phones); its repeats start when each phone's last one ends, like a
  link's. A changed text / shapes restarts that piece; a piece switched off leaves the sky at once.
- **Weather:** the live weather stays unless the state sets `wx` or moves the clock (then the preview's seeded weather, like a link).

### EVERYONE: `city2/live` + `/api/admin`
- `POST /api/admin { action: 'cityLive', state, mins?, delay? }` (ADMIN_PIDS only; C2: `delay` 0–10 whole s (the panel sends 0, 3 or 5) → `startAt` that far ahead, `until`
  counted from it; anything else → 400 `bad_delay`): `cleanRemote` (any drop → 400 `bad_state`; empty → 400
  `empty_state`; `mins` 1–240, default 30) → writes **`city2/live` = `{ v: 1, kind: 'preview', state, params, label, startAt (server
  ms), until, by (pid) }`** + an audit entry (`cityLive`, the label, the minutes). `{ action: 'cityClear' }` removes it (+ audit).
- Every phone on `?city=2`: JUST ME (if any) wins; else the node while `until` is ahead (checked every 4 s → the real city on its own);
  the node's state is re-validated with `cleanRemote` on the phone too. Rules: `city2/live` read by `auth != null`, no client writes
  (`rules.test.mjs`); `server.test.mjs` covers admins-only, validation, the defaults, the audit.
- **Re-publish `database.rules.json` in the Firebase console** after this change (the new `city2` node).

### Tests + previews
- `node --test tests/harbor.test.mjs` (the registry ↔ the code, validation, the flags, the sun's times, holidays);
  `server.test.mjs` / `rules.test.mjs` (`--test-name-pattern "CITY 2.0"`); `ONLY=panel node e2e-harbor.mjs "<browser>" ./shots-harbor`
  (≈ 40 s: the pill + 44 pt targets, JUST ME live (aurora, rain, 20×, dawn, a typed word lighting the windows), a refresh keeps it,
  CLEAR ALL; EVERYONE: two phones in sync incl. a late arrival, the default city never listening, `until`, clear). The test switch
  `&panel=1` shows the pill without an admin — only under `?emu` or on a `/tests/` page.
- Shots: `node shots.mjs "<browser>" --preview --city 2 --safe --sizes 390x844,402x874,430x932,1440x900 --scenes panel,panel-on,
  panel-all,panel-time,panel-end`.

### Known issues (THE PREVIEW PANEL)
- The menu MOOD MUSIC follows the real time of day, not a time jump (`audio/mood.js` reads its own clock).
- A sky piece's first flight is in sync; its repeats are each phone's own (like the links).
- Inputs are shared between events like the links' flags: two text events on at once show the same text; the three schemes
  (neon, wheel, Rosie) share one SCHEME (a Rosie-only name like `parade` leaves the neon on its own scheme).
- The page's own preview flags (a link with `&force=` / `&when=`) are replaced, not merged, while a remote state is on.
- `title.js`-level flags (`&force=anchors`, `&tagms`, `&intro`) aren't switchable (read once by the title, not the city).
- Not checked in WebKit here — **the owner's iPhone check:** the pill, a JUST ME tap, SEND TO EVERYONE with her brother on the link.

### How Part 13's CITY CONTROL grows from this
The same registry rows, scheduled (a start time, each player's local time), the PIN + a confirm tap before GO LIVE, MY ROOM (a state for
one room), the banner's colour + passes, the words in the windows for a time window, a tagline message, the holiday overrides
(`setSkyHoliday`), the billboard — each a new row or input, sent through the same `cityLive` to the same node (or a list of them).

## KNOWN ISSUES — OPEN (C4d, Oct 29 2026: one list; each pass's own section in its log keeps the history)

**Open**
- **THE LOST LOOK** (FR7 FIXES A's add-on — passes/fr7-fixes-a.md): proved in WebKit with the canvases WIPED while hidden (no event); a real iPhone's own discard (which canvases, whether Safari fires `contextlost` for a 2D canvas there) is unconfirmed until it happens again — the sentinel catches it either way. After the re-paint the FOG's drift re-forms over a few seconds (thinner for a moment).
- **LOAD FIX 5** (passes/load-fix-5.md): that iOS Safari really moves the city's box (its large viewport) during a restored tab's boot with no
  `resize` event is INFERRED from the owner's picture (built for 659, shown in 712) — proven in WebKit for the mechanism, not drivable from
  Playwright (no Safari bars; BACK reloads): the owner's 3-step iPhone check confirms it. A boot whose box moves reveals ~0.25–0.5 s later
  (the re-fit in the dark). With NO ResizeObserver report at all (not seen) THE NET's once-a-second look leaves ≤ 1 s of two cameras after
  the reveal, then the hold + the cut. The held picture's 4 s safety still lets go unbaked after 4 s ON SCREEN (a re-bake that long: not
  seen — ~0.5 s here). The full local suite's one red — the `crew` group's room push reading another shard's room — is the 4-shard run's
  cross-talk (20 / 20 alone).
- **LOAD FIX 4** (passes/load-fix-4.md): a refresh in a room on a dead line costs ~9 s before the city + REJOIN (8 s on screen + the bake); the page's
  deploy id = its FIRST `/api/time` answer (~1.5 s in) — a deploy inside that window reports a later lazy link error instead of reloading (rare);
  a match's VIEW failing to link while its cartridge loaded waits for the room / the podium (not seen — they preload together). PARKED from the
  audit: #2 (Firebase + the profile call before the reveal — FR7 measures it on the iPhone) and #9 (the bare domain's 308 — the owner's Vercel).
- **LOAD FIX 3** (passes/load-fix-3.md): a request that never answers costs 12 s + a reload before the city (the watchdog can't tell a stall
  from a slow phone sooner); a SECOND hang in the same tab without a reveal between gets TAP TO TRY AGAIN, not another reload. THE MUSIC ON THE
  TAP was measured in Chromium only (Playwright's Windows WebKit has no Web Audio) — the owner's iPhone judges Safari (HE4's slice warm-up: a
  headerless slice's first frames + the swap to the whole song on Safari). Before a tap the party crowd dances on the grid's
  stand-in clock (pixdiff: the dancers' phase only).
- **LOAD FIX 2** (passes/load-fix-2.md): (the music after the tap — FIXED in LOAD FIX 3). THE BOOT PRELOAD's gain was measured on the local HTTP/1.1 server (4.20 → 3.90 s on the Wi-Fi line) — the live site's
  HTTP/2 + Safari's service-worker hop are the owner's iPhone's to judge. A 4×-CPU phone stays CPU-bound (8.9 → 8.5 s in headless Chromium);
  the service worker still revalidates every file on every load (the repo has no per-file version to cache on — network-first stays).
- **CITY FIXES + HOLD'EM** (passes/city-fixes.md): THE TAP WATCH keeps reporting real lost taps to /admin (LOST TAP) — the iPhone's own data
  decides whether any cause beyond the ones fixed remains (THE RESCUE turns an iOS-dropped tap into a ~350 ms-late one meanwhile). The roof
  board's last ~5 % is cantilevered past the roof's edge at 15 % (the frame keeps its feet on the roof; ~7 % would keep it fully over — the
  owner's call). The owner's +200 this week: paid by the server with his next ROOM match (his week's old solo plays had filled the bar).
- **FRIENDS C** (passes/friends-c.md): THE ROOM's OWN COST — fixed in CITY FIXES (the guest list holds the city). THE BLACK HELICOPTER over the brightest towers at night is a dark silhouette: it reads at full size (the rim, the
  lights, the beam) — the owner's iPhone to judge. The Halloween spiders, RETURN (rAF dropped), LOAD WEATHER, the display-less speed checks, the
  radio desk's scroll + THE WORD TOWERS in the 4-shard run — fixed (the log has each cause). LOAD WEATHER's cloud red — fixed in CITY FIXES
  (a scheduled spell edge inside the load window; reproduced locally on a Sunday).
- **THE LOAD FIX** (passes/load-fix.md): a camera change after the reveal (a desktop window drag, an iPad turned, a late font) now HOLDS the
  last picture still (the motion pauses) until the new camera is baked — ~0.5–0.7 s in headless WebKit — then CUTS to it (no dissolve: a
  dissolve between two cameras is two copies). Safari's bars never cause one any more (the canvas is 100lvh, the bar moves are kept).
  Proven in Playwright's WebKit with the bars EMULATED (the window's height + a pinned 100lvh) — the real Safari bar is the owner's
  iPhone's to confirm. No rules change.
- **FR6 FIXES A** (passes/fx6a.md): room2's FIRST cloud run — the file-in's "host walking at 0.9 s" sample red on the runner (a fixed-time
  sample — B makes it a condition); the sighting capture's `< 12 ms` line (a test bug — FR6 FIXES B drops it); the sighting moment / album /
  preview don't close at a game start yet (H2's roots — SHELL 2.0 Group 0). No rules change.
- **LOBBY 2.0 B** (passes/lobby-2b.md): THE DATABASE RULES CHANGED (`meta/go`, `meta/back`, `rooms/{CODE}/rv`) — RE-PUBLISHED Nov 4 ~11:22 ✅; until then a
  room still starts + comes back (the stamps are their own writes) but without the walk-out, the banner or the vote. The city's rebuild after a match
  is the title's own (a few hundred ms of dark sky on a slow phone before the walk-out — measured, not yet sliced). The look runs were daytime (a room
  runs the city on the real clock); the night look (the dock's pink, the lit TONIGHT logo) is for the owner's phone. WebKit not runnable here.
- **LOBBY 2.0 A** (passes/lobby-2a.md): the rules (`players/{uid}/ln`) — re-published Nov 4 ✅.
  The desktop RE-FIT hitch (~0.3–0.4 s once a window resize settles — the city rebuilt in one task; a desktop pass slices it). (e2e-chat drove
  City 1.0's lobby strip — retired with it, CITY 1.0 OUT; the room chat: the harbor `roomchat` group.) Not seen on a real iPhone yet: the chat's slide on the real keyboard, the room's figures at 3×.
- **CITY CONTROLS B** (passes/city-controls-b.md): THE CREW's + LOBBY ONLY's sky moments — PLAYING since LOBBY 2.0 B's add-on (they were written
  to rooms/{CODE}/radio but never handed to the city); the intercom to EVERYONE reaches title phones at their ~5-min check-in, mid-way or not at all (lobbies live, 10 s ahead, together — THE LOBBY GETS IT LIVE); headless WebKit has no
  MediaRecorder — the owner checks HOLD TO TALK on the iPhone; UNSEND can't pull a clip a phone already fetched (≤ 60 s at the edge); the room
  push needs the Home Screen app on iOS + the VAPID env vars. LOAD WEATHER's "JUST ME jump into a holiday night" check — FIXED in LOBBY 2.0 A (the facade's
  blade memo keyed to the city clock: it re-baked in view 4 s after the reveal). THE CLOUD: harbor run 2 red on the intercom
  lobby check's sign-in race (fixed after, green locally — the next pass's run confirms).
- **CITY CONTROLS A** (passes/city-controls-a.md): ONE ROOM + THE CREW play once LOBBY 2.0 puts the live city in the lobby (the owner's answer);
  the city's fired moments reach the lobbies live, 10 s ahead (THE LOBBY GETS IT LIVE) + title phones at their ~5-min check-in; headless WebKit draws no backdrop blur (a darker wash) — the
  owner confirms the blur + the display face's weight on the phone; the night billboard message on the crisp layer is a touch brighter.
- **SCHED** (passes/sched.md): A PHONE HELD SIDEWAYS shows the TURN YOUR PHONE UPRIGHT card (index.html) — the proper sideways camera
  comes with TV mode after the switch-over (then the card comes off). A dial change mid-evening keeps the fireworks' memo of that evening's
  holds. The planes stay per-device apart from the scheduled medium passes (the same moment, maybe another path).
- **DESKTOP — the cloud confirms** (passes/desktop.md): the PARTY-SYNC fix (the no-socket clock timed by the network's own clock — proven at
  6× CPU locally: 1 ms apart, was 153–168) + the calm load on the real compositor run in the cloud on this pass's push; the desktop camera
  + THE PIXEL BUDGET (2.6 MP at tier 2) are the owner's look on a computer (the one desktop review) — 1440×900 is checked every pass now.
- **DESKTOP — the resize's re-bake**: the one re-fit at a new size costs ~0.43 s on the mini PC's software rendering (once, after the drag
  stops; the held frame covers it).
- **WINDOWS — THE SCENES ON THE PHONE** (passes/windows.md): four new painters (gradients per frame, no new canvases); the A/B in the pass log
  — the owner's `&bench=1` run decides; the boss's TV room + the boxer stay the quality bar to judge the four against (the owner's eye).
- **WINDOWS — the juggler's hand-off at the glass**: his walk to the glass + the pull's close-up are two drawings crossfaded in ~0.5 s (as
  every scene's exit) — reads at phone size; the owner judges.
- **THE FINALE + FOG ON THE PHONE** (PERF-B): the finale's GPU cuts (the live range, the pops' quad, the reflections culled) + the fog's
  (the clean glass, no further invisible cut: in WebKit dense fog = a clear night's frame; the halos ~3 ms the one fog-only cost left) are the
  owner's next `&bench=1` run to judge. If the finale still steps 2 → 1: the near layer's per-shell sparks, then the crisp layers at the party
  peak (the owner's last resort). passes/perf-b.md.
- **PERF-B's CLOUD WAS RED** (run 2, d7b3944 — the two-run cap): holiday's first spider tap + wild's MIST ≠ FOG, caused by PERF-B's `settled()` swap in those two test files (the pause also covered the lazy dressing + the weather's blend) — reverted, local 65 / 65, unconfirmed in the cloud: the next pass's first cloud run is the proof. passes/perf-b.md THE CLOUD.
- **PERF-B's leftovers**: the people's plan warm-up over frames (M), the per-frame gradients in `draw()` (A4.4), one glow-sprite cache (H2),
  the skybeams' `tier === 0 ? 0.8 : 0` fallback (a decreasing per-tier value — the tier table's rule forbids it: a decision), the dancers'
  pose cache (not built: its phase steps would show). passes/perf-b.md.
- **THE FIREWORKS ON THE PHONE** (PART 10): the GPU engine's speed on the iPhone is unmeasured — the phone bench's fw-party / fw-week / fw-snow scenes (`&bench=1`) are the owner's run; the mini PC's A/B (main thread, `--gpu`): a weeknight show −3.1 ms, the party finale +1.9 ms (noise ±2.5). passes/part-10.md.
- **The harvest model "identical" on the owner's iPhone** (C4c's review): NOT reproduced — the live site loads + draws it in WebKit and
  Chromium at 402×874 + his 402×660 (the three files 200, `model: true`, the two looks plainly different). Most likely a panel state
  (EVERYONE / JUST ME) replaced the links' own `&when`; that now says so (a toast) and the model's load is told (the LOAD log, a failure
  to /admin). Re-check with C4d's fresh links.
- **WSP's CLOUD RUN** (816f5b1, run 1 — not re-run): harbor 8 / 10 — partysync IN TIME −104 ms (limit 100) + the first close thunder after the tap 0.72 s late (a decode race like APP FIXES 6b's fireworks); both green locally, neither in WSP's code → the next pass fixes the thunder check at its cause. passes/wsp.md.
- **WSP's small ones** (passes/wsp.md): a faint streak inside a cumulus by the moon (2× zoom only); the gale + the blizzard ~+0.7 ms in WebKit
  (the whitecaps — the phone bench decides); THE BAG UNDER THE MUSIC checked by the code's gain factor (the owner's ear confirms).
- The street under the dock shows no snow on a snowy night (ATM-B).
- The blizzard costs ~10 % more at 4× CPU than before ATM-C (the soft flakes — atm-c.md Group 5).
- A page that turns from rain into a storm keeps rain's drop mix until the drops recycle (a fresh load is right — ATM-D).
- The blizzard's ground snow is subtle by day (white on lying snow; its cool shadow carries it — ATM-D).
- The TR-3B's neon outlines dim with the building their sprite overlaps most (two buildings sharing an outline dim together — ATM-C).
- THE BUS CRAWL in a blizzard + ice on the cart: deferred (ATM-C; the shared schedule).
- The cab-stand waiter's taxi has no sound of its own (no car-door slot yet).
- `water` walkers can pass a few pt in front of the old floor line at the left (above the dock).
- The wet reflections' rain ripple re-bakes the wet layer 2.5 × a second while it rains (only then).
- A dog walking past the hydrant's big holiday piece is hidden for ~1 s (behind it).
- The harvest MODEL has day + night looks only (the drawn display re-lights per golden hour / overcast).
- The side door's amber spill lays over the out-swung leaf's foot (~2 pt).
- The memory guard's first layout counts nothing else live (nothing exists yet); every later re-plan counts it.
- The 11b Christmas tree on the compass must keep its base within ±1.3 u (the water bench clear).
- (ATM-A: the mini PC's BATTERY + calm-load 60-fps checks PASS locally now — its TV runs at 29 Hz and headless Chromium followed that vsync;
  the test browser composites in software on Windows: docs/testing.md (THE TEST BROWSER).) `panelrows` "A WITCH AT HER CAULDRON" fired nothing
  once under a heavy local load (F18).
- Watched, not changed: THE PACE IS HUMAN once read 74 steps/min (≥ 75) on one couple; a capture under heavy parallel load caught a
  half-drawn frame (not seen in a single capture).
- The cloud's remaining WARNINGS, each with its cause: F3 the perf group's re-bake timeout (dormant since SP6 — if it returns: why
  `litBaker.key` stays `''` after `setTier(2)`); F9 THE SURGE ON THE BEAT ~55 ms late on the 2-core runner (`okT`); F13 LOAD WEATHER on
  a stored JUST ME holiday jump (`okT`: the panel's state lands after the reveal and the roof billboard's content is re-picked then —
  `neon.rev` → one 1.2 s crossfade; a fix: hold the board's re-pick to the reveal on that path); F16 THE TOAST'S BIGGEST ARM STEP (`okT`, as
  designed); F14 + F15 skipped on CI (no speed answer on 2 cores).

**Closed since FR4** (the entries in the pass logs that repeat them are history): F1 LOAD WEATHER after 6 s (9f, 04eb891) + F2 the panel's
word gone (25197fe) — every SP3 → BNAME "Known issues" line that repeats them; F6 the planted foot round the giant (the giant off since
C4b: 0.05 of the body's speed); F7 the dancers' arms, F8 half-time's margin, F10 the spider tap, F11 the wheel's sprites, F12 the upper
panes (HARD again), F17 NO SMOKE (hard) — C4d; the gilt after 1 am (C4a); the crisp overlays + the rain (C4b); the blackout's rain-sign
read (C4c: `&wx=clear`); the perf group stopping on the laptop ("Promise was collected" — C4d's harness fix).

## CITY 2.0 IN CLAUDE.md — THE FULL TEXT (moved from CLAUDE.md, NIGHT-B, Oct 29 2026 — CLAUDE.md keeps one line per rule)

CLAUDE.md is loaded into every Claude Code session, so its City 2.0 paragraphs were cut to one line each; their full text, unchanged:

**Ground rules — City 2.0** (as it stood in CLAUDE.md):

- **`&debug=1` (City 2.0):** the frame-time READOUT, the AUDIO panel + the LOAD log as DOM strips at the TOP (`ui/debug-strip.js`; every strip
  starts FOLDED on each load) — never over the promenade or the dock; ☰ → ADMIN → TOOLS switches them without the link.
- **A legendary from a link waits** for the reveal + the first tap (+4 s): `&force=ufo|tr3b|implosion`; `&lgnow=1` = at the load (tests),
  `&lgs=` holds a still (docs/harbor/passes/9g.md).
- **`&dpr=3`:** the whole Harbor at the device's 3× (every 2× cap via `ui/canvas-safe.js#BAKE_CAP`) — the owner's LOOK judgement only, never a
  default. **`&bench=1` THE PHONE BENCH:** six heavy scenes measured → the report on screen + to /admin (`&benchfast=1` for tests; docs/harbor/passes/c4c.md).
- **City 2.0's memory:** every canvas taking a context through `safeCtx` / `ctx2d` is counted (`canvasMb()`); the memory guard
  (bake.js#MEM_BUDGET_MB 64 / 96 / 160) counts every live canvas — a new big canvas needs no registration.
- **City 2.0's standing rules** (each pass's detail: docs/harbor.md's INDEX): THE WINDOW RULE — every window moment enters by its own motion
  or the blind cycle (core/harbor-moments.js#ENTERS_BY_MOTION); THE WINDOW STANDARD (ATM-C — the owner, Oct 31 9:31 am: "the look, the smoothness, the overall vibe … perfect") — THE SHADOWBOXER + THE BOSS's BLUE TV ROOM are the bar for every window scene, old + new (the holiday scenes, the bar, the card game, the cash count, the party rooms …): one real light source in the room, its shadows, smooth eased motion, that quality; THE PEOPLE RULE — nobody appears or vanishes in view on the promenade
  (core/harbor-witness.js#rejoinVisits, people.js#guard); NO LAMPPOSTS — the implied lamps below the screen, the light in ONE pure module
  (core/harbor-light.js; NIGHT-A's NEW light — one warm wash + an even base, no pools — the DEFAULT since NIGHT-A2, `&light=old` + a TOOLS row for A/B: setLightMode, every painter reads it); NO TRAFFIC DURING THE LEGENDARIES (core/harbor-legend.js#trafficHold — every vehicle planner reads it); a 3D
  model only ever as BAKED sprites (scripts/bake-model.mjs); lettering nothing passes in front of → THE CRISP LAYER (crisp.js, full dpr);
  the lights follow the song's grid, the kicks only calibrate one lead — a TRUSTED GRID ALWAYS PUNCHES (half until the kicks confirm, full once they do; NIGHT-A2), the saved lead per output + never one learned after a return (core/harbor-beat.js); THE STANDING PROPS ARE SOLID (a holiday piece on the floor registers its footprint in core/harbor-holidayprops.js#standingFootprints — every walk goes round it); every force flag the code reads has a panel
  row (core/harbor-remote.js — the A/B switches hidden in TOOLS; tests/harbor-remote.test.mjs greps for strays).

**Testing — THE HARBOR IN THE CLOUD + THE BASELINE GUARD** (as it stood in CLAUDE.md):

- **THE HARBOR IN THE CLOUD** (`.github/workflows/harbor.yml`): the FULL `e2e-harbor` suite runs on GitHub **only on a pass's FINAL push** —
  put **`[harbor]`** in a commit message of that push (and it must touch a City 2.0 file: the `paths:` list) — or by hand: `gh workflow run harbor`
  (`-f job=street` = one job). Mid-pass pushes show skipped runs and cost nothing (both workflows: a newer full run cancels an older one).
  It runs as **10 parallel jobs** (`audio` `show` `city` `perf` `street` `windows` `wild` `legend` `holiday` `models`, ≈ 4 min each); a red job → **"Re-run failed jobs"** re-runs that job only.
  **A new test group goes in exactly one job in `tests/integration/harbor-jobs.mjs`** (e2e-harbor.mjs refuses to run and the unit test fails
  until it does). Timing checks (`okT`) and known-flaky pixel probes (`okF`) are WARNINGS on CI, listed in each job's summary page.
  ON THE MINI PC (32 GB, since THE MODELS PASS — the laptop-era "never the whole suite locally, out of memory" is gone): the touched groups
  (`ONLY=…`) while working, then THE FULL suite locally once before the final push (nothing else heavy beside it — docs/testing.md#testing), then
  the final `[harbor]` push and read `gh run list --workflow harbor`.
  **CI minutes (the owner, Oct 24): at most TWO cloud runs per pass.** Never re-run the cloud suite to confirm a flake: a failed check in
  code the pass didn't touch that is a known flake goes in the pass's "Known issues" and the pass finishes.
- **THE BASELINE GUARD** (HOTFIX Oct 29 — the forced bus ran at 5 fps on the owner's iPhone: a plan cache smaller than its frame's working set
  re-planned everything every frame): `ONLY=perf` FAILS when a plain night / the forced bus / the forced dog walk costs > 2× `tests/integration/perf-baseline.json`
  (`PERF_GUARD=only` = just it, ≈ 1.5 min; `PERF_BASELINE=write` only when a pass changes the cost on purpose). A cache keyed per frame must hold its whole working set.

**Docs table — the harbor row** (as it stood in CLAUDE.md):

| `docs/harbor.md` (+ `docs/harbor/passes/`, one log a pass — its INDEX) | **CITY 2.0 — THE HARBOR** (the title's new city, behind `?city=2`, 12 parts): the bible (the owner's decisions, size rules, hero pieces), the camera + layout numbers, baking + the memory budget, lanes + events, `&grid=1`, the performance budgets, what each part builds |

**Audio — CITY 2.0 MUSIC** (as it stood in CLAUDE.md):

  **CITY 2.0 MUSIC** (`?city=2`): its own day (`core/city-mood.js`: dawn / 11 am / golden hour / 11 pm / the party show) and its own decks (`city2` in
  `data/mood-music.json`: the owner's ~50 songs, some in two moods); the MUSIC MOOD setting (AUTO / MORNING / DAY / EVENING / LATE NIGHT / PARTY) works in
  both cities. New songs: drop them in ~/Downloads/{morning,day,evening,late,party}/ and run `scripts/add-city2-music.py` (docs/audio.md#city-20-music).

**File layout — the Harbor's lines** (as they stood in CLAUDE.md):

```
js/screens/harbor/*.js  js/core/harbor-*.js              CITY 2.0 — THE HARBOR (?city=2): one file per piece (the scene + its bakes, the skyline, neon, water, the hero
                                                         pieces, the sky + the legends, the speakeasy + its windows, the promenade + its people, weather, snow, holidays);
                                                         the pure logic in js/core/harbor-*.js — THE FILE MAP: docs/harbor.md#the-file-map; every pass: docs/harbor.md's INDEX
js/core/climate.js harbor-loadlog.js                     PURE: the climate-aware weather fallback (48 cities' normals); THE LOAD LOG (&debug=1's load strip)
js/core/city-sounds.js city-sounds-files.js js/audio/city-sound.js scripts/add-city-sfx.py audio/city/   THE CITY SOUNDS: 134 slots (116 filled) — docs/audio.md#the-city-sounds
scripts/bake-model.mjs scripts/bake/ assets/city/ art/   THE BAKE TOOL: a 3D model → sprites at the city camera's real view, OFFLINE (three.js in Playwright, never on the site); art/ = sources (.vercelignore'd)
js/ui/onscreen.js                                        LOAD FIX 4 — TIME ON SCREEN: ONE clock for the boot's waits (onScreenWait / onScreenSince — paused while hidden; LOAD FIX 5: + the held picture's safety)
tests/integration/kit/two-cameras.mjs wk-double.mjs      LOAD FIX 5 — NO TWO CAMERAS: the ONE runner (every camera / box / bake path, frames + pixels) + its WebKit entry; the harbor `cameras` group drives it in Chromium
js/ui/lazy-import.js                                     LOAD FIX 4 — THE SKEW WRAPPER: every dynamic import (lazyImport) — a new deploy → ONE reload (never mid-match)
js/ui/canvas-safe.js                                     Safari-safe canvas helpers (safeCtx / ctx2d / blit / cssWidth / BAKE_CAP / canvasMb) — every Harbor context goes through it
```

## THE FILE MAP (moved from CLAUDE.md's File layout, C4d — every Harbor module + what it holds, as the passes described them)

Read with docs/harbor.md#the-architecture. Each line names its pass (the detail: that pass's file in `docs/harbor/passes/`).

```
js/core/  (the City 2.0 half) room-logic.js hush.js lobby-song.js party.js rainbow.js marks.js palette.js neon-ramp.js rng.js obfuscate.js night.js playlist.js sky.js weather.js insights.js harbor-layout.js harbor-events.js harbor-windows.js harbor-neon.js harbor-boats.js harbor-sky.js harbor-show.js harbor-remote.js harbor-dark.js harbor-signdim.js harbor-clouds.js harbor-phase.js (SHELL 2.0 B1: THE PHASE — anything drawn as speed × the clock keeps its place across a speed change) harbor-speakeasy.js harbor-moments.js tube-path.js   PURE: room codes + host election, HUSH WORDS, the lobby song handoff, PARTY NIGHTS (the window, the beat clock), RAINBOWS (after real rain: when, which bow, where), THE STREET (trees through the year; the street's layout, buses, signal, cars, plows; the people, the door, hails), seeded RNG, XOR+base64, game-night standings, room playlists + callBonus; sky.js the real sun, moon, seasons, holidays, planets, eclipses; weather.js Open-Meteo → the city weather; insights.js the admin STATS; harbor-layout.js / harbor-events.js / harbor-windows.js / harbor-neon.js / harbor-boats.js CITY 2.0's camera + layout, its event scheduler, its addressable windows + the light timeline + the words, its neon (the palette roles, the outlines, the sign spots + the roof signs + tonight's pick), its boats' routes on the clock, its sky (the aurora's nights, the moon's look, what may fly, sky messages, the birds, the holiday sky table, the drone show's shapes), its PARTY SHOW's director + the everyday neon motion (harbor-show.js), THE PREVIEW PANEL's registry + validation (harbor-remote.js, shared with /api/admin), ONE darkness input every light reads + the blue-hour power-up + the beacons' PHOTOCELL (harbor-dark.js; 9d), the sign-dim hook for sky messages (harbor-signdim.js), THE CLOUDS' kinds from the real weather + their perspective layout + their light (harbor-clouds.js, DT2), THE SPEAKEASY's plan — the rooms behind its windows, the weekly ghost ad, the corner turn (harbor-speakeasy.js, 7a), its LIFE — the window moments' catalogue, the day's schedule seeded by the date, the rooms' states by the hour, the TV's irregular flicker (harbor-moments.js, 7b; WIN2: the edge windows' seeded moods edgeMoods + the eyes' calendar eyesNights) (docs/harbor.md); weather.js also parses NOAA's Kp (the aurora's storm night); tube-path.js SVG paths → tube polylines + their uneven light
js/screens/title.js title-neon.js title-taps.js title-dock.js   CITY 1.0 OUT (Nov 5) — THE TITLE in four files (scripts/split-closure.mjs: a run of the closure → a factory, shared names through live getters / setters): title.js = mount / unmount, the sequence, the sign's dress, the room's wiring, the screen's update, THE CITY COULDN'T LOAD (cityDown); title-neon.js#createNeon = THE NEON COMES ALIVE + THE RACE + THE MUSIC STARTING; title-taps.js#createTaps = the living city's taps + the screen at rest; title-dock.js = THE FLANK's markup (createDock) + its work (createDockWork: JOIN, HOST, the notes, the rings' light, the streak flame)
js/screens/harbor/{fx,sun,stars,frost,rainbow,aircraft,weather-fx,live-weather,fireworks-2d}.js js/core/{marks,palette,neon-ramp}.js js/screens/backdrop.js   CITY 1.0 OUT — City 1.0's files the Harbor still runs, MOVED in (git mv, bodies unchanged): the sky fx (the moon, meteors, the aurora's hook), the sun, the stars, the frozen pane, the rainbow, the planes' PURE half (City 1.0's painter deleted), the weather fx (lightning, fog), the live weather, the 2D fireworks; the games' marks + the tube alphabet, the palette + the light timeline, THE NEON COMES ALIVE's plan (PURE); the menus' still
js/screens/harbor/{scene,bake,tones,shapes,blocks,skyline,lights,rays,searchlights,neon,signs,tubes,sky,quay,water,waterfront,pier,wheel,lighthouse,boats,boat3d,boat-models,road,speakeasy,speakeasy-geo,speakeasy-blade,speakeasy-bake,stage,foreground,grid}.js   CITY 2.0 — THE HARBOR (?city=2 only; docs/harbor.md; boat3d + boat-models: 8b2's boats as real 3D models — HOW TO ADD A BOAT in docs/harbor/passes/part-8b2.md)
js/core/radio-intercom.js js/audio/intercom.js js/screens/harbor/{radio-intercom,radio-push}.js api/_lib/push.js   CITY CONTROLS B — THE INTERCOM's rules (PURE) · every phone's player (the chime, the PA, the duck, held in a game) · the owner's MIC + review + UNSEND · THE LEDGER's room push switch · Web Push (VAPID + RFC 8291 on node's crypto); THE CREW + PRESETS live in radio.js / radio-ledger.js / api/_lib/radio.js (core/harbor-radio.js#radioHolder)
js/core/{sightings,birthday,harbor-fireball,harbor-balloon-kinds}.js js/screens/harbor/{sight-react,snapshot}.js js/progress/{sighting,album-view,extras,flame-art}.js js/profile/{sightings,album}.js css/sightings.css api/_lib/{sightings,birthday,favors}.js   PROGRESSION B (docs/progression.md): CITY SIGHTINGS — the verifier (PURE) + the seeded fireball + a balloon flight's line-up · the tap boxes + the reactions' clock · THE POLAROID's capture (the city's real frame at full dpr) · the moment (flash → polaroid → SPOTTED → the reveal) + THE ALBUM (on the device) + the profile's BIRTHDAY + A FAVOR + THE BIG FLAME · the claim + its queue · the server's verdict, birthdays, favors
js/core/{levels,streak,items,achievements,daily,progress}.js js/progress/*.js css/progress.css js/audio/progress-sfx.js api/daily.js api/_lib/{owners,founder,events,dailies}.js   PROGRESSION A — THE ENGINE (docs/progression.md): levels, the streak, the items, the 30 achievements + the award engine, the daily contract, the server's steps · the screens (the end-of-round moment, the streak card, THE GILDED CARD, the dock's flame on the title's YOU) · the 9 sounds · /api/daily · X% counts · THE FOUNDER WINDOW (on THE LEDGER: radio-ledger.js) · the events
js/core/harbor-radio.js api/_lib/radio.js js/screens/harbor/{radio,radio-gate,radio-program,radio-ledger,radio-sound,scene-radio}.js css/radio.css   CITY CONTROLS A — THE RADIO: the jacks from the timetable, the roles per action, the lanes, the crew's limits (PURE) · the server (/api/admin radio…) · the gate (only a server yes loads it) · the corner button + the desk + the patch cards · THE PROGRAM · THE LEDGER · the desk's sounds · the city playing a fired moment ONCE
js/screens/harbor/{skyfx,air,banner,smoke,birds,balloons,drones,moon}.js   THE HARBOR's everyday sky (Part 6a): the manager + the API (harbor().sky), airliners + satellites + the helicopter, the banner plane, skywriting + skytyping, the birds, balloons, the drone show, the moon + the golden haze + the aurora
js/screens/harbor/{legends,jets,meteors,aurora}.js js/core/harbor-legend.js js/core/harbor-director.js js/core/harbor-flight.js   PART 6b — THE SPECIAL SKY: the UFO abduction + the TR-3B's power drain + the jet chase (legends.js, LAZY; WHEN + HOW pure in harbor-legend.js: the seeded nights, the timelines, the drain, NO TRAFFIC DURING THE LEGENDARIES — `trafficHold`, the hold every vehicle planner reads), ONE F-22 Raptor-style stealth fighter + Mach diamonds + heat haze + the air show / missing man / surprise flyby (jets.js; preview: tests/integration/jets-preview.html), the Harbor's shooting stars (meteors.js, fx.js's s.meteorArt), City 1.0's aurora re-fit (aurora.js), THE DIRECTOR (the spectacle budget per tier + priorities, pure), the geese's V + the bats' flight (harbor-flight.js, pure) (docs/harbor/passes/part-6b.md)
js/screens/harbor/ufo-model.js scripts/bake-model.mjs scripts/bake/ assets/city/ufo/ art/models/ufo/   THE BAKE TOOL (BNAME: `node scripts/bake-model.mjs "<chromium>" <recipe>` — one harness, a recipe per model: ufo, crane, promenade (PROM: Grok's bench + hydrant candidates at the city camera's real view — looks only, the drawn pieces won); the UFO re-bakes byte-for-byte) · THE UFO BAKE: the abduction's craft is "UFO" by sebslom (CC BY 4.0, ☰ → CREDITS), rendered OFFLINE by the bake (three.js in Playwright's Chromium, never on the site) into turntable sprites at the camera's two real view angles — body + the model's own green lights + every port per frame (assets/city/ufo/, 398 KB, fetched only when an abduction is due); ufo-model.js loads + draws them, legends.js#drawUfo picks the model or the hand-drawn saucer (`&ufo=classic`, the stand-in while loading / on a failure); art/ = SOURCE files only (.vercelignore'd, never shipped). Re-bake / swap a model: docs/harbor/passes/the-ufo-bake.md
js/core/harbor-tower.js js/screens/harbor/tower.js js/screens/harbor/crane-model.js assets/city/crane/ art/models/crane/   9e — THE CONSTRUCTION TOWER (PURE: the wordV slot's yearly cycle on the real calendar from April 2027 — the implosion, the gap, the frame + the crane (BNAME: J-Toastie's 3D model, baked, lazy; &crane=classic), topping out, the dark shell, the grand opening (BNAME: rising June 1 → Sept 1, the opening the first Saturday of October), a design per cycle; the layout keeps L.envelope so the sun never breaks; previews &build=<stage>&buildk=&builds=, &force=implosion) + its live layer (the crane + beacon, work lights, the implosion + dust, the opening's searchlights) (docs/harbor/passes/9e.md)
js/screens/harbor/scene-fireworks.js                    PERF-B — THE FIRST scene.js CUT (FR5 C1, a pure move): the fireworks' wiring — the night's shows + the previews, the sign joining the show, the crowd's view, the sounds on the clock, the GPU layer's tick; ONE ctx of getters onto scene.js's state (C.L, C.LK, C.cam…); `createSceneFireworks(C)` → { fwx, state, tick, crowd, hold, nightOf, plan, dimK }
js/screens/harbor/scene-legend.js                        SCHED — scene.js cut 2 (a pure move): the legendaries' wiring — a link's legendary waiting for the reveal + the tap, the lazy load, the sounds' warm-up, the drain + the dark city, the veil; one factory over a ctx of getters + SETTERS (the state stays declared in scene.js)
js/screens/harbor/scene-holiday.js                       SCHED — cut 3: the sign's holiday dressing, the holiday sky + props + the parade (lazy, in season), holidayTick (HS / HP / HR / HL set through the ctx)
js/screens/harbor/scene-weather.js                       SCHED — cut 4: the weather's sources (live / held / the climate), the ice's edges, the snow + rain envs, THE SWAY, weatherTick (WXS / WF stay in scene.js: THE WIND one state)
js/screens/harbor/scene-party.js                         SCHED — cut 5: the promenade lamps' life + the party's wash, the rainbow's target, partyTick + the finale (PT stays in scene.js; FR5's H8 not done — a behaviour change)
js/screens/harbor/scene-perf.js                          SCHED — cut 6: THE TIERING — the session's frame stats, perf(), judge(), the tier steps + their log (the frame loop + the resize stay with the frame)
js/screens/harbor/scene-panel.js                         SCHED — cut 7: THE PREVIEW PANEL's state on this city (realCity, applyRemote, the neon moments) + the everyday events' tick + drawing. scene.js itself: 3807 → 2968 lines; draw() QUARTERED into drawSky / drawCity / drawHarbor / drawWeather (F, t, dt, now) — the locals they share travel in one F a frame
js/screens/harbor/report.js bench.js                     9e — SEND REPORT (&debug=1's button) + THE HANG WATCH (a Blob worker that posts the last snapshot to /api/log when the main thread stops answering ≥ 7 s; scene.js#reportText) → /admin → "Reports from phones" (api/log.js#logReport, phonelog/) · C4c — THE PHONE BENCH (&bench=1: heavy scenes measured, the report on screen + to /admin as BENCH)
js/screens/harbor/crisp.js floods.js                     9c — THE CRISP LAYER (lettering nothing passes in front of — the blade, the date stone, the roof poster — on small overlays at the phone's FULL dpr over the city's 2× canvas, crossfading with the re-bake; crisp.show(c, { id, box, key, draw, alpha })) · THE CENTREPIECE's SHOW LIGHTING (reusable floods for every piece on the compass: a pool, a shadow, the light on its own colours + a rim; dimmed to a fill when it lights itself — core/harbor-centre.js#floodTarget) (docs/harbor/passes/9c.md)
js/screens/harbor/windows.js window-{rooms,figure,paint,holiday}.js   PART 7b — THE SPEAKEASY'S LIFE drawn (C4a split: windows.js the life — the plan per frame, draw(), the passer-by, the taps' hit; window-rooms.js the glass + the 2.5D room box + paintRoom + THE BARBERSHOP AS A ROOM (paintShopRoom, SHOP_ROOM — the bake, the night's lit canvas + the live barber share it); window-figure.js the figure kit + the palettes; window-paint.js the rooms' states, THE LIT BLIND (litBlind), the shop + PAINT[id]; window-holiday.js the holidays' rooms + moments, 11b's home): the figure kit + the cat, each moment's painter (PAINT[id]), the TV glow, the night lamp, the barbershop's day, the mirror door, the taps (docs/harbor/passes/part-7b.md); SP4: LIT PEOPLE in lit rooms (figure(): P.lit + P.marks + litPal — real colours modelled by the room's lamp; core/harbor-moments.js#WINDOW_LOOKS says which scene is lit / a shadow / a silhouette); WIN2: ACT BIG (walkIn — people arrive + leave through the room's depth, never a cut), THE TV ROOM B (the couch facing the window, faces lit from below: lit.below), THE EDGE WINDOWS' MOOD LIGHTS (edgeMood — light + shadow only), THE EYES IN THE HAZE (PAINT.eyes) (docs/harbor/passes/win2.md); WIN3: THE BOSS'S TV ROOM with NO PERSON (tvRoom / tvDark — the unseen set's glow from below the sill, the flicker + the shadow from core/harbor-moments.js#tvLight / tvShadow, the raid's cut, the quiet nights' beds), THE CASH COUNT's close-up with natural hands (PAINT.cash), THE PARTY IN THE WINDOWS (partyRoom — one room at a time, dark silhouettes on the beat; core#windowParty; the pools on the cobbles drawn by scene.js) (docs/harbor/passes/win3.md); 9c: THE WINDOW RULE — every moment enters by its own motion or THE BLIND CYCLE (core/harbor-moments.js#ENTERS_BY_MOTION / blindAt, windows.js#cycleBlind); C4b: THE PEOPLE RULE beside it — nobody appears or vanishes in view on the promenade: after a clear-out (a legendary, a raid) the held-back visits are replanned from their own way in, staggered 8–120 s (core/harbor-witness.js#rejoinVisits), and people.js#guard never draws a visit whose first frame on this device isn't at a way in (a load / a clock jump excepted)
js/screens/harbor/remote.js css/harbor-remote.css         THE PREVIEW PANEL (?city=2): everyone follows city2/live; 9d: the owner opens it from ☰ → ADMIN (the menu's bottom; a dot on ☰ while a preview is on — ui/settings-panel.js#setMenuExtra / setMenuCue), the sheet (JUST ME / EVERYONE ON CITY 2) starts with the pinned NOW bar (TIME, the weather's chips); WIN: PLAY ALL (a sequencer per catalogue + its chip), the sections by use, the off-switches in TOOLS
js/core/harbor-rooms.js harbor-spots.js                  WIN — 2.5D ROOMS (PURE: each room a box in perspective about its vanishing point, a plane at depth t = one uniform scale; windows.js#deepAt / paintBox / lampFall) · THE DRESSING SPOTS (PURE: named places by the BIG pieces only — PROM: the bench, the two trees, the compass, the hydrant, the railing, the corner; no lamppost spots — every holiday fills them with big set pieces + THE RULES; Halloween's big jack-o'-lanterns: core/harbor-holidayprops.js#BIG_PIECES) (docs/harbor/passes/win.md)
js/screens/harbor/{people,folk,bus,hushsign,doors,wands}.js js/core/harbor-people.js js/core/harbor-routines.js js/core/harbor-hush.js js/core/harbor-lamps.js   8P — THE PEOPLE: the planner (PURE: the walkable map, WHO'S OUT WHEN as data, visits planned per seeded block — every phone the same, joined mid-way; the crossing on WALK, the bus's timetable, the lobby line, the roof), the live manager (three depth passes + their sounds), the figures (1920s silhouettes, a stride-locked walk, poses, lit by the scene; preview: tests/integration/folk-preview.html), the 1920s bus; THE HUSH WORD SIGN (plan + neon; WIN: on the corner pier's door plate, the letters stacked — core/harbor-hush.js#wallPlan); THE LAMPS' LIFE (PROM: on the IMPLIED lamps' pools — docs/harbor/passes/part-8p.md, #prom) FP3b: the 2.5-D rig (facing from the heading, the walk + run cycles; C4b: a seated rig facing us — the knees out, the lap), REAL DOORS (doors.js: the swing, the doorway, the spill; C4b: THE DOORMAN opens the side door for each guest — core/harbor-crew.js#doormanAt), THE ROUTINES (harbor-routines.js: the dance circle, the vendor spot's schedule) + the wands (wands.js)
js/core/climate.js harbor-snow.js harbor-snowwork.js harbor-snowman.js js/screens/harbor/{snow,snowfx,winterfolk,snowman}.js   PART 9b — WINTER (docs/harbor/passes/part-9b.md): THE CLIMATE-AWARE FALLBACK (PURE: 48 cities' monthly normals → the weather when the live ask fails; &force=climate), THE SNOWPACK (PURE: the real depth / the model over 30 days → the stages FRESH · OLDER · BANKS · THAW · SPRING; &snow=), the plow + the salt truck (PURE: their passes, run through the back road's own traffic), THE JANUARY SNOWMAN (PURE: built on January's snow days, slumps + melts; &snowman=); snow.js the snow BAKED (the caps on every layer's tops, the plaza + its footpaths + banks, the road, the speakeasy), snowfx.js the falling snow + the awning's slab + the trucks' spray / fan, winterfolk.js the shovellers + the snowball fight + the slip + the snowman's builders, snowman.js his art on the centrepiece rig; the sign's fluffy snow + its melt: glasswx.js
js/core/harbor-loadlog.js tests/integration/load-log.mjs   POLISH 5 — THE LOAD LOG (PURE: every change to the picture from the first frame to 15 s after the reveal, its cause, which ones the eye sees; scene.js writes it, &debug=1 shows it as the folded `load` strip, harbor().loadLog) + the repro (a Safari-like load: bars, throttle, cold / warm; docs/harbor/passes/polish-5.md). The load gate also waits for the fonts, the weather (kept per device: screens/harbor/live-weather.js), the clouds + the extras; the title's rects measured through the screen's entrance transform (title.js#restRect)
js/core/harbor-roofmodes.js                              SP3 — THE ROOF SIGNS' HOURLY MODES (PURE: spell / race / breath per sign per hour, one big move at a time, the restart flicker; neon.js draws them)
js/core/harbor-raid.js harbor-cabs.js js/screens/harbor/raid.js   PART 8b2 — THE RAID (PURE: the schedule after the bootleggers' deliveries + a rare party night, the convoy simulated once, the officer, the front car + its spotlight, the lights' return) + its light (the red + blue wash, the shades, the flashlight, the spotlight's beam + hard circle, drawBeacon) · THE CABS (PURE: the night's calls at the truck stop, drop + pick-up riders, the TAXI lamp lit when free) (docs/harbor/passes/part-8b2.md)
js/core/harbor-holiday.js harbor-holidayfolk.js harbor-holidayprops.js harbor-ghost.js js/screens/harbor/{signdress,dress-halloween,dress-dotd,holidayprops,ghostship,witch}.js   PART 11a-1 — THE HOLIDAYS: THE CALENDAR (PURE: date-driven build-ups, the night, the come-down, the pieces, THE HOLIDAY LIGHT RULES — every holiday piece reads it; ADD A HOLIDAY: docs/harbor/passes/part-11a-1.md), THE SIGN DECORATION SYSTEM (a full-dpr canvas in the logo's wrap) + Halloween's FUTURISTIC web + bio-mechanical spider (SP4: a geometric web of light filaments + a shimmer; a chrome spider whose legs never leave their sectors — tests/spider.test.mjs) + Day of the Dead's sign, the ground's pumpkins / marigolds / papel picado / monarchs, the ghost ship + the witch (+ the bats in birds.js), the holiday people (trick-or-treaters, zombies, the procession — PURE); the window figures' kit + the holiday window scenes are windows.js + core/harbor-moments.js
js/core/harbor-parade.js harbor-xmas.js js/screens/harbor/{giant,harvest,dress-thanksgiving,parade,chimneys,xlights,treestand}.js   PART 11a-2 — THANKSGIVING + THE PARADE: THE PARADE SYSTEM (PURE + reusable: the route, the units in order, spacing, the pace, the clock — joined mid-way, the traffic hold, the crowd's cheers, the balloons in the real wind; HOW TO ADD A PARADE: docs/harbor/passes/part-11a-2.md) + its balloons / float (parade.js), Halloween's GIANT BITCOIN PUMPKIN (giant.js: ray-marched, baked in slices), the HARVEST DISPLAY + the November spot pieces (harvest.js), the sign's HARVEST WREATH, CHIMNEY SMOKE (reusable for winter), BLACK FRIDAY + THE FIRST OF CHRISTMAS (harbor-xmas.js PURE: the rush, the crew's strings, the tree stand, the strings' evenings; xlights.js the C9 strings on the speakeasy, treestand.js the tree vendor); the homecoming party night = core/party.js#partyDow
js/core/harbor-workers.js harbor-crew.js harbor-witness.js js/screens/harbor/{gear,workers}.js   PART 8b1 — THE WORKERS' SCHEDULE (the timetable PURE: fixed regulars, windowed shows, never two at once, cause + effect; the crew's itineraries + trucks + traces PURE) + their gear + props + the billboard's sheets + the blade's repaint; THE WITNESSES (a legendary night reshapes the promenade, PURE) (docs/harbor/passes/part-8b1.md)
js/core/harbor-wildlife.js js/screens/harbor/{wildlife,fauna}.js   PART 8b1 — THE WILDLIFE (the plan PURE; the live manager; the art) (docs/harbor/passes/part-8b1.md#group-2)
js/screens/harbor/snowfx.js                    9b + ATM-B + ATM-C — THE FALLING SNOW: three depths drawn where they are; ATM-C's ONE SOFT-FLAKE FIX — baked soft sprites (flakeArt: 4 shapes × 3 softnesses × the colour, a blizzard smear at 3 slants a side), the near layer ADDED, heavy snow denser + mostly small, the fill on a fresh load; the trees' soft clumps, the ground streamers + drifts
js/screens/harbor/fogdepth.js                  ATM-B — FOG AS DEPTH: the veils by depth (far gone · middle ghostly · the harbor softened · the stage clear), the lights' halos (signs, the NEON logo, the speakeasy's windows, the implied lamps' glow), the banks drifting on WF over the road + the promenade; MIST vs DENSE (fogLook); also the SNOW's white veil + THE BLIZZARD's whiteout
js/screens/harbor/stormdeck.js                 ATM-B — THE STORM DECK: the low heavy base + the cumulonimbus towers (one baked tile), rolling in on the wind, lit from inside by each strike (lightning.js#flashInfo)
js/screens/harbor/icefx.js                     ATM-B — FREEZING RAIN = ICE: the icicles + the glaze on the edges scene.js#iceEdgesNow lists (the speakeasy's ledges, the blade + the roof signs, the railing, the benches), the promenade's ice sheen; ATM-C: CHUNKY icicles on the nearest (`big`) edges drawn first, the glassy glaze + its sliding glints, the ice-sheet mirror streaks, FROSTED PANES (iceEdgesNow().panes), the colder grade
ATM-D's touch-points: screens/harbor/sun.js#lightSun (the low sun painted as a glowing light) · rainfx.js (the storm's fine dark drops, s.logo) · lightning.js#thunderDelay(km, close) + the close strike on scene.js#nearRoof · wetground.js#puddlesOf / puddleShape (the clustered puddles, the trunk cut-out, o.ice) · snowfx.js#ground (the ribbons, s.bld) · skybeams.js (crisp = (1 − vol)²) · fogdepth.js#veil (the fade-in top) · air.js#lookAt (the clear line) · cabstand.js + vehicles.js#drawFarDoorTop (the curb side) · screens/title.js#O_ALT (the pumpkin)
js/core/harbor-fireworks.js js/screens/harbor/fireworks.js   PART 10 — THE FIREWORKS: the PURE planner (every night's shows — fireworksNight; the scripted show format — scriptShow; the shells, colours + three layers; the weather; syncToBeat — the party song's grid) + the GPU engine (a WebGL2 layer inside the scene box right after the city's canvas, BEHIND the lit sign: closed-form sparks on the GPU, the comets, blooms, the city's wash, lit smoke on the wind, the reflections; the tier table's fw* rows) — passes/part-10.md
PART 10's touch-points: scene.js (fwNightOf / fwForced / fwPlan + fwLineAt + fwGridAt / fwCrowd / fwTick / fwHooks — the sounds / fwSignJoins) · core/harbor-witness.js (the `fireworks` kind) · core/harbor-streetparty.js#watchShows · people.js (fwShows / fireworks / blocked passed on) · title.js#applySignFlash · ui/canvas-safe.js#glCtx · bench.js (fw-party / fw-week / fw-snow) · title-perf (p10-party / p10-week / p10-snow) · harbor-e2e show.mjs G('fireworks')
js/core/harbor-wind.js                         ATM-A — THE WIND AS ONE SYSTEM (PURE: speed, side, level, lean, the gust waves rolling from upwind; scene.js#WF once a frame → the crowns' springs + their cut-out (scene.js#swayPlan / swayLayer), the rain's slant + gust sheets, the snow, the leaves, the people's lean (folk.js#setFolkWind), the water's floor + swell + cat's paws, the wind's sounds (sounds.js THE WIND))
js/core/harbor-weather.js js/screens/harbor/{rainfx,lightning,waterfog,wetground,glasswx}.js   PART 9a — THE WEATHER: ONE city state from the live / forced answer + its soft transitions (PURE); the Harbor's rain (lit by the tubes + lamps), the capped lightning, the fog on the water, the wet promenade (puddles drying, the lamps' wet streaks, the drips, the wet glass), the weather on the NEON tubes + the dock's / corner buttons' glass (beads, drips, glaze, icicles, frost — small overlay canvases at z 72) (docs/harbor/passes/part-9a.md)
js/screens/harbor/{clouds,dayfx}.js                      THE CLOUDS (DT2: per-pixel shaded volumes baked once + re-lit in time slices; Part 9 plugs in: KINDS + set(); preview: tests/integration/clouds-preview.html) · the day's motion (flags in the real wind, sun glints on glass)
js/screens/harbor/{trees,props,props-light,props-garden,props-test,roadlight,street,motorcar,sounds,centre,still,cabstand}.js js/core/harbor-centre.js js/core/harbor-promenade.js js/core/harbor-trees.js js/core/harbor-light.js   PART 8a — THE PROMENADE: the plan (bands, sizes, the layout, the season, the implied road's passes, the zones), the trees' plan (pure) + their art in four seasons + the falling leaves, the bench / cart / planters / the brick INLAY + the mailbox, PF's centrepiece EVENT RIG (harbor-centre.js pure + centre.js: `harbor().centrepiece.set()` for the holidays), the implied road's light, FP2's street under the dock + the 1928 sedan crossing it at rest, the city sounds' wiring; FP3a: THE LIGHT on the promenade in ONE pure module (harbor-light.js: the pools, a face's lamp, the trees', the road's, the sun's shadow; PROM — NO LAMPPOSTS: the IMPLIED LAMPS below the screen behind the viewer — impliedAt, the shadows up the screen: castShadow), C4b's LAYOUT (the compass left of the crossing, the water bench at the crabapple, the maple + the cab stand at the right edge, the cart in the middle from below the dock; THE CAB STAND's own lamp off-screen right — core/harbor-light.js#cabLamp; docs/harbor/passes/c4b.md), PROM's THE STILL PIECES SHARP (still.js: the two benches live + on full-dpr crisp overlays that re-draw whoever stands in front) + THE CAB STAND's taxi on the front street while the dock rests (cabstand.js; the waiters: core/harbor-cabs.js#standEvents), props.js split (the light model + frame / the dormant urn + mailbox / the lazily loaded test obelisk) (docs/harbor/passes/part-8a.md, #fp2, PF, FP3a)
js/screens/harbor/{vehicles,fogbeam}.js js/core/harbor-traffic.js   POLISH 4: THE VEHICLE KIT (seven 1920s–30s models, both roads, 8b's police car + trucks are new MODELS), the back road's pure traffic, the beams in fog as one volumetric body (previews: tests/integration/{vehicles,jets}-preview.html); THE BLACKOUT is core/harbor-legend.js#blackAt + scene.js's dark city (docs/harbor/passes/polish-4.md)
js/core/city-sounds.js city-sounds-files.js js/audio/city-sound.js scripts/add-city-sfx.py audio/city/   THE CITY SOUNDS: the slots (pure — 134, 116 filled), the generated takes, the player, the import command, the recordings + CREDITS (docs/audio.md#the-city-sounds)
js/screens/harbor/{skybeams,strings}.js                   NEON PASS 4: the party's SKY BEAMS (reusable: holidays, the tribute), the CAFÉ-LIGHT CANOPY on the speakeasy's roof (SP2: big Edison bulbs on swags between set-back posts; reusable schemes for Parts 8 + 11)
js/core/harbor-dance.js                                  SP5 — THE DANCE CLOCK (PURE: every dancer's beat — the song's grid with every change of phase / tempo BLENDED, the energy winding down at a song's end, idle in the gap, the pick-up; the window party + the promenade's circle read it; tests/harbor-dance.test.mjs)
js/core/harbor-beat.js  js/ui/canvas-safe.js              THE BEAT (PURE: the song's grid from the song's clock minus ONE lead, every beat punching, the kicks only calibrating the lead — docs/audio.md#the-beat-sync-pass; audio/beat.js hears them) · Safari-safe canvas helpers (blurWorks, blit, ctx2d, safeCtx — every Harbor context; 9f: cssWidth(canvas) — a canvas's CSS width with no layout read, for overlays placed per frame; the Harbor's floor is iOS 16, the rest of the app parses on older iOS: no top-level await, tests/safari-floor.test.mjs)
js/core/party-deck.js js/audio/party-music.js            NIGHT-C — THE PARTY SONG IN SYNC (PURE: the PARTY deck as one seeded timeline from an anchor — the night's 8 pm, the force, the epoch; the player on the server clock + this phone's own player on the same song — docs/audio.md#the-party-song-in-sync)
js/audio/party-music.js#stationOf                       SKY-B — MUSIC AS RADIO STATIONS (every City 2.0 mood deck on the server clock — a station each; the party night keeps its 8 pm timeline; &force=no-stations)
js/core/harbor-heli.js                                   NIGHT-C — THE HELICOPTER (PURE: the patrol's timetable, the legend's window, the break flight, the beam's on-beat sweep + colour; drawn by screens/harbor/air.js — breakFly / breakDraw)
js/core/harbor-blackbird.js js/screens/harbor/blackbird.js   SKY-A — THE BLACKBIRD (PURE: one flyby — the tell, the cone + ring, the late double boom — + its triggers: every TR-3B chase, the solo sightings, the watcher's reward; drawn on its own full-dpr overlay above the sign, ONE ART SWITCH drawn | model)
js/core/harbor-boxer.js js/screens/harbor/boxer.js       SKY-B — THE SHADOWBOXER (PURE: his nights — Mon / Wed / Fri 7 → 11, Friday's wrap-up or stay — the sets + seeded rounds, the bag + the bulb's swing, his sound cues; drawn by boxer.js in the upper middle window: the bulb, the amber wall, the bag, his profile silhouette + the shadows; windows.js wires his blind)
js/screens/harbor/f22-model.js scripts/bake/f22.mjs        SKY-A — THE F-22 MODEL (NLM's CC BY Raptor baked: 4 banks × day / golden / night → assets/city/f22/; every F-22 flies it, &f22=drawn = the A/B)
js/core/harbor-mothman.js js/screens/harbor/mothman.js    MODELS — THE MOTHMAN (PURE: his nights ~twice a month, 2 → 5 am, never a legendary's night; the needle's stutter + the swap) + the view (two baked models on his own overlay, the red eyes in code, the glide); scripts/bake/mothman.mjs → assets/city/mothman/
scripts/bake/sr71.mjs scripts/bake/heli.mjs              MODELS — THE SR-71 (assets/city/sr71/: the Blackbird's art switch, the default) + THE PATROL HELICOPTER (assets/city/heli/: 24 headings × day / night; air.js#drawModel draws it, the rotors + lights live)
js/screens/harbor/legends.js#triOverlay  scene.js#triWorldLight / cityCut   SKY-A — THE TR-3B AT FULL RES (its own 3× overlay, the skyline cut out of it, tier 2) + ITS LIGHTS LIGHT THE WORLD (the drained rooftops + the harbor)
js/screens/harbor/galesea.js                           WSP — THE GALE's SEA (galeK(WF): 0 below "windy", 1 at a gale): the harbor darker, the swell downwind, whitecaps that break + fade, spray off the breakwater + the pier in the gusts (`&force=no-gale-sea` A/B)
js/screens/harbor/tree-model.js scripts/bake/tree.mjs scripts/gltf-to-glb.mjs   WSP — THE CORNER TREE AS A BAKED MODEL (a PREVIEW, off: `&tree=model | dead` + two panel rows; assets/city/tree/, art/models/tree/README.txt) — the drawn maple stays the default
js/screens/harbor/clouds.js#moonBehind / fadeMix          WSP — the moon behind thick clouds (the block, the glow through, the silver edge; `&force=moon-cloud`) + the clouds' true crossfade (CLOUD_FADE_MS)
js/screens/harbor/balloons.js#layerClear / squeezeBand / btcMarkPolys   WSP — one continuous depth (a layer changes only where nothing shows it), the sign's band squeezed for the near ones, the real ₿ projected onto the sphere; THE SKULL in fabric()
js/core/harbor-scenes.js                                 WINDOWS — THE WINDOW SCENES ON THE CITY TIMETABLE (PURE): scenesTonight (the fixed rows + the rotating bookie), sceneAt (the shade up → the walk-in → the work → the exit ending with HIS pull), scenePreview (&force=scene-<id> + &min=N|end), AFTER HOURS — shadesNight (the lights out one at a time 2–4 am, the scene rooms + the edge windows), shadeLevel, roomColour (each shade's glow), edgeShadePlan / edgeShadeAt (the edge windows' eased pulls), sceneFreeFrom (the window party after the scenes), sceneClashes
js/core/harbor-showcase.js                               SCHED — THE SHOWCASE (PURE): the dial (setShowcase / showcaseLevel), primeWeight, legendsTonight (the legendaries on their own dial — the pool = the rows with knobs.pool), legendWindows, mediumDay (the medium tier: a plane pass, a helicopter pass)
js/core/harbor-billboard.js                              SCHED — THE BILLBOARD's HINTS (PURE): the billboard.* queue → hintsAt / hintAt (FIREWORKS / TONIGHT 9:30, the party days, LOOK UP / ANY MINUTE, the Sunday postcard); signs.js#hintPoster draws them
js/vault/dress.js beat-sync.js · js/fx/dev-switch.js dev-source.js speak-front.js · api/_lib/members.js · js/core/dev-cards.js member.js   THE VAULT 2B — CUSTOMIZE (was DRESS YOUR CARD), ON THE BEAT's clock, THE TWO DEV CARDS, the city's real speakeasy for a card, MEMBER NUMBERS (docs/vault.md "THE VAULT 2B")
js/vault/gems.js · js/fx/fire.js · js/progress/trophies.js · 404.html   THE VAULT 2C — THE TIER GEMS + THE DEV GEM, REAL FIRE, ACHIEVEMENTS AS TROPHIES, THE WRONG DOOR (docs/vault.md "THE VAULT 2C", docs/title.md)
js/core/room-show.js · js/screens/room-banner.js · js/games/cartridge.js · js/ui/layers.js · people.js#planIn / planOut / roomDoor · scene.js#roomBanner   LOBBY 2.0 B — THE GAME START (meta/go: the sign's power-down, the game's logo, the file-in, the push), THE WALK BACK OUT + THE WINNER's BANNER PLANE + THE NIGHT's CHAMPION (meta/back), THE REMATCH VOTE (rv/), THE CARTRIDGE PLUG, ONE SHEET STACK (docs/harbor/passes/lobby-2b.md, docs/cartridge.md)
js/core/harbor-room.js room-lines.js · js/screens/room-city.js room-dock.js room-guests.js game-options.js · people.js#room / roomBoxes / drawRing · folk.js (the 'lie' pose) · audio/lobby-sfx.js   LOBBY 2.0 A — THE ROOM IN THE CITY: the slots (two lines of 4) + who stands where (PURE), the roster → the people (walk in, lie down, wave off — their own clock), the tags over the heads (DOM, transform only), the room dock, the guest list, the lobby sounds (docs/harbor/passes/lobby-2a.md)
js/fx/deco.js · js/profile/sheets.js keypop.js · js/core/keypop.js   LOBBY 2.0 A — CENTURY's deco sunburst, the profile's pop-ups (a stack, one step at a time), THE SAVE-YOUR-KEY POP-UP
js/fx/  js/vault/  css/vault.css  lab.html                  THE VAULT 1A — THE EFFECT LIBRARY (one shared renderer + the effects; the city may use it too, obeying THE WIND / THE LIGHT / the timetable / the budgets) + the strips + THE CARD LAB — docs/vault.md
js/core/harbor-daychart.js                               SCHED — THE DAY CHART (PURE): dayChart (a day from the planners), yearView, quietWindows (the 30-second rule); drawn by js/daychart/daychart.js on /daychart + /admin
core/harbor-layout.js#DESK  css/title.css (.nd-scene::after, the wide + landscape-short queries)  css/components.css (the mouse block)  scene.js#pinResize + #hover  title.js#onHover  core/harbor-tiers.js#budgetDpr  tests/integration/harbor-e2e/desktop.mjs   DESKTOP — THE DESKTOP CAMERA (a wide screen re-framed: 1.4× closer, the eye at 8, the near edge z 50, composed ≤ 2.2 : 1 + a soft fade beyond, the sign 1.25×), the mouse (a pointer + a glow on the clickables, the city's hover ring), THE RESIZE (the held frame + one re-fit, a DPR move), THE PIXEL BUDGET (sceneMp), a phone sideways (the sign smaller, the dock 0.8); e2e-harbor `desktop` (docs/harbor/passes/desktop.md)
js/core/harbor-juggler.js js/screens/harbor/juggler.js   WINDOWS — THE JUGGLER (the bottom right, 6:30–9:30 pm): the 3-hour seeded plan (cascade · half-shower · fast · under the leg · the high throw · the spin · pauses · drops + the fetch · rests), the balls' exact flights + the hands' scoop (ballsAt / trickAt), his drop sounds (jugglerSceneCues → juggler-drop / juggler-thud); the amber lamp at the arcs' apex, the glossy red + cream balls, neon on the beat on party nights
js/core/harbor-crate.js js/screens/harbor/crate.js       WINDOWS — THE CRATE GUY (the bottom right, 9:45 pm–midnight): the carries (the pile growing in three columns to head height), the crowbar + the bottle against the bulb, wipe, listen, lean, count, a swig; the swinging bare bulb (bulbAt: bumped by every crate set down) + the swaying shadows; the clink (crates-clink); the cigarette on his pile
js/core/harbor-charleston.js js/screens/harbor/charleston.js  WINDOWS — THE CHARLESTON (the bottom middle, 7–10 pm): the rehearsal on a ~200-bpm count (the basic, kicks, crossing knees, swinging arms, a breather, the strap, the combination missed + nailed, the chair); the rosy fringed lamp, the phonograph; she is LIT — the teal fringe dress's three tiers swinging
js/core/harbor-bookie.js js/screens/harbor/bookie.js     WINDOWS — THE BOOKIE (rotating: the bottom middle / the top middle / the bottom right, seeded): writing, counting, the candlestick phone, pacing with the receiver, the cigar + its smoke in the beam, the RARE bad call (&force=bookie-slam); the green-shaded lamp clicked on = his entrance
js/screens/harbor/scene-kit.js                            WINDOWS — the scenes' figure kit: one bold silhouette (front / profile, a flat cap / fedora), stand / walk / crouch / sit / mix, ik, rimmed (the room's light as a rim), pullAtGlass (every exit's shade pull at the glass), glowAt
js/core/harbor-moments.js#parkedNight                    NIGHT-C — THE QUIET BUILDING (the parked rooms' lit mix + their lamps out one by one; windows.js parks them; the live rooms at 3×: speakeasy.js#drawWindow)
scripts/bake/blackhelo.mjs assets/city/blackhelo/ air.js#blackPlan (mode 'black')   FRIENDS C — THE BLACK HELICOPTER: the patrol's CC0 model baked ALL BLACK + a cold rim (24 headings since CITY FIXES — an exact cross-fade + an eased heading, the main rotor's 6 motion-blurred spin frames — loaded while it flies, dropped after); the medium tier's night pass (medium.heli — knobs.black), a radio jack + &force=blackhelo; its lights (nav red / green, the double strobe, the beacon, their reflections), the searchlight's sweep + glint; the synthesized rotor thump (audio/city/rotor-thump.mp3)
skyfx.js#showOver jets.js#band                            FRIENDS C — THE SKY UNDER WEATHER: the show (flyby, air show, missing man) drawn after the clouds, the storm deck + the far fog veil, the clouds thinned under its band; skytyped words there in fog
js/games/preload.js preload-graph.js scripts/build-preload-graph.mjs   FRIENDS C — THE SLOW-3G START: a cartridge's whole module graph on the wire at once (modulepreload), the lobby wires the playable ones 4 s in
js/ui/tapwatch.js                                         CITY FIXES — THE TAP WATCH (always on: a lost first tap → /api/log kind 'lost' → /admin LOST TAP) + THE RESCUE + afterTap (the shared layer's "never re-render under a finger"); scene.js#setTapContext
js/core/harbor-holdem.js js/screens/harbor/holdem-art.js holdem-glyphs.js scripts/build-holdem-art.mjs   CITY FIXES — THE HOLD'EM BILLBOARD: the base poster's state (the timetable's billboard.holdem default — NOW OPEN from its `open` day since HOLD'EM IN THE CITY, `barOn` — + the owner's /admin switch via the cached feed + &force=billboard-holdem), the billposter's skip, the poster painted in code from path lettering (GENERATED)
tests/integration/kit/corner-probe.mjs                   HOLD'EM IN THE CITY — B2: every corner button's REAL hit area (elementFromPoint through its centre) — the harbor `tapfit` group
core/harbor-layout.js#BILLBOARD_SCALE                     CITY FIXES — the roof board ~15 % bigger (anchored bottom-right; signs.js#buildBillboard keeps the frame on the roof — neon.js#roofX0Of)
```

## THE PASS LOGS — INDEX (C4d, Oct 29 2026: each pass's log moved to its own file in `docs/harbor/passes/`)

This file keeps the bible (the vision, the owner's decisions, the flag, the architecture, the camera + layout numbers, lanes + events, the
performance rules, the stubs) and the preview panel's reference. What each pass built, its decisions, measurements, known issues and
handoff live in its own file below (newest last). A link to a pass: `docs/harbor/passes/<file>` (`scripts/check-doc-links.mjs` checks every one).

| pass | date | file | what it built |
| --- | --- | --- | --- |
| Part 1 progress / handoff |  | [passes/part-1-progress-handoff.md](harbor/passes/part-1-progress-handoff.md) | Part 1 progress / handoff |
| Part 15 | Oct 21 | [passes/part-15.md](harbor/passes/part-15.md) | foundation fixes |
| Part 2 | Oct 21 | [passes/part-2.md](harbor/passes/part-2.md) | THE SKYLINE |
| Part 3 | Oct 21 | [passes/part-3.md](harbor/passes/part-3.md) | NEON + SIGNS + BILLBOARDS + BUILDING NEON + THE NEON LOGO |
| Part 4 | Oct 21 | [passes/part-4.md](harbor/passes/part-4.md) | THE WATER (+ Part 3 touch-ups) |
| Cleanup pass 1 | Oct 21 | [passes/cleanup-pass-1.md](harbor/passes/cleanup-pass-1.md) | Cleanup pass 1 (after Parts 1–4) |
| Part 5 | Oct 21 | [passes/part-5.md](harbor/passes/part-5.md) | THE HARBOR'S HERO PIECES |
| Part 6a | Oct 21 | [passes/part-6a.md](harbor/passes/part-6a.md) | THE EVERYDAY SKY |
| NEON PASS 2 | Oct 21 | [passes/neon-pass-2.md](harbor/passes/neon-pass-2.md) | NEON PASS 2 |
| NEON PASS 3 | Oct 22 | [passes/neon-pass-3.md](harbor/passes/neon-pass-3.md) | THE WOW PASS |
| NEON PASS 4 | Oct 22 | [passes/neon-pass-4.md](harbor/passes/neon-pass-4.md) | THE NEON IN MOTION |
| NEON PASS 5 | Oct 22 | [passes/neon-pass-5.md](harbor/passes/neon-pass-5.md) | SAFARI, THE REAL BEAT + THE PARTY POLISHED |
| NEON PASS 6 | Oct 22 | [passes/neon-pass-6.md](harbor/passes/neon-pass-6.md) | NIGHT TOUCH-UPS |
| THE DAY PASS | Oct 22 | [passes/the-day-pass.md](harbor/passes/the-day-pass.md) | THE DAY PASS |
| CLEANUP C15 | Oct 22 | [passes/cleanup-c15.md](harbor/passes/cleanup-c15.md) | CLEANUP + SPEED |
| DT1 | Oct 23 | [passes/dt1.md](harbor/passes/dt1.md) | THE LIGHTS + SIGNS PASS |
| DT2 | Oct 23 | [passes/dt2.md](harbor/passes/dt2.md) | THE DAY LOOK |
| SP | Oct 23 | [passes/sp.md](harbor/passes/sp.md) | SKY POLISH |
| M | Oct 23 | [passes/m.md](harbor/passes/m.md) | CITY 2.0 MUSIC |
| M2 | Oct 23 | [passes/m2.md](harbor/passes/m2.md) | MUSIC FIXES + DAY BUILDINGS |
| M3 | Oct 23 | [passes/m3.md](harbor/passes/m3.md) | FIX PASS |
| PART 7a | Oct 23 | [passes/part-7a.md](harbor/passes/part-7a.md) | THE SPEAKEASY'S LOOK (+ the layout, the first tap, the beat after returning, near brick + the lighthouse) |
| PART 8a | Oct 23 | [passes/part-8a.md](harbor/passes/part-8a.md) | THE PROMENADE'S LOOK (+ the 7a follow-ups, the sound slots) |
| FP | Oct 23 | [passes/fp.md](harbor/passes/fp.md) | FOREGROUND POLISH |
| FP2 | Oct 24 | [passes/fp2.md](harbor/passes/fp2.md) | FOREGROUND POLISH 2 |
| PF | Oct 24 | [passes/pf.md](harbor/passes/pf.md) | PROMENADE FINAL TOUCHES |
| BS | Oct 24 | [passes/bs.md](harbor/passes/bs.md) | THE BEAT-SYNC PASS |
| PART 7b | Oct 24 | [passes/part-7b.md](harbor/passes/part-7b.md) | THE SPEAKEASY'S LIFE |
| SP2 | Oct 24 | [passes/sp2.md](harbor/passes/sp2.md) | SPEAKEASY POLISH |
| PART 8P | Oct 24 | [passes/part-8p.md](harbor/passes/part-8p.md) | THE PEOPLE (the promenade + the rooftop) + THE SPEAKEASY POLISH CARRY-OVER |
| FP3a | Oct 24 | [passes/fp3a.md](harbor/passes/fp3a.md) | FOREGROUND POLISH 3a: THE FIXES EVERYONE SEES + THE CLEANUP + THE PEOPLE'S COLOURS |
| FP3b | Oct 24 | [passes/fp3b.md](harbor/passes/fp3b.md) | FOREGROUND POLISH 3b: THE PEOPLE WALK RIGHT + REAL DOORS + THE DANCE CIRCLE + THE FACADE |
| PART 6b | Oct 24 | [passes/part-6b.md](harbor/passes/part-6b.md) | THE SPECIAL SKY |
| POLISH 4 | Oct 25 | [passes/polish-4.md](harbor/passes/polish-4.md) | THE OWNER'S FP3b + 6b REVIEWS: THE SKY + THE FOREGROUND |
| PART 8b1 | Oct 25 | [passes/part-8b1.md](harbor/passes/part-8b1.md) | THE LIFE, PART 1 |
| PART 8b2 | Oct 25 | [passes/part-8b2.md](harbor/passes/part-8b2.md) | THE LIFE, PART 2 |
| THE TR-3B's MUSIC, THE F-22, NO TRAFFIC | Oct 25 | [passes/the-tr-3bs-music-the-f-22-no-traffic.md](harbor/passes/the-tr-3bs-music-the-f-22-no-traffic.md) | THE TR-3B's MUSIC, THE F-22, NO TRAFFIC |
| C2 | Oct 25 | [passes/c2.md](harbor/passes/c2.md) | CLEANUP 2 + THE OWNER'S REVIEW FIXES |
| PEO | Oct 25 | [passes/peo.md](harbor/passes/peo.md) | THE PEOPLE'S MOTION |
| POLISH 5 | Oct 25 | [passes/polish-5.md](harbor/passes/polish-5.md) | THE LOAD, THE SPEAKEASY'S GLASS, THE COLOURS, THE HYDRANT, THE SKY'S MESSAGES |
| PART 9a | Oct 25 | [passes/part-9a.md](harbor/passes/part-9a.md) | THE WEATHER + THE POLISH 5 REVIEW FIXES |
| SP3 | Oct 26 | [passes/sp3.md](harbor/passes/sp3.md) | THE SPEAKEASY + CRISP NEON |
| PART 11a-1 | Oct 26 | [passes/part-11a-1.md](harbor/passes/part-11a-1.md) | HALLOWEEN + DAY OF THE DEAD (+ the shared holiday system + the window figures) |
| SP4 | Oct 26 | [passes/sp4.md](harbor/passes/sp4.md) | THE SPIDER + WEB REDONE, THE WINDOW PEOPLE LIT, THE WEATHER SOURCE FIXED FOR GOOD |
| WIN | Oct 26 | [passes/win.md](harbor/passes/win.md) | THE WINDOWS PASS: 2.5D ROOMS, THE TV ROOM REBUILT, THE CASH COUNT, THE HUSH WORD ON THE WALL, THE WINDOW BUGS, PLAY ALL + A TIDY PANEL |
| WIN2 | Oct 26 | [passes/win2.md](harbor/passes/win2.md) | THE SPIDERS' TRIP + NERVES, THE WINDOWS THAT READ AS-IS, THE EDGE WINDOWS' MOODS, THE EYES IN THE HAZE, PLAY ALL ON ITS OWN CLOCK, THE QUALITY STEP, T… |
| WIN3 | Oct 26 | [passes/win3.md](harbor/passes/win3.md) | THE SPIDERS RIGHT FOR HALLOWEEN, THE PANEL'S SCENE BUTTONS, THE BOSS'S TV ROOM, THE CASH COUNT, THE PARTY IN THE WINDOWS |
| Review findings |  | [passes/review-findings.md](harbor/passes/review-findings.md) | Review findings (Part 1) |
| SP5 | Oct 26 | [passes/sp5.md](harbor/passes/sp5.md) | THE SPEAKEASY FOLLOW-UPS: THE SPIDERS, THE BOSS'S ROOM, THE WINDOWS, THE PARTY, THE PROMENADE DANCE, THE BLADE'S WEEKLY LOOK, CLEAR ALL = THE REAL CIT… |
| PART 11a-2 | Oct 26–27 | [passes/part-11a-2.md](harbor/passes/part-11a-2.md) | THANKSGIVING + THE PARADE (+ HALLOWEEN's LAST TOUCHES, THE BOSS's TWEAKS, THE UFO REDESIGNED, THE WITCH SMOOTH, BLACK FRIDAY) |
| SP6 | Oct 27 | [passes/sp6.md](harbor/passes/sp6.md) | THE FIXES BEFORE WINTER: THE CLOUD MINUTES, THE BLUE TV WINDOW, THE BOSS's PARTY WINDOW, THE UFO's BEAM + SPOT, CREDITS, THE THREE ROOF MODES, THE VEH… |
| PART 9b | Oct 27 | [passes/part-9b.md](harbor/passes/part-9b.md) | WINTER: THE CLIMATE FALLBACK, THE SNOWPACK, THE WINTER WORK + PLAY, SNOW ON THE NEON, THE JANUARY SNOWMAN |
| THE UFO BAKE | Oct 27 | [passes/the-ufo-bake.md](harbor/passes/the-ufo-bake.md) | the abduction's craft from a real 3D model |
| 9c | Oct 27 | [passes/9c.md](harbor/passes/9c.md) | THE FIXES BEFORE THE TOWER: WINTER MADE TO READ, THE CRISP LAYER, THE CENTREPIECE FLOODS, THE SIGN'S SNOW IN THE BLACKOUT, THE BOSS's CREAM BLIND, THE… |
| 9d | Oct 27 | [passes/9d.md](harbor/passes/9d.md) | THE FIXES II: THE TR-3B + SNOW + PARTY LINK, THE DOORS (THE SNAP, REAL LIGHT, THE FLAT GIANT), THE SIGN's SNOW LIT NATURALLY, THE FROST PANE ONLY, THE… |
| 9e | Oct 28 | [passes/9e.md](harbor/passes/9e.md) | THE FIXES III + THE CITY LIFE + THE CONSTRUCTION TOWER + THE SAX |
| 9f | Oct 28 | [passes/9f.md](harbor/passes/9f.md) | THE FIXES IV: LOAD WEATHER, THE TAPE ON THE DRAIN, THE PAPER OUT, THE JOGGERS, THE REAL TOWER IMPLODES, THE SITE AT NIGHT |
| BNAME | Oct 28 | [passes/bname.md](harbor/passes/bname.md) | THE CRANE FROM A REAL 3D MODEL + THE TOWER'S SHORTER CYCLE + ONE BAKE TOOL |
| 9g | Oct 28 | [passes/9g.md](harbor/passes/9g.md) | THE FIXES V + THE UFO's SOUND |
| PROM | Oct 28 | [passes/prom.md](harbor/passes/prom.md) | THE PROMENADE, FINAL + the 9g follow-ups |
| C4a | Oct 28 | [passes/c4a.md](harbor/passes/c4a.md) | THE SHOPFRONT + THE GROUND |
| C4b | Oct 28–29 | [passes/c4b.md](harbor/passes/c4b.md) | THE PEOPLE + THE LAYOUT |
| C4c | Oct 29 | [passes/c4c.md](harbor/passes/c4c.md) | THE OWNER'S BUGS + THE MEASURING TOOLS |
| C4d | Oct 29 | [passes/c4d.md](harbor/passes/c4d.md) | THE CODE, THE TESTS, THE DOCS + the bus's dwell, the forced dog walk, the harvest model's load told |
| HOTFIX | Oct 29 | [passes/hotfix-oct29.md](harbor/passes/hotfix-oct29.md) | THE FORCED BUS AT 5 FPS (the plan cache) + THE BASELINE GUARD, the harvest model's readout row + iOS fallbacks, THE DOG's TURN |
| NIGHT-A | Oct 29 | [passes/night-a.md](harbor/passes/night-a.md) | THE NIGHT LIGHT (`&light=new\|old`: one warm wash, an even base, no pools; THE BRIGHTNESS LADDER), JOIN = HOST at night + the corner rings, the harvest model re-baked in the city's light + golden hour, the bad time zone, the panel's party song, stored forces vs links, the strips scroll on iOS, the trees' night shadow, the boss's window by day |
| NIGHT-A2 | Oct 29 | [passes/night-a2.md](harbor/passes/night-a2.md) | THE WEEKEND FIXES: the new night light the DEFAULT, the mirror door silent, the trees' night shadow darker + soft, the boss's blind fully down by day, THE STANDING PROPS ARE SOLID (aroundSolids), THE BEAT (a trusted grid always punches; the saved lead per output, never clamped / never after a return; THE KICK TABLE; party3's grid fixed), Saturday's speed (no leak; the party's canvas churn 24 → 3 a second), the cloud's IndexedDB check, + the EVENING song c2-80s-retro-synthwave |
| NIGHT-B | Oct 29 | [passes/night-b.md](harbor/passes/night-b.md) | THE STREET PARTY: the tidy-up (e2e-harbor split per cloud job, docs/harbor/decisions.md, CLAUDE.md trimmed), THE SOLIDS (core/harbor-solids.js — the cart, the benches, the trunks, the poles, every holiday piece), THE CITY TIMETABLE (core/harbor-schedule.js) + THE TIER TABLE (core/harbor-tiers.js), the party crowd all night in pockets + THE DANCE BREAKS (the conga, the bounce, wands up, swing pairs, a mix) on the party's own song clock + THE BIG CONGA + the street spill + the bench dancers (core/harbor-streetparty.js), the crowd's sounds, THE STAGE LIGHT + the party dim behind `&stage=` |
| SKY-A | Oct 30 | [passes/sky-a.md](harbor/passes/sky-a.md) | THE HELICOPTER, THE F-22s, THE BLACKBIRD, THE TR-3B: the dance-break helicopter low over the water (clear of every sign), drifting + turning, its beam diffused + pre-baked; the canvas leak fixed (949 → ~600); the patrol's original circuit ×2, every ~30 min at night; no own-player start on a synced night; the F-22 model everywhere (a vic + a unison bank); THE BLACKBIRD (drawn, one art switch; the chase, solo sightings, the watcher's reward; the late double boom); the TR-3B at full res + its lights lighting the world; the legends' registry |
| SKY-B | Oct 30 | [passes/sky-b.md](harbor/passes/sky-b.md) | THE PARTY's SPEED (the phone bench tells the truth: a fresh page per scene, the cool-down, the frame side, the PROFILE; the vignette a page layer; the break helicopter OFF; the canvas climb), THE PATROL's CIRCLE (closer, behind the towers, stops that look) + THE BLACKBIRD's fixes (the crackle heard, the cone centre stage + lingering, a longer body), THE SHADOWBOXER (his nights, his room, his sounds' slots), MUSIC AS RADIO STATIONS (every mood on the server clock) |
| ATM-B | Oct 31 | [passes/atm-b.md](harbor/passes/atm-b.md) | THE PANEL PARTY ON race (the hand-off carried over a station change) + COATS + SCARVES streaming, FOG AS DEPTH (veils by depth, the lights' halos, drifting banks; mist vs dense), THE STORM (the storm deck lit from inside; intra-cloud / far / close strikes — thick forks onto a crown, the water or THE NEEDLE; the crack on top of a close one; &force=strike), FREEZING RAIN = ICE (icicles on every ledge + the signs' frames, the glaze, the sheen, careful steps, the sleet), HEAVY SNOW IN LAYERS + THE BLIZZARD (the whiteout, the snow driven sideways, the trees shaking, streamers + drifts, the blizzard loops) |
| ATM-D | Oct 31 | [passes/atm-d.md](harbor/passes/atm-d.md) | THE CLEANUP for the owner's ATM-C review + the puddles + the pumpkin: the sun as a glowing light (a painted white core blooming into its gold, a soft orange disc only at the horizon), the storm's rain finer + mostly dark, a close strike's boom within 0.5 s (far ≤ 3 s), close lightning on the nearest roofs + the water in the far strikes' style; REAL PUDDLES (clustered, irregular, dark mirrors, a damp ring, iced in freezing rain; the trunks cut out so a tree stands in front), the blizzard's ground snow dancing + off the facade, the fog's line (the party's sky beams' crisp 8 % in fog) + the veils' hard tops; the searchlight's clear line, the cab pickup on the curb side (the far rear door, ducking out of sight), the boxer's bag +8.6 %, the Halloween pumpkin at the O's full size |
| PERF-A | Nov 1 | [passes/perf-a.md](harbor/passes/perf-a.md) | THE FIRST SPEED PASS (FR5 + the Grok review + the owner's phone bench): the owner's fixes (the dragon eggs full width, THE NEAR LAUNCHES, the willow curtain's line = the wash quad's edge, the phantom 2D rockets, the blizzard's streamers off, the balloons over the billboards, the two bitcoin balloons the opposites), THE LOADS (the pixel watch, the Christmas wire kept, the weeknight show's load), DENSE FOG (WebKit 34.5 → 25.9 ms: gradient strips, banks in one strip, no clouds under a dense veil), the finale's washes at ¼ res, GREEN MEANS GREEN (LOAD WEATHER in the city + five test bugs), THE PROFILE + TABS + ADMIN, the overhead (unit 83 → 30 s, 4 shards ~21 min) |
| WSP | Nov 1 | [passes/wsp.md](harbor/passes/wsp.md) | WEATHER + SKY + PEOPLE: the dragon eggs one salvo, the balloons' layer snap + the near ones faster over the letters, the premium ₿ (the real mark on the sphere), THE SKULL; the clouds' flicker (a true crossfade) + the moon behind thick clouds; drizzle you can see, the blowing snow eased, THE GALE (galesea.js); the tree model tried (not shipped — a preview); the washers, a few more people by day, the boxer's towel-off removed, the bag's level with the music off, the boss's night (shade + nightlight) |
| WINDOWS | Nov 1 | [passes/windows.md](harbor/passes/windows.md) | Group 0: THE QUIET DEFAULT FLIP (City 2.0 at the plain address; City 1.0 behind `?city=1`, untested), ONLY PRISM DROP + OVERCLOCK PLAYABLE, THE FIVE SIGNS, the finale's last order, the menacing skull, balloons in front of the high clouds, the two cloud flakes; THE WINDOW SCENES AS TIMETABLE ROWS (core/harbor-scenes.js), the old scenes RETIRED, the shades after hours + the lights out one at a time; THE JUGGLER, THE CRATE GUY, THE CHARLESTON, THE BOOKIE; the owner's add-on: the edge windows' shades |
| DESKTOP | Nov 2 | [passes/desktop.md](harbor/passes/desktop.md) | The owner's WINDOWS review (the juggler's plain wall + green room + neon balls, the Charleston bigger + bolder, the bookie's lamp + the big hat throw, THE CRATE GUY REWORKED — stocky + one continuous motion, `&force=boss-shade` + `&force=shades`); the test fixes at their causes (the party-sync clock timed by the network, the calm load calm + on the real compositor); THE DESKTOP CAMERA (1.4× closer, the eye at 8, the near edge z 50, ≤ 2.2 : 1 + the fade, the sign 1.25×); THE DESKTOP UI (hover, Esc, the held resize, THE PIXEL BUDGET); sideways + iPad; THE STANDING RULE |
| SCHED | Nov 2 | [passes/sched.md](harbor/passes/sched.md) | The owner's DESKTOP review (the juggler back to amber, the window links from the reveal + looping, the boss's pull as a cream shade over the lit TV — never a figure, TURN YOUR PHONE UPRIGHT) + THE MIGRATION (every older timed system's knobs into THE CITY TIMETABLE — a golden table of 36 planners × a year unchanged; no stray time left: tests/harbor-sched-strays) + THE scene.js SPLIT (scene-legend / holiday / weather / party / perf / panel; draw() quartered — scene.js 3807 → 2968) + THE NEW SCHEDULE (core/harbor-showcase.js: THE SHOWCASE DIAL, prime time, the legendaries 2–3 a weeknight / one an hour on a party night, the medium tier; the sim: HIGH 1 in 137 / 1 in 70) + THE BILLBOARD's HINTS (core/harbor-billboard.js) + THE DAY CHART (/daychart + /admin) |
| THE SPEED PASS | Nov 4 | [passes/speed.md](harbor/passes/speed.md) | The owner's LOBBY FIXES notes (your card first, one toast, the figures walk off ringless, the banner above every crown, EDIT USERNAME, WAITING / FOR HOST) · /admin tidied + TEST PLAYERS + THE PROGRESS RESET · green means green (G1 G3 G4 G8, A7 measured). Group 3 (the phone's speed) → THE SPEED PASS B. |
| LOBBY FIXES | Nov 4 | [passes/lobby-fixes.md](harbor/passes/lobby-fixes.md) | The owner's real-phone test of the room: THE PLAYER CARD (screens/crew-row.js), ONE ACCOUNT · ONE ROOM (js/seat.js, seats/{pid}; progress.js#overlaps), REMOVE TEST PLAYERS (api/_lib/testplayers.js), THE NEW GAME START redone (room-show.js#START full 5 s / quick 3 s — the game's sign in the NEON pink, the walk-in, a fade; no push), AFTER THE MATCH v2, the host's share card, the banner plane in front of the clouds (skyfx.js#bannerOver), the plate fit, NAME + COLOUR at CUSTOMIZE's top (profile/edit.js), the music corner, nearest-edge arrivals (harbor-room.js#arriveSide), the radio's rest fade. RULES CHANGED. |
| FR6 FIXES A | Nov 4 | [passes/fx6a.md](harbor/passes/fx6a.md) | SAFETY from review-6.md: THE CLOUD TRIGGER (no path filter — a tagged push runs; tests/workflows.test.mjs), shots/ ignored; THE DOGS keep one look (peopleEnv's two wind keys), THE FAST LEGENDARIES' POLAROID at the tap (sgfast), THE ROOM PUSH only for an open room (+ limits, THE TEST FLAG, THE LIVE-SITE GUARD); C1 a profile that owns anything never deleted + C2 YOUR PREVIOUS KEY; ONE WRITE PATH (a refusal reported) + THE RULES AS PUBLISHED (rules-live.test); C3 the rush bound; C5 the admin pid; C8 the logs pruned; B1–B7 the console's flows (closeAll at the start, one start at a time, a dead start says so — gameflows). No rules change |
| LOBBY 2.0 B | Nov 4 | [passes/lobby-2b.md](harbor/passes/lobby-2b.md) | THE GAME START + THE CITY PAUSE (core/room-show.js, room-city.js#startFx, people.js#planIn), AFTER THE MATCH: the walk back out, THE WINNER's BANNER PLANE + THE NIGHT's CHAMPION (room-banner.js), THE REMATCH VOTE (room-dock.js, rv/), THE CARTRIDGE PLUG (games/cartridge.js, docs/cartridge.md), Group 0 (the tap area, THE LAYER STACK, RESTORE, "1 OF 1"), the add-ons (LEAVE ROOM, the crew's sky moments, ONE SHEET STACK, the vote tidied) |
| LOBBY 2.0 A | Nov 3 | [passes/lobby-2a.md](harbor/passes/lobby-2a.md) | THE ROOM IN THE CITY (two lines of 4 at the door — core/harbor-room.js + room-lines.js; people.js#room; the tags — screens/room-city.js), THE ROOM DOCK (room-dock.js), THE GUEST LIST (room-guests.js) + the lobby sounds, TYPING BUBBLES + THE CHAT FIX, THE PROFILE POLISH, CENTURY (fx/deco.js), THE STEPPED PLATE, REAL USERNAMES + THE REPORT PUSH, THE BILLBOARD's cross-fade, the two old reds, THE SAVE-YOUR-KEY POP-UP; B's hand-off |
| THE VAULT 2C | Nov 3 | [passes/vault-2c.md](harbor/passes/vault-2c.md) | THE POLISH: the lab's FIX marks (REAL FIRE — js/fx/fire.js; THE SHADOWBOXER in the speakeasy's back room — speak-front.js#drawBoxer; the dev cards' 1 OF 1 · DEV), THE LAB 2.0 (the ☰ row, versions + CHANGED, filters, one row per item), THE TIER GEMS + THE DEV GEM (js/vault/gems.js), FOUNDER + the badge slots, CUSTOMIZE + ONE EMBLEM SYSTEM (the 12 sign-up shapes as commons), THE PROFILE REARRANGED + LESS GOLD + TROPHIES (js/progress/trophies.js), THE WRONG DOOR (404.html) |
| THE VAULT 2B | Nov 3 | [passes/vault-2b.md](harbor/passes/vault-2b.md) | DRESS YOUR CARD (js/vault/dress.js), MEMBER NUMBERS (api/_lib/members.js — the owner Nº 0001), THE TWO DEV CARDS (js/fx/dev-switch.js + dev-source.js — ONE OF ONE · DEV), the 2 FIX full cards on the city's REAL speakeasy (js/fx/speak-front.js), the reveal (&sgdemo waits, names on one line, the real emblem), THE CROWN's own shape; the rest of the set — 24 emblems + 7 finishes, 14 glows, 8 tube styles (js/vault/beat-sync.js) |
| THE VAULT 2A | Nov 3 | [passes/vault-2a.md](harbor/passes/vault-2a.md) | THE 3 HELD CARDS (FOUNDING MEMBER's opening night — the title's neon lighting letter by letter + the date stone + the member's gold №; THE HOUSE in full blaze + gold willows; PLATINUM the metal card, epic) + LIGHTS OUT's red pulse + I'M NEW HERE gone; THE EMBLEM SYSTEM (js/vault/emblem-art.js — a shape + a finish as composited SVG layers; tube styles; name glows js/vault/glows.js; the picker's style rows; the lab's EMBLEMS + GLOWS tabs) + 17 samples for the owner's marks; THE PROMINENCE RULE as the speed budget (a legendary card leads) |
| THE VAULT 1C | Nov 3 | [passes/vault-1c.md](harbor/passes/vault-1c.md) | THE ONE TIER PALETTE (js/core/rarity.js — THE PROGRAM's every row badged + tinted) + the I'M NEW HERE welcome; THE 8 SIGHTING CARDS from the city's own models (js/fx/sg-*.js; the SR-71 + F-22 re-baked at a hero angle — scripts/bake/*-card.mjs; the city's TR-3B / ghost ship / aurora / balloon painters exported) + the reveal's + album's scene; 21 of the 24 held-back cards (14 new effects + combo, 10 CC0 textures); PLATINUM / THE HOUSE / FOUNDING MEMBER held back |
| THE VAULT 1B | Nov 3 | [passes/vault-1b.md](harbor/passes/vault-1b.md) | SPEED FIRST — the effects on the GPU (js/fx/gl.js, a 2D look-alike over WebGL2; the 2D canvas the fallback), scroll-pause, THE DIAGNOSTICS ROW + THE VAULT BENCH; the owner's fixes (the no-tap sighting: a trusted touch ≥ 800 ms after the page was shown, down + up on the legendary, a trace to /admin; THE VAULT PICKER of real strips; THE NAME NEVER CUTS OFF; every bottom sheet floats; SAVED ✓; the key's line); THE FULL CARDS; the launch set's first 8 (GILDED → MIDNIGHT & CHAMPAGNE); ITEM NAMES ONLY TO OWNERS (api/_lib/catalog.js + withShow); THE PROGRAM shows the full day |
| THE VAULT 1A | Nov 3 | [passes/vault-1a.md](harbor/passes/vault-1a.md) | THE STYLE TEST (docs/vault.md): the owner's PROGRESSION B review (a skip-tap never a sighting, THE PARKED PRINT as one tappable eased gesture, NO SMALL ITALIC, PINK ONLY BIG) + BRING YOUR CARD (one card on all your devices, SAVE YOUR KEY, USE THIS CARD ON ANOTHER DEVICE); THE CARD LAB (/lab — APPROVE · FIX · CUT, server-checked + audited, the public export); THE EFFECT LIBRARY (js/fx/ — ONE shared renderer: smoke, frost, flames, prism, marquee, glitter, THE BORDER LASER, the UFO's life; fxDpr + fxParticles in THE TIER TABLE); THE 8 SAMPLE CARDS as SLIM STRIPS + two test emblems (THE PROMINENCE RULE); 8 legendaries at 4× CPU = 60 fps on the GPU path |
| PROGRESSION B | Nov 2 | [passes/progression-b.md](harbor/passes/progression-b.md) | CITY SIGHTINGS (docs/progression.md): a tap on a legendary → its REACTION (the same sprites: the UFO's wobble, the TR-3B's racing lights, the F-22s break apart, the Blackbird's nose-up + afterburners, the ghost ship's lanterns, the skull's roar, the ₿'s bob + gold pulse, the aurora's ripple, the fireball's burst) → the FLASHBULB + THE REAL POLAROID (the city's own frame at full dpr) → SPOTTED → the MATCHED PAIR, SERVER-VERIFIED (the seeded timetable + the radio's record: the owner's once a day, the crew never; the fireball seeded); THE ALBUM on the device; BIRTHDAYS (once a year; the city's HAPPY BDAY skywrite); CALL IN A FAVOR (the crew's jacks for your room, dormant till LOBBY 2.0) + the owner's PROGRESSION A review (the moment on one screen, the held level-up, IVORY NAMES, THE BIG FLAME streak card, THE PROGRAM's three sections, the intercom's WHEN) |
| PROGRESSION A | Nov 2 | [passes/progression-a.md](harbor/passes/progression-a.md) | THE ENGINE (docs/progression.md): LEVELS 1–100 (OWNER 45,000; THE YEAR SIM), THE STREAK (4 am, freezes, WIN IT BACK, the outage) + THE DAILY CONTRACT, THE AWARD ENGINE + THE 30 ACHIEVEMENTS + THE FOUNDER switch (THE LEDGER), THE END-OF-ROUND MOMENT + level-up + streak card + THE GILDED CARD + the dock's flame + 9 sounds; Group 0 the dusk flake; the ADD-ON = the owner's CC-B review (the radio's scroll jump, the intercom's mic = iOS's audio session, the willows a fast rolling curtain, SAVE AS A ONE-TAP JACK) |
| CITY CONTROLS B | Nov 2 | [passes/city-controls-b.md](harbor/passes/city-controls-b.md) | The owner's CC-A review (the knob's three words, coloured smoke, STOP / CANCEL on a lit jack, no long-press, the big ✕, THE WILLOW SWEEP left → right) + THE INTERCOM (hold to talk → review → send / unsend; the chime + the PA; JUST ME · LOBBY ONLY · EVERYONE; held in a game) + THE CREW (the grant, the cut-down desk, one radio per lobby + ASK + hand-over — dormant until LOBBY 2.0) + PRESETS + "A ROOM JUST OPENED" (Web Push, no new service) |
| CITY CONTROLS A | Nov 2 | [passes/city-controls-a.md](harbor/passes/city-controls-a.md) | The owner's SCHED review (the day chart 24 h, the Charleston's horn out, the juggler copper, the billboard's messages crisp at night, THE FINALE's GAP) + THE RADIO: the server's roles per action + the moment actions + delivery + the audit log, the corner button, THE CITY BEHIND, THE DESK (the jacks from the timetable, the patch cards, the lamps, the billboard jack, LIGHTNING, SKY BEAMS, CLEAR ALL), THE PROGRAM, THE LEDGER |
| PERF-B | Nov 1 | [passes/perf-b.md](harbor/passes/perf-b.md) | THE SECOND SPEED PASS (the owner's PERF-A review + his phone bench): the finale's left clip (the fireworks mask decoded × the layer's height, encoded / the screen's), THE BALLOONS GET THE WHOLE SKY (the depth rule: the near ones in front of the sign on small overlays) + THE DISCO BALL, THE CLEAN GLASS in fog + snow (+ wisps), the fog's density by day, the blizzard's first seconds (the frost pane in steps, one soft glow layer, a page layer over the vignette: 0.70 → 0.25 s in WebKit); the finale's GPU (the live range, the pops, the reflections); fog = a clear night's cost in WebKit; the windows group in parallel (446 → 280 s), the sleeps → conditions, the cloud's minutes; every canvas counted, the wind's five leaks, the timetable, the tier table; scene-fireworks.js (the first cut) |
| PART 10 | Oct 31 | [passes/part-10.md](harbor/passes/part-10.md) | THE FIREWORKS (+ the owner's ATM-D review fixes): the storm deck as real cumulonimbus, the silent flashes, the blizzard's wisps, the fog's line (the beams' ends), the cab fare standing up, the boxer walking in + every night; ONE GPU ENGINE (closed-form sparks, real shell types, comets, lit smoke, the city's wash, reflections) BEHIND THE LIT SIGN; every night's shows on the timetable (9:30 · the party's 10 pm full show + the gold willow curtain · midnight's few), the weather + conflicts, the crowd stops + looks up; Grok's recorded sounds with the distance delay + the party show on the song's beat grid |
| ATM-C | Oct 31 | [passes/atm-c.md](harbor/passes/atm-c.md) | THE CLEANUP for the owner's ATM-A + ATM-B reviews: the patrol's hover + LEGS clear the near pieces (fresh load, WebKit, 200 seeds; a re-plan when they change), PANEL PARTY ON's false "heard", the veil (a milky sheen + fibres, the halo rare), the sun's colour by its height + the warm low-sun sky, ONE SOFT-FLAKE FIX, the rain's corners, freezing rain as ICE, the lighthouse + beacons in fog, the RECORDED THUNDER (the flash on each take's crack), the boxer's bag, the TR-3B (water reflection, building-by-building blackout, breathing flares), cab riders through the open door, umbrellas held, the boss's shadow solid, the blade's inline out, THE WINDOW STANDARD, the admin panel tidied |
| ATM-A | Oct 31 | [passes/atm-a.md](harbor/passes/atm-a.md) | GREEN MEANS GREEN (the test browser muted + 60 fps on the mini PC's 29 Hz TV, the first-tap surge's race, the memory check without V8's compiled code, the crisp list's wait), THE MODELS REVIEW FIXES (the boxer's air punches + the wrap-up blind, the patrol over the billboard, the TR-3B casts no light, the cone 10 % shorter, the Mothman postponed), WIND AS ONE SYSTEM (core/harbor-wind.js: gusts as waves; the crowns on springs with no ghost; the rain, snow, leaves, people, water in step; the water never a mirror; Grok's 13 weather sounds), THE SUN a white-hot core with no rim |
| MODELS | Oct 30 | [passes/models.md](harbor/passes/models.md) | THE MODELS PASS — the first on the MINI PC: the docs + the silent phone bench (+ a load-freeze line) for the new build machine, THE LINKS RULE (a link's legendary ≤ 5 s after the tap; EVERYONE yields to a forcing link); THE MOTHMAN from two baked Hunyuan models (the perch on the neon needle, the stutter swap, the glide; red eyes in code); THE SR-71 MODEL behind the Blackbird's art switch (the default) + the cone never clipped + the boom the loudest sound; the drained city dark (no pink glow); THE PATROL as a baked helicopter (24 headings, live rotors + lights, bigger up close, never hovering behind the speakeasy, a smooth searchlight); THE SHADOWBOXER's room reworked + his 20 sounds; the stations' two-device lag (SPEAKER DELAY); a 10th cloud job |
| NIGHT-C | Oct 30 | [passes/night-c.md](harbor/passes/night-c.md) | THE HELICOPTER, THE ROOF SIGNS, THE QUIET BUILDING: the stage light ON by default + a real zebra crossing; THE PARTY SONG IN SYNC (core/party-deck.js + audio/party-music.js — the deck on the server clock, the breaks on the heard song, the live city on the server clock); THE HELICOPTER (core/harbor-heli.js — the patrol on its timetable + up for every dance break, its beam on the crowd); THE ROOF SIGNS AT 3× (neon.js#drawOne — one drawing for the city + the crisp copy); THE QUIET BUILDING (core/harbor-moments.js#parkedNight) + the live windows at 3× |
| SHELL 2.0 A | Nov 5 | [passes/shell-a.md](harbor/passes/shell-a.md) | ONE LOOK EVERYWHERE (the owner's approved mocks, docs/harbor/refs/shell/): THE NEON TUBE, THE SHEET + THE ROW, THE MESSAGE, the ONE Esc + the layer stack (H1 H2 H11 H12); every screen on them (the ☰ menu, CUSTOMIZE's neon rings, the YOU page, GUESTS, /admin, THE LAB, the dock's labels + streak pill); the full card's tier gem + THE 1-OF-1 BADGE; THE PODIUM's FRAME (BACK TO THE ROOM under the XP box, finalScene) + THE CHAT LOCK hides; the add-on: slim-card results rows + the XP box fit; Group 0 = CITY 1.0 OUT's two cloud reds at their cause. No rules change. |
| SHELL 2.0 B1 | Nov 5 | [passes/shell-b1.md](harbor/passes/shell-b1.md) | the owner's SHELL A fixes (the 1 OF 1, no streak on the dock, ‹ back on every nested sheet, THE RADIO in the shell look, THE RACING CLOUDS' phase — core/harbor-phase.js, PRISM DROP's E2E on the room) + THE GPU PIN + THE CONTRACT (meta.js + the lazy cartridge, the kit's READY + the night path, mood music) + THE SOLO LANE + THE LOOK SWITCH + COLOUR-BLIND |
| CARD FIXES | Nov 5 | [passes/card-fixes.md](harbor/passes/card-fixes.md) | the owner's LAB notes on the gift cards + THE ANARCHIST v2 + THE CARD LAYOUT RULE (vault/layout.js — the plate off the hero, THE REVERSE STEP, nothing overlapping) + DEV · Nº, the reveal's solid header, PRESS START; no rules change |
| OVERCLOCK CARDS | Nov 5 | [passes/overclock-cards.md](harbor/passes/overclock-cards.md) | REDLINE + PHOTO FINISH (Grok's art + js/fx/oc-cards.js — the needle, the laser) + their server-checked unlocks; the add-on: the after-match tiles, SOLO RUN, a solo run never hosts; no rules change |
| BUZZED LIGHTYEAR | Nov 6 | [passes/buzzed-lightyear.md](harbor/passes/buzzed-lightyear.md) | the 1-of-1 gift card (the picture taken apart: the spiral fitted + turning behind him, the stars orbiting, the HIC! popping; the strip composed eyebrows → chin) + THE CARD TEXT STANDARD on every full card; the gift strip mapping fix |
| THE LOAD FIX | Nov 6 | [passes/load-fix.md](harbor/passes/load-fix.md) | the owner's four load problems on his iPhone reproduced in WebKit (wk-load.mjs + kit/load-probe.mjs → four `load` checks) + fixed: the bars keep the city (no doubled lettering), ONE CAMERA ON SCREEN (hold, then cut), the boot screen holds until the city (ONE fade, never the dark title), the #net pill hidden from the first frame; no rules change |
| HOLD'EM IN THE CITY | Nov 11 | [passes/holdem-city.md](harbor/passes/holdem-city.md) | THE BILLBOARD → NOW OPEN (the timetable's default from Nov 11 — the billposter's one paste); HOLD'EM's skyline SIGN + DAY FACE in GRIDLOCK's spot (THE FIVE SIGNS = PRISM DROP · OVERCLOCK · HOLD'EM + NEON PAR · HIGH STAKES; the slot rule counts a row's letters — the apostrophe tube rides along; night casino red, the day face gold on felt); THE BOARD's HOLD'EM TAB (TOURNAMENT WINS, KOs the tie-break, the earlier — one sort value from the dealer's record; five tabs at 390; the back-fill); HE9's B2 (44 pt corner tap areas — the `tapfit` probe), B3 (the podium's sticky BACK TO THE ROOM + MORE BELOW), B4 (everyone tied = a draw: ALL TIED, 2nd-place night points, no win); no rules change |
| LOAD FIX 5 | Nov 11 | [passes/load-fix-5.md](harbor/passes/load-fix-5.md) | THE DOUBLED CITY (the owner's iPhone: the billboard, EST. 1924 + the blade twice) reproduced to the point in WebKit — the city's box moved before the reveal with no window resize; THE BOX GATE + the held picture's safety in on-screen time; THE GUARD — NO TWO CAMERAS (`kit/two-cameras.mjs`: `wk-double.mjs` + the `cameras` group); no look change, the reveal unchanged |
| LOAD FIX 4 | Nov 10 | [passes/load-fix-4.md](harbor/passes/load-fix-4.md) | GROK'S BOOT AUDIT (13 findings answered): THE REJOIN LIMIT, THE SKEW WRAPPER + the city's graph's skew path, the boot's gates in visible time, no lookbehind, a twice-failed sheet, the hang watch, the service worker, the load log; #2 + #9 parked; no rules change |
| LOAD FIX 3 | Nov 10 | [passes/load-fix-3.md](harbor/passes/load-fix-3.md) | THE FREEZE found (one failed / stalled module request held the boot screen forever — the parent too) + THE BOOT SAFETY NET (THE BOOT WATCHDOG inline, the hang watch at boot, the sheets + the city's module retried, the one reload); the music ON the tap (1.7–2.4 → 0.09–0.17 s); THE APOSTROPHE TUBE (HOLD'EM); NO BLACK TILES (24 code-drawn cards' baked stills) |
| LOAD FIX 2 | Nov 9 | [passes/load-fix-2.md](harbor/passes/load-fix-2.md) | the city loads fast again (THE BOOT CLOCK: nothing grew since Nov 6 — the waterfall, the song before a tap, THE LOOK TRAP; THE BOOT PRELOAD, the song at the first tap; 3.45 → 1.32 s Chromium, 2.75 → 2.2 s WebKit, the bytes halved) + the clouds never snap (no set dropped mid-blend, 6-s blends, the clock's jump absorbed); THE BOOT BUDGET + the sky guard |
| FRIENDS B | Nov 8 | [passes/friends-b.md](harbor/passes/friends-b.md) | FACE ID / PASSKEY SIGN-IN (api/_lib/passkeys.js — server-only nodes, no rules change) + THE PODIUM (Grok's sounds, OWN_VICTORY_SOUND, the music with the frame, ACCENT, the XP box, the score under the cards, the list from 4th) + THE CARDS + THE SHELL (one gem shape, no step, the 150 ms fade, the dock lit by day, og.jpg, B5, B6) |
| FRIENDS C | Nov 8 | [passes/friends-c.md](harbor/passes/friends-c.md) | THE CITY FIXES: A FIRED JACK PLAYS ONCE (the played record kept for the tab), the schedule's order, the crew radio's header; THE INTERCOM IN SYNC (EVERYONE 50 s ahead on the server clock, scheduled on the audio clock, a late phone joins mid-way); THE SKY UNDER WEATHER (the show after every weather layer); THE BLACK HELICOPTER (the medium night pass, a jack, &force=blackhelo); THE SLOW-3G START (the whole graph at once + the lobby wires it); the cloud reds |
| PD-1 | Nov 9 | [passes/pd-1.md](harbor/passes/pd-1.md) | PRISM DROP's layout + controls (THE MAX BOARD, HOLD / NEXT in the corners, THE SLIM RAIL, the red SLAM button, the console's podium, the preload) + Group 0: THE BOARD's top bar, equal tabs, no double YOU, the hidden friend's XP, the opaque player page |
| PD-2 | Nov 9 | [passes/pd-2.md](harbor/passes/pd-2.md) | PRISM DROP's battle made simple (AUTO-TARGET, THE RISING GHOST ROWS, the callouts + the tip, KO → Call the Winner → spectate) + SURVIVAL + SOLO; the facts for PD-5's cards |
| PD-3 | Nov 9 | [passes/pd-3.md](harbor/passes/pd-3.md) | PRISM DROP's NIGHT LOOK (the neon tubes + the per-world palettes, THE CALMER WORLD, THE LIGHT ENGINE: a GPU light layer + bloom, four tiers) + WHO GETS LISTED (the 3rd counted play) |
| BOARD 2.0 B | Nov 9 | [passes/board-2b.md](harbor/passes/board-2b.md) | the boards' screens: slim cards on black velvet + gold deco (tabs XP · DAILIES · OVERCLOCK · PRISM DROP), SCORES' ALL TIME, the friends list as slim cards, THE PLAYER PAGE, the long-name fix on four full cards, + the add-on SHARE TODAY = one card from each daily's own pieces |
| BOARD 2.0 A | Nov 9 | [passes/board-2a.md](harbor/passes/board-2a.md) | the new boards' server + data: THE OVERALL BOARD (xp), DAILY POINTS + the dailies' boards, the rows' slim-card ids, THE PLAYER PAGE's data (`player`), the BACK-FILL; THE FAST REVEAL (scene.js — a reveal in the first 900 ms left the city at opacity 0: the WORD TOWERS flake) + THE MONDAY BLADE (a memoised facade key before the workers' traces — LOAD WEATHER red every Monday); the BTC card's carry-overs |
| THE BTC CARD | Nov 8–9 | [passes/btc-card.md](harbor/passes/btc-card.md) | the ₿ balloon card on Grok's art — THE BURNER FLARE, the block ring, the coins, the sway, the reveal (the clean base + the cut-out balloon); the unlock proved; no rules change |
| CITY FIXES + HOLD'EM | Nov 8 | [passes/city-fixes.md](harbor/passes/city-fixes.md) | THE TAP WATCH + the lost taps (the screen at rest swallowed visible taps, re-renders under a finger, leaving pop-ups, hover rules) · THE HOLD'EM BILLBOARD (the base poster, /admin switch, COMING SOON white) · the roof board ~15 % bigger · the weekly goal's one line + solo plays off its bar · SHARE TODAY's address · the guest list holds the city · the black helicopter's turns · the board's repeat swaps · LOAD WEATHER |
| FRIENDS A | Nov 8 | [passes/friends-a.md](harbor/passes/friends-a.md) | the friends list (pfr/{pid} — RULES CHANGED), the profile's FRIENDS section + the badge + ADD FRIEND on name tags + the INVITE sheet, invites that wait (push + card), YOUR TABLE's data, THE CREW INTERCOM (the owner's switch on THE LEDGER), SAVE TO PASSWORDS |
| THE CARD PASS | Nov 7 | [passes/card-pass.md](harbor/passes/card-pass.md) | THE GIFT QUEUE (a line in ppriv, the reveal one card at a time) + B1 / B3 / B8 + seven 1-of-1 gift cards (FX plates as light with alpha, new engine layers) + THE HORSESHOE's art + THE SLIM-CARD LONG-NAME STANDARD (every strip's plate capped at its hero, nine strips moved right, harbor `stripfit`); a Safari plate-cap bug on every gift full card; no rules change |
| SHELL 2.0 B2 | Nov 5 | [passes/shell-b2.md](harbor/passes/shell-b2.md) | green means green (CREW 10/10, the panel, the profile E2E 81/81) + the owner's B1 fixes (THE HERO-SPOT AUDIT, the 1 OF 1's gradient, THE GAME LOOK in Settings, the airliner); THE GIFT CARDS + THE GIFT TOOL; MAKE HOST (rules) + the crew switch live; the idle cutoff, YOUR PREVIOUS KEY, og.png, two songs dropped; the display check |

### THE GAME START — REDONE (LOBBY FIXES, Nov 4 — passes/lobby-fixes.md; supersedes 2B's push through the door)
`core/room-show.js#START`: **FULL** (a room's first game + after a game change) = 5.0 s — the speakeasy's NEON sign powers down, THE GAME's OWN
SIGN ignites in the NEON pink at 0.56 s (tube by tube — `room-city.js#tubeDelay`, `rc-tube-on`), holds, the lines walk in from 1.5 s, the clean
fade at 4.3 s. **QUICK** (a same-game REMATCH — `host.js#rematch`) = 3.0 s — the sign lit at once, the walk-in at 0.25 s, the fade at 2.35 s. The
kind rides in the match id (`q…` — `startKind`); the game's clock = the tap + the start's length. No camera push, no layout read; reduced motion =
the lit sign + the fade. Look runs: `tests/integration/room2-look.mjs` (the beats at 300 / 900 / 1250 / 2300 / 4000 / 4700 ms + the quick start).
