# CITY 2.0 — THE HARBOR (the bible)

The title's new city, replacing today's district (`js/screens/district/`). A once-only, never-redo build with an uncompromising
quality bar, in 12 parts. **Every later part follows this file.** Until Part 12 switches it over, the Harbor lives behind
`?city=2` only; a normal visit gets today's city, exactly as before. Rollback point: the git tag **`city-1.0`** (pushed Oct 20 2026).

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
| 2 | skyline | the far bands, the mid band, the facades (glitter windows, real brick/stone/glass by day), the haze, the floodlit crowns, the golden-hour rays through the sun gaps |
| 3 | neon + signs + billboards | the tube signs (each game's own), the hotel's blade, the roof tubes (JAZZ, PULSE, NEON PAR…), billboards; unlit by day |
| 4 | water | reflections in perspective, ripples, the lights' smears, the quay lamps in the water, wakes |
| 5 | harbor hero pieces | the Ferris wheel (turning, bulbs), the lighthouse (the beam), the pier, the landmark towers, the boats (Rosie and her bulbs, the taxi, the tug, the sailboats) |
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
  the service worker caches files by URL and never a default path (`sw.js` is network-first, no precache list — nothing to change).
- Every title flag works with it: `&when &tz &at &wx &rained &wind &speed &force` (core/sky.js#skyClock), `&intro &idle` (under `?emu`).
- Harbor-only flags: **`&grid=1`** (the dev overlay: the safe areas, the sign + tagline, the skyline limit + the squeeze, the
  sun's arch band + the roofline + the sun now, the sun gaps, the lanes, the speakeasy's windows + rooftop, the door's tap target,
  size boxes: a 20 pt person at z 47 and a 110 pt bus at z 60), **`&debug=1`** (logs the camera, the layout and every bake with the
  memory per layer), **`&force=demo`** (the demo event, end to end).
- Previews: `tests/integration/title-preview.html?city=2&…` (no Firebase); shots: `node shots.mjs "<browser>" --preview --city 2
  --safe --sizes harbor --scenes day,golden,night,party,rain,snow` (`--crop stage`); perf: `node title-perf.mjs "<browser>" --city 2`.

## The architecture (Part 1)
```
js/core/harbor-layout.js   PURE  the projector, the camera per screen, the SIZE table, the squeeze, the sun gaps, the whole layout, screen boxes
js/core/harbor-events.js   PURE  lanes + events, the deterministic scheduler (budgets, rarity, heavy events), the built-in events
js/screens/harbor/scene.js        createHarbor(): the district's API; the frame; the sky modules wired in; rainbows + party rules; the dock's rects
js/screens/harbor/bake.js         the baker: two sets of canvases, chunked steps, the crossfade, the memory budget
js/screens/harbor/tones.js        Part 1's day / sunset / night tints (from the real sky's weights) + the haze by depth
js/screens/harbor/shapes.js       world-space drawing: boxes (the faces the camera sees), crowns, people, vehicles
js/screens/harbor/blocks.js       a skyline building (grey box + glitter windows), a band in chunks, a haze veil
js/screens/harbor/sky.js          the sky's gradient + horizon glow (the real sky on it = the district's sky modules)
js/screens/harbor/far.js mid.js landmarks.js quay.js water.js pier.js lighthouse.js boats.js road.js speakeasy.js stage.js foreground.js   the layers, far → near
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
  fireworks) → **far** (haze band, far band, mid band) → the sun's halo + rays, swifts, fog → **near** (landmarks, near band, hero
  blocks, the quay + its lamps) → **water** → **harbor** (pier, wheel, breakwater, lighthouse, cottage) → boats → **road** → traffic →
  **stage** (promenade, stop lights, speakeasy, lamps, trees, bench, planters, cart) → people → lights (lamps, stop lights, the
  knock) → rain drops, snow, the flash, frost, the eclipse → the vignette → &grid. **Bold** = baked.
- **Baking:** each baked layer is a full-width band of the screen (only its rows), drawn per LOOK KEY (Part 1: the tone weights in
  sixths + the camera) in small steps — `TIERS[tier].bakeMs` (2 / 3 / 4 ms) a frame, never a blocked frame — into the second set,
  then crossfaded in over 1.2 s and swapped. Progressive start: the sky draws from the first frame; the city fades in (0.7 s)
  when its first bake is done (≈ 6–10 frames). A moved rect (the title reports the sign's and the dock's real rects a frame after
  mount and every 500 ms), a resize or a tier change re-lays the city.
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
| 390×844 | 582 | 509 | 0.55 | 19.2 pt | 107 pt |
| 402×874 | 600 | 532 | 0.52 | 19.8 pt | 110 pt |
| 412×915 | 615 | 568 | 0.76 | 20.3 pt | 113 pt |
| 430×932 | 642 | 575 | 0.66 | 21.1 pt | 118 pt |
| 874×402 (sideways) | 270 | 262 | 0.28 | 8.9 pt | 50 pt |
| 1440×900 | 604 | 566 | 0.52 | 19.9 pt | 111 pt |

- **Wide (desktop, sideways):** room = dock top − 4 − tagline bottom − 10; F = max(600 · room / 411, people ≥ 9 pt), CAMH =
  min(13.5, 0.55 (0.4 when the room is short) · room · 36.5 / F). A panorama: the harbor pieces spread (× up to 2.2), the skyline
  bands are generated across the whole width, more landmarks further out, the promenade repeats to the right edge, and a FRONT ROW
  (z 28–33: lamp + tree pairs, benches, people) lives either side of the dock (never under it).
- **The squeeze** (`squeeze(cam, yMax)`): above a knee (55 % of the way from the limit down to the horizon; lower for a short
  strip of sky) the height above the knee is scaled by s with a soft start, so the highest top (crown included) lands on the limit.
  Monotonic (taller stays taller), low roofs untouched.
- **Depths:** haze band z 620–820; far band 380–560; mid band 300–360; landmarks 255–290 (+14 deep, tiers step in 26 % and back
  1.3); near band 232–250; hero blocks + the far quay 230 (top 0.4, foot −1.2; lamps every 11); water 64–230; railing z 64 (y 1.1);
  road z 54–64 (lane at 59); promenade z 30–54; the speakeasy z 44–60, 10.5 tall, 11.2 wide, its x0 28 pt past the left edge.
- **Landmarks** (x, w, z, h + crown): sunburst 30/13/255/112+13 · needle 56/11/280/100+18 (spire) · pyramid 4/10/290/86+10 ·
  dome −26/11/280/78+6 (2 tiers) · mast −64/11/270/92+14. **Hero blocks:** hotel 12..26 z230 h36 (blade sign) · PULSE −14..2
  z233 h28 · NEON PAR 38..56 z234 h32 · JAZZ −50..−38 z230 h30 (roof tubes).
- **Harbor:** pier x −34..−20 (× spread) z 140–230, deck y 2.4, pilings every 6, lamps every 9; Ferris wheel (−24, 23, z 165) r 17,
  18 spokes, 18 gondolas; breakwater around the lighthouse z 150; lighthouse x 46 z 150 h 26 (r 2.4 → 1.7, bands at 25–38 % and
  60–73 %, gallery, lantern, dome); the keeper's cottage beside it. Boats: Rosie x 4 z 128 (26 long, decks, the stack), taxi
  (32, z 100), the tug at night / a sailboat by day (−60, z 190), a second sailboat by day (70, z 200).
- **Stage** (positions relative to the speakeasy's right face, −5.6 on the phone): stop lights at +2.6 (dir 1) and +18.1 (dir −1),
  z 54.6; the bus +13.6 z 60; cars +20.1 z 57.5, −2.4 z 57, −9.4 z 61; lamps +2 / +11 / +18.2 z 47 and +14.2 z 37; trees +4.4 / +15.4
  z 47.3, the front corners at z 37.4 (right: 84 % of the half-width; left: −6); bench +12.8 z 47.8; planters +0.2 / +6 z 43; the
  cart +9.2 z 37.6; people: at the cart, the doorman by the door, a couple, a dog walker, the cab hail, a stroller, a walker.
- **The SIZE table** (`SIZE`, pt at the reference phone at the thing's usual depth → `units(name)` world units): person 20 @ z 47
  (1.57 u), car 55 @ 58, bus 110 @ 60 (11 u), lamp 50 @ 47, canopy 40 @ 47, stop light 55 @ 54.6.
- **The sun gaps** (`SUN_GAPS`, screen fraction / width pt): 0.06/7, 0.13/9, 0.31/6, 0.70/6, 0.79/9, 0.90/8, 0.97/6 — no skyline
  band block covers one (tested); the landmarks and hero blocks stand clear of them.
- **The door:** the front face's u 9.05–10.55, 2.6 tall; the tap target ≥ 44 × 44 pt around it (on screen, clear of the dock and
  the corner buttons — tested at every size).

## Lanes + events (`js/core/harbor-events.js`)
- **Lanes:** `sky, skyline, water, road, promenade, windows, rooftop`.
- **An event:** `{ id, lanes, when(ctx), rarity: common | weekly | rare | legendary, duration (≤ 8 slots), cost (ms/frame), heavy?, seed }`
  — `defineEvent()` checks it. ctx is whatever the scene knows (date, local time, weather, season, holiday, party phase, force).
- **The scheduler** (`schedule(events, ms, ctxAt, { seed, forced })`): time is cut into 90 s slots; each slot rolls its own dice
  from the slot number + the seed, so the same moment gives the same city on every phone and a refresh never reshuffles. An
  eligible event starts in a slot with chance `slot / period` (common: every ~4 slots; weekly: once a week; rare: once a month;
  legendary: once a year). Rarer first; never two events in one lane at once; one of each at a time; the frame budget `BUDGET`
  (2.5 ms in all, 1.5 per lane) holds; a HEAVY event quiets every other lane (`quiet`: the scene thins out what runs there);
  only one heavy event at a time. Forced ids (previews) start in every slot, first.
- **Part 1's only event:** `demo` (sky lane, debug-only, `&force=demo`) — a labelled lantern crossing the sky lane, proving the
  pipeline end to end (scene → scheduler every 500 ms → `harbor().events` → drawn in its lane).

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
| `signCount()` → 0, `debug().signs` [], `hit` never returns `sign` | the neon ramp plans the logo only | 3 |
| the hero blocks' signs (a frame where each goes) | outline | 3 |
| the water: a flat band | no reflections | 4 |
| the wheel, the lighthouse, the pier, the boats, the landmarks | grey boxes, still | 5 |
| the sky's artwork (planes, birds, the UFO — `fx.mid` is not called, so the cat / UFO / window glyphs don't show yet) | the district's art | 6 |
| the speakeasy (rooms, the door's craft, the knock's peephole: a warm flash only) | grey box | 7 |
| `street()` → the stage's layout (lamps, signals, door, knocks); people + traffic still | placeholders | 8 |
| seasons on the trees, snow on the city, puddles | autumn always | 9 |
| holidays (the sky fx's holiday pieces already run) | — | 10 |
| `partyLight()` → null, no party searchlights / windows (the party's numbers + the finale's fireworks + `onParty` work) | rules only | 11 |
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
- Next: **Part 2 — the skyline.** Start from `far.js / mid.js / blocks.js / landmarks.js / quay.js` and the `SUN_GAPS`; keep the
  squeeze and the camera; measure with `title-perf.mjs --city 2` before and after.
