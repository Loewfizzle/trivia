# JAYWALK H3 — THE SOLO GAME + THE LOOK FIXES — Nov 16 2026

The plan: docs/games/plan.md "JAYWALK (the owner, Nov 16 — DECIDED, after H2B on his phone)" (Step 0, `4759729a`). The reference:
docs/jaywalk.md ("THE SOLO GAME" · "THE ANTI-CHEAT" · "HOP AGAIN" · "THE END SCREEN" · "HOW TO PLAY" · "WHAT WAITS FOR GO-LIVE"). On the
mini PC. **RULES CHANGED — RE-PUBLISH** (`database.rules.json`: the jw proof node's chunks). **A small RULES-of-the-game change** (the
logs' lengths + gaps — the fairness sims re-run green). **JAYWALK IS NOT PLAYABLE** (THE ONE SWITCH stays off): its solo run is on the
OWNER's phone only. THE BOOT BUDGET was not raised.

The links: **https://neonspeakeasy.com/jaywalk-lab.html** (the lab — OPEN, never reports a score) · **https://neonspeakeasy.com** (the
solo run: the owner's phone — PLAY → JAYWALK · TEST → PLAY NOW).

## Group 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a read): 222 marks, 0 open FIX. THE ADD-ON INBOX: nothing addressed to H3
  (read at the start, after each group's commit, before the final tests).
- H2B's cloud run on `3a724e37`: `tests` green (the harbor job skipped — a ci-tagged push).

## Group 1 — THE LOOK FIXES (the lab + the game view share them) — `33c880cc`
- **The defaults: ZOOM 8 + STRAIGHT** (`camera.js#ANGLE` — one line; the lab keeps both switches; a stored choice still wins).
- **THE LOGS — the rules** (`course.js` + `tuning.js#WATER`): every log its OWN length, 1–4 cells, from the seed — the weights by heat
  (`lenW`: 4 · 14 · 36 · 46 % at the start → 30 · 40 · 22 · 8 % at heat 1000: long ones early, short ones later); UNEVEN gaps (38 % short,
  0.9–1.5 cells; the rest 1.4 + 0 … 1.4–2.6 by heat). **Kept crossable:** a 1-cell log only on a lane at `oneV` 44 or slower with NO water
  lane beside it (a hop log-to-log always lands on ≥ 2 cells), every log's landing window ≥ 26 ticks. `jaywalk-sim`: 2,000 seeds a mode
  green + a new test (all four lengths show up; long 0.7+ early → short 0.6+ late; short AND long gaps on a lane; the same lane on every
  build). `jaywalk-deep`'s hand-built Blackbird scenario now picks a course whose tell is near (the bot arrives at another time: a kid
  who waited a whole lap was caught by the wall — the scenario's trap, not the moment's).
- **THE LOGS — the look** (`models.js#buildLog`): one radius, a true circle, HALF-SUNK, lit on its shoulder + dark down both limbs, bark
  grain along the length, pale ringed ends. **Removed: the moss, the branch stub, and "the dot"** — the dot was the stub's pale sawn face
  (two small concentric circles on the log's shoulder: it read as a pickup). THE WATERLINE = a thin amber ring (the glow shader's new
  shape 7, a stadium ring) + a small ripple ring; the amber = that + a soft light on the water only.
- **THE WATER** (`night-fx.js`): a brighter saturated blue (0.018 · 0.15 · 0.48 → 0.06 · 0.36 · 0.86), lighter moving highlights, a white
  foam line on both banks. **TAIL LIGHTS** (`night.js`): two red glows + two thin short streaks (0.8–1.6 cells), one from each tail light
  — cars, THE BOX TRUCK, the train; the one long trail is gone.
- Three refine passes on the shots (390 × 844 @3, ZOOM 8 STRAIGHT): `Downloads\NEON\jaywalk-h3\h3-water-logs.png` · `-b` · `-lane200` ·
  `h3-car-behind.png` · `h3-truck.png`. The lab check: 101 / 101.

## Groups 2 + 3 — THE SOLO GAME, YOUR TABLE, HOW TO PLAY — `2ff25f07`
What was built is docs/jaywalk.md's five new sections. The calls made here (NEVER STOP TO ASK — each follows an existing pattern):
- **HOP AGAIN's path = a NEW MATCH per run through an INSTANT start** (`js/games/kit/again.js` + the cartridge's pure `soloAgain`), not
  "several runs inside one match" (its own night records + a second report path) and not the console's PLAY AGAIN (~2 s walk inside).
  The night scene is parked over the remount. **Measured: 65–68 ms** from the tap to a course ready to hop (the emulators; + GO's round
  trip on a real network).
