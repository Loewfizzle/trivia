# Part 6a — THE EVERYDAY SKY (Oct 21 2026)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

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
  horizon on its side of the sky. THE MOON (redone Oct 24 — the owner: "the craters look off") is a PHOTOGRAPH: `assets/moon-near.jpg`
  (256² grayscale, ~17 KB), the near side pre-projected as an orthographic disc from NASA's CGI Moon Kit (the LRO LROC WAC colour
  mosaic `lroc_color_poles_2k`, NASA's Scientific Visualization Studio, svs.gsfc.nasa.gov/4720 — public domain; credit: NASA's
  Scientific Visualization Studio / LRO LROC team), levels stretched. The maria, the bright highlands, Tycho's rays — no drawn
  craters. Lit per pixel once per quantised look (≈ 3 ms on a laptop, a rebuild every few minutes at most): Lommel–Seeliger (the
  full moon flat and even, a quarter falling gently toward a soft terminator), a soft limb, earthshine + amber + the low moon's
  softer seas in the same pass. TURNED TO THE PLAYER'S SKY (`moonSky(L)`, pure): the lunar north from the ecliptic pole at the
  local sidereal time (the parallactic tilt: north leaning left at moonrise, right at moonset, ~upside down in the south), the bright
  limb pointing at the real sun (an evening crescent lit lower-right, a morning one lower-left). Loaded lazily, fails silently: no
  image → the old crafted texture (below), turned the same way. Two old bugs fixed on the way: a multiply over the translucent dark
  part filled it in — a low amber CRESCENT showed as a full moon and the earthshine as a pale opaque disc — and a translucent
  fillStyle left over from the amber faded the next moon. The fallback: a crafted texture (the near side's maria where they are, Tycho + its rays, Copernicus,
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
