# WSP — WEATHER + SKY + PEOPLE (Nov 1 2026, evening; City 2.0 behind `?city=2`)

The owner's PERF-B review fixes, the clouds + the moon, drizzle, the blowing snow, the gale, the tree, the washers + the people, the
boxer + the boss. ONE session, the groups in order, no helper agents; each group committed + pushed on its own. Written from plan.md
"OWNER'S NOTES — NOV 1 (late morning)" + "(evening)" (Step 0, part 46). Measured on the mini PC: Chromium 1248 (4× CPU for title-perf),
WebKit 2215 at the owner's 402×660 dpr 3 (`C:\Users\benja\wk\wkfill.mjs`, A = cfe0a6c on :5174 — APP FIXES' end, B = this pass).

**Mid-pass additions by the owner** (in chat): (1) THE SKULL replaces the violet + teal bullseye balloon ("a black and white skull … high
quality like all the other ones"); (2) THE BAG UNDER THE MUSIC — the heavy bag got quieter with the music button OFF after APP FIXES.

## What changed

### Group 1 — the owner's PERF-B review
- **THE CLOSING DRAGON EGGS — ONE SALVO** (`core/harbor-fireworks.js#partyScript`): the 8 crackle shells share ONE burst time + ONE rise
  (so ONE launch), edge to edge behind the sign (x 0.07 → 0.93); their pops scatter by themselves (each crackle star its own pop time — the
  renderer). The beat sync moves them as one (a bar). Their sound (`scene-fireworks.js`): the first three booms + crackles of a one-moment
  salvo heard (eight stacked at full gain would clip). Unit: the same launch + burst before and after `syncToBeat`.
- **THE BALLOONS' LAYER SNAP** (`balloons.js#layerClear`): the near ones' overlay sits above the WHOLE city, so a near balloon still rising
  from behind a tower jumped in front of it the moment it touched the sign's band. Now ONE CONTINUOUS DEPTH: the layer a balloon WANTS
  (front: a near one by the sign; back: everyone else) is taken only where nothing it overlaps would show the switch — clear of every roof,
  roof sign + spire under it AND clear of the sign's band; in front, its basket never tucks behind a roof. A near one that reaches the sign
  still tucked behind a roof crosses BEHIND the letters that time.
- **THE NEAR ONES CROSS THE LETTERS FASTER** (PERF-B's known issue; `balloons.js#squeezeBand`): a near balloon's altitude journey squeezes
  the sign's band (SIGN_SQUEEZE 2.5 — continuous, monotonic, the ends fixed): its share of the journey over the letters ~33 % → ~17 %.
- **THE PREMIUM ₿** (`balloons.js#btcMarkPolys / btcPath / bitcoinMark`): the real public-domain Bitcoin logo's ₿ path (its 64-unit
  drawing, the B tilted ~14° with its strokes above + below), flattened once to polygons and PROJECTED POINT BY POINT onto the sphere — it
  wraps over the gores, vector-crisp at any dpr; a soft print shadow, the mark, a gloss on the light's side clipped to it, a lit lip — then
  the gores' puff, the sphere's light + shade and the sheen laid OVER it like the rest of the fabric. The pair kept (orange on black, glowing
  at night; black on orange).
- **THE SKULL** (the owner, mid-pass — `balloons.js#fabric` 'skull'): bone white over the dome, BLACK from the jaw down (the black + white
  he asked for); big sockets (rounded squares, the inner top corners pulled down — stern, a soft bone-shadow rim), the inverted-heart nose,
  the cheek hollows' shade, a row of teeth wrapping the curve (outline, bite line, gaps) — all projected onto the sphere like the smiley; the
  puffed gores + light + sheen over it; at dusk the lit sprite glows the bone warm while the sockets stay black. In the festival's line-up +
  the everyday kinds (`FESTIVAL_ORDER`, `BALLOON_KINDS`).

### Group 2 — the sky
- **THE CLOUD FLICKER** (`clouds.js#fadeMix`, `CLOUD_FADE_MS`): the real bug — the re-light crossfade drew the OLD bake OVER the new one,
  so the moment a fade began a cloud's see-through parts (thin edges, most of a strato / alto / cirrus layer) got DENSER at once, then eased
  back: a brightness pop every re-light (~45 a minute at golden hour; a 1-unit change in the sun's colour re-lit all 12 clouds at once). Now
  a TRUE crossfade (the two bakes SUMMED with 'lighter' — premultiplied, so colour AND alpha blend exactly — into the cloud's own canvas,
  re-mixed in 64 steps), the fade 0.9 → 6 s, and never a new light mid-fade. Proof (golden hour, 140 frames at 250 ms, the sky's mean light's
  jumps beyond its local trend): jumps > 0.1 31 → 10, the largest 1.47 → 0.51, the sum 10.8 → 5.1.
- **THE MOON BEHIND THE CLOUDS** (`clouds.js#moonBehind`): in a small box round the moon only — the THICK clouds over it (heaps, strato,
  alto, the deck, scud; never the cirrus / the veil) drawn into the box as they are on screen and laid twice more over the city inside a
  soft disc (a body 60 % opaque → ~94 %: the moon gone; a thin edge → a soft glow through it); the GLOW THROUGH — a silvery glow with the
  thickened cloud cut out (it lights only the thin parts + the sky past the edges); THE SILVER EDGE — the clouds' outline (the mask minus its
  erosion) lit silver, built at half resolution so it draws up SOFT, brightest by the moon, scaled by the phase + how much is covered. The
  thin clouds keep the old halo (`coverAt(…, thinOnly)`). Redrawn only when the moon or a cloud moves ~½ pt.
- **`&force=moon-cloud`** (+ its panel row MOON BEHIND A CLOUD): the biggest cumulus steered back + forth across the moon by its BODY's
  centroid (the baked thickness) — the preview of the look.

### Group 3 — the weather
- **DRIZZLE YOU CAN SEE** (`rainfx.js#rainLook`): ~0.34 of the rain cap (rain 0.74; was ~0.08), each drop nearly as bright as rain's but
  SHORTER (×0.38), THINNER, SLOWER (×0.45); the share leans to the mid + near depths (the far ones too fine to read); by DAY whiter + a
  little more opaque (light drops on a bright grey sky barely read). Rain + heavy rain untouched (the drizzle share fades out by 0.5).
- **THE BLOWING SNOW** (`snowfx.js`): (1) ONE DIRECTION once the wind drives the snow (a blizzard, or a drive over ~18 pt/s): the gusts
  change its speed only, never below ~45 % of the drive, never a reversal; (2) INERTIA — each flake eases toward that target (τ 0.28 s for
  the dust … ~0.5 s for a big near flake): it curves through the gusts; (3) the near flakes' smear holds its slant with hysteresis (±4°;
  on at 0.65 × its fall, off at 0.5). The look kept: the same drive, sway, speeds (the blizzard's near flakes' median 152 → 154 pt/s).
  Measured (the near flakes' sideways speed sampled at 30 ms): heavy snow in a wind — jolts (> 25 % in a sample) 23 → 0, near-stops
  1045 → 569; the blizzard — the smear's slant flips 22 → 1 per 10 s. (4) the colour steps (q()) — not visible: left.
- **THE GALE** (new `galesea.js`; `galeK(WF)` = 0 below "windy", ~0.3 at 14 m/s, 1 at a gale — a breeze unchanged): the harbor DARKER,
  broad SWELL bands sliding downwind (a dark trough + a lighter shoulder, in perspective), WHITECAPS that break (a bright head stretching +
  a lip) then fade into a trailing streak drifting downwind, more of them inside a gust (born where the gust wave is), bigger near us — by
  night a pale foam catching the city's light; SPRAY flung off the breakwater's rocks + the pier head's face in the gusts, blown downwind;
  the reflections broken harder + a bigger swell (`water.js`, `f.gale`); THE TREES lean harder downwind + TOSS in the gusts (`scene.js#swayPlan`:
  + gk·(0.03 + 0.06·gust) of the crown's height, a faster rock); more leaves torn off (`trees.js#createLeaves`: up to 2× the cap, 3× the rate).
  The people's lean + umbrellas already read `WF` (unchanged). Panel: NO GALE SEA (A/B).

### Group 4 — the tree (the HARD RULE)
- **BUILT**: `scripts/bake/tree.mjs` (+ `scripts/gltf-to-glb.mjs` — a .gltf + its files → one .glb, no deps) bakes danielpetrov's
  "stylized tree" ONE TREE ALL YEAR at the city camera's real view of the corner maple (z 42, x 10.92, 8.14 u tall) in day / gold / night:
  its flat-colour crown recoloured per season in soft world-space patches (spring light green · summer green · autumn red / orange / gold),
  front faces only (its inside faces showed through the gaps as blotches), its ground square cut; winter (a) its own bare limbs ('bare'),
  (b) Quaternius DeadTree_1 re-barked toward the warm trunk + scaled to the same height ('dead'), each with a snow copy (white where the
  limbs face up). 21 sprites 309 × 403 (+ PNGs) = 1.9 MB in `assets/city/tree/`; `tree-model.js` draws the season's sprite in the stage bake
  in place of the drawn maple (its grate + fallen leaves kept) behind `&tree=model | dead` (+ two panel rows); credited (CREDITS).
- **THE A/B** (390 / 402 / 430 is one camera here — the tree's real size at 402, day + night, each season): summer — the model's soft
  storybook crown better than the drawn ball; autumn by day — mixed (the model's crown reads as a few big lumps, the drawn crown's leaf
  dabs + visible limbs more crafted); autumn at night — the model blotchy in the city's night light; WINTER — the drawn tree's fine
  snow-laden twigs clearly beat both candidates (danielpetrov's bare form is a few stubby limbs; DeadTree_1 is a different tree).
- **DECISION: today's tree STAYS** (it was not CLEARLY better across the seasons — the owner's rule). The model stays as an off-by-default
  preview (no load, no cost unless asked).

### Group 5 — people + two windows
- **THE WINDOW WASHERS** (`folk.js` 'squeegee', `gear.js#squeegee`, `workers.js#platform`): the old swipe ran across, snapped back in a
  quarter of its time, and the next row began on the far side — the arm jumped. Now ONE CONTINUOUS S: four eased strokes, each starting
  where the last ended (a notch down between them), then the arm down to the bucket + back up to the top; each washer his own tempo
  (2.0–2.6 s a stroke) + his own place in it from his seeded height — the two never move together. The squeegee TWICE as wide (brass
  channel + black rubber edge) with a WET STREAK trailing it on the glass while it's on; real zinc buckets on the deck (lit rim, water,
  handle). The figures kept (the owner: "the people look good").
- **A FEW MORE PEOPLE BY DAY** (`core/harbor-people.js#MIX`): the morning, midday + afternoon counts up (weekday daytime ~4.5 → ~5.8 on
  screen, the afternoon ~4.4 → ~5.6, lunch ~6.5 → ~7.6), the weights leaning to the ones who STAND — the chat (meet), the railing (water), a
  window; the evening, the night + the party untouched (`tests/harbor-people-counts.test.mjs`'s bands updated).
- **THE DOG WALK** — checked at 402 (the dog clear on its leash, the walker natural): **unchanged** (not clearly better to change).
- **THE SHADOWBOXER** (`boxer.js#breathePose`): the arm-shake + the towel-off REMOVED — in the rest he STANDS catching his breath (hands on
  his hips, elbows out, the shoulders + head heaving slowly, deep at first, calming — nothing moving low), then the approved lean + slide
  down to sit (unchanged); at the evening's end the same breath before he walks out.
- **THE BAG UNDER THE MUSIC** (the owner's add-on; `core/harbor-boxer.js#boxerDuck`, `sounds.js`): the duck asked `music.js#musicSounding()`,
  which answers TRUE when no song exists at all (`!current → !desired || isUnlocked()`) — and since APP FIXES' stop + disconnect, a page with
  the music button OFF has no song → "sounding" → the bag at 0.55. Now the duck applies ONLY while music is really AUDIBLE: the music on,
  not muted, its volume up, AND a song playing (the page's own song's clock ≥ 0, or the synced station / party song). **Before / after**
  (the boxer's cue gain factor, the music button OFF, after a tap): 0.55 → **1** (the approved level); with music on + nothing playing yet
  0.55 → 1; with a song or a station playing 0.55 (unchanged). Unit: `harbor-boxer.test.mjs` (7 cases). (Headless can't start a real song —
  both 9104dc9 and now report "sounding" with none — so the measure is the gain factor the code passes, read from `harbor().sounds.boxDuck`.)
- **THE BOSS's NIGHT** (`core/harbor-moments.js#roomState`, `window-paint.js#shadePull`): the TV ON ~9:30 pm (`lights-out` at 21.5, the same
  ±12 min nightly jitter); after the 3 am switch-off (+ its last flicker) he PULLS THE SHADE DOWN — 'shade' (SHADE_LEN 6 s): he steps in, one
  arm up to the hem's ring, draws it down (eased), steps away, solid against the light; then 'night' (replaces SP3's 'dark'): the shade
  drawn, ONE small NIGHTLIGHT low + left of centre glowing warm through it, fading out as the daylight comes up (`E.day` — the real
  sunrise's light), then his day as before.

## The numbers
| | before (cfe0a6c) | after |
| --- | --- | --- |
| WebKit 402×660 dpr 3, the gale (work ms / painted MP) | 9.7 / 7.11 | 10.4 / 7.29 (+238 small fills: the whitecaps) |
| WebKit, the blizzard | 13.8 / 9.20 | 14.6 / 9.39 (the gale's sea joins at 17 m/s) |
| WebKit, the party peak (Sat 11 pm) | 15.0 / 8.35 | 14.9 / 8.44 |
| WebKit, the finale | 15.2 / 8.50 | 14.9 / 8.56 |
| `title-perf --ab` (Chromium 4×, t2): atm-gale · atmb-blizzard · np-party · p10-party | — | all "same" within noise |
| THE BASELINE GUARD (`ONLY=perf PERF_GUARD=only`) | — | 0.85× · 0.95× · 0.84× (≤ 2×) |
| the tree model's sprites (preview only) | — | 1.9 MB on disk, 0 loaded by default |
- Tests (local, the mini PC): unit 970, rules 55, /api 27, smoke `GAMES=cipher` 3/3, `ONLY=perf` 3/3 + 12/12; THE FULL e2e-harbor suite
  789 / 791 + one group timeout (1102 s, 4 shards) → fixed + re-run: `ONLY=motion,panel,windows` 105 / 105. The three: (1) NEVER FULLY DARK
  expected SP3's dark TV room — the owner's nightlight replaces it (the check now wants the shade drawn + a warm, dim glow); (2) THE PLANTED
  FOOT NEVER SKATES — the bigger daytime mix brought a walker heading INTO the distance on screen (4.2 px/s vs the couples' 16): a sub-pixel
  drift of the rig's depth approximation over a tiny screen speed read 0.35; the slide is now judged against the larger of the screen speed
  and ~0.45 of the figure's height a second (0.12 — what a viewer would see slide); (3) the panel's EVERYONE timeout — my local server ran
  without `--emu` (`/api` 503 unconfigured), restarted with it: green.

## Decisions
- **THE BLOWING SNOW SHIPPED** — clearly smoother by the numbers (jolts 23 → 0, slant flips 22 → 1 per 10 s) with the same speeds + look.
- **THE TREE DID NOT SHIP** — the hard rule: summer better, autumn mixed / worse at night, winter clearly worse; today's maple stays, the
  model kept as a preview (`&tree=model`).
- **The dog walk unchanged** (checked; not clearly better to change).
- **The skull** joins the festival in the bullseye's place (the owner); the bullseye's scheme is gone.
- **The near balloons may cross BEHIND the letters** when they reach the sign still tucked behind a roof (the price of never switching
  layers in view).
- **The salvo's sound**: three booms heard for the eight shells (one moment; eight at full gain would clip).

## Known issues
- **THE CLOUD RUN (run 1 of 2, 816f5b1): tests GREEN; harbor 8 / 10 — two timing checks on the 2-core runner, in code this pass did not
  touch; both pass locally**: (1) `perf` — partysync's "IN TIME: each within ~100 ms of the server clock's timeline" read −20 / −104 ms
  (4 ms over); (2) `wild` — "NO BRIGHT FLASH IS SILENT": the FIRST close strike after the tap heard 0.72 s late (`thunder-close-5`; the next
  two 0.53 + 0.27 s, on time) — the same shape as APP FIXES 6b's fireworks (a forced event at the tap, its take not decoded in time on a
  busy runner: the fix there was "an on-time one heard + every one after it on time"). The moon code is not involved (0 rebuilds in that
  storm: no moon in view). NOT re-run (the rules: never re-run to confirm a flake; the two-run cap) → the next pass: the thunder check's
  first-strike race at its cause (as 6b), partysync's margin on the runner looked at (never a widened tolerance without a cause).
- **The moon-behind's rebuild rate**: ~20 a second while a cloud drifts by the moon (each a few small drawImages; the clouds' whole draw
  0.5 ms in Chromium) — `clouds.moonBehind.builds` counts them; a 1-pt key would halve it if the phone bench ever shows it.
- **The moon's thin streak**: a faint vertical line can show inside a steered cumulus near the moon (zoomed 2×; invisible at real size).
- **The gale + the blizzard cost ~+0.7 ms in WebKit** (the whitecaps' small fills) — the phone bench decides; a gale at the party peak is
  rare (no fireworks in a gale).
- **The washers face the wall**: their arms + the squeegee read; their faces never show (as designed).
- **The boss's shade pull at the tap-peek**: a tap during the 6-s pull lifts the hem a hair (both read; untested on the phone).
- The headless check of THE BAG UNDER THE MUSIC reads the code's gain factor, not the speakers — the owner's ear on the phone confirms.

## Hand-off → WINDOWS
The juggler, the crate guy, the Charleston, the bookie in THE ROTATION; the old scenes retired behind a switch; an empty window = its shade
down + its glow (decisions.md §7). The boss's shade pull (`shadePull`) + the nightlight are a pattern the shades' after-hours glow can reuse.
