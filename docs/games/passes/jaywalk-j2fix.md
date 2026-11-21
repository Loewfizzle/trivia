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
