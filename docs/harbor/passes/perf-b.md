# PERF-B — THE OWNER's PERF-A REVIEW + THE FINALE + FOG + THE OVERHEAD + THE RULES + THREE scene.js CUTS (Nov 1 2026, City 2.0)

The second speed pass, built from FR5 (`docs/harbor/review-5.md` — PERF's PLAN, Groups 2, 4, 5), PERF-A's hand-off (`passes/perf-a.md`) and
THE OWNER's review + PHONE BENCH after PERF-A (Nov 1, iPhone, iOS 18.7, 402×660, dpr 3: fog 41.4 → 51.3 fps, not 60; THE PARTY FINALE
worse, 56.7 → 51.2 fps, tier 2 → 1 at 22 s; the weeknight show + the blizzard 60; Halloween 58.9, the UFO 59.2). ONE session, the groups in
order, no helper agents; each group committed + pushed on its own. Measured on the mini PC like PERF-A: WebKit 2215 at the owner's 402×660
dpr 3 (the canvas rasterised on the CPU inside the draw calls) and Chromium 1248 with the GPU at 4× CPU; "before" = PERF-B's first commit
(4e4e9c0, PERF-A's end) served from `C:\Users\benja\Documents\trivia-ab` on :5174 (the fog's density check used d044eb7 — before PERF-A).
The probes live outside the repo (`C:\Users\benja\wk\` — new: `imgdiff.mjs` (two shots by band: mean light + |Δ|), `wkfill.mjs` (the
bench's fill count — 2D draws, paths, painted MP + the frame's work — A/B), `wkmp.mjs` (the painted MP by the line that paints it),
`wkload.mjs` (a fresh load's frame gaps after the reveal, WebKit), `crprof.mjs` (a CPU profile of a load's window + its longest tasks),
`wkbis.mjs` (variants side by side, interleaved), `crload2.mjs` (crload + every gap)).

## Step 0
The owner's notes appended to plan.md ("OWNER'S NOTES — NOV 1 (morning)") + decisions.md (THE BALLOONS GET THE WHOLE SKY + the depth rule +
THE DISCO BALL; the ₿ pair approved; THE CLEAN GLASS + the fog's density + the blizzard's start + the weeknight show approved; the bench after
PERF-A; the crisp layers kept; the review links without `&debug=1`) — "docs: plan.md — the owner's notes, part 44" (cabd3bf).

## Group 1 — THE OWNER's FIXES (654f5b5)
- **THE FINALE's LEFT CLIP** — found: the fireworks' hide-behind mask (`screens/harbor/fireworks.js#mask`: per 4-pt column the roofline +
  the nearest piece's top) was ENCODED as y / the screen's height but DECODED in the shader × the layer's own height (the GL layer is cut at
  the water: ~480 of 874 pt). Every roofline + the speakeasy's flat top read ~45 % too high — the far layer's sparks were cut on a line at
  the tagline's height, straight over the speakeasy on the left (the big gold burst beside the N). Encoded / the layer's height now: the
  gold burst's sparks fall past the tagline toward the skyline + still hide behind the billboard; 390 / 402 / 430, WebKit `--cast`.
- **THE BALLOONS GET THE WHOLE SKY** (`balloons.js`): the tagline ceiling gone — the open sky is the scene's message box (under the corner
  buttons → the crowns); the festival's 7 heights alternate HIGH / LOW across the whole height (ALT for 7); every balloon has a slow ALTITUDE
  JOURNEY (±16 % of the sky over 9–15 min, x-neighbours swinging apart) so it drifts THROUGH the sign's band, never parked over the letters;
  a single balloon at any height (seeded). **THE DEPTH RULE**: `near ≥ 0.6` = in FRONT — while it overlaps the sign's band (NEON → the
  tagline) it is drawn on its OWN small fixed canvas above the sign (z 2, like the Blackbird + the Mothman; moved by a transform, freed with
  the flight); the far ones stay in the city's canvas behind the lit tubes. The roofs / billboards / spires floor (PERF-A) stays.
