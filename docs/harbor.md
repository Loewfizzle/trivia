# CITY 2.0 — THE HARBOR (the bible)

The title's new city, replacing today's district (`js/screens/district/`). A once-only, never-redo build with an uncompromising
quality bar, in 12 parts. **Every later part follows this file.** Until Part 12 switches it over, the Harbor lives behind
`?city=2` only; a normal visit gets today's city, exactly as before. Rollback point: the git tag **`city-1.0`** (pushed Oct 20 2026).

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

## The flag
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
- **The same public API as `createDistrict`** (title.js / title-dock.js use it; `backdrop.js` still images today's city for the menus
  until Part 12): `set, look, hit, signOn, palette, signCol, refresh, safeTop, safeBottom, state, setTier, tier(), sun, neonMoments,
  signCount, now, speed, skyline, frames, cost, party, finale, partyLight, street, knock, door, rainbow, debug, destroy` +
  `harbor()` (City 2.0 only; `__district.harbor()`) + `wake(ms)` / `hold(ms)` (cleanup pass 1: keep 60 fps / don't step the tier).
- **The sky modules are REUSED, called as they are** (district/): `stars, fx (back + front), sun (draw, through, halo, dim,
  moments — the rays are the Harbor's own, rays.js), aircraft, weather-fx (sky, fogLayer, flash, moonVeil), rain (veils, drops), wildlife (sky, low), frost (pane),
  fireworks, rainbow (update, sky), live-weather, palette`. They get `resize(W, H, HZ)` with HZ = the far quay's waterline and the
  same frame object (`fs`) the district builds, incl. `skyline` (the Harbor's roofline: the sun fits its arch to it, the planes
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

(Squeeze: Part 2 numbers. Part 1 measured 0.55 / 0.52 / 0.76 / 0.66 / 0.28 / 0.52 — very different drama per phone.)

- **Wide (desktop, sideways):** room = dock top − 4 − tagline bottom − 10; F = max(600 · room / 411, people ≥ 9 pt), CAMH =
  min(13.5, 0.55 (0.4 when the room is short) · room · 36.5 / F). A panorama: the harbor pieces spread (× up to 2.2), the skyline
  bands are generated across the whole width, more landmarks further out, the promenade repeats to the right edge, and a FRONT ROW
  (z 28–33: lamp + tree pairs, benches, people) lives either side of the dock (never under it).
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
- **THE LOAD GATE (FP3a, FREV B1 — the iPhone's "shrinks, enlarges, snaps" on load):** the city is held DARK until its first full frame
  is ready and revealed with ONE fade; Safari's bar changes in the load window are coalesced into one build; a baked layer is never
  stretched; no tier step during load. The detail: FP3a §5 below; tested by the `load` group (the `city` job). POLISH 5: THE LOAD LOG
  (&debug=1) + the causes that still moved the picture after the reveal fixed — docs/harbor/passes/polish-5.md §0.
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
| the menus' backdrop (`district/backdrop.js` still images today's city when no title was shown) | today's city | 12 |
| the music-off soundscape, the easter eggs, the switch-over | — | 12 |

## THE PREVIEW PANEL (Oct 22 2026) — the owner's test remote: JUST ME / EVERYONE ON CITY 2
The seed of Part 13's CITY CONTROL: every `&force=` preview, the party show's scenes, time, weather and the holiday looks from one
sheet on the owner's phone — on that phone only (JUST ME) or on every phone on `?city=2` at once (EVERYONE). City 1.0 never loads
or listens to any of it (the E2E checks: no `remote.js` request, no pill, no listener without the flag).

**CONN (Oct 28) — EVERYONE WITHOUT A SOCKET:** the free database plan allows 100 simultaneous connections, so a visitor on the title no
longer listens to `city2/live`. Every NON-admin phone polls `GET /api/admin?live=1` (edge-cached 15 s; `remote.js#poll`, every ~45 s
while the page is visible, at once when it comes back) — an EVERYONE preview reaches the other phones within about a minute (~30 s on
average), the DELAY's startAt still lines them up (`serverNow()` keeps the last known offset per device while the database is parked).
Each answer carries the server time it was read (`at`); an older answer (a cached copy after a newer one) is ignored. An ADMIN keeps the
live listener (`want('admin')`, from the moment `whoami` says so until the title goes; parked like any tab after 2 min hidden) — SEND
and its countdown are instant on the owner's phone. The E2E reads every 1.5 s under `?emu`.

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
- **The harvest model "identical" on the owner's iPhone** (C4c's review): NOT reproduced — the live site loads + draws it in WebKit and
  Chromium at 402×874 + his 402×660 (the three files 200, `model: true`, the two looks plainly different). Most likely a panel state
  (EVERYONE / JUST ME) replaced the links' own `&when`; that now says so (a toast) and the model's load is told (the LOAD log, a failure
  to /admin). Re-check with C4d's fresh links.
- The street under the dock shows no snow on a snowy night (ATM).
- The cab-stand waiter's taxi has no sound of its own (no car-door slot yet).
- `water` walkers can pass a few pt in front of the old floor line at the left (above the dock).
- The wet reflections' rain ripple re-bakes the wet layer 2.5 × a second while it rains (only then).
- A dog walking past the hydrant's big holiday piece is hidden for ~1 s (behind it).
- The harvest MODEL has day + night looks only (the drawn display re-lights per golden hour / overcast).
- The side door's amber spill lays over the out-swung leaf's foot (~2 pt).
- The memory guard's first layout counts nothing else live (nothing exists yet); every later re-plan counts it.
- The 11b Christmas tree on the compass must keep its base within ±1.3 u (the water bench clear).
- **Laptop-only (this Windows machine, headless Chromium 149):** e2e `perf`'s three BATTERY checks fail the same on the commit before
  C4d (no animation frame for 0.6 s after "visible again", 14–15 fps calm) — the cloud's Linux Chrome passes them (CI skips the two speed
  ones now, with the reason in the summary); `panelrows` "A WITCH AT HER CAULDRON" fired nothing once under a heavy local load (F18).
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

