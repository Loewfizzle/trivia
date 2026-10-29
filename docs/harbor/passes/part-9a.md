# PART 9a — THE WEATHER + THE POLISH 5 REVIEW FIXES (Oct 25 2026; plan.md "OWNER'S NOTES — OCT 25 (after POLISH 5)"; behind `?city=2`)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## PART 9a — THE WEATHER + THE POLISH 5 REVIEW FIXES (Oct 25 2026; plan.md "OWNER'S NOTES — OCT 25 (after POLISH 5)"; behind `?city=2`)

Weather shows ONLY when it's real (the live weather at the player's place) or forced (`&force=<state>`, `&wx=`, the panel's WEATHER).

### 0. The POLISH 5 review fixes
- **THE WHEEL IN THE TR-3B BLACKOUT** (`wheel.js`): POLISH 5's recolour gave the DARK cabin sprites (4 + 5 — the two unlit of every night
  AND every cabin under the blackout) the warm window glow, so the wheel kept 16 lights. Fixed; and **THE LIGHT AUDIT**
  (`harbor().lightAudit()` — every light source's level as the frame drew it: the wheel's bulbs + lit cabins, the pier, the quay, the
  beam, the boats, the windows, the neon, the beacons, the promenade's lamps, the signals, the strings, the speakeasy, the sky beams, the
  searchlights) — the `legends` group checks EVERY one is dark under the blackout, with a normal-night control so it can't pass on zeros.
- **FOUND WITH IT: THE PROMENADE'S LAMPS NEVER LIT SINCE POLISH 5** — its `LL → LOADLOG` rename caught `drawLampLight`'s inputs
  (`LOADLOG.ramp` / `.levels`, undefined): the globes' live light + glow never drew. Restored (`LLF`).
- **ROSIE's STRIPE** (`boat-models.js`, `boats.js`): a broad DEEP NAVY boot-top from the waterline (0.1 → 0.8 of the hull), a thin GOLD
  pinstripe under the main deck's rail, the paddle box navy with a bolder gold edge; the navy + the gold keep their colour at night
  (lamp-lit). No red.
- **THE BALLOONS STAY UP** (`balloons.js`, `core/harbor-events.js#recent`): a single flight 45–60 min, the festival 60–90 (seeded:
  `flightLen`); the crossing spread over the WHOLE flight (a single balloon drifts in from the upwind edge and out the other side; the
  festival's from their launch spots, eased from rest); kept to the OPEN SKY UNDER THE TAGLINE (never parked behind the NEON sign or the
  dock) with each balloon's floor the skyline under it (it rises gently over a tall tower as it drifts toward it); a slow rise + fall
  (7–12 min); THE BURNER RARE + irregular (`burnSchedule`: one short burn every 45–120 s, every 3–7 s while climbing at a launch; the sound
  follows the burns you see). JOINED MID-WAY: the scheduler keeps the long flights it started (`at(ms).recent`, 3 h) — a load 30 min in
  finds the balloon mid-sky. Previews: BALLOONS / FESTIVAL (a single one joins 30 % in) + **BALLOONS · FAST / FESTIVAL · FAST** (×12: a
  45-min crossing in ~4 min).
- **THE FESTIVAL's LINE-UP** in the owner's order: ORANGE ₿ (a white ₿ on a dark keyline), the ALIEN, the BLACK ₿, a BULLSEYE (violet +
  teal rings on cream — the owner's add-on), a YELLOW SMILEY, the AMERICAN FLAG (Old Glory #B22234 / #3C3B6E / white: the stripes down the
  gores to the mouth, the navy canton over the crown, its stars crisp white points on the sphere — the owner's add-on, replacing the
  stripes, which stay an everyday style). Every design painted ON the sphere (rings of equal angle crowd toward the limb, the face + the
  stars foreshortened, every gore follows its MERIDIAN down the taper to the mouth) with the puffed gores laid over (seams = shading).
  Everyday singles: vertical stripes / pinstripes (POLISH 5's two schemes) / bullseye / smiley; the ₿s + the alien keep their rare odds.
- **THE DANCERS' ARMS** (POLISH 5's cloud jump): the dancers now dance to their OWN clock (`people.js#danceBeat`) that follows the beat
  grid's pace + glides to its phase — whole beats absorbed at once, the fraction at ≤ 0.6 beat/s — so the grid arriving / re-calibrating /
  a new song can never snap a pose (the likely cause: the song's grid landing mid-dance on the cloud's late audio). Local: 0 jumps / 901 frames.