- **The seed's read-back is a real `get`** (never the SDK's local estimate of the server's time — a few ms off = another course).
- **A slowed log is CUT, not thrown away** (THE DROP's PFIX-3 rescue): the run counts to its last on-time hop. Ahead of the clock =
  refused outright. `CLOCK`: 2 s ahead · 8 s behind · a chunk a second.
- **THE 45 s GAP no longer holds a JAYWALK solo run** (`QUICK_SOLO`): with every run its own report, most bounced `too_soon` and the
  queue gives up after 8 tries — honest bests would be lost. Solo XP stays capped (4 runs a day); the room matches keep the gap.
- **An UNPROVEN run** when GO is refused / unanswered (THE RULES-LAG's fallback: until the re-publish every jw write is refused on the
  live database — the game still plays, is never counted, ends on its own screen).
- **The board is named FARTHEST RUN** (`jaywalk-solo`; "SOLO BEST" is OVERCLOCK's old double name — B3's test refuses it in the catalog).
- **`LOOKS ['night']`** until H5 (the console then paints NIGHT + shows it LOCKED — the existing one-look rule), **no winner sting / no
  confetti** over a run's end (`OWN_VICTORY_SOUND`; the frame's burst hidden in `css/jaywalk.css`).
- **THE BOOT:** three boot files were touched and TRIMMED so the boot did not grow (6,499.99 → 6,499.94 of 6,500 KB): `core/boards.js`
  (the `jaywalk-solo` row — the server needs the board; `JAYWALK_WAITS.boards` emptied), `ui/help.js` (the help's hub — 16 bytes
  smaller), `screens/title-taps.js` (the owner's shelf row + sign + the card's mark fallback). `help` + `art` + `meta` wait for the
  go-live pass; HOW TO PLAY's content lives in `js/games/jaywalk/help.js`.
- **YOUR TABLE** needed one server read: `/api/profile { action: 'table', b }` (no new function — the 8 stay 8).

## Group 4 — THE CHECKS
- Unit: `tests/jaywalk-solo.test.mjs` (8) + the updated `jaywalk-sim` / `-deep` / `-night` / `-camera` / `-cartridge` / `-server`,
  `registration`, `profiles`, `harbor`, `holdem-owner`, `play-now`.
