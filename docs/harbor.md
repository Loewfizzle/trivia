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
| 5 | harbor hero pieces | the Ferris wheel (turning, bulbs), the lighthouse (the beam), the pier, the boats (Rosie and her bulbs, the taxi, the tug, the sailboats) — the landmark towers moved to Part 2 |
| 6 | sky hero pieces | planes, the banner plane, the helicopter, jets, birds / gulls, the UFO, satellites — the existing systems' behaviour, new artwork |
| 7 | the speakeasy | the facade, rooms you can see into, the door + the knock, the awning "EST. 1924", the rooftop (planters, string lights, people) |
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
  size boxes: a 20 pt person at z 47 and a 110 pt bus at z 60), **`&debug=1`** (logs the camera, the layout and every bake with the
  memory per layer), **`&force=demo`** (the demo event, end to end).
- Previews: `tests/integration/title-preview.html?city=2&…` (no Firebase); shots: `node shots.mjs "<browser>" --preview --city 2
  --safe --sizes harbor --scenes day,golden,night,party,rain,snow` (`--crop stage`); perf: `node title-perf.mjs "<browser>" --city 2`.

## The architecture (Part 1)
```
js/core/harbor-layout.js   PURE  the projector, the camera per screen, the SIZE table, the squeeze, the sun gaps, the whole layout, screen boxes, the roofline, the lane rects
js/core/harbor-events.js   PURE  lanes + events, the stateful scheduler (anchor + replay, budgets, rarity, heavy events → density), the built-in events
js/core/harbor-windows.js  PURE  (Part 2) every window's dice + the light timeline (City 1.0's), the pixel font, layoutText (words on the word towers)
js/screens/harbor/scene.js        createHarbor(): the district's API; the frame; the sky modules wired in; rainbows + party rules; the dock's rects
js/screens/harbor/bake.js         the baker: two sets of canvases, chunked steps, the crossfade, the memory budget
js/screens/harbor/tones.js        the day / golden / night tints (from the real sky's weights), the haze by depth, the real sun's side + height (sunLook)
js/screens/harbor/shapes.js       world-space drawing: boxes (the faces the camera sees), crowns, people, vehicles
js/screens/harbor/blocks.js       (Part 2) a skyline building crafted: materials, Deco piers + spandrels, cornices, setbacks, weathering, the glass,
                                  the sun's side + cast shadows, the street's glow, floodlights, every crown; cellRect (a window's pane on screen)
js/screens/harbor/skyline.js      (Part 2) the two skyline groups ('far', 'near'), far → near, with their veils; the facades' bake steps
js/screens/harbor/lights.js       (Part 2) THE LIT WINDOWS: their own bake (the light key) + what changes every frame (glitter, TVs, a light switched
                                  off / on, the beacons, the words: spell / set)
js/screens/harbor/rays.js searchlights.js   (Part 2) the golden-hour rays through the sun gaps; the rooftop searchlights (hardware + beams)
js/core/harbor-neon.js     PURE  (Part 3) the neon palette (roles + schemes), the outlines, the sign spots + their checks, tonight's pick
js/core/tube-path.js       PURE  (Part 3) SVG paths → tube polylines, the uneven light along a tube (shared with ui/logo.js + ui/tube-logo.js)
js/screens/harbor/tubes.js       (Part 3) THE TUBE: lit (glows, body, core, highlight) + unlit glass, caps, clips; sprites
js/screens/harbor/signs.js       (Part 3) the signs' art (cabinets, icons, HOTEL, JAZZ) + the billboards
js/screens/harbor/neon.js        (Part 3) the manager: spots → signs, outlines projected + cut, sprites built a few a frame, power, moments
js/screens/harbor/sky.js          the sky's gradient + horizon glow (the real sky on it = the district's sky modules)
js/screens/harbor/water.js        (Part 4) THE WATER: the base (baked) + the live mirror of the frame above it, the light columns, the ripples
                                  on the real wind, the paths, the edge; hooks reflect / light / wake / set
js/screens/harbor/quay.js pier.js lighthouse.js boats.js road.js speakeasy.js stage.js foreground.js   the layers, far → near
js/screens/harbor/grid.js         the &grid=1 overlay
```
- **The same public API as `createDistrict`** (title.js / title-dock.js / backdrop.js use it): `set, look, hit, signOn, palette,
  signCol, refresh, safeTop, safeBottom, state, setTier, tier(), sun, neonMoments, signCount, now, speed, skyline, frames, cost,
  party, finale, partyLight, street, knock, door, rainbow, debug, destroy` + `harbor()` (City 2.0 only; `__district.harbor()`).
