# FREEFALL — F3B: THE ROOF BELOW + THE COLOUR FIXES + THE BREAKTHROUGHS (Nov 26 2026 — on the Beelink)

The owner's decisions: `docs/games/plan.md` "FREEFALL — F3B (approved Nov 26)". The game's page: `docs/freefall.md`. Built on F3 (the
unlisted test page **https://neonspeakeasy.com/freefall-play** — **NOTHING COUNTS UNTIL GO-LIVE**). **Nothing is registered** — no GAMES
entry, no `config.js` / meta / boot / cartridge change, no `/api` wiring, **no rules-file change (nothing to re-publish)**. THE BOTTOM's
finish for the match / the daily is only PREPARED here (the moment + its hook): F4 wires it.

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | f5fb8188 | the owner's F3B decisions in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 226 marks, **no open FIX** (its date line only); the inbox: no entry for this pass (read at the start, after each group, before the final tests) |
| 1 — THE ASSETS | d46dfdd3 | `scripts/build-freefall-assets.py --only=roof,break,sfx`: the roof paintings + the city tile cut from their borders (606 KB), the water's normal map + the sand + the sprite atlas (213 KB), the three sounds (131 KB) — ≈ 950 KB; the credits |
| 0 + 2 + 3 + 4 — THE SCENE | 4f9a6981 | THE DARKNESS EASES WITH DEPTH (the rules + their tests + the sims) · the colour fixes + THE COLOUR RULE · THE ROOF BELOW · the banner under the number · PAUSED's cover · THE STUTTERS · THE SKYLIGHT · THE SPLASHDOWN · THE BOTTOM + the finish's hook (one commit: they share the scene's files) |
| THE LOOK REVIEW + TWO SONGS | dc7aee76 | the look review's refines, the docs, the room-lobby case of TWO SONGS run in a browser (12 / 12) |
| THE ADD-ON (the inbox, 12:42 pm — to any pass) | 762bf844 | RAW ART OFF GIT: `NS_ART_SRC` (`scripts/art-src.mjs` + `scripts/art_src.py`), the bake tool + the three games' asset builders wired, the guard in `tests/repo-growth.test.mjs`, ONE line in CLAUDE.md, `docs/harbor.md` — marked done in the inbox |
| THE FRESH-EYES REVIEW's FIXES | f5972a5a | THE TRENCH's MOUTH (solo: the floor under the ball always in sight), THE FINISH's pose + stump + rocks + fireworks, round dust, the water by day + by night, the deck, the band's timing, the call under a band, the hand-on at `made` — the table below |
| THE CLOSE | (this pass's last commit) | the final run, this log, the inbox's OPEN FOR BEN |

## THE DARKNESS EASES WITH DEPTH (the rules — the only rules change of the pass)
`tuning.js#darkPaceAt(R, floor)` — pure, integers: a floor every **120** ticks down to floor 100 (EXACTLY F3's: 6 s stopped), a straight
line over floors 100–160, **160** ticks from floor 160 on (**8 s stopped** — THE DEEP + THE TRENCH). The engine reads it by the BALL's
floor wherever it sets the darkness's next step (a catch-up at a fall, a step down). The judge replays it (the same code); nothing was
ever recorded: **no new rule-set row**. The layout does not read the darkness: floors 0–199 are bit-identical (the tower's pinned
digest unmoved).

**THE PROOF** — `tests/freefall-engine.test.mjs` (25): the pace at every depth (120 · 121 at 102 · 130 at 115 · 140 at 130 · 150 at 145
· 159 at 159 · 160 from 160; never below F3's, never above 160, never falling); a ball that stops on floors 60 · 100 · 130 · 150 ·
160 · 205 · 262 is out EXACTLY lead × the pace at its floor after it got there — on the live engine AND the judge's replay; a row
without the ease keeps one pace. `tests/freefall-sim.test.mjs` (9): no bot out in the dark from floor 100 down, no stay uses its stall
budget; a great bot that plays to a depth and lets go is caught 6 s (≤ floor 100) … 8 s (≥ 160) after its last floor; **the pinned run
digests (F1's, tick for tick) are unmoved**.

**THE SIMS, 2,000 seeds** (`node scripts/freefall-sim.mjs 2000`): **F2's table to the digit** (SLOPPY 62 (40–94) · GOOD 136 (88–160) ·
GREAT 200 in a match at 2:30, 76.2 % home · the human 149 · the staller 2,000 of 2,000 at 9.0 s) + the new table by depth:

| bot | runs past floor 100 · 160 | the longest stay on a floor from 100 down · from 160 down | out in the dark from floor 100 down | the most of its stall budget any stay used |
| --- | --- | --- | --- | --- |
| SLOPPY | 143 · 0 | 3.9 s · — | 0 | **85 %** (its 5.1 s of the 6 on a shallow floor) |
| GOOD | 1,697 · 220 | 2.7 s · 2.1 s | 0 | 45 % |
| GREAT (solo) | 1,987 · 1,849 | 2.1 s · 2.1 s | 0 | 35 % |
| HUMAN-PACED | 1,806 · 678 | 2.1 s · 2.1 s | 0 | 35 % |

GOOD + GREAT are never caught by the dark at any depth; a stopped ball always is (6.00 s at floor 0 + 100 · 6.50 at 115 · 7.00 at 130
· 7.50 at 145 · 8.00 at 160 + 240). SLOPPY's deep numbers: it rarely gets deep (143 of 2,000 past floor 100, none past 160); where it
does its longest stay is 3.9 s of the 6–7 it has.

## WHAT WAS BUILT (the detail: `docs/freefall.md` — "THE ROOF BELOW" · "THE BREAKTHROUGHS" · "THE STUTTERS" · "THE AREA PALETTES" · "THE ARRIVAL BANNERS")
- **THE ROOF BELOW:** the building's own roof + the city round it under the panorama's foot, on ONE plane all the way down — far below
  and leaning toward you at first (the skylight straight under the tower on the screen), rising floor by floor (the screen's width shows
  0.92 of the painting on the title screen → 0.4 by floor 34), then settling by floor 38.6 into the true roof (level, the skylight's
  real size + height). The 3D skylight rides the same plane from the title screen on: sharp at every distance, and exactly where the
  ball hits it. No fog wash: only a light distance haze far out. No floor + no pillar under the roof until it is open.
- **THE COLOUR FIXES:** THE SPEAKEASY brass gold in both looks (the owner's day hexes), the white tape with a dark edge on gold floors,
  the day harbor pearl + bright cyan rims + cyan seams + only a faint caustic shimmer on the slices, the day offices lighter + whiter.
  **THE COLOUR RULE** is a unit test (by day ≥ 60° from red, red the darkest + most saturated thing on a day floor; by night 25°).
- **THE BANNER** under the big number, above the ball's highest point; THE BOTTOM's is GOLD ("YOU HIT THE BOTTOM"); a call waits while
  a band is up. **PAUSED:** a dark, blurred cover over the tower.
- **THE BREAKTHROUGHS** (a view only — the rules never change, the clock never stops): **THE SKYLIGHT** (cracks drawn in code along
  the pane's own break lines, 60 real glass shards, the glazing bars in pieces, a flash + a kick, the room's lights coming on floor by
  floor; by night the neon tubes short: sparks, the tubes flickering out round the frame) · **THE SPLASHDOWN** (a normal-mapped water
  plane mirroring the wall, the rings + the ball; the crown, the ring wave, bubbles; the waterline sweeps up the screen, the mix
  muffled, the shafts fade in; by night cyan plankton) · **THE BOTTOM** (a real seabed + rocks; the shockwave ring, the dust, the
  gold band, by night glowing sediment; SOLO: it cracks open into THE TRENCH; MATCH + DAILY: the finish — the last drop is the view's,
  by night a firework-style burst + `fireworks.mp3` softly; `onFinish` hands the run on once AT THE `made` EVENT; the card waits 2.6 s).
  After the fresh-eyes review: **SOLO's bed has THE TRENCH's MOUTH** (the floor under the ball is always in sight), a finish has
  its own camera pose, the core's stump + rocks in front of the ball, the fireworks round the ball.
- **THE STUTTERS:** every picture (12) + every band (7) ready behind the opening; an arrival touches no DOM; the breakthroughs'
  programs built in the warm frame; THE HITCH LOG names what landed before a long frame.

## THE LOOK REVIEW (`node tests/integration/freefall-play.mjs "<chromium>" <out> --look` → `Downloads\NEON\freefall-f3b\` — both looks; `f3b-<look>-<nn>-<name>.png`: the roof below at the title + floors 0 / 15 / 30 / 39 at 390 × 844 @3 · 375 × 667 · 430 × 932, each breakthrough mid-play at four sizes, each area's floor beside a red slice + its greyscale, every area, the darkness, PAUSED; looked at as contact sheets at phone size)
- **THE ROOF BELOW, first shots:** the roof far below with its neon parapet, the city round it running up to the panorama, stood at once
  on the title screen (both looks) and rose as asked (floor 3: city in the margins · 15: the parapet + the deck's things · 30: the
  skylight big behind the tower). **Refine 1:** by floor 37 TWO skylights showed (the painted one behind the tower, the real 3D one coming
  up from under the screen in true perspective) → ONE PLANE ALL THE WAY DOWN: the 3D skylight rides the painted roof from the title
  screen on and the whole plane settles into the true roof by floor 38.6. **Refine 2:** the floors + the pillar under the roof showed
  through it before the break → nothing under the shut roof is drawn; the deck this close was soft (the painting was made at 1024) →
  its own procedural detail (grain, mottle, the sheets' seams) comes in with the distance. **Refine 3:** the mirrored city tile stood
  beside its own mirror image (a butterfly of blocks by day) → a second, turned reading of the tile takes over in soft patches.
- **THE SKYLIGHT:** the cracks + the shards read as glass at the first shot; the glazing bars fell as two full-width rods → each bar
  in three lengths; by day the glass dust was a white cloud over the ring → far fainter.
- **THE SPLASHDOWN:** the water read at once (gold streaks of the speakeasy's lamps + rings by night, the brick's reflection by day);
  the reflection of the rings + the ball blew out to a white patch → toned down; the crown's foam was a cotton ball → a low ring of mist.
- **THE BOTTOM:** the seabed, the ring of light, the gold band, the crack-open stood at once. Fixed: the flying pieces looked like
  GLASS (near-black undersides with glowing edges; fast tumbling) → sand-topped rock with a solid underside, a slow tumble, thrown DOWN
  into the trench, the bed's own light staying on the bed; the dust was a WHITE cloud (half-added light on a bright ground) → clouds
  COVER, sand-coloured; the boulders were faceted dark polyhedra → round, sand on their tops; the gold band was pale-on-pale by day →
  the gold band's own dark ground in both looks; the firework's stars were too small to see → larger, brighter, beside the ball
  instead of behind the number; the night bed was evenly lit → darker away from the tower's pool of light.
- **THE COLOURS:** THE SPEAKEASY's gold reads clearly apart from red by night + by day (the greyscale shots: red = the dark chevroned
  slices); the white tape with its dark edge reads on the gold floors; the day harbor's pearl + cyan rims match the owner's ff-day.png;
  the day offices stand off their blue glass wall.
- **THE BANNER:** under the number at the first shot; its foot sat 5 px over the ball's highest point → slimmer (43 px at 390 wide:
  129 … 172, the apex 176); a sideways phone (a 234 px column) has only 17 px between the number and the ball → ONE line there.
- **PAUSED:** the tower can not be read under the cover; the count + PAUSES LEFT are sharp.

## THE CALLS MADE (obvious / established pattern — named, the owner may overrule)
- **THE SPEAKEASY's day gold is the ONE exception to the 60° rule:** your hexes (#f0d590 · #e0a83a) are 51° + 48° of hue from red (352);
  brass can not be 60° away and stay brass (at 60° it is lemon). The hexes are kept; the unit test holds gold ≥ 45° and everything else
  ≥ 60° (the rooftop's day lavender + two rims moved 2–12° to pass).
- **THE ROOF BELOW is ONE plane that changes its place** (far + leaning → the true roof by floor 38.6) — a top-down painting can not be
  seen straight below a camera that looks 33° down; it stops rising at 0.4 of the painting a screen width (≈ 2½ screen pixels a source
  texel at 3× — to floor 34) and only the last 5 floors bring it closer (≈ 4 pixels a texel at floors 36 – 39: soft by day — the
  reviewer's find 7; OPEN FOR BEN 5) — where the screen is mostly the sharp 3D skylight + the deck's own detail.
- **The breakthrough's own sound REPLACES the arrival's jingle** on floors 40 · 120 · 200 (two big sounds at once fought); bottom.mp3
  now plays in SOLO too (the ball hits the seabed there as well); the firework is a night FINISH's alone.
- **"YOU HIT THE BOTTOM" is THE BOTTOM's own band, in gold** (baked, like every band — never a second text over the announcer's lane);
  it comes with the impact. A call (BLAZE! · SMASH! · NEW BEST) that falls on a band waits for it to leave; one that is already UP
  when a band arrives is taken down and said again after it (if its moment is not long gone).
- **By night the harbor has light shafts too** (teal + pink — the speakeasy's neon through the surface): the brief's "then the light
  shafts fade in" had no night half.
- **A finish draws no floor 200** (the seabed is the floor: the ball's last drop could otherwise end on a red slice). In SOLO floor 200
  is the rules' own floor — the ball can bounce on it, fall through it, or hit its red; the bed cracks open when the ball leaves it.
- **SOLO's seabed has THE TRENCH's MOUTH** (the fresh-eyes review's HIGH find — a fairness call of the VIEW, no rule touched): a whole
  bed hid the floor the ball lands on next. The alternative that keeps a whole bed is a RULE (floor 201 safe straight below floor
  200's gaps — a new rule-set row): the owner's call, OPEN FOR BEN 3.
- **Loudness by gain:** skylight + splashdown are byte copies, matched in `sounds.js` (+ 7.4 / + 7.7 dB) — no MP3 encoder here.
- **Not shipped:** `glass-cracks.png` (the coded cracks never needed the fallback), the sand's roughness map, the -backup sounds. **The
  site's Credits sheet** gets its FREEFALL group at go-live (as HIGH RISE's did); every source is CC0 — the two CREDITS.md name them.
- **A ghost's echo at a breakthrough is F4's** (there are no ghosts yet). **PAUSED's cover hides the big number too.**
- **Every picture of a look is in memory at once now** (12; ≈ 70 MB on the GPU — their decoded bitmaps are let go once uploaded): the
  price of no upload in a run.
- The checks' auto-player ('play') no longer turns across red (it stopped runs short of the floor a check was sent to).

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — read-only: the code, the shots as contact sheets, its own probes on the real engine; commit f5972a5a holds the fixes)
**Verified sound (its own probes):** `darkPaceAt` whole, never falling, 120 … 160 on floors −5 … 2000 · **2,400 runs (300 seeds × 4 bots ×
solo + match) tick-identical to F3** (142c2038), none out in the dark on either · a ball that stops: 2,915 let-go runs on floors 0 – 300 —
2,469 out exactly lead × the pace at their floor after arriving, 0 later, live == the judge 2,915 / 2,915 · holds placed on the
darkness's own step ticks: 363 / 363 equal · 600 hostile live-like runs: live == the judge 600 / 600 · the view never writes the run,
no rules file imports a view file · no per-frame allocation found · nothing registered. **The look, fine as built:** the title + floors
0 / 15 / 30 in both looks (as finished as the speakeasy / the harbor / the deep; no fog wash; no seam), THE SKYLIGHT (the best of the
three), THE COLOUR RULE (red the danger colour everywhere, gold + pearl included; the greyscale holds), the banner, PAUSED.

| # | severity | the find | what was done |
| --- | --- | --- | --- |
| 1 | HIGH | SOLO: the whole seabed hid floor 201 while the ball stood on floor 200 and through the fall onto it — its probe: 49.6 % (GREAT) / 50.0 % (HUMAN) of those landings on red blind, against 0.0 % / 2.6 % with sight | **FIXED — THE TRENCH's MOUTH:** the bed is open round the tower's foot + along the cleft toward the viewer; the dust rises off the shelves; no rock in the mouth; a browser check + a unit pin. A finish's bed stays whole |
| 2 | medium | the dust clouds showed their quads' straight edges | **FIXED:** every sprite fades out round in its shader |
| 3 | medium | THE FINISH the weakest moment: no tower, 60 % of the screen empty sand, the fireworks at the number's height + off the sides, the burst's heart a dark spiky disc | **FIXED:** its own camera pose, the core's stump, five rocks in front, the fireworks round the ball (a ball of stars about 1 across, a glint at the heart). Still the simplest of the three by day (no firework by the spec) — OPEN FOR BEN 9 |
| 4 | medium | a call already UP when a band arrives lay under it (SMASH! + THE OFFICES) | **FIXED:** it is taken down, said again after the band |
| 5 | medium | THE BOTTOM's gold band (a 300 ms wall timer) could come ≈ 1.9 s late, behind THE TRENCH's, when the ball fell straight through floor 200 | **FIXED:** the wait is the frame's (`bedDue`, never while held); a ball already past it: THE BOTTOM's band first |
| 6 | medium | the water: by day a near-black slate with blotches; by night posterized, a blown-out white lump | **FIXED (day):** a light sunlit surface. **IMPROVED (night):** the mirror images capped in linear light (no white shore / lump), far ripples flatter, softer ring edges — still a stylised mirror |
| 7 | medium | the roof painting is the softest thing in the game at floors 36 – 39 by day (≈ 4 px a texel); the added grain a pixel mosaic | **PARTLY:** smooth grain; the docs' "≈ 2½ px" corrected (true to floor 34). A painting made at 2048 ends it — OPEN FOR BEN 5 |
| 8 | medium for F4 | `onFinish` fired only with the card, 2.6 s after `made`, never while hidden | **FIXED:** handed on at the `made` event (the frame, or the hide that steps into it); the card only adds the page's two checks |
| 9 | low | after the break the deck stayed as a flat band over the offices for ~5 floors; a 0.2 s cross-fade ghost of the tower through the roof | **FIXED** (the deck fades with the break) · the 0.2 s cross-fade: named, kept (a hard cut read worse) |
| 10 | low | the perspective cheat shows at floors 25 – 36 (the skylight behind the top floor while the tower runs on down past it) | named — the ONE-plane call (THE CALLS MADE); "reads fine at a glance" |
| 11 | low | reduced motion: the firework's sound without the firework; shards + the waterline not reduced | **FIXED** (no sound) · shards + the waterline: named (they are the moment itself; the counts + the kick are reduced) |
| 12 | low | wall-clock pieces vs the run clock: a hold within 0.3 s of a breakthrough plays its sound / the muffle before the picture; PLAY AGAIN does not stop a firework's tail | the band: **FIXED** (never while held) · the sounds: named (a 0.3 s window; a sound already started is not pulled back) |
| 13 | low | F3's parts: night darkness steps 3 + 2 nearly alike; by day the step-3 edge a pale stripe through the big number's foot; the warning plate over the ball at the top of its bounce; day BLAZE! faint on the flame | **not touched** (the owner approved F3's darkness) — OPEN FOR BEN 8 |
| 14 | low | the rumble stayed silent after the page was hidden until the darkness's next step | **FIXED** |
| 15 | nit | a lost context rebuilt after a finish replays the last drop behind the end card | named |
| 16 | nit | `?floor=200` in solo: no hit, the bed goes without a crack | named (a test-page start; 39 / 40 / 119 / 120 / 199 / 201 behave) |
| 17 | nit | a what-if row with `paceDeep` but no ease floors gave NaN | **FIXED** + a test |
| 18 | nit | "floors 0–99 unchanged": the first floor whose pace moves is 102; "≈ 2½ px" | **FIXED** in docs/freefall.md (plan.md is the owner's wording, left) |

**It could not check:** motion (stills only), any sound or loudness, a real iPhone, reduced motion + tier 0 on screen.

## THE MEASURE (the mini PC, headless Chromium, 390 × 844; after the review's fixes — `freefall-play.mjs --perf` 46 rows + `--stutters`)
**Every area + every breakthrough holds 60 fps on every tier, both looks, at 1× and 4× CPU** — 45 of 46 rows; the one red row is the
build machine's own stall (below), not the game.

| what | look | tier 2 at 1× | tier 2 at 4× | tier 0 at 1× | tier 0 at 4× |
| --- | --- | --- | --- | --- | --- |
| THE SKYLIGHT (through it, floor 36 → 44) | night | 60.1 fps · worst 17.9 ms | 60.0 · 16.9 | 60.0 · 17.5 | 60.1 · 16.9 |
| | day | 59.9 · 17.9 | 60.0 · 16.9 | 60.1 · 17.7 | 60.0 · 16.9 |
| THE SPLASHDOWN (116 → 124) | night | 59.9 · 17.8 | 59.9 · 16.9 | 60.0 · 17.8 | 60.1 · 16.9 |
| | day | 60.0 · 17.6 | 60.0 · 16.9 | 60.1 · 17.8 | 60.0 · 16.9 |
| THE BOTTOM, solo: the crack (196 → 204) | night | 59.9 · 17.7 | 59.9 · 16.9 | 60.1 · 18.0 | 60.0 · 16.9 |
| | day | 60.0 · 18.1 | 60.1 · 16.9 | 60.0 · 18.0 | 60.0 · 16.9 |
| THE BOTTOM, a finish + the firework | night | 60.0 · 17.7 | 58.9 · 83.3 † | 60.0 · 17.6 | 58.8 · 83.3 † |

(the areas' own rows — the rooftop … the deep, tiers 2 / 1 / 0: 59.9 – 60.1 fps, worst 16.9 – 18.1 ms.)
† the END CARD's own frame at 4× CPU (the page's determinism check replays the whole run behind the card — after the run, once; the
same before the review's fixes). A breakthrough's row STARTS four floors above it (`?floor=36`): at 4× CPU the first sound of such a
cold start costs one 33 – 67 ms frame (`snd`) and its band one 33 ms frame (`dom`) — named by THE HITCH LOG; a run from the roof has
them warm (the whole-run measure below: none).

**THE STUTTERS — a whole run, the roof to the trench (floor 212), at 4× CPU** (target: worst ≤ 25 ms, HITCH ≤ 2 a run, both looks):

| look | area | frames | worst ms | frames over 25 ms |
| --- | --- | --- | --- | --- |
| night | THE ROOFTOP · THE OFFICES · THE SPEAKEASY · THE DEEP · THE TRENCH | 2,087 · 2,160 · 2,160 · 2,214 · 595 | 16.9 each | 0 |
| night | UNDER THE HARBOR | 2,157 | 666.6 § | 1 § |
| day | THE ROOFTOP · THE OFFICES · THE SPEAKEASY · UNDER THE HARBOR · THE TRENCH | 2,084 · 2,160 · 2,160 · 2,160 · 597 | 16.9 each | 0 |
| day | THE DEEP | 2,214 | 17.7 | 0 |

**HITCH: night 1 §, day 0 — no picture landed in a run (12 ready behind the opening), no band baked in a run.** § THE BUILD MACHINE's
OWN STALL: headless Chromium on the Beelink stops once for 0.25 – 0.65 s two minutes after it starts (a known quirk of this machine —
it lands at the same wall-clock moment in every run: floor ≈ 129 of the night run, and the speed test's one red row "day · THE
SPEAKEASY · tier 1 at 4×: worst 250 ms", p95 16.8); it is not a frame of the game — the day run has none. **Where the hitches were
(found + ended in this pass):** a band's first paint at every arrival (33 ms; 150 ms at floor 40) → every band a kept, painted node ·
a wall / sky / roof picture uploaded in a run → all 12 asked for behind the opening, each bitmap let go once uploaded · the
breakthroughs' shader programs → built in THE WARM FRAME · the darkness's side layer → its own layer.

## THE FINAL RUN (local, the mini PC, nothing else busy; this pass's own emulators + servers — started fresh, STOPPED at the end; the owner's :5190 untouched)
- `node --test tests/*.test.mjs`: **2,791 / 2,791**.
- `tests/integration/freefall-play.mjs`: **134 / 134** (F3B's own 29 — + the mouth open in solo / whole in a finish, the hand-on there
  before the card); `--look`: every scene re-shot into `Downloads\NEON\freefall-f3b\` (299 files), looked at as contact sheets.
- `--perf`: 45 / 46 (the one red row = the machine's stall, above) · `--stutters`: 2 / 2.
- `tests/integration/freefall-lab.mjs`: **57 / 57** · THE PAGES LOAD (`kit/page-loads.mjs`, Chromium + WebKit, on the emulators): **18 / 18**
  (/freefall-play + /freefall-lab among them).
- `node scripts/freefall-sim.mjs 2000`: F2's table to the digit (solo: sloppy 62 · good 136 · great 245 · human 149 floors median; a
  match made by 76.2 % of GREAT, 3.0 % of HUMAN); nobody out in the dark from floor 100 down; the staller 9.0 s; a stopped ball 6.00 s
  to floor 100 · 6.50 · 7.00 · 7.50 · 8.00 s from 160.
- TWO SONGS from a ROOM LOBBY in a browser, on the emulators (`E2E_BASE=http://localhost:5174 node daily-music.mjs`): **12 / 12**.
- No `/api` tests (no `/api` change), no rules test (no rules-file change). One false red on the way: the night splashdown check read
  the water plane one frame after its sweep ended — the plane's flag is now asked after the sweep's own step (29 / 29, three runs).

## OPEN FOR BEN
1. **RE-PUBLISH: nothing.** No rules-file change, no `/api` change, nothing registered, `playable` untouched.
2. **Phone-check (the page is live after the deploy):** THE ROOF BELOW — https://neonspeakeasy.com/freefall-play (the title + floors
   0 – 39) · THE SKYLIGHT `?floor=38` · THE SPLASHDOWN `?floor=118` · THE BOTTOM in solo `?floor=198` · THE FINISH
   `?floor=198&mode=match` · add `&look=day` for the day look · `&fps=1` names what landed before a long frame.
3. **SOLO's seabed has a MOUTH (new — the reviewer's fairness find):** a whole seabed hid the floor you land on after floor 200 (half
   of those blind landings ended on red). The bed is now a shelf of sand with THE TRENCH the tower stands in — the next floor is always
   in sight; the sand still cracks open when you leave floor 200. If you would rather hit a WHOLE seabed in solo, the fair way is a RULE
   (floor 201 always safe straight under floor 200's gaps — a new rule-set row + its sims): say so and F4 builds it. A match / daily
   finish keeps the whole bed.
4. **THE SPEAKEASY's day gold is the ONE exception to the 60° rule** — your hexes (#f0d590 · #e0a83a) are 51° + 48° from red; brass can
   not be 60° away and stay brass. Kept as given; say if you want the rule or the hexes to win.
5. **THE ROOF is soft at floors 36 – 39 by day** (the paintings were made at 1024; ≈ 4 screen pixels a texel there). A re-make at a
   true 2048 (same file names, into `Downloads\NEON\art-src\freefall\`) ends it — one builder run.
6. **A breakthrough's own sound REPLACES the arrival jingle** on floors 40 · 120 · 200; `bottom.mp3` plays in SOLO too. Loudness was
   matched by gain (no MP3 encoder on the mini PC) — not judged by ear: listen once.
7. **By night the harbor has light shafts too** (teal + pink — the speakeasy's neon through the surface); the brief named only the day's.
8. **F3's darkness, the reviewer's look notes (NOT touched — you approved it):** by night steps 3 and 2 look nearly alike on the
   rooftop / the speakeasy / the harbor · by day the step-3 edge is a pale stripe through the big number's foot · the warning plate
   covers the top of the ball at the top of its bounce · day "BLAZE!" is faint on the flame. Say which, if any, to change.
9. **THE FINISH by day has no firework** (your spec: night finishes only) — it is the impact + the gold band + the core's stump. Want a
   day celebration of its own (a burst of bubbles / a shower of light)?
10. **The speed + stutter numbers are the mini PC's** (4× CPU throttle) — the real iPhone is yours to feel; `&fps=1` shows the worst
    frame + its cause.
11. **Memory:** every picture of a look is on the GPU at once now (12, ≈ 70 MB) — the price of no upload hitch in a run. If an older
    iPhone loses the page (THE LOST CONTEXT rebuilds it), say so: the walls can load by area again.
12. **THE CHANDELIER** stays skipped, as decided. **A rival's echo at a breakthrough** is F4's (no ghosts yet).
13. **THE ADD-ON built in this pass (the inbox, 12:42 pm):** RAW ART OFF GIT — new models / masters go to
    `Downloads\NEON\art-src\<game>\`, never into `art/` (the games' next passes: JAYWALK / HIGH RISE / FREEFALL).