- **THE DRONE MESSAGE** starts UNDER SPEAKEASY (its 15 % ghost included) — the first line no longer under the dimmed NEON letters; a
  first visit's "12 PARTY GAMES · ONE PHONE EACH" fades with the tagline under a sky message.
- **THE LADDER's HANDS**: the push upright, the catch + the haul now REACH the rails / the rope (`core/harbor-crew.js#railAhead` — the same
  eased turn the ladder makes; `folk.js#reach`).
- **THE MUSIC-ON SURGE ON THE BEAT** (the owner's add-on, `title.js#surgeOnBeat`): when the music comes on (the first tap, the music
  button) the race starts on the song's NEXT BEAT — the next DOWNBEAT when that's within 0.6 s — from the trusted grid as heard
  (`audio/beat.js#beatSource`); no trusted grid → at once; a tap that should start the music whose clock hasn't moved within 0.8 s → at
  once; the 10-s cooldown kept. `surge().last.onBeat` = { wait, err (beats off), down } (local: 188 ms wait, 0.04 beats off the downbeat).

### 1. THE WEATHER MODEL (`core/harbor-weather.js`, PURE — `tests/harbor-weather.test.mjs`)
`cityWeather(wx)` → ONE state every system reads: **clear · drizzle · rain · heavy · storm · fog · mist · windy · freezing** (snow: 9b),
with its intensity `k`, the rain level, the rate (mm/h), fog, wind + GUSTS, ice, lightning / thunder (only on a thunderstorm code or a
forced storm) and WHY. The live answer now carries the RATE (the last quarter hour ×4 — `weather.js#rateOf`) + the gusts (`/api/sky`
asks `wind_gusts_10m,precipitation`). Thresholds (`WX`): drizzle < 0.5 mm/h, rain to 7.6, heavy past it; windy ≥ 10 m/s or gusts ≥ 15;
freezing: a freezing code or rain at ≤ 0.5 °C. **THE TRANSITIONS** (`stepWeather`): rain builds from a few drops (~90 s live, ~20 s on a
preview), stops over ~40 s, then the DRIPS die away over ~8 min and the STREET DRIES over ~45 min; fog over ~2 min; the wind eases. A load
in the rain shows the rain at once (joined); a load after real rain starts wet (`wetFrom(wetAt)`; a preview: `&rained=<min>`). The scene's
`WXS` drives `LK.rain / fog / storm / wind` (every module reads LK). The readout's weather lines end with `→ STATE k% · why · rain / wet /
drip / fog / ice / wind`. **PREVIEWS**: `&force=drizzle|rain|heavy-rain|storm|fog|mist|windy|freezing-rain` (+ `&wxk=light|medium|heavy`)
or `&wx=…`; the panel's WEATHER: one button per state (+ the old looks), REAL clears it, an INTENSITY row (AUTO / LIGHT / MEDIUM / HEAVY).

### 2. THE SKY + THE WATER
- **THE RAIN** (`rainfx.js`, the Harbor's own — City 1.0's `district/rain.js` no longer loads here): three depths (far fine + dim, mid,
  near long + soft), slanted by the real wind + a gust sway; LIT by what it falls past — a coarse light grid (16-pt cells, every 300 ms)
  from the NEON logo (its colour, as lit as it is), the signs (`neon.signLights()`: rect + colour + lit) and the lamps' globes → pink /
  cyan / amber streaks near the tubes; silver-grey by day. The mid drops land on the harbor as RINGS, the near ones on the promenade as
  SPLASHES; distant shafts hang from the cloud base. Batched by quantized colour (one path + one stroke a batch). Caps 150 / 280 / 440 by
  tier (tier 0 a lighter rain); reduced motion: a still light rain.
- **THE STORM SKY**: `clouds.set({ grey, dark, base })` from the weather (in tenths) — the deck greyer + darker + lower with the rain;
  `DARK_TERMS` turned on (cloud 0.08, storm 0.55; `scene.js#stormDark`: a storm's rain, a heavy rain a little) — a storm afternoon's
  lamps + neon + windows come on early; and its GLOOM (`tones.js#harborWeights(LK, gloom)`): a share of the day's weights handed to the
  blue hour's, so the facades + the sky darken toward its silhouettes.