- **The sky modules are REUSED, called as they are** (district/): `stars, fx (back + front), sun (draw, through, halo, rays, dim,
  moments), aircraft, weather-fx (sky, fogLayer, flash, moonVeil), rain (veils, drops), wildlife (sky, low), frost (pane),
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
  sixths + the camera) in small steps — `TIERS[tier].bakeMs` (2 / 3 / 4 ms) a frame, never a blocked frame — into the second set,
  then crossfaded in over 1.2 s and swapped. Progressive start: the sky draws from the first frame; the city fades in (0.7 s)
  when its first bake is done (≈ 6–10 frames). A moved rect (the title reports the sign's and the dock's real rects a frame after
  mount and every 500 ms), a resize or a tier change re-lays the city. **A re-layout never blanks it:** `plan()` keeps each
  group's current canvas and `ready`, with the band it was baked for (`show`); the scene draws that stale layer — in its old band
  when the pixel size is unchanged, stretched into the new band after a resize or a tier change — until the new bake swaps in,
  then the crossfade (from `prev`). Only `next` (the bake target) is resized, when a bake starts; `settle()` gives the spare
  canvas its group's size again after the crossfade (and after the first bake), so the steady state is two sets at the current
  size. A bake never starts during a crossfade (its source is `next`): the look's rebake waits, a re-layout's bake is queued
  (`wantBake`). The sign or the corner buttons moving without the city moving only re-computes the lanes (no bake).
- **Memory budget** (`bake.js#MEM_BUDGET_MB`): all baked layers (both sets) ≤ **24 / 40 / 64 MB** at tier 0 / 1 / 2. Baked layers
  are capped at DPR 2 (the main canvas's own DPR: tier 2 = 2, so DPR 3 bakes would be downsampled anyway; a DPR-3 stage is possible
  later only together with a DPR-3 main canvas — measure first). Over budget, the tallest layers step down to DPR 1.5, then 1.
  Measured: 15.6 MB at 390×844 tier 2 (+ the main canvas 5.3 MB), 13.3 MB at 1440×900. Canvases are reused on a re-bake, never
  more than two sets, and `destroy()` sets every canvas to 0×0. The E2E proves 20 title ↔ setup cycles leave the same MB and no
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
  planks, a railing, lamps). Clear of the word towers and the hero crowns. Breakwater around the lighthouse z 150; lighthouse x 46 z 150 h 26 (r 2.4 → 1.7, bands at 25–38 % and
  60–73 %, gallery, lantern, dome); the keeper's cottage beside it. **Part 3:** on a phone it stands at f 0.8502 (z 150), in the
  slot between the two horizontal word towers (its gallery 2.3 wide fits between their faces; `lighthouseBoxes()` counts in the
  faces' cover, tested); a wide screen keeps x 46·k. Boats (Part 2: re-spaced so the harbor stays open around the pier; by screen fraction):
  Rosie 0.73 z 142 (24 long), the taxi 0.88 z 94, the tug at night / a sailboat by day 0.585 z 214, a second sailboat by day 0.92 z 205.
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
| `sky-high` | safe top + 4 .. the neon's top − 4, stopping 4 pt left of the corner buttons — the banner plane's strip | 0,66 · 330×100 |
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
- Tests (`tests/harbor.test.mjs`): `schedule(t)` and `schedule(t − SLOT_MS)` agree on every event spanning both; the stateful
  scheduler sampled every 30 s for 3000 slots of a contended case (5 sky events of 4 slots, 5 water events of 6, 3 heavy
  parade-length events of 8 in the promenade) never pops an event in or drops one, and matches a fresh replay; anchors a day
  apart agree; lanes, budget, heavy, rarity, `when()`, forced.

## Performance
- **Baseline: today's city** (`title-perf.mjs`, 390×844 at DPR 3 capped to the tier, Chrome, 4× CPU, Oct 20 2026), the scene's own
  draw cost per frame (mean / p50 / p95): **party peak** t2 8.9 / 8.8 / 10.7 ms · t1 10.3 / 10.2 / 12.7 · t0 6.4 / 6.2 / 8.0;
  night t2 6.6 · t1 6.0 · t0 5.4; day t2 4.4 · t1 5.7 · t0 5.4. Frames held 16.7 ms everywhere.
- **Budgets for City 2.0** (phone, 4× CPU): **tier 2 ≤ 8 ms** of scene work a frame on average, 60 fps; **tier 1 ≤ 6 ms** (DPR
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
| the sky's artwork (the moon's art: Part 2 only fits its path) | the arches | 6 |
| ~~the hero blocks' signs~~ — done in Part 3 | | ✅ 3 |
| ~~the neon's REFLECTIONS in the harbor~~ — done in Part 4 (the water mirrors the frame itself; `reflections()` stays for later parts) | | ✅ 4 |
| holiday schemes on the outlines + the sign dressings (`moment('scheme', id)`; `LOGO_ANCHORS`) | hooks + previews | 11a–c |
| party nights' neon (`moment('party', k)`, chasers, the beat via PT.breath) | hooks + `&force=neon-party` | 10 |
| a game's colours across the skyline at its start (`moment('flash', { game })`), the sign swap (`gameLogoSvg`) | hooks | Lobby 2.0 |
| a billboard's content, a skyline scheme (`billboard(id, show)`, `moment('scheme', …)`) | hooks | CITY CONTROL |
| ~~the water: a flat band~~ — done in Part 4 (the live mirror, the columns, the ripples, the paths) | | ✅ 4 |
| the hero pieces' reflections (`water.reflect(fn, axisY)`: Rosie, the boats, the train, the beam; the wheel + the lighthouse use it with their grey box) + wakes (`water.wake()`: stored, not drawn) | hooks | 5 |
| rain rings on the water, the fog over it (`water.set({ rain, fog })`: rain roughens the mirror now) | hooks | 9 |
| fireworks doubled in the harbor (low ones reflect already; high ones: `water.light()`), the ghost ship's glow (11a) | hooks | 10, 11a |
| the wheel, the lighthouse, the pier, the boats (the landmark towers: done in Part 2) | grey boxes, still (the pier: planks + railing) | 5 |
| the sky's artwork (planes, birds, the UFO — `fx.mid` is not called, so the cat / UFO / window glyphs don't show yet) | the district's art | 6 |
| the speakeasy (rooms, the door's craft, the knock's peephole: a warm flash only) | grey box | 7 |
| `street()` → the stage's layout (lamps, signals, door, knocks); people + traffic still | placeholders | 8 |
| seasons on the trees, snow on the city, puddles | autumn always | 9 |
| holidays (the sky fx's holiday pieces already run) | — | 10 |
| `partyLight()` → null, no party windows; party nights don't yet call the searchlights (the party's numbers + the finale's fireworks + `onParty` work) | rules only | 11 |
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
- **A plane's contrail grows the frame cost** (the district's `aircraft.js`, reused as is): its puffs accumulate across the sky
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
  gradients (cyan → violet → blue, 26 s a cycle) + a band of light climbing every 9 s + thin floor lines; party colours at a party.