- **THE DISCO BALL** (`balloons.js#discoTiles / tileColour / discoFabric`, `FESTIVAL_ORDER[6]`): ~400 mirror TILES on the envelope's front
  half (a row per 7.5° of latitude on the dome, the same arc down the taper; fewer where the circle is smaller; every other row staggered),
  each tile's normal (the sphere's + a seeded tilt) reflecting the view: by DAY the sky (pale → deep blue, warm at golden hour) above, the
  warm city below, the sun's glint cluster; at NIGHT the night sky + the NEON sign's pink in the upper tiles, the city's neon colours in the
  lower; the grout, the 12 gores' meridians, the crown's vent, the dark seam at the mouth, a soft sheen + shade for the sphere; the burner's
  flash lights the lower tiles warm. **The glints**: THE TIER TABLE's `discoGlints` [2, 4, 6] four-point stars on the brightest tiles, each
  flaring + fading over 1.1–2 s and sliding a little with the turn (seeded on the clock: every phone the same). One baked sheet per light
  (like every kind) + the glint sprite; no per-frame tile drawing. `festivalSpots`: the disco ball on the RIGHTMOST spot, the ₿ pair ≥ 3
  apart and never beside it (the nearest valid pair to the shuffle; 800 shuffles in the unit test). Three refine passes (day / night /
  golden hour at 402 + the twinkle as a burst; the night tiles brightened + the sign's pink; the day contrast up).
- **THE CLEAN GLASS** (`fogdepth.js#glass / holed / wisps`): the speakeasy's windows read clean through fog + snow — the stage veil, the
  promenade's bank, the lamps' lift + the windows' warm halos are drawn round the glass (an even-odd clip; the halos now hang AROUND each
  window — they were the warm SMUDGES on the lit panes), the glass taking the veil like the bricks only by day (glassK = the windows' light).
  THE WISPS: long soft streaks carried across the facade on the wind (WF at the facade, ≥ 14 pt/s), two tracks a row of windows on their own
  periods — the only fog the clean glass shows. The blizzard: the flakes cross (moving), no white smear. `&force=fog-glass` = the old look.
- **THE FOG's DENSITY** ("I think we took too much fog out") — verified against d044eb7 (before PERF-A), WebKit 402×874 + 402×660, tapped:
  at NIGHT unchanged (≤ 0.8 / 255 by band — PERF-A's changes were invisible there); by DAY the top of the sky had lost ~6 / 255 — the
  cloud deck skipped under a dense veil was part of the white-out by day. The deck is painted again by day + golden hour (skipped only in
  the dark, where the bench measures): day fog = the pre-PERF-A look within 1.5 / 255.
- **THE BLIZZARD's FIRST SECONDS** — found by a load profile (Chromium 4×) + `wkload` (WebKit): (1) the frost pane's bake (~0.3 s at 4×)
  inside the reveal's 1.4-s frame; (2) its glow = each of a few hundred strokes with its own `shadowBlur` — a GPU stall of ~3.4 s in Chromium
  (no JS long task in it), ~0.1-s frames in WebKit; (3) in a freeze the vignette went back onto the canvas so the pane could lie over it.
  Now (`district/frost.js`): the pane bakes in STEPS (one a frame, held ~0.8 s past the reveal; a joined city's frost fades in over ~1.2 s,
  never a pop), its glow ONE soft quarter-resolution layer laid on once (the look compared: the ferns, the haze, the clear holes), and the
  pane is its OWN page layer over the vignette's (`s.layer`, opacity = its strength) — no full-screen draw a frame, the vignette stays a layer
  in a freeze too (City 1.0 draws it on its canvas as before). **Chromium 4×: the 3.4-s stall gone (gaps = a clear night's); WebKit 402×660:
  the old build's 0.7 s + 0.6 s stalls at the reveal gone (the worst frame ~0.25 s, a clear night's).** + `glasswx.js#drawSnow`'s key: a
  letter's light in 4 steps (the boot flicker re-rendered the sign's snow each step).
- The fireworks draw only the ring's LIVE sparks (Group 2's first cut — it rode in this commit).
- Tests: `harbor-balloons.test.mjs` (the festival of 7, the disco tiles), the frost checks (the pane waited for + sampled with its layer),
  the festival's order in `wild.mjs`. Touched groups: weather, sky, fireworks, freeze, snow — 120 / 120 + 25 / 25 after the frost fix.

