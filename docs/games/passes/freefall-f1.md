# FREEFALL — F1: THE ENGINE (Nov 25 2026 — on the Beelink; engine + replay + server judge + bot sims + the lab)

The owner's decisions: `docs/games/plan.md` "FREEFALL — F1 (approved Nov 25)". The game's page: `docs/freefall.md`. FREEFALL is a NEW
mini game (id `freefall`); JAYWALK is its quality benchmark, HIGH RISE its code template (this pass mirrors
`docs/games/passes/highrise-s1.md`). **Nothing is registered** — no GAMES entry, no `config.js` / meta / boot / cartridge change, no
`/api` endpoint wiring, **no rules change (nothing to re-publish)**. FREEFALL stays invisible to players; the one new address is the
unlisted lab: **https://neonspeakeasy.com/freefall-lab**.

## THE GROUPS
| group | commit | what |
| --- | --- | --- |
| Step 0 | 8fa9c032 | the owner's approved plan in `docs/games/plan.md`; `lab-export.mjs https://www.neonspeakeasy.com`: 226 marks, **no open FIX**. The inbox: no entry for this pass (re-read after every group + before the final tests — none arrived) |
| 1 — THE ENGINE | 0373c526 | `js/games/freefall/` tuning · tower-gen · engine · logic · replay · bot; `tests/freefall-engine.test.mjs` (18 → 19 after the review) + `tests/freefall-tower.test.mjs` (8) |
| 2 — THE JUDGE | 174f6002 | `api/_lib/freefall.js` (pure, the same modules, not an endpoint, not wired); `tests/freefall-server.test.mjs` (7) |
| 3 — THE SIMS + THE TUNING | 9ecc9a5b | `scripts/freefall-sim.mjs`; `tests/freefall-sim.test.mjs` (6 — the fast bands); the numbers tuned |
| 4 — THE LAB | c198c306 | `freefall-lab.html` · `lab.js` · `graybox.js` · `css/freefall-lab.css`; `tests/freefall-lab.test.mjs` (5) + `tests/integration/freefall-lab.mjs` (56 → 57); THE PAGES LOAD + `serve.mjs` know the page |
| 5 — THE DOCS + THE FRESH-EYES REVIEW | (this pass's close) | `docs/freefall.md`, this log, ROADMAP, CLAUDE.md (1 row), `docs/testing.md`; the reviewer's findings fixed (below) |

## WHAT WAS BUILT
- **THE ENGINE** (pure, integers only, event-driven): `createRun` · `stepTo(run, tick)` · `turn(run, tick, d)` / `setAngle(run, tick, a)` ·
  `resultOf` · `logOf` + the events for a view. A run is a sequence of LANDING TICKS; the slice under the ball at that tick decides.
  Every rule of the plan has a hand-built test: the slice math at slice edges (to the unit), bounce / fall timing at every depth, red =
  out, THE BLAZE (lit on the 3rd clean floor, carried over a gap, spent on a shatter of SAFE and RED alike, relit after 3 more — not
  2), the no-bounce run + TERMINAL VELOCITY, THE DARKNESS (the grace, the pace, the LEAD catch-up, never upward, the exact out tick,
  its order against a landing at the same tick), the finish + the cap per mode, MAX SPIN, FAIR INPUT, the same log twice = the same run
  (one jump · tick by tick · uneven jumps: the same state, the same events), integer-only state.
- **THE TOWER** (`tower-gen.js`): `buildFloor(seed, i)` — pure of (seed, floor), FAIR BY CONSTRUCTION: the red is laid one slice at a
  time and only where every rule still holds. Proved from the outside over 2,000 seeds (`tests/freefall-tower.test.mjs`).
- **THE JUDGE**: `judgeRun({ seed, mode, log })` — the cheap bounds, then the replay through the engine's own `turn()`; twelve named
  refusals (`docs/freefall.md` "THE JUDGE"). The server half imports the phone's modules; the judge == the live engine for 500 bot runs.
- **THE SIMS**: four bots that play flight by flight; the table below; the numbers tuned to the targets.
- **THE LAB**: the graybox at real phone size, a drag anywhere = spin 1 : 1, the plain-text HUD, REPLAY = LIVE ✓ after every run, and
  it NEVER COUNTS.

## THE TUNING — every number changed (from → to, why)
The owner's plan gave starting numbers for MAX SPIN and the darkness only; the rest started as the builder's first picks. All rows:
2,000 seeds a bot, the FINAL bots (the bots themselves were written during the tuning — "THE BOTS", below).

| number | the start | final | why |
| --- | --- | --- | --- |
| `MAX SPIN` | 171 a tick (the owner's ≈ 2.5 turns / s) | **171** | not needed — no bot spins faster than 80 a tick; the phone check is the owner's (the lab's end card counts the ticks it held) |
| THE DARKNESS: grace · pace · LEAD | 4 s · a floor / 2.5 s · 6 (the owner's) | **4 s · 2.5 s · 6** | not needed: no run of any bot ends in the dark, the longest stay on one floor is 5.1 s of the 15 s it needs, a staller is caught at 19.0 s (target ~15–25 s). Tried pace 2.0 s / LEAD 4 (a staller at 12.0 s) and pace 1.5 s (13.0 s): still no bot met it — the owner's numbers have the most room |
| `BOUNCE` | 32 ticks (the builder's first pick) | **36** | the pace: with 32 / 20 the GREAT bot stood on floor 200 at 2:21 with more air-steering than bouncing; 36 (0.6 s) is a calmer bounce and puts it at ≈ 2:30 |
| `FALL` (+ `first`) | 20 ticks | **18** | a shorter fall = less time to steer in the air (fewer free chains), and it still leaves a real FALL WINDOW: (18 − 12) × 68 = 408 units of human reach (at 12 the reach is 0 — red could never sit under a gap at any depth) |
| the gaps a floor (`gen.gaps`) | 3 at the top → 1 by floor 200 | **2 → 1** | with 3 two-slice gaps half the ring was open: every bot chained floor after floor (0.2 bounces a floor), TERMINAL VELOCITY in 75–100 % of runs, floor 200 in 1:21 |
| the 2-slice share (`gen.wide`) | 100 % to floor 20 → 0 by 200 | **100 % to floor 40 → 0 by 200** | the 1-slice gaps moved deeper: GOOD was out around floor 90 on gaps it could not aim for yet |
| the red a floor (`gen.red`) | 1.0 at floor 10 → 6.5 at 200 | **1.5 at floor 10 → 6.5 at 200** | a little more red early: SLOPPY's median sat above its band (54–56 floors) |
| the hug chance (`gen.hug`) | 19 % at 40 → 94 % at 200 | **22 % at 40, 34 % at 80, 50 % at 120 → 94 % at 200** | slower through the middle (GOOD 120+), the same at the bottom |
| "the early areas" (`gen.belowUntil`) | floors < 80 | **floors < 120** | from floor 80 a GOOD bot (a 230 ms reaction) could not get off red straight below a gap: the 80–119 band took most of its runs (median 96–99 floors). With THE SPEAKEASY counted as early: 125 |
| THE FALL WINDOW's start (`gen.windowRamp`) | the full human reach (408 units) from floor 120 on | **a RAMP over 40 floors** (0 → 408 by floor 160) | the review: red straight below a gap went from 0 % of gap points (floors 80–119) to 38 % in ONE floor, and GOOD's median (125) sat on that wall. With the ramp: GOOD 134 (83–160), GREAT home in 76.2 % (was 74.7 %) |

With the starting numbers (final bots): sloppy 56 floors (28–80) · good 99 (75–130), 20 % reach floor 120 · great on floor 200 at 2:21,
70 % of its runs, TERMINAL VELOCITY in 17 % · human-paced 116. Candidates on the way (300–600 seeds): BOUNCE 36 / FALL 12 (reach 0:
great only 19 % home) · 34 / 14 · 38 / 20 (great home at 2:42 — too slow) · 36 / 16 · **36 / 18 chosen** (2:32, 75 %).

## THE SIM TABLE (final — `node scripts/freefall-sim.mjs 2000`)
| mode | bot | floor med (p10–p90) | time med (p10–p90) | ≥ 120 | ≥ 200 | to floor 200 med (p10–p90) | red · dark · made · cap | out right after a shatter | the longest stay on a floor | TERMINAL | bounces a floor |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 47 (20–77) | 0:36 (0:14–1:01) | 0.1 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 53.3 % | 5.1 s | 0.0 % | 0.77 |
| solo | good | 134 (83–160) | 1:40 (0:59–2:04) | 67.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 6.8 % | 2.7 s | 0.4 % | 0.75 |
| solo | great | 247 (168–418) | 3:17 (2:03–5:47) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 98.8 % · 0.0 % · 0.0 % · 0.0 % | 3.5 % | 2.1 s | 1.0 % | 0.84 |
| solo | human | 149 (99–182) | 1:56 (1:12–2:28) | 80.3 % | 2.8 % | 2:44 (2:37–2:55) | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 5.3 % | 2.1 s | 0.1 % | 0.81 |
| match | sloppy | 47 (20–77) | 0:36 (0:14–1:01) | 0.1 % | 0.0 % | — | 100.0 % · 0.0 % · 0.0 % · 0.0 % | 53.3 % | 5.1 s | 0.0 % | 0.77 |
| match | good | 134 (83–160) | 1:40 (0:59–2:04) | 67.7 % | 0.1 % | 2:46 (2:46–2:46) | 100.0 % · 0.0 % · 0.1 % · 0.0 % | 6.8 % | 2.7 s | 0.4 % | 0.75 |
| match | great | 200 (168–200) | 2:30 (2:03–2:40) | 98.6 % | 76.2 % | 2:32 (2:23–2:41) | 23.8 % · 0.0 % · 76.2 % · 0.0 % | 1.3 % | 2.1 s | 1.0 % | 0.76 |
| match | human | 149 (99–182) | 1:56 (1:12–2:28) | 80.3 % | 2.8 % | 2:44 (2:37–2:55) | 97.2 % · 0.0 % · 2.8 % · 0.1 % | 5.1 % | 2.1 s | 0.1 % | 0.81 |

THE STALLER (no input, 2,000 seeds): the darkness takes 2,000 of 2,000 runs at 19.0 s. (solo great: 24 runs were still falling at floor
600, where the sim stops them.)

Targets: SLOPPY ≈ 20–50 floors ✓ (47) · GOOD 120+ ✓ (134; 68 % of its runs reach floor 120) · GREAT on floor 200 in ≈ 2:30, most runs ✓
(2:32, 76.2 %) · a normal player never meets the darkness ✓ (0 of 16,000 runs) · a staller within ~15–25 s ✓ (19.0 s).

## THE BOTS (how they were made honest)
The first bots (aim at the nearest gap in every flight) died in ways no person does, and the sims said so — each fix is a behaviour a
player has, not a number bent to a target:
- **the landing after a shatter**: with THE BLAZE lit they held still and landed blind on the floor after the shatter → a careful bot
  now spins to a spot whose landing one floor further down is good ground.
- **the gap's edge**: "the nearest good ground" was the very first unit of a gap — half its aiming error fell on the red beside it →
  good ground = clear of red by the bot's own error on both sides, gaps included.
- **a fall is not a bounce**: they air-steered for a gap in every 0.3 s fall → in a fall a bot lets the ball land; it only DARES a gap
  that is close (`dare`) and that it saw coming (`ahead`), and gets off red straight below.
- **two hops**: a far gap with red beside it is taken in two bounces (solid ground near it first) — what a careful hand does.
The four rows of numbers (`bot.js#BOTS`) are in `docs/freefall.md` "THE SIMS".

## THE CALLS MADE (obvious / established pattern — named, the owner may overrule)
- **The end's words**: HIT THE RED · THE LIGHTS WENT OUT · MADE IT TO THE BOTTOM · TIME'S UP (the plan names the causes, not the words).
- **"The early areas"** = floors < 120 (THE ROOFTOP + THE OFFICES + THE SPEAKEASY) — tuned (above).
- **NO ISLAND** — a fairness rule the plan does not list: no stretch of safe slices walled in by red runs longer than a human-paced
  bounce can cross (3 slices). Without it a floor could leave a player bouncing for the darkness.
- **Floor 0**: the slice under the ball at the start (A = 0) is SAFE (its gaps are turned round the ring until it is).
- **THE FINISH** = the tick the 200th floor is passed (the run ends there, `made`); the ball's last drop onto THE BOTTOM is the view's.
  In SOLO floor 200 is one more floor (THE BOTTOM is a one-floor area), THE TRENCH from 201.
- **THE DARKNESS** starts LEAD floors above the ball (so the plan's LEAD rule holds from tick 0, and a staller's 19.0 s = the 4 s grace
  + 6 floors × 2.5 s); its pace starts again at every catch-up; at one tick the landing comes before the darkness; THE CAP before both.
- **THE CONTROL's API**: `turn(run, tick, d)` (a signed turn — what a drag gives) + the plan's `setAngle(run, tick, a)` (the shortest
  way to an angle). The ENGINE clamps to MAX SPIN and keeps the log itself (two moves at one tick = one entry; a tick that nets to
  nothing = no entry), so every log a phone can write is one the judge accepts. A move at / before a landing already decided counts at
  the first tick after it.
- **The packed log**: `.gap` (left out when 1) + sign + the turn, base 36 — ≈ 3.2 characters an entry.
- **The judge's extra refusals**: `rules` (an unknown rule set), `no change` (an entry that turns nothing), `past the end`.
- **THE DAILY mode** = the match's numbers (floor 200 / 3:00) — nothing turns it on.
- **MOVING RED: NOT BUILT** (optional). The static layout already ends 25 % of the GREAT runs before the bottom and every GOOD run; a
  red slice that moves under a ball mid-bounce is a new way to die that the FALL WINDOW proof would have to cover per tick — a rule for
  the owner to want first.
- **The lab**: `?mode=solo|match` only (the plan's list; the daily mode is not offered) · the mode switch + the seed hidden during a run
  · RESTART in the top-right corner + on the end card (a touch on the tower never restarts) · the first touch starts the run (tick 0)
  and is already the drag · the darkness shown as a dimming from the top (the floors above the ball are not drawn) · the ball's shadow
  on the slice under it · the lab's test split JAYWALK's / HIGH RISE's way (a static unit half + a browser half) · CSS prefix `ff-`.

## THE LOOK REVIEW (the lab at 390 × 844 · 375 × 667 · 430 × 932 · 1440 × 900 — `Downloads\NEON\freefall-f1\`)
- Refine 1: which slice the ball is over did not read (the ball hangs in front of the pillar) → its shadow on the slice under it (none
  over a gap); "1 BLAZES" → "1 BLAZE"; the browser check measured the frame before the ball had dropped in → it measures the frame the
  game is played in.
- Refine 2: at 375 × 667 and 1440 × 900 only 3 floors were in sight below the ball → every screen wider than a tall phone is framed as
  the phone's column (4 floors below, the ball's floor 34 % down, on all four sizes); at 375 × 667 the HUD's last lines sat ON the ball
  → the area + the clock share one row, a short screen gets a smaller FLOOR number: the HUD ends above the ball's highest point on
  every size (checked: 147 of 171 pt · 119 of 133 · 147 of 189 · 147 of 180).
- Refine 3 (the reviewer's notes): THE DARKNESS dimmed the ball and its floor → the screen's edges close in instead, the HUD's line
  turns red from 2 floors off, a ball the dark took is grey; RED was red by hue only → a red slice stands proud of the floor.

## THE FRESH-EYES REVIEW (a subagent that did not build the pass — read-only, its own probe scripts)
**Its headline: it found no determinism hole and no judge hole.** Checked and found sound: the engine against the judge (1,500 chaos
sessions — 532,423 logged moves: moves behind the stepped tick, out of order, bursts over MAX SPIN, net-zero ticks, NaN / huge turns — and
400 planner-bot sessions: the live result + the whole event stream == the replay, `judgeRun`, the server's `judgeRun`, `judgePacked` in
all 1,900; its OWN tick-by-tick reference written from the plan's text agreed on every count) · the tower (172,566 floors of 86 seeds —
empty, 5,000 characters, unicode, a lone surrogate, `__proto__` — floors 0–2000 and up to 2^40, 66.7 M gap points angle by angle: no
rule broken) · 617 hostile calls to the judges (none throws) · the packed log (3,274,321 strings: 0 non-canonical accepted, 0 two-for-one)
· the largest log there can be (108,000 entries) judged in 25 ms · the lab's 12 requests (its own files + three.js, nothing stored) · the
drawn slices == the rules' slices (19 positions computed by its own maths, sampled from the screenshot).

| # | its finding | what was done |
| --- | --- | --- |
| 1 | RISK: **MAX SPIN is felt at the lab's 1 : 1 scale** — 171 units a tick = a finger at 1,763 px / s at 390 wide (1,417 at 375, 1,944 at 430); a 150 px flick in two events lags 2 frames, 250 px 5 frames; the first lab build dropped turn only sometimes | The page's rule made ONE rule: it owes at most 8 ticks (0.13 s) of catching up, the rest of a wilder flick is dropped (`lab.js#OWED_MAX`); the browser check proves a 150 px flick ends EXACTLY 1 : 1 and a 280 px one-move flick is cut where it says. The number itself is the owner's → OPEN FOR BEN 2 |
| 2 | RISK: **the landing after a SHATTER is outside every fairness rule** — red straight below a shatter point: 22 % (floors 10–39) … 50 % (160–199); no human-paced escape at all: 0.8 % … 7.8 % | NOT built (a new owner call) → OPEN FOR BEN 3, with its table |
| 3 | RISK: **a cliff at floor 120, not a ramp** — red straight below a gap point: 0 % on floors 80–119, 38 % on 120–159, with zero slack (the worst case needs exactly 408 of 408 units); GOOD's median sat on that wall | FIXED: THE FALL WINDOW RAMPS in over 40 floors (`tower-gen.js#reachAt`, `gen.windowRamp`): the escape a floor may ask for is 0 above 120, 102 units at 130, 204 at 140, the full 408 from 160. Proved angle by angle (`freefall-tower.test.mjs`); the sims re-run: GOOD 125 → 134, GREAT home 74.7 → 76.2 % |
| 4 | RISK (F4): **the judge knows nothing of the server's clock** — a script that reads the tower makes floor 200 at tick 3600 on every seed; slow motion; a seed of the caller's choosing; any prefix of a log is a log; `until` only on `replay()`, which throws on a hostile log | `judgeRun` takes `until` now (after the bounds: a hostile log is refused by name; a bad `until` → `why: 'until'`; the answer carries `over`) — the packed door too; `replay()` says it is not the hostile-safe door. The rest is F4's wiring: written into `docs/freefall.md` "FOR F4" |
| 5 | BUG (minor): **−0 entered the state** — `turn(run, -0, 5)` logged tick −0, `tickOf(99.9, 100)` gave −0, the judge took a log with `"t":-0` | FIXED: `turn` and `tickOf` add 0; the judge refuses a −0 tick / angle (`entry`: one log, one JSON text). Tested |
| 6 | BUG (latent): **`endWords({ cause: 'constructor' })` returned a function** (the prototype) | FIXED: the table's own keys only. Tested with ten hostile causes |
| 7 | Built differently: **the darkness's pace restarts at every catch-up** (the plan: "a steady pace" + "moves down to at least f − LEAD") — a ball that stops always has the full 15 s; with the pace's clock untouched it would be 12.5–15 s | KEPT + named (THE CALLS MADE) → OPEN FOR BEN 9 |
| 8 | NIT: **THE CAP beats the finish at the same tick**; `made` fires at the pass of floor 199, 18 ticks before the ball would touch floor 200 | KEPT (the cap comes before anything else at its tick — as everywhere) + PINNED by a test; the last drop is the view's — both named |
| 9 | RISK (look): **the darkness overlay dimmed the ball and its own floor** — exactly when the player must act | FIXED: the screen's EDGES close in, never the ball or its floor; the HUD's line turns red from 2 floors off; a ball the dark took is grey (it was the same red as a red end) |
| 10 | RISK (look — the colour-blind rule): **RED differs from the greys by hue only** (contrast 1.16 : 1 and 1.29 : 1) | The graybox: a red slice stands PROUD of the floor (a taller block — a shape). F2's look must keep a shape or a mark: written into `docs/freefall.md` |
| 11 | NIT (F2): the ball's centre decides, but the ball is 82–85 % of a slice wide — one unit inside a gap, 40 % of it still hangs over the neighbour | F2's look (the ball's size against the slice, or how a near-miss is drawn) — in `docs/freefall.md` |
| 12 | NIT: a hidden tab does not pause — every missed landing is decided at once with the tower still | KEPT for the lab (said on the page's doc); the real game's hold rules are F2's / the owner's → OPEN FOR BEN 7 |
| 13 | NITS: `judgePacked`'s bound ignored the named rule set · the packed gap took 5 digits (no legal log has one) · a comment said "floors < 80" · `maxClean` was the no-bounce run's best, not the clean count's | FIXED: the named set's bound · 4 digits · the comment · the field is `bestRun` |
| 14 | TESTS: nothing tested −0, a hostile `endWords`, the judge's time on the largest log, cap against made at one tick; the flick check passed whether or not turn was dropped | ONE new test, "THE REVIEW's FINDS" (−0 · the words · the tie · `until` · a 108,000-entry log judged under a second); the flick checks measure the turn |

NOT done from its list, on purpose: fairness after a shatter (finding 2 — the owner's call) · a pixel test that the drawn slices are the
rules' slices (it checked 19 positions by hand; F2 replaces the graybox).

## THE FINAL RUN (the Beelink, this pass's OWN fresh emulators + `serve.mjs --emu`, nothing else busy)
- unit `node --test tests/*.test.mjs`: **2,759 / 2,759** (was 2,714 — + 45 FREEFALL: engine 19 · tower 8 · server 7 · sim 6 · lab 5) — the
  CLAUDE.md size test (36,110 B of 40 KB), the doc links, the file hashes, parse-all, unit-imports, repo-growth all green
- `/api` + the rules tests: not run — NO rules change, NO wired `/api` change (the judge's server half is its own unit test)
- `tests/integration/freefall-lab.mjs`: **57 / 57** (Chromium, 390 × 844 @3 + 375 × 667 + 430 × 932 + 1440 × 900 — the shots in `Downloads\NEON\freefall-f1\`)
- THE PAGES LOAD (`kit/page-loads.mjs`): **16 / 16** — the eight pages incl. /freefall-lab, Chromium + WebKit
- `node scripts/freefall-sim.mjs 2000`: the table above (re-run after the review's ramp)
- no full e2e suite, no repeat runs (the pass adds new rules code and changes no live game — the owner's scaled testing)
- the servers this pass started (the emulators + `serve.mjs --emu` on :5173) STOPPED at its end; the owner's :5190 preview server untouched

## OPEN FOR BEN
1. **RE-PUBLISH: nothing** (no rules change).
2. **YOUR PHONE CHECK:** https://neonspeakeasy.com/freefall-lab on the iPhone — a few runs: REPLAY = LIVE ✓ under every end; how the
   DRAG feels (1 : 1 with the ring: a quarter turn = 176 px, a full-width drag = 0.55 of a turn); the BOUNCE (0.6 s) and the FALL
   (0.3 s). **And FLICK HARD: is MAX SPIN felt?** The plan says "never felt by a human" — at 1 : 1 it is a finger at 1,763 px a second
   (1,417 on a 375-wide phone); the reviewer's flicks out-ran it (a 150 px flick: 2 frames behind; its long run: "max spin held 453
   ticks" of 1,648 moves). The end card counts the ticks it held. If you feel it: a higher MAX SPIN (a new rule-set row — up to ≈ 340,
   5 turns a second, is free) or a gentler drag (less turn a pixel). Yours.
3. **THE LANDING AFTER A SHATTER (a new call — not built):** THE BLAZE smashes through anything, then the ball lands on the NEXT floor
   unprotected, 0.3 s later, wherever it is — and THE FALL WINDOW only covers gaps. **53 % of the SLOPPY bot's runs end on that
   landing** (GOOD 6.8 %, GREAT 1.3 %): the reward kills the players who earn it least on purpose. The reviewer's count, angle by
   angle: red straight below a shatter point on 22 % of floors 10–39 … 50 % of floors 160–199 (through a GAP above floor 120: 0 %);
   no human-paced escape at all on 0.8 % … 7.8 %. Options: (a) leave it (the genre's
   own risk; a careful player aims the shatter) · (b) the landing right after a shatter is never an out (red there = one more
   shatter, or a bounce) — a rule change · (c) the blaze lasts TWO floors · (d) the layout: nothing red within the human reach below
   ANY slice of floors < 120. Yours.
4. **SOLO HAS A SOFT CEILING:** the layout stops getting harder about four laps into THE TRENCH (8 red, every gap hugged) and the
   bounce + the fall never change — the GREAT bot's median is floor 245, but 1 % of its runs were still falling at floor 600, and a
   steadier hand would reach the 30:00 cap. HIGH RISE answered the same question with "SOLO PAST 200 KEEPS TIGHTENING". Should THE
   TRENCH get a rule of its own (MOVING RED there? a faster darkness?) — or is the cap the end?
5. **A DARING EXPERT IS FASTER THAN "GREAT":** the GREAT bot that air-steers for gaps within 900 units stands on floor 200 at ≈ 2:05
   (and earns TERMINAL VELOCITY in half its runs); the 3:00 cap has room either way. The match ranks finishers by the earlier tick —
   so the dive IS the race. Fine?
6. **MOVING RED** was optional and is not built (THE CALLS MADE) — say if you want it.
7. **HIDING THE APP ENDS A RUN** (the run is on the clock; the darkness takes it within 15 s) — fine for the lab; a decision for F2's
   solo game + the daily.
8. **F4's proof node will be bigger than HIGH RISE's:** a run's packed log is ≈ 4–8 KB (≈ 15 entries a second of dragging; the hard
   ceiling of a 3:00 match is 10,800 entries ≈ 35 KB) against HIGH RISE's 200 taps — the chunking + THE CHUNK CEILING need a look then.
9. Named calls, yours to overrule: the end's words · "the early areas" = floors < 120, THE FALL WINDOW ramping in to floor 160 · NO
   ISLAND · the finish at the tick floor 200 is reached, THE CAP winning a tie · the darkness starting LEAD floors above, **its pace
   starting again at every catch-up** (a ball that stops always has the full 15 s — your "steady pace" read to the letter gives
   12.5–15 s) · the first landing at tick 18 · the daily mode = the match's numbers · the lab's corner RESTART + its hidden mode switch
   during a run.
10. **FOR F2's LOOK (the reviewer):** RED must be more than a colour (its brightness is the greys' — the graybox raises it) · the
    ball is 82–85 % of a slice wide while its CENTRE decides (a near-miss hangs 40 % over the neighbour) · two or three floors down a
    gap shows the next floor's same grey through it (depth darkening or a rim) · the darkness must never dim the ball or its floor.
