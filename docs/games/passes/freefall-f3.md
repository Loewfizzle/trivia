# FREEFALL — F3: THE DAY LOOK + THE AREA COLOURS + THE NEW OPENING (+ F2's open calls) (Nov 26 2026 — on the Beelink)

The owner's decisions: `docs/games/plan.md` "FREEFALL — F3 (approved Nov 26)". The game's page: `docs/freefall.md`. Built on F2 (the
unlisted test page **https://neonspeakeasy.com/freefall-play** — **NOTHING COUNTS UNTIL GO-LIVE**). **Nothing is registered** — no GAMES
entry, no `config.js` / meta / boot / cartridge change, no `/api` wiring, **no rules-file change (nothing to re-publish)**. THE
BREAKTHROUGHS (skylight 40, splashdown 120, THE BOTTOM 200) are **F3B**.

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 62355d3f | the owner's F3 decisions in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 226 marks, **no open FIX**; the inbox: no entry for this pass at the start (re-read after every group) |
| 0 — F2's OPEN CALLS + THE COLOURS | 701a32a6 | THE HOLD = EXACT RESUME (engine + judge + its tests) · the ball's rim + dot · the fire twice as long · the accent = title-05's pink + teal · THE AREA PALETTES (night) |
| 1 — THE ASSETS | c0a50a61 | `scripts/build-freefall-assets.py`: the four day walls (296 KB) + the title in two widths (271 KB), its alpha edges measured |
| 2 — THE NEW OPENING + THE GLINT | 1da91380 | title-05's lettering + tagline over the live tower; the glint (a CSS mask); F2's tube sign removed |
| 3 — THE DAY LOOK | 3862a786 | ONE scene, a LOOK read live (`day-fx.js`): ice-glass floors, the five areas by day, THE MOTES, THE DARKNESS by day, light that covers; the kit's shared DAY / NIGHT |
| 4 — THE ARRIVAL BANNERS | cc1603b6 | `banner.js`: the band baked ahead of the arrival; F2's small area name removed |
| THE ADD-ON (the inbox, Nov 26 9:25 am — "to the next pass, any") | 2ece38cc | TWO SONGS AT ONCE — `js/app.js` only: a daily run rests the synced radio (below) — marked ✓ done in the inbox |
| THE OWNER's FIVE ADD-ONS (typed in while the pass ran, Nov 26) + THE REVIEW's fixes | 6cdac5b4 | THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE (the rule's numbers, seen + heard) · THE DAY FLOORS CLEARLY COLOURED · FREEFALL's OWN ROOFTOP PANORAMAS at full resolution (replaces "the rooftop sky is too soft") · THE NIGHT WALLS v2 + the glow eased |
| THE CLOSE | (this pass's last commit) | the docs, the final run |

## GROUP 0 — THE HOLD = EXACT RESUME (the owner's answer to F2's OPEN FOR BEN 4)
F2's hold restarted the ball's flight: a hold at the right tick cancelled a landing (three free red-dodges a solo run). **F3:**
`engine.js#hold(run, T)` = everything up to AND AT T happens (a landing due at T lands — on the angle the tower stood at), then the
whole state is frozen and resumed unchanged: the flight (`fl` · `pl` · `nl` — its phase + its height), the tower's angle, the darkness
(`dk` · `dn`). The only thing a hold changes: the next move counts at T + 1 at the earliest (no input counts while held). A hold whose
own tick ends the run is refused and leaves no entry. The page: the ball frozen at its own height under PAUSED, 3 · 2 · 1, then on from
that very tick; a drag while PAUSED or in the count turns nothing. Still 3 a solo run; a match never holds. No new rule-set row
(nothing was ever recorded).

**THE PROOF** (`tests/freefall-engine.test.mjs` — 24):
- the frozen state: `fl` · `pl` · `nl` · `dn` · `dk` · the angle identical before + after a hold, in a bounce and in a fall;
- **a hold ONE TICK before a red landing STILL ENDS ON RED** — and two and ten ticks before — at the SAME tick as the run never held;
  a hold AT the red landing's tick: the landing lands (out), the hold is refused, nothing is logged; the first move after GO counts as
  any other move;
- 300 fuzz sessions (moves before, at + after a hold): live == replay == `judgeRun`, the packed log canonical — **and the same log
  with its holds taken out replays to the same run, event for event**;
- a staller with three holds is out at tick 1140 — the very tick of one with none (F2: up to + 108 ticks);
- **floors 0–199 bit-identical to F2**: the tower's digest + the bots' run digests (match · daily · solo down to floor 200) pinned in
  `tests/freefall-tower.test.mjs` + `tests/freefall-sim.test.mjs` are unmoved; `node scripts/freefall-sim.mjs 2000` prints F2's table
  to the digit (SLOPPY 62 (40–94) · GOOD 136 · GREAT 200 in a match at 2:30, 76.2 % home · the staller 2,000 of 2,000 at 19.0 s).

## WHAT WAS BUILT (the detail: `docs/freefall.md` — "THE AREA PALETTES" · "THE DAY LOOK" · "THE OPENING + THE GLINT" · "THE ARRIVAL BANNERS")
- **THE AREA PALETTES — DEPTH-RELATIVE** (`palettes.js`): a floor wears its OWN area's colour + its area's rim; the last three floors of
  an area lean to the next one's. THE ROOFTOP hot pink → magenta · THE OFFICES electric violet → blue · THE SPEAKEASY deep rose → plum,
  brass rims · UNDER THE HARBOR teal → aqua · THE DEEP dark indigo, ultraviolet rims · THE TRENCH the deep's, the rim turning a lap.
  No colour within 25° of red's hue (a unit test).
- **THE BALL unlit:** a pink-white rim + a white centre dot in a thin pink ring (its bloom held down so both read). **THE FIRE:** the
  column twice as long (a flame lives ≤ 0.82 s, the ribbon 2×), a little wider. **THE ACCENT** = title-05's colours: FREE #ff4fa8 ·
  FALL #27e0e6 · PLAY AGAIN + the cause teal.
- **THE ASSETS:** the four day walls (1024², WebP q 80, the wrap measured) + the title (WebP with alpha, 1170 + 780 wide; premultiplied
  through the resize; the edge error on pink + on a pale sky < 1 of 255).
- **THE OPENING (title-05) + THE GLINT:** the lettering 332 pt wide at 390 (85 %), in the top third, the tagline under it; the glint
  = a band swept across it in 0.8 s every 7 s, masked to the lettering's alpha, a 4-point star on the last letter; CSS only.
- **THE DAY LOOK:** one scene, `uDay` in every material; ice-glass floors tinted per area, a steel pillar, a pink ball; the rooftop's
  sky + JAYWALK's day skyline, the offices, the speakeasy, the harbor's water (the gradient, sun rays, caustics, bubbles), the deep
  (warm lamps, drifting particles); THE STORM CLOUD + THE MURK; by day light covers; the pink number in its dark outline.
- **THE ARRIVAL BANNERS:** a band across the foot of the screen, 1.6 s, baked ahead of the arrival; night dark + pink rules, day
  frosted + navy.

## THE ADD-ON — TWO SONGS AT ONCE (the inbox, Nov 26 9:25 am — the owner's iPhone; `js/app.js` only; `docs/audio.md` has its section)
City music → THE DAILIES → start a daily → the daily's song AND the city's. `inDailyRun(st)`: `musicTick`'s gates (the city radio, the
room's song on this phone, the warm-up) exclude a daily run — the host's duty to the room's queue goes on — and `render()` stops a
synced player still sounding at once. Tests: `tests/daily-music.test.mjs` (2) + `tests/integration/daily-music.mjs` on the emulators
(7 / 7: the radio rests 195 ms after a run begins, ONE song, the radio back alone; the old app.js fails it). Not run in a browser: the
room-lobby case + THE DROP's own music (the static test's — the same gate).

## THE OWNER's ADD-ONS (Nov 26 — typed into the pass; the detail: `docs/freefall.md`)
- **THE LIGHTS GO OUT = JAYWALK-STYLE PRESSURE.** `tuning.js` dark = { grace 3 s · pace 120 ticks a floor · lead 3 } (it was 4 s · 150 · 6): a
  stopped ball has **6 s**, a run nobody touches ends at **9.0 s**. The layout is untouched, REPLAY = LIVE, the judge reads the same
  row (nothing was ever recorded: no new rule-set row). **THE SIMS (2,000 seeds):** GREAT is never caught by the dark (0.0 %) · GOOD
  0.0 % · the human 0.0 % · SLOPPY 0.0 % — its longest stay on one floor is 5.1 s of the 6 (GOOD 2.7 s, GREAT + the human 2.1 s) — and
  **every bot run is tick-identical to before** (the table to the digit; the pinned run digests unmoved): no easing of `pace` was
  needed. A bot that stops is caught in 6 s (from the start: 9.0 s, 2,000 of 2,000). Three bounces a floor (126 ticks) is slower
  than the darkness and is caught in the end; two (90) stays ahead. **SEEN:** the stage's `data-dark` (3 · 2 · 1) drives a dark edge
  that creeps down from the top of the screen in step — faint at 3, over the top of the screen at 2, down to above the ball's bounce
  + the sides closing in at 1 — with a live line along its foot; night black-violet, day THE STORM CLOUD / the lights out / THE MURK;
  never over the ball or its floor. **HEARD:** THE RUMBLE — the lights-out sound an octave down, low-passed, looped softly (a bed of
  the audio engine), from 2 floors off; the full sound only when it catches.
- **THE DAY FLOORS CLEARLY COLOURED.** Each area's faces a pastel of 35–55 % saturation (a unit test): THE ROOFTOP soft pink-lavender
  · THE OFFICES periwinkle · THE SPEAKEASY blush rose + brass rims · UNDER THE HARBOR aqua / mint · THE DEEP soft lilac; rims a
  brighter version of the colour; white only in the frost, the highlights + the seams. Five clearly different towers
  (`f3-day-05-<area>.png`); red the strongest warm colour in each (the greyscale shots).
- **FREEFALL's OWN ROOFTOP PANORAMAS** (replaces the "sky too soft" stopgap + JAYWALK's skyline): `assets/freefall/sky/rooftop-night.webp`
  · `rooftop-day.webp` (3072 × 1024, 510 KB together; the day file's smears softened in the script), a FULL-RESOLUTION layer of its own
  (mipmaps + anisotropy, only while the rooftop is on screen), a texel = 1.18 screen pixels at 390 @3: the windows are windows
  (`f3-*-01-opening.png`, `-01c-opening-the-join.png`: no seam, `-05-rooftop-30.png`).
- **THE NIGHT WALLS v2:** offices · harbor · deep relit (the same names + pipeline); THE DEEP's twice round the shaft; the pink / violet
  glow from below eased to 0.4 (`f3-night-05-offices.png` · `-harbor.png` · `-deep.png`: each wall its own place).

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — the rules on snapshots of the pass's commit + F2's, its own node probes; the look from the shots)
**Its headline: no HIGH or MEDIUM finding.** THE HOLD = EXACT RESUME is sound — about 250,000 hold placements, 0 differences (the same
probe on F2's engine finds the free dodge 2,293 times in 2,400); floors did not move — 2,020 bot runs (278,160 floors) tick-identical
between F2's last commit and this pass's; a held log == the same log without its holds through `judgeRun` + `judgePacked` (93,467
cases, 97,045 holds, every kind of event); a staller is out at the same tick with a hold at any tick; 1,318 hostile judge inputs, 0
throws. The opening, the banners, the night palettes, the end + the sizes read at phone size. It was told NOT to judge what the
add-ons were rebuilding (the day floors, the rooftop sky, the night walls, the darkness) and NOT to run the browser or the speed test
(the tree was changing under it): those are the builder's own checks.

| # | its finding | what was done |
| --- | --- | --- |
| 1 | LOW (RISK, the owner's call): a pause is still "bullet time" — under PAUSED the tower is visible, mid-flight, for as long as you like; hiding again in the count restarts it without a hold | NAMED → OPEN FOR BEN 6 |
| 2 | LOW (BUG): the arrow keys counted during the 3 · 2 · 1 (up to 4 ticks credited at GO) | FIXED: a key while held is ignored; GO starts the key's clock at the hold's tick |
| 3 | LOW (RISK): THE TRENCH's band (201) is baked when THE BOTTOM's leaves — in play, once a run | NAMED (one bake of two lines, once, 1.6 s after floor 200; the first band of every arrival is ready ahead — checked) |
| 4 | LOW (look): at an area's first floors the day ink had changed while the old wall was still behind the HUD (3.8 : 1 at floor 120) | FIXED: the page's inks follow the WALL — five floors after the border, as the wall does |
| 5 | LOW (look): the day PAUSED screen — YOUR BEST 3.1 : 1 under the dim | FIXED: light inks + a darker plate while held |
| 6 | LOW (look, the owner's call): the banner covers the 3rd–4th floors below the ball for 1.6 s | NAMED → OPEN FOR BEN 5 |
| 7 | LOW (evidence): the night glint's shot showed no glint (taken at a loose moment) | FIXED: the shots at a fixed moment of the animation (`-01a-opening-glint` mid-sweep, `-01b-opening-star`) — both looks show it |
| 8 | NIT (BUG): on a cold load the glint started before its mask (the lettering) had landed; under reduced motion the ONE sweep could be missed | FIXED: the glint + its star start when the mask is in (`.ff-title.is-ready`) |
| 9 | NIT (BUG, the judge): a hold entry with extra or inherited keys was judged as a hold | FIXED: exactly its two own keys, else `entry` |
| 10 | NIT (the owner's call): ff-day.png has the band under the number | NAMED → OPEN FOR BEN 5 |
| 11 | NIT (look): THE SPEAKEASY's night rose is the nearest safe colour to red (31° away); two trench laps differ only by their rim | KEPT (the 25° rule holds; red reads by its chevrons + rim) |
| 12 | NIT: the docs of the hold were not committed yet | DONE (this commit) |
| 13 | NIT (app.js): when the run's deck is the city's own station the song dips for a moment as it moves to this phone's player | ACCEPTED (never two songs) |

## THE MEASURE (`--perf` — the mini PC, 390 × 844 @3, the bot shattering, the fire on; after the add-ons)
| look | where | tier | cpu | fps | frame ms (p50 · p95 · worst) | motes |
| --- | --- | --- | --- | --- | --- | --- |
| night | THE SPEAKEASY | 2 | 1× | 59.4 | 16.7 · 17.1 · 17.5 | 0 |
| night | THE SPEAKEASY | 2 | 4× | 60.0 | 16.7 · 16.8 · 33.4 | 0 |
| night | THE SPEAKEASY | 1 | 1× | 60.0 | 16.7 · 17.1 · 18.1 | 0 |
| night | THE SPEAKEASY | 1 | 4× | 59.9 | 16.7 · 16.8 · 50.0 | 0 |
| night | THE SPEAKEASY | 0 | 1× | 60.0 | 16.7 · 17.1 · 17.6 | 0 |
| night | THE SPEAKEASY | 0 | 4× | 59.7 | 16.7 · 16.8 · 33.3 | 0 |
| day | THE SPEAKEASY | 2 | 1× | 60.0 | 16.7 · 17.1 · 17.9 | 48 |
| day | THE SPEAKEASY | 2 | 4× | 60.1 | 16.7 · 16.8 · 16.9 | 48 |
| day | THE SPEAKEASY | 1 | 1× | 60.0 | 16.7 · 17.0 · 18.0 | 32 |
| day | THE SPEAKEASY | 1 | 4× | **56.1 in the full run** (one 250 ms frame) · **60.0 alone** (worst 16.9 — five runs) | 16.7 · 16.8 · 250.0 | 32 |
| day | THE SPEAKEASY | 0 | 1× | 60.0 | 16.7 · 17.1 · 17.8 | 18 |
| day | THE SPEAKEASY | 0 | 4× | 59.9 | 16.7 · 16.8 · 17.0 | 18 |
| day | UNDER THE HARBOR (the caustics + the bubbles) | 2 | 1× | 60.0 | 16.7 · 17.1 · 17.7 | 48 |
| day | UNDER THE HARBOR | 2 | 4× | 59.9 | 16.7 · 16.8 · 16.9 | 48 |
| day | UNDER THE HARBOR | 1 | 1× | 59.9 | 16.7 · 17.1 · 17.7 | 32 |
| day | UNDER THE HARBOR | 1 | 4× | 60.0 | 16.7 · 16.8 · 17.0 | 32 |
| day | UNDER THE HARBOR | 0 | 1× | 60.0 | 16.7 · 17.2 · 17.7 | 18 |
| day | UNDER THE HARBOR | 0 | 4× | 59.9 | 16.7 · 16.8 · 16.9 | 18 |
**17 of 18 rows in the full run — twice, and the SAME row both times** (the 10th: about two minutes into the browser's life — this
machine's known headless-Chromium stall; one 250 ms frame); that row ALONE is 60.0 fps, five runs of five. Three night rows at 4× CPU
show one or two 33–50 ms frames (p95 16.8). A desktop GPU's numbers — the tiers are the phone's margin: the owner's iPhone, `?fps=1`
(the rooftop's full-resolution panorama + the day's water are the new costs to watch there).

## THE FINAL RUN (the Beelink, this pass's OWN servers — `serve.mjs` on :5173, fresh emulators + `serve.mjs --emu` on :5174 — nothing else busy)
- unit `node --test tests/*.test.mjs`: **2,787 / 2,787** (was 2,779 — FREEFALL: engine 23 → 24 · play 10 → 15 · + `tests/daily-music.test.mjs` 2)
- `tests/integration/freefall-play.mjs`: **104 / 104** (Chromium; both looks) · `--perf`: the table above (17 / 18 in the full run, the row alone 60.0 fps)
- `tests/integration/freefall-lab.mjs`: **57 / 57** (F1's lab — its HUD line reads DARK 3 now)
- THE PAGES LOAD (`kit/page-loads.mjs` on :5174): **18 / 18** — the nine pages, Chromium + WebKit
- `tests/integration/daily-music.mjs` (the add-on, the real app on the emulators): **7 / 7**
- `node scripts/freefall-sim.mjs 2000`: F2's table to the digit, three times (after the hold, after the darkness, at the close)
- `/api` + the rules tests: not run — nothing under `/api` is wired, no rules-file change. No full e2e suite, no harbor group (the one
  app change — `js/app.js`'s music gates — has its own browser test; the boot budget is unraised: its comments were trimmed to fit).
- the servers this pass started are STOPPED at its end; the owner's :5190 preview server untouched.

## THE LOOK REVIEW (`node tests/integration/freefall-play.mjs "<chromium>" <out> --look` → `Downloads\NEON\freefall-f3\` — both looks, 390 × 844 @3 + 375 × 667 · 430 × 932 · 1440 × 900 · 844 × 390; looked at as contact sheets at phone size, the ball + the title as crops at full detail)
- **The palettes, first shots (night):** every area its own colour at once — the borders lean (floors 37–39 turn violet, 77–79 rose,
  117–119 teal, 157–159 indigo) and the floors under the border are already the next area's. THE SPEAKEASY's brass rims were washed
  white (the rim mixed 40 % white) → 22 %: brass. The ball was a blown-out white disc — its new rim + dot did not exist on screen (the
  core at 1.5 × white, the rim at 1.45 ×, the ball's own bloom added back over it) → the core 1.12, the rim a real pink, the unlit
  ball's bloom held down: the rim, the ring and the dot read at phone size.
- **The opening:** title-05 over the live tower matched the owner's check picture at the first shot at every size; the glint's core
  eased from 0.96 to 0.86 (the pink of the letters stays under the band).
- **The day look, first shots:** the scene stood at once (ice floors, the skyline, the walls, the water with its caustics + bubbles).
  Fixed: the pillar's brushing ran ROUND it and read as a screw's thread → fine upright streaks · the areas' tint was barely there →
  0.32 · the HUD had the night's dark fall over a bright sky → by day no fall: the number pink in a dark outline, the small words navy
  with a pale halo, white where the day's wall is dark.
- **Refine 2 (day):** THE BLAZE was a pale ghost on the sky (added light on a bright ground) → by day light COVERS, the flame thicker
  and a shade cooler: yellow heart, orange, pink smoke — read on the sky and on the water, and in greyscale · the opening's tagline lay
  on the city's roofs → the day skyline sits a little lower, the tagline on the sky · YOUR BEST was navy on THE OFFICES' dark window
  grid → white there · the number's outline one layer heavier (the fire passes behind it).
- **Refine 3 (day):** THE DARKNESS by day in three areas (slate over the rooftop, the lights out in the speakeasy, the murk under the
  water — the ball + its floor bright in each); navy ink on the closed-in slate was weak → light ink once the darkness is near.
- **The banners:** right at the first shot in both looks (the owner's mock: a pale band, navy words); the longest name fitted at 375
  wide and in the sideways column.
- **The add-ons' shots:** the panorama first came out UPSIDE DOWN and OVER the pillar + the ball (its flip; three.js draws a transparent
  mesh after the opaque ones) → its flip, an opaque-pass mesh · the day pastels were first 29 % saturated → deepened to the 35–55 %
  asked for (a unit test holds them there) · the darkness's faintest step sat on YOUR BEST → 80 % of the edge above the screen at
  3 floors · at night the steps did not read on the dark top → a live violet line along the edge's foot · the day panorama's smear
  fix took three tries (a per-row median drew lines beside the clouds, a fitted gradient drew a block; the sky-only blur across is
  clean).

## THE CALLS MADE (obvious / established pattern — named, the owner may overrule)
- **A hold steps the run THROUGH its own tick** (a landing due at the hold's tick lands, then the run is held) — the only reading in
  which "a hold never cancels a landing" holds for every tick; a hold that ends the run this way is refused (no entry).
- **THE BANNER sits at the FOOT of the screen** (the owner's three-panel mock; ff-day.png has it between the number and the tower —
  there it would lie on the announcer's lane + the ball's bounce). **F2's small area name under the number is REMOVED** (the prompt:
  "if the banner replaces it"). THE BOTTOM's band (200) is followed by THE TRENCH's (201) after it; a later lap says LAP n · FLOOR m;
  a lap's band has no sound (the engine names an area once — `sounds.js` is untouched).
- **The opening's foot loses "THE ROOFTOP · FLOOR 0"** (F3's opening lists the hint + DRAG TO SPIN only; the banners name the areas).
- **The test page has NO look switch on screen** (the prompt: the shared switch + `?look=`): AUTO by the phone's clock, then the site's
  sun rule. F4's cartridge reads the console's GAME LOOK.
- **The pillar by day is procedural steel** (no texture: HIGH RISE's env-day.png was offered, not needed).
- **Indoors (THE OFFICES, THE SPEAKEASY) THE DARKNESS by day = the lights going out** (the owner named the storm cloud for the rooftop
  + the murk under the water); the warning's words stay THE LIGHTS ARE GOING OUT in both looks (the end's words are the rules').
- **By day the fire COVERS and is a shade cooler** — the same ramp, the same sprites; "THE BLAZE's fire unchanged" is the night's.
- **The day skyline sits 5° lower than the night's** (the tagline's white caps lie on the sky).
- **THE TRENCH's palettes:** the deep's dark body, the rim turning a lap (ultraviolet · electric blue · magenta · mint).
- **The end card + the hold's scrim stay dark in both looks** (HIGH RISE's way: the neon header needs a dark ground).
- **THE ADD-ON keeps the host's duty to the room's music queue** while the host plays a daily (the entry's sketch passed `false` as
  the lobby flag in the tick: the others would have lost the room's song).

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules-file change; nothing registered).
2. **YOUR PHONE CHECK:** https://neonspeakeasy.com/freefall-play — AUTO takes your phone's day or night; `?look=day` / `?look=night` pin
   one. THE OPENING (the title, the glint every 7 s, the new rooftop panorama — do the windows read as windows on your iPhone?), the
   first drag; `?look=day&floor=0` / `40` / `80` / `120` / `160`: the five coloured towers; `?look=night&floor=45` / `125` / `165`: the
   night walls v2; `?floor=38` · `78` · `118` · `158` · `198` · `239`: the borders + their banners; **stop moving**: the dark edge comes
   down in three steps with the rumble, 6 s; **lock the phone mid-run**: PAUSED, 3 · 2 · 1, the ball goes on from where it hung.
   `?fps=1` for your iPhone's frame rate (the 60 fps here is the mini PC's — the rooftop's full-resolution panorama + the day's water
   are the new costs).
3. **THE PRESSURE — the feel is yours:** 6 s for a stopped ball (JAYWALK: ~8 s). No bot is ever caught — SLOPPY's longest stay on a
   floor is 5.1 s of the 6: a real beginner who dithers WILL be caught. If that is too hard, ease `pace` (120 → 135 = 6.75 s); `lead`
   stays 3. The rumble's level + the edge's weight at 3 floors (always on screen now) are one number each.
4. **THE DAY COLOURS:** 40 % saturation pastels (your 35–55 %); the rooftop is an orchid pink-lavender. Say if any tower should be
   lighter / deeper — one hex an area in `palettes.js`.
5. **The banner's place:** the foot of the screen (your three-panel mock; ff-day.png has it under the number). The reviewer notes it
   covers the 3rd–4th floors below the ball for 1.6 s in a dive — thinner / more see-through / under the number: yours.
6. **THE HOLD:** the dodge is gone (proved); the reviewer's remaining note: PAUSED still shows the tower mid-flight for as long as you
   like (3 a run) — an opaque plate while held would close that. Yours.
7. **THE FIRE by day** covers and is a shade cooler than the night's (added light vanished on the bright sky). Say if you want it hotter.
8. **THE DEEP's night wall** repeats twice round the shaft (the others four times): softer but no lattice. Three is the middle.
9. **TWO SONGS AT ONCE** (your 9:25 am entry) ships with this pass's push: check it on your iPhone — city music → THE DAILIES → a
   daily → one song; also from a room's lobby (that case was not run in a browser here).
10. **Named calls, yours to overrule:** a hold steps the run through its own tick · the test page has no look switch (AUTO, `?look=`) ·
    F2's area name under the number + the opening's THE ROOFTOP · FLOOR 0 line are gone · the pillar by day is procedural steel ·
    indoors the day's darkness = the lights going out · the end card + PAUSED stay dark by day · the panorama is ONE 3072 file a look
    (no 2048 copy: its mipmaps serve the lower tiers) · JAYWALK's skyline is no longer used.
11. **For F3B / F4:** THE BREAKTHROUGHS + THE BOTTOM's finish (F3B); the cartridge hands the console's GAME LOOK to the stage, SHARE,
    YOUR TABLE, the judge wired, a held run's legs on the server's clock (F4).
