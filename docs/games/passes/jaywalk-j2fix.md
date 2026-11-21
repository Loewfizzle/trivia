# JAYWALK J2 FIX — THE BLACKBIRD YOU CAN SEE + A PREMIUM DAY RUNWAY — Nov 21, 2026

**RE-PUBLISH: nothing new** (no rules change in this pass — J2's `database.rules.nov21-j2.json` is still the file to publish before Nov 27).
The detail: `docs/jaywalk.md` "J2 FIX"; the owner's decisions: `docs/games/plan.md` "JAYWALK J2 FIX".

## STEP 0
`docs/games/plan.md` "JAYWALK J2 FIX" (d8e5b52b). The lab export at the start: 224 marks, no open FIX. The inbox: nothing open for this
pass (J2's own OPEN FOR BEN entry is Ben's).

## THE TIME GUARD
The UTC clock at the start: 2026-11-21 17:30 · at the push: see THE FINAL RUN — well before 08:15 UTC: **the timing change SHIPPED** (v2 goes
live at 2026-11-22 09:00 UTC with these numbers).

## GROUP 1 — THE BLACKBIRD YOU CAN SEE (13b66b12)
- `tuning.js#RUNWAY`: the jets **200 · 250 · 340** (lanes 120–249 · from 250 · THE AIRFIELD) — across the 8-column view in **0.67 · 0.53 ·
  0.39 s** (J2: 1000 = 0.13 s); `len` 3000; the tell **72 ticks = 1.2 s** (v2's own floor `tellMin`; v1's MIN_TELL_TICKS untouched); the trail
  42 (0.7 s); the stagger, the safe lanes, `runwaySlack` unchanged.
- **THE FIRST TRY BROKE THE FAIRNESS** (the strict search — three columns, the j2-sim test's own): a slow jet burns its lane ≈ 100 ticks (J2
  ≈ 54) — the blind cross rose to 72 / 76 / 81 %, the careful wait to **6.6 s** and **45 start ticks were TRAPPED** (a lane-order-against-
  the-kid cluster with no room left by the jitter). Lengthening the lap brought the blind cross back but not the wait. **THE WAIT GUARD**
  (`course.js#runwayWait`, `RUNWAY.wait` 216 = 3.6 s — the same model as runwaySlack): a layout that can keep a careful kid waiting longer
  is not used → the tight cluster → and if even that fails, the cluster in LANE ORDER (the bottom lane's jet first). It took the threat
  back to J2's exactly. (Named: the spec said the crossing check unchanged — `runwaySlack` is; this is a second check beside it, the only
  way the never-trap + 4 s limits held with the owner's speeds.)
- THE VAPOUR TRAIL + THE SOUND (`flyers.js#jet`): a short white trail off each nozzle from the flames' tips back (three widening, fading
  steps on `K.flat` — no draw call); the scream peaks / the boom lands / the ring + flash + shake start at `tc` — the jet over the view's
  middle — the trail's fire at the pass's end; v1 untouched (`tc0` = 0).
- **v2 FROZEN** (`tests/fixtures/jaywalk-v2/` + `tests/jaywalk-v2-frozen.test.mjs`).
- **THE PRE-FIX J2 BUILD after 4 am** (`tests/jaywalk-j2fix.test.mjs` on `tests/fixtures/jaywalk-v2-j2pre/`): the daily's START wants `cvr`
  (`versions.js#CV_REV` 2) — an old phone is refused `old_version` (its own "Refresh the page to play today's course."); a solo / match run
  is refused by **THE END CHECK** (`replay.js#judgeRun`, v2 only — its own `e` must match the replay: 'old build') or 'past the end'. 36
  pre-fix solo runs, 21 that reached a runway: 19 counted exactly as their screens showed, 17 refused ('past the end'); the end write lost:
  the same 19 / 17 — never a wrong count. (J2's M1 — a pre-deploy phone HOSTING a match shows its own podium — stands as J2 named it; the
  server's count is right.)

### THE FAIRNESS TABLE (600 seeds `rw0…rw599` — J2's own; the careful search = the strict three-column one, every 4th start tick)

| | J2 v2 (shipped, never live) | J2 FIX v2 |
| --- | --- | --- |
| the jet across the 8-column view (120–249 · 250+ · THE AIRFIELD) | 0.13 · 0.13 · 0.13 s | **0.67 · 0.53 · 0.39 s** |
| the tell | 1.6 s | **1.2 s** |
| a BLIND cross hit — lanes 120–249 | 58.8 % | **58.4 %** |
| … 250–449 | 68.6 % | **68.6 %** |
| … the loop (450+) | 76.9 % | **74.8 %** |
| … THE AIRFIELD | 74.1 % | **74.1 %** |
| the careful kid TRAPPED (start ticks) | 0 of 579,344 | **0 of 579,344** |
| runways passable by the careful search (every start tick) | 100 % | **100 %** |
| the worst safe wait | 3.87 s | **3.58 s** |
| the greedy bot killed by the Blackbird, per runway met | 1.5 % (10 / 654) | 4.7 % (29 / 620) |

(The greedy bot is the steady test bot, not a careful player: it hops on a gap without reading the tell, and a slower jet's longer burn
catches it more — a careful player is never trapped.)

## GROUP 2 — THE DAY RUNWAY (0d6be653 + 26689000) · GROUP 3 — THE NIGHT COMPARE (0d6be653)
- **THE LAMPS by day** (`night.js#runwayLamps`): a small dark housing (shape 12 — a crisp rounded box) + a sharp pip (shape 11 — a crisp disc,
  no halo; a white-hot centre on a lit one). Off the tell a dim lens; tell + pass a RUNNING SEQUENCE toward the crossing (every 3rd lamp, a
  step every 7 ticks — each lamp under 3 a second, the old wig-wag's limit; steady with reduce motion), the amber row + the red row, the
  racing head bigger. The chevrons untouched.
- **THE TRAIL by day** (`night.js#heatTrail`): soot streak + charred core (`K.flat` paint — the shadow kind is blue-black: never on the
  ground), the white-hot centre line + its orange edge, see-through blue-white tongues standing up (shape 13 — wide foot, the tip fading to
  nothing; 1.8× tall by day after the first refine: they read faint at phone size), a heat shimmer (three wavering translucent bands), smoke
  wisps as the 0.7 s ends (dark, 0.9 — grey at 0.6 vanished against the chevrons: the second refine).
- **BY NIGHT exactly J2's** (the dead day branches removed — each night value kept by hand; `tests/jaywalk-j2fix.test.mjs` pins the night
  lamps + plasma lines). **`&rwnight=new`** — the lab only (`createNight({ rwNight })`; the view + the poster never pass it — tested).
- The refines (three, at 390 + 430 — `jaywalk-lab.mjs --j2fix`): 1 the housings were heavy black boxes → smaller, slate · the scorch was
  the shadow kind's navy → soot paint · the tongues were icicles → a fuller flame shape; 2 the tongues too faint at phone size → taller,
  bluer, a white heart; the line thicker; 3 the smoke invisible → darker; the vapour trail hidden in the flames → from their tips back.

## THE HARD LIMITS (`jaywalk-lab.mjs --j2perf` — 8 kids, tier 2, the worst frame over a whole lap frozen every 4th tick + 4× CPU running)

| runway | v1 night | v2 night (the default) | v2 day | v2 night `&rwnight=new` |
| --- | --- | --- | --- | --- |
| DOWNTOWN (390 · 430) — draw calls | 56 · 56 | **61 · 61** (J2: 61) | **34 · 34** | **61 · 61** |
| THE AIRFIELD (390 · 430) — draw calls | 47 · 47 | **48 · 48** (J2: 48) | **27 · 27** | **48 · 48** |
| 4× CPU — fps (p95) | 60 (16.8 ms) | 60 (16.8) | 59.9–60 (16.8) | 59.9–60 (16.8) |

All ≤ 64 — no net draw call (the new pieces ride `K.flat` / `K.bill` / `K.shadow`; the busiest day frame uses 501 of `K.bill`'s 600). The
first run's one 430 AIRFIELD night 58 fps (an 83 ms frame) overlapped this pass's unit suite; THE FINAL RUN's clean re-run: **32 / 32 —
every row 60 fps, p95 16.8 ms** (one 59.9 with a single 33 ms frame).
**SIZE:** JAYWALK's line **2,556 KB / 164 modules** of 2,600 / 165 (J2: 2,544) — never raised.

## THE FRESH-EYES REVIEW (a separate agent that wrote none of it — THE END CHECK, THE WAIT GUARD, the `cvr` plumbing)
- No HIGH. THE END CHECK: an honest phone's `e` = the replay in every case looked at (the cap, match vs solo tick 0, `from`, the proof
  writer's order — `e` only after the last chunk is acked, a rejoin replaying the server's own chunks, firstChunkHops' `e: null`, the daily
  not passing `end`). THE WAIT GUARD: the DP sound + pure; the lane-order cluster sampled over 43k layouts — worst wait 145 (limit 216),
  slack ≥ 71. `cvr`: reaches START on every up-to-date phone; `Number(undefined) >= 2` refuses only the pre-fix build.
- **LOW → MED by THE END CHECK — FIXED:** `view.js#catchUp` stopped at the clock's tick, so after a rejoin whose clock estimate moved BACK a
  hop already on the server was never played on the phone → its `e` would differ → an honest run refused 'old build'. Now it plays up to
  the last logged hop (`max(clock, last hop + 1)` — at most CLOCK.ahead; the live loop logs nothing new until the clock passes it).
- **LOW — named, not built:** a solo run past the proof writer's 10,000-chunk cap (~2.8 h) writes its full `e` over a cut log → now refused
  in place of counted to its last logged hop. · J2's M1 again: a pre-fix HOST shows its own v1/v2-old podium + night points (the server's
  count right) until it reloads.
- Found in THE FINAL RUN, a TEST fault: `e2e-jaywalk.mjs`'s "names the vehicle" rebuilt the course as v1 for a v2 run (J2's own v2 run had
  ended some other way) → the row's own `cv`.

