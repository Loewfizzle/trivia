# FREEFALL — F5A: THE LOOK POLISH (Nov 26 – 27 2026 — on the Beelink)

**NO RULES-FILE CHANGE — nothing to re-publish. LOOK ONLY:** no rule, no proof, no score changed (the 2,000-seed sims + the judge untouched).
**FREEFALL STAYS HIDDEN:** `playable` is false (a `preview` row — the owner's live test only); THE SWITCH is OFF — nothing counts.

The owner's decisions: `docs/games/plan.md` "FREEFALL — F5A (approved Nov 26)". The game's page: `docs/freefall.md` "F5A — THE LOOK
POLISH" (THE WATER · THE FINISH + THE DAY CELEBRATION · THE ROOF GRAIN · THE SHARE CARD's HERO FRAME · THE MARK · THE BILLBOARD · THE PAUSE
IN DAILIES). The shots: `Downloads\NEON\freefall-f5a\` (`look\` · `share\` · `mark\` · `billboard\`; `base\` = the look BEFORE the pass).

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | f612d807 | the owner's F5A decisions in `docs/games/plan.md` (the F5 split · F4B's OPEN FOR BEN answered · THE PAUSE IN DAILIES · THE WATER TARGET · the share frame · THE MARK = B · THE BILLBOARD = A); `lab-export.mjs https://www.neonspeakeasy.com`: 232 marks, **no open FIX** (its date line only); the inbox: no entry for this pass (read at the start, after each group's commit, before the final tests) |
| 1 — THE WATER SURFACE | 77a4b4d2 | worked out in its shader (the normal map + its asset gone): THE SWELL, the night's streaks (the wall's own column of light) + glints + plankton, the day's turquoise + lines + sparkles + foam; the surface opaque; the day crown's spray |
| 2 — THE FINISH + THE DAY CELEBRATION | 3a8360ae | the sand, the rocks + their shadows, the soft dust (a puff's depth = its near side's), the bubbles + the sun rays + the fireworks' sound by day |
| 3 — THE ROOF GRAIN | 512d5335 | a detail tile made in code, read alike by the roof below + the deck |
| 4 — THE SHARE CARD's HERO FRAME | eafad8c6 | the STAGED frame (the moment a beat before the end, replayed + drawn once more for the card alone), the dark edge from above, the gold ring |
| 5 — THE NEON MARK | 4ffc75ff | B · THROUGH THE FLOOR + the tile; the boot budget NOT raised; the per-game line 580 → 610 KB |
| 6 — THE BILLBOARD | 390e2f9a | A · THE LOGO: the painter, the builder, the face, the readability proof (not installed) |
| THE ADD-ON — THE DAY OFFICES FOG + the review's fixes | 3308e067 | the add-on (typed into the chat, Nov 26 — before the final tests: built as its own group): the day offices' haze a deeper blue, starting further down (`FOG_START`); the fresh-eyes review's finds (the table below) |
| the close | (this commit — the tagged push) | the docs, THE MEASURE, THE FINAL RUN |