## Group 2 — THE FRAMES: THE FINALE, THEN FOG (8ffbf10)
- **What the finale costs** (WebKit 402×660, the bench's own fill count, `wkfill`): 8.6 MP painted, 760 draws, 1,500 paths a frame — the
  SAME as the party peak without a show and the same before / after PERF-A; the people are ~730 of the paths but ~1 ms (`force=no-people`:
  18.1 → 17 ms). So the finale's extra is the GPU layer (the near launches, the dragon eggs) — the phone's GPU, invisible here.
- **THE GPU cuts, the same picture** (`fireworks.js`): (1) THE LIVE RANGE — the ring held ~30 s of a finale (11,000 instances at its end)
  and every pass (the washes, the sparks, the reflections) drew all of it, the dead culled only in the vertex shader; a `tail` now walks
  past the dead (each slot's death kept) and each pass draws [tail, head) — ~1,500 live of 2,700 written at the finale's end; (2) THE POPS —
  a crackle's 0.07-s flash used a 3.2× halo quad (×2.6 its size): 2.0× now — the closing dragon eggs' thousands of pops, 0.39 of their
  fragments; (3) THE REFLECTIONS — a mirrored spark that lands wholly outside the water band is dropped in the vertex shader (it rastered its
  whole quad for the fragment shader to discard). Frames compared in WebKit 402×874 (the bursts, the dragon eggs, the streaks on the water).
- **The dancers' pose cache** (FR5 M) — NOT built: in the finale the crowd stands watching (33 of 40 looking up, 0 dancing — the e2e), the
  people are ~1 ms of WebKit's 18, and the cache's 1/32 phase steps would make every walk visibly stepped. The crisp layers — kept (DECIDED).
- **FOG** (`wkbis`, each part off in turn, interleaved): the dense-fog frame now costs a clear night's in WebKit (24–26 ms vs 28 — the fog
  hides the clouds + the far rows); the veils ~0.5–1 ms, the banks + the water fog + the lamps' lift ~0; the one fog-only cost left = the
  lights' HALOS (~3 ms — half of their pixels the NEON logo's own ~260 × 220-pt glow). Tried + DROPPED: the logo's glow as a compositor
  layer (`mix-blend-mode: plus-lighter`) — 1.3 ms faster but it added up dimmer in WebKit (the pink haze in the letters weaker) — a look change.
- **Halloween (58.9) + the UFO (59.2)**: nothing found to fix — noted (the sign's dressing redraws only its moving spider's box).

## Group 3 — PERF-A's CARRY-OVERS + GREEN
- The frost pane after the reveal — done in Group 1 (+ a layer, + no blur passes).
- FR5 A4.2 — the crossing's WAIT / WALK: its width measured once per size + word (was `measureText` every frame); A4.3 — the flake cache's
  key a NUMBER (a string built per flake per frame: ~23 ms/s in the blizzard).