- Emulators: `rules.test.mjs` (the stamped chunks) · `server.test.mjs` "JAYWALK H3 — THE SOLO RUN" · `e2e-jaywalk.mjs` (the solo run end
  to end, the owner's taps, HOP AGAIN measured, a forged log refused, BACK TO THE CITY) · the lab check (it never writes).
- **PERFORMANCE — the REAL view, 390 × 844 @3, 4× CPU, the bot playing (a quiet machine):**

| tier | fps | frame (ms) | p95 | worst | work a frame (ms) | p95 | draw calls |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 (@3, bloom) | 59.9 | 16.7 | 16.8 | 16.9 | 6.7 | 8.3 | 26 |
| 1 (@2) | 59.9 | 16.7 | 16.8 | 16.9 | 3.3 | 5.0 | 21 |
| 0 (@1.5) | 59.9 | 16.7 | 16.8 | 17.0 | 3.4 | 5.1 | 23 |

## Group 5 — THE CLOSE (the final local run, my own emulators + `DAILY_TEST=1 serve.mjs --emu`, H1's order)
- unit **2,097 / 2,097** (registration + cartridge inside it) · rules **83 / 83** · `/api` server **64 / 64** + progression **10 / 10** +
  friends **10 / 10** · smoke **20 / 20** (THE PAGES LOAD 12 / 12) · e2e-daily **95 / 95** (`DAILY_TEST=1`) · wk-press **43 / 43** · harbor
  `ONLY=cartridge,neon` **42 / 42** · jaywalk-lab **108 / 108** with `--webkit` (it never writes: a stranger's lab makes ZERO server calls)
  · **e2e-jaywalk 48 / 48** with `--perf` · e2e-playnow **20 / 21** — the one red is the KNOWN PRE-EXISTING `lost` case ("the shelf never
  opened" right after BACK TO THE CITY — red on the commit before H1 too; named in H2's + H2B's logs).
- The lab check's WebKit case still expected the old TURNED default on the first final run (107 / 108) — the test fixed, re-run 108 / 108.
- HOP AGAIN, the final run: 64 · 65 · 65 · 67 ms. The final run's perf rows: tier 2 59.9 fps (p95 16.8, worst 17.0, 5.5 ms of work, 28
  calls) · tier 1 59.5 fps (p95 16.8, ONE 66.8 ms frame — a HOP AGAIN's remount inside the window —, 3.1 ms, 23 calls) · tier 0 59.9 fps
  (p95 16.8, worst 17.0, 3.4 ms, 22 calls); the table above is the run before it (no restart inside a window).
- `node scripts/build-file-hashes.mjs` · `build-preload-graph.mjs` (jaywalk: 24 modules, 206 KB past the boot) · `build-boot-preload.mjs`
  (309 modules) · `claude-md-coverage.mjs` (0 missing; CLAUDE.md 36.7 KB — ONE new line).
- ONE tagged push (the ci tag). My servers stopped (the emulators + `serve.mjs --emu` this pass started); Ben's :5190 was not running when
  the pass began and was left as found.
- The shots: `Downloads\NEON\jaywalk-h3\` — `h3-water-logs.png` · `-b` · `-lane200` · `h3-car-behind.png` · `h3-truck.png` ·
  `owner-shelf.png` · `owner-card.png` · `run-start.png` · `run-hops.png` · `end-new-best.png` · `how-to-play.png`.

## REAL vs PLACEHOLDER
docs/jaywalk.md "REAL vs PLACEHOLDER after H3". In short — REAL: the solo game end to end on the owner's phone (the view, the seed after
GO, the proof, the server's replay + the speed check, the best, the end screen, HOP AGAIN, SHARE, YOUR TABLE, HOW TO PLAY) + the look
fixes. PLACEHOLDER: THE BLACKBIRD + THE UFO (and their two cause lines), "THE 6:15", the match screen (H4), `CLOCK`'s numbers + every
number in `tuning.js`, the mix, the day look, the tile.

## OPEN FOR BEN
1. **RE-PUBLISH the rules** — until then a JAYWALK run on his phone plays UNPROVEN (never counted, its own end screen, no instant HOP
   AGAIN podium).
2. **THE 45 s GAP** — H3 lets a JAYWALK SOLO run through it (`QUICK_SOLO`; XP still capped at 4 solo runs a day). Say so if a quick solo
   run should wait like a room match instead (then a best set within 45 s of the last counted run lands late or, after 8 tries, never).
3. **The cause words** are a first pass (CLIPPED BY A HATCHBACK · RUN DOWN BY A VAN · CARRIED OFF BY A LOG · "THE 6:15" …) — one table,
   `causes.js#CAUSE_LINES`.
4. **A bot that plays in real time** passes every check (it is a very good player to the server) — for the review.
5. OPTIONAL, not built (the plan): a ghost of your own best run.
