# Review findings (Part 1)

> A pass log moved out of `docs/harbor.md` (C4d, Oct 29 2026). The bible + the index of every pass: [docs/harbor.md](../../harbor.md).

## Review findings (Part 1)
Read-only review of Part 1 against this file (Oct 21 2026): the camera + layout numbers at the six sizes, the scene API against
title.js / title-dock.js / backdrop.js, the baker + the budget, the scheduler, the flag, and what Parts 2–12 will hit. The camera
table above checks out at every size (F, VPY, the squeeze, people, the bus); the API matches every call the title makes; the flag
is never saved; the 22 tests pass. Ranked, real problems only (what Part 2 already plans is left out):

1. **FIXED (Part 2):** the corridors are chosen against the whole silhouette and tested so (towers, heroes, the panorama, side faces). **The landmark towers and a hero block stand ON three of the seven sun gaps, on every phone** — the claim above ("the landmarks
   and hero blocks stand clear of them") is false and the test only checks the bands (`harbor-layout.js#harborLayout`: only
   `band()` calls `inGap`; `tests/harbor.test.mjs` "the sun gaps stay clear"). At 390×844 the sunburst (x 249–278) covers the gap
   at 273 (f 0.70), the needle (300–323) and NEON PAR (290–334) cover 308 (f 0.79), the mast (45–69) covers 51 (f 0.13); at
   1440×900 the mirrored sunburst covers 1008. And since the rays are drawn between the `far` and `near` layers (scene.js#draw),
   the near layers are exactly what occludes them — these are the gaps that matter. **Fix (Part 2, before the rays):** choose the
   corridors against the whole silhouette (bands + landmarks + heroes + the panorama's mirrored landmarks): e.g. 0.13 → ~0.19,
   0.70 → ~0.73 (12 pt free between the sunburst's 278 and PAR's 290 at 390), drop or move 0.79; and test
   `[...bands, ...landmarks, ...heroes]`, not `L.bands`.
2. **FIXED (Part 1.5):** `createScheduler` keeps `running` as state from a fixed anchor (the local midnight a day back), replayed once, advanced once per slot; tested (t vs t − SLOT, a contended parade case, anchors a day apart). **The scheduler re-decides the past as its window slides: events pop in mid-flight and vanish** (`harbor-events.js#schedule`,
   `n0 = n1 − ceil(longest / SLOT)`). A slot's admissions depend on lane conflicts with the slots before it; every 90 s the window
   drops its first slot, so the next slot is re-decided without the event that blocked it, and an event that was "blocked" a minute
   ago is "running at k ≈ 0.8" now. Measured with 5 sky events of 4 slots + 5 water events of 6 slots, all common, 9000 samples
   over 3000 slots: at 5217 of them an event was active that the schedule one slot earlier did not have. Rarer with few events, but
   it is exactly the long, contended case (a parade, the banner plane). The "deterministic" test compares a moment with itself and
   cannot see it. **Fix (before Part 6's first real event):** keep `running` as state advanced one slot at a time from a fixed anchor
   (replay from local midnight − 1 day at load, ≤ 1920 slots, once), advanced in the scene once per slot instead of recomputed from
   scratch every 500 ms; add a test that `schedule(t)` and `schedule(t − SLOT_MS)` agree on every event spanning both.
3. **FIXED (Part 1.5):** `plan()` keeps the baked canvases + `ready`; the stale layer draws (stretched after a resize / tier change) until the swap; rebakes wait for the crossfade; E2E: `setTier(1)` never blanks a stage pixel. **Every re-layout blanks the whole city until the next bake lands.** `bake.js#plan` sets `ready: false` on every group (the
   canvases keep their pixels, `scene.js#layer` skips them), and `layout() → plan()` runs on a tier step-down (exactly when frames
   are already slow — bake steps of 2–3 ms mean 10–20 frames of sky, boats and people over nothing), a desktop resize, `safeBottom`,
   and any measured dock / tag rect moving > 1 pt (`maybeRelayout`, e.g. the sign reflowing when the Google fonts swap in after
   the first bake). The crossfade exists but never gets a source on this path. Related: `baker.start()` queues a clear of `next` —
   the crossfade's source — so a second look change within 1.2 s of a bake landing (every `&speed=60` run) dims the city for the
   rest of the fade. **Fix:** in `plan()` keep `ready` and the old band's `y0 / h` for a group whose canvas size is unchanged and
   draw the stale `cur` until the swap (then the existing 1.2 s crossfade); on a resize / tier change draw the old `cur` stretched
   into the new band rather than nothing; gate `rebake()` on the crossfade being done. E2E: `setTier(1)` mid-session and assert a
   stage-band pixel is never the bare sky colour.
4. **FIXED (Part 2):** blocks are clipped at a corridor (the piece in it lowered to its band's floor), never dropped; tested: no hole in the base. **The gap-skip tears whole blocks out: the "corridors" are 13–94 pt holes, different in every band and at every size** (`band()`
   drops any block touching a gap and advances by the block's width). Measured clear width at the gaps (planned 6–10 pt): haze
   14–22, far 13–61, mid 22–92, near 46–72. Part 2's skyline inherits missing teeth where it wants narrow slots for the rays.
   **Fix:** clip, don't drop — end the block at the corridor's left edge and resume at its right (two blocks); pad the corridor by
   2 pt because a side face intrudes up to ~1.5 pt (z1 − z0 = 12–14).
5. **FIXED (Part 2):** every block / tower tier / hero has `win`; the lit windows are their own layers (lights.js) on the light key; `set()` and `spell()` address windows by (building, tier, col, row). **Nothing can address a window.** `blocks.js#skyBlock` rolls the glitter from `rngFrom(round(x0·131 + z0·71 + h·31))` straight
   into the `far` / `near` bakes; no block carries rows, columns or a lit set, and the only windows with identity are the
   speakeasy's six. Part 2 (facades), Part 7 (rooms), Part 10 (flags in windows, a word lit across a facade), Part 11 (party
   windows, the small hours going dark) and the `windows` lane all need a per-building grid and a lit layer that is not in the
   look-key bake. (Also: `h` is in the seed, so the glitter re-rolls on every relayout.) **Fix now, in the layout:** give every
   block / landmark / hero `win: { cols, rows, u0, v0, pitch }` (world units, from the seed) and draw "which are lit" in its own
   cheap pass — a `lights` group re-baked on its own key (per minute) or sprites per frame — so a word, a wave or a flag is
   addressed by (building, col, row).
6. **FIXED (Part 1.5):** `laneRects` gives eight lanes real rects (sky-high / sky-low split), tested at six sizes against the sign, the corner buttons and the dock; `quiet` → `fs.density`, read by the planes, the birds, the swifts and the cars; drawn in `&grid=1`. **Lanes are names, not places; the sky has two schedulers; `quiet` reaches nobody.** The scene never reads `events.quiet`
   (it only returns it), and the district's aircraft / wildlife / fx modules keep their own clocks, so a Part 6 / 10 banner plane in
   the `sky` lane can meet a regular plane in the same strip and a heavy parade cannot thin the birds or the traffic. No lane has
   geometry: the grid draws `sky` as safeTop..limitY with the sign inside it (under the tagline there are exactly 10 pt), so a
   banner plane's only corridor is above the sign, and nothing states it. **Fix (before Part 6):** add lane rects to the layout
   (`sky-high`: safeTop..the neon's top, `sky-low`: the tagline's bottom..the roofline, water, road, promenade, the speakeasy's
   windows + rooftop) with tests like the door's (clear of the sign and the corner buttons, tall enough for a banner), and route
   `quiet` into `fs` as a density factor the aircraft / wildlife / traffic read.
7. **FIXED (Part 1.5):** `skyBlock` passes `y0` to `box()` (and lifts the crown, the hairline and the windows); no screen translate. **The landmark tiers are projected wrong** (`landmarks.js#landmarkSteps`): each tier is lifted with a screen translate of
   −F·y0 / z0, but its far edge is at z1, so a side face's top-far corner lands F·y0·(1/z0 − 1/z1) ≈ 8–9 pt too high on the
   sunburst's top tier; the setbacks' side faces lean. Invisible in grey, wrong under Part 5's shading and Part 4's reflections.
   **Fix:** pass `y0` to `box()` (it already supports it) and drop the translate.
8. **FIXED (Part 1.5):** `setUrlRoom` keeps `city=2` like `pdperf` (E2E: HOST → the URL keeps it → a refresh rejoins on it). **`setUrlRoom` strips `city=2` from the address bar the moment a room is entered** (`identity.js#setUrlRoom` keeps only
   `room / slot / emu / pdperf`). The page keeps the Harbor (the import was bound at load), but a refresh in the lobby, a rejoin,
   or the title after a refresh is today's city — a HOST → refresh test flow silently switches cities. "Never saved" holds; keep the
   flag in the URL the way `pdperf` is kept (one line) so a dev session stays on the Harbor across refreshes.