## THE FINAL RUN (local, the Beelink — my own emulators + `DAILY_TEST=1 serve.mjs --emu`; Nov 21, ~17:30 → 19:50 UTC)
- unit `node --test tests/*.test.mjs` **2,497 / 2,497** (+ `jaywalk-j2fix` 5 · `jaywalk-v2-frozen` 5)
- the real switch: `e2e-jaywalk` FAST **102 / 102** (re-run on the final view.js: 102 / 102) · `e2e-jaywalk-match` FAST **103 / 103** · `--four`
  **101 / 101** · `--two` **7 / 7** · `e2e-jaywalk-daily-run` v1 **58 / 58** · `e2e-console-fix` **55 / 55** · smoke **24 / 24** · `jaywalk-lab --perf`
  **127 / 127** · `--j2perf` **32 / 32**
- v2 (`JW_CV=0` against a `JW_CV_SWITCH_MS=0` server): `e2e-jaywalk` **102 / 102** (after the test's v1-course fault, above — the first run
  101 / 102) · `e2e-jaywalk-match` **103 / 103** · `--four` **101 / 101** · `--two` **7 / 7** · `e2e-jaywalk-daily-run` v2 **58 / 58**
- the match re-run on the final view.js (the real switch): the first run right after the server's restart stopped at 85 / 101 ("the night
  record"); the three runs after it **103 / 103** each, no 'old build' in any log — named, not chased.
