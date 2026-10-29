# NEON PASS 3 — THE WOW PASS (Oct 22 2026): the night city spectacular, party nights a real show

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

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
