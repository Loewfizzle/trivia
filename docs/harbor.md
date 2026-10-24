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
  "<browser>" ./shots-harbor` (groups: `core, flags, skyline, neon, water, harbor, sky, party, panel, dock, perf, music, speakeasy, promenade, sounds, windows`); **the whole suite
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
| rain rings on the water, the fog over it (`water.set({ rain, fog })`: rain roughens the mirror now) | hooks | 9 |
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
| `street()` → the stage's layout (lamps, signals, door, knocks); the promenade's LOOK done in 8a; people + traffic still | placeholders | 8b |
| ~~seasons on the trees~~ — done in 8a (four seasons by the real date, `&season=`); snow on the city + the branches (`ctx.snow`), puddles + the wet sheen (`ctx.wet`) | the hooks ✅ 8a | 9 |
| storm / rain / snow / fog SKIES on the clouds (DT2: `clouds.KINDS` — add `nimbus`, `fog`; `cloudMix`'s recipe; `harbor().clouds.set({ grey, dark, base })`), the sky messages BETWEEN the cloud layers (`clouds.draw(c, fs, sun, 'back' \| 'front')`) | the hooks | 9, 6b |
| holidays (the sky fx's holiday pieces already run) | — | 10 |
| `partyLight()` → null (the lobby's still); the real midnight finale (NEON PASS 3 built the party windows, the searchlights at the peak and THE PARTY SHOW) | rules + the show | 10 |
| the menus' backdrop (`district/backdrop.js` still images today's city when no title was shown) | today's city | 12 |
| the music-off soundscape, the easter eggs, the switch-over | — | 12 |

## Part 1 progress / handoff
- [x] 0. Safety: `city-1.0` tagged at ba51ee2 and pushed; `docs/harbor/ref` kept out of the deploy (`.vercelignore`).
- [x] Reading (subagents): title.js / title-dock / backdrop contract, district scene + sky modules, the mockup's numbers, docs + tests.
- [x] Rule conflict asked + decided (the squeeze; sideways = smaller).
- [x] Perf baseline (`title-perf.mjs`), first-visit profile.
- [x] `core/harbor-layout.js`, `core/harbor-events.js` + `tests/harbor.test.mjs` (22 tests).
- [x] `screens/harbor/*` (scene, baker, layers, grid), title.js's flag line + `__district.harbor()`.
- [x] Review: six scenes × six sizes, two refine passes (the wide front row, night water; the lamps' pools, the stop lights' glow).
- [x] `shots.mjs --city 2 --safe --sizes harbor --crop stage` + party / snow scenes; `e2e-harbor.mjs` (16 checks).
- [x] Docs: this file, CLAUDE.md, ROADMAP.md, roadmap-history.md, testing.md.
- (Superseded by Part 1.5's handoff below.) Next: **Part 2 — the skyline.** Start from `far.js / mid.js / blocks.js / landmarks.js / quay.js` and the `SUN_GAPS`; keep the
  squeeze and the camera; measure with `title-perf.mjs --city 2` before and after.

## Part 1.5 — foundation fixes (Oct 21 2026)
Plumbing only, no new visuals (the `&grid=1` lane rects aside); every Part 1 number and size kept. Review findings 2, 3, 6, 7, 8
fixed; 1, 4, 5 are Part 2's (below).
- [x] #2 the scheduler is state (`createScheduler`), replayed once from the local midnight a day back, advanced slot by slot.
- [x] #3 a re-layout keeps the stale layers drawn until the new bake swaps in; rebakes wait for the crossfade.
- [x] #6 lane rects in the layout (`L.lanes`, `laneRects`), tested; `fs.density` thins the planes, birds, swifts and cars.
- [x] #7 landmark tiers projected in the world (`skyBlock` takes `y0`).
- [x] #8 `city=2` stays in the URL through `setUrlRoom` (refresh, rejoin, back to the title).
- Tests: `tests/harbor.test.mjs` 27 (+ the scheduler's pop-in, span, anchor and density tests, the lanes at six sizes);
  `e2e-harbor.mjs` 20 checks (+ the lanes against the real sign, `setTier(1)` never blanks the stage, the URL keeps the flag).
- (Done in Part 2, below.) Part 2 started with findings **1** (choose the sun gaps against the whole silhouette: bands + landmarks +
  heroes + the panorama's mirrored landmarks, and test that), **4** (clip the blocks at a corridor, don't drop them; pad 2 pt) and
  **5** (a per-building window grid `win: { cols, rows, u0, v0, pitch }` and a lit pass outside the look-key bake; drop `h` from
  the glitter seed). Then `far.js / mid.js / blocks.js / landmarks.js / quay.js`; keep the squeeze and the camera; measure with
  `title-perf.mjs --city 2` before and after. Events that need a moment's sky (night, season) add it to the scene's `ctxAt` as a
  function of ms only (the replay asks about the past).

## Part 2 — THE SKYLINE (Oct 21 2026)
- [x] 0. The owner's iPhone review first: the hierarchy (two dominant towers + the needle, the middle tier in clusters, the
  bands low; one gold crown; the EMPIRE stepped tower; two glass towers far back); the wheel on its pier over water; the tagline
  fade; one squeeze for every phone; the water strip checked (89–98 pt, as the approved mockup — kept; the owner: "keep the camera").
- [x] Findings 1, 4, 5 (above) fixed and tested.
- [x] The facades (blocks.js), the two skyline groups (skyline.js), the lit windows (lights.js + core/harbor-windows.js), the rays
  (rays.js), the searchlights (searchlights.js), the sun's + the moon's arches (district/sun.js + fx.js: opt-in fields, City 1.0
  unchanged), the tagline fade + slot (title.js / title.css).
- [x] Tests: `tests/harbor.test.mjs` 36 (+ the corridors vs the whole silhouette, the dense base, one skyline on every phone, the
  hierarchy, the wheel, the word faces, stable grids, the light timeline, the font + layout, night-only events);
  `e2e-harbor.mjs` 23 (+ the tagline fading with nothing moving, the words + the searchlights, the wheel + the lit layer).
- [x] Review: day, golden, night, 1:30 am, searchlights, spell=2027 at 390 / 402 / 412 / 430 / 1440 + skyline close-ups; two refine
  passes (the rays: a fan per corridor, contained under the sign; the beams' soft body; the far bands raised for depth; the Deco
  piers + terracotta spandrels, the faces' turn, the ledges, the glints).

### The skyline, as built
- **Day vs night — two cities.** Day: limestone, cream, terracotta, granite, slate; brick only in the near band; the glass towers
  mirror the sky (a sheen, mullions). The towers are Deco: piers rising past recessed terracotta spandrels, the pier's edge toward
  the sun lit and the other in shade, cornices, setback ledges with their shadows, weathering under the sills (near), a mottling,
  brick courses near. The real sun (`tones.js#sunLook`, in the bake key: a few re-bakes a day): we face south, so a morning sun
  lights the faces turned east (the right half's side faces), an afternoon sun the west; each front turns from its sunlit edge to
  shade; a taller neighbour on the sun's side throws a slanted shadow across a front (long when the sun is low). Distant windows
  by day are dark glass with a cool glint — never light. Golden hour: the backlit city (fronts dusky), the faces toward the sun
  glowing, a rim of light on every edge and crown toward it, panes flashing orange; the RAYS. Night: the facades go dark (the far
  ones bluer and softer: the haze by depth), the street's glow at their feet, the crowns floodlit (the sunburst gold, the EMPIRE
  white, the needle cool, the dome warm: cones from the setback with falloff), red beacons blinking on the tallest crowns.
- **The lit windows** (lights.js; the timeline: core/harbor-windows.js): City 1.0's exact rule — each window that can light has
  one uniform order and is lit when order ≤ the palette's `P.win` (NIGHT 1, LATE 0.32, DAWN 0.22, GOLDEN 0.5, DAY 0; sky.js#lateK:
  fewer from ~10 pm, a third from 2 am, party nights lit till 2 am, the few kitchens before dawn, off in the morning; ALWAYS NIGHT
  1), the season's warmth toward amber. Tungsten mostly, ~6 % TV-blue, ~10 % curtained, a rare neon; the glass towers' floors
  cool white, their crowns' thin light lines. Far windows are glitter (a few flare now and then); near ones show a hint of the
  room (the ceiling's light, furniture low, curtains). Every 6–15 s a light somewhere goes off (or one comes on) for a minute or
  three. THE POWER-ON at the title's tap is City 1.0's exactly (`lights.js#drawWave`, while `S.wave` < 1): each lit window comes
  on by itself — bottom first with scatter (delay = (1 − height)·0.82 + rand·0.16), over 0.07 of the wave, flickering as it
  catches — then the baked layer takes over. So it lands early in the wave, the very first bake waits (≤ 300 ms) for the
  title's real text rects and takes a bigger slice of the frame while only the sky draws (the lit layer bakes alongside it).
- **The rays** (rays.js): at golden hour / dawn with the sun low (−1.5..14°) and clear air: from the sun through each corridor
  within reach, a fan between the directions to the slot's top and its floor, broken into shafts, falling off along their
  length; behind the near buildings (after the far layer) and a fainter veil over the city. Contained in the air over the city.
- **The searchlights** (searchlights.js): three on the roofs (the EMPIRE's first setback, the hotel, wordB's top; a panorama two
  more): drum, yoke, fins, lens — dark metal by day. Running: soft beams (a wide body, a core) sweeping slowly and crossing;
  above the city's fog, so a foggy / low-cloud night is the dramatic one (brighter, wider, the cloud base lit where they hit).
- **The arches** (scene.js#archFor → `fs.arch` / `fs.moonArch`; the district never passes them): the sun keeps its real timing,
  path, season and phase; on a phone its arch fits the BASE's roofline (the bands + the quay) — it rises and sets behind the
  city and may pass behind the towers, the wheel, the lighthouse — and its top stays clear under the tagline (summer: tag bottom
  + r + 6) or lower among the crowns (winter: 42 % of the way from the limit to the base's median roofline). A wide screen keeps
  the district's arch over the sign but rises from behind the base and clears the towers by ~10°. The moon: from behind the base
  at its ends (10–90 % across) to under the tagline (a wide screen: over the sign), half the pass, half its real elevation.
- **The tagline** (title.js#armTagline, City 2.0 only): fades out 15 s after the title appears (`&tagms=N`) and stays gone —
  opacity only (its rect, and so the city, never move: tested); `scene.set({ tagGone })` hands its band to `sky-low`;
  `S.tagSlot(text, ms)` brings a line back briefly (the NYE countdown's own dressing is untouched).

### ADDRESSABLE WINDOWS + WORDS IN THE WINDOWS (the API)
- Every band block, tower tier and hero block has `win = { cols, rows, u0, v0, pitch: [pu, pv] }` (world units from the face's
  left edge and its foot) and a `seed` from its id (the band + its index; a tower's id) — never from its size or place: a relayout
  never re-rolls a window. A window = (building id, tier, col, row); `winHash(seed, tier, col, row, channel)` its dice,
  `winTraits()` its character (can it light, its order, its colour class, its brightness), `isLit(traits, share)`.
- `blocks.js#cellRect(cam, box, col, row, deco)` → its pane on screen (the facade's glass and the lit layer use the same).
- The word towers: `harbor().windows.faces` → { wordA: { cols 19, rows 11 }, wordB: { 15, 12 }, wordV: { 5, 18 }, rect } (the
  face = the rows nothing nearer covers, tested); windows 3.0 × 4.7 pt (A, B) and 4.7 × 4.6 pt (V) at 402 — a letter 9 × 23 pt /
  14 × 23 pt.
- The font (`harbor-windows.js#FONT`): 5 rows, digits + A–Z (M, N, W, Q wider), ♥ ★ ⚑ (`<3`, `*`, `[flag]`). `layoutText(text,
  towers, { tower, vertical })`: a short word of letters down wordV (one letter under the other: "JOY", "BOO", "USA"); else one
  line on wordA, else two lines on A, else across A + B ("HAPPY NEW YEAR" = HAPPY / NEW on A, YEAR on B); null if it can't fit
  (never a cut word).
- `harbor().spell(text, { tower, style: 'steady'|'wipe'|'twinkle', colour, ms, at })` (lights.spell) — the rest of that tower's
  face dims, the letters light (the wipe climbs floor by floor from the bottom); night only (× the night); `clearSpell()`.
  Random words go through the scheduler (`spell` event); fixed-time ones (a countdown 10 → 1, NYE) call it on the clock.
- `harbor().setWindow(towerId, tier, col, row, { col: [r,g,b], a } | null)` — any window by its address, drawn every frame over
  the lit layer (flags, party waves, holiday windows; null gives it back to the timeline).
- Preview: `&force=spell&text=HELLO` (`&style=wipe|steady|twinkle`, `&tower=wordA|wordB|wordV`), also `2027`, `BOO`.

### Known issues (Part 2)
- ~~**A plane's contrail grows the frame cost**~~ — FIXED in Part 6a: the Harbor's own planes keep ≤ 60 samples a contrail, drawn in six batched strokes (`air.js`). (Was: the district's `aircraft.js`, reused as is): its puffs accumulate across the sky
  for the plane's whole pass — measured 3.3 → 5.6 ms of scene work at 4× CPU over 40 s at a fixed tier (the profile: `drawImage`
  in `aircraft.js` ~ line 137, `puff` line 80). It makes `title-perf.mjs`'s later tiers look slower (it measures t2 → t1 → t0 in
  order: measure with `&force=no-planes`). Not Part 2's code; **Part 6** rebuilds the planes' artwork — cap the trail there.
- The desktop panorama's extra towers are a little uniform in height (a wall from 1440 wide); Part 12's desktop pass.
- The day sky at noon in summer sits the sun just under the tagline on a phone; with the tagline gone that band is open sky —
  check it in June (the arch's summer peak: `archFor`).

### Handoff → Part 3 (neon + signs + billboards) — done, below
Start from `quay.js` (the hero blocks' sign frames), `blocks.js#crown` (the crowns the roof tubes stand by) and the word towers
(never put a sign on their faces: `harbor().windows.faces`). Lit windows are their own layers: a sign's glow is drawn after
`nearLit`. The hotel moved 2 units left (10..24). Keep the corridors clear (`L.cuts`; tested): a roof sign taller than the base's
floor must not stand in one. Measure with `title-perf.mjs --city 2 --scenes "…&force=no-planes"` before and after.

## Part 3 — NEON + SIGNS + BILLBOARDS + BUILDING NEON + THE NEON LOGO (Oct 21 2026)
- [x] 0. The owner's Part 2 review: FAR GLITTER (lights.js: far + mid windows are fine irregular points — each its own size,
  place and brightness inside its pane, a few bright, now and then a lit floor as a thin strip; the addresses unchanged; near
  windows as they were) · WORD TOWERS (narrowed to pitch 1.1, wordA 0.759 / wordB 0.928, the lighthouse into the slot between
  them, the sunset corridor 0.851 → 0.84; the faces' cover counts the lighthouse; tested at the four phones: both faces whole on
  screen, ≥ 4 pt in, nothing nearer over them — the lighthouse, the wheel, the boats, the signs) — the lit letters fill their
  bays (94 × 90 %), warm with a hotter centre and a soft glow, on a face darkened to 82 % · THE SCROLL (`style: 'scroll'`, or
  any message too long for the faces: a ticker one window-column a step, 120 ms, any length up to 120 characters,
  `scrollColumns()`) · THE TAGLINE (its 15 s now start in `run()` — when the title appears — not at the end of the power-on:
  the preview showed it ~18 s) · BEACONS (every tower's tip incl. the spires + the NEON NEEDLE's tip, the bands' 8 tallest;
  ONE clock — `beaconPulse(t)`: a slow red pulse 30 a minute with a faint ember between; by day a white strobe on the tallest).
- [x] 1. Signs built like sign-shop neon (tubes.js + signs.js), the spots + tonight's pick (core/harbor-neon.js), billboards.
- [x] 1b. The neon outlines on the buildings, the NEON NEEDLE, the LED facades, the palette in roles, the moments' hooks.
- [x] 2. The NEON logo's premium pass (`logoSvg({ premium })`, ?city=2 only) + `LOGO_ANCHORS` (+ `&force=anchors`).
- [x] 3. Timing: City 1.0's (the neon plan, the stagger, the sputter-on / stutter-off, the rare flicker) for signs + outlines.
- [x] 4. Perf + memory (below); 5. review (night, day, golden, the catch, the words + the scroll, the moments, close-ups, the
  logo night + day, the logos preview at 390 / 402 / 430 / 1440; two refine passes), docs.

### The neon, as built
- **THE TUBE** (tubes.js): every tube is a polyline (core/tube-path.js#flattenPath: SVG M L H V Q C A Z) with a light per point
  (`tubeLight`: hotter on the bends, dimmer within ~4 widths of an open end). LIT = a wide gaussian glow + a near one (canvas
  shadowBlur, baked) → the body (segment by segment, brighter where hotter) → the white-hot core → a fine highlight; drawn once
  into a SPRITE and every frame additively with its power. UNLIT (`drawGlass`) = by day clear glass tinted by its coating, the
  gas tint, the sun's highlight on the sun's side, a soft shadow on the wall; at night dark glass; electrode caps; clips.
- **THE SIGNS** (signs.js): `vbox` (a vertical cabinet: enamel face, trim, its depth toward the middle, brackets, the name
  stacked in the tube alphabet, its mark on top only when the cabinet is ≥ 14 pt wide), `box` (horizontal, mark + name),
  `icon` (the game's tube mark on a painted raceway), `script` (JAZZ: slanted open tubes on a raceway), the HOTEL (red, chaser
  bulbs every 3.4 pt running in threes), `billboard` (painted paper on a steel frame + catwalk + legs, the game's mark painted,
  its name in Orbitron + its tag line, seams, a peeled corner, weathered by day; at night three GOOSENECK lamps light it —
  bright under each lamp, falling off). The housings + the billboards' boards are BAKED with the facades (static per look: the
  end of the near / far facade bake, `neon.housingStep`) — nothing nearer stands in front of a sign (tested), so no occlusion is
  lost; the lit parts are sprites (border, mark, name: they boot one by one).
- **THE SPOTS** (`SPOTS`, designed on the reference phone in pt at a depth, converted to world units once — every upright phone
  the same; tower signs centred on the shaft, as wide as the narrowest tier they cross): **4 named** (Part 4 moved the icons + the billboard: see Part 4) — the SUNBURST's shaft
  (vertical, ≤ 10 letters), a rooftop box over the near band left (≤ 9), NEON PAR's facade (vertical, ≤ 6), the EMPIRE's main
  shaft (vertical, ≤ 5) · **8 icons** — on the hotel, behind the wheel on PULSE's facade, on PAR, under JAZZ, the needle, the dome,
  the stepped tower, the near band left · **fixed** HOTEL + JAZZ · **1 billboard** on a wall right of the lighthouse. Each checked
  (`spotConflicts`): on screen, never over a word face, the lighthouse, the wheel (an icon may sit behind its spokes), another
  sign, nor behind anything nearer. A wide screen adds a named vertical sign on each panorama tower (drops any phone spot that
  ends up hidden there): 1440×900 = 9 named + 8 icons. **A phone sideways: 7 spots** (some games sit out that night — Known issues).
- **TONIGHT'S PICK** (`assignSigns(games, spots, nightKey(local))`, the owner's call): a new shuffle each night (the evening's date;
  before noon it is still last night); the named spots (longest cap first) take the first games whose name fits, the icons the
  rest; a longer or shorter game list fills more or fewer spots. The scene re-picks only while every item is dark (by day), so a
  sign never changes while you watch. The billboard advertises a game with no named sign tonight.
- **THE OUTLINES** (`outlines(L)`): the hero towers + the panorama's (every tier's edges from up the shaft, the setback ledges, two
  Deco fins on the top tier — not on a tower carrying a sign — and the crown: the sunburst's arches + its needle, the mast, the
  spire, pyramids, domes, the stepped tops), the word towers (their frame + their parapet — never across a face: tested), the
  middle tier (setbacks + crowns), the glass towers (their roofline), the hero blocks (their roofline), the bands (a few faint
  threads: a share of the near / mid / far blocks' rooflines, coloured by cluster). Projected and CUT where a nearer building of
  the same group stands in front (the nearer buildings' top envelope, per group), each point keeping its light; the unlit glass
  is drawn right after its building in the facade bake (so nearer things cover it; faint by day: only a glint of clear glass).
  **THE NEON NEEDLE**: the needle tower's spire carries one tall tube (`t.needle` 7 units above the crown tip, squeezed with it;
  1.5× wide, 1.6× glow), its beacon at the very tip.
- **THE PALETTE** (`NEON`, `SCHEMES`, `roleColour(role, scheme)`): roles b0 b1 b2 (base: electric blue, cyan, ice white), h0 h1
  (heat: the NEON pink, violet), a0 a1 a2 (accent: amber, signal red, acid green). Per building ≤ 2 roles (main + crown accent):
  the sunburst pink + amber, the needle violet + the pink needle, the EMPIRE ice + blue, the word towers cyan / ice, the middle
  tier by cluster, threads by screen fraction (tested: base > heat > accent by length). STRENGTH = the brightness hierarchy
  (tube 1.5 / 1.25 / 1.0 / 0.7 pt at the reference scale, glow 7 → 3.2, alpha 1 → 0.5: heroes → word → mid → far).
- **THE LED FACADES** (glassL, glassR): per frame, clipped to the face's part above the nearer buildings — slow vertical
  gradients (cyan → violet → blue, 26 s a cycle) + a band of light climbing every 9 s + thin floor lines; party colours at a party (tier 2; Part 4: held still at tier 1 — one cached image).
- **POWER** (City 1.0's, `neon.powerTick`): the neon plan's per-item states (title.js#neonNow: `signCount()` = the items: the
  signs, the billboard, every outline) → each its sputter-on / stutter-off (`alpha`, City 1.0's segAlpha: tube by tube), the
  boot stagger 0.25 + i · min(0.6, 4.5 / n) s (≈ 4.5 s for the whole city), a rare flicker (25–70 s), a faint core flutter
  (tier 2; Part 4: off at tier 1). By day everything is unlit glass. A re-layout never blanks the neon: the new set builds behind the old one and
  takes over its power states (like the baker).
- **MOMENTS** (hooks; `harbor().moment(name, v)`): `party` (k: the chasers — coloured runs racing along the heroes' + word
  towers' + panorama's tubes while their tubes sink back, the outlines breathing with PT.breath, the LED facades in party
  colours) — `&force=neon-party`; `chase` (on/off); `flash` ({ game }: the game's mark colours sweep the skyline left → right in
  1.6 s) — `&force=neon-flash&game=pulse`; `scheme` (a SCHEMES name: the outlines re-lit; halloween, christmas, july4,
  valentine, stpatrick, nye, thanksgiving, easter, party) — `&force=neon-scheme&scheme=halloween`. `billboard(id, { game } |
  { title, sub, bg, ink })` changes a billboard (re-bakes). Part 4: `harbor().reflections()` → every lit item's rect + colour.
- **THE NEON LOGO, premium** (ui/logo.js `premium: true`, title.js passes it with ?city=2 only; letters, positions, colours and
  the app icons / link previews unchanged): the glass wall (a pale rim: the tube's thickness), hot spots on the hard bends (2 per
  N, 2 on the E; the O's gentle curves stay even), dimmer electrodes, the highlight leaning toward the light (`--hix`: the real
  sun's side, moving through the day), sun glints by day; at night its glow tints the haze around it (scene.js#logoHaze, in the
  sign's colour); a faint core flutter = a rare 70–130 ms dip in one lit tube (each is one repaint of the sign — never a per-frame
  animation on the filtered SVG). **ANCHORS** (`LOGO_ANCHORS`, logo coordinates 0..332 × 0..100): `tops` (per letter), `garland`
  (a sagging run end to end), `gaps`, `base`, `centre`, `corners`; `anchorsSvg()` + `&force=anchors` shows them.
- **EACH GAME'S TUBE LOGO** (ui/tube-logo.js `gameLogoSvg(game, { lit, premium })`): the mark + the name (one or two lines) in
  the tube alphabet, built exactly like the NEON logo with its class names (`.ndl`, `.ndl-light` …) so the title's CSS lights it
  letter by letter; filters in user space (no clipped glows). Preview: `tests/integration/logos-preview.html` (night + day).

### Performance + memory (Part 3, `title-perf.mjs --city 2`, 390×844, 4× CPU, mean ms of scene work t2 / t1 / t0)
np-party 5.9 / 5.0 / 3.9 · np-night 4.3 / 4.3 / 2.9 · np-day 3.2 / 3.0 / 2.7 · np-golden 4.5 / 4.4 / 3.6 · the worst case
(`neon`: a party moment + the searchlights + a word) 6.1 / 5.6 / 4.0 — within 8 / 6 / 4, frames 16.7 ms. The E2E's party peak:
5.8 / 5.6 / 4.2. **Tier 0 = the calm neon:** no chasers, no beat, no flicker or flutter; once a group's neon is steady (all on,
the boot done) it is ONE composite image (the LED facades still inside it). Memory: the neon's sprites ≈ 2 MB at tier 2 (+ the
tier-0 composites, ≤ 1 MB), the baked layers unchanged (22.9 MB of 64 at 390×844).

### Known issues (Part 3)
- A phone held SIDEWAYS has room for 7 sign spots (2 named): some games sit out that night (the pick rotates). Desktop 9 named +
  8 icons. Part 12's desktop pass can add named roof signs along the panorama's near band.
- The `flash` moment is verified by state (E2E) and by eye in motion, not in a still (it lasts 1.6 s).
- The far / mid-tier outlines are cut by the far group's envelope; a far band block standing in FRONT of a mid tower's crown
  (rare) cuts a few points of its crown tube.
- The logo's core flutter is a rare dip, not a continuous shimmer (a per-frame animation on the filtered SVG costs a repaint
  of the whole sign every frame).

### Handoff → Part 4 (water) — done, below
The lights to put in the water: `neon.reflections()` (every lit sign / billboard / outline: its rect, colour, power), the lit
windows' layers (`farLit`, `nearLit`), the beacons (`lights.beaconList()`), the quay lamps (quay.js), the logo's haze is sky only.
The water band is the `water` baked group (z 64–230). The lighthouse moved (f 0.8502 on a phone): its reflection + beam (Part 5)
start there. Measure with `title-perf.mjs --city 2 --scenes np-night,np-party,neon` before and after.

## Part 4 — THE WATER (+ Part 3 touch-ups) (Oct 21 2026)
- [x] 0. The owner's Part 3 review: the outlines follow the Deco shapes · the icons + the billboard read · the centre breathes.
- [x] 1. The water: the mirror in perspective, the light columns, the ripples on the real wind, day / golden / night, the sun's +
  the moon's paths, the lapping edge, the quay lamps lit; hooks for Parts 5, 9, 10, 11a.
- [x] 2. Perf + memory (below). 3. Review: day, golden, sunset, night (calm), night (windy), the moon, party — at 390 / 402 / 412 /
  430 / 874 / 1440 + the water close up (`--crop water`) + the neon close up (`skyl, skyr`); two refine passes. Docs.

### The touch-ups, as built
- **THE OUTLINES FOLLOW THE DECO SHAPES** (`core/harbor-neon.js#outlines`): a tower's outline is ONE BENT TUBE A SIDE — up the
  shaft (from 45 % up: the foot is behind the base), stepping in along every setback, up each tier, over the crown's own steps when
  the crown is the building's colour (the word towers: the parapet bar + the two-step ziggurat; a stepped top, a pyramid, a dome,
  the mast's drum + lantern + spire), down the other side; a crown in an accent colour is its own tube (`crownPath`); the middle
  tier from its shaft's top (its stepped cap). **Deco FINS**: thin tubes (0.6×, `thin`) up every tier above the shaft (2–4 by the
  tier's width), never where a sign hangs (`outlines(L, signRects)`: host → the signs' world rects). Tested: every tier's edges on
  the contour, the bends, the fins, the word towers' ziggurat (≥ 6 heights), never across a word face.
- **THE SIGNS READ** (`SPOTS`): the icons ~20–21 pt (were 11–18; tested ≥ 19 pt at every phone) on calm walls — the near band's
  corners left (i-left) and right (i-r1, i-r2, i-r3: a small sign wall right of the lighthouse), under wordA's face (i-c1, i-c2),
  on JAZZ and PAR; **the billboard** moved to the left near band's wall and half as big again (66×32: `bb-left`), its name as big
  as the board allows (two words stack), the tag line only if it reads, its gooseneck lamps kept at their real size. (The stage
  option was weighed: a billboard there would crowd Part 7 / 8's stage and the water; the skyline wall reads at 66 pt.)
- **THE CENTRE BREATHES**: no icon on the needle, the dome, the step tower, the hotel or PULSE (behind the wheel) — the NEON NEEDLE,
  the sunburst's named sign, the wheel and the HOTEL blade stand alone (tested: no other sign within 50 pt of the needle). The
  word towers + the construction tower's spot unmoved; **no sign on wordV** (tested).

### THE WATER, as built (`screens/harbor/water.js`)
- **The surface** is world y = `LEVEL` (−0.8): the far quay's wall shows ~2–3 pt of stone above it (its lamps on top); the band
  runs from there (`waterBand(L).y0`) to the railing's foot (`y1` = the road's far edge; the road covers below it).
  `axisAt(L, z)`: where the water meets something standing in it at depth z (its reflection flips about that line).
- **The mirror = the frame itself.** Everything above the waterline is drawn before the water (the sky, the far + near city, their
  lit windows, the neon, the beacons, the rays, the fog, the searchlights' beams, the quay lamps), so the water copies THAT region
  of the frame (one `drawImage` of the scene's own canvas, 1 px a pt) and flips it about the waterline. Every light that is or
  ever will be drawn there reflects for free and stays in step — the neon's power + flicker, a word in the windows, a holiday
  scheme, the construction tower at whatever stage it is (Part 9), the searchlights. (`neon.reflections()`, `lights.beaconList()`
  are not needed for it; they stay for later parts.)
- **The light columns** (night × how dark): a bright-pass of that copy (src³ — `multiply` twice: only the lights survive, neon
  colours saturate) drawn as stretched, flipped copies (half resolution, additive): a light e pt above the waterline lands between
  s0·e and s1·e below it — a sign by the quay makes a short column, a crown light a long one reaching the near water. Calm: s 0.6–1.1,
  5 copies; windy: 0.24–1.28, 10 copies (a little sideways wobble each).
- **The ripples**: the mirror is drawn ROW BY ROW (strips 0.7 pt far → ~3.4 pt near; 59 at 402×874 tier 2) — one wave phase per
  depth (a wavefront is a line parallel to the shore): a sideways wobble, a vertical break (rows sample a little above / below) and
  a crest / trough brightness per row, all growing toward us and with the wind — so every reflected light breaks into shimmering
  bands. **FRESNEL + DEPTH**: each row's opacity = a mirror at the grazing far end (0.93) → the water's own colour looking down near
  us (the baked base under it: blue-green by day, orange at golden hour, near-black at night), less of a mirror in wind.
- **The wind** is the real one (`LK.wind`, m/s; `&wind=` in previews): roughness 0 under ~1.2 m/s (a glassy, crisp mirror) → 1
  at 11+ (choppy: bigger wobble, broken rows, longer columns, denser wavelets); real rain adds 0.35 (Part 9 adds the rings).
- **The wavelets**: two baked textures of perspective dashes (sky-lit crests in the hour's colour, dark troughs; their density per
  wind bucket) sliding against each other.
- **The paths** (additive): the SUN's gold glitter path toward us while it is low (−2..16°, the sun's drawn x; fades with real
  cloud): a hot soft column by the quay widening toward us + ~200 twinkling dashes; the MOON's silver path at night (its drawn place
  + phase, `fx`'s moonAt; P.moonA × its height × its phase × `moonVeil` — none when it is down or behind real cloud): mostly glints;
  BY DAY sun glints across the water, thicker toward the sun's side.
- **The near edge**: a slow surge (~7 s) lapping at the near quay wall's foot behind the railing — a wet band + a thin crest line.
- **The quay lamps** (`quay.js#drawQuayLamps`): lit at night with the city's power-on (a hot head, a halo, a pool on the quay's
  edge; all the lamps baked into ONE sprite per layout — `quayLampSprite` — and drawn additively, one draw a frame) — their warm
  columns run down into the water.
- **Cost**: the work is spread over a 6-frame cycle and never two steps in one frame — one frame BUILDS the mirror (re-reads the
  frame above the waterline, flips it, the objects in the water, the light columns: the SOURCE, 10 times a second — the city's
  lights change slowly and the ripples hide the steps), the others COMPOSE the water from it (the rows, the wavelets, the paths,
  the edge) into its canvas: 30 times a second at tier 2, 20 at tier 1 (wider rows, fewer copies, one wavelet texture); every
  frame shows that canvas. The glitter paths' + the day glints' dice are computed once per layout (only their twinkle per
  compose). **Tier 0 and reduced motion**: a calm baked mirror — built + composed about once a second with the ripples still (the
  lights still follow the city).

### The water's API + HOOKS (`harbor().water`)
| hook | what | used by |
| --- | --- | --- |
| `reflect(fn, axisY)` | `fn(ctx)` draws an object (screen coordinates) flipped about its own waterline `axisY` (`axisAt(L, z)`) into the mirror | the wheel + the lighthouse now (`scene.js#waterMirrors`: their rects of the baked harbor layer); **Part 5**: Rosie + her bulbs, the taxi, the tug, the sailboats, the train, the beam |
| `light(x, y, col, a, w)` | a light NOT in the frame above the waterline as a column in the water (like `reflect`: read when the mirror is BUILT, 10 times a second — call it every frame, 5 of 6 calls are simply dropped) | **Part 10**: fireworks high over the city (the finale's sparks), **11a**: the ghost ship's glow |
| `wake({ x, z, len, dir, k })` | a boat's wake (stored, max 16) | **Part 5** draws them |
| `set({ rain, fog })` | rain roughens the mirror now; the rings on the water + the fog over it | **Part 9** |
| `set({ off: true })` | the live water off (the baked base stays) — perf A/B on one page | tests |
| `band()`, `debug()` | `{ y0, y1, strips, copies, lights, paths, rough, ms: { copy, mirror, columns, build, strips, tex, paths, compose, blit }, tier, mb }` | tests |
Fireworks low enough to be in the frame above the waterline, Part 5's lit wheel and the train on the far waterfront (when drawn
before the water) reflect without any call. `&force=no-water` turns the live water off (perf before / after).

### Performance + memory (Part 4 — the clean comparison, Oct 21 2026)
Measured A-B-B-A against the previous commit (9d3fd7e = Part 3's code) on the same quiet machine, one after the other: previous,
Part 4, Part 4, previous — `title-perf.mjs --city 2`, 390×844 (DPR 3 capped to the tier), 4× CPU, mean ms of scene work, each
number the mean of its two runs; frames 16.7 ms everywhere:

| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| night (`np-night`) | 4.7 → 5.7 | 4.7 → 4.6 | 3.3 → 3.5 |
| party (`np-party`) | 5.6 → 6.4 | 5.1 → 5.4 | 3.5 → 3.6 |
| the worst case (`neon`: the party moment + searchlights + a word) | 5.9 → 6.9 | 5.7 → 5.8 | 4.2 → **4.5** |
| golden hour (`np-golden`) | 4.9 → 5.9 | 4.6 → 4.9 | 3.5 → 3.8 |
| day (`np-day`) | 3.0 → 4.2 | 3.0 → 3.7 | 2.7 → 3.0 |

Every scene is within 8 / 6 / 4 except the worst case at tier 0, which was already over on the previous commit (4.1–4.3 in this
run; Known issues). The live water alone, on one page with `set({ off })` toggled (party, 4× CPU): +1.1 ms at tier 2, +0.5–0.7 at
tier 1, +0.15 at tier 0. To get there (the first Part 4 commit measured +2.4–2.9 at tier 2 against the previous commit — the party
night 8.7 and the worst case 8.8, over budget): the mirror's source re-read 10 times a second instead of 30, the glitter's dice
cached; **tier 1 (Part 3's neon)**: the core flutter off, the glass towers' LED facades held still (one cached image; the sweep +
the climbing band at tier 2 only); the quay lamps one sprite. The water's look is unchanged. Memory: the water's canvases ~2.4 MB
at 390×844 tier 2 (in `harbor().mem`, a layer of its own) — 25.4 MB of 64 in all. (Earlier in the session the machine ran ~3×
slower for everything for an hour — the previous commit measured 18.9 ms at the party peak — so only same-run comparisons count.)

### Known issues (Part 4)
- ~~**THE THIN BLACK BARS** (the owner's iPhone, at night: thin dark lines across the reflections)~~ — fixed in NEON PASS 4. The
  ripple strips sat at fractional rows (0.7–3.4 pt each, only 0.02 pt of overlap) with their own opacity: each strip's edge
  anti-aliased, two half-covered rows over the near-black base = a dark line at every seam (WebKit shows it most; here 3 % darker at
  tier 1). Now `water.js` lays the strips on WHOLE DEVICE ROWS edge to edge (`st.r`, `st.hd`; the water's canvas top = the waterline
  rounded to a device row, blitted 1:1 — never resampled; the wavelets' wrap on a whole column), and a strip's crest / trough is
  box-filtered over the wave phase it spans (`st.ck`: thin far rows no longer flip bright / dark row by row). Same strips, same cost.
  Tested: `harbor().water.grid` + `rows`, and e2e-harbor's NO SEAMS check (meeting rows as bright as any other, tiers 2 + 1). Look
  pixel by pixel: `shots.mjs … --crop water --zoom 3 [--zx 0.75] [--tier 1]`.
- ~~**The worst case at tier 0 is ~0.5 ms over its 4 ms**~~ — see cleanup pass 1's numbers + Known issues below.
- **The copy forces a raster flush mid-frame**: reading the scene's own canvas makes the browser rasterise what is drawn so far
  inside the water's build (~0.7–1.4 ms at 4× in headless Chrome, once every 6 frames now). If a phone shows otherwise, the fallback
  is to compose the copy from the baked layers + the neon instead (the beacons and beams would need their own draw).
- Fast lights reflect at the source's 10 a second (the party chasers, the game-start flash); fine on rippled water. Part 10's
  fireworks in the frame above the waterline would step — use `light()` per frame for the bursts, or raise the source rate then.
- The far half of a light column is a stretched copy, not a true glitter column (a light high on a tower reflects compressed toward
  the quay); it reads right at phone size.
- ~~The wheel's + the lighthouse's reflections come from the baked harbor layer's grey-box art~~ — Part 5.
- The moon's path follows the moon as drawn (its framed place in the sky), not its true elevation (the moon's art + place:
  Part 6).

### Handoff → Part 5 (harbor hero pieces)
Draw each hero piece's reflection with `harbor().water.reflect(ctx => draw(ctx), axisAt(L, z))` every frame (Rosie at z 142, the
taxi z 94, the tug / sailboats z 205–214, the wheel z 132 on its pier, the lighthouse z 150) — then drop the grey-box mirrors in
`scene.js#waterMirrors`. Rosie's bulbs and the wheel's bulbs: draw them in the reflected art (they then ripple with the water);
`light()` only for lights outside the frame above the waterline. Wakes: `water.wake()` stores them — draw them in `water.js`
(after the rows, before the paths: a V of foam dashes in perspective + a darker trough) or in the boats' layer. The ELEVATED TRAIN
on the far waterfront: draw it before the water (with the near group) and its lit windows reflect for free. The lighthouse beam:
a beam drawn before the water reflects; a beam sweeping over the water itself is a `light()` sweep or its own pass. Measure with
`title-perf.mjs --city 2 --scenes np-night,np-party,neon` before and after (`nw-` = without the live water).

## Cleanup pass 1 (after Parts 1–4) (Oct 21 2026)
A fix-and-tighten pass, no new features: clean measurements, battery + heat care, the owner's Part 4 review (the signs' balance,
the NEON logo's catch + the buzz), a code review of Parts 1–4, the docs. The default-city title suite ran in full.

### The clean numbers (A-B-B-A against 9d3fd7e, the commit before Part 4)
Measured on a quiet machine (4 % CPU, on power), one after the other: previous, this pass, this pass, previous — `title-perf.mjs --city 2`
(390×844, DPR 3 capped to the tier, 4× CPU, mean ms of scene work, each number the mean of its two runs; frames 16.7 ms everywhere;
the worst case re-measured A-B-B-A once more after the spelled word became a sprite):

| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| day (`np-day`) | 3.1 → 4.4 | 3.0 → 3.5 | 2.9 → 2.4 |
| night (`np-night`) | 4.8 → 5.7 | 4.6 → 4.7 | 3.5 → 3.1 |
| golden hour (`np-golden`) | 4.9 → 6.7 | 4.5 → 4.7 | 3.4 → 3.7 |
| party (`np-party`) | 6.0 → 6.7 | 5.1 → 5.3 | 3.2 → 3.6 |
| the worst case (`neon`: the party moment + searchlights + a word) | 6.0 → 6.9 | 5.8 → 5.5 | 4.1 → **3.9** |

Every scene is within 8 / 6 / 4 at every tier. The "previous" column is the commit BEFORE Part 4 (no live water): the tier-2 rise is
Part 4's water (+0.9–1.8 here; Part 4 measured +1.1 on one page), tier 1 and 0 are level or lower. Tier 0's worst case, 0.5 ms over
in Part 4's run, is under budget now: the spelled word's letters were drawn window by window every frame (`lights.js#drawSpell`,
~0.3 ms at tier 0) and are one sprite redrawn only when their state changes. The E2E's party peak at 4× CPU: t2 6.8 · t1 6.3 · t0
4.2 (its own page, a Saturday peak with the planes). Memory unchanged: 25.4 MB of 64 at 390×844 tier 2 (+ the neon 2.3). Note the
drift between sessions: the same previous commit measured 4.7 / 5.6 / 5.9 (night / party / worst, tier 2) in Part 4's run and 4.8 /
6.0 / 6.0 here — only same-run comparisons count. Frames drawn per minute (the calm rate below): a calm night 1800 where it was 3600.

### Battery + heat
- **Hidden = stopped.** The scene's rAF stops on `visibilitychange` (it did since Part 1) and nothing else of the Harbor ticks: it has no
  intervals; the look, the scheduler, the water, the bakes all live inside the frame. Cleanup pass 1 added the TITLE's loops to that:
  `trackLogo` (the sign's rects every 500 ms), `watchSky` (every 1 s) idle while the page is hidden and re-arm at once on
  `visibilitychange` (`title.js#onVisTitle`, also `neonTick`). The live weather's poll was already gated on visible. On resume the
  clock just reads the real time: the scheduler decides the missed slots, the neon plan is replayed from the plan, dt is clamped.
- **THE CALM FRAME RATE** (`scene.js#frame` / `fastNow`): when nothing fast is on screen the city draws every other rAF (30 fps; every
  third under reduced motion, 20). Anything fast brings 60 back at once, checked every rAF from the last draw's flags: a plane, the
  train, a satellite (`aircraft.busy()`), birds on the wing (`wildlife.busy()`), the party, fireworks, rain / snow / a storm, a
  lightning flash, the neon booting or going dark (`neon.busy(t)`: an item's sputter within 2.5 s; a moment: party / flash / chase;
  sprites still building), the searchlights, a bake or a crossfade in progress, the power-on wave, a tap (`hit()` → 1.5 s), a knock,
  any scheduled event but `spell`, the first second after the city shows, `&speed`, and `wake(ms)` (the hook for later parts: a
  boat casting off, a bird landing on the sign — call it when you start something fast). The rare neon flicker is a dip, not motion.
  The rAF keeps running (it is what notices the change) and `perf()` keeps watching ITS intervals, so the auto-tiering is unchanged.
  The water keeps its own rates on the clock now (the mirror re-read 10 a second, composed 30 / 20 a second at tier 2 / 1) — at
  30 fps it composes every drawn frame, so the ripples look the same. `harbor().rate` = `{ drawn, fast, running }` ('' = calm).
- Measured (the E2E, a calm night at 4× CPU): **30 frames drawn a second** where every rAF drew before (60); the party peak, a
  plane, the boot: 60. The look is unchanged (the shots before / after are the same frames). The E2E checks the calm rate, that a
  hidden page draws nothing and that it resumes at 60 for a moment.
- **`hold(ms)`:** the title's own heavy moment — the catch animates the sign's filtered SVG every frame for 1.5 s — must not make the
  city step a tier (a re-layout + rebake at the most-watched second of the evening): `applyNeon` calls `scene.hold(3000)` at the
  catch; `perf()` ignores that window (and the sort it did every frame now runs every 30).

### The NEON logo's catch + THE BUZZ (the owner's review)
- **The catch, frame by frame:** a scratch screencast of both cities at 6× CPU showed no dark frame in either city; what it showed
  was the cost: City 2.0's sign took a 50–70 ms long task EVERY frame for the 2 s of the catch's glow animation (City 1.0: four
  in all) — and both cities stepped a tier down right at the catch. The premium logo's hot spots + dim electrodes each carried a
  `feGaussianBlur` filter (~24 filter surfaces per repaint). They are now soft dots from two `radialGradient`s (`logo.js#premiumBits`,
  no filter; the same look) — the recast shows **zero long tasks** and the tier held. Every TIME is untouched (the plan, the stagger,
  the morning fade); only the paint got cheap, so the catch flows like City 1.0's (the glow's 0.9 s rise + the 0.25 s bloom are
  the same CSS). Also found: by day the premium glints rendered as dark specks (`title.css` filled every `circle` under `.is-day` —
  now only the electrode caps, `.ndl > circle:not(.ndl-glint)`).
- **THE BUZZ** (`audio/ambience.js#neonBuzz`, City 2.0 only, `title.js#applyNeon`): on every flicker of the dusk warm-up and the
  morning fade — a tube striking: a crisp tick (a bright click + a tiny zap chirping down) then the buzz while the gas holds (120 Hz
  and its harmonics through a bandpass, the electrode's rattle, its level unsteady) for as long as the plan holds this flash; a tube
  dropping out: a softer tick; two letters at once a touch louder. The catch keeps its hum + crackles (`neonPowerOn`). On the SFX
  bus like every title sound: it follows the Effects slider and Mute, never on the first paint, never under Reduced effects, and
  nothing relies on it. Quiet by design (peaks ~0.03): under the music.

### The signs' balance (the owner's review)
Measured on the reference phone: the sign band (y 488–545, below the word faces, above the quay) has ≈ 240 pt of wall once the
wheel (124–238), the sunburst + HOTEL (235–265), the lighthouse (330–353) and the word faces are out — and the 15 items need
≈ 262 pt (the billboard 66, 8 icons × 20, JAZZ 26, the STAKES-sized named sign, HOTEL). Roof signs on the right would cover the
word faces, the left roofs hold RUMRUNNER + the flag icon already, the construction tower (wordV) and the needle are off limits. So
the right side is now an even two-column rhythm instead of a stacked pair + a tight triangle: under wordA a column of two (12 pt
apart), the PAR hero carries its named sign + a column of two (`i-par`, `i-par2`), the small wall right of the lighthouse a diagonal
pair; every gap ≥ 8 pt, every icon still ≥ 19 pt at every phone (tested), nothing on a word face, the needle or wordV. **What it
cannot do is make the right as calm as the centre** — that needs one of: icons behind the wheel's spokes again (the checker allows
it; Part 4 cleared it), fewer icons (two more named roof signs along the near band instead), or a second billboard on the right
(two icons' worth of wall). The owner's call — asked in the hand-back.

### The code review of Parts 1–4 (fixed now)
- Leaks: a pending billboard's night sprite was never freed on a re-layout mid-build (`neon.js#freeItem`); the stars' sky canvas (~3
  MB) had no destroy (`stars.js`, called from the Harbor's `destroy`); the extras' 1.2 s timer is cleared on destroy.
- Work every frame: the searchlights' three roof spots were recomputed per frame (now per layout, a WeakMap); the frame sort of the
  tiering now runs every 30 frames; the scheduler's one-time replay (~1000 slots of dice + sun positions) no longer runs in the
  first frame — it waits for the first bake to land.
- Dead code removed: `signs.js` housing sprite + day sprite, `shapes.js#crown`, `blocks.js#bandSteps` (+ its clamp01 re-export),
  `tones.js#hazed`, `bake.js` `groups()` / `doneAt`, `neon.js#_reset`, `water.js#setTier`, `scene.js` litKey; `water.band` is now
  on `harbor().water` as this file said.
- Tests: the TAGLINE check waits for the real text rects and allows 1 pt (its real bug — a re-layout forgetting the faded tagline — is
  still caught: `cam.tagGone` + the lane's ≥ 8 pt move); + 3 battery checks. Docs: the claims above corrected (the sun's rays, tube-path's
  sharers, backdrop.js, the first bake's slice, the memory budget's scope, `light()` / `reflect()` sampled at the mirror's build rate).

### Known issues (cleanup pass 1)
- ~~**The signs' right side stays denser than the centre**~~ — Part 5: two named ROOF SIGNS on the word towers took i-c2 + i-par2
  off the wall (the owner's rule).
- **The catch's dark half-second on the owner's iPhone was not reproduced** in Chrome (frame by frame at 1× and 6× CPU, both
  cities: no blank frame). What was found and fixed is the one thing that differed from City 1.0 at that moment — a 3× costlier
  repaint per frame — plus the tier step at the catch (now held). If it still shows on the phone, the next suspect is WebKit
  promoting the glow paths to layers as their opacity transitions begin (`will-change: opacity` on `.ndl-glow1/2` of the premium
  logo during `.is-catch`), then the SVG's size (the whole sign repaints as one surface).
- `water.reflect()` / `water.light()` are read when the mirror is built (10 a second), not every frame — fine for still and slow
  things; Part 5's wakes / Part 10's bursts need the source rate raised or their own pass (now documented at the hooks).
- The E2E's PERF check asserts the absolute budget at 4× CPU; on a loaded machine it fails for the machine's sake — re-run before
  believing it (the clean numbers are this table's).
- Carried: a plane's contrail grows the frame cost (Part 6 caps it); 7 spots sideways; the far outlines cut by the far envelope; the
  moon's path follows the drawn moon (Part 6); ~~the pier is not reflected and the wheel's / lighthouse's reflections are grey-box~~
  (Part 5: the wheel + boats + beam reflect themselves, the lighthouse from its crafted bake, the pilings' streaks baked).

### Handoff → Part 5 (harbor hero pieces)
Everything in Part 4's handoff above still holds, plus: a moving piece must keep the city at 60 fps while it moves — Rosie, the taxi,
the tug and the wheel turning are continuous, so either return true from a `busy()` the scene asks (add it to `fastNow`) or call
`scene.wake(ms)` when a motion starts; the wheel turning all night means the calm rate only applies by day / when the wheel is
still — decide with the owner whether the wheel idles at 30 fps (slow, smooth enough) or forces 60. `water.reflect()` /
`water.light()` are read when the mirror is built (10 a second): a moving boat's reflection steps at that rate under the ripples
(fine for a slow boat; a fast wake needs the source rate raised). The sign walls are full; new hero pieces must not add signs.

## Part 5 — THE HARBOR'S HERO PIECES (Oct 21 2026)
- [x] 0. Small fixes: THE TAGLINE rests with the dock · THE RIGHT-HAND SIGN WALL: two named ROOF SIGNS (the owner's call, below) ·
  the catch in WebKit (below).
- [x] 1. The Ferris wheel, the pier + its platform, the lighthouse + the beam + the keeper's cottage, the boats (Rosie, the taxi, the
  tug, the sailboats) with wakes + reflections; hooks for Parts 10, 11a–c, 12. THE ELEVATED TRAIN: not built (the owner's rule:
  only if it reads — below).
- [x] 2. Perf + memory (A-B-B-A, below). 3. Review: day, golden, night, a foggy night at 390 / 402 / 430 / 1440 + close-ups (wheel,
  lighthouse, Rosie, the harbor strip; bursts for the beam, the taxi, the wakes); two refine passes. Docs.

### 0. The small fixes, as built
- **THE TAGLINE** (title.js#tagState, the owner's call): shown on arrival; it fades out together with the dock when the title's
  screen goes to rest (`is-idle`, 10 s without a touch — NEON PASS 6, was 15) and comes back with the dock on a tap — the old 15 s fade-for-good is gone.
  While it is hidden its band is sky-low's (`scene.set({ tagGone })`); the camera never moves (the skyline never grows into its
  space). THE TAGLINE SLOT keeps working, even at rest: `tagSlot(text, ms)` shows a message (`.nd-tag-msg`, visible over
  `is-idle`), then the tagline comes back in its place. `&tagms=N` (dev + shots): the tagline alone fades N ms in, as at rest.
- **NAMED ROOF SIGNS** (asked + decided Oct 21 2026): on the reference phone every right-side roof sits right under a word
  face (the faces end at 487 pt, the roofs at 486–512) and the open sky between is a sun corridor or the lighthouse — so the
  owner's rule: **the roof signs stand on the WORD TOWERS' top roofs, in the open sky above their crowns; under the skyline
  limit; out of the sun corridors; the towers' beacons on top of the sign frames; while a tower spells a word its roof sign dims
  (to 22 %, over ~1 s) so the message stays the star.** `n-roofA` (wordA) + `n-roofB` (wordB), `mount: 'tower'`, 52 × 18 ref pt
  (`core/harbor-neon.js#towerRoofSign`: centred on the roof, trimmed to keep `CORRIDOR_PAD` 3 pt from a corridor, shrunk under
  the limit; null when it cannot stand); a riveted steel frame (`signs.js#roofFrame`: lattice legs on the roof's edges, a girder,
  X braces, a catwalk, the beacon's post). They took **i-c2** and **i-par2** off the right wall: 6 named + 6 icons on a phone,
  every game still has a sign. Tested at six sizes (+ the E2E: the beacons on the frames, under the limit).
- **THE CATCH IN WEBKIT** — see "Known issues (Part 5)".

### THE FERRIS WHEEL (`screens/harbor/wheel.js`)
- A real steel wheel, turning on the real clock (one turn in 150 s: every phone shows the same angle): the rim (two rings + the
  zigzag truss), 16 pairs of tension spokes crossing to the hub + 16 radial struts, an inner ring, the hub's plate and bolts —
  ONE sprite per look, rotated each frame. Painted red steel by day (the sun's side of the rim catches the light: an arc drawn per
  frame — it must not turn with the wheel), plum at golden hour, a warm-lit plum at night (it catches its own bulbs).
- **16 gondolas** hang level from their pivots on the rim and sway a little (each its own phase); four paint colours by day; at
  night their windows warm (a few empty and dark).
- **The bulbs** (night, with the city's power): 48 on the rim (three chase sets), 64 on the spokes (four rings), a star round the
  hub — one sprite per set, rotated with the wheel. **THE SHOW** (48 s; 24 s on a party night): steady (a soft twinkle) → a chase
  round the rim → the rings pulsing outward → a sparkle. Tier 0 + reduced motion: steady. A warm haze round the wheel + its pool
  on the platform's deck.
- **The A-frames ON THE PIER** (the owner's catch): the pier widens into a PLATFORM under the wheel (`L.pier.head`: ± (leg · r +
  1.4) around the wheel, z ± 6), so both A-frames' feet stand on its deck, 1.4 units in from its edges (tested at six sizes;
  E2E). The back A-frame is baked with the pier; the front one is a sprite over the wheel.
- Reflected through `water.reflect` (the mirror's 10 a second: the wheel is slow). Colour hook: `harbor().wheel.scheme(name)` —
  `WHEEL_SCHEMES`: city (warm white), party, halloween (orange / purple), christmas, valentine, stpatrick, july4, nye,
  thanksgiving, easter. Preview: `&force=wheel-scheme&scheme=halloween`. A tap → `{ kind: 'wheel' }` (Part 12: a gondola rocks).

### THE PIER (`pier.js`, baked)
A timber pier from the far quay out to z 118, its platform under the wheel: round pilings in pairs (a middle row under the
platform) with X braces, wet dark feet, the deck's dark underside; the deck in planks (alternate boards a shade apart, the seams,
a sheen by day, worn edges), the fascia, railings (posts + a top + a mid rail; across the platform's ends); the boarding plinth
under the wheel; a Deco ticket booth with a striped awning (its window warm at night); lamp posts (`pierLamps`: the platform's four
corners + along the walkway) lit per frame at night with a column in the water each (`water.light`); the pilings' faint
reflections baked under them.

### THE LIGHTHOUSE + THE BEAM (`lighthouse.js`)
- Baked: a rubble breakwater (granite boulders, sunlit tops, wet feet), a granite plinth in courses, the tapering tower — white
  with two red bands, SHADED AS A CYLINDER toward the real sun's side, a rim light at night — slit windows up a spiral (the top
  one lit at night), a door under a hood; the gallery on corbels with its railing; the LANTERN ROOM glazed between diagonal
  astragals (the sky in the glass by day, the lamp's warm light at night); the copper dome, its ventilator ball, the lightning
  rod; THE KEEPER'S COTTAGE (white clapboard, a red roof + chimney, warm windows at night, a picket fence).
- **THE BEAM** (per frame, `createBeam`): two beams opposite each other turning on the real clock (16 s a turn); each a CONE from
  the lantern, slightly dipped, foreshortened as it swings toward / away from us; pointing our way it FLARES (a star in the
  lantern + a flash down the water: `water.light`). It lights the haze round the lantern; reflected in the harbor
  (`water.reflect`); softened while a word spells. **Real fog** (`LK.fog`): brighter, wider — the dramatic night (and on a
  foggy day it is on, dimmer). Reduced motion: a steady beam to the side. Tier 1: one soft layer a fan; tier 0: no flare star.
- HOOKS: `harbor().lighthouse.set({ colour: [r,g,b] })` (11a: the Halloween green — preview `&force=beam-green`), `.spin()`; a tap
  → `{ kind: 'lighthouse', spun }` — three taps within 1.5 s spin the beam for 5 s (Part 12's egg; the scene keeps 60 fps).

### THE BOATS (`core/harbor-boats.js` PURE + tested, `screens/harbor/boats.js`)
- **On the clock**: each boat's place is a function of the real time alone (`boatAt(route, ms)`) — every phone shows the same
  harbor, a refresh lands it where it was; a cycle of segments (move with an easing, hold, turn, away). **They never cross the
  pier** (it runs from z 118 to the quay): everything beyond the pier head sails right of it (on screen, right of the platform's
  front corner + 3 pt — tested at six sizes, a day sampled); the WATER TAXI runs in front of the pier head and crosses the whole
  harbor. A boat TURNS by foreshortening (its side view squeezes to the bow and opens the other way).
- **ROSIE** (z 142, ~101 pt): in from the right to her landing beside the platform, four minutes alongside, turns, steams out —
  ten minutes a cycle. A white hull with a red boot stripe, three decks of arched windows with the shadows under their overhangs,
  the pilothouse, TWIN STACKS with feathered crowns, the red paddle box with her name (a pre-mirrored sprite: the name reads the
  right way both ways) and the PADDLEWHEEL turning while she moves; flagstaffs + pennants; at night every window warm and STRINGS
  OF BULBS from the bow staff over the stacks to the stern staff.
- **THE WATER TAXI** (z 94, ~38 pt): yellow, its checker band, a white cabin, a flag; zips across in 11 s (bow up), a minute
  between crossings; its own reflection per frame (too fast for the mirror's 10 a second); it keeps the scene at 60 fps while it
  crosses (`boats.busy()` → `fastNow`). `&force=taxi`: back and forth without a break (perf + review).
- **THE TUG** (night, z 214, ~27 pt): red + black, the bow fender, tyre fenders, the wheelhouse high, the stack, the towing lights
  on the mast. **THE SAILBOATS** (day, z 205–214, ~19 × 29 pt): white sloops, main + jib lit on the sun's side, HEELING in the
  real wind (`LK.wind`), tacking. The tug and the sailboats ride Rosie's ten minutes, PHASED so they come to the pier while her
  landing is empty — never idling unseen behind her (tested). A day / night boat is decided per CYCLE from the hour at its start
  (never pops in or out at dusk; tested across dusk).
- Every boat: a gentle bob, running lights at night (green to starboard — the side we see heading right — red to port; the
  tug's white masthead lights), **THE WAKE** drawn every frame from its own past path (`boatAt` at earlier times: the foam stays
  in the water where the hull passed, spreading and fading — the wash on the track, the Kelvin V's two arms, a bow wave; Rosie's
  paddlewheel the most) — not through `water.wake()` (read 10 a second), and **its reflection** (`water.reflect` about its own
  waterline; the taxi's own). Reduced motion: the boats hold still where the hour began, no wakes. Tier 0: no wakes (below).
  The wakes' samples are re-taken 10 a second and drawn into a small image per boat (only the taxi's head is stroked live); the
  boats are drawn AXIS-ALIGNED (the sailboats' heel in the real wind and the taxi's bow-up pitch are baked into their sprites — a
  rotated image is the slow path).
- **THE WATER LANE'S QUIET** (the owner's call, Part 5's perf review — instead of lowering anyone's look): while a BIG SHOW runs
  (two of: the party peak, the searchlights, a word in the windows), or the scheduler's heavy event quiets the water lane
  (`density.water`), or on TIER 1 a party night, the EXTRA BOATS wait: the taxi skips its next crossing, the tug its next visit.
  Decided only while the boat is out of sight (`boatRoutes` gives each stretch in the water a RUN; an away boat names the next one —
  tested), so nothing pops; one already on the water finishes. Rosie and the sailboats always sail. The readout shows "water quiet".
- **TIER 0 (the calm city):** no wakes, the beam one soft fan without the flare star, the wheel's image refreshed 4 a second, the
  taxi crossing every other time — every piece still there.
- HOOKS: `harbor().boats.set({ rosie: 'valentine' | 'parade' | 'party' | 'halloween' | 'christmas' | 'city' })` (her bulb strings:
  11c's dinner cruise, 11b's lit boat parade; preview `&force=rosie-lights&scheme=parade`); a tap → `{ kind: 'boat', id }` (Part 12:
  its horn). New boats (the ghost ship 11a, the party yacht Part 10, the parade's boats 11b) join `boatRoutes` as new routes.
- Draw order: the far boats (z > 150: behind the lighthouse) → the baked harbor layer (pier, platform, back A-frame, breakwater,
  lighthouse, cottage) → the beam → Rosie → the wheel (+ the front A-frame, the pier lamps) → the taxi (in front of the pier head).

### THE ELEVATED TRAIN — not built (the owner's rule: only if it reads on an iPhone)
Size-checked on the reference phone before building: on the far waterfront (z 230) a car is ~7 pt tall and ~36 pt long, its
windows ~2 pt; its track would run at 550–558 pt — between the signs' bottom edge (545) and the quay's top (566), across every
hero block's ground floor and right through the quay lamps and their columns in the water; and the wheel, docked Rosie and the
lighthouse cover ~60 % of its run, so a passing train shows in pieces. At night the lit ribbon would read; by day a 7 pt train is a
grey line, not a crafted shape. So it is NOT shipped (the owner asked to be told instead). Options for the owner: (a) the train on
a taller viaduct further back (z ~ 300, above the near band's roofs: it then crosses the skyline's lower windows — a tradeoff),
(b) desktop only (the panorama has open waterfront either side), (c) drop it for City 2.0. Its hooks would be `trainGap`
(district/street.js) + a route on the clock like the boats.

### Performance + memory (Part 5 — A-B-B-A against 6ebd5c7, the commit before)
Measured on a quiet machine (9 % CPU, on power), one after the other: previous, Part 5, Part 5, previous — `title-perf.mjs --city 2`
(390×844, DPR 3 capped to the tier, 4× CPU, mean ms of scene work, each number the mean of its two runs; frames 16.7 ms everywhere).
`h-night` = a night with the water taxi crossing non-stop (`&force=taxi`); `h-worst` = the neon's party moment + the searchlights +
a word + REAL FOG (the beam at its widest) + the taxi. **Bold = over the budget.**

| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| day (`np-day`) | 4.13 → 5.08 | 3.62 → 4.03 | 2.91 → 3.11 |
| night (`np-night`) | 5.50 → 6.74 | 4.75 → 5.93 | 3.39 → 3.88 |
| golden hour (`np-golden`) | 5.58 → 6.78 | 4.59 → 5.50 | 3.53 → 3.99 |
| party (`np-party`) | 6.62 → 7.62 | 5.46 → **6.41** | 3.69 → **4.05** |
| the stack (`neon`: party moment + searchlights + a word) | 6.89 → **8.12** | 5.39 → **6.32** | 3.73 → **4.75** |
| the harbor's night (`h-night`) | 5.46 → 6.75 | 4.51 → 5.64 | 3.18 → 3.79 |
| the worst (`h-worst`) | 7.07 → **8.02** | 5.69 → **6.40** | 4.16 → **4.95** |

What it took (the first build measured +0.9–1.6 at tier 2 and +0.6–1.1 at tier 0, profiled + A/B'd piece by piece with the new
`&force=no-boats|no-wakes|no-wheel|no-beam` and the `h-nb, h-nw, h-nwh, h-nbm, h-none` perf scenes): THE WHEEL turned inside a
cache image refreshed 20 / 10 / 4 times a second (one plain draw a frame, reused by the mirror; the bulb sets in one draw while the
show is steady); THE BOATS drawn axis-aligned (the bob as a shift; the heel + pitch baked: a rotated image cost them 0.7 ms at tier
0); the wakes re-sampled 10 a second into an image per boat; the pier lamps one sprite; the beam one layer below tier 2. Then the
owner's calls: TIER 0 calmer (no wakes, no flare star, the wheel 4 a second, the taxi every other crossing) and THE WATER LANE'S
QUIET (the extra boats wait during a big show / a heavy event / tier 1's party night) — nobody's look lowered.
**Still over (reported to the owner, no further cuts without her call):** the party night at tier 1 (+0.41) and tier 0 (+0.05), and
the stacked shows (the stack at every tier; the worst at tier 1 + 0 — the previous commit was already over at tier 0 there). The
E2E's party peak (its own page, a Saturday with the planes): t2 6.97 · t1 6.65 · t0 4.64. Memory: 28.65 MB of 64 at 390×844 tier 2
(+3.2: the wheel's sprites + cache 2.7, the boats' 0.5); 20 title ↔ setup cycles leave the same MB. The calm frame rate holds:
the wheel, Rosie, the tug and the sailboats all move slowly (30 fps is smooth — the wheel's rim moves ≤ 0.25 pt a step); the taxi
crossing and the spinning beam bring 60.

### Known issues (Part 5)
- ~~**THE CATCH ON iPHONE — not checked in WebKit.**~~ — CLOSED (Part 6a): the owner checked it on her iPhone — no dark flash. Playwright's WebKit download hung (0 bytes in an hour) and was removed; no other
  WebKit browser is on this machine. The owner's own iPhone check stays: open `?city=2` at dusk (or `&when=…T18:5x`) and watch the
  NEON sign's catch for a dark flash. If it shows, the suspect (cleanup pass 1) is WebKit promoting the glow paths to layers as
  their opacity transition begins (`will-change: opacity` on the premium logo's `.ndl-glow1/2` during `.is-catch`).
- **The budget is still over in the party / stacked scenes** (the table above) — the owner's call pending.
- **The wheel idles at 30 fps** (the calm rate; cleanup pass 1's open question, decided by measurement: smooth at 2.4° a second).
- The perf bench is software-rendered (headless Chrome, no GPU): a rotated `drawImage` is its slow path, so the hero pieces avoid
  rotated draws per frame. A real phone's GPU canvas is likely cheaper — the `&debug=1` readout shows the real numbers there.
- At tier 0 the taxi's reflection is the mirror's (10 a second): it steps a little under the ripples.
- The far half of the beam crosses the word faces' lower rows on a side sweep (softened while a word spells; the faces' letters stay
  brighter).
- A boat's thinning (the water lane's quiet) is per page: during a big show two phones may differ on whether the taxi crosses.
- `water.wake()` is unused (the wakes are drawn per frame from each boat's own path) — kept for later parts.
- The breakwater (Part 1's layout: the lighthouse x −20 … +34) shows as a rubble strip in open water left of the lighthouse when
  Rosie is out; plausible as a jetty, flagged for the owner's eye.
- Desktop: the pier recedes at an angle from the wheel (left of centre) to the quay — correct perspective; Part 12's desktop pass.

### Handoff → Part 6 (sky hero pieces)
The harbor's hero pieces are done; Part 6 rebuilds the sky's artwork (planes, the banner plane, the helicopter, jets, birds, the
UFO, satellites) on the existing systems. Things to know: the scene's calm rate (30 fps) holds while the wheel turns, Rosie, the
tug and the sailboats move (all slow); a fast thing (the taxi, the spinning beam) returns from a `busy()` read in `fastNow`. The
party yacht + its helicopter (Part 10) land on the water: add a route to `core/harbor-boats.js` (on the clock, right of the pier;
tested like the others) and a sprite + lights in `boats.js`; the helicopter is Part 6's art. The beam is over the city's fog
layers and under the near stage; a plane passing behind the beam needs nothing. Measure with `title-perf.mjs --city 2 --scenes
np-night,np-party,neon,h-night,h-worst` A-B-B-A.

## Part 6a — THE EVERYDAY SKY (Oct 21 2026)
- [x] 0. Fixes first: THE TIER on modern iPhones (above, Performance) · THE CATCH closed (the owner's iPhone: no dark flash) · THE
  WHEEL AT NIGHT reads against the skyline · SIGNS OFF THE HERO TOWERS (the game blade took the HOTEL's spot) · THE TRAIN decided.
- [x] 1. The everyday sky: planes, the banner plane, skywriting + skytyping, the helicopter, birds, hot air balloons, the sun's haze +
  the moon's art, the aurora — plus the owner's mid-part additions: THE DRONE SHOW and THE HOLIDAY SKY table.
- [x] 2. Review (each `&force=` piece, day + night, 390 / 402 / 430 / 1440 + close-ups; two refine passes), perf (A-B-B-A), docs.
- Tests: `tests/harbor.test.mjs` 59 (+9: the aurora's nights + Kp parsing, the moon's look, the weather gates + balloon hours, sky
  messages, the birds, the holiday sky table + overrides, every drone shape + every game's mark, the sky events — never random sky
  messages, no sign on the sunburst's / the needle's visible face + the game blade's glance test); `e2e-harbor.mjs` 56 (+5: the tier on
  an iPhone, the banner + skytyping through the API, the heavy sky's quiet + its 60 fps, the drone show + its barge, the moon's art);
  `server.test.mjs` (`/api/sky` carries Kp, cached, with no location too); the default city's title flow (`e2e-title ONLY=flow`) 34/34.

### 0. The fixes, as built
- **THE TIER** — see Performance ("THE TIER ON MODERN iPHONES"): `title.js` starts the Harbor at tier 2; `scene.js#perf` has the
  start-up grace + the guarded step-up.
- **THE CATCH** — closed (Known issues, Part 5).
- **THE WHEEL AT NIGHT** (`wheel.js`): the city scheme's bulbs are a crisp near-white now (the skyline's windows behind it are warm
  tungsten — the warm bulbs melted into them) and a soft GLOW RING traces the rim (a wide faint halo + a fine bright line, an inner
  ring round the hub; not rotated, under the bulbs) — the circle reads at a glance, still elegant; the holiday / party schemes keep
  their colours (and get the ring in their own rim colour). The haze round it is a neutral warm white.
- **SIGNS OFF THE HERO TOWERS** (the owner's rule): the sunburst's named vertical sign is gone; the HOTEL blade is gone (its thin
  letters didn't read); **THE GAME BLADE** (`n-blade`, `core/harbor-neon.js#SPOTS`) takes the hotel's spot — a projecting vertical
  cabinet with the hotel's chasing bulbs (`spot.bulbs`), tonight's game (cap 6 letters: they stand ~8.5–9.8 pt tall on a phone),
  bigger than the old blade (16 × 70 ref pt), its top under the hotel's roof (tested: no sign covers the sunburst's or the needle's
  VISIBLE face — their faces down to the roofs in front of them). Still 6 named + 6 icons on a phone: every game has a sign.
  **Open question for the owner:** the EMPIRE (the other dominant hero tower) still carries a named vertical sign (`n-empire`) —
  the rule as written covers it too; removing it would need a new icon spot so every game keeps a sign.
- **THE TRAIN** — decided: desktop + TV only, built with Part 12's desktop pass (plan.md, Part 5).

### THE EVERYDAY SKY, as built (`core/harbor-sky.js` PURE + tested; `screens/harbor/skyfx.js` + the pieces)
The district's sky systems keep their behaviour (the traffic by the hour, the paths, the Starlink evenings, the real sun + moon);
the ARTWORK is the Harbor's own. Every piece lives in the SKY LANES — `sky-high` (over the NEON sign) and `sky-low` (under the
tagline, behind the taller towers) — never across the sign or the tagline. A piece's flight is a function of the time since it began
(every phone sees the same sky; a refresh lands mid-flight).
- **AIRLINERS** (`air.js`): a crafted sprite per plane (its size, slope, heading, the hour's light): a tapered fuselage — the sun on its
  crown, the belly in shade — swept wings with the engines under them, the tail in one of three liveries + a cheatline, the cockpit
  glass, a row of windows (lit at night on a big one); at night a dark shape whose TAIL is lit by its logo lights, NAV LIGHTS (red
  port, green starboard: `navLights`), a white tail light, red beacons top + belly, double-flash STROBES, and on approach the LANDING
  LIGHTS with a glare reaching ahead. **THE CONTRAIL, CAPPED:** two engine lines merging into one, widening, drifting on the real wind
  and fading — ≤ 60 samples a plane in six batched strokes (the district's piled-up puffs cost +2.3 ms over a pass). Planes use only the
  FREE lanes (a lane a piece holds is never shared); an approach comes in low (sky-low).
- **THE BANNER PLANE** (`banner.js`): a yellow Cub-style tow plane (cowl, windshield, the wing on struts, a red-trimmed tail, a blurred
  propeller) towing 1–3 BANNER PANELS on one line in sky-high: cream nylon, bold red letters (~14 pt, the glance test), a spreader
  pole + its weight, bridles between panels, a red tail streamer. THE FABRIC RIPPLES: drawn in vertical slices on a wave running back
  from the pole (growing toward the free end), each slice shaded by its slope. The panels read left → right whichever way it flies.
  A pass takes ~30 s; `passes: 2` comes back. Random flights: the scheduler's `banner` (daily, by day; in-world ads + a game's name).
- **SKYWRITING + SKYTYPING** (`smoke.js`): one aerobatic plane draws ≤ 10 characters in huge single-stroke letters (the tube alphabet +
  digits, ♥ ! ?), the smoke on along each stroke; or FIVE planes line abreast (the window font's 5 rows) puff a dot as each passes a
  lit column — ≤ 16 a line, a second line on the way back. The smoke: each puff born at a known time, drifting on the REAL WIND
  (gently: a real 5 m/s moves it ~0.6 pt/s), swelling and softening, legible ~95 s after the last puff, gone by ~3 min. Re-rendered
  into one layer 8× a second while writing, 3× after (2 at tier 0); the newest puffs live. Only on clear, low-wind days
  (`smokeWeather`) — the API and previews draw whatever the weather. **Not random:** holidays + the API only (the owner's call).
- **THE HELICOPTER** (`air.js`): a navy + white chopper (glass canopy with an instrument glow at night, skids, the tail fin + rotor),
  a motion-blurred rotor disc seen edge-on with blade streaks; in from a side, a hover over the harbor (in the open sky over the
  lowest roofs), out the other side; at night a SEARCHLIGHT sweeping down to the water + its pool, a red beacon, nav lights.
  Random: the scheduler's `helicopter` (daily). **Hook:** `harbor().sky.fly(route, { land })` — Part 10's party-yacht landing.
- **THE BIRDS** (`birds.js`; who is up: `birdsNow`): GULLS wheeling over the water in front of the skyline by day (the classic white
  "M": bent wings, black tips, the grey mantle as they bank; long glides, a few wingbeats to climb; 13–22 pt; before the water — the
  mirror reflects them), SWIFTS darting round the rooftops on summer evenings, GEESE in V's crossing a free sky lane (the migrations
  most: autumn's head away, spring's come toward us; the wingbeats ripple down each arm), BATS jinking over the roofs on summer
  nights, the district's rare night HERON. Reduced effects: none on the wing. The gulls glide slowly (30 fps is enough); the rest
  keep 60.
- **HOT AIR BALLOONS** (`balloons.js`): 12 gores whose stripes narrow toward the edges (a sphere), load tapes, the vent cap, the
  skirt, shaded toward the REAL sun's side; a wicker basket + burner frame; every 8–20 s a BURN — the flame up into the mouth and, at
  dusk, the envelope LIT FROM INSIDE like a lantern. Calm (≤ 4 m/s), clear mornings (Apr–Oct) + summer evenings (`balloonTime`,
  `balloonWeather`); the scheduler's `balloons` (daily, in those hours), rarely a FESTIVAL of 4–6 (`balloon-festival`, rare, heavy).
- **THE SUN + THE MOON** (`moon.js`; the timing, path, phase unchanged): the golden hour's HAZE — the low sun's warm air along the
  horizon on its side of the sky. THE MOON is a crafted texture (the near side's maria where they are, Tycho + its rays, Copernicus,
  Kepler, Aristarchus, craterlets) in its real phase with a soft terminator, EARTHSHINE on a crescent's dark part (the maria faintly
  there; in twilight the dark part is the sky's own colour — nothing drawn), the BIG AMBER MOONRISE (×1.3 and golden-orange low,
  shrinking to silver by ~26°; the HARVEST MOON stays amber longer; a SUPERMOON — full + closer than 362 000 km — a touch bigger), a
  tight corona in clear air and a 22° HALO only in real haze (thin cloud / light fog), the LUNAR ECLIPSE copper-red on the real dates.
  On a phone the moon now RISES IN THE SUNRISE CORRIDOR between the EMPIRE and the vertical word tower (`archFor`: x0 0.185 — at 0.1
  it spent its whole amber rise behind the EMPIRE). The district's moon alpha (made for its old sprite, ~0.35 in twilight) reaches
  full strength at 0.45 for the Harbor's disc.
- **THE AURORA** (the owner's call): a rare timed event for everyone — ~2 nights a month (`auroraNight2`: 1-in-16 dice by the evening's
  date, never right after another dice night → 2.1 a month, never two in a row) — plus a bonus night whenever NOAA's planetary Kp
  shows a strong storm (Kp ≥ 7 within 12 h, wherever the player is: `auroraTonight`, `stormKp`); only at night (`w.night + w.late` >
  0.6) under clear-enough skies (no rain, cloud < 0.6, fog < 0.4). The art: curtains of rays — a sharp green lower border fading up
  through teal into violet and red, slow ripples — rendered small (W/3) 9× a second and drawn as one soft image; a storm night
  higher and brighter. City 1.0 keeps its own aurora (fx.js's, 1 night in 5) — the Harbor's is an opt-in hook (`s.auroraArt`).
  **Kp:** `/api/sky` carries `kp` (NOAA SWPC's `noaa-planetary-k-index-forecast.json`, 3-hour blocks 12 h back → 36 h ahead,
  `core/weather.js#parseKp`, one global cache an hour; with no location the answer is `{ kp }`); `live-weather.js#liveKp`.
- **THE DRONE SHOW** (`drones.js`, the owner's design): a heavy sky event at night. THE BARGE fades in on the open water in front of
  Rosie's landing (a steel hull, a deck of landing pads glowing blue, a control hut, red mast lights); the drones (180 / 140 / 90 by
  tier) lift off in a rising stream (reflected as they climb), gather into a cloud, then flow through the show's FORMATIONS — each
  drone matched in order across the picture so they stream rather than cross, a soft arc on the way, the colour switching mid-flight,
  a faint hover while they hold — then a scatter (an outward breath + twinkle) and home to the barge, lights off as each lands.
  SHAPES (`droneShape`): letters in the skytyping font (each lit cell a 2×2 / 3×3 cluster of drones glowing into one solid pixel,
  cells ≤ 13 pt: letters ~65 pt tall), heart, star, flag (a filled grid), every game's mark (`mark:<id>`), ₿ (`bitcoin`), pumpkin,
  Christmas tree, firework burst, shamrock, egg. Calm shows (Memorial + Veterans Day) are slower, steady, no burst twinkle.
- **THE HOLIDAY SKY** (`SKY_HOLIDAYS`, the owner's call): ON THE CLOCK (never the dice) — by day a skywriting / skytyping message at
  the entry's local hour (clear + low wind only), at night a drone show at its local hour: Valentine's (♥ · heart, LOVE), St. Patrick's
  (shamrock), Easter (egg), Memorial Day (WE REMEMBER · a calm flag), July 4th (· flag, USA, star — 21:15, ends before the fireworks),
  Halloween (BOO · pumpkin, BOO), Veterans Day (THANK YOU VETERANS · a calm flag), Thanksgiving, Christmas Eve (MERRY CHRISTMAS · tree,
  MERRY, CHRISTMAS, star), New Year's Eve (· burst, HAPPY, NEW YEAR, 2027 at 21:00 — ends hours before the countdown). A late arrival
  lands mid-message. Parts 11a–c fill the entries in; **CITY CONTROL:** `setSkyHoliday(id, null)` cancels, `setSkyHoliday(id, { day,
  night })` overrides. No automatic shows on regular party nights.

### The sky's API (`harbor().sky`) + the previews
| call | what |
| --- | --- |
| `banner(lines, { colour, passes, at })` | the banner plane with 1–3 panels (an array, or "A \| B", or wrapped to ≤ 24 characters) |
| `skywrite(text, { at })` | ≤ 10 characters in smoke letters (longer → skytyped) |
| `skytype(text, { at })` | ≤ 16 a line, ≤ 2 lines (HAPPY BIRTHDAY STEVE, HAPPY NEW YEAR, MERRY CHRISTMAS, HAPPY THANKSGIVING) |
| `drones(specs, { calm, at })` | a show: `['heart', 'HELLO', 'mark:pulse', { text: 'BOO', col: [255,140,30] }]` |
| `balloons({ festival })`, `helicopter()`, `fly(route, { land })`, `stop()` | the rest; `state` = what flies now (tests) |
Each starts now (or at `at`, clock ms). Previews (`&force=`): `banner&text=A|B`, `skywrite&text=HI`, `skytype&text=…`,
`drones&text=A|B&show=heart,star,mark:golf` (+ `drones-calm`), `helicopter`, `balloons`, `balloon-festival`, `aurora`, `planes`,
`approach`, `geese`, `swifts`, `bats-dusk`, `heron`, `satellites`, `eclipse`. Shots: `shots.mjs --city 2 --scenes sky-day,sky-night,
banner,skywrite,skytype,helicopter,balloons-dawn,balloons-dusk,gulls,geese,swifts,moonrise,harvest,crescent,eclipse,aurora,drones,
drones-text --crop sky`; perf: `title-perf.mjs --city 2 --scenes s-day,s-night,s-banner,s-skytype,s-heli,s-drones,s-aurora,s-worst`.

### Sizes (pt on the reference phone, 402 wide — the glance test)
airliner 13–21 long (sky-high), 17–25 (sky-low), 32 on approach · the banner plane 30, its panels 21 tall (letters ~14) · skywriting
letters ~60 tall · skytyping letters ~23 (2 lines) · the helicopter 28 (its rotor 40 across) · gulls 13–22 across · geese 13 ·
swifts 7–8.5 · bats 7–9.5 · a balloon 40–64 tall (the near one) · drone letters ~65 tall, a heart ~100 · the moon 30 across (40 low).

### Performance + memory (Part 6a)
Measured A-B-B-A against d83d7f0 (the commit before Part 6a) on one quiet machine, one after the other: previous, Part 6a, Part 6a,
previous — `title-perf.mjs --city 2` (390×844, DPR 3 capped to the tier, 4× CPU, mean ms of scene work, each number the mean of its two
runs; frames 16.7 ms everywhere). On the previous commit the `s-` scenes are the plain scene (its own district planes in `s-day`), so the
change is each piece's whole cost. **Bold = over the budget.** This machine ran slower this session than in Part 5's round (the
previous commit's `np-party` read 8.2 at tier 2 here, 7.6 then) — only same-run comparisons count.

| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| day (`np-day`: the gulls, the haze) | 5.04 → 5.60 | 4.20 → 4.56 | 3.22 → 3.58 |
| night (`np-night`: the moon's art) | 6.75 → 7.00 | 5.70 → 5.95 | 3.92 → 3.90 |
| golden hour (`np-golden`) | 7.79 → 7.11 · re-run 7.03 → 7.19 | 5.45 → 5.65 · 5.92 → 5.56 | 3.59 → **4.46** · 3.89 → **4.46** |
| party (`np-party`) | 8.21 → **8.05** | 7.52 → **6.22** | 3.98 → **4.12** |
| planes by day (`s-day`: the capped contrails) | 6.09 → 5.46 | 7.11 → 4.89 | 7.46 → 3.95 |
| skytyping (`s-skytype`) | 5.00 → 5.11 | 4.08 → 4.29 | 2.90 → 3.38 |
| the helicopter at night (`s-heli`) | 6.27 → 6.41 | 5.73 → 5.45 | 3.63 → 3.96 |
| the aurora (`s-aurora`) | 8.24 → **8.05** | 7.01 → **6.37** | 4.19 → **4.15** |
| THE DRONE SHOW (`s-drones`) — first build | 7.03 → **8.75** | 5.62 → **7.34** | 3.62 → **5.73** |
| THE DRONE SHOW — after the one fix (re-measured A-B-B-A) | 7.11 → 7.72 | 5.97 → **6.86** | 3.58 → **5.17** |
| party peak + the drone show (`s-worst`) — after the fix | 8.89 → **9.52** | 5.95 → **7.40** | 3.97 → **5.42** |

Everything but the drone show is level within this machine's noise (±0.5 ms; the previous commit was already over in the party +
aurora scenes here) — and by day with planes Part 6a is CHEAPER (the district's contrails grew to +3.5 ms at tier 0; capped now).
THE DRONE SHOW's one fix (positions once a frame for both draw passes, each drone's glow sprite resolved at the start, the barge's pad
lights baked) brought it within budget at tier 2; **still over at tier 1 (+0.9) and tier 0 (+1.6), and stacked on a party peak** —
reported, not thinned (the owner's rule). The next step if her iPhone (`&debug=1` on `&force=drones`) shows it: draw a HOLDING formation
from one cached image (most of a show is holds — only the morphs need per-drone draws), which keeps every drone. Golden hour reads
+0.6 at tier 0 (the haze's wide blits + the gulls) — within reach of noise, flagged. The E2E's party peak: t2 6.57 · t1 6.27 · t0 4.21
(its own page, a Saturday with the planes). Memory unchanged: 28.65 MB of 64 at 390×844 tier 2 (the sky's sprites are small: a
plane ~0.1 MB, the smoke layer ~1 MB while a message is up, the aurora's W/3 canvas, the moon's 256² texture + composite).

### Known issues (Part 6a)
- **THE DRONE SHOW is over the bench's budget at tier 1 (6.9 of 6) and tier 0 (5.2 of 4), and stacked on a party peak** (the table
  above) — one fix made, re-measured, reported: the owner's iPhone decides (`&force=drones&debug=1`). The next step: holding
  formations drawn from one cached image.
- Golden hour reads +0.6 ms at tier 0 on the bench (4.46 of 4) — near the noise; flagged.
- ~~The EMPIRE's named sign~~ — removed in NEON PASS 2 (no sign on any hero tower; `i-par2` took its place).
- Things that CROSS the sky (planes, the banner train, a festival balloon high up) pass behind the corner buttons (☰ + music) on a
  phone — the sky-high lane stops short of them, but a crossing can't. Never across the NEON sign or the tagline (tested by path).
- The moon RISES in the sunrise corridor between the EMPIRE and the vertical word tower; its amber hour is still partly hidden behind
  the left towers at some dates (its framed path is Part 2's arch). The crescent near moonset can sit behind the right word towers'
  roof signs — real skylines hide the moon too.
- The weather gates are checked when a piece STARTS (the scheduler can't know the past's wind): a holiday's daytime message whose
  hour is cloudy is skipped for the day (its night show still flies); a balloon already up stays up if the wind rises.
- SKYTYPING's second line is typed on the way back (right → left: its dots appear in that order) — how a real formation does it.
- The helicopter's searchlight is drawn after the harbor (in front of the near boats) — it reaches the water in front of everything.
- The drone show's drones are reflected by the mirror once they are above the far quay (the mirror copies the frame there); the few
  still rising by the barge below it are not.
- `/api/sky`'s Kp needs the deploy; on localhost (no `/api`) the aurora has its seeded nights only. City 1.0 keeps its own aurora
  (1 night in 5) and moon (unchanged, opt-in hooks).
- Not checked in WebKit (no WebKit on this machine) — the owner's iPhone check: the links below + `&debug=1`.

### Handoff → Part 6b (the special-occasion sky)
The manager (`skyfx.js`) is where 6b's pieces plug in: a piece = a module with `draw(c, s)` (+ `on()`, `stop()`, `debug()`), its lanes
in `used()`, `heavy()` if it quiets the city, a `busy()` for the calm rate, an API entry + a `&force=` preview in `sync()`. Lanes:
JETS + the air show and SKYDIVERS take both sky lanes (heavy); the UFO + the witch + Santa's sleigh cross sky-high or sky-low. The
witch + the sleigh are still the district's art inside `fx.back` (they run on their holidays) — 6b replaces them (an opt-in hook
like `s.moonArt`) and fx.mid (the UFO) is not called on the Harbor. The DRONE SHOW's API (`harbor().sky.drones`) + the HOLIDAY SKY
table (`SKY_HOLIDAYS`, `setSkyHoliday`) are ready for Parts 10 + 11a–c and CITY CONTROL; the helicopter's `fly(route, { land })` for
Part 10's party yacht. Skydivers landing on the promenade need Part 8's people (walking into the speakeasy): build the canopies in
6b, the landing walk in 8. Measure with `title-perf.mjs --city 2 --scenes s-day,s-night,s-drones,s-worst` A-B-B-A.

## NEON PASS 2 (Oct 21 2026) — the building neon fixed, the midsection lit, the waterfront, the drones' colours, real neon sound
From the owner's zoomed iPhone review. Everything behind `?city=2`.

### 1. The building neon, fixed
- **Occlusion + clean ends** (`neon.js#cutOutlines`): every line is cut at ITS OWN depth against the envelope of nearer buildings
  (each line carries its `z`), and a tower's contour against that envelope *dilated* by ~5 pt (`R`) — the sun corridors (`SUN_GAPS`,
  narrow gaps in the near band) no longer let a tube drop down a gap to a lower roof. Every run ends at an electrode CAP (`tubes.js#caps`,
  the last 4 points dimmed: `capLight`); runs shorter than 5 pt are dropped (`dropStubs`). Nothing within 2.5 pt of the screen's edge.
- **No stair-steps** (`core/harbor-neon.js`): a tower's contour starts at its FOOT, tiers closer than `MIN_STEP` (1.1) merge, the crown is
  ONE step (deco / stepped / mast), and every corner is FILLETED (`fillet(pts, FILLET = 0.8)`: a quadratic bend, 6 samples).
- **Signs vs tubes:** a sign's, an icon's or a billboard's cabinet (+1.4 pt) and the wheel's disc cut the tubes (`blockersOf`). **Signs are
  solid:** the cabinets are cut out of each outline sprite's LIGHT when it is baked (destination-out) — no glow shows through a sign;
  the live chasers + the flash sweep draw through an even-odd clip only while they run (`solidClip`). Tier 0's composite the same.
- **No sign on a hero tower:** `n-empire` is gone; `i-par2` (an icon on the PAR quay block) added — **5 named + 7 icons**, every game a
  sign each night; all inside [3, W − 3] at 390 / 402 / 412 / 430 (tested). The construction tower (`wordV`) stays free of signs.
- **The billboard:** its paper seams sit UNDER the paint; the small second line shows only where it is ≥ 6.5 pt (never on a phone).
- **The wheel's quiet zone:** no tube behind its disc; ~~a soft night-air VEIL inside the rim~~ (removed in NEON PASS 3: the wheel is
  see-through).
- **The sun + moon arch** (`scene.js#archFor`): the apex just under the NEON word (`cam.word`), passing behind the tagline; the winter
  path + the real timing unchanged. The tagline gets a soft dark text-shadow (`.nd-tag-shade`, no box) while the sun's or the moon's
  disc is within 1.6 r of it (`title.js#tagShade`). Checked: the summer noon sun + the Dec 24 full moon at 390 / 402 / 430.

### 2. The midsection, lit (`core/harbor-neon.js` — the bands)
- The NEAR band (share 0.86): WARM roles across the screen (pink / amber / red: `h0 a0 h1 a1`) — every building a roofline; then by its
  dice a thin Deco LEDGE band (< 0.36), CORNER TRIMS (< 0.6), FINS (< 0.76). The MID band (0.4) cooler (`b1 b0 h1`), the far 0.1.
  Buildings whose face reaches the wheel's disc get none. The quay heroes: a roofline + a ledge at 30 % + trims (PAR pink, JAZZ amber).
  The palette rules hold (tested: the warm near band; the rest base > heat > accent).

### 3. THE WATERFRONT STRIP (`screens/harbor/waterfront.js`, new)
The far shore's ground floor as a RIBBON OF WARM STOREFRONT GLOW along the water — read on a phone by COLOUR + SHAPE + REFLECTION
(the owner's add-on: it is a few pt tall there):
- **storefronts** only where they can be seen at street level (`storefronts(L)`: the near band + the heroes, nearer ones hiding the
  ones behind), never behind the wheel, never cut by the screen's edge; every neighbour different; ONE theatre (the widest front in
  the middle). 10 on a 390 phone, 39 on a 1440 desktop.
- **each shop:** a striped AWNING (scalloped), a shop WINDOW (sky in the glass by day; its own warm light at night — amber, rose, warm
  white, a teal diner — with a figure or two), and above it a simple NEON SHAPE: cocktail glass, coffee cup, arrow, fish, music note,
  pizza slice, star, heart (unlit glass by day). **Names** (BAR, DINER, OYSTERS…) only on a wide screen and only where the letters are
  ≥ 3.6 pt — a long name on a narrow front takes its shape (`debug().named`).
- **the THEATRE:** a marquee of CHASING BULBS round its canopy (drawn live: the strip's one moving part).
- **the water:** LONG WOBBLY REFLECTIONS — each lit shop queues a long light column (`water.light(x, y, col, a, w, len)`: the new `len`)
  the mirror's ripples break up; the strip itself is mirrored (drawn before the water). Baked: one art sprite per look + one lit sprite
  (0.4 MB at 390). `&force=no-waterfront`.

### 4. THE DRONES' COLOURS (`core/harbor-sky.js#droneShape`, `drones.js`, `skyfx.js`)
- A message: one colour (`col: [r,g,b]` / `'rainbow'` across the letters) or a colour per word / per letter (`cols` + `by: 'word' |
  'letter'`); shapes keep their own colours. Any drone any colour (`hsv()`).
- THE COLOUR WAVE: through each morph a drone takes its new colour when a wave sweeping left → right reaches it (its place across the
  box: `xns`) — the change ripples across the swarm (calm shows: all at once). `cycle`: while a formation holds, its colours drift
  slowly round the hues (24 cached glows).
- The API: `harbor().sky.drones(specs, { colour, colours, by, cycle, wave })` (hex or [r,g,b]; a spec's own `col` / `cols` win). The
  preview: `&force=drones&text=HI%20THERE&colours=ff2e97,2ee6ff&by=word` (`&colour=rainbow`, `&cycle=1`). `debug().colours` counts them.
- The holding-formation-as-one-image fallback is NOT built: the show's cost on the owner's iPhone isn't known yet (Known issues).

### 5. REAL NEON SOUND (`audio/sfx/neon-*.wav`, `audio/ambience.js`, `title.js` — City 2.0 only) → `docs/audio.md`
Four CC0 Freesound recordings cut + levelled by `scripts/build-neon-sfx.py`: four flickers (random, never the same twice running) on
the warm-up's strikes and the dawn's stutters, the dropout when a tube cuts out, the power-on at THE CATCH, the hum looping very
quietly while the sign is lit. The synthesized sounds stay as the fallback.

### 6. The iPhone's slow frames (tier 2, a party night: 3.0 / 4.0 ms of work but 6 % slow frames)
**Where the frames go:** not the CPU — the GPU's FILL at DPR 2. Counting every pixel the main canvas blends a frame (a `drawImage`
probe, 402 × 874 at DPR 2), a party night painted **6.7 full screens** of pixels a frame: the vignette 1.0, the sky 0.67 + the star
field 0.67, each city band twice (its baked layer + its lit windows: far 0.70, near 0.73, the stage 0.41), the logo's haze 0.46, the
lamps 0.35, the rest small (the neon sprites are ~0.4 in all). The party itself is DOM / CSS (not in that count).
**Reduced, same picture** (Porter-Duff "over" is associative — checked pixel for pixel: only moving things differ):
- a band + its lit windows drawn as ONE bitmap while both are steady (`scene.js#pair`, rebuilt when either re-bakes or the light level
  moves a 64th; any fade / the power-on wave draws them apart); the star field folded into the sky bitmap (`stars.base()` + `skyMix`).
  **6.7 → 5.3 screens a frame (−21 %)**, +4 MB of canvas (35 of 64). `&force=no-merge` draws them apart (the A-B check).
- What's left: the vignette (a full-screen blend; only its centre is clear) and the logo's haze — both change the look to cut.
  Whether the 6 % goes: the owner's iPhone (`&when=2026-10-24T23:00&debug=1`).

### Performance (A-B-B-A against 50bc995, 4× CPU, the laptop without a GPU, 402 × 874; ms of scene work a frame)
| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| `np-party` | 8.07 → **8.44** | 6.35 → **6.38** | 3.99 → **4.26** |
| `np-night` | 6.74 → 7.12 | 5.76 → **6.02** | 3.86 → **4.11** |

The first round read +0.5–0.7 ms; the fix (the solid-sign clip baked into the sprites instead of clipped every frame) halved it.
The rest is the new neon (the midsection's lines, the waterfront's lights + the marquee). Frames p50 16.7 ms everywhere. One fix,
one re-measure, reported (the party peak at tier 2 was already over before this pass).

### Known issues (NEON PASS 2)
- **Over the bench's budget by ~0.3 ms** (the table): the party peak at tier 2 (8.44, already 8.07 before) and tier 0 (4.26), a night
  at tier 0 (4.11) + tier 1 (6.02). The next step if the owner's iPhone shows it: the waterfront's lit sprite + the marquee into the
  near group's composite at tier 0.
- **The drone show over budget at tiers 1 + 0** (Part 6a) still stands — the hold-as-one-image fallback waits for the owner's iPhone.
- On a phone the WATERFRONT is partly hidden (the near corner building on the left, the paddle steamer in the middle), so its long
  reflections show mostly in the open water right of the steamer.
- The party chasers still draw through a per-frame clip (only while they run).
- `e2e-harbor`'s PERF check (party peak, 4× CPU) sits at the edge of tier 2's budget: 8.66 / 6.77 ms over three runs (failed once,
  passed last; the table's first row). Two of its checks are flaky (each passed in other runs this pass; the last run 60 / 61): BATTERY (a light re-bake landing in its 3-second calm window) and RE-LAYOUT (its pixel on the
  speakeasy's wall by the door: a passer-by).
- The recorded neon sounds were cut + levelled by script from the raw downloads (the brief expected trimmed files) — **check them by
  ear**; `NEON_GAIN` (ambience.js) trims all of them at once; re-cut with `python -I scripts/build-neon-sfx.py` (times in the script).
- Not checked in WebKit (no WebKit here).

### Handoff → Part 6b (the special-occasion sky)
As Part 6a's handoff above. New since: the drones' colours (`colour / colours / by / cycle / wave`) for CITY CONTROL's picker; the
waterfront's shops (`SHOPS`) are where Part 8's people can walk in; `water.light(…, len)` for anything that wants a long streak.

## NEON PASS 3 — THE WOW PASS (Oct 22 2026): the night city spectacular, party nights a real show
From the owner's iPhone review after Neon Pass 2 ("the neon look, we're still missing it"; party night "looks cheap and basic"), with
her add-on answers: a BOLD BUT DESIGNED palette (many colours, up to 2–3 a building, neighbours contrasting; replaces "max 2"), neon on
ALMOST EVERY building, A LITTLE MOTION EVERY NIGHT, and a party peak that is a big spectacle but NEVER strobe-like. The floor: City
1.0's night + party night (trims on almost every building, coloured rooms, party windows, a coloured glow over the city, the
searchlights). Everything behind `?city=2`.

### 1. The review's fixes
- **THE WHEEL, SEE-THROUGH:** Neon Pass 2's dark veil is gone (`scene.js` — the quiet zone stays: no tube, band neon or sign behind the
  disc). The wheel reads by its own light: the rim + its glow ring, the struts FAINTLY LIT (a fine soft line hub → rim, turning with
  it, in the hub sprite), the hub, the cars' lamps. The warm haze the bulbs throw is now a RING round the rim (clear inside) + the pool
  on the deck (`wheel.js`: `haze` / `pool`).
- **THE GAME BLADE, READABLE** (`signs.js#bladeLayout`, the spot `n-blade` 248–266 × 475.5–555 ref pt, `i-c1` moved 3 pt right): the
  bulbs on an OUTER FRAME (a ring 1.15 pt inside the cabinet), a clear DARK GAP (≥ 2 pt) to a near-black inner PANEL, the letters
  inside it bigger (≥ 10 pt for six letters — tested at the four phones; were 8.7) and brighter (1.4–1.55 pt tubes, a whiter core, a
  tighter glow so six stacked letters never melt into a bar). The bulbs CALM: one in four lit, a step every 0.42 s with a soft
  hand-off — never a flash across the letters.
- **THE DRONE SHOW IN OPEN SKY** (`skyfx.js#droneBox`): the formation's box runs from under the tagline (under the SPEAKEASY word once
  the tagline has faded: the freed band) down to the TALLEST crown across it minus 12 pt (spires + beacons included: the roofline) —
  never over a tower, a roof sign or the NEON word; measured 63–90 pt tall on the phones. The drones still launch from the barge and
  rise past the city. E2E: the lit formation's box sits between the word and the tallest crown.

### 2. The night city, spectacular (every night)
- **NEON ON (ALMOST) EVERY BUILDING** (`core/harbor-neon.js#outlines`, the bands): every near + mid building from a small trim to a full
  outline, by its dice — `outline` (one bent tube up an edge from the foot, over the roof with a parapet step, down the other; a Deco
  CHEVRON on some parapets), `bands` (Deco LEDGE BANDS floor over floor up the upper half), `pilasters` (corner pilasters full
  height), `fins`, `sunburst` (a Deco fan under the roof), `trim` (the roofline ± the top floors' corners), and a few `quiet` — only
  next to a lit neighbour, never two dark in a row. FULL RUNS: a trim goes all the way along its edge; the cut ends it at caps behind
  nearer roofs. The far band's slim towers (the ones peeking between the landmarks) are outlined too. The middle tier from its FOOT +
  fins on its top tier; the heroes + the middle tier get SETBACK LEDGES (a band across the face at every setback, + two spandrel
  bands up a hero's shaft) — the towers read lit floor over floor. Word faces, the wheel's quiet zone, the construction tower and
  the corridors' clipped pieces stay clear. Bands come in CLUSTERS of 3–4 neighbours (`threads-near-N`, `threads-mid-N`,
  `threads-far-N`): they boot one by one and the show plays them apart.
- **THE PALETTE, BOLD BUT DESIGNED:** five new colours — magenta, teal, green, gold, white (roles `m0 t0 g0 a3 w0`; a holiday scheme
  that doesn't name them maps them to its older roles: `ROLE_FALLBACK`). Up to THREE colours a building from DESIGNED PAIRINGS
  ([main, accent, detail] — pink + gold + white, red + white + gold, magenta + cyan …): the near city WARM, each third of it its own
  family (`WARM_L / WARM_M / WARM_R`), the mid city COOL (`COOL_*`), the far threads single colours; a neighbour never shares the
  main colour (tested); the middle tier in contrasting pairs. Tested: ≤ 3 colours a building, ≥ 85 % of the near band + ≥ 75 % of
  the mid band lit (outside the wheel's zone), neighbours contrast, the near band warmer than the mid band, ≥ 8 colours across the city.
- **THE LIGHTHOUSE IN NEON** (the outline `lighthouse`, group `harbor`): the tower's edges in white, the stripes' rims + the gallery +
  the dome in red, the railing + the lantern room in white; the keeper's house's roofline amber (`cottage`). The new `harbor` group
  draws over the baked harbor layer (after the beam) and is mirrored by the water (`water.reflect`).
- **MORE NIGHT LIGHT:** COLOURED ROOMS (~6 % of lit windows: pink, violet, teal, magenta, cyan — `harbor-windows.js#winTraits`,
  `lights.js#NEONW`, each with a soft halo round its pane); THE CITY'S LIGHT ON THE NIGHT AIR (`sky.js#paintSky`: a violet bloom over the
  middle of the skyline, teal to the right, a magenta hint at the left, low over the roofs — baked with the sky: no cost a frame); the
  PIER'S BULB STRINGS (festoons sagging lamp to lamp round the platform + down the pier, in the pier lamps' sprite); Rosie's bulbs a
  touch bigger; the WATERFRONT strip brighter (its windows + their bloom). The water reflects all of it.
- **THE EVERYDAY MOTION** (the owner's add-on; `core/harbor-show.js#everyday`, seeded by the night): one named sign SPELLS ON every
  ~70 s (dark, then its letters strike one by one), another BLINKS (soft off-on twice every ~45 s), one icon CYCLES its colour (pink →
  cyan → gold → violet, 7 s a colour, 2 s crossfades), one or two buildings run a SLOW CHASER (soft, 9 pt/s); the odd random flicker as
  before. Calm + sparse, tiers 1–2 (tier 0 is the still city). `harbor().daily`.

### 2b. DEPTH + REALISM (the owner's add-on — "the most important note": the skyline read as a flat backdrop)
- **THICKNESS + SHARPNESS BY DISTANCE** (`core/harbor-neon.js#DEPTH`, `depthStrength(o)`; every tube's weight, glow, brightness and
  crispness from its building's depth — four steps): NEAR (z < 252: the quay, the near band, the word towers' frames, the lighthouse)
  1.62 pt tubes, a 6.6 pt glow, full brightness, a crisp white glass core + highlight · MID (< 296: the landmark towers) 1.24 / 5.4 /
  0.92 (+ a little extra light: the hierarchy) · FAR (< 380: the middle tier + the mid band) 0.86 / 3.7 / 0.68, softer · DEEP (the
  far band, the glass towers) 0.58 / 2.5 / 0.44, soft (no white core, no highlight) and tinted toward the night haze (`HAZE`: aerial
  perspective). `tubes.js#drawLit({ soft })`. Tested: each step thinner, dimmer, softer; ≥ 3 steps on a phone; near band > landmarks
  > mid band > far band.
- **VARIETY OF TUBE:** on one building a bold main outline + finer fins, ledges and trims (`THIN` 0.52); every direction —
  vertical fins + pilasters, horizontal ledge bands + setback ledges, diagonal Deco chevrons + the crowns' pyramids, arcs + sunbursts.
- **COLOURS THROUGH THE NIGHT** (like City 1.0; `harbor-show.js#everyday` → `rotate`, `stages`; `nightStage(hour)`, `rotateMix(t)`):
  two or three buildings ROTATE their colour slowly (48 s: hold, an 8 s fade to a contrasting colour, hold, back); three or four
  CHANGE THEIR SCHEME as the night goes on — the evening in their own colours, LATE NIGHT (22–1 h) and THE SMALL HOURS (1 h →) each a
  colour of the night's palette, crossfaded over 20 s when the hour turns (the local hour: the light timeline); the colour-cycling
  icon (above). Calm, never busy; not during the party's show (it has its own colours); tier 1–2.
- **A BURNT-OUT LETTER** (`harbor-show.js#burnout`, `burnoutFlicker`): about once a month, for TWO days (the month's seed picks the
  start), one letter of one NAMED sign (a roof sign, the blade, PAR's — never the NEON logo) is dead: the letter cut out of the lit
  name (its dark glass shows from the housing), a weak sputter now and then (~once every 13 s, < 0.35); picked from the night's
  date, so every phone sees the same; then it's "repaired". `&force=burnout` previews it; `harbor().daily.burnout`. The letters'
  boxes: `signs.js` (`letterBoxes`).

### 3. THE PARTY SHOW (moved up from Part 10 — the owner's call) — `core/harbor-show.js` (PURE + tested), drawn by `neon.js`
- **The director** (`showFrame(cast, f, out)`): the cast = the outline items (`showItems`: kind, x, ledges, fins, crown, contour); per
  frame from the beat clock (`PT.bar`, `PT.phase`), the phase's `energy` + `name`: a SCENE (every 8 bars at the peak, 12 at the warm-up
  / after; it fades in over its first bar and out over its last) assigns EFFECTS to classes of buildings — `pulse` (the tubes swell on
  the beat, a RIPPLE across the screen), `sweep` (a COLOUR SWEEP rolls across the clusters: each building crossfades to its party
  colour, a contrasting one — `buildAlt`, built a few a frame), `call` (CALL-AND-RESPONSE: two teams of towers answer bar by bar),
  `climb` (the LEDGE BANDS light floor by floor up a tower and fall back), `fins` (the fins in a running wave), `chase` (the CHASERS
  round the WHOLE outline — one effect among many), `crowns` (crowns FLASH on the drops: a flare easing back). ~A quarter of the city
  holds steady in any scene (a different quarter each), never one effect everywhere.
- **It builds with the night:** WARM (20–22 h: `glow`, `sweep-slow`, `climb-slow`, `chase-heroes` — gentle, few effects, no
  searchlights) → PEAK (energy ≥ ~0.9: `ripple+climb`, `sweep+fins`, `call+chase`, `climb+crowns`, `sweep-back+chase`, `call+fins` +
  the searchlights + the wheel in party colours with its sparkle + the PARTY WINDOWS) → AFTER (`after-glow`, `after-sweep`,
  `after-climb`, the searchlights at half). PARTY WINDOWS (City 1.0's): ~1 lit window in 5 in a party colour, now and then a whole
  floor — baked with the light key (`lights.js`, `look.party`), re-baked once at the start + the end.
- **The drops:** every 8th bar at the peak (+ a firework's swell): the crowns flash; the BIGGEST every 32nd bar — the NEON word joins
  those only (`PT.big` → `title.js#partyFrame`: the sign's bloom + rings flare and ease back).
- **Never strobe-like** (tested: a step of 1/64 of a breath never moves a building's light by ≥ 0.12): soft envelopes everywhere, no
  full-screen flashes, no hard on/off; the wheel's sparkle is now a soft shimmer (also its own show's old hard sparkle).
- **Tiers:** tier 2 everything; tier 1 ≤ 5 live effects at once (`MAX_MOVING`); tier 0 no live effects — the whole neon breathes
  gently on the beat as one image (the same still picture). Reduced motion: a still party.
- **The API + hooks:** `harbor().show` / `__district.party().show` (`scene`, `moving`, `lights`, `sparkle`, `drop`, `big`, `peak`);
  `harbor().moment('show', name)` holds a scene (`&scene=climb%2Bcrowns` previews it on a party night or with `&force=neon-party`);
  **Part 10's hooks:** `f.finale` (the fireworks running: the show holds back to 40 %), `PT.drop` / `PT.big` (the moments to sync a
  shell to), `SHOW_SCENES` (add a `finale` scene list), the wheel's `scheme('party')`, the searchlights' `lights`.

### 4. The neon sounds, retuned → `docs/audio.md`
The warm-up and the dawn's stutters are SILENT (only the very last tube's dropout at dawn, softly); the lit sign's random flicker
plays a flicker (it had been silent: the local `neonTick` shadowed the import); THE CATCH plays the power-on and the hum FADES OUT over
the 10 s after the sign is fully on (`ambience.js#neonHumFade` — no hum all night); TAPPING THE SIGN plays the dropout (a letter going
dark) and the power-on + the fading hum (it lighting). All on the SFX bus (the Effects slider, Mute).

### Performance (A-B-B-A against 30d1229, 4× CPU, the laptop without a GPU, 402 × 874; ms of scene work a frame)
| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| `np-party` (Sat 23:00, the peak) | 8.70 → **7.85** | 6.97 → **6.65** | 4.05 → **4.37** |
| `np-night` | 7.50 → 7.65 | 6.14 → **6.48** | 4.16 → **4.07** |

(A-B-B-A means of two runs each.) The party peak got CHEAPER at tier 2 (the old chasers stroked every hero + word tower dashed, every
frame; the show runs a few chosen effects). Over the bench's budget: a night at tier 1 (+0.34, it was already 6.14) and the party at
tier 0 (+0.32: more neon items, the lighthouse + its mirror). ONE FIX: tonight's slow chasers on tier 2 only, the show planned once a
frame — re-measured: night t1 **6.32**, party t0 **4.40** (t2 8.23 / 7.64 in that run: the bench moves ±0.4 between runs). Frames held
16.7 ms (p50) everywhere. **After the depth add-on (2b)**, one reading: party 7.40 (it stepped 2 → 1 in the run) / 6.13 / 4.34, night
7.77 / 6.37 / 4.04; the E2E's party peak 7.68 / 6.30 / 4.59 (69 / 69 checks). Reported, not chased further — **the owner's iPhone decides** (`&debug=1`: tier, work, slow frames). Memory: the
party colour sprites (`buildAlt`) add ≈ the outlines' own (~2 MB at tier 2) once a party has swept them; the pier strings sit in the
pier lamps' sprite.

### Known issues (NEON PASS 3)
- The A-B-B-A round above was run BEFORE the depth add-on (2b): the near tubes are thicker now (bigger glow sprites — GPU fill), the
  far ones thinner; measured once after (below the table).
- **The wheel's quiet zone is large on a phone** (r ≈ 55 pt): the buildings behind it keep only their windows (the owner's rule: no
  neon, bands or signs behind the wheel) — the middle of the skyline reads by its windows + the coloured rooms + the city's glow.
- The band neon can only show where the band is visible: on a phone the near band's left third sits under the billboard, JAZZ and the
  AGENT roof sign, so its trims show mostly between them; the far band's slim towers carry most of the left side's colour.
- The everyday motion and the party's live effects are tier 1–2 only (tier 0 is the still city: one breathing image on a party night).
- The party windows re-bake the lit layers once when the party starts / ends (a 1.2 s crossfade); a page opened mid-party bakes plain
  windows first and swaps to party windows ~2.5 s later.
- The show's scenes follow the local beat clock (each phone's own bar count), so two phones side by side play different scenes.
- The recorded neon sounds' new timing was checked in code + by the E2E's counters, not by ear here — **check on the iPhone**.
- Not checked in WebKit (no WebKit here).

### Handoff → THE DAY PASS
The night look is done for now; the Day Pass (docs/harbor/plan.md) rebuilds the DAY: painted sign faces, the skyline lit by the real
sun, aerial depth, windows reflecting the sky, a real daytime sky, the water by day — night / dusk / party unchanged. The new neon
(every building's tubes, the lighthouse's) is unlit glass by day already (`neon.glass`: the near group's buildings; the lighthouse's +
the mid / far bands' unlit glass is NOT drawn by day — add it there if the day look wants it). Part 10 (party nights + fireworks): the
show's hooks above; the midnight finale is still `startFinale()` (4–6 shells) — stage the real one on `PT.drop` / `PT.big`.

## THE PREVIEW PANEL (Oct 22 2026) — the owner's test remote: JUST ME / EVERYONE ON CITY 2
The seed of Part 13's CITY CONTROL: every `&force=` preview, the party show's scenes, time, weather and the holiday looks from one
sheet on the owner's phone — on that phone only (JUST ME) or on every phone on `?city=2` at once (EVERYONE). City 1.0 never loads
or listens to any of it (the E2E checks: no `remote.js` request, no pill, no listener without the flag).

### Who sees what
- **Everyone on `?city=2`:** `title.js` imports `screens/harbor/remote.js` 1.5 s after the city starts (never in the title's first
  second). It listens to `city2/live` once Firebase is up (signed-in read; only the server writes it) and plays it.
- **The owner (an admin profile):** the module asks `/api/admin {action:'whoami'}` once (cached 6 h in sessionStorage) and, for an
  admin, adds a small **TEST pill** top left under the safe area (a 44 pt target, a dot: green = JUST ME on, pink = EVERYONE on;
  it steps under the `&debug=1` readout and under a dev slot's TEST SLOT tag). Tap → the glass bottom sheet (`css/harbor-remote.css`,
  loaded only then). The sheet is two thirds of the screen at most with a light veil, so the city stays in view above it.
- **On her iPhone:** open `https://neonspeakeasy.com/?city=2` with her own profile (the one in `ADMIN_PIDS`) → the TEST pill top left.

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
- `POST /api/admin { action: 'cityLive', state, mins? }` (ADMIN_PIDS only): `cleanRemote` (any drop → 400 `bad_state`; empty → 400
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

## NEON PASS 4 — THE NEON IN MOTION (Oct 22 2026): party nights a real show, every night stunning
The owner watched Neon Pass 3's party night on her iPhone and could not tell it was a party night. Her words: "In party mode the
neon needs to be racing around the tubes — motion, flashes, shimmer. It has to look impressive." Now a still of 11 pm Saturday
next to 11 pm Wednesday is clearly different at phone size, and the party moves (frame bursts, 402×874, the share of skyline
pixels changing > 24 between frames 250 ms apart: 402 — a normal night 5.4 %, the party at 9 pm 6.8 %, 11 pm 10.1 %, 1 am 8.1 %;
430 — 3.5 / 4.5 / 9.3 / 6.9 %).

### 1. THE PARTY (core/harbor-show.js — PURE + tested; drawn by neon.js)
- **THE PARTY SCHEME (every tier):** on a party night the outlines are re-lit in `SCHEMES.party` (magenta, hot pink, gold,
  electric blue, violet, lime — core/harbor-neon.js), rebuilt a few a frame LEFT → RIGHT (the colour rolls across the skyline as
  the party starts; hysteresis on 0.3 / off 0.15 of the party's strength). An explicit scheme (a holiday, a preview) wins
  (`neon.moment('scheme', name)` → `schemeX`). The city's glow over the skyline turns a warmer pink-violet (sky.js `o.party`,
  repainted when the party starts / ends — baked with the sky).
- **THE HARD BEAT** (`punchEnv(u, T)`, `beatOf(phase, rate, bpm)`): every beat PUNCHES — a ~50 ms attack (smoothstep; ≥ 40 ms,
  tested) to a clearly brighter peak, a ~140 ms decay; the downbeat (the first beat of a breath) ×1, the others ×0.72, a drop ×1.6.
  Between beats the tubes sit at ~0.8; on a downbeat at the peak they reach ~1.8 — the part over 1 is the sprite drawn again,
  additive (core + glow swell together). It ripples across the screen in the `ripple` scenes. Never dark (≥ 0.6, tested), never
  a hard on/off, no full-screen flash. No song playing: a party's 120 bpm inside the clock's slow breath. `PT.punch` (scene.js) is
  the city's punch for everything else that pulses: the signs + icons, the blade's bulbs, the wheel, the pier lamps, the string
  lights, the sky beams, and the title's rings + SPEAKEASY (title.js#partyFrame: opacity only — SPEAKEASY's new `.nd-word-p`
  glow layer, the rings' glow layer; the big bloom keeps its gentle level: re-compositing it every frame cost a slow phone 60 ms).
- **RACING LIGHT** (`out.race`, `neon.js#race`): pulses racing round the WHOLE outline of every hero + word tower, most mid
  buildings, half the bands, some of the quay — a dash pattern moving along pre-built paths (one Path2D per colour role a building):
  a soft coloured glow (tier 2), the coloured tail, a white-hot HEAD at the leading end; a pulse every ~38 pt; per-building speed
  (70–160 pt/s) + direction (`out.sp`, `out.dir`), a third reversing every two bars; the speed SURGES on the beat. The offset is
  integrated per building (a reversal never jumps). The lighthouse doesn't race (its own beam).
- **FLASHES:** the crowns + spires flare on the strong beats (every crown on a drop); a few towers STROBE colour-to-colour on the
  beat in `race+strobe` (a 60 ms crossfade; < 40 % of the city, tested).
- **SHIMMER** (`shimmerFx`): a band of glints rolls across the skyline every ~5 s, sparkling along the tubes it passes and lighting
  the crowns white-hot. The water mirrors all of it (its reflections dance with the colour for free).
- **SCENES:** WARM (glow, sweep-slow, climb-slow, chase-heroes), PEAK (ripple+climb, sweep+fins, call+chase, climb+crowns,
  sweep-back+chase, call+fins, **race+strobe** — new), AFTER — layered over the racing light; ~a quarter of the city holds steady
  in any scene; a scene runs 20–40 s at the song's rate (`SECS`; `f.rate`).
- **THE NIGHT** (`harborParty(h)` — the harbor's own curve; core/party.js's window, City 1.0's energy unchanged): 9 pm warm-up
  (energy 0.6, already clearly a party) → the 11 pm peak (1) → calming after 1 am (0.7) → the 2 am wind-down (core/party.js).
- **THE SKY BEAMS** (`screens/harbor/skybeams.js`, the owner's Luxor idea): on party nights the tall towers each shoot a
  stationary vertical beam from the crown, in that tower's colour (its sweep / strobe colour while one holds it — `neon.beamCols`):
  one cached white-hot-core beam sprite per colour (additive), a flare at the root; pulsing on the beat; brighter on a hazy night;
  switching on one by one from 9 pm, all from the peak; **taking turns with the searchlights** at the peak (the searchlights the last
  quarter of every 32 bars, the beams dimmed to 35 % meanwhile — `out.lights` / `out.beams`). The owner's rule: never across the
  NEON word or the tagline — a beam under the sign's width fades out by the tagline's bottom; a tower outside it rises to the top
  of the screen (clear of the corner buttons). Feasibility (measured): on a phone the towers under the sign have ~40–160 pt of sky,
  so a phone shows **2–3 beams** (the right word tower rises to the top; the left edge's tower on the widest phones); desktop 4–5
  (the side towers rise free). **Reusable:** `harbor().skyBeams.set({ count, colours, ids, width })` — July 4th's red / white / blue,
  the Sept 11 Tribute in Light (two white beams) later.
- **THE WHEEL** wears its party colours all party night (NEON PASS 3: the peak only); **Rosie** her party bulbs; the **pier lamps**
  punch; the **game blade's bulbs** run a marquee — a step every beat, one in three lit, punching.
- **Tiers:** tier 2 everything; tier 1 ≤ 5 effects + ≤ 6 racing at once (`MAX_RACE`), no glow pass on the racers, no shimmer;
  tier 0 (the calm city): no live effects — the whole neon (one image, the party scheme) punches on the beat (0.85 → ~1.3), the sky
  beams + the string lights + the wheel still. Reduced motion: a still party (the party scheme, still beams, warm-then-party colours).

### 2. EVERY NIGHT STUNNING (a normal night: calm but alive)
`everyday()`: one sign spells on, **one or two** blink, an icon cycles its colour, **three or four slow chasers** spread across the
skyline (the racing light's renderer, slow: one soft pulse every ~90 pt; tier 1 the first two), colours rotating + changing scheme
through the night, the odd flicker, and **a crown shimmer** every ~20 s (a white highlight running across one crown).

### 2b. STRING LIGHTS on the speakeasy's roof (`screens/harbor/strings.js`)
Round bulbs on gently sagging wires along THE SPEAKEASY's parapet (swags between its posts), a long swag up to the rooftop pole and
back, two loops draped down at the corner; warm white from dusk with a warm glow on the roof edge + the wall below; by day the
unlit glass. PARTY NIGHTS: amber, pink, red, gold, a little violet — cycling slowly at the warm-up, chasing on the beat at the peak
(every third bulb leading, punching); warm white again after the 2 am wind-down. **Reusable:** `createStrings()` +
`set({ scheme: 'warm'|'party'|'christmas'|'halloween' })` / `set({ colours })` — Part 8's promenade strings, Part 11's C9s.
`harbor().strings`; `&force=strings-party` previews the party mode.

### 2c. THE WHEEL reads clean without a veil
- **Quiet office blocks behind it** (`blocks.js#behindWheel`: further than the wheel, its middle inside the disc, its top above
  the hub): mostly dark at night — ~16 % of their windows lit, warm only (no coloured rooms, no party windows) — and a touch
  further back in the haze (their faces mixed into the haze as if 150 units further: lower contrast, never blurred).
- **A stronger wheel:** seven bulbs along each spoke (the spokes read as lines of light) + a brighter strut line, a bolder rim, a
  glowing hub medallion; on a party night the spoke bulbs CHASE OUTWARD from the hub on every beat, the rim sets step round on the
  beat, the whole wheel punching.

### Previews (THE PREVIEW PANEL lists them)
`&force=beams` (the sky beams on any night), `&force=strings-party`, `&scene=race%2Bstrobe`, PARTY ON / OFF; perf A/B switches
`&force=no-race,no-shimmer,no-punch,no-beams,no-strings`.

### The hooks for Part 10 (the fireworks + the midnight finale)
`PT.punch / PT.beatU / PT.beatT / PT.beatIdx / PT.beats` (the hard beat to sync a shell to — `__district.party()` shows them),
`PT.drop / PT.big` (the drops), `neon.show()` (`punch`, `beams`, `racing`, `shimmer`, …), `skyBeams.set` (a finale's colours),
`strings.set`, the wheel's `scheme`, `startFinale()` still the midnight's 4–6 shells; `f.finale` holds the show back to 40 %.

### 3. The fixes carried over
- **No sign clipped** (at 390–430 + desktop, every night — `harbor.test` "no sign is ever clipped", 6 sizes × 120 nights): the
  horizontal names ran ~8 % past their text box (`signs.js#lettersRow` sized letters by /0.86 instead of fitting their ink) — the
  last letter sat on the border tube, its glow reaching the screen edge. Now fitted inside the box. **The trade-off: horizontal sign
  letters are ~12–17 % smaller** (at 402: a 5-letter roof sign 9.0 pt, 6 letters 7.5 pt; were 10.5 / 8.8 while overflowing).
  A name at the screen's edge never SPELLS ON any more (its dark letters read as a sign cut off: `everyday` → `edge`); it may blink.
- **The game blade reads whole** ("THE GAME BLADE reads whole"): docked Rosie's stacks + bulb strings stood over its last letter
  (she now turns on arrival and rests bow-out, `core/harbor-boats.js`), the tug's stop moved 1 unit, the blade + n-par re-fitted
  (n-par's letters ~6.35 → 5.7 pt; the blade's six letters stay 10.15 pt); and the baked lit windows drew over the solid signs'
  cabinets — `signs.js#cabinetCut` now cuts every solid cabinet out of both lit layers (and their per-frame touches).
- **No seams in the water** (Part 4's Known issues has the detail): the ripple strips + the water's blit on whole device rows,
  each strip's crest / trough averaged over the phase it spans; an E2E check at tiers 2 + 1.
- **Searchlights behind signs** ("SEARCHLIGHTS BEHIND SIGNS", "… never sweep across a sign"): each light is clipped to the open air
  above everything nearer than it (buildings + sign cabinets; `searchlights.js#occludersAt / envelope / beamCover`), its flare only
  when its lens is in view; the EMPIRE's lamp on its lowest clear setback, word tower B's behind its roof sign, the hotel's sweep
  narrowed. The sky beams rise from ABOVE a roof sign on their tower (`neon.signRects()`), never through it.
- **The JAZZ sign removed:** the old club is plain city with band trims; its icon spot is now `i-mid` (x 97–117 × y 496–516 at 402,
  the only wall that passes every spot rule) — still 5 named + 7 icons, every game a sign every night.
- **The neon sounds** → `docs/audio.md` (flickers ~12 dB quieter, a 6 ms attack, a 4.5 kHz low-pass, a peak cap music on or off;
  power-on + dropout −6 dB; the warm-up's last 30 s audible, building to the catch).
- RUMRUNNER's lobby art: "CLUB VALE" → "CLUB 21".

### Performance (A-B-B-A against b57e6a7, 4× CPU, the laptop without a GPU, 402 × 874; ms of scene work a frame)
| scene | tier 2 (≤ 8) | tier 1 (≤ 6) | tier 0 (≤ 4) |
| --- | --- | --- | --- |
| `np-party` (Sat 23:00, the peak) | 8.07 → **8.57** | 6.40 → **8.79** | 4.60 → **4.86** |
| `np-night` | 7.63 → **8.02** | 6.53 → **7.11** | 4.14 → **4.72** |

While building, one piece at a time off (`n4-*` scenes in title-perf.mjs): the shimmer cost the most (~2.8 ms at tier 2 → its glints
capped, 28 a building, 80 a frame: ~1.3 ms); the racing light, the punch's second draw, the beams and the strings were each ≤ 0.4 ms.
**ONE FIX** after the round: the shimmer on tier 2 only, ≤ 6 racers at tier 1 — re-measured: party t2 8.2 → **8.24**, t1 7.01 →
**8.05**, t0 4.41 → **4.66**; frames held 16.7 ms (p50) everywhere. The E2E's party peak: 8.41 / 7.57 / 4.93 (its PERF check fails by
0.41 ms at tier 2 — reported, not chased: **the owner's iPhone decides**, `&debug=1` read after 10–15 s; it ran Neon Pass 3's party at
3.2–3.3 ms). Memory: the beam sprites (64 × 256 per colour, ≤ 24) + the strings' dots are small; the party scheme re-builds the
outline sprites once at the start + the end of a party (the same size as the city's).

### Known issues (NEON PASS 4)
- **The laptop bench is over its budgets on a party night** (above) — the iPhone's numbers decide; if her tier 2 shows slow frames
  on a party night, the next steps: the racers' glow pass off on tier 2 too, or racing on the hero + word towers only.
- **Phones show 2–3 sky beams** (the towers under the sign have ~40–160 pt of sky before the tagline, the owner's rule); 4–5 on the
  widest phones / desktop.
- **The steamer + the pier** wear party colours and punch on the beat, but don't run a moving marquee: Rosie's bulbs are baked into
  her sprite (a live chase = per-bulb drawing, Part 10 if wanted).
- **The lobby's backdrop** doesn't punch yet: City 2.0 has no `partyLight()` (Part 11), so the menus' still has no party layer.
- **The beat without music** is a party's 120 bpm on the clock (no song to lock to) — with the music playing it follows the song.
- **Sign letters are smaller** (the clipping fix, above) — check the glance test on her iPhone; the alternative is wider cabinets.
- The racing light's dash offset is per phone (two phones side by side race differently; the scenes, beams and beat are the same
  clock as before — the local beat clock).
- Not checked in WebKit (no WebKit here) — the owner's iPhone: the preview links below + `&debug=1`.

### Handoff → THE DAY PASS
The night is done for now: the party show's hooks (above) are Part 10's; the sky beams + the string lights are reusable for the
holidays (Part 11: `skyBeams.set`, `strings.set`). The Day Pass rebuilds the day; nothing here draws by day except the strings' unlit
glass and the wheel's steel (unchanged). Preview links (`?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`): a normal night
`2026-10-22T22:00`, the party `2026-10-24T21:00` / `T23:00` / `2026-10-25T01:00`, the boot-up `2026-10-19T18:20&speed=20`.

## NEON PASS 5 — SAFARI, THE REAL BEAT + THE PARTY POLISHED (Oct 22 2026; night + party nights only)
The owner checked Neon Pass 4 on her iPhone: "the pulsing looks pretty good", but her phone showed LESS than the Chromium screenshots
(one sky beam, nothing racing, the panel's SKY BEAMS button doing nothing), the beat felt off, the racing was far too fast and the
party was pink all night. Everything behind `?city=2`.

### 0. Faster harbor tests (nothing dropped)
`e2e-harbor.mjs` is GROUPS now: `core, flags, skyline, neon, water, harbor, sky, party, panel, dock, perf` — `ONLY=party,panel`
runs those in one process (a group may be several chunks, run in the file's order). With no `ONLY` the independent groups run in
**3 parallel shards** (`SHARDS=1|2|3`: child processes, each its own browser — the same checks), then the two that must run alone:
`panel` (it writes the shared `city2/live` node every `?city=2` page listens to) and `perf` (CPU-throttled timing). The fixed sleeps
became waits for the real condition (a re-layout settled, the neon lit, the word + the searchlights, the drones' formation — the drone
show runs on the clock, so `&speed=4` / `&speed=8` fly the same timeline faster —, the water's columns, the title ↔ setup cycles);
the timed windows (a frame-rate measurement, the beat sampled over 3 s) stay. **The whole suite: 223 s → ~190–200 s** on a far busier laptop (99 checks; it was 87): the
parallel part ~70 s for what ran ~130 s in a row, the panel ~50 s (five new checks), perf ~80–100 s (CPU-throttled: it can't share). While working: `ONLY=<the groups the task touches>`; the full suite once before the commit.

### 0a. What was wrong on her iPhone (Safari) — found + fixed
WebKit could not be installed here (Playwright's `webkit-2083` downloads, then its extraction fails — twice; the owner: stop and fix
what's known about Safari). So the cause was found from the code and reproduced in Chromium:
1. **THE TIER (the main one — "everything pulsing, nothing racing")**: the tier step-down watched only the frame INTERVAL. iOS Low
   Power Mode (and Safari in some states) runs `requestAnimationFrame` at 30 Hz however light the page is, so her frames read ~33 ms
   (> 19.5) and the city stepped 2 → 1 → 0 within ~10 s. Tier 0 drops the racing light, the effects and the glow — but keeps the punch:
   exactly what she saw. **Now a step down is a PROBE** (`scene.js#perf`): ~4 s later, if the median interval didn't get faster
   (≥ 85 % of before), it was the phone's cap — the city steps back up and stops stepping down for frame timing (`capped`); only a
   real overload of its own work (mean > 12 ms a frame) still steps it down. The readout says `capped 30 Hz`. E2E: `requestAnimationFrame`
   throttled to a 30 Hz vsync in the page → `2→1→2`, capped 30 Hz.
2. **ONE SKY BEAM**: Neon Pass 4 stopped a beam under the sign's width at the tagline, and dropped a tower with < 40 pt of sky there —
   on her phone that left the right edge's tower. **The whole-sky rule** (plan.md): every hero + word tower's beam rises BEHIND the
   NEON sign and the tagline to the top of the screen (the sign is the page above the canvas: it always draws on top), clear of the
   corner buttons only. The panel's SKY BEAMS button "did nothing" for the same reason (it couldn't add towers the layout had dropped).
   A desktop's dozen beams were capped at 9 at the peak (only the left half lit) — now all.
3. **A LEFTOVER JUST ME STATE** (kept for the tab in sessionStorage) replaced a preview link's own `&when` / `&force`: opening a link
   with its own preview flags (`&when, &force, &speed, &wx, &scene…`; not the tools `&debug` / `&grid`) now drops a stored JUST ME state
   — a refresh of the same page keeps it, as before (`performance.getEntriesByType('navigation')[0].type`). While JUST ME is on, the
   pill says so — `JUST ME · AURORA · PARTY ON · SAT 10/24 23:00` (ellipsis before the corner buttons) — with a 44 pt **✕** beside it.
4. **SAFARI-SAFE CANVAS** (`js/ui/canvas-safe.js`, the audit of every Harbor + reused district module): `ctx.filter` blur (the
   eclipse's corona sprite, the near rain streak) — Safari before 18 ignores it → `blurWorks()` tests it once by its pixels, the corona
   draws its soft streamers as three stacked strokes without it; `drawImage` with a source rect past the image (the banner's last slice
   ran 0.5 px past its panel; the water's mirror / column / texture reads could drift a fraction past their canvas) — older WebKit drew
   NOTHING → `blit()` clips the source rect and moves the destination to match; `getContext('2d')` returns null when iOS runs out of
   canvas memory → `ctx2d()` (the neon's sprites, the sky beams) never throws a frame. Not used anywhere in the Harbor: OffscreenCanvas,
   createImageBitmap, conic gradients, other canvas filters; composite modes used: `lighter`, `multiply`, `copy`, `destination-out`
   (all WebKit-safe).

### 0b. The sign names back to full size (the glance test)
Every named sign's letters ≥ 10 pt on every phone (tested: `harbor.test` "THE GLANCE TEST"), measured at 390 wide:
| sign | Neon Pass 4 | Neon Pass 5 |
| --- | --- | --- |
| the left roof sign (`n-roof`) | 4.0–7.2 pt (RUMRUNNER 4.0) | **11.3–13.7** |
| the word towers' roof signs (`n-roofA/B`) | 5.8–8.8 | **10.7–13.4** |
| the game blade (`n-blade`) | 9.8–10.5 | **10.4–10.5** (letters 0.93 of a row) |
| PAR's narrow name (`n-par`, 10.5 pt wide) | 5.5–6.2 | **removed** — six stacked letters can't reach 10 pt in the room between PAR's roof and docked Rosie |
The three roof signs are **STACKED** (`spot.stack`, `signs.js`): the game's mark centred on top, the NAME across the cabinet's whole
width under it, the border tube 0.55 pt in; they take names of ≤ 6 letters (SIGNAL, CIPHER, STAKES, AGENT, BLUFF, PULSE, PRISM) — the
long ones (RUMRUNNER, GRIDLOCK, SLIPSTREAM, OVERCLOCK, NEON PAR) hang as icons or on the billboard. **THE BILLBOARD** (the owner's worst
offender): 65 × 41 pt (was 66 × 32; its right edge can't move — the old club stands in front past it), the mark small in its top-left
corner, the NAME across the whole board in the condensed UI face (Chakra Petch 700: a long name still reads) — PULSE ~14 pt caps.
The small icon LEFT OF THE WHEEL (`i-mid`) is gone (the owner). So a phone hangs 4 named + 6 icons = 10 games a night; the billboard
advertises a game with no sign tonight; the nightly shuffle rotates which (tested: over the nights every game has its sign).

### 0c. The party, polished
- **THE BEAT FOLLOWS THE REAL MUSIC** → `docs/audio.md#the-beat` (the grid offline, the kicks heard live, the clock, half-time). The
  old BPMs were plainly wrong for many songs (no better than chance against the onsets) — the main reason the beat "felt off".
  `PT.bar` counts REAL bars now (4 beats on the downbeats: scenes, drops, the searchlights' turn, the racers' reversals land on bar
  lines); `PT.beatsF` (the continuous beat) drives the racing + the wheel; `PT.punchAt(s)` (the punch's last second) lets the show's
  ripple roll across the skyline from the real punch.
- **HALF-TIME + A LONGER DECAY**: the punch lands on beats 1 + 3 (the downbeat ×1, beat 3 ×0.72), nothing on 2 + 4; a 50 ms attack, a
  0.24 s decay (was 0.14) — it punches instead of flickering.
- **THE ROTATING PARTY PALETTE** (`core/harbor-show.js#PARTY_PAL`, `partyColours`): six bright main colours — electric blue, gold, red,
  green, violet, pink — + WHITE as an accent only (a white tower read as no colour under the white-hot racing heads); every building a
  [main, accent] pair by its place left → right (neighbours never share a main), a NEW pair every scene (20–40 s), crossfading in a
  SWEEP across the skyline over the scene's last fifth (left → right, then right → left); a colour sweep / a strobe flashes the next
  pair early. The palette starts from the local half-hour (a 9 pm and a 1 am visit differ). Sprites: a building's pair built a few a
  frame (`neon.js#partySprite` — the next scene's from the scene's start; only its cur + next kept). The sky beams, the racing light,
  the wheel and the glass towers' LED facades take the same colours; the city's glow over the skyline is blue-violet / gold / red
  (was a pink wash: `sky.js`). Tier 0 keeps the baked party scheme (rebalanced: the same seven colours). An explicit scheme (a
  holiday) wins.
- **THE RACING LIGHT, readable**: a few LONG pulses a border (2–7, one every ~130 pt), each a white-hot head (+ a halo), a long tail in
  the building's own colour, the brighter last third near the head, a soft glow (tier 2) — LOCKED TO THE BAR: the pattern moves one
  spacing a bar (~65 pt/s at 120 bpm, ≈ half Neon Pass 4's 108–158 pt/s), easing ahead on beats 1 + 3; a third reverse every two bars.
  The tubes under a racer sink to 0.68 so it reads as colour, not a white wash. EVERY hero + word tower races its whole border in every
  scene (never one of the quarter that holds steady) and is first in line on tier 1 (`cast.order`). E2E at 402×874, 11 pm: ~20–40 % of
  the skyline's pixels change between frames 250 ms apart (Neon Pass 4: 10 %).
- **SKY BEAMS** (`skybeams.js`): every hero + word tower (6 on a phone, a dozen on desktop), behind the sign to the top, in the tower's
  palette colour (changing with the show), punching on the beat (0.55 → 1.3); the warm-up switches them on one by one 9 → 11 pm.
- **THE WHEEL AS A SHOWPIECE** (`wheel.js`): bigger, brighter bulbs (a hotter core), a wider soft halo round the rim, warm-lit gondolas
  (14 of 16, a warm pool of light round each cabin), a stronger haze; its bulbs drawn ONE BY ONE into its cache (≤ 30 a second, never
  a frame): a normal night — a gentle colour wave travelling round the rim (gold, rose, ice in turn, ~14 s a lap), a slow sparkle, a
  spiral out from the hub every ~40 s; a party night — a routine every 4 bars on the beat in the palette: a rainbow chase round the rim,
  the spokes lighting like a CLOCK HAND, SPIRALS, BURSTS from the hub on beats 1 + 3 (a big one on the drops), the wheel punching. Tier
  0 + reduced motion: the baked still bulbs.
- **THE NEON LOGO PUNCHES** on party nights (`ui/logo.js#logoGlowSvg`, `title.js#partyFrame`): its light alone (two blurred glows + a
  core) over the sign, faded in on the beat by opacity only (≤ 0.8: gentler than the skyline, the word stays readable), on the letters
  that are lit; SPEAKEASY keeps its own punch.
- **THE TIRED TUBE ROTATES** (`core/harbor-show.js#tiredLetters`, `title.js#tiredTick`): the O always looked "off" — it had NO hot spots
  (all smooth curves; N and E have two bright bends each: `logo.js#letterLight` now takes a letter's gentle bends when it has < 2 sharp
  ones: the O gets four). The tired look (a weaker core, softer glow, no hot spots) is its own class now: none / one / two letters in a
  3-hour block of the local clock, never a letter the block before had, the same on every phone. **RANDOM FLICKERS**: any letter, never
  the same twice running, sometimes two at once, rarely a whole letter out for a second; the boot's long stutter on a random letter
  (always the O before); the dusk warm-up + the dawn dying were already shuffled per day (`neon-ramp.js`).
- **REMOVED**: the speakeasy's roof STRING LIGHTS (the owner: Parts 7–8 first — `STRINGS_ON = false`, the code a hook,
  `&force=strings-party` still previews them); the small icon left of the wheel.

### 1d. The preview panel's sky events + PARTY ON
- A forced plane waited 9 s after the last forced one (PLANES then PLANE ON APPROACH got nothing) and for a FREE lane; the geese + the
  heron waited for a free lane while the planes held both for half a minute → **a forced piece overrides the gates** (a preview switched
  on resets the wait; a lane anyway).
- The SATELLITE TRAIN flew ONCE a page load (`trainNight = 'forced'`) — by day invisible, where it burned its one go → it comes again 3 s
  after each pass, visible in any sky when forced; from the panel it also jumps the clock to DUSK (its twilight).
- A NIGHT-ONLY event (☾) or PARTY ON switched on BY DAY with no time picked jumps the clock to tonight (22:30) — PARTY ON now shows exactly
  what the party link shows (E2E: the same beams, the palette, the peak).
- The sky lanes sit behind the open sheet (sky-low ~330–410 pt on a 390×844 phone, the sheet from ~280 pt) → switching a sky piece on
  makes the sheet PEEK (a third of the screen for ~9 s; a touch on the sheet brings it back up).
- E2E: every sky piece fired through the panel appears within 6 s — by day: banner, skywriting, skytyping, helicopter, balloons, the
  festival, planes, the approach, geese, swifts, bats at dusk, the heron; at night: the satellite train, the drone show.

### Performance (A-B-B-A against b865eb0, 4× CPU, the laptop without a GPU, 402 × 874; ms of scene work a frame)
The laptop was heavily loaded all afternoon (the old code's own numbers came out ~5–8× this morning's), so only A vs B in the same
round means anything. Means of the two runs each:
| scene | tier 2 | tier 1 | tier 0 |
| --- | --- | --- | --- |
| `np-party` (Sat 23:00, the peak) | 64.7 → **92.9** | 44.5 → **36.2** (both stepped down mid-run) | 17.6 → **17.2** |
| `np-night` | 35.4 → **44.3** | ~24 → **31.2** (noisy: stepping) | 13.6 → **13.0** |

**ONE FIX** after the round: the wheel on a normal night draws its baked bulbs as the base and only the bulbs that differ (the wave, a
sparkle, the spiral) on top (~15 draws a refresh, not ~170), the faintest party bulbs skipped, only the brightest bloomed; the racing
light's wide glow only round the head's bright third. **Re-measured A → B:** night t2 36.9 → **26.6** (now cheaper than before this
pass), party t2 62.6 → **90.5** (still ~+45 %: the palette's crossfades, the longer racers on every tower, the wheel's party routines),
party t0 17.5 → **14.9**. Reported, not chased: **the owner's iPhone decides** (`&debug=1`, read after 10–15 s on a party night). If her
tier 2 shows slow frames there, the next steps: the racers' glow off at tier 2, the wheel's party refresh 30 → 20 a second, racing on
the hero + word towers only. Memory: the palette's pair sprites ≈ the outlines' own (~2–4 MB at tier 2, 2 pairs a building at most).

### Known issues (NEON PASS 5)
- **WebKit not run here**: the Playwright WebKit install fails on this machine (the zip downloads, the extraction fails — twice). The
  Safari fixes above come from the code + what's known about Safari, reproduced in Chromium (the 30 Hz tier probe). **The owner's
  iPhone check** (`&debug=1`): the readout's first line `t2 · dpr 2` (and `capped 30 Hz` in Low Power Mode — the tier must stay 2), the
  racing on every tower's border at 11 pm, six beams, the colours changing every ~half minute, the panel's chip + ✕.
- **The beat by ear**: checked by numbers (the grid vs the onsets offline; real songs in headless Chrome: 63–78 % of the heard kicks on
  the grid's beats), not by ear — **play music on the iPhone** at a party link. Bluetooth's delay is compensated only as far as the
  browser reports `outputLatency`.
- The MOOD MUSIC follows the real time (`audio/mood.js`): PARTY ON from the panel on a Thursday plays the day's mood songs — they have
  grids too, so the beat locks anyway.
- 10 of 12 games have a sign a night on a phone (the billboard an 11th); long names (≥ 7 letters) never get a named sign now.
- The E2E's RE-LAYOUT check now starts once its pixel holds steady for 8 frames (under load the stage was still settling after the
  first bakes when it began — never a blank frame; logged after two attempts at a deeper cause). PERF fails on the bench (as in Neon
  Pass 4); BATTERY passes alone but can drop under its 22 fps floor when the laptop is this loaded.
- The party moves a lot more (20–40 % of the skyline's pixels between frames 250 ms apart, was 10 %) — check it isn't too busy.
- The palette's warm half (red, violet, pink) next to each other reads pinkish for a scene; it changes in 20–40 s.

### Handoff → THE DAY PASS
The night + the party are done for now. The Day Pass rebuilds the day (plan.md); nothing here draws by day but the stacked roof signs'
unlit glass + the billboard's paint (their day faces are the Day Pass's — it uses the same sizes). Part 10 (fireworks + the finale):
`PT.bar` is real bars now (`PT.drop` / `PT.big` on bar lines), `PT.punchAt(s)`, `harbor().skyBeams.set`, the wheel's party routines
(`wheel.js#drawBulbs` — a finale routine is one more `mode`). Part 7–8: `STRINGS_ON` in scene.js. Preview links
(`?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`): a normal night `2026-10-22T22:00`, the party `2026-10-24T21:00` / `T23:00`
/ `2026-10-25T01:00`, the boot-up `2026-10-19T18:20&speed=20`.

## NEON PASS 6 — NIGHT TOUCH-UPS (Oct 22 2026; the owner's iPhone review of Neon Pass 5; night + party nights only)
The owner on Neon Pass 5: "it looks stunning, beautiful, I love the way it looks" — this pass is the careful clean-up of what she
found on her phone, plus her add-ons during the pass. Everything behind `?city=2` (the 10 s rest timer: both cities).

### 1. The touch-ups, as built
- **THE RACING FLOWS** (her phone: the lights "almost stop between pulses and jitter"): the party racers' SPEED came from the beat
  phase (`y + 0.12·sin 2πy` — down to a quarter speed between the strong beats) and followed every wobble of the beat clock. Now the
  speed comes from the TEMPO alone (one spacing a bar × the building's own pace, eased toward a new song's tempo over ~1 s),
  integrated with the frame's own dt (Low Power Mode's 30 Hz moves the same distance a second); THE BEAT drives only the light (the
  punch: brighter, a longer tail, a bigger head — the head stays put, the tail grows behind it). No reversals any more (a reversal is a
  stop): each building keeps its direction all night (`core/harbor-show.js`). E2E "THE RACING FLOWS": ~59 pt/s, steady through the
  beats. **The beat clock on iOS** (`audio/beat.js`): an `<audio>` element's `currentTime` can move in coarse steps there — the song's
  position is carried forward on the frame clock between its steps (`dequantize`), so the beat never jerks back and forth with them.
- **THE BEAT READOUT SAYS WHY** (her readout said "beat calm" at a party): `&debug=1` shows `beat calm — music off` / `— muted` /
  `— tap for sound` (audio still locked) / `— classic music` / `— songs loading` / `— no song`; with a song, `· kick unheard` when the
  AnalyserNode hears nothing (Safari's media routing) — the grid still locks then. "calm" with the music off is right.
- **THE SKY BEAMS — kept exactly as Neon Pass 5** (the owner loved them; a soft-volumetric rebuild was tried and reverted on her
  word). Two fixes only: the beam's BOTTOM no longer ends on a sharp horizontal line — its last 16 pt come from a FOOT sprite (the
  beam's bottom row fading out downward, smoothstep) that melts into the crown (`skybeams.js#footFor`); and the far-right beam (under
  the music + menu buttons) rises to the top like the others, BEHIND the buttons (the canvas is under the page: they stay on top and
  tappable) — checked at 390 / 402 / 430.
- **THE WHEEL'S GLOW HUGS THE RIM** (was "too much of a ring"): the stacked flat-alpha strokes (hard-edged bands out to ±0.13 r) and the
  haze sprite (linear stops out to 1.5 r) are one smooth curve now — `wheel.js#rimGlow`: a radial gradient peaking AT the bulbs,
  falling fast inside, a little slower outside, gone ~0.1 r out (the haze ~0.3 r, drawn at 1.3 r); the fine bright rim line stays.
- **THE BLOCKS BEHIND THE WHEEL** (a dark blob at phone size): lifted to a dusky violet-blue at night, each its own tone
  (`blocks.js#wheelBackdrop`, five tones), a fine RIM LIGHT of city glow along every roofline + setback (each tier draws its own top),
  ~1 window in 12 warm-lit on the light timeline (`lights.js`), and rooftop SILHOUETTES over the rim — a wooden water tank, an
  antenna, a shed (one or two a roof), their tops catching the rim light. Still no neon or signs behind the wheel.
- **THE TINY FLOATING ICONS ARE GONE** (the owner: "distracting"): all six icon spots (`i-par`, `i-par2`, `i-left`, `i-c1`, `i-r1`,
  `i-r2`). A phone hangs 4 NAMED signs (the three stacked roof signs + the blade) and THE BILLBOARD a fifth game (a game with no sign
  tonight: `core/harbor-neon.js#billboardPick`, pure now); the nightly shuffle rotates them — tested: over 120 nights every game shows
  (the 5 long names — RUMRUNNER, GRIDLOCK, SLIPSTREAM, OVERCLOCK, NEON PAR — only ever on the billboard; the 7 short ones on both).
  The waterfront strip's shop shapes at the water's edge stay. Nothing cycles its colour on a normal night any more (that was an icon).
- **THE LIGHTHOUSE'S CALM ZONE** (pink trims read as floating rectangles crowding it): the buildings right behind it (±30 pt round
  the tower, deeper than it) keep only a quiet white roofline, dimmer (`strength: farband`) — no outline boxes, bands or fins; that
  was mostly PAR's own pink frame. The heroes + word towers rise clear above it and keep their neon.
- **NEON THAT TRACES THE 3D BUILDING**: every building with a visible side face (left of the camera: its right face; right: its left)
  traces it — the side's top edge back from the front corner (the roofline across both faces) + its far vertical edge down (to the foot,
  or to where the tier below hides it); towers per tier group, the bands' outlines + their rooflines too (`harbor-neon.js#sideFace`,
  `#sideFloor`: a neighbour just in front of the side face hides its lower part; < 1.6 pt wide: not traced). Joins the racing paths.
- **LEDGE BANDS ON THE LEDGES**: every horizontal band snaps to a real FLOOR LINE of the building's window grid — the spandrel between
  two rows of windows (`floorY`), or its cornice — and every fin to a PIER between two columns (`pierX`); two that land on the same
  line become one. Never across glass.
- **THE NEON LOGO RACES** (party nights, every ~40–70 s on a bar line) **+ AT THE CATCH + ON A RE-IGNITE** (the owner's add-on: the
  catch at dusk and a tapped letter re-igniting at night — riding on top: the catch's timing, the power-on sound and the hum fade
  untouched): a bright surge runs N → E → O → N along the real tubes and through the blacked-out connectors between them (dim there:
  behind the painted tube), each letter BLAZING fully on as it passes, then a quick sweep across SPEAKEASY letter by letter. Built for
  the compositor (`ui/logo.js#logoRaceSvg`, `title.js#raceLogo`): one small svg per letter holding its blaze (blurred once, faded by
  the svg's opacity), a head + a 14-dot comet tail of gradient circles (no filter) moved by transform along `logoTrack()`, nine glow
  spans over SPEAKEASY (opacity). Nothing runs between races. Reduced effects / motion: none. Preview: `&force=race` (every 6 s).
  E2E "THE NEON LOGO RACES"; the catch checked on the boot link (`&speed=20`: the surge ~0.2 s after the catch), a tap at night too.
- **THE LIGHTHOUSE ON PARTY NIGHTS**: the beam brighter (+60 %) and a little wider (+32 %), the lantern +30 %; 4 bars in every 16 it
  picks up the party colour (the right word tower's palette colour, eased in + out, 85 % mixed).
- **THE CROWNS UNDER THE RIGHT-HAND ROOF SIGNS** (the owner's add-on: "a dark, empty chunk between the neon and the sign"): a real bug —
  while a re-layout's new set of signs + outlines was being built, the old set kept drawing, and `neon.js#solidRects` cut the OLD
  signs' cabinets out of the NEW outlines' sprites. A phone's safe areas re-lay the city once after the first paint (the signs move
  ~20 pt), so on her iPhone the crown's tube under SIGNAL / BLUFF / CIPHER / STAKES was cut away (party nights rebuild the sprites
  later — that's why the party showed it). An item of the set being built now takes ITS signs. + the roof sign SPILLS a soft glow of
  its colour down over its steel frame onto the roof steps (`neon.js#spillSprite`, one cached sprite a sign), so the frame reads as
  structure; the top floors keep their lit windows.
- **THE SCREEN AT REST: 10 s** (was 15) before the menu, the tagline and the corner buttons fade — both cities (`title.js#IDLE_MS`,
  docs/title.md); the fade and tap-to-return unchanged.

### Previews (THE PREVIEW PANEL lists the existing ones)
`&force=race` (the logo race every 6 s), PARTY ON (the lighthouse's party beam, the racing), `&debug=1` (the beat's reason).

### Performance (A-B-B-A against eff24bd, 4× CPU, the laptop without a GPU, 402 × 874; ms of scene work a frame, means of two runs)
| scene | tier 2 | tier 1 | tier 0 |
| --- | --- | --- | --- |
| `np-night` | 9.17 → **7.85** | 7.06 → **6.57** | 4.32 → **4.15** |
| `np-party` (Sat 23:00) | 26.9 → **21.8 / 12.6** (stepping) | stepped to t0 in both | 5.23 → **5.21** |
The re-measure of the party alone: t2 A 21.8 / (stepped) → B 26.8 / 29.4 (~+25 % in that round; the baseline itself dropped to tier
0 once), t0 5.0 → 5.0. Reported, not chased (the brief): the new costs are small and mostly baked (the backdrop, the outlines' side
tubes, a foot + a spill sprite a beam / sign, the lighthouse's wider fans); **the owner's iPhone decides** (`&debug=1`, after 10–15 s).

### Known issues (NEON PASS 6)
- **WebKit still not run here**: `npx playwright install webkit` downloads webkit-2083 and then leaves nothing installed (a third
  time) — the owner's iPhone: the links below.
- **The E2E's PERF check fails on the bench** (as in Neon Passes 4 + 5), and the perf group then hits a puppeteer "Promise was
  collected" protocol error — the same on the baseline (eff24bd) on this loaded laptop: not this pass's.
- The beat on her iPhone was checked from the code (the readout now says why it's calm); "kick unheard" with a song playing would mean
  Safari's media element isn't reaching the analyser — the grid still locks.
- The rooftop silhouettes behind the wheel are small at phone size (~4–6 pt; their roofs sit near the wheel's top rim) — they read
  as texture on the skyline more than as objects.
- A side face narrower than 1.6 pt isn't traced (near the middle of the screen the side faces vanish in the perspective).
- The lighthouse's own neon wears the party palette on party nights (as in Neon Pass 5).

### Handoff → THE DAY PASS
The night is done for now. For the Day Pass: the stacked roof signs + the blade + the billboard are the only signs (no icon faces to
paint), the side-face tubes + the backdrop behind the wheel are night-only (`T.night`), the logo race needs the sign steady + lit (never
by day). Preview links (`?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`): a normal night `2026-10-22T22:00`, the party
`2026-10-24T21:00` / `T23:00`, the boot-up + the catch's race `2026-10-19T18:20&speed=20`, the logo race any night `&force=race`.

## THE DAY PASS (Oct 22 2026) — the city by daylight, from the skyline down to the water (behind `?city=2`)
The owner's iPhone review (Oct 21): by night the city is getting there, but BY DAY — high noon especially — "it looks pretty rough",
and the signs in the back were hard to read. The bar: the daytime city as premium as the night (a sunlit 1920s Art Deco harbor
like a crafted travel poster), checked side by side with the night at 402×874. The night, dusk and the party look as before
(pixel-diffed: only the two night touch-ups below + the new clouds change a night frame). Out of scope (later parts): the
promenade and its life (Part 8), the speakeasy's building (Part 7), snow + seasons (Part 9).

### 0. Two night touch-ups (+ the owner's add-ons)
- **BEHIND THE WHEEL, FOUR VERSIONS TO PICK FROM** (C1.5: **the owner picked d** — it is the only one now, live for everyone; a / b / c
  and the `&wheelbg` flag are gone. As built then: **a** more warm windows lit (~1 in 6: every window may light there, not only the ones its building's
  dice allow; `lights.js`), **b** the buildings a step lighter + bluer (`blocks.js#wheelBackdrop`: the tones mixed 55 % toward a
  dusky blue, +0.2 of the lift; windows as Neon Pass 6), **c** a little of each (~1 in 9 windows, half the lift), **d** (the owner's
  add-on) ARCHITECTURAL FLOODLIGHTING — a warm uplight washing up each building's stone from its foot (`blocks.js#floodWash`: one
  smooth gradient scaled to the building's whole height — its feet stand behind the near band, so the light reads on the part we
  see and the top ~15 % sinks into the night), drawn UNDER the panes so the windows stay dark shut rectangles, no lit windows, no
  rim light, no points. The wheel stays the brightest thing in every version; still no neon or signs behind it.
- **THE DARK CORNER** (bottom right, right of the lighthouse: the near band's `near24`, dark since its icon went in Neon Pass 6):
  `core/harbor-neon.js#lhEdgeBlocks` frees the near blocks that reach into the lighthouse's calm zone but stand mostly clear of the
  tower (their middle outside ±30 pt) — a warm roofline + ONE ledge band on a floor line (`bandNeon` kind `roofledge`, the right
  district's warm pairings; nothing boxy behind the tower) and most of their windows lit (`cam.lhLit` → `lights.js`: lit share ≥ 0.86).
  Its BAR storefront at the water's edge was already there. Tested on the four phones (the freed block stands clear of the tower).

### 1. Signs by day — painted, vintage 1920s (`signs.js`)
- **THE PAINTED FACES** (`DAY_PAINT`, `dayPaint()`): real neon is nearly invisible in sunlight, so every board reads UNLIT — enamel /
  hand-painted, each game its own scheme from its colours (SIGNAL cream on deep red, STAKES gold on black, AGENT white on navy, BLUFF
  red on cream, CIPHER cream on bottle green, PULSE gold on plum, PRISM white on peacock blue, NEON PAR cream on teal, RUMRUNNER gold on
  oxblood, OVERCLOCK black on orange, GRIDLOCK cream on royal blue, SLIPSTREAM navy on amber), a touch sun-faded toward warm paper.
  The letters ARE the tube alphabet's own strokes, painted thick right under the tubes (`paintStrokes`: a drop shadow down + away
  from the sun, a gold-leaf / dark keyline, the solid letter, the sun along its top edge) — the same word by day and by night, so a
  sign never changes at dusk; a painted pinstripe + a fine keyline inside the board's edge. The glass rides on top as a faint pale
  line (`drawGlass({ onPaint })`), its electrode caps + clips faded by day. Baked with the housing (per look key), weighted by the
  day's share: the night's dark cabinet is unchanged. Tested: every game's letters ≥ 4.5 : 1 on their board.
- **THE GAME BLADE** by day: its inner panel the game's paint, the bulbs' frame a darker band of it.
- **THE BILLBOARD** by day is a **painted poster** (`buildBillboard#poster`): the board in the game's enamel, a Deco sunburst behind
  its mark painted big (keyline + shadow), a rule line, the NAME across the whole board under it — a bold image + a big word, no
  small text (a game's board never shows its tag line any more, night included — the RUMRUNNER board's small text is gone).
- **THE NIGHTLY PICK BY DAY**: the boundary moved from noon to **5 am** (`nightKey`): the day shows TONIGHT's pick, so a sign never
  swaps game at dusk; and within a visit the pick never changes while anything of a sign shows (`neon.night(k, painted)`: never by
  day; a re-layout keeps the first key) — a new pick comes with the next visit.
- **GHOST SIGNS** (optional in the brief): not built — the mid buildings' brick walls are 3–6 pt wide at phone size; a faded ad there
  reads as a smudge, never as lettering. Part 7's big one on the speakeasy's wall is the place for it.

### 2. The skyline by daylight (`tones.js`, `blocks.js`)
- **THE SUN'S SIDE IS CONTINUOUS BY DAY** (`sunLook`): it was −1 / 0 / +1 — at noon 0 ("straight behind": no lit side at all, the flat
  look the owner saw). Now, with the sun up, −1..1 in fifths (a noon sun a gentle ±0.4 from the side it's on; a low one ±1 as
  before); with the sun down the old values exactly (the night + dusk unchanged). The height in ~8° steps by day. Tested: ≤ 24 look
  changes over a day's sun (a new key every ~30–60 min; each bake is chunked over frames + crossfaded in 1.2 s — never a jump).
- **LIGHT + SHADOW**: the day's materials richer (the day channel only — golden hour, dusk and night keep theirs): the stone a touch
  more saturated and, near, warmed by the sun; the sunlit side bright + warm; the SHADE cool and blue (the sky lights it); the front
  turns from a warm sunny edge to a cool shaded one (stronger), a crisp bright arris down the corner toward the sun; cornices + setback
  ledges catch a bright line on top with a cool shadow band under; the cast shadows cooler + a touch stronger.
- **DEPTH**: the day haze bluer (`DAY.haze`), the far buildings dissolve into it a little more by day — pale + blue far, warm + crisp
  near. The blocks behind the wheel by day only +50 deeper (the night's +150 washed them to a pale grey).
- **WINDOWS BY DAY** (`blocks.js#dayPanes`): the glass mirrors the sky down the whole facade (lighter high, darker low), each pane's
  top catching a little more; ~15 % blinds half down (cream, the odd green), ~4 % windows open (the dark room), the odd sun glint on
  the sunny half. **GLASS TOWERS**: the sky deeper at the top + clouds drifting in the glass (soft reflections).
- **THE DAY SKY** (`tones.js#harborSky`, painted by `sky.js`): the shared palette's day sky (City 1.0's, untouched) is a soft
  grey-blue; the Harbor paints a deep azure overhead fading to a pale, luminous horizon, blended in by the day's share (dawn, golden
  hour and the night keep the palette's), greyed by the real cloud cover. The glass + the water mirror the same stops.
- **THE SUN BY DAY** (`district/sun.js`, `createSun({ look: 'harbor' })` — City 1.0 calls `createSun()` and is byte-for-byte as before):
  `sunColorHarbor` — white-hot overhead, golden → orange → red low; a little more squashed at the horizon (the look only, never the
  arch's fit); by day a faint wide halo (~18 r), a big soft bloom (~6.5 r), a hot inner glare, and a disc with no visible edge (a white
  core burning out to a soft coloured rim) — a low sun keeps the crisp coloured disc (crossfaded 10° → 24°).

### 1b. THE CLOUDS (the owner's add-on) — `screens/harbor/clouds.js`, one system for every hour
**(Superseded by DT2 — the clouds were rebuilt: real kinds, perspective, per-pixel volumes; see `## DT2` below. Kept for the history.)**
City 2.0 used City 1.0's cloud art; the Harbor now has its own (`district/weather-fx.js` still runs only the lightning on the Harbor —
called with no cloud on a storm). Driven by the REAL cover (`LK.cloud`: the live weather or the seeded day) + the REAL wind (speed +
direction), drifting slowly (reduced motion: still). A fair day 1–3 cumulus (+ on ~60 % of days high wispy CIRRUS); cloudy up to ~8
bigger ones + low STRATUS banks; overcast a seamless DECK across the top of the sky (its soft underside, its texture) with a few low
fragments under it. Cumulus: a broad flat base growing one big dome (sometimes a second), lobes round its top; lit for the hour from
the real sun's side (`cloudLight`): by day sunlit white tops + soft blue-grey shaded bellies + fine lobe rims; a low sun lights them
from the side + below (gold lobes toward it, a dusky mauve shade, a gold → pink → red underlight brightest on the sun's side); after
sunset pink + red bellies under darkening tops; at night barely there, faintly lit from below by the city's violet glow (the party's
blue-violet on a party night). Placed in the sky band only (the safe top → the skyline, so a low one peeks from behind the towers),
behind the NEON sign (the page draws over the canvas), never over the dock, and never behind the white SPEAKEASY word / the tagline
(a cloud that would span their band moves above it or down behind the skyline). A wide screen: the same sizes, more of them. The
moon glows through a cloud in front of it; `coverAt()` feeds `sun.through`. **PART 9 PLUGS IN**: `KINDS` (the shape builders —
cumulus, stratus; add nimbus, fog banks …) and `harbor().clouds.set({ grey, dark, base })` (greys / darkens / lowers the whole sky for
rain, storms, snow; re-lit at once). Cost: the shapes bake once per light key, 2 a frame (`BAKE` 1.6 px per pt: soft but not blurry);
a frame is one drawImage a cloud. Memory: 0.1–0.8 MB on a phone (overcast with the deck 2.7 MB), desktop ~5.8 MB.

### 3. The water by day (`water.js`)
A deeper blue-green harbor (`TINT.day`), the far grazing water taking the real sky's blue near the horizon; the crests carry the
real sky's colour (`bakeTex`, keyed on it by day only); a stronger mirror by day (`fres` + the depth fall-off lifted by `T.day` — the
wheel, Rosie, the lighthouse and the sunlit city read in the water; golden hour + night unchanged) with the wavelets a touch quieter;
**THE DAY GLITTER PATH** — a high sun (≥ 12°) lays a narrow white trail of sparkle on the water under it toward us (`glitter()` with
day colours; `stats.paths` says `daypath`); the existing low-sun gold path, the moon's and the glints unchanged.

### 4. The day's motion (`screens/harbor/dayfx.js`)
**FLAGS** on a few roofs (the hero blocks + the tallest near roofs clear of the wheel, the signs and the lighthouse: 2 on a phone, 4
on desktop), vintage pennant colours, stirring in the REAL wind — limp in a calm, out straight in a gale, flying downwind, a ripple
running along the cloth with its folds shaded. **SUN GLINTS** on glass: a pane on a tower's sunny side now and then flashes (a soft
star, ~a second; ≤ 18 panes with nothing nearer in front, re-placed when the sun changes side; tier 1+). Both by daylight only (gone
below a 1° sun — dusk and the night never see them); `&force=no-dayfx` turns them off. The water's glints, the clouds, the gulls
are the rest of the day's life.

### 5. THE TIRED TUBE, now the only imperfection (the owner's bug: "the O is permanently dimmer / fuzzier")
- **What was the O's own** (`ui/logo.js#premiumBits`): its two electrodes sit 10 units apart at its foot, so their two shade spots
  overlapped into one dark patch across the whole bottom of the letter. Electrodes that close now share ONE spot of the usual size.
- **The rotation** (`core/harbor-show.js#tiredLetters`) is now the logo's ONLY imperfection — about every **3 hours** (the owner's
  call, after a 20–40 min try): none ~30 %, one ~55 %, two ~15 %, any letter, never a letter the block before had, every phone the
  same. `title.js` checks again 1.2 s after mount (the first check could come before the scene's clock: nothing showed for 30 s).
  **Preview: `&force=tired&letter=N|E|O|N2`** (a comma list too: `N,N2`) holds that letter tired.
- **The O without its white core — FOUND + FIXED (C1.5, review-2.md §2):** not a paint glitch — the holiday O's CSS rule
  (`.ndl-3 .ndl-core[style] { stroke: var(--c) }`) matched the empty `style=""` the flutter left on the plain O (it cleared
  `style.opacity` instead of removing the attribute), so the O lost its core for the rest of the visit once the flutter landed on
  it. Now the rule needs the swapped O (`[data-kind]`) and has fallbacks, and the flutter is a class (`is-flut`).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, afternoon `T16:00`, golden hour `T18:20`, a cloudy day `T13:00&wx=clouds`, overcast
`T13:00&wx=overcast`, a night `T22:00`; the tired letter `…T22:00&force=tired&letter=O` (N, E, O, N2). Shots: `shots.mjs --scenes
d-morn,d-noon,d-aft,d-golden,d-clouds,d-overcast,d-night,d-party --crop skyl3,skym,skyr3` (the thirds of the skyline: new crops).

### Performance (A-B-B-A against c8ef52d, 4× CPU, the laptop without a GPU, 402 × 874; ms of scene work a frame, means of two runs)
| scene | tier 2 | tier 1 | tier 0 |
| --- | --- | --- | --- |
| `np-day` | 5.84 → **6.11** | 4.68 → **5.26** | 3.47 → **3.75** |
| `np-clouds` (new: a cloudy day) | 5.78 → **6.36** | 4.72 → **5.04** | 3.56 → **3.96** |
| `np-golden` | 7.83 → **7.67** | 6.28 → **6.96** | 4.47 → **4.45** |
| `np-night` | 8.24 → **8.18** | 6.72 → **6.88** | 4.17 → **4.18** |
Frames 16.7 ms everywhere. The day's new costs are small (the clouds' drawImages, the day path, the flags + glints); the night is
the same. Memory: 35.7 of 64 MB at 402×874 tier 2 (the clouds ≤ 2.7 MB of it).

### Known issues (THE DAY PASS)
- **WebKit still not run here** (not installed: Playwright's WebKit install fails on this machine). **The owner's iPhone check:** the
  painted signs readable at a glance (SIGNAL / BLUFF / AGENT / STAKES / the billboard), the clouds' edges soft but not blurry, the sun
  at noon a white glare without a visible edge, the flags moving. (The O + the wheel's backdrop: done in C1.5.)
- Ghost signs not built (§1). The flags are small at phone size (~6 × 4 pt: texture, not objects).
- The cloud layout re-rolls every 6 hours of the local clock (a fresh sky a few times a day); a visit across the boundary sees the
  clouds re-placed once (they fade in).
- ~~The E2E's `PERF` check still fails on this bench~~ — C1.5: the work is a warning now (the gate is the relative A/B).

### Handoff → Part 6b (the special-occasion sky)
The day is done for now. For 6b: the sky's art lives in `harbor/` (`clouds.js` for any cloud the special sky needs — a storm front, a
skywriter's smoke against them, `harbor().clouds.set`), `createSun({ look: 'harbor' })` for the eclipse's sun; the day's motion in
`dayfx.js`. Part 7: the speakeasy's wall is the place for the big GHOST SIGN; Part 8: the promenade's day look; Part 9: storm / rain /
fog / snow skies plug into `clouds.js` (`KINDS`, `set({ grey, dark, base })`); Part 10: holiday flags can join `dayfx.js`'s flags
(their colours are a table). (The owner picked `&wheelbg` d — C1.5 made it the only one.)

## CLEANUP C1.5 — CLEANUP + SPEED (Oct 22 2026; the fixes from review #2 — no visual change)
The source of every item: `docs/harbor/review-2.md` (Fable's audit). **Proved unchanged** with `tests/integration/pixdiff.mjs`
against the commit before at 402×874 (A with `&wheelbg=d`, the owner's pick): a normal night, the party at 23:00, noon, golden
hour, Halloween + St Patrick's (the swapped O) — nothing beyond the run-to-run noise (night: 297 px = 0.009 % next to the windows
that switch at random; noon / golden: one 3×6 pt spot under the noise; party, Halloween, St Patrick's: 0 px); the party as 8 moving
frames 250 ms apart side by side: the same punch, beams, wheel and neon. The O only differs in time: it no longer loses its core.

### 1. The O's white core (review §2)
The holiday O's rules (`css/title.css`) now need the swapped O (`.ndl-3[data-kind] …`, set by `title.js#swapO`) and fall back to
the logo's own pinks; the flutter (`title.js#premiumLogo`) adds / removes a class (`.ndl-core.is-flut`, opacity 0.8 — it outranks
the tired core as the inline style did), never `core.style`. E2E (`neon` group): the flutter forced onto the O → every core keeps
its stroke and no `style` attribute; a stray `style=""` on the plain O keeps the core; the Halloween + St Patrick's O keep their
colours.

### 2. The wheel's backdrop: d, for everyone
The owner's pick — ARCHITECTURAL FLOODLIGHTING (`blocks.js#floodWash` under dark panes, the dusky violet-blue tones, no rim light,
no lit windows behind the wheel) — is the only version; a / b / c, their rim light + roof silhouettes, the window injection and the
`&wheelbg` flag are gone (scene.js, blocks.js, lights.js, the docs). The roof accent + more floodlights are the Day touch-up's.

### 3. THE SAFARI FLOOR
- **The games + City 1.0 still parse on old iOS:** the top-level `await` in `title.js` is gone — `harborReady` (a promise; a failed
  load falls back to City 1.0) and `harborPending()`; `app.js` keeps the title on the boot screen until it settles (a few ms;
  `title-preview.html` awaits it). `tests/safari-floor.test.mjs` parses every module in `js/` as a classic script (imports /
  exports stripped): a top-level `await` anywhere fails the unit suite.
- **The Harbor's floor is iOS 16 / Safari 16** (the owner's decision): `roundRect` (~35 calls) and `Array.prototype.at` stay;
  `color-mix()` in the party glow degrades gracefully before 16.2; `ctx.filter` only behind `blurWorks()` (Safari < 18 has none).
- **Out of canvas memory never freezes the city:** every Harbor `getContext` goes through `canvas-safe.js#safeCtx` (a unit test
  forbids a raw call under `js/screens/harbor/`): a refused context returns a stand-in that draws nothing (the layer comes out
  blank) and counts the miss — the scene steps its tier down (≤ once per 2 s) to free memory. A frame that throws anyway is
  caught: logged once, 3 in a row step the tier down, 30 in a row stop the loop on the last good frame (a later `start()` — the
  page shown again — tries again).
- Risky on older iPhones (written down, not changed): the frost pane (a full-screen canvas while it freezes), the rainbow's 4–5
  bakes, the skywriting layer — together ~15 MB of transients outside `memAll()` (review §1c; the readout under-reports them).

### 4. THE SPEED GATE + THE PHONE'S READOUT
- **THE GATE IS A RELATIVE A/B IN ONE RUN** (the owner's decision): `node title-perf.mjs "<browser>" --city 2 --ab
  http://localhost:5174 --scenes np-night,np-party` (A = a `git worktree` of the commit before on :5174, B = the working tree on
  :5173). Both pages load once; the one being measured comes to the front so the other is hidden and its city stops (CDP's
  "frozen" state can't be used: a thawed page stays hidden in headless Chrome); A B B A A B windows (`--pairs`, the same 2 s
  warm-up), each started only on a settled city (no bake, crossfade or tier probe, the tier asked for) and thrown away if the
  tier moved during it. Measured with a `requestAnimationFrame` wrapper installed before the page's scripts (works on any commit):
  the frame intervals and the rAF callbacks' work per frame (+ the scene's own `cost()`). Verdict per tier: `SLOWER (frame
  pacing)` when B's slow share is > 2 points worse, beyond the windows' spread and with p95 10 % worse; `SLOWER (work)` when
  > 0.5 ms, > 10 % and beyond the spread; else `same` / `faster`; exit 1 on SLOWER. The absolute budgets (8 / 6 / 4 ms) print as
  WARNINGS. `--vs <scene>` measures a flag's cost on one server. Model the device: tier 2 = `--cpu 1–2` (a party night at 4×
  without a GPU steps itself down: setTier pins only against stepping up), tier 0 = 4×.
- **This laptop's limits, measured:** headless Chrome without a GPU is raster-bound on a party night — frames 33–100 ms at 4×
  and ~57 % slow even at 1× on BOTH commits, the tier probing down on its own. So: the party's tier 0 and the night's every tier
  are A/B-able here; the party's tier 2 is the phone's call. The E2E's `perf` group reports the numbers as warnings (its check:
  it measured), and reads MEMORY at tier 0 (the party stepped the tier between its two readings: a flaky check before).
- **THE SESSION on `&debug=1`:** a new readout line — `session 2.4% slow · 87 of 3605 in 61 s · run 3 · max 52 ms`: every rAF
  interval since the city first showed (a hidden page doesn't count), how many ran over 20 ms (a missed vsync at 60 Hz), the
  longest run of them in a row, the longest frame. One honest number after a minute (the 1.5 s line above it flickers). Also
  `scene.session()` for tests.

### 5. The party's fill (review §1b) — what was cheaper without a look change, and what wasn't
- **THE SKY BEAMS** (§1b-3): the sprite's shape (each pixel's alpha + its run to white — the beam is linear in its colour) is
  computed once; a new colour is a few multiplies a pixel (no `Math.pow`), the foot comes from the same table (no `getImageData`
  readback), the cache drops its oldest of 40 instead of wiping all 24. The same pixels (pixdiff), the rebuild during a colour
  sweep a fraction of before.
- **THE WATER'S BUILD** (§1b-2): the 10 Hz mirror build never starts on a punch frame (the neon's punch > 0.2) — it waits ≤ 160 ms
  from the last build (the mirror is 0–95 ms old anyway): the two heaviest things of a party frame no longer land on one frame.
- **THE PUNCH** (§1b-1): **not changed — no cheaper draw gives the same pixels.** The punch is `dst + a·sprite` for a > 1 (two
  additive draws: 1, then a − 1); one draw can't exceed alpha 1, and a pre-brightened sprite saturates in the tube's bright body
  (it would dim the decay frames). On this laptop its second draw measured within the noise (`--vs n4-punch`, 1×: −0.36 ms,
  noise ±3); the live water (−2.65 ms) and the beams' fill (−2.09 ms) weigh more here. **Her iPhone decides** with the flags
  below; if `no-punch` alone drops the session's slow share to 0–3 %, the options (each a small look change — her call): punch
  with alpha at tier 2 (the tier-0 way: dimmer between beats instead of brighter on them), or punch only the outlines.

PERF (A/B in one run, against 61e4764, 402×874, A B B A A B × 4 s, the laptop without a GPU):
| scene · tier · CPU | A (before): frame p95 · slow · work mean | B (C1.5) | verdict |
| --- | --- | --- | --- |
| `np-night` t2 · 2× | 17.1 ms · 0 % · 2.26 ms | 17.0 · 0 % · 2.32 | same (noise ±2.3 ms) |
| `np-night` t1 · 2× | 17.1 · 0 % · 1.99 | 16.8 · 0 % · 1.92 | same |
| `np-night` t0 · 4× | 16.9 · 0.4 % · 5.45 | 17.0 · 0.4 % · 5.49 | same |
| `np-party` t0 · 4× | 33.4 · 47 % · 16.48 | 33.4 · 53 % · 16.19 | same (noise ±24 pts: raster-bound here) |
| `np-day` t2 · 2× | 16.8 · 0 % · 1.89 | 16.8 · 0 % · 1.83 | same |
| `np-day` t1 · 2× | 16.8 · 0 % · 2.99 | 16.8 · 0 % · 2.68 | same |
At 4× the night's + the day's tiers 2 / 1 probed down mid-window on BOTH commits that afternoon (thrown away, as designed); the
party's tier 2 is raster-bound here (above). The fill fixes (the beams' rebuild, the water off punch frames) don't show in these
means — they are spikes during colour sweeps and on punch frames: the owner's SESSION line on her iPhone is their measure.

### 6. Two foundations (no visible change today)
- **ONE "HOW DARK IS IT" INPUT** (`core/harbor-dark.js`, PURE + tested): `darkness({ sky, cloud, storm, eclipse })` — the sky
  model's darkness (palette.js `P.dark`: the real sun through City 1.0's light timeline) plus terms that only darken (all 0 today:
  `DARK_TERMS`), computed with the palette (`DK` in scene.js) and read by every lighting decision through a NAMED RAMP (`litK(DK,
  name)`: `water` 0.15+0.5, `neon` 0.2+0.5, `city` 0.25+0.5, `lamps` 0.3+0.45, `strings` 0.3+0.4, `logo` / `glow` 0.3+0.5, `beams`
  0.35+0.4 — each exactly the old threshold, unit-tested), `windowsNight` (the light key's switch) and `isNight` (the sign caught,
  tier 0's calm). `harbor().dark` shows it. **For the Day touch-up:** the blue-hour staggered power-up is a per-light stagger over
  these ramps. **For Part 9:** turn on `storm` / `cloud` (from `clouds.set({ dark })` + the real cover) and a storm afternoon lights
  the city. Still on the tone weights (`T.night`, the light's colour, baked per look key) and not routed yet — the Day touch-up
  moves them with the power-up: the street lamps + the stop lights' glow (scene.js), the floodlights / the wheel's backdrop / the
  crowns (blocks.js, baked), the wheel's + the boats' own night looks.
- **THE SIGN-DIM HOOK** (depth rule 2; `core/harbor-signdim.js`, PURE + tested): `harbor().dimSign(id, { logo, tag, ms })` asks
  (defaults: the logo to 0.35, the tagline gone, 1.2 s), `dimSign(id, null)` lets go; several asks resolve to the dimmest; the last
  one gone brings the sign back. `scene.signDim()` reads it; `title.js#applySignDim` turns it into `--sd-logo` (opacity on the
  logo's wrapper + SPEAKEASY's letters — nothing else writes those) and `nd-tag-sky` + `--sd-tag` (the tagline), transitioned over
  `--sd-ms` (opacity only). E2E: dims to 0.3 / 0.3 / 0 and comes back to 1. **Unused until Part 6b** (the drones, skywriting,
  skytyping, the banner plane call it). The older `holdTag` (the drone show's tagline step-aside) stays until 6b moves it here.

### 7. Tidy-ups
UFO + THE MOON CAT hidden in the panel (`ready: false` in `core/harbor-remote.js#EVENTS`; `PANEL_EVENTS`; the ids stay valid);
LIGHTNING's hint "with WEATHER = STORM"; playwright reverted (tests/integration/package.json); dead code gone (`STRENGTH`,
`boatSpeed`, `LIT_GROUPS`, `skyPos` + `fs.skyPos`); the searchlights' warm-up (`beamK`) per 60 Hz frame (it ran at half speed at
30 Hz — Low Power Mode). `title-perf.mjs` rewritten (above), `pixdiff.mjs` new.

**Left for later (visual, or a later part's — review list B):** the stars' DPR + `memAll()` telling the truth (§1c: the merge at
tier 1 / 0 — touches the look, measure first: C2), `core/mathx.js` + `glowDot` (C4 / C8: the next part touching ≥ 5 files),
`core/harbor-tiers.js` + named fades (C5 / C7), splitting scene.js / neon.js / harbor-neon.js / harbor-layout.js (C9: the first step
of the part that next touches each), the pair sprites without `shadowBlur` + the pump's per-job budget + one searchlight draw
(§1b-4 / 5: Part 10), the water's columns K on a party (a look change), a messages lane over the sign (D3: 6b), the hooks E2E +
clouds / day E2E + a `blit` unit test (T3: Part 9), seasons in the tones (Part 9), one party switch (C11: Part 10), the seeded
everyday sky + the beat seed (C13: Part 11), 44 pt pads on the eggs (D4: Part 12), a profanity filter + a rate bucket on
`/api/admin` (A1 / A2: Part 13), the BATTERY + RE-LAYOUT probes made condition-based (T2), a harbor CI job (T6).

### Tests (C1.5)
The unit suite 463 (+ `safari-floor.test.mjs`: no top-level await, no raw `getContext` in the Harbor, `safeCtx`; `harbor.test`: the
darkness input = the old thresholds, the sign-dim hook, the panel's hidden rows); e2e-harbor 100 checks (+ the O's core, the holiday
O, the sign-dim hook; `perf` = warnings + MEMORY at tier 0) — the emulators now run here (the project's JRE on the PATH:
docs/testing.md); rules 45, `/api` 20, the smoke test 14 / 14, e2e-title `gate,neon` 35 / 35; City 1.0 pixel-diffed against the
commit before: noon 0 px, the night's only change its blade signs' timed rotation (the old commit against itself: the same).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
A normal night `2026-10-22T22:00`; the party `2026-10-24T23:00`, then the same with `&force=no-punch`, `no-water`, `no-beams`,
`no-clouds` — read the readout's SESSION line after a minute each (music on); the one that drops it most names the cost; noon
`2026-10-22T12:30`.

### Known issues (C1.5)
- **The punch's second draw is unchanged** (§5): the owner's iPhone with `&force=no-punch` decides whether to trade a little of
  the look for it.
- **The party's tier 2 can't be A/B'd on this laptop** (headless, no GPU: raster-bound, it steps itself down at 1× too); its
  tier 0 and the night can. WebKit still can't run here.
- The everyday sky's pieces still spawn on `Math.random` (planes, satellites, birds): `pixdiff` turns them off for its stills.

### Handoff → THE DAY TOUCH-UP (DT)
Build the blue-hour staggered power-up on `core/harbor-dark.js` (the ramps; move the `T.night` gates listed in §6 onto it), the
wheel's roof accent + floodlit buildings on top of the d backdrop (`blocks.js#floodWash`), and prove each look with `pixdiff.mjs`
(night unchanged) + the A/B gate (`title-perf.mjs --ab`). 6b: call `harbor().dimSign()` from the message pieces.

## DT1 — THE LIGHTS + SIGNS PASS (Oct 23 2026; Day touch-up part 1 — the blue-hour power-up, floodlights, the signs rethink; behind `?city=2`)
The owner's notes (plan.md DAY TOUCH-UP (4), (5), (5b)–(5c), (6)): the city shouldn't light up in golden hour; more floodlight for
depth; one-word signs like "STAKES" tell nobody anything; the billboard floats and goes grey at night; the tagline is hard to read
over the moon; load hitches cost a tier. **Proved with `pixdiff.mjs`** against the commit before (a Thursday night at 402×874):
the change is only where this pass meant it — the signs (the left roof sign gone, the slot rule's names, the blade), the billboard,
the wheel backdrop's accent, the lit wall right of the lighthouse; noon and City 1.0 (noon 0 px; its night only its blades' timed
rotation, the old noise) unchanged. **This pass supersedes "City 1.0's light timeline is kept exactly" for the Harbor** (the
evening's order + its golden-hour half-lit windows); the small hours' thinning and the kitchens before dawn are still City 1.0's.

### 1. THE BLUE-HOUR POWER-UP (`core/harbor-dark.js`, PURE + tested; on the ONE darkness input)
- **Why nothing could stagger before:** the sky model's darkness (palette.js `P.dark`) sat FLAT at 0.35 from +5° to −4° (golden
  hour's own value) — the neon at 30 %, half the windows lit, all through golden hour. **THE DUSK CURVE** (`DUSK`, `duskDark(el)`):
  the Harbor's darkness now follows the real sun's elevation — 0 by day, ~0.06 at +4° (the billboard's lamps), 0.2 at sunset
  (−0.8°), 0.9 at the end of the blue hour (−7°, ~30–35 min at 43° N), 1 at −12°; the same curve at dawn. `darkness({ sky, el,
  cloud, storm, eclipse })` takes the elevation (ALWAYS NIGHT passes none: the sky model's 1); Part 9's storm term still darkens it.
- **THE POWER-UP:** `power(k)` = 0 at sunset → 1 at −7°. Every light has its place in it (`powerOrder(nightKey, items)`, seeded by
  the date): the OUTLINES follow tonight's SWEEP (left → right, right → left, the centre out, the edges in — `SWEEPS`) with a
  little scatter, so neighbouring buildings (a band's 3-block cluster is one item) light close together — CLUSTER BY CLUSTER; the
  SIGNS land one by one anywhere in their stage (`STAGE.signs` 0.04–0.72, `STAGE.neon` 0.06–0.84); each switches with its own
  sputter (neon.js#powerTick — the title's per-sign plan is no longer used by the Harbor; the NEON logo keeps its own timing). The
  morning: the same thresholds in reverse (the last on is the first off). Tested: never all at once (≥ 15 separate moments in the
  blue hour), a different order each night, nothing in golden hour, everything by night.
- **THE RAMPS re-cut for the curve** (`LIT`): `bill` (the billboard's lamps, the first light ~+4°), `lamps` (street lamps, stop
  lights' glow, quay + pier lamps, the waterfront strip, the wheel's + boats' lights — around sunset; the street lamps + stop
  lights moved off the tone weights), `logo`, `beams` (the lighthouse from sunset), `water`, `city`, `neon`, `glow`, `strings`,
  `flood` (new: THE FLOODLIGHTS fade up mid blue hour, baked in sixths — `T.flood`, blocks.js#floodK). Every ramp is full by 0.9,
  so the night looks exactly as before. `partyReady(k)`: a party night powers up first, then the show warms up as before.
- **THE WINDOWS** (`windowShare`, `windowBias`, `windowThreshold`; lights.js): golden hour ~5 % of the windows (a few — the LOWER
  floors first: a window lights when its order ≤ share^(1 + bias·(1 − low))), the blue hour → every window by its end; capped by
  City 1.0's timeline (P.win, golden hour's half counted whole) so the small hours still thin. Monotonic: through the power-up a
  window only comes on. At night the bias is 0 — City 1.0's order exactly. ("The sunlit faces show gold reflections" — Part 2.)
- **THE BLUE HOUR'S SKY + TONES** (`tones.js#blueHour`, `harborWeights`; palette.js `LOOKS.blue` — City 1.0's weights never carry
  it): the sky model turns from golden hour to night only by −14°, so the power-up ran against a salmon sky. The Harbor's look
  passes through a BLUE look (deep luminous blue overhead, softer low, a cool city glow, the first stars) — in from sunset to −4°,
  held to −7°, out by −12° (the same at dawn); the facades take the night's tones meanwhile (silhouettes against the blue, their
  windows + neon coming on). Golden hour and the night unchanged.
- **Previews:** the panel's TIME = POWER-UP (sunset − 28 min) / POWER-DOWN (sunrise − 52 min) at SPEED 20;
  `&when=2026-10-22T18:20&speed=20`, `&when=2026-10-23T07:30&speed=20`. `harbor().power` (0..1), `.powerUp` (tonight's sweep, the
  items on, each item's place), `.lamps`.

### 2. FLOODLIGHTS (`blocks.js`, baked; in the power-up, never by day)
- **THE WHEEL BACKDROP'S NEON ROOF ACCENT** (`core/harbor-neon.js` item `wheel-accent`): one fine GOLD Deco roofline on each floodlit
  near block behind the wheel (the cornice + a short step at each end), the only tubes allowed behind the wheel's disc — a thinner
  tube, a soft glow at 42 % (strength `accent`), never in the party's racing light or effects: calmer than the wheel.
- **BEHIND THE LIGHTHOUSE** (`behindLighthouse`, `cam.lhWall`): a warm uplight on the brick of the near + mid blocks standing behind
  the tower (a touch softer than the wheel's backdrop), laid over the finished face additively so it reads on the brick and the
  glass alike; the windows untouched (their own layer). **The beam brightens the wall** (`lighthouse.js#wall`): where the beam
  pointing away from us meets the wall, a soft warm patch slides across it, under the tower.
- **THE UPLIT LANDMARKS** (`UPLIT`, our picks): the EMPIRE (cool white), the SUNBURST (gold), the right edge's middle-tier tower
  (warm) — uplight washes up their shafts from the visible foot, each against the darker far towers.
- **THE WATERFRONT ROW** (`&force=flood-front`, off by default — the owner compares): the near band's front buildings get a low warm
  uplight on their bottom third, uneven (0.38–0.8 of full, ~1 in 5 dark), dimmer than the wheel's backdrop; the water mirrors it.
- (All washes start at the VISIBLE foot — the ground floor + the storefront strip hide the real one: drawn from the real foot they
  were invisible.)

### 3. THE SIGNS RETHINK (`core/harbor-neon.js` SPOTS + THE SLOT RULE, `signs.js`)
- **THE LEFT ROOF-SIGN SLOT IS GONE** (`n-roof`): the EMPIRE behind it shows whole — its full outline, fins, ledges and windows
  (nothing was keyed to the spot: the cut, the lit-window cut-out and the outlines follow). **3 named signs a night + the
  billboard**: the blade, the two right roof signs.
- **THE FULL NAMES** (`signs.js#signName`, `SIGN_NAMES`): HIGH STAKES, DOUBLE AGENT, NEON PAR always whole; the rest their one-word
  city names (SIGNAL, CIPHER, BLUFF, PRISM, PULSE, OVERCLOCK, GRIDLOCK, SLIPSTREAM, RUMRUNNER — the names the owner lists as
  one-word). **THE SLOT RULE** (`fitsSpot`): the blade one word ≤ 6 letters (the glance test: ≥ 10 pt letters), a roof sign one
  word ≤ 6 or TWO words each ≤ 6 STACKED on two lines (the same letter height, no mark — the mark would push them under 10 pt),
  the billboard any name on one line. OVERCLOCK / GRIDLOCK / SLIPSTREAM / RUMRUNNER fit no named sign at a readable size (9–10
  letters: ~7 pt on the blade) — they take the BILLBOARD. **THE WEEK'S ROTATION** (`assignSigns`, `billboardPick`): each calendar
  week a new seeded order rotated night by night through the spots (the blade first), the long single words on the billboard on
  the week's first nights — tested: every game shows every week; no cut-down name ever, at 390 / 402 / 430, 120 nights.
- **THE ROOF SIGNS' STEEL** (`frameGeom`, `roofFrame`, `frameLight`): heavier lattice legs + lacing, X braces, a CATWALK (a plank deck
  past both ends) with a thin RAILING (posts, a top + a mid rail) under each cabinet; at night the same steel drawn in the sign's
  own light (with its spill) so the frame reads as built. Size kept.
- **THE BLADE**, bolder: thicker, whiter letter tubes (lh × 0.17, a touch more glow); its marquee bulbs bigger (a socket ring + a
  glass bulb by day; lit dots 1.75–2.8 pt with a white-hot heart), the unlit ones warmer, spaced 4.1 pt.
- **THE BILLBOARD** (`buildBillboard`): ONE poster by day and night — the game's mark at top centre on a Deco sunburst, the FULL NAME
  across it in a condensed sign-writer's hand (80 % width; no tag line), a moulded frame; **BUILT**: it stands ON the roof of the
  near block behind it — those blocks are lowered so their roof lands 9 ref pt under the board (`core/harbor-layout.js#BILLBOARD`;
  their old roofs were hidden behind the board) — on three A-frames + X braces, a CATWALK along its foot with a thin RAILING and a
  ladder (Part 8's billposter climbs it), galvanised steel in the sun by day, dark at night. **How many billboards: ONE** (`bb-left`,
  phones; a wide screen drops it — its panorama blades carry the games).
- Tests: the slot rule, the full names at three sizes, every game every week, the glance test per spot, the billboard on its roof
  at three sizes; e2e: 3 named + the billboard.

### 4. THE BILLBOARD'S LAMPS (`signs.js#gooseneckLamps`, `drawGooseneck`, `lampLightMap`, `lampGlows` — reusable: Part 7's ghost ad)
FOUR 1920s gooseneck lamps over the top edge, two each side of the mark (the conduit, the arched neck, an enamelled shade) —
hardware all day. Warm incandescent (~2700 K, `LAMP_C`). ON from late golden hour (`LIT.bill`, ~+4°: the first light of the
power-up — a warm pool down the poster, brightest at the top, a faint cone under each shade), a DIM WASH once the neon is up
(`LAMP_DIM` 0.5 — M3: 0.1, the whole board lit all night, #m3-fix-pass — judged side by side with off / full: off is the old dull dark board, full competes; the wash reads as a lamp-lit
poster beside the neon), on again at dawn until a little after sunrise, off by day. The board item switches with them (its
sputter). Hooks: `harbor().moment('lamps', 0 | 1 | null)` (Part 7's raid, the TR-3B's drain); `&force=lamps-on` / `lamps-off`.

### 5. THE THIN GLASS TOWER (`glassL`)
A FINE full outline every night (up both edges from the foot, over the roof — the glass towers' contour, ice white; deep: thin + dim),
3–4 seeded LIT FLOORS down the glass (lights.js), its LED facade's soft glow as before; on a party night its outline joins the show
and it gets A SKY BEAM (`skybeams.js`: thinner + fainter than the others, ice-white with a touch of the colour sweep — the row's
gap filled). It stays the calmest tower.

### 6. THE SIGN'S DARK HALO + THE MOON (title.css `.nd-c2`, scene.js#signHalo / tagMoonDim)
A soft dark halo hugging each letter, always on: the TAGLINE by CSS (stacked text-shadows; stronger with the sun / moon right behind
it), the NEON word's tubes + SPEAKEASY's letters painted on the sky behind the sign (one cached sprite of the letters, blurred —
`blurWorks()` or a shadow on Safari < 18; the LIVE rects: `textRects.neon` + the new `textRects.glyphs`). Dark on the dark night
sky (invisible), it shows only where something bright sits behind — the moon, the day sky, a beam. Never a box. THE MOON dims
~27 % while its disc sits in the tagline's band (eased ~1 s). `&force=no-halo` turns both off (the comparison). City 1.0's sign
untouched (`.nd-c2` is City 2.0's root class).

### 7. Small fixes
- **LOAD HITCHES NEVER COST A TIER** (scene.js#perf): nothing steps for `TIER_GRACE` 8 s after the city shows, and the first window
  judged after it holds no frame from before (the owner's 2→1→2 at load — a probe there could even read the hitch as a capped
  phone). THE SESSION line now has a twin: `after 10 s …` (the same count from 10 s after the city showed — the honest one).
- **THE `&debug=1` READOUT** moved to the BOTTOM: just above the dock, over the promenade, full width minus the 16 pt gutters, a
  dark translucent box (canvas: taps pass through), long lines cut with "…" — checked at 390 / 402 / 430.
- The panel: a LIGHTS group (WATERFRONT FLOODLIGHTS, BILLBOARD LAMPS ON / OFF, SIGN HALO OFF) + TIME = POWER-UP / POWER-DOWN.
- `shots.mjs`: a custom crop's file is named by it (`-c0x420x150x140`); `e2e-smoke.mjs`: `GAMES=cipher` (the one-game smoke check).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Golden hour `2026-10-22T18:20`; the power-up `…T18:20&speed=20`; a normal night `T22:00`; the party `2026-10-24T23:00`; the waterfront
flag `T22:00&force=flood-front`; dawn `2026-10-23T07:30&speed=20`; noon `T12:30`; the moon behind the tagline `T22:00` (and
`&force=no-halo` to compare). Shots: `shots.mjs --scenes d-golden,d-night,d-party,d-noon --crop skyl3,skym,skyr3`.

### Performance
PERF (A/B in one run, `title-perf.mjs --ab` against 673d4ac, 402×874, 4× CPU, the laptop without a GPU, 3 + 3 windows of 5 s):
| scene · tier | A (before): frame p95 · slow · work mean | B (DT1) | verdict |
| --- | --- | --- | --- |
| `np-night` t2 | 16.8 ms · 0 % · 6.26 ms | 17.1 · 0 % · 4.19 | same (noise ±3.2 ms) |
| `np-night` t1 | 17.4 · 0 % · 3.37 | 17.3 · 0 % · 3.47 | same |
| `np-night` t0 | 17.2 · 0 % · 2.12 | 17.1 · 0 % · 3.44 | same (noise ±1.4 ms) |
| `np-party` t1 | 16.8 · 0 % · 7.51 | 16.8 · 0 % · 7.40 | same |
| `np-party` t0 | 17.2 · 0 % · 4.67 | 17.2 · 0 % · 4.73 | same |
| `np-golden` t2 | 17.1 · 0 % · 4.97 | 17.2 · 0 % · 3.49 | same |
| `np-golden` t1 | 17.3 · 0 % · 3.23 | 17.4 · 0 % · 2.92 | same |
| `np-golden` t0 | 17.1 · 0 % · 4.93 | 17.2 · 0 % · 3.11 | faster (no neon in golden hour now) |
The party's tier 2 stepped itself down on BOTH commits here (raster-bound without a GPU, as in C1.5) — the owner's `&debug=1`
SESSION line (now with its `after 10 s` twin) is its measure. The budget warnings (party t1 > 6 ms, t0 > 4 ms) are the same on
both commits. New per-frame costs are small: the halo (one drawImage), the wall glow (≤ 2 drawImages), the billboard's light
(its sprite, as before), the glass tower's beam (one more sprite on a party night).

### Known issues (DT1)
- **WebKit still can't run here** — the owner's iPhone: the halo's blur (`blurWorks()` / the shadow fallback), the lamps, the readout.
- The long single-word names (OVERCLOCK, GRIDLOCK, SLIPSTREAM, RUMRUNNER) only ever hang on the billboard on a phone (the blade
  and the roof signs can't show them ≥ 10 pt): each gets the board once a week. The owner listed OVERCLOCK among the blade's names —
  it doesn't fit readably; her call if a bigger slot is wanted.
- The waterfront row is behind `&force=flood-front` until the owner decides; the uplit landmarks are our picks (EMPIRE, sunburst,
  m-right) — easy to change (`blocks.js#UPLIT`).
- The billboard's tiny steel (the A-frames are ~9 pt tall) reads as a frame, not as detail, at phone size — enough to stand it.
- The facades' blue-hour tones step in sixths (a crossfaded re-bake each); the dawn's last step to day (~sunrise) is a visible
  change over its 1.2 s crossfade, as before.

### Handoff → DAY TOUCH-UP PART 2 (DT2 — the day look) — done, below
The day itself is next: real clouds (`clouds.js` — a full rework), stronger sunlit / shaded faces, windows less grid-like (the sunlit
faces' GOLD REFLECTIONS in golden hour belong there — `blocks.js#dayPanes`). The light logic is done: every light reads `DK` through
a ramp or the power-up (`core/harbor-dark.js`); Part 9's storm afternoons only need `DARK_TERMS.storm` / `cloud` turned on.

## DT2 — THE DAY LOOK (Oct 23 2026; Day touch-up part 2 — real clouds, sunlit 3D buildings, windows; behind `?city=2`)
The owner's iPhone review of the Day Pass: the buildings read solid but "we're going to need more polish passes", and THE CLOUDS
NEEDED A LOT OF WORK (cartoon bubbles in rows with flat bottoms). The bar: the day as premium as the night, reviewed DAY next to
NIGHT at 402×874. **Proved with `pixdiff.mjs`** against the commit before: the night, the party, the blue hour and golden hour are
unchanged except where the clouds are (`night-nc`, `party-nc`, `dusk-nc`, `golden-nc` — the same looks with `&force=no-clouds`:
0–1 px beyond the noise; the blue hour's ~300 px are its power-up's randomly timed sputters, the A-A noise of a moving frame).
Run overnight, unattended — the decisions made on the way are listed at the end of this section.

### 1. THE CLOUDS — a full rework (`core/harbor-clouds.js` PURE + tested; `screens/harbor/clouds.js` bakes + draws)
- **THE KINDS FROM THE REAL WEATHER** (`cloudMix`): fair-weather CUMULUS (humilis → mediocris → congestus by the cover + the
  day's seed), STRATOCUMULUS patches on a greyer day, ALTOCUMULUS (a mid layer of small cells), high CIRRUS, the OVERCAST deck,
  SCUD (low dark fragments under it); several mix. **`/api/sky` now asks Open-Meteo for the cover by height** (`cloud_cover_low /
  _mid / _high` → `weather.js#layersOf` → `LK.cloudLayers { lo, mid, hi }`): with it the kinds follow the real sky (high cover =
  cirrus, mid = altocumulus, low = cumulus → patches → the deck); without it (the seeded day, `&wx=` previews) they come from the
  total cover. Rain / snow / a storm: always a deck.
- **PERSPECTIVE, NEVER ROWS** (`cloudPlan`): the clouds stand on a cloud field seen from below — the near (high) ones big, toward
  the horizon smaller, flatter + closer together, fading into the haze; in CLUSTERS whose centres spread through the depth (one
  near, one in the middle, one far …), most clouds near a centre, some alone; a far one often has a half-merged neighbour.
  **The row rule**: a cloud is moved elsewhere when two others of about its size already sit at about its height (anywhere across).
  Sizes lognormal (a few big, many small), never a sliver (≥ 30 × 10 pt). Deterministic per 6-hour block + cover (every phone the
  same sky; the drift runs on the city's clock, so a reload keeps the same clouds where they were).
- **REAL VOLUMES, SHADED PER PIXEL** (no outlines, no flat discs): a CUMULUS is a smooth union of 3D lobes — a broad flat-ish body,
  one to four domes at different heights, BILLOWS over each dome's whole upper silhouette (two sizes: billows on billows) and a few
  large shallow swells on its face — blended by a soft-max of their surfaces (soft creases, never seams), its edges made irregular
  by noise, its base flat but uneven (a slow wobble, a soft cut). STRATOCUMULUS: merged flat heaps on the same engine. ALTOCUMULUS
  + the OVERCAST DECK: noise fields laid out in true perspective (a cell overhead about as tall as wide, flattening toward the
  horizon; the deck a seamless tile sampled on a cylinder, darker overhead, lighter toward the horizon, broad rolls). CIRRUS: drawn
  filaments (bundles of combed strands along the wind, tapering, some hooking down — mares' tails).
- **THE LIGHT** (`skyLight` for the hour, `cloudLit` per cloud from where it is): the key light is the sun (the moon at night, when
  it's up) — its colour by elevation (white at midday → gold → orange low → coral + pink just after sunset → a dusky mauve; the
  clouds keep it ~1.6° longer than the street: they're high), its direction from the real elevation (from above by day, sideways
  low, FROM BELOW after sunset) and the sun's side of the screen; **backlit** clouds near the sun get a bright rim on their thin
  edges. **THE SELF-SHADOW**: each pixel marches toward the light through the cloud's own thickness — the far side + the bellies
  fall into a soft blue-grey, billows shade the ones behind them, and after sunset the bellies glow while the tops go lavender.
  The ambient: the sky above (the tops) + the light from below (the bellies) per look (day / gold / blue hour / night). A
  hue-keeping highlight knee (a sunset's orange stays orange, midday's white stays white). Far clouds dissolve into the horizon's
  colour. NIGHT: faint dark silhouettes, the city's violet glow under them (stronger low over the city); a PARTY night: the party
  palette's colours under them, and **the sky beams catch them** (`skybeams.js#onBeam` → `clouds.catchBeam`: a bright patch where
  a beam enters a cloud's belly, a softer glow up through it, in the beam's colour). The moon lights their edges when near.
- **DEPTH** (the rules): after the sun, the moon + the stars, before the skyline (behind every building), under the page (the NEON
  sign + the tagline draw over them; DT1's dark halo keeps SPEAKEASY readable — checked with a cloud right behind it), never over
  the dock. The sun glows through a thin edge (`coverAt` now reads the baked shape itself: `sun.through`).
- **THE COST** (the party's cost from review-2 in mind): each cloud's SHAPE (the lobes, the noise — the heavy part) is computed ONCE
  per plan into small typed arrays (normals + thickness + depth + texture: 6 bytes a pixel, at the phone's own resolution ≤ 2 px/pt);
  a LIGHT change only re-shades from them. Both run as time-sliced jobs (≤ 1.2 ms a frame once the sky shows; ≤ 10 ms a frame
  before the first clouds appear, inside the load's grace), a re-lit cloud crossfades in over 0.9 s; a drifting cloud re-lights
  only when its light moves a step (an eighth of the way round the sun). A frame: one `drawImage` a cloud. No per-frame bake, no
  pixel readback (`putImageData` into a fresh sprite). Memory: ~0.4 MB on a fair day, ~4.9 MB on a cloudy one at 402×874.
- **HOOKS**: Part 9 — `KINDS` (the shape builders: add `nimbus` (a heap with a dark flat base), `fog` …), `cloudMix`'s recipe
  (more deck / scud), `harbor().clouds.set({ grey, dark, base })` (greys + darkens the light, lowers the base — re-lit at once).
  Part 6b — the sky messages draw after the clouds (skywriting drifts through the same sky); `cloudLit` for any cloud lit by a
  special sky (an eclipse dims `sunK`). The preview: **`tests/integration/clouds-preview.html`** (every kind in every light, no
  Firebase: `?looks=noon,golden,sunset,dusk,night,party,overcast&cover=0.55&z=2`; `shots.mjs --page` shoots it).

### 2. THE BUILDINGS BY DAY — stronger 3D (`blocks.js`, the day channel only: golden hour, dusk + the night keep theirs)
- The sun's side warmer + brighter, the SHADE a clearly cooler, deeper blue-violet (`faces`: SKY_SHADE, −22 %); the side the
  camera sees decides more firmly by day (a noon sun still lights one side, shades the other); the fronts a touch darker under a
  low sun (the sunlit side faces are the brightest planes); the front's turn from its sunny edge to its shaded one stronger.
- Crisp edges: a brighter arris where the front meets the lit side, a fine cool line where it meets the side in shade; cornices +
  setback ledges catch a brighter top line; a setback tier throws a deeper, longer shadow on its ledge, with a cool wedge on the
  side away from the sun; cast shadows from taller neighbours a touch deeper.
- AERIAL PERSPECTIVE stronger by day (the far ones paler + bluer), the near ones richer (more saturated stone); the DAY SKY's
  horizon a step deeper (`tones.js#SKY_DAY`) so the cream towers stand out against it instead of dissolving into a pale band.
- MATERIALS at phone size: the gold crown richer by day with the sun catching each arch; the glass towers mirror the sky + its
  clouds, broken at each mullion (every glass column a touch offset — a real curtain wall's wobble), the city's darker reflection
  low, a bright sun streak on the sunny edge; the copper domes a richer verdigris.

### 3. WINDOWS BY DAY — not a grid (`blocks.js#dayPanes`, `windowStyle`, `farBands`)
Each building its own window character, by its seed: OFFICE floors (the panes joined into ribbon bands of glass, mullions),
APARTMENTS (framed panes with a transom, curtains in five colours drawn to the sides, blinds half down, a few open), DECO towers
(half of them TALL windows: two floors' panes joined in their recessed strips). Pane by pane the reflection varies (a quarter
catch more sky, a few show the dark room behind), lighter up the facade; the odd sun glint on the sunny half. FAR AWAY by day the
windows merge into soft tone bands (a band per floor) instead of tiny squares. All by the day's share: a window lit at dusk lands
on exactly its pane (`cellRect` unchanged).

### Decisions made overnight (the owner was asleep — each the most reasonable reading; easy to reverse)
1. **`/api/sky` also asks Open-Meteo for the cover by height** (low / mid / high) so the kinds follow the real sky; it only adds
   fields (City 1.0 ignores them). A shared `/api` file: the one-game smoke check passed.
2. **Clouds may pass behind SPEAKEASY + the tagline** (the brief: "never make SPEAKEASY hard to read — the DT1 halo helps"): the
   Day Pass's rule that kept them out of that band is gone; checked with a cloud right behind the word — readable.
3. **The day sky's horizon a step deeper blue** (`tones.js#SKY_DAY`): the cream towers dissolved into the pale band. The water's
   mirror of the day sky deepens with it. Night / dusk / golden hour unchanged.
4. **Golden hour's buildings kept exactly as DT1 left them** (backlit, warm rims, the gold window flashes): this pass's day
   lighting fades out as golden hour begins (pixdiff `golden-nc` = identical).
5. **Cirrus is drawn** (stroked filaments), not shaded per pixel — per-pixel fibres were blurry at phone size; **stratocumulus is
   built on the cumulus engine** (merged flat heaps) — the noise version read as a dappled smear.
6. The layout still re-rolls every 6 hours (the Day Pass's rule) and when the cover moves an eighth; the drift runs on the city's
   clock, so a reload keeps the sky where it was.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, afternoon `T16:00`, golden hour `T18:20`, sunset `T18:45`, dawn `2026-10-23T07:45`, a
cloudy day `2026-10-22T13:00&wx=clouds`, overcast `…T13:00&wx=overcast`, a clear day `…T12:30&wx=clear`, a night `T22:00`, a party
night `2026-10-24T23:00` (+ `&wx=clouds` to see the beams catch them); `&force=no-clouds` = the same moment without them (the cost
comparison on the phone). Shots: `shots.mjs --scenes d-morn,d-noon,d-aft,d-golden,d-clouds,d-overcast,d-night,d-party --crop
skyl3,skym,skyr3`; every kind in every light without the title: `tests/integration/clouds-preview.html`.

### Tests (DT2)
`harbor.test.mjs`: the kinds from the weather (+ the heights), the layout (perspective pooled over 12 skies, near + far in every
sky, never rows, never a sliver, deterministic, the deck, the drift), the light (every hour, the sun's side, backlit, from below
after sunset, haze, the bake's key, Part 9's greys); `e2e-harbor` `sky`: a cloudy day bakes ≥ 8 cumulus + patches in the band
with perspective in ≤ 9 MB, overcast = the deck + scud; `pixdiff` `dusk` + `*-nc`.

### Performance (A/B in one run, `title-perf.mjs --ab` against 6e89475, 402×874, the laptop without a GPU, 3 + 3 windows of 5 s)
| scene · tier | A (before): frame p95 · slow · work mean | B (DT2) | verdict |
| --- | --- | --- | --- |
| `np-clouds` t2 / t1 / t0 (4× CPU) | 17.2 · 0 % · 4.67 / 2.75 / 3.38 ms | 17.2 · 0 % · 3.80 / 3.12 / 3.37 | same ×3 |
| `np-day` t2 / t1 / t0 (4×) | 17.3 · 0 % · 4.17 / 2.71 / 4.22 | 17.2 · 0 % · 3.57 / 3.76 / 2.98 | same ×3 |
| `np-night` t2 / t1 / t0 (4×) | 16.8 · 0 % · 5.97 / 3.42 / 2.25 | 16.8 · 0 % · 4.21 / 3.42 / 3.37 | same ×3 |
| `np-party` t2 / t1 / t0 (2×) | 16.8 · 0 % · 7.59 / 4.59 / 3.08 | 16.8 · 0 % · 7.88 / 4.82 / 3.36 | same ×3 |
The party's t2 / t1 step themselves down at 4× without a GPU on both commits (C1.5's note) — measured at 2×. The clouds' cost
is in their bakes (time-sliced, during the load's grace + a few ms spread over seconds when the light moves), not the frame: a
frame adds one `drawImage` a cloud. The owner's iPhone decides: compare `&debug=1` with and without `&force=no-clouds`.

### Known issues (DT2)
- **WebKit still can't run here** — the owner's iPhone: the clouds' soft edges (crisp on the sunlit side), the load (the first
  bake runs in ≤ 10 ms slices before they fade in), the cloudy day's frame pacing vs `&force=no-clouds`.
- The day is still quieter than the night at a glance — by nature (no neon in the sun); it now has real massing, a deeper sky
  and a real cloudscape, but the near promenade + the speakeasy (Parts 7–8) are where the day's colour will grow next.
- A fair day's clouds are what the seeded weather says (cover 0.06–0.36 without the live weather: a few small cumulus) — golden
  hour + sunset are only as cloudy as the real sky; the previews use `&wx=clouds` to show them lit.
- The moon's silver on cloud edges is subtle at phone size (its light is weak by design: `skyLight` night key ≤ 0.5).
- Far clouds peek between the towers (behind the skyline) — intended; a bright one behind a thin tower can read as a smudge.

### Handoff → SKY POLISH (SP) — done, below; then Part 6b
The clouds are one system for every hour: `core/harbor-clouds.js` (what + where + the light) and `screens/harbor/clouds.js` (the
bake). For 6b: draw sky messages BETWEEN the cloud layers with `clouds.draw(c, fs, sun, 'back')` → the message → `clouds.draw(c,
fs, sun, 'front')` (the scene draws them all at once today); an eclipse dims the clouds through `skyLight` (`sunK`); the barnstormer
+ the special skies can reuse `cloudLit` for anything lit like a cloud. Part 9: storm / rain / snow / fog skies plug into `KINDS`,
`cloudMix`'s recipe and `harbor().clouds.set({ grey, dark, base })`.

## SP — SKY POLISH (Oct 23 2026; the owner's iPhone review of the Day Look — "the clouds are a 7 out of 10"; behind `?city=2`)
The bar: the night + party city are "stunningly beautiful… premium" — the sky must reach it. Three refine passes on
`tests/integration/clouds-preview.html` + the real city at 402×874 (stills, frame bursts, zoomed crops), once at 390 + 430.
**Proved with `pixdiff.mjs`** against af8c06c: `night-nc` + `dusk-nc` identical; `golden-nc` = the sun's disc only (its colour,
below); `party-nc` = a few neon outline segments caught mid-animation (the party show's clock between the two pages — no neon
code touched).

### 1. THE HIGH STREAKS → real CIRRUS (`clouds.js#cirrusGen`, `core/harbor-clouds.js#cloudPlan`)
The owner: they read as hard, straight, parallel speed lines crossing behind SPEAKEASY. Now each cirrus patch is a small GROUP
(2–5) of WISPS, drawn: **FIBRATUS** (a bundle of fine fibres combed along a gently curved Bézier backbone, clumped into 2–5
sub-bundles that wander across it, frayed + fanning at both ends), **UNCINUS** — mares' tails (a hooked head curling up at the
downwind end, the fall streak trailing back + down, spreading + thinning to nothing) and **TUFTS** (short dense brushes). Each fibre
its own length, width (0.45–1.6 device px), brightness and slow wobble; a soft body under them (the backbones wide + faint, drawn
at a sixth of the size and scaled up); the sprite's edges feathered (never a box). Never ruler-straight, never a parallel stack
(a wisp at the same angle right over another moves on), never evenly spaced; the blue shows through. The hooks point downwind
(the real wind's side). **CIRROSTRATUS**: a lot of high cover (`veil` in `cloudMix`: the high layer ≥ ~0.5) adds one wide thin
milky veil behind them. THE LIGHT (`cirrusLight`): the highest cloud — white by day, lit ~3° longer than the street and redder after
sunset, and with a low sun they GLOW (brighter + warmer: the gold / pink wisps over a darker city); at night barely there, a faint
silver when the moon is up. THE PLACE: 1–4 groups high in the sky, **above the tagline's band** (`box.avoid` = SPEAKEASY's top →
the tagline's foot, from `scene.js#tagBand`; behind the NEON letters is allowed), never stacked on each other. At the phone's own
resolution (the fibres are a pixel wide). The previews: **`&wx=cirrus`** (a fair day's cirrus over a few cumulus) and **`&wx=veil`**
(a hazy cirrostratus day / night) — `core/weather.js#forcedWeather` now carries the cover by height for them; THE PREVIEW PANEL's
weather list has HIGH CIRRUS, HAZY VEIL and OVERCAST.

### 2. THE CUMULUS, finished (`clouds.js#heapLobes`, `heapField`, `stratoLobes`; the plan's forms)
- **The base**: slightly flat but soft (a wider soft cut), uneven (a slow wobble + a finer ragged one) and its ENDS ROUNDED — within
  its own thickness of either tip the base curls up on a quarter circle of that thickness (a flat base meeting a sloping top drew a
  pointed "saucer" rim); low in the cloud the shade only where it is thick, so the base is lighter at its edges. No grey slab.
- **No seams**: the self-shadow now marches through its own smooth thickness field (`F.m` — each lobe's (1−e)² profile): the
  silhouette's square-root profile drew a crease down the body wherever one lobe ended inside another (the "bubbles stuck together").
  The domes blend over a slightly wider soft crease; each dome its own size.
- **Shape variety** (`cloudPlan`): most are heaps; some a **TOWER** (narrower + ~1.5× taller — more on a taller day), a few broken,
  ragged **FRACTUS** (scud's builder: no billow-foam, frayed by the noise); the small far ones stay simple puffs.
- **Stratocumulus**: the heaps overlap into one lumpy mass, each with its own small billows, a wide blend — never a string of
  sausages or a smooth lens.

### 3. OVERCAST + grey days
- **A real deck** (`cloudMix`): under a full deck nothing puffy floats in front of it — the cumulus + stratocumulus fade out as the
  deck closes (`shut`), only the SCUD stays (darker than the deck now: low wet fragments in its shade). The deck's own grey texture +
  the sun's brighter patch behind it (`sun.through`) were already right.
- **The light on the city flat + cool-grey** (`tones.js#sunLook` → `ovc`, `blocks.js#faces`): by day under ≥ ~0.8 cover the sun has
  no side (no cast shadows, sun streaks or glints) and the facades converge on a soft cool grey — the materials still read, muted.
- **The owner's pink 1 pm + the "lit" logo** (Claude's notes on her screenshot): in Chrome `&wx=overcast` at 13:00 has a grey sky (the
  harbor greys its own day sky by the cover) and the NEON sign stays the unlit day glass (`is-day`: the pink is the glass's inner
  filament, brighter against grey) — `darkness()` has no cloud term (`DARK_TERMS.cloud = 0`), so cloud can't power the sign. The pink
  sky + separate puffs on her phone match the deck NOT drawing there — see Known issues.

### 4. THE MOON + THE SUN
- **The moon's light** (`moon.js`): the owner — "too concentrated", a big faint ring cut through the tagline. The ring was the 22°
  HALO firing on ANY 18–62 % cover. Now: a WIDE SOFT GLOW with a gaussian fall-off (no edge at any size; wider + a little brighter in
  haze — the aureole) + the tight corona in clear air; **the 22° halo only under a cirrostratus veil** (`moonLook({ veil })` from
  `clouds.veil()`), very faint, a soft band (no stroke), and it fades out while any part of it would cross the tagline's band.
- **The sun's colour by altitude** (`district/sun.js#sunColorHarbor`, the Harbor only): at 9 am (8.7° up) it was a flat orange ball —
  now near-white with its bloom once it is clearly up (the white core from ~4.5°, the bloom from ~3.5°), golden-orange only in the
  last few degrees, red at the horizon. Golden hour's sun (4°) is a touch lighter; the rest of golden hour unchanged (pixdiff).

### 5. BEAMS IN THE CLOUDS (`clouds.js#rayHit`, `beamPatch`; `skybeams.js`, `searchlights.js#drawBeams`)
Light doesn't pass through a cloud as if it weren't there: `rayHit(x, y, ux, uy, len)` finds where a beam goes INTO a cloud (a short
march — ≤ 40 samples — through the baked shapes of the clouds it crosses) and how much gets through (the cloud's thickness along it);
the beam is drawn in pieces — full up to the cloud, then ×(0.1 + 0.9 × what gets through) beyond it, then the next cloud (two at
most). `beamPatch` lights the cloud there in the beam's colour: the underside bright where it goes in (wider than the beam), the
light running along the belly, the glow scattering up through the body — **masked by the cloud's own sprite** (the light lands on
the cloud only, never on the clear sky round it) + a little in the air under the belly. Thin cloud: a weak patch, the beam shows
through. The party's SKY BEAMS (vertical) and the sweeping SEARCHLIGHTS (a moving lit patch across a cloud base) both use it.
DEPTH: only the clouds up over the city (the upper half of the sky, s ≥ 0.42) catch the beams — a cloud just over the crowns is far
beyond the city and the beam passes in front of it. Each patch is rendered once into a small canvas (pooled) and kept while it lands on
the same 2 pt of the same cloud; the beat is only its alpha.

### 6. THE CLOUDY PARTY'S COST (her iPhone: 4.2 % slow, ~3× a clear party)
Found (the clouds' debug: `harbor().clouds` → `ms`, `jobMs`, `relit`, `beamMs`, `hitMs`, `renders`):
1. **Every cloud was re-lit right after it appeared**: its first bake was lit at its starting place, but it had drifted since the
   6-hour block began — 22 re-shades + canvas uploads + crossfades at once. Now the first bake is lit where it is (`plan` → `driftX`).
2. **By moonlight they kept re-lighting** as they drifted (~1–3 a second: a re-shade sliced over frames + a new canvas uploaded + a
   0.9 s crossfade each) — the slow frames on a phone. By moonlight the light barely changes with the place: no drift re-lights (the
   global key still re-lights them all when the light really moves; `cloudLit`'s key is coarser by moonlight too).
3. **The old beam-catch** scanned each cloud's whole pixel column every frame (~0.33 ms a frame here). The new ray march + cached
   patches: ~0.06 ms for the hits + ~0.2 ms for the patches.
Measured in one probe (party 23:00 &wx=clouds, the laptop without a GPU, 1×): re-lights 51 → 0 over the same 8 s, the clouds' draw
0.3 → 0.16 ms. The A/B gate below: the cloudy party within noise of the clear one.
**The readout's "30 fps" by day** with "frame 17 ms": that is the BATTERY SAVER (cleanup pass 1, `scene.js#fastNow`) — when nothing
fast is on screen (a calm day, a quiet night) the city draws every OTHER frame (30 fps; every third under reduced motion) and comes
back to 60 the moment anything fast appears (a plane, birds, the party, rain, a bake, a tap). "frame" is the rAF interval (every
rAF, drawn or not: 16.7 ms on a 60 Hz screen), "fps" the frames actually drawn. The readout's last line says why ('calm').

### 7. CONTRAILS, smooth (`air.js#drawTrail`)
The owner: "too jagged, skippy, jumpy" — they were six batched polyline strokes through samples 0.35 s apart (visible steps where
the batches' widths changed, a head that jumped). Now ONE continuous trail of soft gaussian puffs on the plane's real path (the
engines' place every 0.1 s, interpolated sub-pixel), each puff tied to the moment it was laid (a fixed grid of times — it never crawls
or jumps between frames at 60 or 30 Hz): it only ages — spreading, softening, drifting with the real wind, fading out evenly. As
the trail spreads, every other puff fades out smoothly while its neighbours grow to cover it (~90 sprites a plane at most). The
first half-second: the two thin engine lines from the engines themselves, merging (a steady head). Golden hour + dawn: warm.

### 8. THE BUILDINGS BY DAY — one small step (`blocks.js#faces`, the day channel only)
The sunlit side a touch brighter + warmer, the shade a touch deeper + cooler (side by side with the before: small, safe). Golden
hour, dusk + the night keep theirs (pixdiff).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, a cloudy day `T13:00&wx=clouds`, overcast `T13:00&wx=overcast`, golden hour
`T18:20&wx=clouds`, sunset `T18:45&wx=clouds`, dawn `2026-10-23T07:45`, a cloudy night `2026-10-22T22:00&wx=clouds`, a cloudy party
`2026-10-24T23:00&wx=clouds`, high cirrus `2026-10-22T11:00&wx=cirrus` (+ at sunset `T18:45&wx=cirrus`), the veil + the moon's halo
`2026-10-26T23:30&wx=veil`; **a plane with its contrail**: `2026-10-22T11:00&force=planes` (a plane every ~9 s; give it 10–15 s to
lay a trail). Shots: `shots.mjs --scenes sp-morn,sp-noon,sp-cloudy,sp-overcast,sp-golden,sp-sunset,sp-dawn,sp-night,sp-party,
sp-plane,sp-cirrus,sp-cirrus-set,sp-veil`; the clouds alone: `clouds-preview.html?…&layers=0,0,0.6&kinds=cirrus&band=1`.

### Tests (SP)
`harbor.test.mjs` (+3, 102): cirrus groups (a few, above the tagline's band, never stacked) + the veil + the preview weathers; the
overcast deck (nothing puffy in front of it; `sunLook` flat by day, never at night); the moonlight re-light steps; the halo only under
a veil (+ the aureole's haze); the 9° sun pale. e2e-harbor 112/112; the unit suite 472; the one-game smoke check (shared files:
`core/weather.js`, `district/sun.js`).

### Performance (A/B in one run, `title-perf.mjs --ab` against af8c06c, 402×874, 2× CPU, the laptop without a GPU, A B B A)
| scene · tier 2 | A (before): frame p95 · slow · work mean | B (SP) | verdict |
| --- | --- | --- | --- |
| `np-pclouds` (a cloudy party — new) | 16.8 · 0.7 % · 8.98 ms | 16.8 · 0.3 % · 8.71 ms | same |
| `np-clouds` (a cloudy day) | 17.2 · 0 % · 2.36 ms | 17.3 · 0 % · 2.02 ms | same |
| `np-party` (clear) | 16.8 · 0.3 % · 8.39 ms | 16.8 · 0.3 % · 8.35 ms | same |
The cloudy party is now within the noise of the clear one here (8.71 vs 8.35). The phone decides: `&debug=1` on the cloudy party
vs `&force=no-clouds` — the "after 10 s" line.

### Known issues (SP)
- **WebKit still can't run here.** Her overcast screenshot (separate puffs with gaps under a pink-violet sky, E-O-N looking lit)
  doesn't happen in Chrome (a grey deck, a grey sky, the sign's unlit day glass). The deck is the one big cloud sprite (~260 k px):
  if it fails to draw on her iPhone, the sky under it shows. To check on her phone: `&wx=overcast` at 13:00 with `&debug=1` — if the
  grey deck is missing, `__district.harbor().clouds` (deck, pending, mb) says why. The NEON sign can't be powered by cloud today.
- The cirrus need real high cover to show: the seeded day (no live weather) gives them on ~60 % of days, small; `&wx=cirrus` shows
  them on demand. On a live day they follow Open-Meteo's high layer.
- A faint inner seam can still show on a big heap where two towers meet (the column-depth shading); a strong-contrast close look
  only.
- The beam patches mostly land on clouds behind the NEON letters on a phone (where the clouds are), so the sign's own glow covers
  much of them; the searchlights + the side beams show them best.
- The altocumulus layer (a mid-cover day) is still a noise field and reads a little blotchy up close — the owner hasn't flagged it;
  6b / 9 can rebuild it on the heap engine like the stratocumulus.

### Handoff → Part 6b (the special-occasion sky)
The sky's pieces are in place: cirrus groups (`cirrusGen`, reusable for a holiday's tinted high cloud), the moon's soft glow + the
gated 22° halo (`moon.js#skyIs` gets the tagline's band + the veil each frame — 6b's sign raise + arch re-fit should re-check the
halo's clear-of-the-words fade), beams that meet clouds (`clouds.rayHit` / `beamPatch` — any new beam: the tribute lights, a holiday's
beams, the barnstormer's landing lights can use them), smooth contrails (6b's "fluffy contrails like City 1" is done — a skywriter
can reuse the time-grid puff trail in `air.js#drawTrail`). Sky messages still draw between `clouds.draw(…, 'back')` and `'front'`.

## M — CITY 2.0 MUSIC (Oct 23 2026; the owner's mood songs + the MUSIC MOOD setting; City 2.0's music behind `?city=2`, the setting in both cities)
The detail lives in docs/audio.md#city-20-music; this is the handoff.
- **Songs:** the owner's five ~/Downloads folders (morning 11 · day 11 · evening 14 · late 11 · party 9 = 56 files; victory + neon ignored) → 51 stored + 1 reused:
  morning4–7 = day4–7 byte for byte (one file each, in two decks), her morning10 in MORNING + LATE NIGHT (one file), evening3 = the repo's slip8 (M2: dropped — City 2.0 never plays City 1.0 songs). 112 kbps stereo MP3, trimmed,
  −16 LUFS / ≤ −1 dBTP; **+144.5 MB** (the owner chose to commit them as they are; `MUSIC_BASE` in js/config.js moves them to a CDN with one change — js/audio/music-url.js).
- **One command to add more:** drop files in the folders, `python -I scripts/add-city2-music.py` (docs/audio.md).
- **Rule + decks:** `core/city-mood.js` (dawn / 11 am / golden hour 10° / 11 pm / the party show once `partyReady`) on the Harbor's own clock (`core/city.js#setCityClock`, registered by
  `scene.js` — so `&when= &speed=` and the preview panel move the music). Decks in `data/mood-music.json` `city2`; City 1.0's lists untouched.
- **Setting:** `settings.musicMood` (AUTO + five moods), a row in the settings sheet, both cities; the lobby follows the HOST. A forced change (a picked mood, the party starting) crossfades 4 s
  (`music.js#switchNow`); a natural change waits for the song. The preview panel's MUSIC section (mood, SKIP, the song + its grid status) and `&mood=`; the readout's `music` line.
  M4: the MUSIC row says where the mood comes from (THIS PANEL / THE MUSIC MOOD SETTING ON THIS PHONE / AUTO · THE CITY'S CLOCK) — the owner's "music
  MORNING all day" was her phone's own setting; the panel's AUTO + CLEAR ALL put that setting back to AUTO (docs/audio.md#m4).
- **Beat grids:** all 51 have one; **15 are not trusted** (docs/audio.md lists them: steady for the whole song AND the kicks land on it ≥ 50 % or a strong onset lock) — the city follows the
  kicks it hears on them (`untrusted` in `beatSource`, ignored by `advanceHarborBeat`). Ear-checked: no (no audio output here) — the offline replay of the real kick listener stands in for it.
- **Tests:** `tests/city-music.test.mjs` (15), e2e-harbor group `music` (38 checks: the five preview links, the setting's crossfade + AUTO, natural vs forced, party start, `&mood=`, the panel row +
  SKIP, City 1.0 untouched), e2e-lobbysong 9/9. Screens: the settings row at 390 / 402 / 412, the panel's MUSIC section at 402.
### Known issues (M)
- `e2e-mood.mjs`'s lobby part ("host playing the room song") times out on this machine **on the untouched baseline too** (checked in a worktree at 254eda7) — a pre-existing harness / environment
  problem; `e2e-lobbysong.mjs` covers the same ground and passes.
- A lobby's room song does not switch mid-song when the HOST changes mood (the next song comes from the new mood): the synced player schedules its fade-out once per song, a mid-song queue rewrite
  would need it to re-plan. Outside a room the switch is a crossfade.
- The 1440×900 shot of the settings sheet shows the title (the sheet closed on the viewport change in the test); the row is the same markup as the phone's.
- The songs' loudness is −16 LUFS; City 1.0's older songs average −12 (M2: slip8 is out of City 2.0's EVENING, so its decks are all at one level).
### Handoff → Part 6b (the special-occasion sky)
Nothing in 6b needs the music, but its TR-3B "power-down" effect (plan.md) plugs into `music.js` (`filterMusic`, `duckMusic`) and
`beat.js#songInfo` says which song + whether its grid is trusted. The harbor's clock is now shared with the audio (`core/city.js`): a new clock override (a CITY CONTROL time jump, Part 13) only has to
mutate the scene's `clock` and the music follows.

## M2 — MUSIC FIXES + DAY BUILDINGS (Oct 23 2026; the music in both cities, the look behind `?city=2`)
The owner: the music dies after leaving Safari (every visitor hits it); the party's beat sync "kind of — not perfect"; the day buildings
7–8 / 10 — "a little flat". The bar: the day reaches the night. **Proved with `pixdiff.mjs`** against 563cdb2: `party-nc` = the billboard's
lamp strip only (pt 11–65 × 492–504); `night-nc`, `dusk-nc`, `golden-nc` = that strip + a few px of the lighthouse / the blue hour's randomly
timed sputters (the A-A noise of a moving frame). The day work is gated on the day's share (`T.day`): golden hour, dusk + the night never run it.
The music detail lives in docs/audio.md (#m2-the-music-comes-back, #m2-when-the-beat-is-heard).

### 1. Music
- **City 2.0 never plays a City 1.0 song:** `slip8` (= the owner's evening3) out of the EVENING deck; `city2.sources` marks that file
  `skipped` so the importer never lists it again, and `--reuse` refuses a City 1.0 song. Test: `city-music.test.mjs` (no City 2.0 deck holds a
  City 1.0 track). morning4–7 = day4–7 stay shared (intended).
- **THE MUSIC COMES BACK** (`audio/engine.js`, `audio/music.js`, the music buttons): a stuck context is REBUILT inside the next tap, a song that
  errored / stalled after the phone slept is reloaded at its place (never marked "missing"), a voice that "plays" but sends nothing is seen by
  a probe and re-made in the next tap, and the music button's tap always ends with music playing. The lobby's room song comes back on the room's
  clock (`synced-songs.js` re-connects to the new context; `pulse/clock.js` re-samples it and ignores a stopped clock). Tests: e2e-harbor `music`
  (+7 scenarios: leave + come back, a stuck context + one tap, the music button while stuck, a network error, the OS pausing it, a bfcache
  restore, a dead voice), e2e-lobbysong (+3: a joiner's stuck audio → one tap → the room's song in sync from its first moment), audio-resume.mjs.
- **THE BEAT AS HEARD** (`audio/beat.js`): Safari reports no `outputLatency` — the beat now uses the output timestamp (or ~20 ms on an iPhone)
  and each phone MEASURES the song element's own lead from the kicks it hears on trusted grids (Chrome here: 2 ms; the iPhone's is its own,
  saved per device). The readout's new line: `sync out 59 ms · lead 2 ms (32 kicks)`.
- **party3** re-checked (a full tempo + phase scan): its "142.5 BPM, lock 5.7" is an artifact of a dense 16th-note pattern (each quarter of the
  song prefers a phase a third of a beat away); the real tempo is the tracker's 106.9 and its kicks sit off the beat (agree 0.19) → it stays
  untrusted: on it the city follows the kicks it hears (right for a syncopated song). The other eight party grids hold (steady, agree 0.59–0.9;
  party9 agree 0.33 but lock 5.46).

### 2. THE DAY BUILDINGS — from flat to solid (`blocks.js`, `skyline.js`; the day channel only)
1. **CAST SHADOWS BETWEEN BUILDINGS** (`castShadows`, `drawCast`, `CAST`): the light is the real sun's side + height and — the day look's
   convention — from the viewer's side, so each box throws its shadow onto the fronts BEHIND it: its front rect pushed by the depth gap to that
   wall + its back rect pushed less, the hull of the two (attached where they touch, long when the gap is big or the sun low: drop =
   0.45 × tan(elevation) a unit of depth, sideways 1.1 × sunDir). Across both baked groups (a near block shadows a far tower), clipped to the
   receiving front, a 4-step penumbra growing with the gap, MULTIPLIED in a cool blue-violet (the stone darkens + cools like its own shade
   side, its windows still show). Morning from the left, afternoon from the right; noon short; an overcast deck: none (`ovc`), a cloudy day
   (> 0.6, the bake key's bucket) softer. **Contact occlusion**: a nearer roofline cutting across a wall darkens it just above. Cost: computed
   lazily per wall inside its own bake step (~5 ms for all 203 boxes on the laptop, spread over the sliced bake; nothing per frame).
2. **The foot's occlusion** (a cool dark band at each building's base where it meets the street / water) + a clearer, WARM gradient up each
   facade (brighter toward the top, darker at the base).
3. **RECESSED WINDOWS** (`dayPanes`): each opening's head + its sun-side jamb throw a thin shadow onto the glass; the sill + the far jamb catch
   the light only where the opening is ≥ 2 pt (on dense grids the bright lines bleached the stone); the sill's own shadow under it. Per the
   building's openings (an office ribbon, a Deco tall window, a pane). Near + mid only (far ones stay tone bands).
4. **MATERIAL** (`stoneFace`): rusticated stone bases (channelled joints, a lit water-table line, its shadow), brick laid in batches (a floor's
   courses a slightly different tone), belt courses (limestone on brick, terracotta on cream / limestone, a lighter band on granite).
5. **Contrast**: the sunlit side faces brighter + warmer (`dLit` +13 %), the fronts warm (a first try made them cooler — it greyed the cream
   towers; reverted). The edge highlights were already crisp (DT2).

### 3. THE BILLBOARD'S GOOSENECK LAMPS (`signs.js#gooseneckLamps`, `drawGooseneck`, `lampGlows`)
Each shade a deep enamelled warehouse dish ~6–8 pt across at 402 (`W` = 8.5 % of the board, clamped), a cap where the arm enters, a sun shine
on its dome, a bright rolled rim; the arm ~0.9 pt thick, up from behind the board, arching over the top edge. Two each side of the mark; every
mouth ABOVE the board's top edge (they never cover the mark or the name). Lit: the shade's inside glows, a white-hot bulb point, a visible soft
cone down the poster. The timing is DT1's (on at late golden hour, a dim wash once the neon is up). Test: `harbor.test.mjs` (size, place, the middle clear).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, afternoon `T16:00`, golden hour `T18:20`, overcast `T13:00&wx=overcast`, night `T22:00`, party
`2026-10-24T23:00`; the billboard lit `2026-10-22T18:50`. Shots: `shots.mjs --scenes d-morn,d-noon,d-aft,d-golden,d-overcast,d-night,d-party --crop skyl3,skym,skyr3`.

### Tests (M2)
`harbor.test.mjs` (+2, 104: cast shadows by day only, along the sun, never above their box, none overcast / golden / night; the lamps),
`city-music.test.mjs` (+1, 16), e2e-harbor 169/169 (music group 57), e2e-lobbysong 12/12, audio-resume.mjs, the one-game smoke check, units 490.

### Performance (A/B in one run, `title-perf.mjs --ab` against 563cdb2, 402×874, 2× CPU, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` | 2.36 → 2.00 · 1.67 → 1.77 · 1.37 → 1.37 | 16.8–17.2 · 0 % both | same ×3 |
| `np-night` | 2.85 → 2.30 · 2.04 → 1.83 · 1.44 → 1.33 | 16.8–17.1 · 0 % both | same ×3 |
| `np-party` | 7.59 → 7.63 · 5.06 → 5.04 · 3.59 → 3.59 | 16.8–17.1 · 0 % both | same ×3 |
The day's new work is all in its bakes (per look key — a few a day, sliced); nothing per frame.

### Known issues (M2)
- **WebKit can't run here** — the iOS audio states are simulated (a context that won't resume, a paused / errored / dead element, bfcache). The
  owner's iPhone decides; what to try is in the commit's notes + docs/audio.md. If a rebuild happens, the readout's `music` line can't show it —
  `__arcade.musicDebug().health` (`rebuilds`, `why`, `last`) does.
- The element's lead is learned on each phone (≥ 12 strong kicks on a trusted party song whose kicks land on its grid); the first visit starts at
  0, every later one with the saved value. Bluetooth headphones' delay is only as good as Safari's output timestamp.
- A song with a long stretch of true digital silence would look like a dead voice for that moment (the next tap would re-make the voices and
  carry on; it clears itself when sound returns).
- Cast shadows fall on FRONTS only (side faces + roofs aren't drawn as lit surfaces); with the light from the viewer's side most of a shadow
  hides behind the box that throws it — what shows is the part pushed sideways, so noon (the sun near the middle) is calmer by nature.
- The window recesses are half-point lines at the bakes' 2 px / pt: at phone size they read as texture on the mid towers, as relief only on the
  near blocks.
- A second tap on the music button within 1.5 s of a rescue counts as the same "play" (never switches the music straight off again).

### Handoff → Part 6b (the special-occasion sky)
Nothing in 6b depends on this pass. For later passes: `castShadows` takes any box list (Part 7's speakeasy + Part 8's stage can throw
shadows the same way); `CAST` holds the light's numbers; the lamps (`gooseneckLamps` / `drawGooseneck` / `lampGlows`) are Part 7's ghost-ad
lamps. The audio engine's `onRebuild` / `onGesture` are the hooks any new audio module should use if it caches nodes.

## M3 — FIX PASS (Oct 23 2026; the music in both cities, the look behind `?city=2`)
The owner's iPhone after M2: the music still didn't come back after leaving Safari (even with a tap); the billboard dark at night ("it's an
advertisement — you should be able to see it at night"); the beat "might not be perfect yet" (`lead −42 ms`); the brick a little flat at noon;
the small cumulus "cheap and fake". The music + the lead live in docs/audio.md (#m3-the-music-on-the-iphone-for-real, #m3-the-learned-lead-checked).

### 1. The music (both cities) — docs/audio.md#m3
Reproduced first by emulating iOS's gesture rule in the test (play / resume only inside touchend / click / keydown): the M2 engine worked in
`pointerdown` (not a gesture on iOS) and never started the song inside the tap. Now: the work runs in the real gestures, a song starts IN the
tap, an interrupted / frozen / unhonoured context is rebuilt at once, every silent tap rescues, the music button always ends in sound.
**THE AUDIO PANEL** (`&debug=1`, `audio/diag.js`): the context, the song element, what should play and the last 8 events with times — one
screenshot after the bug shows where it died.

### 2. THE BILLBOARD AT NIGHT (`signs.js#lampLightMap`, `scene.js#LAMP_DIM`)
The four lamps' light now WASHES THE WHOLE BOARD: a warm wash top to bottom (bright under the lamps, ~62 % at the foot), a brighter pool under
each lamp at the top, the ends beyond the outer lamps a little less lit — multiplied over the poster (was: a dark 13 % ambient + pools that
died above the name). At night the lamps stay up (`LAMP_DIM` 0.5 → 0.1: 90 % of full once the neon is on, was 50 %). Same look at dusk + dawn
when the lamps are on. Judged at 402×874 beside the neon: the icon + the full name read like the signs around it; the lamps' hardware, bulbs +
cones unchanged. Shots: `shots.mjs --city 2 --scenes d-night,d-party --sizes 402x874 --crop bill` (the new `bill` crop).

### 3. THE BRICK AT NOON (`blocks.js#brickFace`, `#brickTrim`; the day channel only)
On every brick building (brick is only ever NEAR; the mid ones by scale `s` > 1.3, the far stay smooth tone): staggered COURSES of brick-sized
runs a little lighter / darker / warmer (the kiln's colours), a fine light MORTAR line on each course (≥ 1.05 pt apart — ≥ 2 device px in the
2 px / pt bake: texture, never noise) with the joint's shadow under it, a darker SOOT BAND at the foot, stone LINTELS over the windows + SILLS
under them catching the light, the sill's shadow on the brick below. All by `noonK` (the sun's height): strongest at noon (short cast
shadows), softer morning + afternoon; overcast halves it; golden hour, dusk + the night never run it (the old thin course lines on brick are
replaced). Baked per look — nothing per frame.

### 4. THE SMALL CLOUDS (`core/harbor-clouds.js#smallForm`, `clouds.js#fragLobes`)
Fewer and better: a cumulus under 50 pt (`SMALL_DROP`) isn't drawn (it still counts toward the sky's share — no replacement); a NEAR one (s > 0.5)
under 130 pt grows to a full heap (130 pt); a middle-distance / far one under 130 pt (`SMALL_FRAG`; a heap's sprite is wider than the cloud
you see) is a FRAGMENT (40 %) or a WISP (60 %) — at most 4 a sky (`SMALL_MAX`, more on a wider screen): lobes of every size on a wandering
spine, each at its own height, a torn bit coming away, much more broken edges (noise 0.78 / 0.88), NO flat base (the lower third thins away),
partly see-through (`k` 0.72–0.86 / 0.56–0.70), lit by the same light as the big ones. Overcast: the SCUD is built the same way (wisp-flat),
softer + more see-through (a 0.74) and lighter (melts into the deck). The big cumulus are untouched. Test: `harbor.test.mjs` (no puffs, every
small one a fragment / wisp, ≤ 4, near + far still).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Night `2026-10-22T22:00`, party `2026-10-24T23:00`, noon `2026-10-22T12:30`, dusk lamps `2026-10-22T18:50`; overcast `T13:00&wx=overcast`,
a cloudy day `T13:00&wx=clouds`.

### Tests (M3)
e2e-harbor `music` §7 (+7: the emulated iOS rule — the first tap, stuck + one tap, the music button + the tap landing on it, a frozen clock,
the AUDIO panel), the readout's sync line; `harbor.test.mjs` (+1, 105: the lead's sign / filter / clamp / frame-rate lag; the small clouds);
e2e-harbor 176/176 (music 64), e2e-lobbysong 12/12 (its stuck tap now sends a real tap's touchend + click), audio-resume.mjs, the one-game smoke
check, units 491.

### Known issues (M3)
- **WebKit still can't run here.** The emulation covers iOS's gesture rule, not every WebKit state; if the music still dies, the AUDIO
  panel's screenshot says where (the context, the element or a refused play — and in which event).
- The lead is learned per phone; a saved value outside −80…+120 ms is clamped (an older save of e.g. +180 ms comes back as +120 until relearned).
- The brick's mortar lines are ~half-point at the bake's 2 px / pt: on a 3× iPhone they read as fine texture, not individual bricks (by design).
- A small cloud the plan drops still counts toward the sky's share, so a sparse day has fewer clouds than before (intended: "fewer and better").
- No perf A/B this pass: every change is in a bake (the board, the brick, the clouds' sprites) or makes less work (fewer clouds); nothing per frame.

### Handoff → Part 6b (the special-occasion sky)
Nothing in 6b depends on this pass. `brickFace` / `brickTrim` take any brick face (Part 7's speakeasy can call them); `fragLobes` + the
`frag` / `wisp` forms are there for Part 9's weather (ragged scud under rain, fog wisps); `audioLog()` is the place for any new audio module to
say what it did (it shows on the AUDIO panel).

## PART 7a — THE SPEAKEASY'S LOOK (+ the layout, the first tap, the beat after returning, near brick + the lighthouse) (Oct 23 2026; behind `?city=2`, the corner buttons everywhere)
The owner reordered the build: the placeholder foreground was about half the phone screen and skewed every judgement of the city, so the
foreground's LOOK comes before the sky (7a the speakeasy → 8a the promenade → 6b). The bar: the night + party city — the speakeasy, the
closest and biggest building on screen, must be the most crafted thing in it. Five pieces ran in parallel (the lead: the speakeasy;
helpers: the layout + the first tap, the beat + the pulse + the spell-on round, the preview panel, the near brick + the lighthouse, the
sun's colour). The audio detail lives in docs/audio.md#7a--the-beat-in-direct-mode; the title's layout in docs/title.md.

### 0. The layout, the first tap, the beat (section 0)
- **THE LAYOUT (both cities):** the round corner buttons are 36 pt (`--cb` in components.css; were 44 / 42), each with an invisible
  44 × 44 tap area (`::after`), icons 16 px; everything hanging off them re-fitted (in games the music button at +54, the menu panel,
  the chat dot 9 px, `.game-head` / `.bar` padding 44 px, PRISM's pair, THE BOARD's back button). **THE CORNERS SPLIT on the title + the
  lobby** (`body.nd-on`, `body.cb-split` from app.js): ☰ top-LEFT, ♪ top-right; games keep both on the right. **The NEON sign ~24 pt
  higher** (`.nd-sign` margin `clamp(16px, calc(8.5vh - 24px), 72px)`; short phones 12 px). The Harbor reads the ☰ as `cam.cornerL`
  (scene.js#rects) and `laneRects` starts any lane that would reach it 4 pt right of it (sky-high ≈ 52,66 · 278×76 at 390). `REF_TITLE`
  is unchanged: the skyline doesn't grow into the freed sky — the city just has more sky. LEAVE ROOM + the TEST pill sit right of the ☰.
- **THE MUSIC'S FIRST TAP** (City 2.0; no "tap for music" hint): `music.js#musicClock()` (the song's own clock, −1 when off / muted /
  not sounding); title.js watches it after the visit's first tap and, once per page load when the clock really starts, the NEON sign
  answers: BY DAY `raceLogo('surge')` — a bright head + tail races N → E → O → N through the unlit glass, each letter blazing as it
  passes, the bloom swelling, back to daytime glass in ~1.6 s; AT NIGHT `raceLogo('first')`, a quicker brighter race. Never during the
  intro (the power-on is the answer) or the golden-hour warm-up (the tap does what the catch does today); reduced motion: one soft bloom.
  (8a: the surge whenever the sign is NOT lit — morning, day, golden hour, dusk — and the catch only in the evening warm-up window:
  `district/neon-ramp.js#firstTapAnswer`, see PART 8a §0.)
  `&force=first-tap` (2.4 s after the intro, then every 5 s); `__district.signSurge()` / `surge()`.
- **THE BEAT AFTER RETURNING** (docs/audio.md#7a): the beat clock always had the song (`nowPlaying` reads the direct element); a FROZEN
  graph's analyser keeps its last window forever, so the kick listener reported "live, no kicks" and the city calmed to a quarter.
  Now `core/harbor-beat.js#beatMode(song, kick)` picks the source and ignores the listener on the direct element; on it the element's
  own clock with no output / lead (iOS's media pipeline compensates its own output). The readout's beat line names the source:
  `grid` · `kicks` · `direct-grid` · `tempo` (an untrusted grid: a gentle steady pulse at its tempo) · `calm`.
- **THE PULSE A STEP STRONGER** (+25–38 %, no new passes): the tubes `1.15·pe` (was 0.9), the crowns' flare `min(1.9, 1.7k)` (1.4, 1.3k),
  the signs `0.9 + 0.72p`, the wheel whole `0.82 + 0.6p` / hub `0.9 + 0.92p` / rims `+0.6p`, the sky beams `0.5 + 1.0p` (a deeper dip
  between beats), the NEON logo's party glow `min(0.95, 1.02p)`, SPEAKEASY's rings 1.2p / word 1.45p.
- **THE SPELL-ON ROUND** (the owner's add-on): EVERY named sign (the blade, both roof signs, any panorama sign) spells on in its turn —
  one every 120–240 s on a normal night on the city clock (seeded: every phone the same), never two at once, never the same sign twice
  running; on a party night only across a scene change (the scene's last bar → the next one's first), shortened to fit
  (`core/harbor-show.js#spellNow / spellParty / spellWho`, neon.js#planSpell). `&force=spell-on` (the next sign every 6 s).
- **THE SUN'S COLOUR BY ALTITUDE** (the owner's add-on: "bright white at 17:57, ~6° up"): `district/sun.js#sunColourAt(el)` (pure, no
  steps): white above ~15°, warm yellow-white 6–15°, golden amber 2–6°, deep orange-red in the last 2° and squashed (0.86 at 0°); the
  white core from 10–18° (was 4.5°), the halo from 3.5–15°; the golden haze now under the disc, the rays start outside it (rays.js) —
  three glows had bleached an amber disc white. The city's light follows in the morning too (`tones.js#toneWeights`: all gold below
  ~5°, daylight from ~9°; the evening untouched). City 1.0's sun untouched.
- **THE AUDIO PANEL'S HEADER** matches its detail (`audio/diag.js#audioStatus`: sounding / sounding DIRECT / LOCKED (no tap yet) / …).

### 1. THE SPEAKEASY (`core/harbor-speakeasy.js` PURE + tested; `screens/harbor/speakeasy.js`)
- **How it's drawn:** each wall is PAINTED FLAT in its own units (u across, v up — ~13.6 pt a unit on a 402 phone) with the skyline's
  material system (`blocks.js#faces`: brick / cream terracotta / granite for this look — day / golden / night tones, the real sun's
  side + height, overcast) and projected: the front faces us (one affine map: drawn straight into the bake), the side wall recedes
  (painted into its own canvas, then one source column per device pixel — exact perspective for a vertical wall). Baked into `stage` in
  8 small steps per look key (the rooftop pieces, the side wall, its strips, the blade, the front's structure, the windows, the ground
  floor, the light + weather + ivy, what stands out: awning, steps, posts, lamps). The bake key adds this week's ad + the month (the ivy).
- **The facade** (`SPEAK_V`): a granite plinth (rusticated, a lit water table) · the ground floor · a terracotta belt course with a carved
  chevron frieze · two floors of windows between brick PIERS (a lit edge toward the light, a shade edge away; stepped terracotta capitals
  with a fan) · carved SPANDREL panels (a fan + chevron wings) · a frieze with DENTILS + the crown moulding and its shadow (deeper with a
  high sun) · a brick parapet with a terracotta coping · a stepped Deco CREST (brick steps capped in cream, a carved fan medallion with a
  gilt boss) · finials on the piers · stone QUOINS up the corner (both walls). Brick: a 16 × 16 tile of kiln-coloured bricks (3 device px
  a course, a lighter top edge by day) + batch tints per floor and bay. WORN: soot streaks from the cornice + coping, rain streaks, a dirty
  foot, small chipped terracotta, the gilt faded, BOSTON IVY up the corner (a fan of small leaves; autumn reds, summer greens, winter bare
  twigs — by the month).
- **THE BARBERSHOP** (the cover): the big window (u 3.5–7.7) — inside a tiled floor, a MIRROR WALL of silvered panels (the hook for
  7b's hidden door), a shelf of tonics, the counter, THE BARBER CHAIR (porcelain pedestal, red leather, chrome), a milk-glass lamp; on
  the glass GOLD LEAF "HARBOR BARBERS" arched + "SHAVE & HAIRCUT" (gilt, a dark keyline, a shade), the street's reflection + a sheen by
  day. Its glazed door (left, behind the corner tree) with the card: OPEN by day, CLOSED at night. The striped AWNING over both (12
  faded red / cream panels, a sewn-on PATCH, iron arms, the valance "EST. 1924", scallops, its side flap). THE BARBER POLE (live) on
  its brackets by the side door — see below. THE UNMARKED SIDE DOOR (the knock's target, unchanged): a granite surround, oak planks,
  iron strap hinges, the little GRILLE, a brass knob, two worn granite steps, the SCONCE over it. THE BASEMENT WINDOW in the plinth
  (barred): a faint warm amber, day + night, breathing a little — the one hint of the secret.
- **THE WINDOWS** (`ROOMS`; ~26 × 30 pt): deep recesses (the left jamb's face, the sill's top, the head's shadow on the glass), bottle-
  green sashes (three lites over one), terracotta sills + their shadows, soldier-course heads. BY DAY the sky in the glass (light at
  the top, the room's dark below), roller shades at different heights, curtains (red / olive / gold), a plant on the edge window's
  sill, the apartment's WINDOW BOX of geraniums. AT NIGHT (live, `roomLight` by the hour): THE BAR (the one clear window — the gold
  back-bar mirror, three shelves of bottles, a pendant, the counter, a patron in a hat), THE JAZZ ROOM (an amber shade ¾ down, the sax
  player's shadow on it), THE APARTMENT (warm wallpaper, a fringed lamp, a picture, the armchair, curtains tied back), THE BACK ROOM
  (three players round a green-felt table under a low green-shaded lamp, cards, its cone of light), the EDGE windows (curtains drawn,
  glowing, a bright gap; ambient only); their warm spill on the brick. The bar goes dark at 3 am, the back room + jazz at 2, the
  apartment's lamp at 1:30 and on again before dawn (7b: its TV glow).
- **THE EDGE WINDOWS:** the screen's left edge cuts the edge column at **45 %** on every upright phone (the speakeasy's x0 is placed
  by screen pt × F, so every width shows the same) — tested at 390 / 402 / 412 / 430.
- **THE BARBER POLE** (the owner's add-on, live): a glass cylinder of red / white / blue spirals in chrome caps that ALWAYS turns — by
  day unlit at the shop's pace (0.42 stripes / s); from DUSK until MORNING lit from inside with a soft incandescent glow (the white a
  cream-yellow, the red warm, the blue dusky violet, a small warm halo; never LED-bright) and turning SLOWLY (0.16), even with the
  CLOSED card up — the secret "we're open". The phase carries over (no jump at the switch). Hook: `harbor().speakeasy.pole({ on:
  false })` snaps it dark + still (7b's raid), `{ on: true }` gives it back.
- **THE ROOFTOP:** the stair BULKHEAD with its door + the CHIMNEY behind the parapet (the deck itself is hidden by the parapet from this
  camera — 7b's parties + the garden stand on it and show above it); the STRING LIGHTS ON (`STRINGS_ON`), MOUNTED on iron posts over
  each pier, round the corner and along the side wall's parapet (no run to a roof pole — it drew a loop over the wheel); bulbs never
  closer than ~5.5 pt on screen (a foreshortened run made one glare). **No water tower:** at ~60 pt it would stand over the OVERCLOCK
  billboard's foot — the plan said "if it reads".
- **THE FRONT ROW** (a new baked group `front`): the furniture nearer than the speakeasy's face (the corner trees, the near lamp, the
  cart, the planters) bakes on its own and draws OVER the speakeasy's live layer — a tree in front of a lit window stays in front of its
  light (`stage.js#furnitureSteps(L, T, keep)`; ~3 MB at 402 tier 2).

### 2. THE GHOST AD + THE CORNER (the plan's SIZE CHECK) — the owner decides
- **THE WEEKLY AD** (`ghostAdGame(ms, ids, avoid)`): one game a week (`AD_ORDER`, each every 12 weeks, the same for everyone), the swap
  Monday 09:00 UTC (4 am Eastern in winter). The billboard right behind the speakeasy picks tonight's game on its own, so on a night it
  shows THE SAME game the ad steps to the next in the rotation for that night (~1 night in 12).
- **THE CORNER TURNED** (`&force=corner-turn`, the panel's SPEAKEASY → CORNER TURNED; `harborLayout(cam, seed, { corner })`): the side
  wall swung out 30° (12 units, its far end in front of the road's kerb) → **78 / 81 / 86 pt** across at 390 / 402 / 430 — the ghost
  ad reads: a faded hand-painted 1920s wall sign (the game's sign colours sun-bleached toward the brick, the FULL NAME condensed + a drop
  shade, its tag line, "— PLAY TONIGHT —"), worn ALONG THE COURSES (runs of bricks where the paint let go, the lower corners worst, the
  mortar lines reading through), under THREE GOOSENECK LAMPS (the billboard's `drawGooseneck`) whose warm pools light it at night
  (`lamp` = the billboard's own `bill` ramp). The west stop light moves just past the wall's end; the wheel + the door stay where they
  were. **THE COST:** the wall's far end reaches the middle of the screen and hides the wheel's left leg + the pier deck — the wheel then
  reads as standing on the speakeasy's roof (Part 2's rule: "never reads as on a roof"). So it is a preview, not the default.
- **THE DEFAULT (the corner as it is) — the plan's fallback (3):** the front has no free brick band without losing windows (fallback 2),
  so the ad is a PAINTED BLADE SIGN (`BLADE`, `bladeGeo`, `paintBlade`): a wooden board on scrolled iron brackets out from the side
  wall by the corner, facing us (~22 × 75 pt), a stepped Deco top, the same weekly game in its sign colours — the full name stacked (two
  words: two columns), faded, the paint worn at the edges, the grain — and TWO GOOSENECK LAMPS over it lighting it warm at night (a lit
  copy, brightest at the top). Clear of the wheel's legs, the pier and the dock (tested at four phones).
- **ASK THE OWNER:** keep the blade (default), or the turned corner + the wall ad (and then move the wheel ~40 pt right, or accept it on
  the roof line)? Either way the weekly rotation, the lamps and Part 8's sign painters work the same (a ladder for the blade).

### 3. THE NEAR BRICK + THE LIGHTHOUSE (the owner's noon notes)
- **The bake resolution** was already right: `near` / `far` / `nearLit` bake at DPR 2 = the main canvas's at tier 2 (390: 33.1 / 64 MB,
  402: 35.7, 430: 41.7; nothing steps down). The softness was the M3 mortar: a half-device-pixel line at 0.36 alpha blurred into a
  tone. Now every brick line snaps to whole device pixels (`blocks.js#pxGrid`).
- **STYLISED READABLE BRICK** (day only, near + mid blocks): 3 device px a course on near blocks (2 on mid), running bond with kiln
  colours brick by brick, darker mortar (full bed joints, fainter heads), panel-to-panel batches (2–4 bays × 2–3 floors), SOLDIER-COURSE
  heads over the windows (`brickTrim(…, F)`), STONE QUOINS (`brickQuoins`), a stone CORNICE with dentils + a soldier frieze
  (`brickCornice`), sills with weathering streaks; the RETURNS in shade (`brickSide`: courses in perspective, darker toward the back) —
  a high sun darkens a side face a step; a low sun still lights it.
- **THE LIGHTHOUSE by day** (`lighthouse.js#cylinderTone`, `dayTower`, `dayPlinth`; laid over by `min(1, 2·T.day)` — never at night,
  golden hour or dusk): Lambert shading from the real sun's side (lit flank, terminator, a cool core shadow, a thin bounce light on the
  far edge, the limbs darker), the red / white stripes snapped to device rows (crisp + bold), faint painted-masonry courses, rust
  streaks under the gallery corbels + each window, a salt-worn mottled base, a coursed rough-stone plinth. Proved with `pixdiff.mjs`:
  night 89 px (the billboard's lamps' noise), party 1 px, dusk 0, golden only the drifting clouds.

### 4. THE PREVIEW PANEL, TIDIED
(`core/harbor-remote.js` + `screens/harbor/remote.js` + `css/harbor-remote.css`; the owner: "it's getting so cluttered")
- **COLLAPSIBLE CATEGORIES from the registry** (`CATS`; every EVENT names its `cat`, `group` is its sub-heading; `catOf(id)` falls back to
  TOOLS; `checkRegistry()` + a unit test): TIME · WEATHER (+ rainbows, lightning, freeze) · SKY EVENTS (messages, aircraft, up high,
  fireworks + the holiday sky, birds) · LIGHTS (the towers, the waterfront) · SIGNS (the city's neon + SPELL-ON, the billboard's lamps, the
  NEON sign + FIRST-TAP) · PARTY SHOW · HARBOR (the wheel, the beam, Rosie, the taxi) · SPEAKEASY (the string lights' party, CORNER
  TURNED) · HOLIDAYS · MUSIC · TOOLS (readout, grid). Collapsed by default; the open ones remembered on this device (`nd:hr-open`);
  each header 52 pt with a count, a dot when something inside is on (green JUST ME / pink EVERYONE), a one-line "what's on", a chevron.
- **PINNED** (sticky, opaque): the title, JUST ME / EVERYONE, the status (two lines) + CLEAR ALL. While the sheet PEEKS (a sky piece just
  started) only the status + CLEAR ALL. EVERYONE mode may grow to 84dvh; its send bar is one row.
- **TIME, in order:** SUNRISE (the real sunrise + 5 min) · MORNING · NOON · AFTERNOON · GOLDEN HOUR · SUNSET (the real sunset − 5 min) · DUSK
  · NIGHT (+ MORE: 3 AM · POWER-DOWN · DAWN · POWER-UP); a tap sends a concrete `when` (Grand Rapids, Oct 22: 08:09 + 18:43).
- **THE WORD TOWERS' TEXT BOX** (`core/harbor-windows.js#towerCapacity / fitText / badChars`, `lights.js#build` — several tickers at once):
  type a message, pick AUTO / A / B / VERTICAL / A + B / A + B + V (+ the style, now with SCROLL), the room per tower live under the box
  ("A HAPPY 5 of 5 · B BIRTHDAY 8 of 4 — SCROLLS"). A message too long for one tower goes ONE WORD PER TOWER; a word too wide for its tower
  SCROLLS there. **The limits (every upright phone + desktop): 3 towers — A 19 × 11 windows (2 lines of ~5 letters), B 15 × 9 (1 line of
  ~4), V 5 × 18 (3 letters down).** Most letters are 3 windows wide (N Q 4; M W ♥ ★ 5; ⚑ 7; I ! . ' 1). 44 characters: A–Z, 0–9,
  ! ? - . ' and ♥ (type <3), ★ (*), ⚑ ([flag]); a scrolling message up to 120 characters. A phone sideways: A has no room, B 4 letters on 2
  lines, V 1 letter.
- **New rows:** CORNER TURNED, FIRST-TAP SURGE (the title reads the live force set: `scene.forced(id)`), SPELL-ON ROUND.
- The pill shows only once its stylesheet has loaded (it flashed unstyled at the page's foot); beside the music button under a dev slot's
  TEST SLOT tag. E2E (`panel`, 21 checks): each preview in its registry category, all collapsed at first, headers ≥ 44 pt, the open ones
  remembered, CLEAR ALL pinned at the bottom, the word towers from JUST ME and from EVERYONE (`city2/live`).

### Hooks for 7b (THE LIFE)
`harbor().speakeasy`: `windows()` → `[{ id, room, floor, col, edge, rect }]` (screen pt; the rooms in `ROOMS`), `light(id, k | null)`
(a window's own level over the timeline), `roomDraw(id, fn(c, win, f))` (a moment's own painter over its window, each frame),
`mirror(k)` (the hidden door's opening — a hook only; the mirror wall is painted in the shop), `pole({ on })` (the raid), `door` (the
knock's rect), `ad`, the debug numbers (`k`, `sidePt`, `mb`). The rooms' still looks live in `speakeasy.js#room()` (one branch per
`lit` kind) — 7b's moments draw over them. `GROUND` names the shop + the basement. The roof deck is free for the parties + the garden
(`L.roof.planters` mark where the beds go; the deck shows only what stands above the parapet).

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, golden hour `T18:20`, night `T22:00`, party `2026-10-24T23:00`, overcast `2026-10-22T13:00&wx=overcast`;
the corner turned: any of them + `&force=corner-turn`; the first-tap surge: a PRIVATE tab by day (no saved audio unlock), tap once
with the music on — or `&force=first-tap`; the spell-on round: `&force=spell-on`; the beat after returning: a party night, music on,
one tap, the home screen for ~30 s, back WITHOUT a tap — the lights keep punching, the readout says `beat direct-grid …`, the AUDIO
header `sounding DIRECT`.

### Tests (7a)
`harbor.test.mjs` (+12: the ghost ad's week + rotation + the billboard rule; the rooms by the hour; the speakeasy on four phones — the
front's size, the edge windows at half, the blade clear of the wheel + the dock, the turned wall ≥ 70 pt with the wheel + the door
unchanged + the west signal outside; the beat's source; the spell-on round; the panel's categories; the word towers' capacity; the
bake DPR; the brick by day only; the lighthouse cylinder; the sun's stages), e2e-harbor (+ the `speakeasy` group: six rooms, the edge
windows at 45 %, the rooms lit at night + the bar's warm pixel, unlit by day, the ad ≠ the billboard, the turned wall 78 / 86 pt; the
string lights on + mounted; music §9 THE BEAT IN DIRECT MODE; the FIRST TAP per mood; the spell-on cycle; the panel's categories).

### Performance (A/B in one run, `title-perf.mjs --ab` against eb6bbbb, 402×874, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` (4×) | 5.27 → 3.84 · 5.47 → 3.61 · 2.31 → 2.37 | 16.8–17.2 · 0 % both | same ×3 |
| `np-night` (4×) | 6.69 → 4.66 · 3.66 → 3.80 · 2.45 → 3.97 | 16.8–17.4 · 0 % both | same ×3 |
| `np-party` (2×) | 8.36 → 8.44 · 4.67 → 5.00 · 3.47 → 3.77 | 16.8–17.1 · 0 / 0.3 % | same ×3 |
The first round (run while a helper's tests still loaded the machine) called tier 0 at night SLOWER (+0.9 ms of scene draw: the string
lights are ON now + the speakeasy's live layer); the one fix: at tier 0 the soft spill glows (round the windows, the sconce's wash, the
pole's halo, the blade's lamp cones) are skipped — the lit rooms, the lamps' lit paintings and the bulbs stay. Re-measured: same. The new
`front` layer is one more full-width band to blend (~220 pt tall).

### Known issues (7a)
- ~~The ghost ad's place is the owner's call~~ — the BLADE (8a; the corner-turn preview removed).
- ~~The corner tree hides the shop's door~~ — 8a's promenade keeps the door + the shop window clear.
- The ad steps aside for one night when the billboard shows the same game (it can't be both weekly AND never doubling the board).
- The back of the speakeasy's roof deck is hidden by its own parapet from this camera — 7b's rooftop life must stand taller than the
  parapet (people, the bar cart, the garden's tall plants) or the parapet needs a lower run there.
- No water tower (it would stand over the OVERCLOCK billboard).
- On a desktop the speakeasy is small at the left of the panorama (the wide camera) and its edge windows aren't cut at half (the rule is
  the upright phone's).
- The returns in shade on the near brick are a fairly deep maroon-violet (the city's shade colour) — `skyBlock#sideOf`'s 0.45 mix if heavy.
- The direct element's output figure (0) is reasoned, not measured on WebKit.

### Handoff → 8a (THE PROMENADE'S LOOK)
The front row now bakes on its own (`front`), over the speakeasy's live layer; `furnitureSteps(L, T, keep)` splits by depth. The corner
trees (`rel(-6)` z 37.4 and the right one) are placeholders that cover the shop's door — 8a decides the trees around the dock and the
shopfront. The speakeasy's side door (the knock), its two steps and the sconce mark where the doorman / the line stand (7b / 8b). The
string lights' `catenary` now spaces bulbs by screen distance (Part 8's promenade strings get that for free).

## PART 8a — THE PROMENADE'S LOOK (+ the 7a follow-ups, the sound slots) (Oct 23 2026; behind `?city=2`)
The owner's iPhone review of 7a: the speakeasy 7–8 / 10 at night, "cozy" — but the placeholder promenade's lamps cast a weird haze over
everything, so the foreground couldn't be judged. This pass gives the foreground its real look. The bar: the night city. Four helpers ran
next to the lead (the sound slots, the pulse + the first tap, the trees, the props); the grey-box stopped twice for the owner (her notes
below). The audio detail lives in docs/audio.md (#the-city-sounds, #8a--the-pulse-after-returning).

### 0. The 7a follow-ups (section 0)
- **THE BILLBOARD ONTO THE SPEAKEASY'S ROOF** (`core/harbor-layout.js#BILLBOARD`, `L.roof.board`; `core/harbor-neon.js` spot `bb-left`, mount
  `speak`; `signs.js#buildBillboard` + its DUNNAGE): over the left half-plus of the roof (u 0.6–7.4, 1 unit in from the roof's back edge — the
  deck in front stays open for 7b's guests + 8b's billposter), raised on its steel lattice frame (0.95 units of open frame ≈ ¼ of the board's
  3.7, the city showing through), catwalk + ladder + the four gooseneck lamps unchanged. **Its feet:** from this camera the deck itself hides
  behind the parapet (7a's note), so the frame stands on a DUNNAGE platform (steel I-beams on short posts from the deck, the way real rooftop
  billboards sit) whose top clears the parapet's line by ≥ 4 pt — the base plates + bolts always show. **Its own baked group `bill`**
  (scene.js: a band from its lamps to the dunnage's posts), drawn right before the `stage` layer — the speakeasy's bulkhead, chimney,
  parapet + string lights stand in front of it; its lamps' light (`neon.draw(c, 'bill')`) the same. At 402: 24 → 99 pt across, 499 → 539
  down; fully inside the left edge at 390 / 402 / 430, clear of the wheel's rim and the vertical word tower's letters (tested). The old
  billboard's lowered near-band roof is gone (the skyline block keeps its own height).
- **THE BLADE SIGN, the name BIGGER** (`speakeasy.js#BLADE`, `paintBlade`): it can't grow wider — the wheel's left leg lands ~3 pt right of
  it — so it grows DOWN the side wall (its foot just above door height, clear of the west stop light) and up to the cornice: ~24 × 104 pt
  at 402 (was 22 × 75). The letters fill their column (up to 1.5× the face's width, a sign-writer's broad stroke). A bug fixed on the way:
  the name was split on `/s+/` (the letter s), so a two-word name ran down ONE column with a gap — DOUBLE | AGENT now stand side by side
  (~10 pt letters); a 9-letter word (OVERCLOCK) ~10 pt a letter. **THE CORNER TURN IS GONE** (the owner picked the blade): `&force=corner-turn`,
  `CORNER_TURN`, the turned wall's painted ad + its three lamps, the layout's `opts.corner`, their tests — all removed.
  **Crowded?** The speakeasy with the roof billboard + the blade + the string lights reads busy but as one lively corner (the lead's call);
  the easy option if the owner feels otherwise: the blade's lamps dimmer at night so the billboard leads.
- **THE FIRST-TAP SURGE whenever the sign is NOT on** — `district/neon-ramp.js#firstTapAnswer` (the sign's real state, not a day / night guess):
  night → `first`; the morning goodbye, day, golden hour's early sputters, polar day → `surge`; the evening WARM-UP window (from the first letter
  sticking to the catch, the last few minutes) → `catch` (lights it for good); reduced motion → `soft`; the intro / a race running → skip.
  (The owner may want the whole hour-long ramp to catch instead: `warmAt` → `plan => plan.startAt`.)
- **THE PULSE AFTER RETURNING** — the city's frame loop died on iOS returns (docs/audio.md#8a); a watchdog restarts it; the readout's beat line
  shows `pulse` (the punch the lights got in the last ½ s); the AUDIO panel's `city` row. **PULSE STRENGTH** (LIGHTS): 50–250 %, default 130 % (FP: 175 %)
  (`core/harbor-beat.js#PULSE_DEFAULT = 1.3` — the owner's pick locks in there, + the two lines in harbor.test.mjs).
- **THE NEON TAP SOUNDS ~25 % quieter** (`title.js#NEON_TAP_LEVEL` × 0.75); the power-on + the catch unchanged.
- **THE SOUND SLOTS + the first five recordings** — docs/audio.md#the-city-sounds (65 slots, 6 filled, `scripts/add-city-sfx.py`, the panel's
  SOUNDS category).

### 1. The layout (the owner approved the grey-box on its third round)
Round 1 (her notes): everything on the promenade far too small next to the speakeasy (a person ~⅓ of its door) → **people ~⅔ of the door
(SIZE.person 20 → 27 pt at z 47), everything else in proportion, the nearest pieces biggest**; fill the bare lower middle; trees by the REAL
date (October: autumn maples), the crabapples small accents; the flagpole floated over the water → then **REMOVED** (flags only on holidays —
a later part dresses the lamp posts); the stop lights + crosswalk off the wheel's base. Round 2: the medallion into the MIDDLE of the open plaza
(the big seasonal pieces stand there: open space round them, never the door or the shop window; an 11-unit Christmas tree there stays under
the wheel's hub — tested); the far-left globe lamp dropped (it stood in front of the barbershop window).
`core/harbor-promenade.js` (PURE): `PROM` (the bands' depths), `PIECE` (the sizes), `PHONE` (where everything stands, by SCREEN FRACTION at its
depth — every phone the same picture; a panorama keeps the phone's stage beside the speakeasy and repeats the curb band), `promenadeLayout()`:
| band | z | what (402 pt) |
| --- | --- | --- |
| the waterside road | 54–64 | the two pole-top 1920s stop lights at f 0.60 / 0.735 (arm 0 — the heads on the poles; `road.js#signalSteps` keeps the mast arm for later), THE CROSSWALK between them, right of the wheel's base |
| the curb band | 52.6 | a sugar maple (f 0.818, crown ~56 pt), a tall double-head Deco lamp (f 0.93, ~70 pt); nothing under the wheel's pier |
| the plaza + the middle | 41–49 | THE MEDALLION (f 0.47, z 42.6 — its ring ~74 pt), the bench (0.665, z 47), the cart (0.778, z 44.4), a crabapple accent (0.405, z 49) |
| the front walk | 36.6–38.8 | two globe lamps (0.355, 0.69; ~60 pt), two big planters (0.15 under the shop window, 0.618), THE FRONT MAPLE (0.893, z 37.2, crown ~80 pt — the nearest, framing the right) |
| the implied road | < 35.6 | its granite curb just under the dock's top, the asphalt below — no car ever drawn |
`L.zones` (8b's walkable areas: the plaza, the walk, the front, the curb + what blocks them), `L.edge`, `L.impliedRoad`, `L.crosswalk`.

### 2. THE GROUND + THE LAMPS (`stage.js`)
- **THE SETTS:** rounded granite in staggered courses, EXAGGERATED ~3× real size (0.95 × 0.72 units) so they read on a phone like the bricks,
  stone by stone its own shade (warm / cool now and then, a worn darker one), the far half — its top facing the sky — lighter, a bright lip by
  day; the joints sand + grime. The curb band: big granite pavers in a running bond. The front curb: long dressed blocks, a lit rounded top,
  the face in shade. The implied road's asphalt: its grain + two worn wheel tracks.
- **THE NIGHT LIGHT — POOLS, NEVER A HAZE** (the owner's "weird haze" was Part 1's wide warm wash over everything): every lamp's pool is
  BAKED INTO THE STONES (`lightField`: each sett takes the light where it lies — lit tops, dark joints; the tall street lamps a clean cool
  white, the globes warm, the speakeasy's warm spill at its door + shop window), overlapping so every path is lit, the shadows between a dim
  violet-grey (never black). The pools' strength is the lamps' ramp in sixths (`T.lamps`, in the bake key — they come up through dusk in a few
  crossfaded re-bakes, like the floodlights): no per-frame cost, and everything standing on the cobbles is drawn OVER its pool. Live, every
  frame: only the lamps' GLASS lit (an opal globe glowing from inside, a white-hot heart) + a small soft halo round each.
  `&force=no-lamp-light` (an A/B tool): no pools baked.
- **THE LAMPS** (crafted, baked): painted cast iron (a deep green-black, its sun side catching the light), brass collars, opal glass. The TALL
  lamp: a stepped Deco plinth, a fluted tapering post with a brass collar + a band, a stepped capital, a crossarm on scrolled brackets, two
  opal globes + a centre finial. The GLOBE lamp: a flaring bell base, a slim fluted post, a Deco cup, one big opal globe + a finial. At night
  the ironwork under each globe catches its light. By day their shadows along the real sun (`sunShadow`: the camera looks north — a morning
  sun on the left throws them right and away).

### 3. THE TREES (`trees.js` + `core/harbor-trees.js` PURE + tested) and THE PROPS (`props.js`)
- **THE TREES** — two sugar maples (the curb one ~56 pt, the big front one ~80 pt framing the right) + a flowering crabapple accent. What a
  tree IS is pure (`core/harbor-trees.js#treePlan`: its skeleton — a trunk with root flare + bark furrows forking into 4 limbs + a leader (the
  crabapple 5 vase limbs) down to fine twigs; ~34 overlapping leaf CLUSTERS (21 on the crabapple), never a ball, the lower middle open so the
  fork shows; its colours; what lies under it), seeded by where it stands (the same branches all year, only the leaves change). `trees.js`
  lights it: every leaf dab lit by its own normal — the sun's side warm + bright, the far side + the underside cool (autumn shadows deep
  crimson / burnt orange, never olive); golden hour warm + low; overcast flat; at night deep tones with the side facing the nearest lamp lit
  (warm under a globe, cool-white under the tall lamp; `ctx.lampK`) + a faint sky rim. A square cast-iron GRATE (a Deco sunburst of bars)
  with fallen leaves / petals. **THE SEASONS:** autumn (today) each maple its own mix (the curb one scarlet-crimson, the front one blazing
  orange with gold + red), some inner clusters green early, thinner crowns + more leaves down after phase 0.7, the crabapple yellow-bronze with
  little red apples; spring the maples leafing out light green, the crabapple in full pink-white BLOSSOM + petals on the ground; summer full
  deep greens; winter fully bare, finely branched (the crabapple keeps a few apples; `ctx.snow` > 0 lays simple snow on the level limbs + the
  grate — 0 today; `ctx.wet` darkens the bark). **`treeShadow`:** dappled crown + trunk + branch shadows along the same sun as the lamps'.
  **`createLeaves`** (live): autumn leaves from the maples, spring petals from the crabapple, a rare leaf late summer, none in winter — more
  later in the season + in a stronger wind, drifting with the real wind, fluttering, landing by their tree, fading ~2.5 s; ≤ 12 at tier 2,
  ≤ 5 at tier 1, none at tier 0 / reduced motion; plain fills. **Cost:** ~1.1–1.5 ms a maple, ~0.75 the crabapple at 1× CPU (~5–6 ms at 4×) —
  each tree bakes in a step of its own (`stage.js#furnitureSteps`: `heavy`).
- **THE PROPS** — one lighting model for all (each surface by the way it faces: the sky + the real sun by day, warm amber at golden hour,
  flat under overcast, deep cool tones at night with the lamp-facing side lit, `ctx.lampK`; brass + enamel glints); depth exaggerated a little
  (×1.35–1.8) so the seats + planter tops read from the camera; cast shadows along `stage.js#sunShadow` + a contact shadow always.
  **THE BENCH:** painted cast-iron Deco ends (curled feet, a stepped knee, curled armrests, stepped finials), oak slats with grain, knots, lit
  edges + bolts, a brass plaque. **THE CART** (by the season, unless `cart.kind` says otherwise): autumn + winter a green HOT CHESTNUTS cart
  (an iron firebox with glowing coals, a brass domed roaster, a chimney with a rain cap, a pan heaped with chestnuts, a scoop, paper bags);
  summer a cream ICE CREAM cart (a pink umbrella, chrome tub lids, a cone on a rod); spring a FRESH FLOWERS cart (a yellow umbrella, zinc
  buckets of tulips + daffodils) — four spoked wheels with gilt pinstripe + brass hubs, push handles, gilt-striped panels, a 14-panel striped
  umbrella with a scalloped valance whose BULBS glow at night with the lantern + the cart's own warm light. **THE PLANTERS:** cast-stone Deco
  (a two-step base, corner pilasters, a fluted panel, a carved chevron band under a projecting lip, speckle, rain streaks, lichen) brimming by
  the season — autumn mums (rust, gold, burgundy) + ornamental kale; summer red geraniums, trailing ivy, white alyssum; spring red + yellow
  tulips over pansies; winter evergreen boughs, red berries, pine cones, birch twigs (`ctx.snow` on the boughs + the lip). **THE MEDALLION:**
  a ring of polished pale granite in 12 slabs (a sheen, a dark joint to the setts), a brass band, a dark green granite field, a compass
  sunburst of 8 brass + 8 cream terrazzo rays (each split light / dark — raised), a brass heart + boss; glinting by day, catching the lamps
  at night.

### 4. THE IMPLIED ROAD (`screens/harbor/roadlight.js`, `core/harbor-promenade.js#roadPassAt`) — the owner's idea, on by default
Cars along the bottom edge are never drawn (moving cars behind JOIN / HOST would be the busiest thing behind the most important buttons) —
only their LIGHT: at night a car's headlights sweep across the near cobbles (a long soft warm pool + a brighter core near the curb) gliding
left or right with it; by day a soft shadow slides along the front walk. ON THE CLOCK (`roadPassAt`: a 40 s slot holds at most one car, its
chance by the hour — `roadBusy`: the evening rush busiest, ~3 am nearly empty; every phone the same; a pass under way joins mid-way, silent);
its SOUND (`car-1920s-pass`, a random take) starts with the pass and the light peaks when the car is nearest (the take's `peak`, ~9 s).
`&force=no-implied-road` switches it off (the setts then run to the screen's foot); `&force=road-pass` a car every ~13 s. THE RAID's hook
(7b): `harbor().road.wash({ col, k })` — a coloured wash rolling up from the front.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Morning `2026-10-22T09:00`, noon `T12:30`, golden hour `T18:20`, night `T22:00`, party `2026-10-24T23:00`; the seasons: `&season=spring|summer|winter`
(or the panel's PROMENADE → SEASON); the implied road off: `&force=no-implied-road`; a car passing: `&force=road-pass`. THE PREVIEW PANEL's new
**PROMENADE** category: SPRING · SUMMER · AUTUMN · WINTER · IMPLIED ROAD OFF · A CAR PASSING.

### Hooks for 8b (THE LIFE) + Part 9 (seasons + weather)
- 8b: `L.zones` (walkable rects + the pieces to walk round), the plaza in front of the door (8 guests, the party line), the medallion's spot
  (`L.medallion` — the seasonal centrepieces), the bench (`L.bench` — sitting), the cart (`L.cart` — its seasonal kind), the curb (the bus stops
  there: no shelter), the crosswalk + the stop lights (`L.signals`, the cycle), `harbor().road` (a pass now — 8b's traffic can sync with it), the
  lamps switching on one by one (the city schedule: today they come up together with the lamps' ramp; a per-lamp switch needs a live overlay or a
  re-bake per lamp).
- Part 9: `pieceCtx(L)` carries `snow` + `wet` (0..1) into every piece's art (the trees' snow on branches, the planters); the ground's hooks: the
  setts' joints (snow settles there first), a wet sheen + the lamps' reflections + puddles (the light field `lightField` is the reflection's
  source); `L.snow` / `L.wet` are 0 today.

### Tests (8a)
`harbor.test.mjs`: the roof billboard (inside the left edge at 390 / 402 / 430, clear of the wheel + the word towers' letters, its feet above the
parapet, ~¼ open frame); the promenade (the medallion clear of the door, the shop window + the furniture, an 11-unit centrepiece under the wheel's
hub, nothing under the dock, no tree cut by an edge, no flag, the stop lights right of the wheel's base); the season by the date / forced / the
south; the implied road's passes (the same for everyone, the evening busier than 3 am); the size rules at the owner's scale; the trees (crowns
inside their boxes, the seasons' plans) + the props (every prop × season × look draws clean, the shadows by day only); the panel's PROMENADE rows;
the sound slots (`city-sounds.test.mjs`); the pulse + the first tap. e2e-harbor: the new `promenade` group (the layout, autumn on Oct 21, the
lamps' glass, the medallion, THE POOLS — a patch by a globe lamp lit vs `&force=no-lamp-light`, a forced car pass + a forced season, the road
off), `sounds`, `music` §10, `panel`.

### Performance (A/B in one run, `title-perf.mjs --ab` against 8b73a7e, 402×874, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` (4×) | — · 6.54 → 6.12 · 2.66 → 4.34 | 16.8–17.0 · 0 % both | same (t1, t0) |
| `np-night` (4×) | 7.77 → 4.79 · 4.19 → 4.18 · 2.75 → 4.63 | 16.8–16.9 · 0 % both | same ×3 |
| `np-party` (2×) | 9.39 → 8.97 · 6.2 → 6.33 · 4.22 → 4.39 | 16.8–17.0 · 0.3 → 0 % | same ×3 |
The promenade is BAKED (the setts, the pools, the trees, the props): per frame it adds the lamps' lit glass (5 small sprites), the road's light
(a pass at a time: 2–3 sprites) and the falling leaves (≤ 12 fills). The bakes: each tree its own step (~5–6 ms at 4× — the heaviest step).

### Known issues (8a)
- The pools step in sixths of the lamps' ramp (re-bakes crossfaded over 1.2 s) — a lamp can't switch on alone yet (8b's city schedule).
- The tall lamp's pool on the curb band sits behind the front maple's crown at 402 (the maple frames the right side — the owner's ask).
- DESKTOP / the wide camera: the panorama's promenade is sparse (a wide sea of setts, a few lamps + trees repeating) — Part 12's desktop pass.
- The placeholder people (8b) stand where 8b will walk them — some over the planters / by the medallion in the shots.
- ~~The bench is the farthest prop from the lamps: at night it reads as a dim silhouette~~ — FP: the bounce light + a tall lamp beside it.
- Winter's bare branches are dim at night until Part 9's snow; the crabapple's blossom could be fluffier / whiter.
- The levels of the five recordings were set by analysis, not by ear (docs/audio.md) — the owner's ear decides.
- WebKit can't run here: the pulse-after-returning fix is proven on Chrome with WebKit's failure emulated; the owner's iPhone decides.
- e2e-harbor's `perf` group fails on this machine with `Protocol error (Runtime.callFunctionOn): Promise was collected` — the SAME on the
  commit before (8b73a7e, run the same way): a harness / Chrome flake, not this pass; the A/B perf (title-perf.mjs) is the gate and says same.
- The `core` group's RE-LAYOUT probe now averages an 8 × 8 pt patch of the cobbles in front of the shop (Part 1's single pixel sat on the
  placeholder corner tree, gone — on the shop window's edge it read the DPR change as a 73-point jump).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
The foreground is now real: judge the city's look with it. 8b walks the people on `L.zones`, drives the cars + the bus on the road (the
implied road's passes are on the clock: sync the traffic with `roadPassAt`), the stop lights' cycle, the city schedule (lamps on one by one: a
live overlay over the baked pools), the gulls on the roof billboard's top edge + catwalk, the billposter on the roof (the billboard's catwalk
+ ladder), the sign painters on the blade (a ladder), the dog walkers on the front walk.

## FP — FOREGROUND POLISH (Oct 23 2026; the promenade re-layout, the billboard, the stop lights, the barber pole, the sounds; behind `?city=2`)
The owner's iPhone review of 8a: the trees, the cart and the cobbles gorgeous, the haze gone — but the promenade CRAMPED (almost everything
in the middle of a thin strip, no open floor). This pass re-lays it and fixes the speakeasy corner; every piece's art kept. Four helpers ran
next to the lead (the beat, the sounds + the panel, the stop lights, the billboard + the pole); the audio detail is in docs/audio.md#fp.

### 0. The beat after returning → docs/audio.md#fp--the-beat-from-the-songs-position
The beat already followed the element; the readout's `bar` was a count since the page opened (≈ the context's age — why it matched `ctx t`).
Now a pure SONG CLOCK on the element's currentTime (re-anchored on every play / pause / seek / stall / visibility / rebuild, and when it drifts
> 30 ms), the song's own bar + beat on the readout with `drift ±N ms`, and the HEARD OFFSET (are the kicks through Web Audio off the grid?).

### 1. THE PROMENADE RE-LAYOUT (`core/harbor-promenade.js#PHONE`, `stage.js`, `props.js`)
FURNITURE ON THE EDGES, AN OPEN FLOOR IN THE MIDDLE, THE FRONT EDGE CLEAR. At phone size the strip is only ~70 pt deep (402: the road's kerb
y 682 → the dock 758), so depth stacks on screen — the rules that decided it: no curb tree in front of the two stop lights, the lantern or the
crossing's landing (f ~0.58–0.76); the framing maple's crown covers the right quarter (whatever stands behind it is hidden).
| band | z | what (x pt at 402) |
| --- | --- | --- |
| THE BACK ROW (the curb) | 50.4–53.1 | maple 150 (beside + behind the blade) · tall double lamp 183 · maple 204 with THE BENCH under it (z 50.4, in the lamp's cool light) · [the crossing's landing 246–290, open] · tall double lamp 312 |
| THE OPEN FLOOR | 38.4–50 | clear cobbles from the shopfront to the right edge; THE MEDALLION at its centre (197, z 43.4 — roughly under the wheel); THE CART on its open right side (268, z 41.8, in front of the crossing); THE URN against the speakeasy's corner (152, z 45.6 — beside the side wall, never in front of the door or the shop window) |
| THE FRONT EDGE | 36.6–38.2 | only two short warm globes, one at each corner (129 by the speakeasy's corner, 387 by the right edge) + ONE big framing maple at the far right (357, crown ±43, clear of the cart) |
- **Changed from the sketch (the screen's numbers):** the sketch's curb PLANTER is gone — it would stand hidden behind the framing maple; the
  ONE crafted planter is the corner urn ("fewer planters, better ones"). The crabapple is no longer on the phone (the approved row is
  maples) — it stays in the code for the panorama's front row, so spring has no pink blossom on a phone today (easy to bring back: the
  curb maple by the blade could be the crabapple).
- **THE URN** (`props.js#drawPlanter`, the 8a box replaced): a 1920s Deco garden urn in the speakeasy's cream terracotta on a square two-step
  plinth (a recessed panel with a carved fan, moss at the foot) — a turned foot, stem + knop, a GADROONED bowl (14 lobes, each crest + groove
  lit by its own normal), a fillet, a carved CHEVRON frieze, a rolled lip; every band a lathe surface (lit side → core shadow → bounce),
  speckle, rain streaks, chips. Planted like a gardener fills an urn: a THRILLER (autumn purple fountain grass + plumes, summer a dracaena
  spike, spring tall white tulips, winter red-twig dogwood), FILLERS (the season's flowers as clusters with leaves — the mums without the kale
  rosettes, which read as "eyes"), SPILLERS (ivy trailing over the lip and hugging the bowl; summer + white bacopa; winter cedar sprigs); no
  bare soil (the inside of the lip is shadowed leaves). Its cast shadow follows the urn's shape.
- **THE BLADE IN FRONT OF THE TREE** (`speakeasy.js#bladeStep`, `scene.js#rebake`): the furniture beside the side wall was baked after the
  WHOLE speakeasy, so a curb tree behind the blade covered it. The blade is now its own bake step, after that furniture.
- **THE PEOPLE** (placeholders, `harbor-layout.js`): on the open floor — the couple window-shopping at the barbershop, the doorman left of the
  side door (the corner globe at its right), the dog walker crossing the floor, the hail at the crossing's landing.
- **THE NIGHT LIGHT PLAN** (`stage.js#LIGHT/REACH/lightSources`, baked into the setts as in 8a): cool pools under the two tall curb lamps
  (reach 6.2 → 10.5: the back row, the road's edge, the bench), warm pools from the two corner globes (5.6 → 7.6) across the front of the
  floor, the speakeasy's warm spill (3.6 → 4.2), the CART's string-light glow on the cobbles (new: warm, 6), the medallion where they
  overlap; dim violet-grey (never black) between, no haze. **THE BENCH READS AT NIGHT:** its lamp stands behind it, so its faces got no light —
  `props.js#lit` adds a BOUNCE off the lit cobbles (every face near a pool gets a soft fill of the lamp's colour).

### 2. THE SPEAKEASY CORNER (`core/harbor-layout.js#BILLBOARD`, `signs.js#buildBillboard`, `speakeasy.js`)
- **THE BILLBOARD on a SHORT, CLEAN frame:** the open frame under the board 0.95 → 0.5 units (~⅛ of the board's 3.7); at 402 the board
  24 → 99 pt across, 504 → 544 down, the frame ~5 pt, the board's foot 3.4 pt above the string lights' posts. A dark backing under the board
  (the brick city no longer shows through), five posts + a Warren truss of diagonals + a mid tie on the dunnage beam (base plates, short posts
  to the deck), a soft shadow on the roof (mostly hidden by the parapet), the catwalk + ladder + the four lamps unchanged. Inside the left
  edge at 390 / 402 / 430 (x 23.6 / 24.3 / 26.0), clear of the wheel + the word towers (tested). The stair bulkhead + the chimney moved out
  from under it (u 8.1–9.9 / 10.5: a small stair house at the right corner of the roof).
- **THE BARBER POLE AT NIGHT, smooth + bright:** the stepping came from hard-edged stripe shapes re-drawn at a new spot each frame (a 2.3 pt
  pole moving ~1.6 pt a second crawls pixel by pixel, worse at 30 Hz). The stripes are now real helices painted ONCE into a strip texture
  (3 px a pt), slid under the glass by a fractional amount each frame (`poleTurn`, `POLE_DAY` / `POLE_NIGHT`: the same phase at 60 + 30 Hz,
  tested). At night a warm WHITE glass (`POLE_LIT`) with a brighter core + a two-layer soft halo — the hero light of the shopfront; the lit
  shading's grey middle stop removed. The DOOR SCONCE (core 1 → 0.55, wash 0.35 → 0.16) and THE SHOP'S LAMP (glow 0.5 → 0.26, bulb 0.8 → 0.65)
  toned down, both a soft round falloff (`softGlow`, no hard edge). The raid still snaps the pole dark (`pole({ on: false })`).
- **BUSY CHECK (402, night):** the lower billboard calmed the corner a lot; on party nights a light blade (e.g. OVERCLOCK) was still the
  biggest warm slab, so **the blade's lit board is dimmer at night** (× 0.78, `BLADE_LIT`; its lamps' wash 0.22 → 0.16; the bulbs unchanged) —
  the 8a suggestion, easy to reverse.

### 3. THE STOP LIGHTS + THE CROSSING (`road.js#signalSteps`, `drawSignalLamps`, `drawLanternBody`, `drawLantern`; `core/harbor-promenade.js`)
- **The heads face ALONG the road:** a 1920s two-way head seen side-on on a cast-iron post (brass collars, a domed cap + finial, a hinge line
  + rivets), three hooded lamps each side pointing along the road; the lit lens under its hood with a white-hot centre, its glow spilling
  along the road (small by day, long after dark). ~5.3 × 20 pt a housing, ~15 pt across with the hoods.
- **THE WALK / WAIT LANTERN** on the far side, facing us (`LANTERN`, `L.crosswalk.lantern`: at the railing, the middle of the crosswalk's far
  end — the gap between the tall lamp and the curb maple): a period box (a post, a pitched cap + finial), WAIT over WALK, ~22 × 27 pt, letters
  6.7 pt; baked into the road layer (a passing bus hides it), the lit pane live (WAIT red-orange, WALK pale green-white). `roadTop()` reaches
  its cap (the road band ~45 pt taller).
- **ONE CYCLE on the city's clock** (`signalAt(ms)`, PURE — every phone the same; both heads show the same: one road; 8b's traffic + people use it):

  | phase | s | road | lantern |
  | --- | --- | --- | --- |
  | go | 24 | green | WAIT |
  | amber | 3 | amber | WAIT |
  | clear | 1.5 | red | WAIT |
  | walk | 11 | red | WALK |
  | blink | 5 | red | WAIT blinking (1 Hz, 55 % on) |
  | hold | 1.5 | red | WAIT |

  `harbor().crossing`: the state, the lantern's box + panes, the heads.

### 4. THE SOUNDS → docs/audio.md#fp--the-sounds
The water ~10 dB quieter with a 1.6 kHz low-pass, the whole bed ducked under the music and waiting for the song to start, the hums lead,
the gulls in varied runs, the cars a touch lower.

### 5. Small fixes
- **PULSE STRENGTH default 175 %** (`core/harbor-beat.js#PULSE_DEFAULT = 1.75`, the owner's slider value); the slider stays.
- **THE DEBUG TOOLS IN THE PANEL** (`js/ui/debug-tools.js`; THE PREVIEW PANEL → TOOLS → "ON THIS PHONE — REMEMBERED, NO LINK NEEDED"):
  READOUT (the green box) + AUDIO PANEL, each on / off live, remembered on this device (`localStorage na:dbgtools`), never sent to
  EVERYONE; `&debug=1` still shows both (a switch flipped during the visit wins for that visit). `diag.js#unmountAudioDiag`; `app.js` mounts /
  unmounts the AUDIO panel live.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Noon `2026-10-22T12:30`, golden hour `T18:20`, night `T22:00`, party `2026-10-24T23:00`; the sound check: the night link + `&force=road-pass`.

### Tests (FP)
`harbor.test.mjs` (131): THE RE-LAYOUT on three phones (the back row clear of the stop lights, the lantern + the crossing's landing; the floor
holds only the medallion, the cart + the corner urn; the urn against the side wall, clear of the door; two corner globes + one framing maple
clear of the cart; the bench by a tall lamp); the trees with the panorama's crabapple; the props (the urn in every season + look); the
billboard's short frame (> 0.05, ≤ ⅙ of the board, its foot 1.5–6 pt over the string lights at 390 / 402 / 430); the pole's turn (60 vs
30 Hz, sub-pixel, the wrap); the crossing's cycle + the lantern on the phones; THE SONG CLOCK + THE HEARD OFFSET; the pulse at 175 %;
`city-sounds.test.mjs` (the bed's levels + duck / hold, the gulls' pattern, the debug switches). e2e-harbor: `promenade` (THE POOLS now beside
the left globe, read once the frame is steady — right after the bake settles the city is still fading in: 9 → 106 over ~4 frames; the
crossing + the lantern's lit pane), `speakeasy` (the pole's glass brighter than the sconce + the shop lamp, its turn, the raid), `music` §11
(the element paused / the context suspended / a seek — the beat on the song's grid; `drift` on the readout), `sounds` (the water's low-pass,
the duck), `panel` (175 %, the tools). The whole suite: 260 / 261 (below); the unit suite 525; the smoke check (GAMES=cipher — `app.js` is
shared): 3 / 3.

### Performance (A/B in one run, `title-perf.mjs --ab` against e2190f7, 390×844, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` (4×) | 5.59 → 4.31 · 6.16 → 3.46 · 2.52 → 4.18 | 16.8 · 0 % both | same ×3 |
| `np-night` (4×) | 9.1 → 5.2 · 3.93 → 4.31 · 2.61 → 2.77 | 16.8 · 0.7 → 0.4 % | same ×3 |
| `np-party` (2×) | 9.41 → 9.77 · 5.05 → 5.51 · 3.5 → 3.93 | 33.2 (t2) / 16.8 · 5.3 → 4.6 % | same ×3 |

Everything new on the promenade is baked (the urn, the pools, the lantern's body); per frame: the signal lamps' glow, the lantern's lit pane,
the pole's strip blit.

### Known issues (FP)
- e2e-harbor's `water` NO SEAMS (tier 2) sits on its limit in the parallel run (the meeting rows 99.1 % vs the rest 100.7 %, the limit
  1.5 points; the commit before: 99.4 vs 100.3) — it passes run alone; the new light in that band (the lantern, the signals' glow) is the
  likely nudge. Not a seam (no strip boundary moved).
- The heard-offset SKEW path is proven only in the pure test (no browser here can offset Web Audio from the element); WebKit's currentTime
  after returning is unverified — the owner's next readout (`drift`, `clock el`, `heard`) tells.
- No crabapple (no spring blossom) on the phone; no curb planter (it would be hidden).
- The cart's umbrella covers the crossing's near end; the tall lamp at 183 stands under the wheel's deck.
- The bulkhead + chimney moved on the roof (no test pins them); 7b's rooftop life plans round the new spot.
- The lit signal lens is a ~3 × 5.6 pt sliver: it reads mostly by its glow; at night the lantern's iron body is a silhouette (the lit word
  carries it).
- A half-resolution full-screen layer late in the frame dims the pole ~19 % — the e2e compares the lights against each other.
- Only the BED ducks under the music (the sky loops + the one-shots don't); the levels are LUFS arithmetic, not listened to; the "waits for
  the music" hold is unit-tested only (headless Chrome's music sounds at once).
- ~~The bench reads as a dim silhouette at night~~ (8a) — fixed (the bounce light + the tall lamp beside it).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
8b: the CYCLE is ready (`signalAt` — stop on red, cross on WALK, the lantern already in step); `L.zones.plaza` is the new open floor; the
medallion is the centrepiece spot (an 11-unit piece there stays under the wheel's hub); the cart is static — its route crosses the floor.
(FP2 below moved the medallion + the cart and wrote the cart's rule.)

## FP2 — FOREGROUND POLISH 2 (Oct 24 2026; the beat skew, the promenade tweaks, the street under the dock, crisp lights, the pole, party timing, neon by depth; behind `?city=2`)
The owner's verdict on FP: "a big jump" — the first time the city reads as one finished picture (~8 / 10). This pass finishes the foreground;
every piece's art kept. Four helpers ran next to the lead (the promenade + trees, the street + cobbles, the lights + the pole, the neon by depth
— the owner's add-on); the lead did the beat + the party timing. Audio detail: docs/audio.md#fp2.

### 0. The beat after returning — the SKEW → docs/audio.md#fp2--the-lead-re-measured-after-a-return
Her readout's `heard +107 ms SKEW` with `lead −39 ms` = the element → graph offset moved on the return and the lead (±80 ms of a beat only)
could never follow. Now a RE-MEASURE on every resume / rebuild / page return / route change and on a SKEW seen alone (`core/harbor-beat.js#
leadRefresh`, `leadKick`): ~10 kicks (≈ 2½ bars) for a 100–146 ms shift; the readout shows `lead −39 → +50 ms (re-measuring · 8 kicks ·
visible)` then `(re-measured −39 → +104 · 3 s ago)`.

### 1. THE PROMENADE TWEAKS (`core/harbor-promenade.js#PHONE`, `core/harbor-trees.js`, `trees.js`, `road.js`)
| piece | x pt at 402 | z | change |
| --- | --- | --- | --- |
| the red curb maple behind the blade | — | — | REMOVED (the corner clean, the wheel's left leg shows to the deck) |
| the corner urn | — | — | REMOVED (`planters: []`; `drawPlanter` kept for the panorama) — no planter on the phone |
| THE CRABAPPLE over the bench | 163 (crown ±23) | 52.9 | the bench tree, now a FLOWERING CRABAPPLE (k 1.25): blossom whiter / fuller (24 clusters), golden autumn + red fruit, bare winter |
| the bench | 158 (137–179) | 50.4 | moved left: 4.0 / 4.2 / 4.5 pt clear of the cart's umbrella at 390 / 402 / 430 (tested) |
| the tall lamp | 177 | | (was 183) |
| THE CART | 213 (umbrella 183–241) | 41.8 | left of the medallion, its body 5.8 pt clear of the ring |
| THE MEDALLION | 273 (ring ±36) | 43.4 | the middle of the open floor, in front of the crossing's landing (252–300) |
| the tall lamp | 312 | | |
| THE FRAMING MAPLE | 357 | 38.2 | rebuilt (below) |
- **Moved a little further than the owner's ~265 / ~200 / ~160:** with the cart at 200 its umbrella (±29 pt) covered the bench's right end;
  so the cart moved right and the medallion with it — 273 is exactly in front of the crossing.
- **THE 8b RULE — the cart + the centrepiece** (`EVENT_CLEAR = 4` units, `L.cart.route = { x0, x1, z }`, `L.cart.stopX`, `L.medallion.clear`):
  on a normal day the cart may roll across the medallion along `route` and people walk over it; during an EVENT on the medallion (a seasonal
  centrepiece, a show) the cart stops short at `stopX` / stays `EVENT_CLEAR` away from its centre.
- **THE HEIGHT CAP** (`centrepieceCap(cam, m, limits, pad)`, `CENTRE_PAD = 8` pt): a centrepiece's top stays 8 pt under the LOWER of the
  vertical word tower's blade bottom (`signSpots` 'n-blade') and the wheel's hub — always the blade: 11.4 / 11.4 / 11.5 world units at 390 /
  402 / 430 (~158 pt at 402) — a Christmas tree fits. It stands in front of the crossing, so a tall piece hides the WAIT / WALK lantern while
  it's up (the owner's choice).
- **THE PARKED BUS — and the parked placeholder cars — gone** until 8b (`road.js#PARKED_TRAFFIC = false`; `L.bus` / `L.cars` stay in the
  layout): the sedan showed stopped through the bare winter maple too. **THE LANTERN on a proper post:** a granite FAR KERB under the railing
  (`FAR_KERB`), the lantern on a granite footing stone, a stepped plinth, a fluted shaft, two brass collars — its base in view, nothing in
  front of it (tested).
- **THE FRAMING MAPLE** (`core/harbor-trees.js`): a sturdier trunk (0.54) forking lower into five even limbs, a fuller rounder crown (46
  clusters, fewer on the branch tips, a smaller window onto the fork); `deepen()` — the inner clusters a richer, more saturated version of their
  own colour (deep orange-red in autumn, deeper green in summer) instead of the old darken-to-brown; `trees.js`: the crown's core lighter
  (0.5 → 0.62), a warm BOUNCE from the cobbles (sunlit by day, the pools at night) on the downward leaves, a warmer autumn shade (never olive);
  `v: 1` pins its mix to BLAZING ORANGE (it drew gold-amber by its index; `v: 2` brings that back). At night a deep maroon-red with the globe's
  warm side lit — no black mass.

### 2. THE COBBLES AT NIGHT (`stage.js`, `street.js#paintSett`)
The piano keys came from near-black joints (`JOINT.n` [30, 28, 46]) under bright tops. Now a packed-sand GROUT (`[54, 50, 66]`), painted cell
by cell and lit by the baked light field at 0.42 × the stones' light; each stone through ONE painter shared with the street (`paintSett`): at
night its top fades softly into the body, the near edge falls off toward the grout (never black), the lamps' extra on the tops 0.5 − 0.24 ·
night (the sheen kept); by day crisp as before (a hard top edge + a hairline of shade). Night sett rows bake two per step (was four).

### 3. THE STREET UNDER THE DOCK — full-bleed (`street.js`, `motorcar.js`, `roadlight.js`, `core/harbor-promenade.js#STREET`)
No camera slide: the scene runs to the screen's foot and the band under the dock is a FINISHED STREET (`streetSteps`, baked): the grout base,
granite gutter slabs (z 34.2–35.6; ~3 pt show under the curb's face — the curb still lines up with the dock's top, 758 / 759.6 at 402), the
street's own setts (0.74 × 0.6, cooler + darker than the promenade's, polished tyre paths, an oil line per lane), ONE STREETCAR TRACK (rails in
granite stretchers, the groove, a rusty flank, a polished head catching the lamp pools; z 28.06 / 29.76), a cast-iron MANHOLE (z 33.2, f 0.7)
and a DRAIN grate (f 0.17, its inlet in the curb face: `streetOver`), the season in the gutter (autumn leaves, spring petals, winter grit).
The band is 116 pt on 390 / 402 / 430 (lanes z ~30.1 west ← / 25.6 east →; the street's foot z 23.7 at 402).
- **THE CAR** (`motorcar.js`): while the dock RESTS (`title.js#tagState` → `S.dockGone`), the implied road's pass (`roadPassAt` — the same
  clock, its `car-1920s-pass` sound) is a 1928 TUDOR SEDAN seen side-on in one of five paints by the take (maroon, bottle green, Niagara blue,
  primrose, black): the body baked once per look (day / golden / night / night-under-a-lamp) × lane × paint × dpr (≤ 12 sprites); live: wooden
  spoked wheels turning by the distance rolled (a half-step motion ghost), a fraction-of-a-point bob, the under-a-lamp sprite crossfading in by
  the pools. Its light: by day the sun's cast shadow (`sunShadow`) + the shade under it; at night the headlamp's white-hot core + tight halo,
  its pool on the cobbles ahead, glints along the rails, a red tail ember. At 402: the far lane 99 × 41 pt (roof under the dock's top: the dock
  covers it whole as it fades back), the near lane 116 × 48 pt (~1.4–1.65 × a person on the promenade); nearest at the take's peak, ~5.3 units
  a second, ~4.9 s on screen. Fades in over 1.8 s after the dock rests (`carVis`), gone in 0.25 s when it returns; with the dock shown only the
  old LIGHT (the sweeps, the shadow) as in 8a; reduced motion: no car (the light stays). The frame runs fast while it shows (`fastNow` → `car`).
- **THE WET HOOK** (Part 9): `streetWet({ force, wet })` → `L.wet` (in the bake key, `scene.js#wetNow`) — soft sky puddles + lamp reflection
  streaks; `&force=wet-street`, the panel's PROMENADE → WET STREET. Rough on purpose: Part 9 finishes it.

### 4. CRISP LIGHTS, NEVER SMOKE (`speakeasy.js`, `stage.js#drawLampLight`, `props.js`)
THE RULE (every light on the promenade): the SOURCE (a bright core) + a small TIGHT halo + light LANDING on the surfaces near it (baked) — no
wide additive wash over the facade.
- **The pole's cloud is gone** — a ~28 pt warm `soft(…)` (a 56 pt fog over the window, the awning + the brick) and a second `r × 4.6` one. Its
  halo is a small pre-baked sprite (`POLE_HALO` in glass radii: tight 1.8 → gone ~4.2 pt from the glass at 402; a faint cool land on the brick
  4.2 → gone ~9.8 pt) + a small cool pool on the cobbles at its foot (`stage.js` `LIGHT.pole` / `REACH.pole` 2.6, baked).
- **The shop's lamp:** the 13.8 pt cloud → a tight halo (`SHOP_GLOW.lamp` 0.34 units, ~4.7 pt); the warmth kept by the light landing INSIDE
  (`paintLit`'s pool 0.6 / 0.42 / 0.18 at r 2.9, a warm floor pool, a brighter globe core).
- **The door sconce:** its glass drawn lit (the source), a tight halo (0.42 units, ~5.8 pt); the 1.7-unit (~23 pt) wash → light landing on the
  wall BAKED into the night facade (`paintGround`, by `T.lamps`): a warm scallop on the brick, the door's granite frame + the oak, gone within
  `SHOP_GLOW.landR` 1.3 units. The blade's lamps' wash `l.W × 3` → `× 1.5` at 0.14.
- **The street lamps' halos** tighter (`LAMP_HALO` in globe radii: globe 3.6 → 2.4, tall 3.2 → 2.2, inner 1.7 → 1.45); the cart's bulbs 0.32 →
  0.24 units and its lantern 0.55 → 0.4, both with a steep falloff.

### 5. THE BARBER POLE (`speakeasy.js#polePhase`, `poleAnchor`, `poleStripe`, `poleColours`)
- **At night an LED-like cool white** (`POLE_LIT` w [240, 247, 255], r [255, 52, 70], b [58, 112, 255]): cool-dark glass edges, a brighter
  additive core, the caps catching cool light — still the hero (e2e: glass 207 vs the sconce 119, the shop lamp 125).
- **THE JITTER (the likely cause):** FP's strip texture was rasterised at 3 px a pt while the canvas runs at dpr 1.5 (tier 1) / 2 (tier 2) — a
  2 : 1 or 3 : 2 bilinear DOWNSAMPLE every frame (a slow slide crawls + shimmers that way), and a browser snapping images to whole pixels steps
  it. Now the glass is computed PER DEVICE PIXEL every drawn frame (~10 × 56 px, < 0.1 ms): each pixel's stripe coverage filtered
  analytically over its footprint (`poleStripe`), the cylinder's edges the same; the patch placed 1 : 1 on a whole device pixel (nothing
  resamples it). The phase is a pure function of the frame's timestamp (`polePhase` / `poleAnchor` — re-anchored only on a rate change, a
  backward clock held; no dt sums, no 0.1 s clamp). `poleTurn` kept for compatibility.
- **The 30 fps battery saver:** `scene.js#frame` draws every other rAF by day when nothing fast runs — one canvas, so the pole isn't exempt
  (that would be the whole city at 60 fps all day); with the time-based phase + the analytic glass 30 fps is just fewer, evenly spaced
  positions (by day 0.27–0.32 device px a step at dpr 2 ≈ 0.14 pt; at night ~0.05 pt). Measured in headless Chrome at dpr 2 + dpr 1.5 / dsf 3:
  the rendered offset follows the clock within 0.08–0.11 px rms, steps near-constant. (Headless Chrome was already smooth with FP's texture:
  the fix removes both suspects — the owner's iPhone confirms.)
- **PARTY NIGHTS** (`poleColours`; `speak.draw(…, { party: { ramp, punch, pal } })`): red → magenta, blue → electric blue, white → gold, by the
  party's ramp × lit (back to red / white / blue through the 2 am wind-down); the beat lifts the colours ≤ 22 %, the halo × (1 + 0.5 · punch),
  the core × (1 + 0.4 · punch); the SAME slow turn (0.16 periods a second at night). The raid still snaps it dark + still.

### 6. PARTY-NIGHT TIMING, EARLIER (`core/harbor-show.js#HARBOR_PARTY`, `harborPartyPlan`, `partyReadyHour`, `harborParty`; `scene.js#partyPlanNow`)
Warm-up from 8:30 pm, THE PEAK from 9:30 pm, the midnight finale (Part 10's hook), calming after 1 am, back to normal at 2 am (core/party.js's
window + wind-down kept; City 1.0 untouched). The show needs darkness: the warm-up is 8:30 OR when tonight's blue-hour power-up finished
(`partyReadyHour`: the real sun, bisected on `darkness()` + `partyReady`, once an evening), whichever is LATER; the peak 9:30 OR 45 min after the
warm-up. Grand Rapids: October ready ~7:15 pm → 8:30 / 9:30; midsummer (20 June) ready ~10:00 pm → the warm-up then, the peak ~10:45. A white
night (never dark enough): no ready hour, the live darkness gate keeps the show off. The sky beams come on one by one from the warm-up to the
peak (was 8:54 → 11 pm); the PARTY music mood from the warm-up too (`core/city-mood.js`). `__district.party().plan`.

### 7. NEON BY DEPTH (the owner's add-on: "overlapping buildings share the same pink outline — BLUFF / DOUBLE AGENT and the buildings in front read as one blob") — `core/harbor-neon.js`, `core/harbor-show.js`, `neon.js`
At 402 the city palette had 10 clashing front / back pairs (of 41) → 0; the party 18 pairs clashing in at least one scene (of 34) → 0 (of
41); 390 + 430 clean too.
- **THE RULE** (`DEPTH_HUE = 60`°, `neonHue`, `neonClash`, `roleClash`): a building in front never shares its outline's hue with the one
  behind it (≥ 60° apart); two PALE tubes (white, ice — `PALE` 0.35) always clash, a pale one next to a colour never does.
- **THE PAIRS** (`depthPieces` — each building's silhouette + the lighthouse —, `depthContacts`): two visible tubes at different depths
  within 4.5 pt (their glows merge), OR a building + the nearest lit building showing just above its roof (`over`: the owner's case — the word
  tower's edges come down beside the block, the block's roofline under its face), compared on the main colours. One envelope pass, ~5–12 ms a
  layout; `outlines()` carries `contacts` (band lines a `slot`: 0 main, 1 accent, 2 detail).
- **WHO ADAPTS** (`fixDepth`, front first): a band building re-pairs (the next pairing of its district family → the band's other families →
  white swapped for a colour → two re-paired together → last resort a far-band thread goes quiet: only `far20` at 430); panorama towers too
  (`PANO`, `PANO_X`); neighbours left → right still never share a main colour. Designed roles changed: `m-step` teal + violet (was + pink:
  behind the sunburst's pink), `m-right` magenta + gold (was + cyan: behind word tower B's cyan), THE HOTEL white (was red: against the
  sunburst's pink + amber), the calm zone's near-band rooflines gold (`CALM`, was white — the lighthouse's white edges cross them; the far
  band stays white).
- **THE PARTY BY DEPTH** (`PARTY_RING` gold · green · blue · violet · pink · red round the hue circle; `partyColours(off, n, h)` one step a
  scene, the accent opposite or white; `ringBase` — neighbours 2–3 steps apart, which also cures "the warm half reads pinkish"):
  `partyPlan(pieces, links)` gives every BUILDING (not the cluster) a place on the ring + an accent, once a layout (~2–30 ms on phones): linked
  buildings always 2–4 steps apart (≥ 73° of hue), neighbours never one main colour, the six hero + word towers six different colours (never
  white), all-white only for white / calm buildings unless a knot can't be untied (at 390: `near5a`, `near26`). `planColours(e, n)`;
  `partySprite` keyed by the scene mod 6, coloured per building; the party's racers on per-building paths (`raceP`); `beamCols` from the plan;
  TIER 0's party a still frame of the plan (was `SCHEMES.party`); the normal night's colour rotation + scheme stages skip a colour that clashes
  with what the building meets. At 402 BLUFF / AGENT are 2 ring steps apart on 10-23, opposite on 10-24.
- **THE KEYLINE:** a back tube ends `keyGap` (max(1.2, 1.3 × the tube's width) pt) above a nearer roof, the band's dilation the same gap;
  `eraseFront` cuts the back sprite's glow under the nearer buildings in all four bakes — baked, nothing a frame.
- **NEAR vs FAR** (`depthStrength`): within each depth step the front up to +6 % width + 3 % brightness, the back −6 % / −4 %; the softness
  unchanged (far tubes stay crisp) — deliberately subtle.
- `harbor().neon.pal` also reports `solved` + `white`.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Noon `2026-10-22T12:30`, golden hour `T18:20`, night `T22:00`, the party's warm-up `2026-10-24T20:45` + peak `T21:45`, spring noon
`2026-10-22T12:30&season=spring`. **The street under the dock:** leave the screen untouched until the dock + the tagline fade away (rest) — a
car crosses now and then (`&force=road-pass`: one every ~13 s); `&force=wet-street` (or the panel's PROMENADE → WET STREET) the wet hook.
shots.mjs: `fp-warm`, `fp-peak`, `fp-spring`; `--idle` (the screen at rest), `--crop band` / `shop` / `pole`, `--dsf N`;
`tests/integration/motorcar-preview.html` (every paint in every look).

### Tests (FP2)
`harbor.test.mjs` 131 → 144 (the unit suite 539): FP2 — THE LEAD RE-MEASURED + PARTY TIMING (above); THE PROMENADE (the positions on three phones, the cart's
route + stop rule, bench vs umbrella, the crabapple over the bench, the height cap; no parked traffic + the lantern's post; the crabapple's
year, the framing maple never brown + its trunk + crown); THE STREET (to the foot at 390 / 393 / 402 / 430, the curb on the dock, the lanes /
rails / manhole / drain inside the band; the car = `roadPassAt`'s pass, x 0 at its peak, 3–6.5 s on screen, in proportion; `carVis`,
`streetWet`); CRISP LIGHTS + THE POLE (the phase the same at 60 / 30 / irregular frames, sub-pixel at dpr 2 + 3, continuous through a
re-anchor, still in the raid; the stripe coverage continuous + periodic; the colours lit / day / party on-half-off; the halos bounded);
updated: the FP re-layout (one crabapple, no urn, the floor empty), 8a's trees (`['maple', 'crab']`), the party show's night curve (8:45 →
10 pm). `city-music.test.mjs`: the party mood from 8:30. e2e-harbor: `party` (FP2 TIMING: nothing at 8:15 pm, THE PEAK at 9:45), `music`
(the party at 8:30; the readout's sync line in its new forms), `promenade` (`pr5`: no car with the dock shown; at rest the band cobbled — σ 22
vs ~2 for the old asphalt; the forced car inside the band; a tap brings the dock back and the car gone), `speakeasy` (red + blue + a cool white
on the glass; THE POLE'S SLIDE ~50 frames one way within 0.11 px of the clock; NO SMOKE — +24 / +19 lum on the brick beside the glass, ~0 at
15–28 pt; a party night magenta + electric blue, the same slow turn). `neon` + `party` (41 / 41 with the depth rule). NEON BY DEPTH (harbor.test): the clash rule, the ring (2–4 steps never
clash), `ringBase`; at 390 / 402 / 430 something in front of both word towers, zero city clashes, the party plan solved with no link clashing in
12 scenes, neighbours never one main colour, six distinct non-white tower colours, ≤ 2 non-pale all-white buildings, the front tube never
finer / dimmer than the one behind. The smoke check (GAMES=cipher — `title.js` is shared): 3 / 3.

### Performance (A/B in one run, `title-perf.mjs --ab` against 0a297dc, 390×844, the laptop without a GPU, 3 + 3 windows)
| scene | t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-day` (4×) | 6.52 → 6.76 | 17 · 0.3 % both | same (noise ±0.48) |
| `np-night` (4×) | 10.73 → 12.65 | 33.4 · 18.3 → 30.5 % | same (noise ±7.03 / ±38 pts) |
INCOMPLETE: the laptop was short of memory all session — at 4× both builds stepped down to tier 0 inside every window (t2 / t1: no valid
window, A or B), and the 2× re-run with the party (`np-day,np-night,np-party --cpu 2`) was stopped by Claude Code for low memory before its
first scene; so tier 2 + the party are UNMEASURED by the A/B — the owner's iPhone (`&debug=1`) decides. The whole e2e-harbor suite: 264 / 266
(the two misses were the pole's RAID-over + party-colour checks reading a single frame under the parallel load — 16 / 16 alone; both now wait
for the condition) + the `perf` group's re-bake wait raised 15 → 30 s (at 4× a frame costs ~110 ms here and the bake runs a step a frame:
FP2's smaller night steps + the street + the neon's depth plan pushed it past 15 s; the commit before missed 15 s on its first try too —
its numbers there: t2→1 work 112 ms, t1→0 55 ms, t0 26 ms at the party's peak). What changes a frame: the pole's per-pixel glass (~10 × 56 px, < 0.1 ms), the car (a few blits, only at rest while it crosses), the
party's racers ~15 % more paths (94 vs 80 at 402); the bakes: the night ground ~102 → ~190 ms total (5–10 ms a step), the neon layout +10–20 ms once.

### Known issues (FP2)
- The crabapple's left third stands behind the DOUBLE AGENT blade (130–152 pt): the owner's ~160 bench spot leaves no room further right (the
  tall lamp + the umbrella are there); its right half reads (blossom / gold) at a glance.
- The back row has no maple now (one note said "keep the orange maple", the other made the bench tree the crabapple — the brief's crabapple
  won). The framing maple's autumn mix changed gold-amber → blazing orange (`v: 2` reverts).
- A tall centrepiece on the medallion hides the WAIT / WALK lantern + the crossing while it stands (it is "in front of the crossing").
- The street: phone SIDEWAYS (874×402) the band runs z 35.6 → 10.7 — the track, lanes + manhole crowd its top over a plain cobble field
  (Part 12's desktop / landscape pass); the dock isn't opaque, so the cobbles show between + round JOIN / HOST (both looks checked: the buttons
  read fine — the owner may want to see it); the wet look is hook-level; the rails away from the lamps are faint silver lines at night; the
  ground bake at night ~102 → ~190 ms total at 4× CPU (5–10 ms a step).
- The pole: its cobble pool is baked (stays during 7b's raid, tiny); the jitter's cause is inferred (WebKit can't run here) — her iPhone
  decides. One NO SMOKE far point over the shop glass reads −4.5 lum lit vs off (something else animating there; the test allows ±6).
- WebKit's lead after a return is proven in the pure test + the readout only (no browser here can offset Web Audio from the element).
- NEON BY DEPTH: wide screens are best effort (the party plan clean; the city palette 9 clashes of ~160 pairs at 1440×900, 1 at 874×402 —
  fixed towers against packed near blocks: Part 12); while a sweep / strobe holds one building a scene ahead, a link 2 or 4 steps apart can
  pass through 1 step for a sub-second moment (~10–15 % of link-scenes); the holiday schemes (2–3 colours) aren't under the rule yet (Part 11).
- The FP known issues "no crabapple on the phone" and "the cart's umbrella covers the crossing's near end" are fixed (1).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
The foreground is finished for now. 8b: the cart's route + the event rule (`L.cart.route`, `stopX`, `EVENT_CLEAR`), the centrepiece cap
(`centrepieceCap`), the parked traffic off (`PARKED_TRAFFIC` — 8b's moving vehicles replace it; `carAt` + `STREET.car` and the lanes keep right
by direction), the street for the bus / cars / the raid. Part 9: `streetWet` / `L.wet` (puddles, reflections), `ctx.snow` on the crabapple.
Part 10: the finale hook at midnight sits inside the peak (9:30 → 1 am).

## PF — PROMENADE FINAL TOUCHES (Oct 24 2026; the final layout, the inlay + its event rig, the lamps + uplights, the street, the sign lamps, the car in sync, the sky sounds, the CI job; behind `?city=2`)
The owner's iPhone review of FP2: the promenade is filled out — this pass LOCKS ITS FINAL LAYOUT, every piece's art kept. Three helpers ran
next to the lead (the inlay + rig + mailbox; the street + sign lamps + string lights + the neon check; the sounds); the lead did the layout,
the lamps, the uplights and the CI job. Audio detail: docs/audio.md — "FP3 — THE CAR AND ITS SOUND IN SYNC" + "THE SKY SOUNDS".

### 0. THE CLOUD TEST JOB (`.github/workflows/harbor.yml`; docs/testing.md "THE HARBOR IN THE CLOUD")
The FULL e2e-harbor suite on GitHub's machine after every push touching a City 2.0 file (a `paths:` list), `SHARDS=2`, `SHOTS=0`, on the
emulators; a newer push cancels an older run; npm + emulator downloads cached; `shots-harbor/` attached on a failure. **≈ 7–9 min a run**
(the suite ≈ 6½–8½ min; the private repo's free minutes). Its first runs on FP2's code: 163 / 167, then 272 / 273 — the misses were timing /
rounding checks too tight for the 2-core runner (now waiting for their condition: NO FLAG's signs, the O's flutter up to 12 s, the spell-on
round until every sign has spelled; the memory check's 0.01 MB rounding → 0.05; the water seam limit 1.5 → 2.5 points — FP's known issue);
`SHARD_PLAN[2]` was missing the `music` group. **Future passes rely on it:** locally the unit suite + the touched groups only.

### 1. THE FINAL LAYOUT (`core/harbor-promenade.js#PHONE`, `CART_SHOWN`)
| piece | x pt at 402 | z | change |
| --- | --- | --- | --- |
| THE CART | — | — | HIDDEN (`CART_SHOWN = false`, `L.cart.shown`): no art, light, shadow, box or block; its art, `route`, `stopX` kept for 8b |
| THE CRABAPPLE | 181 (crown 153–209) | 50.9 | from 163 / z 52.9 / k 1.25 → k 1.45: right of the DOUBLE AGENT blade (the blade free, the tree shows), left of the flanking lamp's head |
| THE BENCH | 207 (186–228) | 47.8 | where the cart's umbrella was, a little forward; the crabapple's trunk + uplight show at its left end |
| THE TALL LAMPS | 225 · 312 | 52.6 | a MATCHED PAIR FLANKING THE CROSSING (symmetric about its axis, just outside the two stop lights) — was 177 · 312 |
| THE INLAY | 268 (the crossing's axis) | 44.8 | the medallion → a brick paving inlay (§2), a little back (43.4 → 44.8): inside both flanking pools |
| THE GLOBES | 129 · 387 | 36.6 | unchanged (the front corners) |
| THE MAILBOX | 326 | 38.6 | NEW (§3): the right side by the front curb, left of the framing maple's trunk |
| THE FRAMING MAPLE | 357 | 38.2 | unchanged |
Nothing stands in front of the shopfront or the blade; the bottom-left corner stays clear for the lobby line.
**8b — WHERE THE CART + THE BUS RETURN:** the cart's rest spot (`PHONE.cart` f 0.53, z 41.8) + `route` cross the floor in front of the bench,
over the inlay (`stopX` / `EVENT_CLEAR` when an event stands there: `harbor().centrepiece.active()`); place it once 8b's paths are drawn —
it may want the open floor right of the inlay (f ~0.78–0.85, z ~42) so the bench + crabapple stay clear. The bus: `PARKED_TRAFFIC` (road.js).

### 2. THE INLAY + THE EVENT LIGHTING RIG (`props.js#drawInlay` — `drawMedallion` kept as an alias; `core/harbor-centre.js` PURE; `screens/harbor/centre.js`)
- **THE INLAY:** flush paving, nothing raised — a soldier-course border ring, a buff brick ring, a red field laid in rings, an 8-point
  compass star in buff + dark brown-red (each point split light / dark; north = away from us), a small buff centre in a ring of dark bricks.
  By day each brick its own shade + a lit far edge, a polish where feet go (`wearAt`); at night the same baked lamp pools as the setts
  (`stage.js` passes `lightAt`), landing by each brick's colour (the red stays red). Drawn BEFORE the day shadows (they fall across it).
  `inlayPlan`, `wearAt`, `INLAY`.
- **THE RIG (the owner: events on the inlay must be lit):** four brass FLOOR SPOTS flush in the border on the diagonals (two in front of a
  piece, two behind) — a brass ring round a dark lens, baked with the paving (a glint by day). The API for 11a–c:
  `harbor().centrepiece.set({ piece, h, rig: { on, col, k }, lights: [{ x, y, z, col, r, k, tw, ph }] })`, `.clear()`, `.active()` (+ `cap`,
  `spots`, `box`). `piece`: a draw function `(x, cam, m, T, ctx)` or `{ draw, light }` (`light`: the rig's light landing ON the piece — pieces
  should bring one; without it a flatter fallback lights the lower part). The rig comes on with any piece, rises with the street lamps (nothing
  by day); `h` clamped to `centrepieceCap`. Cost: no piece = one check a frame; a piece = a sprite of its own box re-drawn only when the
  piece / look changes + its lit copy, four cached spot glows and its own lights a frame (core + tight halo, no haze). `PROP_KIT` (props.js)
  exports the props' frame + lighting helpers; `propShadow(…, 'custom')` takes a piece's own shadow shapes.
- **THE TEST PIECE** `&force=centrepiece-test` (+ the panel's PROMENADE → THE CENTREPIECE → CENTREPIECE TEST): a 5.6-unit granite obelisk on a
  stepped plinth (a bronze plaque, a gilt top) with its own light pass — warmest at its foot at night.
- **Always readable at night:** the inlay sits inside both flanking lamps' pools (§4: ~0.55–0.65 of a lamp's heart on its ring).

### 3. THE MAILBOX (`props.js#drawMailbox`, `mailboxBox`; `PHONE.mailbox`, `L.mailbox`)
A 1920s OLIVE-GREEN pillar box (~1.9 units — a touch exaggerated): a stepped foot, a tapering neck with an eagle boss, a chamfered body, a
flanged domed cap + knob, the hinged slot flap under its hood, the raised "U.S. MAIL" band, the collection door + lock + a cream
collection-times plate, worn corners, chips, rust at the foot, rain streaks. Its sun shadow by day, lit by the right globe at night (props.js
`lit`); baked in the front layer; in the walkers' block list. (A newsstand / newsboy → 8b with the people.)

### 4. THE LAMPS RE-THOUGHT + THE TREES' UPLIGHTS (`stage.js#REACH`, `TALL_K`; `trees.js#UPLIGHT`, `drawUplight`)
- **The pools** for the new positions (baked into the setts as before — crisp, no haze): tall 10.5 → 13.5 (each × `TALL_K` 0.85 where the
  pair overlaps on the curb), globe 7.6 → 9.5, the speakeasy's spill 4.2 → 5.2 (the shopfront's line). PEOPLE READABLE where they'll be: the
  bench 0.87 of a lamp's heart, the inlay ~0.6, the door's approach ~1, the lobby line along the shopfront toward the bottom-left corner
  0.1–0.4 (dim, never black), the front walk 0.6–1. The darkest spot is the strip just in front of the inlay (z ~41, ~0.05) — the rig and
  8b / holiday lights fill it without re-laying the lamps. A tall lamp's light on the trees 0.8 → 0.58 (the crabapple now stands beside it:
  its crown's side went one flat orange).
- **THE UPLIGHTS:** each tree in a grate has a squat brass fixture in front of its trunk (`UPLIGHT`: u −0.26, dz −0.5), aimed up — a light with
  a short reach (falloff 2.2 vs a lamp's 3) in the tree's own lighting, so the trunk + the crown's underside glow warm and the crown's top
  fades to dark; seen: a warm wedge up the bark's front, a small warm pool on the mulch + grate, the lens's spark + a tight halo. By the season:
  autumn's leaves glow amber, winter's bare branches catch it (snow later: Part 9), spring's blossom pink. Baked (no frame cost).

### 5. THE STREET UNDER THE DOCK, THE STRING LIGHTS, THE SIGN LAMPS (`street.js`, `strings.js`, `speakeasy.js`, `signs.js`)
- **THE STREET** reads as its own surface: TARRED setts (day [130,127,126] → [98,100,108], night [52,50,72] → [44,45,66]), TAR joints (day
  → [56,55,61], night → [28,28,42], still 0.42 of the lamp light), darker gutter slabs + rail stretchers, duller cooler highlights, a worn
  sheen in the tyre paths (`SHEEN` 0.3); THE CURB STEP (`CURB_STEP`, in `streetOver`): the curb's face shaded deeper, a crisp 0.55 pt lit
  edge along its top, a shadow on the gutter under it. The promenade's setts unchanged.
- **THE STRING LIGHTS OFF** for now (`strings.js#STRINGS_ON = false`; the parapet's posts baked only while on; all the code kept;
  `&force=strings-party` still previews them — without posts). 7b re-renders them with the rooftop.
- **THE BLADE'S LAMPS** brighter + CONCENTRATED: `BLADE_LIGHT` — an even warm fill + two tight cones straight down from the lamps (hot under
  the mouth, 'lighten' so the middle never doubles, cut to the board) multiplied over the paint: the face even top to bottom (DOUBLE AGENT
  top [76,59,49] → [104,87,68], foot [54,44,41] → [103,85,66]); `bladeLevel(faceLum, partyRamp)` / `BLADE_LEVEL` replaces FP's `BLADE_LIT`
  0.78 (dark boards full + a 0.34 boost; light boards — OVERCLOCK, SLIP, BLUFF — 0.9, easing to 0.55 on party nights so the blade is never
  the biggest warm slab); the heads: a small squashed warm halo, the shade's lit inside, a white-hot bulb — the old wash blob gone.
- **THE BILLBOARD'S LAMPS** a step brighter: `lampLightMap` ~7 % (the pools 0.5 → 0.6), `lampGlows` (cone 0.32 → 0.38, the halo tighter),
  `scene.js#LAMP_DIM` 0.1 → 0 (the poster at night [140,91,47] → [157,105,55]).

### 6. THE CAR IN SYNC + THE SKY SOUNDS → docs/audio.md
- **The car's sound came 5–6 s late** because it started only once its file was fetched + decoded (nothing prefetched, a new take most
  passes, iOS decoding slowly) while the car ran on the clock. Now placed ON THE CLOCK (`city-sounds.js#syncStart`): the take's measured peak
  lands on the car's mid-crossing (early → delayed, late → joins with a fade, < 1 s to go → silent rather than out of sync); the next pass's
  take prefetched ~12 s ahead; the take from the pass's number (every phone the same); the car's speed from the take's SWELL (2.6–7 s on
  screen); the sound starts 1.5 s before the car enters; a gentle pan (±0.6, `panOf`); with the dock shown the sound alone still plays.
  Measured with every car file held back 2.5 s: the peak −0.13 → +0.01 s from mid-crossing.
- **THE SKY SOUNDS** (Grok's 12 files → 16 MP3s, 3.19 MB; `audio/city/` 5.54 MB): helicopter (two flybys, chained, panned, louder in the
  hover), airliners (faded with their crossing, panned), the banner plane / skywriting (prop-plane), geese (one flyover per V, panned — a
  modern engine drone notched out), the drone show (a 5-layer detuned swarm), balloons (a burner burst every 6–18 s); filled for 6b, not
  wired: jet-flyby, ufo-hum, ufo-beam, tr3b-drone, tr3b-power-down (+ the blackout's thump at `hit`). All under the day hum (−43.6 LUFS):
  −47 to −55; the sky ducks under the music with the bed.

### 7. NEON OUTLINES (verified, nothing changed)
FP2's NEON BY DEPTH holds at 402 on a normal night (10-22) and the party peak (10-24 21:45): no front / back pair shares a colour, the front
tubes stop cleanly above the nearer roofs, nothing merges. (BLUFF / DOUBLE AGENT aren't on the word towers those nights — the same towers
were checked with what stands in front. Normal night: the two right-hand towers both cyan, ~13 pt apart — they don't read as one.)

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Noon `2026-10-22T12:30`, golden hour `T18:20`, night `T22:00`, party peak `2026-10-24T21:45`, spring `2026-10-22T12:30&season=spring`; the
screen at rest (dock hidden): leave it untouched; the car + its sound: night + `&force=road-pass`; the rig: night + `&force=centrepiece-test`.

### Tests (PF)
Unit 559 (`harbor.test.mjs` 156: THE FINAL LAYOUT on three phones — the inlay on the crossing's axis, the tall pair flanking it symmetric +
outside the stop lights, crabapple · bench · crossing, the crown clear of the blade + the lamp's head, the cart hidden but its 8b rule kept,
the cap; THE INLAY / THE RIG / THE MAILBOX (8); THE STREET'S SURFACE / THE STRING LIGHTS OFF / THE BLADE'S LAMPS; the trees with gradients;
`harbor-sounds.test.mjs` NEW: the peaks + swells, `takeAt`, `syncStart` swept over every take + wait, the crossing, the pan, the sky files,
the blackout's `hit`, the levels; `city-sounds.test.mjs` the filled slots, the size cap 4 → 6 MB). e2e-harbor (locally: `promenade`,
`speakeasy`, `party`, `sounds` — 62 / 62 + 15 / 15): the string lights OFF (still laid out); FP3 — THE CAR IN SYNC (car files held back 2.5 s:
the peak within 0.35 s of mid-crossing, on screen ≈ its swell, a pass skipped by design listed as such) + THE PAN; the day bed with
`&force=no-planes`. The whole suite: the cloud job (§0).

### Known issues (PF)
- The first car pass after the page opens may be SILENT on a slow network (its file arrives under 1 s before the car's centre — silent by
  design rather than late; the prefetch covers every later pass).
- The sky levels are loudness arithmetic, not listened to; ufo-hum has no single key (E1 / ~C#–D / 729–883 Hz) — its music duck waits for 6b.
- The centrepiece's sprite switches at once while the ground crossfades on a re-bake (the lamps change in sixths — small); it isn't in
  `memAll` (~0.5–1 MB at dpr 2, only while a piece stands); the obelisk's upper shaft stays light at night (a placeholder).
- ~~A placeholder person stands right behind the mailbox at 402 (8b places the people); the mailbox reads dark in golden-hour shade.~~ THE
  MAILBOX IS GONE (Oct 24, the owner didn't like the olive-green box): `PHONE.mailbox: null` in `core/harbor-promenade.js`; `props.js` keeps
  `drawMailbox` / `mailboxBox` (tested at its old spot) for a later piece of furniture.
- `&force=strings-party` shows the string lights without their posts; the worn sheen in the street's tyre paths is subtle.
- The dim strip just in front of the inlay (§4) — left for the rig / 8b's lights.
- THE CLOUD JOB's slower runs (12 min on the PF commit vs 7–9): four timing checks flaked there once each and passed on the run before — `music` RETURN (plain) (the punch after a return: the BEAT pass's area), `panel` PULSE STRENGTH (the live ×1.75), `perf` BATTERY (the 60 fps wake), FP3's first car (now excused: its file may arrive after it passes). Watch the next runs; a check that fails twice in a row is real.

## BS — THE BEAT-SYNC PASS (Oct 24 2026; the lights locked to the beat the owner HEARS; behind `?city=2`)
The whole story — the owner's evidence, the ranked causes with the code as it was, the one-source design, the readout, the tests and what
she should look at — is `docs/audio.md#the-beat-sync-pass`. In the Harbor itself: `scene.js#beatLine` says `level` (how hard, from the
music's loudness) instead of `kick`; `returnGrace()` holds the tiering for 3 s after a return and a no-change resize never re-bakes
(`__district.tiering().returns` / `.holdMs`); `core/harbor-show.js` punches on EVERY beat (`beatPunch`; the crowns still flare on the
downbeat alone). The small extras in this pass: the sign's own random twitches at the TAP's level, about one in three a little louder
(`ambience.js#neonTwitch`, `title.js#scheduleFlicker`); the mailbox gone (above); SPEAKEASY stays WHITE neon on party nights — the race, the
shimmer and the beat punch in white (`css/title.css`: `--pw / --pwb / --pwd`; the NEON logo and the bloom keep the party colour); the cloud
job's pure-speed checks are warnings (`e2e-harbor.mjs#okT`, `CI=true` or `TIMING=warn`; `TIMING=strict` to make them hard again).
### Known issues (BS)
- iOS's real post-return offset (+107 / +237 ms on the owner's phone) can't be reproduced headlessly: the pure chain test simulates it; the
  proof is her phone (the three readout lines in docs/audio.md).
- A shift is measured modulo one beat: a shift past half a beat (a +240 ms re-buffer on a 128 BPM song) lands the lights a whole beat along
  — on the beat, but the downbeat weights fall on beat 2 / 4. Rare; the eye reads the beat, not the bar.
- Songs whose kicks don't agree with their grid (`agree < 0.5`, trusted through `lock` — c2-party9, c2-day2 / day9, late3 …) never
  calibrate the lead: they run on the default / the last locked value. Re-gridding them offline (`add-city2-music.py --regrid`) is the fix.
- THE CLOUD JOB's known one-off flakes (PF's Known issues) are timing warnings now; `okT` lists them in the summary (`timing warnings N`).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
The promenade's layout is FINAL. 6b: the UFO / TR-3B / jet slots are filled (`sounds.js` wires nothing for them yet; the blackout = tr3b-
power-down, its `hit`). 8b: the cart (§1) + the bus return; `harbor().centrepiece.active()` for the cart's event rule; the lobby line's
corner is clear and lit. 11a–c: `harbor().centrepiece.set(…)` with a `light()` pass + `PROP_KIT`. 7b: `STRINGS_ON` + the parapet posts.

## PART 7b — THE SPEAKEASY'S LIFE (Oct 24 2026; the windows, the TV glow, the mirror door, the facade light, the marquee, the string lights; behind `?city=2`)
The owner moved this part up: the speakeasy is the closest, biggest, most readable thing on screen, so it must be the most alive. Before
it its windows were still paintings and at 3 am the whole building went black. Built overnight, unattended (the decisions are listed
below — each easy to reverse). Out of scope, hooks left: THE RAID + its police cars (with the vehicles, 8b), people on the promenade + the
rooftop guests (8b), weather on the glass (9), holiday window scenes (11), the password sign (Lobby 2.0).

### 1. THE MOMENTS CATALOGUE (`core/harbor-moments.js` PURE + `tests/harbor-moments.test.mjs`; drawn by `screens/harbor/windows.js`)
- **One entry a moment** (`MOMENTS`): `{ id, label, rarity, windows, hours, light, days?, months?, wx?, party (× its weight on a party
  night), len, cooldown, kind }` — the windows are `ROOMS` ids (core/harbor-speakeasy.js) + `shop` (the barbershop's big window); `'all'`
  holds every upper window in turn (`TANGO_PATH`). ROUTINES (`at` + a seeded few minutes, `routineAt`) also move their room to its next
  state; LEGENDARY moments have their own calendar (`legendNights`: one night a season, `plays` times through the evening).
- **THE SCHEDULE** (`hourPlan(key, hour, ctx)`, `dayPlan`): built ONE HOUR AT A TIME (seeded by the local date + the hour: ~1 ms, the
  scene builds only this hour + the last), the same for every phone at the same place; a phone opened mid-way joins the moment already
  running (`momentsAt` → its `el` + `p`). Something starts every ~10–20 s at night (party nights ~7–14 s; the longest gap ≤ ~40 s, at
  the top of an hour), never two in one window, never more than `MAX_AT_ONCE` (2) together. `RARITY` is a CHANCE A SLOT (common 1 ·
  uncommon 0.34 · rare 0.008): when the eligible ones sum under 1 — by day — the rest of the slot stays empty, so rare stays rare. A
  Thursday in October: 1 752 moments (toast 725, dance 509, cat 310, mirror 101, sax 86, peek 17 + the four routines); a Saturday
  (party) 2 520. `ctx.dark` = [dusk, dawn] from the real sun (`light: 'night'` moments only between them).
- **THE ROOMS' STATES BY THE HOUR** (`roomState`): the apartment `nightlamp` (3 am → the wake) → `lamp` → `tv` (lights-out → 3 am); the
  bar `closed` → `open` (from the bartender's routine: by day the half-drawn shade, at night the full bar) → `last` (3 → 4 am); the shop
  `closed` → `open` (the opening's end → 6 pm). **NEVER FULLY DARK** (tested minute by minute): the TV until 3, then the night lamp
  upstairs + the bar's last light low with someone sweeping until 4; at dawn the upstairs wakes. (`roomLight` — 7a's timeline — still
  drives the other rooms.)
- **ADDING A MOMENT** = one entry in `MOMENTS` + one painter `PAINT[id](E, el, len, inst)` in `windows.js` (E: the window's glass
  `G`, its light `kl`, the night `k`, the frame's `t`, `motion`, the tones `T`, `after` for drawing outside the glass). Its preview row
  appears by itself in THE PREVIEW PANEL → WINDOWS (`window-<id>`, grouped by rarity) and `&force=window&moment=<id>` plays it on a loop
  (from 1.2 s in, every `len + 2.5` s, nothing else drawn). A sound: `sound(e, env)` in windows.js calls its slot.
- **THE STARTER TEN** (the owner reviews these before any more are made) + the mirror door:
  | moment | rarity | window | when | what reads |
  | --- | --- | --- | --- | --- |
  | `wake` THE UPSTAIRS WAKES | routine ~7:00–7:08 | apartment | daily | the blind rolls up, a figure walks in, a big STRETCH (arms up in a V), the lower sash up + the watering can, drops falling onto the geraniums |
  | `shop-open` THE BARBERSHOP OPENS | routine ~9:00–9:03 | shop | daily | the lamp on, the barber in (white jacket), out to the door → CLOSED flips to OPEN, the first customer into the chair, the cape, the first snips |
  | `bartender` THE BARTENDER ARRIVES | routine ~16:00–16:06 | bar | daily | the shade drawn down a third, the lights on one by one (the pendant, the three shelves), a glass polished + held up to the light |
  | `lights-out` LIGHTS OUT · THE TV | routine ~22:00–22:12 | apartment | daily | the lamp clicks off, a beat of dark, the TV flickers on, a head settles onto the couch (the cat beside it) |
  | `dance` A COUPLE DANCING | common | jazz | 7:30 pm → 2 am, dark | two big shadows crossing the amber shade (their legs dark under its hem), a twirl under his raised arm |
  | `toast` A TOAST AT THE BAR | common | bar | 7 pm → 2:30 am, dark | three patrons, glasses raised high against the gold back-bar, the clink over the middle (a sparkle), a drink |
  | `sax` THE SAX SOLO | uncommon | jazz | 8 pm → 2 am, dark | the sax player's shadow (swaying gently all night) leans back hard, the bell up |
  | `cat` THE CAT ON THE SILL | uncommon | apartment / either edge window's visible half | any hour | a LARGE sitting silhouette leaps up, settles, the tail flicking, hops down |
  | `peek` A PEEK AT THE STREET | rare (~1 an hour) | apartment / jazz | 7:30 am → 2 am | a head leaning out from behind the curtain, left then right (the jazz room: ducking under the shade's hem) |
  | `tango` THE TANGO | legendary | every window in turn | 4 nights a year × 3 plays, 8:30–11:45 pm | a top hat + tails and a flapper dress (cloche + feather, fringe): a stride, a turn, THE DIP, a kick — one window after another |
  | `mirror` THE MIRROR DOOR | uncommon (× 3 on party nights) | shop | 8:45 pm → 2:30 am, dark | the mirror right of the chair swings in: amber light, the bar's bottle shelves glowing, two silhouettes with a glass, the light spilling across the dark shop, then shut |
  The next real tango (Grand Rapids): **Tue Nov 17 2026 at ~9:03, 9:57 + 10:54 pm**; 2027: Feb 7, May 19, Aug 28, Nov 12.
- **THE AMBIENT LIFE** between the moments (always on, drawn live): the bartender behind the counter (a lighter silhouette: he's further
  back) polishing, now and then THE SHAKE; the regular in the hat at the bar; the sax player swaying on the shade; THE BARBERSHOP'S DAY (a
  customer every ~8 min — in, the cape, the haircut, out — the barber reading the paper in his own chair between them); the shop dim with
  CLOSED on the door before 9 + after 6 by day (the bake says OPEN by day).

### 2. THE LIVE WINDOWS (`screens/harbor/windows.js`)
- **How it's drawn:** the rooms' STILL looks (`paintRoom`: the back-bar's bottles, the shade, the lamp room, the card table, the drawn
  curtains — 7a's art, the bartender / patron / sax player taken out) stay in the speakeasy's cached lit canvas; only what moves is drawn
  each frame, in the front wall's own units (v up), clipped to each window's glass, the sash re-laid over it. A window the life draws WHOLE
  (the TV, the night lamp, a routine, the bar's last light) is 0 in the lit canvas that frame (`life.frame(f).full`).
- **THE FIGURE KIT** (`figure(c, P)`): a person from the waist up (+ legs for the shop + the dancers): a body, a head (profile nose when
  turned), two two-segment arms with round joints, hats (fedora · top · cloche + feather), hair (bob · bun), a flapper's fringed skirt
  (flaring in a spin), tails, props (glass · shaker · broom · watering can · scissors · paper · cloth); ONE fill at night (a silhouette
  against the lit room; on the jazz shade a soft shadow, the legs below its hem dark), a lit palette by day (the daylight on them against a
  dark room). `cat()`: a sitting silhouette (ears, the tail round the paws, its tip flicking) or mid-leap. Sizes on a 402 phone: people
  ~14–18 pt from the waist up, the cat ~14 pt sitting.
- **THE TV GLOW** (an owner favourite): `tvLight(t, seed)` — SCENES of 0.4–3.5 s (cuts on a 0.35 s grid, about two in five), each its own
  level + tint (cool blue ↔ a whiter blue, ~1 in 8 a warm scene), a slow drift + a fine flicker, now and then a bright cut: never a steady
  beat. The whole window takes the TV's colour (it reads BLUE at a glance), its light on the walls + the ceiling, the curtains' inner edges,
  the couch's back; a head on the couch ~60 % of the time (the cat beside it now and then); a blue spill on the brick (tier ≥ 1).
- **THE LATE TVs across the skyline** (`lights.js#lateTv`, `core/harbor-moments.js#lateTvK`): up to 7 lone windows on the near + mid bands
  (the landmark towers' windows are ~1.5 pt — too small) flickering blue on the same irregular clock, ~10 pm → ~3 am (eased over 20 min),
  never behind the roof billboard or inside the wheel's disc — as City 1.0's bedtime turns the city's windows off they stand out more.
  (`harbor().windows.lateTvs / lateK / lateTvRects`.)
- **TAPS** (`speak.hit(x, y)` before the door; the viewer's own, not synced): an EDGE window → its curtain twitches (a head in the gap);
  the apartment / the jazz room → a head peeks out; the bar → the regular turns + raises his glass; the back room → its lamp swings; THE
  CAT → it leaps off (+ the `cat-meow` slot). `scene.hit` → `{ kind: 'speakeasy', id, tap }` / `{ kind: 'speakeasy-cat' }`.
- **SOUNDS** (each calls its slot — all empty today, so silent; Ben is collecting them): `club-murmur-calm` / `-party` while the bar is
  open at night, `tv-murmur` during the TV hours (both through `sounds.js#speakeasy` — beds ducked with the city's bed under the music,
  panned left), `door-heavy` when the mirror door opens, `cat-meow` when the cat jumps up. docs/audio.md#7b.
- **Reduced motion:** no moving moments (the rooms keep their states: the TV's light steady, the night lamp, the barber still).

### 3. THE FACADE AT NIGHT (the owner: "something's missing")
- **THE WALL-WASHERS** (`speakeasy.js#WASH`, `paintWashers`, `paintWasherLamps`): a small black iron hood under each capital of the three
  visible brick PIERS (the edge pier is off screen), aimed DOWN — from dusk, all night, by the lamps' ramp. BAKED into the night facade (no
  per-frame cost): the pier's own bricks re-laid in their LIT colour (the same tile seed, so the courses line up) through a SCALLOP mask —
  dark right under the lamp, the bright curved edge, then a long falloff to the belt course — so the light shows the brick's texture and
  never touches a window (tested). Crisp light on the surface, no haze; a hot sliver under each hood. (At phone size the lit piers read as
  warm arches framing the windows — the depth the facade lacked.)
- **THE MARQUEE** (`MARQUEE`, `marqueeBulbs`, `marqueeScreen`, `marqueeLevel`, `MARQUEE_LIGHT`): the blade's frame widened to carry a border
  of **48 round bulbs** (~2 pt globes, ≥ 4.6 pt apart at 402) round its stepped outline; the gooseneck lamps are gone (`drawGooseneck`
  stays for the billboard). At night each bulb a crisp warm-white globe + a small tight halo (none at tier 0), all in ONE sprite repainted
  only when the light or the chase steps (a steady night: one drawImage); STEADY on a normal night, a SLOW CHASE on party nights (every
  third bulb leads, one bulb a beat, crossfading over the beat's first third). The board under them DIMMER (`MARQUEE.board` 0.66 × PF's
  level; its light map an even fill + a warm edge just inside the bulbs). By day the bulbs read as unlit glass globes on the frame.
- **THE STRING LIGHTS, ON AGAIN** (`strings.js#STRINGS_ON` true, `BULB`): real ROUND BULBS hanging from short sockets on the gently sagging
  wire between the parapet's iron posts (their posts baked again); by day pale glass globes with a highlight; at night a crisp lit globe
  with a hotter heart + a small tight halo (no blurry dot), all in one sprite repainted only when the chase steps or the punch moves a notch;
  their light LANDS on the parapet (the coping's lit edge + a warm fall down its face). Warm white every night; on party nights Neon Pass 4's
  warm, colourful, changing chase. They stay under the billboard's foot (the FP test).

### Decisions made overnight (the owner was asleep — each the most reasonable reading; easy to reverse)
1. plan.md has no "THE SPEAKEASY AT NIGHT FEELS EMPTY" section — the prompt's own text (never fully dark: the TV to ~3, a night lamp /
   the bar's last light + someone sweeping, the upstairs wakes at dawn) was the brief.
2. Routines are catalogue entries that also MOVE THEIR ROOM ON (the blind up, OPEN, the bar's afternoon, the TV) — the new state stays all
   day; their minute is seeded per day (7:00–7:08, 9:00–9:03, 16:00–16:06, 22:00–22:12).
3. The schedule builds in HOUR BLOCKS (a whole day took ~15 ms on the laptop — a load hitch on a phone); a random moment starts + ends inside
   its hour (a gap of up to ~25 s at the top of some hours).
4. RARITY is a chance a slot, with an empty remainder when few may play: by day the cat (~every 5 min) + the rare peek (~1 an hour) — the
   starter set is night-heavy, so the day's "something happening" is carried by the shop's barber + customers, the bar's afternoon and the cat.
5. The mirror door is an 11th entry (`starter: false`), not one of the ten. It happens every ~3–5 min at night, × 3 on party nights.
6. The legendary tango: 4 nights a year (one a season), 3 plays each between 8:30 and 11:45 pm.
7. The cat sits in the apartment or in either EDGE window's visible half (the owner's "cat's ledge") — no story moment in a cut window.
8. The taps: edge → a curtain twitch; apartment / jazz → a head peeks; the bar → the regular salutes; the back room → the lamp swings; the cat → it leaps off.
9. The bar's "half-drawn" shade is drawn a THIRD of the way down (half hid the lit shelves + the bartender behind the counter).
10. The bartender is a lighter silhouette than the patrons (he stands further back) — the toast's raised glasses read against him.
11. The 8b placeholder couple window-shopping at the barbershop slid 1.6 units left (by the shop's door): they covered the barber + the chair.
12. The wall-washers sit on the three visible piers at 0.8 strength (the first pass at 0.92 read strong for "subtle").
13. The late TVs come from the near + mid skyline bands (the landmark towers' windows are too small to read).
14. The speakeasy's sound beds go through sounds.js (ducked with the city's bed under the music) rather than their own loops.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
7:15 am `2026-10-22T07:15` · the shop opens `T09:15` · noon `T12:00` · the bartender `T16:15` · 8 pm `T20:00` · the TV + the mirror door
`T22:30` · 1 am `T01:00` · never fully dark `T03:30` · a party night `2026-10-24T21:45`. Each moment on a loop: `&force=window&moment=<id>`
(wake · shop-open · bartender · lights-out · dance · toast · sax · cat · peek · tango · mirror) — or THE PREVIEW PANEL → WINDOWS (night
ones ☾ jump to tonight). Routines are best at their own hour (the wake at 7, the shop at 9, the bartender at 4 pm, lights-out at night).

### Tests (7b)
Unit 570 (`harbor-moments.test.mjs` NEW, 9: the catalogue + the starter ten's range, the schedule — the cadence, one window each, ≤ 2 at once,
seeded, party nights busier, night moments only in the dark, an hour on its own, the routines + the rooms' states, NEVER FULLY DARK minute
by minute, the legendary calendar, joining mid-way, the TV's irregular flicker + the late TVs' hours, the panel's rows; `harbor.test.mjs`:
the string lights ON, THE MARQUEE (48 bulbs inside the board, ≥ 3.2 pt apart, steady / the party chase, the board dimmer), THE WALL-WASHERS
(piers only, the scallop's falloff), the registry reads the `window-<id>` rows). e2e-harbor: NEW `windows` group (16): the rooms' states at
9:30 pm, the schedule running, the wall-washers' warm pier, the marquee's lit bulbs, the string lights, a tap's answer, the forced dance
moving on the shade, only the forced moment playing, the cat's dark silhouette + a tap sends it off, the TV blue + flickering at 11:30 pm,
the late TVs, never fully dark at 3:30 am, the mirror door's amber, the shop open at noon; `party`: the string lights ON; locally
`windows`, `speakeasy`, `party`, `sounds` 64 / 64 · `speakeasy`, `party`, `promenade` 48 / 48 · `panel` 25 / 25. The whole suite: the cloud job.

### Performance (A/B in one run, `title-perf.mjs --ab` against 793141d, 402×874, the laptop without a GPU, 3 + 3 windows)
| scene | t2 · t1 · t0 work A → B (ms) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-night` (4×) | 8.66 → 5.88 · 4.24 → 4.81 · 2.85 → 3.41 | 16.8–17.2 · 0 / 0.3 % | same ×3 |
| `np-party` (2×) | 10.25 → 10.98 · 6.2 → 7.23 · 4.8 → 5.31 | 16.8–17.2 · t2 0.7 / 3.1 % (noise ± 9.9) · t1 + t0 0 % | same · same · **SLOWER (work) +0.51 ms** |
The first round said tier 0 on a party night +0.56 ms (the string lights are back ON — a party chase on ~30 bulbs — + the live windows +
the marquee's chase); the one fix: the string lights' + the marquee's lit bulbs as ONE SPRITE each, repainted only when the chase steps or
the punch moves a notch. Re-measured: +0.51 ms of work at tier 0 (noise ±0.37), the frames unchanged (0 % slow, p95 17.1 ms) — the
owner's iPhone readout (&debug=1) decides, per the plan's rule (one fix + one re-measure, then report).

### Known issues (7b)
- **Party night, tier 0: +0.5 ms of work** on the laptop at 2× CPU (above); the frame pacing is unchanged. If her iPhone's readout shows slow
  frames on a party night at tier 0, the easy steps: the string lights' party chase at a lower rate, or the ambient figures (the bartender's
  polish, the sax player's sway) still at tier 0.
- The day is quieter than the night (the starter set is night-heavy): the cat, the rare peek, the routines + the shop's barber carry it.
- The late TVs are small (2–3 pt windows) — blue glints that change, not rooms; the speakeasy's own TV upstairs is the hero.
- The mirror door's panel is ~13 pt wide at 402 — the amber light spilling through the dark shop carries it at a glance.
- A routine forced at another hour shows its own look (the wake at night draws its lamp room); the preview's 2.5 s gap shows the room's state.
- The CLOSED card before 9 is tiny (~8 × 3 pt) — the shop's dim interior is what reads.
- The figures are drawn per frame (a few dozen path ops a window); the bar's afternoon re-paints its shelves every frame from 4 pm to dusk
  (cheap, but a cache is the step if a phone ever shows it).
- WebKit can't run here (as every pass): the figures are plain paths + fills, the bulbs sprites + `lighter` — the Safari floor's helpers.

### Hooks for what comes next
- **THE RAID (8b, with the police cars):** `harbor().speakeasy.pole({ on: false })` (7a) + the life's states: a `raid` moment / state that
  snaps every window dark + the shades shut (a full-window painter per window, `full` = all) and lets them flicker back one by one; never
  during a big holiday moment (the catalogue's `hours` / a `never` list). The marquee + the string lights: `strings.set({ colours })`, the
  marquee's level from `f.lamp` (0 = dark).
- **8b (people + the rooftop):** the doorman / the line at the side door (`L.door`), the rooftop's party guests + the bar cart stand in
  front of the billboard on the roof deck (7a's note: taller than the parapet); a moment can name `'roof'` once a painter draws there.
- **Part 9 (weather on the glass):** the plan's `ctx.wx` + a moment's `wx: [...]` gate (e.g. a fan + a raised sash on hot days); the
  painters get the window's glass `G` — rain runs, frost from the corners, steamed edges go over the room in `draw` (after the moments,
  before the sash).
- **Part 11 (holiday window scenes):** an entry with `months` (+ a holiday gate to add: `holidays: [...]` read from `core/sky.js#holidayOf`)
  and its painter; a holiday's own `party` weight on its night.
- **Lobby 2.0 (the password sign):** a window's still look can carry a card ("TONIGHT'S PASSWORD", 14–16 pt) — the apartment or an edge
  window's visible half via `roomDraw(id, fn)` (7a's hook, still called after the life).

### Handoff → 6b (the special-occasion sky), then 8b (THE LIFE)
The speakeasy is alive day + night. The owner reviews the starter ten on her iPhone (each via its `&force=window&moment=` link) before any
more moments are made; adding one = one catalogue entry + one painter (~15–30 min). 8b: the raid on the hooks above, the rooftop guests.

## SP2 — SPEAKEASY POLISH (Oct 24 2026; the blade, the windows, the wall-washers, crisp shopfront lights, the café lights, the awning; behind `?city=2`)
The owner reviewed 7b on her iPhone: the life works, four things on the speakeasy's FACE weren't right. This pass fixes those four + the
add-ons sent during it (the café-light canopy, the awning at night, a tint per room, louder sky sounds, the placeholder people hidden). The
moments' logic + schedule are unchanged. (plan.md has no sections by this pass's names — the prompt was the brief.)

### 1. THE BLADE — a classic 1920s theatre blade (`speakeasy.js#BLADE`, `bladeLetters`, `paintLetters`, `paintBlade`, `MARQUEE`)
- A DARK ENAMEL board (deep navy-black) for EVERY game, a thin gilt frame, the game's colour only as a thin PINSTRIPE inside it.
- The name in BIG BOLD letters filling the board's width (`bladeLetters`, PURE + tested for every game): one column a word (two-word names
  side by side, each read top-down — a single column of 11 letters would be 7 pt tall), the cap height up to 0.86 of a slot and never taller
  than 1.5 × its column; every letter stretched by ONE factor taken from an H (an I stays a stroke, a W never leaves its column). At 402:
  OVERCLOCK / RUMRUNNER ~9.6 pt, SLIPSTREAM 8.6, the two-word names ~13 pt.
- BY DAY cream letters with a gold keyline + a drop shade; AT NIGHT the letters LIGHT THEMSELVES — a warm-white letter with a white-hot
  core + a TIGHT baked glow (`BLADE_GLOW` 1.6 pt, the canvas's own shadow, one canvas per game + size: no per-frame cost).
- THE MARQUEE now only on the stepped CREST + the FOOT (13 bulbs, symmetric; none down the long sides — the letters get the room); the slow
  party chase on those. The board's level logic (PF's `bladeLevel`, `BLADE_LIGHT`, 7b's `MARQUEE_LIGHT`) is gone — a dark board never glares.
- WIDER + TALLER where it can be: the brackets 0.32 → 0.22 units + the side frame thin (the face ~30 % wider: the wheel's left leg is still
  ~1.5 pt from its right edge, tested), the top up to the parapet (v1 10.3 → 11.0: ~25 × 112 pt at 402).
- `&ad=<game id>` previews any game's blade (the rotation is weekly).

### 2. THE WINDOWS — big clean panes, less inside, the TV upper-RIGHT (`windows.js#SASH_RAIL`, `glassOf`, `paintRoom`, `speakeasy.js#paintWindow`)
- A slim frame + a 1920s ONE-OVER-ONE sash with the meeting rail HIGH (`SASH_RAIL` 0.74 of the glass: a short upper sash) — never a bar
  through the scene; no muntins. The deep reveal + the sill kept.
- LESS INSIDE: each room a warm wall + ONE light + one or two strong shapes — THE BAR the back-bar's glow, two shelves of bottles, the
  pendant (a crisp core + a tight halo), the counter; THE JAZZ ROOM the amber shade lit from behind (one soft pool); THE APARTMENT a warm
  wall, the fringed lamp + its light, the armchair's back, narrow curtains tied back at the edges; THE BACK ROOM one green-shaded lamp over
  the table + two heads; THE EDGE windows the curtains drawn + the bright gap (two soft folds). By day the curtains 0.32 → 0.2 units wide.
- THE ROOM MAP (the owner: the TV belongs upper-right):
  | | col 0 (edge, half cut) | col 1 | col 2 |
  | --- | --- | --- | --- |
  | floor 3 | `edge3` curtains | **`back`** the card table | **`apartment`** the lamp → THE TV, the cat, the wake, the window box |
  | floor 2 | `edge2` curtains + the plant | `bar` (the clear window) | `jazz` (the shade) |
  `TANGO_PATH` follows: edge3 → back → apartment → jazz → bar → edge2. Every moment re-checked in its window (frame bursts).
- The light LANDING outside each lit window (`landing`: the sill's lit top, the left reveal's face, a short fall) replaces the soft blob
  that sat round every window (tier ≥ 1); the TV's blue lands the same way (`spills`).
- **EACH ROOM ITS OWN BULB** (the owner's add-on; `ROOM_TINT`, a multiply in the lit canvas): one incandescent family — the bar + the jazz
  room the deepest amber edging to red, the back room a low amber, the apartment a soft peach / lampshade gold, the edge windows a little
  dimmer + each a touch off its neighbour; the barbershop the cleanest warm-white (its own lamp); the TV the ONLY cool light. LATE
  (`lateOf`: from 11:30 pm, full by 1:30) dimmer + warmer (`LATE_TINT`); the dawn wake's lamp a little paler.

### 3. THE WALL-WASHERS — accents, not panels (`speakeasy.js#WASH`, `washCone`, `paintWashers`, `paintWasherLamps`)
- A VISIBLE fixture under each capital (an iron arm + a bowl hood, its lit rim + a white-hot lamp just showing).
- The light a per-pixel SOFT V (`washCone`, PURE + tested): a hot spot just under the hood fanning down + widening, gone within `drop` 1.75
  units (~36 % of the pier); no outline anywhere — the cone's sides + its foot fade per pixel; dimmer (`a` 0.8 → 0.6). The pier's own
  bricks re-laid lit (the texture shows through). The old scallop's rounded top read as arched windows — gone.

### 4. CRISP SHOPFRONT LIGHTS (`speakeasy.js#paintLit`'s shop, `paintGround`'s sconce, `SHOP_GLOW`, the basement)
- THE BARBERSHOP LAMP: the 2.9-unit glow over the whole glass → a bright globe + a tight halo (`SHOP_GLOW.lamp` 0.34 → 0.2), its light
  LANDING — an upright pool on the back wall + the mirrors under it, the chair's seat, back + headrest edges, an oval on the floor, a glint
  in the mirror; the dark shop round it stays dark.
- THE SCONCE: a tighter halo (0.42 → 0.24) + a smaller pool on the brick (landR 1.3 → 0.95, steeper), its light catching the granite
  surround's top edge, the door's upper planks (fading down) + the steps' fronts.
- THE BASEMENT: its soft blob → its light on the sill under it. THE POLE unchanged (e2e: its glass 207 vs the sconce 83, the lamp 115).

### 4b. THE CAFÉ-LIGHT CANOPY + THE AWNING AT NIGHT
- **THE CANOPY** (`strings.js`, rewritten; `CANOPY`, `BULB`, `frontProfile`): 3 swags between 4 TALL SLIM POSTS standing on the roof deck
  SET BACK 1.2 units behind the parapet (two along the front — clear of the billboard's legs — one at the back by the side wall, the left
  run coming in from off screen); 8 BIG Edison bulbs in view at every phone (r 1.25 → 2.3 pt: a warm glass globe, a white-hot filament
  loop, a glint, a TIGHT halo ×2.6), ≥ 8 pt apart; the wire thin (it catches the light at night, so the bulbs read HUNG). The drawing is
  CLIPPED to the sky above the building's front silhouette (the parapet, the finials, the Deco crest) — a bulb mostly behind the crest
  isn't hung there (the middle of the front swag goes behind the crest: real depth). Party nights: warm party colours (amber, pink,
  gold, orange, a little violet) slowly cycling (a step every 2.6 s, crossfaded) + a soft punch on the beat. By day clear glass globes
  with a dark filament. Their light lands faintly on the parapet's coping + face. The 7a/7b parapet posts are gone. Owner's rule: if it
  still looks cheap on her phone, it goes (two refine passes here: it reads as café lights at 402).
- **THE AWNING AT NIGHT** (`AWNING_LAMP`, baked by the lamps' ramp): a small lamp under it at the wall over the window (hidden by the
  canvas from this camera — only its light shows): the canvas lit from beneath, warm near the lamp + fading to the front edge, the
  cream stripes glowing more than the red (thin canvas), a warm rim on the scallops, a soft short glow on the shopfront + the pavement.

### 5. The add-ons outside the speakeasy
- **THE SKY SOUNDS LOUDER** (docs/audio.md#the-sky-sounds): the jets, the helicopter + the burner +6 dB, the airliners, the banner plane,
  the geese + the drone hum +3.5 dB; peaks capped by the player; still low-passed + distant.
- **THE PLACEHOLDER PEOPLE HIDDEN** (like the cart + the bus) until 8b walks the real ones: `scene.js` draws them only with
  `&force=placeholders` (a SPEAKEASY row in the preview panel); the layout keeps them (their boxes, the knock's door unchanged). The window
  silhouettes stay.

### Previews (the owner's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
Night `2026-10-22T22:30` · 3:30 am `T03:30` · noon `T12:00` · the shop opens `T09:15` · a party night `2026-10-24T21:45`; any game's blade:
`&ad=overclock` (agent, stakes, golf, slip, rum…); each moment on a loop: `&force=window&moment=<id>` (wake at `T07:20`, shop-open at
`T09:20`, bartender at `T16:20`, the rest at night); the placeholder people: `&force=placeholders`.

### Tests (SP2)
Unit 571: `harbor.test.mjs` — THE CAFÉ-LIGHT CANOPY (posts set back, 8–12 bulbs in view, ≥ 8 pt apart, the silhouette), THE MARQUEE (crest +
foot only, ≥ 3.2 pt apart, the chase), THE BLADE READS (every game: a column a word, ≥ 8.5 pt letters at 402, inside the bulbs), THE
WALL-WASHERS (the soft V: a hot spot, fading fast, gone within ~⅓, no outline), THE ROOMS (the TV upper-right, the rail high, the tints
warm + distinct, late); `harbor-sounds.test.mjs` the new sky levels; PF's blade-level test removed. e2e-harbor locally: `speakeasy`,
`windows`, `party` 49 / 49, `panel`, `sounds` 40 / 40 (the café lights' counts, the marquee's 13 bulbs, the washer's hot spot between the
back room + the apartment). The whole suite: the cloud job. No new per-frame work (the blade's letters, the washers, the awning are baked;
the canopy has fewer bulbs than 7b's string lights) — no speed round.

### Known issues (SP2)
- The front swag's middle bulb hangs behind the Deco crest (skipped): the canopy shows a gap over the crest — depth, not a missing bulb.
- The canopy's bulbs sit just under the billboard's foot and its wire crosses the billboard's dunnage frame near the posts (the band
  between the board and the parapet is ~18 pt at 402).
- The room tints are subtle by design (a multiply of ≤ 90 levels of red-blue difference) — side by side they read as different bulbs.
- At night the barbershop stays a CLOSED shop under one lamp (the plan's story) — the cleanest warm-white, but a small light.
- 10-letter one-word names (SLIPSTREAM) get ~8.6 pt letters at 402 — the board can't grow (the wheel's leg on the right, the stop light
  below, the parapet above).
- WebKit can't run here: the blade's glow is the canvas's `shadowBlur` (Safari supports it — not `ctx.filter`), baked once.
- **THE CLOUD JOB (2 runs, the owner's cap):** run 1 — 295 / 296, the wall-washer probe read one pixel of the narrow new cone (76 red locally,
  63 in the cloud) → the check now samples the hot spot's brightest + warmest of five points against the same pier a floor down (fixed,
  passes locally). Run 2 — 295 / 296, the washer check passing; the one failure THE POLE on a party night (every sweep washed toward white
  mid-punch: 210,210,197 · 209,137,209 …) — the barber pole's code wasn't touched by this pass, it passed on run 1, and it's the known
  "a loaded run catches a sweep mid-punch" flake the check already retries for. Not re-run (the owner: never spend a cloud run to confirm a
  flake); if it repeats, the check should sample between beats (`party().beatU` < 0.5) rather than on a timer.
- **THE QUICK `tests` WORKFLOW's smoke test** timed out on `golf: back to lobby` on the two docs / CI commits after SP2 (the SP2 commit's own
  run passed; the code under test identical; NEON PAR's flow, untouched by this pass) — the known GitHub-machine flake 793141d raised to 60 s.
  It now repeats: worth a real look in the next pass that touches the games or the smoke test (what the lobby waits on after NEON PAR).
  → **Looked at (PART 8P, section 0 n):** the failed runs' screenshots show BOTH phones still on NEON PAR's hole 1 after the 60-s wait —
  the lobby write never landed, not a slow wait. Most likely cause: NEON PAR is three.js on software WebGL on the 2-core runner, a tab's
  2-s host beat goes ≥ 10 s stale, the other phone claims host (as designed), and `backToLobby()` on the old host returns silently
  (`isHost()` false). The smoke test now sends startGame / backToLobby to whichever tab is the host NOW, retries back-to-lobby up to 3×
  30 s from the current host, and logs `NOTE … is the host now` / each tab's uid + hostId + phase when it has to retry (so the next
  failure, if any, says which it was). Unconfirmed on GitHub until the next runs.

## PART 8P — THE PEOPLE (the promenade + the rooftop) + THE SPEAKEASY POLISH CARRY-OVER (Oct 24 2026; behind `?city=2`)
Ben reviewed SPOL on his iPhone (the windows, the room tints, the wall-washers + the café lights work); this pass fixes his carry-over notes
(section 0, its own commit 7dc3a8d) and gives the foreground its PEOPLE so it can be judged as a living place. Helpers: the sounds (k + l) and
the CI split (m + n) ran beside the lead; docs/audio.md "8P — THE SPEAKEASY + PEOPLE SOUNDS, THE JETS' DUCK" + docs/testing.md have theirs.

### 0. Section 0 — Ben's SPOL review
| note | what changed (where) |
| --- | --- |
| a. THE BARBERSHOP FRONT BLURRY | every baked layer was already dpr 2 (measured) — the softness was the PAINTING: ~3 pt gilt caps with a drop-shade offset by under a point (a double image), a milky white haze over the lower glass, a ~3 pt OPEN/CLOSED card on the door, all smeared further by an iPhone's 1.5× upscale of the dpr-2 canvas. Now: the gilt arch rebuilt (`speakeasy.js#paintGilt`, `GILT`: bigger, ONE crisp dark keyline, no offset shade, flatter + higher; lit gold at night by the awning's lamps), "SHAVE & HAIRCUT" gone (the sign's spot), the haze off the glass, the door card gone |
| b. THE AWNING LAMPS | three (`AWNING_LAMP.us` each end + the middle, each ×0.72), crisp brass bell shades + bulbs under the valance (`awningBulbs`, live), their light baked on the canvas, the shopfront + the pavement; the valance a little shallower (`VAL` 0.42 → 0.34) so the window's head shows. The pole stays the brightest |
| c. THE LAMPPOST GLOBES | the lit glass drawn as a vector ellipse every frame (a stretched sprite softened it), halos tighter (`stage.js#LAMP_HALO` 2.4 / 2.2 / 1.45 → 1.75 / 1.6 / 1.18) |
| d. THE TV | bluer (64,108,255 ↔ 128,162,255), the glows lower, its level capped (0.92): no white-grey frame (`windows.js#tvRoom`, `spills`) |
| e. SLIPSTREAM | `speakeasy.js#bladeWords`: a one-word name over 8 letters stacks in two columns at its seam (`BLADE_SPLIT`: SLIP / STREAM, RUM / RUNNER, OVER / CLOCK — the last two were 9.6 pt, also under the rule); every game ≥ 10 pt at 402 (tested) |
| f. THE STREET + THE COBBLES | the street under the dock a muted aged OXBLOOD BRICK street (`street.js#SETT` 118,70,62; small bricks 0.5 × 0.3 laid tight in rows, tar + sand joints, FLAT — `paintFlat`, worn smoother + darker along the wheel paths + beside the rails); the promenade's setts flat too (`paintSett(…, { flat: true })`: no pillow crown, no lip) |
| g. THE CROSSWALK LIT | `road.js#CROSS`, `crossPools`, `crossLightOf`: each lamp of the flanking pair throws a pool onto the road, overlapping on the crossing (rings of light baked with the road), the stripes catching it (paler + a glossy near edge) |
| h. THE BASEMENT WINDOW | `speakeasy.js#BASEMENT`, `basementLight` (PURE): a deeper smoky amber-copper, brighter; shadows of people passing behind it (~3 slots in 5, one or two figures, the light dimming as they pass), a pulse with the beat on party nights, a flicker ~once in 8 minutes; its bars over the glow |
| i. THE LAMPS' LIFE | `core/harbor-lamps.js` (PURE): at dusk each lamp catches at its own point of the ramp in a seeded order with a warm-up stutter; ~1 slot in 2 of 7 minutes ONE lamp stutters 2–3 times (never two at once, never the crossing's pair while an event stands on the inlay), ~1 in 5 of those a 3–6 s outage; a lamp that's off takes its baked pool back down (`stage.js#dimPools`). `harbor().lampLife()` |
| j. THE HUSH WORD SIGN (Ben's add-on REPLACED the shop-window sign) | `core/harbor-hush.js` (plan, PURE) + `screens/harbor/hushsign.js`: BARE NEON TUBES hanging inside the LOWER-RIGHT upstairs window (the jazz room — its silhouettes show between the letters), a signal from someone inside — ONLY while a lobby is open: absent otherwise (no unlit tubes, no OPEN), lit letter by letter as it appears, glowing by day too (the coloured glass + a dark edge; at night a thin dark edge + the lit tube, a hot classic neon red so it reads against the amber room), a last flicker + gone on leaving (`darkLevel`). Sized for FOUR letters (Ben, after the feasibility check — the glass is ~22 × 27 pt at 390): a 2 × 2 block as big as the glass allows — **11.1 pt at 390, 11.4 at 402, 12.2 at 430** (the glass's height is the limit); five letters (3 + 2) fit at 8.7–9.6 pt. Read at a glance at 390 by day + at night (checked). The barbershop window is clear again (the widening 4.22 → 4.6 units stays). Preview `&force=hushsign&hush=JAZZ` (or `SWING`); Lobby 2.0: `harbor().speakeasy.hush(word)` (null = no lobby) |
| k + l. THE SOUNDS | → docs/audio.md 8P (the jets +6 dB + a 3.6 dB music duck, a 1–3 kHz presence on the aircraft; 42 of 83 slots filled; the bus from the 1945 truck; `tv-murmur` left empty: music + a clear voice in it) |
| m. CI MINUTES | the cloud suite in 4 parallel jobs (`tests/integration/harbor-jobs.mjs` — a group in no job fails the unit suite), the full run only on a push whose commit message carries `[harbor]` (or by hand), the known flaky visual checks → warnings on CI (`okF`) — docs/testing.md |
| + Ben's zoomed day shot (an add-on) | (1) the gold leaf was drawn TWICE (the bake's copy + the live layer's, a hair apart — the ghost): now only the live layer, on whole device pixels at its natural size (`giltOver`); (2) the awning's notch near its right end was the side flap's triangle + the patch: gone, the stripes continuous; (3) THE WINDOW BOX crafted (`paintWindow`'s `o.box`): a deeper bottle-green planter on iron brackets, a full mound of foliage with bold seasonal blooms (mums now, geraniums in summer, tulips + pansies in spring, evergreen + berries in winter), trailing ivy over the front — kept (it reads at 402); (4) BOSTON IVY (`paintIvy`, `IVY`, `paintIvyBed`) up the corner pier from a small granite-kerbed bed, past the door to about the first floor — crimson now, green in summer, fresh green in spring, bare woody vines in winter; never over the door, the sconce or the blade (its reach by height); (5) "EST. 1924" off the valance → THE DATE STONE (`DATE`, `paintDateStone`): a carved limestone tablet in the parapet's crest, "1924" in big incised numerals (~8 pt at 402), washed warm from a hidden lamp on the cornice at night |
| n. NEON PAR's back-to-lobby | the smoke test now sends startGame / backToLobby to whichever tab is the host NOW + retries from it (the host changed on a starved runner) — SP2's Known issues |

### 1. THE PEOPLE ON THE PROMENADE (`core/harbor-people.js` PURE + `tests/harbor-people.test.mjs`; `screens/harbor/people.js`, `folk.js`, `bus.js`)
- **GUIDED FREE WILL, PLANNED** — not simulated: a visitor is a KIND (`KINDS`: its goals — `{ from }` an edge / a door / the bus / across the
  crossing, `{ at }` a node, `{ pose, dur }`, `{ cross: 'out' }`, `{ door }`, `{ bus: true }`, `{ exit }`) turned into an ITINERARY of walk legs
  (routes round the obstacles: a tiny visibility graph, `route`) + pose legs on the clock (`planVisit`). Visits are generated per BLOCK of
  480 s from a seed (the local date + the block) in two overlapping PHASES (A at k·B, B at k·B + B/2): a visit lives inside its block, so the
  blocks are independent; B is planned against A's occupancy (+ the bus riders), so the count never passes `FOLK.cap` (12). The promenade at
  any moment is a pure function of the city clock (`folkAt`): every phone sees the same people, a page opened mid-way joins them mid-stroll
  (tested: a cold start = a phone that watched all day). ~0.01 ms a frame; a new block ~3–6 ms once every 4 minutes.
- **THE MAP** (`folkMap`): nodes from the real pieces (the doors, the shop window, the bench's two seats, the cart, the inlay, the crossing's
  kerbs, the bus stop, a spot to look up at the sky), exits (both edges at several depths; the waterside sidewalk's ends — left = behind the
  speakeasy), obstacles (the building, behind the bench + crabapple + under the blade, the road but the crossing, the kerbs either side of it,
  the tall lamps, the cart + the strip in front of it, the inlay's ring during an event, the lobby line).
- **WHO'S OUT WHEN** (Ben's add-on) is DATA — `MIX`: early (joggers, dog walkers, a worker to the bus), the commute (brisk walkers, bus
  riders, a newsboy), the morning + midday (strollers, couples, lunch on the bench, window-shoppers, a customer into the barbershop, the cart,
  someone crossing to look at the water, two friends chatting), the afternoon, homeward (to the bus, the crossing, the edges), the evening
  (couples arm in arm, guests to the side door, a few joggers, dog walkers, someone pointing up at the sky), late (stragglers, a couple out of
  the side door, a lone walker), the small hours (a night worker, often nobody). `MOOD`: weekends busier + the evening an hour later; party
  nights ×3.2 guests, ×1.3 the count; rain (Part 9's hook: `ctx.rain`) ×0.45, faster, umbrellas, no lunch on the bench.
- **THE CROSSING:** people wait at the kerb on WAIT (facing the lantern) and start only in WALK, early enough to finish before the blinking
  WAIT ends (`walkStart`), at least a brisk pace (`crossV`) — tested over two days at 390 / 402 / 430: nobody in the road but crossing / at the
  bus door. Across: the waterside sidewalk, then left (behind the speakeasy) or right.
- **THE BUS** (`busesOf`, `bus.js`): a 1920s city coach (two-tone HARBOR LINE livery, a domed roof + route board, spoked wheels turning with
  its distance, a folding door on our side, lit windows + riders + headlamp beams at night), 2–4 an hour by day, one late, none 2–5 am; it
  comes from behind the speakeasy, STOPS JUST LEFT OF THE CROSSING (decided here: right of it the framing maple + the cart's umbrella hide the
  road; its front stops short of the crosswalk, its rear clear of the speakeasy), the door opens, riders step off (`busRiders`) + on (visits
  with `{ bus: true }` wait at the stop), and it pulls away through the crossing ONLY ON GREEN (it waits at the red). Its sounds:
  `snd.bus('arrive' | 'idle' | 'door' | 'depart' | 'pan' | 'gone')`. Preview `&force=bus` (one a minute).
- **THE CART back, placed** (`PHONE.cart` f 0.825, z 42.4; `CART_SHOWN`): right of the inlay (outside an event's clearance — tested), clear of
  the crossing; the vendor stands behind it 10 am → 9 pm; people stop for chestnuts; nobody walks in front of it (it bakes with the front row).
- **DEPTH** — three passes (`people.js`): FAR (the crosswalk, the waterside sidewalk, the bus) after the road layer, before the stage — the stop
  lights, the lamps, the trees + the speakeasy stand in front (walkers off left go behind the building); NEAR (the promenade) after the stage +
  the speakeasy's live layer, before the front row (the corner globes, the framing maple, the cart are nearer than the walkable floor:
  `FOLK.zMin`); ROOF clipped to the sky over the parapet. Nobody walks behind the bench / the crabapple / under the blade (an obstacle), so the
  baked stage never needs to cover a walker.
- **THE LOOK** (`folk.js`): `LOOKS` by kind + season + party + rain — long coats + fedoras, cloche hats + drop-waist dresses, flapper dresses
  (a fringe, a headband + feather) + tuxedos (a top hat now and then) on party nights, shirt-sleeves + boaters in summer, scarves in autumn /
  winter, a newsboy (kid-sized) with his papers, a worker's flat cap + lunch pail, a briefcase / a purse; dogs on sagging leashes. A
  STRIDE-LOCKED walk (the planted foot fixed on the ground — tested), a jog, poses (sit, wait, watch, chat — the partner steps round to face,
  point up, wave, window-shop, at the cart, lean on the railing; on the roof dance, toast, garden), arm in arm. LIT by the scene: by day the
  sun's side + a cast shadow along the real sun; at night the scene's darkness (`T.night`) + the lamps' light where each stands
  (`stage.js#lightField`) + a crisp rim toward the nearest lamp; a contact shadow always. ~27 pt at the promenade's middle.
- **SOUNDS** (all through their slots): footsteps (cobble / heels) on the NEAREST walker's footfalls, very soft; a distant laugh from a pair
  chatting now and then; the cart's bell; the line's murmur; the rooftop party's bed; the bus.
- **THE LOBBY LINE** (`linePlaces`, `lineRect`): from just left of the side door along the shopfront, bending down toward the bottom-left
  corner; guests past five wait on the open floor beside it — never cut by the left edge, never under the dock, the door clear (tested at
  390 / 402 / 430 for 4 / 6 / 8); they shift their weight, check a watch, chat. Preview `&force=line&n=6`; Lobby 2.0:
  `harbor().people.setLine(n)` (the room's players — their names / looks are Lobby 2.0's).

### 2. THE ROOFTOP PEOPLE (`roofMap`, `roofCrowd`, `roofVisits`, `roofAt`)
Their own small zone: up + down through the stair house's door (never popping in), taller than the parapet (clipped to the sky over the
front's silhouette), lit by the café lights. Party nights + summer weekend nights: up to `FOLK.roofCap` (6) — couples dancing, a toast, the
bar cart, someone at the parapet; otherwise 0–1 (someone stepping out for the view in the evening; the gardener at the beds by day, April →
October); nobody in the rain. The rooftop party's sound bed only while ≥ 3 are up there.

### Hooks
- **Lobby 2.0:** `harbor().speakeasy.hush(word)` (the sign), `harbor().people.setLine(n)` (the line; the figures' looks can take the players'
  colours later — `lookOf`).
- **8b (THE LIFE):** a new visitor = one `KINDS` entry + its weight in `MIX`; a new figure = one `LOOKS` branch; cabs: a `from: 'cab'` like
  `from: 'bus'` (the back road's kerb); the raid: `people.budget(0)` empties the street; the billposter / sign painters: a roof `kind` with a
  `{ pose }` at the billboard.
- **Part 9 (weather):** `frame({ rain })` (fewer, faster, umbrellas); snow: the same hook + `LOOKS` (boots, mufflers); wet paving reflections
  under the figures go with the street's wet pass.
- **6b's director:** `harbor().people.budget(k)` (0..1 — a big sky moment can thin the street).

### Previews (Ben's iPhone — `?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&when=…`)
8:30 am `2026-10-22T08:30` · noon `T12:30` · 5:30 pm `T17:30` · dusk (the lamps catching) `T18:52` · 10:30 pm `T22:30` · 1 am `2026-10-23T01:00` ·
a party night `2026-10-24T21:45` (the roof) · the lobby line `T21:30&force=line&n=6` · the hush sign `T22:30&force=hushsign&hush=JAZZ` (+ noon
`T12:30&force=hushsign&hush=JAZZ`, a 5-letter `&hush=SWING`) · the bus `2026-10-22T11:00&force=bus` · rain `T19:30&wx=rain` · nobody `&force=no-people`.

### Tests (8P)
Unit 590 (`harbor-people.test.mjs` NEW, 12: the hush sign's size + states + its strike; the lamps' life; the basement; the crossing's light;
WHO'S OUT WHEN; two days of people at three phones — the cap, nobody under the dock / in a wall / behind the bench / in front of the cart, the
road only on WALK, every arrival + departure through an edge / a door / the bus / the crossing; join mid-way; the bus; the line; the roof; the
stride lock. `harbor.test.mjs`: the blade's 10 pt rule for every game, the brick street, the cart placed; `harbor-jobs.test.mjs` NEW).
e2e-harbor: NEW `people` group (10: people out at noon + drawn (A/B vs `no-people`), the hush sign by day / at night / with a word, the
lamps all on late, the line preview, a bus stopping with its door open, the roof's party) — in the `street` cloud job; locally `street`
(64/64 after the mirror-door probe moved above the sign) + `people` 10/10.

### Performance (A/B in one run, `title-perf.mjs --ab` against 7dc3a8d (section 0), 402×874, the laptop without a GPU)
| scene | t2 · t1 · t0 work A → B (ms, 4× CPU) | frame p95 · slow | verdict |
| --- | --- | --- | --- |
| `np-night` (a weekday 21:30) | 9.76 → 6.83 · 4.54 → 5.49 · 3.16 → 4.2 | 16.8–17.1 · 0–1.7 % | same · SLOWER (work) +0.96 (noise ±0.81) · same (+1.04, noise ±3.33) |
| `np-party` (Sat 23:00) | invalid · invalid (at 4× without a GPU the party steps itself down: no A windows — as every pass) · 8.78 → 12.83 | t0 16.8 → 33.3 p95 · 0.7 → 7.5 % slow | **SLOWER (work) +4.06 ms at tier 0** (noise ±1.46) |
The first round said the same (+1.1 / +1.5 night, +5.3 party t0); the ONE FIX between them: figures off the screen's edges / behind the
speakeasy not drawn, no rim pass at tier 0, the roof's clip a small polygon (it was a whole-screen even-odd mask a frame). After the
re-measure (per the plan's rule — no loop): a flapper dress's fringe as one path (it was ~18 strokes a figure) — NOT measured. The party
night at tier 0 is the open question: the laptop's 4× throttle is ~4× an iPhone, so ~1 ms on the phone — **Ben's iPhone readout (&debug=1) on a
party night decides**; if it shows slow frames, the steps: fewer figures at tier 0 (`FOLK.cap` by tier), the roof's guests off at tier 0.

### Known issues (8P)
- The rooftop's visible deck is narrow (the left part of the roof is off the screen's edge at 402): the guests read as small warm silhouettes
  above the parapet, by the café lights.
- The bus is partly behind the crabapple's crown at its stop (real depth — it's in front of the road); the riders read below the crown.
- A new block of visits is planned in one go (~3–6 ms on the laptop at 1× CPU, once every 4 minutes per phase).
- Footsteps / laughs / the bus need the city sounds armed (the first tap on iOS); all silent when muted.
- WebKit can't run here (as every pass): the figures are plain paths + fills (no filters), the sign's glow the tube system's shadowBlur.
- **THE POLE on a party night** (e2e `speakeasy`) now fails EVERY local run (3 of 3; SP2's cloud run 2 too): the column reads white +
  pale magenta, no electric blue (e.g. 210,210,210 · 209,135,210). The pole's code wasn't touched by 8P — two in a row means it's real, not a
  flake: the party neon's blue stripe probably comes out too pale (`speakeasy.js#poleColours`' neon `b`) or the probe lands on the white
  band; on CI it's a warning (`okF`) — for FREV / the next pass that touches the pole.
- The `speakeasy` group's light probes now run with `&force=no-people` (a walker passing between two readings moved a probe by 18 levels).
- **THE CLOUD (2 runs, Ben's cap):** run 1 (ab46b44, the `[harbor]` push — the first on the 4-job split, ≈ 4¼ min wall, 4 jobs): audio, show,
  city green; street 73 / 74 — "THE POLE at night" read its red stripe at 210,121,139 against a hard `g < 120` (passing here at 120 / 119:
  the probe on the pole's lit core, a borderline threshold, the pole untouched) → the probe moved off the core + the red test relative (red
  leading by 60 / 50). Run 2: only the `street` job by hand (`gh workflow run harbor -f job=street`).

### Handoff → FREV (the Fable foreground review), then 6b + 8b
The foreground is alive: people, the bus, the cart, the roof, the line + the sign as Lobby 2.0's hooks. FREV reviews it with fresh eyes (the
speakeasy + promenade + lighting + the systems' separation — clouds, lights, sounds, people hooks).

## Review findings (Part 1)
Read-only review of Part 1 against this file (Oct 21 2026): the camera + layout numbers at the six sizes, the scene API against
title.js / title-dock.js / backdrop.js, the baker + the budget, the scheduler, the flag, and what Parts 2–12 will hit. The camera
table above checks out at every size (F, VPY, the squeeze, people, the bus); the API matches every call the title makes; the flag
is never saved; the 22 tests pass. Ranked, real problems only (what Part 2 already plans is left out):

1. **FIXED (Part 2):** the corridors are chosen against the whole silhouette and tested so (towers, heroes, the panorama, side faces). **The landmark towers and a hero block stand ON three of the seven sun gaps, on every phone** — the claim above ("the landmarks
   and hero blocks stand clear of them") is false and the test only checks the bands (`harbor-layout.js#harborLayout`: only
   `band()` calls `inGap`; `tests/harbor.test.mjs` "the sun gaps stay clear"). At 390×844 the sunburst (x 249–278) covers the gap
   at 273 (f 0.70), the needle (300–323) and NEON PAR (290–334) cover 308 (f 0.79), the mast (45–69) covers 51 (f 0.13); at
   1440×900 the mirrored sunburst covers 1008. And since the rays are drawn between the `far` and `near` layers (scene.js#draw),
   the near layers are exactly what occludes them — these are the gaps that matter. **Fix (Part 2, before the rays):** choose the
   corridors against the whole silhouette (bands + landmarks + heroes + the panorama's mirrored landmarks): e.g. 0.13 → ~0.19,
   0.70 → ~0.73 (12 pt free between the sunburst's 278 and PAR's 290 at 390), drop or move 0.79; and test
   `[...bands, ...landmarks, ...heroes]`, not `L.bands`.
2. **FIXED (Part 1.5):** `createScheduler` keeps `running` as state from a fixed anchor (the local midnight a day back), replayed once, advanced once per slot; tested (t vs t − SLOT, a contended parade case, anchors a day apart). **The scheduler re-decides the past as its window slides: events pop in mid-flight and vanish** (`harbor-events.js#schedule`,
   `n0 = n1 − ceil(longest / SLOT)`). A slot's admissions depend on lane conflicts with the slots before it; every 90 s the window
   drops its first slot, so the next slot is re-decided without the event that blocked it, and an event that was "blocked" a minute
   ago is "running at k ≈ 0.8" now. Measured with 5 sky events of 4 slots + 5 water events of 6 slots, all common, 9000 samples
   over 3000 slots: at 5217 of them an event was active that the schedule one slot earlier did not have. Rarer with few events, but
   it is exactly the long, contended case (a parade, the banner plane). The "deterministic" test compares a moment with itself and
   cannot see it. **Fix (before Part 6's first real event):** keep `running` as state advanced one slot at a time from a fixed anchor
   (replay from local midnight − 1 day at load, ≤ 1920 slots, once), advanced in the scene once per slot instead of recomputed from
   scratch every 500 ms; add a test that `schedule(t)` and `schedule(t − SLOT_MS)` agree on every event spanning both.
3. **FIXED (Part 1.5):** `plan()` keeps the baked canvases + `ready`; the stale layer draws (stretched after a resize / tier change) until the swap; rebakes wait for the crossfade; E2E: `setTier(1)` never blanks a stage pixel. **Every re-layout blanks the whole city until the next bake lands.** `bake.js#plan` sets `ready: false` on every group (the
   canvases keep their pixels, `scene.js#layer` skips them), and `layout() → plan()` runs on a tier step-down (exactly when frames
   are already slow — bake steps of 2–3 ms mean 10–20 frames of sky, boats and people over nothing), a desktop resize, `safeBottom`,
   and any measured dock / tag rect moving > 1 pt (`maybeRelayout`, e.g. the sign reflowing when the Google fonts swap in after
   the first bake). The crossfade exists but never gets a source on this path. Related: `baker.start()` queues a clear of `next` —
   the crossfade's source — so a second look change within 1.2 s of a bake landing (every `&speed=60` run) dims the city for the
   rest of the fade. **Fix:** in `plan()` keep `ready` and the old band's `y0 / h` for a group whose canvas size is unchanged and
   draw the stale `cur` until the swap (then the existing 1.2 s crossfade); on a resize / tier change draw the old `cur` stretched
   into the new band rather than nothing; gate `rebake()` on the crossfade being done. E2E: `setTier(1)` mid-session and assert a
   stage-band pixel is never the bare sky colour.
4. **FIXED (Part 2):** blocks are clipped at a corridor (the piece in it lowered to its band's floor), never dropped; tested: no hole in the base. **The gap-skip tears whole blocks out: the "corridors" are 13–94 pt holes, different in every band and at every size** (`band()`
   drops any block touching a gap and advances by the block's width). Measured clear width at the gaps (planned 6–10 pt): haze
   14–22, far 13–61, mid 22–92, near 46–72. Part 2's skyline inherits missing teeth where it wants narrow slots for the rays.
   **Fix:** clip, don't drop — end the block at the corridor's left edge and resume at its right (two blocks); pad the corridor by
   2 pt because a side face intrudes up to ~1.5 pt (z1 − z0 = 12–14).
5. **FIXED (Part 2):** every block / tower tier / hero has `win`; the lit windows are their own layers (lights.js) on the light key; `set()` and `spell()` address windows by (building, tier, col, row). **Nothing can address a window.** `blocks.js#skyBlock` rolls the glitter from `rngFrom(round(x0·131 + z0·71 + h·31))` straight
   into the `far` / `near` bakes; no block carries rows, columns or a lit set, and the only windows with identity are the
   speakeasy's six. Part 2 (facades), Part 7 (rooms), Part 10 (flags in windows, a word lit across a facade), Part 11 (party
   windows, the small hours going dark) and the `windows` lane all need a per-building grid and a lit layer that is not in the
   look-key bake. (Also: `h` is in the seed, so the glitter re-rolls on every relayout.) **Fix now, in the layout:** give every
   block / landmark / hero `win: { cols, rows, u0, v0, pitch }` (world units, from the seed) and draw "which are lit" in its own
   cheap pass — a `lights` group re-baked on its own key (per minute) or sprites per frame — so a word, a wave or a flag is
   addressed by (building, col, row).
6. **FIXED (Part 1.5):** `laneRects` gives eight lanes real rects (sky-high / sky-low split), tested at six sizes against the sign, the corner buttons and the dock; `quiet` → `fs.density`, read by the planes, the birds, the swifts and the cars; drawn in `&grid=1`. **Lanes are names, not places; the sky has two schedulers; `quiet` reaches nobody.** The scene never reads `events.quiet`
   (it only returns it), and the district's aircraft / wildlife / fx modules keep their own clocks, so a Part 6 / 10 banner plane in
   the `sky` lane can meet a regular plane in the same strip and a heavy parade cannot thin the birds or the traffic. No lane has
   geometry: the grid draws `sky` as safeTop..limitY with the sign inside it (under the tagline there are exactly 10 pt), so a
   banner plane's only corridor is above the sign, and nothing states it. **Fix (before Part 6):** add lane rects to the layout
   (`sky-high`: safeTop..the neon's top, `sky-low`: the tagline's bottom..the roofline, water, road, promenade, the speakeasy's
   windows + rooftop) with tests like the door's (clear of the sign and the corner buttons, tall enough for a banner), and route
   `quiet` into `fs` as a density factor the aircraft / wildlife / traffic read.
7. **FIXED (Part 1.5):** `skyBlock` passes `y0` to `box()` (and lifts the crown, the hairline and the windows); no screen translate. **The landmark tiers are projected wrong** (`landmarks.js#landmarkSteps`): each tier is lifted with a screen translate of
   −F·y0 / z0, but its far edge is at z1, so a side face's top-far corner lands F·y0·(1/z0 − 1/z1) ≈ 8–9 pt too high on the
   sunburst's top tier; the setbacks' side faces lean. Invisible in grey, wrong under Part 5's shading and Part 4's reflections.
   **Fix:** pass `y0` to `box()` (it already supports it) and drop the translate.
8. **FIXED (Part 1.5):** `setUrlRoom` keeps `city=2` like `pdperf` (E2E: HOST → the URL keeps it → a refresh rejoins on it). **`setUrlRoom` strips `city=2` from the address bar the moment a room is entered** (`identity.js#setUrlRoom` keeps only
   `room / slot / emu / pdperf`). The page keeps the Harbor (the import was bound at load), but a refresh in the lobby, a rejoin,
   or the title after a refresh is today's city — a HOST → refresh test flow silently switches cities. "Never saved" holds; keep the
   flag in the URL the way `pdperf` is kept (one line) so a dev session stays on the Harbor across refreshes.