- rules `rules.test.mjs` **100 / 100** · `/api` `server.test.mjs` **72 / 72** · `daily-jaywalk.test.mjs` **7 / 7**
- Every server I started stopped at the end (the emulators + serve.mjs + the J2 worktree's :5174, by their own PIDs).

## SHOTS — `Downloads\NEON\jaywalk-j2fix\` (390; `-430` = the same at 430; the frames in `raw\`)
`day-before-after.png` (J2 day | J2 FIX day | the trail ending) · `night-compare.png` (night as shipped | `&rwnight=new` | the new day) ·
`blackbird-frames.png` (the first runway + THE AIRFIELD, three frames each, night + day).

## OPEN FOR BEN
1. **RE-PUBLISH: nothing new** — J2's `database.rules.nov21-j2.json` still before 2026-11-27 4 am Eastern.
2. **THE NIGHT COMPARE:** open `jaywalk-lab.html?cv=2&rw=1&rwnight=new` by night — if you like it over the shipped night, a one-line add-on
   flips it (night.js `RWN`).
3. **Named against the spec:** "the build-time crossing check unchanged" — `runwaySlack` is, but THE WAIT GUARD sits beside it: with your
   speeds nothing else kept a careful player never trapped + the wait ≤ 4 s (the first try trapped 45 start ticks and waited up to 6.6 s).
4. The steady TEST bot (it hops on gaps without reading the tell) now dies at 4.7 % of the runways it meets (J2: 1.5 %) — the blind-cross
   threat and the careful player are J2's; say if real players find the slower jets harder.
5. Known, not built: a solo run past ~2.8 h (the chunk cap) is now refused rather than cut · J2's M1 (a pre-fix HOST's own podium).