- **THE SET IS NEVER SEEN** (perf-a.md's flake: one frame at a random flicker PEAK read 197 vs 175): a drawn set is a bright rectangle in
  EVERY frame — the check now reads 5 frames 0.3 s apart: the ratio (brightest cell < 3.2 × the mean) in all of them, the brightness at
  the flicker's middle (the median frame). The same bug caught, not a random peak.
- NOT done (→ the hand-off): the people's plan warm-up spread over frames (M), A4.4 the per-frame gradients in `draw()`, H2 one glow-sprite
  cache — each ~0.1–0.3 ms of JS, and the phone's frame is outside the JS.

## Group 4 — THE PASS OVERHEAD
- **THE WINDOWS GROUP IN PARALLEL** (`harbor-e2e/windows.mjs`, FR5 D2's #1): its 28 blocks (31 pages) are jobs; a pool runs 3 at a time
  (`WIN_POOL`, 1 = the old order); the 8 that time FRAMES (the toast's 60 fps + arm steps, the walk-in's depth steps, the tango, the TV's
  flicker, the boss late, the cash, PLAY ALL's sequencer) run alone after the pool. A failing block records its error and the rest run.
- `harborUp + sleep(1500)` → `settled()` (17 sites: wild, windows, holiday); the legends' fixed 52-s window → its condition (the UFO gone
  + ≥ 3 walkers back, ≤ 52 s); the music group's four 1.9-s "past the stuck" pauses → the engine's own `health.stuck`.
- The cloud: the perf job's warnings-only pacing loop skipped on CI (`ON_CI`; it runs on the mini PC); the smoke's watch 14 → 8 s a game;
  `npm ci --no-audit --no-fund` in tests.yml.

## Group 5 — THE RULES + THE SPLIT
- **THE CANVASES COUNTED** (FR5 B3): the eight City 1.0 modules the Harbor imports (`district/stars, fx, sun, fireworks, rainbow, frost,
  weather-fx, aircraft`) took 31 raw `getContext('2d')` contexts outside `canvasMb()` — every one through `ui/canvas-safe.js#safeCtx` now
  (counted by the memory guard; a refused context draws nothing instead of throwing). City 1.0 unchanged.
- **THE WIND IS ONE STATE** (FR5 C2d — the five leaks): the contrails (`air.js`) drift on `WF.v`, the chimney smoke + the flags (`chimneys.js`,
  `dayfx.js`) lean on `WF` (its gusts roll through), the clouds (`clouds.js`) drift on WF's MEAN speed (never its gusts — a deck's x is speed ×
  the clock's seconds), the banner's ripple follows the gust wave where the plane is (`WF.at`) — its own synthetic sine is gone. `fs.windF`,
  the flags' + the chimneys' env carry WF.
- **THE CITY TIMETABLE** (FR5 C2a): `core/harbor-moments.js#partyAt` reads the timetable's `party.night` row (from 20 → to 26) with its own
  margins (half an hour early, 15 min late) — one definition of the party night.
- **THE TIER TABLE** (FR5 C2b): the scene's own three-row `TIERS` → `sceneDpr` (×10; tier 2 = BAKE_CAP) + `bakeMs`; the sign dressing's
  `dressDpr`; fog's promenade bank `fogPromBank`; the UFO beam's `ufoMotes` (`legends.js`). NOT moved: the party beams' `tier === 0 ? 0.8 : 0`
  (a value that FALLS with the tier — the table's own rule forbids it; a decision for the owner / the next sweep).
- **The force-flag test** (FR5 C2f): its pattern reads every receiver (`[\w.]*force|off|f|ff`) — a stray through `s.force`, `f.force`,
  `fs.force`, `w.force` or `ctx.force` now fails it (none today: 9 / 9).
- **THE FIRST scene.js CUT — `scene-fireworks.js`** (FR5 C1 #1, a pure MOVE): the fireworks' wiring (the shows of the night + the previews,
  the sign joining the show, the crowd's view, the sounds on the clock, the GPU layer's tick — 189 lines) out of `createHarbor`; one factory,
  `createSceneFireworks(C)`, taking ONE ctx of getters onto the scene's state (C.L, C.LK, C.cam, C.W… — read by reference, never copied) →
  `{ fwx, state, tick, crowd, hold, nightOf, plan, dimK }`. scene.js 3,928 → 3,753 lines (its five now-unused imports gone). Proof: pixdiff
  against the tree just before the cut (night, party, noon, golden, Halloween + the no-cloud pair: golden 0 px; the rest only the live
  movers — the dancers' wands on the beat, the candles' flicker, the shadowboxer — which differ between two loads of one build too) + the
  fireworks group + the baseline guard.
- **The legends + holidays cuts — NOT done (→ the next pass, FR5's order kept)**: unlike the fireworks block (which owns its state), the legend
  state (`legends`, `LB`, `legendPow` — ~100 sites in `draw()`) and the holiday state (`HS` / `HP` / `HR` — read across the frame) are
  ASSIGNED in their blocks and read everywhere; a pure move needs the ctx object to carry setters (or the frame to read them off the module)
  — a design step with its own review, not a rushed move at the end of a speed pass.

## THE FINAL LOCAL RUN (the mini PC, alone)
Unit 956 / 956 (30 s) · rules 45 / 45 · /api 25 / 25 · smoke — every game — 14 / 14 (the 8-s watch) · **THE FULL HARBOR SUITE 800 / 801 in
20.1 min** (4 shards ending at 688–886 s — PERF-A's 826–918 — then panel + perf 213 s); the one miss: the tape's watchdog (Known issues).
**The overhead saved**: the windows group 446 → 280 s locally (the cloud's critical path), the legends + music + holiday groups 10–30 s each,
the cloud's perf job ~70 s (the pacing loop) + the smoke ~48 s (8-s watch × 12 games), the npm noise.

## THE NUMBERS (before = 4e4e9c0, PERF-A's end · after = PERF-B's end; the mini PC)
| scene | WebKit 402×660 dpr 3, frame work (ms, 3 windows) | the bench's fill (WebKit) | load (after the reveal) |
| --- | --- | --- | --- |
| THE PARTY FINALE (Sat 10 pm, `force=finale`) | 18.4 → 18.2 (the same — its extra is the GPU layer) | 8.5 → 8.6 MP · 766 → 759 draws · 1,477 → 1,495 paths (the same); the GPU: each pass draws the live sparks only (~1,500 of the ring's ~11,000 at the end), the pops' quads 0.39, the off-water reflections dropped | — |
| dense fog, 9:30 pm | 24.5 → 25.0 (the clean glass's clip + the wisps: +0.5) | 9.2 MP (= PERF-A's) | — |
| dense fog by day, 1 pm | 22.4 → 24.3 (the cloud deck painted again under dense fog by day — the owner's density) | — | — |
| the conga break (Sat 10:06 pm) | 34.8 → 34.6 (the same) | — | — |
| a plain night (Thu 10 pm) | 20.6 → 21.1 (the same — noise ±0.5) | 5.8 MP | — |
| the balloon festival (fast), July 9:30 pm | 29.3 → 30.0 (the 7th balloon + its glints) | — | — |
| THE BLIZZARD (9:30 pm) | — | — | **WebKit: the worst frame 0.70 s → 0.25 s** (= a clear night's) · **Chromium 4×: the 1.7 + 2.0-s stalls after the reveal gone** (gaps = a clear night's) |
`title-perf --ab` (Chromium, the GPU, 4×, t2): the party peak + a plain night — **same** (work +0.26 / +1.56 ms inside the noise ±7.1 /
±2.4). THE BASELINE GUARD 0.47–0.53×. The memory: + one small overlay per front balloon while it is over the sign (~0.2 MB at tier 2), the
disco ball's glint sprite (48 × 48); the frost pane the same canvas (a page layer now, still counted); the eight district modules' canvases
now IN the count (the guard sees the whole picture — its numbers read a little higher, the city the same).

## Decisions
- **The depth rule's line**: `near ≥ 0.6` (the festival's near / big half + every single balloon) passes in front of the sign; the overlay
  only while it overlaps the sign's band (elsewhere it is in the city like the rest — the clouds + the veils still cover it there).
- **The sign's band is crossed, not avoided**: at 402 the NEON letters fill most of the sky above the tagline — "never over the letters"
  would put every balloon back in one row under it; the altitude journey moves each balloon through the band in a few minutes instead.
- **The clean glass by night only** (glassK = the windows' light): by day the panes take the veil like the bricks (clean dark glass in a
  white-out read pasted on).
- **The deck back under dense fog by day** — the skip stays at night (where it is invisible and the bench measures).

## Known issues
- **THE TAPE's WATCHDOG check (tape group)**: failed once in the full local run (800 / 801) — under the four shards' load the slice-end
  fallback (`tape-stop.js`: `left < 0.6 → back(true)`) brought the song back before the watchdog's wait, so `reloads` read 0 (the song DID come
  back: "BACK ON THE ELEMENT" passed); green alone 2 / 2. A timing race between two valid recoveries — the check should accept either or the
  scenario should hold the slice longer; next pass (never a widened tolerance).
- **The finale + fog on the phone**: their GPU-side cuts can only be judged by the owner's `&bench=1` run (the mini PC's GPUs + WebKit's
  software GL sit outside the frame's JS). If the finale still steps 2 → 1: the near layer's per-shell sparks, then the crisp layers at the
  party peak (the owner's last resort). Fog: the halos are the one fog-only cost left (~3 ms in WebKit — half of it the logo's glow).
- **The balloons over the letters**: the near ones pass IN FRONT of the NEON letters for minutes at a time (a crossing is slow) — by the
  owner's rule (drift through, never parked); his look on the links decides if the journey should be faster through the band.
- **Day fog +2 ms** in WebKit — the restored cloud deck (the owner's density); by night the skip stays.
- **The legends + holidays scene.js cuts** → the next pass (see Group 5).
- The disco ball's glints are seeded on the clock but its tiles don't turn (one baked sheet — the glints slide with the turn): unzoomed at
  ~30 pt a turning tile sheet would not read; noted if the owner wants more spin.

## Handoff
- **APP FIXES** (the ci tag): Grok's other findings — presence healing + a fresh hostBeat blocks a claim (client + rules), the radio after
  unlock + the title's clock offset + stop / gain / seek, the rules holes, chat locks for stakes / rum, the lobby chat leak. The owner
  RE-PUBLISHES THE RULES after it.
- **Later City 2.0 passes**: the legends + holidays cuts (a ctx with setters), then FR5's order (weather, party with H8, perf, panel, the
  draw() quartering); the people's plan warm-up over frames; A4.4 + H2; the beams' tier-0 fallback (a decision); the windows' other heavy
  groups in parallel (workers 229 s — its waits are city time).
