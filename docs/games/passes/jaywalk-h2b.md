# JAYWALK H2B — THE CAMERA + THE LOOK — Nov 16 2026

The plan: docs/games/plan.md "JAYWALK (the owner, Nov 16 — DECIDED, after H2 on his phone)" (Step 0, `9c10354b`). The reference:
docs/jaywalk.md ("THE CAMERA" · "THE NIGHT LOOK" · "THE LAB"). On the mini PC. **THE RULES DID NOT CHANGE** — camera + drawing only: the
engine, the replay, the 9 playable columns, the hit boxes untouched (REPLAY = LIVE green). No rules-file change, no `/api` change, no boot
file touched. JAYWALK IS NOT PLAYABLE (THE ONE SWITCH stays off).

The live preview (**OPEN since this pass** — no gate, zero server calls; noindex, unlisted, no room, no database writes):
**https://neonspeakeasy.com/jaywalk-lab.html** · `?fps=1` · `?gray=1`.

## Group 0 — THE START
- `node scripts/lab-export.mjs https://www.neonspeakeasy.com` (a read): 222 marks, 0 open FIX. THE ADD-ON INBOX: nothing addressed to
  JAYWALK (read at the start, after each group's commit, before the final tests).
- **H2's cloud** (`a69f5502`): `tests` green (6 m 18 s); the `harbor` workflow skipped on purpose (a ci tag — a game pass). Nothing red to fix.

## Group 1 — THE CAMERA (`6378923a`) — `js/games/jaywalk/camera.js`, ONE pure module for the night look + the graybox
What it is: docs/jaywalk.md "THE CAMERA". The numbers:
- **ZOOM 7 · 8 · 9 = the columns across the screen at the kid's row, default 8.** H1's proven rig (16 up / 12 back) scaled about the kid.
- **THE SIDEWAYS FOLLOW**: eased (140 ms), a hop led to where it lands, a log ride followed; clamped ONE column past the play area's edge
  (the follow slides 2 · 1.5 · 1 columns at ZOOM 7 · 8 · 9). Measured in a real page: the kid 19 % / 81 % across at the play edges
  (ZOOM 8); a log ride of ~2 columns — his place on the screen moved 0.2 % of the width over 90 frames, 0.02 % at most in one (no lag,
  no jitter).
- **THE TURN: `TURN_DEG` = 12** (the one tuned constant) — the camera 12° round the kid, to his right: "up the course" runs up + a little
  right, the lanes fall 9.7° to the right on the screen, the cars' sides show. ANGLE STRAIGHT · TURNED, default TURNED.
- **THE FRAMING**: the kid 62.0 % down the screen at every zoom + every screen shape; 4 lanes seen behind him above the lab's own rows
  (3–4 above a real match's foot fade, ≈ 6 to the screen's very foot); ≈ 12 lanes ahead; the lane count over the skyline.
- **The kid's measured height at 390 × 844: 46.5 pt at ZOOM 7 · 39.0 pt at ZOOM 8 (39–40 with his idle bob) · 35.7 pt at ZOOM 9** (H2:
  27 pt at WIDTH 11). 402 × 874: 40 pt · 430 × 932: 43 pt · 1440 × 900 (the phone-shaped play area, 558 wide): 56 pt.
- The lab: ZOOM + ANGLE as neon-underline tabs in the row above the modes (remembered — `jw:lab:zoom` / `jw:lab:angle`; `?zoom` /
  `?angle` for a link); the WIDTH 9 · 11 switch retired; SOUNDS moved to the top left corner (the row is full at 390, and it is off the
  play there); `?gray=1` follows the same camera (it shows the ZOOM / ANGLE row too).

Named calls (obvious / established — no owner decision needed):
- **The lens is fitted to the screen's WIDTH, both ways** (H2 only widened it for a narrow screen): ZOOM 8 is 8 columns in Safari with its
  bars, in the home-screen app and on a desktop's phone-shaped stage alike — a shorter screen sees fewer lanes ahead, never smaller
  columns. (H2 held the vertical fov: on an iPhone in Safari its "11" was ≈ 14 columns across — part of why it read too far away.)
