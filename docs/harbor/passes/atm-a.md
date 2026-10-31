# ATM-A — GREEN MEANS GREEN, THE MODELS FIXES, WIND AS ONE SYSTEM, THE CLOUDS + THE SKY's LIGHT (Oct 31 2026, City 2.0)

The owner split ATM in two (plan.md "OWNER'S NOTES — OCT 31 (night)"): this pass = the tests green + the MODELS review fixes + the wind as one
system + the water + the wind sounds + the clouds + the sun. ATM-B (next) = fog as depth, the storm + lightning + the cumulonimbus decks, freezing
rain, heavy snow in layers + the blizzard (its sounds already imported here).

## Group 0 — GREEN MEANS GREEN
- **THE TEST BROWSER** (`tests/integration/kit/puppeteer.mjs`, every browser script imports it; `tests/test-browser.test.mjs` greps for
  strays): `--mute-audio` always (the owner: the city's sounds came out of the mini PC's TV + soundbar during a pass); on Windows
  `--disable-gpu-compositing`.
- **THE MINI PC's 30 FPS, found**: the mini PC drives its TV at **4K / 29 Hz** (`Win32_VideoController.CurrentRefreshRate` = 29) and
  Chromium on Windows takes its frame clock from the primary display's vsync even headless — a plain rAF counter: 33.4-ms frames, ~28.5 fps
  with the GPU, SwiftShader, the new / old headless, the no-throttle flags alike. `--disable-frame-rate-limit` reached ~52 fps unpaced;
  `--disable-gpu-compositing` runs Chromium's own 60 Hz clock (16.7 ms, 60.0 fps) with WebGL still on the Radeon 780M. `ONLY=perf`: the calm
  load + the battery's 60-fps moment PASS locally (they failed on every build before). (Setting the TV to 60 Hz would fix it too — the owner's
  call.)
- **THE FIRST-TAP SURGE — THE REAL RACE** ("FIRST TAP morning / day / late … (nothing)" in the cloud — the sign's answer never ran at all,
  4.4 s into a run whose song was already playing: not a slow decode). Right after a load the server clock's offset settles and the
  station's synced player RE-PLACES its voices: the song clock went ≥ 0, back to −1 for < 1 s, then moving — the start detector called that a
  crossfade (disarmed) while the tap's fallback had already stood down (the clock read ≥ 0 at the tap). Reproduced locally (the old code
  missed 2 of 5 mornings). FIX (the city): the detector is FRESH until the visit's first song is answered (`neon-ramp.js#createStartDetector`,
  title.js's module flag — a later title visit mid-song is still not a start), and a cooldown skip no longer overwrites the last real
  answer (`surge().skip`). 6 / 6 after; unit-tested.
- **THE 20-CYCLE MEMORY CHECK**: heap snapshots at cycle 2 vs 20 = **+6.2 MB of V8's compiled code** (1,098 InstructionStreams — it grows
  with how long + how fast the page ran: +4.3 here, +6.4 in the cloud on the same build) against **+0.35 MB of JS objects**; the DOM / Blink
  +1.2 MB. The check now counts every snapshot node but `code` (`harbor-e2e/kit.mjs#heapNoCode`) under the same 6 MB limit; the compiled
  code is printed apart.
- **9c's CRISP LIST BY DAY**: the wait returned at 3 items while the check wants 9 (the roof signs' copies register after the neon's bake and
  yield for a moment whenever a plane / the day's helicopter passes) — it waits for the whole list.
- (The patrol's daytime position check now samples the craft ON SCREEN — the flight's turn climbs to the far pass off the edge.)

