# FREEFALL — F2: THE NIGHT LOOK + SOLO + THE SOUNDS (Nov 25–26 2026 — on the Beelink; the real game on an unlisted test page)

The owner's decisions: `docs/games/plan.md` "FREEFALL — F2 (approved Nov 25)". The game's page: `docs/freefall.md`. HIGH RISE S2 is the
template (`docs/games/passes/highrise-s2.md`). **Nothing is registered** — no GAMES entry, no `config.js` / meta / boot / cartridge
change, no `/api` wiring, **no rules-file change (nothing to re-publish)**. The new address, UNLISTED:
**https://neonspeakeasy.com/freefall-play** — **NOTHING COUNTS UNTIL GO-LIVE**.

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | f1bae383 | the owner's F2 decisions in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 226 marks, **no open FIX**; the inbox: no entry for this pass at the start (re-read after every group) |
| 0 — THE RULES FIXES | 1608115c | THE LANDING AFTER A SHATTER = a bounce · MOVING RED in THE TRENCH · THE HOLD (engine + judge + packed log) · the sims re-run + THE PROOF; engine 19 → 23 · tower 8 → 11 · server 7 → 8 · sim 6 → 8 |
| 1 — THE ASSETS | 39bee6fa | `scripts/build-freefall-assets.py`: the four night walls (157 KB), the seven sounds (168 KB) + their credits |
| 2–4 — THE TEST PAGE + THE NIGHT LOOK + THE SOUNDS | cc7e0dd2 | `/freefall-play`: `play.js` · `stage.js` · `night.js` · `night-fx.js` · `bakedtext.js` · `best.js` · `endscreen.js` · `sounds.js` · `sfx.js` · `audition.js` · `css/freefall-play.css`; `tests/freefall-play.test.mjs` + `tests/integration/freefall-play.mjs` (built together, as HIGH RISE S2's groups 3–6: the look is the page) |
| THE ADD-ON (the inbox, Nov 26 2:11 am) | df480722 | THE BLAZE = NEON FIRE — marked ✓ done in the inbox |
| 5 — THE DOCS + THE FRESH-EYES REVIEW | (this pass's close) | `docs/freefall.md`, this log, ROADMAP, CLAUDE.md (its one row), `docs/testing.md`; the reviewer's findings fixed (below) |

## GROUP 0 — THE RULES FIXES
- **THE LANDING RIGHT AFTER A SHATTER IS NEVER AN OUT** (the owner's rule b — `tuning.js` `shatterSafe`, `engine.js#landing`): red there
  = a BOUNCE (the event `bounce { red: true }` — the view's red flash + the cracked slice); the clean count + the no-bounce run reset as
  for any bounce; the NEXT landing on red is out again. `run.saves` counts them (the sims' column).
- **MOVING RED in THE TRENCH** (solo — floors ≥ 201; `tower-gen.js#moversInto`, `tuning.js` `gen.move { from 201, pace 45, max 4,
  chance 154 + 51 a lap, two 3 }`): a trench floor has up to TWO red slices that walk back and forth along their own TRACK (2–4 solid
  slices side by side), one slice every 45 ticks (0.75 s) — a mover's slice is a pure function of (seed, floor, tick)
  (`moverSlice` / `moversAt` / `kindAtTick`; the engine's landing reads the slice AT ITS OWN TICK). 60 % of the first lap's floors have
  one, 80 % of the second's, every floor from the third — where TWO move on 55 % of the floors. FAIR BY CONSTRUCTION, at every stand
  of every mover: a track never holds a slice straight below a gap of the floor above (twists counted — a ball through a gap never
  lands on moving red, at whatever tick it falls) · ≥ 3 safe slices, red ≤ 8, THE FALL WINDOW + NO ISLAND hold wherever the movers
  stand · a mover only steps to the slice next to it · two tracks never share a slice. A track takes at most ONE static red slice
  (it is the one that moves now) — the first design let a track swallow up to four and made the trench EASIER (the sims said so).
- **THE HOLD** (HIGH RISE's — `engine.js#hold`, `replay.js`): a LOGGED event `{ k: 'hold', t }` the judge replays. SOLO only (`modes.solo.holds`
  3; match + daily 0 — a match never holds). T is a PLAY tick: every landing before T happens, then the ball's flight STARTS OVER at T
  (a bounce's next landing = T + 36, a fall's = T + 18) and the darkness waits exactly as long — the player comes back from the
  3 · 2 · 1 to a whole flight. The next move counts at T + 1 at the earliest. The packed log: `!` + the ticks since the event before.

### THE SIMS PROOF — floors 0–199 did not move
Digests taken on F1's last commit (639f7fca) BEFORE any rule changed (the four bots × 60 seeds, every log + every result, tick for
tick; 300 towers × floors 0–200):

| what | F1 (639f7fca) | F2, the shatter rule OFF (a what-if row) | F2 as shipped |
| --- | --- | --- | --- |
| the tower, floors 0–200 (twist · gaps · red) | `01feecfdacd61711` | `01feecfdacd61711` | `01feecfdacd61711` |
| MATCH — 240 bot runs | `4ec096827cfbf061` | `4ec096827cfbf061` | `74b0b9aef9ae5bcc` (the shatter rule) |
| DAILY — 240 bot runs | `4ec096827cfbf061` | `4ec096827cfbf061` | `74b0b9aef9ae5bcc` |
| SOLO down to floor 200 — 240 bot runs | `4ea09f57d0694530` | `4ea09f57d0694530` | `c2f13808ff03f7b2` |

The tower above THE TRENCH is F1's bit for bit; MOVING RED touches no run above floor 201 (a row without it = the shipped row, tick for
tick, in a match, the daily and solo down to floor 200); the ONLY thing that moves a run on floors 0–199 is the shatter rule itself —
its point. Pinned in `tests/freefall-tower.test.mjs` + `tests/freefall-sim.test.mjs`.

### THE SIM TABLE (`node scripts/freefall-sim.mjs 2000` — F2's rules)
| mode | bot | floor med (p10–p90) | time med (p10–p90) | ≥ 120 | ≥ 200 | to floor 200 med (p10–p90) | red · dark · made · cap | saved by the shatter rule (runs · a run) | the longest stay on a floor | TERMINAL | bounces a floor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 62 (40–94) | 0:48 (0:30–1:17) | 0.7 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 51.6 % · 0.74 | 5.1 s | 0.0 % | 0.80 |
| solo | good | 136 (88–160) | 1:41 (1:03–2:05) | 69.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 3.7 % · 0.04 | 2.7 s | 0.4 % | 0.75 |
| solo | great | 245 (168–355) | 3:13 (2:03–4:42) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 99.8 % · 0.0 % · 0.0 % · 0.0 % | 1.3 % · 0.01 | 2.1 s | 1.1 % | 0.80 |
| solo | human | 149 (101–183) | 1:57 (1:14–2:29) | 81.1 % | 3.0 % | 2:44 (2:37–2:55) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 1.9 % · 0.02 | 2.1 s | 0.1 % | 0.81 |
| match | sloppy | 62 (40–94) | 0:48 (0:30–1:17) | 0.7 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 51.6 % · 0.74 | 5.1 s | 0.0 % | 0.80 |
| match | good | 136 (88–160) | 1:41 (1:03–2:05) | 69.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.1 % · 0.0 % | 3.7 % · 0.04 | 2.7 s | 0.4 % | 0.75 |
| match | great | 200 (168–200) | 2:30 (2:03–2:40) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 23.8 % · 0.0 % · 76.2 % · 0.0 % | 0.0 % · 0.00 | 2.1 s | 1.0 % | 0.76 |
| match | human | 149 (101–183) | 1:57 (1:14–2:29) | 81.1 % | 3.0 % | 2:44 (2:37–2:55) | 97.0 % · 0.0 % · 3.0 % · 0.1 % | 1.7 % · 0.02 | 2.1 s | 0.1 % | 0.81 |

THE STALLER: 2,000 of 2,000 at 19.0 s (unchanged). (solo great: 3 of 2,000 runs still falling at floor 600 — F1: 24.)
- **What the shatter rule moved (F1 → F2):** SLOPPY 47 (20–77) → **62 (40–94)** — the rule saves 52 % of its runs at least once (0.74
  times a run); GOOD 134 → 136; HUMAN-PACED 149 → 149; GREAT in a match: unchanged to the digit (76.2 % home at 2:32). **SLOPPY is now
  over the owner's 20–50 band** — floors 0–199 were not to be touched, so it is named, not tuned (OPEN FOR BEN).
- **THE TRENCH's new numbers (solo, the GREAT bot — the only one that lives there; 2,000 seeds):** its run ends on floor 245 (168–355)
  — F1 247 (168–418): the deepest tenth 63 floors shallower, the runs still falling at floor 600 down from 1.2 % to 0.15 %. Against
  F2's own static layout (300 seeds, `tests/freefall-sim.test.mjs`): 77 trench floors a run with moving red · 106 without; floor 235
  (157–344) · 244 (157–394); 0 · 7 runs at floor 600. The bots keep off the slice a mover stands on and — the careful ones — the
  slice it is stepping to (`bot.js#planFlight`).

## WHAT WAS BUILT (the detail: `docs/freefall.md` — "THE TEST PAGE" · "THE NIGHT LOOK" · "THE SOUNDS" · "THE ASSETS")
- **THE TEST PAGE + SOLO** (`freefall-play.html` · `play.js` · `stage.js`): the run on the pure engine, FAIR INPUT, the drag 1 : 1 at
  F1's scale, THE OPENING = the live scene (the first drag starts the run), THE HOLD on hide (3 · 2 · 1 back), the big number (baked),
  YOUR BEST = a gold tape round its floor + the crossing, the end = JAYWALK's standard, REPLAY = LIVE in the console after every run,
  THE DOOR (zero server calls), the lost-context rebuild. `window.__ffPlay` for the checks.
- **THE NIGHT LOOK** (`night.js` + `night-fx.js`): the slices in ONE instanced mesh (the ten floors in sight), the neon rim, the depth
  walk, red that stands proud + chevrons + a pulse, the ball + THE MARK, THE BLAZE = NEON FIRE (the add-on), a shatter's shards +
  sparks + shockwave + a camera kick, THE DARKNESS (the wall + the screen's edges, never the ball), the four areas' walls on the shaft
  at half resolution + THE ROOFTOP's open sky, the glow from below, the half-res bloom, three tiers, the warm frame, ZERO GARBAGE.
- **THE SOUNDS** (`sounds.js` · `sfx.js` · `audition.js`): nine sounds (seven delivered + JAYWALK's two), THE NOTE up its scale, the
  sound sync's hold, the SOUNDS list.

## THE LOOK REVIEW (`node tests/integration/freefall-play.mjs "<chromium>" <out> --look` → `Downloads\NEON\freefall-f2\` — 390 × 844 @3 · 375 × 667 · 430 × 932 · 1440 × 900)
- **First shots:** the scene stood — and: the pillar ran UP through the sky into the logo and the HUD (it was 44 units long, centred
  on the camera); the opening's tower was small + low; the sign ran off the right edge; the backdrop was one flat purple wash (the
  roof's pool of light + the fog started right under the ball); the ball's halo ended in a visible disc edge; the area shots were
  END screens (the check's hand dived on with THE BLAZE and never bounced).
- **Refine 1:** the pillar is CAPPED at the ball's floor (it sinks with the camera); the opening's camera nearer (the ring ≈ 70 % of
  the width, its top floor at 56 %); the sign 78 px inside the screen; the backdrop dark navy with the pink glow only at the shaft's
  foot; a soft halo; the hue walks on over 7 floors (it was 9: the bottom floors stayed pink). The walls came up: all four areas read.
- **Refine 2:** the slice under the ball was SOLID WHITE on most frames (the landing's flash 0.5 + the bloom) → the flash 0.32, held
  down in the bloom, the ball's light on its floor tinted in the floor's own colour; the pillar's cap FLUSH with the floor (the dark
  eye in the middle of the top ring — it had read as a stump the ball sat on) and the pillar thinner (0.2 R: the mockup's); the red's
  chevrons fewer + softer (at depth the tower was a wall of zigzags); THE MARK was never drawn (its quad lay face-down: culled) →
  drawn both sides; the wall steps back behind the big number; the skyline bigger (the painting's buildings across ≈ 70° — they had
  been a few blurred dots).
- **Refine 3:** THE DARKNESS's window: the edges were too faint at 2 floors off (the ellipse reached past the screen) → a tighter
  window, a stronger top; the warning line bigger + white; the ball 33 pt on a 375-wide phone → `R_BALL` 0.125 (36 pt at 375, 41 at
  390); THE BLAZE rebuilt as NEON FIRE (the add-on): its first column of flame reached into the big number and went white → pink with
  no yellow / orange between → shorter-lived flames shed slower, the ramp's bands widened.
- Every size: the opening fits its column, the HUD ends above the ball's highest point, the end's foot on the screen; 1440 × 900 =
  the phone's own column, centred.

## THE MEASURE (`--perf` — the mini PC, 390 × 844 @3, the bot shattering through THE SPEAKEASY from floor 84, the fire on)
| tier | cpu | fps | frame ms (p50 · p95 · worst) | size |
| --- | --- | --- | --- | --- |
| 2 (bloom) | 1× | 60.0 | 16.7 · 17.0 · 17.9 | 390×844 @3 |
| 2 (bloom) | 4× | 59.9 | 16.7 · 16.8 · 17.0 | 390×844 @3 |
| 1 | 1× | 60.1 | 16.7 · 17.0 · 18.3 | 390×844 @2 |
| 1 | 4× | 60.1 | 16.7 · 16.8 · 16.9 | 390×844 @2 |
| 0 | 1× | 60.0 | 16.7 · 17.0 · 17.8 | 390×844 @1.5 |
| 0 | 4× | 60.0 | 16.7 · 16.8 · 17.0 | 390×844 @1.5 |
A desktop GPU's numbers (the tiers are the phone's margin; the scene is ≈ 8,000 triangles + two half-res passes — its cost on a phone
is the fill of the wall, the slices and the bloom at DPR 3, exactly what tiers 1 and 0 take away). The owner's iPhone: `?fps=1`.

## THE CALLS MADE (obvious / established pattern — named, the owner may overrule)
- **The shatter rule is the classic ROW's** (`shatterSafe`) — no new rule-set row: nothing was ever recorded on the old rules (nothing
  counts until go-live; HIGH RISE S2 changed its row the same way). A what-if row without it replays F1 tick for tick (the proof).
- **MOVING RED from floor 201** (THE TRENCH; floor 200 itself — THE BOTTOM, a one-floor area — stays still: F3's finish stands there).
  ONE mover on the first two laps (60 % · 80 % of the floors), TWO from the third on 55 % of the floors; 0.75 s a slice; tracks of
  2–4 slices; a mover takes the place of at most one static red. The view WARNS on the slice it steps to next.
- **THE HOLD's numbers:** 3 a solo run (HIGH RISE's daily number — its solo has none; FREEFALL's owner asked for the solo pause); with
  none left a hide runs on (the darkness ends it, as in F1's lab). **A hold restarts the ball's flight** (a bounce: 0.6 s to the
  landing; a fall: 0.3 s) and the darkness waits as long — coming back from the 3 · 2 · 1 to a landing 2 ticks away would be a
  coin-flip. What three holds give back in all: ≤ 108 ticks of darkness.
- **FREE = ultraviolet, FALL = lime** on the sign AND the end's header (the plan names the game's colours; the prototype's sign was
  pink / violet — the floors' own colours). **PLAY AGAIN = lime** (the game's accent: dark ink on it; the cause = ultraviolet).
- **The pillar is 0.2 R** (the mockup's eye; F1's graybox had 0.3) and the ball 0.125 R (the graybox 0.14) — the VIEW's numbers only:
  the rules know angles, not radii. The drag's scale is F1's to the pixel (the check measures 512 units for 88 px).
- **The announcer's words:** BLAZE! · SMASH! (the mockup's) · CLOSE CALL (the saved landing) · NEW BEST. The area's name sits small
  under the number and swells at an arrival (no banner — F3's).
- **PLAY AGAIN → THE OPENING** (the start IS the live scene: the first drag starts the next run) — never a tap-anywhere restart (a
  resting thumb is a drag here).
- **The test page plays no music** (HIGH RISE's does not either); `sounds.js#MUSIC` names the evening deck for F4's cartridge.
- **The saved landing's sound** = the bounce + the crash short, high and quiet (no eighth file was delivered).
- **`?mode=match|daily` + `?floor=N` + `?tier=` + `?dpr=`** on the page (no switch on screen): the pass's own checks, HIGH RISE's flags.
- **The walls are ray-cast** (a cylinder met by each pixel's ray, in a half-res target) rather than a mesh: one quad, no overdraw, the
  seam's cross-fade + the darkness + the glow in one place.
- **HIGH RISE's reflection map is not used** (the prompt lists it under reuse): FREEFALL's slices are lit neon, not glass — nothing
  to mirror it. The breakthrough pack's flame sprites ARE used (the add-on asked for them).
- **REPLAY = LIVE is in the console only** (the prompt); the checks read `window.__ffPlay.ends`.
- **The lab (/freefall-lab) stays** as F1 built it (its graybox draws the moving red now); it leaves at the go-live.

## THE ADD-ON — THE BLAZE = NEON FIRE (the inbox, Nov 26 2:11 am — the owner; also typed into the chat; marked ✓ done in the inbox)
ONE ramp for everything that burns (`night-fx.js FIRE_RAMP`: neon pink → orange → yellow → white by heat) · 96 GPU flame sprites from
Kenney's Particle Pack (CC0 — only `flame_01` · `flame_03` · `fire_01` · `smoke_01`, read straight out of the archive into ONE 9 KB
grey atlas; a FIXED pool — the tiers trim only the rate: 128 · 84 · 46 a second) that swell, swirl off their line, turn to smoke and
cool down the ramp · a ribbon trail mesh · gold + pink embers (no arcs) · the ball burns on the ramp · at a shatter: shards lit by the
fire, a burst of flame along the floor, a FIRE SHOCKWAVE ring. The unlit ball is as it was. After the review (finding 3): a flame is
white only while it is small + new, the flames COVER a little of what is behind them (pure added light summed every band to white),
the ribbon is white only at the ball — the yellow + the orange bands show; the tail stays under the big number.

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — read-only, its own probes in node + headless Chromium)
**Its headline: the rules fixes are sound — every probe came back clean; the page never broke REPLAY = LIVE (78 of 78 runs) but had
two real input / hold bugs; the look was the weak part.** Checked and found sound: THE SHATTER RULE (1,500 driven runs, 4,274
shatters: 0 red outs right after one, the next landing on red out 1,500 / 1,500, a rule-off row out exactly at the save, live ==
replay == `judgeRun` == `judgePacked`) · THE TOWER (603,000 floors 0–200 bit-identical to F1's commit, 0 movers) · MOVING RED (128,000
trench floors, its own maths: pure, one slice at a time, never under a gap at any stand — 0 of 160 M unit checks —, ≥ 3 safe + ≤ 8
red at every stand, 0 fall-window traps; a human-paced bounce always has a safe-or-gap slice in reach: 13 M checks, the tightest 1,536
of 1,632 units) · THE HOLD (3,000 fuzz sessions, 3,708 holds — 1,679 at a move's tick, 1,217 at a landing's: live == replay == judge,
the 4th refused 1,219 / 1,219, a match never held) · the packed log (2,090,000 strings: 0 non-canonical parses) · 600,043 hostile
judge calls: 0 throws · the page (75 loads, 15 PLAY AGAINs with a flat heap, four lost contexts, wild drags, hostile `?…` values,
garbage storage: 0 page errors, 0 requests to `/api` or a foreign host).

| # | its finding | what was done |
| --- | --- | --- |
| 1 | HIGH (look): **the owner's gradient was not on screen** — the hue walked by AREA, one screen = one hue, the lower floors fogged to grey-lilac (hue 267 / sat .36 against the mockup's 245 / .92) | FIXED: THE DEPTH WALK is the gradient ON ONE SCREEN — whatever the area's colour, the floors in sight walk on to violet (two down), a saturated blue (four), teal at the foot, and stay saturated as they dim (`SLICE_F`) |
| 2 | HIGH (look): **the HUD's words collided with the tower** — the area's name on the floor flying past (2.5 : 1), THE LIGHTS ARE GOING OUT grey on pink (1.7 : 1) | FIXED: THE SHADE — a dark fall behind the HUD's column while a run is on (it ends above the ball's highest point); a floor just passed lets go faster + lifts less; the warning is white on its own dark plate |
| 3 | MEDIUM (look): **THE BLAZE was a blown-out white column**, a thin yellow fringe, no orange, a dull mauve outside; it crossed the number | FIXED (above): the bands show, the pink is the ramp's own, the tail shorter |
| 4 | MEDIUM (BUG): **hidden again during the 3 · 2 · 1 skipped the count** — back after it, the run was live 250 ms later with no number shown | FIXED: a hide while held drops the count; it runs whole when the page is back. Checked |
| 5 | MEDIUM (BUG): **a second finger stole the drag** and the first stayed dead until it pressed again | FIXED: a press while a drag is live is ignored. Checked (two real touches: 512 of 512 units) |
| 6 | MEDIUM (look): **a 1 px vertical hairline** from the top of the screen through the number to the ball in every walled area + a black stub on the pillar | FIXED: the wall's angle wrapped in the middle of the FAR face (one column read the smallest mip) — its seam lies on the near side now; the pillar's cap follows the ball's own glide (it stuck up over the floor the camera had not reached) |
| 7 · 19 | MEDIUM (look): **red's chevrons were stair-steps**, red wore the safe slices' white rim, barely stood proud; a third of the screen vivid red | FIXED: the stripes are smoothed by their own width on the screen; a red slice's rim is HOT RED (danger's own edge); it stands 0.1 proud (was 0.07); its top a shade deeper |
| 8 | MEDIUM (look): **DRAG TO SPIN + the foot's lines sat on bright floors** | FIXED: THE SHADE's dark rise behind the opening's foot |
| 9 | MEDIUM (look): **a sparse spiral staircase** — thin floors, a fat flat unlit pillar | FIXED: the slabs twice as thick (0.2), the pillar lit (a soft light down its front, a violet rim, its cap a dark eye) |
| 10 | MEDIUM (look): **THE DARKNESS barely read**; no shot in a walled area | FIXED: it starts a floor sooner ((6 − gap) / 5); `f2-09b-darkness-speakeasy.png` shows it on a wall (the ball + its floor undimmed) |
| 11 | LOW (RISK): **a hold at a landing's tick cancels that landing** — three free red-dodges a solo run by swiping the app away (the darkness gain is bounded: + 108 ticks) | BY DESIGN (the owner asked for the solo pause; any pause is time to think) — NAMED → OPEN FOR BEN 4; F4's board may show / flag `holds` |
| 12 | LOW (BUG): **a run that went live behind a hidden page** (the start waited for the sounds) was never held — back after 21 s: THE LIGHTS WENT OUT at floor 0 | FIXED: `live()` holds at once when the page is hidden |
| 13 | LOW (BUG): **a phone held sideways** (844 × 390, a 234 px column): the end card ran out of its column, PAUSED sat on its number; a press on the bars beside the column did nothing | FIXED: a compact layout under 480 px of height; the WHOLE page is the drag's ground. Checked |
| 14 | LOW (RISK): any press started the run; **a double tap on PLAY AGAIN skipped the opening** | FIXED: a press within 350 ms of a restart starts nothing. (A press still starts the run — the first touch IS the drag's start.) Checked |
| 15 | LOW (look): **the skyline's red windows + beacons** (hue 345) broke "nothing else red" | FIXED: a red-dominant pixel of the painting leans to pink in the shader (the file is JAYWALK's, untouched) |
| 16 | LOW (look): the end's number sat on the dimmed tower | FIXED: a darker scrim |
| 17 | LOW (look): the unlit ball has a gold / orange rim and no centre mark of its own | KEPT: the owner's spec ("a white-hot core + an orange glow"; the add-on: "the ball's normal unlit glow stays as it is") — THE MARK on the slice under it shows the centre. Named → OPEN FOR BEN 7 |
| 18 | LOW (look): the logo's falling ball was a capsule — the one pill | FIXED: a flame tapering to a point over a round ball (`clip-path`) |
| 20 | NITS: a three.js warning a load (a cloned material held the wall's target) · the server half's comment lacked the two new refusals · the DOM number stayed pink in the greyscale shots | FIXED: a twin is built, never cloned · the comment · the look's greyscale shots grey the whole stage |

## THE FINAL RUN (the Beelink, this pass's OWN servers — `serve.mjs` on :5173, fresh emulators + `serve.mjs --emu` on :5174 for THE PAGES LOAD — nothing else busy)
- unit `node --test tests/*.test.mjs`: **2,779 / 2,779** (was 2,759 — + 20 FREEFALL: engine 19 → 23 · tower 8 → 11 · server 7 → 8 · sim
  6 → 8 · play 10 new) — the CLAUDE.md size test, the doc links, the file hashes, parse-all, unit-imports, repo-growth all green
- `tests/integration/freefall-play.mjs`: **74 / 74** (Chromium, 390 × 844 @3 + 375 × 667 · 430 × 932 · 1440 × 900 · 844 × 390; the
  review's cases inside) · `--perf` **6 / 6** (60.0 fps at every tier at 1× + 4× CPU — FREEFALL's speed test, the fire on)
- THE PAGES LOAD (`kit/page-loads.mjs`): **18 / 18** — the nine pages incl. /freefall-play, Chromium + WebKit
- `tests/integration/freefall-lab.mjs`: **57 / 57** (F1's lab, its graybox drawing the moving red)
- `node scripts/freefall-sim.mjs 2000`: the table above
- `/api` + the rules tests: not run — nothing under `/api` is wired, no rules-file change (the judge's server half is its own unit test)
- no full e2e suite, no repeat runs (the owner's scaled testing); the servers this pass started STOPPED at its end; the owner's :5190
  preview server untouched

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules-file change; nothing registered).
2. **YOUR PHONE CHECK:** https://neonspeakeasy.com/freefall-play — THE OPENING, the first drag, the drag's feel (F1's scale), the
   night look, THE BLAZE (three clean floors) + a shatter, the sounds (SOUNDS, top left between runs; the note climbs as you chain
   floors), **lock the phone mid-run** (PAUSED → 3 · 2 · 1), the end screen. `?fps=1` for the frame rate on your iPhone (the 60 fps
   above is the mini PC's). Look checks: `?floor=40` THE OFFICES · `80` THE SPEAKEASY · `120` UNDER THE HARBOR · `160` THE DEEP · `205`
   THE TRENCH's moving red.
3. **SLOPPY IS OVER ITS BAND:** the landing after a shatter (your rule b) saves 52 % of the SLOPPY bot's runs — it now falls 62 floors
   (40–94), over your "≈ 20–50". Floors 0–199 were not to be touched, so it is named, not tuned. If you want the band back: a little
   more red on floors 10–80 (a new tuning — it moves matches) or accept (a beginner gets further: maybe that is the point).
4. **THE HOLD — its numbers + what a pause is worth:** 3 a solo run; with none left a hide runs on (the darkness ends it). A hold
   restarts the ball's flight — so **a hold at the right tick is a free dodge** (the reviewer: swipe the app away one tick before a red
   landing and you come back to a whole new bounce, three times a run). Any pause is time to think; nothing counts yet. For F4: the
   board can show / flag held runs, or a counted run may get fewer (or no) holds — yours. (HIGH RISE's solo has none.)
5. **MOVING RED's numbers:** from floor 201, 0.75 s a slice, one mover on the first two laps (60 % · 80 % of the floors), two from the
   third (55 %); the great bot's deepest tenth 418 → 355 floors. A perfect hand still has no ceiling but the 30:00 cap (the bounce +
   the fall never change) — say if THE TRENCH should also get faster.
6. **THE COLOURS — calls:** the sign + the end's header = FREE ultraviolet · FALL lime (your prototype's sign was pink / violet);
   PLAY AGAIN = lime; the cause = ultraviolet (never red). Two CSS colours each if you want them otherwise.
7. **THE BALL unlit** keeps your spec (a white-hot core, an orange glow); the reviewer would give it a pink-white rim + a core dot —
   THE MARK on the slice under it shows where its centre comes down. Yours.
8. **THE FIRE's size:** the flame column is short + narrow (it stays under the big number). Bigger = two numbers (`night.js` the
   flames' life + drift).
9. **The sounds' FIRST MIX** (the bounce soft, the two ends the loudest; the saved landing = the bounce + a short high crack) — tell me
   what is too loud / too quiet by ear. The test page plays no music (HIGH RISE's does not either).
10. Named calls, yours to overrule: the pillar 0.2 R + the slabs 0.2 thick (the view's numbers) · the announcer's words (BLAZE! ·
    SMASH! · CLOSE CALL · NEW BEST) · the area's name small under the number (no banner — F3) · PLAY AGAIN → THE OPENING · a press
    starts the run (the first touch is the drag's start) · the walls ray-cast at half resolution · HIGH RISE's reflection map not used
    (the slices are neon, not glass) · the shatter rule on the classic row (no new rule set: nothing was ever recorded).
11. **For F3 / F4** (not this pass's): the day walls + the breakthroughs; SHARE (a placeholder now); YOUR TABLE's slot; THE BOTTOM's
    sound + finish; the judge wired, the run node chunked (a held run = legs on the server's clock — HIGH RISE's `held.js`).