- **The kid sits 62 % down** (H2: 65 %) — inside the brief's 60–65 %, and it buys the 3–4 lanes behind him at the closer zoom.
- **The turn's side**: the camera to the kid's RIGHT (forward = up + a little right, the lanes fall to the right). One sign in
  `camera.js#TURN_DEG` flips it if the owner wants the other diagonal.
- **THE WIDER VIEW's 11-column mode is gone**, not kept as a fourth zoom: the brief retired the switch; the dim edge column stays (the
  follow shows it at the play edges; the far rows always show it).
- The skyline band: level in both angles (a yaw, never a roll); its picture slides against the follow and sits a step over when turned.

## Group 2 — THE LOOK FIXES (`6378923a`)
- **THE WATER** reads as water: a deep teal / blue surface (was near-black), slow ripples + bright crests, the skyline's neon in brighter
  wobbling streaks, **a bright wavering shoreline** + a pale shallow wherever it meets land / road / rail; each log's amber glow stronger
  + a soft pale wake behind it.
- **THE KID ALWAYS STANDS OUT**: a soft pool of his colour on the ground + a ring round his feet (breathing — never with reduce motion)
  + a rim light of his own (his colour pulled half-way to white). Checked: a cyan kid beside cyan cars at lane 229 (the shots).
- **THE BOX TRUCK** (the 3-cell vehicle), built in code: a rounded cab in the truck's colour with dark glass, a long white box + its
  stripe, a chassis, six wheels, a bumper, four amber markers along the foot of its side, lit tail lights. Never the van + a bare box.
- **THE PROPS**: the crates are out. **A finding:** the "pale purple cubes" were not crates — they were Kenney's jersey BARRIER seen from
  above (a pale block at phone size). So the barrier is now **THE BARRICADE**, built in code (two orange / white striped boards on dark
  legs + an amber lamp) — it reads as a barricade at 390. Kept: the planters, the cones, the dumpster, the lamps + their pools. The scene
  fetches 10 of Kenney's 12 models (the crate + the barrier stay in the folder, unfetched — H5's DOCKS may want them).
Three refine passes on the shots (Downloads\NEON\jaywalk-h2b\ — out of git):
1. the first camera + look: the framing, the turn, the water, the truck — right; the kid washed out by his own rim; a pale cube still on
   the grass; the truck's amber markers read white on the white box.
2. the rim halved + tighter (he keeps his own colours), the ring a touch softer; THE BARRICADE replaces the barrier; the markers moved
   to the foot of the box (amber on dark) + a wider stripe.
3. the look shots' own kid no longer blinks out of a shot (a warp's blink); the lab's row at 390 (ZOOM · ANGLE fit in one row, 44 pt
   each; SOUNDS in the corner); 402 / 430 / 1440 × 900 checked.

## THE ADD-ONS (the owner, typed into the pass — Nov 16 10:55 · 10:56 · 11:22; all three built, commit `fbef7540`)
**THE LOGS MUST LOOK LIKE LOGS + THE WATER LIKE WATER** (10:56 — into Group 2's look fixes; all built in code, no sourced model / texture):
- **THE LOGS** (`models.js#buildLog(len)` — they were "glowing orange pills"): ONE geometry a length (2 · 3 · 4 cells — nothing stretched):
  a round trunk with a slight irregular wobble; brown bark with darker furrows along it (vertex colours, a strip = one colour); **light cut
  ends with tree rings, sawn on a slant** so the pale ringed faces are seen from the camera above (a flat end would be edge-on); a stub of
  a cut branch on the 3- and 4-cell logs; a little moss on ~45 % (the seed — its own instanced piece); rough wood, never glossy. **The
  amber at night is now ONLY a thin underglow at the waterline + a soft light on the water** — the bright edge lines + the glowing end
  caps (the pill) are gone; the wood stays visible. They bob + ROCK gently (never with reduce motion); a pale wake + a ripple ring that
  swells behind the tail.
- **THE WATER**: on top of Group 2's teal surface / crests / reflections / shoreline — the surface now drifts on GENERATED NOISE (no
  texture file) + **little sparkles of light** twinkle on it (top two tiers).