## Group 1 — THE MODELS REVIEW FIXES
- **THE SHADOWBOXER's AIR PUNCHES** (the bag's untouched: `boxer.js#AIR`, only `beat.at === 'air'`): the arm scaled from its own shoulder —
  the jab ×0.89, the cross ×0.82 (shoulder → glove centre 0.448 / 0.488 → 0.40 of his height), the hook's upper arm ×0.9, the uppercut as it
  was — the shoulder turning further into the punch (0.035 / 0.06 → 0.05 / 0.085). Measured over a whole evening (a recording ctx, the
  back window's real 1.97 × 2.07 glass): the glove ran up to 7.5 % of the pane (~3 pt) under the frame; the shorter arm alone left 3 %, so
  his open floor moved 0.40 / 0.58 → 0.478 / 0.62 of the pane: the glove now stops **~1.3 pt** short of the frame, still a full punch
  (frame by frame against the MODELS build at 402, dpr 3).
- **THE WRAP-UP's BLIND**: (1) it dropped LINEARLY and stopped dead → smoothstep; (2) the snap: at blind ≥ 0.999 the window left his room's
  drawing for the parked path at once — the lit layer's own window glow (frame + sill light) back on, the crisp copy gone → his room keeps
  the window (the blind down over it, warm with his bulb) until the bulb goes out (`windows.js#boxerOpen`, `speakeasy.js#boxerRoom`);
  both paths are then the same dark blind. The thin hem bar still shimmers a little at dpr 3 as it slides through sub-pixel rows (a
  1-px line's anti-aliasing — not a layer swap).
- **THE PATROL's HOVER**: its hide list had the speakeasy up to its crest but not the roof billboard above it → + the board's face + its
  lamps (`scene.js#heliOcc`); a stop there climbs over it (+6 pt for the bob). Six forced flights: every stop over the speakeasy at y 487,
  clear of the board's top at 510; shot at 390 / 402 / 430.
- **THE TR-3B**: no light on the city at all — the rooftop glow + its harbor pools removed (`triWorldLight` gone); its own lights stay on
  the craft; the e2e checks `tr3bLight.cast === false`.
- **THE BLACKBIRD's CONE**: hold 2.6 → 2.34 s, the ring 2.8 → 2.52, the 2.6 s dissolve kept.
- **THE MOTHMAN**: postponed — the timetable row `status: 'off'`, `knobs.on: false`: `mothmanNight` gives no night (the tests read the
  dice with `{ dice: true }`); his code, models + `&force=mothman` / `-arrive` / `-leave` kept.

## Group 2 — WIND AS ONE SYSTEM + THE WATER + THE WIND SOUNDS
- **`core/harbor-wind.js`** (pure, `tests/harbor-wind.test.mjs`): `windInput` (the live wind + gusts + direction, `&wind=`,
  `&force=windy` 14 / 21 m/s, the new **`&force=gale`** 20 / 30 + its panel row, a calm 2.5 m/s fallback) → `windFrame` once a frame
  (`scene.js#WF`): the level (0 calm · ~0.26 breeze · ~0.65 windy · 1 gale), the lean, the side on screen, and **GUSTS AS SEEDED WAVES** —
  one may start every 3.5 s (more often as it blows harder + gustier), swells 1.1 s, holds 0.6–2.2, dies over 2.6, and ROLLS ACROSS THE
  SCREEN FROM THE UPWIND EDGE in 5.5 s (a breeze) … 2.8 s (a gale); the lulls at 82 % of the mean. `at(u)` the wave there, `v(u)` the wind
  there (signed).
- **THE CROWNS**: each a damped spring (0.38–0.7 Hz by its size, ζ 0.22) pushed by the lean + the gust wave at its place, + a rock + a flutter:
  a breeze ~1–2 pt at the top, a windy day up to **9.5**, a gale **13.3** (the e2e). NO GHOST: the layer under a moving crown is drawn with
  the crown's box cut out (an even-odd clip) and the box filled from a patch of the layer minus the crown's discs (made once a bake; the
  blade kept); the sheared copy over it. 60 fps while a real breeze (≥ ~5.5 m/s) moves them (`fastNow` 'wind'); under it the sway is < 1 pt.
- **THE RAIN**: the slant from the wind at mid-screen (≤ 0.9: ~42° in a gale's gust); in a wind the SHEETS are the gust waves — a band of
  denser, brighter rain rolling downwind. **THE SNOW + THE LEAVES**: the wind at each flake / leaf (a strong gust lifts the leaves).
  **THE PEOPLE**: walkers + standers lean into a strong wind (forward facing into it, a touch back with it behind — ~9° in a gale;
  `folk.js#setFolkWind`); the hand on the hat as before. The smoke + the papel picado on the same wind.
- **THE WATER NEVER A MIRROR** (`water.js`): a roughness FLOOR 0.2 at any wind (the textures keyed to the mean wind — the gusts never
  rebake them), a slow SWELL rolling toward us (~5 s a wave), the gusts roughening the ripples, dark CAT'S PAWS crossing the harbor with
  each gust wave (one gradient a frame).
- **THE SOUNDS** — docs/audio.md#the-winds-sounds: 13 web copies, **1.31 MB**; the beds by speed, a gust on each visual wave, a rare whistle;
  the blizzard + the sleet in their slots for ATM-B; klankbeeld's two CC BY lines in ☰ → CREDITS.

## Group 3 — THE CLOUDS + THE SKY's LIGHT
- **THE SPEED, measured**: a windy day's cumulus 1.6–2.6 pt/s (2.6–4 min across 402 pt), a gale capped the same (≤ 2.8), windy + snow's
  deck 0.2 pt/s. SP4's cap already held; a unit test now does (≥ 130 s for the nearest cloud at any wind). The seeded fallback: 1–3.4 m/s,
  "seeded" on the readout.
- **THE KINDS + THE LAYERS**: FP3a's model checked at noon — the high veil a bright blue sky + the 22° halo (the city near a clear day),
  the high overcast bright, the low stratus the only grey, broken cumulus with blue gaps. The readout's weather line now ends with the shared
  WIND (look, speed, gusts, side, source) to set beside the real sky.
- **THE SUN** (`district/sun.js`, the Harbor's path only): at ~11° up (9:30 am in late October) the cream disc + its rim still showed — the
  white-hot core came in only from 10–18°. Now from **3–9°**, and the core's outer ring carries only a hint of the stage's warmth (it was the
  cream at full strength at 0.8–0.9 of the radius: the "paper plate" rim) — a near-white core blowing out into the bloom; the warmth stays in
  the bloom (6–8° before sunset still warm); the crisp coloured disc only at the horizon. City 1.0 untouched.

## Group 4 — the numbers
- **`title-perf.mjs --ab`** (A = d6ee3aa, the commit before the pass, on :5174; 4× CPU, the new test browser): np-night **same** at every
  tier (t2 +10 ± 10 ms — the 4× software raster's noise; one earlier run read +5.7 ± 5.6 before calm air stopped moving the crowns) ·
  np-party **same** · a WINDY DAY (`atm-windy`) **same** at every tier · a GALE-strength wind (`atm-w20`: `&force=windy&wind=20`, both builds
  read it) **same** at every tier · the HIGH VEIL (`atm-veil`) **same**. `--vs` on the new build: a gale with vs without the crowns moving
  (`atm-gale` vs `atm-gale-ns`) **same** — the cut-out + the springs cost nothing measurable. (The first cut drew the layer through an
  even-odd clip path: +22 ms at t2 under 4× CPU — replaced by plain rectangles round the boxes.) `atm-gale` vs the old build reads SLOWER only
  because the old build has no `&force=gale` (its side was a calm, clear day).
- **THE BASELINE GUARD**: a plain night 0.41×, the forced bus 0.61×, the dog walk 0.55× (≤ 2×).
- **THE 20-CYCLE MEMORY CHECK**: heap **0.9 MB** without compiled code (+ V8's compiled code 5.3 MB, not counted), offscreen 13.86 → 13.86 MB.
- **THE CANVASES**: + one small patch canvas per swaying crown (two on the phone: ~0.2 MB each at dpr 2), made once a bake, only while a
  crown moves ≥ 0.3 pt.
- **THE SOUNDS' WEIGHT**: 13 files, 1.31 MB shipped (audio/city/ 19.48 MB).
- **THE FULL LOCAL RUN** (the mini PC, alone): unit 934 / 934 · rules 45 / 45 · `/api` 25 / 25 · smoke `GAMES=cipher` 3 / 3 · the FULL
  harbor suite **770 / 774** → fixed / classified: the old "a calm night is a glassy mirror" check flipped to the owner's "never a mirror"
  (hard); A CALM LOAD STEPS NOTHING (2× CPU) — the judge's own "this machine can't hold 60 fps here" timing check (p75 50 ms): the pre-pass
  build fails it identically; THE TOAST'S BIGGEST ARM STEP (F16, a timing check); PANEL PARTY ON's song (no song heard in 25 s once under the
  three parallel shards — `music` alone 112 / 112). Re-runs after the fixes: weather + windows 83 / 84 (the toast), panel 37 / 37, music
  112 / 112, sky 16 / 16.

## Decisions (Claude Code's calls — the owner may overrule)
- The 30 fps fix is a test-browser flag, not the TV: software compositing in the tests (matching the cloud's GPU-less runners).
- The memory check excludes V8's compiled code (it is the JIT's, sized by run time) — the limit stays 6 MB.
- The boxer's glove gap comes mostly from moving his open floor (0.40 → 0.478 of the pane) rather than shortening the arm past the
  owner's numbers ("DON'T OVERCORRECT").
- The TR-3B's water pools went with the rooftop glow ("no reflected light on the city at all").
- A gale is `&force=gale` = the windy state at 20 / 30 m/s (one more panel row, no new weather state).
- The crowns stay baked; only a moving crown is cut out live (no change to the bake, its memory or the blackout's handling).

## Known issues
- THE MINI PC's two TIMING checks (hard locally, warnings on the cloud): A CALM LOAD STEPS NOTHING — at 2× CPU in software compositing the
  machine can't hold 60 fps through the event ~25 s after the reveal (the pre-pass build fails it identically); THE TOAST'S BIGGEST ARM STEP
  (F16 — the pre-pass build fails it too: 0.285). GPU compositing would be faster but locks to the TV's 29 Hz — the real fix is the TV at 60 Hz (the owner's call) or a second monitor.
- PANEL PARTY ON heard no song once under the full suite's three shards (passes alone) — watched.
- The wrap-up blind's 1-px hem bar shimmers a little at dpr 3 as it slides (anti-aliasing).
- Coats + scarves don't stream yet (the lean + the hat only); the banner plane's streamer + the balloons keep their own wind handling.
- The cat's paws are one horizontal gradient a frame (no per-row shape).

## Handoff to ATM-B
- The wind state is there for the storm's sheets + the blizzard's whiteout (`WF.at`, `WF.v`); the blizzard + sleet slots are filled
  (`blizzard` two takes, `sleet-glass`) and silent until ATM-B plays them; fog banks can drift on `WF.v`.
