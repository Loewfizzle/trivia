# PART 9b — WINTER: THE CLIMATE FALLBACK, THE SNOWPACK, THE WINTER WORK + PLAY, SNOW ON THE NEON, THE JANUARY SNOWMAN (Oct 27 2026; plan.md "OWNER'S NOTES — OCT 27 (after SP6)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 9b — WINTER: THE CLIMATE FALLBACK, THE SNOWPACK, THE WINTER WORK + PLAY, SNOW ON THE NEON, THE JANUARY SNOWMAN (Oct 27 2026; plan.md "OWNER'S NOTES — OCT 27 (after SP6)"; behind `?city=2`)

Judged unzoomed at phone size (CLAUDE.md's standing rule, added this pass): big areas of white, clear silhouettes, light — no crust textures.

### 0. The quick ones
- **CREDITS didn't open on the owner's iPhone** (`title.js#goIdle`, `onWake`): the title went to REST 10 s after the ☰ menu opened (an open
  menu didn't count as busy) and the next tap — CREDITS — was swallowed as the wake tap. Now the open menu keeps the screen awake and a tap
  inside the menu / a sheet is never swallowed. E2E: `e2e-title.mjs` `dock` group (a phone page with the rest timer ON: the sheet opens on a
  tap, CLOSE closes it, the screen never rests under the open menu, CREDITS still opens on the first tap after the menu sat open). The
  in-game ☰ has no rest timer (the same openMenu, unaffected).
- CLAUDE.md's ground rules: **phone first, unzoomed** (the owner's standing rule).

### 1. THE CLIMATE-AWARE FALLBACK (`core/climate.js`, PURE — `tests/climate.test.mjs`)
When the live ask has SETTLED with no usable answer (down, a 5xx, a 204 with no location, a stale answer) the city is the climate's best
guess, never random: the PLACE = the last answer this device kept (its rounded area, any age — `live-weather.js#lastPlace`), else `&at=`,
else the time zone's city (`core/sky.js#placeOf`); the nearest of **48 reference cities** (`STATIONS`: a January high + low, a July high +
low, cloud in each, the share of wet days in each, the fog's peak month + its odds, the usual wind; every day of the year eased between
by a cosine from Jan 20). THE DAYS (`climateDay`): the normal + a persistent anomaly (a weighted sum of five days' draws: spells last days),
wet days by the month's odds (likelier after a wet day), a seeded wet WINDOW of a few hours, summer afternoon thunderstorms, foggy mornings
in the fog season; SNOW only on a cold day (high ≤ 2.5 °C; it falls only when the hour is ≤ 1 °C). THE HOUR (`climateWeather`): the
temperature on a day curve (low ~6 am, high ~3 pm), the cloud drifting in 3-hour steps, the WMO code it amounts to — so
`harbor-weather.js#cityWeather` reads it like a live answer. Seeded by the station + the date: everyone at a place agrees. While the first
ask is still out nothing changes (the load gate's timing is SP3's). The readout: `weather: climate fallback — live failed: <why>` + the
normals' line; the load log: `wx climate …`. **`&force=climate`** (+ the panel's CLIMATE FALLBACK in WEATHER FX): the fallback on demand.
Checked: a November in Grand Rapids is cool + grey (cloud 0.77, ~4 °C, rarely clear), Phoenix ~85 % clear year round, Miami never snows
(three winters), a January in Minneapolis has snow on the ground ≥ 85 % of days, no snow anywhere in July.
City 1.0 keeps its dry seeded sky (the snow depends on City 2.0's fallback only — a decision).

### 2. THE SNOWPACK (`core/harbor-snow.js`, PURE — `tests/harbor-snow.test.mjs`; drawn by `snow.js` + `snowfx.js`)
- **THE DATA**: `/api/sky` now asks Open-Meteo for `snow_depth,snowfall` (current) + `daily=temperature_2m_max,temperature_2m_min,snowfall_sum,
  rain_sum&past_days=30&forecast_days=1&timezone=auto` → `normalize` adds `snowDepth` (cm), `snowfall`, `days` (compact rows).
- **THE MODEL** (`packStep`, one step a day): fresh snow sticks only on a cold day (fully ≤ 2.5 °C, none ≥ 4.5), settles (fresh 7 %/day, old
  1.5 %), melts only above freezing (degree-days: 0.3 × high + 0.25 × mean, + rain on snow), the PLOWED BANKS grow with every ≥ 2 cm snowfall
  (×1.2) and melt at 0.42 of the rate, the snow dirties each day without a new coat. Calibrated against a REAL Grand Rapids winter (2022–23,
  ERA5 via Open-Meteo's archive: `tests/fixtures/gr-winter.mjs` — the model's depth within reason of the reanalysis on 60 %+ of the snowy days;
  the stages in a sensible order: early Nov none → the mid-Nov storm FRESH → Christmas's blizzard → the thaw after it → gone by mid-April).
- **THE STAGES** (`snowState`): FRESH (age ≤ 1 day: white everywhere, the branches loaded) · OLDER (≤ 4 days: duller, off the branches, the
  FOOTPATHS worn) · BANKS (an old pack: grey, the plowed mounds dominate) · THAW (melting: slush, patchy, the street WET — 9a's puddles + the
  lights' reflections) · SPRING (patches in the shade + the last dirty piles) · none. The real depth wins when the answer has it; snow
  FALLING on a freezing night whitens bare ground at once.
- **THE SOURCE** (`scene.js#snowPackNow`): `&snow=` (the panel's SNOW ON THE GROUND) → the climate fallback's pack → the live depth + its 30
  days → a PREVIEW clock: the climate's ground for that date + place (so `&when=2027-01-15` shows a Michigan January; `&snow=none` turns it off).
- **WHERE IT LIES** (judged at phone size):
  - **ON EVERY TOP — `snow.js#capStep`**: each baked layer (far, near, harbor, road, bill, stage, front) gets the top band of its own
    silhouette — the layer drawn into a scratch canvas, the same layer shifted down cut out of it, the rest filled with the snow's tone
    (four GPU draws, never a pixel read back) — so every roof, setback, ledge, railing, lamp head, signal, branch + sign cabinet carries
    snow; the far skyline a thin hazy band. Thickness by the layer's depth × the stage.
  - **THE PLAZA — `groundSteps`**: after the paving (the day's shadows drawn again over it, paler), cell by cell over the setts' grid: the
    whole plaza + the inlay + the walks white, lit by the same lamp-pool field as the stones (warm pools glow on the snow), the barbershop's
    lit window warming the snow before it at night; FOOTPATHS worn along the walkers' routes (`pathsOf`: the front walk, the back walk, the
    door → the walk, the crosswalk → the kerb); coverage by smooth seeded noise (thaw + spring: patches, the last ones in the SHADE by the
    speakeasy + round the trees' feet); the doorman's SHOVELLED path from the steps once he's been out (`door`).
  - **THE BANKS**: lumpy grey-brown mounds along the back kerb (cut open at the crossing) + along the front curb.
  - **THE WATERSIDE ROAD — `roadStep`**: WHITE with tyre tracks while snow falls + the plow hasn't been by, else a clear dark wet lane
    with white kerb strips; slushy in a thaw.
  - **THE SPEAKEASY — `speakStep`**: pillows on every sill (warm under the lit rooms at night), the belt course + the cornice, the AWNING
    heaped + sagging with its lip curling over the front edge; now + then a SLAB slides off the awning (`snowfx.js#slab`, `&force=awning-slab`).
  - **THE TREES, THE BENCH, THE PLANTERS, THE URN**: 8a's hooks (`pieceCtx`: `snow` = the tops, `snowBranch` = FRESH only, `snowCol` = the
    snow's tone in this light — the branches used to be white at night).
  - The water stays open (no ice this pass).
- **FALLING SNOW** (`snowfx.js` — City 1.0's flakes are off in the Harbor): three depths, slow (far 14 → near 40 pt/s), drifting with the
  real wind + a lazy sway, LIT through the rain's light grid (pink by the NEON letters, amber by the lamps), 90 / 180 / 300 by tier; a SNOW
  state in `cityWeather` (snow codes 71–77, 85, 86; eases in over ~2 min live, 8 s on a preview); `&force=snowfall`.
- **THE PEOPLE**: in the real cold (≤ 4 °C) coats + scarves (kids get a coat + cap); snow on the hats + the shoulders while it falls (never
  under an umbrella).

### 3. THE WINTER WORK + PLAY
- **THE PLOW + THE SALT TRUCK** (`core/harbor-snowwork.js`, PURE — `tests/harbor-snowwork.test.mjs`; two new MODELS in `vehicles.js`: `plow`
  — the dump's lines in the street department's green, CITY on its box, a big ORANGE angled blade on a push frame; `salter` — grey, SALT
  on it): they run THROUGH THE BACK ROAD'S OWN SIMULATION (`harbor-traffic.js#simulateLane`'s new `extra` spawns: the light, the queues —
  cars wait behind the slow plow), so every phone sees the same. WHEN: while snow falls, a pass each lane every 40 min (seeded), the salt
  truck 10 min after each near-lane pass; the morning after a snowfall, the clean-up round 6:40 → 7:30; never inside a hold (the parade, a
  legendary). LIVE (`snowfx.js#workFx`): the plow's SPRAY — a bold white plume thrown off the blade; the salt truck's FAN of grains + the
  darker wet lane behind it; the road's PLOWED LANE appears behind the plow (`scene.js` draws `plowedStrip` to its tail until the bake's own
  plowed lane lands). `&force=plow` (the road white ahead of it) / `&force=salt`. The street under the dock is shown plowed (no plow there —
  a decision: it hides under the dock most of the time).
- **THE PEOPLE** (`winterfolk.js`, its schedule `winterActs` PURE): THE DOORMAN shovels his steps the morning after snow (7:20–8:20 — big
  strokes, a clump thrown aside each one, then a fan of salt) and the path stays clear (baked); A SHOVELLER works along the front walk the
  day it snowed (9–11 am); THE SNOWBALL FIGHT: four kids nearer the camera than the inlay on snowy WEEKEND afternoons (two seeded ~12-min
  sessions, 1–4:30 pm) — scoop, wind up, THROW (a new `throw` pose), the ball's high arc with a shaded edge (a white ball reads against white
  snow) + a burst where it lands; A SLIP on thaw nights (6–11 pm: arms flung out — a new `slip` pose — caught, on again). New gear: the
  SNOW SHOVEL (a wide steel blade carrying a heap). `&force=shovel|snowball|slip`.
- **THE SOUNDS**: `snow-hush` (Mixkit's cold interior wind, already in the folder) under the night while snow lies; `snow-shovel` (Tompalompa,
  CC0 — Pixabay's copy) while someone shovels, panned to them; slots READY + silent: `plow-scrape`, `salt-spread`, `snow-steps`. audio/city
  14.24 MB (the budget 14.5).

### 4. SNOW ON THE NEON (`glasswx.js` — the sign's overlay; the owner, mid-pass: "realistic and fluffy, super realistic … melt very
realistically too" + "it piles up on the sign when it's off … new snow falling on the lit sign just melts and doesn't pile up")
- **WHEN**: snow PILES UP only while the sign is OFF and snow is falling on it; flakes landing on a LIT sign melt on the warm tubes and
  turn to WATER (beads gathering on the tubes + running off — 9a's bead + drip system), never a pile. When the sign LIGHTS, what lies on it
  MELTS SLOWLY (~10 min to most of it, never a pop): a load at night finds a lit sign's snow mostly gone (joined from the clock's neon level).
- **THE SHAPE**: only where a tube runs level enough to hold it — a lumpy, PILLOWY mound of overlapping puffs (big slow lumps + small bumps,
  seeded per tube) overhanging the tube's sides; a rounded cap on a tube's upper end, a little on each mounting clip. The word always reads.
- **THE LIGHT**: volumetric — a cool blue-grey body, white tops toward the light, a soft scattering rim; at night the lit tube glows inside
  the snow's FOOT (its colour scattered up through it), the crests stay white; fresh dry snow GLITTERS (twinkling points).
- **THE MELT**: from the warm tube up — the mound sinks + settles, goes grey + translucent where wet (a slushy sheen), BREAKS INTO CLUMPS
  (each stretch its own melt order: the thin spots go first), the bare tube between glistening wet, beads gathering at the clumps' edges +
  dripping off; on a freezing night the melt refreezes into small ICICLES under the letters + the clips.
- Rendered into its own canvas only when it changes (a 1/60 step of depth, the light, the wetness); the glitter + the wet glisten live.
  `&force=sign-melt`: the whole melt ×20 (~30 s) for a review. The roof signs + billboards: snow on their cabinets' tops via the layer caps.
- **THE GLASS UI's frost** (the dock, ☰, ♪) is 9a's (cold ≤ 1 °C, full by −6) — unchanged; no icicles on the buttons.

### 5. THE JANUARY SNOWMAN (`core/harbor-snowman.js`, PURE — `tests/harbor-snowman.test.mjs`; `snowman.js` on THE CENTREPIECE RIG)
Built over JANUARY on SNOW DAYS ONLY (snow on the ground ≥ 3 cm + a high ≤ 3 °C), ~1/22 of him a day (the last week's finishing touches
quicker): the base (rolled from Jan 2) → the middle → the head → coal eyes + buttons → the carrot → the scarf → the hat → the stick arms →
the pebble smile; done by ~Jan 31 in a snowy January, then standing. A brief thaw SLUMPS him (squashed, leaning, the head tipped, the arms
drooping, the hat askew) and the next snow day the builders PATCH him up; a SUSTAINED thaw (three days > 4 °C, or the snow gone) melts him
in stages, then he's gone. No snow → no snowman. From the same days as the snowpack (live / the climate's). BIG (≈ 1.8 × a person): three
shaded balls, the ORANGE carrot, a RED scarf with its tail, the black top hat — the rig's floor spots light him at night. LATCHED: decided at
the load + on every return (the big pieces' rule) — never a change on camera. His people (`winterfolk.js`): the BUILDERS on a January
snow day (10–3: two kids rolling + packing, a grown-up at the top) and, once he's done, VISITS (a kid at his face, someone holding a camera
up to him). Previews: `&snowman=base|middle|head|face|carrot|scarf|hat|done|slump|melt` (+ the panel's THE SNOWMAN row), `&force=snowman-build`.

### Previews (`https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&…`)
`&snow=fresh|older|banks|thaw|spring|none` (+ `&snowdepth=<cm>`) · `&force=snowfall` · `&force=plow` · `&force=salt` · `&force=shovel` ·
`&force=snowball` · `&force=slip` · `&force=awning-slab` · `&force=sign-melt` · `&snowman=…` · `&force=snowman-build` · `&force=climate` ·
the panel: THE WEATHER → SNOW ON THE GROUND, THE SNOWMAN; WEATHER FX → CLIMATE FALLBACK + WINTER.

### Tests
Unit: `climate` (6), `harbor-snow` (5 — the real winter), `harbor-snowwork` (4), `harbor-snowman` (3), `harbor-weather` (the snowfall
preview), `city-sounds` (the two new recordings). E2E: the new `snow` group (the `windows` cloud job — the lightest): the climate
fallback + its readout line, no snow in early November, each stage + its bake key, FRESH whitens the plaza, SPRING stays mostly dark, THE
THAW wets the street, the snowfall's flakes, the plow on the near lane, the sign's snow by day vs lit at night + its icicles, the snowman on
Jan 31 + a forced stage. `e2e-title.mjs` `dock`: the CREDITS tap.

### Measured — the speed round (`title-perf.mjs --ab` against 8bf0c29, the commit before the pass — it draws NO snow, so B's extra is the
snow's whole cost; 402×874, 2 + 2 windows of 5 s; scenes `s9-*` added)
| scene | tier 0 (4× CPU) work A → B | tier 2 (2× CPU + GPU) work A → B | verdict |
| --- | --- | --- | --- |
| s9-party (a party night with FRESH snow) | 17.5 → 17.3 ms | 39.7 → 39.2 (at 4× CPU) | **same** — the snow costs the party nights nothing |
| s9-fresh (a clear night, fresh snow) | same (−0.17 ms) | — | **same** (the caps + the ground are baked) |
| s9-thaw (the wet street) | 20.9 → 19.0 | 50.6 → 39.4 (4× CPU) | same / faster (noise) |
| s9-fall (snow falling at night) | 16.1 → 17.9 (after the trim; first run +3.4) | 11.4 → 12.6, 60 fps (p95 16.9 ms) | tier 0 **same** after THE TRIM; tier 2 +1.25 ms |
| s9-plow (the plow by day, fresh snow) | 9.7 → 11.3 | 7.0 → 8.0, 60 fps | +1–1.6 ms (the trucks + their spray, the people's snow) |
THE TRIM (the first run's falling snow was +3.4 ms at tier 0): the flakes 90/180/300 → 60/130/220 by tier, a NUMBER (never a string) as
each flake's batch key, the far flakes as tiny squares (no arcs). The sign's fluffy snow renders once + re-renders only on a 1/60 depth step
(probed: one render in 5 s of snowfall at night). Absolute numbers are this laptop's (warnings only; the owner's iPhone readout decides).

### Decisions made (each the most reasonable reading; easy to reverse)
- The climate fallback is City 2.0's only (City 1.0 keeps its dry seeded sky); it starts once the live ask has SETTLED with no answer (a
  204 counts: no location is no weather) — while the first ask is out nothing changes, so the load gate is SP3's.
- A PREVIEW clock (`&when=`) without `&snow=` shows the CLIMATE's ground for that date + place (a January link shows a Michigan January);
  `&snow=none` turns it off. The previews' falling weather stays the link's own (dry unless forced).
- The banks live on the plaza's back kerb + the front curb (drawn in the stage, so they read over the road's edge); the street under the
  dock is shown plowed (no plow drives there).
- The plow + the salt truck are cars of the back road's own simulation (they stop at the light; traffic queues behind the slow plow).
- The fresh snow's road stays WHITE only while snow falls and the plow hasn't passed for 25 min.
- The snowman's pace: ~1/22 a snow day (the last week ×2.2) so he's finished in the month's last week, not by mid-January; a partial
  January may leave him unfinished (true to "built on snow days only").
- The sign's snow (the owner, mid-pass): piles ONLY from snow falling on a dark sign; no slow drift back while it's off; on a lit sign the
  flakes become water (beads). A load at night joins a lit sign's snow as mostly melted + wet.
- SNOW_STAGES' whiteness: FRESH 1 · OLDER 0.7 · BANKS 0.5 · THAW 0.42 · SPRING 0.5 — tuned at 402 until each reads apart by day.
- The glass UI's frost is 9a's (no change); "no icicles on the buttons" kept.
- Sound: `snow-hush` uses the folder's Mixkit "Wind cold interior" (named snow-hush by the owner); `snow-shovel` the Pixabay copy of the CC0 original.

### Known issues
- **The sign's snow on a real iPhone**: proven on Chrome only (WebKit can't run here) — the owner's phone decides; the fluffy render is
  cached (a re-render on each 1/60 depth step while it melts: ~every 10 s live).
- **`load`'s "a stored JUST ME jump into a holiday night"**: a party night's lit swap sometimes lands just after the reveal (a race — passed on
  the next run with the same code; its sibling timing check fails on the baseline too).
- **THE FINAL CLOUD RUN (40538288471)**: `windows` (with the new `snow` group), `audio`, `show`, `street`, `wild` GREEN; `tests` (40538288379)
  green; `holiday` 63/64 — the SPIDER'S TAP (SP6's known race); `city` 92/93 — the panel's "the word gone" timeout (fails on the baseline
  too) + LOAD WEATHER "answered after 6 s" (a `lit crossfade · share` — the windows' hourly share stepping on the real clock: SP3's
  clock-dependent flake). All three in code this pass didn't touch; not re-run (the two-run rule).
- The snowball kids + the snowman's builders are drawn by `winterfolk.js`, not the people planner: they don't route round other walkers
  (a passer-by can cross them).
- No plow on the street under the dock; no ice on the water; no snow on the moving boats.
- The sounds still missing (slots ready, silent): `plow-scrape` (a plow blade scraping a road + an old truck), `salt-spread` (salt hissing off
  a spinner), `snow-steps` (footsteps crunching in fresh snow) — drop them in ~/Downloads/city-sfx/ as `<slot>.wav` + run the importer.

### Handoff → 9c (THE CONSTRUCTION TOWER + THE CITY LIFE + THE SAX REWORK)
- The tower's cycle can read the snowpack (`SN.stage`) for its winter shutdown; the city life's quiet hours can use `winterActs`' pattern.
- The snow on the tower's frame comes free with the layer caps (`snow.js#capFor`) once it's baked into a group.