- Shots: `logs-before-*.png` → `logs-after-water.png` · `logs-after-water-straight.png` · `logs-after-log-ride.png`.
**CAR LIGHTS** (10:55 — the last group): each car cast ONE beam + ONE tail glow, centred on the lane — lopsided once the camera turned.
- **BOTH headlights cast a beam, BOTH tail lights a red glow**, each at its lamp's own place on the model — `night.js#LAMPS` ([half the
  lamps' spacing, their height] for the sedan / hatchback / taxi, the van, THE BOX TRUCK, the train's front + its rear).
- **Shorter + softer**: a headlight's glow is gone within `HEAD_REACH` 1.35 cells (was a 2.6-cell beam at 0.62; now 0.5, soft-edged — the
  glow shader's new shape 6: a quick falloff); a tail light's within `TAIL_REACH` 0.75 (was a 1.5-cell pool). The train: two beams, a
  little longer (2.2 cells — was ONE 6.6-cell spotlight), two red glows at its rear. Still instanced quads: no real light.
- Shots: `lights-before-*.png` → `lights-after-run.png` · `lights-after-lane200.png` · `lights-after-train.png`.
**OPEN THE JAYWALK LAB** (11:22 — the owner's brother tests it on his own phone from a shared link):
- **The owner gate is gone**: `lab.js` no longer loads Firebase, signs in or calls `/api/admin whoami` — it simply mounts. **ZERO server
  calls** (measured in a fresh browser: every request = the page's own files, three.js from its CDN, the fonts; none to `/api`, Firebase
  or a sign-in). Still `noindex, nofollow`; still UNLISTED (a unit test greps every page, the manifest, the worker, vercel.json and the
  game's own code: nothing links to it); no room, no database write of any kind. Everything on it stays (SOLO · MATCH · DAILY, ZOOM,
  ANGLE, SOUNDS, NEW SEED, `?fps=1`, `?gray=1`).
- Two things named honestly: (1) the SHARED audio engine reports an audio cut only from the owner's phone inside the app (`body.rd-owner`)
  or on a link carrying `&debug=1` — the lab DROPS that flag from its own address before the engine is installed, so a shared link can
  never make it report; (2) THE SKEW WRAPPER (the standing rule for every dynamic import) asks the deploy's id (`GET /api/time`) ONCE if
  a module ever FAILS to link — a failure path only, never in a page that loads.
- A browser with no WebGL: the stage + one line ("can't draw the game here") — never a blank page, never a door.
- THE PAGES LOAD: `/jaywalk-lab` = the stage, no door, no page error (Chromium + WebKit). `tests/jaywalk-lab.test.mjs` "THE LAB IS OPEN".
- What "open" means for the owner: ANYONE with the link can play the preview (it is a game being built: no account, no score, nothing
  saved, nothing sent). The kid's colour is read from this browser's own saved profile if there is one, else cyan.

## Group 3 — THE CHECKS
- `tests/jaywalk-camera.test.mjs` (new, 6): the numbers · ZOOM columns across + the kid 62 % down on six screen shapes × 3 zooms × 2
  angles · 3–4 lanes clear behind him · the follow's clamp, its ease, a log ride's steady lag, a far jump's snap · the turn about the kid,
  swipes screen-relative · ONE pure camera (no three.js / DOM / clock; both views use it; the rules never know it) · THE AUTOMATIC TIER
  STEP on the kit's rule. `tests/jaywalk-night.test.mjs` (+ H2B's look fixes) + `jaywalk-lab.test.mjs` updated (the WIDTH switch retired).
