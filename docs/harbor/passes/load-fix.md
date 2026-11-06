# THE LOAD FIX — the city comes in ONCE, clean (Nov 6 2026, afternoon; plan.md "OWNER'S NOTES — NOV 6 (afternoon)")

> The owner's iPhone, Safari, random loads (1:02–1:04 pm): THE DOUBLED LETTERING, the city POPPING IN IN CHUNKS, THE TOGGLE at the top
> centre flashing, A WHOLE DIFFERENT SCREEN flashing up and fading. A short pass right after BUZZED LIGHTYEAR, before OVERCLOCK pass 5.
> ONLY these four — nothing else from FRIENDS' list was started (its items stay on the list: THE TIER GEM's one shape, the radio's order, the
> victory sounds, the YOUR CARD row, the console's game accent). The bible: [docs/harbor.md#performance](../../harbor.md#performance).

## Group 1 — REPRODUCED (no fixes)

**The tools.** `tests/integration/wk-load.mjs` — THE BOOT IN WEBKIT (Playwright's WebKit, Safari's engine, 402×874 @3 as an iPhone; cold /
`--warm`; `--scene day|grey|night`; `--bars pre|fade|after|late`: Safari's bar = the window's height 874 → 800 → 874 before the reveal, as it
fades in, 1 s after, 2.8 s after; `--safari` keeps the city's `100lvh` box at the LARGE viewport while the window shrinks — what Safari does:
the bars move the dock + the sign, never the canvas; `--fonts-delay`, `--sky-delay`, `--live`; `--shots DIR` a screenshot burst ≈ 10 fps;
`--log` the LOAD LOG's rows). Both it and the harbor `load` group read ONE probe: `tests/integration/kit/load-probe.mjs` — a frame record every
frame from the first paint to 6.5 s after the reveal (installed before the page mounts) + `judge()`: the four problems, each as frames. The
scene gained a cheap read for it — `window.__district.loadProbe()` (`shown`, `W`/`H`, `cams`: the camera now, the camera of the bake on
screen, the one fading out under it, whether the lit windows are at this camera).

**What each one turned out to be** (WebKit, the grey day; the same in Chromium):

1. **THE DOUBLED LETTERING** — `before-1-doubled-*.png`. With `--safari --bars late` (the bar shrinks 2.8 s after the reveal, back 2.6 s
   later): the dock + the tagline move with the bar. The scene's `maybeRelayout` forgives a DOCK move within 2 s of a resize ("the dock moved
   with the bars: the city kept" — it only updates `cam.dock`), but the TAGLINE's foot moved too (256 → 249) and that part was never written
   down as kept — the next check after the 2 s window (7.45 s) saw it as a new move and RE-LAID THE CAMERA (dock 778 → 704). From that frame
   the live layers (the wheel, the boats, the neon's lit tubes) and THE CRISP LAYER (every roof sign's lettering, the blade, the date stone)
   drew at the NEW camera at once, while the baked city stayed on the OLD one (`bake.js`: a re-plan keeps drawing the old canvases in the
   band they were baked for until the new bake swaps in — then a 1.2 s crossfade between the two cameras). Every sign twice, the copy a
   little LOWER (the new camera sits the city lower with the dock at 704), the wheel twice, OVERCL… cut, GRI / OCK split — for the whole
   re-bake + its crossfade (≈ 1–2 s in WebKit headless; on a phone at 3× the bake is sliced over many frames: "it stayed a while, then fixed
   itself"). The probe: 7–13 frames in WebKit, 60 in Chromium. The same path opens for ANY camera change after the reveal (a late font, a
   rotation, a resize with the bars); with no bar move it never happened (`--bars none|pre|fade|after`: 0 frames).
2. **THE CHUNKS** — `before-2-the-load-sheet.png`. The boot screen (`#boot`) leaves as soon as the stylesheets, the fonts (≤ 0.7 s) and the
   Harbor's MODULE are in (`app.js#dismissBoot`) — ~0.9–1.1 s — but the city reveals only when its first full frame is ready (~2.6 s). Between
   the two: the lit NEON sign, the tagline, the dock and the corner buttons over the black of the held canvas; then the city fades in under
   them (the sign + the dock at 100 % over a city at 47 % → 77 %…).
3. **THE #net PILL** — `before-3-net-pill-106ms.png` (the owner's "toggle": an empty glass pill + its pink dot). `components.css` gives
   `.net` `opacity: 0` with `transition: opacity .3s, transform .35s`. The four core sheets load `media="print"` → `all`; the moment
   components.css applies, the pill's opacity changes 1 → 0 — a TRANSITION, so it fades out over 0.3 s from fully visible; the inline
   `html:not(.css-ready)` rule hides it only until the LAST of the four sheets lands, which is in that same window. Seen at 61–99 % in
   WebKit (one frame at ~160 ms), 15 frames at 100 → 65 % in Chromium.
4. **THE STRAY SCREEN** — the same window as 2, seen whole: THE DARK TITLE (`before-4-dark-title-1251ms.png`) — the sign + the dock + the
   corners over pitch black for ~1.5 s, a third look between the boot screen (the purple sky + the unlit sign + STEPPING INSIDE) and the city.
   It "flashes up and fades" into the city. Not the route-change glitch (`glitchFlash` is skipped from the 'boot' route), not another route,
   not the bare shell's grid (0 frames each). And a near-miss for the fix: the boot screen's unlit sign sits ~30 pt LOWER than the title's —
   a cross-fade from one to the other would ghost the sign (the owner's "a ghost under SPEAKEASY").

**The failing checks** (the harbor `load` group, the `city` job — `loadFixChecks` in `harbor-e2e/city.mjs`; the REAL boot, 402×874 @3, the
bar before the reveal + 2.8 s after it, Safari's 100lvh): `THE LOAD FIX — 1 THE DOUBLED LETTERING` (one camera on screen in every frame),
`— 2 THE CHUNKS` (nothing of the title ahead of the city: ONE fade), `— 3 THE #net PILL` (never seen without a lost signal), `— 4 THE STRAY
SCREEN` (the boot screen → the city, nothing between). Before the fix: 15/19 — all four red.

## Group 2 — FIXED (at the causes)

1. **THE DOUBLED LETTERING** — two causes, both fixed:
   - **The bars no longer re-lay the city** (`scene.js#maybeRelayout`): a bar move keeps the city for ALL the title's rects — the dock AND
     the tagline's foot (`cam.tagBase`, the baseline the next check compares with) — so the check after the 2 s window finds nothing new;
     and a viewport size the resize handler hasn't seen yet (a timer can read the moved dock before WebKit's `resize` event) counts as the
     bars moving. With Safari's 100lvh the canvas never changes under the bars, so the city simply stays put: the dock + the sign are
     glass over it. (The repro: `the title's rects moved … layout` at 7.45 s → gone; only `the dock moved with the bars: the city kept`.)
   - **ONE CAMERA ON SCREEN** for every other camera change after the reveal (a rotation, a desktop resize, a late font):
     `scene.js#holdStart` holds the last frame AS SEEN over the city (`holdShoot`: every canvas of the layer composed in its stacking
     order, the crisp lettering + any framed layer mapped the way the resize pin shows the city — one consistent picture even mid-resize),
     the new camera bakes underneath (no crossfade under it, the first-bake slices), and `holdTick` CUTS to it in the frame that draws it
     (≤ `HOLD_MAX` 4 s). No dissolve: the first try faded the held picture out over 600 ms and the frames showed it — a dissolve between
     two cameras IS two copies. A ResizeObserver on the city's layer pins a box change before it paints (WebKit changed the box a frame
     before the window's `resize`: the canvas CSS-fitted, the crisp lettering not — the second copy 74 pt lower). The crisp layer itself
     already redraws on every geometry / dpr change (its `geo` key) and drops the old copy; it was the BAKE that kept the old camera.
   - **The ghost NEON** (the owner's "a ghost under SPEAKEASY", a grey day): the city paints THE SIGN's DARK HALO on the sky under the
     page's NEON + SPEAKEASY (DT1) — on an overcast sky a clear grey copy of the sign. Any time the city's picture is shifted under the
     still sign (the resize pin) it showed beside the real one: it is now drawn through the pin (`pinT`, the sign measured at the pin).
     And the boot screen's unlit sign sat 24 pt below the title's (14 on a short phone; smaller on desktop) — now on its spot to the point
     at 375 / 390 / 402 / 430 / 1440 (index.html `#boot` padding = title.css `.nd-sign`'s margin; SPEAKEASY at the title word's width).
   - A late reveal (`REVEAL_MAX`) waits ≤ 2 s more while the bake on hand stands at another camera (a slow phone's first picture would be
     doubled from its first frame); the title's own safety reveal 6 → 7.5 s (past it).
2. **THE CHUNKS** + 4. **THE STRAY SCREEN** (the same window): the boot screen now HOLDS until THE CITY's reveal (`app.js#dismissBoot` →
   `holdBoot` waits on `title.js#cityShown`, ≤ 9 s; the caller goes on at once — Firebase starts when it always did); under it the city
   reveals AT ONCE (`.nd-scene.is-now` + the scene's `revealInstant`: its own 0.6 s + 900 ms fades skipped) and the boot screen's 0.5 s
   fade is the ONE fade: boot screen → the whole title + its city. A title with no city (THE CITY COULDN'T LOAD) or one going away lets it
   go at once. The Harbor's module wait 8 → 30 s (past 8 s the bare shell's grid used to show on a slow network — another stray screen).
3. **THE #net PILL**: inline in index.html — `.net { opacity: 0 }` (the same specificity as its sheet: `.net.is-on` still wins) +
   `html:not(.css-ready) .net { transition: none !important }`: it starts at 0, so its sheet's arrival changes nothing to transition.

**The proof after the fix** (`after-the-load-sheet.png`, `before-after-1-doubled.png`, `after-first-visit-tap-to-enter.png`):
- `wk-load.mjs` — **32 / 32 loads clean** in WebKit 402×874 @3: day / grey / night × the bar before the reveal, as it fades in, 1 s
  after, 2.8 s after — with Safari's 100lvh (`--safari`) AND with the whole viewport changing (every re-layout then goes through the held
  picture: held 470–690 ms, then the cut); + warm loads (4), 390×844 + 430×932, a FIRST visit (`--fresh`: TAP TO ENTER over the city,
  day + night). Every load: boot screen → the whole title + its city in one fade; 0 doubled frames, 0 chunks, the #net pill never seen,
  nothing between. (The burst's first one or two frames are white in every run before and after: the page before its HTML has parsed —
  Playwright's, not the site's: the inline `html { background }` paints with the first parse.)
- The harbor `load` group: **19 / 19** (15 / 19 before — the four THE LOAD FIX checks now green; the older load checks unchanged).
- **No look change after the reveal:** `pixdiff.mjs --scenes night,party,noon,golden,dusk` against the pre-fix commit (4840553 on :5174):
  golden 0 px; the rest 35–757 px beyond the noise, all in the promenade band (the walkers — the usual residue).
- **The speed gate:** `title-perf.mjs --city 2 --ab` (np-night, np-party): **same** at t2 / t1 / t0 (the absolute numbers are this
  display-less machine's software compositing — warnings only). **The load timing:** the city is seen when it always was (the reveal
  ~2.6–3.0 s in headless WebKit, as before); the title's sign + dock now come WITH it instead of ~1.5 s ahead of it over black.

## Group 3 — the end

- **Locally (the mini PC; THE BUSY-PC CHECK first — nothing running but the emulators):** the unit suite 1242 / 1242 · the smoke test 6 / 6 ·
  CONN (`e2e-conn.mjs` — the boot was touched) green: 0 sockets parked, 1 in a room · the FULL `e2e-harbor` suite **1202 / 1206** at 4
  shards. The four reds, each re-run alone: `radio` (THE DESK's scroll through two refreshes), `newstart` ("the lines walk in under the lit
  sign", a 2.3-s sample) and `panel` (THE WORD TOWERS' readout) — **99 / 99 alone** (the 4-shard run's load); `roomperf`'s OWN COST at 4×
  CPU — the KNOWN red (THE SPEED PASS / B: red on this machine at the pre-pass commits too; skipped on the runner) — 39.3 → 47.6 ms again.
- **Cloud run 1** (148b1f7): tests ✅; harbor 12 / 15 jobs green. `holiday` — THE CLIMB HOME + ITS NERVES (the Halloween spiders): red in
  the last two harbor runs too (OC1, SHELL 2.0 B2) — not this pass, left as they were. Two NEW reds, both fixed for run 2:
  - `city` — LOAD WEATHER (kept on this device): a `bake crossfade · neon` right after a 1.8 s reveal. A race older than this pass, opened by
    TODAY's date (the page clock is pinned to 10 am; today's timetable shows a billboard HINT then): a neon re-layout rebuilds the roof board
    with its GAME and the hint came back ≤ 500 ms later (`boardSync`'s throttle) — a reveal inside that window showed the swap + its
    re-bake. Before the reveal the board is now checked EVERY frame (`scene.js#boardSync`), so the hint is in the bake the reveal waits for.
  - `lobbyfix` — newstart's "the lines walk in UNDER the lit sign (the host at 2.3 s: wait)" (red in the local 4-shard run too, green
    alone). Measured: the host's first step at ~1.45 s on the pre-fix build AND now (two runs each, :5174 vs :5173) — not this pass; a
    FIXED-TIME sample on a slow runner. Now a condition (green means green): the host walks (or is in) before the fade, the sign lit then.
- **The rules:** NOT changed — nothing to re-publish.
- **Not started (FRIENDS' list, as the pass said):** THE TIER GEM's one shape, THE RADIO's schedule order, the victory sounds, YOUR CARD's
  row + the whole XP box, the console's game accent, the intercom in sync.

**Known issues** (also docs/harbor.md KNOWN ISSUES):
- A camera change after the reveal (a desktop window drag, an iPad turned, a late font) holds the picture still — the motion pauses
  ~0.5–0.7 s in headless WebKit — then cuts to the new camera. Safari's bar never causes one now.
- The bars are EMULATED (the window's height + a pinned 100lvh) in Playwright's WebKit; the real Safari bar is the owner's iPhone's to confirm.
- `roomperf`'s 4× own cost (the known red above). THE TV IS OFF (no display): the speed numbers are software compositing — the A/B said "same".
