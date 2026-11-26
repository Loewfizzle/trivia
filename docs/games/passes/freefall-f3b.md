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
| THE CLOSE | (this pass's last commit) | the look review's refines, the fresh-eyes review's fixes, the room-lobby case of TWO SONGS run in a browser, the docs, the final run |

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
  by night a firework-style burst + `fireworks.mp3` softly; the card waits 2.6 s; then `onFinish` hands the run on once).
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
  texel at 3×) and only the last 5 floors bring it closer — where the screen is mostly the sharp 3D skylight + the deck's own detail.
- **The breakthrough's own sound REPLACES the arrival's jingle** on floors 40 · 120 · 200 (two big sounds at once fought); bottom.mp3
  now plays in SOLO too (the ball hits the seabed there as well); the firework is a night FINISH's alone.
- **"YOU HIT THE BOTTOM" is THE BOTTOM's own band, in gold** (baked, like every band — never a second text over the announcer's lane);
  it comes with the impact. A call (BLAZE! · SMASH! · NEW BEST) that falls on a band waits for it to leave.
- **By night the harbor has light shafts too** (teal + pink — the speakeasy's neon through the surface): the brief's "then the light
  shafts fade in" had no night half.
- **A finish draws no floor 200** (the seabed is the floor: the ball's last drop could otherwise end on a red slice). In SOLO floor 200
  is the rules' own floor — the ball can bounce on it, fall through it, or hit its red; the bed cracks open when the ball leaves it.
- **Loudness by gain:** skylight + splashdown are byte copies, matched in `sounds.js` (+ 7.4 / + 7.7 dB) — no MP3 encoder here.
- **Not shipped:** `glass-cracks.png` (the coded cracks never needed the fallback), the sand's roughness map, the -backup sounds. **The
  site's Credits sheet** gets its FREEFALL group at go-live (as HIGH RISE's did); every source is CC0 — the two CREDITS.md name them.
- **A ghost's echo at a breakthrough is F4's** (there are no ghosts yet). **PAUSED's cover hides the big number too.**
- **Every picture of a look is in memory at once now** (12; ≈ 70 MB on the GPU — their decoded bitmaps are let go once uploaded): the
  price of no upload in a run.
- The checks' auto-player ('play') no longer turns across red (it stopped runs short of the floor a check was sent to).