- `tests/integration/jaywalk-lab.mjs`: **112 checks** with `--webkit` (**122** with `--perf --webkit`) — THE LAB IS OPEN (a stranger gets
  the lab; ZERO server calls; a `&debug=1` link dropped) · each ZOOM + both ANGLES render, the columns across, the kid's height per zoom ·
  the follow at both play edges (straight + turned, every zoom) + a log ride · 3–5 lanes seen behind him · the HUD off the play · every
  tap acts · the bot's whole run → REPLAY = LIVE · the sounds + the audition · `?gray=1` on the same camera · 402 / 430 / 1440 × 900 (8
  columns across on each) · WebKit as an iPhone · `--perf`: the six rows, a screenshot's own hitch, THE AUTOMATIC STEP. The shots (out
  of git) → the folder `jaywalk-h2b` in Downloads / NEON (z8-turned-start / -run / -water / -log-ride / -train-* / -lane200-* /
  -blackout, z7-, z9-, z8-straight-*, open-390x844, the add-ons' before / after).
- **MEASURED** (390 × 844 @3, ZOOM 8 TURNED, the bot playing, 15 s a row, a tier pinned with `?tier=`; headless Chromium on the mini PC's
  Radeon, nothing else busy — the owner's iPhone is the real test: `?fps=1`):

| tier | canvas | CPU | fps | frame ms (p95 / worst) | work ms (median / p95) | draw calls | triangles |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 (+ the bloom) | @3 | 1× | 59.9 | 16.7 (17.2 / 17.7) | 1.4 / 2.0 | 25 | ~137 k |
| 2 (+ the bloom) | @3 | **4×** | **59.9** | 16.7 (16.8 / 16.9) | 5.9 / 7.7 | 25 | ~137 k |
| 1 | @2 | 1× | 59.9 | 16.7 (17.2 / 17.9) | 1.0 / 1.5 | 20 | ~131 k |
| 1 | @2 | **4×** | **59.9** | 16.7 (16.8 / 16.9) | 3.0 / 5.1 | 20 | ~136 k |
| 0 | @1.5 | 1× | 59.9 | 16.7 (17.2 / 17.9) | 0.9 / 1.4 | 19 | ~132 k |
| 0 | @1.5 | **4×** | **59.9** | 16.7 (16.8 / 17.0) | 2.8 / 4.6 | 19 | ~127 k |

  0 frames over 33 ms in every row. This is the FINAL build (the three add-ons in). Before the add-ons (the camera + Group 2 alone):
  the same 59.9 everywhere, 23 / 18 calls, ~125 k triangles, work 5.4 / 7.3 ms at tier 2 under 4× — the new logs cost ≈ 12 k triangles +
  3 draw calls, the second beam / glow per lamp ≈ 0.5 ms of work at 4×. H2 at WIDTH 11: 25 calls, ~124 k, work 4.4 / 6.8.

- **THE TIER STEP — what H2's shots showed, and what the rule does.** **H2's shots read "49–54 fps · worst 217–250 ms · tier 2" and no step down.
  That was the SHOT, not the page — and the rule was right not to step:**
  - Measured (`HITCH`): a quiet 8 s at tier 2 has a worst frame of **17.7 ms**; ONE screenshot at @3 stalls the page **250 ms**; a restart
    + a warp 17.2 ms. The readout shows the mean of its last 120 frames + their worst: 119 × 16.7 + one 250 ms = 18.6 ms = "54 fps · worst
    250" — exactly what the shots said. Every look shot is taken right after the one before it.
  - The rule reads the **p75** of the frame times (> 19.5 ms steps down): one long frame in 120 never moves it — by design (a real
    phone hitches on a notification too). `tests/jaywalk-camera.test.mjs` pins it: a 250 ms frame every 120 → no step.
  - **And when frames really slip, it steps** (`STEP`): nothing pinned, the CPU throttled 12× → p75 50.2 ms → **tier 2 → 1 → 0 by itself**
    (the path is now kept on the page: `state().tierPath`, and `?fps=1` prints it — "tier 2→1→0" — so the owner's phone shows what the
    steps did). On synthetic phones (the unit test): a GPU-bound phone (33 ms at tiers 2 + 1, light CPU work) walks 2 → 1 → 0 and stays; a
    phone one step helps stays at 1; a slow CPU ends at 0; a true 30 Hz cap (iOS Low Power Mode) ends back at the top — the kit's rule,
    unchanged.
  - A wrong turn of my own, named: I first read the kit's cap probe as a hole for a GPU-bound phone and added a deeper probe; the unit
    test I wrote for it showed the plain rule already walks down (its 2.5 s cool-down is shorter than the probe's 4 s) — the change was
    taken out again. `js/games/kit/tiers.js` is untouched.
  - **Nothing was real, so nothing in the rule was changed.** The owner's iPhone remains the real test: `?fps=1`.

## Group 4 — THE CLOSE
docs/jaywalk.md (THE CAMERA — new; the night look, the kid, the assets, the lab, real vs placeholder, the index) · this log ·
docs/testing.md "JAYWALK H2B" · ROADMAP · CLAUDE.md (the JAYWALK look line names the camera — no new line) · docs/games/plan.md (Step 0).
Builders: file hashes; the preload graph (unchanged: the cartridge's view is still the stub; no boot file touched).

## THE FINAL LOCAL RUN (my own emulators + `DAILY_TEST=1 scripts/serve.mjs 5173 --emu`, the mini PC — NEVER THE LIVE SITE)
unit **2088 / 2088** (registration + cartridge inside it) · rules **83 / 83** · `/api` server **63 / 63** + progression **10 / 10** · smoke
**20 / 20** (THE PAGES LOAD: the six pages × Chromium + WebKit — `/jaywalk-lab` now the open lab's stage) · e2e-daily **95 / 95** · wk-press
**43 / 43** · harbor `ONLY=cartridge,neon` **42 / 42** · jaywalk-lab **112 / 112** with `--webkit` (**122 / 122** with `--perf --webkit` on
the quiet machine — the table above; that measure ran before the lab was opened: its first section was still the door's, the same 119 +
the open lab's 3 more).
- The order (H1's lesson): the server as `DAILY_TEST=1`, rules → `/api` → smoke → e2e-daily BEFORE wk-press → the harbor groups → the lab.
- Wrong reds of my own making, fixed before any of this: three unit asserts that pinned a COMMENT's words (the tests read the code without
  its comments); a camera method named `set(` tripping the no-writes grep (→ `choose(`); an edit script whose match text was off by a word.
- My servers (the emulators + `serve.mjs` on :5173) stopped at the end; :5190 was not running when the pass started and was left that way.
- No rules change, no `/api` change, no boot file touched (THE BOOT PRELOAD + the preload graph rebuilt: unchanged).

## REAL vs PLACEHOLDER
REAL: everything H2 called real + THE CAMERA (zoom, follow, turn, framing), THE WATER, THE LOGS, the kid's glow ring + rim, THE BOX TRUCK,
THE BARRICADE, the lamps (two per end, short + soft). PLACEHOLDER (unchanged): THE BLACKBIRD + THE UFO (before H6); the end screens' words; the match screen (the stub — H4); the
sounds' levels + the eight sounds not yet in play; every tuning number; the day look (H5); the tile, the boards, HOW TO PLAY.

## KNOWN / FOR THE NEXT PASSES
- **The owner's phone decides**: ZOOM 7 · 8 · 9 + ANGLE on the lab → the default is one line each (`camera.js#ZOOM`, `#ANGLE`); the
  turn's side + size = `TURN_DEG`. Once he has picked, the lab's switches can go (H3 / H4 use the camera as it is).
- The kid is still drawn 1.3 × a lane's unit (H2's call for WIDTH 11): at ZOOM 8 he is 39 pt — if he reads too big beside the cars,
  `night.js#KID_S` is the one number.
- H4: the night look + this camera into the real match view (`view.js`) — `createNight` renders purely from (run, course).
- PRE-EXISTING, outside JAYWALK (named in H2's log): e2e-profiles hangs at its CIPHER podium step; e2e-playnow `lost`: the shelf never opened.