## THE FILE MAP (moved from CLAUDE.md's File layout, C4d — every Harbor module + what it holds, as the passes described them)

Read with docs/harbor.md#the-architecture. Each line names its pass (the detail: that pass's file in `docs/harbor/passes/`).

```
js/core/  (the City 2.0 half) room-logic.js hush.js lobby-song.js party.js rainbow.js trees.js street-life.js people.js rng.js obfuscate.js night.js playlist.js sky.js weather.js insights.js harbor-layout.js harbor-events.js harbor-windows.js harbor-neon.js harbor-boats.js harbor-sky.js harbor-show.js harbor-remote.js harbor-dark.js harbor-signdim.js harbor-clouds.js harbor-speakeasy.js harbor-moments.js tube-path.js   PURE: room codes + host election, HUSH WORDS, the lobby song handoff, PARTY NIGHTS (the window, the beat clock), RAINBOWS (after real rain: when, which bow, where), THE STREET (trees through the year; the street's layout, buses, signal, cars, plows; the people, the door, hails), seeded RNG, XOR+base64, game-night standings, room playlists + callBonus; sky.js the real sun, moon, seasons, holidays, planets, eclipses; weather.js Open-Meteo → the city weather; insights.js the admin STATS; harbor-layout.js / harbor-events.js / harbor-windows.js / harbor-neon.js / harbor-boats.js CITY 2.0's camera + layout, its event scheduler, its addressable windows + the light timeline + the words, its neon (the palette roles, the outlines, the sign spots + the roof signs + tonight's pick), its boats' routes on the clock, its sky (the aurora's nights, the moon's look, what may fly, sky messages, the birds, the holiday sky table, the drone show's shapes), its PARTY SHOW's director + the everyday neon motion (harbor-show.js), THE PREVIEW PANEL's registry + validation (harbor-remote.js, shared with /api/admin), ONE darkness input every light reads + the blue-hour power-up + the beacons' PHOTOCELL (harbor-dark.js; 9d), the sign-dim hook for sky messages (harbor-signdim.js), THE CLOUDS' kinds from the real weather + their perspective layout + their light (harbor-clouds.js, DT2), THE SPEAKEASY's plan — the rooms behind its windows, the weekly ghost ad, the corner turn (harbor-speakeasy.js, 7a), its LIFE — the window moments' catalogue, the day's schedule seeded by the date, the rooms' states by the hour, the TV's irregular flicker (harbor-moments.js, 7b; WIN2: the edge windows' seeded moods edgeMoods + the eyes' calendar eyesNights) (docs/harbor.md); weather.js also parses NOAA's Kp (the aurora's storm night); tube-path.js SVG paths → tube polylines + their uneven light
js/screens/harbor/{scene,bake,tones,shapes,blocks,skyline,lights,rays,searchlights,neon,signs,tubes,sky,quay,water,waterfront,pier,wheel,lighthouse,boats,boat3d,boat-models,road,speakeasy,speakeasy-geo,speakeasy-blade,speakeasy-bake,stage,foreground,grid}.js   CITY 2.0 — THE HARBOR (?city=2 only; docs/harbor.md; boat3d + boat-models: 8b2's boats as real 3D models — HOW TO ADD A BOAT in docs/harbor/passes/part-8b2.md)
js/screens/harbor/{skyfx,air,banner,smoke,birds,balloons,drones,moon}.js   THE HARBOR's everyday sky (Part 6a): the manager + the API (harbor().sky), airliners + satellites + the helicopter, the banner plane, skywriting + skytyping, the birds, balloons, the drone show, the moon + the golden haze + the aurora
js/screens/harbor/{legends,jets,meteors,aurora}.js js/core/harbor-legend.js js/core/harbor-director.js js/core/harbor-flight.js   PART 6b — THE SPECIAL SKY: the UFO abduction + the TR-3B's power drain + the jet chase (legends.js, LAZY; WHEN + HOW pure in harbor-legend.js: the seeded nights, the timelines, the drain, NO TRAFFIC DURING THE LEGENDARIES — `trafficHold`, the hold every vehicle planner reads), ONE F-22 Raptor-style stealth fighter + Mach diamonds + heat haze + the air show / missing man / surprise flyby (jets.js; preview: tests/integration/jets-preview.html), the Harbor's shooting stars (meteors.js, fx.js's s.meteorArt), City 1.0's aurora re-fit (aurora.js), THE DIRECTOR (the spectacle budget per tier + priorities, pure), the geese's V + the bats' flight (harbor-flight.js, pure) (docs/harbor/passes/part-6b.md)
js/screens/harbor/ufo-model.js scripts/bake-model.mjs scripts/bake/ assets/city/ufo/ art/models/ufo/   THE BAKE TOOL (BNAME: `node scripts/bake-model.mjs "<chromium>" <recipe>` — one harness, a recipe per model: ufo, crane, promenade (PROM: Grok's bench + hydrant candidates at the city camera's real view — looks only, the drawn pieces won); the UFO re-bakes byte-for-byte) · THE UFO BAKE: the abduction's craft is "UFO" by sebslom (CC BY 4.0, ☰ → CREDITS), rendered OFFLINE by the bake (three.js in Playwright's Chromium, never on the site) into turntable sprites at the camera's two real view angles — body + the model's own green lights + every port per frame (assets/city/ufo/, 398 KB, fetched only when an abduction is due); ufo-model.js loads + draws them, legends.js#drawUfo picks the model or the hand-drawn saucer (`&ufo=classic`, the stand-in while loading / on a failure); art/ = SOURCE files only (.vercelignore'd, never shipped). Re-bake / swap a model: docs/harbor/passes/the-ufo-bake.md
js/core/harbor-tower.js js/screens/harbor/tower.js js/screens/harbor/crane-model.js assets/city/crane/ art/models/crane/   9e — THE CONSTRUCTION TOWER (PURE: the wordV slot's yearly cycle on the real calendar from April 2027 — the implosion, the gap, the frame + the crane (BNAME: J-Toastie's 3D model, baked, lazy; &crane=classic), topping out, the dark shell, the grand opening (BNAME: rising June 1 → Sept 1, the opening the first Saturday of October), a design per cycle; the layout keeps L.envelope so the sun never breaks; previews &build=<stage>&buildk=&builds=, &force=implosion) + its live layer (the crane + beacon, work lights, the implosion + dust, the opening's searchlights) (docs/harbor/passes/9e.md)
js/screens/harbor/report.js bench.js                     9e — SEND REPORT (&debug=1's button) + THE HANG WATCH (a Blob worker that posts the last snapshot to /api/log when the main thread stops answering ≥ 7 s; scene.js#reportText) → /admin → "Reports from phones" (api/log.js#logReport, phonelog/) · C4c — THE PHONE BENCH (&bench=1: heavy scenes measured, the report on screen + to /admin as BENCH)
js/screens/harbor/crisp.js floods.js                     9c — THE CRISP LAYER (lettering nothing passes in front of — the blade, the date stone, the roof poster — on small overlays at the phone's FULL dpr over the city's 2× canvas, crossfading with the re-bake; crisp.show(c, { id, box, key, draw, alpha })) · THE CENTREPIECE's SHOW LIGHTING (reusable floods for every piece on the compass: a pool, a shadow, the light on its own colours + a rim; dimmed to a fill when it lights itself — core/harbor-centre.js#floodTarget) (docs/harbor/passes/9c.md)
js/screens/harbor/windows.js window-{rooms,figure,paint,holiday}.js   PART 7b — THE SPEAKEASY'S LIFE drawn (C4a split: windows.js the life — the plan per frame, draw(), the passer-by, the taps' hit; window-rooms.js the glass + the 2.5D room box + paintRoom + THE BARBERSHOP AS A ROOM (paintShopRoom, SHOP_ROOM — the bake, the night's lit canvas + the live barber share it); window-figure.js the figure kit + the palettes; window-paint.js the rooms' states, THE LIT BLIND (litBlind), the shop + PAINT[id]; window-holiday.js the holidays' rooms + moments, 11b's home): the figure kit + the cat, each moment's painter (PAINT[id]), the TV glow, the night lamp, the barbershop's day, the mirror door, the taps (docs/harbor/passes/part-7b.md); SP4: LIT PEOPLE in lit rooms (figure(): P.lit + P.marks + litPal — real colours modelled by the room's lamp; core/harbor-moments.js#WINDOW_LOOKS says which scene is lit / a shadow / a silhouette); WIN2: ACT BIG (walkIn — people arrive + leave through the room's depth, never a cut), THE TV ROOM B (the couch facing the window, faces lit from below: lit.below), THE EDGE WINDOWS' MOOD LIGHTS (edgeMood — light + shadow only), THE EYES IN THE HAZE (PAINT.eyes) (docs/harbor/passes/win2.md); WIN3: THE BOSS'S TV ROOM with NO PERSON (tvRoom / tvDark — the unseen set's glow from below the sill, the flicker + the shadow from core/harbor-moments.js#tvLight / tvShadow, the raid's cut, the quiet nights' beds), THE CASH COUNT's close-up with natural hands (PAINT.cash), THE PARTY IN THE WINDOWS (partyRoom — one room at a time, dark silhouettes on the beat; core#windowParty; the pools on the cobbles drawn by scene.js) (docs/harbor/passes/win3.md); 9c: THE WINDOW RULE — every moment enters by its own motion or THE BLIND CYCLE (core/harbor-moments.js#ENTERS_BY_MOTION / blindAt, windows.js#cycleBlind); C4b: THE PEOPLE RULE beside it — nobody appears or vanishes in view on the promenade: after a clear-out (a legendary, a raid) the held-back visits are replanned from their own way in, staggered 8–120 s (core/harbor-witness.js#rejoinVisits), and people.js#guard never draws a visit whose first frame on this device isn't at a way in (a load / a clock jump excepted)
js/screens/harbor/remote.js css/harbor-remote.css         THE PREVIEW PANEL (?city=2): everyone follows city2/live; 9d: the owner opens it from ☰ → ADMIN (the menu's bottom; a dot on ☰ while a preview is on — ui/settings-panel.js#setMenuExtra / setMenuCue), the sheet (JUST ME / EVERYONE ON CITY 2) starts with the pinned NOW bar (TIME, the weather's chips); WIN: PLAY ALL (a sequencer per catalogue + its chip), the sections by use, the off-switches in TOOLS
js/core/harbor-rooms.js harbor-spots.js                  WIN — 2.5D ROOMS (PURE: each room a box in perspective about its vanishing point, a plane at depth t = one uniform scale; windows.js#deepAt / paintBox / lampFall) · THE DRESSING SPOTS (PURE: named places by the BIG pieces only — PROM: the bench, the two trees, the compass, the hydrant, the railing, the corner; no lamppost spots — every holiday fills them with big set pieces + THE RULES; Halloween's big jack-o'-lanterns: core/harbor-holidayprops.js#BIG_PIECES) (docs/harbor/passes/win.md)
js/screens/harbor/{people,folk,bus,hushsign,doors,wands}.js js/core/harbor-people.js js/core/harbor-routines.js js/core/harbor-hush.js js/core/harbor-lamps.js   8P — THE PEOPLE: the planner (PURE: the walkable map, WHO'S OUT WHEN as data, visits planned per seeded block — every phone the same, joined mid-way; the crossing on WALK, the bus's timetable, the lobby line, the roof), the live manager (three depth passes + their sounds), the figures (1920s silhouettes, a stride-locked walk, poses, lit by the scene; preview: tests/integration/folk-preview.html), the 1920s bus; THE HUSH WORD SIGN (plan + neon; WIN: on the corner pier's door plate, the letters stacked — core/harbor-hush.js#wallPlan); THE LAMPS' LIFE (PROM: on the IMPLIED lamps' pools — docs/harbor/passes/part-8p.md, #prom) FP3b: the 2.5-D rig (facing from the heading, the walk + run cycles; C4b: a seated rig facing us — the knees out, the lap), REAL DOORS (doors.js: the swing, the doorway, the spill; C4b: THE DOORMAN opens the side door for each guest — core/harbor-crew.js#doormanAt), THE ROUTINES (harbor-routines.js: the dance circle, the vendor spot's schedule) + the wands (wands.js)
js/core/climate.js harbor-snow.js harbor-snowwork.js harbor-snowman.js js/screens/harbor/{snow,snowfx,winterfolk,snowman}.js   PART 9b — WINTER (docs/harbor/passes/part-9b.md): THE CLIMATE-AWARE FALLBACK (PURE: 48 cities' monthly normals → the weather when the live ask fails; &force=climate), THE SNOWPACK (PURE: the real depth / the model over 30 days → the stages FRESH · OLDER · BANKS · THAW · SPRING; &snow=), the plow + the salt truck (PURE: their passes, run through the back road's own traffic), THE JANUARY SNOWMAN (PURE: built on January's snow days, slumps + melts; &snowman=); snow.js the snow BAKED (the caps on every layer's tops, the plaza + its footpaths + banks, the road, the speakeasy), snowfx.js the falling snow + the awning's slab + the trucks' spray / fan, winterfolk.js the shovellers + the snowball fight + the slip + the snowman's builders, snowman.js his art on the centrepiece rig; the sign's fluffy snow + its melt: glasswx.js
js/core/harbor-loadlog.js tests/integration/load-log.mjs   POLISH 5 — THE LOAD LOG (PURE: every change to the picture from the first frame to 15 s after the reveal, its cause, which ones the eye sees; scene.js writes it, &debug=1 shows it as the folded `load` strip, harbor().loadLog) + the repro (a Safari-like load: bars, throttle, cold / warm; docs/harbor/passes/polish-5.md). The load gate also waits for the fonts, the weather (kept per device: district/live-weather.js), the clouds + the extras; the title's rects measured through the screen's entrance transform (title.js#restRect)
js/core/harbor-roofmodes.js                              SP3 — THE ROOF SIGNS' HOURLY MODES (PURE: spell / race / breath per sign per hour, one big move at a time, the restart flicker; neon.js draws them)
js/core/harbor-raid.js harbor-cabs.js js/screens/harbor/raid.js   PART 8b2 — THE RAID (PURE: the schedule after the bootleggers' deliveries + a rare party night, the convoy simulated once, the officer, the front car + its spotlight, the lights' return) + its light (the red + blue wash, the shades, the flashlight, the spotlight's beam + hard circle, drawBeacon) · THE CABS (PURE: the night's calls at the truck stop, drop + pick-up riders, the TAXI lamp lit when free) (docs/harbor/passes/part-8b2.md)
js/core/harbor-holiday.js harbor-holidayfolk.js harbor-holidayprops.js harbor-ghost.js js/screens/harbor/{signdress,dress-halloween,dress-dotd,holidayprops,ghostship,witch}.js   PART 11a-1 — THE HOLIDAYS: THE CALENDAR (PURE: date-driven build-ups, the night, the come-down, the pieces, THE HOLIDAY LIGHT RULES — every holiday piece reads it; ADD A HOLIDAY: docs/harbor/passes/part-11a-1.md), THE SIGN DECORATION SYSTEM (a full-dpr canvas in the logo's wrap) + Halloween's FUTURISTIC web + bio-mechanical spider (SP4: a geometric web of light filaments + a shimmer; a chrome spider whose legs never leave their sectors — tests/spider.test.mjs) + Day of the Dead's sign, the ground's pumpkins / marigolds / papel picado / monarchs, the ghost ship + the witch (+ the bats in birds.js), the holiday people (trick-or-treaters, zombies, the procession — PURE); the window figures' kit + the holiday window scenes are windows.js + core/harbor-moments.js
js/core/harbor-parade.js harbor-xmas.js js/screens/harbor/{giant,harvest,dress-thanksgiving,parade,chimneys,xlights,treestand}.js   PART 11a-2 — THANKSGIVING + THE PARADE: THE PARADE SYSTEM (PURE + reusable: the route, the units in order, spacing, the pace, the clock — joined mid-way, the traffic hold, the crowd's cheers, the balloons in the real wind; HOW TO ADD A PARADE: docs/harbor/passes/part-11a-2.md) + its balloons / float (parade.js), Halloween's GIANT BITCOIN PUMPKIN (giant.js: ray-marched, baked in slices), the HARVEST DISPLAY + the November spot pieces (harvest.js), the sign's HARVEST WREATH, CHIMNEY SMOKE (reusable for winter), BLACK FRIDAY + THE FIRST OF CHRISTMAS (harbor-xmas.js PURE: the rush, the crew's strings, the tree stand, the strings' evenings; xlights.js the C9 strings on the speakeasy, treestand.js the tree vendor); the homecoming party night = core/party.js#partyDow
js/core/harbor-workers.js harbor-crew.js harbor-witness.js js/screens/harbor/{gear,workers}.js   PART 8b1 — THE WORKERS' SCHEDULE (the timetable PURE: fixed regulars, windowed shows, never two at once, cause + effect; the crew's itineraries + trucks + traces PURE) + their gear + props + the billboard's sheets + the blade's repaint; THE WITNESSES (a legendary night reshapes the promenade, PURE) (docs/harbor/passes/part-8b1.md)
js/core/harbor-wildlife.js js/screens/harbor/{wildlife,fauna}.js   PART 8b1 — THE WILDLIFE (the plan PURE; the live manager; the art) (docs/harbor/passes/part-8b1.md#group-2)
js/core/harbor-weather.js js/screens/harbor/{rainfx,lightning,waterfog,wetground,glasswx}.js   PART 9a — THE WEATHER: ONE city state from the live / forced answer + its soft transitions (PURE); the Harbor's rain (lit by the tubes + lamps), the capped lightning, the fog on the water, the wet promenade (puddles drying, the lamps' wet streaks, the drips, the wet glass), the weather on the NEON tubes + the dock's / corner buttons' glass (beads, drips, glaze, icicles, frost — small overlay canvases at z 72) (docs/harbor/passes/part-9a.md)
js/screens/harbor/{clouds,dayfx}.js                      THE CLOUDS (DT2: per-pixel shaded volumes baked once + re-lit in time slices; Part 9 plugs in: KINDS + set(); preview: tests/integration/clouds-preview.html) · the day's motion (flags in the real wind, sun glints on glass)
js/screens/harbor/{trees,props,props-light,props-garden,props-test,roadlight,street,motorcar,sounds,centre,still,cabstand}.js js/core/harbor-centre.js js/core/harbor-promenade.js js/core/harbor-trees.js js/core/harbor-light.js   PART 8a — THE PROMENADE: the plan (bands, sizes, the layout, the season, the implied road's passes, the zones), the trees' plan (pure) + their art in four seasons + the falling leaves, the bench / cart / planters / the brick INLAY + the mailbox, PF's centrepiece EVENT RIG (harbor-centre.js pure + centre.js: `harbor().centrepiece.set()` for the holidays), the implied road's light, FP2's street under the dock + the 1928 sedan crossing it at rest, the city sounds' wiring; FP3a: THE LIGHT on the promenade in ONE pure module (harbor-light.js: the pools, a face's lamp, the trees', the road's, the sun's shadow; PROM — NO LAMPPOSTS: the IMPLIED LAMPS below the screen behind the viewer — impliedAt, the shadows up the screen: castShadow), C4b's LAYOUT (the compass left of the crossing, the water bench at the crabapple, the maple + the cab stand at the right edge, the cart in the middle from below the dock; THE CAB STAND's own lamp off-screen right — core/harbor-light.js#cabLamp; docs/harbor/passes/c4b.md), PROM's THE STILL PIECES SHARP (still.js: the two benches live + on full-dpr crisp overlays that re-draw whoever stands in front) + THE CAB STAND's taxi on the front street while the dock rests (cabstand.js; the waiters: core/harbor-cabs.js#standEvents), props.js split (the light model + frame / the dormant urn + mailbox / the lazily loaded test obelisk) (docs/harbor/passes/part-8a.md, #fp2, PF, FP3a)
js/screens/harbor/{vehicles,fogbeam}.js js/core/harbor-traffic.js   POLISH 4: THE VEHICLE KIT (seven 1920s–30s models, both roads, 8b's police car + trucks are new MODELS), the back road's pure traffic, the beams in fog as one volumetric body (previews: tests/integration/{vehicles,jets}-preview.html); THE BLACKOUT is core/harbor-legend.js#blackAt + scene.js's dark city (docs/harbor/passes/polish-4.md)
js/core/city-sounds.js city-sounds-files.js js/audio/city-sound.js scripts/add-city-sfx.py audio/city/   THE CITY SOUNDS: the slots (pure — 134, 116 filled), the generated takes, the player, the import command, the recordings + CREDITS (docs/audio.md#the-city-sounds)
js/screens/harbor/{skybeams,strings}.js                   NEON PASS 4: the party's SKY BEAMS (reusable: holidays, the tribute), the CAFÉ-LIGHT CANOPY on the speakeasy's roof (SP2: big Edison bulbs on swags between set-back posts; reusable schemes for Parts 8 + 11)
js/core/harbor-dance.js                                  SP5 — THE DANCE CLOCK (PURE: every dancer's beat — the song's grid with every change of phase / tempo BLENDED, the energy winding down at a song's end, idle in the gap, the pick-up; the window party + the promenade's circle read it; tests/harbor-dance.test.mjs)
js/core/harbor-beat.js  js/ui/canvas-safe.js              THE BEAT (PURE: the song's grid from the song's clock minus ONE lead, every beat punching, the kicks only calibrating the lead — docs/audio.md#the-beat-sync-pass; audio/beat.js hears them) · Safari-safe canvas helpers (blurWorks, blit, ctx2d, safeCtx — every Harbor context; 9f: cssWidth(canvas) — a canvas's CSS width with no layout read, for overlays placed per frame; the Harbor's floor is iOS 16, the rest of the app parses on older iOS: no top-level await, tests/safari-floor.test.mjs)
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
