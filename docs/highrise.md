# HIGH RISE (id `highrise`) — the tower-stacking game

**BEING BUILT — S1 (Nov 18 2026): THE RULES · S2 (Nov 18–19 2026): THE NIGHT LOOK + SOLO on an unlisted test page · S3 (Nov 19 2026):
THE DAY LOOK + THE LOOK SWITCH + THE FLYERS + DEEP SPACE + THE MOTHERSHIP, the 2 cards' art prepared · S4A (Nov 19 2026): THE SOUND
SYNC, THE HIDDEN CARTRIDGE (the owner's phone only, SOLO in a room), COUNTING built end to end — and switched OFF · S4A FIX (Nov 19 2026):
ZERO GARBAGE IN PLAY (the iPhone's stalls), THE WELCOME + THE END (the owner's A picks), the UFO's lamps, the pink tape's white core, THE ICON · S4B (Nov 19–20 2026): THE END SCREEN (JAYWALK's standard), THE LAG CHECK (the pre-warm, `?lean=1`), THE MATCH (2 … 8 players, hidden), THE RULE-SET TABLE, THE LIVE LOCK (a rules change) · S5 (Nov 20 2026): THE PLACE NUMBER + the ranked list in WATCH, 18 s, THE SHARE IMAGE, THE B1 BILLBOARD art (not installed), THE BAKED HUD · THE REVIEW (Nov 20, review only) · REVIEW FIX A (Nov 20): THE TOP HUD, SPECTATE IN SYNC, the match fixes.** A 3D neon
glass-slab tower: one tap drops each slab, the overhang slices off, a PERFECT snaps into place. Its signs read HIGH / RISE stacked.
JAYWALK is its quality benchmark AND its engine formula (docs/jaywalk.md): a pure engine, a result = THE REPLAY of the player's own input
log, a preview on the live site. The owner's decisions: `docs/games/plan.md` "HIGH RISE — S1" · "— S2" · "— S2 FIX" · "— S3" · "— S4A" · "— S4A FIX" (+ its ADD-ONS)
(**NO DAILY for HIGH RISE** — the owner, Nov 18: the seed barely changes play; the engine's daily mode stays unused).

**HIGH RISE IS HIDDEN FROM PLAYERS (S4A)**: a HIDDEN cartridge — its `config.js` GAMES row is `playable: false` + `preview` (BEING BUILT):
no sign, no list, no board tab, no HOW TO PLAY, no meta at boot; **only THE OWNER's phone can start it** ("THE CARTRIDGE", below), and
**NOTHING IS AWARDED UNTIL GO-LIVE** ("THE SWITCH"). Its two addresses stay UNLISTED: **/highrise-play** (THE TEST PAGE — the real game's
two looks, SOLO; its door shut: **NOTHING COUNTS**, zero server calls) and **/highrise-lab** (S1's graybox — never counts). Read this page
before a HIGH RISE pass.

## THE PASSES — INDEX
| pass | date | log | what it built |
| --- | --- | --- | --- |
| S1 — THE RULES | Nov 18 2026 | `docs/games/passes/highrise-s1.md` | the engine, the replay + the judge (server half), the bot sims + the tuned speed curve, THE LAB (/highrise-lab) |
| S2 — THE NIGHT LOOK + SOLO | Nov 18–19 2026 | `docs/games/passes/highrise-s2.md` | THE TEST PAGE (/highrise-play — nothing counts): the glass tower, the cut + sparks, the perfect's ring, grow-back, the night plates + the reflection map, the HUD, YOUR BEST (this phone), the sounds + the audition; the rules: SOLO PAST 200 KEEPS TIGHTENING · the ranking by perfects |
| S2 FIX — THE LAG HUNT | Nov 19 2026 | `docs/games/passes/highrise-s2-fix.md` | the owner's phone check: the lag spikes found + fixed (THE LAG RULES, THE HITCH COUNTER on `?fps=1`), YOUR BEST's tape = a thin gold OUTLINE, THE END's FOOT (the PLAY AGAIN bar), the sounds as MP3 (121 KB) |
| S4A — THE SOUND SYNC + THE HIDDEN CARTRIDGE + COUNTING (OFF) | Nov 19 2026 | `docs/games/passes/highrise-s4a.md` | THE SOUND SYNC (a live run holds the audio context awake — HIGH RISE + JAYWALK), THE HIDDEN CARTRIDGE (the owner's phone only, SOLO in a room — the stage in the console's frame), THE PROOF (the `hr` node + its rules), THE JUDGE on the server, THE SWITCH (counting OFF: judged, WOULD COUNT, nothing awarded), the board, YOUR TABLE, THE NEXT FRIEND's pink tape, the 2 cards in the catalog (hidden) |
| S4A FIX — ZERO GARBAGE + THE WELCOME + THE END | Nov 19 2026 | `docs/games/passes/highrise-s4a-fix.md` | ZERO GARBAGE IN PLAY (a live frame makes no objects — the guard `highrise-alloc.mjs`; three.js as its readable build), THE HITCH COUNTER honest (gc only when seen), the UFO's far-side lamps hidden, the pink tape's white core, THE ICON = THE TOWER, THE WELCOME = A · THE SIGN, THE END = A · THE HERO NUMBER, NO PINK FLASH at a run's end (the console's crown wash), GROW-BACK's five takes |
| S4A FIX 2 — THE ON-PHONE TRACE + THE LANDING FRAME + FLYERS ON REAL TIME | Nov 19 2026 | `docs/games/passes/highrise-s4a-fix2.md` | `?trace=1` (every frame timed in phases; the end card lists THE 5 WORST), THE LANDING FRAME (only the slab + its sound on it — the rest in the next frames, prewarmed, changed ranges only, a static scene), THE FLYERS ON REAL TIME (the UFO's jump at every landing: the sky band off the RESTED camera — `highrise-flypath.mjs`), GROW-BACK FINAL ("Heal Restore") |
| S4B — THE END SCREEN · THE LAG CHECK · THE MATCH · THE RULE-SET TABLE | Nov 19–20 2026 | `docs/games/passes/highrise-s4b.md` | THE END SCREEN = JAYWALK's standard (ONE builder), THE PRE-WARM + `?lean=1` + the repaint audit, THE MATCH (2 … 8 players — the tapes, the tags, the altimeter, WATCH, Call the Winner, REMATCH; the 8-player pixel test), THE RULE-SET TABLE (`rules.js` — every run records its rule set), THE LIVE LOCK (`jw` + `hr` — A RULES CHANGE), "+0 XP · DAILY CAP" |
| S5 — BEN'S NOTES | Nov 20 2026 | `docs/games/passes/highrise-s5.md` | THE PLACE NUMBER (the altimeter gone from live play) + THE RANKED LIST in WATCH, 18 s, THE ANNOUNCER CHECK, zero garbage in a match; THE SHARE IMAGE (JAYWALK's standard — SHARE on the footer); THE POSTER + THE B1 BILLBOARD art + its in-city readability proof; THE EFFECTS REBUILD (THE BAKED HUD — `?lean=<name>` bisect) |
| THE REVIEW (review only) | Nov 20 2026 | `docs/games/passes/highrise-review.md` | a read-only audit before go-live: the engine, the judge + speed SOLID; Ben's HUD + spectate notes measured; the match's host trust (MUST 2 → THE PROOF PASS); the go-live checklist |
| REVIEW FIX A — THE MATCH | Nov 20 2026 | `docs/games/passes/highrise-fix-a.md` | THE TOP HUD (the floor centred, band + clock one narrow line, THE PLACE NUMBER alone top-right, every gap ≥ 16 px), the place ties (floor → perfects), WATCH's list ≤ 5 rows, SPECTATE IN SYNC (the watched player played back 750 ms late — 0 px past a tap), A GO IS NOT A PLAY, a host hiccup at GO no longer unproven, no GHOST all match, YOUR BEST = counted runs only |
| S3 — THE DAY LOOK + THE FLYERS + DEEP SPACE | Nov 19 2026 | `docs/games/passes/highrise-s3.md` | THE DAY LOOK (frosted glass, one sun), THE LOOK SWITCH (AUTO · DAY · NIGHT, a 1.5 s cross-fade, never a hitch), THE FLYERS (the seed's Blackbird OR F-22 pair at 35–45 · the UFO at 85 · THE MOTHERSHIP from ~180), floor 200 (solo: the moment, then DEEP SPACE · `?mode=match`: THE FINISH + the gold card), the sounds final (ALL A), the 2 cards' art prepared |

## THE RULES (the owner's)
- **THE ONE RULE:** the same seed + the same TAP LOG → the exact same run on any phone and on the server (**REPLAY = LIVE**). Integers /
  fixed point only; no float, no `Date` / `Math.random` / `performance` in the rules.
- Square slabs. The slide alternates direction every floor (even floors along x, odd floors along z); THE SEED picks only which end each
  slab enters from (fully off the tower) — and its sweep's small wobble.
- **A DROP** = a tap on the sliding slab (or THE FUSE). The overlap with the slab below, on the slide axis:
  **PERFECT** (within 5 % of the STARTING width — a fixed window, it never shrinks) → it snaps exactly onto the slab below, the streak +1 ·
  **no overlap** → OUT, **MISSED THE STACK** · else the slab is **CUT** to the overlap (the streak ends) — and under 5 % of the start
  width on a side → OUT, **SLIPPED OFF**.
- **GROW-BACK:** after 6 perfects in a row, each further perfect (the 7th in a row and on) adds 4 % of the starting width back on that
  drop's slide axis — never past the start size.
- **THE FUSE:** an untapped slab drops by itself at the end of its 2nd sweep — the SAME drop; if it ends the run the cause is **TOO SLOW**.
- **THE LANDING BEAT:** 12 ticks after each drop there is no slab — a tap then is not a drop (ignored, never logged; the judge refuses a
  log that holds one).
- **THE MODES:** SOLO = endless · MATCH = floor 200 + a 6:00 cap · DAILY = floor 200 + a 5:00 cap (**UNUSED — NO DAILY for HIGH RISE**,
  the owner, Nov 18: the seed barely changes play; the mode stays in the engine). Floor 200 = **MADE IT TO THE
  MOTHERSHIP** (a finish, not an out). The cap ends a run where it stands. **THE RANKING (S2 — the owner, Nov 18):** THE FLOOR
  first; at the SAME floor (above all: the Mothership's finishers — every clean run stands on floor 200 within a second, the curve sets
  the pace) → **THE MOST PERFECTS** → then the EARLIER tick. Match + daily alike (`logic.js#rankCompare` / `standings`); the podium's
  line under a name = `perfectsLine` ("182 PERFECTS").
- **SOLO PAST 200 KEEPS TIGHTENING (S2 — the owner, Nov 18; SOLO only):** S1's curve was HELD from floor 120, so a near-perfect player
  never fell. Past floor 200 the sweep loses 3 ticks every 10 floors (floor 210, 220, …), never under 24 (`tuning.js#TIGHT`) — even a
  near-perfect player falls (the σ 10 ms bot on floor 383, 5:33 in; THE SIMS). MATCH + DAILY end ON floor 200 (their slab 201 never
  enters): **unchanged, tick for tick** — pinned by digests of S1's runs (`tests/highrise-engine.test.mjs` "SOLO PAST 200").
- **HIDING THE APP = NO PAUSE (S2 — the owner, JAYWALK's rule):** the run is on the clock; behind a hidden tab THE FUSE ends it (TOO
  SLOW).
- **FAIR TAPS:** a tap counts at the finger's TOUCH (the pointerdown's `event.timeStamp` → its tick), never "the next frame".

## THE NUMBERS (fixed point — `js/games/highrise/tuning.js`, every number of the rules in one place)
**S4B: the numbers LIVE in `rules.js#RULE_SETS` — the `classic` row; `tuning.js` only names them ("THE RULE-SET TABLE", below).**
| what | value |
| --- | --- |
| the tick | 1/60 s (`TICK_HZ` 60) |
| the STARTING WIDTH (both axes) | `START` 10000 units |
| the PERFECT window | `PERFECT` 500 (\|offset\| ≤ 500) |
| GROW-BACK | `GROW` 400 a perfect once the streak is past `GROW_STREAK` 6, capped at 10000 on that axis |
| TOO THIN | `THIN` 500 (either side under it) |
| the travel | `TRAVEL` ±15000 (1.5 × the start width) round the top slab — at either end even two full-size slabs do not touch |
| THE FUSE | `FUSE_SWEEPS` 2 |
| THE LANDING BEAT | `BEAT` 12 ticks |
| THE SPEED CURVE | `SWEEP` — the ticks ONE sweep takes: **140 at floor 1 → 84 by floor 120 → held to floor 200** (straight line, integers); the seeded wobble `WOBBLE` ±3 ticks, never out of the band [84, 140] |
| SOLO PAST 200 (S2) | `TIGHT` { from 200, every 10, by 3, min 24 }: floor 210 → 81 · 220 → 78 · 300 → 54 · 390 → 27 · from 400 → **24**; the wobble's floor past 200 = 24 (`sweepFloorMin`). Under 30 ticks an ODD sweep has no perfect tick (the slab is never closer than 30000 / (2 S) > 500 units): nobody — no machine — climbs for ever |
| the modes | `MODES` solo { finish null, capTicks null } · match { 200, 21600 } · daily { 200, 18000 } |
| the feats (S3's cards) | `CLOUDS_FLOOR` 60 (`reachedClouds`) · `TOP_FLOOR` 200 (`reachedTop`) |
| the log's bounds | `MAX_TAPS` 20000 (solo; a finishing mode's = its 200 floors) · `SEED_MAX` 64 · `FLOOR_TICKS_MAX` = BEAT + 2 × 140 = 292 |

At the held speed (84 ticks a sweep = 357 units a tick) a pass still has 2–3 PERFECT ticks (33–50 ms); at floor 1, 4–5 (≈ 75 ms);
past floor 200 it narrows a notch every 10 floors (floor 300: 54 ticks a sweep = 1–2 perfect ticks).

## THE ENGINE
`js/games/highrise/` — JAYWALK's split: `tuning.js` (all numbers + MODES) · `engine.js` (the pure step) · `logic.js` (the end's words, the
seed, THE RANKING, the feats) · `replay.js` (the replay, THE JUDGE, the packed log) · `bot.js` (the sim players) · `tower.js` (view-only,
pure: the tower a view draws, built from the events) — S2's view modules: "THE TEST PAGE" on. PURE: no DOM, no
three.js; integers + `Math.floor` / `Math.imul` only; the one import outside the folder is `core/rng.js#hashString` (an integer hash).

**EVENT-DRIVEN.** The slide is a pure function of the tick, so nothing happens between a slab's entry, its drop and the next entry —
the engine jumps from one to the next (a judge's replay costs one step a tap, not one a tick).
- `createRun({ seed, mode })` → the run. The base slab (10000 × 10000, centred on 0) "landed" at tick 0: **the first slab enters at tick 12**.
- `stepTo(run, tick, ev?)` — every entry and every FUSE drop up to that tick, in order. THE CAP ends the run AT its tick, before
  anything else that tick (an entry, a fuse). A tick that is not a whole number moves nothing.
- `tap(run, tick, ev?)` → `true` = it dropped the sliding slab (the caller LOGS the tick) · `false` = no slab to drop then (a landing
  beat, the run over, the log full) — never logged.
- the state (read-only for a view): `floor` · `at` (the tick the last floor landed — THE RANKING's tick) · the top slab's EDGES
  `x0 x1 z0 z1` (integers; `topOf(run)` → `{ cx, cz, w, d }` for a view) · `st` ('beat' | 'slide' | 'out' | 'made' | 'cap') · `s0` `S` `e`
  (the slab's entry tick, its sweep ticks, its entry end ±1) · `streak` `perfects` `maxStreak` `taps` · `cause` ('miss' | 'thin' | 'slow') · `end`.
- `slabAt(run, tick)` → the sliding slab's edges + offset at a tick (a view eases between two ticks itself).
- `resultOf(run)` → `{ floor, tick, end, over, cause ('miss' | 'thin' | 'slow' | 'made' | 'cap' | ''), made, perfects, maxStreak, taps, feats: { reachedClouds, reachedTop } }`.
- **THE EVENTS** (`ev`, for the VIEW — each with its tick `t`): `spawn { floor, axis, from, S }` · `drop { floor, axis, off, fuse }` ·
  `perfect { floor, streak }` · `grow { floor, axis, by }` · `cut { floor, axis, side, piece: { lo, hi, size } }` (the piece's size + side
  are rules data; its fall is the view's) · `land { floor, x0, x1, z0, z1 }` (the slab as it lies) · `out { cause }` · `made` · `cap`.
  A drop's own events come together, in order: `drop` → `perfect` / `grow` / `cut` → `land` | `out`.
- **THE TOWER A VIEW DRAWS** = `tower.js#createTower(run, { onPerfect, onFall })` fed with those events — pure, and the slab lies where
  the engine's own `land` says, so no batching (two drops in one frame, a tap + the fuse with no frame between) can lose or double a slab
  (`tests/highrise-lab.test.mjs` "THE VIEW'S TOWER == THE ENGINE'S" — the fresh-eyes review's find). S2's looks build on it.
- **THE PURE EXTRAS** (view-only, but the same on every phone): `flyerFor(seed)` → 'blackbird' | 'f22' · `paletteFor(seed, floor)` → a
  colour index 0 … 23 (the seed picks where the wheel starts; one step a floor).

**THE TIMELINE of one floor** (a drop at tick `d`): the next slab enters at `s0 = d + 12`; it can be tapped at any tick `s0 … s0 + 2S − 1`;
at `s0 + 2S` THE FUSE drops it. A tap AT the fuse's tick, or AT the cap's tick, is too late. Two drops are never closer than 12 ticks
and never further apart than 292 (the judge's cheap bounds).

**THE SLIDE** (`slideOff(S, e, k)` — `k` ticks after entry): `offset = e × (15000 − floor(30000 × kk / S))`, `kk` = `k` on the first
sweep, `2S − k` on the second — a triangle wave; the floor is taken on the unsigned distance so the two directions mirror exactly (and
never a negative zero). The offset is the slab's low edge minus the top slab's low edge: 0 = dead on, at half a sweep.

**THE DROP's MATH** (integers, on the slide axis; `size` = the top slab's side): `|off| ≤ 500` → PERFECT (the edges = the slab below's;
past a streak of 6: + `min(400, 10000 − size)`, half on each side) — **PERFECT IS JUDGED FIRST** (the plan's order: a slab cut to exactly
500 and dropped exactly 500 off snaps on; pinned by a test) · `|off| ≥ size` → OUT (miss) · else the kept edges are the overlap
(`off > 0`: the low edge moves up by `off`; `off < 0`: the high edge moves down) and a side under 500 → OUT (thin). A missed / slipped
slab does not count as a floor.

**FAIR TAPS in the engine:** `tap(run, T)` takes the tick of the TOUCH, which may be EARLIER than the tick the run was already stepped
to (a frame ran between the finger and the handler). While a slab slides nothing else happens, so the drop at `T` is exact — and the
judge, which plays the log in order, lands on the same state (`tests/highrise-engine.test.mjs` "FAIR TAPS"). The clock → tick mapping is
`logic.js#tickOf` (the NEAREST tick).

**The builder's calls (S1 — the owner may overrule):** the travel is centred on the TOP SLAB (so "dead on" is always half a sweep after
a slab enters, whatever the tower's drift) · PERFECT is judged before "no overlap" · with the travel at ±1.5 widths the fuse's slab is back at its entry end, fully off the
tower — THE FUSE's drop always misses (the code path is still the one drop: only the cause differs) · the base "lands" at tick 0 (a
beat before the first slab) · grow-back is centred on the slab · the cap's words are TIME'S UP (`logic.js#END_WORDS`) · the wobble is
clamped to the band (floor 1 only wobbles faster, the held speed only slower).

## THE JUDGE
`replay.js#judgeRun({ seed, mode, taps })` — ONE function for the phone's check and the server: `{ ok: true, floor, tick, end, cause,
made, perfects, maxStreak, taps, feats }` | `{ ok: false, why }`. The floor is the judge's own replay — there is no field for a claimed one.
**`mode` is REQUIRED** (a missing one is never quietly judged as solo — no finish, no cap). Nothing throws: every hostile input gets its
`{ ok: false, why }`. `taps` = the ticks the player tapped at, rising (`packTaps` / `unpackTaps`: the gaps in base 36, '.' between — S2's
run node; CANONICAL only — `packTaps(unpackTaps(s)) === s` — and a string longer than any log packs to is refused unread: `why: 'log'`).

| refused (`why`) | what |
| --- | --- |
| `mode` | missing, or not 'solo' / 'match' / 'daily' (only the MODES' own names: never 'constructor') |
| `seed` | not 1 … 64 printable ASCII characters, no space (nothing a transport could turn into another seed; `seedOf` makes [0-9a-z]) |
| `taps` | not a list |
| `too many taps` | more taps than the mode has floors (200) / than any run holds (20000) |
| `entry` | a tick that is not a whole number ≥ 0 |
| `ticks not rising` | a tick ≤ the one before it |
| `in the landing beat` | a tap with no slab to drop (closer than 12 ticks to the drop before it; before the first slab) |
| `past the cap` | a tick at / after the mode's cap |
| `after the fuse` | a gap of 292 ticks or more — the fuse had dropped that slab ("a log longer than any honest run could be") |
| `past the end` | a tap after the run was over (an out, the finish, the fuse's own drop) — found by the replay itself |

The cheap bounds (`tapsProblem`) only NAME what the engine's own `tap()` refuses: the judge then replays the log and refuses any tap
that `tap()` returns false for. A log the phone's recorder made (it logs a tick only when `tap()` returned true) always passes.

**THE SERVER HALF:** `api/_lib/highrise.js` — PURE, NOT a function (the 8 stay 8), imports the SAME `js/games/highrise` modules (as
`api/_lib/jaywalk.js` does): `judgeRun` · `judgePacked({ seed, mode, log })` · `serverRow(v)` (the row a report reads) · S4A:
`verifyNode` · `highriseSolo` · `highriseMatch` (S4B's half) · `HIGHRISE_COUNTS`. **WIRED into `/api/report` since S4A — behind THE
SWITCH** ("THE PROOF" + "THE SWITCH", below). `tests/highrise-server.test.mjs`: honest bot logs
accepted, every forged case refused by name, the judge == the live engine for 500 bot runs across all modes.

**FOR S4 (the wiring — S1's review notes; counting moved from S2 to S4, nothing calls the judge yet):** an EMPTY log is an honest run (`ok`, floor 0, TOO SLOW) — a
report must not count it as a play · the judge knows nothing of the SERVER's clock: a perfect log can be computed offline, so the run
node needs JAYWALK's server-timestamped chunks + THE SPEED CHECK (docs/jaywalk.md "THE REPLAY + THE PROOF") · `replay`'s `until` (a
match scored as it stands) takes a whole tick ≥ 0 — a bad one counts nothing · a run is on the wall clock: hiding the app lets THE
FUSE end it (the owner's call for the solo game + the daily).

## THE SIMS
`bot.js`: a bot AIMS AT THE PERFECT MOMENT of each slab (half a sweep after it enters) and taps with a GAUSSIAN timing error σ (its own
seeded rng) — **sloppy 60 ms · casual 40 · good 25 · near-perfect 10**. They play through the real `tap()` (what they log, the judge accepts).
`node scripts/highrise-sim.mjs [seeds]` — 2,000 seeds a bot, solo + match. THE TARGETS (the owner's) set THE SPEED CURVE:
sloppy median 30–60 s · good 2–3 min · near-perfect on floor 200 in ≈ 3:00–4:00, most of its runs · casual between.

**The final table (S2 — 2,000 seeds a bot; SWEEP 140 → 84 by floor 120, ±3; past floor 200: −3 every 10 floors, ≥ 24; PERFECT 500; GROW 400 after 6; BEAT 12):**

| mode | bot | σ ms | time med (p10–p90) | floor med (p10–p90) | ≥ 60 | ≥ 200 | to floor 200 med (p10–p90) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| solo | sloppy | 60 | 0:41 (0:31–0:52) | 30 (23–39) | 0.0 % | 0.0 % | — |
| solo | casual | 40 | 1:10 (0:56–1:27) | 55 (43–70) | 33.4 % | 0.0 % | — |
| solo | good | 25 | 2:20 (1:59–2:45) | 124 (102–152) | 100.0 % | 0.1 % | 3:28 (3:27–3:28) |
| solo | near-perfect | 10 | **5:33 (5:22–5:40)** | **383 (359–398)** | 100.0 % | 100.0 % | 3:28 (3:28–3:28) |
| match | sloppy | 60 | 0:41 (0:31–0:52) | 30 (23–39) | 0.0 % | 0.0 % | — |
| match | casual | 40 | 1:10 (0:56–1:27) | 55 (43–70) | 33.4 % | 0.0 % | — |
| match | good | 25 | 2:20 (1:59–2:45) | 124 (102–152) | 100.0 % | 0.1 % | 3:28 (3:27–3:28) |
| match | near-perfect | 10 | 3:28 (3:28–3:28) | 200 (200–200) | 100.0 % | 100.0 % | 3:28 (3:28–3:28) |

(S1's table is the same but for the solo near-perfect row: it was never out — all 2,000 runs stopped at floor 1200. With the
tightening a 7-ms player falls on floor ≈ 418, a 5-ms machine on ≈ 447 at 5:59: the game's ceiling is about six minutes.)
What changed from the starting numbers, and why: `docs/games/passes/highrise-s1.md` "THE TUNING" + `highrise-s2.md` "THE TUNING".
`tests/highrise-sim.test.mjs` = the FAST version (200 seeds) asserting the bands — a future tuning slip goes red there.

## THE LAB
**https://neonspeakeasy.com/highrise-lab** — `highrise-lab.html` (the site root — it deploys; noindex nofollow; linked from nowhere) +
`js/games/highrise/lab.js` + `graybox.js` + `css/highrise.css` (prefix `hi-`). Open to anyone with the link.
- **THE GRAYBOX** (three.js 0.160 — the same import map as jaywalk-lab.html): flat-shaded boxes; **THE DIAGONAL CAMERA** the real game
  will use (`graybox.js#CAM`: turned 45°, 33° down, a narrow 20° lens) climbing with the top slab; the first slab = 60 % of the screen
  width (on a wide screen, of a phone-shaped column — DESKTOP COMES FREE); the cut piece just falls away; a PERFECT flashes the top
  edge white. It builds its own tower from the engine's EVENTS (the lab's check: its top == the engine's).
- **Tap anywhere to drop** — the pointerdown's `event.timeStamp` → its tick (FAIR TAPS). The first touch only STARTS the run (tick 0 =
  that touch); TAP TO RETRY is the next run's start (the end's words stay 0.6 s first). Space / Enter on a keyboard.
- **THE HUD** (plain text, readable at 390 × 844): FLOOR big at the top · STREAK · the mode + its clock · SOLO / MATCH / DAILY (`?mode=`) ·
  the seed (`?seed=` = the same slabs on every retry; else a random one, shown) · on OUT the cause's words big in the middle band (between
  the HUD and the top slab — the falling slab stays in view) + TAP TO RETRY. The mode switch + the seed are OFF the screen while a run is
  live (a thumb at the foot is a drop, never a restart) and back with the end's words.
- **After every run** the recorded log is replayed through a FRESH engine: **REPLAY = LIVE ✓** (or ✗ + the first differing tick).
  `?fps=1` = a frame-rate readout.
- **THE LAB NEVER COUNTS:** zero `fetch` / XHR / web socket / Firebase; it imports nothing from `/api`, the profile, progression, the
  report, share or the cards; nothing is stored. EVERY import is STATIC (its own engine files + `core/rng.js` + three.js): no dynamic
  import, so not even the skew wrapper's deploy check can run. No web font (the HUD is the system's monospace). (Precisely: this is the
  PAGE. On a phone the site's service worker already controls, `sw.js` itself asks `GET /api/time` at any navigation in its scope — ONE
  DEPLOY AT A TIME's build check, read-only, the same for /jaywalk-lab and every page; nothing of the run is in it.)
- **The tests:** `tests/highrise-lab.test.mjs` (unit — the page, the WHOLE module graph walked and proven clean, HIGH RISE invisible) +
  `tests/integration/highrise-lab.mjs "<chromium>" [outDir]` (the browser half, outside the sandbox: the lab at 390 × 844, a bot run
  through REAL taps, NO request but the page's own static files + the three.js CDN, no counted module, REPLAY = LIVE ✓, the shots).
  THE PAGES LOAD (`kit/page-loads.mjs`) opens it in the smoke test. The page's hook for the checks: `window.__hiLab`.

## THE TEST PAGE — https://neonspeakeasy.com/highrise-play (S2 — `highrise-play.html` · `js/games/highrise/play.js` + `stage.js` · `css/highrise-play.css`)
The real game's two looks + SOLO, on the live site, on a phone: the owner tests on cellular, his brother from a shared link.
**S4A: its run loop is `stage.js` — ONE module the page AND the cartridge mount** (the scene, the HUD, YOUR BEST, the flyers, the
sounds); `play.js` = the page itself: THE DOOR, its `?…` flags, its best (`hi:play:best`), and `createStage(app, { page: true, … })` —
the page's own pieces (the look switch, the SOUNDS list, the note, its own end card every run) are behind `o.page`. The page hands the
stage no proof, no report, no friends: it still counts nothing (`tests/highrise-play.test.mjs`).
**UNLISTED** (noindex nofollow; no page, no script, no manifest names it), **OPEN** (no gate, no sign-in). `?seed=` (the same slabs
every run) · `?fps=1` (the frame rate + **THE HITCH COUNTER** — below) · `?tier=0|1|2` (pins a quality tier) · `?mode=match|daily` (the
finish + the cap — **`?mode=match` = THE FINISH's preview**, S3: floor 200 → the white-gold light → the gold card; the page itself is
SOLO) · `?look=day|night` (S3: that look for this visit — nothing stored) · **`?floor=N`** (S3 — the LOOK CHECK, the JAYWALK lab's
`?lane=N`: the START tap plays N clean drops at once through the real engine and the run goes on LIVE from floor N — the flyby from
~30, the UFO from ~80, THE MOTHERSHIP + floor 200 from ~190, the finish with `?mode=match&floor=193`; REPLAY = LIVE holds; it never
moves YOUR BEST; the note says FROM FLOOR N).
- **NOTHING COUNTS UNTIL GO-LIVE (the owner, Nov 18):** no XP, no streak, no server best, no YOUR TABLE, no cards, no share card —
  scores start clean at launch (the tuning may still change). The run is the pure engine in the tab: **ZERO server calls, ZERO database
  writes**; the page's whole module graph (static + lazy) holds nothing from `/api`, the profile, progression, the report, share, the
  cards, Firebase or the store (`tests/highrise-play.test.mjs`). Its only requests: its own static files (its modules, the plates, the
  reflection maps, the sounds; S3: + the site's sun rule for AUTO — `games/kit/look.js` → `core/sky.js` + the three pure modules it
  reads —, the flyers' models `assets/jaywalk/models/{blackbird,ufo}.glb` + `assets/highrise/models/f22.glb` + JAYWALK's GLB reader, the
  city's four jet / UFO sound files), three.js from the import map's CDN, the fonts. Its only storage: `hi:play:best` (YOUR BEST —
  THIS PHONE) + `hi:play:look` (S3: the look's choice; S2's `hi:play:snd:<id>` picks are gone — the owner's are final; S4A FIX's `hi:play:snd:grow-back` too since S4A FIX 2: cleared once). COUNTING (the judge wired into `/api`, the solo run node + the match proof node = ONE
  rules change) is S4.
- **THE DOOR (`play.js`, before the page mounts):** a shared module may call the server from wherever it runs — today the audio engine
  COUNTS a leave once (CITY G: `errlog.js#countQuiet('snd')` → one anonymous beacon to `/api/log`) and the skew wrapper asks `/api/time`
  if a module fails to link. On THIS page `fetch` + `sendBeacon` to `/api/…` stop before they leave the phone. PROVEN in the browser
  check: the page hidden with its sound on → the counter's module loads, **0 requests to `/api/`**. (The site's service worker, on a
  phone it already controls, still asks `/api/time` at a navigation — ONE DEPLOY AT A TIME, the same for every page; not the page's code.)
- **THE RUN** (`stage.js`): tick 0 = the START touch (S4A: START first waits ≤ 0.6 s for every sound's decode — "THE SOUND SYNC"); FAIR TAPS (the pointerdown's `event.timeStamp` → its tick); a tap in a landing
  beat is never logged; the events of a frame → `tower.js` (the engine's own `land`) → the view's moments → the sounds' cues. **NO
  PAUSE**: the clock runs on behind a hidden tab — back from it THE FUSE has ended the run (TOO SLOW; its batch sounds only its OUT:
  `LATE_MS` 900). While a run is LIVE the SOUNDS button + the foot note are off the screen (a thumb anywhere is a drop). THE END CARD
  comes 0.7 s after EVERY end — the fuse's or a tap's (the missed slab is seen falling) — and stays 0.6 s before a tap is PLAY AGAIN (a new seed).
  **REPLAY = LIVE ✓** under every end (the tap log through a FRESH engine, event by event — the owner's determinism check on a real iPhone).
- **THE HUD** (DOM over the canvas; written only when it changes; no layout read in the frame — the sizes are a ResizeObserver's): the
  big FLOOR NUMBER (84 px, each digit its own box; gold once YOUR BEST is passed) · THE BAND's NAME under it (it swells + lights up at
  an arrival) · THE ANNOUNCER LANE under that, one call at a time, a bigger moment never wiped by a smaller: PERFECT · PERFECT ×N ·
  STREAK ×10 (every 10) · NEW BEST (gold) · FASTER (every notch of the tightening past 200 — under a bigger call it waits its turn).
  Its one-shot + the band's arrival are Web Animations (opacity + transform; restarted with NO forced layout). (The altimeter = the match, S4.)
- **THE WELCOME = "A · THE SIGN"** (S4A FIX — the owner's pick, `Downloads\NEON\highrise-welcome-A.png`; the page AND the cartridge's
  start — the same stage, both looks): **no box, no panel — full-bleed.** The sign BIG in the sky (HIGH a pink neon edge + glow, RISE a
  blue one, white faces — 88 px at 390 wide: `--hi-w` × 0.225) · **STACK IT AS HIGH AS YOU DARE** under it · the three look choices
  under that (the test page) · **the real tower standing LOW** (its top ≈ 70 % down — `night.js#pose('welcome')`: the camera eases
  between its three poses, `POSE`) with **a first slab already sliding in from the far left** in the sign's pink + its soft trail
  (`night.js#welcome` — it fades the moment the run starts; always from the left, as the mockup: the run's real first slab comes from
  its seed's side) · **YOUR BEST = the real gold tape round the top slab + its right-edge tag BEST 119** (none on a first visit) ·
  **TAP TO START** big (26 px, the pink glow) + ONE TAP DROPS EACH SLAB in a soft dark fade at the foot. ONE shade layer (`.hi-shade`:
  the sky at the top, the foot) sits behind the words of both screens — off while a run is live.
- **THE END = "A · THE HERO NUMBER"** (S4A FIX — the owner's pick, `…\highrise-end-A.png`; `endscreen.js#endCard` — ONE builder for
  the page's own card AND the cartridge's body in the console's podium frame): the CAUSE small in the accent (gold for MADE IT TO THE
  MOTHERSHIP — it still waits 2.6 s, `MADE_HOLD_MS`, for THE FINISH's light) → **THE FLOOR NUMBER huge** (150 px at 390 wide, the cyan
  glow) → FLOOR · THE BAND → **THE STATS STRIP** — PERFECTS · BEST STREAK · YOUR BEST between two hairlines with thin dividers, the best
  in gold, **NEW BEST** its label when the run beat it. **THE TOWER STAYS LIT under it** (the pose `end`; the podium frame has no
  backing of its own, no kicker / winner block in a solo run): **YOUR BEST still above you = the gold outline DASHED, floating clear
  over the top slab** (the tape's own program: `uDash`; `night.js#ghostUp` — never thinner than a readable V) + **BEST 119 ↑** beside
  it (OVER the arm's end where the screen's edge leaves no room beside the corner — `GHOST_TAG_UP`: never struck through by the
  dashes); **a NEW BEST = the solid gold tape round the top slab** with its flash. The small lines sit just over the PLAY AGAIN bar, never
  in the strip: WOULD COUNT (the cartridge) · REPLAY = LIVE (the test page alone). The right-edge tags have four modes (the welcome · a
  live run · the end · none — `stage.js#placeTags`). (A file named `…card.js` would trip the page's no-cards request guard: `endscreen.js`.)
- **NO PINK FLASH AT THE END (S4A FIX — the owner's iPhone):** the CONSOLE crowns its podium frame 2.5 s after it stands
  (`css/components.css .final.crowned::before` — the game's accent at 55 % over the whole screen for 0.6 s: a winner's flash); HIGH
  RISE's accent is hot pink and its end is how a tower fell → `.hi-final .final::before { display: none; }`. The watch
  (`tests/integration/kit/flash-watch.mjs` — the compositor's own screencast frames, each one's pink share; a frame 22 points over its
  before / after = a flash) runs in `e2e-highrise.mjs` (the end + PLAY AGAIN) and `highrise-play.mjs` (every cause, both looks).
- **THE END's FOOT (S2 FIX — END-SCREEN STANDARD A, the owner):** ONE big SOLID glowing **PLAY AGAIN** bar at the foot of the end
  screen, in HIGH RISE's accent (`--hi-accent` — its sign's hot pink `#ff4fd8`, dark ink): full width inside the 16 pt gutters, 62 pt
  tall (58 on a short phone), a rounded RECTANGLE (8 px corners — never a pill), the replay arrow + the words, the glow static, on its
  OWN press + lift. **A tap ANYWHERE after 0.6 s is still PLAY AGAIN** — and the bar keeps the same wait (it comes up where the thumb
  was dropping slabs: a rhythm's next tap must not wipe the card unread). The card's own "TAP TO PLAY AGAIN" line is gone (one cue).
  With `?fps=1` the fps line moves up, clear of the bar. (The page builds its own bar — it loads no `ui/final.js`.)
- **THE HITCH COUNTER (S2 FIX; HONEST since S4A FIX — `?fps=1`: `HITCH 3 (last: gc 41 ms @83 · gc 2 dom 1) · GC 14`):** the frames
  over **33 ms** in THIS run (after its first second; a tab that was away is not one; and over 1.5 × the phone's own usual frame — Low
  Power Mode draws at 30 Hz: none of them a hitch), **counted BY CAUSE**, + the last one's cause and floor — for the owner's screenshot.
  A cause = what is KNOWN about the frame before: **plate** (a backdrop uploaded) · **compile** (a program built / the tier stepped) ·
  **audio** (a decode landed / the limiter built) · **gc** — ONLY when a collection is KNOWN to have run in the stall: a canary object
  held by a `WeakRef` + a `FinalizationRegistry` (both in Safari; the canary is asked only while a stall is being named — never in a
  plain frame) · **dom** (the HUD was written in that frame) · **tap** (a touch landed in it) · **work** (the page's own frame code
  took over 12 ms) · **unknown** (none of those — never guessed as gc). **GC n** = the collections seen this run.
  `window.__hiPlay.hitches()` = the list + `by` (the counts) + `gcs`.
- **THE TRACE (S4A FIX 2 — `?trace=1`, `trace.js`; the Beelink can not make an iPhone stall, so the phone measures itself):** every
  frame timed in PHASES with `performance.now` — `tap` (the touch handler's engine step) · `engine` · `fx` (the tower's feed + the
  view's events) · `audio` · `view` (the camera, the plates, the boxes) · `flyers` · `render` · `bloom` · `hud` · `other` — into
  typed arrays made once (nothing built in a frame; off = `null`, one `if (TR)` a call site). A frame's GAP is charged to the record
  before it (that frame's phases + any touch handled after it); what the page's own code did not take of it, past one usual frame,
  is **browser** (a collection, the browser's own style / layout / paint, the GPU — never guessed at). **THE END CARD** (the test
  page; under the stats strip, 12 px, a dark plate) lists **THE 5 WORST FRAMES** — total ms · the floor · what happened (land ·
  perfect · cut · seam · flyer · grow · out · plate · compile · decode · later = the landing's deferred work) · the top 2 phases —
  + one line: **the frames over 33 ms by their top phase**. `window.__hiPlay.trace()` = the same as data (+ every landing frame's
  work: `land` mean / p95 / max). The cartridge's end is the console's podium: not there (the test page is the owner's measure).
- **DESKTOP COMES FREE:** a wide screen gets the phone's own column (0.6 of the height wide), centred.
- **THE LOST CONTEXT** (JAYWALK's lesson): `webglcontextlost` → the scene is REBUILT — destroyed + created again on the SAME tower
  object, tier + gold tape — the moment the context is restored, or after 1.5 s; the listeners come OFF before any destroy (its own
  `forceContextLoss` is never "lost"). The browser check loses a context on purpose mid-run: a new canvas within 1.5 s, the run never stopped.
  A rebuild that gets NO context says so and KEEPS TRYING (every 1.5 s, eight times, and at once when the page is back in front) — the
  run goes on meanwhile. The glass shader asks for `derivatives`: it builds on a WebGL 1 phone too.
- **Locally:** `http://localhost:5173/highrise-play` · `node tests/integration/highrise-play.mjs "<chromium>" [outDir] [--look] [--perf]`
  (`--look` = the review's shots in BOTH looks: every band, the moments, YOUR BEST, the end, the sizes (`LOOKS=day`) · `--fly` = the
  flyers' shots · `--perf` = the measure (`PERF_Q='&look=day'`) · `--webkit` = Playwright's WebKit as an iPhone · `--review` = S2's
  fresh-eyes finds · `--s3` = S3's checks alone · `--hitch` = the long run, `HITCH_Q='&look=day'` by day). THE PAGES LOAD
  covers it. The page's hook for the checks: `window.__hiPlay` (`climb(n, off)` = real drops through the real engine, played at once · S3: `pickLook` /
  `setLook` / `look()` · `plan()` · `fly(kind)` · `flyInfo()`).

## THE NIGHT LOOK (S2 — `night.js` + `night-fx.js`; three.js 0.160 core only, its READABLE build (S4A FIX — THE LAG RULES 7) — the bloom + the sparks are ours)
A VIEW: it reads the run + the tower the page builds from the events; it never writes them; the rules never import it.
- **THE GLASS** — smoked glass + neon edges, **NOT three.js transmission**: ONE instanced mesh for EVERY box on screen (the slabs, the
  building's floors under the first slab, the sliding slab + its trail, the falling pieces, YOUR BEST's tape — `BOXES` 55) on a custom
  shader: the slab's colour as dark glass (the top face the brightest with a soft sheen, the left face lit, the right in shade, each
  side brighter up at its lit edge) · **THE REFLECTION MAP** (below) held in + half-tinted by the glass · a fresnel lift · **THE LIT
  EDGES** drawn from each face's own distance to its border (crisp at any size, no texture; a white-hot core + a halo in the slab's
  colour) · the tower dims as it falls away under the top slab (`uFadeH`). The sliding slab: a stronger colour, a brighter edge, a
  short trail behind it (tier ≥ 1).
- **THE BUILDING** under the first slab = full-size floors of the same glass, each its own colour: a tower from the first second.
- **THE CUT**: the overhang tumbles away (8 pooled pieces, fading) in **GPU SPARKS** along the cut (a spark = its start + its throw +
  its birth; the shader flies it under gravity as a streak — nothing is stepped on the CPU; 224 in a ring buffer; 12 / 22 / 34 a cut by
  tier; none with reduce motion). **A PERFECT**: the slab flashes white-hot + **A RING OF LIGHT** runs off its outline (the distance
  to its rectangle, in a shader; it reaches further as the streak grows). **GROW-BACK**: the slab swells out from the size it snapped
  to (240 ms) + a second ring in its colour. A landing: the edges flare + a small camera dip (none with reduce motion). A miss: the
  whole slab falls.
- **THE CAMERA** = `camera.js` (the lab's diagonal camera — 45° turn, 33° down, a 20° lens, the first slab 60 % of the screen's width;
  pinned equal to `graybox.js#CAM` by a test), climbing with the top slab.
- **TIERS** (the match kit's `createTiers`, automatic): **2** = the device's sharpness (DPR ≤ 3) + THE HALF-RES BLOOM (every material's
  `uBloom` pass — its lit edges, the sparks, the rings; the glass itself black, still hiding what is behind it — a half-res target,
  blurred at a quarter, added back) · **1** = DPR ≤ 2, no bloom · **0** = DPR ≤ 1.5, fewer sparks, no trail. **THE WARM FRAME**: one of
  everything far under the tower + one hidden frame (the bloom too) before the first slab moves. A resize only ASKS — the frame
  resizes first, then renders.
- **THE LAG RULES (S2 FIX — the owner felt random lag spikes at 60 fps; `docs/games/passes/highrise-s2-fix.md` has the numbers) —
  nothing is DECODED, COMPILED or THROWN AWAY in a frame:**
  (1) **A PLATE IS DECODED + UPLOADED AHEAD** — its bytes → `createImageBitmap` (decoded off the main thread; an `<img>.decode()` where
  it is missing) → `renderer.initTexture` AT ONCE, a whole band before the seam that first shows it (three's `TextureLoader` hands the
  GPU an `<img>`, decoded at its first draw: a 33–50 ms frame at every seam). An ImageBitmap's first row is at v = 0: the plate
  shader flips it (`uFlipA / uFlipB`).
  (2) **THE BLOOM PASS DRAWS TWINS** — a material drawn to the screen AND into a render target changes program each time in three.js
  (the target's colour space): it re-worked the program's whole key SIX times a frame — ≈ 2.7 MB of garbage a second. Every mesh has
  a twin material (the same shader, the SAME uniforms object) that is only ever drawn in the bloom pass (`night-fx.js#createBloom`
  "twins"). A NEW material that the bloom pass draws needs its twin (`night.js#twin`).
  (3) **THE WARM FRAME BUILDS EVERYTHING** — the tape's program too; a program built in a later frame is counted (`compile`).
  (4) **THE BLOOM IS KEPT through a tier step down** (Low Power Mode's probe steps 2 → 1 → 2 within four seconds — it used to throw
  the bloom's programs + targets away and build them again mid-run); it is built + drawn at tier 2 only.
  (5) **NO GARBAGE IN A FRAME THAT CHANGES NOTHING**: the HUD compares two numbers (no text built), the tag is written only when it
  moved, the plates' list is walked only at a seam's edge, the tier rule is asked six times a second (each asking sorts its samples).
  (6) **THE SOUNDS' one-off work is done at the unlock** — the decode AND the limiter (not in the first drop's frame).
  (7) **ZERO GARBAGE IN PLAY (S4A FIX — the owner's iPhone: one 2–3-frame stall a floor, the collector's):** **a LIVE FRAME MAKES NO
  OBJECTS** — no list, record, closure, spread, string or bound function in anything that runs every frame (`stage.js#frame`, the
  view's `draw`, the flyers, the tower's feed, the sounds' cues, the fps line, the kit's tier rule). What is left is what a LANDING
  changes (its new words, the engine's events, one buffer source a sound). HOW: the frame's fractions live in typed scratch arrays
  (`night.js NUM / IO / BX / LG`, `stage.js FS` — never a variable two functions share: an engine boxes it), records are WRITTEN
  INTO (`engine.js#slabInto`, `bands.js#plateMixInto` + `hazeInto`; the old calls stay for the tests), rings for the frame times /
  the logs, the tower's slabs + the sounds' voices are POOLS, the cues are constants, the HUD's digits keep their boxes, the two
  right-edge tags are placed ONCE A LANDING and a CSS transition rides them (never a style write a frame), **no function that runs
  every frame holds an inner function** (its record is made at every call), the camera only SLIDES (its turn worked out once), the
  draw order is fixed once (`renderer.sortObjects = false` — the scene's children sorted by `renderOrder` at build), a uniform is
  written only when it changed. **three.js is its READABLE build on every page** (`three.module.js`, the same pinned 0.160.0: the
  minified build's minifier folded `setProgram` into its caller as a function made + called on the spot — a closure at EVERY draw call).
  THE GUARD: `node tests/integration/highrise-alloc.mjs "<chromium>"` (Chromium's allocation sampler, 30 s a look with a flyer in the
  sky — FAILS if the game's own code makes over **12 KB of objects a second** (measured: 3–6) or three.js over its line: 45 by night ·
  20 by day; `--table` = the pass's table) + `tests/highrise-zero-garbage.test.mjs` (STATIC: every frame function's source is scanned).
  Chromium's BOXED NUMBERS (12-byte fractions in functions its optimizer has not reached — `draw` stays in its first tiers) are
  counted apart and not guarded: Safari keeps a fraction in the value itself. Numbers: the pass log.
  (8) **THE LANDING FRAME DOES ONLY WHAT MUST BE INSTANT (S4A FIX 2 — the owner's iPhone named "tap" its biggest cause):** the slab
  snapped into place (+ the overhang it lost, beside it — one box record) and its flash; its sound already started IN THE TOUCH
  (THE SOUND SYNC). The rest waits: the HUD's moments (the announcer, a band's arrival, YOUR BEST / a friend crossed, a flyer's start,
  their extra sounds) are read off the run's kept events the NEXT frame (`stage.js LATER_MOMENTS`), the big number + the band's
  name two frames after (`LATER_NUM` — a flyer's fetch / THE MOTHERSHIP's hull never on the landing frame either), the right-edge
  tags three (`LATER_TAGS`); a perfect's RING, grow-back's and a cut's SPARK BURST are JOBS for the next frame (`night.js` — a queue
  of 8, its numbers in one typed array). **PREWARM:** the falling pieces' turned boxes in THE WARM FRAME, every announcer length's
  animation made ahead, the band's swell kept. **ONLY THE CHANGED RANGE goes to the GPU** (three's own kept `_updateRange` — its
  `addUpdateRange()` makes a record each call): the boxes drawn this frame, the sparks written since the last, the lights lit.
  **A STATIC SCENE:** no mesh composes its matrix a frame (`matrixAutoUpdate` off; a tape's is set when it is laid, a flyer's when it
  moves) and the scene is walked ONCE a frame (`draw` → `scene.updateMatrixWorld()`), never again by each bloom pass. Measured
  (Chromium 4× CPU, `highrise-landing.mjs`): the landing frame's own work **2.30 → 1.66 ms** mean (under a plain frame's 1.68),
  p95 3.9 → 2.4, max 7.6 → 3.5.
- **MEASURED (the mini PC, 390 × 844 @3, the bot playing high in the clouds — a cut + its sparks every third drop; `--perf`):**
  **60.0 fps at every tier at 1× and 4× CPU** (p95 ≤ 17.3 ms, no frame over 18 ms) · tier 2: 10 draw calls a frame (4 the picture +
  the bloom's 6), ≈ 1,950 triangles · tiers 1 / 0: 4 calls, ≈ 970 triangles. A desktop GPU's numbers — the tiers are the phone's margin.

## THE DAY LOOK (S3 — the SAME scene + the SAME programs: `night.js` · `night-fx.js` `uDay` · `bands.js`; the owner's mockup: `Downloads\grok\highrise\mockups\highrise-day.png`)
Night = smoked glass + neon; day = **frosted glass in the sun**. The look is a VIEW (no rule, no replay, no server file knows it).
- **ONE SET OF PROGRAMS**: every material carries `uDay` (0 night … 1 day); the day's maths sit behind it, the night's are untouched at 0
  — so a look switch **builds nothing** (THE LAG RULES) and can cross-fade.
- **THE GLASS by day** (`GLASS_F`'s day branch): a milky body with **the band's pastel showing through the MIDDLE of each side face**
  (frosted toward the rims); **ONE SUN** behind the tower on the left (`night.js#SUN` −0.42 · 0.78 · 0.46) + the sky's cool fill — the
  top the brightest (warm where it faces the sun, cool away from it — never plain white: it keeps the band's tint), the face turned
  to the sun lit, **the other clearly darker + more saturated** (the fresh-eyes review: the two sides must read apart at phone size);
  **the slab above throws its shadow on a ledge** (each box is told the slab lying on it: `aUp` — a soft contact shadow + the cast
  one, on the side away from the sun); **a chrome rim** (a THIN bright line where it catches the sun + a darker line just inside it
  that is seen — polished metal reads by its contrast, a thick white line read as a line drawing); the
  DAY reflection map mirrored in it; **a soft glint** slanting down the lit face of the whole tower (it rides with the camera); **a
  light height haze** in the band's own air (`bands.js#DAY_HAZE`) where the night dims to black. **No bloom by day** (it fades with
  the night through a switch).
- **THE SLIDING SLAB by day** = **its band's ACCENT at full strength** (`bands.js#sliderColor`: the floor's pastel pulled 70 % of the
  way to `DAY_ACCENT` — a silver / white step would vanish on a sunlit sky) + a white-hot rim and its faces lifting to white toward
  the rim: the clearest thing on the screen. When it lands it is its floor's pastel (the landing's flare covers the turn).
- **THE DAY's LIGHTS ARE PAINT**: the sparks, the rings, the flyers' lights are drawn ONE · ONE_MINUS_SRC_ALPHA — by night their alpha is
  0 (added light, exactly as before), by day they are paint in their own colour: **a cut's sparks WARM GOLD** (1.7 × the night's
  size — paint must be seen), **a perfect's ring GOLD-WHITE** with a white-hot heart (gone sooner than the night's: a faint ring left
  hanging read as a smudge). **The gold tape** by day is **twice as thick** + gets **a darker outline** on both sides (no glow, no
  back edges: frosted glass is not seen through).
- **THE DAY BAND COLOURS** (`bands.js#SLAB_SETS.day` — the owner's pairs): rooftops = warm teal / white · skyline = sky blue / silver ·
  clouds = peach / rose · stars = deep blue / ice · deep space = violet / aurora. The day plates 4 + 5 are dark (the edge of space,
  deep space): there the day look is frosted glass on a dark sky.
- **THE WORDS BY DAY** (`css/highrise-play.css` `.hi-stage[data-sky='bright']`): **dark navy `#0d1740` on a soft LIGHT HALO** — the
  number, the band's name, the calls, the start + end screens; **GOLD by day = a bright amber-gold `#ffb81f` with a NAVY EDGE** (the
  mockup's own PERFECT ×7 — the number past YOUR BEST, PERFECT / STREAK / NEW BEST, the best lines; a dark gold read as rust: the
  fresh-eyes review); the PLAY AGAIN bar keeps HIGH RISE's hot pink; the tag + the note keep their own dark strips. **`data-sky`** = `bands.js#skyTone(look, floor)`: `bright` by day
  up to floor ~108, **`dark` from THE STARS up** (the day plates are dark there — the words go back to light) and always by night.
  Measured on the real pixels (the letters against what is right round them — `--s3`): the number 8.7–8.9 : 1 (gold, a navy edge),
  the band's name 6.4–12 : 1 (navy on its halo — the 6.4 over the clouds plate's royal blue).

## THE LOOK SWITCH (S3 — `look.js` · `play.js` · `night.js#setLook`)
- **AUTO · DAY · NIGHT on the START screen**: three plain neon-underline choices under the sign (≥ 44 pt, no pill, no label — they
  say what they are, and the row sits over the open water between the banks), each on its OWN press + lift (never the START tap); **remembered on this phone** (`hi:play:look`, try / catch); `?look=day|night` = that look for
  a visit. **AUTO = the real sun, by THE SITE's OWN SUN RULE** (`games/kit/look.js#sunUpNow` → `core/sky.js`: the city's sun at this
  phone's place — the same rule JAYWALK's GAME LOOK uses), asked again every minute; before it has answered (a lazy module) the
  clock's own guess (day 7–19) — its first answer before a run snaps, later ones cross-fade. (At go-live the game reads the
  console's GAME LOOK — `body[data-look]` — like every game; this switch is the test page's.)
- **THE SWITCH NEVER HITCHES**: `setLook` first brings the OTHER look's pictures in — the current band's two plates + its reflection
  map, all through the decode-ahead loader (bytes → `createImageBitmap` → `initTexture`) — and only THEN cross-fades over **1.5 s**
  (`LOOK_FADE_MS`; it never waits longer than 5 s for them). The plate shader holds BOTH looks' pairs (`tA tB` night · `tC tD` day —
  one program, one draw); the slabs' colours are blended in step. **Settled, only the look on screen keeps its plates + its
  reflection map** (`holds(look)`); a run in one look never even asks for the other's files. The page's words turn half way
  (`data-look`). Measured: a switch mid-run = **0 hitches, 0 new programs** (`--s3`).

## THE FLYERS (S3 — `flyplan.js` (PURE: when + which) · `flyers.js` (a LAZY module: the flying + its sounds) · `night.js`'s stage · `night-fx.js` `FLY_*` / `LIGHT_*`)
**SPECTACLE ONLY — never a hazard, never over the play zone, never under the HUD's numbers.** A VIEW: the rules know nothing of it.
- **THE PLAN** (`flyplan.js#flyPlan(seed)` — the same on every phone): **THE SKYLINE FLYBY** on a seeded floor **35 … 45** — the seed's
  `engine.js#flyerFor` picks ONE: **THE BLACKBIRD** alone, or **TWO F-22s in formation** — + the side it comes from · **THE UFO at
  floor 85** · **THE MOTHERSHIP** seen from ~178, colossal at **200**. A landing starts its moment (`flyDue` — two floors late still
  counts; further, it is missed).
- **LAZY, AND NEVER A HITCH**: `flyers.js` is fetched from **floor 20**; each MODEL + its sounds when its own moment nears
  (`flyNeeds`: the jets' from 20, the UFO's from 70, THE MOTHERSHIP's from 160). The two programs every flyer is drawn with (`FLY` a
  body · `LIGHT` its lights) + their bloom twins are **built in THE WARM FRAME on a stand-in triangle**; a model that lands brings
  only its buffers, **uploaded in an ordinary frame long before it flies** (`night.js#STAGE.upload` — one speck far under the tower);
  **a model is READ FAST** (`flyers.js#readFlyer`: the flyers' one GLB layout straight through typed arrays — 0.35 ms for the F-22's
  15,843 vertices where JAYWALK's general reader takes 6: a model lands mid-run, on a slow phone too).
  **Each flyer is REMOVED + FREED after its moment** (the next run fetches it again from the phone's cache).
- **IN THE CAMERA's OWN FRAME**: a flyer = a place on the screen + a depth BEHIND the tower (`toWorld`), so it keeps to **its band of
  sky — between the HUD's foot and THE DROP ZONE's upper edge** — while the tower climbs; drawn before the tower (the tower covers
  it). **ON REAL TIME, AND STILL THROUGH A LANDING (S4A FIX 2 — the owner: the UFO JUMPED at every landing):** the band's lower edge
  is the drop zone AS IT WILL STAND ONCE THE CAMERA RESTS on the top slab (`zoneFrom(true)`, eased 0.6 s through a cut) — the zone as
  seen NOW leapt a floor's height up the screen at each landing (the top slab moves at once, the camera eases after it) and the
  flyer with it; a flyer's clock = the frame's own timestamp (`IO[2]`). THE CHECK: `tests/integration/highrise-flypath.mjs` (each
  flyer crosses while a bot drops every slab; every drawn frame's place is set against its neighbours by time — FAILS over 1.5 px;
  the old rule: 4.9 px the UFO, 5.4 the F-22s; now ≤ 0.03 Chromium, ≤ 0.22 WebKit). Checked on the canvas's own pixels: the play zone is the SAME with a flyer up as without (`--s3`). A flyer still in the sky
  when the END CARD comes fades out in a third of a second.
- **THE SKYLINE FLYBY** (3.4 s): in from one side near, round BEHIND the tower, out by the other — **banking round it (≈ 52°) so its
  top side shows**. THE BLACKBIRD = 46 % of the screen's width; each F-22 28 %, the wingman behind + beside the leader. **Night**:
  burner glow + a flame from each nozzle, red / green nav lights, a white tail strobe, a rim of light round a near-black jet;
  **day**: **the darkest thing in the sky** (the Blackbird near-black, hardly any haze over a jet) + **two white vapour trails**. **The city's jet sound** (`audio/city/jet-scream` — the Blackbird ·
  `jets-formation` — the pair), its loudest moment on the pass's middle, **panned with it**.
- **THE UFO** (8 s): JAYWALK's saucer model, **never JAYWALK's look** — **ten AMBER lamps** chasing round its rim (amber to their
  heart: `LIGHT_F` kind 4; **a lamp on the FAR side is fully OFF — the hull hides it** (S4A FIX: a lamp is a glow drawn over the body,
  nothing else hides it): lit by how far the rim's outer face it sits on is turned to the lens — `flyers.js LAMP_FROM` 0.03 →
  `LAMP_FULL` 0.25, a short smooth fade as it rounds the rim; both looks) + **a soft VIOLET underglow** (its belly + a flat pool of light under it); **no beam, no ground ring, no green**. Seen almost from the side
  (the classic saucer), wobbling; the city's UFO hum, quiet, panned.
- **THE MOTHERSHIP**: from floor ~178 a colossal DARK ship (2.7 screens wide) comes down overhead — its hull **built in code**
  (`flyers.js#shipHull`: a smooth 120-sided disc of near-black steel PLATING — every terrace three bands of plates, each its own
  shade, a darker seam between two —, three stepped terraces, a thick rim; JAYWALK's 28-sided saucer read as a pale polygon at this
  size), **MANY SMALL LIGHTS**: four turning rings on its belly + its rim's (~225 points, every 8th a brighter lamp, a wave running
  through them) + a lens, a deep hum building. The hull gives almost no light of its own — it stays DARK. **FLOOR 200, SOLO = the moment**: the camera glances up, its lights pulse, **"THE MOTHERSHIP"**
  in the announcer lane + the band-arrival sound — then it leaves (up and away, 5.4 s in all) and the climb goes on. **MATCH
  (`?mode=match`) = THE FINISH**: **a white-gold light pours onto the top slab** (a warm gold cone from where the ship's lens is SEEN
  down to the slab — widest + brightest ON the slab —, a pool on its top, gold rings running off it, rising sparks; the slab
  white-gold), the run is MADE → 2.6 s later the end card in GOLD (the hull stays dark and the lens + the light's head are turned
  down behind the card: its words stand on the dark ship).
- **THE MODELS**: `assets/jaywalk/models/{blackbird,ufo}.glb` = JAYWALK's own files (shared, cached; read by JAYWALK's GLB reader) ·
  **`assets/highrise/models/f22.glb`** (399 KB, 15,843 vertices) = the city's source model found on the Beelink
  (`art/models/f22/f22_raptor_free.glb`, 25 MB, git-ignored) through `node scripts/bake-model.mjs "<chromium>" highrise-f22`: the
  **gear-retracted** pose, the wheels + the ladder left out, its softened base maps baked into vertex colours, thinned by vertex
  clustering. Credits (CC BY — REQUIRED): `assets/highrise/models/CREDITS.md`.
- **ITS NUMBERS** = `flyers.js#FLY` · the sounds' mix = `MIX`. An effect asks `isUnlocked()` (a napping context plays); a hum stops
  at once when the page is left (the engine's bed hub).

## DEEP SPACE (S3 — `night.js` `SPACE_FROM` 200 · `SPACE_FULL` 212 · `night-fx.js` `space()`)
Solo, past THE MOTHERSHIP: over the last plate **slow drifting stars in two depths** (they twinkle) **+ an aurora's two ribbons**
(green into violet, waving slowly) come in from floor 200 to 212 and hold from there — both looks. Light only, in the plate's own
shader (one uniform, no new program, no extra draw).

## THE CARDS' ART — PREPARED (S3; the cards themselves are S4's)
**ABOVE THE CLOUDS** (floor 60 — `reachedClouds`) + **TOP OF THE WORLD** (floor 200 — `reachedTop`; Grok's v2: the colossal ship)
through JAYWALK's card pipeline: the masters COPIED to `art/highrise-cards/src/` → `node scripts/build-highrise-cards.mjs "<browser>"
[previewDir]` → `assets/vault/hi/above-the-clouds.webp` (34 KB) + `top-of-the-world.webp` (47 KB), 1280 × 720; **`js/fx/hi-specs.js`**
= each card's slim + full crops in JAYWALK's format (the picture set RIGHT — the hero 0.81 / 0.78 across the slim card, the left its
dark ground for a 12-letter name; the full card's art right at 80 % by its width) + the hero boxes. **NOTHING reads them yet**: no
catalog entry, no CSS class, no achievement, no award (`tests/highrise-play.test.mjs`). S4 adds + awards the cards (server-judged
runs only, hidden until go-live) and writes `.vl-s-hi-*` / `.vl-fcm-hi-*` from those numbers.

## THE HEIGHT AREAS (S2 — `bands.js`, PURE; the plates: `assets/highrise/plates/night-1…5.webp` · S3: `day-1…5.webp`)
| band | floors | its plate | its slab colours (four neons, walked one step a floor — `engine.js#paletteFor`) |
| --- | --- | --- | --- |
| THE ROOFTOPS | 0–24 | the harbour canal by night | pink → violet → blue → cyan |
| THE SKYLINE | 25–59 | the city far below | cyan → blue → violet → teal |
| THE CLOUDS | 60–109 | the cloud layer lit from below | rose → amber → magenta → lilac |
| THE STARS | 110–169 | the edge of space | ice → blue → violet → starlight |
| DEEP SPACE | 170 on | the aurora + the planet's curve | gold → coral → violet → aurora green |
- The plate is a screen-filling quad behind everything (in WebGL — the bloom + the glass blend over it); it COVERS the screen with
  `SLACK` 20 % of its height to DRIFT through — slower than the tower: from its foot as its band fades in to its top as the next takes
  over (the last band's drifts on, ever slower). Round a seam the two plates CROSS-FADE over 8 floors (12 at the skyline → clouds
  seam), centred on the upper band's first floor; a slab's colour blends the two bands' sets the same way.
- **Only the current look's set is asked for; only the current band's plate + the next one's are ever held** (`night.js#holdPlates` —
  a third is disposed the frame it is not needed) — plus the FIRST band's again while the end card is up (PLAY AGAIN never starts on a
  blank sky). No plate yet = a plain dark sky (the game never waits for a picture).
- **THE DAY SET (S3)**: the same five bands by day (day 1 = the owner's approved v2 redo) — the harbour canal in the sun · the city far
  below under a pale sky · inside the sunlit cloud layer (its top deep royal blue) · the edge of space (dark indigo, the earth's
  curve) · deep space (the aurora band, lighter than the night's). Their slab colours: "THE DAY LOOK", above.

## THE LINES — YOUR BEST (S2 — `best.js`, PURE · `night.js#setBest` · `play.js`)
- **YOUR BEST = a GOLD TAPE — a THIN glowing gold OUTLINE round the tower** (S2 FIX, the owner: the first one, four gold boxes, "read
  as a slab"): ONE line of light at the mid height of the slab of your best floor, all the way round — ≈ 3 px at 3× (its width follows
  the pixel: never under ~2 device px at any tier), a soft glow off it, NO fill, no lid; the edges turned away from the camera are
  drawn FAINT through the glass. Its own small mesh (`night-fx.js TAPE_F` — one draw, only while a tape lies on the tower; the line
  covers what is behind it, so its gold stays gold on a cyan slab; a deeper gold than the flash's). It lies on the tower at your best floor. **While that floor is
  ABOVE you** there is no tower there yet: it is a **right-edge tag "BEST 57 ▲12"** (gold, flat — no pill) at its floor's own height,
  HELD in the clear column between the HUD's foot and **THE DROP ZONE's upper edge** (`best.js#tagY` · `night.js#zoneTop` = the highest
  point the sliding slab's path reaches) — never over the drop zone. Standing ON it: "BEST 57 · ONE MORE". (A best more than 100 floors
  up is projected AS IF 100 up: further, the point is behind the diagonal camera and comes back mirrored.)
- **CROSSING IT** (the landing on floor best + 1 — once a run): the gold band appears round the slab of your best floor with a flash
  (a gold ring), **NEW BEST** in the announcer lane, the streak's sparkle a step higher, and the floor number turns GOLD for the rest
  of the run. **No tag, no tape on a first-ever run** (no best yet).
- **S2: the best is THIS PHONE's** (`hi:play:best`, written at a run's end when it is beaten — nothing counts until go-live). In the
  cartridge: the SERVER's best once counting is ON (`hi:best` — only ever written from the server's own answer), this phone's while OFF.
- **THE NEXT FRIEND = THE PINK TAPE (S4A — `lines.js`, PURE · `stage.js` · `night.js#setFriend`; the owner, Nov 19):** the LOWEST friend
  best still ABOVE you, from YOUR TABLE's HIGH RISE bests (the board `highrise-solo` through `/api/profile { action: 'table' }` — the
  SERVER's; **empty while counting is OFF**, so no friend line shows until go-live — the e2e proves the look with a fixture). Above
  you = the gold tag's twin **in PINK** at the right edge: **"LIAM 57 ▲12"** ("LIAM 57 · ONE MORE" on their floor), held in the same
  clear column — between the HUD's foot and THE DROP ZONE's upper edge — and a step above / below the gold tag when the two would
  meet. **Crossing it** (the landing on floor v + 1): a thin PINK tape lies round the slab of their floor (the gold tape's shader —
  the SAME program: a second tape builds nothing; its twins in the bloom pass), **PASSED LIAM** in the announcer lane (pink), the
  sparkle a step up — and the next friend above takes the tag. ONE friend at a time (one tag, one pink tape); SOLO only; never on the
  test page (it hands the stage no list). Gold stays YOUR BEST's, nothing else.
  **A WHITE CORE (S4A FIX — over the rooftops' own pink slabs it read only by its glow):** a thin white line at the tape's heart,
  the pink a band either side of it, then the glow; a plum outline under it by day; the core on the edges turned to the camera only
  (`night-fx.js TAPE_F` `uCore` — the gold tape is the SAME program with `uCore` 0: unchanged); the tag's edge the same look (`.hi-ftag`).
  **BY NIGHT its front edges are white · a WIDER, DEEPER solid pink (`TAPE_CORE_NIGHT` 2.6) · a DARK edge** (the pass's fresh-eyes
  review: a white line in a pink glow is exactly what a pink slab's own edge looks like — the tape was lost among them).

## THE SOUNDS (S2 — `sounds.js` (the PURE table + the triggers) · `sfx.js` · `audition.js` (the SOUNDS list); the files: `audio/highrise/`)
- **THE PICKS ARE FINAL (S3 — the owner, Nov 19: ALL A)**: drop as recorded · the chime starting an octave down · the slice = the
  glassy snap · every other sound its one take. **The B takes left the game** (the slice's backup file, the two in-code variants,
  this phone's picks, PLAY A / B + COPY MY PICKS): `sounds.js` = ONE take a sound.
- **THE FILES ARE MP3 (S2 FIX — the owner):** nine files, **117 KB** (S2 FIX shipped ten, 121 KB) (44.1 kHz mono, 128 kbps — `node scripts/build-highrise-sounds.mjs
  --lame <…/@breezystack/lamejs/dist/lamejs.js>`: a pure-JS encoder from npm, a BUILD TOOL given by path — never in package.json, never
  shipped; the build machine has no ffmpeg). The same level as the WAVs (each within 0.4–1.0 dB, decoded). **AN MP3's LEAD-IN IS
  SKIPPED AT PLAY** (`sfx.js#leadOf`): the encoder puts ~25 ms of near-silence in front of every sound — each starts at its first
  audible sample, so a drop's sound stays ON its tap.
- Through the SHARED engine (`audio/engine.js` — JAYWALK's pattern): the bytes fetched early (no AudioContext — nothing sounds before a
  tap), decoded once at the unlock, each sound a buffer source → its gain → a soft limiter (−8 dB, 8 : 1) + a trim → the console's SFX
  bus. **8 VOICES by PRIORITY** (your OUT 4 > the chime · the streak · a band's arrival 3 > the slice · grow-back 2 > a drop · the
  falling piece 1). Muted / locked / a missing file = nothing plays, nothing throws. With the site's MUSIC OFF (PODCAST MODE: the
  context naps between effects) the sounds still play — a source's own start wakes it (`sfx.js` asks `isUnlocked()`, never `running`).
- **THE TRIGGERS** (`sounds.js#cuesOf` — PURE: one frame's engine events → the cues): **drop** — every landing, never the same twice
  (pitch ± 4 %, gain ± 1.5 dB) · **perfect** — THE CHIME · **slice** — a cut · **falling-piece** — 0.1 s after its slice ·
  **grow-back** · **streak** — every 10 perfects in a row · **out** · **band-arrival** (the page's — it knows the band) · NEW BEST =
  the streak's sparkle at × 1.12 · **pass** = the match's (S4; in the audition only). A batch that came back from a hidden tab sounds
  only its OUT.
- **THE PERFECT CHIME climbs a bright MAJOR-PENTATONIC scale** — one step a perfect in a row, HOLDING at the top after 8
  (`CHIME_STEPS` 0 · 2 · 4 · 7 · 9 · 12 · 14 · 16 semitones: do re mi so la do′ re′ mi′) — the crystal bell's playback rate.
- **THE SOUNDS LIST** (the SOUNDS button, top left between runs → THE SHEET; it was S2's SOUND AUDITION): every sound, ONE **PLAY**
  each (the chime climbs its scale) — nothing to choose, nothing stored (S4A FIX 2: GROW-BACK's chooser is gone too). Kept (the call) so every sound — PASS too, not in play
  yet — can still be heard on the test page. The game holds still under the sheet. THE FLYERS' sounds are the city's own files
  (`flyers.js#MIX` — "THE FLYERS", above).
- **GROW-BACK IS FINAL (S4A FIX 2 — the owner's pick by ear, Nov 19):** take 1 of S4A FIX's five — "Heal Restore" by Qvantor (Freesound
  878621, CC0) = `audio/highrise/grow-back.mp3` (mono, −20 dBFS RMS: `scripts/build-highrise-growback.mjs`; the gain 0.5 keeps it under
  the chime; `HI_SFX_REV` 3). The other four takes, their credits (the CC BY take 4 too), the SOUNDS sheet's chooser + COPY MY PICK
  and this phone's pick are gone (`sfx.js` clears the old `hi:play:snd:grow-back` once).
- **A VOICE POOL (S4A FIX):** `sfx.js` makes its voices once (each its own gain + `ended` handler); a sound = its buffer source, nothing else.
- The levels are a FIRST MIX (set from each file's measured loudness — the pass log's table); the measured mix is the review's.
- A sound replaced: bump `sfx.js#HI_SFX_REV`; a picture: `night.js#HI_ART_REV`. After any change: `node scripts/build-file-hashes.mjs`.

## THE ASSETS (S2 — `python -P -E scripts/build-highrise-assets.py` COPIES the owner's delivery; Downloads\grok\highrise is only read)
- `assets/highrise/plates/night-1…5.webp` — the five painted NIGHT plates (Grok Imagine, 720 × 1280 → WebP q 90): **252 KB** ·
  `day-1…5.webp` (S3 — `--look=day`; day 1 = `day-1-rooftops-v2`): **251 KB**. Only the look on screen is fetched.
- `assets/highrise/env-night.png` — **THE REFLECTION MAP**: "Shanghai Bund" (Greg Zaal, Poly Haven, CC0) — its UPPER (sky) HALF ONLY
  (the slabs' side faces mirror it downward: the promenade, its people and its street-level signs never ship), 256 × 64, blurred (smoked
  glass is no mirror), tone-curved into 8 bits (`v = x / (1 + x)`, gamma 2.2 — the shader undoes it: the lights come back hot): **14 KB**
  (the 1.6 MB HDRI never ships). `env-day.png` (S3) = "Kloofendal 48d Partly Cloudy (Pure Sky)" (Greg Zaal + Jarod Guest, Poly
  Haven, CC0), the same way: **15 KB**.
- `audio/highrise/` — the nine sounds as **MP3** (S3: the slice's backup left with the B takes) (S2 FIX: 44.1 kHz mono, 128 kbps — `build-highrise-assets.py`
  makes the 16-bit mono WAVs from the delivery, `scripts/build-highrise-sounds.mjs` turns them into the MP3s that ship + removes
  the WAVs): **117 KB**, fetched after the page is up. All CC0 1.0 — `CREDITS.md` +
  `LICENSE.txt` (the site's Credits sheet gets its HIGH RISE group at go-live).
- `assets/highrise/models/f22.glb` (S3 — 399 KB; `scripts/bake/highrise-f22.mjs`) + `CREDITS.md` · `assets/vault/hi/*.webp` + their
  masters `art/highrise-cards/src/` (S3 — "THE CARDS' ART"; `/art` never deploys).

## THE SOUND SYNC (S4A — the owner, Nov 19: "sometimes the sound isn't in sync with the blocks"; he plays with MUSIC OFF, the phone's speaker)
- **THE CAUSE:** PODCAST MODE (CITY I — the site's music off, the effects on) NAPS the audio context 150 ms after each sound, and a
  drop comes every 1.4–2.4 s — so EVERY drop's sound had to wake the context first. On iOS a context resumes only inside a gesture's
  END (the finger's lift): the sound landed a variable beat after its slab.
- **THE FIX (1) — A LIVE RUN HOLDS THE CONTEXT AWAKE:** `audio/engine.js#holdAwake(on, who)` (a lazy chunk reads its hub
  `globalThis.__nsHoldAwake` — THE STALE-MODULE RULE). **A LEASE, never a latch:** a hold lasts `HOLD_LEASE_MS` 3 s and the game
  RENEWS it once a second from its own frame loop — so a game that ends, unmounts, crashes or is hidden loses it by itself; the end
  card lets it go at once (the context naps again on the start / end screens); a leave drops it in the same step as ever. It never
  changes the session type (still `ambient`: the phone's podcast keeps playing), never touches the music, the hush (muted = nothing
  runs) or THE CUT; with the music ON it is a no-op. **HIGH RISE** (the test page + the cartridge — `stage.js`) holds it from START
  to the end card; **JAYWALK** (the game, the daily, the lab) from the run's start to its end.
- **(2) — A DROP's SOUNDS ARE ASKED IN THE TOUCH** (`stage.js#soundNow`): the tap handler itself plays the cues of the events its
  drop made — never a frame later (`sounded` keeps the frame from asking them twice; the fuse's drop + the moments' cues stay the
  frame's).
- **(3) — EVERY SOUND IS DECODED BEFORE THE FIRST TAP:** START waits ≤ `START_WAIT_MS` 0.6 s for the decodes (`sfx.js#ready` /
  `whenReady`; a first-ever tap is also the audio's unlock) — so no sound of a run takes the late path (`sfx.js#lates()` = 0 in play:
  the checks assert it). In the console the sounds are decoded as the stage mounts.
- **MEASURED** (`node tests/integration/sound-sync.mjs "<chromium>"` — real touches, BOTH games, music ON and OFF; `--before` = the
  same run with the hold switched off in the page): each landing event (HIGH RISE drop · perfect · slice — JAYWALK hop) → the moment
  its sound was asked (`syncs`) → the engine's own record of that source's start (`voiceStarts`: at + how long it waited for a
  sleeping context). **AFTER: every gap ≤ 0.4 ms, 0 wake-ups, 0 naps in a live run; the context naps again on the end card. BEFORE
  (music off): a wake-up on most effects (8–9 in a 14-tap run), 10–13 ms each even in desktop Chromium** — on an iPhone the wait is
  the finger's lift. `tests/audio-session.test.mjs` "THE HOLD" = the same on the real engine over a fake context.

## THE CARTRIDGE (S4A — HIDDEN: THE OWNER'S LIVE TEST, JAYWALK H1 / H3's pattern; `meta.js` · `director.js` · `index.js` · `view.js` · `final.js`)
- **WHO CAN START IT: THE OWNER ALONE.** `config.js` GAMES row `{ id: 'highrise', … playable: false, preview: true }` → `isPlayable` /
  `isOwnerTest` are true only on a phone the SERVER said is the owner's (the radio gate — `ADMIN_PIDS`). **How:** the dock's **PLAY →
  HIGH RISE · TEST → PLAY NOW** (a private solo room), or HOST a room → PICK A GAME → HIGH RISE · TEST with nobody else in it. Nobody
  else's shelf, list, sign, board or HOW TO PLAY changes; a start from any other phone is refused (COMING SOON); the server counts a
  game being built for the owner alone (`api/report.js#reportableGame`) — and, until go-live, for nobody ("THE SWITCH").
- **S4A = THE SOLO RUN** (`index.js#start` returns null for a room of two or more — the console's COULD NOT START; **THE MATCH = S4B**).
- **THE BOOT IS UNTOUCHED BY THE GAME:** no meta at boot (the registry loads the cartridge by id — `registration.test.mjs`
  `HIGHRISE_WAITS`: meta · help · art · the board's tab → the go-live pass · smoke → S4B); THE BOOT BUDGET stays green (307 / 310
  modules, 6,478 of 6,500 KB — the pass added the GAMES row, the stand-in mark, the loader line, the board's row, the engine's hold).
- **THE SCREEN** = THE STAGE (`stage.js` — the SAME module the test page mounts) in the console's game frame: ☰ top-left + music
  top-right, the look = the console's GAME LOOK read LIVE (`body[data-look]` — no switch of its own), the music by look (`index.js
  #musicFor`: the day deck by day, the evening deck by night — JAYWALK's rule). None of the test page's own pieces.
- **THE RUN:** TAP TO START → **GO** ("THE PROOF") → the run on the SERVER's clock (tick 0 = GO; back on screen the clock is read
  again; hiding the app = no pause — THE FUSE ends it). A refresh mid-run takes the run back from its node.
- **THE END = THE CONSOLE's PODIUM FRAME** (`ui/final.js`; the body = `final.js#finalScene`): how the tower ended (the game's own
  words), FLOOR n, the band, the perfects, YOUR BEST / NEW BEST (the server's answer), YOUR TABLE (you + your friends' bests — slim
  cards, shown when a friend has one), and — while counting is OFF — the small line **WOULD COUNT · FLOOR 85 · +15 XP**. The foot is
  the console's: **PLAY AGAIN** (END-SCREEN STANDARD A, the game's ACCENT) · CITY.
- **PLAY AGAIN = THE INSTANT AGAIN** (`index.js#soloAgain` → `games/kit/again.js`): the next run = a match of its own (its own id,
  proof node, report), started at once — the tap WAS the PLAY AGAIN; **the stage is parked over the remount** (its WebGL context,
  programs, plates, decoded sounds kept ≤ 2.5 s — any other unmount frees it at once).
- **AN UNPROVEN RUN** (GO refused / unanswered for 4 s: no signal, or the rules not yet re-published): the game still PLAYS — on a seed
  of its own, never counted — and ends on the stage's own card (**NOT COUNTED — NO LINE TO THE BOARD**, PLAY AGAIN · BACK TO THE
  CITY). A proven run whose end never reaches the room (no signal) gets the same card after 6 s: NO SIGNAL — YOUR RUN COUNTS WHEN
  IT IS BACK.

## THE PROOF (S4A — `proof.js`, PURE: the phone, the host's director AND the server run it; JAYWALK's `jw` node, copied)
- **THE NODE** `rooms/{CODE}/hr/{matchId}/{uid}` = `{ go` (the SERVER's time, written ONCE at GO — the rules: `=== now`; **the seed is
  picked from it**: `logic.js#seedOf(code, matchId, go)` — nobody can shop for a tower; tick 0)`, c/{i} = { s, at }` (the packed taps
  of that chunk — the gaps in base 36, '.' between — + the SERVER's time it ARRIVED; append only, i 0–9999, ≤ 400 chars)`, e { f, t, w }`
  (the run's end, once — a SIGNAL for the host's step: never read as a score)`, k` (S4B's Call the Winner — its rule ships now)` }`.
  `registry.js#PROOF_NODE_LIST` + `NEW_PLAYER_NODES` (`hr`): the next start / PLAY AGAIN never wipes the just-finished run's node.
- **THE RULES** (`database.rules.json` `hr` — mirrored from `jw`; `rules.test.mjs` "the hr proof node"): the player's own uid + their
  own match only, only while it is on; GO once; a chunk written once with the server's time, never re-stamped, never deleted, bounded;
  the end once; **+ stricter than `jw`: no chunk and no end before GO, NOTHING after the end**; the host may delete ONE finished
  match's tree — never the live one's, never a player's node. **A RULES CHANGE: RE-PUBLISH `database.rules.json`.**
- **A LATE GO ANSWER NEVER TOUCHES A RUN THAT WENT ON** (the review — `view.js#askGo` `stale()`): every answer checks its own call
  first; a GO that lands after the 4 s wait marks the match's one GO spent (the next run there is unproven too); a rejoin reads the
  node from the SERVER, never the mirror.
- **THE VIEW's THREE WRITES** (`view.js`): GO (set, then READ BACK — never the phone's own estimate), a chunk (one a second while
  there are new taps), `e` (right behind the last chunk). Never anything once the match left `play` (an expected refusal — counted,
  never a row: JAYWALK's THE LATE PROOF CHUNK).
- **THE JUDGE OF A NODE** (`proof.js#judgeNode` / `judgeSolo`): the chunks → the tap log + its clock → **THE SPEED CHECK, BOTH WAYS**
  (`CLOCK` — JAYWALK's numbers: a chunk's last tap at most 2 s AHEAD of its own server time — a sped-up game, a log made in advance →
  REFUSED; its first tap more than 8 s BEHIND with no silence to explain it — slow motion → the run is CUT at its last on-time tap;
  **THE DROPPED SIGNAL** — a silence ≤ 75 s, then the queued chunks landing together and back on the clock within 15 s — is never
  held against the run) → `replay.js#judgeRun` (the SAME engine the phone ran). The host's podium rows (`director.js#scoreNode`) and
  the server's result both come through it. A phone's claimed floor is never read. **The host's podium reads its LIVE MIRROR**
  (`judgeNode({ mirror: true })` — the review: a chunk still in flight carries the phone's ESTIMATE of the server's time, a round
  trip early; the podium takes the times as never running backwards) — **the SERVER's judge is strict** (acknowledged stamps only).
- **THE SERVER** (`api/report.js` `PROOF_GAMES` — JAYWALK's two paths, generalised: `{ node, solo, match }`): a SOLO run is judged from
  the node on BOTH paths (the room still on that match · the room already moved on — PLAY AGAIN: `src: 'proof'`). `highriseSolo` builds
  the match (`sv`) the report reads; only an `sv` match earns a record / a card flag (`core/match-report.js#highriseExtra`); an EMPTY
  log (floor 0) is never a play; a refused log is named in `rejected`. `highriseMatch` = S4B's half, ready (THE FIRST GO's seed).
- **Known limit** (JAYWALK's): a bot that plays in real time is indistinguishable from a very good player.

## THE SWITCH (S4A — COUNTING STAYS OFF UNTIL GO-LIVE: the owner, Nov 19)
- **ONE server-side flag: `api/_lib/highrise.js#HIGHRISE_COUNTS = false`** — THE GO-LIVE PASS flips this ONE line.
- **OFF:** `/api/report` still does all the judging (the gate, the night record, the proof node replayed, every check) — then
  **returns before any claim or credit**: `{ ok, status: 'would_count', outcome: { none: true, would } }`. `would` = `{ floor,
  perfects, cause, xp, streak, best, table (the board's value), cards: ['clouds' | 'top'] }` — what the counted path WOULD have done,
  from the SAME pure step on a copy (`api/_lib/stats.js#wouldApply` — reads only) — or `{ skip }` (a refused / an empty run).
  **NOTHING is written**: no `results/`, no pstats, no profile, no board row, no card, no streak day, no owners' count
  (`server.test.mjs` + `e2e-highrise.mjs` compare the database before / after). The end card shows **WOULD COUNT · FLOOR n · +XP**.
- **ON (go-live):** JAYWALK's normal counted path — XP + the streak by JAYWALK's rules (THE SOLO LANE: a small XP for the day's first
  4 solo runs, `QUICK_SOLO`: no 45 s gap between quick solo runs), the best on the board **`highrise-solo`** (TALLEST TOWER — a tower
  as ONE sort number: the floor, then THE MOST PERFECTS, then the earlier tick — `logic.js#towerScore`, `core/boards.js` fmt
  `floor`; no tab on THE BOARD until go-live), YOUR TABLE, the cards.
- **The test flip:** on the LOCAL EMULATORS only, the database switch `testHighriseCounts` turns it on (`api/report.js#highriseCounts`
  — `emulated()`; never honoured in production).

## THE CARDS (S4A — in the catalog, HIDDEN until go-live)
**ABOVE THE CLOUDS** (`card-abovetheclouds`, rare — floor 60 in ONE run, any mode) + **TOP OF THE WORLD** (`card-topoftheworld`,
legendary — floor 200) and their achievements `above-the-clouds` / `top-of-the-world` (`api/_lib/catalog.js`): unlocked ONLY by the
feat flags of a run the SERVER judged (`highrise-clouds` · `highrise-top` — the proof node's replay → the row's `ft` →
`match-report.js#highriseExtra` → `pa.gf`; never a number a phone sends, never a host-written result). **Hidden** = nothing is awarded
while THE SWITCH is OFF, and a collection shows only what its player owns (the owner sees them in THE LAB: 225–228). S3's art +
`js/fx/hi-specs.js` are read now: `js/vault/strip.js` (the materials), `css/vault.css` `.vl-s-hi-*` / `.vl-fcm-hi-*` (the crops = the
specs' numbers — pinned), `vault/hero.js` + `layout.js` (the hero boxes), `api/_lib/lab-text.js`. No layer of their own yet (still
pictures).

## THE END SCREEN (S4B — JAYWALK's STANDARD; `endscreen.js` = ONE builder for the test page's card AND the cartridge's body)
The owner's mockup: `Downloads\NEON\highrise-end-jaywalk-style-v2.png` (the inbox's Nov 19 6:22 pm + 6:35 pm entries). Design A's stats
strip, the dashed gold outline + `BEST n ↑` are gone. Top to bottom, the same on the page and in the console's frame:
- **the header** `HIGH RISE · SOLO` / `· MATCH` — HIGH hot pink (#ff4fd8), RISE cyan (#36c9ff), the mode lavender (#c9b6ff); in the
  cartridge it is the console frame's kicker (`endHeader(mode)`).
- **the cause** in saturated hot-pink neon — the colour IS the letter (MISSED THE STACK · TOO THIN · TOO SLOW · TIME'S UP);
  **MADE IT TO THE MOTHERSHIP** in gold (#ffc83c).
- **the floor**, huge + white with a cyan glow (the ONE white hero — ≈ 100 px at 390), `FLOORS` under it.
- **YOUR BEST · n** in gold — `NEW BEST · WAS n` when beaten (a first run's floor is YOUR BEST, never NEW BEST, on the podium as on the stage's card). **REVIEW FIX A (the owner's call, Nov 20): a COUNTED run raises YOUR BEST — solo OR match (the server's record, TALLEST TOWER, like JAYWALK); a run that never counted never sets it.** The cartridge reads the SERVER's best only (`view.js` best `runs: false` — never the test page's `hi:play:best`, never an UNPROVEN run, nothing while counting is OFF); the test page keeps its own phone best. A counted match's podium says YOUR BEST / NEW BEST from the server's answer.
- one line **n PERFECTS · BEST STREAK n**, then **YOUR TABLE** (the slim cards) right under it, then the universal footer
  (PLAY AGAIN · SHARE · CITY — S5: THE SHARE IMAGE, below).
- JAYWALK's veil dims the scene, night + day. `WOULD COUNT …` stays ONE small line over the bar (`final.js#wouldLine`).
- **"+0 XP" SAYS WHY (S4B Group 3):** it is the day's XP cap, not a fault — THE SOLO LANE pays a streak day's first 4 solo runs
  (EVERY solo game's: four JAYWALK runs use them up), a room match stops at THE DAILY CEILING. The line reads
  `WOULD COUNT · FLOOR 85 · +0 XP · DAILY CAP` (the server's `cap` — `api/report.js#wouldAward`; a capped run still counts for the
  board, the streak + the cards).
Tests: `tests/highrise-s4b.test.mjs` · `highrise-play.mjs --end` (every cause + NEW BEST + the gold finish, both looks: 52) ·
`e2e-highrise.mjs` (the cartridge's end + YOUR TABLE with 0 · 1 · 3 · 8 friends at 390 × 844; `HI_UNTIL=table`).

## THE LAG CHECK (S4B — THE PRE-WARM · `?lean=1` · WHAT REPAINTS IN PLAY · `?floor=N`)
- **THE PRE-WARM** (`stage.js#prewarm` · `night.js#warm` · `flyers.js#ready`): behind the welcome screen — before the first tap —
  the look on screen's FIVE plates + its reflection map are uploaded, every flyer's module + model (the Blackbird, the F-22, the UFO,
  THE MOTHERSHIP's hull) is read, uploaded and KEPT (no longer freed after its moment), the programs are built (the warm frame).
  START waits ≤ 0.6 s for it. The other look's plates come at a look switch. `?trace=1` counts any program / upload / decode after
  the first tap — the panel's line **SET-UP AFTER START: none** — and names a landing's deferred DOM frames (num · tags).
- **`?lean=1`** (the test page only): every DOM / CSS effect over the 3D view is off while a run is live (no text-shadow, filter,
  animation, transition — `.hi-stage.is-lean.is-live`); the panel + the note say LEAN. THE A/B for the owner's phone:
  `?trace=1&fps=1` against `?trace=1&fps=1&lean=1` — compare the "> 33 MS" counts.
- **WHAT REPAINTS IN PLAY** — measured (`tests/integration/highrise-paint.mjs`: a Chromium trace of every style / layout / paint
  against the taps): between landings the page gives the browser NOTHING to lay out or paint (it was a layout + two paints
  0.7–1.9 s after every call: the announcer put its class + opacity back on an invisible line); a landing costs ≈ 1.8 layouts /
  3.6 paints; the match clock keeps one text node. A MATCH (the close's final run caught it — the check had last run before the
  match's HUD existed): the dim while a slab slides sat on the tags' full-stage box — 4.9 layouts · 13.7 paints a landing and 70 ·
  184 between landings with NO rival on screen; it is now a class on the TAGS themselves (each already its own compositor layer;
  a tag not shown is not written): 3.0 · 6.0 a landing, between landings only the clock's one write a second. `--table` now
  names WHEN the between-landing writes fall (100 ms buckets since the tap) + the nodes.
- ~~STILL OPEN~~ **CLOSED IN S5 (THE MATCH's garbage 42.6 → 8.0 KB/s — the guard's MATCH row; "THE MATCH" below)** — was: ZERO GARBAGE held for SOLO only (measured at S4B's close: `ALLOC_Q='&mode=match&rivals=7' node
  tests/integration/highrise-alloc.mjs <chromium> --table`): with 7 bot rivals the match's HUD + rival helpers make ≈ 13–15 KB of
  objects a second (`matchhud.js#altimeter` · `rivals.js#mergeTags` / `matchCalls` / `nearest` · `stage.js#placeRivals`) against 4.4
  in a solo run and the guard's 12; the room's mirror of the proof tree is not in that number → the inbox (THE REVIEW).
- **`?floor=N` counts toward nothing**: the shortcut's floors never reach the announcer, the chime, the end card's perfects + best
  streak; YOUR BEST is never set or compared.
Tests: `highrise-prewarm.mjs` (35: floor 1 → 120 · floor 80 by day · lean · the shortcut) · `highrise-paint.mjs` (13) ·
`highrise-alloc.mjs` (ZERO GARBAGE: 8) · `highrise-flypath.mjs` (26) · `highrise-landing.mjs` (7).

## THE MATCH (S4B — 2 … 8 players, ONE tower each, the SAME seed; JAYWALK's match is the pattern)
**The rules** (PURE — `match.js` · `director.js`): `count` (3 · 2 · 1) → `play` → `final`. Every phone writes its own GO on its proof
node (a transaction, never applied locally); **THE FIRST GO** picks the seed + tick 0 for everyone (`logic.js#matchStart` — the nodes
are the truth: `match.js#startOf` puts a game that says otherwise right). No GO anywhere within 3 s → the match plays UNPROVEN (never
counted). **THE END**: every tower ended — its node says `e`; a silent phone is waited for (online: `IDLE_OUT_MS` 18 s — S5, JAYWALK's own; S4B had 12 s — the fuse has
ended that tower by then; offline: + `DROP_WAIT_MS` 75 s, THE DROPPED SIGNAL) — or the 6:00 cap + 4 s. **The rows** = THE JUDGE's
replay of each node (`director.js#scoreMatchNode` → `proof.js#judgeNode`, exactly as the server's `highriseMatch`): the floor, then
the most perfects, then the earlier tick. FINISH = floor 200 (MADE IT). Call the Winner is scored from each caller's own `k`
(`match.js#scoreCalls`). The start: the OWNER's phone only (the hidden gate) — a late joiner WATCHES until the next REMATCH deals
them in.

**THE RIVALS** (`rivals.js` — PURE): a rival's tower = their own LANDED taps through the same engine — never a tap assumed (the
fuse's end only once their `e` is here; the cap is marked, never stepped).
- **THE HEIGHT TAPES** (`night.js#setRival`): a rival UNDER you = a thin tape round YOUR tower in their colour, at their height —
  never the top slab, never in the bloom pass; the 3 nearest. A rival one floor under you who is still climbing counts as LEVEL
  (no tape flashing under the top slab).
- **THE TAGS** (`matchhud.js#setTags`): a rival AT / OVER you = a right-edge tag `ALEX ▲3` in the clear column; the 3 nearest,
  merged when they would overlap (`rivals.js#mergeTags`), dim while a slab slides (`matchhud.js#dim` — on the tags, never their box).
- ~~THE ALTIMETER~~ → **THE PLACE NUMBER (S5 — the owner: the altimeter was "movement in the corner of your eye")**: ONE big still
  number — **REVIEW FIX A: ALONE in the TOP-RIGHT corner under the music button, `8TH` 50 px with `/ 8` 17 px UNDER it, right-aligned**
  (it ran into THE ROOFTOPS at 4 px); **ties = the floor, then the most perfects** (the final ranking's rule — `rivals.js#placeOf(rows,
  floor, perfects)`; the same floor + perfects share it) — (S5's text:) top-left under ☰ (`matchhud.js#place`) — `3RD / 8` (the ordinal 50 px in the game's numerals, `/ 8` smaller + dimmer;
  `1ST` gold); your place = 1 + the players STRICTLY over your floor (`rivals.js#placeOf` — a level player shares it); written only
  when it changes, a change = ONE pulse of its glow copy (up cyan · down soft pink — opacity + transform). A live climber's only.
- **THE RANKED LIST (S5 — WATCH only)**: every player, the highest first, 44 pt rows — the place · a colour bar · the name · the floor;
  the watched row lit, YOU outlined, OUT a cross + struck name, the finish a gold diamond, a silent phone a hollow bar. Tap a row =
  watch them; a tap elsewhere = the next; the one you follow STAYS while they climb (a tap's pick is spent once followed). The HUD
  column steps right of it. The test page's bot room (`?mode=match&rivals=7`) has OUT = WATCH too (its card after every bot is down
  or 45 s — `matchsim.js#SIM_WATCH_MS`).
- **THE ANNOUNCER (S5)**: the match lane 16 px (it was 12), one line, held 1.5 s, inside the HUD column; the same words twice inside
  4 s are said once (`REPEAT_MS`). The solo lane: PERFECT + FASTER held 1.5 s (PERFECT was 0.7).
- **ZERO GARBAGE IN A MATCH (S5)**: `nearest` · `mergeTags` · `matchCalls` fill kept scratch; the cartridge's pump keeps ONE row a
  rival, the live key once a game, `S.me(record)`; with 7 bot rivals the game's own code 8.0 KB/s (the guard's MATCH row; it was 42.6).
- **THE PIXEL TEST** (`tests/integration/highrise-rivals.mjs`): 8 players, 48 frozen samples day + night at 390 × 844 — 0 rival
  pixels in the play zone.

**REVIEW FIX A — THE MATCH (Nov 20; the pass log `docs/games/passes/highrise-fix-a.md`):**
- **THE TOP HUD** (a match): the floor big + centred · the band + the clock ONE narrow centred line under it (`THE ROOFTOPS · 5:37`,
  `.hi-bandrow`, ≤ 200 px) · THE PLACE NUMBER alone top-right (a size down — 40 px — on a short phone) · the callouts under all of it (the call lane 30 px under the band line,
  the announcer 16 px under it). Measured at 390 × 844 day + night with a PERFECT ×5 AND a pass call up: every gap ≥ 16 px (were
  6 · 0 · 12 · 4), the place ≥ 16 px clear of each + of the tags; 1440 × 900 too (`highrise-place.mjs`). Solo's HUD is unchanged.
- **WATCH's list** (the review's SHOULD 2): at most `LIST_MAX` 5 rows — the leaders + the one you watch + YOU, `+N MORE` folded (a tap
  off the list still steps through everyone); it ends at ~299, above THE DROP ZONE (8 rows ran to 408, over the slab's way in). Its
  numbers: the floor → the perfects (shared only when both are equal).
- **SPECTATE IN SYNC** (the owner: "it goes past, and then it snaps back on top and drops"): the watched tower is played BACK at
  THE PLAYBACK TICK = the match's tick − `stage.js#WATCH_DELAY_MS` (750 ms — taps reach a phone 0.17–0.27 s late with the bots, ~0.25–0.5 s
  in a real match); each landed tap applied when the playback reaches ITS tick, their end too. A tap later than the delay GROWS it to
  its lateness + 300 ms (≤ 2.5 s), eased in (the playback at 0.7× until there — never a jump) — and back down the same way once the
  line is good again (the worst of the last 12 taps); taps that piled up while the page was hidden / under a sheet are not measured;
  a new run starts the playback's numbers afresh. Until a tap lands the slab is HELD at its sweep's edge. A switch / a row's tap: the new tower caught up + fed BEFORE the view adopts it (clean). The watcher's line + the list
  read the DRAWN (delayed) tower's floor. Proven by `highrise-spectate.mjs`: 20 landings night + day drawn past the tap by 0.00 px (the
  control — the delay pinned to 0 — 5 of 5 landings, up to 42.9 px).
- **A GO IS NOT A PLAY** (MUST 3): the server counts a HIGH RISE match player only with a LANDED slab in its own replay
  (`api/_lib/highrise.js#hrPlayed`, report.js — HIGH RISE only; JAYWALK's "a silent player included" waits for THE PROOF PASS).
- **A HOST HICCUP AT GO** (SHOULD 1): a FIRST GO the server stamped BEFORE the host gave up (`match.js#goBeforeGiveUp`) keeps every phone
  on the GO's seed (`startOf`) and the director takes the unproven mark back — the match counts. A GO stamped after it never moves an
  unproven match. (JAYWALK's director has the same step — not touched: its next pass.)
- **No GHOST all match** (SHOULD 5): the rivals' names + colours are read again whenever the room's player list changes.

**THE SCREEN** (`stage.js` · `matchhud.js` · `view.js`): the match kit's announcer for the passes (merged: `3 PASSED YOU`), who is out,
MADE IT (rivals' streaks are NOT called — everyone climbs in step). **OUT** = the cause's words → Call the Winner (the kit's) →
**WATCH** (the leader first; a tap = the next; a tap on a row of THE RANKED LIST = that player — their tower from their landed taps,
its slab seen sliding). The finish at floor 200 (the gold light), TIME'S UP at the cap. The podium `HIGH RISE · MATCH`: every row its floor +
cause + perfects, your place + your call; **REMATCH in place**. Each phone its own look.

**ROCK SOLID** (each tested — `e2e-highrise-match.mjs`, 55: three phones + a late joiner): a refresh mid-run + after out, an app
switch, a signal drop, the host's phone dying (the next phone continues from the database), the rematch. If the OWNER's phone loses
its line ≥ 10 s the host moves to a guest who can not START the hidden game (REMATCH then needs MAKE HOST) — by design until go-live.

**THE SERVER** (`api/_lib/highrise.js#highriseMatch`): every run from the server's replay on THE FIRST GO's seed; behind THE SWITCH —
WOULD COUNT for every player, NOTHING written. **The test page**: `?mode=match&rivals=N` — bot rivals on the same seed
(`matchsim.js`, lazy; nothing counts).

## THE SHARE IMAGE (S5 — the owner's mockup `Downloads\NEON\highrise-share-image.png`; JAYWALK's standard: `share.js` + `shot.js`)
- **THE FRAME** (`shot.js` · `night.js#snap`): a beat after YOUR tower's end (`SHOT_AT`: a miss 170 ms · too thin 200 · too slow 300 ·
  the bell 60 · THE FINISH 1.7 s) the next frame drawn is copied off the canvas in that frame + where the top slab stands; kept on this
  phone under the run's key (the cartridge: its match id); never while WATCH is up.
- **THE CARD** (`share.js#drawHiCard` on the kit's `drawRunCard`, 1080 × 1350): the sign + `HIGH RISE · SOLO` / `· MATCH`; THE HERO FRAME
  (JAYWALK's box 984 × 792 at 48, 348, one neon edge) = the real frame zoomed on the tower's top (full width — the falling slab beside it),
  lifted by night; the cause ONCE in a dark tab (58 px, ≤ 2 lines); THE TOWER top-right; `BAND · N PERFECTS` lavender; the floor in the
  game's numerals (Chakra Petch — Orbitron's zero is slashed) white-hot + CYAN glow + FLOORS; the name; the kit's foot. **THE FINISH =
  ALL GOLD.** The numbers = THE JUDGE's whenever it has answered (the frame gives the picture).
- **SHARE on the universal footer** (`index.js#shareRun`, lazy — solo + match): drawn while the end screen is read (`final.js` →
  `warmShare`), uploaded only at the first SHARE tap, fitted under the server's cap (`kit/share-run.js#fitPng` — JAYWALK's, moved to the
  kit). **Behind THE SWITCH:** `api/_lib/share-card.js#RUN_GAMES` + `highrise` — a run's card only with the server's own COUNTED
  result (none while counting is off); once the server said WOULD COUNT (`globalThis.__hiWould`) the phone asks nothing → the
  PICTURE alone goes out, no text. The test page never loads the share kit (its door).
- Tests: `highrise-share.mjs` (4 real runs → their cards) · `e2e-highrise.mjs` (SHARE → the picture alone, 0 /api calls) ·
  `share-card.test.mjs` "HIGH RISE S5" · `tests/highrise-s5.test.mjs`.

## THE BILLBOARD (S5 — B1, the owner's pick `Downloads\NEON\highrise-billboard-B-v2.png`, the TOP one; NOT installed in the city)
- **THE POSTER** (`poster.js` — the test page's `?poster=1&seed=poster2&floor=78&look=night`): the real night scene staged the same every
  time (the seed `poster2`: violet-blue slabs in THE CLOUDS; one cut, frozen 140 ms later), cropped to the board's 848 : 448 round the
  tower's top, darkened for the words.
- **B1** (`billboard.js`, pure canvas): HIGH (white-hot, hot-pink edge, thick dark outline) over RISE (cyan edge), each cap 0.255 of the
  board; the dark foot band + its pink neon line; OPEN NOW big WHITE heavy (never black-on-pink). The lettering = path data in BOWLBY ONE
  (`billboard-glyphs.js`, GENERATED — OFL, no font load).
- **Build**: `node scripts/build-highrise-billboard.mjs "<chromium>"` (serve.mjs on :5173) → `assets/city/highrise/billboard.webp`
  (848 × 448, the words baked in — drawn whole like JAYWALK's OPEN NOW face) + the 2× / 1× PNGs. **The CITY chat installs it at go-live.**
- **THE READABILITY PROOF** (`tests/integration/highrise-billboard.mjs` — in the city at 390 × 844, local only: the roof board's JAYWALK
  OPEN NOW face forced, its picture's request answered with HIGH RISE's in the test): HIGH 11.2 pt · RISE 10.9 pt vs JAYWALK's word
  9.0 pt; OPEN NOW 6.1 pt vs NOW OPEN 3.7 pt.

## THE EFFECTS REBUILD — THE BAKED HUD (S5 — the owner's A/B: `?lean=1` halved Safari's slow frames)
- **THE BISECT** (`highrise-paint.mjs --bisect`; `?lean=<name>` = ONE effect off: num · call · band · clock · tag · fps · ann · place):
  the paint COUNTS were the same with and without lean — the cost was the BLUR re-rasterised inside them. Raster a second (the owner's
  link `?trace=1&fps=1`, Chromium): BEFORE 0.74 night / 0.79 day (the number 0.33 / 0.36 · the announcer 0.27 / 0.10 · the band 0.20 /
  0.09 · the fps line 0.15 / 0.33 · the tags 0.07 / 0) — AFTER 0.17 / 0.15 — `?lean=1` 0.10.
- **THE BAKED HUD** (`bakedtext.js`): the floor number's ten digits drawn WITH their glow once a style — read off the number's OWN computed
  style (the CSS stays the one source: the gold, the day's ink, `?lean`) — a landing copies 1 – 3 bitmaps into ONE canvas; the digit boxes
  keep the layout + the reading (transparent). The announcer's lane: its pieces ("PERFECT ×", "NEW BEST", each digit …) baked once a style,
  a call composes them (the pop stays a Web Animation). WARMED behind the welcome (`stage.js#warmHud`: the gold set, the lane's words) —
  nothing baked in a live frame; ≤ 2 digit sets kept (an evicted one's canvases zeroed). The fps line: a flat dark plate, no halo.
- `?lean=1` + `?lean=<name>` stay (the owner's A/B). WebKit is not measurable on the Beelink (software GL) — the iPhone A/B is the measure.

## THE RULE-SET TABLE (S4B — `rules.js`, PURE, imports nothing)
Every rule number lives in ONE row per rule set — `RULE_SETS` — the start size, the perfect window, grow-back, too thin, the travel,
the fuse, the landing beat, the speed curve + its wobble, the solo tightening past 200, the modes' finish + caps. Today's only row:
**`classic`** (S1 / S2's numbers, to the unit). A later rule set = a new row; nothing else changes.
- `tuning.js` only NAMES the classic row (START, PERFECT, …) for the views, the sims + the tests — never a second copy.
- **The engine + the judge read the run's own row**: `createRun({ seed, mode, rules })` → `run.rules` + `run.R`; `engine.js` /
  `replay.js` import no rule constant. `endBy(run, lastTap)` = the latest tick a run can still be live.
- **Every run records its rule set**: `resultOf(run).rules`; the proof node's **`rs`** (written once, right behind GO —
  `view.js#writeRs`, best effort: none = `classic`; the rules take it only BEFORE the log's first chunk and never in one write with a
  chunk or the end — a rule set is not picked once the climb is seen); the judge's answer names it.
- **The judge refuses a set it does not know** (`judgeRun` / `judgeNode` → `why: 'rules'`) — never judged as classic.
- **A match = ONE rule set**: THE FIRST GO's (`proof.js#matchRules`); a node naming another has no tower — the host + the server agree.
  A set NOBODY KNOWS is never the match's (the close's review: the first GO's player naming `zz` voided every tower): the match stays
  `classic` and that player's own node is the one refused; two GOs in one millisecond → the lowest uid's.
- **NOTHING CHANGED IN PLAY — proven** (`tests/highrise-rules.test.mjs`): the digests of 720 bot runs + the whole event stream of 36
  were taken on the untouched engine; after the table they are the same, digest for digest.

## THE LIVE LOCK (S4B — the rules gap `jw` + `hr` shared; `database.rules.json` — A RULES CHANGE)
The delete of a LIVE match's proof tree was refused by reading game/phase + game/matchId — which the HOST writes. On a modified
client: flip the phase (or the match id, or the game), delete the tree, flip it back, write a new GO → a new seed; the honest phones
never re-write their GO → "no go" for them. Now, for both games:
- ONE match's tree (`{node}/{match}`) goes only when **the host's OWN `go` in it is older than 10 min** — whatever `game` says. A GO
  is the server's time, written once by its player: nothing the host writes moves it. (A match is over by 6:10.)
- A tree with NO GO of the host's is never his to delete (he can not wipe the others' and GO first) — it goes with the room.
- A tree that is not there = a no-op (allowed). The WHOLE `jw` / `hr` node is never the host's to delete (no honest client did).
- **The clients ask only for what the rules allow** (one refused path takes a whole update down): `core/room-logic.js#proofUnlocked`
  (+ 30 s of slack for the phone's clock) → `host.js#pruneProofs` (`staleProofPaths(…, lock)`) + `kit/again.js` (a run inside the lock
  stays in PLAY AGAIN's list, as a queued one does). A held tree waits for a later start.
Tests: `rules.test.mjs` "THE LIVE LOCK" (both games: every way to dress the flip, the withheld GO, 9 min held / 11 min gone, MAKE
HOST) + "the proof node's `rs`" · `tests/highrise-rules.test.mjs`.

**STILL OPEN — THE LEAF WRITES (the close's review; `jw` + `hr`, older than this pass):** the lock stops the host DELETING a live
tree, but every proof-leaf write (`go` · `c/$i` · `e` · `k` · `rs`) is still allowed by reading what the host writes (`game/phase`,
`game/matchId`, `game/participants/$uid`). A modified host can flip one of those for a moment: a rival's chunk sent in that window is
refused, the honest phone moves on to the next index, the log has a hole, the judge refuses that run (`chunks`, floor 0). The fix is
a rules design of its own — the leaves gated on the player's OWN `go` (+ a time bound in place of `phase`), with the phone re-sending
a refused chunk in order — for both games at once; it touches live JAYWALK's rules, so it was NOT squeezed into this pass's close.
→ the inbox (to the next JAYWALK / HIGH RISE pass) + the pass log's OPEN FOR BEN.

## THE FILE MAP + THE TESTS
```
highrise-play.html  css/highrise-play.css           THE TEST PAGE + its HUD (prefix hi-; the site's tokens + THE SHEET)
highrise-lab.html  css/highrise.css                 THE LAB's page + its plain-text HUD (self-contained)
js/games/highrise/rules.js                          THE RULE-SET TABLE (S4B — pure, imports nothing: every rule number, one row a rule set)
js/games/highrise/tuning.js engine.js logic.js replay.js    THE RULES (pure — the phone AND the server; tuning.js = the classic row by name)
js/games/highrise/match.js rivals.js                THE MATCH's rules (S4B — pure: the count, the end, the calls) · THE RIVALS (pure: a rival's tower from their landed taps, the tags, the passes)
js/games/highrise/matchhud.js matchsim.js           THE MATCH's HUD (the altimeter, the tags, the announcer's lane, the count, WATCH) · the test page's bot rivals (lazy — `?mode=match&rivals=N`)
js/games/highrise/bot.js                            the sim bots          scripts/highrise-sim.mjs   the 2,000-seed table
js/games/highrise/tower.js                          the tower a view draws, from the events (pure — the lab AND the game)
js/games/highrise/play.js stage.js                  THE TEST PAGE (its door, its flags, its best) · THE STAGE: the run loop, the HUD, YOUR BEST, the lost context — the page AND the cartridge mount it
js/games/highrise/meta.js director.js index.js      THE CARTRIDGE (S4A — hidden): the thin meta · the pure host step · the contract
js/games/highrise/shot.js share.js                  THE SHARE IMAGE (S5): the run's frame (pure state) · the card + SHARE (lazy, the cartridge's)
js/games/highrise/poster.js billboard.js billboard-glyphs.js   THE B1 BILLBOARD (S5): the staged scene (?poster=1) · the painter (pure) · Bowlby One as paths (GENERATED)   scripts/build-highrise-billboard.mjs
js/games/highrise/bakedtext.js                      THE BAKED HUD (S5): the number + the announcer's glow baked once a style
js/games/highrise/view.js final.js endscreen.js     … its screen (the stage in the console's frame + the proof's writes) · the end screen's body + YOUR TABLE · THE END's ONE builder (the page's card too)
js/games/highrise/proof.js lines.js                 THE PROOF (pure: the node's chunks, THE SPEED CHECK, the judge of a node) · THE NEXT FRIEND (pure)
js/games/highrise/night.js night-fx.js camera.js    THE TWO LOOKS (one scene, `uDay`): the scene + the flyers' stage · the shaders + the bloom · the camera's numbers (pure)
js/games/highrise/bands.js best.js                  THE HEIGHT AREAS + both looks' slab colours, the day's haze + the sky's tone · YOUR BEST's tag / tape (both pure)
js/games/highrise/look.js                           THE LOOK SWITCH's choice (AUTO · DAY · NIGHT — this phone; AUTO = the site's sun rule)
js/games/highrise/flyplan.js flyers.js              THE FLYERS: when + which from the seed (pure) · the flying, the lights, the sounds (LAZY)
js/games/highrise/sounds.js sfx.js audition.js      THE SOUNDS: the table + the triggers (pure) · the engine glue · the SOUNDS list
js/games/highrise/trace.js                          THE TRACE (S4A FIX 2 — `?trace=1`: a frame's phases, the 5 worst, typed arrays only)
js/fx/hi-specs.js                                   THE 2 CARDS' ART as data (S3 — nothing reads it until S4)
js/games/highrise/lab.js graybox.js                 THE LAB (S1's graybox)
api/_lib/highrise.js                                THE JUDGE's server half (pure) + THE SWITCH (HIGHRISE_COUNTS) — wired into api/report.js (PROOF_GAMES) since S4A
assets/highrise/  audio/highrise/                   the plates + the reflection maps + the F-22 · the sounds   scripts/build-highrise-assets.py [--look=day]
assets/vault/hi/  art/highrise-cards/src/           the 2 cards' art + its masters   scripts/build-highrise-cards.mjs · scripts/bake/highrise-f22.mjs
scripts/build-highrise-sounds.mjs                   the WAVs → the MP3s that ship (a pure-JS encoder from npm, given by path) · build-highrise-growback.mjs (S4A FIX's takes: mono, one loudness — take 1 ships)
tests/highrise-engine.test.mjs (21) · highrise-server.test.mjs (5) · highrise-sim.test.mjs (5) · highrise-lab.test.mjs (6) · highrise-play.test.mjs (16) · highrise-cartridge.test.mjs (13 — S4A) · highrise-zero-garbage.test.mjs (8) + highrise-s4a-fix.test.mjs (6 — S4A FIX)
tests/integration/highrise-alloc.mjs (S4A FIX — THE GUARD: 8; `--table` = the pass's table) · kit/flash-watch.mjs (NO PINK FLASH)
tests/highrise-s4a-fix2.test.mjs (5) · tests/integration/highrise-landing.mjs (S4A FIX 2 — the landing frame's measure, Chromium 4× CPU + the trace panel: 7) · highrise-flypath.mjs (each flyer's path through landings, Chromium + WebKit: 26)
tests/integration/e2e-highrise.mjs (61 — the emulators: the hidden cartridge end to end; `--fast` skips the counting-ON run) · sound-sync.mjs (42 — both games; `--before`) · rules.test.mjs "the hr proof node" · server.test.mjs "HIGH RISE S4A"
tests/highrise-s4b.test.mjs (8) · highrise-match.test.mjs (7) · highrise-rules.test.mjs (5 — S4B: the end screen, the pre-warm, the match's rules + rivals, THE TABLE's digests, THE LIVE LOCK, the cap line)
tests/integration/e2e-highrise-match.mjs (55 — three phones + a late joiner; `--fast` = two) · highrise-rivals.mjs (10 — THE PIXEL TEST) · highrise-prewarm.mjs (35) · highrise-paint.mjs (13) · rules.test.mjs "THE LIVE LOCK" + "the proof node's `rs`" · server.test.mjs "HIGH RISE S4B"
tests/integration/highrise-play.mjs (238 — the browser; --end (52) · --review · --s3 (125) · --webkit · --look · --fly · --perf · --hitch = THE LAG HUNT's long run · S4A FIX's shots: --ufo · --tape · --icon · --screens · --flash) · highrise-lab.mjs (45)
```

tests/highrise-s5.test.mjs · tests/integration/highrise-place.mjs (THE PLACE NUMBER + WATCH + THE ANNOUNCER) · highrise-share.mjs · highrise-billboard.mjs · highrise-paint.mjs --bisect
tests/highrise-fix-a.test.mjs (REVIEW FIX A) · tests/integration/highrise-spectate.mjs (SPECTATE IN SYNC — every watched frame against each tap's own spot; its CONTROL on the old live clock) · highrise-place.mjs (+ THE TOP HUD's gaps, the ties, the list's fold, 1440 × 900)

## COMING
- ~~THE REVIEW~~ (done) → ~~REVIEW FIX A — THE MATCH~~ (done) → **REVIEW FIX B — THE SHARE CARD** (B · THE POSTER + the 6 hero shots)
  → **THE CITY pass** (HIGH RISE's billboard + roof sign + blade, lit only by the go-live switch — BEFORE the flip) → **GO-LIVE** →
  **THE PROOF PASS** (JAYWALK + HIGH RISE's host trust, a re-publish — after go-live, BEFORE strangers are invited). The owner's go-live
  calls (Nov 20): HIGH RISE counts toward the weekly "5 different games" · its own BOARD tab · THE DAILY CEILING stays 20 · /highrise-lab
  deleted · the two cards' lab marks removed · JAYWALK's boot budget needs ~0.3 KB at the flip (trim comments or a named raise).
- **THE GO-LIVE PASS** (after THE REVIEW): `playable: true` + `HIGHRISE_COUNTS = true` (ONE line each), its meta at boot, HOW TO
  PLAY, its tile + icon, the board's tab, the site's Credits sheet's HIGH RISE group (the F-22, the Blackbird, the saucer: CC BY —
  `assets/highrise/models/CREDITS.md`), the cards' own motion.
- **NO DAILY** (the owner, Nov 18 — the seed barely changes play; parked idea only: a one-shot "TODAY'S TWIST"). Then THE REVIEW (+ the
  icon + the billboard poster briefs) and THE GO-LIVE PASS.