- **THE LIGHTNING** (`lightning.js`): the deck lit from inside round the strike + a branching BOLT behind the far skyline (the city stands
  in front of it) about 1 strike in 3; strikes every 6–22 s. SAFETY (`LIGHTNING`): the sky's light ≤ 0.42, the city's lift ≤ 0.1 (never a
  white screen), ≤ 2 flickers inside 0.6 s, strikes ≥ 4.5 s apart; reduced motion: no flash, no bolt (the thunder still rumbles). The
  thunder follows after `thunderDelay(km)` (3–16 s).
- **THE FOG ON THE WATER** (`waterfog.js`): a bank on the harbor — densest at the far quay (the far shore melts into it), thinning to the
  rail, wisps drifting with the wind; pale by day, lit by the city at night. The far skyline's fog, the lighthouse's fog beam + the red
  beacons through it were already in (City 1.0's fog layers + 6b).
- **THE WIND** moves the rain's slant, the smoke, the flags, the boats' sails + pennants, the leaves, the clouds, the balloons' way; the
  people hold their hats in a strong wind.

### 3. THE PROMENADE + THE PEOPLE
- **THE WET PROMENADE** (`wetground.js`): ~9 PUDDLES seeded in the LOW SPOTS (the front edge, along the curb, the building's foot — never
  the inlay, a lamp, a tree, the bench, the hydrant): each mirrors the sky (pale by day, navy at night) + the lights standing behind it
  (the globes' warm streaks, the signs' colours from the rain's light grid) and has its own DEPTH, so the street DRIES patch by patch (the
  shallow ones first); the lamps' long broken WET REFLECTIONS down the stones; RINGS in the puddles while it rains; DRIPS gathering on the
  awning's front edge + falling. Baked into one canvas per step of wetness / light (the rings + drips live). The street under the dock's
  own wet hook (`streetWet`) now follows the real wetness (quarter steps).
- **THE SPEAKEASY IN THE RAIN**: a sheen, beads + rivulets on its glass (the rooms a little veiled), the hush sign's cyan on the wet
  brick under it.
- **THE PEOPLE**: fewer in rain (as before) and ALMOST NOBODY IN A STORM (`MOOD.stormCut`); someone SHELTERING under the awning (`shelter`:
  at the shop window facing out a minute or two); mostly BLACK umbrellas + a few colours (red, navy, mustard, plum); without one, a
  NEWSPAPER tented over the head; a HAND ON THE HAT in a strong wind; slower in fog (`MOOD.fogSlow`), the far ones FADING into it.
- **THE WINDOW MOMENTS' weather gate** wired (`windows.js` ctx.wx: 'rain' | 'hot'): a DESK FAN on the apartment's sill on hot afternoons
  (`fan`, not a starter).

### 4. THE NEON SIGN + THE GLASS UI (`glasswx.js` — small overlay canvases, z-index 72: over the corner buttons, under every sheet)
- **THE NEON LOGO IN THE RAIN** (its tubes from the logo's own paths — `signGeometry`, the scene's halo mapping): drops land, BEAD as tiny
  LENSES (the tube's colour refracted — a glowing lens on a lit tube; a thin dark refraction rim; a hot caustic at the foot; a crisp
  specular toward the light), GATHER + MERGE (volumes add), RUN along each tube's slope to its low points + ends, and a heavy one lets go: a
  DRIP falls with a glint.
- **FREEZING RAIN**: a clear uneven GLAZE (thicker on the tops) with SPARKLE, the brackets glazed, ICICLES under them + under the tubes'
  low ends catching the glow; the warm lit tubes shed it (thinner glaze + drips off the icicles). The word always reads.
- **THE GLASS UI** (JOIN · the pill · HOST · ☰ · ♪ — `title.js#glassShapes`, at rest): rain BEADS on their glass + a RUNNER now and then;
  in the COLD (≤ 1 °C, full by −6; `&temp=` previews) a pale crystalline FROST grows in from the edges with a cooler tint + a pale rim —
  only in the RIM BAND, never over a word or an icon (tested: the labels' pixels untouched), no icicles; pointer-events none; off with
  reduced motion. A city opened on a cold day already has its frost (joined). City 1.0's full-screen frost pane + the pill's CSS drops
  are off in the Harbor (the screen's frost of a snowy night is 9b's).

### 5. THE SOUNDS (docs/audio.md#the-weather-sounds)
Ten recordings imported (`scripts/add-city-sfx.py` CUTS; 1.8 MB): rain-pavement, rain-drizzle, rain-water, rain-awning, thunder-far (2
takes), wind-leaves, foghorn (3 blasts), crickets-night, birdsong-morning, gutter-drip. The mix (`sounds.js` THE WEATHER): the rain's beds
by intensity + by where you stand (the awning close LEFT, the pavement, the water far RIGHT), the drips after it, the wind in the leaves on
a windy day, crickets on warm summer nights (≥ 16 °C, Jun–Sep), birdsong on spring / summer mornings; the thunder after its flash. All
under the music (the bed's duck). The AUDIO panel's `weather …` line names the beds sounding.

### Tests
Unit: `harbor-weather.test.mjs` (9: the states, the rate, the previews, the transitions, joined, no weather on a clear day, the lightning's
caps, the people, the puddles), `harbor-balloons.test.mjs` (4), `harbor.test.mjs` (DARK_TERMS on), `city-sounds.test.mjs` (the new slots,
the 13 MB budget). E2E: the new `weather` group (the `wild` cloud job; `tape` → audio, `legends` → wild to keep every job < 300 s): a
clear day has none; each state forced + its look; the sign's beads + the labels clear; the lightning capped + spaced; reduced motion; the
drying street; the festival's order. `legends`: the light audit + its control. `neon`: the surge on the beat (a timing warning).
`panel`: BALLOONS · FAST.

### Decisions made (each the most reasonable reading; easy to reverse)
- Group 0 + Group 1 went in one checkpoint commit (the scene file carries both).
- The bullseye: one scheme (violet + teal on cream); the flag replaced the festival's stripes; pinstripes = POLISH 5's two-colour gores.
- Balloons keep to the band under the tagline (the "never behind the sign" rule) — at 402 that's ~100 pt above the crowns, so a festival's
  six overlap a little at times (different depths); far ones never cross the letters.
- The music-on surge: a tap that should start the music arms the 0.8-s fallback (any tap while the music is on but not yet sounding).
- A storm afternoon's gloom = a share of the blue hour's tones (≤ 0.5 × the storm darkness) — the existing dusk path, no new bake type.
  The DOM NEON sign keeps its sun plan (it doesn't light early in a storm — a later call).
- The wet street + the puddles: baked per wetness step (20 steps) — a few re-bakes while it soaks / dries, never per frame.
- Thunder: the Harbor's own `thunder-far` (City 1.0's recorded thunder + rain loop are off in City 2.0); strikes within 6 s of the last
  queue behind it.
- The glass UI's frost starts at ≤ 1 °C (full at −6); freezing rain adds 0.7 × its ice.
- City 1.0's full-screen frost pane is off in the Harbor (9b's snowy-night frost replaces it).
- The audio/city budget 11 → 13 MB (Parts 10–11 will need more; every slot loads only when its event plays).
- The cloud jobs re-balanced (tape → audio, legends → wild) rather than adding a sixth job (CI minutes).

### Performance (ONE A-B-B-A round, `title-perf.mjs --ab` against e1f4af4 — the commit before the pass, whose rain + fog are City 1.0's — 402×874, 2 + 2 windows of 5 s; scenes `w-rain`, `w-storm`, `w-fog`)
| scene | tier 2 (2× CPU, GPU) A → B work mean ms | tier 0 (4× CPU) A → B work mean ms | verdict |
| --- | --- | --- | --- |
| rain at night | 10.19 → 10.64 | 11.62 → 12.39 | **same** both (within the noise) |
| a storm at night | 10.51 → 11.12 | 11.66 → 12.47 (after the fix; first run 11.50 → 13.83, frames 33 ms p95: **SLOWER**) | **same** after the fix |
| fog by day | 8.83 → 8.27 | 10.28 → 9.74 | **same** both |
THE FIX the first tier-0 storm run asked for: the dock's + the corner buttons' glass redrawn only when their wetness / frost / light /
shapes move a step or a runner runs (still otherwise — they're retained canvases), the sign's beads redrawn every other frame at tier 0
with half the beads, the rain's batches keyed by number (no string per drop). The laptop's absolute numbers are over the per-tier budgets
on both sides (warnings; the owner's iPhone readout decides).

### Known issues (9a)
- **WebKit can't run here**: the overlay canvases, the lens sprites + the frost are proven on Chrome only — the owner's iPhone decides.
- **The emulator-backed checks** (the `dock` group's HOST → lobby, the panel's EVERYONE) can't run on this laptop (no Java) — the cloud run decides.
- **The baked tree crowns don't sway** in the wind (the leaves, the flags, the smoke, the rain + the boats do); coats don't flap (hats are held).
- **The dancers' jump** fix is a hypothesis (a grid snap under late audio): the cloud's `street` job will tell.
- **The hush sign's glow on the wet brick** is a soft cyan wash under its window — subtle at 402.
- **The DOM NEON sign** doesn't light early on a storm afternoon (the city's neon + lamps do).
- **The festival** at 402: six balloons in a ~100-pt band overlap a little at times.
- **The cloud run (40267052199)**: audio, show, street, wild green (`weather` 16/16); `city` 103/104 — `load`'s "LOAD WEATHER — answered in
  1.2 s" saw the reveal at 1480 ms with NO answer (seeded): the mocked `/api/sky` evidently failed / raced on the runner (a settled ask with
  no answer reveals at once). Locally it passes twice (revealed overcast at ~2.2 s). 9a didn't touch the load path; not re-run (the two-run rule).

### Previews (Ben's iPhone — `https://neonspeakeasy.com/?city=2&tz=America/Detroit&at=42.96,-85.67&debug=1&…`)
- **The wheel in the TR-3B blackout**: `&when=2026-10-22T22:30&force=tr3b&lgs=15` (every light dark — the wheel too).
- **Rosie by day / night**: `&when=2026-10-22T13:00` · `&when=2026-10-22T22:30`.
- **A balloon (fast)**: `&when=2026-10-24T09:30&wind=1&force=balloons-fast` · the festival fast `&force=balloon-festival-fast`.
- **Drizzle → rain → heavy rain at night**: `&when=2026-10-22T22:30&force=drizzle` · `&force=rain` · `&force=heavy-rain` (or the panel's
  WEATHER: DRIZZLE → RAIN → HEAVY RAIN to watch it build).
- **A storm by day + at night**: `&when=2026-10-22T14:00&force=storm` · `&when=2026-10-22T22:30&force=storm` (lightning + thunder: tap for sound).
- **Fog by day + at night**: `&when=2026-10-22T11:00&force=fog` · `&when=2026-10-22T22:30&force=fog` (the lighthouse + the foghorn).
- **A windy afternoon**: `&when=2026-10-22T15:00&force=windy`.
- **The wet street drying**: `&when=2026-10-22T22:30&wx=clear&rained=5` (just stopped: drips) · `&rained=25` · `&rained=40`.
- **The sign + the dock in the rain**: `&when=2026-10-22T22:30&force=rain` (the beads on the tubes, the drips, the glass).
- **Freezing rain**: `&when=2026-01-15T22:30&force=freezing-rain` · by day `&when=2026-01-15T13:00&force=freezing-rain`.
- **The cold glass**: `&when=2026-01-15T13:00&wx=clear&temp=-5`.
- **The surge on the beat**: any link, music OFF then ON (after 10 s).
- **The fan on a hot day**: `&when=2026-07-15T14:00&force=window-fan`.
- **What to listen for**: the rain's three layers (the awning close on the left, the street, the water far right), the thunder rolling in
  seconds after its flash, the foghorn's long gaps, the drips after the rain, crickets on a warm summer night (`&when=2026-07-15T22:30&temp=22`),
  birdsong on a spring morning (`&when=2026-05-15T06:45`), the burner's rare burns with a balloon up.

### Handoff → 9b (WINTER + THE CONSTRUCTION TOWER)
- The weather model's states end at freezing rain — 9b adds the SNOW states (`cityWeather`'s order: snow before rain at ≤ 0 °C) and the
  real SNOW ON THE GROUND (`/api/sky` snow depth + the fallback snowpack).
- `glasswx.js` is the place for SNOW ON THE SIGN (the tubes' tops from `signGeometry`; pillowing while off, melting slowly when lit — the
  beads' run/drip machinery is the melt) + the screen's snowy-night frost (the frost sprites' dendrite builder).
- `wetground.js#puddlesOf` = the thaw's slush + puddles; `streetWet` the plowed road's wet; `WXS.wet / drip` the melt.
- The winter sounds (wind-winter, snow-hush, snow-shovel) are waiting in ~/Downloads/city-sfx (slots exist).
- The people's rain hooks (`umbrella`, `paper`, `holdHat`, `shelter`) are the pattern for boots + mufflers + snowball fights.