## HOW EACH GROUP WAS JUDGED (the refine passes)
- **THE WATER:** shot BESIDE EACH TARGET at floor 119 (`look\beside-target-<look>-<size>.png` — the target's game area on the left, the
  game on the right; 390 × 844 @3 · 375 × 667 · 430 × 932), then `?floor=117` → the plunge. Seven refine passes: (1) the shader from
  nothing — streaks as wide slanted slabs, plankton as big flat discs, the floors below showing through at 0.97; (2) thinner streaks,
  tiny round plankton, the surface opaque, more day lines; (3) the streak's column read as a bell (mip 4.8) — too dim; (4) amber lifted
  — a rainbow fringe on it; (5) two clean inks; (6) the bell's 4th power = the streak's heart, ONE softness on every phone (the bias
  takes the screen's step out — measured offline: a lamp + a neon strip are each ≈ 0.1 high at mip 5, `col.py` in the scratchpad); (7)
  the violet deeper, the ball's pool + the night foam eased. **Left as it is:** the target's streaks widen a little toward the viewer
  (the game's stay thin); the day target's lines are a contour map — the owner asked for thinner + fewer.
- **THE FINISH:** frame by frame in the test browser's own SLOW MOTION (`window.__slowmo(0.1)` — the page's clock at a tenth: a
  screenshot at 3× takes a third of a second, the moment 0.3 s). Finds on the way: the dust piled up to WHITE (a veil added 0.3 and
  covered 0.5 → colour × cover now); the bubbles' heart was a white disc by day (a light covers by day — a small glint now); the sun rays
  were two wide bars (many thin shafts on a faint veil now); the sand's grains were square dots (round now).
- **THE SHARE CARD:** every cause, night + day, at 1080 × 1350 and 360 px (`share\`). Finds on the way: a white flash on the red slice
  whitened it (THE MARK's own light, red-hot, instead); a depth push on the ball's halo for the seabed hid the BALL (taken back — the
  halo's faint cut line on the sand stays: OPEN FOR BEN 6); the night gold frame's "lift" made it a white blob (not lifted now).
- **THE MARK:** `tests/integration/marks-preview.html?ff=1` (24 · 36 · 48 · 72 pt beside the playable games' marks; the tiles at 72 pt).
- **THE BILLBOARD:** the art at 2× + in the city at 390 × 844 (the proof's crop).
- **THE ADD-ON (THE DAY OFFICES FOG):** `lookog-beside-48-90-130.png` — `?look=day&floor=48 · 90 · 130` side by side at 390 × 844 @3: the
  floors' fade begins at the same height in all three (the offices' floors keep their periwinkle + their red's contrast down to the 4th –
  5th floor under the ball, as the speakeasy's gold + the harbor's pearl).

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — every group's shots at real phone size)
The reviewer's verdicts on the FIRST shots: the water PASS WITH NOTES (night ≈ 85 % of its target, day ≈ 70 %) · the finish FAIL (straight
cut edges + a day white-out; the sand + the rocks passed) · the roof grain PASS WITH NOTES · the share cards FAIL as a set (HIT THE RED
passed; the dark + the gold cards did not tell their story at 360 px) · the mark PASS WITH NOTES · the billboard PASS WITH NOTES. Every
high + most medium finds were fixed (commit 3308e067) and shot again (`review-fixes-sheet.png`, the re-shot `look\` + `share\`); the rest
is named.
| # | group | find | what was done |
| --- | --- | --- | --- |
| 1 | finish — **high** | the ball's glow sliced flat along a straight line by the sand (night) / a pink patch with straight edges (day); the same cut on the gold share card | **fixed** — a finish only: the halo fades out softly over the sand (`LIGHT_F uOnBed`); a first try (the halo's depth at its near side) hid the BALL and was taken back |
| 2 | finish — **high** | the fireworks' dots sliced into half-discs by the sand | **fixed** — a sprite's depth is its near side's + 0.14 |
| 3 | finish — **high** | day 1150 – 1400 ms: near-white lobed dust + the sun rays + the white pillar add up to a white-out | **fixed** — the day dust darker + thinner (colour × cover 0.25, cover 0.3), the rays at 0.3; the pillar's own day white stays (named: 10) |
| 4 | finish — medium | the sand ended in a ruler-straight line against the wall | **fixed** — the bed thins out toward the shaft's far wall (`farFade`), the rocks stand inside it |
| 5 | finish — medium | square patches of stipple round the tower's foot | **fixed** — the grains of light are gone (they sat on a grid) |
| 6 | finish — medium | the night fireworks = flat cream discs with a clipped core | **fixed** — small hot points (0.12 → 0.035, × 1.15) |
| 7 | finish — medium | the day sand olive grey-green | **fixed** — warmer (its water tint eased) |
| 8 | share — **high** | THE LIGHTS WENT OUT: a fully lit room, the dark only behind the title | **fixed** — the dark comes down to within half a ball of the ball + in from both sides (`share.js DARK`) |
| 9 | share — **high** | YOU HIT THE BOTTOM: no readable gold ring (day: grey-green mush · night: a white patch), RED shards the picture's main subject on the WIN card | **fixed** — the ring tight round the ball (355 ms), a deeper gold; the last floor's shards left out of that one picture; the halo's cut gone (1) |
| 10 | finish + share — low | the pillar's stub floats over the ball at the finish; by day it is clipped white | **named** — F3B's stump (the tower's core ends there); OPEN FOR BEN 6 |
| 11 | water (day) — medium | the lower third goes steel-blue · the ball's glow is a WHITE column · the ripple lines are hairline closed loops (scratches on glass) | **fixed** — turquoise to the near edge · a pink glow + streak · soft strokes 2 – 3 px wide, broken into arcs |
| 12 | water (night) — medium / low | short tilted lozenges near the disc's rim (the lower half is right) · a lavender patch under the tower · the streaks as bright near as far | **partly** — the streaks fade faster with distance, the pool + the ball's streak eased; the lean near the rim stays (the swell's own side-push — a smaller one flattens the dashes into bars): named |
| 13 | water — **high** (the plunge) | the crown: a clipped white core with hard white bars, the ball lost in it (F3B's) | **eased** — a third fewer drops, finer, under white; the crown itself is F3B's sprite set: named (OPEN FOR BEN 5) |
| 14 | water — medium (the plunge) | a dark wavy band at the foot of the day plunge frame | **not a fault** — THE WATERLINE sweeping up (the world under the surface below it: F3B) |
| 15 | roof — medium | at a third of the pixel size the grain hardly shows; the painting's own features (the stain, the pipes, the AC units) stay soft — "the grain cannot fix this" | **partly** — the coarser reading carries half now + the day strength up (1.15 → 1.45); a sharper PAINTING is the real fix: OPEN FOR BEN 4 (a Grok brief) |
| 16 | share (red, night) — medium | the red slice dull maroon; a lilac slice end behind the ball; one floor of context under the number | **named** — a white flash would whiten the slice (it must read RED); the angle is the run's own |
| 17 | mark — medium | it reads as "a flame on a ring over an underline", not THROUGH a gap (the floor sits under the ball, the gap wider than it) | **named** — it is the owner's sketch, scaled (the floor below the ball, the gap 1.45 × the ball): OPEN FOR BEN 3 |
| 18 | mark — low | the thin core flame not visible; the tile the emptiest of the four | **partly** — the core lighter + wider (w 3 → 4); the tile stays plain: the boot budget has 83 B (OPEN FOR BEN 2) |
| 19 | billboard — medium | the tower stood on a bounded top-down rooftop: a pasted screenshot; the flame cut by the board's top | **fixed** — a soft oval round the tower's own column (it melts into the city), the tower lower |
| 20 | everywhere — medium (older: in `base\` too) | a dark fuzzy smudge at a fixed screen spot (≈ x 194, y 150 pt) in every zone, showing through the day banner at the plunge | **named** — not this pass's (the wall layer's own): to F5B (the inbox) |
| 21 | finish (day) — medium (older) | a tan / orange slab with a hard slanted edge in the top-right corner at the finish camera (bigger at 375 × 667) | **named** — the deep's day wall at the finish pose (F3B's): to F5B (the inbox) |

## THE MEASURE (`freefall-play.mjs --perf` — the mini PC, 390 × 844 @3; fps · frame p95 / worst ms)
**60 fps at every tier at 1× and 4× CPU in both looks — the new water + both finishes in it** (62 rows; the first full run died when a
shader file was broken for a minute by an edit mid-run — run again whole after the review's fixes; the day finish's four rows were
added + run after it).
| where | look | tiers | 1× CPU | 4× CPU |
| --- | --- | --- | --- | --- |
| THE SPEAKEASY (the bot shattering, the fire on) | night | 2 · 1 · 0 | 60.0 · 60.0 · 60.0 fps (p95 ≤ 17.1 ms, worst ≤ 18.0) | 60.0 · 60.0 · 60.0 (p95 16.8, worst ≤ 17.0) |
| THE SPEAKEASY | day | 2 · 1 · 0 | 60.1 · 60.1 · 60.1 (p95 ≤ 17.0, worst ≤ 18.1) | 60.0 · **55.5 → 60.0 alone** · 60.0 (p95 16.8) |
| UNDER THE HARBOR (caustics, rays, bubbles) | day | 2 · 1 · 0 | 59.9 · 60.0 · 60.1 (p95 17.0, worst ≤ 18.0) | 60.0 · 60.0 · 60.0 (p95 16.8, worst ≤ 17.0) |
| **THE WATER SURFACE standing in the picture** (floor 119, 8 s) | night | 2 · 1 · 0 | 59.7 · 60.1 · 60.2 (p95 ≤ 17.1) | 59.5 · 59.5 · 59.6 (p95 16.8) |
| **THE WATER SURFACE** | day | 2 · 1 · 0 | 60.1 · 60.2 · 60.1 (p95 ≤ 17.0) | 59.5 · 59.6 · 59.5 (p95 16.8) |
| THE SKYLIGHT (through it) | night · day | 2 · 0 | 59.8 · 60.0 · 60.0 · 60.0 | 60.1 · 60.0 · 60.1 · 60.1 |
| THE SPLASHDOWN (through it — the surface + the plunge) | night · day | 2 · 0 | 60.0 · 60.0 · 60.1 · 60.0 (p95 ≤ 17.0, worst ≤ 17.9) | 60.0 · 60.0 · 60.1 · 60.0 (worst ≤ 16.9) |
| THE BOTTOM (solo: the crack) | night · day | 2 · 0 | 60.1 · 60.0 · 60.0 · 60.1 | 59.9 · 59.9 · 60.1 · 60.0 |
| **THE BOTTOM (a finish + the firework)** | night | 2 · 0 | 60.1 · 60.1 (p95 ≤ 17.1) | 59.0 · 59.2 (p95 16.8) |
| **THE BOTTOM (a finish + THE DAY CELEBRATION)** | day | 2 · 0 | 60.3 · 60.2 (p95 ≤ 17.0) | 59.2 · 58.9 (p95 16.8) |
- **The one red row** (day · THE SPEAKEASY · tier 1 · 4×: 55.5 fps, p95 16.8, ONE 250 ms frame) fell on the same row in both full runs —
  the 10th, two minutes into the test browser's life: this machine's known headless stall (it moves with the clock, not the scene). The
  row alone (`--one=day-84-1-4`): **60.0 fps, worst 16.9 ms.**
- **The standing water's ONE long frame:** seven of its twelve rows hold a single 83 – 100 ms frame (at 1× too — night tier 2) beside a
  p95 of 16.8 – 17.1 ms. NOT MEASURED which: the ball stands still for the 8 s, so THE DARKNESS's warning + its rumble start inside the
  window (a sound's first decode / the warning's first write are the likely one) — the water has no one-off work. The owner's phone
  (`?fps=1` names a long frame) is the check: OPEN FOR BEN 1.
- **The finishes at 4× CPU** (59.0 – 59.2 fps, p95 16.8): the hitch log NAMES two long frames in each — a sound's decode at floor 196
  (50 – 67 ms) + a DOM write at 197 (33 ms), older than this pass; the single worst frame (83 – 117 ms) is not named by the log.
- **ZERO GARBAGE** in the frame functions: the static scan (`tests/freefall-play.test.mjs`) passes with the new pieces (the water has no
  CPU side at all; the celebration's emitters write into the sprite pool's typed arrays; the staged share frame + its replay run ONCE,
  after the run's end).
- A desktop GPU's numbers — the tiers are the phone's margin; the owner's iPhone: `?fps=1` (OPEN FOR BEN 1).

## THE BUDGETS
- **THE BOOT BUDGET — NOT RAISED** (`tests/jaywalk-solo.test.mjs` pins `moduleKB` at 6500): the boot stood 836 B under its line; the
  mark + the tile came to + 1,364 B → slimmed (the tile: a flat ground, no white-hot core tube; the mark's paths in whole numbers; one-line
  comments) to + 753 B: **83 B under the line.** The next pass that grows a boot module has no room (OPEN FOR BEN 2).
- **THE PER-GAME BUDGET:** FREEFALL's line 46 modules / 580 KB → **46 / 610 KB** (its own graph 564 → 590 KB: the water's shader, the
  finish's pieces, the grain, the staged frame) — a named raise (`tests/integration/game-budget.json`).
- Pictures behind the opening: 12 (Water 001's normal map went — − 24 KB; the roof grain came — + 30 KB). The billboard's face (64 KB)
  ships in `assets/city/freefall/` and is read by nothing yet.

## THE FINAL RUN (local, on this pass's own servers — nothing else busy)
Per the owner's usage rules (Nov 26): LOOK ONLY → scaled. The shared files this pass touched are `js/core/marks.js`, `js/ui/mark-svg.js`
+ `js/ui/game-art.js` → THE PAGES LOAD + the smoke suite only. NOT run: the other games' suites, the rules + `/api` suites (nothing there
changed).
| what | result |
| --- | --- |
| `node --test tests/*.test.mjs` | **2,825 / 2,825** (the static scans: zero garbage in the frame functions · the boot budget at 6500 KB, not raised · the per-game budget · the preload graph · the docs' links) |
| `tests/integration/freefall-play.mjs` (the test page's checks: F2 → F4B + this pass's) | 170 checks: 169 OK + ONE red by design — "no firework by day" (the old rule) → the check now asks for THE DAY CELEBRATION; its group again (`--f3b`): **29 / 29** |
| … `--look` (every scene, both looks, the sizes) | 469 shots → `Downloads\NEON\freefall-f5a\look-all`; this pass's own scenes (water · finish · roofgrain · dayfog) + the beside-target sheets → `look` |
| … `--perf` | THE MEASURE, above: 60 fps at every tier, 1× + 4× CPU, both looks |
| `tests/integration/freefall-share.mjs` (every cause + a match place + THE BOTTOM + 0 floors + THE TRENCH, night + day, 1080 × 1350 + 360 px) | **266 / 266** → `share` |
| `tests/integration/freefall-billboard.mjs` (the readability proof, in the city at 390 × 844) | **6 / 6** — the lettering 15.5 pt vs 9.0 · OPEN NOW 6.1 pt vs 3.7 |
| THE PAGES LOAD + `e2e-smoke.mjs` (fresh emulators — the five playable games' openings; /, /admin, /board, /lab, /daychart) | **28 / 28**, no errors |

**The servers:** this pass started its own `serve.mjs` on :5196 (plain) + :5197 (`--emu`) + its own emulators, and STOPPED all of them (by
their process ids) before the push; the owner's :5190 was never touched. **The live site:** read once (the card lab's export — a GET);
no room opened, no player made.

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change). **YOUR PHONE CHECK** (https://neonspeakeasy.com/freefall-play — `?fps=1` for the frame
   line): the water at floor 119, night + day (`?floor=117&look=night` · `&look=day`) beside your two targets — the streaks' width + how
   broken they are, the plankton's count, the day lines are taste numbers (`break-fx.js WATER_F`); the finish by day (`?mode=match&floor=196&look=day`:
   the bubbles + the sun rays + the soft fireworks); the day offices (`?floor=48&look=day`); SHARE after a red out (the picture now
   shows the ball over the red slice). The numbers here are the mini PC's — the iPhone is the proof.
2. **THE BOOT BUDGET HAS 83 BYTES LEFT** (`moduleKB` 6500 — a JAYWALK test says it is never raised). The mark + the tile were slimmed to
   fit; the next pass that grows ANY boot module (F5B's HOW TO PLAY lives in a lazy chunk — fine; a tile with a scene would not fit) needs
   room freed first (CITY F did that for JAYWALK) or your word to raise the line.
3. **THE MARK** is your sketch B scaled ~13 % (the floor under the ball, its gap 1.45 × the ball). The reviewer read it as "a flame on a
   ring over an underline": raising the floor so the ball's lower third sits IN the gap would say THROUGH THE FLOOR harder — your call
   (a two-number change). THE TILE is the mark on a plain violet ground (no room in the boot for more: 2).
4. **THE ROOF's PAINTING is still the soft thing at floors 36 – 39 by day** — the grain helps the flat concrete; the painted stain, pipes
   + AC units stay blurry up close. **A Grok brief:** "the same top-down rooftop (`ff-roof-below-day.png` / `-night.png` — skylight +
   pillar in the middle, helipad, AC units, neon parapet, no red), re-made at a TRUE 2048 × 2048 (not enlarged from 1024): crisp edges on
   the AC units, the pipes + the stain; the skylight at the same place + size."
5. **THE PLUNGE's CROWN** (F3B's) still flashes near-white for a frame or two (eased, not rebuilt — the surface was this pass's brief).
   A CC0 splash sprite sheet would finish it: **a Grok brief** — "a stylised water SPLASH CROWN sprite sheet, 4 frames, white on
   transparent, soft edges, no hard streaks, CC0."
6. **Older things the reviewer saw, NOT built here** (to F5B through the inbox): the pillar's STUMP floating over the ball at the finish
   (day: clipped white) · a dark fuzzy smudge at a fixed spot high on the wall in every area (it shows through the day banner at the
   plunge) · a tan slab in the top-right corner at the finish camera by day · the ball's halo keeps a faint cut where a FLOOR runs in
   front of it (in play it is hidden by the slice's own light).
7. **FLOORS 40 + 120 ARE HIDDEN until their breakthrough** (the roof is shut; the water is opaque now — at 0.97 it was as good as): the
   first landing under the skylight / the surface is made blind. As F3B / F4B — but the seabed got THE TRENCH's MOUTH for exactly this.
   A rule of the view to decide in the review (is floor 40 / 120's landing ever red?).
8. **Named calls to overrule:** the fireworks' sound plays by DAY too ("the same muffled fireworks.mp3" — the cue was night-only) · a
   FINISH's shockwave ring is GOLD in play too (not only on the card) · the surface is fully opaque · the per-game budget's FREEFALL line
   580 → 610 KB · Water 001's normal map is no longer shipped · the staged share frame shows the tower at the angle the run ENDED on
   (the ball is over the slice that killed it — 150 ms earlier the player may still have been turning).
9. **THE F2 INBOX ENTRY** (Nov 26 2:11 am, THE BLAZE = NEON FIRE) has no "✓ done" line in the inbox file (F2's log says it was marked —
   the inbox was cut + restored on Nov 24 – 26). It IS built (df480722). Not this pass's line to add.