- **POWER** (City 1.0's, `neon.powerTick`): the neon plan's per-item states (title.js#neonNow: `signCount()` = the items: the
  signs, the billboard, every outline) → each its sputter-on / stutter-off (`alpha`, City 1.0's segAlpha: tube by tube), the
  boot stagger 0.25 + i · min(0.6, 4.5 / n) s (≈ 4.5 s for the whole city), a rare flicker (25–70 s), a faint core flutter
  (tier ≥ 1). By day everything is unlit glass. A re-layout never blanks the neon: the new set builds behind the old one and
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
  edge) — their warm columns run down into the water.
- **Cost**: the work is split over frames — one frame BUILDS the mirror (the copy, the flip, the objects in the water, the
  columns), the next COMPOSES the water (the rows, the wavelets, the paths, the edge) into its canvas; every frame shows that canvas
  (tier 2: 30 water frames a second; tier 1: 20, wider rows, fewer copies, one wavelet texture). **Tier 0 and reduced motion**: a
  calm baked mirror — built + composed about once a second with the ripples still (the lights still follow the city).

### The water's API + HOOKS (`harbor().water`)
| hook | what | used by |
| --- | --- | --- |
| `reflect(fn, axisY)` | this frame, `fn(ctx)` draws an object (screen coordinates) flipped about its own waterline `axisY` (`axisAt(L, z)`) into the mirror | the wheel + the lighthouse now (`scene.js#waterMirrors`: their rects of the baked harbor layer); **Part 5**: Rosie + her bulbs, the taxi, the tug, the sailboats, the train, the beam |
| `light(x, y, col, a, w)` | this frame, a light NOT in the frame above the waterline as a column in the water | **Part 10**: fireworks high over the city (the finale's sparks), **11a**: the ghost ship's glow |
| `wake({ x, z, len, dir, k })` | a boat's wake (stored, max 16) | **Part 5** draws them |
| `set({ rain, fog })` | rain roughens the mirror now; the rings on the water + the fog over it | **Part 9** |
| `band()`, `debug()` | `{ y0, y1, strips, copies, lights, paths, rough, ms: { build, compose }, tier, mb }` | tests |
Fireworks low enough to be in the frame above the waterline, Part 5's lit wheel and the train on the far waterfront (when drawn
before the water) reflect without any call. `&force=no-water` turns the live water off (perf before / after).

### Performance + memory (Part 4, `title-perf.mjs --city 2`, 390×844, 4× CPU, mean ms of scene work t2 / t1 / t0)
np-night 6.4 / 6.8 / 3.6 · np-party 7.5 / 6.9 / 3.4 · the worst case (`neon`) 7.9 / 7.3 / 4.4 · np-windy 6.4 / 6.1 / 3.6 · np-golden
6.5 / 5.9 / 3.7 · np-day 4.4 / 4.2 / 3.1; frames 16.7 ms everywhere. The same bench without the live water (`nw-`: Part 3's cost
measured today — this machine runs ~15 % slower than on Part 3's day): night 5.0 / 4.7 / 3.7 · party 5.9 / 5.3 / 3.8 · neon 6.4 /
6.1 / 4.6. Chrome's own task time per frame (party, t2): +0.8 ms with the water. (Tier 1 was measured before its 3-frame cycle:
expect ~0.4 ms less. All of these come from one quiet hour; at the end of the session the machine ran ~3× slower for everything —
the previous commit measured 18.9 ms at the party peak then, vs 5.9 when Part 3 shipped — so the final E2E's perf + 20-cycle memory
checks failed on it (the slow frames step the tier down, which changes the memory); re-measure at cleanup pass 1.) Tier 2 is within 8 everywhere; tier 1 is ~0.5–1.3
over its 6 and tier 0's worst case at the 4 line (both were at their lines before the water — Known issues). Memory: the water's
canvases ~2.4 MB at 390×844 tier 2 (in `harbor().mem`, a layer of its own) — 25.4 MB of 64 in all.

### Known issues (Part 4)
- **Re-measure perf on a quiet machine at cleanup pass 1** (see above): the E2E's PERF and 20-cycle MEMORY checks failed only in the
  session's slow last hour; the E2E's TAGLINE check compares the city to 0.01 pt and fails when the title's first real text rects
  land after its first snapshot (a sub-pt re-layout; seen on the slow machine). Its real bug was fixed here: a re-layout forgot
  the faded tagline (`cam.tagGone`), so sky-low lost the freed band.
- **The copy forces a raster flush mid-frame**: reading the scene's own canvas makes the browser rasterise what is drawn so far
  inside the water's build (in headless Chrome ~1 ms at 4× — mostly work that used to happen after the scene's timer). Measured as
  real main-thread time: +0.8 ms a frame. If a phone shows otherwise, the fallback is to compose the copy from the baked layers +
  the neon instead (the beacons and beams would need their own draw).
- **Tier 1 runs 0.5–1.3 ms over its 6 ms** on party / neon nights (and tier 0's worst case sits on 4) — over or at the line before
  the water too (`nw-` numbers). Cleanup pass 1: thin tier 1 (the LED facades, the neon flutter, the rays) — not the water.
- The far half of a light column is a stretched copy, not a true glitter column (a light high on a tower reflects compressed toward
  the quay); it reads right at phone size.
- The wheel's + the lighthouse's reflections come from the baked harbor layer's grey-box art (Part 5 replaces both through
  `reflect()`); the pier is not reflected (its deck spans many depths) — Part 5.
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
